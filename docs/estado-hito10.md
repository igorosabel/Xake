# Xake — Documento de continuidad tras el Hito 10

**Proyecto:** https://github.com/igorosabel/Xake  
**Web:** https://xake.osumi.es  
**Fecha:** 16/11/2026

## Estado confirmado por el usuario

- Hitos **1–9** implementados y probados físicamente en iPad 3 de 2012, Safari iOS 9.
- Github Actions publica automáticamente en Plesk tras un `push` a `main`, siempre que `npm test` termine correctamente.
- La prioridad del proyecto es mantener compatibilidad con JavaScript ES5, interfaz en español por defecto con opción euskera, tableros personalizados y experiencia táctil por pulsaciones, sin drag-and-drop.
- El usuario quiere realizar el **repaso visual y estético al terminar los hitos funcionales**.

## Alcance del Hito 10

Revisión de la estabilidad, sin ampliar funciones ni alterar formatos persistidos.

1. Revisión de las **181 pruebas** existentes y reejecución satisfactoria.
2. Paridad de las **280 claves de traducción** de `i18n/es.json` y `i18n/eu.json`, con parámetros equivalentes y sin claves `data-i18n` ausentes en `index.html`.
3. Validación de la existencia de recursos referenciados, 24 PNG de apariencias con firma correcta y orden de scripts en el HTML.
4. Auditoría local de sintaxis: no se encontraron `let/const`, funciones flecha, clases, literales template, `for...of` ni `await` entre los scripts de producción.
5. **Corrección confirmada** en `js/i18n.js`: peticiones HTTP de idiomas fuera de orden podían dejar textos de un idioma antiguo; se añade el contador `requestVersion` para ignorar respuestas obsoletas. La prueba de regresión falla en la versión anterior y pasa en la nueva.
6. Cambio de identificador de caché a **10.0.0** para `js/i18n.js`, `js/app.js` y JSON de idioma. No se modifican otros módulos productivos.

## Archivos modificados

- `js/i18n.js`
- `index.html`
- `README.md`

## Archivos nuevos

- `tests/i18n-stability.test.js` — 8 pruebas nuevas de HTTP asíncrono simulado y selección de idiomas.
- `tests/release-integrity.test.js` — 9 comprobaciones de traducciones, recursos, HTML y carga de módulos.
- `docs/pruebas-hito10.md` y `docs/estado-hito10.md`.

## Validación

- **198 pruebas** en 12 archivos, todas superadas (181 previas + 17 nuevas).
- Las pruebas solo necesitan Node.js y módulos incluidos en el propio repositorio; no requieren npm install.
- La corrección es compatible con ES5. No se ha ejecutado una prueba nueva en el dispositivo físico desde este entorno; la debe confirmar el usuario.

## Limitaciones conocidas y deliberadas

- `localStorage` es específico de cada navegador y dominio. No hay backend ni sincronización entre dispositivos.
- La exportación JSON incluye ejércitos, tableros y retos creados, pero no partidas guardadas ni progreso de Retos/Aprender. Es importante no borrar datos de Safari.
- La carga inicial de idiomas requiere HTTPS para obtener los JSON. Si falla una traducción, se aplica la reserva en español cuando esté disponible.
- Los retos de mate en dos mantienen los límites de búsqueda del Hito 6 para evitar bloquear el iPad.
- No se garantiza compatibilidad de características no probadas en otros Safari antiguos sin pruebas específicas.

## Siguiente fase

Tras probar la entrega en el iPad y publicar mediante GitHub Actions, dar el **Hito 10 por cerrado** y empezar la revisión **visual/estética** con los ajustes que el usuario ha ido reservando. Mantener las correcciones en bloques funcionales y el mismo proceso de tests y despliegue. No introducir nuevas funciones sin acordarlas.
