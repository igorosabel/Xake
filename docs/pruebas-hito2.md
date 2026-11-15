# Xake — Comprobaciones del hito 2 (IA)

## Pruebas automatizadas

```bash
node tests/chess.test.js
node tests/ai.test.js
```

Se comprueban los movimientos del motor y la IA: cuatro niveles con jugadas legales, mate en una jugada, búsqueda con estado reversible, ambos colores, deshacer de turnos, restauración de partidas de los dos modos, formato de guardado anterior, errores de guardado, posiciones no tradicionales, comunicación con Worker simulada y descarte de respuestas canceladas.

## Pruebas manuales en ordenador e iPad 3 (iOS 9)

1. Abrir Xake usando HTTP(S). En el menú deben aparecer **Dos jugadores** y **Contra la máquina**.
2. Pulsar **Contra la máquina**, elegir **Principiante** y **Blancas**, y comenzar. Comprobar que la máquina contesta automáticamente tras cada jugada y nunca mueve durante el turno humano.
3. Volver al menú, iniciar otra partida seleccionando **Negras**. La máquina debe comenzar con las blancas y el tablero debe mostrar las negras abajo.
4. Probar los cuatro niveles. **Normal** y **Difícil** pueden pensar más tiempo, pero nunca deben congelar los controles táctiles. Se debe mostrar «La máquina está pensando…» cuando corresponda.
5. Mientras la máquina piensa, pulsar **Guardar y salir**. Volver con **Continuar partida**: debe retomarse la partida y, si era turno de la IA, debe volver a calcular.
6. Jugar una jugada y recibir la respuesta de la IA. Pulsar **Deshacer**: debe volver al turno anterior del humano (normalmente se deshacen las dos jugadas).
7. Como negras, confirmar que no se puede deshacer la primera jugada blanca de la máquina hasta hacer una jugada propia.
8. Probar **Reiniciar partida**: se conserva modalidad, dificultad y color. Si el humano juega con negras, la IA debe abrir de nuevo.
9. Cambiar idioma desde el menú. Niveles, botones y estados deben traducirse y el idioma debe conservarse tras actualizar la página.
10. Comprobar que una partida de dos personas guardada con el hito 1 sigue cargando correctamente y que el modo «Dos jugadores» funciona sin intervención de la máquina.
11. En el iPad 3, comprobar que el tablero responde a los toques incluso mientras la máquina calcula. Anotar si una jugada tarda excesivamente o si aparece algún error en pantalla.

## Comportamiento y limitaciones deliberadas

- Los niveles no están calibrados contra Elo; Difícil busca más profundamente que Normal, pero no es un motor profesional.
- La IA realiza búsquedas cortas con límites; puede utilizar un resultado de profundidad inferior si se agota el tiempo. En navegadores sin soporte de Worker, la búsqueda se reduce para evitar congelar el tablero.
- Solo se guarda una partida activa. Crear una nueva sustituye la anterior **después de confirmar**.
- Se necesita verificar el rendimiento real en el iPad 3 antes de cerrar el hito 2. El hecho de que la IA supere pruebas Node/Chromium no certifica por sí solo Safari de iOS 9.
