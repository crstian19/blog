---
title: Integrar SAI Salicru SPS 500 ONE en Home Assistant con Docker
description: Como integrar SAI Salicru SPS 500 ONE en Home Assistant con Docker.
pubDate: 2022-08-05
cover: assets/SalicruHASS.gif
tags:
- SAI
- Home Assistant
- Salicru
- HASS
- SPS 500 ONE
---

Como integrar SAI Salicru SPS 500 ONE en Home Assistant con Docker.



![Salicru SPS 500 ONE en Home Assistant](assets/SalicruHASS.gif)

Bueno, debido a que prácticamente todos mis servicios los tengo selfhosted en mi servidor, me he decidido por comprarme un SAI (Sistema de Alimentación Ininterrumpida) para cuando se pueda ir la luz por cualquier motivo el server no se apague de golpe y pueda estropearse algún componente, especialmente un HDD.

Ya que solo lo quería para el servidor y poco más me decidí por el [Salicru SPS 500 ONE](https://amzn.to/4lBd2kS), me es más que suficiente para el servidor y alguna cosa más que pueda llegar a conectarle en un futuro.

Una vez que lo tenía conectado me puse a ver como integrarlo con Home Assistant, anteriormente había visto a gente que tenía integrados SAIs en sus HASS, así que me puse a investigar.

Primero la parte obvia, para que el SAI se pueda comunicar con nuestro Home Assistant necesitamos conectar el SAI por USB al dispositivo donde tengamos corriendo Home Assistant.

Para que nuestro Home Assitant pueda comunicarse con el SAI necesitamos. [NUT](https://networkupstools.org) herramienta que hace de puente entre el SAI y Home Assistant.

En nuestro caso vamos a montar [NUT](https://networkupstools.org) en Docker junto co Home Assistant en el mismo docker-compose.yml.

## Detección del nuevo dispositivo USB del SAI.

Vamos a ejecutar el siguiente comando:

(Nos hace falta tener instalado **usbutils**)

```
# lsusb
```

![lsusb](assets/lsusb.png)

# Docker

Una vez tengamos esas dos cifras las sustuiremos en nuestro compose (más abajo en el post está el compose completo).

```yml
    devices:
      - /dev/bus/usb/001/003
```

Una vez tengamos esos datos es hora de desplegar nuestros dos servicios en Docker:

**Con Traefik**


```yml

version: '3.9'

services:

  homeassistant:
    image: homeassistant/home-assistant:latest
    restart: unless-stopped
    volumes:
      - /data/homeassistant:/config
    environment:
      - TZ=Europe/Madrid
    network_mode: host
    labels:
      - traefik.enable=true
      - traefik.http.routers.homeassistant.entryPoints=web-secure
      - traefik.http.routers.homeassistant.rule=Host(`homeassistant.crstian.me`)
      - traefik.http.services.homeassistant.loadbalancer.server.port=8123
      
  nut-upsd:
    container_name: nut-upsd
    image: upshift/nut-upsd
    restart: unless-stopped
    environment:
      - UPS_DRIVER=blazer_usb
    ports:
      - '3493:3493'
    devices:
      - /dev/bus/usb/001/003

```

**Sin Traefik**


```yml

version: '3.9'

services:

  homeassistant:
    image: homeassistant/home-assistant:latest
    restart: unless-stopped
    volumes:
      - /data/homeassistant:/config
    environment:
      - TZ=Europe/Madrid
    ports:
      - '8123:8123'
    network_mode: host
      
  nut-upsd:
    container_name: nut-upsd
    image: upshift/nut-upsd
    restart: unless-stopped
    environment:
      - UPS_DRIVER=blazer_usb
    ports:
      - '3493:3493'
    devices:
      - /dev/bus/usb/001/003

```

## Importante

En mi caso el driver de UPS es **"blazer_usb** pero no en todos los SAIs es el mismo driver, para ver cual sería el vuestro si no usais un SPS 500 lo podéis ver [aquí](https://networkupstools.org/stable-hcl.html) poniendo vuestro modelo os dice el driver que necesitais.


# Home Assistant

Ahora nos vamos a nuestro Home Assistant para añadir nuestro NUT:

Añadimos una nueva integración de NUT y ponemos la conexión con el nuestro.

Estos son el usuario y la password por defecto si quieres cambiarlos puedes añadirlo como variable de entorno en el compose más info [aquí](https://hub.docker.com/r/upshift/nut-upsd)

![Home Assistant NUT](assets/NUTserver.png)


Y una vez añadido podemos poner un dashboard con toda la información.

![Home Assistant NUT](assets/NUTDashboard.png)

Espero que te haya servido!

![Totodile gif](assets/totodile.gif)





