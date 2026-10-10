---
title: Guia Docker-compose que es y como usarlo
description: En esta guía, aprenderás todo lo que necesitas saber sobre Docker Compose y cómo puedes utilizarlo.
pubDate: 2022-02-15
tags:
- Compose
- Docker
- guia
- español
---

![](assets/4R91rQi3h.jpeg)

En esta guía, aprenderás todo lo que necesitas saber sobre Docker Compose y cómo puedes utilizarlo.

Con aplicaciones cada vez más grandes a medida que pasa el tiempo, se hace más difícil gestionarlas de forma sencilla y fiable. Ahí es donde entra en juego Docker Compose. Docker Compose nos permite a los developers escribir un manifiesto declarativo de configuración YAML para nuestro servicio que luego puede iniciarse utilizando un único comando.

Esta guía vamos a ver todos los comandos importantes de Docker Compose y la estructura del archivo de configuración. También se puede utilizar para buscar los comandos y opciones disponibles más adelante.

## Por qué tener en cuenta Docker-compose

Antes de entrar en los detalles técnicos, vamos a discutir por qué un programador debería usar Docker-compose en primer lugar. Aquí hay algunas razones por las que los developers deberían considerar la implementación de Docker en su trabajo.

### Portabilidad:

Docker Compose permite crear un entorno de desarrollo completo con un solo comando: docker-compose up, y desmontarlo con la misma facilidad usando docker-compose down. Esto nos permite a los desarrolladores mantener nuestro entorno de desarrollo en un lugar central y nos ayuda a desplegar fácilmente nuestras aplicaciones.

### Pruebas:

Otra gran característica de Compose es su soporte para ejecutar pruebas unitarias y E2E de una manera rápida y repetible poniéndolas en sus propios entornos. Esto significa que en lugar de probar la aplicación en tu sistema operativo local/host, puede ejecutar un entorno que se asemeja mucho a las circunstancias de producción.

## Múltiples entornos aislados en un solo host:

Compose utiliza los nombres de los proyectos para aislar los entornos entre sí, lo que aporta las siguientes ventajas:

  -  Puede ejecutar varias copias del mismo entorno en una sola máquina
  -  Evita que diferentes proyectos y servicios interfieran entre sí

## Casos de uso comunes

Ahora que sabes por qué Compose es útil y dónde puede mejorar nuestro flujo de trabajo , echemos un vistazo a algunos casos de uso comunes.

### Despliegues de un solo host:

Compose se centraba tradicionalmente en el desarrollo y las pruebas, pero ahora puede utilizarse para desplegar y gestionar todo un despliegue de contenedores en un único host.


### Entornos de desarrollo:

Compose proporciona la capacidad de ejecutar nuestras aplicaciones en un entorno aislado que puede ejecutarse en cualquier máquina con Docker instalado. Esto hace que sea muy fácil de probar nuestra aplicación y proporciona una manera de trabajar lo más parecida posible al entorno de producción.

El archivo Compose gestiona todas las dependencias (bases de datos, colas, cachés, etc.) de la aplicación y puede crear cada contenedor utilizando un único comando.

## Entornos de pruebas automatizadas:

Una parte importante de la integración de Continua y de todo el proceso de desarrollo es el conjunto de pruebas automatizadas, que requiere un entorno en el que se puedan ejecutar las pruebas. Compose ofrece una forma cómoda de crear y destruir entornos de prueba aislados y muy parecidos al entorno de producción.

## Estructura del archivo Compose

Compose nos permite manejar fácilmente varios contenedores docker a la vez aplicando muchas reglas que se declaran en nuestro archivo docker-compose.yml.

Consta de múltiples capas que se dividen utilizando tabuladores o espacios en lugar de las llaves que conocemos en la mayoría de los lenguajes de programación. Hay cuatro cosas principales que casi todos los archivos de composición deben tener, que incluyen

  -   La versión del Compose
  -   Los servicios que se construirán
  -   Todos los volúmenes utilizados
  -   Las redes que conectan los diferentes servicios

Un archivo de ejemplo podría ser como este de caddy:


``` yaml
version: '3.7'
services:
  caddy:
    image: caddy
    volumes:
      - '/nuestro/directorio/local:/srv'
      - '/nuestro/directorio/local:/etc/caddy/Caddyfile'
    ports:
    - '2019:2019'
    entrypoint: caddy file-server --root /srv --browse
    restart: unless-stopped

```

Ahora que conocemos la estructura básica de un archivo Compose, vamos a ver los conceptos importantes.

## Conceptos / Palabras clave

Los aspectos centrales del archivo Compose son sus conceptos, que le permiten gestionar y crear una red de contenedores. En esta sección, exploraremos estos conceptos en detalle y echaremos un vistazo a cómo podemos utilizarlos para personalizar nuestra configuración del Compose.

## Servicios:

La etiqueta services contiene todos los contenedores que se incluyen en el archivo Compose y actúa como su etiqueta padre. Básicamente dentro de services metemos cada app que queramos levantar.

``` yaml
services:
  proxy:
    build: ./proxy
  app:
    build: ./app
  db:
    image: postgres

```

# Imagen base (Build):

La imagen base de un contenedor la definimos utilizando una imagen que esté disponible en DockerHub o construyendo imágenes utilizando un Dockerfile.

Estos son algunos ejemplos básicos:

``` yaml
version: '3.7'

services:
    alpine:
        image: alpine:latest

```
``` yaml
version: '3.7'
services:
  caddy:
    image: caddy
    volumes:
      - '/storage:/srv'
      - '/Caddyfile:/etc/caddy/Caddyfile'
    ports:
    - '2019:2019'
    entrypoint: caddy file-server --root /srv --browse
```

Aquí podemos ver ejemplos de composes con imágenes de Dockerhub.


``` yaml
version: '3.7'

services:
  app:
     container_name: homeserver-web
     build: .
     ports:
         - '3000:3000'
    restart: unless-stopped
``` 

Para el build de esta imagen podemos definirlo en el Dockerfile, aunque lo suyo sería más bien que lo hicise nuestro CI, que genere una imagen en nuestro registry y de ahí la cogería nuestro compose.

``` yaml
build:
    context: ./dir
    dockerfile: Dockerfile
```

# Puertos:

Para exponer los puertos en nuestro Compose funciona de forma similar a la del Dockerfile. Diferenciamos entre dos métodos diferentes para exponer el puerto:

**Exponer los puertos que queremos para el servicio:**

``` yaml
expose:
 - "3000"
 - "8000"
```


**Exponiendo el puerto al host:**

``` yaml
ports:
  - "8000:80"  # host:container
```

En este ejemplo, definimos el puerto que queremos exponer y el puerto del host al que debe ser expuesto.

También se puede definir el protocolo del puerto UDP o TCP:

``` yaml
ports:
  - "8000:80/udp"
```


# Volumes:

Los volúmenes ses la forma que tenemos en Docker para que los datos sean persistentes. Son completamente gestionados por Docker y pueden ser utilizados para compartir datos entre contenedores y el Host:

Básicamente lo que hacemos es montar las carpetas que queramos del container en el host como si fuese un puente.

Hay varios tipos de volúmenes que se pueden utilizar en Docker. Todos ellos pueden ser definidos usando la palabra clave volumes pero tienen algunas diferencias:

## Volumen "normal":

La forma normal de utilizar los volúmenes es simplemente definiendo una ruta específica y dejando que el Engine cree un volumen para esa ruta:


``` yaml
volumes:
  - /var/www/html 
```

## Mapeo de rutas:

También puedes definir el mapeo de la ruta absoluta de tus volúmenes definiendo la ruta en el host y mapeándola a una carpeta del contenedor:

``` yaml
volumes:
  - home/myweb:/var/www/html  # host:container
``` 

## Volumen por nombre:

Otro tipo de volumen es el volumen por nombre (así al menos le he llamado yo) que es similar a los otros volúmenes pero tiene su propio nombre específico que hace más fácil su uso en múltiples contenedores. Por eso se suele utilizar para compartir datos entre varios contenedores y servicios.

```yaml
volumes:
  - web:/var/www/html
``` 

Este tipo de volumes lo debemos definir posteriormente en el compose.


# Dependencias:

Las dependencias en Docker se utilizan para asegurarse de que un servicio específico está disponible antes de que el contenedor dependiente se inicie. Esto se utiliza a menudo si tienes un servicio que no puede ser utilizado sin otro:

```yaml
version: '2.1'
services:
  nginx:
    image: nginx
    volumes:
      - /storage/config:/config
    ports:
      - 8085:8085
    depends_on:
      - db
restart: unless-stopped
  db:
    image: mariadb
    restart: unless-stopped
    ports:
     - 3306
    environment:
      - MYSQL_ROOT_PASSWORD=yourpassword
    volumes:
     - /home/db:/var/lib/mysq
```

# Variables de entorno:

Las variables de entorno se utilizan para introducir datos de configuración en tus aplicaciones.

Hay muchas opciones diferentes de pasar variables de entorno en nuestro Compose:

## Estableciendo una variable de entorno:

Puedes asignar variables de entorno en un container utilizando la palabra "environment", al igual que con el comando normal docker container run --environment.


```yaml
db:
  environment:
    - MYSQL_ROOT_PASSWORD=yourpassword
```


## Pasar una variable de entorno:

Puedes asignar variables de entorno desde tu shell directamente a un container simplemente definiendo una key en tu Compose y no dándole un valor:

```yaml 
db:
  environment:
    - MYSQL_ROOT_PASSWORD
```

## Utilizar un archivo .env:

A veces necesitamos muchas variables de entorno y gestionarlas en el Compose es muy tedioso. Para eso están los archivos .env, donde simplemente el compose coge las variables de ese archivo.

```yaml
web:
  env_file:
    - variables.env
```

# Networks

El networking en Docker es muy importante ya que lo usamos para definir la comunicación entre los containers y con el host. 
Gracias a esto podemos aislar los containers y tener dos aplicaciones que funcionan de forma conjunta de forma segura.

Por defecto, nuestro Compose nos crea una red para cada contenedor; gracias a esto nos hace accesible este contenedor para que otros contenedores en la red tengan acceso a él mediante su nombre de host.


##  Redes personalizadas:

En lugar de utilizar únicamente la red predeterminada, también puedes especificar tus propias redes, lo que permite crear topologías más complejas y conectar diferentes containers entre sí.

Cada container puede especificar a qué redes conectarse con la variable "networks".

```yaml
services:
  app:
    build: ./app
    networks:
      - frontend
      - backend
  db:
    image: postgres
    networks:
      - backend
```

Para una configuración más específica podemos consultar la documentación oficial de Docker:

- [Network configuration](https://docs.docker.com/compose/compose-file/compose-file-v2/#network-configuration-reference)

- [Networks](https://docs.docker.com/compose/compose-file/compose-file-v2/#networks)


## Configurar las redes por defecto:

En lugar de definir tus propias redes, puedes cambiar la configuración de la red por defecto definiendo una entrada con el nombre de por defecto mediante la variable "Networks" en nuestro compose: 

```yaml
version: "3"
services:
  web:
    iamge: nginx
    ports:
      - "8085:8085"
  db:
    image: postgres

networks:
  default:
    driver: custom-driver
```


# CLI

Para usar docker-compose a través de la línea de comandos es muy parecido a usar docker, de hecho ya está incluido en el propio docker por lo que desde la línea de comandos podemos hacer todo:

```shell
build    Build or rebuild services 
help     Get help on a command 
kill     Kill containers 
logs     View output from containers 
port     Print the public port for a port binding 
ps       List containers 
pull     Pulls service images 
rm       Remove stopped containers 
run      Run a one-off command 
scale    Set number of containers for a service 
start    Start services 
stop     Stop services 
restart  Restart services 
up       Create and start containers
down     Stops and removes containers
```

Finalmente voy a poner un ejemplo de un compose de un server web de Caddy muy sencillo y de como deployearlo:

```yaml
version: '3.7'
services:
  caddy:
    image: caddy
    volumes:
      - 'home/myweb:/srv'
      - '/home/myweb/Caddyfile:/etc/caddy/Caddyfile'
    ports:
    - '2019:2019'
    entrypoint: caddy file-server --root /srv --browse
```

