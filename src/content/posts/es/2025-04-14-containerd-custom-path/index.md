---
title: Custom path containerd en K3s (con containerd 2.0)
description: Vamos a modificar el directorio donde containerd almacena sus datos, principalmente las imágenes de los containers que es lo que más ocupa (por ejemplo, para…
pubDate: 2025-04-14
tags:
- Containerd
- kubernetes
- k3s
---

Vamos a modificar el directorio donde containerd almacena sus datos, principalmente las imágenes de los containers que es lo que más ocupa (por ejemplo, para moverlo a `/mnt/containerd`).

## Procedimiento

1. **Detección de la versión de containerd**
    
    - Confirmamos que se está usando containerd 2.0 (K3s v1.31.6+k3s1 o superior).
        
2. **Copiamos el archivo de configuración generado por K3s**
    
    ```bash
    sudo cp /var/lib/rancher/k3s/agent/etc/containerd/config.toml /var/lib/rancher/k3s/agent/etc/containerd/config-v3.toml.tmpl
    ```
    
    - Esto nos da un punto de partida funcional para editar.
        
3. **Editamos el archivo `config-v3.toml.tmpl`**
    
    - Editamos el archivo y modificamos las rutas deseadas, por ejemplo:
        
        ```toml
        [containerd]
          root = "/mnt/containerd"
          state = "/mnt/containerd/state"
        ```
        
    - Se pueden hacer otras modificaciones si es necesario (sandbox_image, runtimes, etc.).
        
4. **Guardamos el archivo**
        
        ```
/var/lib/rancher/k3s/agent/etc/containerd/config-v3.toml.tmp
        ```
        
5. **Reiniciamos K3s**
    
    ```bash
    sudo systemctl restart k3s
    ```
    
6. **Verificamos el archivo config.toml **
    
    - Verificamos el archivo generado por el config
        
    - El archivo renderizado se encuentra en:
        
        ```bash
        cat /var/lib/rancher/k3s/agent/etc/containerd/config.toml
        ```