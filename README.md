# PRIMEROS PASOS CIFRNDO

## Documentación Segura (Auditoría de Integridad)

En cumplimiento con el requisito de **"Documentación Segura"** y evitando el uso de impresiones físicas, este repositorio utiliza Hashes para garantizar la integridad de los archivos fuente. 


| Archivo Fuente             |Algoritmo| Hash                                                       |
| .--------------------------| .------ | .--------------------------------------------------------- |
| `src/app/app.ts`           | SHA-224 | `20bb5b944729cde94febb40bcb95fe64d79ad1d6eb8ca303edc28105` |
| `src/app/app.html`         | SHA-224 | `47374c598279da349dde3455d02fc00e5f9085327268b23f489eaae9` |
| `src/app/app.css`          | SHA-224 | `aa4c342b6aaa6e68bcf0750734d41f5614d3deccf3a2fc89131efe5c` |


## Desarrollo y Arquitectura

### Características del Sistema
* **Motor de Cifrado:** Basado en el estándar **ASCII** con soporte para alfabetos personalizados.
* **Lógica Reactiva:** Uso de `Angular Signals` y `Reactive Forms` para procesamiento en tiempo real.
* **Módulo Personalizado:** Capacidad de inyectar un conjunto de caracteres (`array` dinámico) para alterar la base del módulo $n$.

### Implementación del Algoritmo
El sistema no utiliza un abecedario estático. Se basa en el **índice de posición** dentro del conjunto de caracteres provisto por el usuario:


### Fórmulas de conversión utilizadas
César: C = (P + k) mod n
Atbash: C = (n - 1) - P

## Interfaz de Usuario
Se ha diseñado una interfaz monocromática de estética Hacker utilizando Tailwind CSS.

## Acceso al programa
El sistema está desplegado y operativo en el siguiente enlace seguro (HTTPS):

