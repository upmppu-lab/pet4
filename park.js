// ================= v9.89: the village park (north-east, across the road) =================
// Not a business: a big, expensive landmark to decorate the empty village. Before it is built the lot
// shows a dashed outline, a few survey stakes and a signpost; tapping the signpost offers to build it.
const PARK_COST = 1000000;
const PARK_W = 16, PARK_D = 14;
const PARK_POS = () => { const L = LAY('park'); return L ? { x: L.x, y: L.y, w: PARK_W, d: PARK_D } : { x: LAY_FAR, y: LAY_FAR, w: PARK_W, d: PARK_D }; }; // PET TOWN: wherever the player built it
const PARK_SIGN = () => { const p = PARK_POS(); return { x: p.x + 1, y: p.y + 9 }; };
const PARK = (() => {
  // ---- layout, in lot-local tiles (u east, v south) ----
  // v2026-10-09: "길과 공원 사이에 빈 간격" 수정으로 ground()의 그림 크기/위치 공식이 바뀌면서,
  // 그림 속 실제 나무/벤치/분수/연못/놀이터 위치도 타일 좌표상에서 달라짐(그림 픽셀 위치는 그대로
  // 유지한 채 환산). PNG가 준비된 상태(parkReady)에서는 이 좌표들이 충돌(solid) 판정에만 쓰이므로,
  // 실제로 보이는 그림의 나무/분수/연못/놀이터 자리와 겹치도록 다시 환산한 값으로 갱신.
  const TREES = [[.1, -.1, 'oak'], [3.8, -.5, 'pine'], [-.1, 3.6, 'sakura'], [16, 7.9, 'oak'], [16.3, 13.4, 'sakura'], [10.5, 13.6, 'oak'], [7.1, -.3, 'sakura'], [1.6, 14.1, 'pine'], [17, -.1, 'pine']];
  const BENCH = [[4.5, 4, 0], [12.4, 10.3, 0], [11.7, 3.9, 1]];
  const LAMPS = [[5.9, 5.2], [11.2, 5.2], [5.9, 9.1], [11.2, 9.1], [1.4, 8.2], [9.6, 13.2]];
  const FOUNT = { u: 6.4, v: 5.4, w: 2.4, d: 2.4 };
  const POND = { u: 14.6, v: 2.8, ru: 2.6, rv: 2.0 };
  const PLAY = { u: .6, v: 8, w: 3.6, d: 2.9 };
  const BEDS = [[11.7, .2, 2.9, 1], [5.4, 11.7, 2.4, 1], [13.6, 12, 1.7, 1]];
  const WALKERS = [{ seed: 11, sp: 'shiba', r: 3.4, sp0: .16, ph: 0 }, { seed: 23, sp: 'poodle', r: 3.4, sp0: .16, ph: 2.6 }, { seed: 37, sp: null, r: 5.3, sp0: .11, ph: 1.2 }, { seed: 58, sp: 'corgi', r: 5.3, sp0: -.1, ph: 4.4 }];
  // hand-painted park artwork (v2026-10-08): replaces the procedural ground+props once loaded.
  // Preserves the natural image aspect ratio without affine distortion or shear.
  // Falls back to the old procedural drawing while the image is still loading or if it's missing.
  const parkUrl = (typeof assetUrl === 'function') ? assetUrl('spr/park.png') : 'spr/park.png';
  const PARK_IMG = (typeof ASSET_CACHE !== 'undefined') ? ASSET_CACHE.load(parkUrl) : ((typeof Image !== 'undefined') ? new Image() : null);
  if (PARK_IMG && !PARK_IMG.src) {
    PARK_IMG.crossOrigin = 'anonymous';
    PARK_IMG.src = parkUrl;
  }
  const isBuilt = () => !!(typeof S !== 'undefined' && S && S.park && S.park.built);
  // solid tiles (world coords) so people walk around the trees, the fountain, the pond, the playground and the benches
  function solid() {
    const p = PARK_POS(), set = new Set(), add = (u, v) => set.add(Math.floor(p.x + u) + ',' + Math.floor(p.y + v));
    if (!isBuilt()) { const sg = PARK_SIGN(); set.add(Math.floor(sg.x) + ',' + Math.floor(sg.y)); return set; }
    for (const [u, v] of TREES) add(u, v);
    for (let u = FOUNT.u; u < FOUNT.u + FOUNT.w; u++) for (let v = FOUNT.v; v < FOUNT.v + FOUNT.d; v++) add(u, v);
    for (let u = Math.floor(POND.u - POND.ru); u <= POND.u + POND.ru; u++) for (let v = Math.floor(POND.v - POND.rv); v <= POND.v + POND.rv; v++) { const du = (u + .5 - POND.u) / POND.ru, dv = (v + .5 - POND.v) / POND.rv; if (du * du + dv * dv < 1) add(u, v); }
    for (let u = PLAY.u; u < PLAY.u + PLAY.w; u++) for (let v = PLAY.v; v < PLAY.v + PLAY.d; v++) add(u, v);
    for (const [u, v, r] of BENCH) { add(u, v); add(u + (r ? 0 : 1), v + (r ? 1 : 0)); }
    return set;
  }
  // ---- drawing helpers (world grid -> screen) ----
  const Q = (x, y, z) => [ISO.wx(x, y), ISO.wy(x, y) - (z || 0)];
  function quad(c, pts, col, st, lw) { c.beginPath(); pts.forEach((q, i) => i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); c.closePath(); if (col) { c.fillStyle = col; c.fill(); } if (st) { c.lineWidth = lw || 1; c.strokeStyle = st; c.stroke(); } }
  const rect = (c, x0, y0, x1, y1, col, st, z) => quad(c, [Q(x0, y0, z), Q(x1, y0, z), Q(x1, y1, z), Q(x0, y1, z)], col, st);
  function gEll(c, cx, cy, ru, rv, col, st, lw) { c.beginPath(); for (let i = 0; i <= 36; i++) { const a = i / 36 * Math.PI * 2, q = Q(cx + Math.cos(a) * ru, cy + Math.sin(a) * rv); i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]); } c.closePath(); if (col) { c.fillStyle = col; c.fill(); } if (st) { c.lineWidth = lw || 1; c.strokeStyle = st; c.stroke(); } }
  const at = (c, x, y, fn) => { c.save(); c.translate(ISO.wx(x, y), ISO.wy(x, y)); fn(); c.restore(); };
  const emo = (c, e, x, y, s) => { c.font = (s || 12) + 'px sans-serif'; c.textAlign = 'center'; c.fillText(e, x, y); c.textAlign = 'start'; };
  // ---- ground layer: lawn, paths, pond, flower beds, back hedges (all under props and people) ----
  function ground(c, T) {
    const p = PARK_POS(), x0 = p.x, y0 = p.y, x1 = x0 + p.w, y1 = y0 + p.d;
    c.save();
    if (!isBuilt()) { // the empty lot: rougher grass, a dashed survey outline and corner stakes
      rect(c, x0, y0, x1, y1, 'rgba(120,160,70,.28)');
      c.setLineDash([10, 7]); rect(c, x0 + .1, y0 + .1, x1 - .1, y1 - .1, null, 'rgba(255,255,255,.85)'); c.lineWidth = 2.2; c.stroke(); c.setLineDash([]);
      for (const [x, y] of [[x0, y0], [x1, y0], [x1, y1], [x0, y1]]) at(c, x, y, () => { c.fillStyle = '#b98552'; c.fillRect(-1.5, -14, 3, 14); c.fillStyle = '#ff7a5a'; c.fillRect(-4, -16, 8, 4); });
      c.restore(); return;
    }
    const parkReady = PARK_IMG && PARK_IMG.complete && PARK_IMG.naturalWidth > 0;
    if (parkReady) {
      const [nx, ny] = Q(p.x, p.y);
      const dw = (p.w + p.d) * 32;
      // v2026-10-09: "길과 공원 사이에 빈 간격" -- park.png의 실제 그림은 캔버스(1774x887) 전체가
      // 아니라 안쪽 콘텐츠 영역(약 139,57 ~ 1615,808)에만 그려져 있어서, 캔버스 전체를 부지 크기에
      // 맞추면 그림이 부지보다 작게 나와 길과 사이에 틈이 생겼음. 콘텐츠 영역 기준으로 다시 늘려서
      // 부지 가장자리까지 꽉 차게 그림.
      const iw = PARK_IMG.naturalWidth || 1419, ih = PARK_IMG.naturalHeight || 710;
      // v2026-10-10 (3rd pass): 꼭짓점 최소자승 방식이 북서쪽에 여전히 갭을 남겨서, 그림 전체
      // 캔버스(거의 정확히 2:1 비율)를 타일의 bounding box에 그대로 맞추는 더 단순하고 안정적인
      // 방식으로 교체함 (동물원과 동일한 방식).
      const scale = (p.w + p.d) * 32 / iw; // uniform -- whole-canvas-to-tile-bbox fit, preserves true 2:1 isometric proportions
      const imgW = iw * scale, imgH = ih * scale;
      const imgX = -p.d * 32;
      const imgY = 0;
      c.save();
      c.translate(nx, ny);
      c.drawImage(PARK_IMG, imgX, imgY, imgW, imgH);
      c.restore();
      c.restore();
      return;
    }
    // lawn with mowing stripes
    rect(c, x0, y0, x1, y1, '#7fbf57');
    for (let v = 0; v < p.d; v += 2) rect(c, x0, y0 + v, x1, y0 + v + 1, 'rgba(255,255,255,.07)');
    // paths: west gate -> plaza -> east, south gate -> plaza, and a ring round the plaza
    const PATH = '#e9d8b4', EDGE = 'rgba(150,120,80,.45)';
    gEll(c, x0 + 8, y0 + 7, 5.9, 5.1, PATH, EDGE, 1.2); gEll(c, x0 + 8, y0 + 7, 4.7, 3.9, '#7fbf57', EDGE, 1.2);
    rect(c, x0, y0 + 6.3, x0 + 16, y0 + 7.7, PATH, EDGE); rect(c, x0 + 7.3, y0 + 7, x0 + 8.7, y1, PATH, EDGE);
    gEll(c, x0 + 8, y0 + 7, 2.6, 2.6, '#efe2c4', EDGE, 1.2);
    for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; gEll(c, x0 + 8 + Math.cos(a) * 2.2, y0 + 7 + Math.sin(a) * 2.2, .16, .16, 'rgba(190,160,110,.35)'); } // paving dots
    for (let u = .5; u < 16; u += 1) if (u < 5.5 || u > 10.5) { const q = Q(x0 + u, y0 + 7); c.fillStyle = 'rgba(190,160,110,.35)'; c.fillRect(q[0] - 1, q[1] - 1, 2, 2); }
    // pond with lily pads and ducks
    gEll(c, x0 + POND.u, y0 + POND.v, POND.ru + .25, POND.rv + .25, '#c9b48a', 'rgba(110,85,55,.5)', 1.2);
    gEll(c, x0 + POND.u, y0 + POND.v, POND.ru, POND.rv, '#6fb8e0');
    gEll(c, x0 + POND.u - .3, y0 + POND.v - .3, POND.ru * .6, POND.rv * .5, 'rgba(255,255,255,.18)');
    for (const [du, dv] of [[-1.2, .6], [.9, -.8], [1.3, .7]]) { const q = Q(x0 + POND.u + du, y0 + POND.v + dv); ART.ell(c, q[0], q[1], 6, 3, '#5aa64a', 'rgba(30,70,30,.5)', .7); }
    for (let i = 0; i < 3; i++) { const a = T * .25 + i * 2.1, q = Q(x0 + POND.u + Math.cos(a) * POND.ru * .6, y0 + POND.v + Math.sin(a) * POND.rv * .55), dir = Math.sin(a) > 0 ? 1 : -1;
      c.save(); c.translate(q[0], q[1] + Math.sin(T * 3 + i) * .6); c.scale(dir, 1); ART.ell(c, 0, -2, 6, 3.5, i === 2 ? '#fff4b0' : '#fff', 'rgba(60,60,60,.6)', .7); ART.ell(c, 5, -6, 3, 3, i === 2 ? '#fff4b0' : '#fff', 'rgba(60,60,60,.6)', .7); c.fillStyle = '#ffa53a'; c.beginPath(); c.moveTo(7.5, -6); c.lineTo(10.5, -5.4); c.lineTo(7.5, -4.6); c.fill(); c.fillStyle = '#222'; c.fillRect(5.5, -7, 1.2, 1.2); c.restore(); }
    // flower beds
    const FL = ['#ff7a9a', '#ffd166', '#b59be0', '#ff9e5a', '#fff'];
    for (const [u, v, w, d] of BEDS) { rect(c, x0 + u, y0 + v, x0 + u + w, y0 + v + d, '#8a6040', 'rgba(70,45,25,.5)'); for (let i = 0; i < w * 5; i++) { const q = Q(x0 + u + .15 + (i % (w * 5)) / 5, y0 + v + .2 + (i % 3) * .22); ART.ell(c, q[0], q[1] - 3, 2.6, 2.6, FL[(i + Math.floor(u)) % 5], 'rgba(60,38,25,.35)', .5); } }
    // picnic blanket
    rect(c, x0 + 11.2, y0 + 11.6, x0 + 12.8, y0 + 12.9, '#ff8a8a', 'rgba(120,40,40,.4)'); for (let i = 1; i < 4; i++) { quad(c, [Q(x0 + 11.2 + i * .4, y0 + 11.6), Q(x0 + 11.4 + i * .4, y0 + 11.6), Q(x0 + 11.4 + i * .4, y0 + 12.9), Q(x0 + 11.2 + i * .4, y0 + 12.9)], 'rgba(255,255,255,.55)'); }
    { const q = Q(x0 + 12, y0 + 12.2); emo(c, '🧺', q[0] - 6, q[1] + 2, 12); emo(c, '🍉', q[0] + 9, q[1] + 4, 9); }
    // hedges along the two back edges (north + west, leaving the west gate open)
    const hedge = (ax, ay, bx, by) => { const H = 12; quad(c, [Q(ax, ay, H), Q(bx, by, H), Q(bx, by), Q(ax, ay)], '#4f9a44', 'rgba(30,60,30,.5)'); const L = Math.hypot(bx - ax, by - ay); for (let i = 0; i < L * 3; i++) { const u = i / (L * 3), q = Q(ax + (bx - ax) * u, ay + (by - ay) * u, H); ART.ell(c, q[0], q[1], 5, 3.5, i % 2 ? '#5fae52' : '#6cbb5c'); } };
    hedge(x0, y0, x1, y0); hedge(x0, y0, x0, y0 + 6.2); hedge(x0, y0 + 7.8, x0, y1);
    // low flower border on the two front edges (east + south, leaving the south gate open)
    const border = (ax, ay, bx, by) => { const L = Math.hypot(bx - ax, by - ay); for (let i = 0; i <= L * 3; i++) { const u = i / (L * 3), q = Q(ax + (bx - ax) * u, ay + (by - ay) * u); ART.ell(c, q[0], q[1] - 2, 3.5, 2.5, '#5fae52'); ART.ell(c, q[0], q[1] - 4, 1.8, 1.8, FL[i % 4]); } };
    border(x1, y0, x1, y1); border(x0, y1, x0 + 7.2, y1); border(x0 + 8.8, y1, x1, y1);
    c.restore();
  }
  // ---- props (depth-sorted with people) ----
  function tree(c, kind, T, i) {
    const sw = Math.sin(T * 1.1 + i) * 1.3;
    ART.ell(c, 0, 0, 26, 12, 'rgba(0,0,0,.15)');
    c.fillStyle = '#8a5a3b'; c.fillRect(-4.5, -58, 9, 58); c.strokeStyle = ART.OUT; c.lineWidth = 1.1; c.strokeRect(-4.5, -58, 9, 58);
    c.strokeStyle = '#6e4429'; c.lineWidth = .9; c.beginPath(); c.moveTo(-1.5, -2); c.lineTo(-1.5, -54); c.stroke();
    if (kind === 'pine') {
      for (let k = 0; k < 3; k++) {
        c.beginPath(); c.moveTo(-30 + k * 6 + sw * .3, -52 - k * 22); c.lineTo(sw, -96 - k * 22); c.lineTo(30 - k * 6 + sw * .3, -52 - k * 22); c.closePath();
        c.fillStyle = ['#3f8a4a', '#4a9a55', '#57aa60'][k]; c.fill(); c.strokeStyle = 'rgba(20,50,25,.6)'; c.stroke();
      }
      return;
    }
    const col = kind === 'sakura' ? ['#f6a8c4', '#ffc4d8', '#ffe0ea'] : ['#4f9a44', '#62b152', '#7cc766'];
    for (const [dx, dy, r, k] of [[-18, -68, 20, 0], [18, -70, 20, 0], [0, -88, 24, 1], [-10, -78, 17, 2], [11, -94, 15, 2]]) {
      ART.ell(c, dx + sw, dy, r, r * .85, col[k], k ? null : 'rgba(40,60,30,.35)', .8);
    }
    if (kind === 'sakura') for (let k = 0; k < 4; k++) { const f = (T * .4 + k * .33 + i * .17) % 1; ART.ell(c, -22 + k * 15 + Math.sin(T + k) * 6, -55 + f * 55, 2.2, 1.6, '#ffb3cc'); }
    else { for (const [dx, dy] of [[-14, -76], [10, -84], [2, -68], [-4, -92]]) ART.ell(c, dx + sw, dy, 2.8, 2.8, '#ff6a5a'); }
  }
  function lamp(c, T) {
    c.fillStyle = '#3e4a5a'; c.fillRect(-2, -62, 4, 62); ART.ell(c, 0, 0, 6, 3, '#3e4a5a');
    const on = typeof S !== 'undefined' && S.clock && (S.clock.m >= 1080 || S.clock.m < 360);
    ART.rrect(c, -7, -76, 14, 14, 3); c.fillStyle = on ? '#fff3b0' : '#e8f0f6'; c.fill(); c.strokeStyle = '#3e4a5a'; c.lineWidth = 1.5; c.stroke(); c.beginPath(); c.moveTo(-9, -76); c.lineTo(0, -83); c.lineTo(9, -76); c.closePath(); c.fillStyle = '#3e4a5a'; c.fill();
    if (on) { const g = c.createRadialGradient(0, -69, 2, 0, -69, 34); g.addColorStop(0, 'rgba(255,240,170,.45)'); g.addColorStop(1, 'rgba(255,240,170,0)'); c.fillStyle = g; c.beginPath(); c.arc(0, -69, 34, 0, Math.PI * 2); c.fill(); }
  }
  function fountain(c, T) {
    const box = FURN.box, P = FURN.P;
    const [x, y] = P(1, 1, 0);
    ART.ell(c, x, y, 58, 29, '#cfd6dc', ART.OUT, 1.3); ART.ell(c, x, y - 6, 58, 29, '#e3e8ec', ART.OUT, 1.3); ART.ell(c, x, y - 7, 50, 24, '#7cc3ea');
    for (let i = 0; i < 3; i++) { const k = (T * .6 + i / 3) % 1; ART.ell(c, x, y - 7, 18 + k * 30, 9 + k * 15, null, `rgba(255,255,255,${.5 * (1 - k)})`, 1); }
    c.fillStyle = '#d6dde2'; c.fillRect(x - 5, y - 40, 10, 34); c.strokeStyle = ART.OUT; c.lineWidth = 1; c.strokeRect(x - 5, y - 40, 10, 34);
    ART.ell(c, x, y - 40, 24, 11, '#e3e8ec', ART.OUT, 1.2); ART.ell(c, x, y - 41, 20, 8, '#8fd0f5');
    c.fillStyle = '#d6dde2'; c.fillRect(x - 3, y - 58, 6, 18); ART.ell(c, x, y - 58, 9, 4, '#e3e8ec', ART.OUT, 1);
    for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2, k = (T * 1.5 + i * .1) % 1; const px = x + Math.cos(a) * 16 * k, py = y - 60 - 16 * Math.sin(k * Math.PI) + Math.sin(a) * 5 * k; ART.ell(c, px, py, 1.6, 2.2, 'rgba(180,225,250,.9)'); }
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + .3, k = (T * 1.1 + i * .17) % 1; ART.ell(c, x + Math.cos(a) * (20 + 14 * k), y - 38 + 30 * k * k + Math.sin(a) * 6, 1.4, 2, 'rgba(180,225,250,.85)'); }
  }
  function playground(c, T) { // slide + swing set
    const box = FURN.box, P = FURN.P;
    ART.ell(c, ...P(1.5, 1.2, 0), 60, 26, 'rgba(230,200,140,.55)');
    // swing frame
    for (const [x, y] of [[1.7, .2], [1.7, 1.1], [2.9, .2], [2.9, 1.1]]) { const a = P(x, y, 0), b = P(x < 2 ? 1.75 : 2.85, .65, 44); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.lineWidth = 3; c.strokeStyle = '#e0604e'; c.stroke(); }
    { const a = P(1.75, .65, 44), b = P(2.85, .65, 44); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.lineWidth = 3.5; c.strokeStyle = '#c84a3a'; c.stroke(); }
    for (let i = 0; i < 2; i++) { const sw = Math.sin(T * 2 + i * 1.7) * 7, top = P(2.05 + i * .5, .65, 44); c.save(); c.translate(top[0], top[1]); c.beginPath(); c.moveTo(-4, 0); c.lineTo(-4 + sw, 32); c.moveTo(4, 0); c.lineTo(4 + sw, 32); c.lineWidth = 1; c.strokeStyle = '#666'; c.stroke(); ART.rrect(c, -6 + sw, 31, 12, 4, 1.5); c.fillStyle = i ? '#7ac7ff' : '#ffd24a'; c.fill(); c.strokeStyle = ART.OUT; c.stroke(); c.restore(); }
    // slide
    box(c, .2, 1.3, .5, .5, 34, '#ffd24a'); for (let i = 0; i < 4; i++) box(c, .72, 1.4 + i * .08, .08, .3, 2, '#8a95a3', 6 + i * 8);
    const s0 = P(.45, 1.55, 34), s1 = P(.45, 2.35, 2), s2 = P(.2, 2.35, 2), s3 = P(.2, 1.55, 34); c.beginPath(); c.moveTo(s3[0], s3[1]); c.lineTo(s0[0], s0[1]); c.lineTo(s1[0] + 8, s1[1]); c.lineTo(s2[0] + 8, s2[1]); c.closePath(); c.fillStyle = '#7ac7ff'; c.fill(); c.strokeStyle = ART.OUT; c.lineWidth = 1.1; c.stroke();
  }
  function gate(c, T) { // wooden arch over the west entrance with the park's name
    const box = FURN.box, P = FURN.P;
    box(c, 0, 0, .25, .25, 70, '#b98552'); box(c, 0, 1.75, .25, .25, 70, '#b98552');
    box(c, -.05, -.05, .35, 2.1, 8, '#9a6a3f', 70);
    const q = [P(.12, .3, 66), P(.12, 1.7, 66), P(.12, 1.7, 46), P(.12, .3, 46)]; c.beginPath(); q.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); c.fillStyle = '#fff3d6'; c.fill(); c.strokeStyle = ART.OUT; c.lineWidth = 1.3; c.stroke();
    const m = P(.12, 1, 56); c.save(); c.translate(m[0], m[1]); c.transform(1, .5, 0, 1, 0, 0); c.font = 'bold 10px sans-serif'; c.textAlign = 'center'; c.fillStyle = '#4f8a3a'; c.fillText('🌳 ' + t('parkName'), 0, 3); c.restore();
    for (const [u, v] of [[.12, .3], [.12, 1.7]]) { const f = P(u, v, 70); ART.ell(c, f[0], f[1] - 2, 5, 5, '#ff9ec0', ART.OUT, .8); }
  }
  function walker(c, T, w, i) { // a villager strolling round the plaza ring, some with a dog on a lead
    const p = PARK_POS(), a = T * w.sp0 + w.ph, x = p.x + 8 + Math.cos(a) * w.r * 1.07, y = p.y + 7 + Math.sin(a) * w.r * .88;
    const vx = -Math.sin(a) * Math.sign(w.sp0), vy = Math.cos(a) * Math.sign(w.sp0), dir = vx - vy > 0 ? 1 : -1, face = vx + vy < 0 ? 1 : 0;
    const look = walker.looks[i] || (walker.looks[i] = ART.randomHuman(w.seed));
    return { depth: x + y, fn: () => {
      if (w.sp) { const dx = x - vy * .45 + vx * .5, dy = y + vx * .45 + vy * .5; at(c, dx, dy, () => { c.scale(dir * .82, .82); ART.pet(c, w.sp, { t: T, mood: 'happy', seed: 'park' + i, age: 1, walk: true }); }); const h0 = [ISO.wx(x, y) + dir * 8, ISO.wy(x, y) - 28], h1 = [ISO.wx(dx, dy), ISO.wy(dx, dy) - 10]; c.beginPath(); c.moveTo(h0[0], h0[1]); c.quadraticCurveTo((h0[0] + h1[0]) / 2, Math.max(h0[1], h1[1]) + 6, h1[0], h1[1]); c.strokeStyle = '#e0604e'; c.lineWidth = 1; c.stroke(); }
      at(c, x, y, () => { c.scale(dir, 1); ART.human(c, look, face, T * 1.3 + i, true, 'happy'); });
    } };
  }
  walker.looks = [];
  function sign(c, T) { // a big wooden signpost: "park site" + the price, with a bouncing tap hint
    c.fillStyle = '#8a5a33'; c.fillRect(-3, -50, 6, 50); c.fillRect(-26, -50, 5, 50);
    ART.rrect(c, -52, -104, 104, 58, 8); c.fillStyle = '#9a6a3f'; c.fill(); c.lineWidth = 1.8; c.strokeStyle = ART.OUT; c.stroke();
    ART.rrect(c, -47, -99, 94, 48, 6); c.fillStyle = '#fff3d6'; c.fill();
    c.textAlign = 'center'; c.font = '18px sans-serif'; c.fillText('🌳🌸⛲', 0, -79); c.font = 'bold 11px sans-serif'; c.fillStyle = '#4f8a3a'; c.fillText(t('parkLot'), 0, -66);
    c.font = 'bold 10px sans-serif'; c.fillStyle = '#9a6a10'; c.fillText('🪙 ' + fmt(PARK_COST), 0, -55);
    const b = Math.sin(T * 3) * 3; c.font = '16px sans-serif'; c.fillText('👆', 44, -108 + b); c.textAlign = 'start';
  }
  // world.js calls this every frame; push({depth, fn}) entries into the depth-sorted draw list
  function collect(c, T, addHit) {
    const p = PARK_POS(), out = [];
    if (!isBuilt()) { const sg = PARK_SIGN(); out.push({ depth: sg.x + sg.y + .5, fn: () => { at(c, sg.x + .5, sg.y + .5, () => sign(c, T)); const sx = ISO.wx(sg.x + .5, sg.y + .5), sy = ISO.wy(sg.x + .5, sg.y + .5); addHit({ kind: 'parksign', x0: sx - 56, x1: sx + 56, y0: sy - 110, y1: sy + 6 }); } }); return out; }
    const parkReady = PARK_IMG && PARK_IMG.complete && PARK_IMG.naturalWidth > 0;
    if (parkReady) {
      // the trees/fountain/benches/gate are all painted into the ground image now; just keep a tap zone
      // near the gate so tapping the park still shows the parkHello toast. Real villagers (not WALKERS)
      // are drawn separately by town.js's villagerStep, on top of this image.
      out.push({ depth: p.x + p.y + 6.5, fn: () => { const sx = ISO.wx(p.x, p.y + 7), sy = ISO.wy(p.x, p.y + 7); addHit({ kind: 'park', x0: sx - 60, x1: sx + 60, y0: sy - 90, y1: sy + 40 }); } });
      return out;
    }
    TREES.forEach(([u, v, k], i) => out.push({ depth: p.x + u + p.y + v + .9, fn: () => at(c, p.x + u + .5, p.y + v + .5, () => tree(c, k, T, i)) }));
    for (const [u, v, r] of BENCH) out.push({ depth: p.x + u + p.y + v + 1.4, fn: () => at(c, p.x + u, p.y + v, () => benchDraw(c, r)) });
    for (const [u, v] of LAMPS) out.push({ depth: p.x + u + p.y + v, fn: () => at(c, p.x + u, p.y + v, () => lamp(c, T)) });
    out.push({ depth: p.x + FOUNT.u + p.y + FOUNT.v + 3, fn: () => at(c, p.x + FOUNT.u, p.y + FOUNT.v, () => fountain(c, T)) });
    out.push({ depth: p.x + PLAY.u + p.y + PLAY.v + 3.5, fn: () => at(c, p.x + PLAY.u, p.y + PLAY.v, () => playground(c, T)) });
    out.push({ depth: p.x + p.y + 6.5, fn: () => { at(c, p.x - .15, p.y + 6, () => gate(c, T)); const sx = ISO.wx(p.x, p.y + 7), sy = ISO.wy(p.x, p.y + 7); addHit({ kind: 'park', x0: sx - 40, x1: sx + 40, y0: sy - 100, y1: sy + 10 }); } });
    WALKERS.forEach((w, i) => out.push(walker(c, T, w, i)));
    return out;
  }
  function benchDraw(c, r) { // benches along the paths; r=1 turns it 90° (mirrored in screen space)
    const box = FURN.box;
    if (r) { for (const [x, y] of [[.25, .1], [.75, .1], [.25, 1.8], [.75, 1.8]]) box(c, x, y, .08, .08, 12, '#555b66'); box(c, .3, .05, .5, 1.9, 3, '#c8864a', 12); box(c, .25, .05, .08, 1.9, 16, '#b8763a', 16); return; }
    for (const [x, y] of [[.1, .25], [1.8, .25], [.1, .75], [1.8, .75]]) box(c, x, y, .08, .08, 12, '#555b66'); box(c, .05, .3, 1.9, .5, 3, '#c8864a', 12); box(c, .05, .25, 1.9, .08, 16, '#b8763a', 16);
  }
  function apply(s, a) {
    if (a.t !== 'buildpark') return undefined;
    if (!(s.lay && s.lay.park)) return { err: 'tUseBuildMenu' }; // PET TOWN: only from the build menu, after choosing the spot
    if (s.park && s.park.built) return { err: 'gone' };
    if (s.coins < PARK_COST) return { err: 'notEnough' };
    s.coins -= PARK_COST; s.park = { built: true, day: s.clock ? s.clock.day : 0 };
    return { ok: 1, fx: 'coin', msg: 'parkBuilt' };
  }
  return { ground, collect, solid, apply, isBuilt };
})();
Object.assign(I18N.ko, { parkName: '우리 마을 공원', parkLot: '공원 부지', parkBuildConfirm: '마을에 커다란 공원을 지을까요? 🪙{c}\n분수, 연못, 놀이터, 벚꽃나무, 산책로가 생기고 주민들이 산책하러 와요.', parkBuildBtn: '공원 짓기', parkBuilt: '🌳 공원이 완성됐어요! 주민들이 산책하러 와요', parkHello: '🌳 공원에서 산책하는 사람들이 많아요. 기분 좋은 하루!', parkNeedCoins: '공원을 지으려면 🪙{c}이 필요해요' });
Object.assign(I18N.ru, { parkName: 'Парк деревни', parkLot: 'Место под парк', parkBuildConfirm: 'Построить в деревне большой парк? 🪙{c}\nФонтан, пруд, детская площадка, сакуры и дорожки — жители будут приходить гулять.', parkBuildBtn: 'Построить парк', parkBuilt: '🌳 Парк готов! Жители пришли погулять', parkHello: '🌳 В парке гуляет много людей. Хороший день!', parkNeedCoins: 'Для парка нужно 🪙{c}' });
