# Xake

Juego web de ajedrez y retos pensado para niños, compatible con Safari de **iOS 9** (iPad 3 de 2012) y navegadores modernos. Interfaz en español por defecto, con traducción a euskera. JavaScript ES5, sin frameworks, WebAssembly ni dependencias externas.

**Web de pruebas:** https://xake.osumi.es · **Repositorio:** https://github.com/igorosabel/Xake

## Funcionalidades implementadas

- **Hito 1:** ajedrez clásico para dos jugadores en el mismo dispositivo, movimientos legales, promoción, enroque, jaques y tablas. Selección por pulsaciones, sin arrastrar.
- **Hito 2:** cuatro niveles de juego contra la máquina, elección de color e IA calculada en Web Worker.
- **Hito 3:** ejércitos con piezas arbitrarias, editor de tableros táctil, colocación manual o automática, deshacer/rehacer y validación; guardar y jugar tableros personalizados.
- **Hito 4:** apariencias Clásico, Medallas y Emblemas por bando; copias JSON de ejércitos, tableros y retos creados. Se corrigió el fallo de imágenes fantasma.
- **Hito 5:** seis retos de una jugada: dar jaque, capturar una reina y mate en uno; pistas, estrellas y creación desde tableros guardados.
- **Hito 6:** tres retos de **mate en dos**; el rival responde automáticamente con una defensa legal. Para ganar hay que elegir una primera jugada que garantice mate tras **cualquier** respuesta y dar mate en el segundo turno. Se pueden crear desde tableros propios y guardar/exportar como los demás retos.

- **Hito 7:** ayudas visuales configurables y panel de piezas capturadas, actualizados al mover, deshacer o cambiar de apariencia.

Los hitos 1–6 han sido probados por el usuario en el iPad 3. El Hito 7 necesita su prueba física.

## Ejecución

Sirve la carpeta raíz por HTTP(S), por ejemplo:

```bash
python -m http.server 8000
```

Visita `http://localhost:8000` o publica los archivos en un servidor estático HTTPS. No abras `index.html` con `file://`: los JSON de idiomas y el Worker necesitan HTTP(S).

## Pruebas (un único comando)

Desde la raíz del proyecto:

```bash
npm test
```

Alternativamente, `node tests/run-tests.js`. No necesitas `npm install` ni dependencias npm. El ejecutor descubre automáticamente todos los archivos `tests/**/*.test.js`, los ejecuta uno por uno (aunque falle alguno), muestra un resumen y devuelve error si hay fallos.

Con el Hito 7 son **131 pruebas automatizadas** (116 anteriores y 15 nuevas) repartidas en ocho archivos. Ver los procedimientos manuales en `docs/pruebas-hito1.md` a `docs/pruebas-hito7.md`.

## Hito 6: comportamiento y límites

- El objetivo **«Mate en dos jugadas»** significa dos jugadas del jugador y **una respuesta del rival** en medio; no una secuencia donde el rival colabora.
- La primera jugada debe conducir al mate independientemente de cuál sea la defensa legal del contrario. Xake selecciona automáticamente una de las respuestas más resistentes, de forma determinista.
- Puede pedirse una pista para cada jugada; usar pistas reduce la puntuación a una estrella. Los fallos se cuentan por intento de solución, no por cada movimiento de la secuencia.
- Para proteger al iPad 3, la comprobación de un mate en dos solo analiza posiciones con hasta **seis piezas** y un número acotado de variantes y de tiempo. Si el escenario es demasiado complejo, el editor de retos informa de ello. Esto **no restringe** las partidas normales ni los demás objetivos de retos.
- Los retos personalizados siguen siendo autónomos y usan su propio FEN. Las copias JSON antiguas son compatibles y las nuevas incluyen el objetivo `mate2` sin modificar el formato de copia (`schemaVersion: 1`).

## Arquitectura

- `lib/chess.js`: motor propio, ES5 (no es el paquete externo chess.js).
- `js/board.js`, `js/game.js`, `js/app.js`: tablero, estado y coordinación.
- `js/ai.js`, `js/ai-worker.js`: IA en Worker.
- `js/editor.js`, `js/editor-ui.js`: ejércitos y tableros.
- `js/appearance.js`: apariencias por color.
- `js/challenges.js`, `js/challenge-ui.js`: retos y presentación.
- `js/usability.js`, `css/usability.css`: opciones visuales y capturas, sin modificar el motor.
- `js/mate-two.js`: análisis aislado de mate en dos con límites de complejidad y caché de resultados.
- `js/storage.js`, `js/backup.js`: persistencia versionada en `localStorage` e importación/exportación.
- `js/i18n.js`, `i18n/*.json`: interfaz multilingüe con respaldo al español.

El almacenamiento es **local a cada dominio/dispositivo**: las partidas y los retos no se sincronizan. Exportar una copia JSON protege los ejércitos, tableros y retos creados, pero no incluye una partida activa ni la puntuación conseguida.

**Continuidad:** `docs/estado-hito7.md`. Diseño inicial: `docs/Xake_diseno_funcional_v0_3.md`.
