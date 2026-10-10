// ================= v9.97: village decorations — cherry avenue, lake & bridge, notice board, couple monument =================
// Each big one is a lot with a signpost first (tap it to build), like the park. The notice board is small and always there.
// State: S.village = { avenue, lake, monu, monuText, monuLooks, board: { day, weather, news, reqs } }
const VILLAGE_COST = { avenue: 300000, lake: 800000, monu: 500000 };
const VILLAGE = (() => {
  const Wd = () => (typeof S !== 'undefined' && S && S.room && S.room.w) || 8, Hd = () => (typeof S !== 'undefined' && S && S.room && S.room.h) || 8;
  const V = () => (S.village = S.village || {});
  const built = k => !!(typeof S !== 'undefined' && S && S.village && S.village[k]);
  const LAKE = () => { const L = LAY('lake'); return L ? { x: L.x, y: L.y, w: 18, d: 16 } : { x: LAY_FAR, y: LAY_FAR, w: 18, d: 16 }; }; // PET TOWN: wherever the player built them
  const MONU = () => { const L = LAY('monu'); return L ? { x: L.x, y: L.y, w: 7, d: 7 } : { x: LAY_FAR, y: LAY_FAR, w: 7, d: 7 }; };
  const BOARD = () => ({ x: Wd(), y: Hd() + 3 }); // PET TOWN: right by the sidewalk, just south of the shop
  const SIGN = { avenue: () => ({ x: Wd() + 8, y: 2 }), lake: () => { const p = LAKE(); return { x: p.x + 1, y: p.y + Math.floor(p.d / 2) }; }, monu: () => { const p = MONU(); return { x: p.x + p.w - 1, y: p.y + Math.floor(p.d / 2) }; } };
  const season = day => Math.floor((((day || 1) - 1) % 28 + 28) % 28 / 7); // 0 spring, 1 summer, 2 autumn, 3 winter (a week each)
  const Q = (x, y, z) => [ISO.wx(x, y), ISO.wy(x, y) - (z || 0)];
  const quad = (c, pts, col, st, lw) => { c.beginPath(); pts.forEach((q, i) => i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); c.closePath(); if (col) { c.fillStyle = col; c.fill(); } if (st) { c.lineWidth = lw || 1; c.strokeStyle = st; c.stroke(); } };
  const rect = (c, x0, y0, x1, y1, col, st, z) => quad(c, [Q(x0, y0, z), Q(x1, y0, z), Q(x1, y1, z), Q(x0, y1, z)], col, st);
  function gEll(c, cx, cy, ru, rv, col, st, lw) { c.beginPath(); for (let i = 0; i <= 40; i++) { const a = i / 40 * Math.PI * 2, q = Q(cx + Math.cos(a) * ru, cy + Math.sin(a) * rv); i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]); } c.closePath(); if (col) { c.fillStyle = col; c.fill(); } if (st) { c.lineWidth = lw || 1; c.strokeStyle = st; c.stroke(); } }
  const at = (c, x, y, fn) => { c.save(); c.translate(ISO.wx(x, y), ISO.wy(x, y)); fn(); c.restore(); };
  const emo = (c, e, x, y, s) => { c.font = (s || 12) + 'px sans-serif'; c.textAlign = 'center'; c.fillText(e, x, y); c.textAlign = 'start'; };
  const lampOn = () => S.clock && (S.clock.m >= 1080 || S.clock.m < 360);

  // ---------------- lake layout (lot-local tiles) ----------------
  // v2026-10-09: "길과 호수 사이에 빈 간격" 수정으로 lakeGround()의 그림 크기/위치 공식이
  // 바뀌면서, 그림 속 실제 연못/다리 위치도 타일 좌표상에서 달라짐(그림 픽셀 위치는 그대로
  // 유지한 채 환산). 오리/충돌판정이 실제 물그림과 겹치도록 다시 환산한 값으로 갱신.
  const LA = { u: 5.6, v: 9.96, r: 4.77 }, LB = { u: 15.83, v: 7.69, r: 4.09 }, CH = { u0: 9.69, u1: 12.42, v0: 7.92, v1: 9.51 }, BR = { u0: 10.37, u1: 11.96, v0: 6.67, v1: 10.76 };
  const inWater = (u, v) => Math.hypot(u - LA.u, v - LA.v) < LA.r || Math.hypot(u - LB.u, v - LB.v) < LB.r || (u > CH.u0 && u < CH.u1 && v > CH.v0 && v < CH.v1);
  const onBridge = (u, v) => u >= BR.u0 - .1 && u <= BR.u1 + .1 && v >= BR.v0 && v <= BR.v1;

  // Lake and Duck sprite image assets
  const lakeUrl = (typeof assetUrl === 'function') ? assetUrl('spr/lake/lake.png') : 'spr/lake/lake.png';
  const LAKE_IMG = (typeof ASSET_CACHE !== 'undefined') ? ASSET_CACHE.load(lakeUrl) : ((typeof Image !== 'undefined') ? new Image() : null);
  if (LAKE_IMG && !LAKE_IMG.src) {
    LAKE_IMG.crossOrigin = 'anonymous';
    LAKE_IMG.src = lakeUrl;
  }
  const DUCK_IMGS = { 1: {}, 2: {}, 3: {} };
  if (typeof Image !== 'undefined') {
    for (let b = 1; b <= 4; b++) {
      const u1 = (typeof assetUrl === 'function') ? assetUrl('spr/lake/duck_1_' + b + '.png') : ('spr/lake/duck_1_' + b + '.png');
      const im1 = (typeof ASSET_CACHE !== 'undefined') ? ASSET_CACHE.load(u1) : new Image();
      im1.crossOrigin = 'anonymous';
      if (!im1.src) im1.src = u1;
      DUCK_IMGS[1][b] = im1;

      const u2 = (typeof assetUrl === 'function') ? assetUrl('spr/lake/duck_2_' + b + '.png') : ('spr/lake/duck_2_' + b + '.png');
      const im2 = (typeof ASSET_CACHE !== 'undefined') ? ASSET_CACHE.load(u2) : new Image();
      im2.crossOrigin = 'anonymous';
      if (!im2.src) im2.src = u2;
      DUCK_IMGS[2][b] = im2;

      const u3 = (typeof assetUrl === 'function') ? assetUrl('spr/lake/duck3_' + b + '.png') : ('spr/lake/duck3_' + b + '.png');
      const im3 = (typeof ASSET_CACHE !== 'undefined') ? ASSET_CACHE.load(u3) : new Image();
      im3.crossOrigin = 'anonymous';
      if (!im3.src) im3.src = u3;
      DUCK_IMGS[3][b] = im3;
    }
  }

  // 10 Ducks swimming configuration:
  // Left lake (LA): 3 kinds x 2 each = 6 ducks (청둥오리 2마리, 갈색 청둥오리 2마리, 아기 오리 2마리)
  // Right lake (LB): 2 kinds x 2 each = 4 ducks (청둥오리 2마리, 갈색 청둥오리 2마리)
  const DUCK_DATA = [
    // --- Pond A (Left Lake) ---
    { id: 1, kind: 1, base: LA, u: LA.u - 1.4, v: LA.v - 0.7, r: 2.7, sp: 0.65, phase: 0.2 },
    { id: 2, kind: 1, base: LA, u: LA.u + 1.2, v: LA.v - 1.1, r: 2.6, sp: 0.58, phase: 1.8 },
    { id: 3, kind: 2, base: LA, u: LA.u - 0.9, v: LA.v + 1.3, r: 2.7, sp: 0.60, phase: 3.1 },
    { id: 4, kind: 2, base: LA, u: LA.u + 1.5, v: LA.v + 0.6, r: 2.5, sp: 0.62, phase: 4.6 },
    { id: 5, kind: 3, base: LA, u: LA.u - 1.1, v: LA.v + 0.2, r: 2.1, sp: 0.75, phase: 2.3 },
    { id: 6, kind: 3, base: LA, u: LA.u + 0.4, v: LA.v - 0.4, r: 2.2, sp: 0.70, phase: 5.4 },

    // --- Pond B (Right Lake) ---
    { id: 7, kind: 1, base: LB, u: LB.u - 0.9, v: LB.v - 0.6, r: 2.2, sp: 0.60, phase: 0.9 },
    { id: 8, kind: 1, base: LB, u: LB.u + 0.8, v: LB.v + 0.9, r: 2.1, sp: 0.64, phase: 2.8 },
    { id: 9, kind: 2, base: LB, u: LB.u + 0.9, v: LB.v - 0.8, r: 2.2, sp: 0.55, phase: 1.5 },
    { id: 10, kind: 2, base: LB, u: LB.u - 0.7, v: LB.v + 0.7, r: 2.1, sp: 0.58, phase: 3.7 }
  ];
  // v2026-10-09: "호수에서만 오리들이 놀게 해줘. 호수밖을 나오게 하지 말고" -- 새로 그린 lake.png에는
  // 바위/연잎/다리 같은 디테일이 가장자리를 많이 차지하고 있어서, 기존 활동반경(LA.r/LB.r에 가까운
  // 값)으로 돌아다니면 실제 물 그림 밖(바위나 둑)까지 나가 보일 수 있었음. 모든 오리의 시작 위치와
  // 돌아다니는 반경을 호수 중심 쪽으로 더 바짝 당겨서 항상 물 안에서만 놀도록 함.
  const DUCK_SAFE_SHRINK = 0.55;
  for (const d of DUCK_DATA) {
    d.u = d.base.u + (d.u - d.base.u) * DUCK_SAFE_SHRINK;
    d.v = d.base.v + (d.v - d.base.v) * DUCK_SAFE_SHRINK;
    d.r = d.r * DUCK_SAFE_SHRINK;
  }
  const duckState = new Map();
  function getDuck(dId, dCfg) {
    let st = duckState.get(dId);
    if (!st) {
      st = {
        u: dCfg.u, v: dCfg.v, tu: dCfg.u, tv: dCfg.v,
        dir: 1, moving: false, wait: 1.0 + Math.random() * 2.0, act: 1,
        actTimer: 1.8 + Math.random() * 3.0, lt: 0
      };
      duckState.set(dId, st);
    }
    return st;
  }
  function stepDuck(dId, dCfg, now) {
    const s = getDuck(dId, dCfg);
    const dt = Math.min(0.1, Math.max(0, now - (s.lt || now)));
    s.lt = now;

    s.actTimer -= dt;
    if (s.actTimer <= 0) {
      const r = Math.random();
      if (s.moving) {
        s.act = r < 0.5 ? 2 : (r < 0.8 ? 1 : 3);
      } else {
        s.act = r < 0.3 ? 1 : (r < 0.6 ? 4 : (r < 0.85 ? 3 : 2));
      }
      s.actTimer = 2.0 + Math.random() * 3.5;
    }

    if (s.wait > 0) {
      s.wait -= dt;
      s.moving = false;
    } else {
      const du = s.tu - s.u, dv = s.tv - s.v;
      const dist = Math.hypot(du, dv);
      const step = dCfg.sp * dt;
      if (dist <= step || dist < 0.05) {
        s.u = s.tu; s.v = s.tv;
        s.moving = false;
        s.wait = 2.0 + Math.random() * 4.0;
        const ang = Math.random() * Math.PI * 2;
        const rad = Math.sqrt(Math.random()) * dCfg.r;
        s.tu = dCfg.base.u + Math.cos(ang) * rad;
        s.tv = dCfg.base.v + Math.sin(ang) * rad;
      } else {
        s.u += (du / dist) * step;
        s.v += (dv / dist) * step;
        s.moving = true;
        if (Math.abs(du - dv) > 0.02) {
          s.dir = (du - dv >= 0) ? 1 : -1;
        }
      }
    }
    return s;
  }
  function drawDuck(c, kindId, st, T, dCfg) {
    const kId = kindId || 1;
    const bob = Math.sin(T * 2.8 + (dCfg ? dCfg.phase : kId * 1.8)) * 1.3;
    const im = DUCK_IMGS[kId] && (DUCK_IMGS[kId][st.act] || DUCK_IMGS[kId][1]);
    const dw = kId === 3 ? 32 : 44;
    const dh = dw;
    c.save();
    c.scale(st.dir || 1, 1);
    c.translate(0, bob);
    // Water ripples
    const rw = (kId === 3 ? 12 : 16) + Math.abs(Math.sin(T * 2 + (dCfg ? dCfg.phase : kId))) * 3.5;
    const rh = rw * 0.45;
    ART.ell(c, 0, 3, rw, rh, null, 'rgba(255,255,255,0.42)', 1.1);
    if (st.moving) {
      ART.ell(c, -(st.dir || 1) * 6, 4, rw * 0.7, rh * 0.7, null, 'rgba(255,255,255,0.25)', 0.8);
    }
    if (im && im.complete && im.naturalWidth > 0) {
      c.drawImage(im, -dw / 2, -dh * 0.78, dw, dh);
    } else {
      ART.ell(c, 0, 0, 9, 5, kId === 3 ? '#ffdf3a' : kId === 2 ? '#9c6844' : '#2d6d4b');
    }
    c.restore();
  }
  // Check if position overlaps any building (shop, salon, cafe, hospital, etc.)
  function isBuildingOverlap(px, py, margin = 1.2) {
    const W = Wd(), H = Hd();
    if (px >= -2 && px <= W + 2 && py >= -16 && py <= H + 2) return true;
    const bList = (typeof TOWN_BIG !== 'undefined') ? TOWN_BIG : ['salon', 'hosp', 'cafe', 'farm', 'home', 'park', 'ranch'];
    for (const k of bList) {
      if (k === 'avenue') continue;
      const L = (typeof LAY === 'function') ? LAY(k) : (typeof S !== 'undefined' && S && S.lay && S.lay[k]);
      if (!L || L.x == null || L.x < -500) continue;
      const bd = (typeof TOWN_DEF !== 'undefined' && TOWN_DEF[k]) || (typeof D !== 'undefined' && D[k]) || {};
      const bw = L.w || bd.w || 10;
      const bd_depth = L.d || bd.d || 8;
      if (px >= L.x - margin && px <= L.x + bw + margin && py >= L.y - margin && py <= L.y + bd_depth + margin) {
        return true;
      }
    }
    if (typeof S !== 'undefined' && S && S.lay) {
      for (const k in S.lay) {
        if (k === 'avenue') continue;
        const L = S.lay[k];
        if (!L || L.x == null || L.x < -500) continue;
        const bd = (typeof TOWN_DEF !== 'undefined' && TOWN_DEF[k]) || (typeof D !== 'undefined' && D[k]) || {};
        const bw = L.w || bd.w || 10;
        const bd_depth = L.d || bd.d || 8;
        if (px >= L.x - margin && px <= L.x + bw + margin && py >= L.y - margin && py <= L.y + bd_depth + margin) {
          return true;
        }
      }
    }
    const specificBoxes = [
      (typeof SALON_POS === 'function' ? SALON_POS() : null),
      (typeof HOSP_POS === 'function' ? HOSP_POS() : null),
      (typeof CAFE_POS === 'function' ? CAFE_POS() : null)
    ];
    for (const b of specificBoxes) {
      if (b && b.x > -500) {
        if (px >= b.x - margin && px <= b.x + b.w + margin && py >= b.y - margin && py <= b.y + b.d + margin) {
          return true;
        }
      }
    }
    return false;
  }
  // ---------------- avenue layout: trees on both sides of the road, skipping any building footprints ----------------
  function avenueSpots() {
    const W = Wd(), H = Hd(), out = [], vS = (typeof VILLAGE_S_MAX === 'function' ? VILLAGE_S_MAX() : H + 36) - 3;
    for (let y = -31, i = 0; y < vS; y += 4, i++) {
      const eastPt = { x: W + 7.7, y: y + .5, lamp: i % 2 === 1 };
      if (!isBuildingOverlap(eastPt.x, eastPt.y, 1.2)) {
        out.push(eastPt);
      }
      const westPt = { x: W + .8, y: y + 2.5, lamp: i % 2 === 0 };
      if (!isBuildingOverlap(westPt.x, westPt.y, 1.2)) {
        out.push(westPt);
      }
    }
    return out;
  }
  // ---------------- solid tiles ----------------
  function solid() {
    const set = new Set(), add = (x, y) => set.add(Math.floor(x) + ',' + Math.floor(y));
    for (const k of []) if (!built(k)) { const s = SIGN[k](); add(s.x, s.y); }
    { const b = BOARD(); add(b.x, b.y); }
    if (built('lake')) { const p = LAKE(); for (let u = 0; u < p.w; u++) for (let v = 0; v < p.d; v++) { const cu = u + .5, cv = v + .5; if (inWater(cu, cv) && !onBridge(cu, cv)) add(p.x + u, p.y + v); } }
    if (built('monu')) { const p = MONU(); for (const [u, v] of [[3, 2], [3, 3], [2, 3], [4, 3], [3, 5]]) add(p.x + u, p.y + v); }
    return set;
  }
  // ---------------- ground ----------------
  function lot(c, p) { rect(c, p.x, p.y, p.x + p.w, p.y + p.d, 'rgba(120,160,70,.25)'); c.setLineDash([10, 7]); rect(c, p.x + .1, p.y + .1, p.x + p.w - .1, p.y + p.d - .1, null, 'rgba(255,255,255,.85)', 0); c.lineWidth = 2; c.stroke(); c.setLineDash([]); }
  function ground(c, T) {
    c.save();
    const L = LAKE(), M = MONU();
    if (!built('lake')) lot(c, L); else lakeGround(c, T, L);
    if (!built('monu')) lot(c, M); else monuGround(c, T, M);
    if (built('avenue')) { const sn = season(S.clock && S.clock.day); if (sn === 0 || sn === 2 || sn === 3) for (const t of avenueSpots()) { for (let i = 0; i < 5; i++) { const q = Q(t.x + Math.sin(i * 7.3 + t.y) * .7, t.y + Math.cos(i * 3.1 + t.x) * .6); ART.ell(c, q[0], q[1], sn === 3 ? 7 : 2, sn === 3 ? 3 : 1.3, sn === 0 ? '#ffc4d8' : sn === 2 ? ['#e8863a', '#d9542a', '#f2b33a'][i % 3] : 'rgba(255,255,255,.85)'); } } } // petals / leaves / snow under the trees
    c.restore();
  }
  function lakeGround(c, T, p) {
    const x0 = p.x, y0 = p.y;
    const lakeReady = LAKE_IMG && LAKE_IMG.complete && LAKE_IMG.naturalWidth > 0;
    if (lakeReady) {
      const [nx, ny] = [ISO.wx(x0, y0), ISO.wy(x0, y0)];
      const dw = (p.w + p.d) * 32;
      // v2026-10-09: "길과 호수 사이에 빈 간격" -- lake.png의 실제 그림은 캔버스(1774x887) 전체가
      // 아니라 안쪽 콘텐츠 영역(약 98,8 ~ 1659,851)에만 그려져 있어서, 캔버스 전체를 부지 크기에
      // 맞추면 그림이 부지보다 작게 나와 길과 사이에 틈이 생겼음. 콘텐츠 영역 기준으로 다시 늘려서
      // 부지 가장자리까지 꽉 차게 그림.
      const iw = LAKE_IMG.naturalWidth || 1419, ih = LAKE_IMG.naturalHeight || 710;
      // v2026-10-10 (3rd pass): 꼭짓점 최소자승 방식이 북서쪽에 여전히 갭을 남겨서, 그림 전체
      // 캔버스(거의 정확히 2:1 비율)를 타일의 bounding box에 그대로 맞추는 더 단순하고 안정적인
      // 방식으로 교체함 (동물원/공원과 동일한 방식).
      const scale = (p.w + p.d) * 32 / iw; // uniform -- whole-canvas-to-tile-bbox fit, preserves true 2:1 isometric proportions
      const imgW = iw * scale, imgH = ih * scale;
      const imgX = -p.d * 32;
      const imgY = 0;
      c.save();
      c.translate(nx, ny);
      c.drawImage(LAKE_IMG, imgX, imgY, imgW, imgH);
      c.restore();
      return;
    }
    rect(c, x0, y0, x0 + p.w, y0 + p.d, '#86c35f');
    for (const [e, pad] of [[LA, .5], [LB, .5]]) gEll(c, x0 + e.u, y0 + e.v, e.r + pad, e.r + pad, '#dcc79a', 'rgba(120,95,60,.4)', 1.2);
    rect(c, x0 + CH.u0, y0 + CH.v0 - .45, x0 + CH.u1, y0 + CH.v1 + .45, '#dcc79a');
    const water = '#5fb2de';
    gEll(c, x0 + LA.u, y0 + LA.v, LA.r, LA.r, water); gEll(c, x0 + LB.u, y0 + LB.v, LB.r, LB.r, water); rect(c, x0 + CH.u0, y0 + CH.v0, x0 + CH.u1, y0 + CH.v1, water);
    for (const e of [LA, LB]) { gEll(c, x0 + e.u - .6, y0 + e.v - .7, e.r * .55, e.r * .4, 'rgba(255,255,255,.15)'); for (let i = 0; i < 3; i++) { const k = (T * .25 + i / 3) % 1; gEll(c, x0 + e.u + 1, y0 + e.v + .5, .4 + k * 1.6, .3 + k * 1.1, null, `rgba(255,255,255,${.35 * (1 - k)})`, 1); } }
    for (const [u, v] of [[3.4, 7.2], [6.6, 10.6], [4.2, 11], [13, 5.6], [15.2, 8.2]]) { const q = Q(x0 + u, y0 + v); ART.ell(c, q[0], q[1], 7, 3.5, '#4f9f45', 'rgba(30,70,30,.5)', .7); if ((u * 3 | 0) % 2) ART.ell(c, q[0] + 2, q[1] - 2, 2.5, 2, '#ff9ec0'); }
    // path from the west edge to the bridge and on to the gazebo
    const PATH = '#e9d8b4', EDGE = 'rgba(150,120,80,.4)';
    rect(c, x0, y0 + 2.6, x0 + BR.u0 + .2, y0 + 3.8, PATH, EDGE); rect(c, x0 + BR.u0, y0 + 2.6, x0 + BR.u1, y0 + BR.v0 + .2, PATH, EDGE);
    rect(c, x0 + BR.u0, y0 + BR.v1 - .2, x0 + BR.u1, y0 + p.d - 1, PATH, EDGE); rect(c, x0 + BR.u1, y0 + p.d - 2.2, x0 + 15.5, y0 + p.d - 1, PATH, EDGE);
  }
  function monuGround(c, T, p) {
    const cx = p.x + 3.5, cy = p.y + 3.5;
    gEll(c, cx, cy, 3.4, 3.4, '#86c35f'); gEll(c, cx, cy, 2.9, 2.9, '#efe2c4', 'rgba(150,120,80,.45)', 1.2);
    for (let i = 0; i < 20; i++) { const a = i / 20 * Math.PI * 2; gEll(c, cx + Math.cos(a) * 2.5, cy + Math.sin(a) * 2.5, .12, .12, 'rgba(190,150,110,.4)'); }
    rect(c, p.x + p.w - 1.2, cy - .6, p.x + p.w, cy + .6, '#efe2c4', 'rgba(150,120,80,.45)'); // path to the east (towards the shop)
    // heart-shaped rose bed behind the statue
    const hq = (t, s) => Q(cx + .1 + s * 16 * Math.pow(Math.sin(t), 3) / 16 * 1.3, cy - 1.6 - s * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 16 * 1.1);
    c.beginPath(); for (let i = 0; i <= 40; i++) { const q = hq(i / 40 * Math.PI * 2, 1); i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]); } c.closePath(); c.fillStyle = '#7a5a3a'; c.fill();
    for (let i = 0; i < 30; i++) { const q = hq(i / 30 * Math.PI * 2, .85); ART.ell(c, q[0], q[1] - 3, 3.2, 3, i % 3 ? '#ff5a7a' : '#ff9ec0', 'rgba(120,20,40,.35)', .5); }
  }
  // ---------------- props ----------------
  function sign(c, T, k) {
    c.fillStyle = '#8a5a33'; c.fillRect(-3, -50, 6, 50); c.fillRect(-26, -50, 5, 50);
    ART.rrect(c, -52, -104, 104, 58, 8); c.fillStyle = '#9a6a3f'; c.fill(); c.lineWidth = 1.8; c.strokeStyle = ART.OUT; c.stroke();
    ART.rrect(c, -47, -99, 94, 48, 6); c.fillStyle = '#fff3d6'; c.fill();
    c.textAlign = 'center'; c.font = '17px sans-serif'; c.fillText({ avenue: '🌸🌳🏮', lake: '🦢🌉🛶', monu: '💑💗🌹' }[k], 0, -79);
    c.font = 'bold 11px sans-serif'; c.fillStyle = '#4f8a3a'; c.fillText(t('vlot_' + k), 0, -66); c.font = 'bold 10px sans-serif'; c.fillStyle = '#9a6a10'; c.fillText('🪙 ' + fmt(VILLAGE_COST[k]), 0, -55);
    const b = Math.sin(T * 3) * 3; c.font = '16px sans-serif'; c.fillText('👆', 44, -108 + b); c.textAlign = 'start';
  }
  function avTree(c, T, i, sn) {
    const sw = Math.sin(T * 1.1 + i) * 1.3; ART.ell(c, 0, 0, 24, 11, 'rgba(0,0,0,.15)');
    c.fillStyle = '#7a4e32'; c.fillRect(-4, -58, 8, 58); c.strokeStyle = ART.OUT; c.lineWidth = 1.1; c.strokeRect(-4, -58, 8, 58);
    c.strokeStyle = '#5a3520'; c.lineWidth = .9; c.beginPath(); c.moveTo(-1.2, -2); c.lineTo(-1.2, -54); c.stroke();
    if (sn === 3) { // winter: bare branches with snow
      c.strokeStyle = '#6b4a2e'; c.lineWidth = 2.2;
      for (const [a, l] of [[-.8, 30], [-.3, 36], [.3, 36], [.8, 30], [0, 42]]) {
        c.beginPath(); c.moveTo(0, -56); c.lineTo(Math.sin(a) * l, -56 - Math.cos(a) * l); c.stroke();
        ART.ell(c, Math.sin(a) * l, -56 - Math.cos(a) * l, 5, 2.8, '#fff');
      }
      for (let k = 0; k < 5; k++) { const f = (T * .3 + k * .2 + i * .13) % 1; ART.ell(c, -22 + k * 11 + Math.sin(T + k) * 5, -80 + f * 80, 1.8, 1.8, '#fff'); }
      return;
    }
    const col = sn === 0 ? ['#f6a8c4', '#ffc4d8', '#ffe0ea'] : sn === 1 ? ['#3f9a44', '#55b04e', '#72c460'] : ['#d9542a', '#e8863a', '#f2b33a'];
    for (const [dx, dy, r, k] of [[-18, -68, 20, 0], [18, -70, 20, 0], [0, -88, 23, 1], [-9, -78, 16, 2], [10, -94, 14, 2]]) {
      ART.ell(c, dx + sw, dy, r, r * .85, col[k], k ? null : 'rgba(40,60,30,.3)', .8);
    }
    if (sn !== 1) for (let k = 0; k < 4; k++) { const f = (T * .35 + k * .3 + i * .17) % 1; ART.ell(c, -20 + k * 14 + Math.sin(T + k + i) * 6, -60 + f * 60, 2.2, 1.6, sn === 0 ? '#ffb3cc' : col[k]); }
  }
  function lamp(c) {
    c.fillStyle = '#3e4a5a'; c.fillRect(-2, -62, 4, 62); ART.ell(c, 0, 0, 6, 3, '#3e4a5a');
    const on = lampOn(); ART.rrect(c, -7, -76, 14, 14, 3); c.fillStyle = on ? '#fff3b0' : '#e8f0f6'; c.fill(); c.strokeStyle = '#3e4a5a'; c.lineWidth = 1.5; c.stroke();
    c.beginPath(); c.moveTo(-9, -76); c.lineTo(0, -83); c.lineTo(9, -76); c.closePath(); c.fillStyle = '#3e4a5a'; c.fill();
    if (on) { const g = c.createRadialGradient(0, -69, 2, 0, -69, 34); g.addColorStop(0, 'rgba(255,240,170,.45)'); g.addColorStop(1, 'rgba(255,240,170,0)'); c.fillStyle = g; c.beginPath(); c.arc(0, -69, 34, 0, Math.PI * 2); c.fill(); }
  }
  function bridge(c, p) { // wooden arched bridge over the channel (runs north-south)
    const x0 = p.x + BR.u0, x1 = p.x + BR.u1, ya = p.y + BR.v0, yb = p.y + BR.v1, arch = v => 14 * Math.sin(Math.PI * (v - ya) / (yb - ya));
    const N = 10; for (let i = 0; i < N; i++) { const v0 = ya + (yb - ya) * i / N, v1 = ya + (yb - ya) * (i + 1) / N; quad(c, [Q(x0, v0, arch(v0)), Q(x1, v0, arch(v0)), Q(x1, v1, arch(v1)), Q(x0, v1, arch(v1))], i % 2 ? '#c8864a' : '#b8763a', 'rgba(70,40,20,.5)', .8); }
    quad(c, [Q(x1, ya, arch(ya)), Q(x1, yb, arch(yb)), Q(x1, yb, arch(yb) - 5), Q(x1, ya, arch(ya) - 5)], '#8a5a33');
    for (const x of [x0, x1]) { c.beginPath(); for (let i = 0; i <= N; i++) { const v = ya + (yb - ya) * i / N, q = Q(x, v, arch(v) + 12); i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]); } c.strokeStyle = '#e0604e'; c.lineWidth = 2.2; c.stroke(); for (let i = 0; i <= N; i += 2) { const v = ya + (yb - ya) * i / N, a = Q(x, v, arch(v)), b = Q(x, v, arch(v) + 12); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.strokeStyle = '#c84a3a'; c.lineWidth = 1.6; c.stroke(); } }
  }
  function swanBoat(c, T) {
    c.save(); ART.ell(c, 0, 0, 17, 7, '#ffffff', ART.OUT, 1.1); ART.ell(c, 0, -3, 12, 4.5, '#ffe9f0');
    c.beginPath(); c.moveTo(10, -2); c.quadraticCurveTo(20, -8, 14, -20); c.quadraticCurveTo(12, -24, 16, -26); c.lineWidth = 4.5; c.strokeStyle = '#ffffff'; c.stroke(); c.lineWidth = 1; c.strokeStyle = ART.OUT; c.stroke();
    ART.ell(c, 17, -25, 3.5, 3, '#ffffff', ART.OUT, .8); c.beginPath(); c.moveTo(19.5, -25); c.lineTo(23, -24); c.lineTo(19.5, -23); c.fillStyle = '#ff9e3a'; c.fill();
    ART.ell(c, -8, -7, 3.2, 3.2, '#ffcf9e', ART.OUT, .8); ART.ell(c, -1, -8, 3.2, 3.2, '#8a5a3b', ART.OUT, .8); emo(c, '💕', -4, -14 - Math.abs(Math.sin(T * 2)) * 3, 8); c.restore();
  }
  function gazebo(c, T) {
    const box = FURN.box, P = FURN.P;
    box(c, 0, 0, 2, 2, 5, '#e8d5bb', 0, { top: '#f3e3c7' });
    for (const [x, y] of [[.1, .1], [1.75, .1], [.1, 1.75], [1.75, 1.75]]) box(c, x, y, .15, .15, 46, '#ffffff', 5);
    const top = [P(-.15, -.15, 51), P(2.15, -.15, 51), P(2.15, 2.15, 51), P(-.15, 2.15, 51)], peak = P(1, 1, 76);
    for (let i = 0; i < 4; i++) { const a = top[i], b = top[(i + 1) % 4]; quad(c, [a, b, peak], i % 2 ? '#e0604e' : '#c84a3a', ART.OUT, 1); }
    ART.ell(c, peak[0], peak[1] - 3, 3, 3, '#ffd24a', ART.OUT, .8);
  }
  function fisher(c, T, look) { // someone sitting on the dock with a fishing rod
    c.save(); ART.setSit && ART.setSit(1); ART.human(c, look, 0, T, false, 'happy'); ART.setSit && ART.setSit(0);
    const tip = [30, -48 + Math.sin(T * 1.5) * 2]; c.beginPath(); c.moveTo(8, -26); c.lineTo(tip[0], tip[1]); c.strokeStyle = '#8a5a33'; c.lineWidth = 1.6; c.stroke();
    c.beginPath(); c.moveTo(tip[0], tip[1]); c.lineTo(tip[0] + 6, 4); c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = .7; c.stroke(); ART.ell(c, tip[0] + 6, 5 + Math.sin(T * 3) * 1.2, 2.2, 2.2, '#ff5a5a', ART.OUT, .6); c.restore();
  }
  function statue(c, T) { // classical 3-tier pedestal + two bronze figures holding hands + a floating heart + plaque
    const box = FURN.box, P = FURN.P, v = V();
    const rawLooks = (v.monuLooks && Array.isArray(v.monuLooks)) ? v.monuLooks : [];
    const lookA = rawLooks[0] || (typeof CFG !== 'undefined' && CFG.look) || ART.randomHuman(7);
    const lookB = rawLooks[1] || ART.randomHuman(11);
    const looks = [lookA, lookB];

    // 1. Classical 3-tier architectural stone pedestal (drawn bottom-to-top so faces don't clip)
    // Tier 1: Wide ground plinth (z: 0..6)
    box(c, -.15, -.15, 2.3, 1.7, 6, '#b8b0a2', 0, { top: '#c8c0b4' });
    // Tier 2: Main pedestal pillar shaft (z: 6..24)
    box(c, 0, 0, 2.0, 1.4, 18, '#d4cec4', 6, { top: '#e4ded4' });
    // Tier 3: Capital / top slab molding (z: 24..27)
    box(c, -.08, -.08, 2.16, 1.56, 3, '#c2baa8', 24, { top: '#ded7c8' });

    // 2. Ornate engraved brass plaque on the front face (y = 1.4, z: 8..22)
    const pl = [P(.25, 1.4, 22), P(1.75, 1.4, 22), P(1.75, 1.4, 8), P(.25, 1.4, 8)];
    quad(c, pl, '#c59a3e', '#785412', 1.2);
    quad(c, [P(.3, 1.4, 21), P(1.7, 1.4, 21), P(1.7, 1.4, 9), P(.3, 1.4, 9)], '#dfb24e');
    const m = P(1, 1.4, 15);
    c.save();
    c.translate(m[0], m[1]);
    c.transform(1, -.5, 0, 1, 0, 0);
    c.font = 'bold 8.5px sans-serif';
    c.textAlign = 'center';
    c.fillStyle = '#422806';
    c.fillText((v.monuText || '♥').slice(0, 22), 0, 3);
    c.restore();

    // 3. Bronze statue of two figures on top of pedestal (z = 27)
    // Pedestal top slab center is at P(1, .7, 27). The feet are aligned cleanly onto the slab center.
    const base = P(1, .7, 27);
    c.save();
    c.translate(base[0], base[1]);
    const spr = statueSprite(looks);
    c.drawImage(spr, -spr.width / 4, -104, spr.width / 2, spr.height / 2);

    // Joined hands bond
    c.beginPath();
    c.moveTo(-6, -15);
    c.quadraticCurveTo(0, -11, 6, -15);
    c.strokeStyle = '#9c7332';
    c.lineWidth = 3.5;
    c.stroke();

    // Floating pulsing love heart & sparkles
    const hb = Math.sin(T * 2) * 3, hs = 1 + Math.sin(T * 4) * .08;
    c.save();
    c.translate(0, -84 + hb);
    c.scale(hs, hs);
    c.font = '22px sans-serif';
    c.textAlign = 'center';
    c.fillText('💗', 0, 0);
    c.restore();
    for (let i = 0; i < 3; i++) {
      const k = (T * .5 + i / 3) % 1;
      c.globalAlpha = 1 - k;
      c.font = '10px sans-serif';
      c.textAlign = 'center';
      c.fillText('✨', -24 + i * 24, -62 - k * 24);
    }
    c.globalAlpha = 1;
    c.restore();
  }
  let _stat = null;
  function statueSprite(looks) { // both figures drawn into offscreen canvas and tinted metallic bronze
    const key = JSON.stringify(looks);
    if (_stat && _stat.key === key) return _stat.cv;
    const cv = document.createElement('canvas');
    cv.width = 160;
    cv.height = 220;
    const g = cv.getContext('2d');
    g.scale(2, 2);
    g.translate(40, 104);

    // Force vector rendering for offscreen statue to guarantee synchronous draw and avoid CORS security taint
    const oldForce = (typeof HUM !== 'undefined' && HUM.forceVector);
    if (typeof HUM !== 'undefined') HUM.forceVector = true;
    try {
      g.save(); g.translate(-11, 0); g.scale(.95, .95); ART.human(g, looks[0], 0, 0, false, 'happy'); g.restore();
      g.save(); g.translate(11, 0); g.scale(-.95, .95); ART.human(g, looks[1], 0, 0, false, 'happy'); g.restore();
    } finally {
      if (typeof HUM !== 'undefined') HUM.forceVector = oldForce;
    }

    try {
      const im = g.getImageData(0, 0, cv.width, cv.height), d = im.data;
      for (let i = 0; i < d.length; i += 4) {
        if (!d[i + 3]) continue;
        const l = (d[i] * .3 + d[i + 1] * .59 + d[i + 2] * .11) / 255;
        const k = .55 + l * .6;
        d[i] = Math.min(255, 192 * k);     // Bronze R
        d[i + 1] = Math.min(255, 140 * k); // Bronze G
        d[i + 2] = Math.min(255, 74 * k);  // Bronze B
      }
      g.putImageData(im, 0, 0);
    } catch (e) {}
    _stat = { key, cv };
    return cv;
  }
  function heartBench(c) {
    const box = FURN.box; for (const [x, y] of [[.1, .25], [1.8, .25], [.1, .75], [1.8, .75]]) box(c, x, y, .08, .08, 12, '#ffffff');
    box(c, .05, .3, 1.9, .5, 3, '#ff9ec0', 12);
    const P = FURN.P, a = P(1, .28, 15); c.save(); c.translate(a[0], a[1] - 10); c.beginPath(); c.moveTo(0, 8); c.bezierCurveTo(-26, -8, -14, -24, 0, -12); c.bezierCurveTo(14, -24, 26, -8, 0, 8); c.fillStyle = '#ff7a9a'; c.fill(); c.strokeStyle = ART.OUT; c.lineWidth = 1.2; c.stroke(); c.restore();
  }
  function board(c, T) { // PET TOWN: 1.3x, wider, facing EAST (toward the street): the panel stands on the x = .55 plane, running along y
    const box = FURN.box, P = FURN.P; c.save(); c.scale(1.15, 1.15); // a bit smaller again (was 1.3)
    const y0 = -.3, y1 = 1.3; // wider board
    box(c, .45, -.1, .1, .1, 44, '#8a5a33'); box(c, .45, 1, .1, .1, 44, '#8a5a33');
    quad(c, [P(.55, y0, 58), P(.55, y1, 58), P(.55, y1, 20), P(.55, y0, 20)], '#c8a06a', ART.OUT, 1.4);
    quad(c, [P(.55, y0 + .06, 55), P(.55, y1 - .06, 55), P(.55, y1 - .06, 23), P(.55, y0 + .06, 23)], '#d8b888');
    quad(c, [P(.45, y0 - .08, 62), P(.45, y1 + .08, 62), P(.65, y1 + .08, 58), P(.65, y0 - .08, 58)], '#b8504a', ART.OUT, 1);
    // notes pinned flat on the board: sheared along the board's own direction on screen
    const A = P(.55, 0, 0), B = P(.55, 1, 0), sk = (B[1] - A[1]) / (B[0] - A[0]);
    for (const [u, z, col] of [[-.1, 45, '#fff'], [.25, 47, '#fff6c4'], [.6, 44, '#ffe0ea'], [.95, 46, '#e0f2ff'], [.05, 31, '#e8f7de'], [.4, 29, '#fff'], [.75, 32, '#fff6c4'], [1.1, 30, '#ffe0ea']]) {
      const a = P(.55, u, z); c.save(); c.translate(a[0], a[1]); c.transform(1, sk, 0, 1, 0, 0); c.fillStyle = col; c.fillRect(-6, -7, 12, 12); c.strokeStyle = 'rgba(90,60,30,.4)'; c.lineWidth = .6; c.strokeRect(-6, -7, 12, 12); ART.ell(c, 0, -6, 1.3, 1.3, '#e0604e'); c.restore();
    }
    const b = S.village && S.village.board, n = b ? (b.reqs || []).filter(r => !r.done && reqHave(S, r) >= r.n).length : 0;
    const top = P(.55, .5, 66);
    // v1.15: the name leans with the board (same shear as the notes); badge tilts together with the board
    c.save(); c.translate(top[0] - 2, top[1] + 1); c.transform(1, sk, 0, 1, 0, 0);
    c.font = 'bold 9px sans-serif'; c.textAlign = 'center'; c.fillStyle = '#5a3a2a'; c.lineWidth = 3; c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineJoin = 'round'; c.strokeText(t('vboardName'), 0, 0); c.fillText(t('vboardName'), 0, 0);
    if (n) {
      c.save();
      ART.ell(c, 0, -14, 8, 8, '#e0604e', '#fff', 1.5);
      c.font = 'bold 10px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillStyle = '#fff'; c.fillText(n, 0, -14);
      c.restore();
    }
    c.textAlign = 'start';
    c.restore();
    c.restore();
  }
  // ---------------- depth-sorted entries for world.js ----------------
  let fishLook = null;
  function collect(c, T, addHit) {
    const out = [], hitAt = (x, y, kind, extra, w, h) => { const sx = ISO.wx(x, y), sy = ISO.wy(x, y); addHit(Object.assign({ kind, x0: sx - (w || 56), x1: sx + (w || 56), y0: sy - (h || 110), y1: sy + 6 }, extra || {})); };
    const cb = (typeof World !== 'undefined' && World.cullBounds) ? World.cullBounds() : null;
    const cx = cb ? cb.cx : 0, cy = cb ? cb.cy : 0;
    const rw = cb ? cb.rw : 1e9, rh = cb ? cb.rh : 1e9;
    const isVis = (wx, wy, px = 80, py = 120) => !cb || (Math.abs(wx - cx) <= rw + px && Math.abs(wy - cy) <= rh + py);

    for (const k of []) if (!built(k)) { const s = SIGN[k](); out.push({ depth: s.x + s.y + 1, fn: () => { at(c, s.x + .5, s.y + .5, () => sign(c, T, k)); hitAt(s.x + .5, s.y + .5, 'vsign', { vk: k }); } }); }
    { const b = BOARD(); const bsx = ISO.wx(b.x + .5, b.y + .5), bsy = ISO.wy(b.x + .5, b.y + .5); if (isVis(bsx, bsy, 80, 100)) { out.push({ depth: b.x + b.y + 1.2, fn: () => { at(c, b.x + .45, b.y, () => board(c, T)); hitAt(b.x + .9, b.y + .5, 'vboard', null, 60, 105); } }); } }
    if (built('avenue')) {
      const sn = season(S.clock && S.clock.day);
      avenueSpots().forEach((p, i) => {
        const psx = ISO.wx(p.x, p.y), psy = ISO.wy(p.x, p.y);
        if (!isVis(psx, psy, 80, 120)) return;
        out.push({ depth: p.x + p.y + .3, fn: () => at(c, p.x, p.y, () => avTree(c, T, i, sn)) });
        if (p.lamp) out.push({ depth: p.x + p.y + 2.3, fn: () => at(c, p.x, p.y + 2, () => lamp(c)) });
      });
    }
    if (built('lake')) {
      const p = LAKE();
      const lcx = ISO.wx(p.x + p.w / 2, p.y + p.d / 2), lcy = ISO.wy(p.x + p.w / 2, p.y + p.d / 2);
      const lakeVis = !cb || (Math.abs(lcx - cx) <= (rw + (p.w + p.d) * 16 + 100) && Math.abs(lcy - cy) <= (rh + (p.w + p.d) * 8 + 100));
      if (lakeVis) {
        const lakeReady = LAKE_IMG && LAKE_IMG.complete && LAKE_IMG.naturalWidth > 0;
        if (!lakeReady) {
          out.push({ depth: p.x + BR.u1 + p.y + BR.v1, fn: () => bridge(c, p) });
          { const a = T * .12, u = LA.u + Math.cos(a) * LA.r * .55, v = LA.v + Math.sin(a) * LA.r * .55; out.push({ depth: p.x + u + p.y + v, fn: () => at(c, p.x + u, p.y + v, () => { c.scale(Math.sin(a) > 0 ? -1 : 1, 1); swanBoat(c, T); }) }); }
          out.push({ depth: p.x + 14 + p.y + 13.5, fn: () => at(c, p.x + 13, p.y + 12, () => gazebo(c, T)) });
          for (const [u, v, k] of [[1, 1, 0], [16.5, 1.5, 2], [1.2, 14.6, 1], [7, 15, 0], [16.6, 11, 2]]) out.push({ depth: p.x + u + p.y + v + .9, fn: () => at(c, p.x + u, p.y + v, () => avTree(c, T, u * 7 | 0, k === 1 ? 1 : season(S.clock && S.clock.day) === 3 ? 3 : k)) });
          for (const [u, v] of [[3, 13.6], [11.4, 2.2]]) out.push({ depth: p.x + u + p.y + v + 1.4, fn: () => at(c, p.x + u, p.y + v, () => { const box = FURN.box; for (const [x, y] of [[.1, .25], [1.8, .25], [.1, .75], [1.8, .75]]) box(c, x, y, .08, .08, 12, '#555b66'); box(c, .05, .3, 1.9, .5, 3, '#c8864a', 12); box(c, .05, .25, 1.9, .08, 16, '#b8763a', 16); }) });
          for (const [u, v] of [[BR.u0 - .4, BR.v0 - .6], [BR.u1 + .4, BR.v1 + .6], [6, 3], [12.5, 11.5]]) out.push({ depth: p.x + u + p.y + v, fn: () => at(c, p.x + u, p.y + v, () => lamp(c)) });
        }
        if (!lakeReady) {
          const du = LA.u - LA.r - .2, dv = LA.v + .6;
          out.push({ depth: p.x + du + p.y + dv, fn: () => at(c, p.x + du - .9, p.y + dv - .4, () => FURN.box(c, 0, 0, 1.6, .8, 4, '#b8763a')) });
        }

        // 10 Ducks swimming: 왼쪽 3종류 2마리씩(총 6마리), 오른쪽 2종류 2마리씩(총 4마리)
        for (const dCfg of DUCK_DATA) {
          const st = stepDuck(dCfg.id, dCfg, T);
          const du = st.u, dv = st.v;
          out.push({
            depth: p.x + du + p.y + dv,
            fn: () => {
              at(c, p.x + du, p.y + dv, () => drawDuck(c, dCfg.kind, st, T, dCfg));
              hitAt(p.x + du, p.y + dv, 'vlake_duck', { did: dCfg.id, kindId: dCfg.kind }, 24, 24);
            }
          });
        }

        out.push({ depth: -1e5, fn: () => { const sx = ISO.wx(p.x + LA.u, p.y + LA.v), sy = ISO.wy(p.x + LA.u, p.y + LA.v); addHit({ kind: 'vlake', x0: sx - 70, x1: sx + 70, y0: sy - 50, y1: sy + 35 }); } });
      }
    }
    if (built('monu')) {
      const p = MONU();
      const mcx = ISO.wx(p.x + 3.5, p.y + 3.5), mcy = ISO.wy(p.x + 3.5, p.y + 3.5);
      if (isVis(mcx, mcy, 120, 150)) {
        out.push({ depth: p.x + 2.5 + p.y + 3.4 + .5, fn: () => { at(c, p.x + 2.5, p.y + 2, () => statue(c, T)); const sx = ISO.wx(p.x + 3.5, p.y + 2.7), sy = ISO.wy(p.x + 3.5, p.y + 2.7); addHit({ kind: 'vmonu', x0: sx - 40, x1: sx + 40, y0: sy - 110, y1: sy + 10 }); } });
        out.push({ depth: p.x + 2.5 + p.y + 5.8, fn: () => at(c, p.x + 2.5, p.y + 5, () => heartBench(c)) });
        for (const [u, v] of [[.8, .8], [6, .8], [.8, 6], [6, 6]]) out.push({ depth: p.x + u + p.y + v, fn: () => at(c, p.x + u, p.y + v, () => { ART.ell(c, 0, -8, 11, 9, '#4f9a44', 'rgba(30,60,30,.4)', .8); for (let i = 0; i < 5; i++) ART.ell(c, -7 + (i * 7) % 14, -12 + (i % 2) * 6, 2.8, 2.8, '#ff5a7a'); }) });
      }
    }
    return out;
  }
  // ---------------- notice board: daily weather, news and villagers' requests ----------------
  // v1.10: requests fit the player's progress. 3 new requests every day; unfinished ones stay one extra day.
  // Farm requests only with a farm; café / hospital / salon requests only once those are built. Progress counts from when the request was posted.
  // Finishing all 3 of one day's requests pays a bonus (every 3rd bonus also gives a gacha ticket).
  const CAT_IC = { dog: '🐶', cat: '🐱', bird: '🐦', fish: '🐠', small: '🐹', reptile: '🦎' }, DAILY = 3;
  const has = (s, k) => typeof TOWN === 'undefined' || !TOWN.bigBuilt ? true : TOWN.bigBuilt(s, k);
  const farmOn = s => has(s, 'farm');
  function cnt(s, r) { // running totals the requests measure against their baseline r.b
    const st = s.stats || {};
    switch (r.t) {
      case 'sell': return st.sold || 0; case 'serve': return st.served || 0; case 'groom': return st.groomed || 0;
      case 'sp': return (st.spSold && st.spSold[r.k]) || 0;
      case 'cafe': return (s.cafe && s.cafe.served) || 0; case 'hosp': return (s.hosp && s.hosp.treated) || 0; case 'salon': return (s.salon && s.salon.served) || 0;
      case 'harvest': return (s.farm && s.farm.harv) || 0;
    }
    return 0;
  }
  function makeReq(s, used) {
    const L = typeof lvE === 'function' ? lvE(s) : Math.min(30, s.level || 1), R = n => Math.max(10, Math.round(n / 10) * 10), rnd = n => Math.floor(Math.random() * n);
    const kinds = [['sell', 3], ['serve', 3]];
    // grooming (✂️ in a pet's panel, uses a grooming kit): only when the shop has ungroomed dogs/cats/small pets and kits (or money for them), at most once a day
    if (!used.get('n:groom') && (s.pets || []).some(p => p && !p.groomed && GROOMABLE[(SPECIES[p.sp] || {}).cat]) && ((s.kits || 0) > 0 || s.coins >= 300)) kinds.push(['groom', 1]);
    const sps = SPECIES_RAW.filter(r => r[2] <= (s.level || 1) && !(typeof TOWN_SP !== 'undefined' && TOWN_SP[r[0]]) && !used.has('sp:' + r[0]));
    if (sps.length) kinds.push(['sp', 3]);
    const crops = farmOn(s) ? CROPS.filter(c => (c.ulv || 1) <= (s.level || 1) && !used.has('item:' + c.id)) : [];
    if (crops.length) kinds.push(['item', 4]); if (farmOn(s)) kinds.push(['harvest', 2]);
    if (farmOn(s) && s.farm && s.farm.coop && !used.has('item:egg')) kinds.push(['egg', 2]);
    if (s.cafe && s.cafe.built) kinds.push(['cafe', 3]); if (s.hosp && s.hosp.built) kinds.push(['hosp', 3]); if (s.salon && s.salon.built) kinds.push(['salon', 3]);
    const pick = () => { const tot = kinds.reduce((a, k) => a + k[1], 0); let x = Math.random() * tot; for (const k of kinds) { x -= k[1]; if (x < 0) return k[0]; } return kinds[0][0]; };
    let t = pick(); for (let g = 0; g < 8 && (used.get('n:' + t) || 0) >= 2; g++) t = pick();
    used.set('n:' + t, (used.get('n:' + t) || 0) + 1);
    let r;
    if (t === 'item') { const c = crops[rnd(crops.length)]; used.set('item:' + c.id, 1); const n = 3 + rnd(4 + Math.min(4, Math.floor(L / 8))); r = { t: 'item', k: c.id, icon: c.icon, n, reward: R(c.sellPrice * n * (1.4 + Math.random() * .4)) + 80 }; }
    else if (t === 'egg') { used.set('item:egg', 1); const n = 3 + rnd(5); r = { t: 'item', k: 'egg', icon: '🥚', n, reward: R(18 * n * 1.5) + 80 }; }
    else if (t === 'sell') { const n = Math.max(1, Math.min(6, 1 + Math.floor(L / 6) + rnd(2))); r = { t, icon: '🐾', n, reward: R((30 + 8 * L) * n) }; }
    else if (t === 'serve') { const n = Math.min(15, 3 + Math.floor(L / 3) + rnd(3)); r = { t, icon: '🛍️', n, reward: R((10 + 3 * L) * n) }; }
    else if (t === 'groom') { const n = Math.min(1 + Math.floor(L / 12), Math.max(1, (s.pets || []).filter(p => p && GROOMABLE[(SPECIES[p.sp] || {}).cat]).length)); r = { t, icon: '✂️', n, reward: R((20 + 4 * L) * n) }; }
    else if (t === 'sp') { const sp = sps[rnd(sps.length)]; used.set('sp:' + sp[0], 1); r = { t, k: sp[0], icon: CAT_IC[sp[1]] || '🐾', n: 1, reward: R(sp[4] * .5 + 40 + 8 * L) }; }
    else if (t === 'harvest') { const n = 5 + rnd(6) + Math.floor(L / 5); r = { t, icon: '🌾', n, reward: R((6 + 1.5 * L) * n) }; }
    else if (t === 'cafe') { const n = 2 + rnd(3) + Math.floor(L / 10); r = { t, icon: '☕', n, reward: R((15 + 4 * L) * n) }; }
    else if (t === 'hosp') { const n = 1 + rnd(2) + Math.floor(L / 15); r = { t, icon: '🏥', n, reward: R((45 + 8 * L) * n) }; }
    else { const n = 1 + rnd(3) + Math.floor(L / 15); r = { t: 'salon', icon: '✂️', n, reward: R((30 + 6 * L) * n) }; }
    r.b = cnt(s, r); r.who = 1 + rnd(12); r.done = false; return r;
  }
  function newDay(s, day) {
    const v = s.village = s.village || {}, sn = season(day), W = [['sun', 'cloud', 'sun', 'blossom'], ['sun', 'sun', 'rain', 'hot'], ['cloud', 'rain', 'leaf', 'sun'], ['snow', 'snow', 'cloud', 'sun']][sn];
    const rnd = n => Math.floor(Math.random() * n), old = v.board && v.board.v === 5 ? v.board : null;
    // keep yesterday's unfinished requests one more day (farm requests only while there is a farm)
    const keep = old ? old.reqs.filter(r => !r.done && r.day === day - 1 && (r.t !== 'item' || farmOn(s))) : [];
    const used = new Map(); for (const r of keep) { used.set('n:' + r.t, (used.get('n:' + r.t) || 0) + 1); if (r.k) used.set((r.t === 'sp' ? 'sp:' : 'item:') + r.k, 1); }
    let seq = old ? old.seq || 100 : 1; const reqs = keep.slice();
    for (let i = 0; i < DAILY; i++) { const r = makeReq(s, used); r.id = seq++; r.day = day; reqs.push(r); }
    v.board = { day, v: 5, seq, paid: old && old.paid ? old.paid.filter(d => d >= day - 1) : [], bonus: old ? old.bonus || 0 : 0, weather: W[rnd(W.length)], news: (() => { const need = { 0: 'park', 1: 'farm', 2: 'cafe', 4: 'hosp', 6: 'lake' }; const ok = [...Array(10).keys()].filter(i => !need[i] || has(s, need[i])); const a = ok[rnd(ok.length)]; let b2 = ok[rnd(ok.length)]; if (b2 === a && ok.length > 1) b2 = ok[(ok.indexOf(a) + 1) % ok.length]; return [a, b2]; })(), reqs };
  }
  // progress on a request: counted since it was posted (item requests count the farm storage crate)
  function reqHave(s, r) {
    if (!r.t || r.t === 'item') return (s.farm && s.farm.produce && s.farm.produce[r.k]) || 0;
    return Math.max(0, cnt(s, r) - (r.b || 0));
  }
  const bonusOf = s => Math.max(100, Math.round((400 + 120 * (typeof lvE === 'function' ? lvE(s) : 1)) / 10) * 10);
  function tick(s) { const day = s.clock ? s.clock.day : 1, v = s.village = s.village || {}; if (!v.board || v.board.day !== day || v.board.v !== 5) newDay(s, day); }
  function apply(s, a) {
    if (a.t === 'vbuild') {
      const v = s.village = s.village || {}, k = a.k; if (!VILLAGE_COST[k] || v[k]) return { err: 'gone' };
      if (k !== 'avenue' && !(s.lay && s.lay[k])) return { err: 'tUseBuildMenu' }; // PET TOWN
      if (s.coins < VILLAGE_COST[k]) return { err: 'notEnough' };
      s.coins -= VILLAGE_COST[k]; v[k] = s.clock ? s.clock.day : 1;
      if (k === 'monu') { v.monuText = String(a.text || '♥').slice(0, 22); v.monuLooks = a.looks && a.looks.length === 2 ? a.looks : null; }
      return { ok: 1, fx: 'coin', msg: 'vbuilt_' + k };
    }
    if (a.t === 'vdeliver') {
      const b = s.village && s.village.board, r = b && b.reqs.find(x => x.id === a.rid); if (!r || r.done) return { err: 'gone' };
      if (r.t && r.t !== 'item') { if (reqHave(s, r) < r.n) return { err: 'vNotYet' }; }
      else { const f = s.farm; if (!f || (f.produce[r.k] || 0) < r.n) return { err: 'vNeedItem', p: { i: r.icon, n: r.n } }; f.produce[r.k] -= r.n; }
      s.coins += r.reward; r.done = true; b.paid = b.paid || [];
      if (!b.paid.includes(r.day) && b.reqs.filter(q => q.day === r.day).every(q => q.done)) { b.paid.push(r.day); const c = bonusOf(s); b.bonus = (b.bonus || 0) + 1; s.coins += c; const tk = b.bonus % 3 === 0 ? 1 : 0; if (tk && s.x) s.x.tickets = (s.x.tickets || 0) + 1;
        return { ok: 1, fx: 'coin', msg: tk ? 'vBonusT' : 'vBonus', p: { c: fmt(r.reward + c) } }; }
      return { ok: 1, fx: 'coin', msg: 'vDelivered', p: { c: fmt(r.reward) } };
    }
    return undefined;
  }
  return { ground, collect, solid, apply, tick, reqHave, DAILY, bonusOf, built, season, SIGN, LAKE, MONU, BOARD };
})();
Object.assign(I18N.ko, {
  vlot_avenue: '가로수길 부지', vlot_lake: '호수 부지', vlot_monu: '기념 광장 부지', vboardName: '마을 게시판',
  vbuild_avenue: '도로 양옆에 벚꽃 가로수와 가로등을 심을까요? 🪙{c}\n일주일마다 계절이 바뀌어요 (봄 벚꽃 → 여름 초록 → 가을 단풍 → 겨울 눈).',
  vbuild_lake: '마을에 호수를 만들까요? 🪙{c}\n빨간 다리, 백조 보트, 정자, 낚시하는 주민이 생겨요.',
  vbuild_monu: '두 사람의 기념 광장을 만들까요? 🪙{c}\n손잡은 동상과 하트 벤치, 하트 장미 화단이 생겨요. 동상에 새길 글을 적어 주세요.',
  vbuilt_avenue: '🌸 가로수길이 완성됐어요!', vbuilt_lake: '🦢 호수가 완성됐어요!', vbuilt_monu: '💑 기념 광장이 완성됐어요!', vBuildBtn: '짓기',
  vlakeHi: '🦢 백조 보트를 탄 커플이 행복해 보여요', vmonuHi: '💗 "{t}"', vNeedItem: '{i} {n}개가 필요해요 (농장 창고)', vDelivered: '부탁을 들어줬어요! 🪙{c}',
  vbTitle: '📋 마을 게시판', vbWeather: '오늘의 날씨', vbNews: '마을 소식', vbReqs: '주민 부탁', vbGive: '전달', vbDone: '완료 ✅', vbHave: '보유 {n}',
  vw_sun: '☀️ 맑음', vw_cloud: '⛅ 구름 조금', vw_rain: '🌧️ 비', vw_hot: '🥵 무더위', vw_snow: '❄️ 눈', vw_blossom: '🌸 꽃바람', vw_leaf: '🍂 낙엽 바람',
  vseason0: '봄', vseason1: '여름', vseason2: '가을', vseason3: '겨울', vbSeason: '{s} · {d}일차',
  vn0: '공원 벤치에서 길고양이가 낮잠을 잤대요 🐈', vn1: '씨앗 가게에 새 씨앗이 들어왔대요 🌱', vn2: '펫 카페 케이크가 맛있다는 소문이 났어요 🍰', vn3: '오늘은 산책하기 좋은 날이에요 🐕', vn4: '병원 선생님이 예방접종을 권해요 💉',
  vn5: '마을 아이들이 강아지랑 술래잡기를 했대요 🏃', vn6: '누군가 호숫가에서 큰 물고기를 봤대요 🐟', vn7: '사장님 가게 동물들이 제일 귀엽대요 💕', vn8: '밤에는 가로등이 예쁘게 켜져요 🏮', vn9: '오늘도 좋은 하루 보내세요! 😊',
  vwho: ['', '빵집 할머니', '우체부 아저씨', '꼬마 민수', '도서관 언니', '화가 아저씨', '카페 단골', '옆집 할아버지', '학교 선생님', '꽃집 사장님', '낚시꾼 아저씨', '요리사 누나', '이장님'],
  vbReq: '{w}: "{i} {n}개만 구해 주세요!"', vbReq_sell: '{w}: "펫을 {n}마리 분양해 주세요! 동네에 반려동물이 늘면 좋겠어요"', vbReq_serve: '{w}: "손님 {n}명을 도와주세요! 가게가 북적이면 좋겠어요"', vbReq_sp: '{w}: "키우고 싶은 이웃이 있어요. {sp} 한 마리를 분양해 주세요!"', vbReq_groom: '{w}: "우리 가게 아이 {n}마리를 예쁘게 다듬어 주세요! (펫 정보 → ✂️ 미용, 미용 키트 필요)"', vbReq_harvest: '{w}: "농장에서 작물 {n}개를 수확해 주세요!"', vbReq_cafe: '{w}: "카페 손님 {n}명에게 음식을 내 주세요!"', vbReq_hosp: '{w}: "병원에서 아픈 동물 {n}마리를 치료해 주세요!"', vbReq_salon: '{w}: "미용실 손님 {n}명을 예쁘게 꾸며 주세요!"', vbProg: '진행 {a}/{n}', vbClaim: '보상 받기', vNotYet: '아직 조건을 채우지 못했어요', vbDue0: '⏰ 오늘까지', vbDue1: '내일까지', vbBonusBar: '🎁 {d} 부탁 3개를 모두 끝내면 보너스 🪙{c} ({a}/3)', vbToday: '오늘', vbYday: '어제', vbBonusGot: '🎁 {d} 보너스 받았어요!', vbBonusT: ' + 🎟️', vBonus: '🎁 3개 모두 완료! 보너스까지 🪙{c} 받았어요', vBonusT: '🎁 3개 모두 완료! 보너스 🪙{c} + 🎟️ 뽑기 티켓!', vbAllDone: '오늘 부탁은 모두 끝났어요! 내일 새 부탁이 올라와요'
});
Object.assign(I18N.ru, {
  vlot_avenue: 'Место под аллею', vlot_lake: 'Место под озеро', vlot_monu: 'Место под памятник', vboardName: 'Доска объявлений',
  vbuild_avenue: 'Посадить сакуры и фонари вдоль дороги? 🪙{c}\nКаждую неделю меняется сезон (весна → лето → осень → зима).',
  vbuild_lake: 'Сделать в деревне озеро? 🪙{c}\nКрасный мостик, лодка-лебедь, беседка и рыбак.',
  vbuild_monu: 'Построить площадь-памятник для двоих? 🪙{c}\nСтатуя, держащаяся за руки, скамейка-сердце и клумба из роз. Напишите надпись для статуи.',
  vbuilt_avenue: '🌸 Аллея готова!', vbuilt_lake: '🦢 Озеро готово!', vbuilt_monu: '💑 Памятник готов!', vBuildBtn: 'Построить',
  vlakeHi: '🦢 Пара в лодке-лебеде выглядит счастливой', vmonuHi: '💗 «{t}»', vNeedItem: 'Нужно {i} ×{n} (склад фермы)', vDelivered: 'Просьба выполнена! 🪙{c}',
  vbTitle: '📋 Доска объявлений', vbWeather: 'Погода', vbNews: 'Новости', vbReqs: 'Просьбы жителей', vbGive: 'Отдать', vbDone: 'Готово ✅', vbHave: 'Есть {n}',
  vw_sun: '☀️ Ясно', vw_cloud: '⛅ Облачно', vw_rain: '🌧️ Дождь', vw_hot: '🥵 Жара', vw_snow: '❄️ Снег', vw_blossom: '🌸 Цветёт', vw_leaf: '🍂 Листопад',
  vseason0: 'Весна', vseason1: 'Лето', vseason2: 'Осень', vseason3: 'Зима', vbSeason: '{s} · день {d}',
  vn0: 'Уличный кот спал на скамейке в парке 🐈', vn1: 'В лавку привезли новые семена 🌱', vn2: 'Говорят, в пет-кафе вкусные торты 🍰', vn3: 'Отличный день для прогулки 🐕', vn4: 'Врач советует сделать прививки 💉',
  vn5: 'Дети играли в догонялки со щенком 🏃', vn6: 'Кто-то видел большую рыбу в озере 🐟', vn7: 'В нашем магазине самые милые зверята 💕', vn8: 'Ночью красиво горят фонари 🏮', vn9: 'Хорошего дня! 😊',
  vwho: ['', 'Бабушка-пекарь', 'Почтальон', 'Малыш Миша', 'Библиотекарь', 'Художник', 'Гость кафе', 'Дедушка-сосед', 'Учительница', 'Цветочница', 'Рыбак', 'Повар', 'Староста'],
  vbReq: '{w}: «Найдите, пожалуйста, {i} ×{n}!»', vbReq_sell: '{w}: «Продайте {n} питомц.! Пусть в городе будет больше животных»', vbReq_serve: '{w}: «Помогите {n} покупателям!»', vbReq_sp: '{w}: «Соседи хотят питомца: {sp}. Продайте одного!»', vbReq_groom: '{w}: «Сделайте груминг {n} питомц.! (карточка питомца → ✂️, нужен набор)»', vbReq_harvest: '{w}: «Соберите {n} шт. урожая на ферме!»', vbReq_cafe: '{w}: «Подайте еду {n} гостям кафе!»', vbReq_hosp: '{w}: «Вылечите {n} животных в клинике!»', vbReq_salon: '{w}: «Обслужите {n} клиентов салона!»', vbProg: 'Прогресс {a}/{n}', vbClaim: 'Забрать', vNotYet: 'Условие ещё не выполнено', vbDue0: '⏰ до конца дня', vbDue1: 'до завтра', vbBonusBar: '🎁 {d}: выполните все 3 просьбы — бонус 🪙{c} ({a}/3)', vbToday: 'Сегодня', vbYday: 'Вчера', vbBonusGot: '🎁 {d}: бонус получен!', vbBonusT: ' + 🎟️', vBonus: '🎁 Все 3 выполнены! Получено 🪙{c}', vBonusT: '🎁 Все 3 выполнены! 🪙{c} + 🎟️ билет', vbAllDone: 'Все просьбы выполнены! Завтра будут новые'
});
