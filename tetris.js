// Tencho Tetris - YouTube-thumbnail themed tetris with quad-line celebration,
// best-score persistence, combo bonus, floating score popups, and share button.
(() => {
  'use strict';

  // ---------- Config ----------
  const COLS = 10;
  const ROWS = 20;
  const CELL = 32;

  const COLORS = {
    I: '#3ad4ff',
    O: '#ffd400',
    T: '#c96bff',
    S: '#3fd96a',
    Z: '#ff3c5b',
    J: '#2f5dff',
    L: '#ff8a1e',
    GHOST: 'rgba(255, 255, 255, 0.18)',
  };

  const SHAPES = {
    I: [
      [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
      [[0,0,1,0],[0,0,1,0],[0,0,1,0],[0,0,1,0]],
      [[0,0,0,0],[0,0,0,0],[1,1,1,1],[0,0,0,0]],
      [[0,1,0,0],[0,1,0,0],[0,1,0,0],[0,1,0,0]],
    ],
    O: [
      [[0,1,1,0],[0,1,1,0],[0,0,0,0],[0,0,0,0]],
      [[0,1,1,0],[0,1,1,0],[0,0,0,0],[0,0,0,0]],
      [[0,1,1,0],[0,1,1,0],[0,0,0,0],[0,0,0,0]],
      [[0,1,1,0],[0,1,1,0],[0,0,0,0],[0,0,0,0]],
    ],
    T: [
      [[0,1,0,0],[1,1,1,0],[0,0,0,0],[0,0,0,0]],
      [[0,1,0,0],[0,1,1,0],[0,1,0,0],[0,0,0,0]],
      [[0,0,0,0],[1,1,1,0],[0,1,0,0],[0,0,0,0]],
      [[0,1,0,0],[1,1,0,0],[0,1,0,0],[0,0,0,0]],
    ],
    S: [
      [[0,1,1,0],[1,1,0,0],[0,0,0,0],[0,0,0,0]],
      [[0,1,0,0],[0,1,1,0],[0,0,1,0],[0,0,0,0]],
      [[0,0,0,0],[0,1,1,0],[1,1,0,0],[0,0,0,0]],
      [[1,0,0,0],[1,1,0,0],[0,1,0,0],[0,0,0,0]],
    ],
    Z: [
      [[1,1,0,0],[0,1,1,0],[0,0,0,0],[0,0,0,0]],
      [[0,0,1,0],[0,1,1,0],[0,1,0,0],[0,0,0,0]],
      [[0,0,0,0],[1,1,0,0],[0,1,1,0],[0,0,0,0]],
      [[0,1,0,0],[1,1,0,0],[1,0,0,0],[0,0,0,0]],
    ],
    J: [
      [[1,0,0,0],[1,1,1,0],[0,0,0,0],[0,0,0,0]],
      [[0,1,1,0],[0,1,0,0],[0,1,0,0],[0,0,0,0]],
      [[0,0,0,0],[1,1,1,0],[0,0,1,0],[0,0,0,0]],
      [[0,1,0,0],[0,1,0,0],[1,1,0,0],[0,0,0,0]],
    ],
    L: [
      [[0,0,1,0],[1,1,1,0],[0,0,0,0],[0,0,0,0]],
      [[0,1,0,0],[0,1,0,0],[0,1,1,0],[0,0,0,0]],
      [[0,0,0,0],[1,1,1,0],[1,0,0,0],[0,0,0,0]],
      [[1,1,0,0],[0,1,0,0],[0,1,0,0],[0,0,0,0]],
    ],
  };
  const TYPES = Object.keys(SHAPES);
  const KICKS = [ [0,0], [-1,0], [1,0], [0,-1], [-2,0], [2,0], [0,-2] ];

  const SHARE_URL = 'https://maxtakaharu34-cmd.github.io/tencho-tetris/';
  const BEST_KEY = 'tt-best';
  const MUTE_KEY = 'tt-muted';

  // ---------- DOM ----------
  const boardCanvas = document.getElementById('board');
  const fxCanvas = document.getElementById('fx');
  const nextCanvas = document.getElementById('next');
  const holdCanvas = document.getElementById('hold');
  const ctx = boardCanvas.getContext('2d');
  const fxCtx = fxCanvas.getContext('2d');
  const nextCtx = nextCanvas.getContext('2d');
  const holdCtx = holdCanvas.getContext('2d');

  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const linesEl = document.getElementById('lines');
  const levelEl = document.getElementById('level');
  const bannerEl = document.getElementById('banner');
  const bannerTextEl = document.getElementById('banner-text');
  const comboBannerEl = document.getElementById('combo-banner');
  const cutinEl = document.getElementById('cutin');
  const cutinNumEl = document.getElementById('cutin-num');
  const boardFrameEl = document.querySelector('.board-frame');
  const floatersEl = document.getElementById('floaters');
  const overlayEl = document.getElementById('overlay');
  const finalScoreEl = document.getElementById('final-score');
  const finalBestEl = document.getElementById('final-best');
  const newBestTagEl = document.getElementById('new-best-tag');
  const toastEl = document.getElementById('toast');
  const btnMute = document.getElementById('btn-mute');
  const btnPause = document.getElementById('btn-pause');
  const btnRestart = document.getElementById('btn-restart');
  const btnAgain = document.getElementById('btn-again');
  const btnShare = document.getElementById('btn-share');
  const touchEl = document.getElementById('touch');

  // ---------- Audio ----------
  const Sound = (() => {
    let ac = null;
    let muted = localStorage.getItem(MUTE_KEY) === '1';
    const ensure = () => {
      if (!ac) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC) ac = new AC();
      }
      if (ac && ac.state === 'suspended') ac.resume();
      return ac;
    };
    const tone = (freq, dur, type = 'sine', volume = 0.18, when = 0) => {
      if (muted) return;
      const a = ensure();
      if (!a) return;
      const t0 = a.currentTime + when;
      const osc = a.createOscillator();
      const g = a.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t0);
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(volume, t0 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(g).connect(a.destination);
      osc.start(t0);
      osc.stop(t0 + dur + 0.05);
    };
    const sweep = (from, to, dur, type = 'sawtooth', volume = 0.2) => {
      if (muted) return;
      const a = ensure();
      if (!a) return;
      const t0 = a.currentTime;
      const osc = a.createOscillator();
      const g = a.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(from, t0);
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), t0 + dur);
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(volume, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(g).connect(a.destination);
      osc.start(t0);
      osc.stop(t0 + dur + 0.05);
    };
    return {
      move:   () => tone(220, 0.04, 'sine', 0.08),
      rotate: () => tone(360, 0.06, 'square', 0.08),
      land:   () => tone(140, 0.1, 'triangle', 0.15),
      hold:   () => tone(500, 0.08, 'sine', 0.1),
      clear:  (n) => {
        const freqs = [261.6, 329.6, 392.0];
        freqs.forEach((f) => tone(f * (1 + n * 0.05), 0.2 + n * 0.03, 'triangle', 0.12));
      },
      combo:  (c) => {
        tone(520 + c * 40, 0.12, 'square', 0.13);
      },
      tetris: () => {
        const notes = [392.0, 523.3, 659.3, 784.0, 1046.5];
        notes.forEach((f, i) => tone(f, 0.22, 'square', 0.12, i * 0.09));
        tone(80, 0.4, 'sine', 0.3, 0);
        tone(120, 0.4, 'sine', 0.25, 0.15);
      },
      gameover: () => sweep(440, 90, 0.9, 'sawtooth', 0.22),
      toggleMute() {
        muted = !muted;
        localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
        return muted;
      },
      isMuted() { return muted; },
      prime() { ensure(); },
    };
  })();
  btnMute.textContent = Sound.isMuted() ? '🔇' : '🔊';

  // ---------- State ----------
  const emptyBoard = () => Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  let board = emptyBoard();
  let bag = [];
  let current = null;
  let nextPiece = null;
  let holdPiece = null;
  let holdLocked = false;
  let score = 0;
  let best = Number(localStorage.getItem(BEST_KEY) || 0);
  let lines = 0;
  let level = 1;
  let combo = 0;
  let dropInterval = 1000;
  let dropAcc = 0;
  let lastT = 0;
  let paused = false;
  let gameover = false;
  const rowFlashes = []; // { y, t, life }
  const particles = [];

  // ---------- Helpers ----------
  const nextBag = () => {
    const b = TYPES.slice();
    for (let i = b.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [b[i], b[j]] = [b[j], b[i]];
    }
    return b;
  };
  const takeType = () => {
    if (bag.length === 0) bag = nextBag();
    return bag.shift();
  };
  const makePiece = (type) => ({ type, rot: 0, x: 3, y: type === 'I' ? -1 : -2 });
  const matrixOf = (p) => SHAPES[p.type][p.rot];
  const cellsOf = (p) => {
    const m = matrixOf(p);
    const out = [];
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
      if (m[r][c]) out.push([p.x + c, p.y + r]);
    }
    return out;
  };
  const collides = (p, dx = 0, dy = 0, rot = p.rot) => {
    const m = SHAPES[p.type][rot];
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
      if (!m[r][c]) continue;
      const x = p.x + c + dx;
      const y = p.y + r + dy;
      if (x < 0 || x >= COLS || y >= ROWS) return true;
      if (y >= 0 && board[y][x]) return true;
    }
    return false;
  };

  const tryMove = (dx, dy) => {
    if (!current) return false;
    if (!collides(current, dx, dy)) {
      current.x += dx;
      current.y += dy;
      return true;
    }
    return false;
  };
  const tryRotate = (dir) => {
    if (!current) return false;
    const nextRot = (current.rot + (dir > 0 ? 1 : 3)) % 4;
    for (const [kx, ky] of KICKS) {
      if (!collides(current, kx, ky, nextRot)) {
        current.x += kx;
        current.y += ky;
        current.rot = nextRot;
        return true;
      }
    }
    return false;
  };

  const lockPiece = () => {
    for (const [x, y] of cellsOf(current)) {
      if (y < 0) gameover = true;
      else board[y][x] = current.type;
    }
    Sound.land();
    const { cleared, rows } = clearLines();
    onLineClear(cleared, rows);
    if (gameover) endGame();
    else spawnNext();
  };

  const clearLines = () => {
    const rows = [];
    for (let r = ROWS - 1; r >= 0; r--) {
      if (board[r].every(v => v)) rows.push(r);
    }
    if (rows.length > 0) {
      rows.sort((a, b) => b - a);
      for (const r of rows) {
        rowFlashes.push({ y: r, life: 0.25 });
        board.splice(r, 1);
        board.unshift(Array(COLS).fill(null));
      }
    }
    return { cleared: rows.length, rows };
  };

  const onLineClear = (n, clearedRows) => {
    if (n === 0) {
      if (combo > 0) combo = 0;
      return;
    }
    lines += n;
    const base = [0, 100, 300, 500, 800][n] * level;
    const comboBonus = combo > 0 ? 50 * combo * level : 0;
    const total = base + comboBonus;
    score += total;
    combo += 1;

    // Float score at average cleared row y (center column)
    const avgRow = clearedRows.reduce((a, b) => a + b, 0) / clearedRows.length;
    const yPx = (avgRow + 0.5) * CELL;
    const xPx = (COLS / 2) * CELL;
    spawnFloater(`+${total}`, xPx, yPx, n === 4 ? 'quad' : '');

    // Level-up
    const newLevel = Math.floor(lines / 10) + 1;
    if (newLevel !== level) {
      level = newLevel;
      dropInterval = Math.max(80, 1000 - (level - 1) * 80);
    }

    // Banner / sound / confetti by line count
    if (n === 4) {
      showBanner('てんちょーさん！', true);
      spawnConfetti(100);
      Sound.tetris();
    } else if (n === 3) {
      showBanner('TRIPLE');
      spawnConfetti(40);
      Sound.clear(n);
    } else if (n === 2) {
      showBanner('DOUBLE');
      spawnConfetti(20);
      Sound.clear(n);
    } else {
      Sound.clear(n);
    }

    // Combo banner + Ueda cut-in (fires from 1 COMBO to showcase drama)
    if (combo >= 1) {
      showComboBanner(`${combo} COMBO！`);
      showUedaCutIn(combo);
      if (comboBonus > 0) spawnFloater(`+${comboBonus}`, xPx, yPx - CELL, 'combo');
      Sound.combo(combo);
    }

    updateHUD();
  };

  const spawnNext = () => {
    current = nextPiece || makePiece(takeType());
    nextPiece = makePiece(takeType());
    holdLocked = false;
    if (collides(current, 0, 0)) {
      gameover = true;
      endGame();
    }
    drawMini(nextCtx, nextCanvas, nextPiece ? nextPiece.type : null);
  };

  const doHold = () => {
    if (holdLocked || !current) return;
    if (holdPiece) {
      const temp = holdPiece;
      holdPiece = makePiece(current.type);
      holdPiece.rot = 0;
      current = makePiece(temp.type);
    } else {
      holdPiece = makePiece(current.type);
      holdPiece.rot = 0;
      current = nextPiece;
      nextPiece = makePiece(takeType());
    }
    holdLocked = true;
    Sound.hold();
    drawMini(holdCtx, holdCanvas, holdPiece.type);
    drawMini(nextCtx, nextCanvas, nextPiece.type);
  };

  const hardDrop = () => {
    if (!current) return;
    let dy = 0;
    while (!collides(current, 0, dy + 1)) dy++;
    current.y += dy;
    score += dy * 2;
    lockPiece();
    updateHUD();
  };
  const softDrop = () => {
    if (tryMove(0, 1)) {
      score += 1;
      updateHUD();
    } else {
      lockPiece();
    }
  };

  const updateHUD = () => {
    scoreEl.textContent = String(score);
    linesEl.textContent = String(lines);
    levelEl.textContent = String(level);
    bestEl.textContent = String(Math.max(best, score));
  };

  // ---------- Banners / floats ----------
  let bannerTimer = 0;
  const showBanner = (text, big = false) => {
    bannerTextEl.textContent = text;
    bannerTextEl.style.fontSize = big ? 'clamp(40px, 12vw, 120px)' : 'clamp(28px, 7vw, 72px)';
    bannerEl.classList.remove('show');
    void bannerEl.offsetWidth;
    bannerEl.classList.add('show');
    clearTimeout(bannerTimer);
    bannerTimer = setTimeout(() => bannerEl.classList.remove('show'), 1700);
  };
  let cutinTimer = 0;
  const showUedaCutIn = (comboCount) => {
    cutinNumEl.textContent = String(comboCount);
    cutinEl.classList.remove('show');
    boardFrameEl.classList.remove('shake');
    // force reflow so animations re-trigger
    void cutinEl.offsetWidth;
    cutinEl.classList.add('show');
    boardFrameEl.classList.add('shake');
    clearTimeout(cutinTimer);
    cutinTimer = setTimeout(() => {
      cutinEl.classList.remove('show');
      boardFrameEl.classList.remove('shake');
    }, 1200);
  };

  let comboTimer = 0;
  const showComboBanner = (text) => {
    comboBannerEl.textContent = text;
    comboBannerEl.classList.remove('show');
    void comboBannerEl.offsetWidth;
    comboBannerEl.classList.add('show');
    clearTimeout(comboTimer);
    comboTimer = setTimeout(() => comboBannerEl.classList.remove('show'), 900);
  };

  // floaters live inside the board-frame, positioned relative to the canvas interior.
  const spawnFloater = (text, xPx, yPx, cls = '') => {
    const el = document.createElement('div');
    el.className = 'floater' + (cls ? ' ' + cls : '');
    el.textContent = text;
    const rect = boardCanvas.getBoundingClientRect();
    const parentRect = floatersEl.getBoundingClientRect();
    const scaleX = rect.width / boardCanvas.width;
    const scaleY = rect.height / boardCanvas.height;
    const left = (rect.left - parentRect.left) + xPx * scaleX;
    const top = (rect.top - parentRect.top) + yPx * scaleY;
    el.style.left = left + 'px';
    el.style.top = top + 'px';
    floatersEl.appendChild(el);
    setTimeout(() => el.remove(), 1200);
  };

  // ---------- Particles ----------
  const CONFETTI_COLORS = ['#ffd400', '#ff3c5b', '#3ad4ff', '#3fd96a', '#c96bff', '#ff8a1e'];
  const spawnConfetti = (n) => {
    const w = fxCanvas.width;
    for (let i = 0; i < n; i++) {
      particles.push({
        x: w / 2 + (Math.random() - 0.5) * 80,
        y: fxCanvas.height / 2 + (Math.random() - 0.5) * 40,
        vx: (Math.random() - 0.5) * 8,
        vy: -Math.random() * 7 - 2,
        g: 0.24 + Math.random() * 0.12,
        rot: Math.random() * Math.PI * 2,
        vrot: (Math.random() - 0.5) * 0.5,
        size: 5 + Math.random() * 7,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        life: 1.6 + Math.random() * 0.6,
      });
    }
  };

  // ---------- Rendering ----------
  const shade = (hex, amt) => {
    const h = hex.replace('#', '');
    const r = parseInt(h.slice(0,2), 16);
    const g = parseInt(h.slice(2,4), 16);
    const b = parseInt(h.slice(4,6), 16);
    const f = (v) => Math.max(0, Math.min(255, Math.round(v + amt * 255)));
    return `rgb(${f(r)},${f(g)},${f(b)})`;
  };
  const drawCell = (c, x, y, color, alpha = 1) => {
    const px = x * CELL, py = y * CELL;
    c.save();
    c.globalAlpha = alpha;
    const grad = c.createLinearGradient(px, py, px, py + CELL);
    grad.addColorStop(0, shade(color, 0.25));
    grad.addColorStop(1, shade(color, -0.2));
    c.fillStyle = grad;
    c.fillRect(px + 2, py + 2, CELL - 4, CELL - 4);
    // thick black outline for YouTube thumbnail feel
    c.strokeStyle = '#000';
    c.lineWidth = 2;
    c.strokeRect(px + 2, py + 2, CELL - 4, CELL - 4);
    // highlight
    c.fillStyle = 'rgba(255,255,255,0.35)';
    c.fillRect(px + 4, py + 4, CELL - 8, 3);
    c.restore();
  };

  const render = () => {
    ctx.clearRect(0, 0, boardCanvas.width, boardCanvas.height);
    // subtle grid on black board
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (let i = 1; i < COLS; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL + 0.5, 0);
      ctx.lineTo(i * CELL + 0.5, ROWS * CELL);
      ctx.stroke();
    }
    for (let i = 1; i < ROWS; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * CELL + 0.5);
      ctx.lineTo(COLS * CELL, i * CELL + 0.5);
      ctx.stroke();
    }

    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const t = board[r][c];
      if (t) drawCell(ctx, c, r, COLORS[t]);
    }
    if (current) {
      let gy = 0;
      while (!collides(current, 0, gy + 1)) gy++;
      const gp = { ...current, y: current.y + gy };
      for (const [x, y] of cellsOf(gp)) {
        if (y >= 0) {
          ctx.fillStyle = COLORS.GHOST;
          ctx.fillRect(x * CELL + 4, y * CELL + 4, CELL - 8, CELL - 8);
          ctx.strokeStyle = 'rgba(255,255,255,0.35)';
          ctx.lineWidth = 2;
          ctx.strokeRect(x * CELL + 4, y * CELL + 4, CELL - 8, CELL - 8);
        }
      }
      for (const [x, y] of cellsOf(current)) {
        if (y >= 0) drawCell(ctx, x, y, COLORS[current.type]);
      }
    }

    // fx layer: row flashes + confetti
    fxCtx.clearRect(0, 0, fxCanvas.width, fxCanvas.height);
    for (const f of rowFlashes) {
      const a = Math.max(0, Math.min(1, f.life / 0.25));
      fxCtx.fillStyle = `rgba(255, 245, 150, ${a * 0.75})`;
      fxCtx.fillRect(0, f.y * CELL, fxCanvas.width, CELL);
      // bright top edge
      fxCtx.fillStyle = `rgba(255, 255, 255, ${a})`;
      fxCtx.fillRect(0, f.y * CELL + CELL * 0.4, fxCanvas.width, CELL * 0.2);
    }
    for (const p of particles) {
      fxCtx.save();
      fxCtx.translate(p.x, p.y);
      fxCtx.rotate(p.rot);
      fxCtx.fillStyle = p.color;
      fxCtx.globalAlpha = Math.max(0, Math.min(1, p.life));
      fxCtx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.5);
      fxCtx.strokeStyle = '#000';
      fxCtx.lineWidth = 1;
      fxCtx.strokeRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.5);
      fxCtx.restore();
    }
  };

  const drawMini = (c, canvas, type) => {
    c.clearRect(0, 0, canvas.width, canvas.height);
    c.fillStyle = '#fff';
    c.fillRect(0, 0, canvas.width, canvas.height);
    if (!type) return;
    const m = SHAPES[type][0];
    let minC = 4, maxC = -1, minR = 4, maxR = -1;
    for (let r = 0; r < 4; r++) for (let cc = 0; cc < 4; cc++) {
      if (m[r][cc]) {
        minC = Math.min(minC, cc); maxC = Math.max(maxC, cc);
        minR = Math.min(minR, r);  maxR = Math.max(maxR, r);
      }
    }
    const w = maxC - minC + 1, h = maxR - minR + 1;
    const size = Math.min(canvas.width / (w + 1), canvas.height / (h + 1));
    const ox = (canvas.width - w * size) / 2;
    const oy = (canvas.height - h * size) / 2;
    for (let r = 0; r < 4; r++) for (let cc = 0; cc < 4; cc++) {
      if (!m[r][cc]) continue;
      const px = ox + (cc - minC) * size;
      const py = oy + (r - minR) * size;
      const color = COLORS[type];
      const grad = c.createLinearGradient(px, py, px, py + size);
      grad.addColorStop(0, shade(color, 0.25));
      grad.addColorStop(1, shade(color, -0.2));
      c.fillStyle = grad;
      c.fillRect(px + 2, py + 2, size - 4, size - 4);
      c.strokeStyle = '#000';
      c.lineWidth = 2;
      c.strokeRect(px + 2, py + 2, size - 4, size - 4);
    }
  };

  // ---------- Loop ----------
  const step = (t) => {
    if (!lastT) lastT = t;
    const dt = t - lastT;
    lastT = t;
    if (!paused && !gameover) {
      dropAcc += dt;
      if (dropAcc >= dropInterval) {
        dropAcc = 0;
        if (!tryMove(0, 1)) lockPiece();
      }
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.vy += p.g;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vrot;
      p.life -= dt / 1000;
      if (p.life <= 0 || p.y > fxCanvas.height + 40) particles.splice(i, 1);
    }
    for (let i = rowFlashes.length - 1; i >= 0; i--) {
      rowFlashes[i].life -= dt / 1000;
      if (rowFlashes[i].life <= 0) rowFlashes.splice(i, 1);
    }
    render();
    requestAnimationFrame(step);
  };

  // ---------- Input ----------
  const onKey = (e) => {
    if (gameover && (e.key === 'r' || e.key === 'R')) { restart(); return; }
    if (e.key === 'p' || e.key === 'P') {
      paused = !paused;
      btnPause.textContent = paused ? '▶' : '⏸';
      return;
    }
    if (paused || gameover) return;
    Sound.prime();
    switch (e.key) {
      case 'ArrowLeft':  if (tryMove(-1, 0)) Sound.move(); e.preventDefault && e.preventDefault(); break;
      case 'ArrowRight': if (tryMove(1, 0)) Sound.move(); e.preventDefault && e.preventDefault(); break;
      case 'ArrowDown':  softDrop(); e.preventDefault && e.preventDefault(); break;
      case 'ArrowUp':
      case 'x': case 'X': if (tryRotate(1)) Sound.rotate(); e.preventDefault && e.preventDefault(); break;
      case 'z': case 'Z': if (tryRotate(-1)) Sound.rotate(); e.preventDefault && e.preventDefault(); break;
      case ' ':          hardDrop(); e.preventDefault && e.preventDefault(); break;
      case 'Shift':
      case 'c': case 'C': doHold(); e.preventDefault && e.preventDefault(); break;
    }
  };
  window.addEventListener('keydown', onKey);
  window.addEventListener('keydown', (e) => {
    if ([' ','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) e.preventDefault();
  }, { passive: false });

  const fireKey = (key) => onKey({ key, preventDefault: () => {} });
  touchEl.querySelectorAll('button').forEach(btn => {
    const key = btn.dataset.key;
    let repeat = null;
    const start = (e) => {
      e.preventDefault();
      Sound.prime();
      fireKey(key);
      if (key === 'ArrowLeft' || key === 'ArrowRight' || key === 'ArrowDown') {
        repeat = setInterval(() => fireKey(key), 90);
      }
    };
    const end = () => { if (repeat) { clearInterval(repeat); repeat = null; } };
    btn.addEventListener('touchstart', start, { passive: false });
    btn.addEventListener('touchend', end);
    btn.addEventListener('touchcancel', end);
    btn.addEventListener('mousedown', start);
    btn.addEventListener('mouseup', end);
    btn.addEventListener('mouseleave', end);
  });

  btnMute.addEventListener('click', () => {
    const m = Sound.toggleMute();
    btnMute.textContent = m ? '🔇' : '🔊';
  });
  btnPause.addEventListener('click', () => {
    paused = !paused;
    btnPause.textContent = paused ? '▶' : '⏸';
  });
  btnRestart.addEventListener('click', () => restart());
  btnAgain.addEventListener('click', () => restart());
  btnShare.addEventListener('click', () => shareResult());

  // ---------- Toast ----------
  let toastTimer = 0;
  const toast = (msg) => {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2000);
  };

  // ---------- Share ----------
  const shareResult = async () => {
    const msg = `てんちょーテトリスで ${score} 点取ったよ！ Lv${level} / ${lines}ライン\n${SHARE_URL}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'てんちょーテトリス', text: msg, url: SHARE_URL });
        return;
      } catch (_) { /* user cancelled, fall through */ }
    }
    try {
      await navigator.clipboard.writeText(msg);
      toast('結果をコピーしたよ！貼って送ってね 📋');
    } catch (_) {
      toast('コピーに失敗したみたい…');
    }
  };

  // ---------- Flow ----------
  const endGame = () => {
    gameover = true;
    Sound.gameover();
    const isNew = score > best;
    if (isNew) {
      best = score;
      localStorage.setItem(BEST_KEY, String(best));
    }
    finalScoreEl.textContent = `SCORE: ${score} / Lv ${level} / ${lines}ライン`;
    finalBestEl.textContent = `BEST: ${best}`;
    newBestTagEl.style.display = isNew ? '' : 'none';
    overlayEl.classList.add('show');
    updateHUD();
  };

  const restart = () => {
    board = emptyBoard();
    bag = [];
    score = 0;
    lines = 0;
    level = 1;
    combo = 0;
    dropInterval = 1000;
    dropAcc = 0;
    gameover = false;
    paused = false;
    holdPiece = null;
    holdLocked = false;
    particles.length = 0;
    rowFlashes.length = 0;
    // clear any leftover floaters
    while (floatersEl.firstChild) floatersEl.removeChild(floatersEl.firstChild);
    btnPause.textContent = '⏸';
    overlayEl.classList.remove('show');
    nextPiece = makePiece(takeType());
    spawnNext();
    drawMini(holdCtx, holdCanvas, null);
    updateHUD();
  };

  restart();
  requestAnimationFrame(step);
})();
