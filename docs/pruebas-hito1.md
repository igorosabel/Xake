# Xake — Comprobaciones del hito 1

## Automatizadas

Desde la raíz del repositorio:

```bash
node tests/chess.test.js
```

Las pruebas cubren tablero inicial, jugadas ilegales, capturas, deshacer, mates, enroques, captura al paso legal y prohibida por jaque descubierto, promociones, ahogado, tablas por material/repetición/50 movimientos, FEN, restauración y traducciones.

## Prueba manual en ordenador

1. Servir por HTTP con `python -m http.server 8000`.
2. Abrir el navegador en `http://localhost:8000`.
3. Pulsar «Nueva partida clásica». Comprobar que las blancas están abajo, la dama blanca en d1 y la casilla h1 es clara.
4. Tocar e2: deben marcarse e3 y e4. Tocar e4: debe moverse el peón y cambiar el turno a negras.
5. Pulsar «Deshacer»: el peón debe volver a e2.
6. Pulsar «Girar tablero»: las negras deben quedar abajo y las piezas conservar sus posiciones.
7. Hacer varias jugadas, pulsar «Guardar y salir», cerrar y abrir la página, y escoger «Continuar partida».
8. Cambiar de idioma entre español y euskera desde el menú, y comprobar que se conserva tras recargar.
9. Reiniciar partida y comprobar que se solicita confirmación.
10. Jugar un mate del loco o del pastor; comprobar que no se permiten más jugadas tras el mate, pero sí deshacer.

## Prueba manual en iPad 3 / Safari iOS 9 (pendiente)

- Abrir Xake desde una dirección HTTP(S) accesible por Wi-Fi; no usar `file://`.
- Comprobar modo apaisado (tablero a la izquierda, controles a la derecha) y vertical (tablero arriba).
- Confirmar que no existe desplazamiento horizontal involuntario y que cada casilla responde a una pulsación.
- Comprobar que se pueden seleccionar peones, caballos, piezas en la última fila y girar el tablero.
- Probar deshacer, reiniciar, menú y una partida de más de 20 movimientos.
- Cerrar Safari por completo, reabrir y comprobar que la partida e idioma siguen guardados.
- Verificar que no se congela la interfaz ni aparecen cuadros en blanco en lugar de las piezas Unicode.
- Si falla una operación, anotar qué pantalla, pulsación y mensaje produjo el problema.

## Alcance y notas

El motor integrado es una implementación ES5 ligera con la API necesaria para este primer bloque. La biblioteca de terceros `chess.js 0.10.3` que figuraba como candidata en el diseño **no está incluida** en esta entrega; antes de ampliar las reglas para el editor personalizado valoraremos fijar el motor definitivo.

Este hito guarda **una única partida activa**, no un historial de partidas. La IA, los ejércitos personalizados, la importación/exportación y los diseños de piezas quedan fuera.
