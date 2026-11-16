# Xake — Documento de continuidad tras el Hito 8

**Proyecto:** https://github.com/igorosabel/Xake · **Web:** https://xake.osumi.es  
**Fecha:** 16/11/2026

## Estado actual

- Los hitos **1–7** están implementados, con pruebas automatizadas satisfactorias y confirmación del usuario en Safari de **iOS 9 (iPad 3, 2012)**. Incluyen ajedrez clásico, IA de cuatro niveles, editor de ejércitos y tableros, apariencias independientes, copias JSON, retos de una y dos jugadas, y ayudas visuales.
- **Hito 8 — Biblioteca de partidas múltiples** implementado y validado con tests Node y Chromium a tamaño iPad. Falta prueba en el iPad real por el usuario antes de cerrarlo.
- El usuario realiza los retoques y publica en GitHub/web. No se hacen modificaciones directas en el repositorio.

## Funcionalidad del Hito 8

- El acceso **Mis partidas** permite ver varias partidas guardadas con **nombre, modalidad, escenario, dificultad (contra IA), número de movimientos, fecha de última actualización y estado en curso/finalizado**.
- Botones **Continuar**, **Cambiar nombre** y **Eliminar** por partida; la eliminación solicita confirmación.
- Cada nueva partida crea una entrada independiente y las jugadas actualizan esa entrada (incluidos cambios de apariencia, deshacer y reiniciar). La opción «Continuar partida» conserva la última seleccionada.
- Desde la partida se puede cambiar el nombre; al crearla se asigna automáticamente uno distinto sin imponer un diálogo a los niños.
- Los snapshots existentes de `Xake.Game` siguen siendo autónomos: posición inicial/FEN, historial, modo, dificultad, jugador humano, apariencia, referencia informativa a escenario. No cambia el motor de reglas.
- Se preservan la interfaz castellana/euskera, controles por pulsaciones, CSS y JavaScript compatibles con iOS 9.

## Esquema de almacenamiento y migración

**Antes:** `xake:v1:games` (`schemaVersion: 1`, campo `current`, una partida).

**Ahora:** `xake:v2:games` (`schemaVersion: 2`, `activeId`, `items`), donde cada elemento contiene `id`, `name`, `createdAt`, `updatedAt`, `finished` y `game` (el mismo snapshot de antes).

La primera lectura tras instalar Hito 8 **copia** la partida antigua si no existe la nueva colección, pero **no borra ni modifica** `xake:v1:games`. Al existir `xake:v2:games`, no se repite la migración aunque se borren todas las partidas nuevas. Si la cuota de `localStorage` impide crear una partida nueva, no se sobrescribe la anterior. La colección se escribe mediante una única escritura y se rechaza el JSON corrupto sin destruirlo. No limpiar datos del sitio al actualizar.

**Importante:** `js/backup.js` no se ha modificado; el JSON exportable incluye ejércitos, tableros y retos, pero **no partidas** ni puntuaciones. La migración se realiza **por navegador/origen**, no sincroniza dispositivos.

## Archivos

Modificados:

- `index.html` — pantalla «Mis partidas», botón menú, renombrar dentro de partida, carga de CSS/JS y versiones de caché.
- `js/storage.js` — biblioteca versionada y migración sin pérdida.
- `js/app.js` — nueva partida independiente, metadatos de estado y navegación.
- `js/i18n.js`, `i18n/es.json`, `i18n/eu.json` — internacionalización y versión de traducciones.
- `README.md`, `package.json` (versión 0.8.0).

Nuevos:

- `js/saved-games-ui.js`, `css/saved-games.css` — interfaz y acciones de biblioteca.
- `tests/saved-games.test.js` — 24 casos de migración, independencia, nombres, borrado, estado y errores de escritura.
- `docs/pruebas-hito8.md`, `docs/estado-hito8.md`.

## Validación

- `npm test`: **155 pruebas** en **9 archivos**, todas superadas (131 anteriores + 24 nuevas).
- Prueba guiada en Chromium (tamaño 1024×768, recursos servidos en memoria por restricciones de red del entorno): crear dos partidas con diferentes jugadas, renombrar la primera, recuperar su historial, eliminarla y conservar la otra; sin errores JS ni desbordamiento horizontal.
- **Pendiente:** Safari real iOS 9; revisar botón Mis partidas, migración de la partida existente, alternar, renombrar, eliminar, cambiar apariencias, reiniciar y volver a abrir la web.

## Próximos pasos

Tras aprobación del Hito 8: considerar **Hito 9, modo Aprender** opcional, con pequeñas lecciones de movimientos de piezas y ejercicios fáciles; después **cierre de estabilidad** antes de la ronda de retoques estéticos que ha decidido posponer el usuario.

## Forma de trabajo

Entregas agrupadas y completas de archivos nuevos o modificados, tests con `npm test`, revisión del usuario en iPad 3 y publicación por él en GitHub + web. No cambiar el motor ni introducir nuevas dependencias innecesarias.
