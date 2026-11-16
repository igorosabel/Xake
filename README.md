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
- **Hito 8:** biblioteca **Mis partidas** para guardar varias partidas independientes, renombrarlas, continuarlas y eliminarlas. Migración automática de la antigua partida única sin borrar su copia histórica, y guardado automático de la partida seleccionada.
- **Hito 9:** modo **Aprender** con 15 ejercicios táctiles: movimientos, capturas, jaque, enroque y promoción. Progreso independiente en el navegador, instrucciones en español y euskera.

Los hitos 1–9 han sido probados por el usuario en el iPad 3 con Safari de iOS 9. El Hito 10 añade pruebas de estabilidad; su corrección queda pendiente de verificación física.

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

Con el Hito 10 son **198 pruebas automatizadas** (181 anteriores y 17 nuevas) repartidas en doce archivos. Ver los procedimientos manuales en `docs/pruebas-hito1.md` a `docs/pruebas-hito10.md`.

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
- `js/saved-games-ui.js`, `css/saved-games.css`: gestión de varias partidas guardadas.
- `js/learn.js`, `js/learn-ui.js`, `css/learn.css`: ejercicios educativos y progreso local independientes de las partidas.
- `js/i18n.js`, `i18n/*.json`: interfaz multilingüe con respaldo al español.

El almacenamiento es **local a cada dominio/dispositivo**: las partidas y los retos no se sincronizan. Exportar una copia JSON protege los ejércitos, tableros y retos creados, pero no incluye una partida activa ni la puntuación conseguida.

**Continuidad:** `docs/estado-hito10.md`. Diseño inicial: `docs/Xake_diseno_funcional_v0_3.md`.

## Hito 8: varias partidas guardadas

- En el menú, **Mis partidas** muestra una biblioteca de partidas con nombre, modalidad, número de jugadas, fecha y estado.
- La primera partida creada se denomina automáticamente (p. ej. «Partida clásica 1»); se puede **Cambiar nombre** desde la partida o la biblioteca.
- Se guardan y actualizan automáticamente los movimientos de **cada** partida. «Continuar partida» abre la última seleccionada; «Mis partidas» permite cambiar a otra.
- Los datos nuevos se almacenan en `xake:v2:games` con `schemaVersion: 2`. Si hay una partida antigua en `xake:v1:games`, se copia una sola vez al nuevo formato **sin borrar la clave anterior**. No borres manualmente el almacenamiento del navegador.
- Se mantienen independientes las reglas y el FEN inicial de cada partida personalizada, la IA, sus niveles y las apariencias.
- Las copias JSON del Hito 4/5 siguen incluyendo **ejércitos, escenarios y retos**, pero **no** partidas guardadas. No se ha implementado sincronización entre dispositivos.

## Hito 9: modo Aprender

- **15 ejercicios**: movimiento y captura de las seis piezas, más dar jaque, enroque corto y promoción de peón.
- Se selecciona primero la pieza y después una casilla; los movimientos son validados por el motor de Xake. No hay rival automático ni cálculos costosos.
- Los ejercicios tienen explicación, objetivo, pista opcional, posibilidad de reiniciar y acceso al siguiente.
- Al completar un ejercicio se recuerda mediante `xake:v1:learnProgress` (`schemaVersion: 1`). Este progreso no cambia ni sobrescribe las partidas guardadas ni se incluye en copias JSON.
- Las apariencias configuradas siguen aplicándose al tablero educativo. Los nuevos textos están en `i18n/es.json` y `i18n/eu.json`.
- Compatibilidad: ES5 y CSS básico con Flexbox, sin librerías ni APIs de navegador modernas.


## Hito 10: revisión de estabilidad

- Se verificó el funcionamiento de las pruebas existentes y la paridad de **280 traducciones** entre castellano y euskera, incluyendo parámetros interpolados.
- `js/i18n.js` ignora las respuestas `XMLHttpRequest` antiguas si el usuario cambia de idioma antes de que terminen; así se evita que una descarga tardía revierta la selección.
- La prueba `tests/i18n-stability.test.js` reproduce el fallo en el código anterior y comprueba la corrección, sin depender de la red.
- `tests/release-integrity.test.js` revisa recursos locales, imágenes, referencias, traducciones y orden de carga de módulos. También se verificó localmente la ausencia de sintaxis moderna incompatible con ES5 en los scripts de producción.
- No se modifican datos locales, formato de partidas, lógica de ajedrez, IA, retos, aprendizaje ni apariencia.
- El Hito 10 requiere una última validación en Safari del iPad 3 tras publicarlo. Después queda el repaso de diseño y estética reservado para el final.
