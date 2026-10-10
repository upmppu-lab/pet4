// ================= Pet café: state logic + layout =================
// unlocked once the shop reaches Bronze reputation tier (rt_1); built north of the shop, reached
// from the road through a gate path (and from the shop through its back door).
// The café starts with a fixed kitchen row (fridge, stove, sink, register) and two 2-seat tables; every
// other table / machine / piece of furniture is BOUGHT by the player (shop -> ☕ tab) and placed by hand.
// Café levels only make the building bigger.
const CAFE_UNLOCK_TIER = 1; // Bronze (repTier >= 1)
const CAFE_BUILD_COST = 8000 * BAL.BUILD_K;
// 10 tiers, same idea as the shop's ROOM_SIZES ("펫샵처럼 10단계"), starting at the shop's own
// starting size (8x8).
const CAFE_LV = [null,
  { w: 8, d: 8, cost: 0, ulv: 1, pets: 2, pen: [3, 3] },
  { w: 10, d: 9, cost: 8000, ulv: 3, pets: 3, pen: [4, 3] },
  { w: 12, d: 10, cost: 18000, ulv: 5, pets: 4, pen: [5, 4] },
  { w: 14, d: 11, cost: 35000, ulv: 8, pets: 5, pen: [5, 4] },
  { w: 16, d: 12, cost: 60000, ulv: 11, pets: 6, pen: [6, 4] },
  { w: 18, d: 13, cost: 95000, ulv: 14, pets: 7, pen: [6, 5] },
  { w: 20, d: 14, cost: 150000, ulv: 17, pets: 8, pen: [7, 5] },
  { w: 22, d: 15, cost: 230000, ulv: 21, pets: 9, pen: [7, 5] },
  { w: 24, d: 16, cost: 340000, ulv: 25, pets: 10, pen: [8, 6] },
  { w: 26, d: 17, cost: 500000, ulv: 29, pets: 12, pen: [8, 6] },
];
CAFE_LV.forEach(l => { if (l) l.cost = balCost(l.cost); });
const CAFE_MAX = CAFE_LV.length - 1;
const cafeLv = s => { const st = s || (typeof S !== 'undefined' && S); return Math.min(CAFE_MAX, Math.max(1, (st && st.cafe && st.cafe.lv) || 1)); };
// Anchored to the SHOP, not to a fixed number: east edge = the shop's own east wall (x=W), so it
// sits the same ~1 tile from the road corridor (which starts at W+1.1) that the shop does -- and
// keeps doing so when the shop room expands. South edge (y=-5) is fixed, leaving a 5-tile yard
// between the shop's tall back wall and the café so the two never overlap on screen; it only
// grows north/west from there.
const cafeW = s => { const L = LAY('cafe', s); return L ? L.x + CAFE_LV[CAFE_MAX].w : LAY_FAR; }; // PET TOWN: east edge of the café's lot
const cafeS = s => { const L = LAY('cafe', s); return L ? L.y + CAFE_LV[CAFE_MAX].d : LAY_FAR; }; // south edge (was fixed at y=-5)
const CAFE_POS = s => { const e = CAFE_LV[cafeLv(s)]; return { x: cafeW(s) - e.w, y: cafeS(s) - e.d, w: e.w, d: e.d }; };
// pre-build placeholder sign: planted at the plot's road-side corner, right beside the gate path
const CAFE_SIGN = () => ({ x: LAY_FAR, y: LAY_FAR }); // PET TOWN: no signposts, built from the build menu
// the shop's back door (2 tiles: W-2, W-1) -- leads straight up to the café's south edge
const CAFE_DOOR = () => cafeW() - 1;
// where people enter the village: the far (north) end of the sidewalk, so they WALK down the
// street to the gate instead of popping into existence mid-road
const VILLAGE_N = -34, villageS = () => (typeof VILLAGE_S_MAX === 'function' ? VILLAGE_S_MAX() - 2 : (S && S.room ? S.room.h : 8) + 34);
const CAFE_SPAWN = () => ({ x: ((typeof S !== 'undefined' && S && S.room && S.room.w) || 8) + 2.2, y: VILLAGE_N }); // down the main street
const CAFE_ENTRY = () => { const cp = CAFE_POS(); return { x: cafeW() + 1.6, y: cp.y + cp.d - .5 }; };
// the reserved lot for the future pet hospital: same footprint as the café's biggest tier, WEST of the shop
const VILLAGE_X0 = -60, VILLAGE_Y0 = -60, VILLAGE_XE = 70; // PET TOWN: a much bigger town (west edge, north edge, east edge = shop width + 70); // west edge of the walkable village (the pet hospital lot + a border of grass lie between it and the shop)
// (the pet hospital's lot / building live in hospcore.js)

const CAFE_ORDER_GAP = [18, 40]; // seconds between new orders
// v9.76: how long a guest waits for the food (seconds since the order was placed) before walking out angry
const CAFE_WAIT_NOFOOD = 60, CAFE_WAIT_OK = 150;
// v9.87: a guest needs ~20s to walk in, order at the desk and sit down; the server waits for that before bringing the food
const CAFE_SEATED_AGE = 24; // nothing to cook it with / food exists but nobody brings it
// the kinds of guests: how much they pay for their meal, how likely they head for a slot machine afterwards, and how much they spend there
const CAFE_GUEST_KINDS = [
  { id: 'regular', icon: '☕', w: 5, pay: 1, slot: .75, spend: 1 },
  { id: 'kid', icon: '👶', w: 2, pay: .7, slot: .1, spend: .4 },
  { id: 'elder', icon: '👴', w: 2, pay: 1.1, slot: .6, spend: 1.2 },
  { id: 'family', icon: '👨‍👩‍👧', w: 2, pay: 1.6, slot: .3, spend: .8 },
  { id: 'tourist', icon: '📷', w: 1.5, pay: 1.3, slot: .9, spend: 1.5 },
  { id: 'vip', icon: '👑', w: .8, pay: 2.4, slot: 1, spend: 2.5 },
];
// café staff (hired like the shop's): cook, server, play-mate. Wages are paid at the end of each day.
const CAFE_STAFF = [
  { id: 'cook', icon: '🍳', hire: 700, wage: 60 },
  { id: 'server', icon: '🍽️', hire: 600, wage: 50 },
  { id: 'cashier', icon: '💰', hire: 650, wage: 55 },
  { id: 'play', icon: '🎾', hire: 800, wage: 65 },
];
const CAFE_STAFF_MAX = 2, CAFE_STAFF_LV_MAX = 10;
const CAFE_STAFF_DUR = [0, 16, 13, 11, 9, 7.5, 6.2, 5.2, 4.4, 3.7, 3.1];
const cafeStaffRole = id => CAFE_STAFF.find(r => r.id === id);
const cafeStaffHire = (r, n) => Math.round(r.hire * (1 + n * .6) / 10) * 10;
const cafeStaffWage = (r, lv) => Math.round(r.wage * BAL.WAGE_K * STAFF_WAGE_K[lv] / 5) * 5;
const cafeStaffUp = (r, lv) => Math.round(r.hire * STAFF_UP_K[lv + 1] / 10) * 10;
const CAFE_WALKIN_SPECIES = ['kitten', 'pomeranian', 'shiba', 'shiba_black', 'shiba_red', 'hamster', 'rabbit', 'maltese', 'maltese_cream', 'maltese_brown', 'corgi', 'budgie', 'persian', 'poodle', 'canary', 'guinea'];
const cafeKind = () => { let tot = 0; CAFE_GUEST_KINDS.forEach(k => tot += k.w); let r = Math.random() * tot; for (const k of CAFE_GUEST_KINDS) { r -= k.w; if (r <= 0) return k; } return CAFE_GUEST_KINDS[0]; };
const CAFE_ORDER_MAX = () => Math.min(12, CAFE_LAYOUT().tables.length); // one guest per (reachable) table
const CAFE_TIP_MULT = 2.4; // café pays a premium over the farmstall's raw sell price
// Everything the café cooks is made ONLY from what the farm grows (plus store-bought eggs); the
// "fridge" is simply the farm's produce stock, so every harvest is in it automatically.
// ing: ingredient -> amount. A dish unlocks when every crop in it is unlocked for the player.
const CAFE_DISHES = [
  { id: 'bread', icon: '🍞', ing: { wheat: 2 } },
  { id: 'fries', icon: '🍟', ing: { potato: 2 } },
  { id: 'saladbowl', icon: '🥗', ing: { carrot: 2 } },
  { id: 'tomatosoup', icon: '🍲', ing: { tomato: 2 } },
  { id: 'cornsoup', icon: '🥣', ing: { corn: 2 } },
  { id: 'omelet', icon: '🍳', ing: { egg: 2 } },
  { id: 'pumpkinpie', icon: '🥧', ing: { pumpkin: 2, egg: 1 } },
  { id: 'sandwich', icon: '🥪', ing: { wheat: 1, lettuce: 1, egg: 1 } },
  { id: 'strawberrycake', icon: '🍰', ing: { strawberry: 2, wheat: 1, egg: 1 } },
  { id: 'blueberrymuffin', icon: '🧁', ing: { blueberry: 2, wheat: 1, egg: 1 } },
  { id: 'grapejuice', icon: '🧃', ing: { grape: 2 } },
  // v1.27: ranch milk / meat and fruit-tree dishes
  { id: 'milkshake', icon: '🥤', ing: { milk: 2 } },
  { id: 'cheese', icon: '🧀', ing: { milk: 3 } },
  { id: 'pancake', icon: '🥞', ing: { wheat: 1, milk: 1, egg: 1 } },
  { id: 'icecream', icon: '🍨', ing: { milk: 1, strawberry: 1 } },
  { id: 'steak', icon: '🍖', ing: { meat: 2 } },
  { id: 'burger', icon: '🍔', ing: { wheat: 1, meat: 1, lettuce: 1 } },
  { id: 'pizza', icon: '🍕', ing: { wheat: 1, tomato: 1, meat: 1, milk: 1 } },
  { id: 'meatstew', icon: '🍛', ing: { meat: 1, potato: 1, carrot: 1 } },
  { id: 'applepie', icon: '🥧', ing: { apple: 2, wheat: 1, egg: 1 } },
  { id: 'peachsmoothie', icon: '🍹', ing: { peach: 1, milk: 1 } },
  { id: 'fruitsalad', icon: '🍧', ing: { apple: 1, orange: 1, cherry: 1 } },
  { id: 'lemonade', icon: '🍋', ing: { lemon: 2 } },
  { id: 'pearjuice', icon: '🍐', ing: { pear: 2 } },
  { id: 'mangolassi', icon: '🧋', ing: { mango: 1, milk: 1 } },
];
const cafeIngInfo = id => CROPS.find(x => x.id === id) || FARM_GOODS.find(x => x.id === id) || (typeof RANCH_GOODS !== 'undefined' && RANCH_GOODS[id] ? { id, icon: RANCH_GOODS[id].icon, sellPrice: RANCH_GOODS[id].sell } : null);
const cafeDishPrice = d => Math.round(Object.entries(d.ing).reduce((a, [k, n]) => a + (cafeIngInfo(k) ? cafeIngInfo(k).sellPrice : 20) * n, 0) * CAFE_TIP_MULT);

// ------------------------------------------------------------------ furniture catalog
// cat: seat (guests eat here), play (slot machines: guests spend money), deco, kit (kitchen extras), pen
// (play equipment, only inside the fenced pen). clv = café level needed. rot: can be turned to face the other wall.
const CAFE_FURN = [
  { k: 'table', cat: 'seat', w: 2, d: 2, cost: 400, clv: 1 },
  { k: 'slot', cat: 'play', w: 1, d: 1, cost: 1500, clv: 2, rot: 1 },
  { k: 'sofa', cat: 'deco', w: 1, d: 2, cost: 300, clv: 1 },
  { k: 'bookshelf', cat: 'deco', w: 1, d: 2, cost: 350, clv: 1 },
  { k: 'plant', cat: 'deco', w: 1, d: 1, cost: 80, clv: 1 },
  { k: 'lamp', cat: 'deco', w: 1, d: 1, cost: 120, clv: 1 },
  { k: 'fountain', cat: 'deco', w: 1, d: 1, cost: 700, clv: 3 },
  { k: 'towertree', cat: 'deco', w: 1, d: 1, cost: 600, clv: 3 },
  { k: 'aquarium', cat: 'deco', w: 1, d: 2, cost: 1200, clv: 3 },
  { k: 'jukebox', cat: 'deco', w: 1, d: 1, cost: 900, clv: 4 },
  { k: 'arcade', cat: 'play', w: 1, d: 2, cost: 1000, clv: 4 },
  { k: 'photobooth', cat: 'deco', w: 1, d: 2, cost: 1400, clv: 5 },
  { k: 'counter', cat: 'kit', w: 2, d: 1, cost: 300, clv: 1 },
  { k: 'espresso', cat: 'kit', w: 1, d: 1, cost: 500, clv: 2 },
  { k: 'shelf', cat: 'kit', w: 1, d: 1, cost: 250, clv: 2 },
  { k: 'ballpit', cat: 'pen', w: 2, d: 2, cost: 400, clv: 1 },
  { k: 'slide', cat: 'pen', w: 2, d: 1, cost: 500, clv: 1 },
  { k: 'tunnel', cat: 'pen', w: 2, d: 1, cost: 350, clv: 1 },
  { k: 'cattree', cat: 'pen', w: 1, d: 2, cost: 450, clv: 2 },
  { k: 'seesaw', cat: 'pen', w: 2, d: 1, cost: 300, clv: 2 },
  { k: 'hoop', cat: 'pen', w: 2, d: 1, cost: 300, clv: 3 },
  { k: 'scratch', cat: 'pen', w: 1, d: 2, cost: 200, clv: 3 },
  { k: 'bowls', cat: 'pen', w: 1, d: 1, cost: 100, clv: 1 },
];
// the kitchen row every caf챕 starts with: ordinary (movable) pieces, but not for sale and not sellable
CAFE_FURN.push({ k: 'fridge', cat: 'kit', w: 1, d: 1, cost: 0, clv: 1, fixed: 1 }, { k: 'stove', cat: 'kit', w: 1, d: 1, cost: 0, clv: 1, fixed: 1 }, { k: 'sink', cat: 'kit', w: 1, d: 1, cost: 0, clv: 1, fixed: 1 }, { k: 'register', cat: 'kit', w: 1, d: 1, cost: 0, clv: 1, fixed: 1 }, { k: 'cashdesk', cat: 'kit', w: 2, d: 1, cost: 0, clv: 1, fixed: 1 });
const cafeFurn = k => CAFE_FURN.find(f => f.k === k);
const CAFE_SELL_BACK = .5;

// ------------------------------------------------------------------ layout
// Pure function of (café state, shop width, café level): the fixed pen (NW corner) + kitchen row
// (north wall) plus whatever furniture the player has bought and placed. Also works out which tiles a
// guest can actually reach from the street, so a bad placement (walling off a table, the pen gate, a
// machine or the stove) can be refused.
function cafeBuildLayout(cf, Wv, lv) {
  const e = CAFE_LV[lv], ex = Wv - e.w, ny = cafeS() - e.d, W_ = e.w, D_ = e.d;
  const solid = new Set();
  const mark = (x, y, w, d) => { for (let i = 0; i < w; i++) for (let j = 0; j < d; j++) solid.add((x + i) + ',' + (y + j)); };
  const inRect = (x, y) => x >= ex && x < ex + W_ && y >= ny && y < ny + D_;
  const pen = { x0: ex + 1, y0: ny + 1, x1: ex + 1 + e.pen[0], y1: ny + 1 + e.pen[1] };
  mark(pen.x0, pen.y0, e.pen[0], e.pen[1]);
  // the fixed kitchen row along the north wall, east of the pen: fridge, stove, sink, register
  const kit = []; let kx = pen.x1;
  for (const [k, w] of (cf && cf.kitDone) ? [] : [['fridge', 1], ['stove', 1], ['sink', 1], ['counter', 1]]) {
    if (kx + w > ex + W_) break;
    const it = { k, x: kx, y: ny, w, d: 1, solid: true, fixed: true }; kit.push(it); mark(it.x, it.y, it.w, it.d); kx += w;
  }
  const tables = [], slots = [], deco = [], equip = [];
  for (const it of (cf && cf.items) || []) {
    const F = cafeFurn(it.k); if (!F) continue;
    if (F.cat === 'pen') { equip.push({ id: it.id, k: it.k, x: pen.x0 + it.x, y: pen.y0 + it.y, w: it.r ? F.d : F.w, d: it.r ? F.w : F.d, r: it.r ? 1 : 0, rx: it.x, ry: it.y }); continue; }
    const o = { id: it.id, k: it.k, x: it.x + Wv, y: it.y + cafeS(), w: it.r ? F.d : F.w, d: it.r ? F.w : F.d, r: it.r ? 1 : 0, solid: true, f: it.f || 's', cat: F.cat }; // stored relative to the café's south-east corner (x = W, y = -5), so it follows the shop's width and survives level-ups
    mark(o.x, o.y, o.w, o.d);
    if (F.fixed) kit.push(o);
    else if (it.k === 'table') tables.push(o);
    else if (it.k === 'slot') { o.i = it.id; o.fx = o.f === 's' ? o.x : o.x + 1; o.fy = o.f === 's' ? o.y + 1 : o.y; slots.push(o); }
    else deco.push(o);
  }
  // tiles reachable on foot from the street (the walls on the west / north sides are not a way in)
  // the walls run all round: the only way in is the two-tile door at the south end of the east wall
  const door = { x: ex + W_, ys: [ny + D_ - 2, ny + D_ - 1], sy: ny + D_, sxs: [ex + W_ - 2, ex + W_ - 1] }; // v9.90: + a south door facing the pet shop's back door
  const reach = new Set(), st = [Math.floor(Wv + 1.6), door.ys[1]], stack = [st];
  const okT = (x, y) => x >= ex && x <= ex + W_ + 2 && y >= ny && y <= ny + D_ + 2 && !solid.has(x + ',' + y);
  const crossOk = (x, y, nx, nyy) => { const a = inRect(x, y), b = inRect(nx, nyy); if (a === b) return true; const ix = a ? x : nx, iy = a ? y : nyy, ox = a ? nx : x, oy = a ? nyy : y; return (ix === door.x - 1 && ox === door.x && iy === oy && door.ys.includes(iy)) || (iy === door.sy - 1 && oy === door.sy && ix === ox && door.sxs.includes(ix)); };
  if (okT(st[0], st[1])) reach.add(st.join(','));
  while (stack.length) { const [x, y] = stack.pop(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, nyy = y + dy, k = nx + ',' + nyy; if (reach.has(k) || !okT(nx, nyy) || !crossOk(x, y, nx, nyy)) continue; reach.add(k); stack.push([nx, nyy]); } }
  // keep the way in from the door clear: nothing may stand on the three columns just inside it
  const noPlace = new Set(); for (const y of [door.ys[0] - 1, door.ys[0], door.ys[1]]) for (let x = door.x - 3; x < door.x; x++) noPlace.add(x + ',' + y);
  for (const x of door.sxs) for (let y = door.sy - 2; y < door.sy; y++) noPlace.add(x + ',' + y);
  // each table's seat: a free reachable neighbour tile on its FRONT sides (south / east) first, so the guest is drawn in front of it
  const usedSeat = new Set();
  for (const t of tables) {
    const opts = [[t.x + 2, t.y + 1], [t.x + 1, t.y + 2], [t.x, t.y + 2], [t.x + 2, t.y], [t.x - 1, t.y + 1], [t.x - 1, t.y], [t.x + 1, t.y - 1], [t.x, t.y - 1]];
    const good = ([ox, oy]) => inRect(ox, oy) && reach.has(ox + ',' + oy);
    const s = opts.find(o => good(o) && !usedSeat.has(o.join(','))) || opts.find(good);
    if (s) { t.sx = s[0] + .5; t.sy = s[1] + .5; usedSeat.add(s.join(',')); }
  }
  const flats = [];
  const rugW = Math.min(8, W_ - 4), rugD = Math.min(6, D_ - 6);
  if (rugW >= 4 && rugD >= 3) flats.push({ k: 'rug', x: ex + Math.floor((W_ - rugW) / 2) + 1, y: ny + Math.floor((D_ - rugD) / 2) + 1, w: rugW, d: rugD });
  const byK = k => kit.find(i => i.k === k);
  return { door, noPlace, pen, equip, kit, tables, deco, slots, flats, solid, reach, ex, ny, W_, D_, stove: byK('stove') || { x: pen.x1 + 1, y: ny }, fridge: byK('fridge') || { x: pen.x1 + 1, y: ny },
    penGate: { x: pen.x0 + e.pen[0] / 2, y: pen.y1 + .5 } };
}
// null if every table has a seat and everything a guest / the player must reach still can be
function cafeLayoutErr(L) {
  for (const t of L.tables) if (t.sx == null) return 'cafeBlocked';
  for (const s of L.slots) if (!L.reach.has(s.fx + ',' + s.fy)) return 'cafeBlocked';
  if (!L.reach.has(Math.floor(L.penGate.x) + ',' + Math.floor(L.penGate.y))) return 'cafeBlocked';
  for (const k of L.kit) if (!L.reach.has(k.x + ',' + (k.y + 1))) return 'cafeBlocked';
  return null;
}
// can `it` ({id,k,x,y,f}; pen pieces use x,y relative to the pen) go there? -> error key or null
function cafeCheckPlace(cf, Wv, lv, it) {
  const F0 = cafeFurn(it.k); if (!F0) return 'gone';
  const F = it.r ? Object.assign({}, F0, { w: F0.d, d: F0.w }) : F0; // rotated: the footprint is turned
  const e = CAFE_LV[lv], others = (cf.items || []).filter(o => o.id !== it.id), L0 = cafeBuildLayout({ items: others }, Wv, lv);
  if (F.cat === 'pen') {
    if (it.x < 0 || it.y < 0 || it.x + F.w > e.pen[0] || it.y + F.d > e.pen[1]) return 'cafePenOnly';
    for (const q of L0.equip) if (it.x < q.rx + q.w && it.x + F.w > q.rx && it.y < q.ry + q.d && it.y + F.d > q.ry) return 'cafeOverlap';
    return null;
  }
  for (let i = 0; i < F.w; i++) for (let j = 0; j < F.d; j++) {
    const x = it.x + i, y = it.y + j;
    if (x < L0.ex || x >= L0.ex + L0.W_ || y < L0.ny || y >= L0.ny + L0.D_) return 'cafeOutside';
    if (L0.solid.has(x + ',' + y) || L0.noPlace.has(x + ',' + y)) return 'cafeOverlap';
  }
  const L1 = cafeBuildLayout({ items: others.concat([{ id: it.id, k: it.k, x: it.x - Wv, y: it.y - cafeS(), f: it.f, r: it.r }]) }, Wv, lv);
  return cafeLayoutErr(L1);
}
// first free spot for a new piece: the south-east side first, keeping a tile of air around it when possible
function cafeAutoSpot(cf, Wv, lv, k) {
  const F = cafeFurn(k), e = CAFE_LV[lv], ex = Wv - e.w, ny = cafeS() - e.d, cand = [];
  if (F.cat === 'pen') { for (let y = 0; y + F.d <= e.pen[1]; y++) for (let x = 0; x + F.w <= e.pen[0]; x++) cand.push({ x, y }); for (const c of cand) if (!cafeCheckPlace(cf, Wv, lv, { id: -1, k, x: c.x, y: c.y })) return c; return null; }
  for (let y = ny + e.d - F.d; y >= ny; y--) for (let x = ex + e.w - F.w; x >= ex; x--) cand.push({ x, y });
  const L0 = cafeBuildLayout(cf, Wv, lv);
  for (const air of [true, false]) for (const c of cand) {
    if (air) { let ok = true; for (let i = -1; i <= F.w && ok; i++) for (let j = -1; j <= F.d; j++) if (L0.solid.has((c.x + i) + ',' + (c.y + j))) { ok = false; break; } if (!ok) continue; }
    if (!cafeCheckPlace(cf, Wv, lv, { id: -1, k, x: c.x, y: c.y, f: 's' })) return c;
  }
  return null;
}
const _cafeLayoutCache = {};
function CAFE_LAYOUT() {
  const cf = S.cafe || {}, lv = cafeLv(), Wv = cafeW(), key = Wv + '|' + cafeS() + '|' + lv + '|' + (cf.iv | 0) + '|' + ((cf.items || []).length);
  if (_cafeLayoutCache.key === key && _cafeLayoutCache.arr === cf.items) return _cafeLayoutCache.v;
  const L = cafeBuildLayout(cf, Wv, lv);
  _cafeLayoutCache.key = key; _cafeLayoutCache.arr = cf.items; _cafeLayoutCache.v = L;
  return L;
}
const CAFE_STOVE = () => CAFE_LAYOUT().stove;
const CAFE_FRIDGE = () => CAFE_LAYOUT().fridge;
const CAFE_PEN = () => { const p = CAFE_LAYOUT().pen; return { x0: p.x0, y0: p.y0, x1: p.x1, y1: p.y1 }; };
const CAFE_TABLES = () => CAFE_LAYOUT().tables;

const CAFE = (() => {
  let H = null;
  function init(h) { H = h; }
  function initItems(s, cf) { // the two starter tables (also how saves from before furniture was purchasable get their tables)
    cf.items = []; cf.iseq = 1; cf.iv = (cf.iv | 0) + 1;
    const Wv = cafeW(), lv = Math.min(CAFE_MAX, Math.max(1, cf.lv || 1));
    for (let i = 0; i < 2; i++) { const p = cafeAutoSpot(cf, Wv, lv, 'table'); if (p) cf.items.push({ id: cf.iseq++, k: 'table', x: p.x - Wv, y: p.y - cafeS() }); }
  }
  function ensure(s) {
    if (!s.cafe) s.cafe = { built: false, orders: [], seq: 1, served: 0, spawnT: 0, dishes: {}, lv: 1, pending: [] };
    const cf = s.cafe;
    if (!cf.orders) cf.orders = []; if (!cf.seq) cf.seq = 1; if (cf.served == null) cf.served = 0; if (cf.spawnT == null) cf.spawnT = 0; if (!cf.dishes) cf.dishes = {}; if (!cf.lv) cf.lv = 1; if (!cf.pending) cf.pending = []; if (!cf.players) cf.players = []; if (!cf.staff) cf.staff = []; if (!cf.sseq) cf.sseq = 1; if (cf.joy == null) cf.joy = 0;
    if (cf.built && !cf.items) initItems(s, cf);
    if (cf.built && cf.items && !cf.kitDone) { // the kitchen row becomes ordinary stored pieces (movable)
      const Wv = cafeW(), lv = Math.min(CAFE_MAX, Math.max(1, cf.lv || 1)), L = cafeBuildLayout(cf, Wv, lv);
      for (const it of L.kit) cf.items.push({ id: cf.iseq++, k: it.k === 'counter' ? 'register' : it.k, x: it.x - Wv, y: it.y - cafeS(), f: 's' });
      cf.kitDone = 1; cf.iv = (cf.iv | 0) + 1;
    }
    if (cf.built && cf.items && cf.kitDone && !cf.deskDone) { // the cashier's desk beside the door
      cf.deskDone = 1; const Wv = cafeW(), lv = Math.min(CAFE_MAX, Math.max(1, cf.lv || 1)), L = cafeBuildLayout(cf, Wv, lv);
      let p = { x: L.door.x - 2, y: L.door.ys[0] - 2 };
      if (cafeCheckPlace(cf, Wv, lv, { id: -1, k: 'cashdesk', x: p.x, y: p.y, f: 's' })) p = cafeAutoSpot(cf, Wv, lv, 'cashdesk');
      if (p) { cf.items.push({ id: cf.iseq++, k: 'cashdesk', x: p.x - Wv, y: p.y - cafeS(), f: 's' }); cf.iv = (cf.iv | 0) + 1; }
    }
    if (cf.built && cf.items && !cf.v7) { // the new door needs a clear way in: move whatever stood on it
      cf.v7 = 1; const Wv = cafeW(), lv = Math.min(CAFE_MAX, Math.max(1, cf.lv || 1)), np = cafeBuildLayout({ items: [] }, Wv, lv).noPlace;
      for (const it of cf.items.slice()) {
        const F = cafeFurn(it.k); if (!F || F.cat === 'pen') continue;
        let hit = false; for (let i = 0; i < F.w; i++) for (let j = 0; j < F.d; j++) if (np.has((it.x + Wv + i) + ',' + (it.y + cafeS() + j))) hit = true;
        if (!hit) continue;
        cf.items = cf.items.filter(x => x !== it); cf.iv = (cf.iv | 0) + 1;
        const p = cafeAutoSpot(cf, Wv, lv, it.k);
        if (p) cf.items.push({ id: it.id, k: it.k, x: p.x - Wv, y: p.y - cafeS(), f: it.f }); else s.coins += F.cost;
      }
      cf.iv = (cf.iv | 0) + 1;
    }
    return cf;
  }
  function ordersFor(s) { const cf = ensure(s); return cf.orders; }
  const ingUnlocked = (s, id) => { const cr = CROPS.find(x => x.id === id); if (cr) return cr.ulv <= s.level; const g = FARM_GOODS.find(x => x.id === id); return !g || g.ulv <= s.level; };
  function dishUnlocked(s, dish) { return Object.keys(dish.ing).every(k => ingUnlocked(s, k)); }
  function canCook(s, dish) { const f = s.farm; return !!f && Object.entries(dish.ing).every(([k, n]) => (f.produce[k] || 0) >= n); }
  function tick(s, dt) {
    const cf = ensure(s); if (!cf.built) return;
    // guests who finished eating and are feeding the slot machines: they pay when their turn is over
    staffWork(s, cf, dt);
    // v9.76: guests don't wait forever -- no food (no ingredients) = short patience, food but nobody serving = longer.
    // They leave without paying, angry; the world layer shows the face + a speech bubble (cf.angry: order id + which line).
    cf.angry = (cf.angry || []).filter(x => (x.t += dt) < 40);
    cf.done = (cf.done || []).filter(x => (x.t += dt) < 90);
    for (const o of cf.orders.slice()) {
      const d = CAFE_DISHES.find(z => z.id === o.dish), ready = (cf.dishes[o.dish] || 0) > 0, possible = ready || (d && canCook(s, d));
      if ((o.age || 0) <= (possible ? CAFE_WAIT_OK : CAFE_WAIT_NOFOOD)) continue;
      cf.orders = cf.orders.filter(x => x !== o); cf.lost = (cf.lost | 0) + 1; cf.joy = Math.max(0, (cf.joy || 0) - 10);
      cf.angry.push({ id: o.id, line: possible ? 1 + Math.floor(Math.random() * 2) : 0, t: 0 }); if (typeof TOWN !== 'undefined') TOWN.mood(s, -1, 'cafe'); // PET TOWN
    }
    for (let i = cf.players.length - 1; i >= 0; i--) { const pl = cf.players[i]; if (pl.w > 0) { pl.w -= dt; continue; } pl.t -= dt; /* v9.87: pl.w = eating + paying at the desk before she reaches the machine */ if (pl.t <= 0) { s.coins += pl.spend; cf.played = (cf.played || 0) + 1; cf.players.splice(i, 1); (cf.slotPaid = cf.slotPaid || {})[pl.id] = { c: pl.spend, t: 0 }; } }
    if (cf.slotPaid) for (const k in cf.slotPaid) if ((cf.slotPaid[k].t += dt) > 5) delete cf.slotPaid[k]; // slot-machine spend bubbles fade after 5s
    if (!G.isOpen(s)) return; // v9.74: the café keeps the pet shop's hours -- no new guests while the shop is closed
    if (cf.orders.length >= CAFE_ORDER_MAX()) return;
    if (!cf.pending.length) { // no buyers waiting: now and then an ordinary villager drops in (with or without a pet)
      cf.walkT = (cf.walkT == null ? 30 : cf.walkT) - dt;
      if (cf.walkT <= 0) {
        const opts = makeableDishes(s, cf), kd = cafeKind();
        if (opts.length) { const d = opts[Math.floor(Math.random() * opts.length)]; cf.orders.push({ id: cf.seq++, dish: d.id, kind: kd.id, pay: Math.round(cafeDishPrice(d) * kd.pay), buyerName: null, buyerSeed: 1 + Math.floor(Math.random() * 1e6), buyerSp: Math.random() < .6 ? CAFE_WALKIN_SPECIES[Math.floor(Math.random() * CAFE_WALKIN_SPECIES.length)] : null, petMode: Math.random() < .5 ? 'pen' : 'table' }); }
        cf.walkT = opts.length ? 50 + Math.random() * 60 : 20; // nothing we can make right now: nobody orders, look again soon
      }
      return;
    }
    cf.spawnT -= dt;
    if (cf.spawnT <= 0) {
      const opts = makeableDishes(s, cf);
      if (!opts.length) { cf.spawnT = 15; return; } // the buyer waits in line until the kitchen can make something
      const buyer = cf.pending.shift();
      if (opts.length) {
        const d = opts[Math.floor(Math.random() * opts.length)], kd = cafeKind();
        // some guests keep their new pet with them at the table, others leave it in the pen to play
        cf.orders.push({ id: cf.seq++, dish: d.id, kind: kd.id, pay: Math.round(cafeDishPrice(d) * kd.pay), buyerName: buyer.name, buyerSeed: buyer.seed, buyerSp: buyer.sp, petMode: Math.random() < .5 ? 'pen' : 'table' });
      }
      cf.spawnT = CAFE_ORDER_GAP[0] + Math.random() * (CAFE_ORDER_GAP[1] - CAFE_ORDER_GAP[0]);
    }
  }
  // v9.83: guests only order what the café can actually serve -- a dish already cooked (and not promised to another order)
  // or one the fridge still has the ingredients for, after setting aside what the open, uncooked orders will use
  // (they used to order anything unlocked, wait for food that could never come and leave angry)
  function makeableDishes(s, cf) {
    const stock = Object.assign({}, (s.farm && s.farm.produce) || {}), ready = Object.assign({}, cf.dishes || {});
    for (const o of cf.orders) {
      if ((ready[o.dish] || 0) > 0) { ready[o.dish]--; continue; }
      const d = CAFE_DISHES.find(z => z.id === o.dish); if (d) for (const [k, n] of Object.entries(d.ing)) stock[k] = (stock[k] || 0) - n;
    }
    return CAFE_DISHES.filter(d => dishUnlocked(s, d) && ((ready[d.id] || 0) > 0 || Object.entries(d.ing).every(([k, n]) => (stock[k] || 0) >= n)));
  }
  const cafeStaffName = s => { const L = (typeof NAMES !== 'undefined' && (NAMES[s.lang || 'ko'] || NAMES.ko)) || ['?']; return L[Math.floor(Math.random() * L.length)]; };
  // serving an order: pay (raised by the guests' happiness), then maybe a turn at a slot machine
  function serveOrder(s, cf, o) {
    const Wv = cafeW(), lv = Math.min(CAFE_MAX, Math.max(1, cf.lv || 1));
    cf.dishes[o.dish]--; cf.orders = cf.orders.filter(x => x.id !== o.id); cf.served++; if (typeof TOWN !== 'undefined') TOWN.mood(s, .4);
    let bonus = 0; for (const m of cf.staff) if (m.role === 'cashier') { bonus += .04 + .012 * m.lv; m.tt = 1.6; m.done = (m.done | 0) + 1; } // a cashier at the desk brings a little extra per bill
    const pay = Math.round(o.pay * (1 + Math.min(100, cf.joy || 0) / 200) * (1 + bonus)); s.coins += pay; H.addXp(s, 4); o.paid = pay; (cf.done = cf.done || []).push({ id: o.id, pay, t: 0 }); // v9.91: partners' screens learn "served + how much" from this list // v9.84: the guest shows this amount in a bubble when paying at the desk
    // after the meal some guests head for a slot machine and spend more ("먹고 놀아서 돈을 쓴다")
    { const sl = cafeBuildLayout(cf, Wv, lv).slots, used = new Set(cf.players.map(x => x.slot)), free = sl.filter(x => !used.has(x.i));
      const kd = CAFE_GUEST_KINDS.find(k => k.id === o.kind) || CAFE_GUEST_KINDS[0];
      if (free.length && Math.random() < kd.slot) cf.players.push({ id: o.id, seat: o.seat, buyerSeed: o.buyerSeed, buyerSp: o.buyerSp, petMode: o.petMode, slot: free[Math.floor(Math.random() * free.length)].i, w: 20, t: 10 + Math.random() * 8, spend: Math.round((60 + Math.random() * 140) * (1 + .18 * lv) * kd.spend) }); }
    return pay;
  }
  function cookDish(s, cf, d) { for (const [k, n] of Object.entries(d.ing)) s.farm.produce[k] -= n; cf.dishes[d.id] = (cf.dishes[d.id] || 0) + 1; H.addXp(s, 3); }
  // hired staff: the cook makes what the open orders need, the server carries finished dishes to the guests, the play-mate
  // keeps the guests' pets busy (guest happiness -> everyone pays more)
  function staffWork(s, cf, dt) {
    cf.joy = Math.max(0, (cf.joy || 0) - .6 * dt);
    cf.noW = (cf.noW || 0) + dt; const auto = cf.noW > 3; // v9.89: while the village is on screen the cook/server actors do the work (world.js cafeStaffStep); otherwise the old timers
    for (const o of cf.orders) o.age = (o.age || 0) + dt;
    for (const m of cf.staff) {
      m.t = (m.t == null ? 3 : m.t) - dt; if (m.t > 0) continue;
      const dur = CAFE_STAFF_DUR[m.lv] || 10;
      if ((m.role === 'cook' || m.role === 'server') && !auto) { m.t = 1; continue; }
      if (m.role === 'cook') {
        const o = cf.orders.find(x => (cf.dishes[x.dish] || 0) <= 0 && x.age >= 8), d = o && CAFE_DISHES.find(z => z.id === o.dish);
        if (d && canCook(s, d)) { cookDish(s, cf, d); m.done = (m.done | 0) + 1; m.tt = 1.2; }
      } else if (m.role === 'server') {
        const o = cf.orders.find(x => (cf.dishes[x.dish] || 0) > 0 && x.age >= CAFE_SEATED_AGE); // v9.87: only once the guest has ordered at the desk and sat down
        if (o) { serveOrder(s, cf, o); m.done = (m.done | 0) + 1; m.tt = 1.2; }
      } else if (m.role === 'play') {
        if (cf.orders.length || cf.players.length) { cf.joy = Math.min(100, (cf.joy || 0) + 12 + 2 * m.lv); m.done = (m.done | 0) + 1; m.tt = 1.2; }
      }
      m.t = dur;
    }
    for (const m of cf.staff) if (m.tt > 0) m.tt -= dt;
  }
  const wagesOf = cf => ((cf && cf.staff) || []).reduce((a, m) => a + cafeStaffWage(cafeStaffRole(m.role) || CAFE_STAFF[0], m.lv), 0);
  function apply(s, a, by) {
    const cf = ensure(s);
    const Wv = cafeW(), lvOf = () => Math.min(CAFE_MAX, Math.max(1, cf.lv || 1));
    if (a.t === 'buildcafe') {
      if (!(s.lay && s.lay.cafe)) return { err: 'tUseBuildMenu' }; // PET TOWN: only from the build menu, after choosing the spot
      if (cf.built) return { err: 'gone' };
      if (repTier(s.rep) < CAFE_UNLOCK_TIER) return { err: 'cafeNeedRep' };
      if (s.coins < CAFE_BUILD_COST) return { err: 'notEnough' };
      s.coins -= CAFE_BUILD_COST; cf.built = true; cf.spawnT = 6; initItems(s, cf);
      if (typeof TOWN !== 'undefined' && TOWN.fitShop) TOWN.fitShop(s);
      return { ok: 1, fx: 'coin', msg: 'cafeBuilt' };
    }
    if (a.t === 'cafeup') {
      if (!cf.built) return { err: 'gone' };
      const nx = CAFE_LV[cf.lv + 1]; if (!nx) return { err: 'gone' };
      if (s.level < nx.ulv) return { err: 'homeNeedPlayer', p: { n: nx.ulv } };
      if (s.coins < nx.cost) return { err: 'notEnough' };
      s.coins -= nx.cost; cf.lv++; H.addXp(s, 30);
      if (typeof TOWN !== 'undefined' && TOWN.fitShop) TOWN.fitShop(s);
      // the building grew west/north: the fixed pen + kitchen row moved, so anything now standing on them is re-placed
      { const fixed = cafeBuildLayout({ items: [] }, Wv, lvOf()).solid, back = [];
        cf.items = cf.items.filter(it => { const F = cafeFurn(it.k); if (!F || F.cat === 'pen') return true; for (let i = 0; i < F.w; i++) for (let j = 0; j < F.d; j++) if (fixed.has((it.x + Wv + i) + ',' + (it.y + cafeS() + j))) { back.push(it); return false; } return true; });
        for (const it of back) { const p = cafeAutoSpot(cf, Wv, lvOf(), it.k); if (p) { it.x = p.x - Wv; it.y = p.y - cafeS(); cf.items.push(it); } else s.coins += cafeFurn(it.k).cost; }
        cf.iv = (cf.iv | 0) + 1; }
      return { ok: 1, fx: 'coin', msg: 'cafeUpOk', p: { n: cf.lv } };
    }
    if (a.t === 'cafebuy') {
      if (!cf.built) return { err: 'gone' };
      const F = cafeFurn(a.k); if (!F) return { err: 'gone' };
      if (cf.lv < F.clv) return { err: 'cafeNeedLv', p: { n: F.clv } };
      if (s.coins < F.cost) return { err: 'notEnough' };
      const p = cafeAutoSpot(cf, Wv, lvOf(), F.k); if (!p) return { err: 'cafeNoRoom' };
      s.coins -= F.cost; const it = { id: cf.iseq++, k: F.k, x: F.cat === 'pen' ? p.x : p.x - Wv, y: F.cat === 'pen' ? p.y : p.y - cafeS() }; if (F.rot) it.f = 's'; cf.items.push(it); cf.iv = (cf.iv | 0) + 1;
      return { ok: 1, fx: 'coin', msg: 'cafeBought', cplace: it.id };
    }
    if (a.t === 'cafemove') {
      if (!cf.built) return { err: 'gone' };
      const it = cf.items.find(x => x.id === a.iid); if (!it) return { err: 'gone' };
      const F = cafeFurn(it.k), L = cafeBuildLayout(cf, Wv, lvOf());
      const nx = F.cat === 'pen' ? a.x - L.pen.x0 : a.x, ny = F.cat === 'pen' ? a.y - L.pen.y0 : a.y;
      const err = cafeCheckPlace(cf, Wv, lvOf(), { id: it.id, k: it.k, x: nx, y: ny, f: it.f, r: it.r }); if (err) return { err };
      it.x = F.cat === 'pen' ? nx : nx - Wv; it.y = F.cat === 'pen' ? ny : ny - cafeS(); cf.iv = (cf.iv | 0) + 1;
      return { ok: 1, fx: 'place' };
    }
    if (a.t === 'caferot') {
      const it = (cf.items || []).find(x => x.id === a.iid); if (!it || !cafeFurn(it.k)) return { err: 'gone' };
      if (!cafeFurn(it.k).rot) { // any other piece: turn its footprint (1x2 <-> 2x1); the drawing is mirrored
        const F1 = cafeFurn(it.k), r0 = it.r; it.r = r0 ? 0 : 1;
        const pen = F1.cat === 'pen', L1 = cafeBuildLayout(cf, Wv, lvOf());
        let err1 = cafeCheckPlace(cf, Wv, lvOf(), { id: it.id, k: it.k, x: pen ? it.x : it.x + Wv, y: pen ? it.y : it.y + cafeS(), f: it.f, r: it.r });
        // no room where it stands: nudge the turned piece a tile or two to a spot where it fits
        for (const [dx, dy] of [[-1, 0], [0, -1], [1, 0], [0, 1], [-1, -1], [1, 1], [-1, 1], [1, -1], [-2, 0], [0, -2], [2, 0], [0, 2]]) { if (!err1) break; err1 = cafeCheckPlace(cf, Wv, lvOf(), { id: it.id, k: it.k, x: (pen ? it.x : it.x + Wv) + dx, y: (pen ? it.y : it.y + cafeS()) + dy, f: it.f, r: it.r }); if (!err1) { it.x += dx; it.y += dy; } }
        if (err1) { it.r = r0; return { err: err1 }; }
        cf.iv = (cf.iv | 0) + 1; return { ok: 1, fx: 'place' };
      }
      const f0 = it.f; it.f = f0 === 'e' ? 's' : 'e';
      const err = cafeCheckPlace(cf, Wv, lvOf(), { id: it.id, k: it.k, x: it.x + Wv, y: it.y + cafeS(), f: it.f }); if (err) { it.f = f0; return { err }; }
      cf.iv = (cf.iv | 0) + 1; return { ok: 1, fx: 'place' };
    }
    if (a.t === 'cafesell') {
      const i = (cf.items || []).findIndex(x => x.id === a.iid); if (i < 0) return { err: 'gone' };
      const F = cafeFurn(cf.items[i].k); if (F && F.fixed) return { err: 'cafeFixedKeep' }; cf.items.splice(i, 1); cf.iv = (cf.iv | 0) + 1;
      cf.orders.forEach(o => { if (o.seat === a.iid) o.seat = null; });
      const back = Math.floor(F.cost * CAFE_SELL_BACK); s.coins += back;
      return { ok: 1, fx: 'coin', msg: 'cafeSold', p: { c: back } };
    }
    if (a.t === 'cafecook') {
      if (!cf.built) return { err: 'gone' };
      const d = CAFE_DISHES.find(x => x.id === a.dish); if (!d || !dishUnlocked(s, d)) return { err: 'gone' };
      if (!canCook(s, d)) return { err: 'cafeNeedIngredient' };
      for (const [k, n] of Object.entries(d.ing)) s.farm.produce[k] -= n;
      cf.dishes[d.id] = (cf.dishes[d.id] || 0) + 1; H.addXp(s, 3);
      return { ok: 1, fx: 'coin', msg: 'cafeCooked', p: { d: d.icon } };
    }
    if (a.t === 'cafeserve') {
      if (!cf.built) return { err: 'gone' };
      const o = cf.orders.find(x => x.id === a.oid); if (!o) return { err: 'gone' };
      if (!(cf.dishes[o.dish] > 0)) return { err: 'cafeNoProduce' };
      const pay = serveOrder(s, cf, o);
      return { ok: 1, fx: 'coin', msg: 'cafeServed', p: { c: pay } };
    }
    if (a.t === 'cafehire') {
      if (!cf.built) return { err: 'gone' };
      const r = cafeStaffRole(a.role); if (!r) return { err: 'gone' };
      const n = cf.staff.filter(m => m.role === r.id).length; if (n >= CAFE_STAFF_MAX) return { err: 'gone' };
      const cost = cafeStaffHire(r, n); if (s.coins < cost) return { err: 'notEnough' };
      s.coins -= cost; cf.staff.push({ id: cf.sseq++, role: r.id, lv: 1, seed: 1 + Math.floor(Math.random() * 99999), name: uniqueStaffName(s), t: 3, done: 0 });
      return { ok: 1, fx: 'coin', msg: 'hospHired' };
    }
    if (a.t === 'cafestaffup') {
      const m = cf.staff.find(x => x.id === a.sid); if (!m || m.lv >= CAFE_STAFF_LV_MAX) return { err: 'gone' };
      const cost = cafeStaffUp(cafeStaffRole(m.role), m.lv); if (s.coins < cost) return { err: 'notEnough' };
      s.coins -= cost; m.lv++; return { ok: 1, fx: 'coin', msg: 'hospStaffUp', p: { n: m.lv } };
    }
    if (a.t === 'cafefire') { const i = cf.staff.findIndex(x => x.id === a.sid); if (i < 0) return { err: 'gone' }; cf.staff.splice(i, 1); return { ok: 1, msg: 'fired' }; }    return undefined;
  }
  return { init, ensure, ordersFor, dishUnlocked, canCook, tick, apply, wagesOf };
})();
