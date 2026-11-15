# Xake — Documento de continuidad tras Hito 5

**Proyecto:** https://github.com/igorosabel/Xake · web: https://xake.osumi.es
**Fecha:** 15/11/2026

## Estado

Los hitos 1–4 están probados por el usuario en su iPad 3 con Safari de iOS 9: ajedrez clásico, IA de cuatro niveles, ejércitos/tableros personalizados, apariencias y copias JSON. El problema de «piezas fantasma» de Emblemas/Medallas se corrigió y quedó verificado por el usuario.

Se incorpora **Hito 5 — Retos de una jugada**, pendiente únicamente de que el usuario lo pruebe y publique en su repositorio/web.

## Hito 5 implementado

- Nuevo acceso `Retos` en el menú principal.
- Seis ejercicios incorporados: dos de jaque, dos de captura de reina y dos de mate en una jugada. Todos con una solución legal en la posición inicial.
- Tablero reutilizando `Xake.Game` y `Xake.Board`; render de apariencias heredado del Hito 4. La posición puede comenzar con negras (tablero orientado automáticamente).
- Evaluación del **primer movimiento legal**: reto resuelto o fallo + reintento; sin respuesta de la IA, porque son retos de una jugada.
- Pistas y valoración: 3 estrellas sin fallos ni pistas; 2 tras uno o más intentos fallidos sin pistas; 1 con pista. Se guarda la mejor puntuación localmente.
- Creación de retos a partir de `Mis tableros` y uno de los tres objetivos. Antes de guardar se verifica la legalidad del escenario y que existe al menos una jugada que cumple el objetivo. No se pueden guardar retos sin solución.
- Los retos conservan su propio FEN y sobreviven a la eliminación del escenario original.
- Claves nuevas `xake:v1:challenges` (colección) y `xake:v1:challengeProgress` (estrellas, no transferidas).
- Exportación/importación JSON de ejércitos, escenarios **y retos creados** mediante el módulo existente `backup.js`. Las copias antiguas sin campo `challenges` se aceptan; las nuevas no incluyen partidas en curso ni puntuaciones. La importación renombra IDs y enlaza las copias de retos con sus nuevos escenarios cuando procede, con reversión ante errores de almacenamiento.
- Internacionalización es/eu en JSON; ejecución con ES5, sin WebAssembly ni dependencias nuevas.

## Archivos afectados

- `index.html`, `js/app.js`, `js/backup.js`, `js/i18n.js`, `i18n/es.json`, `i18n/eu.json`, `README.md` (actualizados).
- `js/challenges.js`, `js/challenge-ui.js`, `css/challenges.css`, `tests/challenges.test.js` (nuevos).
- `docs/pruebas-hito5.md`, `docs/estado-hito5.md` (nuevos).

## Validación realizada

101 pruebas Node: 16 motor, 14 IA, 22 editor, 19 Hito 4, 12 regresión de apariencias, 18 Hito 5. Navegador Chromium: resolver mate, fallo/reintento, pista, estrellas, crear reto desde tablero, exportar JSON, volver a la partida clásica, controles móviles sin desbordamiento. Todo satisfactorio.

**Pendiente de validación física:** Safari iOS 9 y rendimiento en iPad 3.

## Trabajo futuro (no incluido)

- Nuevos objetivos: mate en dos jugadas, capturas alternativas, defensa del rey, finales.
- Edición o duplicación directa de retos creados (de momento pueden eliminarse y volver a crearse desde un tablero).
- Gestión opcional de puntuaciones entre dispositivos; por ahora son locales.
- Mejoras visuales de recompensas, sonido y ayudas infantiles según prueba con los niños.

## Forma de trabajo

Entregar bloques funcionales completos, con archivos afectados y pruebas. El usuario ejecuta las baterías, prueba en iPad 3 y sube cambios a GitHub y https://xake.osumi.es. No sobrescribir cambios propios no relacionados. Primero verificar compatibilidad con el iPad y evitar características de JS/CSS posteriores a iOS 9.
