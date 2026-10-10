---
title: Cambiar router Sercomm FG824CD Pepephone por router neutro con OpenWRT Pepephone
description: Bueno, he decidido redactar este post ya que tengo un post antiguo donde explico como cambiar el router anterior que daba Pepephone por un router neutro.
pubDate: 2022-01-15
tags:
- Pepephone
- OpenWRT
- Linksys
- Router
---

![OpenWRT](assets/OpenWrt_Logo.svg)
Como cambiar router Sercomm FG824CD Pepephone por router neutro con OpenWRT

Bueno, he decidido redactar este post ya que tengo un [post antiguo](/post/2020-05-03-cambiar-router-pepephone/) donde explico como cambiar el router anterior que daba Pepephone por un router neutro.

En Junio de 2021 me mudé de casa y mi router antiguo [Linksys 1900ACS](https://amzn.to/3jdl1FN) lo dejé en casa de mi padres configurado como expliqué en el otro post. 

Al mudarme contraté una nueva línea de internet con Pepephone y en lugar de ponerme un router con una ONT como la vez anterior, me colocaron un router al que le entraba la fibra directamente por lo que necesitaba transformar esa fibra con una ONT; tras mucho buscar vi que en Wallapop por ~10€ se vendían muchas de estas ONTs, eso sí para Pepephone hay dos ONTs de Nokia muy parecidas pero una si que funciona y la otra no el modelo bueno para Pepephone es **Nokia-G-010-P** el modelo ~~I-010G-U~~ no sirve para Pepephone.

![ONT Nokia-G-010-P](assets/ONTNOKIA.png)

Para poder realizar este cambio, un requisito indispensable que hay que tener muy en cuenta antes de adquirir un router es que soporte el protocolo IEEE 802.1Q. Y en este post voy a explicar el proceso de hacerlo en un router con [OPENWRT](https://openwrt.org/).
Otra cosa que tenemos que saber es que Pepephone alquila a las demás compañías el acceso a las instalaciones de fibra por lo que tenemos que saber que compañía cede en nuestro edificio/casa en mi caso es movistar.

Además de tener un router que soporte ese protocolo necesitamos estar fuera de CG-NAT y eso se lo tenemos que solicitar a la compañía a día de hoy Pepephone te proporciona una IP Pública de forma gratuita, lo único que tienes que hacer es solicitársela.

Una vez tengamos los requisitos anteriores vamos al lío.

## Sacar PLOAM Password

Bien, para sacar la PLOAM password del Sercomm FG824CD accedemos a la UI del router, lo más normal es que sea http://192.168.1.1/ y el user + la password por defecto 1234/1234 o admin/admin.

Nos vamos a Settings y abrimos las web developers tools en Firefox (Ctrl + Shift + I) o en Chrome (F12) abriremos el fichero “mainFunctions.js” y añadimos un breakpoint donde aparece:

```
usermode = getUserData('usermode', data);
```

![](assets/mainfunctions.webp)

Recargamos con F5, la carga se queda pausada en la línea del breakpoint. Ahora desplegaremos el panel Scope > Local > data y cambiaremos los siguientes valor “usermode” a “admin”. Luego hacemos click en el botón superior de play para continuar con la carga (en Chrome).

![](assets/01-sercomm_fg824cd_inspeccionar_mainFuntions_vars.png)

Ahora nos deberían aparecer nuevos menús en settings, vamos al de GPON, aparece la PLOAM Password pero está oculta, para poder sacar los caracteres hacemos click derecho e inspeccionar elemento encima de la casillade la password, doble click en password y eliminamos "password", ahora ya podemos ver la PLOAM Password en formato hexadecimal, la copiamos porque la vamos a necesitar más adelante y es **MUY IMPORTANTE**

![PLOAM Password](assets/ploam.webp)

![](assets/plam2.webp)


## Configurar ONT

**Todo este proceso lo realizamos con el cable de fibra sin conectar**

Para configurar la ONT con nuestra PLOAM password necesitamos acceder a la UI de la misma, la cual normalmente está en el rango 192.168.100.0/24, por lo que necesitamos poner la IP de nuestro PC en ese rango para poder acceder, en mi caso lo haré desde linux pero desde Windows es muy fácil encontrar en internet como ponerte una IP Fija.

```
ip addr add 192.168.100.19 dev enp2s0
```  
En mi caso es enp2s0 pero en el vuestro podeis usar la interfaz de red que tenga vuestro PC y que podéis comprobar haciendo "ip a".

Una vez tengamos esa IP accedemos a la ONT http://192.168.100.1

![ONT Admin](assets/ONTadmin.webp)

Entramos con admin/1234 y añadimos nuestra PLOAM que hemos sacado anteriormente con 0x delante, por ejemplo si nuestra PLOAM obtenida anteriormente ha sido t6478927 debemos añadir 0xt6478927.

**Ahora sí, conectamos el cable de fibra y en unos segundos se encenderá la luz verde de PON.**

![]()

## Configuración en OpenWRT

Una vez tenemos la ONT configurada la conectamos al puerto WAN del nuevo router, conectamos nuestro pc por cable y accedemos a él a través de su IP (Normalmente 192.168.1.1 o 192.168.0.1) en mi caso es la 10.0.1.1 ya que la he cambiado yo y me gusta más tenerlo así.

![Home Linksys](assets/Homelinksys.jpg)

Nos vamos al botón de arriba **Network** y a **Switch**

![Switch OpenWRT Linksys](assets/switchlinksys.jpg)

Y aquí añadimos una VLAN para WAN en mi caso la ID es 20 porque mi proveedor de fibra es movistar, aquí dejo lista de las ids en función de tu proveedor (https://www.reiniciapc.com/cambiar-el-router-de-fibra-por-uno-neutro/)

Volvemos otra vez a network y esta vez a interfaces; aquí editamos la parte de WAN en edit.

![Interfaces OpenWRT Linksys](assets/interfaceswan.jpg)

Ahora en la pestaña de Physical Settings tenemos que cambiar la interfaz por la VLAN que hemos creado antes con la id 20.

![Interfaces WAN OpenWRT](assets/switchvlan.jpg)

Y como último paso nos vamos a Advanced Settings y ponemos nuestros DNS yo he puesto los de cloudflare que son los más rápidos.

También debemos poner la MAC del router que nos deja la compañía en Override MAC address para que no nos de ningún problema.

![DNS OpenWRT Linksys](assets/dns.jpg)

Ahora damos save y luego save and apply y ya debería de asignarnos IP en wan como en la siguiente imagen:

![IP asignada](assets/IPasignada.jpg)

Espero que te haya servido.


### Sources

- https://tedi.es/reemplaza-el-sercomm-fg824cd-por-ont-y-router-neutro/ (La mayoría de capturas del Sercomm son de tedi ya que yo ya había cambiado el router cuando hice este post)
- https://www.acampos.net/2021/01/router-sercomm-fg824cd-i.html
- https://reiniciapc.com/cambiar-el-router-de-fibra-por-uno-neutro/




