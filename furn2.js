// ================= Extra furniture (x_*) — shop & home =================
(() => {
  const { ell, rrect, shade, OUT } = ART, box = FURN.box, P = FURN.P;
  const poly = (c, pts, fill, st, lw) => { c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); if (fill) { c.fillStyle = fill; c.fill(); } if (st) { c.lineWidth = lw || 1.1; c.strokeStyle = st; c.stroke(); } };
  const line = (c, a, b, col, w) => { c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.strokeStyle = col; c.lineWidth = w || 1; c.stroke(); };
  const line2 = (c, a, b, col, w) => { c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.strokeStyle = col; c.lineWidth = w || 1; c.stroke(); };
  const leg = (c, x, y, h, col) => box(c, x, y, .07, .07, h, col || '#b98552');
  const emo = (c, e, x, y, s) => { c.font = (s || 12) + 'px sans-serif'; c.textAlign = 'center'; c.fillText(e, x, y); c.textAlign = 'start'; };

  Object.assign(FURN.DEF, {
    x_photozone: { w: 2, d: 1 }, x_gacha: { w: 1, d: 1 }, x_agility: { w: 2, d: 1 }, x_scale: { w: 1, d: 1 }, x_board: { w: 1, d: 1 }, x_balloon: { w: 1, d: 1 },
    x_monstera: { w: 1, d: 1 }, x_beanbag: { w: 1, d: 1 }, x_vending: { w: 1, d: 1 }, x_dresser: { w: 1, d: 1 }, x_island: { w: 2, d: 1 }, x_rocking: { w: 1, d: 1 }, x_pcdesk: { w: 2, d: 1 }, x_toilet: { w: 1, d: 1 }, x_shower: { w: 1, d: 1 }, x_petbowl: { w: 1, d: 1 },
    x_diffuser: { w: 1, d: 1 }, x_marbletable: { w: 1, d: 1 }, x_neoncat: { w: 1, d: 1 }, x_hammock: { w: 1, d: 1 }, x_greenhouse: { w: 1, d: 1 }, x_clock: { w: 1, d: 1 }, x_closet: { w: 2, d: 1 }, x_turntable: { w: 1, d: 1 }, x_showcase: { w: 2, d: 1 }, x_velvetsofa: { w: 2, d: 1 },
  });

  function draw(c, k, t) {
    switch (k) {
      case 'x_board': {
        // High-fidelity A-frame chalkboard sidewalk sign with floral garland & chalk art
        const [cx, cy] = P(.5, .5, 0);
        ell(c, cx, cy + 2, 18, 8, 'rgba(25,12,6,.22)');
        leg(c, .22, .42, 42, '#854d0e');
        leg(c, .78, .42, 42, '#854d0e');
        leg(c, .25, .58, 38, '#6b3c14');
        leg(c, .75, .58, 38, '#6b3c14');
        const q0 = P(.18, .5, 64), q1 = P(.82, .5, 64), q2 = P(.82, .5, 18), q3 = P(.18, .5, 18);
        poly(c, [q0, q1, q2, q3], '#1e2922', '#78350f', 3.5);
        const sp0 = P(.16, .52, 18), sp1 = P(.84, .52, 18);
        line(c, sp0, sp1, '#9a632a', 3);
        for (let i = 0; i <= 6; i++) {
          const gx = q0[0] + (q1[0] - q0[0]) * (i / 6), gy = q0[1] + (q1[1] - q0[1]) * (i / 6);
          ell(c, gx, gy - 2, 3, 2, i % 2 ? '#22c55e' : '#16a34a');
          if (i % 2 === 1) ell(c, gx, gy - 4, 2.5, 2.5, ['#f43f5e', '#facc15', '#f472b6'][i % 3]);
        }
        const [tx, ty] = P(.5, .5, 52);
        c.fillStyle = '#ffffff'; c.font = 'bold 8px sans-serif'; c.textAlign = 'center';
        c.fillText('🐾 PET TOWN', tx, ty - 4);
        c.fillStyle = '#fde047'; c.font = 'bold 7px sans-serif';
        c.fillText('♥ WELCOME ♥', tx, ty + 7);
        c.fillStyle = '#bae6fd'; c.font = '9px sans-serif';
        c.fillText('🦴', tx, ty + 19);
        c.textAlign = 'start';
        break;
      }
      case 'x_balloon': {
        // High-fidelity balloon bouquet with 3D gloss reflections, curled ribbons & satin gift box
        const [x, y] = P(.5, .5, 0);
        ell(c, x, y + 2, 16, 8, 'rgba(25,12,6,.22)');
        box(c, .36, .36, .28, .28, 8, '#ec4899', 0, { top: '#f472b6', left: '#db2777', right: '#be185d' });
        const [gx, gy] = P(.5, .5, 8);
        ell(c, gx, gy, 4, 2, '#fde047', OUT, .6);
        const bCols = [
          { c: '#f43f5e', g: '#fda4af', dx: -12, dy: -66, r: 9 },
          { c: '#0ea5e9', g: '#7dd3fc', dx: 11, dy: -68, r: 9 },
          { c: '#eab308', g: '#fef08a', dx: 0, dy: -78, r: 10 },
          { c: '#a855f7', g: '#d8b4fe', dx: -8, dy: -52, r: 8.5 },
          { c: '#10b981', g: '#6ee7b7', dx: 8, dy: -54, r: 8.5 }
        ];
        bCols.forEach((b, i) => {
          const sway = Math.sin(t * 2 + i * 1.5) * 2;
          const bx = x + b.dx + sway, by = y + b.dy;
          c.beginPath();
          c.moveTo(gx, gy);
          c.quadraticCurveTo(x + b.dx * .4, y - 25, bx, by + b.r + 2);
          c.strokeStyle = 'rgba(120,120,120,.7)'; c.lineWidth = 1; c.stroke();
          c.beginPath();
          c.moveTo(bx - 2, by + b.r + 2); c.lineTo(bx + 2, by + b.r + 2); c.lineTo(bx, by + b.r); c.closePath();
          c.fillStyle = b.c; c.fill();
          const grad = c.createRadialGradient(bx - b.r * .3, by - b.r * .3, 1, bx, by, b.r);
          grad.addColorStop(0, b.g); grad.addColorStop(0.7, b.c); grad.addColorStop(1, '#00000033');
          ell(c, bx, by, b.r, b.r * 1.15, grad, 'rgba(40,20,10,.3)', .8);
          c.save();
          c.translate(bx - b.r * .35, by - b.r * .35);
          c.rotate(-.4);
          ell(c, 0, 0, b.r * .35, b.r * .18, 'rgba(255,255,255,.75)');
          c.restore();
        });
        break;
      }
      case 'x_pcdesk': {
        // High-fidelity executive gaming / online shop manager desk with curved dual monitors & chair
        const [dcx, dcy] = P(1, .5, 0);
        ell(c, dcx, dcy + 2, 44, 20, 'rgba(25,12,6,.22)');
        for (const [x, y] of [[.12, .15], [1.82, .15], [.12, .78], [1.82, .78]]) leg(c, x, y, 30, '#475569');
        box(c, .06, .1, 1.88, .8, 4, '#e2cda8', 30, { top: '#f8eedb', left: '#cbaf83', right: '#ba9d70' });
        line2(c, P(.06, .1, 34), P(1.94, .1, 34), 'rgba(255,255,255,.55)', 1.2);
        box(c, 1.48, .16, .4, .62, 24, '#cbaf83');
        for (let r = 0; r < 2; r++) {
          const q = [P(1.5, .76, 22 - r * 11), P(1.86, .76, 22 - r * 11), P(1.86, .76, 13 - r * 11), P(1.5, .76, 13 - r * 11)];
          poly(c, q, '#e2cda8', '#8a5a2b', .9);
          ell(c, ...P(1.68, .77, 17.5 - r * 11), 2, 2, '#b8860b');
        }
        box(c, .64, .25, .16, .14, 12, '#334155', 34);
        box(c, .52, .2, .4, .24, 2, '#1e293b', 34);
        const scr = [P(.32, .3, 80), P(1.12, .3, 80), P(1.12, .3, 46), P(.32, .3, 46)];
        poly(c, scr, '#0f172a', OUT, 1.4);
        const inScr = [P(.36, .3, 77), P(1.08, .3, 77), P(1.08, .3, 49), P(.36, .3, 49)];
        const gScr = c.createLinearGradient(inScr[0][0], inScr[0][1], inScr[2][0], inScr[2][1]);
        gScr.addColorStop(0, '#0284c7'); gScr.addColorStop(0.5, '#38bdf8'); gScr.addColorStop(1, '#818cf8');
        poly(c, inScr, gScr);
        const [sx, sy] = P(.72, .3, 65);
        c.font = 'bold 7px sans-serif'; c.textAlign = 'center'; c.fillStyle = '#ffffff';
        c.fillText('📦 PET ORDERS', sx, sy - 2);
        const blink = .5 + .5 * Math.sin(t * 5);
        c.fillStyle = `rgba(52,211,153,${blink})`; c.fillText('● LIVE ONLINE', sx, sy + 7);
        c.textAlign = 'start';
        poly(c, [P(.45, .5, 34.2), P(.92, .5, 34.2), P(.92, .68, 34.2), P(.45, .68, 34.2)], '#1e293b', null);
        poly(c, [P(.48, .52, 34.4), P(.89, .52, 34.4), P(.89, .66, 34.4), P(.48, .66, 34.4)], '#38bdf8', '#0ea5e9', .8);
        ell(c, ...P(1.05, .58, 34.5), 3, 2, '#e2e8f0', OUT, .7);
        const [mx, my] = P(1.3, .38, 34.5);
        rrect(c, mx - 4, my - 9, 8, 9, 2); c.fillStyle = '#f43f5e'; c.fill(); c.strokeStyle = OUT; c.lineWidth = .8; c.stroke();
        ell(c, mx, my - 9, 3.5, 1.8, '#fff'); ell(c, mx, my - 9, 2.5, 1.2, '#78350f');
        const [cx, cy] = P(.72, 1.05, 0);
        ell(c, cx, cy, 14, 6, '#334155');
        rrect(c, cx - 2, cy - 18, 4, 18, 1); c.fillStyle = '#64748b'; c.fill();
        ell(c, cx, cy - 19, 13, 6, '#0f172a', OUT, 1.1);
        rrect(c, cx - 11, cy - 42, 22, 24, 4); c.fillStyle = '#1e293b'; c.fill(); c.strokeStyle = OUT; c.lineWidth = 1; c.stroke();
        rrect(c, cx - 9, cy - 40, 18, 20, 2); c.fillStyle = '#334155'; c.fill();
        rrect(c, cx - 7, cy - 47, 14, 5, 2); c.fillStyle = '#475569'; c.fill();
        break;
      }
      case 'x_diffuser': {
        // Luxury aroma reed diffuser on solid oak stand with floral tulip bud vase
        const [cx, cy] = P(.5, .5, 0);
        ell(c, cx, cy + 1, 14, 7, 'rgba(25,12,6,.22)');
        box(c, .25, .25, .5, .5, 26, '#854d0e', 0, { top: '#d4a373', left: '#a16207', right: '#713f12' });
        const [bx, by] = P(.42, .45, 26);
        rrect(c, bx - 6, by - 12, 12, 12, 2);
        c.fillStyle = 'rgba(254,243,199,.75)'; c.fill();
        c.strokeStyle = '#b45309'; c.lineWidth = 1; c.stroke();
        rrect(c, bx - 3, by - 15, 6, 3, 1); c.fillStyle = '#f59e0b'; c.fill();
        for (const ang of [-.35, -.15, .05, .28]) {
          line(c, [bx, by - 15], [bx + ang * 32, by - 36], '#b45309', 1.4);
        }
        for (let i = 0; i < 3; i++) {
          const fx = bx + Math.sin(t * 3 + i * 2) * 8, fy = by - 40 - i * 6;
          ell(c, fx, fy, 1.5, 1.5, 'rgba(244,114,182,.85)');
        }
        const [vx, vy] = P(.68, .55, 26);
        ell(c, vx, vy, 4, 2, 'rgba(0,0,0,.15)');
        rrect(c, vx - 3, vy - 10, 6, 10, 2); c.fillStyle = '#ffffff'; c.fill(); c.strokeStyle = OUT; c.lineWidth = .7; c.stroke();
        line(c, [vx, vy - 10], [vx + 1, vy - 16], '#22c55e', 1.2);
        ell(c, vx + 1, vy - 17, 3.5, 3.5, '#f472b6', OUT, .6);
        break;
      }
      case 'x_marbletable': {
        // High-end round Carrara marble tea table with brushed brass tripod legs
        const [cx, cy] = P(.5, .5, 0);
        ell(c, cx, cy + 2, 22, 11, 'rgba(25,12,6,.22)');
        for (let i = 0; i < 3; i++) {
          const a = i * Math.PI * 2 / 3 + .3;
          const lx = cx + Math.cos(a) * 11, ly = cy + Math.sin(a) * 5.5;
          line(c, [lx, ly], [cx + Math.cos(a) * 4, cy - 22], '#d4a23d', 2.4);
          ell(c, lx, ly, 2, 1, '#9e6d2b');
        }
        const ty = cy - 23;
        ell(c, cx, ty + 2, 18, 9, '#b8b2a7', OUT, 1.2);
        ell(c, cx, ty, 18, 9, '#f8fafc', OUT, 1.2);
        c.beginPath();
        c.moveTo(cx - 10, ty + 2); c.quadraticCurveTo(cx - 2, ty - 3, cx + 8, ty - 1);
        c.moveTo(cx - 4, ty + 4); c.quadraticCurveTo(cx + 4, ty + 1, cx + 11, ty + 3);
        c.strokeStyle = 'rgba(148,163,184,.4)'; c.lineWidth = 1; c.stroke();
        ell(c, cx - 5, ty - 2, 5, 2.5, '#ffffff', 'rgba(180,140,80,.4)', .8);
        ell(c, cx - 5, ty - 3, 3, 1.5, '#b45309');
        ell(c, cx + 6, ty - 1, 6, 3, '#fbcfe8', OUT, .7);
        ell(c, cx + 5, ty - 3, 3, 2, '#38bdf8');
        ell(c, cx + 7, ty - 3, 3, 2, '#f472b6');
        break;
      }
      case 'x_neoncat': {
        // Glowing LED Neon Cat Sign mounted on transparent acrylic stand
        const [cx, cy] = P(.5, .5, 0);
        ell(c, cx, cy + 1, 14, 7, 'rgba(25,12,6,.22)');
        box(c, .25, .4, .5, .2, 6, '#1e293b');
        line(c, [cx, cy - 4], [cx, cy - 26], '#94a3b8', 2.2);
        const ny = cy - 44;
        rrect(c, cx - 18, ny - 16, 36, 32, 6);
        c.fillStyle = 'rgba(255,255,255,.15)'; c.fill();
        c.strokeStyle = 'rgba(255,255,255,.4)'; c.lineWidth = .9; c.stroke();
        const on = .8 + .2 * Math.sin(t * 4);
        const glow = c.createRadialGradient(cx, ny, 2, cx, ny, 32);
        glow.addColorStop(0, `rgba(244,114,182,${.5 * on})`);
        glow.addColorStop(1, 'rgba(244,114,182,0)');
        c.fillStyle = glow; c.fillRect(cx - 32, ny - 32, 64, 64);
        c.save();
        c.strokeStyle = `rgba(255,105,180,${on})`; c.lineWidth = 2.4; c.lineCap = 'round';
        c.beginPath();
        c.moveTo(cx - 13, ny); c.lineTo(cx - 13, ny - 12); c.lineTo(cx - 5, ny - 8);
        c.lineTo(cx + 5, ny - 8);
        c.lineTo(cx + 13, ny - 12); c.lineTo(cx + 13, ny);
        c.quadraticCurveTo(cx + 14, ny + 10, cx, ny + 12);
        c.quadraticCurveTo(cx - 14, ny + 10, cx - 13, ny);
        c.stroke();
        c.lineWidth = 1.4;
        c.beginPath();
        c.moveTo(cx - 12, ny + 1); c.lineTo(cx - 5, ny + 2);
        c.moveTo(cx - 12, ny + 5); c.lineTo(cx - 5, ny + 4);
        c.moveTo(cx + 12, ny + 1); c.lineTo(cx + 5, ny + 2);
        c.moveTo(cx + 12, ny + 5); c.lineTo(cx + 5, ny + 4);
        c.stroke();
        ell(c, cx, ny + 3, 2, 1.5, '#fef08a');
        c.restore();
        break;
      }
      case 'x_hammock': {
        // Natural birch wood tripod frame pet hammock with cozy sleeping cat cushion
        const [cx, cy] = P(.5, .5, 0);
        ell(c, cx, cy + 2, 22, 11, 'rgba(25,12,6,.22)');
        const p1 = P(.15, .15, 0), p2 = P(.85, .15, 0), p3 = P(.15, .85, 0), p4 = P(.85, .85, 0);
        const topH = 34;
        const top1 = P(.25, .5, topH), top2 = P(.75, .5, topH);
        line(c, p1, top1, '#854d0e', 3);
        line(c, p3, top1, '#a16207', 3);
        line(c, p2, top2, '#854d0e', 3);
        line(c, p4, top2, '#a16207', 3);
        line(c, top1, top2, '#713f12', 3.2);
        ell(c, top1[0], top1[1], 2.5, 2.5, '#d4a373');
        ell(c, top2[0], top2[1], 2.5, 2.5, '#d4a373');
        const hy = cy - 14;
        c.beginPath();
        c.moveTo(top1[0], top1[1]);
        c.quadraticCurveTo(cx - 10, hy + 10, cx, hy + 12);
        c.quadraticCurveTo(cx + 10, hy + 10, top2[0], top2[1]);
        c.strokeStyle = '#d4d4d8'; c.lineWidth = 1.4; c.stroke();
        c.beginPath();
        c.ellipse(cx, hy + 2, 16, 8, 0, 0, Math.PI * 2);
        c.fillStyle = '#fef3c7'; c.fill();
        c.strokeStyle = '#b45309'; c.lineWidth = 1; c.stroke();
        ell(c, cx, hy + 1, 12, 6, '#fda4af', '#f43f5e', .8);
        const ballSway = Math.sin(t * 3) * 3;
        line(c, [cx, top1[1] + 2], [cx + ballSway, top1[1] + 16], '#94a3b8', 1);
        ell(c, cx + ballSway, top1[1] + 17, 3.5, 3.5, '#38bdf8', OUT, .7);
        break;
      }
      case 'x_greenhouse': {
        // Victorian gold brass terrarium greenhouse with lush succulents & orchids
        const [cx, cy] = P(.5, .5, 0);
        ell(c, cx, cy + 2, 20, 10, 'rgba(25,12,6,.22)');
        box(c, .15, .15, .7, .7, 8, '#b45309', 0, { top: '#fde047', left: '#d97706', right: '#92400e' });
        box(c, .18, .18, .64, .64, 4, '#451a03', 8, { top: '#713f12' });
        for (const [sx, sy, col] of [[.32, .35, '#10b981'], [.65, .32, '#059669'], [.48, .58, '#34d399']]) {
          const sp = P(sx, sy, 12);
          ell(c, sp[0], sp[1], 5, 5, col, OUT, .6);
          ell(c, sp[0], sp[1] - 4, 2.5, 2.5, '#f472b6');
        }
        poly(c, [P(.18, .18, 36), P(.82, .18, 36), P(.82, .18, 12), P(.18, .18, 12)], 'rgba(224,242,254,.45)', '#d97706', 1.4);
        poly(c, [P(.82, .18, 36), P(.82, .82, 36), P(.82, .82, 12), P(.82, .18, 12)], 'rgba(224,242,254,.35)', '#b45309', 1.4);
        const roofPeak = P(.5, .5, 48);
        c.beginPath();
        c.moveTo(P(.18, .18, 36)[0], P(.18, .18, 36)[1]);
        c.lineTo(roofPeak[0], roofPeak[1]);
        c.lineTo(P(.82, .18, 36)[0], P(.82, .18, 36)[1]);
        c.strokeStyle = '#f59e0b'; c.lineWidth = 1.6; c.stroke();
        line(c, P(.25, .25, 34), P(.6, .45, 16), 'rgba(255,255,255,.6)', 1.5);
        break;
      }
      case 'x_clock': {
        // Grandfather pendulum standing clock in polished mahogany with swinging pendulum
        const [cx, cy] = P(.5, .5, 0);
        ell(c, cx, cy + 2, 18, 9, 'rgba(25,12,6,.24)');
        box(c, .2, .2, .6, .6, 12, '#451a03', 0, { top: '#78350f', left: '#5c2406', right: '#3b1202' });
        box(c, .24, .24, .52, .52, 42, '#5c2406', 12, { top: '#78350f', left: '#451a03', right: '#3b1202' });
        const [wx, wy] = P(.5, .76, 28);
        rrect(c, wx - 7, wy - 14, 14, 22, 2);
        c.fillStyle = 'rgba(224,242,254,.5)'; c.fill();
        c.strokeStyle = '#b45309'; c.lineWidth = 1; c.stroke();
        const pendSway = Math.sin(t * 3.5) * 4;
        line(c, [wx, wy - 12], [wx + pendSway, wy + 2], '#d4a23d', 1.8);
        ell(c, wx + pendSway, wy + 3, 3.5, 3.5, '#fde047', OUT, .7);
        box(c, .18, .18, .64, .64, 22, '#451a03', 54, { top: '#78350f', left: '#5c2406', right: '#3b1202' });
        const [dx, dy] = P(.5, .82, 65);
        ell(c, dx, dy, 9, 9, '#fffbeb', '#92400e', 1.5);
        line(c, [dx, dy], [dx, dy - 5], '#0f172a', 1.4);
        line(c, [dx, dy], [dx + 4, dy - 2], '#0f172a', 1.1);
        ell(c, dx, dy, 1, 1, '#b45309');
        c.beginPath();
        c.arc(P(.5, .5, 76)[0], P(.5, .5, 76)[1], 6, Math.PI, 0);
        c.fillStyle = '#78350f'; c.fill(); c.strokeStyle = OUT; c.lineWidth = 1; c.stroke();
        break;
      }
      case 'x_velvetsofa': {
        // French romantic 2x1 tufted velvet sofa with gold legs & throw pillow
        const [cx, cy] = P(1, .5, 0);
        ell(c, cx, cy + 2, 44, 20, 'rgba(25,12,6,.22)');
        for (const [lx, ly] of [[.18, .2], [1.82, .2], [.18, .8], [1.82, .8]]) {
          box(c, lx - .03, ly - .03, .06, .06, 8, '#78350f');
          const [bx, by] = P(lx, ly, 0);
          ell(c, bx, by, 2.5, 1.5, '#facc15');
        }
        box(c, .1, .14, 1.8, .72, 12, '#9d174d', 8, { top: '#db2777', left: '#be185d', right: '#831843' });
        box(c, .12, .16, .86, .68, 6, '#f472b6', 20, { top: '#fbcfe8', left: '#ec4899', right: '#db2777' });
        box(c, 1.02, .16, .86, .68, 6, '#f472b6', 20, { top: '#fbcfe8', left: '#ec4899', right: '#db2777' });
        box(c, .1, .14, 1.8, .18, 28, '#be185d', 14, { top: '#f472b6', left: '#9d174d', right: '#831843' });
        box(c, .08, .14, .14, .72, 18, '#be185d', 14, { top: '#f472b6' });
        box(c, 1.78, .14, .14, .72, 18, '#be185d', 14, { top: '#f472b6' });
        for (let i = 0; i < 6; i++) {
          const bp = P(.26 + i * .28, .22, 33);
          ell(c, bp[0], bp[1], 2, 2, '#831843', '#ffffff', .6);
        }
        const [px, py] = P(1.6, .45, 27);
        rrect(c, px - 6, py - 6, 12, 12, 3);
        c.fillStyle = '#6ee7b7'; c.fill(); c.strokeStyle = '#059669'; c.lineWidth = .9; c.stroke();
        break;
      }
      case 'x_showcase': {
        // High-end 2x1 glass pastry showcase with macarons, shortcake, and gold trim
        const [cx, cy] = P(1, .5, 0);
        ell(c, cx, cy + 2, 44, 20, 'rgba(25,12,6,.22)');
        box(c, .08, .16, 1.84, .68, 16, '#5c2406', 0, { top: '#f5efe6', left: '#451a03', right: '#3b1202' });
        box(c, .1, .18, 1.8, .64, 30, 'rgba(224,242,254,.35)', 16, { top: 'rgba(255,255,255,.5)' });
        line2(c, P(.1, .82, 16), P(1.9, .82, 16), '#d97706', 2);
        line2(c, P(.1, .82, 46), P(1.9, .82, 46), '#d97706', 2);
        poly(c, [P(.12, .2, 30), P(1.88, .2, 30), P(1.88, .8, 30), P(.12, .8, 30)], 'rgba(255,255,255,.55)', '#38bdf8', 1);
        const macCols = ['#f472b6', '#38bdf8', '#facc15', '#a78bfa', '#4ade80'];
        for (let i = 0; i < 5; i++) {
          const mp = P(.3 + i * .35, .5, 31);
          ell(c, mp[0], mp[1], 4, 3, macCols[i], OUT, .7);
          ell(c, mp[0], mp[1] - 1, 3, 1.5, '#ffffff');
        }
        for (let i = 0; i < 4; i++) {
          const cp = P(.38 + i * .4, .52, 17);
          rrect(c, cp[0] - 5, cp[1] - 5, 10, 6, 1.5);
          c.fillStyle = '#fffbeb'; c.fill(); c.strokeStyle = '#d97706'; c.lineWidth = .7; c.stroke();
          ell(c, cp[0], cp[1] - 6, 2, 2, '#ef4444');
        }
        line(c, P(.18, .82, 42), P(.6, .82, 20), 'rgba(255,255,255,.65)', 1.6);
        break;
      }
      case 'x_closet': {
        // High-fidelity French country pet wardrobe closet with hanging outfits & accessories
        const [cx, cy] = P(1, .5, 0);
        ell(c, cx, cy + 2, 44, 20, 'rgba(25,12,6,.22)');
        box(c, .08, .15, 1.84, .7, 60, '#fdfaf5', 0, { top: '#f5ece1', left: '#e8dbcd', right: '#dcc6b3' });
        box(c, .05, .12, 1.9, .76, 4, '#e8dbcd', 60);
        const railL = P(.25, .5, 52), railR = P(1.75, .5, 52);
        line(c, railL, railR, '#94a3b8', 2.4);
        const coatCols = ['#f43f5e', '#3b82f6', '#facc15', '#10b981', '#ec4899'];
        for (let i = 0; i < 5; i++) {
          const k = .18 + i * .18;
          const hx = railL[0] + (railR[0] - railL[0]) * k;
          const hy = railL[1] + (railR[1] - railL[1]) * k;
          c.beginPath(); c.moveTo(hx - 5, hy + 3); c.lineTo(hx, hy); c.lineTo(hx + 5, hy + 3);
          c.strokeStyle = '#b45309'; c.lineWidth = 1.4; c.stroke();
          rrect(c, hx - 5, hy + 3, 10, 16, 2);
          c.fillStyle = coatCols[i]; c.fill(); c.strokeStyle = OUT; c.lineWidth = .8; c.stroke();
          ell(c, hx, hy + 6, 2, 1.5, '#ffffff');
          ell(c, hx, hy + 10, 1, 1, '#ffffff');
        }
        box(c, .12, .2, 1.76, .6, 3, '#e8dbcd', 10);
        emo(c, '🎀', ...P(.45, .5, 12), 10);
        emo(c, '🧢', ...P(1.0, .5, 12), 10);
        emo(c, '👟', ...P(1.5, .5, 12), 10);
        break;
      }
      case 'x_turntable': {
        // Vintage Hi-Fi audiophile turntable with spinning vinyl record and glowing vacuum tubes
        const [cx, cy] = P(.5, .5, 0);
        ell(c, cx, cy + 2, 18, 9, 'rgba(25,12,6,.22)');
        box(c, .15, .15, .7, .7, 14, '#451a03', 0, { top: '#78350f', left: '#5c2406', right: '#3b1202' });
        for (const [fx, fy] of [[.2, .2], [.8, .2], [.2, .8], [.8, .8]]) {
          const fp = P(fx, fy, 0); ell(c, fp[0], fp[1], 2, 1.5, '#fde047');
        }
        const [px, py] = P(.45, .45, 14.5);
        ell(c, px, py, 11, 6, '#0f172a', OUT, 1.1);
        ell(c, px, py, 8, 4, '#1e293b');
        ell(c, px, py, 4, 2, '#ef4444');
        ell(c, px, py, 1, 1, '#fde047');
        const [armX, armY] = P(.75, .35, 16);
        c.beginPath(); c.moveTo(armX, armY); c.lineTo(px + 4, py - 1);
        c.strokeStyle = '#e2e8f0'; c.lineWidth = 1.6; c.stroke();
        ell(c, armX, armY, 2.5, 2.5, '#94a3b8');
        for (let i = 0; i < 2; i++) {
          const [tx, ty] = P(.72, .6 + i * .16, 14.5);
          rrect(c, tx - 2, ty - 6, 4, 6, 1.5);
          c.fillStyle = 'rgba(254,243,199,.7)'; c.fill();
          c.strokeStyle = '#f59e0b'; c.lineWidth = .8; c.stroke();
          ell(c, tx, ty - 3, 1, 1, '#fde047');
        }
        const noteY = py - 18 + Math.sin(t * 3) * 3;
        c.font = '10px sans-serif'; c.fillStyle = '#f59e0b'; c.fillText('♪', px + 10, noteY);
        break;
      }
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
