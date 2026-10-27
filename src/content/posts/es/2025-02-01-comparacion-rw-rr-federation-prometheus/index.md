---
title: 'Remote Write, Remote Read y Federation en Prometheus: cuál usar'
description: 'Cómo mover métricas entre Prometheus con remote_write, remote_read y /federate: configuración real, qué pasa cuando el destino cae y cuándo elegir cada uno.'
pubDate: 2025-02-01
updatedDate: 2026-10-27
tags:
- Prometheus
- VictoriaMetrics
- monitoring
- kubernetes
- k8s
---

En cuanto tienes más de un Prometheus (uno por cluster, uno por entorno, o uno local y otro para guardar histórico) te toca decidir como llegan las métricas de uno a otro. Prometheus trae tres formas de hacerlo: remote write, remote read y federation. Se parecen en el nombre pero funcionan muy distinto, sobre todo en quién empuja los datos, dónde acaban guardados y qué pasa cuando algo se cae.

En este post vamos a ver como se configura cada una, con qué hay que tener cuidado y cuándo me quedo con cada una.

## Remote Write: el origen empuja

Con `remote_write` el Prometheus que hace el scrape manda cada sample a otro sistema en cuanto lo escribe en su WAL (el write-ahead log, el fichero donde apunta todo antes de guardarlo en bloques). El destino puede ser otro Prometheus con el receptor activado (`--web.enable-remote-write-receiver`), Thanos Receive, Mimir, Cortex o VictoriaMetrics.

Una configuración que filtra antes de enviar sería esta:

```yaml
remote_write:
  - url: https://metrics.example.com/api/v1/write
    name: central
    basic_auth:
      username: prometheus
      password_file: /etc/prometheus/remote-write-password
    # Solo mandamos lo que nos interesa guardar a largo plazo
    write_relabel_configs:
      - source_labels: [__name__]
        regex: 'go_.*|process_.*|scrape_.*'
        action: drop
      - regex: 'pod_template_hash|controller_revision_hash'
        action: labeldrop
    queue_config:
      capacity: 10000
      max_shards: 50
      min_shards: 1
      max_samples_per_send: 2000
      batch_send_deadline: 5s
      min_backoff: 30ms
      max_backoff: 5s
```

Los valores de `queue_config` son los de por defecto. Cada destino tiene su propia cola, que lee del WAL y reparte los samples entre varios shards (conexiones en paralelo). Prometheus va calculando cuántos shards necesita según lo que entra y lo que tarda en enviar, así que normalmente no hace falta tocarlo. Si el destino va lento, lo primero que yo subiría es `max_samples_per_send` antes que `max_shards`, porque menos peticiones más grandes suelen aguantar mejor que muchas pequeñas.

Lo de `write_relabel_configs` es lo que más se nota en la factura. Se aplica después del scrape y solo afecta a lo que se envía, en local sigues teniendo todo. Quitar las métricas internas de Go y los labels que cambian en cada despliegue (como `pod_template_hash`) baja bastante la cardinalidad en el destino.

<!-- TODO Cristian: si tienes una cifra real de cuántas series o cuánto tráfico te ahorraste filtrando con write_relabel_configs, este es el sitio. -->

### Qué pasa si el destino se cae

Esto es lo que hay que tener claro antes de montarlo. Cuando el destino no responde, Prometheus reintenta con backoff y deja de leer del WAL para ese destino, pero no pierde nada mientras los datos sigan en el WAL. El problema es que el WAL se compacta cada 2 horas: **si el destino está caído más de ~2 horas, lo que no se haya enviado se pierde**. No lo vas a ver en ningún error del destino, simplemente habrá un hueco en las gráficas.

Para vigilarlo, en el Prometheus de origen tienes estas métricas:

```promql
# Cuánto va por detrás el envío, en segundos
prometheus_remote_storage_highest_timestamp_in_seconds
  - ignoring(remote_name, url) group_right
    prometheus_remote_storage_queue_highest_sent_timestamp_seconds

# Samples que se han descartado o han fallado
rate(prometheus_remote_storage_samples_failed_total[5m])
rate(prometheus_remote_storage_samples_dropped_total[5m])
```

Una alerta sobre el primer valor, por ejemplo cuando pasa de 10-15 minutos, te da margen de sobra antes de llegar a las 2 horas.

Otra cosa a tener en cuenta: Prometheus solo reintenta en errores 5xx. Si el destino responde 4xx (labels inválidos, samples fuera de orden, límite de tenant) esos samples se tiran sin reintentar, y lo único que verás es que sube `samples_failed_total`.

### El coste en red

Cada sample viaja comprimido con snappy en protobuf, pero viaja todo lo que pase el filtro, cada vez que se hace scrape. Con miles de series cada 15 segundos son muchas peticiones continuas, y si el destino está en otra región o en un proveedor que cobra salida de tráfico, se nota. Por eso el filtrado con `write_relabel_configs` no es opcional en cuanto el volumen crece.

### Cuándo lo uso

Remote write es lo que tiene más sentido para centralizar métricas de varios clusters en un sitio o para guardar histórico largo fuera de Prometheus. Si el Prometheus de origen solo existe para hacer scrape y enviar, ni siquiera hace falta que guarde nada en local: Prometheus tiene un modo agent (`--agent`) que desactiva las consultas, las reglas y el almacenamiento local, y se queda solo con el WAL y el remote write. Para lo mismo también están Grafana Alloy y vmagent de VictoriaMetrics. vmagent además guarda en disco lo que no ha podido enviar, sin el límite de 2 horas del WAL, que es justo lo que le falta a Prometheus.

En mi caso, en el cluster de casa tengo dos VictoriaMetrics separados. `vmetrics-short` hace el scrape de todo y guarda 30 días, y `vmetrics-long` no hace scrape de nada: solo recibe escrituras (Home Assistant y los datos de Fitbit) y guarda 10 años. Así lo que quiero guardar de verdad no se mezcla con las métricas de los pods, que a los 30 días ya no me interesan.

## Remote Read: el destino pregunta

Con `remote_read` es al revés: el Prometheus local no envía nada, y cuando haces una consulta pregunta también a un almacenamiento remoto y junta los resultados con los suyos.

```yaml
remote_read:
  - url: https://metrics.example.com/api/v1/read
    name: historico
    # Solo pregunta al remoto si la consulta lleva este label
    required_matchers:
      source: historico
    # No pregunta al remoto por rangos que el local ya tiene completos
    read_recent: false
    remote_timeout: 1m
```

`read_recent: false` (el valor por defecto) hace que solo se consulte el remoto para la parte del rango que no cubre el almacenamiento local, y `required_matchers` hace que las consultas que no llevan ese label ni lo toquen. Sin esto cada panel de Grafana acaba yendo al remoto aunque no le haga falta.

El problema de remote read es que todo el trabajo cae en el Prometheus que consulta: el remoto le devuelve samples en crudo y es él quien hace el cálculo. Con rangos largos o consultas con mucha cardinalidad se nota en la memoria y en lo que tarda, y si el remoto no responde la consulta falla o tarda hasta el timeout.

Hoy en día lo veo poco. Lo normal es poner Grafana apuntando directamente al almacenamiento que tiene los datos (Thanos Query, Mimir, VictoriaMetrics), que habla PromQL y hace el cálculo donde están los datos. Donde sí tiene sentido es cuando quieres seguir usando la interfaz y las reglas de un Prometheus existente sobre datos que ya no están en local.

## Federation: el central hace scrape

Federation es lo más antiguo y lo más simple. El Prometheus central hace scrape del endpoint `/federate` de los demás como si fueran un exporter más, y se lleva solo las series que le pidas con `match[]`:

```yaml
scrape_configs:
  - job_name: federate
    scrape_interval: 1m
    honor_labels: true
    metrics_path: /federate
    params:
      'match[]':
        - '{__name__=~"job:.*"}'   # reglas de agregación
        - 'up'
    static_configs:
      - targets:
          - prometheus-cluster-a:9090
          - prometheus-cluster-b:9090
```

`honor_labels: true` es obligatorio aquí. Sin él, el central sobrescribe los labels `job` e `instance` con los suyos y las originales acaban como `exported_job` y `exported_instance`, con lo que todas las series parecen venir del mismo sitio.

Lo que hay que entender es que `/federate` devuelve solo el último valor de cada serie en ese momento. Si el central hace scrape cada minuto y el origen cada 15 segundos, te pierdes tres de cada cuatro puntos. Y si el central no llega a un origen durante un rato, ese hueco no se recupera nunca, porque no hay WAL ni cola que reenvíe nada.

Por eso federation funciona bien para lo que pensaron: subir métricas ya agregadas con recording rules (las `job:` del ejemplo) a un Prometheus global que ve el resumen de todos. Para copiar todas las series en crudo de un sitio a otro no está pensado, y con muchas series el scrape de `/federate` se vuelve lento y pesado para el origen.

## Cuál elegir

- Si quieres centralizar o guardar histórico, remote write, con filtro desde el primer día y una alerta sobre el retraso del envío. Si el origen no necesita consultar nada, modo agent o vmagent.
- Si solo necesitas un resumen global de varios Prometheus con pocas series agregadas, federation sigue siendo lo más sencillo de montar.
- Si quieres consultar datos que viven en otro sitio, mejor apuntar Grafana directamente a ese almacenamiento. Remote read lo dejaría para cuando tienes que mantener reglas o la interfaz de un Prometheus que ya existe.

Los tres se pueden combinar: un Prometheus puede hacer remote write de todo a un almacenamiento central y a la vez exponer `/federate` para un global que solo quiere las agregaciones.

Fuentes:
- [Configuración de remote_write, remote_read y scrape_config](https://prometheus.io/docs/prometheus/latest/configuration/configuration/)
- [Remote write tuning](https://prometheus.io/docs/practices/remote_write/)
- [Federation](https://prometheus.io/docs/prometheus/latest/federation/)
- [Prometheus Agent Mode](https://prometheus.io/blog/2021/11/16/agent/)
