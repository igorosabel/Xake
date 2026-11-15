# Xake

Aplicación web de ajedrez para dos personas en el mismo dispositivo, diseñada para ser utilizable en Safari de **iOS 9** (iPad 3, 2012).

## Hito 1 · Tablero clásico

- Tablero táctil de 8×8, sin arrastrar: tocar pieza y destino.
- Movimientos legales, jaque, jaque mate, tablas, enroque, captura al paso y promociones.
- Deshacer, girar el tablero, reiniciar y volver al menú.
- Guardado automático de **una partida activa** en `localStorage` y opción de continuarla.
- Traducciones en `i18n/es.json` y `i18n/eu.json`, español como idioma inicial.
- HTML/CSS/JavaScript ES5 y sin proceso de compilación.

## Ejecutar

Sirve la carpeta raíz por HTTP con cualquier servidor estático. Por ejemplo, desde la raíz del proyecto:

```bash
python -m http.server 8000
```

Abre `http://localhost:8000` en el ordenador. Desde el iPad, usando la misma red Wi-Fi, abre `http://IP_DEL_ORDENADOR:8000` (configura el cortafuegos si corresponde). Para publicarlo, utiliza HTTPS.

No abras `index.html` con `file://`: las traducciones JSON se cargan mediante `XMLHttpRequest`.

## Pruebas

```bash
node tests/chess.test.js
```

Las pruebas no requieren `npm install`.

## Estructura

- `lib/chess.js`: motor de reglas ES5 autónomo, con interfaz utilizada por Xake y sin dependencia de red.
- `js/game.js`: estado de la partida, deshacer, restauración, fin de partida.
- `js/board.js`: representación y eventos de las 64 casillas.
- `js/app.js`: navegación, interacción, promoción y controles.
- `js/i18n.js`: traducciones JSON con fallback a español.
- `js/storage.js`: datos de partida y preferencias en `localStorage`.

**Nota técnica:** inicialmente se había propuesto `chess.js 0.10.3` de terceros. Este paquete entrega en cambio un motor ES5 autónomo pequeño con una API equivalente en lo que utiliza el hito 1; **no debe confundirse con el paquete oficial chess.js**. Su sustitución por la biblioteca externa sigue siendo posible sin reescribir el tablero gracias a la separación `game.js`/`board.js`.

## Alcance no incluido

Todavía no hay IA, editor de ejércitos, tableros personalizados, importación/exportación, conjuntos visuales alternativos ni guardado de múltiples partidas. Los archivos vacíos `js/ai.js`, `js/ai-worker.js`, `js/editor.js`, `css/editor.css` existentes en el repositorio quedan reservados para hitos posteriores.

## Compatibilidad

Se ha comprobado sintaxis de JavaScript ES5 y reglas en Node, pero la prueba definitiva de renderizado y tactilidad debe hacerse **en el iPad 3 físico con Safari de iOS 9**.
