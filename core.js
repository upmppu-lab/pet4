// ---------- utilities, storage, DOM morph, fx, sound ----------
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = n => Math.floor(n).toLocaleString('en-US');
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
};

let CFG = store.get('ps.cfg', null) || {};
const saveCfg = () => store.set('ps.cfg', CFG);
if (!CFG.id) { CFG.id = uid(); saveCfg(); }

function t(k, p) {
  const L = I18N[CFG.lang || 'ko'] || I18N.ko;
  let s = L[k]; if (s == null) s = I18N.ko[k]; if (s == null) return k;
  if (p) s = s.replace(/\{(\w+)\}/g, (m, x) => p[x] != null ? p[x] : m);
  return s;
}
const spName = id => SPECIES[id] ? SPECIES[id].name[CFG.lang || 'ko'] : id;
const img = id => 'img/' + id + '.jpg';
const pos = id => PHOTO_POS[id] || '50% 45%';
const fmtT = sec => {
  sec = Math.max(0, Math.ceil(sec));
  const m = Math.floor(sec / 60), s = sec % 60;
  return m ? m + t('min') + (s ? ' ' + s + t('sec') : '') : s + t('sec');
};

// Minimal keyed DOM morph: keeps existing elements (no lost taps / image reloads)
function morph(from, to) {
  if (from.nodeType !== to.nodeType || from.nodeName !== to.nodeName) { from.replaceWith(to); return; }
  if (from.nodeType === 3) { if (from.nodeValue !== to.nodeValue) from.nodeValue = to.nodeValue; return; }
  if (from.nodeType !== 1) return;
  const fa = from.attributes, ta = to.attributes;
  for (let i = fa.length - 1; i >= 0; i--) { const n = fa[i].name; if (!to.hasAttribute(n)) from.removeAttribute(n); }
  for (let i = 0; i < ta.length; i++) { const { name, value } = ta[i]; if (from.getAttribute(name) !== value) from.setAttribute(name, value); }
  if (from.tagName === 'INPUT') {
    if (from.type === 'checkbox' || from.type === 'radio') {
      from.checked = to.checked;
    } else if (from.value !== to.value) {
      from.value = to.value;
    }
    return;
  }
  morphChildren(from, to);
}
function morphChildren(from, to) {
  const keyed = new Map();
  for (const c of from.childNodes) if (c.nodeType === 1 && c.dataset.key) keyed.set(c.dataset.key, c);
  const tc = Array.from(to.childNodes);
  for (let i = 0; i < tc.length; i++) {
    const n = tc[i], cur = from.childNodes[i];
    const key = n.nodeType === 1 ? n.dataset.key : null;
    if (key) {
      const m = keyed.get(key);
      if (m) { if (m !== cur) from.insertBefore(m, cur || null); morph(m, n); }
      else from.insertBefore(n, cur || null);
      continue;
    }
    if (!cur) { from.appendChild(n); continue; }
    if (cur.nodeType === 1 && cur.dataset.key) { from.insertBefore(n, cur); continue; }
    morph(cur, n);
  }
  while (from.childNodes.length > tc.length) from.removeChild(from.lastChild);
}
const tpl = document.createElement('template');
function patch(el, html) {
  tpl.innerHTML = html;
  morphChildren(el, tpl.content);
}

// toasts & effects
function toast(msg, cls) {
  const d = document.createElement('div'); d.className = 'toast ' + (cls || ''); d.textContent = msg;
  const box = $('#toasts'); box.appendChild(d); setTimeout(() => d.remove(), 2900);
  while (box.children.length > 3) box.firstChild.remove();
}
let lastPt = { x: innerWidth / 2, y: innerHeight / 2 };
addEventListener('pointerdown', e => { lastPt = { x: e.clientX, y: e.clientY }; }, true);
function fx(emoji, n = 1) {
  for (let i = 0; i < n; i++) {
    const d = document.createElement('div'); d.className = 'fx'; d.textContent = emoji;
    d.style.left = (lastPt.x - 14 + (Math.random() * 50 - 25) * (n > 1)) + 'px';
    d.style.top = (lastPt.y - 20 + (Math.random() * 20 - 10) * (n > 1)) + 'px';
    d.style.animationDelay = (i * 0.08) + 's';
    document.body.appendChild(d); setTimeout(() => d.remove(), 1500);
  }
}
function heartRain() {
  for (let i = 0; i < 18; i++) {
    const d = document.createElement('div'); d.className = 'heartrain';
    d.textContent = ['💕', '💖', '❤️', '💗'][i % 4];
    d.style.left = Math.random() * 92 + 'vw'; d.style.animationDelay = Math.random() * 1.2 + 's';
    d.style.fontSize = (22 + Math.random() * 20) + 'px';
    document.body.appendChild(d); setTimeout(() => d.remove(), 4500);
  }
}
// tiny sound effects
let AC = null;
function beep(notes) {
  if (CFG.mute) return;
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    if (AC.state === 'suspended') AC.resume().catch(() => {});
    let t0 = AC.currentTime;
    notes.forEach(([f, d, type]) => {
      const o = AC.createOscillator(), g = AC.createGain();
      o.type = type || 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.12, t0 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
      o.connect(g).connect(AC.destination); o.start(t0); o.stop(t0 + d + 0.02); t0 += d * 0.8;
    });
  } catch (e) {}
}
const SND = {
  coin: () => beep([[988, .08, 'square'], [1319, .16, 'square']]),
  pop: () => beep([[660, .07], [880, .08]]),
  love: () => beep([[523, .12], [659, .12], [784, .2]]),
  level: () => beep([[523, .1], [659, .1], [784, .1], [1047, .3]]),
  err: () => beep([[220, .15, 'triangle']]),
};
