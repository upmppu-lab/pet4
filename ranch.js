// ================= v1.27: the ranch (목장) — cows & pigs =================
// A big lot the player places (S.lay.ranch). Starts with a calf pair and a piglet pair (♂♀). Cows eat hay (seed store),
// pigs eat crops from the farm storage. Fed adults give milk / meat every morning; fed adult pairs have babies while there is room
// (room grows with the ranch level). Milk & meat go into the same storage as the farm crate / café fridge (s.farm.produce).
// Ranch hands (hired in the ranch panel) feed, fetch hay, take crops for the pigs and collect the produce.
const RANCH_LOT = { w: 12, d: 10 };
// v2026-10-10: 뷰포트 컬링(화면 밖 안 그리기) 최적화가 world.js에서 RANCH_POS()라는 전역 함수가
// 있다고 가정하고 호출하는데(PARK_POS, HOSP_POS 등과 같은 패턴), ranch.js에는 이 함수가 아예
// 없어서 "typeof RANCH_POS === 'function'"이 항상 false가 되어 목장이 절대 그려지지 않던 버그.
// 다른 시설들과 동일한 패턴으로 추가함.
const RANCH_POS = () => { const L = (typeof LAY === 'function') ? LAY('ranch') : null; return L ? { x: L.x, y: L.y, w: RANCH_LOT.w, d: RANCH_LOT.d } : { x: LAY_FAR, y: LAY_FAR, w: RANCH_LOT.w, d: RANCH_LOT.d }; };
const RANCH_COST = 25000, RANCH_LV_REQ = 8;
const RANCH_LV = [null, { cap: 3, cost: 0 }, { cap: 5, cost: 18000 }, { cap: 8, cost: 42000 }, { cap: 12, cost: 90000 }]; // cap = animals of EACH kind
const RANCH_GROW = 3, RANCH_BREED = .5; // days until adult, chance per day that a fed adult pair has a baby
const RANCH_GOODS = { milk: { icon: '🥛', sell: 30 }, meat: { icon: '🥩', sell: 55 } };
const RANCH_HAND = { hire: 2500, wage: 150 };
Object.assign(TOWN_DEF, { ranch: { cat: 'big', w: RANCH_LOT.w, d: RANCH_LOT.d, cost: RANCH_COST, act: 'buildranch', ic: '🐄' } });
TOWN_BIG.push('ranch');
FARM_GOODS.push({ id: 'hay', cost: 14, sellPrice: 0, icon: '🌿', ulv: 1, feed: 1 });

const RANCH = (() => {
  const L = () => (typeof LAY === 'function' ? LAY('ranch') : null);
  const day = s => (s.clock ? s.clock.day : 1);
  const adult = (s, a) => day(s) - a.born >= RANCH_GROW;
  const built = s => !!(s.ranch && s.lay && s.lay.ranch);
  const prod = s => FARM.ensure(s).produce;
  const hayFee = () => Math.round(14 * 1.15);
  const NAMES = {
    ko: { cow: ['음메', '얼룩이', '우유', '초코', '밀키', '누렁이', '방울', '크림'], pig: ['꿀꿀이', '분홍이', '토실이', '동글이', '복돌이', '핑키', '뚱이', '보리'] },
    ru: { cow: ['Бурёнка', 'Милка', 'Снежинка', 'Зорька', 'Беляночка', 'Рябинка', 'Колокольчик', 'Ромашка'], pig: ['Хрюша', 'Пятачок', 'Пончик', 'Розочка', 'Пухля', 'Пикки', 'Толстячок', 'Фунтик'] }
  };
  const KO_TO_RU_ANIMAL = {
    '음메': 'Бурёнка', '얼룩이': 'Милка', '우유': 'Снежинка', '초코': 'Зорька',
    '밀키': 'Беляночка', '누렁이': 'Рябинка', '방울': 'Колокольчик', '크림': 'Ромашка',
    '꿀꿀이': 'Хрюша', '분홍이': 'Пятачок', '토실이': 'Пончик', '동글이': 'Розочка',
    '복돌이': 'Пухля', '핑키': 'Пикки', '뚱이': 'Толстячок', '보리': 'Фунтик'
  };
  const nameOf = (s, k) => { const L0 = NAMES[s.lang] || NAMES.ko, list = L0[k]; return list[Math.floor(Math.random() * list.length)]; };
  function mk(s, k, sex) { const r = s.ranch; return { id: 'r' + (r.seq++), k, sex, born: day(s), fed: -1, name: nameOf(s, k) }; }
  function ensure(s) {
    const r = s.ranch; if (!r) return null;
    if (!r.cows) r.cows = []; if (!r.pigs) r.pigs = []; if (!r.staff) r.staff = []; if (r.milk == null) r.milk = 0; if (r.meat == null) r.meat = 0; if (!r.seq) r.seq = 1; if (!r.lv) r.lv = 1;
    if (r.lastDay == null) r.lastDay = day(s);
    if (r.hay == null) r.hay = 6; if (!r.pf) r.pf = {}; if (!r.drops) r.drops = []; // v1.28: hay feed box, pig feed box, milk / meat lying in the pens
    if (r.milk || r.meat) { for (let i = 0; i < r.milk; i++) r.drops.push({ id: r.seq++, k: 'milk' }); for (let i = 0; i < r.meat; i++) r.drops.push({ id: r.seq++, k: 'meat' }); r.milk = r.meat = 0; }
    // Translate animal names if game language is Russian
    const isRu = (typeof CFG !== 'undefined' && CFG.lang === 'ru') || (s && s.lang === 'ru');
    if (isRu) {
      for (const a of r.cows) { if (KO_TO_RU_ANIMAL[a.name]) a.name = KO_TO_RU_ANIMAL[a.name]; }
      for (const a of r.pigs) { if (KO_TO_RU_ANIMAL[a.name]) a.name = KO_TO_RU_ANIMAL[a.name]; }
    }
    return r;
  }
  // v1.28: the animals eat by themselves from their feed boxes: cows from the hay box, pigs from the pig-feed box
  const pfTotal = r => Object.values(r.pf || {}).reduce((a, n) => a + (n > 0 ? n : 0), 0);
  function pigFood(s) { const p = prod(s); const c = CROPS.filter(x => (p[x.id] || 0) > 0).sort((a, b) => a.sellPrice - b.sellPrice)[0]; return c ? c.id : null; }
  // lim: how many animals of each kind eat this call (the timer feeds them one by one so you can watch them walk to the trough)
  function eat(s, lim) {
    const r = ensure(s), d = day(s); let n = 0, nc = 0, np = 0; lim = lim || 99;
    for (const a of r.cows) { if (nc >= lim) break; if (a.fed === d || !(r.hay > 0)) continue; r.hay--; a.fed = d; n++; nc++; }
    for (const a of r.pigs) { if (np >= lim) break; if (a.fed === d) continue; np++; const k = Object.keys(r.pf).find(q => r.pf[q] > 0); if (!k) break; r.pf[k]--; if (!r.pf[k]) delete r.pf[k]; a.fed = d; n++; }
    return n;
  }
  // why no babies yet? → one short reason per kind for the ranch panel
  function breedInfo(s, k) {
    const r = ensure(s), d = day(s), list = k === 'cow' ? r.cows : r.pigs, cap = RANCH_LV[r.lv].cap;
    if (list.length >= cap) return { st: 'full' };
    const ad = list.filter(a => d - a.born >= RANCH_GROW), hasM = ad.some(a => a.sex === 'm'), hasF = ad.some(a => a.sex === 'f');
    if (!hasM || !hasF) { const kids = list.filter(a => d - a.born < RANCH_GROW); if (!kids.length) return { st: 'pair' }; return { st: 'grow', n: Math.min(...kids.map(a => RANCH_GROW - (d - a.born))) }; }
    const fedM = ad.some(a => a.sex === 'm' && a.fed === d), fedF = ad.some(a => a.sex === 'f' && a.fed === d);
    if (!fedM || !fedF) return { st: 'hungry' };
    return { st: 'ok' };
  }
  function pickAll(s) { const r = ensure(s), p = prod(s), n = r.drops.length; for (const q of r.drops) p[q.k] = (p[q.k] || 0) + 1; r.drops = []; return n; }
  function pickOne(s, id) { const r = ensure(s), q = r.drops.find(x => x.id === id); if (!q) return null; const p = prod(s); p[q.k] = (p[q.k] || 0) + 1; r.drops = r.drops.filter(x => x !== q); return q.k; }
  function stockPigBox(s, n) { const r = ensure(s), p = prod(s); let m = 0; while (m < n) { const c = pigFood(s); if (!c) break; p[c]--; r.pf[c] = (r.pf[c] || 0) + 1; m++; } return m; }
  // every new morning: produce + babies (from animals fed the day before), wages
  function morning(s) {
    const r = ensure(s), d = day(s); if (d === r.lastDay) return; const prev = r.lastDay; r.lastDay = d;
    for (const a of r.cows) if (a.fed === prev && prev - a.born >= RANCH_GROW) { const n = 1 + (Math.random() < .4 ? 1 : 0); for (let i = 0; i < n && r.drops.length < 40; i++) r.drops.push({ id: r.seq++, k: 'milk', u: Math.random(), v: Math.random() }); }
    for (const a of r.pigs) if (a.fed === prev && prev - a.born >= RANCH_GROW && Math.random() < .55 && r.drops.length < 40) r.drops.push({ id: r.seq++, k: 'meat', u: Math.random(), v: Math.random() });
    const cap = RANCH_LV[r.lv].cap;
    for (const [k, list] of [['cow', r.cows], ['pig', r.pigs]]) {
      if (list.length >= cap) continue;
      const m = list.some(a => a.sex === 'm' && a.fed === prev && prev - a.born >= RANCH_GROW), f = list.filter(a => a.sex === 'f' && a.fed === prev && prev - a.born >= RANCH_GROW).length;
      // v1.30: a fed adult pair that missed twice in a row is guaranteed a baby the next morning
      if (!r.miss) r.miss = {}; const sure = m && f && (r.miss[k] | 0) >= 2; let born = 0;
      for (let i = 0; i < f && list.length < cap; i++) if (m && (sure || Math.random() < RANCH_BREED)) { born++; const b = mk(s, k, Math.random() < .5 ? 'm' : 'f'); b.born = d; list.push(b); r.births = (r.births | 0) + 1; if (typeof G !== 'undefined' && G.evPublic) G.evPublic(s, { k: 'ranchbaby', rk: k, name: b.name }); }
      if (m && f) r.miss[k] = born ? 0 : (r.miss[k] | 0) + 1;
    }
    const wage = r.staff.length * RANCH_HAND.wage; if (wage) s.coins = Math.max(0, s.coins - wage);
  }
  // ranch hands: every few seconds each hand does the most useful thing (feed hungry animals, then collect produce)
  function tick(s, dt) {
    if (!built(s)) return; const r = ensure(s); morning(s);
    r.eatT = (r.eatT || 0) - dt; if (r.eatT <= 0) { r.eatT = 3; eat(s, 1); }
    const open = s.clock && s.clock.ph !== 'closed', d = day(s);
    r.staff.forEach((m, i) => {
      m.t = (m.t || 0) - dt; if (m.t > 0 || !open) return; m.t = Math.max(3, 9 - m.lv * 1.2); m.why = null;
      const hayNeed = r.cows.length * 2, pigNeed = r.pigs.length * 2;
      let why = null;
      if (r.hay < hayNeed) { if (s.coins >= hayFee() * 10) { s.coins -= hayFee() * 10; r.hay += 10; m.act = 'hay'; m.done = (m.done | 0) + 1; return; } why = 'hay'; }
      if (pfTotal(r) < pigNeed) { const n = stockPigBox(s, pigNeed - pfTotal(r) + 2); if (n) { m.act = 'pig'; m.done = (m.done | 0) + 1; return; } why = why || 'crop'; }
      if (r.drops.length) { const q = r.drops[0]; pickOne(s, q.id); m.act = 'collect'; m.tk = q.k; m.done = (m.done | 0) + 1; return; }
      m.act = 'idle'; m.why = why;
    });
  }
  function apply(s, a, by) {
    if (a.t === 'buildranch') {
      if (s.ranch) return { err: 'gone' }; if ((s.level || 1) < RANCH_LV_REQ) return { err: 'ranchNeedLv', p: { n: RANCH_LV_REQ } };
      if (s.coins < RANCH_COST) return { err: 'notEnough' }; s.coins -= RANCH_COST;
      s.ranch = { lv: 1, cows: [], pigs: [], milk: 0, meat: 0, seq: 1, staff: [], lastDay: day(s) };
      const r = s.ranch; r.cows.push(mk(s, 'cow', 'm'), mk(s, 'cow', 'f')); r.pigs.push(mk(s, 'pig', 'm'), mk(s, 'pig', 'f'));
      return { ok: 1, fx: 'coin', msg: 'ranchBuilt' };
    }
    if (!['rfeed', 'rcollect', 'rsell', 'rup', 'rhire', 'rfire', 'rstaffup', 'rbuyhay', 'rpf', 'rpick'].includes(a.t)) return undefined;
    if (!built(s)) return { err: 'gone' }; const r = ensure(s);
    switch (a.t) {
      case 'rbuyhay': { const c = hayFee() * 10; if (s.coins < c) return { err: 'notEnough' }; s.coins -= c; r.hay += 10; return { ok: 1, fx: 'coin', msg: 'ranchHayBought' }; }
      case 'rpf': { const p = prod(s), k = a.id; if (!CROPS.find(x => x.id === k) || !((p[k] || 0) > 0)) return { err: 'gone' }; const n = Math.min(p[k], Math.max(1, a.n | 0)); p[k] -= n; r.pf[k] = (r.pf[k] || 0) + n; return { ok: 1 }; }
      case 'rpick': { const k = pickOne(s, a.id); if (!k) return { err: 'gone' }; if (typeof G !== 'undefined' && G.addXpPublic) G.addXpPublic(s, 1); return { ok: 1, fx: 'coin', msg: 'ranchPicked', p: { i: RANCH_GOODS[k].icon } }; }
      case 'rfeed': { const n = eat(s); if (!n) return { err: 'ranchFed' }; return { ok: 1, fx: 'love', msg: 'ranchAte', p: { n } }; }
      case 'rcollect': { const n = pickAll(s); if (!n) return { err: 'ranchNothing' }; if (typeof G !== 'undefined' && G.addXpPublic) G.addXpPublic(s, n); return { ok: 1, fx: 'coin', msg: 'ranchCollected', p: { n } }; }
      case 'rsell': { const g = RANCH_GOODS[a.id]; if (!g) return { err: 'gone' }; const p = prod(s), n = Math.min(Math.max(1, a.n | 0), p[a.id] || 0); if (!n) return { err: 'gone' }; p[a.id] -= n; s.coins += g.sell * n; return { ok: 1, fx: 'coin' }; }
      case 'rup': { const nx = RANCH_LV[r.lv + 1]; if (!nx) return { err: 'gone' }; if (s.coins < nx.cost) return { err: 'notEnough' }; s.coins -= nx.cost; r.lv++; return { ok: 1, fx: 'coin', msg: 'ranchUp', p: { n: r.lv } }; }
      case 'rhire': { if (r.staff.length >= 3) return { err: 'gone' }; const c = RANCH_HAND.hire * (1 + r.staff.length); if (s.coins < c) return { err: 'notEnough' }; s.coins -= c; r.staff.push({ lv: 1, seed: 1 + Math.floor(Math.random() * 99999), done: 0, t: 1 }); return { ok: 1, fx: 'coin', msg: 'ranchHired' }; }
      case 'rstaffup': { const m = r.staff[a.i | 0]; if (!m || m.lv >= 5) return { err: 'gone' }; const c = RANCH_HAND.hire * m.lv; if (s.coins < c) return { err: 'notEnough' }; s.coins -= c; m.lv++; return { ok: 1, fx: 'coin' }; }
      case 'rfire': { r.staff.splice(a.i | 0, 1); return { ok: 1 }; }
    }
    return undefined;
  }

  // ---------------- drawing ----------------
  // PNG Sprite assets: Ranch lot, Cow (1..5), Pig (1..5)
  const ranchUrl = (typeof assetUrl === 'function') ? assetUrl('spr/ranch/ranch.png') : 'spr/ranch/ranch.png';
  const RANCH_IMG = (typeof ASSET_CACHE !== 'undefined') ? ASSET_CACHE.load(ranchUrl) : ((typeof Image !== 'undefined') ? new Image() : null);
  if (RANCH_IMG && !RANCH_IMG.src) {
    RANCH_IMG.crossOrigin = 'anonymous';
    RANCH_IMG.src = ranchUrl;
  }

  const COW_IMGS = {};
  const PIG_IMGS = {};
  if (typeof Image !== 'undefined') {
    const cowSources = {
      1: 'spr/ranch/caw_1.png',
      2: 'spr/ranch/caw_2.png',
      3: 'spr/ranch/caw_3.png',
      4: 'spr/ranch/caw_4_walk1.png',
      5: 'spr/ranch/caw_5_walk2.png'
    };
    for (const k in cowSources) {
      const u = (typeof assetUrl === 'function') ? assetUrl(cowSources[k]) : cowSources[k];
      const im = (typeof ASSET_CACHE !== 'undefined') ? ASSET_CACHE.load(u) : new Image();
      im.crossOrigin = 'anonymous';
      if (!im.src) im.src = u;
      COW_IMGS[k] = im;
    }
    const pigSources = {
      1: 'spr/ranch/pig_1.png',
      2: 'spr/ranch/pig_2.png',
      3: 'spr/ranch/pig_3.png',
      4: 'spr/ranch/pig_4_walk1.png',
      5: 'spr/ranch/pig_4_walk2.png'
    };
    for (const k in pigSources) {
      const u = (typeof assetUrl === 'function') ? assetUrl(pigSources[k]) : pigSources[k];
      const im = (typeof ASSET_CACHE !== 'undefined') ? ASSET_CACHE.load(u) : new Image();
      im.crossOrigin = 'anonymous';
      if (!im.src) im.src = u;
      PIG_IMGS[k] = im;
    }
  }

  const P = (x, y, z) => [ISO.wx(x, y), ISO.wy(x, y) - (z || 0)];
  // Strict 0 rotation so isometric sprites, fences, buildings, and trees remain upright!
  const RANCH_ROT = 0;
  const rotPt = (pt) => pt;
  const RP = (L0, x, y, z) => P(x, y, z);
  const poly = (c, pts, col, st, lw) => { c.beginPath(); pts.forEach((q, i) => i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); c.closePath(); if (col) { c.fillStyle = col; c.fill(); } if (st) { c.lineWidth = lw || 1; c.strokeStyle = st; c.stroke(); } };
  const rBox = (c, L0, x0, y0, w, d, z0, h, col, top) => {
    const x1 = x0 + w, y1 = y0 + d;
    poly(c, [RP(L0, x0, y1, z0 + h), RP(L0, x1, y1, z0 + h), RP(L0, x1, y1, z0), RP(L0, x0, y1, z0)], col, ART.OUT, 1);
    poly(c, [RP(L0, x1, y0, z0 + h), RP(L0, x1, y1, z0 + h), RP(L0, x1, y1, z0), RP(L0, x1, y0, z0)], ART.shade(col, -.13), ART.OUT, 1);
    poly(c, [RP(L0, x0, y0, z0 + h), RP(L0, x1, y0, z0 + h), RP(L0, x1, y1, z0 + h), RP(L0, x0, y1, z0 + h)], top || ART.shade(col, .06), ART.OUT, 1);
  };
  const box = (c, x0, y0, w, d, z0, h, col, top) => { const x1 = x0 + w, y1 = y0 + d;
    poly(c, [P(x0, y1, z0 + h), P(x1, y1, z0 + h), P(x1, y1, z0), P(x0, y1, z0)], col, ART.OUT, 1);
    poly(c, [P(x1, y0, z0 + h), P(x1, y1, z0 + h), P(x1, y1, z0), P(x1, y0, z0)], ART.shade(col, -.13), ART.OUT, 1);
    poly(c, [P(x0, y0, z0 + h), P(x1, y0, z0 + h), P(x1, y1, z0 + h), P(x0, y1, z0 + h)], top || ART.shade(col, .06), ART.OUT, 1); };
  // Pens strictly partitioned: cows on green grass, pigs in dirt pen
  // Feed troughs placed in the middle of pastures/mud pens
  // Storage box placed down on the grass, clearing the entrance arch
  // v2026-10-09: "목장안의 풀밭 전체를 소들이 쓰도록, 울타리밖이나 울타리에 겹치지 않도록" / "돼지도
  // 흙바닥 전체를 사용하게" -- 새로 그린 ranch.png의 풀밭/흙바닥이 기존 소/돼지 울타리보다 더 넓어
  // 보여서, 울타리(바깥 펜스)와는 안전 여백을 두면서 풀밭·흙바닥을 더 넓게 쓰도록 소/돼지 우리
  // 크기를 키움. 그리고 "건초 먹이통 남으로 1, 보관상자 남으로 2, 돼지 먹이통 남으로 2 이동".
  // v2026-10-09 (재조정): 실제 ranch.png 픽셀을 분석해서(잔디/흙바닥 색상 영역 자동 탐지) 울타리
  // 안쪽 잔디·흙바닥의 진짜 경계에 맞춘 좌표로 다시 보정 (이전 값은 소가 정문 아치 위로 나가 있었음).
  // v2026-10-09 (2차 재조정): "목장이 길위에 있다/그림이 타일에 딱 안 붙는다" -- ranch.png의 실제
  // 그림이 캔버스 전체가 아니라 안쪽 일부(콘텐츠 영역)에만 그려져 있어서, 기존처럼 캔버스 전체를
  // 부지 크기에 맞춰 늘리면 그림이 부지보다 작게 보여 길과 사이에 빈 틈이 생겼음. 이제 ground()에서
  // 콘텐츠 영역 기준으로 다시 늘려 부지 가장자리까지 꽉 차게 그리므로, 그 그림을 기준으로 소/돼지
  // 우리 등 모든 좌표도 같이 다시 환산함(픽셀 위치 자체는 그대로 유지한 채 타일 좌표만 재계산).
  const PEN = L0 => ({
    cow: { x: L0.x + 1.0, y: L0.y + 0.5, w: 5.6, d: 8.8 },
    pig: { x: L0.x + 8.0, y: L0.y + 6.0, w: 4.0, d: 3.7 },
    box: { x: L0.x + 3.5, y: L0.y + 3.8 },
    hay: { x: L0.x + 10.0, y: L0.y + 2.0 },
    haybox: { x: L0.x + 1.6, y: L0.y + 8.3 },
    pigbox: { x: L0.x + 8.9, y: L0.y + 9.6 }
  });
  const walk = new Map();
  function wander(a, pen, T, trough, hungry, isCow, L0) {
    let st = walk.get(a.id); const now = T;
    const samplePos = () => {
      if (isCow && L0) {
        // v2026-10-09: "소들이 풀밭의 북쪽에만 몰려있어. 목장안 풀밭 전체에 있게 해줘. 울타리는 겹치거나 넘지말고."
        // 소들이 북쪽에만 뭉치지 않고 목장 안 풀밭 전체(북쪽, 중앙, 남쪽, 동남쪽)에 고르게 퍼져서 활동하도록
        // 소의 순번(trough.i) 또는 랜덤에 따라 목장 풀밭 전체 구간(v: 1.2 ~ 8.4)을 골고루 배정
        const cowIdx = (trough && trough.i != null) ? trough.i : Math.floor(Math.random() * 4);
        const sector = (cowIdx + Math.floor(Math.random() * 2)) % 4;
        let vMin = 1.2, vMax = 8.4;
        if (sector === 0) { vMin = 1.2; vMax = 2.8; } // 북쪽 목초지
        else if (sector === 1) { vMin = 2.8; vMax = 4.8; } // 중앙 북부 목초지
        else if (sector === 2) { vMin = 4.8; vMax = 6.6; } // 중앙 남부 목초지
        else { vMin = 6.6; vMax = 8.4; } // 남쪽 목초지 (남쪽 끝까지 활용)

        const chosenV = vMin + Math.random() * (vMax - vMin);
        // 울타리 기울기에 맞춘 안전 여백 (울타리와 겹치거나 넘지 않도록 안전 마진 유지)
        const uMin = 1.5 + (chosenV - 1.0) * 0.14;
        const uMax = 4.7 + (chosenV - 1.0) * 0.18;
        const chosenU = uMin + Math.random() * Math.max(0.6, uMax - uMin);
        return [L0.x + chosenU, L0.y + chosenV];
      }
      if (L0) {
        // Pig: roam across the entire dirt floor evenly
        return [
          L0.x + 8.0 + Math.random() * 4.0,
          L0.y + 6.0 + Math.random() * 3.7
        ];
      }
      return [pen.x + .4 + Math.random() * (pen.w - .8), pen.y + .4 + Math.random() * (pen.d - .8)];
    };
    const clampPos = (spt) => {
      if (isCow && L0) {
        const relV = Math.max(1.2, Math.min(8.4, spt.y - L0.y));
        const uMin = 1.4 + (relV - 1.0) * 0.14;
        const uMax = 4.8 + (relV - 1.0) * 0.18;
        spt.y = L0.y + relV;
        spt.x = Math.max(L0.x + uMin, Math.min(L0.x + uMax, spt.x));
        return;
      }
      if (L0) {
        spt.x = Math.max(L0.x + 8.0, Math.min(L0.x + 12.0, spt.x));
        spt.y = Math.max(L0.y + 6.0, Math.min(L0.y + 9.7, spt.y));
        return;
      }
      spt.x = Math.max(pen.x + .4, Math.min(pen.x + pen.w - .4, spt.x));
      spt.y = Math.max(pen.y + .4, Math.min(pen.y + pen.d - .4, spt.y));
    };

    if (!st) {
      const [initX, initY] = samplePos();
      st = {
        x: initX,
        y: initY,
        wait: 0.5 + Math.random() * 2.5,
        dir: 1,
        lt: now
      };
      st.tx = st.x; st.ty = st.y;
      walk.set(a.id, st);
    }
    const dt = Math.min(.1, Math.max(0, now - st.lt)); st.lt = now; let moving = false;
    // A spot around the trough, clamped strictly inside the animal's pen
    const spot = () => {
      if (isCow && L0) {
        const k = (trough.i || 0) % 4;
        const sx = (trough.x != null ? trough.x : L0.x + 1.6) + 0.4 + (k % 2) * 0.6;
        const sy = (trough.y != null ? trough.y : L0.y + 8.3) - 0.4 + Math.floor(k / 2) * 0.6;
        return [sx, sy];
      }
      const k = (trough.i || 0) % 4;
      const o = [[-.2, .3], [.4, .3], [.1, -.2], [.1, .5]][k];
      let sx = trough.x + o[0], sy = trough.y + o[1];
      sx = Math.max(pen.x + .4, Math.min(pen.x + pen.w - .4, sx));
      sy = Math.max(pen.y + .4, Math.min(pen.y + pen.d - .4, sy));
      return [sx, sy];
    };
    if (hungry && trough.food && !st.toT) { st.toT = 1; [st.tx, st.ty] = spot(); st.wait = 0; }
    if (st.hungry && !hungry && st.toT) st.munch = 3.5;
    st.hungry = hungry;
    if (st.munch > 0) {
      st.munch -= dt;
      const dx = st.tx - st.x, dy = st.ty - st.y, dd = Math.hypot(dx, dy);
      if (dd > .05) {
        const sp = Math.min(dd, (isCow ? .2 : .5) * dt);
        st.x += dx / dd * sp; st.y += dy / dd * sp; moving = true;
      } else st.dir = (trough.x + .4) - st.x - ((trough.y + .4) - st.y) > 0 ? 1 : -1;
      clampPos(st);
      if (st.munch <= 0) {
        st.toT = 0; st.wait = 1;
        [st.tx, st.ty] = samplePos();
      }
      return { x: st.x, y: st.y, dir: st.dir, moving, eating: !moving, wait: st.wait || 0 };
    }
    if (st.toT && !hungry) st.toT = 0;
    if (st.toT) {
      const dx = st.tx - st.x, dy = st.ty - st.y, dd = Math.hypot(dx, dy);
      if (dd > .05) {
        const sp = Math.min(dd, (isCow ? .2 : .45) * dt);
        st.x += dx / dd * sp; st.y += dy / dd * sp; moving = true;
        if (Math.abs(dx - dy) > .01) st.dir = dx - dy > 0 ? 1 : -1;
      } else st.dir = (trough.x + .4) - st.x - ((trough.y + .4) - st.y) > 0 ? 1 : -1;
      clampPos(st);
      return { x: st.x, y: st.y, dir: st.dir, moving, waiting: !moving, wait: st.wait || 0 };
    }
    if (st.wait > 0) st.wait -= dt;
    else {
      const dx = st.tx - st.x, dy = st.ty - st.y, dd = Math.hypot(dx, dy), sp = (isCow ? .32 : .35) * dt;
      if (dd <= sp) {
        st.x = st.tx; st.y = st.ty; st.wait = 1.2 + Math.random() * 2.8;
        [st.tx, st.ty] = samplePos();
      } else {
        st.x += dx / dd * sp; st.y += dy / dd * sp; moving = true;
        if (Math.abs(dx - dy) > .01) st.dir = dx - dy > 0 ? 1 : -1;
      }
    }
    // Strict enclosure safety check: animal NEVER leaves its designated pen
    clampPos(st);
    return { x: st.x, y: st.y, dir: st.dir, moving, wait: st.wait || 0 };
  }

  // 1: 서있는 모습, 2: 앉아 있는 모습, 3: 여물을 먹는 모습, 4 & 5: 걷는 모습
  function drawCowSprite(c, sc, dir, t, moving, hungry, eating, wait, grown) {
    let frame = 1;
    if (eating) frame = 3;
    else if (moving) frame = ((Math.floor(t * 2.2) % 2) === 0) ? 4 : 5; // 소들이 뛰지 않고 차분히 걷는 걸음 속도
    else if (!hungry && wait > 2.0) frame = 2;
    else frame = 1;

    const im = COW_IMGS[frame] || COW_IMGS[1];
    if (im && im.complete && im.naturalWidth > 0) {
      const dw = grown ? 84 : 56;
      const dh = Math.round(dw * (im.naturalHeight / im.naturalWidth));
      c.save();
      c.scale(dir, 1);
      ART.ell(c, 0, 0, dw * 0.36, dw * 0.12, 'rgba(25, 20, 15, 0.28)');
      c.drawImage(im, -dw * 0.5, -dh * 0.83, dw, dh);
      c.restore();
      if (hungry) {
        c.font = 'bold 11px sans-serif'; c.textAlign = 'center';
        c.strokeStyle = '#fff'; c.lineWidth = 2.5; c.strokeText('🌿?', 0, -dh * 0.85);
        c.fillStyle = '#166534'; c.fillText('🌿?', 0, -dh * 0.85);
        c.textAlign = 'start';
      }
      return true;
    }
    return false;
  }

  // 1: 서있는 모습, 2: 앉아 있는 모습, 3: 뒹구는 모습, 4 & 5: 걷는 모습
  function drawPigSprite(c, sc, dir, t, moving, hungry, eating, wait, grown) {
    let frame = 1;
    if (eating) frame = 3;
    else if (moving) frame = ((Math.floor(t * 7) % 2) === 0) ? 4 : 5;
    else if (wait > 3.6) frame = 3; // 뒹구는 모습
    else if (!hungry && wait > 1.8) frame = 2; // 앉아 있는 모습
    else frame = 1; // 서있는 모습

    const im = PIG_IMGS[frame] || PIG_IMGS[1];
    if (im && im.complete && im.naturalWidth > 0) {
      const dw = grown ? 68 : 44;
      const dh = Math.round(dw * (im.naturalHeight / im.naturalWidth));
      c.save();
      c.scale(dir, 1);
      ART.ell(c, 0, 0, dw * 0.34, dw * 0.12, 'rgba(25, 18, 12, 0.28)');
      c.drawImage(im, -dw * 0.5, -dh * 0.83, dw, dh);
      c.restore();
      if (hungry) {
        c.font = 'bold 11px sans-serif'; c.textAlign = 'center';
        c.strokeStyle = '#fff'; c.lineWidth = 2.5; c.strokeText('🥕?', 0, -dh * 0.85);
        c.fillStyle = '#c2410c'; c.fillText('🥕?', 0, -dh * 0.85);
        c.textAlign = 'start';
      }
      return true;
    }
    return false;
  }
  function drawCow(c, sc, dir, t, moving, hungry) {
    c.save(); c.scale(sc * dir, sc); const bob = moving ? Math.abs(Math.sin(t * 3.5)) * 0.8 : Math.sin(t * 2) * .5;
    // Ground shadow
    ART.ell(c, 1, 0, 18, 5.5, 'rgba(30,20,10,.22)');
    // Contoured legs with hooves
    for (const [x, ph] of [[-10, 0], [-4.5, 1], [4.5, 0], [10.5, 1]]) {
      const lg = moving ? Math.sin(t * 3.5 + ph * 3) * 1.2 : 0;
      c.beginPath(); c.moveTo(x - 2, -10); c.lineTo(x - 1.5, -2 + lg); c.lineTo(x + 1.5, -2 + lg); c.lineTo(x + 2, -10); c.closePath();
      c.fillStyle = '#fefdf9'; c.fill(); c.strokeStyle = ART.OUT; c.lineWidth = 1; c.stroke();
      // Hoof
      ART.rrect(c, x - 1.8, -2 + lg, 3.6, 2.5, 1); c.fillStyle = '#3c2e28'; c.fill();
    }
    // Udder
    ART.ell(c, 2, -7 - bob, 4.5, 2.8, '#fbb6ce', ART.OUT, .8);
    for (let u = 0; u < 3; u++) ART.ell(c, 0.5 + u * 1.5, -5 - bob, 0.9, 1.4, '#f472b6');
    // Body (smooth rounded Holstein body)
    const gBody = c.createRadialGradient(2, -16 - bob, 3, 1, -14 - bob, 16);
    gBody.addColorStop(0, '#ffffff'); gBody.addColorStop(0.75, '#fefdfa'); gBody.addColorStop(1, '#e5ded5');
    ART.ell(c, 1, -14 - bob, 15.5, 10, gBody, ART.OUT, 1.4);
    // Distinctive black cow patches
    ART.ell(c, -3.5, -17.5 - bob, 5.5, 4, '#262223');
    ART.ell(c, 7.5, -12 - bob, 4.5, 3.5, '#262223');
    ART.ell(c, 11, -17 - bob, 3.2, 2.5, '#262223');
    // Swishing tail with tuft
    const tailSwing = moving ? Math.sin(t * 3.5) * 1.8 : Math.sin(t * 3) * 1.2;
    c.beginPath(); c.moveTo(15.5, -14 - bob); c.quadraticCurveTo(21, -12 - bob, 19 + tailSwing, -3 - bob);
    c.lineWidth = 1.8; c.strokeStyle = ART.OUT; c.stroke();
    ART.ell(c, 19 + tailSwing, -3 - bob, 2.4, 3.2, '#262223', ART.OUT, .8);
    // Head
    const hx = -15, hy = -18 - bob;
    // Horns
    for (const s2 of [-1, 1]) {
      c.beginPath(); c.moveTo(hx + s2 * 2.5, hy - 6); c.quadraticCurveTo(hx + s2 * 5.5, hy - 11, hx + s2 * 7.5, hy - 9);
      c.lineWidth = 2.2; c.strokeStyle = '#e2c98d'; c.lineCap = 'round'; c.stroke();
    }
    // Head shape
    ART.ell(c, hx, hy, 8.8, 8.2, gBody, ART.OUT, 1.3);
    ART.ell(c, hx + 3.8, hy - 4.5, 3.6, 2.8, '#262223'); // head spot
    // Drooping soft ears
    for (const s2 of [-1, 1]) {
      ART.ell(c, hx + s2 * 8.2, hy - 2, 3.8, 2.2, '#fefdfa', ART.OUT, 1);
      ART.ell(c, hx + s2 * 8.2, hy - 1.8, 2.5, 1.3, '#fbb6ce');
    }
    // Wide soft pink muzzle with dark nostrils & smile
    ART.ell(c, hx - 3.2, hy + 3.6, 6, 4.2, '#fbb6ce', ART.OUT, 1);
    ART.ell(c, hx - 5.2, hy + 3.6, 1.1, 1.1, '#6b2d42');
    ART.ell(c, hx - 1.2, hy + 3.6, 1.1, 1.1, '#6b2d42');
    c.beginPath(); c.arc(hx - 3.2, hy + 5.2, 1.8, 0.2 * Math.PI, 0.8 * Math.PI); c.strokeStyle = '#6b2d42'; c.lineWidth = 0.8; c.stroke();
    // Shiny big chibi anime eyes
    for (const [ex, ey] of [[hx - 2.8, hy - 2.2], [hx + 2.8, hy - 2.2]]) {
      ART.ell(c, ex, ey, 2, 2.4, '#1e1410');
      ART.ell(c, ex - .5, ey - .7, .8, .8, '#ffffff'); // bright shine
      ART.ell(c, ex + .5, ey + .5, .4, .4, '#ffffff');
    }
    // Cheerful rosy blush
    ART.ell(c, hx - 5.5, hy + 1, 2, 1.2, 'rgba(255,100,120,.45)');
    ART.ell(c, hx + 4.5, hy + 1, 2, 1.2, 'rgba(255,100,120,.45)');
    c.restore();
    if (hungry) { c.font = '10px sans-serif'; c.textAlign = 'center'; c.fillStyle = '#000'; c.fillText('🌿?', 0, -34 * sc - 6); c.textAlign = 'start'; }
  }
  function drawCalf(c, sc, dir, t, moving, hungry) {
    c.save(); c.scale(sc * dir, sc); const bob = moving ? Math.abs(Math.sin(t * 3.8)) * 0.8 : Math.sin(t * 2) * .5;
    ART.ell(c, 0, 0, 13, 4.5, 'rgba(30,20,10,.2)');
    for (const [x, ph] of [[-8, 0], [-3, 1], [3.5, 0], [8.5, 1]]) {
      const lg = moving ? Math.sin(t * 3.8 + ph * 3) * 1.1 : 0;
      c.beginPath(); c.moveTo(x - 1.5, -9); c.lineTo(x - 1.2, -2 + lg); c.lineTo(x + 1.2, -2 + lg); c.lineTo(x + 1.5, -9); c.closePath();
      c.fillStyle = '#fefdfa'; c.fill(); c.strokeStyle = ART.OUT; c.lineWidth = 1; c.stroke();
      ART.rrect(c, x - 1.4, -2 + lg, 2.8, 2, 0.8); c.fillStyle = '#3c2e28'; c.fill();
    }
    const gCalf = c.createRadialGradient(1, -12 - bob, 2, 1, -11 - bob, 12);
    gCalf.addColorStop(0, '#ffffff'); gCalf.addColorStop(0.8, '#fbf8f2'); gCalf.addColorStop(1, '#e4dbd0');
    ART.ell(c, 1, -11 - bob, 11.5, 8.2, gCalf, ART.OUT, 1.3);
    ART.ell(c, 3, -13 - bob, 4.2, 3.2, '#262223');
    ART.ell(c, 8, -10 - bob, 3, 2.4, '#262223');
    // Tail
    c.beginPath(); c.moveTo(11, -11 - bob); c.quadraticCurveTo(15, -13 - bob, 14, -5 - bob); c.lineWidth = 1.4; c.strokeStyle = ART.OUT; c.stroke();
    ART.ell(c, 14, -5 - bob, 1.8, 2.4, '#262223', ART.OUT, .7);
    // Big round cute head
    const hx = -11, hy = -14 - bob;
    ART.ell(c, hx, hy, 9.2, 8.8, gCalf, ART.OUT, 1.3);
    ART.ell(c, hx + 3.5, hy - 4.5, 3.5, 2.8, '#262223');
    // Floppy ears
    for (const s2 of [-1, 1]) {
      ART.ell(c, hx + s2 * 8.2, hy - 2, 3.6, 2.4, '#fbf8f2', ART.OUT, .9);
      ART.ell(c, hx + s2 * 8.2, hy - 1.8, 2.4, 1.3, '#fbb6ce');
    }
    // Muzzle & nostrils
    ART.ell(c, hx - 2.8, hy + 3.2, 5.4, 3.8, '#fbb6ce', ART.OUT, .9);
    ART.ell(c, hx - 4.4, hy + 3.2, 0.9, 0.9, '#6b2d42');
    ART.ell(c, hx - 1.2, hy + 3.2, 0.9, 0.9, '#6b2d42');
    // Big glistening baby eyes
    for (const [ex, ey] of [[hx - 2.8, hy - 2], [hx + 2.8, hy - 2]]) {
      ART.ell(c, ex, ey, 2, 2.4, '#1e1410');
      ART.ell(c, ex - .5, ey - .7, 0.9, 0.9, '#ffffff');
      ART.ell(c, ex + .5, ey + .5, 0.4, 0.4, '#ffffff');
    }
    ART.ell(c, hx - 5.2, hy + 1.2, 2.2, 1.3, 'rgba(255,100,120,.5)');
    ART.ell(c, hx + 4.5, hy + 1.2, 2.2, 1.3, 'rgba(255,100,120,.5)');
    c.restore();
    if (hungry) { c.font = '9px sans-serif'; c.textAlign = 'center'; c.fillStyle = '#000'; c.fillText('🌿?', 0, -26 * sc - 6); c.textAlign = 'start'; }
  }
  function drawPig(c, sc, dir, t, moving, hungry) {
    c.save(); c.scale(sc * dir, sc); const bob = moving ? Math.abs(Math.sin(t * 10)) * 1.3 : Math.sin(t * 2) * .4;
    ART.ell(c, 0, 0, 14, 4.5, 'rgba(30,15,10,.2)');
    // Short plump piggy legs with little trotters
    for (const [x, ph] of [[-7.5, 0], [-3, 1], [4, 0], [8.5, 1]]) {
      const lg = moving ? Math.sin(t * 10 + ph * 3) * 1.5 : 0;
      ART.rrect(c, x - 1.8, -7 + lg, 3.6, 7, 1.2); c.fillStyle = '#f8a8b8'; c.fill(); c.strokeStyle = ART.OUT; c.lineWidth = 0.9; c.stroke();
      // Little dark pink trotter hooves
      c.fillStyle = '#d9687e'; c.fillRect(x - 1.8, -1 + lg, 3.6, 1.8);
      c.strokeStyle = '#fff'; c.lineWidth = 0.6; c.beginPath(); c.moveTo(x, -1 + lg); c.lineTo(x, 0.8 + lg); c.stroke();
    }
    // Plump rosy pig body with soft radial shading
    const gPig = c.createRadialGradient(1, -13 - bob, 2, 1, -11 - bob, 14);
    gPig.addColorStop(0, '#ffd6df'); gPig.addColorStop(0.7, '#fba4b7'); gPig.addColorStop(1, '#e88299');
    ART.ell(c, 1, -12 - bob, 14, 9.2, gPig, ART.OUT, 1.3);
    ART.ell(c, -2, -15 - bob, 6.5, 3.5, 'rgba(255,255,255,.4)'); // glossy highlight
    // Springy curly corkscrew tail
    const tw = moving ? Math.sin(t * 10) * 0.4 : 0;
    c.beginPath(); c.arc(15.5, -13 - bob + tw, 3.2, 0, Math.PI * 1.7); c.lineWidth = 1.6; c.strokeStyle = '#d9687e'; c.stroke();
    // Round cute piggy head
    const hx = -12, hy = -14 - bob;
    ART.ell(c, hx, hy, 8.2, 7.8, gPig, ART.OUT, 1.2);
    // Floppy bouncy triangular ears
    for (const s2 of [-1, 1]) {
      c.beginPath(); c.moveTo(hx + s2 * 2.5, hy - 5.5); c.lineTo(hx + s2 * 7.5, hy - 11); c.lineTo(hx + s2 * 7.5, hy - 3.5); c.closePath();
      c.fillStyle = '#f893a9'; c.fill(); c.strokeStyle = ART.OUT; c.lineWidth = 1; c.stroke();
      c.fillStyle = '#ffccd6'; c.beginPath(); c.moveTo(hx + s2 * 3.5, hy - 5); c.lineTo(hx + s2 * 6.5, hy - 9); c.lineTo(hx + s2 * 6.5, hy - 4); c.closePath(); c.fill();
    }
    // Button snout with cute dark nostrils
    ART.ell(c, hx - 4.5, hy + 2.5, 4.2, 3.2, '#f888a0', ART.OUT, 1);
    ART.ell(c, hx - 5.8, hy + 2.5, 1, 1.3, '#731e33');
    ART.ell(c, hx - 3.2, hy + 2.5, 1, 1.3, '#731e33');
    // Twinkling cute chibi eyes
    for (const [ex, ey] of [[hx - 2.5, hy - 2], [hx + 2.5, hy - 2]]) {
      ART.ell(c, ex, ey, 1.6, 2, '#2b151a');
      ART.ell(c, ex - .4, ey - .5, 0.7, 0.7, '#ffffff');
      ART.ell(c, ex + .3, ey + .3, 0.3, 0.3, '#ffffff');
    }
    // Rosy blushing cheeks
    ART.ell(c, hx - 6.5, hy + 0.5, 2, 1.3, 'rgba(255,80,110,.5)');
    ART.ell(c, hx + 4.5, hy + 0.5, 2, 1.3, 'rgba(255,80,110,.5)');
    c.restore();
    if (hungry) { c.font = '10px sans-serif'; c.textAlign = 'center'; c.fillStyle = '#000'; c.fillText('🥕?', 0, -28 * sc - 6); c.textAlign = 'start'; }
  }
  // ground layer (under everything): pasture, mud, fences are drawn in collect() so they sort with people
  function ground(c, T) {
    if (!built(S)) return; const L0 = L(); if (!L0) return; const pn = PEN(L0);
    const ranchReady = RANCH_IMG && RANCH_IMG.complete && RANCH_IMG.naturalWidth > 0;
    if (ranchReady) {
      const [nx, ny] = P(L0.x, L0.y);
      const dw = (RANCH_LOT.w + RANCH_LOT.d) * 32;
      // v2026-10-09: "목장이 길위에 있다/그림이 타일에 딱 안 붙는다" -- ranch.png의 실제 그림(잔디
      // ·울타리 등)은 캔버스(1774x887) 전체를 채우지 않고 안쪽 콘텐츠 영역(약 77,60 ~ 1444,872)에만
      // 그려져 있어서, 캔버스 전체를 부지 크기(dw)에 맞추면 실제 그림이 부지보다 작게 나와 길과
      // 사이에 빈 틈이 생겼음. 이제 콘텐츠 영역 기준으로 늘려서 그림이 부지 가장자리까지 꽉 차게 함.
      const iw = RANCH_IMG.naturalWidth || 1419, ih = RANCH_IMG.naturalHeight || 710;
      // v2026-10-10 (3rd pass): ranch.png은 park/lake/zoo(약 2:1)와 달리 실제 캔버스 비율이
      // 약 1229x819(=1.5:1)로, 게임의 true isometric 타일(항상 2:1)과 비율 자체가 다름 -- 즉
      // 가로폭 대비 그림이 너무 좁게(세로로 길게) 그려져 있어서, uniform scale(가로세로 동일 배율)
      // 로는 타일 네 변에 동시에 딱 맞출 수 없음(가로를 맞추면 세로가 넘치고, 세로를 맞추면 가로에
      // 틈이 생김). 넘침(overflow)이 없는 쪽을 우선해서, 세로(dh) 기준으로 맞추고 가로는 중앙 정렬함
      // -- 그 결과 좌우에 약간의 틈이 남음. 완전히 딱 맞추려면 그림을 2:1 비율 캔버스로 다시 그려야 함.
      const scale = (RANCH_LOT.w + RANCH_LOT.d) * 16 / ih; // uniform, height-constrained (no overflow), left/right gap remains because source art isn't 2:1
      const imgW = iw * scale, imgH = ih * scale;
      const imgX = -RANCH_LOT.d * 32 + (dw - imgW) / 2; // horizontally centered
      const imgY = 0;

      c.save();
      c.translate(nx, ny);
      c.drawImage(RANCH_IMG, imgX, imgY, imgW, imgH);
      c.restore();
      return;
    }
    poly(c, [P(L0.x, L0.y), P(L0.x + RANCH_LOT.w, L0.y), P(L0.x + RANCH_LOT.w, L0.y + RANCH_LOT.d), P(L0.x, L0.y + RANCH_LOT.d)], '#a9d98a');
    const cw = pn.cow; poly(c, [P(cw.x, cw.y), P(cw.x + cw.w, cw.y), P(cw.x + cw.w, cw.y + cw.d), P(cw.x, cw.y + cw.d)], '#8fcb6a');
    const pg = pn.pig; poly(c, [P(pg.x, pg.y), P(pg.x + pg.w, pg.y), P(pg.x + pg.w, pg.y + pg.d), P(pg.x, pg.y + pg.d)], '#b89a72');
    { const m = P(pg.x + pg.w * .7, pg.y + pg.d * .22); ART.ell(c, m[0], m[1], 30, 12, '#8a6a48'); ART.ell(c, m[0] - 6, m[1] - 2, 12, 4, 'rgba(255,255,255,.18)'); }
    for (let i = 0; i < 16; i++) { const q = P(cw.x + .3 + ((i * 37) % 47) / 10, cw.y + .3 + ((i * 53) % 55) / 10); c.fillStyle = 'rgba(60,120,40,.35)'; c.fillRect(q[0], q[1] - 3, 1.5, 3); }
  }
  function fence(c, x0, y0, x1, y1) {
    const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0)));
    for (const z of [6, 12]) { const a = P(x0, y0, z), b = P(x1, y1, z); c.strokeStyle = '#c09060'; c.lineWidth = 2; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); }
    for (let i = 0; i <= n; i++) { const u = i / n, a = P(x0 + (x1 - x0) * u, y0 + (y1 - y0) * u), b = P(x0 + (x1 - x0) * u, y0 + (y1 - y0) * u, 15); c.strokeStyle = '#8a5a33'; c.lineWidth = 2.4; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); }
  }
  function collectDraw(c, T, hits) {
    if (!built(S)) return []; const L0 = L(); if (!L0) return []; const r = ensure(S), pn = PEN(L0), out = [], d = day(S);
    const x0 = L0.x + .2, y0 = L0.y + .2, x1 = L0.x + RANCH_LOT.w - .2, y1 = L0.y + RANCH_LOT.d - .2;
    const ranchReady = RANCH_IMG && RANCH_IMG.complete && RANCH_IMG.naturalWidth > 0;
    if (!ranchReady) {
      out.push({ depth: x0 + y0, fn: () => { fence(c, x0, y0, x1, y0); fence(c, x0, y0, x0, y1); } });
      out.push({ depth: x1 + y1 - .5, fn: () => { fence(c, x1, y0, x1, y1); fence(c, x0, y1, L0.x + 5.4, y1); fence(c, L0.x + 6.8, y1, x1, y1); } });
      out.push({ depth: pn.pig.x + pn.pig.y + pn.pig.d, fn: () => fence(c, pn.pig.x - .5, pn.pig.y, pn.pig.x - .5, pn.pig.y + pn.pig.d) });
    }
    // Wooden signboard - re-anchored 2026-10-08 directly above the entrance arch peak (measured against
    // the arch's actual pixel position in ranch.png), slant reduced to match the arch's own gentle tilt
    // (the arch/fence only lean by ~0.038, not 0.5 - the old 0.5 shear made the plaque look like a diagonal
    // ribbon instead of a nameplate sitting on the arch).
    const sg = { x: L0.x + 1.05, y: L0.y - 0.6 }; out.push({ depth: sg.x + sg.y + .5, fn: () => {
      const m = RP(L0, sg.x, sg.y, 24), lab = '🐄 ' + t('ranchName') + ' Lv' + r.lv; c.font = 'bold 10px sans-serif'; const tw = c.measureText(lab).width + 14;
      c.save();
      c.translate(m[0], m[1]);
      c.fillStyle = '#c8955a'; c.strokeStyle = '#6a4424'; c.lineWidth = 2;
      c.beginPath(); c.rect(-tw / 2, -16, tw, 18); c.fill(); c.stroke();
      c.textAlign = 'center'; c.fillStyle = '#3a2410'; c.fillText(lab, 0, -3);
      c.restore();
      hits.push({ kind: 'ranch', x0: m[0] - tw / 2 - 4, x1: m[0] + tw / 2 + 4, y0: m[1] - 22, y1: m[1] + 24 }); } });
    // Hay stack
    const hy = pn.hay; out.push({ depth: hy.x + hy.y + 1, fn: () => { const q = RP(L0, hy.x + .5, hy.y + .5); if (!ranchReady) { for (const [dx, dy, rr] of [[-8, 0, 9], [8, 0, 9], [0, -9, 9]]) ART.ell(c, q[0] + dx, q[1] + dy - 6, rr, rr * .75, '#e8c56a', 'rgba(140,100,40,.7)', 1); } c.font = 'bold 9px sans-serif'; c.textAlign = 'center'; c.fillStyle = '#fff'; c.lineWidth = 2.5; c.strokeStyle = 'rgba(50,25,10,.85)'; const hn = (prod(S).hay || 0); c.strokeText('🌿' + hn, q[0], q[1] - 18); c.fillText('🌿' + hn, q[0], q[1] - 18); c.textAlign = 'start'; } });

    // Open-top feed troughs positioned exactly where troughs exist in ranch art
    const drawTroughUI = (b2, lab, kind, isCow) => out.push({ depth: b2.x + b2.y + 1.1, fn: () => {
      const q = RP(L0, b2.x + .5, b2.y + .5, 6);
      if (!ranchReady) {
        // Fallback procedural box if image asset not ready
        const x0 = b2.x, y0 = b2.y, w = 1.35, dd = .95, h = 10;
        poly(c, [P(x0, y0, 4), P(x0 + w, y0, 4), P(x0 + w, y0, 4 + h), P(x0, y0, 4 + h)], '#78350f', ART.OUT, 1);
        poly(c, [P(x0, y0 + dd, 4), P(x0 + w, y0 + dd, 4), P(x0 + w, y0 + dd, 4 + h), P(x0, y0 + dd, 4 + h)], '#9a6332', ART.OUT, 1);
      } else {
        // Over the existing graphic trough: draw subtle fill particles
        if (isCow && r.hay > 0) {
          for (let i = 0; i < 8; i++) {
            const ox = (i % 4) * 6 - 9, oy = Math.floor(i / 4) * 4 - 3;
            c.strokeStyle = '#fde047'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(q[0] + ox - 2, q[1] + oy); c.lineTo(q[0] + ox + 3, q[1] + oy - 2); c.stroke();
          }
        } else if (!isCow && pfTotal(r) > 0) {
          const ics = [];
          for (const k in r.pf) { const cr = CROPS.find(q2 => q2.id === k); for (let i = 0; i < Math.min(r.pf[k], 2); i++) ics.push(cr ? cr.icon : '🥕'); }
          c.font = '10px sans-serif'; c.textAlign = 'center';
          ics.slice(0, 4).forEach((ic, i) => c.fillText(ic, q[0] - 10 + i * 7, q[1] + 2));
          c.textAlign = 'start';
        }
      }
      c.font = 'bold 8.5px sans-serif'; c.textAlign = 'center'; c.fillStyle = '#fff'; c.lineWidth = 3; c.strokeStyle = 'rgba(50,25,10,.88)'; c.lineJoin = 'round';
      c.strokeText(lab, q[0], q[1] - 18); c.fillText(lab, q[0], q[1] - 18); c.textAlign = 'start';
      hits.push({ kind, x0: q[0] - 28, x1: q[0] + 28, y0: q[1] - 32, y1: q[1] + 16 });
    } });

    // Cow manger: On left fence at existing trough
    drawTroughUI(pn.haybox, '🌿 ' + t('rHayBox') + ' ' + r.hay, 'rhaybox', true);

    // Pig trough: On upper fence of pig pen at existing trough
    drawTroughUI(pn.pigbox, '🥕 ' + t('rPigBox') + ' ' + pfTotal(r), 'rpigbox', false);

    for (const q of r.drops) {
      let x, y;
      if (q.k === 'milk') {
        const u = q.u == null ? (q.id * .37) % 1 : q.u;
        const v = q.v == null ? (q.id * .61) % 1 : q.v;
        x = L0.x + 1.6 + u * 3.0;
        y = L0.y + 2.2 + v * 5.2;
      } else {
        const pen = pn.pig;
        x = pen.x + .4 + (q.u == null ? (q.id * .37) % 1 : q.u) * (pen.w - .8);
        y = pen.y + .4 + (q.v == null ? (q.id * .61) % 1 : q.v) * (pen.d - .8);
      }
      out.push({ depth: x + y, fn: () => {
        const p2 = RP(L0, x, y);
        ART.ell(c, p2[0], p2[1], 6, 2.5, 'rgba(0,0,0,.15)');
        c.font = '13px sans-serif'; c.textAlign = 'center'; c.fillStyle = '#000';
        c.fillText(RANCH_GOODS[q.k].icon, p2[0], p2[1] - 2 - Math.abs(Math.sin(T * 3 + q.id)) * 2);
        c.textAlign = 'start';
        hits.push({ kind: 'rdrop', id: q.id, x0: p2[0] - 12, x1: p2[0] + 12, y0: p2[1] - 20, y1: p2[1] + 6 });
      } });
    }

    // Storage Trunk / Chest placed on grass near entrance arch
    const bx = pn.box; out.push({ depth: bx.x + bx.y + 1, fn: () => {
      c.save();
      const q = RP(L0, bx.x + .5, bx.y + .5);
      ART.ell(c, q[0], q[1] + 2, 22, 10, 'rgba(0,0,0,.22)');
      // Heavy oak chest base with beveled edges
      rBox(c, L0, bx.x + .08, bx.y + .08, .84, .74, 0, 12, '#854d0e', '#a16207');
      // Arched domed trunk lid
      rBox(c, L0, bx.x + .05, bx.y + .05, .90, .80, 12, 5, '#a16207', '#ca8a04');
      // Dark wrought-iron reinforcing bands across lid
      rBox(c, L0, bx.x + .22, bx.y + .04, .12, .82, 12, 5.5, '#292524', '#44403c');
      rBox(c, L0, bx.x + .66, bx.y + .04, .12, .82, 12, 5.5, '#292524', '#44403c');
      // Golden/brass rivet studs
      for (const rx of [bx.x + .28, bx.x + .72]) {
        const rp0 = RP(L0, rx, bx.y + .86, 14);
        ART.ell(c, rp0[0], rp0[1], 1.2, 1.2, '#fde047');
      }
      // Ornate central brass hasp latch and padlock
      const lockP = RP(L0, bx.x + .5, bx.y + .85, 11);
      c.fillStyle = '#eab308'; c.strokeStyle = '#713f12'; c.lineWidth = 1;
      c.beginPath(); c.rect(lockP[0] - 3.5, lockP[1] - 5, 7, 9); c.fill(); c.stroke();
      ART.ell(c, lockP[0], lockP[1] - 1, 1, 1.5, '#451a03');

      c.font = '11px sans-serif'; c.textAlign = 'center'; c.fillStyle = '#000';
      const pr = prod(S);
      if (pr.milk) c.fillText('🥛', q[0] - 6, q[1] - 18 - Math.abs(Math.sin(T * 3)) * 2);
      if (pr.meat) c.fillText('🥩', q[0] + 6, q[1] - 18 - Math.abs(Math.cos(T * 3)) * 2);

      c.font = 'bold 9px sans-serif'; c.fillStyle = '#fff'; c.lineWidth = 3; c.strokeStyle = 'rgba(50,25,10,.88)';
      const lab = '📦 ' + t('ranchBox'); c.strokeText(lab, q[0], q[1] - 32); c.fillText(lab, q[0], q[1] - 32); c.textAlign = 'start';
      hits.push({ kind: 'ranchbox', x0: q[0] - 28, x1: q[0] + 28, y0: q[1] - 44, y1: q[1] + 8 });
      c.restore();
    } });

    // Animals strictly roaming within their designated zones
    for (const [list, pen, isCow] of [[r.cows, pn.cow, true], [r.pigs, pn.pig, false]]) for (const a of list) {
      const tr = isCow ? { x: pn.haybox.x, y: pn.haybox.y, food: r.hay > 0, big: 1 } : { x: pn.pigbox.x, y: pn.pigbox.y, food: pfTotal(r) > 0 }; tr.i = list.indexOf(a);
      const w = wander(a, pen, T, tr, a.fed !== d, isCow, L0); const grown = d - a.born >= RANCH_GROW;
      const fnFallback = isCow ? (grown ? drawCow : drawCalf) : drawPig;
      const scFallback = isCow ? (grown ? 1.9 : 1.38) : (grown ? 1.35 : .8);
      const isHungry = a.fed !== d && !w.waiting && !w.moving;
      out.push({ depth: w.x + w.y, fn: () => {
        const q = RP(L0, w.x, w.y);
        c.save();
        c.translate(q[0], q[1] + (w.eating ? Math.abs(Math.sin(T * 7)) * 1.5 : 0));
        let drawn = false;
        if (isCow) {
          drawn = drawCowSprite(c, 1, w.dir, T + a.born, w.moving, isHungry, w.eating, w.wait, grown);
        } else {
          drawn = drawPigSprite(c, 1, w.dir, T + a.born, w.moving, isHungry, w.eating, w.wait, grown);
        }
        if (!drawn) {
          fnFallback(c, scFallback, w.dir, T + a.born, w.moving, isHungry);
        }
        if (w.eating) {
          c.font = '9px sans-serif'; c.textAlign = 'center'; c.fillStyle = '#000';
          c.fillText('😋', 0, -32 * (isCow ? (grown ? 1.8 : 1.2) : (grown ? 1.3 : 0.8)) - 4);
          c.textAlign = 'start';
        }
        c.restore();
        c.font = 'bold 8px sans-serif'; c.textAlign = 'center';
        c.fillStyle = a.sex === 'm' ? '#3a7ad9' : '#e0508a';
        c.fillText(a.sex === 'm' ? '♂' : '♀', q[0] + 18, q[1] - 26);
        c.textAlign = 'start';
        hits.push({ kind: 'ranch', x0: q[0] - 22, x1: q[0] + 22, y0: q[1] - 32, y1: q[1] + 8 });
      } });
    }

    // Ranch hands
    r.staff.forEach((m, i) => { const tgt = m.act === 'hay' ? { x: pn.haybox.x + .3, y: pn.haybox.y + .6, w: 1, d: 1 } : m.act === 'pig' ? { x: pn.pigbox.x + .3, y: pn.pigbox.y + .6, w: 1, d: 1 } : m.act === 'collect' ? (m.tk === 'meat' ? pn.pig : pn.cow) : { x: L0.x + 4.2, y: L0.y + 2.2, w: 1.4, d: 1 };
      const st = walk.get('hand' + i) || { x: tgt.x + .5, y: tgt.y + .5, lt: T }; const dt = Math.min(.1, Math.max(0, T - st.lt)); st.lt = T;
      const tx = tgt.x + Math.min(tgt.w - .3, .6 + i * .8), ty = tgt.y + Math.min(tgt.d - .3, .6); const dx = tx - st.x, dy = ty - st.y, dd = Math.hypot(dx, dy), mv = dd > .05; if (mv) { const sp = Math.min(dd, 1.6 * dt); st.x += dx / dd * sp; st.y += dy / dd * sp; st.dir = dx - dy > 0 ? 1 : -1; } walk.set('hand' + i, st);
      out.push({ depth: st.x + st.y + .1, fn: () => { const q = RP(L0, st.x, st.y); const lk = ART.randomHuman(m.seed); lk.hat = 'straw'; lk.kid = false; lk.top = 'tee'; lk.shirt = '#7a9ad0'; lk.apron = '#6a8a4a'; applyStaffArt(lk, m.seed, false);
        c.save(); c.translate(q[0], q[1]); c.scale(st.dir < 0 ? -1 : 1, 1); ART.human(c, lk, 0, T, mv, 'happy'); c.restore();
        if (!mv && m.act && m.act !== 'idle') { c.font = '13px sans-serif'; c.textAlign = 'center'; c.fillStyle = '#000'; c.fillText(m.act === 'hay' ? '🌿' : m.act === 'pig' ? '🥕' : m.tk === 'meat' ? '🥩' : '🥛', q[0] + 10, q[1] - 62 + Math.sin(T * 5) * 2); c.textAlign = 'start'; } } });
    });
    return out;
  }
  return { ensure, breedInfo, apply, tick, ground, collect: collectDraw, built, pigFood, hayFee, pfTotal, stockPigBox, pickAll };
})();
