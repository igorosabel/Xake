# Xake — Continuidad tras el Hito 9

**Proyecto:** https://github.com/igorosabel/Xake  
**Web:** https://xake.osumi.es  
**Fecha:** 16/11/2026

## Estado conocido

- Hitos **1–8** implementados, con pruebas automatizadas satisfactorias y verificados por el usuario en el iPad 3 con Safari iOS 9.
- Despliegue automático funcionando mediante GitHub Actions: `push` a `main` → `npm test` → subida por SCP a Plesk si las pruebas pasan.
- El usuario quiere dejar el repaso estético y de diseño para después de los hitos funcionales.

## Hito 9: Aprender ajedrez

El modo educativo se integra como pantalla independiente «Aprender» desde el menú inicial. Ofrece **15 ejercicios estáticos**:

- 12 ejercicios: movimiento y captura de peón, torre, alfil, caballo, reina y rey.
- 3 ejercicios especiales: dar jaque con una torre, enroque corto y promoción de peón con selección de pieza.
- Explicación textual del movimiento de cada pieza, descripción del objetivo, posibles destinos legales y pista que resalta origen/destino.
- Al completar un ejercicio se marca en `xake:v1:learnProgress`; repetirlo no duplica el progreso. Si falla el guardado, se avisa.
- Sin rival automático, sin Web Worker y sin cálculos largos; la jugada se valida con el motor real de Xake.
- La interfaz mantiene selección por pulsaciones y apariencias del tablero. Internacionalización en `es.json` y `eu.json` con español por defecto.
- Se mantiene fuera de las copias de seguridad JSON, al igual que las puntuaciones del modo Retos, y no toca partidas guardadas.

## Archivos nuevos

- `js/learn.js`, `js/learn-ui.js`, `css/learn.css`
- `tests/learn.test.js`
- `docs/pruebas-hito9.md`, `docs/estado-hito9.md`

## Archivos actualizados

- `index.html`: botón, pantalla educativa, CSS y scripts versionados.
- `js/app.js`: inclusión de la nueva pantalla en la navegación y actualización de textos al cambiar idioma.
- `js/i18n.js`: versión 9.0.0 para la carga de JSON (previene cachés de Safari).
- `i18n/es.json`, `i18n/eu.json`: nuevos textos.
- `README.md`: funciones y documentación.

## Validación realizada

- `npm test`: **181 pruebas** en diez archivos: 155 existentes + 26 de lecciones y progreso, superadas.
- Comprobación de interfaz en Chromium usando archivos en memoria: tamaños de 1024×768 y 390×844, peón, enroque, promoción, conservación de progreso y partida clásica. No hubo errores JavaScript ni desplazamiento horizontal.
- **Pendiente:** prueba física en iPad 3 y publicación mediante el workflow.

## Próximos pasos

1. Confirmar que el Hito 9 funciona físicamente en Safari iOS 9.
2. **Hito 10**: revisión funcional final, estabilidad, almacenamiento y traducciones.
3. Repaso estético y mejoras de experiencia indicadas por el usuario; no anticiparlas durante la revisión funcional salvo defectos.

## Forma de trabajo

Bloques funcionales completos, entrega de archivos y pruebas. El usuario ejecuta `npm test`, prueba en iPad, hace `push` y GitHub Actions despliega. No modificar código no relacionado y mantener código ES5.
