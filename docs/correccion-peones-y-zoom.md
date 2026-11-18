# Xake — Corrección defensiva de peones y gestos de zoom

**Origen:** incidencias observadas por el usuario en el iPad 3 (Safari iOS 9).  
**Base comprobada:** `main`, árbol Git `4978b744c0d9eaa03df00e1f4fd78dd98ed3c912`.

## 1. Incidencia de peones

Se ha comunicado que, después de sacar un caballo de su casilla inicial, el peón situado delante podía retroceder a esa casilla y, además, promocionar.

**Límite del diagnóstico:** al reproducir el caso concreto `g1–f3`, `g8–f6`, el motor publicado en `main` **ya rechazaba** `g2–g1`, y el renderizado del tablero tampoco lo ofrece como destino. No se ha confirmado el origen exacto de la incidencia observada en el dispositivo.

La actualización añade controles defensivos a `lib/chess.js`:

- Al construir jugadas legales, nunca aceptar que un peón avance en dirección contraria a su color.
- Una promoción solo es posible en la octava fila para las blancas o en la primera para las negras.
- Antes de aplicar una jugada recibida por la API pública, comprobar nuevamente que el peón no retrocede.
- Preservar las reglas de los tableros personalizados, por ejemplo un peón negro ya situado en g2 sí puede promocionar normalmente en g1.

No se modifican las posiciones FEN, partidas guardadas, reglas del editor ni interfaz de promoción.

## 2. Zoom accidental en iPad 3

- `index.html`: `user-scalable=no`, `minimum-scale=1` y `maximum-scale=1` en el viewport. Safari de iOS 9 respeta estos ajustes.
- `css/board.css`: `touch-action: manipulation` en tablero y casillas para reducir el zoom por doble toque en navegadores compatibles.
- Nuevo `js/touch-guard.js`: cancela `gesturestart`/`gesturechange` (gestos WebKit) y toques simultáneos de dos o más dedos dentro de la aplicación.
- **No cancela** toques individuales ni eventos `click`, necesarios para mover las piezas o desplazarse normalmente por la página.

En versiones modernas de iOS el sistema puede permitir zoom por motivos de accesibilidad, al margen del `viewport`. La comprobación definitiva debe hacerse en los dispositivos.

## 3. Instalación

Copiar los archivos del ZIP en la raíz de Xake. Después ejecutar:

```bash
npm test
```

El HTML usa `v=13.0.0` para `lib/chess.js`, `css/board.css` y el nuevo módulo táctil, evitando recursos antiguos de Safari.

GitHub Actions publicará `index.html`, `js/`, `lib/` y `css/` automáticamente al subir los cambios a `main` si los tests pasan. No hay dependencias nuevas ni cambios de `localStorage`.

## 4. Prueba manual recomendada

1. Abrir una partida clásica de dos jugadores.
2. Mover el caballo blanco de **g1 a f3**; el negro de **g8 a f6**.
3. Seleccionar el peón blanco de **g2**: los únicos movimientos de avance disponibles son **g3 y g4**; no **g1**.
4. Tocar g1: no debe moverse el peón ni mostrarse el diálogo de promoción.
5. Tras otra jugada blanca, seleccionar el peón negro de g7: no debe ofrecer **g8**.
6. Probar capturas, movimientos dobles y una promoción legítima para comprobar que funcionan.
7. En Safari iOS 9 y en el acceso de inicio, hacer varios toques rápidos para seleccionar y mover piezas: no debe ampliarse la página.
8. Probar un gesto de pellizco con dos dedos sobre el tablero: tampoco debería producirse zoom.
9. Comprobar que un toque individual sigue seleccionando la pieza y la casilla de destino, y que se puede navegar por las pantallas.

Si el movimiento inverso reaparece, registrar **modalidad** (clásica o tablero propio), **color**, **casillas de origen y destino** y, si es posible, una captura de la posición antes de mover. Esto permitirá localizar la causa real sin restringir indebidamente los tableros personalizados.

## 5. Validaciones realizadas

- Batería completa: **17 archivos de tests correctos**, 252 comprobaciones (238 existentes + 14 nuevas).
- Nuevas pruebas: siete del motor de peones y siete del manejo táctil.
- Chromium: flujo real con caballos movidos, selección de g2 e intento de mover a g1, sin jugada ilegal ni promoción ni errores JavaScript.
- Safari real de iOS 9: **pendiente de comprobar por el usuario**.
