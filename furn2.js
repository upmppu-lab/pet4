// ================= Extra furniture (x_*) — shop & home =================
(() => {
  const { ell, rrect, shade, OUT } = ART, box = FURN.box, P = FURN.P;
  const poly = (c, pts, fill, st, lw) => { c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); if (fill) { c.fillStyle = fill; c.fill(); } if (st) { c.lineWidth = lw || 1.1; c.strokeStyle = st; c.stroke(); } };
  const line = (c, a, b, col, w) => { c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.strokeStyle = col; c.lineWidth = w || 1; c.stroke(); };
  const leg = (c, x, y, h, col) => box(c, x, y, .07, .07, h, col || '#b98552');
  const emo = (c, e, x, y, s) => { c.font = (s || 12) + 'px sans-serif'; c.textAlign = 'center'; c.fillText(e, x, y); c.textAlign = 'start'; };
  Object.assign(FURN.DEF, {
    x_photozone: { w: 2, d: 1 }, x_gacha: { w: 1, d: 1 }, x_agility: { w: 2, d: 1 }, x_scale: { w: 1, d: 1 }, x_board: { w: 1, d: 1 }, x_balloon: { w: 1, d: 1 },
    x_monstera: { w: 1, d: 1 }, x_beanbag: { w: 1, d: 1 }, x_vending: { w: 1, d: 1 }, x_dresser: { w: 1, d: 1 }, x_island: { w: 2, d: 1 }, x_rocking: { w: 1, d: 1 }, x_pcdesk: { w: 2, d: 1 }, x_toilet: { w: 1, d: 1 }, x_shower: { w: 1, d: 1 }, x_petbowl: { w: 1, d: 1 },
  });
  function draw(c, k, t) {
    switch (k) {
      case 'x_photozone': {
        box(c, .1, .35, 1.8, .3, 4, '#f3e3c7');
        const cx = P(1, .5, 0), R = 44; c.beginPath(); c.arc(cx[0], cx[1] - 40, R, Math.PI, 0); c.lineWidth = 9; c.strokeStyle = '#ff9ec0'; c.stroke();
        for (let i = 0; i <= 12; i++) { const a = Math.PI + i * Math.PI / 12; ell(c, cx[0] + Math.cos(a) * R, cx[1] - 40 + Math.sin(a) * R, 6, 6, ['#ffb3cc', '#fff', '#ffd6a8', '#c9b6f0'][i % 4], 'rgba(60,38,25,.4)', .7); }
        for (const sd of [-1, 1]) { rrect(c, cx[0] + sd * R - 3, cx[1] - 40, 6, 40, 2); c.fillStyle = '#f3e3c7'; c.fill(); c.strokeStyle = OUT; c.lineWidth = .8; c.stroke(); }
        c.font = 'bold 9px sans-serif'; c.textAlign = 'center'; c.fillStyle = '#e0508a'; c.fillText('♥ PHOTO ♥', cx[0], cx[1] - 66); c.textAlign = 'start';
        break;
      }
      case 'x_gacha': {
        box(c, .2, .2, .6, .6, 22, '#ef6f6f', 0, { top: '#f08a8a' });
        const [x, y] = P(.5, .5, 22); ell(c, x, y - 18, 17, 17, 'rgba(220,240,255,.75)', OUT, 1.2);
        for (let i = 0; i < 9; i++) ell(c, x - 10 + (i % 3) * 10, y - 10 - Math.floor(i / 3) * 8, 4, 4, ['#ffd24a', '#8ad0ff', '#ff8ab8', '#9ce39a'][i % 4], 'rgba(60,38,25,.4)', .6);
        ell(c, x - 4, y - 28, 5, 3, 'rgba(255,255,255,.8)'); ell(c, x, y - 35, 7, 3.5, '#d95555', OUT, 1);
        const f = P(.5, .8, 12); ell(c, f[0], f[1], 4, 4, '#fff', OUT, 1); line(c, [f[0] - 3, f[1]], [f[0] + 3, f[1]], '#999', 1.5);
        break;
      }
      case 'x_agility': {
        box(c, .95, .25, .2, .5, 16, '#6aa04a');
        poly(c, [P(.05, .25, 0), P(.95, .25, 16), P(.95, .75, 16), P(.05, .75, 0)], '#9ad0a0', OUT, 1.1);
        for (let i = 1; i < 5; i++) line(c, P(.05 + i * .18, .25, i * 3.2), P(.05 + i * .18, .75, i * 3.2), '#fff', 1.6);
        leg(c, 1.4, .3, 26, '#ffb347'); leg(c, 1.4, .63, 26, '#ffb347'); box(c, 1.38, .3, .1, .4, 3, '#ff7a7a', 18);
        leg(c, 1.75, .3, 16, '#8ad0ff'); leg(c, 1.75, .63, 16, '#8ad0ff'); box(c, 1.73, .3, .1, .4, 3, '#ffd24a', 12);
        break;
      }
      case 'x_scale': {
        box(c, .15, .15, .7, .7, 8, '#e8edf2', 0, { top: '#f6f8fa' });
        box(c, .7, .2, .15, .15, 30, '#c0c8d0');
        const [x, y] = P(.78, .27, 34); ell(c, x, y - 4, 9, 9, '#fff', OUT, 1.2); line(c, [x, y - 4], [x + 5, y - 8], '#e0604e', 1.4);
        emo(c, '🐾', ...P(.45, .5, 9), 10);
        break;
      }
      case 'x_board': {
        leg(c, .3, .45, 34, '#8a5a3b'); leg(c, .65, .45, 34, '#8a5a3b');
        const q = [P(.2, .5, 62), P(.8, .5, 62), P(.8, .5, 22), P(.2, .5, 22)]; poly(c, q, '#2e3a33', '#8a5a3b', 3);
        const [x, y] = P(.5, .5, 50); c.fillStyle = '#fff'; c.font = 'bold 8px sans-serif'; c.textAlign = 'center'; c.fillText('NEW', x, y - 2); c.fillStyle = '#ffd24a'; c.fillText('🐶 SALE', x, y + 10); c.textAlign = 'start';
        break;
      }
      case 'x_balloon': {
        const [x, y] = P(.5, .5, 0); box(c, .38, .38, .24, .24, 6, '#fff');
        const cols = ['#ff7a9a', '#7ac7ff', '#ffd166', '#b59be0', '#9ce39a'];
        cols.forEach((col, i) => { const bx = x + (i - 2) * 9 + Math.sin(t * 1.5 + i) * 2, by = y - 56 - (i % 2) * 10; line(c, [x, y - 6], [bx, by + 9], 'rgba(90,90,90,.6)', .8); ell(c, bx, by, 8, 10, col, 'rgba(60,38,25,.5)', .8); ell(c, bx - 3, by - 3, 2, 3, 'rgba(255,255,255,.6)'); });
        break;
      }
      case 'x_monstera': {
        box(c, .25, .25, .5, .5, 22, '#f3e3c7');
        const [x, y] = P(.5, .5, 22);
        for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * .45, L = 34 + (i % 2) * 10; const ex = x + Math.cos(a) * L * .8, ey = y + Math.sin(a) * L;
          line(c, [x, y], [ex, ey], '#4a8a3a', 2); c.save(); c.translate(ex, ey); c.rotate(a + Math.PI / 2); ell(c, 0, 0, 10, 14, i % 2 ? '#3f9a5a' : '#5ab86a', 'rgba(30,60,30,.6)', .8); line(c, [0, -12], [0, 12], 'rgba(255,255,255,.4)', 1); c.restore(); }
        break;
      }
      case 'x_beanbag': {
        const [x, y] = P(.5, .5, 0); ell(c, x, y - 2, 22, 11, 'rgba(0,0,0,.12)');
        c.beginPath(); c.moveTo(x - 22, y - 4); c.quadraticCurveTo(x - 26, y - 30, x - 4, y - 36); c.quadraticCurveTo(x + 22, y - 34, x + 22, y - 6); c.quadraticCurveTo(x, y + 6, x - 22, y - 4); c.fillStyle = '#ffb3a7'; c.fill(); c.lineWidth = 1.2; c.strokeStyle = OUT; c.stroke();
        ell(c, x + 2, y - 14, 13, 6, '#ffc9c0'); ell(c, x - 8, y - 28, 5, 3, 'rgba(255,255,255,.4)');
        break;
      }
      case 'x_vending': {
        box(c, .12, .2, .76, .6, 78, '#5aa0d9', 0, { top: '#6fb0e6' });
        const q = [P(.18, .8, 72), P(.82, .8, 72), P(.82, .8, 28), P(.18, .8, 28)]; poly(c, q, 'rgba(220,240,255,.9)', OUT, 1);
        for (let r = 0; r < 3; r++) for (let i = 0; i < 3; i++) { const [bx, by] = P(.28 + i * .22, .8, 64 - r * 13); rrect(c, bx - 3, by - 8, 6, 9, 2); c.fillStyle = ['#ff7a7a', '#ffd24a', '#9ce39a'][(r + i) % 3]; c.fill(); }
        const [sx, sy] = P(.5, .8, 16); rrect(c, sx - 10, sy - 4, 20, 7, 2); c.fillStyle = '#2d3a4a'; c.fill();
        break;
      }
      case 'x_dresser': {
        box(c, .12, .2, .76, .6, 40, '#f3d9b5');
        for (let r = 0; r < 3; r++) { const q = [P(.16, .8, 36 - r * 12), P(.84, .8, 36 - r * 12), P(.84, .8, 26 - r * 12), P(.16, .8, 26 - r * 12)]; poly(c, q, '#f7e4c6', 'rgba(90,60,30,.5)', 1); const [kx, ky] = P(.5, .8, 31 - r * 12); ell(c, kx, ky, 2, 1.5, '#c8963f'); }
        const [x, y] = P(.35, .45, 40); rrect(c, x - 2, y - 12, 4, 12, 1); c.fillStyle = '#c8963f'; c.fill(); c.beginPath(); c.moveTo(x - 8, y - 10); c.lineTo(x - 5, y - 22); c.lineTo(x + 5, y - 22); c.lineTo(x + 8, y - 10); c.closePath(); c.fillStyle = '#ffd6e2'; c.fill(); c.strokeStyle = OUT; c.lineWidth = 1; c.stroke();
        emo(c, '🧸', ...P(.68, .5, 44), 12);
        break;
      }
      case 'x_island': {
        box(c, .1, .15, 1.8, .55, 32, '#fdfbf6', 0, { left: '#e8d5bb', right: '#dcc6a8' });
        box(c, .05, .1, 1.9, .65, 4, '#9ab0c0', 32);
        for (const x of [.5, 1.3]) { leg(c, x, .82, 20, '#6b4a2e'); ell(c, ...P(x + .03, .85, 21), 7, 3.5, '#ffb3a7', OUT, .8); }
        emo(c, '🍓', ...P(.5, .4, 38), 11); emo(c, '🥐', ...P(1.3, .4, 38), 11); const [bx, by] = P(1, .35, 36); ell(c, bx, by, 8, 4, '#fff', OUT, .8);
        break;
      }
      case 'x_pcdesk': {
        for (const [x, y] of [[.1, .15], [1.83, .15], [.1, .78], [1.83, .78]]) leg(c, x, y, 30, '#8a95a3');
        box(c, .05, .1, 1.9, .8, 4, '#f3e3c7', 30, { left: '#e2cda8', right: '#d4bb92' });
        box(c, 1.5, .15, .38, .6, 26, '#e2cda8');
        for (let r = 0; r < 2; r++) { const q = [P(1.52, .75, 24 - r * 12), P(1.86, .75, 24 - r * 12), P(1.86, .75, 15 - r * 12), P(1.52, .75, 15 - r * 12)]; poly(c, q, '#efdcbc', 'rgba(90,60,30,.5)', 1); }
        box(c, .62, .22, .12, .12, 10, '#555b66', 34); box(c, .5, .18, .36, .2, 2, '#555b66', 34);
        const scr = [P(.35, .28, 76), P(1.05, .28, 76), P(1.05, .28, 44), P(.35, .28, 44)]; poly(c, scr, '#2d3440', OUT, 1.4);
        const in2 = [P(.39, .28, 73), P(1.01, .28, 73), P(1.01, .28, 47), P(.39, .28, 47)]; const g = c.createLinearGradient(in2[0][0], in2[0][1], in2[2][0], in2[2][1]); g.addColorStop(0, '#8fd0f5'); g.addColorStop(1, '#c9b6f0'); poly(c, in2, g);
        const [sx, sy] = P(.7, .28, 62); c.font = 'bold 7px sans-serif'; c.textAlign = 'center'; c.fillStyle = '#fff'; c.fillText('🛒 ORDER', sx, sy); const on = .5 + .5 * Math.sin(t * 4); c.fillStyle = `rgba(255,120,170,${on})`; c.fillText('● NEW', sx, sy + 9); c.textAlign = 'start';
        poly(c, [P(.4, .5, 34), P(.95, .5, 34), P(.95, .68, 34), P(.4, .68, 34)], '#e8edf2', OUT, .8); ell(c, ...P(1.15, .6, 35), 3, 2, '#e8edf2', OUT, .8);
        const [mx, my] = P(1.3, .35, 34); rrect(c, mx - 4, my - 8, 8, 8, 2); c.fillStyle = '#ff9ec0'; c.fill(); c.strokeStyle = OUT; c.lineWidth = .8; c.stroke();
        const [cx, cy] = P(.7, 1.05, 0); ell(c, cx, cy, 10, 4, '#555b66'); rrect(c, cx - 1.5, cy - 16, 3, 16, 1); c.fillStyle = '#8a95a3'; c.fill(); ell(c, cx, cy - 17, 11, 5, '#9a7ad9', OUT, 1); rrect(c, cx - 9, cy - 38, 18, 20, 5); c.fillStyle = '#9a7ad9'; c.fill(); c.stroke();
        break;
      }
      case 'x_toilet': {
        box(c, .2, .12, .6, .22, 40, '#fdfdfd', 0, { left: '#eef2f5', right: '#e2e8ee' }); box(c, .18, .1, .64, .26, 4, '#e8eef3', 40);
        const [x, y] = P(.5, .55, 0); rrect(c, x - 9, y - 18, 18, 18, 5); c.fillStyle = '#f4f7fa'; c.fill(); c.strokeStyle = OUT; c.lineWidth = 1; c.stroke();
        ell(c, x, y - 20, 15, 9, '#fdfdfd', OUT, 1.1); ell(c, x, y - 20, 10, 5.5, '#cfe6f2'); ell(c, x, y - 21, 15, 9, null, 'rgba(255,158,192,.9)', 2.2);
        const [fx, fy] = P(.7, .23, 34); rrect(c, fx - 3, fy - 1.5, 6, 3, 1); c.fillStyle = '#c0c8d0'; c.fill();
        box(c, .82, .6, .14, .14, 26, '#fff'); ell(c, ...P(.89, .67, 28), 5, 5, '#fff', OUT, .8);
        break;
      }
      case 'x_shower': {
        box(c, .05, .05, .9, .9, 4, '#dbe7ee', 0, { top: '#e9f2f7' });
        for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) if ((i + j) % 2) poly(c, [P(.05 + i * .15, .05 + j * .15, 4), P(.2 + i * .15, .05 + j * .15, 4), P(.2 + i * .15, .2 + j * .15, 4), P(.05 + i * .15, .2 + j * .15, 4)], '#cfdde6');
        box(c, .08, .08, .06, .06, 90, '#c0c8d0'); const [hx, hy] = P(.3, .2, 86); line(c, P(.11, .11, 88), [hx, hy], '#c0c8d0', 2.5); ell(c, hx, hy + 2, 7, 3, '#aab4be', OUT, .8);
        const t2 = Date.now() / 1000; c.strokeStyle = 'rgba(150,200,240,.5)'; c.lineWidth = 1; for (let i = 0; i < 6; i++) { const ox = hx - 5 + i * 2, oy = hy + 6 + ((t2 * 60 + i * 11) % 30); c.beginPath(); c.moveTo(ox, oy); c.lineTo(ox, oy + 5); c.stroke(); }
        poly(c, [P(.95, .05, 84), P(.95, .95, 84), P(.95, .95, 4), P(.95, .05, 4)], 'rgba(200,230,250,.35)', 'rgba(120,150,170,.7)', 1.2);
        poly(c, [P(.05, .95, 84), P(.95, .95, 84), P(.95, .95, 4), P(.05, .95, 4)], 'rgba(200,230,250,.3)', 'rgba(120,150,170,.7)', 1.2);
        line(c, P(.12, .95, 70), P(.35, .95, 30), 'rgba(255,255,255,.7)', 2);
        break;
      }
      case 'x_petbowl': {
        const [x, y] = P(.5, .5, 0); ell(c, x, y - 1, 24, 11, '#ffc2d4', OUT, 1); c.font = '7px sans-serif'; c.fillStyle = '#fff'; c.fillText('🐾', x + 12, y + 4);
        for (const [dx, col, fill] of [[-9, '#6d9dc5', '#b8784a'], [9, '#ef8fa8', '#8ad0ff']]) { ell(c, x + dx, y - 4, 9, 4.5, col, OUT, 1); ell(c, x + dx, y - 6, 7, 3, fill); }
        break;
      }
      case 'x_rocking': {
        const rock = Math.sin(t * 1.2) * .06;
        const [x, y] = P(.5, .5, 0); c.save(); c.translate(x, y); c.rotate(rock); c.translate(-x, -y);
        c.beginPath(); c.moveTo(x - 22, y - 4); c.quadraticCurveTo(x, y + 6, x + 22, y - 4); c.lineWidth = 3; c.strokeStyle = '#8a5a3b'; c.stroke();
        rrect(c, x - 14, y - 20, 28, 8, 3); c.fillStyle = '#c8966a'; c.fill(); c.strokeStyle = OUT; c.lineWidth = 1; c.stroke();
        rrect(c, x - 12, y - 48, 24, 30, 5); c.fillStyle = '#c8966a'; c.fill(); c.stroke(); rrect(c, x - 9, y - 44, 18, 22, 4); c.fillStyle = '#f5d0dc'; c.fill();
        for (const sd of [-1, 1]) line(c, [x + sd * 12, y - 14], [x + sd * 14, y - 4], '#8a5a3b', 2);
        c.restore();
        break;
      }
    }
  }
  const old = FURN.item;
  FURN.item = (c, k, t, r) => k.startsWith('x_') ? draw(c, k, t || 0) : old(c, k, t, r);
})();
