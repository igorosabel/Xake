# Xake — Documento de continuidad tras el Hito 7

**Proyecto:** https://github.com/igorosabel/Xake · Web: https://xake.osumi.es  
**Fecha:** 16/11/2026

## Situación actual

Los hitos 1–6 han sido probados por el usuario en el iPad 3 (2012, iOS 9), con los tests superados. La última entrega de Hito 6 amplió el modo Retos con mates forzados en dos jugadas. El Hito 7 se entrega para su prueba física en Safari antiguo; no se ha subido todavía por el asistente a GitHub ni al servidor.

## Hito 7: mejoras de usabilidad

1. **Piezas capturadas** en la pantalla de partida: listas separadas por bando captor, con símbolos de las piezas tomadas o sus imágenes de la apariencia seleccionada, y contadores para capturas repetidas. Se calcula a partir de `Game.history()` (por tanto, funciona al deshacer, reiniciar y restaurar partidas, y también en partidas personalizadas). Incluye capturas al paso y respeta los cambios de apariencia. No modifica partidas ni su formato de guardado.
2. **Ayudas visuales configurables:** mostrar u ocultar los puntos de movimientos legales, el resalte de la última jugada y las coordenadas. Se activan por defecto, de forma que las partidas anteriores mantienen su aspecto. Las preferencias se escriben junto a las ya existentes en `xake:v1:preferences`; se aplican al tablero de partida, el tablero del editor y el tablero de retos. La selección de piezas y las reglas funcionan independientemente de estos controles.
3. Textos en `i18n/es.json` y `i18n/eu.json`. `js/i18n.js` solicita la versión 7.0.0 de los JSON para evitar que el Safari antiguo reutilice una traducción de la caché.
4. Diseño CSS compatible con iOS 9 (Flexbox con prefijos, sin Grid ni variables CSS), con paneles añadidos en la zona lateral de la partida. No se incluyen sonidos ni animaciones.
5. **Comando único de pruebas:** `npm test` (o `node tests/run-tests.js`). Recorre de manera recursiva todos los `*.test.js` dentro de `tests/`, en orden estable, y muestra el resultado global. Se añade `package.json` sin dependencias. Todas las pruebas se ejecutan incluso si alguna falla, y la salida es distinta de cero ante un error.

## Archivos nuevos

- `package.json`
- `tests/run-tests.js`
- `js/usability.js`
- `css/usability.css`
- `tests/usability.test.js`
- `docs/estado-hito7.md`, `docs/pruebas-hito7.md`

## Archivos modificados

- `index.html` — referencias versionadas de `js/i18n.js`, `js/usability.js` y `css/usability.css`.
- `js/i18n.js` — URLs con versión para cargar los JSON.
- `i18n/es.json`, `i18n/eu.json` — textos del Hito 7.
- `README.md` — comandos y estado actual.

No se modifican motor, IA, reglas del editor, retos, apariencias, persistencia ni copia JSON. Los cambios se apoyan en el renderizado ya existente del tablero.

## Validación

- `npm test`: 131 pruebas correctas repartidas en 8 archivos (116 anteriores + 15 del Hito 7).
- Comprobado un fallo artificial para verificar que `tests/run-tests.js` termina con código de error y aun así ejecuta las demás pruebas.
- Chromium, tamaños iPad (1024 × 768) y móvil (390 × 844), cargando recursos directamente para superar las restricciones de red del entorno: partida con captura, opciones visuales activadas/desactivadas, sin errores JavaScript ni desbordamiento horizontal.
- Pendiente: prueba en el dispositivo físico iPad 3 con Safari de iOS 9 y publicación en https://xake.osumi.es.

## Trabajo posterior posible

- Mejorar legibilidad, tamaño y distribución de paneles a partir de la experiencia de los niños en el iPad 3.
- Más retos educativos: defensa del rey, capturas específicas, finales.
- Ayuda contextual infantil, tutorial inicial o mensajes explicativos.
- Evitar nuevas dependencias o carga gráfica innecesaria; seguir usando ES5.

## Forma de trabajo

Entregar bloques funcionales completos (archivos afectados + tests + estado), sin editar directamente el repositorio por defecto. El usuario ejecuta `npm test`, prueba en iPad, publica y sube a GitHub; después se continúa con el siguiente bloque. No se sobrescriben retoques del usuario no relacionados.
