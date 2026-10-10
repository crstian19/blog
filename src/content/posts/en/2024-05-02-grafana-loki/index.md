---
title: Loki as a log database
description: In the market we have different database providers to save and later consult our logs, but in this case we are going to talk about Loki.
pubDate: 2024-05-02
tags:
- Loki
- grafana
- logs
- kubernetes
- monitoring
- k8s
---

In the market we have different database providers to save and later consult our logs, but in this case we are going to talk about Loki.

## Loki

Loki is a log management tool that focuses on indexing only log metadata, such as Prometheus-style tags. The log data is stored compressed in blocks in storages such as S3, GC or locally. Loki's index is based on these tags, leaving the original log message unindexed. However, this implies that queries in LoqQL that filter based on log content require loading all corresponding blocks.

Key features of Loki include:

- Efficient memory usage for indexing logs.
- Multitenancy.
- LogQL, a query language similar to Prometheus' PromQL, which allows generating metrics from log data.
- Scalability, being able to operate both in a single binary and in microservices.

Loki stands out for splitting queries into small parts and executing them in parallel to speed up the search in large volumes of data. Unlike other systems that require large full-text indexes, Loki's index is significantly smaller than the volume of logs ingested, which keeps static costs low and allows controlling query performance through horizontal scaling.


Tags in Loki define a flow and any change in the value of a tag creates a new flow. High cardinality in tags (many tags or tags with wide range of values) can lead to a large number of different flows, which can slow down and make operation expensive.

### Modes

Loki operates in different modes:

- Monolithic: all components in a single binary.
- Simple scalable: separation between read and write.
- Microservices: distribution in several services that can be deployed with Helm.

:warning: Monolithic is only intended for development and testing, not for production.


### Components

Loki components include:

- Distributor: validates and preprocesses log streams, rate limits and distributes them to ingestors.
- Ingestor: writes log data to long-term storage and responds to in-memory queries.
- Query Frontend (optional): optimizes queries, handling large loads and distributing them evenly.
- Querier: handles queries using LogQL, fetching data from both ingestors and long-term storage.

![components_diagram](assets/loki_architecture_components.svg)

### Architecture

#### Distributor
The Distributor is responsible for handling incoming log streams, being the first stop on the write path. It performs validation of each stream to ensure its correctness and that it complies with the established limits. Valid chunks are split and sent to multiple ingesters. It is a stateless component, which facilitates scalability.
- **Reference**: [Distributor at Loki](https://grafana.com/docs/loki/latest/architecture/#distributor)

#### Ingester
The Ingester writes log data to long-term storage backends and returns log data for in-memory queries. It handles a lifecycle within the hash ring, with states such as `PENDING`, `JOINING`, `ACTIVE`, `LEAVING`, `UNHEALTHY`. Each log stream is accumulated in chunks in memory and then flushed to storage. It is key in data replication to mitigate data loss. On the write path, they temporarily store the logs in memory and periodically dump them to storage systems such as DynamoDB, S3, Cassandra, among others. In addition, on the read path, they return log data that is in their memory.

- **Reference**: [Ingester on Loki](https://grafana.com/docs/loki/latest/architecture/#ingester)

#### Query Frontend
The Query Frontend is an optional service that provides API endpoints for queriers and accelerates the read path. It performs query tuning and keeps queries in an internal queue. It works in conjunction with queriers, which act as workers. It is a stateless component, and it is recommended to run some replicas to benefit from fair scheduling.
- **Reference**: [Query Frontend in Loki](https://grafana.com/docs/loki/latest/architecture/#query-frontend)

#### Querier
Querier handles queries using the LogQL query language, fetching logs from both ingesters and long-term storage. It performs internal deduplication of data that have the same timestamp, tag set and log message. It plays a crucial role in the read path.
- Reference**: [Querier on Loki](https://grafana.com/docs/loki/latest/architecture/#querier)

#### **Index Gateway**
If indexed storage, such as DynamoDB or Cassandra, is used for log indexes, the Index Gateway can be used to download and query indexes, thus reducing the number of direct queries to these indexed storage services.

#### **Compactor**
In configurations using indexed storage, the Compactor is responsible for compacting the indexes and improving their efficiency, both in terms of cost and query performance.

#### **Ruler**
This service is used for the evaluation of rules and alerts. It allows [[Loki]] to evaluate LogQL expressions on a regular schedule and execute actions based on the results of these evaluations.

## Write and Read Path

#### Write Path
The write path manages how log data is collected, processed and stored. It involves the following steps and components:

1. **Log Collection**: It starts with log collection, usually through agents such as Promtail, Fluentd or Fluent Bit.

2. **Distributor**: The collected logs are sent to the distributor. The distributor validates the logs and distributes them to the ingesters. The validation includes verifying the tags and the size and time limits of the logs.

3. **Ingester: The ingesters receive and temporarily store the logs in memory. The logs are organized in "chunks".

4. **Long-Term Storage**: Compressed chunks are stored in long-term storage systems.

#### Read Path
The read path describes how stored log data is queried and retrieved. The steps and components involved are:

1. **Query**: Queries are generally performed through Grafana using the LogQL query language.

2. **Query Frontend**: If in use, the query frontend receives the query and performs optimizations.

3. **Querier**: The querier is the service that actually executes the query. It first queries the ingesters for recent data and then queries the long-term storage.

4. **Results**: The results of the query are returned to the user.

I hope it has helped you.

![chibimon](assets/chibimon.webp)