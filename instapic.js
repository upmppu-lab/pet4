// ================= Instagram photos: varied, species-appropriate scenes =================
(() => {
  const { ell, rrect, shade } = ART;
  const rngOf = seed => { let x = (seed * 9301 + 49297) % 233280; return () => { x = (x * 9301 + 49297) % 233280; return x / 233280; }; };
  const R2 = (c, x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
  const RR = (c, x, y, w, h, r, col, st) => { rrect(c, x, y, w, h, r); c.fillStyle = col; c.fill(); if (st) { c.lineWidth = 2; c.strokeStyle = st; c.stroke(); } };
  const grad = (c, y0, y1, a, b) => { const g = c.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, a); g.addColorStop(1, b); return g; };
  const emoji = (c, e, x, y, s) => { c.font = (s || 28) + 'px sans-serif'; c.textAlign = 'center'; c.fillText(e, x, y); c.textAlign = 'start'; };
  const OUTL = 'rgba(60,38,25,.55)';
  // ---------- backgrounds ----------
  function wallFloor(c, wall, stripe, floor, R) {
    R2(c, 0, 0, 320, 205, wall); c.fillStyle = stripe; for (let x = 0; x < 320; x += 40) c.fillRect(x, 0, 18, 205);
    R2(c, 0, 150, 320, 55, shade(wall, -.06)); R2(c, 0, 148, 320, 5, shade(wall, -.2));
    R2(c, 0, 205, 320, 115, floor); c.fillStyle = 'rgba(0,0,0,.07)'; for (let y = 215; y < 320; y += 22) c.fillRect(0, y, 320, 2);
    for (let i = 0; i < 6; i++) { c.fillStyle = 'rgba(0,0,0,.05)'; c.fillRect(R() * 300, 210 + i * 18, 60, 2); }
  }
  function windowAt(c, x, y, w, h, night) {
    RR(c, x - 6, y - 6, w + 12, h + 12, 6, '#fff');
    c.fillStyle = night ? grad(c, y, y + h, '#2c3566', '#5a5f9a') : grad(c, y, y + h, '#9fd4f5', '#e1f3fd'); c.fillRect(x, y, w, h);
    if (night) { emoji(c, '🌙', x + w * .72, y + h * .4, 22); c.fillStyle = '#fff'; for (let i = 0; i < 6; i++) c.fillRect(x + (i * 37 % w), y + (i * 23 % h), 2, 2); }
    else { ell(c, x + w * .3, y + h * .35, 16, 7, '#fff'); ell(c, x + w * .45, y + h * .3, 12, 8, '#fff'); }
    c.fillStyle = '#fff'; c.fillRect(x + w / 2 - 2, y, 4, h); c.fillRect(x, y + h / 2 - 2, w, 4);
  }
  function sofa(c, x, y, col) { RR(c, x, y, 190, 60, 18, col); RR(c, x - 8, y - 34, 206, 46, 18, shade(col, -.08)); RR(c, x - 16, y - 10, 30, 70, 12, shade(col, -.15)); RR(c, x + 176, y - 10, 30, 70, 12, shade(col, -.15)); RR(c, x + 40, y - 20, 34, 26, 8, '#fff6e8'); }
  function plant(c, x, y) { RR(c, x - 16, y - 34, 32, 34, 6, '#c9855a'); for (const [dx, a] of [[-10, -1], [0, 0], [10, 1]]) { c.beginPath(); c.moveTo(x, y - 30); c.quadraticCurveTo(x + dx * 2 + a * 10, y - 70, x + dx * 3, y - 92); c.lineWidth = 7; c.strokeStyle = '#5aa048'; c.lineCap = 'round'; c.stroke(); } }
  function frameArt(c, x, y, e) { RR(c, x, y, 54, 44, 4, '#c8963f'); R2(c, x + 5, y + 5, 44, 34, '#fff5e8'); emoji(c, e, x + 27, y + 32, 22); }
  function sky(c, top, bot, h) { c.fillStyle = grad(c, 0, h, top, bot); c.fillRect(0, 0, 320, h); }
  function cloud(c, x, y, k) { for (const [dx, dy, r] of [[0, 0, 16], [16, -6, 18], [34, 0, 14], [18, 6, 14]]) ell(c, x + dx * k, y + dy * k, r * k, r * .8 * k, 'rgba(255,255,255,.95)'); }
  function tree(c, x, y, k, col) { RR(c, x - 5 * k, y - 40 * k, 10 * k, 40 * k, 3, '#8a5a3b'); for (const [dx, dy, r] of [[-14, -48, 18], [14, -48, 18], [0, -64, 22]]) ell(c, x + dx * k, y + dy * k, r * k, r * .9 * k, col); }
  function flowers(c, R, y0, y1, n) { const cols = ['#f28ca6', '#f7c948', '#ffffff', '#b59be0', '#ff9e6d']; for (let i = 0; i < n; i++) { const x = R() * 320, y = y0 + R() * (y1 - y0); ell(c, x, y, 5, 5, cols[i % 5]); ell(c, x, y, 2, 2, '#fff3b0'); } }
  const BG = {
    living(c, R, v) {
      const pal = [['#fbe1e6', '#f5d0d9', '#d9b48a', '#e07a5f'], ['#dff0e6', '#cfe7da', '#c99b6b', '#6d9dc5'], ['#e6ecfb', '#d7def5', '#b8906a', '#b59be0'], ['#f6ead6', '#efdcc0', '#a8784f', '#90be6d']][v % 4];
      wallFloor(c, pal[0], pal[1], pal[2], R); windowAt(c, 214, 32, 78, 70, R() < .25); frameArt(c, 40, 40, ['🌸', '🐾', '🌈', '⭐'][v % 4]);
      sofa(c, 30, 150, pal[3]); plant(c, 292, 212); ell(c, 170, 270, 110, 26, 'rgba(255,255,255,.45)');
    },
    bedroom(c, R, v) {
      wallFloor(c, ['#d8d4f2', '#cfe1f2', '#f2d6e4'][v % 3], 'rgba(255,255,255,.25)', '#b08a70', R); windowAt(c, 30, 30, 80, 70, true);
      RR(c, 150, 120, 170, 70, 10, '#e8c49a'); RR(c, 150, 110, 20, 90, 6, '#c8966a'); RR(c, 175, 118, 50, 26, 10, '#fff'); RR(c, 215, 128, 105, 60, 10, ['#9cc7e8', '#f4a7b9', '#b9a7e8'][v % 3]);
      const g = c.createRadialGradient(125, 110, 4, 125, 110, 90); g.addColorStop(0, 'rgba(255,230,150,.55)'); g.addColorStop(1, 'rgba(255,230,150,0)'); c.fillStyle = g; c.fillRect(20, 20, 220, 200);
      RR(c, 116, 110, 18, 60, 3, '#d9c9a8'); c.beginPath(); c.moveTo(108, 112); c.lineTo(142, 112); c.lineTo(134, 88); c.lineTo(116, 88); c.closePath(); c.fillStyle = '#ffe6a8'; c.fill();
      c.fillStyle = 'rgba(30,20,70,.18)'; c.fillRect(0, 0, 320, 320); emoji(c, '💤', 270, 70, 26);
    },
    park(c, R, v) {
      sky(c, '#8fd0f5', '#dff3fb', 190); emoji(c, '☀️', 270, 50, 34); cloud(c, 40, 50, 1); cloud(c, 170, 30, .8);
      for (let x = -10; x < 330; x += 46) tree(c, x, 172, .9, x % 92 ? '#6fb85a' : '#5aa048');
      R2(c, 0, 170, 320, 150, '#9fcf6e'); c.fillStyle = '#e8dcc0'; c.beginPath(); c.moveTo(120, 170); c.lineTo(200, 170); c.lineTo(320, 320); c.lineTo(40, 320); c.closePath(); c.fill();
      flowers(c, R, 180, 310, 26); if (v % 2) { RR(c, 10, 200, 90, 10, 3, '#a8784f'); RR(c, 10, 184, 90, 8, 3, '#a8784f'); R2(c, 18, 208, 6, 24, '#6b4a2e'); R2(c, 86, 208, 6, 24, '#6b4a2e'); }
    },
    beach(c, R) {
      sky(c, '#7cc8f2', '#d9f1fb', 150); emoji(c, '☀️', 60, 50, 36); cloud(c, 190, 40, .9);
      R2(c, 0, 140, 320, 60, '#3aa0d9'); c.fillStyle = 'rgba(255,255,255,.6)'; for (let x = 0; x < 320; x += 30) c.fillRect(x + (R() * 10), 150 + R() * 40, 18, 3);
      c.fillStyle = grad(c, 190, 320, '#f7e1b5', '#eed09a'); c.fillRect(0, 190, 320, 130); c.beginPath(); c.moveTo(0, 196); for (let x = 0; x <= 320; x += 20) c.quadraticCurveTo(x + 10, 188, x + 20, 196); c.lineTo(320, 200); c.lineTo(0, 200); c.fillStyle = 'rgba(255,255,255,.8)'; c.fill();
      c.fillStyle = '#7a5a3a'; c.fillRect(262, 120, 4, 110); c.beginPath(); c.moveTo(200, 128); c.quadraticCurveTo(264, 70, 328, 128); c.closePath(); c.fillStyle = '#ff7a7a'; c.fill(); emoji(c, '🐚', 40, 300, 20); emoji(c, '⭐', 290, 290, 18);
    },
    snow(c, R) {
      sky(c, '#c9dcef', '#eef5fb', 190); for (let x = -10; x < 330; x += 60) { c.beginPath(); c.moveTo(x, 180); c.lineTo(x + 26, 110); c.lineTo(x + 52, 180); c.closePath(); c.fillStyle = '#3f7a5a'; c.fill(); ell(c, x + 26, 118, 10, 5, '#fff'); }
      R2(c, 0, 175, 320, 145, '#f6fafe'); for (let i = 0; i < 12; i++) ell(c, R() * 320, 190 + R() * 120, 30, 6, 'rgba(180,200,225,.35)');
      ell(c, 40, 250, 26, 26, '#fff', '#cdd9e6', 2); ell(c, 40, 208, 18, 18, '#fff', '#cdd9e6', 2); emoji(c, '🥕', 50, 214, 12); RR(c, 28, 184, 24, 8, 2, '#333');
      c.fillStyle = '#fff'; for (let i = 0; i < 40; i++) { ell(c, R() * 320, R() * 300, 2.2, 2.2, '#fff'); }
    },
    blossom(c, R) {
      sky(c, '#bfe3f7', '#fdf0f5', 180); for (let x = 10; x < 330; x += 80) { RR(c, x - 5, 110, 10, 70, 3, '#7a4a38'); for (const [dx, dy, r] of [[0, -10, 34], [-26, 6, 24], [26, 6, 24]]) ell(c, x + dx, 110 + dy, r, r * .8, '#ffc2d4'); }
      R2(c, 0, 175, 320, 145, '#a9d98a'); flowers(c, R, 180, 320, 30); c.fillStyle = '#ffb3c7'; for (let i = 0; i < 26; i++) ell(c, R() * 320, R() * 300, 3, 2, '#ffb3c7');
    },
    cafe(c, R) {
      R2(c, 0, 0, 320, 205, '#c9785a'); c.fillStyle = 'rgba(255,255,255,.18)'; for (let y = 0; y < 205; y += 16) for (let x = (y / 16) % 2 ? 0 : 20; x < 320; x += 40) c.fillRect(x, y, 36, 2), c.fillRect(x, y, 2, 14);
      RR(c, 20, 30, 110, 80, 6, '#2e3a33'); c.fillStyle = '#fff'; c.font = 'bold 14px sans-serif'; c.fillText('MENU', 50, 55); c.font = '11px sans-serif'; c.fillText('☕ latte  ·  🧁 cake', 28, 80); c.fillText('🐾 pup cup', 45, 98);
      for (const x of [200, 280]) { c.strokeStyle = '#333'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, 0); c.lineTo(x, 40); c.stroke(); c.beginPath(); c.moveTo(x - 18, 56); c.lineTo(x, 36); c.lineTo(x + 18, 56); c.closePath(); c.fillStyle = '#333'; c.fill(); ell(c, x, 60, 8, 6, 'rgba(255,220,120,.9)'); }
      R2(c, 0, 205, 320, 115, '#8a5a3b'); RR(c, 210, 170, 110, 14, 6, '#f3e3c7'); R2(c, 262, 184, 8, 70, '#5b3a22'); emoji(c, '☕', 240, 168, 24); emoji(c, '🧁', 290, 168, 22);
    },
    bath(c, R) {
      R2(c, 0, 0, 320, 205, '#e3f4fb'); c.strokeStyle = 'rgba(120,170,200,.35)'; c.lineWidth = 1; for (let x = 0; x < 320; x += 32) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, 205); c.stroke(); } for (let y = 0; y < 205; y += 32) { c.beginPath(); c.moveTo(0, y); c.lineTo(320, y); c.stroke(); }
      R2(c, 0, 205, 320, 115, '#cfe6ee'); RR(c, 150, 140, 170, 90, 30, '#fff', '#bcd'); for (let i = 0; i < 14; i++) ell(c, 170 + R() * 140, 140 + R() * 14, 10 + R() * 10, 8 + R() * 6, 'rgba(255,255,255,.95)', 'rgba(170,200,220,.8)', 1);
      RR(c, 30, 40, 16, 110, 4, '#ff9ec0'); emoji(c, '🦆', 190, 136, 22); emoji(c, '🫧', 60, 190, 26); emoji(c, '🫧', 280, 60, 22);
    },
    kitchen(c, R) {
      R2(c, 0, 0, 320, 205, '#fff4e3'); c.fillStyle = '#e8d5bb'; for (let x = 0; x < 320; x += 24) for (let y = 90; y < 150; y += 12) c.fillRect(x + ((y / 12) % 2) * 12, y, 22, 10);
      RR(c, 0, 20, 320, 60, 4, '#f3d9b5'); c.strokeStyle = 'rgba(120,80,40,.35)'; for (let x = 80; x < 320; x += 80) { c.beginPath(); c.moveTo(x, 20); c.lineTo(x, 80); c.stroke(); }
      RR(c, 0, 150, 320, 58, 2, '#f3d9b5'); R2(c, 0, 146, 320, 8, '#fff'); R2(c, 0, 208, 320, 112, '#e0cdb4');
      emoji(c, '🍎', 60, 142, 20); emoji(c, '🥛', 100, 142, 20); RR(c, 200, 262, 70, 20, 10, '#ff9ec0'); ell(c, 235, 262, 32, 7, '#b8784a'); emoji(c, '🦴', 235, 262, 14);
    },
    party(c, R) {
      R2(c, 0, 0, 320, 205, '#fde3ea'); for (let i = 0; i < 11; i++) { c.beginPath(); c.moveTo(i * 32, 22 + Math.sin(i) * 3); c.lineTo(i * 32 + 32, 22 + Math.sin(i + 1) * 3); c.lineTo(i * 32 + 16, 50); c.closePath(); c.fillStyle = ['#f28ca6', '#f7c948', '#6d9dc5', '#90be6d'][i % 4]; c.fill(); }
      R2(c, 0, 205, 320, 115, '#f3d9b5'); for (const [x, col] of [[40, '#ff7a9a'], [70, '#7ac7ff'], [280, '#ffd166']]) { ell(c, x, 90, 20, 24, col); c.strokeStyle = '#999'; c.beginPath(); c.moveTo(x, 114); c.quadraticCurveTo(x + 8, 150, x, 190); c.stroke(); }
      RR(c, 200, 160, 100, 12, 5, '#fff'); emoji(c, '🎂', 250, 158, 40); for (let i = 0; i < 30; i++) R2(c, R() * 320, R() * 320, 4, 4, ['#f28ca6', '#f7c948', '#6d9dc5', '#90be6d'][i % 4]);
    },
    vet(c, R) {
      R2(c, 0, 0, 320, 205, '#e9f6f1'); RR(c, 30, 30, 70, 70, 10, '#fff'); R2(c, 57, 42, 16, 46, '#5cc49a'); R2(c, 42, 57, 46, 16, '#5cc49a');
      RR(c, 150, 40, 140, 90, 6, '#fff', '#cfe7dd'); c.fillStyle = '#5a8a7a'; c.font = 'bold 13px sans-serif'; c.fillText('🩺 Pet Clinic', 170, 70); c.font = '11px sans-serif'; c.fillText('♥ healthy & happy', 172, 95);
      R2(c, 0, 205, 320, 115, '#d6ebe3'); RR(c, 110, 190, 200, 16, 6, '#c9d6e0'); emoji(c, '💊', 280, 180, 20);
    },
    studio(c, R, v) {
      const col = ['#ffd6e2', '#d6ecff', '#fff0c2', '#e6d6ff'][v % 4]; const g = c.createRadialGradient(160, 170, 20, 160, 170, 240); g.addColorStop(0, '#fff'); g.addColorStop(1, col); c.fillStyle = g; c.fillRect(0, 0, 320, 320);
      c.fillStyle = 'rgba(0,0,0,.05)'; c.beginPath(); c.moveTo(0, 230); c.quadraticCurveTo(160, 210, 320, 230); c.lineTo(320, 320); c.lineTo(0, 320); c.fill();
      emoji(c, '✨', 40, 60, 26); emoji(c, '🎀', 280, 70, 30); emoji(c, '💖', 50, 200, 20);
    },
    yard(c, R) {
      sky(c, '#a8dcf7', '#e6f6fd', 160); cloud(c, 200, 40, .9); for (let x = 0; x < 320; x += 22) { RR(c, x + 2, 110, 16, 70, 4, '#fff'); } R2(c, 0, 130, 320, 8, '#fff'); R2(c, 0, 160, 320, 8, '#fff');
      R2(c, 0, 180, 320, 140, '#9fcf6e'); flowers(c, R, 185, 320, 16);
      c.fillStyle = '#d98c8c'; c.beginPath(); c.moveTo(30, 150); c.lineTo(75, 118); c.lineTo(120, 150); c.closePath(); c.fill(); R2(c, 38, 150, 74, 55, '#c89b6d'); RR(c, 62, 170, 26, 35, 12, '#5b3a22'); emoji(c, '🎾', 270, 290, 22);
    },
    night(c, R) {
      sky(c, '#1c2450', '#3c3f7a', 320); c.fillStyle = '#fff'; for (let i = 0; i < 50; i++) c.fillRect(R() * 320, R() * 200, 1.5, 1.5); emoji(c, '🌙', 260, 60, 34);
      for (let x = 0; x < 320; x += 40) { const h = 60 + (x * 7 % 50); R2(c, x, 200 - h, 36, h, '#2b2f55'); c.fillStyle = 'rgba(255,220,120,.8)'; for (let y = 210 - h; y < 190; y += 14) for (let k = 0; k < 3; k++) if ((x + y + k) % 3) c.fillRect(x + 5 + k * 10, y, 5, 6); }
      R2(c, 0, 200, 320, 120, '#3a3a52'); ell(c, 160, 270, 120, 30, 'rgba(255,230,160,.15)');
    },
    smallhome(c, R, v) {
      R2(c, 0, 0, 320, 320, ['#fdf1e3', '#eaf5ff', '#f5ecff'][v % 3]); R2(c, 0, 200, 320, 120, '#f1d9a8'); c.fillStyle = '#e2c48a'; for (let i = 0; i < 90; i++) c.fillRect(R() * 320, 200 + R() * 120, 8, 2);
      c.strokeStyle = '#c9ccd4'; c.lineWidth = 3; ell(c, 70, 150, 50, 50, null, '#c9ccd4', 4); for (let a = 0; a < 8; a++) { c.beginPath(); c.moveTo(70, 150); c.lineTo(70 + Math.cos(a) * 50, 150 + Math.sin(a) * 50); c.stroke(); } R2(c, 66, 150, 8, 60, '#b0b4be');
      RR(c, 220, 130, 80, 70, 10, '#ffb3c7'); c.beginPath(); c.moveTo(212, 134); c.lineTo(260, 96); c.lineTo(308, 134); c.closePath(); c.fillStyle = '#f28ca6'; c.fill(); RR(c, 245, 160, 30, 40, 14, '#7a4f2e');
      RR(c, 150, 20, 22, 70, 8, 'rgba(160,210,240,.7)', '#8ab'); emoji(c, '🥕', 170, 300, 20); emoji(c, '🌻', 130, 290, 18);
    },
  };
  // species-specific full scenes
  function aquarium(c, R, v) {
    const tops = [['#6fc7e8', '#1d6fa3'], ['#7fe0d0', '#197a78'], ['#8fb6f2', '#2a4d9a'], ['#9fe1f0', '#2b7fa0']][v % 4];
    c.fillStyle = grad(c, 0, 320, tops[0], tops[1]); c.fillRect(0, 0, 320, 320);
    c.save(); c.globalAlpha = .18; c.fillStyle = '#fff'; for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(40 + i * 70, 0); c.lineTo(80 + i * 70, 0); c.lineTo(20 + i * 70 + 40, 260); c.lineTo(i * 70, 260); c.closePath(); c.fill(); } c.restore();
    c.fillStyle = '#e8d6a8'; c.beginPath(); c.moveTo(0, 270); c.quadraticCurveTo(160, 250, 320, 272); c.lineTo(320, 320); c.lineTo(0, 320); c.fill();
    for (let i = 0; i < 120; i++) ell(c, R() * 320, 272 + R() * 48, 3, 2, ['#c9b07a', '#f3e5c0', '#a88f5e', '#d98c8c'][i % 4]);
    for (const x of [30, 60, 270, 300]) for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(x + k * 6, 285); c.quadraticCurveTo(x + k * 6 + 14 * Math.sin(k + x), 200, x + k * 8 - 4, 130 + k * 20); c.lineWidth = 6; c.strokeStyle = k % 2 ? '#3f9a5a' : '#5ab86a'; c.lineCap = 'round'; c.stroke(); }
    const orn = v % 3; if (orn === 0) { R2(c, 200, 220, 50, 55, '#b8a0c8'); for (const x of [196, 226, 244]) R2(c, x, 205, 12, 18, '#a88ab8'); RR(c, 215, 245, 18, 30, 8, '#4a3a5a'); } else if (orn === 1) { RR(c, 205, 245, 60, 32, 6, '#a8784f'); RR(c, 202, 232, 66, 18, 8, '#8a5a3b'); emoji(c, '💰', 235, 246, 16); } else { for (let i = 0; i < 4; i++) ell(c, 220 + i * 14, 262 - i * 10, 10, 18, ['#ff7a7a', '#ff9ec0', '#ffb347', '#ff7a9a'][i]); }
    for (let i = 0; i < 16; i++) ell(c, 80 + R() * 30 + (i % 3) * 60, 260 - i * 16, 3 + R() * 3, 3 + R() * 3, 'rgba(255,255,255,.55)', 'rgba(255,255,255,.9)', 1);
    c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(0, 0, 320, 8); c.fillStyle = 'rgba(255,255,255,.12)'; c.fillRect(8, 0, 10, 320);
  }
  function terrarium(c, R, v) {
    c.fillStyle = grad(c, 0, 320, ['#f3e2c0', '#e0efd6', '#f0dcc8'][v % 3], '#d8b97a'); c.fillRect(0, 0, 320, 320);
    const g = c.createRadialGradient(240, -20, 10, 240, -20, 240); g.addColorStop(0, 'rgba(255,200,90,.8)'); g.addColorStop(1, 'rgba(255,200,90,0)'); c.fillStyle = g; c.fillRect(0, 0, 320, 320);
    RR(c, 210, -10, 70, 26, 8, '#555'); ell(c, 245, 18, 22, 6, '#ffd27a');
    c.fillStyle = '#e2c285'; c.beginPath(); c.moveTo(0, 240); c.quadraticCurveTo(160, 225, 320, 245); c.lineTo(320, 320); c.lineTo(0, 320); c.fill(); for (let i = 0; i < 80; i++) ell(c, R() * 320, 240 + R() * 80, 2, 1.5, '#c9a86a');
    ell(c, 250, 250, 60, 22, '#9a8f84', OUTL, 1.5); ell(c, 240, 242, 44, 14, '#b3a89c'); c.beginPath(); c.moveTo(0, 170); c.quadraticCurveTo(120, 120, 200, 190); c.lineWidth = 14; c.strokeStyle = '#8a5a3b'; c.lineCap = 'round'; c.stroke();
    for (const x of [30, 290]) for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(x, 250); c.quadraticCurveTo(x + (k - 1.5) * 20, 200, x + (k - 1.5) * 26, 180 + k * 6); c.lineWidth = 7; c.strokeStyle = '#6aa04a'; c.stroke(); }
    c.fillStyle = 'rgba(255,255,255,.15)'; c.fillRect(10, 0, 12, 320); c.fillRect(290, 0, 6, 320);
  }
  function perch(c, x, y) { R2(c, x - 4, y, 8, 320 - y, '#b98552'); RR(c, x - 60, y - 6, 120, 12, 6, '#a8784f'); ell(c, x + 50, y - 12, 10, 8, '#6aa04a'); }
  function branch(c, y) { c.beginPath(); c.moveTo(-10, y + 20); c.quadraticCurveTo(160, y - 10, 330, y + 10); c.lineWidth = 16; c.strokeStyle = '#8a5a3b'; c.lineCap = 'round'; c.stroke(); for (const x of [40, 260]) { ell(c, x, y - 4, 16, 9, '#6fb85a'); ell(c, x + 14, y - 12, 12, 8, '#5aa048'); } }

  // ---------- choose a scene ----------
  function pickScene(l, R) {
    const tt = ART.look(l.sp).t, v = (l.n || 0) + (l.id || 0), sn = typeof seasonOf === 'function' ? seasonOf() : null;
    if (tt === 'fish' || tt === 'axolotl') return { bg: 'aqua', v, px: 160, py: 205, k: 3.4, human: false };
    if (tt === 'turtle' || tt === 'gecko') return { bg: 'terra', v, px: 150, py: 250, k: 3.2, human: false };
    if (tt === 'bird') { const outside = l.topic === 'walk' || (!l.topic && v % 3 === 0); return outside ? { bg: sn === 'spring' ? 'blossom' : 'park', v, px: 160, py: 178, k: 3.2, branch: 190 } : { bg: ['living', 'studio', 'bedroom'][l.topic === 'sleep' ? 2 : v % 2], v, px: 170, py: 206, k: 3.2, perch: 214 }; }
    const small = ['rodent', 'rat', 'guinea', 'hedgehog', 'rabbit', 'ferret'].includes(tt);
    const byTopic = { sleep: 'bedroom', bath: small ? 'smallhome' : 'bath', birthday: 'party', food: 'kitchen', outfit: 'studio', vet: 'vet', toy: small ? 'smallhome' : v % 2 ? 'yard' : 'living' }[l.topic];
    let bg = byTopic;
    if (!bg && l.topic === 'walk') bg = small && tt !== 'rabbit' && tt !== 'ferret' ? 'smallhome' : sn === 'xmas' ? 'snow' : sn === 'summer' ? (v % 2 ? 'beach' : 'park') : sn === 'spring' ? (v % 2 ? 'blossom' : 'park') : ['park', 'beach', 'blossom', 'yard', 'snow'][v % 5];
    if (!bg) bg = small ? ['smallhome', 'living', 'studio', 'kitchen'][v % 4] : ['living', 'cafe', 'yard', 'park', 'studio', 'night', 'living', 'bedroom'][v % 8];
    const outdoor = ['park', 'beach', 'blossom', 'snow', 'yard', 'night', 'cafe', 'vet'].includes(bg);
    return { bg, v, px: 190, py: 282, k: 3.2, human: outdoor || l.topic === 'birthday' };
  }
  window.letterPic = function (l, small) {
    const key = l.id + (small ? 's' : '') + '_v2';
    if (LPIC.has(key)) return LPIC.get(key);
    const Wd = small ? 90 : 320, cv = document.createElement('canvas'); cv.width = Wd * 2; cv.height = Wd * 2;
    const c = cv.getContext('2d'); c.scale(2 * Wd / 320, 2 * Wd / 320);
    const R = rngOf((l.id || 1) * 13 + (l.n || 0) * 7 + (l.seed || 0) % 97), sc = pickScene(l, R);
    if (sc.bg === 'aqua') aquarium(c, R, sc.v); else if (sc.bg === 'terra') terrarium(c, R, sc.v); else (BG[sc.bg] || BG.living)(c, R, sc.v);
    if (sc.perch) perch(c, sc.px, sc.perch); if (sc.branch) branch(c, sc.branch);
    const showHuman = !small && !l.mine && sc.human !== false && (sc.human || (l.adopter && Math.abs(l.seed % 2)));
    if (showHuman) { c.save(); c.translate(80, 285); c.scale(1.5, 1.5); ART.human(c, ART.randomHuman(l.seed), 0, 1, false, l.kind === 'bad' ? 'sad' : l.kind === 'ok' ? 'calm' : l.topic === 'vet' ? 'sad' : 'happy'); c.restore(); }
    const px = small || l.mine || !showHuman ? (sc.bg === 'aqua' || sc.perch || sc.branch ? sc.px : 165) : sc.px;
    if (!sc.perch && !sc.branch && sc.bg !== 'aqua') ell(c, px, sc.py + 2, 60, 12, 'rgba(0,0,0,.12)');
    c.save(); c.translate(px, sc.py); const ak = sc.k * (l.age == null ? 1 : .75 + .25 * l.age); c.scale(ak, ak);
    ART.pet(c, l.sp, { t: 1.4, seed: l.coat || 0, age: l.age, sleep: l.topic === 'sleep', mood: l.topic ? ({ vet: 'sad', funny: 'curious', question: 'hungry', food: 'love', bath: 'happy' }[l.topic] || 'love') : l.mine ? 'love' : l.kind === 'bad' ? 'sad' : l.kind === 'ok' ? 'calm' : 'love', happy: l.kind === 'great' || l.kind === 'celeb' });
    c.restore();
    if (sc.bg === 'aqua') for (let i = 0; i < 4; i++) ell(c, px + 40 + i * 6, sc.py - 40 - i * 16, 4 - i * .5, 4 - i * .5, 'rgba(255,255,255,.4)', 'rgba(255,255,255,.9)', 1);
    const stick = { walk: '🍃', sleep: '🌙', bath: '🫧', birthday: '🎉', toy: '🧸', food: '🥣', outfit: '🎀', vet: '💊', funny: '😂', question: '💭', growth: '🌱', tank: '🌿', sing: '🎶', bask: '☀️' }[l.topic];
    if (stick) emoji(c, stick, 32, 300, 26); else if (l.kind === 'bad') emoji(c, '💧', 280, 60, 26); else emoji(c, '💕', 285, 300, 24);
    const url = cv.toDataURL('image/jpeg', .85); LPIC.set(key, url); return url;
  };
})();
