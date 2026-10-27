---
title: Correlating metrics and logs in Grafana and Loki
description: 'How to go from a spike in a Prometheus graph to the Loki logs that explain it: shared labels, data links, metrics from logs with LogQL, and the relabel mistake that breaks it all.'
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

This post shows how to go from a spike in a Prometheus graph to the Loki logs that explain it, without copying pod names and timestamps by hand from one tab to another.

Grafana doesn't correlate anything by magic. To join a metric with a log it has two things: the time range and the labels both sides share. The dashboard sets the time, so most of the work is making the labels match in Prometheus and in Loki.

## Labels need the same names on both sides

If the Prometheus series is `container_memory_working_set_bytes{namespace="immich", pod="immich-server-7c9d8f6b5-x2k4p"}` and the Loki stream is `{k8s_namespace_name="immich"}`, Grafana has no way to know they describe the same thing. At a minimum, `namespace` and `app` need the same names and the same values in metrics and logs.

Be careful with `pod`. In Prometheus it's just another label, but in Loki every distinct label value creates a new stream, and the pod name changes on every deploy. In the plan I wrote for my cluster's logs I kept only `namespace`, `app` and `level` as labels. Anything with many values (pod, request ID…) goes through a text filter or, since Loki 3, structured metadata, which you can filter on without creating new streams:

```logql
{namespace="immich", app="immich-server"} | pod="immich-server-7c9d8f6b5-x2k4p"
```

## The order of relabel rules

Even when both configs take `app` from Kubernetes labels, they can easily end up with different values. This is a real piece of the Alloy config I had for logs:

```alloy
// App - Priority 1: app.kubernetes.io/name
rule {
  source_labels = ["__meta_kubernetes_pod_label_app_kubernetes_io_name"]
  target_label  = "app"
  regex         = "(.+)"
}

// App - Priority 2: app.kubernetes.io/instance
rule {
  source_labels = ["__meta_kubernetes_pod_label_app_kubernetes_io_instance"]
  target_label  = "app"
  regex         = "(.+)"
}

// App - Priority 4: take it from the pod name
rule {
  source_labels = ["__meta_kubernetes_pod_name"]
  target_label  = "app"
  regex         = "^([a-z0-9-]+?)-[a-z0-9]{8,10}-[a-z0-9]{5}$"
  replacement   = "$1"
}
```

The comments say "priority 1, 2, 4", but relabeling doesn't work that way. Rules run in order and every `replace` that matches overwrites the previous value, so **the last** matching rule wins, not the first. A Deployment's pod always matches the pod-name regex, so in the logs `app` ends up as the Deployment name even when the pod has `app.kubernetes.io/name`.

Meanwhile, the metrics part of that same config only had the `app.kubernetes.io/name` rule. A pod with `app.kubernetes.io/name=server`, for example, shows up in Prometheus with `app="server"` and in Loki with another value, and any link from one to the other returns zero logs.

The fix is to order the rules from least to most preferred (the one you want last) and use the same block of rules for metrics and logs. If in doubt, compare the values on both sides in Explore before you build any link.

## One click from the graph to the logs: data links

With the labels aligned, the most useful piece is a data link on the Prometheus panels. You click a point on the graph and land on a logs dashboard with the same namespace, the same app and the same time range:

```
/d/logs-app/logs?var-namespace=${__field.labels.namespace}&var-app=${__field.labels.app}&${__url_time_range}
```

The target dashboard has two variables, `namespace` and `app`, and a logs panel with `{namespace="$namespace", app="$app"}`. `__field.labels.<label>` takes the label value from the series you clicked, and `__url_time_range` carries the time range. Watch the `&` before `__url_time_range`: Grafana doesn't add it, you have to write it yourself.

Explore also has Correlations, which does the same from query results instead of from a panel, and you can provision it with the data source.

## Metrics from logs

The other half of correlation is putting logs on the same graph as the metrics. LogQL turns logs into time series, and with the `-- Mixed --` data source one panel can show a pod's memory next to the errors it logs:

```logql
sum by (app) (count_over_time({namespace="immich", level="error"} [5m]))
```

This only works if the agent extracts `level` from the log line and sets it as a label (in Alloy, with `stage.json` or `stage.regex` followed by `stage.labels`). If your logs carry the duration of each request, you can get percentiles too:

```logql
quantile_over_time(0.99,
  {namespace="ingress"} | json | __error__ = "" | unwrap request_time [1m]
) by (path)
```

`count_over_time` doesn't accept `unwrap` because it only counts lines. To add up the values of a field, use `sum_over_time` with `unwrap`.

## If you also have traces

If your logs include the trace ID, a derived field on the Loki data source turns that ID into a link to Tempo:

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
          urlDisplayLabel: View trace
```

The `$$` is on purpose: in provisioning files a single `$` is read as an environment variable.

## What throws correlation off

First, time. If the agent doesn't parse the timestamp from the log line itself, Loki stores the time it read the line, and with an agent that falls behind the logs show up shifted against the graph. In Alloy you fix that with `stage.timestamp`.

Second, extra labels. Every label with many values multiplies the streams and makes queries slower and more expensive, and for correlation you only need the ones you share with Prometheus.

And if you still collect logs with Promtail, it's time to migrate. It's been deprecated since Loki 3 and reached end of life on March 2, 2026. Alloy ships a converter, `alloy convert --source-format=promtail`, that turns a Promtail config into an Alloy one.

I don't run Loki in my cluster anymore: logs go through Vector to VictoriaLogs and metrics to VictoriaMetrics. The label part hasn't changed, because any tool that wants to join metrics and logs needs both sides to describe the same thing with the same names.
<!-- TODO Cristian: why you swapped Loki for VictoriaLogs (one sentence, if you want to share it) -->
