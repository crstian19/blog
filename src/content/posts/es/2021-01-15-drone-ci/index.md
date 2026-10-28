---
title: Usar Drone CI/CD con Traefik en NixOS
description: En este post vamos a ver como configurar nuestro propio entorno de CI/CD con Drone, integrado con Traefik como reverse proxy y en NixOS como sistema operativo…
pubDate: 2021-01-15
cover: assets/Drone.jpg
tags:
- Drone
- CI
- CD
- Traefik
- NixOS
---

En este post vamos a ver como configurar nuestro propio entorno de CI/CD con [Drone](https://www.drone.io/), integrado con [Traefik](https://traefik.io/) como reverse proxy y en [NixOS](https://nixos.org/) como sistema operativo usando repositorios de github.

![](assets/NixOS.png)

![](assets/Drone.jpg)

En primer lugar necesitamos crar una OAuth application en github y nuestro RPC secret podemos verlo en este [post](https://rubynor.com/blog/2020/06/setting-up-drone-ci-for-rails-apps/) o también en los [docs de drone](https://docs.drone.io/server/provider/github/).

Para crear nuestro RPC secret lo haremos de la siguiente forma:

> $ openssl rand -hex 16
bea26a2221fd8090ea38720fc445eca6

Una vez tenemos nuestro client ID y nuestro client secret procedemos a crear nuestro docker-compose.yml para levantar el container de drone.

```
version: '3.7'

services:
  drone-server:
    container_name: drone-server
    image: drone/drone:1
    restart: unless-stopped
    volumes:
      - ./drone:/data
    environment:
      - DRONE_GITHUB_CLIENT_ID=<Your_Client_ID>
      - DRONE_GITHUB_CLIENT_SECRET=<Your_Client_secret>
      - DRONE_RPC_SECRET=<Your_RPC_secret>
      - DRONE_SERVER_HOST=<Your_URL>
      - DRONE_SERVER_PROTO=https
      - DRONE_USER_CREATE=username:<Your_Github_username>,admin:true
    labels:
      - traefik.enable=true
      - traefik.http.routers.drone.entryPoints=web-secure
      - traefik.http.routers.drone.rule=Host(`Your_URL`)
      - traefik.http.routers.drone.tls.certresolver=default

```
A continuación levantamos nuestro container con:
> $ docker-compose up -d

Una vez levantado nuestro server vamos a levantar nuestro host runner executor para ello nos bajamos el binario de drone-exec desde la web de drone:

> $ curl -L https://github.com/drone-runners/drone-runner-exec/releases/latest/download/drone_runner_exec_linux_amd64.tar.gz | tar zx

Una vez bajado lo tenemos que mover a /root/bin/ para posteriormente en el configuration.nix añadir lo siguiente:

```
environment.etc.drone-runner-exec = {
  target = "drone-runner-exec/config";
  text = ''
  DRONE_RPC_PROTO=https
  DRONE_RPC_HOST=<Your_URL>
  DRONE_RPC_SECRET=<Your_RPC_secret>
  DRONE_UI_USERNAME=root
  DRONE_UI_PASSWORD=root
  '';
};

systemd.services.drone-runner-exec = {
  description = "Drone Exec Runner";
  startLimitIntervalSec = 5;
  serviceConfig = {
    ExecStart = "/root/bin/drone-runner-exec service run --config /etc/drone-runner-exec/config";
  };
  wantedBy = [ "multi-user.target" ];
  path = [ pkgs.git pkgs.docker pkgs.docker-compose ];
};
```
Una vez modificado nuestro configuration.nix:

> nixos-rebuild switch

Ahora accedemos a nuestra URL de Drone y nos autenticamos con nuestra cuenta de  Github.

![](assets/GithubLogin.png)

Hasta aquí hemos montado nuestra infraestuctura con Drone, de aquí en adelante cada unx puede hacer lo que necesite, en mi caso vamos a ver como tengo yo montado para que cada vez que creo un post y hago push a la repo de github, automáticamente se realice el deployment y se actualice el container de nginx con las modificaciones.

Una vez dentro de la web de nuestro drone, activamos el repositorio que queramos en mi caso el repositorio de este blog.

![](assets/Dronepage.png)


Para realizar la configuración nuestro repositorio tiene que tener 3 archivos esenciales en la raiz del repositorio:

[**.drone.yml**](https://github.com/Crstian19/My-personal-blog/blob/Main/.drone.yml)

En este archivo configuramos básicamente las acciones a realizar por drone en nuestro caso simplemente realiza el build de docker y luego levanta el container.


```
kind: pipeline
type: exec
name: default

platform:
  os: linux
  arch: amd64

steps:
- name: build
  commands:
    - docker build -t bloglord .

- name: run
  commands:
    - docker-compose down -v
    - docker-compose up -d --build
```
[**Dockerfile**](https://github.com/Crstian19/My-personal-blog/blob/Main/Dockerfile)

Poco que comentar de este archivo, simplemente copia el contenido de public en la carpeta html del container de nginx.

```
FROM nginx:alpine
COPY public/ /usr/share/nginx/html
```
[**docker-compose.yml**](https://github.com/Crstian19/My-personal-blog/blob/Main/docker-compose.yml)

El compose del container donde aportamos los labels de traefik.

```
version: '3.7'

services:
  bloglord:
    image: bloglord
    container_name: blog
    restart: unless-stopped
    labels:
      - traefik.enable=true
      - traefik.http.routers.bloglord.entryPoints=web-secure
      - traefik.http.routers.bloglord.rule=Host(`blog.crstian.me`)
      - traefik.http.routers.bloglord.tls.certresolver=default

networks:
  default:
    name: bloglord-network
```

Una vez realizado todo esto podemos comprobar realizando y pusheando un commit donde veremos como hemos automatizado las modificaciones del blog.

Si fallara algo lo podríamos ver en el activity feed de cada commit.

![](assets/DroneActivityFeed.png)

Y ya estaría listo nuestro Drone para todo lo que necesitemos.

![](assets/f47a703b66a1d1e2a2f9b3078a00215a.gif)

Espero que te haya servido.


### Sources

- https://github.com/Raniita/app-drone-tests
- https://rubynor.com/blog/2020/06/setting-up-drone-ci-for-rails-apps/
- https://docs.drone.io/server/provider/github/