---
title: Configurar DDNS en OpenWrt Cloudflare
description: Si tienes servicios en tu casa como es mi caso, tu compañía seguramente te de IP pública dinámica, por lo que es un follón tener que estar cambiando a mano la…
pubDate: 2022-01-10
cover: assets/Ddns-Done.png
tags:
- OpenWRT
- DDns
- Cloudflare
---

Si tienes servicios en tu casa como es mi caso, tu compañía seguramente te de IP pública dinámica, por lo que es un follón tener que estar cambiando a mano la IP donde apunta tu dominio cada vez que tu compañía te cambie la IP, por ello vamos a ver como configurar en nuestro router con OpenWRT con Cloudflare como DNS de forma muy sencilla.

## Token en Cloudflare

En primer lugar vamos a necesitar un token de cloudflare, podemos conseguirlo desde aquí [https://dash.cloudflare.com/profile/api-tokens](https://dash.cloudflare.com/profile/api-tokens) con nuestra cuenta.

Creamos un token nuevo con esta configuración:

    Zone, Zone: Read
    Zone, DNS: Edit

![](assets/Cloudflare-Token.png)

## Configurar OpenWRT

Ahora necesitamos instalar los siguientes paquetes (en mi caso por terminal pero también se puede hacer desde Luci):

**En caso de estar en OpenWRT 19.07 tenemos que instalar ddns-scripts_cloudflare.com-v4**

**Para OpenWRT 20.02 o superior el paquete es ddns-scripts-cloudflare**

```
opkg update
opkg install ddns-scripts-cloudflare luci-app-ddns
opkg install wget ca-certificates
opkg install curl ca-bundle

```

Una vez todo instalado nos vamos a la IP del router en el navegador Services -> Dynamic DNS.

Editamos la IPv4:

- Seleccionamos DDNS Service provider cloudflare.com-v4
- En Lookup Hostname colocamos nuestro subdominio o dominio por ejemplo en mi caso murcia.crstian.me, en Domain lo mismo pero en este formato murcia@crstian.me
- En username **Bearer** y en password nuestro token de cloudflare.

![](assets/Ddns-config.png)

Una vez hecho esto le damos a Save and Apply.

## Testing

Para ver que esta funcionando podemos verlo en Services -> Dynamic DNS y vemos como nos coge nuestra IP y si vamos al DNS de cloudflare vemos que lo ha cambiado.

![](assets/Ddns-Done.png)