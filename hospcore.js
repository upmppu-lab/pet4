// ================= Pet hospital: state logic + layout =================
// A single-storey hospital that GROWS with its level (like the shop): each level adds space, a new room and
// permission to install more / better equipment -- but only Lv1's basics come free; everything else is bought
// (in the shop's hospital tab) and placed by hand.
//   Lv1: reception + lobby (2 benches) + consulting room (exam table, desk) + 1 treatment bed
//   Lv2: nicer reception, 4 benches, treatment room (3 beds), X-ray room
//   Lv3: fancier reception, 8 benches, 6 beds, X-ray + CT, operating room
//   Lv4: even fancier reception, 12 benches, 8 beds, ward (inpatient beds, incubator, medicated bath)
// Café / shop / hospital stand in one line with the same east edge x = W: café north, shop, hospital SOUTH.
// A visit: register at the reception -> (sit on a lobby bench while the room is busy) -> walk to the consulting
// room for the exam -> treatment(s) -> back to the reception to pay. Patients really walk between the places.
const HOSP_UNLOCK_TIER = 2; // Silver
const HOSP_BUILD_COST = 30000 * BAL.BUILD_K;
const HOSP_LV = [null,
  { cost: 0, ulv: 2, rooms: ['clinic'], cap: { bench: 2, tbed: 1, exam: 0 }, skin: 1 },
  { cost: 40000, ulv: 10, rooms: ['clinic', 'treat', 'radio'], cap: { bench: 4, tbed: 3, exam: 1, xray: 1 }, skin: 2 },
  { cost: 120000, ulv: 18, rooms: ['clinic', 'treat', 'radio', 'surgery'], cap: { bench: 8, tbed: 6, exam: 2, xray: 1, ct: 1, surgery: 1 }, skin: 3 },
  { cost: 300000, ulv: 26, rooms: ['clinic', 'treat', 'radio', 'surgery', 'ward'], cap: { bench: 12, tbed: 8, exam: 3, xray: 2, ct: 1, surgery: 2, bed: 4, incubator: 2, medbath: 1 }, skin: 4 },
];
HOSP_LV.forEach(l => { if (l) l.cost = balCost(l.cost); });
const HOSP_MAX = HOSP_LV.length - 1;
const HOSP_ROOMS = { clinic: { w: 4, d: 5, icon: '🩺' }, treat: { w: 5, d: 6, icon: '💉' }, radio: { w: 4, d: 5, icon: '🩻' }, surgery: { w: 4, d: 5, icon: '🏥' }, ward: { w: 6, d: 6, icon: '🛏️' } };
const HOSP_LOBBY_W = 6;
const hospLvOf = lv => Math.min(HOSP_MAX, Math.max(1, lv || 1));
const hospLv = s => { const st = s || (typeof S !== 'undefined' && S); return hospLvOf(st && st.hosp && st.hosp.lv); };
const hospRoomsAt = lv => HOSP_LV[hospLvOf(lv)].rooms;
const hospCap = (lv, k) => (HOSP_LV[hospLvOf(lv)].cap || {})[k];
const hospRoom = s => { const st = s || (typeof S !== 'undefined' && S); return { w: (st && st.room && st.room.w) || 8, h: (st && st.room && st.room.h) || 8 }; };
// width = lobby zone + one column between rooms + the rooms; depth = deepest room + a 5-row corridor / lobby strip
const hospDims = lv => { const rs = hospRoomsAt(lv); let w = HOSP_LOBBY_W + rs.length, d = 5; for (const r of rs) { w += HOSP_ROOMS[r].w; d = Math.max(d, HOSP_ROOMS[r].d); } return { w, d: d + 5 + 3 * (hospLvOf(lv) - 1) }; }; // each level also adds 3 rows to the south, so the building grows west AND south
// east edge x = W (like the café and the shop), north edge y = H + 8 (an 8-tile yard below the shop's south wall)
// PET TOWN: the hospital stands on its own lot (S.lay.hosp = top-left of the biggest footprint); its north-east corner stays put and it grows west / south
const hospAnchor = s => { const L = LAY('hosp', s); return L ? { x1: L.x + hospDims(HOSP_MAX).w, y: L.y } : { x1: LAY_FAR, y: LAY_FAR }; };
const hospRect = (Wv, Hv, lv, s) => { const e = hospDims(lv), A = hospAnchor(s); return { x: A.x1 - e.w, y: A.y, w: e.w, d: e.d, x1: A.x1, y1: A.y + e.d }; };
const HOSP_POS = s => { const r = hospRoom(s); return hospRect(r.w, r.h, hospLv(s), s); };
const HOSP_LOT = s => { const r = hospRoom(s); return hospRect(r.w, r.h, 1, s); }; // the reserved lot (the first level's footprint; it grows west / south)
const HOSP_LOT_MAX = s => { const r = hospRoom(s); return hospRect(r.w, r.h, HOSP_MAX, s); }; // the biggest footprint (the hospital grows west / south into it)
const HOSP_SIGN = () => ({ x: LAY_FAR, y: LAY_FAR }); // PET TOWN: built from the build menu
const HOSP_ENTRY = () => { const p = HOSP_POS(); return { x: p.x1 + 1.5, y: p.y + 3 }; };
const VILLAGE_S_MAX = () => { const r = hospRoom(); return Math.max(r.h + 36, r.h + 8 + 12 + 6) + 24; }; // PET TOWN: +24 rows of building land

// ---- treatments. stn = the kind of station a step needs; mini = has a mini-game; dur = seconds the procedure takes
const HOSP_TX = [
  { id: 'reg', icon: '🛎️', stn: null, fee: 40, dur: 3.5 },
  { id: 'exam', icon: '🩺', stn: 'exam', fee: 100, dur: 5 },
  { id: 'drip', icon: '💧', stn: 'tbed', fee: 160, dur: 6 },
  { id: 'vaccine', icon: '💉', stn: 'tbed', fee: 200, dur: 4 },
  { id: 'bandage', icon: '🩹', stn: 'tbed', fee: 260, dur: 5 },
  { id: 'xray', icon: '🩻', stn: 'xray', fee: 520, mini: 1, dur: 6 },
  { id: 'ct', icon: '🧲', stn: 'ct', fee: 900, mini: 1, dur: 7 },
  { id: 'surgery', icon: '🏥', stn: 'surgery', fee: 1800, mini: 1, dur: 9 },
  { id: 'medbath', icon: '🛁', stn: 'medbath', fee: 900, dur: 7 },
  { id: 'incubate', icon: '🌡️', stn: 'incubator', fee: 700, dur: 8 },
  { id: 'rest', icon: '🛏️', stn: 'bed', fee: 300, dur: 8 },
  { id: 'pay', icon: '🧾', stn: null, fee: 0, dur: 3 },
];
const hospTx = id => HOSP_TX.find(x => x.id === id);
// how long a step really takes for THIS patient: the illness sets how serious it is (a cold is quick, a tumour is not), and every patient adds a random spread (paperwork, a nervous pet, a tricky case)
const HOSP_SEV = { cold: .7, stomach: .85, wound: 1, skin: 1.1, fracture: 1.5, chill: 1, swallow: 1.9, tumor: 2.2, beak: 1.3 };
const hospDurK = (p, st) => st === 'reg' ? (p.rv || 1) : st === 'pay' ? (p.pv || 1) : (HOSP_SEV[p.ail] || 1) * ((p.dv || [])[p.k] || 1) * (st === 'exam' ? .9 : 1);
const HOSP_CAPPED = ['bench', 'tbed', 'exam', 'xray', 'ct', 'surgery', 'bed', 'incubator', 'medbath'];
const HOSP_STN = ['exam', 'tbed', 'xray', 'ct', 'surgery', 'bed', 'incubator', 'medbath'];
// the step a patient is at: 'reg' before anything, then plan[k], then 'pay'
const hospStage = p => p.k < 0 ? 'reg' : p.k >= p.plan.length ? 'pay' : p.plan[p.k];
// patient phases (what the patient is physically doing)
//   walkin -> deskwait (at the reception, waiting to be served) -> deskserve (talking with the clerk)
//   bench (sitting in the lobby waiting for a free room) -> toStn (walking there) -> atStn (waiting for the doctor/nurse)
//   -> treat (being treated) ... -> deskwait/deskserve for the payment -> leaving
const HOSP_AIL = [
  { id: 'cold', icon: '🤧', plan: ['exam', 'drip'], w: 5 },
  { id: 'stomach', icon: '🤢', plan: ['exam', 'vaccine'], w: 4 },
  { id: 'wound', icon: '🩹', plan: ['exam', 'bandage'], w: 4 },
  { id: 'skin', icon: '🐜', plan: ['exam', 'medbath'], w: 3, not: ['bird'] },
  { id: 'fracture', icon: '🦴', plan: ['exam', 'xray', 'bandage', 'rest'], w: 2 },
  { id: 'chill', icon: '🥶', plan: ['exam', 'incubate'], w: 2, only: ['small', 'bird'] },
  { id: 'swallow', icon: '🧸', plan: ['exam', 'xray', 'surgery', 'rest'], w: 1.5, only: ['dog', 'cat'] },
  { id: 'tumor', icon: '🎗️', plan: ['exam', 'ct', 'surgery', 'rest'], w: 1, only: ['dog', 'cat'] },
  { id: 'beak', icon: '🐦', plan: ['exam', 'xray', 'bandage'], w: 2, only: ['bird'] },
];
// hospital staff: the reception clerk does the reception + payment, the doctor the exam / X-ray / CT / surgery, the nurse the treatments
const HOSP_STAFF = [
  { id: 'recept', icon: '🧾', hire: 600, wage: 50, does: ['reg', 'pay'], col: '#90be6d' },
  { id: 'doctor', icon: '🩺', hire: 1500, wage: 120, does: ['exam', 'xray', 'ct', 'surgery'], col: '#7ec8e3' },
  { id: 'nurse', icon: '💉', hire: 900, wage: 70, does: ['drip', 'vaccine', 'bandage', 'medbath', 'incubate', 'rest'], col: '#ef8fa8' },
];
const HOSP_STAFF_MAX = 2, HOSP_STAFF_LV_MAX = 10;
const HOSP_STAFF_DUR = [0, 9, 8, 7, 6, 5, 4.4, 3.8, 3.2, 2.7, 2.2]; // seconds a staff member needs to get to the next patient, by level
const hospStaffRole = id => HOSP_STAFF.find(r => r.id === id);
// v9.96: with two of a role they split the rooms: doctor 1 = exam room, doctor 2 = X-ray / CT / surgery;
// nurse 1 = treatment room (drip, vaccine, bandage), nurse 2 = ward (rest, incubator, medical bath).
// Alone, or when the specialist's room isn't built yet, a staff member does everything the role does.
const HOSP_SPEC = { doctor: [['exam'], ['xray', 'ct', 'surgery']], nurse: [['drip', 'vaccine', 'bandage'], ['rest', 'incubate', 'medbath']] };
const HOSP_SPEC_NAME = { doctor: ['spec_exam', 'spec_surg'], nurse: ['spec_treat', 'spec_ward'] };
function hospSpecOf(hp, m, L) {
  const R = hospStaffRole(m.role); if (!R) return { does: [], k: -1 };
  const same = (hp.staff || []).filter(x => x.role === m.role), k = same.indexOf(m), sp = HOSP_SPEC[m.role];
  if (!sp || same.length < 2 || k < 0 || k > 1) return { does: R.does, k: -1 };
  const kinds = new Set(HOSP_TX.filter(x => sp[k].includes(x.id) && x.stn).map(x => x.stn));
  if (L && !L.stations.some(z => kinds.has(z.k))) return { does: R.does, k: -1 }; // that room isn't there yet
  return { does: sp[k], k };
}
const hospStaffHire = (r, n) => Math.round(r.hire * (1 + n * .6) / 10) * 10;
const hospStaffWage = (r, lv) => Math.round(r.wage * BAL.WAGE_K * STAFF_WAGE_K[lv] / 5) * 5;
const hospStaffUp = (r, lv) => Math.round(r.hire * STAFF_UP_K[lv + 1] / 10) * 10;
const HOSP_SPECIES = ['kitten', 'pomeranian', 'shiba', 'shiba_black', 'shiba_red', 'hamster', 'rabbit', 'maltese', 'maltese_cream', 'maltese_brown', 'corgi', 'budgie', 'persian', 'poodle', 'canary', 'guinea'];
// reception looks: unlocked with the hospital level, bought once, then switch freely
const HOSP_SKINS = [{ id: 0, cost: 0, lv: 1 }, { id: 1, cost: 3000, lv: 2 }, { id: 2, cost: 9000, lv: 3 }, { id: 3, cost: 20000, lv: 4 }];
// dps = rooms the piece may stand in ('lobby' = anywhere outside the rooms). fixed = the room's own equipment (not sold)
const ALLR = ['lobby', 'clinic', 'treat', 'radio', 'surgery', 'ward'];
const HOSP_FURN = [
  { k: 'reception', cat: 'deco', w: 2, d: 1, cost: 0, dps: ['lobby'], fixed: 1 },
  { k: 'cabinet', cat: 'deco', w: 1, d: 1, cost: 0, dps: ALLR, fixed: 1 },
  { k: 'sink', cat: 'deco', w: 1, d: 1, cost: 0, dps: ALLR, fixed: 1 },
  { k: 'monitor', cat: 'deco', w: 1, d: 1, cost: 0, dps: ['radio'], fixed: 1 },
  { k: 'desk', cat: 'deco', w: 1, d: 1, cost: 0, dps: ['clinic'], fixed: 1 },
  { k: 'exam', cat: 'stn', w: 1, d: 1, cost: 400, dps: ['clinic', 'treat'] },
  { k: 'tbed', cat: 'stn', w: 2, d: 1, cost: 500, dps: ['clinic', 'treat'] },
  { k: 'xray', cat: 'stn', w: 1, d: 2, cost: 2500, dps: ['radio'] },
  { k: 'ct', cat: 'stn', w: 2, d: 2, cost: 9000, dps: ['radio'] },
  { k: 'surgery', cat: 'stn', w: 2, d: 1, cost: 4000, dps: ['surgery'] },
  { k: 'bed', cat: 'stn', w: 2, d: 1, cost: 500, dps: ['ward'] },
  { k: 'incubator', cat: 'stn', w: 1, d: 1, cost: 1800, dps: ['ward'] },
  { k: 'medbath', cat: 'stn', w: 2, d: 1, cost: 2200, dps: ['ward'] },
  { k: 'bench', cat: 'deco', w: 3, d: 1, cost: 250, dps: ['lobby'] },
  { k: 'pharmacy', cat: 'deco', w: 1, d: 1, cost: 600, dps: ['clinic', 'treat'], bonus: 1 },
  { k: 'scale', cat: 'deco', w: 1, d: 1, cost: 200, dps: ['clinic', 'treat', 'ward'] },
  { k: 'iv', cat: 'deco', w: 1, d: 1, cost: 150, dps: ['clinic', 'treat', 'surgery', 'ward'] },
  { k: 'sofa', cat: 'deco', w: 1, d: 2, cost: 300, dps: ['lobby'] },
  { k: 'plant', cat: 'deco', w: 1, d: 1, cost: 80, dps: ALLR },
  { k: 'lamp', cat: 'deco', w: 1, d: 1, cost: 120, dps: ALLR },
  { k: 'aquarium', cat: 'deco', w: 1, d: 2, cost: 1200, dps: ['lobby'] },
  { k: 'fountain', cat: 'deco', w: 1, d: 1, cost: 700, dps: ['lobby'] },
  { k: 'vending', cat: 'deco', w: 1, d: 1, cost: 900, dps: ['lobby'] },
  { k: 'part', cat: 'deco', w: 1, d: 1, cost: 120, dps: ['lobby'] }, // a glass partition panel: build your own walls (rotate it in edit mode)
];
const hospFurn = k => HOSP_FURN.find(f => f.k === k);
// the fixed equipment of each room (north wall row); the lobby's sits at the east end by the door
const HOSP_KIT = { lobby: ['cabinet', 'sink', 'reception'], clinic: ['exam', 'desk', 'cabinet'], treat: ['cabinet', 'sink'], radio: ['monitor'], surgery: ['sink', 'cabinet'], ward: ['cabinet', 'sink'] };
const HOSP_SELL_BACK = .5;

// ------------------------------------------------------------------ layout
// Items are stored relative to the hospital's NORTH-EAST corner (x - W, y - (H + 8)) and tagged with the room they stand in
// (dp): that corner follows the shop when the shop is enlarged, and rooms keep their place when the hospital levels up (it grows west).
function hospBuildLayout(hp, Rm, lv) {
  const R = hospRect(Rm.w, Rm.h, lv), ex = R.x, ny = R.y, W_ = R.w, D_ = R.d, rs = hospRoomsAt(lv);
  const solid = new Set(), mark = (x, y, w, d) => { for (let i = 0; i < w; i++) for (let j = 0; j < d; j++) solid.add((x + i) + ',' + (y + j)); };
  const inRect = (x, y) => x >= ex && x < ex + W_ && y >= ny && y < ny + D_;
  // rooms along the north wall, west of the lobby zone; partitions between them + along their south sides, with a 2-tile door in each south side
  const rooms = {}, parts = [], partSet = new Set();
  let cx = R.x1 - HOSP_LOBBY_W;
  const pd = (hp && hp.partsDone) || [];
  const addPart = (x, y, vert) => { const k = x + ',' + y; if (partSet.has(k)) return; partSet.add(k); parts.push({ x, y, vert }); };
  rs.forEach((id, i) => {
    const sp = HOSP_ROOMS[id], x1 = cx, x0 = cx - sp.w, ry1 = ny + sp.d;
    rooms[id] = { id, x0, x1, y0: ny, y1: ry1, w: sp.w, d: sp.d, door: [x0 + 2] };
    if (!pd.includes(id)) {
      // East column partition up to ry1 - 1 (stops flush at south wall corner, does not stick out!)
      for (let y = ny; y < ry1; y++) addPart(x1, y, true);
      // Corner post at (x1, ry1)
      addPart(x1, ry1, true);
      // South side partitions and framed clinic doorway
      for (let x = x0; x < x1; x++) {
        const isDoor = rooms[id].door.includes(x);
        const k = x + ',' + ry1;
        if (!partSet.has(k)) {
          partSet.add(k);
          parts.push({ x, y: ry1, vert: false, doorway: isDoor, room: id });
        }
      }
    }
    cx = x0 - 1;
  });
  for (const q of parts) {
    q.k = 'part'; q.w = 1; q.d = 1;
    if (!q.doorway) mark(q.x, q.y, 1, 1);
  }
  const partsOut = parts.filter(q => q.k);
  const inRoom = (id, x, y) => { const r = rooms[id]; return !!r && x >= r.x0 && x < r.x1 && y >= r.y0 && y < r.y1; };
  const anyRoom = (x, y) => { for (const id in rooms) { const r = rooms[id]; if (x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1) return true; } return false; }; // interior + partitions
  const inRegion = (dp, x, y) => inRect(x, y) && (dp === 'lobby' ? !anyRoom(x, y) : inRoom(dp, x, y));
  const kit = []; let ki = 0;
  const kitDone = (hp && hp.kitDone) || [];
  if (!kitDone.includes('lobby')) { let kx = R.x1; for (const k of HOSP_KIT.lobby) { const F = hospFurn(k); kx -= F.w; if (kx <= R.x1 - HOSP_LOBBY_W) break; const it = { k, id: 'k' + ki++, x: kx, y: ny, w: F.w, d: F.d, solid: true, fixed: true, dp: 'lobby' }; kit.push(it); mark(it.x, it.y, it.w, it.d); } }
  for (const id of rs) { if (kitDone.includes(id)) continue; const r = rooms[id]; let kx = r.x0; for (const k of HOSP_KIT[id] || []) { const F = hospFurn(k); if (kx + F.w > r.x1) break; const it = { k, id: 'k' + ki++, x: kx, y: ny, w: F.w, d: F.d, solid: true, fixed: true, dp: id }; kit.push(it); mark(it.x, it.y, it.w, it.d); kx += F.w; } }
  const items = [];
  for (const it of (hp && hp.items) || []) {
    if (!rooms[it.dp] && it.dp !== 'lobby') continue;
    const F = hospFurn(it.k); if (!F) continue;
    const o = { id: it.id, k: it.k, x: it.x + R.x1, y: it.y + R.y, w: it.r ? F.d : F.w, d: it.r ? F.w : F.d, r: it.r ? 1 : 0, solid: true, cat: F.cat, dp: it.dp, vert: !!it.v };
    mark(o.x, o.y, o.w, o.d); items.push(o);
  }
  // tiles reachable on foot from the entrance on the road side (start: the north-east corner)
  // the walls are solid all round: the only way in is the door in the east wall (two tiles, right beside the reception)
  const door = { x: R.x1, ys: [R.y + 2, R.y + 3] };
  const reach = new Set(), st = [Math.floor(R.x1 + 1), door.ys[0]], stack = [st];
  const okT = (x, y) => x >= ex && x <= R.x1 + 2 && y >= ny && y <= R.y1 + 2 && !solid.has(x + ',' + y);
  const crossOk = (x, y, nx, nyy) => { const a = inRect(x, y), b = inRect(nx, nyy); if (a === b) return true; const ix = a ? x : nx, iy = a ? y : nyy, ox = a ? nx : x, oy = a ? nyy : y; return ix === R.x1 - 1 && ox === R.x1 && iy === oy && door.ys.includes(iy); };
  if (okT(st[0], st[1])) reach.add(st.join(','));
  while (stack.length) { const [x, y] = stack.pop(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, nyy = y + dy, k = nx + ',' + nyy; if (reach.has(k) || !okT(nx, nyy) || !crossOk(x, y, nx, nyy)) continue; reach.add(k); stack.push([nx, nyy]); } }
  const noPlace = new Set(); for (const y of door.ys) for (const x of [R.x1 - 1, R.x1 - 2]) noPlace.add(x + ',' + y);
  const all = kit.concat(items), stations = all.filter(o => HOSP_STN.includes(o.k)), usedSeat = new Set();
  const good = ([ox, oy]) => inRect(ox, oy) && reach.has(ox + ',' + oy);
  for (const b of stations) { // seat (patient) + performer tile (doctor / nurse): free reachable neighbours, front (south / east) sides first
    const opts = [];
    for (let i = 0; i < b.w; i++) opts.push([b.x + i, b.y + b.d]);
    for (let j = 0; j < b.d; j++) opts.push([b.x + b.w, b.y + j]);
    for (let j = 0; j < b.d; j++) opts.push([b.x - 1, b.y + j]);
    for (let i = 0; i < b.w; i++) opts.push([b.x + i, b.y - 1]);
    const s = opts.find(o => good(o) && !usedSeat.has(o.join(','))) || opts.find(good);
    if (s) { b.sx = s[0] + .5; b.sy = s[1] + .5; usedSeat.add(s.join(',')); }
    const p2 = opts.find(o => good(o) && !usedSeat.has(o.join(','))) || s;
    if (p2) { b.px = p2[0] + .5; b.py = p2[1] + .5; usedSeat.add(p2.join(',')); }
  }
  // reception: the queue in front of the desk (lobby side), and the clerk's spot beside it
  const recv = all.find(i => i.k === 'reception');
  let wait = [];
  if (recv) {
    const cxq = recv.x + .5, cyq = recv.y + 1.5;
    wait = [...reach].map(k => k.split(',').map(Number)).filter(([x, y]) => inRect(x, y) && y > recv.y && y <= recv.y + 6 && inRegion('lobby', x, y) && !noPlace.has(x + ',' + y)).sort((a, b) => Math.hypot(a[0] + .5 - cxq, a[1] + .5 - cyq) - Math.hypot(b[0] + .5 - cxq, b[1] + .5 - cyq)).slice(0, 14).map(([x, y]) => ({ x: x + .5, y: y + .5 }));
    recv.px = recv.x - .5; recv.py = recv.y + .5; if (!reach.has(Math.floor(recv.px) + ',' + Math.floor(recv.py))) { recv.px = recv.x + 1.5; recv.py = recv.y + .5; }
    if (wait.length > 1 && Math.floor(wait[0].x) === Math.floor(recv.px) && Math.floor(wait[0].y) === Math.floor(recv.py)) wait.shift();
    recv.sx = wait.length ? wait[0].x : recv.x + .5; recv.sy = wait.length ? wait[0].y : recv.y + 1.5;
  }
  // bench seats: facing outward into the open lobby room (never facing a wall!)
  const seats = [];
  for (const b of items) if (b.k === 'bench') {
    for (let i = 0; i < b.w; i++) {
      const bx = Math.floor(b.x + i);
      const southOk = reach.has(bx + ',' + (b.y + b.d));
      const northOk = reach.has(bx + ',' + (b.y - 1));
      const faceSouth = southOk || !northOk;
      const oy = faceSouth ? b.y + b.d + .2 : b.y - .5;
      const sy = faceSouth ? b.y + .65 : b.y + .35;
      seats.push({
        dep: b.x + b.w + b.y + b.d - 1.02 + .01,
        x: b.x + i + .5,
        y: sy,
        ox: b.x + i + .5,
        oy,
        faceSouth: !!faceSouth,
        bench: b.id
      });
    }
  }
  const has = k => all.some(e => e.k === k);
  return { door, noPlace, rect: R, rooms, roomIds: rs, kit, items, all, stations, parts: partsOut, solid, reach, wait, seats, has, ex, ny, W_, D_, inRect, inRegion,
    reception: recv || { x: ex, y: ny, w: 1, d: 1 }, cabinet: all.find(i => i.k === 'cabinet') || { x: ex, y: ny, w: 1, d: 1 } };
}
function hospLayoutErr(L) {
  for (const b of L.stations) if (b.sx == null) return 'hospBlocked';
  for (const k of L.all) if (hospFurn(k.k) && hospFurn(k.k).fixed && !L.reach.has(k.x + ',' + (k.y + k.d))) return 'hospBlocked';
  for (const o of L.items) if (![[o.x, o.y + o.d], [o.x + o.w - 1, o.y + o.d], [o.x + o.w, o.y], [o.x - 1, o.y], [o.x, o.y - 1]].some(([x, y]) => L.reach.has(x + ',' + y))) return 'hospBlocked';
  if (L.reception && L.wait.length < 1) return 'hospBlocked';
  for (const q of L.seats) if (!L.reach.has(Math.floor(q.ox) + ',' + Math.floor(q.oy))) return 'hospBlocked'; // every bench needs a free tile in front of it
  return null;
}
// can `it` ({id,k,x,y (absolute),dp}) stand there?
function hospCheckPlace(hp, Rm, lv, it) {
  const F0 = hospFurn(it.k); if (!F0) return 'gone';
  const F = it.r ? Object.assign({}, F0, { w: F0.d, d: F0.w }) : F0; // rotated: the footprint is turned
  if (!F.dps.includes(it.dp)) return 'hospWrongFloor';
  const R = hospRect(Rm.w, Rm.h, lv), others = (hp.items || []).filter(o => o.id !== it.id), L0 = hospBuildLayout({ items: others, kitDone: hp.kitDone }, Rm, lv);
  if (it.dp !== 'lobby' && !L0.rooms[it.dp]) return 'hospWrongFloor';
  for (let i = 0; i < F.w; i++) for (let j = 0; j < F.d; j++) {
    const x = it.x + i, y = it.y + j;
    if (x < R.x || x >= R.x + R.w || y < R.y || y >= R.y + R.d) return 'hospOutside';
    if (L0.solid.has(x + ',' + y) || L0.noPlace.has(x + ',' + y)) return 'hospOverlap';
    if (!L0.inRegion(it.dp, x, y) && it.k !== 'part') return 'hospOutside';
  }
  return hospLayoutErr(hospBuildLayout({ items: others.concat([{ id: it.id, k: it.k, dp: it.dp, x: it.x - R.x1, y: it.y - R.y, r: it.r }]), kitDone: hp.kitDone }, Rm, lv));
}
function hospAutoSpot(hp, Rm, lv, k, dp) {
  const F = hospFurn(k), R = hospRect(Rm.w, Rm.h, lv), cand = [];
  const L0 = hospBuildLayout(hp, Rm, lv);
  for (let y = R.y1 - F.d; y >= R.y; y--) for (let x = R.x1 - F.w; x >= R.x; x--) { let ok = true; for (let i = 0; i < F.w && ok; i++) for (let j = 0; j < F.d; j++) if (!L0.inRegion(dp, x + i, y + j)) { ok = false; break; } if (ok) cand.push({ x, y }); }
  for (const air of [true, false]) for (const c of cand) {
    if (air) { let ok = true; for (let i = -1; i <= F.w && ok; i++) for (let j = -1; j <= F.d; j++) if (L0.solid.has((c.x + i) + ',' + (c.y + j))) { ok = false; break; } if (!ok) continue; }
    if (!hospCheckPlace(hp, Rm, lv, { id: -1, k, dp, x: c.x, y: c.y })) return c;
  }
  return null;
}
const _hospLayoutCache = {};
function HOSP_LAYOUT() {
  const hp = S.hosp || {}, lv = hospLv(), Rm = hospRoom(), key = hospAnchor().x1 + 'x' + hospAnchor().y + '|' + lv + '|' + (hp.iv | 0) + '|' + ((hp.items || []).length);
  if (_hospLayoutCache.key === key && _hospLayoutCache.arr === hp.items) return _hospLayoutCache.v;
  const L = hospBuildLayout(hp, Rm, lv);
  _hospLayoutCache.key = key; _hospLayoutCache.arr = hp.items; _hospLayoutCache.v = L;
  return L;
}
// every station: { key, it }
const hospStations = () => HOSP_LAYOUT().stations.map(it => ({ key: String(it.id), it }));
const hospTxAvail = () => { const kinds = new Set(HOSP_LAYOUT().stations.filter(s => s.sx != null).map(s => s.k)); return HOSP_TX.filter(x => x.stn && kinds.has(x.stn)); };
const hospPharmBonus = () => 1 + Math.min(.25, .05 * HOSP_LAYOUT().items.filter(i => i.k === 'pharmacy').length);
const hospTxFee = (tx, q) => Math.round(tx.fee * (1 + .25 * (hospLv() - 1)) * (q || 1) * hospPharmBonus());

const HOSP = (() => {
  let H = null;
  function init(h) { H = h; }
  const roomOf = s => ({ w: (s.room && s.room.w) || 8, h: (s.room && s.room.h) || 8 });
  const lvNow = hp => hospLvOf(hp.lv);
  // put every piece back on a legal spot (after the shop / hospital changed): same place if it still fits, else the next free one, else refunded
  function relocateAll(s, hp) {
    const Rm = roomOf(s), lv = lvNow(hp), old = hp.items || [], R = hospRect(Rm.w, Rm.h, lv);
    hp.items = []; hp.iv = (hp.iv | 0) + 1;
    for (const it of old) {
      const F = hospFurn(it.k); if (!F) continue;
      let dp = F.dps.includes(it.dp) ? it.dp : F.dps[0];
      const same = { id: it.id, k: it.k, dp, x: it.x + R.x1, y: it.y + R.y };
      if (!hospCheckPlace(hp, Rm, lv, same)) { hp.items.push({ id: it.id, k: it.k, dp, x: it.x, y: it.y, v: it.v, r: it.r }); continue; }
      const p = hospAutoSpot(hp, Rm, lv, it.k, dp);
      if (p) hp.items.push({ id: it.id, k: it.k, dp, x: p.x - R.x1, y: p.y - R.y, v: it.v, r: it.r }); else s.coins += F.cost;
    }
    hp.iv = (hp.iv | 0) + 1;
  }
  function grantBase(s, hp) { // Lv1 comes with two lobby benches and one treatment bed (nothing else is given later)
    if (hp.baseGiven2) return; hp.baseGiven2 = 1;
    const Rm = roomOf(s), lv = lvNow(hp), R = hospRect(Rm.w, Rm.h, lv);
    for (const [k, dp, n] of [['bench', 'lobby', 2], ['tbed', 'clinic', 1]]) { const have = hp.items.filter(i => i.k === k).length; for (let i = have; i < n; i++) { const p = hospAutoSpot(hp, Rm, lv, k, dp); if (p) { hp.items.push({ id: hp.iseq++, k, dp, x: p.x - R.x1, y: p.y - R.y }); hp.iv = (hp.iv | 0) + 1; } } }
  }
  // the rooms' built-in equipment (reception, sink, cabinets, desk ...) becomes ordinary stored pieces, so it can be moved like everything else
  function grantKit(s, hp) {
    const Rm = roomOf(s), lv = lvNow(hp), R = hospRect(Rm.w, Rm.h, lv), L = hospBuildLayout(hp, Rm, lv);
    if (!L.kit.length) return;
    hp.kitIds = hp.kitIds || [];
    for (const it of L.kit) { const id = hp.iseq++; hp.kitIds.push(id); hp.items.push({ id, k: it.k, dp: it.dp, x: it.x - R.x1, y: it.y - R.y }); }
    hp.kitDone = ['lobby'].concat(hospRoomsAt(lv)); hp.iv = (hp.iv | 0) + 1;
  }
  // the glass partitions between the rooms become ordinary stored pieces as well (movable, sellable, more can be bought)
  function grantParts(s, hp) {
    const Rm = roomOf(s), lv = lvNow(hp), R = hospRect(Rm.w, Rm.h, lv), L = hospBuildLayout(hp, Rm, lv);
    for (const q of L.parts) hp.items.push({ id: hp.iseq++, k: 'part', dp: 'lobby', x: q.x - R.x1, y: q.y - R.y, v: q.vert ? 1 : 0 });
    hp.partsDone = hospRoomsAt(lv).slice(); hp.iv = (hp.iv | 0) + 1;
  }
  function ensure(s) {
    if (!s.hosp) s.hosp = { built: false, lv: 1, patients: [], seq: 1, spawnT: 0, treated: 0 };
    const hp = s.hosp;
    if (!hp.lv) hp.lv = 1; if (!hp.patients) hp.patients = []; if (!hp.seq) hp.seq = 1; if (hp.spawnT == null) hp.spawnT = 0; if (hp.treated == null) hp.treated = 0; if (!hp.staff) hp.staff = []; if (!hp.sseq) hp.sseq = 1;
    if (!hp.skins) hp.skins = { 0: 1 }; if (hp.skin == null) hp.skin = 0;
    if (hp.built) {
      if (!hp.items) { hp.items = []; hp.iseq = 1; hp.iv = 1; }
      // older hospitals were multi-storey: rooms = departments now, the layout changed completely -> re-place everything, drop old patients
      if (!hp.v6) { hp.v6 = 1; hp.patients = []; hp.items.forEach(it => { delete it.fl; if (!hospFurn(it.k)) it.k = null; }); hp.items = hp.items.filter(it => it.k); hp.items.forEach(it => { const F = hospFurn(it.k); if (!F.dps.includes(it.dp)) it.dp = F.dps[0]; }); relocateAll(s, hp); }
      if (!hp.v7) { hp.v7 = 1; relocateAll(s, hp); } // benches now need a free tile in front of them (none may sit against the south wall)
      grantBase(s, hp);
      if (!hp.kitDone || hospRoomsAt(lvNow(hp)).some(r => !hp.kitDone.includes(r))) grantKit(s, hp);
      if (!hp.partsDone || hospRoomsAt(lvNow(hp)).some(r => !hp.partsDone.includes(r))) grantParts(s, hp);
    }
    return hp;
  }
  const species = sp => (typeof SPECIES !== 'undefined' && SPECIES[sp] && SPECIES[sp].cat) || 'dog';
  function newPatient(s, hp) {
    const avail = new Set(hospTxAvail().map(x => x.id)), sp = HOSP_SPECIES[Math.floor(Math.random() * HOSP_SPECIES.length)], grp = species(sp);
    const opts = HOSP_AIL.filter(a => (!a.only || a.only.includes(grp)) && (!a.not || !a.not.includes(grp)) && a.plan.every(x => avail.has(x)));
    let tot = 0; opts.forEach(a => tot += a.w); let r = Math.random() * tot, ail = opts[0] || HOSP_AIL[0];
    for (const a of opts) { r -= a.w; if (r <= 0) { ail = a; break; } }
    const plan = opts.length ? ail.plan.slice() : ['exam'];
    return { id: hp.seq++, seed: 1 + Math.floor(Math.random() * 1e6), sp, ail: ail.id, plan, k: -1, ph: 'walkin', tm: 14, stn: null, bill: 0, q: 1, qt: 0, rv: .6 + Math.random() * 1.1, pv: .6 + Math.random() * .9, dv: plan.map(() => .6 + Math.random() * .95) };
  }
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  // which station (by key) a patient at `from` should use for this kind: a free one (nobody reserved it)
  const freeStation = (hp, kind) => hospStations().find(x => x.it.k === kind && x.it.sx != null && !hp.patients.some(q => q.stn === x.key));
  // after a step: register / exam / treatment done -> what next? (walk to the next room, or sit down and wait, or go pay)
  function nextStep(s, hp, p, L, from) {
    const st = hospStage(p), desk = L.wait[0] || { x: L.reception.x, y: L.reception.y };
    if (st === 'pay') { p.ph = 'toDesk'; p.tm = 1 + dist(from || desk, desk) / 2.2; p.stn = null; return; } // walk back to the reception to pay
    p.ph = 'bench'; p.qt = hp.clock; p.stn = null; // sit on a lobby bench (the loop in tick() hands out free rooms in queue order)
  }
  const stationPos = (L, key) => { const x = L.stations.find(q => String(q.id) === key); return x ? { x: x.sx, y: x.sy } : L.wait[0] || { x: L.reception.x, y: L.reception.y }; };
  function finishStage(s, hp, p, L) {
    const st = hospStage(p), tx = hospTx(st);
    if (st === 'pay') { const c = Math.round(p.bill); s.coins += c; H.addXp(s, 4); p.paid = c; p.ph = 'leaving'; p.tm = 14; p.stn = null; hp.treated++; if (typeof TOWN !== 'undefined') TOWN.mood(s, .6); if (H.addRep) H.addRep(s, 1); return; }
    p.bill += st === 'reg' ? hospTxFee(tx, 1) : hospTxFee(tx, tx.mini ? p.q : 1); H.addXp(s, tx.mini ? 8 : 3);
    const from = p.stn ? stationPos(L, p.stn) : null; p.k++; p.stn = null; nextStep(s, hp, p, L, from);
  }
  function tick(s, dt) {
    const hp = ensure(s); if (!hp.built) return;
    hp.clock = (hp.clock || 0) + dt;
    const L = HOSP_LAYOUT(), keys = new Set(L.stations.map(x => String(x.id)));
    for (const p of hp.patients) {
      if (p.stn && !keys.has(p.stn)) { p.stn = null; if (p.ph === 'toStn' || p.ph === 'atStn' || p.ph === 'treat') nextStep(s, hp, p, L, null); } // its room's equipment was sold
      p.tm = (p.tm || 0) - dt;
      switch (p.ph) {
        case 'walkin': if (p.tm <= 0) { if (p.full) { p.ph = 'full'; p.tm = 3.5; } else p.ph = 'deskwait'; } break; // p.full: the benches are taken -> look in, say so, leave
        case 'full': if (p.tm <= 0) { p.ph = 'leaving'; p.tm = 14; p.turned = 1; if (typeof TOWN !== 'undefined') TOWN.mood(s, -.8, 'hosp'); } break; // PET TOWN: turned away
        case 'deskserve': if (p.tm <= 0) finishStage(s, hp, p, L); break;
        case 'toDesk': if (p.tm <= 0) p.ph = 'deskwait'; break;
        case 'toStn': if (p.tm <= 0) p.ph = 'atStn'; break;
        case 'treat': if (p.tm <= 0) finishStage(s, hp, p, L); break;
        case 'leaving': if (p.tm <= 0) p.gone = 1; break;
      }
    }
    hp.patients = hp.patients.filter(p => !p.gone);
    // the lobby's queue: patients sitting on the benches go to a free room in the order they sat down
    for (const p of hp.patients.filter(x => x.ph === 'bench').sort((a, b) => a.qt - b.qt)) {
      const tx = hospTx(hospStage(p)); if (!tx || !tx.stn) continue;
      const free = freeStation(hp, tx.stn);
      if (free) { p.stn = free.key; p.ph = 'toStn'; const from = L.seats[0] || L.wait[0] || { x: L.reception.x, y: L.reception.y }, to = { x: free.it.sx, y: free.it.sy }; p.tm = 1.5 + dist(from, to) / 2.2; }
    }
    staffWork(s, hp, dt);
    // new patients: a few at a time, only while there's a reception + at least one treatment room to send them to
    const away = q => q.ph === 'leaving' || q.ph === 'full' || q.full;
    const inside = hp.patients.filter(q => !away(q)), seatsN = L.seats.length;
    // people who still need a bench (not already in a room): when they'd outnumber the seats, the next visitor is turned away
    const needSeat = inside.filter(q => !(q.ph === 'toStn' || q.ph === 'atStn' || q.ph === 'treat')).length;
    if (!G.isOpen(s)) return; // v9.74: the hospital keeps the pet shop's hours -- patients inside are still treated
    if (inside.length >= seatsN + L.stations.length + 2) return;
    hp.spawnT -= dt;
    if (hp.spawnT > 0) return;
    if (!hospTxAvail().length || !L.wait.length) { hp.spawnT = 10; return; }
    if (needSeat >= seatsN && hp.patients.filter(q => q.full).length >= 2) { hp.spawnT = 6; return; }
    const np = newPatient(s, hp); if (needSeat >= seatsN) np.full = 1;
    hp.patients.push(np);
    hp.spawnT = 20 + Math.random() * 28;
  }
  // someone starts serving a patient: the clerk at the desk, the doctor / nurse at the room. `by` is 'me' or a staff id.
  function serve(s, hp, p, by, q) {
    if (p.ph !== 'deskwait' && p.ph !== 'atStn') return false;
    const st = hospStage(p), tx = hospTx(st);
    p.by = by; p.q = tx.mini ? Math.max(.7, Math.min(1.5, +q || 1)) : 1;
    p.ph = st === 'reg' || st === 'pay' ? 'deskserve' : 'treat'; p.tdur = Math.round(tx.dur * hospDurK(p, st) * 10) / 10; p.tm = p.tdur;
    return true;
  }
  const stageReady = p => p.ph === 'deskwait' || p.ph === 'atStn';
  function staffWork(s, hp, dt) {
    const L = HOSP_LAYOUT();
    for (const m of hp.staff) {
      m.t = (m.t == null ? 3 : m.t) - dt; if (m.tt > 0) { m.tt -= dt; continue; } // v9.93: busy with a patient -> the next free colleague takes the next one
      if (m.t > 0) continue;
      const role = hospStaffRole(m.role); if (!role) continue;
      const sp = hospSpecOf(hp, m, L), ready = x => (x.ph === 'deskwait' || x.ph === 'atStn') && role.does.includes(hospStage(x));
      const p = hp.patients.find(x => ready(x) && sp.does.includes(hospStage(x)) && (x.wt || 0) >= 2) || hp.patients.find(x => ready(x) && (x.wt || 0) >= 7); // own room first; helps the colleague when a patient has waited long
      if (p) { serve(s, hp, p, 'm' + m.id, 1); m.pid = p.id; m.tt = p.tdur; m.done = (m.done | 0) + 1; m.t = Math.max(0, (HOSP_STAFF_DUR[m.lv] || 6) - p.tdur); }
      else m.t = .8;
    }
    for (const p of hp.patients) if (p.ph === 'deskwait' || p.ph === 'atStn') p.wt = (p.wt || 0) + dt; else p.wt = 0;
  }
  const wagesOf = hp => ((hp && hp.staff) || []).reduce((a, m) => a + hospStaffWage(hospStaffRole(m.role) || HOSP_STAFF[0], m.lv), 0);
  const pickName = s => { const L = (typeof NAMES !== 'undefined' && (NAMES[s.lang || 'ko'] || NAMES.ko)) || ['?']; return L[Math.floor(Math.random() * L.length)]; };
  const countOf = (hp, k) => hp.items.filter(i => i.k === k && !(hp.kitIds || []).includes(i.id)).length; // the room's own starting equipment doesn't count against the purchase limit
  function apply(s, a, by) {
    if (!a.t || a.t.slice(0, 4) !== 'hosp' && a.t !== 'buildhosp') return undefined;
    const hp = ensure(s), Rm = roomOf(s);
    if (a.t === 'buildhosp') {
      if (!(s.lay && s.lay.hosp)) return { err: 'tUseBuildMenu' }; // PET TOWN: only from the build menu, after choosing the spot
      if (hp.built) return { err: 'gone' };
      if (repTier(s.rep) < HOSP_UNLOCK_TIER) return { err: 'hospNeedRep' };
      if (s.coins < HOSP_BUILD_COST) return { err: 'notEnough' };
      s.coins -= HOSP_BUILD_COST; hp.built = true; hp.spawnT = 8; hp.items = []; hp.iseq = 1; hp.iv = 1; hp.v6 = 1; grantBase(s, hp);
      if (typeof TOWN !== 'undefined' && TOWN.fitShop) TOWN.fitShop(s);
      return { ok: 1, fx: 'coin', msg: 'hospBuilt' };
    }
    if (!hp.built) return { err: 'gone' };
    if (a.t === 'hospup') {
      const nx = HOSP_LV[hp.lv + 1]; if (!nx) return { err: 'gone' };
      if (s.level < nx.ulv) return { err: 'homeNeedPlayer', p: { n: nx.ulv } };
      if (s.coins < nx.cost) return { err: 'notEnough' };
      s.coins -= nx.cost; hp.lv++; H.addXp(s, 40);
      relocateAll(s, hp); hp.patients = [];
      if (typeof TOWN !== 'undefined' && TOWN.fitShop) TOWN.fitShop(s);
      return { ok: 1, fx: 'coin', msg: 'hospUpOk', p: { n: hp.lv } };
    }
    if (a.t === 'hospbuy') {
      const F = hospFurn(a.k); if (!F || F.fixed) return { err: 'gone' };
      const lv = lvNow(hp), cap = hospCap(lv, F.k);
      if (HOSP_CAPPED.includes(F.k)) {
        if (!cap) return { err: 'hospNeedLv', p: { n: HOSP_LV.findIndex((z, i) => i && z.cap && z.cap[F.k] > 0) } };
        if (countOf(hp, F.k) >= cap) return { err: 'hospCapFull', p: { n: cap } };
      }
      if (s.coins < F.cost) return { err: 'notEnough' };
      const L0 = hospBuildLayout(hp, Rm, lv), dps = F.dps.filter(d => d === 'lobby' || L0.rooms[d]);
      const pref = dps.slice(); if (a.dp && pref.includes(a.dp)) pref.unshift(a.dp);
      let p = null, dp = null; for (const d of pref) { p = hospAutoSpot(hp, Rm, lv, F.k, d); if (p) { dp = d; break; } }
      if (!p) return { err: 'hospNoRoom' };
      const R = hospRect(Rm.w, Rm.h, lv); s.coins -= F.cost; const it = { id: hp.iseq++, k: F.k, dp, x: p.x - R.x1, y: p.y - R.y }; hp.items.push(it); hp.iv = (hp.iv | 0) + 1;
      return { ok: 1, fx: 'coin', msg: 'hospBought', hplace: it.id };
    }
    if (a.t === 'hospmove') {
      const it = hp.items.find(x => x.id === a.iid); if (!it) return { err: 'gone' };
      const F = hospFurn(it.k), L0 = hospBuildLayout(hp, Rm, lvNow(hp));
      // moving into another room of the same kind of use is allowed: work out the room from the target tile
      let dp = it.dp; for (const d of F.dps) if (L0.inRegion(d, a.x, a.y)) { dp = d; break; }
      const err = hospCheckPlace(hp, Rm, lvNow(hp), { id: it.id, k: it.k, dp, x: a.x, y: a.y, r: it.r }); if (err) return { err };
      const R = hospRect(Rm.w, Rm.h, lvNow(hp)); it.x = a.x - R.x1; it.y = a.y - R.y; it.dp = dp; hp.iv = (hp.iv | 0) + 1;
      return { ok: 1, fx: 'place' };
    }
    if (a.t === 'hosprot') { const it = hp.items.find(x => x.id === a.iid); if (!it) return { err: 'gone' };
      if (it.k === 'part') { it.v = it.v ? 0 : 1; hp.iv = (hp.iv | 0) + 1; return { ok: 1, fx: 'place' }; }
      const r0 = it.r, R0 = hospRect(Rm.w, Rm.h, lvNow(hp)); it.r = r0 ? 0 : 1;
      let err = hospCheckPlace(hp, Rm, lvNow(hp), { id: it.id, k: it.k, dp: it.dp, x: it.x + R0.x1, y: it.y + R0.y, r: it.r });
      for (const [dx, dy] of [[-1, 0], [0, -1], [1, 0], [0, 1], [-1, -1], [1, 1], [-1, 1], [1, -1], [-2, 0], [0, -2], [2, 0], [0, 2]]) { if (!err) break; err = hospCheckPlace(hp, Rm, lvNow(hp), { id: it.id, k: it.k, dp: it.dp, x: it.x + R0.x1 + dx, y: it.y + R0.y + dy, r: it.r }); if (!err) { it.x += dx; it.y += dy; } }
      if (err) { it.r = r0; return { err }; }
      hp.iv = (hp.iv | 0) + 1; return { ok: 1, fx: 'place' }; }
    if (a.t === 'hospsell') {
      const i = hp.items.findIndex(x => x.id === a.iid); if (i < 0) return { err: 'gone' };
      const it = hp.items[i], F = hospFurn(it.k);
      if (F && F.fixed) return { err: 'hospFixedKeep' };
      hp.items.splice(i, 1); hp.iv = (hp.iv | 0) + 1;
      const back = Math.floor(F.cost * HOSP_SELL_BACK); s.coins += back;
      return { ok: 1, fx: 'coin', msg: 'hospSold', p: { c: back } };
    }
    if (a.t === 'hospserve') { // the player serves a patient (reception, exam, treatment, payment) -- the patient has to be there already
      const p = hp.patients.find(x => x.id === a.pid); if (!p) return { err: 'gone' };
      if (!(p.ph === 'deskwait' || p.ph === 'atStn')) return { err: 'hospWaiting' };
      serve(s, hp, p, 'me', a.q);
      return { ok: 1, fx: 'place' };
    }
    if (a.t === 'hospskin') {
      const sk = HOSP_SKINS.find(z => z.id === a.id); if (!sk) return { err: 'gone' };
      if (sk.lv > lvNow(hp)) return { err: 'hospNeedLv', p: { n: sk.lv } };
      if (!hp.skins[sk.id]) { if (s.coins < sk.cost) return { err: 'notEnough' }; s.coins -= sk.cost; hp.skins[sk.id] = 1; }
      hp.skin = sk.id; hp.iv = (hp.iv | 0) + 1; return { ok: 1, fx: 'place' };
    }
    if (a.t === 'hosphire') {
      const r = hospStaffRole(a.role); if (!r) return { err: 'gone' };
      const n = hp.staff.filter(m => m.role === r.id).length; if (n >= HOSP_STAFF_MAX) return { err: 'gone' };
      const cost = hospStaffHire(r, n); if (s.coins < cost) return { err: 'notEnough' };
      s.coins -= cost; hp.staff.push({ id: hp.sseq++, role: r.id, lv: 1, seed: 1 + Math.floor(Math.random() * 99999), name: uniqueStaffName(s), t: 3, done: 0 });
      return { ok: 1, fx: 'coin', msg: 'hospHired' };
    }
    if (a.t === 'hospstaffup') {
      const m = hp.staff.find(x => x.id === a.sid); if (!m || m.lv >= HOSP_STAFF_LV_MAX) return { err: 'gone' };
      const cost = hospStaffUp(hospStaffRole(m.role), m.lv); if (s.coins < cost) return { err: 'notEnough' };
      s.coins -= cost; m.lv++; return { ok: 1, fx: 'coin', msg: 'hospStaffUp', p: { n: m.lv } };
    }
    if (a.t === 'hospfire') { const i = hp.staff.findIndex(x => x.id === a.sid); if (i < 0) return { err: 'gone' }; hp.staff.splice(i, 1); return { ok: 1, msg: 'fired' }; }
    return undefined;
  }
  return { init, ensure, tick, apply, wagesOf };
})();
