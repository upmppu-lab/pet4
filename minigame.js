// ================= Mini-games: bath, brush, toy =================
const MINI = (() => {
  let ov, cv, c, W, H, raf, st;
  const TXT = {
    bath: ['🛁', 'miniBath', 'miniBathHint', 'miniBathHint2'], brush: ['🪮', 'miniBrush', 'miniBrushHint'], toy: ['🪶', 'miniToy', 'miniToyHint'],
  };
  const TOYLV = [
    { dur: 5, sp0: .7, sp1: .55, life0: 1.2, life1: 1.05, bee: 0, gold: .06, holes: [[.25, .48], [.5, .44], [.75, .48]], target: 5 },
    { dur: 7, sp0: .55, sp1: .38, life0: 1.0, life1: .75, bee: .08, gold: .08, holes: [[.2, .44], [.5, .4], [.8, .44], [.2, .62], [.5, .58], [.8, .62]], target: 9 }, // v1.18: the only level now -- between easy and normal
    { dur: 9, sp0: .34, sp1: .16, life0: .7, life1: .42, bee: .26, gold: .1, holes: [[.2, .34], [.5, .31], [.8, .34], [.2, .5], [.5, .47], [.8, .5], [.2, .66], [.5, .63], [.8, .66]], target: 18 }, // v1.17: shorter
  ];
  function start(kind, sp, cb, seed, lv) {
    stop();
    ov = document.createElement('div'); ov.className = 'mini';
    ov.innerHTML = `<div class="mhead"><b>${TXT[kind][0]} ${t(TXT[kind][1])}</b><span id="mhint">${t(TXT[kind][2])}</span><div class="mbar"><i id="mtime"></i></div><div class="mscore" id="mscore"></div></div><canvas></canvas><button class="btn g sm mquit">✕</button>`;
    document.body.appendChild(ov);
    cv = ov.querySelector('canvas'); c = cv.getContext('2d');
    const dpr = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; c.scale(dpr, dpr);
    st = { kind, sp, cb, seed, t: 0, dur: kind === 'bath' ? 12 : kind === 'brush' ? 8 : TOYLV[lv | 0].dur, lv: lv | 0, ptr: null, last: null, done: false, cx: W / 2, cy: H * .6, sc: Math.min(W, H) / 110 };
    if (kind === 'bath') { st.phase = 'soap'; st.bubbles = []; st.soap = 0; st.drops = []; st.rinsed = 0; st.steam = []; st.steamT = 0; st.splashes = []; st.sparkles = []; st.sparkT = 0; st.duckBob = 0; }
    if (kind === 'brush') { st.tufts = []; for (let i = 0; i < 9; i++) { const a = Math.random() * Math.PI * 2, r = Math.random(); st.tufts.push({ x: Math.cos(a) * r * 16 * st.sc, y: -18 * st.sc + Math.sin(a) * r * 12 * st.sc, hp: Math.random() < .35 ? 2 : 1, gone: 0 }); } st.sparks = []; }
    if (kind === 'toy') {
      st.P = TOYLV[st.lv]; st.holes = []; for (const [fx, fy] of st.P.holes) st.holes.push({ x: W * fx, y: H * fy, item: null });
      st.pet = { x: W / 2, y: H * .82, fx: W / 2, fy: H * .82, tx: W / 2, ty: H * .82, lt: 1, scared: 0, happy: 0, dir: 1 };
      st.pts = 0; st.combo = 0; st.spawn = .4; st.pops = []; st.catches = 0;
    }
    cv.addEventListener('pointerdown', e => { if (st.kind === 'toy') { tapToy(e.clientX, e.clientY); return; } st.ptr = { x: e.clientX, y: e.clientY }; st.last = { ...st.ptr }; });
    cv.addEventListener('pointermove', e => { if (!st.ptr && st.kind !== 'toy') return; st.last = st.ptr || { x: e.clientX, y: e.clientY }; st.ptr = { x: e.clientX, y: e.clientY }; move(); });
    cv.addEventListener('pointerup', () => { if (st.kind !== 'toy') st.ptr = null; });
    ov.querySelector('.mquit').onclick = () => finish(true);
    let last = performance.now();
    const loop = now => { const dt = Math.min(.05, (now - last) / 1000); last = now; step(dt); draw(); if (!st.done) raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    SFX.cry(sp);
  }
  function inPet(x, y) { const dx = (x - st.cx) / (22 * st.sc), dy = (y - (st.cy - 18 * st.sc)) / (20 * st.sc); return dx * dx + dy * dy < 1; }
  function move() {
    const p = st.ptr, l = st.last; if (!p) return;
    const d = Math.hypot(p.x - l.x, p.y - l.y);
    if (st.kind === 'bath') {
      if (st.phase === 'soap' && inPet(p.x, p.y)) { st.soap = Math.min(100, st.soap + d / 12); if (Math.random() < .5) st.bubbles.push({ x: p.x + (Math.random() - .5) * 20, y: p.y + (Math.random() - .5) * 20, r: 6 + Math.random() * 10 }); if (Math.random() < .08) SFX.brush(); if (Math.random() < .1) st.splashes.push({ x: p.x, y: p.y, t: 0 }); }
      if (st.phase === 'rinse') { for (let i = 0; i < 2; i++) st.drops.push({ x: p.x + (Math.random() - .5) * 26, y: p.y, vy: 300 + Math.random() * 200 }); const before = st.bubbles.length; st.bubbles = st.bubbles.filter(b => Math.hypot(b.x - p.x, b.y - p.y) > 36); st.rinsed += before - st.bubbles.length; if (before > st.bubbles.length) st.splashes.push({ x: p.x, y: p.y, t: 0 }); if (Math.random() < .06) SFX.splash(); }
    }
    if (st.kind === 'brush' && d > 4) {
      for (const tf of st.tufts) { if (tf.gone) continue; const x = st.cx + tf.x, y = st.cy + tf.y; if (distSeg(x, y, l, p) < 22) { tf.hp--; SFX.brush(); if (tf.hp <= 0) { tf.gone = 1; for (let i = 0; i < 5; i++) st.sparks.push({ x, y, vx: (Math.random() - .5) * 200, vy: -Math.random() * 200, t: 0 }); } } }
    }
  }
  function distSeg(x, y, a, b) { const dx = b.x - a.x, dy = b.y - a.y, l2 = dx * dx + dy * dy || 1; let k = ((x - a.x) * dx + (y - a.y) * dy) / l2; k = Math.max(0, Math.min(1, k)); return Math.hypot(x - a.x - k * dx, y - a.y - k * dy); }
  function step(dt) {
    st.t += dt;
    if (st.kind === 'bath' && st.phase === 'soap' && (st.soap >= 100 || st.t > 8)) { st.phase = 'rinse'; st.soapT = st.t; $('#mhint').textContent = t('miniBathHint2'); SFX.pop(); }
    if (st.kind === 'bath') {
      st.drops.forEach(d => d.y += d.vy * dt); st.drops = st.drops.filter(d => d.y < H);
      st.duckBob = Math.sin(st.t * 2);
      st.steamT -= dt; if (st.steamT <= 0) { st.steamT = .5 + Math.random() * .4; st.steam.push({ x: st.cx + (Math.random() - .5) * 60 * st.sc, y: st.cy - 4 * st.sc, t: 0, life: 1.8 }); }
      st.steam.forEach(s => { s.t += dt; s.y -= 16 * dt; s.x += Math.sin(s.t * 2 + s.y) * 8 * dt; }); st.steam = st.steam.filter(s => s.t < s.life);
      st.splashes.forEach(s => s.t += dt); st.splashes = st.splashes.filter(s => s.t < .35);
      if (score() > .55) { st.sparkT -= dt; if (st.sparkT <= 0) { st.sparkT = .25; st.sparkles.push({ x: st.cx + (Math.random() - .5) * 44 * st.sc, y: st.cy - 20 * st.sc - Math.random() * 20, t: 0 }); } }
      st.sparkles.forEach(s => s.t += dt); st.sparkles = st.sparkles.filter(s => s.t < .7);
      if (st.phase === 'rinse' && st.bubbles.length === 0 && st.t - st.soapT > 1) finish();
    }
    if (st.kind === 'brush') { st.sparks.forEach(s => { s.t += dt; s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 400 * dt; }); st.sparks = st.sparks.filter(s => s.t < .8); if (st.tufts.every(tf => tf.gone)) finish(); }
    if (st.kind === 'toy') { stepToy(dt); if (st.pts >= st.P.target) { finish(); return; } }
    const left = Math.max(0, 1 - st.t / st.dur);
    const tm = $('#mtime'); if (tm) tm.style.width = (left * 100) + '%';
    const scEl = $('#mscore'); if (scEl) scEl.textContent = score() >= .99 ? '⭐⭐⭐' : '⭐'.repeat(Math.floor(score() * 3)) + '☆'.repeat(3 - Math.floor(score() * 3));
    if (st.t >= st.dur) finish();
  }
  function score() {
    if (st.kind === 'bath') return st.phase === 'soap' ? st.soap / 200 : .5 * st.soap / 100 + .5 * (st.bubbles.length ? st.rinsed / (st.rinsed + st.bubbles.length) : 1);
    if (st.kind === 'brush') return st.tufts.filter(x => x.gone).length / st.tufts.length;
    return Math.min(1, st.pts / st.P.target);
  }
  function draw() {
    c.clearRect(0, 0, W, H);
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, st.kind === 'bath' ? '#dff3ff' : '#fff4e3'); g.addColorStop(1, st.kind === 'bath' ? '#bfe3f7' : '#f3dcb8'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    if (st.kind === 'bath') { drawBathScene(); drawTub(); }
    if (st.kind === 'toy') { drawToyBg(); }
    // pet
    if (st.kind === 'toy') drawToy();
    else { c.save(); c.translate(st.cx, st.cy); c.scale(st.sc * .95, st.sc * .95); ART.pet(c, st.sp, { t: st.t, happy: score() > .5, seed: st.seed, mood: 'calm' }); c.restore(); }
    if (st.kind === 'bath') {
      if (st.phase === 'rinse' || st.soap > 0) for (const b of st.bubbles) { ART.ell(c, b.x, b.y, b.r, b.r, 'rgba(255,255,255,.85)', 'rgba(150,190,220,.8)', 1); ART.ell(c, b.x - b.r * .3, b.y - b.r * .3, b.r * .25, b.r * .25, '#fff'); }
      c.fillStyle = 'rgba(80,160,230,.7)'; for (const d of st.drops) { c.fillRect(d.x, d.y, 2, 8); }
      for (const s of st.splashes) { const k = s.t / .35; c.globalAlpha = 1 - k; ART.ell(c, s.x, s.y, 8 + k * 22, 4 + k * 10, null, 'rgba(150,205,240,.8)', 2); } c.globalAlpha = 1;
      for (const s of st.sparkles) { c.globalAlpha = 1 - s.t / .7; c.font = (10 + Math.sin(s.t * 20) * 3) + 'px sans-serif'; c.fillText('✨', s.x, s.y - s.t * 14); } c.globalAlpha = 1;
      for (const s of st.steam) { c.globalAlpha = .16 * (1 - s.t / s.life); ART.ell(c, s.x, s.y, 12 + s.t * 8, 16 + s.t * 10, '#ffffff'); } c.globalAlpha = 1;
      if (st.ptr) { c.font = '34px sans-serif'; c.fillText(st.phase === 'soap' ? '🧽' : '🚿', st.ptr.x - 17, st.ptr.y - 10); }
    }
    if (st.kind === 'brush') {
      for (const tf of st.tufts) if (!tf.gone) { const x = st.cx + tf.x, y = st.cy + tf.y; for (let i = 0; i < 4; i++) ART.ell(c, x + Math.cos(i * 1.6) * 7, y + Math.sin(i * 1.6) * 5, 8, 6, tf.hp > 1 ? 'rgba(200,170,140,.95)' : 'rgba(245,235,220,.95)', 'rgba(90,60,35,.5)', 1); }
      for (const s of st.sparks) { c.globalAlpha = 1 - s.t / .8; c.font = '16px sans-serif'; c.fillText('✨', s.x, s.y); } c.globalAlpha = 1;
      if (st.ptr) { c.font = '34px sans-serif'; c.fillText('🪮', st.ptr.x - 17, st.ptr.y + 10); }
    }

  }
  // ---------- bath: bathroom scene + a proper tub ----------
  function drawBathScene() {
    const floorY = H * .64;
    c.save(); c.beginPath(); c.rect(0, 0, W, floorY); c.clip();
    c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 1;
    for (let y = 0; y < floorY + 20; y += 20) for (let x = -20; x < W + 20; x += 20) c.strokeRect(x, y, 20, 20);
    c.restore();
    c.fillStyle = '#eaf6ff'; c.fillRect(0, floorY, W, H - floorY);
    c.strokeStyle = 'rgba(150,190,220,.35)'; c.lineWidth = 1;
    for (let x = -20; x < W + 20; x += 20) { c.beginPath(); c.moveTo(x, floorY); c.lineTo(x, H); c.stroke(); }
    c.beginPath(); c.moveTo(0, floorY); c.lineTo(W, floorY); c.strokeStyle = 'rgba(120,160,190,.4)'; c.lineWidth = 2; c.stroke();
    // window with soft sunlight
    const wx = W * .12, wy = H * .07, ww = Math.min(70, W * .16), wh = ww * 1.25;
    ART.rrect(c, wx, wy, ww, wh, 8); c.fillStyle = '#cdeeff'; c.fill(); c.lineWidth = 5; c.strokeStyle = '#fff'; c.stroke();
    c.strokeStyle = '#fff'; c.lineWidth = 3; c.beginPath(); c.moveTo(wx + ww / 2, wy + 3); c.lineTo(wx + ww / 2, wy + wh - 3); c.moveTo(wx + 3, wy + wh / 2); c.lineTo(wx + ww - 3, wy + wh / 2); c.stroke();
    c.globalAlpha = .18; c.fillStyle = '#fff6c8'; c.beginPath(); c.moveTo(wx + ww * .25, wy + wh); c.lineTo(wx - 30, floorY); c.lineTo(wx + ww + 60, floorY); c.closePath(); c.fill(); c.globalAlpha = 1;
    // wall shelf with bottles
    const shx = W * .82, shy = H * .17;
    c.fillStyle = '#d8b98a'; c.fillRect(shx - 26, shy, 52, 5); c.fillStyle = 'rgba(0,0,0,.12)'; c.fillRect(shx - 26, shy + 5, 52, 2);
    [['#8ec9e8', 15], ['#f2b6c6', 11], ['#c9e07a', 13]].forEach(([col, hh], i) => { const bx = shx - 21 + i * 18; ART.rrect(c, bx, shy - hh, 11, hh, 3); c.fillStyle = col; c.fill(); c.lineWidth = 1; c.strokeStyle = 'rgba(0,0,0,.15)'; c.stroke(); c.fillStyle = '#fff'; c.fillRect(bx + 3, shy - hh - 3, 5, 4); });
    // bath mat under the tub
    ART.ell(c, st.cx, st.cy + 25 * st.sc, W * .3, 11, '#ffe1ea', 'rgba(255,255,255,.7)', 2);
  }
  function drawTub() {
    const tx = W * .1, ty = st.cy - 6 * st.sc, tw = W * .8, th = 26 * st.sc;
    for (const fx of [tx + 8, tx + tw - 8]) { ART.rrect(c, fx - 4, ty + th - 3, 8, 12, 3); c.fillStyle = '#e6e6e6'; c.fill(); c.strokeStyle = '#b8c4cc'; c.lineWidth = 1.2; c.stroke(); }
    ART.rrect(c, tx, ty, tw, th, 30); c.fillStyle = '#ffffff'; c.fill(); c.strokeStyle = '#9fc6dd'; c.lineWidth = 4; c.stroke();
    c.save(); ART.rrect(c, tx + 6, ty + 7, tw - 12, th - 11, 24); c.clip();
    const wg = c.createLinearGradient(0, ty, 0, ty + th); wg.addColorStop(0, '#d7f0ff'); wg.addColorStop(1, '#aee0f7'); c.fillStyle = wg; c.fillRect(tx, ty + th * .3, tw, th);
    c.restore();
    const fx0 = tx + tw - 10, fy0 = ty - 1;
    c.fillStyle = '#c9ccd1'; c.fillRect(fx0 - 3, fy0 - 15, 6, 15); ART.ell(c, fx0, fy0 - 15, 7, 4.5, '#c9ccd1', '#9aa0a8', 1);
    c.font = '18px sans-serif'; c.textAlign = 'center'; c.fillText('🦆', tx + tw * .16, ty + th * .5 + st.duckBob * 2); c.textAlign = 'start';
  }
  // ---------- toy: whack-a-toy with pouncing pet ----------
  const TOYS = ['🎾', '🧶', '🐭', '🦴', '🪶', '🧸', '🐟'];
  function stepToy(dt) {
    const pt = st.pet, prog = st.t / st.dur;
    st.spawn -= dt;
    if (st.spawn <= 0) {
      const free = st.holes.filter(h => !h.item);
      if (free.length) {
        const h = free[Math.floor(Math.random() * free.length)], r = Math.random();
        const P = st.P; h.item = { e: r < P.gold ? '⭐' : r < P.gold + P.bee ? '🐝' : TOYS[Math.floor(Math.random() * TOYS.length)], t: 0, life: P.life0 + (P.life1 - P.life0) * prog };
        h.item.bad = h.item.e === '🐝'; h.item.gold = h.item.e === '⭐';
      }
      st.spawn = st.P.sp0 + (st.P.sp1 - st.P.sp0) * prog + Math.random() * .15;
    }
    for (const h of st.holes) if (h.item) { h.item.t += dt; if (h.item.hit) { h.item.ht += dt; if (h.item.ht > .35) h.item = null; } else if (h.item.t > h.item.life) h.item = null; }
    if (pt.lt < 1) { pt.lt = Math.min(1, pt.lt + dt / .28); pt.x = pt.fx + (pt.tx - pt.fx) * pt.lt; pt.y = pt.fy + (pt.ty - pt.fy) * pt.lt; }
    pt.scared = Math.max(0, pt.scared - dt); pt.happy = Math.max(0, pt.happy - dt);
    for (const p of st.pops) { p.t += dt; p.y -= 40 * dt; } st.pops = st.pops.filter(p => p.t < .9);
  }
  function tapToy(x, y) {
    if (st.done) return;
    let best = null, bd = 48;
    for (const h of st.holes) if (h.item && !h.item.hit) { const d = Math.hypot(x - h.x, y - (h.y - 24)); if (d < bd) { bd = d; best = h; } }
    if (!best) { st.combo = 0; return; }
    const it = best.item, pt = st.pet; it.hit = true; it.ht = 0;
    pt.fx = pt.x; pt.fy = pt.y; pt.tx = best.x; pt.ty = best.y + 10; pt.lt = 0; pt.dir = best.x < pt.x ? -1 : 1;
    if (it.bad) { st.combo = 0; st.pts = Math.max(0, st.pts - 2); pt.scared = .8; SND.err(); st.pops.push({ x: best.x, y: best.y - 60, s: t('toyBee'), col: '#e0604e', t: 0 }); return; }
    st.combo++; st.catches++;
    const g = (it.gold ? 3 : 1) * (st.combo >= 5 ? 3 : st.combo >= 3 ? 2 : 1);
    st.pts += g; pt.happy = .5;
    st.pops.push({ x: best.x, y: best.y - 50, s: '+' + g, col: it.gold ? '#e0a020' : '#b0476a', t: 0 });
    if (st.combo === 3 || st.combo === 5 || (st.combo > 5 && st.combo % 5 === 0)) st.pops.push({ x: W / 2, y: H * .25, s: t('toyCombo', { n: st.combo }), col: '#ff7a3a', t: 0, big: 1 });
    SFX.jingle(); if (st.catches % 3 === 1) SFX.cry(st.sp);
  }
  function drawToyBg() { // v1.18: a sunny backyard -- sky, drifting clouds, hills & trees, a white picket fence, flowers, butterflies
    c.globalAlpha = 1;
    const T0 = st.t, sky = c.createLinearGradient(0, 0, 0, H * .3); sky.addColorStop(0, '#8fd0ff'); sky.addColorStop(1, '#e3f5ff'); c.fillStyle = sky; c.fillRect(0, 0, W, H * .3);
    ART.ell(c, W * .85, H * .1, 26, 26, '#ffe58a'); c.globalAlpha = .35; ART.ell(c, W * .85, H * .1, 42, 42, '#fff3b0'); c.globalAlpha = 1;
    for (let i = 0; i < 3; i++) { const x = ((i * 160 + T0 * (10 + i * 4)) % (W + 140)) - 100, y = H * (.08 + i * .05), k = .8 + (i % 2) * .3; for (const [dx, dy, r] of [[0, 0, 18], [18, -6, 22], [40, 0, 16], [20, 6, 16]]) ART.ell(c, x + dx * k, y + dy * k, r * k, r * .8 * k, '#fff'); }
    c.beginPath(); c.moveTo(0, H * .3); for (let x = 0; x <= W; x += 10) c.lineTo(x, H * .25 - Math.sin(x / W * 6) * 14 - Math.sin(x / W * 13) * 5); c.lineTo(W, H * .3); c.closePath(); c.fillStyle = '#a9d98a'; c.fill();
    for (const [fx, sc2] of [[.08, 1], [.3, .8], [.72, .9], [.95, 1.1]]) { const x = W * fx, y = H * .27; c.fillStyle = '#8a5a3b'; c.fillRect(x - 3 * sc2, y - 26 * sc2, 6 * sc2, 26 * sc2); for (const [dx, dy, r] of [[-9, -30, 12], [9, -30, 12], [0, -40, 14]]) ART.ell(c, x + dx * sc2, y + dy * sc2, r * sc2, r * .9 * sc2, '#5f9e4a'); }
    const g = c.createLinearGradient(0, H * .25, 0, H); g.addColorStop(0, '#bfe6a0'); g.addColorStop(1, '#8cc86a'); c.fillStyle = g; c.fillRect(0, H * .29, W, H);
    // picket fence
    const fy = H * .31; c.fillStyle = '#fffaf2'; c.strokeStyle = 'rgba(120,90,60,.5)'; c.lineWidth = 1; c.fillRect(0, fy - 16, W, 4); c.fillRect(0, fy - 7, W, 4);
    for (let x = 6; x < W; x += 16) { c.beginPath(); c.moveTo(x, fy); c.lineTo(x, fy - 22); c.lineTo(x + 4, fy - 27); c.lineTo(x + 8, fy - 22); c.lineTo(x + 8, fy); c.closePath(); c.fill(); c.stroke(); }
    for (let i = 0; i < 40; i++) { const x = (i * 97) % W, y = H * .34 + ((i * 53) % (H * .66)); c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(x, y, 2, 6); }
    c.fillStyle = '#000'; c.font = '16px sans-serif'; c.textAlign = 'center'; ['🌼', '🌷', '🌸', '🌼', '🌻', '🌷'].forEach((f, i) => c.fillText(f, (i * 131 + 40) % W, H * (.36 + (i * 37 % 60) / 100)));
    c.fillText('🦋', W * .3 + Math.sin(T0 * 1.3) * 40, H * .2 + Math.sin(T0 * 2.1) * 14); c.fillText('🦋', W * .7 + Math.cos(T0) * 30, H * .33 + Math.sin(T0 * 1.7) * 10); c.textAlign = 'start';
    for (const h of st.holes) { ART.ell(c, h.x, h.y + 4, 46, 16, 'rgba(0,0,0,.18)'); ART.ell(c, h.x, h.y, 44, 15, '#6b4a33', 'rgba(60,38,25,.8)', 2); ART.ell(c, h.x, h.y + 2, 36, 10, '#3a2618'); }
  }
  function drawToy() {
    const pt = st.pet;
    // items behind pet if above it
    const drawItem = h => {
      const it = h.item; if (!it) return;
      const up = it.hit ? 1 - it.ht / .35 : Math.min(1, it.t / .12) * (it.t > it.life - .12 ? Math.max(0, (it.life - it.t) / .12) : 1);
      c.save(); c.beginPath(); c.rect(h.x - 50, h.y - 120, 100, 122); c.clip();
      const sz = it.gold ? 44 : 40; c.font = sz + 'px sans-serif'; c.textAlign = 'center';
      const yy = h.y + 6 - up * 42;
      if (it.gold) { ART.ell(c, h.x, yy - 14, 26, 26, 'rgba(255,220,90,.35)'); }
      c.globalAlpha = 1; c.fillStyle = '#000'; // v1.23: emoji take the fill alpha -> a leftover translucent fill made toys look see-through
      c.fillText(it.e, h.x + (it.bad ? Math.sin(st.t * 30) * 2 : 0), yy);
      c.restore(); c.textAlign = 'start';
      if (it.hit && !it.bad) { c.font = '22px sans-serif'; c.fillStyle = '#000'; c.globalAlpha = 1 - it.ht / .35; c.fillText('💥', h.x - 12, h.y - 44 - it.ht * 40); c.globalAlpha = 1; }
    };
    for (const h of st.holes) if (h.y < pt.y) drawItem(h);
    const hop = pt.lt < 1 ? Math.sin(pt.lt * Math.PI) * 70 : pt.happy > 0 ? Math.abs(Math.sin(pt.happy * 12)) * 6 : 0;
    ART.ell(c, pt.x, pt.y + 2, 26 * st.sc / 5, 8, 'rgba(0,0,0,.15)');
    c.save(); c.translate(pt.x + (pt.scared > 0 ? Math.sin(st.t * 50) * 3 : 0), pt.y - hop); c.scale(st.sc * .75, st.sc * .75);
    ART.pet(c, st.sp, { t: st.t, seed: st.seed, happy: pt.happy > 0 || pt.lt < 1, mood: pt.scared > 0 ? 'scared' : 'curious', moving: pt.lt < 1, dir: pt.dir });
    c.restore();
    for (const h of st.holes) if (h.y >= pt.y) drawItem(h);
    for (const p of st.pops) { c.globalAlpha = 1 - p.t / .9; c.font = `900 ${p.big ? 30 : 22}px sans-serif`; c.textAlign = 'center'; c.lineWidth = 4; c.strokeStyle = '#fff'; c.strokeText(p.s, p.x, p.y); c.fillStyle = p.col; c.fillText(p.s, p.x, p.y); c.textAlign = 'start'; c.globalAlpha = 1; }
    c.font = '900 22px sans-serif'; c.fillStyle = '#b0476a'; c.lineWidth = 4; c.strokeStyle = '#fff'; c.strokeText('♥ ' + st.pts, 20, H - 30); c.fillText('♥ ' + st.pts, 20, H - 30);
    if (st.combo >= 2) { c.font = '900 18px sans-serif'; c.fillStyle = '#ff7a3a'; c.strokeText('x' + st.combo, W - 70, H - 30); c.fillText('x' + st.combo, W - 70, H - 30); }
  }
  function finish(quit) {
    if (!st || st.done) return;
    st.done = true; cancelAnimationFrame(raf);
    const sc = quit ? Math.min(.3, score()) : score();
    if (!quit) { if (sc > .8) SFX.tada(); else SFX.pop(); }
    const cb = st.cb;
    setTimeout(() => { stop(); cb && cb(sc); }, quit ? 0 : 700);
    if (!quit) { const d = document.createElement('div'); d.className = 'mresult'; d.textContent = sc > .8 ? '⭐⭐⭐ PERFECT!' : sc > .5 ? '⭐⭐ GOOD!' : '⭐ OK'; ov.appendChild(d); }
  }
  function stop() { if (ov) { ov.remove(); ov = null; } cancelAnimationFrame(raf); }
  return { start, stop, active: () => !!ov };
})();
