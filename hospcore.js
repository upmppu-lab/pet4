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
  { cost: 40000, ulv: 10, rooms: ['clinic', 'treat', 'radio'], cap: { bench: 4, tbed: 1, exam: 1, xray: 1 }, skin: 2 },
  { cost: 120000, ulv: 18, rooms: ['clinic', 'treat', 'radio', 'surgery'], cap: { bench: 8, tbed: 1, exam: 2, xray: 1, ct: 1, surgery: 1 }, skin: 3 },
  { cost: 300000, ulv: 26, rooms: ['clinic', 'treat', 'radio', 'surgery', 'ward'], cap: { bench: 8, tbed: 1, exam: 3, xray: 2, ct: 1, surgery: 2, bed: 3, incubator: 1, medbath: 1 }, skin: 4 },
];
HOSP_LV.forEach(l => { if (l) l.cost = balCost(l.cost); });
const HOSP_MAX = HOSP_LV.length - 1;
const HOSP_ROOMS = { clinic: { w: 4, d: 5, icon: '🩺' }, treat: { w: 5, d: 5, icon: '💉' }, radio: { w: 5, d: 5, icon: '🩻' }, surgery: { w: 4, d: 5, icon: '🏥' }, ward: { w: 5, d: 5, icon: '🛏️' } };
const HOSP_LOBBY_W = 6;
const hospLvOf = lv => Math.min(HOSP_MAX, Math.max(1, lv || 1));
const hospLv = s => { const st = s || (typeof S !== 'undefined' && S); return hospLvOf(st && st.hosp && st.hosp.lv); };
const hospRoomsAt = lv => HOSP_LV[hospLvOf(lv)].rooms;
const hospCap = (lv, k) => (HOSP_LV[hospLvOf(lv)].cap || {})[k];
const hospRoom = s => { const st = s || (typeof S !== 'undefined' && S); return { w: (st && st.room && st.room.w) || 8, h: (st && st.room && st.room.h) || 8 }; };
// width = lobby zone + all department rooms; depth = uniform room depth (5) + 5-row lobby/corridor strip
const hospDims = lv => { const rs = hospRoomsAt(lv); let w = HOSP_LOBBY_W; for (const r of rs) { w += HOSP_ROOMS[r].w; } return { w, d: 5 + 5 + 3 * (hospLvOf(lv) - 1) }; }; // each level also adds 3 rows to the south, so the building grows west AND south
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
  { id: 'reg', icon: '🛎️', stn: null, fee: 40, dur: 4.5 },
  { id: 'exam', icon: '🩺', stn: 'exam', fee: 100, dur: 10 },
  { id: 'drip', icon: '💧', stn: 'tbed', fee: 160, dur: 12 },
  { id: 'vaccine', icon: '💉', stn: 'tbed', fee: 200, dur: 8 },
  { id: 'bandage', icon: '🩹', stn: 'tbed', fee: 260, dur: 10 },
  { id: 'xray', icon: '🩻', stn: 'xray', fee: 520, mini: 1, dur: 14 },
  { id: 'ct', icon: '🧲', stn: 'ct', fee: 900, mini: 1, dur: 18 },
  { id: 'surgery', icon: '🏥', stn: 'surgery', fee: 1800, mini: 1, dur: 24 },
  { id: 'medbath', icon: '🛁', stn: 'medbath', fee: 900, dur: 15 },
  { id: 'incubate', icon: '🌡️', stn: 'incubator', fee: 700, dur: 18 },
  { id: 'rest', icon: '🛏️', stn: 'bed', fee: 300, dur: 18 },
  { id: 'route', icon: '🗒️', stn: null, fee: 0, dur: 3 }, // v2026-10-17: 진료/치료 한 단계가 끝난 뒤 접수대에서 다음 안내를 받는 단계
  { id: 'pay', icon: '🧾', stn: null, fee: 0, dur: 3.5 },
];
const hospTx = id => HOSP_TX.find(x => x.id === id);
// how long a step really takes for THIS patient: the illness sets how serious it is (a cold is quick, a tumour is not)
const HOSP_SEV = { checkup: .7, cold: .8, stomach: 1.1, wound: 1.2, skin: 1.25, beak: 1.4, chill: 1.5, fracture: 2.0, swallow: 2.4, tumor: 2.6 };
const hospDurK = (p, st) => st === 'reg' || st === 'route' ? (p.rv || 1) : st === 'pay' ? (p.pv || 1) : (HOSP_SEV[p.ail] || 1) * ((p.dv || [])[p.k] || 1);
const HOSP_CAPPED = ['bench', 'tbed', 'exam', 'xray', 'ct', 'surgery', 'bed', 'incubator', 'medbath'];
const HOSP_STN = ['exam', 'tbed', 'xray', 'ct', 'surgery', 'bed', 'incubator', 'medbath'];
// the step a patient is at: 'reg' before anything, then plan[k], then 'pay'
const hospStage = p => p.k < 0 ? 'reg' : p.k >= p.plan.length ? 'pay' : (p.routing ? 'route' : p.plan[p.k]); // v2026-10-17: 단계 사이에는 접수대로 돌아가 '안내'를 받음
// patient phases (what the patient is physically doing)
//   walkin -> deskwait (at the reception, waiting to be served) -> deskserve (talking with the clerk)
//   bench (sitting in the lobby waiting for a free room) -> toStn (walking there) -> atStn (waiting for the doctor/nurse)
//   -> treat (being treated) ... -> deskwait/deskserve for the payment -> leaving
const HOSP_AIL = [
  { id: 'checkup', icon: '🩺', plan: ['exam'], w: 4 }, // 가벼운 건강검진: 진료실 진료 후 바로 수납 및 귀가
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
  { id: 'recept', icon: '🧾', hire: 600, wage: 50, does: ['reg', 'route', 'pay'], col: '#90be6d' },
  { id: 'doctor', icon: '🩺', hire: 1500, wage: 120, does: ['exam', 'xray', 'ct', 'surgery'], col: '#7ec8e3' },
  { id: 'nurse', icon: '💉', hire: 900, wage: 70, does: ['drip', 'vaccine', 'bandage', 'medbath', 'incubate', 'rest'], col: '#ef8fa8' },
];
const HOSP_STAFF_MAX = 10, HOSP_STAFF_LV_MAX = 10;
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
  if (!sp || same.length < 2 || k < 0) return { does: R.does, k: -1 };
  // v2026-10-17: 예전엔 반반(k%2)으로만 나눠서 방마다 설비 개수가 다르면 한쪽 방에 인원이 몰렸음(예: 의사 3명 중 2명이 진료실로).
  // 이제 각 그룹의 실제 설치된 장비(station) 수 대비 배정 인원 비율이 가장 낮은 그룹부터 순서대로 채운다.
  const capOf = idx => { const kinds0 = new Set(HOSP_TX.filter(x => sp[idx].includes(x.id) && x.stn).map(x => x.stn)); return (L && L.stations) ? L.stations.filter(z => kinds0.has(z.k)).length : 0; };
  const caps = sp.map((_, i) => capOf(i)), assigned = caps.map(() => 0);
  let specIdx = 0;
  for (let i = 0; i <= k; i++) {
    let best = 0, bestLoad = Infinity;
    for (let g = 0; g < sp.length; g++) {
      if (!caps[g]) continue; // 그 방 장비가 아직 없으면 배정하지 않음
      const load = assigned[g] / caps[g];
      if (load < bestLoad - 1e-9) { bestLoad = load; best = g; }
    }
    specIdx = best; assigned[best]++;
  }
  if (!caps[specIdx]) return { does: R.does, k: -1 }; // 어느 그룹도 설비가 없으면 혼자일 때처럼 전부 담당
  return { does: sp[specIdx], k: specIdx };
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
];
const hospFurn = k => HOSP_FURN.find(f => f.k === k);
// the fixed equipment of each room (north wall row); the lobby's sits at the east end by the door
const HOSP_KIT = {
  lobby: ['reception'],
  clinic: ['exam', 'desk', 'cabinet', 'tbed'],
  treat: ['cabinet', 'sink', 'tbed'],
  radio: ['ct', 'xray', 'monitor'],
  surgery: ['cabinet', 'sink', 'surgery'],
  ward: ['incubator', 'medbath', 'bed', 'bed', 'bed']
};
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
  const addPart = (x, y, vert) => { const k = x + ',' + y; if (partSet.has(k)) return; partSet.add(k); parts.push({ x, y, vert }); };
  rs.forEach((id, i) => {
    const sp = HOSP_ROOMS[id], x1 = cx, x0 = cx - sp.w, ry1 = ny + sp.d;
    rooms[id] = { id, x0, x1, y0: ny, y1: ry1, w: sp.w, d: sp.d, door: [x0 + 2] };
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
    cx = x0;
  });
  // Note: Redundant west outer wall partition loop removed per user request (the outer wall is already drawn by drawHospWalls)
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
  if (!kitDone.includes('lobby')) {
    // Reception desk placed so clerk can enter behind it (no cabinet/sink beside it)
    const F = hospFurn('reception');
    const it = { k: 'reception', id: 'k' + ki++, x: R.x1 - 3, y: ny + 1, w: F.w, d: F.d, solid: true, fixed: true, dp: 'lobby' };
    kit.push(it);
    mark(it.x, it.y, it.w, it.d);
  }
  for (const id of rs) {
    if (kitDone.includes(id)) continue;
    const r = rooms[id];
    if (id === 'ward') {
      // User specification: 침대 3개 (서쪽벽 1개, 동쪽벽 2개 간격 배치), 인큐베이터 & 약욕조는 북쪽벽
      const wardItems = [
        { k: 'incubator', x: r.x0 + 1, y: ny, w: 1, d: 1 },
        { k: 'medbath', x: r.x0 + 2, y: ny, w: 2, d: 1 },
        { k: 'bed', x: r.x0 + 1, y: ny + 2, w: 2, d: 1 }, // 서쪽벽 1개
        { k: 'bed', x: r.x1 - 2, y: ny + 1, w: 2, d: 1 }, // 동쪽벽 1개 (북)
        { k: 'bed', x: r.x1 - 2, y: ny + 3, w: 2, d: 1 }, // 동쪽벽 1개 (남, 1칸 간격)
      ];
      for (const wIt of wardItems) {
        const it = { k: wIt.k, id: 'k' + ki++, x: wIt.x, y: wIt.y, w: wIt.w, d: wIt.d, solid: true, fixed: true, dp: 'ward' };
        kit.push(it);
        mark(it.x, it.y, it.w, it.d);
      }
    } else if (id === 'clinic') {
      // 진료실: exam, desk, cabinet 북쪽벽 정렬, 처치 침대(tbed) 1개만 아래쪽(y: ny + 3)에 배치 (위쪽 침대 삭제)
      const clinicItems = [
        { k: 'exam', x: r.x0 + 1, y: ny, w: 1, d: 1 },
        { k: 'desk', x: r.x0 + 2, y: ny, w: 1, d: 1 },
        { k: 'cabinet', x: r.x0 + 3, y: ny, w: 1, d: 1 },
        { k: 'tbed', x: r.x0 + 1, y: ny + 3, w: 2, d: 1 },
      ];
      for (const cIt of clinicItems) {
        const it = { k: cIt.k, id: 'k' + ki++, x: cIt.x, y: cIt.y, w: cIt.w, d: cIt.d, solid: true, fixed: true, dp: 'clinic' };
        kit.push(it);
        mark(it.x, it.y, it.w, it.d);
      }
    } else if (id === 'treat') {
      // 치료실: 진열대(cabinet x: r.x0+1) 벽 끼임 완벽 방지, 세면대(sink), 처치 침대(tbed) 1개만 아래쪽(y: ny + 3)에 배치 (위쪽 침대 삭제)
      const treatItems = [
        { k: 'cabinet', x: r.x0 + 1, y: ny, w: 1, d: 1 },
        { k: 'sink', x: r.x0 + 3, y: ny, w: 1, d: 1 },
        { k: 'tbed', x: r.x0 + 1, y: ny + 3, w: 2, d: 1 },
      ];
      for (const tIt of treatItems) {
        const it = { k: tIt.k, id: 'k' + ki++, x: tIt.x, y: tIt.y, w: tIt.w, d: tIt.d, solid: true, fixed: true, dp: 'treat' };
        kit.push(it);
        mark(it.x, it.y, it.w, it.d);
      }
    } else if (id === 'surgery') {
      // 수술실: 캐비닛(cabinet), 세면대(sink), 수술대(surgery) 중앙(x: r.x0 + 1, y: ny + 2) 정중앙 배치
      const surgItems = [
        { k: 'cabinet', x: r.x0 + 1, y: ny, w: 1, d: 1 },
        { k: 'sink', x: r.x0 + 3, y: ny, w: 1, d: 1 },
        { k: 'surgery', x: r.x0 + 1, y: ny + 2, w: 2, d: 1 },
      ];
      for (const sIt of surgItems) {
        const it = { k: sIt.k, id: 'k' + ki++, x: sIt.x, y: sIt.y, w: sIt.w, d: sIt.d, solid: true, fixed: true, dp: 'surgery' };
        kit.push(it);
        mark(it.x, it.y, it.w, it.d);
      }
    } else if (id === 'radio') {
      // 영상실: ct, xray, monitor 북쪽벽 배치 (x: r.x0 + 1 부터 시작하여 서쪽 파티션 벽과 충돌 방지)
      const radioItems = [
        { k: 'ct', x: r.x0 + 1, y: ny, w: 2, d: 2 },
        { k: 'xray', x: r.x0 + 3, y: ny, w: 1, d: 2 },
        { k: 'monitor', x: r.x0 + 4, y: ny, w: 1, d: 1 },
      ];
      for (const rIt of radioItems) {
        const it = { k: rIt.k, id: 'k' + ki++, x: rIt.x, y: rIt.y, w: rIt.w, d: rIt.d, solid: true, fixed: true, dp: 'radio' };
        kit.push(it);
        mark(it.x, it.y, it.w, it.d);
      }
    } else {
      let kx = r.x0 + 1;
      for (const k of HOSP_KIT[id] || []) {
        const F = hospFurn(k);
        if (kx + F.w > r.x1) break;
        const it = { k, id: 'k' + ki++, x: kx, y: ny, w: F.w, d: F.d, solid: true, fixed: true, dp: id };
        kit.push(it);
        mark(it.x, it.y, it.w, it.d);
        kx += F.w;
      }
    }
  }
  const items = [];
  for (const it of (hp && hp.items) || []) {
    if (it.k === 'part') continue; // Clean design: walls are never loose movable items
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
  // reception: clerk stands inside behind the desk, queue waits in front of the desk (lobby side)
  const recv = all.find(i => i.k === 'reception');
  let wait = [];
  if (recv) {
    const cxq = recv.x + recv.w / 2, cyq = recv.y + recv.d + 0.5;
    wait = [...reach].map(k => k.split(',').map(Number)).filter(([x, y]) => inRect(x, y) && y >= recv.y + recv.d && y <= recv.y + recv.d + 6 && inRegion('lobby', x, y) && !noPlace.has(x + ',' + y)).sort((a, b) => Math.hypot(a[0] + .5 - cxq, a[1] + .5 - cyq) - Math.hypot(b[0] + .5 - cxq, b[1] + .5 - cyq)).slice(0, 14).map(([x, y]) => ({ x: x + .5, y: y + .5 }));
    recv.px = recv.x + 1.0;
    recv.py = recv.y - 0.5;
    recv.sx = wait.length ? wait[0].x : recv.x + 1.0;
    recv.sy = wait.length ? wait[0].y : recv.y + recv.d + 0.5;
  }
  // bench seats: facing north (반대방향/북쪽) into the hospital rooms so patients face north
  const seats = [];
  for (const b of items) if (b.k === 'bench') {
    for (let i = 0; i < b.w; i++) {
      const bx = Math.floor(b.x + i);
      const faceSouth = false; // Always face north (towards the rooms)
      const oy = b.y - .4; // Stand/approach tile in front of the bench (north of bench)
      const sy = b.y + .35; // Sit on the cushion
      seats.push({
        dep: b.x + b.w + b.y + b.d - 1.02 + .01,
        x: b.x + i + .5,
        y: sy,
        ox: b.x + i + .5,
        oy,
        faceSouth: false,
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
  // v1.117: partsDone을 안 넘기면 이미 벽으로 확정된 방까지 "가상의 벽"을 다시 계산해버려서, 그 자리에 실제로
  // 놓여있는 파티션 아이템 자신과 충돌(hospOverlap)한 것처럼 오판함 -> relocateAll이 멀쩡한 벽들을 전부
  // "자리가 없다"고 여겨 엉뚱한 로비 바닥으로 흩어놓음(진료실 등에 벽이 사라지고, 이상한 줄로 늘어선 파티션들이
  // 생기는 버그의 진짜 원인) - kitDone과 마찬가지로 partsDone도 반드시 함께 넘겨줘야 함.
  const R = hospRect(Rm.w, Rm.h, lv), others = (hp.items || []).filter(o => o.id !== it.id), L0 = hospBuildLayout({ items: others, kitDone: hp.kitDone, partsDone: hp.partsDone }, Rm, lv);
  if (it.dp !== 'lobby' && !L0.rooms[it.dp]) return 'hospWrongFloor';
  for (let i = 0; i < F.w; i++) for (let j = 0; j < F.d; j++) {
    const x = it.x + i, y = it.y + j;
    if (x < R.x || x >= R.x + R.w || y < R.y || y >= R.y + R.d) return 'hospOutside';
    if (L0.solid.has(x + ',' + y) || L0.noPlace.has(x + ',' + y)) return 'hospOverlap';
    if (!L0.inRegion(it.dp, x, y) && it.k !== 'part') return 'hospOutside';
  }
  return hospLayoutErr(hospBuildLayout({ items: others.concat([{ id: it.id, k: it.k, dp: it.dp, x: it.x - R.x1, y: it.y - R.y, r: it.r }]), kitDone: hp.kitDone, partsDone: hp.partsDone }, Rm, lv));
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
// 병원 대기실 긴의자 전용 정렬: 중앙 통로와 이동 동선을 고려한 완벽한 격자 대칭 배치
function hospCenterSpot(hp, Rm, lv, k, dp) {
  const F = hospFurn(k), R = hospRect(Rm.w, Rm.h, lv);
  const L0 = hospBuildLayout(hp, Rm, lv);

  const plannedSlots = [];
  if (lv === 1) {
    // 레벨 1: 로비 긴의자 세로 2개 동쪽벽(R.x1) 밀착 배치
    // 벤치 w=3이므로 x = R.x1 - 3에 배치하여 동쪽벽에 붙임
    plannedSlots.push({ x: R.x1 - 3, y: R.y + 6 });
    plannedSlots.push({ x: R.x1 - 3, y: R.y + 8 });
  } else if (lv === 2) {
    // 레벨 2: 4개 (윗줄 2개, 아랫줄 2개)
    const yTop = R.y + 7, yBot = R.y + 10;
    plannedSlots.push({ x: R.x + 3, y: yTop });
    plannedSlots.push({ x: R.x + 8, y: yTop });
    plannedSlots.push({ x: R.x + 3, y: yBot });
    plannedSlots.push({ x: R.x + 8, y: yBot });
  } else {
    // 레벨 3, 4, 5: 윗줄 4개, 아랫줄 4개 (총 8개 완벽 대칭 정렬)
    const yTop = (lv >= 4) ? (R.y + 10) : (R.y + 9);
    const yBot = (lv >= 4) ? (R.y + 13) : (R.y + 12);
    // 윗줄 4개
    for (const x of [R.x + 2, R.x + 7, R.x + 12, R.x + 17]) {
      plannedSlots.push({ x, y: yTop });
    }
    // 아랫줄 4개
    for (const x of [R.x + 2, R.x + 7, R.x + 12, R.x + 17]) {
      plannedSlots.push({ x, y: yBot });
    }
  }

  // 1순위: 계획된 정렬 그리드 슬롯 중 빈 자리
  for (const s of plannedSlots) {
    if (L0.inRegion(dp, s.x, s.y) && !hospCheckPlace(hp, Rm, lv, { id: -1, k, dp, x: s.x, y: s.y })) {
      return s;
    }
  }

  // 2순위: 비상 대체 슬롯 탐색
  const startY = (lv >= 4) ? (R.y + 10) : (lv === 3) ? (R.y + 9) : (lv === 2) ? (R.y + 7) : (R.y + 6);
  for (let y = startY; y <= R.y1 - F.d; y++) {
    for (let x = R.x + 1; x + F.w <= R.x1 - 2; x += 4) {
      if (L0.inRegion(dp, x, y) && !hospCheckPlace(hp, Rm, lv, { id: -1, k, dp, x, y })) {
        return { x, y };
      }
    }
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
    const Rm = roomOf(s), lv = lvNow(hp), old0 = hp.items || [], R = hospRect(Rm.w, Rm.h, lv);
    const old = old0.slice().sort((a, b) => { const fa = hospFurn(a.k), fb = hospFurn(b.k); return ((fa && fa.fixed) ? 0 : 1) - ((fb && fb.fixed) ? 0 : 1); });
    hp.items = []; hp.iv = (hp.iv | 0) + 1;
    for (const it of old) {
      const F = hospFurn(it.k); if (!F) continue;
      let dp = F.dps.includes(it.dp) ? it.dp : F.dps[0];
      // 로비의 불필요한 cabinet, sink는 자동 제거 (접수대 옆 정리)
      if (dp === 'lobby' && (it.k === 'cabinet' || it.k === 'sink')) {
        continue;
      }
      // 진료실 침대 1개, 치료실 침대 1개로 각각 독립 유지 및 중복 정리
      if (it.k === 'tbed') {
        if (dp === 'treat') {
          const treatTbeds = hp.items.filter(x => x.k === 'tbed' && x.dp === 'treat');
          if (treatTbeds.length >= 1) continue;
        } else {
          dp = 'clinic';
          const clinicTbeds = hp.items.filter(x => x.k === 'tbed' && x.dp === 'clinic');
          if (clinicTbeds.length >= 1) continue;
        }
      }
      // 수술실(surgery)에는 일반 침대가 절대 들어가지 않도록 치료실/입원실로 강제 보정
      if (dp === 'surgery' && (it.k === 'tbed' || it.k === 'bed')) {
        dp = (it.k === 'bed' && hospRoomsAt(lv).includes('ward')) ? 'ward' : 'treat';
      }
      // 수술실(surgery) 수술대 1개로 제한
      if (it.k === 'surgery' && dp === 'surgery') {
        const surgTables = hp.items.filter(x => x.k === 'surgery' && x.dp === 'surgery');
        if (surgTables.length >= 1) {
          continue;
        }
      }
      if (it.k === 'bench') {
        dp = 'lobby';
        const p = hospCenterSpot(hp, Rm, lv, it.k, dp);
        if (p) hp.items.push({ id: it.id, k: it.k, dp, x: p.x - R.x1, y: p.y - R.y, v: it.v, r: it.r }); else s.coins += F.cost;
        continue;
      }
      if (it.k === 'tbed' && dp === 'clinic') {
        const L_cur = hospBuildLayout(hp, Rm, lv);
        const rClinic = L_cur.rooms.clinic;
        if (rClinic) {
          const pClinic = { x: rClinic.x0 + 1, y: R.y + 3 };
          if (!hospCheckPlace(hp, Rm, lv, { id: it.id, k: 'tbed', dp: 'clinic', x: pClinic.x, y: pClinic.y })) {
            hp.items.push({ id: it.id, k: it.k, dp, x: pClinic.x - R.x1, y: pClinic.y - R.y, v: it.v, r: it.r });
            continue;
          }
        }
      }
      if (it.k === 'tbed' && dp === 'treat') {
        const L_cur = hospBuildLayout(hp, Rm, lv);
        const rTreat = L_cur.rooms.treat;
        if (rTreat) {
          const pTreat = { x: rTreat.x0 + 1, y: R.y + 3 };
          if (!hospCheckPlace(hp, Rm, lv, { id: it.id, k: 'tbed', dp: 'treat', x: pTreat.x, y: pTreat.y })) {
            hp.items.push({ id: it.id, k: it.k, dp, x: pTreat.x - R.x1, y: pTreat.y - R.y, v: it.v, r: it.r });
            continue;
          }
        }
      }
      if (it.k === 'surgery' && dp === 'surgery') {
        const L_cur = hospBuildLayout(hp, Rm, lv);
        const rSurg = L_cur.rooms.surgery;
        if (rSurg) {
          const pSurg = { x: rSurg.x0 + 1, y: R.y + 2 };
          if (!hospCheckPlace(hp, Rm, lv, { id: it.id, k: 'surgery', dp: 'surgery', x: pSurg.x, y: pSurg.y })) {
            hp.items.push({ id: it.id, k: it.k, dp, x: pSurg.x - R.x1, y: pSurg.y - R.y, v: it.v, r: it.r });
            continue;
          }
        }
      }
      const same = { id: it.id, k: it.k, dp, x: it.x + R.x1, y: it.y + R.y };
      if (!hospCheckPlace(hp, Rm, lv, same)) { hp.items.push({ id: it.id, k: it.k, dp, x: it.x, y: it.y, v: it.v, r: it.r }); continue; }
      const p = hospAutoSpot(hp, Rm, lv, it.k, dp);
      if (p) hp.items.push({ id: it.id, k: it.k, dp, x: p.x - R.x1, y: p.y - R.y, v: it.v, r: it.r }); else s.coins += F.cost;
    }
    hp.iv = (hp.iv | 0) + 1;
  }
  function grantBase(s, hp) {
    const Rm = roomOf(s), lv = lvNow(hp), R = hospRect(Rm.w, Rm.h, lv);
    for (const [k, dp] of [['bench', 'lobby']]) {
      const cap = hospCap(lv, k) || 0, have = hp.items.filter(i => i.k === k).length;
      for (let i = have; i < cap; i++) { const p = hospCenterSpot(hp, Rm, lv, k, dp); if (p) { hp.items.push({ id: hp.iseq++, k, dp, x: p.x - R.x1, y: p.y - R.y }); hp.iv = (hp.iv | 0) + 1; } else break; }
    }
  }
  // the rooms' built-in equipment (reception, sink, cabinets, desk ...) becomes ordinary stored pieces, so it can be moved like everything else
  function grantKit(s, hp) {
    const Rm = roomOf(s), lv = lvNow(hp), R = hospRect(Rm.w, Rm.h, lv), L = hospBuildLayout(hp, Rm, lv);
    if (!L.kit.length) return;
    hp.kitIds = hp.kitIds || [];
    for (const it of L.kit) { const id = hp.iseq++; hp.kitIds.push(id); hp.items.push({ id, k: it.k, dp: it.dp, x: it.x - R.x1, y: it.y - R.y }); }
    hp.kitDone = ['lobby'].concat(hospRoomsAt(lv)); hp.iv = (hp.iv | 0) + 1;
  }
  // the glass partitions between the rooms are drawn as clean architectural walls (not fragmented furniture)
  function grantParts(s, hp) {
    const Rm = roomOf(s), lv = lvNow(hp);
    hp.partsDone = hospRoomsAt(lv).slice(); hp.iv = (hp.iv | 0) + 1;
  }
  function ensure(s) {
    if (!s.hosp) s.hosp = { built: false, lv: 1, patients: [], seq: 1, spawnT: 0, treated: 0 };
    const hp = s.hosp;
    if (!hp.lv) hp.lv = 1; if (!hp.patients) hp.patients = []; if (!hp.seq) hp.seq = 1; if (hp.spawnT == null) hp.spawnT = 0; if (hp.treated == null) hp.treated = 0; if (!hp.staff) hp.staff = []; if (!hp.sseq) hp.sseq = 1;
    if (!hp.skins) hp.skins = { 0: 1 }; if (hp.skin == null) hp.skin = 0;
    if (hp.built) {
      if (!hp.items) { hp.items = []; hp.iseq = 1; hp.iv = 1; }
      // 기본 필수 인력 보장: 접수 직원 1명, 의사 1명, 레벨 2 이상 시 간호사 1명 자동 보장
      if (!hp.staff.some(m => m.role === 'recept')) {
        hp.staff.push({ id: hp.sseq++, role: 'recept', lv: 1, seed: 101, name: pickName(s) || '민지', t: 0.1, done: 0 });
      }
      if (!hp.staff.some(m => m.role === 'doctor')) {
        hp.staff.push({ id: hp.sseq++, role: 'doctor', lv: 1, seed: 202, name: pickName(s) || '준호', t: 0.2, done: 0 });
      }
      if (hp.lv >= 2 && !hp.staff.some(m => m.role === 'nurse')) {
        hp.staff.push({ id: hp.sseq++, role: 'nurse', lv: 1, seed: 303, name: pickName(s) || '서연', t: 0.2, done: 0 });
      }
      // v1.115: 타운 배치(fitShop)가 병원 건물을 다른 자리로 밀 때 기준점 동기화
      { const R0 = hospRect(0, 0, lvNow(hp), s);
        if (hp.ax != null && (hp.ax !== R0.x1 || hp.ay !== R0.y)) {
          const dx = R0.x1 - hp.ax, dy = R0.y - hp.ay;
          for (const it of hp.items) { it.x += dx; it.y += dy; }
          hp.iv = (hp.iv | 0) + 1;
        }
        hp.ax = R0.x1; hp.ay = R0.y;
      }
      // older hospitals were multi-storey: rooms = departments now, the layout changed completely -> re-place everything, drop old patients
      if (!hp.v6) { hp.v6 = 1; hp.patients = []; hp.items.forEach(it => { delete it.fl; if (!hospFurn(it.k)) it.k = null; }); hp.items = hp.items.filter(it => it.k); hp.items.forEach(it => { const F = hospFurn(it.k); if (!F.dps.includes(it.dp)) it.dp = F.dps[0]; }); relocateAll(s, hp); }
      if (!hp.v7) { hp.v7 = 1; relocateAll(s, hp); } // benches now need a free tile in front of them (none may sit against the south wall)
      if (!hp.v8) {
        hp.v8 = 1;
        const hospLvNow = lvNow(hp);
        const rList = hospRoomsAt(hospLvNow);
        if (rList.includes('treat')) {
          for (const it of hp.items) {
            if (it.k === 'tbed' && it.dp === 'clinic') it.dp = 'treat';
          }
        }
        for (const it of hp.items) {
          if (it.k === 'bench') it.dp = 'lobby';
        }
        relocateAll(s, hp);
      }
      // v1.121: 병원 대기실 긴의자 대칭 격자 정렬 및 조각 벽체 잔여물 완전 청소
      if (!hp.v11) {
        hp.v11 = 1;
        hp.items = (hp.items || []).filter(it => it && it.k !== 'part');
        if (hp.kitIds) {
          hp.kitIds = hp.kitIds.filter(id => {
            const it = (hp.items || []).find(x => x.id === id);
            return it && it.k !== 'part';
          });
        }
        delete hp.partsDone;
        for (const it of hp.items) {
          if (it.k === 'bench') it.dp = 'lobby';
        }
        relocateAll(s, hp);
      }
      // v1.122: 긴 의자 위치를 로비 중앙으로 재배치 및 북쪽 방향(반대방향) 적용
      if (!hp.v12) {
        hp.v12 = 1;
        for (const it of hp.items) {
          if (it.k === 'bench') it.dp = 'lobby';
        }
        relocateAll(s, hp);
      }
      // v1.123: 사용자 세부 요구사항 전면 반영
      // 1. 접수대 남쪽 1칸 이동(y=1) -> 접수직원이 안으로 들어가서 서있게
      // 2. 치료실 침대는 무조건 1개만 유지 (중복 tbed 제거)
      // 3. 진료실 침대 1개(tbed) 확보
      // 4. 입원실 침대 3개(서쪽벽 1개, 동쪽벽 2개 간격 배치)
      // 5. 로비 긴의자 윗줄 4개 / 아랫줄 4개 (레벨3), 레벨1 중앙 2개 정렬
      if (!hp.v13) {
        hp.v13 = 1;
        hp.items = (hp.items || []).filter(it => it && it.k !== 'part');
        for (const it of hp.items) {
          if (it.k === 'reception') it.y = 1;
        }
        let treatTbedFound = false;
        hp.items = hp.items.filter(it => {
          if (it.k === 'tbed' && it.dp === 'treat') {
            if (treatTbedFound) return false;
            treatTbedFound = true;
          }
          return true;
        });
        delete hp.kitDone;
        delete hp.partsDone;
        relocateAll(s, hp);
      }
      // v1.124: 사용자 세부 요구사항 전면 반영
      // 1. 접수대 옆 상자(sink) 및 진열대(cabinet) 삭제 (로비의 cabinet, sink 제거)
      // 2. 진료실(clinic) 침대 1개로 제한 (중복 tbed 제거)
      // 3. 치료실(treat) 침대 2개 중 위쪽 침대 삭제 -> 아래쪽 침대(y=ny+3) 1개만 유지
      // 4. 수술실(surgery) 수술대 1개 중앙(x=r.x0+1, y=ny+2) 배치
      // 5. 로비 긴의자 세로 2개 동쪽벽(x=R.x1-3) 밀착
      if (!hp.v14) {
        hp.v14 = 1;
        // 로비의 cabinet, sink 삭제
        hp.items = (hp.items || []).filter(it => it && !(it.dp === 'lobby' && (it.k === 'cabinet' || it.k === 'sink')));
        if (hp.kitIds) {
          hp.kitIds = hp.kitIds.filter(id => {
            const it = (hp.items || []).find(x => x.id === id);
            return it && !(it.dp === 'lobby' && (it.k === 'cabinet' || it.k === 'sink'));
          });
        }
        // 진료실 침대 1개로 제한
        let clinicTbedFound = false;
        hp.items = hp.items.filter(it => {
          if (it.k === 'tbed' && it.dp === 'clinic') {
            if (clinicTbedFound) return false;
            clinicTbedFound = true;
          }
          return true;
        });
        // 치료실 침대 2개 중 위쪽 침대 삭제 (아래쪽 침대만 유지)
        let treatTbeds = hp.items.filter(it => it.k === 'tbed' && it.dp === 'treat');
        if (treatTbeds.length > 1) {
          treatTbeds.sort((a, b) => a.y - b.y);
          const upperBedId = treatTbeds[0].id;
          hp.items = hp.items.filter(it => it.id !== upperBedId);
        }
        // 수술실 수술대 1개로 제한
        let surgFound = false;
        hp.items = hp.items.filter(it => {
          if (it.k === 'surgery' && it.dp === 'surgery') {
            if (surgFound) return false;
            surgFound = true;
          }
          return true;
        });
        for (const it of hp.items) {
          if (it.k === 'reception') { it.x = -3; it.y = 1; }
        }
        delete hp.kitDone;
        delete hp.partsDone;
        relocateAll(s, hp);
      }
      // v1.125: 레벨 1 침대 1개 엄격 보장(위쪽 침대 제거), 레벨 2 진료실 가구 보존, 치료실 진열대 벽 끼임 방지, 레벨 3 수술대 정중앙 정렬, 레벨 4 병동 배치 보존, 건물 겹침 시 층/벽 우선순위 보장
      if (!hp.v15) {
        hp.v15 = 1;
        hp.items = (hp.items || []).filter(it => it && !(it.dp === 'lobby' && (it.k === 'cabinet' || it.k === 'sink')));
        if (hp.kitIds) {
          hp.kitIds = hp.kitIds.filter(id => {
            const it = (hp.items || []).find(x => x.id === id);
            return it && !(it.dp === 'lobby' && (it.k === 'cabinet' || it.k === 'sink'));
          });
        }
        const cBeds = (hp.items || []).filter(it => it && it.k === 'tbed' && it.dp === 'clinic');
        if (cBeds.length > 1) {
          cBeds.sort((a, b) => a.y - b.y);
          const keepId = cBeds[cBeds.length - 1].id;
          hp.items = hp.items.filter(it => !(it.k === 'tbed' && it.dp === 'clinic' && it.id !== keepId));
        }
        const tBeds = (hp.items || []).filter(it => it && it.k === 'tbed' && it.dp === 'treat');
        if (tBeds.length > 1) {
          tBeds.sort((a, b) => a.y - b.y);
          const keepId = tBeds[tBeds.length - 1].id;
          hp.items = hp.items.filter(it => !(it.k === 'tbed' && it.dp === 'treat' && it.id !== keepId));
        }
        let sFound = false;
        hp.items = (hp.items || []).filter(it => {
          if (it.k === 'surgery' && it.dp === 'surgery') {
            if (sFound) return false;
            sFound = true;
          }
          return true;
        });
        delete hp.kitDone;
        delete hp.partsDone;
        relocateAll(s, hp);
      }
      if (hp.bldSeq == null) hp.bldSeq = (hp.lv || 1);
      grantBase(s, hp);
      // v1.113: leveling up claims more of the open lobby ground for the new department rooms, so anything the
      // player had standing there (benches above all) can end up buried under the new room - bump everything
      // back to a free spot first, THEN grant the new room's own walls/kit (fixes: benches "replaced" by walls,
      // and the resulting jumble of overlapping partitions around the newly unlocked rooms).
      const hospLvNow = lvNow(hp);
      if ((hp.relocLv || 1) < hospLvNow) { relocateAll(s, hp); hp.relocLv = hospLvNow; }
      if (!hp.kitDone || hospRoomsAt(hospLvNow).some(r => !hp.kitDone.includes(r))) grantKit(s, hp);
      if (!hp.partsDone || hospRoomsAt(hospLvNow).some(r => !hp.partsDone.includes(r))) grantParts(s, hp);
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
    return { id: hp.seq++, seed: 1 + Math.floor(Math.random() * 1e6), sp, ail: ail.id, plan, k: -1, ph: 'walkin', tm: 25, stn: null, bill: 0, q: 1, qt: 0, rv: .85 + Math.random() * .3, pv: .85 + Math.random() * .3, dv: plan.map(() => .85 + Math.random() * .3) };
  }
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  // which station (by key) a patient at `from` should use for this kind: a free one (nobody reserved it)
  const freeStation = (hp, kind) => hospStations().find(x => x.it.k === kind && x.it.sx != null && !hp.patients.some(q => q.stn === x.key && (q.ph === 'toStn' || q.ph === 'atStn' || q.ph === 'treat')));
  // after a step: register / exam / treatment done -> what next? (walk to the next room, or sit down and wait, or go pay)
  function nextStep(s, hp, p, L, from, atDesk) {
    if (atDesk) {
      // 방금 접수(reg) 완료:
      // 이미 의자에 앉아 기다리는 환자가 있거나 진료실(exam)이 차있으면 의자(소파)에 앉아서 앞사람 진료가 끝나기를 대기!
      const tx = hospTx(hospStage(p));
      const hasBenchWaiting = hp.patients.some(q => q !== p && q.ph === 'bench' && hospStage(q) === hospStage(p));
      const free = (!hasBenchWaiting && tx && tx.stn) ? freeStation(hp, tx.stn) : null;
      if (free) {
        p.stn = free.key;
        p.ph = 'toStn';
        const to = { x: free.it.sx, y: free.it.sy };
        p.tm = 1.2 + dist(L.wait[0] || { x: L.reception.x, y: L.reception.y }, to) / 2.2;
      } else {
        p.ph = 'bench';
        p.qt = hp.clock;
        p.stn = null;
      }
      return;
    }
    const desk = L.wait[0] || { x: L.reception.x, y: L.reception.y };
    p.routing = p.k < p.plan.length; // 진료/치료 후 남은 단계가 있으면 접수 직원이 안내, 다 끝났으면 수납
    p.ph = 'toDesk';
    p.tm = 1 + dist(from || desk, desk) / 2.2;
    p.stn = null;
  }
  const stationPos = (L, key) => { const x = L.stations.find(q => String(q.id) === key); return x ? { x: x.sx, y: x.sy } : L.wait[0] || { x: L.reception.x, y: L.reception.y }; };
  function finishStage(s, hp, p, L) {
    const st = hospStage(p), tx = hospTx(st);
    if (st === 'pay') {
      const c = Math.round(p.bill);
      s.coins += c;
      H.addXp(s, 4);
      p.paid = c;
      p.ph = 'leaving';
      p.tm = 120;
      p.paidT = 3.0; // 3초간만 결제 말풍선 표시
      p.stn = null;
      hp.treated++;
      if (typeof TOWN !== 'undefined') TOWN.mood(s, .6);
      if (H.addRep) H.addRep(s, 1);
      return;
    }
    if (st === 'route') {
      // 접수직원이 의사의 진료 결과(병명)를 듣고 다음 치료실/수술실/X-RAY실로 안내
      p.routing = false;
      const nextTx = hospTx(hospStage(p));
      const hasBenchWaiting = hp.patients.some(q => q !== p && q.ph === 'bench' && hospStage(q) === hospStage(p));
      const free = (!hasBenchWaiting && nextTx && nextTx.stn) ? freeStation(hp, nextTx.stn) : null;
      if (free) {
        // 해당 치료실/장비가 비어있으면 즉시 이동
        p.stn = free.key;
        p.ph = 'toStn';
        const from = L.wait[0] || { x: L.reception.x, y: L.reception.y };
        const to = { x: free.it.sx, y: free.it.sy };
        p.tm = 1.2 + dist(from, to) / 2.2;
      } else {
        // 이미 다른 손님이 치료 중이면 소파에 앉아서 차례 기다림
        p.ph = 'bench';
        p.qt = hp.clock;
        p.stn = null;
      }
      return;
    }
    p.bill += st === 'reg' ? hospTxFee(tx, 1) : hospTxFee(tx, tx.mini ? p.q : 1);
    H.addXp(s, tx.mini ? 8 : 3);
    const from = p.stn ? stationPos(L, p.stn) : null;
    p.k++;
    p.stn = null;
    nextStep(s, hp, p, L, from, st === 'reg');
  }
  function tick(s, dt) {
    const hp = ensure(s); if (!hp.built) return;
    hp.clock = (hp.clock || 0) + dt;
    const L = HOSP_LAYOUT(), keys = new Set(L.stations.map(x => String(x.id)));
    for (const p of hp.patients) {
      if (p.stn && !keys.has(p.stn)) { p.stn = null; if (p.ph === 'toStn' || p.ph === 'atStn' || p.ph === 'treat') nextStep(s, hp, p, L, null); }
      p.tm = (p.tm || 0) - dt;
      switch (p.ph) {
        case 'walkin': if (p.arr || p.tm <= 0) p.ph = 'deskwait'; break; // 접수대 도착 -> 접수 대기
        case 'deskserve': if (p.tm <= 0) finishStage(s, hp, p, L); break;
        case 'toDesk': if (p.arr || p.tm <= 0) p.ph = 'deskwait'; break;
        case 'toStn': if (p.arr || p.tm <= 0) p.ph = 'atStn'; break;
        case 'treat': if (p.tm <= 0) finishStage(s, hp, p, L); break;
        case 'leaving':
          if (p.paidT > 0) p.paidT = Math.max(0, p.paidT - dt);
          if (p.tm <= 0 || p.gone) p.gone = 1;
          break;
      }
    }
    hp.patients = hp.patients.filter(p => !p.gone);
    // 대기 의자에 앉아있는 환자: 앞사람 진료/치료가 끝나서 원하는 방이 비면 앉은 순서대로 정확히 호출되어 입장
    for (const p of hp.patients.filter(x => x.ph === 'bench').sort((a, b) => a.qt - b.qt)) {
      const tx = hospTx(hospStage(p)); if (!tx || !tx.stn) continue;
      const free = freeStation(hp, tx.stn);
      if (free) {
        p.stn = free.key;
        p.ph = 'toStn';
        p.arr = false;
        const from = L.seats[0] || L.wait[0] || { x: L.reception.x, y: L.reception.y }, to = { x: free.it.sx, y: free.it.sy };
        p.tm = 1.2 + dist(from, to) / 2.2;
      }
    }
    staffWork(s, hp, dt);
    // 신규 환자 유입: 병원은 원래 오래 기다리는 것이 상식이므로 임의로 쫓아내지 않고 자연스럽게 수용
    const inside = hp.patients.filter(q => q.ph !== 'leaving');
    const seatsN = L.seats.length;
    if (!G.isOpen(s)) return;
    if (inside.length >= Math.max(8, seatsN + L.stations.length + 3)) return;
    hp.spawnT -= dt;
    if (hp.spawnT > 0) return;
    if (!hospTxAvail().length || !L.wait.length) { hp.spawnT = 10; return; }
    const np = newPatient(s, hp);
    hp.patients.push(np);
    hp.spawnT = 18 + Math.random() * 20;
  }
  // someone starts serving a patient: the clerk at the desk, the doctor / nurse at the room. `by` is 'me' or a staff id.
  function serve(s, hp, p, by, q) {
    if (p.ph !== 'deskwait' && p.ph !== 'atStn') return false;
    const st = hospStage(p), tx = hospTx(st);
    p.by = by; p.q = tx.mini ? Math.max(.7, Math.min(1.5, +q || 1)) : 1;
    p.ph = (st === 'reg' || st === 'pay' || st === 'route') ? 'deskserve' : 'treat';
    p.tdur = Math.round(tx.dur * hospDurK(p, st) * 10) / 10;
    p.tm = p.tdur;
    return true;
  }
  const stageReady = p => p.ph === 'deskwait' || p.ph === 'atStn';
  function staffWork(s, hp, dt) {
    const L = HOSP_LAYOUT();
    for (const m of hp.staff) {
      m.t = (m.t == null ? 0.2 : m.t) - dt;
      if (m.tt > 0) { m.tt -= dt; continue; }
      if (m.t > 0) continue;
      const role = hospStaffRole(m.role); if (!role) continue;
      const sp = hospSpecOf(hp, m, L);

      if (m.role === 'recept') {
        // 접수 직원은 쉬지 않고 계속 업무를 처리:
        // 1순위: 치료가 끝난 환자 수납(pay) - 중간에 치료 끝난 사람 돈 먼저 수납
        // 2순위: 의사 진료 후 다음 방 안내(route) - 병명 듣고 치료실/수술실/X-RAY실로 배정
        // 3순위: 새로 온 환자 접수(reg) - 어디가 아픈지 묻고 진료실로 안내
        const readyPatients = hp.patients.filter(x => x.ph === 'deskwait');
        const payP = readyPatients.find(x => hospStage(x) === 'pay');
        const routeP = readyPatients.find(x => hospStage(x) === 'route');
        const regP = readyPatients.find(x => hospStage(x) === 'reg');
        const p = payP || routeP || regP;
        if (p) {
          serve(s, hp, p, 'm' + m.id, 1);
          m.pid = p.id;
          m.tt = p.tdur;
          m.done = (m.done | 0) + 1;
          m.t = 0.1; // 다음 대기 환자 즉시 응대 (놀지 않고 연속 처리)
        } else {
          m.t = 0.25;
        }
      } else {
        // 의사(doctor: 진료, 수술, X-RAY) 및 간호사(nurse: 치료실 처치, 입원실 케어)는 처치대/진료실(atStn) 환자만 전담
        const ready = x => x.ph === 'atStn' && role.does.includes(hospStage(x));
        const pickLongest = arr => arr.reduce((a, b) => (!a || (b.wt || 0) > (a.wt || 0)) ? b : a, null);
        const own = hp.patients.filter(x => ready(x) && sp.does.includes(hospStage(x)));
        const any = hp.patients.filter(x => ready(x) && (x.wt || 0) >= 2);
        const p = pickLongest(own) || pickLongest(any);
        if (p) {
          serve(s, hp, p, 'm' + m.id, 1);
          m.pid = p.id;
          m.tt = p.tdur;
          m.done = (m.done | 0) + 1;
          m.t = Math.max(0.3, (HOSP_STAFF_DUR[m.lv] || 4) - p.tdur);
        } else {
          m.t = 0.6;
        }
      }
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
      s.coins -= HOSP_BUILD_COST; hp.built = true; hp.spawnT = 8; hp.items = []; hp.iseq = 1; hp.iv = 1; hp.v6 = 1;
      s.bldSeq = (s.bldSeq || 0) + 1; hp.bldSeq = s.bldSeq;
      grantBase(s, hp);
      if (typeof TOWN !== 'undefined' && TOWN.fitShop) TOWN.fitShop(s);
      return { ok: 1, fx: 'coin', msg: 'hospBuilt' };
    }
    if (!hp.built) return { err: 'gone' };
    if (a.t === 'hospdemolish') { // v1.114: "철거" - 완전히 허물고 1단계부터 다시 지을 수 있게 리셋 (절반 환불)
      if (s.lay) delete s.lay.hosp;
      let refund = HOSP_BUILD_COST; for (let i = 2; i <= hp.lv; i++) refund += (HOSP_LV[i] && HOSP_LV[i].cost) || 0;
      s.coins += Math.round(refund * .5);
      s.hosp = { built: false, lv: 1, bldSeq: 0, patients: [], seq: 1, spawnT: 0, treated: 0 };
      if (typeof TOWN !== 'undefined' && TOWN.fitShop) TOWN.fitShop(s);
      return { ok: 1, fx: 'coin', msg: 'hospDemolished' };
    }
    if (a.t === 'hospup') {
      const nx = HOSP_LV[hp.lv + 1]; if (!nx) return { err: 'gone' };
      if (s.level < nx.ulv) return { err: 'homeNeedPlayer', p: { n: nx.ulv } };
      if (s.coins < nx.cost) return { err: 'notEnough' };
      s.coins -= nx.cost; hp.lv++; H.addXp(s, 40);
      s.bldSeq = (s.bldSeq || 0) + 1; hp.bldSeq = s.bldSeq;
      relocateAll(s, hp);
      for (const p of hp.patients) {
        if (p.stn) { p.stn = null; p.ph = 'bench'; p.qt = hp.clock; }
      }
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
