# Xake — Pulido de interfaz (tras Hito 10)

**Repositorio:** https://github.com/igorosabel/Xake  
**Web:** https://xake.osumi.es  
**Base revisada:** main, 16/11/2026; Xake ES5, Safari iOS 9.

## Objetivos y decisiones

1. Configuración general independiente de la portada: idiomas y aspecto de las piezas (blancas y negras). Los valores quedan en `xake:v1:preferences`; las partidas nuevas los heredan. Modificar la apariencia **durante una partida** guarda el cambio únicamente en esa partida, sin alterar el ajuste general.
2. Portada sin titular «¿Jugamos al ajedrez?» ni introducción. Se elimina también el aviso obsoleto «Próximamente...».
3. Barra de pestañas **con iconos SVG integrados**, accesibles por `title` y `aria-label`, y sin recursos externos: Controles, Apariencia y Ajustes siempre; Capturadas y Movimientos solo cuando se activan. Se abre en Controles al empezar o recuperar una partida.
4. En Ajustes de partida se mantienen los tres checks anteriores y se añaden «Mostrar piezas capturadas» y «Últimos movimientos». Esas dos opciones comienzan desactivadas si nunca se han configurado; su valor persiste por dispositivo. Las capturas y los movimientos **no se borran** al ocultar sus pestañas.
5. Editor: signos `+`/`−` centrados por Flexbox; Cargar/Eliminar guardado desactivados sin ejército seleccionado.
6. «Mis tableros»: Dos jugadores y Contra la máquina a la izquierda; Editar/Duplicar/Eliminar son iconos a la derecha, con etiqueta accesible. Importar copia está desactivado mientras el texto esté vacío o contenga solo espacios.
7. «Retos»: botón de restablecer puntuaciones en Configuración. Solo borra `xake:v1:challengeProgress`; **no elimina retos propios**, tableros, ejércitos ni partidas. «Guardar reto» está desactivado si nombre, escenario u objetivo no son válidos. La existencia de una solución se comprueba al guardar, no en cada pulsación: es un cálculo potencialmente costoso en el iPad 3.
8. «Mis partidas»: Continuar a la izquierda y Cambiar nombre/Eliminar como iconos a la derecha.

## Arquitectura

- **Nuevo:** `js/ui-polish.js`, `css/ui-polish.css`, `tests/ui-polish.test.js`.
- **Actualizados por instalador:** `index.html`, `js/appearance.js`, `js/i18n.js`, `i18n/es.json`, `i18n/eu.json`.
- No se modifica motor, IA, validación de reglas ni formato de los datos de `localStorage`.
- Adaptaciones CSS/JS ES5 para iPad 3 con iOS 9; sin CSS Grid, `gap` de Flexbox, imports ni WebAssembly.
- Los SVG de iconos están incluidos en el JS, no hay imágenes ni bibliotecas nuevas.
- El instalador `instalar_pulido.py` usa sustituciones conservadoras y se puede ejecutar dos veces sin duplicar referencias. No es necesario subirlo a GitHub después de ejecutarlo.

## Validación previa a la entrega

- Reconstituida la versión completa anterior y aplicadas las modificaciones.
- `npm test`: **213/213 comprobaciones, en 13 archivos**, todas correctas (198 previas + 15 nuevas).
- `instalar_pulido.py` ejecutado dos veces sin efectos duplicados.
- Chromium: flujo real en 1024×768 y 390×844: Configuración, valores predeterminados, pestañas opcionales, editor, biblioteca de tableros, importación, retos y partidas guardadas.
- Cambio de idioma a euskera y regreso al juego sin errores.
- Sin errores JavaScript ni desbordamiento horizontal en las comprobaciones anteriores.
- **Pendiente:** prueba física de Safari iOS 9 en el iPad 3.

## Estado posterior

Después de validar esta entrega en el iPad, el usuario realizará el repaso final de diseño y pequeños detalles. No comenzar un nuevo hito funcional salvo petición explícita.
