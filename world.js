// ================= Isometric shop world: camera, actors, pathfinding, input =================
const World = (() => {
  let cv, c, dpr = 1, vw = 0, vh = 0;
  const cam = { x: 0, y: 0, z: 1.3, follow: true };
  let bgCanvas = null, bgKey = '';
  const actors = new Map();   // id -> actor
  const trucked = new Set();
  let me = null;
  let cafeMsgShown = false;
  let hits = [];              // for tap hit-testing, rebuilt every frame
  let T = 0, last = 0, stepT = 0;
  let editSel = null;         // selected item id in edit mode
  let cafeSel = null;         // selected café furniture id while decorating the café
  let onTap = null;           // callback(target)
  const joy = { on: false, dx: 0, dy: 0 };
  // ================= PET PNG (시바 시누 등) =================
  // AI 벡터 대신 직접 그린 PNG를 그린다. 통통 튀기 + 좌우 흔들기로 살아있게.
  function drawPngPet(c, sp, st) {
    const idleImg = PET_PNG.img(sp);
    if (!idleImg || !idleImg.complete || !idleImg.naturalWidth) return false;
    const t = st.t || 0;

    // 걷기 이미지가 로드됐으면 이동 중엔 그걸 씀
    let img = idleImg;
    let isWalk = false;
    // v2026-10-10: 쥐(rat_*)는 걷기 이미지 자체가 없음(app.js 사전로딩에서도 일부러 건너뜀 -- 쥐는
    // 우리에만 있고 안 돌아다니는 "cage" 종) -- 그런데 여기서는 손님이 쥐를 안고 걸어다니는 등
    // st.moving이 켜진 모든 경우에 그 체크 없이 매번 sp+'_walk1'/'_walk2'를 새로 불러오려 시도해서,
    // 존재하지도 않는 파일을 계속 요청 -> 로컬에 없음 -> GitHub로 자동 대체 요청 -> 거기도 없어서 404,
    // 이 흐름이 매번 콘솔에 404 에러로 찍혔음. 애초에 걷기 그림이 없는 종은 아예 시도하지 않도록 함.
    if (st.moving && !sp.startsWith('rat_')) {
      const w1 = PET_PNG.img(sp + '_walk1');
      const w2 = PET_PNG.img(sp + '_walk2');
      if (w1 && w1.complete && w1.naturalWidth && w2 && w2.complete && w2.naturalWidth) {
        // 12프레임 주기로 walk1 ↔ walk2 교대
        const phase = Math.floor(t * 4) % 2;
        img = phase === 0 ? w1 : w2;
        isWalk = true;
      }
    }

    // 움직임 (걷기 이미지면 bob/tilt 약하게)
    const bob = st.moving ? (isWalk ? Math.abs(Math.sin(t * 8)) * 1.0 : Math.abs(Math.sin(t * 12)) * 2.5) : Math.sin(t * 2) * .6;
    const tilt = st.moving ? (isWalk ? Math.sin(t * 8) * .02 : Math.sin(t * 12) * .05) : Math.sin(t * 1.5) * .02;

    // 종별 크기 (없으면 84 기본)
    const SZ_BY_SP = {
      shiba_sinu_black: 83,
      shiba_sinu_black_brown: 83,
      dalmatian_black: 105,
      dalmatian_eye: 105,
      dalmatian_red: 105,
      maltese_brown2: 80,
      maltese_dark_brown: 80,
      maltese_white: 80, 
      retriever_black: 110,
      retriever_brown: 110,
      retriever_dark_brown: 110,
      chihuahua_black: 70,
      chihuahua_brown: 70,
      chihuahua_dark_brown: 70,
    };
    const baseSz = SZ_BY_SP[sp] || 84;
const SZ = isWalk ? baseSz * 1.3 : baseSz;  // walk를 30% 크게

c.save();
// walk 이미지가 왼쪽 보는 그림 → 오른쪽 이동 시 좌우 반전
// idle은 정면이라 반전 없음
if (isWalk) c.scale(-(st.dir || 1), 1);
ART.shadow(c, 0, 0, 14);
c.translate(0, -bob);
c.rotate(tilt);
const yOffset = isWalk ? 6 + SZ * .15 : 6;  // walk는 더 아래 (발이 바닥에 닿게)
c.drawImage(img, -SZ / 2, -SZ + yOffset, SZ, SZ);
c.restore();
return true;
  }

  const room = () => S.room;
  const W = () => S.room.w, H = () => S.room.h;
  const DOOR = () => ({ x: W() - 1, y: H() - 2 });

  // ---------- occupancy & walkability ----------
  let occ = null, occKey = '';
  function buildOcc() {
    const key = JSON.stringify([S.room.w, S.room.h, S.items.map(i => [i.x, i.y, i.k])]);
    if (key === occKey) return; occKey = key;
    occ = new Set();
    for (const it of S.items) {
      const d = FURN.fp(it);
      if (d.flat) continue;
      for (let x = 0; x < d.w; x++) for (let y = 0; y < d.d; y++) occ.add((it.x + x) + ',' + (it.y + y));
    }
  }
  // PERF (v9.69): walk() used to recompute the house rect, the delivery crates (filtering two arrays), the drop-zone slots
  // and the café / hospital layout keys on EVERY call -- and one A* search on the big village calls it tens of thousands
  // of times, which froze the game for a moment whenever several people picked a new destination at once. Everything
  // walk() needs is now gathered once per frame (walkCtx), same rules as before.
  let wctx = null, wctxKey = '', wctxOcc = null;
  let _cachedHou = null, _cachedHouKey = '';
  let _cachedPark = null, _cachedParkKey = '';
  let _cachedVil = null, _cachedVilKey = '';
  let _cachedSal = null, _cachedSalKey = '';

  function getCachedHou() {
    const T = S && S.town;
    const k = (T ? T.rv || 0 : 0) + ':' + (T && T.objs ? T.objs.length : 0);
    if (k === _cachedHouKey && _cachedHou) return _cachedHou;
    const s = new Set();
    if (typeof TOWN !== 'undefined' && TOWN.houseSolid) TOWN.houseSolid(s);
    _cachedHou = s; _cachedHouKey = k;
    return s;
  }
  function getCachedPark() {
    const k = (S && S.park && S.park.built) ? 1 : 0;
    if (k === _cachedParkKey && _cachedPark) return _cachedPark;
    _cachedPark = (typeof PARK !== 'undefined' && PARK.solid) ? PARK.solid() : new Set();
    _cachedParkKey = k;
    return _cachedPark;
  }
  function getCachedVil() {
    const k = ((S && S.village && S.village.lake) ? 1 : 0) + ':' + ((S && S.village && S.village.monu) ? 1 : 0);
    if (k === _cachedVilKey && _cachedVil) return _cachedVil;
    _cachedVil = (typeof VILLAGE !== 'undefined' && VILLAGE.solid) ? VILLAGE.solid() : new Set();
    _cachedVilKey = k;
    return _cachedVil;
  }
  function getCachedSal() {
    const k = (S && S.salon && S.salon.built) ? 1 : 0;
    if (k === _cachedSalKey && _cachedSal) return _cachedSal;
    _cachedSal = (typeof SALON !== 'undefined' && SALON.solid) ? SALON.solid() : new Set();
    _cachedSalKey = k;
    return _cachedSal;
  }

  function walkCtx() {
    const w = W(), h = H();
    const hlv = (S.home && S.home.lv) || 1;
    const nCrate = (S.deliveries || []).filter(d => d.st === 'arrived' && !d.pk && !(App.carry && App.carry.did === d.id)).length + (S.parcels || []).filter(p => p.st === 'arrived').length;
    const T = S && S.town;
    const trv = T ? (T.rv || 0) : 0;
    const cBuilt = (S.cafe && S.cafe.built) ? 1 : 0;
    const hBuilt = (S.hosp && S.hosp.built) ? 1 : 0;
    const fCoop = (S.farm && S.farm.coop) ? 1 : 0;
    const key = w + ':' + h + ':' + hlv + ':' + nCrate + ':' + trv + ':' + cBuilt + ':' + hBuilt + ':' + fCoop;
    if (wctx && key === wctxKey && wctxOcc === occ) return wctx;

    const hp = FURN.HOME_POS(w, h, hlv), cq = fCoop ? COOP_POS(w) : null, fbx = FARM_BOX_POS();
    const crates = new Set();
    if (nCrate) { const slots = dropSlots(); for (let i = 0; i < Math.min(nCrate, slots.length); i++) crates.add(Math.floor(slots[i].gx) + ',' + Math.floor(slots[i].gy)); }
    const cafeSolid = cBuilt ? CAFE_LAYOUT().solid : null, sg = cafeSolid ? null : CAFE_SIGN();
    const hospSolid = hBuilt ? HOSP_LAYOUT().solid : null, hs = hospSolid ? null : HOSP_SIGN();
    wctx = { w, h, hp, cq, fbx, crates, cafeSolid, sgx: sg && Math.floor(sg.x), sgy: sg && Math.floor(sg.y), hospSolid, hsx: hs && Math.floor(hs.x), hsy: hs && Math.floor(hs.y), sy0: FURN.STORE_Y.seed, sx0: STALL_POS().x, vS: VILLAGE_S_MAX(), vX0: VILLAGE_X0, park: getCachedPark(), vil: getCachedVil(), sal: getCachedSal(), hou: getCachedHou() };
    wctxKey = key; wctxOcc = occ; return wctx;
  }
  function walk(x, y, allowDelivery) {
    const C = walkCtx(), w = C.w, h = C.h, dy = h - 2, dr = 2; // front door at h-2, delivery door at row 2 (original position)
    // v2026-10-10: occ(가구 점유 칸)가 아직 한 번도 안 만들어졌을(null) 수 있는 호출 경로에 대한 안전장치
    // -- occ==null이면 죽이지 않고 "막힌 칸 없음"으로 간주 (buildOcc()가 호출되면 다음 호출부터는 정상 값)
    if (x >= 0 && y >= 0 && x < w && y < h) return !occ || !occ.has(x + ',' + y);
    if (y === dy && x >= w && x <= w + 2) return true;       // front door path
    if (allowDelivery && y >= 1 && y <= 3 && x >= w && x <= w + 2) return true; // delivery door (original position)
    // The shop's own outer ring (west wall x=-1, north wall y=-1, south edge y=h, east edge x=w) is
    // solid except the doors
    if (x >= -1 && x <= w && y >= -1 && y <= h) return y === -1 && (x === w - 2 || x === w - 1);
    // v2026-10-10: "공원/호수/동물원에 아무도 안 가요" 버그 수정 -- 공원/호수/동물원처럼 멀리 떨어뜨려
    // 지을 수 있는 "큰 부지"는 입구 연결 체크(TOWN.isFacilityAccessible, "길 연결 필요" 경고에 쓰임)는
    // 통과하는데, 정작 길찾기가 쓰는 이 walk()는 그 부지 타일들이 기본 마을 반경
    // (VILLAGE_X0~W+VILLAGE_XE-1, VILLAGE_Y0~VILLAGE_S_MAX) 밖으로 나가면 묻지도 따지지도 않고 전부
    // "막힘"으로 처리해버렸음. 그래서 경고 배지도 안 뜨고 그냥 아무도 못 찾아가는 상태가 됐었음.
    // 이 세 시설은 반경 체크보다 먼저 처리해서, 부지 전체를 항상 걸을 수 있는 땅으로 인정하게 함.
    if (S.park && S.park.built && typeof PARK_POS === 'function') {
      const pp0 = PARK_POS();
      if (x >= pp0.x && x < pp0.x + pp0.w && y >= pp0.y && y < pp0.y + pp0.d) {
        const k0 = x + ',' + y;
        return !C.park || !C.park.has(k0);
      }
    }
    if (S.village && S.village.lake && typeof VILLAGE !== 'undefined' && typeof VILLAGE.LAKE === 'function') {
      const lp0 = VILLAGE.LAKE();
      if (x >= lp0.x && x < lp0.x + lp0.w && y >= lp0.y && y < lp0.y + lp0.d) return true; // 호수 부지 전체(선착장/낚시 포인트 포함)를 걸을 수 있게
    }
    for (const o0 of (S.town && S.town.objs) || []) {
      if (o0.k === 'zoo' && x >= o0.x && x < o0.x + 24 && y >= o0.y && y < o0.y + 22) return true;
    }
    // v2026-10-10: "공원 둘레 길도 못 가요" 버그 수정 -- 공원처럼 마을 기본 반경 경계에 바싹 붙여
    // 지은 "큰 부지"는 그 입구로 이어지는 길까지도 함께 반경 밖으로 밀려날 수 있음. 실제로 플레이어가
    // 정상적으로 깔아서 TOWN.isRoadTile()엔 "길 맞음"으로 잡히는데도, 바로 아래 반경 체크 때문에
    // walk()에서는 그냥 "막힘"으로 처리돼서 그 길을 눌러도 캐릭터가 전혀 움직이지 않았음. 제대로 깔린
    // 길이면 반경 밖이어도 항상 걸을 수 있게, 반경 체크보다 먼저 길 여부부터 확인.
    if (typeof TOWN !== 'undefined' && TOWN.isRoadTile && TOWN.isRoadTile(S, x, y, allowDelivery)) return true;
    if (x < C.vX0 || x > w + VILLAGE_XE - 1 || y < VILLAGE_Y0 || y > C.vS) return false; // edge of the village (1.5x the old extent in each direction)
    const hp = C.hp;
    if (x >= hp.x && x < hp.x + hp.w && y >= hp.y && y < hp.y + hp.d) return false; // the house blocks its own footprint
    if (C.fbx && x === C.fbx.x && y === C.fbx.y) return false; // the farm storage crate
    const cq = C.cq; if (cq && x >= cq.x && x < cq.x + cq.w && y >= cq.y && y < cq.y + cq.d) return false; // so does the chicken coop
    if (x >= C.sx0 && x < C.sx0 + 3.1 && y >= C.sy0 && y < C.sy0 + 3) return false; // the seed stall blocks its own
    const k = x + ',' + y; // PET TOWN: the café can stand anywhere now (it used to be only north of the shop, y <= -3)
    if (C.crates.size && C.crates.has(k)) return false; // a sitting delivery box is a solid obstacle, not something to walk through

    // 1. 정상적으로 입장한 시설 내부의 기존 이동 가능 영역
    if (S.cafe && S.cafe.built && typeof CAFE_POS === 'function') {
      const cp = CAFE_POS(S);
      if (x >= cp.x && x < cp.x + cp.w && y >= cp.y && y < cp.y + cp.d) {
        return !C.cafeSolid || !C.cafeSolid.has(k);
      }
    }
    if (S.hosp && S.hosp.built && typeof HOSP_POS === 'function') {
      const hp2 = HOSP_POS(S);
      if (x >= hp2.x && x < hp2.x + hp2.w && y >= hp2.y && y < hp2.y + hp2.d) {
        return !C.hospSolid || !C.hospSolid.has(k);
      }
    }
    if (S.salon && S.salon.built && typeof SALON_POS === 'function') {
      const sp = SALON_POS();
      if (x >= sp.x && x < sp.x + sp.w && y >= sp.y && y < sp.y + sp.d) {
        return !C.sal || !C.sal.has(k);
      }
    }
    if (S.farm && typeof inFarm === 'function' && inFarm(x, y, w, h)) return true;
    if (S.ranch && typeof inRanch === 'function' && inRanch(x, y)) return true;
    for (const o of (S.town && S.town.objs) || []) {
      if (o.k === 'zoo') {
        if (x >= o.x && x < o.x + 24 && y >= o.y && y < o.y + 22) return true;
      }
    }

    if (C.park.size && C.park.has(k)) return false;
    if (C.vil.has(k) || C.sal.has(k) || C.hou.has(k)) return false; // salon furniture/walls, villagers' houses, lake water, etc.
    if (typeof TRAIN !== 'undefined' && TRAIN.solid && TRAIN.solid(x, y)) return false;

    // 2. 외부 이동 구역: 오직 길 네트워크 (설치된 길, 기본 인도, 골목길, 횡단보도, 출입문 연결 구간)
    if (typeof TOWN !== 'undefined' && TOWN.isRoadTile) {
      return TOWN.isRoadTile(S, x, y, allowDelivery);
    }
    return false;
  }
  // 각 시설의 출입구 및 벽 판정 (길이 연결된 정상 출입구만 통과 허용)
  function wallRects() {
    const rs = [];
    if (typeof TOWN === 'undefined') return rs;
    // 1. 병원 (동쪽 출입문)
    if (S.hosp && S.hosp.built && typeof HOSP_POS === 'function') {
      const hp = HOSP_POS();
      const connected = TOWN.isEntranceConnected(S, { accessX: hp.x1 + 1, accessY: hp.y + 3 });
      rs.push({
        k: 'hosp', x: hp.x, y: hp.y, w: hp.w, d: hp.d,
        check: (ix, iy, ox, oy) => connected && ix === hp.x1 && ox === hp.x1 + 1 && (iy === hp.y + 2 || iy === hp.y + 3)
      });
    }
    // 2. 카페 (동쪽 출입문)
    if (S.cafe && S.cafe.built && typeof CAFE_POS === 'function') {
      const cp = CAFE_POS();
      const connected = TOWN.isEntranceConnected(S, { accessX: cafeW(S) + 1, accessY: cp.y + cp.d - 1 });
      rs.push({
        k: 'cafe', x: cp.x, y: cp.y, w: cp.w, d: cp.d,
        check: (ix, iy, ox, oy) => connected && (
          (ix === cp.x + cp.w - 1 && ox === cp.x + cp.w && (iy === cp.y + cp.d - 2 || iy === cp.y + cp.d - 1)) ||
          (iy === cp.y + cp.d - 1 && oy === cp.y + cp.d && (ix === cp.x + cp.w - 2 || ix === cp.x + cp.w - 1))
        )
      });
    }
    // 3. 미용실 (동쪽 출입문)
    if (S.salon && S.salon.built && typeof SALON_POS === 'function') {
      const sp = SALON_POS();
      const connected = TOWN.isEntranceConnected(S, { accessX: sp.x + sp.w + 1, accessY: sp.y + sp.d - 2 });
      rs.push({
        k: 'salon', x: sp.x, y: sp.y, w: sp.w, d: sp.d,
        check: (ix, iy, ox, oy) => connected && ix === sp.x + sp.w - 1 && ox === sp.x + sp.w && (iy === sp.y + sp.d - 2 || iy === sp.y + sp.d - 1)
      });
    }
    // 4. 공원 (서쪽 출입구 & 남쪽 출입구 개별 판정)
    if (S.park && S.park.built && typeof PARK_POS === 'function') {
      const pp = PARK_POS();
      const westConn = TOWN.isEntranceConnected(S, { accessX: pp.x - 1, accessY: pp.y + 6 });
      const southConn = TOWN.isEntranceConnected(S, { accessX: pp.x + 8, accessY: pp.y + pp.d });
      rs.push({
        k: 'park', x: pp.x, y: pp.y, w: pp.w, d: pp.d,
        check: (ix, iy, ox, oy) => {
          if (westConn && ix === pp.x && ox === pp.x - 1 && (iy === pp.y + 6 || iy === pp.y + 7)) return true;
          if (southConn && iy === pp.y + pp.d - 1 && oy === pp.y + pp.d && (ix === pp.x + 8 || ix === pp.x + 9)) return true;
          return false;
        }
      });
    }
    // 5. 호수 (부두 서쪽 출입구 & 남쪽 산책로 출입구 개별 판정)
    if (S.village && S.village.lake && typeof VILLAGE !== 'undefined' && typeof VILLAGE.LAKE === 'function') {
      const lp = VILLAGE.LAKE();
      if (lp && lp.x < 1000) {
        const dockConn = TOWN.isEntranceConnected(S, { accessX: lp.x - 1, accessY: lp.y + 9 });
        const southConn = TOWN.isEntranceConnected(S, { accessX: lp.x + 8, accessY: lp.y + 16 });
        rs.push({
          k: 'lake', x: lp.x, y: lp.y, w: 18, d: 16,
          check: (ix, iy, ox, oy) => {
            if (dockConn && ix === lp.x && ox === lp.x - 1 && (iy >= lp.y + 8 && iy <= lp.y + 10)) return true;
            if (southConn && iy === lp.y + 15 && oy === lp.y + 16 && (ix === lp.x + 8 || ix === lp.x + 9)) return true;
            return false;
          }
        });
      }
    }
    // 6. 동물원 및 공공 건물 (동물원 게이트 및 시민 건물 문)
    const tdef = (typeof TOWN_DEF !== 'undefined' && TOWN_DEF) || (typeof TOWN !== 'undefined' && TOWN.DEF) || (typeof window !== 'undefined' && window.TOWN_DEF) || {};
    for (const o of (S.town && S.town.objs) || []) {
      if (o.k === 'zoo') {
        const zooConn = TOWN.isEntranceConnected(S, { accessX: o.x + 13, accessY: o.y + 22 });
        rs.push({
          k: 'zoo', x: o.x, y: o.y, w: 24, d: 22,
          check: (ix, iy, ox, oy) => zooConn && iy === o.y + 21 && oy === o.y + 22 && (ix >= o.x + 12 && ix <= o.x + 14)
        });
      } else if (tdef[o.k] && tdef[o.k].cat === 'civic') {
        const d = tdef[o.k];
        const pt = TOWN.rotPt(o, Math.floor(d.w / 2), d.d, d.w, d.d);
        const civConn = TOWN.isEntranceConnected(S, { accessX: pt.x, accessY: pt.y });
        rs.push({
          k: o.k, x: o.x, y: o.y, w: d.w, d: d.d,
          check: (ix, iy, ox, oy) => civConn && (
            (ix === pt.x && iy === pt.y - 1 && ox === pt.x && oy === pt.y) ||
            (ix === pt.x && iy === pt.y && ox === pt.x && oy === pt.y + 1)
          )
        });
      }
    }
    return rs;
  }
  function wallStep(rs, ax, ay, bx, by) {
    for (const R of rs) {
      const ia = ax >= R.x && ax < R.x + R.w && ay >= R.y && ay < R.y + R.d;
      const ib = bx >= R.x && bx < R.x + R.w && by >= R.y && by < R.y + R.d;
      if (ia === ib) continue;
      const ox = ia ? bx : ax, oy = ia ? by : ay;
      const ix = ia ? ax : bx, iy = ia ? ay : by;
      if (R.check && R.check(ix, iy, ox, oy)) continue;
      return true;
    }
    return false;
  }
  // A* over the tile grid. PERF (v9.69): binary heap + numeric keys + a per-search walkability memo (was: re-sorting the
  // whole open list every step and scanning it linearly -- quadratic on the big village map). Same moves, costs and rules.
  function findPath(sx, sy, tx, ty, allowDelivery) {
    sx = Math.floor(sx); sy = Math.floor(sy);
    wctx = null; // fresh walk context for every search (a tap handler may have just moved furniture between frames)
    const wr = wallRects();
    if (!walk(tx, ty, allowDelivery)) {
      // blocked target: snap to the nearest free tile on the SAME side (nearestFree only knows the shop interior)
      const inside = tx >= 0 && ty >= 0 && tx < W() && ty < H();
      let n = inside ? nearestFree(tx, ty) : null;
      if (!n && !inside) { let bd = 1e9; for (let r = 1; r <= 8 && !n; r++) for (let dx = -r; dx <= r; dx++) for (let dy2 = -r; dy2 <= r; dy2++) { if (Math.max(Math.abs(dx), Math.abs(dy2)) !== r || !walk(tx + dx, ty + dy2, allowDelivery)) continue; const d = Math.hypot(dx, dy2); if (d < bd) { bd = d; n = { x: tx + dx, y: ty + dy2 }; } } }
      if (!n) return null; tx = n.x; ty = n.y;
    }
    const OFF = 200, K = 1024, key = (x, y) => (x + OFF) * K + (y + OFF);
    const wm = new Map(), wk = (x, y) => { const kk = key(x, y); let v = wm.get(kk); if (v === undefined) { v = walk(x, y, allowDelivery); wm.set(kk, v); } return v; };
    const g = new Map(), came = new Map(), closed = new Set();
    // binary min-heap of [f, x, y, seq] (seq keeps ties in insertion order, like the old stable sort)
    const heap = []; let seq = 0;
    const less = (a, b) => a[0] < b[0] || (a[0] === b[0] && a[3] < b[3]);
    const push = e => { heap.push(e); let i = heap.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (!less(heap[i], heap[p])) break; [heap[i], heap[p]] = [heap[p], heap[i]]; i = p; } };
    const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < heap.length && less(heap[l], heap[m])) m = l; if (r < heap.length && less(heap[r], heap[m])) m = r; if (m === i) break; [heap[i], heap[m]] = [heap[m], heap[i]]; i = m; } } return top; };
    g.set(key(sx, sy), 0); push([Math.hypot(tx - sx, ty - sy), sx, sy, seq++]);
    let n = 0;
    const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
    let closestNode = null, closestDist = Math.hypot(tx - sx, ty - sy);
    while (heap.length && n < 8000) {
      const [, x, y] = pop(), kc = key(x, y);
      if (closed.has(kc)) continue; closed.add(kc); n++;
      const distToTarget = Math.hypot(tx - x, ty - y);
      if (distToTarget < closestDist) {
        closestDist = distToTarget;
        closestNode = [x, y];
      }
      if (x === tx && y === ty) {
        const path = [[x, y]]; let k = kc;
        while (came.has(k)) { const p = came.get(k); path.unshift(p); k = key(p[0], p[1]); }
        path.shift(); return path.map(([a, b]) => ({ x: a + .5, y: b + .5 }));
      }
      const gc = g.get(kc);
      for (const [dx, dy] of DIRS) {
        const nx = x + dx, ny = y + dy, kn = key(nx, ny);
        if (closed.has(kn) || !wk(nx, ny)) continue;
        if (dx && dy && (!wk(x + dx, y) || !wk(x, y + dy))) continue;
        if (wr.length && wallStep(wr, x, y, nx, ny)) continue;
        // v2026-10-08 (되돌림): 대각선 비용을 2.05로 올렸더니 "이제 다 대각선으로만 걸어"라는
        // 정반대의 결과가 나왔음 -- 원인은 이 게임의 등각(isometric) 화면에서는 격자 한 축으로만
        // 똑바로 이동(예: 격자 x로만 이동)하는 게 화면에는 "대각선"으로 보이고, 반대로 격자 두 축을
        // 동시에 움직이는 진짜 대각선 이동이 화면에는 "앞/뒤"(부호 같음) 또는 "옆"(부호 반대)으로
        // 보이기 때문. 즉 길찾기가 격자-대각선을 많이 쓰는 게 오히려 화면상 앞/뒤/옆 모습을 만들어주는
        // 정상 동작이었고, 직선(격자 한 축) 위주로 바꾼 게 전부 "대각선 포즈"로 보이게 만든 원인이었음.
        // 원래 비용(1.414, 이론상 최단거리)으로 되돌림.
        const ng = gc + (dx && dy ? 1.414 : 1);
        if (ng < (g.has(kn) ? g.get(kn) : 1e9)) { g.set(kn, ng); came.set(kn, [x, y]); push([ng + Math.hypot(tx - nx, ty - ny), nx, ny, seq++]); }
      }
    }
    // 대상 타일까지 완전히 연결되지 않은 경우, 현재 길을 따라 목적지 방향으로 갈 수 있는 끝 지점까지의 부분 경로 생성
    if (closestNode && closestDist < Math.hypot(tx - sx, ty - sy) - 0.8) {
      const path = [[closestNode[0], closestNode[1]]]; let k = key(closestNode[0], closestNode[1]);
      while (came.has(k)) { const p = came.get(k); path.unshift(p); k = key(p[0], p[1]); }
      path.shift();
      if (path.length > 0) {
        const res = path.map(([a, b]) => ({ x: a + .5, y: b + .5 }));
        res.isPartial = true;
        return res;
      }
    }
    return null;
  }
  function nearestFree(tx, ty) {
    let best = null, bd = 1e9;
    for (let x = -1; x <= W(); x++) for (let y = -1; y <= H(); y++) {
      if (!walk(x, y) || x >= W() || y >= H() || x < 0 || y < 0) continue;
      const d = Math.hypot(x - tx, y - ty); if (d < bd) { bd = d; best = { x, y }; }
    }
    return best;
  }
  const freeInside = () => { const out = []; for (let x = 0; x < W(); x++) for (let y = 0; y < H(); y++) if (walk(x, y)) out.push({ x, y }); return out; };

  // ---------- actors ----------
  function mkActor(id, type, x, y, extra) {
    const a = Object.assign({ id, type, x, y, ox: x, oy: y, path: [], dir: 1, face: 0, moving: false, speed: 2.4, t: Math.random() * 10, idle: 0 }, extra || {});
    actors.set(id, a); return a;
  }
  function goTo(a, tx, ty, cb) {
    const allowDelivery = a.type === 'me' || a.type === 'staff';
    const p = findPath(a.x, a.y, Math.floor(tx), Math.floor(ty), allowDelivery);
    a.path = p || []; a.cb = cb || null;
    a.tx = Math.floor(tx); a.ty = Math.floor(ty);
    a.partialEnd = !!(p && p.isPartial);
    if (!a.path.length) {
      if (Math.hypot(a.x - tx, a.y - ty) < 1.2) {
        if (cb) { a.cb = null; cb(); }
      } else {
        a.cb = null;
        a.say = (typeof t === 'function' && t('roadNone')) || '길이 없어요 😢';
        a.sayT = 2.8;
        a._retryTarget = { tx: a.tx, ty: a.ty, cb };
        a._retryWait = 0;
      }
    }
  }
  function stepActor(a, dt) {
    a.t += dt;
    if (a.eating > 0) { a.eating -= dt; if (a.eating <= 0 && a.afterEat) { const f0 = a.afterEat; a.afterEat = null; f0(); } }
    if (a.ordT > 0) { a.ordT -= dt; if (a.ordT <= 0 && a.afterOrd) { const f2 = a.afterOrd; a.afterOrd = null; f2(); } }
    if (a.payT > 0) { a.payT -= dt; if (a.payT <= 0 && a.afterPay) { const f1 = a.afterPay; a.afterPay = null; f1(); } }
    if (a.farmAction) { a.farmAction.t += dt; if (a.farmAction.t > (a.farmAction.kind === 'harvest' ? .5 : .45)) { a.farmAction = null; if (a.type === 'me' || a.type === 'hstaff') a.diag = 0; } }
    if (a.harvMsg) { a.harvMsg.t -= dt; if (a.harvMsg.t <= 0) a.harvMsg = null; }
    if (a.path.length) {
      const n = a.path[0], dx = n.x - a.x, dy = n.y - a.y, d = Math.hypot(dx, dy), s = a.speed * dt;
      // 길 단절 감지: 이동 중 길이 삭제되거나 끊겼을 때
      const allowDelivery = a.type === 'me' || a.type === 'staff';
      if (!walk(Math.floor(n.x), Math.floor(n.y), allowDelivery)) {
        a.say = (typeof t === 'function' && t('roadCut')) || '길이 끊겼어요! ⚠️';
        a.sayT = 3.5;
        // 새로 길이 생겼는지 목적지 방향으로 우회로 탐색
        if (a.tx != null && a.ty != null) {
          const newP = findPath(a.x, a.y, a.tx, a.ty, allowDelivery);
          if (newP && newP.length && !newP.isPartial) {
            a.path = newP;
            return;
          }
        }
        // 길이 완전히 끊겼으면 멈추고 뒤로 돌아가기 (귀가 또는 출발지로 유턴)
        a.path = [];
        a.moving = false;
        a._roadBlocked = true;
        a._retryTarget = (a.tx != null && a.ty != null) ? { tx: a.tx, ty: a.ty, cb: a.cb } : null;
        if (a.type === 'vil' && a.home && S && S.town && S.town.objs) {
          const h = S.town.objs.find(o => o.id === a.home);
          if (h && typeof TOWN !== 'undefined' && TOWN.doorOf) {
            const hd = TOWN.doorOf(h);
            const homeP = findPath(a.x, a.y, hd.x, hd.y, false);
            if (homeP && homeP.length) { a.st = 'back'; a.path = homeP; a.moving = true; }
          }
        } else if (a.type === 'cust' || a.type === 'cafeguest' || a.type === 'patient') {
          // 손님은 길이 끊기면 돌아가기
          const vS = (typeof VILLAGE_S_MAX === 'function') ? VILLAGE_S_MAX() : 30;
          const vY0 = (typeof VILLAGE_Y0 !== 'undefined') ? VILLAGE_Y0 : -22;
          const backY = a.y > 10 ? vS - 2 : vY0 + 2;
          const backP = findPath(a.x, a.y, Math.floor(a.x), Math.floor(backY), false);
          if (backP && backP.length) { a.path = backP; a.moving = true; }
        }
        return;
      }
      a.moving = true;
      // v2026-10-08 (되돌림): "최종 목적지 기준" 포즈 계산이 더 엉망으로 만들어서(일부는 계속 정면만,
      // 더 심한 지그재그) 바로 전 단계의 검증된 버전(다음 한 칸 기준, 화면투영 공식)으로 되돌림.
      // 더 이상 포즈 계산 방식을 손대지 않음 -- 이게 세션 내내 실제로 안정적으로 동작을 확인했던 버전.
      const sdx = dx - dy, sdy = dx + dy, adx = Math.abs(sdx), ady = Math.abs(sdy);
      if (adx > .2 * d) a.dir = sdx > 0 ? 1 : -1;
      const diag = Math.min(adx, ady) > .5 * Math.max(adx, ady) && adx > .35 * d && ady > .35 * d;
      a.diag = diag;
      if (diag) { a.face = 3; a.faceBack = sdy < 0; }
      else { a.faceBack = false; if (adx > 1.15 * ady) a.face = 2; else if (ady > .2 * d) a.face = sdy < 0 ? 1 : 0; }
      if (d <= s) {
        a.x = n.x; a.y = n.y; a.path.shift();
        if (!a.path.length) {
          a.moving = false;
          if (a.partialEnd) {
            a.partialEnd = false;
            a.cb = null;
            if (a.type === 'vil' || a.type === 'me' || a.type === 'cust') {
              a.say = (typeof t === 'function' && t('roadNone')) || '길이 없어요 😢';
              a.sayT = 3.2;
            }
          } else {
            const cb = a.cb; a.cb = null; if (cb) cb();
          }
        }
      }
      else { a.x += dx / d * s; a.y += dy / d * s; }
    } else {
      a.moving = false;
      if (a._retryTarget) {
        a._retryWait = (a._retryWait || 0) + dt;
        if (a._retryWait > 1.0) {
          a._retryWait = 0;
          const allowDelivery = a.type === 'me' || a.type === 'staff';
          const retryP = findPath(a.x, a.y, a._retryTarget.tx, a._retryTarget.ty, allowDelivery);
          if (retryP && retryP.length && !retryP.isPartial) {
            a.path = retryP;
            a.moving = true;
            a.cb = a._retryTarget.cb;
            a._retryTarget = null;
            a._roadBlocked = false;
            a._noPathTries = 0;
            a.say = null;
          } else {
            a._noPathTries = (a._noPathTries || 0) + 1;
            if (a._noPathTries >= 8) {
              a._noPathTries = 0;
              const rt = a._retryTarget;
              a._retryTarget = null;
              a._roadBlocked = false;
              a.say = (typeof t === 'function' && t('roadGiveUp')) || '돌아갈게요 ↩️';
              a.sayT = 2.6;
              const backP = (a.ox != null && a.oy != null) ? findPath(a.x, a.y, Math.floor(a.ox), Math.floor(a.oy), allowDelivery) : null;
              if (backP && backP.length) { a.path = backP; a.moving = true; a.cb = null; }
              else if (rt && rt.cb) { rt.cb(); }
            }
          }
        }
      }
      if (a.seatAt) { const dx = a.seatAt.x - a.x, dy = a.seatAt.y - a.y, d = Math.hypot(dx, dy), s = 1.6 * dt; if (d <= s) { a.x = a.seatAt.x; a.y = a.seatAt.y; } else { a.x += dx / d * s; a.y += dy / d * s; a.face = 0; } } // slide back onto the seat
    }
  }

  // ---- pet behaviour helpers ----
  const penItem = () => S.items.find(i => isPenKind(i.k));
  function stepFree(a, dt) { // straight-line movement (inside pen / hotel / escape)
    if (a.fx == null) { a.moving = false; return true; }
    const dx = a.fx - a.x, dy = a.fy - a.y, d = Math.hypot(dx, dy), s = a.speed * dt;
    if (d < .03) { a.fx = null; a.moving = false; return true; }
    a.moving = true;
    const sdx2 = dx - dy, sdy2 = dx + dy, adx2 = Math.abs(sdx2), ady2 = Math.abs(sdy2);
    if (adx2 > .2 * d) a.dir = sdx2 > 0 ? 1 : -1;
    const diag2 = Math.min(adx2, ady2) > .5 * Math.max(adx2, ady2) && adx2 > .35 * d && ady2 > .35 * d;
    a.diag = diag2;
    if (diag2) { a.face = 3; a.faceBack = sdy2 < 0; }
    else { a.faceBack = false; a.face = adx2 > 1.15 * ady2 ? 2 : (sdy2 < 0 ? 1 : 0); }
    if (d <= s) { a.x = a.fx; a.y = a.fy; a.fx = null; } else { a.x += dx / d * s; a.y += dy / d * s; }
    return false;
  }
  const TSPEED = { energetic: 2.1, playful: 1.9, lazy: .9, calm: 1.1, shy: 1.5 };
  function custNear(a, r) { for (const b of actors.values()) if (b.type === 'cust' && b.inside && Math.hypot(b.x - a.x, b.y - a.y) < r) return b; return null; }
  function petBrain(a, p, hab, dt) {
    const w = W(), h = H();
    a.speed = (TSPEED[p.trait] || 1.4) * (p.escaped ? 1.8 : 1);
    if (a.trick) { a.trick.t += dt; if (a.trick.t > 2.6) a.trick = null; a.path = []; a.fx = null; return; }
    if (a.walkCust) { if (!a.path.length) { a.walkCust = null; } return; }
    if (a.poopUntil > T) { a.path = []; a.fx = null; a.moving = false; return; } // v1.19: squatting
    if (a.walkPoop) { if (!a.path.length && T - (a.wpT || (a.wpT = T)) > .5) { a.walkPoop = 0; a.wpT = 0; } return; }
    // escaped pet: runs around the room
    if (p.escaped) { if (stepFree(a, dt)) { const fr = freeInside(); const t = fr[Math.floor(Math.random() * fr.length)]; if (t) { a.fx = t.x + .5; a.fy = t.y + .5; } } a.inPen = false; return; }
    // play pen
    const pen = penItem();
    if (p.pen && pen) {
      const pd = FURN.fp(pen), pw = pd.w || 3, ph = pd.d || 3;
      if (!a.inPen) { a.inPen = true; a.x = pen.x + pw / 2; a.y = pen.y + ph / 2; a.fx = null; a.path = []; }
      a.sleep = false;
      if (stepFree(a, dt)) {
        a.idle -= dt;
        if (a.idle <= 0) {
          a.idle = .5 + Math.random() * (p.trait === 'lazy' ? 6 : 2.5);
          const r = Math.random();
          if (r < .25) { a.slide = 1.2; a.x = pen.x + .9; a.y = pen.y + .6; a.fx = pen.x + pw - .9; a.fy = pen.y + .7; }
          else if (r < .4 && (p.trait === 'lazy' || p.trait === 'calm')) { a.sleep = true; a.idle = 6; }
          else { a.fx = pen.x + .35 + Math.random() * (pw - .7); a.fy = pen.y + .35 + Math.random() * (ph - .7); }
          if (Math.random() < .3) a.happyT = 1;
        }
      }
      if (a.slide > 0) a.slide -= dt;
      return;
    }
    if (a.inPen) { a.inPen = false; if (hab) { a.x = hab.x + .5; a.y = hab.y + .5; } const n = nearestFree(a.x, a.y); if (n) { a.x = n.x + .5; a.y = n.y + .5; } }
    if (a.fx != null) { stepFree(a, dt); return; }
    if (a.path.length) return;
    a.idle -= dt;
    if (a.scared > 0) { a.scared -= dt; return; }
    const sleepy = p.happy < 25 || p.hunger < 20 || (p.trait === 'lazy' && a.lazyT > 0);
    if (p.trait === 'lazy') { a.lazyT = (a.lazyT || 0) - dt; if (a.lazyT < -25) a.lazyT = 12; }
    if (sleepy && hab) { if (!a.sleep) goTo(a, hab.x + (hab.x + 1 < w ? 1 : -1), hab.y, () => { a.sleep = true; }); return; }
    a.sleep = false;
    if (p.trait === 'shy') { const cu = custNear(a, 2.2); if (cu && hab) { a.scared = 3; a.bubble = '💦'; a.bubT = 2; goTo(a, hab.x + (hab.x + 1 < w ? 1 : -1), hab.y); return; } }
    if (a.idle > 0) return;
    const fr = freeInside();
    const near = fr.filter(t => Math.hypot(t.x - a.x, t.y - a.y) < 5);
    switch (p.trait) {
      case 'sweet': { const tgt = custNear(a, 6) || (me && me.x >= 0 && me.y >= 0 && me.x < w && me.y < h ? me : null); a.idle = 3 + Math.random() * 3; if (tgt) goTo(a, Math.max(0, Math.min(w - 1, Math.floor(tgt.x) + (Math.random() < .5 ? 1 : -1))), Math.max(0, Math.min(h - 1, Math.floor(tgt.y))), () => { a.happyT = 1.5; a.bubble = '💗'; a.bubT = 1.5; }); return; }
      case 'curious': { const its = S.items.filter(i => i.k !== 'hab'); const it = its[Math.floor(Math.random() * its.length)]; a.idle = 4 + Math.random() * 3; if (it) { const t = nearestFree(it.x, it.y + 1); if (t) goTo(a, t.x, t.y, () => { a.bubble = Math.random() < .5 ? '❓' : '❗'; a.bubT = 1.6; }); } return; }
      case 'glutton': { a.idle = 3 + Math.random() * 4; if (p.hunger < 70) { a.bubble = '🍖'; a.bubT = 2; } break; }
      case 'playful': case 'energetic': { a.idle = 1.2 + Math.random() * 2; const far = fr.filter(t => Math.hypot(t.x - a.x, t.y - a.y) > 2.5); const t = far[Math.floor(Math.random() * far.length)]; if (t) { goTo(a, t.x, t.y, () => { if (Math.random() < .5) { a.hop = .6; a.happyT = .8; } }); return; } break; }
      case 'calm': a.idle = 6 + Math.random() * 6; break;
      default: a.idle = 3 + Math.random() * 5;
    }
    const t = near[Math.floor(Math.random() * near.length)];
    if (t) goTo(a, t.x, t.y);
  }
  function faceTo(a, tx, ty) {
    const sdx = (tx - a.x) - (ty - a.y);
    const sdy = (tx - a.x) + (ty - a.y);
    const adx = Math.abs(sdx), ady = Math.abs(sdy);
    if (adx > 0.05) a.dir = sdx > 0 ? 1 : -1;
    const diag = Math.min(adx, ady) > .5 * Math.max(adx, ady) && adx > .2 && ady > .2;
    a.diag = diag;
    if (diag) { a.face = 3; a.faceBack = sdy < 0; }
    else { a.faceBack = false; a.face = adx > 1.2 * ady ? 2 : (sdy < 0 ? 1 : 0); }
  }
  function sync(dt) {
    buildOcc();
    const w = W(), h = H(), door = DOOR();
    if (!me) { me = mkActor('me', 'me', w - 2.5, h - 3.5, { speed: 5.25 }); }
    const alive = new Set();
    // pets
    S.pets.forEach((p, slot) => {
      if (!p) return; alive.add('p' + p.id);
      const hab = G.habItem(S, slot);
      let a = actors.get('p' + p.id);
      if (!a) a = mkActor('p' + p.id, 'pet', hab ? hab.x + .5 : w / 2, hab ? hab.y + .5 : h / 2, { speed: 1.4 });
      a.pet = p; a.slot = slot; a.hab = hab;
      // cage-kind pets (rats/rodents) stay inside like birds/fish/reptiles do, instead of roaming
      // the floor like dogs/cats/rabbits -- roams() alone put them in the wrong bucket
      a.inHab = (!ART.roams(p.sp) || ART.habitatKind(p.sp) === 'cage') && !p.escaped;
      if (a.bubT > 0) a.bubT -= dt;
      if (a.hop > 0) a.hop -= dt;
      if (a.inHab) { if (hab) { a.x = hab.x + .5; a.y = hab.y + .5; } a.path = []; a.sleep = p.happy < 25 || p.hunger < 20; if (a.trick) { a.trick.t += dt; if (a.trick.t > 2.6) a.trick = null; } return; }
      petBrain(a, p, hab, dt);
    });
    // hotel guests
    const hotels = S.items.filter(i => i.k === 'hotel');
    (S.guests || []).forEach((g, i) => {
      const id = 'g' + g.id; alive.add(id);
      const ho = hotels[Math.floor(i / 2)] || hotels[0]; if (!ho) return;
      let a = actors.get(id);
      if (!a) a = mkActor(id, 'guest', ho.x + .6 + (i % 2) * .8, ho.y + 1.2, { speed: 1, pet: { sp: g.sp, grow: 1, name: g.name } });
      a.guest = g; a.ho = ho;
      if (stepFree(a, dt)) { a.idle -= dt; if (a.idle <= 0) { a.idle = 2 + Math.random() * 4; a.fx = ho.x + .35 + Math.random() * 1.3; a.fy = ho.y + .5 + Math.random() * 1.2; } }
      a.sleep = g.happy < 30;
    });
    // customers
    const payers = S.customers.filter(c => c.st === 'pay');
    const queue = G.counterQueue(S);
    const pen = penItem();
    for (const cu of S.customers) {
      const id = 'c' + cu.id; alive.add(id);
      let a = actors.get(id);
      if (!a) {
        const fromTop = cu.id % 2;
        const look = ART.randomHuman(cu.seed || cu.id);
        if (cu.type === 'rich') { look.top = 'jacket'; look.jacket = '#2b2d42'; look.hat = look.hat || 'beret'; look.necklace = true; }
        if (cu.type === 'celeb') { look.glasses = 2; look.top = 'jacket'; look.jacket = '#e63946'; look.hat = null; }
        if (cu.type === 'breeder') { look.top = 'overall'; look.hat = 'straw'; }
        if (cu.type === 'family') { look.top = 'jacket'; look.jacket = '#6ab04c'; look.hat = null; }
        if (cu.type === 'collector') { look.top = 'jacket'; look.jacket = '#5a4a7a'; look.glasses = 1; look.hat = 'beret'; }
        if (cu.type === 'vip') { look.top = 'jacket'; look.jacket = '#c9a227'; look.glasses = 2; look.hat = 'crown'; look.necklace = true; } // 👑 VIP: gold suit + crown
        { const sn = seasonOf(); if (sn && (cu.seed || cu.id) % 10 < 4) { look.hat = SEASON_HAT[sn]; look.hatc = '#ef8fa8'; } }
        // arrive from the far end of the street, not out of thin air mid-road ("갑자기 중간에 나타나")
        const hm = cu.home && TOWN.objs().find(o => o.id === cu.home), hd = hm && TOWN.doorOf(hm); // PET TOWN: villagers walk over from their own house
        a = mkActor(id, 'cust', hd ? hd.x + .5 : w + 1.5 + (cu.id % 2), hd ? hd.y + .5 : fromTop ? VILLAGE_N : villageS(), { look, speed: 1.7 + (cu.id % 3) * .15, baseSpeed: 1.7 + (cu.id % 3) * .15, cust: cu, inside: false });
        if (cu.vsp) a.hold = { sp: cu.vsp, grow: 1 };
        SFX.door && setTimeout(() => SFX.door(), 1200);
        goTo(a, door.x + 1, door.y, () => goTo(a, door.x, door.y, () => { a.inside = true; }));
      }
      a.cust = cu;
      if (cu.pd) a.hold = cu.pd;
      if (cu.st === 'pickup' && !a.hold && a.arrived) a.hold = { sp: cu.vsp, grow: 1 };
      if (a.lastSt !== cu.st) { a.lastSt = cu.st; a.planned = false; a.arrived = false; }
      if (a.sadT > 0) a.sadT -= dt;
      if (cu.wowT > 0) { cu.wowT -= dt; a.wow = 1; } else a.wow = 0;
      if (!a.inside || a.path.length) continue;
      if (cu.st === 'want') {
        if (cu.watch > 0 && pen) {
          const pd = FURN.fp(pen), pw = pd.w || 3, ph = pd.d || 3;
          if (!a.watching) { a.watching = true; a.arrived = false; const spots = []; for (let x = pen.x - 1; x <= pen.x + pw; x++) for (const y of [pen.y + ph, pen.y - 1]) spots.push({ x, y }); for (let y = pen.y; y < pen.y + ph; y++) spots.push({ x: pen.x + pw, y }, { x: pen.x - 1, y }); const ok = spots.filter(t => walk(t.x, t.y) && t.x >= 0 && t.y >= 0 && t.x < w && t.y < h); const t = ok[Math.floor(Math.random() * ok.length)]; if (t) goTo(a, t.x, t.y, () => { a.arrived = true; a.face = 1; a.dir = (pen.x + pw / 2 - a.x) - (pen.y + ph / 2 - a.y) > 0 ? 1 : -1; }); else a.arrived = true; }
          continue;
        }
        if (a.watching) { a.watching = false; a.planned = false; }
        if (!a.planned) {
          a.planned = true;
          const match = S.pets.map((p, i) => [p, i]).filter(([p]) => p && G.matches(cu, p));
          let spot = null;
          if (match.length) { const hab = G.habItem(S, match[0][1]); if (hab) spot = nearestFree(hab.x + 1, hab.y + 1); }
          if (!spot) { const fr = freeInside(); spot = fr[Math.floor(Math.random() * fr.length)]; }
          if (spot) goTo(a, spot.x, spot.y, () => { a.arrived = true; a.dir = -1; a.wander = 4 + Math.random() * 4; });
        } else if (cu.willLeave && a.arrived) {
          a.wander -= dt;
          if (a.wander <= 0) { const fr = freeInside(); const sp = fr[Math.floor(Math.random() * fr.length)]; a.wander = 5 + Math.random() * 4; if (sp && Math.hypot(sp.x - a.x, sp.y - a.y) < 4) goTo(a, sp.x, sp.y); }
        }
      } else if (cu.st === 'shop') {
        if (!a.planned) { a.planned = true; const shs = S.items.filter(i => G.GOODS_[i.k]); const sh = shs[cu.id % Math.max(1, shs.length)]; const t = sh ? nearestFree(sh.x + 1, sh.y + 1) : freeInside()[0]; if (t) goTo(a, t.x, t.y, () => { a.face = 1; a.arrived = true; }); }
      } else if (cu.st === 'gwait') {
        if (!a.planned) { a.planned = true; const gt = S.items.find(i => i.k === 'groomtable'); const t = gt ? nearestFree(gt.x + 1, gt.y) : null; if (t) goTo(a, t.x, t.y, () => { a.arrived = true; a.dir = -1; }); else a.arrived = true; }
      } else if (cu.st === 'pickup') {
        if (!a.planned) { a.planned = true; const ho = S.items.find(i => i.k === 'hotel'); const t = ho ? nearestFree(ho.x + 2, ho.y + 1) : null; if (t) goTo(a, t.x, t.y, () => { a.arrived = true; }); else a.arrived = true; }
      } else if (cu.st === 'pay') {
        const i = Math.min(payers.indexOf(cu), queue.length - 1), q = queue[Math.max(0, i)];
        if (q && (Math.floor(a.x) !== q.x || Math.floor(a.y) !== q.y)) goTo(a, q.x, q.y, () => { a.arrived = true; a.face = 1; a.dir = 1; });
        else a.arrived = true;
      }
    }
    // staff NPCs
    for (const skey in (S.staff || {})) {
      const m = S.staff[skey], role = staffRoleOf(skey), id = 'sf_' + skey; alive.add(id);
      let a = actors.get(id);
      if (!a) { const R = STAFF_ROLES.find(r => r.id === role); if (!m.seed) m.seed = (ART.hashStr(skey) % 99999) + 1; /* v1.100.35: 예전 저장 데이터엔 seed가 없어서 모든 직원이 똑같은 모습(randomHuman(3))으로 보이던 문제 -> 직원별 고유 고정 시드 부여 */ const lk = ART.randomHuman(m.seed); lk.top = 'tee'; lk.shirt = '#ffffff'; lk.apron = R.col; lk.hat = 'cap'; lk.hatc = R.col; lk.kid = false; lk.old = false; applyStaffArt(lk, m.seed, role === 'sales'); a = mkActor(id, 'staff', door.x, door.y, { look: lk, role, inside: true, idle: 1 }); }
      a.m = m; a.speed = 1.6 + m.lv * .3;
      if (m.job && a.jobId !== m.job.id) { a.jobId = m.job.id; goTo(a, m.job.x, m.job.y); }
      if (!m.job && !a.path.length) {
        if (role === 'groomer') {
          // User Request 7: Groomer staff stays strictly stationed at the grooming table
          const tb = S.items.find(i => i.k === 'groomtable');
          if (tb) {
            const gx = tb.x, gy = tb.y + 1;
            if (Math.hypot(a.x - gx, a.y - gy) > 0.8) {
              goTo(a, gx, gy, () => { a.face = 1; a.dir = -1; });
            } else {
              a.face = 1; a.dir = -1; a.idle = 999;
            }
          }
        } else {
          a.idle -= dt; if (a.idle <= 0) { a.idle = 4 + Math.random() * 5; const fr = freeInside(); const t = fr[Math.floor(Math.random() * fr.length)]; if (t) goTo(a, t.x, t.y); }
        }
      }
    }
    // regular customer (story) NPC
    const vis = S.x && S.x.visitor;
    if (vis) {
      const id = 'reg_' + vis.rid; alive.add(id);
      let a = actors.get(id);
      if (!a) { const R = REGS.find(r => r.id === vis.rid); a = mkActor(id, 'reg', w + 1.5, VILLAGE_N, { look: R.look, speed: 1.3, baseSpeed: 1.3, inside: false, rid: vis.rid }); goTo(a, door.x + 1, door.y, () => goTo(a, door.x, door.y, () => { a.inside = true; const cnt = S.items.find(i => i.k === 'counter'); const t = cnt ? nearestFree(cnt.x - 1, cnt.y + 1) : null; if (t) goTo(a, t.x, t.y, () => { a.face = 0; }); })); }
    }
    // inspector NPC
    if (S.event && S.event.k === 'inspect') {
      alive.add('insp');
      let a = actors.get('insp');
      if (!a) { const lk = ART.randomHuman(S.event.seed || 5); lk.top = 'jacket'; lk.jacket = '#3d405b'; lk.shirt = '#ffffff'; lk.glasses = 2; lk.hat = null; a = mkActor('insp', 'insp', w + 1.5, VILLAGE_N, { look: lk, speed: 1.5, baseSpeed: 1.5, inside: false }); goTo(a, door.x + 1, door.y, () => goTo(a, door.x, door.y, () => { a.inside = true; })); }
      if (a.inside && !a.path.length) { a.idle = (a.idle || 0) - dt; if (a.idle <= 0) { a.idle = 3 + Math.random() * 3; const fr = freeInside(); const t = fr[Math.floor(Math.random() * fr.length)]; if (t) goTo(a, t.x, t.y, () => { a.bubble = '📋'; a.bubT = 2; }); } }
      if (a.bubT > 0) a.bubT -= dt;
    }
    // thief NPC
    if (S.event && S.event.k === 'thief') {
      alive.add('thief');
      let a = actors.get('thief');
      if (!a) {
        const lk = ART.randomHuman(S.event.seed || 9); lk.top = 'hoodie'; lk.shirt = '#2b2b33'; lk.pants = '#1a1a1f'; lk.hat = null; lk.bag = '#3a3a44';
        a = mkActor('thief', 'thief', w + 1.5, VILLAGE_N, { look: lk, speed: 1.7, baseSpeed: 1.7, inside: false, pid: S.event.pid });
        goTo(a, door.x + 1, door.y, () => goTo(a, door.x, door.y, () => {
          a.inside = true;
          const i = S.pets.findIndex(p => p && p.id === S.event.pid), hab = i >= 0 ? G.habItem(S, i) : null;
          const t = hab ? nearestFree(hab.x + 1, hab.y) : freeInside()[Math.floor(Math.random() * freeInside().length)];
          if (t) goTo(a, t.x, t.y, () => { a.bubble = '👀'; a.bubT = 2; });
        }));
      }
      if (a.inside && !a.path.length) { a.idle = (a.idle || 0) - dt; if (a.idle <= 0) { a.idle = 2 + Math.random() * 2; a.bubble = '👀'; a.bubT = 1.5; } }
      if (a.bubT > 0) a.bubT -= dt;
    }
    // café guests: one per pending order, walking in through the yard door to a seat instead of
    // just materializing already seated. Must run (and populate `alive`) BEFORE the cleanup loop
    // below -- it used to run after, so every existing guest read as "not alive yet this frame"
    // at cleanup time and got prematurely marked leaving, sent to an out-of-bounds spot
    // (cp.y-2, outside the yard's walkable range) that nearestFree() could only resolve by
    // routing her into the shop interior. That's why guests always beelined for the shop door
    // one frame after appearing instead of ever reaching their table.
    if (S.cafe && S.cafe.built) {
      const L = CAFE_LAYOUT(), tables = L.tables, usedSeat = new Set(S.cafe.orders.map(o => o.seat).filter(s => s != null));
      const tById = id => tables.find(t => t.id === id);
      S.cafe.orders.forEach(o => {
        const id = 'cg' + o.id; alive.add(id);
        let a = actors.get(id);
        // each guest owns one table (lowest free index) for as long as the order lives
        if (o.seat == null || !tById(o.seat)) { const fr = tables.find(t => !usedSeat.has(t.id)) || tables[0]; if (fr) { o.seat = fr.id; usedSeat.add(fr.id); } }
        const seat = tById(o.seat);
        if (!seat || seat.sx == null) return;
        // same look (seed) as the actual customer who bought a pet here, so this visibly reads
        // as "the person who just adopted from me, now at the café with their new pet"; they
        // arrive from the far end of the street (not out of thin air mid-road) and either keep
        // the pet at the table or drop it in the play yard first (o.petMode, random per guest)
        if (!a) {
          const look = ART.randomHuman(o.buyerSeed != null ? o.buyerSeed : o.id), sp = CAFE_SPAWN();
          a = mkActor(id, 'cafeguest', sp.x, sp.y, { look, speed: 2.3, buyerSp: o.buyerSp, petMode: o.petMode });
          const sit = () => goTo(a, seat.sx, seat.sy, () => { faceTo(a, seat.x + 1, seat.y + 1); const vx = seat.x + 1 - seat.sx, vy = seat.y + 1 - seat.sy, vl = Math.hypot(vx, vy) || 1; a.front = { x: seat.sx, y: seat.sy }; a.seatAt = { x: seat.sx + vx / vl * .55, y: seat.sy + vy / vl * .55 }; a.tbl = { x: seat.x + 1, y: seat.y + 1 }; if (a.order && !a.served) a.order.sat = true; if (a.afterSit) { const f3 = a.afterSit; a.afterSit = null; f3(); } }); // walk to the chair, then sit down at the table
          const next = () => { if (o.petMode === 'pen' && o.buyerSp) goTo(a, L.penGate.x, L.penGate.y, () => { a.petIn = true; sit(); }); else sit(); };
          // first the guest walks to the cashier's desk and orders (a cashier takes it in a moment; otherwise the owner does -- tap the guest to hurry)
          const dk = L.kit.find(k => k.k === 'cashdesk'); a.ordered = !dk;
          if (dk) goTo(a, dk.x + dk.w / 2, dk.y + 1.5, () => { faceTo(a, dk.x + dk.w / 2, dk.y); a.ordT = (S.cafe.staff || []).some(m => m.role === 'cashier') ? 2.4 : 6; a.afterOrd = () => { a.ordered = true; if (a.order) a.order.ord = true; next(); }; }); else { if (a.order) a.order.ord = true; next(); }
        }
        a.order = o; a.sit = !!a.seatAt && Math.hypot(a.seatAt.x - a.x, a.seatAt.y - a.y) < .06;
      });
      // guests at the slot machines (their meal is served; they walk over and play until their time is up)
      (S.cafe.players || []).forEach(pl => {
        const id = 'cg' + pl.id, sl = L.slots.find(x => x.i === pl.slot); if (!sl) return; alive.add(id);
        let a = actors.get(id);
        if (!a) a = mkActor(id, 'cafeguest', sl.fx + .5, sl.fy + .5, { look: ART.randomHuman(pl.buyerSeed != null ? pl.buyerSeed : pl.id), speed: 2.3, buyerSp: pl.buyerSp, petMode: pl.petMode, petIn: pl.petMode === 'pen' && !!pl.buyerSp });
        { const dn = (S.cafe.done || []).find(x => x.id === pl.id); if (dn && a.order && !a.order.paid) a.order.paid = dn.pay; }
        if (!a.order) a.mealDone = true; // (re)created at the machine, e.g. after reopening the app
        a.served = true;
        // v9.87: served guests first sit down and eat, pay at the desk, and only THEN go and play
        // (they used to be yanked toward the slot machine while the chair kept pulling them back: stuck at the table, no order bubble)
        if (!a.mealDone) { if (!a.mealStarted) { a.mealStarted = true; if (a.seatAt) cafeMeal(a); else a.afterSit = () => cafeMeal(a); } }
        else if (a.playSlot !== pl.slot) { a.playSlot = pl.slot; a.playing = false; goTo(a, sl.fx + .5, sl.fy + .5, () => { a.playing = true; a.dir = sl.f === 's' ? 1 : -1; a.face = 1; }); }
      });
      cafeStaffStep(L, dt, alive); // v9.89: the cook and the server really walk and work
    }
    // hospital: patients and staff are real actors that walk between the street, the reception, the lobby benches and the rooms
    if (S.hosp && S.hosp.built) {
      const L = HOSP_LAYOUT(), hp = S.hosp, P = hp.patients || [], spawn = CAFE_SPAWN();
      const deskQ = P.filter(p => p.ph === 'walkin' || p.ph === 'deskwait' || p.ph === 'deskserve' || p.ph === 'toDesk').sort((a, b) => ((a.ph === 'deskserve') ? 0 : 1) - ((b.ph === 'deskserve') ? 0 : 1) || a.id - b.id);
      const benchQ = P.filter(p => p.ph === 'bench').sort((a, b) => a.qt - b.qt), rc = L.reception;
      for (const p of P) {
        const id = 'hp' + p.id; alive.add(id);
        let a = actors.get(id);
        if (!a) { a = mkActor(id, 'patient', spawn.x, spawn.y, { look: ART.randomHuman(p.seed), speed: 2.3, baseSpeed: 2.3 }); if (p.ph !== 'walkin' && L.wait[0]) { a.x = L.wait[0].x; a.y = L.wait[0].y; } }
        a.pat = p;
        let tx = null, ty = null, fx = null, fy = null;
        let seat = null;
        if (p.ph === 'leaving') { tx = spawn.x; ty = spawn.y; }
        else if (p.ph === 'full' || (p.full && p.ph === 'walkin')) { tx = L.door.x - .5; ty = L.door.ys[0] + .5; fx = tx - 3; fy = ty; } // just inside the door: peeks in, sees the benches taken
        else if (p.ph === 'bench') {
          const i = benchQ.indexOf(p);
          if (L.seats.length) {
            const taken = new Set(); for (const [, o] of actors) if (o !== a && o.type === 'patient' && o.seatIdx != null) taken.add(o.seatIdx);
            if (a.seatIdx == null || a.seatIdx >= L.seats.length || taken.has(a.seatIdx)) { let k = 0; while (k < L.seats.length && taken.has(k)) k++; a.seatIdx = k % L.seats.length; }
            seat = L.seats[a.seatIdx];
            tx = seat.ox; ty = seat.oy;
            fx = tx; fy = seat.faceSouth ? ty + 3 : ty - 3; // walk to tile in front of bench
          } else { const w = L.wait[Math.min(L.wait.length - 1, 4 + i)] || { x: rc.x + .5, y: rc.y + 2.5 }; tx = w.x; ty = w.y; }
        }
        else if (p.stn && (p.ph === 'toStn' || p.ph === 'atStn' || p.ph === 'treat')) { const st = L.stations.find(z => String(z.id) === p.stn); if (st && st.sx != null) { tx = st.sx; ty = st.sy; fx = st.x + st.w / 2; fy = st.y + st.d / 2; } }
        if (tx == null) { const i = Math.max(0, deskQ.indexOf(p)), w = L.wait[Math.min(i, L.wait.length - 1)] || { x: rc.x + .5, y: rc.y + 1.5 }; tx = w.x; ty = w.y; fx = rc.x + rc.w / 2; fy = rc.y; }
        if (p.ph !== 'bench') a.seatIdx = null;
        const key = Math.floor(tx) + ',' + Math.floor(ty);
        if (a.tkey !== key) {
          a.tkey = key; a.arrived = false;
          if (a.seatAt) { a.x = a.seatAt.ox; a.y = a.seatAt.oy; a.seatAt = null; } // stand up: step off the bench first
          goTo(a, tx, ty, () => {
            a.arrived = true;
            if (seat) {
              a.seatAt = seat;
              a.face = seat.faceSouth ? 0 : 1; // User Request 4: Always face outward into the room, never facing the wall!
              a.faceBack = !seat.faceSouth;
            } else if (fx != null) faceTo(a, fx, fy);
          });
        }
        a.sit = !!a.seatAt && p.ph === 'bench' && Math.hypot(a.seatAt.x - a.x, a.seatAt.y - a.y) < .06;
        a.hold = (p.ph === 'atStn' || p.ph === 'treat') ? null : { sp: p.sp, grow: 1 };
        a.talk = p.ph === 'deskserve';
      }
      const ex0 = L.stations.find(z => z.k === 'exam'), tb0 = L.stations.find(z => z.k === 'tbed');
      const roleN = {};
      for (const m of hp.staff || []) {
        const id = 'hs' + m.id; alive.add(id);
        // v9.93: each staff member gets their OWN post -- two doctors used to stand on exactly the same tile (5 hired, 3 visible)
        const k = roleN[m.role] = (roleN[m.role] | 0) + 1, R = hospStaffRole(m.role), sp = hospSpecOf(hp, m, L), kinds = new Set(HOSP_TX.filter(x => R && sp.does.includes(x.id) && x.stn).map(x => x.stn)); // v9.96: posted in their own room
        const mine = L.stations.filter(z => kinds.has(z.k)), fb = m.role === 'doctor' ? (ex0 || rc) : (tb0 || ex0 || rc);
        const home = m.role === 'recept' ? rc : (mine.length ? mine[sp.k >= 0 ? 0 : (k - 1) % mine.length] : fb);
        let tgt = { x: home.px != null ? home.px : home.x + .5, y: home.py != null ? home.py : home.y + 1.5, fx: home.x + home.w / 2, fy: home.y + home.d / 2 };
        if (k > 1 && (m.role === 'recept' || mine.length < k)) { tgt.x += (k - 1) * (m.role === 'recept' ? -1 : 1); } // no spare station: stand beside the first one
        const p = m.pid != null && m.tt > 0 ? P.find(q => q.id === m.pid) : null;
        if (p) { if (p.ph === 'deskserve') tgt = { x: rc.px, y: rc.py, fx: rc.x + 1, fy: rc.y + 1.5 }; else if (p.stn) { const st = L.stations.find(z => String(z.id) === p.stn); if (st) tgt = { x: st.px != null ? st.px : st.sx, y: st.py != null ? st.py : st.sy, fx: st.x + st.w / 2, fy: st.y + st.d / 2 }; } }
        let a = actors.get(id);
        if (!a) { const lk = ART.randomHuman(m.seed); lk.hat = null; lk.top = 'jacket'; lk.jacket = m.role === 'nurse' ? '#f7c6d6' : '#ffffff'; lk.shirt = '#dff1fa'; applyStaffArt(lk, m.seed, false); a = mkActor(id, 'hstaff', tgt.x, tgt.y, { look: lk, speed: 2.6 }); }
        a.m = m; a.talk = !!p && a.arrived !== false && m.tt > 0;
        const key = Math.floor(tgt.x) + ',' + Math.floor(tgt.y);
        if (a.tkey !== key) { a.tkey = key; a.arrived = false; goTo(a, tgt.x, tgt.y, () => { a.arrived = true; faceTo(a, tgt.fx, tgt.fy); }); }
      }
    }
    // farmhands: they wait at the field's south edge and walk over to the plot they just worked on
    if (S.farm && S.farm.staff && S.farm.staff.length) {
      const fp = FARM_POS(W(), H());
      S.farm.staff.forEach((m, idx) => {
        const id = 'fs' + m.id; alive.add(id);
        const work = m.tt > 0 && m.px != null, tx = work ? m.px + .5 : fp.x + 1.5 + idx * 2, ty = work ? m.py + .5 : fp.y + fp.d + .5;
        let a = actors.get(id);
        if (!a) { const lk = ART.randomHuman(m.seed); lk.hat = '#e8c66a'; lk.top = 'tee'; lk.shirt = ['#8bc34a', '#4fc3f7', '#ffb74d', '#f48fb1'][(m.id - 1) % 4 | 0] || '#8bc34a'; applyStaffArt(lk, m.seed, false); a = mkActor(id, 'hstaff', tx, ty, { look: lk, speed: 2.6 }); }
        a.m = m; a.talk = !!work;
        const key = Math.floor(tx) + ',' + Math.floor(ty);
        if (a.tkey !== key) { a.tkey = key; goTo(a, tx, ty); }
        // Trigger hoeing (till) and watering (water) animations & particles for farm staff just like player!
        if (work && !a.moving && Math.hypot(a.x - tx, a.y - ty) < 1.1) {
          const rawAct = m.act || m.jk || 'till';
          const toolKind = rawAct === 'water' ? 'water' : rawAct === 'harvest' ? 'harvest' : (rawAct === 'plant' && !m.pre && m.tt < 1.1) ? 'plant' : 'till';
          if (!a.farmAction && (toolKind === 'till' || toolKind === 'water' || toolKind === 'harvest' || toolKind === 'plant')) {
            a.farmAction = { kind: toolKind, t: 0 };
            if (toolKind === 'till' || toolKind === 'water') {
              a.diag = 1; a.face = 3; a.faceBack = false; a.dir = 1;
            }
            const sx0 = ISO.wx(tx, ty), sy0 = ISO.wy(tx, ty);
            if (toolKind === 'till') { for (let i = 0; i < 5; i++) farmParts.push({ x: sx0 + (Math.random() - .5) * 14, y: sy0 - 2, vx: (Math.random() - .5) * 45, vy: -55 - Math.random() * 35, g: 180, t: 0, life: .45, e: '🟤', sz: 8 }); }
            else if (toolKind === 'water') { for (let i = 0; i < 5; i++) farmParts.push({ x: sx0 + (Math.random() - .5) * 12, y: sy0 - 20, vx: (Math.random() - .5) * 18, vy: 55 + Math.random() * 45, g: 250, t: 0, life: .45, e: '💧', sz: 11 }); }
            else if (toolKind === 'harvest') { farmParts.push({ x: sx0, y: sy0 - 8, vx: 0, vy: -50, g: 40, t: 0, life: .7, e: '✨', sz: 18 }); }
            else if (toolKind === 'plant') { farmParts.push({ x: sx0, y: sy0 - 20, vx: 0, vy: 80, g: 0, t: 0, life: .35, e: '🌱', sz: 13 }); }
          }
        }
      });
    }
    SALON.sync(dt, { actors, mkActor, goTo, faceTo, alive }); // v9.99: salon guests + groomers  (must run before the cleanup below)
    TOWN.followStep(dt, actors, mkActor, alive, me); // v9.99: the pet walking with its owner
    TOWN.villagerStep(dt, actors, mkActor, alive, goTo, walk); // PET TOWN v1.3: villagers visiting shops & public buildings
    // remove / animate leaving
    for (const [id, a] of actors) {
      if (alive.has(id) || a.type === 'me' || a.type === 'partner' || a.type === 'truck' || a.leaving || id.startsWith('gh')) continue; // gh*: commuting staff (v9.95)
      if (a.type === 'cust' || a.type === 'insp' || a.type === 'reg' || a.type === 'staff' || a.type === 'thief') {
        if (typeof TOWN !== 'undefined' && !TOWN.isFacilityAccessible(S, 'shop')) {
          a.say = (typeof t === 'function' && t('roadNone')) || '길이 없어요 😢';
          a.sayT = 3.0;
          continue; // 길이 연결되지 않았으면 나가지 않고 실내 대기
        }
        a.homeId = a.cust && a.cust.home; a.leaving = true; a.cust = null; a.watching = false;
        goTo(a, door.x, door.y, () => goTo(a, door.x + 2, door.y, () => { const hm = a.homeId && TOWN.objs().find(o => o.id === a.homeId), hd = hm && TOWN.doorOf(hm); goTo(a, hd ? hd.x : w + 1.5, hd ? hd.y : (a.id.length % 2) ? VILLAGE_N : villageS(), () => { actors.delete(id); }); }));
      } else if (a.type === 'cafeguest') {
        // v9.76: left because the food never came -> angry face + a line, no meal, no paying
        const ang = S.cafe && (S.cafe.angry || []).find(x => 'cg' + x.id === id);
        const dn = S.cafe && (S.cafe.done || []).find(x => 'cg' + x.id === id); if (!ang && dn) { a.served = true; if (a.order && !a.order.paid) a.order.paid = dn.pay; } // v9.91: a partner's copy never saw o.paid (the order vanished in the same update)
        if (!ang && a.order && a.order.paid) a.served = true; // v9.84: served by the café staff too -> eat, then pay at the desk (with the amount bubble)
        if (ang) { a.angry = true; a.angryLine = ang.line; a.angryUntil = T + 5.5; a.served = false; if (typeof toast === 'function' && !(World._angryToastT > T - 8)) { World._angryToastT = T; toast(t('cafeAngryToast')); } }
        // walk back out the same gate to the sidewalk she came in by (the old target sat outside
        // the yard's walkable range and got silently rerouted into the shop by nearestFree())
        a.leaving = true; a.happyT = a.served ? 1.2 : 0;
        // v9.87: a served guest always finishes the visit -- walk to the table (even if the food came while she was
        // still ordering at the desk), eat, pay at the desk, then leave. Before, food served early = she just walked out.
        if (a.served && a.mealStarted) { if (a.mealDone) cafeDepart(a); /* else the meal flow is running and ends in cafeDepart */ }
        else if (a.served) { a.mealStarted = true; if (a.seatAt) cafeMeal(a); else a.afterSit = () => cafeMeal(a); }
        else cafeDepart(a);
      } else if (a.type === 'patient' || a.type === 'hstaff') { actors.delete(id); } else actors.delete(id);
    }
    for (const a of actors.values()) if (a.type === 'cafeguest') a.sit = !!a.seatAt && Math.hypot(a.seatAt.x - a.x, a.seatAt.y - a.y) < .06;
    commute(dt); // v9.95: staff walk home after closing and walk back in when the shop opens
    // delivery trucks
    for (const d of S.deliveries || []) {
      const id = 't' + d.id;
      if (!actors.get(id) && (d.st === 'arrived' || d.left < 6) && !trucked.has(id)) { mkActor(id, 'truck', w + 4.3, VILLAGE_N, { speed: 3, d }); trucked.add(id); }
    }
    for (const [id, a] of actors) {
      if (a.type !== 'truck') continue;
      const d = (S.deliveries || []).find(x => 't' + x.id === id);
      a.t += dt;
      const ty = 2.5; // stops level with the drop zone / delivery sign (north end of the shop)
      if (!d) a.gone = true;
      if (!a.gone && a.y < ty) { a.y = Math.min(ty, a.y + (a.y < -8 ? 10 : 3.2) * dt); a.moving = true; } // fast along the long empty stretch, slow near the stop
      else if (!a.gone) { a.moving = false; a.wait = (a.wait || 0) + dt; if (d && d.st === 'arrived' && a.wait > 2.5) a.gone = true; }
      else { a.y += (a.y > h + 2 ? 10 : 3.4) * dt; a.moving = true; if (a.y > villageS()) actors.delete(id); }
    }
  }
  // v9.95: staff commute. When the shop closes, every staff member finishes what they are doing and walks out to the
  // street (and is gone); when it opens again they come walking in from the street to their posts. The real actors
  // stay where they are but hidden; a stand-in ("gh" + key) does the walking.
  const cmState = new Map();
  function commute(dt) {
    const open = G.isOpen(S), list = [];
    for (const skey in (S.staff || {})) { const a = actors.get('sf_' + skey); if (a) list.push({ key: 'sf_' + skey, a, duty: open || !!S.staff[skey].job }); }
    if (S.cafe && S.cafe.built) { const busy = open || (S.cafe.orders || []).length > 0 || (S.cafe.players || []).length > 0;
      for (const m of S.cafe.staff || []) { const a = actors.get('cs' + m.id) || hospIn.get('c' + m.id); if (a) list.push({ key: 'cf' + m.id, a, duty: busy }); } }
    if (S.hosp && S.hosp.built) { const busy = open || (S.hosp.patients || []).length > 0; for (const m of S.hosp.staff || []) { const a = actors.get('hs' + m.id); if (a) list.push({ key: 'hs' + m.id, a, duty: busy }); } }
    if (S.farm) for (const m of S.farm.staff || []) { const a = actors.get('fs' + m.id); if (a) list.push({ key: 'fs' + m.id, a, duty: open || m.tt > 0 }); }
    if (S.salon && S.salon.built) { const busy = open || (S.salon.q || []).some(c => c.ph !== 'out' && c.ph !== 'angry'); for (const m of S.salon.staff || []) { const a = actors.get('ss' + m.id); if (a) list.push({ key: 'ss' + m.id, a, duty: busy }); } }
    const seen = new Set();
    for (const { key, a, duty } of list) {
      seen.add(key); let c = cmState.get(key);
      if (!c) { c = { st: duty ? 'on' : 'gone' }; cmState.set(key, c); }
      const exit = () => { const n = a.y < H() / 2; return { x: W() + 1.5 + (n ? 0 : 1), y: n ? VILLAGE_N + 1 : villageS() - 1 }; };
      const ghost = (x, y) => { let g = actors.get('gh' + key); if (!g) { g = mkActor('gh' + key, a.type === 'staff' ? 'staff' : 'hstaff', x, y, { look: a.look, role: a.role, m: a.m, speed: 3.4 }); } return g; };
      const drop = () => actors.delete('gh' + key);
      if (!duty && (c.st === 'on' || c.st === 'in')) { // off home: walk out to the street
        const g = c.st === 'on' ? ghost(a.x, a.y) : ghost(0, 0); if (c.st === 'on') { g.x = a.x; g.y = a.y; }
        c.st = 'out'; const e = exit(); goTo(g, e.x, e.y, () => { c.st = 'gone'; drop(); });
      } else if (duty && (c.st === 'gone' || c.st === 'out')) { // clocking in: walk from the street to the post
        const e = exit(), g = ghost(e.x, e.y); if (c.st === 'gone') { g.x = e.x; g.y = e.y; }
        c.st = 'in'; goTo(g, a.x, a.y, () => { c.st = 'on'; drop(); });
      }
      const g = actors.get('gh' + key); if (g) { g.m = a.m; g.look = a.look; }
      a.hidden = c.st !== 'on';
    }
    for (const [key] of cmState) if (!seen.has(key)) { cmState.delete(key); actors.delete('gh' + key); } // fired
  }
  // v9.91: the play-mate walks round the pen, stops, throws a ball / pets the animals (hearts), then wanders on
  function penPlay(a, pen) {
    const now = T, dt = Math.min(.1, Math.max(0, now - (a.pT == null ? now : a.pT))); a.pT = now; a.t += dt;
    const rnd = () => ({ x: pen.x0 + .6 + Math.random() * (pen.x1 - pen.x0 - 1.2), y: pen.y0 + .6 + Math.random() * (pen.y1 - pen.y0 - 1.2) });
    if (a.px == null) { const r = rnd(); a.x = r.x; a.y = r.y; a.px = 1; a.wait = 1; a.tgt = null; }
    if (a.wait > 0) { a.wait -= dt; a.moving = false; if (a.wait <= 0) { a.tgt = rnd(); a.playK = null; } return; }
    const tg = a.tgt || (a.tgt = rnd()), dx = tg.x - a.x, dy = tg.y - a.y, d = Math.hypot(dx, dy), st = .9 * dt;
    if (d <= st) { a.x = tg.x; a.y = tg.y; a.moving = false; a.wait = 2.5 + Math.random() * 2.5; a.playK = Math.random() < .5 ? 'ball' : 'pat'; a.playT = 0; a.face = 0; return; }
    a.x += dx / d * st; a.y += dy / d * st; a.moving = true;
    const sdx = dx - dy, sdy = dx + dy;
    const adx = Math.abs(sdx), ady = Math.abs(sdy);
    if (adx > .2 * d) a.dir = sdx > 0 ? 1 : -1;
    const diag = Math.min(adx, ady) > .5 * Math.max(adx, ady) && adx > .35 * d && ady > .35 * d;
    a.diag = diag;
    if (diag) { a.face = 3; a.faceBack = sdy < 0; }
    else { a.faceBack = false; a.face = adx > 1.15 * ady ? 2 : (sdy < 0 ? 1 : 0); }
  }
  function drawPenPlay(a) {
    if (!a.playK || a.moving) return;
    const sx = ISO.wx(a.x, a.y), sy = ISO.wy(a.x, a.y); c.save(); c.textAlign = 'center';
    if (a.playK === 'ball') { const k = (T * .9) % 1, dx = (a.dir || 1) * 34 * k, h = 46 * Math.sin(k * Math.PI); c.font = '12px sans-serif'; c.fillText('🎾', sx + 8 * (a.dir || 1) + dx, sy - 30 - h); }
    else { for (let i = 0; i < 2; i++) { const k = (T * .7 + i * .5) % 1; c.globalAlpha = 1 - k; c.font = '11px sans-serif'; c.fillText('💕', sx + 12 * (a.dir || 1) + (i ? 6 : -4), sy - 20 - k * 26); } c.globalAlpha = 1; c.font = '12px sans-serif'; c.fillText('✋', sx + 14 * (a.dir || 1), sy - 14 + Math.sin(T * 8) * 2); }
    c.restore();
  }
  // ---- v9.89: café kitchen staff that really work ----
  // The cook walks to the stove when a guest has ordered, cooks (pan + steam + progress ring) and puts the dish on the pass;
  // the server walks to the pass, picks the dish up and carries it to the guest's table, and only THEN is the order served
  // (the guest eats, pays at the desk and leaves). With no server the cook carries it himself. The host's world drives this
  // and mirrors positions/jobs into S (m.px/m.py/m.jk/m.jd/m.jp) so a partner's screen shows the same thing.
  const CAFE_COOK_T = lv => Math.max(2.5, 6 - .35 * (lv || 1));
  function cafeCanCook(d) { const pr = (S.farm && S.farm.produce) || {}; return Object.entries(d.ing).every(([k, n]) => (pr[k] || 0) >= n); }
  function cafeTableSpot(L, tb) {
    const opts = [[tb.x + 2, tb.y + 1], [tb.x + 1, tb.y + 2], [tb.x, tb.y + 2], [tb.x + 2, tb.y], [tb.x - 1, tb.y + 1], [tb.x - 1, tb.y], [tb.x + 1, tb.y - 1], [tb.x, tb.y - 1]];
    const seat = tb.sx != null ? Math.floor(tb.sx) + ',' + Math.floor(tb.sy) : '';
    const inside = (x, y) => x >= L.ex && x < L.ex + L.W_ && y >= L.ny && y < L.ny + L.D_; // never a tile outside the walls
    const o = opts.find(([x, y]) => inside(x, y) && L.reach.has(x + ',' + y) && x + ',' + y !== seat); return o ? { x: o[0] + .5, y: o[1] + .5 } : (tb.sx != null ? { x: tb.sx, y: tb.sy } : null);
  }
  function cafeDo(x) { const r = G.apply(S, Object.assign({ lang: CFG.lang }, x), CFG.name) || {}; if (typeof afterStateChange === 'function') afterStateChange(); if (Net.mode === 'host' && typeof hostPublish === 'function') hostPublish(); return r; } // silent (no toast per dish)
  function cafeHallSpot(L, k) { // a free floor tile near the middle of the hall, where the server waits
    const cx = L.ex + L.W_ / 2 + (k - 1) * 1.5, cy = L.ny + L.D_ / 2 + .5; let best = null, bd = 1e9;
    for (const key of L.reach) { const [x, y] = key.split(',').map(Number); if (x < L.ex || x >= L.ex + L.W_ || y < L.ny + 1 || y >= L.ny + L.D_) continue; if ((L.noPlace && L.noPlace.has(key))) continue; const d = Math.hypot(x + .5 - cx, y + .5 - cy); if (d < bd) { bd = d; best = { x: x + .5, y: y + .5 }; } }
    return best || { x: cx, y: cy };
  }
  function cafeStaffStep(L, dt, alive) {
    const cf = S.cafe, host = !(typeof Net !== 'undefined' && Net.mode === 'guest');
    cf.noW = 0; // the world is running: cafecore leaves cooking/serving to these actors
    const stove = L.stove, pass = L.kit.find(k => k.k === 'counter') || L.kit.find(k => k.k === 'sink') || stove;
    const staff = (cf.staff || []).filter(m => m.role === 'cook' || m.role === 'server');
    const hasServer = staff.some(m => m.role === 'server');
    const byId = id => cf.orders.find(o => o.id === id);
    if (host) for (const o of cf.orders) if (o.ord && !o.rd) { // a dish already on the pass (cooked earlier / by the owner) goes to this order without cooking
      const free = (cf.dishes[o.dish] || 0) - cf.orders.filter(x => x.rd && x.dish === o.dish).length; if (free > 0) o.rd = true; }
    const idxOf = {};
    for (const m of staff) {
      const id = 'cs' + m.id; alive.add(id);
      const k = idxOf[m.role] = (idxOf[m.role] | 0) + 1, base = m.role === 'cook' ? stove : pass;
      const home = m.role === 'cook' ? { x: base.x + .5 + (k - 1), y: base.y + 1.5 } : cafeHallSpot(L, k);
      let a = actors.get(id);
      if (!a) { const lk = ART.randomHuman(m.seed); lk.hat = null; lk.top = 'jacket'; lk.jacket = m.role === 'cook' ? '#ffffff' : '#5a4a3a'; applyStaffArt(lk, m.seed, false); a = mkActor(id, 'hstaff', m.px != null ? m.px : home.x, m.py != null ? m.py : home.y, { look: lk, speed: 2.4 }); }
      a.m = m;
      if (!host) { // partner's screen: glide after the host's copy
        if (m.px != null) { const dx = m.px - a.x, dy = m.py - a.y, d = Math.hypot(dx, dy); a.path = []; a.moving = d > .05; if (d <= .01 && m.fd != null) { a.dir = m.fd; a.face = m.ff; } if (d > 3) { a.x = m.px; a.y = m.py; } else if (d > .01) { const st = Math.min(d, 2.6 * dt); a.x += dx / d * st; a.y += dy / d * st; if (Math.abs(dx - dy) > .05) a.dir = dx - dy > 0 ? 1 : -1; a.face = dx + dy < 0 ? 1 : 0; } }
        const ds = m.jd ? (CAFE_DISHES.find(x => x.id === m.jd) || {}).icon : null;
        a.cafeCook = m.jk === 'cook' ? { icon: ds || '🍳', p: m.jp || 0, stove } : null; a.carry = m.jk === 'carry' ? ds : null; continue;
      }
      let j = a.job;
      if (j && !byId(j.oid)) { if (j.k === 'cook' && j.ph === 'cook') cafeDo({ t: 'cafecook', dish: j.dish }); /* the guest left mid-cook: the dish still gets made */ a.job = j = null; a.carry = null; a.cafeCook = null; }
      if (!j) {
        let o = null;
        if (m.role === 'cook') o = cf.orders.find(x => x.ord && !x.rd && x.ck == null && !(x.ckT > T) && (() => { const d = CAFE_DISHES.find(z => z.id === x.dish); return d && cafeCanCook(d); })());
        if (o) { o.ck = m.id; const d = CAFE_DISHES.find(z => z.id === o.dish); const jj = j = a.job = { k: 'cook', oid: o.id, dish: o.dish, icon: d.icon, ph: 'go' }; goTo(a, home.x, home.y, () => { if (a.job === jj) { jj.ph = 'cook'; jj.t = jj.dur = CAFE_COOK_T(m.lv); faceTo(a, stove.x + .5, stove.y + .5); } }); }
        else if (m.role === 'server' || !hasServer) {
          o = cf.orders.find(x => x.sat && x.rd && x.cr == null && (cf.dishes[x.dish] || 0) > 0);
          if (o) { o.cr = m.id; const d = CAFE_DISHES.find(z => z.id === o.dish); const jj = j = a.job = { k: 'carry', oid: o.id, dish: o.dish, icon: d ? d.icon : '🍽️', ph: 'go' };
            goTo(a, pass.x + .5, pass.y + 1.5, () => { if (a.job === jj) { jj.ph = 'pick'; jj.t = .7; faceTo(a, pass.x + .5, pass.y + .5); } }); }
        }
        if (!j && !a.path.length && Math.hypot(a.x - home.x, a.y - home.y) > .3) goTo(a, home.x, home.y, () => { if (m.role === 'cook') faceTo(a, base.x + .5, base.y + .5); else { a.dir = 1; a.face = 0; } });
      } else if (j.k === 'cook' && j.ph === 'cook') {
        j.t -= dt; a.cafeCook = { icon: j.icon, p: 1 - j.t / j.dur, stove }; faceTo(a, stove.x + .5, stove.y + .5); a.moving = false;
        if (j.t <= 0) { const o = byId(j.oid), r = cafeDo({ t: 'cafecook', dish: j.dish }); if (o) { o.ck = null; if (r && r.ok) o.rd = true; else o.ckT = T + 6; } a.job = null; a.cafeCook = null; }
      } else if (j.k === 'carry' && j.ph === 'pick') {
        j.t -= dt; if (j.t <= 0) { const o = byId(j.oid), tb = o && L.tables.find(t => t.id === o.seat), sp = tb && cafeTableSpot(L, tb);
          if (!sp) { if (o) o.cr = null; a.job = null; } else { a.carry = j.icon; j.ph = 'walk'; goTo(a, sp.x, sp.y, () => { if (a.job === j) { j.ph = 'give'; j.t = .5; if (tb) faceTo(a, tb.x + 1, tb.y + 1); } }); } }
      } else if (j.k === 'carry' && j.ph === 'give') {
        j.t -= dt; if (j.t <= 0) { const r = cafeDo({ t: 'cafeserve', oid: j.oid }); const o = byId(j.oid); if (o && !(r && r.ok)) o.cr = null; a.carry = null; a.job = null; a.happyT = 1; }
      }
      m.px = Math.round(a.x * 100) / 100; m.py = Math.round(a.y * 100) / 100; // mirrored for the partner's screen
      m.fd = a.dir; m.ff = a.face; m.jk = a.cafeCook ? 'cook' : a.carry ? 'carry' : null; m.jd = a.job ? a.job.dish : null; m.jp = a.cafeCook ? Math.round(a.cafeCook.p * 20) / 20 : 0;
    }
  }
  function drawCafeCooking(a, sx, sy) { // pan on the stove with a hopping dish, flames and steam; a progress ring over the cook
    const st = a.cafeCook.stove, px = ISO.wx(st.x + .5, st.y + .5), py = ISO.wy(st.x + .5, st.y + .5) - 40;
    c.save();
    for (let i = 0; i < 3; i++) { const f = .6 + .4 * Math.sin(T * 18 + i * 2); c.beginPath(); c.moveTo(px - 8 + i * 8, py + 6); c.quadraticCurveTo(px - 11 + i * 8, py - 2 * f, px - 8 + i * 8, py - 6 * f); c.quadraticCurveTo(px - 5 + i * 8, py - 2 * f, px - 8 + i * 8, py + 6); c.fillStyle = i === 1 ? '#ffd24a' : '#ff7a3a'; c.fill(); }
    ART.ell(c, px, py, 13, 6, '#3e4450', ART.OUT, 1.1); c.fillStyle = '#3e4450'; c.fillRect(px + 11, py - 2, 12, 3);
    const hop = Math.max(0, Math.sin(T * 6)) * 10; c.font = '13px sans-serif'; c.textAlign = 'center'; c.fillText(a.cafeCook.icon, px, py - 1 - hop);
    for (let i = 0; i < 3; i++) { const k = (T * .8 + i / 3) % 1; c.globalAlpha = .6 * (1 - k); ART.ell(c, px - 6 + i * 6 + Math.sin(T * 2 + i) * 3, py - 14 - k * 26, 4 + k * 4, 3 + k * 3, '#ffffff'); }
    c.globalAlpha = 1;
    const bx = sx + 4, by = sy - 104; ART.ell(c, bx, by, 15, 15, '#fff', 'rgba(60,38,25,.7)', 1.5);
    c.beginPath(); c.arc(bx, by, 15, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, a.cafeCook.p)); c.lineWidth = 3.5; c.strokeStyle = '#ff9e40'; c.stroke();
    c.font = '15px sans-serif'; c.fillText(a.cafeCook.icon, bx, by + 5); c.textAlign = 'start'; c.restore();
  }
  // ---- café guest visit helpers (v9.87) ----
  function cafeStand(a) { if (a.seatAt) { a.x = a.front.x; a.y = a.front.y; a.seatAt = null; a.sit = false; } }
  function cafeDepart(a) {
    cafeStand(a); a.eating = 0; a.playing = false; a.afterSit = null; a.ordT = 0; a.afterOrd = null; a.afterEat = null;
    const sp = CAFE_SPAWN(), away = () => goTo(a, sp.x, sp.y, () => { actors.delete(a.id); }); // back up the street to where they came from
    if (a.petIn) { const g = CAFE_LAYOUT().penGate; goTo(a, g.x, g.y, () => { a.petIn = false; away(); }); } else away();
  }
  function cafeMeal(a) { // eat at the table, then pay at the cashier's desk (gold amount bubble), then play or go home
    a.eating = a.eatDur = 14; a.dish = (CAFE_DISHES.find(x => a.order && x.id === a.order.dish) || {}).icon || '🍽️'; // v9.91: a proper meal, not a 5-second gulp
    a.afterEat = () => {
      cafeStand(a);
      const done = () => { a.mealDone = true; a.happyT = 1.2; if (a.leaving) cafeDepart(a); }; // a slot player (not leaving) is walked to the machine by the players loop
      const dk = CAFE_LAYOUT().kit.find(k => k.k === 'cashdesk');
      if (!dk) { done(); return; }
      goTo(a, dk.x + dk.w / 2, dk.y + 1.5, () => { a.payT = 2.6; a.afterPay = done; faceTo(a, dk.x + dk.w / 2, dk.y); });
    };
  }
  function trick(pid, k, ok, cid) {
    const a = actors.get('p' + pid); if (!a) return;
    const go = () => { if (cu) { cu.reactT = 2.4; cu.reactOk = ok; } a.trick = { k, ok, t: 0 }; SFX.cry && SFX.cry(a.pet.sp); if (ok) setTimeout(() => SFX.jingle && SFX.jingle(), 500); };
    const cu = cid != null ? actors.get('c' + cid) : null;
    if (cu && !a.inHab && !a.inPen && !a.pet.escaped) { a.walkCust = true; goTo(a, Math.floor(cu.x) + (walk(Math.floor(cu.x) + 1, Math.floor(cu.y)) ? 1 : -1), Math.floor(cu.y), () => { a.walkCust = null; go(); }); }
    else go();
  }
  function markSold(cid, pet) { const a = actors.get('c' + cid); if (a) a.soldPet = pet; }
  function markLeft(cid, why) { const a = actors.get('c' + cid); if (a) { a.sadT = 2.5; a.sadWhy = why; } }
  function counterSpot() {
    const ct = S.items.find(i => i.k === 'counter'); if (!ct) return null;
    for (const [x, y] of (ct.f ? [[ct.x - 1, ct.y + 1], [ct.x - 1, ct.y], [ct.x, ct.y + 2], [ct.x, ct.y - 1]] : [[ct.x + 1, ct.y - 1], [ct.x, ct.y - 1], [ct.x + 2, ct.y], [ct.x - 1, ct.y]])) if (walk(x, y) && x >= 0 && y >= 0 && x < W() && y < H()) return { x, y };
    return nearestFree(ct.x, ct.y - 1);
  }
  function goCounter(cb) { const t = counterSpot(); if (!t) { cb && cb(); return; } goTo(me, t.x, t.y, () => { me.face = 0; me.dir = -1; cb && cb(); }); }

  // partners from network
  function setPartners(list) {
    const keep = new Set();
    for (const p of list) {
      const id = 'u' + p.id; keep.add(id);
      let a = actors.get(id);
      if (!a) a = mkActor(id, 'partner', p.x || W() - 2, p.y || H() - 3, { speed: 3.2 });
      a.look = p.look || a.look || ART.randomHuman(7); a.name = p.name;
      if (p.x != null && Math.hypot(p.x - a.x, p.y - a.y) > .05) { a.tx = p.x; a.ty = p.y; }
    }
    for (const [id, a] of actors) if (a.type === 'partner' && !keep.has(id)) actors.delete(id);
  }
  function stepPartner(a, dt) {
    a.t += dt;
    if (a.tx == null) { a.moving = false; return; }
    const dx = a.tx - a.x, dy = a.ty - a.y, d = Math.hypot(dx, dy);
    if (d < .05) { a.moving = false; a.tx = null; return; }
    const s = Math.min(d, 3.4 * dt); a.x += dx / d * s; a.y += dy / d * s; a.moving = true;
    const sdx = dx - dy, sdy = dx + dy;
    const adx = Math.abs(sdx), ady = Math.abs(sdy);
    if (adx > .2 * d) a.dir = sdx > 0 ? 1 : -1;
    const diag = Math.min(adx, ady) > .5 * Math.max(adx, ady) && adx > .35 * d && ady > .35 * d;
    a.diag = diag;
    if (diag) { a.face = 3; a.faceBack = sdy < 0; }
    else { a.faceBack = false; a.face = adx > 1.15 * ady ? 2 : (sdy < 0 ? 1 : 0); }
  }

  // ---------- joystick ----------
  function stepJoy(dt) {
    if (!joy.on || (!joy.dx && !joy.dy)) return;
    me.path = []; me.cb = null;
    // screen dir -> grid dir: sx = x - y, sy = (x + y)/2
    const sx = joy.dx, sy = joy.dy * 2;
    let gx = (sx + sy) / 2, gy = (sy - sx) / 2; const l = Math.hypot(gx, gy) || 1;
    const sp = me.speed * Math.min(1, Math.hypot(joy.dx, joy.dy)) * dt;
    gx = gx / l * sp; gy = gy / l * sp;
    [gx, gy] = VIEW.invV(gx, gy);
    const wr = wallRects(), ox0 = Math.floor(me.x), oy0 = Math.floor(me.y);
    const ok = (x, y) => walk(Math.floor(x), Math.floor(y), true) && walk(Math.floor(x + .2), Math.floor(y + .2), true) && walk(Math.floor(x - .2), Math.floor(y - .2), true) && !(wr.length && (wallStep(wr, ox0, oy0, Math.floor(x + .2), Math.floor(y + .2)) || wallStep(wr, ox0, oy0, Math.floor(x - .2), Math.floor(y - .2)) || wallStep(wr, ox0, oy0, Math.floor(x), Math.floor(y))));
    if (ok(me.x + gx, me.y + gy)) { me.x += gx; me.y += gy; }
    else if (ok(me.x + gx, me.y)) me.x += gx; else if (ok(me.x, me.y + gy)) me.y += gy;
    me.moving = true; me.t += 0;
    const gl = Math.hypot(gx, gy) || 1;
    const sdx = gx - gy, sdy = gx + gy;
    const adx = Math.abs(sdx), ady = Math.abs(sdy);
    if (adx > .2 * gl) me.dir = sdx > 0 ? 1 : -1;
    const diag = Math.min(adx, ady) > .5 * Math.max(adx, ady) && adx > .3 * gl && ady > .3 * gl;
    me.diag = diag;
    if (diag) { me.face = 3; me.faceBack = sdy < 0; }
    else { me.faceBack = false; me.face = adx > 1.15 * ady ? 2 : (sdy < 0 ? 1 : 0); }
  }

  // ---------- rendering ----------
  function resize() {
    cvRect = null;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    vw = cv.clientWidth; vh = cv.clientHeight;
    cv.width = Math.round(vw * dpr); cv.height = Math.round(vh * dpr);
  }
  let wallCanvas = null;
  let wallRoadCanvas = null, wallRoadKey = '';
  function drawRoadBehindWall(c) {
    if (!wallCanvas || typeof TOWN === 'undefined' || !TOWN.drawPlayerRoads) return;
    const rv = (S.town && S.town.rv) || 0;
    const rlen = (S.town && S.town.roads) ? S.town.roads.length : 0;
    const key = [bgKey, rv, rlen, wallCanvas.width, wallCanvas.height].join('|');
    if (key !== wallRoadKey || !wallRoadCanvas) {
      wallRoadKey = key;
      if (!wallRoadCanvas) wallRoadCanvas = document.createElement('canvas');
      wallRoadCanvas.width = wallCanvas.width;
      wallRoadCanvas.height = wallCanvas.height;
      wallRoadCanvas.ox = wallCanvas.ox;
      wallRoadCanvas.oy = wallCanvas.oy;
      wallRoadCanvas.k = wallCanvas.k;
      const rc = wallRoadCanvas.getContext('2d');
      rc.clearRect(0, 0, wallRoadCanvas.width, wallRoadCanvas.height);
      rc.save();
      rc.scale(wallCanvas.k, wallCanvas.k);
      rc.translate(-wallCanvas.ox, -wallCanvas.oy);
      TOWN.drawPlayerRoads(rc);
      rc.restore();
      // 벽 뒤 영역에만 나타나도록 wallCanvas의 불투명 영역과 교차(mask)
      rc.save();
      rc.globalCompositeOperation = 'destination-in';
      rc.drawImage(wallCanvas, 0, 0);
      rc.restore();
    }
    // 벽은 불투명하게 유지한 채, 벽 뒤로 지나가는 길을 투명(은은한 반투명)하게 표시
    // v2026-10-09: "상점 벽뒤에 있는 길들은 잘 안보여서 투명도를 주었는데, 그래도 잘 안보이네 더
    // 투명하게 해줘" -- "길이 잘 안 보인다"는 뜻이므로, 벽에 가려 길이 더 잘 비쳐 보이도록(=벽을
    // 더 투명하게) 기존 0.22보다 값을 크게 올려서 길 힌트가 또렷하게 보이게 함.
    c.save();
    c.globalAlpha = 0.5;
    c.drawImage(wallRoadCanvas, wallCanvas.ox, wallCanvas.oy, wallCanvas.width / wallCanvas.k, wallCanvas.height / wallCanvas.k);
    c.restore();
  }
  function buildBg() {
    VIEW.W = W(); VIEW.H = H();
    const hlv = (S.home && S.home.lv) || 1;
    const key = [W(), H(), S.room.floor, S.room.wall, CFG.lang, VIEW.r, hlv, CFG.name].join('|');
    if (key === bgKey && bgCanvas) return; bgKey = key;
    const w = W(), h = H();
    const cs = [[-9, -22], [w + 27, -22], [w + 27, h + 26], [-9, h + 26]].map(([x, y]) => [ISO.wx(x, y), ISO.wy(x, y)]);
    const minX = Math.min(...cs.map(q => q[0])) - 60, maxX = Math.max(...cs.map(q => q[0])) + 60, minY = Math.min(...cs.map(q => q[1])) - 170, maxY = Math.max(...cs.map(q => q[1])) + 30;
    bgCanvas = document.createElement('canvas');
    const k = Math.max(1, Math.min(2, Math.sqrt(12e6 / ((maxX - minX) * (maxY - minY))))); bgCanvas.width = (maxX - minX) * k; bgCanvas.height = (maxY - minY) * k; bgCanvas.ox = minX; bgCanvas.oy = minY; bgCanvas.k = k;
    const b = bgCanvas.getContext('2d'); b.scale(k, k); b.translate(-minX, -minY);
    FURN.outside(b, w, h, 0, { seed: t('seedShop'), tool: t('toolShop'), h24: t('open24'), homeLv: hlv, homeName: CFG.name }); FURN.floor(b, w, h, S.room.floor); FURN.walls(b, w, h, S.room.wall);
    FURN.dropZone(b, w, h, t('dropZone'));
    // PET TOWN v1.7: the shop walls again on their own small layer, painted over the player's road tiles
    // (roads are ground, drawn after the static bg -> without this a road behind the shop showed on top of its wall)
    { const ws = [[-1, -1], [w + 1, -1], [w + 1, h + 1], [-1, h + 1]].map(([x, y]) => [ISO.wx(x, y), ISO.wy(x, y)]);
      const x0 = Math.min(...ws.map(q => q[0])) - 60, x1 = Math.max(...ws.map(q => q[0])) + 60, y0 = Math.min(...ws.map(q => q[1])) - 170, y1 = Math.max(...ws.map(q => q[1])) + 60;
      wallCanvas = document.createElement('canvas'); wallCanvas.width = (x1 - x0) * k; wallCanvas.height = (y1 - y0) * k; wallCanvas.ox = x0; wallCanvas.oy = y0; wallCanvas.k = k;
      const g = wallCanvas.getContext('2d'); g.scale(k, k); g.translate(-x0, -y0); FURN.walls(g, w, h, S.room.wall); FURN.dropZone(g, w, h, t('dropZone'), true); }
  // 잔디 & 돌 PNG가 로드되면 배경 다시 굽기
  window.__onGroundAssetLoad = () => {
    bgKey = '';
  };
  const groundReady = (imgs) => !imgs || imgs.every(i => (i.complete && i.naturalWidth) || i.__ready);
  if (!window.__grassBaked && groundReady(FURN.GRASS_IMGS) && groundReady(FURN.STONE_IMGS)) {
    window.__grassBaked = true;
    bgKey = '';   // 다음 프레임에 재빌드
  }
  }
  const toScreen = (gx, gy, z) => [(ISO.wx(gx, gy) - cam.x) * cam.z + vw / 2, (ISO.wy(gx, gy) - (z || 0) - cam.y) * cam.z + vh / 2];
  const toGrid = (sx, sy) => { const wx = (sx - vw / 2) / cam.z + cam.x, wy = (sy - vh / 2) / cam.z + cam.y; const vx = (wx / (TW / 2) + wy / (TH / 2)) / 2, vy = (wy / (TH / 2) - wx / (TW / 2)) / 2; const q = VIEW.inv(vx, vy); return { x: q[0], y: q[1] }; };

  function bubble(x, y, drawInside, ratio, vip, any) {
    c.save(); c.translate(x, y);
    ART.rrect(c, -20, -44, 40, 36, 12); c.fillStyle = '#fff'; c.fill(); c.lineWidth = 1.6; c.strokeStyle = 'rgba(60,38,25,.7)'; c.stroke();
    c.beginPath(); c.moveTo(-5, -9); c.lineTo(0, -1); c.lineTo(5, -9); c.fillStyle = '#fff'; c.fill();
    c.save(); c.beginPath(); c.rect(-18, -42, 36, 32); c.clip(); c.translate(0, -26); drawInside(); c.restore();
    if (ratio != null) { c.beginPath(); c.arc(16, -40, 7, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ratio); c.lineTo(16, -40); c.fillStyle = ratio > .35 ? '#6cc070' : '#f0a53a'; c.fill(); c.beginPath(); c.arc(16, -40, 7, 0, 7); c.lineWidth = 1.2; c.strokeStyle = '#fff'; c.stroke(); }
    if (vip) { c.font = '14px sans-serif'; c.fillText('👑', -26, -38); }
    if (any) { c.font = 'bold 9px sans-serif'; c.fillStyle = '#a0673f'; c.fillText('ALL', -18, -34); }
    c.restore();
  }
  function label(x, y, txt, ratio, bg) {
    c.save();
    c.font = 'bold 10px sans-serif'; const w = c.measureText(txt).width + 10, h = 15;
    c.fillStyle = bg || 'rgba(255,255,255,.9)'; ART.rrect(c, x - w / 2, y - h / 2, w, h, 7); c.fill(); c.lineWidth = 1; c.strokeStyle = 'rgba(90,60,35,.35)'; c.stroke();
    c.fillStyle = '#4a2e1a'; c.textAlign = 'center'; c.fillText(txt, x, y + 3.5);
    if (ratio != null) { const bw = Math.max(20, w - 12); c.fillStyle = 'rgba(0,0,0,.12)'; c.fillRect(x - bw / 2, y + h / 2 + 1, bw, 2.5); c.fillStyle = ratio > .5 ? '#5cae3c' : ratio > .25 ? '#f0a53a' : '#e0604e'; c.fillRect(x - bw / 2, y + h / 2 + 1, bw * ratio, 2.5); }
    c.restore();
  }
  function nameTag(x, y, txt, col) {
    c.save();
    c.font = 'bold 11px sans-serif'; const w = c.measureText(txt).width + 10;
    ART.rrect(c, x - w / 2, y - 8, w, 15, 7); c.fillStyle = col || 'rgba(255,255,255,.85)'; c.fill();
    c.fillStyle = '#3a2418'; c.textAlign = 'center'; c.fillText(txt, x, y + 3); c.restore();
  }

  let _frameDrawList = [], _framePenHits = [];

  function frame(now) {
    requestAnimationFrame(frame);
    if (!S || !S.room || App.scene === 'home') { last = 0; return; }
    const dt = Math.min(.05, (now - (last || now)) / 1000); last = now; T += dt;
    if (cv.clientWidth !== vw || cv.clientHeight !== vh) resize();
    sync(dt);
    // people cover the long street quickly, then slow to a normal walk once at the shop
    for (const a of actors.values()) {
      if (a.baseSpeed) a.speed = a.baseSpeed * ((a.x > W() + .5 || a.y < -.5 || a.y > H() + .5) ? 2.4 : 1);
      if (a.type === 'partner') stepPartner(a, dt);
      else if (a.type !== 'truck' && a.type !== 'guest' && a.fx == null) stepActor(a, dt);
    }
    if (me && me.moving) { stepT += dt; if (stepT > .32) { stepT = 0; SFX.step && SFX.step(); } }
    stepJoy(dt);
    // walking right up to the home door (joystick or tap-to-move) enters automatically
    if (World.homeCooldown > 0) {
      World.homeCooldown -= dt;
    } else if (App.scene === 'shop' && !App.carry && me) {
      const hp = FURN.HOME_POS(W(), H(), (S.home && S.home.lv) || 1);
      const doorX = hp.x + hp.w / 2, doorY = hp.y + hp.d + 0.6;
      if (Math.hypot(me.x - doorX, me.y - doorY) < 0.65) Home.enter();
    }
    // café sign: pop a toast the first time the player gets close, per approach
    if (App.scene === 'shop' && me && !(S.cafe && S.cafe.built)) {
      const sg = CAFE_SIGN(), near = Math.hypot(me.x - sg.x, me.y - sg.y) < 2;
      if (near && !cafeMsgShown) { cafeMsgShown = true; toast(repTier(S.rep || 0) >= CAFE_UNLOCK_TIER ? t('cafeReadyMsg') : t('cafeLockedMsg')); }
      else if (!near) cafeMsgShown = false;
    }
    // camera follow
    if (cam.follow && me) {
      const tx = ISO.wx(me.x, me.y), ty = ISO.wy(me.x, me.y) - 30;
      cam.x += (tx - cam.x) * Math.min(1, dt * 3); cam.y += (ty - cam.y) * Math.min(1, dt * 3);
    }
    buildBg();
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.fillStyle = '#8fc262'; c.fillRect(0, 0, vw, vh);
    c.setTransform(dpr * cam.z, 0, 0, dpr * cam.z, dpr * (vw / 2 - cam.x * cam.z), dpr * (vh / 2 - cam.y * cam.z));

    // Viewport cull metrics (generous padding for roofs, trees, balloons, tall characters)
    const cx = cam.x, cy = cam.y;
    const rw = vw / cam.z / 2 + 260, rh = vh / cam.z / 2 + 360;
    World.cullBounds = () => ({ cx, cy, rw, rh });

    const isPtVis = (wx, wy, padX = 60, padY = 80) =>
      Math.abs(wx - cx) <= (rw + padX) && Math.abs(wy - cy) <= (rh + padY);

    const isBoxVis = (gx, gy, gw, gd, padX = 120, padY = 220) => {
      const bcx = ISO.wx(gx + gw / 2, gy + gd / 2);
      const bcy = ISO.wy(gx + gw / 2, gy + gd / 2);
      const extX = (gw + gd) * 16 + padX;
      const extY = (gw + gd) * 8 + padY;
      return Math.abs(bcx - cx) <= (rw + extX) && Math.abs(bcy - cy) <= (rh + extY);
    };

    // safety net: reset drawing state to known defaults every frame
    c.fillStyle = '#000'; c.strokeStyle = '#000'; c.lineWidth = 1; c.font = '10px sans-serif'; c.textAlign = 'start'; c.textBaseline = 'alphabetic'; c.globalAlpha = 1;
    drawVillageExt();
    c.drawImage(bgCanvas, bgCanvas.ox, bgCanvas.oy, bgCanvas.width / bgCanvas.k, bgCanvas.height / bgCanvas.k);
    TOWN.ground(c, T); // 모든 도로와 주택가 바닥을 먼저 렌더링
    const hospVis = (S.hosp && S.hosp.built) ? isBoxVis(HOSP_POS().x, HOSP_POS().y, HOSP_POS().w, HOSP_POS().d) : isBoxVis(HOSP_LOT().x, HOSP_LOT().y, HOSP_LOT().w, HOSP_LOT().d);
    if (hospVis) { drawHospLot(); drawHospGround(); }
    const farmVis = LAY('farm') && isBoxVis(FARM_POS().x - 2, FARM_POS().y - 2, FARM_POS().w + 6, FARM_POS().d + 6);
    if (farmVis) drawFarmGround();
    const cafeVis = isBoxVis(CAFE_POS().x, CAFE_POS().y, CAFE_POS().w, CAFE_POS().d);
    if (cafeVis) drawCafeGround();
    const parkVis = isBoxVis(PARK_POS().x, PARK_POS().y, PARK_POS().w, PARK_POS().d);
    if (parkVis) PARK.ground(c, T);
    const vilVis = isBoxVis(VILLAGE_X0, VILLAGE_Y0, W() + VILLAGE_XE - VILLAGE_X0, VILLAGE_S_MAX() - VILLAGE_Y0);
    if (vilVis) VILLAGE.ground(c, T);
    const ranchVis = (typeof RANCH_POS === 'function') && isBoxVis(RANCH_POS().x, RANCH_POS().y, RANCH_POS().w, RANCH_POS().d);
    if (ranchVis) RANCH.ground(c, T);
    const salonVis = (typeof SALON_POS === 'function') && isBoxVis(SALON_POS().x, SALON_POS().y, SALON_POS().w, SALON_POS().d);
    if (salonVis) SALON.ground(c, T);
    if (wallCanvas && TOWN.roadNearShop()) {
      c.drawImage(wallCanvas, wallCanvas.ox, wallCanvas.oy, wallCanvas.width / wallCanvas.k, wallCanvas.height / wallCanvas.k);
      drawRoadBehindWall(c);
    }
    if (editSel !== null || App.editing) drawGrid();
    // flat items first
    const list = _frameDrawList; list.length = 0;
    const penHits = _framePenHits; penHits.length = 0;
    for (const m of S.messes || []) { if (!poopShown(m)) continue; const vr = VIEW.rect(m.x, m.y, 1, 1); const msx = ISO.sx(vr.x, vr.y), msy = ISO.sy(vr.x, vr.y); if (!isPtVis(msx, msy, 40, 40)) continue; c.save(); c.translate(msx, msy); FURN.mess(c, m.k, T); c.restore(); }
    const shopVis = isBoxVis(0, 0, W(), H(), 100, 180);
    if (shopVis) {
      for (const it0 of S.items) {
        const it = editDrag && it0.id === editDrag.id ? Object.assign({}, it0, { x: editDrag.x, y: editDrag.y }) : it0; // being dragged: drawn under the finger
        const d = FURN.fp(it);
        const sx = ISO.wx(it.x + d.w / 2, it.y + d.d / 2), sy = ISO.wy(it.x + d.w / 2, it.y + d.d / 2);
        if (!isPtVis(sx, sy, 80, 160)) continue;
        const vr = VIEW.rect(it.x, it.y, d.w, d.d);
        if (d.flat) { c.save(); c.translate(ISO.sx(vr.x, vr.y), ISO.sy(vr.x, vr.y)); if (VIEW.odd() !== !!it.f) c.scale(-1, 1); FURN.item(c, it.k, T); c.restore(); continue; }
        if (d.pen) { c.save(); c.translate(ISO.sx(vr.x, vr.y), ISO.sy(vr.x, vr.y)); if (App.editing && editSel === it.id) c.globalAlpha = .55; FURN.penBack(c, T, it.k); c.restore(); penHits.push({ kind: 'item', item: it, x0: sx - 28 * d.w, x1: sx + 28 * d.w, y0: sy - 14 * d.d, y1: sy + 14 * d.d }); continue; }
        list.push({ depth: vr.x + vr.w + vr.y + vr.d - 1.02, item: it, d, inShop: true });
      }
    }
    const [VW, VH] = VIEW.dims(), sw = W(), sh = H();
    for (const a of actors.values()) {
      if (a.hidden) continue;
      const asx = ISO.wx(a.x, a.y), asy = ISO.wy(a.x, a.y);
      if (a.type !== 'me' && !isPtVis(asx, asy, 80, 120)) continue;
      const q = VIEW.p(a.x, a.y);
      if (VIEW.r && (q[0] < -.15 || q[1] < -.15) && a.type !== 'me') continue;
      const inDoorGap = a.x >= sw - .65 && ((a.y >= 1 && a.y <= 4) || (a.y >= sh - 2.5 && a.y <= sh - .5));
      const inShop = a.x >= 0 && a.y >= 0 && a.x < sw - .05 && a.y < sh - .05 && q[0] < VW - .05 && q[1] < VH - .05 && !inDoorGap;
      let dep = q[0] + q[1] + (a.sleep && !a.inHab ? .1 : 0) + (a.sit && a.seatAt && a.seatAt.dep ? Math.max(0, a.seatAt.dep + .01 - (q[0] + q[1])) : 0);
      if (typeof SALON !== 'undefined' && SALON.built && SALON.built()) {
        const sp = SALON_POS();
        if (a.x >= sp.x - 1 && a.x <= sp.x + sp.w + 2 && a.y >= sp.y - 1 && a.y <= sp.y + sp.d + 2 && (a.x >= sp.x + sp.w - .1 || a.y >= sp.y + sp.d - .1)) {
          dep = Math.max(dep, sp.x + sp.w + sp.y + sp.d + .6);
        }
      }
      list.push({ depth: dep, actor: a, inShop });
    }
    if (shopVis) {
      for (const e of collectCrates()) list.push(e);
      for (const e of collectStray()) list.push(e);
      for (const e of collectHome()) list.push(e);
    }
    if (farmVis) {
      for (const e of collectFarmCrops()) list.push(e);
      for (const e of collectCoop()) list.push(e);
      const fb = FARM_BOX_POS(); if (fb) list.push({ depth: fb.x + fb.y + 1, fn: () => drawFarmBox(fb) });
      if (LAY('farm')) { const sp = STALL_POS(); list.push({ depth: sp.x + sp.y + 4.6, fn: () => FURN.stallLive(c, t('seedShop')) }); }
    }
    if (ranchVis) {
      for (const e of RANCH.collect(c, T, { push: h => hits.push(h) })) list.push(e);
    }
    if (typeof TRAIN !== 'undefined' && TRAIN.collect) {
      const tsx = typeof TRAIN.STAT_X === 'function' ? TRAIN.STAT_X() : 18;
      const tsy = typeof TRAIN.STAT_Y === 'function' ? TRAIN.STAT_Y() : -4.2;
      if (isBoxVis(tsx - 2, tsy - 4, 16, 12, 160, 260)) {
        for (const e of TRAIN.collect(c, T, { push: h => hits.push(h) })) list.push(e);
      }
    }
    if (cafeVis) {
      for (const e of collectCafeSign()) list.push(e);
      for (const e of collectCafeItems()) list.push(e);
    }
    if (hospVis) {
      for (const e of collectHospSign()) list.push(e);
      for (const e of collectHospItems()) list.push(e);
    }
    if (parkVis) {
      for (const e of PARK.collect(c, T, h => hits.push(h))) list.push(e);
    }
    if (vilVis) {
      for (const e of VILLAGE.collect(c, T, h => hits.push(h))) list.push(e);
    }
    if (salonVis) {
      for (const e of SALON.collect(c, T, h => hits.push(h))) list.push(e);
    }
    for (const e of TOWN.collect(c, T, h => hits.push(h))) list.push(e);
    { const cx = cam.x, cy = cam.y, rw = vw / cam.z / 2 + 200, rh = vh / cam.z / 2 + 200, tp = App.tplace; // PET TOWN: everything the player built (houses, trees, small facilities)
      for (const o of TOWN.objs()) {
        if (tp && tp.mv === o.id) continue;
        const f = TOWN.fpOf(o.k, o.r), sx = ISO.wx(o.x + f.w / 2, o.y + f.d / 2), sy = ISO.wy(o.x + f.w / 2, o.y + f.d / 2), zpad = o.k === 'zoo' ? 360 : 0;
        if (Math.abs(sx - cx) > rw + zpad || Math.abs(sy - cy) > rh + zpad) continue;
        if (o.k === 'zoo') continue; // User Requests 2, 3, 4: Zoo is decomposed into individual depth layers in TOWN.collect!
        const big = TOWN_DEF[o.k] && TOWN_DEF[o.k].cat === 'house';
        const isTree = TOWN_DEF[o.k] && TOWN_DEF[o.k].cat === 'tree' && !TOWN_DEF[o.k].flower;
        list.push({ depth: TOWN.depthOf(o), tobj: o, f, big, isTree, sx, sy });
      }
      if (tp) list.push({ depth: 1e9, fn: () => { tp.ok = TOWN.drawGhost(c, tp, T); } });
      if (App.troad) list.push({ depth: 1e9, fn: () => TOWN.drawRoadTool(c, App.troad) });
    } // v9.99: villagers' houses (only the ones on screen) // v9.96: park props + strollers (tap targets pushed while drawing)
    list.sort((p, q) => p.depth - q.depth);
    hits = penHits.slice();
    if (shopVis || isPtVis(STALL_POS().x, FURN.STORE_Y.seed, 100, 100)) {
      for (const k of ['seed']) { const y0 = FURN.STORE_Y[k], x0 = STALL_POS().x; const cs = [[x0, y0], [x0 + 3.1, y0], [x0 + 3.1, y0 + 3], [x0, y0 + 3]].map(([x, y]) => [ISO.wx(x, y), ISO.wy(x, y)]); const xs = cs.map(q => q[0]), ys = cs.map(q => q[1]); hits.push({ kind: 'store', store: k, x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys) - 100, y1: Math.max(...ys) }); }
    }
    const hp0 = FURN.HOME_POS(W(), H(), (S.home && S.home.lv) || 1);
    if (shopVis || isBoxVis(hp0.x, hp0.y, hp0.w, hp0.d, 60, 80)) {
      const cs = [[hp0.x, hp0.y], [hp0.x + hp0.w, hp0.y], [hp0.x + hp0.w, hp0.y + hp0.d], [hp0.x, hp0.y + hp0.d]].map(([x, y]) => [ISO.wx(x, y), ISO.wy(x, y)]); const xs = cs.map(q => q[0]), ys = cs.map(q => q[1]); hits.push({ kind: 'home', x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys) - hp0.h - 60, y1: Math.max(...ys) + 10 });
    }
    for (const m of S.messes || []) { if (!poopShown(m)) continue; const sx = ISO.wx(m.x + .5, m.y + .5), sy = ISO.wy(m.x + .5, m.y + .5); if (!isPtVis(sx, sy, 40, 40)) continue; hits.push({ kind: 'mess', m, x0: sx - 26, x1: sx + 26, y0: sy - 24, y1: sy + 14 }); }
    for (const e of list) {
      if (!e.inShop) continue;
      if (e.item) drawItem(e.item, e.d);
      else if (e.actor) drawActor(e.actor);
      else if (e.tobj) {
        TOWN.drawObj(c, e.tobj, T);
        hits.push({ kind: 'tobj', id: e.tobj.id, x0: e.sx - (e.big ? 50 : e.isTree ? 45 : 16 * e.f.w), x1: e.sx + (e.big ? 50 : e.isTree ? 45 : 16 * e.f.w), y0: e.sy - (e.big ? 70 : e.isTree ? 210 : 40), y1: e.sy + 10 });
      }
      else if (e.fn) e.fn();
    }
    if (shopVis) {
      for (const it of S.items) if (isPenKind(it.k)) { const d = FURN.fp(it), vr = VIEW.rect(it.x, it.y, d.w, d.d); c.save(); c.translate(ISO.sx(vr.x, vr.y), ISO.sy(vr.x, vr.y)); FURN.penFront(c, it.k); c.restore(); }
      FURN.frontWalls(c, W(), H(), S.room.wall);
      FURN.dropZone(c, W(), H(), t('dropZone'), true);
    }
    for (const e of list) {
      if (e.inShop) continue;
      if (e.item) drawItem(e.item, e.d);
      else if (e.actor) drawActor(e.actor);
      else if (e.tobj) {
        TOWN.drawObj(c, e.tobj, T);
        hits.push({ kind: 'tobj', id: e.tobj.id, x0: e.sx - (e.big ? 50 : e.isTree ? 45 : 16 * e.f.w), x1: e.sx + (e.big ? 50 : e.isTree ? 45 : 16 * e.f.w), y0: e.sy - (e.big ? 70 : e.isTree ? 210 : 40), y1: e.sy + 10 });
      }
      else if (e.fn) e.fn();
    }
    drawHearts(dt); drawFarmParts(dt);
    for (const m of S.messes || []) { if (!poopShown(m)) continue; // tiny bouncing line-arrow marker over things to clean
      const sx = ISO.wx(m.x + .5, m.y + .5), sy = ISO.wy(m.x + .5, m.y + .5) - 16 - Math.abs(Math.sin(T * 4 + m.x)) * 3;
      if (!isPtVis(sx, sy, 40, 40)) continue;
      c.beginPath(); c.moveTo(sx, sy - 6); c.lineTo(sx, sy); c.moveTo(sx - 2.5, sy - 2.5); c.lineTo(sx, sy); c.lineTo(sx + 2.5, sy - 2.5);
      c.lineCap = 'round'; c.lineJoin = 'round'; c.lineWidth = 3.2; c.strokeStyle = 'rgba(90,60,0,.55)'; c.stroke(); c.lineWidth = 1.8; c.strokeStyle = '#ffe135'; c.stroke();
    }
    tint();
    drawStrayArrow();
    fxOverlay(dt);
    // overlays: bubbles & names
    for (const a of actors.values()) {
      if (a.hidden) continue; // v9.95: off-duty staff
      const sx = ISO.wx(a.x, a.y), sy = ISO.wy(a.x, a.y);
      if (a.type !== 'me' && !isPtVis(sx, sy, 80, 140)) continue;
      if (VIEW.r) { const q = VIEW.p(a.x, a.y); if ((q[0] < -.15 || q[1] < -.15) && a.type !== 'me') continue; }
      if (a.type === 'cust' && a.cust && a.inside && !a.path.length) {
        const cu = a.cust, ratio = cu.max ? Math.max(0, cu.pat / cu.max) : null, md = humMood(a);
        const moodE = md === 'angry' ? '😠' : md === 'bored' ? '😒' : md === 'love' ? '😍' : md === 'happy' ? '😊' : '';
        let txt = null;
        if (cu.st === 'want' && a.arrived) {
          const what = cu.sp ? spName(cu.sp) : cu.cat ? t('f_' + cu.cat) : t('anyPet');
          const ic = cu.sp ? ({ dog: '🐶', cat: '🐱', small: '🐹', fish: '🐟', bird: '🐦', reptile: '🦎' }[SPECIES[cu.sp].cat]) : cu.cat ? ({ dog: '🐶', cat: '🐱', small: '🐹', fish: '🐟', bird: '🐦', reptile: '🦎' }[cu.cat]) : '🐾';
          txt = (cu.vip ? '👑' : '') + ic + ' ' + t(a.watching ? 'lbl_watch' : 'lbl_want', { x: what });
          if (cu.need && !a.watching) txt += ' ' + (((NEEDS.find(n => n.id === cu.need) || {}).traits) || []).map(x => TRAITS[x].icon).join('');
          if (S.pets.some(p => G.matches(cu, p))) txt += ' ✓';
        }
        if (cu.st === 'pay' && a.arrived) txt = '🪙 ' + t('lbl_pay', { c: fmt(cu.amount) });
        if (cu.st === 'shop' && a.arrived) txt = '🛍️ ' + t('lbl_shop');
        if (cu.st === 'gwait' && a.arrived) txt = '✂️ ' + t('lbl_groom');
        if (cu.st === 'pickup' && a.arrived) txt = '🏨 ' + t('lbl_pickup');
        if (txt) label(sx, sy - 80, (moodE && md !== 'calm' && md !== 'happy' ? moodE + ' ' : '') + txt, cu.st === 'shop' ? null : ratio);
      }
      if (a.type === 'cust' && a.sadT > 0) label(sx, sy - 80, a.sadWhy === 'nomatch' ? '🤷 ' + t('lbl_nomatch') : '😢 ' + t('lbl_tooLong'), null, '#ffe8e4');
      if (a.type === 'reg' && !a.leaving) label(sx, sy - 82 - Math.abs(Math.sin(T * 3)) * 2, '💬 ' + t('lbl_reg'), null, '#fff3cf');
      if (a.type === 'reg' && a.say && a.sayT > 0) {
        const msg = a.say;
        c.save();
        c.font = 'bold 12px sans-serif';
        const tw = c.measureText(msg).width + 18, by = sy - 105;
        ART.rrect(c, sx - tw / 2, by - 12, tw, 24, 10);
        c.fillStyle = '#fffdf5';
        c.fill();
        c.lineWidth = 1.8;
        c.strokeStyle = '#9e7a4a';
        c.stroke();
        c.fillStyle = '#5a3a18';
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillText(msg, sx, by);
        c.restore();
      }
      if (a.type === 'insp') label(sx, sy - 80, '📋 ' + t('lbl_insp'), null, '#e8eefc');
      if (a.type === 'staff' && a.m && !a.leaving && !a.hidden) {
        const R = STAFF_ROLES.find(r => r.id === a.role);
        if (a.role === 'sales') {
          c.save();
          c.font = 'bold 9px sans-serif';
          // v1.100.49: 직원 머리 크기를 여러 차례 줄이면서(30%+10%) 머리가 작아진 만큼, 고정값이던
          // 라벨 위치(sy-79)가 이제 모자/얼굴에 겹쳐 보여서 위로 더 올림 (sy-99)
          const mtxt = t('managerLabel') + (a.m.job ? ' · ' + t('stj_' + a.m.job.k) : ''), mw = c.measureText(mtxt).width + 10, mh = 13, my = sy - 99;
          ART.rrect(c, sx - mw / 2, my - mh / 2, mw, mh, 4);
          c.fillStyle = 'rgba(15,15,18,.92)'; c.fill();
          c.lineWidth = 1; c.strokeStyle = '#ffd700'; c.stroke();
          c.fillStyle = '#ffe135'; c.textAlign = 'center'; c.textBaseline = 'middle';
          c.fillText(mtxt, sx, my + 0.5);
          c.restore();
        } else {
          // v1.100.49: 위 매니저 라벨과 같은 이유로 sy-80 -> sy-100 (모자 위로 올림)
          label(sx, sy - 100, (R ? R.icon : '👥') + ' Lv' + a.m.lv + (a.m.job ? ' · ' + t('stj_' + a.m.job.k) : ''), null, '#eef9ff');
        }
        if (a.m.say && a.m.sayT > 0) {
          const msg = a.m.say;
          c.save();
          c.font = 'bold 12px sans-serif';
          const tw = c.measureText(msg).width + 18, by = sy - 105;
          ART.rrect(c, sx - tw / 2, by - 12, tw, 24, 10);
          c.fillStyle = '#ffffff';
          c.fill();
          c.lineWidth = 1.8;
          c.strokeStyle = '#2f4f8a';
          c.stroke();
          c.beginPath();
          c.moveTo(sx - 4, by + 12);
          c.lineTo(sx, by + 17);
          c.lineTo(sx + 4, by + 12);
          c.fillStyle = '#ffffff';
          c.fill();
          c.strokeStyle = '#2f4f8a';
          c.stroke();
          c.fillStyle = '#1e3056';
          c.textAlign = 'center';
          c.textBaseline = 'middle';
          c.fillText(msg, sx, by);
          c.restore();
        }
      }
      if ((a.type === 'cust') && a.wow) { c.font = '16px sans-serif'; c.fillText(Math.sin(T * 6) > 0 ? '👏' : '😍', sx + 10, sy - 70); }
      // v2026-10-08: "외부주민들은 머리위에 작은 아이콘을 달아줘" -- 우리 마을에 집이 없는(= 마을주민
      // 시스템에 없는) 손님은 펫샵에 들어가기 전까진 겉모습만으로 마을 주민과 구분이 안 됐음.
      // 아주 작게 🧳 아이콘만 머리 위에 살짝 띄워서 "이 사람은 외부에서 온 손님"이라고 미리 표시.
      if (a.type === 'cust' && !a.inside && a.cust && !a.cust.residentId) { c.save(); c.font = '9px sans-serif'; c.textAlign = 'center'; c.globalAlpha = .85; c.fillText('🧳', sx, sy - 62); c.restore(); }
      // pet overlays hug the pet (scaled to its size) and vanish while I'm holding it -- they used to hang in mid-air
      const petHeld = a.type === 'pet' && a.pet && App.carry && App.carry.pid === a.pet.id;
      const psz = a.type === 'pet' && a.pet && a.pet.grow != null ? .36 + .64 * G.ageOf(a.pet) : 1, ptop = sy - 30 * psz - 6;
      if (petHeld) continue;
      if ((a.type === 'pet' || a.type === 'insp' || a.type === 'cust') && a.bubT > 0 && a.bubble) { c.font = '16px sans-serif'; c.fillText(a.bubble, sx + 6, (a.type === 'pet' ? ptop : sy - 46) - (1.6 - a.bubT) * 6); }
      if (a.type === 'pet' && a.pet && a.pet.escaped) { c.font = 'bold 16px sans-serif'; c.fillStyle = '#e0604e'; c.fillText('!', sx - 3, ptop + Math.sin(T * 10) * 3); }
      if (a.type === 'pet' && a.trick) { c.font = '14px sans-serif'; c.fillText(a.trick.ok ? (a.trick.t > 1.6 ? '✨' : '🎵') : (a.trick.t > 1.4 ? '💫' : ''), sx + 10, ptop - a.trick.t * 6); }
      if (a.type === 'me' && Net.mode !== 'solo') nameTag(sx, sy - 80, CFG.name, 'rgba(255,236,200,.95)');
      if (a.type === 'partner') nameTag(sx, sy - 80, a.name || '', 'rgba(200,236,225,.95)');
      if (a.type === 'pet' && App.showNames) nameTag(sx, sy + 8, a.pet.name + ' Lv' + (a.pet.lv || 1));
      if (a.type === 'pet' && a.pet && !a.inHab) {
        const p = a.pet; const al = p.hunger < 30 ? '🍖' : p.clean < 30 ? '🧽' : p.stress > 70 ? '💦' : p.bored > 70 ? '💭' : '';
        if (!al && p.happy > 80 && !a.sleep && Math.sin(T * .7 + (a.x * 7)) > .97) a.happyT = 1;
        if (al) { c.font = '14px sans-serif'; c.fillText(al, sx + 6 * psz, ptop + 2 + Math.sin(T * 4) * 2); }
      }
    }
    hits.reverse();
    PERF_TRACKER.recordFrame(dt, list.length, (TOWN.objs() ? TOWN.objs().length : 0));
  }
  function drawTruck(a) {
    const B = FURN.box;
    c.save(); c.translate(-ISO.sx(.6, 1), -ISO.sy(.6, 1) + (a.moving ? Math.sin(a.t * 30) * .6 : 0));
    ART.shadow(c, ISO.sx(.6, 1), ISO.sy(.6, 1), 44);
    B(c, 0, 0, 1.2, 2.2, 14, '#3d4a5c');
    B(c, 0, 0, 1.2, 1.5, 52, '#f5f0e6', 12);
    B(c, 0, 1.5, 1.2, .7, 30, '#f39a3d', 12);
    const [wx, wy] = FURN.P(1.2, 1.85, 32); ART.rrect(c, wx - 10, wy - 12, 12, 12, 2); c.fillStyle = '#bfe3f7'; c.fill();
    const [lx, ly] = FURN.P(1.2, .75, 40); c.font = 'bold 13px sans-serif'; c.fillStyle = '#e07a5f'; c.fillText('🐾', lx - 12, ly);
    for (const [x, y] of [[1.2, .4], [1.2, 1.8]]) { const [px, py] = FURN.P(x, y, 0); ART.ell(c, px, py - 3, 6, 7, '#2b2b2b', ART.OUT, 1); ART.ell(c, px, py - 3, 2.5, 3, '#bbb'); }
    c.restore();
  }
  function dropSlots() { const z = FURN.DZONE(W(), H()), out = []; for (const yy of [.3, .72]) for (const xx of [.22, .52, .82]) out.push({ gx: z.x0 + (z.x1 - z.x0) * xx, gy: z.y0 + (z.y1 - z.y0) * yy }); return out; }
  // returns {depth, fn} entries instead of drawing immediately, so crates take their proper place
  // in the actor/item depth sort (frame()) rather than always painting on top of the player
  function collectCrates() {
    const ds = (S.deliveries || []).filter(d => d.st === 'arrived' && !d.pk && !(App.carry && App.carry.did === d.id)).map(d => ({ d })).concat((S.parcels || []).filter(p => p.st === 'arrived').map(p => ({ p })));
    const slots = dropSlots();
    return ds.slice(0, 6).map((e, i) => ({ depth: slots[i].gx + slots[i].gy + .98, fn: () => drawOneCrate(e, slots[i], i) }));
  }
  function drawOneCrate(e, sl, i) {
    const sx = ISO.wx(sl.gx, sl.gy), sy = ISO.wy(sl.gx, sl.gy);
    const bounce = Math.abs(Math.sin(T * 3 + i)) * 2;
    c.save(); c.translate(sx - ISO.sx(.5, .5), sy - ISO.sy(.5, .5) - bounce);
    if (e.d) {
      FURN.box(c, .2, .2, .6, .6, 22, '#c98d55', 0, { top: '#e0b27a' });
      const [tx, ty] = FURN.P(.5, .5, 22); c.font = '14px sans-serif'; c.textAlign = 'center'; c.fillText('❤', tx, ty + 4); c.textAlign = 'start';
    } else {
      const big = e.p.what === 'house' || e.p.what === 'decor';
      FURN.box(c, big ? .15 : .25, big ? .15 : .25, big ? .7 : .5, big ? .7 : .5, big ? 24 : 16, '#d9a86a', 0, { top: '#ecc48e' });
      const [tx, ty] = FURN.P(.5, .5, big ? 24 : 16); c.fillStyle = 'rgba(160,110,60,.8)'; c.fillRect(tx - 1.5, ty - 7, 3, 14);
      c.font = '12px sans-serif'; c.textAlign = 'center'; c.fillText({ food: '🥣', kit: '🧴', house: '🏠', decor: '🛋️' }[e.p.what] || '📦', tx, ty - 8); c.textAlign = 'start';
    }
    c.restore();
    if (e.d) { c.save(); c.translate(sx, sy - 44 - bounce); c.scale(.4, .4); ART.pet(c, e.d.sp, { t: T, mood: 'curious', seed: e.d.coat, age: 0 }); c.restore(); }
    c.save(); c.font = 'bold 10px sans-serif'; c.fillStyle = '#fff'; c.strokeStyle = 'rgba(0,0,0,.5)'; c.lineWidth = 3; c.strokeText('TAP!', sx - 11, sy - (e.d ? 62 : 44)); c.fillText('TAP!', sx - 11, sy - (e.d ? 62 : 44)); c.restore();
    hits.push(e.d ? { kind: 'crate', d: e.d, x0: sx - 22, x1: sx + 22, y0: sy - 70, y1: sy + 6 } : { kind: 'parcel', p: e.p, x0: sx - 22, x1: sx + 22, y0: sy - 50, y1: sy + 6 });
  }
  function goDrop(cb) { const z = FURN.DZONE(W(), H()); goTo(me, W() + 1, Math.floor((z.y0 + z.y1) / 2), () => { me.dir = 1; cb && cb(); }); cam.follow = true; }
  const parts = [];
  function fxOverlay(dt) {
    const sn = seasonOf(), rush = S.x && S.x.rush;
    c.save(); c.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (sn) {
      if (parts.length < 26 && Math.random() < dt * 8) parts.push({ x: Math.random() * vw, y: -10, v: 18 + Math.random() * 25, w: Math.random() * 6, r: Math.random() * 6 });
      const glyph = { halloween: '🍂', xmas: '❄', spring: '🌸', summer: '✨' }[sn];
      c.globalAlpha = .75; c.font = '12px sans-serif';
      for (let i = parts.length - 1; i >= 0; i--) { const p = parts[i]; p.y += p.v * dt; p.x += Math.sin(T * 1.5 + p.w) * 12 * dt; if (p.y > vh + 10) { parts.splice(i, 1); continue; } if (sn === 'xmas') { c.fillStyle = '#fff'; c.beginPath(); c.arc(p.x, p.y, 1.5 + p.r * .3, 0, 7); c.fill(); } else c.fillText(glyph, p.x, p.y); }
      c.globalAlpha = 1;
    }
    if (rush) {
      const k = .25 + .15 * Math.sin(T * 6);
      const g = c.createRadialGradient(vw / 2, vh / 2, Math.min(vw, vh) * .35, vw / 2, vh / 2, Math.max(vw, vh) * .75); g.addColorStop(0, 'rgba(255,200,60,0)'); g.addColorStop(1, `rgba(255,170,40,${k})`);
      c.fillStyle = g; c.fillRect(0, 0, vw, vh);
    }
    c.restore();
  }
  // User Request 13: Smooth procedural day/night & weather canvas lighting with stars and ambient glow
  function tint() {
    if (!S.clock) return;
    const m = S.clock.m, ph = S.clock.ph;
    let col = null, a = 0, isNight = false;

    if (m >= 5 * 60 && m < 7.5 * 60) {
      // 05:00 ~ 07:30: Rosy golden dawn / sunrise
      col = '255,185,130';
      const k = (m - 300) / 150;
      a = 0.22 * (1 - k * 0.6);
    } else if (m >= 7.5 * 60 && m < 11.5 * 60) {
      // 07:30 ~ 11:30: Soft morning sun
      col = '255,245,210';
      a = 0.05;
    } else if (m >= 11.5 * 60 && m < 16 * 60) {
      // 11:30 ~ 16:00: Crisp bright midday (no dark tint)
      col = null; a = 0;
    } else if (m >= 16 * 60 && m < 18 * 60) {
      // 16:00 ~ 18:00: Golden hour / late afternoon amber glow
      col = '255,175,70';
      const k = (m - 960) / 120;
      a = 0.08 + k * 0.16;
    } else if (m >= 18 * 60 && m < 20.5 * 60) {
      // 18:00 ~ 20:30: Rich dusk twilight & sunset
      col = '175,75,115';
      const k = (m - 1080) / 150;
      a = 0.22 + k * 0.14;
    } else {
      // 20:30 ~ 05:00: Deep moonlight night / starry sky
      isNight = true;
      col = '16,24,68';
      a = ph === 'closed' ? 0.42 : 0.36;
    }

    if (col && a > 0) {
      c.save();
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.fillStyle = `rgba(${col},${a})`;
      c.fillRect(0, 0, vw, vh);

      // Night sky twinkling stars!
      if (isNight || ph === 'closed') {
        const starSeed = Math.floor((S.clock.day || 1) * 31);
        for (let i = 0; i < 28; i++) {
          const sx = ((starSeed + i * 97) % 1000) / 1000 * vw;
          const sy = ((starSeed + i * 53) % 1000) / 1000 * (vh * 0.55);
          const twinkle = Math.abs(Math.sin(T * 2.2 + i * 1.7));
          if (twinkle > 0.25) {
            c.fillStyle = '#ffffff';
            c.globalAlpha = (a * 1.5) * (0.35 + twinkle * 0.65);
            c.beginPath();
            c.arc(sx, sy, 1.2 + (i % 3 === 0 ? 0.8 : 0), 0, Math.PI * 2);
            c.fill();
          }
        }
      }
      c.restore();
    }

    // Warm ambient lanterns and light glows during evening/night
    if (ph === 'closed' || m > 17 * 60 || m < 7 * 60) {
      c.save(); c.globalCompositeOperation = 'lighter';
      const glow = (gx, gy, z, r, k, cl) => { const x = ISO.wx(gx, gy), y = ISO.wy(gx, gy) - z; const g = c.createRadialGradient(x, y, 2, x, y, r); g.addColorStop(0, `rgba(${cl || '255,210,120'},${k})`); g.addColorStop(1, `rgba(${cl || '255,210,120'},0)`); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); };
      for (let y = -2; y < H() + 3; y += 4) glow(W() + 1.1, y, 58, 70, ph === 'closed' ? .35 : .18);
      const nL = S.items.filter(it => FURN.LIGHT[it.k]).length, nk = (ph === 'closed' ? 1 : .8) * Math.min(1, 2.2 / Math.sqrt(Math.max(1, nL)));
      for (const it of S.items) { const L = FURN.LIGHT[it.k]; if (!L) continue; const d = FURN.fp(it); const big = L.length > 1; const g0 = L[big ? 1 : 0]; glow(it.x + d.w / 2, it.y + d.d / 2, g0[2], g0[3] * (big ? 1.5 : 1), g0[4] * nk, g0[5]); }
      glow(W() / 2, H() / 2, 90, 160, ph === 'closed' ? .12 : .06);
      c.restore();
    }
  }
  function drawGrid() {
    c.save(); c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 1;
    for (let x = 0; x <= W(); x++) { c.beginPath(); c.moveTo(ISO.wx(x, 0), ISO.wy(x, 0)); c.lineTo(ISO.wx(x, H()), ISO.wy(x, H())); c.stroke(); }
    for (let y = 0; y <= H(); y++) { c.beginPath(); c.moveTo(ISO.wx(0, y), ISO.wy(0, y)); c.lineTo(ISO.wx(W(), y), ISO.wy(W(), y)); c.stroke(); }
    c.restore();
  }
  function drawItem(it, d) {
    const vr = VIEW.rect(it.x, it.y, d.w, d.d), MX = (VIEW.odd() ? 1 : 0) ^ (it.f ? 1 : 0) ? -1 : 1;
    const ox = ISO.sx(vr.x, vr.y), oy = ISO.sy(vr.x, vr.y);
    const LX = (x, y) => MX * ISO.sx(x, y);
    c.save(); c.translate(ox, oy);
    // Soft isometric drop shadow under furniture items
    if (it.k !== 'rug') {
      const fcx = LX(vr.w / 2, vr.d / 2), fcy = ISO.sy(vr.w / 2, vr.d / 2);
      const frx = (vr.w + vr.d) * 15.5, fry = (vr.w + vr.d) * 8;
      ART.ell(c, fcx + 1, fcy + 2, frx * 1.18, fry * 1.18, 'rgba(25,12,6,.12)');
      ART.ell(c, fcx, fcy + 1, frx, fry, 'rgba(35,18,8,.22)');
    }
    if (App.editing && editSel === it.id) { c.globalAlpha = .55; }
    if (App.editing && typeof editSel === 'string' && it.k === 'hab') { c.globalAlpha = .85; }
    if (it.k === 'hab') {
      const sl = G.slotsOfItem(it), occ = sl.map(i => S.pets[i]).filter(Boolean), p = occ[0];
      const kind = it.kind || (p ? ART.habitatKind(p.sp) : 'bed');
      const lv = S.houses[it.slot] || 1;
      c.save(); c.scale(MX, 1); FURN.habitat(c, kind, lv, T, !!p, it.model); c.restore();
      // v1.11: droppings / cloudy water in a dirty enclosure (grows with it.dirt)
      const dirt = it.dirt || 0;
      if (dirt >= 20 && occ.length) {
        const zf = kind === 'tank' || kind === 'terrarium' ? 20 : kind === 'birdcage' ? 14 : 9, nD = Math.min(7, Math.floor(dirt / 14));
        for (let i = 0; i < nD; i++) { const u = .25 + ((i * 37 + it.id * 13) % 50) / 100, v = .25 + ((i * 53 + it.id * 7) % 50) / 100, dx = LX(u, v), dy = ISO.sy(u, v) - zf;
          if (kind === 'tank') ART.ell(c, dx, dy, 2.4, 1.4, 'rgba(90,110,60,.85)'); else { ART.ell(c, dx, dy, 3, 1.8, '#9a6a3a', 'rgba(255,240,200,.8)', .7); ART.ell(c, dx + 3.2, dy + .8, 2.2, 1.4, '#a8763f', 'rgba(255,240,200,.7)', .6); } }
      }
      const resv = sl.some(i => (S.deliveries || []).some(d => d.slot === i && d.st !== 'arrived') || (S.breeding || []).some(b => (b.slots || []).includes(i)));
      if (!occ.length) { const [ex, ey] = [LX(.5, .5), ISO.sy(.5, .5)]; c.font = 'bold 13px sans-serif'; c.textAlign = 'center'; c.fillStyle = 'rgba(120,80,40,.75)'; c.fillText(resv ? '⏳' : '+', ex, ey - 12); c.textAlign = 'start'; }
      const inside = occ.map(q => [q, actors.get('p' + q.id)]).filter(([q, a]) => a && a.inHab && !(App.carry && App.carry.pid === q.id));
      if (inside.length) {
        const z = kind === 'tank' || kind === 'terrarium' ? 26 : kind === 'birdcage' ? 20 : 6;
        const n = inside.length, spread = n > 1 ? .5 / Math.max(1, n - 1) : 0;
        const pos = inside.map(([q, a], k) => { const off = n > 1 ? -.25 + k * spread : 0; const w = habWander(q, a, kind, .5 + off, .5 - off * .4); return w; });
        inside.forEach(([q, a], k) => {
          c.save(); const w = pos[k]; const [px, py] = [LX(w.u, w.v), ISO.sy(w.u, w.v)];
          c.translate(px, py - z - (w.hop || 0));
          const sz = (.4 + .6 * G.ageOf(q)) * (kind === 'birdcage' ? .8 : kind === 'tank' ? .9 : .85) * (n > 2 ? .82 : n > 1 ? .9 : 1);
          w.sz = sz; c.scale(sz, sz); if (a.trick) trickXf(a);
          const hst = petSt(a, q, { t: T + it.x + k, dir: w.dir * MX, moving: w.moving });
          const hpng = (typeof PNG_PETS !== 'undefined' && PNG_PETS[q.sp]) && drawPngPet(c, q.sp, hst);
          if (!hpng) ART.pet(c, q.sp, hst);
          c.restore();
          if (a.happyT > 0) a.happyT -= 1 / 60;
        });
        c.save(); c.scale(MX, 1);
        if (kind === 'tank' || kind === 'terrarium') FURN.tankFront(c, kind);
        if (kind === 'tank' && (it.dirt || 0) >= 40) { c.globalAlpha = Math.min(.45, ((it.dirt || 0) - 40) / 110); c.fillStyle = '#7f9a4a'; c.beginPath(); const q0 = [LX(.08, .08), ISO.sy(.08, .08)], q1 = [LX(.92, .08), ISO.sy(.92, .08)], q2 = [LX(.92, .92), ISO.sy(.92, .92)], q3 = [LX(.08, .92), ISO.sy(.08, .92)]; c.moveTo(q0[0], q0[1] - 34); c.lineTo(q1[0], q1[1] - 34); c.lineTo(q2[0], q2[1] - 34); c.lineTo(q2[0], q2[1] - 4); c.lineTo(q3[0], q3[1] - 4); c.lineTo(q3[0], q3[1] - 34); c.closePath(); c.fill(); c.globalAlpha = 1; } // murky water
        if (kind === 'cage') FURN.cageFront(c, kind);
        c.restore();
        inside.forEach(([q], k) => { const w = pos[k], k2 = w.sz || .85, fish = kind === 'tank', bird = kind === 'birdcage'; sexMark(LX(w.u, w.v) + (fish ? 17 : bird ? 19 : 23) * k2, ISO.sy(w.u, w.v) - z - (fish ? 13 : bird ? 29 : 32) * k2 - (w.hop || 0), q.sex, true, q.lv || 1); }); // beside the pet (upper right), small
      }
      // capacity badge
      const cap = sl.length;
      if (cap > 1 || App.carry) { const [bx, by] = [LX(.1, .9), ISO.sy(.1, .9)]; const txt = '🐾' + occ.length + '/' + cap; c.font = 'bold 9px sans-serif'; const w = c.measureText(txt).width + 8; c.fillStyle = occ.length >= cap ? 'rgba(200,80,60,.8)' : 'rgba(40,120,60,.75)'; ART.rrect(c, bx - w / 2, by - 6, w, 12, 5); c.fill(); c.fillStyle = '#fff'; c.textAlign = 'center'; c.fillText(txt, bx, by + 3); c.textAlign = 'start'; }
      if (S.breeding && S.breeding.some(b => b.auto && (b.slots || []).some(i => sl.includes(i)))) { c.font = '12px sans-serif'; c.fillText('💞', LX(.9, .1) - 6, ISO.sy(.9, .1) - 30 + Math.sin(T * 3) * 2); }
      // carry target highlight
      if (App.carry && App.carry.kind === kind && occ.length + 0 < cap && !resv) { const [hx, hy] = [LX(.5, .5), ISO.sy(.5, .5) - 50 - Math.abs(Math.sin(T * 4)) * 6]; c.beginPath(); c.moveTo(hx, hy + 8); c.lineTo(hx - 7, hy); c.lineTo(hx - 3, hy); c.lineTo(hx - 3, hy - 8); c.lineTo(hx + 3, hy - 8); c.lineTo(hx + 3, hy); c.lineTo(hx + 7, hy); c.closePath(); c.fillStyle = '#5cd65c'; c.fill(); c.lineWidth = 1.5; c.strokeStyle = '#2a7a2a'; c.stroke(); }
      // level badge
      if (lv > 1) { c.font = 'bold 9px sans-serif'; c.fillStyle = 'rgba(0,0,0,.35)'; ART.rrect(c, LX(.9, .9) - 2, ISO.sy(.9, .9) - 8, 22, 12, 5); c.fill(); c.fillStyle = '#fff'; c.fillText('★' + lv, LX(.9, .9) + 1, ISO.sy(.9, .9) + 1); }
    } else { c.save(); c.scale(MX, 1); FURN.item(c, it.k, T, G.GOODS_[it.k] ? Math.min(12, it.stock || 0) : it.stock); c.restore(); }
    if (it.k === 'groomtable') { const cu = S.customers.find(x => x.st === 'gwait'); const ca = cu && actors.get('c' + cu.id); if (ca && ca.arrived) { c.save(); c.translate(LX(.5, .5), ISO.sy(.5, .5) - 24); c.scale(.7, .7); ART.pet(c, cu.vsp, { t: T, happy: true }); c.restore(); } }
    if (G.GOODS_[it.k] && it.stock > 0) { const ics = Object.keys(it.inv || { [it.prod]: 1 }).filter(k => !it.inv || it.inv[k] > 0).map(k => (PRODUCTS.find(x => x.id === k) || {}).icon).filter(Boolean).slice(0, 3); if (ics.length) { const [bx, by] = [LX(1, .5), ISO.sy(1, .5) - 62]; c.font = '13px sans-serif'; c.textAlign = 'center'; ics.forEach((ic, q) => c.fillText(ic, bx + (q - (ics.length - 1) / 2) * 14, by + Math.sin(T * 2 + it.id + q) * 1.5)); c.textAlign = 'start'; } } // v1.13b: every product on the shelf
    if (G.GOODS_[it.k] && it.stock <= 2) { const [bx, by] = [LX(1, .5), ISO.sy(1, .5) - 58]; c.font = 'bold 11px sans-serif'; c.fillStyle = '#e0604e'; c.fillText(it.stock ? '⚠' + it.stock : 'EMPTY', bx - 14, by); }
    c.restore();
    const [sx, sy] = [ISO.wx(it.x + d.w / 2, it.y + d.d / 2), ISO.wy(it.x + d.w / 2, it.y + d.d / 2)];
    const vr2 = VIEW.rect(it.x, it.y, d.w, d.d);
    hits.push({ kind: 'item', item: it, x0: sx - vr2.w * 26 - 6, x1: sx + vr2.w * 26 + 6, y0: sy - 70, y1: sy + 14 });
    if (it.k === 'hab' && (it.dirt || 0) >= 60 && !App.editing) { const bx = sx, by = sy - 78 + Math.sin(T * 3 + it.id) * 2; // v1.11: "clean me" bubble
      c.save(); ART.rrect(c, bx - 13, by - 13, 26, 22, 8); c.fillStyle = (it.dirt || 0) >= 90 ? 'rgba(230,110,90,.95)' : 'rgba(255,255,255,.95)'; c.fill(); c.lineWidth = 1.2; c.strokeStyle = 'rgba(60,38,25,.7)'; c.stroke();
      c.font = '13px sans-serif'; c.textAlign = 'center'; c.fillText('🧽', bx, by + 3); c.textAlign = 'start'; c.restore();
      hits.push({ kind: 'habclean', item: it, x0: bx - 16, x1: bx + 16, y0: by - 16, y1: by + 12 }); }
  }
  function trickXf(a) {
    const k = a.trick.k, t = a.trick.t, ok = a.trick.ok;
    if (!ok && t > 1.2) { c.rotate(Math.min(1.2, (t - 1.2) * 3) * .9); return; }
    switch (k) {
      case 'spin': c.scale(Math.cos(t * 10), 1); break;
      case 'jump': case 'hoop': c.translate(0, -Math.abs(Math.sin(t * 5)) * 20); break;
      case 'roll': c.translate(0, -14); c.rotate(t * 7); c.translate(0, 14); break;
      case 'dance': c.translate(Math.sin(t * 10) * 5, -Math.abs(Math.sin(t * 10)) * 4); c.rotate(Math.sin(t * 10) * .15); break;
      case 'sit': case 'nod': c.scale(1, 1 - Math.abs(Math.sin(t * 4)) * .12); break;
      case 'stand': case 'paw': case 'highfive': case 'wave': c.translate(0, -8); c.rotate(-.35 * Math.min(1, t * 2)); break;
      default: c.translate(0, -Math.abs(Math.sin(t * 8)) * 5);
    }
  }
  function petSt(a, p, extra) {
    if (a.seed == null) a.seed = p.coat || ART.hashStr(p.id || p.name || p.sp);
    const mood = a.scared > 0 ? 'scared' : p.escaped ? 'curious' : ART.moodOf(p, Math.floor(T / 9 + a.seed % 7));
    return Object.assign({ seed: a.seed, mood, age: p.grow != null ? G.ageOf(p) : 1, sleep: a.sleep, happy: a.happyT > 0 || (a.trick && a.trick.ok), wear: p.wear }, extra);
  }
  function humMood(a) {
    if (a.sadGo) return 'sad'; // PET TOWN: a regular told "next time" walks off hurt
    if (a.type === 'insp') return 'stern';
    if (a.type === 'thief') return 'sneaky';
    if (a.type === 'staff') return a.m && a.m.job ? 'happy' : 'calm';
    if (a.type === 'reg') return a.leaving ? 'happy' : Math.sin(T * .7) > .3 ? 'happy' : 'calm';
    if (a.type === 'me' || a.type === 'partner') return a.happyT > 0 ? 'happy' : 'calm';
    if (a.reactT > 0) { a.reactT -= 1 / 60; return a.reactT > 1.6 ? 'surprised' : a.reactOk ? 'happy' : 'bored'; }
    if (a.sadT > 0) return a.sadWhy === 'nomatch' ? 'sad' : 'angry';
    if (a.hold) return 'happy';
    const cu = a.cust; if (!cu) return 'calm';
    if (a.watching && a.arrived) return 'love';
    if (cu.st === 'pay' || cu.st === 'pickup') return 'happy';
    if (a.arrived && cu.max) { const r = cu.pat / cu.max; if (r < .25) return 'angry'; if (r < .5) return 'bored'; }
    return 'calm';
  }
  function sexMark(x, y, sex, small, lv) {
    if (!sex) return;
    c.font = 'bold ' + (small ? 8 : 10) + 'px sans-serif'; c.textAlign = 'center'; c.lineWidth = small ? 2 : 2.5; c.strokeStyle = '#fff';
    const g = sex === 'm' ? '♂' : '♀'; c.strokeText(g, x, y); c.fillStyle = sex === 'm' ? '#3a7ad9' : '#e0508a'; c.fillText(g, x, y);
    if (lv >= 2) { const tx = x + (small ? 3 : 3.8); c.font = 'bold ' + (small ? 6 : 7) + 'px sans-serif'; c.textAlign = 'left'; c.lineWidth = 1.8; c.strokeText(String(lv), tx, y); c.fillStyle = '#8a6a4a'; c.fillText(String(lv), tx, y); } // v1.21: small level tag from lv2 up
    c.textAlign = 'start';
  }


  function drawActor(a) {
    if (!window.__log) window.__log = {};
    const k = a.type + (a.look ? '|hs:' + a.look.hs + '|old:' + (a.look.old ? 1 : 0) + '|hair:' + a.look.hair : '');
    window.__log[k] = (window.__log[k] || 0) + 1;
    if (a.type !== 'me' && a.type !== 'pet' && a.type !== 'stray' && a.look) {
      window.__log['__details_' + a.type] = { id: a.id, type: a.type, look: a.look, x: a.x, y: a.y };
    }
    if (a.type === 'fpet') { TOWN.drawFollower(c, a, T); return; } // v9.99
    let sx = ISO.wx(a.x, a.y), sy = ISO.wy(a.x, a.y);
    // v2026-10-08: "두명이 겹쳐서 걷는건 안되게 해줘" -- 마을주민/손님은 같은 길을 따라 걷거나 같은
    // 지점에 몰릴 때 완전히 겹쳐 보였음. 실제 좌표(길찾기/충돌)는 그대로 두고, 화면에 그릴 때만
    // 캐릭터별로 고정된(매 프레임 안 흔들리는) 작은 픽셀 오프셋을 줘서 서로 살짝 떨어져 보이게 함.
    if ((a.type === 'cust' || a.type === 'vil') && a.id) {
      const jh = typeof ART !== 'undefined' && ART.hashStr ? Math.abs(ART.hashStr(a.id)) : 0;
      sx += (jh % 17 - 8) * 1.7; sy += (Math.floor(jh / 17) % 6) * 1.3;
    }
    if (a.type === 'stray') {
      if (a.strayInfo && a.strayInfo.sp && a.sp !== a.strayInfo.sp) {
        a.sp = a.strayInfo.sp;
      }
      c.save();
      c.translate(sx, sy - (a.moving ? Math.abs(Math.sin(T * 8)) * 1.5 : 0));
      c.scale(.46 * (a.dir || 1), .46);
      ART.pet(c, a.sp, { t: T, mood: 'calm', seed: 7, age: 1, moving: a.moving, dir: a.dir || 1 });
      c.restore();
      c.save();
      c.font = 'bold 8px sans-serif';
      const STRAY_KO = {
        stray_shiba: '길 잃은 시바견',
        stray_kitten: '길 잃은 아기 고양이',
        stray_rabbit_white: '길 잃은 하얀 토끼',
        stray_hamster: '길 잃은 햄스터',
        stray_rat: '길 잃은 래트',
        stray_default: '길 잃은 동물',
        stray_kshort: '길 잃은 코숏 고양이',
        stray_pome: '떠돌이 포메라니안',
        stray_maltese: '길 잃은 말티즈',
        stray_persian: '길 잃은 페르시안 고양이',
        stray_golden: '착한 골든 리트리버',
        stray_ragdoll: '길 잃은 랙돌'
      };
      // User Request: 정확한 종 매칭 (a.sp 기반으로 이미지와 이름 일치)
      const spKey = a.sp || (a.strayInfo && a.strayInfo.sp) || 'shiba';
      const lang = (typeof CFG !== 'undefined' && CFG.lang) || ((typeof S !== 'undefined' && S && S.lang) || 'ko');
      let snameKey = 'stray_default';
      if (spKey === 'rabbit_white' || spKey === 'rabbit') snameKey = 'stray_rabbit_white';
      else if (spKey === 'hamster') snameKey = 'stray_hamster';
      else if (spKey === 'rat') snameKey = 'stray_rat';
      else if (spKey === 'kitten' || spKey === 'cat') snameKey = 'stray_kitten';
      else if (spKey === 'shiba' || spKey.startsWith('shiba_')) snameKey = 'stray_shiba';
      else if (a.strayInfo && a.strayInfo.k && STRAY_KO[a.strayInfo.k]) snameKey = a.strayInfo.k;
      else if (STRAY_KO['stray_' + spKey]) snameKey = 'stray_' + spKey;

      let sname = '';
      if (typeof t === 'function') {
        try {
          const trVal = t(snameKey);
          if (trVal && trVal !== snameKey) sname = trVal;
        } catch (e) {}
      }
      if (!sname && typeof I18N !== 'undefined' && I18N[lang] && I18N[lang][snameKey]) {
        sname = I18N[lang][snameKey];
      }
      if (!sname) {
        sname = (a.strayInfo && a.strayInfo.name) || STRAY_KO[snameKey] || '길 잃은 동물';
      }

      // User Request 2: 하얀 네모 박스 제거하고 글자만 작게 띄우며 동물 머리 위로 살짝 올려 배치
      const textY = sy - 24;
      c.textAlign = 'center';
      c.lineWidth = 2.2;
      c.strokeStyle = 'rgba(255,255,255,.95)';
      c.lineJoin = 'round';
      c.strokeText(sname, sx, textY);
      c.fillStyle = '#b34710';
      c.fillText(sname, sx, textY);
      c.restore();
      hits.push({ kind: 'strayactor', id: a.id, sp: a.sp, sname, actor: a, x0: sx - 22, x1: sx + 22, y0: sy - 36, y1: sy + 10 });
      return;
    }
    let [vdir, vface] = VIEW.df(a.dir || 1, a.face || 0);
    if (vface === 1 && sweeping(a)) vface = 0; // v1.19: sweep facing the camera so face and broom show
    c.save(); c.translate(sx, sy);
    if (a.type === 'me' || a.type === 'partner' || a.type === 'cust' || a.type === 'insp' || a.type === 'reg' || a.type === 'staff' || a.type === 'thief' || a.type === 'cafeguest' || a.type === 'patient' || a.type === 'hstaff' || a.type === 'vil') {
      // v1.100.14: 필드 캐릭터가 프리뷰보다 가로로 좁아 보인다는 피드백 - 가로로 12% 더 넓게
      // v1.100.49: "사람들 크기가 다 다르다" 피드백 - 직원(staff/hstaff)은 human.js의 STAFF_HEAD_SIZE/
      // STAFF_BODY_SIZE에서 10% 축소 처리함(여기서는 안 건드림). 시민(손님/주민 등 플레이어·직원이 아닌
      // 일반 NPC)은 여기서 전체적으로 20% 키움.
      // v1.100.51: "시민 지금 크기에 5%만 줄여줄래. 너무 커져버렸어" - 기존 1.2배에서 5% 추가로 줄임 (1.2*0.95=1.14)
      const citizenScale = (a.type === 'cust' || a.type === 'vil' || a.type === 'cafeguest' || a.type === 'patient' || a.type === 'reg' || a.type === 'insp' || a.type === 'thief') ? 1.2 * 0.95 : 1;
      if (a.type === 'cust' && !window.__scaleLogged) {
        window.__scaleLogged = true;
        console.warn('citizenScale for cust:', citizenScale, 'a.type:', a.type);
      }
      c.scale((vdir < 0 ? -1 : 1) * 1.12 * citizenScale, citizenScale);
      if (a.type === 'me') a.hold = App.carry ? { sp: App.carry.sp, coat: App.carry.coat, id: App.carry.pid } : null;
      if (a.type === 'staff') a.hold = a.m && a.m.job && a.m.job.k === 'carry' ? { sp: a.m.job.sp, coat: a.m.job.coat } : null; // v1.26: porter carrying a new pet home
      const held = a.hold && (a.type === 'cust' || a.type === 'me' || a.type === 'patient' || a.type === 'staff') && !(a.cust && a.cust.st === 'gwait' && a.arrived);
      if (held && vface === 1 && a.type !== 'staff') drawHeld(a);
      { const tg = a.sit ? 1 : 0, dA = Math.min(.1, Math.max(0, T - (a.skT == null ? T : a.skT))); a.skT = T; a.sk = a.sk == null ? tg : a.sk + Math.sign(tg - a.sk) * Math.min(Math.abs(tg - a.sk), dA * 3.5); ART.setSit(a.sk); } // sit down / stand up: the legs fold over ~.3s
      ART.human(c, a.type === 'me' ? CFG.look : a.look, vface, a.t, a.moving && !a.sit, (a.type === 'cafeguest' || a.type === 'patient' || a.type === 'hstaff') ? (a.angry ? 'angry' : a.happyT > 0 ? 'happy' : 'calm') : humMood(a), a.diag, a.faceBack);
      ART.setSit(0);
      if (a.type === 'me' || a.type === 'hstaff') drawFarmToolSwing(a);
      if (sweeping(a)) drawBroom();
      if (held && (vface !== 1 || a.type === 'staff')) drawHeld(a); // staff carrying a pet: always visible in their arms
      if (a.type === 'insp') { ART.rrect(c, 6, -34, 10, 13, 2); c.fillStyle = '#f5f0e6'; c.fill(); c.strokeStyle = ART.OUT; c.lineWidth = 1; c.stroke(); }
      if (a.type === 'thief') { ART.ell(c, -9, -22, 6, 7, '#3a3a44', ART.OUT, 1.2); c.font = 'bold 9px sans-serif'; c.fillStyle = '#ffd23a'; c.textAlign = 'center'; c.fillText('$', -9, -19); c.textAlign = 'start'; }
      c.restore();
      if (a.type === 'me' && a.harvMsg && a.harvMsg.t > 0) {
        c.save();
        c.font = 'bold 12px sans-serif';
        const msg = a.harvMsg.text;
        const tw = c.measureText(msg).width;
        const bw = Math.max(76, tw + 20), bh = 26;
        const bx = sx, by = sy - 84;
        c.fillStyle = '#fffdf7';
        c.strokeStyle = '#6b4c2a';
        c.lineWidth = 1.8;
        ART.rrect(c, bx - bw / 2, by - bh / 2, bw, bh, 8);
        c.fill(); c.stroke();
        c.beginPath();
        c.moveTo(bx - 4, by + bh / 2);
        c.lineTo(bx, by + bh / 2 + 5);
        c.lineTo(bx + 4, by + bh / 2);
        c.fillStyle = '#fffdf7'; c.fill();
        c.beginPath();
        c.moveTo(bx - 4, by + bh / 2);
        c.lineTo(bx, by + bh / 2 + 5);
        c.lineTo(bx + 4, by + bh / 2);
        c.stroke();
        c.fillStyle = '#4a2c11';
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillText(msg, bx, by);
        c.restore();
      }
      if (a.type === 'staff' && a.m && a.m.job && !a.moving && Math.hypot(a.x - a.m.job.x - .5, a.y - a.m.job.y - .5) < 1.6) { // v1.26: what the staff member is doing right now, with a little effect
        const ic = { feed: '🍖', clean: '🧽', pat: '💕', play: '🎾', gpet: '✂️', gsvc: '✂️', restock: '📦', crate: '📦', hab: '🧽' }[a.m.job.k];
        if (ic) { bubble(sx + 4, sy - 66, () => { c.font = '16px sans-serif'; c.textAlign = 'center'; c.fillStyle = '#000'; c.fillText(ic, 0, Math.sin(T * 6) * 1.5); c.textAlign = 'start'; });
          if (['feed', 'pat', 'play'].includes(a.m.job.k) && Math.random() < .05) fxHeart(sx + (Math.random() - .5) * 30, sy - 40);
          if (a.m.job.k === 'clean' && Math.random() < .08) fxHeart(sx + (Math.random() - .5) * 26, sy - 30);
          if (a.m.job.k === 'gsvc' || a.m.job.k === 'gpet') {
            // User Request 7: Animated grooming with moving scissors, fluffy shampoo suds, and sparkles
            const snipAngle = Math.sin(T * 14) * 0.45;
            c.save();
            c.translate(sx - 10, sy - 36);
            c.rotate(snipAngle);
            c.font = '19px sans-serif';
            c.fillText('✂️', -9, 0);
            c.restore();
            // Fluffy bubbles around the pet
            const b1 = Math.sin(T * 7) * 7, b2 = Math.cos(T * 6) * 6;
            ART.ell(c, sx + 12 + b1, sy - 32 + b2, 3.5, 3.5, 'rgba(255,255,255,.9)', 'rgba(180,220,255,.8)', 1);
            ART.ell(c, sx - 16 - b2, sy - 38 + b1, 2.5, 2.5, 'rgba(255,255,255,.9)', 'rgba(180,220,255,.8)', 1);
            if (Math.sin(T * 9) > 0.3) {
              c.font = '14px sans-serif';
              c.fillText('✨', sx + 10, sy - 48);
            }
          }
        }
      }
      if (a.sadGo) { c.font = '14px sans-serif'; c.textAlign = 'center'; c.fillText('😢', sx + 10, sy - 62 - Math.abs(Math.sin(T * 4)) * 2); c.textAlign = 'start'; }
      if (a.type === 'vil') { // PET TOWN: villager's own pet on a walk + what they are up to
        // v2026-10-08: "펫이 다리에 붙어있어, 옆에서 같이 걷게 해줘" -- 발밑(12px만 옆, 3px 아래)에
        // 바짝 붙어 겹쳐 보이던 걸, 사람과 나란히 걷도록 더 옆으로 떨어뜨리고(22px) 땅 위(발 높이)에
        // 놓음. 살짝 자기 걸음 박자로 통통 튀게(moving일 때만) 해서 따로 걷는 느낌을 줌.
        // v2026-10-08: "애완동물 위치를 사람 발끝 선에 맞춰서 아래로 내려줘" -- sy(사람 발 기준점)에서
        // 거의 안 내려가 있어서 공중에 뜬 것처럼 보였음. 땅에 닿도록 더 내림(+9).
        if (a.pet) { const pBob = a.moving ? Math.abs(Math.sin(a.t * 8)) * 2 : 0; c.save(); c.translate(sx - 22 * vdir, sy + 9 - pBob); c.scale(.4 * vdir, .4); ART.pet(c, a.pet, { t: T, mood: 'happy', seed: a.id.length * 31, age: 1, moving: a.moving, dir: vdir }); c.restore(); }
        if (a.emoT > 0 && a.emo) { c.font = '13px sans-serif'; c.textAlign = 'center'; c.fillText(a.emo, sx + 9, sy - 60 - Math.abs(Math.sin(T * 3)) * 2); c.textAlign = 'start'; }
        // v2026-10-08: 공원 산책 중 머리 위에 띄우는 속마음 한마디 ("공원에 오니깐 너무 좋다" 등)
        if (a.sayT > 0 && a.say) {
          c.save(); c.font = 'bold 11px sans-serif';
          const tw = c.measureText(a.say).width + 16, by = sy - 94;
          ART.rrect(c, sx - tw / 2, by - 12, tw, 22, 10); c.fillStyle = '#fff'; c.fill(); c.lineWidth = 1.4; c.strokeStyle = 'rgba(60,38,25,.6)'; c.stroke();
          c.beginPath(); c.moveTo(sx - 5, by + 9); c.lineTo(sx, by + 15); c.lineTo(sx + 5, by + 9); c.fillStyle = '#fff'; c.fill();
          c.fillStyle = '#5a3a2a'; c.textAlign = 'center'; c.fillText(a.say, sx, by + 3); c.restore();
        }
        // 호수 낚시 중인 주민: 낚싯대, 낚싯줄, 찌, 입질/물보라 애니메이션
        if (a.lakeAct === 'fish' && a.st === 'in') {
          c.save();
          const tug = (a.fishTug > 0) ? Math.sin(T * 14) * 3 : Math.sin(T * 2.2) * 1;
          const rodDir = vdir || 1;
          const handX = sx + 7 * rodDir;
          const handY = sy - 28 + (a.sit ? 7 : 0);
          const tipX = sx + (26 + (a.fishTug > 0 ? 3 : 0)) * rodDir;
          const tipY = sy - 46 + tug + (a.sit ? 7 : 0);

          // 낚싯대
          c.beginPath();
          c.moveTo(handX, handY);
          c.lineTo(tipX, tipY);
          c.strokeStyle = '#8a5a33';
          c.lineWidth = 1.8;
          c.lineCap = 'round';
          c.stroke();

          // 낚싯줄
          const floatX = tipX + 16 * rodDir;
          const floatY = sy + 6 + (a.sit ? 6 : 0);
          c.beginPath();
          c.moveTo(tipX, tipY);
          c.quadraticCurveTo(tipX + 8 * rodDir, (tipY + floatY) / 2 - 2, floatX, floatY);
          c.strokeStyle = 'rgba(255, 255, 255, 0.85)';
          c.lineWidth = 0.8;
          c.stroke();

          // 찌 (부표) & 수면 파문
          const bobY = floatY + Math.sin(T * 3.5) * 1.5 + (a.fishTug > 0 ? 2.5 : 0);
          ART.ell(c, floatX, bobY + 2, 5, 2.4, null, 'rgba(255, 255, 255, 0.45)', 0.9);
          ART.ell(c, floatX, bobY - 1, 2.2, 2.2, '#ff4444', ART.OUT, 0.5);
          ART.ell(c, floatX, bobY + 1, 1.8, 1.8, '#ffffff', ART.OUT, 0.5);

          // 입질 시 손맛 이펙트 및 수면 물보라
          if (a.fishTug > 0) {
            ART.ell(c, floatX, floatY + 2, 8.5, 3.8, null, 'rgba(255, 255, 255, 0.75)', 1.2);
            if (Math.sin(T * 8) > 0.1) {
              c.font = '12px sans-serif';
              c.textAlign = 'center';
              c.fillText('🐟', floatX + Math.sin(T * 6) * 3, floatY - 8);
            }
          }
          c.restore();
        }
        // 호수에서 휴식 중인 주민: 힐링 반짝임 이펙트
        if (a.lakeAct === 'rest' && a.st === 'in') {
          if (Math.sin(T * 1.8 + (a.id.length || 0)) > 0.45) {
            c.save();
            c.font = '12px sans-serif';
            c.textAlign = 'center';
            c.fillText('✨', sx + 12, sy - 52 - Math.abs(Math.sin(T * 2)) * 3);
            c.restore();
          }
        }
      }
      if (a.type === 'hstaff' && a.m) { const R0 = hospStaffRole(a.m.role) || cafeStaffRole(a.m.role) || farmStaffRole(a.m.role) || salonStaffRole(a.m.role); label(sx, sy - 100, (R0 ? R0.icon : '') + ' Lv' + a.m.lv, null, '#eef9ff'); if (a.talk || a.m.tt > 0) bubble(sx + 4, sy - 116, () => { c.font = '15px sans-serif'; c.textAlign = 'center'; c.fillText(Math.floor(T * 1.7) % 2 ? '💬' : (a.m.role === 'recept' ? '📋' : farmStaffRole(a.m.role) ? ({ harvest: '\u{1F9FA}', water: '\u{1F4A7}', plant: '\u{1F331}', feed: '\u{1F963}', eggs: '\u{1F95A}' }[a.m.act] || farmStaffRole(a.m.role).icon) : '🩺'), 0, 0); c.textAlign = 'start'; }); }
      if (a.salon) { // v9.99: salon guests -- waiting (tap to groom), then paying with the amount, holding a pet with a bow
        if (a.salonWait) { bubble(sx, sy - 66, () => { c.font = '17px sans-serif'; c.textAlign = 'center'; c.fillText(Math.floor(T * 1.5) % 2 ? '🛁' : '✂️', 0, 0); c.textAlign = 'start'; }); }
        if (a.hold && a.happyT > 0) { c.font = '11px sans-serif'; c.textAlign = 'center'; c.fillText('🎀', sx + 6, sy - 44); c.textAlign = 'start'; }
        if (a.salonPaid) { const msg = '+\u{1FA99}' + fmt(a.salonPaid); c.save(); c.font = 'bold 12px sans-serif'; const tw = c.measureText(msg).width + 14, by = sy - 100; ART.rrect(c, sx - tw / 2, by - 12, tw, 22, 10); c.fillStyle = '#fff6d6'; c.fill(); c.lineWidth = 1.6; c.strokeStyle = '#e0a820'; c.stroke(); c.fillStyle = '#9a6a10'; c.textAlign = 'center'; c.fillText(msg, sx, by + 3); c.restore(); }
      }
      if (a.type === 'hstaff' && a.cafeCook) drawCafeCooking(a, sx, sy);
      if (a.type === 'hstaff' && a.carry) { const d0 = sx + 12 * (a.dir || 1), bob = a.moving ? Math.abs(Math.sin(T * 9)) * 1.5 : 0; ART.ell(c, d0, sy - 34 - bob, 10, 4, '#fff', ART.OUT, 1); c.font = '15px sans-serif'; c.textAlign = 'center'; c.fillText(a.carry, d0, sy - 36 - bob); c.textAlign = 'start'; }
      if (a.type === 'hstaff' && a.m && a.m.why && farmStaffRole(a.m.role) && !(a.m.tt > 0)) { // an idle farmhand says why
        const msg = ({ coin: '💰 ', full: '🚫 ', none: '💤 ' }[a.m.why] || '') + t('fwhy_' + a.m.why); c.save(); c.font = 'bold 11px sans-serif'; const tw = c.measureText(msg).width + 16;
        ART.rrect(c, sx - tw / 2, sy - 118, tw, 24, 9); c.fillStyle = '#fff'; c.fill(); c.lineWidth = 1.5; c.strokeStyle = 'rgba(60,38,25,.7)'; c.stroke();
        c.beginPath(); c.moveTo(sx - 5, sy - 94); c.lineTo(sx, sy - 88); c.lineTo(sx + 5, sy - 94); c.fillStyle = '#fff'; c.fill();
        c.fillStyle = '#5a3a2a'; c.textAlign = 'center'; c.fillText(msg, sx, sy - 101); c.restore();
      }
      if (a.type === 'me' && S.hosp && (S.hosp.patients || []).some(p => p.by === 'me' && (p.ph === 'deskserve' || p.ph === 'treat'))) bubble(sx + 4, sy - 66, () => { c.font = '16px sans-serif'; c.textAlign = 'center'; c.fillText(Math.floor(T * 1.7) % 2 ? '💬' : '🩺', 0, 0); c.textAlign = 'start'; });
      if (a.type === 'patient' && a.pat && a.pat.ph === 'full') { // "the benches are all taken" -> a wide text bubble
        const msg = t('hosp_full'); c.save(); c.font = 'bold 12px sans-serif'; const tw = c.measureText(msg).width + 18;
        ART.rrect(c, sx - tw / 2, sy - 96, tw, 26, 10); c.fillStyle = '#fff'; c.fill(); c.lineWidth = 1.6; c.strokeStyle = 'rgba(60,38,25,.7)'; c.stroke();
        c.beginPath(); c.moveTo(sx - 5, sy - 71); c.lineTo(sx, sy - 64); c.lineTo(sx + 5, sy - 71); c.fillStyle = '#fff'; c.fill();
        c.fillStyle = '#5a3a2a'; c.textAlign = 'center'; c.fillText(msg, sx, sy - 78); c.restore();
      } else if (a.type === 'patient' && a.pat && !a.leaving) { const pp = a.pat, st0 = hospStage(pp), tx = hospTx(st0), ail = HOSP_AIL.find(x => x.id === pp.ail), ic = pp.ph === 'deskserve' ? (Math.floor(T * 1.7) % 2 ? '💬' : '🙂') : pp.ph === 'leaving' ? (pp.turned ? '😓' : '💗') : pp.ph === 'bench' ? '⏳' : pp.ph === 'treat' ? (Math.floor(T * 1.4) % 2 ? tx.icon : '😖') : pp.ph === 'atStn' ? '🙏' : (pp.ph === 'toStn' && tx ? tx.icon : (st0 === 'pay' ? '🧾' : '🛎️')); bubble(sx, sy - 66, () => { c.font = '18px sans-serif'; c.textAlign = 'center'; c.fillText(ic, 0, 0); c.textAlign = 'start'; }); if (ail) { c.save(); c.font = '13px sans-serif'; c.textAlign = 'center'; c.fillText(ail.icon, sx + 20, sy - 74); c.restore(); } }
      if (a.type === 'cafeguest' && a.order && !a.leaving && !a.served && a.order.kind) { const kd = CAFE_GUEST_KINDS.find(k => k.id === a.order.kind); if (kd) { c.save(); c.font = '13px sans-serif'; c.textAlign = 'center'; c.fillText(kd.icon, sx + 20, sy - 74); c.restore(); } }
      if (a.type === 'cafeguest' && a.eating > 0) { // v9.91: eating -- plate on the table, the dish getting smaller bite by bite, fork to the mouth, chewing
        const tp = a.tbl ? [ISO.wx(a.tbl.x, a.tbl.y), ISO.wy(a.tbl.x, a.tbl.y)] : null, prog = Math.min(1, 1 - a.eating / (a.eatDur || 14)), cyc = (T * 1.1) % 1, up = cyc < .5 ? Math.sin(cyc * 2 * Math.PI) : 0;
        c.save(); c.textAlign = 'center';
        if (tp) { ART.ell(c, tp[0], tp[1] - 24, 13, 5.5, '#ffffff', 'rgba(60,38,25,.6)', 1); const sc = 1 - prog * .7; c.font = Math.round(20 * sc) + 'px sans-serif'; if (prog < .95) c.fillText(a.dish || '🍽️', tp[0], tp[1] - 25); else { c.font = '10px sans-serif'; c.fillText('✨', tp[0], tp[1] - 26); } }
        const side = tp ? Math.sign(tp[0] - sx) || 1 : 1, fx = sx + side * (14 - 8 * up), fy = sy - 26 - 22 * up; c.font = '14px sans-serif'; c.fillText('🍴', fx, fy);
        if (up > .8) { c.font = '9px sans-serif'; c.fillText('·', fx - side * 4, fy - 6); }
        if (cyc > .55 && cyc < .95) { c.font = 'bold 10px sans-serif'; c.fillStyle = '#e07a3a'; c.fillText(t('cafeYum'), sx + side * 18, sy - 58 - (cyc - .55) * 12); }
        c.restore();
        bubble(sx, sy - 66, () => { c.font = '18px sans-serif'; c.textAlign = 'center'; c.fillText(prog > .85 ? '😊' : Math.floor(T * 1.6) % 3 === 2 ? '💕' : '😋', 0, 0); c.textAlign = 'start'; });
      }
      // v9.84: how much a café guest / hospital patient pays, in a gold bubble over their head
      { let amt = null, age = 0;
        if (a.type === 'cafeguest' && a.payT > 0 && a.order && a.order.paid) { amt = a.order.paid; age = 2.6 - a.payT; }
        else if (a.type === 'cafeguest' && S.cafe && S.cafe.slotPaid) { const k = a.id.slice(2), sp0 = S.cafe.slotPaid[k]; if (sp0) { amt = sp0.c; age = sp0.t; } }
        else if (a.type === 'patient' && a.pat && a.pat.paid && a.pat.ph === 'leaving' && a.pat.tm > 10.5) { amt = a.pat.paid; age = 14 - a.pat.tm; }
        if (amt) { const msg = '+\u{1FA99}' + fmt(amt); c.save(); c.font = 'bold 12px sans-serif'; const tw = c.measureText(msg).width + 14, by = sy - (a.type === 'cafeguest' && a.payT > 0 ? 128 : a.type === 'patient' ? 124 : 100) - Math.min(1, age) * 6; // above the receipt bubble
          c.globalAlpha = Math.min(1, 3.5 - age * .7 > 1 ? 1 : Math.max(.2, 3.5 - age * .7));
          ART.rrect(c, sx - tw / 2, by - 12, tw, 22, 10); c.fillStyle = '#fff6d6'; c.fill(); c.lineWidth = 1.6; c.strokeStyle = '#e0a820'; c.stroke();
          c.fillStyle = '#9a6a10'; c.textAlign = 'center'; c.fillText(msg, sx, by + 3); c.restore(); } }
      if (a.type === 'cafeguest' && a.payT > 0) { // paying at the cashier's desk: coins hop up
        const k2 = (2.6 - a.payT) / 2.6; c.save(); c.textAlign = 'center'; c.globalAlpha = Math.min(1, a.payT * 2); c.font = '16px sans-serif'; c.fillText('🪙', sx + 10, sy - 30 - 34 * k2); c.restore();
        bubble(sx, sy - 66, () => { c.font = '18px sans-serif'; c.textAlign = 'center'; c.fillText(Math.floor(T * 3) % 2 ? '💰' : '🧾', 0, 0); c.textAlign = 'start'; });
      }
      if (a.type === 'cafeguest' && a.angryUntil > T) { // "음식이 없네…" / "음식을 안 주네!" / "음식을 언제 주는 거야!"
        const msg = '\u{1F4A2} ' + t('cafeAngry' + (a.angryLine | 0)); c.save(); c.font = 'bold 11px sans-serif'; const tw = c.measureText(msg).width + 16, by = sy - 92 + Math.sin(T * 14) * .8;
        ART.rrect(c, sx - tw / 2, by - 12, tw, 24, 9); c.fillStyle = '#fff1ef'; c.fill(); c.lineWidth = 1.6; c.strokeStyle = '#d0503e'; c.stroke();
        c.beginPath(); c.moveTo(sx - 5, by + 12); c.lineTo(sx, by + 18); c.lineTo(sx + 5, by + 12); c.fillStyle = '#fff1ef'; c.fill();
        c.fillStyle = '#b23a2a'; c.textAlign = 'center'; c.fillText(msg, sx, by + 4); c.restore();
      }
      if (a.type === 'cafeguest' && a.ordT > 0) { const ds0 = a.order && CAFE_DISHES.find(x => x.id === a.order.dish); bubble(sx, sy - 66, () => { c.font = '18px sans-serif'; c.textAlign = 'center'; c.fillText(Math.floor(T * 2) % 2 ? '\u{1F6CE}\uFE0F' : (ds0 ? ds0.icon : '\u{1F37D}\uFE0F'), 0, 0); c.textAlign = 'start'; }); }
      if (a.type === 'cafeguest' && a.order && !a.leaving && !a.served && a.ordered && !(a.ordT > 0)) { const ds = CAFE_DISHES.find(x => x.id === a.order.dish); bubble(sx, sy - 66, () => { c.font = '18px sans-serif'; c.textAlign = 'center'; c.fillText(ds ? ds.icon : '🍽️', 0, 0); c.textAlign = 'start'; }); }
      // the pet they just adopted, sitting with them -- "펫샵에서 펫을 산 사람만" should visibly
      // be there WITH the pet they bought, not just an unrelated diner
      if (a.type === 'cafeguest' && a.buyerSp && !(a.petMode === 'pen' && a.petIn)) { c.save(); c.translate(sx + 14 * vdir, sy); c.scale(.32 * vdir, .32); ART.pet(c, a.buyerSp, { t: a.t, mood: 'happy', seed: a.id, age: 1 }); c.restore(); }
      if (a.happyT > 0) a.happyT -= 1 / 60;
      if (a.type !== 'me') hits.push({ kind: a.type, actor: a, x0: sx - 18, x1: sx + 18, y0: sy - 72, y1: sy + 4 });
      return;
    }
    if (a.type === 'truck') { if (VIEW.odd()) c.scale(-1, 1); drawTruck(a); c.restore(); return; }
    if (a.inHab || (App.carry && a.pet && App.carry.pid === a.pet.id)) { c.restore(); return; }
    const p = a.pet;
    if (!p) { c.restore(); return; }
    const sz = p && p.grow != null ? .36 + .64 * G.ageOf(p) : 1;
    if (a.slide > 0) c.translate(0, -Math.max(0, a.slide - .2) * 24);
    if (a.hop > 0) c.translate(0, -Math.sin(a.hop / .6 * Math.PI) * 12);
    if (a.scared > 0) c.translate(Math.sin(T * 60) * 1.2, 0);
    const squat = a.poopUntil > T; if (squat) { c.translate(Math.sin(T * 40) * .8, 0); }
    c.scale(sz, sz); if (squat) c.scale(1.06, .9);
    if (a.trick) trickXf(a);
    const pst = petSt(a, p, { t: a.t, moving: a.moving, dir: vdir });
    const pngOk = (typeof PNG_PETS !== 'undefined' && PNG_PETS[p.sp]) && drawPngPet(c, p.sp, pst);
    if (!pngOk) ART.pet(c, p.sp, pst);
    if (a.happyT > 0) a.happyT -= 1 / 60;
    c.restore();
    if (squat) { c.font = '12px sans-serif'; c.textAlign = 'center'; c.fillText('💦', sx + 10 * sz, sy - 36 * sz - (T % .8) * 6); c.fillText('💨', sx - 16 * sz * vdir, sy - 6 - (T % .6) * 8); c.textAlign = 'start'; }
    if (a.type === 'pet' && p) { const lk = ART.look(p.sp, a.seed || p.coat || 0); // v1.17: rabbits' tall ears -> mark goes beside the ears instead of on them
      const L = p.lv || 1;
      if (lk.t === 'rabbit') { if (lk.ear === 'lop') sexMark(sx + 13 * sz, sy - 62 * sz, p.sex, false, L); else sexMark(sx + 22 * sz, sy - 43 * sz, p.sex, false, L); }
      else if (lk.t === 'cat' || lk.t === 'dog') sexMark(sx + 40 * sz, sy - 50 * sz, p.sex, false, L); // ★ -38 → -48 (10px 더 위로)
      else sexMark(sx + 12 * sz, sy - 44 * sz, p.sex, false, L); }
    if (a.happyT > .9 && Math.random() < .08) fxHeart(sx, sy - 40);
    if (a.type === 'pet') hits.push({ kind: 'pet', actor: a, x0: sx - 22, x1: sx + 22, y0: sy - 50, y1: sy + 6 });
    if (a.type === 'guest') hits.push({ kind: 'guest', actor: a, x0: sx - 22, x1: sx + 22, y0: sy - 50, y1: sy + 6 });
  }
  function drawHeld(a) {
    c.save(); c.translate(2, -24 + Math.sin(a.t * 3) * .6); c.scale(.46, .46); ART.pet(c, a.hold.sp, { t: a.t, happy: Math.sin(a.t * .8) > -.3, mood: 'love', seed: a.hold.coat || (a.hold.id ? ART.hashStr(a.hold.id) : 0) }); c.restore();
    if (Math.random() < .015) fxHeart(ISO.wx(a.x, a.y), ISO.wy(a.x, a.y) - 60);
  }
  const hearts = [];
  function fxHeart(x, y) { if (hearts.length < 30) hearts.push({ x, y, t: 0 }); }
  function drawHearts(dt) {
    for (let i = hearts.length - 1; i >= 0; i--) { const h = hearts[i]; h.t += dt; if (h.t > 1.2) { hearts.splice(i, 1); continue; } c.globalAlpha = 1 - h.t / 1.2; c.font = '12px sans-serif'; c.fillText('♥', h.x + Math.sin(h.t * 6) * 4, h.y - h.t * 30); }
    c.globalAlpha = 1;
  }
  // farm action fx: dirt clods on till, drops on water, a rising crop+sparkle on harvest,
  // plus a brief tool-swing pose on `me` so tilling/watering/harvesting reads as an action
  const farmParts = [];
  function farmAction(kind, gx, gy, cropId) {
    const sx = ISO.wx(gx + .5, gy + .5), sy = ISO.wy(gx + .5, gy + .5);
    if (me) {
      me.farmAction = { kind, t: 0 };
      if (kind === 'till' || kind === 'water') {
        me.diag = 1;
        me.face = 3;
        me.faceBack = false;
        me.dir = 1;
      }
      if (kind === 'harvest') {
        const cname = (cropId && t('crop_' + cropId) !== 'crop_' + cropId) ? t('crop_' + cropId) : (cropId || '');
        let htext = t('farmHarvestBubble', { c: cname });
        if (CFG.lang !== 'ru' && cname) {
          const code = cname.charCodeAt(cname.length - 1);
          const josa = (code >= 0xac00 && code <= 0xd7a3 && (code - 0xac00) % 28 !== 0) ? '을' : '를';
          htext = `${cname}${josa} 수확했어!`;
        }
        me.harvMsg = { text: htext, t: 2.2 };
      }
    }
    if (kind === 'till') for (let i = 0; i < 8; i++) farmParts.push({ x: sx + (Math.random() - .5) * 16, y: sy - 2, vx: (Math.random() - .5) * 50, vy: -60 - Math.random() * 40, g: 180, t: 0, life: .5, e: '🟤', sz: 9 });
    else if (kind === 'water') for (let i = 0; i < 8; i++) farmParts.push({ x: sx + (Math.random() - .5) * 14, y: sy - 22, vx: (Math.random() - .5) * 20, vy: 60 + Math.random() * 50, g: 260, t: 0, life: .5, e: '💧', sz: 12 });
    else if (kind === 'harvest') farmParts.push({ x: sx, y: sy - 8, vx: 0, vy: -55, g: 40, t: 0, life: .8, e: '✨', sz: 20 });
    else if (kind === 'plant') farmParts.push({ x: sx, y: sy - 24, vx: 0, vy: 90, g: 0, t: 0, life: .35, e: '🌱', sz: 14 });
  }
  function drawFarmParts(dt) {
    c.save();
    for (let i = farmParts.length - 1; i >= 0; i--) { const p = farmParts[i]; p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.g * dt; if (p.t > p.life) { farmParts.splice(i, 1); continue; } c.globalAlpha = Math.max(0, 1 - p.t / p.life); c.font = p.sz + 'px sans-serif'; c.textAlign = 'center'; c.fillText(p.e, p.x, p.y); }
    c.restore();
  }
  // v1.19: a pet-made poop -- the pet trots to the spot, squats with a little 💨, THEN the poop appears (client-side only)
  const poopAnim = new Map();
  function poopShown(m) {
    if (m.k !== 'poop' || m.pid == null || !m.at || Date.now() - m.at > 15000) return true;
    let st = poopAnim.get(m.id);
    if (!st) { const a = actors.get('p' + m.pid); if (!a || a.inHab || a.pet && a.pet.escaped) { poopAnim.set(m.id, { done: 1 }); return true; }
      st = { a, t0: T }; poopAnim.set(m.id, st); a.walkPoop = 1; goTo(a, m.x, m.y, () => { st.sq = T; a.poopUntil = T + 1.6; a.walkPoop = 0; }); if (poopAnim.size > 50) poopAnim.clear(); }
    if (st.done) return true;
    if (st.sq != null && T > st.sq + 1.2) { st.done = 1; return true; }
    if (T - st.t0 > 9) { st.done = 1; if (st.a) st.a.walkPoop = 0; return true; } // could not get there: just appear
    return false;
  }
  // v1.19: cleaning -- a broom appears in the hand and sweeps (me after tapping a mess / cage, cleaner staff while on a clean job)
  function drawBroom() {
    const sw = Math.sin(T * 14) * .45;
    c.save(); c.translate(9, -24); c.rotate(.55 + sw);
    c.lineCap = 'round'; c.lineWidth = 3.2; c.strokeStyle = ART.OUT; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 26); c.stroke(); c.lineWidth = 2; c.strokeStyle = '#c98f55'; c.stroke();
    c.beginPath(); c.moveTo(-5, 25); c.lineTo(5, 25); c.lineTo(8, 36); c.lineTo(-8, 36); c.closePath(); c.fillStyle = '#e8c56a'; c.fill(); c.lineWidth = 1; c.strokeStyle = ART.OUT; c.stroke();
    c.strokeStyle = 'rgba(140,100,40,.7)'; c.lineWidth = .7; for (const x of [-5, -2, 1, 4]) { c.beginPath(); c.moveTo(x * .8, 27); c.lineTo(x * 1.3, 35); c.stroke(); }
    c.fillStyle = '#b8503a'; c.fillRect(-5.5, 24, 11, 2.5);
    c.restore();
    c.globalAlpha = .55; for (let i = 0; i < 3; i++) { const ph = (T * 2.5 + i / 3) % 1; ART.ell(c, 16 + i * 5 + ph * 8, -2 - ph * 10, 3 + ph * 3, 2 + ph * 2, '#d8cbb8'); } c.globalAlpha = 1;
  }
  const sweeping = a => (a.type === 'me' && a.broomUntil > T) || (a.type === 'staff' && a.m && a.m.job && (a.m.job.k === 'mess' || a.m.job.k === 'hab') && !a.moving && Math.hypot(a.x - a.m.job.x - .5, a.y - a.m.job.y - .5) < 1.6);
  function drawFarmToolSwing(a) {
    const fa = a.farmAction; if (!fa) return;
    const dur = fa.kind === 'harvest' ? .5 : .45, k = Math.min(1, fa.t / dur);
    if (fa.kind === 'till') {
      const swing = Math.sin(k * Math.PI) * 1.35;
      c.save();
      c.translate(8, -16);
      c.rotate(-0.85 + swing);
      // wooden handle
      c.lineWidth = 3.2; c.lineCap = 'round'; c.strokeStyle = '#8a5229';
      c.beginPath(); c.moveTo(-2, 10); c.lineTo(2, -26); c.stroke();
      // metal pickaxe head
      c.lineWidth = 4; c.strokeStyle = '#4a5568';
      c.beginPath(); c.moveTo(-14, -22); c.quadraticCurveTo(2, -29, 16, -22); c.stroke();
      // pick tips shine
      c.lineWidth = 1.8; c.strokeStyle = '#e2e8f0';
      c.beginPath(); c.moveTo(11, -23); c.lineTo(16, -22); c.stroke();
      c.restore();
    } else if (fa.kind === 'water') {
      const tilt = Math.sin(k * Math.PI) * 0.85;
      c.save();
      c.translate(12, -18);
      c.rotate(-0.2 + tilt);
      // watering can body
      ART.rrect(c, -8, -6, 16, 13, 3);
      c.fillStyle = '#3a86c8'; c.fill();
      c.strokeStyle = '#1e4c79'; c.lineWidth = 1.2; c.stroke();
      // top arched handle
      c.beginPath(); c.moveTo(-6, -6); c.quadraticCurveTo(0, -15, 6, -6);
      c.lineWidth = 2.2; c.strokeStyle = '#1e4c79'; c.stroke();
      // long spout
      c.beginPath(); c.moveTo(7, 1); c.lineTo(18, -6);
      c.lineWidth = 2.8; c.strokeStyle = '#1e4c79'; c.stroke();
      // shower head
      ART.ell(c, 18, -6, 3, 4, '#70d6ff', '#1e4c79', 1);
      // water pouring effect
      if (k > 0.15 && k < 0.9) {
        c.strokeStyle = 'rgba(112,214,255,0.85)'; c.lineWidth = 1.6;
        c.beginPath();
        c.moveTo(19, -5); c.lineTo(28 + k * 8, 12 + k * 10);
        c.moveTo(20, -7); c.lineTo(31 + k * 8, 9 + k * 10);
        c.moveTo(18, -4); c.lineTo(25 + k * 8, 15 + k * 10);
        c.stroke();
      }
      c.restore();
    } else {
      const icon = fa.kind === 'plant' ? '🌱' : '🧺';
      const swing = Math.sin(k * Math.PI) * .6;
      c.save(); c.translate(16, -20); c.rotate(-.3 + swing); c.font = '20px sans-serif'; c.textAlign = 'center'; c.globalAlpha = 1 - k * .3; c.fillText(icon, 0, 0); c.restore(); c.textAlign = 'start'; c.globalAlpha = 1;
    }
  }
  // pet café: a locked sign until Bronze rep, then a build prompt; once built, the actual
  // terrace structure lives in drawCafeGround() and this just carries the tap target
  function collectCafeSign() {
    const built = S.cafe && S.cafe.built, cp = built ? CAFE_POS() : null;
    const sg = CAFE_SIGN(), gx = built ? cp.x + cp.w / 2 : sg.x, gy = built ? cp.y + cp.d / 2 : sg.y;
    return [{ depth: gx + gy + .98, fn: drawCafeSign }];
  }
  function drawCafeSign() {
    c.save();
    const cf = S.cafe, built = cf && cf.built;
    if (built) {
      // the actual terrace structure is drawn in drawCafeGround() (ground-level, always behind
      // props/actors standing under it -- see that function's comment for why); this call is
      // now just the tap target for the sign/name area, matching where that structure sits
      const cp = CAFE_POS();
      const [ccx, ccy] = [ISO.wx(cp.x + cp.w / 2, cp.y + cp.d / 2), ISO.wy(cp.x + cp.w / 2, cp.y + cp.d / 2)];
      hits.push({ kind: 'cafesign', x0: ccx - cp.w * 12, x1: ccx + cp.w * 12, y0: ccy - 140, y1: ccy + 30 });
    } else {
      const sg = CAFE_SIGN(), sx = ISO.wx(sg.x, sg.y), sy = ISO.wy(sg.x, sg.y);
      c.translate(sx, sy);
      c.fillStyle = '#8a5a33'; c.fillRect(-2, -32, 4, 32);
      ART.rrect(c, -24, -58, 48, 26, 6); c.fillStyle = '#fff3d6'; c.fill(); c.lineWidth = 1.5; c.strokeStyle = ART.OUT; c.stroke();
      const unlocked = repTier(S.rep || 0) >= CAFE_UNLOCK_TIER;
      c.font = '20px sans-serif'; c.textAlign = 'center'; c.fillText(unlocked ? '☕' : '🔒', 0, -40);
      hits.push({ kind: 'cafesign', x0: sx - 26, x1: sx + 26, y0: sy - 68, y1: sy + 4 });
    }
    c.restore();
  }
  // The village is 1.5x bigger than the baked background covers (bg canvas stays the old size to
  // keep memory sane), so the extra ground + the extension of the road run out to the new edges
  // are drawn live UNDER the bg image; the reserved pet-hospital lot is drawn live OVER it.
  function drawVillageExt() {
    const w = W(), h = H(), q = (x, y) => [ISO.wx(x, y), ISO.wy(x, y)];
    const poly = (pts, col) => { c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); c.fillStyle = col; c.fill(); };
    const vs = VILLAGE_S_MAX() + 7;
    const X0 = VILLAGE_X0 - 5, Y0 = VILLAGE_Y0 - 5, XE = w + VILLAGE_XE + 5;
    poly([q(X0, Y0), q(XE, Y0), q(XE, vs), q(X0, vs)], '#a8d88e');
    // grass texture outside the baked bg canvas, only for the tiles actually on screen (tufts/flowers only when zoomed in enough to see them)
    { const cs = [toGrid(0, 0), toGrid(vw, 0), toGrid(0, vh), toGrid(vw, vh)];
      const x0 = Math.max(X0, Math.min(...cs.map(p => p.x)) - 1), x1 = Math.min(XE, Math.max(...cs.map(p => p.x)) + 1);
      const y0 = Math.max(Y0, Math.min(...cs.map(p => p.y)) - 1), y1 = Math.min(vs, Math.max(...cs.map(p => p.y)) + 1);
      FURN.groundTex(c, x0, y0, x1, y1, (x, y) => (x > -8 && x < w + 27 && y > -22 && y < h + 26) || (x > w + .9 && x < w + 8.7), cam.z >= .32 ? 1 : 0); }
    for (const [y0, y1] of [[Y0, -21.9], [h + 25.9, vs]]) FURN.road(c, w, y0, y1);
    // the edge of the village: a low picket fence all the way round, open where the road runs out
    { const fx0 = VILLAGE_X0 - .3, fx1 = w + VILLAGE_XE + 1.2, fy0 = VILLAGE_Y0 - .3, fy1 = VILLAGE_S_MAX() + 1.2, gx0 = w + 1.1, gx1 = w + 8.5;
      const zp = (x, y, z) => [ISO.wx(x, y), ISO.wy(x, y) - z];
      const run = (x0, y0, x1, y1) => { // one straight run of fence: posts every 2 tiles + two rails
        const pA = zp(x0, y0, 0), pB = zp(x1, y1, 0);
        const minPx = Math.min(pA[0], pB[0]), maxPx = Math.max(pA[0], pB[0]);
        const minPy = Math.min(pA[1], pB[1]) - 35, maxPy = Math.max(pA[1], pB[1]) + 15;
        const rw = vw / cam.z / 2 + 200, rh = vh / cam.z / 2 + 200;
        if (Math.abs((minPx + maxPx) / 2 - cam.x) > (rw + (maxPx - minPx) / 2 + 50) ||
            Math.abs((minPy + maxPy) / 2 - cam.y) > (rh + (maxPy - minPy) / 2 + 50)) return;
        const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / 2));
        for (const z of [7, 14]) { const a = zp(x0, y0, z), b = zp(x1, y1, z); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.strokeStyle = '#fbf3e2'; c.lineWidth = 2.6; c.stroke(); c.strokeStyle = '#a98a62'; c.lineWidth = .8; c.stroke(); }
        for (let i = 0; i <= n; i++) {
          const x = x0 + (x1 - x0) * i / n, y = y0 + (y1 - y0) * i / n;
          const a = zp(x, y, 0);
          if (Math.abs(a[0] - cam.x) > rw + 30 || Math.abs(a[1] - cam.y) > rh + 40) continue;
          const b = zp(x, y, 19);
          c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.strokeStyle = '#b98757'; c.lineWidth = 3.6; c.stroke(); c.strokeStyle = '#7a5637'; c.lineWidth = .8; c.stroke(); c.beginPath(); c.arc(b[0], b[1] - 1, 2.6, 0, 7); c.fillStyle = '#d9a374'; c.fill();
        }
      };
      const gate = (x, y) => {
        const a = zp(x, y, 0);
        const rw = vw / cam.z / 2 + 200, rh = vh / cam.z / 2 + 200;
        if (Math.abs(a[0] - cam.x) > rw + 40 || Math.abs(a[1] - cam.y) > rh + 50) return;
        const b = zp(x, y, 34); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.strokeStyle = '#8a5a33'; c.lineWidth = 5; c.stroke(); c.beginPath(); c.arc(b[0], b[1] - 2, 4, 0, 7); c.fillStyle = '#f4c46a'; c.fill(); c.strokeStyle = '#7a5637'; c.lineWidth = 1; c.stroke();
      };
      run(fx0, fy0, gx0, fy0); run(gx1, fy0, fx1, fy0); run(fx0, fy0, fx0, fy1);
      run(fx0, fy1, gx0, fy1); run(gx1, fy1, fx1, fy1); run(fx1, fy0, fx1, fy1);
      for (const gy of [fy0, fy1]) { gate(gx0, gy); gate(gx1, gy); }
    }  }
  // ================= pet hospital (south of the shop) =================
  // A single-storey hospital that grows west with its level. Unbuilt: the reserved lot + a sign in the yard (tap to build).
  // Built: clinic floor, the two back walls, a lobby by the door with the reception, and one walled room per department
  // (partitions with a door on the south side). Patients and staff are real walking actors (see sync()).
  let hospSel = null; // selected hospital furniture id while decorating
  const hospIn = new Map(); // stand-ins for the café's staff (kept here for historical reasons)
  const HOSP_ROOM_COL = { clinic: '#e9f4f9', treat: '#e2f5ec', radio: '#e6e9f7', surgery: '#e4f3ec', ward: '#fbf1e2' };
  function drawHospLot() {
    if (S.hosp && S.hosp.built) return;
    const L = HOSP_LOT(), q = [[L.x, L.y], [L.x + L.w, L.y], [L.x + L.w, L.y + L.d], [L.x, L.y + L.d]].map(([px, py]) => [ISO.wx(px, py), ISO.wy(px, py)]);
    c.save(); c.beginPath(); q.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath();
    c.fillStyle = 'rgba(214,226,196,.6)'; c.fill(); c.setLineDash([9, 6]); c.strokeStyle = '#8fa97a'; c.lineWidth = 2.2; c.stroke(); c.setLineDash([]);
    for (const p of q) { c.fillStyle = '#8a5a33'; c.fillRect(p[0] - 2, p[1] - 16, 4, 16); }
    c.restore();
  }
  // a soft shadow rim on the grass round a building's footprint (mostly to the south/east, where the light falls away)
  function groundShadow(x, y, w, d) {
    const pt = (px, py) => [ISO.wx(px, py), ISO.wy(px, py)];
    for (const [e, a] of [[.45, .08], [.22, .1]]) { const q = [pt(x - e * .3, y - e * .3), pt(x + w + e, y - e * .3), pt(x + w + e, y + d + e), pt(x - e * .3, y + d + e)]; c.beginPath(); q.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); c.fillStyle = `rgba(40,70,20,${a})`; c.fill(); }
  }
  function drawHospGround() {
    if (!(S.hosp && S.hosp.built)) return;
    const R = HOSP_POS(), L = HOSP_LAYOUT();
    groundShadow(R.x, R.y, R.w, R.d);
    const pt = (px, py) => [ISO.wx(px, py), ISO.wy(px, py)], ptz = (px, py, z) => [ISO.wx(px, py), ISO.wy(px, py) - z];
    const path = pts => { c.beginPath(); pts.forEach((q, i) => i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); c.closePath(); };
    const fillP = (pts, col, stroke, lw) => { path(pts); c.fillStyle = col; c.fill(); if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw || 1; c.stroke(); } };
    const wallFace = (a, b, z0, z1) => [ptz(a[0], a[1], z1), ptz(b[0], b[1], z1), ptz(b[0], b[1], z0), ptz(a[0], a[1], z0)];
    c.save();
    // paving from the road side into the entrance
    fillP([pt(R.x1, R.y + .2), pt(R.x1 + 1.1, R.y + .2), pt(R.x1 + 1.1, R.y + 3.2), pt(R.x1, R.y + 3.2)], '#e2dccf', 'rgba(150,140,120,.4)', 1);
    for (let j = 0; j < R.d; j++) for (let i = 0; i < R.w; i++) fillP([pt(R.x + i, R.y + j), pt(R.x + i + 1, R.y + j), pt(R.x + i + 1, R.y + j + 1), pt(R.x + i, R.y + j + 1)], (i + j) % 2 ? '#eef6f4' : '#d9ebe7', 'rgba(90,140,130,.2)');
    // each room's floor tint + name
    for (const id of L.roomIds) { const r = L.rooms[id]; fillP([pt(r.x0, r.y0), pt(r.x1, r.y0), pt(r.x1, r.y1), pt(r.x0, r.y1)], HOSP_ROOM_COL[id] || '#eee', null);
      for (let j = 0; j < r.d; j++) for (let i = 0; i < r.w; i++) if ((i + j) % 2) fillP([pt(r.x0 + i, r.y0 + j), pt(r.x0 + i + 1, r.y0 + j), pt(r.x0 + i + 1, r.y0 + j + 1), pt(r.x0 + i, r.y0 + j + 1)], 'rgba(255,255,255,.35)', null);
      c.save(); c.font = 'bold 10px sans-serif'; c.textAlign = 'center'; c.fillStyle = 'rgba(37,105,95,.6)'; const lp = pt((r.x0 + r.x1) / 2, r.y1 - .8); c.fillText(HOSP_ROOMS[id].icon + ' ' + t('hroom_' + id), lp[0], lp[1]); c.restore(); }
    fillP([pt(R.x, R.y), pt(R.x1, R.y), pt(R.x1, R.y1), pt(R.x, R.y1)], 'rgba(0,0,0,0)', '#6fa9a0', 2);
    const WALL_H = 112;
    const WW = [[R.x, R.y], [R.x, R.y1]], NW = [[R.x, R.y], [R.x1, R.y]];
    for (const [wa, wb, up] of [[WW[0], WW[1], '#f4fbfa'], [NW[0], NW[1], '#fafefd']]) {
      fillP(wallFace(wa, wb, 42, WALL_H), up, '#86c9c0', 1.2); fillP(wallFace(wa, wb, 0, 42), '#86c9c0', '#3fa79b', 1.2);
      fillP(wallFace(wa, wb, 39, 44), '#e6f4f1', '#86c9c0', 1); fillP(wallFace(wa, wb, 0, 4), '#3fa79b'); fillP(wallFace(wa, wb, WALL_H - 6, WALL_H), '#cfe6e2', '#86c9c0', 1);
    }
    const win = (a, b, z0, z1) => { fillP(wallFace(a, b, z0, z1), '#dff1fa', '#3fa79b', 2.2); const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], p0 = ptz(m[0], m[1], z0), p1 = ptz(m[0], m[1], z1); c.beginPath(); c.moveTo(p0[0], p0[1]); c.lineTo(p1[0], p1[1]); const l0 = ptz(a[0], a[1], (z0 + z1) / 2), l1 = ptz(b[0], b[1], (z0 + z1) / 2); c.moveTo(l0[0], l0[1]); c.lineTo(l1[0], l1[1]); c.strokeStyle = '#3fa79b'; c.lineWidth = 1.5; c.stroke(); };
    for (let j = 1; j + 1 < R.d; j += 3) win([R.x, R.y + j + .15], [R.x, R.y + j + 1.85], 56, 96);
    for (let i = 1; i + 1 < R.w; i += 3) win([R.x + i + .15, R.y], [R.x + i + 1.85, R.y], 56, 96);
    const cross = (x, y, s) => { const p = ptz(x, y, 84); c.fillStyle = '#e0505a'; c.fillRect(p[0] - s, p[1] - s / 3, 2 * s, 2 * s / 3); c.fillRect(p[0] - s / 3, p[1] - s, 2 * s / 3, 2 * s); };
    for (let j = 3; j < R.d - 1; j += 6) cross(R.x, R.y + j + 1, 6);
    for (let i = 3; i < R.w - 1; i += 6) cross(R.x + i + 1, R.y, 6);
    { const nm = t('hospName') + ' Lv' + hospLv(); c.font = 'bold 11px sans-serif'; c.textAlign = 'center'; const tw = c.measureText(nm).width + 30; const [nx, ny] = ptz(R.x, R.y, WALL_H + 12);
      ART.rrect(c, nx - tw / 2, ny - 12, tw, 20, 8); c.fillStyle = '#3fa79b'; c.fill(); c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 1.4; c.stroke();
      c.fillStyle = '#fff'; c.fillText('🏥 ' + nm, nx, ny + 2); c.textAlign = 'start'; }
    c.restore();
    { const cx = ISO.wx(R.x + R.w / 2, R.y + R.d / 2), cy = ISO.wy(R.x + R.w / 2, R.y + R.d / 2); hits.push({ kind: 'hospsign', x0: cx - R.w * 8, x1: cx + R.w * 8, y0: cy - 120, y1: cy - 30 }); }
  }
  function collectHospSign() {
    if (S.hosp && S.hosp.built) return [];
    const sg = HOSP_SIGN();
    return [{ depth: sg.x + sg.y + .98, fn: () => {
      const sx = ISO.wx(sg.x, sg.y), sy = ISO.wy(sg.x, sg.y);
      c.save(); c.translate(sx, sy); c.fillStyle = '#8a5a33'; c.fillRect(-2, -32, 4, 32);
      ART.rrect(c, -30, -64, 60, 32, 6); c.fillStyle = '#f2fbf9'; c.fill(); c.lineWidth = 1.5; c.strokeStyle = ART.OUT; c.stroke();
      const unlocked = repTier(S.rep || 0) >= HOSP_UNLOCK_TIER;
      c.font = '20px sans-serif'; c.textAlign = 'center'; c.fillText(unlocked ? '🏥' : '🔒', 0, -43); c.font = 'bold 8px sans-serif'; c.fillStyle = '#25695f'; c.fillText(t('hospName'), 0, -34);
      hits.push({ kind: 'hospsign', x0: sx - 32, x1: sx + 32, y0: sy - 68, y1: sy + 4 });
      c.restore(); } }];
  }
  const hospItemById = id => HOSP_LAYOUT().items.find(i => i.id === id) || null;
  const hospItemAt = (gx, gy) => HOSP_LAYOUT().items.find(i => gx >= i.x && gx < i.x + i.w && gy >= i.y && gy < i.y + i.d) || null;
  function drawHospEditOverlay() {
    const R = HOSP_POS(), pt = (x, y) => [ISO.wx(x, y), ISO.wy(x, y)];
    c.save(); c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 1;
    for (let x = 0; x <= R.w; x++) { const a = pt(R.x + x, R.y), b = pt(R.x + x, R.y1); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); }
    for (let y = 0; y <= R.d; y++) { const a = pt(R.x, R.y + y), b = pt(R.x1, R.y + y); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); }
    const it = hospSel != null && hospItemById(hospSel);
    if (it) { const q = [pt(it.x, it.y), pt(it.x + it.w, it.y), pt(it.x + it.w, it.y + it.d), pt(it.x, it.y + it.d)]; c.strokeStyle = '#ff7ab8'; c.lineWidth = 2.6; c.setLineDash([6, 4]); c.beginPath(); q.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); c.stroke(); c.setLineDash([]); }
    c.restore();
  }
  function collectHospItems() {
    if (!(S.hosp && S.hosp.built)) return [];
    const L = HOSP_LAYOUT(), out = [], sel = App.hospEdit ? hospSel : null;
    for (const it of L.all) out.push({ depth: it.x + it.w + it.y + it.d - 1.02, fn: () => { if (sel != null && sel === it.id) { c.globalAlpha = .6; drawHospItem(it); c.globalAlpha = 1; } else drawHospItem(it); } });
    for (const q of L.parts) { const pq = { k: 'part', x: q.x, y: q.y, w: 1, d: 1, vert: !!q.vert }; out.push({ depth: q.x + q.y + 1 - 1.02 + .2, fn: () => drawHospItem(pq) }); }
    // low walls along the south and east sides (the back walls are the tall ones): the door in the east wall is the only way in
    const R = HOSP_POS(), dyy = [R.y + 2, R.y + 3];
    // (drawn just OUTSIDE the floor so nothing inside ever pokes through them)
    for (let i = 0; i < R.w; i++) { const wq = { k: 'wallS', x: R.x + i, y: R.y1, w: i === R.w - 1 ? 1.17 : 1.001, d: 1 }; out.push({ depth: wq.x + wq.y + .02, fn: () => drawHospItem(wq) }); }
    for (let j = 0; j < R.d; j++) { if (dyy.includes(R.y + j)) continue; const wq = { k: 'wallE', x: R.x1, y: R.y + j, w: 1, d: 1.001 }; out.push({ depth: wq.x + wq.y + .02, fn: () => drawHospItem(wq) }); }
    for (const py of [R.y + 2 - .12, R.y + 4]) { const wq = { k: 'dpost', x: R.x1, y: py, w: 1, d: .12 }; out.push({ depth: wq.x + wq.y + .05, fn: () => drawHospItem(wq) }); }
    if (App.hospEdit) out.push({ depth: 9999, fn: drawHospEditOverlay });
    return out;
  }
  // a treatment's little show: a progress ring + a per-treatment effect over the pet on the station
  function hospTreatFx(it, pat, P3, emoji, ell, zz) {
    const tx = pat.plan[pat.k], pr = Math.max(0, Math.min(1, 1 - (pat.tm || 0) / (pat.tdur || 5)));
    const bp = P3(it.w / 2, it.d / 2, zz + 58); c.save(); c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(bp[0] - 18, bp[1] - 3, 36, 5); c.fillStyle = '#7ad07a'; c.fillRect(bp[0] - 18, bp[1] - 3, 36 * pr, 5); c.restore();
    const cx = it.w / 2, cy = it.d / 2, ph = T * 2;
    switch (tx) {
      case 'exam': emoji('🩺', P3(cx + Math.sin(ph) * .35, cy + Math.cos(ph * .7) * .2, zz + 22), 15); break;
      case 'drip': emoji('💧', P3(it.w - .1, .1, 60 - ((T * 30) % 26)), 9); emoji('💧', P3(cx, cy, zz + 12 - ((T * 26) % 10)), 7); break;
      case 'vaccine': { const k = (T * .9) % 1; emoji('💉', P3(it.w - .1 - k * (it.w * .5), cy, zz + 34 - k * 10), 15); if (k > .85) emoji('✨', P3(cx, cy, zz + 22), 12); break; }
      case 'bandage': emoji('🩹', P3(cx + Math.sin(ph) * .2, cy, zz + 24), 13); break;
      case 'xray': { const f = Math.sin(T * 14) > .3; if (f) { const g = P3(cx, cy, zz + 14); c.save(); const gr = c.createRadialGradient(g[0], g[1], 2, g[0], g[1], 44); gr.addColorStop(0, 'rgba(255,255,255,.85)'); gr.addColorStop(1, 'rgba(160,210,255,0)'); c.fillStyle = gr; c.fillRect(g[0] - 44, g[1] - 44, 88, 88); c.restore(); emoji('⚡', P3(cx, cy, zz + 40), 14); } break; }
      case 'ct': { const g = P3(it.w / 2, it.d / 2, zz + 14); c.save(); c.translate(g[0], g[1]); c.rotate(T * 3); c.strokeStyle = 'rgba(120,170,255,.8)'; c.lineWidth = 3; c.beginPath(); c.ellipse(0, 0, 22, 9, 0, 0, 7); c.stroke(); c.restore(); break; }
      case 'surgery': { const g = P3(cx, cy, zz + 40), gr = c.createRadialGradient(g[0], g[1], 2, g[0], g[1], 34); gr.addColorStop(0, 'rgba(255,250,200,.6)'); gr.addColorStop(1, 'rgba(255,250,200,0)'); c.save(); c.fillStyle = gr; c.fillRect(g[0] - 34, g[1] - 34, 68, 68); c.restore(); emoji('✂️', P3(cx + Math.sin(ph * 1.3) * .3, cy, zz + 26), 13); if (Math.sin(T * 6) > .6) emoji('✨', P3(cx, cy, zz + 30), 11); break; }
      case 'medbath': for (let i = 0; i < 4; i++) { const k = (T * .6 + i / 4) % 1; emoji('🫧', P3(.4 + i * (it.w - .8) / 4, cy, zz + 6 + k * 30), 10); } break;
      case 'incubate': { const g = P3(cx, cy, zz + 16), gr = c.createRadialGradient(g[0], g[1], 2, g[0], g[1], 30); gr.addColorStop(0, 'rgba(255,190,120,.55)'); gr.addColorStop(1, 'rgba(255,190,120,0)'); c.save(); c.fillStyle = gr; c.fillRect(g[0] - 30, g[1] - 30, 60, 60); c.restore(); emoji('🌡️', P3(cx, cy, zz + 44), 13); break; }
      case 'rest': for (let i = 0; i < 3; i++) { const k = (T * .5 + i / 3) % 1; c.save(); c.globalAlpha = 1 - k; c.font = '12px sans-serif'; c.fillText('z', P3(cx, cy, zz + 20)[0] + 8 + k * 12, P3(cx, cy, zz + 20)[1] - k * 22); c.restore(); } break;
    }
  }
  function drawHospItem(it) {
    if (it.r && !it._m) { drawMirrored(it, drawHospItem); return; }
    const SHARED = ['sofa', 'plant', 'lamp', 'aquarium', 'fountain'];
    if (SHARED.includes(it.k)) { drawCafeItem(it); return; }
    const P3 = (lx, ly, z) => [ISO.wx(it.x + lx, it.y + ly), ISO.wy(it.x + lx, it.y + ly) - (z || 0)];
    const B = (lx, ly, w, d, h, col, z0, top) => cafeBox(it.x, it.y, lx, ly, w, d, h, col, z0 || 0, top ? { top } : undefined);
    const ell = (p, rx, ry, fill, stroke, lw) => { c.beginPath(); c.ellipse(p[0], p[1], rx, ry, 0, 0, 7); c.fillStyle = fill; c.fill(); if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw || 1; c.stroke(); } };
    const quad = (pts, col, stroke) => { c.beginPath(); pts.forEach((q, i) => i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); c.closePath(); c.fillStyle = col; c.fill(); if (stroke) { c.strokeStyle = stroke; c.lineWidth = 1; c.stroke(); } };
    const line = (a, b, col, lw) => { c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.strokeStyle = col; c.lineWidth = lw || 1; c.stroke(); };
    const emoji = (s, p, px) => { c.save(); c.font = (px || 16) + 'px sans-serif'; c.textAlign = 'center'; c.fillText(s, p[0], p[1]); c.restore(); };
    const hit = (kind, hh, extra) => { const m = [ISO.wx(it.x + it.w / 2, it.y + it.d / 2), ISO.wy(it.x + it.w / 2, it.y + it.d / 2)], r = 20 * (it.w + it.d) / 2 + 6; hits.push(Object.assign({ kind, x0: m[0] - r, x1: m[0] + r, y0: m[1] - (hh || 70), y1: m[1] + 12 }, extra || {})); };
    c.save();
    switch (it.k) {
      case 'cabinet': {
        B(.08, .08, .84, .84, 78, '#e3eeee', 0, '#f9fdfc');
        for (const z of [10, 34, 58]) quad([P3(.14, .93, z), P3(.86, .93, z), P3(.86, .93, z + 20), P3(.14, .93, z + 20)], '#cfeef0', '#6fa9a0');
        ['💊', '🧴', '💉'].forEach((e, i) => emoji(e, P3(.3 + i * .22, .94, 12 + i * 24), 10));
        line(P3(.5, .93, 6), P3(.5, .93, 76), '#6fa9a0', 1.2);
        hit('hospcabinet', 90);
        break; }
      case 'sink': {
        B(.02, .1, .96, .8, 32, '#9fd0cb', 0, '#f2fbfa');
        ell(P3(.5, .5, 33), 12, 6, '#8fa3b0', '#5a6b78', 1.2); ell(P3(.5, .5, 33), 9, 4.2, '#bfe3f2');
        line(P3(.5, .18, 34), P3(.5, .18, 50), '#9aa7ae', 2.4); line(P3(.5, .18, 50), P3(.5, .4, 50), '#9aa7ae', 2.4);
        break; }
      case 'reception': { // 4 looks, chosen in the hospital panel (unlocked with the hospital level)
        const sk = (S.hosp && S.hosp.skin) | 0, w = it.w;
        if (sk === 0) { B(.02, .08, w - .04, .84, 34, '#4fb3a9', 0, '#eaf7f5'); B(w * .5 - .2, .25, .4, .35, 8, '#3a4a55', 34, '#57687a'); emoji('🛎️', P3(w * .75, .8, 44), 10); }
        else if (sk === 1) { B(.02, .08, w - .04, .84, 36, '#f4f1ea', 0, '#fffdf8'); B(.02, .08, w - .04, .06, 40, '#d9b24c', 0); quad([P3(.05, .93, 6), P3(w - .05, .93, 6), P3(w - .05, .93, 30), P3(.05, .93, 30)], '#e8e2d4', '#d9b24c'); B(w * .5 - .2, .25, .4, .35, 8, '#3a4a55', 36, '#57687a'); emoji('🪴', P3(w - .3, .5, 46), 12); emoji('🛎️', P3(.4, .8, 46), 10); }
        else if (sk === 2) { B(.02, .08, w - .04, .84, 38, '#dfeef8', 0, '#f5fbff'); quad([P3(.05, .94, 4), P3(w - .05, .94, 4), P3(w - .05, .94, 34), P3(.05, .94, 34)], 'rgba(120,190,255,.55)', '#5fa8e8'); line(P3(.05, .94, 3), P3(w - .05, .94, 3), 'rgba(90,200,255,.9)', 2.5); B(w * .5 - .25, .22, .5, .4, 10, '#26323c', 38, '#3a4a58'); emoji('🛎️', P3(w * .85, .8, 48), 11); emoji('➕', P3(w * .15, .8, 50), 11); }
        else { B(.02, .08, w - .04, .84, 40, '#5a3a2a', 0, '#7a5238'); B(.02, .08, w - .04, .07, 44, '#e8c25a', 0); B(.02, .86, w - .04, .07, 44, '#e8c25a', 0); quad([P3(.06, .94, 8), P3(w - .06, .94, 8), P3(w - .06, .94, 36), P3(.06, .94, 36)], '#6b4632', '#e8c25a'); B(w * .5 - .25, .24, .5, .38, 10, '#1f2a33', 40, '#33424f'); emoji('💎', P3(w * .2, .6, 54), 12); emoji('🛎️', P3(w * .8, .8, 52), 11); const g = P3(w * .5, .5, 62), gr = c.createRadialGradient(g[0], g[1], 2, g[0], g[1], 30); gr.addColorStop(0, 'rgba(255,225,150,.5)'); gr.addColorStop(1, 'rgba(255,225,150,0)'); c.fillStyle = gr; c.fillRect(g[0] - 30, g[1] - 30, 60, 60); }
        { const lp = P3(w / 2, .95, 18); c.font = 'bold 10px sans-serif'; c.textAlign = 'center'; c.lineJoin = 'round'; c.lineWidth = 3.5; c.strokeStyle = 'rgba(20,50,50,.85)'; c.strokeText('🛎️ ' + t('hosp_reception'), lp[0], lp[1]); c.fillStyle = '#fff'; c.fillText('🛎️ ' + t('hosp_reception'), lp[0], lp[1]); }
        hit('hospcabinet', 60);
        break; }
      case 'wallS': { c.save(); c.globalAlpha = 0.1; B(0, 0, it.w, .16, 40, '#86c9c0', 0, '#e6f4f1'); c.restore(); break; }
      case 'wallE': { c.save(); c.globalAlpha = 0.1; B(0, 0, .16, 1.001, 40, '#86c9c0', 0, '#e6f4f1'); c.restore(); break; }
      case 'dpost': { c.save(); c.globalAlpha = 0.35; B(0, 0, .18, .12, 46, '#3fa79b', 0, '#86c9c0'); B(-.02, -.02, .22, .16, 4, '#e0505a', 46, '#f07a80'); c.restore(); break; }
      case 'hdoorE': {
        c.save(); c.globalAlpha = 0.25;
        quad([P3(0, 0, 2), P3(.55, -.25, 2), P3(.55, -.25, 42), P3(0, 0, 42)], 'rgba(185,235,255,.55)', '#3fa79b');
        quad([P3(0, 2, 2), P3(.55, 2.25, 2), P3(.55, 2.25, 42), P3(0, 2, 42)], 'rgba(185,235,255,.55)', '#3fa79b');
        c.restore(); break; }
      case 'part': { // walled-room partition & clinic entrance doorway
        if (it.doorway) {
          // Framed Consultation Room Entrance Doorway
          // Left jamb post
          B(0, .32, .18, .36, 52, '#3fa79b', 0, '#86c9c0');
          // Right jamb post
          B(.82, .32, .18, .36, 52, '#3fa79b', 0, '#86c9c0');
          // Top lintel / overhead arch beam
          B(0, .32, 1.001, .36, 14, '#3fa79b', 38, '#86c9c0');
          // Golden/white clinic room plaque above door
          quad([P3(.12, .68, 50), P3(.88, .68, 50), P3(.88, .68, 40), P3(.12, .68, 40)], '#fffdf7', '#1f635c');
          const dp = P3(.5, .69, 44);
          c.save();
          c.font = 'bold 8.5px sans-serif';
          c.fillStyle = '#115e59';
          c.textAlign = 'center';
          c.textBaseline = 'middle';
          c.fillText('🩺 진료실', dp[0], dp[1]);
          c.restore();
        } else if (it.vert) {
          // Clean vertical wall partition (flush 1.001, aligned corner)
          B(.32, 0, .36, 1.001, 50, '#e6f3f1', 0, '#cfe6e2');
          quad([P3(.68, .08, 22), P3(.68, .92, 22), P3(.68, .92, 46), P3(.68, .08, 46)], 'rgba(190,225,240,.7)');
        } else {
          // Clean horizontal south wall partition (flush 1.001, no door overlap)
          B(0, .32, 1.001, .36, 50, '#e6f3f1', 0, '#cfe6e2');
          quad([P3(.08, .68, 22), P3(.92, .68, 22), P3(.92, .68, 46), P3(.08, .68, 46)], 'rgba(190,225,240,.7)');
        }
        break; }
      case 'desk': { B(.05, .15, .9, .7, 26, '#c9a27a', 0, '#e6cfaa'); B(.3, .25, .4, .3, 8, '#3a4a55', 26, '#57687a'); emoji('🧑‍⚕️', P3(.5, .95, 44), 12); hit('hospcabinet', 60); break; }
      case 'monitor': { B(.1, .1, .8, .8, 30, '#4a5a68', 0, '#6b7c8a'); quad([P3(.1, .9, 34), P3(.9, .9, 34), P3(.9, .9, 62), P3(.1, .9, 62)], '#0e1a24', '#8aa'); emoji('🩻', P3(.5, .9, 44), 14); break; }
      case 'bench': { // User Request 4: 병원 긴의자는 반대 방향(오픈된 로비 쪽)을 보게 배치 (벽에 등받이를 대고 앞/남쪽을 봄)
        // Tall backrest on the north edge (against the wall)
        B(.04, .06, it.w - .08, .12, 34, '#4d5863', 0, '#6a7784');
        B(.04, .08, it.w - .08, .08, 32, '#aab2ba', 0, '#cbd5e1');
        // Metal frame legs
        for (const lx of [.08, it.w - .2]) {
          B(lx, .12, .12, .05, 6, '#aab2ba', 0);
          B(lx, .72, .12, .05, 6, '#aab2ba', 0);
        }
        // Padded seat cushion facing SOUTH into open lobby
        for (let k = 0; k < it.w; k++) {
          B(k + .06, .20, .88, .64, 8, '#5a6672', 6, '#7d8a97');
          B(k + .08, .78, .84, .06, 6, '#475569', 6, '#64748b');
        }
        break; }
      case 'exam': { B(.1, .1, .8, .8, 28, '#dfe9ee', 0, '#f8fbfd'); B(.14, .14, .72, .72, 4, '#7ec8e3', 28, '#9ad8ee'); break; }
      case 'tbed': { B(.04, .1, it.w - .08, .8, 14, '#9fc7bd', 0, '#d9efe9'); B(.08, .14, it.w - .16, .72, 8, '#ffffff', 14, '#ffffff'); quad([P3(it.w * .45, .16, 22), P3(it.w - .1, .16, 22), P3(it.w - .1, .84, 22), P3(it.w * .45, .84, 22)], '#8fd9b6', '#4fa982'); ell(P3(.35, .5, 23), 9, 5, '#fff', '#c5d3da', 1); line(P3(it.w - .1, .1, 14), P3(it.w - .1, .1, 66), '#b0bec5', 2); emoji('💧', P3(it.w - .1, .1, 72), 11); break; }
      case 'bed': { B(.04, .1, it.w - .08, .8, 14, '#b8c9d1', 0, '#dfe9ee'); B(.08, .14, it.w - .16, .72, 8, '#ffffff', 14, '#ffffff'); quad([P3(it.w * .45, .16, 22), P3(it.w - .1, .16, 22), P3(it.w - .1, .84, 22), P3(it.w * .45, .84, 22)], '#8ecae6', '#5fa6c8'); ell(P3(.35, .5, 23), 9, 5, '#fff', '#c5d3da', 1); break; }
      case 'pharmacy': {
        B(.06, .2, .1, .6, 58, '#e3eeee'); B(.84, .2, .1, .6, 58, '#e3eeee');
        for (const z of [0, 20, 40, 56]) B(.06, .2, .88, .6, 3, '#f4fbfa', z, '#ffffff');
        const cols = ['#e0505a', '#3fa79b', '#f2b632', '#7ec8e3'];
        for (const z of [3, 23, 43]) for (let i = 0; i < 4; i++) { const p = P3(.2 + i * .2, .5, z + 6); c.beginPath(); c.arc(p[0], p[1], 4, 0, 7); c.fillStyle = cols[(i + z) % 4]; c.fill(); c.strokeStyle = 'rgba(0,0,0,.2)'; c.lineWidth = .7; c.stroke(); }
        break; }
      case 'xray': { B(.1, .1, .8, it.d - .2, 18, '#cfd8dc', 0, '#eef3f5'); B(.4, .3, .25, it.d - .6, 66, '#b0bec5', 18, '#cfd8dc'); quad([P3(.92, .3, 30), P3(.92, it.d - .3, 30), P3(.92, it.d - .3, 60), P3(.92, .3, 60)], '#1d2b36', '#7a8b96'); emoji('🩻', P3(.92, it.d / 2, 42), 16); break; }
      case 'ct': { B(.05, .05, it.w - .1, it.d - .1, 14, '#cfd8dc', 0, '#eef3f5'); B(.3, .3, it.w - .6, it.d - .6, 46, '#e8eef2', 14, '#f8fbfd'); ell(P3(it.w / 2, it.d - .3, 34), 18, 16, '#26323c', '#90a4ae', 3); ell(P3(it.w / 2, it.d - .3, 34), 10, 9, '#0e1a24'); emoji('🧲', P3(it.w / 2, it.d - .3, 60), 12); break; }
      case 'incubator': { B(.1, .1, .8, .8, 20, '#e3eaee', 0, '#f6fafc'); ell(P3(.5, .5, 34), 20, 11, 'rgba(190,233,255,.7)', '#6fb3d0', 1.6); ell(P3(.5, .5, 22), 20, 9, 'rgba(190,233,255,.55)'); break; }
      case 'medbath': { B(.05, .1, it.w - .1, .8, 22, '#e0f2f7', 0, '#fafeff'); quad([P3(.15, .2, 22), P3(it.w - .15, .2, 22), P3(it.w - .15, .8, 22), P3(.15, .8, 22)], '#7fd3ea'); break; }
      case 'surgery': { B(.08, .2, it.w - .16, .6, 26, '#b9d4d8', 0, '#eaf6f7'); line(P3(it.w - .15, .5, 26), P3(it.w - .15, .5, 84), '#90a4ae', 3); ell(P3(it.w - .15, .5, 84), 13, 6, '#f7f3d8', '#b0a46a', 1.4); break; }
      case 'scale': { B(.15, .15, .7, .7, 6, '#9aa7ae', 0, '#cfd8dc'); quad([P3(.9, .3, 6), P3(.9, .7, 6), P3(.9, .7, 14), P3(.9, .3, 14)], '#263238'); emoji('⚖️', P3(.5, .5, 22), 11); break; }
      case 'iv': { line(P3(.5, .5, 0), P3(.5, .5, 80), '#b0bec5', 3); B(.3, .3, .4, .4, 3, '#90a4ae'); emoji('💧', P3(.5, .5, 88), 14); break; }
      case 'vending': { B(.1, .1, .8, .8, 62, '#3d8fd1', 0, '#5fb0f0'); quad([P3(.9, .2, 26), P3(.9, .8, 26), P3(.9, .8, 56), P3(.9, .2, 56)], '#dff3ff', '#25506e'); ['🥤', '🍫', '🧃'].forEach((e, i) => emoji(e, P3(.9, .5, 34 + i * 8), 9)); break; }
      default: B(.1, .1, it.w - .2, it.d - .2, 24, '#ccc', 0, '#eee');
    }
    // the sick pet lying on this station while its owner waits / it is being treated
    if (HOSP_STN.includes(it.k) && S.hosp) {
      const pat = (S.hosp.patients || []).find(p => p.stn === String(it.id) && (p.ph === 'atStn' || p.ph === 'treat'));
      if (pat) {
        const zz = { bed: 26, tbed: 26, exam: 34, xray: 22, ct: 30, surgery: 30, incubator: 26, medbath: 24 }[it.k] || 28, p0 = P3(it.w * .5, it.d * .5, zz);
        c.save(); c.translate(p0[0], p0[1]); c.scale(.4, .4); ART.pet(c, pat.sp, { t: T, mood: pat.ph === 'treat' ? 'sad' : 'scared', sleep: pat.ph === 'treat' && (pat.plan[pat.k] === 'rest'), seed: pat.seed, age: 1 }); c.restore();
        if (pat.ph === 'treat') hospTreatFx(it, pat, P3, emoji, ell, zz); else emoji('🤒', P3(.35, .5, zz + 20 + Math.sin(T * 3) * 2), 13);
        hit('patient', 70, { pid: pat.id });
      }
    }
    c.restore();
  }
  // ================= end pet hospital =================
  // café floor/walls/pen: ground-level and drawn early (like drawFarmGround) -- a full-footprint
  // fill has to be, or its single depth-sort point randomly paints over props standing on it.
  // Design pass ("펫카페 디자인이 허접해 세련되게"): sage wainscot + cream striped wallpaper with
  // crown molding, arched windows, a menu chalkboard, wall sconces and framed prints; plank floor,
  // tiled kitchen strip and a rug; fenced play yard with real play equipment.
  const cafeBox = (ox, oy, lx, ly, w, d, h, col, z0, opt) => { c.save(); c.translate(ISO.wx(ox, oy), ISO.wy(ox, oy)); FURN.box(c, lx, ly, w, d, h, col, z0 || 0, opt); c.restore(); };
  function drawCafeGround() {
    if (!(S.cafe && S.cafe.built)) { // not built yet: mark the plot so the sign reads as "your café goes HERE"
      c.save();
      const cp0 = CAFE_POS(), q = [[cp0.x, cp0.y], [cp0.x + cp0.w, cp0.y], [cp0.x + cp0.w, cp0.y + cp0.d], [cp0.x, cp0.y + cp0.d]].map(([px, py]) => [ISO.wx(px, py), ISO.wy(px, py)]);
      c.beginPath(); q.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath();
      c.fillStyle = 'rgba(232,214,168,.55)'; c.fill(); c.setLineDash([7, 5]); c.strokeStyle = '#b08a55'; c.lineWidth = 2; c.stroke(); c.setLineDash([]);
      for (const p of q) { c.fillStyle = '#8a5a33'; c.fillRect(p[0] - 2, p[1] - 14, 4, 14); }
      c.restore(); return;
    }
    c.save();
    const cp = CAFE_POS(), L = CAFE_LAYOUT(), pt = (px, py) => [ISO.wx(px, py), ISO.wy(px, py)], ptz = (px, py, z) => [ISO.wx(px, py), ISO.wy(px, py) - z];
    groundShadow(cp.x, cp.y, cp.w, cp.d);
    const path = pts => { c.beginPath(); pts.forEach((q, i) => i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); c.closePath(); };
    const fillP = (pts, col, stroke, lw) => { path(pts); c.fillStyle = col; c.fill(); if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw || 1; c.stroke(); } };
    // ---- floor: warm plank wood, tiled kitchen strip along the north wall
    for (let j = 0; j < cp.d; j++) for (let i = 0; i < cp.w; i++) {
      const tile = [pt(cp.x + i, cp.y + j), pt(cp.x + i + 1, cp.y + j), pt(cp.x + i + 1, cp.y + j + 1), pt(cp.x + i, cp.y + j + 1)];
      if (j < 2) { fillP(tile, (i + j) % 2 ? '#efe9de' : '#d6cfc1', 'rgba(120,110,95,.22)'); }
      else {
        fillP(tile, (j % 2) ? '#d9b78d' : '#cfaa7e', 'rgba(110,80,50,.18)');
        // plank seam, offset every other row
        const off = (j % 2) * .5 + .25, a = pt(cp.x + i + off, cp.y + j), b = pt(cp.x + i + off, cp.y + j + 1);
        c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.strokeStyle = 'rgba(110,80,50,.16)'; c.lineWidth = 1; c.stroke();
      }
    }
    // rug in the dining area
    for (const f of L.flats) if (f.k === 'rug') {
      const r = [pt(f.x, f.y), pt(f.x + f.w, f.y), pt(f.x + f.w, f.y + f.d), pt(f.x, f.y + f.d)];
      fillP(r, '#c9776a', '#a75a4f', 2);
      const m = .35, r2 = [pt(f.x + m, f.y + m), pt(f.x + f.w - m, f.y + m), pt(f.x + f.w - m, f.y + f.d - m), pt(f.x + m, f.y + f.d - m)];
      fillP(r2, '#f4dcc6', 'rgba(167,90,79,.5)', 1);
      const m3 = .9, r3 = [pt(f.x + m3, f.y + m3), pt(f.x + f.w - m3, f.y + m3), pt(f.x + f.w - m3, f.y + f.d - m3), pt(f.x + m3, f.y + f.d - m3)];
      fillP(r3, '#e8b89a');
    }
    fillP([pt(cp.x, cp.y), pt(cp.x + cp.w, cp.y), pt(cp.x + cp.w, cp.y + cp.d), pt(cp.x, cp.y + cp.d)], 'rgba(0,0,0,0)', '#a97f55', 2);
    // ---- the two back walls (open top/front, like the shop's own room)
    const WALL_H = 120, WAIN = 44;
    const wallFace = (a, b, z0, z1) => [ptz(a[0], a[1], z1), ptz(b[0], b[1], z1), ptz(b[0], b[1], z0), ptz(a[0], a[1], z0)];
    const stripeClip = (q, col) => { c.save(); path(q); c.clip(); const bx0 = Math.min(...q.map(p => p[0])), bx1 = Math.max(...q.map(p => p[0])), by0 = Math.min(...q.map(p => p[1])), by1 = Math.max(...q.map(p => p[1])); c.fillStyle = col; for (let sx = bx0; sx < bx1; sx += 14) c.fillRect(sx, by0, 6, by1 - by0); c.restore(); };
    const WW = [[cp.x, cp.y], [cp.x, cp.y + cp.d]], NW = [[cp.x, cp.y], [cp.x + cp.w, cp.y]];
    for (const [wa, wb, up, low] of [[WW[0], WW[1], '#f2eadb', '#8fb5a2'], [NW[0], NW[1], '#f8f2e6', '#9dc0ae']]) {
      const upper = wallFace(wa, wb, WAIN, WALL_H), lower = wallFace(wa, wb, 0, WAIN);
      fillP(upper, up, '#b59a6f', 1.2); stripeClip(upper, 'rgba(190,170,130,.16)');
      fillP(lower, low, '#7a9c89', 1.2);
      // wainscot panels: vertical grooves every tile + a chair-rail
      const len = wa[0] === wb[0] ? cp.d : cp.w;
      for (let k = 1; k < len; k++) { const A = wa[0] === wb[0] ? [wa[0], wa[1] + k] : [wa[0] + k, wa[1]]; const p0 = ptz(A[0], A[1], 4), p1 = ptz(A[0], A[1], WAIN - 5); c.beginPath(); c.moveTo(p0[0], p0[1]); c.lineTo(p1[0], p1[1]); c.strokeStyle = 'rgba(70,100,85,.35)'; c.lineWidth = 1; c.stroke(); }
      fillP(wallFace(wa, wb, WAIN - 3, WAIN + 2), '#e9dcc0', '#b59a6f', 1);        // chair rail
      fillP(wallFace(wa, wb, 0, 4), '#7b5a3a');                                      // baseboard
      fillP(wallFace(wa, wb, WALL_H - 6, WALL_H), '#dfc99b', '#b59a6f', 1);         // crown molding
    }
    // arched windows every 3 tiles, sconces between them
    const arch = (a, b, z0, z1) => { const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], top = ptz(m[0], m[1], z1 + 7); const q = [ptz(a[0], a[1], z0), ptz(a[0], a[1], z1), top, ptz(b[0], b[1], z1), ptz(b[0], b[1], z0)]; fillP(q, '#dff1fa', '#8b6b4a', 2.4); const g = ptz(m[0], m[1], z0), h = ptz(m[0], m[1], z1 + 7); c.beginPath(); c.moveTo(g[0], g[1]); c.lineTo(h[0], h[1]); c.strokeStyle = '#8b6b4a'; c.lineWidth = 1.6; c.stroke(); const s = ptz(m[0], m[1], (z0 + z1) / 2); const l0 = ptz(a[0], a[1], (z0 + z1) / 2), l1 = ptz(b[0], b[1], (z0 + z1) / 2); c.beginPath(); c.moveTo(l0[0], l0[1]); c.lineTo(l1[0], l1[1]); c.stroke(); fillP(wallFace(a, b, z0 - 3, z0), '#b59a6f'); };
    for (let j = 1; j + 1 < cp.d; j += 3) arch([cp.x, cp.y + j + .15], [cp.x, cp.y + j + 1.85], 58, 100);
    for (let i = 1; i + 1 < cp.w; i += 3) arch([cp.x + i + .15, cp.y], [cp.x + i + 1.85, cp.y], 58, 100);
    const sconce = (x, y) => { const p = ptz(x, y, 84); const g = c.createRadialGradient(p[0], p[1], 1, p[0], p[1], 24); g.addColorStop(0, 'rgba(255,224,150,.65)'); g.addColorStop(1, 'rgba(255,224,150,0)'); c.fillStyle = g; c.fillRect(p[0] - 24, p[1] - 24, 48, 48); c.fillStyle = '#f4c46a'; c.beginPath(); c.arc(p[0], p[1], 3.2, 0, 7); c.fill(); };
    for (let j = 3; j < cp.d - 1; j += 3) sconce(cp.x, cp.y + j + 1.0);
    for (let i = 3; i < cp.w - 1; i += 3) sconce(cp.x + i + 1.0, cp.y);
    // menu chalkboard above the counters, framed prints on the west wall
    const cb = L.kit.find(k => k.k === 'counter' || k.k === 'register');
    { const bx = cb ? cb.x + .1 : L.pen.x1 + 1, q = wallFace([bx, cp.y], [bx + (cb ? cb.w : 2) - .2, cp.y], 62, 104); fillP(q, '#2e4a3f', '#8b6b4a', 3);
      const tc = ptz(bx + (cb ? cb.w : 2) / 2 - .1, cp.y, 90); c.save(); c.font = 'bold 11px sans-serif'; c.textAlign = 'center'; c.fillStyle = '#f4efe0'; c.fillText('MENU', tc[0], tc[1]); c.font = '13px sans-serif'; c.fillText('☕ 🍰 🥐', tc[0], tc[1] + 17); c.restore(); }
    [['🌷', 3], ['🐶', 6], ['🐱', 9]].forEach(([em, j]) => { if (j + 1 >= cp.d || cp.y + j < L.pen.y1) return; const q = wallFace([cp.x, cp.y + j + .2], [cp.x, cp.y + j + 1], 64, 92); fillP(q, '#fff8ea', '#8b6b4a', 2.4); const t0 = ptz(cp.x, cp.y + j + .6, 74); c.font = '15px sans-serif'; c.textAlign = 'center'; c.fillText(em, t0[0], t0[1]); c.textAlign = 'start'; });
    // name plaque on the corner
    { const nm = t('cafeName'); c.font = 'bold 11px sans-serif'; c.textAlign = 'center'; const tw = c.measureText(nm).width + 22; const [nx, ny] = ptz(cp.x, cp.y, WALL_H + 12);
      ART.rrect(c, nx - tw / 2, ny - 12, tw, 20, 8); c.fillStyle = '#c9776a'; c.fill(); c.strokeStyle = '#7b3e35'; c.lineWidth = 1.4; c.stroke();
      c.fillStyle = '#fff7ea'; c.fillText('☕ ' + nm, nx, ny + 2); c.textAlign = 'start'; }
    drawCafePen(cp, pt, ptz, L);
    c.restore();
  }
  // fenced play yard in the back-left corner: turf, rail fence with a gate on the south side, real
  // play equipment (unlocked with the café's level), and pets -- the player's own plus guests'
  // pets that were "checked in" to play with the others.
  function drawCafePen(cp, pt, ptz, L) {
    const pen = L.pen, lv = cafeLv(), pw = pen.x1 - pen.x0, pd = pen.y1 - pen.y0;
    // Upgrade cafe animal pen to match the shop's upgraded Adventure Playground (playpen_adventure) scaled to the cafe pen footprint
    const scaleX = (pw + pd) / 10, scaleY = (pw + pd) / 10;
    const [ox, oy] = pt(pen.x0, pen.y0);
    c.save(); c.translate(ox, oy); c.scale(scaleX, scaleY);
    FURN.penBack(c, T, 'playpen_adventure');
    c.restore();
    // extra unlocked cafe play equipment
    for (const e of L.equip) drawPenEquip(e);
    // pets in the yard (drawn between the back and front fence)
    const list = (S.pets || []).filter(Boolean).slice(0, CAFE_LV[lv].pets).map(p => ({ sp: p.sp, seed: p.coat, age: p.grow != null ? G.ageOf(p) : 1 }));
    for (const a of actors.values()) if (a.type === 'cafeguest' && a.buyerSp && a.petMode === 'pen' && a.petIn) list.push({ sp: a.buyerSp, seed: ART.hashStr(a.id), age: 1 });
    list.slice(0, 16).forEach((p, i) => {
      const fx = .5 + .42 * Math.sin(T * (.32 + (i % 4) * .08) + i * 1.9), fy = .5 + .42 * Math.cos(T * (.27 + (i % 3) * .09) + i * 2.4);
      const px = pen.x0 + .7 + fx * (pen.x1 - pen.x0 - 1.4), py = pen.y0 + .7 + fy * (pen.y1 - pen.y0 - 1.4), s = ptz(px, py, 2);
      const dir = Math.cos(T * (.32 + (i % 4) * .08) + i * 1.9) >= 0 ? 1 : -1;
      c.save(); c.translate(s[0], s[1]); c.scale(.5 * dir, .5); ART.pet(c, p.sp, { t: T + i, mood: 'happy', seed: p.seed, age: p.age, moving: true, dir }); c.restore();
    });
    c.save(); c.translate(ox, oy); c.scale(scaleX, scaleY);
    FURN.penFront(c, T, 'playpen_adventure');
    c.restore();
  }
  function drawPenEquip(e) {
    const ox = e.x, oy = e.y, P2 = (x, y, z) => [ISO.wx(ox + x, oy + y), ISO.wy(ox + x, oy + y) - (z || 0)];
    const quad = (pts, col, stroke) => { c.beginPath(); pts.forEach((q, i) => i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); c.closePath(); c.fillStyle = col; c.fill(); if (stroke) { c.strokeStyle = stroke; c.lineWidth = 1; c.stroke(); } };
    switch (e.k) {
      case 'ballpit': {
        cafeBox(ox, oy, .05, .05, e.w - .1, e.d - .1, 9, '#7db8e0', 0, { top: '#5aa0d0' });
        const cols = ['#f26d6d', '#f7c948', '#6fcf97', '#b07cf0', '#ff9ec0'];
        for (let i = 0; i < 14; i++) { const p = P2(.25 + ((i * 37) % 100) / 100 * (e.w - .5), .25 + ((i * 61) % 100) / 100 * (e.d - .5), 11); c.beginPath(); c.arc(p[0], p[1], 3.6, 0, 7); c.fillStyle = cols[i % 5]; c.fill(); c.strokeStyle = 'rgba(0,0,0,.18)'; c.lineWidth = .7; c.stroke(); }
        break; }
      case 'tunnel': {
        cafeBox(ox, oy, .05, .15, e.w - .1, e.d - .3, 13, '#f2a65a', 0, { top: '#f7bd7c' });
        const m = P2(.15, e.d / 2, 6); c.beginPath(); c.ellipse(m[0], m[1], 7, 9, 0, 0, 7); c.fillStyle = '#5b3a1f'; c.fill();
        for (let i = 1; i < 4; i++) { const a = P2(i * e.w / 4, .15, 13), b = P2(i * e.w / 4, e.d - .15, 13); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.strokeStyle = 'rgba(150,80,20,.5)'; c.lineWidth = 1.4; c.stroke(); }
        break; }
      case 'slide': { // play tower with ladder + railings and a long yellow chute
        cafeBox(ox, oy, .05, .1, .55, .8, 34, '#f26d6d', 0, { top: '#f59a9a' });
        cafeBox(ox, oy, .05, .1, .55, .8, 5, '#4a90d9', 34, { top: '#6fb0f0' });
        for (const yy of [.12, .82]) { const a1 = P2(.08, yy, 34), b1 = P2(.08, yy, 52); c.beginPath(); c.moveTo(a1[0], a1[1]); c.lineTo(b1[0], b1[1]); c.strokeStyle = '#fff'; c.lineWidth = 2.4; c.stroke(); const a2 = P2(.58, yy, 34), b2 = P2(.58, yy, 52); c.beginPath(); c.moveTo(a2[0], a2[1]); c.lineTo(b2[0], b2[1]); c.stroke(); }
        quad([P2(.6, .15, 34), P2(.6, .85, 34), P2(e.w - .05, .85, 2), P2(e.w - .05, .15, 2)], '#f7d74a', '#c9a227');
        quad([P2(.6, .12, 34), P2(.6, .18, 34), P2(e.w - .05, .18, 2), P2(e.w - .05, .12, 2)], '#e0b62a');
        quad([P2(.6, .82, 34), P2(.6, .88, 34), P2(e.w - .05, .88, 2), P2(e.w - .05, .82, 2)], '#e0b62a');
        for (let i = 0; i < 4; i++) { const a3 = P2(.05, .2 + i * .18, 4 + i * 8), b3 = P2(.05, .2 + i * .18 + .02, 4 + i * 8); c.beginPath(); c.moveTo(a3[0] - 6, a3[1]); c.lineTo(b3[0] + 6, b3[1]); c.strokeStyle = '#8a5a33'; c.lineWidth = 2; c.stroke(); }
        break; }
      case 'cattree': {
        cafeBox(ox, oy, .3, .3, .4, .4, 40, '#c9a27a', 0, { top: '#dcb98f' });
        cafeBox(ox, oy, .05, .05, .9, .9, 5, '#a37e57', 0, { top: '#b98f66' });
        cafeBox(ox, oy, .05, .05, .9, .9, 4, '#e8d7b8', 18, { top: '#f3e6cc' });
        cafeBox(ox, oy, .1, .1, .8, .8, 4, '#e8d7b8', 36, { top: '#f3e6cc' });
        cafeBox(ox, oy, .35, .35, .3, .3, 2, '#d99a6b', 40, { top: '#e8b48a' });
        break; }
      case 'seesaw': {
        const a = P2(.15, e.d / 2, 16), b = P2(e.w - .15, e.d / 2, 5), a2 = P2(.15, e.d / 2 + .25, 16), b2 = P2(e.w - .15, e.d / 2 + .25, 5);
        cafeBox(ox, oy, e.w / 2 - .15, e.d / 2 - .15, .3, .3, 10, '#8a6a4a', 0);
        quad([a, b, b2, a2], '#6fb3f2', '#3d7fc4');
        break; }
      case 'hoop': {
        cafeBox(ox, oy, .1, .1, .12, .12, 30, '#b98757', 0); cafeBox(ox, oy, e.w - .22, .1, .12, .12, 30, '#b98757', 0);
        const m = P2(e.w / 2, .16, 30); c.beginPath(); c.ellipse(m[0], m[1], 12, 12, 0, 0, 7); c.strokeStyle = '#f26d6d'; c.lineWidth = 3; c.stroke();
        break; }
      case 'scratch': {
        cafeBox(ox, oy, .1, .1, .8, .8, 4, '#a37e57', 0, { top: '#b98f66' });
        cafeBox(ox, oy, .32, .32, .36, .36, 34, '#dcc49a', 4, { top: '#ecd8b2' });
        for (let z = 8; z < 36; z += 5) { const a = P2(.32, .32, z), b = P2(.68, .32, z); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.strokeStyle = 'rgba(120,90,50,.55)'; c.lineWidth = 1; c.stroke(); }
        break; }
      case 'bowls': {
        for (const [bx, col] of [[.15, '#7db8e0'], [.55, '#f2a65a']]) { const p = P2(bx + .15, .5, 2); c.beginPath(); c.ellipse(p[0], p[1], 7, 3.5, 0, 0, 7); c.fillStyle = col; c.fill(); c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 1; c.stroke(); }
        break; }
    }
  }
  // ground tiles + fence: drawn early (with the floor/flat items), so actors correctly render
  // in front of/behind them instead of the patch always appearing to float above everyone
  function drawFarmGround() {
    // S.farm used to exist only after some farm panel had been opened, so a player who hadn't
    // been to the seed/tool stores yet saw NO farm at all ("농장이 없어") -- create it on demand
    const f = FARM.ensure(S);
    c.save();
    const fp = FARM_POS(W(), H()), FARM_X0 = fp.x, FARM_Y0 = fp.y;
    const Q = (x, y, z) => [ISO.wx(x, y), ISO.wy(x, y) - (z || 0)];
    const quad = (x0, y0, x1, y1, col, st) => { const p = [Q(x0, y0), Q(x1, y0), Q(x1, y1), Q(x0, y1)]; c.beginPath(); p.forEach((q, i) => i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); c.closePath(); c.fillStyle = col; c.fill(); if (st) { c.lineWidth = 1; c.strokeStyle = st; c.stroke(); } };
    const day = S.clock ? S.clock.day : 0;
    
    // Rich fertile farm yard soil base with beveled perimeter turf
    quad(FARM_X0 - .1, FARM_Y0 - .1, FARM_X0 + fp.w + .1, FARM_Y0 + fp.d + .1, '#8c734b');
    quad(FARM_X0, FARM_Y0, FARM_X0 + fp.w, FARM_Y0 + fp.d, '#bda377');
    quad(FARM_X0 + .12, FARM_Y0 + .12, FARM_X0 + fp.w - .12, FARM_Y0 + fp.d - .12, '#8ec858');

    for (let y = FARM_Y0; y < FARM_Y0 + fp.d; y++) for (let x = FARM_X0; x < FARM_X0 + fp.w; x++) {
      const p = f.plots.find(pp => pp.x === x && pp.y === y);
      if (!p) {
        if ((x + y) % 2) quad(x + .12, y + .12, x + .88, y + .88, 'rgba(255,255,255,.08)');
        continue;
      }
      // Raised artisan garden bed with dark fertile earth & rich wood borders
      const wet = p.wday === day;
      // Wooden bed curb surround
      quad(x + .04, y + .04, x + .96, y + .96, '#5c3a21', '#3d2412');
      // Dark rich loam soil
      quad(x + .08, y + .08, x + .92, y + .92, wet ? '#3e2716' : '#6b4728');
      
      c.lineCap = 'round';
      // Mounded earth furrows with highlights and rich shadows
      for (let i = 0; i < 3; i++) {
        const yy = y + .26 + i * .24;
        const a = Q(x + .14, yy), b = Q(x + .86, yy);
        const a2 = Q(x + .14, yy + .08), b2 = Q(x + .86, yy + .08);
        // Deep soil groove
        c.beginPath(); c.moveTo(a2[0], a2[1]); c.lineTo(b2[0], b2[1]);
        c.lineWidth = 2.4; c.strokeStyle = wet ? 'rgba(25,14,7,.65)' : 'rgba(45,28,14,.55)'; c.stroke();
        // Mounded ridge highlight
        c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]);
        c.lineWidth = 2.0; c.strokeStyle = wet ? 'rgba(120,85,55,.5)' : 'rgba(165,122,82,.65)'; c.stroke();
      }
      // Corner garden bed joint pegs
      for (const [cx, cy] of [[x + .06, y + .06], [x + .94, y + .06], [x + .94, y + .94], [x + .06, y + .94]]) {
        const cp = Q(cx, cy);
        ART.ell(c, cp[0], cp[1], 1.2, 1.2, '#331d0d');
      }
    }

    // Rustic wooden farm fence with sturdy posts and double cross rails
    const X1 = FARM_X0 + fp.w, Y1 = FARM_Y0 + fp.d;
    const rail = (x0, y0, x1, y1) => {
      for (const z of [6, 12]) {
        const a = Q(x0, y0, z), b = Q(x1, y1, z);
        c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]);
        c.lineCap = 'round'; c.lineWidth = 3.0; c.strokeStyle = '#5a3d24'; c.stroke();
        c.lineWidth = 1.6; c.strokeStyle = '#a6794b'; c.stroke();
      }
    };
    const post = (x, y) => {
      const a = Q(x, y), b = Q(x, y, 16);
      c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]);
      c.lineCap = 'butt'; c.lineWidth = 4.2; c.strokeStyle = '#4a2f19'; c.stroke();
      c.lineWidth = 2.4; c.strokeStyle = '#8f653d'; c.stroke();
      ART.ell(c, b[0], b[1], 2.2, 1.2, '#caa074', '#4a2f19', 0.8);
    };
    rail(FARM_X0, FARM_Y0, X1, FARM_Y0); rail(FARM_X0, FARM_Y0, FARM_X0, Y1);
    for (let x = FARM_X0; x <= X1; x++) post(x, FARM_Y0);
    for (let y = FARM_Y0 + 1; y <= Y1; y++) post(FARM_X0, y);
    rail(FARM_X0, Y1, X1, Y1); rail(X1, FARM_Y0, X1, Y1);
    for (let x = FARM_X0 + 1; x <= X1; x++) post(x, Y1);
    for (let y = FARM_Y0 + 1; y < Y1; y++) post(X1, y);
    c.restore();
  }
  // crop icons + their tap hits: each plot gets its own depth-sort slot (frame()) so the player
  // walking across the patch correctly goes in front of near crops and behind far ones, instead
  // of every crop icon always painting over her regardless of where she's standing
  // the chicken coop north of the field: an OPEN straw pen with a low fence and a nest box (no roof, so the hens can be seen); tap it for the farm panel
  const coopWalk = { t: null, m: new Map() };
  // v1.11: pets pottering about inside their cage / tank / terrarium: walk to a random spot in the enclosure, sniff around a moment, pick another
  // (client-side only, like the coop hens). Sleeping pets stay put; fish swim a bit faster, birds hop from perch to perch.
  const habWalk = { t: null, m: new Map() };
  function habWander(q, a, kind, u0, v0) {
    const lo = kind === 'birdcage' ? .34 : .24, hi = 1 - lo, now = T;
    let st = habWalk.m.get(q.id);
    if (!st || st.kind !== kind) { st = { kind, u: u0, v: v0, tu: u0, tv: v0, wait: Math.random() * 2, dir: 1, lt: now }; habWalk.m.set(q.id, st); }
    const dt = Math.min(.1, Math.max(0, now - st.lt)); st.lt = now;
    let moving = false;
    if (a.sleep || a.trick) { st.wait = 1; }
    else if (st.wait > 0) st.wait -= dt;
    else {
      const du = st.tu - st.u, dv = st.tv - st.v, dd = Math.hypot(du, dv), sp = (kind === 'tank' ? .3 : kind === 'birdcage' ? .45 : .2) * dt;
      if (dd <= sp) { st.u = st.tu; st.v = st.tv; st.wait = (kind === 'tank' ? .4 : 1.2) + Math.random() * (kind === 'tank' ? 1.5 : 3.5); st.tu = lo + Math.random() * (hi - lo); st.tv = lo + Math.random() * (hi - lo); }
      else { st.u += du / dd * sp; st.v += dv / dd * sp; moving = true; const sdx = (du - dv); if (Math.abs(sdx) > .01) st.dir = sdx > 0 ? -1 : 1; } // pet art faces left at dir 1
    }
    const hop = kind === 'birdcage' && moving ? Math.abs(Math.sin(now * 9)) * 4 : 0;
    return { u: st.u, v: st.v, dir: st.dir, moving: moving && kind !== 'tank', hop };
  }
  // v1.10: the farm storage crate -- an artisan oak barn chest with iron straps & brass latch
  function drawFarmBox(fb) {
    const pr = (S.farm && S.farm.produce) || {}, have = CROPS.filter(cr => (pr[cr.id] || 0) > 0).concat(FARM_GOODS.filter(g => (pr[g.id] || 0) > 0 && !g.feed)), n = have.reduce((a, x) => a + (pr[x.id] || 0), 0);
    const p = [ISO.wx(fb.x + .5, fb.y + .5), ISO.wy(fb.x + .5, fb.y + .5)];
    ART.ell(c, p[0], p[1] + 2, 24, 11, 'rgba(0,0,0,.22)');

    // Heavy oak chest base with beveled edges
    cafeBox(fb.x, fb.y, .08, .10, .84, .76, 13, '#854d0e', 0, { top: '#a16207' });
    // Arched domed trunk lid
    cafeBox(fb.x, fb.y, .05, .08, .90, .80, 5, '#a16207', 13, { top: '#ca8a04' });
    // Dark wrought-iron reinforcing bands across lid
    cafeBox(fb.x, fb.y, .22, .07, .12, .82, 5.5, '#292524', 13, { top: '#44403c' });
    cafeBox(fb.x, fb.y, .66, .07, .12, .82, 5.5, '#292524', 13, { top: '#44403c' });

    // Ornate central brass hasp latch and padlock
    const lockX = p[0], lockY = p[1] - 8;
    c.fillStyle = '#eab308'; c.strokeStyle = '#713f12'; c.lineWidth = 1;
    c.beginPath(); c.rect(lockX - 4, lockY - 5, 8, 10); c.fill(); c.stroke();
    ART.ell(c, lockX, lockY, 1.2, 1.6, '#451a03'); // Keyhole

    // Produce icons hovering playfully above the chest
    c.font = '14px sans-serif'; c.textAlign = 'center';
    have.slice(0, 3).forEach((x, i) => {
      const bob = Math.sin(T * 3 + i * 1.5) * 2;
      c.fillText(x.icon, p[0] - 12 + i * 12, p[1] - 22 + bob);
    });

    c.font = 'bold 9px sans-serif'; c.fillStyle = '#fff'; c.lineWidth = 3; c.strokeStyle = 'rgba(50,25,10,.88)'; c.lineJoin = 'round';
    const lab = '📦 ' + t('farmBox') + (n ? ' ' + n : ''); c.strokeText(lab, p[0], p[1] - 34); c.fillText(lab, p[0], p[1] - 34); c.textAlign = 'start';
    hits.push({ kind: 'farmbox', x0: p[0] - 28, x1: p[0] + 28, y0: p[1] - 46, y1: p[1] + 10 });
  }
  function collectCoop() {
    const cp = S.farm && S.farm.coop; if (!cp) return [];
    const q = COOP_POS(W()), day = S.clock ? S.clock.day : 0;
    return [{ depth: q.x + q.w + q.y + q.d - 1.02, fn: () => {
      c.save();
      const P = (x, y) => [ISO.wx(q.x + x, q.y + y), ISO.wy(q.x + x, q.y + y)];
      const fl = [P(0, 0), P(q.w, 0), P(q.w, q.d), P(0, q.d)];
      c.beginPath(); fl.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); c.fillStyle = '#e6d08a'; c.fill();
      for (let i = 0; i < 9; i++) { const p = P(.2 + ((i * 37) % 10) / 10 * (q.w - .4), .2 + ((i * 53) % 10) / 10 * (q.d - .4)); c.beginPath(); c.ellipse(p[0], p[1], 5, 2, 0, 0, 7); c.fillStyle = i % 2 ? 'rgba(180,140,60,.35)' : 'rgba(255,240,180,.6)'; c.fill(); }
      // back fence (north + west sides), a nest box in the corner, low posts along the open front
      cafeBox(q.x, q.y, 0, 0, q.w, .12, 16, '#b98757', 0, { top: '#d9a574' });
      cafeBox(q.x, q.y, 0, 0, .12, q.d, 16, '#b98757', 0, { top: '#d9a574' });
      cafeBox(q.x, q.y, .16, .16, .42, .26, 5, '#a06a3c', 0, { top: '#c98a4a' }); // a small feed trough in the corner
      const hens = cp.hens.slice(0, 16), base = P(q.w / 2, q.d / 2);
      c.globalAlpha = 1;
      // the eggs that were laid this morning, lying in the straw by the nest box (fully visible)
      for (let i = 0; i < Math.min(cp.eggs, 12); i++) { const p = P(.35 + (i % 6) * .27, .95 + ((i / 6) | 0) * .26); ART.ell(c, p[0], p[1] - 3, 4.4, 5.6, '#fffaf0', 'rgba(90,60,30,.85)', 1); ART.ell(c, p[0] - 1.2, p[1] - 5, 1.4, 1.8, 'rgba(255,255,255,.9)'); }
      // the hens, drawn in full with the same chick art as the shop pets (opaque), pecking about inside the pen
      // each hen wanders the whole pen: walk to a random spot, peck a moment, pick another (client-side only)
      { const dtc = Math.min(.1, Math.max(0, T - (coopWalk.t == null ? T : coopWalk.t))); coopWalk.t = T;
        hens.forEach((h, i) => {
          let st = coopWalk.m.get(h.id);
          if (!st) { st = { x: .3 + Math.random() * (q.w - .6), y: .3 + Math.random() * (q.d - .6), tx: 0, ty: 0, wait: Math.random() * 2, dir: 1 }; st.tx = st.x; st.ty = st.y; coopWalk.m.set(h.id, st); }
          if (st.wait > 0) st.wait -= dtc;
          else { const dx = st.tx - st.x, dy = st.ty - st.y, dd = Math.hypot(dx, dy), sp = .38 * dtc; if (dd <= sp) { st.x = st.tx; st.y = st.ty; st.wait = 1 + Math.random() * 3; st.tx = .3 + Math.random() * (q.w - .6); st.ty = .3 + Math.random() * (q.d - .6); } else { st.x += dx / dd * sp; st.y += dy / dd * sp; if (Math.abs(dx - dy) > .05) st.dir = dx - dy > 0 ? 1 : -1; } }
          const adult = day - h.born >= COOP_GROW_DAYS, p = P(st.x, st.y), sc = adult ? .42 : .34, hop = st.wait > 0 && Math.sin(T * 9 + i) > .6 ? 1.5 : 0;
          c.save(); c.translate(p[0], p[1] + 2 - hop);
          c.scale(sc * st.dir, sc);
          // User Request 5: All coop birds rendered with the cute fluffy chick graphics!
          ART.pet(c, 'chick', { t: T + i, mood: 'happy', seed: h.seed || i + 1, age: 1, moving: st.wait <= 0 });
          c.restore();
        }); }      cafeBox(q.x, q.y, q.w - .08, .12, .08, q.d - .12, 5, '#b98757', 0, { top: '#d9a574' });
      cafeBox(q.x, q.y, 0, q.d - .08, q.w, .08, 5, '#b98757', 0, { top: '#d9a574' });      c.font = 'bold 9px sans-serif'; c.textAlign = 'center'; c.fillStyle = '#fff'; c.lineWidth = 3; c.strokeStyle = 'rgba(60,30,20,.85)'; c.lineJoin = 'round';
      const lab = t('henTitle') + ' ' + cp.hens.length + '/' + COOP_LV[cp.lv].cap; c.strokeText(lab, base[0], base[1] - 30); c.fillText(lab, base[0], base[1] - 30);
      if (cp.eggs > 0) { c.font = '13px sans-serif'; c.fillText('\u{1F95A}' + cp.eggs, base[0] + 22, base[1] - 16 + Math.sin(T * 3) * -2); }
      if (cp.hens.some(h => h.fed !== day)) { c.font = '13px sans-serif'; c.fillText('\u{1F963}', base[0] - 22, base[1] - 16 + Math.sin(T * 3 + 1) * -2); }
      hits.push({ kind: 'coop', x0: base[0] - 40, x1: base[0] + 40, y0: base[1] - 44, y1: base[1] + 26 });
      c.restore(); } }];
  }  // v9.90: a grown hen (white or brown, red comb + wattle, tail feathers); chicks keep the fluffy chick art
  function drawHen(h, i, peck) {
    // User Request 12: High-craft realistic rooster / hen graphics (matching User Image 8)
    const brown = ((h.seed || h.id || i) % 4) === 0;
    const body = brown ? '#d97706' : '#ffffff';
    const bodyLight = brown ? '#fbbf24' : '#ffffff';
    const shade = brown ? '#92400e' : '#e2e8f0';
    const O = 'rgba(40,25,15,.75)';

    // 1. Soft contact shadow on ground
    ART.ell(c, 1, 0, 14, 5, 'rgba(30,20,10,.25)');

    // 2. Strong textured legs with rear spurs and claws
    c.strokeStyle = '#f59e0b'; c.lineWidth = 2.4; c.lineCap = 'round';
    // Back leg
    c.beginPath(); c.moveTo(-2, -9); c.lineTo(-3, 0); c.lineTo(-7, 1); c.moveTo(-3, 0); c.lineTo(-1, 2); c.moveTo(-3, -2); c.lineTo(-6, -4); c.stroke();
    // Front leg
    c.strokeStyle = '#d97706';
    c.beginPath(); c.moveTo(4, -9); c.lineTo(5, 0); c.lineTo(9, 1); c.moveTo(5, 0); c.lineTo(6, 2); c.moveTo(5, -2); c.lineTo(2, -4); c.stroke();

    // 3. Majestic cascading sickle tail feathers (sweeping tall arced plumes like User Image 8)
    // Primary tall sickle feather
    c.beginPath(); c.moveTo(-6, -16);
    c.quadraticCurveTo(-26, -32, -22, -46);
    c.quadraticCurveTo(-14, -36, -3, -24);
    c.closePath();
    c.fillStyle = shade; c.fill(); c.lineWidth = 1.2; c.strokeStyle = O; c.stroke();
    // Secondary curved sickle feather
    c.beginPath(); c.moveTo(-7, -14);
    c.quadraticCurveTo(-24, -26, -18, -38);
    c.quadraticCurveTo(-12, -28, -2, -20);
    c.closePath();
    c.fillStyle = body; c.fill(); c.lineWidth = 1; c.strokeStyle = O; c.stroke();
    // Tertiary lower decorative covert feather
    c.beginPath(); c.moveTo(-8, -12);
    c.quadraticCurveTo(-20, -18, -14, -28);
    c.quadraticCurveTo(-9, -19, -4, -16);
    c.closePath();
    c.fillStyle = brown ? '#b45309' : '#f8fafc'; c.fill(); c.lineWidth = 0.9; c.strokeStyle = O; c.stroke();

    // 4. Sturdy, plump body with soft feather shading
    const gBody = c.createRadialGradient(3, -20, 4, 0, -16, 17);
    gBody.addColorStop(0, bodyLight); gBody.addColorStop(0.75, body); gBody.addColorStop(1, shade);
    ART.ell(c, 0, -16, 15, 12, gBody, O, 1.4);

    // 5. Broad layered wing with primary flight feathers & quill lines
    c.beginPath();
    c.moveTo(-2, -21);
    c.quadraticCurveTo(-12, -17, -9, -10);
    c.quadraticCurveTo(-2, -7, 8, -14);
    c.closePath();
    c.fillStyle = brown ? '#b45309' : '#f1f5f9'; c.fill(); c.lineWidth = 1.2; c.strokeStyle = O; c.stroke();
    // Flight feather quills
    for (let q = 0; q < 4; q++) {
      const qx = -6 + q * 3.4, qy = -14 + (q % 2) * 1.5;
      c.beginPath(); c.moveTo(qx - 2, qy - 4); c.lineTo(qx + 3, qy + 4);
      c.lineWidth = 0.8; c.strokeStyle = brown ? '#78350f' : '#cbd5e1'; c.stroke();
      ART.ell(c, qx, qy, 2.2, 3.2, brown ? '#d97706' : '#ffffff', 'rgba(100,116,139,.35)', 0.8);
    }

    // 6. Graceful arched neck with hackle cape feathers
    const hy = peck ? -12 : -27, hx = peck ? 15 : 10;
    c.beginPath();
    c.moveTo(hx - 6, -21);
    c.quadraticCurveTo(hx - 5, hy + 6, hx, hy);
    c.lineTo(hx + 5, hy + 5);
    c.lineTo(hx + 9, -19);
    c.closePath();
    c.fillStyle = body; c.fill();
    // Neck hackle feather points
    for (let p = 0; p < 3; p++) {
      c.beginPath(); c.moveTo(hx - 4 + p * 4, -20); c.lineTo(hx - 2 + p * 4, -15); c.lineTo(hx + p * 4, -20);
      c.fillStyle = brown ? '#f59e0b' : '#f8fafc'; c.fill();
    }
    // Head oval
    ART.ell(c, hx, hy, 8, 8, gBody, O, 1.2);

    // 7. Majestic tall scarlet comb with 5 serrated points (hallmark of User Image 8)
    const combG = c.createLinearGradient(hx, hy - 14, hx, hy);
    combG.addColorStop(0, '#ef4444'); combG.addColorStop(1, '#b91c1c');
    for (let k = 0; k < 5; k++) {
      const peakH = k === 2 ? 6.5 : (k === 1 || k === 3) ? 5.2 : 3.8;
      const cx0 = hx - 5.5 + k * 2.8, cy0 = hy - 6.5 - peakH * 0.65;
      ART.ell(c, cx0, cy0, 2.2, peakH, combG, 'rgba(153,27,27,.8)', 0.8);
      // Highlights on comb lobes
      ART.ell(c, cx0 - 0.5, cy0 - peakH * 0.35, 0.9, 1.4, '#fca5a5');
    }

    // 8. Elegant dual red wattles under beak & white earlobe
    ART.ell(c, hx - 2, hy + 1.5, 2.4, 2.4, '#f8fafc', '#cbd5e1', 0.8); // White earlobe patch
    ART.ell(c, hx + 3.2, hy + 7.5, 2.6, 4.4, combG, 'rgba(153,27,27,.8)', 0.8); // Primary wattle
    ART.ell(c, hx + 5.2, hy + 6.8, 2.0, 3.6, '#dc2626', 'rgba(153,27,27,.7)', 0.7); // Secondary wattle fold

    // 9. Sharp golden curved beak with nostril
    c.beginPath(); c.moveTo(hx + 6, hy - 2); c.quadraticCurveTo(hx + 12, hy - 1, hx + 13.5, hy + 1.2); c.lineTo(hx + 6, hy + 3.2); c.closePath();
    c.fillStyle = '#f59e0b'; c.fill(); c.lineWidth = 1; c.strokeStyle = O; c.stroke();
    // Beak line & nostril
    c.beginPath(); c.moveTo(hx + 7, hy + 0.4); c.lineTo(hx + 13, hy + 1); c.lineWidth = 0.8; c.strokeStyle = '#92400e'; c.stroke();
    ART.ell(c, hx + 7.5, hy - 0.8, 0.7, 0.7, '#78350f');

    // 10. Alert eye with round amber rim and glistening catchlight
    ART.ell(c, hx + 2.5, hy - 1.2, 2.8, 2.8, '#ea580c', 'rgba(67,20,7,.8)', 0.8);
    ART.ell(c, hx + 2.5, hy - 1.2, 1.8, 1.8, '#0f172a');
    ART.ell(c, hx + 1.8, hy - 1.8, 0.9, 0.9, '#ffffff'); // bright shine
  }
  function collectFarmCrops() {
    const f = S.farm; if (!f) return [];
    const out = [];
    for (const p of f.plots) if (p.crop) out.push({ depth: p.x + p.y + .98, fn: () => drawOneCrop(p) });
    return out;
  }
  // every crop has its own young / growing / RIPE look (v9.68: plants 1.35x bigger, outlined leaves,
  // and the ripe stage is drawn -- red tomatoes, orange pumpkin, yellow corn, purple grapes... --
  // instead of the old emoji). stage: 0 = sprout, 1 = growing, 2 = ready to harvest
  const CROP_SC = 1.35;
  // PERF: each (crop, stage) is painted ONCE into an offscreen sprite at the current screen scale and then
  // stamped with drawImage; the wind sway is a horizontal skew of the stamp (tops move, roots stay). Painting
  // every leaf live cost ~3.7x the old frame time on a 16x16 field that was all ripe.
  const cropSpr = { k: 0, m: new Map() }, CB = { x0: -19, x1: 19, y0: -52, y1: 9 };
  function drawCropPlant(id, stage, cx, cy) {
    const sw = Math.sin(T * 2 + cx * .05) * 1.3;
    const tf = c.getTransform(), k = Math.max(.25, Math.round(Math.hypot(tf.a, tf.b) * 8) / 8);
    if (cropSpr.k !== k) { cropSpr.k = k; cropSpr.m.clear(); }
    const key = id + '|' + stage; let spr = cropSpr.m.get(key);
    if (!spr) {
      spr = document.createElement('canvas');
      spr.width = Math.ceil((CB.x1 - CB.x0) * CROP_SC * k) + 2; spr.height = Math.ceil((CB.y1 - CB.y0) * CROP_SC * k) + 2;
      const g = spr.getContext('2d'); g.setTransform(k, 0, 0, k, -CB.x0 * CROP_SC * k + 1, -CB.y0 * CROP_SC * k + 1);
      const oc = c; c = g; try { paintCropPlant(id, stage); } finally { c = oc; }
      cropSpr.m.set(key, spr);
    }
    c.save(); c.translate(cx, cy); if (cam.z >= .75) c.transform(1, 0, -sw / 22, 1, 0, 0); // zoomed out the sway is under a pixel: skip the skew
    c.drawImage(spr, CB.x0 * CROP_SC - 1 / k, CB.y0 * CROP_SC - 1 / k, spr.width / k, spr.height / k);
    c.restore();
  }
  function paintCropPlant(id, stage) {
    { const cr = CROPS.find(x => x.id === id); if (cr && cr.tree) { // v1.27: fruit tree -- sapling, young tree, full tree towering tall
      const sc = stage === 0 ? .6 : stage === 1 ? 1.05 : 1.55, lf = cr.leaf || '#4f9a44';
      c.fillStyle = '#7a4e32'; c.fillRect(-2.8 * sc, -34 * sc, 5.6 * sc, 34 * sc); c.strokeStyle = 'rgba(40,25,15,.6)'; c.lineWidth = .9; c.strokeRect(-2.8 * sc, -34 * sc, 5.6 * sc, 34 * sc);
      for (const [dx, dy, r] of [[-12, -36, 12], [12, -37, 12], [0, -50, 15], [-5, -42, 11], [6, -43, 11]]) { c.beginPath(); c.ellipse(dx * sc, dy * sc, r * sc, r * .86 * sc, 0, 0, 7); c.fillStyle = lf; c.fill(); c.strokeStyle = 'rgba(30,70,28,.55)'; c.lineWidth = .9; c.stroke(); }
      c.beginPath(); c.ellipse(-4 * sc, -52 * sc, 6 * sc, 3.5 * sc, 0, 0, 7); c.fillStyle = 'rgba(255,255,255,.22)'; c.fill();
      if (stage >= 2) { c.font = `${Math.round(11 * sc)}px sans-serif`; c.textAlign = 'center'; c.fillStyle = '#000'; for (const [dx, dy] of [[-11, -34], [10, -38], [0, -50], [-4, -42], [12, -30]]) c.fillText(cr.icon, dx * sc, dy * sc); c.textAlign = 'start'; }
      return; } }
    const sw = 0, S1 = stage >= 1, S2 = stage >= 2;
    const OUT = 'rgba(30,70,28,.6)';
    // leaf: every leaf now gets a soft dark-green outline unless a colour is given (st === 0 -> none)
    const L = (x, y, rx, ry, rot, col, st) => { c.save(); c.translate(x, y); c.rotate(rot); c.beginPath(); c.ellipse(0, 0, rx, ry, 0, 0, 7); c.fillStyle = col; c.fill(); if (st !== 0) { c.strokeStyle = st || OUT; c.lineWidth = .8; c.stroke(); } c.restore(); };
    // pointed leaf (almond shape) from its base toward an angle, with a midrib
    const PL = (x, y, len, wid, ang, col, st) => { c.save(); c.translate(x, y); c.rotate(ang); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(len * .5, -wid, len, 0); c.quadraticCurveTo(len * .5, wid, 0, 0); c.closePath(); c.fillStyle = col; c.fill(); c.strokeStyle = st || OUT; c.lineWidth = .8; c.stroke(); c.beginPath(); c.moveTo(len * .1, 0); c.lineTo(len * .8, 0); c.strokeStyle = 'rgba(255,255,255,.28)'; c.lineWidth = .6; c.stroke(); c.restore(); };
    const ln = (x0, y0, x1, y1, col, w) => { c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.strokeStyle = col; c.lineWidth = w || 1.6; c.lineCap = 'round'; c.stroke(); };
    const dot = (x, y, r, col, st) => { c.beginPath(); c.arc(x, y, r, 0, 7); c.fillStyle = col; c.fill(); if (st) { c.strokeStyle = st; c.lineWidth = .7; c.stroke(); } };
    // round fruit with outline + glossy highlight
    const fr = (x, y, rx, ry, col, st) => { c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, 7); c.fillStyle = col; c.fill(); c.strokeStyle = st; c.lineWidth = .9; c.stroke(); c.beginPath(); c.ellipse(x - rx * .38, y - ry * .38, rx * .28, ry * .2, -.5, 0, 7); c.fillStyle = 'rgba(255,255,255,.6)'; c.fill(); };
    const calyx = (x, y, r) => { for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + k * 1.2566; ln(x, y, x + Math.cos(a) * r, y + Math.sin(a) * r * .6, '#3f8a3a', 1.1); } };
    c.save(); c.scale(CROP_SC, CROP_SC);
    L(0, 1, S2 ? 10 : 9, S2 ? 4 : 3.6, 0, 'rgba(92,60,30,.55)', 0);
    switch (id) {
      case 'wheat':
        if (S2) {
          for (let i = -3; i <= 3; i++) {
            const h = 23 + ((i + 3) % 3) * 2, bx = i * 2.2, tx = bx + sw * (h / 22) + i * 1.2, bend = i * .12 + sw * .04;
            ln(bx, 0, tx, -h, '#c9a040', 1.5);
            c.save(); c.translate(tx, -h - 4); c.rotate(bend);
            for (let g = 0; g < 4; g++) { L(-1.1, -g * 2.2 + 2, 1.5, 1.9, -.35, '#f2cf5c', '#a67c20'); L(1.1, -g * 2.2 + 2, 1.5, 1.9, .35, '#f5d66e', '#a67c20'); }
            ln(0, -6, -1.5, -11, 'rgba(200,160,60,.9)', .6); ln(0, -6, 1.5, -11, 'rgba(200,160,60,.9)', .6);
            c.restore();
          }
          PL(-2, -2, 9, 2, -2.6, '#b8b24a'); PL(2, -3, 9, 2, -.5, '#c2bb55');
        } else for (let i = -2; i <= 2; i++) { const h = (S1 ? 20 : 9) + (i % 2 ? 0 : 3); ln(i * 2.4, 0, i * 2.4 + sw * (h / 20) + i, -h, S1 ? '#b9c24a' : '#9ccc5a', 1.8); if (S1) L(i * 2.4 + sw + i, -h - 2, 1.6, 4, .2 * i, '#d9d36a', '#8f8a30'); }
        break;
      case 'carrot': {
        const n = S2 ? 5 : 3, h = S2 ? 19 : S1 ? 16 : 8;
        for (let i = 0; i < n; i++) {
          const k = n === 1 ? 0 : i / (n - 1) - .5, tx = k * (S2 ? 14 : 8) + sw, ty = -h + Math.abs(k) * 5;
          ln(k * 3, 0, tx, ty, '#4f9e3c', 1.3);
          for (const q of [.4, .65, .9]) { const px = k * 3 + (tx - k * 3) * q, py = ty * q; PL(px, py, 4.2, 1.6, -2.3 + k, '#78c95a'); PL(px, py, 4.2, 1.6, -.8 + k, '#6cbf50'); }
        }
        if (S2) {
          for (const [x, s] of [[-4, 1], [4.5, .85]]) { c.beginPath(); c.moveTo(x - 4 * s, -1); c.quadraticCurveTo(x, -6 * s, x + 4 * s, -1); c.quadraticCurveTo(x + 2 * s, 4 * s, x, 5 * s); c.quadraticCurveTo(x - 2 * s, 4 * s, x - 4 * s, -1); c.closePath(); c.fillStyle = '#f28c28'; c.fill(); c.strokeStyle = '#b3560f'; c.lineWidth = .9; c.stroke(); ln(x - 2 * s, 1 * s, x + 1 * s, 1 * s, 'rgba(170,80,15,.6)', .6); ln(x - 1 * s, 3 * s, x + 1.5 * s, 3 * s, 'rgba(170,80,15,.6)', .6); }
        } else if (S1) dot(0, -1, 2.6, '#f28c28', '#b3560f');
        break; }
      case 'potato':
        if (S2) {
          for (const [x, y, s] of [[-8, 2, 1], [7, 2.5, .9], [0, 3.5, .8]]) { fr(x, y, 4.4 * s, 3 * s, '#c9995a', '#7a5530'); dot(x + 1 * s, y - .5, .5, '#7a5530'); dot(x - 1.5 * s, y + .8 * s, .5, '#7a5530'); }
          L(-6 + sw * .3, -6, 7, 4.2, -.4, '#3f8a49', '#24522b'); L(6 + sw * .3, -6, 7, 4.2, .4, '#4a9a52', '#24522b');
          L(sw * .4, -13, 6.5, 4, 0, '#57a85e', '#24522b'); L(-7, -12, 4.6, 3, -.8, '#3f8a49', '#24522b'); L(7, -13, 4.6, 3, .8, '#4a9a52', '#24522b');
          for (const [x, y] of [[4, -18], [-3, -19], [8, -15]]) { for (let k = 0; k < 5; k++) { const a = k * 1.2566; dot(x + sw * .4 + Math.cos(a) * 1.5, y + Math.sin(a) * 1.5, 1.2, '#efe6ff'); } dot(x + sw * .4, y, .9, '#f2c93a'); }
        } else {
          L(-4 + sw * .3, -5, S1 ? 6 : 4, S1 ? 3.6 : 2.4, -.4, '#3f8a49', '#2a5d33'); L(4 + sw * .3, -5, S1 ? 6 : 4, S1 ? 3.6 : 2.4, .4, '#4a9a52', '#2a5d33');
          if (S1) { L(sw * .4, -12, 5.5, 3.4, 0, '#57a85e', '#2a5d33'); L(-6, -11, 4, 2.6, -.8, '#3f8a49', '#2a5d33'); dot(5, -14, 1.8, '#e8e0ff'); }
        }
        break;
      case 'tomato':
        if (S2) {
          ln(6, 1, 6, -28, '#9a6f3e', 2); ln(6, 1, 6, -28, '#c79a62', .9);
          c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-3 + sw * .3, -12, 1 + sw * .5, -26); c.strokeStyle = '#4f7f32'; c.lineWidth = 1.8; c.stroke();
          PL(0, -8, 8, 3, -2.7, '#4f9a48'); PL(0, -12, 8, 3, -.3, '#5aa84f'); PL(-1, -18, 7, 2.6, -2.5, '#4f9a48'); PL(0, -22, 7, 2.6, -.5, '#5aa84f'); PL(1, -26, 5, 2, -1.6, '#62b556');
          for (const [x, y, r] of [[-5, -8, 4.3], [4, -14, 4.7], [-4, -20, 3.8], [3, -5, 3.9]]) { fr(x, y, r, r * .92, '#e8412f', '#9a2016'); calyx(x, y - r * .8, 2.2); }
        } else {
          ln(0, 0, sw * .5, S1 ? -24 : -10, '#5a8a3a', 1.6);
          if (S1) { ln(5, -2, 5, -26, '#b58a52', 1.4); L(-4, -14, 4.2, 2.4, -.5, '#4f9a48'); L(4, -19, 4.2, 2.4, .5, '#4f9a48'); dot(-3, -9, 2.6, '#7ac75a', '#3f7a2c'); dot(4, -12, 2.2, '#e8c33a', '#9a7a18'); dot(-5, -20, 1.8, '#ffe066'); }
          else { L(-3, -9, 3.2, 1.8, -.6, '#6fbf5a'); L(3, -10, 3.2, 1.8, .6, '#6fbf5a'); }
        }
        break;
      case 'corn':
        if (S2) {
          const top = -36, tx = sw * .6;
          ln(0, 0, tx, top, '#6f9e36', 3.2); ln(0, 0, tx, top, '#9ccc55', 1.6);
          for (const [k, d] of [[.22, -1], [.4, 1], [.58, -1], [.76, 1]]) { const y = top * k; c.beginPath(); c.moveTo(tx * k, y); c.quadraticCurveTo(d * 9, y - 7, d * 13, y + 2); c.quadraticCurveTo(d * 8, y - 3, tx * k, y + 2); c.closePath(); c.fillStyle = d > 0 ? '#7ac05a' : '#6fb04a'; c.fill(); c.strokeStyle = OUT; c.lineWidth = .8; c.stroke(); }
          for (const [y, d] of [[-15, 1], [-22, -1]]) { // two ripe cobs: yellow kernels peeking out of a green husk
            c.save(); c.translate(tx * .5 + d * 2.5, y); c.rotate(d * .38);
            L(0, 1, 3.4, 8, 0, '#8cc460', '#3f7a2c');
            c.beginPath(); c.ellipse(0, -1, 2.5, 6.4, 0, 0, 7); c.fillStyle = '#f7cf3a'; c.fill(); c.strokeStyle = '#b8870e'; c.lineWidth = .8; c.stroke();
            for (let r = -4; r <= 3; r += 1.6) for (const kx of [-1, 0, 1]) dot(kx * 1.1, r, .45, 'rgba(190,130,10,.55)');
            PL(0, 7, 8, 2.2, -1.9 + d * .3, '#7ab852'); PL(0, 7, 8, 2.2, -1.25 + d * .3, '#8cc460');
            c.restore();
          }
          for (let k = -2; k <= 2; k++) ln(tx, top, tx + k * 2.5 + sw * .3, top - 7 + Math.abs(k), '#d9b44a', 1.1);
        } else {
          ln(0, 0, sw * .6, S1 ? -30 : -14, '#8ac04a', S1 ? 2.6 : 1.6);
          for (const k of S1 ? [.3, .55, .8] : [.5]) { L(-5 * (1 - k * .3), -30 * k * (S1 ? 1 : .47), 6, 1.6, -.6, '#6fb04a'); L(5 * (1 - k * .3), -30 * k * (S1 ? 1 : .47) - 3, 6, 1.6, .6, '#7ac05a'); }
          if (S1) { ln(sw * .6, -30, sw * .6 - 2, -35, '#d9b44a', 1.2); ln(sw * .6, -30, sw * .6 + 2, -35, '#d9b44a', 1.2); }
        }
        break;
      case 'pumpkin':
        if (S2) {
          L(-9, -5, 7, 4.6, -.3, '#5da648', '#2f6a30'); L(9, -6, 7, 4.6, .3, '#6bb552', '#2f6a30'); L(0, -12, 6, 4, 0, '#79c05a', '#2f6a30');
          c.beginPath(); c.moveTo(-12, 2); c.bezierCurveTo(-16, -1, -14, -6, -11, -4); c.strokeStyle = '#4a8a3a'; c.lineWidth = 1.1; c.stroke();
          // the pumpkin itself: three overlapping ribs, darker at the sides
          const py = -3;
          c.beginPath(); c.ellipse(-4.5, py, 5.5, 6, 0, 0, 7); c.fillStyle = '#e0701a'; c.fill(); c.strokeStyle = '#9a4a0e'; c.lineWidth = .9; c.stroke();
          c.beginPath(); c.ellipse(4.5, py, 5.5, 6, 0, 0, 7); c.fillStyle = '#e0701a'; c.fill(); c.stroke();
          c.beginPath(); c.ellipse(0, py, 5, 6.4, 0, 0, 7); c.fillStyle = '#f58f2c'; c.fill(); c.stroke();
          c.beginPath(); c.ellipse(-1.6, py - 2.6, 1.6, 2.4, -.3, 0, 7); c.fillStyle = 'rgba(255,230,170,.55)'; c.fill();
          c.beginPath(); c.moveTo(0, py - 5.5); c.quadraticCurveTo(.5, py - 9, 2.5, py - 9.5); c.strokeStyle = '#5a6a2a'; c.lineWidth = 2; c.lineCap = 'round'; c.stroke();
          PL(1, py - 7, 5, 2, -.6, '#6bb552');
        } else {
          L(-6, -3, S1 ? 7 : 5, S1 ? 4.4 : 3, -.3, '#5da648', '#2f6a30'); L(6, -4, S1 ? 7 : 5, S1 ? 4.4 : 3, .3, '#6bb552', '#2f6a30');
          ln(0, 0, sw, -6, '#4a8a3a', 1.6);
          if (S1) { L(0, -10, 6, 4, 0, '#79c05a', '#2f6a30'); dot(9, -1, 3.6, '#9ac04a', '#4f7a2a'); ln(9, -4, 10, -7, '#4a8a3a', 1.4); ln(-7, 0, -12, -3, '#4a8a3a', 1); }
        }
        break;
      case 'lettuce':
        if (S2) {
          for (let i = 0; i < 9; i++) { const a = i * (Math.PI * 2 / 9) + .2; L(Math.cos(a) * 7.5, -6 + Math.sin(a) * 3.4, 6.4, 4.2, a, i % 2 ? '#8fd460' : '#72bd4e', '#3f8a30'); }
          for (let i = 0; i < 6; i++) { const a = i * (Math.PI * 2 / 6) + .6; L(Math.cos(a) * 4, -9 + Math.sin(a) * 2, 5, 3.4, a, i % 2 ? '#aee67c' : '#9bdc6b', '#4f9a3a'); }
          L(0, -11, 5.2, 4, 0, '#cdf29e', '#5aa040');
          for (const a of [-.9, .9, 2.2, -2.2]) ln(Math.cos(a) * 2, -11 + Math.sin(a) * 1.2, Math.cos(a) * 5, -11 + Math.sin(a) * 3, 'rgba(255,255,255,.5)', .6);
        } else {
          for (let i = 0; i < (S1 ? 7 : 4); i++) { const a = i * (Math.PI * 2 / (S1 ? 7 : 4)) + .4; L(Math.cos(a) * (S1 ? 5 : 3.2), -4 - (S1 ? 3 : 1) + Math.sin(a) * 2.2, S1 ? 5.4 : 3.6, S1 ? 3.6 : 2.4, a, i % 2 ? '#9bdc6b' : '#7cc655', '#4f9a3a'); }
          if (S1) L(0, -7, 4.4, 3, 0, '#b6ee85', '#5aa040');
        }
        break;
      case 'strawberry':
        for (const [x, y, r] of [[-5, -5, -.5], [5, -5, .5], [0, -9, 0]]) L(x, y, S2 ? 6 : S1 ? 5 : 3.4, S2 ? 3.6 : S1 ? 3 : 2.2, r, '#5cb04c', '#2f7a30');
        if (S2) {
          for (const [x, y] of [[-4, -13], [5, -12]]) { for (let k = 0; k < 5; k++) { const a = k * 1.2566; dot(x + Math.cos(a) * 1.3, y + Math.sin(a) * 1.3, 1.1, '#fff'); } dot(x, y, .8, '#f2c93a'); }
          for (const [x, y, s] of [[-8, -1, 1], [8, 0, .9], [0, 2, 1], [-2, -4, .8]]) {
            c.beginPath(); c.moveTo(x - 3.2 * s, y - 2 * s); c.quadraticCurveTo(x, y - 3.6 * s, x + 3.2 * s, y - 2 * s); c.quadraticCurveTo(x + 3 * s, y + 2 * s, x, y + 4.4 * s); c.quadraticCurveTo(x - 3 * s, y + 2 * s, x - 3.2 * s, y - 2 * s); c.closePath();
            c.fillStyle = '#e3303f'; c.fill(); c.strokeStyle = '#8f1420'; c.lineWidth = .8; c.stroke();
            for (const [sx, sy] of [[-1.3, -.5], [1.2, -.4], [0, 1.2], [-1, 2], [1, 2.2], [0, -1.5]]) dot(x + sx * s, y + sy * s, .38, '#ffe27a');
            calyx(x, y - 2.6 * s, 2.2 * s);
          }
        } else if (S1) { dot(-4, -11, 2, '#fff'); dot(5, -10, 2, '#fff'); dot(-7, -2, 2.2, '#e0505a', '#8f1420'); dot(7, -2, 1.8, '#9ad06a', '#4f7a2a'); }
        break;
      case 'blueberry':
        ln(0, 0, sw * .5, S2 ? -22 : S1 ? -20 : -10, '#7a5a3a', 1.8);
        if (S2) ln(0, -6, -7, -14, '#7a5a3a', 1.2), ln(0, -9, 7, -16, '#7a5a3a', 1.2);
        for (const [x, y] of S2 ? [[-7, -10], [7, -12], [-4, -19], [5, -21], [0, -6], [-9, -16], [9, -18], [0, -24]] : S1 ? [[-5, -10], [5, -13], [-3, -19], [4, -21], [0, -6]] : [[-3, -8], [3, -10]]) L(x + sw * .4, y, S2 ? 4 : 3.4, S2 ? 2.4 : 2, x * .1, '#3f8f78', '#24524a');
        if (S2) {
          for (const [x, y] of [[-8, -6], [-5, -5], [-6.5, -8], [7, -9], [9.5, -8], [8, -11.5], [1, -14], [-1.5, -15.5], [2, -17], [-5, -22], [5, -25]]) { dot(x + sw * .4, y, 2.2, '#4a5fc0', '#232d70'); dot(x + sw * .4 - .7, y - .8, .6, 'rgba(255,255,255,.6)'); ln(x + sw * .4 - .5, y - 2, x + sw * .4 + .5, y - 2, '#232d70', .5); }
        } else if (S1) { dot(-6, -6, 2, '#9fb0e8', '#4a5fc0'); dot(6, -8, 2.2, '#8aa0e0', '#4a5fc0'); dot(1, -15, 1.8, '#b6c4f0', '#4a5fc0'); }
        break;
      case 'grape': {
        const top = S2 ? -26 : S1 ? -26 : -12, arch = S2 ? -24 : S1 ? -22 : -10;
        ln(-7, 0, -7, top, '#8a6238', 2); ln(7, 0, 7, top, '#8a6238', 2);
        if (S2) ln(-8, top, 8, top, '#8a6238', 2);
        c.beginPath(); c.moveTo(-7, arch); c.quadraticCurveTo(sw, arch - 6, 7, arch); c.strokeStyle = '#5a8a3a'; c.lineWidth = 1.6; c.stroke();
        if (S2) {
          for (const [x, y, r] of [[-5, -26, -.3], [0, -29, 0], [5, -26, .3], [-8, -21, -.8], [8, -21, .8]]) { L(x - 1.8, y, 2.6, 2.4, r, '#5fb04a', '#2f6a30'); L(x + 1.8, y, 2.6, 2.4, r, '#5fb04a', '#2f6a30'); L(x, y - 1.6, 2.8, 2.6, r, '#6cbf55', '#2f6a30'); }
          for (const [bx, by] of [[-3.5, -21], [4, -20]]) { // two hanging bunches, wide at the top, tapering down
            ln(bx, by - 2, bx, by + 1, '#5a6a2a', 1);
            const rows = [[-2.2, 0, 2.2], [-1.1, 1.1], [-1.9, 0, 1.9], [-1, 1], [0]];
            rows.forEach((row, ri) => row.forEach(dx => { const x = bx + dx + sw * .2, y = by + 2 + ri * 2.2; dot(x, y, 1.55, ri % 2 ? '#6b2f90' : '#7b3fa0', '#3a1650'); dot(x - .5, y - .6, .45, 'rgba(255,255,255,.55)'); }));
          }
          c.beginPath(); c.moveTo(7, -22); c.bezierCurveTo(11, -22, 11, -17, 9, -17); c.strokeStyle = '#6f9a3a'; c.lineWidth = .8; c.stroke();
        } else {
          L(-3, S1 ? -20 : -9, 4, 2.6, -.5, '#5fb04a', '#2f6a30'); L(4, S1 ? -24 : -11, 4, 2.6, .5, '#5fb04a', '#2f6a30');
          if (S1) { for (const [x, y] of [[-1, -12], [1, -11], [0, -9], [-2, -9], [2, -8]]) dot(x, y, 1.9, '#9ad06a', '#4f7a2a'); ln(-8, -18, -10, -22, '#7a5a9a', 1); }
        }
        break; }
      default: L(0, -6, 4, 2.4, 0, '#6fbf5a');
    }
    c.restore();
  }
  // a ripe crop twinkles: a warm glow on the soil plus a few 4-point sparkles that fade in and out
  function drawCropSparkle(cx, cy, seed) {
    c.save();
    // two stacked translucent ellipses instead of a radial gradient: cheap enough for a 16x16 field that is all ripe
    c.fillStyle = 'rgba(255,236,140,.16)'; c.beginPath(); c.ellipse(cx, cy, 20, 10, 0, 0, 7); c.fill();
    c.fillStyle = 'rgba(255,236,140,.22)'; c.beginPath(); c.ellipse(cx, cy, 12, 6, 0, 0, 7); c.fill();
    for (let i = 0; i < 3; i++) {
      const ph = T * 2.4 + seed * 1.7 + i * 2.1, a = Math.max(0, Math.sin(ph)); if (a < .05) continue;
      const x = cx + [-13, 12, 2][i] + Math.sin(seed + i) * 3, y = cy - [26, 32, 44][i], r = 2.2 + a * 2.6;
      c.globalAlpha = a; c.fillStyle = '#fff8c8'; c.strokeStyle = 'rgba(230,170,30,.9)'; c.lineWidth = .7;
      c.beginPath(); c.moveTo(x, y - r * 1.6); c.quadraticCurveTo(x, y, x + r, y); c.quadraticCurveTo(x, y, x, y + r * 1.6); c.quadraticCurveTo(x, y, x - r, y); c.quadraticCurveTo(x, y, x, y - r * 1.6); c.closePath(); c.fill(); c.stroke();
    }
    c.restore();
  }
  function drawOneCrop(p) {
    const cx = ISO.wx(p.x + .5, p.y + .5), cy = ISO.wy(p.x + .5, p.y + .5);
    const cr = CROPS.find(x => x.id === p.crop); if (!cr) return;
    c.save();
    if (p.ready) drawCropSparkle(cx, cy + 2, p.x * 7 + p.y * 13);
    drawCropPlant(cr.id, p.ready ? 2 : (p.growed || 0) >= 1 ? 1 : 0, cx, cy + 2);
    if (!p.ready) { const day = S.clock ? S.clock.day : 0; if (p.wday !== day) { c.font = '11px sans-serif'; c.textAlign = 'center'; c.fillText('💧', cx + 12, cy - 24); } }
    c.restore();
    hits.push({ kind: 'fplot', p, x0: cx - 18, x1: cx + 18, y0: cy - (p.ready ? 40 : 32), y1: cy + 8 });
  }  // depth-sorted café props: tables (big, with chairs), the kitchen row (fridge, stove, counters,
  // espresso, shelf) and furniture (sofas, bookshelves, plants, lamps, an arcade/claw machine)
  function collectCafeItems() {
    if (!(S.cafe && S.cafe.built)) return [];
    const L = CAFE_LAYOUT(), out = [];
    const sel = App.cafeEdit ? cafeSel : null;
    const wrap = it => () => { if (sel != null && sel === it.id) { c.save(); c.globalAlpha = .6; drawCafeItem(it); c.restore(); } else drawCafeItem(it); };
    for (const tb of L.tables) out.push({ depth: tb.x + 2 + tb.y + 2 - 1.02, fn: wrap(Object.assign({}, tb, { i: tb.id })) });
    for (const it of L.kit.concat(L.deco, L.slots)) out.push({ depth: it.x + it.w + it.y + it.d - 1.02, fn: wrap(it) });
    // hired staff at their posts: cook by the stove, server by the register, play-mate inside the pen
    const cnt = {}, keepC = new Set();
    for (const m of (S.cafe.staff || [])) {
      if (m.role === 'cook' || m.role === 'server') continue; // v9.89: real walking actors (cafeStaffStep)
      const i = cnt[m.role] = (cnt[m.role] | 0) + 1;
      let tile, face;
      if (m.role === 'cashier') { const dk = L.kit.find(k => k.k === 'cashdesk'); if (!dk) continue; tile = [dk.x + Math.min(dk.w - 1, i - 1), dk.y - 1]; face = { x: dk.x + (i - 1), y: dk.y + 2, w: 1, d: 1 }; } // v9.91: behind the desk (north side), facing the guests
      else if (m.role === 'play') tile = [L.pen.x0 + Math.min(L.pen.x1 - L.pen.x0 - 1, i), L.pen.y0 + Math.min(L.pen.y1 - L.pen.y0 - 1, 1)];
      else { const base = L.kit.find(k => k.k === (m.role === 'cook' ? 'stove' : 'register') || (m.role !== 'cook' && k.k === 'counter')) || L.kit[0]; if (!base) continue; tile = [base.x + (i - 1) * 2, base.y + 1]; face = base; }
      let a = hospIn.get('c' + m.id); if (!a) { const lk = ART.randomHuman(m.seed); lk.hat = null; lk.top = 'jacket'; lk.jacket = m.role === 'cook' ? '#ffffff' : m.role === 'server' ? '#5a4a3a' : '#f5b342'; applyStaffArt(lk, m.seed, false); a = { id: 'cst' + m.id, type: 'hstaff', inFloor: true, x: tile[0] + .5, y: tile[1] + .5, path: [], dir: 1, face: 0, moving: false, speed: 2, t: Math.random() * 10, idle: 0, look: lk }; hospIn.set('c' + m.id, a); }
      if (m.role === 'play') { penPlay(a, L.pen); a.m = m; keepC.add('c' + m.id); if (a.hidden) continue; out.push({ depth: a.x + a.y, fn: () => { drawActor(a); drawPenPlay(a); } }); continue; }
      a.x = tile[0] + .5; a.y = tile[1] + .5; a.m = m; a.moving = false; a.t += 1 / 60; if (face) faceTo(a, face.x + face.w / 2, face.y + face.d / 2); keepC.add('c' + m.id);
      if (!a.hidden) out.push({ depth: a.x + a.y, fn: () => drawActor(a) });
    }
    for (const id of [...hospIn.keys()]) if (typeof id === 'string' && id[0] === 'c' && !keepC.has(id)) hospIn.delete(id);
    // low walls along the south and east sides (just outside the floor); the door is the only gap
    { const cp = CAFE_POS(), x1 = cp.x + cp.w, y1 = cp.y + cp.d, dr = [y1 - 2, y1 - 1];
      for (let i = 0; i < cp.w; i++) { if (i >= cp.w - 2) continue; /* v9.90: south door towards the pet shop */ const wq = { k: 'cwallS', x: cp.x + i, y: y1, w: i === cp.w - 1 ? 1.17 : 1.001, d: 1 }; out.push({ depth: wq.x + wq.y + .02, fn: () => drawCafeItem(wq) }); }
      for (let j = 0; j < cp.d; j++) { if (dr.includes(cp.y + j)) continue; const wq = { k: 'cwallE', x: x1, y: cp.y + j, w: 1, d: 1.001 }; out.push({ depth: wq.x + wq.y + .02, fn: () => drawCafeItem(wq) }); }
      for (const py of [y1 - 2 - .12, y1]) { const wq = { k: 'cpost', x: x1, y: py, w: 1, d: .12 }; out.push({ depth: wq.x + wq.y + .05, fn: () => drawCafeItem(wq) }); }
      { const wq = { k: 'cpost', x: x1 - 2 - .18, y: y1, w: .18, d: .12 }; out.push({ depth: wq.x + wq.y + .05, fn: () => drawCafeItem(wq) }); } }
    if (App.cafeEdit) out.push({ depth: 9999, fn: drawCafeEditOverlay });
    return out;
  }
  // edit mode: grid over the café floor, the pen's own grid, and a pulsing outline round the selected piece
  function drawCafeEditOverlay() {
    const L = CAFE_LAYOUT(), cp = CAFE_POS(), pt = (x, y) => [ISO.wx(x, y), ISO.wy(x, y)];
    c.save(); c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 1;
    for (let x = 0; x <= cp.w; x++) { const a = pt(cp.x + x, cp.y), b = pt(cp.x + x, cp.y + cp.d); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); }
    for (let y = 0; y <= cp.d; y++) { const a = pt(cp.x, cp.y + y), b = pt(cp.x + cp.w, cp.y + y); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); }
    const pn = L.pen; c.strokeStyle = 'rgba(120,200,90,.9)'; c.lineWidth = 2; { const q = [pt(pn.x0, pn.y0), pt(pn.x1, pn.y0), pt(pn.x1, pn.y1), pt(pn.x0, pn.y1)]; c.beginPath(); q.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); c.stroke(); }
    const it = cafeSel != null && cafeItemById(cafeSel);
    if (it) { const q = [pt(it.x, it.y), pt(it.x + it.w, it.y), pt(it.x + it.w, it.y + it.d), pt(it.x, it.y + it.d)]; c.strokeStyle = '#ff7ab8'; c.lineWidth = 2.6; c.setLineDash([6, 4]); c.beginPath(); q.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); c.stroke(); c.setLineDash([]); }
    c.restore();
  }
  function cafeItemById(id) { const L = CAFE_LAYOUT(); return L.tables.concat(L.deco, L.slots, L.equip, L.kit.filter(k => typeof k.id === 'number')).find(i => i.id === id) || null; }
  function cafeItemAt(gx, gy) { const L = CAFE_LAYOUT(); return L.tables.concat(L.deco, L.slots, L.equip, L.kit.filter(k => typeof k.id === 'number')).find(i => gx >= i.x && gx < i.x + i.w && gy >= i.y && gy < i.y + i.d) || null; }
  // a rotated piece is drawn in its original orientation and mirrored across the vertical axis through its corner (swapping x and y); text is un-mirrored
  function drawMirrored(it, fn) {
    const o = Object.assign({}, it, { w: it.d, d: it.w, r: 0, _m: 1 }), ox = ISO.wx(it.x, it.y), fT = c.fillText, sT = c.strokeText;
    c.save(); c.translate(ox, 0); c.scale(-1, 1); c.translate(-ox, 0);
    c.fillText = function (s, x, y, m) { c.save(); c.translate(x, y); c.scale(-1, 1); fT.call(c, s, 0, 0, m); c.restore(); };
    c.strokeText = function (s, x, y, m) { c.save(); c.translate(x, y); c.scale(-1, 1); sT.call(c, s, 0, 0, m); c.restore(); };
    try { fn(o); } finally { delete c.fillText; delete c.strokeText; c.restore(); }
  }
  function drawCafeItem(it) {
    if (it.r && !it._m) { drawMirrored(it, drawCafeItem); return; }
    const cpx = CAFE_POS().x, P3 = (lx, ly, z) => [ISO.wx(it.x + lx, it.y + ly), ISO.wy(it.x + lx, it.y + ly) - (z || 0)];
    const B = (lx, ly, w, d, h, col, z0, top) => cafeBox(it.x, it.y, lx, ly, w, d, h, col, z0 || 0, top ? { top } : undefined);
    const ell = (p, rx, ry, fill, stroke, lw) => { c.beginPath(); c.ellipse(p[0], p[1], rx, ry, 0, 0, 7); c.fillStyle = fill; c.fill(); if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw || 1; c.stroke(); } };
    const quad = (pts, col, stroke) => { c.beginPath(); pts.forEach((q, i) => i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); c.closePath(); c.fillStyle = col; c.fill(); if (stroke) { c.strokeStyle = stroke; c.lineWidth = 1; c.stroke(); } };
    const line = (a, b, col, lw) => { c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.strokeStyle = col; c.lineWidth = lw || 1; c.stroke(); };
    const emoji = (s, p, px) => { c.save(); c.font = (px || 16) + 'px sans-serif'; c.textAlign = 'center'; c.fillText(s, p[0], p[1]); c.restore(); };
    const hit = (kind, hh) => { const m = [ISO.wx(it.x + it.w / 2, it.y + it.d / 2), ISO.wy(it.x + it.w / 2, it.y + it.d / 2)], r = 20 * (it.w + it.d) / 2 + 6; hits.push({ kind, x0: m[0] - r, x1: m[0] + r, y0: m[1] - (hh || 70), y1: m[1] + 12 }); };
    c.save();
    switch (it.k) {
      case 'cwallS': { c.save(); c.globalAlpha = 0.1; B(0, 0, it.w, .16, 40, '#8fb5a2', 0, '#efe6d0'); c.restore(); break; }
      case 'cwallE': { c.save(); c.globalAlpha = 0.1; B(0, 0, .16, 1.001, 40, '#8fb5a2', 0, '#efe6d0'); c.restore(); break; }
      case 'cpost': { c.save(); c.globalAlpha = 0.35; B(0, 0, .18, .12, 46, '#8b6b4a', 0, '#b98757'); B(-.02, -.02, .22, .16, 4, '#c9776a', 46, '#e0958a'); c.restore(); break; }
      case 'cdoorE': {
        c.save(); c.globalAlpha = 0.25;
        quad([P3(0, 0, 2), P3(.55, -.25, 2), P3(.55, -.25, 42), P3(0, 0, 42)], 'rgba(200,235,255,.55)', '#8b6b4a');
        quad([P3(0, 2, 2), P3(.55, 2.25, 2), P3(.55, 2.25, 42), P3(0, 2, 42)], 'rgba(200,235,255,.55)', '#8b6b4a');
        c.restore(); break; }
      case 'cdoorS': {
        c.save(); c.globalAlpha = 0.25;
        quad([P3(0, 0, 2), P3(-.25, .55, 2), P3(-.25, .55, 42), P3(0, 0, 42)], 'rgba(200,235,255,.55)', '#8b6b4a');
        quad([P3(2, 0, 2), P3(2.25, .55, 2), P3(2.25, .55, 42), P3(2, 0, 42)], 'rgba(200,235,255,.55)', '#8b6b4a');
        c.restore(); break; }
      case 'table': {
        const cloth = ['#fff3d6', '#e6f2ea', '#fbe3e0'][it.i % 3], edge = ['#e2895a', '#7fae96', '#d9788a'][it.i % 3];
        B(-.06, .75, .46, .5, 13, '#b57a4a', 0, '#d9a374'); B(-.12, .75, .08, .5, 30, '#b57a4a');       // west chair, tucked in so the aisle stays clear
        B(1.6, .75, .46, .5, 13, '#b57a4a', 0, '#d9a374'); B(2.04, .75, .08, .5, 30, '#b57a4a');        // east chair
        B(.85, .85, .3, .3, 20, '#7a5637');
        const p = P3(1, 1, 24);
        ell([p[0], p[1] + 3], 42, 21, 'rgba(0,0,0,.18)');
        ell(p, 42, 21, edge, '#7a5637', 1.6); ell([p[0], p[1] - 1], 36, 17.5, cloth);
        ell(p, 20, 10, 'rgba(255,255,255,.55)', edge, 1);
        emoji(['🌷', '🕯️', '🌼'][it.i % 3], [p[0], p[1] - 3], 14);
        break; }
      case 'fridge': {
        B(.06, .06, .88, .88, 66, '#dbe7ee', 0, '#f3f8fb');
        line(P3(.94, .06, 34), P3(.94, .94, 34), 'rgba(90,110,125,.55)', 1.2);                          // door seam (east face)
        line(P3(.94, .82, 40), P3(.94, .82, 56), '#5a6b78', 2.4); line(P3(.94, .82, 12), P3(.94, .82, 26), '#5a6b78', 2.4);
        emoji('🧊', P3(.5, .5, 76), 14);
        hit('cafefridge', 84);
        break; }
      case 'stove': {
        B(.06, .06, .88, .88, 28, '#7f858c', 0, '#c7ccd2');
        for (const [bx, by] of [[.3, .3], [.7, .3], [.3, .7], [.7, .7]]) ell(P3(bx, by, 28), 6, 3, '#2f3439', '#111', .8);
        hit('cafestove', 56); // v9.92: no fake egg on the stove -- the pan only shows while the cook is actually cooking
        break; }
      case 'cashdesk': { // the cashier's desk by the door: guests pay here after their meal
        B(.02, .1, it.w - .04, .8, 32, '#b98757', 0, '#f6ead6'); B(.02, .1, it.w - .04, .1, 38, '#c9776a', 0);
        B(it.w * .5 - .25, .3, .5, .4, 10, '#4b5563', 32, '#6b7684'); emoji('💰', P3(it.w * .5, .5, 56), 13);
        { const lp = P3(it.w / 2, .95, 16); c.font = 'bold 10px sans-serif'; c.textAlign = 'center'; c.lineJoin = 'round'; c.lineWidth = 3.5; c.strokeStyle = 'rgba(60,30,20,.85)'; c.strokeText(t('cafe_cashdesk'), lp[0], lp[1]); c.fillStyle = '#fff'; c.fillText(t('cafe_cashdesk'), lp[0], lp[1]); }
        break; }
      case 'counter': case 'register': {
        B(.02, .1, it.w - .04, .8, 32, '#b98757', 0, '#f6ead6');
        for (let i = 1; i < it.w * 2; i++) line(P3(i / 2, .9, 4), P3(i / 2, .9, 28), 'rgba(90,60,30,.3)', 1);
        if ((it.x & 1) === 0) { B(.25, .3, .5, .45, 10, '#4b5563', 32, '#6b7684'); quad([P3(.5, .75, 34), P3(.72, .75, 34), P3(.72, .75, 40), P3(.5, .75, 40)], '#9fe0c9'); }
        else { // v9.92: the pass shows the dishes that are really cooked and waiting (was a cake that never went away)
          const rd = Object.entries((S.cafe && S.cafe.dishes) || {}).filter(([, n]) => n > 0).slice(0, 3);
          rd.forEach(([id], i) => { const ds = CAFE_DISHES.find(x => x.id === id); const m = P3(it.w / 2 + (i - (rd.length - 1) / 2) * .28, .5, 40); ell([m[0], m[1] + 2], 9, 4.5, '#fff', '#9bb', 1); emoji(ds ? ds.icon : '🍽️', [m[0], m[1] - 1], 12); }); }
        hit('cafecounter', 56);
        break; }
      case 'sink': {
        B(.02, .1, it.w - .04, .8, 32, '#b98757', 0, '#f6ead6');
        ell(P3(.5, .5, 33), 12, 6, '#8fa3b0', '#5a6b78', 1.2); ell(P3(.5, .5, 33), 9, 4.2, '#bfe3f2');
        line(P3(.5, .18, 34), P3(.5, .18, 50), '#9aa7ae', 2.4); line(P3(.5, .18, 50), P3(.5, .4, 50), '#9aa7ae', 2.4);
        emoji('💧', P3(.5, .4, 44 - ((T * 20) % 10)), 7);
        hit('cafestove', 56);
        break; }
      case 'espresso': {
        B(.06, .1, .88, .8, 30, '#8a6a4a', 0, '#e9d8bd');
        B(.2, .2, .6, .5, 20, '#7a8794', 30, '#a9b4bf');
        emoji('☕', P3(.5, .45, 62), 14);
        hit('cafecounter', 70);
        break; }
      case 'shelf': {
        B(.06, .2, .1, .6, 58, '#a97f55'); B(.84, .2, .1, .6, 58, '#a97f55');
        for (const z of [0, 20, 40, 56]) B(.06, .2, .88, .6, 3, '#c39a6c', z, '#dcb98f');
        const cols = ['#f26d6d', '#f7c948', '#6fcf97', '#b07cf0', '#ff9ec0'];
        for (const z of [3, 23, 43]) for (let i = 0; i < 4; i++) { const p = P3(.2 + i * .2, .5, z + 6); c.beginPath(); c.arc(p[0], p[1], 4.2, 0, 7); c.fillStyle = cols[(i + z) % 5]; c.fill(); c.strokeStyle = 'rgba(0,0,0,.2)'; c.lineWidth = .7; c.stroke(); }
        break; }
      case 'plant': {
        B(.25, .25, .5, .5, 15, '#c1633f', 0, '#d9825b');
        const g = ['#4f9a55', '#5fb066', '#3f8548'];
        [[.5, .5, 30, 12], [.38, .52, 24, 9], [.62, .5, 26, 9]].forEach(([lx, ly, z, r], i) => { const p = P3(lx, ly, z); c.beginPath(); c.arc(p[0], p[1], r, 0, 7); c.fillStyle = g[i]; c.fill(); c.strokeStyle = 'rgba(30,70,35,.5)'; c.lineWidth = 1; c.stroke(); });
        break; }
      case 'sofa': {
        const west = it.x === cpx, col = ['#8fb3c9', '#d9a0a0', '#a3c49a'][(it.y & 1) + (it.x & 1)];
        B(.08, .05, .84, it.d - .1, 15, col, 0, '#b9d3e2');
        if (west) B(.05, .05, .3, it.d - .1, 34, col, 0, '#9cbfd3'); else B(.65, .05, .3, it.d - .1, 34, col, 0, '#9cbfd3');
        for (let j = 0; j < it.d; j++) { const p = P3(west ? .6 : .38, j + .5, 19); ell(p, 9, 4.5, 'rgba(255,255,255,.35)'); }
        break; }
      case 'bookshelf': {
        B(.08, .05, .84, it.d - .1, 74, '#a97f55', 0, '#c39a6c');
        const cols = ['#c94a4a', '#3d7fc4', '#f7c948', '#4f9a55', '#9a5fd0', '#e2895a'];
        for (const z of [8, 30, 52]) for (let j = 0; j < it.d * 5; j++) { const a = P3(.92, .12 + j * .19, z), b = P3(.92, .12 + j * .19, z + 15 + (j % 3) * 2); line(a, b, cols[(j + z) % 6], 3.2); }
        for (const z of [4, 26, 48, 70]) line(P3(.92, .05, z), P3(.92, it.d - .05, z), '#7a5637', 1.6);
        break; }
      case 'lamp': {
        B(.42, .42, .16, .16, 58, '#5b4634');
        const p = P3(.5, .5, 66), g = c.createRadialGradient(p[0], p[1], 2, p[0], p[1], 36); g.addColorStop(0, 'rgba(255,226,150,.5)'); g.addColorStop(1, 'rgba(255,226,150,0)'); c.fillStyle = g; c.fillRect(p[0] - 36, p[1] - 36, 72, 72);
        ell(p, 13, 6, '#f7e3a1', '#c9a94e', 1.2); ell(P3(.5, .5, 58), 8, 3.5, '#8a6a3a');
        break; }
      case 'arcade': {
        B(.1, .1, .8, it.d - .2, 56, '#5b4b8a', 0, '#7b6bb0');
        quad([P3(.9, .28, 24), P3(.9, it.d - .28, 24), P3(.9, it.d - .28, 46), P3(.9, .28, 46)], '#bfe9ff', '#3a2f66');
        emoji('🧸', P3(.9, it.d / 2, 33), 15);
        quad([P3(.9, .28, 12), P3(.9, it.d - .28, 12), P3(.9, it.d - .28, 18), P3(.9, .28, 18)], '#f7c948');
        break; }
      case 'slot': { // slot machine: screen on the +y face (north wall) or the +x face (west wall)
        const south = it.f === 's', pz = (u, z) => south ? P3(u, .9, z) : P3(.9, u, z);
        const busy = (S.cafe.players || []).some(p => p.slot === it.i);
        B(.06, .06, .88, .88, 6, '#5a1a12', 0, '#7a2a20');
        B(.12, .12, .76, .76, 54, '#c0392b', 6, '#e25a48');
        quad([pz(.14, 46), pz(.86, 46), pz(.86, 58), pz(.14, 58)], '#ffd23a', '#a67c00');
        for (let i = 0; i < 5; i++) { const q = pz(.22 + i * .14, 52); ell(q, 2, 2, (Math.floor(T * (busy ? 8 : 1.5)) + i) % 2 ? '#fff6b0' : '#ff8a3d'); }
        quad([pz(.2, 26), pz(.8, 26), pz(.8, 42), pz(.2, 42)], '#0e1620', '#3a2a1a');
        const sy_ = ['🍒', '🔔', '🍋', '⭐', '💎'];
        for (let r = 0; r < 3; r++) { const q = pz(.31 + r * .19, 30); emoji(sy_[busy ? Math.floor(T * 9 + r * 2.3) % 5 : (it.i + r * 2) % 5], q, 10); }
        quad([pz(.3, 16), pz(.7, 16), pz(.7, 22), pz(.3, 22)], '#2f2f36'); ell(pz(.5, 12), 3, 2.4, '#ffd23a', '#a67c00', 1);
        { const lv = south ? [[.98, .5]] : [[.5, .98]]; const [lx, ly] = lv[0]; line(P3(lx, ly, 20), P3(lx, ly, 42), '#8a8a94', 2); ell(P3(lx, ly, 44 + (busy ? -Math.abs(Math.sin(T * 8)) * 10 : 0)), 3, 3, '#e63946', '#7a1f16', 1); }
        break; }
      case 'aquarium': {
        B(.1, .05, .8, it.d - .1, 16, '#7a5637', 0, '#a97f55');
        B(.14, .1, .72, it.d - .2, 44, '#7fc6e4', 16, '#b6e6f5');
        quad([P3(.86, .12, 18), P3(.86, it.d - .12, 18), P3(.86, it.d - .12, 58), P3(.86, .12, 58)], 'rgba(150,215,240,.85)', '#3a6a8a');
        line(P3(.86, .12, 22), P3(.86, it.d - .12, 22), '#e8d7a8', 3);
        ['🐠', '🐟', '🐡'].forEach((f, i) => { const u = .3 + ((T * .12 + i * .37) % 1) * (it.d - .6); emoji(f, P3(.87, u, 34 + i * 7 + Math.sin(T * 2 + i) * 2), 11); });
        for (let i = 0; i < 3; i++) { const k = (T * .5 + i / 3) % 1; ell(P3(.87, .3 + i * .5, 22 + k * 30), 1.6, 1.6, 'rgba(255,255,255,.25)', 'rgba(255,255,255,.8)', .8); }
        emoji('🌿', P3(.87, .3, 22), 12);
        break; }
      case 'jukebox': {
        B(.15, .15, .7, .7, 50, '#8e44ad', 0, '#b06fd0');
        ell(P3(.5, .5, 50), 22, 10, '#8e44ad', '#5b2a70', 1.2);
        quad([P3(.85, .22, 20), P3(.85, .78, 20), P3(.85, .78, 46), P3(.85, .22, 46)], '#ffe680', '#5b2a70');
        ell(P3(.85, .5, 34), 9, 9, '#3a2f66', '#f7c948', 1.4);
        c.save(); c.font = '11px sans-serif'; c.fillStyle = '#5b2a70'; for (let i = 0; i < 2; i++) { const k = (T * .7 + i / 2) % 1; c.globalAlpha = 1 - k; c.fillText(i ? '♪' : '♫', P3(.9, .5, 56 + k * 26)[0] + (i ? 8 : -8), P3(.9, .5, 56 + k * 26)[1]); } c.restore();
        break; }
      case 'photobooth': {
        B(.05, .05, .9, it.d - .1, 84, '#e8a0b8', 0, '#f5c2d2');
        quad([P3(.95, .25, 4), P3(.95, it.d - .25, 4), P3(.95, it.d - .25, 62), P3(.95, .25, 62)], '#b8434f', '#7a2a33');
        line(P3(.96, it.d / 2, 4), P3(.96, it.d / 2, 62), '#7a2a33', 1.5);
        emoji('📸', P3(.95, it.d / 2, 74), 15);
        quad([P3(.95, .15, 84), P3(.95, it.d - .15, 84), P3(.95, it.d - .15, 92), P3(.95, .15, 92)], '#fff7ea', '#7a2a33');
        break; }
      case 'fountain': {
        B(.08, .08, .84, .84, 10, '#cfd8dc', 0, '#e6ecef');
        ell(P3(.5, .5, 10), 24, 11, '#7fc6e4', '#9aa7ad', 1.2);
        B(.42, .42, .16, .16, 30, '#cfd8dc', 10, '#e6ecef');
        for (let i = 0; i < 5; i++) { const k = (T * .8 + i / 5) % 1, ang = i * 1.26; ell(P3(.5 + Math.cos(ang) * k * .3, .5 + Math.sin(ang) * k * .3, 40 - Math.pow(k * 1.6 - .8, 2) * 40 + 8), 2, 2.4, 'rgba(160,220,250,.9)'); }
        break; }
      case 'towertree': {
        B(.4, .4, .2, .2, 84, '#c9a27a', 0, '#dcb98f');
        B(.08, .08, .84, .84, 6, '#a37e57', 0, '#b98f66');
        for (const z of [24, 46, 68]) B(.1, .1, .8, .8, 4, '#e8d7b8', z, '#f3e6cc');
        B(.15, .15, .7, .7, 16, '#d99a6b', 84, '#e8b48a');
        for (let z = 8; z < 84; z += 6) line(P3(.4, .4, z), P3(.6, .4, z), 'rgba(120,90,50,.5)', 1);
        emoji(Math.sin(T * .5 + it.x) > 0 ? '🐈' : '😺', P3(.5, .5, 108 + Math.sin(T * 2) * 1), 15);
        break; }
    }
    c.restore();
  }
  function collectHome() {
    const L = LAY('home');
    if (!L || L.x >= 90000) return [];
    const hp = FURN.HOME_POS(W(), H(), (S.home && S.home.lv) || 1);
    const cx = hp.x + hp.w / 2, cy = hp.y + hp.d / 2;
    const hlv = (S.home && S.home.lv) || 1;
    return [
      { depth: L.x + L.y + 0.1, fn: () => { c.save(); FURN.homeGround && FURN.homeGround(c, W(), H(), hlv, CFG.name); c.restore(); } },
      { depth: cx + cy + 1.8, fn: drawHomeDynamic },
      { depth: L.x + 9.5 + L.y + 7.5 + 0.1, fn: () => { c.save(); FURN.homeFenceFront && FURN.homeFenceFront(c, W(), H(), hlv, CFG.name); c.restore(); } }
    ];
  }
  function drawHomeDynamic() {
    c.save();
    FURN.homeFront(c, W(), H(), (S.home && S.home.lv) || 1, CFG.name);
    c.restore();
  }
  // the abandoned-pet SOS box turns up somewhere random in the village (not at the shop door any more):
  // any open grass tile clear of the shop, road, farm, house, stores, café and the hospital lot
  let _strayKey = '', _strayTiles = [];
  function strayTiles() {
    const w = W(), h = H(), hl = (S.home && S.home.lv) || 1, cl = (S.cafe && S.cafe.lv) || 1, rlen = (S.town && S.town.roads && S.town.roads.length) || 0, key = [w, h, hl, cl, rlen, S.cafe && S.cafe.built, S.hosp && S.hosp.lv].join('|');
    if (key === _strayKey) return _strayTiles;
    const out = [];
    // Prefer paved road tiles that are strictly outdoors and away from shop walls & buildings
    if (typeof TOWN !== 'undefined' && TOWN.roadSet) {
      for (const rk of TOWN.roadSet(S)) {
        const [rx, ry] = rk.split(',').map(Number);
        if (rx >= -2 && rx <= w + 1 && ry >= -2 && ry <= h + 1) continue;
        if (TOWN.inBig && TOWN.inBig(rx, ry)) continue;
        if (walk(rx, ry)) out.push({ x: rx, y: ry });
      }
    }
    // Also include main street sidewalk tiles outside shop perimeter
    for (let y = 0; y <= h + 6; y++) {
      for (const x of [w + 2, w + 7]) {
        if (walk(x, y)) out.push({ x, y });
      }
    }
    if (!out.length) {
      for (let x = -12; x <= w + 12; x++) for (let y = -10; y <= h + 12; y++) {
        if (x >= -2 && x <= w + 1 && y >= -2 && y <= h + 1) continue;
        if (walk(x, y)) out.push({ x, y });
      }
    }
    _strayKey = key; _strayTiles = out; return out;
  }
  function strayPos(st) {
    const tl = strayTiles(); if (!tl.length) return { x: W() + 12, y: H() + 8 };
    const id = String((st && st.id) != null ? st.id : 0); let hsh = 2166136261; for (let i = 0; i < id.length; i++) hsh = Math.imul(hsh ^ id.charCodeAt(i), 16777619);
    hsh = Math.imul(hsh ^ (hsh >>> 15), 2246822507) >>> 0; return tl[hsh % tl.length];
  }
  // the SOS box can be anywhere in the (big) village -- when it's off-screen, a bouncing arrow at the edge points to it
  function drawStrayArrow() {
    const st = S.stray; if (!st || App.scene !== 'shop') return;
    const p = strayPos(st), sx = (ISO.wx(p.x + .5, p.y + .5) - cam.x) * cam.z + vw / 2, sy = (ISO.wy(p.x + .5, p.y + .5) - 20 - cam.y) * cam.z + vh / 2, m = 46;
    if (sx > m && sx < vw - m && sy > m + 60 && sy < vh - m - 70) return;
    const cx = vw / 2, cy = vh / 2, dx = sx - cx, dy = sy - cy, k = Math.min((vw / 2 - m) / Math.max(1, Math.abs(dx)), (vh / 2 - m - 40) / Math.max(1, Math.abs(dy)));
    const ax = cx + dx * k, ay = cy + dy * k, ang = Math.atan2(dy, dx), bob = Math.sin(T * 5) * 3;
    c.save(); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.translate(ax + Math.cos(ang) * bob, ay + Math.sin(ang) * bob);
    c.rotate(ang); c.beginPath(); c.moveTo(34, 0); c.lineTo(20, -11); c.lineTo(20, 11); c.closePath(); c.fillStyle = '#e0604e'; c.fill(); c.lineWidth = 2; c.strokeStyle = '#fff'; c.stroke(); c.rotate(-ang);
    ART.ell(c, 0, 0, 18, 18, '#fff7e8', '#e0604e', 2.4); c.font = '20px sans-serif'; c.textAlign = 'center'; c.fillStyle = '#000'; c.fillText('📦', 0, 7);
    c.font = 'bold 9px sans-serif'; c.fillStyle = '#e0604e'; c.fillText('SOS', 0, 26); c.restore();
  }
  function collectStray() {
    const st = S.stray; if (!st) return [];
    const p = strayPos(st), gx = p.x, gy = p.y;
    return [{ depth: gx + gy + .98, fn: () => drawOneStray(st, gx, gy) }];
  }
  function drawOneStray(st, gx, gy) {
    const sx = ISO.wx(gx + .5, gy + .5), sy = ISO.wy(gx + .5, gy + .5);
    c.save(); c.translate(sx - ISO.sx(.5, .5), sy - ISO.sy(.5, .5));
    FURN.box(c, .15, .15, .7, .7, 16, '#c9a27a', 0, { top: '#8a6a4a' });
    c.restore();
    c.save(); c.translate(sx, sy - 14 + Math.sin(T * 3) * 1.5); c.scale(.5, .5); ART.pet(c, st.sp, { t: T, sleep: Math.sin(T) > .6, mood: 'sad', seed: 77 }); c.restore();
    c.save(); c.font = 'bold 11px sans-serif'; c.fillStyle = '#fff'; c.strokeStyle = 'rgba(0,0,0,.5)'; c.lineWidth = 3; c.strokeText('SOS', sx - 11, sy - 46); c.fillText('SOS', sx - 11, sy - 46); c.restore();
    hits.push({ kind: 'stray', st, x0: sx - 26, x1: sx + 26, y0: sy - 60, y1: sy + 10 });
  }
  // ---------- input ----------
  const ptrs = new Map(); let drag = null, pinch = null;
  // v1.10: press on the thing being placed/moved and drag it with the finger (town buildings, shop furniture, café/hospital furniture)
  let gdrag = null, editDrag = null;
  let cvRect = null;
  const getCvRect = () => cvRect || (cvRect = cv.getBoundingClientRect());
  const gridAt = e => { const r = getCvRect(), g = toGrid(e.clientX - r.left, e.clientY - r.top); return { gx: Math.floor(g.x), gy: Math.floor(g.y) }; };
  const nearBox = (gx, gy, x, y, w, d) => gx >= x - 3 && gx <= x + w && gy >= y - 3 && gy <= y + d; // generous: tall things are touched above their footprint
  function grabAt(e) {
    const { gx, gy } = gridAt(e);
    if (App.tplace && typeof TOWN !== 'undefined') { const p = App.tplace, f = TOWN.fpOf(p.k, p.r); if (p.x != null && nearBox(gx, gy, p.x, p.y, f.w, f.d)) return { m: 't', ox: p.x - gx, oy: p.y - gy, lx: p.x, ly: p.y }; return null; }
    if (App.troad) return null;
    if (App.hospEdit || App.cafeEdit) { const H = !!App.hospEdit, sel = H ? hospSel : cafeSel; let it = sel != null ? (H ? hospItemById(sel) : cafeItemById(sel)) : null;
      if (!(it && nearBox(gx, gy, it.x, it.y, it.w || 1, it.d || 1))) it = H ? hospItemAt(gx, gy) : cafeItemAt(gx, gy);
      return it ? { m: 'tap', id: it.id, H } : null; }
    if (App.editing) {
      let it = typeof editSel === 'number' ? S.items.find(i => i.id === editSel) : null;
      if (it) { const d = FURN.fp(it); if (!nearBox(gx, gy, it.x, it.y, d.w, d.d)) it = null; }
      if (!it && typeof editSel !== 'string') { const f = itemAt(gx, gy); if (f && !(FURN.DEF[f.k] || {}).flat) it = f; }
      if (!it) return null;
      return { m: 'e', id: it.id, ox: it.x - gx, oy: it.y - gy, x0: it.x, y0: it.y };
    }
    return null;
  }
  function onDown(e) {
    cv.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ptrs.size === 1) { drag = { x: e.clientX, y: e.clientY, cx: cam.x, cy: cam.y, moved: false }; gdrag = null; try { const g = grabAt(e); if (g) { g.sx = e.clientX; g.sy = e.clientY; g.on = false; gdrag = g; } } catch (er) { gdrag = null; } }
    if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), z: cam.z }; drag = null; gdrag = null; editDrag = null; }
  }
  function gdragMove(e) {
    const g = gdrag; if (!g.on) { if (Math.hypot(e.clientX - g.sx, e.clientY - g.sy) < 8) return; g.on = true; if (drag) drag.moved = true; if (g.m === 'e' && editSel !== g.id) { editSel = g.id; typeof render === 'function' && render(); } if (g.m === 'tap') { if (g.H) hospSel = g.id; else cafeSel = g.id; typeof render === 'function' && render(); } }
    if (g.m === 'tap') return;
    const { gx, gy } = gridAt(e), nx = gx + g.ox, ny = gy + g.oy;
    if (g.m === 't') { const p = App.tplace; if (!p) { gdrag = null; return; } if (p.x !== nx || p.y !== ny) { p.x = nx; p.y = ny; typeof render === 'function' && render(); } }
    if (g.m === 'e') editDrag = { id: g.id, x: nx, y: ny };
  }
  function gdragUp(e) {
    const g = gdrag; gdrag = null;
    if (g.m === 'tap') { const r = cv.getBoundingClientRect(); tap(e.clientX - r.left, e.clientY - r.top); return; }
    if (g.m === 'e') { const d = editDrag; editDrag = null; if (d && (d.x !== g.x0 || d.y !== g.y0)) onTap && onTap({ kind: 'editdrop', id: d.id, x: d.x, y: d.y }); else typeof render === 'function' && render(); }
  }
  function onMove(e) {
    if (!ptrs.has(e.pointerId)) return; ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch && ptrs.size === 2) { const [a, b] = [...ptrs.values()]; cam.z = Math.max(.2, Math.min(1.6, pinch.z * Math.hypot(a.x - b.x, a.y - b.y) / pinch.d)); return; }
    if (gdrag && ptrs.size === 1) { gdragMove(e); return; }
    if (drag) {
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (Math.hypot(dx, dy) > 10) { drag.moved = true; cam.follow = false; }
      if (drag.moved) { cam.x = drag.cx - dx / cam.z; cam.y = drag.cy - dy / cam.z; }
    }
  }
  function onUp(e) {
    ptrs.delete(e.pointerId);
    if (ptrs.size < 2) pinch = null;
    if (gdrag && gdrag.on && ptrs.size === 0) { try { gdragUp(e); } catch (er) { gdrag = null; editDrag = null; } drag = null; return; }
    if (ptrs.size === 0) { gdrag = null; editDrag = null; }
    if (drag && !drag.moved && ptrs.size === 0) { const r = getCvRect(); tap(e.clientX - r.left, e.clientY - r.top); }
    if (ptrs.size === 0) { drag = null; cvRect = null; }
  }
  function tap(x, y) {
    const wx = (x - vw / 2) / cam.z + cam.x, wy = (y - vh / 2) / cam.z + cam.y;
    const g = toGrid(x, y);
    const gx = Math.floor(g.x), gy = Math.floor(g.y);
    const inb = h => wx >= h.x0 && wx <= h.x1 && wy >= h.y0 && wy <= h.y1;
    const foot = itemAt(gx, gy);
    if (App.tplace) { onTap && onTap({ kind: 'tplace', gx, gy }); return; }
    if (App.troad) { onTap && onTap({ kind: 'troad', gx, gy }); return; } // PET TOWN v1.6: road tool // PET TOWN: choosing where to build
    if (App.hospEdit) { onTap && onTap({ kind: 'hospedit', gx, gy, it: hospItemAt(gx, gy) }); return; }
    if (App.cafeEdit) { onTap && onTap({ kind: 'cafeedit', gx, gy, it: cafeItemAt(gx, gy) }); return; }
    if (App.editing) { onTap && onTap({ kind: 'edit', gx, gy, foot, hit: hits.find(h => h.kind === 'pet' && inb(h)) || hits.find(h => h.kind === 'item' && inb(h)) }); return; }
    let h = null;
    if (App.carry) { // while holding a pet, houses win over everything else
      if (foot && foot.k === 'hab') h = { kind: 'item', item: foot };
      else h = hits.find(q => q.kind === 'item' && q.item.k === 'hab' && inb(q));
    }
    if (!h) h = hits.find(h => h.kind !== 'item' && inb(h)) || (foot && !(FURN.DEF[foot.k] && FURN.DEF[foot.k].flat) ? { kind: 'item', item: foot } : null) || hits.find(h => h.kind === 'item' && inb(h));
    if (!h && typeof TRAIN !== 'undefined') {
      const tsx = typeof TRAIN.STAT_X === 'function' ? TRAIN.STAT_X() : 18;
      const tsy = typeof TRAIN.STAT_Y === 'function' ? TRAIN.STAT_Y() : -4.2;
      if (gx >= tsx - 5 && gx <= tsx + 7 && gy >= tsy - 5 && gy <= tsy + 7) {
        h = { kind: 'train' };
      }
    }
    // v2026-10-08: "집/사람 클릭할때 화면이 내 캐릭터쪽으로 이동하는게 안그랬으면 좋겠어" --
    // 정보창만 띄우는 탭(집/마을주민 등)은 카메라를 플레이어 쪽으로 되돌리지 않음.
    // 실제로 캐릭터가 걸어가는 탭(펫, 매대, 표지판 등)만 walkNear/goTo 쪽에서 follow를 켬.
    if (h) { onTap && onTap(h); return; }
    if (inFarm(gx, gy, W(), H())) { onTap && onTap({ kind: 'fgrid', gx, gy }); return; }
    if (walk(gx, gy, true)) { cam.follow = true; goTo(me, gx, gy); tapMark(x, y); }
  }
  function itemAt(gx, gy) {
    let best = null;
    for (const it of S.items) { const d = FURN.fp(it); if (gx >= it.x && gx < it.x + d.w && gy >= it.y && gy < it.y + d.d) { if (!best || (FURN.DEF[best.k] || {}).flat) best = it; } }
    return best;
  }
  function originFor(k, gx, gy) { // world origin so the item's on-screen corner sits on the tapped tile in any view
    const d = typeof k === 'object' ? FURN.fp(k) : (FURN.DEF[k] || { w: 1, d: 1 }); if (!VIEW.r) return [gx, gy];
    const tv = VIEW.rect(gx, gy, 1, 1);
    for (let dx = -4; dx <= 4; dx++) for (let dy = -4; dy <= 4; dy++) { const r = VIEW.rect(gx + dx, gy + dy, d.w, d.d); if (Math.abs(r.x - tv.x) < .01 && Math.abs(r.y - tv.y) < .01) return [gx + dx, gy + dy]; }
    return [gx, gy];
  }
  function tapMark(x, y) { const d = document.createElement('div'); d.className = 'tapmark'; d.style.left = x + 'px'; d.style.top = y + 'px'; document.body.appendChild(d); setTimeout(() => d.remove(), 500); }

  function walkNear(tx, ty, cb) {
    // walk to a free tile adjacent to (tx,ty)
    // (used to also demand p be inside the shop, which made every outdoor target -- café sign,
    // stove, farm tiles -- "have no free neighbour" and fire its callback without ever walking there)
    cam.follow = true; // the player is about to actually walk here, so re-engage camera follow
    const tIn = tx >= 0 && ty >= 0 && tx < W() && ty < H();
    const cand = [[1, 0], [0, 1], [-1, 0], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]].map(([dx, dy]) => ({ x: tx + dx, y: ty + dy })).filter(p => walk(p.x, p.y, true) && (!tIn || (p.x >= 0 && p.y >= 0 && p.x < W() && p.y < H())));
    cand.sort((a, b) => Math.hypot(a.x - me.x, a.y - me.y) - Math.hypot(b.x - me.x, b.y - me.y));
    const t = cand[0];
    if (!t) { cb && cb(); return; }
    goTo(me, t.x, t.y, () => { const dxs = (tx - ty) - (me.x - me.y); if (Math.abs(dxs) > .05) me.dir = dxs > 0 ? 1 : -1; me.face = (tx + ty) < (me.x + me.y) - .3 ? 1 : 0; cb && cb(); });
  }
  function storeFront(k) { return { x: Math.floor(STALL_POS().x + 1.5), y: Math.floor(FURN.STORE_Y[k] + 3.5) }; } // the stall faces south: customers stand in front of the counter
  function nearStore(k) { if (!me) return false; const f = storeFront(k); return Math.hypot(me.x - f.x, me.y - f.y) < 2.3; }
  function goStore(k, cb) { const f = storeFront(k); if (nearStore(k)) { cb && cb(); return; } goTo(me, f.x, f.y, () => { me.dir = 1; me.face = 1; cb && cb(); }); cam.follow = true; }
  function screenOf(a) { return toScreen(a.x, a.y, 30); }
  function petActor(pid) { return actors.get('p' + pid); }

  function init(canvas, tapCb) {
    cv = canvas; c = cv.getContext('2d'); onTap = tapCb;
    resize(); addEventListener('resize', resize);
    cv.addEventListener('pointerdown', onDown); cv.addEventListener('pointermove', onMove);
    cv.addEventListener('pointerup', onUp); cv.addEventListener('pointercancel', onUp);
    cv.addEventListener('wheel', e => { cam.z = Math.max(.2, Math.min(1.6, cam.z * (e.deltaY > 0 ? .9 : 1.1))); e.preventDefault(); }, { passive: false });
    requestAnimationFrame(frame);
  }
  function reset() { actors.clear(); me = null; bgKey = ''; occKey = ''; }
  function center() { cam.follow = true; }
  // where the player / staff stands to serve a patient: beside the reception desk, or beside the room's equipment
  function hospPerf(pid) {
    const p = ((S.hosp || {}).patients || []).find(q => q.id === pid); if (!p) return null; const L = HOSP_LAYOUT();
    if (p.ph === 'deskwait' || p.ph === 'deskserve') return { x: L.reception.px, y: L.reception.py, fx: L.reception.x + 1, fy: L.reception.y };
    const st = L.stations.find(z => String(z.id) === p.stn); return st ? { x: st.px != null ? st.px : st.sx, y: st.py != null ? st.py : st.sy, fx: st.x + st.w / 2, fy: st.y + st.d / 2 } : null;
  }
  function focusHosp() { const R = HOSP_POS(); cam.follow = false; cam.x = ISO.wx(R.x + R.w / 2, R.y + R.d / 2 + 1); cam.y = ISO.wy(R.x + R.w / 2, R.y + R.d / 2 + 1); cam.z = Math.max(W() > 20 ? .2 : W() > 14 ? .3 : .55, Math.min(1, vw / ((R.w + R.d) * 36))); }
  function focusFarm() { const fp = FARM_POS(W(), H()); cam.follow = false; cam.x = ISO.wx(fp.x + fp.w / 2, fp.y + fp.d / 2); cam.y = ISO.wy(fp.x + fp.w / 2, fp.y + fp.d / 2); cam.z = Math.max(.3, Math.min(1, vw / ((fp.w + fp.d) * 36))); }
  function focusCafe() { const cp = CAFE_POS(); cam.follow = false; cam.x = ISO.wx(cp.x + cp.w / 2, cp.y + cp.d / 2 + 1); cam.y = ISO.wy(cp.x + cp.w / 2, cp.y + cp.d / 2 + 1); cam.z = Math.max(W() > 20 ? .2 : W() > 14 ? .3 : .55, Math.min(1, vw / ((cp.w + cp.d) * 36))); }
  function focusTrain() { const Wd = W(); const sx = (typeof TRAIN !== 'undefined' && typeof TRAIN.STAT_X === 'function') ? TRAIN.STAT_X() : Wd + 9.2; const sy = (typeof TRAIN !== 'undefined' && typeof TRAIN.STAT_Y === 'function') ? TRAIN.STAT_Y() : 2; cam.follow = false; cam.x = ISO.wx(sx + 1.5, sy + 4.3); cam.y = ISO.wy(sx + 1.5, sy + 4.3); cam.z = Math.max(.35, Math.min(.8, vw / 860)); }
  function focusZoo(dx, dy, z) { const zObj = (TOWN.objs() || []).find(o => o.k === 'zoo'); if (!zObj) return; cam.follow = false; const tx = zObj.x + (dx != null ? dx : 13), ty = zObj.y + (dy != null ? dy : 11); cam.x = ISO.wx(tx, ty); cam.y = ISO.wy(tx, ty); cam.z = z || Math.max(.38, Math.min(.85, vw / 860)); }
  function rotate(k) { VIEW.W = W(); VIEW.H = H(); VIEW.r = ((VIEW.r + k) % 4 + 4) % 4; if (me) { cam.x = ISO.wx(me.x, me.y); cam.y = ISO.wy(me.x, me.y) - 30; } cam.follow = true; }
  // Internal Performance Monitor for benchmarking & optimization reporting (clean UI, no onscreen clutter)
  const PERF_TRACKER = (() => {
    let frameTimes = [];
    let culledCount = 0, renderedCount = 0;
    return {
      recordFrame(dt, rendered, culled) {
        frameTimes.push(dt);
        if (frameTimes.length > 300) frameTimes.shift();
        renderedCount = rendered || 0;
        culledCount = culled || 0;
      },
      getReport() {
        if (!frameTimes.length) return { fps: 60, frameTimeMs: 16.6, rendered: renderedCount, culled: culledCount };
        const sum = frameTimes.reduce((a, b) => a + b, 0);
        const avgDt = sum / frameTimes.length;
        const fps = Math.round(1 / Math.max(0.001, avgDt));
        const sorted = [...frameTimes].sort((a, b) => b - a);
        const p99Dt = sorted[Math.floor(sorted.length * 0.01)] || avgDt;
        return {
          avgFps: Math.min(60, fps),
          avgFrameTimeMs: +(avgDt * 1000).toFixed(2),
          p99FrameTimeMs: +(p99Dt * 1000).toFixed(2),
          renderedObjects: renderedCount,
          culledObjects: culledCount,
          cullRatio: +(culledCount / Math.max(1, renderedCount + culledCount) * 100).toFixed(1) + '%'
        };
      }
    };
  })();
  if (typeof window !== 'undefined') window.__PET_TOWN_PERF = PERF_TRACKER;

  // v2026-10-10: "집에서 나오자마자 너무 오래 기다렸어요" 버그 수정용 -- 손님이 생성될 때 미리 얺어주는
  // "집→상점 걸어오는 시간" 인내심 보너스가 직선 거리(까마귀가 나는 거리)로 계산되어 있었음. 실제로는
  // 길을 따라 돌아가야 해서, 집이 멀리 돌아가야 하는 위치면 보너스가 실제로 걸리는 시간보다 훨씬 적게
  // 책정되어 도착하기도 전에 인내심이 바닥남. 실제 길찾기 경로 길이를 반환해서 그 값으로 보너스를 주도록 함.
  // 길을 못 찾으면(아직 도로가 안 이어진 집 등) 직선 거리로 안전하게 대체.
  function pathDist(x0, y0, x1, y1) {
    // v2026-10-10: "가게 안에서 길이 끊겼다는 메시지가 뜬다 / 멀쩡한데 멈춰 선다" 버그의 진짜 원인 --
    // 손님이 집에서 스폰될 때(spawnCustomer)는 World.sync()(= 매 프레임 가게 가구 점유 칸 occ를 다시
    // 계산하는 곳)가 그 프레임에 아직 한 번도 실행되지 않았을 수 있음(특히 실내 상점 화면에 머무는
    // 동안엔 바깥 월드 렌더링이 돌지 않아 World.sync가 안 불림). 그 상태에서 pathDist가 findPath→walk를
    // 부르면 occ가 아직 null이라 "Cannot read properties of null (reading 'has')"로 매번 튕겨져 나갔고,
    // 그 예외 때문에 그 프레임의 나머지 로직(주민 산책 로직 등)까지 통째로 중단되어 여러 이상 증상으로
    // 이어졌음. occ를 쓰기 전에 직접 한 번 보장해서 고침.
    buildOcc();
    const p = findPath(x0, y0, x1, y1, false);
    if (!p || !p.length) return Math.hypot(x1 - x0, y1 - y0);
    let d = Math.hypot(p[0].x - x0, p[0].y - y0);
    for (let i = 1; i < p.length; i++) d += Math.hypot(p[i].x - p[i - 1].x, p[i].y - p[i - 1].y);
    d += Math.hypot(x1 - p[p.length - 1].x, y1 - p[p.length - 1].y);
    return d;
  }

  return { originFor, itemAt, rotate, goDrop, nearStore, goStore, init, reset, walkNear, goTo, walk, strayPos, screenOf, petActor, markSold, markLeft, goCounter, trick, setPartners, joy, cam, center, farmAction, focusCafe, focusFarm, focusTrain, focusZoo,
    toGrid, broom: sec => { if (me) me.broomUntil = T + (sec || 1.1); }, get me() { return me; }, set editSel(v) { editSel = v; }, set cafeSel(v) { cafeSel = v; }, set hospSel(v) { hospSel = v; }, get hospSel() { return hospSel; }, hospItemById, focusHosp, hospPerf, get cafeSel() { return cafeSel; }, cafeItemById, get editSel() { return editSel; }, toScreen, actors, buildOccNow: () => { occKey = ''; buildOcc(); }, pathDist };
})();
