---
title: Routing seguro para tus aplicaciones en containers usando Traefik v2 con Let's Encrypt
description: Configurar traefik v2 para routing seguro como proxy reverso con HTTPS
pubDate: 2020-04-19
tags:
- Traefik
- Reverse Proxy
aliases:
- /posts/2020-04-19-routing-seguro-para-sus-aplicaciones-en-containers-usando-traefik-v2-y-lets-encrypt/
---

Configurar traefik v2 para routing seguro como proxy reverso con HTTPS

![Traefik v2](assets/traefik-architecture.png)

## Introducción

Una configuración robusta de proxy inverso es crítica para cualquier configuración selfhosted que tenga elementos expuestos a través de internet. Si bien los servicios de proxy inverso se utilizan a menudo por razones de equilibrio de carga y seguridad, la mayoría de los propietarios de servidores domésticos los utilizan para enrutar las solicitudes dirigidas a diferentes dominios o subdominios a diferentes hosts o servicios internos. En mi caso puedes ver todos mis servicios en https://server.crstian.me/.

En esto post vamos a ver como configurar Traefik como proxy inverso como por ejemplo [NGINX](https://www.nginx.com/).

Vamos a ver como hacer routing de forma segura a peticiones dirigidas a un subdominio que apunte a un puero específico de un container, todo ello a través de forma segura mediante HTTPS.

## ¿Qué es un proxy inverso?

Un proxy inverso es un tipo de servidor proxy que recupera recursos en nombre de un cliente desde uno o más servidores. Estos recursos son entonces regresados al cliente como si se originaran en el propio servidor Web.

Lo que explicado de una forma más vulgar sería en nuestro caso acceder a distintos servicios que tenemos de forma local pero desde el exterior y que en este caso Traefik haga el trabajo de routing y dependiendo el subdominio nos lleve a un servicio u otro.
![Traefik routers](assets/services.png)

### Balanceo de carga

Un proxy inverso puede distribuir la carga de solicitudes entrantes a varios servidores, con cada servidor ejecutando su propia área de aplicación.

Los proxies inversos proporcionan una capa adicional de seguridad al no revelar nunca la dirección IP del servidor backend que realmente maneja las solicitudes. Esto significa que los atacantes normalmente sólo podrán atacar a los propios servidores proxy inversos.

### Encriptación SSL

Un proxy inverso lo podemos configurar con encriptación SSL para poder generar certificados automaticamente para cada ruta con [Let's Encrypt](https://letsencrypt.org/es/).

## Configurar Traefik v2

En nuestro caso vamos a levantarlo con un [docker-compose.yml](https://docs.docker.com/compose/)

```
version: '3.7'

services:
  traefik:
    image: traefik:latest
    network_mode: host
    volumes:
      - ./config/:/etc/traefik/
      - /var/run/docker.sock:/var/run/docker.sock
```
Ahora vamos a configurar Traefik con su archivo de configuración traefik.toml.

```
api:
  dashboard: true

entryPoints:
  web:
    address: ":80"
  web-secure:
    address: ":443"

providers:
  docker:
    endpoint: "unix:///var/run/docker.sock"
    exposedByDefault: false
  file:
    filename: /etc/traefik/config.yml
    watch: true

certificatesResolvers:
  default:
    acme:
      email: your email
      storage: /etc/traefik/acme/acme.json
      tlsChallenge: {}
```

### Integración con Docker

Traefik utiliza la API de cada [proveedor](https://docs.traefik.io/providers/overview/) para encontrar información de routing y configurarse en función a ello.

![Traefik v2 providers](assets/providers.png)

### Puntos de entrada

Los puntos de entrada simplemente definen los puertos en los que Traefik escuchará para recibir los paquetes. Aquí se configuran dos puntos de entrada, web y websecure para los puertos 80 y 443.

## Configuración de los containers

El último paso para exponer nuestro container usando Traefik es añadir algunas etiquetas Docker que permitirán a Traefik encontrarlo.

Estas son las etiquetas necesarias: 

```
labels:
      - traefik.enable=true
      - traefik.http.routers.yourservicename.entryPoints=web-secure
      - traefik.http.routers.yourservicename.rule=Host(`subdomain.your.domain`)
      - traefik.http.routers.yourservicename.tls=true
      - traefik.http.routers.yourservicename.middlewares=user:password
      - traefik.http.services.yourservicename.loadbalancer.server.port=serviceport    
```
- `yourservicename` tenemos que cambiarlo por el nombre de nuestra aplicación, por ejemplo `netdata`

- `subdomain.your.domain` tenemos que cambiarlo por nuestro subdominio que queremos que apunte a nuestra aplicación, por ejemplo `netdata.crstian.me`

- `serviceport` aquí tenemos que cambiarlo por el puerto que use nuestro servicio

- `user:password` en caso de que queramos ponerle usuario y contraseña para entrar a ese servicio debemos usar usuario y contraseña como si fuera htaccess


Un ejemplo de un servicio que tengo corriendo en mi servidor con su docker-compose.yml

```
version: '3'
services:
  caddy:
    image: abiosoft/caddy
    volumes:
      - '/storage/shared:/srv'
    labels:
      - traefik.enable=true
      - traefik.http.routers.caddy.entryPoints=web-secure
      - traefik.http.routers.caddy.rule=Host(`downloads.crstian.me`)
      - traefik.http.routers.caddy.tls.certresolver=default
      - traefik.http.services.caddy.loadbalancer.server.port=2015
      - traefik.http.routers.caddy.middlewares=torrent
      - traefik.http.middlewares.torrent.basicAuth.users=mypasswordbro
    restart: unless-stopped
```
## Traefik Dashboard

Por último vamos a configurar dentro del propio traefik para que podamos acceder a su dashboard mediante un subdominio.

Dentro del archivo config.yml tenemos que tener lo siguiente:

```
traefik:
      rule: Host(`traefik.crstian.me`)
      entryPoints:
        - "web-secure"
      service: api@internal
      middlewares:
        - auth
      tls:
        certResolver: default
```
Nos deberá mostrar este dashboard 

![Traefik v2](assets/traefikdashboard.png)
