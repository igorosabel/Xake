# Xake — Pruebas del Hito 5 (Retos)

**Estado:** entrega preparada, pendiente de validación física en iPad 3 con iOS 9.

## Automatizadas

Desde la raíz del repositorio, sin instalar dependencias:

```bash
node tests/chess.test.js
node tests/ai.test.js
node tests/editor.test.js
node tests/hito4.test.js
node tests/appearance-ghost.test.js
node tests/challenges.test.js
```

Resultados de la entrega: **101 pruebas superadas**: 16 + 14 + 22 + 19 + 12 + 18.

## Comprobaciones manuales en el navegador

1. Entra en **Retos** desde la pantalla principal. Deben aparecer seis retos precargados, dos por objetivo.
2. Abre «La torre viajera». Selecciona h1 y luego h8; el reto debe resolverse y mostrar 3 estrellas. Vuelve a la lista y verifica que muestra `★ 3/3`.
3. Abre «La reina decisiva» y mueve la reina g6 → g7: se consigue jaque mate en una jugada.
4. Realiza una jugada legal que **no** cumpla el objetivo: debe avisar y permitir **Intentar de nuevo**, sin dar estrellas.
5. Pulsa **Ver pista**, completa el reto y comprueba que recibe 1 estrella; la puntuación más alta obtenida anteriormente no se reduce.
6. Cambia apariencias antes de abrir un reto (Clásico / Medallas / Emblemas). Comprueba que las piezas se dibujan correctamente después de jugadas, reintentos y cambio de pantalla; no deben quedar «fantasmas».
7. Crea un tablero con una torre blanca en e2, una reina negra en e4, rey blanco en a1 y rey negro en e8; juegan blancas. Guarda el tablero, entra en **Retos**, selecciona ese tablero, «Capturar una reina» y guarda un reto con nombre propio. Comprueba que se puede resolver con torre e2 → e4.
8. Intenta crear un reto imposible para la posición: debe avisar y **no guardarlo**. Revisa la posibilidad de eliminar un reto creado sin borrar el tablero de origen.
9. Exporta desde **Mis tableros → Copia de seguridad**; el JSON debe incluir `armies`, `scenarios` y `challenges`. Importa la copia y comprueba que conserva los anteriores y crea copias nuevas. Una copia antigua que no tenga `challenges` también debe seguir siendo importable.
10. Comprueba **Dos jugadores** y **Contra la máquina** después de entrar y salir de Retos: no deben quedar superpuestas las pantallas y se debe poder continuar la partida guardada.
11. Cierra y vuelve a abrir Safari: los retos creados y mejores estrellas deben seguir ahí si `localStorage` está disponible.
12. Comprueba ambas traducciones, en especial los mensajes de error, pista y resultado.

## Requisitos específicos iPad 3 (iOS 9)

- Interacciones solo por pulsaciones, sin arrastrar.
- Pantalla de juego visible en horizontal sin desplazamiento lateral.
- Verificar que los retos con imágenes de Emblemas/Medallas no producen piezas fantasma.
- La validación de retos desde tableros con muchas reinas puede tardar más que una partida normal: comprobar que la respuesta resulta aceptable.

Las pruebas visuales de escritorio y móvil se realizaron con Chromium, sin tráfico de red. **No sustituyen a Safari iOS 9 real.**
