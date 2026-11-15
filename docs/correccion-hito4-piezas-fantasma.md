# Xake — Corrección del Hito 4: piezas fantasma

**Origen:** incidencia reproducida con la versión publicada del Hito 4, en Safari iOS 9 y apariencias de imagen.

## Causa confirmada

El módulo `js/board.js` actualiza el contenido textual de cada casilla, pero **no elimina las imágenes CSS** añadidas por `js/appearance.js`. El decorador `decorateBoard()` omitía las casillas vacías (`if (!piece || !cell) continue`), con lo que la casilla de origen conservaba el `background-image` del peón anterior. `decorateEditor()` tenía el mismo problema al retirar piezas.

La batería original de `tests/hito4.test.js` no reproducía el fallo porque utilizaba un tablero simulado que eliminaba explícitamente `backgroundImage` en cada renderizado. Se añade una prueba de regresión con los módulos reales `lib/chess.js`, `js/game.js`, `js/board.js` y `js/appearance.js`.

## Cambios

- `js/appearance.js`: `decorateBoard()` y `decorateEditor()` procesan todas las casillas, **incluidas las vacías**, y eliminan los fondos obsoletos. `drawPiece()` limpia también el texto cuando ya no hay pieza.
- `index.html`: nueva URL del módulo `js/appearance.js?v=4.0.1`, para evitar que Safari reutilice una copia cacheada anterior.
- `tests/appearance-ghost.test.js`: 12 pruebas de regresión de movimientos, cambios de tema, deshacer, giro, editor, capturas, enroque, captura al paso y promoción.

**Sin cambios** en reglas, IA, inventarios, escenarios, partidas guardadas, recursos gráficos ni datos locales.

## Aplicación

Copiar `js/appearance.js`, `index.html` y `tests/appearance-ghost.test.js` respetando sus rutas en la raíz del repositorio. El archivo de documentación puede copiarse en `docs/`.

No es necesario volver a ejecutar `instalar_hito4.py`. No es necesario borrar `localStorage` ni perder partidas/ejércitos/tableros guardados.

## Pruebas automatizadas

```bash
node tests/chess.test.js
node tests/ai.test.js
node tests/editor.test.js
node tests/hito4.test.js
node tests/appearance-ghost.test.js
```

## Comprobación manual en el iPad 3

1. Publicar los archivos corregidos en `https://xake.osumi.es` y recargar la página.
2. Elegir «Emblemas» para los dos bandos e iniciar partida clásica contra la máquina.
3. Mover un peón blanco: **la casilla de origen debe quedar vacía**. Comprobar lo mismo después de la respuesta de la máquina.
4. Cambiar de «Emblemas» a «Clásico» y volver a «Medallas»: no deben quedar fondos antiguos.
5. Probar deshacer, reiniciar y girar el tablero.
6. Entrar en el editor, colocar una pieza, moverla y retirarla: todas las casillas vaciadas deben quedar sin imágenes.
7. Confirmar que se mantienen las partidas y configuraciones guardadas.

Esta corrección se ha verificado mediante pruebas automatizadas con DOM simulado; la comprobación física en Safari iOS 9 queda a cargo del dispositivo de referencia.
