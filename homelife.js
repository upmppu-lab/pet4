// ================= Home life: daily activities, cooking & meals (state logic) =================
const HOME_RECIPES = [
  { id: 'egg', e: '🍳', cost: 30, xp: 10 }, { id: 'kimbap', e: '🍙', cost: 50, xp: 15 }, { id: 'pasta', e: '🍝', cost: 60, xp: 20 },
  { id: 'curry', e: '🍛', cost: 80, xp: 25 }, { id: 'cake', e: '🍰', cost: 150, xp: 20, rep: 1, hl: 2 }, { id: 'treat', e: '🦴', cost: 40, pet: 1 },
];
const HOME_ACTS = {
  cook: { items: ['h_stove', 'cafe', 'x_island', 'y_kitchen'], dur: 4, e: '🍳' },
  eat: { items: ['h_dining', 'x_island', 'table', 'y_bar', 'y_coffee'], dur: 3.5, e: '🍽️' },
  sleep: { items: ['h_bed', 'h_dbed', 'h_canopy', 'y_bunk'], dur: 3.5, e: '💤' },
  toilet: { items: ['x_toilet'], dur: 3, e: '🚽', hide: 1 },
  shower: { items: ['x_shower', 'bathtub'], dur: 4, e: '🫧', hide: 1 },
  tv: { items: ['tv', 'y_game'], dur: 4, e: '📺' },
  piano: { items: ['h_piano'], dur: 4, e: '🎹' },
  read: { items: ['bookcase', 'h_bookpile', 'desk', 'y_desk2', 'y_shelf'], dur: 3, e: '📖' },
  laundry: { items: ['washer'], dur: 3, e: '🧺' },
  water: { items: ['plant', 'x_monstera', 'y_cactus', 'y_sunflower', 'y_bonsai', 'y_tulip'], dur: 2.5, e: '💧' },
  petfeed: { items: ['x_petbowl'], dur: 3, e: '🥣' },
  rest: { items: ['bench', 'armchair', 'x_beanbag', 'x_rocking', 'y_lsofa', 'y_massage', 'y_hammock'], dur: 3, e: '☕' },
  fire: { items: ['h_fire'], dur: 3, e: '🔥' },
  music: { items: ['radio', 'y_record'], dur: 3, e: '🎵' },
  photo: { items: ['x_photozone'], dur: 2, e: '📸' },
  dress: { items: ['h_wardrobe', 'h_vanity', 'x_dresser', 'y_mirror', 'y_closet', 'y_vanity2'], dur: 0, e: '👗' },
};
const HOME_DAILY_GOAL = 5;
const homeActOf = k => Object.keys(HOME_ACTS).find(a => HOME_ACTS[a].items.includes(k));
function availDish(hh) { const ds = hh.dishes || {}; const list = HOME_RECIPES.filter(R => !R.pet && ds[R.id] > 0); return list.find(x => x.id === hh.lastDish) || list[0] || null; }
(() => {
  const base = HOME.apply;
  const today = (s, h) => { const d = s.clock ? s.clock.day : 0; if (!h.today || h.today.d !== d) h.today = { d, done: {}, bonus: 0 }; return h.today; };
  const has = (h, act) => h.items.some(it => HOME_ACTS[act].items.includes(it.k));
  function credit(s, h, act) {
    const td = today(s, h); if (td.done[act]) return {};
    td.done[act] = 1; const c = 30 + lvE(s) * 2; s.coins += c; HOME.H().addXp(s, 5);
    const n = Object.keys(td.done).length, out = { c, n };
    if (n >= HOME_DAILY_GOAL && !td.bonus) { td.bonus = 1; const b = 300 + lvE(s) * 20; s.coins += b; if (s.x) s.x.tickets = (s.x.tickets || 0) + 1; out.bonus = b; }
    return out;
  }
  const done = (s, h, act, r) => { const cr = credit(s, h, act); if (cr.bonus) { r.msg = 'lifeBonus'; r.p = Object.assign({}, r.p, { c: cr.bonus }); r.fx = 'coin'; } else if (cr.c && !r.msg) { r.msg = 'lifeDone'; r.p = Object.assign({}, r.p, { a: t('la_' + act), c: cr.c, n: cr.n, m: HOME_DAILY_GOAL }); } return r; };
  HOME.apply = (s, a, by) => {
    if (a && a.t === 'hnap') { const r = base(s, a, by); if (r && r.ok) credit(s, s.home, 'sleep'); return r; }
    if (!a || !['hact', 'hcook', 'heat'].includes(a.t)) return base(s, a, by);
    const h = HOME.ensure(s); h.dishes = h.dishes || {};
    if (a.t === 'hcook') {
      const R = HOME_RECIPES.find(x => x.id === a.r); if (!R) return { err: 'gone' };
      if (!has(h, 'cook')) return { err: 'needCookItem' };
      if (R.hl && h.lv < R.hl) return { err: 'homeNeedLv', p: { n: R.hl } };
      if (s.coins < R.cost) return { err: 'notEnough' };
      s.coins -= R.cost; h.dishes[R.id] = (h.dishes[R.id] || 0) + 1; h.lastDish = R.id;
      return done(s, h, 'cook', { ok: 1, fx: 'coin', msg: 'cooked', p: { d: R.e + ' ' + t('rc_' + R.id) } });
    }
    if (a.t === 'heat') {
      const R = HOME_RECIPES.find(x => x.id === a.r); if (!R || R.pet) return { err: 'gone' };
      if (!has(h, 'eat')) return { err: 'needEatItem' };
      if (!(h.dishes[R.id] > 0)) return { err: 'noDish' };
      h.dishes[R.id]--; HOME.H().addXp(s, R.xp); if (R.rep) s.rep = Math.min(REP_MAX, (s.rep || 0) + R.rep);
      h.pets.forEach(p => { p.happy = Math.min(100, (p.happy || 0) + 5); });
      return done(s, h, 'eat', { ok: 1, fx: 'love', msg: 'ate', p: { d: R.e + ' ' + t('rc_' + R.id) } });
    }
    const A = HOME_ACTS[a.a]; if (!A || a.a === 'cook' || a.a === 'eat' || a.a === 'sleep') return { err: 'gone' };
    if (!has(h, a.a)) return { err: 'gone' };
    const r = { ok: 1 };
    if (a.a === 'petfeed') { const tr = (h.dishes.treat || 0) > 0; if (tr) h.dishes.treat--; h.pets.forEach(p => { p.happy = 100; p.hunger = 100; if (p.stress != null) p.stress = Math.max(0, p.stress - (tr ? 30 : 10)); }); r.msg = tr ? 'petTreat' : 'petFed'; r.fx = 'love'; }
    if (a.a === 'shower') { h.pets.forEach(p => { p.clean = 100; }); }
    return done(s, h, a.a, r);
  };
})();
