---
title: 'Keycloak detrás de un proxy: de --proxy=edge a --proxy-headers'
description: 'Los modos edge, reencrypt y passthrough de Keycloak ya no existen desde la 26. Qué opción los sustituye, qué cabeceras tiene que mandar el proxy y cómo detectar que está mal configurado.'
pubDate: 2024-05-02
updatedDate: 2026-10-27
tags:
- Keycloak
- kubernetes
- k8s
- kong
- reverse-proxy
---

Cuando pones Keycloak detrás de un proxy (Kong, NGINX, Traefik, un Ingress o lo que tengas delante) Keycloak tiene que saber dos cosas: con qué URL le está llamando el usuario y quién termina el TLS. Si se equivoca en cualquiera de las dos, empiezan los redirects a `http://` y los errores de `redirect_uri`.

Hasta la versión 23 eso se decidía con una sola opción, `--proxy`, que tenía tres modos: `edge`, `reencrypt` y `passthrough`. En la 24 la marcaron como deprecated y en la **26 la quitaron del todo**, así que si arrancas una Keycloak actual con `KC_PROXY=edge` no va a funcionar. En este post vamos a ver qué hacía cada modo y con qué se sustituye ahora.

<!-- TODO Cristian: si te acuerdas de en qué proyecto montaste Keycloak detrás de Kong (y qué versión era), una frase aquí da contexto de por qué escribiste el post. -->

## Los tres modos de antes

Los tres dependen de dónde se termina el TLS (donde se descifra el HTTPS):

```
edge:        cliente --HTTPS--> Kong --HTTP-->  Keycloak
reencrypt:   cliente --HTTPS--> Kong --HTTPS--> Keycloak
passthrough: cliente --HTTPS--> Kong (no descifra, solo reenvía) --HTTPS--> Keycloak
```

En `edge` y `reencrypt` el proxy descifra la petición, así que puede añadir cabeceras como `X-Forwarded-Proto: https` o `X-Forwarded-Host`, y Keycloak las leía para saber la URL real. La diferencia entre los dos es solo el último tramo: en `edge` va en HTTP plano hasta Keycloak y en `reencrypt` el proxy vuelve a cifrar con el certificado de Keycloak.

En `passthrough` el proxy no ve nada de la petición (va cifrada de punta a punta), así que no puede añadir cabeceras. Desde la 22, en este modo Keycloak directamente ignora las cabeceras de forwarding, porque si llegan es que las ha puesto el cliente.

## Cómo se configura ahora

Con la opción nueva se separan dos cosas que antes iban juntas: qué cabecera lee Keycloak (`--proxy-headers`) y si acepta HTTP (`--http-enabled`). La tabla de equivalencias de la guía oficial de actualización es esta:

| Antes | Ahora |
|---|---|
| `--proxy edge` | `--proxy-headers xforwarded` (o `forwarded`) + `--http-enabled true` |
| `--proxy reencrypt` | `--proxy-headers xforwarded` (o `forwarded`) |
| `--proxy passthrough` | nada de `proxy-headers`, y la URL pública en `--hostname` |
| `--proxy none` | nada |

`--proxy-headers` acepta `xforwarded` (las cabeceras `X-Forwarded-For`, `-Proto`, `-Host`, `-Port`) o `forwarded` (la cabecera estándar `Forwarded` de la RFC 7239), pero no las dos a la vez. Antes `edge` y `reencrypt` leían las dos, y lo quitaron por seguridad. La mayoría de proxies (Kong incluido) mandan las `X-Forwarded-*`, así que lo normal es `xforwarded`.

En variables de entorno, que es como lo vas a tener en Kubernetes, un `edge` de los de antes con Kong delante queda así:

```yaml
env:
  - name: KC_PROXY_HEADERS
    value: xforwarded
  - name: KC_HTTP_ENABLED
    value: "true"
  - name: KC_HOSTNAME
    value: https://auth.example.com
  # Desde la 26.0: solo se hace caso a las cabeceras si vienen de estas IPs
  - name: KC_PROXY_TRUSTED_ADDRESSES
    value: 10.42.0.0/16
```

Con `KC_HOSTNAME` pasa algo parecido, porque en la 25 cambiaron también las opciones de hostname (lo que llaman hostname v2). Ya no existen `hostname-url`, `hostname-port`, `hostname-path` ni `hostname-strict-https`: todo va en `--hostname` como URL completa, con el `https://`, el puerto si no es el estándar y el path si sirves Keycloak en `/auth`. Si pones la URL completa, Keycloak no depende de las cabeceras para construir los enlaces públicos, y yo lo pondría siempre así.

`KC_PROXY_TRUSTED_ADDRESSES` es el rango desde el que llegan las peticiones del proxy (en el ejemplo, el CIDR de pods por defecto de k3s). No es obligatorio, pero sin él cualquiera que llegue a Keycloak por otro camino puede mandar un `X-Forwarded-Host` falso y Keycloak se lo cree.

La parte del proxy, con el Ingress Controller de Kong, es un Ingress normal:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: keycloak
spec:
  ingressClassName: kong
  tls:
    - hosts: [auth.example.com]
      secretName: auth-example-com-tls
  rules:
    - host: auth.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: keycloak
                port:
                  number: 8080
```

Kong ya añade por defecto `X-Forwarded-Proto`, `X-Forwarded-Host` y `X-Forwarded-Port` al reenviar a Keycloak, así que no hay que tocar nada más. Lo que sí hay que revisar es que el proxy **sobrescriba** esas cabeceras y no se limite a pasar las que manda el cliente. En Kong eso lo controla `trusted_ips`: si confías en todo, también te fías de lo que mande cualquiera desde fuera.

Si usas el operator de Keycloak, lo mismo va en el CR:

```yaml
apiVersion: k8s.keycloak.org/v2alpha1
kind: Keycloak
metadata:
  name: keycloak
spec:
  hostname:
    hostname: https://auth.example.com
  proxy:
    headers: xforwarded
  http:
    httpEnabled: true
```

## Cómo saber que está mal configurado

Casi siempre es lo mismo: Keycloak cree que le llaman por HTTP cuando el usuario está en HTTPS. Los síntomas típicos son:

- Al hacer login, la redirección va a `http://auth.example.com/...` en lugar de `https://`.
- La aplicación muestra `Invalid parameter: redirect_uri`. El cliente tiene registrado `https://app.example.com/*`, pero Keycloak está construyendo URLs con `http://` y no coinciden.
- La consola de administración carga en blanco o a medias, y en la consola del navegador salen errores de mixed content (una página HTTPS que pide recursos por HTTP).
- El `iss` de los tokens no coincide con lo que espera la aplicación (`http://` frente a `https://`, o el hostname interno del Service en lugar del público), y la validación del token falla.

Para ver qué URL está usando Keycloak, la forma más rápida es pedir el documento de discovery del realm a través del proxy:

```bash
curl -s https://auth.example.com/realms/master/.well-known/openid-configuration | jq -r .issuer
```

Si sale `http://` o un hostname que no es el público, el problema está en `KC_HOSTNAME` o en las cabeceras que llegan. Si migras desde una versión anterior a la 24 y Keycloak no arranca, revisa los logs: las opciones `proxy`, `hostname-url`, `hostname-port` y compañía ya no existen y hay que quitarlas.

<!-- TODO Cristian: si te topaste con alguno de estos síntomas en la vida real (sobre todo el redirect_uri), cuéntalo en una línea, que es lo que más ayuda a quien llega desde Google con el error. -->

Fuentes:

- [Keycloak: Using a reverse proxy](https://www.keycloak.org/server/reverseproxy)
- [Keycloak: Configuring the hostname (v2)](https://www.keycloak.org/server/hostname)
- [Keycloak: Upgrading Guide](https://www.keycloak.org/docs/latest/upgrading/)
