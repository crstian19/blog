---
title: Keycloak behind proxy
description: Los 3 modos de operación de Keycloak cuando está detrás de un proxy.
pubDate: 2024-05-02
tags:
- Keycloak
- kubernetes
- k8s
---

Cuando tenemos Keycloak detrás de un proxy tenemos 3 modos de operación:

## **Edge**:
    
- **Flujo**: Cliente → HTTPS → Kong → HTTP → Keycloak.
- **Descripción**: En esta configuración, Kong actúa como un terminador de SSL. Esto significa que Kong desencripta las conexiones HTTPS provenientes del cliente y luego reenvía esas solicitudes a Keycloak utilizando HTTP. Keycloak no necesita manejar el SSL porque la conexión entre Kong y Keycloak es interna y se considera segura.
- **Uso típico**: Utilizado en entornos donde puedes garantizar una red interna segura entre Kong y Keycloak.
## **Passthrough**:
    
- **Flujo**: Cliente → HTTPS/HHTP → Kong (sin modificar) → HTTPS/HTTP → Keycloak.
- **Descripción**: En el modo passthrough, Kong simplemente reenvía las solicitudes al servidor backend (Keycloak) sin alterar el esquema de encriptación. Esto significa que si el cliente usa HTTPS, la conexión sigue siendo HTTPS hasta Keycloak.
- **Uso típico**: Ideal cuando quieres que Keycloak maneje directamente la encriptación y no deseas que Kong interfiera en la seguridad de la conexión.
      
## **Reencrypt**:
    
- **Flujo**: Cliente → HTTPS → Kong → HTTPS → Keycloak.
- **Descripción**: Similar a 'edge' en que Kong termina la conexión SSL del cliente, pero con una diferencia crítica: Kong luego reencripta la solicitud antes de enviarla a Keycloak. Este método es más seguro porque asegura que la información siga cifrada durante todo el trayecto.
- **Uso típico**: Recomendado para maximizar la seguridad en entornos donde las transmisiones internas también podrían estar expuestas a riesgos.