// ================= My home (across the street): state logic + its own room view =================
const HOME_LV = [null,
  { w: 6, cost: 0, ulv: 1, pets: 10, floors: 1 },
  { w: 7, cost: 15000, ulv: 4, pets: 10, floors: 1 },
  { w: 8, cost: 35000, ulv: 8, pets: 10, floors: 2 },
  { w: 10, cost: 70000, ulv: 13, pets: 10, floors: 2 },
  { w: 12, cost: 130000, ulv: 18, pets: 10, floors: 2 },
  { w: 14, cost: 220000, ulv: 22, pets: 10, floors: 3 },
  { w: 16, cost: 330000, ulv: 25, pets: 10, floors: 3 },
  { w: 18, cost: 470000, ulv: 27, pets: 10, floors: 3 },
  { w: 20, cost: 650000, ulv: 29, pets: 10, floors: 3 },
  { w: 22, cost: 900000, ulv: 30, pets: 10, floors: 3 }];
HOME_LV.forEach(l => { if (l) l.cost = balCost(l.cost); });
const HOME_MAX = HOME_LV.length - 1;
const FLOOR_NAMES = ['1F', '2F', '3F'];
const HOME_FURN = [
  { k: 'h_bed', cost: 800, pts: 2, hl: 1, cat: 'bed' }, { k: 'h_petbed', cost: 300, pts: 1, hl: 1, cat: 'pet' },
  { k: 'plant', cost: 250, pts: 1, hl: 1, cat: 'deco' }, { k: 'lamp', cost: 300, pts: 1, hl: 1, cat: 'deco' },
  { k: 'rug', cost: 400, pts: 2, hl: 1, cat: 'deco' }, { k: 'h_heart', cost: 700, pts: 2, hl: 1, cat: 'deco' },
  { k: 'armchair', cost: 600, pts: 2, hl: 1, cat: 'living' }, { k: 'table', cost: 500, pts: 1, hl: 1, cat: 'living' },
  { k: 'radio', cost: 400, pts: 1, hl: 1, cat: 'living' }, { k: 'coatrack', cost: 300, pts: 1, hl: 1, cat: 'deco' },
  { k: 'h_bookpile', cost: 350, pts: 1, hl: 1, cat: 'deco' }, { k: 'h_frame', cost: 450, pts: 2, hl: 1, cat: 'deco' },
  { k: 'bench', cost: 900, pts: 3, hl: 2, cat: 'living' }, { k: 'h_wardrobe', cost: 1200, pts: 3, hl: 2, cat: 'bed' },
  { k: 'h_stove', cost: 900, pts: 2, hl: 1, cat: 'kitchen' }, { k: 'fridge', cost: 1200, pts: 2, hl: 2, cat: 'kitchen' },
  { k: 'tv', cost: 1500, pts: 3, hl: 2, cat: 'living' }, { k: 'bookcase', cost: 800, pts: 2, hl: 2, cat: 'living' },
  { k: 'desk', cost: 1000, pts: 2, hl: 2, cat: 'living' },
  { k: 'h_vanity', cost: 1400, pts: 3, hl: 3, cat: 'bed' }, { k: 'h_dining', cost: 1800, pts: 3, hl: 3, cat: 'kitchen' },
  { k: 'h_dbed', cost: 3000, pts: 5, hl: 3, cat: 'bed' }, { k: 'washer', cost: 1500, pts: 2, hl: 3, cat: 'kitchen' },
  { k: 'bathtub', cost: 2000, pts: 3, hl: 3, cat: 'kitchen' }, { k: 'cafe', cost: 1800, pts: 3, hl: 3, cat: 'kitchen' },
  { k: 'h_fire', cost: 3500, pts: 5, hl: 4, cat: 'living' }, { k: 'h_piano', cost: 4000, pts: 6, hl: 4, cat: 'living' },
  { k: 'aquarium', cost: 2500, pts: 4, hl: 4, cat: 'deco' },
  { k: 'h_canopy', cost: 6000, pts: 8, hl: 5, cat: 'bed' },
  { k: 'x_balloon', cost: 300, pts: 2, hl: 1, cat: 'deco' }, { k: 'x_monstera', cost: 450, pts: 2, hl: 1, cat: 'deco' }, { k: 'x_beanbag', cost: 500, pts: 2, hl: 1, cat: 'living' },
  { k: 'x_rocking', cost: 650, pts: 3, hl: 2, cat: 'living' }, { k: 'x_dresser', cost: 900, pts: 3, hl: 2, cat: 'bed' }, { k: 'x_photozone', cost: 900, pts: 4, hl: 2, cat: 'deco' }, { k: 'x_island', cost: 2200, pts: 4, hl: 3, cat: 'kitchen' },
  { k: 'x_toilet', cost: 400, pts: 1, hl: 1, cat: 'kitchen' }, { k: 'x_petbowl', cost: 200, pts: 1, hl: 1, cat: 'pet' }, { k: 'x_shower', cost: 900, pts: 2, hl: 2, cat: 'kitchen' },
  { k: 'l_candles', cost: 180, pts: 1, hl: 1, cat: 'light' }, { k: 'l_lantern', cost: 220, pts: 1, hl: 1, cat: 'light' }, { k: 'l_tablelamp', cost: 320, pts: 2, hl: 1, cat: 'light' },
  { k: 'l_string', cost: 450, pts: 2, hl: 1, cat: 'light' }, { k: 'l_arc', cost: 550, pts: 2, hl: 2, cat: 'light' }, { k: 'l_moon', cost: 800, pts: 3, hl: 2, cat: 'light' },
  { k: 'l_street', cost: 650, pts: 3, hl: 3, cat: 'light' }, { k: 'l_neon', cost: 1000, pts: 4, hl: 3, cat: 'light' }, { k: 'l_tree', cost: 1200, pts: 4, hl: 4, cat: 'light' },
  // v9.88: many more pieces for the bigger (2F/3F) homes
  { k: 'y_nightstand', cost: 350, pts: 1, hl: 1, cat: 'bed' }, { k: 'y_mirror', cost: 500, pts: 2, hl: 1, cat: 'bed' }, { k: 'y_desk2', cost: 1100, pts: 3, hl: 2, cat: 'bed' },
  { k: 'y_crib', cost: 1300, pts: 3, hl: 2, cat: 'bed' }, { k: 'y_closet', cost: 2400, pts: 4, hl: 3, cat: 'bed' }, { k: 'y_bunk', cost: 2600, pts: 4, hl: 3, cat: 'bed' },
  { k: 'y_coffee', cost: 400, pts: 1, hl: 1, cat: 'living' }, { k: 'y_fan', cost: 350, pts: 1, hl: 1, cat: 'living' }, { k: 'y_record', cost: 700, pts: 2, hl: 2, cat: 'living' },
  { k: 'y_shelf', cost: 900, pts: 3, hl: 2, cat: 'living' }, { k: 'y_aircon', cost: 1600, pts: 3, hl: 3, cat: 'living' }, { k: 'y_hammock', cost: 1400, pts: 3, hl: 3, cat: 'living' },
  { k: 'y_game', cost: 2200, pts: 4, hl: 3, cat: 'living' }, { k: 'y_lsofa', cost: 3200, pts: 5, hl: 4, cat: 'living' }, { k: 'y_massage', cost: 3800, pts: 5, hl: 4, cat: 'living' },
  { k: 'y_sink', cost: 600, pts: 2, hl: 1, cat: 'kitchen' }, { k: 'y_micro', cost: 700, pts: 2, hl: 2, cat: 'kitchen' }, { k: 'y_espresso', cost: 900, pts: 2, hl: 2, cat: 'kitchen' },
  { k: 'y_vanity2', cost: 1000, pts: 2, hl: 2, cat: 'kitchen' }, { k: 'y_kitchen', cost: 2400, pts: 4, hl: 3, cat: 'kitchen' }, { k: 'y_bar', cost: 2600, pts: 4, hl: 4, cat: 'kitchen' },
  { k: 'y_cactus', cost: 250, pts: 1, hl: 1, cat: 'deco' }, { k: 'y_tulip', cost: 300, pts: 1, hl: 1, cat: 'deco' }, { k: 'y_roundrug', cost: 500, pts: 2, hl: 1, cat: 'deco' },
  { k: 'y_sunflower', cost: 450, pts: 2, hl: 1, cat: 'deco' }, { k: 'y_teddy', cost: 700, pts: 2, hl: 2, cat: 'deco' }, { k: 'y_piggy', cost: 600, pts: 2, hl: 2, cat: 'deco' },
  { k: 'y_cloudrug', cost: 800, pts: 3, hl: 2, cat: 'deco' }, { k: 'y_globe', cost: 800, pts: 2, hl: 2, cat: 'deco' }, { k: 'y_easel', cost: 900, pts: 3, hl: 3, cat: 'deco' },
  { k: 'y_bonsai', cost: 1200, pts: 3, hl: 3, cat: 'deco' }, { k: 'y_clock', cost: 1800, pts: 4, hl: 4, cat: 'deco' }, { k: 'x_gacha', cost: 1500, pts: 4, hl: 3, cat: 'deco' }, { k: 'x_vending', cost: 2000, pts: 4, hl: 4, cat: 'kitchen' },
  { k: 'y_lava', cost: 400, pts: 2, hl: 1, cat: 'light' }, { k: 'y_starlamp', cost: 600, pts: 2, hl: 2, cat: 'light' }, { k: 'y_crystal', cost: 1500, pts: 4, hl: 4, cat: 'light' },
  { k: 'y_toybox', cost: 400, pts: 1, hl: 1, cat: 'pet' }, { k: 'y_petstairs', cost: 450, pts: 1, hl: 1, cat: 'pet' }, { k: 'y_dogtent', cost: 700, pts: 2, hl: 2, cat: 'pet' }, { k: 'y_cattower', cost: 1200, pts: 3, hl: 2, cat: 'pet' },
];
const HOME_BED_Q = { h_bed: 1, y_bunk: 2, h_dbed: 2, h_canopy: 3 }; // nap bonus per bed
const HOME_BEDS = Object.keys(HOME_BED_Q);

const HOME = (() => {
  let H = null;
  function init(h) { H = h; }
  const N = h => HOME_LV[h.lv].w;
  const DEFK = k => FURN.DEF[k] || { w: 1, d: 1 };
  const fp = it => { const d = DEFK(it.k); return it.f ? { w: d.d, d: d.w, flat: d.flat } : { w: d.w, d: d.d, flat: d.flat }; };
  function add(h, k, x, y, f, fl) { const it = { id: h.seq++, k, x, y }; if (f) it.f = 1; if (fl) it.fl = fl; h.items.push(it); return it; }
  function ensure(s) {
    if (!s.home) s.home = { lv: 1, floor: 'oak', wall: 'pink', items: [], seq: 1, pets: [], nap: 0 };
    const h = s.home;
    if (!h.items) h.items = []; if (!h.pets) h.pets = []; if (!h.seq) h.seq = 1; if (!h.lv) h.lv = 1;
    if (!h.started) { h.started = 1; if (!h.items.length) { add(h, 'h_bed', 1, 0); add(h, 'plant', 0, 0); add(h, 'rug', 2, 2); add(h, 'h_petbed', 0, 3); add(h, 'h_frame', 4, 0); } }
    if (!h.lifeGift && h.items) { h.lifeGift = 1; for (const k of ['x_toilet', 'x_petbowl', 'table']) { const sp = freeSpot(h, k); if (sp) add(h, k, sp.x, sp.y, sp.f); } }
    return h;
  }
  const floorsOf = h => HOME_LV[h.lv].floors || 1;
  // can item footprint (w,d,flat) sit at x,y ?
  function fits(h, w, d, flat, x, y, ignore, fl) {
    const n = N(h);
    if (x < 0 || y < 0 || x + w > n || y + d > n) return 'out';
    if (!flat && n - 1 >= x && n - 1 < x + w && n - 2 >= y && n - 2 < y + d) return 'door';
    for (const o of h.items) {
      if (o.id === ignore) continue; if ((o.fl || 0) !== (fl || 0)) continue; const q = fp(o);
      if (!!q.flat !== !!flat) continue;
      if (x < o.x + q.w && o.x < x + w && y < o.y + q.d && o.y < y + d) return 'overlap';
    }
    return null;
  }
  function freeSpot(h, k, fl) {
    const d = DEFK(k), n = N(h);
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { if (!fits(h, d.w, d.d, d.flat, x, y, null, fl)) return { x, y, f: 0 }; if (!fits(h, d.d, d.w, d.flat, x, y, null, fl)) return { x, y, f: 1 }; }
    return null;
  }
  const pts = s => { if (!s.home) return 0; const h = s.home; let p = 0; for (const it of h.items) { const F = HOME_FURN.find(z => z.k === it.k); if (F) p += F.pts; } return Math.min(25, Math.floor(p / 4) + (h.lv - 1) * 2); };
  const cap = h => HOME_LV[h.lv].pets;
  function apply(s, a, by) {
    if (!a.t || a.t[0] !== 'h' || !['hbuy', 'hmove', 'hflip', 'hsell', 'hup', 'hstyle', 'hnap', 'htake', 'hback', 'hpat'].includes(a.t)) return undefined;
    const h = ensure(s);
    switch (a.t) {
      case 'hbuy': {
        const F = HOME_FURN.find(z => z.k === a.k); if (!F) return { err: 'gone' };
        if (F.hl > h.lv) return { err: 'homeNeedLv', p: { n: F.hl } };
        if (s.coins < F.cost) return { err: 'notEnough' };
        const fl = Math.min(a.fl | 0, floorsOf(h) - 1);
        const sp = freeSpot(h, F.k, fl); if (!sp) return { err: 'homeFull' };
        s.coins -= F.cost; const it = add(h, F.k, sp.x, sp.y, sp.f, fl); H.addXp(s, 3);
        return { ok: 1, fx: 'coin', hplace: it.id, msg: 'homeBought' };
      }
      case 'hmove': {
        const it = h.items.find(z => z.id === a.id); if (!it) return { err: 'gone' };
        const q = fp(it), why = fits(h, q.w, q.d, q.flat, a.x | 0, a.y | 0, it.id, it.fl); if (why) return { err: 'cantPlace_' + (why === 'door' ? 'door' : why === 'out' ? 'out' : 'overlap') };
        it.x = a.x | 0; it.y = a.y | 0; return { ok: 1, fx: 'place' };
      }
      case 'hflip': {
        const it = h.items.find(z => z.id === a.id); if (!it) return { err: 'gone' };
        const q = fp(it); if (q.w === q.d) { it.f = it.f ? 0 : 1; return { ok: 1 }; }
        if (fits(h, q.d, q.w, q.flat, it.x, it.y, it.id, it.fl)) { // try to nudge so the rotated piece fits
          const n = N(h); let done = false;
          for (let r = 1; r <= 2 && !done; r++) for (const [dx, dy] of [[-r, 0], [0, -r], [r, 0], [0, r]]) { if (!fits(h, q.d, q.w, q.flat, it.x + dx, it.y + dy, it.id, it.fl)) { it.x += dx; it.y += dy; done = true; break; } }
          if (!done) return { err: 'cantPlace_overlap' };
        }
        it.f = it.f ? 0 : 1; return { ok: 1, fx: 'place' };
      }
      case 'hsell': {
        const i = h.items.findIndex(z => z.id === a.id); if (i < 0) return { err: 'gone' };
        const F = HOME_FURN.find(z => z.k === h.items[i].k), back = F ? Math.floor(F.cost / 2) : 0;
        h.items.splice(i, 1); s.coins += back; return { ok: 1, fx: 'coin', msg: 'homeSold', p: { c: back } };
      }
      case 'hup': {
        if (h.lv >= HOME_MAX) return { err: 'gone' };
        const L = HOME_LV[h.lv + 1];
        if (s.level < L.ulv) return { err: 'homeNeedPlayer', p: { n: L.ulv } };
        if (s.coins < L.cost) return { err: 'notEnough' };
        s.coins -= L.cost; h.lv++; H.addXp(s, 40); H.ev(s, { k: 'upgrade', by, item: 'homeUp2' });
        if (typeof TOWN !== 'undefined' && TOWN.clearBuildingOverlaps) TOWN.clearBuildingOverlaps(s);
        return { ok: 1, fx: 'coin', msg: 'homeUpOk', p: { n: h.lv }, homeUp: h.lv };
      }
      case 'hstyle': {
        const st = STYLES.find(x => x.id === a.id && x.type === a.st); if (!st) return { err: 'gone' };
        const sk = st.type + ':' + st.id, free = !st.cost || s.styles[sk] || (st.type === 'floor' && st.id === 'oak') || (st.type === 'wall' && st.id === 'pink');
        if (!free) { if (s.coins < st.cost) return { err: 'notEnough' }; s.coins -= st.cost; s.styles[sk] = 1; }
        h[st.type] = st.id; return { ok: 1, fx: 'coin' };
      }
      case 'hnap': {
        if (!h.items.some(it => HOME_BEDS.includes(it.k))) return { err: 'homeNoBed' };
        const day = s.clock ? s.clock.day : 0; if (h.nap === day) return { err: 'napDone' };
        h.nap = day;
        const bed = Math.max(...h.items.filter(it => HOME_BEDS.includes(it.k)).map(it => HOME_BED_Q[it.k] || 1));
        const c = 100 + h.lv * 80 + lvE(s) * 10 + bed * 40;
        s.coins += c; H.addXp(s, 15 + h.lv * 5);
        s.pets.forEach(p => { if (p) { p.happy = Math.min(100, (p.happy || 0) + 10); p.stress = Math.max(0, (p.stress || 0) - 10); } });
        h.pets.forEach(p => { p.happy = 100; });
        return { ok: 1, fx: 'coin', msg: 'napOk', p: { c }, nap: 1 };
      }
      case 'htake': {
        if (!LAY('home')) return { err: 'tNeedHome' }; // PET TOWN: build your home first
        const i = s.pets.findIndex(p => p && p.id === a.pid); if (i < 0) return { err: 'gone' };
        const p = s.pets[i];
        if (h.pets.length >= cap(h)) return { err: 'homePetsFull', p: { n: cap(h) } };
        if (p.escaped) return { err: 'gone' };
        // v9.82: fish / axolotls need an aquarium at home (they used to wander about on the floor)
        if (['fish', 'axolotl'].includes(ART.look(p.sp).t) && !h.items.some(it => it.k === 'aquarium')) return { err: 'homeNeedAquarium' };
        if ((s.customers || []).some(c => c.pid === p.id || c.pet === p.id)) return { err: 'homePetBusy' };
        s.pets[i] = null; delete p.pen; h.pets.push(p); H.addXp(s, 5);
        return { ok: 1, fx: 'place', msg: 'takenHome', p: { name: p.name } };
      }
      case 'hback': {
        const j = h.pets.findIndex(p => p.id === a.pid); if (j < 0) return { err: 'gone' };
        const p = h.pets[j], free = H.freeSlotsKind(s, H.kindOf(p.sp));
        if (!free.length) return { err: 'needHouse', p: { h: H.kindOf(p.sp) } };
        h.pets.splice(j, 1); s.pets[free[0]] = p;
        return { ok: 1, fx: 'place', msg: 'backToShop', p: { name: p.name } };
      }
      case 'hpat': {
        const p = h.pets.find(q => q.id === a.pid); if (!p) return { err: 'gone' };
        p.happy = Math.min(100, (p.happy || 0) + 15); if (p.stress != null) p.stress = Math.max(0, p.stress - 10);
        return { ok: 1 };
      }
    }
    return undefined;
  }
  return { H: () => H, init, ensure, apply, pts, fits, fp, N, cap, freeSpot, floorsOf };
})();

