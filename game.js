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
  '#ef5350', // Z - red (shifted from #e57373 to free up #ff5252 for Bomba)
  '#90caf9', // J - pale blue
  '#ffb74d', // L - orange
  '#9e9e9e', // N - tuerca (gris metálico)
  '#ff5252', // 9 Bomba
  '#ffeb3b', // 10 Rayo
  '#e040fb', // 11 Tinte
  '#795548', // 12 Gravedad
  '#80deea', // 13 Congelar
  '#aed581', // 14 P
  '#ff8a65', // 15 U
  '#ce93d8', // 16 Y
  '#fff176', // 17 1x1
  '#4fc3f7', // 18 3x3 hueca
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
const challengeTimeSection = document.getElementById('challenge-time-section');
const challengeTargetSection = document.getElementById('challenge-target-section');
const timeEl = document.getElementById('time');
const linesDoneEl = document.getElementById('lines-done');
const linesTargetEl = document.getElementById('lines-target');
const energySegs = Array.from(document.querySelectorAll('.energy-seg'));
const abilityStatusEl = document.getElementById('ability-status');
const holdCanvas = document.getElementById('hold-canvas');
const holdCtx = holdCanvas ? holdCanvas.getContext('2d') : null;

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

function fillQueue() {
  while (nextQueue.length < 5) nextQueue.push(randomPiece());
}

function spawnXFor(shape) {
  return Math.floor(COLS / 2) - Math.floor(shape[0].length / 2);
}

function updateEnergyBar() {
  if (!energySegs || !energySegs.length) return;
  for (let i = 0; i < energySegs.length; i++) {
    energySegs[i].classList.toggle('filled', i < energy);
  }
}

function updateAbilityStatus() {
  if (!abilityStatusEl) return;
  const parts = [];
  if (previewHold > 0) {
    const sec = Math.ceil(previewHold / 1000);
    parts.push(`NEXTx5 ${sec}s`);
  }
  if (performance.now() < slowmoUntil) {
    const sec = Math.ceil((slowmoUntil - performance.now()) / 1000);
    parts.push(`SLOW ${sec}s`);
  }
  abilityStatusEl.textContent = parts.join(' · ');
}

function gainEnergy() {
  const milestone = Math.floor(lines / 10);
  if (milestone > lastEnergyMilestone) {
    const gain = Math.min(3 - energy, milestone - lastEnergyMilestone);
    if (gain > 0) {
      energy += gain;
      lastEnergyMilestone = milestone;
      updateEnergyBar();
      play('energy');
    }
  }
}

function ability1() {
  if (paused || gameOver || energy < 1) return;
  if (!nextQueue || nextQueue.length < 5) return;
  energy--;
  previewHold = 4000;
  previewIndex = 0;
  play('energy');
  updateEnergyBar();
  updateAbilityStatus();
  floatingTexts.push({ x: Math.floor(COLS / 2), y: 1, text: 'PREVIEW 5', color: '#7aa2f7', ttl: 800 });
}

function ability2() {
  if (paused || gameOver || energy < 1) return;
  if (performance.now() < slowmoUntil) return;
  energy--;
  slowmoUntil = performance.now() + 10000;
  play('energy');
  updateEnergyBar();
  updateAbilityStatus();
  floatingTexts.push({ x: Math.floor(COLS / 2), y: 1, text: 'SLOW 10s', color: '#80deea', ttl: 1000 });
}

function ability3() {
  if (paused || gameOver || !current || energy < 1) return;
  if (!nextQueue || nextQueue.length < 1) return;
  // Pick a random piece from the queue (excluding index 0 to avoid trivial swap with next).
  const span = Math.min(5, nextQueue.length);
  const idx = Math.floor(Math.random() * span);
  const candidate = nextQueue[idx];
  const testX = spawnXFor(candidate.shape);
  if (collide(candidate.shape, testX, 0)) return; // abort silently, no refund
  const newCurrent = { type: candidate.type, shape: candidate.shape.map(r => [...r]), x: testX, y: 0 };
  // Push the OLD current into the slot we pulled from, so the queue stays the same length semantically.
  nextQueue[idx] = { type: current.type, shape: current.shape.map(r => [...r]), x: 0, y: 0 };
  current = newCurrent;
  energy--;
  play('swap');
  updateEnergyBar();
  updateAbilityStatus();
  floatingTexts.push({ x: current.x + 1, y: current.y, text: 'SWAP', color: '#fff176', ttl: 800 });
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
  for (let i = 0; i < kicks.length; i++) {
    const kick = kicks[i];
    if (!collide(rotated, current.x + kick, current.y)) {
      current.shape = rotated;
      current.x += kick;
      lastMoveWasRotation = true;
      lastKickIdx = i;
      // T-spin detection: 3+ diagonal corners blocked around the T's center.
      if (current.type === 3) {
        const cx = current.x + 1, cy = current.y + 1;
        let blocked = 0;
        for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
          const nx = cx + dx, ny = cy + dy;
          if (nx < 0 || nx >= COLS || ny >= ROWS || (ny >= 0 && board[ny][nx])) blocked++;
        }
        pendingTSpin = blocked >= 3 || (blocked === 2 && i > 0);
      } else {
        pendingTSpin = false;
      }
      return true;
    }
  }
  return false;
}

function merge() {
  for (let r = 0; r < current.shape.length; r++)
    for (let c = 0; c < current.shape[r].length; c++)
      if (current.shape[r][c])
        board[current.y + r][current.x + c] = current.shape[r][c];
}

// ---- Power-up effects ----
function effectBomba() {
  // Clear a 3x3 area centered on the piece's geometric center.
  const rows = current.shape.length;
  const cols = current.shape[0].length;
  const cc = current.x + Math.floor(cols / 2);
  const cr = current.y + Math.floor(rows / 2);
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const nr = cr + dr;
      const nc = cc + dc;
      if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue;
      if (board[nr][nc]) {
        board[nr][nc] = 0;
        score += 5;
      }
    }
  }
  floatingTexts.push({ x: cc, y: cr, text: 'BOOM', color: COLORS[9], ttl: 900 });
  play('power');
}

function effectRayo() {
  // Pick the row OR column that clears the most blocks.
  let bestRow = -1, bestRowCount = 0;
  for (let r = 0; r < ROWS; r++) {
    let n = 0;
    for (let c = 0; c < COLS; c++) if (board[r][c]) n++;
    if (n > bestRowCount) { bestRowCount = n; bestRow = r; }
  }
  let bestCol = -1, bestColCount = 0;
  for (let c = 0; c < COLS; c++) {
    let n = 0;
    for (let r = 0; r < ROWS; r++) if (board[r][c]) n++;
    if (n > bestColCount) { bestColCount = n; bestCol = c; }
  }
  if (bestColCount >= bestRowCount && bestCol >= 0) {
    for (let r = 0; r < ROWS; r++) if (board[r][bestCol]) { board[r][bestCol] = 0; score += 2; }
    floatingTexts.push({ x: bestCol, y: Math.floor(ROWS / 2), text: 'RAYO!', color: COLORS[10], ttl: 900 });
  } else if (bestRow >= 0) {
    for (let c = 0; c < COLS; c++) if (board[bestRow][c]) { board[bestRow][c] = 0; score += 2; }
    floatingTexts.push({ x: Math.floor(COLS / 2), y: bestRow, text: 'RAYO!', color: COLORS[10], ttl: 900 });
  }
  play('power');
}

function effectTinte() {
  // Tally colors on the board. Pick the most common (excluding 0).
  const counts = new Array(COLORS.length).fill(0);
  let total = 0;
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      if (board[r][c]) { counts[board[r][c]]++; total++; }
  if (!total) { play('power'); return; }
  let target = 1;
  for (let i = 2; i < counts.length; i++) {
    if (counts[i] > counts[target]) target = i;
  }
  if (target === current.type) { play('power'); return; }
  let changed = 0;
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      if (board[r][c] === target) { board[r][c] = current.type; changed++; }
  score += changed * 2;
  floatingTexts.push({ x: Math.floor(COLS / 2), y: Math.floor(ROWS / 2), text: 'TINTE', color: COLORS[11], ttl: 900 });
  play('power');
}

function effectGravedad() {
  // Compact each column: shift non-zero cells down.
  let dropped = 0;
  for (let c = 0; c < COLS; c++) {
    const stack = [];
    for (let r = 0; r < ROWS; r++) if (board[r][c]) stack.push(board[r][c]);
    for (let r = 0; r < ROWS; r++) {
      const v = r < ROWS - stack.length ? 0 : stack[r - (ROWS - stack.length)];
      if (board[r][c] !== v) {
        if (board[r][c] && !v) dropped++;
        board[r][c] = v;
      }
    }
  }
  score += dropped * 3;
  floatingTexts.push({ x: Math.floor(COLS / 2), y: Math.floor(ROWS / 2), text: 'GRAVEDAD', color: COLORS[12], ttl: 900 });
  play('power');
}

function effectCongelar() {
  frozenUntil = performance.now() + 5000;
  floatingTexts.push({ x: Math.floor(COLS / 2), y: Math.floor(ROWS / 2), text: 'FROZEN 5s', color: COLORS[13], ttl: 1500 });
  play('power');
}

function applyPowerUp(effect) {
  switch (effect) {
    case 'bomba':    effectBomba();    break;
    case 'rayo':     effectRayo();     break;
    case 'tinte':    effectTinte();    break;
    case 'gravedad': effectGravedad(); break;
    case 'congelar': effectCongelar(); break;
  }
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
    const isTetris = cleared === 4;
    const isTSpin = pendingTSpin && current && current.type === 3 && lastMoveWasRotation;
    const base = (LINE_SCORES[cleared] || 0) * level;
    const comboMult = 1 + Math.max(combo, 0) * 0.5;
    const b2bMult = (b2b && isTetris) ? 1.5 : 1;
    let gained = base * comboMult * b2bMult;
    // Perfect Clear
    let isPC = false;
    for (let r = 0; r < ROWS && !isPC; r++)
      for (let c = 0; c < COLS && !isPC; c++)
        if (board[r][c]) isPC = true;
    isPC = !isPC;
    if (isPC) gained += 2000 * level;
    if (isTSpin) gained += 400 * level;
    score += gained;
    // Floating text
    if (isTSpin) {
      floatingTexts.push({ x: current.x + 1, y: current.y, text: 'T-SPIN +' + Math.floor(400 * level), color: '#ba68c8', ttl: 1100 });
      play('tspin');
    } else if (isPC) {
      floatingTexts.push({ x: Math.floor(COLS / 2), y: Math.floor(ROWS / 2), text: 'PERFECT CLEAR!', color: '#80deea', ttl: 1400 });
      play('perfect');
    } else if (isTetris) {
      floatingTexts.push({ x: Math.floor(COLS / 2), y: Math.floor(ROWS / 2), text: 'TETRIS' + (b2bMult > 1 ? ' B2B' : ''), color: '#ffd54f', ttl: 1100 });
      play('tetris');
    } else {
      floatingTexts.push({ x: Math.floor(COLS / 2), y: Math.floor(ROWS / 2), text: '+' + Math.floor(gained), color: '#fff', ttl: 700 });
      play('line');
    }
    // Combo tracking
    combo++;
    if (combo > 0) {
      floatingTexts.push({ x: Math.floor(COLS / 2), y: Math.max(0, Math.floor(ROWS / 2) - 3), text: 'x' + combo + ' COMBO', color: '#fff176', ttl: 900 });
    }
    // B2B tracking: only consecutive Tetrises keep the chain.
    if (isTetris) {
      b2b = lastClearWasTetris;
    } else {
      b2b = false;
    }
    lastClearWasTetris = isTetris;
    // Level & speed
    level = Math.floor(lines / 10) + 1;
    dropInterval = Math.max(100, 1000 - (level - 1) * 90);
    gainEnergy();
    updateHUD();
  } else {
    // No line clear this lock: reset combo (but only if the piece actually locked, not during touch drags etc.)
    if (current) combo = -1;
  }
  pendingTSpin = false;
  lastMoveWasRotation = false;
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
  if (current && current.type >= 9 && current.type <= 13) {
    const meta = PIECE_META[current.type];
    if (meta && meta.effect) applyPowerUp(meta.effect);
  }
  // Special-piece bonus (1x1, 3x3 hollow)
  if (current) {
    const meta = PIECE_META[current.type];
    if (meta && meta.bonus) {
      score += meta.bonus;
      floatingTexts.push({
        x: current.x + Math.floor(current.shape[0].length / 2),
        y: current.y + Math.floor(current.shape.length / 2),
        text: '+' + meta.bonus,
        color: COLORS[current.type],
        ttl: 1200,
      });
      play('hold');
    }
  }
  play('lock');
  clearLines();
  spawn();
}

function spawn() {
  if (nextQueue.length === 0) fillQueue();
  current = nextQueue.shift();
  fillQueue();
  if (collide(current.shape, current.x, current.y)) {
    endGame();
  }
  holdUsed = false;
  updateHoldDim();
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
  // power-up letter overlay (9-13)
  if (colorIndex >= 9 && colorIndex <= 13) {
    const meta = PIECE_META[colorIndex];
    if (meta && meta.letter) {
      context.globalAlpha = alpha ?? 1;
      context.fillStyle = '#000';
      context.font = `bold ${Math.floor(size * 0.55)}px 'Courier New', monospace`;
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(meta.letter, x * size + size / 2, y * size + size / 2);
    }
  }
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

  // floating texts (power-up effects, bonuses)
  if (floatingTexts && floatingTexts.length) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const ft of floatingTexts) {
      const fade = Math.max(0, Math.min(1, ft.ttl / 1000));
      const rise = (1 - fade) * 30;
      ctx.globalAlpha = fade;
      ctx.fillStyle = ft.color;
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 3;
      ctx.font = "bold 18px 'Courier New', monospace";
      ctx.strokeText(ft.text, ft.x * BLOCK + BLOCK / 2, ft.y * BLOCK + BLOCK / 2 - rise);
      ctx.fillText(ft.text, ft.x * BLOCK + BLOCK / 2, ft.y * BLOCK + BLOCK / 2 - rise);
    }
    ctx.globalAlpha = 1;
  }
}

function drawNext() {
  const NB = 30;
  const VIEW = 4; // 4x4 preview window
  nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
  if (!nextQueue || nextQueue.length === 0) return;
  // If preview-5 ability is active, cycle through pieces.
  let previewPiece = null;
  if (previewHold > 0 && nextQueue.length >= 5) {
    const step = Math.floor((4000 - previewHold) / 800);
    const idx = Math.min(step, nextQueue.length - 1);
    previewPiece = nextQueue[idx];
    // Frame + label
    nextCtx.strokeStyle = '#7aa2f7';
    nextCtx.lineWidth = 2;
    nextCtx.strokeRect(1, 1, nextCanvas.width - 2, nextCanvas.height - 2);
    nextCtx.fillStyle = '#7aa2f7';
    nextCtx.font = "10px 'Courier New', monospace";
    nextCtx.textAlign = 'left';
    nextCtx.textBaseline = 'top';
    nextCtx.fillText(`${idx + 1}/5`, 4, 4);
  }
  const shape = (previewPiece || nextQueue[0]).shape;
  // Compute actual bbox of non-zero cells so 3x3 pieces aren't top-left aligned.
  let minR = shape.length, maxR = -1, minC = shape[0].length, maxC = -1;
  for (let r = 0; r < shape.length; r++)
    for (let c = 0; c < shape[r].length; c++)
      if (shape[r][c]) { if (r < minR) minR = r; if (r > maxR) maxR = r; if (c < minC) minC = c; if (c > maxC) maxC = c; }
  if (maxR < 0) return;
  const w = maxC - minC + 1;
  const h = maxR - minR + 1;
  const offX = Math.floor((VIEW - w) / 2) - minC;
  const offY = Math.floor((VIEW - h) / 2) - minR;
  for (let r = 0; r < shape.length; r++)
    for (let c = 0; c < shape[r].length; c++)
      drawBlock(nextCtx, offX + c, offY + r, shape[r][c], NB);
}

function drawHold() {
  if (!holdCtx || !holdCanvas) return;
  const NB = 30;
  const VIEW = 4;
  holdCtx.clearRect(0, 0, holdCanvas.width, holdCanvas.height);
  if (!hold) return;
  const shape = hold.shape;
  let minR = shape.length, maxR = -1, minC = shape[0].length, maxC = -1;
  for (let r = 0; r < shape.length; r++)
    for (let c = 0; c < shape[r].length; c++)
      if (shape[r][c]) { if (r < minR) minR = r; if (r > maxR) maxR = r; if (c < minC) minC = c; if (c > maxC) maxC = c; }
  if (maxR < 0) return;
  const w = maxC - minC + 1;
  const h = maxR - minR + 1;
  const offX = Math.floor((VIEW - w) / 2) - minC;
  const offY = Math.floor((VIEW - h) / 2) - minR;
  for (let r = 0; r < shape.length; r++)
    for (let c = 0; c < shape[r].length; c++)
      drawBlock(holdCtx, offX + c, offY + r, shape[r][c], NB);
}

function updateHoldDim() {
  if (!holdCanvas) return;
  holdCanvas.classList.toggle('dim-when-used', holdUsed);
}

function doHold() {
  if (paused || gameOver || !current || holdUsed) return;
  if (!hold) {
    // Store current, advance to next.
    hold = { type: current.type, shape: PIECES[current.type].map(r => [...r]) };
    spawn();
  } else {
    // Swap with hold.
    const tmp = { type: current.type, shape: current.shape.map(r => [...r]) };
    const newType = hold.type;
    const newShape = PIECES[newType].map(r => [...r]);
    const testX = spawnXFor(newShape);
    if (collide(newShape, testX, 0)) {
      // Swap would cause immediate game over; abort without changing state.
      return;
    }
    current = { type: newType, shape: newShape, x: testX, y: 0 };
    hold = tmp;
  }
  holdUsed = true;
  drawHold();
  updateHoldDim();
  play('hold');
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

function formatTime(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  return `${mm}:${ss.toString().padStart(2, '0')}`;
}

function updateChallengeHUD() {
  if (mode !== 'reto') return;
  if (timeEl) timeEl.textContent = formatTime(challengeTimeLeft);
  if (linesDoneEl) linesDoneEl.textContent = Math.min(lines, challengeLinesTarget);
  if (linesTargetEl) linesTargetEl.textContent = challengeLinesTarget;
}

function endChallenge(win) {
  gameOver = true;
  cancelAnimationFrame(animId);
  if (win) {
    overlayTitle.textContent = '¡VICTORIA!';
    overlayScore.textContent = `${challengeLinesTarget} líneas en ${formatTime(challengeTimeLeft)} · ${score.toLocaleString()} pts`;
    play('win');
  } else {
    overlayTitle.textContent = 'GAME OVER';
    overlayScore.textContent = `Conseguiste ${lines}/${challengeLinesTarget} líneas · ${score.toLocaleString()} pts`;
    play('lose');
  }
  overlay.classList.remove('hidden');
}

function loop(ts) {
  const dt = ts - lastTime;
  lastTime = ts;
  const frozen = ts < frozenUntil;
  const slowmo = ts < slowmoUntil;
  const effectiveDrop = slowmo ? dropInterval * 2 : dropInterval;
  if (!frozen) {
    dropAccum += dt;
    if (dropAccum >= effectiveDrop) {
      dropAccum = 0;
      if (!collide(current.shape, current.x, current.y + 1)) {
        current.y++;
      } else {
        lockPiece();
      }
    }
  }
  // Decay floating texts.
  if (floatingTexts && floatingTexts.length) {
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
      floatingTexts[i].ttl -= dt;
      if (floatingTexts[i].ttl <= 0) floatingTexts.splice(i, 1);
    }
  }
  // Challenge mode timer
  if (mode === 'reto' && !paused && !gameOver) {
    challengeTimeLeft -= dt;
    updateChallengeHUD();
    if (lines >= challengeLinesTarget) {
      endChallenge(true);
    } else if (challengeTimeLeft <= 0) {
      challengeTimeLeft = 0;
      endChallenge(false);
    }
  }
  // Ability timers
  if (previewHold > 0) {
    previewHold -= dt;
    if (previewHold <= 0) { previewHold = 0; drawNext(); }
    else { drawNext(); }
    updateAbilityStatus();
  }
  if (performance.now() < slowmoUntil) {
    updateAbilityStatus();
  } else if (abilityStatusEl && abilityStatusEl.textContent.includes('SLOW')) {
    updateAbilityStatus();
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
  fillQueue();
  floatingTexts = [];
  flashUntil = 0;
  flashColor = '#fff';
  slowmoUntil = 0;
  previewHold = 0;
  previewIndex = 0;
  spawn();
  updateHUD();
  updateEnergyBar();
  updateAbilityStatus();
  drawHold();
  updateHoldDim();
  overlay.classList.add('hidden');
  if (startScreen) startScreen.classList.add('hidden');
  if (challengeTimeSection) challengeTimeSection.style.display = mode === 'reto' ? '' : 'none';
  if (challengeTargetSection) challengeTargetSection.style.display = mode === 'reto' ? '' : 'none';
  if (mode === 'reto') updateChallengeHUD();
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
    if (!collide(current.shape, current.x - 1, current.y)) {
      current.x--;
      lastMoveWasRotation = false;
      play('move');
    }
    updateHUD();
  },
  right() {
    if (paused || gameOver || !current) return;
    if (!collide(current.shape, current.x + 1, current.y)) {
      current.x++;
      lastMoveWasRotation = false;
      play('move');
    }
    updateHUD();
  },
  rotate() {
    if (paused || gameOver || !current) return;
    if (tryRotate()) play('rotate');
    updateHUD();
  },
  softDrop() {
    if (paused || gameOver || !current) return;
    lastMoveWasRotation = false;
    softDrop();
  },
  hardDrop() {
    if (paused || gameOver || !current) return;
    lastMoveWasRotation = false;
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
  ability1() { ability1(); },
  ability2() { ability2(); },
  ability3() { ability3(); },
  hold() { doHold(); },
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
    case 'Digit1':                         controls.ability1();    break;
    case 'Digit2':                         controls.ability2();    break;
    case 'Digit3':                         controls.ability3();    break;
    case 'KeyC':
    case 'ShiftLeft':
    case 'ShiftRight':                     controls.hold();        break;
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
document.querySelectorAll('.ab-btn').forEach(el => {
  el.addEventListener('pointerdown', e => { e.preventDefault(); ensureAudio(); controls[el.dataset.action](); });
  el.addEventListener('click', e => e.preventDefault());
});

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

// Adjust challenge timer when the tab becomes visible again (compensate rAF throttling).
let lastVisibleAt = Date.now();
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    lastVisibleAt = Date.now();
  } else {
    const elapsed = Date.now() - lastVisibleAt;
    if (mode === 'reto' && !paused && !gameOver) {
      challengeTimeLeft -= elapsed;
    }
    lastTime = performance.now();
  }
});