# Xake — Estado del proyecto tras el Hito 4

**Repositorio:** https://github.com/igorosabel/Xake  
**Web de pruebas:** https://xake.osumi.es  
**Documento de diseño:** `docs/Xake_diseno_funcional_v0_3.md`

## Estado funcional

- Hito 1: ajedrez clásico, dos jugadores locales, reglas, guardado y recuperación; validado por el usuario en ordenador e iPad 3 / iOS 9.
- Hito 2: modo contra la máquina con cuatro dificultades, Web Worker, selección de color; validado por el usuario.
- Hito 3: ejércitos, posiciones editables, biblioteca de tableros, distribución automática, juego local y contra IA; validado por el usuario, incluidas configuraciones extravagantes.
- **Hito 4 (esta entrega):** dos nuevos conjuntos gráficos `Medallas` y `Emblemas` más `Clásico`; apariencia independiente por bando con persistencia por partida; exportación/importación JSON de ejércitos y tableros mediante copia y pegado.

## Arquitectura del Hito 4

Nuevos módulos ES5:

- `js/appearance.js`: complementa `Xake.Game`, `Xake.Board` y `Xake.EditorUI` sin alterar los módulos anteriores; inserta los selectores en menú y partida, aplica temas y guarda preferencias e instantáneas.
- `js/backup.js`: valida, exporta e importa colecciones versionadas `xake:v1:armies` y `xake:v1:scenarios`. No exporta partidas.
- `css/appearance.css`: estilos adicionales compatibles con Safari antiguo.
- `assets/pieces/medallas/` y `assets/pieces/emblemas/`: imágenes PNG originales; 12 por conjunto, seis tipos de pieza por cada color.

`instalar_hito4.py` añade referencias a `index.html` y textos a `i18n/es.json` y `i18n/eu.json`, conservando el resto.

## Persistencia y seguridad

- Preferencias de apariencia: `xake:v1:preferences`.
- Apariencia de la partida en curso: `whiteAppearance` y `blackAppearance` dentro de `xake:v1:games`.
- Exportación: `{format: "xake-config", schemaVersion: 1, exportedAt, armies, scenarios}`.
- Importación: tamaño limitado, validación de campos y FEN antes de escribir, identificadores regenerados, nunca sobrescribe los registros actuales. Si falla una escritura se intenta restaurar los datos anteriores.
- No se ejecuta código externo ni se interpolan los nombres importados mediante `innerHTML`.

## Pruebas

- **19 pruebas automatizadas nuevas**: temas, restauración de partidas, representación, exportar e importar, identificadores únicos, datos inválidos y fallos de almacenamiento.
- Sintaxis de ambos scripts comprobada con `node --check`.
- Instalador probado sobre un repositorio simulado dos veces seguidas, sin duplicar elementos.
- Ejecutar además los tres conjuntos anteriores del repositorio: `chess.test.js`, `ai.test.js` y `editor.test.js`. No se reejecutaron contra una copia íntegra del repositorio dentro del entorno de preparación.
- Pendiente: prueba real en el navegador del usuario y Safari del iPad 3.

## Próximos pasos

1. Verificar apariencias y biblioteca de copias con el iPad y la web publicada.
2. Mejorar el guardado para permitir varias partidas activas, si resulta útil.
3. Preparar el modo Retos con situaciones y objetivos.
4. Afinar accesibilidad, tamaño de controles, rendimiento, apariencia y documentación.

## Restricciones que se mantienen

- HTML/CSS y JavaScript ES5, sin paquetes instalados ni build.
- Safari iOS 9 / iPad 3 como dispositivo más exigente.
- Toques y selección de casillas sin arrastrar.
- Español por defecto; euskera opcional; traducciones JSON con respaldo español.
- Los usuarios ejecutan las pruebas y publican la web/repositorio.
