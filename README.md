# PRIMEROS PASOS CIFRNDO

## Documentación Segura (Auditoría de Integridad)

En cumplimiento con el requisito de **"Documentación Segura"** y evitando el uso de impresiones físicas, este repositorio utiliza Hashes para garantizar la integridad de los archivos fuente. 


| Archivo Fuente             |Algoritmo| Hash                                                       |
| .--------------------------| .------ | .--------------------------------------------------------- |
| `src/app/app.ts`           | SHA-224 | `48c17c10a36ac92b90f6805818bbe04116c0c95ff3934ef4b6e41b76` |
| `src/app/app.html`         | SHA-224 | `a85386f2f52199284156aadeb4edcd80391cc5edba7c2fbff2ba13c8` |
| `src/app/app.css`          | SHA-224 | `6a8f018e1ef4dcda9b8e516eff0ef902eca7a4c541160e35dd9729d3` |


## Desarrollo y Arquitectura

### Características del Sistema
- **Motor de Cifrado:** Basado en el estándar ASCII con soporte para alfabetos personalizados.
- **Lógica Reactiva:** Uso de `Angular Signals` y `Reactive Forms` para procesamiento en tiempo real.
- **Módulo Personalizado:** Capacidad de inyectar un conjunto de caracteres (array dinámico) para alterar la base del módulo $n$.

### Implementación del Algoritmo
El sistema no utiliza un abecedario estático. Se basa en el índice de posición dentro del conjunto de caracteres provisto por el usuario
por medio de este ciclo en la función de cifrado / descifrado:

    for (const char of message) {
      const upper = char.toUpperCase();
      const idx = alphabet.indexOf(upper);

      if (idx === -1) {
        // Si el carácter no está en el alfabeto, se deja igual 
        output += char;
        continue;
      }

      let newIdx: number;

      if (algorithm === 'caesar') {
        // Desplazamiento de caracter para César
        const s = shift ?? 3;
        if (action === 'encrypt') {
          newIdx = ((idx + s) % n + n) % n;
        } else {
          newIdx = ((idx - s) % n + n) % n;
        }
      } else {
        // Atbash
        newIdx = (n - 1) - idx;
      }

      const newChar = alphabet[newIdx];
      // Preservar mayúscula/minúscula del carácter original
      output += char === char.toLowerCase() ? newChar.toLowerCase() : newChar;
    }


### Fórmulas de conversión utilizadas
César: C = (P + k) % n
Atbash: C = (n - 1) - P

## Interfaz de Usuario
Se ha diseñado una interfaz monocromática de estética Hacker utilizando Tailwind CSS.

## Acceso al programa
El sistema está desplegado y operativo en el siguiente enlace seguro (HTTPS): https://primeros-pasos-cifrando-gaml.vercel.app


