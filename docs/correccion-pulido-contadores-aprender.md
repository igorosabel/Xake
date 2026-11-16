# Xake — Corrección puntual del pulido de interfaz (11.0.1)

Partimos de `main` tras la fase de pulido de interfaz (11.0.0). Se incluyen **archivos completos modificados**, sin instalador y sin tocar ninguna de las claves de guardado del juego.

## Cambios

1. **Crear tablero > contadores de piezas:** en Safari iOS 9 el centrado mediante `display: flex` aplicado directamente a un `<button>` puede dejar el texto horizontalmente a la izquierda. El botón recupera un `display: block` convencional con `text-align: center` y `line-height: 41px`, compatible con su tamaño externo de 45×45 px y bordes de 2 px. Se conserva su alineación vertical y el tamaño táctil.
2. **Configuración > Progreso de Aprender:** nueva opción «Restablecer lecciones completadas», con confirmación y mensaje de éxito. Únicamente borra `xake:v1:learnProgress`, la clave que declara `Xake.Learn.storageKey`. No se modifican las lecciones, los retos, las estrellas de Retos, las partidas, los ejércitos ni los tableros. Al volver a «Aprender» las 15 lecciones aparecerán pendientes. Si se cancela o falla el almacenamiento, no se anuncia éxito.
3. Traducciones en español y euskera. Las referencias de `index.html` y la versión de los JSON de idiomas pasan a `11.0.1` para evitar cachés obsoletas en Safari.
4. Se amplía la batería de `tests/ui-polish.test.js` con seis verificaciones específicas.

## Instalación

1. Descomprimir el ZIP en la raíz de Xake, sobrescribiendo los archivos incluidos.
2. Ejecutar `npm test` (13 baterías; 219 comprobaciones individuales).
3. Revisar los cambios en Git y hacer commit/push a `main`; GitHub Actions ejecutará la batería y desplegará si todo pasa.

## Comprobación en iPad 3

- [ ] En Crear tablero, con botones habilitados y deshabilitados, los signos `+` y `−` quedan en el centro horizontal **y vertical** de cada botón de 45×45.
- [ ] En Configuración existen dos apartados distintos: restablecer Retos y restablecer Aprender.
- [ ] Completar una lección, volver a Configuración y pulsar «Restablecer lecciones completadas»; cancelar debe conservarla.
- [ ] Confirmar el restablecimiento: al volver a Aprender todas las lecciones aparecen pendientes.
- [ ] Las estrellas de Retos, los retos propios y las partidas guardadas permanecen intactos.
- [ ] Cambiar a euskera: los títulos y avisos del nuevo apartado se traducen.

No se requiere ejecutar ningún script de instalación ni borrar el almacenamiento local del navegador.
