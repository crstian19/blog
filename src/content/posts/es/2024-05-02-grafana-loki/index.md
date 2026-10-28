---
title: 'Loki para logs: modos de despliegue, etiquetas y retención'
description: 'Cómo funciona Loki por dentro, qué modo de despliegue elegir según los GB al día, por qué la cardinalidad de etiquetas lo es todo y cómo configurar la retención en Loki 3.x.'
pubDate: 2024-05-02
updatedDate: 2026-10-27
cover: assets/portada-loki.png
tags:
- Loki
- grafana
- logs
- alloy
- logql
- kubernetes
- monitoring
- k8s
---

Loki es la base de datos de logs de Grafana. Lo que la hace distinta de Elasticsearch u OpenSearch es que no indexa el contenido de los logs, solo las etiquetas (labels, al estilo de Prometheus). El texto de cada línea va comprimido en chunks a un object storage (S3, GCS, Azure, MinIO o disco local) y el índice se queda en una fracción de lo que ocupan los logs.

Eso tiene un precio: si buscas por algo que no es una etiqueta, Loki tiene que descomprimir y recorrer todos los chunks del rango de tiempo que pidas. Casi todo lo que hay que saber para que Loki vaya bien sale de ahí, así que en este post vamos a ver como está montado por dentro, qué modo de despliegue elegir, qué etiquetas poner (y cuáles no) y como configurar la retención. Todo referido a Loki 3.x.

## Como funciona por dentro

![Componentes de Loki: distributor, ingester, querier, query frontend, ruler y compactor](assets/loki_architecture_components.svg)

Hay dos caminos, el de escritura y el de lectura.

En la escritura, el agente que recoge los logs (hoy Grafana Alloy, ahora lo vemos) los manda al **distributor**. El distributor valida cada stream (etiquetas correctas, límites de tamaño y de rate) y lo reparte entre varios **ingesters** usando un hash ring. Los ingesters van acumulando las líneas de cada stream en chunks en memoria y, cuando un chunk se llena o pasa cierto tiempo, lo comprimen y lo suben al object storage. Como cada stream se escribe en varios ingesters (el `replication_factor`, normalmente 3), si se cae uno no se pierde lo que tenía en memoria.

En la lectura, la query en LogQL llega al **query frontend** (opcional), que la parte en trozos más pequeños por tiempo y los mete en una cola. Los **queriers** cogen esos trozos y los ejecutan en paralelo, preguntando a los ingesters por lo más reciente (lo que aún no se ha subido) y al object storage por lo demás. Al final deduplican las líneas que tengan el mismo timestamp, etiquetas y contenido, que salen repetidas por la replicación.

Luego hay tres piezas más que conviene conocer:

- **Compactor:** compacta los ficheros de índice y es el que aplica la retención y los borrados. Si no lo activas, Loki no borra nada nunca.
- **Ruler:** evalúa reglas de LogQL cada cierto tiempo, para alertas sobre logs o para generar métricas a partir de ellos (recording rules).
- **Index gateway:** sirve el índice a los queriers para que no tenga que bajárselo cada uno. Solo tiene sentido en despliegues grandes.

## Qué modo de despliegue elegir

Loki es un único binario y el flag `-target` decide qué componentes arranca cada proceso. Con eso hay tres formas de desplegarlo:

| Modo | Qué es | Para cuánto volumen |
|---|---|---|
| Monolítico | Todo en un proceso (`-target=all`) | Hasta unos 20 GB al día según la documentación, y se puede poner en HA con varias réplicas |
| Simple scalable (SSD) | Tres grupos: read, write y backend | Hasta cerca de 1 TB al día, pero está **deprecado** |
| Microservicios | Cada componente por separado (`deploymentMode: Distributed` en el chart) | Lo que recomienda Grafana para producción a escala |

Lo del simple scalable es importante si vas a montar algo nuevo: la documentación de Loki 3.x dice que se va a quitar en Loki 4.0 y que no se podrá arrancar en ese modo. Lo que proponen para sustituirlo en la mayoría de casos es el monolítico en HA, que es el monolítico con varias réplicas, un object storage compartido y `memberlist` para que se repartan el ring.

Yo lo haría así: para un homelab o un cluster pequeño, monolítico con una réplica y disco local o MinIO, que es lo que instala el chart de Helm por defecto (`deploymentMode: Monolithic`). Si necesitas que aguante la caída de un nodo, monolítico con 3 réplicas y object storage. Y solo cuando pases de las decenas de GB al día me plantearía microservicios, porque son unos 8 deployments distintos que escalar y vigilar.

## Las etiquetas: la decisión que más importa

Cada combinación única de valores de etiquetas es un **stream** distinto, con su propio índice y sus propios chunks. Si una etiqueta tiene muchos valores posibles (alta cardinalidad), multiplicas el número de streams, los chunks salen pequeños y medio vacíos, el índice crece y tanto la ingesta como las queries van peor. Es la causa más típica de un Loki lento o caro.

La regla práctica: etiqueta solo lo que tiene pocos valores y por lo que vas a filtrar siempre.

```text
Buenas:  cluster, namespace, app, job, env, level
Malas:   pod, container_id, request_id, trace_id, user_id, IP, código HTTP
```

`pod` es la que más se cuela, porque viene por defecto en muchas configuraciones. Cada despliegue genera nombres de pod nuevos y, con eso, streams nuevos. Para buscar un pod concreto te basta con un filtro de texto:

```logql
{namespace="default", app="immich"} |= "immich-server-abc123"
```

Y si necesitas un campo de alta cardinalidad a mano (un `trace_id`, por ejemplo), Loki 3 tiene **structured metadata**: pares clave-valor que van pegados a cada línea pero no crean streams. Con Alloy se haría así:

```alloy
loki.process "default" {
  stage.json {
    expressions = { "trace_id" = "" }
  }

  stage.structured_metadata {
    values = { "trace_id" = "" }
  }

  forward_to = [loki.write.local.receiver]
}
```

Luego lo filtras en la query como cualquier otro campo: `{app="api"} | trace_id="abc123"`.

## Mandar los logs: de Promtail a Alloy

Si tienes Promtail, toca migrar. Grafana movió su código a Alloy, lo marcó como deprecado en Loki 3.x y llegó a fin de vida el 2 de marzo de 2026: ya no hay actualizaciones. Alloy trae un comando para convertir la configuración de Promtail a la suya (`alloy convert --source-format=promtail`), así que la migración suele ser rápida.

Lo bueno de Alloy es que puedes filtrar antes de mandar nada, y eso es lo que más baja el volumen. En mi cluster de casa (mew) mandaba los logs de todos los pods a Grafana Cloud y medí unos 2,45 GB al día, con un límite de 50 GB al mes. Al ritmo que iba, me lo comía en menos de 3 semanas. Lo primero que hice fue tirar en Alloy las líneas que no aportan nada (health checks, peticiones que acaban en 2xx, logs de debug) y quedarme solo con una muestra de las apps más pesadas:

```alloy
loki.process "pod_logs" {
  forward_to = [loki.write.grafana_cloud.receiver]

  // Health checks y endpoints de métricas
  stage.match {
    selector = "{job=~\".+\"} |~ \"GET /(health|healthz|ready|readyz|livez|metrics|ping)\""
    action   = "drop"
  }

  // ArgoCD: me quedo solo con el 20 % de las líneas
  stage.match {
    selector = "{app=~\".*argocd.*\"}"

    stage.sampling {
      rate = 0.2
    }
  }
}
```

<!-- TODO Cristian: cuánto bajó el volumen al día después de aplicar los filtros (el plan estimaba ~0,35-0,50 GB/día, pero no tengo el dato medido). Y si llegaste a quitar `pod` de las etiquetas (en la config de mew/offline/alloy sigue puesta), dilo aquí. -->

Para saber qué filtrar primero, esta query te dice qué apps generan más líneas en las últimas 24 horas:

```logql
topk(10, sum by (app) (count_over_time({namespace=~".+"}[24h])))
```

## Retención: el compactor

Por defecto Loki no borra nada. Para que lo haga hay que activar la retención en el compactor y decir cuánto tiempo guardar en `limits_config`. Con el schema actual (TSDB y `v13`, que es el que necesitas para structured metadata) quedaría así:

```yaml
schema_config:
  configs:
    - from: "2024-04-01"
      store: tsdb
      object_store: s3
      schema: v13
      index:
        prefix: loki_index_
        period: 24h

limits_config:
  retention_period: 672h # 28 días

compactor:
  working_directory: /loki/retention
  retention_enabled: true
  delete_request_store: s3
```

Dos cosas que conviene saber: el periodo del índice tiene que ser de 24h para que la retención funcione, y el compactor no borra al momento, sino que marca los chunks y los elimina pasado `retention_delete_delay` (2 horas por defecto). Si tu object storage ya tiene sus propias reglas de ciclo de vida (las lifecycle policies de S3, por ejemplo), pon un plazo mayor que el de Loki o borrarás chunks que el índice todavía cree que existen.

## Unas queries de LogQL para empezar

LogQL se parece a PromQL: primero eliges streams por etiquetas y luego filtras o parseas el contenido.

```logql
# Errores de una app, buscando en el texto
{namespace="default", app="immich"} |= "error"

# Parsear JSON y filtrar por un campo
{app="api"} | json | status >= 500

# Líneas de error por minuto y por app, como una métrica
sum by (app) (count_over_time({namespace="default"} |= "error" [1m]))
```

La última convierte logs en una serie temporal que puedes poner al lado de las métricas de Prometheus en el mismo panel.

<!-- TODO Cristian: hoy mew ya no usa Loki, los logs van con Vector a VictoriaLogs (mew/cluster/vector y mew/cluster/vlogs). Si quieres, añade un párrafo con por qué cambiaste. -->
