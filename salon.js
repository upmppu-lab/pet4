// ================= v9.99: pet grooming salon (west of the shop) =================
// Villagers bring their pets: they wait on the bench, a groomer (or the owner, by tapping the guest) takes the pet to a
// grooming table -> bath, dry, cut, bow -> the guest pays at the counter and walks home with a prettier pet.
// The salon can also groom every pet in the pet shop for a small fee (groomed pets sell for +20%).
const SALON_COST = 400000, SALON_GROOM_ALL = 80, SALON_STAFF_MAX = 2;
const SALON_POS = () => { const L = LAY('salon'); return L ? { x: L.x, y: L.y, w: 10, d: 8 } : { x: LAY_FAR, y: LAY_FAR, w: 10, d: 8 }; }; // PET TOWN: wherever the player built it
const SALON_SIGN = () => { const p = SALON_POS(); return { x: p.x + p.w + 1, y: p.y + p.d - 1 }; };
const SALON_STAFF = { id: 'groomer', icon: '✂️', hire: 900, wage: 60 };
const salonStaffRole = id => id === 'groomer' ? SALON_STAFF : null;
const salonStaffWage = lv => Math.round(SALON_STAFF.wage * (1 + .25 * ((lv || 1) - 1)) * (typeof BAL !== 'undefined' ? BAL.WAGE_K : 1));
const SALON_STAGES = [{ k: 'bath', icon: '🛁', t: 4 }, { k: 'dry', icon: '💨', t: 3 }, { k: 'cut', icon: '✂️', t: 4 }, { k: 'bow', icon: '🎀', t: 2 }];
const SALON_SPECIES = ['pomeranian', 'maltese', 'maltese_cream', 'maltese_brown', 'poodle', 'bichon', 'shiba', 'shiba_black', 'shiba_red', 'corgi', 'persian', 'ragdoll', 'samoyed', 'yorkie', 'shihtzu', 'hollandlop', 'kitten', 'golden', 'husky', 'munchkin'];
const SALON = (() => {
  // lot-local layout: two grooming tables along the back wall, a waiting bench on the west wall, the counter by the east entrance
  const TABLES = [{ u: 2, v: 1 }, { u: 5.5, v: 1 }], SEATS = [{ u: .65, v: 3.85 }, { u: .65, v: 4.95 }, { u: .65, v: 6.05 }, { u: 1.8, v: 6.6 }], COUNTER = { u: 7.4, v: 4.6 };
  const ensure = s => { const sl = s.salon = s.salon || {}; if (!sl.q) sl.q = []; if (!sl.staff) sl.staff = []; if (!sl.seq) sl.seq = 1; if (sl.spawnT == null) sl.spawnT = 8; if (sl.built && sl.bldSeq == null) sl.bldSeq = 1; return sl; };
  const built = () => !!(typeof S !== 'undefined' && S && S.salon && S.salon.built);
  const payOf = sp => 200 + Math.round(((SPECIES[sp] && SPECIES[sp].sell) || 600) * .3);
  // ---------------- core ----------------
  function tick(s, dt) {
    const sl = ensure(s); if (!sl.built) return;
    const open = G.isOpen(s);
    for (const c of sl.q) c.age = (c.age || 0) + dt;
    for (const c of sl.q.slice()) {
      if (c.ph === 'in' && (c.arr || c.age > 30)) { c.ph = 'wait'; c.wt = 0; }
      else if (c.ph === 'wait') { c.wt += dt; if (c.wt > 110) { c.ph = 'angry'; c.t = 0; sl.lost = (sl.lost | 0) + 1; TOWN.mood(s, -1.2, 'salon'); } }
      else if (c.ph === 'groom') { const m = c.by !== 'me' ? sl.staff.find(x => 'm' + x.id === c.by) : null, k = m ? 1 + .35 * (m.lv - 1) : 2.0; c.t -= dt * k;
        if (c.t <= 0) { c.stg++; if (c.stg >= SALON_STAGES.length) { c.ph = 'pay'; c.t = 0; if (m) { m.cid = null; m.done = (m.done | 0) + 1; } } else c.t = SALON_STAGES[c.stg].t; } }
      else if (c.ph === 'pay') { c.t += dt; if (c.t > 6 && !c.paid) { const pay = Math.round(payOf(c.sp) * (1 + .06 * sl.staff.reduce((a, m) => a + m.lv, 0))); s.coins += pay; c.paid = pay; sl.served = (sl.served | 0) + 1; if (s.today) s.today.earned = (s.today.earned || 0) + pay; } if (c.t > 9) { c.ph = 'out'; c.t = 0; } }
      else if (c.ph === 'out' || c.ph === 'angry') { c.t += dt; if (c.t > 120 || c.gone) sl.q = sl.q.filter(x => x !== c); }
    }
    // free groomers take the next waiting guest to a free table
    for (const m of sl.staff) {
      if (m.cid != null && !sl.q.some(c => c.id === m.cid && c.ph === 'groom')) m.cid = null;
      if (m.cid != null || !open && !sl.q.some(c => c.ph === 'wait')) continue;
      const c = sl.q.filter(x => x.ph === 'wait').sort((a, b) => b.wt - a.wt)[0], st = freeTable(sl); if (!c || st < 0) continue;
      start(sl, c, st, 'm' + m.id); m.cid = c.id;
    }
    if (!open) return;
    sl.spawnT -= dt;
    if (sl.spawnT <= 0 && sl.q.filter(c => c.ph !== 'out' && c.ph !== 'angry').length < SEATS.length) {
      const sp = SALON_SPECIES[Math.floor(Math.random() * SALON_SPECIES.length)];
      sl.q.push({ id: sl.seq++, seed: 1 + Math.floor(Math.random() * 1e6), sp, coat: 1 + Math.floor(Math.random() * 1e9), ph: 'in', age: 0, stg: 0 });
      sl.spawnT = 26 + Math.random() * 24;
    }
  }
  const freeTable = sl => { for (let i = 0; i < TABLES.length; i++) if (!sl.q.some(c => c.ph === 'groom' && c.st === i)) return i; return -1; };
  function start(sl, c, st, by) { c.ph = 'groom'; c.st = st; c.by = by; c.stg = 0; c.t = SALON_STAGES[0].t; }
  const wagesOf = sl => ((sl && sl.staff) || []).reduce((a, m) => a + salonStaffWage(m.lv), 0);
  function apply(s, a) {
    const sl = ensure(s);
    switch (a.t) {
      case 'buildsalon': { if (!(s.lay && s.lay.salon)) return { err: 'tUseBuildMenu' }; if (sl.built) return { err: 'gone' }; if (s.coins < SALON_COST) return { err: 'notEnough' }; s.coins -= SALON_COST; sl.built = s.clock ? s.clock.day : 1; sl.spawnT = 6; s.bldSeq = (s.bldSeq || 0) + 1; sl.bldSeq = s.bldSeq; return { ok: 1, fx: 'coin', msg: 'salonBuilt' }; }
      case 'salongroom': { const c = sl.q.find(x => x.id === a.cid); if (!c || c.ph !== 'wait') return { err: 'gone' }; const st = freeTable(sl); if (st < 0) return { err: 'salonBusy' }; start(sl, c, st, 'me'); return { ok: 1, msg: 'salonStart' }; }
      case 'salonhire': { if (!sl.built || sl.staff.length >= SALON_STAFF_MAX) return { err: 'gone' }; if (s.coins < SALON_STAFF.hire) return { err: 'notEnough' }; s.coins -= SALON_STAFF.hire; const L = (typeof NAMES !== 'undefined' && (NAMES[s.lang || 'ko'] || NAMES.ko)) || ['?']; sl.staff.push({ id: sl.seq++, role: 'groomer', lv: 1, seed: 1 + Math.floor(Math.random() * 99999), name: L[Math.floor(Math.random() * L.length)], done: 0 }); return { ok: 1, fx: 'coin', msg: 'hired' }; }
      case 'salonup': { const m = sl.staff.find(x => x.id === a.sid); if (!m || m.lv >= 10) return { err: 'gone' }; const c = 700 * m.lv; if (s.coins < c) return { err: 'notEnough' }; s.coins -= c; m.lv++; s.bldSeq = (s.bldSeq || 0) + 1; sl.bldSeq = s.bldSeq; return { ok: 1, fx: 'coin' }; }
      case 'salonfire': { const i = sl.staff.findIndex(x => x.id === a.sid); if (i < 0) return { err: 'gone' }; sl.staff.splice(i, 1); return { ok: 1, msg: 'fired' }; }
      case 'salongroomall': { if (!sl.built) return { err: 'gone' }; const ps = s.pets.filter(p => p && !p.groomed); if (!ps.length) return { err: 'salonNoneToGroom' }; const n = Math.min(ps.length, Math.floor(s.coins / SALON_GROOM_ALL)); if (!n) return { err: 'notEnough' };
        for (let i = 0; i < n; i++) { ps[i].groomed = true; ps[i].happy = Math.min(100, (ps[i].happy || 0) + 10); ps[i].clean = 100; } s.coins -= n * SALON_GROOM_ALL; return { ok: 1, fx: 'coin', msg: 'salonGroomedAll', p: { n } }; }
    }
    return undefined;
  }
  // ---------------- world ----------------
  const Q = (x, y, z) => [ISO.wx(x, y), ISO.wy(x, y) - (z || 0)];
  const poly = (c, pts, col, st, lw) => { c.beginPath(); pts.forEach((q, i) => i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); c.closePath(); if (col) { c.fillStyle = col; c.fill(); } if (st) { c.lineWidth = lw || 1; c.strokeStyle = st; c.stroke(); } };
  const at = (c, x, y, fn) => { c.save(); c.translate(ISO.wx(x, y), ISO.wy(x, y)); fn(); c.restore(); };
  function solid() {
    const set = new Set(); if (!built()) { const s = SALON_SIGN(); set.add(s.x + ',' + s.y); return set; }
    const p = SALON_POS(), add = (u, v) => set.add(Math.floor(p.x + u) + ',' + Math.floor(p.y + v));
    for (const t of TABLES) { add(t.u, t.v); add(t.u + 1, t.v); } add(COUNTER.u, COUNTER.v); add(COUNTER.u + 1, COUNTER.v); add(4, 1); add(8.5, .5); add(.5, .5);
    for (let u = -1; u <= p.w; u++) { set.add((p.x + u) + ',' + (p.y - 1)); } for (let v = -1; v <= p.d; v++) set.add((p.x - 1) + ',' + (p.y + v)); // back walls
    return set;
  }
  // 건물 밑동 그림자(카페/병원과 동일 패턴) -- 살롱엔 없었어서 추가
  function groundShadowSalon(c, x, y, w, d) {
    for (const [e, a] of [[.45, .18], [.22, .26]]) {
      const q = [Q(x - e * .3, y - e * .3), Q(x + w + e, y - e * .3), Q(x + w + e, y + d + e), Q(x - e * .3, y + d + e)];
      poly(c, q, `rgba(40,70,20,${a})`, null);
    }
  }
  const salonFloorRnd = (ix, iy) => { const v = Math.sin(ix * 12.9898 + iy * 78.233 + 4.17) * 43758.5453; return v - Math.floor(v); };
  function floor(c, T) {
    const p = SALON_POS(), x0 = p.x, y0 = p.y, x1 = x0 + p.w, y1 = y0 + p.d;
    c.save();
    if (!built()) { poly(c, [Q(x0, y0), Q(x1, y0), Q(x1, y1), Q(x0, y1)], 'rgba(120,160,70,.25)'); c.setLineDash([10, 7]); poly(c, [Q(x0 + .1, y0 + .1), Q(x1 - .1, y0 + .1), Q(x1 - .1, y1 - .1), Q(x0 + .1, y1 - .1)], null, 'rgba(255,255,255,.85)', 2); c.setLineDash([]); c.restore(); return; }
    groundShadowSalon(c, x0, y0, p.w, p.d);
    // floor: pastel checker -> 타일별 그라데이션(위 밝게/아래 어둡게) + 밝기 미세 랜덤(텍스처)
    for (let u = 0; u < p.w; u++) for (let v = 0; v < p.d; v++) {
      const tile = [Q(x0 + u, y0 + v), Q(x0 + u + 1, y0 + v), Q(x0 + u + 1, y0 + v + 1), Q(x0 + u, y0 + v + 1)];
      const jitter = (salonFloorRnd(u, v) - .5) * .08;
      const base = ART.shade((u + v) % 2 ? '#fde7ef' : '#e7f4fb', jitter);
      const g = c.createLinearGradient(tile[0][0], tile[0][1], tile[2][0], tile[2][1]);
      g.addColorStop(0, ART.shade(base, .1)); g.addColorStop(1, ART.shade(base, -.12));
      poly(c, tile, g);
    }
    // a rug by the bench and a paw mat at the entrance
    poly(c, [Q(x0 + 7.6, y0 + 6.2), Q(x0 + 9.6, y0 + 6.2), Q(x0 + 9.6, y0 + 7.6), Q(x0 + 7.6, y0 + 7.6)], '#ffd6e2', 'rgba(200,120,150,.5)');
    c.restore();
  }
  function wallNorth(c, T) {
    if (!built()) return;
    const p = SALON_POS(), x0 = p.x, y0 = p.y, x1 = x0 + p.w;
    c.save();
    const WH = 70;
    // North wall face & baseboard
    poly(c, [Q(x0, y0, WH), Q(x1, y0, WH), Q(x1, y0), Q(x0, y0)], '#fff5f8', ART.OUT, 1.2);
    poly(c, [Q(x0, y0, 22), Q(x1, y0, 22), Q(x1, y0), Q(x0, y0)], '#f7b9cc');
    // North wall windows
    for (const u of [1, 7.6]) poly(c, [Q(x0 + u, y0, 58), Q(x0 + u + 1.2, y0, 58), Q(x0 + u + 1.2, y0, 32), Q(x0 + u, y0, 32)], '#cfe9f8', '#b98552', 2);
    // North wall signboard
    { const a = Q(x0 + 3.2, y0, 66), b = Q(x0 + 7.2, y0, 66); poly(c, [a, b, Q(x0 + 7.2, y0, 48), Q(x0 + 3.2, y0, 48)], '#ff8fb1', ART.OUT, 1.2); const m = Q(x0 + 5.2, y0, 57); c.save(); c.translate(m[0], m[1]); c.transform(1, .5, 0, 1, 0, 0); c.font = 'bold 11px sans-serif'; c.textAlign = 'center'; c.fillStyle = '#fff'; c.fillText('✂️ ' + t('salonName'), 0, 4); c.restore(); }
    // North roof edge (clamped to lot boundary so it never penetrates adjacent lots)
    poly(c, [Q(x0, y0, WH), Q(x1, y0, WH), Q(x1, y0 + .2, WH + 6), Q(x0, y0 + .2, WH + 6)], '#e0607e', ART.OUT, 1);
    c.restore();
  }
  function wallWest(c, T) {
    if (!built()) return;
    const p = SALON_POS(), x0 = p.x, y0 = p.y, y1 = y0 + p.d;
    c.save();
    const WH = 70;
    // West wall face & baseboard
    poly(c, [Q(x0, y0, WH), Q(x0, y1, WH), Q(x0, y1), Q(x0, y0)], '#fbeef3', ART.OUT, 1.2);
    poly(c, [Q(x0, y0, 22), Q(x0, y1, 22), Q(x0, y1), Q(x0, y0)], '#f2a9bf');
    // West wall windows
    for (const v of [2.5, 5.5]) poly(c, [Q(x0, y0 + v, 58), Q(x0, y0 + v + 1.2, 58), Q(x0, y0 + v + 1.2, 32), Q(x0, y0 + v, 32)], '#cfe9f8', '#b98552', 2);
    // West roof edge (clamped to lot boundary)
    poly(c, [Q(x0, y0, WH), Q(x0, y1, WH), Q(x0 + .2, y1, WH + 6), Q(x0 + .2, y0, WH + 6)], '#d9506f', ART.OUT, 1);
    c.restore();
  }
  function walls(c, T) {
    wallNorth(c, T);
    wallWest(c, T);
  }
  function ground(c, T) {
    floor(c, T);
    walls(c, T);
  }
  function frontWallTile(c, x1, y1, x2, y2) {
    c.save();
    const fh = 24;
    const p1 = Q(x1, y1, fh), p2 = Q(x2, y2, fh), p3 = Q(x2, y2, 0), p4 = Q(x1, y1, 0);
    // 1. Semi-transparent pink glass wall panel
    poly(c, [p1, p2, p3, p4], 'rgba(255, 225, 235, .55)', 'rgba(210, 110, 150, .45)', 1.1);
    // 2. Crisp white top rail & highlight
    c.beginPath(); c.moveTo(p1[0], p1[1]); c.lineTo(p2[0], p2[1]);
    c.strokeStyle = '#ffffff'; c.lineWidth = 1.8; c.stroke();
    const l1 = Q(x1, y1, fh - 1.2), l2 = Q(x2, y2, fh - 1.2);
    c.beginPath(); c.moveTo(l1[0], l1[1]); c.lineTo(l2[0], l2[1]);
    c.strokeStyle = 'rgba(240, 150, 185, .45)'; c.lineWidth = 0.9; c.stroke();
    // 3. Pink baseboard
    const b1 = Q(x1, y1, 3), b2 = Q(x2, y2, 3);
    poly(c, [b1, b2, p3, p4], '#f7b9cc', 'rgba(200, 100, 140, .4)', 1);
    // 4. Diagonal glass sheen reflection
    const s1 = Q(x1 + (x2 - x1) * .2, y1 + (y2 - y1) * .2, 4);
    const s2 = Q(x1 + (x2 - x1) * .8, y1 + (y2 - y1) * .8, 20);
    c.beginPath(); c.moveTo(s1[0], s1[1]); c.lineTo(s2[0], s2[1]);
    c.strokeStyle = 'rgba(255, 255, 255, .4)'; c.lineWidth = 1.3; c.stroke();
    c.restore();
  }
  function table(c, T, i, cust) { // grooming table with a bathtub corner; the guest's pet on top while being groomed
    const box = FURN.box, P = FURN.P;
    box(c, 0, .1, 2, .8, 26, '#ffffff', 0, { top: '#e8f4fa' }); box(c, 0, .1, .9, .8, 8, '#8fd0f0', 26, { top: '#bfe6f8' });
    if (!cust) return;
    const stg = SALON_STAGES[Math.min(cust.stg, SALON_STAGES.length - 1)], [x, y] = P(1.45, .5, 30), k = Math.sin(T * 6);
    c.save(); c.translate(x, y); c.scale(.45, .45); ART.pet(c, cust.sp, { t: T, mood: 'happy', seed: cust.coat, age: 1 }); c.restore();
    c.save(); c.textAlign = 'center';
    if (stg.k === 'bath') { for (let j = 0; j < 5; j++) { const f = (T * .8 + j / 5) % 1; c.globalAlpha = 1 - f; ART.ell(c, x - 12 + j * 6, y - 12 - f * 26, 3 + f * 2, 3 + f * 2, 'rgba(200,235,255,.9)', 'rgba(120,170,210,.8)', .6); } c.globalAlpha = 1; }
    else if (stg.k === 'dry') { const [dx, dy] = P(1.9, .2, 52); c.font = '14px sans-serif'; c.fillText('💨', dx + Math.sin(T * 12) * 2, dy); for (let j = 0; j < 3; j++) { c.strokeStyle = 'rgba(160,200,230,.8)'; c.lineWidth = 1.4; c.beginPath(); const o = ((T * 30 + j * 8) % 20); c.moveTo(dx - 4 - o, dy + 6 + j * 3); c.lineTo(dx - 10 - o, dy + 8 + j * 3); c.stroke(); } }
    else if (stg.k === 'cut') { c.font = '14px sans-serif'; c.fillText('✂️', x + 14, y - 18 + Math.sin(T * 14) * 3); for (let j = 0; j < 3; j++) { const f = (T * 1.3 + j / 3) % 1; ART.ell(c, x + 6 + j * 3, y - 6 + f * 14, 1.6, 1.2, '#f3e3c7'); } }
    else { c.font = '14px sans-serif'; c.fillText('🎀', x, y - 32 - Math.abs(k) * 4); c.fillText('✨', x - 14, y - 22); }
    // progress ring
    const tot = SALON_STAGES.reduce((a, q) => a + q.t, 0), done = SALON_STAGES.slice(0, cust.stg).reduce((a, q) => a + q.t, 0) + (stg.t - Math.max(0, cust.t)), pr = Math.min(1, done / tot), by = y - 62;
    ART.ell(c, x, by, 13, 13, '#fff', 'rgba(60,38,25,.7)', 1.4); c.beginPath(); c.arc(x, by, 13, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pr); c.lineWidth = 3; c.strokeStyle = '#ff7aa8'; c.stroke(); c.font = '13px sans-serif'; c.fillText(stg.icon, x, by + 5);
    c.restore();
  }
  function counter(c) { const box = FURN.box, P = FURN.P; box(c, 0, .1, 2, .8, 30, '#f7b9cc', 0, { top: '#fff5f8' }); box(c, .7, .3, .5, .4, 8, '#4b5563', 30, { top: '#6b7684' }); const [x, y] = P(1.6, .5, 32); c.font = '12px sans-serif'; c.textAlign = 'center'; c.fillText('🧴', x, y); c.textAlign = 'start'; }
  function bench(c) {
    const box = FURN.box, P = FURN.P;
    // 1. 등받이: 서쪽 벽면(x=0)에 완벽하게 밀착되어 북/서 벽에 등을 기댈 수 있도록 배치 (h=28, w=0.18, d=3.4)
    box(c, 0, 0, .18, 3.4, 28, '#d9506f', 0, { top: '#ff8fb1' });
    // 2. 방석: 등받이 앞쪽(x=0.18)에서 시작하여 동쪽으로 뻗는 푹신한 핑크 가죽 쿠션 (h=12, w=0.64, d=3.4)
    box(c, .18, 0, .64, 3.4, 12, '#ff9ec0', 0, { top: '#ffc2d4' });
    // 3. 북쪽/남쪽 끝 팔걸이 (h=16)
    box(c, 0, 0, .80, .16, 16, '#e0607e', 0, { top: '#ff8fb1' });
    box(c, 0, 3.24, .80, .16, 16, '#e0607e', 0, { top: '#ff8fb1' });
    // 4. 방석 3인석 퀼팅 봉제선 및 앤틱 버튼
    for (const sv of [1.1, 2.2]) {
      const pA = P(.20, sv, 12), pB = P(.80, sv, 12);
      c.beginPath(); c.moveTo(pA[0], pA[1]); c.lineTo(pB[0], pB[1]); c.strokeStyle = '#e07a9a'; c.lineWidth = 1.4; c.stroke();
    }
    for (let i = 0; i < 3; i++) {
      const bp = P(.50, .55 + i * 1.1, 12);
      ART.ell(c, bp[0], bp[1], 2.2, 2.2, '#d9506f', '#ffffff', .6);
      const bpb = P(.09, .55 + i * 1.1, 20);
      ART.ell(c, bpb[0], bpb[1], 2, 2, '#b83b58', '#ffffff', .5);
    }
  }
  function sign(c, T) {
    c.fillStyle = '#8a5a33'; c.fillRect(-3, -50, 6, 50); c.fillRect(-26, -50, 5, 50);
    ART.rrect(c, -52, -104, 104, 58, 8); c.fillStyle = '#9a6a3f'; c.fill(); c.lineWidth = 1.8; c.strokeStyle = ART.OUT; c.stroke();
    ART.rrect(c, -47, -99, 94, 48, 6); c.fillStyle = '#fff3d6'; c.fill();
    c.textAlign = 'center'; c.font = '17px sans-serif'; c.fillText('✂️🛁🎀', 0, -79); c.font = 'bold 11px sans-serif'; c.fillStyle = '#c0507a'; c.fillText(t('salonLot'), 0, -66); c.font = 'bold 10px sans-serif'; c.fillStyle = '#9a6a10'; c.fillText('🪙 ' + fmt(SALON_COST), 0, -55);
    const b = Math.sin(T * 3) * 3; c.font = '16px sans-serif'; c.fillText('👆', 44, -108 + b); c.textAlign = 'start';
  }
  function collect(c, T, addHit) {
    const out = [];
    if (!built()) { const s = SALON_SIGN(); out.push({ depth: s.x + s.y + 1, fn: () => { at(c, s.x + .5, s.y + .5, () => sign(c, T)); const sx = ISO.wx(s.x + .5, s.y + .5), sy = ISO.wy(s.x + .5, s.y + .5); addHit({ kind: 'salonsign', x0: sx - 56, x1: sx + 56, y0: sy - 110, y1: sy + 6 }); } }); return out; }
    const p = SALON_POS(), sl = (typeof S !== 'undefined' && S && S.salon) || {};
    out.push({ depth: p.x + p.y + 0.05 + (((sl.bldSeq || 1)) * 0.0001), fn: () => walls(c, T) });
    TABLES.forEach((tb, i) => { const cu = (sl.q || []).find(q => q.ph === 'groom' && q.st === i); out.push({ depth: p.x + tb.u + 2 + p.y + tb.v + 1 - 1.02, fn: () => at(c, p.x + tb.u, p.y + tb.v, () => table(c, T, i, cu)) }); });
    out.push({ depth: p.x + COUNTER.u + 2 + p.y + COUNTER.v + 1 - 1.02, fn: () => at(c, p.x + COUNTER.u, p.y + COUNTER.v, () => counter(c)) });
    out.push({ depth: p.x + 1.0 + p.y + 6.7, fn: () => at(c, p.x + .15, p.y + 3.3, () => bench(c)) });
    out.push({ depth: p.x + 4.5 + p.y + 1.5, fn: () => at(c, p.x + 4, p.y + 1, () => { const box = FURN.box, P = FURN.P; box(c, .35, .35, .3, .3, 50, '#c0c8d0'); const [x, y] = P(.5, .5, 56); ART.ell(c, x, y, 10, 6, '#ff9ec0', ART.OUT, 1); }) }); // dryer stand
    out.push({ depth: p.x + 9 + p.y + 1, fn: () => at(c, p.x + 8.5, p.y + .5, () => { const box = FURN.box; box(c, .1, .1, .8, .8, 16, '#f3e3c7'); const P = FURN.P, [x, y] = P(.5, .5, 16); for (let i = 0; i < 6; i++) ART.ell(c, x - 8 + i * 3 + Math.sin(i) * 2, y - 12 - (i % 3) * 5, 7, 8, i % 2 ? '#5ab86a' : '#3f9a5a'); }) });
    out.push({ depth: p.x + 1 + p.y + 1, fn: () => at(c, p.x + .5, p.y + .5, () => { const box = FURN.box, P = FURN.P; box(c, .05, .05, .9, .9, 44, '#f3e3c7'); for (let r = 0; r < 3; r++) for (let i = 0; i < 3; i++) { const [x, y] = P(.9, .2 + i * .28, 10 + r * 13); c.font = '9px sans-serif'; c.textAlign = 'center'; c.fillText(['🧴', '🧼', '🪮'][(r + i) % 3], x, y); } c.textAlign = 'start'; }) });
    // 전면 유리벽 (남쪽 & 동쪽): 타일 단위로 분할 렌더링 + 나중에 지어진 인접 건물(병원 등)의 벽/부지를 침범하지 않도록 안전 검사
    const x0 = p.x, y0 = p.y, w = p.w, d = p.d;
    const hospBuilt = typeof S !== 'undefined' && S && S.hosp && S.hosp.built;
    const hospSeq = (hospBuilt && (S.hosp.bldSeq || S.hosp.lv || 1)) || 1;
    const salonSeq = (sl.bldSeq || 1);
    const hp = hospBuilt && typeof HOSP_POS === 'function' ? HOSP_POS() : null;
    const overlapsHosp = (x, y) => {
      if (!hp || hospSeq <= salonSeq) return false;
      return x >= hp.x - 0.05 && x <= hp.x + hp.w + 0.05 && y >= hp.y - 0.05 && y <= hp.y + hp.d + 0.05;
    };
    for (let u = 0; u < w; u++) {
      const xA = x0 + u, xB = x0 + u + 1, yWall = y0 + d;
      if (overlapsHosp(xA + 0.5, yWall)) continue;
      out.push({ depth: (xA + 1) + yWall + 0.02, fn: () => frontWallTile(c, xA, yWall, xB, yWall) });
    }
    const doorV = d - 2; // 입구 출입문 (문틀 위치는 개방)
    for (let v = 0; v < d; v++) {
      if (v === doorV) continue;
      const yA = y0 + v, yB = y0 + v + 1, xWall = x0 + w;
      if (overlapsHosp(xWall, yA + 0.5)) continue;
      out.push({ depth: xWall + (yA + 1) + 0.02, fn: () => frontWallTile(c, xWall, yA, xWall, yB) });
    }
    out.push({ depth: 1e9, fn: () => { const sx = ISO.wx(p.x + p.w / 2, p.y + p.d / 2), sy = ISO.wy(p.x + p.w / 2, p.y + p.d / 2); addHit({ kind: 'salon', x0: sx - 120, x1: sx + 120, y0: sy - 110, y1: sy + 60 }); } });
    return out;
  }
  // guests + groomers as real walking actors (called from world.js sync)
  function sync(dt, W) {
    if (!built()) return;
    const sl = S.salon, p = SALON_POS(), door = { x: p.x + p.w + .5, y: p.y + p.d - 1.5 }, host = !(typeof Net !== 'undefined' && Net.mode === 'guest');
    const edgePoint = (seed, nearY) => (typeof villageEdgePoint === 'function') ? villageEdgePoint(seed, nearY) : { x: ((typeof S !== 'undefined' && S && S.room && S.room.w) || 8) + 1.5, y: -34 };
    const waiting = sl.q.filter(c => c.ph === 'in' || c.ph === 'wait');
    for (const c of sl.q) {
      const id = 'sc' + c.id; W.alive.add(id);
      let a = W.actors.get(id);
      if (!a) { const sp = edgePoint(c.seed || c.id); a = W.mkActor(id, 'patient', sp.x, sp.y, { look: ART.randomHuman(c.seed), speed: 3.2 }); a.salon = true; }
      a.hold = (c.ph === 'groom') ? null : { sp: c.sp, coat: c.coat, grow: 1 };
      let tx, ty, fx = null, fy = null;
      if (c.ph === 'in' || c.ph === 'wait') {
        const i = Math.min(SEATS.length - 1, Math.max(0, waiting.indexOf(c))), s0 = SEATS[i];
        tx = p.x + s0.u; ty = p.y + s0.v; fx = tx + 1; fy = ty;
        a.sit = a.arrived || Math.hypot(a.x - tx, a.y - ty) < 0.45;
        if (a.sit) a.seatAt = { x: tx, y: ty };
      } else {
        a.sit = false; a.seatAt = null;
        if (c.ph === 'groom') { const tb = TABLES[c.st] || TABLES[0], s0 = SEATS[c.st] || SEATS[0]; tx = p.x + s0.u; ty = p.y + s0.v; fx = p.x + tb.u + 1; fy = p.y + tb.v; }
        else if (c.ph === 'pay') { tx = p.x + COUNTER.u + 1; ty = p.y + COUNTER.v + 1.6; fx = tx; fy = ty - 2; }
        else { const ex = edgePoint(c.seed || c.id, a.y); tx = ex.x; ty = ex.y; }
      }
      const key = Math.floor(tx) + ',' + Math.floor(ty);
      if (a.tkey !== key) { a.tkey = key; a.arrived = false; const via = (c.ph === 'in') && Math.hypot(a.x - door.x, a.y - door.y) > 3; const go = () => W.goTo(a, tx, ty, () => { a.arrived = true; if (c.ph === 'out' || c.ph === 'angry') { c.gone = true; W.actors.delete(id); sl.q = sl.q.filter(x => x !== c); return; } if (fx != null) W.faceTo(a, fx, fy); if (c.ph === 'in' && host) c.arr = true; }); if (via) W.goTo(a, door.x, door.y, go); else go(); }
      a.angry = c.ph === 'angry'; a.happyT = c.ph === 'pay' || c.ph === 'out' ? 1 : 0;
      a.salonPaid = c.ph === 'pay' && c.paid ? c.paid : 0; a.salonWait = c.ph === 'wait' && a.arrived; a.cid = c.id;
    }
    sl.staff.forEach((m, i) => {
      const id = 'ss' + m.id; W.alive.add(id);
      const busy = sl.q.find(c => c.ph === 'groom' && c.by === 'm' + m.id), tb = TABLES[busy ? busy.st : i % TABLES.length], tx = p.x + tb.u + 1.2, ty = p.y + tb.v + 1.6;
      let a = W.actors.get(id); if (!a) { const lk = ART.randomHuman(m.seed); lk.top = 'jacket'; lk.jacket = '#ff9ec0'; lk.hat = null; applyStaffArt(lk, m.seed, false, 'hairstylist'); a = W.mkActor(id, 'hstaff', tx, ty, { look: lk, speed: 2.4 }); }
      a.m = m; a.talk = false;
      const key = Math.floor(tx) + ',' + Math.floor(ty); if (a.tkey !== key) { a.tkey = key; W.goTo(a, tx, ty, () => W.faceTo(a, p.x + tb.u + 1, p.y + tb.v)); }
    });
  }
  return { tick, apply, ground, floor, walls, collect, solid, sync, wagesOf, built, ensure };
})();
Object.assign(I18N.ko, {
  salonName: '펫 미용실', salonLot: '펫 미용실 부지', salonBuildConfirm: '펫 미용실을 지을까요? 🪙{c}\n주민들이 펫을 데려오면 목욕 → 드라이 → 커트 → 리본으로 예쁘게 꾸며주고 돈을 받아요.', salonBuildBtn: '짓기', salonBuilt: '✂️ 펫 미용실이 문을 열었어요!',
  salonStart: '✂️ 미용 시작!', salonBusy: '미용대가 모두 사용 중이에요', salonNoneToGroom: '미용할 가게 펫이 없어요 (모두 미용 완료)', salonGroomedAll: '가게 펫 {n}마리를 예쁘게 미용했어요! 판매가 +20% ✨',
  salonTitle: '✂️ 펫 미용실', salonInfo: '주민들이 펫을 맡기면 목욕 → 드라이 → 커트 → 리본 순서로 꾸며 줘요. 미용사 레벨이 높아질수록 미용 속도가 대폭 빨라지고 수익도 늘어납니다! 기다리는 손님을 누르면 사장님이 직접 미용해요.', salonStats: '오늘까지 미용 {n}마리 · 그냥 간 손님 {m}명 · 기다리는 손님 {w}명',
  salonGroomAll: '🐩 가게 펫 모두 미용하기 ({n}마리 × 🪙{c})', salonStaffT: '✂️ 미용사', salonHire: '미용사 고용 🪙{c} · 일급 {w}', salonWage: '일급 {c}', salonTapGuest: '✂️ 누르면 미용 시작', salonWaitB: '🛁',
  fwhy_salon: ''
});
Object.assign(I18N.ru, {
  salonName: 'Груминг-салон', salonLot: 'Место под салон', salonBuildConfirm: 'Построить груминг-салон? 🪙{c}\nЖители приводят питомцев: мытьё → сушка → стрижка → бантик, и платят.', salonBuildBtn: 'Построить', salonBuilt: '✂️ Груминг-салон открыт!',
  salonStart: '✂️ Начали!', salonBusy: 'Все столы заняты', salonNoneToGroom: 'Некого стричь в магазине', salonGroomedAll: 'Привели в порядок {n} питомцев! Цена +20% ✨',
  salonTitle: '✂️ Груминг-салон', salonInfo: 'Жители оставляют питомцев: мытьё → сушка → стрижка → бантик. Нажмите на ждущего гостя, чтобы стричь самой.', salonStats: 'Всего {n} · ушли {m} · ждут {w}',
  salonGroomAll: '🐩 Подстричь всех в магазине ({n} × 🪙{c})', salonStaffT: '✂️ Грумеры', salonHire: 'Нанять грумера 🪙{c} · в день {w}', salonWage: 'в день {c}', salonTapGuest: '✂️ нажмите — начать', salonWaitB: '🛁',
  fwhy_salon: ''
});
