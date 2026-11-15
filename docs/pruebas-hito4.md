# Xake · Hito 4: apariencias y copias de seguridad

## Instalación

1. Descarga el ZIP del Hito 4 y **descomprímelo en la raíz de la copia local de tu repositorio Xake** (`index.html` debe quedar junto a `instalar_hito4.py`). Permite combinar las carpetas `js/`, `css/`, `assets/`, `docs/` y `tests/`.
2. Ejecuta `python instalar_hito4.py` (en Windows también `py instalar_hito4.py`). El instalador es idempotente: añade las referencias de `css/appearance.css`, `js/appearance.js` y `js/backup.js` en `index.html` y agrega las traducciones del Hito 4 a los JSON existentes, sin reemplazar las demás claves.
3. Ejecuta los tests del repositorio, y los nuevos del Hito 4:

   ```bash
   node tests/chess.test.js
   node tests/ai.test.js
   node tests/editor.test.js
   node tests/hito4.test.js
   ```

4. Publica **todos los archivos, incluidas las imágenes de `assets/pieces/`** en `https://xake.osumi.es`.

`instalar_hito4.py` modifica tres archivos existentes: `index.html`, `i18n/es.json` e `i18n/eu.json`. No altera ni sobrescribe `js/app.js`, `js/editor.js`, `js/game.js`, `js/board.js`, `js/storage.js` ni `lib/chess.js`. Revisa los cambios antes de subirlos a GitHub.

## Nuevas funciones

- Apariencias: `Clásico`, `Medallas` y `Emblemas`. Cada bando puede usar una diferente. Se pueden elegir desde el menú antes de jugar y durante la partida desde su panel lateral.
- Las apariencias elegidas para una partida se guardan con ella. Las preferencias para futuras partidas van en `xake:v1:preferences`.
- Las piezas del editor y los inventarios también muestran los temas elegidos.
- En **Mis tableros** aparece el bloque **Copia de seguridad**. Preparar copia JSON muestra un texto seleccionado para copiar; no se requieren APIs modernas de descargas o archivos.
- Al importar, Xake valida el formato completo **antes** de escribir los datos, añade copias nuevas con IDs diferentes, no sobrescribe los originales y solo importa **ejércitos y tableros**, no la partida en curso.

## Pruebas manuales, especialmente iPad 3 / iOS 9

1. Abrir inicio con preferencias vacías: ambas apariencias deben ser `Clásico`.
2. Elegir `Medallas` para blancas y `Emblemas` para negras. Iniciar partida clásica. Las piezas deben mostrar dibujos distintos según color. Comprobar que se leen bien y que el tablero sigue respondiendo a pulsaciones.
3. Hacer jugadas, cambiar la apariencia de las blancas durante la partida, guardar y salir. Pulsar **Continuar**: se deben mantener apariencias y posición.
4. Elegir tema diferente en menú y continuar la partida antigua: debe prevalecer la apariencia guardada **en esa partida**.
5. Crear un tablero nuevo, colocar piezas y comprobar que los dibujos aparecen en tablero y paleta.
6. En **Mis tableros**, preparar la copia JSON; copiar el texto y pegarlo en la zona de importar. Aceptar. Verificar que el original no desaparece y se crea una copia de cada ejército y tablero.
7. Repetir una importación: debe añadir copias nuevas sin sobrescribir las anteriores.
8. Comprobar la importación de un JSON incorrecto: aparece aviso; los datos previos no cambian.
9. Cambiar idioma a euskera y comprobar los textos nuevos; volver a castellano.
10. Recargar la web publicada y revisar que las imágenes cargan desde `assets/pieces/` (sin CDN).
11. En el iPad 3, verificar que **no hay retraso incómodo** al tocar piezas y que el editor, los controles y el texto JSON se pueden utilizar de forma práctica.

### Limitaciones conocidas

- El formato de exportación es **texto JSON para copiar/pegar**: deliberadamente no exige la API File o descargas de Safari modernas. Se puede añadir descarga de archivo para navegadores modernos más adelante.
- La copia JSON no incluye partidas activas ni preferencias de apariencia; estas se mantienen de forma independiente en el dispositivo.
- El almacenamiento local no sincroniza entre dispositivos. Antes de borrar datos de Safari, exporta las configuraciones.
- No se han probado aquí navegadores Safari físicos de iOS 9; esa prueba debe hacerse con el iPad real.
