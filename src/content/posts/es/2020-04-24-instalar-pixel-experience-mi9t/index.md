---
title: Instalar Pixel Experience ROM en Xiaomi Mi 9T / Redmi K20
description: Como instalar la ROM Pixel Experience en el Xiaomi Mi9T desde Linux.
pubDate: 2020-04-24
cover: assets/desbloquear-bootloader-xiaomi-sin-esperar-garantia-tutorial-11.jpg
tags:
- Android
- ROM
aliases:
- /posts/2020-04-24-instalar-pixel-experience-mi9t/
---

Como instalar la ROM Pixel Experience en el Xiaomi Mi9T desde Linux.


# Desbloquear bootloader

En primero lugar para flashear esta o cualquier ROM necesitamos tener el bootloader de nuestro terminal desbloqueado. Para ello necesitamos [miunlock](https://en.miui.com/unlock/download_en.html) (Para poder ejecutar mi unlock debemos hacerlo desde windows)

Además de esto debemos tener nuestro MI9T actualizado a la última versión de MIUI. Nos vamos a información sobre el teléfono y tenemos que presionar sobre MIUI version varias veces ya que necesitamos activar las opciones de desarollador.

Una vez activas las opcines de desarollador vamos a esa pestaña y activamos OEM unlocking y USB debugging.

Ahora reiniciamos el télefono en modo fastboot (Vol - + Power button) y lo conectamos al pc con el cable usb con miunloock abierto y una vez nos detecte el terminal pulsamos unlock.

![MiUnlock](assets/desbloquear-bootloader-xiaomi-sin-esperar-garantia-tutorial-11.jpg)

Para este proceso deberemos esperar aproximandamente una semana que es lo que tarda Xiaomi.

# Herramientas necesarias

Para instalar Pixel Experience vamos a necesitar dos herramientas en nuestro equipo, android-tools y android-udev, en mi caso que uso Arch Linux tengo los dos uno en la [repo oficial](https://www.archlinux.org/packages/) y el otro en el [AUR](https://aur.archlinux.org/)

También tenemos que bajarnos TWRP para flashearlo como recovery en nuestro caso la denominación de nuestro terminal es da vinci y tenemos que bajarnos su versión de [TWRP_Da_vinci](https://dl.twrp.me/davinci/)

Como es obvio también necesitamos la ROM https://download.pixelexperience.org/davinci en mi caso estoy usando la Plus edition porque lleva algunas cosas extra y me convence más.

Ya que estamos podemos flashear [Magisk](https://github.com/topjohnwu/Magisk/releases) para tener root.

# Go to flash!

Ahora lo que tenemos que hacer es reiniciar el terminal en modo fastboot (Vol - + Power button) y en nuestra terminal estando en el path donde tenemos TWRP ejecutar el siguiente comando:

```
fastboot flash recovery Downloads/twrp-3.3.1.0-davinci.img
```
![](assets/Format-Data.jpg)

Hacemos un format data desde Wipe > Format data y despues reboot recovery otra vez.

![](assets/Format-Data.jpg)

Una vez que volvamos a entrar en TWRP tenemos que activar adb mediante advanced > ADB Sideload.

![](assets/Sideload.jpg) ![](assets/Sideloadwork.jpg)

Primero vamos a flashear el vendor que nos dejan el enlace en la propia web de Pixel Experience:

```
adb sideload Downloads/fw--vendor_davinci_miui_Global...zip
```

Con ADB Sideload activado desde nuestra terminal ejecutamos el siguiente comando para flashear Pixel Experience:

```
adb sideload Downloads/PixelExperience_plus......zip
```

Y por último tenemos que flashear Magisk:

```
adb sideload Downloads/magisk-v20.4.zip
```

![Magisk Manager](assets/logo.png)

Y ya hacemos reboot system y al arrancar deberíamos tener nuestra ROM flasheada y funcional.


Si has llegado aquí en busca de ayuda espero que te haya servido.