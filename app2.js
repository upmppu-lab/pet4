// ================= v8 UI: mission hub, attendance, achievements, gacha, album, regular stories, gifts =================
const XS = () => (S && S.x) || {};
function gotText(g) {
  const p = [];
  if (g.c) p.push('🪙' + fmt(g.c)); if (g.t) p.push('🎟️×' + g.t); if (g.rep) p.push('⭐+' + g.rep); if (g.kit) p.push('🧴×' + g.kit);
  if (g.food) p.push(FEED_LINES[g.food].icon + ' ' + L10(FEED_LINES[g.food]) + ' ' + L10(FEED_TIERS[2]));
  if (g.cosm) p.push('🎀 ' + t('cosm_' + g.cosm)); if (g.rare) p.push('✨ ' + t('rareVoucher', { sp: spName(g.rare) }));
  return '🎁 ' + p.join(' · ');
}
const tabClaims = () => { const x = XS(), o = { mission: 0, attend: 0, ach: 0, gacha: 0 };
  o.mission = (S.daily ? S.daily.quests.filter(q => q.done && !q.claimed).length : 0) + (x.week ? x.week.quests.filter(q => q.done && !q.claimed).length + CHEST.filter((c, i) => x.week.stars >= c.at && !x.week.chest.includes(i)).length : 0);
  o.attend = x.attend ? (x.attend.owed > 0 ? x.attend.owed : x.attend.pending ? 1 : 0) : 0;
  o.ach = ACH.filter(A => { const tr = (x.ach || {})[A.id] || 0; return tr < A.goals.length && A.get(S) >= A.goals[tr]; }).length;
  return o; };
const claimCount = () => {
  const x = XS(); let n = S.daily ? S.daily.quests.filter(q => q.done && !q.claimed).length : 0;
  if (x.attend && (x.attend.owed > 0 || x.attend.pending)) n += Math.max(1, x.attend.owed || 0);
  if (x.week) { n += x.week.quests.filter(q => q.done && !q.claimed).length; n += CHEST.filter((c, i) => x.week.stars >= c.at && !x.week.chest.includes(i)).length; }
  n += ACH.filter(A => { const tr = (x.ach || {})[A.id] || 0; return tr < A.goals.length && A.get(S) >= A.goals[tr]; }).length;
  return n;
};
const RW_ICON = { coins: '🪙', tickets: '🎟️', food: '🌟', kit: '🧴', rare: '✨' };
PANELS.quest = m => {
  const x = XS(), tab = m.tab || (x.attend && x.attend.pending ? 'attend' : 'mission');
  const TABS = [['mission', '🎯 ' + t('tabMission')], ['attend', '📅 ' + t('tabAttend')], ['ach', '🏆 ' + t('tabAch')], ['gacha', '🎁 ' + t('tabGacha')]];
  const TB = tabClaims(); // v1.22: red count on every tab that still has something to claim
  let h = `<div class="tabs">${TABS.map(([k, l]) => `<button class="${tab === k ? 'on' : ''}" data-a="stab" data-v="${k}" style="position:relative">${l}${TB[k] ? `<span class="badge">${TB[k]}</span>` : ''}</button>`).join('')}</div>`;
  if (tab === 'attend') {
    const n = x.attend.n || 0, cur = n % 7;
    h += `<div class="m">${t('attendDesc')}</div><div class="attend">${ATTEND.map((R, i) => {
      const done = i < cur || (!x.attend.pending && i === cur - 0 && false), today = x.attend.pending && i >= cur && i < cur + Math.max(1, x.attend.owed || 0), past = i < cur;
      return `<div class="aday ${past ? 'done' : ''} ${today ? 'today' : ''} ${i === 6 ? 'big' : ''}"><small>${t('dayN', { n: i + 1 })}</small><div class="ai">${RW_ICON[R.k]}</div><b>${R.k === 'coins' ? '🪙' + (R.n + lvE(S) * (i === 3 ? 30 : 20)) : R.k === 'tickets' ? '×' + R.n : R.k === 'food' ? '×' + R.n : R.k === 'kit' ? '×3 +🎟️' : t('rareShort')}</b>${past ? '<i>✔</i>' : ''}</div>`;
    }).join('')}</div>
    ${x.attend.pending ? `<button class="btn o block" data-a="xattend">🎁 ${x.attend.owed > 1 ? t('attendClaimN', { n: x.attend.owed }) : t('attendClaim')}</button>` : `<div class="m center">${t('attendDone', { n })}</div>`}`;
  } else if (tab === 'mission') {
    h += `<div class="t">☀️ ${t('dailyM')}</div>`;
    (S.daily ? S.daily.quests : []).forEach((q, i) => {
      h += `<div class="li"><div class="ic">${{ feed: '🍖', clean: '🧽', play: '🎾', sell: '🤝', earn: '🪙', buy: '🐾', groom: '✂️', born: '🍼', serve: '🧾', trick: '🎪', mini: '🎮', great: '💯' }[q.k]}</div><div class="grow"><div class="t">${t('q_' + q.k, { n: fmt(q.n) })}</div>
        ${bar(q.p / q.n * 100, 'linear-gradient(#b8e89a,#5cae3c)', fmt(q.p) + ' / ' + fmt(q.n))}<div class="m">🪙 ${q.r} · ⭐2</div></div>
        ${q.claimed ? '✅' : `<button class="btn sm ${q.done ? '' : 'dis'}" data-a="claim" data-v="${i}">${t('claim')}</button>`}</div>`;
    });
    if (x.week) {
      h += `<div class="t" style="margin-top:10px">📆 ${t('weeklyM')}</div>`;
      x.week.quests.forEach((q, i) => {
        h += `<div class="li"><div class="ic">${{ sell: '🤝', earn: '🪙', mini: '🎮', reply: '💬', serve: '🧾', born: '🍼', photo: '📸', rush: '⚡', feed: '🍖', story: '📖' }[q.k]}</div><div class="grow"><div class="t">${t('wq_' + q.k, { n: fmt(q.n) })}</div>
          ${bar(q.p / q.n * 100, 'linear-gradient(#a8d4ff,#4f7cac)', fmt(q.p) + ' / ' + fmt(q.n))}<div class="m">🪙 ${200 + lvE(S) * 40} · ⭐4</div></div>
          ${q.claimed ? '✅' : `<button class="btn sm ${q.done ? '' : 'dis'}" data-a="xwclaim" data-v="${i}">${t('claim')}</button>`}</div>`;
      });
      const mx = CHEST[CHEST.length - 1].at;
      h += `<div class="card"><div class="t">🧰 ${t('chestTitle')} · ⭐ ${x.week.stars}</div>${bar(Math.min(100, x.week.stars / mx * 100), 'linear-gradient(#ffe08a,#f0b43c)', x.week.stars + ' / ' + mx)}
        <div class="chests">${CHEST.map((c, i) => { const open = x.week.chest.includes(i), ready = x.week.stars >= c.at && !open; return `<button class="chest ${open ? 'open' : ''} ${ready ? 'ready' : ''}" data-a="xchest" data-v="${i}"><span>${open ? '📭' : i === 2 ? '💎' : '🧰'}</span><small>⭐${c.at}</small></button>`; }).join('')}</div><div class="m">${t('chestDesc')}</div></div>`;
      if (x.coop) {
        const c = x.coop, tot = c.a + c.b;
        h += `<div class="card"><div class="t">💞 ${t('coopGoal')}</div>${bar(Math.min(100, tot / c.goal * 100), 'linear-gradient(#ffb3c7,#ee2a7b)', tot + ' / ' + c.goal)}
          <div class="m">${t('coopMission', { a: c.a, b: c.b })}</div>${c.claimed ? '✅' : `<button class="btn o block ${tot >= c.goal && c.a >= 15 && c.b >= 15 ? '' : 'dis'}" data-a="xcoop">💞 ${t('claim')}</button>`}</div>`;
      }
    }
    h += `<div class="t" style="margin-top:10px">📊 ${t('stats')}</div><div class="grid2">` + [['st_sold', S.stats.sold, '🤝'], ['st_born', S.stats.born || 0, '🍼'], ['st_earned', fmt(S.stats.earned), '🪙'], ['st_fed', S.stats.fed, '🍖']]
      .map(([k, v, ic]) => `<div class="card center"><div>${ic}</div><div class="t">${v}</div><div class="m">${t(k)}</div></div>`).join('') + '</div>';
  } else if (tab === 'ach') {
    const ti = EXTRA.titleOf(S);
    h += `<div class="card center"><div class="m">${t('titleNow')}</div><div class="t" style="font-size:17px">${['🌱', '🌿', '🌟', '👑', '💎'][ti]} ${t('title' + ti)}</div></div>`;
    ACH.forEach(A => {
      const tr = (x.ach || {})[A.id] || 0, max = tr >= A.goals.length, goal = A.goals[Math.min(tr, A.goals.length - 1)], v = A.get(S), ready = !max && v >= goal;
      h += `<div class="li"><div class="ic">${A.icon}</div><div class="grow"><div class="t">${t('ach_' + A.id, { n: fmt(goal) })} <span class="m">${'🏅'.repeat(tr)}${'▫️'.repeat(A.goals.length - tr)}</span></div>${max ? `<div class="m">${t('achMax')}</div>` : bar(Math.min(100, v / goal * 100), 'linear-gradient(#ffe08a,#f0b43c)', fmt(Math.min(v, goal)) + ' / ' + fmt(goal))}</div>
        ${ready ? `<button class="btn o sm" data-a="xach" data-v="${A.id}">${t('claim')}</button>` : ''}</div>`;
    });
    h += `<div class="t" style="margin-top:10px">📖 ${t('bookComplete')}</div>`;
    CATS.forEach(cat => {
      const sps = SPECIES_RAW.filter(r => r[1] === cat), got = sps.filter(r => S.book[r[0]]).length, done = (x.bookDone || {})[cat];
      h += `<div class="li"><div class="ic">${CAT_ICON[cat]}</div><div class="grow"><div class="t">${t('f_' + cat)} ${got}/${sps.length}</div>${bar(got / sps.length * 100, 'linear-gradient(#b8e89a,#5cae3c)', got + '/' + sps.length)}</div>${done ? '✅' : `<button class="btn sm ${got >= sps.length ? 'o' : 'dis'}" data-a="xbook" data-v="${cat}">🎟️2</button>`}</div>`;
    });
  } else {
    const tk = x.tickets || 0, last = m.last;
    h += `<div class="gacha"><div class="gbox ${m.anim ? 'shake' : ''}">🎁</div><div class="t">🎟️ ${t('tickets')}: ${tk}</div>
      ${last ? `<div class="gprize">${prizeText(last)}</div>` : `<div class="m">${t('gachaDesc')}</div>`}
      <button class="btn o block ${tk ? '' : 'dis'}" data-a="xgacha">🎁 ${t('gachaOpen')} (🎟️1)</button>
      <div class="m">${t('gachaWhere')}</div>
      <div class="t" style="margin-top:8px">🎀 ${t('cosmTitle')}</div><div class="chips">${COSM.map(c => (x.cosm || {})[c] ? `<button class="chip ${CFG.look && CFG.look.hat === c ? 'on' : ''}" data-a="wearcosm" data-v="${c}">${CFG.look && CFG.look.hat === c ? '✓ ' : '👒 '}${t('cosm_' + c)}</button>` : `<span class="chip lockc">🔒 ${t('cosm_' + c)}</span>`).join('')}</div><div class="m">${t('cosmTap')}</div></div>`;
  }
  return frameHTML('📜 ' + t('questTitle'), h);
};
function prizeText(p) {
  if (!p) return '';
  if (p.k === 'coins') return '🪙 ' + fmt(p.n);
  if (p.k === 'jackpot') return '💰 JACKPOT! 🪙 ' + fmt(p.n);
  if (p.k === 'rare') return '✨ ' + t('rareVoucher', { sp: spName(p.sp) });
  if (p.k === 'cosm') return '🎀 ' + t('cosm_' + p.id) + ' — ' + t('cosmGot');
  if (p.k === 'tickets') return '🎟️ ×' + p.n;
  if (p.k === 'kit') return '🧴 ×' + p.n;
  if (p.k === 'food') {
    const line = FEED_LINES[p.line];
    if (!line) return '🌟 ×' + (p.n || 1);
    return line.icon + ' ' + L10(line) + ' ' + L10(FEED_TIERS[2]) + ' ×' + p.n;
  }
  return '🎁';
}
PANELS.gift = () => { const g = XS().gift; if (!g) return ''; return frameHTML('💌 ' + t('giftTitle'), `<div class="center"><div style="font-size:54px">🎁</div><div class="t">${t('giftText2', { m: g.min })}</div>
  <div class="m">${[g.c ? '🪙 ' + fmt(g.c) : '', g.t ? '🎟️ ×' + g.t : '', g.food ? '🌟 ' + t('premiumFood') + ' ×' + g.food : ''].filter(Boolean).join(' · ')}</div>
  <button class="btn o block" data-a="xgift">🎁 ${t('claim')}</button></div>`, true); };
function reqText(req) {
  switch (req.t) {
    case 'none': return t('req_none');
    case 'feed': return t('req_feed', { f: L10(FEED_LINES[req.line]), n: req.n });
    case 'feedtier': return t('req_feedtier', { n: req.n });
    case 'pet': return t('req_pet', { sp: spName(req.sp) });
    case 'cat': return t('req_cat', { c: t('f_' + req.cat) });
    case 'grown': return t('req_grown', { c: t('f_' + req.cat) });
    case 'photo': return t('req_photo', { n: req.n });
    case 'kit': return t('req_kit', { n: req.n });
    case 'decor': return t('req_decor', { n: req.n });
  }
  return '';
}
PANELS.story = () => {
  const v = XS().visitor; if (!v) return '';
  const R = REGS.find(r => r.id === v.rid), st = R.steps[v.step], ok = EXTRA.reqMet(S, st.req);
  return frameHTML('💬 ' + t('reg_' + R.id), `<div class="story"><img src="${PIC.body(R.look, 110, 150, 1.6, 'happy')}"><div class="bubble2">${esc(t('st_' + R.id + '_' + v.step, { shop: S.shop, me: CFG.name }))}</div></div>
    <div class="card"><div class="t">📝 ${t('reqTitle')}</div><div class="m">${reqText(st.req)} ${ok ? '✅' : '❌'}</div><div class="m">🎁 ${gotText({ c: st.rw.c, t: st.rw.t, rep: st.rw.rep, cosm: st.rw.cosm }).replace('🎁 ', '')}</div></div>
    <div class="dots">${R.steps.map((z, i) => `<i class="${i < v.step ? 'on' : ''}"></i>`).join('')}</div>
    <button class="btn o block ${ok ? '' : 'dis'}" data-a="xstory" data-v="${R.id}">${st.req.t === 'none' ? '😊 ' + t('storyTalk') : '🤝 ' + t('storyGive')}</button><button class="btn g block" data-a="xlater" data-v="${R.id}">${t('storyLater')}</button>`);
};
// ---- album ----
const APIC = new Map();
function albumPic(ph, sz) {
  const key = ph.id + ':' + sz; if (APIC.has(key)) return APIC.get(key);
  const cv = document.createElement('canvas'); cv.width = sz * 2; cv.height = sz * 2; const c = cv.getContext('2d'); c.scale(2 * sz / 240, 2 * sz / 240);
  const bgs = [['#fde3ea', '#fbd0dc'], ['#dff0e6', '#c9e5d6'], ['#dcebf7', '#c4ddf0'], ['#fff0c9', '#ffe3a0'], ['#ece3fb', '#dccff5'], ['#f6ead6', '#efdcc0']][ph.bg % 6];
  const g = c.createLinearGradient(0, 0, 0, 240); g.addColorStop(0, bgs[0]); g.addColorStop(1, bgs[1]); c.fillStyle = g; c.fillRect(0, 0, 240, 240);
  for (let i = 0; i < 12; i++) { c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.arc((i * 67) % 240, (i * 41) % 170, 6 + (i % 3) * 4, 0, 7); c.fill(); }
  ART.ell(c, 120, 205, 70, 16, 'rgba(0,0,0,.08)');
  c.save(); c.translate(120, 205); const k = 2.6 * (.55 + .45 * (ph.age == null ? 1 : ph.age)); c.scale(k, k); ART.pet(c, ph.sp, { t: 1.4, seed: ph.coat, age: ph.age, mood: ph.mood === 'calm' ? 'love' : ph.mood }); c.restore();
  const url = cv.toDataURL('image/jpeg', .85); APIC.set(key, url); return url;
}
PANELS.book = m => {
  const tab = m.tab || 'book', x = XS();
  const TABS = [['book', '📖 ' + t('book')], ['rare', '✨ ' + t('rareBook')], ['album', '📸 ' + t('album')]];
  let h = `<div class="tabs">${TABS.map(([k, l]) => `<button class="${tab === k ? 'on' : ''}" data-a="stab" data-v="${k}">${l}</button>`).join('')}</div>`;
  if (tab === 'book') h += `<div class="m">${t('bookSub', { a: Object.keys(S.book).length, b: SPECIES_RAW.length })}</div><div class="grid3">` + SPECIES_RAW.map(([id]) => `<div class="tile ${S.book[id] ? '' : 'lock'}"><img src="${PIC.pet(id)}" style="width:64px;height:64px"><div class="m">${S.book[id] ? esc(spName(id)) : '???'}</div></div>`).join('') + '</div>';
  else if (tab === 'rare') {
    const rb = Object.keys(x.rareBook || {});
    h += `<div class="m">${t('rareDesc', { n: rb.length })}</div><div class="grid3">${RARE_TYPES.map(r => `<div class="tile"><img src="${PIC.pet('kitten', false, rareCoat(r) - (rareCoat(r) % 1e6) + 1, 'love')}" style="width:64px;height:64px"><div class="m">${t('rare_' + r)}</div></div>`).join('')}</div>
      <div class="t" style="margin-top:8px">${t('rareMine')}</div>${rb.length ? `<div class="grid3">${rb.map(k => { const [sp, r] = k.split(':'); return `<div class="tile"><img src="${PIC.pet(sp, false, 2e9 + RARE_TYPES.indexOf(r) * 1e6 + 7, 'love')}" style="width:64px;height:64px"><div class="m">${t('rare_' + r)} ${esc(spName(sp))}</div></div>`; }).join('')}</div>` : `<div class="m">${t('rareNone')}</div>`}`;
  } else {
    const al = x.album || [];
    const byPet = {}; al.forEach(p => { (byPet[p.pid] = byPet[p.pid] || []).push(p); });
    const grow = Object.values(byPet).filter(a => a.length >= 2 && a[0].age - a[a.length - 1].age > .2);
    h += `<div class="m">${t('albumDesc')}</div>`;
    if (grow.length) h += `<div class="t">🌱 ${t('growCompare')}</div>` + grow.slice(0, 4).map(a => `<div class="gcmp"><div><img src="${albumPic(a[a.length - 1], 110)}"><small>${t('dayN', { n: a[a.length - 1].day })}</small></div><span>➜</span><div><img src="${albumPic(a[0], 110)}"><small>${t('dayN', { n: a[0].day })}</small></div><b>${esc(a[0].name)}</b></div>`).join('');
    h += al.length ? `<div class="igrid">${al.map(p => `<button data-a="xphoto" data-v="${p.id}"><img src="${albumPic(p, 110)}"><span class="cc">${esc(p.name)}</span></button>`).join('')}</div>` : `<div class="m center">${t('albumEmpty')}</div>`;
  }
  return frameHTML('📖 ' + t('book'), h);
};
PANELS.photo = m => { const p = (XS().album || []).find(z => z.id === m.id); if (!p) return ''; return frameHTML('📸 ' + esc(p.name), `<img src="${albumPic(p, 300)}" style="width:100%;border-radius:12px;border:6px solid #fff;box-shadow:0 3px 10px rgba(0,0,0,.15)"><div class="m center">${esc(spName(p.sp))} · ${t('dayN', { n: p.day })}${rareOf(p.coat) ? ' · ✨' + t('rare_' + rareOf(p.coat)) : ''}</div>`); };
PANELS.toylv = m => { const b = XS().best || {}; return frameHTML('🪶 ' + t('miniToy'), `<div class="m">${t('toyPick')}</div>` + [0, 1, 2].map(k => { const sc = b['toy' + k] || 0, st = sc >= .8 ? 3 : sc >= .5 ? 2 : sc > 0 ? 1 : 0; return `<button class="li" data-a="toygo" data-v="${m.pid}" data-w="${k}"><div class="ic">${['🙂', '😆', '🔥'][k]}</div><div class="grow"><div class="t">${t('toyLv' + k)} <span class="m">${'⭐'.repeat(st)}${'☆'.repeat(3 - st)}</span></div><div class="m">${t('toyLvD' + k)}</div>${sc ? `<div class="m">🏆 ${t('bestRec')}: ${Math.round(sc * 100)}%</div>` : ''}</div></button>`; }).join('')); };
// ---- actions ----
const XACT = Object.assign(window.XACT || {}, {
  xattend: () => { act({ t: 'attend' }); closePanel(); }, // v9.79: the panel closes by itself once today's reward is claimed (the reward toast still shows)
  xwclaim: v => { act({ t: 'wclaim', i: +v }); renderPanel(true); },
  xchest: v => { act({ t: 'chest', i: +v }); renderPanel(true); },
  xach: v => { act({ t: 'achclaim', id: v }); renderPanel(true); },
  xbook: v => { act({ t: 'bookclaim', cat: v }); renderPanel(true); },
  xcoop: () => { act({ t: 'coopclaim' }); renderPanel(true); },
  xgift: () => { act({ t: 'giftclaim' }); closePanel(); if (XS().attend && XS().attend.pending) openPanel({ type: 'quest', tab: 'attend' }); },
  xgacha: () => {
    if (Net.mode === 'guest') { act({ t: 'gacha' }); return; }
    panel.anim = 1; renderPanel(true); SFX.jingle && SFX.jingle();
    setTimeout(() => { const r = G.apply(S, { t: 'gacha', lang: CFG.lang }, CFG.name); if (r.err) { showResult(r); panel.anim = 0; renderPanel(true); return; } SFX.tada && SFX.tada(); panel.anim = 0; panel.last = r.prize; afterStateChange(); if (Net.mode === 'host') hostPublish(); renderPanel(true); }, 900);
  },
  xstory: v => { act({ t: 'story', rid: v }); closePanel(); },
  xlater: v => { const a = World.actors.get('reg_' + v); if (a) { a.sadGo = 1; a.face = 1; } act({ t: 'storylater', rid: v }); closePanel(); },
  xphoto: v => openPanel({ type: 'photo', id: +v }),
  wearcosm: v => { CFG.look = Object.assign({}, CFG.look, { hat: CFG.look.hat === v ? null : v }); CFG.look = HUM.norm(Object.assign({}, CFG.look, { _n: 0 })); delete CFG.look._n; saveCfg(); SND.pop(); renderPanel(true); render(); toast(CFG.look.hat ? '👒 ' + t('cosmWorn', { n: t('cosm_' + v) }) : t('cosmOff')); },
// ========== 🆕 슬롯별 소품 착용 (v1.102) ==========
  setacc: (slot, id) => {
    const accId = id || null;
    // 뽑기로 획득하지 않은 소품은 착용 불가
    if (accId && !(S.x && S.x.cosm && S.x.cosm[accId])) {
      toast('🔒 ' + (CFG.lang === 'ru' ? 'Сначала получите в гаче' : '뽑기에서 먼저 획득하세요'));
      return;
    }
    // CFG.look.acc에 슬롯별로 저장
    CFG.look.acc = CFG.look.acc || {};
    CFG.look.acc[slot] = accId;
    saveCfg();
    // 캐릭터 미리보기 & 게임 화면 갱신
    if (typeof rerenderChar === 'function') rerenderChar();
    if (typeof render === 'function') render();
    SND.pop();
    // 알림
    if (accId) {
      toast('✨ ' + (t('cosm_' + accId) || accId) + ' ' + (CFG.lang === 'ru' ? 'надето' : '착용!'));
    } else {
      toast(CFG.lang === 'ru' ? 'Снято' : '해제했어요');
    }
  },
  // ========== setacc 끝 ==========  
  photo: v => { act({ t: 'photo', pid: v }); const pa = World.petActor(v); const pos = pa ? World.screenOf(pa) : [innerWidth / 2, innerHeight / 2]; fxAt(pos[0], pos[1], '📸'); const f = document.createElement('div'); f.className = 'flash'; document.body.appendChild(f); setTimeout(() => f.remove(), 400); },
});
if (typeof window !== 'undefined') window.XACT = XACT;
const XEV = {
  attendReady: () => { SND.love(); toast('📅 ' + t('attendToast')); },
  rushStart: () => { SFX.alarm && SFX.alarm(); toast('⚡ ' + t('rushStartT')); },
  rushCombo: e => { if (e.n >= 2) toast('⚡ ' + t('rushComboT', { n: e.n, c: e.c })); },
  rushEnd: e => { SFX.tada && SFX.tada(); toast('⚡ ' + t('rushEndT', { n: e.combo, c: e.c })); },
  regCome: e => { SND.love(); toast('💬 ' + t('regComeT', { n: t('reg_' + e.rid) })); },
  regLeft: e => { if (e.sad) { const a = World.actors.get('reg_' + e.rid); if (a) a.sadGo = 1; toast('😢 ' + t('regSadT', { n: t('reg_' + e.rid) })); return; } toast('👋 ' + t('regLeftT', { n: t('reg_' + e.rid) })); },
  rareGet: e => { SFX.tada && SFX.tada(); toast('✨ ' + t('rareGetT', { r: t('rare_' + e.r), sp: spName(e.sp) })); },
};
Object.assign(XACT, HOME_ACT); Home.init();
VIEW.r = (CFG.rot | 0) % 4;
// v9.97: the village notice board -- weather, news and villagers' requests (deliver farm produce for coins)
PANELS.vboard = () => {
  VILLAGE.tick(S); const b = S.village.board, day = S.clock ? S.clock.day : 1, L = I18N[CFG.lang] || I18N.ko, who = L.vwho || I18N.ko.vwho, pr = (S.farm && S.farm.produce) || {};
  let h = `<div class="card"><div class="t">${t('vbSeason', { s: t('vseason' + VILLAGE.season(day)), d: day })}</div><div class="m">${t('vbWeather')}: <b>${t('vw_' + b.weather)}</b></div></div>`;
  h += `<div class="card"><div class="t">📰 ${t('vbNews')}</div>${b.news.map(n => `<div class="m">· ${t('vn' + n)}</div>`).join('')}</div>`;
  h += `<div class="card"><div class="t">🙋 ${t('vbReqs')}</div>`;
  { const tk = ((b.bonus || 0) + 1) % 3 === 0; // one bonus line per day's batch (today, and yesterday's while it can still be finished)
    for (const d of [day - 1, day]) { const L = b.reqs.filter(q => q.day === d); if (!L.length) continue; const nm = t(d === day ? 'vbToday' : 'vbYday');
      h += `<div class="m" style="margin:2px 0 6px"><b>${(b.paid || []).includes(d) ? t('vbBonusGot', { d: nm }) : t('vbBonusBar', { d: nm, a: L.filter(q => q.done).length, c: fmt(VILLAGE.bonusOf(S)) }) + (tk ? t('vbBonusT') : '')}</b></div>`; } }
  const list = b.reqs.slice().sort((a, c) => (a.done - c.done) || ((a.day || 0) - (c.day || 0)));
  if (!list.some(r => !r.done)) h += `<div class="m">${t('vbAllDone')}</div>`;
  for (const r of list) { const shopReq = r.t && r.t !== 'item', have = VILLAGE.reqHave(S, r), due = (r.day || day) < day ? t('vbDue0') : t('vbDue1');
    const txt = shopReq ? t('vbReq_' + r.t, { w: who[r.who] || '', n: r.n, sp: r.k ? spName(r.k) : '' }) : t('vbReq', { w: who[r.who] || '', i: r.icon, n: r.n });
    h += `<div class="li" style="${r.done ? 'opacity:.55' : ''}"><div class="ic">${r.icon}</div><div class="grow"><div class="m">${esc(txt)}</div><div class="m">🪙 ${fmt(r.reward)} · ${shopReq ? t('vbProg', { a: Math.min(have, r.n), n: r.n }) : t('vbHave', { n: have })}${r.done ? '' : ' · ' + due}</div></div>${r.done ? `<div class="m">${t('vbDone')}</div>` : `<button class="btn ${have >= r.n ? '' : 'dis'} sm" data-a="vdeliver" data-v="${r.id}">${shopReq ? t('vbClaim') : t('vbGive')}</button>`}</div>`; }
  return frameHTML(t('vbTitle'), h + '</div>');
};
XACT.vdeliver = v => { actR({ t: 'vdeliver', rid: +v }); renderPanel(true); };
// v9.99: grooming salon panel
PANELS.salon = () => {
  const sl = SALON.ensure(S), w = sl.q.filter(c => c.ph === 'wait').length, ng = S.pets.filter(p => p && !p.groomed).length;
  let h = `<div class="m">${t('salonInfo')}</div><div class="card"><div class="m">${t('salonStats', { n: sl.served | 0, m: sl.lost | 0, w })}</div></div>`;
  h += `<button class="btn ${ng ? '' : 'dis'} block" data-a="salongroomall">${t('salonGroomAll', { n: ng, c: SALON_GROOM_ALL })}</button>`;
  h += `<div class="card"><div class="t">${t('salonStaffT')}</div>`;
  for (const m of sl.staff) h += `<div class="li"><div class="ic">✂️</div><div class="grow"><div class="t">${esc(m.name || '')} · Lv${m.lv}</div><div class="m">💰 ${t('salonWage', { c: fmt(salonStaffWage(m.lv)) })} · ✅ ${m.done | 0}</div></div>${m.lv < 10 ? `<button class="btn o sm" data-a="salonup" data-v="${m.id}">⬆ 🪙${fmt(700 * m.lv)}</button>` : ''}<button class="btn r sm" data-a="salonfire" data-v="${m.id}">✕</button></div>`;
  if (sl.staff.length < SALON_STAFF_MAX) h += `<button class="btn block" data-a="salonhire">${t('salonHire', { c: fmt(SALON_STAFF.hire), w: fmt(salonStaffWage(1)) })}</button>`;
  return frameHTML(t('salonTitle'), h + '</div>');
};
Object.assign(XACT, { salonhire: () => { actR({ t: 'salonhire' }); renderPanel(true); }, salonup: v => { actR({ t: 'salonup', sid: +v }); renderPanel(true); }, salonfire: v => { actR({ t: 'salonfire', sid: +v }); renderPanel(true); }, salongroomall: () => { actR({ t: 'salongroomall' }); renderPanel(true); } });
// v9.99: fishing at the lake -- cast, wait for the ❗, pull in time
let _fish = { st: 'idle', tm: null, bite: 0 };
PANELS.fishing = () => {
  const f = S.fish && S.fish.day === (S.clock ? S.clock.day : 1) ? S.fish : { n: 0 }, left = TOWN.FISH_MAX - (f.n || 0);
  if (!(S.village && S.village.lake)) return frameHTML(t('fishTitle'), `<div class="m">${t('fishNeedLake')}</div>`);
  const st = _fish.st, big = s => `<div style="font-size:54px;text-align:center;line-height:1.3">${s}</div>`;
  let h = `<div class="m center">${t('fishDesc', { n: left })}</div>`;
  if (st === 'wait') h += big('🎣<br>🌊') + `<div class="m center">${t('fishWait')}</div><button class="btn block" data-a="fishpull">${t('fishPull')}</button>`;
  else if (st === 'bite') h += big('🎣<br>❗🐟') + `<button class="btn o block" data-a="fishpull" style="font-size:20px">${t('fishPull')}</button>`;
  else { if (_fish.msg) h += big(_fish.icon || '🎣') + `<div class="m center"><b>${esc(_fish.msg)}</b></div>`; else h += big('🎣'); h += `<button class="btn block ${left > 0 ? '' : 'dis'}" data-a="fishcast">${t('fishCast')}</button>`; }
  return frameHTML(t('fishTitle'), h);
};
function fishReset() { clearTimeout(_fish.tm); _fish = { st: 'idle', tm: null }; }
Object.assign(XACT, {
  fishcast: () => {
    const f = S.fish && S.fish.day === (S.clock ? S.clock.day : 1) ? S.fish : { n: 0 }; if ((f.n || 0) >= TOWN.FISH_MAX) { toast(t('fishTired')); return; }
    clearTimeout(_fish.tm); _fish = { st: 'wait', tm: null }; renderPanel(true);
    _fish.tm = setTimeout(() => { if (_fish.st !== 'wait') return; _fish.st = 'bite'; _fish.bite = Date.now(); SND.pop && SND.pop(); renderPanel(true);
      _fish.tm = setTimeout(() => { if (_fish.st !== 'bite') return; actR({ t: 'fishcast', hit: false }); _fish = { st: 'idle', msg: t('fishLate'), icon: '💨' }; renderPanel(true); }, 900); }, 1500 + Math.random() * 3500);
  },
  fishpull: () => {
    if (_fish.st === 'wait') { clearTimeout(_fish.tm); actR({ t: 'fishcast', hit: false }); _fish = { st: 'idle', msg: t('fishEarly'), icon: '🐟💨' }; renderPanel(true); return; }
    if (_fish.st !== 'bite') return; clearTimeout(_fish.tm);
    const r = actR({ t: 'fishcast', hit: true }) || {};
    if (r.fish) { _fish = { st: 'idle', icon: r.icon, msg: r.pet ? t('fishGotPet') : t('fishGot', { i: r.icon, n: t('fish_' + r.fish), c: fmt(r.coins) }) }; if (r.coins) fxAt(innerWidth / 2, innerHeight / 2, '🪙'); }
    else _fish = { st: 'idle', icon: '🎣', msg: '🎉' };
    renderPanel(true);
  }
});

// ================= v1.27 / v1.28: ranch panels =================
PANELS.ranch = () => { // opened from the 🐄 management icon / the barn: animals, level, staff
  const r = RANCH.ensure(S); if (!r) return frameHTML('🐄 ' + t('ranchName'), `<div class="m">${t('tNotBuiltYet', { b: t('tk_ranch') })}</div>`);
  const d = S.clock ? S.clock.day : 1, cap = RANCH_LV[r.lv].cap, nx = RANCH_LV[r.lv + 1];
  const row = (a, ic) => `<span class="rtag">${ic}${a.sex === 'm' ? '♂' : '♀'} ${esc(a.name)}${d - a.born < RANCH_GROW ? ' 🍼' + (RANCH_GROW - (d - a.born)) + t('rDayShort') : ''}${a.fed === d ? ' ✅' : ' 🍽️'}</span>`;
  const bi = k => { const b = RANCH.breedInfo(S, k); return `<div class="m" style="font-size:12px;color:${b.st === 'ok' ? '#2a8a3a' : '#a0602a'}">👶 ${t('rBreed_' + b.st, { n: b.n })}</div>`; };
  let h = staffCatTabs('ranch') + `<div class="m">${t('ranchDesc2')}</div>`;
  h += `<div class="card"><div class="t">🐄 ${t('ranchCows')} ${r.cows.length}/${cap}</div><div class="m">${r.cows.map(a => row(a, d - a.born < RANCH_GROW ? '🐮' : '🐄')).join(' ')}</div>${bi('cow')}
    <div class="t" style="margin-top:6px">🐖 ${t('ranchPigs')} ${r.pigs.length}/${cap}</div><div class="m">${r.pigs.map(a => row(a, '🐖')).join(' ')}</div>${bi('pig')}
    <div class="m" style="margin-top:4px">🌿 ${t('rHayBox')} ${r.hay} · 🥕 ${t('rPigBox')} ${RANCH.pfTotal(r)} · 🥛🥩 ${t('rDrops', { n: r.drops.length })}</div>
    <div class="row" style="gap:6px;margin-top:6px;flex-wrap:wrap"><button class="btn o sm" data-a="open" data-v="rhay">🌿 ${t('rHayBox')}</button><button class="btn o sm" data-a="open" data-v="rpig">🥕 ${t('rPigBox')}</button><button class="btn g sm ${r.drops.length ? '' : 'dis'}" data-a="rcollect">🧺 ${t('rPickAll')} (${r.drops.length})</button>
    ${nx ? `<button class="btn sm ${S.coins < nx.cost ? 'dis' : ''}" data-a="rup">⬆ Lv${r.lv + 1} (${t('ranchCap', { n: nx.cap })}) 🪙${fmt(nx.cost)}</button>` : ''}</div></div>`;
  h += `<div class="card"><div class="t">🧑‍🌾 ${t('ranchHands')} ${r.staff.length}/3</div><div class="m">${t('ranchHandsDesc', { w: RANCH_HAND.wage })}</div>` + r.staff.map((m, i) => `<div class="li"><div class="ic">🧑‍🌾</div><div class="grow"><div class="t">Lv${m.lv} · ✅ ${m.done || 0}</div><div class="m">${m.why === 'hay' ? t('ranchNoHayCoin') : m.why === 'crop' ? t('ranchNoCrop') : t('ranchAct_' + (m.act || 'idle'))}</div></div>${m.lv < 5 ? `<button class="btn o sm ${S.coins < RANCH_HAND.hire * m.lv ? 'dis' : ''}" data-a="rstaffup" data-v="${i}">⬆ 🪙${fmt(RANCH_HAND.hire * m.lv)}</button>` : ''}<button class="btn sm" data-a="rfire" data-v="${i}">✖</button></div>`).join('')
    + (r.staff.length < 3 ? `<button class="btn block ${S.coins < RANCH_HAND.hire * (1 + r.staff.length) ? 'dis' : ''}" data-a="rhire">🤝 ${t('hireBtn')} 🪙${fmt(RANCH_HAND.hire * (1 + r.staff.length))} <small>(💼 ${t('ranchWage', { w: RANCH_HAND.wage })})</small></button>` : '') + `</div>`;
  return frameHTML('🐄 ' + t('ranchName') + ' Lv' + r.lv, h);
};
PANELS.rhay = () => { const r = RANCH.ensure(S); if (!r) return ''; const c = RANCH.hayFee() * 10;
  return frameHTML('🌿 ' + t('rHayBox'), `<div class="m">${t('rHayDesc')}</div><div class="li"><div class="ic">🌿</div><div class="grow"><div class="t">${t('good_hay')} ×${r.hay}</div><div class="m">${t('rHayNeed', { n: r.cows.length })}</div></div><button class="btn o ${S.coins < c ? 'dis' : ''}" data-a="rbuyhay">🛒 +10 🪙${fmt(c)}</button></div>`); };
PANELS.rpig = () => { const r = RANCH.ensure(S); if (!r) return ''; const pr = FARM.ensure(S).produce;
  const box = Object.keys(r.pf).filter(k => r.pf[k] > 0), farm = CROPS.filter(x => (pr[x.id] || 0) > 0);
  return frameHTML('🥕 ' + t('rPigBox'), `<div class="m">${t('rPigDesc')}</div><div class="row" style="gap:8px;align-items:flex-start">
    <div class="card grow" style="flex:1"><div class="t">🥕 ${t('rPigBox')} (${RANCH.pfTotal(r)})</div>${box.length ? box.map(k => { const c = CROPS.find(x => x.id === k); return `<div class="m">${c ? c.icon : ''} ${t('crop_' + k)} ×${r.pf[k]}</div>`; }).join('') : `<div class="m">${t('rEmpty')}</div>`}</div>
    <div class="card grow" style="flex:1"><div class="t">📦 ${t('farmBox')}</div><div class="m">${t('rTapMove')}</div>${farm.length ? farm.map(c => `<button class="btn sm block" style="margin-top:4px" data-a="rpf" data-v="${c.id}">${c.icon} ${t('crop_' + c.id)} ×${pr[c.id]} ➡</button>`).join('') : `<div class="m">${t('noProduce')}</div>`}</div></div>`); };
PANELS.ranchbox = () => { const pr = FARM.ensure(S).produce;
  return frameHTML('📦 ' + t('ranchBox'), `<div class="m">${t('ranchBoxDesc')}</div>` + Object.entries(RANCH_GOODS).map(([k, g]) => `<div class="li"><div class="ic">${g.icon}</div><div class="grow"><div class="t">${t('rg_' + k)} ×${pr[k] || 0}</div><div class="m">🪙${g.sell}/${t('seedUnit')}</div></div><button class="btn o sm ${(pr[k] || 0) ? '' : 'dis'}" data-a="rsell" data-v="${k}" data-w="1">${t('sellBtn')}</button><button class="btn g sm ${(pr[k] || 0) ? '' : 'dis'}" data-a="rsell" data-v="${k}" data-w="${pr[k] || 0}">${t('sellAllBtn')}</button></div>`).join('')); };
PANELS.train = p => (typeof window !== 'undefined' && window.PANELS && typeof window.PANELS.train === 'function' ? window.PANELS.train(p) : (typeof TRAIN !== 'undefined' && TRAIN.renderPanel ? TRAIN.renderPanel(p) : ''));
Object.assign(XACT, {
  rfeed: () => { actR({ t: 'rfeed' }); renderPanel(true); }, rcollect: () => { actR({ t: 'rcollect' }); renderPanel(true); }, rup: () => { actR({ t: 'rup' }); renderPanel(true); },
  rsell: (v, w) => { actR({ t: 'rsell', id: v, n: +w || 1 }); renderPanel(true); }, rhire: () => { actR({ t: 'rhire' }); renderPanel(true); },
  rstaffup: v => { actR({ t: 'rstaffup', i: +v }); renderPanel(true); }, rfire: v => { actR({ t: 'rfire', i: +v }); renderPanel(true); },
  rbuyhay: () => { const r = actR({ t: 'rbuyhay' }); if (r && r.ok) SND.pop && SND.pop(); renderPanel(true); }, rpf: v => { actR({ t: 'rpf', id: v, n: 1 }); SND.pop && SND.pop(); renderPanel(true); },
});

// v1.100.37: 직접 만든 타이틀 화면(시작 버튼을 눌러야 게임이 시작됨) - 실제 게임 로직(boot)이
// 아직 전혀 실행되기 전이므로(언어/저장도 안 불러온 상태) S/panel 등 게임 상태에 의존하는 함수는
// 쓰지 않고, 이 화면 전용의 아주 작은 팝업(종료 확인/언어 선택)만 직접 그림.
// v1.100.38: 사용자가 직접 수정한 두번째 타이틀 그림으로 교체 - CREDS 버튼은 빠지고
// LANGUAGE 버튼이 맨 아래 한 줄 전체를 차지하도록 레이아웃이 바뀜
function showTitleScreen(onStart) {
  const W = 622, H = 1436; // title_bg.jpg 원본 비율
  const BTN = {
    start:  { l: 4.02, t: 70.68, w: 47.43, h: 4.88 },
    exit:   { l: 4.02, t: 77.99, w: 47.43, h: 4.74 },
    settings:{ l: 4.02, t: 83.94, w: 47.43, h: 4.53 },
    lang:   { l: 4.02, t: 90.89, w: 47.43, h: 4.18 },
  };
  const ov = document.createElement('div');
  ov.id = 'titleScreen';
  // v1.100.54: "시작 화면의 위아래가 조금 짤리네. 위/아래만 조금 줄여줘. 안짤리기게만."
  // 기존 max(...) 방식은 화면이 세로로 조금만 짧아도 위(간판)와 아래(LANGUAGE 버튼)가 잘려나갔음.
  // height를 뷰포트 높이와 safe-area 안으로 맞추어(안 잘리게) 위/아래를 살리고,
  // 배경에는 원본 그림을 부드럽게 블러 처리한 커버 배경을 깔아 양옆 레터박스도 검은색 없이 자연스럽게 채움.
  ov.style.cssText = 'position:fixed;inset:0;z-index:99990;background:#2a2118;overflow:hidden;';
  const btnHTML = Object.entries(BTN).map(([k, b]) => {
    const imgW = (100 / b.w) * 100;
    const imgH = (100 / b.h) * 100;
    const imgL = -(b.l / b.w) * 100;
    const imgT = -(b.t / b.h) * 100;
    return `<button data-ta="${k}" class="tsbtn" style="position:absolute;left:${b.l}%;top:${b.t}%;width:${b.w}%;height:${b.h}%;border:0;background:transparent;padding:0;cursor:pointer;border-radius:9999px;overflow:hidden;touch-action:manipulation;">
      <div style="position:absolute;inset:0;border-radius:9999px;overflow:hidden;pointer-events:none;">
        <img src="${assetUrl('spr/ui/title_bg.jpg')}" draggable="false" style="position:absolute;left:${imgL}%;top:${imgT}%;width:${imgW}%;height:${imgH}%;max-width:none;pointer-events:none;-webkit-user-select:none;user-select:none;">
      </div>
    </button>`;
  }).join('');
  ov.innerHTML = `
  <div style="position:absolute;inset:0;overflow:hidden;pointer-events:none;">
    <img src="${assetUrl('spr/ui/title_bg.jpg')}" draggable="false" style="position:absolute;inset:-6%;width:112%;height:112%;object-fit:cover;filter:blur(22px) brightness(0.9);-webkit-user-select:none;user-select:none;">
  </div>
  <div id="titleBox" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:100%;max-width:100vw;height:calc(100vh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px) - 4px);max-height:100vh;box-shadow:0 0 35px rgba(0,0,0,.35);">
    <img src="${assetUrl('spr/ui/title_bg.jpg')}" draggable="false" style="position:absolute;inset:0;width:100%;height:100%;display:block;-webkit-user-select:none;user-select:none;">
    ${btnHTML}
  </div>`;
  document.body.appendChild(ov);

  // 모바일 / 세로 화면에서는 좌우 여백을 완전히 없애고 100% 채움
  // PC 가로 와이드 화면(768px 초과 및 가로 모드)에서만 자연스럽게 비율 유지
  const updateTitleLayout = () => {
    const box = document.getElementById('titleBox');
    if (!box) return;
    const w = window.innerWidth || document.documentElement.clientWidth || 360;
    const h = window.innerHeight || document.documentElement.clientHeight || 640;
    const isWidescreenDesktop = (w > 768 && w > h);

    if (isWidescreenDesktop) {
      const targetH = Math.min(h - 12, h * 0.94);
      const targetW = Math.min(520, targetH * W / H);
      box.style.width = targetW + 'px';
      box.style.maxWidth = '520px';
      box.style.height = targetH + 'px';
      box.style.maxHeight = '100vh';
    } else {
      // 모바일/세로 화면: 원본 비율(W/H)을 유지하여 버튼과 캐릭터·동물 이미지가 가로로 늘어지지 않도록 조정
      const targetH = h;
      const naturalW = targetH * (W / H);
      const targetW = Math.min(w, Math.round(naturalW));
      box.style.width = targetW + 'px';
      box.style.maxWidth = '100vw';
      box.style.height = targetH + 'px';
      box.style.maxHeight = '100vh';
    }
  };

  updateTitleLayout();
  window.addEventListener('resize', updateTitleLayout);

  const playBtnSound = (kind) => {
    try {
      if (typeof beep === 'function') {
        if (kind === 'start') {
          // Cheerful uplifting start chime: C5 -> E5 -> G5 -> C6
          beep([[523, .08, 'sine'], [659, .08, 'sine'], [784, .1, 'sine'], [1046, .22, 'sine']]);
        } else if (kind === 'exit') {
          // Soft mellow exit click
          beep([[580, .07, 'triangle'], [440, .12, 'triangle']]);
        } else {
          // Crisp pop click for settings and lang
          beep([[660, .07, 'sine'], [880, .09, 'sine']]);
        }
      } else if (typeof SND !== 'undefined' && SND.pop) {
        SND.pop();
      }
    } catch (e) {}
  };

  const popup = (html) => {
    const p = document.createElement('div');
    p.style.cssText = 'position:fixed;inset:0;z-index:99991;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;';
    p.innerHTML = `<div style="background:#fffdf5;border-radius:16px;padding:22px 20px;max-width:320px;width:86%;text-align:center;box-shadow:0 8px 30px rgba(0,0,0,.3)">${html}</div>`;
    p.addEventListener('click', e => { if (e.target === p) p.remove(); });
    document.body.appendChild(p);
    return p;
  };
  const btnStyle = 'display:block;width:100%;margin-top:10px;padding:11px;border:0;border-radius:10px;font:bold 15px sans-serif;cursor:pointer;';

  let starting = false;
  ov.addEventListener('click', e => {
    const b = e.target.closest('[data-ta]'); if (!b || starting) return;
    const a = b.dataset.ta;
    b.classList.add('pressed');
    setTimeout(() => b.classList.remove('pressed'), 180);
    playBtnSound(a);

    if (a === 'start') {
      starting = true;
      setTimeout(() => {
        ov.style.transition = 'opacity .25s ease-out';
        ov.style.opacity = '0';
        setTimeout(() => {
          window.removeEventListener('resize', updateTitleLayout);
          ov.remove();
          onStart();
        }, 250);
      }, 150);
    } else if (a === 'exit') {
      setTimeout(() => {
        const p = popup(`<div style="font:bold 16px sans-serif;margin-bottom:4px">${esc(t('exitConfirm'))}</div>
          <button id="tsExitYes" style="${btnStyle}background:#e07a5f;color:#fff">${esc(t('yes'))}</button>
          <button id="tsExitNo" style="${btnStyle}background:#eee;color:#333">${esc(t('no'))}</button>`);
        p.querySelector('#tsExitYes').onclick = () => { playBtnSound('exit'); try { Native.exitApp(); } catch (e) {} };
        p.querySelector('#tsExitNo').onclick = () => { playBtnSound('pop'); p.remove(); };
      }, 120);
    } else if (a === 'settings') {
      setTimeout(() => toast(t('titleSettingsHint')), 100);
    } else if (a === 'lang') {
      setTimeout(() => {
        const p = popup(`<div style="font:bold 16px sans-serif;margin-bottom:4px">${esc(t('chooseLang'))}</div>
          <button id="tsLangKo" style="${btnStyle}background:${(CFG.lang || 'ko') === 'ko' ? '#f2c14e' : '#eee'};color:#333">한국어</button>
          <button id="tsLangRu" style="${btnStyle}background:${CFG.lang === 'ru' ? '#f2c14e' : '#eee'};color:#333">Русский</button>`);
        p.querySelector('#tsLangKo').onclick = () => { playBtnSound('pop'); CFG.lang = 'ko'; saveCfg(); p.remove(); };
        p.querySelector('#tsLangRu').onclick = () => { playBtnSound('pop'); CFG.lang = 'ru'; if (typeof S !== 'undefined' && S) { S.lang = 'ru'; if (typeof translateKoreanNames === 'function') translateKoreanNames(S); if (typeof save === 'function') save(); } saveCfg(); p.remove(); };
      }, 120);
    }
  });
}

showTitleScreen(boot);
