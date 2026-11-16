# Xake — Documento de continuidad tras Hito 6

**Proyecto:** https://github.com/igorosabel/Xake  
**Web:** https://xake.osumi.es  
**Fecha:** 15 de noviembre de 2026  
**Estado:** preparado para pruebas de usuario y publicación; el usuario ya validó los hitos 1–5 en el iPad 3.

## Objetivo del bloque

Ampliar el modo Retos con **mate forzado en dos jugadas** sin alterar las partidas clásicas, la IA, los ejércitos ni los seis retos anteriores. Se mantiene la estrategia de código ES5 sin dependencias y de entrega por bloques funcionales.

## Implementación

- Tres retos incluidos (`builtin-mate-two-1`, `-2`, `-3`): dos con blancas y uno con negras. Se mantienen los seis retos del Hito 5.
- Nuevo objetivo `mate2`, disponible también al crear un reto desde «Mis tableros».
- `js/mate-two.js`: analiza la primera jugada, **todas** las respuestas legales del rival y la posibilidad de dar mate en la siguiente jugada del jugador. Los mates inmediatos no cuentan como mates en dos. Se cachean hasta 16 análisis.
- El rival responde automáticamente con una de las defensas que dejan **menos opciones de mate** (desempate estable por notación de coordenadas). No utiliza el motor general de IA: la respuesta está comprobada por el analizador de retos.
- Se mantiene la entrada táctil, la promoción y el tablero `Xake.Board` con sus apariencias. Pistas independientes en ambos turnos, penalización por pistas y puntuación persistente.
- Los retos propios se validan antes de guardarse; las copias JSON los exportan/importan sin modificar `schemaVersion: 1`.
- Límite de complejidad del análisis `mate2`: hasta 6 piezas, 48 primeras opciones, 16 respuestas por opción, 1600 movimientos finales evaluados, 1600 ms de presupuesto por análisis. Un tablero no apto muestra un mensaje específico; los otros objetivos y las partidas normales no se ven limitados.

## Archivos afectados

**Nuevo:** `js/mate-two.js`, `tests/mate-two.test.js`, `docs/pruebas-hito6.md`, `docs/estado-hito6.md`.

**Actualizados:** `js/challenges.js`, `js/challenge-ui.js`, `index.html`, `i18n/es.json`, `i18n/eu.json`, `README.md`.

No se cambia `lib/chess.js`, `js/ai.js`, `js/board.js`, `js/appearance.js`, `js/storage.js` ni `js/backup.js`.

## Validación

- **116 pruebas Node:** 16 motor, 14 IA, 22 editor, 19 Hito 4, 12 regresión de imágenes, 18 Hito 5, 15 Hito 6.
- Chromium de prueba con recursos cargados en memoria: resolver mate2, respuesta automática, pista en ambos turnos, puntuación, guardar un reto nuevo, navegación y disposición en móvil. No aparecieron errores JS ni desbordamiento horizontal.
- **Pendiente:** ejecutar en Safari iOS 9 del iPad 3 y comprobar tiempos de respuesta.

## Trabajo posterior posible

- Otros objetivos tácticos (defender al rey, tablas, capturas en varias jugadas).
- Mejora de ayudas visuales y recompensas, según uso infantil real.
- Biblioteca de varias partidas guardadas, si resulta útil a la familia.
- Una versión asíncrona del validador de retos para analizar posiciones más grandes sin bloquear la pantalla (no es requisito para los retos actuales).

## Forma de trabajo

El usuario ejecuta las baterías, prueba en el iPad 3 y sube al repositorio/web; no se hacen cambios directos en GitHub. Mantener traducciones en JSON, código navegador ES5 y diseño por pulsaciones. Entregar archivos completos por bloques y actualizar documentos al cerrar hitos.
