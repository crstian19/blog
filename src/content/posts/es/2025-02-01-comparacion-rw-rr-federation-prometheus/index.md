---
title: Comparación Remote Write, Remote Read y Federation en Prometheus
description: Comparación Remote Write, Remote Read y Federation en Prometheus
pubDate: 2025-02-01
tags:
- Prometheus
- kubernetes
- k8s
---

| **Aspecto**         | **Remote Write**                     | **Remote Read**                       | **Federation**                       |
|----------------------|--------------------------------------|---------------------------------------|--------------------------------------|
| **Transferencia**    | Sí, métricas se transfieren.          | No, solo se leen métricas.             | Sí, pero solo métricas seleccionadas. |
| **Almacenamiento**   | Las métricas se almacenan en destino. | Solo lectura, sin almacenamiento.      | Almacena métricas seleccionadas.      |
| **Escalabilidad**    | Alta (centralización de datos).       | Media (instancias independientes).     | Media (para métricas específicas).    |
| **Latencia**         | Depende de la transferencia.          | Alta si las consultas son frecuentes.  | Baja para métricas seleccionadas.     |
| **Uso típico**       | Consolidación en un único Prometheus o Thanos. | Consultas distribuidas sin mover datos. | Centralización de métricas clave.     |

## 1. Remote Write

### Descripción:
- El servidor Prometheus de origen **envía métricas** a otro sistema de almacenamiento, que puede ser:
  - Otro Prometheus.
  - Soluciones externas como Thanos, Cortex o VictoriaMetrics.

### Funcionamiento:
- Configuración de `remote_write` en el Prometheus de origen.
- Las métricas recolectadas se transfieren al sistema remoto para ser almacenadas.

### Casos de uso:
- Consolidar métricas en un servidor centralizado o almacenamiento de largo plazo.
- Delegar el almacenamiento a soluciones más escalables o distribuidas.

### Ventajas:
- Escalabilidad al mover el almacenamiento a un sistema más grande.
- Persistencia de métricas más allá de las capacidades locales de Prometheus.

### Desventajas:
- Incremento de latencia debido a la transferencia de datos.
- Pérdida de datos si el destino no está disponible.

#### Useful links
- https://last9.io/blog/what-is-prometheus-remote-write/
---

## 2. Remote Read

### Descripción:
- Permite que una instancia Prometheus **lea métricas almacenadas en un sistema remoto** sin transferirlas ni almacenarlas localmente.

### Funcionamiento:
- Configuración de `remote_read` en Prometheus para consultar métricas desde:
  - Otro Prometheus.
  - Soluciones externas compatibles con Prometheus.

### Casos de uso:
- Acceso temporal a métricas almacenadas en otros sistemas.
- Escenarios en los que no se desea duplicar almacenamiento.

### Ventajas:
- Evita mover grandes volúmenes de datos.
- Permite consultar métricas históricas de sistemas externos.

### Desventajas:
- Alta latencia para consultas frecuentes o complejas.
- Dependencia de la conectividad y disponibilidad del sistema remoto.

---

## 3. Federation

### Descripción:
- Un servidor Prometheus recopila y almacena **métricas seleccionadas** de otras instancias Prometheus.

### Funcionamiento:
- Configuración del endpoint `/federate` en Prometheus.
- El servidor Prometheus federado consulta métricas específicas y las almacena localmente.

### Casos de uso:
- Consolidar métricas clave desde múltiples Prometheus.
- Implementar arquitecturas jerárquicas (por ejemplo, un Prometheus centralizado que recopila datos de otros Prometheus).

### Ventajas:
- Control granular sobre qué métricas recopilar.
- Útil para centralizar datos críticos o métricas importantes.

### Desventajas:
- Ineficiente para mover grandes volúmenes de métricas.
- Complejidad si hay muchas instancias Prometheus a federar.

---