// ---------- Same-WiFi co-op ----------
// Host phone runs a tiny HTTP server (native, port 47810) + UDP discovery (47811).
// Guests POST their actions; the reply is the host's latest shop state.
const PORT = 47810; // PET TOWN: its own port so it never collides with the Pet shop app
const Net = {
  mode: 'solo', hostIp: '', hostName: '', players: {}, replies: {}, pending: [], waiting: {},
  fails: 0, useNative: false, lastOk: 0, seen: [], busy: false, timer: null, lost: false, synced: false, why: '',
  has: () => typeof window.Native !== 'undefined',
};
const asciiJson = o => JSON.stringify(o).replace(/[\u007f-￿]/g, c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));

function myIp() { try { return Net.has() ? Native.getIp() : ''; } catch (e) { return ''; } }

// ----- host -----
function startHost() {
  if (!Net.has()) return false;
  let ip = '';
  try { ip = Native.startHost(CFG.name || 'Host'); } catch (e) { return false; }
  Net.mode = 'host'; Net.hostIp = ip; Net.players = {}; Net.replies = {};
  CFG.coop = 'host'; saveCfg();
  clearInterval(Net.timer); Net.timer = setInterval(hostPump, 400);
  hostPublish();
  return true;
}
function stopHost() {
  try { Native.stopHost(); } catch (e) {}
  clearInterval(Net.timer); Net.mode = 'solo'; Net.players = {}; CFG.coop = ''; saveCfg(); World.setPartners([]);
}
function hostPump() {
  let txt = '';
  try { txt = Native.hostTake(); } catch (e) {}
  const now = Date.now();
  if (txt) {
    txt.split('\n').forEach(line => {
      if (!line.trim()) return;
      let m; try { m = JSON.parse(line); } catch (e) { return; }
      if (!m || !m.id) return;
      const was = Net.players[m.id];
      Net.players[m.id] = { name: m.name || '?', last: now, x: m.pos && m.pos.x, y: m.pos && m.pos.y, look: m.look };
      if (!was) { toast(t('partnerJoined', { name: m.name }), 'partner'); SND.love(); }
      (m.acts || []).forEach(a => {
        if (!a || !a.u || Net.seen.includes(a.u)) return;
        Net.seen.push(a.u); if (Net.seen.length > 300) Net.seen.splice(0, 100);
        const res = G.apply(S, a, m.name || '?');
        const r = Net.replies[m.id] || (Net.replies[m.id] = []);
        r.push({ u: a.u, ...res }); if (r.length > 20) r.shift();
      });
    });
  }
  for (const id in Net.players) {
    if (now - Net.players[id].last > 8000) { toast(t('partnerLeft', { name: Net.players[id].name }), 'partner'); delete Net.players[id]; }
  }
  hostPublish();
  if (txt) afterStateChange();
}
function hostPublish() {
  if (Net.mode !== 'host') return;
  const me = World.me;
  const players = { [CFG.id]: { name: CFG.name, host: 1, x: me && +me.x.toFixed(2), y: me && +me.y.toFixed(2), look: CFG.look } };
  for (const id in Net.players) { const q = Net.players[id]; players[id] = { name: q.name, x: q.x, y: q.y, look: q.look }; }
  try { Native.hostSet(JSON.stringify({ S, players, replies: Net.replies, app: 'petshop' })); } catch (e) {}
}

// ----- guest -----
function discover(cb) {
  if (!Net.has()) return cb(null);
  const ip = myIp();
  const bc = ip && ip.split('.').length === 4 ? ip.split('.').slice(0, 3).join('.') + '.255' : '';
  setTimeout(() => {
    let r = ''; try { r = Native.discover(bc); } catch (e) {}
    if (!r) { try { r = Native.discover(bc); } catch (e) {} }
    if (r && r.indexOf('|') > 0) { const i = r.indexOf('|'); cb({ ip: r.slice(0, i), name: r.slice(i + 1) }); }
    else cb(null);
  }, 60);
}
function joinHost(ip, name) {
  Net.mode = 'guest'; Net.hostIp = ip; Net.hostName = name || ip; Net.fails = 0; Net.lost = false;
  Net.pending = []; Net.lastOk = 0; Net.useNative = false; Net.synced = false; Net.why = ''; Net.joinedAt = Date.now();
  CFG.coop = 'guest'; CFG.hostIp = ip; saveCfg();
  guestSaveOwn();
  clearInterval(Net.timer); Net.timer = setInterval(guestPump, 700);
  guestPump();
}
function leaveHost() {
  Net.pending = []; Net.waiting = {}; Net.synced = false; Net.lost = false; Net.fails = 0;
  clearInterval(Net.timer); Net.mode = 'solo'; CFG.coop = ''; saveCfg();
  S = loadOwnSave(); lastEv = maxEv(S); World.reset(); World.setPartners([]);
  afterStateChange();
}
function guestSend(a) {
  a.u = uid(); Net.pending.push(a);
  Net.waiting[a.u] = 1;
  guestPump();
}
async function guestPump() {
  if (Net.mode !== 'guest' || Net.busy) return;
  Net.busy = true;
  const acts = Net.pending.slice();
  const me = World.me;
  const body = asciiJson({ id: CFG.id, name: CFG.name, lang: CFG.lang, acts, look: CFG.look, pos: me ? { x: +me.x.toFixed(2), y: +me.y.toFixed(2) } : null });
  const url = 'http://' + Net.hostIp + ':' + PORT + '/';
  let txt = null;
  try {
    if (!Net.useNative) {
      const ctl = new AbortController(); const to = setTimeout(() => ctl.abort(), 8000); // a big shop's state takes a while over Wi-Fi (was 3s)
      const r = await fetch(url, { method: 'POST', body, headers: { 'Content-Type': 'text/plain' }, signal: ctl.signal, cache: 'no-store' });
      clearTimeout(to);
      txt = await r.text();
    } else txt = Native.guestSend(url, body);
  } catch (e) { txt = null; }
  if (txt == null && !Net.useNative && Net.fails >= 2 && Net.has()) {
    try { txt = Native.guestSend(url, body); if (txt != null) Net.useNative = true; } catch (e) {}
  }
  Net.busy = false;
  if (Net.mode !== 'guest') return;
  // v9.71: every kind of bad reply now counts as a failure WITH a reason. Before, a reply without a shop in it (the
  // native server answers '{}' until a host publishes -- e.g. the other phone has the server running but isn't hosting,
  // or the TEST app on it grabbed the port) was silently ignored: the guest showed "connected" forever and never moved.
  const fail = why => { Net.fails++; Net.why = why; if (Net.fails >= 3 && !Net.lost) { Net.lost = true; render(); if (typeof renderPanel === 'function' && panel && panel.type === 'coop') renderPanel(true); }
    // v9.80: a guest that can't reach its host used to stay a guest forever -- every action (adopting a pet, ...) was sent to
    // nobody and the clock stood still ("분양받고 트럭을 기다려도 안 와요"). Now it falls back to its own shop.
    const since = Date.now() - (Net.lastOk || Net.joinedAt || Date.now());
    if ((!Net.synced && Net.fails >= 4) || (Net.synced && since > 25000)) { leaveHost(); toast(t('coopFallback') + ' (' + t('coopWhy_' + why) + ')'); if (typeof renderPanel === 'function' && panel && panel.type === 'coop') renderPanel(true); }
  };
  if (txt == null || txt === '') return fail('noreply');
  let d; try { d = JSON.parse(txt); } catch (e) { return fail('bad'); }
  if (!d || !d.S || !d.S.pets) return fail('nohost');
  Net.pending = Net.pending.filter(a => !acts.includes(a));
  Net.fails = 0; Net.lastOk = Date.now(); Net.why = '';
  const firstSync = !Net.synced; Net.synced = true;
  if (Net.lost) { Net.lost = false; }
  if (firstSync && typeof panel !== 'undefined' && panel && panel.type === 'coop') setTimeout(() => { if (panel && panel.type === 'coop') closePanel(); toast(t('coopArrived', { name: Net.hostName })); }, 50); // you are now in the partner's village
  const first = !S || S.__guest !== Net.hostIp;
  S = d.S; S.__guest = Net.hostIp;
  Net.players = d.players || {};
  for (const id in Net.players) if (Net.players[id].host) Net.hostName = Net.players[id].name;
  if (first) { lastEv = maxEv(S); World.reset(); }
  ((d.replies || {})[CFG.id] || []).forEach(r => {
    if (!Net.waiting[r.u]) return;
    delete Net.waiting[r.u];
    showResult(r);
  });
  afterStateChange();
}
