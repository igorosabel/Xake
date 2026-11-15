# Xake

Aplicación web de ajedrez infantil para Safari de **iOS 9** (iPad 3 de 2012) y navegadores actuales. Interfaz en **castellano por defecto**, con traducción al **euskera**. No necesita servidor de aplicación, build, CDN ni dependencias externas.

Web de pruebas: https://xake.osumi.es · Repositorio: https://github.com/igorosabel/Xake

## Funcionalidades

**Hito 1 — Tablero clásico (validado en el iPad 3):**

- Dos personas en el mismo dispositivo; tocar pieza y después destino, sin arrastrar.
- Movimientos legales, enroque, captura al paso, promociones, jaque, mate y tablas.
- Deshacer, girar tablero, reiniciar, guardar y continuar.

**Hito 2 — Contra la máquina (validado por el usuario):**

- Elegir blancas o negras y cuatro dificultades: Principiante, Fácil, Normal y Difícil.
- Búsqueda ligera mediante `Web Worker` y tiempo de cálculo limitado.
- Sin Stockfish ni conexión a internet para calcular; retroceso de turno completo al deshacer.
- Los niveles son orientativos y no equivalen a una clasificación Elo.

**Hito 3 — Ejércitos y tableros personalizados (pendiente de validación en iPad 3 físico):**

- Editor táctil en tres pasos: inventarios → colocación → validación y guardado.
- Configurar cantidades arbitrarias de piezas (exactamente un rey por color, límites de casillas y peones).
- Inventarios independientes de los colores, guardables y reutilizables como **ejércitos**.
- Colocar, mover y retirar tocando casillas; deshacer/rehacer ediciones; distribuir automáticamente.
- Guardar **tableros**, editarlos, duplicarlos, eliminarlos y jugar desde ellos contra otra persona o la máquina.
- Tablas terminales guardables para edición; posiciones incoherentes bloqueadas.
- Cada partida conserva su propio FEN inicial, por lo que puede reiniciarse o recuperarse aunque se borre el tablero original.
- Traducidos al español y al euskera los nuevos controles y avisos.

**Almacenamiento:** `localStorage`. Los ejércitos (`xake:v1:armies`), los tableros (`xake:v1:scenarios`), la partida activa (`xake:v1:games`) y las preferencias (`xake:v1:preferences`) son independientes. El guardado del Hito 1/2 sigue siendo compatible.

## Ejecutar

Desde la raíz:

```bash
python -m http.server 8000
```

Visita `http://localhost:8000` o directamente `https://xake.osumi.es` si has publicado allí los archivos. **No abras `index.html` con `file://`**, porque las traducciones JSON y el Worker necesitan HTTP(S).

**Atención:** el almacenamiento local depende del origen. Una partida creada en `localhost` no aparecerá automáticamente en `xake.osumi.es` y viceversa. Por el momento no hay sincronización entre dispositivos ni importación/exportación; conviene no borrar los datos del sitio si se quiere conservar una configuración.

Al desplegar nuevas versiones, si Safari muestra una copia antigua de CSS o JS, recarga la página (o limpia la caché sin eliminar los datos del sitio).

## Pruebas automatizadas

```bash
node tests/chess.test.js
node tests/ai.test.js
node tests/editor.test.js
```

Actualmente son **52 pruebas** (16 + 14 + 22). Se ejecutan con Node.js solo en desarrollo; en el iPad basta abrir la web. Pruebas manuales detalladas en `docs/pruebas-hito1.md`, `docs/pruebas-hito2.md` y `docs/pruebas-hito3.md`.

## Estructura del proyecto

- `lib/chess.js`: motor propio de reglas y API ligera de búsqueda; JavaScript ES5. **No** es la biblioteca externa chess.js.
- `js/game.js`: partida, modo, FEN inicial, historial, reinicio y restauración.
- `js/ai.js` y `js/ai-worker.js`: IA y búsqueda en Worker.
- `js/board.js`: tablero de 64 casillas reutilizado para jugar y editar.
- `js/editor.js`: inventario, colocación, deshacer/rehacer, auto-distribución, validación y serialización.
- `js/editor-ui.js`: tres pasos del editor, biblioteca de ejércitos y tableros.
- `js/app.js`: menús, partidas, coordinación de IA y pantallas.
- `js/storage.js`: almacenamiento local versionado.
- `js/i18n.js` e `i18n/*.json`: textos y respaldo al español.
- `css/editor.css`: estilos táctiles y responsive sin CSS Grid moderno.

## Próximos hitos

Quedan por incorporar: **apariencias de piezas** seleccionables por bando, exportación/importación de ejércitos y tableros, biblioteca de varias partidas guardadas y el modo Retos. Primero conviene probar el Hito 3 en el iPad 3, especialmente la colocación manual, las posiciones con muchas piezas y las partidas personalizadas contra la máquina.

Documento original de diseño funcional: `docs/Xake_diseno_funcional_v0_3.md`. Estado de este bloque y recomendaciones de continuidad: `docs/estado-hito3.md`.
