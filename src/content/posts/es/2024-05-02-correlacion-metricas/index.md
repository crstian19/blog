---
title: Correlación de métricas y logs en Grafana y Loki
description: 'Cómo pasar de un pico en una gráfica de Prometheus a los logs que lo explican en Loki: etiquetas comunes, data links, métricas sacadas de logs con LogQL y el fallo de relabel que lo rompe todo.'
pubDate: 2024-05-02
updatedDate: 2026-10-27
tags:
- Loki
- grafana
- logs
- prometheus
- alloy
- kubernetes
- monitoring
- k8s
---

En este post vamos a ver como pasar de un pico en una gráfica de Prometheus a los logs que lo explican en Loki, sin ir copiando a mano nombres de pods y horas de una pestaña a otra.

Grafana no correlaciona nada por arte de magia. Para unir una métrica con un log solo tiene dos cosas: el rango de tiempo y las etiquetas que comparten los dos. El tiempo lo pone el dashboard, así que casi todo el trabajo está en que las etiquetas sean las mismas en Prometheus y en Loki.

## Las etiquetas tienen que llamarse igual en los dos lados

Si en Prometheus la serie es `container_memory_working_set_bytes{namespace="immich", pod="immich-server-7c9d8f6b5-x2k4p"}` y en Loki el stream es `{k8s_namespace_name="immich"}`, Grafana no tiene forma de saber que hablan del mismo sitio. Lo mínimo es que `namespace` y `app` se llamen igual y tengan los mismos valores en las métricas y en los logs.

Con `pod` hay que ir con cuidado. En Prometheus es una etiqueta más, pero en Loki cada valor distinto de una etiqueta crea un stream nuevo, y el nombre del pod cambia en cada despliegue. En el plan que hice para los logs de mi cluster dejé como etiquetas solo `namespace`, `app` y `level`, y lo que tiene muchos valores (pod, request ID…) se busca con un filtro de texto o, desde Loki 3, como structured metadata, que se puede filtrar sin crear streams nuevos:

```logql
{namespace="immich", app="immich-server"} | pod="immich-server-7c9d8f6b5-x2k4p"
```

## El orden de las reglas de relabel

Aunque las dos configs saquen `app` de las labels de Kubernetes, es fácil que acaben con valores distintos. Este es un trozo real de la config de Alloy que tenía para los logs:

```alloy
// App - Prioridad 1: app.kubernetes.io/name
rule {
  source_labels = ["__meta_kubernetes_pod_label_app_kubernetes_io_name"]
  target_label  = "app"
  regex         = "(.+)"
}

// App - Prioridad 2: app.kubernetes.io/instance
rule {
  source_labels = ["__meta_kubernetes_pod_label_app_kubernetes_io_instance"]
  target_label  = "app"
  regex         = "(.+)"
}

// App - Prioridad 4: extraer del nombre del pod
rule {
  source_labels = ["__meta_kubernetes_pod_name"]
  target_label  = "app"
  regex         = "^([a-z0-9-]+?)-[a-z0-9]{8,10}-[a-z0-9]{5}$"
  replacement   = "$1"
}
```

Los comentarios dicen "prioridad 1, 2, 4", pero relabel no funciona así. Las reglas se aplican en orden y cada `replace` que hace match sobrescribe lo anterior, así que gana **la última** que encaja, no la primera. Un pod de un Deployment siempre encaja con la regex del nombre del pod, de modo que en los logs `app` acaba siendo el nombre del Deployment aunque el pod tenga `app.kubernetes.io/name`.

Mientras tanto, en la parte de métricas de esa misma config solo estaba la regla de `app.kubernetes.io/name`. Por ejemplo, un pod con `app.kubernetes.io/name=server` sale en Prometheus con `app="server"` y en Loki con otro valor, y cualquier enlace de uno a otro devuelve cero logs.

La solución es ordenar las reglas de menos a más preferida (la buena al final) y usar el mismo bloque de reglas para métricas y para logs. Si no te fías, compara los valores de los dos lados en Explore antes de montar ningún enlace.

## Un clic de la gráfica a los logs: data links

Con las etiquetas alineadas, lo más útil es un data link en los paneles de Prometheus. Haces clic en un punto de la gráfica y te lleva a un dashboard de logs con el mismo namespace, la misma app y el mismo rango de tiempo:

```
/d/logs-app/logs?var-namespace=${__field.labels.namespace}&var-app=${__field.labels.app}&${__url_time_range}
```

El dashboard de destino tiene dos variables, `namespace` y `app`, y un panel de logs con `{namespace="$namespace", app="$app"}`. `__field.labels.<label>` coge el valor de la etiqueta de la serie en la que has hecho clic y `__url_time_range` pasa el rango de tiempo. Ojo con el `&` antes de `__url_time_range`: Grafana no lo pone solo, lo tienes que escribir tú.

Para Explore está también la función de Correlations, que hace lo mismo pero desde los resultados de una query en lugar de desde un panel, y se puede provisionar junto al data source.

## Métricas sacadas de los logs

La otra mitad de la correlación es poner los logs en la misma gráfica que las métricas. LogQL convierte logs en series temporales, y con el data source `-- Mixed --` puedes pintar en un solo panel la memoria de un pod y los errores que escupe:

```logql
sum by (app) (count_over_time({namespace="immich", level="error"} [5m]))
```

Esto solo funciona si el agente saca `level` del log y lo pone como etiqueta (en Alloy, con `stage.json` o `stage.regex` y luego `stage.labels`). Si tus logs llevan la duración de cada petición, también puedes sacar percentiles:

```logql
quantile_over_time(0.99,
  {namespace="ingress"} | json | __error__ = "" | unwrap request_time [1m]
) by (path)
```

`count_over_time` no admite `unwrap` porque solo cuenta líneas. Si quieres sumar valores de un campo, es `sum_over_time` con `unwrap`.

## Si además tienes trazas

Si tus logs llevan el ID de la traza, un derived field en el data source de Loki convierte ese ID en un enlace a Tempo:

```yaml
apiVersion: 1
datasources:
  - name: Loki
    type: loki
    url: http://loki-gateway.monitoring.svc
    jsonData:
      derivedFields:
        - name: TraceID
          matcherRegex: "traceID=(\\w+)"
          datasourceUid: tempo
          url: '$${__value.raw}'
          urlDisplayLabel: Ver traza
```

El `$$` es a propósito: en los ficheros de provisioning un `$` suelto se interpreta como variable de entorno.

## Lo que descuadra la correlación

Lo primero es la hora. Si el agente no parsea el timestamp de la propia línea, Loki guarda la hora a la que la leyó, y con un agente que se queda atrás los logs salen desplazados respecto a la gráfica. En Alloy se arregla con `stage.timestamp`.

Lo segundo, las etiquetas de más. Cada etiqueta con muchos valores multiplica los streams y hace las queries más lentas y caras, y para correlacionar te bastan las que compartes con Prometheus.

Y si todavía recoges los logs con Promtail, toca migrar. Está deprecado desde Loki 3 y llegó a fin de vida el 2 de marzo de 2026. Alloy trae un conversor, `alloy convert --source-format=promtail`, que pasa la config de Promtail a la suya.

Hoy en mi cluster ya no uso Loki: los logs van con Vector a VictoriaLogs y las métricas a VictoriaMetrics. Lo de las etiquetas sigue igual, porque cualquier herramienta que quiera unir métricas y logs necesita que los dos lados hablen de lo mismo con los mismos nombres.
<!-- TODO Cristian: por qué cambiaste Loki por VictoriaLogs (una frase, si te apetece contarlo) -->
