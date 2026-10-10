// ================= Chibi humans v5: High-polish cozy storybook anime characters with Side-Walking =================
const HUM = (() => {
  const { shade, ell, rrect, OUT } = ART;
  const TAU = Math.PI * 2;
  const HAIRS = ['short', 'spiky', 'side', 'buzz', 'curly', 'mop', 'undercut', 'afro', 'bald', 'long', 'pony', 'bob', 'twin', 'bun', 'wavy', 'pixie', 'curlylong', 'braid', 'hime', 'sidepony', 'hightail'];

  // Soft & Warm Cozy Vintage Pastel Palettes (matching User Brief)
  const HAIRCOL = [
    '#3e2a20', '#2b1e18', '#5e3a24', '#7d4a29', '#8a5933', '#b87843', '#d99d55', '#e8c882',
    '#f5e0a8', '#a85337', '#d6865a', '#e8abb7', '#8f829d', '#5a789a', '#cbcbd4', '#f0ede6'
  ];
  const SKINS = ['#fff5ec', '#feeedf', '#f9e2d0', '#f2cfb6', '#e4b998', '#c99672', '#a37150'];
  const CLOTH = [
    '#d47b62', '#7ba689', '#7098c2', '#f3cc6d', '#bf7282', '#9d8bc4', '#f4a88f', '#4ea395',
    '#de856b', '#9aba77', '#fdfbf7', '#f4a4b8', '#526e8e', '#ffc2b3', '#7e7785', '#b3d1f4',
    '#ffe1b5', '#d6c2e0', '#849a62', '#846755'
  ];
  const PANTS = ['#48607d', '#5e493e', '#36535f', '#6c5c74', '#3c414d', '#866b5e', '#2c4363', '#566e8f', '#7d5c45'];
  const HATS = [null, 'cap', 'beanie', 'beret', 'straw'];

  function eyeMode(mood, blink) {
    if (mood === 'sleep') return 'closed';
    if (mood === 'happy') return 'happy';
    if (blink) return 'closed';
    return { love: 'sparkle', bored: 'half', angry: 'angry', sad: 'sad', surprised: 'wide', stern: 'half2' }[mood] || 'open';
  }

  // ---------- Front Eye ---------- (v3 7종)
  function humEye(c, ex, ey, s, o, mode, sc) {
    const col = o.eye || '#3a2418', sh = o.eyes | 0;
    let rx = 3.3 * sc, ry = 4.2 * sc, tilt = 0;
    if (sh === 1) { rx = 3.7 * sc; ry = 3.3 * sc; tilt = -s * .14; }
    if (sh === 2) { rx = 3.5 * sc; ry = 3.8 * sc; tilt = s * .2; }
    if (sh === 3) { rx = 3.9 * sc; ry = 4.9 * sc; }
    if (sh === 4) { rx = 1.8; ry = 2.3; }
    if (sh === 5) { rx = 3.6 * sc; ry = 3.5 * sc; tilt = -s * .28; }
    if (sh === 6) { rx = 3.9 * sc; ry = 2.3 * sc; }
    const ink = '#2b1a12';
    c.lineCap = 'round';
    if (mode === 'closed') { c.beginPath(); c.moveTo(ex - rx, ey + .5); c.quadraticCurveTo(ex, ey + ry * .55, ex + rx, ey + .5); c.lineWidth = 1.6; c.strokeStyle = ink; c.stroke(); if (o.lash) { c.beginPath(); c.moveTo(ex + s * rx, ey + .5); c.lineTo(ex + s * (rx + 1.6), ey - .6); c.stroke(); } return; }
    if (mode === 'happy') { c.beginPath(); c.moveTo(ex - rx, ey + 1.5); c.quadraticCurveTo(ex, ey - ry * .9, ex + rx, ey + 1.5); c.lineWidth = 1.9; c.strokeStyle = ink; c.stroke(); return; }
    const W = mode === 'wide' ? 1.12 : 1;
    c.save(); c.translate(ex, ey); c.rotate(tilt);
    if (sh === 4) {
      ell(c, 0, 0, rx * W, ry * W, '#20140e'); ell(c, -.6, -.8, .7, .7, '#fff');
    } else {
      // white of the eye (subtle) + iris
      ell(c, 0, 0, rx * W + .6, ry * W + .4, '#ffffff');
      const g = c.createLinearGradient(0, -ry, 0, ry); g.addColorStop(0, shade(col, -.45)); g.addColorStop(.55, col); g.addColorStop(1, shade(col, .5));
      const irx = rx * (sh === 6 ? .62 : .8) * (mode === 'wide' ? .8 : 1), iry = ry * .92 * (mode === 'wide' ? .8 : 1);
      const py = mode === 'sad' ? ry * .12 : 0;
      ell(c, 0, py, irx, iry, g);
      ell(c, 0, py + ry * .05, irx * (mode === 'wide' ? .4 : .5), iry * (mode === 'wide' ? .4 : .55), '#1a0f0a');
      ell(c, -irx * .38, -iry * .42 + py, irx * .42, iry * .3, '#ffffff');
      ell(c, irx * .35, iry * .45 + py, irx * .18, iry * .14, 'rgba(255,255,255,.9)');
      if (mode === 'sparkle') { ell(c, irx * .3, -iry * .1, irx * .16, iry * .12, '#fff'); ell(c, 0, iry * .5, irx * .5, iry * .14, 'rgba(255,190,210,.55)'); }
      // upper lash line
      c.beginPath(); c.ellipse(0, 0, rx * W + .8, ry * W + .6, 0, Math.PI * 1.02, Math.PI * 1.98); c.lineWidth = sh === 6 ? 1.6 : 2; c.strokeStyle = ink; c.stroke();
      if (o.lash) { c.beginPath(); c.moveTo(s * (rx + .4), -ry * .35); c.lineTo(s * (rx + 2.2), -ry * .95); c.moveTo(s * (rx - .6), -ry * .8); c.lineTo(s * (rx + 1), -ry * 1.4); c.lineWidth = 1.2; c.stroke(); }
      c.beginPath(); c.ellipse(0, 0, rx + .4, ry + .2, 0, Math.PI * .25, Math.PI * .75); c.lineWidth = .7; c.strokeStyle = 'rgba(60,30,20,.35)'; c.stroke();
    }
    // lids
    if (mode === 'half' || mode === 'half2' || mode === 'angry' || mode === 'sad') {
      let ai, ao;
      if (mode === 'half') { ai = ao = .05; } else if (mode === 'half2') { ai = ao = .4; } else if (mode === 'angry') { ai = -.05; ao = .7; } else { ai = .85; ao = .15; }
      const skin = o.skin;
      c.save(); c.beginPath(); c.ellipse(0, 0, rx * W + 1.3, ry * W + 1.2, 0, 0, TAU); c.clip();
      c.beginPath(); c.moveTo(-s * (rx + 2), -ry * ai); c.lineTo(s * (rx + 2), -ry * ao); c.lineTo(s * (rx + 2), -ry * 2); c.lineTo(-s * (rx + 2), -ry * 2); c.closePath(); c.fillStyle = skin; c.fill();
      c.restore();
      c.beginPath(); c.moveTo(-s * rx * 1.08, -ry * ai + .4); c.lineTo(s * rx * 1.08, -ry * ao + .4); c.lineWidth = 1.8; c.strokeStyle = ink; c.stroke();
    }
    c.restore();
  }

  // ---------- Side Profile Eye ----------
  function sideEye(c, ex, ey, o, mode, sc) {
    const col = o.eye || '#3a2418';
    const rx = 3.2 * sc, ry = 4.8 * sc;
    const ink = '#24140d';
    c.lineCap = 'round';
    if (mode === 'closed') {
      c.beginPath(); c.moveTo(ex - rx * .8, ey + .5); c.quadraticCurveTo(ex + rx * .2, ey + ry * .4, ex + rx * .9, ey);
      c.lineWidth = 1.8; c.strokeStyle = ink; c.stroke();
      if (o.lash) { c.beginPath(); c.moveTo(ex + rx * .9, ey); c.lineTo(ex + rx * 1.6, ey - 1.2); c.stroke(); }
      return;
    }
    if (mode === 'happy') {
      c.beginPath(); c.moveTo(ex - rx * .8, ey + 1.2); c.quadraticCurveTo(ex + rx * .2, ey - ry * .8, ex + rx * .9, ey + 1.2);
      c.lineWidth = 2.1; c.strokeStyle = ink; c.stroke();
      return;
    }
    // Sclera
    ell(c, ex, ey, rx, ry, '#ffffff');
    // Iris
    const g = c.createLinearGradient(ex, ey - ry, ex, ey + ry);
    g.addColorStop(0, shade(col, -.4));
    g.addColorStop(.5, col);
    g.addColorStop(1, shade(col, .45));
    ell(c, ex + .4, ey, rx * .82, ry * .92, g);
    // Pupil
    ell(c, ex + .5, ey, rx * .42, ry * .5, '#120905');
    // Catchlights
    ell(c, ex - rx * .2, ey - ry * .38, rx * .45, ry * .35, '#ffffff');
    ell(c, ex + rx * .3, ey + ry * .35, rx * .26, ry * .2, 'rgba(255,255,255,.9)');
    // Upper eyelid liner
    c.beginPath();
    c.moveTo(ex - rx * .9, ey - ry * .2);
    c.quadraticCurveTo(ex, ey - ry * 1.15, ex + rx * 1.1, ey - ry * .15);
    c.lineWidth = 2.2; c.strokeStyle = ink; c.stroke();
    if (o.lash) {
      c.beginPath(); c.moveTo(ex + rx * .8, ey - ry * .4); c.lineTo(ex + rx * 1.6, ey - ry * .95); c.lineWidth = 1.4; c.stroke();
    }
  }

  // ---------- Front Face Features ---------- (v3)
  function face(c, o, hy, mood, t) {
    const ey = hy + 5, hw = o.hw || 18.5, sp = 7.2 * (hw / 18.5), sc = o.kid ? 1.1 : 1;
    const seed = o.sd || 3;
    const blink = mood !== 'sleep' && ((t + (seed % 50) * .23) % 3.9) < .13;
    const mode = eyeMode(mood, blink);
    for (const s of [-1, 1]) humEye(c, s * sp, ey, s, o, mode, sc);
    // brows (identity shape + expression)
    const bc = shade(o.hair, -.25);
    for (const s of [-1, 1]) {
      const ex = s * sp; let by = ey - 7.2;
      let inner = 0, outer = 0; // +down
      if (mood === 'angry') { inner = 2.4; outer = -1; }
      else if (mood === 'sad') { inner = -2; outer = 1; }
      else if (mood === 'surprised') { by -= 2; }
      else if (mood === 'bored' || mood === 'stern') { inner = .6; outer = .6; }
      else if (o.brow === 3) { inner = 1.2; outer = -1.2; }
      if (!o.brow && mood === 'calm') continue;
      c.beginPath(); c.moveTo(ex - s * 3.4, by + inner); c.quadraticCurveTo(ex, by - 1.4 + (inner + outer) / 2, ex + s * 3.4, by + outer);
      c.lineWidth = o.brow === 2 || mood === 'stern' ? 2.3 : 1.4; c.strokeStyle = bc; c.lineCap = 'round'; c.stroke();
    }
    // nose
    const nx = 0, nyy = hy + 9.2;
    if (o.nose === 1) ell(c, nx, nyy, .9, .7, shade(o.skin, -.28));
    else if (o.nose === 2) { c.beginPath(); c.moveTo(nx + .6, nyy - 2.2); c.lineTo(nx - .9, nyy + .4); c.lineTo(nx + .6, nyy + .6); c.lineWidth = .9; c.strokeStyle = shade(o.skin, -.3); c.stroke(); }
    else if (o.nose === 3) { ell(c, nx, nyy, 2, 1.4, shade(o.skin, -.08)); ell(c, nx - .5, nyy - .5, .7, .5, 'rgba(255,255,255,.6)'); }
    // blush / cheeks
    const bl = mood === 'love' || mood === 'happy' ? .5 : mood === 'angry' ? .4 : o.blush ? .3 : 0;
    if (bl) { const bcol = mood === 'angry' ? `rgba(230,70,60,${bl})` : `rgba(255,120,130,${bl})`; ell(c, -11, hy + 11, 3.6, 2, bcol); ell(c, 11, hy + 11, 3.6, 2, bcol); if (mood === 'love') for (const s of [-1, 1]) for (const d of [-1.2, 0, 1.2]) { c.beginPath(); c.moveTo(s * 11 + d - .6, hy + 12); c.lineTo(s * 11 + d + .6, hy + 10.2); c.lineWidth = .6; c.strokeStyle = 'rgba(220,80,100,.6)'; c.stroke(); } }
    if (o.freckle) for (const s of [-1, 1]) for (const [dx, dy] of [[0, 0], [2, 1.2], [-1.6, 1.4]]) ell(c, s * 10 + dx, hy + 10 + dy, .55, .55, '#b0714f');
    if (o.mole) ell(c, (o.mole > 0 ? 1 : -1) * 6, hy + 13.5, .7, .7, '#5a3a2a');
    // mouth
    const my = hy + 12.2, w = o.mouth === 4 ? 3.4 : o.mouth === 3 ? 2 : 2.7; c.lineWidth = 1.3; c.strokeStyle = '#7a3428'; c.lineCap = 'round'; c.lineJoin = 'round';
    const lipc = o.lip ? '#d95f76' : '#7a3428';
    switch (mood) {
      case 'happy':
        c.beginPath(); c.moveTo(-w - 1, my - .6); c.quadraticCurveTo(0, my + 5, w + 1, my - .6); c.closePath(); c.fillStyle = '#9c3434'; c.fill(); c.stroke();
        c.save(); c.clip(); c.fillStyle = '#fff'; c.fillRect(-w - 1, my - 1, 2 * w + 2, 1.6); ell(c, 0, my + 3.4, 2, 1.4, '#ef7c86'); c.restore(); break;
      case 'love':
        c.beginPath(); c.moveTo(-w, my - .3); c.quadraticCurveTo(0, my + 3.4, w, my - .3); c.closePath(); c.fillStyle = '#b8404a'; c.fill(); c.strokeStyle = lipc; c.stroke(); break;
      case 'surprised': ell(c, 0, my + .8, 1.8, 2.3, '#8a2e2e', '#7a3428', 1.1); break;
      case 'angry':
        c.beginPath(); c.moveTo(-w - .6, my + 1.6); c.quadraticCurveTo(0, my - 1.8, w + .6, my + 1.6); c.stroke();
        break;
      case 'sad': c.beginPath(); c.moveTo(-w, my + 1.4); c.quadraticCurveTo(0, my - 1, w, my + 1.4); c.stroke(); break;
      case 'bored': c.beginPath(); c.moveTo(-w + 1.5, my + .6); c.lineTo(w + 1.2, my); c.stroke(); break;
      case 'stern': c.beginPath(); c.moveTo(-w, my + .5); c.lineTo(w, my + .5); c.lineWidth = 1.5; c.stroke(); break;
      case 'sleep': ell(c, 0, my + .6, 1.2, 1, '#8a2e2e'); break;
      default: {
        const k = (o.mouth | 0) % 3;
        c.strokeStyle = lipc; c.lineWidth = o.lip ? 1.7 : 1.3;
        c.beginPath();
        if (k === 0) { c.moveTo(-w, my - .4); c.quadraticCurveTo(0, my + 2, w, my - .4); }
        else if (k === 1) { c.moveTo(-w * .8, my + .3); c.quadraticCurveTo(0, my + .9, w * .8, my + .3); }
        else { c.moveTo(-w, my - .2); c.quadraticCurveTo(-w / 2, my + 1.6, 0, my + .2); c.quadraticCurveTo(w / 2, my + 1.6, w, my - .2); }
        c.stroke();
      }
    }
    // beard / mustache
    if (o.beard === 1) { c.beginPath(); c.moveTo(-4.5, my - 1.8); c.quadraticCurveTo(0, my - 4.2, 4.5, my - 1.8); c.quadraticCurveTo(0, my - 1.3, -4.5, my - 1.8); c.fillStyle = shade(o.hair, -.1); c.fill(); }
    if (o.beard === 2) { c.beginPath(); c.moveTo(-14, hy + 4); c.quadraticCurveTo(-13, hy + 19, 0, hy + 20); c.quadraticCurveTo(13, hy + 19, 14, hy + 4); c.quadraticCurveTo(10, hy + 12, 4, my - 2); c.lineTo(-4, my - 2); c.quadraticCurveTo(-10, hy + 12, -14, hy + 4); c.fillStyle = shade(o.hair, -.05); c.fill(); c.lineWidth = 1; c.strokeStyle = OUT; c.stroke(); }
    if (o.beard === 3) { for (let i = 0; i < 26; i++) { const a = Math.PI * (.12 + i / 26 * .76); ell(c, Math.cos(a) * 12.5, hy + 4 + Math.sin(a) * 12, .45, .45, shade(o.hair, -.1) + 'aa'); } }
    // glasses
    if (o.glasses) {
      c.lineWidth = 1.4; c.strokeStyle = o.glasses === 2 ? '#3a2a22' : o.glasses === 3 ? '#c0504a' : '#8a6a4a';
      for (const s of [-1, 1]) { if (o.glasses === 2) { rrect(c, s * sp - 4.8, ey - 3.9, 9.6, 7.6, 2); c.stroke(); } else { c.beginPath(); c.arc(s * sp, ey, 4.8, 0, TAU); c.stroke(); } }
      c.beginPath(); c.moveTo(-2.6, ey - .5); c.lineTo(2.6, ey - .5); c.stroke();
      ell(c, -sp - 1.5, ey - 1.5, 1.2, 1.2, 'rgba(255,255,255,.7)'); ell(c, sp - 1.5, ey - 1.5, 1.2, 1.2, 'rgba(255,255,255,.7)');
    }
    // mood extras
    if (mood === 'sad' && (t % 3.2) < 2) { const k = (t % 3.2) / 2; c.globalAlpha = 1 - k * .5; c.beginPath(); const tx = -sp - 1, ty = ey + 4 + k * 7; c.moveTo(tx, ty - 2.5); c.quadraticCurveTo(tx + 1.8, ty + .5, tx, ty + 1.8); c.quadraticCurveTo(tx - 1.8, ty + .5, tx, ty - 2.5); c.fillStyle = '#8fd0f5'; c.fill(); c.globalAlpha = 1; }
    if (mood === 'angry') { const ax = 13, ay = hy - 13, k = 1 + Math.sin(t * 8) * .12; c.lineWidth = 1.8; c.strokeStyle = '#e03a3a'; for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { c.beginPath(); c.moveTo(ax + dx * 1.3 * k, ay + dy * 4.2 * k); c.quadraticCurveTo(ax + dx * 1.6, ay + dy * 1.6, ax + dx * 4.2 * k, ay + dy * 1.3 * k); c.stroke(); } }
    if (mood === 'bored') { c.beginPath(); const sx = -15, sy = hy - 6; c.moveTo(sx, sy - 3); c.quadraticCurveTo(sx + 2.4, sy + 1, sx, sy + 2.4); c.quadraticCurveTo(sx - 2.4, sy + 1, sx, sy - 3); c.fillStyle = '#a8dcff'; c.fill(); c.lineWidth = .7; c.strokeStyle = '#5a9ac8'; c.stroke(); }
    if (mood === 'surprised') { c.lineWidth = 1.4; c.strokeStyle = '#3a2418'; for (const a of [-.5, 0, .5]) { c.beginPath(); c.moveTo(Math.sin(a) * 22, hy - 22 - Math.cos(a) * 2); c.lineTo(Math.sin(a) * 26, hy - 26 - Math.cos(a) * 3); c.stroke(); } }
  }

  // ---------- Side Profile Face Features ----------
  function sideFace(c, o, hy, mood, t) {
    const blink = (t * 1.7 % 4.5) < .13 && mood !== 'sleep';
    const em = eyeMode(mood, blink);
    const ey = hy + 5.2;
    const ex = 4.0;

    // Eyebrow
    c.lineWidth = 1.3; c.strokeStyle = shade(o.hair, -.2); c.lineCap = 'round';
    c.beginPath();
    if (mood === 'angry') { c.moveTo(ex - 3, ey - 7.5); c.lineTo(ex + 3, ey - 5.5); }
    else if (mood === 'sad') { c.moveTo(ex - 3, ey - 5.5); c.lineTo(ex + 3, ey - 7.5); }
    else { c.moveTo(ex - 3, ey - 6.5); c.quadraticCurveTo(ex, ey - 8, ex + 3, ey - 6.5); }
    c.stroke();

    // Eye
    sideEye(c, ex, ey, o, em, 1);

    // Cheek Blush
    const bl = mood === 'love' || mood === 'happy' ? .55 : o.blush ? .38 : .2;
    ell(c, 4.0, hy + 10.5, 4.2, 2.4, `rgba(255,120,135,${bl})`);
    ell(c, 5.0, hy + 10.2, 1.5, 0.9, 'rgba(255,255,255,.45)');

    // Profile Mouth (cleanly placed above rounded chin)
    const my = hy + 12.0;
    c.beginPath();
    c.strokeStyle = '#7a3428'; c.lineWidth = 1.4; c.lineCap = 'round';
    if (mood === 'happy') {
      c.moveTo(5.0, my - .5); c.quadraticCurveTo(6.8, my + 2.8, 8.8, my - .5);
      c.closePath(); c.fillStyle = '#a03434'; c.fill(); c.stroke();
    } else if (mood === 'sad') {
      c.moveTo(5.2, my + 1.0); c.quadraticCurveTo(6.8, my - .7, 8.6, my + 1.0); c.stroke();
    } else {
      c.moveTo(5.2, my); c.quadraticCurveTo(7.0, my + 1.4, 8.6, my - .2); c.stroke();
    }

    // Glasses in profile
    if (o.glasses) {
      c.lineWidth = 1.4; c.strokeStyle = o.glasses === 2 ? '#3a2a22' : '#8a6a4a';
      rrect(c, 1, ey - 4.2, 8, 8, 2); c.stroke();
      c.beginPath(); c.moveTo(1, ey - .5); c.lineTo(-4, ey - 1.5); c.stroke();
    }
  }

  // ==========================================
  // SIDE-VIEW HAIR SYSTEM (Natural, individual styling for all hairstyles)
  // ==========================================
  // 1. hairSideBack: rendered BEHIND torso and head in profile
  function hairSideBack(c, o, hy, sway) {
    if (o.hs === 'bald' || o.hs === 'buzz' || o.hs === 'undercut' || o.hs === 'short' || o.hs === 'spiky' || o.hs === 'pixie' || o.hs === 'mop' || o.hs === 'side' || o.hs === 'bob') return;
    const g = ART.grad(c, 0, hy - 8, 22, o.hair);
    const dark = shade(o.hair, -.15);
    c.fillStyle = g; c.strokeStyle = OUT; c.lineWidth = 1.4;

    // Long cascading hair types behind back
    if (['long', 'wavy', 'curlylong', 'hime', 'braid'].includes(o.hs)) {
      c.beginPath();
      c.moveTo(-11, hy - 2);
      if (o.hs === 'wavy' || o.hs === 'curlylong') {
        c.bezierCurveTo(-18 + sway * 7, hy + 10, -22 + sway * 10, hy + 22, -15 + sway * 8, hy + 34);
        c.quadraticCurveTo(-7, hy + 36, -3, hy + 28);
        c.bezierCurveTo(-9, hy + 18, -4, hy + 8, -5, hy - 2);
      } else if (o.hs === 'hime') {
        c.bezierCurveTo(-17 + sway * 6, hy + 12, -18 + sway * 8, hy + 24, -14 + sway * 7, hy + 34);
        c.lineTo(-3, hy + 34); // sharp blunt cut
        c.bezierCurveTo(-6, hy + 18, -3, hy + 8, -4, hy - 2);
      } else { // long & braid base
        c.bezierCurveTo(-17 + sway * 7, hy + 12, -19 + sway * 9, hy + 23, -13 + sway * 8, hy + 33);
        c.quadraticCurveTo(-6, hy + 35, -2, hy + 27);
        c.bezierCurveTo(-7, hy + 17, -4, hy + 8, -5, hy - 2);
      }
      c.closePath();
      c.fillStyle = dark; c.fill(); c.stroke();

      if (o.hs === 'braid') {
        for (let i = 0; i < 4; i++) {
          ell(c, -8 + sway * 5, hy + 13 + i * 5.2, 3.6, 3.0, dark, OUT, .9);
        }
        ell(c, -8 + sway * 5, hy + 34, 2.5, 2.5, o.bow || '#f2c14e');
      }
    }

    // Ponytails (mid, high, or side)
    if (o.hs === 'pony' || o.hs === 'hightail' || o.hs === 'sidepony') {
      const isHigh = o.hs === 'hightail';
      const py = isHigh ? hy - 14 : hy - 5;
      const px = isHigh ? -12 : -15;
      c.save();
      c.translate(px, py);
      c.rotate(sway * .3 + (isHigh ? -.25 : .18));
      c.beginPath();
      c.moveTo(0, 0);
      c.bezierCurveTo(-14, 4, -22, 16, -16, 29);
      c.bezierCurveTo(-9, 21, -5, 10, 0, 3);
      c.closePath();
      c.fillStyle = g; c.fill(); c.stroke();
      ell(c, 0, 1.5, 3.4, 3.4, o.bow || '#f2c14e');
      c.restore();
    }

    // Twintails in profile (front and back tail overlap naturally)
    if (o.hs === 'twin') {
      for (const [ox, rot, lk] of [[-15, -.18, 25], [-12, .18, 27]]) {
        c.save();
        c.translate(ox, hy - 6);
        c.rotate(rot + sway * .28);
        c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(-11, 7, -15, 16, -9, lk); c.bezierCurveTo(-5, 16, -3, 9, 0, 3); c.closePath();
        c.fillStyle = g; c.fill(); c.stroke();
        ell(c, 0, 2, 2.8, 2.8, o.bow || '#f2c14e');
        c.restore();
      }
    }

    // Bun / Chignon
    if (o.hs === 'bun') {
      ell(c, -14, hy - 12, 7.5, 7.5, g, OUT, 1.3);
      if (o.bow) ell(c, -10, hy - 11, 3, 3, o.bow);
    }

    // Afro volume behind head
    if (o.hs === 'afro') {
      for (let i = 0; i < 6; i++) {
        const a = Math.PI * (0.8 + i / 5 * 0.6);
        ell(c, -4 + Math.cos(a) * 19, hy - 3 + Math.sin(a) * 18, 7.5, 7.5, dark, OUT, 1.0);
      }
    }
  }

  // 2. hairSideFront: rendered ON TOP of head (crown, skull, bangs, side locks tailored for each hairstyle)
  function hairSideFront(c, o, hy, sway) {
    const g = ART.grad(c, 0, hy - 8, 22, o.hair);
    c.fillStyle = g; c.strokeStyle = OUT; c.lineWidth = 1.4;

    // Bald special case: clean scalp with soft highlight only
    if (o.hs === 'bald') {
      ell(c, -3, hy - 10, 5, 2.5, 'rgba(255,255,255,.35)');
      return;
    }

    // BASE CRANIAL HAIR CAP (Conforms smoothly to the head curve without bulky deformities)
    c.beginPath();
    c.moveTo(7.0, hy - 5); // hairline above forehead (well above eye)
    c.bezierCurveTo(7.5, hy - 14, 1.0, hy - 19.5, -7.0, hy - 19.0); // crown arch
    c.bezierCurveTo(-18.0, hy - 15.0, -18.5, hy + 1.0, -15.0, hy + 8.0); // back of skull down to nape
    c.quadraticCurveTo(-5.0, hy + 5.0, -2.5, hy + 2.0); // curving forward above neck to ear
    c.quadraticCurveTo(2.0, hy + 1.0, 7.0, hy - 5);
    c.closePath();
    c.fillStyle = g; c.fill(); c.stroke();

    // ==========================================
    // HAIRSTYLE-SPECIFIC PROFILE DETAILS (Bangs, textures, locks)
    // ==========================================
    switch (o.hs) {
      case 'buzz':
        // Close cropped textured perimeter
        for (let i = 0; i < 7; i++) {
          const a = Math.PI * (1.1 + i / 7 * 0.75);
          ell(c, -4 + Math.cos(a) * 16, hy - 6 + Math.sin(a) * 15, 1.2, 1.2, shade(o.hair, -.15));
        }
        break;

      case 'undercut':
        // Faded nape and sideburn stippling
        ell(c, -11, hy + 6, 4, 3, o.hair + '66');
        // Swept-back voluminous top
        c.beginPath();
        c.moveTo(7.5, hy - 6);
        c.bezierCurveTo(8.0, hy - 18, 0, hy - 24, -10, hy - 22);
        c.bezierCurveTo(-15, hy - 20, -12, hy - 14, -6, hy - 14);
        c.quadraticCurveTo(2, hy - 12, 7.5, hy - 6);
        c.closePath();
        c.fillStyle = g; c.fill(); c.stroke();
        break;

      case 'spiky':
        // Dynamic anime spikes along crown
        for (let i = 0; i < 4; i++) {
          const sx = -12 + i * 5.5, sy = hy - 18 - (i % 2) * 3;
          c.beginPath();
          c.moveTo(sx - 3, sy + 3);
          c.lineTo(sx - 1, sy - 5);
          c.lineTo(sx + 3.5, sy + 2.5);
          c.closePath();
          c.fillStyle = g; c.fill(); c.stroke();
        }
        // Sharp front bangs
        c.beginPath();
        c.moveTo(7.5, hy - 7);
        c.lineTo(8.5, hy - 1);
        c.lineTo(5.5, hy - 3);
        c.lineTo(6.5, hy + 2);
        c.lineTo(3.5, hy - 1);
        c.closePath();
        c.fillStyle = g; c.fill(); c.stroke();
        break;

      case 'side':
        // Elegant side-parted fringe draping softly down forehead
        c.beginPath();
        c.moveTo(7.2, hy - 8);
        c.quadraticCurveTo(8.5, hy - 1, 6.0, hy + 2.5);
        c.quadraticCurveTo(3.0, hy + 1, 2.5, hy - 5);
        c.closePath();
        c.fillStyle = g; c.fill(); c.stroke();
        // Side lock tucked near ear
        c.beginPath();
        c.moveTo(1.5, hy - 1);
        c.quadraticCurveTo(2.2, hy + 9, -0.5, hy + 11);
        c.lineTo(-2.5, hy + 8);
        c.closePath();
        c.fillStyle = g; c.fill();
        break;

      case 'pixie':
        // Chic feathery layered bangs and neat ear taper
        c.beginPath();
        c.moveTo(7.5, hy - 7);
        c.lineTo(8.2, hy - 2);
        c.lineTo(5.2, hy - 1);
        c.lineTo(5.8, hy + 1.5);
        c.lineTo(2.5, hy - 2);
        c.closePath();
        c.fillStyle = g; c.fill(); c.stroke();
        // Soft sideburn
        c.beginPath();
        c.moveTo(0.5, hy);
        c.lineTo(-0.2, hy + 8);
        c.lineTo(-2.5, hy + 6);
        c.closePath();
        c.fillStyle = g; c.fill();
        break;

      case 'mop':
        // Shaggy textured bangs falling softly to brow
        c.beginPath();
        c.moveTo(7.8, hy - 9);
        c.quadraticCurveTo(9.0, hy - 2, 7.2, hy + 2.2);
        c.lineTo(4.8, hy + 0.5);
        c.lineTo(3.2, hy + 2.8);
        c.lineTo(1.2, hy - 2.5);
        c.closePath();
        c.fillStyle = g; c.fill(); c.stroke();
        // Messy tufts on crown
        for (const [tx, ty] of [[-4, hy - 21], [-9, hy - 20], [1, hy - 18]]) {
          ell(c, tx, ty, 3.2, 2.2, g, OUT, 0.9);
        }
        break;

      case 'hime':
        // Iconic sharp straight bangs
        c.beginPath();
        c.moveTo(7.8, hy - 8);
        c.lineTo(8.5, hy + 1.0);
        c.lineTo(2.0, hy + 1.0);
        c.lineTo(2.0, hy - 7);
        c.closePath();
        c.fillStyle = g; c.fill(); c.stroke();
        // Sharp blunt side lock
        c.beginPath();
        c.moveTo(3.5, hy + 0.5);
        c.lineTo(4.2, hy + 13.0);
        c.lineTo(0.5, hy + 13.0);
        c.lineTo(0.2, hy + 0.5);
        c.closePath();
        c.fillStyle = g; c.fill(); c.stroke();
        break;

      case 'bob':
        // Soft rounded bangs
        c.beginPath();
        c.moveTo(7.5, hy - 7);
        c.quadraticCurveTo(8.5, hy - 2, 6.5, hy + 2.0);
        c.quadraticCurveTo(3.0, hy + 0.5, 2.5, hy - 5);
        c.closePath();
        c.fillStyle = g; c.fill(); c.stroke();
        // Smooth curved bob cheek hair hugging the jawline
        c.beginPath();
        c.moveTo(2.0, hy);
        c.bezierCurveTo(4.5, hy + 8, 4.0, hy + 15, -1.0, hy + 15.5);
        c.quadraticCurveTo(-6.0, hy + 14.5, -4.0, hy + 5.0);
        c.closePath();
        c.fillStyle = g; c.fill(); c.stroke();
        break;

      case 'curly': case 'curlylong':
        // Bouncy rounded curls around crown and forehead
        for (const [cx, cy, r] of [[6.5, hy - 3, 3.6], [4.5, hy - 8, 4.0], [-1.0, hy - 17, 4.5], [-8.0, hy - 18, 4.5], [-15.0, hy - 12, 4.2], [1.5, hy + 6, 3.5]]) {
          ell(c, cx, cy, r, r * .9, g, OUT, 1.1);
        }
        if (o.hs === 'curlylong') {
          ell(c, 2.0 + sway * 2, hy + 13, 3.5, 3.8, g, OUT, 1.0);
          ell(c, 0.5 + sway * 3, hy + 20, 3.8, 4.0, g, OUT, 1.0);
        }
        break;

      case 'afro':
        // Full lush afro crown halo in profile
        for (let i = 0; i < 9; i++) {
          const a = Math.PI * (1.1 + i / 8 * 1.3);
          ell(c, -3 + Math.cos(a) * 19, hy - 5 + Math.sin(a) * 18, 7.5, 7.5, g, OUT, 1.1);
        }
        for (const [x, y] of [[-6, -15], [1, -16], [5, -10], [5, -2]]) {
          ell(c, x, hy + y, 6.0, 5.5, g);
        }
        break;

      default:
        // short, long, wavy, pony, twin, bun, braid, hightail, sidepony
        // Natural soft curved fringe framing the forehead cleanly
        c.beginPath();
        c.moveTo(7.5, hy - 8);
        c.quadraticCurveTo(8.5, hy - 2, 6.5, hy + 2.0);
        c.quadraticCurveTo(3.0, hy + 0.5, 2.5, hy - 5);
        c.closePath();
        c.fillStyle = g; c.fill(); c.stroke();

        // Delicate sideburn strand in front of ear
        c.beginPath();
        c.moveTo(1.5, hy);
        c.lineTo(0.5, hy + 8);
        c.lineTo(-1.8, hy + 6.5);
        c.closePath();
        c.fillStyle = g; c.fill();

        // Graceful front lock falling past collar for long & wavy
        if (o.hs === 'long' || o.hs === 'wavy') {
          c.beginPath();
          c.moveTo(2.5, hy + 3);
          c.bezierCurveTo(4.0, hy + 12, 4.5 + sway * 3, hy + 20, 1.5 + sway * 2, hy + 27);
          c.quadraticCurveTo(-1.0, hy + 25, 0.0, hy + 16);
          c.quadraticCurveTo(0.5, hy + 8, 0.5, hy + 3);
          c.closePath();
          c.fillStyle = g; c.fill(); c.stroke();
        }
        break;
    }

    // LUMINOUS HAIR SHEEN HALO (Soft watercolor gloss line along crown)
    if (!['buzz', 'curly', 'curlylong', 'afro', 'spiky'].includes(o.hs)) {
      c.beginPath();
      c.ellipse(-4, hy - 11, 7.5, 3.5, -.3, Math.PI * 1.15, Math.PI * 1.75);
      c.lineWidth = 2.0; c.strokeStyle = 'rgba(255,255,255,.36)'; c.lineCap = 'round'; c.stroke();
    }
  }

  // ---------- Front & Back Hair ----------
  function hairBack(c, o, hy) { // drawn before body (behind neck/body)
    const col = shade(o.hair, -.08);
    c.fillStyle = col; c.strokeStyle = OUT; c.lineWidth = 1.4;
    if (o.hs === 'hightail') { ell(c, 0, hy - 19, 6, 5, o.hair, OUT, 1.2); c.beginPath(); c.moveTo(-3, hy - 20); c.bezierCurveTo(14, hy - 30, 24, hy - 6, 16, hy + 16); c.bezierCurveTo(14, hy + 2, 8, hy - 12, -3, hy - 14); c.closePath(); c.fill(); c.stroke(); }
    if (o.hs === 'afro') { ell(c, 0, hy - 4, 26, 24, col, OUT, 1.4); }
    if (o.hs === 'long' || o.hs === 'wavy' || o.hs === 'curlylong' || o.hs === 'hime') {
      c.beginPath(); c.moveTo(-19, hy - 2);
      if (o.hs === 'wavy' || o.hs === 'curlylong') { c.bezierCurveTo(-24, hy + 12, -16, hy + 18, -21, hy + 30); c.quadraticCurveTo(0, hy + 36, 21, hy + 30); c.bezierCurveTo(16, hy + 18, 24, hy + 12, 19, hy - 2); }
      else { c.lineTo(-20, hy + 30); c.quadraticCurveTo(0, hy + 35, 20, hy + 30); c.lineTo(19, hy - 2); }
      c.closePath(); c.fill(); c.stroke();
    }
    if (o.hs === 'braid') { for (let i = 0; i < 4; i++) ell(c, 15, hy + 8 + i * 6, 4.2 - i * .4, 3.6, col, OUT, 1.1); }
  }

  function hairFront(c, o, hy, back) {
    const g = ART.grad(c, 0, hy - 8, 20, o.hair);
    c.fillStyle = g; c.strokeStyle = OUT; c.lineWidth = 1.5;
    const cap = () => { c.beginPath(); c.moveTo(-19.8, hy + 3); c.bezierCurveTo(-22, hy - 22, 22, hy - 25, 19.8, hy + 3); };
    if (back) {
      // back of head
      ell(c, 0, hy - 1, 19.6, 18.6, g, OUT, 1.5);
      if (o.hs === 'pony') {
        ell(c, 0, hy + 4, 7, 12, g, OUT, 1.2);
        ell(c, 0, hy - 3, 3.5, 3.5, o.bow || '#f2c14e');
      }
      if (o.hs === 'hightail') {
        ell(c, 0, hy - 18, 7.5, 6, g, OUT, 1.2);
        ell(c, 0, hy - 15, 4, 3.5, o.bow || '#f2c14e');
      }
      if (o.hs === 'bun') {
        ell(c, 0, hy - 17, 8, 8, g, OUT, 1.3);
        if (o.bow) ell(c, 0, hy - 13, 3.5, 3.5, o.bow);
      }
      if (o.hs === 'twin') {
        for (const s of [-1, 1]) {
          ell(c, s * 20, hy + 6, 6, 13, g, OUT, 1.2);
          ell(c, s * 18, hy - 3, 3, 3, o.bow || '#f2c14e');
        }
      }
      if (o.hs === 'sidepony') {
        ell(c, -19, hy + 6, 6.5, 12, g, OUT, 1.2);
        ell(c, -16, hy - 2, 3, 3, o.bow || '#f2c14e');
      }
      if (o.hs === 'spiky') {
        for (const [x, y] of [[-10, -22], [0, -25], [10, -22]]) {
          c.beginPath(); c.moveTo(x - 5, hy - 14); c.lineTo(x, hy + y + 2); c.lineTo(x + 5, hy - 14); c.closePath(); c.fill(); c.stroke();
        }
      }
      if (o.hs === 'bob') {
        c.beginPath(); c.moveTo(-19.5, hy + 2); c.quadraticCurveTo(0, hy + 20, 19.5, hy + 2); c.lineTo(19.5, hy - 6); c.quadraticCurveTo(0, hy + 12, -19.5, hy - 6); c.closePath(); c.fillStyle = shade(o.hair, -.12); c.fill();
      }
      if (o.hs === 'buzz' || o.hs === 'undercut') {
        ell(c, 0, hy - 1, 19.6, 18.6, ART.grad(c, 0, hy - 8, 20, o.skin), OUT, 1.5);
        ell(c, 0, hy - 5, 18, 14, o.hair + 'aa');
      }
      if (o.hs === 'bald') {
        ell(c, 0, hy - 1, 19.6, 18.6, ART.grad(c, 0, hy - 8, 20, o.skin), OUT, 1.5);
        ell(c, 0, hy + 6, 17, 7, o.hair + 'cc');
      }
      if (o.hs === 'afro') {
        for (let i = 0; i < 12; i++) {
          const a = i / 12 * TAU;
          ell(c, Math.cos(a) * 17, hy - 4 + Math.sin(a) * 15, 8, 8, g, OUT, 1);
        }
      }
      return;
    }
    switch (o.hs) {
      case 'bald':
        for (const sd of [-1, 1]) { c.beginPath(); c.ellipse(sd * 15.8, hy + 1, 2.6, 6, 0, 0, TAU); c.fillStyle = o.hair; c.fill(); }
        ell(c, -5, hy - 11, 5, 2.5, 'rgba(255,255,255,.35)'); break;
      case 'afro':
        for (let i = 0; i < 9; i++) { const a = Math.PI * (1.05 + i / 8 * .9); ell(c, Math.cos(a) * 18, hy - 5 + Math.sin(a) * 15, 7.5, 7.5, g, OUT, 1.1); }
        for (const [x, y] of [[-8, -17], [0, -19], [8, -17]]) ell(c, x, hy + y, 6.5, 5.5, g); break;
      case 'undercut':
        c.beginPath(); c.moveTo(-18.5, hy - 2); c.bezierCurveTo(-19, hy - 21, 19, hy - 21, 18.5, hy - 2); c.quadraticCurveTo(0, hy - 10, -18.5, hy - 2); c.closePath(); c.fillStyle = o.hair + '99'; c.fill();
        c.beginPath(); c.moveTo(-15, hy - 8); c.bezierCurveTo(-16, hy - 26, 18, hy - 28, 17, hy - 10); c.quadraticCurveTo(8, hy - 16, -2, hy - 9); c.quadraticCurveTo(-8, hy - 12, -15, hy - 8); c.closePath(); c.fillStyle = g; c.fill(); c.stroke(); break;
      case 'hime':
        cap(); c.lineTo(19.8, hy - 5); c.lineTo(-19.8, hy - 5); c.closePath(); c.fill(); c.stroke();
        for (const sd of [-1, 1]) { rrect(c, sd * 17.5 - 3.5, hy - 5, 7, 20, 2); c.fillStyle = g; c.fill(); c.stroke(); }
        c.beginPath(); c.moveTo(-19, hy - 5.5); c.lineTo(19, hy - 5.5); c.lineWidth = 1.6; c.strokeStyle = shade(o.hair, -.3); c.stroke(); break;
      case 'buzz':
        c.beginPath(); c.moveTo(-18.5, hy - 2); c.bezierCurveTo(-19, hy - 21, 19, hy - 21, 18.5, hy - 2); c.quadraticCurveTo(0, hy - 10, -18.5, hy - 2); c.closePath(); c.fillStyle = o.hair + 'cc'; c.fill(); break;
      case 'spiky':
        cap(); c.lineTo(16, hy - 3); c.lineTo(12, hy + 1); c.lineTo(8, hy - 7); c.lineTo(3, hy - 1); c.lineTo(-2, hy - 8); c.lineTo(-7, hy - 1); c.lineTo(-11, hy - 7); c.lineTo(-16, hy + 1); c.closePath(); c.fill(); c.stroke();
        for (const [x, y] of [[-10, -24], [0, -27], [10, -24]]) { c.beginPath(); c.moveTo(x - 6, hy - 14); c.lineTo(x, hy + y + 4); c.lineTo(x + 6, hy - 14); c.closePath(); c.fill(); c.stroke(); }
        break;
      case 'side':
        cap(); c.quadraticCurveTo(14, hy - 6, 6, hy - 11); c.quadraticCurveTo(-8, hy - 4, -19.8, hy + 3); c.closePath(); c.fill(); c.stroke();
        c.beginPath(); c.moveTo(6, hy - 11); c.quadraticCurveTo(4, hy - 18, 10, hy - 20); c.lineWidth = 1; c.stroke(); break;
      case 'curly': case 'curlylong':
        for (const [x, y, r] of [[-15, -6, 7], [-10, -15, 7.5], [0, -19, 8], [10, -15, 7.5], [15, -6, 7], [-5, -10, 6], [5, -10, 6]]) ell(c, x, hy + y, r, r, g, OUT, 1.2);
        if (o.hs === 'curlylong') for (const s of [-1, 1]) for (let i = 0; i < 3; i++) ell(c, s * 18, hy + 4 + i * 7, 5.5, 5.5, g, OUT, 1.1);
        break;
      case 'mop':
        cap(); for (let i = 0; i < 7; i++) { const x = -17 + i * 5.7; c.lineTo(x + 2.8, hy - 1 + (i % 2) * 3); c.lineTo(x + 5.7, hy - 5); } c.closePath(); c.fill(); c.stroke(); break;
      case 'bob':
        cap(); c.quadraticCurveTo(12, hy - 8, 0, hy - 8); c.quadraticCurveTo(-12, hy - 8, -19.8, hy + 3); c.closePath(); c.fill(); c.stroke();
        for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * 19.8, hy - 2); c.quadraticCurveTo(s * 22, hy + 12, s * 16, hy + 15); c.lineTo(s * 14, hy + 4); c.closePath(); c.fill(); c.stroke(); }
        break;
      case 'pixie':
        cap(); c.quadraticCurveTo(10, hy - 4, 4, hy - 9); c.quadraticCurveTo(-4, hy - 12, -12, hy - 5); c.quadraticCurveTo(-18, hy - 2, -19.8, hy + 3); c.closePath(); c.fill(); c.stroke(); break;
      default: { // short / long / pony / twin / bun / wavy / braid: fringe
        cap(); c.quadraticCurveTo(12, hy - 11, 4, hy - 8); c.quadraticCurveTo(-4, hy - 4, -10, hy - 9); c.quadraticCurveTo(-16, hy - 6, -19.8, hy + 3); c.closePath(); c.fill(); c.stroke();
        if (o.hs === 'long' || o.hs === 'wavy') for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * 19.8, hy - 2); c.quadraticCurveTo(s * 21, hy + 16, s * 17, hy + 24); c.lineTo(s * 14.5, hy + 8); c.closePath(); c.fill(); c.stroke(); }
        if (o.hs === 'pony') { c.save(); c.translate(15, hy - 12); c.rotate(.5); ell(c, 0, 8, 5.5, 11, g, OUT, 1.2); c.restore(); }
        if (o.hs === 'twin') for (const s of [-1, 1]) { ell(c, s * 21, hy + 7, 5.5, 11, g, OUT, 1.2); ell(c, s * 19, hy - 5, 2.5, 2.5, '#ef7fa0'); }
        if (o.hs === 'bun') { ell(c, 0, hy - 20, 7.5, 7, g, OUT, 1.2); }
        if (o.hs === 'sidepony') { c.save(); c.translate(-18, hy - 4); c.rotate(-.35); ell(c, 0, 10, 6, 12, g, OUT, 1.2); c.restore(); ell(c, -17, hy - 5, 2.6, 2.6, o.bow || '#f2c14e'); }
        if (o.hs === 'hightail') ell(c, 0, hy - 19, 5, 3, shade(o.hair, -.1));
        if (o.hs === 'braid') { c.beginPath(); c.moveTo(17, hy); c.quadraticCurveTo(21, hy + 8, 18, hy + 14); c.lineWidth = 5; c.strokeStyle = o.hair; c.stroke(); }
      }
    }
    if (!['buzz', 'curly', 'curlylong', 'bald', 'afro', 'undercut'].includes(o.hs)) {
      c.beginPath(); c.ellipse(0, hy - 9, 15, 7, 0, Math.PI * 1.12, Math.PI * 1.55); c.lineWidth = 2.6; c.strokeStyle = 'rgba(255,255,255,.38)'; c.lineCap = 'round'; c.stroke();
      c.beginPath(); c.ellipse(0, hy - 9, 15, 7, 0, Math.PI * 1.65, Math.PI * 1.8); c.stroke();
      c.lineWidth = .9; c.strokeStyle = shade(o.hair, -.35);
      for (const [x0, x1] of [[-12, -8], [-3, -1], [6, 9]]) { c.beginPath(); c.moveTo(x0 + 2, hy - 18); c.quadraticCurveTo(x0, hy - 12, x1, hy - 6); c.stroke(); }
    }
    if (o.bow) { const bx = o.hs === 'bun' ? 7 : 11, by = hy - 15; c.fillStyle = o.bow; for (const s of [-1, 1]) { c.beginPath(); c.moveTo(bx, by); c.lineTo(bx + s * 6, by - 4); c.lineTo(bx + s * 6, by + 4); c.closePath(); c.fill(); c.lineWidth = 1; c.strokeStyle = OUT; c.stroke(); } ell(c, bx, by, 2, 2, shade(o.bow, -.2)); }
  }

  // ---------- Hats ----------
  function hat(c, o, hy, back) {
    if (!o.hat) return;
    c.strokeStyle = OUT; c.lineWidth = 1.4;
    const col = o.hatc || '#e07a5f';
    if (o.hat === 'cap') { c.beginPath(); c.moveTo(-19, hy - 6); c.bezierCurveTo(-19, hy - 26, 19, hy - 26, 19, hy - 6); c.closePath(); c.fillStyle = col; c.fill(); c.stroke(); if (!back) { c.beginPath(); c.ellipse(-4, hy - 6, 16, 4, 0, 0, Math.PI); c.fillStyle = shade(col, -.15); c.fill(); c.stroke(); } ell(c, 0, hy - 22, 2, 2, shade(col, -.2)); }
    if (o.hat === 'beanie') { c.beginPath(); c.moveTo(-19.5, hy - 4); c.bezierCurveTo(-20, hy - 30, 20, hy - 30, 19.5, hy - 4); c.closePath(); c.fillStyle = col; c.fill(); c.stroke(); rrect(c, -20, hy - 8, 40, 7, 3); c.fillStyle = shade(col, -.12); c.fill(); c.stroke(); ell(c, 0, hy - 27, 4.5, 4.5, '#fff', OUT, 1); }
    if (o.hat === 'beret') { c.beginPath(); c.ellipse(-3, hy - 14, 20, 8, -.15, 0, TAU); c.fillStyle = col; c.fill(); c.stroke(); ell(c, -3, hy - 21, 1.8, 2.5, shade(col, -.2)); }
    if (o.hat === 'catears' || o.hat === 'bunny') { c.fillStyle = col; for (const sd of [-1, 1]) { c.save(); c.translate(sd * 11, hy - 16); c.rotate(sd * (o.hat === 'bunny' ? .15 : .35)); c.beginPath(); if (o.hat === 'bunny') c.ellipse(0, -12, 4.5, 12, 0, 0, TAU); else { c.moveTo(-6, 3); c.lineTo(0, -10); c.lineTo(6, 3); c.closePath(); } c.fill(); c.stroke(); c.beginPath(); if (o.hat === 'bunny') c.ellipse(0, -12, 2.2, 8.5, 0, 0, TAU); else { c.moveTo(-3, 1); c.lineTo(0, -5); c.lineTo(3, 1); c.closePath(); } c.fillStyle = '#ffc2d4'; c.fill(); c.fillStyle = col; c.restore(); } c.beginPath(); c.arc(0, hy - 2, 19.5, Math.PI * 1.1, Math.PI * 1.9); c.lineWidth = 2.5; c.strokeStyle = shade(col, -.2); c.stroke(); }
    if (o.hat === 'flower') { c.beginPath(); c.arc(0, hy - 2, 19.5, Math.PI * 1.08, Math.PI * 1.92); c.lineWidth = 2; c.strokeStyle = '#5a9a48'; c.stroke(); for (let i = 0; i < 7; i++) { const a = Math.PI * (1.12 + i * .126), x = Math.cos(a) * 19.5, y = hy - 2 + Math.sin(a) * 19.5; for (let k = 0; k < 5; k++) ell(c, x + Math.cos(k * 1.26) * 2.4, y + Math.sin(k * 1.26) * 2.4, 2, 2, ['#ff9ab8', '#fff3a8', '#b8d8ff'][i % 3]); ell(c, x, y, 1.3, 1.3, '#f2c14e'); } }
    if (o.hat === 'crown') { c.beginPath(); c.moveTo(-11, hy - 14); c.lineTo(-11, hy - 25); c.lineTo(-5.5, hy - 19); c.lineTo(0, hy - 28); c.lineTo(5.5, hy - 19); c.lineTo(11, hy - 25); c.lineTo(11, hy - 14); c.closePath(); c.fillStyle = '#f5c542'; c.fill(); c.stroke(); for (const x of [-6, 0, 6]) ell(c, x, hy - 16.5, 1.6, 1.6, ['#e8343c', '#4a8ee0', '#5cae3c'][(x + 6) / 6]); }
    if (o.hat === 'witch') { c.beginPath(); c.ellipse(0, hy - 12, 26, 7, 0, 0, TAU); c.fillStyle = '#3b2f63'; c.fill(); c.stroke(); c.beginPath(); c.moveTo(-13, hy - 13); c.quadraticCurveTo(-4, hy - 34, 10, hy - 44); c.quadraticCurveTo(6, hy - 30, 13, hy - 13); c.closePath(); c.fill(); c.stroke(); rrect(c, -13, hy - 18, 26, 5, 1); c.fillStyle = '#f0a040'; c.fill(); }
    if (o.hat === 'santa') { c.beginPath(); c.moveTo(-18, hy - 8); c.bezierCurveTo(-16, hy - 32, 14, hy - 34, 22, hy - 16); c.lineTo(18, hy - 8); c.closePath(); c.fillStyle = '#e0343c'; c.fill(); c.stroke(); ell(c, 23, hy - 15, 4, 4, '#fff', OUT, 1); rrect(c, -20, hy - 11, 40, 7, 3.5); c.fillStyle = '#fff'; c.fill(); c.stroke(); }
    if (o.hat === 'sunhat') { c.beginPath(); c.ellipse(0, hy - 9, 29, 8, -.06, 0, TAU); c.fillStyle = '#fff4d6'; c.fill(); c.stroke(); c.beginPath(); c.moveTo(-14, hy - 10); c.bezierCurveTo(-14, hy - 27, 14, hy - 27, 14, hy - 10); c.closePath(); c.fill(); c.stroke(); rrect(c, -14, hy - 14, 28, 4, 1); c.fillStyle = '#ef8fa8'; c.fill(); ell(c, 12, hy - 13, 3.5, 3.5, '#ff7ab8'); }
    if (o.hat === 'headphones') { 
  c.beginPath(); 
  c.arc(0, hy - 62, 9, Math.PI * 1.05, Math.PI * 1.95);   // 20.5 → 14
  c.lineWidth = 1.4;                                        // 3.2 → 2.4
  c.strokeStyle = shade(col, -.2); 
  c.stroke(); 
  for (const sd of [-1, 1]) { 
    rrect(c, sd * 10 - 3, hy - 66, 6, 9, 3);                // sd*20-4, 8, 12, 4 → sd*15-3, 6, 9, 3
    c.fillStyle = col; 
    c.fill(); 
    c.lineWidth = 1;                                        // 1.2 → 1
    c.strokeStyle = OUT; 
    c.stroke(); 
  } 
}
    if (o.hat === 'heart') { c.beginPath(); c.arc(0, hy - 2, 19.5, Math.PI * 1.1, Math.PI * 1.9); c.lineWidth = 2.2; c.strokeStyle = '#ef7fa0'; c.stroke(); for (const sd of [-1, 1]) { c.save(); c.translate(sd * 8, hy - 26); c.beginPath(); c.moveTo(0, 4); c.bezierCurveTo(-7, -2, -3, -8, 0, -4); c.bezierCurveTo(3, -8, 7, -2, 0, 4); c.fillStyle = '#ff5a7a'; c.fill(); c.lineWidth = 1; c.strokeStyle = OUT; c.stroke(); c.restore(); c.beginPath(); c.moveTo(sd * 6, hy - 19); c.lineTo(sd * 8, hy - 24); c.lineWidth = 1.2; c.strokeStyle = '#ef7fa0'; c.stroke(); } }
    if (o.hat === 'straw') { c.beginPath(); c.ellipse(0, hy - 10, 27, 8, 0, 0, TAU); c.fillStyle = '#f0d58c'; c.fill(); c.stroke(); c.beginPath(); c.moveTo(-14, hy - 11); c.bezierCurveTo(-14, hy - 28, 14, hy - 28, 14, hy - 11); c.closePath(); c.fill(); c.stroke(); rrect(c, -14, hy - 15, 28, 4, 1); c.fillStyle = col; c.fill(); }
  }

  function hatSide(c, o, hy) {
    if (!o.hat) return;
    c.strokeStyle = OUT; c.lineWidth = 1.4;
    const col = o.hatc || '#e07a5f';
    if (o.hat === 'cap') {
      c.beginPath(); c.moveTo(-16, hy - 4); c.bezierCurveTo(-16, hy - 25, 12, hy - 24, 12, hy - 4);
      c.closePath(); c.fillStyle = col; c.fill(); c.stroke();
      // Cap Visor pointing forward
      c.beginPath(); c.moveTo(10, hy - 4); c.quadraticCurveTo(24, hy - 3, 22, hy);
      c.lineTo(10, hy - 1); c.closePath(); c.fillStyle = shade(col, -.18); c.fill(); c.stroke();
      ell(c, -2, hy - 21, 2, 2, shade(col, -.2));
    }
    if (o.hat === 'beanie') {
      c.beginPath(); c.moveTo(-17, hy - 2); c.bezierCurveTo(-18, hy - 28, 12, hy - 26, 12, hy - 2);
      c.closePath(); c.fillStyle = col; c.fill(); c.stroke();
      rrect(c, -17, hy - 6, 29, 6.5, 2.5); c.fillStyle = shade(col, -.12); c.fill(); c.stroke();
      ell(c, -6, hy - 26, 4.5, 4.5, '#fff', OUT, 1);
    }
    if (o.hat === 'beret') {
      c.beginPath(); c.ellipse(-4, hy - 15, 18, 7.5, -.2, 0, TAU); c.fillStyle = col; c.fill(); c.stroke();
      ell(c, -6, hy - 22, 2, 2.5, shade(col, -.2));
    }
    if (o.hat === 'straw') {
      c.beginPath(); c.ellipse(0, hy - 10, 24, 6.5, 0, 0, TAU); c.fillStyle = '#f0d58c'; c.fill(); c.stroke();
      c.beginPath(); c.moveTo(-12, hy - 11); c.bezierCurveTo(-12, hy - 26, 10, hy - 26, 10, hy - 11);
      c.closePath(); c.fillStyle = col; c.fill(); c.stroke();
    }
  }

  // ---------- Sneaker Helper ----------
  function drawSneaker(c, sx, sy, shoeCol, dir) {
    const soleCol = '#ffffff', bumperCol = '#ffffff';
    ell(c, sx, sy, 4.4, 2.8, shoeCol, OUT, .8);
    rrect(c, sx - 4.5, sy + 1.2, 9, 2.2, 1);
    c.fillStyle = soleCol; c.fill(); c.lineWidth = .7; c.strokeStyle = 'rgba(40,25,15,.6)'; c.stroke();
    c.beginPath();
    c.ellipse(sx + (dir || 1) * 3, sy + .8, 1.8, 1.8, 0, 0, TAU);
    c.fillStyle = bumperCol; c.fill();
  }

  function shadeFill(c, col) { const bg = c.createLinearGradient(-11, 0, 11, 0); bg.addColorStop(0, shade(col, .12)); bg.addColorStop(.55, col); bg.addColorStop(1, shade(col, -.18)); return bg; }

  // ---------- Body ---------- (v3)
  const FSHAPE = [[18.5, 17.5], [17.4, 18.4], [19.6, 17], [17.8, 18.9]];
  function bodyPath(c) {
    c.beginPath(); c.moveTo(-10, -13); c.quadraticCurveTo(-11.5, -31, -6, -34);
    c.lineTo(6, -34); c.quadraticCurveTo(11.5, -31, 10, -13); c.closePath();
  }

  // ================= MAIN DRAW METHOD =================
  // dir: 0 = front (south), 1 = back (north), 2 = side (profile)
  // ---- 사용자 그림 캐릭터 파트 PNG (헤어/상의/하의) 합성 렌더링 (레이어 방식, 2차) ----
  const PART2_IMG = {};
  function part2Ready() {
    // 새 이미지가 (늦게) 로드된 뒤에는 캐시된 미리보기(PIC)가 예전(벡터) 모습으로 굳어있을 수 있으니 비우고 다시 그림
    try { if (typeof PIC !== 'undefined' && PIC.clear) PIC.clear(); } catch (e) {}
    try { if (typeof rerenderChar === 'function') rerenderChar(); } catch (e) {}
    try { if (typeof render === 'function') render(); } catch (e) {}
  }
  // ---- 내가 직접 넣은(업로드한) 헤어/상의/하의/소품 그림 저장소 ----
  // CFG.look에는 용량이 큰 그림 자체를 넣지 않고 'c0','c1'... 같은 짧은 참조값만 저장하고,
  // 실제 그림(data URL)은 별도 localStorage 키에 카테고리별 배열로 보관한다 (최대 6장씩).
  const CUSTOM_MAX = 6;
  function loadCustomParts() {
    try {
      const raw = (typeof store !== 'undefined') ? store.get('ps.customParts', null) : JSON.parse(localStorage.getItem('ps.customParts') || 'null');
      return raw || { hair: [], top: [], bottom: [], acc: [] };
    } catch (e) { return { hair: [], top: [], bottom: [], acc: [] }; }
  }
  function saveCustomPart(cat, dataUrl) {
    const all = loadCustomParts();
    if (!all[cat]) all[cat] = [];
    all[cat].push(dataUrl);
    if (all[cat].length > CUSTOM_MAX) all[cat] = all[cat].slice(all[cat].length - CUSTOM_MAX);
    try { store.set('ps.customParts', all); } catch (e) {}
    return all[cat].length - 1;
  }
  function deleteCustomPart(cat, idx) {
    const all = loadCustomParts();
    if (all[cat] && all[cat][idx] != null) { all[cat].splice(idx, 1); try { store.set('ps.customParts', all); } catch (e) {} }
  }
  function getPart2Img(cat, idx) {
    if (typeof idx === 'string' && idx.charAt(0) === 'c') {
      const n = parseInt(idx.slice(1), 10);
      const key = 'custom_' + cat + '_' + n;
      let cim = PART2_IMG[key];
      if (!cim) {
        cim = new Image();
        PART2_IMG[key] = cim;
        const all = loadCustomParts();
        const durl = (all[cat] || [])[n];
        if (durl) { cim.onload = part2Ready; cim.src = durl; } // 이미 data: URL이라 캔버스 오염 걱정 없음
      }
      return cim;
    }
    const n = String(idx).padStart(2, '0');
    const key = cat + '_' + n;
    let im = PART2_IMG[key];
    if (!im) {
      im = new Image();
      im.crossOrigin = 'anonymous';
      PART2_IMG[key] = im;
      const url = assetUrl('spr/mychar2/' + cat + '/' + cat + '_' + n + '.png');
      // 앱(WebView) 안에서는 로컬 파일 경로로 그린 캔버스가 toDataURL()에 막힐 수 있어서(tainted canvas),
      // 파일을 미리 data: URL로 바꿔서 넣어줌 -> 그 어떤 캔버스에 그려도 막히지 않음(HUD 아이콘, 미리보기 전부 해당)
      // v1.100.12: 안드로이드 WebView(file:// 페이지)에서는 fetch()가 로컬 파일을 못 읽는 경우가 있어
      // (헤어 색상변경이 조용히 안 먹던 원인) XHR을 우선 시도하고, 그래도 안 되면 fetch, 그래도 안 되면 원본 경로.
      const toDataUrlViaXHR = () => new Promise((resolve, reject) => {
        try {
          const xhr = new XMLHttpRequest();
          xhr.open('GET', url, true);
          xhr.responseType = 'blob';
          xhr.onload = () => {
            if (xhr.status !== 0 && xhr.status !== 200) { reject(new Error('xhr ' + xhr.status)); return; }
            const fr = new FileReader();
            fr.onload = () => resolve(fr.result);
            fr.onerror = reject;
            fr.readAsDataURL(xhr.response);
          };
          xhr.onerror = reject;
          xhr.send();
        } catch (e) { reject(e); }
      });
      const toDataUrlViaFetch = () => fetch(url).then(r => r.blob()).then(blob => new Promise((resolve, reject) => {
        const fr = new FileReader();
        fr.onload = () => resolve(fr.result);
        fr.onerror = reject;
        fr.readAsDataURL(blob);
      }));
      toDataUrlViaXHR().catch(toDataUrlViaFetch)
        .then(dataUrl => { im.onload = part2Ready; im.src = dataUrl; })
        .catch(() => { im.onload = part2Ready; im.src = url; }); // 전부 실패하면(오프라인 등) 원래 경로로라도 시도
    }
    return im;
  }
  // 고정 정렬 상수 - 15세트 SIFT 특징점 매칭으로 산출한 중앙값 (목/허리 이음선 오차 최소화, 어떤 조합이든 자연스럽게 맞음)
 // ============ v1.108: 헤어 크기 배율 (한 곳만 바꾸면 전체 다 반영) ============
  const HAIR_SCALE = 0.8;
// v1.108: 얼굴+헤어를 통째로 위/아래 이동 (음수 = 위로, 양수 = 아래로)
  const HAIR_Y_OFFSET = -12;   // 위로 5만큼

  const P2_BASE = {
    // 원래 "완벽했던" 값 (스케일 1.0일 때)
    hair:   { size: 75.171, x: -39.269, y: -100.646 },
    top:    { size: 58.336, x: -29.180, y: -70.938 },
    bottom: { size: 58.336, x: -29.175, y: -44.763 },
    acc:    { size: 75.171, x: -39.269, y: -100.646 },
};
// HAIR_SCALE을 hair에만 적용 (top/bottom은 그대로)
const P2 = {
    hair:   { size: P2_BASE.hair.size * HAIR_SCALE, x: P2_BASE.hair.x * HAIR_SCALE, y: P2_BASE.hair.y * HAIR_SCALE + HAIR_Y_OFFSET },
    top:    P2_BASE.top,
    bottom: P2_BASE.bottom,
    acc:    { size: P2_BASE.acc.size * HAIR_SCALE, x: P2_BASE.acc.x * HAIR_SCALE, y: P2_BASE.acc.y * HAIR_SCALE + HAIR_Y_OFFSET },
};
  const FACE_SIZE = 52;   // 얼굴 전용 크기 (헤어와 독립)
  // 헤어 1~15는 그림마다 캔버스 안 얼굴 위치가 조금씩 달라서(작가가 손으로 그린 정도 편차),
  // 1번 헤어를 기준으로 각 번호별 얼굴 위치를 SIFT 특징점 매칭해 보정한 좌표 (목/이마 라인이 전부 1번과 같은 위치에 오도록)
  // v1.100.13: 헤어 번호별로 값을 다르게 뒀더니 일부(5번 등)가 안 맞는다는 피드백 반영 -
  // 얼굴처럼 전부 헤어1번의 확정 위치로 통일함.
 const HAIR1_POS      = { x: -36.269 * HAIR_SCALE, y: -106.146 * HAIR_SCALE + HAIR_Y_OFFSET };
  // v1.100.19: 정면에서 헤어별로 위치가 미묘하게 안 맞는다는 피드백으로 일부 번호만 개별 미세조정
  // (오른쪽/아래로 이동 = x/y 증가, 왼쪽/위로 이동 = x/y 감소)
  const HAIR_POS = {
    1: HAIR1_POS,
    2: { x: HAIR1_POS.x + 0.5, y: HAIR1_POS.y },
    3: { x: HAIR1_POS.x - 0.5, y: HAIR1_POS.y },
    4: { x: HAIR1_POS.x - 2.1, y: HAIR1_POS.y },
    5: { x: HAIR1_POS.x - 0.3, y: HAIR1_POS.y + 0.8 },
    6: { x: HAIR1_POS.x, y: HAIR1_POS.y + 1.7 },
    7: { x: HAIR1_POS.x + 0.3, y: HAIR1_POS.y + 1.8 },
    8: { x: HAIR1_POS.x - 0.5, y: HAIR1_POS.y + 2.2 },
    9: { x: HAIR1_POS.x - 1.3, y: HAIR1_POS.y +0.2 },
    10: { x: HAIR1_POS.x - 0.5, y: HAIR1_POS.y + 1.6 },
    11: { x: HAIR1_POS.x - 2, y: HAIR1_POS.y + 2.3 },
    12: { x: HAIR1_POS.x + 1.0, y: HAIR1_POS.y + 3.1 },
    13: { x: HAIR1_POS.x - 0.8, y: HAIR1_POS.y + 2.5 },
    14: { x: HAIR1_POS.x - 1.8, y: HAIR1_POS.y + 2.3 },
    15: { x: HAIR1_POS.x - 0.4, y: HAIR1_POS.y + 2.2 },
  };
  // v1.100.13: 얼굴이 헤어 위치를 "따라가던" 문제 수정 - 이제 얼굴은 헤어와 완전히 분리된
  // 고정 기준점(FACE_BASE)을 기준으로 그려짐 (헤어 번호가 바뀌어도 얼굴 위치는 흔들리지 않음).
  // 기존 "완벽하다"고 확정된 화면 위치는 그대로 유지되도록 환산해 보존함.
  const FACE_BASE = { x: P2.hair.x, y: P2.hair.y };
  const FACE1_POS = { x: 1.1, y: 1.65 };
  // v1.100.19: 얼굴 번호별 미세조정(오른쪽 이동 = x 증가, 왼쪽 이동 = x 감소)
  const FACE_POS = {
    1: FACE1_POS,
    2: { x: FACE1_POS.x - 0.5, y: FACE1_POS.y },
    3: FACE1_POS,
    4: { x: FACE1_POS.x + 0.5, y: FACE1_POS.y },
    5: FACE1_POS,
    6: { x: FACE1_POS.x, y: FACE1_POS.y + 1 },
    7: { x: FACE1_POS.x, y: FACE1_POS.y + 1 },
    8: { x: FACE1_POS.x, y: FACE1_POS.y + 1 },
    9: { x: FACE1_POS.x + 0.5, y: FACE1_POS.y + 1 },
    10: { x: FACE1_POS.x + 0.1, y: FACE1_POS.y + 1 },
    11: { x: FACE1_POS.x, y: FACE1_POS.y + 2 },
    12: { x: FACE1_POS.x, y: FACE1_POS.y + 2 },
    13: { x: FACE1_POS.x + 0.3, y: FACE1_POS.y + 2 },
    14: { x: FACE1_POS.x + 0.5, y: FACE1_POS.y + 2 },
    15: { x: FACE1_POS.x + 0.8, y: FACE1_POS.y + 2 },
  };
  // v1.100.19: 정면에서 상의 번호별 위아래 미세조정(위 이동 = y 감소, 아래 이동 = y 증가)
  const TOP_POS = {
    1: P2.top,
    2: { x: P2.top.x, y: P2.top.y - 0.5 },
    3: P2.top,
    4: { x: P2.top.x, y: P2.top.y - 0.5 },
    5: P2.top,
    6: { x: P2.top.x, y: P2.top.y + 2 },
    7: { x: P2.top.x, y: P2.top.y + 2 },
    8: { x: P2.top.x, y: P2.top.y + 2 },
    9: { x: P2.top.x, y: P2.top.y + 2 },
    10: { x: P2.top.x, y: P2.top.y + 1.5 },
    11: { x: P2.top.x, y: P2.top.y + 3 },
    12: { x: P2.top.x, y: P2.top.y + 3.5 },
    13: { x: P2.top.x, y: P2.top.y + 4 },
    14: { x: P2.top.x, y: P2.top.y + 3.6 },
    15: { x: P2.top.x, y: P2.top.y + 3.5 },
  };
  // v1.100.21: 정면 하의 번호별 좌우 미세조정
  const BOTTOM_POS = {
    1: { x: P2.bottom.x - 0.5, y: P2.bottom.y },
    2: P2.bottom, 3: P2.bottom, 4: P2.bottom, 5: P2.bottom, 6: P2.bottom, 7: P2.bottom,
    8: { x: P2.bottom.x + 0.5, y: P2.bottom.y },
    9: { x: P2.bottom.x + 0.5, y: P2.bottom.y },
    10: P2.bottom, 11: P2.bottom,
    12: { x: P2.bottom.x + 0.5, y: P2.bottom.y },
    13: { x: P2.bottom.x + 0.5, y: P2.bottom.y },
    14: { x: P2.bottom.x + 0.5, y: P2.bottom.y },
    15: { x: P2.bottom.x + 1.0, y: P2.bottom.y },
  };
  const DIR_SUFFIX = { 1: 'back', 2: 'side', 3: 'diag' };
  // 뒷면/옆면/대각선 각 방향별 헤어/상의/하의 15종 위치 보정표
  // (각 그림의 보이는 픽셀 무게중심을 정면 기준 화면상 같은 지점에 맞춰 자동 계산 - 1차 정렬값, 필요시 미세조정)
  const HAIR_BACK_BASE = { x: -38.012 * HAIR_SCALE, y:  -99.419 * HAIR_SCALE + HAIR_Y_OFFSET + 2.2 };
  // v1.100.24: 뒷면 헤어 번호별 미세조정(오른쪽 이동 = x 증가, 위 이동 = y 감소)
  const POS_hair_back = {
    1: { x: HAIR_BACK_BASE.x, y: HAIR_BACK_BASE.y - 2 },
    2: { x: HAIR_BACK_BASE.x, y: HAIR_BACK_BASE.y - 2 },
    3: { x: HAIR_BACK_BASE.x, y: HAIR_BACK_BASE.y - 2 },
    4: { x: HAIR_BACK_BASE.x, y: HAIR_BACK_BASE.y - 1 },
    5: { x: HAIR_BACK_BASE.x + 1, y: HAIR_BACK_BASE.y },
    6: HAIR_BACK_BASE,
    7: HAIR_BACK_BASE,
    8: HAIR_BACK_BASE,
    9: HAIR_BACK_BASE,
    10: HAIR_BACK_BASE,
    11: { x: HAIR_BACK_BASE.x + 1, y: HAIR_BACK_BASE.y },
    12: HAIR_BACK_BASE,
    13: HAIR_BACK_BASE,
    14: HAIR_BACK_BASE,
    15: { x: HAIR_BACK_BASE.x + 1, y: HAIR_BACK_BASE.y },
  };
  const POS_top_back = {
    1: { x: -29.308, y: -68.365 },
    2: { x: -29.609, y: -67.716 },
    3: { x: -29.669, y: -67.469 },
    4: { x: -29.03, y: -68.087 },
    5: { x: -29.297, y: -67.791 },
    6: { x: -29.094, y: -67.276 },
    7: { x: -29.595, y: -67.707 },
    8: { x: -29.538, y: -67.186 },
    9: { x: -28.914, y: -66.757 },
    10: { x: -29.261, y: -67.272 },
    11: { x: -29.272, y: -63.722 },
    12: { x: -29.497, y: -64.906 },
    13: { x: -29.641, y: -63.888 },
    14: { x: -28.979, y: -64.038 },
    15: { x: -29.07, y: -64.655 },
  };
  const POS_bottom_back = {
    1: { x: -28.483, y: -47.911 },
    2: { x: -28.38, y: -47.882 },
    3: { x: -28.638, y: -48.055 },
    4: { x: -27.888, y: -44.577 },
    5: { x: -27.954, y: -46.995 },
    6: { x: -28.359, y: -46.974 },
    7: { x: -28.031, y: -46.978 },
    8: { x: -28.967, y: -44.746 },
    9: { x: -27.927, y: -45.367 },
    10: { x: -28.319, y: -45.929 },
    11: { x: -28.77, y: -45.163 },
    12: { x: -28.243, y: -48.702 },
    13: { x: -28.825, y: -46.913 },
    14: { x: -28.021, y: -47.738 },
    15: { x: -28.011, y: -47.87 },
  };
  const HAIR_SIDE_BASE = { x: -39.291 * HAIR_SCALE - 1, y: -98.103 * HAIR_SCALE + HAIR_Y_OFFSET };
  // v1.100.24: 옆면 헤어 번호별 미세조정(오른쪽 이동 = x 증가, 위 이동 = y 감소)
  const POS_hair_side = {
    1: { x: HAIR_SIDE_BASE.x + 1, y: HAIR_SIDE_BASE.y - 2 },
    2: { x: HAIR_SIDE_BASE.x, y: HAIR_SIDE_BASE.y - 2 },
    3: { x: HAIR_SIDE_BASE.x + 1, y: HAIR_SIDE_BASE.y - 2 },
    4: { x: HAIR_SIDE_BASE.x + 1, y: HAIR_SIDE_BASE.y - 3 },
    5: { x: HAIR_SIDE_BASE.x, y: HAIR_SIDE_BASE.y - 2 },
    6: { x: HAIR_SIDE_BASE.x + 1, y: HAIR_SIDE_BASE.y - 2 },
    7: { x: HAIR_SIDE_BASE.x + 1, y: HAIR_SIDE_BASE.y - 2 },
    8: { x: HAIR_SIDE_BASE.x, y: HAIR_SIDE_BASE.y - 2 },
    9: { x: HAIR_SIDE_BASE.x, y: HAIR_SIDE_BASE.y - 2 },
    10: { x: HAIR_SIDE_BASE.x, y: HAIR_SIDE_BASE.y - 2 },
    11: HAIR_SIDE_BASE,
    12: { x: HAIR_SIDE_BASE.x + 2, y: HAIR_SIDE_BASE.y - 1 },
    13: HAIR_SIDE_BASE,
    14: { x: HAIR_SIDE_BASE.x + 1, y: HAIR_SIDE_BASE.y },
    15: { x: HAIR_SIDE_BASE.x, y: HAIR_SIDE_BASE.y - 1 },
  };
  const POS_top_side = {
    1: { x: -30.143, y: -67.473 },
    2: { x: -30.915, y: -66.925 },
    3: { x: -30.82, y: -67.369 },
    4: { x: -30.736, y: -67.349 },
    5: { x: -31.76, y: -67.171 },
    6: { x: -30.081, y: -66.761 },
    7: { x: -31.096, y: -66.643 },
    8: { x: -32.167, y: -66.734 },
    9: { x: -32.114, y: -66.72 },
    10: { x: -31.475, y: -66.938 },
    11: { x: -31.001, y: -64.705 },
    12: { x: -31.643, y: -65.91 },
    13: { x: -31.748, y: -64.822 },
    14: { x: -31.765, y: -64.515 },
    15: { x: -32.02, y: -65.763 },
  };
  const POS_bottom_side = {
    1: { x: -29.956, y: -44.835 },
    2: { x: -29.423, y: -45.983 },
    3: { x: -29.617, y: -46.76 },
    4: { x: -30.207, y: -44.699 },
    5: { x: -30.953, y: -47.46 },
    6: { x: -28.77, y: -46.363 },
    7: { x: -29.654, y: -46.482 },
    8: { x: -29.654, y: -46.767 },
    9: { x: -29.286, y: -46.443 },
    10: { x: -29.913, y: -47.496 },
    11: { x: -29.334, y: -47.626 },
    12: { x: -30.272, y: -44.809 },
    13: { x: -29.111, y: -46.355 },
    14: { x: -29.254, y: -46.569 },
    15: { x: -29.614, y: -46.034 },
  };
  const HAIR_DIAG_BASE = { x: -38.194 * HAIR_SCALE - 1, y:  -99.879 * HAIR_SCALE + HAIR_Y_OFFSET };
  // v1.100.24: 대각선 헤어 번호별 미세조정(오른쪽 이동 = x 증가)
  const POS_hair_diag = {
    1: { x: HAIR_DIAG_BASE.x + 2, y: HAIR_DIAG_BASE.y },
    2: { x: HAIR_DIAG_BASE.x + 2, y: HAIR_DIAG_BASE.y },
    3: { x: HAIR_DIAG_BASE.x + 2, y: HAIR_DIAG_BASE.y },
    4: { x: HAIR_DIAG_BASE.x + 1, y: HAIR_DIAG_BASE.y },
    5: { x: HAIR_DIAG_BASE.x + 1, y: HAIR_DIAG_BASE.y },
    6: { x: HAIR_DIAG_BASE.x + 2, y: HAIR_DIAG_BASE.y },
    7: { x: HAIR_DIAG_BASE.x + 2, y: HAIR_DIAG_BASE.y },
    8: { x: HAIR_DIAG_BASE.x + 1, y: HAIR_DIAG_BASE.y },
    9: { x: HAIR_DIAG_BASE.x + 1, y: HAIR_DIAG_BASE.y },
    10: { x: HAIR_DIAG_BASE.x + 1, y: HAIR_DIAG_BASE.y },
    11: { x: HAIR_DIAG_BASE.x + 1, y: HAIR_DIAG_BASE.y },
    12: { x: HAIR_DIAG_BASE.x + 2, y: HAIR_DIAG_BASE.y },
    13: { x: HAIR_DIAG_BASE.x + 2, y: HAIR_DIAG_BASE.y },
    14: { x: HAIR_DIAG_BASE.x + 2, y: HAIR_DIAG_BASE.y },
    15: { x: HAIR_DIAG_BASE.x + 1, y: HAIR_DIAG_BASE.y },
  };
  const POS_top_diag = {
    1: { x: -30.511, y: -68.376 },
    2: { x: -30.511, y: -67.681 },
    3: { x: -31.179, y: -67.211 },
    4: { x: -31.067, y: -68.15 },
    5: { x: -31.791, y: -68.33 },
    6: { x: -31.536, y: -67.308 },
    7: { x: -30.946, y: -67.297 },
    8: { x: -31.309, y: -67.062 },
    9: { x: -31.846, y: -67.372 },
    10: { x: -31.784, y: -67.576 },
    11: { x: -30.96, y: -64.823 },
    12: { x: -31.335, y: -65.888 },
    13: { x: -31.525, y: -64.495 },
    14: { x: -31.556, y: -65.069 },
    15: { x: -31.669, y: -66.107 },
  };
  const POS_bottom_diag = {
    1: { x: -30.862, y: -45.901 },
    2: { x: -31.179, y: -46.266 },
    3: { x: -30.668, y: -46.77 },
    4: { x: -30.72, y: -45.146 },
    5: { x: -30.24, y: -47.267 },
    6: { x: -30.821, y: -47.015 },
    7: { x: -31.315, y: -46.517 },
    8: { x: -30.918, y: -46.887 },
    9: { x: -31.189, y: -46.584 },
    10: { x: -31.592, y: -46.848 },
    11: { x: -31.39, y: -46.779 },
    12: { x: -31.339, y: -44.905 },
    13: { x: -30.52, y: -45.51 },
    14: { x: -31.218, y: -45.222 },
    15: { x: -30.376, y: -45.529 },
  };
  const POS_TABLES = {
    back: { hair: POS_hair_back, top: POS_top_back, bottom: POS_bottom_back },
    side: { hair: POS_hair_side, top: POS_top_side, bottom: POS_bottom_side },
    diag: { hair: POS_hair_diag, top: POS_top_diag, bottom: POS_bottom_diag },
  };

  // ---- 헤어 색상변경: 얼굴이 같이 그려진 그림이라 전체를 색조회전하면 피부/눈까지 변해버림 ----
  // 그래서 "이 그림에서 머리카락 색이 뭔지" 자동으로 찾아내서(불투명 픽셀 중 채도 있는 색의 최빈값),
  // 그 색과 비슷한 픽셀만 골라 색조를 돌리고 나머지(피부/눈/흰 하이라이트)는 그대로 둔다.
  // 매 프레임 다시 계산하면 느리니 (헤어번호+색조각도) 조합으로 작은 캔버스(256px)에 한 번만 계산해 캐시해둔다.
  function rgb2hsl(r, g, b) {
    const max = Math.max(r, g, b), min = Math.min(r, g, b); let h = 0, s = 0; const l = (max + min) / 2;
    const d = max - min;
    if (d) {
      s = l > .5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
      else if (max === g) h = ((b - r) / d + 2) * 60;
      else h = ((r - g) / d + 4) * 60;
    }
    return [h, s, l];
  }
  function hsl2rgb(h, s, l) {
    if (!s) return [l, l, l];
    const hue2rgb = (p, q, t) => { if (t < 0) t += 1; if (t > 1) t -= 1; if (t < 1 / 6) return p + (q - p) * 6 * t; if (t < 1 / 2) return q; if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6; return p; };
    const q = l < .5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q, hn = h / 360;
    return [hue2rgb(p, q, hn + 1 / 3), hue2rgb(p, q, hn), hue2rgb(p, q, hn - 1 / 3)];
  }
  const HAIR_RECOLOR_CACHE = {};
  const HAIR_RC_SIZE = 256;
  // v1.100.12: 헤어 전용이었던 "옷/헤어 색상만 바꾸고 피부/하이라이트는 보존" 알고리즘을 상의/하의에도
  // 그대로 재사용할 수 있게 이름만 일반화함 (동작은 동일 - 그림에서 가장 많이 쓰인 색상을 찾아 그 색만 바꿈).
  // v1.100.12: 색상 슬라이더에 흰색/회색/검정도 고를 수 있도록 범위를 360(색상) 뒤에
  // 100칸(검정 -> 회색 -> 흰색 무채색 구간)을 추가로 붙임. 0~360=색상(hue), 361~460=명도(무채색).
  function getPartRecolorCanvas(partKey, img, hueDeg, excludeBand, skinGlobal, wholeImage, maskImg) {
    hueDeg = Math.max(0, Math.min(460, Math.round(hueDeg || 0)));
    if (!hueDeg) return null;
    const key = partKey + ':' + hueDeg + ':' + (excludeBand ? (excludeBand.x0 + ',' + excludeBand.x1 + ',' + excludeBand.y0 + ',' + excludeBand.y1) : '') + ':' + (skinGlobal ? 1 : 0) + ':' + (wholeImage ? 1 : 0) + ':' + (maskImg ? 1 : 0);
    const cached = HAIR_RECOLOR_CACHE[key];
    if (cached) return cached;
    const gray = hueDeg > 360 ? (hueDeg - 360) : 0; // 1~100: 0=검정 ... 50=원래 명암 그대로(무채색) ... 100=흰색
    let off, oc, data;
    let maskPx = null;
    try {
      off = document.createElement('canvas'); off.width = HAIR_RC_SIZE; off.height = HAIR_RC_SIZE;
      oc = off.getContext('2d'); oc.drawImage(img, 0, 0, HAIR_RC_SIZE, HAIR_RC_SIZE);
      data = oc.getImageData(0, 0, HAIR_RC_SIZE, HAIR_RC_SIZE);
      // v1.100.22: 옆면/대각선 헤어의 얼굴(피부) 영역을 색상 수치 추정이 아니라, 실제 헤어 색상별 샘플
      // 그림 4장(빨/파/초/노)을 픽셀 단위로 비교해서(색이 바뀌는 자리=머리카락, 안 바뀌는 자리=피부)
      // 미리 만들어둔 정밀 마스크 그림을 그대로 사용 - 사람이 손으로 딴 다각형보다 훨씬 정확함
      if (maskImg && maskImg.complete && maskImg.naturalWidth) {
        const mc = document.createElement('canvas'); mc.width = HAIR_RC_SIZE; mc.height = HAIR_RC_SIZE;
        const mctx = mc.getContext('2d'); mctx.drawImage(maskImg, 0, 0, HAIR_RC_SIZE, HAIR_RC_SIZE);
        maskPx = mctx.getImageData(0, 0, HAIR_RC_SIZE, HAIR_RC_SIZE).data;
      }
    } catch (e) { return null; } // 캔버스 오염 등으로 실패하면 그냥 포기(원본 그림으로 대체됨)
    const px = data.data;
    const W = HAIR_RC_SIZE;
    const isMaskProtect = (p) => maskPx[p * 4] < 128; // 마스크 그림: 밝음(255)=머리카락(색 변경 허용), 어두움(0)=피부(보존)
    // v1.100.15: excludeBand - 옆면/대각선 헤어 그림엔 얼굴(눈/코/뺨/목)이 같이 그려져 있어서(별도 얼굴
    // 레이어가 없음) 헤어 색을 바꾸면 얼굴까지 같이 물들었음. 이 영역(대략적인 위치)에 있는 피부색 톤은
    // 색 변경 대상에서 아예 제외해서 얼굴은 항상 기본 살색 그대로 있게 함.
    // skinGlobal: 상의/하의는 소매/밑단 밖으로 나온 손목·발목이 같은 그림에 그려져 있어서 위치를 특정하기
    // 어려움 -> 위치 상관없이 피부색 톤이면 전부 색 변경 대상에서 제외.
    // v1.100.16: 피부와 헤어 하이라이트의 색상(H)만으로는 구분이 거의 안 돼서(둘 다 따뜻한 갈색) 채도/명도까지
    // 좁게 잡음 - 실측해보니 맨살은 채도 0.2~0.5, 명도 0.42~0.66 범위에 몰려있고, 헤어는 반짝이는 하이라이트(채도 높음)
    // 나 그림자(명도 낮음) 쪽으로 벗어나 있어서 이 범위로 어느정도 구분됨
    const isSkinPix = (h, s, l) => h >= 1 && h <= 45 && s >= 0.15 && l >= 0.4 && l <= 0.97;
    // v1.100.21: 상의/하의 skinGlobal용 - 위 기준을 그대로 쓰면 크림색/베이지색 원단이 전부 "피부"로
    // 오인식돼서(채도/명도가 겹침) 옷 전체가 색 변경에서 제외되는 버그가 있었음(일부 상의가 색이 전혀 안 바뀜).
    // 실측해보니 손목/목 피부는 채도 0.35~0.65, 명도 0.45~0.75 범위로 더 좁게 몰려있어서 이 범위로 구분함.
    const isSkinPixGarment = (h, s, l) => h >= 1 && h <= 35 && s >= 0.35 && s <= 0.65 && l >= 0.45 && l <= 0.75;
    // v1.100.17: excludeBand는 {x0,x1,y0,y1} 사각 범위, 또는 {poly:[[x,y],...]} 다각형(손으로 딴 얼굴 윤곽) 둘 다 지원
    const pointInPoly = (x, y, poly) => {
      let inside = false;
      for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
        const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
      }
      return inside;
    };
    const inExclude = (p) => {
      if (!excludeBand) return false;
      const x = (p % W) / W, y = Math.floor(p / W) / W;
      if (excludeBand.poly) return pointInPoly(x, y, excludeBand.poly);
      return x >= excludeBand.x0 && x <= excludeBand.x1 && y >= excludeBand.y0 && y <= excludeBand.y1;
    };
    const buckets = {};
    for (let p = 0; p < W * W; p++) {
      const i = p * 4;
      if (px[i + 3] < 128) continue;
      const [h, s, l] = rgb2hsl(px[i] / 255, px[i + 1] / 255, px[i + 2] / 255);
      if (s < .15 || l < .08 || l > .95) continue;
      if (skinGlobal && isSkinPixGarment(h, s, l)) continue;
      if (maskPx ? isMaskProtect(p) : (inExclude(p) && isSkinPix(h, s, l))) continue;
      const hb = Math.round(h / 10) * 10;
      (buckets[hb] = buckets[hb] || { count: 0 }).count++;
    }
    let domHue = 25, bestCount = -1;
    for (const hb in buckets) if (buckets[hb].count > bestCount) { bestCount = buckets[hb].count; domHue = +hb; }
    const TOL = 28;
    const SWATCH_SAT = 0.58; // 색상표를 고르면 원래 옷 색과 상관없이 이 채도로 "그 색 그대로" 맞춰줌(절대색 지정)
    for (let p = 0; p < W * W; p++) {
      const i = p * 4;
      if (px[i + 3] < 10) continue;
      const [h, s, l] = rgb2hsl(px[i] / 255, px[i + 1] / 255, px[i + 2] / 255);
      if (skinGlobal && isSkinPixGarment(h, s, l)) continue; // 손/발 피부색은 항상 원본 그대로 보존
      if (maskPx ? isMaskProtect(p) : (inExclude(p) && isSkinPix(h, s, l))) continue; // 얼굴 피부 영역은 원본 그대로 보존
      let diff = Math.abs(h - domHue); if (diff > 180) diff = 360 - diff;
      // wholeImage(상의/하의): 원래 어떤 색이든 상관없이 이미지 전체를 색상표 색으로 맞춤(지배색 범위 제한 없음)
      // 그 외(헤어 등): 기존처럼 지배색과 비슷한 범위(TOL)만 색상 변경, 리본 등 다른 색 소품은 보존
      if (wholeImage || (s >= .08 && diff <= TOL)) {
        let R, G, B;
        if (gray) {
          let nl;
          if (gray >= 75) {
            // 흰색 / 은발 (445 / 460): 부드러운 은회색 음영(0.40)과 빛나는 하이라이트(0.97)를 보존하여 실루엣 뭉개짐 방지
            const factor = Math.min(1, Math.max(0, (gray - 75) / 25));
            const minL = 0.25 + 0.15 * factor;
            const maxL = 0.75 + 0.22 * factor;
            nl = minL + Math.pow(l, 0.8) * (maxL - minL);
          } else if (gray <= 25) {
            // 검정 / 흑발 (361): 완전한 검은 실루엣(#000)이 되지 않도록 찰랑이는 광택과 톤 깊이 보존
            const factor = Math.min(1, Math.max(0, (25 - gray) / 24));
            const minL = 0.12 - 0.04 * factor;
            const maxL = 0.45 - 0.10 * factor;
            nl = minL + Math.pow(l, 1.3) * (maxL - minL);
          } else {
            // 회색 (430): 중간 톤 자연스러운 명암
            const tG = (gray - 25) / 50;
            const minL = 0.12 + 0.13 * tG;
            const maxL = 0.45 + 0.30 * tG;
            nl = minL + l * (maxL - minL);
          }
          nl = Math.max(0, Math.min(1, nl));
          [R, G, B] = hsl2rgb(h, 0, nl);
        } else {
          const lShow = wholeImage ? l * 0.623 : l;
          const sShow = wholeImage ? 0.80 : SWATCH_SAT;
          [R, G, B] = hsl2rgb(hueDeg, sShow, lShow);
        }
        px[i] = Math.round(R * 255); px[i + 1] = Math.round(G * 255); px[i + 2] = Math.round(B * 255);
      }
    }
    oc.putImageData(data, 0, 0);
    HAIR_RECOLOR_CACHE[key] = off;
    return off;
  }
  // 뒷면 하의(bottom_back) 세트는 원본 그림시트 순서가 정면과 어긋나 있어(+8칸 회전),
  // 선택한 하의 번호(1~15)를 실제 파일 번호로 보정해줘야 정면에서 고른 옷이 뒷면에서도 같은 옷으로 보인다.
  function remapBottomBack(idx) {
    if (typeof idx !== 'number') return idx; // 커스텀 업로드('c0' 등)는 그대로
    return ((idx - 1 + 7) % 15) + 1; // v1.99.1: 공식 오프바이원 수정
  }
  // 걷기 애니메이션: 그림 자체를 다리/팔로 자르진 않고, 캔버스에서 절반씩 잘라(clip)
  // 엉덩이/어깨를 축으로 반대쪽으로 살짝 돌려서 걷는 느낌을 낸다 (그림은 하나지만 가위처럼 좌우로 나눠 회전)
  // v1.100.1: 이전 방식(고정된 창으로 자르고 그림 전체를 회전)은 회전할 때 반대쪽 다리가 창 안으로
  // 밀려들어와 다리가 4개로 보이는 버그가 있었음. 이제는 아예 반쪽만 들어있는 그림을 따로 만들어두고
  // (반대쪽은 투명하게 지움) 그 반쪽짜리 그림을 통째로 돌려서, 회전해도 다른 쪽 다리가 섞여 들어오지 않는다.
  const SPLIT_HALF_CACHE = {};
  const SPLIT_HALF_SIZE = 256;
  function getHalfImg(cacheKey, img, isLeftHalf) {
    const key = cacheKey + ':' + (isLeftHalf ? 'L' : 'R');
    const cached = SPLIT_HALF_CACHE[key];
    if (cached) return cached;
    const S = SPLIT_HALF_SIZE;
    let off;
    try {
      off = document.createElement('canvas'); off.width = S; off.height = S;
      const oc = off.getContext('2d');
      oc.drawImage(img, 0, 0, S, S);
      if (isLeftHalf) oc.clearRect(S / 2, 0, S / 2, S);
      else oc.clearRect(0, 0, S / 2, S);
    } catch (e) { return null; } // 캔버스 오염 등으로 실패하면 분할 없이 원본으로 대체됨
    SPLIT_HALF_CACHE[key] = off;
    return off;
  }
  // v1.100.2: 회전 대신 위아래로 살짝 이동시키는 방식으로 변경.
  // (정면/뒷면에서 다리를 옆으로 돌리면 실제 걸음과 다르게 보인다는 피드백 반영 - 한쪽 다리/팔이
  //  무릎 굽히듯 살짝 올라가고 반대쪽은 바닥을 딛듯 내려가는 식의 "제자리걸음" 느낌으로 교체)
  function drawSplitPart(c, img, p, hueDeg, mirror, offL, offR, cacheKey) {
    const dx = mirror ? -(p.x + p.size) : p.x;
    const S = SPLIT_HALF_SIZE;
    const half = (isLeftHalf, off) => {
      const halfImg = getHalfImg(cacheKey, img, isLeftHalf);
      c.save();
      if (mirror) c.scale(-1, 1);
      if (off) c.translate(0, off);
      if (hueDeg) c.filter = 'hue-rotate(' + hueDeg + 'deg)';
      if (halfImg) c.drawImage(halfImg, 0, 0, S, S, dx, p.y, p.size, p.size);
      else c.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, dx, p.y, p.size, p.size);
      c.restore();
    };
    half(true, offL);
    half(false, offR);
  }

  // 팔 흔들기: 상의는 몸통(가슴)과 소매가 한 그림으로 이어져 있어 정가운데를 반으로 가르면 몸통이
  // 갈라져 보인다. 그래서 가운데(몸통)는 그대로 고정해두고, 양쪽 바깥쪽 소매 부분만 따로 떼어내
  // 어깨를 축으로 반대 방향으로 살짝 돌려서 팔을 흔드는 것처럼 보이게 한다.
  function getBandImg(cacheKey, img, band) { // band: 'L'(왼쪽 소매) | 'C'(가운데 몸통, 고정) | 'R'(오른쪽 소매)
    const key = cacheKey + ':band:' + band;
    const cached = SPLIT_HALF_CACHE[key];
    if (cached) return cached;
    const S = SPLIT_HALF_SIZE;
    const B1 = S * 0.34, B2 = S * 0.66;
    let off;
    try {
      off = document.createElement('canvas'); off.width = S; off.height = S;
      const oc = off.getContext('2d');
      oc.drawImage(img, 0, 0, S, S);
      if (band === 'L') oc.clearRect(B1, 0, S - B1, S);
      else if (band === 'R') oc.clearRect(0, 0, B2, S);
      else { oc.clearRect(0, 0, B1, S); oc.clearRect(B2, 0, S - B2, S); }
    } catch (e) { return null; }
    SPLIT_HALF_CACHE[key] = off;
    return off;
  }
  // v1.100.5: 소매를 어깨 축으로 "돌리면"(rotate) 아래쪽이 좌우로 벌어져 보여 팔이 찢어진 것처럼
  // 보인다는 피드백 반영 - 다리(drawSplitPart)와 같은 방식으로, 돌리지 않고 위아래로만 살짝 이동시켜
  // 제자리걸음처럼 앞뒤로 흔드는 느낌을 낸다. 가운데(몸통)는 항상 고정.
  function drawArmSplit(c, img, p, hueDeg, mirror, offL, offR, cacheKey) {
    const dx = mirror ? -(p.x + p.size) : p.x;
    const S = SPLIT_HALF_SIZE;
    const band = (which, off) => {
      const bimg = getBandImg(cacheKey, img, which);
      c.save();
      if (mirror) c.scale(-1, 1);
      if (off) c.translate(0, off);
      if (hueDeg) c.filter = 'hue-rotate(' + hueDeg + 'deg)';
      if (bimg) c.drawImage(bimg, 0, 0, S, S, dx, p.y, p.size, p.size);
      else c.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, dx, p.y, p.size, p.size);
      c.restore();
    };
    band('C', 0);
    band('L', offL);
    band('R', offR);
  }
  // v1.100.12: 0~360=색상회전, 361~460=무채색(검정~회색~흰색) - 캔버스 픽셀조작 없이 CSS filter만으로
  // 쓰는 곳(현재는 얼굴)을 위한 버전. 하의/상의/헤어는 getPartRecolorCanvas(픽셀 단위)를 씀.
  function hueFilterCss(hueDeg) {
    hueDeg = Math.max(0, Math.min(460, Math.round(hueDeg || 0)));
    if (!hueDeg) return 'none';
    if (hueDeg <= 360) return 'hue-rotate(' + hueDeg + 'deg)';
    const gray = hueDeg - 360;
    const bright = gray <= 50 ? (gray / 50) : (1 + (gray - 50) / 50 * 2);
    return 'grayscale(1) brightness(' + bright + ')';
  }
  // v1.102: 색상값(0~460)을 원화가 파일명 색상접미사로 변환.
  // 361(검정), 430(회색), 445/460(흰색)이 % 360으로 지워져서 art 폴더를 못 찾던 문제 해결.
  function getArtColorName(hue) {
    if (!hue) return null;
    const h = Math.round(hue);
    if (h >= 361 && h <= 399) return 'black'; // 361 = 검정
    if (h >= 400 && h <= 435) return 'gray';  // 430 = 연회색
    if (h >= 436 && h <= 465) return 'white'; // 445 / 460 = 흰색
    const modH = Math.round(((h % 360) + 360) % 360);
    if (modH === 350) return 'red';
    if (modH === 28) return 'orange';
    if (modH === 55) return 'yellow';
    if (modH === 125) return 'green';
    if (modH === 195) return 'sky';
    if (modH === 225) return 'blue';
    if (modH === 270) return 'purple';
    if (modH === 320) return 'pink';
    return null;
  }
    function drawMyChar2(c, o, realDir, faceBack, moving, t, isSit) {
    // 위로(카메라에서 멀어지는 방향) 대각선 전용 그림은 받지 못해서, 가장 가까운 대체로 뒷면을 사용
    const effDir = (realDir === 3 && faceBack) ? 1 : realDir;
    const suffix = DIR_SUFFIX[effDir]; // 1:'back' 2:'side' 3:'diag', 정면(0)이면 undefined
    const hairCat = suffix ? ('hair_' + suffix) : 'hair';
    const topCat = suffix ? ('top_' + suffix) : 'top';
    const botCat = suffix ? ('bottom_' + suffix) : 'bottom';
    const botIdx = botCat === 'bottom_back' ? remapBottomBack(o.pBottom) : o.pBottom;
    const hairImg = getPart2Img(hairCat, o.pHair);
    const topImg = getPart2Img(topCat, o.pTop);
    const botImg = getPart2Img(botCat, botIdx);
    if (!(hairImg.complete && hairImg.naturalWidth && topImg.complete && topImg.naturalWidth && botImg.complete && botImg.naturalWidth)) return false;
    // v1.100.7: 정면에서는 헤어 그림 가운데가 얼굴 모양으로 비어있어서, 그 안에 보일 얼굴(눈/코/입)을
    // 헤어보다 먼저 그려준다. 옆/뒤/대각선용 얼굴 그림은 아직 없어서 정면에서만 그림.
    const faceImg = (effDir === 0) ? getPart2Img('face', o.pFace) : null;
    // 옆면/대각선 그림은 원본이 왼쪽을 바라보게 그려져 있어, 기존 벡터 캐릭터(오른쪽 기준) 규칙과 맞추려면
    // 가로로 한 번 뒤집어줘야 조이스틱 좌/우 이동 시 보는 방향이 올바르게 나온다.
    const mirror = (effDir === 2 || effDir === 3);
    const put = (img, p, hueDeg, w, h) => {
      c.save();
      if (mirror) c.scale(-1, 1);
      const dx = mirror ? -(p.x + p.size) : p.x;
      if (hueDeg) c.filter = 'hue-rotate(' + hueDeg + 'deg)';
      c.drawImage(img, 0, 0, w || img.naturalWidth, h || img.naturalHeight, dx, p.y, p.size, p.size);
      c.restore();
    };
    // 옆면/대각선: 다리 두 개가 한 그림에 겹쳐 있어 반으로 가를 수 없으니, 그림 전체를 엉덩이/어깨
    // 축으로 통째로 살짝 돌려서 걷는 느낌을 낸다 (실제 걷기는 프로필에서 다리/팔이 앞뒤로 흔들리는 것처럼 보임)
    const putRot = (img, p, hueDeg, pivotYFrac, angle) => {
      c.save();
      if (mirror) c.scale(-1, 1);
      const dx = mirror ? -(p.x + p.size) : p.x;
      if (angle) {
        const pivotX = dx + p.size / 2, pivotY = p.y + p.size * pivotYFrac;
        c.translate(pivotX, pivotY); c.rotate(angle); c.translate(-pivotX, -pivotY);
      }
      if (hueDeg) c.filter = 'hue-rotate(' + hueDeg + 'deg)';
      c.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, dx, p.y, p.size, p.size);
      c.restore();
    };
    const tbl = suffix ? POS_TABLES[suffix] : null;
    const topXY = tbl ? (tbl.top[o.pTop] || P2.top) : (TOP_POS[o.pTop] || P2.top);
    const botXY = tbl ? (tbl.bottom[botIdx] || P2.bottom) : (BOTTOM_POS[botIdx] || P2.bottom);
    const hairXY = suffix ? (tbl.hair[o.pHair] || P2.hair) : (HAIR_POS[o.pHair] || P2.hair);
    const topPos = { size: P2.top.size, x: topXY.x, y: topXY.y };
    const botPos = { size: P2.bottom.size, x: botXY.x, y: botXY.y + 3 };  // 발이 그림자에 닿도록 3px 아래
    const hairDrawPos = { size: P2.hair.size, x: hairXY.x, y: hairXY.y };

    // ---- 걷기 모션 계산 (기존 벡터 캐릭터의 걸음걸이 리듬을 그대로 재사용) ----
    const canWalk = !isSit;
    const walkT = moving && canWalk ? t * 9 : 0;
    const sideView = (effDir === 2 || effDir === 3);
    // v1.100.6: 옆면/대각선도 정면/뒷면과 똑같은 방식(회전이 아니라 위아래 이동)으로 걷게 해달라는
    // 피드백 반영 - 방향 구분 없이 모두 같은 걸음 로직을 사용한다.
    const bob = moving && canWalk ? Math.abs(Math.sin(walkT)) * 2.8 : Math.sin(t * 2) * .5;
    const stepAmp = moving && canWalk ? 1.3 : 0;
    const legStepL = stepAmp ? Math.sin(walkT) * stepAmp : 0;
    const legStepR = -legStepL;
    const armBandAmp = moving && canWalk ? 1.0 : 0;
    const armBandL = armBandAmp ? -Math.sin(walkT) * armBandAmp : 0; // 반대쪽(오른쪽) 다리와 같은 위상
    const armBandR = -armBandL;

    if (!moving && !isSit) c.rotate(.012);  // 약 0.7도 오른쪽 기울임
    c.save();
    c.translate(0, -bob);
    // v1.100.12: 상/하의는 기존엔 그림 전체(옷+팔다리 피부)에 hue-rotate를 걸어서 팔다리까지 같이
    // 물들었음 - 헤어처럼 "그림에서 가장 많이 쓰인 옷 색"만 찾아 그 색만 바꾸는 방식으로 교체.
    // v1.100.14: 목 색상이 얼굴을 따라가게 했던 기능은 상의/하의 구분 오류로 취소 요청 - 원래대로 옷 색만 적용
    // v1.100.27: 상의 "빨간색"은 원화가님이 직접 그린 빨간 버전 원본 그림(top_red_NN)이 있으면
    // 알고리즘 변환(색상 계산) 대신 그 그림을 그대로 사용 - 자켓 안의 흰 속옷처럼 "일부러 안 물들인" 디자인
    // 의도가 100% 그대로 보존됨(알고리즘은 피부만 빼고 전부 물들여서 이런 의도적 배색을 못 살림).
    // v1.100.30: 이제 11가지 색상 전부(빨/주/노/초/하늘/파/보라/핑크/흰/회/검) x 4방향(정면/대각선/옆면/뒷면)
    // 원화가님 원본 그림이 있으면 그걸 그대로 사용. 폴더가 없는 조합(예: 옆면 일부 색상 - 아직 작업중)은
    // 자동으로 기존 계산식으로 대체됨(이미지 로드 실패 시 .complete/.naturalWidth가 false이기 때문).
    const TOP_ART_COLOR = getArtColorName(o.pTopHue);
    let topRecolor = null;
    let topUsedArt = false;
    if (TOP_ART_COLOR && typeof o.pTop === 'number') {
      const topArtRaw = getPart2Img(topCat + '_' + TOP_ART_COLOR, o.pTop);
      if (topArtRaw && topArtRaw.complete && topArtRaw.naturalWidth) { topRecolor = topArtRaw; topUsedArt = true; }
    }
    if (!topRecolor) topRecolor = o.pTopHue ? getPartRecolorCanvas(topCat + '_' + o.pTop, topImg, o.pTopHue, null, true, true) : null;
    // v1.100.39: 하의도 상의와 똑같은 방식으로 11가지 색상 원화가님 원본 그림(bottom_red_NN 등)이
    // 있으면 알고리즘 변환 대신 그 그림을 그대로 사용 (정면/뒷면/옆면/대각선 4방향 전부 작업 완료)
    const BOTTOM_ART_COLOR = getArtColorName(o.pBottomHue);
    let botRecolor = null;
    let botUsedArt = false;
    if (BOTTOM_ART_COLOR && typeof botIdx === 'number') {
      const botArtRaw = getPart2Img(botCat + '_' + BOTTOM_ART_COLOR, botIdx);
      if (botArtRaw && botArtRaw.complete && botArtRaw.naturalWidth) { botRecolor = botArtRaw; botUsedArt = true; }
    }
    if (!botRecolor) botRecolor = o.pBottomHue ? getPartRecolorCanvas(botCat + '_' + botIdx, botImg, o.pBottomHue, null, true, true) : null;
    const botSrc = botRecolor || botImg;
    const topSrc = topRecolor || topImg;
    const botSliceKey = botCat + '_' + botIdx + (botUsedArt ? ':art' + BOTTOM_ART_COLOR : (o.pBottomHue ? ':h' + o.pBottomHue : ''));
    const topSliceKey = topCat + '_' + o.pTop + (topUsedArt ? ':art' + TOP_ART_COLOR : (o.pTopHue ? ':h' + o.pTopHue : ''));
    drawSplitPart(c, botSrc, botPos, 0, mirror, legStepL, legStepR, botSliceKey);
    drawArmSplit(c, topSrc, topPos, 0, mirror, armBandL, armBandR, topSliceKey);
    if (faceImg && faceImg.complete && faceImg.naturalWidth) {
     const fOff = FACE_POS[o.pFace] || { x: 0, y: 0 };
     const sizeFix = (P2.hair.size - FACE_SIZE) / 2;   // 중심축 맞춤 보정
     c.drawImage(faceImg, 
       FACE_BASE.x + fOff.x + sizeFix, 
       FACE_BASE.y + fOff.y + sizeFix, 
       FACE_SIZE, FACE_SIZE);
    }
    // v1.100.15: 옆면/대각선은 얼굴이 헤어 그림에 같이 그려져 있어 그 부분만 색상 변경에서 제외
    // v1.100.16: 피부색과 헤어 하이라이트 갈색이 색상 수치상 거의 구분이 안 돼서(둘 다 따뜻한 갈색톤) 박스를 넓게
    // 잡으면 뺨 주변 헤어까지 같이 보호돼서 빨갛게 안 변했음 -> 눈/코/뺨 중심부만 좁게 잡아 헤어는 최대한 다 색이 바뀌게 함
    // v1.100.17: 헤어1은 그림을 보고 손으로 얼굴/귀/목 윤곽을 다각형으로 직접 땄음(가장 정확함) - 나머지 14종은
    // 헤어마다 그림 속 얼굴 위치가 조금씩 달라서(손그림 편차) 아직 사각 범위로 대략 보호함
    const HAIR_FACE_POLY1 = effDir === 2 ? [
        [0.31, 0.33], [0.40, 0.31], [0.47, 0.33], [0.51, 0.36], [0.57, 0.39], [0.60, 0.46],
        [0.55, 0.50], [0.49, 0.55], [0.43, 0.59], [0.36, 0.615], [0.30, 0.615], [0.275, 0.58],
        [0.27, 0.50], [0.29, 0.44], [0.28, 0.38], [0.30, 0.34],
      ] : effDir === 3 ? [
        [0.33, 0.485], [0.40, 0.478], [0.47, 0.478], [0.50, 0.485], [0.52, 0.50], [0.50, 0.52],
        [0.49, 0.57], [0.46, 0.62], [0.40, 0.65], [0.33, 0.645], [0.295, 0.60], [0.295, 0.50],
        [0.305, 0.49],
      ] : null;
    const HAIR_FACE_BOX = effDir === 2 ? { x0: 0.31, x1: 0.47, y0: 0.40, y1: 0.66 }
      : effDir === 3 ? { x0: 0.38, x1: 0.56, y0: 0.50, y1: 0.68 } : null; // effDir 3은 항상 정면쪽 대각선(뒷모습 대각선은 effDir 1로 이미 처리됨)
    const HAIR_FACE_EXCLUDE = (o.pHair === 1 && HAIR_FACE_POLY1) ? { poly: HAIR_FACE_POLY1 } : HAIR_FACE_BOX;
    // v1.100.22: 옆면/대각선 15종 전부 정밀 마스크(색상 샘플 비교로 미리 생성)가 준비되어 있으면 그걸 사용,
    // 없으면(혹시 모를 예외 상황) 기존 다각형/사각형 방식으로 대체
    const hairMaskImgRaw = (effDir === 1) ? getPart2Img('hair_back_mask', o.pHair)
      : (effDir === 2) ? getPart2Img('hair_side_mask', o.pHair)
      : (effDir === 3) ? getPart2Img('hair_diag_mask', o.pHair) : null;
    // 마스크 그림은 비동기로 로드되므로, 아직 로딩 전이면 이번 프레임은 기존 방식으로 대체(캐시 키가
    // 마스크 유무로 갈리므로, 로딩 완료 후 다음 프레임에서 자동으로 정밀 마스크로 다시 계산됨)
    const hairMaskImg = (hairMaskImgRaw && hairMaskImgRaw.complete && hairMaskImgRaw.naturalWidth) ? hairMaskImgRaw : null;
    // v1.100.32: 헤어1은 손으로 딴 다각형이 있어 마스크 없이도 항상 정확하지만, 나머지 14종은 사각형 대체
    // 방식이 얼굴 위치를 정확히 못 맞춰서(스타일마다 얼굴 위치가 조금씩 다름) 보호가 헐거워 얼굴/목이
    // 같이 물드는 경우가 있었음(특히 마을 화면처럼 그림이 많이 몰려 로딩이 밀릴 때 자주 보임).
    // -> 정밀 마스크가 아직 로딩 전이면(사각형으로 대충 보호하지 말고) 이번 프레임은 아예 색을 입히지
    // 않고 원래 헤어색 그대로 보여줌(얼굴은 절대 안 물듦) - 마스크는 보통 한 프레임 안에 로딩 완료되므로
    // 거의 바로 정확한 색으로 자동 전환됨
    const hairColorNeedsMask = (effDir === 2 || effDir === 3) && o.pHair !== 1;
    const hairRecolor = (o.pHairHue && !(hairColorNeedsMask && !hairMaskImg)) ? getPartRecolorCanvas(hairCat + '_' + o.pHair, hairImg, o.pHairHue, HAIR_FACE_EXCLUDE, false, false, hairMaskImg) : null;
    c.save();
    if (mirror) c.scale(-1, 1);
    const hdx = mirror ? -(hairDrawPos.x + hairDrawPos.size) : hairDrawPos.x;
    if (hairRecolor) c.drawImage(hairRecolor, 0, 0, HAIR_RC_SIZE, HAIR_RC_SIZE, hdx, hairDrawPos.y, hairDrawPos.size, hairDrawPos.size);
    else c.drawImage(hairImg, hdx, hairDrawPos.y, hairDrawPos.size, hairDrawPos.size);
    c.restore();
    if (o.pAcc && realDir === 0) { // 소품(커스텀 업로드 전용)은 정면 이미지만 있음
      const accImg = getPart2Img('acc', o.pAcc);
      if (accImg.complete && accImg.naturalWidth) put(accImg, P2.acc);
    }
    c.restore();
    return true;
  }

  // v1.100.42: 직원(펫샵/펫카페/펫병원/농장 등) 전용 2단 캐릭터 시스템 - 머리(staffHead) + 상하의
  // 통합 한 장(staffOutfit)으로 구성. 플레이어 캐릭터(헤어/상의/하의 3단, 번호별 미세 위치 보정 필요)와
  // 달리, 원화가님이 머리와 옷을 처음부터 같은 프레임에 맞춰 그려주셔서(정면/뒷면/옆면 전부 확인)
  // 번호(1~30)별 보정 없이 똑같은 위치/크기 하나로 겹쳐 그리면 자연스럽게 맞는다.
  // 대각선(diag)은 원화가 제공 그림이 없어 옆면(side) 그림을 그대로 재사용.
  // v1.100.43: 몸이 너무 크고 머리가 몸에 파묻혀 보인다는 피드백 반영 - 머리+몸 전체를 30% 축소하고
  // (발 위치는 그대로 유지되도록 축소 기준점을 발쪽으로 맞춤), 머리만 따로 살짝 위로 띄워서 목이
  // 자연스럽게 분리돼 보이도록 함. (처음엔 "머리 크기만큼"(100%) 그대로 띄웠더니 머리가 몸에서
  // 완전히 동떨어져 공중에 뜬 것처럼 보여서, 적당한 목 간격만 생기도록 22%로 줄임)
  // v1.100.44: 스샷 확인 후 추가 미세조정 1차 - 머리 위로 10, 몸 위로 4
  // v1.100.45: 2차 미세조정 - "지금 상태에서" 추가로: 몸 크기 10% 증가 + 위로 5 더, 머리 위로 8 더
  // (머리 크기는 그대로 두고 몸만 커짐 - 머리/몸이 서로 다른 크기를 가질 수 있어 각자 중심을 따로 계산)
  // v1.100.49: "직원 크기 10% 줄여줘" - 기존 비율(머리 30%축소, 몸은 거기서 10%업)은 유지한 채
  // 전체적으로 한번 더 10% 축소. STAFF_FOOT_Y 기준으로 y를 역산하는 공식이라 크기만 줄여도
  // 발 위치는 자동으로 그대로 유지됨.
  const STAFF_HEAD_SIZE = 95.26 * 0.7 * 0.9; // 머리 크기는 1차 조정(30% 축소) 이후 그대로 유지 + 이번에 10% 추가 축소
  const STAFF_BODY_SIZE = STAFF_HEAD_SIZE * 1.10; // 몸은 거기서 10% 더 키움
  const STAFF_FOOT_Y = -87.25 + 95.26; // = 8.01, 맨 처음 발이 바닥에 닿던 기준선(변치 않는 기준점)
  // v1.100.46: 3차 미세조정 - 얼굴(머리) 위로 4 더.
  // 그리고 "정면과 뒷/옆모습 발 위치가 다르다"는 질문 - 원화가님 원본 그림이 방향마다 캔버스 안에서
  // 발/옷자락까지 포함된 여백 비율이 살짝 달라서(정면은 그림이 캔버스 맨 아래까지 꽉 차있고, 뒷면/옆면은
  // 발밑에 여백이 조금 더 있음) 코드에서 똑같은 위치에 그려도 실제 발 높이가 미세하게 달라 보였음.
  // -> 방향별로 측정한 여백 차이(뒷면 약 4.6, 옆면/대각선 약 3.9 게임단위)만큼 아래로 보정해서
  // 네 방향 모두 발이 같은 바닥선에 맞도록 함.
  // v1.100.50: "직원들이 바닥에 둥둥 떠다녀요" - 그림자를 보이게 고치고 나서야 드러난 문제.
  // 그동안 스샷만 보고 "머리/몸 위로 올려줘" 요청을 여러 번 누적 적용하다 보니(몸 위로4+5=9,
  // 머리 위로8+4=12) 발이 실제 그림자(땅바닥) 위치보다 위에 떠버렸음. 머리-몸 사이 간격(비율)은
  // 그대로 유지하면서, 몸 전체를 다시 아래로 내려서 발이 그림자와 만나는 원래 접지선으로 복귀시킴
  // (몸을 8만큼 내리면 머리도 같이 내려와서 머리-몸 간격은 그대로 유지됨)
  const STAFF_BODY_Y_ADJ = -1; // 몸: 발이 그림자(+7) 위치에 오도록 거의 원래 접지선 그대로
  const STAFF_HEAD_Y_ADJ = -8 + -4; // 머리: 몸 기준 상대적 간격은 그대로 유지 (몸이 내려가면 같이 내려감)
  const STAFF_BODY_X = -STAFF_BODY_SIZE / 2;
  const STAFF_HEAD_X = -STAFF_HEAD_SIZE / 2;
  const STAFF_BODY_Y = STAFF_FOOT_Y - STAFF_BODY_SIZE + STAFF_BODY_Y_ADJ;
  const STAFF_HEAD_Y = STAFF_BODY_Y - STAFF_HEAD_SIZE * 0.22 + STAFF_HEAD_Y_ADJ;
  const STAFF_BODY_POS = { size: STAFF_BODY_SIZE, x: STAFF_BODY_X, y: STAFF_BODY_Y };
  const STAFF_HEAD_POS = { size: STAFF_HEAD_SIZE, x: STAFF_HEAD_X, y: STAFF_HEAD_Y };
  const STAFF_FOOT_CORR = { back: 4.6, side: 3.9, diag: 3.9 }; // 방향별 발밑 여백 차이 보정값 (게임단위, 아래로 이동)
  // v1.100.47: 정면은 머리 위치가 이미 딱 맞다고 확인됨 -> 정면은 그대로 두고,
  // 뒷모습/옆모습(대각선 포함)만 머리를 4 더 위로 올림 (정면과 별도로 방향별 보정)
  const STAFF_HEAD_EXTRA_UP = { back: 4, side: 4, diag: 4 }; // 방향별 머리 추가 상향 (게임단위)
  function drawStaffChar(c, o, realDir, faceBack, moving, t, isSit) {
    const effDir = (realDir === 3 && faceBack) ? 1 : realDir;
    const suffix = DIR_SUFFIX[effDir]; // 1:'back' 2:'side' 3:'diag', 정면(0)이면 undefined
    const headCat = suffix ? ('staffhead_' + suffix) : 'staffhead';
    const outfitCat = suffix ? ('staffoutfit_' + suffix) : 'staffoutfit';
    const headImg = getPart2Img(headCat, o.staffHead);
    const outfitImg = getPart2Img(outfitCat, o.staffOutfit);
    if (!(headImg.complete && headImg.naturalWidth && outfitImg.complete && outfitImg.naturalWidth)) return false;
    const mirror = (effDir === 2 || effDir === 3);
    const footCorr = (suffix && STAFF_FOOT_CORR[suffix]) || 0;
    const headExtraUp = (suffix && STAFF_HEAD_EXTRA_UP[suffix]) || 0;
    const bodyPos = footCorr ? { size: STAFF_BODY_POS.size, x: STAFF_BODY_POS.x, y: STAFF_BODY_POS.y + footCorr } : STAFF_BODY_POS;
    const headPos = (footCorr || headExtraUp) ? { size: STAFF_HEAD_POS.size, x: STAFF_HEAD_POS.x, y: STAFF_HEAD_POS.y + footCorr - headExtraUp } : STAFF_HEAD_POS;

    const canWalk = !isSit;
    const walkT = moving && canWalk ? t * 9 : 0;
    const bob = moving && canWalk ? Math.abs(Math.sin(walkT)) * 2.8 : Math.sin(t * 2) * .5;
    const stepAmp = moving && canWalk ? 1.3 : 0;
    const legStepL = stepAmp ? Math.sin(walkT) * stepAmp : 0;
    const legStepR = -legStepL;

    c.save();
    c.translate(0, -bob);
    // 옷(몸통+다리 통합 한 장)은 기존 하의와 같은 방식(좌우 반씩 잘라 위아래로 살짝 흔들기)으로 제자리걸음 효과
    drawSplitPart(c, outfitImg, bodyPos, 0, mirror, legStepL, legStepR, outfitCat + '_' + o.staffOutfit);
    c.save();
    if (mirror) c.scale(-1, 1);
    const hdx = mirror ? -(headPos.x + headPos.size) : headPos.x;
    c.drawImage(headImg, hdx, headPos.y, headPos.size, headPos.size);
    c.restore();
    c.restore();
    return true;
  }

  // v1.100.53: 마을 사람(town.js의 'vil' 타입) + 손님/카페손님/병원환자 등 ART.randomHuman() NPC 전용 -
  // 머리/몸을 나누지 않은 전신 PNG 1장. 직원(drawStaffChar)과 달리 머리+몸이 이미 한 장에 합쳐진
  // 그림이라 이미지 1장만 비율에 맞게 그리면 됨.
  // v1.100.55: 머리(목 윗부분)와 몸통(목 아랫부분)을 나누어 머리는 축소(HEAD_SCALE), 몸통/다리는
  // 확대(BODY_H_SCALE)해서 키/비율을 조정하고, 목 겹침(8px)으로 틈새 없이 연결.
  // v1.100.56: 발 그림자 중심 정렬용 캐릭터별 발 X 보정 테이블, 걷기 bob+tilt 애니메이션 추가.
  // v1.100.57: "마을 사람들 png파일을 다시 그렸어. 정면/뒷면/옆면/대각선 4종류로 했어." - 원화가 새로
  // 그린 4방향(정면/뒷면/옆면/대각선) 30종으로 교체. 대각선은 더 이상 옆면을 재사용하지 않고 전용
  // 그림을 사용. 새 그림은 캔버스 안에서 차지하는 영역이 훨씬 커지고(예전엔 캔버스의 절반 정도,
  // 지금은 캔버스 대부분) 위치도 달라져서 bbox/목선/발 보정값을 새로 측정해서 교체함.
  const TOWNCHAR_BBOX = {
    front: { top: 88, bottom: 472 },
    back: { top: 88, bottom: 474 },
    side: { top: 87, bottom: 472 },
    diag: { top: 55, bottom: 509 },
  };
  // 목선 위치는 각 방향 bbox의 절반 지점(= 기존 예전 그림에서 확인된 "머리가 키의 절반" 비율을 그대로 적용)
  const TOWNCHAR_NECK_FRAC = 0.5;
  const TOWNCHAR_FOOT_X = {
    front: { 1: 2.5, 2: 2.0, 3: 4.0, 4: 2.5, 5: 2.0, 6: 3.5, 7: 2.5, 8: 3.0, 9: 3.0, 10: 1.5, 11: 3.5, 12: 3.0, 13: 3.0, 14: 2.5, 15: 3.0, 16: 2.0, 17: 1.5, 18: 1.5, 19: 2.5, 20: 1.5, 21: 3.5, 22: 2.5, 23: 3.5, 24: 3.5, 25: 2.0, 26: 3.0, 27: 3.0, 28: 2.0, 29: 3.0, 30: 3.0 },
    back: { 1: 2.5, 2: 1.0, 3: 1.5, 4: 2.0, 5: 2.0, 6: 3.5, 7: 3.0, 8: 3.0, 9: 2.0, 10: 2.5, 11: 4.0, 12: 4.0, 13: 1.0, 14: 3.0, 15: 3.0, 16: 3.5, 17: 3.0, 18: 3.5, 19: 2.0, 20: 3.0, 21: 2.0, 22: 3.5, 23: 3.5, 24: 3.0, 25: 3.0, 26: 3.0, 27: 3.5, 28: 2.0, 29: 3.0, 30: 2.5 },
    side: { 1: 1.5, 2: 0.5, 3: -0.5, 4: 1.0, 5: -0.5, 6: 2.5, 7: 1.0, 8: -1.5, 9: -0.5, 10: 1.0, 11: 2.5, 12: -0.5, 13: 3.5, 14: -1.0, 15: 1.0, 16: -1.0, 17: 0.0, 18: -1.5, 19: 0.5, 20: 0.0, 21: 3.0, 22: 0.5, 23: 1.0, 24: -1.0, 25: 1.5, 26: -1.0, 27: 4.5, 28: -1.0, 29: -0.5, 30: 0.5 },
    diag: { 1: -21.5, 2: -23.5, 3: -21.0, 4: -16.0, 5: -15.5, 6: -22.5, 7: -19.0, 8: -16.5, 9: -22.0, 10: -14.0, 11: -20.0, 12: -21.0, 13: -9.5, 14: -18.0, 15: -14.0, 16: -25.0, 17: -18.5, 18: -18.0, 19: -14.5, 20: -14.5, 21: -21.0, 22: -18.5, 23: -17.0, 24: -16.0, 25: -10.5, 26: -25.5, 27: -14.5, 28: -19.5, 29: -14.5, 30: -14.0 },
  };
  // v1.100.58: "Town_people2 폴더에 또 다른 30가지 종류가 있어. 이건 주민들의 부유한 버전이야.
  // 사용자 레벨 30이 되면 등장하게 해줘." - 2번째 원화 세트(townchar2/_back/_side/_diag)를 추가하고,
  // 플레이어 레벨이 30 이상이면 모든 마을사람/NPC가 이 "부유한" 버전으로 바뀌도록 함. bbox/발보정은
  // Town_people2 그림을 따로 측정해서 구함(얼굴/옷 디자인만 다르고 캔버스 안 위치는 거의 비슷하지만
  // 오차가 있어 정확히 다시 측정함).
  const TOWNCHAR2_BBOX = {
    front: { top: 82, bottom: 470 },
    back: { top: 69, bottom: 476 },
    side: { top: 94, bottom: 469 },
    diag: { top: 54, bottom: 493 },
  };
  const TOWNCHAR2_FOOT_X = {
    front: { 1: 1.5, 2: 1.5, 3: 2.0, 4: 0.5, 5: 1.5, 6: 2.5, 7: 0.5, 8: 1.0, 9: 1.0, 10: 1.5, 11: 2.0, 12: 2.5, 13: 1.5, 14: 1.5, 15: 1.5, 16: 2.0, 17: 0.5, 18: 1.5, 19: 1.0, 20: 2.0, 21: 1.5, 22: 2.5, 23: 4.5, 24: 2.5, 25: 0.5, 26: 1.5, 27: 3.0, 28: 1.5, 29: 1.0, 30: 2.0 },
    back: { 1: 1.0, 2: 1.5, 3: 1.5, 4: 0.0, 5: 1.5, 6: 1.0, 7: 1.0, 8: 0.5, 9: 0.5, 10: 1.0, 11: 1.0, 12: 1.0, 13: 0.5, 14: 1.0, 15: 0.5, 16: 1.0, 17: 2.0, 18: 1.5, 19: 1.0, 20: 0.5, 21: 0.0, 22: -0.5, 23: 1.5, 24: -1.5, 25: 1.0, 26: 0.5, 27: 1.5, 28: 2.0, 29: 1.0, 30: 0.0 },
    side: { 1: 5.0, 2: 1.5, 3: 2.5, 4: 5.0, 5: 2.0, 6: 5.5, 7: 4.5, 8: 4.5, 9: 2.5, 10: 5.0, 11: 5.5, 12: 6.0, 13: 5.5, 14: 1.0, 15: 4.0, 16: 2.5, 17: 3.0, 18: 3.5, 19: 3.0, 20: 3.0, 21: 6.5, 22: 3.0, 23: 5.0, 24: 2.0, 25: 4.5, 26: 3.5, 27: 4.5, 28: 3.0, 29: 6.5, 30: 5.0 },
    diag: { 1: -21.5, 2: -25.5, 3: -18.5, 4: -13.0, 5: -15.0, 6: -19.0, 7: -17.0, 8: -18.5, 9: -18.5, 10: -11.5, 11: -19.5, 12: -16.0, 13: -13.0, 14: -22.5, 15: -11.0, 16: -25.0, 17: -17.5, 18: -18.0, 19: -13.5, 20: -14.5, 21: -21.5, 22: -18.5, 23: -14.5, 24: -16.5, 25: -11.5, 26: -26.5, 27: -19.0, 28: -19.5, 29: -14.5, 30: -13.0 },
  };
  const TOWNCHAR_CANVAS = 512;
  const TOWNCHAR_CONTENT_H = 82; // 키를 조금 더 늘림 (기존 98 -> 104)
  const TOWNCHAR_FOOT_Y = 8; // 다른 캐릭터들과 같은 발 접지선 기준점
  const TOWNCHAR_HEAD_SCALE = 0.82; // 머리 크기 약 18% 축소
  const TOWNCHAR_BODY_H_SCALE = 1.05; // 몸통/다리 세로 18% 연장 (키 늘림)
  // v1.100.59: "마을주민들 모습 지금 크기에서 15% 크게해줘." - 발 위치(TOWNCHAR_FOOT_Y)는 그대로 두고
  // 머리/몸통을 함께 15% 키움 (baseSize에 곱해서 전체 비율 그대로 유지한 채 확대)
  const TOWNCHAR_SIZE_BOOST = 1.0;

  function drawTownChar(c, o, realDir, faceBack, moving, t, isSit) {
    // v1.100.58: 플레이어 레벨 30 이상이면 모든 NPC가 "부유한 버전"(townchar2) 그림으로 바뀜
    const rich = typeof S !== 'undefined' && S && (S.level || 0) >= 30;
    const effDir = (realDir === 3 && faceBack) ? 1 : realDir;
    const suffix = DIR_SUFFIX[effDir]; // 1:'back' 2:'side' 3:'diag', 정면(0)이면 undefined
    const key = suffix || 'front'; // v1.100.57: 대각선도 이제 전용 그림 사용 (더 이상 side 재사용 안 함)
    const catBase = rich ? 'townchar2' : 'townchar';
    const cat = key === 'front' ? catBase : (catBase + '_' + key);
    const img = getPart2Img(cat, o.townChar);
    if (!(img.complete && img.naturalWidth)) return false;
    // v1.100.56: "옆모습 그림을 좌/우 반전 해줘. 지금 반대로 나와." - side/diag 반전 방향 전환
    const mirror = !(effDir === 2 || effDir === 3);

    const BBOX = rich ? TOWNCHAR2_BBOX : TOWNCHAR_BBOX;
    const FOOT_X = rich ? TOWNCHAR2_FOOT_X : TOWNCHAR_FOOT_X;
    const bbox = BBOX[key];
    const contentPx = bbox.bottom - bbox.top;
    const baseSize = TOWNCHAR_CANVAS * (TOWNCHAR_CONTENT_H / contentPx) * TOWNCHAR_SIZE_BOOST;

    // 발 중심 X 보정 (그림자 정중앙 정렬)
    const footOffPx = (FOOT_X[key] && FOOT_X[key][o.townChar]) || 0;
    const footXOff = (footOffPx / TOWNCHAR_CANVAS) * baseSize;

    // 몸통/다리 (목선 아래부터 발끝) - 목선은 bbox 중간 지점으로 추정
    const neckSrcY = Math.round(bbox.top + contentPx * TOWNCHAR_NECK_FRAC);
    const bodySrcH = TOWNCHAR_CANVAS - neckSrcY;
    const bodyDestH = (bodySrcH / TOWNCHAR_CANVAS) * baseSize * TOWNCHAR_BODY_H_SCALE;
    const bodyDestW = baseSize;
    const bodyDestX = -bodyDestW / 2 - footXOff;
    const footOffsetInBody = ((bbox.bottom - neckSrcY) / bodySrcH) * bodyDestH;
    const bodyDestY = TOWNCHAR_FOOT_Y - footOffsetInBody;

    // 머리 (목선 위쪽, 목 틈새 방지용 8px 오버랩)
    const headSrcH = neckSrcY + 8;
    const headDestW = baseSize * TOWNCHAR_HEAD_SCALE;
    const headDestH = (headSrcH / TOWNCHAR_CANVAS) * baseSize * TOWNCHAR_HEAD_SCALE;
    const headDestX = -headDestW / 2 - footXOff;
    const headDestY = bodyDestY - headDestH + (8 / TOWNCHAR_CANVAS) * baseSize * TOWNCHAR_HEAD_SCALE;

    // v1.100.56: "걷는 모션을 조금 넣어줄수 있어?" - 사뿐사뿐한 통통 튐 애니메이션
    // v1.100.59: "지금 뒤뚱뒤뚱 거리기만 해. 직원들처럼 좀 걷게 해주면 안돼?" - 몸 전체를 좌우로
    // 기울이던(rotate) 방식은 "뒤뚱거림"으로 보여서 제거하고, 직원(drawStaffChar)과 같은 방식으로
    // 몸통을 좌/우로 반을 나눠 위아래로 교차 이동시켜(제자리걸음) 다리가 번갈아 움직이는 것처럼 보이게 함.
    const canWalk = !isSit;
    const walkT = moving && canWalk ? t * 9 : 0;
    const bob = moving && canWalk ? Math.abs(Math.sin(walkT)) * (bodyDestH * 0.035) : Math.sin(t * 2) * .5;
    const stepAmp = moving && canWalk ? bodyDestH * 0.02 : 0;
    const legStepL = stepAmp ? Math.sin(walkT) * stepAmp : 0;
    const legStepR = -legStepL;

    c.save();
    c.translate(0, -bob);
    c.save();
    if (mirror) c.scale(-1, 1);

    // 1. 몸통 그리기 (좌/우 반으로 나눠 다리가 번갈아 움직이는 걷기 모션)
    const bdx = mirror ? -(bodyDestX + bodyDestW) : bodyDestX;
    const halfSrcW = TOWNCHAR_CANVAS / 2, halfDestW = bodyDestW / 2;
    c.save(); c.translate(0, legStepL);
    c.drawImage(img, 0, neckSrcY, halfSrcW, bodySrcH, bdx, bodyDestY, halfDestW, bodyDestH);
    c.restore();
    c.save(); c.translate(0, legStepR);
    c.drawImage(img, halfSrcW, neckSrcY, halfSrcW, bodySrcH, bdx + halfDestW, bodyDestY, halfDestW, bodyDestH);
    c.restore();

    // 2. 머리 그리기 (몸통 위에 얹음, 다리 움직임과 무관하게 고정)
    const hdx = mirror ? -(headDestX + headDestW) : headDestX;
    c.drawImage(img, 0, 0, TOWNCHAR_CANVAS, headSrcH, hdx, headDestY, headDestW, headDestH);

    c.restore();
    c.restore();
    return true;
  }

  function draw(c, o, dir, t, moving, mood, diag, faceBack, shadowYOff) {
    // v1.100.56: "왜 내캐릭터가 마을 사람들 캐릭터로 바꼈어. 다시 돌려놔."
    // norm(o)이 복사본을 반환하므로 o === CFG.look 참조 비교가 풀려 플레이어가 마을사람으로 덮어씌워졌던 원인 해결!
    const isPlayer = !!(o && (o._isMe || o.isPlayer || (typeof CFG !== 'undefined' && o === CFG.look)));
    o = norm(o);
    if (isPlayer) { o.isPlayer = true; o._isMe = true; delete o.townChar; }
    mood = mood || 'calm';
    const isDiag = dir === 3 || diag;
    const realDir = isDiag ? 3 : dir;
    const k = (o.kid ? .86 : 1) * (o.ht || 1);
    const bw = o.bw || 1;
    const isSit = (ART.SIT || 0) > 0.05;

    // Contact Ground Shadow (shadowYOff: 캐릭터 미리보기 전용 - 발 아래로 그림자를 더 내려서 보여줄 때 씀)
    // v1.x: 그림자를 3단으로 나눠서 - 넓고 옅은 것 + 중간 + 발 접촉부 진한 것
    // (기존엔 한 겹이라 캐릭터가 땅에 "붙어있다"기보다 "스티커"처럼 보였음)
    {
      const sy0 = (shadowYOff || 0);
      ART.ell(c, 0, sy0 + 8, 22 * k * bw, 7.5 * k, 'rgba(15,20,30,.10)');
      ART.ell(c, 0, sy0 + 7.5, 16 * k * bw, 5.5 * k, 'rgba(15,20,30,.20)');
      ART.ell(c, 0, sy0 + 7, 9 * k * bw, 3.2 * k, 'rgba(15,20,30,.42)');
    }

    c.save();
    c.scale(k, k);

    // 1. 직원 전용 머리+옷 2단 이미지
    if (!HUM.forceVector && o.staffHead && o.staffOutfit) {
      drawStaffChar(c, o, realDir, faceBack, moving, t, isSit); c.restore(); return;
    }

    // 2. 플레이어 전용 (CFG.look) - 마을사람 그리기보다 무조건 최우선으로 내 캐릭터(drawMyChar2) 렌더링!
    if (isPlayer && !HUM.forceVector) {
      drawMyChar2(c, o, realDir, faceBack, moving, t, isSit);
      
      // ========== 소품 그리기 시작 ==========
      if (o.acc) {
        const hy = -54;
        // 목걸이
        if (o.acc.neck && (realDir === 0 || realDir === 1)) {
          const ny = hy + 1;
          c.beginPath();
          c.arc(0, ny, 5, 0.15 * Math.PI, 0.85 * Math.PI);
          c.lineWidth = 2;
          c.strokeStyle = '#f5c542';
          c.stroke();
          if (o.acc.neck === 'pendant') {
            ell(c, 0, ny + 3.5, 2.5, 3, '#ff7aa8', OUT, 0.8);
          } else if (o.acc.neck === 'bell') {
            ell(c, 0, ny + 3.5, 2.5, 2.5, '#ffd23a', OUT, 0.8);
            ell(c, 0, ny + 5, 1, 1, '#6a4a1a');
          } else {
            ell(c, 0, ny + 3.5, 2, 2, '#f5c542', OUT, 0.8);
          }
        }
        // 귀걸이
        if (o.acc.ear && realDir === 0) {
          const col = o.acc.ear === 'hoop' ? '#c9962a' : '#f5c542';
          for (const s of [-1, 1]) {
            ell(c, s * 19, hy + 1, 1, 1, col, OUT, 0.7);
          }
        }
        // 안경
        if (o.acc.face && realDir === 0) {
          const ey = hy + 4;
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
        // 목도리
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
          if (realDir === 0 || realDir === 1) {
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
        // 모자
        if (o.acc.head) {
          hatOnly(c, { hat: o.acc.head });
        }
      }
      // ========== 소품 그리기 끝 ==========
      
      c.restore();
      return;
    }

    // 3. 마을사람 / NPC 전용 전신 그림 (townChar) - 플레이어가 아닌 모든 NPC
    if (!HUM.forceVector) {
      if (!o.townChar) o.townChar = 1 + (Math.abs(o.sd || o.seed || o.id || 7) % 30);
      drawTownChar(c, o, realDir, faceBack, moving, t, isSit); c.restore(); return;
    }

    // ==========================================
    // SIDE VIEW (dir === 2) - SIDE-WALKING ANIMATION
    // ==========================================
    if (realDir === 2) {
      const walkT = moving && !isSit ? t * 9 : 0;
      const bob = moving && !isSit ? Math.abs(Math.sin(walkT)) * 2.8 : Math.sin(t * 2) * .5;
      const sway = moving ? Math.sin(walkT) * .15 : 0;
      c.translate(0, -bob);

      // Leg swing angles in profile:
      const aNear = moving && !isSit ? Math.sin(walkT) * .55 : 0;
      const aFar  = moving && !isSit ? -Math.sin(walkT) * .55 : 0;
      const hy = -54;

      // 1. Far Arm (behind body)
      const armFarAngle = moving && !isSit ? Math.sin(walkT) * .5 : .1;
      const sleeveCol = o.top === 'jacket' || o.top === 'suit' ? (o.jacket || '#6d6875') : o.shirt;
      c.save();
      c.translate(-1, -30);
      c.rotate(armFarAngle);
      rrect(c, -2.4, 0, 4.8, 12, 2.4);
      c.fillStyle = shade(sleeveCol, -.2); c.fill(); c.lineWidth = 1.1; c.strokeStyle = OUT; c.stroke();
      ell(c, 0, 13, 2.6, 2.6, shade(o.skin, -.15), OUT, 1);
      c.restore();

      // 2. Far Leg (behind body, shaded darker) — pivot 내리고 회전각 축소
      c.save();
      c.translate(-2, -13);
      c.rotate(aFar * .75);
      const bareFar = o.top === 'dress' || o.skirt;
      rrect(c, -3, 0, 6, 13, 2.8);
      c.fillStyle = bareFar ? shade(o.skin, -.15) : shade(o.pants, -.2); c.fill();
      c.lineWidth = 1.1; c.strokeStyle = OUT; c.stroke();
      drawSneaker(c, 1, 13, shade(o.shoe || '#3a2a22', -.15), 1);
      c.restore();

      // 3. Hair Back (drawn behind head and body!)
      hairSideBack(c, o, hy, sway);

      // 4. Torso (Side Profile)
      c.beginPath();
      c.moveTo(5.5, -34); // chest front
      c.quadraticCurveTo(8.5, -24, 7, -13);
      c.lineTo(-6, -13); // hip back
      c.quadraticCurveTo(-8, -25, -5.5, -34);
      c.closePath();
      const gSide = c.createLinearGradient(-6, -34, 7, -13);
      gSide.addColorStop(0, shade(sleeveCol, .15));
      gSide.addColorStop(.6, sleeveCol);
      gSide.addColorStop(1, shade(sleeveCol, -.15));
      c.fillStyle = gSide; c.fill(); c.lineWidth = 1.4; c.strokeStyle = OUT; c.stroke();

      if (o.top === 'hoodie') {
        rrect(c, 1, -22, 6, 6, 2); c.fillStyle = shade(sleeveCol, -.12); c.fill();
        c.beginPath(); c.moveTo(3, -31); c.lineTo(3, -25); c.lineWidth = 1; c.strokeStyle = '#fff'; c.stroke();
      }
      if (o.skirt || o.top === 'dress') {
        c.beginPath();
        c.moveTo(-7, -20); c.lineTo(-10 + sway * 4, -8); c.lineTo(9 + sway * 4, -8); c.lineTo(7, -20); c.closePath();
        c.fillStyle = shade(o.skirt || o.shirt, -.15); c.fill(); c.lineWidth = 1.1; c.strokeStyle = OUT; c.stroke();
      }
      if (o.top === 'overall') {
        rrect(c, -5, -27, 11, 14, 2); c.fillStyle = o.pants; c.fill(); c.lineWidth = 1; c.strokeStyle = OUT; c.stroke();
        c.beginPath(); c.moveTo(-2, -34); c.lineTo(3, -27); c.lineWidth = 2; c.strokeStyle = o.pants; c.stroke();
        ell(c, 3, -26, 1.2, 1.2, '#f2c14e');
      }

      // 5. Near Leg (Front-most leg in profile) — pivot 내리고 회전각 축소
      c.save();
      c.translate(2, -13);
      c.rotate(aNear * .75);
      const bareNear = o.top === 'dress' || o.skirt;
      rrect(c, -3.2, 0, 6.4, 13, 2.8);
      c.fillStyle = bareNear ? o.skin : o.pants; c.fill();
      c.lineWidth = 1.2; c.strokeStyle = OUT; c.stroke();
      if (o.socks && bareNear) {
        rrect(c, -3.2, 6, 6.4, 5, 2); c.fillStyle = o.socks; c.fill();
      }
      drawSneaker(c, 1, 13, o.shoe || '#3a2a22', 1);
      c.restore();

      // 5b. 앞쪽 치마 — 다리 위에 덮기
      if (o.skirt || o.top === 'dress') {
        c.beginPath();
        c.moveTo(-7, -20); c.lineTo(-10 + sway * 4, -8);
        c.lineTo(9 + sway * 4, -8); c.lineTo(7, -20);
        c.closePath();
        c.fillStyle = shade(o.skirt || o.shirt, .05);
        c.fill(); c.lineWidth = 1.1; c.strokeStyle = OUT; c.stroke();
      }

      // 6. Near Arm (in front of torso)
      const armNearAngle = moving && !isSit ? -Math.sin(walkT) * .55 : -.12;
      c.save();
      c.translate(1, -30);
      c.rotate(armNearAngle);
      rrect(c, -2.6, 0, 5.2, 12.5, 2.6);
      c.fillStyle = sleeveCol; c.fill(); c.lineWidth = 1.2; c.strokeStyle = OUT; c.stroke();
      ell(c, 0, 13.5, 2.8, 2.8, o.skin, OUT, 1);
      c.restore();

      // 7. Neck & Collar
      rrect(c, -2.5, -38, 5, 6, 2); c.fillStyle = shade(o.skin, -.12); c.fill();

      // 8. Head & Face (Profile) — 정면과 완벽히 호환되는 사랑스러운 치비 옆얼굴 곡선
      const hw2 = 19.5, hh2 = 17.5;
      c.beginPath();
      c.moveTo(-hw2 * .82, hy + 2); // nape
      c.bezierCurveTo(-hw2 * .88, hy + hh2 * .65, -4, hy + hh2 * .95, 0, hy + hh2 * .95); // jawline
      c.quadraticCurveTo(5, hy + hh2 * .95, 7.2, hy + hh2 * .75); // chin
      c.lineTo(9.2, hy + hh2 * .52); // nose tip
      c.lineTo(7.2, hy + hh2 * .42); // bridge
      c.bezierCurveTo(8.5, hy - hh2 * .45, 4, hy - hh2, -6, hy - hh2); // forehead
      c.bezierCurveTo(-hw2 * .92, hy - hh2 * .9, -hw2 * .92, hy - hh2 * .22, -hw2 * .82, hy + 2); // cranium
      c.closePath();
      const gHead = ART.grad(c, 0, hy, 18, o.skin);
      c.fillStyle = gHead; c.fill(); c.lineWidth = 1.5; c.strokeStyle = OUT; c.stroke();

      // Ear in profile
      ell(c, -2, hy + 5, 3.2, 4.4, o.skin, OUT, 1.2);
      ell(c, -2, hy + 5, 1.5, 2.4, shade(o.skin, -.14));
      if (o.earring) ell(c, -2, hy + 9.5, 1.6, 1.6, o.earring);

      // Face features (Profile eye, blush, mouth)
      sideFace(c, o, hy, mood, t);

      // 9. Hair Front Cap & Bangs (rendered ON TOP OF HEAD!)
      hairSideFront(c, o, hy, sway);

      // Hat in profile
      hatSide(c, o, hy);

      c.restore();
      return;
    }

    // ==========================================
    // DIAGONAL VIEW (face=3) — 정면과 사이드의 중간 (3/4 뷰)
    // ==========================================
    if (realDir === 3) {
      const D = .6;
      const walkT = moving && !isSit ? t * 9 : 0;
      const bob = moving && !isSit ? Math.abs(Math.sin(walkT)) * 2.6 : Math.sin(t * 2) * .5;
      const sway = moving ? Math.sin(walkT) * .12 : 0;
      c.translate(0, -bob);

      const aNear = moving && !isSit ? Math.sin(walkT) * .42 : 0;
      const aFar  = moving && !isSit ? -Math.sin(walkT) * .42 : 0;
      const hy = -54;
      const sleeveCol = o.top === 'jacket' || o.top === 'suit' ? (o.jacket || '#6d6875') : o.shirt;

      // 뒤쪽 팔
      c.save(); c.translate(-2 * D, -30); c.rotate(Math.sin(walkT) * .4 * D);
      rrect(c, -2.4, 0, 4.8, 12, 2.4); c.fillStyle = shade(sleeveCol, -.2);
      c.fill(); c.lineWidth = 1.1; c.strokeStyle = OUT; c.stroke();
      ell(c, 0, 13, 2.6, 2.6, shade(o.skin, -.15), OUT, 1); c.restore();

      // 뒤쪽 다리
      c.save(); c.translate(-2 * D, -13); c.rotate(aFar * .75);
      const bareFarD = o.top === 'dress' || o.skirt;
      rrect(c, -3, 0, 6, 13, 2.8);
      c.fillStyle = bareFarD ? shade(o.skin, -.15) : shade(o.pants, -.2);
      c.fill(); c.lineWidth = 1.1; c.strokeStyle = OUT; c.stroke();
      drawSneaker(c, 1, 13, shade(o.shoe || '#3a2a22', -.15), 1); c.restore();

      // 뒤통수 헤어
      hairSideBack(c, o, hy, sway * D);

      // 뒤쪽 치마
      if (o.skirt || o.top === 'dress') {
        c.beginPath();
        c.moveTo(-7 * D - 2, -20); c.lineTo(-10 * D - 2 + sway * 3, -8);
        c.lineTo(9 * D + 1 + sway * 3, -8); c.lineTo(7 * D + 1, -20);
        c.closePath(); c.fillStyle = shade(o.skirt || o.shirt, -.15);
        c.fill(); c.lineWidth = 1.1; c.strokeStyle = OUT; c.stroke();
      }

      // 몸통 (정면 폭의 65%)
      const bw3 = 7.5;
      c.beginPath();
      c.moveTo(-bw3 - 2, -13);
      c.quadraticCurveTo(-bw3 - 3, -31, -bw3 + 2, -34);
      c.lineTo(bw3 - 2, -34);
      c.quadraticCurveTo(bw3 + 3, -31, bw3 + 2, -13);
      c.closePath();
      const gSide3 = c.createLinearGradient(-bw3, -34, bw3, -13);
      gSide3.addColorStop(0, shade(sleeveCol, .15));
      gSide3.addColorStop(.6, sleeveCol);
      gSide3.addColorStop(1, shade(sleeveCol, -.15));
      c.fillStyle = gSide3; c.fill(); c.lineWidth = 1.4; c.strokeStyle = OUT; c.stroke();

      // 앞쪽 다리
      c.save(); c.translate(2 * D, -13); c.rotate(aNear * .75);
      const bareNearD = o.top === 'dress' || o.skirt;
      rrect(c, -3.2, 0, 6.4, 13, 2.8);
      c.fillStyle = bareNearD ? o.skin : o.pants;
      c.fill(); c.lineWidth = 1.2; c.strokeStyle = OUT; c.stroke();
      drawSneaker(c, 1, 13, o.shoe || '#3a2a22', 1); c.restore();

      // 앞쪽 치마
      if (o.skirt || o.top === 'dress') {
        c.beginPath();
        c.moveTo(-7 * D - 2, -20); c.lineTo(-10 * D - 2 + sway * 3, -8);
        c.lineTo(9 * D + 1 + sway * 3, -8); c.lineTo(7 * D + 1, -20);
        c.closePath(); c.fillStyle = shade(o.skirt || o.shirt, .05);
        c.fill(); c.lineWidth = 1.1; c.strokeStyle = OUT; c.stroke();
      }

      // 앞쪽 팔
      c.save(); c.translate(2 * D, -30); c.rotate(-Math.sin(walkT) * .5 * D);
      rrect(c, -2.6, 0, 5.2, 12.5, 2.6);
      c.fillStyle = sleeveCol; c.fill(); c.lineWidth = 1.2; c.strokeStyle = OUT; c.stroke();
      ell(c, 0, 13.5, 2.8, 2.8, o.skin, OUT, 1); c.restore();

      // 목
      rrect(c, -2.5, -38, 5, 6, 2); c.fillStyle = shade(o.skin, -.12); c.fill();

      // 머리 (3/4 뷰) — faceBack이면 정면+뒷머리, 아니면 프로필
      c.save();

      const hwD = 19.5, hhD = 17.5;
      if (faceBack) {
        // ===== 뒤쪽 대각선: 살짝 옆에서 본 뒷모습 =====
        c.translate(-2.5, 0);
        c.beginPath();
        c.moveTo(-hwD, hy + 2);
        c.bezierCurveTo(-hwD, hy - hhD * .9, hwD, hy - hhD * .9, hwD, hy + 2);
        c.bezierCurveTo(hwD, hy + hhD * 1.05, -hwD, hy + hhD * 1.05, -hwD, hy + 2);
        c.closePath();
        c.fillStyle = ART.grad(c, 0, hy, 18, o.skin); c.fill();
        c.lineWidth = 1.5; c.strokeStyle = OUT; c.stroke();
        // 오른쪽 귀 살짝 노출 (뒤 대각선이면 반대쪽 귀가 보임)
        ell(c, hwD - 0.5, hy + 4, 3.2, 4.4, o.skin, OUT, 1.2);
        ell(c, hwD - 0.5, hy + 4, 1.5, 2.4, shade(o.skin, -.14));
      } else {
        // ===== 앞쪽 대각선: 프로필 헤드 + sideFace (한쪽 눈만) =====
        c.translate(2.5, 0);
        c.beginPath();
        c.moveTo(-hwD * .82, hy + 2);
        c.bezierCurveTo(-hwD * .92, hy + hhD * .65, -6, hy + hhD, 0, hy + hhD);
        c.quadraticCurveTo(6, hy + hhD * .95, 8, hy + hhD * .72);
        c.lineTo(9.5, hy + hhD * .53);
        c.lineTo(7, hy + hhD * .45);
        c.bezierCurveTo(8.5, hy - hhD * .45, 4, hy - hhD, -6, hy - hhD);
        c.bezierCurveTo(-hwD * .92, hy - hhD * .9, -hwD * .92, hy - hhD * .22, -hwD * .82, hy + 2);
        c.closePath();
        c.fillStyle = ART.grad(c, 0, hy, 18, o.skin); c.fill();
        c.lineWidth = 1.5; c.strokeStyle = OUT; c.stroke();

        // 귀 (프로필)
        ell(c, -2, hy + 5, 3.2, 4.4, o.skin, OUT, 1.2);
        ell(c, -2, hy + 5, 1.5, 2.4, shade(o.skin, -.14));

        // 얼굴: 사이드 얼굴 (한쪽 눈 + 코 + 입)
        sideFace(c, o, hy, mood, t);
      }
      c.restore();

      // 헤어
      if (faceBack) {
        c.save();
        c.translate(-2.5, 0);
        hairBack(c, o, hy);
        hairFront(c, o, hy, true);
        c.restore();
      } else {
        hairSideFront(c, o, hy, sway * D);
      }

      // 모자
      if (faceBack) hat(c, o, hy, true); else hatSide(c, o, hy);

      c.restore();
      return;
    }

    // ==========================================
    // FRONT VIEW (dir === 0) & BACK VIEW (dir === 1)
    // ==========================================
    const bob = moving ? Math.abs(Math.sin(t * 10)) * 2 : Math.sin(t * 2) * .6;
    const leg = moving ? Math.sin(t * 10) * 3.2 : 0;
    c.translate(0, -bob - (mood === 'surprised' ? 1.5 : 0));
    const hy = -54;

    if (realDir === 0) hairBack(c, o, hy);
    c.save(); c.scale(bw, 1);

    // legs
    for (const s of [-1, 1]) {
      const ly = s * leg;
      rrect(c, s * 4.5 - 3.2, -15 + Math.min(0, ly), 6.4, 13 - Math.abs(ly) * .3, 3);
      const bare = o.top === 'dress' || o.skirt;
      c.fillStyle = bare ? o.skin : shadeFill(c, o.pants); c.fill(); c.lineWidth = 1.2; c.strokeStyle = OUT; c.stroke();
      if (o.socks && bare) { rrect(c, s * 4.5 - 3.2, -7 + Math.min(0, ly) * .4, 6.4, 5, 2); c.fillStyle = o.socks; c.fill(); }
      ell(c, s * 4.5, -2.5 + Math.min(0, ly) * .4, 4.4, 2.9, o.shoe || '#3a2a22', OUT, .8);
      ell(c, s * 4.5 - 1.2, -3.4 + Math.min(0, ly) * .4, 1.6, .8, 'rgba(255,255,255,.35)');
    }

    // body
    const shirt = o.shirt, jk = o.jacket || '#6d6875';
    const main = o.top === 'suit' ? jk : o.top === 'cardigan' ? (o.shirt2 || '#ffffff') : shirt;
    bodyPath(c); c.fillStyle = shadeFill(c, main); c.fill(); c.lineWidth = 1.5; c.strokeStyle = OUT; c.stroke();

    if (o.top === 'stripe') { c.save(); bodyPath(c); c.clip(); for (let y = -32; y < -12; y += 5) { c.fillStyle = o.shirt2 || '#fff'; c.fillRect(-12, y, 24, 2.2); } c.restore(); bodyPath(c); c.stroke(); }

    if (o.top === 'sweater') {
      c.save(); bodyPath(c); c.clip(); c.lineWidth = .7; c.strokeStyle = shade(shirt, -.2);
      for (let x = -9; x <= 9; x += 3) { c.beginPath(); c.moveTo(x, -33); c.lineTo(x, -14); c.stroke(); }
      c.lineWidth = 1.1; c.strokeStyle = shade(shirt, .3); c.beginPath(); for (let y = -31; y < -16; y += 3) { c.moveTo(-1.5, y); c.lineTo(1.5, y + 1.5); c.lineTo(-1.5, y + 3); } c.stroke();
      rrect(c, -12, -16.5, 24, 3.5, 1); c.fillStyle = shade(shirt, -.12); c.fill(); c.restore();
    }

    if (o.top === 'suit') {
      if (realDir === 0) {
        c.beginPath(); c.moveTo(-4.5, -34); c.lineTo(4.5, -34); c.lineTo(0, -21); c.closePath(); c.fillStyle = '#ffffff'; c.fill();
        c.beginPath(); c.moveTo(-1.3, -33.5); c.lineTo(1.3, -33.5); c.lineTo(1.8, -23); c.lineTo(0, -21); c.lineTo(-1.8, -23); c.closePath(); c.fillStyle = shirt; c.fill(); c.lineWidth = .7; c.strokeStyle = OUT; c.stroke();
        c.lineWidth = 1; c.strokeStyle = shade(jk, -.35); for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(sd * 4.5, -34); c.lineTo(sd * 2.2, -27); c.lineTo(0, -21); c.stroke(); }
        ell(c, 0, -18, .9, .9, shade(jk, .3)); ell(c, 0, -15, .9, .9, shade(jk, .3));
      }
    }

    if (o.top === 'cardigan' && realDir === 0) {
      for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(sd * 2.5, -34); c.lineTo(sd * 6, -34); c.quadraticCurveTo(sd * 11.5, -31, sd * 10, -13); c.lineTo(sd * 3.5, -13); c.closePath(); c.fillStyle = shadeFill(c, shirt); c.fill(); c.lineWidth = 1.1; c.strokeStyle = OUT; c.stroke(); }
      for (const y of [-29, -24, -19]) ell(c, -4.3, y, 1, 1, '#f4efe6', OUT, .5);
    }

    if (o.top === 'dress' || o.skirt) {
      c.beginPath(); c.moveTo(-10, o.top === 'dress' ? -24 : -18); c.lineTo(-14, -8); c.quadraticCurveTo(0, -5, 14, -8); c.lineTo(10, o.top === 'dress' ? -24 : -18); c.closePath();
      c.fillStyle = shadeFill(c, o.top === 'dress' ? shirt : o.skirt); c.fill(); c.stroke();
      c.lineWidth = .7; c.strokeStyle = 'rgba(60,38,25,.3)'; for (const x of [-6, 0, 6]) { c.beginPath(); c.moveTo(x * .7, o.top === 'dress' ? -22 : -17); c.lineTo(x, -7); c.stroke(); }
    }

    if (o.top === 'overall' && realDir === 0) { rrect(c, -7, -27, 14, 15, 3); c.fillStyle = o.pants; c.fill(); c.lineWidth = 1; c.stroke(); for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * 5, -27); c.lineTo(s * 6.5, -33); c.lineWidth = 2; c.strokeStyle = o.pants; c.stroke(); ell(c, s * 5, -26, 1.2, 1.2, '#f2c14e'); } rrect(c, -3.5, -24, 7, 4.5, 1); c.lineWidth = .7; c.strokeStyle = shade(o.pants, .3); c.stroke(); }

    if (o.top === 'jacket') { for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * 2, -34); c.lineTo(s * 10.5, -32); c.quadraticCurveTo(s * 11.5, -20, s * 10, -13); c.lineTo(s * 3, -13); c.closePath(); c.fillStyle = shadeFill(c, jk); c.fill(); c.lineWidth = 1.2; c.strokeStyle = OUT; c.stroke(); } if (realDir === 0) { c.beginPath(); c.moveTo(-2.5, -20); c.lineTo(2.5, -20); c.lineWidth = .8; c.strokeStyle = 'rgba(0,0,0,.2)'; c.stroke(); } }

    if (o.top === 'hoodie') { if (realDir === 0) { c.beginPath(); c.moveTo(-2, -30); c.lineTo(-2, -24); c.moveTo(2, -30); c.lineTo(2, -24); c.lineWidth = 1; c.strokeStyle = '#fff'; c.stroke(); rrect(c, -6, -22, 12, 6, 2); c.fillStyle = shade(shirt, -.1); c.fill(); } }

    if (o.top === 'tee' && realDir === 0 && o.print) { const px = 0, py = -24; if (o.print === 1) { ell(c, px, py, 3.2, 3.2, o.shirt2 || '#fff'); } else if (o.print === 2) { c.font = 'bold 6px sans-serif'; c.textAlign = 'center'; c.fillStyle = o.shirt2 || '#fff'; c.fillText('♥', px, py + 2); c.textAlign = 'start'; } else { rrect(c, -4, -27, 8, 5, 1); c.fillStyle = o.shirt2 || '#fff'; c.fill(); } }

    // hem shadow
    c.save(); bodyPath(c); c.clip(); c.fillStyle = 'rgba(0,0,0,.08)'; c.fillRect(-12, -16, 24, 3); c.restore();

    if (o.apron && realDir === 0) { rrect(c, -6.5, -29, 13, 17, 3); c.fillStyle = o.apron; c.fill(); c.lineWidth = 1; c.strokeStyle = OUT; c.stroke(); ell(c, 0, -22, 2.4, 1.6, '#f3a6b8'); }

    if (o.pack && realDir === 1) { rrect(c, -8, -32, 16, 17, 4); c.fillStyle = shadeFill(c, o.pack); c.fill(); c.lineWidth = 1.2; c.strokeStyle = OUT; c.stroke(); rrect(c, -5, -24, 10, 6, 2); c.fillStyle = shade(o.pack, -.12); c.fill(); c.stroke(); }
    if (o.pack && realDir === 0) { c.lineWidth = 2; c.strokeStyle = shade(o.pack, -.1); for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(sd * 6, -34); c.lineTo(sd * 6.5, -20); c.stroke(); } }

    // arms
    const arm = moving ? Math.sin(t * 10) * 2.5 : 0;
    const armRot = mood === 'surprised' ? .7 : mood === 'angry' ? .1 : .25;
    const sleeve = o.top === 'jacket' || o.top === 'suit' ? jk : shirt;
    for (const s of [-1, 1]) { c.save(); c.translate(s * 10, -31); c.rotate(s * armRot + s * arm * .06); rrect(c, -2.6, 0, 5.2, 13, 2.6); c.fillStyle = shadeFill(c, sleeve); c.fill(); c.lineWidth = 1.2; c.strokeStyle = OUT; c.stroke(); if (o.top === 'sweater' || o.top === 'cardigan') { rrect(c, -2.6, 10, 5.2, 2.5, 1); c.fillStyle = shade(sleeve, -.12); c.fill(); } ell(c, 0, 13.5, 2.8, 2.8, o.skin, OUT, 1); c.restore(); }

    // bag on shoulder
    if (o.bag && realDir === 0) { c.beginPath(); c.moveTo(-8, -33); c.lineTo(9, -19); c.lineWidth = 1.4; c.strokeStyle = shade(o.bag, -.3); c.stroke(); rrect(c, 7, -22, 9, 8, 2); c.fillStyle = shadeFill(c, o.bag); c.fill(); c.lineWidth = 1; c.strokeStyle = OUT; c.stroke(); ell(c, 11.5, -19, .9, .9, '#e8c25a'); }

    c.restore(); // body width

    // neck
    rrect(c, -3.2, -38, 6.4, 6, 2); c.fillStyle = shade(o.skin, -.1); c.fill();
    if (o.top === 'hoodie') { c.beginPath(); c.ellipse(0, -34, 10, 3.5, 0, 0, TAU); c.fillStyle = shade(o.shirt, -.12); c.fill(); c.lineWidth = 1; c.strokeStyle = OUT; c.stroke(); }
    if (o.top === 'sweater') { c.beginPath(); c.ellipse(0, -34, 6.5, 2.4, 0, 0, TAU); c.fillStyle = shade(o.shirt, -.14); c.fill(); c.lineWidth = .8; c.strokeStyle = OUT; c.stroke(); }
    if (o.scarf && realDir === 0) { c.beginPath(); c.ellipse(0, -34.5, 8.5, 3.4, 0, 0, TAU); c.fillStyle = o.scarf; c.fill(); c.lineWidth = 1; c.strokeStyle = OUT; c.stroke(); rrect(c, 2, -34, 4, 10, 1.5); c.fill(); c.stroke(); }
    if (o.necklace && realDir === 0) { c.beginPath(); c.arc(0, -35, 4.2, .1 * Math.PI, .9 * Math.PI); c.lineWidth = 1; c.strokeStyle = '#e8c25a'; c.stroke(); }

    // head
    if (realDir === 1) hairBack(c, o, hy);
    const [hw, hh] = FSHAPE[o.fshape | 0] || FSHAPE[0];
    const headPath = () => {
      c.beginPath();
      if ((o.fshape | 0) === 1 || (o.fshape | 0) === 3) {
        c.moveTo(-hw, hy - 2); c.bezierCurveTo(-hw, hy - hh * 1.35, hw, hy - hh * 1.35, hw, hy - 2);
        c.bezierCurveTo(hw, hy + hh * .75, hw * .35, hy + hh, 0, hy + hh);
        c.bezierCurveTo(-hw * .35, hy + hh, -hw, hy + hh * .75, -hw, hy - 2);
        c.closePath();
      } else {
        c.ellipse(0, hy, hw, hh, 0, 0, TAU);
      }
    };
    headPath(); c.fillStyle = ART.grad(c, 0, hy, 18, o.skin); c.fill(); c.lineWidth = 1.6; c.strokeStyle = OUT; c.stroke();

    if (realDir === 0) {
      ell(c, -hw + .5, hy + 3, 3, 4, o.skin, OUT, 1.2); ell(c, hw - .5, hy + 3, 3, 4, o.skin, OUT, 1.2);
      ell(c, -hw + .5, hy + 3, 1.3, 2, shade(o.skin, -.12)); ell(c, hw - .5, hy + 3, 1.3, 2, shade(o.skin, -.12));
      if (o.earring) { ell(c, -hw + .5, hy + 8, 1.4, 1.4, o.earring); ell(c, hw - .5, hy + 8, 1.4, 1.4, o.earring); }
      c.save(); headPath(); c.clip(); ell(c, 0, hy - 7, 17, 5, 'rgba(150,80,60,.13)'); ell(c, 0, hy + hh + 2, hw * .8, 4, 'rgba(150,80,60,.1)'); c.restore();
      face(c, Object.assign({ hw }, o), hy, mood, t);
    }

    hairFront(c, o, hy, realDir === 1);
    hat(c, o, hy, realDir === 1);
    c.restore();
  }

  // map old player looks (numeric hs) to new
  function norm(o) {
    if (!o) o = {};
    const isPlayer = !!(o._isMe || o.isPlayer || (typeof CFG !== 'undefined' && o === CFG.look));
    if (isPlayer) {
      // 플레이어 전용: 아직 하나도 안 골랐으면 1번/1번/1번을 기본값으로 보여줌
      if (o.pHair == null) o.pHair = 1;
      if (o.pTop == null) o.pTop = 1;
      if (o.pBottom == null) o.pBottom = 1;
      if (o.pFace == null) o.pFace = 1;
      delete o.townChar;
    } else if (!o.staffHead && !o.staffOutfit && !o.townChar) {
      // NPC 전용: 플레이어의 pHair/pTop/pBottom을 절대 상속받지 않고 마을사람 전용 townChar를 자동 배정
      o.townChar = 1 + (Math.abs(o.sd || o.seed || o.id || 1) % 30);
    }
    const r = Object.assign({}, o);
    if (isPlayer) { r.isPlayer = true; r._isMe = true; delete r.townChar; }
    if (r._n && typeof r.skin === 'string' && typeof r.hair === 'string' && typeof r.shirt === 'string' && typeof r.pants === 'string') return r;
    if (typeof r.hs === 'number') r.hs = ['short', 'long', 'spiky', 'pony', 'bob'][r.hs] || 'short';
    if (typeof r.hair === 'number' && !r.hs) r.hs = HAIRS[r.hair % HAIRS.length] || 'short';
    if (typeof r.skin !== 'string') r.skin = SKINS[(typeof r.skin === 'number' ? r.skin : 1) % SKINS.length] || SKINS[1];
    if (typeof r.hair !== 'string') r.hair = (typeof r.hcol === 'string' && r.hcol) || HAIRCOL[(typeof r.hair === 'number' ? r.hair : 0) % HAIRCOL.length] || HAIRCOL[0];
    if (typeof r.top === 'number') r.top = ['tee', 'stripe', 'hoodie', 'sweater', 'cardigan', 'jacket', 'suit', 'overall', 'dress'][r.top % 9] || 'tee';
    if (!r.top) r.top = 'tee';
    if (typeof r.shirt !== 'string') r.shirt = (typeof r.tcol === 'string' && r.tcol) || CLOTH[(typeof r.shirt === 'number' ? r.shirt : 0) % CLOTH.length] || CLOTH[0];
    if (typeof r.pants !== 'string') r.pants = (typeof r.bcol === 'string' && r.bcol) || PANTS[(typeof r.pants === 'number' ? r.pants : 0) % PANTS.length] || PANTS[0];
    if (r.eyes == null) r.eyes = 0; if (r.mouth == null) r.mouth = 0; if (r.brow == null) r.brow = 1;
    if (r.nose == null) r.nose = 1; if (r.fshape == null) r.fshape = 0;
    if (r.lash == null) r.lash = ['long', 'pony', 'bob', 'twin', 'bun', 'wavy', 'curlylong', 'braid', 'pixie', 'hime', 'sidepony', 'hightail'].includes(r.hs);
    r._n = 1;
    r.acc = o.acc;   // 🆕 소품 슬롯 정보 보존
    return r;
  }

  function random(seed) {
    let s = (seed * 2654435761) % 4294967296; const R = () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
    const pick = a => a[Math.floor(R() * a.length)];
    const girl = R() < .55, age = R(); const kid = age < .13, old = age > .87;
    const o = {
      sd: seed, skin: pick(SKINS), hair: old ? pick(['#b0b0b8', '#e6e6ea', '#8a8a92', '#d0d0d6']) : pick(HAIRCOL),
      hs: girl ? pick(['long', 'pony', 'bob', 'twin', 'bun', 'wavy', 'pixie', 'curlylong', 'braid', 'hime', 'sidepony', 'hightail', 'afro', 'long', 'bob']) : old && R() < .45 ? 'bald' : pick(['short', 'spiky', 'side', 'buzz', 'curly', 'mop', 'undercut', 'afro', 'short', 'side']),
      eyes: pick([0, 0, 1, 1, 2, 3, 4, 5, 6]), mouth: Math.floor(R() * 6), brow: pick([0, 1, 1, 2, 3]),
      nose: pick([0, 1, 1, 2, 3]), fshape: kid ? pick([0, 2]) : pick([0, 0, 1, 2, 3]),
      eye: pick(['#3a2418', '#3a2418', '#4a2c1a', '#4a6fa5', '#3f7a4f', '#6b4a2b', '#2b2b3a', '#7a8a9a', '#8a6a2a']),
      shirt: pick(CLOTH), shirt2: pick(['#ffffff', '#f2c14e', '#3d405b', '#ef8fa8', '#a3c4f3']), pants: pick(PANTS), shoe: pick(['#3a2a22', '#ffffff', '#e07a5f', '#4f7cac', '#2b2b2b', '#c9a06a']),
      top: kid ? pick(['tee', 'stripe', 'hoodie', 'overall', 'dress', 'tee']) : girl ? pick(['tee', 'dress', 'stripe', 'hoodie', 'jacket', 'overall', 'dress', 'sweater', 'cardigan', 'suit']) : pick(['tee', 'stripe', 'hoodie', 'jacket', 'overall', 'tee', 'sweater', 'suit', 'cardigan']),
      jacket: pick(['#6d6875', '#3d5a80', '#7f5539', '#264653', '#b56576', '#2b2b33', '#c9b8a0']),
      kid, old,
    };
    if (!girl && o.top === 'dress') o.top = 'tee';
    o.print = o.top === 'tee' ? Math.floor(R() * 4) : 0;
    o.lash = girl; o.skirt = girl && o.top !== 'dress' && o.top !== 'suit' && R() < .4 ? pick(CLOTH) : null;
    o.socks = girl && R() < .5 ? pick(['#ffffff', '#f7c6d0', '#3d405b']) : null;
    o.glasses = (old ? R() < .6 : R() < .18) ? pick([1, 2, 3]) : 0;
    o.freckle = R() < .16; o.blush = R() < .7 ? 1 : 0; o.mole = R() < .12 ? (R() < .5 ? -1 : 1) : 0;
    o.beard = !girl && !kid ? (old ? pick([0, 1, 2, 3]) : R() < .22 ? pick([1, 2, 3]) : 0) : 0;
    o.earring = girl && R() < .35 ? pick(['#e8c25a', '#ef7fa0', '#a3c4f3']) : null;
    o.bow = girl && (kid || R() < .2) ? pick(['#ef7fa0', '#e07a5f', '#8a6fb5', '#ffffff']) : null;
    o.necklace = girl && R() < .25; o.lip = girl && !kid && R() < .3;
    o.hat = R() < .22 ? pick(HATS.slice(1)) : null; o.hatc = pick(CLOTH);
    if (o.hat && ['bun', 'twin', 'afro', 'hightail'].includes(o.hs)) o.hat = null;
    o.bag = !kid && R() < .25 ? pick(['#7f5539', '#e07a5f', '#2b2b33', '#f2c14e', '#ef8fa8']) : null;
    o.pack = kid && R() < .6 ? pick(['#e07a5f', '#4f7cac', '#f2c14e', '#90be6d', '#ef8fa8']) : null;
    o.scarf = R() < .1 ? pick(CLOTH) : null;
    o.bw = kid ? 1 : pick([.92, 1, 1, 1, 1.08, 1.15]); o.ht = kid ? 1 : old ? .96 : pick([.96, 1, 1, 1.04, 1.07]);
    const n = norm(o);
    // v1.100.41: norm()이 pHair/pTop/pBottom/pFace를 항상 1번(기본 미리보기용 값)으로 채워버려서,
    // 마을사람/직원/손님 등 ART.randomHuman()으로 만든 NPC가 전부 "헤어1+상의1+하의1"인 완전히
    // 같은 모습으로 보이던 문제 -> 시드값으로 머리/상의/하의/얼굴 번호(1~15)도 같이 뽑아서 mychar2(플레이어와
    // 같은 고화질 그림) 쪽도 사람마다 다르게 보이도록 함. (색상은 일부러 안 바꿈 - 마을주민/직원은 기본
    // 색상 고정, 플레이어만 상점에서 직접 염색 가능하게 하기 위함)
    n.pHair = 1 + Math.floor(R() * 15); n.pTop = 1 + Math.floor(R() * 15); n.pBottom = 1 + Math.floor(R() * 15); n.pFace = 1 + Math.floor(R() * 15);
    // v1.100.54: "마을 사람들이 계속 내 캐릭터를 쓰고 있는데?" - 손님(cust)/카페손님/병원환자/마을사람 등
    // ART.randomHuman()으로 생성되는 NPC는 전부 여기를 거치므로, 바로 위에서 채운 mychar2(플레이어용)
    // pHair/pTop/pBottom 대신 전용으로 받은 전신 PNG 30종 중 하나를 시드값으로 고정 배정해서 쓰게 함.
    // (직원은 이후 applyStaffArt()가 staffHead/staffOutfit을 덧씌워서 HUM.draw에서 townChar보다
    // 먼저 체크되므로 영향 없음 - town.js의 마을사람은 자기 시드로 한번 더 덮어써서 그대로 유지됨)
    const townCharFemale = [2, 3, 4, 5, 7, 8, 10, 11, 13, 14, 16, 17, 19, 20, 21, 23, 25, 26, 27, 29];
    const townCharMale = [1, 6, 9, 12, 15, 18, 22, 24, 28, 30];
    const townPool = girl ? townCharFemale : townCharMale;
    n.townChar = townPool[Math.floor(R() * townPool.length)];
    return n;
  }

  const hatOnly = (c, o) => {
    c.save(); c.lineWidth = 1.6; c.strokeStyle = ART.OUT; c.lineJoin = 'round';
    hat(c, norm(Object.assign({}, o, { _n: 0 })), 0, false);
	// ========== 🆕 슬롯별 소품 그리기 (v1.102) ==========
  if (o.acc) {
    // --- 목걸이 (neck) ---
    if (o.acc.neck && (dir === 0 || dir === 1)) {
      const ny = hy + 14;
      c.beginPath();
      c.arc(0, ny, 12, 0.15 * Math.PI, 0.85 * Math.PI);
      c.lineWidth = 2;
      c.strokeStyle = '#f5c542';
      c.stroke();
      if (o.acc.neck === 'pendant') {
        ell(c, 0, ny + 3.5, 2.5, 3, '#ff7aa8', OUT, 0.8);
      } else if (o.acc.neck === 'bell') {
        ell(c, 0, ny + 3.5, 2.5, 2.5, '#ffd23a', OUT, 0.8);
        ell(c, 0, ny + 5, 1, 1, '#6a4a1a');
      } else {
        ell(c, 0, ny + 3.5, 2, 2, '#f5c542', OUT, 0.8);
      }
    }
    // --- 귀걸이 (ear) ---
    if (o.acc.ear && dir === 0) {
      const col = o.acc.ear === 'hoop' ? '#c9962a' : '#f5c542';
      for (const s of [-1, 1]) {
        ell(c, s * 19, hy + 2, 2, 2, col, OUT, 0.7);
      }
    }
    // --- 안경 (face) ---
    if (o.acc.face && dir === 0) {
      const ey = hy + 4;
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
    // --- 목도리 (scarf) ---
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
    // --- 모자 (head) ---
    if (o.acc.head) {
      HUM.hatOnly(c, { hat: o.acc.head });
    }
  }
  // ========== 슬롯별 소품 그리기 끝 ==========
    c.restore();
  };

  // v1.100.32: 옆면/대각선/뒷면 헤어의 정밀 마스크(15종 x 3방향 = 45장)를 캐릭터를 그리기 전에
  // 미리 백그라운드로 로딩 시작해둠(마을 화면처럼 한꺼번에 그림이 많이 몰려서 로딩이 밀릴 때, 마스크가
  // 아직 준비 안 된 상태로 헤어 색이 먼저 그려져 얼굴/목까지 같이 물드는 경우가 있었음 - 마스크를
  // 미리 받아두면 실제로 캐릭터를 그릴 때는 이미 다 로딩되어 있어서 이 문제가 거의 발생하지 않음)
  try {
    for (let i = 1; i <= 15; i++) {
      getPart2Img('hair_side_mask', i);
      getPart2Img('hair_diag_mask', i);
      getPart2Img('hair_back_mask', i);
    }
  } catch (e) {}

  return { hatOnly, draw, random, norm, HAIRS, HAIRCOL, SKINS, CLOTH, PANTS, HATS, forceVector: false, loadCustomParts, saveCustomPart, deleteCustomPart };
})();

ART.human = HUM.draw;
ART.randomHuman = HUM.random;
ART.HAIR = HUM.HAIRCOL;
ART.SKIN = HUM.SKINS;
ART.SHIRT = HUM.CLOTH;
ART.genderOf = function(val) {
  if (val && typeof val === 'object') {
    if (typeof val.lash !== 'undefined') return val.lash ? 'f' : 'm';
    if (typeof val.girl !== 'undefined') return val.girl ? 'f' : 'm';
    if (typeof val.sd !== 'undefined') return ART.genderOf(val.sd);
    if (typeof val.seed !== 'undefined') return ART.genderOf(val.seed);
  }
  const s = (Math.abs(Number(val) || 1) * 2654435761) % 4294967296;
  const r0 = ((s * 1664525 + 1013904223) % 4294967296) / 4294967296;
  return r0 < .55 ? 'f' : 'm';
};
