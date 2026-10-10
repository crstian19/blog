---
title: Loki como base de datos de logs
description: En el mercado tenemos distintos proveedores de bases de datos para poder guardar y posteriormente consultar nuestros logs, pero en este caso vamos a hablar de…
pubDate: 2024-05-02
tags:
- Loki
- grafana
- logs
- kubernetes
- monitoring
- k8s
---

En el mercado tenemos distintos proveedores de bases de datos para poder guardar y posteriormente consultar nuestros logs, pero en este caso vamos a hablar de Loki.

## Loki

Loki es una herramienta para la gestión de registros que se enfoca en indexar solo metadatos de los logs, como etiquetas al estilo de Prometheus. Los datos de los logs se almacenan comprimidos en bloques en almacenamientos como S3, GC o localmente. El índice de Loki se basa en estas etiquetas, dejando el mensaje original del log sin indexar. Sin embargo, esto implica que las consultas en LoqQL que filtran basándose en el contenido de los logs requieren cargar todos los bloques correspondientes.

Características principales de Loki incluyen:

- Uso eficiente de memoria para indexar logs.
- Multitenancy.
- LogQL, un lenguaje de consulta similar a PromQL de Prometheus, que permite generar métricas a partir de datos de logs.
- Escalabilidad, pudiendo operar tanto en un único binario como en microservicios.

Loki se destaca por dividir consultas en partes pequeñas y ejecutarlas en paralelo para agilizar la búsqueda en grandes volúmenes de datos. A diferencia de otros sistemas que requieren índices de texto completo grandes, el índice de Loki es significativamente más pequeño que el volumen de logs ingeridos, lo que mantiene bajos los costos estáticos y permite controlar el rendimiento de consultas mediante escalado horizontal.

Las etiquetas en Loki definen un flujo y cualquier cambio en el valor de una etiqueta crea un nuevo flujo. La alta cardinalidad en las etiquetas (muchas etiquetas o etiquetas con amplia gama de valores) puede llevar a una gran cantidad de flujos diferentes, lo que puede ralentizar y encarecer el funcionamiento.

### Modos

Loki opera en diferentes modos:

- Monolítico: todos los componentes en un solo binario.
- Escalable simple: separación entre lectura y escritura.
- Microservicios: distribución en varios servicios que pueden ser desplegados con Helm.

:warning: El monolitico solo está pensado para desarrollo y testing, no para producción.


### Componentes

Los componentes de Loki incluyen:

- Distribuidor: valida y preprocesa streams de logs, limita la tasa y los distribuye a los ingestores.
- Ingestor: escribe datos de logs en almacenamiento a largo plazo y responde a consultas en memoria.
- Query Frontend (opcional): optimiza las consultas, manejando grandes cargas y distribuyéndolas equitativamente.
- Querier: maneja consultas usando LogQL, buscando datos tanto en los ingestores como en el almacenamiento a largo plazo.

![components_diagram](assets/loki_architecture_components.svg)

### Arquitectura

#### Distribuidor (Distributor)
El Distribuidor es responsable de manejar los streams de logs entrantes, siendo la primera parada en la ruta de escritura. Realiza la validación de cada stream para garantizar su corrección y que cumple con los límites establecidos. Los chunks válidos se dividen y envían a múltiples ingesters. Es un componente sin estado, lo que facilita su escalabilidad.
- **Referencia**: [Distributor en Loki](https://grafana.com/docs/loki/latest/architecture/#distributor)

#### Ingester
El Ingester escribe los datos de logs en backends de almacenamiento a largo plazo y devuelve datos de log para consultas en memoria. Maneja un ciclo de vida dentro del hash ring, con estados como `PENDING`, `JOINING`, `ACTIVE`, `LEAVING`, `UNHEALTHY`. Cada stream de log se acumula en "chunks" en memoria y luego se vacía al almacenamiento. Es clave en la replicación de datos para mitigar la pérdida de datos. En la ruta de escritura, almacenan temporalmente los logs en memoria y, periódicamente, los vuelcan a sistemas de almacenamiento como DynamoDB, S3, Cassandra, entre otros. Además, en la ruta de lectura, devuelven datos de log que están en su memoria

- **Referencia**: [Ingester en Loki](https://grafana.com/docs/loki/latest/architecture/#ingester)

#### Frontend de Consulta (Query Frontend)
El Frontend de Consulta es un servicio opcional que proporciona endpoints de API para queriers y acelera la ruta de lectura. Realiza ajustes de consulta y mantiene las consultas en una cola interna. Funciona en conjunto con los queriers, que actúan como trabajadores. Es un componente sin estado, y se recomienda ejecutar algunas réplicas para beneficiarse de la programación justa.
- **Referencia**: [Query Frontend en Loki](https://grafana.com/docs/loki/latest/architecture/#query-frontend)

#### Querier
El Querier maneja consultas usando el lenguaje de consulta LogQL, obteniendo logs tanto de los ingesters como del almacenamiento a largo plazo. Realiza una deduplicación interna de los datos que poseen el mismo timestamp, conjunto de etiquetas y mensaje de log. Juega un rol crucial en la ruta de lectura.
- **Referencia**: [Querier en Loki](https://grafana.com/docs/loki/latest/architecture/#querier)

#### **Index Gateway**
Si se utiliza un almacenamiento indexado, como DynamoDB o Cassandra, para los índices de logs, el Index Gateway puede ser utilizado para descargar y consultar índices, reduciendo así la cantidad de consultas directas a estos servicios de almacenamiento indexado.

#### **Compactor**
En configuraciones que utilizan almacenamiento indexado, el Compactor es responsable de compactar los índices y mejorar su eficiencia, tanto en términos de coste como de rendimiento de las consultas.

#### **Ruler**
Este servicio se utiliza para la evaluación de reglas y alertas. Permite a [[Loki]] evaluar expresiones LogQL en un horario regular y ejecutar acciones basadas en los resultados de estas evaluaciones.

### Ruta de Escritura y Lectura

#### Ruta de Escritura (Write Path)
La ruta de escritura en gestiona cómo los datos de log son recopilados, procesados y almacenados. Involucra los siguientes pasos y componentes:

1. **Recopilación de Logs**: Comienza con la recopilación de logs, generalmente a través de agentes como Promtail, Fluentd o Fluent Bit.

2. **Distribuidor (Distributor)**: Los logs recopilados son enviados al distribuidor. El distribuidor valida los logs y los distribuye a los ingesters. La validación incluye verificar las etiquetas y los límites de tamaño y tiempo de los logs.

3. **Ingester**: Los ingesters reciben y almacenan temporalmente los logs en memoria. Los logs se organizan en “chunks”.

4. **Almacenamiento a Largo Plazo**: Los chunks comprimidos son almacenados en sistemas de almacenamiento a largo plazo.

#### Ruta de Lectura (Read Path)
La ruta de lectura describe cómo se consultan y recuperan los datos de log almacenados. Los pasos y componentes involucrados son:

1. **Consulta**: Las consultas son realizadas generalmente a través de Grafana utilizando el lenguaje de consulta LogQL.

2. **Frontend de Consulta (Query Frontend)**: Si está en uso, el frontend de consulta recibe la consulta y realiza optimizaciones.

3. **Querier**: El querier es el servicio que realmente ejecuta la consulta. Primero consulta los ingesters para obtener datos recientes y luego consulta el almacenamiento a largo plazo.

4. **Resultados**: Los resultados de la consulta son devueltos al usuario.

Espero que te haya servido.

![chibimon](assets/chibimon.webp)