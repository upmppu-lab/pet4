// ================= Procedural chibi art (canvas 2D) =================
const ART = (() => {
  const TAU = Math.PI * 2;
  const shade = (hex, k) => { // k<0 darker, k>0 lighter
    let c = String(hex || '#888888').replace('#', ''); if (c.length === 3) c = c.split('').map(x => x + x).join('');
    let r = parseInt(c.slice(0, 2), 16), g = parseInt(c.slice(2, 4), 16), b = parseInt(c.slice(4, 6), 16);
    if (k < 0) { r *= 1 + k; g *= 1 + k; b *= 1 + k; } else { r += (255 - r) * k; g += (255 - g) * k; b += (255 - b) * k; }
    return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  };
  const OUT = 'rgba(60,38,25,.85)';
  function ell(c, x, y, rx, ry, fill, stroke, lw) {
    c.beginPath(); c.ellipse(x, y, Math.abs(rx), Math.abs(ry), 0, 0, TAU);
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (stroke) { c.lineWidth = lw || 1.6; c.strokeStyle = stroke; c.stroke(); }
  }
  function rrect(c, x, y, w, h, r) { c.beginPath(); c.roundRect ? c.roundRect(x, y, w, h, r) : c.rect(x, y, w, h); }
  function grad(c, x, y, r, col) {
    const g = c.createRadialGradient(x - r * .35, y - r * .45, r * .1, x, y, r * 1.1);
    g.addColorStop(0, shade(col, .38)); g.addColorStop(.35, shade(col, .1)); g.addColorStop(.72, col); g.addColorStop(1, shade(col, -.2));
    return g;
  }
  function shadow(c, x, y, rx, ry) {
    const rY = ry || rx * .4;
    ell(c, x + .8, y + .8, rx * 1.25, rY * 1.25, 'rgba(30,18,8,.12)');
    ell(c, x + .4, y + .4, rx, rY, 'rgba(35,20,10,.26)');
    ell(c, x, y, rx * .68, rY * .55, 'rgba(25,12,5,.42)');
  }

  // ---------------- eyes/faces ----------------
  function eyes(c, x, y, sp, size, col, closed) {
    for (const s of [-1, 1]) {
      const ex = x + s * sp;
      if (closed) {
        c.beginPath(); c.arc(ex, y, size * .8, Math.PI * 1.1, Math.PI * 1.9); c.lineWidth = 1.8; c.strokeStyle = '#3a2418'; c.stroke();
        continue;
      }
      ell(c, ex, y, size * .82, size * 1.05, '#1e120c');
      const g = c.createLinearGradient(ex, y - size, ex, y + size);
      g.addColorStop(0, '#160c07');
      g.addColorStop(0.5, col || '#3a2418');
      g.addColorStop(1, shade(col || '#7a4528', 0.42));
      ell(c, ex, y + size * .12, size * .72, size * .82, g);
      ell(c, ex, y + size * .42, size * .5, size * .34, 'rgba(255,210,170,.48)');
      c.beginPath(); c.ellipse(ex, y - size * .08, size * .95, size * 1.12, 0, Math.PI * 1.06, Math.PI * 1.94); c.lineWidth = 1.8; c.strokeStyle = '#160d07'; c.stroke();
      ell(c, ex - size * .26, y - size * .34, size * .36, size * .38, '#fff');
      ell(c, ex + size * .28, y + size * .32, size * .16, size * .16, 'rgba(255,255,255,.92)');
    }
  }
  function blush(c, x, y, sp, r) {
    for (const s of [-1, 1]) {
      const bx = x + s * sp;
      const g = c.createRadialGradient(bx, y, r * .1, bx, y, r * 1.3);
      g.addColorStop(0, 'rgba(255,100,120,.52)');
      g.addColorStop(0.55, 'rgba(255,140,150,.24)');
      g.addColorStop(1, 'rgba(255,140,150,0)');
      ell(c, bx, y, r * 1.25, r * .65, g);
    }
  }

  // ================= HUMANS =================
  const HAIR = ['#3b2a20', '#5a3a22', '#8a5a33', '#c9924f', '#e8c67a', '#2a2a33', '#9b4a2b', '#d9a6b3', '#6b4f8a', '#b0b0b8'];
  const SHIRT = ['#e07a5f', '#5b8e7d', '#4f7cac', '#f2c14e', '#b56576', '#8a6fb5', '#f4a261', '#2a9d8f', '#e76f51', '#90be6d', '#ffffff', '#ef8fa8'];
  const PANTS = ['#3d405b', '#5e503f', '#264653', '#6d597a', '#343a40', '#8d6e63', '#1d3557'];
  const SKIN = ['#ffe0c7', '#f9d3b4', '#f1c19d', '#e2aa82', '#c68b64'];
  let SIT = 0; const setSit = k => { SIT = k || 0; }; // 0 = standing .. 1 = seated (thighs forward, lower legs hanging): set by the caller just before human()
  function human(c, o, dir, t, moving) {
    // o: {skin,hair,hs(style),shirt,pants,apron,skirt}
    // dir: 0 = front (facing viewer), 1 = back
    const bob = moving ? Math.abs(Math.sin(t * 10)) * 2 : Math.sin(t * 2) * .6;
    const leg = moving ? Math.sin(t * 10) * 3.2 : 0;
    shadow(c, 0, 0, 14, 5.8);
    c.save(); c.translate(0, -bob);
    // legs
    const pants = o.pants;
    for (const s of [-1, 1]) {
      const ly = s * leg;
      if (SIT > 0) { // sitting: a short (foreshortened) thigh, then the lower leg bends down from the knee and the shoe rests on the floor
        const th = 13 - 6 * SIT, kn = -15 + th - 1, low = 12 * SIT;
        if (low > .5) { rrect(c, s * 4.5 - 2.9, kn, 5.8, low, 2.6); c.fillStyle = o.skirt ? o.skin : pants; c.fill(); c.lineWidth = 1.2; c.strokeStyle = OUT; c.stroke(); }
        rrect(c, s * 4.5 - 3.4, -15, 6.8, th + 1, 3); c.fillStyle = o.skirt ? o.skin : pants; c.fill(); c.lineWidth = 1.2; c.strokeStyle = OUT; c.stroke();
        ell(c, s * 4.5 + s * .6, kn + low - 1.5, 4.4, 2.8, '#3a2a22'); continue;
      }
      rrect(c, s * 4.5 - 3.2, -15 + Math.min(0, ly), 6.4, 13 - Math.abs(ly) * .3, 3); c.fillStyle = o.skirt ? o.skin : pants; c.fill(); c.lineWidth = 1.2; c.strokeStyle = OUT; c.stroke();
      ell(c, s * 4.5, -2.5 + Math.min(0, ly) * .4, 4.3, 2.8, '#3a2a22');
    }
    // body
    c.beginPath(); c.moveTo(-10, -13); c.quadraticCurveTo(-11, -30, -6, -32); c.lineTo(6, -32); c.quadraticCurveTo(11, -30, 10, -13); c.closePath();
    const gBody = c.createLinearGradient(-10, -32, 10, -13);
    gBody.addColorStop(0, shade(o.shirt, .16)); gBody.addColorStop(.65, o.shirt); gBody.addColorStop(1, shade(o.shirt, -.18));
    c.fillStyle = gBody; c.fill(); c.lineWidth = 1.5; c.strokeStyle = OUT; c.stroke();
    if (o.skirt) { c.beginPath(); c.moveTo(-10, -17); c.lineTo(-12.5, -9); c.lineTo(12.5, -9); c.lineTo(10, -17); c.closePath(); c.fillStyle = o.skirt; c.fill(); c.stroke(); }
    if (o.apron && dir === 0) { rrect(c, -6.5, -28, 13, 16, 3); c.fillStyle = o.apron; c.fill(); c.lineWidth = 1; c.stroke(); ell(c, 0, -21, 2.4, 1.6, shade(o.apron, -.15)); }
    // arms
    const arm = moving ? Math.sin(t * 10) * 2.5 : 0;
    for (const s of [-1, 1]) { c.save(); c.translate(s * 10, -29); c.rotate(s * (.25) + (s * arm * .06)); rrect(c, -2.6, 0, 5.2, 13, 2.6); c.fillStyle = o.shirt; c.fill(); c.lineWidth = 1.2; c.strokeStyle = OUT; c.stroke(); ell(c, 0, 13.5, 2.8, 2.8, o.skin, OUT, 1); c.restore(); }
    // head
    const hy = -50;
    if (o.hs === 1 || o.hs === 3) { // long hair behind
      c.beginPath(); c.ellipse(0, hy + 6, 19, 21, 0, 0, Math.PI); c.lineTo(-19, hy + 6); c.fillStyle = shade(o.hair, -.12); c.fill();
      rrect(c, -19, hy, 38, 26, 10); c.fill();
    }
    ell(c, 0, hy, 18.5, 17.5, grad(c, 0, hy, 18, o.skin), OUT, 1.6);
    if (dir === 0) {
      // ears
      ell(c, -18, hy + 2, 3, 4, o.skin, OUT, 1.2); ell(c, 18, hy + 2, 3, 4, o.skin, OUT, 1.2);
      eyes(c, 0, hy + 4, 7, 3.9, o.eye || '#3a2418');
      blush(c, 0, hy + 10, 11, 3.6);
      c.beginPath(); c.arc(0, hy + 10.5, 2.2, .15 * Math.PI, .85 * Math.PI); c.lineWidth = 1.3; c.strokeStyle = '#8a3b2b'; c.stroke();
    }
    // hair front
    c.fillStyle = grad(c, 0, hy - 8, 20, o.hair); c.strokeStyle = OUT; c.lineWidth = 1.5;
    if (dir === 1) { ell(c, 0, hy - 1, 19.5, 18.5, grad(c, 0, hy - 6, 20, o.hair), OUT, 1.5); }
    else {
      c.beginPath();
      c.moveTo(-19.5, hy + 4);
      c.bezierCurveTo(-22, hy - 20, 22, hy - 24, 19.5, hy + 4);
      if (o.hs === 2) { // spiky
        c.lineTo(15, hy - 4); c.lineTo(11, hy + 1); c.lineTo(7, hy - 6); c.lineTo(2, hy - 1); c.lineTo(-3, hy - 7); c.lineTo(-8, hy - 1); c.lineTo(-12, hy - 6); c.lineTo(-16, hy + 1);
      } else {
        c.quadraticCurveTo(12, hy - 11, 4, hy - 8); c.quadraticCurveTo(-4, hy - 4, -10, hy - 9); c.quadraticCurveTo(-16, hy - 6, -19.5, hy + 4);
      }
      c.closePath(); c.fill(); c.stroke();
      // angelic hair shine halo
      c.save(); c.clip();
      c.beginPath(); c.ellipse(0, hy - 6, 16, 9, 0, Math.PI * 1.05, Math.PI * 1.65); c.lineWidth = 3; c.lineCap = 'round'; c.strokeStyle = 'rgba(255,255,255,.45)'; c.stroke();
      c.beginPath(); c.ellipse(0, hy - 6, 16, 9, 0, Math.PI * 1.7, Math.PI * 1.88); c.strokeStyle = 'rgba(255,255,255,.35)'; c.stroke();
      // subtle secondary rim glint
      c.beginPath(); c.ellipse(0, hy - 14, 12, 6, 0, Math.PI * 1.15, Math.PI * 1.85); c.lineWidth = 1.8; c.strokeStyle = 'rgba(255,255,255,.25)'; c.stroke();
      c.restore();
    }
    if (o.hs === 3) { // ponytail/bun
      ell(c, dir === 0 ? 14 : -14, hy - 16, 6.5, 6.5, grad(c, 14, hy - 16, 7, o.hair), OUT, 1.3);
    }
    if (o.hs === 4) { // side bangs long (bob)
      for (const s of [-1, 1]) { rrect(c, s * 19 - (s > 0 ? 6 : 0), hy - 4, 6, 20, 3); c.fillStyle = o.hair; c.fill(); c.stroke(); }
    }
    // ========== 🆕 슬롯별 소품 그리기 (v1.102) ==========
    if (o.acc) {
      // --- 목걸이 (neck) - 정면/뒷면에서만 ---
      if (o.acc.neck && (dir === 0 || dir === 1)) {
        const ny = hy + 14; // 목 위치
        const col = o.acc.neck === 'pendant' ? '#ff7aa8' : o.acc.neck === 'bell' ? '#ffd23a' : '#f5c542';
        // 목걸이 줄 (반원)
        c.beginPath();
        c.arc(0, ny, 12, 0.15 * Math.PI, 0.85 * Math.PI);
        c.lineWidth = 2;
        c.strokeStyle = '#f5c542';
        c.stroke();
        // 펜던트/방울
        if (o.acc.neck === 'pendant') {
          ell(c, 0, ny + 3.5, 2.5, 3, '#ff7aa8', OUT, 0.8);
        } else if (o.acc.neck === 'bell') {
          ell(c, 0, ny + 3.5, 2.5, 2.5, '#ffd23a', OUT, 0.8);
          ell(c, 0, ny + 5, 1, 1, '#6a4a1a');
        } else {
          ell(c, 0, ny + 3.5, 2, 2, '#f5c542', OUT, 0.8);
        }
      }
      // --- 귀걸이 (ear) - 정면만 ---
      if (o.acc.ear && dir === 0) {
        const col = o.acc.ear === 'hoop' ? '#c9962a' : '#f5c542';
        for (const s of [-1, 1]) {
          ell(c, s * 19, hy + 2, 2, 2, col, OUT, 0.7);
        }
      }
      // --- 안경 (face) - 정면만 ---
      if (o.acc.face && dir === 0) {
        const ey = hy + 4; // 눈 위치
        c.lineWidth = 1.5;
        if (o.acc.face === 'sunglasses') {
          c.strokeStyle = '#1a1a1a';
          for (const s of [-1, 1]) {
            rrect(c, s * 7 - 5, ey - 4, 10, 7, 2);
            c.fillStyle = '#1a1a1a';
            c.fill();
            c.stroke();
          }
          c.beginPath(); c.moveTo(-2, ey - 0.5); c.lineTo(2, ey - 0.5); c.stroke();
        } else if (o.acc.face === 'glasses' || o.acc.face === 'roundglass') {
          c.strokeStyle = o.acc.face === 'glasses' ? '#3a2418' : '#c9962a';
          for (const s of [-1, 1]) {
            c.beginPath();
            c.arc(s * 7, ey, 5, 0, Math.PI * 2);
            c.stroke();
          }
          c.beginPath(); c.moveTo(-2, ey); c.lineTo(2, ey); c.stroke();
        }
      }
      // --- 목도리 (scarf) - 모든 방향 ---
      if (o.acc.scarf) {
        const col = o.acc.scarf === 'scarf_red' ? '#e0303a' : '#2f4f8a';
        const ny = hy + 15;
        c.beginPath();
        c.ellipse(0, ny, 15, 7, 0, 0, Math.PI * 2);
        c.fillStyle = col;
        c.fill();
        c.strokeStyle = OUT;
        c.lineWidth = 1.2;
        c.stroke();
        // 늘어진 부분 (정면/뒷면)
        if (dir === 0 || dir === 1) {
          c.beginPath();
          c.moveTo(-3, ny + 3);
          c.quadraticCurveTo(-6, ny + 10, -4, ny + 16);
          c.lineWidth = 4;
          c.strokeStyle = col;
          c.stroke();
          c.lineWidth = 1.2;
          c.strokeStyle = OUT;
          c.stroke();
        }
      }
      // --- 모자 (head) - 기존 hatOnly 재활용 ---
      if (o.acc.head) {
        HUM.hatOnly(c, { hat: o.acc.head });
      }
    }
    // 기존 hat 호환 (마이그레이션 안 된 세이브용)
    else if (o.hat) {
      c.beginPath(); c.ellipse(0, hy - 15, 16, 6, 0, 0, TAU);
      c.fillStyle = o.hat; c.fill(); c.stroke();
      rrect(c, -10, hy - 26, 20, 12, 5); c.fill(); c.stroke();
    }
    // ========== 슬롯별 소품 그리기 끝 ==========
    
    c.restore();
  }
  function randomHuman(seed) {
    let s = seed * 9301 + 49297; const r = () => (s = (s * 9301 + 49297) % 233280) / 233280;
    const girl = r() < .5;
    return { skin: SKIN[Math.floor(r() * SKIN.length)], hair: HAIR[Math.floor(r() * HAIR.length)], hs: girl ? [1, 3, 4][Math.floor(r() * 3)] : [0, 2][Math.floor(r() * 2)],
      shirt: SHIRT[Math.floor(r() * SHIRT.length)], pants: PANTS[Math.floor(r() * PANTS.length)], skirt: girl && r() < .5 ? SHIRT[Math.floor(r() * SHIRT.length)] : null,
      hat: r() < .15 ? SHIRT[Math.floor(r() * SHIRT.length)] : null };
  }

  // ================= PETS =================
  // look: t=template, c1 main, c2 secondary (muzzle/belly), c3 accent, ear, pat, fluff
  const L = {
    hamster: { t: 'rat', c1: '#f4f1ec', c2: '#ffffff', c3: '#4a3f3a', pat: 'hood', eye: null },
    hamster_black: { t: 'rat', c1: '#2f2b2b', c2: '#4a4442', c3: '#2f2b2b' },
    hamster_brown: { t: 'rat', c1: '#9b6a45', c2: '#b88760', c3: '#6b4530' },
    hamster_cream: { t: 'rat', c1: '#f3e6c8', c2: '#fff4e0', c3: '#d9c3a8' },
    hamster_cream_brown: { t: 'rat', c1: '#d9b98c', c2: '#f3e6c8', c3: '#9b6a45' },
    hamster_dark_brown: { t: 'rat', c1: '#5c3a1e', c2: '#8a5a33', c3: '#3a2410' },
    hamster_dark_gray: { t: 'rat', c1: '#6b7480', c2: '#9a9aa2', c3: '#4a4442' },
    hamster_deepdark_gray: { t: 'rat', c1: '#3a3a40', c2: '#5a5a62', c3: '#1f1f22' },
    hamster_gray: { t: 'rat', c1: '#9a9aa2', c2: '#c9c9d0', c3: '#6b7480' },
    hamster_white: { t: 'rat', c1: '#ffffff', c2: '#ffffff', c3: '#e8e4de' },
    rat: { t: 'rat', c1: '#f4f1ec', c2: '#ffffff', c3: '#4a3f3a', pat: 'hood', eye: null },
    robo: { t: 'rodent', c1: '#e8c9a0', c2: '#ffffff', small: 1 },
    gerbil: { t: 'rodent', c1: '#d9a86a', c2: '#fff8ee', tail: 1, ear: 'tall' },
    guinea: { t: 'guinea', c1: '#ffffff', c2: '#c9853f', c3: '#3a2a22' },
    guineapig_black_1: { t: 'guinea', c1: '#2f2b2b', c2: '#2f2b2b', c3: '#2f2b2b' },
    guineapig_black_2: { t: 'guinea', c1: '#2f2b2b', c2: '#2f2b2b', c3: '#2f2b2b' },
    guineapig_black_3: { t: 'guinea', c1: '#2f2b2b', c2: '#2f2b2b', c3: '#2f2b2b' },
    guineapig_black_4: { t: 'guinea', c1: '#2f2b2b', c2: '#2f2b2b', c3: '#2f2b2b' },
    guineapig_brown_1: { t: 'guinea', c1: '#9b6a45', c2: '#9b6a45', c3: '#9b6a45' },
    guineapig_brown_2: { t: 'guinea', c1: '#9b6a45', c2: '#9b6a45', c3: '#9b6a45' },
    guineapig_brown_3: { t: 'guinea', c1: '#9b6a45', c2: '#9b6a45', c3: '#9b6a45' },
    guineapig_brown_4: { t: 'guinea', c1: '#9b6a45', c2: '#9b6a45', c3: '#9b6a45' },
    guineapig_cream: { t: 'guinea', c1: '#f3e6c8', c2: '#f3e6c8', c3: '#f3e6c8' },
    guineapig_dark_brown_1: { t: 'guinea', c1: '#5c3a1e', c2: '#5c3a1e', c3: '#5c3a1e' },
    guineapig_dark_brown_2: { t: 'guinea', c1: '#5c3a1e', c2: '#5c3a1e', c3: '#5c3a1e' },
    guineapig_gray: { t: 'guinea', c1: '#9a9aa2', c2: '#9a9aa2', c3: '#9a9aa2' },
    guineapig_mix: { t: 'guinea', c1: '#ffffff', c2: '#c9853f', c3: '#3a2a22' },
    guineapig_white: { t: 'guinea', c1: '#ffffff', c2: '#ffffff', c3: '#ffffff' },
    chinchilla: { t: 'rodent', c1: '#a9adb5', c2: '#e9ebef', ear: 'round' },
    rabbit: { t: 'rabbit', c1: '#f4f1ec', c2: '#8b6a4f', ear: 'up', pat: 'patch' },
    rabbit_white: { t: 'rabbit', c1: '#ffffff', c2: '#ffffff', ear: 'up', pat: null, eye: '#e05060' },
    hollandlop: { t: 'rabbit', c1: '#3b3b44', c2: '#55555f', ear: 'lop' },
    dwarfrabbit: { t: 'rabbit', c1: '#6b6f7a', c2: '#9aa0aa', ear: 'short' },
    lionhead: { t: 'rabbit', c1: '#e8c49a', c2: '#fff1dc', ear: 'short', mane: 1 },
    hedgehog: { t: 'hedgehog', c1: '#8a7766', c2: '#f3e3cf' },
    ferret: { t: 'ferret', c1: '#e9dcc8', c2: '#6b4a33' },
    goldfish: { t: 'fish', c1: '#ff8c2b', c2: '#ffd08a' },
    guppy: { t: 'fish', c1: '#9fb6c8', c2: '#ff5a8a', small: 1, fins: 2 },
    neon: { t: 'fish', c1: '#2d6cdf', c2: '#e8343c', small: 1, neon: 1 },
    betta: { t: 'fish', c1: '#ff5a2b', c2: '#ffb347', fins: 1 },
    clownfish: { t: 'fish', c1: '#ff7a1a', c2: '#ff9a3a', stripes: 1 },
    axolotl: { t: 'axolotl', c1: '#ffc0cf', c2: '#ff6f91' },
    budgie: { t: 'bird', c1: '#7ccf4a', c2: '#f4e04d', c3: '#3a3a3a' },
    canary: { t: 'bird', c1: '#ffd83b', c2: '#fff2a8' },
    duckling: { t: 'bird', c1: '#ffe066', c2: '#fff3a8', duck: 1 },
    chick: { t: 'bird', c1: '#ffd92e', c2: '#fff5a0' },
    lovebird: { t: 'bird', c1: '#5fbf4a', c2: '#ff8a7a' },
    cockatiel: { t: 'bird', c1: '#9c9ea5', c2: '#f7e27a', c3: '#ff8c5a', crest: 1 },
    conure: { t: 'bird', c1: '#ffb020', c2: '#ff7a1a', c3: '#4fb56d' },
    macaw: { t: 'bird', c1: '#e0303a', c2: '#f4d23b', c3: '#2a6ad9', tailc: '#2a6ad9' },
    beardie: { t: 'gecko', c1: '#d9a860', c2: '#8a6a3a' },
    exotic: { t: 'cat', c1: '#e0b070', c2: '#fff0dd', flat: 1, fat: 1, eye: '#d1892c' },
    cocker: { t: 'dog', c1: '#c98a45', c2: '#e0a86a', ear: 'long', fluff: 1 },
    greyparrot: { t: 'bird', c1: '#9a9ea6', c2: '#c9ccd2', tailc: '#d9303a', eye: '#f4f1e0' },
    turtle: { t: 'turtle', c1: '#6f9a4a', c2: '#4a6b2f', c3: '#e0413a' },
    gecko: { t: 'gecko', c1: '#f2d27a', c2: '#3d3326' },
    cornsnake: { t: 'snake', c1: '#e0793a', c2: '#f2c14e', c3: '#b0402a' },
    ballpython: { t: 'snake', c1: '#4a3a2a', c2: '#8a6a45', c3: '#2a2018' },
    kitten: { t: 'cat', c1: '#b8926a', c2: '#ffffff', pat: 'tabby', c3: '#6b4c33' },
    british: { t: 'cat', c1: '#8c929c', c2: '#a7adb6', eye: '#e3a321', fat: 1 },
    russianblue: { t: 'cat', c1: '#7f8a99', c2: '#96a0ae', eye: '#57b36a' },
    scottish: { t: 'cat', c1: '#f1dfbf', c2: '#fff6e6', ear: 'fold', eye: '#d1892c' },
    munchkin: { t: 'cat', c1: '#c9a47a', c2: '#fff6ea', pat: 'tabby', c3: '#7a5a3a', short: 1 },
    persian: { t: 'cat', c1: '#e9a45c', c2: '#fff0dd', fluff: 1, eye: '#d1892c', flat: 1 },
    ragdoll: { t: 'cat', c1: '#f8f3ea', c2: '#ffffff', pat: 'point', c3: '#6d5645', fluff: 1, eye: '#4a8ee0' },
    bengal: { t: 'cat', c1: '#e3a55a', c2: '#fbe6c7', pat: 'spots', c3: '#5a3a22', eye: '#6bb04a' },
    abyssinian: { t: 'cat', c1: '#c07a44', c2: '#f0c89a', pat: 'ticked', c3: '#7a4a24', eye: '#8ab04a', bigear: 1 },
    angora: { t: 'cat', c1: '#ffffff', c2: '#ffffff', fluff: 1, eye: '#4a8ee0' },
    mainecoon: { t: 'cat', c1: '#9a9086', c2: '#e8e2da', pat: 'tabby', c3: '#4a4038', fluff: 1, tuft: 1 },
    norwegian: { t: 'cat', c1: '#b9b2a8', c2: '#f4f0ea', pat: 'tabby', c3: '#5a524a', fluff: 2, tuft: 1, eye: '#8ab04a' },
    siamese: { t: 'cat', c1: '#f3e6d0', c2: '#fff8ec', pat: 'point', c3: '#4a3226', eye: '#4a8ee0' },
    sphynx: { t: 'cat', c1: '#f0c6b4', c2: '#f7d9cc', pat: 'wrinkle', eye: '#6bb04a', bigear: 1 },
    pomeranian: { t: 'dog', c1: '#f0a24a', c2: '#ffe2b8', ear: 'tiny', fluff: 1 },
    maltese_white: { t: 'dog', c1: '#ffffff', c2: '#fff8ef', ear: 'fluffy', fluff: 2, curly: 1, maltese: 1 },
    shihtzu: { t: 'dog', c1: '#ffffff', c2: '#d9a15a', ear: 'long', fluff: 1, pat: 'patches', flat: 1 },
    chihuahua_black: { t: 'dog', c1: '#3d2e24', c2: '#f5e8d8', ear: 'big' },
    chihuahua_brown: { t: 'dog', c1: '#c68f5e', c2: '#fff3e0', ear: 'big' },
    chihuahua_dark_brown: { t: 'dog', c1: '#7c4a2a', c2: '#e8d0b8', ear: 'big' },	
    papillon: { t: 'dog', c1: '#ffffff', c2: '#b8743a', ear: 'big', pat: 'patches', fluff: 1 },
    bichon: { t: 'dog', c1: '#ffffff', c2: '#fffaf2', ear: 'fluffy', fluff: 2 },
    poodle: { t: 'dog', c1: '#9b6a45', c2: '#b88760', ear: 'fluffy', fluff: 2 },
    poodle_black: { t: 'dog', c1: '#2f2b2b', c2: '#4a4442', ear: 'fluffy', fluff: 2 },
    poodle_gray: { t: 'dog', c1: '#9a9aa2', c2: '#c9c9d0', ear: 'fluffy', fluff: 2 },
    poodle_brown: { t: 'dog', c1: '#9b6a45', c2: '#b88760', ear: 'fluffy', fluff: 2 },
    shiba: { t: 'sitshiba', c1: '#c9783e', c2: '#fff5ea', ear: 'up' },
    shiba_red: { t: 'sitshiba', c1: '#c9783e', c2: '#fff5ea', ear: 'up' },
    shiba_black: { t: 'sitshiba', c1: '#3d2e24', c2: '#f5e8d8', ear: 'up' },
    shiba_sinu: { t: 'sitshiba', c1: '#c9783e', c2: '#fff5ea', ear: 'up' },
    shiba_sinu_black: { t: 'sitshiba', c1: '#3d2e24', c2: '#f5e8d8', ear: 'up' },
    shiba_sinu_black_brown: { t: 'sitshiba', c1: '#5c3a1e', c2: '#f5e8d8', ear: 'up' },
    dalmatian_black: { t: 'dog', c1: '#3a3230', c2: '#f5ede0', ear: 'flop', pat: 'spots', c3: '#1e1814' },
    dalmatian_eye: { t: 'dog', c1: '#f5ede0', c2: '#3a3230', ear: 'flop', pat: 'patches' },
    dalmatian_red: { t: 'dog', c1: '#c9885a', c2: '#f5ede0', ear: 'flop', pat: 'spots', c3: '#8a4a24' },
    maltese_brown2: { t: 'dog', c1: '#c68f5e', c2: '#fff3e0', ear: 'fluffy', fluff: 2, curly: 1, earCol: '#8a5330' },
    maltese_dark_brown: { t: 'dog', c1: '#7c4a2a', c2: '#e8d0b8', ear: 'fluffy', fluff: 2, curly: 1, earCol: '#4a2818' },
    retriever_black: { t: 'dog', c1: '#2b2420', c2: '#4a3f38', ear: 'flop', fluff: 1 },
    retriever_brown: { t: 'dog', c1: '#c9853f', c2: '#e0a86a', ear: 'flop', fluff: 1 },
    retriever_dark_brown: { t: 'dog', c1: '#5c3a1e', c2: '#8a5a33', ear: 'flop', fluff: 1 },
    husky_black: { t: 'dog', c1: '#5b6270', c2: '#ffffff', ear: 'up', pat: 'husky', eye: '#5aa7e8' },
    husky_brown: { t: 'dog', c1: '#b0703a', c2: '#ffffff', ear: 'up', pat: 'husky' },
    husky_white: { t: 'dog', c1: '#ffffff', c2: '#ffffff', ear: 'up', pat: 'husky' },
	corgi: { t: 'dog', c1: '#e8a052', c2: '#ffffff', ear: 'bigup', short: 1 },
    schnauzer: { t: 'dog', c1: '#7a7e86', c2: '#e4e6ea', ear: 'fold', pat: 'beard' },
    beagle: { t: 'dog', c1: '#ffffff', c2: '#c98a45', c3: '#3a2d25', ear: 'flop', pat: 'beagle' },
    cavalier: { t: 'dog', c1: '#ffffff', c2: '#b0562a', ear: 'long', pat: 'patches', fluff: 1 },
    dachshund: { t: 'dog', c1: '#a8582a', c2: '#c9794a', ear: 'flop', short: 1 },
    pug: { t: 'dog', c1: '#e8cda4', c2: '#3a302a', ear: 'fold', pat: 'mask', flat: 1 },
    frenchie: { t: 'dog', c1: '#5c534e', c2: '#8a817b', ear: 'bat', flat: 1 },
    yorkie: { t: 'dog', c1: '#c9a063', c2: '#4a5563', ear: 'up', pat: 'saddle', fluff: 1 },
    bordercollie: { t: 'dog', c1: '#2e2a2a', c2: '#ffffff', ear: 'semi', pat: 'blaze' },
    samoyed: { t: 'dog', c1: '#ffffff', c2: '#fffaf0', ear: 'up', fluff: 2, smile: 1 },
    jindo: { t: 'dog', c1: '#f7f1e6', c2: '#ffffff', ear: 'up' },
  };
  // individual coat variants (one is picked per pet)
  const BK = '#2f2b2b';
  const VAR = {
    hamster: [{ c3: '#8a6a4a' }, { c3: '#6b7480' }, { pat: null, c1: '#9a7a5a', c2: '#d9c3a8' }, { pat: null, c1: '#3a3432', c2: '#5a524e' }, { pat: null, c1: '#ffffff', eye: '#d94a5a' }, { ear: 'dumbo' }, { pat: null, c1: '#e8d3b0', c2: '#fff4e0', ear: 'dumbo' }, { pat: null, c1: '#8a93a0', c2: '#c9ced6' }],
    robo: [{ c1: '#d9b98c' }, { c1: '#f4efe6' }],
    gerbil: [{ c1: '#8a7a6a' }, { c1: '#f2efe8', c2: '#ffffff' }, { c1: '#3a3430', c2: '#5a524a' }],
    guinea: [{ c1: '#c9853f', c2: '#ffffff', c3: '#ffffff' }, { c1: BK, c2: '#ffffff', c3: '#c9853f' }, { c1: '#f3e6c8', c2: '#e8b070', c3: '#f3e6c8' }, { c1: '#8a6040', c2: '#8a6040', c3: '#f4ead8' }],
    chinchilla: [{ c1: '#f2f0ec', c2: '#ffffff' }, { c1: '#5a5a62', c2: '#9a9aa2' }, { c1: '#d8c3a0', c2: '#f4ead8' }],
    rabbit: [{ c1: '#b0896a', c2: '#8b6a4f', pat: null }, { c1: '#f4f1ec', c2: BK, pat: 'patch' }, { c1: '#9aa0aa', pat: null }, { c1: '#ffffff', pat: null, eye: '#d94a5a' }],
    rabbit_white: [{ c1: '#ffffff', c2: '#ffffff', pat: null, eye: '#e05060' }],
    hollandlop: [{ c1: '#e0b98a', c2: '#f4dcb8' }, { c1: '#f4f1ec', c2: '#c79a6c' }, { c1: '#8c6a4f', c2: '#b08a6a' }],
    dwarfrabbit: [{ c1: '#f4f1ec', c2: '#ffffff' }, { c1: '#3b3030', c2: '#5a4a4a' }, { c1: '#c99a6a', c2: '#e8c8a0' }],
    lionhead: [{ c1: '#ffffff', c2: '#ffffff' }, { c1: '#8a8a92', c2: '#c0c0c8' }, { c1: BK, c2: '#4a4545' }],
    hedgehog: [{ c1: '#c9b8a6' }, { c1: '#5d5048' }],
    ferret: [{ c1: '#8a6a4f', c2: '#3a2a22' }, { c1: '#f8f4ee', c2: '#f8f4ee' }],
    goldfish: [{ c1: '#ffffff', c2: '#ff6a2b' }, { c1: '#e8342c', c2: '#ffb08a' }, { c1: '#3a3a3a', c2: '#6a6a6a' }],
    guppy: [{ c2: '#3a8ae8' }, { c2: '#ffb020' }, { c2: '#a04ae0' }],
    betta: [{ c1: '#3a5fd9', c2: '#8aa8ff' }, { c1: '#b02a4a', c2: '#ff7aa0' }, { c1: '#f4f1ec', c2: '#ffd0e0' }],
    axolotl: [{ c1: '#f7e9c8', c2: '#e6a23c' }, { c1: '#4a4a52', c2: '#8a6ab5' }, { c1: '#fff4f6', c2: '#ff8fa8' }],
    budgie: [{ c1: '#5aa7e8', c2: '#ffffff' }, { c1: '#f4e04d', c2: '#fff7c0' }, { c1: '#e8eef4', c2: '#ffffff' }],
    canary: [{ c1: '#ff9a3b', c2: '#ffd0a0' }, { c1: '#f4f1ec', c2: '#ffffff' }],
    lovebird: [{ c1: '#5aa7c8', c2: '#f0f0f0' }, { c1: '#f4d23b', c2: '#ff7a5a' }],
    cockatiel: [{ c1: '#f4f1ec', c2: '#fff4b0' }, { c1: '#e8d9b8' }],
    conure: [{ c1: '#5fbf4a', c2: '#ffcf3a' }],
    gecko: [{ c1: '#f7e9c8', c2: '#f0a040' }, { c1: '#f0a860', c2: '#5a3a22' }],
    kitten: [{ c1: '#f0a24a', c3: '#c9702a', c2: '#fff4e6' }, { c1: '#8c929c', c3: '#5a606a' }, { c1: BK, c2: BK, pat: null, eye: '#e3c421' }, { c1: BK, c2: '#ffffff', pat: 'tux', eye: '#9ad04a' }, { c1: '#ffffff', pat: 'calico', c2: '#f0a24a', c3: '#3a302a' }, { c1: '#ffffff', c2: '#ffffff', pat: null, eye: '#4a8ee0' }],
    british: [{ c1: '#e9d6b8', c2: '#f4e8d4' }, { c1: BK, c2: '#3f3a3a' }, { c1: '#c9a06a', pat: 'tabby', c3: '#8a6038', c2: '#e8d0a8', eye: '#6bb04a' }],
    scottish: [{ c1: '#8c929c', c2: '#a7adb6', eye: '#e3a321' }, { c1: '#b8926a', pat: 'tabby', c3: '#6b4c33', c2: '#ffffff' }, { c1: '#ffffff', c2: '#ffffff', eye: '#4a8ee0' }],
    munchkin: [{ c1: '#ffffff', pat: 'calico', c2: '#f0a24a', c3: '#3a302a' }, { c1: '#8c929c', c3: '#5a606a', c2: '#e8eaee' }, { c1: BK, c2: '#ffffff', pat: 'tux' }],
    persian: [{ c1: '#ffffff', c2: '#ffffff', eye: '#4a8ee0' }, { c1: '#8c929c', c2: '#b8bec6' }, { c1: BK, c2: '#4a4545' }],
    ragdoll: [{ c3: '#8a93a6' }, { c3: '#b88a6a' }],
    bengal: [{ c1: '#d8d8d8', c2: '#f4f4f4', c3: '#3a3a3a' }],
    mainecoon: [{ c1: '#c9702a', c3: '#8a4a1a', c2: '#f4e0c8' }, { c1: BK, c2: '#4a4545', pat: null }],
    norwegian: [{ c1: '#e8a860', c3: '#b06a2a', c2: '#fff4e6' }, { c1: '#ffffff', pat: 'calico', c2: '#f0a24a', c3: '#3a302a' }],
    angora: [{ eye: '#e3a321' }, { eye: '#e3a321', eye2: '#4a8ee0' }, { c1: '#8c929c', c2: '#c8ccd2' }],
    siamese: [{ c3: '#7a8290' }],
    sphynx: [{ c1: '#c9c4c0', c2: '#dcd8d4' }, { c1: '#f4d8c8', pat: 'spots', c3: '#8a7a70' }],
    pomeranian: [{ c1: '#fff4e0', c2: '#ffffff' }, { c1: BK, c2: '#4a4545' }, { c1: '#d9c3a8', c2: '#f4ead8' }],
    shihtzu: [{ c2: '#8a6a52' }, { c2: BK }],
    chihuahua: [{ c1: BK, c2: '#c9853f' }, { c1: '#f4efe6', c2: '#ffffff' }, { c1: '#9b6a45', c2: '#e8c8a0' }],
    papillon: [{ c2: BK }, { c2: '#d9a15a' }],
    poodle: [{ c1: '#ffffff', c2: '#ffffff' }, { c1: BK, c2: '#3f3a3a' }, { c1: '#e8b070', c2: '#f4c890' }, { c1: '#c0c4ca', c2: '#d8dce0' }],
    maltese_white: [{ c1: '#ffffff', c2: '#fff8ef' }],
    shiba: [{ c1: '#c9783e', c2: '#fff5ea' }, { c1: '#3d2e24', c2: '#f5e8d8' }, { c1: '#5c3a1e', c2: '#f5e8d8' }, { c1: '#e8cfa0', c2: '#ffffff' }],
    shiba_red: [{ c1: '#c9783e', c2: '#fff5ea' }, { c1: '#d88648', c2: '#fff8f0' }],
    shiba_sinu: [{ c1: '#c9783e', c2: '#fff5ea' }, { c1: '#3d2e24', c2: '#f5e8d8' }],
    shiba_sinu_black: [{ c1: '#3d2e24', c2: '#f5e8d8', ear: 'up' }],
    shiba_sinu_black_brown: [{ c1: '#3d2e24', c2: '#f5e8d8', ear: 'up' }],
    corgi: [{ c1: BK, c2: '#ffffff' }],
    schnauzer: [{ c1: BK, c2: '#b8bcc4' }, { c1: '#2a2626', c2: '#2a2626' }],
    cavalier: [{ c1: BK, c2: '#b0562a', pat: 'tri' }, { c1: '#b0562a', c2: '#b0562a', pat: null }],
    dachshund: [{ c1: BK, c2: '#b8743a' }, { c1: '#e39a4a', c2: '#f0b070' }],
    pug: [{ c1: BK, c2: '#1f1c1c' }],
    frenchie: [{ c1: '#e8d0a8', c2: '#3a302a', pat: 'mask' }, { c1: '#f4efe6', c2: '#ffffff' }],
    bordercollie: [{ c1: '#8a5a33' }, { c1: '#8a929c' }],
    jindo: [{ c1: '#e39a4a', c2: '#fff4e6' }, { c1: '#6a5a4a', c2: '#e8dccc' }],
  };
  const hashStr = s => { s = String(s == null ? '' : s); let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const CACHE = new Map();
  function look(sp, seed) {
    const normSp = (typeof DATA !== 'undefined' && DATA.ALIASES && DATA.ALIASES[sp]) ? DATA.ALIASES[sp] : sp;
    const base = L[sp] || L[normSp] || L.hamster;
    if (seed == null || seed === 0) return base;
    const key = sp + ':' + seed; let lk = CACHE.get(key); if (lk) return lk;
    let r = (seed >>> 0) || 1; const R = () => (r = (Math.imul(r, 1664525) + 1013904223) >>> 0) / 4294967296;
    R(); R();
    lk = Object.assign({}, base);
    const vs = VAR[sp];
    if (vs && R() > .35) Object.assign(lk, vs[Math.floor(R() * vs.length)]);
    if (lk.t === 'dog' || lk.t === 'cat') {
      const m = R(), dark = lk.c1 !== '#ffffff';
      if (m < .16 && dark && !['tux', 'calico', 'husky', 'blaze', 'point'].includes(lk.pat)) lk.socks = 1;
      else if (m < .28 && dark && lk.pat !== 'tux') lk.chest = 1;
      else if (m < .36 && !lk.pat) lk.eyespot = R() < .5 ? -1 : 1;
      if (lk.t === 'cat' && !lk.eye) lk.eye = ['#e3a321', '#6bb04a', '#4a8ee0', '#d1892c', '#b8c43a'][Math.floor(R() * 5)];
    }
    const rt = typeof rareOf === 'function' ? rareOf(seed) : null;
    if (rt) {
      const RC = { gold: ['#f5c542', '#fff1b8', '#c98a1a', '#8a5a1a', null], rainbow: ['#ffd6ec', '#d6f3ff', '#fff2a8', '#9a6aff', null], star: ['#ffffff', '#eaf4ff', '#f2c14e', '#4a8ee0', 'spots'], galaxy: ['#3b2f63', '#6b5aa8', '#ffffff', '#f2c14e', 'spots'], pearl: ['#f3eef7', '#ffffff', '#d9c8ef', '#c06090', null] }[rt];
      lk.c1 = RC[0]; lk.c2 = RC[1]; lk.c3 = RC[2]; lk.eye = RC[3]; lk.eye2 = null; lk.socks = lk.chest = lk.eyespot = 0;
      if (lk.t === 'dog' || lk.t === 'cat') lk.pat = RC[4]; else if (lk.t === 'rat') lk.pat = null;
      lk.rare = rt;
    } else if (lk.c1 !== '#ffffff') { const k = (R() - .5) * .12, same = lk.c2 === lk.c1; lk.c1 = shade(lk.c1, k); if (same) lk.c2 = lk.c1; }
    lk.sz = .93 + R() * .14;
    // v1.11: body build from its own hash (so existing coats keep their colours): slim / normal / chubby / round with a pot belly
    { const h = (Math.imul((seed >>> 0) ^ 0x5bd1e995, 2654435761) >>> 0) % 100; lk.bld = h < 18 ? .8 : h < 62 ? 1 : h < 88 ? 1.25 : 1.45; }
    lk.seed = seed;
    if (CACHE.size > 400) CACHE.clear();
    CACHE.set(key, lk); return lk;
  }

  function earsCat(c, lk, hy, R, st) {
    const ear = lk.ear, droop = st.mood === 'scared' || st.mood === 'sad' ? .35 : st.mood === 'angry' ? .55 : 0;
    for (const s of [-1, 1]) {
      c.save(); c.translate(s * R * .62, hy - R * .62); c.rotate(s * droop);
      c.beginPath();
      const col = lk.pat === 'point' ? lk.c3 : lk.pat === 'calico' ? (s < 0 ? lk.c2 : lk.c3) : lk.c1;
      if (ear === 'fold') { c.moveTo(-7, 2); c.quadraticCurveTo(0, -8, 7, 2); c.closePath(); }
      else { const big = lk.bigear ? 1.35 : 1; c.moveTo(-8 * big, 4); c.quadraticCurveTo(s * 1 * big, -6 * big, s * 3 * big, -13 * big); c.quadraticCurveTo(s * 5, -4 * big, 8 * big, 4); c.closePath(); }
      c.fillStyle = col; c.fill(); c.lineWidth = 1.5; c.strokeStyle = OUT; c.stroke();
      if (ear !== 'fold') {
        const k = lk.bigear ? 1.3 : 1;
        c.beginPath(); c.moveTo(-4, 2); c.lineTo(s * 2, -7 * k); c.lineTo(4, 2); c.closePath();
        const g = c.createLinearGradient(0, -7 * k, 0, 2); g.addColorStop(0, '#e68f9a'); g.addColorStop(1, '#f9c9c9'); c.fillStyle = g; c.fill();
        if (lk.fluff || lk.t === 'cat') { c.lineWidth = .8; c.strokeStyle = 'rgba(255,255,255,.85)'; for (const d of [-1.5, 0, 1.5]) { c.beginPath(); c.moveTo(d, 3); c.lineTo(d + s * .6, -2.5); c.stroke(); } }
      }
      if (lk.tuft) { c.beginPath(); c.moveTo(s * 3, -13); c.lineTo(s * 4.5, -19); c.lineWidth = 1.6; c.strokeStyle = OUT; c.stroke(); }
      c.restore();
    }
  }
  function earsDog(c, lk, hy, R, st) {
    const e = lk.ear;
    const ecol = lk.earCol || (lk.pat === 'beagle' || lk.pat === 'mask' || lk.pat === 'patches' || lk.pat === 'tri' ? lk.c2 : lk.pat === 'beard' ? shade(lk.c1, -.1) : lk.c1);
    const perk = st.mood === 'curious' || st.mood === 'happy' ? -.08 : st.mood === 'sad' || st.mood === 'scared' ? .35 : 0;
    for (const s of [-1, 1]) {
      c.save(); c.translate(s * R * .72, hy - R * .45);
      c.beginPath();
      if (e === 'up' || e === 'bigup' || e === 'big' || e === 'bat' || e === 'semi' || e === 'tiny') {
        c.rotate(s * perk * 1.4);
        const k = e === 'bigup' ? 1.35 : e === 'big' ? 1.5 : e === 'bat' ? 1.25 : e === 'tiny' ? .6 : 1;
        c.moveTo(-7 * k, 5); c.quadraticCurveTo(s * 1 * k, -18 * k, 7 * k, 3); c.closePath();
        if (e === 'semi') { c.beginPath(); c.moveTo(-7, 5); c.quadraticCurveTo(0, -14, 8, 2); c.quadraticCurveTo(s * 10, -2, s * 12, 6); c.closePath(); }
        c.fillStyle = ecol; c.fill(); c.lineWidth = 1.5; c.strokeStyle = OUT; c.stroke();
        c.beginPath(); c.moveTo(-3.5 * k, 3); c.quadraticCurveTo(s * .5 * k, -11 * k, 3.5 * k, 2); c.closePath();
        const g = c.createLinearGradient(0, -11 * k, 0, 3); g.addColorStop(0, '#e08d86'); g.addColorStop(1, '#f7c3b8'); c.fillStyle = g; c.fill();
      } else if (e === 'fluffy' || lk.curly) {
        c.translate(s * 3.2, 7 + perk * 6);
        for (let i = 0; i < 4; i++) {
          const ew = 6.6 + (i === 1 || i === 2 ? 1.5 : 0), eh = 6.2;
          ell(c, s * (i * .5), i * 4.6, ew, eh, ecol, OUT, 1.2);
          ell(c, s * (i * .5) - s * 1.3, i * 4.6 - 1.2, ew * .48, eh * .42, shade(ecol, .16));
        }
      } else if (e === 'fold') {
        c.rotate(s * perk);
        c.moveTo(-6, 0); c.quadraticCurveTo(s * 8, -6, 7, 4); c.closePath(); c.fillStyle = ecol; c.fill(); c.lineWidth = 1.5; c.strokeStyle = OUT; c.stroke();
      } else { // flop, long
        const len = e === 'long' ? 20 : 15;
        c.translate(s * R * .1, 0); // a little further out so both flop ears read clearly beside the head
        c.rotate(s * (.25 + perk));
        c.moveTo(s * 3, -4); c.quadraticCurveTo(s * 10, 0, s * 6, len); c.quadraticCurveTo(s * 1, len + 4, s * 2, len - 3); c.closePath(); // v9.71: base x mirrored with s (was fixed at -3/-2, so the RIGHT flop ear started inside the head and hid behind it)
        c.fillStyle = ecol; c.fill(); c.lineWidth = 1.5; c.strokeStyle = OUT; c.stroke();
        if (e === 'long' || lk.fluff) { c.lineWidth = .9; c.strokeStyle = shade(ecol, -.18); for (let i = 1; i < 4; i++) { c.beginPath(); c.moveTo(s * (2 + i), i * 4); c.quadraticCurveTo(s * (5 + i), len * .6, s * (3 + i * .6), len - 1); c.stroke(); } }
      }
      c.restore();
    }
  }
  // v1.11: a round pot belly sticking out under a chubby pet (lighter fur, soft outline on the lower half, a little shine)
  function potBelly(c, x, y, rx, ry, col) {
    ell(c, x, y, rx, ry, col);
    c.beginPath(); c.ellipse(x, y, rx, ry, 0, Math.PI * .08, Math.PI * .92); c.lineWidth = 1.1; c.strokeStyle = 'rgba(60,38,25,.55)'; c.stroke();
    ell(c, x - rx * .3, y - ry * .3, rx * .35, ry * .22, 'rgba(255,255,255,.35)');
    ell(c, x + rx * .45, y + ry * .1, rx * .22, ry * .16, 'rgba(255,150,160,.35)');
  }
  // Main pet drawing. anchor at feet (0,0). state: {t, moving, sleep, happy, dir(1|-1), seed, mood}
  function pet(c, sp, st0) {
    const lk = look(sp, st0.seed); const t = st0.t || 0;
    const st = Object.assign({}, st0);
    st.mood = st.sleep ? 'sleep' : st.happy ? 'happy' : (st.mood || 'calm');
    st.blink = !st.sleep && ((t + ((lk.seed || 7) % 97) * .37) % 3.4) < .14;
    c.save(); c.scale(st.dir || 1, 1);
    const bob = st.moving ? Math.abs(Math.sin(t * 12)) * 2.2 : st.sleep ? Math.sin(t * 1.5) * .8 : st.mood === 'scared' ? Math.sin(t * 40) * .5 : Math.sin(t * 2.5) * .7;
    const sc = (lk.small ? .8 : 1) * (lk.sz || 1);
    c.scale(sc * (st.size || 1), sc * (st.size || 1));
    const B = lk.bld || 1, own = ['dog', 'cat', 'rat', 'rabbit'].includes(lk.t); // those draw their own wider body + belly; everybody gets a little wider / narrower overall
    if (B !== 1) c.scale(1 + (B - 1) * (own ? .3 : lk.t === 'rodent' || lk.t === 'guinea' ? .8 : .55), 1 - (B - 1) * .1);
    switch (lk.t) {
      case 'dog': case 'cat': quad(c, lk, t, bob, st); break;
      case 'sitshiba':
        if (st.moving || st.sleep) quad(c, lk, t, bob, st);
        else sitShiba(c, lk, t, bob, st);
        break;
      case 'rabbit': rabbit(c, lk, t, bob, st); break;
      case 'rodent': case 'guinea': rodent(c, lk, t, bob, st); break;
      case 'rat': rat(c, lk, t, bob, st); break;
      case 'hedgehog': hedgehog(c, lk, t, bob, st); break;
      case 'ferret': ferret(c, lk, t, bob, st); break;
      case 'bird': bird(c, lk, t, bob, st); break;
      case 'fish': case 'axolotl': fish(c, lk, t, st); break;
      case 'turtle': turtle(c, lk, t, bob, st); break;
      case 'gecko': gecko(c, lk, t, bob, st); break;
      case 'snake': snake(c, lk, t, bob, st); break;
    }
    if (lk.rare) sparkles(c, lk.rare, t);
    c.restore();
  }
  // ---------- accessories (v9.78: more kinds + clothes) ----------
  // collar: a band round the neck + something hanging in front (tag / bell / heart / pearls / bandana / rainbow)
  function collarAt(c, w, x, y, rx, ry, tagY) {
    const k = w.kind || 'tag';
    if (k === 'bandana') { // a little triangle scarf
      c.beginPath(); c.moveTo(x - rx, y - ry * .2); c.quadraticCurveTo(x, y + ry * 1.2, x + rx, y - ry * .2); c.lineTo(x, tagY + rx * .45); c.closePath();
      c.fillStyle = w.col; c.fill(); c.lineWidth = 1; c.strokeStyle = OUT; c.stroke();
      for (const [dx, dy] of [[-.4, .15], [.35, .2], [0, .55]]) ell(c, x + dx * rx, y + dy * rx * .6 + ry * .5, 1, 1, '#ffffff');
      return;
    }
    c.save(); c.lineCap = 'round';
    if (k === 'rainbow') { const cols = ['#ff6b6b', '#ffb347', '#ffe066', '#7bd389', '#6fb7ff', '#b48aff'];
      for (let i = 0; i < cols.length; i++) { const a0 = Math.PI * (.04 + .92 * i / cols.length), a1 = Math.PI * (.04 + .92 * (i + 1) / cols.length); c.beginPath(); c.ellipse(x, y, rx, ry, 0, a0, a1); c.lineWidth = 3.2; c.strokeStyle = cols[i]; c.stroke(); } }
    else if (k === 'pearl') { for (let i = 0; i <= 8; i++) { const a2 = Math.PI * (.08 + .84 * i / 8); ell(c, x + Math.cos(a2) * rx, y + Math.sin(a2) * ry, 1.5, 1.5, '#fbf6ee', 'rgba(120,100,90,.7)', .6); } }
    else { c.beginPath(); c.ellipse(x, y, rx, ry, 0, Math.PI * .04, Math.PI * .96); c.lineWidth = 3; c.strokeStyle = w.col; c.stroke(); }
    c.restore();
    if (k === 'bell') { ell(c, x, tagY + .6, 2.8, 2.6, '#ffd23a', OUT, .8); c.beginPath(); c.moveTo(x - 2, tagY + .8); c.lineTo(x + 2, tagY + .8); c.lineWidth = .6; c.strokeStyle = 'rgba(120,80,20,.8)'; c.stroke(); ell(c, x, tagY + 2, .7, .7, '#6a4a1a'); }
    else if (k === 'heart') { c.beginPath(); const hx0 = x, hy0 = tagY + 2.6, r = 2.6; c.moveTo(hx0, hy0); c.bezierCurveTo(hx0 - r * 1.6, hy0 - r * .9, hx0 - r * .7, hy0 - r * 2.1, hx0, hy0 - r * 1.2); c.bezierCurveTo(hx0 + r * .7, hy0 - r * 2.1, hx0 + r * 1.6, hy0 - r * .9, hx0, hy0); c.fillStyle = '#ff5a7a'; c.fill(); c.lineWidth = .7; c.strokeStyle = OUT; c.stroke(); }
    else if (k === 'pearl') ell(c, x, tagY, 2, 2, '#ffe0ef', OUT, .6);
    else if (k !== 'rainbow') ell(c, x, tagY, 2.3, 2.3, '#ffd23a', OUT, .8);
  }
  function hatAt(c, w, hx, hy, R) {
    const k = w.kind, col = w.hatCol || '#ef7fa0';
    c.save();
    if (k === 'party') {
      c.translate(hx, hy - R * .8); c.rotate(-.18);
      c.beginPath(); c.moveTo(-7, 5); c.lineTo(7, 5); c.lineTo(0, -12); c.closePath(); c.fillStyle = col; c.fill(); c.lineWidth = 1.2; c.strokeStyle = OUT; c.stroke();
      ell(c, 0, -12, 1.8, 1.8, '#ffe680');
    } else if (k === 'bow') {
      c.translate(hx + R * .48, hy - R * .68);
      for (const s of [-1, 1]) { c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(s * 6.5, -5.5, s * 7.5, 1); c.quadraticCurveTo(s * 5.5, 3.5, 0, 0); c.closePath(); c.fillStyle = col; c.fill(); c.lineWidth = 1; c.strokeStyle = OUT; c.stroke(); }
      ell(c, 0, 0, 1.8, 1.8, shade(col, -.2));
    } else if (k === 'crown') {
      c.translate(hx, hy - R * .88); const W = R * .62;
      c.beginPath(); c.moveTo(-W, 3); c.lineTo(-W, -3); c.lineTo(-W * .5, 0); c.lineTo(0, -6); c.lineTo(W * .5, 0); c.lineTo(W, -3); c.lineTo(W, 3); c.closePath();
      c.fillStyle = '#f5c542'; c.fill(); c.lineWidth = 1; c.strokeStyle = '#8a5a14'; c.stroke();
      ell(c, 0, 0, 1.3, 1.3, '#e0413a'); ell(c, -W * .6, 1, 1, 1, '#4f9ae8'); ell(c, W * .6, 1, 1, 1, '#4fbf6a');
    } else if (k === 'flower') {
      c.translate(hx, hy - R * .72);
      const cols = ['#ff9ac1', '#ffe066', '#b7a0ff', '#ffffff', '#ff9ac1'];
      for (let i = 0; i < 5; i++) { const a2 = Math.PI * (1.12 + .76 * i / 4), fx = Math.cos(a2) * R * .72, fy = Math.sin(a2) * R * .32 + 2;
        for (let p2 = 0; p2 < 5; p2++) ell(c, fx + Math.cos(p2 * 1.257) * 1.7, fy + Math.sin(p2 * 1.257) * 1.7, 1.5, 1.5, cols[i]); ell(c, fx, fy, 1, 1, '#f2a33a'); }
      for (const s of [-1, 1]) ell(c, s * R * .78, 3.5, 2, 1.1, '#6fbf5a');
    } else if (k === 'beret') {
      c.translate(hx - R * .1, hy - R * .82); c.rotate(-.15);
      ell(c, 0, 0, R * .72, R * .3, col, OUT, 1.1); ell(c, -R * .15, -R * .12, R * .45, R * .14, shade(col, .15)); c.beginPath(); c.moveTo(0, -R * .3); c.lineTo(1, -R * .45); c.lineWidth = 1.6; c.strokeStyle = OUT; c.stroke();
    } else if (k === 'santa') {
      c.translate(hx, hy - R * .8); c.rotate(-.12);
      c.beginPath(); c.moveTo(-R * .62, 3); c.quadraticCurveTo(-R * .2, -R * .9, R * .8, -R * .5); c.lineTo(R * .6, 3); c.closePath(); c.fillStyle = '#e0413a'; c.fill(); c.lineWidth = 1; c.strokeStyle = OUT; c.stroke();
      rrect(c, -R * .7, 1, R * 1.4, 4, 2); c.fillStyle = '#ffffff'; c.fill(); c.stroke(); ell(c, R * .82, -R * .5, 2.4, 2.4, '#ffffff', OUT, .8);
    } else if (k === 'witch') {
      c.translate(hx, hy - R * .8); c.rotate(-.1);
      ell(c, 0, 3, R * .85, 2.6, '#3b2a55', OUT, 1);
      c.beginPath(); c.moveTo(-R * .42, 3); c.lineTo(R * .42, 3); c.quadraticCurveTo(R * .1, -R * .6, R * .5, -R * 1.05); c.quadraticCurveTo(-R * .15, -R * .5, -R * .42, 3); c.closePath(); c.fillStyle = '#4a3570'; c.fill(); c.lineWidth = 1; c.strokeStyle = OUT; c.stroke();
      c.fillStyle = col; c.fillRect(-R * .42, 0, R * .84, 2);
    } else if (k === 'cap') {
      c.translate(hx, hy - R * .74);
      c.beginPath(); c.ellipse(0, 0, R * .62, R * .42, 0, Math.PI, TAU); c.closePath(); c.fillStyle = col; c.fill(); c.lineWidth = 1; c.strokeStyle = OUT; c.stroke();
      ell(c, R * .45, .5, R * .45, 1.8, shade(col, -.15), OUT, .9); ell(c, 0, -R * .42, 1.3, 1.3, shade(col, .3));
    }
    c.restore();
  }
  // wearOn: collar + hat for a head at (hx, hy) of radius R. o.collar === false: the body function drew the collar itself
  function wearOn(c, st, hx, hy, R, o) {
    const w = st.wear; if (!w) return;
    if (w.collar && !(o && o.collar === false)) collarAt(c, w.collar, hx, hy + R * .8, R * .82, R * .3, hy + R * .98);
    if (w.hat) hatAt(c, w.hat, hx, hy, R);
  }
  // clothes over the body ellipse (cx, cy, rx, ry). o.minX: only the part right of x (guinea pig: its face is inside the body)
  function clothOn(c, st, cx, cy, rx, ry, o) {
    const w = st.wear && st.wear.cloth; if (!w) return;
    const k = w.kind, col = w.col, c2 = w.col2 || '#ffffff';
    c.save(); c.beginPath(); c.ellipse(cx, cy, rx + .4, ry + .4, 0, 0, TAU); c.clip();
    if (o && o.minX != null) { c.beginPath(); c.rect(o.minX, cy - ry - 3, rx * 3, ry * 2 + 6); c.clip(); }
    const X0 = cx - rx - 2, Y0 = cy - ry - 2, WW = rx * 2 + 4, HH = ry * 2 + 4;
    c.fillStyle = col; c.fillRect(X0, Y0, WW, HH);
    if (k === 'stripe') for (let yy = Y0 + 2; yy < Y0 + HH; yy += 4.2) { c.fillStyle = c2; c.fillRect(X0, yy, WW, 1.8); }
    else if (k === 'dots' || k === 'dress') for (let i = 0; i < 16; i++) ell(c, X0 + 2 + (i * 7.3) % WW, Y0 + 2 + (i * 4.1) % HH, 1.1, 1.1, c2);
    else if (k === 'hoodie') { rrect(c, cx - rx * .45, cy + ry * .05, rx * .9, ry * .55, 2); c.fillStyle = shade(col, -.12); c.fill(); for (const s of [-1, 1]) { c.beginPath(); c.moveTo(cx + s * 2, cy - ry * .75); c.lineTo(cx + s * 2.4, cy - ry * .1); c.lineWidth = .9; c.strokeStyle = '#ffffff'; c.stroke(); } }
    else if (k === 'rain') { for (const yy of [-.35, .05, .45]) ell(c, cx, cy + yy * ry, 1.2, 1.2, '#6a4a1a'); c.beginPath(); c.moveTo(cx, Y0); c.lineTo(cx, Y0 + HH); c.lineWidth = .8; c.strokeStyle = shade(col, -.25); c.stroke(); }
    else if (k === 'tux') { c.beginPath(); c.moveTo(cx - rx * .38, Y0); c.lineTo(cx, cy + ry * .75); c.lineTo(cx + rx * .38, Y0); c.closePath(); c.fillStyle = '#ffffff'; c.fill(); for (const yy of [-.2, .2]) ell(c, cx, cy + yy * ry, .9, .9, '#222'); }
    else if (k === 'sailor') { c.fillStyle = '#2d4a8a'; c.fillRect(X0, Y0, WW, ry * .55); c.fillStyle = '#ffffff'; c.fillRect(X0, Y0 + ry * .45, WW, 1.2); }
    else if (k === 'heart') { const hx0 = cx, hy0 = cy + ry * .15, r = ry * .32; c.beginPath(); c.moveTo(hx0, hy0 + r); c.bezierCurveTo(hx0 - r * 1.6, hy0 - r * .1, hx0 - r * .8, hy0 - r * 1.4, hx0, hy0 - r * .5); c.bezierCurveTo(hx0 + r * .8, hy0 - r * 1.4, hx0 + r * 1.6, hy0 - r * .1, hx0, hy0 + r); c.fillStyle = c2; c.fill(); }
    // soft fold shading + a ribbed neckline along the top edge
    const g = c.createLinearGradient(0, Y0, 0, Y0 + HH); g.addColorStop(0, 'rgba(255,255,255,.18)'); g.addColorStop(1, 'rgba(0,0,0,.12)'); c.fillStyle = g; c.fillRect(X0, Y0, WW, HH);
    c.restore();
    c.save(); c.beginPath(); c.ellipse(cx, cy, rx, ry, 0, Math.PI * 1.05, Math.PI * 1.95); c.lineWidth = 2.4; c.strokeStyle = k === 'sailor' ? '#ffffff' : shade(col, -.2); c.stroke(); c.restore();
    c.beginPath(); c.ellipse(cx, cy, rx, ry, 0, 0, TAU); c.lineWidth = 1.2; c.strokeStyle = OUT; c.stroke();
    if (k === 'dress') { // a frilly hem peeking out below the body
      c.beginPath(); const hy1 = cy + ry * .72; c.moveTo(cx - rx * .85, hy1);
      for (let i = 0; i <= 8; i++) { const xx = cx - rx * .85 + i * rx * .2125; c.quadraticCurveTo(xx - rx * .1, hy1 + 4.5, xx, hy1 + (i % 2 ? 1 : 3)); }
      c.lineTo(cx + rx * .85, hy1); c.closePath(); c.fillStyle = col; c.fill(); c.lineWidth = 1; c.strokeStyle = OUT; c.stroke();
    }
    if (k === 'tux') { c.save(); c.translate(cx, cy - ry * .72); for (const s of [-1, 1]) { c.beginPath(); c.moveTo(0, 0); c.lineTo(s * 3.6, -2); c.lineTo(s * 3.6, 2); c.closePath(); c.fillStyle = '#e0413a'; c.fill(); c.lineWidth = .7; c.strokeStyle = OUT; c.stroke(); } ell(c, 0, 0, 1.2, 1.2, '#b8302a'); c.restore(); }
  }
  // which body types can wear clothes (the others: collar + hat only)
  const CLOTH_T = new Set(['dog', 'cat', 'rabbit', 'rat', 'guinea', 'ferret']);
  const canCloth = sp => CLOTH_T.has((L[sp] || {}).t);
  function sparkles(c, type, t) {
    const cols = { gold: ['#ffd23a'], rainbow: ['#ff7ab8', '#ffd23a', '#6fd0ff', '#9aff8a', '#c69aff'], star: ['#ffe680'], galaxy: ['#b8a8ff', '#ffffff'], pearl: ['#ffffff', '#ffd6ec'] }[type] || ['#fff'];
    for (let i = 0; i < 4; i++) {
      const a = t * .8 + i * 1.7, k = .5 + .5 * Math.sin(t * 3 + i * 2);
      const x = Math.cos(a) * (18 + i * 2), y = -26 + Math.sin(a * 1.3) * 16, r = 1.5 + 2.5 * k;
      c.save(); c.translate(x, y); c.globalAlpha = .4 + .6 * k; c.fillStyle = cols[i % cols.length];
      c.beginPath(); c.moveTo(0, -r * 1.8); c.quadraticCurveTo(r * .3, -r * .3, r * 1.8, 0); c.quadraticCurveTo(r * .3, r * .3, 0, r * 1.8); c.quadraticCurveTo(-r * .3, r * .3, -r * 1.8, 0); c.quadraticCurveTo(-r * .3, -r * .3, 0, -r * 1.8); c.fill();
      c.restore();
    }
  }
  // ---------- expressive eyes ----------
  // mode: open | happy | closed | half | angry | sad | wide | sparkle | up
  function eyeModeOf(st) {
    if (st.mood === 'sleep') return 'closed';
    if (st.blink && st.mood !== 'happy') return 'closed';
    return { happy: 'happy', love: 'sparkle', curious: 'sparkle', hungry: 'up', sleepy: 'half', sad: 'sad', dirty: 'sad', scared: 'wide', angry: 'angry' }[st.mood] || 'open';
  }
  function eye(c, ex, ey, rx, ry, col, mode, s, o) {
    o = o || {};
    if (mode === 'closed' || mode === 'sleep') { c.beginPath(); c.moveTo(ex - rx, ey + ry * .1); c.quadraticCurveTo(ex, ey + ry * .6, ex + rx, ey + ry * .1); c.lineWidth = 1.8; c.lineCap = 'round'; c.strokeStyle = '#2a1a12'; c.stroke(); return; }
    if (mode === 'happy') { c.beginPath(); c.moveTo(ex - rx, ey + ry * .35); c.quadraticCurveTo(ex, ey - ry * .75, ex + rx, ey + ry * .35); c.lineWidth = 1.9; c.lineCap = 'round'; c.strokeStyle = '#2a1a12'; c.stroke(); return; }
    const W = mode === 'wide' ? 1.08 : 1;
    ell(c, ex, ey, rx * W + .9, ry * W + .9, '#1c110b');
    if (o.dark) ell(c, ex, ey, rx * W, ry * W, '#1c110b');
    else {
      const g = c.createRadialGradient(ex, ey + ry * .4, ry * .1, ex, ey, ry * 1.05);
      g.addColorStop(0, shade(col, .45)); g.addColorStop(.6, col); g.addColorStop(1, shade(col, -.35));
      ell(c, ex, ey, rx * W, ry * W, g);
    }
    const py = mode === 'up' ? -ry * .22 : mode === 'sad' ? ry * .12 : 0;
    if (!o.dark) {
      if (mode === 'wide') ell(c, ex, ey + py, rx * .28, ry * .3, '#0e0805');
      else if (o.slit && mode !== 'sparkle') ell(c, ex, ey + py, rx * .2, ry * .72, '#0e0805');
      else ell(c, ex, ey + py, rx * (mode === 'sparkle' ? .7 : .55), ry * (mode === 'sparkle' ? .7 : .58), '#0e0805');
    }
    // glossy highlights
    ell(c, ex - rx * .32, ey - ry * .38 + py * .5, rx * .36, ry * .32, '#ffffff');
    ell(c, ex + rx * .32, ey + ry * .38, rx * .16, ry * .15, 'rgba(255,255,255,.9)');
    if (mode === 'sparkle') { ell(c, ex + rx * .35, ey - ry * .1, rx * .12, ry * .12, '#fff'); ell(c, ex - rx * .1, ey + ry * .45, rx * .1, ry * .1, 'rgba(255,255,255,.8)'); }
    // eyelids
    if (mode === 'half' || mode === 'angry' || mode === 'sad') {
      let a, b; // inner/outer lid heights (fraction of ry above centre)
      if (mode === 'half') { a = b = .05; } else if (mode === 'angry') { a = .05; b = .75; } else { a = .8; b = .2; }
      const xi = ex - s * (rx + 1.5), xo = ex + s * (rx + 1.5), yi = ey - ry * a, yo = ey - ry * b;
      c.save(); c.beginPath(); c.ellipse(ex, ey, rx * W + 1.2, ry * W + 1.2, 0, 0, TAU); c.clip();
      c.beginPath(); c.moveTo(xi, yi); c.lineTo(xo, yo); c.lineTo(xo, ey - ry * 2); c.lineTo(xi, ey - ry * 2); c.closePath(); c.fillStyle = o.fur || '#e8c49a'; c.fill();
      c.restore();
      c.beginPath(); c.moveTo(ex - s * rx * 1.05, yi + .5); c.lineTo(ex + s * rx * 1.05, yo + .5); c.lineWidth = 1.6; c.strokeStyle = '#1c110b'; c.stroke();
    } else {
      c.beginPath(); c.ellipse(ex, ey, rx * W + .9, ry * W + .9, 0, Math.PI * 1.08, Math.PI * 1.92); c.lineWidth = 1.5; c.strokeStyle = '#120a06'; c.stroke();
    }
  }
  function brows(c, x, y, sp, R, mood, col) {
    if (!['sad', 'angry', 'scared', 'dirty', 'curious'].includes(mood)) return;
    c.lineWidth = 1.5; c.lineCap = 'round'; c.strokeStyle = col;
    for (const s of [-1, 1]) {
      const bx = x + s * sp, by = y - R * .32;
      c.beginPath();
      if (mood === 'angry') { c.moveTo(bx - s * R * .16, by + R * .06); c.lineTo(bx + s * R * .12, by - R * .06); }
      else if (mood === 'curious') { if (s > 0) { c.moveTo(bx - R * .12, by - R * .04); c.quadraticCurveTo(bx, by - R * .14, bx + R * .12, by - R * .05); } }
      else { c.moveTo(bx - s * R * .16, by - R * .07); c.lineTo(bx + s * R * .12, by + R * .03); }
      c.stroke();
    }
  }
  function extras(c, x, y, R, st, t) {
    const m = st.mood;
    if (m === 'sad' && (t % 3) < 1.8) { const k = (t % 3) / 1.8; c.globalAlpha = 1 - k * .6; ell(c, x - R * .42, y + R * .2 + k * R * .5, R * .07, R * .1, '#7cc4f0'); c.globalAlpha = 1; }
    if (m === 'scared') { c.beginPath(); const sx = x + R * .85, sy = y - R * .55; c.moveTo(sx, sy - 5); c.quadraticCurveTo(sx + 4, sy + 1, sx, sy + 3); c.quadraticCurveTo(sx - 4, sy + 1, sx, sy - 5); c.fillStyle = '#9ad8ff'; c.fill(); c.lineWidth = .8; c.strokeStyle = '#4a8ec0'; c.stroke(); }
    if (m === 'angry') { const ax = x + R * .72, ay = y - R * .78, k = 1 + Math.sin(t * 8) * .1; c.lineWidth = 1.8; c.strokeStyle = '#e8343c'; c.lineCap = 'round'; for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { c.beginPath(); c.moveTo(ax + dx * 1.2 * k, ay + dy * 4 * k); c.quadraticCurveTo(ax + dx * 1.5, ay + dy * 1.5, ax + dx * 4 * k, ay + dy * 1.2 * k); c.stroke(); } }
    if (m === 'hungry') { const k = (t * .7) % 1; c.globalAlpha = .85; ell(c, x + R * .14, y + R * .62 + k * 4, R * .05, R * .07 + k * R * .04, '#bfe6ff'); c.globalAlpha = 1; }
    if (m === 'love') { c.font = `${Math.round(R * .5)}px sans-serif`; c.fillStyle = '#ff5a7a'; c.globalAlpha = .6 + Math.sin(t * 4) * .3; c.fillText('♥', x + R * .7, y - R * .7 - (t % 1) * 3); c.globalAlpha = 1; }
    if (m === 'curious') { c.font = `bold ${Math.round(R * .55)}px sans-serif`; c.fillStyle = '#6a7fb5'; c.fillText('?', x + R * .8, y - R * .75 + Math.sin(t * 3)); }
  }
  // face: kind = dog | cat | rodent | rabbit | other
  function face(c, lk, x, y, R, st, opt) {
    opt = opt || {}; const kind = opt.kind || (opt.pink ? 'cat' : 'other');
    const mode = eyeModeOf(st), t = st.t || 0;
    const sp = R * (kind === 'dog' ? .4 : kind === 'cat' ? .42 : .4);
    const eK = 1.28 - .3 * (st.age == null ? 1 : st.age);
    const rx = R * (kind === 'cat' ? .19 : kind === 'dog' ? .17 : .16) * eK, ry = R * (kind === 'cat' ? .2 : kind === 'dog' ? .19 : .18) * eK;
    const dark = !lk.eye && kind !== 'dog' && kind !== 'cat';
    const ecol = lk.eye || (kind === 'dog' ? '#6a4228' : '#3a2418');
    for (const s of [-1, 1]) {
      const col = s > 0 && lk.eye2 ? lk.eye2 : ecol;
      eye(c, x + s * sp, y, rx, ry, col, mode, s, { slit: kind === 'cat' && !st.happy && st.mood !== 'love', dark, fur: opt.fur || lk.c1 });
    }
    brows(c, x, y, sp, R, st.mood, shade(opt.fur || lk.c1, -.45));
    blush(c, x, y + R * .28, R * .56, R * (st.mood === 'love' || st.mood === 'happy' ? .2 : .15));
    const ny = y + R * .24, m = st.mood;
    c.lineCap = 'round'; c.lineJoin = 'round';
    const mouthOpen = m === 'happy' || m === 'love' || m === 'hungry' || m === 'scared' || (m === 'angry' && kind === 'cat') || (lk.smile && m === 'calm') || lk.shiba || lk.curly;
    if (kind === 'dog') {
      // nose
      const nw = R * (lk.flat ? .15 : .18), nh = R * .12;
      c.beginPath(); c.moveTo(x - nw, ny - nh * .5); c.quadraticCurveTo(x, ny - nh * 1.1, x + nw, ny - nh * .5); c.quadraticCurveTo(x + nw * .9, ny + nh * .5, x, ny + nh * .75); c.quadraticCurveTo(x - nw * .9, ny + nh * .5, x - nw, ny - nh * .5); c.closePath();
      c.fillStyle = lk.pat === 'point' ? '#8a5a4a' : lk.c1 === '#6b4630' ? '#5a3a2a' : '#231915'; c.fill();
      ell(c, x - nw * .35, ny - nh * .35, nw * .3, nh * .22, 'rgba(255,255,255,.6)');
      const my = ny + nh * .75;
      c.lineWidth = 1.3; c.strokeStyle = '#2a1a12';
      c.beginPath(); c.moveTo(x, my); c.lineTo(x, my + R * .08); c.stroke();
      if (mouthOpen) {
        c.beginPath(); c.moveTo(x - R * .2, my + R * .06); c.quadraticCurveTo(x, my + R * (m === 'scared' ? .2 : .42), x + R * .2, my + R * .06); c.quadraticCurveTo(x, my + R * .12, x - R * .2, my + R * .06); c.closePath();
        c.fillStyle = '#8a2a2a'; c.fill(); c.stroke();
        if (m !== 'scared') { c.save(); c.clip(); ell(c, x, my + R * .3, R * .11, R * .1, '#f26d7d'); c.restore(); }
        if (m === 'hungry' || lk.shiba || lk.curly || lk.tongue || (m === 'happy' && Math.sin(t * 3) > 0)) { c.beginPath(); c.ellipse(x + R * .03, my + R * .34, R * .08, R * .12, 0, 0, TAU); c.fillStyle = '#f26d7d'; c.fill(); c.lineWidth = 1; c.stroke(); c.beginPath(); c.moveTo(x + R * .03, my + R * .26); c.lineTo(x + R * .03, my + R * .4); c.strokeStyle = '#d24a5a'; c.stroke(); }
      } else if (m === 'sad' || m === 'dirty' || m === 'angry') {
        c.beginPath(); c.moveTo(x - R * .16, my + R * .2); c.quadraticCurveTo(x, my + R * .06, x + R * .16, my + R * .2); c.stroke();
      } else if (m === 'sleepy' || m === 'sleep') {
        c.beginPath(); c.moveTo(x - R * .1, my + R * .1); c.lineTo(x + R * .1, my + R * .1); c.stroke();
      } else {
        c.beginPath(); c.moveTo(x - R * .17, my + R * .06); c.quadraticCurveTo(x - R * .08, my + R * .16, x, my + R * .08); c.quadraticCurveTo(x + R * .08, my + R * .16, x + R * .17, my + R * .06); c.stroke();
      }
    } else {
      // small pink nose + mouth (cats, rodents, rabbits, others)
      const pink = lk.c1 === BK || lk.t === 'hedgehog' ? '#3a2a24' : '#f08a9a';
      c.beginPath(); c.moveTo(x - R * .09, ny - R * .02); c.quadraticCurveTo(x, ny - R * .07, x + R * .09, ny - R * .02); c.quadraticCurveTo(x + R * .03, ny + R * .08, x, ny + R * .09); c.quadraticCurveTo(x - R * .03, ny + R * .08, x - R * .09, ny - R * .02); c.closePath();
      c.fillStyle = pink; c.fill(); c.lineWidth = .8; c.strokeStyle = shade(pink, -.3); c.stroke();
      ell(c, x - R * .03, ny - R * .01, R * .03, R * .02, 'rgba(255,255,255,.7)');
      const my = ny + R * .09; c.lineWidth = 1.2; c.strokeStyle = '#3a2418';
      c.beginPath(); c.moveTo(x, my); c.lineTo(x, my + R * .05); c.stroke();
      if (mouthOpen) {
        c.beginPath(); c.moveTo(x - R * .13, my + R * .05); c.quadraticCurveTo(x, my + R * (m === 'scared' ? .18 : .28), x + R * .13, my + R * .05); c.quadraticCurveTo(x, my + R * .1, x - R * .13, my + R * .05); c.closePath();
        c.fillStyle = '#9a3a3a'; c.fill(); c.stroke();
        if (m !== 'scared' && m !== 'angry') { c.save(); c.clip(); ell(c, x, my + R * .22, R * .08, R * .07, '#f5838f'); c.restore(); }
        if (m === 'angry') for (const s of [-1, 1]) { c.beginPath(); c.moveTo(x + s * R * .09, my + R * .07); c.lineTo(x + s * R * .06, my + R * .14); c.lineTo(x + s * R * .04, my + R * .07); c.fillStyle = '#fff'; c.fill(); }
      } else if (m === 'sad' || m === 'dirty') {
        c.beginPath(); c.moveTo(x - R * .12, my + R * .14); c.quadraticCurveTo(x, my + R * .03, x + R * .12, my + R * .14); c.stroke();
      } else {
        c.beginPath(); c.moveTo(x - R * .14, my + R * .02); c.quadraticCurveTo(x - R * .07, my + R * .12, x, my + R * .05); c.quadraticCurveTo(x + R * .07, my + R * .12, x + R * .14, my + R * .02); c.stroke();
      }
      if (kind === 'rodent' || kind === 'rabbit') { c.fillStyle = '#fff'; c.strokeStyle = 'rgba(60,38,25,.6)'; c.lineWidth = .6; for (const s of [-1, 1]) { rrect(c, x + (s < 0 ? -R * .07 : 0), my + R * .05, R * .065, R * .09, 1); c.fill(); c.stroke(); } }
      if (kind === 'cat' || kind === 'rodent' || kind === 'rabbit') {
        for (const s of [-1, 1]) { for (const k of [0, 1, 2]) ell(c, x + s * R * (.2 + k * .05), ny + R * (.08 + (k % 2) * .05), R * .018, R * .018, 'rgba(60,40,30,.45)'); }
        if (!st.sleep) for (const s of [-1, 1]) for (const k of [0, 1]) { c.beginPath(); c.moveTo(x + s * R * .32, ny + R * (.1 + k * .08)); c.quadraticCurveTo(x + s * R * .7, ny + R * (.02 + k * .1), x + s * R * 1.08, ny + R * (.04 + k * .2)); c.lineWidth = .7; c.strokeStyle = 'rgba(60,40,30,.45)'; c.stroke(); }
      }
    }
    extras(c, x, y, R, st, t);
  }
  function dirt(c, x, y, R, st) {
    if (st.mood !== 'dirty') return;
    for (const [dx, dy, r] of [[-.5, .2, .12], [.4, -.1, .09], [.1, .5, .1], [-.2, -.5, .07]]) ell(c, x + dx * R, y + dy * R, r * R, r * R * .7, 'rgba(110,80,50,.45)');
    const t = st.t || 0; c.lineWidth = 1.2; c.strokeStyle = 'rgba(120,140,90,.6)';
    for (const s of [-1, 1]) { c.beginPath(); const bx = x + s * R * .9; for (let i = 0; i < 4; i++) { const yy = y - R * .9 - i * 3; const xx = bx + Math.sin(t * 4 + i) * 2; i ? c.lineTo(xx, yy) : c.moveTo(xx, yy); } c.stroke(); }
  }
  function fluffEdge(c, x, y, rx, ry, col, n, amp) {
    c.beginPath();
    for (let i = 0; i <= n; i++) {
      const a = i / n * TAU, r = 1 + (i % 2 ? amp : 0);
      const px = x + Math.cos(a) * rx * r, py = y + Math.sin(a) * ry * r;
      if (!i) c.moveTo(px, py); else c.quadraticCurveTo(x + Math.cos(a - Math.PI / n) * rx * (1 + amp * 1.4), y + Math.sin(a - Math.PI / n) * ry * (1 + amp * 1.4), px, py);
    }
    c.closePath(); c.fillStyle = typeof col === 'string' ? grad(c, x, y, Math.max(rx, ry), col) : col; c.fill(); c.lineWidth = 1.5; c.strokeStyle = OUT; c.stroke();
  }
  function furStrokes(c, x, y, rx, ry, col, n) {
    c.lineWidth = .8; c.lineCap = 'round'; c.strokeStyle = shade(col, col === '#ffffff' ? -.12 : -.2);
    for (let i = 0; i < n; i++) { const a = Math.PI * (1.15 + i * .7 / n); const px = x + Math.cos(a) * rx * .75, py = y + Math.sin(a) * ry * .75; c.beginPath(); c.moveTo(px, py); c.lineTo(px + Math.cos(a) * 2.4, py + Math.sin(a) * 2.4 + 1); c.stroke(); }
  }
  function quad(c, lk, t, bob, st) { // dogs & cats
    const cat = lk.t === 'cat';
    const age = st.age == null ? 1 : st.age;
    const R = 17 * (1.12 - .14 * age), hy = -(25 + 5 * age) - bob;
    shadow(c, 0, 0, 15);
    // tail
    const wag = st.moving || st.mood === 'happy' || st.mood === 'love' ? Math.sin(t * 14) * .5 : st.mood === 'sad' || st.mood === 'scared' ? .6 : st.mood === 'angry' && cat ? Math.sin(t * 6) * .25 - .2 : Math.sin(t * 2) * .2;
    const tcol = lk.pat === 'point' ? lk.c3 : lk.pat === 'beagle' ? '#ffffff' : lk.pat === 'calico' ? lk.c3 : lk.c1;
    c.save(); c.translate(9, -9 - bob * .5); c.rotate(-0.9 + wag);
    if (cat) { c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(10, -6, 7, -17); c.lineWidth = lk.fluff ? 8 : 4.8; c.lineCap = 'round'; c.strokeStyle = OUT; c.stroke(); c.lineWidth = lk.fluff ? 6 : 3; c.strokeStyle = tcol; c.stroke(); if (lk.pat === 'tabby') { c.lineWidth = 1.4; c.strokeStyle = lk.c3; for (const k of [.35, .6, .85]) { c.beginPath(); c.arc(7 * k + 1, -17 * k, 2.2, 0, Math.PI); c.stroke(); } } }
    else if (lk.tail === 'curl') {
      // Iconic curled sickle tail (말린 꼬리 / 巻尾) for Shiba Inu
      c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(8, -8, 4, -18); c.quadraticCurveTo(-4, -18, -5, -10); c.quadraticCurveTo(-5, -4, 0, -4);
      c.lineWidth = 6; c.lineCap = 'round'; c.strokeStyle = OUT; c.stroke();
      c.lineWidth = 4.2; c.strokeStyle = tcol; c.stroke();
      c.beginPath(); c.moveTo(2, -15); c.quadraticCurveTo(-3, -16, -4, -10); c.lineWidth = 2.2; c.strokeStyle = lk.c2 || '#fff'; c.stroke();
    }
    else if (lk.fluff) { fluffEdge(c, 4, -8, 6, 8, tcol, 8, .18); }
    else if (!lk.short) { c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(6, -8, 3, -14); c.lineWidth = 5.5; c.lineCap = 'round'; c.strokeStyle = OUT; c.stroke(); c.lineWidth = 3.5; c.strokeStyle = tcol; c.stroke(); }
    else { ell(c, 1, -2, 3.2, 3, tcol, OUT, 1.1); }
    c.restore();
    // legs
    const lg = st.moving ? Math.sin(t * 12) * 2 : 0;
    const legH = (lk.short ? 5 : 7) * (.7 + .4 * age);
    const legCol = lk.pat === 'point' ? lk.c3 : lk.pat === 'husky' || lk.pat === 'blaze' || lk.pat === 'tux' || lk.socks ? lk.c2 === lk.c1 ? '#ffffff' : (lk.socks ? '#ffffff' : lk.c2) : lk.pat === 'tri' ? '#ffffff' : lk.c1;
    for (const [x, ph, front] of [[-7, 1, 0], [-2.5, -1, 1], [3, 1, 1], [7.5, -1, 0]]) {
      const ly = -legH - 2 + ph * lg * .5;
      rrect(c, x - 2.7, ly, 5.4, legH + 2 - ph * lg * .5, 2.5);
      const g = c.createLinearGradient(x - 2.7, 0, x + 2.7, 0); g.addColorStop(0, shade(legCol, .08)); g.addColorStop(1, shade(legCol, -.14)); c.fillStyle = g; c.fill(); c.lineWidth = 1.2; c.strokeStyle = OUT; c.stroke();
      if (front) { c.lineWidth = .7; c.strokeStyle = 'rgba(60,38,25,.55)'; for (const d of [-.9, .9]) { c.beginPath(); c.moveTo(x + d, -.2); c.lineTo(x + d, -1.8); c.stroke(); } }
    }
    // body
    const B = lk.bld || 1, bw = (lk.fat ? 15 : 13) * (.82 + .22 * age) * B, bh = 9.5 * (1 + (B - 1) * 1.1), by = -12 * (.8 + .2 * age) - bob * .6 + (B - 1) * 5;
    const bodyCol = lk.c1;
    if (lk.fluff) fluffEdge(c, 0, by, bw, bh, bodyCol, 14, .12);
    else ell(c, 0, by, bw, bh, grad(c, 0, by, bw, bodyCol), OUT, 1.5);
    c.save(); c.beginPath(); c.ellipse(0, by, bw, bh, 0, 0, TAU); c.clip();
    if (lk.pat === 'tabby') for (const x of [-8, -3, 2, 7]) { c.beginPath(); c.moveTo(x, by - 10); c.quadraticCurveTo(x + 2, by - 5, x, by - 1); c.lineWidth = 2; c.strokeStyle = lk.c3; c.stroke(); }
    if (lk.pat === 'calico') { ell(c, -7, by - 4, 6, 4.5, lk.c2); ell(c, 6, by - 5, 5, 4, lk.c3); ell(c, 9, by + 2, 3, 3, lk.c2); }
    if (lk.pat === 'patches' || lk.pat === 'tri') ell(c, 5, by - 4, 6.5, 4.5, lk.pat === 'tri' ? lk.c1 : lk.c2);
    if (lk.pat === 'ticked') for (let i = 0; i < 14; i++) ell(c, -11 + (i * 7.3) % 22, by - 7 + (i * 3.7) % 10, .8, .8, lk.c3 + '99');
    if (lk.pat === 'spots') for (const [x, y] of [[-8, -3], [6, -4], [0, -6], [9, 1], [-3, 1], [-10, 2]]) ell(c, x, by + y, 2.2, 1.7, lk.c3);
    c.restore();
    const belly = lk.pat === 'husky' || lk.pat === 'blaze' || lk.pat === 'tux' ? lk.c2 === lk.c1 ? '#ffffff' : lk.c2 : lk.pat === 'mask' ? shade(lk.c1, .2) : lk.pat === 'patches' || lk.pat === 'calico' || lk.pat === 'tri' || lk.pat === 'spots' ? '#ffffff' : lk.c2 === lk.c1 ? shade(lk.c1, .15) : lk.c2;
    ell(c, -2, by + 2 + (B - 1) * 4, bw * .55, 6 * (1 + (B - 1) * 1.2), lk.chest ? '#ffffff' : belly);
    if (lk.pat === 'beagle' || lk.pat === 'saddle') ell(c, 3, by - 3, bw * .6, 5, lk.pat === 'beagle' ? lk.c3 : lk.c2);
    if (B > 1.3) potBelly(c, -1, by + bh * .38, bw * .62, bh * .6, lk.chest ? '#ffffff' : belly);
    furStrokes(c, 0, by, bw, bh, bodyCol, 6);
    clothOn(c, st, 0, by, bw, 9.5);
    // chest ruff
    c.beginPath(); const ry0 = hy + R * .78; c.moveTo(-8, ry0);
    for (let i = 0; i <= 6; i++) c.lineTo(-8 + i * 2.7, ry0 + (i % 2 ? 5 : 2));
    c.lineTo(8, ry0); c.closePath(); c.fillStyle = lk.chest || lk.pat === 'tux' ? '#ffffff' : belly; c.fill();
    // head
    if (!cat) earsDog(c, lk, hy, R, st);
    else earsCat(c, lk, hy, R, st);
    if (lk.fluff === 2) fluffEdge(c, 0, hy, R + 1, R - 1, lk.c1, 16, .1);
    else if (lk.fluff) fluffEdge(c, 0, hy + 1, R + 1, R, lk.c1, 18, .08);
    else ell(c, 0, hy, R, R * .93, grad(c, 0, hy, R, lk.c1), OUT, 1.6);
    if (cat && !lk.fluff) for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * R * .92, hy + R * .1); c.lineTo(s * R * 1.1, hy + R * .3); c.lineTo(s * R * .88, hy + R * .38); c.lineTo(s * R * 1.02, hy + R * .52); c.lineTo(s * R * .78, hy + R * .6); c.fillStyle = lk.c1; c.fill(); c.lineWidth = 1.3; c.strokeStyle = OUT; c.stroke(); }
    // head patterns (clipped to head)
    c.save(); c.beginPath(); c.ellipse(0, hy, R * 1.05, R, 0, 0, TAU); c.clip();
    if (lk.pat === 'point') ell(c, 0, hy + R * .3, R * .5, R * .42, lk.c3 + 'b0');
    if (lk.pat === 'mask') ell(c, 0, hy + R * .3, R * .5, R * .4, lk.c2 + 'cc');
    if (lk.pat === 'husky') { c.beginPath(); c.moveTo(-R * .95, hy - R * .1); c.quadraticCurveTo(0, hy - R * .15, R * .95, hy - R * .1); c.lineTo(R * .75, hy + R * .6); c.quadraticCurveTo(0, hy + R * 1.1, -R * .75, hy + R * .6); c.closePath(); c.fillStyle = lk.c2; c.fill(); ell(c, 0, hy - R * .25, R * .18, R * .4, lk.c2); }
    if (lk.pat === 'blaze') { ell(c, 0, hy + R * .45, R * .55, R * .42, lk.c2); rrect(c, -R * .12, hy - R * .9, R * .24, R, R * .12); c.fillStyle = lk.c2; c.fill(); }
    if (lk.pat === 'tux') { ell(c, 0, hy + R * .5, R * .5, R * .4, lk.c2); c.beginPath(); c.moveTo(-R * .12, hy + R * .1); c.lineTo(0, hy - R * .4); c.lineTo(R * .12, hy + R * .1); c.fillStyle = lk.c2; c.fill(); }
    if (lk.pat === 'beagle') { ell(c, -R * .1, hy - R * .3, R * .8, R * .55, lk.c2); rrect(c, -R * .12, hy - R * .7, R * .24, R, R * .12); c.fillStyle = '#fff'; c.fill(); }
    if (lk.pat === 'patches' || lk.pat === 'tri') { const pc = lk.pat === 'tri' ? lk.c1 : lk.c2; for (const s of [-1, 1]) ell(c, s * R * .5, hy - R * .1, R * .45, R * .5, pc); if (lk.pat === 'tri') for (const s of [-1, 1]) ell(c, s * R * .38, hy - R * .38, R * .08, R * .06, '#c9853f'); }
    if (lk.pat === 'calico') { ell(c, -R * .55, hy - R * .45, R * .45, R * .38, lk.c2); ell(c, R * .6, hy - R * .5, R * .38, R * .32, lk.c3); }
    if (lk.pat === 'tabby') { for (const x of [-5, 0, 5]) { c.beginPath(); c.moveTo(x, hy - R * .95); c.lineTo(x * .8, hy - R * .55); c.lineWidth = 2; c.strokeStyle = lk.c3; c.stroke(); } for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * R, hy + R * .05); c.lineTo(s * R * .7, hy + R * .1); c.moveTo(s * R, hy + R * .22); c.lineTo(s * R * .72, hy + R * .22); c.lineWidth = 1.6; c.strokeStyle = lk.c3; c.stroke(); } }
    if (lk.pat === 'spots' && !cat) for (const [x, y] of [[-.5, -.5], [.55, -.3], [.1, -.75], [-.7, .1]]) ell(c, x * R, hy + y * R, R * .09, R * .08, lk.c3);
    if (lk.pat === 'wrinkle') for (const y of [-.6, -.45]) { c.beginPath(); c.moveTo(-5, hy + R * y); c.quadraticCurveTo(0, hy + R * y - 2, 5, hy + R * y); c.lineWidth = 1; c.strokeStyle = shade(lk.c1, -.25); c.stroke(); }
    if (lk.pat === 'saddle') ell(c, 0, hy + R * .3, R * .6, R * .45, shade(lk.c1, .25));
    if (lk.eyespot) ell(c, lk.eyespot * R * .4, hy, R * .32, R * .3, shade(lk.c1, lk.c1 === '#ffffff' ? -.5 : -.35));
    if (lk.shiba) {
      // Iconic Shiba Urajiro cheeks (white cheeks curving from muzzle)
      ell(c, -R * .44, hy + R * .28, R * .36, R * .28, lk.c2 || '#fff6ea');
      ell(c, R * .44, hy + R * .28, R * .36, R * .28, lk.c2 || '#fff6ea');
      // Signature round eyebrow spots (마로눈썹 / 麿眉)
      const dotCol = lk.c3 || (lk.c1 === '#2d2422' || lk.c1 === '#241d1c' || lk.c1 === '#362a28' ? '#faf0e3' : '#fff6ea');
      ell(c, -R * .36, hy - R * .32, R * .13, R * .13, dotCol);
      ell(c, R * .36, hy - R * .32, R * .13, R * .13, dotCol);
    }
    c.restore();
    // muzzle
    const muz = lk.pat === 'beagle' || lk.pat === 'patches' || lk.pat === 'tri' || lk.pat === 'tux' || lk.pat === 'spots' ? '#ffffff' : lk.pat === 'saddle' ? shade(lk.c1, .35) : lk.pat === 'point' ? shade(lk.c3, .25) : lk.pat === 'beard' ? lk.c2 : lk.c2 === lk.c1 ? shade(lk.c1, .2) : lk.c2;
    if (!cat && lk.pat !== 'mask' && lk.pat !== 'husky') {
      if (lk.pat === 'beard') { c.beginPath(); c.moveTo(-R * .45, hy + R * .15); c.quadraticCurveTo(-R * .5, hy + R * .85, 0, hy + R * .95); c.quadraticCurveTo(R * .5, hy + R * .85, R * .45, hy + R * .15); c.quadraticCurveTo(0, hy + R * .05, -R * .45, hy + R * .15); c.fillStyle = muz; c.fill(); c.lineWidth = 1.1; c.strokeStyle = OUT; c.stroke(); }
      else { ell(c, 0, hy + R * .4, R * (lk.flat ? .4 : .44), R * (lk.flat ? .28 : .32), grad(c, 0, hy + R * .4, R * .44, muz)); }
    }
    if (cat) { for (const s of [-1, 1]) ell(c, s * R * .14, hy + R * .38, R * .19, R * .15, muz); ell(c, 0, hy + R * .48, R * .12, R * .08, muz); }
    const fur = lk.pat === 'husky' || lk.pat === 'blaze' ? lk.c2 : lk.pat === 'patches' || lk.pat === 'tri' ? (lk.pat === 'tri' ? lk.c1 : lk.c2) : lk.eyespot ? lk.c1 : lk.c1;
    face(c, lk, 0, hy + 1, R, st, { kind: cat ? 'cat' : 'dog', fur });
    if (lk.pat === 'beard') for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * R * .2, hy - R * .18); c.lineTo(s * R * .62, hy - R * .3); c.lineTo(s * R * .6, hy - R * .18); c.closePath(); c.fillStyle = lk.c2; c.fill(); }
    dirt(c, 0, hy + 10, R, st);
    wearOn(c, st, 0, hy, R);
    if (lk.maltese && (!st.wear || !st.wear.hat)) {
      // Maltese soft fluffy forehead topknot / cute grooming ribbon bow
      const bowCol = lk.bowCol || (lk.c1 === '#ffffff' ? '#ff758f' : '#f59e0b');
      c.save(); c.translate(0, hy - R * .86);
      for (const s of [-1, 1]) {
        c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(s * 5, -4, s * 6, 1); c.quadraticCurveTo(s * 4, 3, 0, 0);
        c.fillStyle = bowCol; c.fill(); c.lineWidth = .8; c.strokeStyle = OUT; c.stroke();
      }
      ell(c, 0, 0, 1.6, 1.6, shade(bowCol, -.25));
      c.restore();
    }
    if (st.sleep) zz(c, 14, hy - 18, t);
  }
  // ================= SIT SHIBA (앉은 시바 시누) =================
  // 시바 시누 전용: 세 번째 참고 이미지 기준.
  // 정면 앉기, 큰 크림 볼, 입체감 있는 셰이딩, 털 디테일.
  function sitShiba(c, lk, t, bob, st) {
    const c1  = lk.c1;                   // 진브라운
    const c1d = shade(c1, -.22);         // 진브라운 그림자
    const c2  = lk.c2;                   // 크림
    const c2d = shade(c2, -.12);         // 크림 그림자
    const R = 16;                        // 머리 반지름
    const hy = -30 - bob;                // 머리 중심
    const by = -12 - bob * .5;           // 몸통 중심
    const isHappy = st.mood === 'happy' || st.mood === 'love' || st.mood === 'calm' || !st.mood;
    const isSad = st.mood === 'sad' || st.mood === 'scared' || st.mood === 'dirty';
    const isAngry = st.mood === 'angry';
    const isSleep = st.sleep;

    shadow(c, 0, 0, 17);

    // 1. 말린 꼬리 (오른쪽)
    c.save();
    c.translate(14, -10 - bob * .4);
    const wag = isHappy ? Math.sin(t * 8) * .14 : Math.sin(t * 2) * .06;
    c.rotate(-.4 + wag);
    c.beginPath();
    c.moveTo(-2, 3);
    c.quadraticCurveTo(9, -1, 8, -12);
    c.quadraticCurveTo(3, -15, 0, -10);
    c.quadraticCurveTo(-3, -5, -2, 3);
    c.closePath();
    c.fillStyle = grad(c, 3, -6, 9, c1);
    c.fill();
    c.lineWidth = 1.5; c.strokeStyle = OUT; c.stroke();
    ell(c, 6, -11, 3.4, 3.2, c2, null);
    ell(c, 3.5, -8, 2.6, 2.4, c2, null);
    c.lineWidth = .9; c.strokeStyle = c1d;
    for (let i = 0; i < 3; i++) {
      c.beginPath();
      c.moveTo(-1 + i * 2, 1 - i * 3);
      c.lineTo(2 + i * 2, -2 - i * 3);
      c.stroke();
    }
    c.restore();

    // 2. 뒷다리 (오른쪽 하나만)
    ell(c, 10, by + 1, 7.5, 7, grad(c, 10, by + 1, 7.5, c1), OUT, 1.5);
    ell(c, 11, -1.2, 4.8, 2.3, c2, OUT, 1.1);
    c.lineWidth = .8; c.strokeStyle = 'rgba(40,25,15,.5)';
    for (const d of [-1.4, 0, 1.4]) {
      c.beginPath();
      c.moveTo(11 + d, -.3);
      c.lineTo(11 + d * 1.1, -1.7);
      c.stroke();
    }

    // 3. 몸통
    const bw = 14, bh = 11;
    c.beginPath();
    c.ellipse(0, by, bw, bh, 0, 0, TAU);
    c.fillStyle = grad(c, 0, by, bw, c1);
    c.fill();
    c.lineWidth = 1.7; c.strokeStyle = OUT; c.stroke();

    // 3-1. 가슴 크림
    c.save();
    c.beginPath(); c.ellipse(0, by, bw, bh, 0, 0, TAU); c.clip();
    c.beginPath();
    c.moveTo(-9, by - 8);
    c.quadraticCurveTo(-7, by + 4, 0, by + 10);
    c.quadraticCurveTo(7, by + 4, 9, by - 8);
    c.quadraticCurveTo(0, by - 4, -9, by - 8);
    c.closePath();
    c.fillStyle = c2;
    c.fill();
    c.lineWidth = 1; c.strokeStyle = c2d;
    for (let i = -3; i <= 3; i++) {
      c.beginPath();
      c.moveTo(i * 2.3, by - 3);
      c.quadraticCurveTo(i * 2, by + 3, i * 1.2, by + 8);
      c.stroke();
    }
    c.restore();

    // 4. 앞발 2개
    for (const s of [-1, 1]) {
      const lx = s * 6.5;
      ell(c, lx, -1.2, 5, 2.5, c2, OUT, 1.2);
      c.lineWidth = .8; c.strokeStyle = 'rgba(40,25,15,.5)';
      for (const d of [-1.7, 0, 1.7]) {
        c.beginPath();
        c.moveTo(lx + d, -.3);
        c.lineTo(lx + d * 1.1, -1.9);
        c.stroke();
      }
    }

    // 5. 머리
    ell(c, 0, hy, R, R * 1.02, grad(c, 0, hy, R, c1), OUT, 1.8);

    // 5-1. 이마 털 다발
    c.save();
    c.beginPath(); c.ellipse(0, hy, R, R * 1.02, 0, 0, TAU); c.clip();
    c.lineWidth = 1.2; c.strokeStyle = c1d;
    for (let i = 0; i < 7; i++) {
      const sx = (i - 3) * 3.5;
      const sy = hy - R * .75;
      c.beginPath();
      c.moveTo(sx, sy + 2);
      c.quadraticCurveTo(sx + .5, sy - 4, sx + 1, sy - 6);
      c.stroke();
    }
    c.restore();

    // 5-2. 크림 볼 (핵심)
    c.save();
    c.beginPath(); c.ellipse(0, hy, R, R * 1.02, 0, 0, TAU); c.clip();
    c.beginPath();
    c.moveTo(-R * .95, hy + R * .2);
    c.quadraticCurveTo(-R * 1, hy + R * .55, -R * .5, hy + R * .75);
    c.quadraticCurveTo(-R * .2, hy + R * .95, 0, hy + R * 1.05);
    c.quadraticCurveTo(R * .2, hy + R * .95, R * .5, hy + R * .75);
    c.quadraticCurveTo(R * 1, hy + R * .55, R * .95, hy + R * .2);
    c.quadraticCurveTo(R * .75, hy + R * .15, R * .45, hy + R * .18);
    c.quadraticCurveTo(R * .15, hy + R * .25, 0, hy + R * .22);
    c.quadraticCurveTo(-R * .15, hy + R * .25, -R * .45, hy + R * .18);
    c.quadraticCurveTo(-R * .75, hy + R * .15, -R * .95, hy + R * .2);
    c.closePath();
    c.fillStyle = c2;
    c.fill();
    c.lineWidth = 1.2; c.strokeStyle = c2d;
    c.beginPath();
    c.moveTo(-R * .85, hy + R * .45);
    c.quadraticCurveTo(0, hy + R * .95, R * .85, hy + R * .45);
    c.stroke();
    c.restore();

    // 5-3. 눈썹점 (순백으로! 크림 볼과 구분되게) — 눈 위쪽
    for (const s of [-1, 1]) {
      const bx = s * R * .42, byy = hy - R * .38;
      ell(c, bx, byy, R * .16, R * .12, '#ffffff', null);
    }

    // 5-4. 귀 (앞 1, 뒤 1)
    drawSitShibaEar(c, R * .72, hy - R * .72, R * .65, .22, c1, c2, c1d);
    drawSitShibaEar(c, -R * .72, hy - R * .8, R * .68, -.05, c1, c2, c1d);

    // 6. 눈 (네 그림: 작고 세로로 긴 타원, 진한 검정, 하이라이트 1개)
    for (const s of [-1, 1]) {
      const ex = s * R * .48;
      const ey = hy - R * .08;
      const erx = R * .14;               // 가로 작게
      const ery = R * .2;                // 세로로 김 (비율 1.43)
      // 눈 테두리 (아주 얇게)
      ell(c, ex, ey, erx + .4, ery + .4, '#100806');
      // 홍채 (거의 검정, 살짝 갈색 기운)
      const eg = c.createRadialGradient(ex - erx * .2, ey - ery * .2, ery * .1, ex, ey + ery * .2, ery * 1.05);
      eg.addColorStop(0, '#4a2818');
      eg.addColorStop(.6, '#1e0e06');
      eg.addColorStop(1, '#0a0402');
      ell(c, ex, ey, erx, ery, eg);
      // 큰 하이라이트 1개 (왼쪽 위) — 네 그림엔 이거만 있음
      ell(c, ex - erx * .3, ey - ery * .38, erx * .4, ery * .3, '#ffffff');
    }

    // 7. 볼 블러시
    blush(c, 0, hy + R * .38, R * .82, R * .22);

    // 8. 코
    const ny = hy + R * .32;
    c.beginPath();
    c.moveTo(-R * .17, ny - R * .04);
    c.quadraticCurveTo(0, ny - R * .15, R * .17, ny - R * .04);
    c.quadraticCurveTo(R * .13, ny + R * .13, 0, ny + R * .15);
    c.quadraticCurveTo(-R * .13, ny + R * .13, -R * .17, ny - R * .04);
    c.closePath();
    c.fillStyle = '#1a1210'; c.fill();
    c.lineWidth = .9; c.strokeStyle = '#0a0604'; c.stroke();
    ell(c, -R * .06, ny - R * .05, R * .05, R * .04, 'rgba(255,255,255,.85)');

    // 9. 입 + 혀
    const my = ny + R * .16;
    if (isSleep) {
      c.lineWidth = 1.4; c.strokeStyle = '#2a1a12'; c.lineCap = 'round';
      c.beginPath();
      c.moveTo(-R * .1, my + R * .05);
      c.lineTo(R * .1, my + R * .05);
      c.stroke();
    } else if (isSad || isAngry) {
      c.lineWidth = 1.4; c.strokeStyle = '#2a1a12'; c.lineCap = 'round';
      c.beginPath();
      if (isAngry) {
        c.moveTo(-R * .13, my + R * .1);
        c.quadraticCurveTo(0, my + R * .02, R * .13, my + R * .1);
      } else {
        c.moveTo(-R * .13, my + R * .04);
        c.quadraticCurveTo(0, my + R * .14, R * .13, my + R * .04);
      }
      c.stroke();
    } else {
      c.beginPath();
      c.moveTo(-R * .13, my);
      c.quadraticCurveTo(0, my + R * .28, R * .13, my);
      c.quadraticCurveTo(0, my + R * .1, -R * .13, my);
      c.closePath();
      c.fillStyle = '#4a1818';
      c.fill();
      c.lineWidth = 1.2; c.strokeStyle = '#2a1a12'; c.stroke();
      c.beginPath();
      c.moveTo(-R * .18, my - R * .02);
      c.quadraticCurveTo(-R * .13, my + R * .06, -R * .08, my + R * .02);
      c.moveTo(R * .18, my - R * .02);
      c.quadraticCurveTo(R * .13, my + R * .06, R * .08, my + R * .02);
      c.lineWidth = 1.2; c.strokeStyle = '#2a1a12'; c.stroke();
      c.save();
      c.beginPath();
      c.moveTo(-R * .13, my);
      c.quadraticCurveTo(0, my + R * .28, R * .13, my);
      c.quadraticCurveTo(0, my + R * .1, -R * .13, my);
      c.closePath();
      c.clip();
      ell(c, 0, my + R * .18, R * .09, R * .14, '#f5808a');
      c.lineWidth = .7; c.strokeStyle = '#d04a5a';
      c.beginPath();
      c.moveTo(0, my + R * .08);
      c.lineTo(0, my + R * .3);
      c.stroke();
      c.restore();
    }

    // 10. 표정 오버레이
    if (isSad) {
      c.lineWidth = 1.6; c.strokeStyle = '#2a1a12'; c.lineCap = 'round';
      for (const s of [-1, 1]) {
        const bx = s * R * .42, byy = hy - R * .35;
        c.beginPath();
        c.moveTo(bx - s * R * .16, byy - R * .02);
        c.lineTo(bx + s * R * .13, byy + R * .04);
        c.stroke();
      }
    }
    if (isAngry) {
      c.lineWidth = 1.7; c.strokeStyle = '#2a1a12';
      for (const s of [-1, 1]) {
        const bx = s * R * .42, byy = hy - R * .35;
        c.beginPath();
        c.moveTo(bx - s * R * .15, byy + R * .06);
        c.lineTo(bx + s * R * .13, byy - R * .04);
        c.stroke();
      }
    }
    if (isSleep) {
      c.fillStyle = c1;
      for (const s of [-1, 1]) {
        ell(c, s * R * .42, hy + R * .02, R * .27, R * .34, c1);
      }
      c.lineWidth = 1.8; c.strokeStyle = '#100806'; c.lineCap = 'round';
      for (const s of [-1, 1]) {
        const ex = s * R * .42, ey = hy + R * .02;
        c.beginPath();
        c.moveTo(ex - R * .2, ey + R * .05);
        c.quadraticCurveTo(ex, ey + R * .2, ex + R * .2, ey + R * .05);
        c.stroke();
      }
      zz(c, 14, hy - 20, t);
    }

    // 11. 옷/모자/목걸이
    clothOn(c, st, 0, by, bw, bh);
    wearOn(c, st, 0, hy, R);
  }

  // 시바 시누 귀 (털 디테일 포함)
  function drawSitShibaEar(c, ex, ey, size, rot, c1, c2, c1d) {
    c.save();
    c.translate(ex, ey);
    c.rotate(rot);
    c.beginPath();
    c.moveTo(-size * .55, size * .55);
    c.quadraticCurveTo(-size * .35, -size * .95, 0, -size * 1.1);
    c.quadraticCurveTo(size * .35, -size * .95, size * .55, size * .55);
    c.closePath();
    c.fillStyle = grad(c, 0, -size * .5, size, c1);
    c.fill();
    c.lineWidth = 1.6; c.strokeStyle = OUT; c.stroke();
    c.beginPath();
    c.moveTo(-size * .38, size * .42);
    c.quadraticCurveTo(-size * .18, -size * .6, 0, -size * .78);
    c.quadraticCurveTo(size * .18, -size * .6, size * .38, size * .42);
    c.closePath();
    c.fillStyle = c2; c.fill();
    c.beginPath();
    c.moveTo(-size * .23, size * .28);
    c.quadraticCurveTo(-size * .08, -size * .35, 0, -size * .5);
    c.quadraticCurveTo(size * .08, -size * .35, size * .23, size * .28);
    c.closePath();
    const eg = c.createLinearGradient(0, -size * .5, 0, size * .3);
    eg.addColorStop(0, '#f5b8b0');
    eg.addColorStop(1, '#f5a8a0');
    c.fillStyle = eg; c.fill();
    c.lineWidth = .9; c.strokeStyle = c1d;
    for (const k of [-.6, 0, .6]) {
      c.beginPath();
      c.moveTo(size * .1 * k, -size * .1);
      c.lineTo(size * .15 * k, -size * .4);
      c.stroke();
    }
    c.restore();
  }
    function zz(c, x, y, t) {
    c.font = 'bold 11px sans-serif'; c.fillStyle = '#6a7fb5';
    const k = (t % 2) / 2; c.globalAlpha = 1 - k; c.fillText('z', x + k * 6, y - k * 10); c.fillText('Z', x + 5 + k * 6, y - 8 - k * 10); c.globalAlpha = 1;
  }
  function rabbit(c, lk, t, bob, st) {
    const R = 15, hy = -26 - bob;
    shadow(c, 0, 0, 14);
    ell(c, 11, -8 - bob * .5, 4.5, 4.5, '#fff', OUT, 1.2);
    const B = lk.bld || 1, rw = 13 * B, rh = 10 * (1 + (B - 1) * .6);
    fluffEdge(c, 0, -10 - bob * .6, rw, rh, lk.c1, 12, .05);
    if (lk.pat === 'patch') ell(c, 4, -12 - bob, 6, 4, lk.c2);
    furStrokes(c, 0, -10 - bob * .6, rw, rh, lk.c1, 5);
    if (B > 1.3) potBelly(c, 0, -6 - bob * .6, rw * .5, rh * .55, shade(lk.c1, .2));
    clothOn(c, st, 0, -10 - bob * .6, rw, rh);
    for (const x of [-6, 6]) { ell(c, x, -1.5, 4.5, 2.6, lk.c1, OUT, 1.1); c.lineWidth = .6; c.strokeStyle = 'rgba(60,38,25,.5)'; for (const d of [-1, 1]) { c.beginPath(); c.moveTo(x + d, -.5); c.lineTo(x + d, -2); c.stroke(); } }
    // ears
    const droop = st.mood === 'sad' || st.mood === 'scared' ? .5 : 0;
    for (const s of [-1, 1]) {
      c.save(); c.translate(s * 6, hy - R * .7);
      if (lk.ear === 'lop') { c.rotate(s * 1.9); } else c.rotate(s * (.12 + droop) + (st.moving ? Math.sin(t * 12) * .1 : 0) + (st.mood === 'curious' && s > 0 ? .3 : 0));
      const len = (lk.ear === 'short' ? 13 : 20) * (.75 + .25 * (st.age == null ? 1 : st.age));
      ell(c, 0, -len / 2, 4.8, len / 2, lk.c1, OUT, 1.4);
      const g = c.createLinearGradient(0, -len, 0, 0); g.addColorStop(0, '#f7c4c4'); g.addColorStop(1, '#e9959a'); ell(c, 0, -len / 2, 2.4, len / 2 - 3, g);
      c.restore();
    }
    if (lk.mane) fluffEdge(c, 0, hy + 1, R + 5, R + 3, shade(lk.c1, .12), 20, .14);
    ell(c, 0, hy, R, R * .9, grad(c, 0, hy, R, lk.c1), OUT, 1.6);
    if (lk.pat === 'patch') ell(c, -R * .45, hy - R * .1, R * .35, R * .4, lk.c2 + 'cc');
    for (const s of [-1, 1]) ell(c, s * R * .16, hy + R * .36, R * .2, R * .16, shade(lk.c1, .25));
    face(c, lk, 0, hy + 1, R, st, { kind: 'rabbit' });
    dirt(c, 0, hy + 8, R, st);
    wearOn(c, st, 0, hy, R);
    if (st.sleep) zz(c, 12, hy - 18, t);
  }
  function rodent(c, lk, t, bob, st) {
    const R = 15, y = -13 - bob;
    shadow(c, 0, 0, 13);
    const col = lk.c1;
    if (lk.t === 'guinea') {
      ell(c, 0, y, 17, 12, grad(c, 0, y, 16, col), OUT, 1.6);
      ell(c, 8, y - 3, 8, 7, lk.c2); ell(c, -9, y + 1, 6, 6, lk.c3 || lk.c2);
      furStrokes(c, 0, y, 17, 12, col, 7);
      clothOn(c, st, 0, y, 17, 12, { minX: 1 });
      for (const s of [-1, 1]) ell(c, -8 + s * 3, y - 11, 4, 3, '#f0b0a0', OUT, 1);
      face(c, lk, -6, y - 1, 13, st, { kind: 'rodent' });
    } else {
      if (lk.tail) { c.beginPath(); c.moveTo(8, y + 6); c.quadraticCurveTo(22, y + 8, 24, y - 6 + Math.sin(t * 3) * 2); c.lineWidth = 2.6; c.strokeStyle = OUT; c.stroke(); c.lineWidth = 1.6; c.strokeStyle = lk.c1; c.stroke(); ell(c, 24, y - 7 + Math.sin(t * 3) * 2, 2.4, 3.2, shade(lk.c1, -.2)); }
      for (const s of [-1, 1]) { const er = lk.ear === 'round' ? 7 : lk.ear === 'tall' ? 5 : 4.5; ell(c, s * R * .6, y - R * .75 - (lk.ear === 'tall' ? 2 : 0), er, er * (lk.ear === 'tall' ? 1.3 : 1), col, OUT, 1.3); ell(c, s * R * .6, y - R * .75 - (lk.ear === 'tall' ? 2 : 0), er * .55, er * .55 * (lk.ear === 'tall' ? 1.3 : 1), '#f4b9b2'); }
      ell(c, 0, y, R, R * .92, grad(c, 0, y, R, col), OUT, 1.6);
      if (lk.patch) { c.save(); c.beginPath(); c.ellipse(0, y, R, R * .92, 0, 0, TAU); c.clip(); ell(c, -R * .6, y - R * .5, R * .5, R * .45, '#ffffff'); c.restore(); }
      furStrokes(c, 0, y, R, R * .92, col, 6);
      ell(c, 0, y + R * .35, R * .7, R * .5, lk.c2);
      ell(c, -R * .55, y + R * .25, R * .28, R * .22, lk.c2); ell(c, R * .55, y + R * .25, R * .28, R * .22, lk.c2);
      face(c, lk, 0, y - 1, R, st, { kind: 'rodent' });
      for (const s of [-1, 1]) ell(c, s * 4, y + R * .78, 2.6, 1.8, '#f3b1a6', OUT, .8);
    }
    dirt(c, 0, y, R, st);
    wearOn(c, st, lk.t === 'guinea' ? -6 : 0, lk.t === 'guinea' ? y - 1 : y, lk.t === 'guinea' ? 13 : R);
    if (st.sleep) zz(c, 12, y - 16, t);
  }
  function rat(c, lk, t, bob, st) {
    const age = st.age == null ? 1 : st.age;
    const R = 13.5 * (1.12 - .14 * age), hy = -21 - bob - age * 2, by = -10 - bob * .5;
    shadow(c, 3, 0, 15);
    // tail
    const sw = Math.sin(t * 2.4) * 3;
    c.beginPath(); c.moveTo(14, by + 4); c.bezierCurveTo(26, by + 10, 34, by + 2 + sw, 30 + age * 6, by - 8 + sw);
    c.lineWidth = 4.2; c.lineCap = 'round'; c.strokeStyle = OUT; c.stroke(); c.lineWidth = 2.8; c.strokeStyle = '#f2b8b0'; c.stroke();
    c.lineWidth = .6; c.strokeStyle = 'rgba(160,90,80,.5)'; for (let i = 1; i < 6; i++) { const k = i / 6, x = 14 + k * (16 + age * 6), y = by + 6 - k * 10 + sw * k; c.beginPath(); c.moveTo(x - 1, y - 1.2); c.lineTo(x + .6, y + 1.2); c.stroke(); }
    // body
    const B = lk.bld || 1, bw = 14 * (.82 + .22 * age) * B, bh = 9.5 * (1 + (B - 1) * .8), bcol = lk.c1;
    ell(c, 4, by, bw, bh, grad(c, 4, by, bw, bcol), OUT, 1.5);
    if (lk.pat === 'hood') { c.save(); c.beginPath(); c.ellipse(4, by, bw, bh, 0, 0, TAU); c.clip(); c.beginPath(); c.moveTo(-12, by - 12); c.lineTo(20, by - 12); c.quadraticCurveTo(22, by - 6, 18, by - 5); c.quadraticCurveTo(8, by - 3, -12, by - 1); c.closePath(); c.fillStyle = lk.c3; c.fill(); c.restore(); }
    furStrokes(c, 4, by, bw, bh, lk.pat === 'hood' ? lk.c3 : bcol, 6);
    { const bc = lk.c2 === lk.c1 ? shade(lk.c1, .15) : lk.c2; ell(c, 0, by + 3 + (B - 1) * 3, bw * .5, 5 * (1 + (B - 1) * 1.3), bc); if (B > 1.3) potBelly(c, 0, by + bh * .45, bw * .5, bh * .55, bc); }
    clothOn(c, st, 4, by, bw, bh);
    for (const x of [-5, 4]) { ell(c, x, -1.5, 3.4, 2.1, '#f5b9b0', OUT, .9); c.lineWidth = .5; c.strokeStyle = 'rgba(120,60,50,.6)'; for (const d of [-1, 0, 1]) { c.beginPath(); c.moveTo(x + d * 1.1, -.6); c.lineTo(x + d * 1.1, -2); c.stroke(); } }
    // ears
    const dumbo = lk.ear === 'dumbo', er = R * (dumbo ? .55 : .5) * (.85 + .2 * age);
    const droop = st.mood === 'sad' || st.mood === 'scared' ? 3 : 0;
    for (const s2 of [-1, 1]) {
      const ex = s2 * R * (dumbo ? .95 : .72), ey = hy - R * (dumbo ? .25 : .72) + droop;
      ell(c, ex, ey, er, er * .92, lk.pat === 'hood' ? lk.c3 : lk.c1, OUT, 1.3);
      const g = c.createRadialGradient(ex, ey, 1, ex, ey, er); g.addColorStop(0, '#f7b0b0'); g.addColorStop(1, '#fbd4d0'); ell(c, ex + s2 * .5, ey + .5, er * .68, er * .6, g);
    }
    // v9.78: the collar goes round the neck, BEHIND the pointed snout (it used to hang on the chest)
    if (st.wear && st.wear.collar) collarAt(c, st.wear.collar, 0, hy + R * .52, R * .9, R * .26, hy + R * 1.02);
    // head with pointed snout
    const hcol = lk.pat === 'hood' ? lk.c3 : lk.c1;
    c.beginPath(); c.moveTo(-R, hy - R * .15);
    c.bezierCurveTo(-R, hy - R * 1.05, R, hy - R * 1.05, R, hy - R * .15);
    c.bezierCurveTo(R, hy + R * .45, R * .38, hy + R * (.72 + .12 * age), 0, hy + R * (.8 + .15 * age));
    c.bezierCurveTo(-R * .38, hy + R * (.72 + .12 * age), -R, hy + R * .45, -R, hy - R * .15); c.closePath();
    c.fillStyle = grad(c, 0, hy, R, hcol); c.fill(); c.lineWidth = 1.6; c.strokeStyle = OUT; c.stroke();
    if (lk.pat === 'hood') { c.save(); c.clip(); c.restore(); }
    ell(c, 0, hy + R * .5, R * .34, R * .26, lk.pat === 'hood' ? shade(lk.c3, .25) : shade(lk.c1, .2));
    face(c, lk, 0, hy, R, st, { kind: 'rodent', fur: hcol });
    dirt(c, 4, by, R, st);
    if (st.wear && st.wear.collar) { const k2 = st.wear.collar.kind || 'tag'; if (k2 !== 'bandana' && k2 !== 'rainbow') ell(c, 0, hy + R * 1.02, 2.1, 2.1, k2 === 'bell' ? '#ffd23a' : k2 === 'heart' ? '#ff5a7a' : k2 === 'pearl' ? '#ffe0ef' : '#ffd23a', OUT, .8); } // the tag hangs just under the chin
    wearOn(c, st, 0, hy, R, { collar: false });
    if (st.sleep) zz(c, 14, hy - 16, t);
  }
  function hedgehog(c, lk, t, bob, st) {
    const y = -12 - bob; shadow(c, 0, 0, 14);
    const puff = st.mood === 'scared' || st.mood === 'angry' ? 1.12 : 1;
    c.beginPath();
    for (let i = 0; i <= 26; i++) { const a = Math.PI * .95 + i / 26 * Math.PI * 1.1, r = (i % 2 ? 19 : 14) * puff; const px = 2 + Math.cos(a) * r, py = y + 2 + Math.sin(a) * r * .9; i ? c.lineTo(px, py) : c.moveTo(px, py); }
    c.closePath(); c.fillStyle = grad(c, 2, y - 4, 18, lk.c1); c.fill(); c.lineWidth = 1.4; c.strokeStyle = OUT; c.stroke();
    c.lineWidth = .8; c.strokeStyle = shade(lk.c1, .45); for (let i = 0; i < 9; i++) { const a = Math.PI * 1.1 + i * .1 * Math.PI; c.beginPath(); c.moveTo(2 + Math.cos(a) * 8, y + Math.sin(a) * 7); c.lineTo(2 + Math.cos(a) * 15, y + Math.sin(a) * 13); c.stroke(); }
    ell(c, -6, y + 3, 11, 9, grad(c, -6, y + 3, 11, lk.c2), OUT, 1.5);
    for (const s of [-1, 1]) ell(c, -6 + s * 8, y - 5, 3, 2.6, '#e8b0a8', OUT, .9);
    face(c, lk, -6, y + 1, 12, st, { kind: 'rodent', fur: lk.c2 });
    wearOn(c, st, -6, y + 1, 12);
    if (st.sleep) zz(c, 10, y - 18, t);
  }
  function ferret(c, lk, t, bob, st) {
    const y = -10 - bob; shadow(c, 0, 0, 17);
    ell(c, 8, y + 1, 16, 7, grad(c, 8, y, 14, lk.c1), OUT, 1.5);
    clothOn(c, st, 8, y + 1, 16, 7);
    c.beginPath(); c.moveTo(22, y); c.quadraticCurveTo(30, y - 2, 30, y + 6); c.lineWidth = 5; c.strokeStyle = lk.c2; c.lineCap = 'round'; c.stroke();
    for (const x of [-2, 4, 14, 20]) { rrect(c, x - 2, y + 4, 4, 6, 2); c.fillStyle = lk.c2; c.fill(); }
    const hy = y - 10; for (const s of [-1, 1]) { ell(c, -4 + s * 8, hy - 8, 4, 4, lk.c1, OUT, 1.2); ell(c, -4 + s * 8, hy - 8, 2, 2, '#f0b0a8'); }
    ell(c, -4, hy, 12, 10, grad(c, -4, hy, 12, lk.c1), OUT, 1.5);
    ell(c, -4, hy - 1, 10, 3.6, lk.c2 + 'aa');
    ell(c, -4, hy + 5, 5, 3.5, '#ffffff');
    face(c, lk, -4, hy, 12, st, { kind: 'rodent' });
    wearOn(c, st, -4, hy, 12);
    if (st.sleep) zz(c, 10, hy - 14, t);
  }
  function smallEyes(c, x, y, sp, size, st, fur) {
    const mode = eyeModeOf(st);
    const eK = 1.25 - .25 * (st.age == null ? 1 : st.age);
    for (const s of [-1, 1]) eye(c, x + s * sp, y, size * .85 * eK, size * eK, '#1c110b', mode, s, { dark: true, fur });
  }
  function bird(c, lk, t, bob, st) {
    const y = -14 - bob; shadow(c, 0, 0, 10);
    const isChick = lk.t === 'bird' && lk.c1 === '#ffd92e' && !lk.duck;
    if (isChick) {
      // High-craft fluffy golden chick (matching User Image 7)
      for (const x of [-3.5, 3.5]) {
        c.beginPath(); c.moveTo(x, y + 10); c.lineTo(x, 0); c.lineWidth = 2.2; c.strokeStyle = '#f59e0b'; c.stroke();
        c.beginPath(); c.moveTo(x, 0); c.lineTo(x - 3, 0); c.moveTo(x, 0); c.lineTo(x + 3, 0); c.stroke();
      }
      // Fluffy golden-yellow body
      const gChick = c.createRadialGradient(0, y + 2, 2, 0, y + 2, 13);
      gChick.addColorStop(0, '#fef08a'); gChick.addColorStop(0.7, '#fde047'); gChick.addColorStop(1, '#eab308');
      ell(c, 0, y + 2, 12.5, 12, gChick, OUT, 1.4);
      // Downy feather tufts on sides
      fluffEdge(c, 0, y + 2, 12, 11, '#eab308', 8, .08);
      // Cute wings on both sides that flap
      const flap = st.moving || st.mood === 'happy' ? Math.sin(t * 18) * .45 : 0;
      for (const s of [-1, 1]) {
        c.save(); c.translate(s * 10, y + 2); c.rotate(s * (.2 + flap));
        ell(c, 0, 2, 3.8, 6.5, '#facc15', OUT, 1);
        c.restore();
      }
      // Soft chick head with crown fluff
      const hy = y - 7;
      ell(c, 0, hy, 10.5, 9.8, gChick, OUT, 1.4);
      // Fluffy crown feathers on head
      c.beginPath(); c.moveTo(-2, hy - 9); c.quadraticCurveTo(0, hy - 14, 2, hy - 11); c.lineTo(0, hy - 8); c.fillStyle = '#fde047'; c.fill();
      // Big gleaming anime eyes
      for (const s of [-1, 1]) {
        const ex = s * 4.2, ey = hy - 1.2;
        ell(c, ex, ey, 2.8, 3.2, '#18181b');
        ell(c, ex + .8, ey - 1.1, 1.1, 1.1, '#ffffff');
        ell(c, ex - .6, ey + .8, .6, .6, '#ffffff');
      }
      // Bright coral blush
      blush(c, 0, hy + 2.5, 7.5, 2.2);
      // Cute triangular orange beak
      c.beginPath(); c.moveTo(-2.5, hy + .8); c.lineTo(0, hy + 3.8); c.lineTo(2.5, hy + .8); c.closePath();
      c.fillStyle = '#f97316'; c.fill(); c.lineWidth = .8; c.strokeStyle = OUT; c.stroke();
      wearOn(c, st, 0, hy, 10);
      extras(c, 0, hy, 11, st, t);
      if (st.sleep) zz(c, 8, y - 16, t);
      return;
    }
    for (const x of [-3, 3]) { c.beginPath(); c.moveTo(x, y + 10); c.lineTo(x, 0); c.lineWidth = 1.6; c.strokeStyle = lk.duck ? '#f2963a' : '#d98d55'; c.stroke(); if (lk.duck) ell(c, x, -.5, 3.4, 1.6, '#f2963a'); }
    c.beginPath(); c.moveTo(-4, y + 8); c.lineTo(-10, y + 18); c.lineTo(-2, y + 12); c.fillStyle = lk.tailc || shade(lk.c1, -.15); c.fill();
    ell(c, 0, y, 11, 13, grad(c, 0, y, 12, lk.c1), OUT, 1.5);
    ell(c, 0, y + 4, 7, 7, lk.c2);
    // feather scallops
    c.lineWidth = .7; c.strokeStyle = shade(lk.c1, -.2); for (const [fx, fy] of [[-5, 2], [0, 5], [5, 2], [-3, 8], [3, 8]]) { c.beginPath(); c.arc(fx, y + fy, 2.2, .2, Math.PI - .2); c.stroke(); }
    const flap = st.moving || st.mood === 'happy' ? Math.sin(t * 20) * .5 : st.mood === 'scared' ? Math.sin(t * 30) * .2 : 0;
    for (const s of [-1, 1]) { c.save(); c.translate(s * 9, y + 1); c.rotate(s * (.3 + flap)); ell(c, 0, 3, 4, 8, shade(lk.c1, -.1), OUT, 1.1); c.lineWidth = .6; c.strokeStyle = shade(lk.c1, -.3); for (const k of [2, 5, 8]) { c.beginPath(); c.moveTo(-3, k); c.lineTo(3, k + 1); c.stroke(); } c.restore(); }
    if (lk.crest) { c.beginPath(); c.moveTo(-2, y - 11); c.quadraticCurveTo(2, y - 24, 8, y - 22); c.quadraticCurveTo(3, y - 17, 3, y - 11); c.fillStyle = lk.c2; c.fill(); c.lineWidth = 1.1; c.strokeStyle = OUT; c.stroke(); }
    if (lk.duck) { c.beginPath(); c.moveTo(-1, y - 12); c.quadraticCurveTo(0, y - 17, 3, y - 16); c.lineWidth = 1.4; c.strokeStyle = shade(lk.c1, -.1); c.stroke(); }
    ell(c, 0, y - 7, 9, 8, lk.c2);
    if (lk.c3 === '#ff8c5a') for (const s of [-1, 1]) ell(c, s * 6, y - 4, 2.6, 2.6, lk.c3);
    if (lk.c3 === '#3a3a3a') for (const s of [-1, 1]) for (const k of [0, 1]) ell(c, s * (2 + k * 3), y - 1.5, .9, .9, lk.c3);
    if (lk.eye) { for (const s of [-1, 1]) ell(c, s * 4.5, y - 8, 3.6, 3.6, lk.eye, OUT, .6); }
    smallEyes(c, 0, y - 8, 4.5, 2.3, st, lk.c2);
    if (lk.duck) { c.beginPath(); c.ellipse(0, y - 3, 4.5, 2.2, 0, 0, TAU); c.fillStyle = '#f7a23a'; c.fill(); c.lineWidth = .8; c.strokeStyle = OUT; c.stroke(); c.beginPath(); c.moveTo(-3.5, y - 3); c.lineTo(3.5, y - 3); c.stroke(); }
    else { const open = st.mood === 'happy' || st.mood === 'hungry' || st.mood === 'angry'; c.beginPath(); c.moveTo(-2.5, y - 4.5); c.quadraticCurveTo(0, y - 6, 2.5, y - 4.5); c.lineTo(0, y - (open ? 2 : 1)); c.closePath(); c.fillStyle = lk.eye ? '#2a2a2a' : '#f2a33a'; c.fill(); c.lineWidth = .8; c.strokeStyle = OUT; c.stroke(); if (open) { c.beginPath(); c.moveTo(-1.8, y - 1.5); c.lineTo(1.8, y - 1.5); c.lineTo(0, y + .5); c.closePath(); c.fillStyle = lk.eye ? '#2a2a2a' : '#e08a2a'; c.fill(); c.stroke(); } }
    blush(c, 0, y - 4, 6.5, 2);
    wearOn(c, st, 0, y - 7, 9);
    extras(c, 0, y - 8, 11, st, t);
    if (st.sleep) zz(c, 8, y - 16, t);
  }
  function fish(c, lk, t, st) {
    const sw = Math.sin(t * 4) * 2, y = -8 + Math.sin(t * 2) * 2;
    c.save(); c.translate(sw, y);
    if (lk.t === 'axolotl') {
      ell(c, 6, 2, 11, 5, lk.c1, OUT, 1.2);
      c.beginPath(); c.moveTo(14, 2); c.quadraticCurveTo(24, -2 + Math.sin(t * 6) * 3, 22, 6); c.fillStyle = lk.c1; c.fill(); c.stroke();
      ell(c, -5, 0, 9, 7.5, grad(c, -5, 0, 9, lk.c1), OUT, 1.4);
      for (const s of [-1, 1]) for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(-5 + s * 7, -2 + k * 2); c.lineTo(-5 + s * 13, -6 + k * 3 + Math.sin(t * 5 + k) * .6); c.lineWidth = 2.2; c.strokeStyle = lk.c2; c.lineCap = 'round'; c.stroke(); }
      smallEyes(c, -5, 0, 4, 1.8, st, lk.c1);
      if (st.mood === 'happy' || st.mood === 'love') { c.beginPath(); c.arc(-5, 2.5, 2.4, .1, Math.PI - .1); c.fillStyle = '#c2455a'; c.fill(); }
      else { c.beginPath(); c.arc(-5, st.mood === 'sad' || st.mood === 'dirty' ? 5 : 3, 2, st.mood === 'sad' || st.mood === 'dirty' ? Math.PI + .3 : .2, st.mood === 'sad' || st.mood === 'dirty' ? -.3 : Math.PI - .2); c.lineWidth = 1; c.strokeStyle = '#3a2418'; c.stroke(); }
      blush(c, -5, 2, 5, 1.6);
      wearOn(c, st, -5, 0, 8);
    } else {
      const tl = lk.fins === 2 ? 11 : lk.fins ? 12 : 8;
      c.beginPath(); c.moveTo(8, 0); c.quadraticCurveTo(8 + tl, -tl + Math.sin(t * 8) * 2, 8 + tl * 1.2, -2); c.quadraticCurveTo(8 + tl, tl + Math.sin(t * 8) * 2, 8, 0); c.fillStyle = lk.c2; c.fill(); c.lineWidth = 1.1; c.strokeStyle = OUT; c.stroke();
      c.lineWidth = .6; c.strokeStyle = shade(lk.c2, -.25); for (const k of [-.5, 0, .5]) { c.beginPath(); c.moveTo(9, 0); c.lineTo(8 + tl * 1.05, k * tl); c.stroke(); }
      if (lk.fins === 1) { c.beginPath(); c.moveTo(-2, -6); c.quadraticCurveTo(4, -16, 10, -5); c.fillStyle = lk.c2; c.fill(); c.stroke(); }
      ell(c, 0, 0, 10, 7.5, grad(c, 0, 0, 10, lk.c1), OUT, 1.3);
      c.save(); c.beginPath(); c.ellipse(0, 0, 10, 7.5, 0, 0, TAU); c.clip();
      if (lk.stripes) for (const x of [-4, 2, 7]) { rrect(c, x - 1.4, -8, 2.8, 16, 1.2); c.fillStyle = '#ffffff'; c.fill(); c.lineWidth = .8; c.strokeStyle = '#2a2a2a'; c.stroke(); }
      if (lk.neon) { rrect(c, -8, -1.5, 16, 3, 1.5); c.fillStyle = '#58d6ff'; c.fill(); ell(c, 3, 3.5, 6, 2.2, lk.c2); }
      c.lineWidth = .5; c.strokeStyle = 'rgba(255,255,255,.35)'; for (let i = 0; i < 5; i++) { c.beginPath(); c.arc(-2 + i * 2.6, 0, 2.2, -1, 1); c.stroke(); }
      c.restore();
      smallEyes(c, -4, -1, 0, 2.3, st, lk.c1);
      const m = st.mood; c.beginPath();
      if (m === 'happy' || m === 'love') { c.arc(-8, 1.2, 1.6, -.3, 1.8); c.lineWidth = 1.2; }
      else if (m === 'hungry' || m === 'scared') { ell(c, -8.2, 2, 1.1, 1.3, '#6a2a2a'); c.beginPath(); }
      else { c.arc(-8, 1.5, 1.4, -.5, 1.5); c.lineWidth = 1; }
      c.strokeStyle = '#3a2418'; c.stroke();
      if (m === 'hungry') for (const k of [0, 1]) { const b = (t * .6 + k * .5) % 1; ell(c, -12 - b * 3, -3 - b * 12, 1.2 + b, 1.2 + b, null, 'rgba(160,220,255,.9)', .8); }
      wearOn(c, st, -3, -1, 7);
    }
    c.restore();
  }
  function turtle(c, lk, t, bob, st) {
    shadow(c, 0, 0, 15); const y = -9 - bob * .3;
    for (const [x, yy] of [[-9, 3], [9, 3], [-7, -4], [7, -4]]) ell(c, x, y + yy + 3, 4, 3, lk.c1, OUT, 1);
    const hide = st.mood === 'scared';
    const hx = (hide ? -9 : -14) + (st.moving ? Math.sin(t * 8) : 0);
    ell(c, hx, y - 1, 7, 6, grad(c, hx, y - 1, 7, lk.c1), OUT, 1.4);
    c.lineWidth = .8; c.strokeStyle = '#f4e04d'; c.beginPath(); c.moveTo(hx - 4, y + 2); c.lineTo(hx + 3, y + 3); c.stroke();
    ell(c, hx + 3, y + 1, 2.5, 1.2, lk.c3);
    smallEyes(c, hx - 1, y - 2, 2.5, 1.6, st, lk.c1);
    if (st.mood === 'happy' || st.mood === 'love') { c.beginPath(); c.arc(hx - 1, y + 1.5, 1.8, .2, Math.PI - .2); c.lineWidth = 1; c.strokeStyle = '#3a2418'; c.stroke(); }
    c.beginPath(); c.ellipse(2, y - 2, 14, 10, 0, Math.PI, TAU); c.lineTo(16, y); c.quadraticCurveTo(2, y + 4, -12, y); c.closePath();
    c.fillStyle = grad(c, 2, y - 6, 14, lk.c2); c.fill(); c.lineWidth = 1.5; c.strokeStyle = OUT; c.stroke();
    for (const [x, yy] of [[-4, -6], [4, -6], [0, -2], [8, -2], [-8, -2]]) { ell(c, x + 2, y + yy, 3.2, 2.2, shade(lk.c2, .2)); c.lineWidth = .6; c.strokeStyle = shade(lk.c2, -.3); c.stroke(); }
    wearOn(c, st, hx, y - 1, 7);
    extras(c, hx, y - 3, 8, st, t);
  }
  function gecko(c, lk, t, bob, st) {
    shadow(c, 0, 0, 16); const y = -6 - bob * .3;
    c.beginPath(); c.moveTo(8, y); c.quadraticCurveTo(22, y - 2, 24, y + 4 + Math.sin(t * 3) * 2); c.lineWidth = 6.5; c.strokeStyle = OUT; c.lineCap = 'round'; c.stroke(); c.lineWidth = 5; c.strokeStyle = lk.c1; c.stroke();
    for (const [x, s] of [[-6, -1], [-6, 1], [6, -1], [6, 1]]) { c.beginPath(); c.moveTo(x, y); c.lineTo(x + s * 2, y + 5); c.lineWidth = 3; c.strokeStyle = lk.c1; c.stroke(); for (const d of [-1.5, 0, 1.5]) ell(c, x + s * 2 + d, y + 5.5, .9, .9, shade(lk.c1, .2)); }
    ell(c, 2, y - 2, 11, 6, grad(c, 2, y - 2, 11, lk.c1), OUT, 1.4);
    for (const [x, yy] of [[-2, -3], [4, -4], [9, -2], [1, 0], [6, 0]]) ell(c, x, y + yy, 1.5, 1.2, lk.c2);
    ell(c, -11, y - 6, 8, 6.5, grad(c, -11, y - 6, 8, lk.c1), OUT, 1.4);
    for (const s of [-1, 1]) eye(c, -11 + s * 3.5, y - 7.5, 2.1, 2.3, '#c9a24a', eyeModeOf(st), s, { slit: true, fur: lk.c1 });
    const m = st.mood;
    c.beginPath(); if (m === 'sad' || m === 'dirty') c.arc(-11, y, 3, Math.PI + .3, -.3); else c.arc(-11, y - 3, 3.4, .15, Math.PI - .15); c.lineWidth = 1; c.strokeStyle = '#3a2418'; c.stroke();
    blush(c, -11, y - 4, 4.5, 1.5);
    wearOn(c, st, -11, y - 6, 7);
    extras(c, -11, y - 7, 8, st, t);
  }
  // v9.78: a real snake -- coiled on the ground, neck raised, tapering tail, a wide head with a split tongue
  // (the old one was a same-thickness wavy line that read as a worm). Drawn as a tube of overlapping discs.
  function snake(c, lk, t, bob, st) {
    const age = st.age == null ? 1 : st.age, k0 = .8 + .2 * age;
    shadow(c, 0, 0, 19 * k0);
    const y0 = -5.5 * k0, RX = 13 * k0, RY = 4.6 * k0, sway = Math.sin(t * (st.moving ? 5 : 1.6)) * (st.moving ? 3 : 1.4);
    const body = 5.4 * k0, dark = shade(lk.c1, -.18), belly = lk.c2;
    const ring = (a0, a1, n) => { const out = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; out.push([Math.cos(a) * RX, y0 + Math.sin(a) * RY, body]); } return out; };
    // tail: from the front of the coil out to the right, thinning to a point
    const tail = []; for (let i = 0; i <= 8; i++) { const k = i / 8; tail.push([RX * .98 + k * 9 * k0, y0 + RY * .3 + k * 2.5 + Math.sin(t * 2 + k * 3) * .6 * k, body * (1 - k * .82)]); }
    // neck: rises from the back of the coil to the head, a gentle S
    const hx = -2 + sway, hyy = y0 - 21 * k0 - bob, neck = [];
    for (let i = 0; i <= 12; i++) { const k = i / 12; neck.push([Math.sin(k * Math.PI) * -4 * k0 + (hx) * k, y0 - RY + (hyy + 4 - (y0 - RY)) * k, body * (1 - .22 * k)]); }
    const tube = (pts, fill) => {
      for (const [x, y, r] of pts) ell(c, x, y, r + 1.3, r + 1.3, OUT);
      for (const [x, y, r] of pts) ell(c, x, y, r, r, fill);
      for (let i = 0; i < pts.length; i += 2) { const [x, y, r] = pts[i]; ell(c, x, y + r * .45, r * .62, r * .32, belly); }            // lighter belly scales
      for (let i = 1; i < pts.length; i += 3) { const [x, y, r] = pts[i]; if (r > 2.2) ell(c, x, y - r * .35, r * .5, r * .32, lk.c3 || dark); } // saddle pattern
      for (const [x, y, r] of pts) ell(c, x - r * .25, y - r * .55, r * .35, r * .16, 'rgba(255,255,255,.28)');                       // glossy scales
    };
    const g = grad(c, 0, y0, RX, lk.c1);
    tube(ring(Math.PI, TAU, 16), g);            // back half of the coil
    tube(neck, g);                               // the raised neck
    tube(ring(0, Math.PI, 16), g);              // front half of the coil (over the neck's base)
    tube(tail, g);
    // head: wide and flat, clearly wider than the neck
    const HR = 7.2 * k0;
    ell(c, hx, hyy, HR * 1.18, HR * .92, OUT);
    ell(c, hx, hyy, HR * 1.08, HR * .82, grad(c, hx, hyy, HR, lk.c1));
    ell(c, hx, hyy + HR * .35, HR * .75, HR * .35, belly);
    if (lk.c3) { ell(c, hx, hyy - HR * .45, HR * .5, HR * .22, lk.c3); }
    ell(c, hx - HR * .3, hyy - HR * .45, HR * .35, HR * .15, 'rgba(255,255,255,.35)');
    for (const s2 of [-1, 1]) eye(c, hx + s2 * HR * .52, hyy - HR * .05, 1.7 * k0, 1.9 * k0, '#1c110b', eyeModeOf(st), s2, { dark: true });
    for (const s2 of [-1, 1]) ell(c, hx + s2 * 1.2, hyy + HR * .42, .5, .4, 'rgba(40,20,10,.7)'); // nostrils
    if (Math.sin(t * 3.2) > .45 && !st.sleep) { // flicking split tongue
      c.beginPath(); c.moveTo(hx, hyy + HR * .75); c.lineTo(hx, hyy + HR * .75 + 4); c.lineTo(hx - 1.6, hyy + HR * .75 + 6); c.moveTo(hx, hyy + HR * .75 + 4); c.lineTo(hx + 1.6, hyy + HR * .75 + 6);
      c.lineWidth = 1; c.lineCap = 'round'; c.strokeStyle = '#e0413a'; c.stroke();
    }
    if (st.mood === 'happy' || st.mood === 'love') blush(c, hx, hyy + HR * .15, HR * .8, 1.6);
    dirt(c, 0, y0, RX * .6, st);
    wearOn(c, st, hx, hyy, HR, { collar: false });
    if (st.wear && st.wear.collar) collarAt(c, st.wear.collar, neck[10][0], neck[10][1], neck[10][2] + 1, 2.2, neck[10][1] + 3);
    extras(c, hx, hyy - 4, 6, st, t);
    if (st.sleep) zz(c, hx + 10, hyy - 10, t);
  }
  // mood from pet stats (for world/UI)
  function moodOf(p, extra) {
    if (!p) return 'calm';
    if (p.stress > 72) return p.trait === 'shy' || p.trait === 'calm' ? 'scared' : 'angry';
    if (p.hunger < 25) return 'hungry';
    if (p.clean < 25) return 'dirty';
    if (p.bored > 75) return 'sad';
    if (p.stress > 55) return 'scared';
    if (p.hunger < 40) return 'hungry';
    if (p.bored > 60) return 'sleepy';
    if (p.happy > 82) return (extra || 0) % 3 === 0 ? 'love' : 'calm';
    return (extra || 0) % 5 === 1 ? 'curious' : 'calm';
  }
  // does this species roam the floor?
  const roams = sp => { const tt = look(sp).t; return tt === 'rat' || tt === 'dog' || tt === 'cat' || tt === 'rabbit' || tt === 'ferret' || tt === 'hedgehog' || tt === 'guinea' || tt === 'rodent' || tt === 'sitshiba'; };
  const habitatKind = sp => { const tt = look(sp).t; return { dog: 'dogbed', cat: 'catbed', rabbit: 'hutch', rodent: 'cage', rat: 'cage', guinea: 'hutch', hedgehog: 'hutch', ferret: 'hutch', bird: 'birdcage', fish: 'tank', axolotl: 'tank', turtle: 'terrarium', gecko: 'terrarium', snake: 'terrarium' }[tt] || 'dogbed'; };

  const MOOD_EMOJI = { calm: '😊', happy: '😊', love: '🥰', angry: '😠', hungry: '🍖', dirty: '💩', sad: '😢', scared: '😨', sleepy: '😴', curious: '🤔' };
  const moodEmoji = m => MOOD_EMOJI[m] || '😊';

  // ================= HIGH-CRAFT CHIBI ZOO ANIMALS (matching ART.pet profile style) =================
  function zooLegs(c, col, lg, w, h, xs, hoofCol) {
    for (const [x, ph, front] of xs) {
      const ly = -h - 2 + ph * lg * .55;
      rrect(c, x - w / 2, ly, w, h + 2 - ph * lg * .55, w * .45);
      const g = c.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
      g.addColorStop(0, shade(col, .1)); g.addColorStop(1, shade(col, -.16));
      c.fillStyle = g; c.fill(); c.lineWidth = 1.3; c.strokeStyle = OUT; c.stroke();
      if (hoofCol) {
        rrect(c, x - w / 2, -2.8, w, 2.8, 1.2);
        c.fillStyle = hoofCol; c.fill(); c.lineWidth = 1.1; c.strokeStyle = OUT; c.stroke();
      } else if (front) {
        c.lineWidth = .75; c.strokeStyle = 'rgba(60,38,25,.55)';
        for (const d of [-w * .18, w * .18]) { c.beginPath(); c.moveTo(x + d, -.2); c.lineTo(x + d, -2); c.stroke(); }
      }
    }
  }

  function zooEarsRound(c, hy, R, col, innerCol, er, spreadY) {
    const r0 = er || 5.8, sy = spreadY == null ? .68 : spreadY;
    for (const s of [-1, 1]) {
      const ex = s * R * .74, ey = hy - R * sy;
      ell(c, ex, ey, r0, r0 * .95, grad(c, ex, ey, r0, col), OUT, 1.5);
      if (innerCol) {
        const g = c.createLinearGradient(ex, ey - r0 * .5, ex, ey + r0 * .5);
        g.addColorStop(0, shade(innerCol, -.1)); g.addColorStop(1, shade(innerCol, .18));
        ell(c, ex, ey + .4, r0 * .55, r0 * .52, g);
      }
    }
  }

  function zooPet(c, sp, st0) {
    const st = Object.assign({ mood: 'calm', t: 0, moving: false, dir: 1, act: 'idle' }, st0 || {});
    const t = st.t || 0, seed = st.seed || 1;
    const isSleeping = st.act === 'sleep' || st.mood === 'sleep';
    const breath = isSleeping ? Math.sin(t * 2.2 + seed) * 1.5 : 0;
    st.blink = !st.sleep && !isSleeping && ((t + (seed % 97) * .37) % 3.4) < .14;
    const mode = isSleeping ? 'sleep' : (eyeModeOf(st) === 'happy' && Math.sin(t * 1.5 + seed) > .35 ? 'open' : eyeModeOf(st));
    const bob = isSleeping ? breath * .6 : (st.moving ? Math.abs(Math.sin(t * 10)) * 2.2 : Math.sin(t * 2.5 + seed) * .7);
    const lg = isSleeping ? 0 : (st.moving ? Math.sin(t * 10) * 2.4 : 0);
    const wag = isSleeping ? Math.sin(t * 1.4) * .15 : Math.sin(t * 8 + seed) * .35;
    c.save();
    c.scale(st.dir || 1, 1);
    if (isSleeping) {
      // User Request 6: 엎드려 편안하게 잠자는 사랑스러운 모습 (Lying-down sleeping pose)
      c.translate(0, 7.2);
      c.scale(1.16, 0.74 + breath * 0.04);
    } else if (st.moving) {
      // User Request 6: 옆모습으로 활기차게 걷는 보폭과 자연스러운 시선
      c.translate(1.8, 0);
    }

    if (sp === 'lion' || sp === 'lioness') {
      // User Request 10: Regal, majestic lion matching User Image 5
      const c1 = sp === 'lion' ? '#e2962b' : '#df9d3f', c2 = '#fff6de';
      const maneDark = '#451a03', maneMid = '#78350f', maneGold = '#b45309', maneLight = '#d97706';
      const R = 18, hy = -31 - bob, by = -13 - bob * .6, bw = 17, bh = 12;
      shadow(c, 0, 0, 20);

      // 1. Long swaying feline tail with large fluffy lion tuft
      c.save(); c.translate(11, -9 - bob * .5); c.rotate(-.75 + wag);
      c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(12, -7, 10, -21);
      c.lineWidth = 4.8; c.lineCap = 'round'; c.strokeStyle = OUT; c.stroke();
      c.lineWidth = 3.2; c.strokeStyle = c1; c.stroke();
      // Fluffy dark mane tuft at tip of tail
      fluffEdge(c, 10, -22, 5.2, 4.8, maneMid, 12, .18);
      fluffEdge(c, 10, -22, 3.6, 3.4, maneDark, 8, .12);
      c.restore();

      // 2. Powerful muscular paws with defined claws/toes
      zooLegs(c, c1, lg, 6.4, 9, [[-9, 1, 0], [-3.5, -1, 1], [3.8, 1, 1], [9.2, -1, 0]]);
      for (const lx of [-9, -3.5, 3.8, 9.2]) {
        // Toe claw marks on paw tips
        for (let t = -1; t <= 1; t++) {
          ART.ell(c, lx + t * 1.8, 0, 1.1, 0.8, '#451a03');
        }
      }

      // 3. Sturdy lion torso + warm shaded flanks
      ell(c, 0, by, bw, bh, grad(c, 0, by, bw, c1), OUT, 1.5);
      ell(c, -1.8, by + 2.8, bw * .62, bh * .65, c2);
      furStrokes(c, 0, by, bw, bh, c1, 8);

      // 4. Glorious multi-layered lion's mane (User Image 5)
      if (sp === 'lion') {
        // Outermost deep dark chocolate ruff (silhouette & shoulders)
        fluffEdge(c, 0, hy + 2.5, R * 1.58, R * 1.52, maneDark, 26, .16);
        // Rich warm amber-chestnut mid-layer
        fluffEdge(c, 0, hy + 2, R * 1.42, R * 1.38, maneMid, 22, .14);
        // Golden-ochre layered tresses flowing down the chest
        fluffEdge(c, 0, hy + 2.5, R * 1.25, R * 1.22, maneGold, 18, .12);
        // Bright golden highlights on crown & cheek mane
        for (let m = -3; m <= 3; m++) {
          const ma = m * 0.35;
          const mx = Math.sin(ma) * R * 1.28, my = hy + Math.cos(ma) * R * 1.15;
          c.beginPath(); c.moveTo(mx * 0.7, hy + 2); c.quadraticCurveTo(mx, my - 4, mx * 1.1, my + 6);
          c.lineWidth = 2.4; c.lineCap = 'round'; c.strokeStyle = maneLight; c.stroke();
        }
      } else {
        // Sleek lioness neck ruff
        fluffEdge(c, 0, hy + R * .78, 10, 6, c2, 12, .12);
      }

      // 5. Rounded feline ears (nestled into mane)
      zooEarsRound(c, hy, R, c1, '#fca5a5', 5.8, .72);
      if (sp === 'lion') {
        // Back of ears dark patch
        for (const s of [-1, 1]) {
          ART.ell(c, s * R * .75, hy - R * .72, 3.2, 3.2, maneDark);
        }
      }

      // 6. Regal feline head
      ell(c, 0, hy, R, R * .94, grad(c, 0, hy, R, c1), OUT, 1.6);

      // 7. Cream muzzle, whisker pads & dark tear stripes
      ell(c, 0, hy + R * .36, R * .56, R * .4, grad(c, 0, hy + R * .36, R * .52, c2));
      for (const s of [-1, 1]) ell(c, s * R * .2, hy + R * .4, R * .24, R * .19, '#ffffff', OUT, .9);
      // Whisker dots on muzzle
      for (const s of [-1, 1]) {
        for (let r = 0; r < 2; r++) {
          for (let d = 0; d < 3; d++) {
            ART.ell(c, s * (R * .14 + d * 1.8), hy + R * .36 + r * 2.2, 0.7, 0.7, '#451a03');
          }
        }
      }

      // 8. Intense golden-amber predatory eyes with black eye-liner & tear marks (User Image 5)
      for (const s of [-1, 1]) {
        // Black tear line from eye to nose
        c.beginPath(); c.moveTo(s * R * .34, hy - 2); c.lineTo(s * R * .18, hy + R * .24);
        c.lineWidth = 1.2; c.strokeStyle = '#291408'; c.stroke();
        // Golden iris eye
        eye(c, s * R * .4, hy + .2, R * .19, R * .21, '#d97706', mode, s, { fur: c1 });
      }

      // 9. Broad dark lion nose and proud jaw
      const ny = hy + R * .25;
      c.beginPath();
      c.moveTo(-3.8, ny - 1.4);
      c.quadraticCurveTo(0, ny - 2.8, 3.8, ny - 1.4);
      c.quadraticCurveTo(1.6, ny + 3.2, 0, ny + 3.4);
      c.quadraticCurveTo(-1.6, ny + 3.2, -3.8, ny - 1.4);
      c.closePath();
      c.fillStyle = '#3f1a08'; c.fill(); c.lineWidth = 1; c.strokeStyle = OUT; c.stroke();
      // Nostrils & highlight
      ell(c, -1.2, ny - 0.6, 1.2, 0.8, 'rgba(255,255,255,.55)');
      c.beginPath(); c.moveTo(0, ny + 3.4); c.lineTo(0, ny + 5.2);
      c.moveTo(-4.2, ny + 4.8); c.quadraticCurveTo(-2, ny + 7.2, 0, ny + 5.2);
      c.quadraticCurveTo(2, ny + 7.2, 4.2, ny + 4.8);
      c.lineWidth = 1.5; c.strokeStyle = '#2b1307'; c.stroke();
    } else if (sp === 'tiger' || sp === 'whitetiger') {
      const WT = sp === 'whitetiger';
      const c1 = WT ? '#f4f6fa' : '#f58d2e', c2 = '#ffffff', stCol = WT ? '#2d3748' : '#1e1814', eyeCol = WT ? '#4ea8de' : '#52b788';
      const R = 17.5, hy = -30 - bob, by = -13 - bob * .6, bw = 15.5, bh = 11;
      shadow(c, 0, 0, 17);
      // Striped tail
      c.save(); c.translate(10, -10 - bob * .5); c.rotate(-.8 + wag);
      c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(11, -7, 8, -18);
      c.lineWidth = 5.2; c.lineCap = 'round'; c.strokeStyle = OUT; c.stroke();
      c.lineWidth = 3.6; c.strokeStyle = c1; c.stroke();
      c.lineWidth = 1.6; c.strokeStyle = stCol;
      for (const k of [.3, .55, .8]) { c.beginPath(); c.arc(8 * k + 1, -18 * k, 2.2, 0, Math.PI); c.stroke(); }
      c.restore();
      // Legs
      zooLegs(c, c1, lg, 5.8, 8, [[-8, 1, 0], [-3, -1, 1], [3.2, 1, 1], [8.2, -1, 0]]);
      // Body + clipped tiger stripes
      ell(c, 0, by, bw, bh, grad(c, 0, by, bw, c1), OUT, 1.5);
      c.save(); c.beginPath(); c.ellipse(0, by, bw, bh, 0, 0, TAU); c.clip();
      c.lineWidth = 2.4; c.lineCap = 'round'; c.strokeStyle = stCol;
      for (const sx of [-9, -4.5, 0, 4.5, 9]) { c.beginPath(); c.moveTo(sx, by - 11); c.quadraticCurveTo(sx + 2, by - 4, sx - .5, by + 1); c.stroke(); }
      c.restore();
      ell(c, -1.5, by + 2.5, bw * .58, bh * .62, c2);
      // Ears & fluffy cheek ruffs
      zooEarsRound(c, hy, R, c1, '#f4a7a0', 5.6, .68);
      fluffEdge(c, 0, hy + 2, R * 1.12, R * .88, c2, 14, .09);
      ell(c, 0, hy, R, R * .92, grad(c, 0, hy, R, c1), OUT, 1.6);
      // Clipped head stripes + '王' forehead mark + white cheek ruffs
      c.save(); c.beginPath(); c.ellipse(0, hy, R, R * .92, 0, 0, TAU); c.clip();
      for (const s of [-1, 1]) ell(c, s * R * .75, hy + R * .25, R * .45, R * .4, c2);
      c.lineWidth = 2; c.lineCap = 'round'; c.strokeStyle = stCol;
      // Forehead king mark
      c.beginPath();
      c.moveTo(-4.5, hy - R * .68); c.lineTo(4.5, hy - R * .68);
      c.moveTo(-3.5, hy - R * .52); c.lineTo(3.5, hy - R * .52);
      c.moveTo(-2.5, hy - R * .36); c.lineTo(2.5, hy - R * .36);
      c.moveTo(0, hy - R * .72); c.lineTo(0, hy - R * .32);
      c.stroke();
      for (const s of [-1, 1]) {
        c.beginPath();
        c.moveTo(s * R, hy + .5); c.lineTo(s * R * .65, hy + 1.5);
        c.moveTo(s * R, hy + 4); c.lineTo(s * R * .68, hy + 4.5);
        c.stroke();
      }
      c.restore();
      // Plump muzzle, eyes, blush & pink nose
      for (const s of [-1, 1]) ell(c, s * R * .17, hy + R * .38, R * .21, R * .16, c2);
      for (const s of [-1, 1]) eye(c, s * R * .4, hy + .5, R * .18, R * .2, eyeCol, mode, s, { fur: c1 });
      blush(c, 0, hy + R * .26, R * .58, R * .16);
      ell(c, 0, hy + R * .24, 3, 2.1, '#f08a9a', OUT, .9);
      c.beginPath(); c.moveTo(0, hy + R * .35); c.lineTo(0, hy + R * .44);
      c.moveTo(-3.4, hy + R * .42); c.quadraticCurveTo(-1.7, hy + R * .54, 0, hy + R * .44); c.quadraticCurveTo(1.7, hy + R * .54, 3.4, hy + R * .42);
      c.lineWidth = 1.3; c.strokeStyle = '#3a2418'; c.stroke();
    } else if (sp === 'bear') {
      const c1 = '#7c4a21', c2 = '#d9ae7e', R = 18, hy = -30 - bob, by = -14 - bob * .6, bw = 17, bh = 12.5;
      shadow(c, 0, 0, 18);
      ell(c, 12, -10 - bob * .5, 4.2, 4, c1, OUT, 1.3); // round bear tail
      zooLegs(c, c1, lg, 6.4, 7.5, [[-8, 1, 0], [-3, -1, 1], [3.2, 1, 1], [8.2, -1, 0]]);
      fluffEdge(c, 0, by, bw, bh, c1, 16, .07);
      potBelly(c, -1, by + 2.5, bw * .58, bh * .62, c2);
      zooEarsRound(c, hy, R, c1, '#d99b72', 6, .68);
      fluffEdge(c, 0, hy, R + .5, R * .94, c1, 18, .06);
      ell(c, 0, hy + R * .34, R * .44, R * .33, grad(c, 0, hy + R * .34, R * .44, '#e8c396'), OUT, 1.1);
      for (const s of [-1, 1]) eye(c, s * R * .38, hy, R * .17, R * .19, '#4a2c18', mode, s, { fur: c1 });
      blush(c, 0, hy + R * .24, R * .58, R * .16);
      ell(c, 0, hy + R * .21, 3.6, 2.5, '#2b180a', OUT, .9);
      ell(c, -1.1, hy + R * .18, 1.2, .8, 'rgba(255,255,255,.6)');
      c.beginPath(); c.moveTo(0, hy + R * .34); c.lineTo(0, hy + R * .46);
      c.moveTo(-3.2, hy + R * .45); c.quadraticCurveTo(0, hy + R * .58, 3.2, hy + R * .45);
      c.lineWidth = 1.4; c.strokeStyle = '#2b180a'; c.stroke();
    } else if (sp === 'panda') {
      const c1 = '#ffffff', c2 = '#1e242b', R = 18.5, hy = -30 - bob, by = -14 - bob * .6, bw = 17, bh = 12.5;
      shadow(c, 0, 0, 18);
      ell(c, 12, -9 - bob * .5, 4, 3.8, c2, OUT, 1.2);
      zooLegs(c, c2, lg, 6.4, 7.5, [[-8, 1, 0], [-3, -1, 1], [3.2, 1, 1], [8.2, -1, 0]]);
      // Chubby white body + black shoulder saddle band
      ell(c, 0, by, bw, bh, grad(c, 0, by, bw, c1), OUT, 1.6);
      c.save(); c.beginPath(); c.ellipse(0, by, bw, bh, 0, 0, TAU); c.clip();
      ell(c, -2, by - 5, bw * .65, bh * .55, c2);
      c.restore();
      potBelly(c, -1, by + 3.5, bw * .56, bh * .55, '#f8fafc');
      // Round black panda ears & big white chibi head
      zooEarsRound(c, hy, R, c2, '#3a424d', 6.2, .68);
      ell(c, 0, hy, R, R * .92, grad(c, 0, hy, R, c1), OUT, 1.6);
      // Iconic tilted black eye patches + glossy sparkling eyes
      for (const s of [-1, 1]) {
        c.save(); c.translate(s * R * .39, hy + 1); c.rotate(s * -.32);
        ell(c, 0, 0, R * .27, R * .22, c2);
        c.restore();
        eye(c, s * R * .38, hy + .5, R * .16, R * .18, '#3b2818', mode, s, { fur: c2 });
      }
      blush(c, 0, hy + R * .28, R * .58, R * .18);
      ell(c, 0, hy + R * .28, R * .34, R * .24, grad(c, 0, hy + R * .28, R * .34, '#ffffff'));
      ell(c, 0, hy + R * .22, 3.1, 2.1, c2);
      ell(c, -1, hy + R * .19, 1, .6, 'rgba(255,255,255,.65)');
      c.beginPath(); c.moveTo(-3.2, hy + R * .4); c.quadraticCurveTo(0, hy + R * .55, 3.2, hy + R * .4);
      c.lineWidth = 1.4; c.strokeStyle = c2; c.stroke();
      // Fresh green bamboo stalk held in front paw
      c.save(); c.translate(-7, -14 - bob * .7 + Math.sin(t * 4 + seed) * 1.2); c.rotate(-.35);
      c.strokeStyle = '#2f855a'; c.lineWidth = 3.2; c.lineCap = 'round';
      c.beginPath(); c.moveTo(0, 6); c.lineTo(0, -11); c.stroke();
      ell(c, -3.5, -7, 4.2, 1.8, '#48bb78', OUT, .7);
      ell(c, 3.5, -10, 4.2, 1.8, '#68d391', OUT, .7);
      c.restore();
    } else if (sp === 'redpanda') {
      const c1 = '#d95b2b', c2 = '#4a2518', cr = '#fff3e0', R = 16.5, hy = -28 - bob, by = -12 - bob * .6, bw = 14.5, bh = 10.5;
      shadow(c, 0, 0, 16);
      // Big fluffy striped tail
      c.save(); c.translate(9, -10 - bob * .5); c.rotate(-.5 + wag);
      for (let i = 5; i >= 0; i--) {
        ell(c, 3 + i * 2.6, -2 - i * 2, 5.2 - i * .3, 4.4 - i * .2, i % 2 ? c2 : c1, OUT, 1.1);
      }
      c.restore();
      zooLegs(c, c2, lg, 5.2, 6.5, [[-7, 1, 0], [-2.5, -1, 1], [3, 1, 1], [7.5, -1, 0]]);
      fluffEdge(c, 0, by, bw, bh, c1, 14, .09);
      ell(c, -1, by + 2.5, bw * .55, bh * .55, c2);
      // Pointed white-rimmed ears
      for (const s of [-1, 1]) {
        c.save(); c.translate(s * R * .68, hy - R * .58);
        c.beginPath(); c.moveTo(-7, 4); c.quadraticCurveTo(s * 2, -12, s * 4, -13); c.quadraticCurveTo(s * 6, -4, 7, 4); c.closePath();
        c.fillStyle = cr; c.fill(); c.lineWidth = 1.4; c.strokeStyle = OUT; c.stroke();
        ell(c, s * 1, -2, 3.2, 4, c2);
        c.restore();
      }
      fluffEdge(c, 0, hy, R + 1, R * .92, c1, 16, .09);
      // White cheek & brow patches
      for (const s of [-1, 1]) {
        ell(c, s * R * .55, hy + R * .22, R * .34, R * .28, cr);
        ell(c, s * R * .32, hy - R * .26, R * .16, R * .12, cr);
      }
      ell(c, 0, hy + R * .34, R * .38, R * .27, cr, OUT, .9);
      for (const s of [-1, 1]) eye(c, s * R * .38, hy + .5, R * .17, R * .19, '#2b1810', mode, s, { fur: c1 });
      blush(c, 0, hy + R * .26, R * .56, R * .16);
      ell(c, 0, hy + R * .24, 2.6, 1.9, '#2b1810');
    } else if (sp === 'giraffe') {
      const c1 = '#f5be4f', c2 = '#fff3cf', spCol = '#9c4f18', R = 15, hy = -46 - bob, by = -16 - bob * .5, bw = 14.5, bh = 10;
      shadow(c, 0, 0, 17);
      // Swaying tail with dark tuft
      c.save(); c.translate(10, -15 - bob * .5); c.rotate(-.3 + wag);
      c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(6, 5, 4, 11); c.lineWidth = 2.5; c.strokeStyle = c1; c.stroke();
      ell(c, 4, 11, 2.5, 3.2, '#4a2810', OUT, .9);
      c.restore();
      // Long giraffe legs with dark hooves
      zooLegs(c, c1, lg, 4.6, 12, [[-7.5, 1, 0], [-2.8, -1, 1], [2.8, 1, 1], [7.5, -1, 0]], '#4a2810');
      // Body with clipped giraffe patches
      ell(c, 0, by, bw, bh, grad(c, 0, by, bw, c1), OUT, 1.5);
      c.save(); c.beginPath(); c.ellipse(0, by, bw, bh, 0, 0, TAU); c.clip();
      for (const [px, py, rx, ry] of [[-7, -4, 3.4, 2.6], [-1, -6, 3.8, 2.8], [6, -3, 3.5, 2.6], [2, 1, 3, 2.2], [-5, 2, 2.8, 2]]) ell(c, px, by + py, rx, ry, spCol);
      c.restore();
      ell(c, -1.5, by + 3.5, bw * .52, bh * .48, c2);
      // Graceful 3D neck rising to the chibi head
      c.save();
      c.beginPath(); c.moveTo(-6.5, by - 4); c.lineTo(-4.2, hy + 8); c.lineTo(3.8, hy + 8); c.lineTo(4.5, by - 4); c.closePath();
      c.fillStyle = grad(c, -1, (by + hy) / 2, 14, c1); c.fill(); c.lineWidth = 1.5; c.strokeStyle = OUT; c.stroke();
      c.clip();
      for (const [ny2, rx] of [[-24, 2.6], [-30, 2.4], [-36, 2.2]]) ell(c, 0, ny2 - bob * .8, rx, rx * .8, spCol);
      c.restore();
      // Cute ossicones (horns) & leaf ears
      for (const s of [-1, 1]) {
        c.beginPath(); c.moveTo(s * 4.5, hy - R * .75); c.lineTo(s * 5.2, hy - R * 1.22);
        c.lineWidth = 3.2; c.strokeStyle = c1; c.stroke();
        ell(c, s * 5.4, hy - R * 1.25, 2.8, 2.6, '#5c3310', OUT, 1.1);
        c.save(); c.translate(s * R * .88, hy - R * .25); c.rotate(s * .35);
        ell(c, 0, 0, 5.5, 2.8, c1, OUT, 1.2); ell(c, 0, 0, 3.4, 1.5, '#f4a7a0');
        c.restore();
      }
      // Chibi giraffe head + cream snout
      ell(c, 0, hy, R, R * .88, grad(c, 0, hy, R, c1), OUT, 1.6);
      ell(c, 0, hy + R * .38, R * .56, R * .38, grad(c, 0, hy + R * .38, R * .56, c2), OUT, 1.1);
      for (const s of [-1, 1]) {
        eye(c, s * R * .42, hy - .5, R * .18, R * .2, '#3b2314', mode, s, { fur: c1 });
        ell(c, s * 3.2, hy + R * .28, 1.2, .9, '#7c4318');
      }
      blush(c, 0, hy + R * .2, R * .62, R * .16);
      c.beginPath(); c.arc(0, hy + R * .45, 2.8, .15 * Math.PI, .85 * Math.PI); c.lineWidth = 1.3; c.strokeStyle = '#5c3310'; c.stroke();
    } else if (sp === 'zebra') {
      const c1 = '#ffffff', stCol = '#1e242b', R = 16.5, hy = -31 - bob, by = -13.5 - bob * .6, bw = 15.5, bh = 10.5;
      shadow(c, 0, 0, 17);
      // Striped tail with black brush
      c.save(); c.translate(10, -11 - bob * .5); c.rotate(-.5 + wag);
      c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(8, 2, 7, 9); c.lineWidth = 3; c.strokeStyle = stCol; c.stroke();
      fluffEdge(c, 7, 10, 3.2, 4.5, stCol, 8, .15);
      c.restore();
      zooLegs(c, c1, lg, 5, 8.5, [[-7.5, 1, 0], [-2.8, -1, 1], [2.8, 1, 1], [7.5, -1, 0]], stCol);
      // Body with bold curved zebra stripes
      ell(c, 0, by, bw, bh, grad(c, 0, by, bw, c1), OUT, 1.5);
      c.save(); c.beginPath(); c.ellipse(0, by, bw, bh, 0, 0, TAU); c.clip();
      c.lineWidth = 2.6; c.strokeStyle = stCol;
      for (const sx of [-9, -4.5, 0, 4.5, 9]) { c.beginPath(); c.moveTo(sx, by - 11); c.quadraticCurveTo(sx + 2.5, by - 2, sx - 1, by + 9); c.stroke(); }
      c.restore();
      // Mohawk striped mane & ears
      for (let i = 0; i < 5; i++) {
        ell(c, 0, hy - R * .95 + i * 2.5, 4.5, 2.4, i % 2 ? c1 : stCol, OUT, 1);
      }
      zooEarsRound(c, hy, R, c1, '#f4a7a0', 4.8, .72);
      ell(c, 0, hy, R, R * .9, grad(c, 0, hy, R, c1), OUT, 1.6);
      c.save(); c.beginPath(); c.ellipse(0, hy, R, R * .9, 0, 0, TAU); c.clip();
      c.lineWidth = 2.1; c.strokeStyle = stCol;
      for (const s of [-1, 1]) {
        c.beginPath(); c.moveTo(s * R, hy - 3); c.lineTo(s * R * .62, hy - 1);
        c.moveTo(s * R, hy + 2); c.lineTo(s * R * .64, hy + 3); c.stroke();
      }
      c.restore();
      // Dark velvety zebra muzzle
      ell(c, 0, hy + R * .38, R * .54, R * .36, grad(c, 0, hy + R * .38, R * .54, '#2d3748'), OUT, 1.2);
      for (const s of [-1, 1]) {
        eye(c, s * R * .4, hy - .5, R * .17, R * .19, '#2b1d12', mode, s, { fur: c1 });
        ell(c, s * 3.2, hy + R * .28, 1.3, 1, '#111827');
      }
      blush(c, 0, hy + R * .2, R * .6, R * .15);
      c.beginPath(); c.arc(0, hy + R * .46, 2.6, .15 * Math.PI, .85 * Math.PI); c.lineWidth = 1.3; c.strokeStyle = '#f8fafc'; c.stroke();
    } else if (sp === 'elephant') {
      const c1 = '#8e9aaf', c2 = '#cbd5e1', R = 18.5, hy = -30 - bob, by = -15 - bob * .6, bw = 18.5, bh = 13.5;
      shadow(c, 0, 0, 20);
      zooLegs(c, c1, lg, 6.8, 8, [[-9, 1, 0], [-3.2, -1, 1], [3.2, 1, 1], [9, -1, 0]], '#e2e8f0');
      ell(c, 0, by, bw, bh, grad(c, 0, by, bw, c1), OUT, 1.6);
      ell(c, -1, by + 3, bw * .56, bh * .55, c2);
      // Huge floppy fan ears on both sides of the chibi head
      const earFlap = Math.sin(t * 4 + seed) * .08;
      for (const s of [-1, 1]) {
        c.save(); c.translate(s * R * .85, hy + 1); c.rotate(s * earFlap);
        ell(c, s * 2, 0, 9.5, 12.5, grad(c, s * 2, 0, 12, shade(c1, -.08)), OUT, 1.5);
        ell(c, s * 1.5, 1, 6.2, 8.5, '#f2b5c4');
        c.restore();
      }
      // Chibi Elephant Head
      ell(c, 0, hy, R, R * .92, grad(c, 0, hy, R, c1), OUT, 1.6);
      for (const s of [-1, 1]) eye(c, s * R * .42, hy, R * .17, R * .19, '#2d3748', mode, s, { fur: c1 });
      blush(c, 0, hy + R * .26, R * .58, R * .17);
      // Ivory tusks
      for (const s of [-1, 1]) {
        c.beginPath(); c.moveTo(s * 5.5, hy + R * .35); c.quadraticCurveTo(s * 9.5, hy + R * .55, s * 7.5, hy + R * .72);
        c.lineWidth = 3.4; c.lineCap = 'round'; c.strokeStyle = OUT; c.stroke();
        c.lineWidth = 2.2; c.strokeStyle = '#fffdf0'; c.stroke();
      }
      // Expressive waving 3D trunk + water spray
      const tr = Math.sin(t * 3 + seed) * 3.5;
      c.beginPath(); c.moveTo(0, hy + R * .22); c.quadraticCurveTo(-4 + tr * .5, hy + R * .75, -7 + tr, hy + R * .48);
      c.lineWidth = 7.5; c.lineCap = 'round'; c.strokeStyle = OUT; c.stroke();
      c.lineWidth = 5.5; c.strokeStyle = c1; c.stroke();
      ell(c, -7.2 + tr, hy + R * .46, 3, 2.4, '#f2b5c4', OUT, .9);
      if (Math.sin(t * 1.4 + seed) > .25) {
        for (let wi = 0; wi < 3; wi++) {
          ell(c, -9 + tr - wi * 3.5, hy - 12 - wi * 4 + Math.sin(t * 6 + wi) * 2, 2.4, 2.4, '#63b3ed', '#ffffff', .7);
        }
      }
    } else if (sp === 'rhino') {
      const c1 = '#7c899b', c2 = '#cbd5e1', R = 17.5, hy = -28 - bob, by = -14 - bob * .6, bw = 18, bh = 12.5;
      shadow(c, 0, 0, 19);
      zooLegs(c, c1, lg, 6.4, 7.5, [[-8.5, 1, 0], [-3, -1, 1], [3, 1, 1], [8.5, -1, 0]], '#e2e8f0');
      ell(c, 0, by, bw, bh, grad(c, 0, by, bw, c1), OUT, 1.6);
      ell(c, -1, by + 3, bw * .54, bh * .52, c2);
      zooEarsRound(c, hy, R, c1, '#e2a8b4', 4.8, .74);
      ell(c, 0, hy, R, R * .9, grad(c, 0, hy, R, c1), OUT, 1.6);
      ell(c, 0, hy + R * .35, R * .58, R * .38, grad(c, 0, hy + R * .35, R * .58, shade(c1, .12)), OUT, 1.2);
      for (const s of [-1, 1]) eye(c, s * R * .44, hy - .5, R * .16, R * .18, '#2d3748', mode, s, { fur: c1 });
      blush(c, 0, hy + R * .24, R * .6, R * .16);
      // Iconic double cream horns on the snout
      c.beginPath(); c.moveTo(-3.8, hy + R * .22); c.quadraticCurveTo(-1, hy - R * .38, 0, hy - R * .42); c.quadraticCurveTo(2.5, hy - R * .1, 3.8, hy + R * .22); c.closePath();
      c.fillStyle = '#f7f1e1'; c.fill(); c.lineWidth = 1.3; c.strokeStyle = OUT; c.stroke();
      c.beginPath(); c.moveTo(-2.4, hy - R * .02); c.lineTo(0, hy - R * .25); c.lineTo(2.4, hy - R * .02); c.closePath();
      c.fillStyle = '#efe5ce'; c.fill(); c.stroke();
    } else if (sp === 'hippo') {
      const c1 = '#8e799c', c2 = '#d8b4e2', R = 17.5, hy = -28 - bob, by = -13.5 - bob * .6, bw = 18, bh = 13;
      shadow(c, 0, 0, 19);
      zooLegs(c, c1, lg, 6.2, 6.8, [[-8, 1, 0], [-2.8, -1, 1], [2.8, 1, 1], [8, -1, 0]]);
      ell(c, 0, by, bw, bh, grad(c, 0, by, bw, c1), OUT, 1.5);
      ell(c, -1, by + 3, bw * .58, bh * .56, c2);
      zooEarsRound(c, hy, R, c1, '#f4a7b8', 4.4, .76);
      ell(c, 0, hy, R, R * .9, grad(c, 0, hy, R, c1), OUT, 1.6);
      // Big squishy rosy hippo snout + nostrils + cute little tusks
      ell(c, 0, hy + R * .38, R * .68, R * .44, grad(c, 0, hy + R * .38, R * .68, c2), OUT, 1.4);
      for (const s of [-1, 1]) {
        eye(c, s * R * .38, hy - 1.5, R * .17, R * .19, '#2d1e36', mode, s, { fur: c1 });
        ell(c, s * 4.2, hy + R * .24, 2, 1.5, '#5b3e6b');
        rrect(c, s * 4.5 - 1.4, hy + R * .64, 2.8, 3.2, 1);
        c.fillStyle = '#ffffff'; c.fill(); c.lineWidth = .9; c.strokeStyle = OUT; c.stroke();
      }
      blush(c, 0, hy + R * .28, R * .62, R * .16);
      c.beginPath(); c.arc(0, hy + R * .48, 4.2, .12 * Math.PI, .88 * Math.PI); c.lineWidth = 1.4; c.strokeStyle = '#4a2c59'; c.stroke();
    } else if (sp === 'croc') {
      const c1 = '#439a56', c2 = '#f6e58d', scCol = '#276738', R = 16, hy = -22 - bob, by = -9 - bob * .5, bw = 16.5, bh = 9.5;
      shadow(c, 0, 0, 18);
      // Armored crocodile tail
      c.save(); c.translate(11, -7 - bob * .4); c.rotate(-.2 + wag * .6);
      c.beginPath(); c.moveTo(0, -4); c.quadraticCurveTo(14, -2, 18, 2); c.quadraticCurveTo(10, 5, 0, 4); c.closePath();
      c.fillStyle = grad(c, 6, 0, 14, c1); c.fill(); c.lineWidth = 1.4; c.strokeStyle = OUT; c.stroke();
      for (const tx of [4, 9, 13]) ell(c, tx, -3, 2.2, 1.8, scCol, OUT, .8);
      c.restore();
      zooLegs(c, c1, lg, 5.2, 5.5, [[-8, 1, 0], [-2.5, -1, 1], [3, 1, 1], [8, -1, 0]]);
      ell(c, 0, by, bw, bh, grad(c, 0, by, bw, c1), OUT, 1.5);
      ell(c, -1, by + 2.5, bw * .62, bh * .55, c2);
      // Expressive chibi crocodile head + wide smiling snout with cute teeth
      for (const s of [-1, 1]) ell(c, s * 6, hy - R * .55, 4.8, 4.5, c1, OUT, 1.3);
      ell(c, 0, hy, R, R * .82, grad(c, 0, hy, R, c1), OUT, 1.5);
      ell(c, 0, hy + R * .38, R * .72, R * .42, grad(c, 0, hy + R * .38, R * .72, shade(c1, .12)), OUT, 1.4);
      for (const s of [-1, 1]) {
        eye(c, s * 5.8, hy - R * .42, R * .18, R * .2, '#e6b800', mode, s, { slit: true, fur: c1 });
        ell(c, s * 4.2, hy + R * .22, 1.4, 1, '#1e4620');
      }
      blush(c, 0, hy + R * .18, R * .62, R * .15);
      c.beginPath(); c.moveTo(-8, hy + R * .48); c.quadraticCurveTo(0, hy + R * .68, 8, hy + R * .48);
      c.lineWidth = 1.4; c.strokeStyle = '#1e4620'; c.stroke();
      for (const tx of [-5, -1.8, 1.8, 5]) {
        c.beginPath(); c.moveTo(tx - 1.2, hy + R * .52); c.lineTo(tx, hy + R * .68); c.lineTo(tx + 1.2, hy + R * .52);
        c.fillStyle = '#ffffff'; c.fill(); c.lineWidth = .7; c.strokeStyle = OUT; c.stroke();
      }
    } else if (sp === 'flamingo') {
      const c1 = '#ff758f', c2 = '#ffb3c1', wCol = '#ff4d6d', R = 13.5, hy = -38 - bob, by = -16 - bob * .5;
      shadow(c, 0, 0, 13);
      // Slender pink legs
      c.lineWidth = 2.2; c.strokeStyle = '#ff5d8f';
      for (const s of [-1, 1]) {
        c.beginPath(); c.moveTo(s * 3.2, by + 6); c.lineTo(s * 3.2 + (s > 0 ? lg * .5 : -lg * .5), 0); c.stroke();
        ell(c, s * 3.2, -.5, 3.2, 1.4, '#ff5d8f', OUT, .8);
      }
      // Plump feathered body + scalloped wings
      ell(c, 1, by, 13.5, 9.5, grad(c, 1, by, 13.5, c1), OUT, 1.5);
      ell(c, 2, by - 1, 9, 5.8, grad(c, 2, by - 1, 9, wCol), OUT, 1.1);
      // Graceful S-neck
      c.beginPath(); c.moveTo(-6, by - 3); c.quadraticCurveTo(-11, (by + hy) / 2, -2, hy + 5);
      c.lineWidth = 6.5; c.lineCap = 'round'; c.strokeStyle = OUT; c.stroke();
      c.lineWidth = 4.5; c.strokeStyle = c1; c.stroke();
      // Cute Chibi Flamingo Head + curved two-tone bill
      ell(c, 0, hy, R, R * .88, grad(c, 0, hy, R, c1), OUT, 1.5);
      for (const s of [-1, 1]) eye(c, s * R * .38, hy - .5, R * .18, R * .2, '#2b1820', mode, s, { fur: c1 });
      blush(c, 0, hy + R * .22, R * .55, R * .16);
      c.beginPath(); c.moveTo(-3.5, hy + R * .18); c.quadraticCurveTo(0, hy + R * .05, 3.5, hy + R * .18); c.quadraticCurveTo(2.5, hy + R * .68, 0, hy + R * .75); c.quadraticCurveTo(-2.5, hy + R * .68, -3.5, hy + R * .18); c.closePath();
      c.fillStyle = '#ffd6e0'; c.fill(); c.lineWidth = 1.1; c.strokeStyle = OUT; c.stroke();
      c.beginPath(); c.arc(0, hy + R * .58, 2.2, 0, Math.PI); c.fillStyle = '#1e242b'; c.fill();
    } else if (sp === 'penguin') {
      const c1 = '#1e2638', c2 = '#ffffff', au = '#fbd38d', R = 15, hy = -28 - bob, by = -12 - bob * .5;
      shadow(c, 0, 0, 14);
      for (const s of [-1, 1]) ell(c, s * 4.8, -1, 4.2, 2.2, '#f6ad55', OUT, 1.1);
      // Plump tuxedo body + waving flippers
      ell(c, 0, by, 13.5, 12.5, grad(c, 0, by, 14, c1), OUT, 1.5);
      ell(c, 0, by + 1.5, 9.8, 9.8, grad(c, 0, by + 1.5, 10, c2));
      const flap = Math.sin(t * 10 + seed) * .25;
      for (const s of [-1, 1]) {
        c.save(); c.translate(s * 12, by - 2); c.rotate(s * (.35 + flap));
        ell(c, 0, 4, 3.5, 7.5, c1, OUT, 1.2);
        c.restore();
      }
      // Chibi Emperor Penguin head with golden cheek glow
      ell(c, 0, hy, R, R * .92, grad(c, 0, hy, R, c1), OUT, 1.6);
      for (const s of [-1, 1]) ell(c, s * R * .34, hy + R * .1, R * .38, R * .36, c2);
      ell(c, 0, hy + R * .28, R * .55, R * .34, au);
      for (const s of [-1, 1]) eye(c, s * R * .36, hy, R * .18, R * .2, '#1a202c', mode, s, { fur: c2 });
      blush(c, 0, hy + R * .26, R * .56, R * .16);
      c.beginPath(); c.moveTo(-3.6, hy + R * .16); c.quadraticCurveTo(0, hy + R * .04, 3.6, hy + R * .16); c.lineTo(0, hy + R * .46); c.closePath();
      c.fillStyle = '#f6ad55'; c.fill(); c.lineWidth = 1; c.strokeStyle = OUT; c.stroke();
    } else if (sp === 'seal') {
      const c1 = '#94a3b8', c2 = '#f1f5f9', R = 16, hy = -24 - bob, by = -10 - bob * .5;
      shadow(c, 0, 0, 17);
      // Tail flippers & side flippers
      ell(c, 13, -5 - bob * .4, 6.5, 3.5, shade(c1, -.1), OUT, 1.2);
      ell(c, 0, by, 15.5, 10, grad(c, 0, by, 15.5, c1), OUT, 1.5);
      ell(c, -1, by + 2.5, 10.5, 6.2, c2);
      for (const s of [-1, 1]) {
        c.save(); c.translate(s * 11, -5); c.rotate(s * .4);
        ell(c, 0, 0, 5.2, 2.8, shade(c1, -.08), OUT, 1.2);
        c.restore();
      }
      // Plush Chibi Seal Head + whiskered muzzle
      ell(c, 0, hy, R, R * .9, grad(c, 0, hy, R, c1), OUT, 1.6);
      for (const s of [-1, 1]) ell(c, s * R * .17, hy + R * .34, R * .22, R * .17, '#ffffff', OUT, .8);
      for (const s of [-1, 1]) eye(c, s * R * .38, hy - .5, R * .19, R * .21, '#1e293b', mode, s, { fur: c1 });
      blush(c, 0, hy + R * .24, R * .58, R * .16);
      ell(c, 0, hy + R * .2, 2.8, 2, '#1e293b');
      // Bouncing colorful beach ball above snout!
      const ballY = hy - R * 1.15 - Math.abs(Math.sin(t * 4 + seed)) * 5;
      ell(c, 0, ballY, 6.8, 6.8, grad(c, 0, ballY, 6.8, '#ff5a5f'), OUT, 1.2);
      ell(c, 0, ballY, 3, 6.6, '#ffd166', OUT, .8);
      ell(c, -2, ballY - 2.2, 1.8, 1.4, 'rgba(255,255,255,.75)');
    }
    c.restore();
  }

// 소품 그리기 함수 (슬롯별)
function drawHeadAcc(c, id, o, hy, R, dir) {
    // 기존 HUM.hatOnly를 활용하되, id에 따라 다르게 그릴 수 있도록 확장
    // 지금은 hatOnly가 id를 처리하도록 함 (HUM.hatOnly 내부에서 id별 분기 필요)
    HUM.hatOnly(c, { hat: id });
}

function drawFaceAcc(c, id, o, hy, R, dir) {
    if (dir !== 0) return; // 정면에서만 그림
    const a = COSM_DEF[id];
    if (!a) return;
    c.save();
    c.lineWidth = 1.5;
    c.strokeStyle = ART.OUT;
    // 안경 위치 (hy는 머리 중심 y)
    const ey = hy + 5; // 눈 위치 (human 함수 참고)
    if (id === 'sunglasses') {
        // 검은 렌즈 2개
        for (const s of [-1, 1]) {
            ART.rrect(c, s * 7 - 5, ey - 4, 10, 7, 2);
            c.fillStyle = '#1a1a1a';
            c.fill();
            c.stroke();
        }
        // 브릿지
        c.beginPath(); c.moveTo(-2, ey - 0.5); c.lineTo(2, ey - 0.5); c.stroke();
    } else if (id === 'glasses' || id === 'roundglass') {
        for (const s of [-1, 1]) {
            c.beginPath();
            c.arc(s * 7, ey, 5, 0, Math.PI * 2);
            c.strokeStyle = a.icon === '👓' ? '#3a2418' : '#c9962a';
            c.stroke();
        }
        c.beginPath(); c.moveTo(-2, ey); c.lineTo(2, ey); c.stroke();
    }
    c.restore();
}

function drawNeckAcc(c, id, o, hy, R, dir) {
    if (dir !== 0 && dir !== 1) return; // 정면/뒷면에서만
    const a = COSM_DEF[id];
    if (!a) return;
    c.save();
    const ny = hy + R * 0.9; // 목 위치
    // 목걸이 줄
    c.beginPath();
    c.arc(0, ny, R * 0.8, 0.15 * Math.PI, 0.85 * Math.PI);
    c.lineWidth = 2;
    c.strokeStyle = '#f5c542';
    c.stroke();
    // 펜던트/방울
    const py = ny + R * 0.3;
    if (id === 'pendant') {
        ART.ell(c, 0, py, 2.5, 3, '#ff7aa8', ART.OUT, 0.8);
    } else if (id === 'bell') {
        ART.ell(c, 0, py, 2.5, 2.5, '#ffd23a', ART.OUT, 0.8);
        ART.ell(c, 0, py + 1.5, 1, 1, '#6a4a1a');
    } else {
        ART.ell(c, 0, py, 2, 2, '#f5c542', ART.OUT, 0.8);
    }
    c.restore();
}

function drawEarAcc(c, id, o, hy, R, dir) {
    if (dir !== 0) return; // 정면에서만
    const a = COSM_DEF[id];
    if (!a) return;
    c.save();
    const ey = hy + 2; // 귀 위치
    const col = id === 'hoop' ? '#c9962a' : '#f5c542';
    for (const s of [-1, 1]) {
        ART.ell(c, s * (R + 0.5), ey, 2, 2, col, ART.OUT, 0.7);
    }
    c.restore();
}

function drawScarfAcc(c, id, o, hy, R, dir) {
    const a = COSM_DEF[id];
    if (!a) return;
    c.save();
    const col = id === 'scarf_red' ? '#e0303a' : '#2f4f8a';
    const ny = hy + R * 1.0;
    // 목도리 두른 부분
    c.beginPath();
    c.ellipse(0, ny, R * 0.85, R * 0.4, 0, 0, Math.PI * 2);
    c.fillStyle = col;
    c.fill();
    c.strokeStyle = ART.OUT;
    c.lineWidth = 1.2;
    c.stroke();
    // 늘어진 부분 (정면/뒷면)
    if (dir === 0 || dir === 1) {
        c.beginPath();
        c.moveTo(-3, ny + R * 0.2);
        c.quadraticCurveTo(-6, ny + R * 0.8, -4, ny + R * 1.3);
        c.lineWidth = 4;
        c.strokeStyle = col;
        c.stroke();
        c.lineWidth = 1.2;
        c.strokeStyle = ART.OUT;
        c.stroke();
    }
    c.restore();
}

// 슬롯별 그리기 함수 매핑
const ACC_DRAW = {
    head: drawHeadAcc,
    face: drawFaceAcc,
    neck: drawNeckAcc,
    ear: drawEarAcc,
    scarf: drawScarfAcc,
};

// HUM.hatOnly 함수 확장 (기존 hatOnly가 다양한 모자를 그릴 수 있도록)
// 참고: 기존 hatOnly는 HUM.norm을 거친 o.hat 값을 사용함
// 여기서는 id를 그대로 넘겨주면 hatOnly 내부에서 분기하도록 수정해야 함.
// (hatOnly의 원본 코드는 art.js의 hat() 함수를 호출함)
// hat() 함수 내부의 switch-case에 'catears', 'bunny' 등의 case가 이미 있으므로
// id를 hat으로 넘겨주면 됨.
// (실제로는 art.js의 hat() 함수가 이미 다양한 모자를 그림)
// 따라서 drawHeadAcc는 HUM.hatOnly(c, { hat: id })를 호출하기만 하면 됨.

// ART.human 함수 수정 (캐릭터 다 그린 뒤 소품 그리기)
// art.js의 human 함수 마지막 부분 (c.restore() 전)에 추가
/*
function human(c, o, dir, t, moving) {
    // ... 기존 캐릭터 그리기 ...
    
    // 소품 그리기
    if (o.acc) {
        for (const slot of ACC_SLOTS) {
            const id = o.acc[slot];
            if (id && ACC_DRAW[slot]) {
                // hy, R 값은 human 함수 내부에서 계산된 머리 위치/반지름
                // 기존 코드에서 hy = -50, R = 17 정도로 사용됨
                ACC_DRAW[slot](c, id, o, -50, 17, dir);
            }
        }
    }
    
    c.restore();
}
*/

  return { canCloth, human, setSit, randomHuman, pet, zooPet, look, moodOf, moodEmoji, hashStr, face, roams, habitatKind, shade, ell, rrect, grad, shadow, OUT, fluffEdge, zz, SHIRT, HAIR, SKIN, PANTS, eyes, blush };
})();


