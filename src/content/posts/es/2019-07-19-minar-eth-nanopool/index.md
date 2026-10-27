---
title: Minar Ethereum desde Linux y Windows en nanopool
description: En es post vamos a ver como minar Ethereum con nanopool.org en linux y en windows.
pubDate: 2019-07-19
cover: assets/nanominer.png
tags:
- Ethereum
- Mining
- Nanopool
aliases:
- /posts/2019-07-19-minar-eth-nanopool/
---

En es post vamos a ver como minar Ethereum con nanopool.org en linux y en windows.


## Nanominer

El miner que vamos a usar va a ser nanominer ya que está mantenido por nanopool y es el que recomiendan.

En primer lugar nos descargamos nanominer desde su [github](https://github.com/nanopool/nanominer/releases)

Una vez descargado descomprimimos el tar.gz, de los archivos que tenemos nos interesan dos especialmente, config.ini y nanominer.

Primero vamos a abrir config.ini con un editor de texto como gedit o nano y lo editamos con la siguiente estructura:

wallet = 0xffffffffffffffffffffffffffffffffffffffff **_---> Lo cambiamos por nuestro wallet_**

rigName = rig1 **-_--> Nombre de nuestro rig_**

email = someemail@org **_---> Nuestro mail_**

pool1 = eth-eu1.nanopool.org:9999

pool2 = eth-eu2.nanopool.org:9999

pool3 = eth-us-east1.nanopool.org:9999

pool4 = eth-us-west1.nanopool.org:9999

pool5 = eth-asia1.nanopool.org:9999

pool6 = eth-jp1.nanopool.org:9999

pool7 = eth-au1.nanopool.org:9999

Una vez lo tengamos con esa estructura lo guardamos.

Abrimos un terminal y nos vamos a la carpeta de nanominer para desde allí ejecutarlo con el siguiente comando:

> sudo ./nanominer

Si todo ha salido bien ya debería empezar a minar.

Para ver los stats lo podemos hacer desde este enlace https://eth.nanopool.org/account/0xffffffffffffffffffffffffffffffffffffffff sustituyendo por nuestro wallet.

También desde este enlace en local podemos ver algunos datos de nuestro miner http://127.0.0.1:9090/

![nanominer.png](assets/nanominer.png)
