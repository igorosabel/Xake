# Xake

Aplicación web de ajedrez infantil para Safari de **iOS 9** (iPad 3, 2012) y navegadores modernos. La interfaz funciona en castellano por defecto y puede cambiarse a euskera.

## Funcionalidades implementadas

**Hito 1 — Tablero clásico (validado en iPad 3):**

- Dos personas en el mismo dispositivo, sin arrastrar: tocar pieza y después destino.
- Movimientos legales, enroque, captura al paso, promociones, jaque, mate y tablas.
- Deshacer, girar tablero, reiniciar, guardar y continuar una partida.

**Hito 2 — Contra la máquina (pendiente de validación en iPad físico):**

- Elegir blancas o negras y cuatro dificultades: Principiante, Fácil, Normal y Difícil.
- Principiante realiza jugadas aleatorias legales; Fácil valora material con errores deliberados; Normal utiliza búsqueda de dos medios movimientos; Difícil busca hasta tres.
- Búsqueda en `Web Worker` independiente y con un tiempo máximo por turno. Si el Worker falla o no está disponible, se elige una jugada legal con un cálculo limitado en el hilo principal.
- El jugador no puede mover las piezas de la máquina. Deshacer en este modo retrocede también la respuesta del ordenador; el movimiento inicial de la máquina no se puede deshacer hasta que juegue la persona.
- Se conserva una única partida activa en `localStorage`. Los guardados del hito 1 siguen siendo compatibles.

Los niveles son **orientativos**; no están calibrados en Elo ni utilizan Stockfish.

## Ejecutar

Desde la raíz del repositorio:

```bash
python -m http.server 8000
```

Abre `http://localhost:8000` en el ordenador, o `http://IP_DEL_ORDENADOR:8000` desde el iPad conectado a la misma red Wi-Fi. El cortafuegos debe permitir el acceso al puerto. Para publicar en internet, utiliza HTTPS.

No abras la aplicación mediante `file://`: las traducciones JSON y el `Web Worker` necesitan ejecutarse desde HTTP(S). No hacen falta `npm install`, CDNs ni compilación.

## Pruebas automatizadas

```bash
node tests/chess.test.js
node tests/ai.test.js
```

Las pruebas requieren Node.js para ejecutarse en desarrollo, **no** en el navegador del iPad. Manuales en `docs/pruebas-hito1.md` y `docs/pruebas-hito2.md`.

## Estructura

- `lib/chess.js`: motor propio de reglas ES5, con API adicional ligera para búsqueda de la IA.
- `js/game.js`: modalidad, turno, estado, deshacer por turno y serialización/restauración.
- `js/ai.js`: selección de movimientos y búsqueda Minimax/Negamax con poda alfa-beta y límite de tiempo; gestor de cálculo/cancelación.
- `js/ai-worker.js`: entrada de búsqueda aislada del hilo de interfaz, carga el motor con `importScripts`.
- `js/board.js`: 64 casillas, interacción táctil, orientación y representación.
- `js/app.js`: menús, partida, promoción y coordinación de cálculos.
- `js/i18n.js` e `i18n/*.json`: traducciones y fallback español.
- `js/storage.js`: partida activa y preferencias en `localStorage`.

El motor integrado es una implementación propia pequeña compatible con las operaciones de chess.js utilizadas por Xake; **no** es el proyecto externo chess.js de Jeff Hlywa.

## Pendiente

Editor de ejércitos y escenarios, validación y distribución automática de posiciones, biblioteca de configuraciones, varias partidas guardadas, importación/exportación y apariencias de piezas. El diseño funcional v0.3 se encuentra en `docs/`.

**Compatibilidad:** el hito 1 se probó con éxito en Safari del iPad 3 físico. El hito 2 tiene pruebas automatizadas y de interfaz de escritorio, pero debe probarse también en ese iPad, especialmente el rendimiento de Normal y Difícil.
