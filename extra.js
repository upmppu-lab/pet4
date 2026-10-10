// ================= v8: engagement systems (attendance, missions, chests, gifts, seasons, rare coats,
// achievements, album, gacha, rush time, regular-customer stories, mini-game records, co-op goal) =========
const RARE_TYPES = ['gold', 'rainbow', 'star', 'galaxy', 'pearl'];
const rareOf = coat => coat >= 2e9 ? RARE_TYPES[Math.floor((coat - 2e9) / 1e6) % RARE_TYPES.length] : null;
// v9.72: rare-coat pets sell for 6.25x (was 2.5x -- "지금의 2.5배") and ONLY a VIP customer may buy them
const RARE_SELL_MUL = 3.4, VIP_MUL = 1.2; // v9.85 balance: was 6.25 / 1.3 (a rare pet to a VIP fetched ~38,000)
const rareCoat = type => 2e9 + (RARE_TYPES.indexOf(type) < 0 ? Math.floor(Math.random() * 5) : RARE_TYPES.indexOf(type)) * 1e6 + 1 + Math.floor(Math.random() * 999998);
const COSM = ['catears', 'bunny', 'flower', 'crown', 'witch', 'santa', 'sunhat', 'headphones', 'heart'];
// 소품 슬롯 정의
const ACC_SLOTS = ['head', 'face', 'neck', 'ear', 'scarf'];

// 소품별 상세 정의 (슬롯, 아이콘)
const COSM_DEF = {
  // === 모자 (head) ===
  catears:    { slot: 'head',  icon: '🐱', name: '고양이 귀' },
  bunny:      { slot: 'head',  icon: '🐰', name: '토끼 귀' },
  flower:     { slot: 'head',  icon: '🌸', name: '꽃 화관' },
  crown:      { slot: 'head',  icon: '👑', name: '왕관' },
  witch:      { slot: 'head',  icon: '🧙', name: '마녀 모자' },
  santa:      { slot: 'head',  icon: '🎅', name: '산타 모자' },
  sunhat:     { slot: 'head',  icon: '👒', name: '밀짚모자' },
  headphones: { slot: 'head',  icon: '🎧', name: '헤드폰' },
  heart:      { slot: 'head',  icon: '💕', name: '하트 머리띠' },
  // === 🆕 안경 (face) ===
  sunglasses: { slot: 'face',  icon: '🕶️', name: '선글라스' },
  glasses:    { slot: 'face',  icon: '👓', name: '안경' },
  roundglass: { slot: 'face',  icon: '👓', name: '둥근 안경' },
  // === 🆕 목걸이 (neck) ===
  necklace:   { slot: 'neck',  icon: '📿', name: '목걸이' },
  pendant:    { slot: 'neck',  icon: '💎', name: '펜던트' },
  bell:       { slot: 'neck',  icon: '🔔', name: '방울' },
  // === 🆕 귀걸이 (ear) ===
  earring:    { slot: 'ear',   icon: '💠', name: '귀걸이' },
  hoop:       { slot: 'ear',   icon: '⭕', name: '링 귀걸이' },
  // === 🆕 목도리 (scarf) ===
  scarf_red:  { slot: 'scarf', icon: '🧣', name: '빨간 목도리' },
  scarf_blue: { slot: 'scarf', icon: '🧣', name: '파란 목도리' },
};

// 뽑기에서 사용할 전체 소품 ID 목록 (COSM 배열 확장)
// 기존 COSM 배열을 이걸로 교체하거나, 새로 정의합니다.
const COSM_ALL = Object.keys(COSM_DEF);
function seasonOf(d = new Date()) {
  const m = d.getMonth() + 1, day = d.getDate();
  if ((m === 10 && day >= 15) || (m === 11 && day <= 2)) return 'halloween';
  if (m === 12 || (m === 1 && day <= 7)) return 'xmas';
  if ((m === 3 && day >= 15) || m === 4) return 'spring';
  if (m === 7 || m === 8) return 'summer';
  return null;
}
const isWeekend = (d = new Date()) => d.getDay() === 0 || d.getDay() === 6;
const SEASON_DECOR = { halloween: 'pumpkin', xmas: 'xmastree', spring: 'sakura', summer: 'parasol' };
const SEASON_HAT = { halloween: 'witch', xmas: 'santa', spring: 'flower', summer: 'sunhat' };
DECOR.push(
  { id: 'pumpkin', cost: 600, pts: 4, lv: 1, icon: '🎃', season: 'halloween' },
  { id: 'xmastree', cost: 800, pts: 5, lv: 1, icon: '🎄', season: 'xmas' },
  { id: 'sakura', cost: 700, pts: 5, lv: 1, icon: '🌸', season: 'spring' },
  { id: 'parasol', cost: 600, pts: 4, lv: 1, icon: '⛱️', season: 'summer' },
);
const ATTEND = [
  { k: 'coins', n: 100 }, { k: 'tickets', n: 1 }, { k: 'food', n: 10 }, { k: 'coins', n: 200 }, { k: 'tickets', n: 2 }, { k: 'kit', n: 3, t: 1 }, { k: 'rare', n: 1 },
];
const WEEKLY_POOL = [
  { k: 'sell', n: 12 }, { k: 'earn', n: 3000 }, { k: 'mini', n: 10 }, { k: 'reply', n: 8 }, { k: 'serve', n: 25 },
  { k: 'born', n: 3 }, { k: 'photo', n: 5 }, { k: 'rush', n: 2 }, { k: 'feed', n: 40 }, { k: 'story', n: 2 },
];
const CHEST = [{ at: 10, t: 1, c: 300 }, { at: 22, t: 2, c: 800 }, { at: 36, t: 3, c: 1500, rare: 1 }];
const ACH = [
  { id: 'sold', icon: '🤝', get: s => s.stats.sold, goals: [10, 50, 150, 400] },
  { id: 'born', icon: '🍼', get: s => s.stats.born || 0, goals: [3, 15, 50] },
  { id: 'book', icon: '📖', get: s => Object.keys(s.book || {}).length, goals: [15, 35, 63] },
  { id: 'rare', icon: '✨', get: s => Object.keys((s.x && s.x.rareBook) || {}).length, goals: [1, 5, 15] },
  { id: 'reply', icon: '💬', get: s => s.igReplies || 0, goals: [10, 50, 150] },
  { id: 'earned', icon: '🪙', get: s => s.stats.earned, goals: [5000, 50000, 300000] },
  { id: 'level', icon: '🏅', get: s => s.level, goals: [5, 10, 20] },
  { id: 'rep', icon: '⭐', get: s => s.rep || 0, goals: [40, 70, 95] },
  { id: 'days', icon: '📅', get: s => s.stats.days || 0, goals: [7, 30, 100] },
  { id: 'mini3', icon: '🎮', get: s => (s.x && s.x.mini3) || 0, goals: [5, 30, 100] },
  { id: 'photo', icon: '📸', get: s => ((s.x && s.x.album) || []).length, goals: [5, 30, 80] },
  { id: 'rush', icon: '⚡', get: s => (s.x && s.x.rushes) || 0, goals: [1, 10, 40] },
];
const TITLES = [0, 5, 12, 22, 32];
// ---- regular customers with story chains ----
const REGS = [
  { id: 'grandma', look: { skin: '#f1c19d', hair: '#d0d0d6', hs: 'bun', eyes: 2, mouth: 0, brow: 1, nose: 3, fshape: 2, eye: '#4a2c1a', shirt: '#b56576', shirt2: '#fff', pants: '#5e503f', top: 'cardigan', glasses: 1, old: true, blush: 1, shoe: '#7f5539', sd: 11 },
    steps: [{ lv: 1, req: { t: 'none' }, rw: { c: 150 } }, { lv: 2, req: { t: 'feed', line: 'cat', n: 5 }, rw: { c: 250, rep: 2 } }, { lv: 4, req: { t: 'pet', sp: 'hamster' }, rw: { t: 2 } }, { lv: 6, req: { t: 'none' }, rw: { c: 1500, cosm: 'flower', t: 2 } }] },
  { id: 'minsu', look: { skin: '#ffe0c7', hair: '#2b1d16', hs: 'mop', eyes: 3, mouth: 4, brow: 1, nose: 1, fshape: 0, eye: '#3a2418', shirt: '#4f7cac', shirt2: '#f2c14e', pants: '#3d405b', top: 'stripe', kid: true, pack: '#e07a5f', blush: 1, shoe: '#e07a5f', sd: 22 },
    steps: [{ lv: 1, req: { t: 'cat', cat: 'dog' }, rw: { c: 100, t: 1 } }, { lv: 3, req: { t: 'feed', line: 'flake', n: 5 }, rw: { c: 200, t: 1 } }, { lv: 5, req: { t: 'photo', n: 3 }, rw: { t: 2 } }, { lv: 8, req: { t: 'grown', cat: 'dog' }, rw: { c: 900, rep: 3, cosm: 'headphones' } }] },
  { id: 'couple', look: { skin: '#f9d3b4', hair: '#7a4a28', hs: 'wavy', eyes: 1, mouth: 0, brow: 1, nose: 2, fshape: 1, eye: '#6b4a2b', shirt: '#ffffff', shirt2: '#ef8fa8', pants: '#3d405b', top: 'dress', lash: true, lip: true, earring: '#e8c25a', bag: '#ef8fa8', blush: 1, shoe: '#ffffff', sd: 33 },
    steps: [{ lv: 2, req: { t: 'decor', n: 5 }, rw: { c: 250 } }, { lv: 4, req: { t: 'kit', n: 1 }, rw: { t: 1, rep: 1 } }, { lv: 7, req: { t: 'feedtier', tier: 2, n: 5 }, rw: { c: 1200 } }, { lv: 10, req: { t: 'none' }, rw: { t: 3, cosm: 'crown' } }] },
];
const EXTRA = (() => {
  let H = null;
  const X = s => { if (!s.x) s.x = {}; const x = s.x;
    x.tickets = x.tickets || 0; x.attend = x.attend || { n: 0, last: null, pending: false }; if (x.attend.owed == null) { x.attend.owed = Math.max(x.attend.pending ? 1 : 0, ((s.clock && s.clock.day) || 1) - (x.attend.n || 0)); } x.attend.pending = x.attend.owed > 0; /* v1.22: attendance counts GAME days; missed stamps wait (owed) */ x.ach = x.ach || {}; x.album = x.album || []; x.best = x.best || {};
    x.cosm = x.cosm || {}; x.rareBook = x.rareBook || {}; x.regs = x.regs || {}; x.bookDone = x.bookDone || {}; x.mini3 = x.mini3 || 0; x.rushes = x.rushes || 0;
    return x; };
  const weekKey = (d = new Date()) => { const t = new Date(d); t.setHours(0, 0, 0, 0); t.setDate(t.getDate() - ((t.getDay() + 6) % 7)); return H.dayKey(t); };
  function init(h) { H = h; }
  function migrate(s) { X(s); ensureWeek(s); }
  function newDay(s) { const x = X(s); x.attend.owed = (x.attend.owed || 0) + 1; x.attend.pending = true; } // called once per new GAME day
  function ensureWeek(s) {
    const x = X(s), wk = weekKey();
    if (!x.week || x.week.key !== wk) {
      const qs = []; while (qs.length < 3) { const q = H.pick(WEEKLY_POOL); if (!qs.find(z => z.k === q.k)) qs.push({ k: q.k, n: q.k === 'earn' ? Math.round((q.n + lvE(s) * 300) / 100) * 100 : q.n, p: 0, done: false, claimed: false }); }
      x.week = { key: wk, quests: qs, stars: 0, chest: [] };
      x.coop = { key: wk, goal: 60, a: 0, b: 0, claimed: false };
    }
  }
  function qp(s, k, n = 1) { const x = X(s); ensureWeek(s); x.week.quests.forEach(q => { if (q.k === k && !q.done) { q.p = Math.min(q.n, q.p + n); if (q.p >= q.n) q.done = true; } }); }
  function giveFood(s, n, tier) {
    const lines = s.pets.filter(Boolean).map(p => dietOf(p.sp)); const line = lines.length ? H.pick(lines) : 'dog';
    const key = line + ':' + (tier == null ? 2 : tier); s.feed[key] = (s.feed[key] || 0) + n; return line;
  }
  function rareVoucher(s) {
    const un = SPECIES_RAW.filter(r => r[2] <= Math.max(3, s.level) && !TOWN_SP[r[0]] && ['dog', 'cat', 'small'].includes(r[1])).map(r => r[0]);
    const sp = H.pick(un);
    s.offers.unshift({ id: s.seq++, sp, coat: rareCoat(), sex: Math.random() < .5 ? 'm' : 'f', stars: 1, cost: 0, cd: 0, gift: true });
    return sp;
  }
  function reward(s, rw) {
    const x = X(s), out = {};
    if (rw.c) { s.coins += rw.c; out.c = rw.c; }
    if (rw.t) { x.tickets += rw.t; out.t = rw.t; }
    if (rw.rep) { H.addRep(s, rw.rep); out.rep = rw.rep; }
    if (rw.food) { out.food = giveFood(s, rw.food); }
    if (rw.kit) { s.kits += rw.kit; out.kit = rw.kit; }
    if (rw.cosm) { x.cosm[rw.cosm] = 1; out.cosm = rw.cosm; }
    if (rw.rare) { out.rare = rareVoucher(s); }
    return out;
  }
  function tick(s, dt) {
    const x = X(s); ensureWeek(s);
    // rush time
    if (x.rush) {
      x.rush.left -= dt;
      if (x.rush.left <= 0 || s.clock.ph !== 'open') { const r = x.rush; x.rush = null; const bonus = r.combo * (20 + lvE(s) * 2); s.coins += bonus; x.rushes++; qp(s, 'rush'); H.ev(s, { k: 'rushEnd', combo: r.combo, c: bonus }); }
    } else if (s.clock.ph === 'open') {
      x.nextRush = (x.nextRush == null ? H.rnd(150, 300) : x.nextRush) - dt;
      if (x.nextRush <= 0) { x.nextRush = H.rnd(240, 420); x.rush = { left: 40, combo: 0 }; s.nextCust = Math.min(s.nextCust, 1); H.ev(s, { k: 'rushStart' }); }
    }
    // regular customer visits
    if (x.visitor) { x.visitor.left -= dt; if (x.visitor.left <= 0 || s.clock.ph !== 'open') { H.ev(s, { k: 'regLeft', rid: x.visitor.rid }); x.visitor = null; } }
    else if (s.clock.ph === 'open') {
      x.nextVisit = (x.nextVisit == null ? H.rnd(60, 140) : x.nextVisit) - dt;
      if (x.nextVisit <= 0) {
        x.nextVisit = H.rnd(260, 480);
        const cand = REGS.filter(r => { const st = x.regs[r.id] || 0; return st < r.steps.length && r.steps[st].lv <= s.level; });
        if (cand.length) { const r = H.pick(cand); x.visitor = { rid: r.id, step: x.regs[r.id] || 0, left: 170 }; H.ev(s, { k: 'regCome', rid: r.id }); }
      }
    }
  }
  const custBoost = s => { const x = X(s); return (x.rush ? 3 : 1) * (isWeekend() ? 1.35 : 1) * (seasonOf() ? 1.1 : 1); };
  const maxBoost = s => (X(s).rush ? 2 : 0);
  function onPay(s, c, amount) {
    const x = X(s); if (!x.rush || !amount) return 0;
    x.rush.combo++; const b = Math.round(amount * Math.min(BAL.COMBO_CAP, x.rush.combo * BAL.COMBO_STEP)); // v9.98: was +10% per combo, max +50% s.coins += b; H.ev(s, { k: 'rushCombo', n: x.rush.combo, c: b }); return b;
  }
  function reqMet(s, req) {
    switch (req.t) {
      case 'none': return true;
      case 'feed': return [0, 1, 2].reduce((a, k) => a + (s.feed[req.line + ':' + k] || 0), 0) >= req.n;
      case 'feedtier': return Object.keys(s.feed).some(k => k.endsWith(':' + req.tier) && s.feed[k] >= req.n);
      case 'pet': return s.pets.some(p => p && p.sp === req.sp);
      case 'cat': return s.pets.some(p => p && SPECIES[p.sp].cat === req.cat);
      case 'grown': return s.pets.some(p => p && SPECIES[p.sp].cat === req.cat && p.grow >= 1);
      case 'photo': return X(s).album.length >= req.n;
      case 'kit': return s.kits >= req.n;
      case 'decor': return H.decorPts(s) >= req.n;
    }
    return false;
  }
  function payReq(s, req) {
    if (req.t === 'feed') { let n = req.n; for (const k of [0, 1, 2]) { const key = req.line + ':' + k, h = Math.min(n, s.feed[key] || 0); s.feed[key] = (s.feed[key] || 0) - h; n -= h; } }
    if (req.t === 'feedtier') { const key = Object.keys(s.feed).find(k => k.endsWith(':' + req.tier) && s.feed[k] >= req.n); s.feed[key] -= req.n; }
    if (req.t === 'kit') s.kits -= req.n;
  }
  function onMini(s, kind, lv, score) {
    const x = X(s), key = kind + (kind === 'toy' ? lv | 0 : ''), stars = score >= .8 ? 3 : score >= .5 ? 2 : 1;
    if (stars === 3) x.mini3++;
    const prev = x.best[key] || 0;
    if (score > prev + .001) { x.best[key] = +score.toFixed(3); if (prev > 0) { const b = 30 + lvE(s) * 5; s.coins += b; return { record: true, bonus: b }; } }
    return null;
  }
  function onCoopAction(s, by) { const x = X(s); ensureWeek(s); if (!x.coop) return; if (by === s.owner || !by) x.coop.a++; else x.coop.b++; }
  function photo(s, p, auto) {
    const x = X(s);
    x.album.unshift({ id: s.seq++, pid: p.id, name: p.name, sp: p.sp, coat: p.coat || 0, age: H.ageOf(p), mood: ART.moodOf(p), day: s.clock.day, bg: H.rint(0, 5), auto: !!auto });
    if (x.album.length > 80) x.album.length = 80;
    if (!auto) qp(s, 'photo');
  }
  function noteRare(s, p) { const r = rareOf(p.coat || 0); if (r) { X(s).rareBook[p.sp + ':' + r] = 1; H.ev(s, { k: 'rareGet', sp: p.sp, r }); } }
  function gacha(s) {
    const x = X(s); if (x.tickets <= 0) return { err: 'noTicket' };
    x.tickets--;
    const r = Math.random(), lv = s.level;
    let prize;
    const owned = COSM.filter(c => !x.cosm[c]);
    if (r < .03) { s.coins += 2000 + lv * 100; prize = { k: 'jackpot', n: 2000 + lv * 100 }; }
    else if (r < .07) { prize = { k: 'rare', sp: rareVoucher(s) }; }
    else if (r < .25 && owned.length) { const c = H.pick(owned); x.cosm[c] = 1; prize = { k: 'cosm', id: c }; }
    else if (r < .33) { x.tickets += 2; prize = { k: 'tickets', n: 2 }; }
    else if (r < .45) { s.kits += 3; prize = { k: 'kit', n: 3 }; }
    else if (r < .65) { const l = giveFood(s, 10, 2); prize = { k: 'food', line: l, n: 10 }; }
    else { const n = H.rint(100, 400) + lv * 30; s.coins += n; prize = { k: 'coins', n }; }
    return { ok: 1, prize };
  }
  function apply(s, a, by) {
    const x = X(s);
    switch (a.t) {
      case 'attend': { // v1.22: claims every stamp still owed (e.g. day 2 + day 3 at once)
        if (!(x.attend.owed > 0)) { x.attend.pending = false; return { err: 'gone' }; }
        const tot = { c: 0, t: 0, food: 0, kit: 0, rare: 0 }; let k = 0, last = 0;
        while (x.attend.owed > 0 && k < 14) { const slot = x.attend.n % 7, R = ATTEND[slot];
          if (R.k === 'coins') tot.c += R.n + lvE(s) * (slot === 3 ? 30 : 20); if (R.k === 'tickets') tot.t += R.n; if (R.k === 'food') tot.food += R.n; if (R.k === 'kit') { tot.kit += R.n; tot.t += R.t; } if (R.k === 'rare') { tot.rare++; tot.t++; }
          x.attend.owed--; x.attend.n++; k++; last = slot + 1; }
        x.attend.pending = false; x.attend.last = H.dayKey();
        const rw = {}; for (const q in tot) if (tot[q]) rw[q] = tot[q]; const got = reward(s, Object.assign({}, rw, { rare: 0 })); for (let i = 0; i < tot.rare; i++) Object.assign(got, reward(s, { rare: 1 }));
        return { ok: 1, fx: 'coin', got, msg: k > 1 ? 'attendOkN' : 'attendOk', p: { n: last, k } };
      }
      case 'wclaim': {
        ensureWeek(s); const q = x.week.quests[a.i]; if (!q || !q.done || q.claimed) return { err: 'gone' };
        q.claimed = true; x.week.stars += 4; s.coins += 200 + lvE(s) * 40; H.addXp(s, 30 + lvE(s) * 5); return { ok: 1, fx: 'coin' };
      }
      case 'chest': {
        ensureWeek(s); const i = a.i | 0, ch = CHEST[i]; if (!ch || x.week.stars < ch.at || x.week.chest.includes(i)) return { err: 'gone' };
        x.week.chest.push(i); return { ok: 1, fx: 'coin', got: reward(s, { t: ch.t, c: ch.c + lvE(s) * 20, rare: ch.rare }), msg: 'chestOpen' };
      }
      case 'achclaim': {
        const A = ACH.find(z => z.id === a.id); if (!A) return { err: 'gone' };
        const tier = x.ach[A.id] || 0; if (tier >= A.goals.length || A.get(s) < A.goals[tier]) return { err: 'gone' };
        x.ach[A.id] = tier + 1; return { ok: 1, fx: 'coin', got: reward(s, { c: [200, 600, 1500, 4000][tier] + lvE(s) * 20, t: [1, 1, 2, 3][tier] }), msg: 'achOk' };
      }
      case 'bookclaim': {
        const cat = a.cat, sps = SPECIES_RAW.filter(r => r[1] === cat).map(r => r[0]);
        if (x.bookDone[cat] || !sps.every(sp => s.book[sp])) return { err: 'gone' };
        x.bookDone[cat] = 1; return { ok: 1, fx: 'coin', got: reward(s, { c: 800 + lvE(s) * 30, t: 2 }), msg: 'achOk' };
      }
      case 'giftclaim': { if (!x.gift) return { err: 'gone' }; const g = x.gift; x.gift = null; return { ok: 1, fx: 'coin', got: reward(s, g), msg: 'giftOk' }; }
      case 'gacha': {
      if (!s.x) s.x = {};
      if (!s.x.tickets || s.x.tickets <= 0) return { err: 'noTicket' };
      s.x.tickets--;
      
      const r = Math.random();
      let prize;
      
      if (r < 0.30) {
        prize = { k: 'coins', n: 100 + lvE(s) * 20 };
      } else if (r < 0.50) {
        prize = { k: 'food', n: 1 };
      } else if (r < 0.70) {
        prize = { k: 'kit', n: 3 };
      } else if (r < 0.98) {
        // 🆕 소품 뽑기 (COSM_ALL 사용 - 모든 슬롯 포함)
        const unowned = COSM_ALL.filter(id => !(s.x.cosm && s.x.cosm[id]));
        if (!unowned.length) {
          prize = { k: 'coins', n: 500 };
        } else {
          const id = unowned[Math.floor(Math.random() * unowned.length)];
          s.x.cosm = s.x.cosm || {};
          s.x.cosm[id] = 1;
          prize = { k: 'cosm', id };
        }
      } else {
        prize = { k: 'rare', sp: pick(unlocked(s)) };
      }
      
      return { ok: 1, prize, fx: 'coin' };
    }   
      case 'photo': { const p = s.pets.find(q => q && q.id === a.pid); if (!p) return { err: 'gone' }; if (x.lastPhoto && Date.now() - x.lastPhoto < 3000) return { ok: 1 }; x.lastPhoto = Date.now(); photo(s, p); H.addXp(s, 1); return { ok: 1, msg: 'photoOk', fx: 'love' }; }
      case 'storylater': { const v = x.visitor; if (!v || v.rid !== a.rid) return { err: 'gone' }; x.visitor = null; H.ev(s, { k: 'regLeft', rid: v.rid, sad: 1 }); return { ok: 1 }; } // PET TOWN: "다음에요" -> leaves, a bit hurt
      case 'story': {
        const v = x.visitor; if (!v || v.rid !== a.rid) return { err: 'gone' };
        const R = REGS.find(r => r.id === v.rid), st = R.steps[v.step];
        if (!reqMet(s, st.req)) return { err: 'storyNeed' };
        payReq(s, st.req); x.regs[R.id] = v.step + 1; x.visitor = null; qp(s, 'story');
        return { ok: 1, fx: 'coin', got: reward(s, st.rw), msg: 'storyOk', story: { rid: R.id, step: v.step } };
      }
      case 'coopclaim': {
        ensureWeek(s); const c = x.coop; if (!c || c.claimed || c.a + c.b < c.goal || c.b < 15 || c.a < 15) return { err: 'gone' };
        c.claimed = true; return { ok: 1, fx: 'coin', got: reward(s, { t: 3, c: 1000 + lvE(s) * 50, cosm: 'heart' }), msg: 'coopOk' };
      }
    }
    return undefined;
  }
  function welcomeBack(s, awayMin) {
    if (awayMin < 30) return;
    const x = X(s), c = Math.min(Math.round(awayMin * 3), 300 + lvE(s) * 100);
    x.gift = { c, t: awayMin >= 180 ? 1 : 0, food: awayMin >= 90 ? 5 : 0, min: awayMin };
  }
  const titleOf = s => { const x = X(s), n = Object.values(x.ach).reduce((a, b) => a + b, 0); let t = 0; TITLES.forEach((g, i) => { if (n >= g) t = i; }); return t; };
  return { init, migrate, newDay, ensureWeek, qp, tick, custBoost, maxBoost, onPay, onMini, onCoopAction, photo, noteRare, apply, welcomeBack, reqMet, titleOf, weekKey };
})();
