// ================= My home: room view, HUD & panels =================
// ---------------- client view ----------------
const Home = (() => {
  let cv, c, dpr = 1, vw = 0, vh = 0;
  const cam = { x: 0, y: 0, z: 1, free: false, uz: null };
  let bg = null, bgKey = '', T = 0, last = 0, hits = [], me = null, sel = null, napT = 0, napAt = null, stepT = 0, act = null, curFloor = 0;
  const pets = new Map(); const hearts = [];
  const h = () => S && S.home;
  const n = () => HOME_LV[(h() || { lv: 1 }).lv].w;
  const DOORX = () => n(), DOORY = () => n() - 2;
  const floorItems = () => h().items.filter(it => (it.fl || 0) === curFloor);

  // ---- grid ----
  let occ = new Set();
  function buildOcc() { occ = new Set(); for (const it of floorItems()) { const q = HOME.fp(it); if (q.flat) continue; for (let x = 0; x < q.w; x++) for (let y = 0; y < q.d; y++) occ.add((it.x + x) + ',' + (it.y + y)); } }
  function walk(x, y) { const N = n(); if (curFloor === 0 && x === DOORX() && y === DOORY()) return true; return x >= 0 && y >= 0 && x < N && y < N && !occ.has(x + ',' + y); }
  function nearestFree(tx, ty) { let b = null, bd = 1e9; const N = n(); for (let x = 0; x < N; x++) for (let y = 0; y < N; y++) { if (!walk(x, y)) continue; const d = Math.hypot(x - tx, y - ty); if (d < bd) { bd = d; b = { x, y }; } } return b; }
  function findPath(sx, sy, tx, ty) {
    sx = Math.floor(sx); sy = Math.floor(sy);
    if (!walk(tx, ty)) { const q = nearestFree(tx, ty); if (!q) return []; tx = q.x; ty = q.y; }
    const key = (x, y) => x + ',' + y, came = new Map([[key(sx, sy), null]]), Q = [[sx, sy]];
    while (Q.length) {
      const [x, y] = Q.shift();
      if (x === tx && y === ty) { const out = []; let k = key(x, y), cur = [x, y]; while (came.get(k)) { out.unshift({ x: cur[0] + .5, y: cur[1] + .5 }); cur = came.get(k); k = key(cur[0], cur[1]); } return out; }
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
        const nx = x + dx, ny = y + dy; if (came.has(key(nx, ny)) || !walk(nx, ny)) continue;
        if (dx && dy && (!walk(x + dx, y) || !walk(x, y + dy))) continue;
        came.set(key(nx, ny), [x, y]); Q.push([nx, ny]);
      }
    }
    return [];
  }
  function goTo(a, tx, ty, cb) { a.path = findPath(a.x, a.y, Math.floor(tx), Math.floor(ty)); a.cb = cb || null; if (!a.path.length) { a.cb = null; cb && cb(); } }
  function step(a, dt) {
    a.t += dt;
    if (!a.path.length) { a.moving = false; return; }
    const q = a.path[0], dx = q.x - a.x, dy = q.y - a.y, d = Math.hypot(dx, dy), s = a.speed * dt; a.moving = true;
    const sdx = dx - dy, sdy = dx + dy;
    if (Math.abs(sdx) > .2 * d) a.dir = sdx > 0 ? 1 : -1;
    if (Math.abs(sdx) > 1.15 * Math.abs(sdy)) a.face = 2;
    else if (Math.abs(sdy) > .2 * d) a.face = sdy < 0 ? 1 : 0;
    if (d <= s) { a.x = q.x; a.y = q.y; a.path.shift(); if (!a.path.length) { a.moving = false; const cb = a.cb; a.cb = null; cb && cb(); } } else { a.x += dx / d * s; a.y += dy / d * s; }
  }
  function walkNear(it, cb) {
    const q = HOME.fp(it), cand = [];
    for (let x = it.x - 1; x <= it.x + q.w; x++) for (let y = it.y - 1; y <= it.y + q.d; y++) if (walk(x, y) && !(x >= it.x && x < it.x + q.w && y >= it.y && y < it.y + q.d) && !(x === DOORX() && y === DOORY())) cand.push({ x, y });
    cand.sort((a, b) => Math.hypot(a.x - me.x, a.y - me.y) - Math.hypot(b.x - me.x, b.y - me.y));
    if (!cand.length) { cb && cb(); return; }
    goTo(me, cand[0].x, cand[0].y, () => { const cx = it.x + q.w / 2, cy = it.y + q.d / 2, dxs = (cx - cy) - (me.x - me.y); if (Math.abs(dxs) > .05) me.dir = dxs > 0 ? 1 : -1; me.face = cx + cy < me.x + me.y - .3 ? 1 : 0; cb && cb(); });
  }
  function stepJoy(dt) {
    const joy = World.joy; if (!joy.on || (!joy.dx && !joy.dy) || napT > 0) return;
    me.path = []; me.cb = null;
    const sx = joy.dx, sy = joy.dy * 2; let gx = (sx + sy) / 2, gy = (sy - sx) / 2; const l = Math.hypot(gx, gy) || 1;
    const sp = me.speed * Math.min(1, Math.hypot(joy.dx, joy.dy)) * dt; gx = gx / l * sp; gy = gy / l * sp; [gx, gy] = VIEW.invV(gx, gy);
    const ok = (x, y) => walk(Math.floor(x), Math.floor(y)) && walk(Math.floor(x + .2), Math.floor(y + .2)) && walk(Math.floor(x - .2), Math.floor(y - .2));
    if (ok(me.x + gx, me.y + gy)) { me.x += gx; me.y += gy; } else if (ok(me.x + gx, me.y)) me.x += gx; else if (ok(me.x, me.y + gy)) me.y += gy;
    me.moving = true; const gl = Math.hypot(gx, gy) || 1;
    const sdx = gx - gy, sdy = gx + gy;
    if (Math.abs(sdx) > .2 * gl) me.dir = sdx > 0 ? 1 : -1;
    if (Math.abs(sdx) > 1.15 * Math.abs(sdy)) me.face = 2;
    else if (Math.abs(sdy) > .2 * gl) me.face = sdy < 0 ? 1 : 0;
    if (curFloor === 0 && Math.floor(me.x) === DOORX() && Math.floor(me.y) === DOORY()) leave();
  }

  // ---- pets living at home ----
  function syncPets() {
    const list = h().pets, ids = new Set(list.map(p => p.id));
    for (const id of [...pets.keys()]) if (!ids.has(id)) pets.delete(id);
    for (const p of list) if (!pets.has(p.id)) { const f = nearestFree(Math.random() * n(), Math.random() * n()) || { x: 1, y: 1 }; pets.set(p.id, { p, x: f.x + .5, y: f.y + .5, path: [], t: Math.random() * 9, dir: 1, face: 0, speed: 1.1, idle: 1 + Math.random() * 2, sleep: 0, happyT: 0 }); }
    for (const a of pets.values()) a.p = list.find(q => q.id === a.p.id) || a.p;
  }
  // v9.82: water animals live in the aquarium (split between tanks); with no aquarium they sit in a little fish bowl -- never on the floor
  const aquatic = p => ['fish', 'axolotl'].includes(ART.look(p.sp).t);
  function placeSwimmer(a) {
    const tanks = h().items.filter(it => it.k === 'aquarium'), fishes = [...pets.values()].filter(q => aquatic(q.p)), i = Math.max(0, fishes.indexOf(a));
    const tk = tanks.length ? tanks[i % tanks.length] : null;
    if (tk) { const q = HOME.fp(tk), sd = (ART.hashStr(a.p.id) % 97) / 97, k = .5 + .5 * Math.sin(a.t * (.5 + sd * .4) + sd * 6);
      a.tank = tk; a.bowl = null; a.fl = tk.fl || 0; a.x = tk.x + .3 + k * (q.w - .6); a.y = tk.y + q.d * .55; a.dir = Math.cos(a.t * (.5 + sd * .4) + sd * 6) > 0 ? 1 : -1; a.face = 0; a.moving = true; a.depth = q.w + q.d; }
    else { if (!a.bowl) { const f = nearestFree(1 + i * 2, 1) || { x: 1, y: 1 }; a.bowl = { x: f.x + .5, y: f.y + .5 }; } a.tank = null; a.fl = 0; a.x = a.bowl.x; a.y = a.bowl.y; a.dir = Math.sin(a.t * .8) > 0 ? 1 : -1; a.moving = false; }
  }
  function petBrain(a, dt) {
    if (aquatic(a.p)) { a.t += dt; if (a.happyT > 0) a.happyT -= dt; a.path = []; placeSwimmer(a); return; }
    if (a.happyT > 0) a.happyT -= dt;
    if (a.sleep > 0) { a.sleep -= dt; a.t += dt; return; }
    step(a, dt); if (a.path.length) return;
    a.idle -= dt; if (a.idle > 0) return;
    a.idle = 2 + Math.random() * 4;
    // v9.96: a random cushion on its floor; up to 3 pets may snuggle on the same one (each at its own spot on it)
    a.bedId = null;
    const beds = h().items.filter(it => (it.k === 'h_petbed' || it.k === 'y_dogtent') && (it.fl || 0) === (a.fl || 0));
    if (beds.length && Math.random() < .25) {
      const on = id => [...pets.values()].filter(o => o !== a && o.bedId === id).length, ok = beds.filter(b => on(b.id) < 3);
      if (ok.length) { const bed = ok[Math.floor(Math.random() * ok.length)], k = on(bed.id), off = [[0, 0], [-.22, .16], [.2, .2]][k] || [0, 0]; a.bedId = bed.id;
        goTo(a, bed.x, bed.y, () => { a.x = bed.x + .5 + off[0]; a.y = bed.y + .5 + off[1]; a.sleep = 5 + Math.random() * 6; }); return; }
    }
    if (me && Math.random() < .3) { goTo(a, Math.floor(me.x + (Math.random() < .5 ? 1 : -1)), Math.floor(me.y)); return; }
    const f = nearestFree(Math.floor(Math.random() * n()), Math.floor(Math.random() * n())); if (f) goTo(a, f.x, f.y);
  }

  // ---- view ----
  function resize() { dpr = Math.min(2, window.devicePixelRatio || 1); vw = cv.clientWidth; vh = cv.clientHeight; cv.width = Math.round(vw * dpr); cv.height = Math.round(vh * dpr); }
  function fitZ() { return Math.max(.45, Math.min(1.5, (vw * .94) / (n() * TW))); }
  function buildBg() {
    const hh = h(), N = n(), key = [N, hh.floor, hh.wall, VIEW.r].join('|');
    if (key === bgKey && bg) return; bgKey = key;
    const cs = [[0, 0], [N + 2, 0], [N + 2, N + 2], [0, N + 2]].map(([x, y]) => [ISO.wx(x, y), ISO.wy(x, y)]);
    const minX = Math.min(...cs.map(q => q[0])) - 60, maxX = Math.max(...cs.map(q => q[0])) + 60, minY = Math.min(...cs.map(q => q[1])) - 170, maxY = Math.max(...cs.map(q => q[1])) + 40;
    bg = document.createElement('canvas'); const k = 2; bg.width = (maxX - minX) * k; bg.height = (maxY - minY) * k; bg.ox = minX; bg.oy = minY; bg.k = k;
    const b = bg.getContext('2d'); b.scale(k, k); b.translate(-minX, -minY);
    // door mat outside + soft shadow
    const P = (x, y) => [ISO.wx(x, y), ISO.wy(x, y)];
    const mat = [P(N, N - 2), P(N + 1, N - 2), P(N + 1, N - 1), P(N, N - 1)]; b.beginPath(); mat.forEach((p, i) => i ? b.lineTo(p[0], p[1]) : b.moveTo(p[0], p[1])); b.closePath(); b.fillStyle = '#e8b4c4'; b.fill();
    FURN.floor(b, N, N, hh.floor); FURN.walls(b, N, N, hh.wall, true);
  }
  function drawGrid() {
    const N = n(); c.save(); c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 1;
    for (let x = 0; x <= N; x++) { c.beginPath(); c.moveTo(ISO.wx(x, 0), ISO.wy(x, 0)); c.lineTo(ISO.wx(x, N), ISO.wy(x, N)); c.stroke(); }
    for (let y = 0; y <= N; y++) { c.beginPath(); c.moveTo(ISO.wx(0, y), ISO.wy(0, y)); c.lineTo(ISO.wx(N, y), ISO.wy(N, y)); c.stroke(); }
    // keep the doorway clear
    const d = [[N - 1, N - 2], [N, N - 2], [N, N - 1], [N - 1, N - 1]].map(([x, y]) => [ISO.wx(x, y), ISO.wy(x, y)]); c.beginPath(); d.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); c.fillStyle = 'rgba(255,120,120,.25)'; c.fill();
    c.restore();
  }
  function drawItem(it) {
    const q = HOME.fp(it), vr = VIEW.rect(it.x, it.y, q.w, q.d), MX = (VIEW.odd() ? 1 : 0) ^ (it.f ? 1 : 0) ? -1 : 1;
    c.save(); c.translate(ISO.sx(vr.x, vr.y), ISO.sy(vr.x, vr.y));
    if (App.editing && sel === it.id) c.globalAlpha = .5;
    c.scale(MX, 1); FURN.item(c, it.k, T); c.restore();
    if (App.editing && sel === it.id) { c.save(); c.strokeStyle = '#ff7ab8'; c.lineWidth = 2.5; c.setLineDash([6, 4]); const p = [[it.x, it.y], [it.x + q.w, it.y], [it.x + q.w, it.y + q.d], [it.x, it.y + q.d]].map(([x, y]) => [ISO.wx(x, y), ISO.wy(x, y)]); c.beginPath(); p.forEach((z, i) => i ? c.lineTo(z[0], z[1]) : c.moveTo(z[0], z[1])); c.closePath(); c.stroke(); c.restore(); }
    const sx = ISO.wx(it.x + q.w / 2, it.y + q.d / 2), sy = ISO.wy(it.x + q.w / 2, it.y + q.d / 2);
    if (HOME_ACTS.eat.items.includes(it.k)) { const R = availDish(h()); if (R) { c.font = '18px sans-serif'; c.textAlign = 'center'; c.fillText(R.e, sx, sy - (q.flat ? 30 : 58)); c.textAlign = 'start'; } }
    hits.push({ kind: 'item', item: it, x0: sx - vr.w * 26 - 6, x1: sx + vr.w * 26 + 6, y0: sy - (q.flat ? 16 : 70), y1: sy + 14 });
  }
  function drawMe() {
    const sx = ISO.wx(me.x, me.y), sy = ISO.wy(me.x, me.y);
    if (napT > 0 && napAt) { // lying on the bed
      const b = napAt, q = HOME.fp(b), L = b.f ? q.d : q.w, cx = b.f ? b.x + q.w / 2 : null, cy = b.f ? null : b.y + q.d / 2;
      const hp = b.f ? [cx, b.y + .35] : [b.x + .35, cy], fp2 = b.f ? [cx, b.y + L - .1] : [b.x + L - .1, cy];
      const hx = ISO.wx(hp[0], hp[1]), hy = ISO.wy(hp[0], hp[1]) - 22, fx = ISO.wx(fp2[0], fp2[1]), fy = ISO.wy(fp2[0], fp2[1]) - 22;
      const len = Math.hypot(hx - fx, hy - fy), ux = (hx - fx) / len, uy = (hy - fy) / len, bx = hx, by = hy + 22;
      c.save(); c.translate(fx, fy); c.rotate(Math.atan2(ux, -uy)); const k = Math.min(.8, len / 64); c.scale(k, k); ART.human(c, CFG.look, 0, 0, false, 'calm'); c.restore();
      { const [cx2, cy2] = [ISO.wx((hp[0] + fp2[0]) / 2 + (b.f ? 0 : .15), (hp[1] + fp2[1]) / 2 + (b.f ? .15 : 0)), ISO.wy((hp[0] + fp2[0]) / 2 + (b.f ? 0 : .15), (hp[1] + fp2[1]) / 2 + (b.f ? .15 : 0))]; const w2 = b.k === 'h_bed' ? .45 : .8; const pts = (b.f ? [[cx - w2, b.y + L * .45], [cx + w2, b.y + L * .45], [cx + w2, b.y + L - .08], [cx - w2, b.y + L - .08]] : [[b.x + L * .45, cy - w2], [b.x + L - .08, cy - w2], [b.x + L - .08, cy + w2], [b.x + L * .45, cy + w2]]).map(([x, y]) => [ISO.wx(x, y), ISO.wy(x, y) - 24]); c.beginPath(); pts.forEach((z, i) => i ? c.lineTo(z[0], z[1]) : c.moveTo(z[0], z[1])); c.closePath(); c.fillStyle = '#ffc2d4'; c.fill(); c.strokeStyle = ART.OUT; c.lineWidth = 1; c.stroke(); }
      c.font = '14px sans-serif'; for (let i = 0; i < 3; i++) { const k = ((T * .6 + i / 3) % 1); c.globalAlpha = 1 - k; c.fillText('z', bx + 14 + k * 16, by - 44 - k * 30 - i * 2); } c.globalAlpha = 1;
      return;
    }
    if (act && HOME_ACTS[act.k].hide) return;
    const [vdir, vface] = VIEW.df(me.dir || 1, me.face || 0);
    c.save(); c.translate(sx, sy); if (act && act.k === 'rest') c.translate(0, 6); c.scale(vdir < 0 ? -1 : 1, 1); ART.human(c, CFG.look, vface, act ? T * 2 : me.t, act ? ['cook', 'laundry', 'water', 'piano'].includes(act.k) : me.moving, act ? (act.k === 'eat' || act.k === 'tv' || act.k === 'photo' ? 'happy' : 'calm') : me.happyT > 0 ? 'happy' : 'calm'); c.restore();
  }
  function drawAct() {
    if (!act) return;
    const it = act.it, q = HOME.fp(it), A = HOME_ACTS[act.k], ix = ISO.wx(it.x + q.w / 2, it.y + q.d / 2), iy = ISO.wy(it.x + q.w / 2, it.y + q.d / 2);
    const hide = A.hide, bx = hide ? ix : ISO.wx(me.x, me.y), by = hide ? iy - 70 : ISO.wy(me.x, me.y) - 84;
    // item-side effects
    if (act.k === 'cook') for (let i = 0; i < 3; i++) { const k = (T * .8 + i / 3) % 1; c.globalAlpha = 1 - k; ART.ell(c, ix - 6 + i * 6 + Math.sin(T * 3 + i) * 3, iy - 46 - k * 30, 5 + k * 5, 4 + k * 4, 'rgba(255,255,255,.9)'); c.globalAlpha = 1; }
    if (act.k === 'cook' || act.k === 'eat') { c.font = '16px sans-serif'; c.textAlign = 'center'; c.fillText(act.dish || A.e, ix, iy - (act.k === 'eat' ? 36 : 44) + (act.k === 'cook' ? -Math.abs(Math.sin(T * 6)) * 6 : 0)); c.textAlign = 'start'; }
    if (act.k === 'eat' && Math.sin(T * 8) > 0) { c.font = 'bold 10px sans-serif'; c.fillStyle = '#e0604e'; c.fillText(t('nyam'), bx + 12, by + 30); }
    if (act.k === 'shower') for (let i = 0; i < 6; i++) ART.ell(c, ix - 14 + (i * 7) % 28 + Math.sin(T * 2 + i) * 3, iy - 30 - ((T * 25 + i * 13) % 40), 4, 4, 'rgba(255,255,255,.7)', 'rgba(150,200,240,.8)', 1);
    if (act.k === 'toilet') { c.font = '11px sans-serif'; c.textAlign = 'center'; c.fillText(Math.sin(T * 2) > 0 ? '🎶' : '📱', ix + 16, iy - 40); c.textAlign = 'start'; }
    if (act.k === 'tv') { const g = c.createRadialGradient(ix, iy - 30, 2, ix, iy - 30, 50); g.addColorStop(0, `rgba(160,210,255,${.3 + .2 * Math.sin(T * 9)})`); g.addColorStop(1, 'rgba(160,210,255,0)'); c.fillStyle = g; c.fillRect(ix - 50, iy - 80, 100, 100); }
    if (act.k === 'piano' || act.k === 'music') { c.font = '12px sans-serif'; c.fillStyle = '#b56cd9'; for (let i = 0; i < 3; i++) { const k = (T * .7 + i / 3) % 1; c.globalAlpha = 1 - k; c.fillText(i % 2 ? '♪' : '♫', ix - 10 + i * 10, iy - 50 - k * 30); } c.globalAlpha = 1; }
    if (act.k === 'water') { c.font = '12px sans-serif'; c.fillText('💧', ix + Math.sin(T * 5) * 4, iy - 40 - ((T * 30) % 14)); }
    // progress bubble
    const p = Math.min(1, act.t / act.dur);
    c.save(); c.translate(bx, by); ART.ell(c, 0, 0, 15, 15, 'rgba(255,255,255,.95)', 'rgba(60,38,25,.5)', 1.2);
    c.beginPath(); c.arc(0, 0, 17, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2); c.lineWidth = 3; c.strokeStyle = '#6cc070'; c.stroke();
    c.font = '15px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(act.k === 'cook' || act.k === 'eat' ? (act.dish || A.e) : A.e, 0, 1); c.restore();
    c.textAlign = 'start'; c.textBaseline = 'alphabetic';
  }
  function startAct(k, it, extra) {
    const A = HOME_ACTS[k]; act = Object.assign({ k, it, t: 0, dur: A.dur }, extra || {});
    me.path = []; me.cb = null; SND.pop();
    if (k === 'petfeed') for (const a of pets.values()) { if (aquatic(a.p)) continue; a.sleep = 0; goTo(a, it.x + (Math.random() < .5 ? 1 : 0), it.y + 1, () => { a.happyT = 3; }); }
    render();
  }
  function finishAct() {
    const a = act; act = null;
    const t2 = a.k === 'cook' ? 'hcook' : a.k === 'eat' ? 'heat' : 'hact';
    const r = actR({ t: t2, a: a.k, r: a.r });
    if (r && r.ok) { me.happyT = 2; for (let i = 0; i < 3; i++) hearts.push({ x: ISO.wx(me.x, me.y) + (i - 1) * 8, y: ISO.wy(me.x, me.y) - 70, t: -i * .12 }); }
    render();
  }
  function drawPet(a) {
    const p = a.p, sx = ISO.wx(a.x, a.y), sy = ISO.wy(a.x, a.y), sz = p.grow != null ? .36 + .64 * G.ageOf(p) : 1;
    const [vdir] = VIEW.df(a.dir || 1, a.face || 0);
    if (a.bowl) { // a small round glass bowl on the floor with the fish inside
      c.save(); c.translate(sx, sy);
      ART.ell(c, 0, 2, 15, 5, 'rgba(0,0,0,.12)'); ART.ell(c, 0, -12, 15, 14, 'rgba(190,230,255,.55)', 'rgba(90,150,200,.8)', 1.4); ART.ell(c, 0, -21, 11, 3.2, 'rgba(230,248,255,.8)', 'rgba(90,150,200,.7)', 1);
      c.save(); c.translate(0, -8); c.scale(.42 * sz, .42 * sz); ART.pet(c, p.sp, { seed: p.coat || ART.hashStr(p.id), mood: a.happyT > 0 ? 'love' : 'happy', age: 1, t: a.t, moving: true, dir: vdir, wear: p.wear }); c.restore();
      ART.ell(c, -6, -18, 3, 5, 'rgba(255,255,255,.55)'); c.restore();
      hits.push({ kind: 'pet', a, x0: sx - 18, x1: sx + 18, y0: sy - 30, y1: sy + 6 }); return;
    }
    if (a.tank) { // swimming inside the aquarium glass
      c.save(); c.translate(sx, sy - 26 + Math.sin(a.t * 1.3) * 2); c.scale(.45 * sz, .45 * sz);
      ART.pet(c, p.sp, { seed: p.coat || ART.hashStr(p.id), mood: a.happyT > 0 ? 'love' : 'happy', age: 1, t: a.t, moving: true, dir: vdir, wear: p.wear }); c.restore();
      if (a.happyT > .5 && Math.random() < .1) hearts.push({ x: sx, y: sy - 50, t: 0 });
      hits.push({ kind: 'pet', a, x0: sx - 16, x1: sx + 16, y0: sy - 44, y1: sy - 10 }); return;
    }
    c.save(); c.translate(sx, sy - (a.sleep > 0 ? 6 : 0)); c.scale(sz, sz);
    ART.pet(c, p.sp, { seed: p.coat || ART.hashStr(p.id), mood: a.happyT > 0 ? 'love' : 'happy', age: p.grow != null ? G.ageOf(p) : 1, sleep: a.sleep > 0, happy: a.happyT > 0, t: a.t, moving: a.moving, dir: vdir, wear: p.wear });
    c.restore();
    if (a.happyT > .5 && Math.random() < .1) hearts.push({ x: sx, y: sy - 40, t: 0 });
    if (App.showNames || a.happyT > 0) { c.font = 'bold 10px sans-serif'; c.textAlign = 'center'; c.lineWidth = 3; c.strokeStyle = '#fff'; c.strokeText(p.name, sx, sy + 12); c.fillStyle = '#8a4a6a'; c.fillText(p.name, sx, sy + 12); c.textAlign = 'start'; }
    hits.push({ kind: 'pet', a, x0: sx - 22, x1: sx + 22, y0: sy - 50, y1: sy + 6 });
  }
  function frame(now) {
    requestAnimationFrame(frame);
    if (App.scene !== 'home' || !S || !S.home) return;
    const dt = Math.min(.05, (now - (last || now)) / 1000); last = now; T += dt;
    if (cv.clientWidth !== vw || cv.clientHeight !== vh) resize();
    const N = n(); VIEW.W = N; VIEW.H = N;
    buildOcc(); syncPets();
    if (napT > 0) { napT -= dt; if (napT <= 0) { const b = napAt; napAt = null; if (b) { me.x = Math.min(N - 1, b.x + HOME.fp(b).w) + .5; me.y = b.y + .5; if (!walk(Math.floor(me.x), Math.floor(me.y))) { const f = nearestFree(me.x, me.y); if (f) { me.x = f.x + .5; me.y = f.y + .5; } } } me.happyT = 2; render(); } }
    else if (act) { act.t += dt; if (act.t >= act.dur) finishAct(); }
    else { step(me, dt); stepJoy(dt); }
    if (me.happyT > 0) me.happyT -= dt;
    if (me.moving) { stepT += dt; if (stepT > .32) { stepT = 0; SFX.step && SFX.step(); } }
    for (const a of pets.values()) petBrain(a, dt);
    const z = cam.uz || fitZ(); cam.z += (z - cam.z) * Math.min(1, dt * 6);
    if (!cam.free) { const tx = (ISO.wx(N / 2, N / 2) * 2 + ISO.wx(me.x, me.y)) / 3, ty = (ISO.wy(N / 2, N / 2) * 2 + ISO.wy(me.x, me.y)) / 3 - 34; cam.x += (tx - cam.x) * Math.min(1, dt * 3); cam.y += (ty - cam.y) * Math.min(1, dt * 3); }
    buildBg();
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    const g = c.createLinearGradient(0, 0, 0, vh); g.addColorStop(0, '#f7e3ea'); g.addColorStop(1, '#fbeede'); c.fillStyle = g; c.fillRect(0, 0, vw, vh);
    c.setTransform(dpr * cam.z, 0, 0, dpr * cam.z, dpr * (vw / 2 - cam.x * cam.z), dpr * (vh / 2 - cam.y * cam.z));
    c.drawImage(bg, bg.ox, bg.oy, bg.width / bg.k, bg.height / bg.k);
    if (App.editing) drawGrid();
    hits = [];
    const hh = h(), list = [];
    for (const it of floorItems()) { const q = HOME.fp(it); if (q.flat) drawItem(it); else { const vr = VIEW.rect(it.x, it.y, q.w, q.d); list.push({ d: vr.x + vr.w + vr.y + vr.d - 1.02, it }); } }
    for (const a of pets.values()) { if ((a.fl || 0) !== curFloor) continue; if (a.tank) { const tq = HOME.fp(a.tank), vr = VIEW.rect(a.tank.x, a.tank.y, tq.w, tq.d); list.push({ d: vr.x + vr.w + vr.y + vr.d - 1.01, a }); } else { const q = VIEW.p(a.x, a.y); list.push({ d: q[0] + q[1], a }); } }
    { const q = VIEW.p(me.x, me.y); list.push({ d: napT > 0 && napAt ? (() => { const f = HOME.fp(napAt), vr = VIEW.rect(napAt.x, napAt.y, f.w, f.d); return vr.x + vr.w + vr.y + vr.d - 1; })() : q[0] + q[1], me: 1 }); }
    list.sort((p, q) => p.d - q.d);
    for (const e of list) e.it ? drawItem(e.it) : e.a ? drawPet(e.a) : drawMe();
    drawAct();
    // door label (ground floor only — upper floors are reached via the floor switcher, not a walkable door)
    if (curFloor === 0) { const dx = ISO.wx(N + .5, N - 1.5), dy = ISO.wy(N + .5, N - 1.5); c.font = 'bold 10px sans-serif'; c.textAlign = 'center'; const tx = '🚪 ' + t('homeExit'), w = c.measureText(tx).width + 12; ART.rrect(c, dx - w / 2, dy - 30 - Math.abs(Math.sin(T * 2)) * 2, w, 16, 7); c.fillStyle = 'rgba(255,255,255,.92)'; c.fill(); c.fillStyle = '#9a5a3a'; c.fillText(tx, dx, dy - 19 - Math.abs(Math.sin(T * 2)) * 2); c.textAlign = 'start'; hits.push({ kind: 'door', x0: dx - 40, x1: dx + 40, y0: dy - 40, y1: dy + 16 }); }
    for (let i = hearts.length - 1; i >= 0; i--) { const q = hearts[i]; q.t += dt; if (q.t > 1.2) { hearts.splice(i, 1); continue; } c.globalAlpha = 1 - q.t / 1.2; c.font = '12px sans-serif'; c.fillStyle = '#ff6a9a'; c.fillText('♥', q.x + Math.sin(q.t * 6) * 4, q.y - q.t * 30); }
    c.globalAlpha = 1;
    if (S.clock) { const m = S.clock.m, ph = S.clock.ph; let col = null, a = 0;
      if (ph === 'closed') { col = '20,30,80'; a = .32; } else if (m < 8 * 60) { col = '255,200,150'; a = .1; } else if (m > 19 * 60) { col = '40,40,110'; a = .24; } else if (m > 16 * 60) { col = '255,140,60'; a = Math.min(.18, (m - 960) / 120 * .18); }
      if (col) { c.save(); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.fillStyle = `rgba(${col},${a})`; c.fillRect(0, 0, vw, vh); c.restore();
        if (ph === 'closed' || m > 17 * 60) { c.save(); c.globalCompositeOperation = 'lighter'; for (const it of hh.items) { const L = FURN.LIGHT[it.k]; if (!L) continue; const q = HOME.fp(it), big = L.length > 1, g0 = L[big ? 1 : 0], x = ISO.wx(it.x + q.w / 2, it.y + q.d / 2), y = ISO.wy(it.x + q.w / 2, it.y + q.d / 2) - g0[2], r = g0[3] * (big ? 1.5 : 1), cl = g0[5] || '255,210,120'; const g = c.createRadialGradient(x, y, 2, x, y, r); g.addColorStop(0, `rgba(${cl},${g0[4] * 1.2})`); g.addColorStop(1, `rgba(${cl},0)`); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); } c.restore(); } } }
    if (napT > 0) { c.setTransform(dpr, 0, 0, dpr, 0, 0); c.fillStyle = `rgba(30,20,60,${Math.min(.45, Math.min(napT, 3.5 - napT) * .5)})`; c.fillRect(0, 0, vw, vh); }
    hits.reverse();
  }
  // ---- input ----
  const ptrs = new Map(); let drag = null, pinch = null;
  const toGrid = (sx, sy) => { const wx = (sx - vw / 2) / cam.z + cam.x, wy = (sy - vh / 2) / cam.z + cam.y; const vx = (wx / (TW / 2) + wy / (TH / 2)) / 2, vy = (wy / (TH / 2) - wx / (TW / 2)) / 2; const q = VIEW.inv(vx, vy); return { x: q[0], y: q[1], wx, wy }; };
  function itemAt(gx, gy) { let best = null; for (const it of floorItems()) { const q = HOME.fp(it); if (gx >= it.x && gx < it.x + q.w && gy >= it.y && gy < it.y + q.d) { if (!best || HOME.fp(best).flat) best = it; } } return best; }
  function originFor(it, gx, gy) {
    const q = HOME.fp(it); if (!VIEW.r) return [gx, gy]; const tv = VIEW.rect(gx, gy, 1, 1);
    for (let dx = -4; dx <= 4; dx++) for (let dy = -4; dy <= 4; dy++) { const r = VIEW.rect(gx + dx, gy + dy, q.w, q.d); if (Math.abs(r.x - tv.x) < .01 && Math.abs(r.y - tv.y) < .01) return [gx + dx, gy + dy]; }
    return [gx, gy];
  }
  function tap(x, y) {
    if (napT > 0 || act) return;
    const g = toGrid(x, y), gx = Math.floor(g.x), gy = Math.floor(g.y), inb = q => g.wx >= q.x0 && g.wx <= q.x1 && g.wy >= q.y0 && g.wy <= q.y1;
    const foot = itemAt(gx, gy);
    if (App.editing) {
      const hitIt = (foot && !HOME.fp(foot).flat ? foot : null) || (hits.find(q => q.kind === 'item' && inb(q)) || {}).item || foot;
      if (sel == null) { if (hitIt) { sel = hitIt.id; SND.pop(); render(); } return; }
      if (hitIt && hitIt.id !== sel && (foot === hitIt) && !HOME.fp(hitIt).flat) { sel = hitIt.id; SND.pop(); render(); return; }
      const it = h().items.find(z => z.id === sel); if (!it) { sel = null; render(); return; }
      const N = n(); if (gx < 0 || gy < 0 || gx >= N || gy >= N) { if (hitIt && hitIt.id !== sel) { sel = hitIt.id; render(); } return; }
      const [ox, oy] = originFor(it, gx, gy);
      const r = actR({ t: 'hmove', id: sel, x: ox, y: oy }); if (r && r.ok) { sel = null; } render(); return;
    }
    cam.free = false;
    const hit = hits.find(q => q.kind !== 'item' && inb(q)) || (foot && !HOME.fp(foot).flat ? { kind: 'item', item: foot } : null) || hits.find(q => q.kind === 'item' && inb(q));
    if (hit) {
      if (hit.kind === 'door') { goTo(me, DOORX(), DOORY(), () => leave()); return; }
      if (hit.kind === 'pet') { const a = hit.a; goTo(me, Math.floor(a.x) + 1, Math.floor(a.y), () => { a.happyT = 2.5; a.sleep = 0; a.path = []; a.idle = 2.5; me.happyT = 1.5; SND.love(); for (let i = 0; i < 4; i++) hearts.push({ x: ISO.wx(a.x, a.y) + (i - 1.5) * 8, y: ISO.wy(a.x, a.y) - 36, t: -i * .12 }); window.act({ t: 'hpat', pid: a.p.id }); }); return; } // v9.81: `act` here is Home's own current-activity variable (null) -- call the global action dispatcher
      if (hit.kind === 'item') { const it = hit.item; walkNear(it, () => useItem(it)); return; }
    }
    const atDoor = curFloor === 0 && gx === DOORX() && gy === DOORY();
    if (walk(gx, gy) || atDoor) goTo(me, gx, gy, atDoor ? () => leave() : null);
    else goTo(me, gx, gy);
  }
  function useItem(it) {
    if (HOME_BEDS.includes(it.k)) {
      const r = actR({ t: 'hnap' });
      if (r && r.ok) { napT = 3.5; napAt = it; SND.love(); }
      return;
    }
    const k = homeActOf(it.k);
    if (k === 'dress') { actR({ t: 'hact', a: 'dress' }); openPanel({ type: 'welcome', step: 'edit' }); return; }
    if (k === 'cook') { openPanel({ type: 'hcook', iid: it.id }); return; }
    if (k === 'eat') { const R = availDish(S.home); if (!R) { toast('🍽️ ' + t('noDishHint')); return; } startAct('eat', it, { r: R.id, dish: R.e }); return; }
    if (k) { startAct(k, it); return; }
    const fl = { x_balloon: '🎈', h_frame: '💑', h_petbed: '🐾', aquarium: '🐠', fridge: '🧃', cafe: '☕', y_teddy: '🧸', y_piggy: '🐷', y_crib: '👶', y_fan: '🌀', y_aircon: '❄️', y_globe: '🌍', y_clock: '🕰️', y_espresso: '☕', y_cattower: '🐱', y_dogtent: '🐶', y_toybox: '🎾', x_gacha: '🎰', x_vending: '🥤' }[it.k];
    if (fl) { toast(fl + ' ' + t('huse_' + it.k)); me.happyT = 1.5; SND.pop(); }
  }

  function onDown(e) { cv.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (ptrs.size === 1) drag = { x: e.clientX, y: e.clientY, cx: cam.x, cy: cam.y, moved: false }; if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), z: cam.z }; drag = null; } }
  function onMove(e) {
    if (!ptrs.has(e.pointerId)) return; ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch && ptrs.size === 2) { const [a, b] = [...ptrs.values()]; cam.uz = cam.z = Math.max(.4, Math.min(1.8, pinch.z * Math.hypot(a.x - b.x, a.y - b.y) / pinch.d)); return; }
    if (drag) { const dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (Math.hypot(dx, dy) > 10) { drag.moved = true; cam.free = true; } if (drag.moved) { cam.x = drag.cx - dx / cam.z; cam.y = drag.cy - dy / cam.z; } }
  }
  function onUp(e) { ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch = null; if (drag && !drag.moved && ptrs.size === 0) { const r = cv.getBoundingClientRect(); tap(e.clientX - r.left, e.clientY - r.top); } if (ptrs.size === 0) drag = null; }

  // ---- enter / leave ----
  function init() {
    cv = document.createElement('canvas'); cv.id = 'hcv'; document.body.insertBefore(cv, document.getElementById('ui')); c = cv.getContext('2d');
    cv.addEventListener('pointerdown', onDown); cv.addEventListener('pointermove', onMove); cv.addEventListener('pointerup', onUp); cv.addEventListener('pointercancel', onUp);
    cv.addEventListener('wheel', e => { cam.uz = cam.z = Math.max(.4, Math.min(1.8, cam.z * (e.deltaY > 0 ? .9 : 1.1))); e.preventDefault(); }, { passive: false });
    addEventListener('resize', () => { if (App.scene === 'home') resize(); });
    requestAnimationFrame(frame);
  }
  function enter() {
    if (!S) return;
    if (App.carry) { toast(t('carryBusy')); return; }
    HOME.ensure(S);
    App.scene = 'home'; App.editing = false; sel = null; napT = 0; napAt = null; curFloor = 0;
    cv.style.display = 'block'; resize();
    const N = n(); me = { x: N - .5, y: N - 1.5, dir: -1, face: 1, path: [], t: 0, speed: 4.75, happyT: 0 };
    buildOcc(); goTo(me, N - 2, N - 2);
    cam.uz = null; cam.free = false; cam.z = fitZ(); cam.x = ISO.wx(N / 2, N / 2); cam.y = ISO.wy(N / 2, N / 2) - 34; bgKey = '';
    pets.clear(); World.joy.dx = World.joy.dy = 0;
    closePanel(); SND.pop(); render();
    toast('🏠 ' + t('homeWelcome'));
  }
  function leave() {
    if (App.scene !== 'home') return;
    App.scene = 'shop'; App.editing = false; sel = null; napT = 0; cv.style.display = 'none';
    const wm = World.me;
    if (wm) {
      const hp = FURN.HOME_POS(S.room.w, S.room.h, (S.home && S.home.lv) || 1);
      wm.x = hp.x + hp.w / 2;
      wm.y = hp.y + hp.d + 1.6;
      wm.path = [];
      wm.cb = null;
      wm.dir = 1;
      wm.face = 0;
    }
    if (typeof World !== 'undefined') {
      World.homeCooldown = 2.5;
      World.joy.dx = World.joy.dy = 0;
      World.center();
    }
    closePanel();
    SND.pop();
    render();
  }
  function goHome() {
    if (App.carry) { toast(t('carryBusy')); return; }
    if (!LAY('home')) { toast(t('tNeedHome')); openPanel({ type: 'tbuild', tab: 'big' }); return; } // PET TOWN
    const hp = FURN.HOME_POS(S.room.w, S.room.h, (S.home && S.home.lv) || 1);
    World.goTo(World.me, hp.x + hp.w / 2, hp.y + hp.d + 0.6, () => enter());
  }
  function onBought(id) { App.editing = true; sel = id; closePanel(); toast(t('placeHint')); render(); }

  // ---- HUD ----
  function hud() {
    const hh = HOME.ensure(S), need = xpNeed(S.level), pct = S.level >= MAX_LEVEL ? 100 : Math.min(100, S.xp / need * 100), selIt = sel != null ? hh.items.find(z => z.id === sel) : null;
    const napDone = hh.nap === (S.clock ? S.clock.day : 0);
    return `<div class="hud"><div class="me"><button class="avatar" data-a="open" data-v="settings"><img src="${PIC.human(CFG.look)}"><span class="lvstar">${S.level}</span></button>
      <div class="mebars"><div class="name">🏠 ${t('myHome')} Lv${hh.lv}</div><div class="bar"><i style="width:${pct.toFixed(1)}%"></i><span>${S.level >= MAX_LEVEL ? '👑 MAX' : fmt(S.xp) + ' / ' + fmt(need)}</span></div><div class="name">${esc(CFG.name)}</div></div></div><div class="spacer"></div>
      <div class="money"><div class="pillw">🪙<b>${fmt(S.coins)}</b></div></div></div>
      ${clockHTML()}
      <div class="evchips"><span>🛋️ ${t('homeBonus', { n: HOME.pts(S) })}</span><span>${napDone ? '😴 ' + t('napDoneChip') : '💤 ' + t('napReadyChip')}</span><span data-a="hpanel" data-v="life" style="pointer-events:auto">📋 ${(() => { const td = hh.today && hh.today.d === (S.clock ? S.clock.day : 0) ? hh.today : { done: {} }; return Math.min(HOME_DAILY_GOAL, Object.keys(td.done).length) + '/' + HOME_DAILY_GOAL; })()}</span></div>
      ${HOME.floorsOf(hh) > 1 ? `<div class="floorbar">${Array.from({ length: HOME.floorsOf(hh) }, (_, i) => HOME.floorsOf(hh) - 1 - i).map(i => `<button class="${curFloor === i ? 'on' : ''}" data-a="hfloor" data-v="${i}">${FLOOR_NAMES[i]}</button>`).join('')}</div>` : ''}
      <div class="side">
        <button class="rbtn" data-a="hpanel" data-v="life">📋<small>${t('homeLife')}</small></button>
        <button class="rbtn" data-a="hpanel" data-v="furn">🛋️<small>${t('homeFurn')}</small></button>
        <button class="rbtn" data-a="hpanel" data-v="style">🎨<small>${t('homeStyle')}</small></button>
        <button class="rbtn" data-a="hpanel" data-v="up">⬆️<small>${t('homeUp')}</small></button>
        <button class="rbtn" data-a="hpanel" data-v="pets">🐾<small>${t('homePets')}</small></button>
        <button class="rbtn" data-a="open" data-v="settings">⚙️<small>${t('settings')}</small></button>
      </div>
      ${App.editing ? `<div class="editbar"><div class="grow">🔨 ${selIt ? t('hf_' + selIt.k) + ' · ' + t('placeHint') : t('editHint')}</div>
        ${selIt ? `<button class="btn g sm" data-a="hflip">🔄 ${t('rotateBtn')}</button><button class="btn r sm" data-a="hsell">🗑️ ${fmt(Math.floor(((HOME_FURN.find(z => z.k === selIt.k) || {}).cost || 0) / 2))}</button>` : `<button class="btn o sm" data-a="hpanel" data-v="furn">🛋️ ${t('homeFurn')}</button>`}
        <button class="btn sm" data-a="hdone">✓ ${t('done')}</button></div>`
        : `<div class="left"><button class="bigbtn" data-a="hleave">🏪<small>${t('toShop')}</small></button><button class="bigbtn green" data-a="hedit">🔨<small>${t('decorate')}</small></button></div>`}
      <div class="rotbtns"><button data-a="rot" data-v="1" aria-label="rotate left">⟲</button><button data-a="rot" data-v="-1" aria-label="rotate right">⟳</button></div>
      ${S.customers.length ? `<div class="custbar">🛎️ ${t('customers')} ${S.customers.length}</div>` : ''}
      ${!App.editing && typeof onlineChip === 'function' ? onlineChip() : ''}
      ${!App.editing ? `<div class="joy" id="joy"><i></i></div>` : ''}`;
  }
  function setFloor(fl) {
    const hh = h(); if (!hh) return; const max = HOME.floorsOf(hh) - 1;
    fl = Math.max(0, Math.min(max, fl | 0)); if (fl === curFloor) return;
    curFloor = fl; sel = null; App.editing = false; act = null;
    buildOcc();
    const N = n(), start = curFloor === 0 ? { x: N - 2, y: N - 2 } : (nearestFree(N / 2, N / 2) || { x: 1, y: 1 });
    me.x = start.x + .5; me.y = start.y + .5; me.path = []; me.cb = null; me.moving = false;
    SND.pop(); render();
  }
  const startById = (k, iid, extra) => { const it = S.home.items.find(z => z.id === iid); if (!it) return; if ((it.fl || 0) !== curFloor) setFloor(it.fl || 0); walkNear(it, () => startAct(k, it, extra)); };
  return { _pets: () => pets, _use: it => walkNear(it, () => useItem(it)), startById, init, enter, leave, goHome, hud, onBought, setFloor, get sel() { return sel; }, set sel(v) { sel = v; }, get me() { return me; }, get napping() { return napT > 0; }, get floor() { return curFloor; } };
})();

// ---- panels & actions ----
const HOME_THUMB = new Map();
function homeThumb(k) {
  if (HOME_THUMB.has(k)) return HOME_THUMB.get(k);
  const d = FURN.DEF[k] || { w: 1, d: 1 }, big = document.createElement('canvas'); big.width = 400; big.height = 400; const bc = big.getContext('2d'); bc.translate(200 - ISO.sx(d.w, d.d) / 2 * 2, 280 - ISO.sy(d.w, d.d)); bc.scale(2, 2);
  const vr = VIEW.r; VIEW.r = 0; try { FURN.item(bc, k, 1); } catch (e) { } VIEW.r = vr;
  let bx0 = 0, by0 = 0, bx1 = 400, by1 = 400;
  try { const im = bc.getImageData(0, 0, 400, 400).data; bx0 = 400; by0 = 400; bx1 = 0; by1 = 0; for (let y = 0; y < 400; y += 2) for (let x = 0; x < 400; x += 2) if (im[(y * 400 + x) * 4 + 3] > 10) { if (x < bx0) bx0 = x; if (x > bx1) bx1 = x; if (y < by0) by0 = y; if (y > by1) by1 = y; } if (bx1 <= bx0) { bx0 = 0; by0 = 0; bx1 = 400; by1 = 400; } } catch (e) { }
  const cv = document.createElement('canvas'); cv.width = 180; cv.height = 180; const c = cv.getContext('2d'); const bw = bx1 - bx0 + 8, bh = by1 - by0 + 8, sc = Math.min(170 / bw, 170 / bh, 1.6);
  c.drawImage(big, bx0 - 4, by0 - 4, bw, bh, 90 - bw * sc / 2, 90 - bh * sc / 2, bw * sc, bh * sc);
  let url = ''; try { url = cv.toDataURL(); } catch (e) { } HOME_THUMB.set(k, url); return url;
}
PANELS.home = m => {
  const hh = HOME.ensure(S), tab = m.tab || 'furn';
  const tabs = ['life', 'furn', 'style', 'up', 'pets'].map(k => `<button class="tab ${tab === k ? 'on' : ''}" data-a="hpanel" data-v="${k}">${{ life: '📋', furn: '🛋️', style: '🎨', up: '⬆️', pets: '🐾' }[k]} ${t({ life: 'homeLife', furn: 'homeFurn', style: 'homeStyle', up: 'homeUp', pets: 'homePets' }[k])}</button>`).join('');
  let b = `<div class="tabs">${tabs}</div>`;
  if (tab === 'life') b += lifeHTML();
  else if (tab === 'furn') {
    const fc = m.fcat || 'all';
    b += `<div class="m">${t('homeFurnDesc')} · ${t('homeBonus', { n: HOME.pts(S) })}</div>`;
    if (HOME.floorsOf(hh) > 1) b += `<div class="m">${t('buyOnFloor')}</div><div class="tabs">${Array.from({ length: HOME.floorsOf(hh) }, (_, i) => i).map(i => `<button class="${Home.floor === i ? 'on' : ''}" data-a="hfloor" data-v="${i}">${FLOOR_NAMES[i]}</button>`).join('')}</div>`;
    b += `<div class="tabs">${['all', 'bed', 'living', 'kitchen', 'deco', 'light', 'pet'].map(k => `<button class="${fc === k ? 'on' : ''}" data-a="hfcat" data-v="${k}">${{ all: '✨', bed: '🛏️', living: '🛋️', kitchen: '🍳', deco: '🌷', light: '💡', pet: '🐾' }[k]} ${t('hc_' + k)}</button>`).join('')}</div><div class="grid3">`;
    for (const F of HOME_FURN.filter(F => fc === 'all' || F.cat === fc)) {
      const lock = F.hl > hh.lv, cnt = hh.items.filter(z => z.k === F.k).length;
      b += `<button class="tile ${lock || S.coins < F.cost ? 'dis' : ''}" data-a="hbuy" data-v="${F.k}"><img src="${homeThumb(F.k)}" style="width:64px;height:64px;object-fit:contain"><div class="m"><b>${t('hf_' + F.k)}</b></div><div class="m">${lock ? '🔒 ' + t('homeLvN', { n: F.hl }) : '🪙 ' + fmt(F.cost)}${cnt ? ' · ✓' + cnt : ''}</div><div class="m">+${F.pts}⭐</div></button>`;
    }
    b += '</div>';
  } else if (tab === 'style') {
    for (const type of ['floor', 'wall']) {
      b += `<div class="t" style="margin-top:10px">${t(type === 'floor' ? 'floorSec' : 'wallSec')}</div><div class="grid3">`;
      STYLES.filter(x => x.type === type).forEach(st => {
        const own = !st.cost || S.styles[type + ':' + st.id] || (type === 'floor' && st.id === 'oak') || (type === 'wall' && st.id === 'pink'), on = hh[type] === st.id;
        const col = type === 'floor' ? FURN.FLOORS[st.id][0] : FURN.WALLS[st.id][0], col2 = type === 'floor' ? FURN.FLOORS[st.id][1] : FURN.WALLS[st.id][1];
        b += `<button class="tile ${on ? 'sel' : ''}" data-a="hstyle" data-v="${st.id}" data-w="${type}"><div style="width:54px;height:40px;border-radius:8px;background:repeating-linear-gradient(45deg,${col} 0 8px,${col2} 8px 16px);border:2px solid #cfae7c"></div>
          <div class="m">${t('st_' + type + '_' + st.id)}</div><div class="m">${on ? '✓' : own ? t('owned') : '🪙 ' + st.cost}</div></button>`;
      });
      b += '</div>';
    }
    b += `<div class="m">${t('homeStyleShared')}</div>`;
  } else if (tab === 'up') {
    const L = HOME_LV[hh.lv], nx = HOME_LV[hh.lv + 1], ICONS = ['🛖', '🏠', '🏡', '🏘️', '🏰', '🏯', '🏛️', '🏰', '👑', '💎'];
    b += `<div class="card"><div class="row" style="flex-wrap:wrap">${HOME_LV.slice(1).map((_, i) => `<div class="hlv ${i + 1 <= hh.lv ? 'on' : ''}">${ICONS[i] || '🏰'}<small>Lv${i + 1}</small></div>`).join('')}</div>
      <div class="t">🏠 ${t('myHome')} Lv${hh.lv} · ${t('hname_' + hh.lv)}</div><div class="m">📐 ${L.w}×${L.w} · 🏢 ${L.floors}F · 🐾 ${t('homePetCap', { n: L.pets })} · 🛋️ ${t('homeBonus', { n: HOME.pts(S) })}</div></div>`;
    if (nx) {
      const lock = S.level < nx.ulv;
      b += `<div class="card"><div class="t">⬆️ Lv${hh.lv + 1} · ${t('hname_' + (hh.lv + 1))}</div><div class="m">📐 ${L.w}×${L.w} → <b>${nx.w}×${nx.w}</b> · 🐾 ${L.pets} → <b>${nx.pets}</b>${nx.floors > L.floors ? ` · 🏢 <b>+1F ✨</b>` : ''}</div>
        <div class="m">✨ ${t('homeUpPerks')}${HOME_FURN.filter(F => F.hl === hh.lv + 1).map(F => ' · ' + t('hf_' + F.k)).join('')}</div>
        ${lock ? `<div class="m">🔒 ${t('unlockAt', { n: nx.ulv })}</div>` : `<button class="btn o block ${S.coins < nx.cost ? 'dis' : ''}" data-a="hup">⬆️ ${t('homeUpBtn')} 🪙${fmt(nx.cost)}</button>`}</div>`;
    } else b += `<div class="m center">🏰 ${t('homeMax')}</div>`;
    b += `<div class="card"><div class="t">💤 ${t('napTitle')}</div><div class="m">${t('napDesc')}</div></div>`;
  } else {
    const capN = HOME.cap(hh);
    b += `<div class="m">${t('homePetsDesc', { n: hh.pets.length, m: capN })}</div>`;
    b += hh.pets.map(p => `<div class="li"><div class="ic"><img src="${PIC.my(p)}"></div><div class="grow"><div class="t">${esc(p.name)} <span class="sex ${p.sex}">${p.sex === 'm' ? '♂' : '♀'}</span></div><div class="m">${esc(spName(p.sp))} · 🏠 ${t('atHome')}</div></div><button class="btn o sm" data-a="wearpick" data-v="${p.id}">👕${p.wear && (p.wear.collar || p.wear.hat || p.wear.cloth) ? ' ' + [p.wear.cloth, p.wear.collar, p.wear.hat].filter(Boolean).map(w => w.icon).join('') : ''}</button>${['fish', 'axolotl'].includes(ART.look(p.sp).t) ? '' : `<button class="btn ${(S.follow || {})[CFG.id] === p.id ? 'r' : ''} sm" data-a="hfollow" data-v="${p.id}">${(S.follow || {})[CFG.id] === p.id ? t('followStop') : t('followBtn')}</button>`}<button class="btn g sm" data-a="hback" data-v="${p.id}">🏪 ${t('sendBack')}</button></div>`).join('');
    const shop = S.pets.filter(Boolean);
    if (shop.length) b += `<div class="t" style="margin-top:10px">🏪 ${t('shopPets')}</div>` + shop.map(p => `<div class="li"><div class="ic"><img src="${PIC.my(p)}"></div><div class="grow"><div class="t">${esc(p.name)} <span class="sex ${p.sex}">${p.sex === 'm' ? '♂' : '♀'}</span></div><div class="m">${esc(spName(p.sp))} · Lv${p.lv || 1}</div></div><button class="btn o sm ${hh.pets.length >= capN ? 'dis' : ''}" data-a="htake" data-v="${p.id}">🏠 ${t('takeHome')}</button></div>`).join('');
    else b += `<div class="m">${t('noShopPets')}</div>`;
  }
  return frameHTML('🏠 ' + t('myHome'), b);
};
PANELS.hcook = m => {
  const hh = HOME.ensure(S), ds = hh.dishes || {};
  return frameHTML('🍳 ' + t('cookTitle'), `<div class="m">${t('cookDesc')}</div>` + HOME_RECIPES.map(R => { const lock = R.hl && hh.lv < R.hl; return `<button class="li ${lock || S.coins < R.cost ? 'dis' : ''}" data-a="hcookgo" data-v="${R.id}" data-w="${m.iid}"><div class="ic" style="font-size:30px">${R.e}</div><div class="grow"><div class="t">${t('rc_' + R.id)}${ds[R.id] ? ` <span class="m">· ${t('ownedN', { n: ds[R.id] })}</span>` : ''}</div><div class="m">${lock ? '🔒 ' + t('homeLvN', { n: R.hl }) : t(R.pet ? 'rcPet' : 'rcEat', { x: R.xp || 0 })}${R.rep ? ' · ⭐+' + R.rep : ''}</div></div><span class="m">🪙 ${R.cost}</span></button>`; }).join(''));
};
PANELS.heat = m => {
  const ds = (S.home && S.home.dishes) || {}, list = HOME_RECIPES.filter(R => !R.pet && ds[R.id] > 0);
  return frameHTML('🍽️ ' + t('eatTitle'), list.length ? `<div class="m">${t('eatDesc')}</div>` + list.map(R => `<button class="li" data-a="heatgo" data-v="${R.id}" data-w="${m.iid}"><div class="ic" style="font-size:30px">${R.e}</div><div class="grow"><div class="t">${t('rc_' + R.id)} <span class="m">×${ds[R.id]}</span></div><div class="m">${t('rcEat', { x: R.xp })}${R.rep ? ' · ⭐+' + R.rep : ''}</div></div>▶</button>`).join('') : `<div class="m">${t('noDishHint')}</div>`);
};
function lifeHTML() {
  const hh = HOME.ensure(S), day = S.clock ? S.clock.day : 0, td = hh.today && hh.today.d === day ? hh.today : { done: {} }, n = Object.keys(td.done).length, ds = hh.dishes || {};
  let b = `<div class="card"><div class="t">📋 ${t('lifeToday', { n: Math.min(n, HOME_DAILY_GOAL), m: HOME_DAILY_GOAL })}</div>${bar(Math.min(1, n / HOME_DAILY_GOAL) * 100, 'linear-gradient(#b8e89a,#5cae3c)', td.bonus ? '🎁 ' + t('lifeBonusGot') : n + ' / ' + HOME_DAILY_GOAL)}<div class="m">${t('lifeDesc')}</div></div>`;
  b += '<div class="grid3">' + Object.keys(HOME_ACTS).map(k => { const A = HOME_ACTS[k], own = hh.items.some(it => A.items.includes(it.k)), dn = td.done[k]; return `<div class="tile ${own ? '' : 'dis'}" data-a="hgoact" data-v="${k}" style="${dn ? 'border-color:#6cc070' : ''}"><div style="font-size:24px">${A.e}</div><div class="m"><b>${t('la_' + k)}</b></div><div class="m">${dn ? '✅' : own ? t('lifeGo') : '🛒 ' + t('hf_' + A.items[0])}</div></div>`; }).join('') + '</div>';
  const dl = HOME_RECIPES.filter(R => ds[R.id] > 0);
  b += `<div class="card"><div class="t">🍱 ${t('myDishes')}</div><div class="m">${dl.length ? dl.map(R => R.e + ' ' + t('rc_' + R.id) + ' ×' + ds[R.id]).join(' · ') : t('noDishHint')}</div></div>`;
  return b;
}
const HOME_ACT = {
  hpanel: v => openPanel({ type: 'home', tab: v }),
  hcookgo: (v, w) => { const R = HOME_RECIPES.find(x => x.id === v); if (!R) return; if (S.coins < R.cost) { toast(t('notEnough')); return; } if (R.hl && S.home.lv < R.hl) { toast(t('homeNeedLv', { n: R.hl })); return; } closePanel(); Home.startById('cook', +w, { r: v, dish: R.e }); },
  heatgo: (v, w) => { const R = HOME_RECIPES.find(x => x.id === v); if (!R) return; closePanel(); Home.startById('eat', +w, { r: v, dish: R.e }); },
  hgoact: v => {
    const A = HOME_ACTS[v]; if (!A) return;
    const hh = HOME.ensure(S), item = hh.items.find(it => A.items.includes(it.k));
    if (!item) { toast('🛒 ' + t('hf_' + A.items[0])); return; }
    closePanel();
    if (v === 'dress') { actR({ t: 'hact', a: 'dress' }); openPanel({ type: 'welcome', step: 'edit' }); return; }
    if (v === 'cook') { openPanel({ type: 'hcook', iid: item.id }); return; }
    if (v === 'eat') {
      const R = availDish(hh); if (!R) { toast('🍽️ ' + t('noDishHint')); return; }
      Home.startById('eat', item.id, { r: R.id, dish: R.e }); return;
    }
    Home.startById(v, item.id);
  },
  hbuy: v => { const r = actR({ t: 'hbuy', k: v, fl: Home.floor }); if (r && r.hplace != null) Home.onBought(r.hplace); },
  hfloor: v => Home.setFloor(+v),
  hstyle: (v, w) => act({ t: 'hstyle', id: v, st: w }),
  hup: () => { const r = actR({ t: 'hup' }); if (r && r.ok) { fxAt(innerWidth / 2, innerHeight / 2, '🏡'); } },
  htake: v => act({ t: 'htake', pid: v }),
  hback: v => act({ t: 'hback', pid: v }),
  hfollow: v => { const p = S.home.pets.find(q => q.id === v); if (!p) return; const on = (S.follow || {})[CFG.id] === v; actR({ t: 'follow', who: CFG.id, pid: on ? null : v }); toast(t(on ? 'followOff' : 'followOn', { n: p.name })); renderPanel(true); }, // v9.99: take a home pet along
  hedit: () => { App.editing = true; Home.sel = null; SND.pop(); render(); },
  hdone: () => { App.editing = false; Home.sel = null; render(); },
  hfcat: v => { if (panel && panel.fcat !== v) openPanel(Object.assign({}, panel, { fcat: v })); },
  dcat: v => { if (panel && panel.dcat !== v) openPanel(Object.assign({}, panel, { dcat: v })); },
  trashitem: () => { const id = World.editSel; if (typeof id !== 'number') return; const it = S.items.find(i => i.id === id); if (!it) return; const nm = it.k === 'hab' ? t('hm_' + (it.model || 'x')) : t('d_' + it.k); askPrompt({ title: '🗑️ ' + t('trashQ'), text: t('trashText', { n: nm }), okText: t('trashBtn'), cancel: t('no'), ok: () => { const r = actR({ t: 'trash', iid: id }); if (r && r.ok) World.editSel = null; World.buildOccNow && World.buildOccNow(); render(); } }); },
  rotitem: () => { if (typeof World.editSel === 'number') { actR({ t: 'rotate', iid: World.editSel }); render(); } },
  hflip: () => { if (Home.sel != null) { actR({ t: 'hflip', id: Home.sel }); render(); } },
  hsell: () => { const id = Home.sel; if (id == null) return; askPrompt({ title: t('homeSellQ'), okText: t('yes'), cancel: t('no'), ok: () => { actR({ t: 'hsell', id }); Home.sel = null; render(); } }); },
  hleave: () => Home.leave(),
  gohome: () => Home.goHome(),
};
