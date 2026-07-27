# Tetris

Implementación del clásico **Tetris** en JavaScript vanilla, usando HTML5 Canvas y CSS. Sin dependencias externas, sin frameworks, sin proceso de build: solo abrir y jugar. Con power-ups, pentominoes, combo, modo desafío, habilidades y hold.

![Tech](https://img.shields.io/badge/HTML5-Canvas-orange)
![Tech](https://img.shields.io/badge/CSS3-blueviolet)
![Tech](https://img.shields.io/badge/JavaScript-Vanilla-yellow)
![Deploy](https://img.shields.io/badge/GitHub-Pages-success?logo=github)

## 🎮 Juega ahora

**Demo en vivo:** [https://dsikorp.github.io/03-claude-tetris/](https://dsikorp.github.io/03-claude-tetris/)

Desplegado automáticamente con **GitHub Actions + GitHub Pages** en cada `push` a `main`.

---

## Tabla de contenidos

- [Tetris](#tetris)
  - [🎮 Juega ahora](#-juega-ahora)
  - [Tabla de contenidos](#tabla-de-contenidos)
  - [Qué hace el proyecto](#qué-hace-el-proyecto)
  - [Cómo ejecutar el juego](#cómo-ejecutar-el-juego)
    - [Opción 1: abrir el archivo directamente](#opción-1-abrir-el-archivo-directamente)
    - [Opción 2: servidor local (recomendado)](#opción-2-servidor-local-recomendado)
  - [Controles](#controles)
  - [Cómo funciona](#cómo-funciona)
    - [1. `index.html`](#1-indexhtml)
    - [2. `style.css`](#2-stylecss)
    - [3. `game.js`](#3-gamejs)
    - [Flujo del juego](#flujo-del-juego)
  - [Tecnologías](#tecnologías)
  - [Estructura del proyecto](#estructura-del-proyecto)
  - [Despliegue en GitHub Pages](#despliegue-en-github-pages)
  - [Personalización](#personalización)
  - [Licencia](#licencia)

---

## Qué hace el proyecto

Es una versión jugable del Tetris clásico con todas las mecánicas que esperarías:

- Tablero de **10 × 20** celdas.
- Las **7 piezas estándar** (I, O, T, S, Z, J, L) con colores diferenciados.
- **Rotación** con _wall kicks_ básicos (pequeños desplazamientos para que la pieza pueda rotar pegada a la pared).
- **Soft drop** (bajada acelerada) y **hard drop** (caída instantánea).
- **Pieza fantasma** (_ghost piece_): muestra dónde aterrizará la pieza actual.
- **Vista previa** de la siguiente pieza.
- **Sistema de puntuación** clásico de Tetris (100 / 300 / 500 / 800 multiplicado por nivel).
- **Niveles** que aumentan cada 10 líneas y aceleran la caída.
- **Pausa** y **Game Over** con opción de reinicio.

---

## Cómo ejecutar el juego

No hay nada que instalar ni compilar. Tienes dos opciones:

### Opción 1: abrir el archivo directamente

```bash
open index.html        # macOS
xdg-open index.html    # Linux
start index.html       # Windows
```

### Opción 2: servidor local (recomendado)

Cualquier servidor estático funciona. Algunos ejemplos:

```bash
# Con Python 3
python3 -m http.server 8000

# Con Node.js (npx)
npx serve .

# Con PHP
php -S localhost:8000
```

Después abre `http://localhost:8000` en el navegador.

---

## Controles

| Tecla     | Acción                            |
| --------- | --------------------------------- |
| `←` / `→` | Mover la pieza horizontalmente    |
| `↑` o `X` | Rotar la pieza en sentido horario |
| `↓`       | Soft drop (bajar más rápido)      |
| `Espacio` | Hard drop (caída instantánea)     |
| `P`       | Pausar / reanudar                 |
| `R`       | Reiniciar la partida              |
| `C` o `Shift` | Hold (reservar / intercambiar pieza) |
| `1` | Habilidad: ver siguientes 5 piezas |
| `2` | Habilidad: lentitud 10s           |
| `3` | Habilidad: intercambiar con pool  |

### Controles en móvil

El juego es totalmente jugable en pantallas táctiles. Dispone de dos sistemas que se pueden usar combinados:

**D-pad y botones en pantalla** (aparecen automáticamente en dispositivos táctiles o pantallas `<= 720px`):

- `◀` `▶` — mover izquierda / derecha (mantener pulsado = autorepetición)
- `▼` — soft drop (mantener pulsado = autorepetición)
- `↻` — rotar
- `DROP` — hard drop
- `P` — pausa
- `R` — reiniciar

**Gestos sobre el tablero:**

- **Tap** — rotar
- **Swipe horizontal** — mover una celda
- **Swipe hacia abajo** — hard drop
- **Mantener pulsado** — soft drop (una fila al alcanzar 350 ms)

**Diseño responsive:** por debajo de `720px` el HUD (SCORE / LINES / LEVEL / NEXT) pasa a una fila horizontal encima del tablero, los controles en pantalla aparecen debajo y el tablero se reescala manteniendo la proporción 10:20. En escritorio con ratón los controles táctiles se ocultan automáticamente.

---

## Compatibilidad móvil

- Viewport con `viewport-fit=cover` y `env(safe-area-inset-*)` para teléfonos con notch.
- `touch-action: none` en el tablero evita el scroll/zoom del navegador al jugar.
- Botones con `touch-action: manipulation` para suprimir el zoom por doble-tap.
- Render crisp con `image-rendering: pixelated` al escalar el canvas por CSS.

---

## Features

### Modos de juego

Al iniciar se elige modo en la pantalla de inicio:

- **Clásico** — endless Tetris con todos los power-ups, pentominoes, combos y habilidades disponibles. La velocidad aumenta cada 10 líneas.
- **Reto: 40 líneas en 2 min** — contrarreloj. Limpia 40 líneas antes de que se agote el tiempo para ganar. HUD muestra cronómetro y progreso. Los power-ups siguen activos (pueden ayudar o complicar).

### Power-ups (5)

Aparecen con ~6% de probabilidad por pieza (30% combinado). Cada uno tiene un efecto único al bloquearse la pieza:

| Power-up | Símbolo | Efecto |
| -------- | ------- | ------ |
| Bomba    | `B`     | Destruye un área 3×3 centrada en la pieza. |
| Rayo     | `R`     | Limpia la fila **o** columna con más bloques. |
| Tinte    | `T`     | Convierte todos los bloques del color más común al color de la pieza. |
| Gravedad | `G`     | Compacta cada columna (los huecos caen al fondo). |
| Congelar | `F`     | Pausa la caída automática 5 segundos (soft/hard drop siguen funcionando). |

### Piezas nuevas

Además de los 7 tetrominós estándar (I, O, T, S, Z, J, L) y la pieza custom "N tuerca" (decorativa):

- **Pentominoes** (P, U, Y) — 5 bloques cada una, aparecen con ~4% combinado.
- **Pieza 1×1** — bloque único, +100 al bloquearse. 1% de spawn.
- **Pieza 3×3 hueca** — marco de 8 bloques con un hueco central, +200 al bloquearse. 1% de spawn.

### Combo y puntuación avanzada

- **Combo**: cada clear consecutivo multiplica la puntuación (+50% por clear encadenado). Se reinicia si una pieza se bloquea sin limpiar líneas.
- **T-spin**: rotar la T en un hueco con 3+ esquinas bloqueadas concede +400 × nivel y un multiplicador extra.
- **B2B (back-to-back)**: dos Tetrises (4 líneas) consecutivos otorgan un multiplicador ×1.5. Cualquier clear de menos de 4 líneas rompe la cadena.
- **Perfect Clear**: limpiar todas las filas de una vez (tablero vacío) concede +2000 × nivel.

### Habilidades (energy bar)

La barra de energía se llena con clears: 1 punto cada 10 líneas, máximo 3. Pulsa `1`, `2` o `3` (o toca los botones del HUD) para activar:

1. **Ver siguientes 5** — muestra las 5 próximas piezas en el preview durante 4 segundos, ciclando automáticamente.
2. **Lentitud 10s** — duplica el intervalo de caída durante 10 segundos.
3. **Intercambiar** — reemplaza la pieza actual por una aleatoria del pool de las próximas 5. Si la pieza intercambiada colisiona al spawn, se cancela sin reembolso.

### Hold

`C` o `Shift` envía la pieza actual a la "bandeja" de Hold. Si ya hay una pieza en Hold, la intercambia con la actual. **Solo se puede usar una vez por pieza**: tras usarla, el slot se atenúa hasta que la pieza actual se bloquee.

---

## Cómo funciona

El juego se compone de tres archivos que cooperan:

### 1. `index.html`

Define la estructura visual:

- Un `<canvas id="board">` de **300 × 600** píxeles donde se renderiza el tablero.
- Un panel lateral con `SCORE`, `LINES`, `LEVEL`, vista de la siguiente pieza y la lista de controles.
- Un overlay para los estados **PAUSA** y **GAME OVER**.

### 2. `style.css`

Aporta el aspecto visual con estética _dark / retro arcade_: fondo oscuro, tipografía monoespaciada para los marcadores y _backdrop blur_ en los overlays.

### 3. `game.js`

Contiene toda la lógica del juego. A grandes rasgos:

- **Modelo del tablero**: una matriz `ROWS × COLS` donde cada celda guarda `0` (vacía) o un índice de color (1–7) que identifica la pieza.
- **Piezas**: definidas como matrices cuadradas. Para rotar se calcula la transposición + reverso de filas (`rotateCW`).
- **Detección de colisiones** (`collide`): comprueba que ninguna celda de la pieza salga del tablero ni se solape con bloques ya fijados.
- **Wall kicks** (`tryRotate`): si la rotación choca, intenta desplazar la pieza ±1 y ±2 columnas antes de descartar el giro.
- **Game loop** (`loop`): basado en `requestAnimationFrame`, acumula el tiempo transcurrido y baja la pieza una fila cuando se supera `dropInterval`.
- **Limpieza de líneas** (`clearLines`): recorre el tablero de abajo hacia arriba; cada fila completa se elimina y se inserta una vacía en la cima.
- **Puntuación**: usa la tabla clásica `[0, 100, 300, 500, 800]` multiplicada por el nivel actual; el hard drop suma 2 puntos por celda recorrida y el soft drop 1 punto por fila.
- **Nivel y velocidad**: el nivel sube cada 10 líneas; la velocidad de caída se calcula como `max(100, 1000 − (level − 1) × 90)` milisegundos.
- **Ghost piece** (`ghostY`): proyecta la posición final de la pieza actual hacia abajo y la dibuja con `globalAlpha = 0.2`.

### Flujo del juego

```
init()
  ├─ createBoard()                  → matriz vacía
  ├─ next = randomPiece()
  ├─ spawn()                        → mueve next a current y genera nueva next
  └─ requestAnimationFrame(loop)
        ↓
   loop(timestamp)
     ├─ acumula dt
     ├─ si dt ≥ dropInterval → baja la pieza o llama a lockPiece()
     ├─ draw()  (grid + tablero + ghost + pieza actual)
     └─ requestAnimationFrame(loop)

   keydown → mover / rotar / soft-drop / hard-drop / pausa
```

Cuando una pieza recién generada ya colisiona al aparecer (`spawn`), se dispara `endGame()` y se muestra el overlay de **Game Over**.

---

## Tecnologías

- **HTML5** — marcado y dos elementos `<canvas>` (tablero y vista previa).
- **CSS3** — _flexbox_, variables de color, `backdrop-filter` y `box-shadow`.
- **JavaScript (ES6+) vanilla** — `const`/`let`, _arrow functions_, _spread operator_, `Array.from`, _template literals_…
- **Canvas 2D API** — para todo el renderizado del juego.
- **`requestAnimationFrame`** — para el bucle de juego sincronizado con el navegador.

**Sin dependencias.** No hay `package.json`, ni bundler, ni transpilador.

---

## Estructura del proyecto

```
03-claude-tetris/
├── index.html                 # Estructura del DOM y canvas
├── style.css                  # Estilos del juego (dark theme)
├── game.js                    # Toda la lógica del Tetris (~300 líneas)
├── .github/
│   └── workflows/
│       └── deploy.yml         # CI/CD: deploy a GitHub Pages
└── README.md
```

---

## Despliegue en GitHub Pages

El proyecto se publica automáticamente en **GitHub Pages** cada vez que se hace `push` a la rama `main`, mediante un workflow de GitHub Actions.

### Cómo funciona

1. **Workflow** (`.github/workflows/deploy.yml`): se dispara en cada `push` a `main` (y manualmente desde la pestaña _Actions_).
2. **Permisos** del job: `contents: read`, `pages: write`, `id-token: write` (necesarios para `actions/deploy-pages`).
3. **Pasos**:
   - `actions/checkout@v4` descarga el código.
   - `actions/configure-pages@v5` prepara la configuración de Pages.
   - `actions/upload-pages-artifact@v3` empaqueta el sitio (carpeta raíz, ya que es 100% estático).
   - `actions/deploy-pages@v4` publica el artefacto en la URL del entorno `github-pages`.
4. **URL pública**: `https://<usuario>.github.io/03-claude-tetris/`

### Configuración inicial (una sola vez)

Si clonas este repo y quieres desplegar el tuyo:

1. Sube el código a un repositorio en GitHub.
2. En **Settings → Pages**, elige **Source: GitHub Actions**.
3. Asegúrate de que en **Settings → Actions → General** los _workflow permissions_ permitan **Read and write permissions** (necesario para que el job publique).
4. Haz `git push origin main` — el primer deploy se ejecuta en ~30 segundos.

### Despliegues manuales

Desde la pestaña **Actions** del repo, selecciona el workflow _"Deploy to GitHub Pages"_ y pulsa **Run workflow**. Útil para reintentar sin hacer un nuevo commit.

### Revertir un deploy

Como el deploy se genera desde el último commit de `main`, basta con hacer un `git revert` + `push` para publicar la versión anterior.

---

## Personalización

Algunos parámetros fáciles de tunear en `game.js`:

| Constante      | Significado                              | Por defecto           |
| -------------- | ---------------------------------------- | --------------------- |
| `COLS`         | Columnas del tablero                     | `10`                  |
| `ROWS`         | Filas del tablero                        | `20`                  |
| `BLOCK`        | Tamaño en píxeles de cada celda          | `30`                  |
| `COLORS`       | Paleta de colores por tipo de pieza      | 7 colores             |
| `LINE_SCORES`  | Puntos por 1, 2, 3 o 4 líneas eliminadas | `[0,100,300,500,800]` |
| `dropInterval` | Velocidad inicial de caída en ms         | `1000`                |

> Si cambias `COLS`, `ROWS` o `BLOCK`, recuerda ajustar también `width` y `height` del `<canvas id="board">` en `index.html` para que coincida (`COLS × BLOCK` × `ROWS × BLOCK`).

---

## Licencia

Proyecto de uso libre con fines educativos y de práctica.
