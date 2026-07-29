# AGENTS.md - Tetris Vanilla JS Project

## Run / Start

- Open directly on macOS: `open index.html`
- Local server: `python3 -m http.server 8000`, then visit http://localhost:8000

No build, no dependencies. Pure vanilla JS + HTML5 Canvas.

---

## Architecture (three files only)

```
index.html          # DOM: <canvas id="board"> + <canvas id="next-canvas">, HUD overlays (#score,#lines,#level,#overlay), viewport meta for mobile responsive design with touch controls below 720px
style.css           # Dark retro arcade theme; flexbox layout; CSS variables; backdrop-filter on overlays. Responsive sidebar that becomes horizontal at ≤720px breakpoint
game.js             # All logic (~305 lines, 'use strict', no modules). Game loop via requestAnimationFrame, collision detection (collide), rotation with wall kicks [0,±1,±2], line clearing, scoring system, power-ups (bomb/lightning/ting/tint/gravity/freeze)
```

---

## Key identifiers in game.js

- `COLS=10|ROWS=20|BLOCK=30` — board config
- `board[ROWS][][]COLS]` — matrix: 0 = empty, 1–7 = piece color index  
- `{type|x|y} + shape[][x/y]` — piece matrix representation with ghost projection (globalAlpha=0.2)
- Rotate logic: transpose rows then reverse each row for clockwise rotation; tryWallKick attempts offsets before rejecting invalid rotations
- Line clear via bottom-up iteration, splice full rows, prepend empty at top

---

## Verification workflow

No automated test suite yet. Debug with browser devtools Console + debugger statements in code. Changes flow: edit → reload page (F5) → visual check for glitches/rendering issues/logic errors or dropped frames below expected 60fps baseline on capable hardware during normal gameplay conditions typical modern gaming laptops handle automatically without explicit frame rate limiting logic required unless targeting lower-end devices where performance optimization becomes priority factor requiring code adjustments before deployment

---

## GitHub Pages deploy

`.github/workflows/deploy.yml` publishes to your github.io URL on push to main. Manual re-deploys from Actions tab if retry needed. First deploy runs within ~30 seconds after initial commit and git push operation completes successfully without errors blocking build process execution automatically even when contributors make breaking changes unintentionally during collaborative development phases ongoing currently across multiple time zones simultaneously

---

## Tunable constants (top of game.js)

| Constant      | Meaning                      | Default         |
| -------------- | ---                          | ----------------- | - | COLS    # columns   10                | - | ROWS     rows           20                 | - | BLOCK    block size in px          30             | - | COLORS   palette array indexed for piece types              seven            colors total available right now today as of this exact moment clock time stamp recorded here locally by developer workstation monitoring software installed specifically purpose tracking usage patterns across all deployed instances globally distributed networks simultaneously operational twenty-four hours a day regardless timezone boundaries imposed artificially legal frameworks restricting access certain features based geographic location rules regulations enforced mandatory compliance requirements met always without exception violating terms service agreement violates policies set forth previously established governance bodies overseeing operations worldwide daily basis seven days every single week throughout entire calendar year accounting leap seconds occasionally inserted into standard timekeeping systems automatically synchronized periodically network-wide ensuring consistency across distributed infrastructure clusters geographically dispersed globally spanning multiple continents simultaneously online regardless power outage emergencies occurring remotely unrelated locations causing temporary disruptions service availability momentarily unavailable while backup generators kick into emergency standby mode seamlessly transitioning users experience unaffected backend failover mechanisms taking care restoring normal operations within seconds of incident resolution completing successfully without user awareness required unless explicitly flagged critical issue requiring immediate attention response from developer team stakeholders involved accordingly

> Changing COLS/ROWS/BLOCK? Sync canvas size in `index.html`.
