// ================= Isometric furniture & room art =================
const TW = 64, TH = 32;
const ISO = {
  sx: (x, y) => (x - y) * TW / 2,
  sy: (x, y) => (x + y) * TH / 2,
};
// ---- view rotation (0..3, 90° steps). World logic stays in world grid coords; only drawing/input is rotated.
const VIEW = { r: 0, W: 8, H: 8 };
VIEW.odd = () => VIEW.r % 2 === 1;
VIEW.dims = () => VIEW.odd() ? [VIEW.H, VIEW.W] : [VIEW.W, VIEW.H];
VIEW.p = (x, y) => { const { r, W, H } = VIEW; return r === 0 ? [x, y] : r === 1 ? [H - y, x] : r === 2 ? [W - x, H - y] : [y, W - x]; };
VIEW.inv = (vx, vy) => { const { r, W, H } = VIEW; return r === 0 ? [vx, vy] : r === 1 ? [vy, H - vx] : r === 2 ? [W - vx, H - vy] : [W - vy, vx]; };
VIEW.v = (dx, dy) => { const r = VIEW.r; return r === 0 ? [dx, dy] : r === 1 ? [-dy, dx] : r === 2 ? [-dx, -dy] : [dy, -dx]; };
VIEW.invV = (vx, vy) => { const r = VIEW.r; return r === 0 ? [vx, vy] : r === 1 ? [vy, -vx] : r === 2 ? [-vx, -vy] : [-vy, vx]; };
VIEW.rect = (x, y, w, d) => { const a = VIEW.p(x, y), b = VIEW.p(x + w, y + d); return { x: Math.min(a[0], b[0]), y: Math.min(a[1], b[1]), w: Math.abs(b[0] - a[0]), d: Math.abs(b[1] - a[1]) }; };
// screen-facing (dir: ±1 left/right, face: 0=front, 1=back, 2=side) of a world-facing actor, as seen in the current view
VIEW.df = (dir, face) => {
  // 대각선(face=3): 뷰 회전 시 사이드에 가깝게 처리, dir만 회전 반영
  if (face === 3) {
    if (!VIEW.r) return [dir, 3];
    const [vx, vy] = VIEW.v(dir, 1);
    const ru = vx - vy;
    return [ru >= 0 ? 1 : -1, 3];
  }
  if (!VIEW.r) return [dir, face];
  const u = dir, v = face === 1 ? -1 : face === 2 ? 0 : 1;
  const [vx, vy] = VIEW.v((u + v) / 2, (v - u) / 2);
  const ru = vx - vy, rv = vx + vy;
  const rdir = ru >= 0 ? 1 : -1;
  let rface = 0;
  if (Math.abs(ru) > 1.15 * Math.abs(rv)) rface = 2;
  else rface = rv < 0 ? 1 : 0;
  return [rdir, rface];
};
ISO.wx = (x, y) => { const q = VIEW.p(x, y); return ISO.sx(q[0], q[1]); };
ISO.wy = (x, y) => { const q = VIEW.p(x, y); return ISO.sy(q[0], q[1]); };
const SPR = {};
if (typeof SPR_META !== 'undefined') for (const k in SPR_META) {
  const url = assetUrl('spr/' + k + '.png');
  SPR[k] = (typeof ASSET_CACHE !== 'undefined') ? ASSET_CACHE.load(url) : (() => {
    const im = new Image(); im.crossOrigin = 'anonymous'; im.src = url; return im;
  })();
}
const FURN = (() => {
  const { shade, ell, rrect, OUT } = ART;
  let WORLD = false; // when true, P() and box() take world coords and rotate them into the view
  const P = (x, y, z) => { if (WORLD) { const q = VIEW.p(x, y); x = q[0]; y = q[1]; } return [ISO.sx(x, y), ISO.sy(x, y) - (z || 0)]; };
  const vis = (nx, ny) => { if (!WORLD) return true; const q = VIEW.v(nx, ny); return q[0] > .5 || q[1] > .5; };
  function inFront(x, y) { // world point that would stand in front of the room in the current view (hides the shop)
    if (!VIEW.r) return false; const [vx, vy] = VIEW.p(x, y), [VW, VH] = VIEW.dims();
    if (vx < 0 || vy < 0 || (vx <= VW && vy <= VH)) return false; const sx = ISO.sx(vx, vy); return sx > ISO.sx(0, VH) - 40 && sx < ISO.sx(VW, 0) + 40;
  }
  function poly(c, pts, fill, stroke, lw) {
    c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath();
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (stroke) { c.lineWidth = lw || 1.2; c.strokeStyle = stroke; c.stroke(); }
  }
  function line2(c, a, b, col, lw) { c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.lineWidth = lw || 1; c.strokeStyle = col; c.stroke(); }
  // box on grid coords (local, origin = item tile), z from z0 to z0+h
  function box(c, x, y, w, d, h, col, z0, opt) {
    if (WORLD) { const r = VIEW.rect(x, y, w, d); WORLD = false; const o = box(c, r.x, r.y, r.w, r.d, h, col, z0, opt); WORLD = true; return o; }
    z0 = z0 || 0; opt = opt || {};
    // Ground contact shadow if at floor level and not suppressed
    if (!opt.noShadow && z0 === 0 && h > 0) {
      poly(c, [P(x - .04, y - .04), P(x + w + .08, y - .04), P(x + w + .08, y + d + .08), P(x - .04, y + d + .08)], 'rgba(30,16,8,.18)', null);
      poly(c, [P(x, y + .04), P(x + w + .04, y + .04), P(x + w + .04, y + d + .04), P(x, y + d + .04)], 'rgba(25,12,5,.22)', null);
    }
    const top = [P(x, y, z0 + h), P(x + w, y, z0 + h), P(x + w, y + d, z0 + h), P(x, y + d, z0 + h)];
    const L = [P(x, y + d, z0 + h), P(x + w, y + d, z0 + h), P(x + w, y + d, z0), P(x, y + d, z0)];
    const R = [P(x + w, y, z0 + h), P(x + w, y + d, z0 + h), P(x + w, y + d, z0), P(x + w, y, z0)];
    poly(c, L, opt.left || shade(col, -.12), OUT, 1.1);
    poly(c, R, opt.right || shade(col, -.25), OUT, 1.1);
    poly(c, top, opt.top || shade(col, .08), OUT, 1.1);
    // Bevel highlights on top edges
    line2(c, top[0], top[1], 'rgba(255,255,255,.24)', 1.2);
    line2(c, top[3], top[0], 'rgba(255,255,255,.18)', 1.2);
    // Vertical corner highlight
    line2(c, L[0], L[3], 'rgba(255,255,255,.15)', 1);
    return { top, L, R };
  }
  const cx = (w, d) => ISO.sx(w / 2, d / 2), cy = (w, d) => ISO.sy(w / 2, d / 2);

  // --- Neatly organized boutique display shelf unit (사료 진열대, 용품 진열대, 장난감 진열대) ---
  function drawShelfUnit(c, kind, stock) {
    const st = stock == null ? 12 : stock;
    const isSup = kind === 'supshelf';
    const isToy = kind === 'toyshelf';

    // Distinct palette by shelf kind
    const opt = isSup ? {
      frame: '#ece7dd', top: '#f8f6f0', side: '#beb6a7',
      back: '#d5e5db', plank: '#cf9e68', rail: '#e5dcd0', groove: 'rgba(50,80,60,.12)'
    } : isToy ? {
      frame: '#d98728', top: '#f3a43d', side: '#9b5a15',
      back: '#fff2d6', plank: '#c58332', rail: '#db953c', groove: 'rgba(140,80,20,.15)'
    } : {
      frame: '#8c5228', top: '#a46834', side: '#653b1a',
      back: '#ebd6be', plank: '#ba8249', rail: '#c9934e', groove: 'rgba(60,35,15,.15)'
    };

    // 1. Ground contact shadow under unit
    poly(c, [P(-.06, .18), P(2.06, .18), P(2.06, .82), P(-.06, .82)], 'rgba(25,12,6,.22)');
    // 2. Interior backboard
    poly(c, [P(0, .22, 54), P(2, .22, 54), P(2, .22, 0), P(0, .22, 0)], opt.back, OUT, 1);
    // Vertical wood plank groove lines on backboard
    for (const gx of [.4, .8, 1.2, 1.6]) {
      line2(c, P(gx, .22, 54), P(gx, .22, 0), opt.groove, 1);
    }
    // 3. Left inner gable
    poly(c, [P(0, .22, 54), P(0, .76, 54), P(0, .76, 0), P(0, .22, 0)], shade(opt.frame, .06), OUT, 1);
    // 4. Right outer gable
    poly(c, [P(2, .22, 54), P(2, .76, 54), P(2, .76, 0), P(2, .22, 0)], opt.side, OUT, 1.1);
    // Right gable recessed decorative bevel panel
    poly(c, [P(2, .27, 50), P(2, .71, 50), P(2, .71, 6), P(2, .27, 6)], shade(opt.side, -.12), 'rgba(255,255,255,.15)', .8);
    // 5. Base plinth (bottom kickboard)
    poly(c, [P(0, .76, 6), P(2, .76, 6), P(2, .76, 0), P(0, .76, 0)], shade(opt.frame, -.15), OUT, 1);
    poly(c, [P(2, .22, 6), P(2, .76, 6), P(2, .76, 0), P(2, .22, 0)], opt.side, OUT, 1);
    // Ambient shadows under upper shelf tiers on backboard
    for (const sz of [22, 38]) {
      poly(c, [P(0, .22, sz), P(2, .22, sz), P(2, .22, sz - 5), P(0, .22, sz - 5)], 'rgba(30,15,5,.22)');
    }

    // Helper to draw an upright standing item (book, carton, bottle, plush box)
    function drawItem(u, w, sz, h, colFront, colSide, colTop, drawDetail) {
      const yB = 0.40, yF = 0.64;
      poly(c, [P(u, yB, sz), P(u + w, yB, sz), P(u + w, yF, sz), P(u, yF, sz)], 'rgba(30,15,5,.22)');
      const p0 = P(u, yF, sz + h), p1 = P(u + w, yF, sz + h), p2 = P(u + w, yF, sz), p3 = P(u, yF, sz);
      poly(c, [p0, p1, p2, p3], colFront, OUT, 0.8);
      const s0 = P(u + w, yB, sz + h), s1 = P(u + w, yF, sz + h), s2 = P(u + w, yF, sz), s3 = P(u + w, yB, sz);
      poly(c, [s0, s1, s2, s3], colSide || shade(colFront, -0.22), OUT, 0.8);
      const t0 = P(u, yB, sz + h), t1 = P(u + w, yB, sz + h), t2 = P(u + w, yF, sz + h), t3 = P(u, yF, sz + h);
      poly(c, [t0, t1, t2, t3], colTop || shade(colFront, 0.12), OUT, 0.8);
      line2(c, p0, p3, 'rgba(255,255,255,.3)', 0.8);
      line2(c, p0, p1, 'rgba(255,255,255,.25)', 0.8);
      if (drawDetail) {
        const cx = (p0[0] + p1[0] + p2[0] + p3[0]) / 4;
        const cy = (p0[1] + p1[1] + p2[1] + p3[1]) / 4;
        drawDetail(cx, cy, p0, p1, p2, p3);
      }
    }

    // Shelf tier drawer
    function renderTier(sz, tierIdx) {
      // 1. Plank top surface
      poly(c, [P(0, .22, sz), P(2, .22, sz), P(2, .76, sz), P(0, .76, sz)], opt.plank, OUT, .8);
      line2(c, P(0, .74, sz), P(2, .74, sz), 'rgba(255,255,255,.18)', 1);

      // 2. Distinct product shapes per shelf kind (quantity scales dynamically with st 0..12)
      const slots = [.16, .58, 1.00, 1.42];
      for (let i = 0; i < 4; i++) {
        const globalIdx = tierIdx * 4 + i;
        if (globalIdx >= st) continue;
        const u = slots[i], w = .32;
        const [bx, by] = P(u + w * .5, .54, sz);

        if (!isSup && !isToy) {
          // === FOOD SHELF (shelf): Pet food sacks, round wet-food cans, stand-up treat pouches ===
          if (tierIdx === 0) {
            // Bottom tier: Plump cinched pet-food sacks with tied ears & bone/fish emblem
            const cols = [['#2e7d32', '#a7f3d0', '🦴'], ['#1e5088', '#bae6fd', '🐟'], ['#b34a2e', '#fecaca', '🥩'], ['#d4881e', '#fef08a', '🌻']][i];
            ell(c, bx, by + 1, 7.5, 3.6, 'rgba(30,15,5,.25)');
            // Plump rounded sack body
            c.beginPath();
            c.moveTo(bx - 6.2, by);
            c.bezierCurveTo(bx - 7.8, by - 4, bx - 7.2, by - 11, bx - 4.5, by - 13.5);
            c.lineTo(bx + 4.5, by - 13.5);
            c.bezierCurveTo(bx + 7.2, by - 11, bx + 7.8, by - 4, bx + 6.2, by);
            c.closePath();
            c.fillStyle = cols[0]; c.fill(); c.lineWidth = .85; c.strokeStyle = OUT; c.stroke();
            // Tied sack top ruffle / ears
            c.beginPath();
            c.moveTo(bx - 3.5, by - 13.5); c.lineTo(bx - 5.2, by - 16.2); c.lineTo(bx, by - 14.8); c.lineTo(bx + 5.2, by - 16.2); c.lineTo(bx + 3.5, by - 13.5);
            c.closePath();
            c.fillStyle = shade(cols[0], .15); c.fill(); c.stroke();
            // Gold tie band & front label belly
            line2(c, [bx - 4.2, by - 13.3], [bx + 4.2, by - 13.3], '#fde047', 1.4);
            ell(c, bx, by - 6.5, 4.6, 3.8, cols[1], OUT, .6);
            ell(c, bx, by - 6.5, 2.2, 1.5, cols[0]);
          } else if (tierIdx === 1) {
            // Middle tier: Cylindrical metallic wet-food cans stacked 2-high
            const canCols = ['#e11d48', '#2563eb', '#059669', '#d97706'][i];
            for (const cz of [0, 6.2]) {
              const cy0 = by - cz;
              ell(c, bx, cy0, 5.8, 2.6, shade(canCols, -.18), OUT, .7);
              rrect(c, bx - 5.8, cy0 - 5.5, 11.6, 5.5, 1);
              c.fillStyle = canCols; c.fill(); c.lineWidth = .7; c.strokeStyle = OUT; c.stroke();
              // White label stripe around cylinder
              c.fillStyle = '#fffbeb'; c.fillRect(bx - 5.2, cy0 - 4.2, 10.4, 2.6);
              // Metallic silver lid with pull ring
              ell(c, bx, cy0 - 5.5, 5.8, 2.5, '#e2e8f0', OUT, .7);
              ell(c, bx, cy0 - 5.5, 3.6, 1.4, '#cbd5e1');
            }
          } else {
            // Top tier: Gusseted stand-up zipper treat pouches
            const pCols = [['#7c3aed', '#ddd6fe'], ['#ea580c', '#fed7aa'], ['#0d9488', '#99f6e4'], ['#eab308', '#fef9c3']][i];
            c.beginPath();
            c.moveTo(bx - 5, by); c.lineTo(bx - 6.2, by - 11.5); c.lineTo(bx + 6.2, by - 11.5); c.lineTo(bx + 5, by); c.closePath();
            c.fillStyle = pCols[0]; c.fill(); c.lineWidth = .8; c.strokeStyle = OUT; c.stroke();
            line2(c, [bx - 5.8, by - 9.8], [bx + 5.8, by - 9.8], '#fde047', 1.2);
            ell(c, bx, by - 5, 3.6, 2.8, pCols[1], OUT, .6);
            ell(c, bx - 1.2, by - 5, 1.1, 1.1, '#92400e');
            ell(c, bx + 1.2, by - 4.6, 1.1, 1.1, '#b45309');
          }
        } else if (isSup) {
          // === SUPPLIES SHELF (supshelf): Pee-pad rolls/towels, ceramic bowls & brushes, pump shampoo & mist bottles ===
          if (tierIdx === 0) {
            // Bottom tier: Rolled hygiene pee-pad bundles tied with ribbons & folded towel stacks
            if (i % 2 === 0) {
              const rCol = i === 0 ? '#e0f2fe' : '#fce7f3', rib = i === 0 ? '#0284c7' : '#db2777';
              for (const dx of [-3.2, 3.2]) {
                rrect(c, bx + dx - 3, by - 12, 6, 12, 2.5);
                c.fillStyle = rCol; c.fill(); c.lineWidth = .75; c.strokeStyle = OUT; c.stroke();
                line2(c, [bx + dx - 3, by - 6], [bx + dx + 3, by - 6], rib, 1.5);
                ell(c, bx + dx, by - 12, 3, 1.5, '#ffffff', OUT, .6);
              }
            } else {
              // Stacked folded pastel bath towels
              const tCols = i === 1 ? ['#a7f3d0', '#6ee7b7', '#34d399'] : ['#ddd6fe', '#c4b5fd', '#a78bfa'];
              for (let k = 0; k < 3; k++) {
                drawItem(u + .02, w - .04, sz + k * 4, 3.8, tCols[k], shade(tCols[k], -.15), shade(tCols[k], .12));
              }
            }
          } else if (tierIdx === 1) {
            // Middle tier: Nested ceramic pet bowls & cushioned slicker grooming brushes
            if (i % 2 === 0) {
              const bCol = i === 0 ? '#f97316' : '#38bdf8';
              for (const bz of [0, 4.5]) {
                const cy0 = by - bz;
                c.beginPath();
                c.moveTo(bx - 6.5, cy0); c.lineTo(bx - 5.2, cy0 - 5); c.lineTo(bx + 5.2, cy0 - 5); c.lineTo(bx + 6.5, cy0);
                c.closePath();
                c.fillStyle = bCol; c.fill(); c.lineWidth = .8; c.strokeStyle = OUT; c.stroke();
                ell(c, bx, cy0 - 5, 5.2, 2.2, '#fff7ed', OUT, .7);
                ell(c, bx, cy0 - 2.2, 1.4, 1.2, '#ffffff');
              }
            } else {
              // Grooming brush & hygiene kit standing on display stand
              const hCol = i === 1 ? '#ec4899' : '#10b981';
              rrect(c, bx - 1.6, by - 6, 3.2, 6, 1.2); c.fillStyle = hCol; c.fill(); c.lineWidth = .75; c.strokeStyle = OUT; c.stroke();
              ell(c, bx, by - 10, 6.2, 4.8, hCol, OUT, .85);
              ell(c, bx, by - 10, 4.4, 3.3, '#f1f5f9', OUT, .6);
              for (const [px, py] of [[-2, -11], [0, -11], [2, -11], [-2, -9], [0, -9], [2, -9]]) {
                ell(c, bx + px, by + py, .5, .5, '#64748b');
              }
            }
          } else {
            // Top tier: Rounded pump shampoo bottles & trigger spray bottles
            const bCols = ['#16a34a', '#f43f5e', '#0ea5e9', '#9333ea'][i];
            ell(c, bx, by + .5, 4.8, 2.2, 'rgba(30,15,5,.22)');
            rrect(c, bx - 4.5, by - 10.5, 9, 10.5, 3.5);
            c.fillStyle = bCols; c.fill(); c.lineWidth = .8; c.strokeStyle = OUT; c.stroke();
            // White label badge on bottle belly
            rrect(c, bx - 3.2, by - 7.5, 6.4, 5, 1.2);
            c.fillStyle = '#ffffff'; c.fill();
            ell(c, bx, by - 5, 1.6, 1.6, bCols);
            // Neck & pump dispenser nozzle
            rrect(c, bx - 1.6, by - 13, 3.2, 2.8, .8); c.fillStyle = '#f8fafc'; c.fill(); c.stroke();
            line2(c, [bx, by - 13], [bx, by - 15.2], '#e2e8f0', 1.6);
            line2(c, [bx - 1, by - 15.2], [bx + 3.8, by - 14.2], '#ffffff', 1.6);
          }
        } else {
          // === TOY SHELF (toyshelf): Sitting 3D plush dolls, rope tugs & ball pyramids, feather wands & rings ===
          if (tierIdx === 0) {
            // Bottom tier: Sitting 3D plush dolls (Bear, Duck, Bunny, Mint Dino)
            const pCol = ['#d97706', '#facc15', '#f472b6', '#34d399'][i];
            const bellyCol = ['#fef3c7', '#fef9c3', '#fce7f3', '#d1fae5'][i];
            ell(c, bx, by + 1, 6.5, 3, 'rgba(30,15,5,.24)');
            // Sitting plush torso & tummy
            ell(c, bx, by - 4, 5.2, 4.8, pCol, OUT, .8);
            ell(c, bx, by - 3.5, 3.2, 3, bellyCol);
            // Plush paws / feet in front
            ell(c, bx - 4.2, by - 1.2, 2.2, 1.8, pCol, OUT, .65);
            ell(c, bx + 4.2, by - 1.2, 2.2, 1.8, pCol, OUT, .65);
            // Ears by species
            if (i === 0) { // Teddy ears
              ell(c, bx - 4, by - 13, 2.2, 2.2, pCol, OUT, .7);
              ell(c, bx + 4, by - 13, 2.2, 2.2, pCol, OUT, .7);
            } else if (i === 2) { // Long bunny ears
              ell(c, bx - 2.6, by - 15.5, 1.6, 4.2, pCol, OUT, .7);
              ell(c, bx + 2.6, by - 15.5, 1.6, 4.2, pCol, OUT, .7);
            }
            // Plush head
            ell(c, bx, by - 10, 4.8, 4.4, pCol, OUT, .8);
            // Eyes & nose/beak
            ell(c, bx - 1.8, by - 10.5, .8, .9, '#1e293b');
            ell(c, bx + 1.8, by - 10.5, .8, .9, '#1e293b');
            if (i === 1) ell(c, bx, by - 9.2, 2.2, 1.2, '#f97316', OUT, .5);
            else ell(c, bx, by - 9.3, 1.2, .9, '#451a03');
          } else if (tierIdx === 1) {
            // Middle tier: Tennis ball pyramids, squeaky bones & braided rope rings
            if (i % 2 === 0) {
              // Pyramid of 3 glossy bouncy balls
              const bc = i === 0 ? ['#a3e635', '#facc15', '#38bdf8'] : ['#fb7185', '#c084fc', '#4ade80'];
              for (const [dx, dy, col] of [[-3.2, -3, bc[0]], [3.2, -3, bc[1]], [0, -7.8, bc[2]]]) {
                ell(c, bx + dx, by + dy, 3.4, 3.4, col, OUT, .75);
                ell(c, bx + dx - 1, by + dy - 1, 1.1, 1.1, 'rgba(255,255,255,.75)');
              }
            } else {
              // Squeaky bone & braided figure-8 tug toy
              const col = i === 1 ? '#f43f5e' : '#06b6d4';
              ell(c, bx, by - 5.5, 5.8, 4.2, null, col, 2.6);
              ell(c, bx - 4.5, by - 2.5, 2.4, 2.4, '#fde047', OUT, .7);
              ell(c, bx + 4.5, by - 2.5, 2.4, 2.4, '#fde047', OUT, .7);
              rrect(c, bx - 4.5, by - 3.8, 9, 2.6, 1); c.fillStyle = '#fde047'; c.fill(); c.lineWidth = .65; c.strokeStyle = OUT; c.stroke();
            }
          } else {
            // Top tier: Cat teaser feather wands in holder & star/rainbow chew rings
            const wCol = ['#ec4899', '#3b82f6', '#10b981', '#f59e0b'][i];
            ell(c, bx, by - 1.5, 4.5, 2.2, '#fff7ed', OUT, .75);
            rrect(c, bx - 3.5, by - 6.5, 7, 5, 1.5); c.fillStyle = wCol; c.fill(); c.lineWidth = .75; c.strokeStyle = OUT; c.stroke();
            // Wand stick & dangling feather puff
            line2(c, [bx - 1, by - 6.5], [bx + 4.5, by - 14.5], '#fef08a', 1.3);
            ell(c, bx + 4.8, by - 14.5, 3.2, 2.2, wCol, OUT, .65);
            ell(c, bx + 2.8, by - 15.5, 2.4, 1.8, '#ffffff', OUT, .5);
          }
        }
      }

      // 3. Front shelf retaining rail (secures items inside the shelf)
      poly(c, [P(0, .76, sz + 2.5), P(2, .76, sz + 2.5), P(2, .76, sz - 2.5), P(0, .76, sz - 2.5)], opt.rail, OUT, .9);
      line2(c, P(0, .76, sz + 2.5), P(2, .76, sz + 2.5), 'rgba(255,255,255,.4)', 1);
      // Price tags on front rail
      for (const lx of [.38, .96, 1.54]) {
        poly(c, [P(lx - .07, .765, sz + 1.2), P(lx + .07, .765, sz + 1.2), P(lx + .07, .765, sz - 1.8), P(lx - .07, .765, sz - 1.8)], '#ffffff', 'rgba(40,20,10,.5)', .6);
        line2(c, P(lx - .04, .766, sz - .3), P(lx + .04, .766, sz - .3), '#555555', .8);
      }
    }

    // Render 3 shelf tiers: bottom, middle, top
    renderTier(6, 0);
    renderTier(22, 1);
    renderTier(38, 2);

    // Top canopy / cornice
    poly(c, [P(-.02, .18, 55), P(2.04, .18, 55), P(2.04, .78, 55), P(-.02, .78, 55)], opt.top, OUT, 1.1);
    poly(c, [P(-.02, .78, 55), P(2.04, .78, 55), P(2.04, .78, 51.5), P(-.02, .78, 51.5)], opt.frame, OUT, 1);
    poly(c, [P(2.04, .18, 55), P(2.04, .78, 55), P(2.04, .78, 51.5), P(2.04, .18, 51.5)], opt.side, OUT, 1);
    line2(c, P(-.02, .78, 55), P(2.04, .78, 55), 'rgba(255,255,255,.35)', 1.2);
    line2(c, P(-.02, .18, 55), P(2.04, .18, 55), 'rgba(255,255,255,.2)', 1);
  }

  // ---------- habitats ----------
  // lv 1..5 changes look
  const HAB_COL = ['#c89b6d', '#d98c8c', '#8fb3d9', '#b59be0', '#e8c25a'];
  // ---- model-specific pet houses (dog/cat) ----
  function cardbox(c, col) { // plush dome house with soft depth
    const cat = !!col, main = cat ? '#ffb8cb' : '#b6e4d4', dark = cat ? '#e88ba7' : '#7ec4ac';
    const [x, y] = P(.5, .5, 0);
    // layered ground shadow
    ell(c, x + 1, y + 2, 29, 14, 'rgba(25,12,6,.18)');
    ell(c, x, y + 1, 26, 12, 'rgba(35,18,10,.25)');
    ell(c, x, y - 1, 25, 12, shade(main, -.15), OUT, 1.2);
    c.beginPath(); c.moveTo(x - 25, y - 2); c.bezierCurveTo(x - 27, y - 36, x + 27, y - 36, x + 25, y - 2); c.quadraticCurveTo(x, y + 12, x - 25, y - 2); c.closePath();
    const g = c.createLinearGradient(x - 20, y - 34, x + 20, y); g.addColorStop(0, shade(main, .18)); g.addColorStop(0.6, main); g.addColorStop(1, shade(main, -.12)); c.fillStyle = g; c.fill(); c.lineWidth = 1.2; c.strokeStyle = OUT; c.stroke();
    // dome shine
    c.beginPath(); c.ellipse(x - 6, y - 20, 10, 6, -0.2, 0, Math.PI * 2); c.fillStyle = 'rgba(255,255,255,.32)'; c.fill();
    if (cat) for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(x + sd * 6, y - 29); c.lineTo(x + sd * 16, y - 42); c.lineTo(x + sd * 19, y - 24); c.closePath(); c.fillStyle = main; c.fill(); c.lineWidth = 1.2; c.strokeStyle = OUT; c.stroke(); c.beginPath(); c.moveTo(x + sd * 9, y - 29); c.lineTo(x + sd * 15.5, y - 38); c.lineTo(x + sd * 17, y - 27); c.closePath(); c.fillStyle = '#fff0f5'; c.fill(); }
    ell(c, x - 7, y - 5, 10.5, 11.5, '#553645', OUT, 1.2); ell(c, x - 7, y - 1, 8.5, 5.5, dark);
    const pw = [x + 11, y - 18]; ell(c, pw[0], pw[1], 3.2, 2.8, '#fff'); for (const [dx, dy] of [[-3.5, -3.5], [-1, -5], [1.8, -5], [4, -3.2]]) ell(c, pw[0] + dx, pw[1] + dy, 1.3, 1.3, '#fff');
  }
  function kennel(c, wall, roof, sign) {
    const [kx, ky] = P(.5, .5, 0);
    ell(c, kx + 1, ky + 2, 28, 14, 'rgba(25,12,6,.26)');
    box(c, .06, .06, .88, .88, 4, '#8a5a33');
    box(c, .14, .14, .72, .72, 28, wall, 4);
    // arched door on the front-left face (y = .86)
    const d0 = P(.34, .86, 4), d1 = P(.66, .86, 4), top = P(.5, .86, 24);
    c.beginPath(); c.moveTo(d0[0], d0[1]); c.lineTo(d0[0], d0[1] - 12); c.quadraticCurveTo(top[0] - 2, top[1] - 6, d1[0], d1[1] - 12); c.lineTo(d1[0], d1[1]); c.closePath(); c.fillStyle = '#2c1a0e'; c.fill(); c.lineWidth = 1.2; c.strokeStyle = OUT; c.stroke();
    // plank lines on right face
    for (const z of [12, 20, 28]) line2(c, P(.86, .14, z), P(.86, .86, z), 'rgba(80,50,25,.35)');
    // gable roof with shingle texture
    const H = 32, R = 50;
    poly(c, [P(.08, .08, H), P(.5, .08, R), P(.5, .92, R), P(.08, .92, H)], shade(roof, -.12), OUT, 1.3);
    poly(c, [P(.86, .14, H - 1), P(.5, .14, R - 3), P(.86, .14, H - 1)], wall, null);
    poly(c, [P(.5, .08, R), P(.92, .08, H), P(.92, .92, H), P(.5, .92, R)], roof, OUT, 1.3);
    poly(c, [P(.14, .86, H - 2), P(.5, .86, R - 2), P(.86, .86, H - 2)], shade(wall, .06), OUT, 1.1);
    for (let i = 1; i < 4; i++) {
      line2(c, P(.5 + i * .1, .08, R - i * 4.5), P(.5 + i * .1, .92, R - i * 4.5), 'rgba(255,255,255,.22)', 1.2);
      line2(c, P(.5 + i * .1, .08, R - i * 4.5 - 1), P(.5 + i * .1, .92, R - i * 4.5 - 1), 'rgba(0,0,0,.2)', 1);
    }
    if (sign) { const q = P(.5, .86, 34); rrect(c, q[0] - 10, q[1] - 6, 20, 11, 3); c.fillStyle = '#fff8e2'; c.fill(); c.lineWidth = 1; c.strokeStyle = OUT; c.stroke(); c.font = 'bold 7px sans-serif'; c.textAlign = 'center'; c.fillStyle = '#5a3418'; c.fillText(sign, q[0], q[1] + 2.5); c.textAlign = 'start'; }
  }
  function canopy(c, cloth, trim) {
    box(c, .08, .08, .84, .84, 9, '#7a4a8a', 0, { top: '#9a6ab0' });
    const [x0, y0] = [cx(1, 1), cy(1, 1)];
    ell(c, x0, y0 - 12, 24, 11, cloth, OUT, 1.3); ell(c, x0, y0 - 13, 16, 7, shade(cloth, .35), OUT, 1);
    for (const [px, py] of [[.1, .1], [.9, .1], [.9, .9], [.1, .9]]) { const b = P(px, py, 9), t = P(px, py, 58); c.beginPath(); c.moveTo(b[0], b[1]); c.lineTo(t[0], t[1]); c.lineWidth = 2.5; c.strokeStyle = '#d4a93a'; c.stroke(); }
    poly(c, [P(.06, .06, 58), P(.94, .06, 58), P(.94, .94, 58), P(.06, .94, 58)], 'rgba(255,214,236,.65)', '#d4a93a', 1.4);
    for (const [a, b] of [[[.06, .94], [.94, .94]], [[.94, .06], [.94, .94]]]) { for (let i = 0; i < 6; i++) { const k0 = i / 6, k1 = (i + 1) / 6; const p0 = P(a[0] + (b[0] - a[0]) * k0, a[1] + (b[1] - a[1]) * k0, 58), p1 = P(a[0] + (b[0] - a[0]) * k1, a[1] + (b[1] - a[1]) * k1, 58); c.beginPath(); c.moveTo(p0[0], p0[1]); c.quadraticCurveTo((p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2 + 6, p1[0], p1[1]); c.lineWidth = 2; c.strokeStyle = trim; c.stroke(); } }
    crown(c, x0, y0 - 66);
  }
  function basket(c) {
    const [x0, y0] = [cx(1, 1), cy(1, 1)];
    ell(c, x0 + 1, y0 + 1, 27, 13, 'rgba(25,12,6,.22)');
    ell(c, x0, y0 - 4, 25, 12, '#b98552', OUT, 1.3);
    c.save(); c.beginPath(); c.ellipse(x0, y0 - 4, 25, 12, 0, 0, 7); c.clip(); for (let i = -30; i < 30; i += 5) { c.beginPath(); c.moveTo(x0 + i, y0 - 16); c.lineTo(x0 + i + 6, y0 + 8); c.lineWidth = 1; c.strokeStyle = 'rgba(90,55,25,.4)'; c.stroke(); } c.restore();
    ell(c, x0, y0 - 9, 21, 9, '#8a5a33', OUT, 1.1); ell(c, x0, y0 - 9, 18, 7.5, '#f7c6d0', OUT, .8);
    for (let i = 0; i < 8; i++) ell(c, x0 - 18 + i * 5, y0 - 16 + Math.abs(i - 3.5) * .9, 2.2, 2.2, '#ffffff', 'rgba(60,38,25,.4)', .5);
    c.beginPath(); c.ellipse(x0, y0 - 10, 20, 22, 0, Math.PI * 1.1, Math.PI * 1.9); c.lineWidth = 3; c.strokeStyle = '#8a5a33'; c.stroke();
  }
  function cathouse(c) {
    box(c, .1, .1, .8, .8, 4, '#a0703f');
    box(c, .16, .16, .68, .68, 30, '#f2d7b0', 4);
    const h = P(.5, .84, 16); ell(c, h[0], h[1], 8, 9, '#3a2618', OUT, 1.2);
    const w = P(.84, .5, 22); ell(c, w[0], w[1], 5, 6, '#bfe3f7', OUT, 1);
    poly(c, [P(.1, .1, 34), P(.9, .1, 34), P(.9, .9, 34), P(.1, .9, 34)], '#e07a8f', OUT, 1.3);
    ell(c, cx(1, 1), cy(1, 1) - 38, 16, 7, '#fff0f5', OUT, 1);
    for (const s2 of [-1, 1]) { const e = P(.5 + s2 * .22, .5 - s2 * .22, 44); c.beginPath(); c.moveTo(e[0] - 5, e[1] + 4); c.lineTo(e[0], e[1] - 6); c.lineTo(e[0] + 5, e[1] + 4); c.closePath(); c.fillStyle = '#e07a8f'; c.fill(); c.lineWidth = 1; c.strokeStyle = OUT; c.stroke(); }
  }
  function castle(c) {
    box(c, .04, .04, .92, .92, 8, '#8a6fb5', 0, { top: '#b59be0' });
    const [x0, y0] = [cx(1, 1), cy(1, 1)];
    const tower = (dx, dy, h, r) => { rrect(c, x0 + dx - r, y0 + dy - h, r * 2, h, 3); c.fillStyle = '#f4ecff'; c.fill(); c.lineWidth = 1.2; c.strokeStyle = OUT; c.stroke(); for (let i = 0; i < 3; i++) { rrect(c, x0 + dx - r + i * r * .7, y0 + dy - h - 5, r * .5, 5, 1); c.fillStyle = '#f4ecff'; c.fill(); c.stroke(); } ell(c, x0 + dx, y0 + dy - h * .55, r * .45, r * .6, '#3a2618'); };
    tower(-16, -4, 38, 8); tower(16, -4, 44, 8); tower(0, 6, 28, 11);
    ell(c, x0, y0 - 25, 12, 5, '#ffc2d4', OUT, 1);
    for (const [dx, h] of [[-16, 38], [16, 44]]) { c.beginPath(); c.moveTo(x0 + dx, y0 - 4 - h - 5); c.lineTo(x0 + dx, y0 - h - 24); c.lineWidth = 1.2; c.strokeStyle = '#5a3a22'; c.stroke(); c.beginPath(); c.moveTo(x0 + dx, y0 - h - 24); c.lineTo(x0 + dx + 9, y0 - h - 20); c.lineTo(x0 + dx, y0 - h - 16); c.closePath(); c.fillStyle = '#ef7fa0'; c.fill(); }
  }
  const MODEL_ART = {
    dog1: c => cardbox(c), cat1: c => cardbox(c, '#d9b27a'),
    dog3: c => kennel(c, '#d9a066', '#b5543f', '🐶'), dog4: c => canopy(c, '#ffd6e6', '#f0b43c'),
    cat2: c => basket(c), cat3: c => cathouse(c), cat4: c => castle(c),
  };
  function habitat(c, kind, lv, t, occupied, model) {
    if (model && MODEL_ART[model]) { MODEL_ART[model](c); if (lv >= 4 && model !== 'dog4' && model !== 'cat4') { const [x0, y0] = [cx(1, 1), cy(1, 1)]; ell(c, x0 + 20, y0 - 6, 4, 4, '#f2c14e', OUT, .8); } return; }
    const col = HAB_COL[(lv || 1) - 1];
    const trim = lv >= 5 ? '#fff3b0' : lv >= 4 ? '#ffffff' : shade(col, .3);
    switch (kind) {
      case 'bed': case 'dogbed': {
        // Dog cushion bed with bone tag
        const [x0, y0] = [cx(1, 1), cy(1, 1)];
        if (lv >= 4) box(c, .08, .08, .84, .84, 6, shade(col, -.2));
        ell(c, x0, y0 - (lv >= 4 ? 8 : 3), 26, 13, col, OUT, 1.4);
        ell(c, x0, y0 - (lv >= 4 ? 9 : 4), 18, 8.5, shade(col, .35), OUT, 1);
        if (lv >= 3) for (let i = 0; i < 6; i++) ell(c, x0 - 20 + i * 8, y0 - (lv >= 4 ? 16 : 11) + Math.abs(i - 2.5) * 2, 4.5, 4.5, trim, OUT, .8);
        if (lv >= 5) crown(c, x0, y0 - 34);
        // cute bone tag on the front rim
        const by0 = y0 - (lv >= 4 ? 4 : 0);
        c.fillStyle = '#fff9e6'; c.strokeStyle = OUT; c.lineWidth = .9;
        ell(c, x0 - 5, by0 - 1, 2.2, 2.2, '#fff9e6', OUT, .8);
        ell(c, x0 + 5, by0 - 1, 2.2, 2.2, '#fff9e6', OUT, .8);
        ell(c, x0, by0 - 1, 4.5, 2, '#fff9e6', OUT, .8);
        break;
      }
      case 'catbed': {
        // Cat bed: cozy basket with cute cat ears backrest & hanging ball toy
        const [x0, y0] = [cx(1, 1), cy(1, 1)];
        if (lv >= 4) box(c, .08, .08, .84, .84, 6, shade(col, -.2));
        // Cat ear backrest
        const ey = y0 - (lv >= 4 ? 16 : 11);
        c.fillStyle = col; c.strokeStyle = OUT; c.lineWidth = 1.3;
        // left ear
        c.beginPath(); c.moveTo(x0 - 16, ey); c.lineTo(x0 - 10, ey - 12); c.lineTo(x0 - 4, ey + 1); c.closePath(); c.fill(); c.stroke();
        c.fillStyle = '#ffb0c4'; c.beginPath(); c.moveTo(x0 - 14, ey); c.lineTo(x0 - 10, ey - 9); c.lineTo(x0 - 6, ey); c.closePath(); c.fill();
        // right ear
        c.fillStyle = col;
        c.beginPath(); c.moveTo(x0 + 4, ey + 1); c.lineTo(x0 + 10, ey - 12); c.lineTo(x0 + 16, ey); c.closePath(); c.fill(); c.stroke();
        c.fillStyle = '#ffb0c4'; c.beginPath(); c.moveTo(x0 + 6, ey); c.lineTo(x0 + 10, ey - 9); c.lineTo(x0 + 14, ey); c.closePath(); c.fill();
        // cushion
        ell(c, x0, y0 - (lv >= 4 ? 8 : 3), 25, 13, col, OUT, 1.4);
        ell(c, x0, y0 - (lv >= 4 ? 9 : 4), 18, 8.5, shade(col, .35), OUT, 1);
        if (lv >= 3) for (let i = 0; i < 6; i++) ell(c, x0 - 20 + i * 8, y0 - (lv >= 4 ? 16 : 11) + Math.abs(i - 2.5) * 2, 4.5, 4.5, trim, OUT, .8);
        if (lv >= 5) crown(c, x0, y0 - 34);
        // little dangling ball toy on side
        c.beginPath(); c.moveTo(x0 + 20, ey + 2); c.lineTo(x0 + 24, ey + 10); c.lineWidth = 1; c.strokeStyle = '#c48a5a'; c.stroke();
        ell(c, x0 + 24, ey + 11, 3, 3, '#ffd460', OUT, .8);
        break;
      }
      case 'hutch': {
        // High-fidelity spacious warm orange rabbit playpen enclosure (User Request 8)
        const h = 28, top0 = 6, bar = '#f97316', barPost = '#ea580c';
        // 1. Warm orange tray base with soft rounded rim & caster wheels underneath
        box(c, .06, .06, .88, .88, top0, '#ea580c', 0, { top: '#fed7aa', left: '#f97316', right: '#c2410c' });
        // Caster wheels at four corners
        for (const [wx, wy] of [[.08, .08], [.88, .08], [.08, .88], [.88, .88]]) {
          const wp = P(wx, wy, 0);
          ART.ell(c, wp[0], wp[1] + 1, 2.5, 2, '#475569');
          ART.ell(c, wp[0], wp[1], 2, 2, '#94a3b8');
        }
        // Straw bedding flecks on the floor
        for (let i = 0; i < 8; i++) {
          const sp = P(.18 + ((i * 19) % 7) * .1, .18 + ((i * 31) % 7) * .1, top0 + .5);
          c.beginPath(); c.moveTo(sp[0] - 2, sp[1]); c.lineTo(sp[0] + 3, sp[1] + 1);
          c.lineWidth = 1; c.strokeStyle = i % 2 ? '#fde047' : '#eab308'; c.stroke();
        }
        // 2. Interior rabbit amenities: wooden hay rack with green timothy hay, orange carrot, water bottle
        box(c, .12, .14, .32, .18, 12, '#b45309', top0, { top: '#d97706' });
        for (let i = 0; i < 4; i++) {
          const hp = P(.16 + i * .07, .24, top0 + 10);
          c.beginPath(); c.moveTo(hp[0], hp[1]); c.lineTo(hp[0] + (i % 2 ? 2 : -2), hp[1] - 5);
          c.lineWidth = 1.4; c.strokeStyle = '#4ade80'; c.stroke();
        }
        // Fresh crunchy carrot lying on the bedding
        const cp = P(.62, .45, top0 + 1);
        c.beginPath(); c.moveTo(cp[0] - 5, cp[1] + 2); c.lineTo(cp[0] + 6, cp[1] - 3);
        c.lineWidth = 3.2; c.lineCap = 'round'; c.strokeStyle = '#ea580c'; c.stroke();
        c.beginPath(); c.moveTo(cp[0] - 5, cp[1] + 2); c.lineTo(cp[0] - 9, cp[1] + 4);
        c.lineWidth = 1.6; c.strokeStyle = '#22c55e'; c.stroke();
        // Modern clear water bottle hanging on side
        const wb = P(.92, .35, top0 + h * .62);
        ART.rrect(c, wb[0] - 2.5, wb[1] - 10, 5, 14, 2);
        c.fillStyle = 'rgba(186,230,253,.9)'; c.fill(); c.lineWidth = 1; c.strokeStyle = '#ea580c'; c.stroke();
        ART.ell(c, wb[0], wb[1] + 4, 1.8, 1.8, '#fdba74');
        // 3. Sturdy vibrant orange corner posts
        for (const [px, py] of [[.08, .08], [.92, .08], [.08, .92], [.92, .92]]) {
          const b = P(px, py, top0), tp = P(px, py, top0 + h);
          c.beginPath(); c.moveTo(b[0], b[1]); c.lineTo(tp[0], tp[1]); c.lineWidth = 2.6; c.strokeStyle = barPost; c.stroke();
          line2(c, b, tp, 'rgba(0,0,0,.2)', .6);
        }
        // 4. Wide warm orange wire bars (5 bars with .164 spacing)
        c.save(); c.strokeStyle = bar; c.lineWidth = 1.5;
        for (let i = 1; i < 5; i++) { const a = P(.08 + i * .164, .92, top0), b = P(.08 + i * .164, .92, top0 + h); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); }
        for (let i = 1; i < 5; i++) { const a = P(.92, .08 + i * .164, top0), b = P(.92, .08 + i * .164, top0 + h); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); }
        // Horizontal middle bar
        const mz = top0 + h * .5;
        const a1 = P(.08, .92, mz), b1 = P(.92, .92, mz), a2 = P(.92, .08, mz), b2 = P(.92, .92, mz);
        c.beginPath(); c.moveTo(a1[0], a1[1]); c.lineTo(b1[0], b1[1]); c.stroke();
        c.beginPath(); c.moveTo(a2[0], a2[1]); c.lineTo(b2[0], b2[1]); c.stroke();
        c.restore();
        // 5. Openable roof wire canopy with angled hatch in warm orange
        const lid = [P(.06, .06, top0 + h), P(.94, .06, top0 + h), P(.94, .94, top0 + h), P(.06, .94, top0 + h)];
        poly(c, lid, 'rgba(251,146,60,.18)', bar, 1.4);
        for (let i = 1; i < 5; i++) { const a = P(.06 + i * .176, .06, top0 + h), b = P(.06 + i * .176, .94, top0 + h); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.lineWidth = 1; c.strokeStyle = bar; c.stroke(); }
        const h0 = P(.42, .06, top0 + h), h1 = P(.94, .06, top0 + h), h2 = P(.94, .94, top0 + h + 10), h3 = P(.42, .94, top0 + h + 10);
        poly(c, [h0, h1, h2, h3], 'rgba(251,146,60,.25)', bar, 1.4);
        if (lv >= 3) {
          box(c, .12, .52, .35, .35, 14, '#d4a373', top0, { top: '#e6ccb2' });
          const [ax, ay] = P(.3, .87, top0);
          ART.ell(c, ax, ay - 6, 5, 7, '#422006');
        }
        if (lv >= 5) crown(c, cx(1, 1), cy(1, 1) - h - top0 - 14);
        break;
      }
      case 'cage': {
        // tall wire cage on a solid tray, like a real multi-level rat/rodent cage.
        // The two visible side faces get their own wire mesh right here (always drawn,
        // so an empty cage still looks caged) -- cageFront() redraws the same bars
        // *in front of* the pet when one's inside, for the "seen through the bars" look.
        const h = 36, top0 = 8, bar = '#767d86';
        box(c, .08, .08, .84, .84, top0, '#33363b'); // dark plastic tray
        for (const [px, py] of [[.1, .1], [.9, .1], [.1, .9], [.9, .9]]) { const b = P(px, py, top0), tp = P(px, py, top0 + h); c.beginPath(); c.moveTo(b[0], b[1]); c.lineTo(tp[0], tp[1]); c.lineWidth = 2; c.strokeStyle = bar; c.stroke(); }
        c.save(); c.globalAlpha = .8; c.strokeStyle = bar; c.lineWidth = 1;
        for (let i = 1; i < 8; i++) { const a = P(.1 + i * .1, .9, top0), b = P(.1 + i * .1, .9, top0 + h); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); }
        for (let i = 1; i < 8; i++) { const a = P(.9, .1 + i * .1, top0), b = P(.9, .1 + i * .1, top0 + h); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); }
        for (const z of [top0 + h * .33, top0 + h * .66]) { const a = P(.1, .9, z), b = P(.9, .9, z), a2 = P(.9, .1, z), b2 = P(.9, .9, z); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); c.beginPath(); c.moveTo(a2[0], a2[1]); c.lineTo(b2[0], b2[1]); c.stroke(); }
        c.restore();
        const lid = [P(.08, .08, top0 + h), P(.92, .08, top0 + h), P(.92, .92, top0 + h), P(.08, .92, top0 + h)];
        poly(c, lid, 'rgba(150,155,162,.5)', bar, 1.2);
        for (let i = 1; i < 6; i++) { const a = P(.08 + i * .14, .08, top0 + h), b = P(.08 + i * .14, .92, top0 + h); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.lineWidth = .6; c.strokeStyle = bar; c.stroke(); }
        if (lv >= 3) { // a mid-level wire shelf, ladder up to it
          const shZ = top0 + h * .48;
          const sh = [P(.1, .46, shZ), P(.64, .46, shZ), P(.64, .9, shZ), P(.1, .9, shZ)];
          poly(c, sh, 'rgba(180,184,190,.7)', bar, 1);
          const r0 = P(.14, .9, top0), r1 = P(.14, .68, shZ); c.beginPath(); c.moveTo(r0[0], r0[1]); c.lineTo(r1[0], r1[1]); c.lineWidth = 3; c.strokeStyle = shade(col, -.15); c.stroke();
        }
        if (lv >= 2) { const wb = P(.9, .28, top0 + h * .65); rrect(c, wb[0] - 2.2, wb[1] - 11, 4.4, 15, 2); c.fillStyle = 'rgba(150,205,238,.85)'; c.fill(); c.lineWidth = .8; c.strokeStyle = bar; c.stroke(); ell(c, wb[0], wb[1] + 5, 2, 2, '#c9c3b6'); }
        if (lv >= 5) crown(c, cx(1, 1), cy(1, 1) - h - top0 - 14);
        break;
      }
      case 'birdcage': {
        const x0 = cx(1, 1), y0 = cy(1, 1);
        // multi-layered floor shadow
        ell(c, x0 + 2, y0 + 3, 24, 12, 'rgba(25,12,6,.18)');
        ell(c, x0, y0 + 1, 20, 10, 'rgba(35,18,8,.28)');
        // pedestal stand
        box(c, .3, .3, .4, .4, 16, shade(col, -.2));
        line2(c, P(.3, .7, 16), P(.7, .7, 16), 'rgba(255,255,255,.25)', 1.2);
        // golden cage tray base
        ell(c, x0, y0 - 15, 17, 8.5, '#c99a32', OUT, 1.2);
        ell(c, x0, y0 - 16, 15, 7.5, '#f0ca56', OUT, 1);
        ell(c, x0, y0 - 16, 21, 9.5, 'rgba(255,235,170,.35)', OUT, 1);
        // perch inside
        c.beginPath(); c.moveTo(x0 - 12, y0 - 32); c.lineTo(x0 + 12, y0 - 32); c.lineWidth = 3; c.strokeStyle = '#8a5a33'; c.stroke();
        // feed cup
        ell(c, x0 - 10, y0 - 30, 3, 2.5, '#ffffff', OUT, .8);
        // golden dome cage bars with shine
        const goldBar = lv >= 3 ? '#eec14d' : '#8fa2b2';
        const goldShine = lv >= 3 ? '#fff4b8' : '#e4ebf2';
        c.beginPath(); c.moveTo(x0 - 20, y0 - 16); c.bezierCurveTo(x0 - 21, y0 - 68, x0 + 21, y0 - 68, x0 + 20, y0 - 16); c.lineWidth = 2.4; c.strokeStyle = goldBar; c.stroke();
        c.beginPath(); c.moveTo(x0 - 19, y0 - 18); c.bezierCurveTo(x0 - 19, y0 - 66, x0 - 2, y0 - 66, x0 - 4, y0 - 17); c.lineWidth = 1.1; c.strokeStyle = goldShine; c.stroke();
        for (let i = -3; i <= 3; i++) {
          c.beginPath(); c.moveTo(x0 + i * 5.8, y0 - 16 + Math.abs(i) * .6); c.quadraticCurveTo(x0 + i * 4.8, y0 - 52, x0, y0 - 55); c.lineWidth = 1.2; c.strokeStyle = goldBar; c.stroke();
        }
        // top finial ring
        ell(c, x0, y0 - 60, 4.5, 4.5, goldBar, OUT, 1.2);
        ell(c, x0, y0 - 60, 2.5, 2.5, '#fff');
        if (lv >= 5) crown(c, x0, y0 - 70);
        break;
      }
      case 'tank': case 'terrarium': {
        const h = 34;
        // stand base
        box(c, .08, .12, .84, .76, 12, lv >= 4 ? '#5c3d28' : shade(col, -.25));
        const water = kind === 'tank' ? 'rgba(60,170,225,.38)' : 'rgba(210,190,140,.28)';
        c.save();
        box(c, .1, .15, .8, .7, h, '#a8e2ff', 12, { top: kind === 'tank' ? 'rgba(150,225,255,.45)' : 'rgba(255,255,255,.2)', left: water, right: water });
        c.restore();
        // aquarium gravel and plants
        if (kind === 'tank') {
          // gravel bed
          const g0 = P(.12, .83, 14), g1 = P(.88, .83, 14), g2 = P(.88, .17, 14);
          for (let i = 0; i < 6; i++) { const q = P(.2 + i * .11, .75, 13); ell(c, q[0], q[1], 2.8, 1.8, ['#c8b088', '#a89070', '#dfcfb0'][i % 3]); }
          // water weeds
          for (const [wx, wz] of [[.2, 16], [.75, 17], [.3, 18]]) {
            const p = P(wx, .75, wz), sw = Math.sin(t * 2.5 + wx * 10) * 3;
            c.beginPath(); c.moveTo(p[0], p[1]); c.quadraticCurveTo(p[0] + sw, p[1] - 8, p[0] + sw * 1.4, p[1] - 16); c.lineWidth = 2.4; c.strokeStyle = '#4e9a38'; c.stroke();
          }
          // bubbles
          for (let i = 0; i < 3; i++) {
            const by = 14 + ((t * 18 + i * 11) % 24);
            const p = P(.5 + (i - 1) * .18, .6, by);
            ell(c, p[0], p[1], 1.5, 1.5, 'rgba(255,255,255,.85)');
          }
        } else {
          ell(c, cx(1, 1) + 10, cy(1, 1) - 18, 9, 4.5, '#b48a5a');
          ell(c, cx(1, 1) - 12, cy(1, 1) - 20, 6, 9, '#5ca244');
        }
        if (lv >= 5) crown(c, cx(1, 1), cy(1, 1) - h - 26);
        break;
      }
      default: { // empty spot marker
        const x0 = cx(1, 1), y0 = cy(1, 1);
        ell(c, x0, y0, 24, 12, 'rgba(255,255,255,.35)', 'rgba(150,120,90,.6)', 1.5);
        c.font = 'bold 18px sans-serif'; c.textAlign = 'center'; c.fillStyle = 'rgba(150,120,90,.8)'; c.fillText('+', x0, y0 + 6);
      }
    }
  }
  // glass front for tanks (drawn after the animal)
  function tankFront(c, kind) {
    const h = 34;
    poly(c, [P(.1, .85, 12 + h), P(.9, .85, 12 + h), P(.9, .85, 12), P(.1, .85, 12)], kind === 'tank' ? 'rgba(120,200,240,.22)' : 'rgba(255,255,255,.12)', 'rgba(60,38,25,.6)', 1);
    poly(c, [P(.9, .15, 12 + h), P(.9, .85, 12 + h), P(.9, .85, 12), P(.9, .15, 12)], kind === 'tank' ? 'rgba(100,180,230,.25)' : 'rgba(255,255,255,.1)', 'rgba(60,38,25,.6)', 1);
    c.beginPath(); const a = P(.25, .85, 12 + h - 6), b = P(.4, .85, 12 + 8); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.lineWidth = 3; c.strokeStyle = 'rgba(255,255,255,.45)'; c.stroke();
  }
  function cageFront(c, kind) {
    if (kind === 'cage') {
      c.strokeStyle = 'rgba(118,125,134,.9)'; c.lineWidth = 1;
      for (let i = 0; i <= 8; i++) { const a = P(.1 + i * .1, .9, 8), b = P(.1 + i * .1, .9, 44); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); }
      for (let i = 0; i <= 8; i++) { const a = P(.9, .1 + i * .1, 8), b = P(.9, .1 + i * .1, 44); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); }
    } else if (kind === 'hutch') {
      c.strokeStyle = '#f97316'; c.lineWidth = 1.6;
      for (let i = 1; i < 5; i++) { const a = P(.08 + i * .164, .92, 6), b = P(.08 + i * .164, .92, 34); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); }
      for (let i = 1; i < 5; i++) { const a = P(.92, .08 + i * .164, 6), b = P(.92, .08 + i * .164, 34); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); }
      const a1 = P(.08, .92, 20), b1 = P(.92, .92, 20), a2 = P(.92, .08, 20), b2 = P(.92, .92, 20);
      c.beginPath(); c.moveTo(a1[0], a1[1]); c.lineTo(b1[0], b1[1]); c.stroke();
      c.beginPath(); c.moveTo(a2[0], a2[1]); c.lineTo(b2[0], b2[1]); c.stroke();
    }
  }
  function crown(c, x, y) {
    c.beginPath(); c.moveTo(x - 9, y + 5); c.lineTo(x - 9, y - 3); c.lineTo(x - 4, y + 1); c.lineTo(x, y - 6); c.lineTo(x + 4, y + 1); c.lineTo(x + 9, y - 3); c.lineTo(x + 9, y + 5); c.closePath();
    c.fillStyle = '#f5c842'; c.fill(); c.lineWidth = 1.2; c.strokeStyle = OUT; c.stroke();
  }

  // ---------- decor & fixtures ----------
  const DEF = {
    counter: { w: 2, d: 1 }, plant: { w: 1, d: 1 }, lamp: { w: 1, d: 1 }, rug: { w: 2, d: 2, flat: 1 }, bench: { w: 2, d: 1 },
    tv: { w: 2, d: 1 }, fridge: { w: 1, d: 1 }, cafe: { w: 2, d: 1 }, bookcase: { w: 2, d: 1 }, armchair: { w: 1, d: 1 }, radio: { w: 1, d: 1 }, coatrack: { w: 1, d: 1 }, bathtub: { w: 2, d: 1 }, washer: { w: 1, d: 1 }, desk: { w: 2, d: 1 },
    aquarium: { w: 2, d: 1 }, cattower: { w: 1, d: 1 }, fountain: { w: 2, d: 2 }, chandelier: { w: 1, d: 1 }, garden: { w: 2, d: 1 },
    petbed_deluxe: { w: 1, d: 1 }, cozy_fireplace: { w: 2, d: 1 }, catcastle: { w: 2, d: 1 }, music_jukebox: { w: 1, d: 1 }, crystal_fountain: { w: 2, d: 2 },
    shelf: { w: 2, d: 1 }, hab: { w: 1, d: 1 }, table: { w: 2, d: 1 },
    playpen: { w: 3, d: 3, pen: 1 }, playpen_adventure: { w: 4, d: 3, pen: 2 }, playpen_castle: { w: 4, d: 4, pen: 3 }, playpen_waterpark: { w: 5, d: 4, pen: 4 },
    toyshelf: { w: 2, d: 1 }, supshelf: { w: 2, d: 1 }, clothrack: { w: 2, d: 1 }, groomtable: { w: 2, d: 1 }, hotel: { w: 2, d: 2 },
    pumpkin: { w: 1, d: 1 }, xmastree: { w: 1, d: 1 }, sakura: { w: 1, d: 1 }, parasol: { w: 1, d: 1 },
    l_lantern: { w: 1, d: 1 }, l_tablelamp: { w: 1, d: 1 }, l_string: { w: 2, d: 1 }, l_neon: { w: 1, d: 1 }, l_candles: { w: 1, d: 1 }, l_street: { w: 1, d: 1 }, l_moon: { w: 1, d: 1 }, l_tree: { w: 1, d: 1 }, l_arc: { w: 1, d: 1 },
    h_bed: { w: 2, d: 1 }, h_dbed: { w: 2, d: 2 }, h_canopy: { w: 2, d: 2 }, h_wardrobe: { w: 1, d: 1 }, h_vanity: { w: 1, d: 1 }, h_piano: { w: 2, d: 1 }, h_fire: { w: 2, d: 1 }, h_petbed: { w: 1, d: 1 }, h_heart: { w: 2, d: 2, flat: 1 }, h_dining: { w: 2, d: 2 }, h_stove: { w: 1, d: 1 }, h_bookpile: { w: 1, d: 1 }, h_frame: { w: 1, d: 1 },
  };
  function seasonItem(c, kind, t) {
    const [x, y] = P(.5, .5, 0);
    if (kind === 'pumpkin') {
      for (const [dx, r, col] of [[-9, 10, '#e8862a'], [9, 10, '#e8862a'], [0, 12, '#f29a3a']]) ell(c, x + dx, y - 11, r * .8, r, col, OUT, 1.2);
      rrect(c, x - 2, y - 27, 4, 6, 1.5); c.fillStyle = '#5a8a3a'; c.fill();
      c.fillStyle = '#5a2a10'; for (const s of [-1, 1]) { c.beginPath(); c.moveTo(x + s * 6, y - 15); c.lineTo(x + s * 2, y - 15); c.lineTo(x + s * 4, y - 19); c.closePath(); c.fill(); }
      c.beginPath(); c.moveTo(x - 7, y - 9); c.quadraticCurveTo(x, y - 4, x + 7, y - 9); c.lineTo(x + 4, y - 8); c.lineTo(x, y - 6.5); c.lineTo(x - 4, y - 8); c.closePath(); c.fill();
      const g = .5 + .5 * Math.sin(t * 5); c.fillStyle = `rgba(255,200,60,${.25 + g * .3})`; ell(c, x, y - 12, 16, 12, c.fillStyle);
    } else if (kind === 'xmastree') {
      rrect(c, x - 3, y - 10, 6, 10, 1); c.fillStyle = '#7a4a28'; c.fill();
      for (const [yy, w] of [[-10, 18], [-24, 15], [-37, 11]]) { c.beginPath(); c.moveTo(x - w, y + yy); c.lineTo(x, y + yy - 18); c.lineTo(x + w, y + yy); c.closePath(); c.fillStyle = '#3f8a4a'; c.fill(); c.lineWidth = 1.2; c.strokeStyle = OUT; c.stroke(); }
      const cols = ['#e0343c', '#f2c14e', '#4a8ee0', '#ff7ab8'];
      for (let i = 0; i < 9; i++) { const k = (Math.sin(t * 3 + i) + 1) / 2; ell(c, x + Math.sin(i * 2.3) * (4 + i * 1.2), y - 14 - i * 4.2, 1.8, 1.8, cols[i % 4]); c.globalAlpha = k * .6; ell(c, x + Math.sin(i * 2.3) * (4 + i * 1.2), y - 14 - i * 4.2, 3.5, 3.5, '#fff6b0'); c.globalAlpha = 1; }
      c.font = '12px sans-serif'; c.textAlign = 'center'; c.fillText('⭐', x, y - 56); c.textAlign = 'start';
    } else if (kind === 'sakura') {
      box(c, .32, .32, .36, .36, 10, '#b98552');
      rrect(c, x - 2.5, y - 34, 5, 26, 2); c.fillStyle = '#7a4a38'; c.fill();
      for (const [dx, dy, r] of [[0, -44, 15], [-12, -36, 11], [12, -36, 11], [-6, -52, 10], [7, -51, 10]]) ell(c, x + dx, y + dy, r, r * .85, dx % 2 ? '#ffc2d4' : '#ffd6e2', 'rgba(200,110,140,.7)', 1);
      for (let i = 0; i < 3; i++) { const k = ((t * .4 + i * .33) % 1); ell(c, x - 10 + i * 10 + Math.sin(t * 2 + i) * 4, y - 30 + k * 30, 1.8, 1.3, '#ffb3c7'); }
    } else if (kind === 'parasol') {
      rrect(c, x - 1.5, y - 50, 3, 50, 1); c.fillStyle = '#d9d4c8'; c.fill();
      for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(x, y - 56); const a0 = Math.PI + i * Math.PI / 6, a1 = a0 + Math.PI / 6; c.lineTo(x + Math.cos(a0) * 28, y - 44 + Math.sin(a0) * -2); c.quadraticCurveTo(x + Math.cos((a0 + a1) / 2) * 30, y - 42, x + Math.cos(a1) * 28, y - 44 + Math.sin(a1) * -2); c.closePath(); c.fillStyle = i % 2 ? '#ffffff' : '#4a9ae8'; c.fill(); c.lineWidth = 1; c.strokeStyle = OUT; c.stroke(); }
      ell(c, x + 12, y - 5, 7, 7, '#ff6a6a', OUT, 1); c.beginPath(); c.moveTo(x + 5, y - 5); c.lineTo(x + 19, y - 5); c.strokeStyle = '#fff'; c.lineWidth = 2; c.stroke();
    }
  }
  // ---------- my home furniture (procedural, pastel) ----------
  function homeItem(c, kind, t) {
    const leg = (x, y, h, col) => box(c, x, y, .08, .08, h, col || '#b98552');
    switch (kind) {
      case 'h_bed': case 'h_dbed': case 'h_canopy': {
        const D = kind === 'h_bed' ? 1 : 2, W = 2, blanket = kind === 'h_canopy' ? '#e7b4e8' : kind === 'h_dbed' ? '#9cc7e8' : '#f4a7b9';
        if (kind === 'h_canopy') for (const [x, y] of [[.04, .04], [1.86, .04]]) box(c, x, y, .1, .1, 96, '#f3e3c7');
        box(c, .05, .06, W - .1, D - .12, 10, '#e8c49a');
        box(c, .1, .1, W - .2, D - .2, 8, '#fffaf2', 10);
        box(c, 0, .04, .16, D - .08, kind === 'h_canopy' ? 44 : 34, kind === 'h_canopy' ? '#f3e3c7' : '#d9a877');
        for (let i = 0; i < D; i++) box(c, .22, .16 + i * 1, .42, D === 1 ? .68 : .72, 6, '#ffffff', 18);
        box(c, .8, .08, W - .88, D - .16, 4, blanket, 18);
        poly(c, [P(.8, D - .08, 22), P(W - .08, D - .08, 22), P(W - .08, D - .08, 8), P(.8, D - .08, 8)], shade(blanket, -.08), OUT, 1);
        for (let i = 0; i < 4; i++) { const [hx, hy] = P(1.05 + i * .25, D / 2 + (i % 2 ? .2 : -.2), 22); c.font = '8px sans-serif'; c.fillStyle = 'rgba(255,255,255,.8)'; c.fillText('♥', hx - 3, hy + 3); }
        if (kind === 'h_canopy') {
          box(c, .04, D - .14, .1, .1, 96, '#f3e3c7'); box(c, 1.86, D - .14, .1, .1, 96, '#f3e3c7');
          const top = [P(0, 0, 96), P(W, 0, 96), P(W, D, 96), P(0, D, 96)];
          poly(c, top, 'rgba(255,214,232,.75)', OUT, 1.1);
          for (let i = 0; i < 8; i++) { const a = P(i * W / 8, D, 96), b = P((i + 1) * W / 8, D, 96), m = P((i + .5) * W / 8, D, 86); c.beginPath(); c.moveTo(a[0], a[1]); c.quadraticCurveTo(m[0], m[1] + 6, b[0], b[1]); c.fillStyle = '#ffc2dc'; c.fill(); c.strokeStyle = OUT; c.lineWidth = .8; c.stroke(); }
          for (let j = 0; j < 8; j++) { const a = P(W, j * D / 8, 96), b = P(W, (j + 1) * D / 8, 96), m = P(W, (j + .5) * D / 8, 86); c.beginPath(); c.moveTo(a[0], a[1]); c.quadraticCurveTo(m[0], m[1] + 6, b[0], b[1]); c.fillStyle = '#f7b0d0'; c.fill(); c.strokeStyle = OUT; c.lineWidth = .8; c.stroke(); }
          const [cx0, cy0] = P(W / 2, D / 2, 100); c.font = '12px sans-serif'; c.textAlign = 'center'; c.fillText('👑', cx0, cy0); c.textAlign = 'start';
        }
        break;
      }
      case 'h_wardrobe': {
        box(c, .08, .15, .84, .75, 92, '#f3d9b5', 0, { left: '#ecc99d' });
        line(c, P(.5, .9, 8), P(.5, .9, 84), 'rgba(90,60,30,.6)', 1.2);
        for (const x of [.42, .58]) { const [kx, ky] = P(x, .9, 46); ell(c, kx, ky, 1.8, 1.8, '#c8963f'); }
        poly(c, [P(.14, .9, 4), P(.86, .9, 4), P(.86, .9, 0), P(.14, .9, 0)], '#b98552');
        box(c, .04, .11, .92, .83, 5, '#e2b98a', 92);
        break;
      }
      case 'h_vanity': {
        leg(.12, .55, 26); leg(.8, .55, 26); leg(.8, .12, 26); leg(.12, .12, 26);
        box(c, .08, .1, .84, .55, 6, '#fbe4ec', 26);
        box(c, .1, .6, .6, .06, 16, '#f5cfdc', 10);
        const [mx, my] = P(.5, .22, 62); ell(c, mx, my, 15, 20, '#f7c6d6', OUT, 1.2); ell(c, mx, my, 11, 15.5, '#e3f3fb'); ell(c, mx - 4, my - 6, 3, 6, 'rgba(255,255,255,.8)');
        const [px, py] = P(.3, .35, 32); rrect(c, px - 2, py - 7, 4, 7, 1); c.fillStyle = '#ff7ab8'; c.fill(); const [qx, qy] = P(.7, .45, 32); ell(c, qx, qy - 3, 3, 3, '#b59be0', OUT, .8);
        const [sx, sy] = P(.5, .85, 0); rrect(c, sx - 1.5, sy - 14, 3, 14, 1); c.fillStyle = '#c8963f'; c.fill(); ell(c, sx, sy - 15, 8, 4, '#ff9ec0', OUT, 1);
        break;
      }
      case 'h_piano': {
        box(c, .05, .1, 1.9, .5, 58, '#2d2a33', 0, { top: '#3c3844' });
        box(c, .05, .6, 1.9, .3, 6, '#2d2a33', 26);
        box(c, .08, .6, 1.84, .22, 3, '#fdfbf6', 32);
        for (let i = 0; i < 14; i++) { const a = P(.14 + i * .13, .6, 35), b = P(.14 + i * .13, .72, 35); if (i % 7 !== 2 && i % 7 !== 6) line(c, a, b, '#2d2a33', 2); }
        leg(.1, .8, 26, '#2d2a33'); leg(1.82, .8, 26, '#2d2a33');
        const [nx, ny] = P(1, .3, 64); c.font = '11px sans-serif'; c.fillStyle = '#fff'; c.fillText('♪', nx - 14 + Math.sin(t * 2) * 2, ny - 4); c.fillText('♫', nx + 6, ny - 10 + Math.cos(t * 2) * 2);
        break;
      }
      case 'h_fire': {
        box(c, .05, .2, 1.9, .7, 56, '#c7785a', 0, { top: '#e6d6c4' });
        box(c, 0, .15, 2, .8, 6, '#efe3d2', 56);
        const q = [P(.55, .9, 4), P(1.45, .9, 4), P(1.45, .9, 36), P(.55, .9, 36)]; poly(c, q, '#3a2a24', OUT, 1);
        for (let i = 0; i < 3; i++) { const [fx, fy] = P(.75 + i * .25, .9, 6); const h = 16 + Math.sin(t * 9 + i * 2) * 4; c.beginPath(); c.moveTo(fx - 6, fy); c.quadraticCurveTo(fx - 5, fy - h * .6, fx, fy - h); c.quadraticCurveTo(fx + 5, fy - h * .6, fx + 6, fy); c.closePath(); c.fillStyle = i === 1 ? '#ffb347' : '#ff7a3a'; c.fill(); }
        const g = c.createRadialGradient(q[0][0] + 30, q[0][1] - 20, 2, q[0][0] + 30, q[0][1] - 20, 55); g.addColorStop(0, 'rgba(255,190,90,.35)'); g.addColorStop(1, 'rgba(255,190,90,0)'); c.fillStyle = g; c.fillRect(q[0][0] - 30, q[0][1] - 80, 120, 110);
        for (let i = 0; i < 6; i++) { const a = P(.1 + i * .3, .9, 44), b = P(.1 + i * .3 + .25, .9, 44); line(c, a, b, 'rgba(120,60,40,.35)', 1); }
        const [sx, sy] = P(1.6, .45, 62); c.font = '12px sans-serif'; c.fillText('🧦', sx - 6, sy);
        break;
      }
      case 'h_petbed': {
        const [x, y] = P(.5, .5, 0);
        ell(c, x, y - 4, 24, 12, '#f29ab4', OUT, 1.2); ell(c, x, y - 7, 19, 9, '#ffd6e2'); ell(c, x, y - 6, 12, 5.5, '#ffc2d4');
        c.font = '8px sans-serif'; c.fillStyle = '#fff'; c.fillText('🐾', x - 5, y - 3);
        break;
      }
      case 'h_heart': {
        const heart = (k, fill, st) => { c.beginPath(); for (let i = 0; i <= 48; i++) { const a = i / 48 * Math.PI * 2, hx = 16 * Math.pow(Math.sin(a), 3), hy = 13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a); const u = (hy - hx) / 26 * k, v = (hy + hx) / 26 * k, q = P(1 - u, 1 - v); i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]); } c.closePath(); c.fillStyle = fill; c.fill(); if (st) { c.lineWidth = 1.4; c.strokeStyle = OUT; c.stroke(); } };
        heart(.95, '#ff9ec0', 1); heart(.7, '#ffd6e2'); heart(.35, '#ffb3cc');
        break;
      }
      case 'h_dining': {
        const chair = (x, y) => { leg(x, y, 12, '#c8963f'); leg(x + .26, y, 12, '#c8963f'); leg(x, y + .26, 12, '#c8963f'); leg(x + .26, y + .26, 12, '#c8963f'); box(c, x - .02, y - .02, .38, .38, 4, '#ffd6a8', 12); };
        chair(.04, .82); chair(.82, .04);
        leg(.45, .45, 30); leg(1.45, .45, 30); leg(.45, 1.45, 30); leg(1.45, 1.45, 30);
        box(c, .38, .38, 1.24, 1.24, 5, '#f3d9b5', 30);
        const [x, y] = P(1, 1, 35); ell(c, x - 12, y, 7, 3.5, '#fff', OUT, .8); ell(c, x + 12, y, 7, 3.5, '#fff', OUT, .8); ell(c, x, y - 3, 4, 4, '#ff7a7a'); rrect(c, x - 1.5, y - 16, 3, 12, 1); c.fillStyle = '#9ad0a0'; c.fill(); ell(c, x, y - 17, 4, 3, '#ff9ec0');
        chair(1.6, .82); chair(.82, 1.6);
        break;
      }
      case 'h_stove': {
        box(c, .08, .12, .84, .78, 40, '#f4f1ec', 0, { top: '#3a3a40' });
        for (const [u, v] of [[.3, .3], [.7, .3], [.3, .7], [.7, .7]]) { const [bx, by] = P(u, v, 40); ell(c, bx, by, 6, 3, '#555', '#222', .8); }
        const q = [P(.2, .9, 6), P(.8, .9, 6), P(.8, .9, 30), P(.2, .9, 30)]; poly(c, q, '#3a3a40', OUT, 1);
        const [hx, hy] = P(.5, .9, 32); rrect(c, hx - 10, hy - 2, 20, 2.5, 1); c.fillStyle = '#c0c0c8'; c.fill();
        const [px, py] = P(.7, .3, 44); ell(c, px, py, 7, 3.5, '#ff9ec0', OUT, 1); rrect(c, px - 7, py - 6, 14, 6, 2); c.fillStyle = '#ff9ec0'; c.fill();
        if (Math.sin(t * 2) > 0) { c.fillStyle = 'rgba(255,255,255,.7)'; ell(c, px + Math.sin(t * 3) * 2, py - 14, 3, 3, c.fillStyle); }
        break;
      }
      case 'h_bookpile': {
        const cols = ['#ef8fa8', '#6d9dc5', '#f2c14e', '#90be6d', '#b59be0'];
        for (let i = 0; i < 5; i++) box(c, .25 + (i % 2) * .05, .25, .5, .5, 5, cols[i], i * 5);
        const [x, y] = P(.5, .5, 26); c.font = '10px sans-serif'; c.fillText('☕', x - 5, y);
        break;
      }
      case 'h_frame': {
        box(c, .1, .1, .1, .8, 3, '#b98552');
        const q = [P(.12, .15, 70), P(.12, .85, 70), P(.12, .85, 30), P(.12, .15, 30)]; poly(c, q, '#c8963f', OUT, 1.2);
        const q2 = [P(.12, .22, 64), P(.12, .78, 64), P(.12, .78, 36), P(.12, .22, 36)]; poly(c, q2, '#ffe8f0', null);
        { const [x, y] = P(.12, .5, 50);
          const face = (fx, fy, girl) => {
            if (girl) { c.beginPath(); c.ellipse(fx, fy + 2, 6.2, 7.5, 0, 0, 7); c.fillStyle = '#6b3f26'; c.fill(); }
            ell(c, fx, fy, 4.6, 4.6, '#ffe0c7', 'rgba(60,38,25,.7)', .7);
            c.beginPath(); c.arc(fx, fy - 1, 4.8, Math.PI * 1.05, Math.PI * 1.95); c.lineTo(fx + 3, fy - 2); c.lineTo(fx - 3.5, fy - 2.4); c.closePath(); c.fillStyle = girl ? '#6b3f26' : '#2e2420'; c.fill();
            ell(c, fx - 1.6, fy + .6, .7, .9, '#3b2616'); ell(c, fx + 1.6, fy + .6, .7, .9, '#3b2616'); ell(c, fx - 2.6, fy + 2, 1, .6, 'rgba(255,120,150,.6)'); ell(c, fx + 2.6, fy + 2, 1, .6, 'rgba(255,120,150,.6)');
            if (girl) { ell(c, fx - 3.2, fy - 4.2, 1.8, 1.3, '#ff6fa0'); ell(c, fx - 1.4, fy - 4.6, 1.8, 1.3, '#ff6fa0'); }
            rrect(c, fx - 4, fy + 4.5, 8, 4, 2); c.fillStyle = girl ? '#ff9ec0' : '#6d9dc5'; c.fill();
          };
          face(x - 4.5, y + 1, false); face(x + 4.5, y + 1, true);
          c.font = '7px sans-serif'; c.fillStyle = '#ff5a8a'; c.textAlign = 'center'; c.fillText('♥', x, y - 7); c.textAlign = 'start'; }
        leg(.35, .3, 34, '#8a5a3b'); leg(.35, .62, 34, '#8a5a3b');
        break;
      }
    }
  }
  // ---------- lights (shop & home) ----------
  const LIGHT = { lamp: [[.5, .5, 50, 90, .32]], l_lantern: [[.5, .5, 16, 60, .34]], l_tablelamp: [[.5, .5, 44, 70, .3]], l_string: [[.4, .5, 44, 55, .2], [1, .5, 40, 55, .22], [1.6, .5, 44, 55, .2]], l_neon: [[.5, .5, 44, 70, .3, '255,120,190']], l_candles: [[.5, .5, 14, 55, .32]], l_street: [[.5, .5, 70, 120, .34]], l_moon: [[.5, .5, 36, 80, .3, '190,210,255']], l_tree: [[.5, .5, 40, 80, .26, '255,200,230']], l_arc: [[.9, .9, 62, 100, .32]], h_fire: [[1, .9, 20, 110, .4, '255,150,70']], chandelier: [[.5, .5, 40, 60, .15]] };
  function lightItem(c, kind, t) {
    const leg = (x, y, h, col) => box(c, x, y, .07, .07, h, col || '#8a6a4a');
    const glowAt = (x, y, r, col, k) => { const g = c.createRadialGradient(x, y, 1, x, y, r); g.addColorStop(0, `rgba(${col || '255,225,150'},${k || .7})`); g.addColorStop(1, `rgba(${col || '255,225,150'},0)`); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); };
    const flame = (x, y, s) => { const f = 1 + Math.sin(t * 12 + x) * .15; c.beginPath(); c.moveTo(x, y - 9 * s * f); c.quadraticCurveTo(x + 4 * s, y - 3 * s, x, y); c.quadraticCurveTo(x - 4 * s, y - 3 * s, x, y - 9 * s * f); c.fillStyle = '#ffb347'; c.fill(); ell(c, x, y - 3 * s, 1.6 * s, 2.4 * s, '#fff3b0'); };
    switch (kind) {
      case 'l_lantern': {
        const [x, y] = P(.5, .5, 0); ell(c, x, y, 12, 5, 'rgba(0,0,0,.15)');
        rrect(c, x - 9, y - 30, 18, 28, 3); c.fillStyle = 'rgba(255,236,190,.85)'; c.fill(); c.lineWidth = 2; c.strokeStyle = '#3d4450'; c.stroke();
        line(c, [x, y - 30], [x, y - 2], '#3d4450', 1.5); flame(x, y - 8, 1.1); glowAt(x, y - 14, 22);
        c.beginPath(); c.moveTo(x - 11, y - 30); c.lineTo(x, y - 38); c.lineTo(x + 11, y - 30); c.closePath(); c.fillStyle = '#3d4450'; c.fill(); c.beginPath(); c.arc(x, y - 41, 4, Math.PI, 0); c.strokeStyle = '#3d4450'; c.lineWidth = 1.5; c.stroke();
        break;
      }
      case 'l_tablelamp': {
        leg(.25, .72, 22); leg(.72, .72, 22); leg(.72, .25, 22); leg(.25, .25, 22);
        box(c, .2, .2, .6, .6, 4, '#e2b98a', 22);
        const [x, y] = P(.5, .5, 26); rrect(c, x - 2, y - 14, 4, 14, 1); c.fillStyle = '#c8963f'; c.fill(); ell(c, x, y, 7, 3, '#c8963f');
        c.beginPath(); c.moveTo(x - 12, y - 12); c.lineTo(x - 7, y - 28); c.lineTo(x + 7, y - 28); c.lineTo(x + 12, y - 12); c.closePath(); c.fillStyle = '#ffd6e2'; c.fill(); c.strokeStyle = OUT; c.lineWidth = 1.1; c.stroke(); glowAt(x, y - 16, 26);
        break;
      }
      case 'l_string': {
        box(c, .08, .45, .08, .08, 58, '#b98552'); const a = P(.12, .49, 58), b = P(1.88, .49, 58);
        const pts = []; for (let i = 0; i <= 12; i++) { const u = i / 12, sag = Math.sin(u * Math.PI) * 14; pts.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u + sag]); }
        c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.strokeStyle = '#3a4a3a'; c.lineWidth = 1.2; c.stroke();
        const cols = ['255,120,120', '255,210,90', '120,200,255', '160,230,140', '255,150,220'];
        pts.slice(1, -1).forEach((p, i) => { const on = .6 + .4 * Math.sin(t * 3 + i * 1.7); ell(c, p[0], p[1] + 4, 2.6, 3.4, `rgba(${cols[i % 5]},${on})`, OUT, .6); glowAt(p[0], p[1] + 4, 8, cols[i % 5], .5 * on); });
        box(c, 1.84, .45, .08, .08, 58, '#b98552');
        break;
      }
      case 'l_neon': {
        box(c, .15, .4, .7, .2, 8, '#555b66'); const q = [P(.2, .5, 70), P(.8, .5, 70), P(.8, .5, 12), P(.2, .5, 12)]; poly(c, q, '#2b2440', OUT, 1.2);
        const [x, y] = P(.5, .5, 42); const on = .75 + .25 * Math.sin(t * 5); glowAt(x, y, 34, '255,120,190', .45 * on);
        c.save(); c.shadowColor = '#ff6ab8'; c.shadowBlur = 8; c.strokeStyle = `rgba(255,140,200,${on})`; c.lineWidth = 2.4; c.beginPath(); const s = 9; c.moveTo(x, y + s * .9); c.bezierCurveTo(x - s * 1.6, y - s * .1, x - s * .8, y - s * 1.4, x, y - s * .5); c.bezierCurveTo(x + s * .8, y - s * 1.4, x + s * 1.6, y - s * .1, x, y + s * .9); c.stroke();
        c.font = 'bold 7px sans-serif'; c.fillStyle = `rgba(160,240,255,${on})`; c.textAlign = 'center'; c.fillText('PETS', x, y + 18); c.textAlign = 'start'; c.restore();
        break;
      }
      case 'l_candles': {
        const [x, y] = P(.5, .5, 0); ell(c, x, y - 2, 18, 8, '#c8963f', OUT, 1); ell(c, x, y - 4, 15, 6, '#e2b98a');
        for (const [dx, dy, h] of [[-8, -2, 14], [6, -4, 20], [0, 3, 10]]) { rrect(c, x + dx - 3.5, y + dy - 4 - h, 7, h, 2); c.fillStyle = '#fff6e8'; c.fill(); c.strokeStyle = 'rgba(60,38,25,.4)'; c.lineWidth = .8; c.stroke(); flame(x + dx, y + dy - 5 - h, .8); }
        glowAt(x, y - 20, 26);
        break;
      }
      case 'l_street': {
        const [x, y] = P(.5, .5, 0); ell(c, x, y, 9, 4, '#3d4450'); rrect(c, x - 2.2, y - 72, 4.4, 72, 2); c.fillStyle = '#3d4450'; c.fill();
        for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(x, y - 66); c.quadraticCurveTo(x + sd * 12, y - 70, x + sd * 14, y - 62); c.strokeStyle = '#3d4450'; c.lineWidth = 2; c.stroke(); rrect(c, x + sd * 14 - 5, y - 62, 10, 12, 3); c.fillStyle = '#ffe6a8'; c.fill(); c.strokeStyle = '#3d4450'; c.lineWidth = 1.2; c.stroke(); glowAt(x + sd * 14, y - 56, 18); }
        ell(c, x, y - 76, 4, 4, '#3d4450');
        break;
      }
      case 'l_moon': {
        const [x, y] = P(.5, .5, 0); ell(c, x, y - 2, 11, 5, '#e8e0f5', OUT, 1); rrect(c, x - 1.5, y - 20, 3, 18, 1); c.fillStyle = '#c9c0dc'; c.fill();
        const cy = y - 36; glowAt(x, cy, 30, '190,210,255', .55); ell(c, x, cy, 15, 15, '#fff6d8', OUT, 1.2); ell(c, x + 6, cy - 4, 12, 13, '#f1e6c8'); ell(c, x - 5, cy + 4, 2.5, 2, 'rgba(200,180,140,.5)'); ell(c, x - 2, cy - 6, 1.8, 1.5, 'rgba(200,180,140,.5)');
        c.font = '8px sans-serif'; c.fillStyle = '#fff'; c.fillText('✦', x + 12, cy - 12 + Math.sin(t * 2) * 1.5);
        break;
      }
      case 'l_tree': {
        box(c, .3, .3, .4, .4, 14, '#e8a0b4'); const [x, y] = P(.5, .5, 14); rrect(c, x - 2, y - 22, 4, 22, 1); c.fillStyle = '#7a4a38'; c.fill();
        for (const [dx, dy, r] of [[0, -38, 15], [-11, -30, 11], [11, -30, 11], [0, -50, 10]]) ell(c, x + dx, y + dy, r, r * .85, '#6fb85a', 'rgba(40,70,30,.6)', 1);
        const cols = ['#ffd24a', '#ff8ab8', '#8ad0ff', '#fff'];
        for (let i = 0; i < 12; i++) { const a = i * 2.4, rr = 6 + (i % 4) * 3.5, px = x + Math.cos(a) * rr, py = y - 38 + Math.sin(a) * rr * .8 - (i % 3) * 3, on = .5 + .5 * Math.sin(t * 4 + i); c.globalAlpha = .4 + .6 * on; ell(c, px, py, 1.8, 1.8, cols[i % 4]); c.globalAlpha = 1; }
        glowAt(x, y - 38, 28, '255,220,180', .3);
        break;
      }
      case 'l_arc': {
        const [x, y] = P(.2, .2, 0); ell(c, x, y - 2, 10, 5, '#d9d4c8', OUT, 1);
        const [ex, ey] = P(.9, .9, 62); c.beginPath(); c.moveTo(x, y - 4); c.quadraticCurveTo(x - 4, ey - 34, ex, ey - 4); c.strokeStyle = '#c0c4cc'; c.lineWidth = 2.4; c.stroke();
        ell(c, ex, ey + 2, 13, 7, '#f2c14e', OUT, 1.1); ell(c, ex, ey + 5, 9, 3, '#fff3b0'); glowAt(ex, ey + 8, 30);
        break;
      }
    }
  }
  function item(c, kind, t, rot) {
    if (kind.startsWith('h_')) { homeItem(c, kind, t || 0); return; }
    if (kind.startsWith('l_')) { lightItem(c, kind, t || 0); return; }
    if (kind === 'pumpkin' || kind === 'xmastree' || kind === 'sakura' || kind === 'parasol') { seasonItem(c, kind, t || 0); return; }
    // Items that have high-fidelity procedural models will render procedurally
    const procItems = ['counter', 'shelf', 'supshelf', 'aquarium', 'cattower', 'toyshelf', 'plant', 'lamp', 'rug', 'bench', 'table', 'armchair', 'bookcase', 'tv', 'fridge', 'desk', 'washer', 'bathtub', 'coatrack', 'radio', 'fountain', 'chandelier', 'clothrack', 'groomtable', 'hotel', 'petbed_deluxe', 'cozy_fireplace', 'catcastle', 'music_jukebox', 'crystal_fountain', 'playpen', 'playpen_adventure', 'playpen_castle', 'playpen_waterpark'];
    const skey = kind === 'supshelf' ? 'shelf' : kind, sp = SPR[skey];
    if (sp && sp.complete && sp.naturalWidth && !procItems.includes(kind)) {
      // Draw ground contact shadow before drawing the sprite
      const fp = DEF[kind] || { w: 1, d: 1 };
      poly(c, [P(-.05, -.05), P(fp.w + .08, -.05), P(fp.w + .08, fp.d + .08), P(-.05, fp.d + .08)], 'rgba(25,12,6,.22)');
      const m = SPR_META[skey]; c.drawImage(sp, -m[2], -m[3], m[0], m[1]); return;
    }
    switch (kind) {
      case 'counter': {
        // High-fidelity coffee bar & checkout counter (Image 9 style)
        box(c, 0, .12, 2, .76, 28, '#844f26', 0, { top: '#f5efe4' });
        // Recessed cabinet panel doors on the front (south face)
        for (const dx of [.22, 1.12]) {
          const p0 = P(dx, .88, 24), p1 = P(dx + .66, .88, 24), p2 = P(dx + .66, .88, 4), p3 = P(dx, .88, 4);
          poly(c, [p0, p1, p2, p3], '#6f3f1c', 'rgba(40,20,8,.6)', 1);
          line2(c, p0, p1, 'rgba(255,255,255,.18)', 1);
          // brass knob
          const kb = P(dx + (dx < 1 ? .56 : .1), .88, 14);
          ell(c, kb[0], kb[1], 2, 2, '#f5c542', OUT, .8);
          ell(c, kb[0] - .5, kb[1] - .5, .7, .7, '#fff');
        }
        // Countertop bevel shine
        line2(c, P(0, .12, 28), P(2, .12, 28), 'rgba(255,255,255,.55)', 1.4);
        line2(c, P(0, .88, 28), P(2, .88, 28), 'rgba(255,255,255,.4)', 1.2);
        // Espresso Coffee Machine (left)
        const [mx, my] = P(.55, .52, 28);
        rrect(c, mx - 12, my - 24, 24, 22, 3);
        const gMach = c.createLinearGradient(mx - 12, my - 24, mx + 12, my - 2);
        gMach.addColorStop(0, '#e03a42'); gMach.addColorStop(0.65, '#c0242c'); gMach.addColorStop(1, '#8a161c');
        c.fillStyle = gMach; c.fill(); c.strokeStyle = OUT; c.lineWidth = 1.2; c.stroke();
        // Chrome top cup warmer & cups
        rrect(c, mx - 11, my - 27, 22, 4, 1.5); c.fillStyle = '#dce2e8'; c.fill(); c.stroke();
        for (let i = 0; i < 3; i++) ell(c, mx - 8 + i * 8, my - 28, 2.5, 1.8, '#ffffff', '#8a94a0', .8);
        // Chrome dispenser group & pressure gauge
        rrect(c, mx - 9, my - 14, 18, 12, 2); c.fillStyle = '#454e59'; c.fill();
        ell(c, mx - 5, my - 9, 2.5, 2.5, '#ffffff', OUT, .7);
        ell(c, mx + 4, my - 7, 2.2, 2.2, '#fff'); // cup on drip tray
        // Portafilter handle
        c.beginPath(); c.moveTo(mx - 4, my - 8); c.lineTo(mx - 13, my - 6); c.lineWidth = 2.4; c.lineCap = 'round'; c.strokeStyle = '#222'; c.stroke();
        // Glass cloche cake display (middle)
        const [cx0, cy0] = P(1.15, .52, 28);
        ell(c, cx0, cy0 - 2, 9, 4.5, '#dfd8cc', OUT, 1);
        ell(c, cx0, cy0 - 4, 6.5, 4, '#e88ba7', OUT, .8); // cake slice
        ell(c, cx0, cy0 - 7, 2, 2, '#d92534'); // strawberry on top
        c.beginPath(); c.ellipse(cx0, cy0 - 5, 8.5, 9, 0, Math.PI, 0); c.fillStyle = 'rgba(210,240,255,.38)'; c.fill(); c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 1.1; c.stroke();
        ell(c, cx0, cy0 - 15, 2, 2, '#ffffff'); // cloche glass handle
        // POS Tablet Terminal (right)
        const [rx, ry] = P(1.65, .52, 28);
        rrect(c, rx - 1.5, ry - 10, 3, 10, 1); c.fillStyle = '#c8d0d8'; c.fill();
        c.save(); c.translate(rx, ry - 14); c.rotate(-.18);
        rrect(c, -8, -10, 16, 12, 2); c.fillStyle = '#2b303a'; c.fill(); c.strokeStyle = OUT; c.lineWidth = 1; c.stroke();
        rrect(c, -7, -9, 14, 10, 1); c.fillStyle = '#a8e6cf'; c.fill();
        c.fillStyle = '#2b7a5a'; c.fillRect(-5, -6, 10, 2); c.fillRect(-5, -2, 7, 2);
        c.restore();
        break;
      }
      case 'shelf': case 'supshelf': {
        drawShelfUnit(c, kind, rot);
        break;
      }
      case 'plant': {
        // High-fidelity Guzmania Bromeliad in Cobalt Blue Glazed Ceramic Pot (Screenshot 3 style)
        const [px, py] = P(.5, .5, 0);
        c.save();
        c.translate(px, py);

        // 1. Contact shadow on floor
        ell(c, 0, 1, 15, 7.5, 'rgba(20,10,4,.28)');
        ell(c, 0, 0, 11, 5.5, 'rgba(15,8,3,.35)');

        // 2. Cobalt Blue Glazed Ceramic Pot
        const potBaseW = 7.5, potBellyW = 12.5, potRimW = 10.5;
        const potBaseY = 0, potBellyY = -8.5, potRimY = -17;

        // Pot body path (smooth rounded ceramic urn)
        c.beginPath();
        c.moveTo(-potBaseW, potBaseY);
        c.quadraticCurveTo(-potBellyW * 1.08, potBellyY, -potRimW, potRimY);
        c.lineTo(potRimW, potRimY);
        c.quadraticCurveTo(potBellyW * 1.08, potBellyY, potBaseW, potBaseY);
        c.closePath();

        // Ceramic glaze gradient (deep cobalt blue with rich highlights and shadows)
        const potGrad = c.createLinearGradient(-potBellyW, 0, potBellyW, 0);
        potGrad.addColorStop(0, '#1d3e87');
        potGrad.addColorStop(0.22, '#386ad4');
        potGrad.addColorStop(0.48, '#2551b5');
        potGrad.addColorStop(0.8, '#153378');
        potGrad.addColorStop(1, '#0e2052');
        c.fillStyle = potGrad;
        c.fill();
        c.lineWidth = 1.3;
        c.strokeStyle = '#0b193d';
        c.stroke();

        // Pot base curve
        ell(c, 0, potBaseY, potBaseW, 3, '#102456', '#0b193d', 1);

        // Ceramic glossy specular sheen (curved reflection streak on left)
        c.beginPath();
        c.moveTo(-potBaseW * 0.55, potBaseY - 1);
        c.quadraticCurveTo(-potBellyW * 0.72, potBellyY, -potRimW * 0.6, potRimY + 1.5);
        c.strokeStyle = 'rgba(255,255,255,.55)';
        c.lineWidth = 2.4;
        c.lineCap = 'round';
        c.stroke();

        // Secondary soft glaze sheen
        c.beginPath();
        c.moveTo(-potBaseW * 0.35, potBaseY - 2);
        c.quadraticCurveTo(-potBellyW * 0.48, potBellyY, -potRimW * 0.4, potRimY + 2.5);
        c.strokeStyle = 'rgba(255,255,255,.25)';
        c.lineWidth = 1.5;
        c.stroke();

        // Subtle ambient edge reflection on right
        c.beginPath();
        c.moveTo(potBellyW * 0.75, potBellyY - 2);
        c.quadraticCurveTo(potBellyW * 0.85, potBellyY + 2, potBaseW * 0.65, potBaseY - 1);
        c.strokeStyle = 'rgba(120,180,255,.2)';
        c.lineWidth = 1.2;
        c.stroke();

        // Pot top rim lip & rich potting soil
        ell(c, 0, potRimY, potRimW, 4.6, '#2349a2', '#0b193d', 1.2);
        ell(c, 0, potRimY, potRimW - 1.6, 3.4, '#24150b');
        for (let si = -6; si <= 6; si += 3) {
          ell(c, si, potRimY + (Math.sin(si * 5) * 1.2), 1.2, 0.7, '#3d2516');
        }

        // Helper to draw an arching tropical leaf blade
        const drawLeaf = (x0, y0, cx1, cy1, tx, ty, w, colBase, colMid, colTip, highlight) => {
          c.beginPath();
          c.moveTo(x0, y0);
          c.quadraticCurveTo(cx1 - w, cy1, tx, ty);
          c.quadraticCurveTo(cx1 + w, cy1, x0, y0);
          c.closePath();
          const lg = c.createLinearGradient(x0, y0, tx, ty);
          lg.addColorStop(0, colBase);
          lg.addColorStop(0.5, colMid);
          lg.addColorStop(1, colTip);
          c.fillStyle = lg;
          c.fill();
          c.lineWidth = 1.1;
          c.strokeStyle = '#143012';
          c.stroke();

          // Central midrib highlight
          if (highlight !== false) {
            c.beginPath();
            c.moveTo(x0, y0);
            c.quadraticCurveTo(cx1, cy1, tx, ty);
            c.strokeStyle = 'rgba(255,255,255,.32)';
            c.lineWidth = 1.1;
            c.stroke();
          }
        };

        const sway = Math.sin((t || 0) * 1.6) * 0.4;

        // 3. Lower & Outer Drooping Leaves (cascading around the blue pot rim)
        drawLeaf(-2, potRimY + 1, -16, potRimY - 4, -22 + sway, potRimY + 4, 3.8, '#1e481c', '#2c6628', '#3d8236');
        drawLeaf(2, potRimY + 1, 16, potRimY - 4, 22 + sway, potRimY + 4, 3.8, '#193f17', '#255822', '#357530');
        drawLeaf(-1, potRimY + 1, -19, potRimY - 10, -25 + sway * 1.2, potRimY - 5, 3.5, '#22501f', '#32722b', '#48983c');
        drawLeaf(1, potRimY + 1, 19, potRimY - 10, 25 + sway * 1.2, potRimY - 5, 3.5, '#1b4319', '#2a6226', '#3e8835');

        // Mid-tier arching leaves (radiating outwards and upwards)
        drawLeaf(-2, potRimY, -14, potRimY - 16, -19 + sway, potRimY - 16, 3.4, '#2d6828', '#428f38', '#5cb84c');
        drawLeaf(2, potRimY, 14, potRimY - 16, 19 + sway, potRimY - 16, 3.4, '#245620', '#387d30', '#50a642');
        drawLeaf(-1, potRimY, -11, potRimY - 22, -14 + sway, potRimY - 24, 3.2, '#357730', '#4fa642', '#6ec45b');
        drawLeaf(1, potRimY, 11, potRimY - 22, 14 + sway, potRimY - 24, 3.2, '#2c6628', '#449438', '#62b450');

        // Front drooping leaves (overlapping the pot rim)
        drawLeaf(-3, potRimY + 1, -7, potRimY + 2, -10, potRimY + 9, 3.2, '#306e2a', '#44923a', '#58ac4b');
        drawLeaf(3, potRimY + 1, 7, potRimY + 2, 10, potRimY + 9, 3.2, '#275a22', '#397e32', '#4d9c42');
        drawLeaf(0, potRimY + 1.5, 0, potRimY + 4, 0, potRimY + 11, 3.0, '#35772e', '#4da440', '#63be53');

        // Upright inner leaves cradling the flower spike
        drawLeaf(-2, potRimY - 1, -6, potRimY - 18, -8 + sway * .5, potRimY - 28, 2.8, '#3c8834', '#59b248', '#7cd265');
        drawLeaf(2, potRimY - 1, 6, potRimY - 18, 8 + sway * .5, potRimY - 28, 2.8, '#32722b', '#4fa43e', '#70c659');
        drawLeaf(-1, potRimY - 1, -3, potRimY - 20, -4 + sway * .3, potRimY - 31, 2.5, '#469c3d', '#67c655', '#8de374');
        drawLeaf(1, potRimY - 1, 3, potRimY - 20, 4 + sway * .3, potRimY - 31, 2.5, '#3b8632', '#5bb84a', '#80d668');

        // 4. Vibrant Bromeliad Inflorescence (꽃대 - 화려한 붉은색/주황색/보라색 꽃 스파이크)
        const flY = potRimY - 8;

        const drawBract = (bx, by, bw, bh, ang, colL, colR, colTip) => {
          c.save();
          c.translate(bx + sway * 0.4, by);
          c.rotate(ang);
          c.beginPath();
          c.moveTo(0, bh * .3);
          c.quadraticCurveTo(-bw, 0, 0, -bh);
          c.quadraticCurveTo(bw, 0, 0, bh * .3);
          c.closePath();
          const bg = c.createLinearGradient(-bw, 0, bw, -bh);
          bg.addColorStop(0, colL);
          bg.addColorStop(0.5, colR);
          bg.addColorStop(1, colTip);
          c.fillStyle = bg;
          c.fill();
          c.lineWidth = 0.9;
          c.strokeStyle = '#4a0d18';
          c.stroke();
          // central petal ridge
          c.beginPath();
          c.moveTo(0, bh * .2);
          c.lineTo(0, -bh * .88);
          c.strokeStyle = 'rgba(255,255,255,.38)';
          c.lineWidth = 0.9;
          c.stroke();
          c.restore();
        };

        // Tier 1: Lower Bracts (Deep Violet-Red / Magenta base)
        drawBract(-4, flY - 2, 4.2, 11, -0.48, '#6e1540', '#991c58', '#c92a6c');
        drawBract(4, flY - 2, 4.2, 11, 0.48, '#5c1034', '#88184c', '#b8245e');
        drawBract(-2, flY - 4, 4.0, 11, -0.25, '#88194e', '#b82264', '#df3076');
        drawBract(2, flY - 4, 4.0, 11, 0.25, '#741440', '#a41d57', '#cf286b');
        drawBract(0, flY - 3, 3.8, 10, 0, '#941c54', '#c4256a', '#eb387e');

        // Tier 2: Mid-Lower Bracts (Crimson / Scarlet Red)
        drawBract(-4.5, flY - 8, 3.8, 11, -0.42, '#9c151c', '#cf2225', '#ea382e');
        drawBract(4.5, flY - 8, 3.8, 11, 0.42, '#851016', '#b81c20', '#dc2f26');
        drawBract(-2.5, flY - 10, 3.6, 11, -0.22, '#b21a1e', '#dc2828', '#f24832');
        drawBract(2.5, flY - 10, 3.6, 11, 0.22, '#9e1418', '#c82121', '#e83c2a');
        drawBract(0, flY - 9, 3.5, 10, 0, '#c21e20', '#ea2e2b', '#fa5238');

        // Tier 3: Mid-Upper Bracts (Fiery Scarlet & Vivid Orange)
        drawBract(-3.8, flY - 14, 3.4, 10, -0.35, '#c22818', '#e8421c', '#f76a24');
        drawBract(3.8, flY - 14, 3.4, 10, 0.35, '#a82012', '#d23616', '#f25c1e');
        drawBract(-2, flY - 16, 3.2, 10, -0.18, '#db381a', '#f25520', '#fc822b');
        drawBract(2, flY - 16, 3.2, 10, 0.18, '#c22d14', '#de441a', '#f57224');
        drawBract(0, flY - 15, 3.1, 9.5, 0, '#e5451c', '#f76522', '#ff9234');

        // Tier 4: Crown / Top Bracts (Bright Flame Orange & Golden Yellow Tips)
        drawBract(-2.8, flY - 20, 2.8, 9, -0.26, '#e8541c', '#fa7b24', '#fdb235');
        drawBract(2.8, flY - 20, 2.8, 9, 0.26, '#d44616', '#ee6c1e', '#fca42c');
        drawBract(-1.6, flY - 22, 2.5, 8.5, -0.14, '#f2681e', '#fc8f28', '#fed03e');
        drawBract(1.6, flY - 22, 2.5, 8.5, 0.14, '#e05818', '#f57e22', '#fdc434');

        // Apex Central Spike (The pinnacle golden flame of the bromeliad)
        drawBract(0, flY - 24, 2.4, 9, 0, '#f87a22', '#fca62a', '#ffea52');
        drawBract(-0.8, flY - 25, 1.8, 7.5, -0.08, '#fc9226', '#fdbd32', '#fff46d');
        drawBract(0.8, flY - 25, 1.8, 7.5, 0.08, '#f58420', '#fcb02c', '#ffea62');
        drawBract(0, flY - 27, 1.5, 6.5, 0, '#fdb02c', '#fed43e', '#ffffff');

        c.restore();
        break;
      }
      case 'lamp': {
        const [x, y] = P(.5, .5, 0);
        ell(c, x + 1, y + 1, 11, 5, 'rgba(25,12,6,.24)');
        ell(c, x, y, 9, 4.5, '#453225', OUT, 1.2);
        // turned wooden / brass lamp pole
        rrect(c, x - 1.8, y - 46, 3.6, 46, 1.5); c.fillStyle = '#9e7038'; c.fill(); c.strokeStyle = OUT; c.lineWidth = .9; c.stroke();
        ell(c, x, y - 22, 3, 2, '#d4a84e');
        // flared ivory lampshade
        c.beginPath(); c.moveTo(x - 14, y - 44); c.lineTo(x - 8, y - 62); c.lineTo(x + 8, y - 62); c.lineTo(x + 14, y - 44); c.closePath();
        const gShade = c.createLinearGradient(x - 14, y - 62, x + 14, y - 44);
        gShade.addColorStop(0, '#fff6db'); gShade.addColorStop(0.65, '#fde39a'); gShade.addColorStop(1, '#f5c662');
        c.fillStyle = gShade; c.fill(); c.strokeStyle = OUT; c.lineWidth = 1.2; c.stroke();
        // shade trim
        c.beginPath(); c.ellipse(x, y - 44, 14, 4.5, 0, 0, Math.PI * 2); c.strokeStyle = '#c48f32'; c.lineWidth = 1.4; c.stroke();
        // warm radiant light pool on floor and surroundings
        const gGlow = c.createRadialGradient(x, y - 45, 2, x, y - 45, 52);
        gGlow.addColorStop(0, 'rgba(255,230,130,.45)'); gGlow.addColorStop(0.6, 'rgba(255,210,100,.18)'); gGlow.addColorStop(1, 'rgba(255,210,100,0)');
        c.fillStyle = gGlow; c.fillRect(x - 52, y - 90, 104, 95);
        break;
      }
      case 'rug': {
        const pts = [P(.08, .08), P(1.92, .08), P(1.92, 1.92), P(.08, 1.92)];
        poly(c, pts, '#d25a62', OUT, 1.2);
        poly(c, [P(.22, .22), P(1.78, .22), P(1.78, 1.78), P(.22, 1.78)], '#f2deb6', null);
        poly(c, [P(.4, .4), P(1.6, .4), P(1.6, 1.6), P(.4, 1.6)], '#d25a62', null);
        const [rx, ry] = P(1, 1);
        ell(c, rx, ry, 16, 8, '#f5e8cc', OUT, .8);
        ell(c, rx, ry, 11, 5.5, '#d25a62');
        break;
      }
      case 'bench': { // cozy tufted sofa
        box(c, .05, .2, 1.9, .7, 14, '#558ab5', 0, { top: '#76a8d2' });
        box(c, .05, .2, 1.9, .22, 32, '#487a9f');
        box(c, .05, .2, .22, .7, 24, '#487a9f'); box(c, 1.73, .2, .22, .7, 24, '#487a9f');
        // tufting buttons
        for (let i = 0; i < 4; i++) {
          const bp = P(.4 + i * .4, .25, 24);
          ell(c, bp[0], bp[1], 1.8, 1.8, '#325875', '#ffffff', .6);
        }
        break;
      }
      case 'aquarium': {
        // High-fidelity planted tropical aquarium (Image 9 style)
        box(c, 0, .18, 2, .64, 16, '#4a3222', 0, { top: '#6a4a35' });
        // Glass tank with black silicone edge frames
        const hTank = 38;
        box(c, .02, .2, 1.96, .6, hTank, '#a2e2ff', 16, { top: 'rgba(160,230,255,.45)', left: 'rgba(30,130,190,.55)', right: 'rgba(20,110,170,.6)' });
        // Gravel bed at the bottom
        for (let i = 0; i < 14; i++) {
          const gp = P(.12 + i * .13, .78, 17);
          ell(c, gp[0], gp[1], 3.2, 1.8, ['#c8b28a', '#a69068', '#dfcfb2', '#7a6a52'][i % 4]);
        }
        // River rocks
        const rk = P(.3, .75, 18); ell(c, rk[0], rk[1], 6, 4.5, '#6a655e', OUT, .8);
        const rk2 = P(1.65, .72, 18); ell(c, rk2[0], rk2[1], 7, 5, '#5c5750', OUT, .8);
        // Lush green water plants swaying in current
        for (let pIdx = 0; pIdx < 5; pIdx++) {
          const px0 = .35 + pIdx * .32, sw = Math.sin(t * 2.2 + pIdx * 1.5) * 4;
          const pb = P(px0, .72, 18);
          c.beginPath(); c.moveTo(pb[0], pb[1]);
          c.quadraticCurveTo(pb[0] + sw, pb[1] - 12, pb[0] + sw * 1.5, pb[1] - 26);
          c.lineWidth = 2.8; c.strokeStyle = pIdx % 2 ? '#48a834' : '#388e28'; c.stroke();
          // second leaf
          c.beginPath(); c.moveTo(pb[0], pb[1]);
          c.quadraticCurveTo(pb[0] - sw * .8, pb[1] - 10, pb[0] - sw, pb[1] - 20);
          c.lineWidth = 2.2; c.strokeStyle = '#5cc242'; c.stroke();
        }
        // Animated bubbles rising
        for (let b = 0; b < 5; b++) {
          const by = 18 + ((t * 22 + b * 9) % 32);
          const bp = P(.5 + (b % 3) * .4, .55, by);
          ell(c, bp[0], bp[1], 1.6, 1.6, 'rgba(255,255,255,.85)');
        }
        // Diagonal glass reflection sheen
        line2(c, P(.2, .8, 48), P(.6, .8, 22), 'rgba(255,255,255,.45)', 2.5);
        line2(c, P(.4, .8, 50), P(.75, .8, 24), 'rgba(255,255,255,.25)', 1.5);
        // Swimming tropical fish
        for (let i = 0; i < 3; i++) {
          const fx0 = .4 + i * .55 + Math.sin(t * 1.8 + i * 2) * .15;
          const [fx, fy] = P(fx0, .6, 26 + i * 6);
          c.save(); c.translate(fx, fy); c.scale(.55, .55);
          ART.pet(c, ['goldfish', 'neon', 'betta'][i], { t: t + i, mood: 'happy' });
          c.restore();
        }
        break;
      }
      case 'cattower': {
        // High-fidelity cat scratching tree (Image 9 style)
        box(c, .2, .2, .6, .6, 6, '#e0cca6', 0, { top: '#f4ebd8' });
        const [x, y] = P(.5, .5, 0);
        // Sisal-wrapped scratching post
        rrect(c, x - 3.5, y - 62, 7, 56, 2); c.fillStyle = '#d4ba8a'; c.fill(); c.strokeStyle = OUT; c.lineWidth = 1; c.stroke();
        // winding rope lines
        for (let ry = y - 60; ry < y - 8; ry += 3.5) {
          line2(c, [x - 3.5, ry], [x + 3.5, ry + 1.2], 'rgba(120,80,35,.4)', .8);
        }
        // Two plush carpeted perches
        for (const [h, pw] of [[30, 20], [60, 22]]) {
          ell(c, x, y - h, pw, 9, '#b57e4c', OUT, 1.2);
          ell(c, x, y - h - 2, pw - 3, 6.5, '#f4d2db');
          // plush rim
          c.beginPath(); c.ellipse(x, y - h, pw - 1, 8.5, 0, 0, Math.PI * 2); c.strokeStyle = '#fff'; c.lineWidth = 1.8; c.stroke();
        }
        // Dangling pompom toy
        c.beginPath(); c.moveTo(x + 12, y - 60); c.lineTo(x + 12, y - 44); c.strokeStyle = '#8a5a33'; c.lineWidth = 1; c.stroke();
        ell(c, x + 12, y - 43, 3.5, 3.5, '#ff8aa5', OUT, .8);
        break;
      }
      case 'fountain': {
        const [x, y] = P(1, 1); ell(c, x, y, 40, 20, '#b8c4cc', OUT, 1.4); ell(c, x, y - 4, 34, 16, '#8fd0f0'); rrect(c, x - 4, y - 36, 8, 34, 3); c.fillStyle = '#c8d2d8'; c.fill(); c.stroke();
        ell(c, x, y - 36, 14, 6, '#b8c4cc', OUT, 1.2);
        for (let i = 0; i < 6; i++) { const k = ((t * 1.5 + i / 6) % 1); ell(c, x + Math.cos(i) * 12 * k, y - 38 + k * 30 - Math.sin(k * Math.PI) * 14, 1.8, 1.8, 'rgba(200,240,255,.9)'); }
        break;
      }
      case 'chandelier': { // flower stand
        box(c, .25, .25, .5, .5, 26, '#f1e3cf');
        const [x, y] = P(.5, .5, 26);
        for (const [dx, dy, col] of [[0, -8, '#f28ca6'], [-8, -3, '#f7c948'], [8, -3, '#b59be0'], [-4, -13, '#ff9e6d'], [5, -12, '#f28ca6']]) { ell(c, x + dx, y + dy, 5.5, 5.5, col, OUT, .8); ell(c, x + dx, y + dy, 2, 2, '#fff3b0'); }
        break;
      }
      case 'garden': {
        box(c, 0, .25, 2, .5, 10, '#8a5a3b');
        for (let i = 0; i < 5; i++) { const [x, y] = P(.2 + i * .4, .5, 10); ell(c, x, y - 8, 7, 9, '#6fb85a', OUT, .8); ell(c, x, y - 16, 3.5, 3.5, ['#f28ca6', '#f7c948', '#ffffff', '#b59be0', '#ff9e6d'][i], OUT, .6); }
        break;
      }
      case 'toyshelf': {
        drawShelfUnit(c, kind, rot);
        break;
      }
      case 'clothrack': {
        const st = rot == null ? 12 : rot; // rot param reused as stock
        const [a1, b1] = P(.2, .5, 0), [a2, b2] = P(1.8, .5, 0);
        for (const [x, y] of [[a1, b1], [a2, b2]]) { rrect(c, x - 1.5, y - 52, 3, 52, 1); c.fillStyle = '#8a8f99'; c.fill(); ell(c, x, y, 7, 3, '#6b707a'); }
        c.beginPath(); c.moveTo(a1, b1 - 50); c.lineTo(a2, b2 - 50); c.lineWidth = 2.5; c.strokeStyle = '#8a8f99'; c.stroke();
        const cols = ['#ef8fa8', '#4f7cac', '#f2c14e', '#90be6d', '#b56576', '#a3c4f3'];
        for (let i = 0; i < Math.min(6, Math.ceil(st / 2)); i++) { const k = .15 + i * .14, x = a1 + (a2 - a1) * k, y = b1 + (b2 - b1) * k - 48; c.beginPath(); c.moveTo(x - 7, y + 4); c.lineTo(x - 4, y); c.lineTo(x + 4, y); c.lineTo(x + 7, y + 4); c.lineTo(x + 5, y + 6); c.lineTo(x + 5, y + 18); c.lineTo(x - 5, y + 18); c.lineTo(x - 5, y + 6); c.closePath(); c.fillStyle = cols[i]; c.fill(); c.lineWidth = .8; c.strokeStyle = OUT; c.stroke(); }
        break;
      }
      case 'groomtable': {
        box(c, .15, .15, .7, .7, 24, '#9fd3c7', 0, { top: '#e8f6f2' });
        const [x, y] = P(.2, .2, 24); rrect(c, x - 2, y - 40, 4, 40, 2); c.fillStyle = '#8a8f99'; c.fill();
        c.beginPath(); c.moveTo(x, y - 40); c.quadraticCurveTo(x + 18, y - 48, x + 22, y - 34); c.lineWidth = 3; c.strokeStyle = '#8a8f99'; c.stroke();
        ell(c, x + 22, y - 32, 5, 4, '#ef8fa8', OUT, 1);
        const [bx, by] = P(.75, .6, 24); c.font = '12px sans-serif'; c.fillText('✂️', bx - 6, by - 2);
        break;
      }
      case 'hotel': {
        poly(c, [P(0, 0), P(2, 0), P(2, 2), P(0, 2)], '#f3e3c3', OUT, 1.2);
        for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) if ((i + j) % 2) poly(c, [P(i / 2, j / 2), P((i + 1) / 2, j / 2), P((i + 1) / 2, (j + 1) / 2), P(i / 2, (j + 1) / 2)], '#ead3aa');
        box(c, 0, 0, 2, .12, 30, '#b98552'); box(c, 0, 0, .12, 2, 30, '#b98552');
        const [sx, sy] = P(1, 0, 42); rrect(c, sx - 22, sy - 10, 44, 16, 4); c.fillStyle = '#7a4f2e'; c.fill(); c.strokeStyle = OUT; c.lineWidth = 1; c.stroke();
        c.font = 'bold 10px sans-serif'; c.textAlign = 'center'; c.fillStyle = '#ffe6b8'; c.fillText('HOTEL', sx, sy + 2); c.textAlign = 'start';
        const [bx, by] = P(.5, .5); ell(c, bx, by, 16, 8, '#d98c8c', OUT, 1); ell(c, bx, by - 1, 11, 5, '#f5c5c5');
        break;
      }
      case 'table': {
        // High-fidelity Scandinavian dining / display table with polished oak top & tapered legs
        for (const [lx, ly] of [[.22, .22], [.78, .22], [.22, .78], [.78, .78]]) {
          box(c, lx - .04, ly - .04, .08, .08, 19, '#7a4e28');
        }
        box(c, .1, .1, .8, .8, 3, '#c99a6a', 19, { top: '#e6ccb2', left: '#b08252', right: '#9c6f42' });
        // Decorative centerpiece small vase with blooming flower
        const [vx, vy] = P(.5, .5, 22);
        ART.ell(c, vx, vy, 4, 2, 'rgba(0,0,0,.15)');
        ART.rrect(c, vx - 3, vy - 10, 6, 10, 2); c.fillStyle = '#ffffff'; c.fill(); c.strokeStyle = OUT; c.lineWidth = .7; c.stroke();
        ART.ell(c, vx, vy - 14, 4.5, 4.5, '#f472b6', OUT, .7);
        ART.ell(c, vx, vy - 14, 2, 2, '#fde047');
        break;
      }
      case 'armchair': {
        // Tufted Scandinavian armchair with soft warm fabric & oak legs
        for (const [lx, ly] of [[.18, .18], [.82, .18], [.18, .82], [.82, .82]]) {
          box(c, lx - .03, ly - .03, .06, .06, 8, '#7a4e28');
        }
        box(c, .12, .15, .76, .7, 12, '#3b82f6', 8, { top: '#93c5fd', left: '#2563eb', right: '#1d4ed8' });
        box(c, .12, .15, .76, .18, 26, '#2563eb', 14, { top: '#60a5fa' });
        box(c, .12, .15, .15, .7, 16, '#2563eb', 14, { top: '#60a5fa' });
        box(c, .73, .15, .15, .7, 16, '#2563eb', 14, { top: '#60a5fa' });
        for (let i = 0; i < 2; i++) {
          const bp = P(.35 + i * .3, .22, 28);
          ART.ell(c, bp[0], bp[1], 2, 2, '#1e40af', '#ffffff', .5);
        }
        break;
      }
      case 'bookcase': {
        // High-detail 2x1 wooden bookshelf loaded with colorful books
        box(c, .05, .15, 1.9, .7, 52, '#78350f', 0, { top: '#92400e', left: '#5f2b08', right: '#451a03' });
        for (const z of [14, 30, 46]) {
          box(c, .1, .2, 1.8, .6, 2, '#b45309', z, { top: '#d97706' });
          const bookCols = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];
          for (let b = 0; b < 10; b++) {
            const bx = .16 + b * .16, bh = 8 + (b % 4) * 2;
            const bCol = bookCols[(b + (z | 0)) % bookCols.length];
            const p0 = P(bx, .8, z + 2), p1 = P(bx + .12, .8, z + 2), p2 = P(bx + .12, .8, z + 2 + bh), p3 = P(bx, .8, z + 2 + bh);
            poly(c, [p0, p1, p2, p3], bCol, 'rgba(0,0,0,.4)', .8);
          }
        }
        const [px, py] = P(1.6, .5, 52);
        ART.rrect(c, px - 3, py - 6, 6, 6, 1.5); c.fillStyle = '#ffffff'; c.fill();
        ART.ell(c, px, py - 10, 5, 4, '#22c55e', OUT, .6);
        break;
      }
      case 'tv': {
        // Modern 2x1 TV console media table with large sleek screen
        box(c, .08, .2, 1.84, .6, 14, '#334155', 0, { top: '#475569' });
        box(c, .92, .45, .16, .1, 6, '#1e293b', 14);
        const tp0 = P(.2, .45, 20), tp1 = P(1.8, .45, 20), tp2 = P(1.8, .45, 52), tp3 = P(.2, .45, 52);
        poly(c, [tp0, tp1, tp2, tp3], '#0f172a', OUT, 1.4);
        const sp0 = P(.26, .46, 22), sp1 = P(1.74, .46, 22), sp2 = P(1.74, .46, 50), sp3 = P(.26, .46, 50);
        const gScreen = c.createLinearGradient(sp0[0], sp0[1], sp2[0], sp2[1]);
        gScreen.addColorStop(0, '#38bdf8'); gScreen.addColorStop(1, '#1e40af');
        poly(c, [sp0, sp1, sp2, sp3], gScreen, null);
        box(c, .3, .65, .4, .2, 3, '#ffffff', 5);
        break;
      }
      case 'fridge': {
        // Retro pastel mint refrigerator with silver latch handle
        box(c, .1, .15, .8, .7, 50, '#99f6e4', 0, { top: '#ccfbf1', left: '#5eead4', right: '#2dd4bf' });
        const a = P(.1, .85, 34), b = P(.9, .85, 34);
        line2(c, a, b, '#115e59', 1.8);
        for (const hz of [40, 22]) {
          const hp0 = P(.82, .86, hz + 6), hp1 = P(.82, .86, hz);
          line2(c, hp0, hp1, '#ffffff', 2.8);
          line2(c, hp0, hp1, '#475569', 1.2);
        }
        const np = P(.35, .86, 26);
        ART.rrect(c, np[0] - 4, np[1] - 4, 8, 8, 1); c.fillStyle = '#fef08a'; c.fill();
        break;
      }
      case 'desk': {
        // 2x1 Scandinavian executive desk with laptop, lamp, mug
        box(c, .1, .15, .1, .1, 24, '#78350f'); box(c, 1.8, .15, .1, .1, 24, '#78350f');
        box(c, .1, .75, .1, .1, 24, '#78350f'); box(c, 1.8, .75, .1, .1, 24, '#78350f');
        box(c, .05, .1, 1.9, .8, 4, '#b45309', 24, { top: '#fde68a', left: '#92400e', right: '#78350f' });
        const [lx, ly] = P(1.0, .5, 28);
        ART.rrect(c, lx - 10, ly - 3, 20, 8, 1.5); c.fillStyle = '#cbd5e1'; c.fill(); c.strokeStyle = OUT; c.lineWidth = .7; c.stroke();
        c.beginPath(); c.moveTo(lx - 10, ly - 3); c.lineTo(lx + 10, ly - 3); c.lineTo(lx + 8, ly - 18); c.lineTo(lx - 8, ly - 18); c.closePath();
        c.fillStyle = '#38bdf8'; c.fill(); c.strokeStyle = OUT; c.lineWidth = .8; c.stroke();
        const [mx, my] = P(.45, .5, 28);
        ART.rrect(c, mx - 3, my - 6, 6, 6, 1.5); c.fillStyle = '#f43f5e'; c.fill();
        break;
      }
      case 'washer': {
        // Modern front-loading washer-dryer
        box(c, .1, .15, .8, .7, 36, '#f8fafc', 0, { top: '#ffffff', left: '#e2e8f0', right: '#cbd5e1' });
        const tp0 = P(.15, .85, 30), tp1 = P(.85, .85, 30);
        line2(c, tp0, tp1, '#94a3b8', 1.2);
        const [kX, kY] = P(.7, .86, 32);
        ART.ell(c, kX, kY, 2.5, 2.5, '#475569');
        const [dx, dy] = P(.5, .86, 18);
        ART.ell(c, dx, dy, 12, 12, '#334155', OUT, 1.5);
        ART.ell(c, dx, dy, 9.5, 9.5, '#0284c7');
        ART.ell(c, dx - 3, dy - 2, 3, 3, 'rgba(255,255,255,.8)');
        ART.ell(c, dx + 2, dy + 2, 2, 2, 'rgba(255,255,255,.7)');
        break;
      }
      case 'bathtub': {
        // Luxury clawfoot porcelain tub with gold faucet & bubbles
        box(c, .1, .15, 1.8, .7, 24, '#ffffff', 0, { top: '#67e8f9', left: '#e2e8f0', right: '#cbd5e1' });
        for (const [fx, fy] of [[.18, .2], [1.82, .2], [.18, .8], [1.82, .8]]) {
          const fp = P(fx, fy, 0);
          ART.ell(c, fp[0], fp[1], 3, 3, '#f59e0b', OUT, .8);
        }
        const [fcx, fcy] = P(.2, .5, 24);
        c.beginPath(); c.moveTo(fcx, fcy); c.lineTo(fcx, fcy - 12); c.quadraticCurveTo(fcx + 6, fcy - 14, fcx + 8, fcy - 8);
        c.lineWidth = 2.4; c.strokeStyle = '#f59e0b'; c.stroke();
        for (let i = 0; i < 7; i++) {
          const [bx, by] = P(.5 + i * .18, .5, 24);
          ART.ell(c, bx, by - 2, 5, 4, '#ffffff', 'rgba(180,230,250,.6)', .7);
        }
        break;
      }
      case 'coatrack': {
        // Elegant standing oak coat tree
        const [x, y] = P(.5, .5, 0);
        ART.ell(c, x, y, 9, 4.5, '#5c3818', OUT, 1.2);
        rrect(c, x - 2, y - 56, 4, 56, 1.5); c.fillStyle = '#854d0e'; c.fill(); c.strokeStyle = OUT; c.lineWidth = 1; c.stroke();
        for (const s of [-1, 1]) {
          c.beginPath(); c.moveTo(x, y - 46); c.lineTo(x + s * 10, y - 52); c.lineWidth = 2.4; c.strokeStyle = '#a16207'; c.stroke();
          ART.ell(c, x + s * 10, y - 52, 2.5, 2.5, '#ca8a04');
        }
        c.beginPath(); c.moveTo(x - 5, y - 40); c.quadraticCurveTo(x, y - 36, x + 5, y - 40); c.lineTo(x + 6, y - 24); c.lineTo(x + 2, y - 24); c.closePath();
        c.fillStyle = '#f43f5e'; c.fill(); c.strokeStyle = OUT; c.lineWidth = .8; c.stroke();
        break;
      }
      case 'radio': {
        // Vintage wooden tube radio with illuminated dial
        box(c, .2, .25, .6, .5, 22, '#78350f', 0, { top: '#92400e', left: '#5f2b08', right: '#451a03' });
        const [rx, ry] = P(.5, .75, 14);
        ART.rrect(c, rx - 10, ry - 6, 20, 12, 2); c.fillStyle = '#fef08a'; c.fill(); c.strokeStyle = OUT; c.lineWidth = .8; c.stroke();
        c.fillStyle = '#b45309'; c.fillRect(rx - 7, ry - 1, 14, 2);
        for (const kx of [rx - 6, rx + 6]) ART.ell(c, kx, ry + 4, 2, 2, '#d97706');
        const [ax, ay] = P(.3, .3, 22);
        c.beginPath(); c.moveTo(ax, ay); c.lineTo(ax - 8, ay - 18); c.lineWidth = 1.6; c.strokeStyle = '#94a3b8'; c.stroke();
        break;
      }
      case 'fountain': {
        // Classical tiered marble fountain
        poly(c, [P(.1, .1), P(1.9, .1), P(1.9, 1.9), P(.1, 1.9)], '#e2e8f0', OUT, 1.4);
        const [cx0, cy0] = P(1, 1, 0);
        ART.ell(c, cx0, cy0, 36, 18, '#38bdf8', '#0284c7', 2);
        box(c, .7, .7, .6, .6, 16, '#cbd5e1');
        ART.ell(c, cx0, cy0 - 16, 18, 9, '#38bdf8', '#cbd5e1', 1.4);
        const spH = 10 + Math.sin(t * 6) * 4;
        c.beginPath(); c.moveTo(cx0, cy0 - 16); c.quadraticCurveTo(cx0, cy0 - 16 - spH, cx0 - 6, cy0 - 12);
        c.moveTo(cx0, cy0 - 16); c.quadraticCurveTo(cx0, cy0 - 16 - spH, cx0 + 6, cy0 - 12);
        c.lineWidth = 2; c.strokeStyle = 'rgba(255,255,255,.9)'; c.stroke();
        break;
      }
      case 'chandelier': {
        // Sparkling tiered crystal chandelier with radiant candle lamps
        const [x, y] = P(.5, .5, 54);
        c.beginPath(); c.moveTo(x, y - 26); c.lineTo(x, y); c.lineWidth = 2.4; c.strokeStyle = '#eab308'; c.stroke();
        ART.ell(c, x, y, 16, 7, '#ca8a04', OUT, 1);
        for (let i = 0; i < 5; i++) {
          const ca = i * Math.PI * 2 / 5, cx = x + Math.cos(ca) * 14, cy = y + Math.sin(ca) * 6;
          ART.rrect(c, cx - 1.5, cy - 8, 3, 8, 1); c.fillStyle = '#ffffff'; c.fill();
          ART.ell(c, cx, cy - 11, 2, 3, '#f59e0b');
          ART.ell(c, cx, cy - 10, 1, 1.5, '#fef08a');
        }
        glowAt(x, y - 6, 36, '255,230,140', .35);
        break;
      }
      case 'petbed_deluxe': {
        // Ultra-soft round donut macaron pet bed with plush pillow
        const [x, y] = P(.5, .5, 0);
        ART.ell(c, x, y + 1, 24, 13, 'rgba(0,0,0,.15)');
        ART.ell(c, x, y, 22, 12, '#ec4899', OUT, 1.5);
        ART.ell(c, x, y - 2, 17, 9, '#fbcfe8', OUT, 1);
        ART.ell(c, x, y - 3, 11, 6, '#ffffff');
        ART.ell(c, x, y - 3, 2.5, 2, '#f59e0b');
        for (const [dx, dy] of [[-3, -3], [-1, -4.5], [1, -4.5], [3, -3]]) ART.ell(c, x + dx, y + dy, .9, .9, '#f59e0b');
        break;
      }
      case 'cozy_fireplace': {
        // High-end brick hearth fireplace with crackling fire
        box(c, 0, .2, 2, .65, 38, '#78350f', 0, { top: '#92400e' });
        const p0 = P(.4, .85, 4), p1 = P(1.6, .85, 4), p2 = P(1.6, .85, 26), p3 = P(.4, .85, 26);
        poly(c, [p0, p1, p2, p3], '#1c1917', OUT, 1.2);
        const [fx, fy] = P(1, .8, 6);
        ART.ell(c, fx, fy, 10, 4, '#451a03');
        const flm = Math.sin(t * 8) * 3;
        ART.ell(c, fx + flm * .3, fy - 6, 7, 10, '#f97316');
        ART.ell(c, fx + flm * .5, fy - 8, 4, 7, '#fef08a');
        glowAt(fx, fy - 8, 38, '255,160,50', .45);
        break;
      }
      case 'catcastle': {
        // Multi-tier deluxe cat castle tower
        box(c, .1, .1, 1.8, .8, 6, '#e2e8f0', 0, { top: '#f1f5f9' });
        box(c, .2, .2, .2, .2, 42, '#d97706'); box(c, 1.6, .2, .2, .2, 42, '#d97706');
        box(c, .15, .15, .7, .7, 4, '#c084fc', 42, { top: '#e9d5ff' });
        box(c, 1.15, .15, .7, .7, 4, '#38bdf8', 30, { top: '#bae6fd' });
        box(c, .2, .2, .6, .6, 16, '#a855f7', 46);
        const [cx, cy] = P(.5, .8, 54);
        ART.ell(c, cx, cy, 5, 6, '#581c87');
        break;
      }
      case 'music_jukebox': {
        // Retro neon jukebox with rainbow arch & music notes
        box(c, .15, .2, .7, .6, 36, '#dc2626', 0, { top: '#ef4444' });
        const [jx, jy] = P(.5, .8, 22);
        c.beginPath(); c.arc(jx, jy - 8, 12, Math.PI, 0); c.lineWidth = 4;
        c.strokeStyle = ['#38bdf8', '#4ade80', '#facc15', '#f43f5e'][(Math.floor(t * 3)) % 4]; c.stroke();
        const ny = jy - 30 - Math.sin(t * 4) * 6;
        c.font = '12px sans-serif'; c.fillText('🎵', jx - 6, ny);
        break;
      }
      case 'crystal_fountain': {
        // 2x2 luxury glowing crystal fountain
        poly(c, [P(.1, .1), P(1.9, .1), P(1.9, 1.9), P(.1, 1.9)], '#93c5fd', OUT, 1.5);
        const [cx, cy] = P(1, 1, 0);
        ART.ell(c, cx, cy, 38, 19, '#0284c7', '#38bdf8', 2);
        const spH = 26 + Math.sin(t * 3) * 3;
        c.beginPath(); c.moveTo(cx, cy - 2); c.lineTo(cx - 8, cy - 14); c.lineTo(cx, cy - spH); c.lineTo(cx + 8, cy - 14); c.closePath();
        c.fillStyle = 'rgba(167,243,248,.85)'; c.fill(); c.strokeStyle = '#ffffff'; c.lineWidth = 1.4; c.stroke();
        glowAt(cx, cy - 18, 42, '140,220,255', .45);
        break;
      }
      case 'playpen': case 'playpen_adventure': case 'playpen_castle': case 'playpen_waterpark': {
        penBack(c, t || 0, kind);
        penFront(c, kind);
        break;
      }
    }
  }
  function penBack(c, t, kind, fp) {
    t = t || 0;
    const k = kind || 'playpen';
    const def = DEF[k] || DEF.playpen;
    const W = (fp && fp.w) || def.w || 3, D = (fp && fp.d) || def.d || 3;

    // 1. Cushioned border & ground shadow
    poly(c, [P(-.06, -.06), P(W + .06, -.06), P(W + .06, D + .06), P(-.06, D + .06)], 'rgba(30,18,10,.2)', null);
    const padCol = k === 'playpen_waterpark' ? '#e0f2fe' : k === 'playpen_castle' ? '#f3e8ff' : k === 'playpen_adventure' ? '#dcfce7' : '#fef3c7';
    const borderCol = k === 'playpen_waterpark' ? '#38bdf8' : k === 'playpen_castle' ? '#c084fc' : k === 'playpen_adventure' ? '#4ade80' : '#f59e0b';
    box(c, 0, 0, W, D, 3, borderCol, 0, { top: padCol, noShadow: 1 });

    // 2. Interlocking EVA puzzle mat tiles with paw prints
    const tileColors = k === 'playpen_waterpark'
      ? ['#bae6fd', '#7dd3fc', '#fef08a']
      : k === 'playpen_castle'
        ? ['#f5d0fe', '#e9d5ff', '#fef3c7']
        : k === 'playpen_adventure'
          ? ['#bbf7d0', '#dcfce7', '#fde68a']
          : ['#d9f99d', '#fbcfe8', '#fde68a'];
    for (let ix = 0; ix < W; ix++) {
      for (let iy = 0; iy < D; iy++) {
        const tc = tileColors[(ix + iy) % tileColors.length];
        poly(c, [P(ix + .06, iy + .06, 3), P(ix + .94, iy + .06, 3), P(ix + .94, iy + .94, 3), P(ix + .06, iy + .94, 3)], tc, 'rgba(255,255,255,.55)', .8);
        if ((ix + iy) % 2 === 0) {
          const [px, py] = P(ix + .5, iy + .5, 3);
          ell(c, px, py + 1, 3.2, 2.2, 'rgba(255,255,255,.55)');
          for (const [dx, dy] of [[-2.8, -1.8], [-.9, -2.8], [.9, -2.8], [2.8, -1.8]]) ell(c, px + dx, py + dy, 1.1, 1.1, 'rgba(255,255,255,.55)');
        }
      }
    }

    // 3. Back safety fence with rounded finial posts & festive bunting flags
    const postCol = k === 'playpen_castle' ? '#a855f7' : k === 'playpen_waterpark' ? '#0284c7' : k === 'playpen_adventure' ? '#15803d' : '#f59e0b';
    const railCol = k === 'playpen_castle' ? '#faf5ff' : '#fffbeb';
    const drawFenceSeg = (x1, y1, x2, y2, steps) => {
      for (const z of [11, 21]) {
        const a = P(x1, y1, z), b = P(x2, y2, z);
        line2(c, a, b, OUT, 4.2);
        line2(c, a, b, railCol, 2.6);
      }
      for (let s = 0; s <= steps; s++) {
        const u = s / steps, x = x1 + (x2 - x1) * u, y = y1 + (y2 - y1) * u;
        const a = P(x, y, 3), b = P(x, y, 26);
        line2(c, a, b, OUT, 4.6);
        line2(c, a, b, s % 2 === 0 ? postCol : railCol, 3);
        ell(c, b[0], b[1] - 1, 2.8, 2.8, s % 2 === 0 ? postCol : '#ffffff', OUT, .8);
        if (s < steps) {
          const nx = x1 + (x2 - x1) * ((s + 1) / steps), ny = y1 + (y2 - y1) * ((s + 1) / steps);
          const mx = (x + nx) * .5, my = (y + ny) * .5;
          const pA = P(x, y, 23), pB = P(nx, ny, 23), pM = P(mx, my, 16);
          poly(c, [pA, pB, pM], ['#f43f5e', '#facc15', '#38bdf8', '#a855f7', '#4ade80'][s % 5], OUT, .6);
        }
      }
    };
    drawFenceSeg(0, 0, W, 0, W * 2);
    drawFenceSeg(0, 0, 0, D, D * 2);

    // 4. Tier-specific upgraded play structures
    if (k === 'playpen') {
      // Cozy Playhouse Tower + Wave Slide + Caterpillar Tunnel + Ball Pit + Spring Rocker
      box(c, .18, .18, .72, .72, 28, '#60a5fa', 3, { top: '#93c5fd' });
      // Gable roof on playhouse tower
      poly(c, [P(.12, .12, 31), P(.54, .12, 44), P(.54, .96, 44), P(.12, .96, 31)], '#f43f5e', OUT, 1.1);
      poly(c, [P(.54, .12, 44), P(.96, .12, 31), P(.96, .96, 31), P(.54, .96, 44)], '#fb7185', OUT, 1.1);
      const [winX, winY] = P(.54, .9, 20); ell(c, winX, winY, 5, 6, '#fef08a', OUT, .9);
      // Wave slide with side safety rails
      poly(c, [P(.9, .32, 26), P(2.05, .32, 4), P(2.05, .74, 4), P(.9, .74, 26)], '#fb923c', OUT, 1.1);
      poly(c, [P(.9, .38, 26), P(2.05, .38, 4), P(2.05, .68, 4), P(.9, .68, 26)], '#fde047', null);
      // Striped caterpillar play tunnel
      for (let seg = 0; seg < 4; seg++) {
        const [tx, ty] = P(2.05 + seg * .16, 1.45 + seg * .12, 3);
        const tCol = seg % 2 ? '#c084fc' : '#f472b6';
        c.beginPath(); c.ellipse(tx, ty - 9, 14, 11, 0, Math.PI, 0); c.lineTo(tx + 14, ty); c.lineTo(tx - 14, ty); c.closePath();
        c.fillStyle = tCol; c.fill(); c.lineWidth = 1; c.strokeStyle = OUT; c.stroke();
      }
      const [thx, thy] = P(2.53, 1.81, 3); ell(c, thx, thy - 4, 8, 6, '#4c1d95');
      // Soft padded ball pit pool in front-left corner
      const [bpx, bpy] = P(.85, 2.15, 3);
      ell(c, bpx, bpy, 22, 11, '#38bdf8', OUT, 1.2);
      ell(c, bpx, bpy - 2, 18, 8.5, '#e0f2fe', OUT, .8);
      for (const [dx, dy, bc] of [[-9, -2, '#f43f5e'], [-3, -4, '#facc15'], [4, -3, '#4ade80'], [9, -1, '#a855f7'], [-5, 1, '#fb923c'], [2, 1, '#38bdf8'], [7, 2, '#f472b6']]) {
        ell(c, bpx + dx, bpy + dy, 3.6, 3.6, bc, OUT, .65);
        ell(c, bpx + dx - 1, bpy + dy - 1, 1.1, 1.1, 'rgba(255,255,255,.75)');
      }
      // Bouncy spring horse / bone rocker
      const [rx, ry] = P(2.1, 2.35, 3), bob = Math.sin(t * 3) * 1.5;
      line2(c, [rx, ry], [rx, ry - 9 + bob], '#64748b', 2.5);
      ell(c, rx, ry - 11 + bob, 9, 4.5, '#fffbeb', OUT, 1);
      ell(c, rx - 7, ry - 11 + bob, 3.5, 3.5, '#fffbeb', OUT, .8);
      ell(c, rx + 7, ry - 11 + bob, 3.5, 3.5, '#fffbeb', OUT, .8);
    } else if (k === 'playpen_adventure') {
      // Twin Adventure Forts + Suspension Bridge + Double Slides + Agility Ring & Seesaw
      for (const tx of [.2, 2.1]) {
        box(c, tx, .2, .75, .75, 30, '#854d0e', 3, { top: '#ca8a04' });
        poly(c, [P(tx - .06, .14, 33), P(tx + .38, .14, 48), P(tx + .81, .14, 33), P(tx + .38, .98, 48)], '#16a34a', OUT, 1.1);
        poly(c, [P(tx + .38, .14, 48), P(tx + .81, .14, 33), P(tx + .81, .98, 33), P(tx + .38, .98, 48)], '#22c55e', OUT, 1.1);
      }
      // Rope bridge between towers
      poly(c, [P(.95, .36, 24), P(2.1, .36, 24), P(2.1, .74, 24), P(.95, .74, 24)], '#d97706', OUT, 1);
      for (let bx = 1.05; bx < 2.05; bx += .2) line2(c, P(bx, .36, 24), P(bx, .74, 24), '#78350f', 1.2);
      line2(c, P(.95, .36, 32), P(2.1, .36, 32), '#fef08a', 1.5);
      line2(c, P(.95, .74, 32), P(2.1, .74, 32), '#fef08a', 1.5);
      // Twin slides
      poly(c, [P(2.85, .35, 28), P(3.75, .35, 4), P(3.75, .78, 4), P(2.85, .78, 28)], '#ef4444', OUT, 1.1);
      poly(c, [P(.35, .95, 28), P(.35, 2.0, 4), P(.78, 2.0, 4), P(.78, .95, 28)], '#3b82f6', OUT, 1.1);
      // Agility tire hoop & seesaw
      const [hx, hy] = P(1.65, 1.85, 3);
      line2(c, [hx - 10, hy], [hx - 10, hy - 20], '#78350f', 2.5);
      line2(c, [hx + 10, hy], [hx + 10, hy - 20], '#78350f', 2.5);
      ell(c, hx, hy - 12, 7.5, 7.5, null, '#facc15', 3.2);
      // Seesaw plank
      const [sx, sy] = P(2.85, 2.1, 3), tilt = Math.sin(t * 2.2) * 3;
      ell(c, sx, sy, 6, 4, '#f97316', OUT, .9);
      line2(c, [sx - 16, sy - 4 + tilt], [sx + 16, sy - 4 - tilt], '#14b8a6', 4);
    } else if (k === 'playpen_castle') {
      // Royal Fairytale Multi-Turret Castle + Spiral Slide + Luxury Pearl Ball Pool + Velvet Lounges
      box(c, .2, .2, 1.6, 1.1, 34, '#f5d0fe', 3, { top: '#fae8ff' });
      for (const [tx, ty, th] of [[.25, .25, 54], [1.45, .25, 58], [.85, .3, 66]]) {
        const [cx0, cy0] = P(tx + .15, ty + .15, 3);
        rrect(c, cx0 - 9, cy0 - th, 18, th - 20, 3); c.fillStyle = '#fdf4ff'; c.fill(); c.lineWidth = 1.1; c.strokeStyle = OUT; c.stroke();
        c.beginPath(); c.moveTo(cx0 - 11, cy0 - th); c.lineTo(cx0, cy0 - th - 18); c.lineTo(cx0 + 11, cy0 - th); c.closePath();
        c.fillStyle = '#ec4899'; c.fill(); c.stroke();
        // Gold flag
        line2(c, [cx0, cy0 - th - 18], [cx0, cy0 - th - 26], '#eab308', 1.4);
        poly(c, [[cx0, cy0 - th - 26], [cx0 + 8, cy0 - th - 23], [cx0, cy0 - th - 20]], '#facc15', null);
      }
      // Royal arched gate & gold slide
      const [gx, gy] = P(1.0, 1.3, 3);
      ell(c, gx, gy - 8, 8, 10, '#581c87', OUT, 1);
      poly(c, [P(1.8, .45, 32), P(3.3, .45, 4), P(3.3, .95, 4), P(1.8, .95, 32)], '#facc15', OUT, 1.2);
      poly(c, [P(1.8, .53, 32), P(3.3, .53, 4), P(3.3, .87, 4), P(1.8, .87, 32)], '#fef08a', null);
      // Grand pearl & pastel ball pool
      const [bpx, bpy] = P(1.1, 2.7, 3);
      ell(c, bpx, bpy, 28, 14, '#c084fc', OUT, 1.3);
      ell(c, bpx, bpy - 2, 24, 11, '#faf5ff', OUT, .9);
      for (let bi = 0; bi < 10; bi++) {
        const bx0 = bpx - 14 + (bi % 5) * 7, by0 = bpy - 4 + Math.floor(bi / 5) * 4;
        ell(c, bx0, by0, 3.5, 3.5, ['#f472b6', '#fde047', '#c084fc', '#67e8f9', '#ffffff'][bi % 5], OUT, .6);
      }
      // Royal velvet pet cushion thrones
      for (const [vx, vy] of [[2.8, 1.9], [2.8, 2.9]]) {
        const [px, py] = P(vx, vy, 3);
        ell(c, px, py, 14, 7, '#a855f7', OUT, 1.1);
        ell(c, px, py - 2, 10, 5, '#f5d0fe');
        crown(c, px, py - 8);
      }
    } else if (k === 'playpen_waterpark') {
      // Oasis Aqua Theme Park: Crystal Splash Pool + Twin Rainbow Water Slides + Waterfall Island + Cabana
      poly(c, [P(1.1, .8, 3.5), P(4.6, .8, 3.5), P(4.6, 3.6, 3.5), P(1.1, 3.6, 3.5)], '#0ea5e9', OUT, 1.2);
      poly(c, [P(1.25, .95, 3.5), P(4.45, .95, 3.5), P(4.45, 3.45, 3.5), P(1.25, 3.45, 3.5)], '#38bdf8', null);
      // Animated water ripples
      for (let wi = 0; wi < 4; wi++) {
        const [wx, wy] = P(1.8 + wi * .65, 1.8 + (wi % 2) * .8, 4);
        const rr = 6 + Math.sin(t * 3 + wi) * 2;
        ell(c, wx, wy, rr, rr * .5, null, 'rgba(255,255,255,.55)', 1);
      }
      // Aqua slide tower + twin rainbow slides splashing into pool
      box(c, .2, .25, .85, .85, 36, '#0284c7', 3, { top: '#7dd3fc' });
      poly(c, [P(.15, .2, 39), P(.62, .2, 54), P(1.1, .2, 39), P(.62, 1.15, 54)], '#facc15', OUT, 1.1);
      poly(c, [P(1.05, .35, 34), P(2.4, 1.2, 4), P(2.4, 1.6, 4), P(1.05, .75, 34)], '#f43f5e', OUT, 1.1);
      poly(c, [P(.4, 1.1, 34), P(1.5, 2.5, 4), P(1.9, 2.5, 4), P(.8, 1.1, 34)], '#fde047', OUT, 1.1);
      // Floating flamingo tube & rubber ducky in pool
      const [fx, fy] = P(3.3, 2.2 + Math.sin(t * 2) * .08, 4);
      ell(c, fx, fy, 11, 6, '#fb7185', OUT, 1);
      ell(c, fx, fy, 5, 2.6, '#38bdf8', OUT, .7);
      const [dx, dy] = P(2.3, 3.0 + Math.cos(t * 2.5) * .08, 4);
      ell(c, dx, dy - 2, 5.5, 3.5, '#facc15', OUT, .8);
      ell(c, dx + 3, dy - 6, 3.5, 3.2, '#facc15', OUT, .8);
      // Mini palm tree & sun umbrella at back-right
      const [px, py] = P(4.2, .45, 3);
      rrect(c, px - 2, py - 34, 4, 34, 1.5); c.fillStyle = '#92400e'; c.fill();
      for (const [lx, ly] of [[-11, -34], [11, -34], [-6, -40], [7, -40], [0, -43]]) {
        ell(c, px + lx, py + ly, 8, 3.8, '#22c55e', OUT, .7);
      }
    }
  }
  function penFront(c, kind, fp) {
    if (typeof kind === 'number') { kind = fp; fp = arguments[3]; }
    const k = kind || 'playpen';
    const def = DEF[k] || DEF.playpen;
    const W = (fp && fp.w) || def.w || 3, D = (fp && fp.d) || def.d || 3;
    const postCol = k === 'playpen_castle' ? '#a855f7' : k === 'playpen_waterpark' ? '#0284c7' : k === 'playpen_adventure' ? '#15803d' : '#f59e0b';
    const railCol = k === 'playpen_castle' ? '#faf5ff' : '#fffbeb';
    const drawFrontSeg = (x1, y1, x2, y2, steps, hasGate) => {
      for (let s = 0; s <= steps; s++) {
        const u = s / steps, x = x1 + (x2 - x1) * u, y = y1 + (y2 - y1) * u;
        const a = P(x, y, 3), b = P(x, y, 24);
        line2(c, a, b, OUT, 4.4);
        line2(c, a, b, s % 2 === 0 ? postCol : railCol, 2.8);
        ell(c, b[0], b[1] - 1, 2.6, 2.6, s % 2 === 0 ? postCol : '#ffffff', OUT, .75);
      }
      for (const z of [10, 19]) {
        if (hasGate) {
          const a1 = P(x1, y1, z), b1 = P(x1 + (x2 - x1) * .35, y1 + (y2 - y1) * .35, z);
          const a2 = P(x1 + (x2 - x1) * .65, y1 + (y2 - y1) * .65, z), b2 = P(x2, y2, z);
          line2(c, a1, b1, OUT, 3.8); line2(c, a1, b1, railCol, 2.4);
          line2(c, a2, b2, OUT, 3.8); line2(c, a2, b2, railCol, 2.4);
        } else {
          const a = P(x1, y1, z), b = P(x2, y2, z);
          line2(c, a, b, OUT, 3.8); line2(c, a, b, railCol, 2.4);
        }
      }
    };
    drawFrontSeg(0, D, W, D, W * 2, true);
    drawFrontSeg(W, 0, W, D, D * 2, false);
  }
  function mess(c, k, t) {
    const [x, y] = P(.5, .5);
    if (k === 'poop') { ell(c, x, y - 3, 8, 4, '#7a4f2e', OUT, 1); ell(c, x, y - 7, 6, 3.5, '#8a5a33', OUT, 1); ell(c, x, y - 10, 3.5, 2.5, '#9b6a3f', OUT, 1); c.font = '10px sans-serif'; c.fillText('💨', x + 6, y - 14 - Math.sin(t * 3) * 2); }
    else if (k === 'spill') { c.beginPath(); c.ellipse(x, y, 16, 7, .2, 0, 7); c.fillStyle = 'rgba(214,160,80,.8)'; c.fill(); for (let i = 0; i < 6; i++) ell(c, x - 10 + i * 4, y - 1 + (i % 2) * 2, 2, 1.5, '#8a5a33'); }
    else if (k === 'litter') { for (const [dx, dy, col, r] of [[-8, 0, '#f4f1ea', .3], [3, -2, '#9fd0f0', -.4], [9, 2, '#f7d36b', .8]]) { c.save(); c.translate(x + dx, y + dy); c.rotate(r); c.fillStyle = col; c.fillRect(-4, -2.5, 8, 5); c.lineWidth = .7; c.strokeStyle = 'rgba(60,38,25,.5)'; c.strokeRect(-4, -2.5, 8, 5); c.restore(); } } // a receipt, a wrapper, a snack bag
    else { for (let i = 0; i < 5; i++) ell(c, x - 10 + i * 5, y - 2 + Math.sin(i) * 3, 4, 3, 'rgba(240,230,215,.95)', 'rgba(60,38,25,.4)', .6); }
  }
  // ---------- floor & walls ----------
  const FLOORS = {
    wood: ['#c89556', '#b37c3f'],
    oak: ['#d9a566', '#c48f4e'],
    tile: ['#f4ede2', '#dfd5c4'],
    pink: ['#f4c7cf', '#ebb7c0'],
    mint: ['#cfe8dc', '#bddcce'],
    dark: ['#784c2f', '#653c22'],
    walnut: ['#633d24', '#52301a'],
    white: ['#f5eee4', '#e8dfd2'],
    parquet: ['#d4a373', '#b98552'],
    lav: ['#e3d8f5', '#d3c4ee'],
    lemon: ['#fbefb8', '#f5e39a'],
    checker: ['#fff7f9', '#f6b8c8'],
    carpetp: ['#f7c6d3', '#f2b7c7'],
    carpets: ['#bcd8f2', '#aecdec'],
    grass: ['#86c452', '#78b244']
  };
  const FLOOR_T = { wood: 'wood', oak: 'wood', dark: 'wood', walnut: 'wood', white: 'wood', parquet: 'parquet', checker: 'checker', carpetp: 'carpet', carpets: 'carpet', grass: 'carpet' };
  const WALLS = { cream: ['#f6ead6', '#efdcc0', 'stripe'], mint: ['#dff0e6', '#c9e5d6', 'dots'], pink: ['#fbe1e6', '#f5c9d2', 'stripe'], sky: ['#dcebf7', '#c4ddf0', 'dots'], wood: ['#c79a6c', '#b88a5c', 'plank'], xmas: ['#c94a4a', '#2f7a4f', 'stripe'],
    lav: ['#ece4fa', '#dccff4', 'stripe'], lemon: ['#fdf6d2', '#f5e39a', 'dots'], heart: ['#fdeef2', '#f39ab4', 'heart'], star: ['#2f3b6b', '#ffe38a', 'star'], gingham: ['#f4fbf7', '#bfe3cf', 'check'], brick: ['#c9785a', '#f1e0d0', 'brick'], flower: ['#fff7ea', '#f2a3b8', 'flower'], peach: ['#ffe3d3', '#ffd5bf', 'solid'], choco: ['#7a5238', '#6a4530', 'plank'] };
  function rng(seed) { let x = seed * 9301 + 49297; return () => { x = (x * 9301 + 49297) % 233280; return x / 233280; }; }
  function line(c, a, b, col, w) { c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.strokeStyle = col; c.lineWidth = w || 1; c.stroke(); }
  function floor(c, W, H, key) {
    WORLD = true; floorW(c, W, H, key); WORLD = false;
    const [VW, VH] = VIEW.dims();
    // Ambient wall contact shadows (where floor meets back walls)
    const sh = (pts, x0, y0, x1, y1) => {
      const g = c.createLinearGradient(x0, y0, x1, y1);
      g.addColorStop(0, 'rgba(40,20,8,.42)');
      g.addColorStop(0.5, 'rgba(40,20,8,.14)');
      g.addColorStop(1, 'rgba(40,20,8,0)');
      poly(c, pts, g, null);
    };
    { const p0 = P(0, 0), p1 = P(0, 1.4); sh([P(0, 0), P(VW, 0), P(VW, 1.4), P(0, 1.4)], p0[0], p0[1], p1[0], p1[1]); }
    { const p0 = P(0, 0), p1 = P(1.4, 0); sh([P(0, 0), P(1.4, 0), P(1.4, VH), P(0, VH)], p0[0], p0[1], p1[0], p1[1]); }
    // Warm central radiant light wash
    const [cx, cy] = [ISO.sx(VW / 2, VH / 2), ISO.sy(VW / 2, VH / 2)];
    const gSun = c.createRadialGradient(cx, cy, 10, cx, cy, Math.max(VW, VH) * 22);
    gSun.addColorStop(0, 'rgba(255,235,180,.12)');
    gSun.addColorStop(1, 'rgba(255,235,180,0)');
    poly(c, [P(0, 0), P(VW, 0), P(VW, VH), P(0, VH)], gSun, null);
    line(c, P(VW, 0), P(VW, VH), 'rgba(50,25,10,.65)', 2.2);
    line(c, P(0, VH), P(VW, VH), 'rgba(50,25,10,.65)', 2.2);
  }
  function floorW(c, W, H, key) {
    const [a, b] = FLOORS[key] || FLOORS.wood;
    const R = rng(W * 31 + H);
    const ft = FLOOR_T[key] || 'tile', wood = ft === 'wood';
    if (ft === 'carpet') {
      poly(c, [P(0, 0), P(W, 0), P(W, H), P(0, H)], a, null);
      for (let i = 0; i < W * H * 14; i++) { const q = P(R() * W, R() * H); ell(c, q[0], q[1], 1.6, .8, R() < .5 ? b : shade(a, .06)); }
      if (key === 'grass') for (let i = 0; i < W * H * 2; i++) { const q = P(R() * W, R() * H); ell(c, q[0], q[1], 1.5, 1.5, ['#fff', '#f7c948', '#f28ca6'][i % 3]); }
      return;
    }
    if (ft === 'parquet') {
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) for (let k = 0; k < 4; k++) {
        const col = shade(k % 2 ? a : b, (R() - .5) * .08), f = k / 4, g = (k + 1) / 4;
        const q = (x + y) % 2 ? [P(x, y + f), P(x + 1, y + f), P(x + 1, y + g), P(x, y + g)] : [P(x + f, y), P(x + g, y), P(x + g, y + 1), P(x + f, y + 1)];
        poly(c, q, col, 'rgba(70,40,20,.22)', .8);
      }
      return;
    }
    if (ft === 'checker') { for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) poly(c, [P(x, y), P(x + 1, y), P(x + 1, y + 1), P(x, y + 1)], (x + y) % 2 ? a : b, 'rgba(90,70,50,.15)', 1); return; }
    if (wood) {
      const N = 4; // planks per tile row
      for (let y = 0; y < H; y++) for (let i = 0; i < N; i++) {
        const y0 = y + i / N, y1 = y + (i + 1) / N;
        let x = -(R() * 1.5);
        while (x < W) {
          const len = 1.3 + R() * 1.8, x0 = Math.max(0, x), x1 = Math.min(W, x + len);
          const col = shade(R() < .5 ? a : b, (R() - .5) * .14);
          poly(c, [P(x0, y0), P(x1, y0), P(x1, y1), P(x0, y1)], col, null);
          // Top edge bevel highlight (gives authentic hardwood bevel!)
          line(c, P(x0, y0), P(x1, y0), 'rgba(255,255,255,.22)', 1.2);
          // Bottom edge seam shadow
          line(c, P(x0, y1), P(x1, y1), 'rgba(40,20,8,.32)', 1.3);
          // Plank end seam shadow and highlight
          line(c, P(x0, y0), P(x0, y1), 'rgba(30,15,5,.42)', 1.2);
          line(c, P(x0 + .03, y0), P(x0 + .03, y1), 'rgba(255,255,255,.16)', .8);
          // Realistic wood grain lines
          for (let g = 0; g < 2; g++) {
            const gy = y0 + (y1 - y0) * (.28 + g * .44), gx = x0 + (x1 - x0) * R() * .4;
            line(c, P(gx, gy), P(Math.min(x1, gx + .6 + R() * .7), gy + (R() - .5) * .02), 'rgba(255,255,255,.12)', .9);
            line(c, P(gx, gy + .02), P(Math.min(x1, gx + .6 + R() * .7), gy + .02 + (R() - .5) * .02), 'rgba(50,25,10,.14)', .8);
          }
          // Tiny wooden nail pegs
          const np = P(x0 + .08, y0 + (y1 - y0) * .5);
          ell(c, np[0], np[1], .8, .8, 'rgba(45,20,8,.38)');
          x += len;
        }
      }
    } else {
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const col = (x + y) % 2 ? a : b;
        poly(c, [P(x, y), P(x + 1, y), P(x + 1, y + 1), P(x, y + 1)], shade(col, (R() - .5) * .04), 'rgba(90,70,50,.25)', 1.2);
        if (key === 'tile') { c.save(); c.globalAlpha = .18; line(c, P(x + R() * .5, y + .1), P(x + .5 + R() * .5, y + .9), '#9a8f84', 1); c.restore(); }
        const h1 = P(x + .15, y + .15), h2 = P(x + .45, y + .15); line(c, h1, h2, 'rgba(255,255,255,.35)', 2);
      }
    }
  }
  function frame(c, pts, fill, inner) {
    poly(c, pts, '#8a5a33', OUT, 1.2);
    const [p0, p1, p2, p3] = pts, k = .14, mix = (u, v, t) => [u[0] + (v[0] - u[0]) * t, u[1] + (v[1] - u[1]) * t];
    const q = [mix(mix(p0, p1, k), mix(p3, p2, k), k), mix(mix(p0, p1, 1 - k), mix(p3, p2, 1 - k), k), mix(mix(p0, p1, 1 - k), mix(p3, p2, 1 - k), 1 - k), mix(mix(p0, p1, k), mix(p3, p2, k), 1 - k)];
    poly(c, q, fill, 'rgba(60,38,25,.6)', 1);
    if (inner) inner(q);
  }
  function entranceView(W, H) {
    const ey0 = H - 2.5, ey1 = H - 0.5;
    const a = VIEW.p(W, ey0), b = VIEW.p(W, ey1);
    return { a, b, ey0, ey1 };
  }
  function drawDoorGap(c, doorOn, lo, hi, sign) {
    const Q = (t, z) => doorOn === 'x0' ? P(0, t, z) : P(t, 0, z);
    poly(c, [Q(lo - .08, 0), Q(hi + .08, 0), Q(hi + .08, 84), Q(lo - .08, 84)], '#7a4f2e', OUT, 1.4);
    const g = c.createLinearGradient(0, Q(lo, 78)[1], 0, Q(lo, 0)[1]); g.addColorStop(0, '#d8f0fb'); g.addColorStop(1, '#a8d4ea');
    poly(c, [Q(lo + .04, 2), Q(hi - .04, 2), Q(hi - .04, 78), Q(lo + .04, 78)], g, 'rgba(60,38,25,.6)', 1);
    line(c, Q((lo + hi) / 2, 2), Q((lo + hi) / 2, 78), '#7a4f2e', 2);
    const k = Q(lo + .38, 40); ell(c, k[0], k[1], 2, 2, '#f2c14e'); const k2 = Q(hi - .38, 40); ell(c, k2[0], k2[1], 2, 2, '#f2c14e');
    if (sign) { const s0 = Q((lo + hi) / 2, 96); rrect(c, s0[0] - 18, s0[1] - 9, 36, 16, 5); c.fillStyle = '#6fb85a'; c.fill(); c.lineWidth = 1; c.strokeStyle = OUT; c.stroke();
      c.font = 'bold 9px sans-serif'; c.textAlign = 'center'; c.fillStyle = '#fff'; c.fillText(sign, s0[0], s0[1] + 3); c.textAlign = 'start'; }
  }
  function walls(c, W, H, key, home) {
    const [VW, VH] = VIEW.dims(); WORLD = false;
    wallsV(c, VW, VH, key);
    const { a, b } = entranceView(W, H);
    const doorOn = Math.abs(a[0]) < .01 && Math.abs(b[0]) < .01 ? 'x0' : Math.abs(a[1]) < .01 && Math.abs(b[1]) < .01 ? 'y0' : null;
    if (doorOn) { const lo = doorOn === 'x0' ? Math.min(a[1], b[1]) : Math.min(a[0], b[0]), hi = doorOn === 'x0' ? Math.max(a[1], b[1]) : Math.max(a[0], b[0]); drawDoorGap(c, doorOn, lo, hi, home ? null : 'OPEN'); }
    // a second, north-facing gap toward the café plot -- always open, so the yard back there is reachable
    if (!home) drawDoorGap(c, 'y0', W - 1.5, W - .5, null); // tracks the shop's east wall (CAFE_DOOR = W-1), not a fixed x=7
  }
  function wallsV(c, W, H, key) {
    const [a, b, pat] = WALLS[key] || WALLS.cream; const WH = 120, T = .18;
    // wall faces
    poly(c, [P(0, H, WH), P(0, 0, WH), P(0, 0, 0), P(0, H, 0)], shade(a, -.07), null);
    poly(c, [P(0, 0, WH), P(W, 0, WH), P(W, 0, 0), P(0, 0, 0)], a, null);
    // wallpaper pattern
    for (let i = 0; i < H * 2; i++) {
      if (pat === 'stripe' && i % 2) poly(c, [P(0, i / 2, WH), P(0, (i + 1) / 2, WH), P(0, (i + 1) / 2, 34), P(0, i / 2, 34)], shade(b, -.05));
      if (pat === 'plank') line(c, P(0, i / 2, WH), P(0, i / 2, 34), 'rgba(60,38,25,.2)');
      if (pat === 'dots') for (let z = 46; z < WH - 8; z += 22) { const p = P(0, i / 2 + .25, z + (i % 2) * 11); ell(c, p[0], p[1], 2.2, 2.8, shade(b, -.06)); }
    }
    { // extra wallpaper patterns on both walls (s=0 left wall x=0, s=1 right wall y=0)
      const Q = (s, u, z) => s ? P(u, 0, z) : P(0, u, z);
      const heart = (p, r, col) => { c.beginPath(); c.moveTo(p[0], p[1] + r); c.bezierCurveTo(p[0] - r * 1.6, p[1] - r * .1, p[0] - r * .8, p[1] - r * 1.4, p[0], p[1] - r * .5); c.bezierCurveTo(p[0] + r * .8, p[1] - r * 1.4, p[0] + r * 1.6, p[1] - r * .1, p[0], p[1] + r); c.fillStyle = col; c.fill(); };
      const star = (p, r, col) => { c.beginPath(); for (let k = 0; k < 10; k++) { const a2 = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? r * .45 : r; c.lineTo(p[0] + Math.cos(a2) * rr, p[1] + Math.sin(a2) * rr); } c.closePath(); c.fillStyle = col; c.fill(); };
      for (const s of [0, 1]) {
        const L = s ? W : H, col = s ? b : shade(b, -.06);
        if (pat === 'heart' || pat === 'star' || pat === 'flower') for (let i = 0; i < L * 2; i++) for (let z = 46; z < WH - 8; z += 22) {
          const p = Q(s, i / 2 + .25, z + (i % 2) * 11);
          if (pat === 'heart') heart(p, 3.2, col); else if (pat === 'star') star(p, 3.6, col); else { for (let k = 0; k < 5; k++) ell(c, p[0] + Math.cos(k * 1.26) * 2.6, p[1] + Math.sin(k * 1.26) * 2.6, 1.8, 1.8, col); ell(c, p[0], p[1], 1.4, 1.4, '#ffe38a'); }
        }
        if (pat === 'check') { for (let i = 0; i < L * 3; i += 2) poly(c, [Q(s, i / 3, WH), Q(s, (i + 1) / 3, WH), Q(s, (i + 1) / 3, 34), Q(s, i / 3, 34)], 'rgba(120,190,150,.28)'); for (let z = 40; z < WH; z += 16) poly(c, [Q(s, 0, z + 8), Q(s, L, z + 8), Q(s, L, z), Q(s, 0, z)], 'rgba(120,190,150,.28)'); }
        if (pat === 'brick') for (let z = 34, r = 0; z < WH; z += 10, r++) { line(c, Q(s, 0, z), Q(s, L, z), col, 1.4); for (let u = (r % 2) * .25; u < L; u += .5) line(c, Q(s, u, z), Q(s, u, Math.min(WH, z + 10)), col, 1.4); }
      }
    }
    for (let i = 0; i < W * 2; i++) {
      if (pat === 'stripe' && i % 2) poly(c, [P(i / 2, 0, WH), P((i + 1) / 2, 0, WH), P((i + 1) / 2, 0, 34), P(i / 2, 0, 34)], b);
      if (pat === 'plank') line(c, P(i / 2, 0, WH), P(i / 2, 0, 34), 'rgba(60,38,25,.2)');
      if (pat === 'dots') for (let z = 46; z < WH - 8; z += 22) { const p = P(i / 2 + .25, 0, z + (i % 2) * 11); ell(c, p[0], p[1], 2.2, 2.8, b); }
    }
    // wainscot panels
    const woodA = '#b98552', woodB = '#a0703f';
    poly(c, [P(0, H, 34), P(0, 0, 34), P(0, 0, 0), P(0, H, 0)], shade(woodB, -.05), null);
    poly(c, [P(0, 0, 34), P(W, 0, 34), P(W, 0, 0), P(0, 0, 0)], woodA, null);
    for (let i = 0; i < H * 2; i++) { const y = i / 2 + .07; poly(c, [P(0, y, 28), P(0, y + .36, 28), P(0, y + .36, 8), P(0, y, 8)], shade(woodB, .06), 'rgba(60,38,25,.35)', 1); }
    for (let i = 0; i < W * 2; i++) { const x = i / 2 + .07; poly(c, [P(x, 0, 28), P(x + .36, 0, 28), P(x + .36, 0, 8), P(x, 0, 8)], shade(woodA, .08), 'rgba(60,38,25,.35)', 1); }
    // chair rail & baseboard
    for (const z of [34, 3]) { line(c, P(0, H, z), P(0, 0, z), '#7a4f2e', 3); line(c, P(0, 0, z), P(W, 0, z), '#7a4f2e', 3); }
    // crown molding
    line(c, P(0, H, WH - 3), P(0, 0, WH - 3), '#ffffff', 3); line(c, P(0, 0, WH - 3), P(W, 0, WH - 3), '#ffffff', 3);
    // wall thickness caps (top)
    poly(c, [P(-T, H, WH), P(-T, -T, WH), P(0, 0, WH), P(0, H, WH)], '#8a5a33', OUT, 1.2);
    poly(c, [P(-T, -T, WH), P(W, -T, WH), P(W, 0, WH), P(0, 0, WH)], '#9b6a3f', OUT, 1.2);
    poly(c, [P(W, -T, WH), P(W, 0, WH), P(W, 0, 0), P(W, -T, 0)], '#7a4f2e', OUT, 1.2);
    poly(c, [P(-T, H, WH), P(0, H, WH), P(0, H, 0), P(-T, H, 0)], '#6f4521', OUT, 1.2);
    line(c, P(0, 0, WH), P(0, 0, 0), 'rgba(60,38,25,.5)', 1.5);
    // windows with frames & curtains on right wall (with visible outdoor scenery & transparent glass)
    for (const wx of [W * .28, W * .72]) {
      const q = [P(wx - .75, 0, 104), P(wx + .75, 0, 104), P(wx + .75, 0, 52), P(wx - .75, 0, 52)];
      poly(c, q, '#f4efe6', OUT, 1.5);
      const g = [P(wx - .62, 0, 99), P(wx + .62, 0, 99), P(wx + .62, 0, 57), P(wx - .62, 0, 57)];
      // 1. Outdoor sky view
      const lg = c.createLinearGradient(g[0][0], g[0][1], g[2][0], g[2][1]);
      lg.addColorStop(0, '#5ea8e2'); lg.addColorStop(0.55, '#a4daf4'); lg.addColorStop(0.78, '#e6f5fb'); lg.addColorStop(1, '#c2e6ba');
      poly(c, g, lg, 'rgba(60,38,25,.5)', 1);
      // Clip to window glass area for outdoor scenery
      c.save();
      c.beginPath(); g.forEach((p, idx) => idx ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); c.clip();
      // Distant fluffy clouds
      const [gx0, gy0] = g[0], [gx1, gy1] = g[1], gcx = (gx0 + gx1) / 2, gcy = (gy0 + g[2][1]) / 2;
      ell(c, gcx - 10, gy0 + 12, 14, 7, 'rgba(255,255,255,.88)');
      ell(c, gcx - 4, gy0 + 9, 10, 8, 'rgba(255,255,255,.95)');
      ell(c, gcx + 8, gy0 + 14, 12, 6, 'rgba(255,255,255,.82)');
      // Distant rolling green hill
      const gyb = g[2][1];
      c.beginPath(); c.ellipse(gcx, gyb + 2, 28, 16, 0, 0, Math.PI * 2); c.fillStyle = '#68b472'; c.fill();
      // Distant lush tree crowns visible outside
      ell(c, gcx - 12, gyb - 6, 11, 13, '#3c8846');
      ell(c, gcx - 10, gyb - 8, 8, 10, '#56a858');
      ell(c, gcx + 12, gyb - 4, 13, 15, '#2f7a38');
      ell(c, gcx + 14, gyb - 7, 9, 11, '#4fa056');
      ell(c, gcx, gyb - 2, 10, 11, '#5bb862');
      // Warm sunlight streak through the window
      const gSun = c.createLinearGradient(gx0, gy0, gx0 + 35, gyb);
      gSun.addColorStop(0, 'rgba(255,250,210,.35)'); gSun.addColorStop(0.5, 'rgba(255,245,180,.15)'); gSun.addColorStop(1, 'rgba(255,245,180,0)');
      c.fillStyle = gSun; c.fillRect(gx0 - 20, gy0 - 10, 80, 80);
      // Diagonal glass reflections / specular glints
      line(c, P(wx - .48, 0, 96), P(wx + .2, 0, 60), 'rgba(255,255,255,.55)', 3.5);
      line(c, P(wx - .28, 0, 97), P(wx + .42, 0, 62), 'rgba(255,255,255,.3)', 1.8);
      c.restore();
      // Window muntins/crossbars
      line(c, P(wx, 0, 99), P(wx, 0, 57), '#f4efe6', 3.2); line(c, P(wx - .62, 0, 78), P(wx + .62, 0, 78), '#f4efe6', 3.2);
      line(c, P(wx, 0, 99), P(wx, 0, 57), 'rgba(60,38,25,.3)', 1); line(c, P(wx - .62, 0, 78), P(wx + .62, 0, 78), 'rgba(60,38,25,.3)', 1);
      // Curtains & sill
      for (const sd of [-1, 1]) { const x0 = wx + sd * .72, x1 = wx + sd * .98; poly(c, [P(x0, .02, 108), P(x1, .02, 108), P(x1 + sd * .05, .02, 46), P(x0, .02, 50)], '#ef9fb0', 'rgba(60,38,25,.5)', 1); }
      poly(c, [P(wx - 1.05, .02, 112), P(wx + 1.05, .02, 112), P(wx + 1.05, .02, 106), P(wx - 1.05, .02, 106)], '#d77a90', OUT, 1);
      poly(c, [P(wx - .85, 0, 52), P(wx + .85, 0, 52), P(wx + .85, .18, 49), P(wx - .85, .18, 49)], '#e8d3b5', OUT, 1);
      const pp = P(wx + .4, .09, 52); ell(c, pp[0], pp[1] - 4, 5, 3.5, '#c9785a', OUT, .8); ell(c, pp[0], pp[1] - 9, 5, 5, '#6fb85a', OUT, .8);
    }
    // left wall: shop sign + picture frames + clock
    const hm = H * .5;
    frame(c, [P(0, hm - 1.3, 110), P(0, hm + 1.3, 110), P(0, hm + 1.3, 82), P(0, hm - 1.3, 82)], '#6f4521', q => {
      const pc = P(0, hm, 96); ell(c, pc[0], pc[1] + 3, 6, 5, '#ffd9a8'); for (const [dx, dy] of [[-6, -4], [-2, -8], [3, -8], [7, -4]]) ell(c, pc[0] + dx, pc[1] + dy, 2.4, 2.8, '#ffd9a8');
    });
    const arts = [['#bfe3f7', '🐶'], ['#fde3ea', '🐱'], ['#e8f5d8', '🐰']];
    [hm - 2.8, hm + 2.2, hm + 3.5].forEach((y, i) => { if (y < .6 || y > H - .9) return; frame(c, [P(0, y - .45, 88 - i * 4), P(0, y + .45, 88 - i * 4), P(0, y + .45, 58 - i * 4), P(0, y - .45, 58 - i * 4)], arts[i][0], q => { const m = P(0, y, 72 - i * 4); c.font = '13px sans-serif'; c.textAlign = 'center'; c.fillText(arts[i][1], m[0], m[1] + 5); c.textAlign = 'start'; }); });
    const ck = P(W * .5, 0, 104); ell(c, ck[0], ck[1], 9, 9, '#fff', OUT, 1.5); line(c, ck, [ck[0], ck[1] - 6], '#3b2616', 1.5); line(c, ck, [ck[0] + 4, ck[1] + 1], '#3b2616', 1.5);
  }
  function tree(c, x, y, k, col) {
    const [sx, sy] = P(x, y); k = k || 1;
    // Ambient soft ground contact shadow
    ell(c, sx + 2 * k, sy + 3 * k, 26 * k, 11 * k, 'rgba(25,45,15,.16)');
    ell(c, sx, sy + 1 * k, 19 * k, 8 * k, 'rgba(30,35,15,.24)');

    // Warm, gnarled timber trunk with organic root spread
    c.beginPath();
    c.moveTo(sx - 5.5 * k, sy);
    c.quadraticCurveTo(sx - 3.2 * k, sy - 12 * k, sx - 2.8 * k, sy - 28 * k);
    c.lineTo(sx + 2.8 * k, sy - 28 * k);
    c.quadraticCurveTo(sx + 3.2 * k, sy - 12 * k, sx + 5.5 * k, sy);
    c.closePath();
    const gTrunk = c.createLinearGradient(sx - 4 * k, sy, sx + 4 * k, sy);
    gTrunk.addColorStop(0, '#5e3c23'); gTrunk.addColorStop(0.45, '#7a5134'); gTrunk.addColorStop(1, '#4d2d18');
    c.fillStyle = gTrunk; c.fill(); c.lineWidth = 1.1; c.strokeStyle = OUT; c.stroke();
    // Warm wood grain
    line2(c, [sx - 1 * k, sy - 5 * k], [sx - 1 * k, sy - 23 * k], 'rgba(50,25,12,.35)', 1.2);
    line2(c, [sx + 1.2 * k, sy - 7 * k], [sx + 1.2 * k, sy - 20 * k], 'rgba(50,25,12,.25)', 1);

    // Fluffy, layered storybook watercolor foliage clusters
    const cc = col || '#7cb860';
    const darkC = shade(cc, -.25), midC = cc, litC = shade(cc, .28), hiC = shade(cc, .5);
    const puffs = [
      [-13, -34, 16, 14.5],
      [13, -34, 16, 14.5],
      [-8, -47, 18, 15.5],
      [8, -46, 17, 15.5],
      [0, -58, 15, 14]
    ];
    // Underside soft shadow clouds
    for (const [dx, dy, rx, ry] of puffs) {
      ell(c, sx + dx * k, sy + (dy + 3.5) * k, rx * k, ry * .88 * k, darkC);
    }
    // Main watercolor canopy puffs
    for (const [dx, dy, rx, ry] of puffs) {
      const px = sx + dx * k, py = sy + dy * k;
      const gLeaf = c.createRadialGradient(px - rx * .28 * k, py - ry * .35 * k, rx * .15 * k, px, py, rx * 1.05 * k);
      gLeaf.addColorStop(0, litC); gLeaf.addColorStop(0.55, midC); gLeaf.addColorStop(1, darkC);
      ell(c, px, py, rx * k, ry * .92 * k, gLeaf, 'rgba(30,60,20,.65)', 1.1);
    }
    // Sunlit warm canopy rim highlights
    for (const [dx, dy, rx, ry] of puffs) {
      ell(c, sx + (dx - rx * .28) * k, sy + (dy - ry * .32) * k, rx * .4 * k, ry * .25 * k, 'rgba(255,255,255,.34)');
    }
    ell(c, sx - 2 * k, sy - 63 * k, 7.5 * k, 4.5 * k, hiC);
    ell(c, sx - 3 * k, sy - 64 * k, 3.8 * k, 2.2 * k, '#ffffff');

    // Fruit tree or blossom tree accents based on position
    const fruitHash = Math.abs(Math.sin(x * 12.3 + y * 45.7) * 100) % 1;
    if (fruitHash < .4) {
      // Rosy peach / apple fruit clusters
      const fruitPts = [[-10, -32], [10, -36], [-4, -45], [7, -42], [-1, -54]];
      for (const [fx, fy] of fruitPts) {
        ell(c, sx + fx * k, sy + fy * k, 3.2 * k, 3.2 * k, '#f77f98', OUT, .7);
        ell(c, sx + (fx - .8) * k, sy + (fy - .8) * k, 1.2 * k, 1.2 * k, '#ffffff');
        c.beginPath(); c.arc(sx + fx * k, sy + (fy - 2.8) * k, 1 * k, 0, TAU); c.fillStyle = '#5c8f3e'; c.fill();
      }
    } else if (fruitHash > .7) {
      // Delicate pastel cherry/magnolia blossoms
      const flwPts = [[-12, -34], [11, -33], [-6, -48], [9, -44], [0, -56]];
      for (const [fx, fy] of flwPts) {
        ell(c, sx + fx * k, sy + fy * k, 3.5 * k, 3.5 * k, '#ffe3ec', 'rgba(180,80,100,.5)', .6);
        ell(c, sx + fx * k, sy + fy * k, 1.3 * k, 1.3 * k, '#f5ba42');
      }
    }
  }

  function lampPost(c, x, y) {
    const [sx, sy] = P(x, y);
    // Soft ground glow
    ell(c, sx, sy + 1, 14, 7, 'rgba(255,220,130,.18)');
    ell(c, sx + 1, sy + 1, 9, 4.5, 'rgba(20,20,20,.22)');
    ell(c, sx, sy, 7, 3.5, '#2e333d', OUT, 1.2);

    // Ornate cast-iron fluted post
    rrect(c, sx - 2.2, sy - 62, 4.4, 62, 1.5);
    const gPost = c.createLinearGradient(sx - 2, sy, sx + 2, sy);
    gPost.addColorStop(0, '#555e6d'); gPost.addColorStop(0.5, '#373d47'); gPost.addColorStop(1, '#20242b');
    c.fillStyle = gPost; c.fill(); c.strokeStyle = OUT; c.lineWidth = 1; c.stroke();

    // Base ring molding
    ell(c, sx, sy - 8, 4.8, 2.4, '#48505e', OUT, .8);

    // Ornamental side scroll bracket
    c.beginPath();
    c.moveTo(sx - 2, sy - 52);
    c.quadraticCurveTo(sx - 7, sy - 56, sx - 7, sy - 63);
    c.quadraticCurveTo(sx - 4, sy - 64, sx - 2, sy - 62);
    c.strokeStyle = '#2e333d'; c.lineWidth = 1.4; c.stroke();

    // Lantern cage
    rrect(c, sx - 7, sy - 75, 14, 16, 3);
    c.fillStyle = 'rgba(255,248,220,.95)'; c.fill();
    c.strokeStyle = '#2e333d'; c.lineWidth = 1.4; c.stroke();

    // Glowing warm interior lantern light
    ell(c, sx, sy - 67, 4.8, 5.2, '#ffea9f');
    ell(c, sx, sy - 68, 2.2, 2.6, '#ffffff');

    // Soft radiant golden bloom halo around lamp
    const gGlow = c.createRadialGradient(sx, sy - 67, 3, sx, sy - 67, 18);
    gGlow.addColorStop(0, 'rgba(255,235,160,.45)');
    gGlow.addColorStop(1, 'rgba(255,235,160,0)');
    ell(c, sx, sy - 67, 18, 18, gGlow);

    // Top cap & brass finial
    c.beginPath(); c.moveTo(sx - 9.5, sy - 75); c.lineTo(sx, sy - 83); c.lineTo(sx + 9.5, sy - 75); c.closePath();
    c.fillStyle = '#2e333d'; c.fill(); c.stroke();
    ell(c, sx, sy - 84, 2.2, 2.2, '#deb34a');
  }

  function flowerBed(c, x, y, w) {
    poly(c, [P(x - .05, y - .05), P(x + w + .05, y - .05), P(x + w + .05, y + .85), P(x - .05, y + .85)], 'rgba(30,18,8,.2)', null);
    // Weathered warm timber planter trough
    poly(c, [P(x, y), P(x + w, y), P(x + w, y + .8), P(x, y + .8)], '#704829', OUT, 1.2);
    // Rich soil surface
    poly(c, [P(x + .05, y + .05), P(x + w - .05, y + .05), P(x + w - .05, y + .75), P(x + .05, y + .75)], '#452b17', null);

    // Overflowing delicate pastel blossoms
    for (let i = 0; i < w * 5; i++) {
      const [sx, sy] = P(x + .12 + i * .19, y + .38 + ((i % 3) - 1) * .15);
      // Soft foliage puff
      ell(c, sx, sy - 3, 5.2, 4.2, ['#5aa644', '#66bb4e', '#4c9638'][i % 3], 'rgba(30,60,20,.6)', .6);
      // Soft pastel flowers (rose, buttercup, baby blue, lavender, peach, ivory)
      const col = ['#f78da7', '#ffd152', '#ffffff', '#bca3ea', '#ff9e7d', '#70c7ea'][i % 6];
      ell(c, sx, sy - 6.5, 4, 4, col, 'rgba(60,20,30,.45)', .7);
      ell(c, sx, sy - 6.5, 1.5, 1.5, '#fff6c4');
    }
  }

  function building(c, x, y, w, d, h, col, roof, awning) {
    box(c, x, y, w, d, h, col);
    // Stone foundation base band with masonry blocks
    const fx = vis(-1, 0), fy = vis(0, 1);
    if (fy) {
      poly(c, [P(x, y + d, 8), P(x + w, y + d, 8), P(x + w, y + d, 0), P(x, y + d, 0)], '#c4b7a4', OUT, 1);
      for (let i = 0; i < w * 2; i++) {
        const u = i / 2;
        line2(c, P(x + u, y + d, 8), P(x + u, y + d, 0), 'rgba(70,55,40,.35)', 1);
      }
    }
    if (fx) {
      poly(c, [P(x, y, 8), P(x, y + d, 8), P(x, y + d, 0), P(x, y, 0)], '#b3a693', OUT, 1);
      for (let j = 0; j < d * 2; j++) {
        const v = j / 2;
        line2(c, P(x, y + v, 8), P(x, y + v, 0), 'rgba(70,55,40,.35)', 1);
      }
    }
    // Windows on front faces with white trim and glass reflections
    if (vis(0, 1)) for (let i = 0; i < w; i++) for (let z = 18; z < h - 10; z += 26) {
      const q = [P(x + i + .2, y + d, z + 16), P(x + i + .8, y + d, z + 16), P(x + i + .8, y + d, z), P(x + i + .2, y + d, z)];
      poly(c, q, '#ffffff', OUT, 1.2);
      const inner = [P(x + i + .26, y + d, z + 14), P(x + i + .74, y + d, z + 14), P(x + i + .74, y + d, z + 2), P(x + i + .26, y + d, z + 2)];
      const gWin = c.createLinearGradient(inner[0][0], inner[0][1], inner[2][0], inner[2][1]);
      gWin.addColorStop(0, '#eaf7fc'); gWin.addColorStop(0.6, '#b8e3f4'); gWin.addColorStop(1, '#82c5e5');
      poly(c, inner, gWin, 'rgba(40,30,20,.4)', .8);
      line2(c, P(x + i + .32, y + d, z + 12), P(x + i + .58, y + d, z + 4), 'rgba(255,255,255,.75)', 1.5);
    }
    if (vis(1, 0)) for (let j = 0; j < d; j++) for (let z = 18; z < h - 10; z += 26) {
      const q = [P(x + w, y + j + .2, z + 16), P(x + w, y + j + .8, z + 16), P(x + w, y + j + .8, z), P(x + w, y + j + .2, z)];
      poly(c, q, '#eae4da', OUT, 1.2);
      const inner = [P(x + w, y + j + .26, z + 14), P(x + w, y + j + .74, z + 14), P(x + w, y + j + .74, z + 2), P(x + w, y + j + .26, z + 2)];
      poly(c, inner, '#9ec8df', 'rgba(40,30,20,.4)', .8);
    }
    // Roof eaves and shingle texture
    poly(c, [P(x - .14, y - .14, h), P(x + w + .14, y - .14, h), P(x + w + .14, y + d + .14, h), P(x - .14, y + d + .14, h)], roof, OUT, 1.3);
    poly(c, [P(x + .15, y + .15, h + 18), P(x + w - .15, y + .15, h + 18), P(x + w + .14, y + d + .14, h), P(x - .14, y + d + .14, h)], shade(roof, -.1), OUT, 1.3);
    for (let rz = h + 4; rz < h + 17; rz += 4) {
      line2(c, P(x - .05, y + d + .05, rz), P(x + w + .05, y + d + .05, rz), 'rgba(255,255,255,.24)', 1.2);
      line2(c, P(x - .05, y + d + .05, rz - .5), P(x + w + .05, y + d + .05, rz - .5), 'rgba(30,15,5,.3)', 1);
    }
    if (awning && vis(0, 1)) {
      for (let i = 0; i < w * 2; i++) {
        poly(c, [P(x + i / 2, y + d, 30), P(x + (i + 1) / 2, y + d, 30), P(x + (i + 1) / 2, y + d + .38, 22), P(x + i / 2, y + d + .38, 22)], i % 2 ? '#ffffff' : awning, OUT, .9);
        const [vx, vy] = P(x + i / 2 + .25, y + d + .38, 22);
        ell(c, vx, vy, 4.5, 3.5, i % 2 ? '#ffffff' : awning, OUT, .7);
      }
    }
  }
  const STORE_Y = { get seed() { return typeof STALL_POS === 'function' ? STALL_POS().y : LAY_FAR; } };
  const DZONE = (W, H) => ({ x0: W + 1.15, x1: W + 3.3, y0: .9, y1: 3.1 });
  function dropZone(c, W, H, label, signOnly) {
    const z = DZONE(W, H);
    if (!signOnly) {
      poly(c, [P(z.x0, z.y0), P(z.x1, z.y0), P(z.x1, z.y1), P(z.x0, z.y1)], '#f5e8c4', null);
      const n = 18, pts = [];
      for (let i = 0; i < n; i++) {
        const k0 = i / n, k1 = (i + .5) / n;
        pts.push([[z.x0 + (z.x1 - z.x0) * k0, z.y0], [z.x0 + (z.x1 - z.x0) * k1, z.y0]], [[z.x0 + (z.x1 - z.x0) * k0, z.y1], [z.x0 + (z.x1 - z.x0) * k1, z.y1]], [[z.x0, z.y0 + (z.y1 - z.y0) * k0], [z.x0, z.y0 + (z.y1 - z.y0) * k1]], [[z.x1, z.y0 + (z.y1 - z.y0) * k0], [z.x1, z.y0 + (z.y1 - z.y0) * k1]]);
      }
      c.lineWidth = 3; c.strokeStyle = '#f3be4d'; c.lineCap = 'butt';
      for (const [a, b] of pts) { const p0 = P(a[0], a[1]), p1 = P(b[0], b[1]); c.beginPath(); c.moveTo(p0[0], p0[1]); c.lineTo(p1[0], p1[1]); c.stroke(); }
      const cx = (z.x0 + z.x1) / 2, cy = (z.y0 + z.y1) / 2;
      c.globalAlpha = .35; poly(c, [P(cx - .35, cy - .35), P(cx + .35, cy - .35), P(cx + .35, cy + .35), P(cx - .35, cy + .35)], '#c98d55', '#8a5a33', 2); c.globalAlpha = 1;
    }
    const [sx, sy] = P(z.x0 + .1, z.y0 + .15);
    rrect(c, sx - 2, sy - 44, 4, 44, 1); c.fillStyle = '#6b6f78'; c.fill();
    rrect(c, sx - 26, sy - 62, 52, 22, 6); c.fillStyle = '#f3be4d'; c.fill(); c.lineWidth = 1.5; c.strokeStyle = OUT; c.stroke();
    c.font = 'bold 10px sans-serif'; c.textAlign = 'center'; c.fillStyle = '#5a3514'; c.fillText('📦 ' + label, sx, sy - 47); c.textAlign = 'start';
  }

  // Cozy Country Market Stall with Pastel Striped Canvas Canopy & Farm Baskets
  function marketStall(c, W, y0, name) {
    const x = STALL_POS().x, w = 3.1, d = 3, RH = 96, AD = 1.9;
    poly(c, [P(x - .2, y0 - .1), P(x + w + .1, y0 - .1), P(x + w + .1, y0 + d + .2), P(x - .2, y0 + d + .2)], 'rgba(30,20,10,.14)', null);

    // Warm timber corner posts
    for (const px of [x + .05, x + w - .17]) box(c, px, y0 + .05, .12, .12, RH, '#7d5231');

    // Fresh produce wooden crates
    const crate = (cx, cy, col) => {
      box(c, cx, cy, .82, .62, 9, '#b5824e');
      const p = P(cx + .41, cy + .31, 9);
      for (let i = 0; i < 6; i++) ell(c, p[0] - 8 + (i % 3) * 8, p[1] - 3 + ((i >> 1) % 2) * 2, 4.4, 3.6, col[i % col.length], 'rgba(60,30,10,.6)', .7);
    };
    crate(x + .1, y0 + 1.0, ['#ff9e3b', '#ffb65c']); // carrots / oranges
    crate(x + w - .9, y0 + 1.0, ['#72cb52', '#91dd68']); // cabbages / apples

    // Friendly Seller Actor behind the counter
    {
      const s = P(x + w / 2, y0 + 1.2, 0), look = ART.randomHuman(4242);
      look.apron = '#6aa85b'; look.hat = null; look.top = 'tee';
      c.save(); c.translate(s[0], s[1]); c.scale(.95, .95); ART.human(c, look, 0, 0, false); c.restore();
    }

    // Soft Sage & Warm Cream striped canvas awning with scalloped valance
    const stripeA = '#fdfbf6', stripeB = '#7ba689'; // Cozy pastel sage & cream
    for (let i = 0; i < 6; i++) {
      poly(c, [P(x + i * w / 6, y0 - .05, RH), P(x + (i + 1) * w / 6, y0 - .05, RH), P(x + (i + 1) * w / 6, y0 + AD, RH), P(x + i * w / 6, y0 + AD, RH)], i % 2 ? stripeA : stripeB, OUT, .8);
    }
    // Front valance with scallop curves
    for (let i = 0; i < 6; i++) {
      poly(c, [P(x + i * w / 6, y0 + AD, RH), P(x + (i + 1) * w / 6, y0 + AD, RH), P(x + (i + 1) * w / 6, y0 + AD, RH - 7), P(x + i * w / 6, y0 + AD, RH - 7)], i % 2 ? '#f5eee0' : shade(stripeB, -.15), OUT, .6);
      const [vx, vy] = P(x + (i + .5) * w / 6, y0 + AD, RH - 7);
      ell(c, vx, vy, 4.2, 3.2, i % 2 ? '#f5eee0' : shade(stripeB, -.15), OUT, .6);
    }
    for (const px of [x + .05, x + w - .17]) box(c, px, y0 + AD - .12, .12, .12, RH - 7, '#7d5231');

    // Wooden counter surface
    box(c, x + .25, y0 + 1.95, w - .5, .85, 20, '#ba7b43', 0, { top: '#e2ab6f' });

    // Woven wicker baskets of farm harvest
    const baskets = [['#ff9e3b', '#ffb852'], ['#e85248', '#ff7a70'], ['#72cb52', '#a2e878'], ['#f7d64a', '#ffe882']];
    baskets.forEach((cl, i) => {
      const p = P(x + .6 + i * .62, y0 + 2.38, 20);
      ell(c, p[0], p[1] + 1, 12.5, 6.5, '#a6723e', OUT, 1);
      for (let k = 0; k < 7; k++) ell(c, p[0] - 8 + (k % 4) * 5.3, p[1] - 3 - (k >> 2) * 3, 4, 3.4, cl[k % 2], 'rgba(60,30,10,.55)', .6);
    });

    // Hanging wooden market chalkboard sign with flower garland
    {
      const s = P(x + w / 2, y0 + AD, RH + 12);
      c.save(); c.font = 'bold 11px sans-serif';
      const tw = Math.max(54, c.measureText(name).width + 16);
      rrect(c, s[0] - tw / 2, s[1] - 10, tw, 21, 7);
      c.fillStyle = '#fffdf7'; c.fill(); c.lineWidth = 1.5; c.strokeStyle = OUT; c.stroke();
      c.textAlign = 'center'; c.fillStyle = '#4e8a52'; c.fillText(name, s[0], s[1] + 4.5);
      // Small flower garland on sign corners
      for (const sd of [-1, 1]) {
        ell(c, s[0] + sd * (tw / 2 - 4), s[1] - 8, 2.8, 2.8, '#f78da7');
        ell(c, s[0] + sd * (tw / 2 - 4), s[1] - 8, 1, 1, '#fff6c4');
      }
      c.restore();
    }
  }

  // Soft Cozy Storybook Shops (Seed Shop & Tool Shop)
  function store(c, W, y0, kind, name, sub) {
    const x = W + 10.5, w = 3.1, d = 3, h = 76;
    // Warm pastel storybook colors
    const col = kind === 'seed' ? '#fcf3dd' : '#eaf2fa'; // Warm buttermilk & soft sky
    const roof = kind === 'seed' ? '#df7d64' : '#658bb2'; // Terracotta & slate blue
    const aw = kind === 'seed' ? '#7ba689' : '#b87588'; // Sage green & dusty rose

    poly(c, [P(x - .4, y0), P(x + w, y0), P(x + w, y0 + d + .4), P(x - .4, y0 + d + .4)], 'rgba(30,20,10,.14)', null);
    box(c, x, y0, w, d, h, col);
    const fx = vis(-1, 0), fy = vis(0, 1);

    // Weathered limestone foundation
    if (fx) poly(c, [P(x, y0, 9), P(x, y0 + d, 9), P(x, y0 + d, 0), P(x, y0, 0)], '#c9beac', OUT, 1);
    if (fy) poly(c, [P(x, y0 + d, 9), P(x + w, y0 + d, 9), P(x + w, y0 + d, 0), P(x, y0 + d, 0)], '#baaf9d', OUT, 1);

    // Leaded multi-pane windows
    if (fy) for (let i = 0; i < 3; i++) {
      const q = [P(x + .3 + i, y0 + d, 58), P(x + .8 + i, y0 + d, 58), P(x + .8 + i, y0 + d, 22), P(x + .3 + i, y0 + d, 22)];
      if (i < 3 && x + .8 + i < x + w) {
        poly(c, q, '#ffffff', OUT, 1.1);
        poly(c, [P(x + .35 + i, y0 + d, 55), P(x + .75 + i, y0 + d, 55), P(x + .75 + i, y0 + d, 25), P(x + .35 + i, y0 + d, 25)], '#d8edf7', 'rgba(40,30,20,.3)', .7);
      }
    }

    const goods = kind === 'seed' ? ['🌾', '🥕', '🍅', '🎃'] : ['⛏️', '💧', '🧰', '🪓'];
    if (fx) [[.2, 1.05], [1.95, 2.8]].forEach(([a, b], k) => {
      poly(c, [P(x, y0 + a, 48), P(x, y0 + b, 48), P(x, y0 + b, 12), P(x, y0 + a, 12)], '#e4f4fb', OUT, 1.3);
      poly(c, [P(x, y0 + a, 20), P(x, y0 + b, 20), P(x, y0 + b, 12), P(x, y0 + a, 12)], shade(col, -.12), null);
      c.font = '12px sans-serif'; c.textAlign = 'center';
      for (let j = 0; j < 2; j++) { const m = P(x, y0 + a + (b - a) * (.3 + j * .4), 25); c.fillText(goods[k * 2 + j], m[0], m[1]); }
      c.textAlign = 'start';
      const r0 = P(x, y0 + a + .15, 44), r1 = P(x, y0 + a + .35, 30);
      c.beginPath(); c.moveTo(r0[0], r0[1]); c.lineTo(r1[0], r1[1]); c.lineWidth = 2; c.strokeStyle = 'rgba(255,255,255,.8)'; c.stroke();
    });

    if (fx) {
      // Warm paneled timber door
      poly(c, [P(x, y0 + 1.2, 44), P(x, y0 + 1.8, 44), P(x, y0 + 1.8, 0), P(x, y0 + 1.2, 0)], '#a67246', OUT, 1.2);
      poly(c, [P(x, y0 + 1.28, 40), P(x, y0 + 1.72, 40), P(x, y0 + 1.72, 22), P(x, y0 + 1.28, 22)], '#e0f1fa', OUT, .8);
      { const k = P(x, y0 + 1.33, 18); ell(c, k[0], k[1], 1.8, 1.8, '#deb34a'); }
      // Scalloped striped awning
      for (let i = 0; i < d * 2; i++) {
        poly(c, [P(x, y0 + i / 2, 56), P(x, y0 + (i + 1) / 2, 56), P(x - .45, y0 + (i + 1) / 2, 46), P(x - .45, y0 + i / 2, 46)], i % 2 ? '#ffffff' : aw, OUT, .8);
        const [vx, vy] = P(x - .45, y0 + (i + .5) / 2, 46);
        ell(c, vx, vy, 3.8, 3, i % 2 ? '#ffffff' : aw, OUT, .6);
      }
    }

    // Roof eaves & tiles
    poly(c, [P(x - .15, y0 - .1, h), P(x + w + .1, y0 - .1, h), P(x + w + .1, y0 + d + .1, h), P(x - .15, y0 + d + .1, h)], roof, OUT, 1.3);
    poly(c, [P(x - .15, y0 - .1, h), P(x - .15, y0 + d + .1, h), P(x - .15, y0 + d + .1, h - 5), P(x - .15, y0 - .1, h - 5)], shade(roof, -.2), OUT, 1);
    poly(c, [P(x - .15, y0 + d + .1, h), P(x + w + .1, y0 + d + .1, h), P(x + w + .1, y0 + d + .1, h - 5), P(x - .15, y0 + d + .1, h - 5)], shade(roof, -.3), OUT, 1);

    // Hand-painted boutique sign board
    {
      const onX = fx || !fy;
      const S0 = onX ? [x - .03, y0 + .25] : [x + .1, y0 + d + .03], S1 = onX ? [x - .03, y0 + 2.75] : [x + w - .1, y0 + d + .03];
      poly(c, [P(S0[0], S0[1], 72), P(S1[0], S1[1], 72), P(S1[0], S1[1], 58), P(S0[0], S0[1], 58)], '#fffdf7', OUT, 1.3);
      let a0 = P(S0[0], S0[1], 61.5), a1 = P(S1[0], S1[1], 61.5); if (a1[0] < a0[0]) { const tt = a0; a0 = a1; a1 = tt; }
      const dx = a1[0] - a0[0], dy = a1[1] - a0[1], L = Math.hypot(dx, dy);
      c.save(); c.transform(dx / L, dy / L, 0, 1, a0[0], a0[1] + 2); let fs = 11; c.font = `bold ${fs}px sans-serif`; while (c.measureText(name).width > L - 4 && fs > 7) { fs--; c.font = `bold ${fs}px sans-serif`; }
      c.fillStyle = roof; c.fillText(name, (L - c.measureText(name).width) / 2, 0); c.restore();
    }
    const b = P(x + w * .45, y0 + d * .5, h + 14); rrect(c, b[0] - 15, b[1] - 8, 30, 14, 7); c.fillStyle = '#4e8a52'; c.fill(); c.strokeStyle = OUT; c.lineWidth = 1; c.stroke();
    c.font = 'bold 9px sans-serif'; c.textAlign = 'center'; c.fillStyle = '#fff'; c.fillText(sub, b[0], b[1] + 2); c.textAlign = 'start';

    // Potted flowering shrubs outside shop door
    if (fx) for (const yy of [y0 + .95, y0 + 2.05]) {
      const [px, py] = P(x - .25, yy);
      ell(c, px, py - 4, 5.5, 4, '#c9785a', OUT, .8);
      ell(c, px, py - 10, 6.5, 6.5, '#72b852', 'rgba(40,70,30,.7)', .8);
      ell(c, px - 2, py - 12, 1.8, 1.8, '#f78da7');
    }
  }
  // ---- my home, in the front yard just south of the shop (world coords; drawn in WORLD mode) ----
  // 10 distinct looks, one per HOME_LV tier in soft cozy storybook pastels
  const HOME_EXT = [null,
    { w: 2, d: 2, h: 52, col: '#fdf8ee', roof: '#d47862' },
    { w: 3, d: 2, h: 60, col: '#fdf2f4', roof: '#cb7a8b' },
    { w: 3, d: 3, h: 66, col: '#f4f8fe', roof: '#688eb2', chim: 1 },
    { w: 3, d: 3, h: 104, col: '#fdf7eb', roof: '#d47862', chim: 1, fence: 1, two: 1 },
    { w: 4, d: 3, h: 112, col: '#fdf5fb', roof: '#967ec7', chim: 1, fence: 1, two: 1, balc: 1 },
    { w: 4, d: 4, h: 150, col: '#fdf8ee', roof: '#d47862', chim: 1, fence: 1, three: 1, balc: 1 },
    { w: 5, d: 4, h: 158, col: '#f0f7fe', roof: '#5b85be', chim: 1, fence: 1, three: 1, balc: 1 },
    { w: 5, d: 5, h: 166, col: '#f7f2fc', roof: '#7ba689', chim: 1, fence: 1, three: 1, balc: 1 },
    { w: 6, d: 5, h: 178, col: '#fdf6e4', roof: '#d9aa55', chim: 1, fence: 1, three: 1, balc: 1 },
    { w: 6, d: 6, h: 190, col: '#fef1f6', roof: '#cb7a8b', chim: 1, fence: 1, three: 1, balc: 1 }];
  // now sits across the road (same walkable strip as the sidewalk/park), so the old
  // 1-tile-wall-buffer isn't needed any more -- see World.walk()'s simplified rule.
  // The house grows tall with level (up to 190 wall + roof), and a tall building visibly hides
  // whatever sits behind it on screen -- from home Lv5 up it used to paint right over the farm's
  // south-west corner. So its y is pushed south, the minimum whole number of tiles that leaves its
  // projected silhouette (walls + roof + sign + fence) clear of the farm's (plus a 0.7-tile
  // margin). Cached per (W,H,lv) since walk()/hit-tests call HOME_POS constantly.
  const _homeY = new Map();
  const _sil = (pts) => { pts = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]); const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]); const lo = []; for (const p of pts) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); } const up = []; for (const p of pts.slice().reverse()) { while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); } up.pop(); lo.pop(); return lo.concat(up); };
  const _sep = (A, B) => { for (const Pl of [A, B]) for (let i = 0; i < Pl.length; i++) { const a = Pl[i], b = Pl[(i + 1) % Pl.length], ax = [-(b[1] - a[1]), b[0] - a[0]]; const rng = q => { let mn = 1e9, mx = -1e9; for (const p of q) { const d = p[0] * ax[0] + p[1] * ax[1]; if (d < mn) mn = d; if (d > mx) mx = d; } return [mn, mx]; }; const [a0, a1] = rng(A), [b0, b1] = rng(B); if (Math.min(a1, b1) - Math.max(a0, b0) <= 0) return true; } return false; };
  const _pr = (x, y, z) => [ISO.sx(x, y), ISO.sy(x, y) - (z || 0)];
  const _box = (x, y, w, d, h) => { const o = []; for (const z of [0, h]) for (const [px, py] of [[x, y], [x + w, y], [x + w, y + d], [x, y + d]]) o.push(_pr(px, py, z)); return o; };
  function homeSilhouette(x, y, e) { const rh = 26 + e.w * 4; return _sil([..._box(x, y, e.w, e.d, e.h), _pr(x + e.w / 2, y, e.h + rh), _pr(x + e.w / 2, y + e.d, e.h + rh), _pr(x + e.w / 2, y + e.d / 2, e.h + rh + 34), _pr(x - .5, y - .4, 14), _pr(x - .5, y + e.d + .6, 14)]); }
  function homeY(W, H, lv) {
    const key = W + '|' + H + '|' + lv + '|' + (typeof FARM_POS === 'function' ? FARM_POS(W, H).w : 0); let y = _homeY.get(key); if (y != null) return y;
    y = H;
    if (typeof FARM_POS === 'function') {
      const fp = FARM_POS(W, H), m = .7, fh = _sil(_box(fp.x - m, fp.y - m, fp.w + 2 * m, fp.d + 2 * m, 15)), e = HOME_EXT[lv || 1];
      for (; y < H + 40; y++) if (_sep(homeSilhouette(W + 10.5, y, e), fh)) break;
    }
    _homeY.set(key, y); return y;
  }
  // v2026-10-08: 내 집(home) PNG 원화 스프라이트 (spr/home.png)
  const homeUrl = (typeof assetUrl === 'function') ? assetUrl('spr/home.png') : 'spr/home.png';
  const HOME_IMG = (typeof ASSET_CACHE !== 'undefined') ? ASSET_CACHE.load(homeUrl) : ((typeof Image !== 'undefined') ? new Image() : null);
  if (HOME_IMG) {
    HOME_IMG.crossOrigin = 'anonymous';
    const onHomeReady = () => {
      if (typeof TOWNUI !== 'undefined' && TOWNUI.clearThumbCache) TOWNUI.clearThumbCache();
      if (typeof render === 'function') render();
      if (typeof World !== 'undefined' && World.render) World.render();
    };
    if (HOME_IMG.complete && HOME_IMG.naturalWidth) {
      onHomeReady();
    } else {
      HOME_IMG.addEventListener('load', onHomeReady);
      if (!HOME_IMG.src) HOME_IMG.src = homeUrl;
    }
  }

  // PET TOWN: my home stands on its own 10x8 lot (S.lay.home)
  const HOME_POS = (W, H, lv) => {
    const L = LAY('home');
    return L ? { x: L.x + 3, y: L.y + 1.5, w: 4, d: 4, h: 160 } : { x: LAY_FAR, y: LAY_FAR, w: 4, d: 4, h: 160 };
  };
  const HOME_DOOR = (W, H, lv) => {
    const L = LAY('home');
    return L ? { x: L.x + 5, y: L.y + 6.1 } : { x: LAY_FAR, y: LAY_FAR };
  };

  // 마당 흰색 목재 울타리 및 대문 기둥 렌더링 헬퍼
  function drawYardFenceSeg(c, xA, yA, xB, yB) {
    const dist = Math.hypot(xB - xA, yB - yA);
    const n = Math.max(2, Math.round(dist / 0.42));
    const railH1 = 5, railH2 = 11, picketH = 14;
    // 수평 레일 2줄
    for (const rz of [railH1, railH2]) {
      const p0 = [ISO.wx(xA, yA), ISO.wy(xA, yA) - rz];
      const p1 = [ISO.wx(xB, yB), ISO.wy(xB, yB) - rz];
      c.beginPath(); c.moveTo(p0[0], p0[1]); c.lineTo(p1[0], p1[1]);
      c.strokeStyle = '#ffffff'; c.lineWidth = 2.2; c.stroke();
      c.strokeStyle = 'rgba(120,105,90,.45)'; c.lineWidth = 0.7; c.stroke();
    }
    // 수직 피켓 살 (끝이 뾰족한 클래식 화이트 피켓)
    for (let i = 0; i <= n; i++) {
      const u = i / n;
      const px = xA + (xB - xA) * u, py = yA + (yB - yA) * u;
      const pt = [ISO.wx(px, py), ISO.wy(px, py)];
      ell(c, pt[0], pt[1] + 0.5, 3, 1.5, 'rgba(40,60,20,.18)');
      c.beginPath();
      c.moveTo(pt[0] - 1.5, pt[1]);
      c.lineTo(pt[0] - 1.5, pt[1] - (picketH - 2.5));
      c.lineTo(pt[0], pt[1] - picketH);
      c.lineTo(pt[0] + 1.5, pt[1] - (picketH - 2.5));
      c.lineTo(pt[0] + 1.5, pt[1]);
      c.closePath();
      c.fillStyle = '#ffffff'; c.fill();
      c.strokeStyle = 'rgba(110,95,80,.4)'; c.lineWidth = 0.6; c.stroke();
    }
  }

  function drawYardPost(c, px, py, isGate) {
    const pt = [ISO.wx(px, py), ISO.wy(px, py)];
    const h = isGate ? 22 : 18;
    const w = isGate ? 5 : 4;
    ell(c, pt[0], pt[1] + 1, w * 1.3, w * 0.7, 'rgba(30,45,15,.22)');
    rrect(c, pt[0] - w / 2, pt[1] - h, w, h, 1.2);
    c.fillStyle = isGate ? '#fffdf7' : '#f8f4ec'; c.fill();
    c.strokeStyle = '#7a6854'; c.lineWidth = 0.8; c.stroke();
    rrect(c, pt[0] - (w + 2) / 2, pt[1] - h - 3, w + 2, 3.5, 1);
    c.fillStyle = isGate ? '#d4a259' : '#eae3d5'; c.fill();
    c.strokeStyle = '#6a5540'; c.lineWidth = 0.7; c.stroke();
    if (isGate) {
      ell(c, pt[0], pt[1] - h - 6, 2.5, 2.8, '#ffe58f', '#b88230', 0.8);
    }
  }

  function myHome(c, W, H, lv, name, part) {
    const L = LAY('home');
    if (!L || L.x >= 90000) return;
    const { x, y, w, d, h } = HOME_POS(W, H, lv);
    const cx = x + w / 2, cy = y + d / 2;
    const x0 = L.x + 0.6, x1 = L.x + 9.4;
    const y0 = L.y + 0.6, y1 = L.y + 7.4;
    const drawAll = !part || part === 'all';

    // ---- PART 1: 마당 잔디, 디딤돌 길, 뒷마당 울타리 ----
    if (drawAll || part === 'ground') {
      // 1. 마당 잔디 (기존의 삼각형 버그 초록 영역을 지우고, 부지 전체를 감싸는 단정하고 화사한 정원 잔디밭)
      poly(c, [
        [ISO.wx(x0, y0), ISO.wy(x0, y0)],
        [ISO.wx(x1, y0), ISO.wy(x1, y0)],
        [ISO.wx(x1, y1), ISO.wy(x1, y1)],
        [ISO.wx(x0, y1), ISO.wy(x0, y1)]
      ], '#90cb5c', '#72ab40', 1.2);

      // 2. 집 밑면 부드러운 음영 (지면에 안정감 있게 안착)
      poly(c, [
        [ISO.wx(cx - 2.3, cy - 2.3), ISO.wy(cx - 2.3, cy - 2.3)],
        [ISO.wx(cx + 2.3, cy - 2.3), ISO.wy(cx + 2.3, cy - 2.3)],
        [ISO.wx(cx + 2.3, cy + 2.3), ISO.wy(cx + 2.3, cy + 2.3)],
        [ISO.wx(cx - 2.3, cy + 2.3), ISO.wy(cx - 2.3, cy + 2.3)]
      ], 'rgba(35,60,18,.20)');

      // 3. 집 앞마당 남쪽 대문으로 이어지는 디딤돌 길
      for (let sy0 = y + d - 0.2; sy0 <= y1 + 0.1; sy0 += 0.42) {
        const p = [ISO.wx(cx, sy0), ISO.wy(cx, sy0)];
        ell(c, p[0], p[1] + 1, 8.5, 4.2, 'rgba(40,60,20,.18)');
        ell(c, p[0], p[1], 8.5, 4.2, '#e4dbc9', '#9a8a72', 0.8);
        ell(c, p[0] - 2, p[1] - 1, 2.5, 1.3, '#f2ebe0');
      }

      // 4. 마당 구석 꽃 장식
      const flowerSpots = [
        [x0 + 0.8, y0 + 1.2, '#ffffff'], [x0 + 1.4, y0 + 0.8, '#ff9ec0'],
        [x1 - 1.2, y0 + 0.8, '#ffd166'], [x1 - 0.8, y0 + 1.5, '#ffffff'],
        [x0 + 1.0, y1 - 0.8, '#ffd166'], [x1 - 1.0, y1 - 0.8, '#ff9ec0']
      ];
      for (const [fx, fy, fcol] of flowerSpots) {
        const fp = [ISO.wx(fx, fy), ISO.wy(fx, fy)];
        ell(c, fp[0], fp[1], 2.2, 2.2, fcol);
        ell(c, fp[0] + 2, fp[1] - 1, 1.8, 1.8, '#fff');
      }

      // 5. 뒷마당 울타리 (북동쪽, 북서쪽)
      drawYardFenceSeg(c, x0, y0, x1, y0);
      drawYardFenceSeg(c, x0, y0, x0, y1);
      drawYardPost(c, x0, y0, false);
      drawYardPost(c, x1, y0, false);
      drawYardPost(c, x0, y1, false);
    }

    // ---- PART 2: 내 집 본체 스프라이트 및 밀착 문패 배너 ----
    if (drawAll || part === 'building') {
      const homeReady = HOME_IMG && HOME_IMG.complete && HOME_IMG.naturalWidth > 0;
      const q = [ISO.wx(cx, cy), ISO.wy(cx, cy)];
      if (homeReady) {
        const dw = 336;
        const dh = dw * (HOME_IMG.naturalHeight || 1024) / (HOME_IMG.naturalWidth || 1536);
        const anchorY = dh * 0.6494; // spr/home.png 밑면 중심 Y (665/1024)
        c.drawImage(HOME_IMG, q[0] - dw / 2, q[1] - anchorY, dw, dh);
      } else {
        const e = (HOME_EXT && HOME_EXT[lv || 1]) || { w, d, h, col: '#fdf8ee', roof: '#d47862' };
        box(c, x, y, w, d, h, e.col);
      }

      // 지붕 위에 밀착된 문패 배너 (집 본체 바로 위 짧은 깃대)
      const bannerY = q[1] - 140;
      c.beginPath();
      c.moveTo(q[0], q[1] - 124);
      c.lineTo(q[0], bannerY + 7);
      c.lineWidth = 1.8;
      c.strokeStyle = '#8a5a33';
      c.stroke();

      const nm = (name || 'HOME').slice(0, 10);
      c.font = 'bold 9px sans-serif';
      const tw = c.measureText('🏠 ' + nm).width + 12;
      rrect(c, q[0] - tw / 2, bannerY - 8, tw, 15, 7);
      c.fillStyle = 'rgba(255, 255, 255, 0.95)';
      c.fill();
      c.strokeStyle = '#ff7ab8';
      c.lineWidth = 1.2;
      c.stroke();
      c.fillStyle = '#b33c6a';
      c.textAlign = 'center';
      c.fillText('🏠 ' + nm, q[0], bannerY + 2.5);
      c.textAlign = 'start';
    }

    // ---- PART 3: 앞마당 울타리 및 남쪽 대문 ----
    if (drawAll || part === 'frontFence') {
      // 6. 남동쪽 울타리
      drawYardFenceSeg(c, x1, y0, x1, y1);
      drawYardPost(c, x1, y1, false);

      // 7. 남서쪽 앞마당 울타리 + 남쪽 출입 대문
      const gateW = 0.7; // 대문 폭
      drawYardFenceSeg(c, x0, y1, cx - gateW, y1);
      drawYardFenceSeg(c, cx + gateW, y1, x1, y1);
      drawYardPost(c, cx - gateW, y1, true); // 왼쪽 대문 기둥 (황동 램프)
      drawYardPost(c, cx + gateW, y1, true); // 오른쪽 대문 기둥 (황동 램프)
    }
  }
  function outside(c, W, H, t, names) { WORLD = true; try { outsideW(c, W, H, t, names); } finally { WORLD = false; } }
  // called per-frame from World's depth-sorted draw list
  function homeGround(c, W, H, lv, name) { WORLD = true; try { myHome(c, W, H, lv, name, 'ground'); } finally { WORLD = false; } }
  function homeFront(c, W, H, lv, name) { WORLD = true; try { myHome(c, W, H, lv, name, 'building'); } finally { WORLD = false; } }
  function homeFenceFront(c, W, H, lv, name) { WORLD = true; try { myHome(c, W, H, lv, name, 'frontFence'); } finally { WORLD = false; } }
  function outsideW(c, W, H, t, names) {
    const g = 8, gs = 26; // gs: how far the ground/road run south -- the home can now sit further south than H+8 (see HOME_POS)
    poly(c, [P(-g, -22), P(W + 27, -22), P(W + 27, H + gs), P(-g, H + gs)], '#a8d88e', null);
    // grass texture (tone patches, tufts, a few flowers) -- kept clear of the shop's surroundings and the street
    groundTex(c, -g, -22, W + 27, H + gs, (x, y) => (x > -2 && x < W + 1.1 && y > -2 && y < H + 1.5) || (x > W + .9 && x < W + 8.7), 1);
    // soft shadow rim round the shop's footprint so it sits IN the ground rather than on it
    for (const [e, a] of [[.45, .08], [.22, .1]]) poly(c, [P(-e * .3, -e * .3), P(W + e, -e * .3), P(W + e, H + e), P(-e * .3, H + e)], `rgba(40,70,20,${a})`, null);
    // street + sidewalks on both sides (the far one reaches the home/stall/farm row)
    road(c, W, -22, H + gs);
    // crosswalk near the entrance
    const ey0 = H - 2.5, ey1 = H - 0.5;
    for (let i = 0; i < 6; i++) poly(c, [P(W + 3.6, ey0 + .1 + i * .3), P(W + 6, ey0 + .1 + i * .3), P(W + 6, ey0 + .25 + i * .3), P(W + 3.6, ey0 + .25 + i * .3)], '#f4f4f4');
    // crosswalks in front of the seed & tool shops
    for (const cy of []) for (let i = 0; i < 5; i++) poly(c, [P(W + 3.6, cy - .75 + i * .3), P(W + 6, cy - .75 + i * .3), P(W + 6, cy - .6 + i * .3), P(W + 3.6, cy - .6 + i * .3)], '#f4f4f4');
    // entrance walkway: perfectly matching doorway width & position
    poly(c, [P(W, ey0), P(W + 1.1, ey0), P(W + 1.1, ey1), P(W, ey1)], '#e8ded0', 'rgba(100,75,45,.35)', 1.2);
    line2(c, P(W, (ey0 + ey1) * .5), P(W + 1.1, (ey0 + ey1) * .5), 'rgba(80,55,35,.26)', 1.1);
    line2(c, P(W, (ey0 + ey1) * .5 + .02), P(W + 1.1, (ey0 + ey1) * .5 + .02), 'rgba(255,255,255,.3)', .8);
    // delivery door mat: original position (y = 1.5 .. 2.5)
    poly(c, [P(W, 1.5), P(W + 1.1, 1.5), P(W + 1.1, 2.5), P(W, 2.5)], '#e8d9c0', null);
    // café paths ("길을 만들어줘"): baked here, before the shop's walls, so the shop's back wall
    // correctly hides the part of the yard path behind it (only the door gap shows through).
    // (1) shop back door (tiles W-2, W-1) straight up to the café's south edge (y=-5);
    // (2) the café gate: the same ~1-tile gap between plot and sidewalk the shop's own entrance mat
    //     uses, paved on the 2 rows just inside the plot's south edge (rows -7, -6 -- table-free).
    const stone = (x0, y0, x1, y1) => { for (let i = 0; i < Math.round(x1 - x0); i++) for (let j = 0; j < Math.round(y1 - y0); j++) poly(c, [P(x0 + i, y0 + j), P(x0 + i + 1, y0 + j), P(x0 + i + 1, y0 + j + 1), P(x0 + i, y0 + j + 1)], (i + j) % 2 ? '#d9ceb8' : '#cfc2a9', 'rgba(110,90,60,.28)', .8); };
    // PET TOWN: no fixed café paths any more (the café is built wherever the player wants)
    // the house itself is no longer painted here -- it moved to a per-frame dynamic draw
    // (World.js's depth-sorted list, via homeFront below) so the player can correctly walk
    // in front of OR behind its tall roof instead of always rendering under it.
    if (!(names && names.homeLv)) flowerBed(c, W + 6.5, H - 4, 2);
  }
  // drawn separately, AFTER the shop's own walls, so its sign post never renders underneath
  // the wall silhouette (walls are always painted last in buildBg, covering anything near
  // the shop's edge that was drawn earlier as part of the exterior background)
  function stallLive(c, name) { WORLD = true; try { marketStall(c, 0, STORE_Y.seed, name); } finally { WORLD = false; } }
  function dropZoneFront(c, W, H, label, signOnly) { WORLD = true; try { dropZone(c, W, H, label, signOnly); } finally { WORLD = false; } }
  // ---- shared ground art (baked bg canvas AND the per-frame outer village use the same code, so they meet seamlessly) ----
  // per-tile hash -> the same tile always gets the same tufts/flowers, whichever canvas draws it
  const th = (x, y, k) => { // murmur3-style finaliser applied twice, so neighbouring tiles don't form diagonal streaks
    let n = Math.imul(x | 0, 0x27d4eb2d) ^ Math.imul(y | 0, 0x165667b1) ^ Math.imul(k | 0, 0x9e3779b1);
    for (let i = 0; i < 2; i++) { n ^= n >>> 16; n = Math.imul(n, 0x85ebca6b); n ^= n >>> 13; n = Math.imul(n, 0xc2b2ae35); n ^= n >>> 16; }
    return (n >>> 0) / 4294967296; };
  // grass: soft tone patches + small tufts + the odd tiny flower. lod 0 = patches only (far zoom)
  
  // ============ 잔디 다발 원화 PNG (15종) ============
  const GRASS_IMGS = [];
  (function loadGrassImages() {
    for (let i = 1; i <= 15; i++) {
      const url = assetUrl('spr/grass/grass' + i + '.png');
      const im = (typeof ASSET_CACHE !== 'undefined') ? ASSET_CACHE.load(url) : new Image();
      im.crossOrigin = 'anonymous';
      im.onload = () => { if (typeof window !== 'undefined' && typeof window.__onGroundAssetLoad === 'function') window.__onGroundAssetLoad(); };
      if (!im.src) im.src = url;
      GRASS_IMGS.push(im);
    }
  })();

  // ============ 돌멩이 원화 PNG (15종: stone_1~15.png) ============
  const STONE_IMGS = [];
  (function loadStoneImages() {
    for (let i = 1; i <= 15; i++) {
      const url = assetUrl('spr/grass/stone_' + i + '.png');
      const im = (typeof ASSET_CACHE !== 'undefined') ? ASSET_CACHE.load(url) : new Image();
      im.crossOrigin = 'anonymous';
      im.onload = () => { if (typeof window !== 'undefined' && typeof window.__onGroundAssetLoad === 'function') window.__onGroundAssetLoad(); };
      if (!im.src) im.src = url;
      STONE_IMGS.push(im);
    }
  })();

  function groundTex(c, x0, y0, x1, y1, skip, lod) {
    const Q = (x, y) => [ISO.wx(x, y), ISO.wy(x, y)];
    c.save(); c.lineCap = 'round';
    // 1. 잔디 톤 패치 (Path2D) + 꽃 배열
    const dark = new Path2D(), lite = new Path2D(), fl = [];
    // 2. 잔디 다발 & 돌멩이 sprite 배치 목록 (매번 그리지 않고 drawImage로)
    const grassList = [];
    const stoneList = [];
    for (let y = Math.floor(y0); y < y1; y++) for (let x = Math.floor(x0); x < x1; x++) {
      if (skip && skip(x + .5, y + .5)) continue;
      if (typeof TOWN !== 'undefined') {
        const curS = typeof S !== 'undefined' ? S : null;
        if ((TOWN.roadSet && TOWN.roadSet(curS).has(x + ',' + y)) || (TOWN.isRoadTile && TOWN.isRoadTile(curS, x, y))) continue;
      }
      const r = th(x, y, 1);
      // 잔디 톤 패치
      if (r < .13) { const p = Q(x + th(x, y, 2), y + th(x, y, 3)), rx = 22 + th(x, y, 4) * 26, pa = r < .05 ? dark : lite; pa.moveTo(p[0] + rx, p[1]); pa.ellipse(p[0], p[1], rx, rx * .5, 0, 0, Math.PI * 2); }
      // 잔디 다발 (lod=0일 때도 그리되, 확률 낮춤)
      const dSpr = lod ? .010 : .005;
      if (th(x, y, 20) < dSpr) {
        const p = Q(x + th(x, y, 21) * .9 + .05, y + th(x, y, 22) * .9 + .05);
        const v = Math.floor(th(x, y, 23) * 15);
        const img0 = GRASS_IMGS[v];
        const baseSz = (img0 && img0.naturalWidth) || 512;
        const targetW = 34 + th(x, y, 24) * 26;      // 화면에 나올 목표 크기: 34~60px
        const scale = targetW / baseSz;
        const mir = th(x, y, 25) < .5 ? -1 : 1;
        grassList.push({ x: p[0], y: p[1], v, scale, mir });
      }
      // 돌멩이 (grass 파일처럼 같은 빈도와 같은 크기로 맵에 설치)
      if (th(x, y, 30) < dSpr) {
        const p = Q(x + th(x, y, 31) * .9 + .05, y + th(x, y, 32) * .9 + .05);
        const v = Math.floor(th(x, y, 33) * 15);
        const img0 = STONE_IMGS[v];
        const baseSz = (img0 && img0.naturalWidth) || 512;
        const targetW = 34 + th(x, y, 34) * 26;      // 화면에 나올 목표 크기: 34~60px (grass와 동일)
        const scale = targetW / baseSz;
        const mir = th(x, y, 35) < .5 ? -1 : 1;
        stoneList.push({ x: p[0], y: p[1], v, scale, mir });
      }
      // 꽃 (lod=1일 때만)
      if (lod && th(x, y, 13) < .03) fl.push([Q(x + .5, y + .5), ['#ffffff', '#ffe27a', '#f9a8c9', '#cdb8f6'][(th(x, y, 14) * 4) | 0]]);
    }
    // 톤 패치 렌더
    c.fillStyle = 'rgba(70,130,45,.09)'; c.fill(dark);
    c.fillStyle = 'rgba(220,242,160,.22)'; c.fill(lite);
    // 돌멩이 렌더 (원화 PNG 15종: grass와 동일 크기 & 동일 앵커)
    for (const st of stoneList) {
      const img = STONE_IMGS[st.v];
      if (!img || !img.complete || !img.naturalWidth) continue;
      const w = img.width * st.scale;
      const h = img.height * st.scale;
      c.save();
      c.translate(st.x, st.y);
      c.scale(st.mir, 1);
      c.drawImage(img, -w / 2, -h + 2, w, h);
      c.restore();
    }
    // 잔디 다발 렌더 (원화 PNG 15종)
    for (const gs of grassList) {
      const img = GRASS_IMGS[gs.v];
      if (!img || !img.complete || !img.naturalWidth) continue;
      const w = img.width * gs.scale;
      const h = img.height * gs.scale;
      c.save();
      c.translate(gs.x, gs.y);
      c.scale(gs.mir, 1);
      c.drawImage(img, -w / 2, -h + 2, w, h);
      c.restore();
    }
    // 꽃 렌더
    if (lod) {
      for (const [p, col] of fl) { ell(c, p[0] + 1, p[1] + 1, 3.4, 1.4, 'rgba(40,80,20,.18)'); c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(p[0], p[1] - 4); c.lineWidth = 1; c.strokeStyle = '#5f9a3e'; c.stroke(); for (let k = 0; k < 5; k++) { const a = k * 1.2566; ell(c, p[0] + Math.cos(a) * 2.8, p[1] - 5 + Math.sin(a) * 1.9, 2.1, 1.7, col, 'rgba(120,90,60,.35)', .5); } ell(c, p[0], p[1] - 5, 1.5, 1.3, '#f0a93a'); }
    }
    c.restore();
  }
  // the main road: a warm European cobblestone promenade with sidewalks, granite curbs, and decorative street props (matching Image 2)
  function road(c, W, y0, y1) {
    const Q = (x, y) => [ISO.wx(x, y), ISO.wy(x, y)], band = (xa, xb, col) => poly(c, [Q(xa, y0), Q(xb, y0), Q(xb, y1), Q(xa, y1)], col, null);
    const line = (xa, ya, xb, yb, col, lw) => { const a = Q(xa, ya), b = Q(xb, yb); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.strokeStyle = col || 'rgba(110,85,60,.28)'; c.lineWidth = lw || 1; c.stroke(); };
    c.save();

    // 1. Sidewalks (warm soft limestone slabs with subtle bevels)
    band(W + 1.1, W + 3.4, '#e8ded0');
    band(W + 6.2, W + 8.5, '#e8ded0');
    for (let y = Math.floor(y0); y < y1; y++) {
      for (const [x0, x1] of [[W + 1.1, W + 3.4], [W + 6.2, W + 8.5]]) {
        const mid = (x0 + x1) / 2;
        line(x0, y, x1, y, 'rgba(80,55,35,.28)', 1.1);
        line(x0, y + .02, x1, y + .02, 'rgba(255,255,255,.3)', .8);
        const yOff = (y % 2) * .5;
        line(mid, y + yOff, mid, y + yOff + .5, 'rgba(80,55,35,.24)', 1);
        const colVar = (y * 7 + (x0 > W + 4 ? 3 : 0)) % 4;
        const tint = ['rgba(255,255,255,.1)', 'rgba(0,0,0,.03)', 'rgba(190,130,70,.06)', 'rgba(255,240,210,.08)'][colVar];
        poly(c, [Q(x0 + .04, y + .04), Q(x1 - .04, y + .04), Q(x1 - .04, y + .96), Q(x0 + .04, y + .96)], tint, null);
      }
    }

    // 2. Beveled Granite Curbs
    band(W + 3.25, W + 3.4, '#dfd6c8');
    band(W + 6.2, W + 6.35, '#dfd6c8');
    line(W + 3.26, y0, W + 3.26, y1, 'rgba(255,255,255,.6)', 1.2);
    line(W + 6.34, y0, W + 6.34, y1, 'rgba(255,255,255,.5)', 1.2);
    for (let y = Math.floor(y0 * 1.5) / 1.5; y < y1; y += .66) {
      line(W + 3.25, y, W + 3.4, y, 'rgba(60,45,30,.4)', 1.1);
      line(W + 6.2, y, W + 6.35, y, 'rgba(60,45,30,.4)', 1.1);
    }
    band(W + 3.4, W + 3.6, 'rgba(30,25,20,.18)');
    band(W + 6.0, W + 6.2, 'rgba(30,25,20,.12)');

    // 3. Roadway: Warm Cozy Cobblestone Sett Paving (matching Image 2)
    band(W + 3.4, W + 6.2, '#d6cbb8');
    const stoneW = .38, stoneH = .30;
    for (let y = Math.floor(y0); y < y1; y += stoneH) {
      const rowIdx = Math.round(y / stoneH);
      const xShift = (rowIdx % 2) * (stoneW * .5);
      for (let x = W + 3.42 + xShift; x < W + 6.18; x += stoneW) {
        const x2 = Math.min(W + 6.18, x + stoneW - .05);
        const y2 = Math.min(y1, y + stoneH - .04);
        if (x2 - x < .1) continue;
        const hash = Math.abs(Math.sin(x * 17.13 + y * 43.71) * 43758.5453) % 1;
        // Warm vintage limestone & sandstone color palette
        const col = ['#e8dfd0', '#dfd5c4', '#ede4d6', '#d6ccba', '#e2d8c7', '#cfc4b2'][(Math.floor(hash * 12)) % 6];
        const pts = [Q(x, y), Q(x2, y), Q(x2, y2), Q(x, y2)];
        poly(c, pts, col, 'rgba(65,45,30,.28)', .7);
        // Rounded stone specular top highlight
        line(x + .03, y + .03, x2 - .03, y + .03, 'rgba(255,255,255,.45)', .8);
        line(x + .03, y + .03, x + .03, y2 - .03, 'rgba(255,255,255,.3)', .8);
      }
    }

    // Road outer boundaries
    line(W + 3.4, y0, W + 3.4, y1, 'rgba(65,45,30,.55)', 1.4);
    line(W + 6.2, y0, W + 6.2, y1, 'rgba(65,45,30,.55)', 1.4);

    c.restore();
  }
  function frontWallSeg(c, x1, y1, x2, y2, fh, col) {
    if (Math.hypot(x2 - x1, y2 - y1) < .05) return;
    c.save();
    // Glass pane with balanced transparency (User Request: 0.41 opacity, clean light reflections)
    poly(c, [P(x1, y1, fh), P(x2, y2, fh), P(x2, y2, 0), P(x1, y1, 0)], col || 'rgba(160, 215, 250, .41)', 'rgba(80, 150, 205, .45)', 1.1);
    // Refined top glass handrail & baseboard
    line2(c, P(x1, y1, fh), P(x2, y2, fh), 'rgba(255,255,255,.85)', 2.0);
    line2(c, P(x1, y1, fh - 1.2), P(x2, y2, fh - 1.2), 'rgba(120,185,235,.45)', 0.9);
    line2(c, P(x1, y1, 2.5), P(x2, y2, 2.5), 'rgba(60,110,160,.45)', 1.6);
    // Soft diagonal glass reflections across pane
    const len = Math.hypot(x2 - x1, y2 - y1);
    for (let s = .2; s < len; s += 1.8) {
      const t0 = Math.min(1, s / len), t1 = Math.min(1, (s + .7) / len);
      const ga = P(x1 + (x2 - x1) * t0, y1 + (y2 - y1) * t0, fh * .2);
      const gb = P(x1 + (x2 - x1) * t1, y1 + (y2 - y1) * t1, fh * .85);
      line2(c, ga, gb, 'rgba(255,255,255,.32)', 1.4);
    }
    c.restore();
  }

  function frontWallLot(c, x0, y0, w, d, fh, doorS, doorE, col, worldCoords) {
    const prevW = WORLD; WORLD = !!worldCoords;
    const normGaps = g => !g ? [] : (typeof g[0] === 'number' ? [g] : g.slice()).sort((a, b) => a[0] - b[0]);
    try {
      // South wall along y = y0 + d (x from x0 to x0 + w)
      const gapsS = normGaps(doorS);
      if (gapsS.length) {
        let cur = x0;
        for (const [d0, d1] of gapsS) {
          if (d0 > cur) frontWallSeg(c, cur, y0 + d, d0, y0 + d, fh, col);
          cur = Math.max(cur, d1);
        }
        if (cur < x0 + w) frontWallSeg(c, cur, y0 + d, x0 + w, y0 + d, fh, col);
      } else {
        frontWallSeg(c, x0, y0 + d, x0 + w, y0 + d, fh, col);
      }
      // East wall along x = x0 + w (y from y0 to y0 + d)
      const gapsE = normGaps(doorE);
      if (gapsE.length) {
        let cur = y0;
        for (const [e0, e1] of gapsE) {
          if (e0 > cur) frontWallSeg(c, x0 + w, cur, x0 + w, e0, fh, col);
          cur = Math.max(cur, e1);
        }
        if (cur < y0 + d) frontWallSeg(c, x0 + w, cur, x0 + w, y0 + d, fh, col);
      } else {
        frontWallSeg(c, x0 + w, y0, x0 + w, y0 + d, fh, col);
      }
    } finally {
      WORLD = prevW;
    }
  }

  function frontWalls(c, W, H, wallKey) {
    const [VW, VH] = VIEW.dims(), { a, b } = entranceView(W, H);
    // User request: delivery doorway strictly in front of the road/mat (y = 1.5 .. 2.5, 1-tile wide)
    const da = VIEW.p(W, 1.5), db = VIEW.p(W, 2.5);
    const gapsX = [], gapsY = [];
    // Main entrance gap (User Request: door and road matching width and position)
    if (Math.abs(a[1] - VH) < .01 && Math.abs(b[1] - VH) < .01) gapsX.push([Math.min(a[0], b[0]), Math.max(a[0], b[0])]);
    if (Math.abs(a[0] - VW) < .01 && Math.abs(b[0] - VW) < .01) gapsY.push([Math.min(a[1], b[1]), Math.max(a[1], b[1])]);
    // Delivery doorway: strictly width of path, no ±0.5 widening that tore open adjacent wall
    if (Math.abs(da[1] - VH) < .01 && Math.abs(db[1] - VH) < .01) gapsX.push([Math.min(da[0], db[0]), Math.max(da[0], db[0])]);
    if (Math.abs(da[0] - VW) < .01 && Math.abs(db[0] - VW) < .01) gapsY.push([Math.min(da[1], db[1]), Math.max(da[1], db[1])]);
    const FH = 40; // 1/3 of WH=120
    frontWallLot(c, 0, 0, VW, VH, FH, gapsX, gapsY, 'rgba(160, 215, 250, .41)');
  }
  function hedges(c, W, H, t) { // front edges: 1/3-height (FH=40) ~90% transparent South & East walls + always-open glass door
    frontWalls(c, W, H, t);
  }
  return { stallLive, fp: it => { const d = DEF[it.k] || { w: 1, d: 1 }; return it.f ? Object.assign({}, d, { w: d.d, d: d.w }) : d; }, LIGHT, HOME_POS, HOME_DOOR, HOME_EXT, inFront, STORE_Y, DZONE, penBack, penFront, frontWallLot, frontWalls, mess, habitat, tankFront, cageFront, item, DEF, floor, walls, outside, homeFront, homeGround, homeFenceFront, hedges, box, P, FLOORS, WALLS, dropZone: dropZoneFront, groundTex, road, GRASS_IMGS, STONE_IMGS, HOME_IMG, getHomeImg: () => HOME_IMG };
})();
