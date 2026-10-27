---
title: Cambiar router Sagemcom 5366S Pepephone por router neutro con OpenWRT Pepephone
description: Como cambiar router Sagemcom 5366S Pepephone por router neutro con OpenWRT
pubDate: 2020-05-03
cover: assets/Homelinksys.jpg
tags:
- Pepephone
- OpenWRT
- Linksys
aliases:
- /posts/2020-05-03-cambiar-router-pepephone/
---

# WARNING 
## Si el router que te ha puesto Pepephone le entra la fibra directamente, visita este [post](/post/2022-01-15-cambiar-router-pepephone-sercomm-fg824cd/)

Como cambiar router Sagemcom 5366S Pepephone por router neutro con OpenWRT

Bueno, he decidido redactar este post ya que quería cambiar el router que me cedió la compañía por mi [Linksys 1900ACS](https://amzn.to/3jdl1FN).

En primer lugar para poder realizar un requisito indispensable, que hay que tener muy en cuenta antes de adquirir un router es que soporte el protocolo IEEE 802.1Q. Y en este post voy a explicar el proceso de hacerlo en un router con [OPENWRT](https://openwrt.org/).
Otra cosa que tenemos que saber es que pepephone alquila a las demás compañías el acceso a las instalaciones de fibra por lo que tenemos que saber que compañía cede en nuestro edificio/casa en mi caso es movistar.

Además de tener un router que soporte ese protocolo necesitamos estar fuera de CG-NAT y eso se lo tenemos que solicitar a la compañía a día de hoy Pepephone te proporciona una IP Pública de forma gratuita, lo único que tienes que hacer es solicitársela.

Una vez tengamos los requisitos anteriores vamos al lío.

## Quitar el Sagemcom y poner el Linksys

Ahora vamos a desconectar de la ONT(El aparatito pequeño que transforma la fibra a Ethernet) el Sagemcom y vamos a conectar nuestro router directamente al puerto WAN.

## Configuración en OpenWRT

Una vez conectado el nuevo router conectamos nuestro pc por cable y accedemos a él a través de su IP (Normalmente 192.168.1.1 o 192.168.0.1) en mi caso es la 10.0.1.1 ya que la he cambiado yo y me gusta más tenerlo así.

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

Y ya como curiosidad pues he realizado un speedtest con 200mb contratados y aquí el resultado 

![Speedtest](assets/image_2020-05-03_17-15-28.png)

Espero que te haya servido.




