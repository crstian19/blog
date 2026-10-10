---
title: Logitech G502 Linux
description: Como configurar y usar Logitech G502 en Arch Linux
pubDate: 2019-07-28
tags:
- Logitech G502
- Linux
aliases:
- /posts/2019-07-28-logitech-g502-linux/
---

Como configurar y usar Logitech G502 en Arch Linux - How to configure and use Logitech G502 on Arch Linux

## Configurar y usar Logitech G502 en linux

Después de pasarme a Arch Linux desde Windows y teniendo un Logitech G502 tenía la necesidad de configurar tanto dpi como los botones configurables, incluso apagar los leds por la noche.

Gracias a un amigo que me enseñó [piper](https://github.com/libratbag/piper) programa hecho en Python el cual nos permite configurar nuestro G502 y más modelos [aquí la lista ](https://github.com/libratbag/libratbag/tree/master/data/devices)

En mi caso al usar Arch Linux ya tenía el paquete en el [AUR](https://aur.archlinux.org/), pero en el repositorio de github de piper tenemos explicado como instalarlo en su [Wiki](https://github.com/libratbag/piper/wiki/Installation)

Una vez instalado es tan fácil como lanzar el programa.

![](assets/Resolution.png)

En esta primera pantalla podemos modificar los dpi y la sensibilidad.

![](assets/Buttons.png)

En esta podemos cambiar las funciones de los distintos botones.

![](assets/Leds.png)

Finalmente aquí podemos modificar los leds.

Para aplicar los cambios simplemente tenemos que aplicar los cambios en la esquina superior derecha en Apply.


