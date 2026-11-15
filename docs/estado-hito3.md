# Xake — Estado del proyecto tras el Hito 3

Fecha: 15 de noviembre de 2026. Repositorio: https://github.com/igorosabel/Xake. Despliegue de pruebas: https://xake.osumi.es.

## Hitos

- Hito 1: ajedrez clásico para dos jugadores. **Probado por el usuario en ordenador e iPad 3 (iOS 9)**.
- Hito 2: IA con cuatro niveles. **Probada por el usuario**; no se confirmó explícitamente en qué dispositivos se probó cada nivel.
- Hito 3: editor de ejércitos y tableros, validaciones y guardado local. **Implementado y probado automáticamente / en interfaz Chromium**; aún pendiente de prueba física en Safari iOS 9.

## Decisiones técnicas vigentes

- Aplicación estática HTML + CSS compatible con Safari iOS 9 + JavaScript ES5, sin dependencias de ejecución ni build.
- `lib/chess.js` es un motor **propio de Xake** ya utilizado por la IA. Mantenerlo como dependencia de la aplicación hasta decisión expresa de reemplazo.
- `js/editor.js` es modelo puro, independiente del DOM: inventario, tablero, undo/redo, validación, colocación automática y serialización.
- `js/editor-ui.js` es controlador de vistas: editor en tres pasos y biblioteca de tableros.
- Partida personalizada: el `initialFen` se mantiene en `js/game.js`, en los snapshots y tras reiniciar; se conserva aunque cambie o se elimine el escenario guardado.
- Enroque desactivado **al comenzar escenarios personalizados**; enroque clásico sigue funcionando en modo normal. No hay captura al paso inicial en escenarios personalizados; sí tras movimientos legales de peón.
- `localStorage`: `xake:v1:armies`, `xake:v1:scenarios`, `xake:v1:games`, `xake:v1:preferences`. Un solo juego activo actualmente. Español y euskera en JSON con fallback al español.
- Escenarios terminales guardables para edición, no para partida ordinaria; inventarios extraordinarios permitidos sin buscar equilibrio.

## Pruebas

- `tests/chess.test.js`: 16 pruebas.
- `tests/ai.test.js`: 14 pruebas.
- `tests/editor.test.js`: 22 pruebas.
- Total: **52 automatizadas**. Pruebas de interacción en Chromium: creación de ejércitos, autocolocación, validación, guardado, continuidad tras recarga simulada, cambio de idioma, duplicación/eliminación y juego con IA.
- Verificar manualmente en iPad 3 según `docs/pruebas-hito3.md`; medir la fluidez del nivel difícil con muchas piezas.

## Funcionalidades pendientes

1. **Hito 4:** apariencias visuales intercambiables por jugador, con licencia de recursos y fallback clásico.
2. Exportar/importar JSON de ejércitos y tableros; fundamental para hacer copias y trasladar configuraciones entre dispositivos.
3. Guardar varias partidas en lugar de solo la activa (hito posterior).
4. Modo Retos.
5. Si hace falta, refinar el algoritmo de distribución automática a partir de pruebas reales con los niños.

## Flujo de trabajo

El usuario ejecuta pruebas en el dispositivo, hace sus retoques, sube al repositorio `igorosabel/Xake`, y el siguiente bloque se prepara sobre lo publicado respetando sus cambios. Ofrecer archivos completos agrupados en una entrega, no un archivo por mensaje. Antes de trabajar sobre GitHub, volver a leer la rama `main` para evitar sobrescribir modificaciones del usuario.
