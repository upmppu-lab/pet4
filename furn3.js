// ================= v9.88: more furniture for "our home" (y_*) =================
(() => {
  const { ell, rrect, shade, OUT } = ART, box = FURN.box, P = FURN.P;
  const poly = (c, pts, fill, st, lw) => { c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); if (fill) { c.fillStyle = fill; c.fill(); } if (st) { c.lineWidth = lw || 1.1; c.strokeStyle = st; c.stroke(); } };
  const line = (c, a, b, col, w) => { c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.strokeStyle = col; c.lineWidth = w || 1; c.stroke(); };
  const leg = (c, x, y, h, col) => box(c, x, y, .07, .07, h, col || '#b98552');
  const emo = (c, e, x, y, s) => { c.font = (s || 12) + 'px sans-serif'; c.textAlign = 'center'; c.fillText(e, x, y); c.textAlign = 'start'; };
  // a flat panel on the front (+y) face of a box: x0..x1 at depth y, z from z0 to z1
  const faceY = (c, x0, x1, y, z0, z1, fill, st) => poly(c, [P(x0, y, z1), P(x1, y, z1), P(x1, y, z0), P(x0, y, z0)], fill, st === undefined ? OUT : st, 1);
  const faceX = (c, x, y0, y1, z0, z1, fill, st) => poly(c, [P(x, y0, z1), P(x, y1, z1), P(x, y1, z0), P(x, y0, z0)], fill, st === undefined ? OUT : st, 1);
  const pot = (c, col) => { box(c, .3, .3, .4, .4, 14, col || '#e8a07a'); box(c, .27, .27, .46, .46, 3, shade(col || '#e8a07a', .1), 14); };
  Object.assign(FURN.DEF, {
    y_bunk: { w: 2, d: 1 }, y_nightstand: { w: 1, d: 1 }, y_mirror: { w: 1, d: 1 }, y_closet: { w: 2, d: 1 }, y_crib: { w: 1, d: 1 }, y_desk2: { w: 2, d: 1 },
    y_lsofa: { w: 2, d: 2 }, y_coffee: { w: 1, d: 1 }, y_game: { w: 2, d: 1 }, y_hammock: { w: 2, d: 1 }, y_massage: { w: 1, d: 1 }, y_record: { w: 1, d: 1 }, y_aircon: { w: 1, d: 1 }, y_fan: { w: 1, d: 1 }, y_shelf: { w: 2, d: 1 },
    y_sink: { w: 1, d: 1 }, y_kitchen: { w: 2, d: 1 }, y_micro: { w: 1, d: 1 }, y_bar: { w: 2, d: 1 }, y_espresso: { w: 1, d: 1 }, y_vanity2: { w: 1, d: 1 },
    y_cactus: { w: 1, d: 1 }, y_tulip: { w: 1, d: 1 }, y_globe: { w: 1, d: 1 }, y_teddy: { w: 1, d: 1 }, y_easel: { w: 1, d: 1 }, y_sunflower: { w: 1, d: 1 }, y_clock: { w: 1, d: 1 }, y_cloudrug: { w: 2, d: 2, flat: 1 }, y_roundrug: { w: 2, d: 2, flat: 1 }, y_bonsai: { w: 1, d: 1 }, y_piggy: { w: 1, d: 1 },
    y_crystal: { w: 1, d: 1 }, y_lava: { w: 1, d: 1 }, y_starlamp: { w: 1, d: 1 },
    y_cattower: { w: 1, d: 1 }, y_dogtent: { w: 1, d: 1 }, y_toybox: { w: 1, d: 1 }, y_petstairs: { w: 1, d: 1 },
  });
  function draw(c, k, t) {
    switch (k) {
      // ---------------- bedroom ----------------
      case 'y_bunk': {
        for (const [x, y] of [[.04, .06], [1.86, .06], [.04, .84], [1.86, .84]]) box(c, x, y, .1, .1, 70, '#c99a6a');
        for (const z of [8, 40]) { box(c, .1, .1, 1.8, .8, 6, '#e8c49a', z); box(c, .14, .14, 1.72, .72, 5, '#fffaf2', z + 6); box(c, .2, .2, .38, .6, 5, '#fff', z + 11); box(c, .7, .14, 1.16, .72, 3, z > 20 ? '#9cc7e8' : '#f4a7b9', z + 11); }
        for (let i = 0; i < 4; i++) box(c, 1.72, .9, .12, .06, 2, '#c99a6a', 12 + i * 10);
        box(c, .1, .1, 1.8, .06, 8, '#c99a6a', 62);
        break;
      }
      case 'y_nightstand': {
        box(c, .18, .2, .64, .6, 30, '#f3d9b5');
        faceY(c, .22, .78, .8, 16, 27, '#f7e4c6', 'rgba(90,60,30,.5)'); faceY(c, .22, .78, .8, 3, 14, '#f7e4c6', 'rgba(90,60,30,.5)');
        ell(c, ...P(.5, .8, 21.5), 2, 1.5, '#c8963f'); ell(c, ...P(.5, .8, 8.5), 2, 1.5, '#c8963f');
        const [x, y] = P(.4, .45, 30); rrect(c, x - 2, y - 12, 4, 12, 1); c.fillStyle = '#9ab0c0'; c.fill(); c.beginPath(); c.moveTo(x - 8, y - 10); c.lineTo(x - 5, y - 22); c.lineTo(x + 5, y - 22); c.lineTo(x + 8, y - 10); c.closePath(); c.fillStyle = '#fff3c4'; c.fill(); c.strokeStyle = OUT; c.lineWidth = 1; c.stroke();
        emo(c, '⏰', ...P(.7, .5, 33), 10);
        break;
      }
      case 'y_mirror': {
        box(c, .35, .35, .3, .3, 4, '#c8963f');
        const fr = [P(.2, .5, 84), P(.8, .5, 84), P(.8, .5, 4), P(.2, .5, 4)]; poly(c, fr, '#e8c27a', OUT, 1.3);
        const g0 = P(.26, .5, 78), g1 = P(.74, .5, 10), g = c.createLinearGradient(g0[0], g0[1], g1[0], g1[1]); g.addColorStop(0, '#e9f6ff'); g.addColorStop(.5, '#bfe0f5'); g.addColorStop(1, '#dff1ff');
        poly(c, [P(.26, .5, 78), P(.74, .5, 78), P(.74, .5, 10), P(.26, .5, 10)], g, 'rgba(120,150,170,.6)');
        line(c, P(.32, .5, 70), P(.5, .5, 50), 'rgba(255,255,255,.9)', 2); line(c, P(.4, .5, 72), P(.6, .5, 52), 'rgba(255,255,255,.6)', 1.2);
        emo(c, '✨', ...P(.8, .5, 86), 9);
        break;
      }
      case 'y_closet': {
        box(c, .06, .15, 1.88, .7, 74, '#fdf4e6', 0, { left: '#f3e3c7', right: '#e6d0ac' });
        for (let i = 0; i < 3; i++) { faceY(c, .12 + i * .6, .66 + i * .6, .85, 8, 70, i === 1 ? '#dff1fa' : '#fbeedb', 'rgba(90,60,30,.5)'); const [kx, ky] = P(.6 + i * .6 - (i === 2 ? .48 : 0), .85, 40); rrect(c, kx - 1, ky - 5, 2, 10, 1); c.fillStyle = '#c8963f'; c.fill(); }
        const g0 = P(.72, .85, 66); c.fillStyle = 'rgba(255,255,255,.7)'; c.fillRect(g0[0] + 2, g0[1] + 4, 2, 40);
        emo(c, '👒', ...P(.4, .5, 80), 12); emo(c, '🧳', ...P(1.5, .5, 82), 12);
        break;
      }
      case 'y_crib': {
        box(c, .1, .15, .8, .7, 12, '#fdfbf6');
        box(c, .14, .19, .72, .62, 4, '#ffe0ea', 12);
        for (let i = 0; i <= 6; i++) { line(c, P(.1 + i * .133, .85, 12), P(.1 + i * .133, .85, 40), '#e8c49a', 2); line(c, P(.9, .15 + i * .117, 12), P(.9, .15 + i * .117, 40), '#e8c49a', 2); }
        box(c, .1, .82, .8, .05, 3, '#f3d9b5', 38); box(c, .87, .15, .05, .7, 3, '#f3d9b5', 38); box(c, .08, .12, .06, .06, 44, '#f3d9b5'); box(c, .08, .12, .82, .06, 3, '#f3d9b5', 38);
        const [mx, my] = P(.5, .5, 70); line(c, P(.1, .15, 44), [mx, my], '#c8963f', 1.5);
        const sw = Math.sin(t * 1.5) * 3; for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + t * .8; line(c, [mx, my], [mx + Math.cos(a) * 9, my + 6 + Math.sin(a) * 3], 'rgba(90,90,90,.5)', .7); emo(c, ['⭐', '🌙', '☁️', '💗'][i], mx + Math.cos(a) * 9 + sw * .2, my + 16 + Math.sin(a) * 3, 8); }
        emo(c, '🧸', ...P(.5, .5, 18), 11);
        break;
      }
      case 'y_desk2': { // study desk with a pink lamp and a laptop
        for (const [x, y] of [[.1, .15], [1.83, .15], [.1, .78], [1.83, .78]]) leg(c, x, y, 30, '#f3d9b5');
        box(c, .05, .1, 1.9, .8, 4, '#fff8ee', 30, { left: '#f3e3c7', right: '#e6d0ac' });
        box(c, .9, .25, .4, .3, 1, '#c0c8d0', 34); poly(c, [P(.9, .25, 35), P(1.3, .25, 35), P(1.3, .25, 58), P(.9, .25, 58)], '#8a95a3', OUT, 1); poly(c, [P(.94, .25, 38), P(1.26, .25, 38), P(1.26, .25, 55), P(.94, .25, 55)], '#bfe0f5');
        const [lx, ly] = P(.35, .35, 34); line(c, [lx, ly], [lx + 6, ly - 22], '#ff9ec0', 2.2); ell(c, lx + 10, ly - 24, 8, 4, '#ff9ec0', OUT, .9); ell(c, lx, ly, 6, 2.5, '#ff9ec0', OUT, .8);
        emo(c, '📓', ...P(1.65, .5, 38), 11); emo(c, '✏️', ...P(.6, .7, 36), 9);
        const [cx, cy] = P(1, 1.05, 0); ell(c, cx, cy, 9, 4, '#c0c8d0'); rrect(c, cx - 1.5, cy - 14, 3, 14, 1); c.fillStyle = '#8a95a3'; c.fill(); ell(c, cx, cy - 15, 10, 4.5, '#ffc2d4', OUT, 1); rrect(c, cx - 8, cy - 34, 16, 18, 5); c.fillStyle = '#ffc2d4'; c.fill(); c.stroke();
        break;
      }
      // ---------------- living room ----------------
      case 'y_lsofa': {
        const col = '#a7c7e7', dk = shade(col, -.12);
        box(c, .05, .05, .35, 1.9, 30, dk); box(c, .4, .05, 1.55, .35, 30, dk); // backrests along the two walls
        box(c, .4, .4, 1.55, .65, 13, col); box(c, .4, 1.05, .65, .9, 13, col); // L-shaped seat
        for (const [x, y, w, d] of [[.45, .45, .7, .55], [1.2, .45, .7, .55], [.45, 1.1, .55, .8]]) box(c, x, y, w, d, 5, shade(col, .12), 13);
        box(c, 1.8, .4, .15, .65, 20, dk); box(c, .4, 1.8, .65, .15, 20, dk); // arms
        for (const [x, y, fill] of [[.25, .35, '#ffe08a'], [.3, 1.2, '#ffc2d4'], [1.3, .25, '#d7b8f0']]) { const [px, py] = P(x, y, 30); rrect(c, px - 8, py - 10, 16, 13, 5); c.fillStyle = fill; c.fill(); c.strokeStyle = OUT; c.lineWidth = .8; c.stroke(); }
        break;
      }
      case 'y_coffee': {
        const [x, y] = P(.5, .5, 0); for (const [dx, dy] of [[-12, -2], [12, -2], [0, 5]]) { rrect(c, x + dx - 1.5, y + dy - 16, 3, 16, 1); c.fillStyle = '#8a5a3b'; c.fill(); }
        ell(c, x, y - 17, 24, 12, '#d9a877', OUT, 1.2); ell(c, x, y - 19, 24, 12, '#e8c49a', OUT, 1.2);
        emo(c, '☕', x - 7, y - 16, 10); emo(c, '🍩', x + 8, y - 18, 10);
        break;
      }
      case 'y_game': {
        box(c, .05, .3, 1.9, .5, 18, '#fdfbf6', 0, { left: '#eef2f5', right: '#dde3e8' });
        faceY(c, .12, .95, .8, 3, 15, '#e8edf2', 'rgba(90,90,90,.4)'); faceY(c, 1.05, 1.88, .8, 3, 15, '#e8edf2', 'rgba(90,90,90,.4)');
        box(c, .9, .45, .2, .15, 6, '#555b66', 18);
        poly(c, [P(.25, .5, 62), P(1.75, .5, 62), P(1.75, .5, 24), P(.25, .5, 24)], '#2d3440', OUT, 1.4);
        const i0 = P(.3, .5, 58), i1 = P(1.7, .5, 28), g = c.createLinearGradient(i0[0], i0[1], i1[0], i1[1]); g.addColorStop(0, '#ffb3cc'); g.addColorStop(1, '#8fd0f5');
        poly(c, [P(.3, .5, 58), P(1.7, .5, 58), P(1.7, .5, 28), P(.3, .5, 28)], g);
        const [sx, sy] = P(1, .5, 44); c.save(); c.font = 'bold 9px sans-serif'; c.textAlign = 'center'; c.fillStyle = '#fff'; c.fillText('GAME ' + (Math.floor(t * 2) % 2 ? '▶' : '★'), sx, sy); c.restore();
        emo(c, '🎮', ...P(.45, .75, 20), 11); emo(c, '🎮', ...P(1.55, .75, 20), 11);
        break;
      }
      case 'y_hammock': {
        for (const x of [.1, 1.8]) { box(c, x, .4, .1, .1, 52, '#8a5a3b'); box(c, x - .05, .3, .2, .3, 3, '#6b4a2e'); }
        const sw = Math.sin(t * 1.3) * 3, a = P(.15, .45, 44), b = P(1.85, .45, 44), m = P(1, .45, 14);
        c.beginPath(); c.moveTo(a[0], a[1]); c.quadraticCurveTo(m[0] + sw, m[1] + 10, b[0], b[1]); c.quadraticCurveTo(m[0] + sw, m[1] + 22, a[0], a[1]); c.fillStyle = '#ffd6a8'; c.fill(); c.lineWidth = 1.2; c.strokeStyle = OUT; c.stroke();
        for (let i = 1; i < 6; i++) { const u = i / 6, x0 = a[0] + (b[0] - a[0]) * u, y0 = a[1] + (b[1] - a[1]) * u; line(c, [x0, y0 + 6], [x0 + sw * .5, y0 + 18 - Math.abs(u - .5) * 16], '#ff9e80', 1.4); }
        break;
      }
      case 'y_massage': {
        const col = '#6d5a8a'; box(c, .15, .2, .7, .65, 16, col);
        box(c, .12, .15, .76, .25, 58, shade(col, .05)); box(c, .12, .2, .12, .65, 26, shade(col, -.08)); box(c, .76, .2, .12, .65, 26, shade(col, -.08));
        box(c, .3, .8, .4, .25, 10, shade(col, -.1)); box(c, .35, .35, .3, .12, 14, '#b8a6d6', 30);
        const on = .5 + .5 * Math.sin(t * 5); emo(c, on > .5 ? '💆' : '✨', ...P(.5, .3, 66), 11);
        break;
      }
      case 'y_record': {
        box(c, .2, .25, .6, .55, 24, '#b98552');
        box(c, .18, .22, .64, .6, 4, '#8a5a3b', 24);
        const [x, y] = P(.5, .5, 28); ell(c, x, y, 13, 6.5, '#222', OUT, .9); ell(c, x, y, 4, 2, '#ff7a9a'); c.save(); c.translate(x, y); c.rotate(t * 3); c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(2, -1, 8, 1); c.restore();
        line(c, P(.75, .3, 30), P(.58, .45, 30), '#c0c8d0', 1.6);
        if (Math.floor(t * 1.5) % 2) emo(c, '🎵', x + 14, y - 16, 10); else emo(c, '🎶', x - 12, y - 20, 10);
        break;
      }
      case 'y_aircon': {
        box(c, .2, .3, .6, .4, 70, '#fdfdfd', 0, { left: '#eef2f5', right: '#dde3e8' });
        faceY(c, .25, .75, .7, 50, 64, '#e2e8ee', 'rgba(90,90,90,.35)');
        for (let i = 0; i < 4; i++) line(c, P(.27, .7, 52 + i * 3.5), P(.73, .7, 52 + i * 3.5), 'rgba(90,110,130,.5)', 1);
        const [dx, dy] = P(.5, .7, 30); c.save(); c.font = 'bold 8px sans-serif'; c.textAlign = 'center'; c.fillStyle = '#4fa3d9'; c.fillText('23°C', dx, dy); c.restore();
        const w = (t * 20) % 20; c.strokeStyle = 'rgba(140,200,240,.55)'; c.lineWidth = 1.2; for (let i = 0; i < 3; i++) { const [ax, ay] = P(.5, .75 + w * .01, 56 - i * 4); c.beginPath(); c.moveTo(ax - 10, ay + w * .3); c.quadraticCurveTo(ax, ay + 4 + w * .3, ax + 10, ay + w * .3); c.stroke(); }
        break;
      }
      case 'y_fan': {
        const [x, y] = P(.5, .5, 0); ell(c, x, y - 2, 12, 5, '#dff1fa', OUT, 1); rrect(c, x - 2, y - 42, 4, 40, 1); c.fillStyle = '#c0d4e0'; c.fill();
        ell(c, x, y - 52, 16, 16, 'rgba(220,240,255,.6)', OUT, 1.2);
        c.save(); c.translate(x, y - 52); c.rotate(t * 12); for (let i = 0; i < 3; i++) { c.rotate(Math.PI * 2 / 3); ell(c, 0, -8, 4.5, 8, 'rgba(140,200,240,.85)'); } c.restore(); ell(c, x, y - 52, 3, 3, '#8fb3d9', OUT, .8);
        for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; line(c, [x, y - 52], [x + Math.cos(a) * 15, y - 52 + Math.sin(a) * 15], 'rgba(90,110,130,.4)', .6); }
        break;
      }
      case 'y_shelf': { // low open shelf with plants & toys
        box(c, .05, .3, 1.9, .5, 36, '#f3d9b5');
        for (const z of [4, 20]) faceY(c, .1, 1.9, .8, z, z + 13, '#c89b6d', 'rgba(90,60,30,.4)');
        for (let i = 0; i < 4; i++) { emo(c, ['📚', '🧸', '🪴', '🎁'][i], ...P(.3 + i * .46, .8, 6), 11); emo(c, ['🕯️', '📷', '📚', '🌵'][i], ...P(.3 + i * .46, .8, 22), 11); }
        emo(c, '🪴', ...P(.4, .5, 38), 13); emo(c, '🖼️', ...P(1.4, .5, 40), 13);
        break;
      }
      // ---------------- kitchen & bath ----------------
      case 'y_sink': {
        box(c, .15, .1, .7, .55, 30, '#fdfdfd', 0, { left: '#eef2f5', right: '#e2e8ee' });
        const [x, y] = P(.5, .4, 30); ell(c, x, y, 13, 6, '#cfe6f2', OUT, 1); rrect(c, x - 1.5, y - 14, 3, 10, 1); c.fillStyle = '#c0c8d0'; c.fill(); ell(c, x + 3, y - 14, 5, 2, '#c0c8d0');
        poly(c, [P(.2, .12, 86), P(.8, .12, 86), P(.8, .12, 44), P(.2, .12, 44)], '#dff1ff', '#c8963f', 2.2);
        emo(c, '🪥', ...P(.8, .3, 32), 9); emo(c, '🧴', ...P(.22, .3, 34), 9);
        break;
      }
      case 'y_kitchen': {
        box(c, .05, .15, 1.9, .65, 30, '#fdfbf6', 0, { left: '#dff1fa', right: '#c9e2ee' });
        box(c, 0, .1, 2, .75, 3, '#9ab0c0', 30);
        for (let i = 0; i < 3; i++) faceY(c, .12 + i * .62, .66 + i * .62, .8, 4, 26, '#e9f5fb', 'rgba(90,110,130,.45)');
        const [x, y] = P(.6, .48, 33); ell(c, x, y, 12, 5.5, '#c0c8d0', OUT, 1); rrect(c, x + 6, y - 14, 2.5, 12, 1); c.fillStyle = '#aab4be'; c.fill();
        emo(c, '🍳', ...P(1.3, .45, 36), 12); emo(c, '🧂', ...P(1.7, .4, 36), 9);
        box(c, .05, .08, 1.9, .12, 22, '#fdfbf6', 62); for (let i = 0; i < 3; i++) faceY(c, .1 + i * .62, .64 + i * .62, .2, 64, 82, '#e9f5fb', 'rgba(90,110,130,.4)');
        break;
      }
      case 'y_micro': {
        box(c, .15, .25, .7, .55, 26, '#f3d9b5');
        box(c, .2, .3, .6, .45, 20, '#fdfdfd', 26, { left: '#eef2f5', right: '#dde3e8' });
        faceY(c, .24, .6, .75, 30, 43, '#2d3440', OUT); const on = Math.floor(t * 2) % 2; faceY(c, .63, .76, .75, 30, 43, '#e8edf2', 'rgba(90,90,90,.4)');
        if (on) { const [lx, ly] = P(.42, .75, 37); ell(c, lx, ly, 5, 3, 'rgba(255,230,140,.8)'); }
        emo(c, '🍚', ...P(.5, .5, 50), 11);
        break;
      }
      case 'y_bar': {
        box(c, .05, .15, 1.9, .5, 40, '#8a5a3b', 0, { left: '#6b4a2e', right: '#5a3d26' });
        box(c, 0, .1, 2, .6, 3, '#e8c49a', 40);
        for (const x of [.45, 1.35]) { const [sx, sy] = P(x, .95, 0); rrect(c, sx - 1.5, sy - 26, 3, 26, 1); c.fillStyle = '#555b66'; c.fill(); ell(c, sx, sy - 1, 7, 3, '#555b66'); ell(c, sx, sy - 27, 9, 4, '#ff9ec0', OUT, 1); }
        emo(c, '🍷', ...P(.5, .4, 44), 11); emo(c, '🧁', ...P(1.1, .4, 44), 11); emo(c, '🍹', ...P(1.6, .4, 44), 11);
        break;
      }
      case 'y_espresso': {
        box(c, .15, .2, .7, .6, 28, '#f3d9b5');
        box(c, .25, .3, .5, .4, 26, '#e0604e', 28, { top: '#e87a6a' });
        faceY(c, .32, .68, .7, 36, 44, '#2d3440', OUT); const [cx, cy] = P(.5, .7, 30); ell(c, cx, cy, 4, 2, '#fff', OUT, .7);
        const st = (t * 20) % 14; c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(cx - 2, cy - 4 - st); c.quadraticCurveTo(cx + 3, cy - 8 - st, cx, cy - 12 - st); c.stroke();
        emo(c, '☕', ...P(.25, .7, 30), 9);
        break;
      }
      case 'y_vanity2': { // bathroom cabinet with a round mirror
        box(c, .15, .15, .7, .55, 30, '#fbeedb');
        faceY(c, .2, .48, .7, 4, 26, '#fff8ee', 'rgba(90,60,30,.4)'); faceY(c, .52, .8, .7, 4, 26, '#fff8ee', 'rgba(90,60,30,.4)');
        const [mx, my] = P(.5, .16, 62); ell(c, mx, my, 15, 15, '#f3c6a0', OUT, 1.2); ell(c, mx, my, 12, 12, '#dff1ff'); line(c, [mx - 6, my - 4], [mx + 1, my - 10], 'rgba(255,255,255,.9)', 2);
        emo(c, '🧼', ...P(.3, .4, 32), 9); emo(c, '🌸', ...P(.72, .4, 34), 10);
        break;
      }
      // ---------------- decoration ----------------
      case 'y_cactus': {
        pot(c, '#f2b48a'); const [x, y] = P(.5, .5, 17);
        rrect(c, x - 6, y - 34, 12, 34, 6); c.fillStyle = '#6fbf73'; c.fill(); c.strokeStyle = OUT; c.lineWidth = 1; c.stroke();
        for (const s of [-1, 1]) { rrect(c, x + s * 6 + (s < 0 ? -8 : 0), y - 22 + (s > 0 ? -6 : 0), 8, 5, 2.5); c.fill(); c.stroke(); rrect(c, x + s * 11 - 2.5, y - 32 + (s > 0 ? -6 : 0), 5, 13, 2.5); c.fill(); c.stroke(); }
        emo(c, '🌸', x + 1, y - 34, 9);
        break;
      }
      case 'y_tulip': {
        const [x, y] = P(.5, .5, 0); rrect(c, x - 7, y - 26, 14, 26, 6); c.fillStyle = '#bfe0f5'; c.fill(); c.strokeStyle = OUT; c.lineWidth = 1; c.stroke(); ell(c, x - 3, y - 18, 2, 5, 'rgba(255,255,255,.6)');
        for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i - 2) * .3, L = 22 + (i % 2) * 6, ex = x + Math.cos(a) * L * .6, ey = y - 24 + Math.sin(a) * L; line(c, [x, y - 24], [ex, ey], '#5a9a4a', 1.4); c.beginPath(); c.moveTo(ex - 4, ey); c.lineTo(ex - 4, ey - 6); c.lineTo(ex - 1.5, ey - 3.5); c.lineTo(ex, ey - 7); c.lineTo(ex + 1.5, ey - 3.5); c.lineTo(ex + 4, ey - 6); c.lineTo(ex + 4, ey); c.quadraticCurveTo(ex, ey + 4, ex - 4, ey); c.fillStyle = ['#ff7a9a', '#ffd166', '#ff9ec0', '#b59be0', '#ff7a7a'][i]; c.fill(); c.lineWidth = .7; c.strokeStyle = OUT; c.stroke(); }
        break;
      }
      case 'y_globe': {
        box(c, .2, .2, .6, .6, 26, '#b98552');
        const [x, y] = P(.5, .5, 26); rrect(c, x - 1.5, y - 6, 3, 6, 1); c.fillStyle = '#c8963f'; c.fill();
        c.beginPath(); c.arc(x, y - 20, 16, Math.PI * .3, Math.PI * 1.7); c.strokeStyle = '#c8963f'; c.lineWidth = 2; c.stroke();
        ell(c, x, y - 20, 13, 13, '#7ac7ff', OUT, 1.1);
        c.save(); c.beginPath(); c.arc(x, y - 20, 13, 0, Math.PI * 2); c.clip(); const sh = (t * 6) % 26; for (const [dx, dy, r] of [[-6, -4, 5], [4, 2, 6], [-2, 7, 3], [9, -7, 3]]) { ell(c, x + ((dx + sh + 13) % 26) - 13, y - 20 + dy, r, r * .8, '#8ed081'); } c.restore();
        break;
      }
      case 'y_teddy': {
        const [x, y] = P(.5, .5, 0), b = '#c8966a', l = '#f3d2b0';
        ell(c, x, y - 2, 18, 7, 'rgba(0,0,0,.12)');
        ell(c, x - 11, y - 6, 7, 6, b, OUT, 1); ell(c, x + 11, y - 6, 7, 6, b, OUT, 1);
        ell(c, x, y - 20, 16, 17, b, OUT, 1.2); ell(c, x, y - 17, 10, 11, l);
        ell(c, x - 15, y - 24, 5, 8, b, OUT, 1); ell(c, x + 15, y - 24, 5, 8, b, OUT, 1);
        for (const s of [-1, 1]) { ell(c, x + s * 10, y - 52, 6, 6, b, OUT, 1); ell(c, x + s * 10, y - 52, 3, 3, l); }
        ell(c, x, y - 44, 13, 12, b, OUT, 1.2); ell(c, x, y - 40, 6, 4.5, l); ell(c, x, y - 42, 2, 1.5, '#3a2a20');
        ell(c, x - 5, y - 46, 1.6, 1.8, '#3a2a20'); ell(c, x + 5, y - 46, 1.6, 1.8, '#3a2a20');
        c.beginPath(); c.moveTo(x - 7, y - 33); c.lineTo(x + 7, y - 33); c.lineTo(x + 3, y - 29); c.lineTo(x - 3, y - 29); c.closePath(); c.fillStyle = '#ff7a9a'; c.fill(); emo(c, '💗', x + 6, y - 14, 8);
        break;
      }
      case 'y_easel': {
        const a = P(.3, .6, 0), b = P(.7, .6, 0), top = P(.5, .45, 70), bk = P(.5, .25, 0);
        line(c, a, top, '#b98552', 2.5); line(c, b, top, '#b98552', 2.5); line(c, bk, top, '#8a5a3b', 2);
        box(c, .22, .55, .56, .08, 2, '#8a5a3b', 20);
        poly(c, [P(.25, .55, 62), P(.75, .55, 62), P(.75, .55, 24), P(.25, .55, 24)], '#fff', OUT, 1.2);
        const [px, py] = P(.5, .55, 43); ell(c, px, py + 6, 13, 3, '#9ce39a'); ell(c, px + 6, py - 8, 4, 4, '#ffd166'); emo(c, '🌷', px - 5, py + 4, 11);
        emo(c, '🎨', ...P(.8, .8, 4), 12);
        break;
      }
      case 'y_sunflower': {
        pot(c, '#8fb3d9'); const [x, y] = P(.5, .5, 17);
        for (let i = 0; i < 3; i++) { const dx = (i - 1) * 9, hy = y - 40 - (i === 1 ? 10 : 0); line(c, [x + dx * .4, y], [x + dx, hy], '#5a9a4a', 2); ell(c, x + dx * .7 + (i - 1) * 3, y - 16, 5, 2.5, '#6fbf73');
          const sw = Math.sin(t * 1.5 + i) * .1; c.save(); c.translate(x + dx, hy); c.rotate(sw); for (let p = 0; p < 10; p++) { const a = p * Math.PI / 5; ell(c, Math.cos(a) * 7, Math.sin(a) * 7, 3.5, 3.5, '#ffd24a', 'rgba(150,100,0,.4)', .5); } ell(c, 0, 0, 5, 5, '#8a5a3b', OUT, .8); c.restore(); }
        break;
      }
      case 'y_clock': {
        box(c, .25, .3, .5, .4, 88, '#8a5a3b', 0, { left: '#9a6a48', right: '#7a4e32' });
        const [x, y] = P(.5, .7, 70); ell(c, x, y, 11, 11, '#fff8ee', OUT, 1.1);
        const h = t * .05, m = t * .6; line(c, [x, y], [x + Math.sin(h) * 6, y - Math.cos(h) * 6], '#3a2a20', 1.6); line(c, [x, y], [x + Math.sin(m) * 9, y - Math.cos(m) * 9], '#3a2a20', 1);
        faceY(c, .32, .68, .7, 12, 52, 'rgba(255,240,200,.35)', 'rgba(60,38,25,.6)');
        const sw = Math.sin(t * 3) * 5, [px, py] = P(.5, .7, 50); line(c, [px, py], [px + sw, py + 26], '#c8963f', 1.4); ell(c, px + sw, py + 28, 4, 4, '#e8c27a', OUT, .8);
        break;
      }
      case 'y_cloudrug': {
        const [x, y] = P(1, 1, 0);
        c.beginPath(); for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5, r = 30 + (i % 2) * 6; c.ellipse(x + Math.cos(a) * r * .9, y + Math.sin(a) * r * .5, 14, 8, 0, 0, Math.PI * 2); } c.fillStyle = '#eef6ff'; c.fill();
        ell(c, x, y, 34, 18, '#eef6ff'); ell(c, x - 8, y - 3, 12, 5, 'rgba(255,255,255,.8)');
        c.strokeStyle = 'rgba(140,180,220,.6)'; c.lineWidth = 1; ell(c, x, y, 40, 22, null, 'rgba(140,180,220,.35)', 1.5);
        emo(c, '⭐', x + 14, y + 6, 9); emo(c, '🌙', x - 16, y + 3, 9);
        break;
      }
      case 'y_roundrug': {
        const [x, y] = P(1, 1, 0); const cols = ['#ffd6e2', '#ffe9b0', '#d8f0d8', '#d7e6ff'];
        for (let i = 0; i < 4; i++) ell(c, x, y, 44 - i * 10, 22 - i * 5, cols[i], i ? null : 'rgba(200,150,170,.6)', 1.2);
        for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8; ell(c, x + Math.cos(a) * 46, y + Math.sin(a) * 23.5, 2, 1.2, '#f7a8c0'); }
        break;
      }
      case 'y_bonsai': {
        box(c, .2, .3, .6, .4, 8, '#5a8a9a'); const [x, y] = P(.5, .5, 8);
        c.beginPath(); c.moveTo(x - 2, y); c.quadraticCurveTo(x - 10, y - 12, x + 2, y - 20); c.quadraticCurveTo(x + 8, y - 24, x + 4, y - 30); c.lineWidth = 4; c.strokeStyle = '#6b4a2e'; c.stroke();
        for (const [dx, dy, r] of [[-8, -24, 9], [8, -30, 10], [2, -40, 8], [-4, -34, 7]]) ell(c, x + dx, y + dy, r * 1.3, r * .8, '#4f9a5a', 'rgba(30,60,30,.5)', .8);
        break;
      }
      case 'y_piggy': {
        box(c, .2, .25, .6, .55, 20, '#f3d9b5');
        const [x, y] = P(.5, .5, 20); ell(c, x, y - 12, 15, 11, '#ffb3c7', OUT, 1.1); ell(c, x + 13, y - 12, 5, 4.5, '#ff9ec0', OUT, .9); ell(c, x + 12, y - 12, 1, 1.4, '#c0506a'); ell(c, x + 14.5, y - 12, 1, 1.4, '#c0506a');
        ell(c, x + 5, y - 17, 1.5, 1.8, '#3a2a20'); c.beginPath(); c.moveTo(x - 2, y - 21); c.lineTo(x + 2, y - 27); c.lineTo(x + 5, y - 20); c.fillStyle = '#ff9ec0'; c.fill(); rrect(c, x - 4, y - 24, 8, 2, 1); c.fillStyle = '#8a5a3b'; c.fill();
        for (const dx of [-8, 6]) { rrect(c, x + dx, y - 3, 4, 5, 1.5); c.fillStyle = '#ff9ec0'; c.fill(); }
        const k = (t * .8) % 1; c.globalAlpha = 1 - k; emo(c, '🪙', x, y - 28 - k * 10, 10); c.globalAlpha = 1;
        break;
      }
      // ---------------- lights ----------------
      case 'y_crystal': {
        const [x, y] = P(.5, .5, 0); ell(c, x, y - 2, 11, 5, '#e8c27a', OUT, 1); rrect(c, x - 1.5, y - 60, 3, 58, 1); c.fillStyle = '#e8c27a'; c.fill();
        ell(c, x, y - 62, 16, 6, '#fff3c4', OUT, 1);
        for (let i = 0; i < 7; i++) { const dx = (i - 3) * 4.5, dy = 8 + (i % 2) * 5, tw = .5 + .5 * Math.sin(t * 4 + i); c.beginPath(); c.moveTo(x + dx, y - 62 + dy - 4); c.lineTo(x + dx + 2, y - 62 + dy); c.lineTo(x + dx, y - 62 + dy + 4); c.lineTo(x + dx - 2, y - 62 + dy); c.closePath(); c.fillStyle = `rgba(200,230,255,${.6 + .4 * tw})`; c.fill(); }
        const g = c.createRadialGradient(x, y - 60, 2, x, y - 60, 30); g.addColorStop(0, 'rgba(255,240,180,.45)'); g.addColorStop(1, 'rgba(255,240,180,0)'); c.fillStyle = g; c.beginPath(); c.arc(x, y - 60, 30, 0, Math.PI * 2); c.fill();
        break;
      }
      case 'y_lava': {
        box(c, .3, .3, .4, .4, 18, '#f3d9b5');
        const [x, y] = P(.5, .5, 18); c.beginPath(); c.moveTo(x - 5, y); c.lineTo(x - 8, y - 22); c.quadraticCurveTo(x, y - 30, x + 8, y - 22); c.lineTo(x + 5, y); c.closePath(); c.fillStyle = 'rgba(255,190,220,.75)'; c.fill(); c.strokeStyle = OUT; c.lineWidth = 1; c.stroke();
        for (let i = 0; i < 3; i++) { const k = ((t * .25 + i / 3) % 1); ell(c, x + Math.sin(t + i * 2) * 2, y - 4 - k * 20, 3 + (i % 2), 3.5, '#ff6f9c'); }
        const g = c.createRadialGradient(x, y - 14, 2, x, y - 14, 24); g.addColorStop(0, 'rgba(255,140,190,.35)'); g.addColorStop(1, 'rgba(255,140,190,0)'); c.fillStyle = g; c.beginPath(); c.arc(x, y - 14, 24, 0, Math.PI * 2); c.fill();
        break;
      }
      case 'y_starlamp': {
        const [x, y] = P(.5, .5, 0); ell(c, x, y - 2, 12, 5, '#c9b6f0', OUT, 1); rrect(c, x - 1.5, y - 30, 3, 28, 1); c.fillStyle = '#b59be0'; c.fill();
        c.save(); c.translate(x, y - 42); c.rotate(Math.sin(t) * .15); c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 6 : 14; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath(); c.fillStyle = '#ffe27a'; c.fill(); c.strokeStyle = OUT; c.lineWidth = 1; c.stroke(); c.restore();
        const g = c.createRadialGradient(x, y - 42, 3, x, y - 42, 30); g.addColorStop(0, 'rgba(255,230,120,.4)'); g.addColorStop(1, 'rgba(255,230,120,0)'); c.fillStyle = g; c.beginPath(); c.arc(x, y - 42, 30, 0, Math.PI * 2); c.fill();
        break;
      }
      // ---------------- pets ----------------
      case 'y_cattower': {
        box(c, .1, .1, .8, .8, 6, '#c8b39a');
        box(c, .42, .42, .16, .16, 70, '#e8d5bb'); for (let i = 0; i < 8; i++) line(c, P(.42, .58, 8 + i * 8), P(.58, .58, 12 + i * 8), 'rgba(140,110,80,.5)', 1);
        box(c, .15, .15, .5, .5, 5, '#ffc2d4', 30); box(c, .35, .35, .55, .55, 5, '#bfe6d8', 52); box(c, .25, .25, .5, .5, 6, '#ffc2d4', 74);
        const [bx, by] = P(.85, .5, 40); line(c, P(.7, .5, 57), [bx, by], '#999', .8); ell(c, bx, by + 3, 3.5, 3.5, '#ffd24a', OUT, .8);
        emo(c, '🐾', ...P(.5, .5, 82), 9);
        break;
      }
      case 'y_dogtent': {
        const [x, y] = P(.5, .5, 0); ell(c, x, y - 1, 24, 11, '#ffe9b0', OUT, 1);
        c.beginPath(); c.moveTo(x - 22, y - 2); c.lineTo(x, y - 46); c.lineTo(x + 22, y - 2); c.closePath(); c.fillStyle = '#7ac7ff'; c.fill(); c.lineWidth = 1.2; c.strokeStyle = OUT; c.stroke();
        c.beginPath(); c.moveTo(x - 8, y + 2); c.lineTo(x, y - 26); c.lineTo(x + 8, y + 2); c.closePath(); c.fillStyle = '#2e4a66'; c.fill();
        line(c, [x, y - 46], [x, y - 58], '#8a5a3b', 1.4); c.beginPath(); c.moveTo(x, y - 58); c.lineTo(x + 9, y - 55); c.lineTo(x, y - 52); c.fillStyle = '#ff7a9a'; c.fill();
        for (let i = 0; i < 3; i++) emo(c, '⭐', x - 12 + i * 12 + (i === 1 ? 0 : 0), y - 18 - (i === 1 ? 14 : 0), 7);
        break;
      }
      case 'y_toybox': {
        box(c, .15, .2, .7, .6, 22, '#ff9ec0', 0, { top: '#ffb3cc' });
        faceY(c, .2, .8, .8, 6, 18, '#ffc2d4', 'rgba(150,60,90,.35)'); emo(c, '🐾', ...P(.5, .8, 9), 9);
        emo(c, '🦴', ...P(.35, .45, 24), 11); emo(c, '🎾', ...P(.6, .4, 26), 10); emo(c, '🧶', ...P(.5, .6, 24), 10);
        break;
      }
      case 'y_petstairs': {
        for (let i = 0; i < 3; i++) box(c, .1 + i * .27, .2, .8 - i * .27, .6, 10 + i * 10, '#e8c49a', 0, { top: ['#ffc2d4', '#bfe6d8', '#ffe9b0'][i] });
        emo(c, '🐾', ...P(.8, .5, 32), 9);
        break;
      }
    }
  }
  const old = FURN.item;
  FURN.item = (c, k, t, r) => k.startsWith('y_') ? draw(c, k, t || 0) : old(c, k, t, r);
})();
