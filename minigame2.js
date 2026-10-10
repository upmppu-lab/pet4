// ================= More play mini-games: treat catch, hide & seek, bubbles =================
const PLAY = (() => {
  let ov, cv, c, W, H, raf, st;
  const INFO = { catch: ['🍖', 'pg_catch', 'pg_catchHint'], hide: ['📦', 'pg_hide', 'pg_hideHint'], bubble: ['🫧', 'pg_bubble', 'pg_bubbleHint'], fetch: ['🎾', 'pg_fetch', 'pg_fetchHint'] };
  const TREATS = { dog: ['🦴', '🍖', '🥩'], cat: ['🐟', '🍤', '🥛'], small: ['🥕', '🌻', '🥬'], bird: ['🌻', '🍓', '🌽'], fish: ['🦐', '🪱', '🟤'], reptile: ['🦗', '🪱', '🍓'] };
  const catOf = sp => (SPECIES[sp] || {}).cat || 'dog';
  function start(kind, sp, cb, seed) {
    stop();
    ov = document.createElement('div'); ov.className = 'mini';
    ov.innerHTML = `<div class="mhead"><b>${INFO[kind][0]} ${t(INFO[kind][1])}</b><span id="mhint">${t(INFO[kind][2])}</span><div class="mbar"><i id="mtime"></i></div><div class="mscore" id="mscore"></div></div><canvas></canvas><button class="btn g sm mquit">✕</button>`;
    document.body.appendChild(ov);
    cv = ov.querySelector('canvas'); c = cv.getContext('2d');
    const dpr = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; c.scale(dpr, dpr);
    const k = Math.min(W, H) / 360;
    st = { kind, sp, cb, seed, k, t: 0, done: false, pts: 0, pops: [], pet: { x: W / 2, y: H * .84, tx: W / 2, jump: 0, happy: 0, scared: 0, dir: 1 } };
    st.combo = 0; st.best = 0; st.fever = 0; st.shake = 0; st.parts = []; // v1.17: combos, fever time, particles
    if (kind === 'catch') { st.dur = 12; st.items = []; st.spawn = .3; st.target = 10; st.treats = TREATS[catOf(sp)] || TREATS.dog; }
    if (kind === 'fetch') { st.dur = 0; st.throw = 0; st.throws = 3; st.target = 5; st.pow = 0; st.pv = 1; st.spd = 1.1; st.ph = 'aim'; st.pt = 0; newZone(); }
    if (kind === 'bubble') { st.dur = 10; st.items = []; st.spawn = .15; st.target = 15; st.lastPop = -9; }
    if (kind === 'hide') { st.dur = 0; st.round = 0; st.good = 0; st.rounds = 5; st.cups = [0, 1, 2].map(i => ({ id: i, slot: i, x: W * (.2 + i * .3), lift: 0 })); st.phase = 'show'; st.pt = 0; st.petCup = 1; st.swaps = []; }
    const onDown = e => { const x = e.clientX, y = e.clientY; if (kind === 'catch') st.pet.tx = x; else if (kind === 'bubble') tapBubble(x, y); else if (kind === 'fetch') tapFetch(); else tapCup(x, y); };
    cv.addEventListener('pointerdown', onDown);
    cv.addEventListener('pointermove', e => { if (kind === 'catch' && (e.buttons || e.pointerType === 'touch')) st.pet.tx = e.clientX; });
    ov.querySelector('.mquit').onclick = () => finish(true);
    let last = performance.now();
    const loop = now => { const dt = Math.min(.05, (now - last) / 1000); last = now; step(dt); draw(); if (!st.done) raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
  }
  const comboMul = () => st.fever > 0 ? 3 : st.combo >= 10 ? 3 : st.combo >= 5 ? 2 : 1;
  function addCombo(x, y) { st.combo++; st.best = Math.max(st.best, st.combo);
    if (st.combo === 5 || st.combo === 10) pop(W / 2, H * .3, 'COMBO x' + comboMul() + '!', '#ff6b9a');
    if (st.combo === 8 && st.fever <= 0) { st.fever = 3; pop(W / 2, H * .36, '🔥 FEVER! 🔥', '#ff7a1a'); SND.love && SND.love(); } }
  function burst(x, y, col, n) { for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, v = (60 + Math.random() * 140) * st.k; st.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60 * st.k, t: 0, col, r: (2 + Math.random() * 3) * st.k }); } }
  const score = () => st.kind === 'fetch' ? Math.max(0, Math.min(1, st.pts / st.target)) : st.kind === 'hide' ? st.good / st.rounds : Math.max(0, Math.min(1, st.pts / st.target));
  function pop(x, y, txt, col) { st.pops.push({ x, y, txt, col: col || '#e07a5f', t: 0 }); }
  // ---- treat catch ----
  function stepCatch(dt) {
    const k = st.k, P = st.pet;
    st.spawn -= dt;
    if (st.spawn <= 0) {
      st.spawn = (st.fever > 0 ? .16 : Math.max(.3, .6 - st.t * .025)) * (.7 + Math.random() * .6);
      const r = Math.random(), kind = st.fever > 0 ? (r < .35 ? 'gold' : 'good') : r < .1 ? 'gold' : r < .28 ? 'bad' : 'good';
      st.items.push({ x: 30 * k + Math.random() * (W - 60 * k), y: H * .16, v: (150 + Math.random() * 110 + st.t * 6) * k, kind, e: kind === 'gold' ? '⭐' : kind === 'bad' ? (Math.random() < .5 ? '🧅' : '🍫') : st.treats[Math.floor(Math.random() * st.treats.length)], rot: Math.random() * 6 });
    }
    P.x += (P.tx - P.x) * Math.min(1, dt * 10); if (Math.abs(P.tx - P.x) > 2) P.dir = P.tx > P.x ? 1 : -1;
    for (const it of st.items) {
      it.y += it.v * dt; it.rot += dt * 3;
      if (!it.hit && it.y > P.y - 70 * k && it.y < P.y - 20 * k && Math.abs(it.x - P.x) < 42 * k) {
        it.hit = 1;
        if (it.kind === 'bad') { st.pts = Math.max(0, st.pts - 2); P.scared = .8; st.combo = 0; st.shake = .3; pop(it.x, it.y, '-2 🙅', '#7a5aa8'); SFX.pop && SFX.pop(); }
        else { const n = (it.kind === 'gold' ? 3 : 1) * comboMul(); st.pts += n; P.happy = .5; P.jump = .35; addCombo(it.x, it.y); burst(it.x, it.y, it.kind === 'gold' ? '#ffd23a' : '#ff9e6d', 8); pop(it.x, it.y, '+' + n + (it.kind === 'gold' ? ' ✨' : ''), '#e07a5f'); SND.pop(); }
      }
    }
    for (const it of st.items) if (!it.hit && !it.missed && it.kind !== 'bad' && it.y > P.y) { it.missed = 1; if (st.combo >= 3) pop(it.x, P.y - 40 * k, '💨 combo', '#9a8a7a'); st.combo = 0; } // a good treat dropped -> combo lost
    st.items = st.items.filter(it => !it.hit && it.y < H + 40);
  }
  // ---- bubbles ----
  function stepBubble(dt) {
    const k = st.k; st.spawn -= dt;
    if (st.spawn <= 0) { st.spawn = (st.fever > 0 ? .12 : Math.max(.2, .45 - st.t * .025)) * (.7 + Math.random() * .6); const rb = Math.random() < (st.fever > 0 ? .3 : .1); st.items.push({ x: 30 * k + Math.random() * (W - 60 * k), y: H + 30, r: (rb ? 26 : 18 + Math.random() * 16) * k, v: (70 + Math.random() * 70 + st.t * 4) * k, ph: Math.random() * 6, rb }); }
    for (const b of st.items) { b.y -= b.v * dt; b.ph += dt * 2; b.x += Math.sin(b.ph) * 20 * k * dt; }
    st.items = st.items.filter(b => !b.hit && b.y > H * .14);
    const P = st.pet; P.x += (P.tx - P.x) * Math.min(1, dt * 6); if (P.jump > 0) P.jump -= dt;
  }
  function tapBubble(x, y) {
    for (const b of st.items) if (!b.hit && Math.hypot(b.x - x, b.y - y) < b.r + 14 * st.k) {
      b.hit = 1; if (st.t - st.lastPop > 1.2) st.combo = 0; st.lastPop = st.t; addCombo(b.x, b.y);
      let n = (b.rb ? 3 : 1) * comboMul(); burst(b.x, b.y, b.rb ? '#d99af5' : '#8fd0f5', 10);
      if (b.rb) { for (const o of st.items) if (!o.hit && Math.hypot(o.x - b.x, o.y - b.y) < 110 * st.k) { o.hit = 1; n += comboMul(); burst(o.x, o.y, '#8fd0f5', 6); } st.shake = .25; } // rainbow bubble pops its neighbours
      st.pts += n; pop(b.x, b.y, '+' + n + (b.rb ? ' 🌈' : ''), b.rb ? '#b56cd9' : '#4fa3d9'); SND.pop();
      st.pet.tx = Math.max(40, Math.min(W - 40, b.x)); st.pet.jump = .45; st.pet.dir = b.x > st.pet.x ? 1 : -1; st.pet.happy = .5; return;
    }
  }
  // ---- hide & seek (cups) ----
  const cupX = slot => W * (.2 + slot * .3), cupY = () => H * .55;
  function stepHide(dt) {
    st.pt += dt;
    for (const cp of st.cups) { cp.x += (cupX(cp.slot) - cp.x) * Math.min(1, dt * (st.phase === 'shuffle' ? st.spd : 8)); }
    if (st.phase === 'show') { const u = st.pt; st.cups.forEach(cp => { cp.lift = cp.id === st.petCup ? Math.max(0, Math.min(1, u < 1.3 ? u * 3 : (1.8 - u) * 3)) : 0; }); if (u > 1.9) { st.phase = 'shuffle'; st.pt = 0; st.swapsLeft = 3 + st.round * 2; st.spd = 5 + st.round * 2.2; st.swapT = 0; } }
    else if (st.phase === 'shuffle') {
      st.swapT -= dt;
      if (st.swapT <= 0) {
        if (st.swapsLeft <= 0) { st.phase = 'pick'; $('#mhint') && ($('#mhint').textContent = t('pg_hidePick')); return; }
        st.swapsLeft--; st.swapT = Math.max(.22, .6 - st.round * .08);
        const a = Math.floor(Math.random() * 3); let b = (a + 1 + Math.floor(Math.random() * 2)) % 3;
        const A = st.cups.find(q => q.slot === a), B = st.cups.find(q => q.slot === b); A.slot = b; B.slot = a; SFX.step && SFX.step();
      }
    } else if (st.phase === 'reveal') {
      st.cups.forEach(cp => { cp.lift = Math.min(1, cp.lift + dt * 4 * (cp.pick || cp.id === st.petCup ? 1 : 0)); });
      if (st.pt > 1.4) { st.round++; if (st.round >= st.rounds) { finish(false); return; } st.phase = 'show'; st.pt = 0; st.cups.forEach(cp => { cp.lift = 0; cp.pick = 0; }); st.petCup = st.cups[Math.floor(Math.random() * 3)].id; $('#mhint') && ($('#mhint').textContent = t('pg_hideHint')); }
    }
  }
  function tapCup(x, y) {
    if (st.phase !== 'pick') return;
    const k = st.k; const cp = st.cups.find(q => Math.abs(q.x - x) < 50 * k && y > cupY() - 90 * k && y < cupY() + 30 * k); if (!cp) return;
    cp.pick = 1; const ok = cp.id === st.petCup; if (ok) { st.good++; pop(cp.x, cupY() - 90 * k, '🎉 ' + t('pg_found'), '#5aa048'); SND.love(); st.pet.happy = 1; } else { pop(cp.x, cupY() - 90 * k, '💦 ' + t('pg_miss'), '#7a5aa8'); SFX.pop && SFX.pop(); }
    st.phase = 'reveal'; st.pt = 0;
  }
  // ---- v1.23: fetch -- tap when the swinging power needle is in the green zone; the pet runs after the ball and brings it back ----
  function newZone() { st.zw = Math.max(.12, .24 - st.throw * .025); st.zc = st.zw / 2 + .08 + Math.random() * (.84 - st.zw); }
  function stepFetch(dt) {
    const P = st.pet, k = st.k; st.pt += dt;
    if (st.ph === 'aim') { st.pow += st.pv * st.spd * dt; if (st.pow > 1) { st.pow = 1; st.pv = -1; } if (st.pow < 0) { st.pow = 0; st.pv = 1; } P.tx = W * .22; }
    else if (st.ph === 'fly') { const u = Math.min(1, st.pt / .7); st.ball = { x: st.bx0 + (st.bx1 - st.bx0) * u, y: P.y - 20 * k - Math.sin(u * Math.PI) * (120 + st.pow * 90) * k }; P.tx = st.bx1; if (u >= 1) { st.ph = 'run'; st.pt = 0; } }
    else if (st.ph === 'run') { if (Math.abs(P.x - st.bx1) < 12 * k) { st.ph = 'back'; st.pt = 0; st.ball = null; P.happy = .4; } }
    else if (st.ph === 'back') { P.tx = W * .22; if (Math.abs(P.x - P.tx) < 12 * k) { st.throw++; if (st.throw >= st.throws) { finish(false); return; } st.spd += .25; st.ph = 'aim'; st.pow = 0; st.pv = 1; newZone(); } }
    P.x += (P.tx - P.x) * Math.min(1, dt * (st.ph === 'aim' ? 6 : 3.2)); if (Math.abs(P.tx - P.x) > 2) P.dir = P.tx > P.x ? 1 : -1;
  }
  function tapFetch() {
    if (st.ph !== 'aim') return; const k = st.k, d = Math.abs(st.pow - st.zc), P = st.pet;
    const perfect = d < st.zw * .22, good = d <= st.zw / 2, n = perfect ? 2 : good ? 1 : 0; st.pts += n;
    if (n) { addCombo(W / 2, H * .4); burst(W / 2, H * .4, perfect ? '#ffd23a' : '#8fd07a', perfect ? 14 : 8); SND.pop(); } else { st.combo = 0; st.shake = .25; SFX.pop && SFX.pop(); }
    pop(W / 2, H * .36, perfect ? '🎯 PERFECT +2' : good ? '👍 GOOD +1' : '💨 MISS', perfect ? '#ff7a1a' : good ? '#5aa048' : '#9a8a7a');
    st.bx0 = P.x; st.bx1 = W * (.45 + (good ? .15 + st.pow * .35 : .1 + Math.random() * .2)); st.ph = 'fly'; st.pt = 0; st.ball = { x: st.bx0, y: P.y };
  }
  function sceneField() {
    const k = st.k, g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#8fd0ff'); g.addColorStop(.55, '#e3f5ff'); g.addColorStop(1, '#dff5d0'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    ART.ell(c, W * .15, H * .12, 24 * k, 24 * k, '#ffe58a');
    for (let i = 0; i < 3; i++) cloud(((i * 170 + st.t * (8 + i * 4)) % (W + 160)) - 120, H * (.1 + i * .06), (.8 + (i % 2) * .3) * k, .95);
    hills(H * .62, '#b7e19a', 22 * k, .5); tree(W * .85, H * .66, 1.1 * k); tree(W * .62, H * .64, .8 * k);
    c.fillStyle = '#8fce6c'; c.fillRect(0, H * .7, W, H); c.fillStyle = 'rgba(255,255,255,.35)'; for (let i = 0; i < 6; i++) c.fillRect(0, H * (.74 + i * .045), W, 2 * k); // mown stripes
  }
  function step(dt) {
    if (st.done) return;
    st.t += dt;
    const P = st.pet; if (P.happy > 0) P.happy -= dt; if (P.scared > 0) P.scared -= dt; if (P.jump > 0 && st.kind === 'catch') P.jump -= dt;
    if (st.fever > 0) st.fever -= dt; if (st.shake > 0) st.shake -= dt;
    for (const q of st.parts) { q.t += dt; q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 300 * st.k * dt; } st.parts = st.parts.filter(q => q.t < .7);
    if (st.kind === 'catch') stepCatch(dt); else if (st.kind === 'bubble') stepBubble(dt); else if (st.kind === 'fetch') stepFetch(dt); else stepHide(dt);
    for (const p of st.pops) p.t += dt; st.pops = st.pops.filter(p => p.t < 1);
    const tb = $('#mtime'); if (tb) tb.style.width = (st.kind === 'fetch' ? (st.throw / st.throws) : st.kind === 'hide' ? (st.round / st.rounds) : Math.max(0, 1 - st.t / st.dur)) * 100 + '%';
    const sc = $('#mscore'); if (sc) sc.textContent = st.kind === 'fetch' ? `🎾 ${Math.min(st.throws, st.throw + 1)} / ${st.throws} · ⭐ ${st.pts}` : st.kind === 'hide' ? `🎯 ${st.good} / ${st.rounds} · ${t('pg_round', { n: Math.min(st.rounds, st.round + 1) })}` : `⭐ ${st.pts} / ${st.target}${st.combo >= 2 ? ` · 🔗${st.combo}` : ''}${st.fever > 0 ? ' · 🔥' : ''}`;
    if ((st.kind === 'catch' || st.kind === 'bubble') && (st.t >= st.dur || st.pts >= st.target)) finish(false); // v1.23: reaching the goal ends the game early
  }
  // v1.17: scenic backgrounds -- a sunset picnic for treat catch, a rainbow garden for bubbles (clouds drift, sun glows)
  function cloud(x, y, s, a) { c.globalAlpha = a; for (const [dx, dy, r] of [[0, 0, 22], [22, -8, 26], [48, 0, 20], [24, 8, 20]]) ART.ell(c, x + dx * s, y + dy * s, r * s, r * .8 * s, '#fff'); c.globalAlpha = 1; }
  function hills(y, col, amp, ph) { c.beginPath(); c.moveTo(0, H); for (let x = 0; x <= W; x += 8) c.lineTo(x, y - Math.sin(x / W * 5 + ph) * amp - Math.sin(x / W * 11 + ph * 2) * amp * .35); c.lineTo(W, H); c.closePath(); c.fillStyle = col; c.fill(); }
  function tree(x, y, s) { c.fillStyle = '#8a5a3b'; c.fillRect(x - 4 * s, y - 34 * s, 8 * s, 34 * s); for (const [dx, dy, r] of [[-12, -40, 16], [12, -40, 16], [0, -54, 19]]) ART.ell(c, x + dx * s, y + dy * s, r * s, r * .9 * s, '#5f9e4a'); }
  function sceneSunset() {
    const k = st.k, g = c.createLinearGradient(0, 0, 0, H * .7); g.addColorStop(0, st.fever > 0 ? '#ff9a5a' : '#7fb8f0'); g.addColorStop(.55, '#ffc98f'); g.addColorStop(1, '#ffe7c2'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    const sx = W * .78, sy = H * .34; const sg = c.createRadialGradient(sx, sy, 5, sx, sy, 90 * k); sg.addColorStop(0, 'rgba(255,240,170,1)'); sg.addColorStop(.35, 'rgba(255,210,120,.8)'); sg.addColorStop(1, 'rgba(255,200,120,0)'); c.fillStyle = sg; c.fillRect(0, 0, W, H);
    ART.ell(c, sx, sy, 30 * k, 30 * k, '#ffe58a');
    for (let i = 0; i < 4; i++) cloud(((i * 170 + st.t * (12 + i * 5)) % (W + 160)) - 120, H * (.12 + i * .06), (.8 + (i % 2) * .4) * k, .85);
    hills(H * .66, '#c9a9d9', 26 * k, 0); hills(H * .72, '#9fcf7c', 20 * k, 2); tree(W * .12, H * .74, k); tree(W * .9, H * .75, 1.2 * k);
    const gy = H * .86; c.fillStyle = '#8cc86a'; c.fillRect(0, H * .76, W, H);
    c.save(); c.beginPath(); c.moveTo(W * .08, gy); c.lineTo(W * .92, gy); c.lineTo(W, H); c.lineTo(0, H); c.closePath(); c.clip(); // a red-white picnic blanket
    for (let x = 0; x < W; x += 22 * k) for (let y = gy; y < H; y += 22 * k) { c.fillStyle = ((x / (22 * k) + (y - gy) / (22 * k)) | 0) % 2 ? '#f26d6d' : '#fff6ee'; c.fillRect(x, y, 22 * k, 22 * k); } c.restore();
    c.font = `${Math.round(22 * k)}px sans-serif`; c.textAlign = 'center'; c.fillText('🧺', W * .1, gy + 30 * k); c.fillText('🌼', W * .93, H * .8); c.fillText('🌷', W * .05, H * .8);
  }
  function sceneGarden() {
    const k = st.k, g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, st.fever > 0 ? '#ffb3d9' : '#9fd8ff'); g.addColorStop(.6, '#dff3ff'); g.addColorStop(1, '#fdf3ff'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    const cols = ['#ff6b6b', '#ffa94d', '#ffe066', '#69db7c', '#4dabf7', '#9775fa']; c.lineWidth = 9 * k; c.globalAlpha = .45;
    cols.forEach((col, i) => { c.beginPath(); c.arc(W / 2, H * .62, W * .62 - i * 9 * k, Math.PI * 1.05, Math.PI * 1.95); c.strokeStyle = col; c.stroke(); }); c.globalAlpha = 1;
    for (let i = 0; i < 4; i++) cloud(((i * 150 + st.t * (10 + i * 6)) % (W + 160)) - 120, H * (.14 + (i % 3) * .07), (.7 + (i % 2) * .5) * k, .95);
    hills(H * .8, '#a8dd8a', 18 * k, 1); c.fillStyle = '#8fce6c'; c.fillRect(0, H * .88, W, H);
    c.font = `${Math.round(20 * k)}px sans-serif`; c.textAlign = 'center'; ['🌷', '🌼', '🌸', '🌻', '🌷', '🌸', '🌼'].forEach((f, i) => c.fillText(f, W * (.06 + i * .148), H * .9 + Math.sin(st.t * 2 + i) * 2));
    c.fillText('🦋', W * .2 + Math.sin(st.t) * 30 * k, H * .45 + Math.sin(st.t * 2.3) * 12 * k);
  }
  function petAt(x, y, s, dir, extra) { c.save(); c.translate(x, y); c.scale(s, s); ART.pet(c, st.sp, Object.assign({ t: st.t, seed: st.seed, dir, moving: false }, extra)); c.restore(); }
  function draw() {
    const k = st.k, P = st.pet;
    c.clearRect(0, 0, W, H);
    c.save(); if (st.shake > 0) c.translate((Math.random() - .5) * 10 * st.shake, (Math.random() - .5) * 10 * st.shake);
    if (st.kind === 'bubble') sceneGarden(); else if (st.kind === 'catch') sceneSunset(); else if (st.kind === 'fetch') sceneField();
    else { c.fillStyle = '#f7ecff'; c.fillRect(0, 0, W, H); c.fillStyle = '#e2cdb0'; c.fillRect(0, cupY() + 14 * k, W, H); }
    const ps = 2.2 * k;
    if (st.kind === 'catch') {
      for (const it of st.items) { c.save(); c.translate(it.x, it.y); c.rotate(Math.sin(it.rot) * .3); c.font = `${Math.round(30 * k)}px sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(it.e, 0, 0); c.restore(); }
      const hop = P.happy > 0 ? Math.sin(P.happy * 12) * 6 * k : 0, sh = P.scared > 0 ? Math.sin(st.t * 60) * 3 : 0;
      petAt(P.x + sh, P.y - Math.abs(hop) - (P.jump > 0 ? Math.sin(P.jump / .35 * Math.PI) * 26 * k : 0), ps, P.dir, { happy: P.happy > 0, mood: P.scared > 0 ? 'scared' : P.happy > 0 ? 'love' : 'happy' });
    } else if (st.kind === 'fetch') {
      // power meter: a bar with the green zone and the swinging needle
      const bx = W * .12, bw = W * .76, by = H * .3, bh = 22 * k;
      ART.rrect(c, bx - 4, by - 4, bw + 8, bh + 8, 12 * k); c.fillStyle = 'rgba(255,255,255,.85)'; c.fill(); ART.rrect(c, bx, by, bw, bh, 9 * k); c.fillStyle = '#f3dcc0'; c.fill();
      c.fillStyle = '#7fcf6a'; c.fillRect(bx + bw * (st.zc - st.zw / 2), by, bw * st.zw, bh); c.fillStyle = '#ffd23a'; c.fillRect(bx + bw * (st.zc - st.zw * .22), by, bw * st.zw * .44, bh);
      if (st.ph === 'aim') { const nx = bx + bw * st.pow; c.fillStyle = '#5a3a2a'; c.fillRect(nx - 2.5 * k, by - 8 * k, 5 * k, bh + 16 * k); c.font = `bold ${Math.round(16 * k)}px sans-serif`; c.textAlign = 'center'; c.fillStyle = '#5a3a2a'; c.fillText('👆 TAP!', W / 2, by + bh + 34 * k); }
      if (st.ball) { c.font = `${Math.round(26 * k)}px sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#000'; c.fillText('🎾', st.ball.x, st.ball.y); c.textBaseline = 'alphabetic'; }
      else if (st.ph === 'back' || st.ph === 'aim') { c.font = `${Math.round(18 * k)}px sans-serif`; c.textAlign = 'center'; c.fillStyle = '#000'; c.fillText('🎾', P.x + 14 * k * P.dir, P.y - 40 * k); }
      const run = st.ph === 'run' || st.ph === 'back' || st.ph === 'fly';
      petAt(P.x, P.y - (run ? Math.abs(Math.sin(st.t * 14)) * 5 * k : 0), ps, P.dir, { happy: P.happy > 0, mood: 'love', moving: run });
    } else if (st.kind === 'bubble') {
      for (const b of st.items) { const g = c.createRadialGradient(b.x - b.r * .3, b.y - b.r * .3, 1, b.x, b.y, b.r); g.addColorStop(0, 'rgba(255,255,255,.9)'); g.addColorStop(.7, b.rb ? 'rgba(255,190,240,.35)' : 'rgba(180,225,255,.3)'); g.addColorStop(1, b.rb ? 'rgba(190,120,255,.6)' : 'rgba(120,190,240,.55)'); c.fillStyle = g; c.beginPath(); c.arc(b.x, b.y, b.r, 0, 7); c.fill(); c.lineWidth = 1.5; c.strokeStyle = 'rgba(255,255,255,.9)'; c.stroke(); }
      const jy = P.jump > 0 ? Math.sin(P.jump / .45 * Math.PI) * 40 * k : 0;
      petAt(P.x, P.y - jy, ps, P.dir, { happy: P.happy > 0, mood: 'love' });
    } else {
      for (const cp of st.cups) {
        const x = cp.x, y = cupY();
        if (cp.id === st.petCup && cp.lift > .05) petAt(x, y + 6 * k, 1.3 * k, 1, { happy: st.phase === 'reveal', mood: 'love' });
        const ly = cp.lift * 70 * k;
        c.save(); c.translate(x, y - ly);
        const w = 44 * k, h = 70 * k; ART.rrect(c, -w, -h, w * 2, h, 8 * k); c.fillStyle = '#d9a86a'; c.fill(); c.lineWidth = 2; c.strokeStyle = ART.OUT; c.stroke();
        c.fillStyle = '#c28f55'; c.fillRect(-w, -h, w * 2, 12 * k); c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(-4 * k, -h, 8 * k, h);
        c.font = `${Math.round(20 * k)}px sans-serif`; c.textAlign = 'center'; c.fillText('🐾', 0, -h * .35); c.restore();
      }
      if (st.phase === 'pick') { c.font = `bold ${Math.round(18 * k)}px sans-serif`; c.textAlign = 'center'; c.fillStyle = '#8a5aa8'; c.fillText('👆 ' + t('pg_hidePick'), W / 2, cupY() + 70 * k); }
    }
    for (const q of st.parts) { c.globalAlpha = 1 - q.t / .7; ART.ell(c, q.x, q.y, q.r, q.r, q.col); } c.globalAlpha = 1;
    if (st.fever > 0) { c.globalAlpha = .18 + .1 * Math.sin(st.t * 12); const fg = c.createRadialGradient(W / 2, H / 2, 10, W / 2, H / 2, Math.max(W, H) * .7); fg.addColorStop(0, 'rgba(255,200,80,0)'); fg.addColorStop(1, '#ff8a3d'); c.fillStyle = fg; c.fillRect(0, 0, W, H); c.globalAlpha = 1; }
    c.restore();
    for (const p of st.pops) { c.globalAlpha = 1 - p.t; c.font = `bold ${Math.round(20 * k)}px sans-serif`; c.textAlign = 'center'; c.lineWidth = 4; c.strokeStyle = '#fff'; c.strokeText(p.txt, p.x, p.y - p.t * 40 * k); c.fillStyle = p.col; c.fillText(p.txt, p.x, p.y - p.t * 40 * k); c.globalAlpha = 1; }
    c.textAlign = 'start'; c.textBaseline = 'alphabetic';
  }
  function finish(quit) {
    if (!st || st.done) return;
    st.done = true; cancelAnimationFrame(raf);
    const sc = quit ? Math.min(.3, score()) : score();
    if (!quit) { if (sc > .8) SFX.tada && SFX.tada(); else SFX.pop && SFX.pop(); }
    const cb = st.cb;
    setTimeout(() => { stop(); cb && cb(sc); }, quit ? 0 : 900);
    if (!quit) { const d = document.createElement('div'); d.className = 'mresult'; d.textContent = sc > .8 ? '⭐⭐⭐ PERFECT!' : sc > .5 ? '⭐⭐ GOOD!' : '⭐ OK'; ov.appendChild(d); }
  }
  function stop() { if (ov) { ov.remove(); ov = null; } cancelAnimationFrame(raf); }
  return { start, stop, active: () => !!ov };
})();
