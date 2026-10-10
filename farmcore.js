// ================= Farm patch: state logic =================
// the farm sits in the park across the street (same walkable area as the player's home),
// so it reads as solid ground via the same street/sidewalk grounding the home always had --
// unlike a patch tucked beside the shop, which kept looking like it was floating.
// 8x8 to start, then bigger squares -- each one has to be BOUGHT (farm panel / the shop's buildings section); nothing grows with the level.
const FARM_SIZES = [{ n: 8, ulv: 1, cost: 0 }, { n: 10, ulv: 1, cost: 8000 }, { n: 12, ulv: 1, cost: 25000 }, { n: 14, ulv: 1, cost: 60000 }, { n: 16, ulv: 1, cost: 120000 }]; // the field never grows by itself: every step is bought
const farmN = () => (typeof S !== 'undefined' && S && S.farm && S.farm.n) || 8;
// x must land on a whole tile -- till/plant/water all store plots at the *integer* grid
// coords a real tap resolves to (world.js's tap() always floors), so a half-tile offset here
// (the layout math wanted W+10.5) meant the drawn soil tiles and the stored plots never
// lined up: tilling "worked" (state changed, the tool-swing fx played) but the tile never
// visibly turned to soil, because drawFarmGround() was iterating a different, offset lattice.
// PET TOWN: the farm is a lot the player places (S.lay.farm = its top-left): seed stall on the north row, the coop below it, then the field
const FARM_LOT = { w: 18, d: 27 }; // stall 3 + gap + coop 2 + gap + field up to 16, plus a path round it
const FARM_POS = (W, H) => { const n = farmN(), L = LAY('farm'); return L ? { x: L.x + 1, y: L.y + 9, w: n, d: n } : { x: LAY_FAR, y: LAY_FAR, w: n, d: n }; };
const STALL_POS = () => { const L = LAY('farm'); return L ? { x: L.x + .5, y: L.y + .5 } : { x: LAY_FAR, y: LAY_FAR }; };
const inFarm = (x, y, W, H) => { const p = FARM_POS(W, H); return x >= p.x && x < p.x + p.w && y >= p.y && y < p.y + p.d; };
// the seed store's stock grows with the player's level ("씨앗상점도 레벨에 따라 씨앗종류가 늘어나도록")
const CROPS = [
  { id: 'wheat', seedCost: 10, sellPrice: 22, growDays: 2, icon: '🌾', ulv: 1 },
  { id: 'carrot', seedCost: 15, sellPrice: 35, growDays: 2, icon: '🥕', ulv: 1 },
  { id: 'potato', seedCost: 14, sellPrice: 30, growDays: 2, icon: '🥔', ulv: 2 },
  { id: 'tomato', seedCost: 25, sellPrice: 55, growDays: 3, icon: '🍅', ulv: 4 },
  { id: 'corn', seedCost: 32, sellPrice: 70, growDays: 3, icon: '🌽', ulv: 6 },
  { id: 'pumpkin', seedCost: 45, sellPrice: 110, growDays: 4, icon: '🎃', ulv: 8 },
  { id: 'lettuce', seedCost: 40, sellPrice: 90, growDays: 3, icon: '🥬', ulv: 10 },
  { id: 'strawberry', seedCost: 60, sellPrice: 150, growDays: 4, icon: '🍓', ulv: 13 },
  { id: 'blueberry', seedCost: 80, sellPrice: 200, growDays: 5, icon: '🫐', ulv: 17 },
  { id: 'grape', seedCost: 110, sellPrice: 280, growDays: 6, icon: '🍇', ulv: 22 },
  // v1.27: fruit trees -- a sapling takes long to grow, then gives fruit again and again (regrow days, several fruits per harvest)
  { id: 'apple', tree: 1, seedCost: 150, sellPrice: 45, growDays: 6, regrow: 2, yield: 3, icon: '🍎', ulv: 5, leaf: '#4f9a44' },
  { id: 'peach', tree: 1, seedCost: 220, sellPrice: 60, growDays: 7, regrow: 2, yield: 3, icon: '🍑', ulv: 9, leaf: '#5aa04a' },
  { id: 'orange', tree: 1, seedCost: 260, sellPrice: 70, growDays: 7, regrow: 2, yield: 3, icon: '🍊', ulv: 12, leaf: '#3f8a3c' },
  { id: 'cherry', tree: 1, seedCost: 320, sellPrice: 55, growDays: 8, regrow: 2, yield: 5, icon: '🍒', ulv: 15, leaf: '#4a9446' },
  { id: 'lemon', tree: 1, seedCost: 300, sellPrice: 65, growDays: 8, regrow: 2, yield: 4, icon: '🍋', ulv: 18, leaf: '#4f9a44' },
  { id: 'pear', tree: 1, seedCost: 380, sellPrice: 90, growDays: 9, regrow: 3, yield: 3, icon: '🍐', ulv: 21, leaf: '#5aa04a' },
  { id: 'mango', tree: 1, seedCost: 520, sellPrice: 130, growDays: 10, regrow: 3, yield: 3, icon: '🥭', ulv: 26, leaf: '#3f8a3c' },
];
// v1.27: harvest one plot -- a fruit tree keeps standing and fruits again after its regrow days
function harvestPlot(f, q) { const c = CROPS.find(x => x.id === q.crop); if (!c) return null; const n = c.yield || 1;
  f.produce[c.id] = (f.produce[c.id] || 0) + n; f.harv = (f.harv | 0) + n;
  if (c.tree) { q.ready = 0; q.growed = Math.max(0, c.growDays - c.regrow); delete q.wday; } else { delete q.crop; delete q.ready; delete q.growed; delete q.wday; }
  return { c, n }; }
// non-crop ingredients the seed store sells outright (they go straight into the café fridge too,
// since the "fridge" is just the farm's produce stock)
const FARM_GOODS = [{ id: 'chickfeed', cost: 12, sellPrice: 0, icon: '\u{1F963}', ulv: 1, feed: 1 }, { id: 'egg', noshop: 1, cost: 18, sellPrice: 18, icon: '🥚', ulv: 1 }];
const FARM_TOOLS = [
  { id: 'hoe', cost: 200, icon: '⛏️' },
  { id: 'watercan', cost: 250, icon: '🚿' },
];

// the chicken coop: buy chicks in the pet shop, move them to the coop, feed them once a day (feed from the seed store); adults lay 0-3 eggs each morning
const COOP_LV = [null, { cap: 4, cost: 6000 }, { cap: 8, cost: 14000 }, { cap: 12, cost: 30000 }, { cap: 16, cost: 60000 }];
COOP_LV.forEach(l => { if (l) l.cost = balCost(l.cost); });
FARM_SIZES.forEach(z => { z.cost = balCost(z.cost); });
const COOP_GROW_DAYS = 3, COOP_EGG_ODDS = [.15, .35, .35, .15]; // chance of 0 / 1 / 2 / 3 eggs per fed adult hen
// just NORTH of the field (one empty tile between them), on the field's own column; the field only ever grows south / east, so the coop never has to move
// v1.10: a storage crate on the farm lot (next to the coop): every harvest goes in here; once the café is built its fridge uses the same stock
const FARM_BOX_POS = () => { const L = LAY('farm'); return L ? { x: L.x + 4, y: L.y + 7, w: 1, d: 1 } : null; };
const COOP_POS = W => { const L = LAY('farm'); return L ? { x: L.x + 1, y: L.y + 6, w: 2, d: 2 } : { x: LAY_FAR, y: LAY_FAR, w: 2, d: 2 }; };
// v9.69: ONE kind of farmhand who does every job ("일꾼 1명이 모든 일을 다 하게") -- with three specialists two of them
// stood idle while the third worked. Hire more hands if the farm feels slow. Old saves' sower/waterer/harvester become 'hand'.
const FARM_STAFF = [
  { id: 'hand', icon: '\u{1F9D1}\u200D\u{1F33E}', hire: 9000, wage: 450 },
];
const FARM_OLD_ROLES = ['sower', 'waterer', 'harvester'];
const FARM_SEED_FEE = 1.15, FARM_SEED_DROP = .25; // farmhands pay the seed price +15%; a harvest has a 25% chance to give a seed back
const FARM_STAFF_MAX = 4, FARM_STAFF_LV_MAX = 10;
const FARM_STAFF_DUR = [0, 26, 22, 18, 15, 12.5, 10.5, 9, 7.8, 6.8, 6]; // slow at first: a farmhand is a big investment, not a free money machine
const farmStaffRole = id => FARM_STAFF.find(r => r.id === id) || (FARM_OLD_ROLES.includes(id) ? FARM_STAFF[0] : undefined);
const farmStaffHire = (r, n) => Math.round(r.hire * (1 + n * .6) / 10) * 10;
const farmStaffWage = (r, lv) => Math.round(r.wage * BAL.FARM_WAGE_K * STAFF_WAGE_K[lv] / 5) * 5;
const farmStaffUp = (r, lv) => Math.round(r.hire * STAFF_UP_K[lv + 1] / 10) * 10;

// every staff member of every business (shop, cafe, hospital, farm) gets a name nobody else has
const allStaffLists = s => [Object.values(s.staff || {}), (s.cafe && s.cafe.staff) || [], (s.hosp && s.hosp.staff) || [], (s.farm && s.farm.staff) || []];
function uniqueStaffName(s) {
  const L = (typeof NAMES !== 'undefined' && (NAMES[s.lang || 'ko'] || NAMES.ko)) || ['?'], used = new Set();
  for (const lst of allStaffLists(s)) for (const m of lst) if (m && m.name) used.add(m.name);
  const free = L.filter(n => !used.has(n));
  if (free.length) return free[Math.floor(Math.random() * free.length)];
  const base = L[Math.floor(Math.random() * L.length)]; let i = 2; while (used.has(base + ' ' + i)) i++; return base + ' ' + i;
}
// old saves: rename staff who share a name with someone else
function dedupeStaffNames(s) {
  const seen = new Set();
  for (const lst of allStaffLists(s)) for (const m of lst) { if (!m) continue; if (!m.name || seen.has(m.name)) m.name = uniqueStaffName(s); seen.add(m.name); }
}
const FARM = (() => {
  let H = null;
  function init(h) { H = h; }
  function ensure(s) {
    if (!s.farm) s.farm = { seq: 1, plots: [], seeds: {}, produce: {}, tools: {} };
    const f = s.farm;
    if (!s.namesDeduped) { s.namesDeduped = 1; try { dedupeStaffNames(s); } catch (e) { /* cosmetic only: never let it stop the game from starting */ } }
    if (f.coop) { if (typeof f.coop !== 'object') f.coop = { lv: 1, hens: [], seq: 1, eggs: 0 }; const cp = f.coop; if (!Array.isArray(cp.hens)) cp.hens = []; if (!cp.seq) cp.seq = 1; if (cp.eggs == null) cp.eggs = 0; if (!cp.lv) cp.lv = 1; }
    if (!Array.isArray(f.plots)) f.plots = []; if (!f.seeds) f.seeds = {}; if (!f.produce) f.produce = {}; if (!f.tools) f.tools = {}; if (!f.seq) f.seq = 1; if (!f.n) f.n = 8; if (!Array.isArray(f.staff)) f.staff = []; if (!f.sseq) f.sseq = 1;
    for (const m of f.staff) if (FARM_OLD_ROLES.includes(m.role)) { m.role = 'hand'; m.pre = 0; } // v9.69 migration: every old specialist becomes an all-round hand (keeps level + name)
    // plots are stored with absolute tile coords but the field sits at x = W + 11: when the shop was enlarged the field moved east
    // and the crops stayed behind (seeds turning up on the pavement). Keep the field's origin and shift the plots along with it.
    if (s.lay && s.lay.farm) { // PET TOWN: the field moves with its lot (the player can move the farm)
      const o = FARM_POS(0, 0);
      if (f.ox == null || f.oy == null) { f.ox = o.x; f.oy = o.y; }
      if (f.ox !== o.x || f.oy !== o.y) { const dx = o.x - f.ox, dy = o.y - f.oy; f.plots.forEach(p => { p.x += dx; p.y += dy; }); f.ox = o.x; f.oy = o.y; }
    }
    return f;
  }
  const plotAt = (f, x, y) => f.plots.find(p => p.x === x && p.y === y);
  // hired farmhands: each hand does whatever is most needed next, in this order:
  //   harvest a ripe crop -> water an unwatered crop -> feed hungry hens -> collect eggs -> plant (buying seeds / tilling as needed)
  // With several hands, a plot one hand is already walking to is left for him (m.px/m.py while m.pre).
  const seedFee = c => Math.round(c.seedCost * FARM_SEED_FEE);
  const coopSpot = s => { const c0 = COOP_POS(s.room.w); return { x: c0.x, y: c0.y + 2 }; };
  function plantChoice(s, f) {
    const ok = CROPS.filter(x => x.ulv <= s.level && (!x.tree || f.autoCrop === x.id)), profit = x => (x.sellPrice - x.seedCost) / x.growDays;
    let c = f.autoCrop ? ok.find(x => x.id === f.autoCrop) : null;
    if (!c) c = ok.filter(x => f.seeds[x.id] > 0).sort((a, b) => profit(b) - profit(a))[0] || ok.filter(x => s.coins >= seedFee(x)).sort((a, b) => profit(b) - profit(a))[0] || ok.slice().sort((a, b) => a.seedCost - b.seedCost)[0];
    return c && (f.seeds[c.id] > 0 || s.coins >= seedFee(c)) ? c : null;
  }
  function freeGround(s, f, taken) {
    const e = f.plots.find(q => !q.crop && !taken(q.x, q.y)); if (e) return e;
    const P = FARM_POS(s.room.w, s.room.h);
    for (let yy = P.y; yy < P.y + P.d; yy++) for (let xx = P.x; xx < P.x + P.w; xx++) if (!plotAt(f, xx, yy) && !taken(xx, yy)) return { x: xx, y: yy, fresh: 1 };
    return null;
  }
  const feedFee = () => Math.round(FARM_GOODS.find(g => g.id === 'chickfeed').cost * FARM_SEED_FEE);
  // v9.73: how many plots one watering / harvesting round covers (the can and the basket get bigger with the hand's level)
  const waterN = lv => 2 + Math.floor((lv || 1) / 2);   // Lv1 2 plots ... Lv10 7 plots
  const harvestN = lv => 2 + Math.floor((lv || 1) / 3); // Lv1 2 ... Lv9+ 5
  const near = (m, list) => { const hx = m.px != null ? m.px : 0, hy = m.py != null ? m.py : 0; let best = null, bd = 1e9; for (const q of list) { const d = Math.abs(q.x - hx) + Math.abs(q.y - hy); if (d < bd) { bd = d; best = q; } } return best; };
  // the next job for hand m: { k, p } or { why } when there is nothing he can do.
  // v9.73: NO fixed order -- every kind of work gets an urgency score and the hand takes the most urgent one
  // ("일의 순서를 만들지 말고 급한 일을 찾아서 먼저"); work another hand is already heading for scores lower, so two hands
  // split the jobs instead of doing the same thing side by side ("서로 다른 일을 하도록").
  function nextJob(s, f, m, day) {
    const others = f.staff.filter(o => o !== m && o.pre);
    const taken = (x, y) => others.some(o => o.px === x && o.py === y);
    const busyKind = k => others.some(o => o.jk === k);
    const cs = f.coop ? coopSpot(s) : null, coopBusy = cs && others.some(o => o.px === cs.x && o.py === cs.y);
    const crops = f.plots.filter(q => q.crop);
    const thirsty = crops.filter(q => !q.ready && q.wday !== day && !taken(q.x, q.y)), ripe = crops.filter(q => q.ready && !taken(q.x, q.y));
    const hungry = f.coop ? f.coop.hens.filter(h => h.fed !== day).length : 0, nh = f.coop ? f.coop.hens.length : 0;
    const cands = []; let why = 'none';
    // water: a crop not watered today loses a whole day of growth -> the most urgent kind of work, more so the more are waiting
    if (thirsty.length) cands.push({ k: 'water', p: near(m, thirsty), u: .6 + .4 * Math.min(1, thirsty.length / 8) });
    // harvest: ripe crops don't spoil, but they hold the plot -> urgent once several are waiting
    if (ripe.length) cands.push({ k: 'harvest', p: near(m, ripe), u: .45 + .4 * Math.min(1, ripe.length / 6) });
    // hens: must be fed some time today; hungry hens lay nothing tomorrow
    if (hungry && !coopBusy) { if ((f.produce.chickfeed || 0) > 0 || s.coins >= feedFee()) cands.push({ k: 'feed', p: cs, u: .55 + .35 * hungry / Math.max(1, nh) }); else why = 'coin'; }
    if (f.coop && f.coop.eggs > 0 && !coopBusy) cands.push({ k: 'eggs', p: cs, u: .3 + Math.min(.3, f.coop.eggs * .05) });
    // plant: an empty TILLED plot first; new ground is only broken when the crew has caught up (nothing left to water or pick),
    // so the field never grows beyond what the hands can keep watered
    const empty = f.plots.filter(q => !q.crop && !taken(q.x, q.y));
    if (plantChoice(s, f)) {
      if (empty.length) cands.push({ k: 'plant', p: near(m, empty), u: .35 });
      else if (!thirsty.length && !ripe.length) { const g = freeGround(s, f, taken); if (g) cands.push({ k: 'plant', p: g, u: .2 }); }
    } else if (empty.length || freeGround(s, f, taken)) { if (why === 'none') why = 'coin'; }
    if (!cands.length) return { why };
    for (const c of cands) if (busyKind(c.k)) c.u -= c.k === 'water' && thirsty.length > 3 * waterN(m.lv) ? .15 : .45; // only when watering is badly behind do both hands water (different plots) // share out the work
    cands.sort((a, b) => b.u - a.u);
    return cands[0];
  }
  const target = (s, f, m, day) => nextJob(s, f, m, day).p || null;
  function idleWhy(s, f, m, day) { const j = nextJob(s, f, m, day); return j.k ? null : j.why; }
  // every new morning the fed adult hens lay their eggs (random 0-3 each)
  function layEggs(s, f, day) {
    const cp = f.coop; if (!cp) return;
    if (cp.lastDay == null) cp.lastDay = day;
    if (day === cp.lastDay) return;
    for (const h of cp.hens) {
      if (h.fed !== cp.lastDay || (cp.lastDay - h.born) < COOP_GROW_DAYS) continue;
      let r = Math.random(), n = 0; for (; n < COOP_EGG_ODDS.length - 1; n++) { r -= COOP_EGG_ODDS[n]; if (r <= 0) break; }
      cp.eggs += n; cp.laid = (cp.laid | 0) + n;
    }
    cp.eggs = Math.min(cp.eggs, COOP_LV[cp.lv].cap * 3); cp.lastDay = day;
  }
  function doJob(s, f, j, day) {
    const p = j.p;
    // a round covers the chosen plot plus the nearest others of the same kind (not ones another hand is heading for)
    const round = (first, ok, n) => { const busy = new Set(f.staff.filter(o => o !== j.m && o.pre).map(o => o.px + ',' + o.py)), out = [first];
      const rest = f.plots.filter(q => q !== first && ok(q) && !busy.has(q.x + ',' + q.y)).sort((a, b) => (Math.abs(a.x - first.x) + Math.abs(a.y - first.y)) - (Math.abs(b.x - first.x) + Math.abs(b.y - first.y)));
      return out.concat(rest.slice(0, n - 1)); };
    if (j.k === 'harvest') {
      for (const q of round(p, q => q.ready, harvestN(j.lv))) { const hv = harvestPlot(f, q); if (!hv) continue; if (!hv.c.tree && Math.random() < FARM_SEED_DROP) f.seeds[hv.c.id] = (f.seeds[hv.c.id] || 0) + 1; H.addXp(s, 3); }
      return p;
    }
    if (j.k === 'water') {
      for (const q of round(p, q => q.crop && !q.ready && q.wday !== day, waterN(j.lv))) { q.wday = day; q.growed = (q.growed || 0) + 1; const c = CROPS.find(x => x.id === q.crop); if (c && q.growed >= c.growDays) q.ready = 1; }
      return p;
    }
    if (j.k === 'plant') {
      const c = plantChoice(s, f); if (!c) return null;
      if (!(f.seeds[c.id] > 0)) { const fee = seedFee(c); if (s.coins < fee) return null; s.coins -= fee; f.seeds[c.id] = 1; } // bought at the seed store price + 15%
      let q = p; if (p.fresh) { q = { id: f.seq++, x: p.x, y: p.y }; f.plots.push(q); } // the hand brings his own hoe
      f.seeds[c.id]--; q.crop = c.id; q.growed = 0; delete q.wday; delete q.ready;
      // v9.73: sowing is a round too -- the nearest other empty TILLED plots get seeds as well (new ground is never broken in a round)
      if (!p.fresh) for (const r of round(q, x => !x.crop, waterN(j.lv)).slice(1)) {
        const c2 = plantChoice(s, f); if (!c2) break;
        if (!(f.seeds[c2.id] > 0)) { const fee = seedFee(c2); if (s.coins < fee) break; s.coins -= fee; f.seeds[c2.id] = 1; }
        f.seeds[c2.id]--; r.crop = c2.id; r.growed = 0; delete r.wday; delete r.ready;
      }
      return q;
    }
    if (j.k === 'feed') {
      const fee = feedFee(); let n = 0;
      for (const h of f.coop.hens) { if (h.fed === day) continue; if (!((f.produce.chickfeed || 0) > 0)) { if (s.coins >= fee) { s.coins -= fee; f.produce.chickfeed = 1; } else break; } f.produce.chickfeed--; h.fed = day; n++; }
      return n ? p : null;
    }
    if (j.k === 'eggs') { f.produce.egg = (f.produce.egg || 0) + f.coop.eggs; f.coop.eggs = 0; return p; }
    return null;
  }
  function tick(s, dt) {
    const f = ensure(s); const day = s.clock ? s.clock.day : 0;
    layEggs(s, f, day);
    if (!f.staff || !f.staff.length) return;
    for (const m of f.staff) {
      if (m.tt > 0) m.tt -= dt;
      if (!G.isOpen(s) && !(m.tt > 0)) { m.why = 'off'; m.pre = 0; continue; } // v9.95: farmhands go home after closing
      m.t = (m.t == null ? 3 : m.t) - dt;
      // a few seconds before the next job the hand already walks over to the plot he is going to work on
      if (m.t > 0 && m.t <= 6 && !m.pre) { const j0 = nextJob(s, f, m, day); if (j0.p) { m.pre = 1; m.px = j0.p.x; m.py = j0.p.y; m.jk = j0.k; m.act = j0.p.fresh ? 'till' : j0.k; m.tt = m.t + 1.2; } }
      m.why = m.tt > 0 ? null : idleWhy(s, f, m, day); // recomputed every tick, so it never shows a stale reason
      if (m.t > 0) continue;
      m.pre = 0; m.jk = null;
      m.t = FARM_STAFF_DUR[m.lv] || 10;
      const j = nextJob(s, f, m, day); j.lv = m.lv; j.m = m;
      const wasFresh = j.p && j.p.fresh;
      const p = j.k ? doJob(s, f, j, day) : null;
      if (p) { m.why = null; m.done = (m.done | 0) + 1; m.tt = 2.6; m.px = p.x; m.py = p.y; m.act = wasFresh ? 'till' : j.k; }
      else m.why = j.why || 'coin';
    }
  }
  const wagesOf = f => ((f && f.staff) || []).reduce((a, m) => a + farmStaffWage(farmStaffRole(m.role) || FARM_STAFF[0], m.lv), 0);
  function apply(s, a, by) {
    if (!a.t || !['ftill', 'fplant', 'fwater', 'fharvest', 'fbuyseed', 'fsell', 'fbuytool', 'fbuygood', 'farmup', 'farmhire', 'farmstaffup', 'farmfire', 'farmauto', 'fcoopbuild', 'fcoopup', 'fcoopfeed', 'fcoopegg', 'ftocoop', 'fcoopbuy'].includes(a.t)) return undefined;
    const f = ensure(s);
    switch (a.t) {
      case 'fcoopbuild': { if (f.coop) return { err: 'gone' }; const c1 = COOP_LV[1]; if (s.coins < c1.cost) return { err: 'notEnough' }; s.coins -= c1.cost; f.coop = { lv: 1, hens: [], eggs: 0, seq: 1, lastDay: s.clock ? s.clock.day : 0 }; return { ok: 1, fx: 'coin', msg: 'coopBuilt' }; }
      case 'fcoopup': { const cp = f.coop; if (!cp) return { err: 'gone' }; const nx = COOP_LV[cp.lv + 1]; if (!nx) return { err: 'gone' }; if (s.coins < nx.cost) return { err: 'notEnough' }; s.coins -= nx.cost; cp.lv++; return { ok: 1, fx: 'coin', msg: 'coopUp' }; }
      case 'fcoopfeed': { const cp = f.coop; if (!cp) return { err: 'gone' }; const day = s.clock ? s.clock.day : 0; let n = 0; for (const h of cp.hens) { if (h.fed === day) continue; if (!((f.produce.chickfeed || 0) > 0)) break; f.produce.chickfeed--; h.fed = day; n++; } return n ? { ok: 1, fx: 'place', msg: 'coopFed', p: { n } } : { err: cp.hens.every(h => h.fed === day) ? 'coopAllFed' : 'coopNoFeed' }; }
      case 'fcoopegg': { const cp = f.coop; if (!cp || !(cp.eggs > 0)) return { err: 'coopNoEgg' }; const n = cp.eggs; f.produce.egg = (f.produce.egg || 0) + n; cp.eggs = 0; H.addXp(s, 2); return { ok: 1, fx: 'coin', msg: 'coopEggs', p: { n } }; }
      case 'fcoopbuy': { const cp = f.coop; if (!cp) return { err: 'coopNone' }; if (cp.hens.length >= COOP_LV[cp.lv].cap) return { err: 'coopFull' }; const cost = SPECIES.chick.cost; if (s.coins < cost) return { err: 'notEnough' }; s.coins -= cost; const L = (typeof NAMES !== 'undefined' && (NAMES[s.lang || 'ko'] || NAMES.ko)) || ['?']; cp.hens.push({ id: cp.seq++, name: L[Math.floor(Math.random() * L.length)], seed: 1 + Math.floor(Math.random() * 9999), born: s.clock ? s.clock.day : 0, fed: -1 }); return { ok: 1, fx: 'coin', msg: 'coopMoved', p: { name: cp.hens[cp.hens.length - 1].name } }; }
      case 'ftocoop': { const cp = f.coop; if (!cp) return { err: 'coopNone' }; if (cp.hens.length >= COOP_LV[cp.lv].cap) return { err: 'coopFull' }; const i = s.pets.findIndex(x => x && x.id === a.pid); if (i < 0) return { err: 'gone' }; const pt = s.pets[i]; if (pt.sp !== 'chick') return { err: 'coopOnlyChick' }; s.pets[i] = null; cp.hens.push({ id: cp.seq++, name: pt.name, seed: pt.coat || pt.id, born: s.clock ? s.clock.day : 0, fed: -1 }); return { ok: 1, fx: 'place', msg: 'coopMoved', p: { name: pt.name } }; }
      case 'farmauto': { f.autoCrop = CROPS.some(x => x.id === a.crop) ? a.crop : null; return { ok: 1 }; }
      case 'farmhire': {
        const r = farmStaffRole(a.role); if (!r) return { err: 'gone' };
        const n = f.staff.filter(m => m.role === r.id).length; if (n >= FARM_STAFF_MAX) return { err: 'gone' };
        const cost = farmStaffHire(r, n); if (s.coins < cost) return { err: 'notEnough' };
        s.coins -= cost; f.staff.push({ id: f.sseq++, role: r.id, lv: 1, seed: 1 + Math.floor(Math.random() * 99999), name: uniqueStaffName(s), t: 3, done: 0 });
        return { ok: 1, fx: 'coin', msg: 'hospHired' };
      }
      case 'farmstaffup': {
        const m = f.staff.find(x => x.id === a.sid); if (!m || m.lv >= FARM_STAFF_LV_MAX) return { err: 'gone' };
        const cost = farmStaffUp(farmStaffRole(m.role), m.lv); if (s.coins < cost) return { err: 'notEnough' };
        s.coins -= cost; m.lv++; return { ok: 1, fx: 'coin', msg: 'hospStaffUp', p: { n: m.lv } };
      }
      case 'farmfire': { const i = f.staff.findIndex(x => x.id === a.sid); if (i < 0) return { err: 'gone' }; f.staff.splice(i, 1); return { ok: 1, msg: 'fired' }; }
      case 'farmup': {
        const nx = FARM_SIZES.find(z => z.n > f.n); if (!nx) return { err: 'gone' };
        if (s.level < nx.ulv) return { err: 'homeNeedPlayer', p: { n: nx.ulv } };
        if (s.coins < nx.cost) return { err: 'notEnough' };
        s.coins -= nx.cost; f.n = nx.n; H.addXp(s, 30);
        return { ok: 1, fx: 'coin', msg: 'farmUpOk', p: { n: nx.n } };
      }
      case 'ftill': {
        if (!f.tools.hoe) return { err: 'needHoe' };
        if (!inFarm(a.x, a.y, s.room.w, s.room.h)) return { err: 'gone' };
        if (plotAt(f, a.x, a.y)) return { err: 'gone' };
        f.plots.push({ id: f.seq++, x: a.x, y: a.y });
        return { ok: 1, fx: 'place' };
      }
      case 'fplant': {
        const p = plotAt(f, a.x, a.y); if (!p || p.crop) return { err: 'gone' };
        const c = CROPS.find(x => x.id === a.crop); if (!c) return { err: 'gone' };
        if (!(f.seeds[c.id] > 0)) return { err: 'noSeed' };
        f.seeds[c.id]--; p.crop = c.id; p.growed = 0; delete p.wday; delete p.ready;
        return { ok: 1, fx: 'place' };
      }
      case 'fwater': {
        if (!f.tools.watercan) return { err: 'needWaterCan' };
        const p = plotAt(f, a.x, a.y); if (!p || !p.crop || p.ready) return { err: 'gone' };
        const day = s.clock ? s.clock.day : 0; if (p.wday === day) return { err: 'gone' };
        p.wday = day; p.growed = (p.growed || 0) + 1;
        const c = CROPS.find(x => x.id === p.crop);
        if (p.growed >= c.growDays) p.ready = 1;
        return { ok: 1, fx: 'coin' };
      }
      case 'fharvest': {
        const p = plotAt(f, a.x, a.y); if (!p || !p.ready) return { err: 'gone' };
        const hv = harvestPlot(f, p); if (!hv) return { err: 'gone' }; const c = hv.c; H.addXp(s, 5); const bonus = !c.tree && Math.random() < FARM_SEED_DROP; if (bonus) f.seeds[c.id] = (f.seeds[c.id] || 0) + 1;
        return { ok: 1, fx: 'coin', msg: 'harvested', crop: c.id, p: { d: c.icon + (hv.n > 1 ? '×' + hv.n : '') + (bonus ? ' +🌱' : '') } };
      }
      case 'fbuyseed': {
        const c = CROPS.find(x => x.id === a.id); if (!c) return { err: 'gone' };
        if (c.ulv > s.level) return { err: 'homeNeedPlayer', p: { n: c.ulv } };
        const n = Math.max(1, a.n | 0);
        if (s.coins < c.seedCost * n) return { err: 'notEnough' };
        s.coins -= c.seedCost * n; f.seeds[c.id] = (f.seeds[c.id] || 0) + n;
        return { ok: 1, fx: 'coin' };
      }
      case 'fbuygood': {
        const g = FARM_GOODS.find(x => x.id === a.id); if (!g || g.noshop) return { err: 'gone' };
        if (g.ulv > s.level) return { err: 'homeNeedPlayer', p: { n: g.ulv } };
        const n = Math.max(1, a.n | 0);
        if (s.coins < g.cost * n) return { err: 'notEnough' };
        s.coins -= g.cost * n; f.produce[g.id] = (f.produce[g.id] || 0) + n;
        return { ok: 1, fx: 'coin' };
      }
      case 'fsell': {
        const c = CROPS.find(x => x.id === a.id); if (!c) return { err: 'gone' };
        const n = Math.min(Math.max(1, a.n | 0), f.produce[c.id] || 0); if (!n) return { err: 'gone' };
        f.produce[c.id] -= n; s.coins += c.sellPrice * n;
        return { ok: 1, fx: 'coin' };
      }
      case 'fbuytool': {
        const tl = FARM_TOOLS.find(x => x.id === a.id); if (!tl) return { err: 'gone' };
        if (f.tools[tl.id]) return { ok: 1 };
        if (s.coins < tl.cost) return { err: 'notEnough' };
        s.coins -= tl.cost; f.tools[tl.id] = 1;
        return { ok: 1, fx: 'coin', msg: 'toolBought' };
      }
    }
    return undefined;
  }
  return { init, ensure, apply, tick, wagesOf };
})();
