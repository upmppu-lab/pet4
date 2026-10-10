// ============ Pet Shop core rules v3 (solo device or host) ============
const HAB_KINDS = ['dogbed', 'catbed', 'hutch', 'cage', 'birdcage', 'tank', 'terrarium'];
const HAB_ICON = { dogbed: '🐶', catbed: '🐱', hutch: '🏡', cage: '🐹', birdcage: '🪺', tank: '🐠', terrarium: '🦎' };
const CLOCK = { open: 8 * 60, close: 18 * 60, prep: 7 * 60, lastIn: 17 * 60 + 40, speed: 1 }; // 1 game minute per real second
const GOODS = { shelf: { price: 15 }, supshelf: { price: 30 }, toyshelf: { price: 25 }, clothrack: { price: 40 } };
const RATE = { 7: .3, 8: .35, 9: .55, 10: .8, 11: 1.1, 12: 1.5, 13: 1.3, 14: .9, 15: .85, 16: 1.05, 17: 1.4, 18: 1.1, 19: .8, 20: .55, 21: .35, 22: .2, 23: .12 };
const G = (() => {
  const pad = n => String(n).padStart(2, '0');
  const dayKey = (d = new Date()) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const rnd = (a, b) => a + Math.random() * (b - a);
  const rint = (a, b) => Math.floor(rnd(a, b + 1));
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  const HOUSE_MAX = 5;
  const houseCost = lv => [0, 120, 320, 800, 1800][lv] || 0;
  const houseDecay = lv => 1 - 0.1 * (lv - 1);
  const houseGrow = lv => 1 + 0.15 * (lv - 1);
  const housePrice = lv => 1 + 0.05 * (lv - 1);
  const kindOf = sp => ART.habitatKind(sp);

  function newState(shop, owner) {
    const s = {
      v: 4, shop, owner, coins: 1000, xp: 0, level: 1, slots: 3,
      pets: [null, null, null], houses: [1, 1, 1], breeding: [], deliveries: [], offers: [], offerDay: 0,
      customers: [], nextCust: 6,
      decor: {}, up: {}, food: { small: 0, fish: 0, bird: 0, reptile: 0, cat: 0, dog: 0 }, feed: { 'seed:1': 6, 'hay:1': 4, 'flake:1': 6, 'birdseed:1': 4 }, parcels: [], kits: 0,
      book: {}, stats: { sold: 0, earned: 0, fed: 0, cleaned: 0, played: 0, groomed: 0, bought: 0, born: 0, served: 0 },
      daily: null, login: { last: null, streak: 0 }, events: [], seq: 1,
      lastTick: Date.now(), created: Date.now(),
      clock: { day: 1, m: CLOCK.prep, ph: 'prep' }, today: null,
      rep: 20, letters: [], outbox: [], messes: [], event: null, stray: null, guests: [], nextEvt: 60, strayDay: 0, lseq: 1,
      room: { w: 8, h: 8, floor: 'wood', wall: 'cream' }, styles: {},
      items: [
        { id: 1, k: 'counter', x: 5, y: 3 }, { id: 2, k: 'shelf', x: 2, y: 0, stock: 10, prod: 'treat' }, { id: 3, k: 'plant', x: 0, y: 0 },
        { id: 4, k: 'hab', x: 0, y: 2, slot: 0, kind: 'cage' }, { id: 5, k: 'hab', x: 0, y: 4, slot: 1, kind: 'tank' }, { id: 6, k: 'hab', x: 5, y: 0, slot: 2, kind: 'birdcage' }
      ], iseq: 10
    };
    resetToday(s); ensureDaily(s); ensureOffers(s, true);
    return s;
  }
  function resetToday(s) { s.today = { sold: 0, earned: 0, served: 0, lost: 0, shop: 0, tips: 0, best: null }; }

  // ---------- room layout ----------
  const FP = k => (FURN.DEF[k] || { w: 1, d: 1 });
  const FPI = it => FURN.fp(it);
  const NOROT = {};
  // the tiles in front of the counter where paying customers queue: it faces south, or east once rotated (rot = footprint turned 1x2)
  const cqAt = (x, y, rot) => rot ? [{ x: x + 1, y }, { x: x + 1, y: y - 1 }, { x: x + 2, y: y - 1 }, { x: x + 2, y: y - 2 }] : [{ x, y: y + 1 }, { x: x - 1, y: y + 1 }, { x: x - 1, y: y + 2 }, { x: x - 2, y: y + 2 }];
  function blocked(s, x, y, w, d, ignoreId, k) {
    const flatNew = k && FP(k).flat;
    const W = s.room.w, H = s.room.h;
    if (x < 0 || y < 0 || x + w > W || y + d > H) return 'out';
    const cq = k === 'counter' ? cqAt(x, y, w < d) : counterQueue(s);
    for (let i = 0; i < w; i++) for (let j = 0; j < d; j++) {
      const tx = x + i, ty = y + j;
      if (!flatNew && ((ty === H - 2 && tx >= W - 3) || (tx === W - 1 && ty >= H - 3))) return 'door';
      if (!flatNew && k !== 'counter' && cq.some(q => q.x === tx && q.y === ty)) return 'queue';
    }
    if (k === 'counter') for (const q of cq) { if (q.x < 0 || q.y < 0 || q.x >= W || q.y >= H) return 'queue'; if (s.items.some(it => it.id !== ignoreId && !FPI(it).flat && q.x >= it.x && q.x < it.x + FPI(it).w && q.y >= it.y && q.y < it.y + FPI(it).d)) return 'queue'; }
    for (const it of s.items) {
      if (it.id === ignoreId) continue;
      const f = FPI(it); if (!!f.flat !== !!flatNew) continue;
      if (x < it.x + f.w && x + w > it.x && y < it.y + f.d && y + d > it.y) return 'overlap';
    }
    return false;
  }
  // tiles in front of the counter where paying customers queue
  function counterQueue(s) {
    const c = s.items.find(i => i.k === 'counter'); if (!c) return [];
    return cqAt(c.x, c.y, !!c.f);
  }
  function freeSpot(s, k) {
    const f = FP(k), W = s.room.w, H = s.room.h, c = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) c.push({ x, y, sc: Math.min(x, y) * 10 + x + y });
    c.sort((a, b) => a.sc - b.sc);
    for (const p of c) if (!blocked(s, p.x, p.y, f.w, f.d, null, k)) return p;
    return null;
  }
  function addItem(s, k, extra) {
    const p = freeSpot(s, k); if (!p) return null;
    const it = Object.assign({ id: ++s.iseq, k, x: p.x, y: p.y }, extra || {});
    s.items.push(it); return it;
  }
  const slotsOfItem = it => it.slots || [it.slot];
  // v1.11: pets that live shut in a cage / tank / terrarium / birdcage do their business in there (the enclosure gets dirty); dogs, cats & other roamers anywhere
  // v1.19: how often a pet poops (1 = about once per game hour): its own rhythm 0.3..1.3 (from its id), times appetite -- a pet that ate little barely goes, a hungry one not at all
  const poopRate = p => { let h = 0; const id = String(p.id); for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0; const own = .3 + (h % 100) / 100; return own * (p.hunger >= 60 ? 1 : p.hunger >= 35 ? .4 : 0); };
  const confined = sp => !ART.roams(sp) || kindOf(sp) === 'cage';
  // v1.13b: a shelf holds EVERY product it carries, each with its own stock (max SHELF_CAP). it.inv = { prodId: n };
  // it.stock (total) and it.prod (the fullest product) are kept in sync for the drawing / older code paths
  const SHELF_CAP = 12;
  function shelfSync(it) { const inv = it.inv || (it.inv = {}); let tot = 0, best = null; for (const k in inv) { if (!(inv[k] > 0)) { delete inv[k]; continue; } tot += inv[k]; if (!best || inv[k] > inv[best]) best = k; } it.stock = tot; if (best) it.prod = best; return it; }
  function shelfTake(it, pid, n) { const inv = it.inv || {}; const k = Math.min(n, inv[pid] || 0); inv[pid] = (inv[pid] || 0) - k; shelfSync(it); return k; }
  const shelfPick = it => { const ks = Object.keys(it.inv || {}).filter(k => it.inv[k] > 0); return ks.length ? ks[Math.floor(Math.random() * ks.length)] : null; };
  const habItem = (s, slot) => s.items.find(i => i.k === 'hab' && slotsOfItem(i).includes(slot));
  const habById = (s, id) => s.items.find(i => i.k === 'hab' && i.id === id);
  const habKind = (s, slot) => {
    const h = habItem(s, slot);
    if (!h) return null;
    if (h.kind === 'catbed' || (h.model && String(h.model).startsWith('cat'))) return 'catbed';
    if (h.kind === 'dogbed' || (h.model && String(h.model).startsWith('dog'))) return 'dogbed';
    if (h.kind === 'bed') {
      const p = s.pets && s.pets[slot];
      h.kind = (p && kindOf(p.sp) === 'catbed') ? 'catbed' : 'dogbed';
      return h.kind;
    }
    return h.kind;
  };
  function reservedSlots(s) {
    const r = new Set();
    s.breeding.forEach(b => (b.slots || []).forEach(x => r.add(x)));
    s.deliveries.forEach(d => r.add(d.slot));
    return r;
  }
  function freeSlotsKind(s, kind) {
    const r = reservedSlots(s), out = [];
    s.pets.forEach((p, i) => { if (!p && !r.has(i) && habKind(s, i) === kind) out.push(i); });
    return out;
  }
  const freeSlots = s => { const r = reservedSlots(s); return s.pets.filter((p, i) => !p && !r.has(i)).length; };

  function migrate(s) {
    if (!s.houses) s.houses = s.pets.map(() => 1);
    while (s.houses.length < s.slots) s.houses.push(1);
    if (!s.breeding) s.breeding = [];
    if (s.stats.born == null) s.stats.born = 0;
    s.pets.forEach(p => { if (p) { if (!p.sex) p.sex = Math.random() < .5 ? 'm' : 'f'; if (p.bcd == null) p.bcd = 0; if (p.pat == null) p.pat = 0; if (p.stars == null) p.stars = 0; } });
    if (!s.room) {
      s.room = { w: 8, h: 8, floor: 'wood', wall: 'cream' }; s.styles = {}; s.iseq = 10;
      s.items = [{ id: 1, k: 'counter', x: 5, y: 3 }, { id: 2, k: 'shelf', x: 2, y: 0 }];
      s.pets.forEach((p, i) => addItem(s, 'hab', { slot: i }));
      Object.keys(s.decor).forEach(k => addItem(s, k));
    }
    s.items.forEach(it => { if (it.k === 'hab' && (!it.kind || it.kind === 'bed')) { const p = s.pets[it.slot]; it.kind = p ? kindOf(p.sp) : (it.model && String(it.model).startsWith('cat') ? 'catbed' : 'dogbed'); } });
    if (!s.deliveries) s.deliveries = [];
    if (!s.offers) { s.offers = []; s.offerDay = 0; }
    if (!s.clock) s.clock = { day: 1, m: CLOCK.prep, ph: 'prep' };
    if (!s.today) resetToday(s);
    if (s.stats.served == null) s.stats.served = 0;
    s.customers = (s.customers || []).filter(c => c.st);
    s.breeding.forEach(b => { if (!b.slots) b.slots = []; });
    if (s.rep == null) { s.rep = 20; s.letters = []; s.outbox = []; s.messes = []; s.event = null; s.stray = null; s.guests = []; s.nextEvt = 60; s.strayDay = 0; s.lseq = 1; }
    s.items.forEach(it => { if (GOODS[it.k] && it.stock == null) it.stock = 10; if (GOODS[it.k] && !PRODUCTS.some(x => x.id === it.prod && x.shelf === it.k)) { it.prod = PRODUCTS.find(x => x.shelf === it.k).id; it.stock = Math.min(it.stock, 6); }
      if (GOODS[it.k] && !it.inv) { it.inv = {}; if (it.prod && it.stock > 0) it.inv[it.prod] = Math.min(SHELF_CAP, it.stock); } if (GOODS[it.k]) shelfSync(it); });
    if (!s.feed) {
      s.feed = {}; const M = { small: ['seed', 'hay'], fish: ['flake'], bird: ['birdseed'], reptile: ['turtle', 'insect'], cat: ['cat'], dog: ['dog'] };
      for (const c in (s.food || {})) if (s.food[c] > 0) for (const l of M[c] || []) s.feed[l + ':1'] = (s.feed[l + ':1'] || 0) + s.food[c];
    }
    if (!s.parcels) s.parcels = [];
    s.letters = (s.letters || []).filter(l => !(l.kind === 'daily' && !l.adopter));
    if (!s.adopters) s.adopters = (s.letters || []).filter(l => !l.mine && l.kind !== 'daily' && l.from).map(l => ({ name: l.from, seed: l.seed, pet: l.pet, sp: l.sp, coat: l.coat || 0, day: l.day || 1 })).slice(0, 30);
    s.pets.forEach(p => { if (p) fixPet(p); });
    ensureOffers(s);
    EXTRA.migrate(s); HOME.ensure(s); TOWN.ensure(s); // PET TOWN
	// v1.101: 기존 벡터 종 → 새 PNG 종 (A안)
const SP_MAP = {
  hamster: 'hamster_brown',
  husky: 'husky_black',
  maltese: 'maltese_white',
  maltese_cream: 'maltese_white',
  maltese_brown: 'maltese_brown2',
  shiba: 'shiba_sinu_black',
  shiba_black: 'shiba_sinu_black_brown',
  shiba_red: 'shiba_sinu_black',
  shiba_sinu: 'shiba_sinu_black',
  golden: 'retriever_brown',
  labrador: 'retriever_brown',
  dalmatian: 'dalmatian_black',
  poodle: 'poodle_brown',
  guinea: 'guineapig_mix',
};
const _mapSp = obj => { if (obj) obj.sp = SP_MAP[obj.sp] || obj.sp; };
// 모든 펫 위치 순회
(s.pets || []).forEach(_mapSp);
if (s.home && s.home.pets) s.home.pets.forEach(_mapSp);
if (s.shelter && s.shelter.pets) s.shelter.pets.forEach(_mapSp);
if (s.cafe && s.cafe.pets) s.cafe.pets.forEach(_mapSp);
if (s.hosp && s.hosp.patients) s.hosp.patients.forEach(_mapSp);
// 배송 중인 펫도 변환
if (s.deliveries) s.deliveries.forEach(d => { if (d && SP_MAP[d.sp]) d.sp = SP_MAP[d.sp]; });
// 온라인 주문
if (s.online) s.online.forEach(o => { if (o && SP_MAP[o.sp]) o.sp = SP_MAP[o.sp]; });
// 오퍼 (마켓 분양 후보)
if (s.offers) s.offers.forEach(o => { if (o && SP_MAP[o.sp]) o.sp = SP_MAP[o.sp]; });
// 도감도 함께 갱신
if (s.book) {
  const newBook = {};
  for (const k in s.book) {
    const nk = SP_MAP[k] || k;
    newBook[nk] = 1;
  }
  s.book = newBook;
}
    s.v = 4; return s;
  }

  function fixPet(p) {
    if (!p.trait) p.trait = randTrait();
    if (p.stress == null) { p.stress = Math.max(0, 60 - (p.happy || 60)); p.bored = Math.max(0, 70 - (p.happy || 60)); }
    if (!p.lv) { p.lv = 1; p.exp = 0; }
    if (p.tcd == null) p.tcd = 0;
    p.happy = 100 - (p.stress + p.bored) / 2;
    return p;
  }
  const decorPts = s => { let extra = 0; const base = DECOR.reduce((a, d) => { const n = +s.decor[d.id] || 0; if (n > 1) extra += (n - 1) * d.pts * .5; return a + (n ? d.pts : 0); }, 0); return base + Math.min(30, Math.floor(extra)) + HOME.pts(s); };
  const cond = p => (p.hunger + p.clean + (100 - p.stress) + (100 - p.bored)) / 4;
  function gainExp(s, p, n) {
    if (!p || p.lv >= PET_MAX_LV) return;
    p.exp += n;
    while (p.lv < PET_MAX_LV && p.exp >= petLvNeed(p.lv)) {
      p.exp -= petLvNeed(p.lv); p.lv++;
      const cat = (SPECIES[p.sp] || {}).cat || 'small';
      const tr = (TRICKS[cat] || TRICKS.small).find(([, l]) => l === p.lv);
      ev(s, { k: 'petLevel', pet: p.name, pid: p.id, lv: p.lv, trick: tr ? tr[0] : null });
      if (p.lv === 7) EXTRA.photo(s, p, true);
    }
  }
  const addRep = (s, n) => { const tr = repTier(s.rep); if (n > 0 && tr > 0) n /= 1 + tr * .8; else if (n < 0 && tr > 0) n /= 1 + tr * .3; s.rep = clamp((s.rep || 0) + n, 0, REP_MAX); };
  const unlocked = s => SPECIES_RAW.filter(r => TOWN_SP[r[0]] ? TOWN.bestPop(s) >= TOWN_SP[r[0]] : r[2] <= s.level).map(r => r[0]); // PET TOWN: some breeds only come to a big enough town
  const slotOf = (s, pid) => s.pets.findIndex(p => p && p.id === pid);
  const isOpen = s => s.clock.ph === 'open';

  function price(s, p, c) {
    const sp = SPECIES[p.sp] || { sell: 500, cat: 'small', grow: 3, cost: 200 };
    let v = sp.sell * (0.6 + 0.6 * cond(p) / 100) * (1 + 0.3 * (p.stars || 0)) * (1 + 0.05 * ((p.lv || 1) - 1)) * (p.rescued ? .6 : 1);
    if (p.groomed) v *= 1.2;
    if (rareOf(p.coat || 0)) v *= RARE_SELL_MUL;
    v *= housePrice(s.houses[slotOf(s, p.id)] || 1);
    v *= 1 + Math.min(BAL.DECOR_CAP, decorPts(s) * 0.01); // v9.98: was up to +40%
    v *= 1 + 0.04 * repTier(s.rep);
    v *= 1 + careerBonus(s); // Lv31-100: +1% per 5 levels
    if (c) v *= c.mul;
    v *= 1 + BAL.TOP_K * Math.max(0, Math.min(1, (sp.sell - 1000) / 940)); // v9.86 premium breeds worth more
    v *= BAL.SALE_K; // v9.85 balance: every pet sale a bit lower
    return Math.round(v);
  }
  // rare-coat pets are VIP-only: a VIP wants nothing else, everybody else (walk-ins, breeders, online buyers) can't have them
  const matches = (c, p) => !!p && p.grow >= 1 && !p.fav && c.st === 'want' && !p.escaped &&
    (c.type === 'vip' ? !!rareOf(p.coat || 0) : !rareOf(p.coat || 0) &&
    (c.type === 'breeder' ? (p.stars || 0) > 0 : c.type === 'collector' ? p.sp === c.sp && ((p.lv || 1) >= 3 || (p.stars || 0) > 0) : (!c.sp || p.sp === c.sp) && (!c.cat || (SPECIES[p.sp] && SPECIES[p.sp].cat === c.cat))));
  const BADSET = { apt: ['playful', 'energetic'], busy: ['playful', 'energetic', 'glutton'], elder: ['energetic', 'playful'], kids: ['shy', 'lazy'], walk: ['shy', 'lazy', 'calm'], cuddle: ['shy'], smart: ['lazy'], foodie: [] };
  function matchKind(c, p) {
    if (c.type === 'breeder' || c.type === 'collector') return 'great';
    const need = NEEDS.find(n => n.id === c.need); if (!need) return 'ok';
    if (need.traits.includes(p.trait)) return 'great';
    if ((BADSET[c.need] || []).includes(p.trait)) return 'bad';
    return 'ok';
  }

  function ev(s, e) {
    e.id = s.seq++; e.t = Date.now();
    s.events.push(e);
    if (s.events.length > 40) s.events.splice(0, s.events.length - 40);
  }
  function addXp(s, n) {
    s.xp += n;
    while (s.level < MAX_LEVEL && s.xp >= xpNeed(s.level)) {
      s.xp -= xpNeed(s.level); s.level++;
      const news = SPECIES_RAW.filter(r => r[2] === s.level && !TOWN_SP[r[0]]).map(r => r[0]);
      s.coins += 50 * s.level;
      const tk = s.level > 30 && s.level % 10 === 0 ? 1 : 0; if (tk && s.x) s.x.tickets = (s.x.tickets || 0) + tk;
      ev(s, { k: 'level', n: s.level, news, bonus: 50 * s.level, tk, cb: Math.round(careerBonus(s) * 100) });
    }
  }

  // ---------- daily quests & attendance (real calendar) ----------
  function ensureDaily(s) {
    const today = dayKey();
    if (!s.daily || s.daily.date !== today) {
      const L = s.level;
      const pool = [
        { k: 'feed', n: rint(5, 9) }, { k: 'clean', n: rint(4, 7) }, { k: 'play', n: rint(5, 9) },
        { k: 'sell', n: rint(2, 4) }, { k: 'earn', n: Math.round((250 + L * 120) / 50) * 50 },
        { k: 'buy', n: rint(1, 2) }, { k: 'born', n: rint(1, 2) }, { k: 'serve', n: rint(4, 8) }, { k: 'trick', n: rint(2, 4) }, { k: 'mini', n: rint(2, 4) }, { k: 'great', n: rint(1, 2) }
      ];
      if (L >= 3) pool.push({ k: 'groom', n: rint(1, 3) });
      const qs = [];
      while (qs.length < 3) { const q = pick(pool); if (!qs.find(x => x.k === q.k)) qs.push({ ...q, p: 0, done: false, claimed: false, r: 60 + L * 30 }); }
      s.daily = { date: today, quests: qs };
      if (s.stats.days == null) s.stats.days = 0;
      s.stats.days++;
    }
    if (s.login.last !== today) {
      const y = new Date(); y.setDate(y.getDate() - 1);
      s.login.streak = s.login.last === dayKey(y) ? s.login.streak + 1 : 1;
      s.login.last = today;
      // v1.22: attendance moved to game days (see the day rollover)
    }
  }
  function qp(s, k, n = 1) {
    EXTRA.qp(s, k, n);
    if (!s.daily) return;
    s.daily.quests.forEach(q => { if (q.k === k && !q.done) { q.p = Math.min(q.n, q.p + n); if (q.p >= q.n) q.done = true; } });
  }

  // ---------- adoption offers ----------
  function mkOffer(s) {
    const un = unlocked(s);
    // favour newer species a bit
    const sp = Math.random() < .4 ? un[Math.max(0, un.length - 1 - rint(0, 3))] : pick(un);
    const r = Math.random(), stars = r < .05 ? 2 : r < .28 ? 1 : 0;
    const rare = Math.random() < .035; return { id: s.seq++, sp, coat: rare ? rareCoat() : 1 + Math.floor(Math.random() * 1e9), sex: Math.random() < .5 ? 'm' : 'f', stars, cost: Math.round(SPECIES[sp].cost * (1 + .5 * stars) * (rare ? 2.2 : 1)), cd: 0 };
  }
  function ensureOffers(s, force) {
    if (!force && s.offerDay === s.clock.day && s.offers.length) return;
    s.offerDay = s.clock.day;
    const n = Math.min(7, 4 + Math.floor(lvE(s) / 4));
    s.offers = []; for (let i = 0; i < n; i++) s.offers.push(mkOffer(s));
  }

  // ---------- customers ----------
  function spawnCustomer(s) {
    const pat = rnd(75, 115) * (s.up.sign ? 1.5 : 1);
    const lang = s.lang || 'ko';
    const sk = TOWN.spendK(s), bp = TOWN.bestPop(s); // PET TOWN: a bigger, happier town spends a bit more
    const base = { id: s.seq++, seed: rint(1, 1e6), vip: false, pat, max: pat, t: 0, name: pick(CUST_NAMES[lang] || CUST_NAMES.ko), type: 'normal', mul: sk };
    { const hm = Math.random() < .8 && TOWN.pickHome(s); if (hm) { const d = TOWN.doorOf(hm);
      const dist = (typeof World !== 'undefined' && World.pathDist) ? World.pathDist(d.x, d.y, s.room.w, s.room.h / 2) : Math.hypot(d.x - s.room.w, d.y - s.room.h / 2);
      const wk = dist / 1.6; base.home = hm.id; base.pat += wk; base.max += wk;
      // v2026-10-08: when we can, this customer IS a specific, persistent town resident (same face/name as when they're out walking the streets) --
      // so a purchase here shows up later in their own "my pets" collection, and they can keep coming back to buy more (owning one never blocks another).
      const res = typeof TOWN.pickResidentOf === 'function' ? TOWN.pickResidentOf(s, hm) : null;
      if (res) { base.residentId = res.id; base.seed = res.seed; base.name = res.name; }
    } } // walks over from their house: the walk does not eat their patience
    const dp = decorPts(s), R = s.rep || 0;
    const roll = Math.random();
    if ((bp >= 250 || (dp >= 30 && R >= 70)) && roll < (bp >= 250 ? .08 : .05)) { base.type = 'celeb'; base.mul = 1.5 * sk; } // v9.85 balance: was 2
    else if ((bp >= 180 || dp >= 12 || R >= 40) && roll < (bp >= 180 ? .3 : .2) + .05 * TOWN.has(s, 'pethotel')) { /* 🏨 pet hotel brings well-off guests */ base.type = 'rich'; base.mul = 1.3 * sk; } // was 1.6
    const hasItem = k => s.items.some(i => i.k === k);
    const r2 = Math.random();
    // service customers
    if (hasItem('groomtable') && r2 < .12) { s.customers.push(Object.assign(base, { kind: 'groom', st: 'gwait', vsp: pick(unlocked(s).filter(x => ['dog', 'cat'].includes(SPECIES[x].cat))) || 'shiba', pat: 140, max: 140 })); return; }
    if (hasItem('hotel') && r2 < .2 && s.guests.length < 2 * s.items.filter(i => i.k === 'hotel').length && s.clock.m < 14 * 60) {
      s.customers.push(Object.assign(base, { kind: 'hotel', st: 'pay', amount: 120 + lvE(s) * 10, waited: 0, vsp: pick(unlocked(s).filter(x => ART.roams(x))) || 'shiba', pat: 90, max: 90 })); return; }
    const shelves = s.items.filter(i => GOODS[i.k]);
    if (shelves.length && r2 < .45) { s.customers.push(Object.assign(base, { kind: 'shop', st: 'shop', browse: rnd(10, 18) })); return; }
    const present = s.pets.filter(p => p && p.grow >= 1);
    if (present.some(p => p.stars) && s.level >= 5 && Math.random() < .08) {
      s.customers.push(Object.assign(base, { kind: 'adopt', type: 'breeder', st: 'want', mul: 2, need: null, cat: null, sp: null })); return;
    }
    const un = unlocked(s);
    // PET TOWN: a collector (60+ residents) wants one exact breed at Lv3+ (or ⭐), pays 1.8x, and has little patience
    if (bp >= 60 && base.type === 'normal' && Math.random() < .08 + .04 * TOWN.has(s, 'library')) { /* 📚 library: more collectors */
      const own = present.filter(p => !rareOf(p.coat || 0)), csp = own.length && Math.random() < .6 ? pick(own).sp : pick(un);
      const c = Object.assign(base, { kind: 'adopt', type: 'collector', st: 'want', sp: csp, cat: null, need: pick(NEEDS).id, vip: true, mul: +(1.8 * sk).toFixed(2), pat: base.pat - pat + 80, max: base.max - pat + 80 });
      if (!s.pets.some(p => matches(c, p))) { c.browse = rnd(18, 26); c.willLeave = true; }
      s.customers.push(c); return;
    }
    let sp = null, cat = null;
    const r3 = Math.random();
    if (present.length && r3 < .55) { const p = pick(present); cat = (SPECIES[p.sp] || {}).cat; if (Math.random() < .2) sp = p.sp; }
    else if (r3 < .85) { const x = pick(un); cat = (SPECIES[x] || {}).cat; }
    const need = pick(NEEDS).id;
    const c = Object.assign(base, { kind: 'adopt', st: 'want', cat, sp, need, vip: base.type !== 'normal' });
    if (bp >= 20 && c.type === 'normal' && Math.random() < .2) { c.type = 'family'; c.sp = null; c.cat = pick(['small', 'cat', 'dog', 'bird']); c.pat += 40; c.max += 40; } // PET TOWN: families (20+ residents) take their time and buy a starter kit too
    c.mul = +(base.mul * rnd(1, 1.15) * (sp ? 1.2 : 1)).toFixed(2);
    const any = s.pets.some(p => matches(c, p));
    if (!any) { c.browse = rnd(16, 28); c.willLeave = Math.random() < .55; }
    // playpen watchers
    if (s.items.some(i => isPenKind(i.k)) && s.pets.some(p => p && p.pen)) {
      const bestIt = s.items.filter(i => isPenKind(i.k)).sort((a, b) => ((PEN_INFO[b.k] && PEN_INFO[b.k].lv) || 1) - ((PEN_INFO[a.k] && PEN_INFO[a.k].lv) || 1))[0];
      const pi = (bestIt && PEN_INFO[bestIt.k]) || PEN_INFO.playpen;
      c.watch = rnd(8, 14) + ((pi.lv || 1) - 1) * 2.5;
      c.willLeave = c.willLeave && Math.random() < .5;
      if (pi && pi.tipBonus > 1) c.mul = +(c.mul * pi.tipBonus).toFixed(2);
    }
    s.customers.push(c);
  }
  // ---------- VIP visits (v9.72) ----------
  // Once or twice a business day a VIP walks in. VIPs are the only buyers of rare-coat (✨) pets and pay +30% on top of the
  // rare price. A shop that owns a rare pet always gets one VIP a day (35% chance of a second); otherwise 40% of days.
  function stepVip(s) {
    const day = s.clock.day;
    if (s.vipDay !== day) {
      s.vipDay = day; s.vipAt = [];
      const has = s.pets.some(p => p && rareOf(p.coat || 0)), n = (has || Math.random() < .4 ? 1 : 0) + (has && Math.random() < .35 ? 1 : 0);
      for (let i = 0; i < n; i++) s.vipAt.push(rint(Math.max(s.clock.m + 20, CLOCK.open + 45), CLOCK.lastIn - 30));
      s.vipAt.sort((a, b) => a - b);
    }
    if (s.vipAt && s.vipAt.length && s.clock.m >= s.vipAt[0] && !s.customers.some(c => c.type === 'vip')) { s.vipAt.shift(); spawnVip(s); }
  }
  function spawnVip(s) {
    const lang = s.lang || 'ko', pat = 240 * (s.up.sign ? 1.5 : 1);
    const c = { id: s.seq++, seed: rint(1, 1e6), name: pick(CUST_NAMES[lang] || CUST_NAMES.ko), type: 'vip', vip: true, kind: 'adopt', st: 'want', cat: null, sp: null, need: pick(NEEDS).id, mul: VIP_MUL, pat, max: pat, t: 0 };
    if (!s.pets.some(p => matches(c, p))) { c.willLeave = true; c.browse = 45; } // no rare pet ready: looks around, then leaves
    s.customers.push(c);
    ev(s, { k: 'vipIn', cid: c.id, has: !c.willLeave });
    return c;
  }
  function custLeave(s, c, why) {
    s.customers = s.customers.filter(x => x.id !== c.id);
    if (why === 'sorry') TOWN.mood(s, -.15, why); // v1.17: politely sent away -- only a small dent (waiting until they give up costs much more)
    if (why === 'nomatch' || why === 'lost' || why === 'nostock') TOWN.mood(s, why === 'lost' ? -1 : why === 'nomatch' ? -.6 : -.4, why); // PET TOWN: unhappy customers = unhappy town
    if (why === 'lost') s.today.lost++;
    ev(s, { k: 'custLeft', cid: c.id, why, vip: c.type === 'vip' });
  }
  function pay(s, c, by, auto) {
    let amount = c.amount || 0, tip = 0;
    if (auto) amount = Math.round(amount * .8);
    else if ((c.waited || 0) < 15) tip = Math.round(amount * BAL.TIP); // v9.98: was 10%
    tip += c.trickTip || 0;
    s.coins += amount + tip; s.stats.earned += amount + tip; s.today.earned += amount + tip; s.today.tips += tip;
    s.stats.served++; s.today.served++; qp(s, 'serve'); qp(s, 'earn', amount + tip);
    if (!auto) EXTRA.onPay(s, c, amount);
    s.customers = s.customers.filter(x => x.id !== c.id);
    if (c.kind === 'hotel') {
      s.guests.push({ id: s.seq++, sp: c.vsp, name: pick(NAMES[s.lang || 'ko'] || NAMES.ko), trait: randTrait(), hunger: 70, happy: 70, pick: Math.min(CLOCK.close - 10, s.clock.m + rnd(150, 360)), owner: c.name, seed: c.seed });
      ev(s, { k: 'hotelIn', cid: c.id, c: amount + tip, sp: c.vsp });
    } else if (c.kind === 'pickup') {
      ev(s, { k: 'hotelOut', cid: c.id, c: amount + tip });
    } else if (c.pd) {
      s.stats.sold++; s.today.sold++; { const tsp = s.stats.spSold = s.stats.spSold || {}; tsp[c.pd.sp] = (tsp[c.pd.sp] || 0) + 1; } qp(s, 'sell'); addXp(s, Math.round(SPECIES[c.pd.sp].sell / 8));
      if (!s.today.best || amount > s.today.best.c) s.today.best = { sp: c.pd.sp, coat: c.pd.coat, name: c.pd.name, c: amount };
      // letter scheduled for tomorrow
      const kind = c.type === 'celeb' ? 'celeb' : c.pd.rescued ? 'rescue' : c.match;
      s.adopters = (s.adopters || []).concat({ name: c.name, seed: c.seed, pet: c.pd.name, sp: c.pd.sp, coat: c.pd.coat || 0, day: s.clock.day }).slice(-30);
      // v2026-10-08: record the pet onto this resident's own permanent collection, and give them a happiness bump -- owning one
      // never stops them buying another, so the same resident can keep coming back (see TOWN.pickResidentOf above)
      if (c.residentId && typeof TOWN.residentById === 'function') {
        const res = TOWN.residentById(s, c.residentId);
        if (res) { res.pets = res.pets || []; res.pets.push({ sp: c.pd.sp, name: c.pd.name, coat: c.pd.coat || 0, day: s.clock.day }); res.happy = Math.round(Math.min(100, (res.happy == null ? 70 : res.happy) + 8)); }
      }
      if (Math.random() < ({ celeb: 1, rescue: .8, great: .4, bad: .5 }[kind] || .2)) s.outbox.push({ id: s.lseq++, w: rnd(90, 240), due: s.clock.day + 1, from: c.name, seed: c.seed, celeb: c.type === 'celeb', pet: c.pd.name, sp: c.pd.sp, coat: c.pd.coat || 0, kind, n: rint(0, 9), likes: rint(20, 400) * (c.type === 'celeb' ? 50 : 1) });
      ev(s, { k: 'sell', by, pet: c.pd.name, sp: c.pd.sp, c: amount + tip, tip, cid: c.id, pd: c.pd, auto, match: c.match });
      // "펫카페는 펫샵에서 펫을 산 사람만 갈수 있는거야" -- café guests are no longer a
      // spontaneous random timer; every guest is a specific customer who just bought a pet here,
      // queued for CAFE.tick() to seat (same look via c.seed, so it visibly reads as "the same
      // person who just adopted a puppy, now at the café with it")
      const cf = CAFE.ensure(s); cf.pending = cf.pending || [];
      cf.pending.push({ name: c.name, seed: c.seed, sp: c.pd.sp });
    } else {
      s.today.shop += amount; addXp(s, 3);
      ev(s, { k: 'shopSale', by, c: amount + tip, tip, cid: c.id, auto });
    }
    return amount + tip;
  }
  // ---------- random events ----------
  function freeFloor(s) {
    const out = [];
    for (let x = 0; x < s.room.w; x++) for (let y = 0; y < s.room.h; y++) if (!blocked(s, x, y, 1, 1)) out.push({ x, y });
    return out;
  }
  function startEvent(s) {
    const opts = [];
    const caged = s.pets.filter(p => p && ['cage', 'hutch'].includes(kindOf(p.sp)) && !p.pen);
    if (caged.length) opts.push('escape');
    opts.push('mess');
    if (s.clock.day >= 2) opts.push('inspect');
    if (s.strayDay !== s.clock.day) opts.push('stray', 'stray');
    const owned = s.pets.filter(Boolean);
    if (s.level >= 6 && owned.length && !(TOWN.has(s, 'police') && Math.random() < .7)) opts.push('thief'); // PET TOWN: 🚓 a police station keeps most thieves away
    const k = pick(opts);
    if (k === 'stray') { spawnStray(s); return; }
    if (k === 'escape') { const p = pick(caged); p.escaped = true; s.event = { k, pid: p.id, name: p.name, left: 60, max: 60 }; ev(s, { k: 'evStart', ek: k, pet: p.name }); return; }
    if (k === 'mess') { addMess(s, rint(3, 4)); s.event = { k, left: 90, max: 90 }; ev(s, { k: 'evStart', ek: k }); return; }
    if (k === 'inspect') { s.event = { k, left: 50, max: 50, seed: rint(1, 1e6) }; ev(s, { k: 'evStart', ek: k }); return; }
    if (k === 'thief') { const p = pick(owned); s.event = { k, pid: p.id, name: p.name, left: 40, max: 40, seed: rint(1, 1e6) }; ev(s, { k: 'evStart', ek: k, pet: p.name }); return; }
  }
  function addMess(s, n) {
    const fl = freeFloor(s);
    const roamers = s.pets.some(p => p && !confined(p.sp)), kinds = roamers ? ['poop', 'spill', 'fur'] : ['spill', 'spill', 'litter']; // no free-roaming pets -> only customers' spills and litter
    const rp = s.pets.filter(p => p && !confined(p.sp) && !p.escaped && !p.pen);
    for (let i = 0; i < n && fl.length; i++) { const t = fl.splice(Math.floor(Math.random() * fl.length), 1)[0], k = pick(kinds); s.messes.push({ id: s.seq++, x: t.x, y: t.y, k, pid: k === 'poop' && rp.length ? pick(rp).id : undefined, at: Date.now() }); }
  }
  function spawnStray(s) {
    const un = unlocked(s).filter(x => ['dog', 'cat', 'rabbit'].some(t => ART.look(x).t === t));
    s.strayDay = s.clock.day;
    s.stray = { id: s.seq++, sp: pick(un.length ? un : ['kitten']), sex: Math.random() < .5 ? 'm' : 'f', trait: randTrait() };
    ev(s, { k: 'evStart', ek: 'stray', sp: s.stray.sp });
  }
  function endEvent(s, ok) {
    const e = s.event; if (!e) return; s.event = null;
    if (e.k === 'escape') {
      const p = s.pets.find(x => x && x.id === e.pid);
      if (p) { p.escaped = false; if (!ok) { p.stress = Math.min(100, p.stress + 30); addRep(s, -1); } }
      ev(s, { k: 'evEnd', ek: 'escape', ok, pet: e.name });
    } else if (e.k === 'mess') {
      const left = s.messes.length; if (left) addRep(s, -left);
      s.messes = []; ev(s, { k: 'evEnd', ek: 'mess', ok: !left, n: left });
    } else if (e.k === 'thief') {
      if (!ok) { const i = s.pets.findIndex(x => x && x.id === e.pid); if (i >= 0) { s.pets[i] = null; addRep(s, -3); } }
      else s.coins += 60 + lvE(s) * 8;
      ev(s, { k: 'evEnd', ek: 'thief', ok, pet: e.name });
    } else if (e.k === 'inspect') {
      let score = 100 - s.messes.length * 20;
      const ps = s.pets.filter(Boolean);
      ps.forEach(p => { if (p.clean < 50) score -= 10; if (p.hunger < 30) score -= 10; if (p.stress > 70) score -= 5; });
      score = Math.max(0, score);
      const pass = score >= 60;
      if (pass) { addRep(s, 5); s.coins += 100 + lvE(s) * 20; } else addRep(s, -4);
      ev(s, { k: 'evEnd', ek: 'inspect', ok: pass, score, c: pass ? 100 + lvE(s) * 20 : 0 });
    }
  }
  // ---------- time ----------
  function stepPets(s, dt, offline) {
    const night = s.clock && s.clock.ph === 'closed';
    const crowd = (s.customers || []).length >= 2;
    // v9.69: while the game is CLOSED / paused the pets are frozen exactly as they were ("껐을 때 동물 상태도 그대로"):
    // no hunger / dirt / stress / boredom and no growth -- only their cooldown timers run, plus nests already in progress
    if (offline) {
      for (const p of s.pets) { if (!p) continue; if (p.bcd > 0) p.bcd = Math.max(0, p.bcd - dt); if (p.pat > 0) p.pat = Math.max(0, p.pat - dt); if (p.tcd > 0) p.tcd = Math.max(0, p.tcd - dt); }
    } else s.pets.forEach((p, i) => {
      if (!p) return;
      fixPet(p);
      const tr = TRAITS[p.trait] || TRAITS.calm;
      // v9.75: GAUGE_SPEED halves how fast hunger / cleanliness drop and stress / boredom build up ("지금의 50%");
      // the recovery in the playpen and at night below is NOT slowed
      const k = houseDecay(s.houses[i] || 1) * dt / 60 * (night ? .4 : 1) * GAUGE_SPEED, lo = offline ? 10 : 0;
      p.hunger = clamp(p.hunger - 3.5 * tr.hunger * k, lo, 100);
      p.clean = clamp(p.clean - 2.2 * k, lo, 100);
      let ds = 1.0 * tr.stress * k, db = 3 * tr.bored * k;
      if (p.trait === 'shy' && crowd && !night) ds += 2 * k;
      if (p.hunger < 25) ds += 1.5 * k;
      if (p.pen && !night) {
        const bestPen = s.items.filter(it => isPenKind(it.k)).sort((a, b) => ((PEN_INFO[b.k] && PEN_INFO[b.k].lv) || 1) - ((PEN_INFO[a.k] && PEN_INFO[a.k].lv) || 1))[0];
        const pi = (bestPen && PEN_INFO[bestPen.k]) || PEN_INFO.playpen || { boredMul: 1, stressMul: 1, expBonus: 1 };
        db = -8 * pi.boredMul * dt / 60; ds -= 3 * pi.stressMul * dt / 60; if (!offline) gainExp(s, p, pi.expBonus * dt / 60);
      }
      if (night) ds -= 2 * dt / 60;
      p.stress = clamp(p.stress + ds, 0, offline ? 90 : 100);
      p.bored = clamp(p.bored + db, 0, offline ? 90 : 100);
      p.happy = 100 - (p.stress + p.bored) / 2;
      const c = cond(p), f = c >= 60 ? 1 : c >= 35 ? 0.5 : 0.15;
      if (p.grow < 1) p.grow = Math.min(1, p.grow + f * houseGrow(s.houses[i] || 1) * dt / (((SPECIES[p.sp] && SPECIES[p.sp].grow) || 3) * 60));
      if (p.bcd > 0) p.bcd = Math.max(0, p.bcd - dt);
      if (p.pat > 0) p.pat = Math.max(0, p.pat - dt);
      if (p.tcd > 0) p.tcd = Math.max(0, p.tcd - dt);
      if (s.up.feeder && p.hunger < 35 && s.feed) { const line = dietOf(p.sp), tr = [1, 0, 2].find(k => (s.feed[line + ':' + k] || 0) > 0); if (tr != null) { s.feed[line + ':' + tr]--; p.hunger = Math.min(100, p.hunger + FEED_TIERS[tr].hunger); } }
      if (s.up.cleaner && p.clean < 35) p.clean = 100;
      if (!confined(p.sp) && !p.escaped && !p.pen && !night && s.clock && s.clock.ph === 'open' && (s.messes || []).length < 15 && Math.random() < dt / 300 * poopRate(p)) { // v1.19: a free-roaming pet goes on the floor now and then -- on average about once per 5 GAME hours, less if it barely ate; every pet has its own rhythm
        const fl = freeFloor(s); if (fl.length) { const t = fl[Math.floor(Math.random() * fl.length)]; s.messes.push({ id: s.seq++, x: t.x, y: t.y, k: 'poop', pid: p.id, at: Date.now() }); } }
      if (confined(p.sp) && !p.escaped && !p.pen) { const h = habItem(s, i); if (h) { h.dirt = Math.min(100, (h.dirt || 0) + 1.5 * k); if (h.dirt >= 60) { p.clean = clamp(p.clean - 1.5 * k, lo, 100); p.stress = clamp(p.stress + .8 * k, 0, 100); p.happy = 100 - (p.stress + p.bored) / 2; } } }
    });
    if (!offline) stepNests(s, dt);
    if (!offline) for (const g of s.guests || []) { g.hunger = clamp(g.hunger - 3 * dt / 60, 0, 100); g.happy = clamp(g.happy - 2.5 * dt / 60, 0, 100); }
    for (let i = s.breeding.length - 1; i >= 0; i--) {
      const b = s.breeding[i];
      b.left -= dt;
      if (b.left <= 0) {
        const slots = (b.slots || []).filter(x => !s.pets[x]);
        for (let n = 0; n < b.n && n < slots.length; n++) {
          const baby = mkPet(s, b.sp, b.lang, 1);
          baby.hunger = 80; baby.clean = 100; baby.happy = 90;
          if (Math.random() < .05) baby.coat = rareCoat();
          EXTRA.noteRare(s, baby); EXTRA.photo(s, baby, true);
          baby.stars = Math.random() < .25 ? Math.min(2, (b.stars || 0) + 1) : (b.stars || 0);
          s.pets[slots[n]] = baby;
          s.stats.born++; qp(s, 'born');
          ev(s, { k: 'born', pet: baby.name, sp: b.sp, pa: b.na, pb: b.nb });
        }
        addXp(s, 10 + Math.round(SPECIES[b.sp].sell / 20));
        s.breeding.splice(i, 1);
      }
    }
    for (const d of s.deliveries) if (d.st === 'road') { d.left -= dt; if (d.left <= 0) { d.st = 'arrived'; ev(s, { k: 'delivered', did: d.id, sp: d.sp }); } }
  }
  function stepClock(s, dt) {
    const k = s.clock;
    if (k.ph === 'closed') return;
    // manual open/close: time waits at 8:00 until the owner opens; while open it runs until closed (max 23:59)
    if (k.ph === 'prep') k.m = Math.min(CLOCK.open, k.m + dt * CLOCK.speed);
    else k.m = Math.min(24 * 60 - 1, k.m + dt * CLOCK.speed);
  }
  function closeShop(s) {
    const k = s.clock; k.ph = 'closed';
    if (s.staff) { let w = 0; for (const key in s.staff) w += staffWage(ROLE(staffRoleOf(key)), s.staff[key].lv); if (w) { const paid = Math.min(w, s.coins); s.coins -= paid; s.today.wage = paid; ev(s, { k: 'wages', c: paid }); } }
    if (s.hosp && s.hosp.staff && s.hosp.staff.length) { const w2 = HOSP.wagesOf(s.hosp); if (w2) { const paid2 = Math.min(w2, s.coins); s.coins -= paid2; s.today.wage = (s.today.wage || 0) + paid2; ev(s, { k: 'wages', c: paid2 }); } } // hospital staff wages
    if (s.farm && s.farm.staff && s.farm.staff.length) { const w4 = FARM.wagesOf(s.farm); if (w4) { const paid4 = Math.min(w4, s.coins); s.coins -= paid4; s.today.wage = (s.today.wage || 0) + paid4; ev(s, { k: 'wages', c: paid4 }); } } // farmhand wages
    if (s.salon && s.salon.staff && s.salon.staff.length) { const w5 = SALON.wagesOf(s.salon); if (w5) { const paid5 = Math.min(w5, s.coins); s.coins -= paid5; s.today.wage = (s.today.wage || 0) + paid5; ev(s, { k: 'wages', c: paid5 }); } } // v9.99: groomers
    if (s.cafe && s.cafe.staff && s.cafe.staff.length) { const w3 = CAFE.wagesOf(s.cafe); if (w3) { const paid3 = Math.min(w3, s.coins); s.coins -= paid3; s.today.wage = (s.today.wage || 0) + paid3; ev(s, { k: 'wages', c: paid3 }); } } // café staff wages
    for (const c of s.customers.slice()) { if (c.st === 'pay') pay(s, c, s.owner, false); else custLeave(s, c, 'closed'); }
    s.customers = [];
    for (const g of s.guests) { const tip = Math.round((g.happy + g.hunger) / 2 / 100 * (40 + lvE(s) * 8)); s.coins += tip; s.today.tips += tip; s.today.earned += tip; }
    s.guests = [];
    if (s.event) endEvent(s, false);
    s.stray = null;
    ev(s, { k: 'close', day: k.day, rep: Object.assign({}, s.today) });
  }
  function tick(s, dt) {
    ensureDaily(s);
    EXTRA.tick(s, dt);
    { const tr = repTier(s.rep); if (s.repBest == null) s.repBest = tr; if (tr > s.repBest) { s.repBest = tr; const c = 1500 * tr; s.coins += c; if (s.x) s.x.tickets = (s.x.tickets || 0) + tr; ev(s, { k: 'reptier', n: tr, c }); } }
    stepClock(s, dt);
    CAFE.tick(s, dt);
    FARM.tick(s, dt); RANCH.tick(s, dt);
    if (typeof TRAIN !== 'undefined' && TRAIN.tick) TRAIN.tick(s, dt);
    HOSP.tick(s, dt);
    VILLAGE.tick(s, dt);
    TOWN.tick(s, dt); // PET TOWN: residents move in / out, happiness
    SALON.tick(s, dt);
    stepPets(s, dt, false);
    stepParcels(s, dt);
    stepStaff(s, dt);
    stepOnline(s, dt);
    stepInsta(s, dt);
    const q = counterQueue(s);
    for (const c of s.customers.slice()) {
      c.t += dt;
      if (c.st === 'want') {
        if (c.watch > 0) { c.watch -= dt; addRep(s, .06 * dt); if (c.watch <= 0) ev(s, { k: 'watched', cid: c.id }); continue; }
        if (c.willLeave) {
          if (s.pets.some(p => matches(c, p))) c.willLeave = false;
          else { c.browse -= dt; if (c.browse <= 0) { custLeave(s, c, 'nomatch'); continue; } }
        }
        c.pat -= dt; if (c.pat <= 0) custLeave(s, c, 'lost');
      } else if (c.st === 'shop') {
        c.browse -= dt;
        if (c.browse <= 0) {
          const sh = s.items.filter(i => GOODS[i.k] && i.stock > 0);
          if (!sh.length) { addRep(s, -.5); custLeave(s, c, 'nostock'); continue; }
          const it = pick(sh); if (!it.inv) { it.inv = {}; if (it.prod) it.inv[it.prod] = it.stock; } const pid = shelfPick(it) || it.prod, n = shelfTake(it, pid, rint(1, 3)) || 1, pr = PRODUCTS.find(x => x.id === pid) || { price: GOODS[it.k].price, icon: '🛍️' };
          c.shelf = it.k; c.prod = pid;
          c.st = 'pay'; c.amount = n * (pr.price + Math.floor(lvE(s) / 2)) ; c.pat = c.max = 90 * (s.up.sign ? 1.5 : 1); c.waited = 0;
        }
      } else if (c.st === 'gwait') {
        c.pat -= dt; if (c.pat <= 0) { addRep(s, -1); custLeave(s, c, 'lost'); }
      } else if (c.st === 'pay') {
        c.waited += dt; c.pat -= dt;
        if (s.up.cashier && c.waited > 6) pay(s, c, 'cashier', false);
        else if (c.pat <= 0) pay(s, c, 'auto', true);
      }
    }
    // hotel pickups
    if (isOpen(s)) for (const g of s.guests.slice()) {
      if (s.clock.m >= g.pick && !s.customers.some(c => c.gid === g.id)) {
        const tip = Math.round((g.happy + g.hunger) / 2 / 100 * (40 + lvE(s) * 8));
        s.customers.push({ id: s.seq++, seed: g.seed, name: g.owner, kind: 'pickup', st: 'pickup', gid: g.id, vsp: g.sp, amount: tip, pat: 120, max: 120, t: 0, waited: 0, type: 'normal' });
      }
    }
    for (const c of s.customers) if (c.st === 'pickup') { c.t2 = (c.t2 || 0) + dt; if (c.t2 > 8) { s.guests = s.guests.filter(g => g.id !== c.gid); c.st = 'pay'; c.pd = null; c.waited = 0; } }
    // random events
    if (s.event) { s.event.left -= dt; if (s.event.left <= 0) endEvent(s, false); }
    if (isOpen(s) && !s.event) {
      s.nextEvt -= dt;
      if (s.nextEvt <= 0) { s.nextEvt = rnd(70, 150); if (Math.random() < .55) startEvent(s); }
    }
    if (isOpen(s)) stepVip(s);
    if (isOpen(s)) {
      s.nextCust -= dt;
      const maxC = 3 + (decorPts(s) >= 20 ? 1 : 0) + (s.room.w >= 10 ? 1 : 0) + EXTRA.maxBoost(s) + TOWN.maxAdd(s);
      const hr = Math.floor(s.clock.m / 60);
      if (s.nextCust <= 0) {
        if (s.customers.length < maxC && s.clock.m < 23 * 60 + 30) { const n0 = s.customers.length; spawnCustomer(s); const nc = s.customers[s.customers.length - 1]; if (s.customers.length > n0 && (nc.kind === 'adopt' || nc.kind === 'shop') && Math.random() < ONLINE_RATE) { s.customers.pop(); toOnline(s, nc); } }
        const rate = RATE[hr] || .5;
        s.nextCust = Math.max(6, 26 - decorPts(s) * 0.6) / rate / (0.7 + Math.min(100, s.rep || 0) / 100 * .8 + repTier(s.rep) * .05) / (1 + popOf(s) / 250) / (1 + igTier(s) * .05) / EXTRA.custBoost(s) / TOWN.custK(s) * rnd(0.7, 1.3) * (s.pets.some(Boolean) ? 1 : 1.6);
      }
    }
    s.lastTick = Date.now();
  }
  function catchUp(s) {
    let away = (Date.now() - (s.lastTick || Date.now())) / 1000;
    if (away < 60) return 0;
    const total = Math.min(away, 8 * 3600);
    for (let t = 0; t < total; t += 30) stepPets(s, Math.min(30, total - t), true);
    stepParcels(s, total);
    s.customers = s.customers.filter(c => c.st === 'pay'); s.nextCust = 5; s.lastTick = Date.now();
    ensureDaily(s);
    EXTRA.welcomeBack(s, Math.round(away / 60));
    return Math.round(away / 60);
  }

  let pid = Date.now() % 100000;
  function ageOf(p) { return p.grow < 1 ? .3 * p.grow : .3 + .7 * Math.min(1, ((p.lv || 1) - 1) / 6); }
  function addHouse(s, m) {
    const cap = m.cap || 1, first = s.slots, slots = [];
    for (let i = 0; i < cap; i++) { s.slots++; s.pets.push(null); s.houses.push(m.lv); slots.push(first + i); }
    return addItem(s, 'hab', { slot: first, slots, kind: m.kind, cap, model: m.id });
  }
  // auto-breeding: an adult ♂ and ♀ of the same species sharing a house sometimes make babies
  function stepNests(s, dt) {
    const res = reservedSlots(s);
    for (const it of s.items) {
      if (it.k !== 'hab' || !it.slots || it.slots.length < 2) continue;
      const ps = it.slots.map(i => s.pets[i]).filter(Boolean);
      if (ps.length < 2) continue;
      const free = it.slots.filter(i => !s.pets[i] && !res.has(i));
      if (!free.length) continue;
      let pair = null;
      for (const a of ps) for (const b of ps) if (!pair && a.sex === 'm' && b.sex === 'f' && a.sp === b.sp && canBreed(a) && canBreed(b)) pair = [a, b];
      if (!pair || Math.random() > dt / 200) continue;
      const [a, b] = pair, cat = (SPECIES[a.sp] || {}).cat || 'small';
      const n = Math.min(free.length, cat === 'fish' || cat === 'small' ? rint(1, 3) : rint(1, 2));
      s.breeding.push({ id: s.seq++, sp: a.sp, a: a.id, b: b.id, na: a.name, nb: b.name, n, slots: free.slice(0, n), stars: Math.max(a.stars || 0, b.stars || 0), left: breedTime(a.sp), max: breedTime(a.sp), lang: s.lang || 'ko', auto: 1 });
      a.bcd = b.bcd = 900;
      ev(s, { k: 'nest', pa: a.name, pb: b.name, sp: a.sp });
    }
  }
  function stepParcels(s, dt) {
    for (const pc of (s.parcels || []).slice()) {
      if (pc.st === 'arrived') continue;
      pc.left -= dt; if (pc.left > 0) continue;
      pc.st = 'arrived';
      ev(s, { k: 'parcel', what: pc.what, key: pc.key, mid: pc.mid, did: pc.did });
    }
  }
  function publish(s, l, quiet) {
    l.day = s.clock.day; l.read = false; l.chat = l.chat || []; s.letters.unshift(l);
    if (s.letters.length > 60) s.letters.length = 60;
    s.followers = (s.followers || 20) + rint(1, 6) + (l.celeb ? 40 : 0);
    if (!quiet) ev(s, { k: 'letters', n: 1 });
  }
  // User Request 8: popularity uncapped (no 100 limit, grows infinitely!)
  function popOf(s) { return Math.max(0, Math.round(((s.followers || 20) - 20) / 6 + (s.rep || 0) * .35 + (s.igReplies || 0) * .6)); }
  // v1.13: follower tiers (100 / 300 / 1000 / 3000 / 10000) -> +5% customers each; first time reaching a tier pays a reward
  const IG_TIERS = [100, 300, 1000, 3000, 10000];
  const igTier = s => IG_TIERS.filter(n => (s.followers || 20) >= n).length;
  function igCheckTier(s) { const tr = igTier(s); if (s.igTierBest == null) s.igTierBest = tr; if (tr > s.igTierBest) { s.igTierBest = tr; const c = Math.round((200 * tr + 30 * lvE(s)) / 10) * 10; s.coins += c; if (tr >= 3 && s.x) s.x.tickets = (s.x.tickets || 0) + 1; ev(s, { k: 'igtier', n: IG_TIERS[tr - 1], c, tk: tr >= 3 }); } }
  // v1.13: today's hashtag challenge -- post a photo of a pet that fits the tag for a big bonus (once a day)
  const IG_CH = [
    ['dog', p => (SPECIES[p.sp] || {}).cat === 'dog'], ['cat', p => (SPECIES[p.sp] || {}).cat === 'cat'], ['small', p => (SPECIES[p.sp] || {}).cat === 'small'], ['fish', p => (SPECIES[p.sp] || {}).cat === 'fish'],
    ['bird', p => (SPECIES[p.sp] || {}).cat === 'bird'], ['reptile', p => (SPECIES[p.sp] || {}).cat === 'reptile'], ['chubby', p => (ART.look(p.sp, p.coat || ART.hashStr(p.id)).bld || 1) > 1.1], ['slim', p => (ART.look(p.sp, p.coat || ART.hashStr(p.id)).bld || 1) < 1],
    ['groomed', p => !!p.groomed], ['baby', p => p.grow < 1 || ageOf(p) < .75], ['rare', p => !!rareOf(p.coat || 0)], ['fashion', p => !!(p.wear && Object.keys(p.wear).some(k => p.wear[k]))]];
  const igChFit = (k, p) => { const d = IG_CH.find(x => x[0] === k); return !!(d && p && d[1](p)); };
  function igCh(s) {
    const day = s.clock ? s.clock.day : 1; if (s.igCh && s.igCh.day === day) return s.igCh;
    const cats = new Set(unlocked(s).map(sp => SPECIES[sp].cat)), own = s.pets.filter(Boolean);
    const pool = IG_CH.filter(([k]) => ['dog', 'cat', 'small', 'fish', 'bird', 'reptile'].includes(k) ? cats.has(k) : k !== 'rare' || own.some(p => rareOf(p.coat || 0)));
    const fits = pool.filter(([k]) => own.some(p => igChFit(k, p)));
    const src = fits.length && Math.random() < .65 ? fits : pool; const k = src[Math.floor(Math.random() * src.length)][0];
    s.igCh = { day, k, done: 0 }; return s.igCh;
  }
  function feedGap(s) { // seconds until the next adopter post: rare at first, frequent when popular / many adopters
    const pop = popOf(s), ads = Math.min(20, (s.adopters || []).length);
    return Math.max(600, rnd(1200, 2000) / (1 + pop / 60) / (1 + ads / 30));
  }
  function feedPost(s) {
    const lang = s.lang || 'ko';
    const ads = s.adopters || [];
    if (!ads.length) return;   // only customers who adopted from us post (and the owner)
    const a = pick(ads), adopter = true;
    const ctx = { from: a.name, seed: a.seed, pet: a.pet, sp: a.sp, coat: a.coat, age: Math.min(1, .45 + (s.clock.day - a.day) * .12) };
    const m = BOT.makePost(ctx, lang, s.shop, adopter);
    const l = Object.assign(ctx, { id: s.lseq++, kind: 'daily', topic: m.topic, text: m.text, askQ: m.askQ, adopter, n: rint(0, 9), likes: rint(15, 300), chat: [], lang });
    publish(s, l, true);
    ev(s, { k: 'ipost', from: l.from, tag: m.topic === 'question' });
  }
  function stepInsta(s, dt) {
    igCheckTier(s);
    if (s.nextFeed == null || s.nextFeed > 1200) s.nextFeed = feedGap(s);
    s.nextFeed -= dt;
    if (s.nextFeed <= 0) { s.nextFeed = feedGap(s); feedPost(s); }
    for (const l of (s.outbox || []).slice()) if (l.w != null) { l.w -= dt; if (l.w <= 0) { s.outbox = s.outbox.filter(x => x !== l); publish(s, l); } }
    for (const l of s.letters || []) {
      if (l.wait != null) {
        l.wait -= dt;
        if (l.wait <= 0) {
          l.wait = null;
          const mine = [...(l.chat || [])].reverse().find(x => x.w === 'm');
          const r = BOT.reply(l, mine ? mine.x : '', l.lang || 'ko', s.shop);
          const who = l.mine ? (l.talkTo || { n: 'fan', sd: 7 }) : { n: l.from, sd: l.seed };
          l.chat.push({ w: 'c', x: r.text, n: who.n, sd: who.sd }); if (r.ended) l.ended = true;
          l.unread = true; ev(s, { k: 'icomment', lid: l.id, from: who.n });
        }
      }
      if (l.mine && l.fansLeft > 0) {
        l.fanT -= dt;
        if (l.fanT <= 0) {
          const lang = l.lang || 'ko', names = BOT.FANS[lang] || BOT.FANS.ko, who = { n: pick(names), sd: rint(1, 99999) };
          l.chat.push({ w: 'c', x: BOT.fan(l, lang), n: who.n, sd: who.sd }); l.talkTo = who; l.ended = false; l.askQ = false;
          l.fansLeft--; l.fanT = rnd(20, 45); l.likes += rint(8, 40) + Math.round(Math.min(150, s.rep || 0) / 3); l.unread = true;
          s.followers = (s.followers || 20) + rint(0, 4);
          ev(s, { k: 'icomment', lid: l.id, from: who.n });
        }
      }
    }
  }
  // ---------- staff (auto workers) ----------
  const ROLE = id => STAFF_ROLES.find(r => r.id === id);
  const STAFF_CLEAN_AT = 55; // staff wash a pet once it is below 50% clean (the 'dirty' face shows under 25%)
  function staffJob(s, role, m, tk) {
    tk = tk || new Set();
    const W = s.room.w, H = s.room.h;
    if (role === 'clean') {
      const ms = (s.messes || []).filter(q => !tk.has('mess' + q.id)); if (ms.length) { const q = ms[0]; return { k: 'mess', mid: q.id, x: q.x, y: q.y }; }
      { let hb = null; for (const it of s.items) if (it.k === 'hab' && (it.dirt || 0) >= 50 && !tk.has('hab' + it.id) && (!hb || it.dirt > hb.dirt)) hb = it; if (hb) return { k: 'hab', iid: hb.id, x: hb.x, y: hb.y + 1 }; } // v1.11: dirty cages next
      // v9.71: nothing on the floor -> the cleaner washes the dirtiest pet instead of standing idle ("더러운 동물이 많아")
      let best = null; s.pets.forEach((p, i) => { if (!p || p.escaped || p.clean >= STAFF_CLEAN_AT || tk.has('pet' + p.id)) return; if (!best || p.clean < best.p.clean) best = { p, i }; });
      if (best) { const h = habItem(s, best.i); return { k: 'clean', pid: best.p.id, x: h ? h.x : W / 2, y: h ? h.y + 1 : H / 2 }; }
      return null;
    }
    if (role === 'porter') {
      const z = FURN.DZONE(W, H), dz = { x: W + 1, y: Math.floor((z.y0 + z.y1) / 2) };
      const d = (s.deliveries || []).find(d => d.st === 'arrived' && !d.pk && !tk.has('crate' + d.id) && freeSlotsKind(s, kindOf(d.sp)).concat([d.slot]).some(i => !s.pets[i] && habKind(s, i) === kindOf(d.sp)));
      if (d) return { k: 'crate', did: d.id, x: dz.x, y: dz.y };
      const pc = (s.parcels || []).find(p => p.st === 'arrived' && !tk.has('parcel' + p.id) && (p.what === 'food' || p.what === 'kit' || (p.what === 'house' ? freeSpot(s, 'hab') : freeSpot(s, p.did))));
      if (pc) return { k: 'parcel', pcid: pc.id, x: dz.x, y: dz.y };
      if (m.lv >= 3) { for (const sh of s.items) { if (!GOODS[sh.k] || tk.has('restock' + sh.id)) continue; for (const pid of Object.keys(sh.inv || {}).concat(sh.prod ? [sh.prod] : [])) { const have = (sh.inv || {})[pid] || 0, pr = PRODUCTS.find(x => x.id === pid); if (pr && have <= 2 && pr.lv <= s.level && s.coins >= (SHELF_CAP - have) * pr.cost + 200) return { k: 'restock', iid: sh.id, prod: pid, x: sh.x, y: sh.y + 1 }; } } }
      return null;
    }
    if (role === 'cashier') {
      if (s.clock.ph !== 'open') return null;
      const c = s.customers.find(c => c.st === 'pay' && (c.waited || 0) > 1.2 && !c.staffed);
      if (c) { c.staffed = 1; const ct = s.items.find(i => i.k === 'counter'); return { k: 'pay', cid: c.id, x: ct ? (ct.f ? ct.x - 1 : ct.x + 1) : W - 2, y: ct ? (ct.f ? ct.y + 1 : ct.y - 1) : 1 }; }
      return null;
    }
    if (role === 'online') {
      const desks = s.items.filter(i => PC_ITEMS.includes(i.k)); if (!desks.length) return null;
      const used = new Set(); for (const key in s.staff) { const j = s.staff[key].job; if (j && j.k === 'online' && s.staff[key] !== m) used.add(j.desk); }
      const dk = desks.find(d => !used.has(d.id)); if (!dk) return null;
      const f = FPI(dk), spot = { x: dk.x + Math.floor(f.w / 2), y: dk.y + f.d };
      for (const c of s.online || []) {
        if (tk.has('online' + c.id)) continue;
        if (c.st === 'oshop' && onlineStock(s, c)) return { k: 'online', cid: c.id, desk: dk.id, x: spot.x, y: spot.y };
        if (c.st === 'want') { const p = onlineBest(s, c); if (p && (m.lv >= 3 || matchKind(c, p) !== 'bad')) return { k: 'online', cid: c.id, pid: p.id, desk: dk.id, x: spot.x, y: spot.y }; }
      }
      return null;
    }
    if (role === 'guard') {
      if (!s.event || s.event.k !== 'thief' || tk.has('thief')) return null;
      const i = s.pets.findIndex(p2 => p2 && p2.id === s.event.pid), hab = i >= 0 ? habItem(s, i) : null;
      return { k: 'thief', x: hab ? hab.x : W / 2, y: hab ? hab.y + 1 : H / 2 };
    }
    if (role === 'groomer') { // v1.25: grooming-table customers first, then groom our own dogs / cats / small pets (uses kits)
      const tb = s.items.find(i => i.k === 'groomtable'); if (!tb) return null;
      const c = s.customers.find(x => x.st === 'gwait' && !tk.has('cust' + x.id)); if (c) return { k: 'gsvc', cid: c.id, x: tb.x, y: tb.y + 1 };
      if ((s.kits || 0) > 0) { const i = s.pets.findIndex(p => p && !p.groomed && p.grow >= 1 && GROOMABLE[SPECIES[p.sp].cat] && !tk.has('pet' + p.id)); if (i >= 0) { const h = habItem(s, i); return { k: 'gpet', pid: s.pets[i].id, x: h ? h.x : W / 2, y: h ? h.y + 1 : H / 2 }; } }
      return null;
    }
    if (role === 'sales') {
      const W = s.room.w, H = s.room.h;
      // 1. Regular visitor with "할 말이 있어요" (story quest)
      const exState = typeof X === 'function' ? X(s) : (s.extra || s);
      const vis = exState && exState.visitor;
      if (vis && !tk.has('visitor' + vis.rid)) {
        const cnt = s.items.find(i => i.k === 'counter') || { x: 3, y: 3 };
        return { k: 'storysolve', rid: vis.rid, step: vis.step, x: Math.max(0, cnt.x - 1), y: Math.max(0, cnt.y + 1) };
      }
      // 2. Recommend pet to customer, then process adoption at computer
      for (const c of s.customers) {
        if (c.st !== 'want' || tk.has('cust' + c.id)) continue;
        if (!c.recDone) {
          let best = null, bs = -1;
          for (const p of s.pets) {
            if (!p || !matches(c, p)) continue;
            const mk = matchKind(c, p), sc = (mk === 'great' ? 3 : mk === 'ok' ? 2 : 1) + price(s, p, c) / 1e6;
            if (sc > bs) { bs = sc; best = p; }
          }
          if (best) {
            let cx = c.x != null ? c.x : Math.max(1, W - 3), cy = c.y != null ? c.y : Math.max(1, H - 2);
            if (typeof actors !== 'undefined') {
              const ca = actors.get('cu' + c.id);
              if (ca) { cx = Math.floor(ca.x); cy = Math.floor(ca.y); }
            }
            return { k: 'rec', cid: c.id, pid: best.id, pname: best.name, sp: best.sp, cname: c.name, x: Math.max(0, Math.min(W - 1, cx + (cx > 2 ? -1 : 1))), y: Math.max(0, Math.min(H - 1, cy)) };
          }
        } else if (c.recPid) {
          const p = findPet(s, c.recPid);
          if (p && matches(c, p)) {
            const desks = s.items.filter(i => PC_ITEMS.includes(i.k));
            const pc = desks[0] || s.items.find(i => i.k === 'counter') || { x: Math.max(1, W - 2), y: Math.max(1, H - 2) };
            const f = typeof FPI === 'function' ? FPI(pc) : { w: 1, d: 1 };
            const spot = { x: Math.max(0, Math.min(W - 1, pc.x + Math.floor(f.w / 2))), y: Math.max(0, Math.min(H - 1, pc.y + (pc.d || 1))) };
            return { k: 'sellpc', cid: c.id, pid: p.id, pname: p.name, sp: p.sp, cname: c.name, x: spot.x, y: spot.y };
          }
        }
      }
      // 3. Adoption from board when empty homes exist (moves to computer desk)
      let ob = null, os = -1;
      for (const o of s.offers || []) {
        if (tk.has('adopt' + o.id) || s.coins < o.cost * 1.5 + 1000 || !freeSlotsKind(s, kindOf(o.sp)).length) continue;
        const v = SPECIES[o.sp].sell / Math.max(1, o.cost) + (o.stars || 0) * .3;
        if (v > os) { os = v; ob = o; }
      }
      if (ob) {
        const desks = s.items.filter(i => PC_ITEMS.includes(i.k));
        const pc = desks[0] || s.items.find(i => i.k === 'counter') || { x: Math.max(1, W - 2), y: Math.max(1, H - 2) };
        const f = typeof FPI === 'function' ? FPI(pc) : { w: 1, d: 1 };
        const spot = { x: Math.max(0, Math.min(W - 1, pc.x + Math.floor(f.w / 2))), y: Math.max(0, Math.min(H - 1, pc.y + (pc.d || 1))) };
        return { k: 'adopt', oid: ob.id, sp: ob.sp, x: spot.x, y: spot.y };
      }
      return null;
    }
    if (role === 'care') {
      const hasFeed = p => [0, 1, 2].some(k => (s.feed[dietOf(p.sp) + ':' + k] || 0) > 0);
      let best = null;
      // v9.71: the most URGENT need first (was: always the hungriest pet, so a filthy but fed pet never got its turn)
      const canBuy = p => s.coins >= feedPrice(dietOf(p.sp), 1) * 1.15 + 100; // v1.25: no food in stock -> the carer buys a basic pack on the spot
      s.pets.forEach((p, i) => { if (!p || p.escaped || tk.has('pet' + p.id)) return;
        const uf = p.hunger < 60 && (hasFeed(p) || canBuy(p)) ? (60 - p.hunger) / 60 + .15 : 0, uc = p.clean < STAFF_CLEAN_AT ? (STAFF_CLEAN_AT - p.clean) / STAFF_CLEAN_AT : 0;
        const us = p.stress > 50 && !(p.pat > 0) ? (p.stress - 50) / 50 : 0, ub = p.bored > 55 ? (p.bored - 55) / 45 : 0;
        const all = [['feed', uf], ['clean', uc], ['pat', us], ['play', ub]].sort((x, y) => y[1] - x[1]);
        if (!(all[0][1] > 0)) return; const need = all[0][0], u = all[0][1]; if (!best || u > best.u) best = { p, i, need, u }; });
      { let hb = null; for (const it of s.items) if (it.k === 'hab' && (it.dirt || 0) >= 60 && !tk.has('hab' + it.id) && (!hb || it.dirt > hb.dirt)) hb = it; // v1.25: a filthy cage stresses the pets inside -> the carer cleans it
        if (hb && (!best || best.u < (hb.dirt - 40) / 60)) return { k: 'hab', iid: hb.id, x: hb.x, y: hb.y + 1 }; }
      if (best) { const h = habItem(s, best.i); return { k: best.need, pid: best.p.id, x: h ? h.x : W / 2, y: h ? h.y + 1 : H / 2 }; }
      return null;
    }
    return null;
  }
  function staffDo(s, role, m, j) {
    const by = 'staff';
    if (j.k === 'mess') apply(s, { t: 'cleanmess', mid: j.mid }, by);
    else if (j.k === 'crate') { // v1.26: open the crate, pick the pet up and CARRY it to its home (a second 'carry' job), then put it in
      const d = s.deliveries.find(x => x.id === j.did && x.st === 'arrived');
      if (d) { let slot = d.slot; if (s.pets[slot] || habKind(s, slot) !== kindOf(d.sp)) slot = freeSlotsKind(s, kindOf(d.sp))[0];
        const h = slot != null ? habItem(s, slot) : null;
        if (h) { d.pk = 1; const dist = Math.hypot(h.x - j.x, h.y + 1 - j.y); m.job = { k: 'carry', did: d.id, sp: d.sp, coat: d.coat, x: h.x, y: h.y + 1, id: s.seq++, t: .8 + dist / (1.6 + m.lv * .3) }; m.rest = 0; }
        else apply(s, { t: 'unpack', did: j.did }, by); } }
    else if (j.k === 'carry') { const d = s.deliveries.find(x => x.id === j.did); if (d) { d.pk = 0; apply(s, { t: 'unpack', did: j.did }, by); } }
    else if (j.k === 'parcel') apply(s, { t: 'openparcel', id: j.pcid }, by);
    else if (j.k === 'restock') { const it = s.items.find(i => i.id === j.iid); if (it) apply(s, { t: 'restock', iid: it.id, prod: j.prod || it.prod }, by); }
    else if (j.k === 'online') { const c = (s.online || []).find(x => x.id === j.cid); if (c) { if (c.st === 'oshop') onlineShip(s, c, 'staff'); else { const p = (j.pid && s.pets.find(q => q && q.id === j.pid && matches(c, q))) || onlineBest(s, c); if (p) onlineSell(s, c, p, 'staff'); } } }
    else if (j.k === 'pay') { const c = s.customers.find(c => c.id === j.cid && c.st === 'pay'); if (c) pay(s, c, 'staff', false); }
    else if (j.k === 'feed') { const p = findPet(s, j.pid); if (p) { const line = dietOf(p.sp);
      if (![0, 1, 2].some(k => (s.feed[line + ':' + k] || 0) > 0)) { const c = Math.round(feedPrice(line, 1) * 1.15); if (s.coins >= c) { s.coins -= c; s.feed[line + ':1'] = (s.feed[line + ':1'] || 0) + 10; } }
      const tier = m.lv >= 4 && (s.feed[line + ':2'] || 0) > 0 ? 2 : undefined; apply(s, { t: 'feed', pid: p.id, tier }, by); } }
    else if (j.k === 'pat') { const p = findPet(s, j.pid); if (p) { apply(s, { t: 'pat', pid: p.id }, by); p.stress = Math.max(0, p.stress - 6); } }
    else if (j.k === 'play') { const p = findPet(s, j.pid); if (p) apply(s, { t: 'play', pid: p.id }, by); }
    else if (j.k === 'gsvc') {
      const c = s.customers.find(x => x.id === j.cid && x.st === 'gwait');
      if (c) {
        apply(s, { t: 'groomsvc', cid: c.id, score: Math.min(1, .55 + m.lv * .05) }, by);
        m.say = (typeof t === 'function' ? t('groomerDoneMsg') : '') || '강아지의 미용 끝났어요. 이뻐요 ✨';
        m.sayT = 4.5;
      }
    }
    else if (j.k === 'gpet') {
      const p = findPet(s, j.pid);
      if (p) {
        apply(s, { t: 'groom', pid: p.id }, by);
        const pnm = p.name || spName(p.sp);
        m.say = (pnm ? `${pnm}의 ` : '강아지의 ') + '미용 끝났어요. 이뻐요 ✨';
        m.sayT = 4.5;
      }
    }
    else if (j.k === 'rec') {
      const c = s.customers.find(x => x.id === j.cid && x.st === 'want');
      if (c) {
        c.recDone = 1; c.recPid = j.pid;
        m.say = t('salesSayRec', { n: j.pname || spName(j.sp) });
        m.sayT = 4.5;
        c.bubble = '💖'; c.bubT = 3;
      }
    }
    else if (j.k === 'sellpc') {
      const p = findPet(s, j.pid), c = s.customers.find(x => x.id === j.cid && x.st === 'want');
      if (p && c && matches(c, p)) {
        apply(s, { t: 'sell', pid: p.id, cid: c.id }, by);
        m.say = t('salesSaySold', { n: j.pname || spName(j.sp) });
        m.sayT = 5;
      }
    }
    else if (j.k === 'storysolve') {
      const ex = typeof X === 'function' ? X(s) : (s.extra || s);
      const v = ex && ex.visitor;
      if (v && v.rid === j.rid) {
        const R = typeof REGS !== 'undefined' ? REGS.find(r => r.id === v.rid) : null;
        const st = R && R.steps[v.step];
        if (st && reqMet(s, st.req)) {
          apply(s, { t: 'story', rid: v.rid }, by);
          m.say = t('salesSayStoryOk');
          m.sayT = 4.5;
        } else {
          apply(s, { t: 'storylater', rid: v.rid }, by);
          m.say = t('salesSayStoryLater');
          m.sayT = 4.5;
        }
      }
    }
    else if (j.k === 'adopt') {
      if ((s.offers || []).some(o => o.id === j.oid)) {
        apply(s, { t: 'adopt', oid: j.oid, lang: s.lang }, by);
        m.say = t('salesSayAdopt', { n: spName(j.sp) });
        m.sayT = 4.5;
      }
    }
    else if (j.k === 'sell') { const p = findPet(s, j.pid), c = s.customers.find(x => x.id === j.cid && x.st === 'want'); if (p && c && matches(c, p)) apply(s, { t: 'sell', pid: p.id, cid: c.id }, by); }
    else if (j.k === 'clean') { const p = findPet(s, j.pid); if (p) apply(s, { t: 'clean', pid: p.id }, by); }
    else if (j.k === 'hab') apply(s, { t: 'habclean', iid: j.iid }, by);
    else if (j.k === 'thief') apply(s, { t: 'chase' }, by);
    m.done = (m.done || 0) + 1;
  }
  const staffJobKey = j => j.k === 'online' ? 'online' + j.cid : j.k === 'feed' || j.k === 'clean' || j.k === 'pat' || j.k === 'play' || j.k === 'gpet' ? 'pet' + j.pid : j.k === 'gsvc' || j.k === 'sell' || j.k === 'rec' || j.k === 'sellpc' ? 'cust' + j.cid : j.k === 'storysolve' ? 'visitor' + j.rid : j.k === 'adopt' ? 'adopt' + j.oid : j.k === 'mess' ? 'mess' + j.mid : j.k === 'hab' ? 'hab' + j.iid : j.k === 'crate' || j.k === 'carry' ? 'crate' + j.did : j.k === 'parcel' ? 'parcel' + j.pcid : j.k === 'restock' ? 'restock' + j.iid : j.k === 'thief' ? 'thief' : j.k + (j.cid || '');
  // ---------- online orders (≈20% of customers buy online instead of visiting) ----------
  function toOnline(s, c) {
    s.online = s.online || [];
    c.online = 1; c.pat = c.max = rnd(240, 360); c.t = 0;
    if (c.kind === 'shop') { const stocked = [].concat(...s.items.filter(i => GOODS[i.k] && i.stock > 0).map(i => Object.keys(i.inv || { [i.prod]: 1 }).filter(k => (i.inv ? i.inv[k] : i.stock) > 0))).map(k => PRODUCTS.find(x => x.id === k)).filter(Boolean); const prs = stocked.length && Math.random() < .75 ? stocked : PRODUCTS.filter(x => x.lv <= s.level); const pr = pick(prs.length ? prs : PRODUCTS); c.st = 'oshop'; c.prod = pr.id; c.n = rint(1, 3); }
    s.online.push(c); if (s.online.length > 12) s.online.shift();
    ev(s, { k: 'online', name: c.name, kind: c.kind });
  }
  function stepOnline(s, dt) {
    if (!s.online || !s.online.length) return;
    for (const c of s.online.slice()) { c.pat -= dt; if (c.pat <= 0) { s.online = s.online.filter(x => x !== c); addRep(s, -.3); ev(s, { k: 'onlineLost', name: c.name }); } }
  }
  function onlineStock(s, c) { return s.items.find(i => GOODS[i.k] && (i.inv ? (i.inv[c.prod] || 0) > 0 : i.prod === c.prod && i.stock > 0)); }
  function onlineBest(s, c) { let best = null, bs = -1; for (const p of s.pets) { if (!p || !matches(c, p)) continue; const mk = matchKind(c, p), sc = mk === 'great' ? 3 : mk === 'ok' ? 2 : 1; if (sc > bs) { bs = sc; best = p; } } return best; }
  function onlineSell(s, c, p, by) {
    const mk = matchKind(c, p), v = Math.round(price(s, p, c) * (mk === 'great' ? 1.3 : mk === 'bad' ? .9 : 1) * .95);
    addRep(s, mk === 'great' ? 3 : mk === 'bad' ? -2 : .5); if (p.rescued) addRep(s, 4); if (mk === 'great') qp(s, 'great');
    s.pets[slotOf(s, p.id)] = null;
    c.match = mk; c.amount = v; c.waited = 99; c.pd = { sp: p.sp, coat: p.coat || 0, id: p.id, name: p.name, grow: 1, stars: p.stars || 0, rescued: !!p.rescued, trait: p.trait };
    s.online = s.online.filter(x => x !== c); pay(s, c, by, false);
    return { ok: 1, fx: 'coin', msg: 'onlineSold', p: { name: p.name, c: v, who: c.name } };
  }
  function onlineShip(s, c, by) {
    const it = onlineStock(s, c); if (!it) return { err: 'onlineNoStock' };
    if (!it.inv) { it.inv = {}; if (it.prod) it.inv[it.prod] = it.stock; }
    const n = shelfTake(it, c.prod, c.n || 1) || 1, pr = PRODUCTS.find(x => x.id === c.prod) || { price: GOODS[it.k].price };
    c.amount = n * (pr.price + Math.floor(lvE(s) / 2)); c.waited = 99; c.shelf = it.k;
    s.online = s.online.filter(x => x !== c); pay(s, c, by, false);
    return { ok: 1, fx: 'coin', msg: 'onlineShipped', p: { c: c.amount, who: c.name } };
  }
  function stepStaff(s, dt) {
    if (!s.staff) return;
    const tk = new Set();
    for (const key in s.staff) { const j = s.staff[key].job; if (j) tk.add(staffJobKey(j)); }
    for (const d of s.deliveries || []) if (d.pk && !tk.has('crate' + d.id)) d.pk = 0; // a carrier was let go mid-way: the crate shows again
    for (const key in s.staff) {
      const m = s.staff[key], role = staffRoleOf(key);
      if (m.sayT > 0) { m.sayT -= dt; if (m.sayT <= 0) m.say = null; }
      if (m.job) { m.job.t -= dt; if (m.job.t <= 0) { const j = m.job; m.job = null; m.px = j.x; m.py = j.y; m.rest = 1; staffDo(s, role, m, j); } continue; }
      if (m.rest > 0) { m.rest -= dt; continue; }
      if (!isOpen(s)) continue; // v9.95: after closing the staff finish their current job and go home
      let j = staffJob(s, role, m, tk);
      if (!j && role === 'sales' && Math.random() < 0.2) {
        j = staffJob(s, 'care', m, tk) || staffJob(s, 'clean', m, tk) || staffJob(s, 'cashier', m, tk) || staffJob(s, 'porter', m, tk) || staffJob(s, 'groomer', m, tk) || staffJob(s, 'online', m, tk);
      } else if (!j && !['care', 'sales'].includes(role)) {
        j = staffJob(s, 'care', m, tk) || (role !== 'clean' ? staffJob(s, 'clean', m, tk) : null); // v1.26: nothing to do -> help look after the pets / tidy up
      }
      if (j) tk.add(staffJobKey(j));
      if (j) { const dist = Math.hypot(j.x - (m.px != null ? m.px : s.room.w - 1), j.y - (m.py != null ? m.py : s.room.h - 2)); j.id = s.seq++; j.t = STAFF_DUR[m.lv] + dist / (1.6 + m.lv * .3); m.job = j; }
      else m.rest = 2;
    }
  }
  function mkPet(s, sp, lang, gen) {
    const names = NAMES[lang] || NAMES.ko;
    const used = new Set(s.pets.filter(Boolean).map(p => p.name));
    let name = pick(names); for (let i = 0; i < 8 && used.has(name); i++) name = pick(names);
    return { id: 'p' + (++pid) + Math.floor(Math.random() * 1000), sp, name, sex: Math.random() < .5 ? 'm' : 'f',
      coat: 1 + Math.floor(Math.random() * 1e9), gen: gen || 0, grow: 0, hunger: 70, clean: 90, happy: 70, stress: 20, bored: 30, trait: randTrait(), lv: 1, exp: 0, tcd: 0, groomed: false, fav: false, bcd: 0, pat: 0, stars: 0 };
  }
  const findPet = (s, id) => s.pets.find(p => p && p.id === id);
  const findAnyPet = (s, id) => findPet(s, id) || (s.home && s.home.pets.find(p => p.id === id));
  const canBreed = p => p && p.grow >= 1 && p.bcd <= 0 && p.happy >= 50 && p.hunger >= 40 && !p.escaped;
  const mates = (s, p) => s.pets.filter(q => q && q.id !== p.id && q.sp === p.sp && q.sex !== p.sex && q.grow >= 1);
  const breedTime = sp => Math.round(SPECIES[sp].grow * 25);
  const deliveryTime = sp => 20 + SPECIES[sp].lv * 3;

  // ---------- actions ----------
  function apply(s, a, by) {
    const p = a.pid ? findPet(s, a.pid) : null;
    const need = cost => s.coins >= cost;
    if (a.lang) s.lang = a.lang;
    { const hr = HOME.apply(s, a, by); if (hr !== undefined) return hr; }
    { const fr = FARM.apply(s, a, by); if (fr !== undefined) return fr; }
    { const rr = RANCH.apply(s, a, by); if (rr !== undefined) return rr; } // v1.27 ranch
    { if (typeof TRAIN !== 'undefined' && TRAIN.apply) { const trr = TRAIN.apply(s, a, by); if (trr !== undefined) return trr; } }
    { const cr = CAFE.apply(s, a, by); if (cr !== undefined) return cr; }
    { const hr = HOSP.apply(s, a, by); if (hr !== undefined) return hr; }
    { const pr = PARK.apply(s, a, by); if (pr !== undefined) return pr; } // v9.96: the village park
    { const vr = VILLAGE.apply(s, a, by); if (vr !== undefined) return vr; }
    { const sr = SALON.apply(s, a, by); if (sr !== undefined) return sr; } // v9.99: grooming salon
    { const tr = TOWN.apply(s, a, by); if (tr !== undefined) return tr; } // v9.99: follower pet, fishing // v9.97: avenue, lake, monument, notice board
    { const xr = EXTRA.apply(s, a, by); if (xr !== undefined) return xr; }
    if (by !== 'staff' && ['feed', 'clean', 'play', 'pat', 'care', 'checkout', 'sell', 'groom', 'cleanmess', 'trick', 'restock'].includes(a.t)) EXTRA.onCoopAction(s, by);
    switch (a.t) {
      case 'feed': {
        if (!p) return { err: 'gone' };
        const line = dietOf(p.sp);
        let tier = a.tier != null ? a.tier : [1, 0, 2].find(k => (s.feed[line + ':' + k] || 0) > 0);
        if (tier == null || !(s.feed[line + ':' + tier] > 0)) return { err: 'needFood2', p: { ln: line } };
        s.feed[line + ':' + tier]--; const gain = p.hunger < 90;
        p.hunger = Math.min(100, p.hunger + FEED_TIERS[tier].hunger);
        if (tier === 0) p.stress = Math.min(100, p.stress + 4);
        if (tier === 2) { p.stress = Math.max(0, p.stress - 10); p.bored = Math.max(0, p.bored - 6); if (gain) gainExp(s, p, 3); }
        s.stats.fed++; qp(s, 'feed'); if (gain) { addXp(s, 2); gainExp(s, p, p.trait === 'glutton' ? 4 : 2); }
        if (p.trait === 'glutton') p.stress = Math.max(0, p.stress - 10);
        ev(s, { k: 'fed', by, pet: p.name, pid: p.id }); return { ok: 1, fx: 'feed', msg: tier === 2 ? 'fedPremium' : tier === 0 ? 'fedCheap' : null, p: { name: p.name } };
      }
      case 'clean': {
        if (!p) return { err: 'gone' };
        const gain = p.clean < 90; p.clean = 100;
        s.stats.cleaned++; qp(s, 'clean'); if (gain) { addXp(s, 2); gainExp(s, p, 2); }
        ev(s, { k: 'clean', by, pet: p.name, pid: p.id }); return { ok: 1, fx: 'clean' };
      }
      case 'play': {
        if (!p) return { err: 'gone' };
        const gain = p.bored > 10; p.bored = Math.max(0, p.bored - 35); p.happy = 100 - (p.stress + p.bored) / 2;
        s.stats.played++; qp(s, 'play'); if (gain) { addXp(s, 2); gainExp(s, p, 2); }
        ev(s, { k: 'play', by, pet: p.name, pid: p.id }); return { ok: 1, fx: 'play' };
      }
      case 'pat': {
        if (!p) return { err: 'gone' };
        if (p.pat > 0) return { ok: 1, fx: 'pat' };
        p.stress = Math.max(0, p.stress - (p.trait === 'sweet' ? 12 : 6)); p.happy = 100 - (p.stress + p.bored) / 2; p.pat = 8; gainExp(s, p, 1); return { ok: 1, fx: 'pat' };
      }
      case 'groom': {
        if (!p) return { err: 'gone' };
        if (!GROOMABLE[SPECIES[p.sp].cat]) return { err: 'gone' };
        if (p.groomed) return { ok: 1 };
        if (s.kits <= 0) return { err: 'needKit' };
        s.kits--; p.groomed = true; p.happy = Math.min(100, p.happy + 10);
        s.stats.groomed++; qp(s, 'groom'); addXp(s, 4);
        ev(s, { k: 'groom', by, pet: p.name, pid: p.id }); return { ok: 1, fx: 'groom' };
      }
      case 'care': { // mini-games: bath / brush / toy, score 0..1
        if (!p) return { err: 'gone' };
        const sc = clamp(+a.score || 0, 0, 1), tr = TRAITS[p.trait] || TRAITS.calm;
        if (a.kind === 'bath') { p.clean = Math.min(100, p.clean + 60 + 40 * sc); p.stress = clamp(p.stress + tr.bath - 12 * sc, 0, 100); qp(s, 'clean'); s.stats.cleaned++; }
        else if (a.kind === 'brush') { p.clean = Math.min(100, p.clean + 20 * sc); p.stress = clamp(p.stress - 35 * sc, 0, 100); }
        else if (a.kind === 'toy' || ['catch', 'hide', 'bubble', 'fetch'].includes(a.kind)) { const lv = a.kind === 'toy' ? clamp(a.lv | 0, 0, 2) : 1, ST = [12, 22, 38][lv], BO = [35, 55, 80][lv]; p.bored = clamp(p.bored - BO * (.5 + .5 * sc), 0, 100); p.stress = clamp(p.stress - ST * (.4 + .6 * sc), 0, 100); p.hunger = Math.max(0, p.hunger - 3 - lv * 3); qp(s, 'play'); s.stats.played++; if (lv) gainExp(s, p, lv * 3); }
        p.happy = 100 - (p.stress + p.bored) / 2;
        qp(s, 'mini'); addXp(s, 3 + Math.round(5 * sc)); gainExp(s, p, 4 + Math.round(8 * sc));
        ev(s, { k: 'mini', by, pet: p.name, pid: p.id, kind: a.kind });
        const rec = EXTRA.onMini(s, a.kind, a.lv, sc);
        if (rec && rec.record) return { ok: 1, msg: 'newRecord', p: { c: rec.bonus }, fx: 'love' };
        return { ok: 1, msg: sc >= .8 ? 'miniGreat' : 'miniOk', fx: 'love' };
      }
      case 'trick': {
        if (!p) return { err: 'gone' };
        const tks = tricksOf(p); if (!tks.length) return { err: 'noTrick' };
        if (p.tcd > 0) return { err: 'trickTired' };
        const k = a.trick && tks.includes(a.trick) ? a.trick : pick(tks);
        const okp = clamp(.6 + .04 * p.lv - p.stress / 200 - p.bored / 300, .2, .97);
        const ok = Math.random() < okp;
        p.tcd = 35; gainExp(s, p, ok ? 6 : 3); qp(s, 'trick');
        const c = a.cid ? s.customers.find(x => x.id === a.cid) : null;
        let tip = 0;
        if (c) {
          if (ok) { c.pat = c.max; c.willLeave = false; tip = 8 + p.lv * 4; c.trickTip = (c.trickTip || 0) + tip; c.mul = +(c.mul * 1.08).toFixed(2); addRep(s, .8); }
          else addRep(s, .2);
          c.wowT = 4;
        }
        if (!c && ok) { p.stress = Math.max(0, p.stress - 5); }
        ev(s, { k: 'trick', by, pid: p.id, pet: p.name, trick: k, ok, cid: c ? c.id : null });
        return { ok: 1, msg: ok ? (c ? 'trickOkCust' : 'trickOk') : 'trickFail', p: { name: p.name, tr: k, c: tip }, fx: ok ? 'love' : null };
      }
      case 'pen': {
        if (!p) return { err: 'gone' };
        if (!p.pen) {
          const pens = s.items.filter(i => isPenKind(i.k));
          if (!pens.length) return { err: 'needPen' };
          if (!ART.roams(p.sp)) return { err: 'penNo' };
          const cap = pens.reduce((sum, i) => sum + ((PEN_INFO[i.k] && PEN_INFO[i.k].cap) || 4), 0);
          if (s.pets.filter(x => x && x.pen).length >= cap) return { err: 'penFull' };
        }
        p.pen = !p.pen; return { ok: 1, msg: p.pen ? 'penIn' : 'penOut', p: { name: p.name } };
      }
      case 'restock': { // v1.13b: fill ONE product (or ALL unlocked products when prod === 'all') of the shelf up to SHELF_CAP
        const it = s.items.find(i => i.id === a.iid && GOODS[i.k]); if (!it) return { err: 'gone' };
        if (!it.inv) { it.inv = {}; if (it.prod && it.stock > 0) it.inv[it.prod] = it.stock; }
        if (a.prod === 'all') {
          const prs = PRODUCTS.filter(x => x.shelf === it.k && x.lv <= s.level);
          let totalNeed = 0, totalCost = 0;
          for (const pr of prs) {
            const n = Math.max(0, SHELF_CAP - (it.inv[pr.id] || 0));
            totalNeed += n;
            totalCost += n * pr.cost;
          }
          if (totalNeed <= 0) return { err: 'shelfFull' };
          if (!need(totalCost)) return { err: 'notEnough' };
          s.coins -= totalCost;
          for (const pr of prs) it.inv[pr.id] = SHELF_CAP;
          shelfSync(it);
          return { ok: 1, fx: 'coin', msg: 'restocked' };
        }
        const pid = a.prod || it.prod, pr = PRODUCTS.find(x => x.id === pid && x.shelf === it.k);
        if (!pr || pr.lv > s.level) return { err: 'gone' };
        const n = SHELF_CAP - (it.inv[pid] || 0); if (n <= 0) return { err: 'shelfFull' };
        const cost = n * pr.cost; if (!need(cost)) return { err: 'notEnough' };
        s.coins -= cost; it.inv[pid] = SHELF_CAP; shelfSync(it); return { ok: 1, fx: 'coin', msg: 'restocked' };
      }
      case 'groomsvc': {
        const c = s.customers.find(x => x.id === a.cid && x.st === 'gwait'); if (!c) return { err: 'gone' };
        const sc = clamp(+a.score || 0, 0, 1);
        c.amount = Math.round((60 + lvE(s) * 8) * (0.6 + 0.6 * sc)); c.st = 'pay'; c.waited = 0; c.pat = c.max = 90;
        if (sc > .7) addRep(s, 1);
        qp(s, 'mini'); addXp(s, 6);
        return { ok: 1, msg: 'groomDone', fx: 'love' };
      }
      case 'gcare': {
        const g = s.guests.find(x => x.id === a.gid); if (!g) return { err: 'gone' };
        if (a.what === 'feed') g.hunger = Math.min(100, g.hunger + 50); else g.happy = Math.min(100, g.happy + 40);
        addXp(s, 1); return { ok: 1, fx: a.what === 'feed' ? 'feed' : 'play' };
      }
      case 'rescue': {
        const st = s.stray; if (!st || st.id !== a.sid) return { err: 'gone' };
        const kind = kindOf(st.sp);
        const np = mkPet(s, st.sp, a.lang); np.sex = st.sex; np.trait = st.trait; np.grow = 1; np.rescued = true;
        np.hunger = 20; np.clean = 15; np.stress = 75; np.bored = 60; np.happy = 100 - (np.stress + np.bored) / 2;

        // 1. 유기동물 보관소가 있을 때: 보관소로 이동
        const hasShelter = (s.town && s.town.objs && s.town.objs.some(o => o.k === 'shelter'));
        if (hasShelter) {
          s.shelter = s.shelter || { pets: [], seq: 1, staff: { name: '미소', lv: 1 }, adoptionsToday: 0, totalAdopted: 0 };
          s.shelter.pets = s.shelter.pets || [];
          if (s.shelter.pets.length < 12) {
            s.shelter.pets.push(np); s.book[st.sp] = 1; s.stray = null; addRep(s, 3); addXp(s, 10);
            ev(s, { k: 'rescued', by, pet: np.name, sp: st.sp, pid: np.id, dest: 'shelter' });
            return { ok: 1, msg: 'rescuedShelter', p: { name: np.name }, fx: 'love' };
          }
        }

        // 2. 유기 보관소가 없거나 꽉 찼을 때: 카페 놀이방으로 이동
        const cafeBuilt = s.cafe && s.cafe.built;
        const cafeCap = cafeBuilt && CAFE_LV && CAFE_LV[s.cafe.lv || 1] ? CAFE_LV[s.cafe.lv || 1].pets : 0;
        if (cafeBuilt && (s.cafe.pets || []).length < cafeCap) {
          s.cafe.pets = s.cafe.pets || [];
          s.cafe.pets.push(np); s.book[st.sp] = 1; s.stray = null; addRep(s, 3); addXp(s, 10);
          ev(s, { k: 'rescued', by, pet: np.name, sp: st.sp, pid: np.id, dest: 'cafe' });
          return { ok: 1, msg: 'rescuedCafe', p: { name: np.name }, fx: 'love' };
        }

        // 3. 카페 놀이방이 없거나 꽉 찼을 때: 동물 우리로 이동
        const free = freeSlotsKind(s, kind);
        if (free.length) {
          s.pets[free[0]] = np; s.book[st.sp] = 1; s.stray = null; addRep(s, 3); addXp(s, 10);
          ev(s, { k: 'rescued', by, pet: np.name, sp: st.sp, pid: np.id, dest: 'shop' });
          return { ok: 1, msg: 'rescuedMsg', p: { name: np.name }, fx: 'love' };
        }

        // 4. 동물 우리도 없으면: 우리 추가 안내 창 띄우기
        return { err: 'needHouseModal', p: { h: kind, sp: st.sp } };
      }
      case 'catchstray': {
        const sp = a.sp || 'shiba';
        const kind = kindOf(sp);
        const np = mkPet(s, sp, a.lang); np.grow = 1; np.rescued = true;
        np.hunger = 25; np.clean = 20; np.stress = 65; np.bored = 50; np.happy = 60;

        // 1. 유기동물 보관소
        const hasShelter = (s.town && s.town.objs && s.town.objs.some(o => o.k === 'shelter'));
        if (hasShelter) {
          s.shelter = s.shelter || { pets: [], seq: 1, staff: { name: '미소', lv: 1 }, adoptionsToday: 0, totalAdopted: 0 };
          s.shelter.pets = s.shelter.pets || [];
          if (s.shelter.pets.length < 12) {
            s.shelter.pets.push(np); s.book[sp] = 1; addRep(s, 2); addXp(s, 8);
            return { ok: 1, msg: 'strayCaughtShelter', p: { name: np.name }, fx: 'love' };
          }
        }
        // 2. 카페 놀이방
        const cafeBuilt = s.cafe && s.cafe.built;
        const cafeCap = cafeBuilt && CAFE_LV && CAFE_LV[s.cafe.lv || 1] ? CAFE_LV[s.cafe.lv || 1].pets : 0;
        if (cafeBuilt && (s.cafe.pets || []).length < cafeCap) {
          s.cafe.pets = s.cafe.pets || [];
          s.cafe.pets.push(np); s.book[sp] = 1; addRep(s, 2); addXp(s, 8);
          return { ok: 1, msg: 'strayCaughtCafe', p: { name: np.name }, fx: 'love' };
        }
        // 3. 동물 우리
        const free = freeSlotsKind(s, kind);
        if (free.length) {
          s.pets[free[0]] = np; s.book[sp] = 1; addRep(s, 2); addXp(s, 8);
          return { ok: 1, msg: 'strayCaughtShop', p: { name: np.name }, fx: 'love' };
        }
        return { err: 'needHouseModal', p: { h: kind, sp } };
      }
      case 'shelter_feed': {
        const sh = s.shelter = s.shelter || { pets: [], staff: { name: '미소', lv: 1 } };
        for (const p of (sh.pets || [])) { p.hunger = Math.min(100, (p.hunger || 0) + 40); p.happy = Math.min(100, (p.happy || 50) + 20); }
        addXp(s, 5); return { ok: 1, fx: 'feed', msg: 'shelterFed' };
      }
      case 'shelter_play': {
        const sh = s.shelter = s.shelter || { pets: [], staff: { name: '미소', lv: 1 } };
        for (const p of (sh.pets || [])) { p.bored = Math.max(0, (p.bored || 50) - 40); p.happy = Math.min(100, (p.happy || 50) + 30); }
        addXp(s, 5); return { ok: 1, fx: 'love', msg: 'shelterPlayed' };
      }
      case 'shelter_clean': {
        const sh = s.shelter = s.shelter || { pets: [], staff: { name: '미소', lv: 1 } };
        for (const p of (sh.pets || [])) { p.clean = Math.min(100, (p.clean || 50) + 50); p.stress = Math.max(0, (p.stress || 50) - 30); }
        addXp(s, 5); return { ok: 1, fx: 'clean', msg: 'shelterCleaned' };
      }
      case 'shelter_toshop': {
        const sh = s.shelter; if (!sh || !sh.pets) return { err: 'gone' };
        const petIdx = sh.pets.findIndex(p => p.id === a.pid); if (petIdx < 0) return { err: 'gone' };
        const pet = sh.pets[petIdx], kind = kindOf(pet.sp), free = freeSlotsKind(s, kind);
        if (!free.length) return { err: 'needHouseModal', p: { h: kind, sp: pet.sp } };
        sh.pets.splice(petIdx, 1);
        s.pets[free[0]] = pet;
        return { ok: 1, fx: 'love', msg: 'shelterMovedToShop', p: { name: pet.name } };
      }
      case 'shelter_adopt': {
        const sh = s.shelter; if (!sh || !sh.pets) return { err: 'gone' };
        const petIdx = sh.pets.findIndex(p => p.id === a.pid); if (petIdx < 0) return { err: 'gone' };
        const pet = sh.pets.splice(petIdx, 1)[0];
        const fee = 800 + Math.floor(Math.random() * 500);
        s.coins += fee; sh.totalAdopted = (sh.totalAdopted || 0) + 1; addRep(s, 2); addXp(s, 10);
        return { ok: 1, fx: 'coin', msg: 'shelterAdoptedManual', p: { name: pet.name, fee } };
      }
      case 'zoo_feed': {
        const z = s.zoo = s.zoo || { visitors: 0, coins: 0, fed: {} };
        z.fed = z.fed || {};
        const fKey = a.facility || 'all';
        if (fKey === 'all') {
          for (const k of ['savanna', 'panda', 'elephant', 'tiger', 'lagoon', 'polar']) z.fed[k] = (z.fed[k] || 0) + 1;
          z.lastFed = Date.now();
          addXp(s, 15); addRep(s, 2);
          return { ok: 1, fx: 'love', msg: 'zooFed' };
        }
        z.fed[fKey] = (z.fed[fKey] || 0) + 1;
        z.lastFed = Date.now();
        addXp(s, 5); addRep(s, 1);
        return { ok: 1, fx: 'love', msg: 'zooFed' };
      }
      case 'zoo_ticket': {
        const z = s.zoo = s.zoo || { visitors: 0, coins: 0 };
        const c = z.coins || 0;
        if (c <= 0) return { err: 'noCoins' };
        z.coins = 0; s.coins += c;
        return { ok: 1, fx: 'coin', msg: 'zooTicketCollected', p: { c: fmt(c) } };
      }
      case 'catch': {
        const e = s.event; if (!e || e.k !== 'escape' || e.pid !== a.pid) return { err: 'gone' };
        gainExp(s, p, 5); addXp(s, 10); addRep(s, 1); endEvent(s, true); return { ok: 1, msg: 'caught', p: { name: e.name }, fx: 'love' };
      }
      case 'chase': {
        const e = s.event; if (!e || e.k !== 'thief') return { err: 'gone' };
        addXp(s, 8); addRep(s, 1); endEvent(s, true);
        return { ok: 1, msg: 'thiefCaught', p: { name: e.name }, fx: 'love' };
      }
      case 'habclean': { // v1.11: clean out a cage / tank / terrarium
        const it = s.items.find(x => x.id === a.iid && x.k === 'hab'); if (!it) return { err: 'gone' };
        if (!((it.dirt || 0) >= 5)) return { err: 'habClean' };
        const was = it.dirt; it.dirt = 0; addXp(s, was >= 60 ? 4 : 2);
        for (const i of slotsOfItem(it)) { const p = s.pets[i]; if (p) { p.stress = clamp(p.stress - 8, 0, 100); p.happy = 100 - (p.stress + p.bored) / 2; } }
        return { ok: 1, fx: 'clean', msg: 'habCleaned' };
      }
      case 'cleanmess': {
        const m = s.messes.find(x => x.id === a.mid); if (!m) return { err: 'gone' };
        s.messes = s.messes.filter(x => x.id !== m.id); addXp(s, 3);
        if (s.event && s.event.k === 'mess' && !s.messes.length) { addRep(s, 2); endEvent(s, true); }
        return { ok: 1, fx: 'clean' };
      }
      case 'custsorry': { // v1.17: "미안하지만 다음에 오세요" -- no fitting pet, let the customer go now
        const c = s.customers.find(x => x.id === a.cid && ['want', 'shop', 'browse'].includes(x.st)); if (!c) return { err: 'gone' };
        custLeave(s, c, 'sorry'); return { ok: 1, msg: 'custSorryOk' };
      }
      case 'likeall': { // v1.13: one tap -- like & read every new post / review, collect the small rewards together
        let n = 0; for (const l of s.letters || []) { if (l.read && !l.unread) continue; if (!l.liked && !l.mine) { l.liked = true; l.likes++; } l.read = true; l.unread = false; n++; }
        if (!n) return { err: 'igNothing' };
        const f = Math.min(30, n); s.followers = (s.followers || 20) + f; addRep(s, Math.min(3, n * .3)); addXp(s, Math.min(20, n * 2)); igCheckTier(s);
        return { ok: 1, msg: 'igLikedAll', p: { n, f } };
      }
      case 'likeletter': { const l = s.letters.find(x => x.id === a.lid); if (!l) return { err: 'gone' }; if (!l.liked) { l.liked = true; l.likes++; addRep(s, .3); } l.read = true; return { ok: 1 }; }
      case 'icomment': {
        const l = s.letters.find(x => x.id === a.lid); if (!l) return { err: 'gone' };
        const txt = String(a.text || '').replace(/[<>]/g, '').trim().slice(0, 100); if (!txt) return { err: 'gone' };
        l.chat = l.chat || []; l.chat.push({ w: 'm', x: txt }); l.read = true; l.unread = false; l.lang = a.lang || 'ko';
        if (!l.ended) l.wait = rnd(6, 16); else if (Math.random() < .5) { l.ended = false; l.wait = rnd(8, 18); }
        let msg = null;
        s.igReplies = (s.igReplies || 0) + 1; EXTRA.qp(s, 'reply');
        if (!l.rw1) { l.rw1 = 1; addRep(s, .5); s.followers = (s.followers || 20) + rint(1, 3); msg = 'replyThanks'; }
        if (l.kind === 'bad' && !l.rw2 && /죄송|미안|사과|sorry|извин|прост/i.test(txt)) { l.rw2 = 1; addRep(s, 1); msg = 'replyApology'; }
        return { ok: 1, msg };
      }
      case 'ipost': {
        const pp = findPet(s, a.pid); if (!pp) return { err: 'gone' };
        if ((s.postDay || 0) === s.clock.day && (s.postsToday || 0) >= 3) return { err: 'postLimit' };
        if (s.postDay !== s.clock.day) { s.postDay = s.clock.day; s.postsToday = 0; }
        s.postsToday++;
        const txt = String(a.text || '').replace(/[<>]/g, '').trim().slice(0, 120);
        const l = { id: s.lseq++, mine: true, from: s.shop, pet: pp.name, sp: pp.sp, coat: pp.coat || 0, age: ageOf(pp), kind: 'mine', n: rint(0, 9), likes: rint(3, 12), text: txt, chat: [], fansLeft: rint(2, 4), fanT: rnd(6, 14), lang: a.lang || 'ko' };
        publish(s, l, true); l.read = true; addRep(s, .3); addXp(s, 3); s.followers = (s.followers || 20) + rint(2, 6) + Math.round(popOf(s) / 10);
        { const ch = igCh(s); if (!ch.done && igChFit(ch.k, pp)) { ch.done = 1; l.ch = ch.k; const pop = popOf(s), c = Math.round((100 + 25 * lvE(s)) / 10) * 10, f = rint(25, 50) + Math.round(pop / 4);
            l.likes += rint(150, 400) + Math.round(pop * 3); l.fansLeft += 2; s.followers += f; s.coins += c; addRep(s, 1); addXp(s, 10); igCheckTier(s);
            return { ok: 1, msg: 'igChDone', p: { c: fmt(c), f } }; } }
        igCheckTier(s);
        return { ok: 1, msg: 'posted' };
      }
      case 'readletter': { const l = s.letters.find(x => x.id === a.lid); if (l) { l.read = true; l.unread = false; } return { ok: 1 }; }
      // ---- adoption ----
      case 'adopt': {
        const o = s.offers.find(x => x.id === a.oid); if (!o) return { err: 'gone' };
        if (o.cd > Date.now()) return { err: 'quizWait' };
        if (!need(o.cost)) return { err: 'notEnough' };
        const kind = kindOf(o.sp), free = freeSlotsKind(s, kind);
        if (!free.length) return { err: 'needHouse', p: { h: kind } };
        s.coins -= o.cost;
        s.offers = s.offers.filter(x => x.id !== o.id);
        const d = { id: s.seq++, sp: o.sp, coat: o.coat, sex: o.sex, stars: o.stars, slot: free[0], left: deliveryTime(o.sp), max: deliveryTime(o.sp), st: 'road', lang: a.lang };
        s.deliveries.push(d); qp(s, 'buy'); addXp(s, 5);
        ev(s, { k: 'ordered', by, sp: o.sp });
        return { ok: 1, fx: 'coin', msg: 'ordered', p: { sp: o.sp, t: d.left } };
      }
      case 'quizfail': { const o = s.offers.find(x => x.id === a.oid); if (o) o.cd = Date.now() + 60000; return { ok: 1 }; }
      case 'reroll': {
        const cost = 30 + lvE(s) * 10; if (!need(cost)) return { err: 'notEnough' };
        s.coins -= cost; ensureOffers(s, true); return { ok: 1, fx: 'coin' };
      }
      case 'unpack': {
        const d = s.deliveries.find(x => x.id === a.did); if (!d || d.st !== 'arrived') return { err: 'gone' };
        let slot = d.slot;
        if (a.iid != null) {
          const h = habById(s, a.iid); if (!h) return { err: 'gone' };
          if (h.kind !== kindOf(d.sp)) return { err: 'wrongHouse', p: { h: kindOf(d.sp) } };
          const rs = reservedSlots(s); rs.delete(d.slot);
          const f = slotsOfItem(h).filter(i => !s.pets[i] && !rs.has(i)); if (!f.length) return { err: 'houseFull' };
          slot = f[0];
        } else if (s.pets[slot] || habKind(s, slot) !== kindOf(d.sp)) { const f = freeSlotsKind(s, kindOf(d.sp)); if (!f.length) return { err: 'needHouse', p: { h: kindOf(d.sp) } }; slot = f[0]; }
        const np = mkPet(s, d.sp, d.lang || a.lang); np.sex = d.sex; np.stars = d.stars; if (d.coat) np.coat = d.coat;
        EXTRA.noteRare(s, np); EXTRA.photo(s, np, true);
        s.pets[slot] = np; s.book[d.sp] = 1; s.stats.bought++;
        s.deliveries = s.deliveries.filter(x => x.id !== d.id);
        addXp(s, 3);
        ev(s, { k: 'buy', by, pet: np.name, sp: d.sp, pid: np.id });
        return { ok: 1, msg: 'bought', p: { name: np.name, sp: d.sp }, fx: 'unpack', pid: np.id };
      }
      // ---- selling & checkout ----
      case 'sell': {
        const c = s.customers.find(x => x.id === a.cid);
        if (!p || !c) return { err: 'gone' };
        const rareP = !!rareOf(p.coat || 0);
        if (rareP && c.type !== 'vip') return { err: 'vipOnly' };            // no rep loss: just not for this customer
        if (c.type === 'vip' && !rareP) return { err: 'vipWantsRare' };
        if (c.type === 'breeder' && !(p.stars > 0)) { addRep(s, -.5); return { err: 'breederNo' }; }
        if (c.type === 'collector' && !(p.sp === c.sp && ((p.lv || 1) >= 3 || (p.stars || 0) > 0))) return { err: 'collectorNo' };
        const catOk = (!c.sp || p.sp === c.sp) && (!c.cat || SPECIES[p.sp].cat === c.cat);
        if (!catOk || p.grow < 1 || p.fav) { addRep(s, -1); c.pat = Math.max(5, c.pat - 20); return { err: 'declined' }; }
        const mk = matchKind(c, p);
        let v = Math.round(price(s, p, c) * (mk === 'great' ? 1.3 : mk === 'bad' ? .9 : 1));
        if (c.type === 'family') { c.kit = Math.round(v * .12); v += c.kit; } // + a starter kit (food, toys)
        TOWN.mood(s, mk === 'great' ? 1 : mk === 'bad' ? -.3 : .5, mk === 'bad' ? 'badmatch' : null);
        addRep(s, mk === 'great' ? (c.type === 'celeb' ? 6 : 3) : mk === 'bad' ? -2 : .5);
        if (p.rescued) addRep(s, 4);
        if (mk === 'great') qp(s, 'great');
        s.pets[slotOf(s, p.id)] = null;
        c.match = mk;
        c.st = 'pay'; c.amount = v; c.pd = { sp: p.sp, coat: p.coat || 0, id: p.id, name: p.name, grow: 1, stars: p.stars || 0, rescued: !!p.rescued, trait: p.trait };
        c.pat = c.max = 90 * (s.up.sign ? 1.5 : 1); c.waited = 0;
        ev(s, { k: 'handover', by, pet: p.name, sp: p.sp, cid: c.id, pd: c.pd });
        return { ok: 1, msg: mk === 'great' ? 'matchGreat' : mk === 'bad' ? 'matchBad' : 'matchOk', p: { name: p.name }, fx: 'love', match: mk };
      }
      case 'setlang': s.lang = a.lang; return { ok: 1 };
      case 'checkout': {
        const c = s.customers.find(x => x.id === a.cid && x.st === 'pay'); if (!c) return { err: 'gone' };
        const v = pay(s, c, by, false);
        return { ok: 1, fx: 'coin', msg: c.waited < 15 ? 'paidTip' : 'paid', p: { c: v } };
      }
      case 'breed': {
        const q = findPet(s, a.mate);
        if (!p || !q || p.sp !== q.sp || p.sex === q.sex) return { err: 'breedNoMate' };
        if (p.grow < 1 || q.grow < 1) return { err: 'breedAdult' };
        if (!canBreed(p) || !canBreed(q)) return { err: p.bcd > 0 || q.bcd > 0 ? 'breedTired' : 'breedMood' };
        const free = freeSlotsKind(s, kindOf(p.sp));
        if (!free.length) return { err: 'breedNoSlot', p: { h: kindOf(p.sp) } };
        const cat = SPECIES[p.sp].cat;
        const litter = Math.min(free.length, cat === 'fish' || cat === 'small' ? rint(1, 3) : rint(1, 2));
        s.breeding.push({ id: s.seq++, sp: p.sp, a: p.id, b: q.id, na: p.name, nb: q.name, n: litter, slots: free.slice(0, litter), stars: Math.max(p.stars || 0, q.stars || 0), left: breedTime(p.sp), max: breedTime(p.sp), lang: a.lang });
        p.bcd = q.bcd = 600; p.happy = Math.min(100, p.happy + 10); q.happy = Math.min(100, q.happy + 10);
        ev(s, { k: 'breed', by, pa: p.name, pb: q.name, sp: p.sp });
        return { ok: 1, msg: 'breedStart', p: { a: p.name, b: q.name }, fx: 'love' };
      }
      case 'house': {
        const i = a.slot; const lv = s.houses[i];
        if (lv == null || lv >= HOUSE_MAX) return { err: 'gone' };
        const cost = houseCost(lv);
        if (!need(cost)) return { err: 'notEnough' };
        s.coins -= cost; const hi = habItem(s, i); (hi ? slotsOfItem(hi) : [i]).forEach(k => { s.houses[k] = lv + 1; const q = s.pets[k]; if (q) q.happy = Math.min(100, q.happy + 20); }); addXp(s, 5 * lv);
        const hp = s.pets[i];
        ev(s, { k: 'house', by, n: lv + 1, pet: hp ? hp.name : '' }); return { ok: 1, msg: 'houseUp', p: { n: lv + 1 }, fx: 'coin' };
      }
      case 'habkind': {
        const h = habItem(s, a.slot); if (!h || !HAB_KINDS.includes(a.kind)) return { err: 'gone' };
        const rs0 = reservedSlots(s); if (slotsOfItem(h).some(i => s.pets[i] || rs0.has(i))) return { err: 'habBusy' };
        if (h.kind === a.kind) return { ok: 1 };
        if (!need(100)) return { err: 'notEnough' };
        s.coins -= 100; h.kind = a.kind; return { ok: 1, fx: 'coin' };
      }
      case 'release': {
        if (!p) return { err: 'gone' };
        const back = p.gen ? 0 : Math.round(SPECIES[p.sp].cost * 0.3);
        s.pets[slotOf(s, p.id)] = null; s.coins += back;
        return { ok: 1, msg: 'released', p: { name: p.name } };
      }
      case 'rename': {
        if (!p) return { err: 'gone' };
        const n = String(a.name || '').replace(/[<>&"]/g, '').trim().slice(0, 12);
        if (n) p.name = n; return { ok: 1 };
      }
      case 'fav': { if (!p) return { err: 'gone' }; p.fav = !p.fav; return { ok: 1 }; }
      case 'wearbuy': {
        const W = PET_WEAR.find(x => x.id === a.id); if (!W) return { err: 'gone' };
        s.petWear = s.petWear || {}; if (s.petWear[W.id]) return { ok: 1 };
        if (s.coins < W.cost) return { err: 'notEnough' };
        s.coins -= W.cost; s.petWear[W.id] = 1;
        return { ok: 1, fx: 'coin', msg: 'wearBought' };
      }
      case 'wear': {
        const tp = findAnyPet(s, a.pid); if (!tp) return { err: 'gone' };
        const W = a.id ? PET_WEAR.find(x => x.id === a.id) : null;
        if (a.id && (!W || !(s.petWear || {})[a.id])) return { err: 'gone' };
        if (W && W.slot === 'cloth' && !ART.canCloth(tp.sp)) return { err: 'noCloth' }; // fish, birds, reptiles, round rodents: collar + hat only
        tp.wear = tp.wear || {};
        if (W) tp.wear[W.slot] = W; else if (a.slot) delete tp.wear[a.slot];
        return { ok: 1, fx: 'place' };
      }
      case 'slot': {
        if (s.slots >= MAX_SLOTS) return { err: 'gone' };
        const cost = slotCost(s.slots);
        if (!need(cost)) return { err: 'notEnough' };
        if (!freeSpot(s, 'hab')) return { err: 'noRoom' };
        s.coins -= cost; s.slots++; s.pets.push(null); s.houses.push(1);
        const it = addItem(s, 'hab', { slot: s.slots - 1, kind: HAB_KINDS.includes(a.kind) ? a.kind : 'dogbed' });
        ev(s, { k: 'slot', by, n: s.slots }); return { ok: 1, fx: 'coin', place: it.id };
      }
      case 'hire': {
        const r = ROLE(a.role); if (!r || r.ulv > s.level) return { err: 'gone' };
        if (r.needItem && !s.items.some(i => i.k === r.needItem)) return { err: 'needGroomTable' };
        s.staff = s.staff || {}; const cnt = Object.keys(s.staff).filter(k => staffRoleOf(k) === r.id).length; if (cnt >= STAFF_PER_ROLE) return { err: 'gone' };
        let key = r.id, k = 2; while (s.staff[key]) key = r.id + '#' + (k++);
        const cost = staffHireCost(r, cnt); if (!need(cost)) return { err: 'notEnough' };
        s.coins -= cost; s.staff[key] = { lv: 1, seed: rint(1, 99999), name: uniqueStaffName(s), done: 0 };
        return { ok: 1, fx: 'coin', msg: 'hired', p: { n: s.staff[key].name } };
      }
      case 'staffup': {
        const key = a.key || a.role, r = ROLE(staffRoleOf(key)), m = s.staff && s.staff[key]; if (!r || !m || m.lv >= STAFF_MAX) return { err: 'gone' };
        const cost = staffUpCost(r, m.lv + 1); if (!need(cost)) return { err: 'notEnough' };
        s.coins -= cost; m.lv++; return { ok: 1, fx: 'coin', msg: 'staffUp', p: { n: m.name, lv: m.lv } };
      }
      case 'fire': { const key = a.key || a.role; if (!s.staff || !s.staff[key]) return { err: 'gone' }; delete s.staff[key]; return { ok: 1, msg: 'fired' }; }
      case 'openparcel': {
        const pc = (s.parcels || []).find(x => x.id === a.id && x.st === 'arrived'); if (!pc) return { err: 'gone' };
        let place = null;
        if (pc.what === 'house') { if (!freeSpot(s, 'hab')) return { err: 'noRoom' }; const m = HOUSE_MODELS.find(x => x.id === pc.mid); const it = m && addHouse(s, m); place = it && it.id; ev(s, { k: 'slot', by, n: s.slots }); }
        else if (pc.what === 'decor') { if (!freeSpot(s, pc.did)) return { err: 'noRoom' }; const it = addItem(s, pc.did); place = it && it.id; }
        else if (pc.what === 'food') s.feed[pc.key] = (s.feed[pc.key] || 0) + pc.n;
        else if (pc.what === 'kit') s.kits += pc.n;
        s.parcels = s.parcels.filter(x => x !== pc);
        return { ok: 1, fx: 'coin', msg: 'parcelOpened', place };
      }
      case 'buyfood': {
        const L = FEED_LINES[a.line], T = FEED_TIERS[a.tier]; if (!L || !T) return { err: 'gone' };
        if (T.lv > s.level) return { err: 'gone' };
        const base = feedPrice(a.line, a.tier), cost = base + (a.direct ? 0 : deliveryFee(base));
        if (!need(cost)) return { err: 'notEnough' };
        s.coins -= cost; const key = a.line + ':' + a.tier;
        if (a.direct) { s.feed[key] = (s.feed[key] || 0) + 10; return { ok: 1, fx: 'coin', msg: 'boughtDirect' }; }
        s.parcels.push({ id: s.seq++, what: 'food', key, n: 10, left: DELIVERY.secs }); return { ok: 1, fx: 'coin', msg: 'ordered2', p: { t: DELIVERY.secs } };
      }
      case 'kit': {
        const cost = 150 + (a.direct ? 0 : deliveryFee(150)); if (!need(cost)) return { err: 'notEnough' }; s.coins -= cost;
        if (a.direct) { s.kits += 3; return { ok: 1, fx: 'coin', msg: 'boughtDirect' }; }
        s.parcels.push({ id: s.seq++, what: 'kit', n: 3, left: DELIVERY.secs }); return { ok: 1, fx: 'coin', msg: 'ordered2', p: { t: DELIVERY.secs } };
      }
      case 'buyhouse': {
        const m = HOUSE_MODELS.find(x => x.id === a.id); if (!m || m.ulv > s.level) return { err: 'gone' };
        const pending = s.parcels.filter(x => x.what === 'house').length, nh = s.items.filter(i => i.k === 'hab').length + pending;
        if (nh >= MAX_HOUSES || s.slots + (m.cap || 1) > MAX_SLOTS) return { err: 'maxHouses' };
        const base = houseModelCost(m, nh), cost = base + (a.direct ? 0 : deliveryFee(base));
        if (!need(cost)) return { err: 'notEnough' };
        if (!freeSpot(s, 'hab')) return { err: 'noRoom' };
        s.coins -= cost; addXp(s, 5);
        if (!a.direct) { s.parcels.push({ id: s.seq++, what: 'house', mid: m.id, left: DELIVERY.secs }); return { ok: 1, fx: 'coin', msg: 'ordered2', p: { t: DELIVERY.secs } }; }
        const it = addHouse(s, m); ev(s, { k: 'slot', by, n: s.slots }); return { ok: 1, fx: 'coin', place: it && it.id };
      }
      case 'decor': {
        const d = DECOR.find(x => x.id === a.id);
        if (!d || d.lv > s.level || d.homeOnly) return { err: 'gone' };
        const dcost = d.cost + (a.direct ? 0 : deliveryFee(d.cost));
        if (!need(dcost)) return { err: 'notEnough' };
        if (!freeSpot(s, d.id)) return { err: 'noRoom' };
        s.coins -= dcost; s.decor[d.id] = (+s.decor[d.id] || 0) + 1; addXp(s, s.decor[d.id] > 1 ? 2 : 10);
        if (!a.direct) { s.parcels.push({ id: s.seq++, what: 'decor', did: d.id, left: DELIVERY.secs }); return { ok: 1, fx: 'coin', msg: 'ordered2', p: { t: DELIVERY.secs } }; }
        const nit = addItem(s, d.id);
        ev(s, { k: 'upgrade', by, item: 'd_' + d.id }); return { ok: 1, fx: 'coin', place: nit && nit.id };
      }
      case 'up': {
        const u = UPGRADES.find(x => x.id === a.id);
        if (!u || s.up[u.id] || u.lv > s.level) return { err: 'gone' };
        if (!need(u.cost)) return { err: 'notEnough' };
        s.coins -= u.cost; s.up[u.id] = 1; addXp(s, 15);
        ev(s, { k: 'upgrade', by, item: 'u_' + u.id }); return { ok: 1, fx: 'coin' };
      }
      case 'claim': {
        const q = s.daily && s.daily.quests[a.i];
        if (!q || !q.done || q.claimed) return { err: 'gone' };
        q.claimed = true; s.coins += q.r; addXp(s, 15 + lvE(s) * 3); EXTRA.ensureWeek(s); s.x.week.stars += 2;
        return { ok: 1, fx: 'coin' };
      }
      case 'heart': ev(s, { k: 'heart', by }); return { ok: 1 };
      case 'osell': { const c = (s.online || []).find(x => x.id === a.cid); if (!c || !p) return { err: 'gone' }; if (!matches(c, p)) return { err: 'declined' }; return onlineSell(s, c, p, by); }
      case 'oship': { const c = (s.online || []).find(x => x.id === a.cid); if (!c) return { err: 'gone' }; return onlineShip(s, c, by); }
      case 'odecline': { s.online = (s.online || []).filter(x => x.id !== a.cid); return { ok: 1 }; }
      case 'trash': {
        const it = s.items.find(i => i.id === a.iid); if (!it) return { err: 'gone' };
        if (it.k === 'counter') return { err: 'trashCounter' };
        if (it.k === 'hotel' && (s.guests || []).length) return { err: 'trashBusy' };
        let back = 0;
        if (it.k === 'hab') {
          const sl = slotsOfItem(it), rs = reservedSlots(s);
          if (sl.some(i => s.pets[i] || rs.has(i))) return { err: 'trashHab' };
          const m = HOUSE_MODELS.find(x => x.id === it.model); back = Math.floor((m ? m.cost : 60) * .3);
        } else {
          const d = DECOR.find(x => x.id === it.k); if (d) { back = Math.floor(d.cost * .3); const n = (+s.decor[d.id] || 1) - 1; if (n > 0) s.decor[d.id] = n; else delete s.decor[d.id]; }
          if (isPenKind(it.k) && !s.items.some(o => o !== it && isPenKind(o.k))) s.pets.forEach(p => { if (p) delete p.pen; });
        }
        s.items = s.items.filter(i => i !== it); s.coins += back;
        return { ok: 1, fx: 'coin', msg: 'trashed', p: { c: back } };
      }
      case 'rotate': {
        const it = s.items.find(i => i.id === a.iid); if (!it) return { err: 'gone' };
        if (NOROT[it.k]) return { err: 'noRotate' };
        const f = FPI(it);
        if (f.w !== f.d) {
          let ok = !blocked(s, it.x, it.y, f.d, f.w, it.id, it.k), nx = it.x, ny = it.y;
          for (let r = 1; r <= 2 && !ok; r++) for (const [dx, dy] of [[-r, 0], [0, -r], [r, 0], [0, r], [-r, -r], [r, r]]) if (!blocked(s, it.x + dx, it.y + dy, f.d, f.w, it.id, it.k)) { ok = true; nx = it.x + dx; ny = it.y + dy; break; }
          if (!ok) return { err: 'cantRotate' };
          it.x = nx; it.y = ny;
        }
        it.f = it.f ? 0 : 1; return { ok: 1, fx: 'place' };
      }
      case 'move': {
        const it = s.items.find(i => i.id === a.iid); if (!it) return { err: 'gone' };
        const f = FPI(it);
        const why = blocked(s, a.x, a.y, f.w, f.d, it.id, it.k); if (why) return { err: 'cantPlace_' + why };
        it.x = a.x; it.y = a.y; return { ok: 1, fx: 'place' };
      }
      case 'petmove': {
        if (!p) return { err: 'gone' };
        const from = slotOf(s, p.id);
        let to = a.slot;
        if (a.iid != null) {
          const h = habById(s, a.iid); if (!h) return { err: 'gone' };
          if (slotsOfItem(h).includes(from)) return { ok: 1 };
          if (h.kind !== kindOf(p.sp)) return { err: 'needHouse', p: { h: kindOf(p.sp) } };
          const rs = reservedSlots(s), f = slotsOfItem(h).filter(i => !s.pets[i] && !rs.has(i));
          if (!f.length) return { err: 'houseFull' };
          to = f[0];
        }
        if (to === from) return { ok: 1 };
        if (habKind(s, to) !== kindOf(p.sp)) return { err: 'needHouse', p: { h: kindOf(p.sp) } };
        if (s.pets[to] || reservedSlots(s).has(to)) return { err: 'habBusy' };
        s.pets[to] = p; s.pets[from] = null; return { ok: 1, fx: 'place', msg: 'petMoved', p: { name: p.name } };
      }
      case 'expand': {
        const nx = ROOM_SIZES.find(r => r.w > s.room.w); if (!nx) return { err: 'gone' };
        if (s.level < nx.lv) return { err: 'gone' };
        if (!need(nx.cost)) return { err: 'notEnough' };
        s.coins -= nx.cost; s.room.w = nx.w; s.room.h = nx.w; addXp(s, 30);
        if (typeof TOWN !== 'undefined' && TOWN.fitShop) TOWN.fitShop(s);
        ev(s, { k: 'upgrade', by, item: 'expandShop' }); return { ok: 1, fx: 'coin', msg: 'expanded' };
      }
      case 'style': {
        const st = STYLES.find(x => x.id === a.id && x.type === a.st); if (!st) return { err: 'gone' };
        const sk = st.type + ':' + st.id;
        if (!s.styles[sk] && st.cost) { if (!need(st.cost)) return { err: 'notEnough' }; s.coins -= st.cost; s.styles[sk] = 1; }
        s.room[st.type] = st.id; return { ok: 1, fx: 'coin' };
      }
      case 'openNow': { if (s.clock.ph !== 'prep') return { err: 'gone' }; s.clock.m = Math.max(s.clock.m, CLOCK.open); s.clock.ph = 'open'; s.nextCust = 3; ev(s, { k: 'open', day: s.clock.day }); return { ok: 1 }; }
      case 'closeNow': { if (s.clock.ph !== 'open') return { err: 'gone' }; closeShop(s); return { ok: 1 }; }
      case 'nextday': {
        if (s.clock.ph !== 'closed') return { err: 'gone' };
        s.clock.day++; s.clock.m = CLOCK.prep; s.clock.ph = 'prep'; resetToday(s); ensureOffers(s, true); EXTRA.newDay(s); ev(s, { k: 'attendReady', n: s.clock.day });
        const due = s.outbox.filter(l => l.due <= s.clock.day);
        s.outbox = s.outbox.filter(l => l.due > s.clock.day);
        due.forEach(l => publish(s, l, true));
        if (s.letters.length > 60) s.letters.length = 60;
        if (due.length) ev(s, { k: 'letters', n: due.length });
        s.nextEvt = rnd(40, 100);
        ev(s, { k: 'morning', day: s.clock.day }); return { ok: 1 };
      }
      case 'shopname': { const n = String(a.name || '').replace(/[<>&"]/g, '').trim().slice(0, 20); if (n) s.shop = n; return { ok: 1 }; }
    }
    return { err: 'gone' };
  }

  HOME.init({ ev, addXp, freeSlotsKind, kindOf });
  FARM.init({ addXp });
  CAFE.init({ addXp });
  HOSP.init({ addXp, addRep });
  EXTRA.init({ ev, addXp, addRep, rint, rnd, pick, clamp, dayKey, decorPts, ageOf });
  return { addXpPublic: (s, n) => addXp(s, n), popOf, igCh, igChFit, igTier, IG_TIERS, feedPost, ageOf, matchKind, gainExp, GOODS_: GOODS, newState, migrate, tick, catchUp, apply, price, matches, cond, decorPts, unlocked, dayKey, counterQueue,
    slotsOfItem, habItem, mates, canBreed, breedTime, freeSlots, freeSlotsKind, blocked, freeSpot, habKind, kindOf, isOpen,
    HOUSE_MAX, houseCost, houseDecay, houseGrow, housePrice, spawnVip, mkPetPublic: (s, sp) => mkPet(s, sp, s.lang), confined, SHELF_CAP };
})();
