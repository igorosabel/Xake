# Xake

**Documento de diseño funcional — versión 0.3**  
**Estado:** decisiones funcionales definidas; aplicación aún no implementada  
**Repositorio:** https://github.com/igorosabel/Xake  
**Fecha:** 15 de noviembre de 2026

## 1. Visión

Aplicación web de ajedrez adaptada a móviles y tabletas, con compatibilidad desde Safari de iOS 9, especialmente en un **iPad 3 (2012)**. Está pensada para que los niños jueguen entre sí, con un adulto o contra la máquina y, especialmente, para inventar enfrentamientos con piezas y posiciones iniciales personalizadas.

El juego mantiene el movimiento de las piezas del ajedrez; lo personalizable es qué piezas tiene cada jugador, cuántas, dónde se colocan inicialmente y cómo se representan visualmente.

### Principios

- Nombre del producto: **Xake**. Interfaz predeterminada en **castellano**; internacionalización mediante archivos JSON desde el comienzo.
- Interacciones exclusivamente mediante **toques** (pieza y después casilla), sin depender de arrastrar ni de gestos largos.
- Interfaz táctil sencilla, botones grandes y pocos pasos.
- Dos jugadores en **el mismo dispositivo**. No se requiere juego en línea.
- Modo contra máquina con cuatro niveles de dificultad.
- Compatibilidad real con Safari en iOS 9, comprobada desde el primer hito.
- Aplicación estática sin necesidad de cuenta de usuario ni backend inicial.
- Guardado local de ejércitos, escenarios, partidas y preferencias.
- Arquitectura modular, sin frameworks modernos de ejecución ni dependencias de WebAssembly.

## 2. Vocabulario

| Término | Significado |
| --- | --- |
| Ejército | Inventario de piezas de un jugador: tipos y cantidades, sin ubicación. |
| Escenario | Posición inicial completa: ambos bandos, casillas ocupadas, turno inicial y reglas especiales aplicables. |
| Apariencia | Colección visual de imágenes para representar las piezas; no cambia las reglas. |
| Partida | Ejecución de un escenario con modo de juego, movimientos e historial. |
| Reto | Escenario con objetivo adicional, previsto para una ampliación. |

La interfaz infantil podrá utilizar expresiones como **«Mis ejércitos»** y **«Mis tableros»**, dejando «escenario» como término interno cuando resulte más claro.

## 3. Pantallas principales

### 3.1. Inicio

Accesos: Jugar, Crear partida, Mis partidas, Retos (cuando esté implementado) y Ajustes.

### 3.2. Nueva partida

1. Elegir **Dos jugadores** o **Contra la máquina**.
2. Elegir **Clásico** o uno de **Mis tableros**.
3. Si se juega contra la máquina, elegir dificultad entre cuatro niveles y color del jugador humano.
4. Elegir la apariencia de las piezas blancas y negras de forma independiente.
5. Comenzar.

### 3.3. Editor, paso 1: crear los ejércitos

- Pestañas **Blancas / Negras**.
- Para cada tipo (`k`, `q`, `r`, `b`, `n`, `p`), icono, nombre, contador y botones `−` / `+`.
- El rey está fijado a **1** por bando en la versión inicial.
- Acciones: **Clásico**, **Vaciar (conservar el rey)**, **Cargar ejército guardado**, **Guardar ejército**, **Siguiente**.
- Se muestra el total de piezas de cada bando y el espacio disponible en el tablero.
- No hay límite de 16 piezas por bando: solo el máximo físico de 64 casillas ocupadas entre ambos bandos y las restricciones de colocación.
- Se puede crear, renombrar, duplicar y eliminar un ejército guardado.

**Ejemplo:** Blancas = 1 rey + 15 reinas; Negras = 1 rey + 15 peones. La combinación se acepta como inventario; el tablero definitivo debe pasar las validaciones.

### 3.4. Editor, paso 2: colocar las piezas

**Composición:** tablero de 8×8, selección de bando, paleta de piezas restantes, contador de piezas sin colocar y acciones de edición. En iPad horizontal: tablero a la izquierda y controles a la derecha; en móvil vertical: tablero arriba, controles debajo. Los controles táctiles principales medirán, cuando sea factible, al menos 44×44 píxeles CSS.

**Interacción con pulsaciones, sin arrastrar:**

1. Tocar una pieza de la paleta; queda seleccionada.
2. Tocar una casilla vacía; colocar una unidad y reducir el contador restante.
3. Para mover una pieza colocada, seleccionarla en el tablero y después tocar una casilla vacía.
4. Para retirar una pieza, seleccionarla y pulsar **Quitar**; vuelve al inventario disponible.
5. Si hay más unidades disponibles de la pieza seleccionada, podrán colocarse consecutivamente sin volver a seleccionar su icono.
6. Al cambiar de bando se mantiene la posición creada.
7. Si se toca una casilla ocupada al intentar colocar, no se sustituye silenciosamente: se pide quitar/mover antes.
8. Seleccionar una pieza ya colocada muestra una acción explícita **Retirar**; tocar esa misma pieza de nuevo cancela la selección.
9. Deshacer y rehacer recorren un historial de **acciones de edición**, independiente del historial de la partida.

**Acciones:** Deshacer último cambio, Rehacer, Reiniciar colocación, Distribuir automáticamente, Volver, Siguiente.

**Distribución automática (primera versión):**

- Respetar las cantidades elegidas, la ocupación de casillas y las restricciones de peones y reyes.
- Tomar como referencia los campos próximos a cada jugador, sin prometer simetría en ejércitos distintos.
- Intentar varias distribuciones y comprobar legalidad básica de la posición.
- Si no encuentra una distribución jugable en un esfuerzo acotado, informar y ofrecer colocación manual. No bloquear la interfaz.
- La función automática no modifica un tablero parcialmente colocado sin confirmación; en la primera versión partirá de una colocación vacía.

**Orientación:** blancas abajo durante la edición; orientación configurable durante la partida.

### 3.5. Editor, paso 3: validar y guardar

Campos y acciones:

- **Nombre del tablero**, obligatorio para guardar.
- **Quién empieza:** blancas o negras.
- Resumen de cantidades por bando.
- Estado de validación con mensajes comprensibles.
- **Guardar tablero**, **Guardar y jugar**, **Volver a editar**. La acción «Guardar y jugar» solo se activa para una posición válida que no esté terminada; una posición terminal puede conservarse para modificarla o reutilizarla posteriormente como reto.
- El escenario guardado es una **fotografía independiente** de la posición: modificar posteriormente un ejército no altera escenarios ya guardados.

Se podrá editar, duplicar, renombrar y eliminar un escenario desde «Mis tableros».

## 4. Validaciones de un escenario

Se distingue entre **consistencia estructural**, **posibilidad de comenzar a jugar** y **avisos informativos**. No se exige que las piezas provengan de una apertura real ni que ambos ejércitos tengan una fuerza similar.

### 4.1. Estados de validación

| Estado | Guardar escenario | Jugar normalmente | Ejemplo |
| --- | --- | --- | --- |
| **Válido** | Sí | Sí | Dos ejércitos arbitrarios, posición consistente y con jugadas legales. |
| **Aviso** | Sí | Sí | Quien comienza está en jaque, pero tiene respuesta; desequilibrio de fuerzas. |
| **Terminal** | Sí, para edición/reto futuro | No | Mate, ahogado, tablas inmediatas por material insuficiente. |
| **Error** | No como escenario completo | No | Falta un rey, peón en última fila o inventario sin colocar. |

La funcionalidad de guardar **borradores incompletos** queda fuera de la versión inicial. El estado «terminal» es válido estructuralmente, pero no jugable como partida ordinaria.

### 4.2. Errores que bloquean el escenario completo

- Falta alguna pieza del inventario por colocar o existe un desacuerdo entre el inventario y las piezas colocadas.
- Falta un rey o hay más de un rey de un mismo color. **Exactamente uno por bando**.
- Dos piezas se solapan sobre una casilla, o la posición ocupa más de 64 casillas.
- Existe un peón en la fila 1 u 8.
- Los reyes están en casillas adyacentes.
- El rey del bando **que acaba de jugar** (el que no tiene el turno) está en jaque: la posición resulta incompatible con el turno establecido.
- El formato FEN generado no puede cargarse en el motor de reglas.

No se exige que la configuración sea alcanzable mediante una partida convencional. Sí se exige una posición consistente y una gestión de turnos acorde con las reglas.

### 4.3. Posiciones válidas con avisos

- Un bando tiene muchas más piezas o un valor material muy superior al otro.
- El bando que mueve está en jaque y puede responder legalmente.
- Hay un número extraordinariamente alto de movimientos posibles; la IA podría necesitar limitar su búsqueda.

### 4.4. Posiciones terminales

- Jaque mate, ahogado y tablas inmediatas por material insuficiente.
- Se podrán **guardar y editar**, pero el botón «Jugar» estará deshabilitado para partidas normales. Más adelante podrán aprovecharse en el modo Retos si tienen sentido para ese modo.
- Un escenario de solo dos reyes, por ejemplo, puede guardarse para editarlo, pero no iniciar una partida competitiva porque ya son tablas.

### 4.5. Reglas especiales de la versión inicial

- La forma de mover, capturar y promocionar las piezas sigue el ajedrez tradicional.
- Se admiten más reinas, torres, alfiles, caballos o peones de los habituales (siempre que quepan y estén colocados legalmente). La promoción puede generar piezas adicionales aunque no existieran en el inventario inicial.
- **Enroque:** normal en la posición clásica; inicialmente **desactivado en escenarios personalizados**. Una futura opción avanzada podría habilitarlo con las comprobaciones necesarias.
- **Captura al paso:** nunca disponible en el instante inicial de un escenario personalizado, porque no se conoce una jugada inmediatamente anterior; podrá surgir tras el correspondiente avance doble de un peón durante la partida.
- **Avance doble del peón:** se aplica según la fila inicial habitual de su color y las reglas del motor, también en escenarios personalizados; no se intenta reconstruir una historia previa inexistente.
- Los contadores FEN de un escenario creado desde cero empiezan con `0` medios movimientos y movimiento `1`; campo de captura al paso `-` y derechos de enroque `-`.
- **Tablas simplificadas para niños:** Xake cerrará automáticamente la partida al alcanzar tres apariciones de la misma posición o 50 movimientos completos de ambos bandos sin captura ni movimiento de peón (100 medias jugadas). Es una simplificación explícita frente a la necesidad de reclamar estas tablas en el ajedrez reglamentario. Mate, ahogado y material insuficiente también finalizan normalmente la partida.
- La validez sintáctica del FEN no garantiza legalidad funcional: se utilizará un validador propio además de `validate_fen` de chess.js 0.10.3.

### 4.6. Orden de comprobación

1. Comprobar inventario, cantidades, casillas y reyes.
2. Comprobar peones en filas prohibidas y adyacencia de reyes.
3. Construir FEN con turno elegido y valores iniciales apropiados.
4. Comprobar que el motor puede cargarlo y que el bando que no mueve no esté en jaque.
5. Evaluar si hay jugadas legales y estados terminales.
6. Mostrar avisos de desequilibrio o coste previsto de IA sin impedir jugar.

El editor informará con mensajes en castellano que identifiquen el error y, cuando sea útil, destacará las casillas afectadas.

## 5. Pantalla de juego

- Tablero grande, casillas táctiles y resalte de destinos legales.
- Pulsar pieza y destino para mover; no se necesita arrastrar.
- Indicador visible de turno, jaque y resultado.
- Diálogo sencillo de promoción (reina, torre, alfil o caballo); el usuario elige y la jugada solo se confirma después.
- Dos jugadores en el mismo dispositivo; posibilidad de giro manual o automático (desactivado por defecto).
- Contra la máquina: cuatro niveles, cálculo fuera del hilo de la interfaz siempre que el dispositivo lo permita, límites de tiempo/esfuerzo para posiciones extremas.
- Acciones: Deshacer, Reiniciar, Guardar y Salir. En partidas contra máquina, «Deshacer» retrocede normalmente hasta el turno anterior del jugador humano.
- Confirmación antes de abandonar una partida con cambios sin guardar.
- La interfaz debe evitar que los controles queden fuera de pantalla en móvil vertical y iPad horizontal.

## 6. Modelo de datos propuesto

Ejemplo conceptual; el formato final podrá evolucionar antes de la implementación.

### 6.1. Ejército

```json
{
  "id": "army-001",
  "name": "Las 15 reinas",
  "pieces": { "k": 1, "q": 15, "r": 0, "b": 0, "n": 0, "p": 0 },
  "createdAt": "2026-11-15T11:00:00.000Z",
  "updatedAt": "2026-11-15T11:00:00.000Z"
}
```

No incluye color, de manera que el mismo ejército pueda utilizarse como blancas o negras.

### 6.2. Escenario

```json
{
  "id": "scenario-001",
  "name": "Reinas contra peones",
  "initialFen": "FEN_GENERADO_AL_VALIDAR_EL_TABLERO",
  "whiteArmyId": "army-001",
  "blackArmyId": "army-002",
  "whiteArmySnapshot": { "k": 1, "q": 15, "r": 0, "b": 0, "n": 0, "p": 0 },
  "blackArmySnapshot": { "k": 1, "q": 0, "r": 0, "b": 0, "n": 0, "p": 15 },
  "createdAt": "2026-11-15T11:00:00.000Z",
  "updatedAt": "2026-11-15T11:00:00.000Z"
}
```

El FEN contiene posición, turno inicial y derechos especiales. El turno no se duplica como fuente de verdad. `whiteArmySnapshot` y `blackArmySnapshot` protegen el escenario frente a cambios o eliminación de los ejércitos originales. La apariencia no forma parte de las reglas del escenario: se elige al jugar y puede guardarse como preferencia.

### 6.3. Partida guardada

```json
{
  "id": "game-001",
  "scenarioId": "scenario-001",
  "initialFen": "FEN_GENERADO_AL_VALIDAR_EL_TABLERO",
  "mode": "local-two-players",
  "difficulty": null,
  "humanColor": null,
  "whiteAppearance": "classic",
  "blackAppearance": "dinosaurs",
  "moves": [
    { "from": "a2", "to": "a3", "promotion": null }
  ],
  "updatedAt": "2026-11-15T11:00:00.000Z"
}
```

El historial de jugadas se reproduce desde `initialFen`; permite restaurar deshacer, derechos de enroque, captura al paso, contadores y repeticiones. Cada jugada se guarda como `from`, `to` y `promotion` (cuando exista), no solamente en notación textual. El guardado de la partida es autónomo aunque se borre el escenario del que procede. La lista anterior es ilustrativa, no una partida necesariamente válida para el escenario del ejemplo.

### 6.4. Almacenamiento local

Claves versionadas previstas:

- `xake:v1:armies`
- `xake:v1:scenarios`
- `xake:v1:games`
- `xake:v1:preferences`

Cada clave contiene una estructura JSON con `schemaVersion: 1` y su colección de registros. Se capturarán errores al leer, parsear y escribir `localStorage` (por ejemplo, cuota insuficiente, almacenamiento deshabilitado o contenido corrupto). Se validarán tipos, IDs y datos al importar; no se insertará contenido importado como HTML sin escapar.

Una falla de almacenamiento no debe impedir jugar una partida nueva; se mostrará un aviso de que no se ha podido guardar. Los registros se guardan de forma autónoma y las referencias a ejércitos o escenarios son informativas gracias a las copias de los datos necesarios. Para partidas en curso habrá una acción explícita **Guardar** y, tras cada jugada, un guardado automático ligero cuando el almacenamiento esté disponible.

`localStorage` no sustituye a una copia de seguridad: Safari puede eliminar datos del sitio, especialmente tras limpiar sus datos. No se prometerá sincronización entre dispositivos.

### 6.5. Exportar e importar

Se preparará exportación/importación JSON de ejércitos y escenarios (preferentemente con un paquete JSON versionado que incluya ambas colecciones). Al importar se validará la estructura y se resolverán IDs duplicados sin sobrescribir silenciosamente. Por compatibilidad con Safari antiguo, la vía mínima garantizada será **mostrar texto JSON para copiar/pegar**, sin depender de APIs modernas de descarga de archivos.

## 7. Internacionalización

**D-001.** La interfaz se presenta por defecto en **español (`es`)**, sin depender del idioma configurado en el dispositivo. Se admitirá elegir idioma en Ajustes y se conservará en las preferencias locales. Como segundo idioma previsto se incluye **euskera (`eu`)**.

- Archivos `i18n/es.json` y `i18n/eu.json` con claves estables, preferentemente del estilo `menu.play`, `editor.placePiece` y `game.checkmate`.
- Los textos se obtienen mediante un módulo `i18n.js`, con carga por `XMLHttpRequest` para Safari antiguo.
- Se cargará el idioma seleccionado al iniciar. Si falta una clave o un fichero de traducción, se recurrirá al texto español.
- Mensajes de validación, promoción, IA, guardado y ajustes estarán internacionalizados. Los nombres creados por usuarios se almacenan tal como los escriban.
- La aplicación se servirá por HTTP(S), no se dependerá de abrir el fichero `index.html` con `file://` para cargar JSON.

## 8. Tecnología y compatibilidad

- HTML5, CSS compatible con Safari de iOS 9, JavaScript ES5 en el código distribuido. El equipo de referencia es un **iPad 3 (2012) con iOS 9**; optimizar principalmente para su memoria, CPU y experiencia táctil.
- Tablero con ocho filas de ocho casillas; evitar CSS Grid moderno como dependencia funcional. Preferir estilos sencillos, Flexbox con compatibilidad comprobada y un número contenido de repintados.
- Sin módulos ES nativos, WebAssembly ni `async`/`await` en la ejecución del navegador antiguo.
- Biblioteca de reglas candidata: **chess.js 0.10.3**. Verificar con pruebas reales en el iPad y fijar la versión concreta en el repositorio.
- IA implementada inicialmente de manera sencilla o con motor compatible; usar Web Worker cuando sea apropiado, con control de presupuesto de búsqueda.
- Posibilidad de servir la aplicación como archivos estáticos por HTTPS. Sin backend en el alcance inicial.
- Las operaciones habituales del editor son síncronas y ligeras; los cálculos costosos de IA se ejecutarán preferentemente en un Web Worker y tendrán un límite de trabajo.
- Sin drag-and-drop, efectos costosos ni gestos imprescindibles para jugar.
- La compatibilidad real con iOS 9 es criterio de aceptación continuo, no una comprobación solo al final.

Referencia de API histórica de chess.js 0.10.3: https://jhlywa.github.io/chess.js/v0.10.3/

Referencia de almacenamiento de Safari: https://developer.apple.com/library/archive/documentation/iPhone/Conceptual/SafariJSDatabaseGuide/Name-ValueStorage/Name-ValueStorage.html

## 9. Organización propuesta del repositorio

```text
Xake/
├── README.md
├── docs/
│   └── diseno-funcional.md
├── index.html
├── css/
│   ├── main.css
│   ├── board.css
│   └── editor.css
├── i18n/
│   ├── es.json
│   └── eu.json
├── js/
│   ├── app.js
│   ├── game.js
│   ├── board.js
│   ├── editor.js
│   ├── validator.js
│   ├── i18n.js
│   ├── ai.js
│   ├── ai-worker.js
│   └── storage.js
├── lib/
│   └── chess.js
└── assets/
    ├── pieces/
    └── sounds/
```

Es una propuesta organizativa: no crear archivos vacíos sin utilidad. Separar módulos de reglas, estado, renderizado y almacenamiento a medida que aparezcan.

## 10. Hitos de desarrollo

1. **Tablero y reglas clásicas:** dos jugadores locales; movimientos, promoción, mate/tablas; primera prueba real en iOS 9.
2. **IA:** cuatro niveles, selección de bando, pruebas con posiciones de muchas piezas.
3. **Ejércitos y escenarios:** selector de cantidades, colocación táctil, validación y distribución automática.
4. **Persistencia y apariencia:** biblioteca local, reanudar partidas, importar/exportar, temas visuales por bando.
5. **Retos y acabado:** experiencias adicionales, sonido opcional, accesibilidad táctil y pruebas finales.

Se priorizarán bloques funcionales cerrados, verificables y pequeños, sin dividir innecesariamente cada modificación en múltiples entregas.

## 11. Criterios de aceptación del editor

- Se puede crear un ejército con 1 rey y 15 reinas y otro con 1 rey y 15 peones.
- Se puede configurar un tablero con ambos ejércitos y elegir qué bando comienza.
- El prototipo de interacción contempla piezas restantes, selección de bando, mover y retirar sin arrastrar.
- Se pueden colocar, mover y quitar piezas mediante toques, sin drag & drop.
- No se permiten solapamientos ni peones en filas prohibidas.
- La validación distingue errores bloqueantes de avisos informativos.
- La posición válida se transforma en un FEN cargable por el motor.
- Un escenario guardado puede recuperarse y editarse.
- Editar un ejército no modifica escenarios previamente guardados.
- La eliminación de un ejército no inutiliza los escenarios existentes.
- Al cerrar y abrir Safari, las configuraciones permanecen cuando el almacenamiento local está disponible.
- El editor se puede usar tanto en móvil vertical como en iPad horizontal.
- Un escenario de solo reyes se puede guardar para editar, pero no jugar como partida ordinaria.
- El idioma inicial es español, y todas las cadenas de la interfaz se resuelven mediante JSON con fallback a español.
- Una partida guardada puede recuperarse aunque se haya eliminado su escenario de origen.
- Las tablas por repetición y regla de 50 movimientos se gestionan automáticamente.
- La edición tiene Deshacer y Rehacer propios, independientes de los de una partida.
- La interfaz responde sin bloqueos prolongados a combinaciones de piezas poco habituales.

## 12. Decisiones pendientes (no bloqueantes)

- Diseño visual final, paleta de colores, tipografías e iconografía.
- Conjuntos de apariencias incluidos de salida y sus licencias de uso.
- Estrategia definitiva para los cuatro niveles de IA tras medir rendimiento.
- Reglas exactas y número de intentos de la distribución automática.
- Si se ofrecerá una opción avanzada de derechos de enroque en escenarios personalizados.
- Requisitos concretos del modo Retos.

---

## 13. Decisiones de arquitectura y pruebas de aceptación

- **D-001 · Internacionalización:** archivos JSON, español predeterminado y fallback a `es`.
- **D-002 · Entrada táctil:** seleccionar pieza/casilla, sin arrastrar ni gestos largos.
- **D-003 · Motor de reglas:** biblioteca fijada y validador funcional propio para posiciones personalizadas.
- **D-004 · Escenarios autónomos:** instantáneas de ambos ejércitos y FEN inicial.
- **D-005 · Partidas autónomas:** FEN inicial y secuencia de movimientos serializados, sin dependencia de escenarios guardados.
- **D-006 · Datos locales:** claves `xake:v1:*`, copia exportable e importación validada.
- **D-007 · Personalizadas:** enroque desactivado inicialmente, sin captura al paso inicial, promoción tradicional.
- **D-008 · Tablas infantiles:** finalización automática por tres repeticiones y 100 medias jugadas sin captura ni avance de peón.

**Casos mínimos a probar** (automatizados en la medida posible):

1. Posición clásica: apertura, enroque legal, enroque bloqueado e ilegal, captura al paso y promoción.
2. Posición personalizada con 15 reinas y 15 peones: generar FEN, cargar, validar, iniciar si no es terminal y guardar.
3. Peones en fila 1/8 y reyes adyacentes: mensajes de error comprensibles.
4. Rey del jugador que no mueve en jaque: bloqueo; rey del jugador que mueve en jaque con defensas: permitido con aviso.
5. Mate, ahogado o material insuficiente inicial: guardar escenario para editar; bloquear «Jugar».
6. Tres repeticiones y 100 medias jugadas sin captura o movimiento de peón: tablas automáticas.
7. Partida guardada y restaurada con promociones y reglas especiales; borrar el escenario original no afecta a la partida.
8. Importación JSON malformada, duplicados y fallo de `localStorage`: errores controlados.
9. Idioma español inicial, euskera seleccionado y fallback de claves ausentes.
10. Prueba manual en Safari del iPad 3 con iOS 9: controles táctiles, disposición horizontal, fluidez y persistencia.

---

**Siguiente bloque de implementación recomendado:** hito 1: tablero clásico y reglas funcionando para dos jugadores en el mismo dispositivo. El editor personalizado se construirá sobre esa base reutilizable, usando los estados e interacciones ya definidos.

