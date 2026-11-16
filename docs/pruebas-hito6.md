# Xake — Pruebas manuales del Hito 6

## Antes de empezar

Publica el bloque en `https://xake.osumi.es` sin borrar los datos del sitio. Comprueba que Safari no conserva una versión antigua de `js/challenges.js` ni de `js/challenge-ui.js` (ambos tienen `?v=6.0.0`).

## Comprobación en el iPad 3 con iOS 9

1. Entrar en **Retos** y comprobar que aparecen los seis originales y **tres de mate en dos**.
2. Abrir **Un paso adelante**. Juegan las blancas. Primera jugada: rey blanco de `d7` a `c6`.
3. Comprobar que el rey negro responde automáticamente de `b8` a `a8` (la defensa seleccionada). Buscar el mate con reina blanca de `e7` a `b7`. Debe anunciar reto superado y tres estrellas si no hubo pistas ni fallos.
4. Repetir el reto, solicitar pista para la primera jugada, ejecutar la primera jugada y solicitar pista también en la segunda. Debe permitir las dos pistas y puntuar con una estrella sin perder la mejor puntuación anterior.
5. Repetir el reto y hacer una primera jugada legal incorrecta (por ejemplo rey `d7` a `d6`). Debe marcar intento fallido y permitir reintentar; no debe adelantar una respuesta del rival.
6. Probar **Las dos torres**: primera jugada torre de `c2` a `c7`. La máquina responderá con el rey y las blancas podrán dar mate.
7. Probar **El rey negro prepara el mate**: el tablero debe orientarse para jugar con negras; primera jugada rey negro `d2` a `c3`.
8. Crear un tablero con FEN equivalente al reto incluido o reutilizar otro tablero propio de hasta seis piezas con mate forzado en dos. En **Retos → Crear reto**, elegir `Jaque mate en dos jugadas` y guardarlo.
9. Intentar crear un mate en dos con un tablero de 32 piezas. Debe mostrarse el aviso de complejidad, sin bloqueo prolongado de Safari ni pérdida del tablero.
10. Comprobar que los retos antiguos de **una jugada**, las partidas contra máquina, las apariencias y la recuperación de partidas siguen funcionando.
11. Exportar una copia JSON: los retos propios con `goal: "mate2"` deben aparecer. Importarla en el dispositivo de pruebas y comprobar que añade copias sin sobrescribir lo existente.
12. Cambiar la interfaz a euskera, entrar en Retos y comprobar los nuevos textos. Volver a español.

## Pruebas automatizadas

Desde la raíz del repositorio:

```bash
node tests/chess.test.js
node tests/ai.test.js
node tests/editor.test.js
node tests/hito4.test.js
node tests/appearance-ghost.test.js
node tests/challenges.test.js
node tests/mate-two.test.js
```

**Resultado esperado:** las 116 pruebas pasan. Se prueba el análisis completo de todas las respuestas posibles, el límite de complejidad, la orientación con negras, creación de retos, guardado, recuperación e importación sin migración de formato.

**Nota de rendimiento:** la validación de mate en dos se limita a posiciones de hasta seis piezas, número de ramas y presupuesto de tiempo; no supone una restricción para crear tableros o jugar partidas normales.
