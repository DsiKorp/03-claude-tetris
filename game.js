'use strict';

const COLS = 10;
const ROWS = 20;
const BLOCK = 30;

const COLORS = [
  null,
  '#4dd0e1', // I - cyan
  '#ffd54f', // O - yellow
  '#ba68c8', // T - purple
  '#81c784', // S - green
  '#e57373', // Z - red
  '#90caf9', // J - pale blue
  '#ffb74d', // L - orange
  '#9e9e9e', // N - tuerca (gris metálico)
];

const PIECES = [
  null,
  [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]], // I
  [[2,2],[2,2]],                               // O
  [[0,3,0],[3,3,3],[0,0,0]],                  // T
  [[0,4,4],[4,4,0],[0,0,0]],                  // S
  [[5,5,0],[0,5,5],[0,0,0]],                  // Z
  [[6,0,0],[6,6,6],[0,0,0]],                  // J
  [[0,0,7],[7,7,7],[0,0,0]],                  // L
  [[8,8,8],[8,0,8],[8,8,8]],                  // N (tuerca)
  [[9,9],[9,9]],                               // 9 Bomba (2x2)
  [[0,10,0],[10,10,10],[0,10,0]],              // 10 Rayo (3x3 cruz)
  [[11]],                                      // 11 Tinte (1x1)
  [[12]],                                      // 12 Gravedad (1x1)
  [[13]],                                      // 13 Congelar (1x1)
  [[0,14,0],[14,14,14],[0,14,0]],              // 14 P pentomino (+)
  [[15,0,15],[15,15,15]],                     // 15 U pentomino
  [[0,16,0],[0,16,0],[16,16,16]],             // 16 Y pentomino
  [[17]],                                      // 17 1x1 single
  [[18,18,18],[18,0,18],[18,18,18]],          // 18 3x3 hueca
];

const PIECE_META = {
  1:  { kind: 'std',     letter: '' },
  2:  { kind: 'std',     letter: '' },
  3:  { kind: 'std',     letter: 'T' },
  4:  { kind: 'std',     letter: '' },
  5:  { kind: 'std',     letter: '' },
  6:  { kind: 'std',     letter: '' },
  7:  { kind: 'std',     letter: '' },
  8:  { kind: 'std',     letter: '' },
  9:  { kind: 'power',   effect: 'bomba',    letter: 'B' },
  10: { kind: 'power',   effect: 'rayo',     letter: 'R' },
  11: { kind: 'power',   effect: 'tinte',    letter: 'T' },
  12: { kind: 'power',   effect: 'gravedad', letter: 'G' },
  13: { kind: 'power',   effect: 'congelar', letter: 'F' },
  14: { kind: 'pentomino', letter: 'P' },
  15: { kind: 'pentomino', letter: 'U' },
  16: { kind: 'pentomino', letter: 'Y' },
  17: { kind: 'special', bonus: 100, letter: '+' },
  18: { kind: 'special', bonus: 200, letter: 'O' },
};

// Spawn weights (% of pieces). Standard tetrominoes 70% combined (8.75% each),
// power-ups 6% each (5 = 30%), pentominoes ~4% combined, specials 1% each.
const SPAWN_TABLE = [
  { idx: 1,  w: 8.75 },
  { idx: 2,  w: 8.75 },
  { idx: 3,  w: 8.75 },
  { idx: 4,  w: 8.75 },
  { idx: 5,  w: 8.75 },
  { idx: 6,  w: 8.75 },
  { idx: 7,  w: 8.75 },
  { idx: 8,  w: 8.75 },
  { idx: 9,  w: 6 },
  { idx: 10, w: 6 },
  { idx: 11, w: 6 },
  { idx: 12, w: 6 },
  { idx: 13, w: 6 },
  { idx: 14, w: 1.33 },
  { idx: 15, w: 1.33 },
  { idx: 16, w: 1.34 },
  { idx: 17, w: 1 },
  { idx: 18, w: 1 },
];

let SPAWN_CUMULATIVE = null;
function buildSpawnTable() {
  let total = 0;
  for (const e of SPAWN_TABLE) total += e.w;
  let acc = 0;
  SPAWN_CUMULATIVE = SPAWN_TABLE.map(e => { acc += e.w / total * 100; return { idx: e.idx, upTo: acc }; });
}

function pickWeighted() {
  if (!SPAWN_CUMULATIVE) buildSpawnTable();
  const r = Math.random() * 100;
  for (const e of SPAWN_CUMULATIVE) if (r <= e.upTo) return e.idx;
  return SPAWN_CUMULATIVE[SPAWN_CUMULATIVE.length - 1].idx;
}

const LINE_SCORES = [0, 100, 300, 500, 800];

const canvas = document.getElementById('board');
const boardEl = canvas;
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('next-canvas');
const nextCtx = nextCanvas.getContext('2d');
const scoreEl = document.getElementById('score');
const linesEl = document.getElementById('lines');
const levelEl = document.getElementById('level');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayScore = document.getElementById('overlay-score');
const restartBtn = document.getElementById('restart-btn');
const startScreen = document.getElementById('start-screen');

let board, current, next, score, lines, level, paused, gameOver, lastTime, dropAccum, dropInterval, animId;

// ---- Audio (Web Audio API) ----
let audioCtx = null;
const SOUND_TABLE = {
  move:     { freq: 220, dur: 0.04, type: 'square',   gain: 0.04 },
  rotate:   { freq: 330, dur: 0.06, type: 'square',   gain: 0.05 },
  lock:     { freq: 110, dur: 0.05, type: 'triangle', gain: 0.06 },
  line:     { freq: 660, dur: 0.10, type: 'square',   gain: 0.06 },
  tetris:   { freq: 880, dur: 0.25, type: 'square',   gain: 0.07 },
  tspin:    { freq: 700, dur: 0.18, type: 'sawtooth', gain: 0.06 },
  perfect:  { freq: 1100, dur: 0.35, type: 'sine',    gain: 0.07 },
  power:    { freq: 440, dur: 0.15, type: 'sawtooth', gain: 0.06 },
  energy:   { freq: 990, dur: 0.12, type: 'sine',     gain: 0.05 },
  win:      { freq: 880, dur: 0.5,  type: 'square',   gain: 0.07 },
  lose:     { freq: 110, dur: 0.6,  type: 'triangle', gain: 0.07 },
  swap:     { freq: 660, dur: 0.12, type: 'square',   gain: 0.05 },
  hold:     { freq: 550, dur: 0.10, type: 'square',   gain: 0.05 },
};

function ensureAudio() {
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      audioCtx = null;
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playTone(freq, dur, type = 'square', gain = 0.05) {
  const ctx = ensureAudio();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.value = gain;
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + dur);
}

function play(name) {
  const s = SOUND_TABLE[name];
  if (!s) return;
  playTone(s.freq, s.dur, s.type, s.gain);
}

function createBoard() {
  return Array.from({ length: ROWS }, () => new Array(COLS).fill(0));
}

function randomPiece() {
  const type = pickWeighted();
  const shape = PIECES[type].map(row => [...row]);
  return { type, shape, x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2), y: 0 };
}

function collide(shape, ox, oy) {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue;
      const nx = ox + c;
      const ny = oy + r;
      if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
      if (ny >= 0 && board[ny][nx]) return true;
    }
  }
  return false;
}

function rotateCW(shape) {
  const rows = shape.length, cols = shape[0].length;
  const result = Array.from({ length: cols }, () => new Array(rows).fill(0));
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      result[c][rows - 1 - r] = shape[r][c];
  return result;
}

function tryRotate() {
  const rotated = rotateCW(current.shape);
  const kicks = [0, -1, 1, -2, 2];
  for (const kick of kicks) {
    if (!collide(rotated, current.x + kick, current.y)) {
      current.shape = rotated;
      current.x += kick;
      return;
    }
  }
}

function merge() {
  for (let r = 0; r < current.shape.length; r++)
    for (let c = 0; c < current.shape[r].length; c++)
      if (current.shape[r][c])
        board[current.y + r][current.x + c] = current.shape[r][c];
}

function clearLines() {
  let cleared = 0;
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r].every(v => v !== 0)) {
      board.splice(r, 1);
      board.unshift(new Array(COLS).fill(0));
      cleared++;
      r++;
    }
  }
  if (cleared) {
    lines += cleared;
    score += (LINE_SCORES[cleared] || 0) * level;
    level = Math.floor(lines / 10) + 1;
    dropInterval = Math.max(100, 1000 - (level - 1) * 90);
    updateHUD();
  }
}

function ghostY() {
  let gy = current.y;
  while (!collide(current.shape, current.x, gy + 1)) gy++;
  return gy;
}

function hardDrop() {
  const gy = ghostY();
  score += (gy - current.y) * 2;
  current.y = gy;
  lockPiece();
}

function softDrop() {
  if (!collide(current.shape, current.x, current.y + 1)) {
    current.y++;
    score += 1;
    updateHUD();
  } else {
    lockPiece();
  }
}

function lockPiece() {
  merge();
  clearLines();
  spawn();
}

function spawn() {
  current = next;
  next = randomPiece();
  if (collide(current.shape, current.x, current.y)) {
    endGame();
  }
  drawNext();
}

function updateHUD() {
  scoreEl.textContent = score.toLocaleString();
  linesEl.textContent = lines;
  levelEl.textContent = level;
}

function drawBlock(context, x, y, colorIndex, size, alpha) {
  if (!colorIndex) return;
  const color = COLORS[colorIndex];
  context.globalAlpha = alpha ?? 1;
  context.fillStyle = color;
  context.fillRect(x * size + 1, y * size + 1, size - 2, size - 2);
  // highlight
  context.fillStyle = 'rgba(255,255,255,0.12)';
  context.fillRect(x * size + 1, y * size + 1, size - 2, 4);
  context.globalAlpha = 1;
}

function drawGrid() {
  ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue('--grid-line').trim();
  ctx.lineWidth = 0.5;
  for (let c = 1; c < COLS; c++) {
    ctx.beginPath();
    ctx.moveTo(c * BLOCK, 0);
    ctx.lineTo(c * BLOCK, ROWS * BLOCK);
    ctx.stroke();
  }
  for (let r = 1; r < ROWS; r++) {
    ctx.beginPath();
    ctx.moveTo(0, r * BLOCK);
    ctx.lineTo(COLS * BLOCK, r * BLOCK);
    ctx.stroke();
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGrid();

  // board
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      drawBlock(ctx, c, r, board[r][c], BLOCK);

  // ghost
  const gy = ghostY();
  for (let r = 0; r < current.shape.length; r++)
    for (let c = 0; c < current.shape[r].length; c++)
      if (current.shape[r][c])
        drawBlock(ctx, current.x + c, gy + r, current.shape[r][c], BLOCK, 0.2);

  // current piece
  for (let r = 0; r < current.shape.length; r++)
    for (let c = 0; c < current.shape[r].length; c++)
      drawBlock(ctx, current.x + c, current.y + r, current.shape[r][c], BLOCK);
}

function drawNext() {
  const NB = 30;
  nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
  const shape = next.shape;
  const offX = Math.floor((4 - shape[0].length) / 2);
  const offY = Math.floor((4 - shape.length) / 2);
  for (let r = 0; r < shape.length; r++)
    for (let c = 0; c < shape[r].length; c++)
      drawBlock(nextCtx, offX + c, offY + r, shape[r][c], NB);
}

function endGame() {
  gameOver = true;
  cancelAnimationFrame(animId);
  overlayTitle.textContent = 'GAME OVER';
  overlayScore.textContent = `Puntuación: ${score.toLocaleString()}`;
  overlay.classList.remove('hidden');
}

function togglePause() {
  if (gameOver) return;
  paused = !paused;
  if (paused) {
    cancelAnimationFrame(animId);
    overlayTitle.textContent = 'PAUSA';
    overlayScore.textContent = '';
    overlay.classList.remove('hidden');
  } else {
    overlay.classList.add('hidden');
    lastTime = performance.now();
    dropAccum = 0;
    animId = requestAnimationFrame(loop);
  }
}

function loop(ts) {
  const dt = ts - lastTime;
  lastTime = ts;
  dropAccum += dt;
  if (dropAccum >= dropInterval) {
    dropAccum = 0;
    if (!collide(current.shape, current.x, current.y + 1)) {
      current.y++;
    } else {
      lockPiece();
    }
  }
  if (gameOver) return;
  draw();
  animId = requestAnimationFrame(loop);
}

let mode = 'clasico';

function init(startMode = 'clasico') {
  mode = startMode;
  board = createBoard();
  score = 0;
  lines = 0;
  level = 1;
  paused = false;
  gameOver = false;
  dropInterval = 1000;
  dropAccum = 0;
  lastTime = performance.now();
  // State used by later phases (initialized to safe defaults so all phases can run independently).
  combo = -1;
  lastClearWasTetris = false;
  b2b = false;
  lastMoveWasRotation = false;
  lastKickIdx = -1;
  pendingTSpin = false;
  energy = 0;
  lastEnergyMilestone = 0;
  hold = null;
  holdUsed = false;
  challengeTimeLeft = 120000;
  challengeLinesTarget = 40;
  challengeWinFlag = false;
  frozenUntil = 0;
  nextQueue = [];
  floatingTexts = [];
  flashUntil = 0;
  flashColor = '#fff';
  slowmoUntil = 0;
  previewHold = 0;
  previewIndex = 0;
  next = randomPiece();
  spawn();
  updateHUD();
  overlay.classList.add('hidden');
  if (startScreen) startScreen.classList.add('hidden');
  cancelAnimationFrame(animId);
  animId = requestAnimationFrame(loop);
}

// New state vars (declared up here so init() can reset them).
let combo, lastClearWasTetris, b2b, lastMoveWasRotation, lastKickIdx, pendingTSpin;
let energy, lastEnergyMilestone;
let hold, holdUsed;
let challengeTimeLeft, challengeLinesTarget, challengeWinFlag;
let frozenUntil;
let nextQueue;
let floatingTexts;
let flashUntil, flashColor;
let slowmoUntil;
let previewHold, previewIndex;

const controls = {
  left() {
    if (paused || gameOver || !current) return;
    if (!collide(current.shape, current.x - 1, current.y)) current.x--;
    updateHUD();
  },
  right() {
    if (paused || gameOver || !current) return;
    if (!collide(current.shape, current.x + 1, current.y)) current.x++;
    updateHUD();
  },
  rotate() {
    if (paused || gameOver || !current) return;
    tryRotate();
    updateHUD();
  },
  softDrop() {
    if (paused || gameOver || !current) return;
    softDrop();
  },
  hardDrop() {
    if (paused || gameOver || !current) return;
    hardDrop();
    updateHUD();
  },
  togglePause() {
    if (gameOver) return;
    togglePause();
  },
  restart() {
    init(mode);
  },
};

document.addEventListener('keydown', e => {
  switch (e.code) {
    case 'ArrowLeft':  e.preventDefault(); controls.left();        break;
    case 'ArrowRight': e.preventDefault(); controls.right();       break;
    case 'ArrowDown':                      controls.softDrop();    break;
    case 'ArrowUp':
    case 'KeyX':                           controls.rotate();      break;
    case 'Space':      e.preventDefault(); controls.hardDrop();    break;
    case 'KeyP':                           controls.togglePause(); break;
    case 'KeyR':                           controls.restart();     break;
  }
});

restartBtn.addEventListener('click', controls.restart);

const REPEAT_DELAY_MS = 170;
const REPEAT_RATE_MS = 50;
const REPEAT_ACTIONS = new Set(['left', 'right', 'softDrop']);

function bindTouchButton(el) {
  const action = el.dataset.action;
  if (!action || !controls[action]) return;
  let timer = null;

  const start = e => {
    e.preventDefault();
    controls[action]();
    if (REPEAT_ACTIONS.has(action)) {
      timer = setTimeout(function tick() {
        controls[action]();
        timer = setTimeout(tick, REPEAT_RATE_MS);
      }, REPEAT_DELAY_MS);
    }
  };

  const cancel = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  el.addEventListener('pointerdown', start);
  el.addEventListener('pointerup', cancel);
  el.addEventListener('pointercancel', cancel);
  el.addEventListener('pointerleave', cancel);
  el.addEventListener('click', e => e.preventDefault());
}

document.querySelectorAll('.tc-btn').forEach(bindTouchButton);

const TAP_MAX_MS = 250;
const TAP_MAX_PX = 10;
const SWIPE_MIN_PX = 28;
const SWIPE_VDOWN_PX = 40;
const LONGPRESS_MS = 350;

let gesture = null;

boardEl.addEventListener('pointerdown', e => {
  if (paused || gameOver) return;
  gesture = {
    startX: e.clientX,
    startY: e.clientY,
    startT: performance.now(),
    pointerId: e.pointerId,
    longTimer: setTimeout(() => {
      if (gesture) controls.softDrop();
    }, LONGPRESS_MS),
  };
  boardEl.setPointerCapture(e.pointerId);
});

boardEl.addEventListener('pointerup', e => {
  if (!gesture || e.pointerId !== gesture.pointerId) return;
  clearTimeout(gesture.longTimer);

  const dx = e.clientX - gesture.startX;
  const dy = e.clientY - gesture.startY;
  const dt = performance.now() - gesture.startT;

  if (dt < TAP_MAX_MS && Math.abs(dx) < TAP_MAX_PX && Math.abs(dy) < TAP_MAX_PX) {
    controls.rotate();
  } else if (dy > SWIPE_VDOWN_PX && Math.abs(dy) > Math.abs(dx)) {
    controls.hardDrop();
  } else if (Math.abs(dx) > SWIPE_MIN_PX && Math.abs(dx) > Math.abs(dy)) {
    if (dx < 0) controls.left(); else controls.right();
  }

  gesture = null;
  if (boardEl.hasPointerCapture(e.pointerId)) boardEl.releasePointerCapture(e.pointerId);
});

boardEl.addEventListener('pointercancel', e => {
  if (gesture) {
    clearTimeout(gesture.longTimer);
    gesture = null;
  }
});

const themeToggle = document.getElementById('theme-toggle');
const toggleIcon = themeToggle.querySelector('.toggle-icon');
const toggleLabel = themeToggle.querySelector('.toggle-label');

function applyTheme(isLight) {
  if (isLight) {
    document.body.classList.add('light-mode');
    toggleIcon.textContent = '☀';
    toggleLabel.textContent = 'DARK';
  } else {
    document.body.classList.remove('light-mode');
    toggleIcon.textContent = '☾';
    toggleLabel.textContent = 'LIGHT';
  }
}

const savedTheme = localStorage.getItem('tetris-theme');
applyTheme(savedTheme === 'light');

themeToggle.addEventListener('click', () => {
  const isLight = !document.body.classList.contains('light-mode');
  applyTheme(isLight);
  localStorage.setItem('tetris-theme', isLight ? 'light' : 'dark');
});

// Start screen: show initially, then init(mode) on user choice.
function startGame(selectedMode) {
  ensureAudio();
  buildSpawnTable();
  startScreen.classList.add('hidden');
  init(selectedMode);
}

document.querySelectorAll('.start-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const m = btn.dataset.mode || 'clasico';
    startGame(m);
  });
});