# Xake — Pruebas manuales del Hito 10

**Objetivo:** confirmar el endurecimiento de la internacionalización y la estabilidad del proyecto después del Hito 9, sin modificar partidas ni configuraciones.

## Pruebas automáticas

Desde la raíz:

```bash
npm test
```

Resultado esperado: **12 archivos y 198 pruebas correctas**. El workflow de GitHub Actions también ejecuta este mismo comando antes del despliegue.

Las dos nuevas baterías son `tests/i18n-stability.test.js` (8) y `tests/release-integrity.test.js` (9).

## Comprobación en Safari de iOS 9

1. Abrir `https://xake.osumi.es` en el iPad tras el despliegue. Comprobar que carga en castellano.
2. Cambiar varias veces entre **Español** y **Euskara**, también rápidamente. La pantalla debe mantener siempre el **último idioma elegido**. Los textos nuevos de Aprender, Mis partidas y Retos deben traducirse.
3. Cerrar Safari y volver a abrir la web. Verificar que persiste el idioma seleccionado.
4. Abrir **Mis partidas** y continuar una partida existente. Realizar una jugada, volver al menú y comprobar que se guarda normalmente.
5. Abrir **Crear tablero**, entrar al editor, seleccionar piezas y regresar al menú sin modificar los tableros guardados.
6. Resolver un reto de una jugada y otro de mate en dos; comprobar que las estrellas y ayudas siguen funcionando.
7. Abrir **Aprender**, repetir una lección y verificar que continúa marcada como completada.
8. Comprobar que las apariencias Clásico, Medallas y Emblemas no dejan piezas fantasma al mover, capturar o deshacer.
9. Si se utiliza la copia JSON, comprobar que puede prepararse una copia de las configuraciones actuales **antes** de probar cualquier importación. No es necesario importar la copia sobre el mismo dispositivo para esta validación.

## Qué no debe cambiar

- No se modifica ninguna clave de `localStorage` ni se migra el esquema de datos.
- No se incluye nuevo motor, dependencia npm, compilación ni función visual.
- El guardado de partidas, progreso y preferencias sigue siendo local al navegador. La copia JSON actual **no** incluye partidas en curso, estrellas ni lecciones completadas.

## Caché

Los archivos `js/i18n.js` y `js/app.js` de `index.html`, y los JSON descargados por i18n, llevan `?v=10.0.0`. Safari debe actualizar esos recursos sin borrar sus datos locales.
