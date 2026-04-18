// Tencho Tetris - vanilla JS tetris with custom quad-line celebration.
(() => {
  'use strict';

  // ---------- Config ----------
  const COLS = 10;
  const ROWS = 20;
  const CELL = 32; // matches canvas 320x640

  const COLORS = {
    I: '#48cfff',
    O: '#ffd447',
    T: '#c784ff',
    S: '#55e08a',
    Z: '#ff5b6e',
    J: '#4b7dff',
    L: '#ff9a3c',
    GHOST: 'rgba(255, 255, 255, 0.22)',
    GRID: 'rgba(255, 255, 255, 0.05)',
  };

  // SRS-style rotation states, each piece is a 4x4 matrix per rotation.
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

  // Simple wall-kick offsets tried in order when a rotation collides.
  const KICKS = [ [0,0], [-1,0], [1,0], [0,-1], [-2,0], [2,0], [0,-2] ];

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
  const linesEl = document.getElementById('lines');
  const levelEl = document.getElementById('level');
  const bannerEl = document.getElementById('banner');
  const bannerTextEl = document.getElementById('banner-text');
  const overlayEl = document.getElementById('overlay');
  const finalScoreEl = document.getElementById('final-score');
  const btnMute = document.getElementById('btn-mute');
  const btnPause = document.getElementById('btn-pause');
  const btnRestart = document.getElementById('btn-restart');
  const btnAgain = document.getElementById('btn-again');
  const touchEl = document.getElementById('touch');

  // ---------- Audio ----------
  const Sound = (() => {
    let ctxAudio = null;
    let muted = localStorage.getItem('tt-muted') === '1';
    const ensure = () => {
      if (!ctxAudio) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC) ctxAudio = new AC();
      }
      if (ctxAudio && ctxAudio.state === 'suspended') ctxAudio.resume();
      return ctxAudio;
    };
    const tone = (freq, dur, type = 'sine', volume = 0.18, when = 0) => {
      if (muted) return;
      const ac = ensure();
      if (!ac) return;
      const t0 = ac.currentTime + when;
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t0);
      gain.gain.setValueAtTime(0, t0);
      gain.gain.linearRampToValueAtTime(volume, t0 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(gain).connect(ac.destination);
      osc.start(t0);
      osc.stop(t0 + dur + 0.05);
    };
    const sweep = (fromFreq, toFreq, dur, type = 'sawtooth', volume = 0.2) => {
      if (muted) return;
      const ac = ensure();
      if (!ac) return;
      const t0 = ac.currentTime;
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(fromFreq, t0);
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, toFreq), t0 + dur);
      gain.gain.setValueAtTime(0, t0);
      gain.gain.linearRampToValueAtTime(volume, t0 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(gain).connect(ac.destination);
      osc.start(t0);
      osc.stop(t0 + dur + 0.05);
    };
    return {
      move:   () => tone(220, 0.04, 'sine', 0.08),
      rotate: () => tone(360, 0.06, 'square', 0.08),
      land:   () => tone(140, 0.1, 'triangle', 0.15),
      hold:   () => tone(500, 0.08, 'sine', 0.1),
      clear:  (n) => {
        // chord whose brightness grows with n
        const freqs = [261.6, 329.6, 392.0]; // C E G
        freqs.forEach((f, i) => tone(f * (1 + n * 0.05), 0.2 + n * 0.03, 'triangle', 0.12));
      },
      tetris: () => {
        // Celebratory arpeggio + bass thump for quad-line clear.
        const notes = [392.0, 523.3, 659.3, 784.0, 1046.5];
        notes.forEach((f, i) => tone(f, 0.22, 'square', 0.12, i * 0.09));
        tone(80, 0.35, 'sine', 0.3, 0);
        tone(120, 0.35, 'sine', 0.25, 0.15);
      },
      gameover: () => sweep(440, 90, 0.9, 'sawtooth', 0.22),
      toggleMute() {
        muted = !muted;
        localStorage.setItem('tt-muted', muted ? '1' : '0');
        return muted;
      },
      isMuted() { return muted; },
      prime() { ensure(); },
    };
  })();
  btnMute.textContent = Sound.isMuted() ? '🔇' : '🔊';

  // ---------- Game state ----------
  const emptyBoard = () => Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  let board = emptyBoard();
  let bag = [];
  let current = null;
  let nextPiece = null;
  let holdPiece = null;
  let holdLocked = false;
  let score = 0;
  let lines = 0;
  let level = 1;
  let dropInterval = 1000;
  let dropAcc = 0;
  let lastT = 0;
  let running = true;
  let paused = false;
  let gameover = false;
  const particles = [];
  let flash = 0; // 0..1 white flash after line clear

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
  const makePiece = (type) => ({
    type,
    rot: 0,
    x: 3,
    y: type === 'I' ? -1 : -2,
  });
  const matrixOf = (p) => SHAPES[p.type][p.rot];

  const cellsOf = (p) => {
    const m = matrixOf(p);
    const out = [];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (m[r][c]) out.push([p.x + c, p.y + r]);
      }
    }
    return out;
  };

  const collides = (p, dx = 0, dy = 0, rot = p.rot) => {
    const m = SHAPES[p.type][rot];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (!m[r][c]) continue;
        const x = p.x + c + dx;
        const y = p.y + r + dy;
        if (x < 0 || x >= COLS || y >= ROWS) return true;
        if (y >= 0 && board[y][x]) return true;
      }
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
      if (y < 0) {
        // part of piece locked above top -> game over
        gameover = true;
      } else {
        board[y][x] = current.type;
      }
    }
    Sound.land();
    const cleared = clearLines();
    onLineClear(cleared);
    if (gameover) {
      endGame();
    } else {
      spawnNext();
    }
  };

  const clearLines = () => {
    let cleared = 0;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (board[r].every(v => v)) {
        board.splice(r, 1);
        board.unshift(Array(COLS).fill(null));
        cleared++;
        r++;
      }
    }
    return cleared;
  };

  const onLineClear = (n) => {
    if (n === 0) return;
    lines += n;
    const points = [0, 100, 300, 500, 800][n] * level;
    score += points;
    const newLevel = Math.floor(lines / 10) + 1;
    if (newLevel !== level) {
      level = newLevel;
      dropInterval = Math.max(80, 1000 - (level - 1) * 80);
    }
    flash = 1;
    if (n === 4) {
      showBanner('てんちょーさん！', true);
      spawnConfetti(80);
      Sound.tetris();
    } else if (n === 3) {
      showBanner('TRIPLE');
      spawnConfetti(30);
      Sound.clear(n);
    } else if (n === 2) {
      showBanner('DOUBLE');
      spawnConfetti(20);
      Sound.clear(n);
    } else {
      Sound.clear(n);
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
  };

  // ---------- Banner ----------
  let bannerTimer = 0;
  const showBanner = (text, big = false) => {
    bannerTextEl.textContent = text;
    bannerTextEl.style.fontSize = big ? 'clamp(44px, 12vw, 120px)' : 'clamp(28px, 7vw, 72px)';
    bannerEl.classList.remove('show');
    // force reflow so animation replays
    void bannerEl.offsetWidth;
    bannerEl.classList.add('show');
    clearTimeout(bannerTimer);
    bannerTimer = setTimeout(() => bannerEl.classList.remove('show'), 1600);
  };

  // ---------- Confetti / particles ----------
  const CONFETTI_COLORS = ['#ffd447','#ff4fa3','#48cfff','#55e08a','#c784ff','#ff9a3c'];
  const spawnConfetti = (n) => {
    const w = fxCanvas.width;
    for (let i = 0; i < n; i++) {
      particles.push({
        x: w / 2 + (Math.random() - 0.5) * 60,
        y: fxCanvas.height / 2 + (Math.random() - 0.5) * 40,
        vx: (Math.random() - 0.5) * 6,
        vy: -Math.random() * 6 - 2,
        g: 0.22 + Math.random() * 0.1,
        rot: Math.random() * Math.PI * 2,
        vrot: (Math.random() - 0.5) * 0.4,
        size: 4 + Math.random() * 6,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        life: 1.4 + Math.random() * 0.6,
      });
    }
  };

  // ---------- Rendering ----------
  const drawCell = (c, x, y, color, alpha = 1) => {
    const px = x * CELL, py = y * CELL;
    c.save();
    c.globalAlpha = alpha;
    const grad = c.createLinearGradient(px, py, px, py + CELL);
    grad.addColorStop(0, shade(color, 0.35));
    grad.addColorStop(1, shade(color, -0.18));
    c.fillStyle = grad;
    c.fillRect(px + 1, py + 1, CELL - 2, CELL - 2);
    c.strokeStyle = 'rgba(255,255,255,0.25)';
    c.lineWidth = 1;
    c.strokeRect(px + 1.5, py + 1.5, CELL - 3, CELL - 3);
    // top highlight
    c.fillStyle = 'rgba(255,255,255,0.18)';
    c.fillRect(px + 3, py + 3, CELL - 6, 3);
    c.restore();
  };

  const shade = (hex, amt) => {
    const h = hex.replace('#', '');
    const r = parseInt(h.slice(0,2), 16);
    const g = parseInt(h.slice(2,4), 16);
    const b = parseInt(h.slice(4,6), 16);
    const f = (v) => Math.max(0, Math.min(255, Math.round(v + amt * 255)));
    return `rgb(${f(r)},${f(g)},${f(b)})`;
  };

  const render = () => {
    // main board
    ctx.clearRect(0, 0, boardCanvas.width, boardCanvas.height);
    // fixed blocks
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const t = board[r][c];
        if (t) drawCell(ctx, c, r, COLORS[t]);
      }
    }
    if (current) {
      // ghost
      let gy = 0;
      while (!collides(current, 0, gy + 1)) gy++;
      const gp = { ...current, y: current.y + gy };
      for (const [x, y] of cellsOf(gp)) {
        if (y >= 0) {
          ctx.fillStyle = COLORS.GHOST;
          ctx.fillRect(x * CELL + 3, y * CELL + 3, CELL - 6, CELL - 6);
        }
      }
      // current piece
      for (const [x, y] of cellsOf(current)) {
        if (y >= 0) drawCell(ctx, x, y, COLORS[current.type]);
      }
    }
    if (flash > 0) {
      ctx.fillStyle = `rgba(255,255,255,${flash * 0.5})`;
      ctx.fillRect(0, 0, boardCanvas.width, boardCanvas.height);
    }

    // fx (particles)
    fxCtx.clearRect(0, 0, fxCanvas.width, fxCanvas.height);
    for (const p of particles) {
      fxCtx.save();
      fxCtx.translate(p.x, p.y);
      fxCtx.rotate(p.rot);
      fxCtx.fillStyle = p.color;
      fxCtx.globalAlpha = Math.max(0, Math.min(1, p.life));
      fxCtx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.5);
      fxCtx.restore();
    }
  };

  const drawMini = (c, canvas, type) => {
    c.clearRect(0, 0, canvas.width, canvas.height);
    if (!type) return;
    const m = SHAPES[type][0];
    // find bounds
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
      grad.addColorStop(0, shade(color, 0.35));
      grad.addColorStop(1, shade(color, -0.18));
      c.fillStyle = grad;
      c.fillRect(px + 1, py + 1, size - 2, size - 2);
      c.strokeStyle = 'rgba(255,255,255,0.25)';
      c.strokeRect(px + 1.5, py + 1.5, size - 3, size - 3);
    }
  };

  // ---------- Loop ----------
  const step = (t) => {
    if (!lastT) lastT = t;
    const dt = t - lastT;
    lastT = t;
    if (running && !paused && !gameover) {
      dropAcc += dt;
      if (dropAcc >= dropInterval) {
        dropAcc = 0;
        if (!tryMove(0, 1)) lockPiece();
      }
    }
    // particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.vy += p.g;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vrot;
      p.life -= dt / 1000;
      if (p.life <= 0 || p.y > fxCanvas.height + 40) particles.splice(i, 1);
    }
    if (flash > 0) flash = Math.max(0, flash - dt / 250);
    render();
    requestAnimationFrame(step);
  };

  // ---------- Input ----------
  const onKey = (e) => {
    if (gameover && e.key.toLowerCase() === 'r') { restart(); return; }
    if (e.key === 'p' || e.key === 'P') { paused = !paused; btnPause.textContent = paused ? '▶' : '⏸'; return; }
    if (paused || gameover) return;
    Sound.prime();
    switch (e.key) {
      case 'ArrowLeft':  if (tryMove(-1, 0)) Sound.move(); e.preventDefault(); break;
      case 'ArrowRight': if (tryMove(1, 0)) Sound.move(); e.preventDefault(); break;
      case 'ArrowDown':  softDrop(); e.preventDefault(); break;
      case 'ArrowUp':
      case 'x':
      case 'X':          if (tryRotate(1)) Sound.rotate(); e.preventDefault(); break;
      case 'z':
      case 'Z':          if (tryRotate(-1)) Sound.rotate(); e.preventDefault(); break;
      case ' ':          hardDrop(); e.preventDefault(); break;
      case 'Shift':
      case 'c':
      case 'C':          doHold(); e.preventDefault(); break;
    }
  };
  window.addEventListener('keydown', onKey);

  // touch buttons reuse keyboard handler
  const fireKey = (key) => {
    onKey({ key, preventDefault: () => {} });
  };
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

  // prevent page scroll via arrows / space
  window.addEventListener('keydown', (e) => {
    if ([' ','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) {
      e.preventDefault();
    }
  }, { passive: false });

  // ---------- Game flow ----------
  const endGame = () => {
    gameover = true;
    Sound.gameover();
    finalScoreEl.textContent = `SCORE: ${score}  /  LINES: ${lines}`;
    overlayEl.classList.add('show');
  };

  const restart = () => {
    board = emptyBoard();
    bag = [];
    score = 0;
    lines = 0;
    level = 1;
    dropInterval = 1000;
    dropAcc = 0;
    gameover = false;
    paused = false;
    holdPiece = null;
    holdLocked = false;
    particles.length = 0;
    flash = 0;
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
