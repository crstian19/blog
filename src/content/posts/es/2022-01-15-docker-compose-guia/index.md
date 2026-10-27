---
title: 'Guía de Docker Compose: lo que se usa de verdad (Compose v2)'
description: 'Docker Compose al día: docker compose en vez de docker-compose, healthchecks con depends_on, .env e interpolación, profiles, override, include y watch.'
pubDate: 2022-02-15
updatedDate: 2026-10-27
cover: assets/4R91rQi3h.jpeg
tags:
- Compose
- Docker
- guia
- español
---

![Logo de Docker Compose](assets/4R91rQi3h.jpeg)

Este post lo escribí en 2022 y se había quedado viejo: usaba la clave `version:`, el binario `docker-compose` con guion y una lista de comandos copiada de la ayuda. Lo he reescrito con lo que se usa hoy y quitando todo lo que no ibas a usar nunca.

Docker Compose es un fichero YAML donde describes los containers de un proyecto (imágenes, puertos, volúmenes, variables, redes) para levantarlos todos con `docker compose up -d` y tirarlos con `docker compose down`. En mi caso lo que acaba en producción vive en un cluster de Kubernetes, así que Compose lo uso sobre todo para desarrollo local, por ejemplo la base de datos de una app mientras programo.

## docker-compose o docker compose

Son dos programas distintos:

- **Compose v1** (2014) estaba escrito en Python y se llamaba con `docker-compose`, con guion. Es el que leía la clave `version: '3.7'` del principio del fichero.
- **Compose v2** (2020) está escrito en Go, viene como plugin de Docker y se llama con `docker compose`, sin guion. **Ignora la clave `version`**, así que puedes borrarla de tus ficheros.
- **Compose v5** (2025) es el mismo comando y funciona igual que v2. Lo nuevo es un SDK de Go para usar Compose desde código; se saltaron los números 3 y 4 para no confundirlo con los formatos de fichero "v2" y "v3".

El fichero por defecto ahora es `compose.yaml`. El `docker-compose.yml` de toda la vida lo sigue leyendo, así que no hace falta renombrar nada.

## Un ejemplo real: Postgres para desarrollo

Este es casi tal cual el `compose.yaml` que tengo en un proyecto para tener un Postgres en local:

```yaml
services:
  postgres:
    image: postgres:18
    environment:
      POSTGRES_USER: wishlist
      POSTGRES_PASSWORD: wishlist
      POSTGRES_DB: wishlist
    ports:
      - '127.0.0.1:5433:5432'
    volumes:
      - pgdata:/var/lib/postgresql
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U wishlist -d wishlist']
      interval: 2s
      timeout: 3s
      retries: 20

volumes:
  pgdata:
```

Hay tres detalles que merece la pena copiar:

- **El puerto va atado a `127.0.0.1`.** Si pones solo `5433:5432`, Docker lo abre en todas las interfaces y una base de datos con contraseña `wishlist` queda accesible para cualquiera en la misma red que tu portátil (y Docker se salta las reglas de `ufw`, así que el firewall tampoco te salva).
- **Volumen con nombre (`pgdata`) y no una carpeta.** Docker lo gestiona, sobrevive a `docker compose down` y no te llena el repo de ficheros con permisos de root.
- **La ruta del volumen es `/var/lib/postgresql`, no `/var/lib/postgresql/data`.** Desde las imágenes de Postgres 18 los datos van en un subdirectorio por versión. Si copias un compose antiguo con `/data` en una imagen 18, el container no arranca.

En el proyecto real la imagen va fijada por digest (`postgres@sha256:…`) y Renovate la actualiza, pero para el post con `postgres:18` se entiende mejor.

## Esperar a que la base de datos esté lista

El fallo más típico con Compose es que la app arranca antes que la base de datos y se cae en el primer intento de conexión. `depends_on` a secas solo espera a que el container **exista**, no a que Postgres acepte conexiones. Para eso está la condición `service_healthy`, que espera a que pase el `healthcheck`:

```yaml
services:
  web:
    build: .
    depends_on:
      db:
        condition: service_healthy
        restart: true
  db:
    image: postgres:18
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U $${POSTGRES_USER} -d $${POSTGRES_DB}']
      interval: 10s
      timeout: 10s
      retries: 5
      start_period: 30s
```

- `restart: true` hace que, si reinicias `db` con Compose, también se reinicie `web` para que vuelva a abrir sus conexiones.
- El `$$` del healthcheck es a propósito: con un solo `$` Compose intentaría sustituir la variable al leer el fichero; con `$$` la deja pasar y la resuelve el shell **dentro** del container, donde `POSTGRES_USER` sí existe.
- Las otras condiciones son `service_started` (lo mismo que `depends_on` a secas) y `service_completed_successfully`, que viene bien para un container de migraciones que tiene que acabar antes de arrancar la app.

<!-- TODO Cristian: si tienes algún caso real en el que se te cayera una app por no tener el healthcheck, aquí encaja una línea contándolo. -->

## Variables: .env, interpolación y env_file

Aquí hay dos cosas que se confunden mucho:

- **El fichero `.env`** que está junto al `compose.yaml` se usa para **rellenar el propio fichero de Compose**. Si en el YAML pones `${POSTGRES_USER}`, Compose busca el valor en tu shell y luego en `.env`.
- **`env_file:`** dentro de un servicio pasa las variables **al container**, y el YAML ni se entera.

```env
# .env
POSTGRES_USER=app
POSTGRES_PASSWORD=cambiame
POSTGRES_DB=app
WEB_PORT=8080
```

En la interpolación puedes poner valores por defecto o hacer que falle si falta algo:

```yaml
services:
  web:
    image: ghcr.io/usuario/web:${TAG:-latest}   # si TAG no está, usa latest
    ports:
      - '127.0.0.1:${WEB_PORT:?falta WEB_PORT en el .env}:8080'
```

Con `${VAR:?mensaje}`, `docker compose up` se para con ese mensaje en vez de levantar algo a medias. Para ver el fichero ya resuelto, con todas las variables sustituidas, usa `docker compose config`.

El `.env` lleva contraseñas, así que va al `.gitignore` y en el repo dejas un `.env.example` con las claves vacías.

## Profiles: servicios que solo arrancan cuando los pides

Un servicio con `profiles` no se levanta con un `docker compose up` normal. Viene bien para herramientas que solo quieres de vez en cuando, como un panel para mirar la base de datos:

```yaml
services:
  db:
    image: postgres:18
  adminer:
    image: adminer
    profiles: [debug]
    ports:
      - '127.0.0.1:8081:8080'
    depends_on: [db]
```

```bash
docker compose up -d                    # solo db
docker compose --profile debug up -d    # db + adminer
COMPOSE_PROFILES=debug docker compose up -d   # lo mismo con variable
```

Los servicios sin `profiles` arrancan siempre.

## Varios ficheros: override e include

**`compose.override.yaml`**: si existe junto al `compose.yaml`, Compose lo mezcla automáticamente. El uso típico es dejar en el principal lo común y en el override lo de tu máquina (puertos de debug, montar el código en vez de usar la imagen). Si quieres otra combinación, se la pasas a mano y entonces el override automático no se carga:

```bash
docker compose -f compose.yaml -f compose.prod.yaml up -d
```

**`include`** sirve para lo contrario: traerte otro `compose.yaml` entero (por ejemplo la infra que comparten varios proyectos) sin copiarlo:

```yaml
include:
  - path: ./infra/compose.yaml   # define redis y postgres
services:
  web:
    build: .
    depends_on:
      redis:
        condition: service_healthy
```

Los servicios incluidos comparten la red por defecto, así que `web` llega a `redis` por su nombre. Si redefines un servicio que ya viene del include, Compose da error en vez de mezclarlo; para retocarlo se usa el `compose.override.yaml`.

## watch: recargar el código sin reconstruir a mano

Si desarrollas dentro del container, `develop.watch` sincroniza los cambios mientras programas:

```yaml
services:
  web:
    build: .
    develop:
      watch:
        - action: sync+restart
          path: ./src
          target: /app/src
        - action: rebuild
          path: package.json
```

Con `docker compose watch`, cada cambio en `./src` se copia al container y lo reinicia, y si cambias `package.json` reconstruye la imagen. Si tu framework ya tiene hot reload, con `action: sync` sin restart te basta.

## Redes

Compose crea **una red por proyecto** y mete ahí todos los servicios, que se encuentran por su nombre: desde `web` la base de datos es `db:5432`, sin publicar ningún puerto. Por eso `ports:` solo hace falta para lo que quieres ver desde tu máquina.

Las redes propias tienen sentido cuando quieres separar servicios, por ejemplo que el proxy vea la app pero no la base de datos:

```yaml
services:
  proxy:
    image: caddy:2
    networks: [front]
  web:
    build: .
    networks: [front, back]
  db:
    image: postgres:18
    networks: [back]

networks:
  front:
  back:
```

## El Caddy del post original, actualizado

El ejemplo de 2022 servía una carpeta con Caddy, pero publicaba el puerto `2019`, que en Caddy es la API de administración y no el servidor web. Así quedaría bien:

```yaml
services:
  caddy:
    image: caddy:2
    command: caddy file-server --root /srv --browse --listen :80
    volumes:
      - ./web:/srv:ro
    ports:
      - '127.0.0.1:8080:80'
    restart: unless-stopped
```

Con `docker compose up -d` tienes en `http://localhost:8080` un listado navegable de la carpeta `./web`, montada en solo lectura (`:ro`) porque Caddy no tiene que escribir nada ahí.

## Los comandos del día a día

```bash
docker compose up -d                 # levantar en segundo plano
docker compose ps                    # qué está corriendo y su estado de health
docker compose logs -f web           # logs de un servicio
docker compose exec db psql -U app   # entrar en un container que ya corre
docker compose pull && docker compose up -d   # actualizar imágenes
docker compose config                # ver el fichero ya resuelto
docker compose down                  # parar y borrar containers y red
```

**OJO con `docker compose down -v`**: además de los containers borra los volúmenes con nombre, osea, la base de datos. Para parar sin perder nada, `docker compose down` a secas.
