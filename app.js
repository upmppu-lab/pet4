// ================= App shell (HUD, panels, flow) =================
let S = null;
let panel = null;           // {type,...}
let lastEv = 0;
const App = { editing: false, moveMode: 'tap', showNames: false, scene: 'shop' };
const maxEv = s => s && s.events.length ? s.events[s.events.length - 1].id : 0;
if (!CFG.look) CFG.look = { skin: '#ffe0c7', hair: '#5a3a22', hs: 1, shirt: '#ef8fa8', pants: '#3d405b', skirt: '#f2c14e', apron: '#fff4e0' };
// ========== 🆕 소품 슬롯 마이그레이션 (v1.102) ==========
// 기존 CFG.look.hat → CFG.look.acc.head 로 이전
if (CFG.look && CFG.look.hat && !CFG.look.acc) {
  CFG.look.acc = { head: CFG.look.hat };
  delete CFG.look.hat;
}
// acc가 없으면 빈 객체로 초기화
if (CFG.look && !CFG.look.acc) {
  CFG.look.acc = {};
}
// ========== 소품 슬롯 마이그레이션 끝 ==========

// CFG.look.acc 마이그레이션 및 초기화
if (CFG.look && CFG.look.hat && !CFG.look.acc) {
    // 기존 hat 슬롯을 acc.head로 이전
    CFG.look.acc = { head: CFG.look.hat };
    delete CFG.look.hat; // 기존 hat 속성 제거
}
if (!CFG.look.acc) {
    // acc가 없으면 빈 객체로 초기화
    CFG.look.acc = {};
}

// saveCfg() 함수 호출 후 rerenderChar()가 필요할 수 있음
App.moveMode = 'both';

// ---------- portraits (chibi drawn to image, cached) ----------
// ================= PET PNG =================
// AI 벡터 대신 직접 그린 PNG를 쓰는 동물 목록.
// 여기 등록된 종은 world.js/app.js에서 PNG로 그려짐.
const PNG_PETS = {
  shiba_sinu_black: 1,
  shiba_sinu_black_brown: 1,
  dalmatian_black: 1,
  dalmatian_eye: 1,
  dalmatian_red: 1,
  maltese_brown2: 1,
  maltese_dark_brown: 1,
  maltese_white: 1,
  retriever_black: 1,
  retriever_brown: 1,
  retriever_dark_brown: 1,
  husky_black: 1,
  husky_brown: 1,
  husky_white: 1,
  rat_black_1: 1,
  rat_black_2: 1,
  rat_black_3: 1,
  rat_brown_1: 1,
  rat_brown_2: 1,
  rat_brown_3: 1,
  rat_brown_4: 1,
  rat_cream_1: 1,
  rat_cream_2: 1,
  rat_gray_1: 1,
  rat_gray_2: 1,
  rat_gray_3: 1,
  rat_white_1: 1,
  rat_white_2: 1,
  rat_white_3: 1,
  rat_white_4: 1,
  rat_white_5: 1,
  chihuahua_black: 1,
  chihuahua_brown: 1,
  chihuahua_dark_brown: 1,
};
const PET_PNG = (() => {
  const cache = {};
  return {
    load(sp) {
      if (cache[sp]) return cache[sp];
      const url = assetUrl('pets/' + sp + '.png');
      const img = (typeof ASSET_CACHE !== 'undefined') ? ASSET_CACHE.load(url) : (() => {
        const im = new Image(); im.crossOrigin = 'anonymous'; im.src = url; return im;
      })();
      cache[sp] = img;
      return img;
    },
    has(sp) { return !!PNG_PETS[sp]; },
    img(sp) { return cache[sp] || this.load(sp); },
  };
})();
// 게임 시작 시 미리 로드
// 본체 + 걷기 이미지 미리 로드
Object.keys(PNG_PETS).forEach(sp => {
  PET_PNG.load(sp);
  if (!sp.startsWith('rat_')) {
    PET_PNG.load(sp + '_walk1');
    PET_PNG.load(sp + '_walk2');
  }
});
const PIC = (() => {
  const cache = new Map();
  let scratch = null;
  function fitPet(key, draw) {
    if (cache.has(key)) return cache.get(key);
    const S0 = 360, K = 3.5, AX = 180, AY = 300;
    if (!scratch) { scratch = document.createElement('canvas'); scratch.width = scratch.height = S0; }
    const g = scratch.getContext('2d', { willReadFrequently: true }); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, S0, S0);
    g.setTransform(K, 0, 0, K, AX, AY); draw(g); g.setTransform(1, 0, 0, 1, 0, 0);
    let x0 = S0, y0 = S0, x1 = -1, y1 = -1;
    try { const d = g.getImageData(0, 0, S0, S0).data; for (let y = 0; y < S0; y++) for (let x = 0; x < S0; x++) if (d[(y * S0 + x) * 4 + 3] > 24) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } } catch (e) { x0 = 60; y0 = 40; x1 = 300; y1 = 320; }
    if (x1 < 0) { x0 = 60; y0 = 40; x1 = 300; y1 = 320; }
    const OUTS = 192, pad = OUTS * .06, bw = x1 - x0 + 1, bh = y1 - y0 + 1, sc = Math.min((OUTS - pad * 2) / bw, (OUTS - pad * 2) / bh, 1.4);
    const cv = document.createElement('canvas'); cv.width = cv.height = OUTS; const c = cv.getContext('2d');
    c.imageSmoothingQuality = 'high';
    c.drawImage(scratch, x0, y0, bw, bh, (OUTS - bw * sc) / 2, (OUTS - bh * sc) / 2, bw * sc, bh * sc);
    const url = cv.toDataURL();
    if (cache.size > 250) {
      const iter = cache.keys();
      for (let i = 0; i < 50; i++) { const k = iter.next().value; if (k) cache.delete(k); else break; }
    }
    cache.set(key, url); return url;
  }
  function make(key, w, h, draw) {
    if (cache.has(key)) return cache.get(key);
    const cv = document.createElement('canvas'); cv.width = w * 2; cv.height = h * 2;
    const c = cv.getContext('2d'); c.scale(2, 2); draw(c);
    let url;
    try { url = cv.toDataURL(); }
    catch (e) {
      // 커스텀 그림 캐릭터(PNG) 는 로컬 파일이라 캔버스가 오염(tainted)되어 toDataURL 이 막힐 수 있음.
      // 이 경우 벡터(그림판) 모습으로 대신 그려서 아이콘/미리보기가 깨지지 않게 함. (실제 게임 화면 속 캐릭터는 영향 없음)
      const cv2 = document.createElement('canvas'); cv2.width = w * 2; cv2.height = h * 2;
      const c2 = cv2.getContext('2d'); c2.scale(2, 2);
      HUM.forceVector = true;
      try { draw(c2); } finally { HUM.forceVector = false; }
      try { url = cv2.toDataURL(); } catch (e2) { url = ''; }
    }
    cache.set(key, url); return url;
  }
  return {
    // v9.78: the whole animal, centred and filling the square ("모든 동물은 네모 안 중앙에 온몸이") -- it is drawn big on a
    // scratch canvas, its real painted bounds are measured, then it is scaled into the tile. (A snake used to sit tiny at the bottom.)
    pet: (sp, sleep, seed, mood, age, wear) => {
      if (PNG_PETS[sp]) {
        const img = PET_PNG.img(sp);
        if (img && img.complete && img.naturalWidth) {
          // PNG는 자동 크롭 대신, 정사각형 캔버스에 그대로 맞춰서 그림
          const key = 'png' + sp;
          if (cache.has(key)) return cache.get(key);
          const OUTS = 192;
          const cv = document.createElement('canvas'); cv.width = cv.height = OUTS;
          const c = cv.getContext('2d');
          c.imageSmoothingQuality = 'high';
          // 원본 비율 유지하면서 정사각형에 맞춤 (여백 살짝)
          const pad = OUTS * .05;
          const side = OUTS - pad * 2;
          c.drawImage(img, pad, pad, side, side);
          const url = cv.toDataURL();
          cache.set(key, url); return url;
        }
        // 로딩 안 됐으면 기존 벡터로 폴백
      }
      return fitPet('p' + sp + (sleep ? 'z' : '') + (seed || '') + (mood || '') + (age == null ? '' : 'a' + age) + (wear ? JSON.stringify(wear) : ''), c => ART.pet(c, sp, { t: 1.2, sleep, seed, mood: mood || 'calm', age, wear }));
    },
    zooPet: (sp, seed, mood) => {
      const normMap = {
        giraffe: 'girin', girin: 'girin',
        zebra: 'horse', horse: 'horse',
        elephant: 'koggiri', rhino: 'koggiri', koggiri: 'koggiri',
        panda: 'panda',
        redpanda: 'nuguri', nuguri: 'nuguri',
        tiger: 'tiger', whitetiger: 'tiger',
        bear: 'bear',
        hippo: 'hama', hama: 'hama',
        croc: 'cro', cro: 'cro',
        flamingo: 'hak', hak: 'hak',
        penguin: 'penguin', seal: 'penguin'
      };
      const key = normMap[sp] || sp;
      if (['bear', 'cro', 'girin', 'hak', 'hama', 'horse', 'koggiri', 'nuguri', 'panda', 'penguin', 'tiger'].includes(key)) {
        return (typeof assetUrl === 'function') ? assetUrl('spr/zoo/' + key + '_1.png') : ('spr/zoo/' + key + '_1.png');
      }
      return fitPet('zp' + sp + (seed || '') + (mood || ''), c => ART.zooPet(c, sp, { t: 1.2, seed: seed || 1, mood: mood || 'happy', act: 'idle' }));
    },
    hab: (kind, lv, model) => make('hb' + kind + lv + (model || ''), 90, 90, c => { c.translate(45, 50); c.scale(1.05, 1.05); FURN.habitat(c, kind, lv, 0, false, model); }),
    my: p => PIC.pet(p.sp, false, p.coat || ART.hashStr(p.id), p.happy != null && p.stress != null ? ART.moodOf(p) : 'calm', p.grow != null ? Math.round(G.ageOf(p) * 10) / 10 : 1, p.wear),
    body: (look, w, h, k, mood) => make('B' + w + (mood || '') + JSON.stringify(look), w, h, c => { c.translate(w / 2, h - 8); c.scale(k, k); ART.human(c, look, 0, 1.3, false, mood || 'calm'); }),
    head: (look, mood) => make('H' + (mood || '') + JSON.stringify(look), 64, 64, c => { c.translate(32, 78); c.scale(.9, .9); ART.human(c, look, 0, 1.3, false, mood || 'calm'); }),
    human: (look, key) => make('h3' + (key || JSON.stringify(look)), 80, 80, c => { c.translate(40, 111); c.scale(1.32, 1.32); ART.human(c, look, 0, 0, false); }), // PET TOWN: zoomed out so the hair / hat fits in the square
    hat: look => make('HT' + look.hat + (look.hatc || ''), 64, 64, c => { c.translate(32, 50); c.scale(1.3, 1.3); HUM.hatOnly(c, look); }),
    clear: () => cache.clear(),
  };
})();

function loadOwnSave() {
  let s = store.get('ps.save', null);
  if (s && s.pets) {
    const prev = S;
    try { S = s; s = G.migrate(s); S = s; delete s.__guest; }
    catch (e) { S = prev; if (window.__rep) window.__rep(e, 'migrate'); }
  }
  return s;
}
const KO_TO_RU_ALL_NAMES = {
  // Ranch cows
  '음메': 'Бурёнка', '얼룩이': 'Милка', '우유': 'Снежинка', '초코': 'Зорька',
  '밀키': 'Беляночка', '누렁이': 'Рябинка', '방울': 'Колокольчик', '크림': 'Ромашка',
  // Ranch pigs
  '꿀꿀이': 'Хрюша', '분홍이': 'Пятачок', '토실이': 'Пончик', '동글이': 'Розочка',
  '복돌이': 'Пухля', '핑키': 'Пикки', '뚱이': 'Толстячок', '보리': 'Фунтик',
  // Shop pets & breeds
  '콩이': 'Пушок', '코코': 'Мурка', '두부': 'Лапка', '모카': 'Снежок',
  '뭉치': 'Персик', '호두': 'Бусинка', '밤이': 'Тимоша', '까미': 'Соня',
  '루루': 'Ириска', '쿠키': 'Кнопка', '나비': 'Рыжик', '복실이': 'Плюша',
  '몽이': 'Марсик', '단비': 'Зефирка', '하루': 'Чапа', '설기': 'Бублик',
  '망고': 'Ласка', '체리': 'Тучка', '버터': 'Шарик', '라떼': 'Пряник',
  '구름': 'Фунтик', '별이': 'Зайка', '토리': 'Мишка', '치즈': 'Лучик',
  '꼬미': 'Вишенка', '레오': 'Масик', '해피': 'Буся', '솜이': 'Сырник',
  '찰떡': 'Пончик', '감자': 'Кекс', '양말': 'Луна', '도토리': 'Звёздочка',
  '깜지': 'Тиша', '땅콩': 'Ватрушка', '율무': 'Мила', '꿀떡': 'Персей',
  '봄이': 'Боня',
  // Customers & villagers
  '민지': 'Аня', '서연': 'Маша', '지훈': 'Дима', '하은': 'Катя', '도윤': 'Иван',
  '수아': 'Оля', '예준': 'Саша', '지아': 'Лиза', '현우': 'Миша', '다은': 'Настя',
  '민준': 'Паша', '채원': 'Вика', '유진': 'Егор', '태양': 'Соня', '나래': 'Лёша',
  '소율': 'Юля', '준호': 'Никита', '윤아': 'Полина', '시우': 'Артём', '보람': 'Даша',
  // Strays
  '길강아지': 'Пёсик', '길고양이': 'Котик', '길토끼': 'Зайка', '길쥐': 'Мышонок', '길동물': 'Зверёк'
};
function translateKoreanNames(s) {
  if (!s || (typeof CFG !== 'undefined' && CFG.lang !== 'ru' && s.lang !== 'ru')) return;
  const tr = n => KO_TO_RU_ALL_NAMES[n] || n;
  if (Array.isArray(s.pets)) {
    for (const p of s.pets) { if (p && p.name) p.name = tr(p.name); }
  }
  if (Array.isArray(s.guests)) {
    for (const g of s.guests) { if (g && g.name) g.name = tr(g.name); }
  }
  if (Array.isArray(s.customers)) {
    for (const c of s.customers) {
      if (c && c.name) c.name = tr(c.name);
      if (c && c.pd && c.pd.name) c.pd.name = tr(c.pd.name);
    }
  }
  if (s.ranch) {
    if (Array.isArray(s.ranch.cows)) { for (const a of s.ranch.cows) { if (a && a.name) a.name = tr(a.name); } }
    if (Array.isArray(s.ranch.pigs)) { for (const a of s.ranch.pigs) { if (a && a.name) a.name = tr(a.name); } }
  }
  if (s.farm && s.farm.coop && Array.isArray(s.farm.coop.hens)) {
    for (const h of s.farm.coop.hens) { if (h && h.name) h.name = tr(h.name); }
  }
  const allStaff = [
    ...(s.staff ? Object.values(s.staff) : []),
    ...(s.cafe && Array.isArray(s.cafe.staff) ? s.cafe.staff : []),
    ...(s.hosp && Array.isArray(s.hosp.staff) ? s.hosp.staff : []),
    ...(s.farm && Array.isArray(s.farm.staff) ? s.farm.staff : []),
    ...(s.ranch && Array.isArray(s.ranch.staff) ? s.ranch.staff : [])
  ];
  for (const m of allStaff) { if (m && m.name) m.name = tr(m.name); }
  if (s.town && Array.isArray(s.town.residents)) {
    const seenNames = new Set();
    for (const r of s.town.residents) {
      r.name = (typeof pickHumanName === 'function') ? pickHumanName('ru', r.seed, seenNames) : tr(r.name);
      seenNames.add(r.name);
    }
  }
}
function translateRussianNames(s) {
  if (!s) return;
  const RU_TO_KO = {};
  for (const k in KO_TO_RU_ALL_NAMES) {
    RU_TO_KO[KO_TO_RU_ALL_NAMES[k]] = k;
  }
  const trKo = n => RU_TO_KO[n] || n;
  if (Array.isArray(s.pets)) {
    for (const p of s.pets) { if (p && p.name) p.name = trKo(p.name); }
  }
  if (Array.isArray(s.guests)) {
    for (const g of s.guests) { if (g && g.name) g.name = trKo(g.name); }
  }
  if (Array.isArray(s.customers)) {
    for (const c of s.customers) {
      if (c && c.name) c.name = trKo(c.name);
      if (c && c.pd && c.pd.name) c.pd.name = trKo(c.pd.name);
    }
  }
  if (s.ranch) {
    if (Array.isArray(s.ranch.cows)) { for (const a of s.ranch.cows) { if (a && a.name) a.name = trKo(a.name); } }
    if (Array.isArray(s.ranch.pigs)) { for (const a of s.ranch.pigs) { if (a && a.name) a.name = trKo(a.name); } }
  }
  if (s.farm && s.farm.coop && Array.isArray(s.farm.coop.hens)) {
    for (const h of s.farm.coop.hens) { if (h && h.name) h.name = trKo(h.name); }
  }
  const allStaff = [
    ...(s.staff ? Object.values(s.staff) : []),
    ...(s.cafe && Array.isArray(s.cafe.staff) ? s.cafe.staff : []),
    ...(s.hosp && Array.isArray(s.hosp.staff) ? s.hosp.staff : []),
    ...(s.farm && Array.isArray(s.farm.staff) ? s.farm.staff : []),
    ...(s.ranch && Array.isArray(s.ranch.staff) ? s.ranch.staff : [])
  ];
  for (const m of allStaff) { if (m && m.name) m.name = trKo(m.name); }
  if (s.town && Array.isArray(s.town.residents)) {
    const seenNames = new Set();
    for (const r of s.town.residents) {
      r.name = (typeof pickHumanName === 'function') ? pickHumanName('ko', r.seed, seenNames) : trKo(r.name);
      seenNames.add(r.name);
    }
  }
}
let RESETTING = false;
function save() { if (RESETTING) return; if (S && Net.mode !== 'guest') store.set('ps.save', S); }
function guestSaveOwn() { save(); }

// ---------- actions ----------
function act(a) {
  a.lang = a.lang || CFG.lang;
  if (Net.mode === 'guest') { guestSend(a); careFx(a); return; }
  const r = G.apply(S, a, CFG.name);
  if (r.ok) careFx(a);
  showResult(r);
  if (r.place != null) { App.editing = true; World.editSel = r.place; closePanel(); const it = S.items.find(i => i.id === r.place); toast((it ? itemLabel(it) + ' · ' : '') + t('placeHint')); }
  if (r.cplace != null) startCafeEdit(r.cplace);
  if (r.hplace != null) startHospEdit(r.hplace, r.hfl);
  afterStateChange();
  if (Net.mode === 'host') hostPublish();
}
function actR(a) {
  a.lang = a.lang || CFG.lang;
  if (Net.mode === 'guest') { guestSend(a); return { ok: 1 }; }
  const r = G.apply(S, a, CFG.name); showResult(r);
  if (r.place != null) { App.editing = true; World.editSel = r.place; closePanel(); const it = S.items.find(i => i.id === r.place); toast((it ? itemLabel(it) + ' · ' : '') + t('placeHint')); }
  if (r.cplace != null) startCafeEdit(r.cplace);
  if (r.hplace != null) startHospEdit(r.hplace, r.hfl);
  afterStateChange(); if (Net.mode === 'host') hostPublish(); return r;
}
function startCafeEdit(sel) { App.editing = false; App.cafeEdit = true; World.cafeSel = sel == null ? null : sel; closePanel(); World.focusCafe(); if (sel != null) toast(t('placeHint')); render(); }
function startHospEdit(sel, fl) { if (fl) App.hospFloor = fl; App.editing = false; App.cafeEdit = false; App.hospEdit = true; World.hospSel = sel == null ? null : sel; closePanel(); World.focusHosp(); if (sel != null) toast(t('placeHint')); render(); }
function careFx(a) {
  if (!['feed', 'clean', 'play', 'pat', 'groom'].includes(a.t)) return;
  const pa = World.petActor(a.pid);
  const pos = pa ? World.screenOf(pa) : [innerWidth / 2, innerHeight / 2];
  if (pa) pa.happyT = 1.2;
  const em = { feed: ['🍖', '😋'], clean: ['🫧', '✨'], play: ['🎾', '💛'], pat: ['💗', '💕'], groom: ['✨', '💫'] }[a.t];
  fxAt(pos[0], pos[1], em[0]); setTimeout(() => fxAt(pos[0] + 14, pos[1] - 6, em[1]), 150);
  SND.pop();
}
function fxAt(x, y, e) { const d = document.createElement('div'); d.className = 'fx'; d.textContent = e; d.style.left = x + 'px'; d.style.top = y + 'px'; document.body.appendChild(d); setTimeout(() => d.remove(), 1300); }
function showResult(r) {
  if (!r) return;
  if (r.err) {
    SND.err();
    if (r.err === 'needHouseModal') { openPanel({ type: 'needcagemodal', p: r.p }); return; }
    const p = Object.assign({}, r.p); if (p.f) p.f = t('f_' + p.f); if (p.ln) p.f = L10(FEED_LINES[p.ln]); if (p.h) p.h = t('hk_' + p.h); toast(t(r.err, p)); if (r.err === 'needHouse' && r.p) setTimeout(() => openPanel({ type: 'shop', tab: 'house', hcat: { dogbed: 'dog', catbed: 'cat', bed: 'dog', cage: 'rodent', hutch: 'bunny', birdcage: 'bird', tank: 'fish', terrarium: 'reptile' }[r.p.h] || 'dog' }), 600); if (r.err === 'needFood2') setTimeout(() => openPanel({ type: 'shop', tab: 'food' }), 600); return; }
  if (r.fx === 'coin') SND.coin(); else if (r.fx === 'love') SND.love();
  if (r.got && typeof gotText === 'function') setTimeout(() => toast(gotText(r.got)), r.msg ? 700 : 0);
  if (r.msg) { const p = Object.assign({}, r.p); if (p.sp) p.sp = spName(p.sp); if (p.tr) p.tr = trickName(p.tr); toast(t(r.msg, p)); }
}
function processEvents() {
  if (!S) return;
  for (const e of S.events) {
    if (e.id <= lastEv) continue;
    lastEv = e.id;
    if (typeof XEV !== 'undefined' && XEV[e.k]) { XEV[e.k](e); continue; }
    if (e.k === 'sell' || e.k === 'shopSale') { SFX.cash(); const a = World.actors.get('c' + e.cid); if (a) { const p = World.screenOf(a); fxAt(p[0], p[1] - 40, '🪙'); fxAt(p[0] + 12, p[1] - 60, e.k === 'sell' ? '💕' : '🛍️'); fxAt(p[0] - 10, p[1] - 70, '+' + fmt(e.c)); } }
    if (e.k === 'vipIn') { SND.love(); toast(t(e.has ? 'vipInHas' : 'vipInNone')); continue; }
    if (e.k === 'custLeft') { World.markLeft(e.cid, e.why); if (e.vip && e.why !== 'sold') toast(t('vipLeft')); else if (e.why === 'nomatch') toast(t('custLeftNo')); else if (e.why === 'lost') toast(t('custLeftLost')); continue; }
    if (e.k === 'open') { SND.level(); toast(t('shopOpened') + ((S.cafe && S.cafe.built) || (S.hosp && S.hosp.built) ? ' ' + t('alsoOpen') : '')); continue; }
    if (e.k === 'close') { SND.level(); openPanel({ type: 'report', e }); continue; }
    if (e.k === 'morning') { toast(t('morningMsg', { n: e.day })); continue; }
    if (e.k === 'parcel') { SND.love(); toast('📦 ' + t('parcelAtDrop', { x: parcelName({ what: e.what, key: e.key, mid: e.mid, did: e.did, n: e.what === 'kit' ? 3 : 10 }) })); continue; }
    if (e.k === 'delivered') { SND.love(); toast(t('truckArrived')); continue; }
    if (e.k === 'handover') { if (e.by !== CFG.name && Net.mode !== 'solo') toast(t('goPay', { name: e.pet }), 'partner'); continue; }
    if (e.k === 'level') { SND.level(); openPanel({ type: 'level', e }); continue; }
    if (e.k === 'reptier') { SND.level(); fxAt(innerWidth / 2, innerHeight / 2, REP_TIERS[e.n].ic || '⭐'); toast(t('repTierUp', { t: REP_TIERS[e.n].ic + ' ' + t('rt_' + e.n), c: fmt(e.c), n: e.n })); continue; }
    if (e.k === 'trick') { World.trick(e.pid, e.trick, e.ok, e.cid); if (e.by !== CFG.name && Net.mode !== 'solo') toast(t('ev_trick', { by: e.by, pet: e.pet, tr: trickName(e.trick) }), 'partner'); continue; }
    if (e.k === 'petLevel') { SFX.tada(); toast(t('petLevelUp', { pet: e.pet, n: e.lv }) + (e.trick ? ' · 🎪 ' + trickName(e.trick) : '')); continue; }
    if (e.k === 'evStart') { SFX.alarm(); toast(t('evs_' + e.ek, { pet: e.pet, sp: spName(e.sp) })); continue; }
    if (e.k === 'evEnd') { if (e.ok) SFX.tada(); else SND.err(); toast(t('eve_' + e.ek + (e.ok ? '_ok' : '_ng'), { pet: e.pet, n: e.n, score: e.score, c: e.c })); continue; }
    if (e.k === 'letters') { SND.love(); toast('📷 ' + t('ig_newPost')); continue; }
    if (e.k === 'igtier') { SND.level && SND.level(); toast('📷 ' + t('igTierUp', { n: fmt(e.n), c: fmt(e.c) }) + (e.tk ? ' + 🎟️' : '')); continue; }
    if (e.k === 'ipost') { SND.pop(); toast('📷 ' + t(e.tag ? 'ig_tagged' : 'ig_newFeed', { n: e.from })); continue; }
    if (e.k === 'icomment') { SND.pop(); toast('💬 ' + t('ig_newComment', { n: e.from })); continue; }
    if (e.k === 'rescued') { SND.love(); continue; }
    if (e.k === 'watched' || e.k === 'hotelIn' || e.k === 'hotelOut' || e.k === 'mini') continue;
    if (e.k === 'nest') { SND.love(); toast(t('ev_nest', { a: e.pa, b: e.pb })); continue; }
    if (e.k === 'born') { SND.love(); toast(t('bornToast', { pet: e.pet })); continue; }
    if (e.k === 'login') { toast('🎁 ' + t('login_ev', { n: e.n, c: e.c })); continue; }
    if (e.k === 'heart') { if (e.by !== CFG.name) { heartRain(); SND.love(); toast(t('heartFrom', { name: e.by }), 'partner'); } continue; }
    if (e.k === 'wages') { toast('💼 ' + t('wagesPaid', { c: fmt(e.c) })); continue; }
    if (Net.mode === 'solo' || e.by === CFG.name || e.by === 'staff') continue;
    const txt = evText(e); if (txt) toast(txt, 'partner');
  }
}
function evText(e) {
  const p = { by: e.by, pet: e.pet, sp: spName(e.sp), c: e.c ? fmt(e.c) : '', pa: e.pa, pb: e.pb, n: e.n, item: e.item ? t(e.item) : '' };
  const k = { fed: 'ev_fed', clean: 'ev_clean', play: 'ev_play', buy: 'ev_buy', sell: 'ev_sell', groom: 'ev_groom', upgrade: 'ev_upgrade', breed: 'ev_breed', house: 'ev_house' }[e.k];
  return k ? t(k, p) : '';
}
function afterStateChange() {
  processEvents();
  if (Net.mode === 'host') World.setPartners(Object.entries(Net.players).map(([id, q]) => ({ id, name: q.name, x: q.x, y: q.y, look: q.look })));
  else if (Net.mode === 'guest') World.setPartners(Object.entries(Net.players).filter(([id]) => id !== CFG.id).map(([id, q]) => ({ id, name: q.name, x: q.x, y: q.y, look: q.look })));
  render();
}

// ---------- HUD ----------
function hudHTML() {
  if (App.scene === 'home' && typeof Home !== 'undefined') return Home.hud();
  const need = xpNeed(S.level), pct = S.level >= MAX_LEVEL ? 100 : Math.min(100, S.xp / need * 100);
  const claim = typeof claimCount === 'function' ? claimCount() : 0;
  let coop = '';
  if (Net.mode !== 'solo') {
    const names = Object.entries(Net.players).filter(([id]) => id !== CFG.id).map(([, p]) => p.name);
    const lost = Net.mode === 'guest' && Net.lost, pend = Net.mode === 'guest' && !Net.synced && !lost;
    coop = `<button class="coopchip" data-a="${Net.mode === 'guest' && !Net.synced ? 'open" data-v="coop' : 'heart'}"><span class="dot ${lost || pend || !names.length ? 'off' : ''}"></span>${esc(lost ? t('connLost').split('.')[0] : pend ? t('coopConnecting') : names.join(', ') || t('waiting').replace('…', ''))} 💕</button>`;
  }
  return `<div class="hud"><div class="me"><button class="avatar" data-a="open" data-v="settings"><canvas id="hudAvCv" width="160" height="160"></canvas><span class="lvstar${S.level >= 100 ? ' l3' : ''}">${S.level}</span></button>
    <div class="mebars"><div class="name">${esc(S.shop)}</div><div class="bar"><i style="width:${pct.toFixed(1)}%"></i><span>${S.level >= MAX_LEVEL ? '👑 MAX' : fmt(S.xp) + ' / ' + fmt(need)}</span></div>
    <div class="name">${esc(CFG.name)}</div></div></div><div class="spacer"></div>
    <div class="money"><div class="pillw">🪙<b>${fmt(S.coins)}</b></div><div class="pillw rep" data-a="open" data-v="repinfo"><span class="stars">${starStr(S.rep || 0)}</span></div>${coop}</div></div>
    ${S.event ? `<div class="evbanner ${S.event.k}"><b>${t('evb_' + S.event.k, { pet: S.event.name || '', n: (S.messes || []).length })}</b><i style="width:${(S.event.left / S.event.max * 100).toFixed(1)}%"></i></div>` : ''}
    ${S.x && S.x.rush ? `<div class="evbanner rush"><b>⚡ ${t('rushOn', { n: S.x.rush.combo, s: Math.ceil(S.x.rush.left) })}</b><i style="width:${(S.x.rush.left / 40 * 100).toFixed(1)}%"></i></div>` : ''}
    ${clockHTML()}
    ${typeof TOWNUI !== 'undefined' ? `<div class="townrow">${TOWNUI.chip()}</div>` : ''}
    <div class="side">
      <button class="rbtn" data-a="open" data-v="quest">📜${claim ? `<span class="badge">${claim}</span>` : ''}<small>${t('tabQuest')}</small></button>
      <button class="rbtn" data-a="open" data-v="letters">📷${instaBadge() ? `<span class="badge">${instaBadge()}</span>` : ''}<small>${t('instaShort')}</small></button>
      <button class="rbtn" data-a="open" data-v="pets">🐾<small>${t('allPets')}</small></button>
      <button class="rbtn" data-a="open" data-v="shop">🛍️<small>${t('tabShop')}</small></button>
      <button class="rbtn" data-a="open" data-v="staff">👥<small>${t('staffShort')}</small></button>
      <button class="rbtn" data-a="open" data-v="book">📖<small>${t('bookShort')}</small></button>
      <button class="rbtn" data-a="open" data-v="coop">📶<small>${t('coopShort')}</small></button>
      <button class="rbtn" data-a="open" data-v="settings">⚙️<small>${t('settings')}</small></button>
      <div class="minirow">${(() => { const sl = ROOM_SIZES.findIndex(r => r.w === S.room.w) + 1, fl = FARM_SIZES.findIndex(z => z.n === ((S.farm && S.farm.n) || 8)) + 1, lb = n => `<i class="lvt">Lv${n}</i>`; return `<button class="mbtn" data-a="quickgo" data-v="shop">🏪${lb(sl || 1)}</button><button class="mbtn" data-a="quickgo" data-v="farm">🌾${lb(fl || 1)}</button>${S.cafe && S.cafe.built ? `<button class="mbtn" data-a="quickgo" data-v="cafe">☕${lb(S.cafe.lv || 1)}</button>` : `<button class="mbtn lock" data-a="quickgo" data-v="cafe">☕<i class="lvt">🔒</i></button>`}${S.hosp && S.hosp.built ? `<button class="mbtn" data-a="quickgo" data-v="hosp">🏥${lb(S.hosp.lv || 1)}</button>` : `<button class="mbtn lock" data-a="quickgo" data-v="hosp">🏥<i class="lvt">🔒</i></button>`}${S.ranch ? `<button class="mbtn" data-a="quickgo" data-v="ranch">🐄${lb(S.ranch.lv || 1)}</button>` : `<button class="mbtn lock" data-a="quickgo" data-v="ranch">🐄<i class="lvt">🔒</i></button>`}<button class="mbtn" data-a="quickgo" data-v="train">🚂${lb((S.train && S.train.lv) || 1)}</button>`; })()}</div>
    </div>
    ${App.editing || App.carry || App.cafeEdit || App.hospEdit || App.tplace || App.troad ? '' : `<div class="left"><button class="bigbtn" data-a="open" data-v="market">🐶<small>${t('tabMarket')}</small></button>
      <button class="bigbtn green" data-a="edit">🔨<small>${t('decorate')}</small></button>
      <button class="bigbtn blue" data-a="open" data-v="tbuild">🏗️<small>${t('tBuildBtn')}</small></button>
      <button class="bigbtn orange" data-a="open" data-v="tbuild" data-w="road">🛣️<small>${t('tRoadQuickBtn') || '길깔기'}</small></button></div>`}
    ${(App.tplace || App.troad) && typeof TOWNUI !== 'undefined' ? TOWNUI.bar() : ''}
    ${App.editing ? `<div class="editbar"><div class="grow">🔨 ${typeof World.editSel === 'string' ? t('editPetHint') : World.editSel != null ? selLabel() + t('placeHint') : t('editHint')}</div>
      ${typeof World.editSel === 'number' && true ? `<button class="btn g sm" data-a="rotitem">🔄</button><button class="btn r sm" data-a="trashitem">🗑️</button>` : `<button class="btn o sm" data-a="open" data-v="decor">🛋️ ${t('decorSec')}</button>`}<button class="btn sm" data-a="editdone">✓ ${t('done')}</button></div>` : ''}
    ${App.cafeEdit ? cafeEditBar() : ''}
    ${App.hospEdit ? hospEditBar() : ''}
    ${App.carry ? `<div class="editbar carrybar"><div class="grow">🤗 ${t(App.carry.did != null ? 'carryBar' : 'carryBar2', { sp: spName(App.carry.sp), h: t('hk_' + App.carry.kind) })}</div><button class="btn g sm" data-a="putdown">${t('putDown')}</button></div>` : ''}
    ${!App.editing && typeof onlineChip === 'function' ? onlineChip() : ''}
    ${!App.editing && World.me && inFarm(Math.floor(World.me.x), Math.floor(World.me.y), S.room.w, S.room.h) ? farmHotbarHTML() : ''}
    ${!App.editing ? `<div class="joy" id="joy"><i></i></div>` : ''}`;
}

function clockHTML() {
  const k = S.clock; const hh = Math.floor(k.m / 60), mm = Math.floor(k.m % 60);
  const ic = k.ph === 'closed' ? '🌙' : hh < 9 ? '🌅' : hh >= 16 ? '🌇' : '☀️';
  const ph = t(k.ph === 'prep' ? 'phPrep' : k.ph === 'open' ? 'phOpen' : 'phClosed');
  const isRu = typeof CFG !== 'undefined' && CFG.lang === 'ru';
  const openTxt = isRu ? 'Открыть' : '오픈';
  const closeTxt = isRu ? 'Закрыть' : '클로즈';
  const btn = k.ph === 'prep' ? `<button class="btn sm clk-act-btn" data-a="openNow">🔔 ${openTxt}</button>` : k.ph === 'closed' ? `<button class="btn b sm clk-act-btn" data-a="nextday">${t('nextDay')}</button>` : `<button class="btn r sm clk-act-btn" data-a="closeAsk">🔒 ${closeTxt}</button>`;
  const pct = k.ph === 'open' ? Math.min(100, (k.m - CLOCK.open) / (CLOCK.close - CLOCK.open) * 100) : k.ph === 'closed' ? 100 : 0;
  const sn = seasonOf(), we = isWeekend();
  const chips = (sn || we) && !(S.x && S.x.rush) ? `<div class="clkchips">${sn ? `<span>${{ halloween: '🎃', xmas: '🎄', spring: '🌸', summer: '🏖️' }[sn]} ${t('season_' + sn)}</span>` : ''}${we ? `<span>🎉 ${t('weekendBonus')}</span>` : ''}</div>` : '';
  return `<div class="clock"><div class="clk ${k.ph}"><span>${ic}</span><b>${t('dayN', { n: k.day })} · ${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}</b><small>${ph}</small><i style="width:${pct.toFixed(1)}%"></i></div>${btn}${chips}</div>`;
}
function starStr(r) { r = r || 0; const tr = repTier(r), T = REP_TIERS[tr], n = tr >= 5 ? 5 : (r - tr * 100) / 20; let s = ''; for (let i = 0; i < 5; i++) s += n >= i + .75 ? '★' : n >= i + .25 ? '⯪' : '☆'; return (T.ic ? T.ic : '') + `<span style="color:${T.col}">${s}</span>`; }
// ---------- panels ----------
let panelOpenedAt = 0;
const panelHistory = [];
function openPanel(p, isBack) {
  if (!p) { closePanel(); return; }
  // Normalize default sub-tabs so state comparison and back-navigation accurately track tabs
  if (p.type === 'shop' && !p.tab) p.tab = 'food';
  if (p.type === 'letters' && !p.tab) p.tab = 'all';
  if (p.type === 'home' && !p.tab) p.tab = 'furn';
  // v2026-10-09: 예전 5+1탭 체계 때 쓰던 'big' 기본값이 남아있어서, 건설 버튼을 눌렀을 때 탭은
  // 떠 있는데 목록은 하나도 안 보이는 빈 화면이 나왔음(현재는 'big'이라는 탭 자체가 없음).
  // 기본 탭을 '집'으로 바꿔서 건설 버튼을 누르면 바로 집 목록이 보이게 함.
  if (p.type === 'tbuild' && !p.tab) p.tab = 'house';

  if (!isBack && panel) {
    const prevKey = JSON.stringify(panel);
    const newKey = JSON.stringify(p);
    if (prevKey !== newKey) {
      panelHistory.push(JSON.parse(prevKey));
      if (panelHistory.length > 35) panelHistory.shift();
    }
  }
  panel = Object.assign({}, p);
  panelOpenedAt = Date.now();
  renderPanel(true);
}
function closePanel() {
  panel = null;
  panelHistory.length = 0;
  $('#panel').innerHTML = '';
}
function panelBack() {
  if (panelHistory.length > 0) {
    const prev = panelHistory.pop();
    openPanel(prev, true);
  } else {
    closePanel();
  }
}
var PANELS = (typeof window !== 'undefined' && window.PANELS) ? Object.assign(window.PANELS, {}) : {};
if (typeof window !== 'undefined') window.PANELS = PANELS;
function frameHTML(title, body, noClose) {
  const backLabel = typeof CFG !== 'undefined' && CFG.lang === 'ru' ? '◀ Назад' : '◀ 뒤로';
  const backBtn = `<button class="pback" data-a="panelBack">${backLabel}</button>`;
  const closeBtn = noClose ? '' : '<button class="x" data-a="close">✕</button>';
  return `<div class="ov" data-a="ovclose"><div class="panel"><div class="ph">${backBtn}<span class="phtitle">${title}</span>${closeBtn}</div><div class="pb">${body}</div></div></div>`;
}
function bar(v, col, txt) { return `<div class="pbar"><i style="width:${Math.max(0, Math.min(100, v)).toFixed(0)}%;background:${col}"></i><span>${txt != null ? txt : Math.round(v) + '%'}</span></div>`; }
const STATIC = { prompt: 1, welcome: 1 };
function renderPanel(force) {
  const box = $('#panel');
  if (!panel) { box.innerHTML = ''; return; }
  if (STATIC[panel.type] && box.firstChild && !force) return;
  const renderFn = PANELS[panel.type] || (typeof window !== 'undefined' && window.PANELS && window.PANELS[panel.type]);
  if (typeof renderFn !== 'function') {
    console.warn('Unknown panel:', panel && panel.type);
    closePanel();
    return;
  }
  const html = renderFn(panel);
  if (!html) { closePanel(); return; }
  // 스크롤 위치 저장
  const sc = box.querySelector('.pb') ? box.querySelector('.pb').scrollTop : 0;
  if (!box.firstChild) box.innerHTML = html; else patch(box, html);
  // 스크롤 위치 복원
  const pb = box.querySelector('.pb');
  if (pb && sc) pb.scrollTop = sc;
  if (panel && panel.type === 'welcome') charPreviewCanvas();
}

const L10 = o => o[CFG.lang === 'ru' ? 'ru' : 'ko'];
const feedTotal = p => { const l = dietOf(p.sp); return [0, 1, 2].reduce((a, k) => a + (S.feed[l + ':' + k] || 0), 0); };
function feedRow(p) {
  const l = dietOf(p.sp), L = FEED_LINES[l];
  return `<div class="card feedrow"><div class="m"><b>${L.icon} ${L10(L)}</b></div><div class="row">${FEED_TIERS.map((T, k) => { const n = S.feed[l + ':' + k] || 0; return `<button class="btn sm ${n ? (k === 2 ? 'o' : '') : 'dis'}" data-a="feedt" data-v="${p.id}" data-w="${k}">${T.icon} ${L10(T)} ×${n}</button>`; }).join('')}<button class="btn g sm" data-a="open" data-v="shop">🛒</button></div></div>`;
}
PANELS.pet = m => {
  const p = S.pets.find(x => x && x.id === m.pid); if (!p) return '';
  const i = S.pets.indexOf(p), sp = SPECIES[p.sp], hl = S.houses[i] || 1, cat = sp.cat;
  const remain = p.grow < 1 ? (1 - p.grow) * sp.grow * 60 / G.houseGrow(hl) : 0;
  const mates = G.mates(S, p);
  const body = `<div class="row"><div class="portrait" style="position:relative;overflow:visible"><span class="plv">Lv${p.lv || 1}</span><img src="${PIC.my(p)}" style="border-radius:13px"></div><div class="col grow">
      <div class="t">${esc(p.name)} <span class="sex ${p.sex}">${p.sex === 'm' ? '♂' : '♀'}</span> <button class="btn g sm" data-a="rename" data-v="${p.id}">✏️</button></div>
      <div class="m">${esc(spName(p.sp))} · ${t(p.sex === 'm' ? 'male' : 'female')}${p.gen ? ' · 🍼 ' + t('bredHere') : ''}${p.rescued ? ' · 🆘 ' + t('rescuedTag') : ''}${p.groomed ? ' · ✨' : ''}</div>
      <div class="m"><b>${t('mood')}:</b> ${t('mood_' + ART.moodOf(p))}</div>
      ${(() => { if (!G.confined(p.sp)) return ''; const hb = S.items.find(it => it.k === 'hab' && G.slotsOfItem(it).includes(i)); if (!hb) return ''; const d = Math.round(hb.dirt || 0);
        return `<div class="m"><b>${t('habDirtL')}:</b> ${d >= 60 ? '💩 ' : ''}${t(d >= 60 ? 'habDirt2' : d >= 30 ? 'habDirt1' : 'habDirt0')} (${d}%) <button class="btn g sm ${d >= 5 ? '' : 'dis'}" data-a="habclean" data-v="${hb.id}">🧽 ${t('habCleanBtn')}</button></div>`; })()}
      ${(() => { const b = ART.look(p.sp, p.coat || ART.hashStr(p.id)).bld || 1; return `<div class="m"><b>${t('bodyL')}:</b> ${t(b < 1 ? 'body0' : b < 1.1 ? 'body1' : b < 1.3 ? 'body2' : 'body3')}</div>`; })()}
      <div class="m"><b>${t('stageL')}:</b> ${t(p.grow < 1 ? 'stage0' : G.ageOf(p) < .75 ? 'stage1' : 'stage2')}${p.grow >= 1 && G.ageOf(p) < 1 ? ' · ' + t('stageHint') : ''}</div>
      <div class="m">${p.grow >= 1 ? '✅ ' + t('grown') : '🌱 ' + t('growing') + ' · ' + fmtT(remain)}</div>
      ${bar(p.grow * 100, 'linear-gradient(#ffe08a,#f0b43c)', t('growth') + ' ' + Math.floor(p.grow * 100) + '%')}</div></div>
    <div class="stat"><span>🍖 ${t('hunger')}</span>${bar(p.hunger, 'linear-gradient(#ffc27a,#f08a2e)')}</div>
    <div class="stat"><span>🧽 ${t('clean')}</span>${bar(p.clean, 'linear-gradient(#9fdcf5,#4fa3d9)')}</div>
    <div class="stat"><span>😣 ${t('stress')}</span>${bar(p.stress, 'linear-gradient(#ff9a8a,#e0604e)')}</div>
    <div class="stat"><span>💭 ${t('bored')}</span>${bar(p.bored, 'linear-gradient(#c9b6f0,#8a6fb5)')}</div>
    ${feedRow(p)}
    <div class="acts">
      <button data-a="care" data-w="feed" data-v="${p.id}" class="${feedTotal(p) ? '' : 'dis'}"><span class="e">🍖</span>${t('feed')}<small>${FEED_LINES[dietOf(p.sp)].icon} ${feedTotal(p)}</small></button>
      <button data-a="mini" data-w="bath" data-v="${p.id}"><span class="e">🛁</span>${t('miniBath')}<small>🎮</small></button>
      <button data-a="mini" data-w="brush" data-v="${p.id}"><span class="e">🪮</span>${t('miniBrush')}<small>🎮</small></button>
      <button data-a="playpick" data-v="${p.id}"><span class="e">🎾</span>${t('playMenu')}<small>🎮×4</small></button>
      <button data-a="care" data-w="pat" data-v="${p.id}"><span class="e">🤲</span>${t('pat')}<small>&nbsp;</small></button>
      <button data-a="photo" data-v="${p.id}"><span class="e">📸</span>${t('takePhoto')}<small>&nbsp;</small></button>
      <button data-a="hold" data-v="${p.id}"><span class="e">🤗</span>${t('holdPet')}<small>&nbsp;</small></button>
      ${GROOMABLE[cat] ? `<button data-a="care" data-w="groom" data-v="${p.id}" class="${p.groomed || !S.kits ? 'dis' : ''}"><span class="e">✂️</span>${t('groom')}<small>🧴 ${S.kits}</small></button>` : `<button data-a="care" data-w="clean" data-v="${p.id}"><span class="e">🧽</span>${t('doClean')}<small>&nbsp;</small></button>`}
      <button data-a="trick" data-v="${p.id}" class="${tricksOf(p).length && p.tcd <= 0 ? '' : 'dis'}"><span class="e">🎪</span>${t('trickBtn')}<small>${p.tcd > 0 ? fmtT(p.tcd) : tricksOf(p).length}</small></button>
      ${ART.roams(p.sp) ? `<button data-a="pen" data-v="${p.id}" class="${S.items.some(x => isPenKind(x.k)) ? '' : 'dis'}"><span class="e">🎠</span>${p.pen ? t('penOutBtn') : t('penInBtn')}<small>&nbsp;</small></button>` : ''}
    </div>
    <div class="card"><div class="row"><div class="grow"><div class="t">🏅 ${t('petLv', { n: p.lv || 1 })} · ${traitName(p.trait)}</div>
      ${bar((p.lv >= PET_MAX_LV ? 1 : (p.exp || 0) / petLvNeed(p.lv || 1)) * 100, 'linear-gradient(#ffe08a,#f0b43c)', p.lv >= PET_MAX_LV ? 'MAX' : Math.floor(p.exp || 0) + ' / ' + petLvNeed(p.lv || 1))}
      <div class="m">🎪 ${tricksOf(p).map(trickName).join(', ') || t('noTrickYet')}</div>
      <div class="m">${t('traitDesc_' + p.trait)}</div></div></div></div>
    <div class="card"><div class="row"><div class="grow"><div class="t">💞 ${t('breedTitle')}</div>
      <div class="m">${p.grow < 1 ? t('breedAdult') : p.bcd > 0 ? '😴 ' + t('resting', { m: fmtT(p.bcd) }) : mates.length ? t('chooseMate') + ' (' + mates.length + ')' : t('noMate', { sex: t(p.sex === 'm' ? 'female' : 'male'), sp: spName(p.sp) })}</div></div>
      ${p.grow >= 1 && p.bcd <= 0 && mates.length ? `<button class="btn p sm" data-a="mate" data-v="${p.id}">💕</button>` : ''}</div></div>
    <div class="card"><div class="row"><div class="grow"><div class="t">🏠 ${t('h' + hl)} <span class="m">Lv.${hl}</span></div>
      <div class="dots">${[1, 2, 3, 4, 5].map(k => `<i class="${k <= hl ? 'on' : ''}"></i>`).join('')}</div>
      <div class="m">${t('houseEff', { d: Math.round((1 - G.houseDecay(hl)) * 100), g: Math.round((G.houseGrow(hl) - 1) * 100), p: Math.round((G.housePrice(hl) - 1) * 100) })}</div></div>
      ${hl < G.HOUSE_MAX ? `<button class="btn o sm ${S.coins < G.houseCost(hl) ? 'dis' : ''}" data-a="house" data-v="${i}">⬆ 🪙${fmt(G.houseCost(hl))}</button>` : '👑'}</div></div>
    <div class="card"><div class="row"><div class="grow t">🪙 ${t('sellPrice', { c: fmt(G.price(S, p)) })}</div>
      <label class="m" style="display:flex;align-items:center;gap:4px"><input type="checkbox" data-a="fav" data-v="${p.id}" ${p.fav ? 'checked' : ''}>⭐</label></div>
      <div class="m">${t('sellHow')}</div></div>
    <div class="card"><div class="row"><div class="grow t">👕 ${t('wearSec')}</div>
      <button class="btn o sm" data-a="wearpick" data-v="${p.id}">${p.wear && (p.wear.collar || p.wear.hat || p.wear.cloth) ? [p.wear.cloth, p.wear.collar, p.wear.hat].filter(Boolean).map(w => w.icon).join(' ') : t('wearNone')}</button></div></div>
    ${p.sp === 'chick' ? `<button class="btn o block" data-a="tocoop" data-v="${p.id}">🐔 ${t('coopSend')}</button>` : ''}
    <button class="btn g block" data-a="release" data-v="${p.id}">${t('release')}</button>`;
  return frameHTML(t('petInfo'), body);
};
PANELS.wear = m => {
  const p = S.pets.find(x => x && x.id === m.pid) || (S.home && S.home.pets.find(x => x.id === m.pid)); if (!p) return '';
  p.wear = p.wear || {};
  const owned = S.petWear || {};
  const body = PET_WEAR_SLOTS.map(slot => {
    const items = PET_WEAR.filter(w => w.slot === slot), cur = p.wear[slot];
    const head = `<div class="t" style="margin-top:8px">${slot === 'collar' ? '🎗️ ' + t('wearCollar') : slot === 'hat' ? '🎀 ' + t('wearHat') : '👕 ' + t('wearCloth')}</div>`;
    if (slot === 'cloth' && !ART.canCloth(p.sp)) return head + `<div class="m">${t('noCloth')}</div>`;
    // v9.78: each tile shows THIS pet wearing the item (the emoji is only a small badge)
    const prev = w => PIC.pet(p.sp, false, p.coat || ART.hashStr(p.id), 'happy', 1, Object.assign({}, p.wear, { [slot]: w }));
    return head + `<div class="grid3">`
      + `<button class="tile ${!cur ? 'sel' : ''}" data-a="wearset" data-v="" data-w="${slot}"><div style="font-size:28px">✕</div><div class="m">${t('wearNone')}</div></button>`
      + items.map(w => {
        const has = owned[w.id];
        return `<button class="tile ${cur && cur.id === w.id ? 'sel' : ''} ${has ? '' : 'dis'}" data-a="${has ? 'wearset' : 'wearbuy'}" data-v="${w.id}" data-w="${slot}"><span class="badge" style="background:transparent;font-size:15px;right:4px;top:2px">${w.icon}</span><img src="${prev(w)}" style="width:64px;height:64px"><div class="m">${has ? (cur && cur.id === w.id ? '✓ ' + t('wearEquipped') : t('wearEquip')) : '🪙 ' + fmt(w.cost)}</div></button>`;
      }).join('') + '</div>';
  }).join('');
  return frameHTML('👕 ' + esc(p.name) + ' · ' + t('wearSec'), `<div class="m">${t('wearDesc')}</div>` + body);
};
// ---- farm patch beside the shop ----
function useFarmPlot(p) {
  if (!p.crop) {
    if (App.farmTool && App.farmTool.seed) { const r = actR({ t: 'fplant', x: p.x, y: p.y, crop: App.farmTool.seed }); if (r && r.ok) World.farmAction('plant', p.x, p.y); }
    else toast('🌱 ' + t('pickSeedHint'));
    return;
  }
  if (p.ready) { const crp = p.crop; const r = actR({ t: 'fharvest', x: p.x, y: p.y }); if (r && r.ok) { SND.love(); World.farmAction('harvest', p.x, p.y, r.crop || crp); } return; }
  if (App.farmTool && App.farmTool.tool === 'watercan') { const r = actR({ t: 'fwater', x: p.x, y: p.y }); if (r && r.ok) World.farmAction('water', p.x, p.y); }
  else { // not ripe yet: say how far along it is instead of only asking for the watering can
    const cr = CROPS.find(x => x.id === p.crop), day = S.clock ? S.clock.day : 0, info = t('farmGrowing', { n: p.growed || 0, m: cr ? cr.growDays : '?' });
    toast('🌱 ' + info + (p.wday === day ? ' ' + t('farmWateredToday') : ' ' + t('needWaterCanHint')));
  }
}
function useFarmGrid(gx, gy) {
  const p = (S.farm && S.farm.plots || []).find(pp => pp.x === gx && pp.y === gy);
  if (p) { useFarmPlot(p); return; }
  if (App.farmTool && App.farmTool.tool === 'hoe') { const r = actR({ t: 'ftill', x: gx, y: gy }); if (r && r.ok) World.farmAction('till', gx, gy); }
  else toast('⛏️ ' + t('needHoeHint'));
}
const WATERCAN_SVG = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" style="vertical-align:middle;display:inline-block"><path d="M6 10h8a3 3 0 0 1 3 3v5a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-5a3 3 0 0 1 3-3z" fill="#48bb78" stroke="#22543d" stroke-width="1.6"/><path d="M9 10V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4" stroke="#22543d" stroke-width="1.8" stroke-linecap="round"/><path d="M16 13l4-3m-1-1l2 2" stroke="#22543d" stroke-width="1.8" stroke-linecap="round"/><circle cx="20.5" cy="10.5" r="1.5" fill="#ecc94b" stroke="#22543d" stroke-width="1.2"/><path d="M19 7l1-1m2 2l1-1" stroke="#4299e1" stroke-width="1.4" stroke-linecap="round"/></svg>';
function farmHotbarHTML() {
  const hh = FARM.ensure(S), sel = App.farmTool || {};
  return `<div class="hotbar">
    <button class="hbslot ${!sel.tool && !sel.seed ? 'on' : ''}" data-a="farmtool" data-v="">✋</button>
    ${FARM_TOOLS.filter(tl => hh.tools[tl.id]).map(tl => `<button class="hbslot ${sel.tool === tl.id ? 'on' : ''}" data-a="farmtool" data-v="tool:${tl.id}">${tl.id === 'watercan' ? WATERCAN_SVG : tl.icon}</button>`).join('')}
    ${CROPS.filter(cr => hh.seeds[cr.id] > 0).map(cr => `<button class="hbslot ${sel.seed === cr.id ? 'on' : ''}" data-a="farmtool" data-v="seed:${cr.id}">${cr.icon}<small>${hh.seeds[cr.id]}</small></button>`).join('')}
  </div>`;
}
PANELS.farmstall = () => {
  const hh = FARM.ensure(S);
  let b = `<div class="m">${t('seedShopDesc')}</div><div class="t">🌱 ${t('buySeeds')}</div>`;
  const seedRow = cr => { const lock = cr.ulv > S.level; return `<div class="li"><div class="ic">${cr.icon}</div><div class="grow"><div class="t">${t('crop_' + cr.id)} ${lock ? '🔒 Lv' + cr.ulv : ''}</div>${cr.tree ? `<div class="m">🌳 ${t('treeInfo', { a: cr.growDays, b: cr.regrow, n: cr.yield })}</div>` : ''}<div class="m">🪙${cr.seedCost}/${t('seedUnit')} · ${t('haveSeed', { n: hh.seeds[cr.id] || 0 })}</div></div>${lock ? '' : `<button class="btn o sm ${S.coins < cr.seedCost ? 'dis' : ''}" data-a="fbuyseed" data-v="${cr.id}" data-w="1">+1</button><button class="btn g sm ${S.coins < cr.seedCost * 5 ? 'dis' : ''}" data-a="fbuyseed" data-v="${cr.id}" data-w="5">+5</button>`}</div>`; };
  b += CROPS.filter(cr => !cr.tree).map(seedRow).join('') + `<div class="t" style="margin-top:10px">🌳 ${t('treeSeeds')}</div><div class="m">${t('treeSeedsDesc')}</div>` + CROPS.filter(cr => cr.tree).map(seedRow).join('');
  b += `<div class="t" style="margin-top:10px">🧰 ${t('toolShop')}</div><div class="m">${t('toolShopDesc')}</div>` + FARM_TOOLS.map(tl => { const owned = hh.tools[tl.id]; return `<div class="li"><div class="ic">${tl.icon}</div><div class="grow"><div class="t">${t('tool_' + tl.id)}</div><div class="m">${owned ? t('toolOwned') : '🪙' + fmt(tl.cost)}</div></div>${owned ? '<span class="m">✅</span>' : `<button class="btn o sm ${S.coins < tl.cost ? 'dis' : ''}" data-a="fbuytool" data-v="${tl.id}">${t('buyBtn')}</button>`}</div>`; }).join('');
  b += `<div class="t" style="margin-top:10px">🥣 ${t('goodsTitle')}</div>` + FARM_GOODS.filter(g => !g.noshop).map(g => { const lock = g.ulv > S.level; return `<div class="li"><div class="ic">${g.icon}</div><div class="grow"><div class="t">${t('good_' + g.id)} ${lock ? '🔒 Lv' + g.ulv : ''}</div><div class="m">🪙${g.cost}/${t('seedUnit')} · ${t('haveSeed', { n: hh.produce[g.id] || 0 })}</div></div>${lock ? '' : `<button class="btn o sm ${S.coins < g.cost ? 'dis' : ''}" data-a="fbuygood" data-v="${g.id}" data-w="1">+1</button><button class="btn g sm ${S.coins < g.cost * 5 ? 'dis' : ''}" data-a="fbuygood" data-v="${g.id}" data-w="5">+5</button>`}</div>`; }).join('');
  const produce = CROPS.filter(cr => hh.produce[cr.id] > 0);
  b += `<div class="t" style="margin-top:10px">📦 ${t('sellProduce')}</div>`;
  b += produce.length ? produce.map(cr => `<div class="li"><div class="ic">${cr.icon}</div><div class="grow"><div class="t">${t('crop_' + cr.id)} ×${hh.produce[cr.id]}</div><div class="m">🪙${cr.sellPrice}/${t('seedUnit')}</div></div><button class="btn o sm" data-a="fsell" data-v="${cr.id}" data-w="1">${t('sellBtn')}</button><button class="btn g sm" data-a="fsell" data-v="${cr.id}" data-w="${hh.produce[cr.id]}">${t('sellAllBtn')}</button></div>`).join('') : `<div class="m">${t('noProduce')}</div>`;
  return frameHTML('🌱 ' + t('seedShop'), b);
};
PANELS.farmtools = () => {
  const hh = FARM.ensure(S);
  const b = FARM_TOOLS.map(tl => { const owned = hh.tools[tl.id]; return `<div class="li"><div class="ic">${tl.icon}</div><div class="grow"><div class="t">${t('tool_' + tl.id)}</div><div class="m">${owned ? t('toolOwned') : '🪙' + fmt(tl.cost)}</div></div>${owned ? '<span class="m">✅</span>' : `<button class="btn o sm ${S.coins < tl.cost ? 'dis' : ''}" data-a="fbuytool" data-v="${tl.id}">${t('buyBtn')}</button>`}</div>`; }).join('');
  return frameHTML('🧰 ' + t('toolShop'), `<div class="m">${t('toolShopDesc')}</div>` + b);
};
PANELS.cafe = () => {
  const cf = CAFE.ensure(S), L = CAFE_LV[cf.lv], nx = CAFE_LV[cf.lv + 1];
  let b = `<div class="m">${t('cafeDesc2')} · ${t('cafeServedCount', { n: cf.served || 0 })}</div>`;
  b += `<div class="t" style="margin-top:6px">🧾 ${t('cafeOrders')}</div>`;
  b += cf.orders.length ? cf.orders.map(o => { const d = CAFE_DISHES.find(x => x.id === o.dish); const have = cf.dishes[o.dish] || 0; return `<div class="li"><div class="ic">${d ? d.icon : '🍽️'}</div><div class="grow"><div class="t">${d ? t('dish_' + d.id) : o.dish}${o.buyerName ? ' · ' + esc(o.buyerName) : ''}</div><div class="m">🪙${fmt(o.pay)} · ${t('haveDish', { n: have })}</div></div><button class="btn o sm ${have ? '' : 'dis'}" data-a="cafeserve" data-v="${o.id}">${t('cafeServeBtn')}</button></div>`; }).join('') : `<div class="m">${t('cafeOrdersEmpty')}</div>`;
  b += `<div class="t" style="margin-top:10px">🍳 ${t('cafeStock')}</div>`;
  const made = CAFE_DISHES.filter(d => cf.dishes[d.id] > 0);
  b += made.length ? made.map(d => `<div class="li"><div class="ic">${d.icon}</div><div class="grow"><div class="t">${t('dish_' + d.id)}</div></div><div class="m">×${cf.dishes[d.id]}</div></div>`).join('') : `<div class="m">${t('noDish')}</div>`;
  b += `<button class="btn o block" style="margin-top:10px" data-a="cafepanel" data-v="cafecook">🍳 ${t('cafeCook')}</button>`;
  b += `<div class="row" style="margin-top:8px;gap:8px"><button class="btn g block" data-a="cafepanel" data-v="cafeshop">🛋️ ${t('cafeShopBtn')}</button><button class="btn g block" data-a="cafeedit">🔨 ${t('cafeEditBtn')}</button></div>`;
  b += `<button class="btn g block" style="margin-top:8px" data-a="cafepanel" data-v="cafestaff">👩‍🍳 ${t('hospStaffTab')} (${(cf.staff || []).length}) · 😊 ${t('cafeJoy')} ${Math.round(cf.joy || 0)}%</button>`;
  b += `<div class="t" style="margin-top:10px">⬆️ ${t('cafeUp')}</div><div class="card"><div class="m">📐 ${L.w}×${L.d} · 🪑 ${CAFE_LAYOUT().tables.length} · 🎰 ${CAFE_LAYOUT().slots.length} · 🐾 ${L.pets}</div>`;
  if (nx) { const lock = S.level < nx.ulv; b += `<div class="m">${t('cafeUpNext')} 📐 ${nx.w}×${nx.d} · 🐾 ${nx.pets}</div>${lock ? `<div class="m">🔒 ${t('homeNeedPlayer', { n: nx.ulv })}</div>` : `<button class="btn o block ${S.coins < nx.cost ? 'dis' : ''}" data-a="cafeup">⬆️ ${t('cafeUpBtn')} 🪙${fmt(nx.cost)}</button>`}`; } else b += `<div class="m">${t('cafeUpMax')}</div>`;
  b += '</div>';
  return frameHTML('☕ ' + t('cafeName'), b);
};
PANELS.cafecook = () => {
  const fh = FARM.ensure(S);
  let b = `<button class="btn o sm" data-a="cafepanel" data-v="cafe">◀ ${t('cafeOrders')}</button> <button class="btn g sm" data-a="cafepanel" data-v="cafefridge">🧊 ${t('cafeFridge')}</button><div class="m">${t('cafeCookDesc')}</div><div class="grid3">`;
  let hidden = 0;
  for (const d of CAFE_DISHES) {
    if (!CAFE.dishUnlocked(S, d)) { hidden++; continue; }
    const ok = CAFE.canCook(S, d);
    const ing = Object.entries(d.ing).map(([k, n]) => { const inf = cafeIngInfo(k); return `<span style="white-space:nowrap">${inf ? inf.icon : k}${n}<small>/${fh.produce[k] || 0}</small></span>`; }).join(' ');
    b += `<button class="tile ${ok ? '' : 'dis'}" data-a="cafecookgo" data-v="${d.id}"><div class="ic" style="font-size:28px">${d.icon}</div><div class="m"><b>${t('dish_' + d.id)}</b></div><div class="m">${ing}</div></button>`;
  }
  b += '</div>' + (hidden ? `<div class="m" style="margin-top:6px">🔒 ${t('cafeMoreDishes', { n: hidden })}</div>` : '');
  return frameHTML('🍳 ' + t('cafeCook'), b);
};
// the café "fridge" is the farm's produce stock: everything harvested lands here automatically
PANELS.cafefridge = () => {
  const fh = FARM.ensure(S), rows = CROPS.map(cr => ({ id: cr.id, icon: cr.icon, n: fh.produce[cr.id] || 0, name: t('crop_' + cr.id) })).concat(FARM_GOODS.filter(g => !g.feed).map(g => ({ id: g.id, icon: g.icon, n: fh.produce[g.id] || 0, name: t('good_' + g.id) }))).concat(Object.entries(RANCH_GOODS).map(([k, g]) => ({ id: k, icon: g.icon, n: fh.produce[k] || 0, name: t('rg_' + k) }))).filter(r => r.n > 0);
  let b = `<button class="btn o sm" data-a="cafepanel" data-v="cafecook">◀ ${t('cafeCook')}</button><div class="m">${t('cafeFridgeDesc')}</div>`;
  b += rows.length ? rows.map(r => `<div class="li"><div class="ic">${r.icon}</div><div class="grow"><div class="t">${r.name}</div></div><div class="m">×${r.n}</div></div>`).join('') : `<div class="m">${t('cafeFridgeEmpty')}</div>`;
  return frameHTML('🧊 ' + t('cafeFridge'), b);
};
PANELS.mate = m => {
  const p = S.pets.find(x => x && x.id === m.pid); if (!p) return '';
  const list = G.mates(S, p);
  return frameHTML('💞 ' + t('breedTitle'), `<div class="m">${t('breedDesc')}</div>` + list.map(q => {
    const ok = G.canBreed(q) && G.canBreed(p);
    return `<button class="li" data-a="breed" data-v="${p.id}" data-w="${q.id}"><div class="ic"><img src="${PIC.my(q)}"></div><div class="grow"><div class="t">${esc(q.name)} <span class="sex ${q.sex}">${q.sex === 'm' ? '♂' : '♀'}</span></div>
      <div class="m">💗 ${Math.round(q.happy)}% · 🍖 ${Math.round(q.hunger)}%${q.bcd > 0 ? ' · 😴 ' + fmtT(q.bcd) : ''}</div></div><span class="btn p sm ${ok ? '' : 'dis'}">💕</span></button>`;
  }).join('') + `<button class="btn g block" data-a="back" data-v="${p.id}">←</button>`);
};
PANELS.cust = m => {
  const c = S.customers.find(x => x.id === m.cid); if (!c) return '';
  const lk = ART.randomHuman(c.seed || c.id);
  if (c.type === 'vip') Object.assign(lk, { top: 'jacket', jacket: '#c9a227', glasses: 2, hat: 'crown', necklace: true }); // same outfit as in the village
  const typ = c.type && c.type !== 'normal' ? `<span class="tag2 ${c.type}">${t('ctype_' + c.type)}</span>` : '';
  const head = `<div class="row"><div class="portrait" style="width:76px;height:76px"><img src="${PIC.human(lk, 'c' + (c.seed || c.id) + (c.type === 'vip' ? 'v' : ''))}"></div><div class="grow"><div class="t">${esc(c.name || t('customer'))} ${typ}</div>`;
  if (c.st === 'gwait') return frameHTML('✂️ ' + t('groomSvc'), head + `<div class="card" style="margin:4px 0">💬 ${t('groomSays', { sp: spName(c.vsp) })}</div>${bar(c.pat / c.max * 100, 'linear-gradient(#b8e89a,#5cae3c)', '⏳ ' + fmtT(c.pat))}</div></div>
    <div class="center"><img src="${PIC.pet(c.vsp)}" style="width:90px"></div><button class="btn o block" data-a="groomsvc" data-v="${c.id}">🪮 ${t('startGroom')}</button>`);
  if (c.st !== 'want') return '';
  const need = NEEDS.find(n => n.id === c.need);
  const say = c.type === 'collector' ? t('collectorSays', { sp: spName(c.sp) }) : c.type === 'breeder' ? t('breederSays') : (need ? (CFG.lang === 'ru' ? need.ru : need.ko) : '') + (c.cat || c.sp ? ' (' + (c.sp ? spName(c.sp) : t('f_' + c.cat)) + ')' : '');
  const candsRaw = S.pets.filter(p => p && p.grow >= 1 && !p.fav && !p.escaped);
  // 추천 가능(매칭) → 위로, 그중 가격 비싼 순. 비활성은 아래로
  const cands = candsRaw.slice().sort((a, b) => {
    const fa = G.matches(c, a) ? 1 : 0, fb = G.matches(c, b) ? 1 : 0;
    if (fa !== fb) return fb - fa;
    return G.price(S, b, c) - G.price(S, a, c);
  });
  return frameHTML((c.vip ? '👑 ' : '') + t('customer'), head + `<div class="card" style="margin:4px 0">💬 ${esc(say)}</div>
    ${bar(c.pat / c.max * 100, 'linear-gradient(#b8e89a,#5cae3c)', '⏳ ' + fmtT(c.pat))}</div></div>
    <div class="m" style="margin-top:8px">💡 ${t('matchHint')} ${t('priceHint')}</div>
    <div class="t" style="margin-top:6px">${t('chooseToSell')}</div>
    ${c.type === 'vip' ? `<div class="card" style="margin:6px 0;background:#fff4d0;border-color:#e0b43c">👑 ${t('vipSays')}</div>` : ''}
    ${cands.map(p => { const fit = G.matches(c, p), rr = rareOf(p.coat || 0), pr = G.price(S, p, c); return `<div class="li"><div class="ic"><img src="${PIC.my(p)}"></div><div class="grow"><div class="t">${esc(p.name)} <span class="m">Lv${p.lv || 1}</span>${rr ? ` <span class="tag2 vip">✨ ${t('vipOnlyTag')}</span>` : ''}</div><div class="custprice ${fit ? '' : 'off'}">🪙 ${fmt(pr)}${c.type === 'family' ? ' + 🧺' + fmt(Math.round(pr * .12)) : ''}</div><div class="m">${esc(spName(p.sp))} · ${traitName(p.trait)} · ${t('condition')} ${Math.round(G.cond(p))}%</div></div>
      <div class="col" style="gap:5px"><button class="btn o sm ${fit ? '' : 'dis'}" data-a="sell" data-v="${p.id}" data-w="${c.id}">🤝 ${t('recommend')}</button>${tricksOf(p).length ? `<button class="btn b sm ${p.tcd > 0 ? 'dis' : ''}" data-a="trick" data-v="${p.id}" data-w="${c.id}">🎪 ${t('trickBtn')}</button>` : ''}</div></div>`; }).join('')
      || `<div class="card center"><div class="t">${t('noMatch')}</div><div class="m">${t('noMatchHint')}</div></div>`}
    ${c.st === 'want' ? `<button class="btn r block" data-a="custsorry" data-v="${c.id}">🙇 ${t('custSorry')}</button>` : ''}
    <button class="btn g block" data-a="close">${t('close')}</button>`);
};
// v2026-10-08: tap a villager on the street/park to see who they are -- a real, fixed resident (TOWN.residentById), not a random passerby
PANELS.villager = m => {
  const res = typeof TOWN !== 'undefined' && TOWN.residentById ? TOWN.residentById(S, m.rid) : null;
  if (!res) return '';
  const lk = ART.randomHuman(res.seed), pets = res.pets || [], happy = res.happy == null ? 70 : res.happy;
  const home = typeof TOWN.objs === 'function' ? TOWN.objs().find(o => o.id === res.home) : null;
  const addr = home && TOWN.addressOf ? TOWN.addressOf(S, home) : '';
  const townHap = TOWN.stats ? TOWN.stats(S).hap : null;
  const visits = res.visits || 0;
  const head = `<div class="row"><div class="portrait" style="width:76px;height:76px"><img src="${PIC.human(lk, 'res' + res.id)}"></div><div class="grow"><div class="t">${esc(res.name || t('villagerTitle'))}</div>
    <div class="m">${addr ? '📍 ' + esc(addr) : t('villagerHome')}</div>
    ${bar(happy, 'linear-gradient(#ffd3e0,#ff7aa8)', '😊 ' + t('villagerHappy') + ' ' + Math.round(happy) + '%')}</div></div>`;
  const why = `<div class="card" style="margin-top:6px"><div class="m">${t('villagerWhyTitle')}</div>
    <div class="m">🏘️ ${t('villagerWhyTown', { n: townHap == null ? '?' : Math.round(townHap) })}</div>
    <div class="m">🚶 ${t('villagerWhyVisits', { n: visits })}</div>
    <div class="m">🐾 ${t('villagerWhyPets', { n: pets.length })}</div></div>`;
  const body = pets.length
    ? `<div class="t" style="margin-top:8px">🐾 ${t('villagerPets')}</div>${pets.map(p => `<div class="li"><div class="ic"><img src="${PIC.pet(p.sp)}"></div><div class="grow"><div class="t">${esc(p.name)}</div><div class="m">${esc(spName(p.sp))}</div></div></div>`).join('')}`
    : `<div class="card center" style="margin-top:8px"><div class="m">${t('villagerNoPet')}</div></div>`;
  return frameHTML('🏠 ' + t('villagerTitle'), head + why + body + `<button class="btn g block" data-a="close">${t('close')}</button>`);
};
// v2026-10-08: tap someone walking the street who ISN'T one of our fixed residents -- an out-of-town
// customer heading for the shop (no house here, so no villager record). Used to silently do nothing.
PANELS.visitor = m => {
  const c = S.customers.find(x => x.id === m.cid); if (!c) return '';
  const lk = ART.randomHuman(c.seed || c.id);
  if (c.type === 'vip') Object.assign(lk, { top: 'jacket', jacket: '#c9a227', glasses: 2, hat: 'crown', necklace: true });
  const typ = c.type && c.type !== 'normal' ? `<span class="tag2 ${c.type}">${t('ctype_' + c.type)}</span>` : '';
  const head = `<div class="row"><div class="portrait" style="width:76px;height:76px"><img src="${PIC.human(lk, 'c' + (c.seed || c.id) + (c.type === 'vip' ? 'v' : ''))}"></div><div class="grow"><div class="t">${esc(c.name || t('customer'))} ${typ}</div>
    <div class="m">🧳 ${t('visitorDesc')}</div></div></div>`;
  return frameHTML('🧳 ' + t('visitorTitle'), head + `<button class="btn g block" data-a="close">${t('close')}</button>`);
};
const instaBadge = () => (S.letters || []).filter(l => !l.read || l.unread).length;
PANELS.letters = m => {
  const L = S.letters || [], mine = L.filter(l => l.mine).length;
  const tab = m.tab || 'all';
  m.tab = tab;
  const list = tab === 'mine' ? L.filter(l => l.mine) : tab === 'reviews' ? L.filter(l => !l.mine && l.kind !== 'daily') : tab === 'feed' ? L.filter(l => l.kind === 'daily') : L;
  let h = `<div class="iprof"><img src="${PIC.human(CFG.look, 'me' + JSON.stringify(CFG.look).length)}"><div class="grow"><b>@${esc(String(S.shop).replace(/\s/g, '_'))}</b>
    <div class="istats"><span><b>${L.length}</b>${t('ig_posts')}</span><span><b>${fmt(S.followers || 20)}</b>${t('ig_followers')}</span><span><b>${starStr(S.rep || 0)}</b>${t('reputation')}</span></div></div></div>
    ${(() => {
      const pp = G.popOf(S);
      const isRu = typeof CFG !== 'undefined' && CFG.lang === 'ru';
      const tiers = [
        [0, '🌱', isRu ? 'Уютный магазинчик' : '동네 작은 펫샵'],
        [20, '🌿', isRu ? 'Популярный уголок' : '입소문 난 펫샵'],
        [45, '🌟', isRu ? 'Городская достопримечательность' : '지역 명소 펫샵'],
        [75, '👑', isRu ? 'Знаменитый хит' : '유명 핫플레이스'],
        [100, '🏆', isRu ? 'Национальный лидер' : '전국구 랜드마크'],
        [150, '💎', isRu ? 'Мировая звезда' : '글로벌 스타 펫타운'],
        [250, '✨', isRu ? 'Суперзвезда галактики' : '우주 대스타 펫천국'],
        [400, '🪐', isRu ? 'Легендарный рай питомцев' : '전설의 영원한 펫타운']
      ];
      let cur = tiers[0];
      for (const tr of tiers) { if (pp >= tr[0]) cur = tr; }
      const prog = pp < 100 ? pp : Math.min(100, ((pp % 50) / 50) * 100);
      return `<div class="card"><div class="t">${cur[1]} ${t('popL')}: <b>${cur[2]}</b> <span class="m">(${Math.round(pp)} pts · ${isRu ? 'без лимита' : '한도 없는 무제한 성장'})</span></div>${bar(prog, 'linear-gradient(#ffb3c7,#ee2a7b)', Math.round(pp) + ' pts')}<div class="m">${t('popDesc')} · ${isRu ? 'Популярность растёт без ограничений, привлекая всё больше гостей!' : '인기도 한도 없이 무제한으로 계속 상승하여 더 많은 손님들이 끊임없이 찾아옵니다!'}</div></div>`;
    })()}
    ${(() => { const ch = G.igCh(S), tr = G.igTier(S), nx = G.IG_TIERS[tr], fit = S.pets.some(p => p && G.igChFit(ch.k, p));
      return `<div class="card" style="background:#fff0f6;border-color:#f3a6c4"><div class="t">🔥 ${t('igChTitle')}: <b>${t('igTag_' + ch.k)}</b></div>
        <div class="m">${ch.done ? '✅ ' + t('igChDoneToday') : t('igChDesc') + (fit ? ' · ' + t('igChHave') : ' · ' + t('igChNone'))}</div></div>
        <div class="card"><div class="m">👥 ${t('igTierL', { n: tr })} · ${t('igTierBoost', { p: tr * 5 })}</div>${nx ? bar(Math.min(100, (S.followers || 20) / nx * 100), 'linear-gradient(#ffd08a,#ee2a7b)', fmt(S.followers || 20) + ' / ' + fmt(nx)) + `<div class="m">${t('igTierNext', { n: fmt(nx) })}</div>` : ''}</div>`; })()}
    <div class="row" style="gap:6px"><button class="btn o grow" data-a="open" data-v="newpost">📸 ${t('ig_new')}</button><button class="btn g ${instaBadge() ? '' : 'dis'}" data-a="likeall">❤️ ${t('igLikeAll')}${instaBadge() ? ' (' + instaBadge() + ')' : ''}</button></div>
    <div class="tabs">${[['all', t('ig_all')], ['feed', t('ig_feed')], ['reviews', t('ig_reviews')], ['mine', t('ig_mine')]].map(([k, l]) => `<button class="${tab === k ? 'on' : ''}" data-a="stab" data-v="${k}">${l}</button>`).join('')}</div>`;
  h += list.length ? `<div class="igrid">${list.map(l => `<button data-a="letter" data-v="${l.id}"><img src="${letterPic(l, 1)}">${!l.read || l.unread ? '<i class="dot"></i>' : ''}${(l.chat || []).length ? `<span class="cc">💬${l.chat.length}</span>` : ''}${l.kind === 'bad' ? '<span class="bd">😢</span>' : l.celeb ? '<span class="bd">⭐</span>' : ''}</button>`).join('')}</div>` : `<div class="m center">${t('ig_empty')}</div>`;
  return frameHTML('📷 Instagram', h);
};
PANELS.letter = m => {
  const l = (S.letters || []).find(x => x.id === m.lid); if (!l) return '';
  const tags = (TAGS[CFG.lang] || TAGS.ko); const tg = [tags[l.n % tags.length], tags[(l.n + 3) % tags.length], '#' + String(S.shop).replace(/\s/g, '')]; if (l.ch) tg.unshift(t('igTag_' + l.ch) + ' 🔥');
  const author = l.mine ? String(S.shop).replace(/\s/g, '_') : l.from;
  const av = l.mine ? PIC.human(CFG.look, 'me' + JSON.stringify(CFG.look).length) : PIC.human(ART.randomHuman(l.seed), 'c' + l.seed);
  const chat = (l.chat || []).map(x => x.w === 'm'
    ? `<div class="ichat me"><div class="bub">${esc(x.x)}</div></div>`
    : `<div class="ichat"><img src="${PIC.human(ART.randomHuman(x.sd || 1), 'c' + (x.sd || 1))}"><div class="bub"><b>@${esc(x.n || '')}</b> ${esc(x.x)}</div></div>`).join('');
  const typing = l.wait != null ? `<div class="ichat"><img src="${l.mine && l.talkTo ? PIC.human(ART.randomHuman(l.talkTo.sd), 'c' + l.talkTo.sd) : av}"><div class="bub typing"><i></i><i></i><i></i></div></div>` : '';
  return frameHTML('📷 @' + esc(author), `<div class="insta"><div class="ihead"><img src="${av}"><b>@${esc(author)}${l.celeb ? ' ✔️' : ''}</b><span class="m">${t('dayN', { n: l.day })}</span></div>
    <img class="iphoto" src="${letterPic(l)}"><div class="iacts"><button data-a="like" data-v="${l.id}" class="${l.liked ? 'on' : ''}">${l.liked ? '❤️' : '🤍'}</button> 💬 ${(l.chat || []).length} 📤 <span class="m">${t('likes', { n: fmt(l.likes) })}</span></div>
    <div class="icap"><b>@${esc(author)}</b> ${esc(l.mine || l.kind === 'daily' ? (l.text || '') : letterText(l))}<div class="itags">${tg.map(esc).join(' ')}</div></div>
    <div class="ithread">${chat}${typing}</div>
    <button class="btn o block" data-a="icomment" data-v="${l.id}">💬 ${t(l.mine ? 'ig_replyFan' : 'ig_reply')}</button></div>`);
};
PANELS.newpost = m => {
  const ps = S.pets.filter(Boolean);
  return frameHTML('📸 ' + t('ig_new'), ps.length ? `<div class="m">${t('ig_pick')}${G.igCh(S).done ? '' : '<br>🔥 ' + t('igChPick', { tag: t('igTag_' + G.igCh(S).k) })}</div><div class="grid3">${ps.map(p => { const hot = !G.igCh(S).done && G.igChFit(G.igCh(S).k, p); return `<button class="tile" data-a="ipost" data-v="${p.id}" style="${hot ? 'border-color:#ee2a7b;background:#fff0f6' : ''}"><img src="${PIC.my(p)}" style="width:64px;height:64px"><div class="m">${hot ? '🔥 ' : ''}${esc(p.name)}</div></button>`; }).join('')}</div>` : `<div class="m">${t('ig_noPets')}</div>`);
};
function letterText(l) {
  const pool = (LETTERS[l.kind] || LETTERS.ok)[CFG.lang === 'ru' ? 'ru' : 'ko'];
  return pool[l.n % pool.length].replace(/\{pet\}/g, l.pet).replace(/\{shop\}/g, S.shop);
}
const LPIC = new Map();
function letterPic(l, small) {
  const key = l.id + (small ? 's' : '');
  if (LPIC.has(key)) return LPIC.get(key);
  const Wd = small ? 90 : 320, Ht = small ? 90 : 320, cv = document.createElement('canvas'); cv.width = Wd * 2; cv.height = Ht * 2;
  const c = cv.getContext('2d'); c.scale(2 * Wd / 320, 2 * Ht / 320);
  const walls = [['#fbe1e6', '#f5c9d2'], ['#dff0e6', '#c9e5d6'], ['#dcebf7', '#c4ddf0'], ['#f6ead6', '#efdcc0']][l.n % 4];
  c.fillStyle = walls[0]; c.fillRect(0, 0, 320, 320); c.fillStyle = walls[1]; for (let x = 0; x < 320; x += 40) c.fillRect(x, 0, 20, 200);
  c.fillStyle = '#d9b48a'; c.fillRect(0, 200, 320, 120); c.fillStyle = 'rgba(0,0,0,.06)'; for (let y = 210; y < 320; y += 22) c.fillRect(0, y, 320, 2);
  c.fillStyle = '#bfe3f7'; ART.rrect(c, 200, 30, 90, 80, 8); c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 6; c.stroke();
  c.fillStyle = ['#e07a5f', '#6d9dc5', '#90be6d', '#b59be0'][l.n % 4]; ART.rrect(c, 20, 150, 170, 70, 18); c.fill(); ART.rrect(c, 20, 120, 170, 40, 16); c.fill();
  ART.ell(c, 160, 270, 90, 26, 'rgba(255,255,255,.5)');
  const TP = { walk: ['#cfeec0', '🌳', '🍃'], sleep: ['#d8d4f2', '💤', '🌙'], bath: ['#d6f0fb', '🫧', '🛁'], birthday: ['#fde3ea', '🎂', '🎉'], toy: ['#fff0c9', '🎾', '🧸'], food: ['#ffe6cc', '🍖', '🥣'], outfit: ['#f9dcef', '🎀', '👗'], vet: ['#e3f1ec', '🩺', '💊'], funny: ['#fff3c4', '😂', '💥'], question: ['#e6ecfb', '❓', '💭'], growth: ['#e4f5d9', '🌱', '📏'] }[l.topic];
  if (TP) { c.fillStyle = TP[0]; c.globalAlpha = .55; c.fillRect(0, 0, 320, 200); c.globalAlpha = 1; c.font = '40px sans-serif'; c.fillText(TP[1], 230, 160); c.font = '30px sans-serif'; c.fillText(TP[2], 30, 70); }
  if (!small && !l.mine && (!TP || l.topic === 'walk' || l.topic === 'birthday' || l.topic === 'vet' || l.adopter && Math.abs(l.seed % 2))) { c.save(); c.translate(80, 285); c.scale(1.5, 1.5); ART.human(c, ART.randomHuman(l.seed), 0, 1, false, l.kind === 'bad' ? 'sad' : l.kind === 'ok' ? 'calm' : l.topic === 'vet' ? 'sad' : 'happy'); c.restore(); }
  c.save(); c.translate(small || l.mine ? 160 : 190, 280); const ak = 3.2 * (l.age == null ? 1 : .75 + .25 * l.age); c.scale(ak, ak); ART.pet(c, l.sp, { t: 1.4, seed: l.coat || 0, age: l.age, sleep: l.topic === 'sleep', mood: l.topic ? ({ vet: 'sad', funny: 'curious', question: 'hungry', food: 'love', bath: 'happy' }[l.topic] || 'love') : l.mine ? 'love' : l.kind === 'bad' ? 'sad' : l.kind === 'ok' ? 'calm' : 'love', happy: l.kind === 'great' || l.kind === 'celeb' }); c.restore();
  c.font = '28px sans-serif'; if (TP) {} else if (l.kind !== 'bad') { c.fillText('💕', 250, 170); c.fillText('✨', 40, 60); } else c.fillText('💧', 250, 170);
  const url = cv.toDataURL('image/jpeg', .85); LPIC.set(key, url); return url;
}
PANELS.shelf = m => { // v1.13b: every product of the shelf is displayed together, each with its own stock
  const it = S.items.find(i => i.id === m.iid); if (!it) return '';
  const CAP = G.SHELF_CAP || 12, inv = it.inv || (it.prod ? { [it.prod]: it.stock } : {}), prs = PRODUCTS.filter(x => x.shelf === it.k), open = prs.filter(x => x.lv <= S.level);
  let totalNeed = 0, totalCost = 0;
  open.forEach(pr => {
    const have = inv[pr.id] || 0, n = Math.max(0, CAP - have);
    totalNeed += n;
    totalCost += n * pr.cost;
  });
  let h = `<div class="card center"><div style="font-size:30px">${open.filter(x => inv[x.id] > 0).map(x => x.icon).join(' ') || '📦'}</div><div class="t">${t('stock')}: ${it.stock || 0} / ${CAP * open.length}</div>
    ${bar((it.stock || 0) / (CAP * Math.max(1, open.length)) * 100, 'linear-gradient(#b8e89a,#5cae3c)', (it.stock || 0) + '/' + CAP * open.length)}
    <button class="btn o block ${totalNeed <= 0 || S.coins < totalCost ? 'dis' : ''}" data-a="restock" data-v="${it.id}" data-w="all">${totalNeed <= 0 ? '✅ ' + t('shelfFullBtn') : '🛒 ' + t('shelfBuyAllBtn') + ' · 🪙' + fmt(totalCost)}</button></div><div class="m">${t('shelfDesc2')}</div>`;
  prs.forEach(pr => {
    const lock = pr.lv > S.level, have = inv[pr.id] || 0, n = CAP - have, c = n * pr.cost;
    h += `<div class="li"><div class="ic">${pr.icon}</div><div class="grow"><div class="t">${t('pr_' + pr.id)}${lock ? '' : ` <span class="m">${have}/${CAP}</span>`}</div><div class="m">${lock ? '🔒 ' + t('unlockAt', { n: pr.lv }) : t('prInfo', { c: pr.cost, p: pr.price + Math.floor(lvE(S) / 2) })}</div>${lock ? '' : bar(have / CAP * 100, have <= 2 ? 'linear-gradient(#ffb199,#e0604e)' : 'linear-gradient(#b8e89a,#5cae3c)')}</div>
      ${lock ? '' : `<button class="btn o sm ${n <= 0 || S.coins < c ? 'dis' : ''}" data-a="restock" data-v="${it.id}" data-w="${pr.id}">${n <= 0 ? '✅ ' + t('shelfFullBtn') : '📦 🪙' + fmt(c)}</button>`}</div>`;
  });

  return frameHTML(t('d_' + it.k) || t('shelfName'), h);
};
PANELS.hotel = () => frameHTML('🏨 ' + t('hotelName'), `<div class="m">${t('hotelDesc')}</div>` + ((S.guests || []).map(g => `<div class="li"><div class="ic"><img src="${PIC.pet(g.sp, false, ART.hashStr(g.name || g.sp))}"></div><div class="grow"><div class="t">${esc(g.name)} <span class="m">(${esc(g.owner)})</span></div>
  <div class="m">🍖 ${Math.round(g.hunger)}% · 💗 ${Math.round(g.happy)}% · ⏰ ${String(Math.floor(g.pick / 60)).padStart(2, '0')}:${String(Math.floor(g.pick % 60)).padStart(2, '0')}</div></div>
  <div class="col" style="gap:5px"><button class="btn o sm" data-a="gcare" data-v="${g.id}" data-w="feed">🍖</button><button class="btn b sm" data-a="gcare" data-v="${g.id}" data-w="play">🎾</button></div></div>`).join('') || `<div class="card center m">${t('hotelEmpty')}</div>`));
PANELS.market = m => {
  const now = Date.now();
  let h = `<div class="m">${t('adoptSub')}</div>`;
  const dl = S.deliveries || [];
  h += '<div class="grid2">';
  // 활성(케이지 여유 + 대기 끝 + 코인 충분) 먼저 → 그중 비싼 순
  const offers = S.offers.slice().sort((a, b) => {
    const ka = G.kindOf(a.sp), kb = G.kindOf(b.sp);
    const actA = (G.freeSlotsKind(S, ka).length > 0 && a.cd <= now && S.coins >= a.cost) ? 1 : 0;
    const actB = (G.freeSlotsKind(S, kb).length > 0 && b.cd <= now && S.coins >= b.cost) ? 1 : 0;
    if (actA !== actB) return actB - actA;
    return b.cost - a.cost;
  });
  for (const o of offers) {
    const kind = G.kindOf(o.sp), free = G.freeSlotsKind(S, kind).length > 0, wait = o.cd > now;
    h += `<div class="tile">${o.stars ? `<span class="badge" style="background:#f0b43c">${'★'.repeat(o.stars)}</span>` : ''}${o.gift ? '<span class="badge" style="background:#ff7ab8;left:4px;right:auto">🎁</span>' : ''}${rareOf(o.coat || 0) ? '<span class="badge" style="background:#9a6aff;left:4px;right:auto;top:22px">✨</span>' : ''}<img src="${PIC.pet(o.sp, false, o.coat)}"><div class="t">${esc(spName(o.sp))} <span class="sex ${o.sex}">${o.sex === 'm' ? '♂' : '♀'}</span></div>
      <div class="m">${o.stars ? t('rare') + ' · ' : ''}${t('sellPrice', { c: fmt(Math.round(SPECIES[o.sp].sell * (1 + .3 * o.stars) * (rareOf(o.coat || 0) ? RARE_SELL_MUL : 1))) })}</div>${rareOf(o.coat || 0) ? `<div class="m" style="color:#b07a10">👑 ${t('vipOnlyTag')}</div>` : ''}
      <div class="m" style="color:${free ? '#3f8a28' : '#c0502e'}">${HAB_ICON[kind]} ${t('hk_' + kind)} ${free ? '✓' : '✗'}</div>
      <button class="btn sm ${S.coins < o.cost || !free || wait ? 'dis' : ''}" data-a="adopt" data-v="${o.id}">${wait ? '⏳' : '📝 ' + t('apply')} · 🪙${fmt(o.cost)}</button></div>`;
  }
  h += `</div><button class="btn g block" data-a="reroll">🔄 ${t('reroll')} · 🪙${30 + lvE(S) * 10}</button>`;
  // ★ 배송 현황을 분양 리스트 아래에
  if (dl.length) h += `<div class="t" style="margin-top:10px">🚚 ${t('delivering')}</div>` + dl.map(d => `<div class="li"><div class="ic"><img src="${PIC.pet(d.sp, false, d.coat)}"></div><div class="grow"><div class="t">${esc(spName(d.sp))} ${'⭐'.repeat(d.stars || 0)}</div>
    <div class="m">${d.st === 'arrived' ? t('arrivedCrate') : t('delivering', { t: fmtT(d.left) })}</div>${d.st === 'road' ? bar((1 - d.left / d.max) * 100, 'linear-gradient(#9fdcf5,#4fa3d9)', '🚚') : ''}</div></div>`).join('');
  const next = SPECIES_RAW.filter(r => r[2] > S.level && !TOWN_SP[r[0]]).slice(0, 3);
  if (next.length) h += `<div class="m center" style="margin-top:8px">🔒 ${next.map(r => esc(spName(r[0])) + ' Lv.' + r[2]).join(' · ')}</div>`;
  { const tl = Object.entries(TOWN_SP).filter(([, n]) => TOWN.bestPop(S) < n); if (tl.length) h += `<div class="m center">🏘️ ${tl.map(([k, n]) => esc(spName(k)) + ' ' + t('tPopN', { n })).join(' · ')}</div>`; }
  return frameHTML('🐶 ' + t('adoptTitle'), h);
};
let QZ = null;
function startQuiz(oid) {
  const o = S.offers.find(x => x.id === oid); if (!o) return;
  if (o.cd > Date.now()) { toast(t('quizWait')); return; }
  const kind = G.kindOf(o.sp);
  if (!G.freeSlotsKind(S, kind).length) { toast(t('needHouse', { h: t('hk_' + kind) })); SND.err(); return; }
  if (S.coins < o.cost) { toast(t('notEnough')); SND.err(); return; }
  act({ t: 'adopt', oid }); if (typeof renderPanel === 'function') renderPanel(true); // v1.12: no adoption interview any more -- adopt right away
}
function answerQuiz(i) {
  if (!QZ) return;
  const ok = QZ.ans[i].ok, oid = QZ.oid; QZ = null; closePanel();
  if (ok) { toast(t('quizOk')); act({ t: 'adopt', oid }); }
  else { SND.err(); toast(t('quizFail')); act({ t: 'quizfail', oid }); }
}
PANELS.quiz = () => QZ ? frameHTML('📝 ' + t('quizTitle'), `<div class="row"><div class="portrait" style="width:76px;height:76px"><img src="${PIC.pet(QZ.sp)}"></div>
  <div class="grow card" style="font-weight:800">🧑‍🌾 ${esc(QZ.q)}</div></div>` + QZ.ans.map((a, i) => `<button class="li" data-a="qans" data-v="${i}"><div class="ic">${'ABC'[i]}</div><div class="grow t">${esc(a.a)}</div></button>`).join('')) : '';
PANELS.report = m => { const r = m.e.rep || {}; return frameHTML('🌙 ' + t('report') + ' · ' + t('dayN', { n: m.e.day }), `<div class="grid2">
  ${[['rep_earned', '🪙 ' + fmt(r.earned || 0)], ['rep_served', '🧾 ' + (r.served || 0)], ['rep_sold', '💕 ' + (r.sold || 0)], ['rep_shop', '🛍️ ' + fmt(r.shop || 0)], ['rep_tips', '✨ ' + fmt(r.tips || 0)], ['rep_lost', '💧 ' + (r.lost || 0)]]
    .map(([k, v]) => `<div class="card center"><div class="t">${v}</div><div class="m">${t(k)}</div></div>`).join('')}</div>
  ${r.best ? `<div class="card row"><div class="portrait" style="width:60px;height:60px"><img src="${PIC.pet(r.best.sp, false, r.best.coat || (r.best.id && ART.hashStr(r.best.id)), 'happy')}"></div><div class="grow"><div class="m">🏆 ${t('rep_best')}</div><div class="t">${esc(r.best.name)} · 🪙${fmt(r.best.c)}</div></div></div>` : ''}
  <button class="btn block" data-a="close">🔨 ${t('decorate')} / ${t('ok')}</button><button class="btn b block" data-a="nextday">${t('nextDay')}</button>`); };
// staff management is split per business: pet shop / pet café / pet hospital
function staffCatTabs(cur) {
  const ok = { shop: true, farm: true, cafe: !!(S.cafe && S.cafe.built), hosp: !!(S.hosp && S.hosp.built), ranch: !!S.ranch };
  return `<div class="tabs">` + [['shop', '🏪', 'st_shop'], ['cafe', '☕', 'st_cafe'], ['hosp', '🏥', 'st_hosp'], ['farm', '🌾', 'st_farm'], ['ranch', '🐄', 'tk_ranch']].map(([k, ic, n]) => `<button class="${cur === k ? 'on' : ''}${ok[k] ? '' : ' dis'}" data-a="stafftab" data-v="${k}">${ic} ${t(n)}</button>`).join('') + `</div>`;
}
// the chicken coop card of the farm panel
function coopCardHTML(fm) {
  const cp = fm.coop, day = S.clock ? S.clock.day : 0;
  if (!cp) return `<div class="card"><div class="t">🐔 ${t('henTitle')}</div><div class="m">${t('henDesc')}</div><button class="btn o block ${S.coins < COOP_LV[1].cost ? 'dis' : ''}" data-a="fcoopbuild" style="margin-top:6px">${t('coopBuild')} 🪙${fmt(COOP_LV[1].cost)}</button></div>`;
  const cap = COOP_LV[cp.lv].cap, nx = COOP_LV[cp.lv + 1], feed = fm.produce.chickfeed || 0, fed = cp.hens.filter(h => h.fed === day).length;
  const hens = cp.hens.map(h => `<span style="white-space:nowrap">${day - h.born >= COOP_GROW_DAYS ? '🐔' : '🐤'} ${esc(h.name || '')}${h.fed === day ? ' ✅' : ''}</span>`).join(' · ');
  return `<div class="card"><div class="t">🐔 ${t('henTitle')} Lv${cp.lv} · ${cp.hens.length}/${cap}</div>
    <div class="m">${cp.hens.length ? hens : t('coopEmpty')}</div>
    <div class="m">🥣 ${t('coopFeedStock', { n: feed })} · ${t('coopFedToday', { a: fed, b: cp.hens.length })} · 🥚 ${t('coopEggsWait', { n: cp.eggs })}</div>
    <div class="row" style="flex-wrap:wrap;gap:6px;margin-top:6px"><button class="btn o sm ${cp.hens.length && fed < cp.hens.length ? '' : 'dis'}" data-a="fcoopfeed">${t('coopFeedBtn')}</button><button class="btn g sm ${cp.eggs > 0 ? '' : 'dis'}" data-a="fcoopegg">${t('coopEggBtn')} ${cp.eggs > 0 ? '×' + cp.eggs : ''}</button><button class="btn o sm ${cp.hens.length < cap && S.coins >= SPECIES.chick.cost ? '' : 'dis'}" data-a="fcoopbuy">${t('coopBuyChick')} \u{1F424}${fmt(SPECIES.chick.cost)}</button>${nx ? `<button class="btn o sm ${S.coins < nx.cost ? 'dis' : ''}" data-a="fcoopup">${t('coopUpBtn')} 🪙${fmt(nx.cost)}</button>` : ''}</div></div>`;
}
// v1.10: the farm storage crate: harvest + goods stock (the café fridge shows the same stock once the café exists), sell from here too
PANELS.farmbox = () => {
  const hh = FARM.ensure(S), rows = CROPS.filter(cr => (hh.produce[cr.id] || 0) > 0), eggs = hh.produce.egg || 0;
  let b = `<div class="m">${t(S.cafe && S.cafe.built ? 'farmBoxDescCafe' : 'farmBoxDesc')}</div>`;
  b += rows.length || eggs ? rows.map(cr => `<div class="li"><div class="ic">${cr.icon}</div><div class="grow"><div class="t">${t('crop_' + cr.id)} ×${hh.produce[cr.id]}</div><div class="m">🪙${cr.sellPrice}/${t('seedUnit')}</div></div><button class="btn o sm" data-a="fsell" data-v="${cr.id}" data-w="1">${t('sellBtn')}</button><button class="btn g sm" data-a="fsell" data-v="${cr.id}" data-w="${hh.produce[cr.id]}">${t('sellAllBtn')}</button></div>`).join('') + (eggs ? `<div class="li"><div class="ic">🥚</div><div class="grow"><div class="t">×${eggs}</div></div></div>` : '') + Object.entries(RANCH_GOODS).filter(([k]) => (hh.produce[k] || 0) > 0).map(([k, g]) => `<div class="li"><div class="ic">${g.icon}</div><div class="grow"><div class="t">${t('rg_' + k)} ×${hh.produce[k]}</div></div><button class="btn g sm" data-a="rsell" data-v="${k}" data-w="${hh.produce[k]}">${t('sellAllBtn')}</button></div>`).join('') : `<div class="m">${t('noProduce')}</div>`;
  return frameHTML('📦 ' + t('farmBox'), b);
};
PANELS.farm = () => {
  const fm = FARM.ensure(S), nx = FARM_SIZES.find(z => z.n > fm.n), ready = fm.plots.filter(p => p.ready).length;
  let b = `<div class="m">${t('farmPanelDesc')}</div><div class="card"><div class="t">🌾 ${t('farmTitle')} ${fm.n}×${fm.n}${nx ? ' → ' + nx.n + '×' + nx.n : ''}</div><div class="m">${t('farmPlotsInfo', { n: fm.plots.length, r: ready })}</div>${nx ? `<button class="btn o block ${S.coins < nx.cost ? 'dis' : ''}" data-a="farmup" style="margin-top:6px">${t('farmBuyLand')} 🪙${fmt(nx.cost)}</button>` : `<div class="m">${t('farmMaxLand')}</div>`}</div>`;
  { const pr = CROPS.filter(c => (fm.produce[c.id] || 0) > 0), sd = CROPS.filter(c => (fm.seeds[c.id] || 0) > 0);
    b += `<div class="card"><div class="t">📦 ${t('farmStockTitle')}</div><div class="m">${pr.length ? pr.map(c => c.icon + '×' + fm.produce[c.id]).join('  ') : t('noProduce')}</div><div class="m">🌱 ${sd.length ? sd.map(c => c.icon + '×' + fm.seeds[c.id]).join('  ') : '-'}</div></div>`; }
  b += coopCardHTML(fm);
  b += `<div class="card"><div class="t">🌱 ${t('farmAutoTitle')}</div><div class="m">${t('farmAutoDesc')}</div><div class="row" style="flex-wrap:wrap;gap:6px;margin-top:6px"><button class="btn ${fm.autoCrop ? 'o' : ''} sm" data-a="farmauto" data-v="">${t('farmAutoBest')}</button>${CROPS.filter(c => c.ulv <= S.level).map(c => `<button class="btn ${fm.autoCrop === c.id ? '' : 'o'} sm" data-a="farmauto" data-v="${c.id}">${c.icon}</button>`).join('')}</div></div>`;
  b += `<button class="btn g block" data-a="stafftab" data-v="farm">🧑‍🌾 ${t('hospStaffTab')} (${fm.staff.length})</button>`;
  return frameHTML('🌾 ' + t('farmTitle'), b);
};
PANELS.farmstaff = () => {
  const fm = FARM.ensure(S);
  let b = staffCatTabs('farm') + `<div class="m">${t('farmStaffDesc')}</div>`;
  b += FARM_STAFF.map(r => {
    const mine = fm.staff.filter(m => m.role === r.id), n = mine.length, cost = farmStaffHire(r, n);
    return `<div class="card"><div class="t">${r.icon} ${t('fstf_' + r.id)} <span class="m">· ${t('fstf_' + r.id + '_d')}</span></div>` + mine.map(m => {
      const up = m.lv < FARM_STAFF_LV_MAX ? farmStaffUp(r, m.lv) : 0;
      return `<div class="li"><div class="ic">${r.icon}</div><div class="grow"><div class="t">${esc(m.name || '')} · Lv${m.lv}</div><div class="m">⏱ ${FARM_STAFF_DUR[m.lv]}s · 💰 ${t('hospWage', { c: fmt(farmStaffWage(r, m.lv)) })} · ✅ ${m.done | 0}</div>${m.why ? `<div class="m">💤 ${t('fwhy_' + m.why)}</div>` : ''}</div>${m.lv < FARM_STAFF_LV_MAX ? `<button class="btn o sm ${S.coins < up ? 'dis' : ''}" data-a="farmstaffup" data-v="${m.id}">⬆ 🪙${fmt(up)}</button>` : '👑'}<button class="btn r sm" data-a="farmfire" data-v="${m.id}">✕</button></div>`;
    }).join('') + (n < FARM_STAFF_MAX ? `<button class="btn o block ${S.coins < cost ? 'dis' : ''}" data-a="farmhire" data-v="${r.id}">${t('hospHireBtn')} 🪙${fmt(cost)} · ${t('hospWage', { c: fmt(farmStaffWage(r, 1)) })}</button>` : `<div class="m">${t('farmStaffFull', { n: FARM_STAFF_MAX })}</div>`) + '</div>';
  }).join('');
  return frameHTML('🌾 ' + t('farmTitle'), b);
};
// hospital furniture labels live under hsf_ (v9.71: they used to share hf_ with HOME furniture, so the home sofa read '긴 의자 (3인)')
const hospFurnName = k => { const L = I18N[(S && S.lang) || CFG.lang || 'ko'] || I18N.ko; return L['hsf_' + k] ? t('hsf_' + k) : t('hf_' + k); };
PANELS.hospstaff = () => frameHTML('🏥 ' + t('hospName'), staffCatTabs('hosp') + hospStaffTab(HOSP.ensure(S)));
PANELS.staff = () => {
  let h = staffCatTabs('shop') + `<div class="m">${t('staffDesc')}</div>`;
  let total = 0;
  const dur = lv => STAFF_DUR[lv], per = lv => Math.round(60 / dur(lv));
  STAFF_ROLES.forEach(r => {
    const lock = r.ulv > S.level, keys = Object.keys(S.staff || {}).filter(k => staffRoleOf(k) === r.id), cnt = keys.length;
    h += `<div class="card staffc"><div class="row"><div class="ic2"><span>${r.icon}</span></div><div class="grow"><div class="t">${r.icon} ${t('role_' + r.id)} <span class="m">· 👥 ${cnt}/${STAFF_PER_ROLE}</span></div><div class="m">${t('roleD_' + r.id)}</div>${lock ? `<div class="m">🔒 ${t('unlockAt', { n: r.ulv })}</div>` : ''}${r.id === 'online' && !S.items.some(i => PC_ITEMS.includes(i.k)) ? `<div class="m" style="color:#c0503e">🖥️ ${t('needPC')}</div>` : ''}</div></div>`;
    keys.forEach(key => {
      const m = S.staff[key]; total += staffWage(r, m.lv);
      h += `<div class="staffm"><div class="row"><div class="ic2 sm"><img src="${PIC.head(applyStaffArt(Object.assign(ART.randomHuman(m.seed), { top: 'tee', shirt: '#fff', apron: r.col, hat: 'cap', hatc: r.col, kid: false, old: false }), m.seed, r.id === 'sales'), 'calm')}"></div>
        <div class="grow"><div class="t">${esc(m.name)} <span class="m">Lv${m.lv}</span></div>
        <div class="dots">${Array.from({ length: STAFF_MAX }, (_, i) => i + 1).map(k => `<i class="${k <= m.lv ? 'on' : ''}${k > 5 ? ' gold' : ''}"></i>`).join('')}</div>
        <div class="m">⚡ ${t('staffSpeed', { n: per(m.lv) })} · 💼 ${t('staffWage', { c: staffWage(r, m.lv) })} · ✅ ${t('staffDone', { n: m.done || 0 })}${m.job ? ' · 🔄 ' + t('stj_' + m.job.k) : ''}</div></div></div>
        <div class="row" style="margin-top:4px">${m.lv < STAFF_MAX ? `<button class="btn o sm grow ${S.coins < staffUpCost(r, m.lv + 1) ? 'dis' : ''}" data-a="staffup" data-v="${key}">⬆ Lv${m.lv + 1} 🪙${fmt(staffUpCost(r, m.lv + 1))}</button>` : `<span class="m grow">🏅 MAX</span>`}<button class="btn g sm" data-a="fire" data-v="${key}">${t('fireBtn')}</button></div></div>`;
    });
    if (lock) h += `<div class="m">🔒 ${t('unlockAt', { n: r.ulv })}</div>`; else if (r.needItem && !S.items.some(i => i.k === r.needItem)) h += `<div class="m" style="color:#c0533f">✂️ ${t('needGroomTable')}</div>`;
    if (!lock && cnt < STAFF_PER_ROLE) { const c = staffHireCost(r, cnt); h += `<button class="btn block ${S.coins < c ? 'dis' : ''}" data-a="hire" data-v="${r.id}" style="margin-top:6px">🤝 ${t(cnt ? 'hireMore' : 'hireBtn')} 🪙${fmt(c)} <small>(💼 ${t('staffWage', { c: staffWage(r, 1) })})</small></button>`; }
    h += `</div>`;
  });
  h += `<div class="card"><div class="t">💼 ${t('wageTotal', { c: fmt(total) })}</div><div class="m">${t('wageWhen')}</div></div>`;
  return frameHTML('👥 ' + t('staffTitle'), h);
};
PANELS.hab = m => {
  const it = G.habItem(S, m.slot); if (!it) return '';
  const sl = G.slotsOfItem(it), lv = S.houses[it.slot] || 1, occ = sl.map(i => S.pets[i]).filter(Boolean), cap = sl.length;
  const nest = (S.breeding || []).find(b => (b.slots || []).some(i => sl.includes(i)));
  const pair = occ.some(a => a.sex === 'm' && a.grow >= 1 && occ.some(b => b.sex === 'f' && b.sp === a.sp && b.grow >= 1));
  return frameHTML('🏠 ' + t('houseInfo'), `<div class="card"><div class="t">${HAB_ICON[it.kind]} ${it.model ? t('hm_' + it.model) : t('hk_' + it.kind)} · Lv.${lv}</div>
    <div class="m"><span class="capb s${HOUSE_SIZE(cap)}">${t('size' + HOUSE_SIZE(cap))} · 🐾 ${occ.length} / ${cap}</span></div>
    <div class="dots">${[1, 2, 3, 4, 5].map(k => `<i class="${k <= lv ? 'on' : ''}"></i>`).join('')}</div>
    <div class="m">${t('houseEff', { d: Math.round((1 - G.houseDecay(lv)) * 100), g: Math.round((G.houseGrow(lv) - 1) * 100), p: Math.round((G.housePrice(lv) - 1) * 100) })}</div>
    ${lv < G.HOUSE_MAX ? `<button class="btn o sm ${S.coins < G.houseCost(lv) ? 'dis' : ''}" data-a="house" data-v="${it.slot}" style="margin-top:6px">⬆ ${t('upgradeHouse')} 🪙${fmt(G.houseCost(lv))}</button>` : ''}</div>
    <div class="t">🐾 ${t('residents')}</div>
    ${sl.map(i => { const p = S.pets[i]; return p ? `<button class="li" data-a="pet" data-v="${p.id}"><div class="ic"><img src="${PIC.my(p)}"></div><div class="grow"><div class="t">${esc(p.name)} <span class="sex ${p.sex}">${p.sex === 'm' ? '♂' : '♀'}</span></div><div class="m">${esc(spName(p.sp))} · ${t(p.grow < 1 ? 'stage0' : G.ageOf(p) < .75 ? 'stage1' : 'stage2')}</div></div>›</button>` : `<div class="li empty"><div class="ic">＋</div><div class="grow m">${t('emptySpot')}</div></div>`; }).join('')}
    ${cap >= 2 ? `<div class="card"><div class="m">${nest ? '💞 ' + t('nestNow', { t: fmtT(nest.left) }) : pair ? '💕 ' + t('pairIn') : '💡 ' + t('pairHint')}</div></div>` : ''}
    ${occ.length ? '' : `<div class="t">${t('houseKind')}</div><div class="grid3">${HAB_KINDS.map(k => `<button class="tile ${it.kind === k ? 'sel' : ''}" data-a="habkind" data-v="${it.slot}" data-w="${k}"><div style="font-size:24px">${HAB_ICON[k]}</div><div class="m">${t('hk_' + k)}</div></button>`).join('')}</div><div class="m">${t('changeKind')}</div>`}
    ${occ.length < cap ? `<button class="btn o block" data-a="open" data-v="market">🐶 ${t('adoptTitle')}</button>` : ''}`);
};
PANELS.slotkind = () => frameHTML('🏠 ' + t('chooseHouse'), `<div class="m">${t('slotDesc')} · 🪙${fmt(slotCost(S.slots))}</div><div class="grid2">` +
  HAB_KINDS.map(k => `<button class="tile" data-a="slotkind" data-v="${k}"><div style="font-size:30px">${HAB_ICON[k]}</div><div class="t">${t('hk_' + k)}</div></button>`).join('') + '</div>');
function runMini(v, w, lv) { const pp = S.pets.find(x => x && x.id === v); if (!pp) return; const pa = World.petActor(v); if (pa) World.walkNear(Math.floor(pa.x), Math.floor(pa.y)); closePanel(); MINI.start(w, pp.sp, sc => { act({ t: 'care', pid: v, kind: w, score: sc, lv }); openPanel({ type: 'pet', pid: v }); }, pp.coat || ART.hashStr(pp.id), lv); return; }
PANELS.playpick = m => { const b = (typeof XS === 'function' ? XS().best : (S.x || {}).best) || {}; const st = k => { const v = b[k] || 0; return v ? ' · ' + (v >= .8 ? '⭐⭐⭐' : v >= .5 ? '⭐⭐' : '⭐') : ''; }; return frameHTML('🎾 ' + t('playMenu'), `<div class="m">${t('playMenuDesc')}</div>` + [['toy', '🪶', 'miniToy', 'pg_toyD', 'mini'], ['catch', '🍖', 'pg_catch', 'pg_catchD', 'playgo'], ['bubble', '🫧', 'pg_bubble', 'pg_bubbleD', 'playgo'], ['fetch', '🎾', 'pg_fetch', 'pg_fetchD', 'playgo']].map(([k, ic, nm, d, act2]) => `<button class="li" data-a="${act2}" data-v="${m.pid}" data-w="${k}"><div class="ic">${ic}</div><div class="grow"><div class="t">${t(nm)}${k === 'toy' ? '' : st(k)}</div><div class="m">${t(d)}</div></div>▶</button>`).join('')); };
PANELS.toylv = m => frameHTML('🪶 ' + t('miniToy'), `<div class="m">${t('toyPick')}</div>` + [0, 1, 2].map(k => `<button class="li" data-a="toygo" data-v="${m.pid}" data-w="${k}"><div class="ic">${['🙂', '😆', '🔥'][k]}</div><div class="grow"><div class="t">${t('toyLv' + k)}</div><div class="m">${t('toyLvD' + k)}</div></div></button>`).join(''));
function checkoutCust(cid) {
  World.goCounter(() => act({ t: 'checkout', cid }));
}
// the shop tab's "buildings" section: expand the café / raise the hospital's floors from the same place as the shop's own expansion
function buildingRows() {
  let h = `<div class="t" style="margin-top:10px">🏘️ ${t('buildingsTitle')}</div>`;
  const cf = CAFE.ensure(S), hp = HOSP.ensure(S), fm = FARM.ensure(S), fnx = FARM_SIZES.find(z => z.n > fm.n);
  h += `<div class="li"><div class="ic">🌾</div><div class="grow"><div class="t">${t('farmTitle')} ${fm.n}×${fm.n}${fnx ? ' → ' + fnx.n + '×' + fnx.n : ''}</div><div class="m">${fnx ? (S.level < fnx.ulv ? '🔒 ' + t('unlockAt', { n: fnx.ulv }) : t('farmUpDesc')) : t('maxSize')}</div></div>${fnx && S.level >= fnx.ulv ? `<button class="btn o sm ${S.coins < fnx.cost ? 'dis' : ''}" data-a="farmup">🪙 ${fmt(fnx.cost)}</button>` : ''}</div>`;
  if (!cf.built) {
    const ok = repTier(S.rep || 0) >= CAFE_UNLOCK_TIER;
    h += `<div class="li"><div class="ic">☕</div><div class="grow"><div class="t">${t('cafeName')}</div><div class="m">${ok ? t('bldNotBuilt') : '🔒 ' + t('cafeNeedRep')}</div></div>${ok ? `<button class="btn o sm ${S.coins < CAFE_BUILD_COST ? 'dis' : ''}" data-a="buildcafe">🪙 ${fmt(CAFE_BUILD_COST)}</button>` : ''}</div>`;
  } else {
    const L = CAFE_LV[cf.lv], nx = CAFE_LV[cf.lv + 1];
    h += `<div class="li"><div class="ic">☕</div><div class="grow"><div class="t">${t('cafeName')} Lv${cf.lv} · ${L.w}×${L.d}${nx ? ' → ' + nx.w + '×' + nx.d : ''}</div><div class="m">${nx ? (S.level < nx.ulv ? '🔒 ' + t('unlockAt', { n: nx.ulv }) : t('cafeUpNext')) : t('maxSize')}</div></div>${nx && S.level >= nx.ulv ? `<button class="btn o sm ${S.coins < nx.cost ? 'dis' : ''}" data-a="cafeup">🪙 ${fmt(nx.cost)}</button>` : ''}</div>`;
  }
  if (!hp.built) {
    const ok = repTier(S.rep || 0) >= HOSP_UNLOCK_TIER;
    h += `<div class="li"><div class="ic">🏥</div><div class="grow"><div class="t">${t('hospName')}</div><div class="m">${ok ? t('bldNotBuilt') : '🔒 ' + t('hospNeedRep')}</div></div>${ok ? `<button class="btn o sm ${S.coins < HOSP_BUILD_COST ? 'dis' : ''}" data-a="buildhosp">🪙 ${fmt(HOSP_BUILD_COST)}</button>` : ''}</div>`;
  } else {
    const nx = HOSP_LV[hp.lv + 1], dm = hospDims(hp.lv);
    h += `<div class="li"><div class="ic">🏥</div><div class="grow"><div class="t">${t('hospName')} Lv${hp.lv} · ${dm.w}×${dm.d}${nx ? ' → ' + hospDims(hp.lv + 1).w + '×' + hospDims(hp.lv + 1).d : ''}</div><div class="m">${nx ? (S.level < nx.ulv ? '🔒 ' + t('unlockAt', { n: nx.ulv }) : t('hospRaiseDesc')) : t('maxSize')}</div></div>${nx && S.level >= nx.ulv ? `<button class="btn o sm ${S.coins < nx.cost ? 'dis' : ''}" data-a="hospup">🪙 ${fmt(nx.cost)}</button>` : ''}</div>`;
  }
  return h;
}
PANELS.shop = m => {
  const tabs = [['food', '🥣 ' + t('tabFood')], ['decor', '🛋️ ' + t('decorSec')], ['house', '🏠 ' + t('tabHouse')], ['room', '📐 ' + t('roomSec')], ['cafe', '☕ ' + t('cafeName')], ['hosp', '🏥 ' + t('hospName')], ['equip', '⚙️ ' + t('upSec')]];
  const tab = m.tab && tabs.some(x => x[0] === m.tab) ? m.tab : tabs[0][0];
  m.tab = tab;
  const cost = c => c + deliveryFee(c);
  let h = `<div class="tabs">${tabs.map(([k, l]) => `<button class="${tab === k ? 'on' : ''}" data-a="stab" data-v="${k}">${l}</button>`).join('')}</div>`;
  if (['food', 'decor', 'house'].includes(tab)) h += `<div class="card deliv">🛵 ${t('deliveryNote', { p: Math.round(DELIVERY.rate * 100), t: DELIVERY.secs })}</div>`;
  if (tab === 'food') {
    const used = new Set(S.pets.filter(Boolean).map(p => dietOf(p.sp)));
    const lines = Object.keys(FEED_LINES).sort((x, y) => (used.has(y) ? 1 : 0) - (used.has(x) ? 1 : 0));
    lines.forEach(l => {
      const L = FEED_LINES[l];
      h += `<div class="li"><div class="ic">${L.icon}</div><div class="grow"><div class="t">${L10(L)} ${used.has(l) ? '<span class="kidtag">' + t('ourKids') + '</span>' : ''}</div>
        <div class="tiers">${FEED_TIERS.map((T, k) => { const lock = T.lv > S.level, c = cost(feedPrice(l, k)); return `<button class="btn sm ${k === 2 ? 'o' : ''} ${lock || S.coins < c ? 'dis' : ''}" data-a="buyfood" data-v="${l}" data-w="${k}">${T.icon} ${L10(T)}<br>${lock ? '🔒Lv' + T.lv : `🪙${c}`} <small>×${S.feed[l + ':' + k] || 0}</small></button>`; }).join('')}</div></div></div>`;
    });
    h += `<div class="m">${t('feedTiersInfo')}</div>`;
    h += `<div class="li"><div class="ic">🧴</div><div class="grow"><div class="t">${t('kit')}</div><div class="m">${t('kitDesc')} · ${t('have', { n: S.kits })}</div></div><button class="btn o sm ${S.coins < cost(150) ? 'dis' : ''}" data-a="kit">🪙 ${cost(150)}</button></div>`;
  } else if (tab === 'decor') h += decorList();
  else if (tab === 'house') {
    const hc = m.hcat || 'dog';
    h += `<div class="catbar">${HOUSE_TABS.map(([k, ic]) => `<button class="${hc === k ? 'on' : ''}" data-a="hcat" data-v="${k}"><span>${ic}</span>${t('hc_' + k)}</button>`).join('')}</div>`;
    const pend = (S.parcels || []).filter(x => x.what === 'house').length, nh = S.items.filter(i => i.k === 'hab').length + pend;
    h += `<div class="m">${t('houseShopDesc', { n: nh, max: MAX_HOUSES })}</div><div class="m">${t('capInfo')}</div>`;
    HOUSE_MODELS.filter(x => x.cat === hc).forEach(md => {
      const lock = md.ulv > S.level, c = cost(houseModelCost(md, nh));
      h += `<div class="li"><div class="ic big"><img src="${PIC.hab(md.kind, md.lv, md.id)}"></div><div class="grow"><div class="t">${md.icon} ${t('hm_' + md.id)}</div><div class="m"><span class="capb s${HOUSE_SIZE(md.cap || 1)}">${t('size' + HOUSE_SIZE(md.cap || 1))} · 🐾×${md.cap || 1}</span> ${'★'.repeat(md.lv)}${lock ? ' · 🔒 ' + t('unlockAt', { n: md.ulv }) : ''}</div><div class="m">${(md.cap || 1) >= 2 ? '💞 ' + t('capPair') : t('capSolo')}</div></div>${lock ? '' : `<button class="btn o sm ${S.coins < c ? 'dis' : ''}" data-a="buyhouse" data-v="${md.id}">🪙 ${fmt(c)}</button>`}</div>`;
    });
  } else if (tab === 'room') {
    const nx = ROOM_SIZES.find(r => r.w > S.room.w);
    h += `<div class="li"><div class="ic">📐</div><div class="grow"><div class="t">${t('expandShop')} ${S.room.w}×${S.room.h}${nx ? ' → ' + nx.w + '×' + nx.w : ''}</div><div class="m">${nx ? (nx.lv > S.level ? '🔒 ' + t('unlockAt', { n: nx.lv }) : t('expandDesc')) : t('maxSize')}</div></div>
      ${nx && nx.lv <= S.level ? `<button class="btn o sm ${S.coins < nx.cost ? 'dis' : ''}" data-a="expand">🪙 ${fmt(nx.cost)}</button>` : ''}</div>`;
    h += buildingRows();
    h += `<div class="li"><div class="ic">🏠</div><div class="grow"><div class="t">${t('tabHouse')} (${S.items.filter(i => i.k === 'hab').length})</div><div class="m">${t('houseMoved')}</div></div><button class="btn g sm" data-a="stab" data-v="house">➡</button></div>`;
    for (const type of ['floor', 'wall']) {
      h += `<div class="t" style="margin-top:10px">${t(type === 'floor' ? 'floorSec' : 'wallSec')}</div><div class="grid3">`;
      STYLES.filter(x => x.type === type).forEach(st => {
        const own = !st.cost || S.styles[type + ':' + st.id], on = S.room[type] === st.id;
        const col = type === 'floor' ? FURN.FLOORS[st.id][0] : FURN.WALLS[st.id][0], col2 = type === 'floor' ? FURN.FLOORS[st.id][1] : FURN.WALLS[st.id][1];
        h += `<button class="tile ${on ? 'sel' : ''}" data-a="style" data-v="${st.id}" data-w="${type}"><div style="width:54px;height:40px;border-radius:8px;background:repeating-linear-gradient(45deg,${col} 0 8px,${col2} 8px 16px);border:2px solid #cfae7c"></div>
          <div class="m">${t('st_' + type + '_' + st.id)}</div><div class="m">${on ? '✓' : own ? t('owned') : '🪙 ' + st.cost}</div></button>`;
      });
      h += '</div>';
    }
  } else if (tab === 'cafe') h += cafeShopList();
  else if (tab === 'hosp') h += hospShopList();
  else {
    UPGRADES.forEach(u => { const own = S.up[u.id], lock = u.lv > S.level; h += `<div class="li"><div class="ic">${u.icon}</div><div class="grow"><div class="t">${t('u_' + u.id)}</div><div class="m">${t('u_' + u.id + '_d')}${lock ? ' · 🔒 ' + t('unlockAt', { n: u.lv }) : ''}</div></div>${own ? '✓' : lock ? '' : `<button class="btn o sm ${S.coins < u.cost ? 'dis' : ''}" data-a="up" data-v="${u.id}">🪙 ${fmt(u.cost)}</button>`}</div>`; });
  }
  if ((S.parcels || []).length) h += `<div class="card"><div class="t">📦 ${t('parcelsOnWay')}</div>${S.parcels.map(pc => `<div class="m">${parcelName(pc)} · ${pc.st === 'arrived' ? '✅ ' + t('atDrop') : '⏱ ' + Math.ceil(pc.left) + 's'}</div>`).join('')}</div>`;
  return frameHTML('🛵 ' + t('shopTitle2'), h);
};
// PET TOWN: what is being placed (shown in the edit bar and the toast, so you know where it should go)
function itemLabel(it) {
  if (!it) return '';
  const L = I18N[CFG.lang] || I18N.ko, has = k => L[k] != null;
  if (it.k === 'hab') { const m = typeof HOUSE_MODELS !== 'undefined' && HOUSE_MODELS.find(x => x.id === it.mid); return (m && m.icon || '🏠') + ' ' + (it.mid && has('hm_' + it.mid) ? t('hm_' + it.mid) : t('hk_' + it.kind)); }
  const d = typeof DECOR !== 'undefined' && DECOR.find(x => x.id === it.k);
  for (const k of ['d_' + it.k, 'it_' + it.k, 'f_' + it.k, it.k]) if (has(k)) return (d && d.icon ? d.icon + ' ' : '') + t(k);
  return (d && d.icon) || '📦';
}
const selLabel = () => { const id = World.editSel; if (typeof id !== 'number') return ''; const it = S.items.find(i => i.id === id); return it ? `<b class="selname">${esc(itemLabel(it))}</b> · ` : ''; };
function parcelName(pc) {
  if (pc.what === 'food') { const [l, k] = pc.key.split(':'); return FEED_LINES[l].icon + ' ' + L10(FEED_LINES[l]) + ' (' + L10(FEED_TIERS[+k]) + ') ×' + pc.n; }
  if (pc.what === 'kit') return '🧴 ' + t('kit');
  if (pc.what === 'house') return '🏠 ' + t('hm_' + pc.mid);
  if (pc.what === 'decor') return '🛋️ ' + t('d_' + pc.did);
  return '📦';
}
function decorList() {
  const dc = (panel && panel.dcat) || 'all';
  return `<div class="m">${t('decorDesc')} · ${t('decorPts', { n: G.decorPts(S) })}</div><div class="tabs">${['all', 'furn', 'light', 'deco', 'pet'].map(k => `<button class="${dc === k ? 'on' : ''}" data-a="dcat" data-v="${k}">${{ all: '✨', furn: '🛋️', light: '💡', deco: '🌷', pet: '🐾' }[k]} ${t('dc_' + k)}</button>`).join('')}</div>` + DECOR.filter(d => !d.homeOnly && (dc === 'all' || d.cat === dc) && (!d.season || d.season === seasonOf() || S.decor[d.id])).map(d => {
    const own = S.decor[d.id], lock = d.lv > S.level, cost = d.cost + deliveryFee(d.cost);
    const th = typeof homeThumb === 'function' && FURN.DEF[d.id] && !FURN.DEF[d.id].pen ? homeThumb(d.id) : '', n = +own || 0;
    const pi = typeof PEN_INFO !== 'undefined' && PEN_INFO[d.id];
    const pinfo = pi ? ` · 🐾${t('penInfoCap', { n: pi.cap })} · ${t('penInfoRec', { m: pi.boredMul || pi.rate || 1 })}${(pi.tipBonus || pi.tipMul || 1) > 1 ? ` · ${t('penInfoTip', { p: Math.round(((pi.tipBonus || pi.tipMul || 1) - 1) * 100) })}` : ''}` : '';
    return `<div class="li"><div class="ic">${th ? `<img src="${th}" style="width:46px;height:46px;object-fit:contain">` : d.icon}</div><div class="grow"><div class="t">${t('d_' + d.id)}${n ? ` <span class="m">· ${t('ownedN', { n })}</span>` : ''}</div><div class="m">+${n ? Math.max(1, Math.floor(d.pts / 2)) : d.pts} ⭐${pinfo}${FURN.LIGHT[d.id] ? ' · 💡 ' + t('lightTag') : ''}${lock ? ' · 🔒 ' + t('unlockAt', { n: d.lv }) : ''}</div></div>${lock ? '' : `<button class="btn o sm ${S.coins < cost ? 'dis' : ''}" data-a="decor" data-v="${d.id}">${n ? '➕ ' : ''}🪙 ${fmt(cost)}</button>`}</div>`;
  }).join('') + `<div class="m" style="margin-top:8px">🏠 ${t('homeOnlyNote')}</div>`;
}
PANELS.repinfo = () => { const r = S.rep || 0, tr = repTier(r); return frameHTML('⭐ ' + t('reputation'), `<div class="card center"><div class="stars" style="font-size:28px">${starStr(r)}</div><div class="t">${REP_TIERS[tr].ic} ${t('rt_' + tr)} · ${Math.round(r)} / ${REP_MAX}</div>${tr < 5 ? bar((r - tr * 100), REP_TIERS[tr + 1].col, Math.round(r - tr * 100) + ' / 100') : ''}</div>
  <div class="m">${t('repDesc')}</div><div class="card">${REP_TIERS.map((T, i) => `<div class="row" style="padding:3px 0;${i === tr ? 'font-weight:900' : 'opacity:' + (i < tr ? .7 : .45)}"><span style="width:26px">${T.ic || '⭐'}</span><span class="grow">${t('rt_' + i)}</span><span class="m">${i * 100}+ · ${i ? t('repPerk', { p: i * 4 }) : ''}</span></div>`).join('')}</div><div class="m">${t('repTierDesc')}</div>`); };
const CAFE_ICON = { table: '🍽️', slot: '🎰', sofa: '🛋️', bookshelf: '📚', plant: '🪴', lamp: '💡', fountain: '⛲', towertree: '🐈', aquarium: '🐠', jukebox: '🎵', arcade: '🧸', photobooth: '📸', counter: '🧾', espresso: '☕', shelf: '🗄️', ballpit: '🔴', slide: '🛝', tunnel: '🚇', cattree: '🐱', seesaw: '⚖️', hoop: '⭕', scratch: '🪵', bowls: '🥣' };
function cafeShopList() {
  const cf = CAFE.ensure(S);
  if (!cf.built) return `<div class="m">${t('cafeShopLocked')}</div>`;
  const cc = (panel && panel.ccat) || 'all', cats = ['all', 'seat', 'play', 'deco', 'kit', 'pen'];
  return `<div class="m">${t('cafeShopDesc')}</div><div class="tabs">${cats.map(k => `<button class="${cc === k ? 'on' : ''}" data-a="ccat" data-v="${k}">${t('cc_' + k)}</button>`).join('')}</div>`
    + CAFE_FURN.filter(f => !f.fixed && (cc === 'all' || f.cat === cc || (cc === 'play' && f.k === 'arcade'))).map(f => {
      const lock = cf.lv > 0 && f.clv > cf.lv, n = (cf.items || []).filter(i => i.k === f.k).length;
      return `<div class="li"><div class="ic" style="font-size:30px">${CAFE_ICON[f.k] || '🪑'}</div><div class="grow"><div class="t">${t('cf_' + f.k)}${n ? ` <span class="m">· ${t('ownedN', { n })}</span>` : ''}</div><div class="m">${f.w}×${f.d}${f.cat === 'pen' ? ' · ' + t('cafePenOnly') : ''}${lock ? ' · 🔒 ' + t('cafeNeedLv', { n: f.clv }) : ''}</div></div>${lock ? '' : `<button class="btn o sm ${S.coins < f.cost ? 'dis' : ''}" data-a="cafebuy" data-v="${f.k}">🪙 ${fmt(f.cost)}</button>`}</div>`;
    }).join('');
}
const HOSP_ICON = { reception: '🛎️', cabinet: '🗄️', sink: '🚰', monitor: '🖥️', desk: '🧑‍⚕️', exam: '🩺', tbed: '🛏️', xray: '🩻', ct: '🧲', surgery: '🏥', bed: '🛏️', incubator: '🌡️', medbath: '🛁', bench: '🪑', pharmacy: '💊', scale: '⚖️', iv: '💧', sofa: '🛋️', plant: '🪴', lamp: '💡', aquarium: '🐠', fountain: '⛲', vending: '🥤' };
// the shop's hospital tab: what can be installed at the current hospital level (and how many), everything is bought by the player
function hospShopList() {
  const hp = HOSP.ensure(S);
  if (!hp.built) return `<div class="m">${t('hospShopLocked')}</div>`;
  const hc = (panel && panel.hcat) || 'all', cats = ['all', 'stn', 'deco'], lv = hp.lv;
  const count = k => (hp.items || []).filter(i => i.k === k && !(hp.kitIds || []).includes(i.id)).length;
  return `<div class="m">${t('hospShopDesc')}</div><div class="tabs">${cats.map(k => `<button class="${hc === k ? 'on' : ''}" data-a="hcatp" data-v="${k}">${t('hc2_' + k)}</button>`).join('')}</div>`
    + HOSP_FURN.filter(f => !f.fixed && (hc === 'all' || f.cat === hc)).map(f => {
      const capped = HOSP_CAPPED.includes(f.k), cap = hospCap(lv, f.k) || 0, n = count(f.k), tx = HOSP_TX.filter(x => x.stn === f.k).map(x => x.icon).join('');
      const needLv = capped && !cap ? HOSP_LV.findIndex((z, i) => i && z.cap && z.cap[f.k] > 0) : 0, full = capped && cap && n >= cap;
      return `<div class="li"><div class="ic" style="font-size:30px">${HOSP_ICON[f.k] || '🏥'}</div><div class="grow"><div class="t">${hospFurnName(f.k)}${capped && cap ? ` <span class="m">· ${n}/${cap}</span>` : n ? ` <span class="m">· ${t('ownedN', { n })}</span>` : ''}</div><div class="m">${f.w}×${f.d} · 🏠 ${f.dps.filter(d => d !== 'lobby' || f.dps.length === 1 || true).map(d => t('hroom_' + d)).slice(0, 3).join('/')}${tx ? ' · ' + tx : ''}${needLv ? ' · 🔒 ' + t('hospNeedLv', { n: needLv }) : full ? ' · ' + t('hospCapFull', { n: cap }) : ''}</div></div>${needLv || full ? '' : `<button class="btn o sm ${S.coins < f.cost ? 'dis' : ''}" data-a="hospbuy" data-v="${f.k}">🪙 ${fmt(f.cost)}</button>`}</div>`;
    }).join('');
}
PANELS.hospshop = () => frameHTML('🛋️ ' + t('hospShopBtn'), `<div class="row" style="gap:8px;margin-bottom:6px"><button class="btn o sm" data-a="cafepanel" data-v="hosp">◀ ${t('hospName')}</button><button class="btn g sm" data-a="hospedit">🔨 ${t('hospEditBtn')}</button></div>` + hospShopList());
// what the patient is doing right now, in words
function hospPhaseText(p) {
  const st = hospStage(p), tx = hospTx(st);
  switch (p.ph) {
    case 'walkin': return '🚶 ' + t('hph_walkin');
    case 'deskwait': return '🛎️ ' + t(st === 'pay' ? 'hph_paywait' : 'hph_regwait');
    case 'deskserve': return '💬 ' + t(st === 'pay' ? 'hph_paying' : 'hph_registering');
    case 'toDesk': return '🚶 ' + t('hph_todesk');
    case 'bench': return '🪑 ' + t('hph_bench') + ' · ' + tx.icon + ' ' + t('tx_' + st);
    case 'toStn': return '🚶 ' + tx.icon + ' ' + t('hph_tostn');
    case 'atStn': return '🙏 ' + tx.icon + ' ' + t('hph_atstn');
    case 'treat': return tx.icon + ' ' + t('tx_' + st) + '…';
    case 'leaving': return '💗 ' + t('hph_leaving');
  }
  return '';
}
const hospReady = p => p.ph === 'deskwait' || p.ph === 'atStn';
const hospBtnLabel = st => t(st === 'reg' ? 'hospRegBtn' : st === 'pay' ? 'hospPayBtn' : st === 'exam' ? 'hospExamBtn' : 'hospTreatBtn');
function hospStaffTab(hp) {
  let b = `<div class="m">${t('hospStaffDesc')}</div>`;
  b += HOSP_STAFF.map(r => {
    const mine = hp.staff.filter(m => m.role === r.id), n = mine.length, cost = hospStaffHire(r, n);
    return `<div class="card"><div class="t">${r.icon} ${t('hstf_' + r.id)} <span class="m">· ${t('hstf_' + r.id + '_d')}</span></div>` + mine.map(m => {
      const up = m.lv < HOSP_STAFF_LV_MAX ? hospStaffUp(r, m.lv) : 0;
      return `<div class="li"><div class="ic">${r.icon}</div><div class="grow"><div class="t">${esc(m.name || '')} · Lv${m.lv}</div>${(() => { const sp = hospSpecOf(S.hosp, m, HOSP_LAYOUT()); return sp.k >= 0 ? `<div class="m">🏷️ ${t(HOSP_SPEC_NAME[m.role][sp.k])}</div>` : ''; })()}<div class="m">⏱ ${HOSP_STAFF_DUR[m.lv]}s · 💰 ${t('hospWage', { c: fmt(hospStaffWage(r, m.lv)) })} · ✅ ${m.done | 0}</div></div>${m.lv < HOSP_STAFF_LV_MAX ? `<button class="btn o sm ${S.coins < up ? 'dis' : ''}" data-a="hospstaffup" data-v="${m.id}">⬆ 🪙${fmt(up)}</button>` : '👑'}<button class="btn r sm" data-a="hospfire" data-v="${m.id}">✕</button></div>`;
    }).join('') + (n < HOSP_STAFF_MAX ? `<button class="btn o block ${S.coins < cost ? 'dis' : ''}" data-a="hosphire" data-v="${r.id}">${t('hospHireBtn')} 🪙${fmt(cost)} · ${t('hospWage', { c: fmt(hospStaffWage(r, 1)) })}</button>` : `<div class="m">${t('hospStaffFull')}</div>`) + '</div>';
  }).join('');
  return b;
}
function hospSkinRows(hp) {
  return `<div class="t" style="margin-top:10px">🎨 ${t('hospSkinTitle')}</div><div class="grid3">` + HOSP_SKINS.map(k => {
    const lock = k.lv > hp.lv, own = !!hp.skins[k.id], on = hp.skin === k.id;
    return `<button class="tile ${on ? 'sel' : ''} ${lock ? 'dis' : ''}" data-a="hospskin" data-v="${k.id}"><div style="font-size:26px">${['🛎️', '🏛️', '💠', '👑'][k.id]}</div><div class="m">${t('hskin_' + k.id)}</div><div class="m">${lock ? '🔒 ' + t('hospNeedLv', { n: k.lv }) : on ? '✓' : own ? t('owned') : '🪙 ' + fmt(k.cost)}</div></button>`;
  }).join('') + '</div>';
}
PANELS.hosp = m => {
  const hp = HOSP.ensure(S), nx = HOSP_LV[hp.lv + 1], tab = m.tab === 'staff' ? 'staff' : 'main', dm = hospDims(hp.lv);
  let b = `<div class="tabs"><button class="${tab === 'main' ? 'on' : ''}" data-a="hosptab" data-v="main">🏥 ${t('hospName')}</button><button class="${tab === 'staff' ? 'on' : ''}" data-a="hosptab" data-v="staff">👩‍⚕️ ${t('hospStaffTab')} (${hp.staff.length})</button></div>`;
  if (tab === 'staff') return frameHTML('🏥 ' + t('hospName'), b + hospStaffTab(hp));
  b += `<div class="m">${t('hospDesc')} · ${t('hospTreatedCount', { n: hp.treated || 0 })}</div>`;
  b += `<div class="t" style="margin-top:6px">🩺 ${t('hospPatients')}</div>`;
  b += hp.patients.filter(p => !p.full).length ? hp.patients.filter(p => !p.full).map(p => { const ail = HOSP_AIL.find(x => x.id === p.ail), st = hospStage(p); return `<div class="li"><div class="ic">${ail ? ail.icon : '🤒'}</div><div class="grow"><div class="t">${esc(spName(p.sp))} · ${t('ail_' + p.ail)}</div><div class="m">${hospPhaseText(p)}${st === 'pay' ? ' · 🪙' + fmt(Math.round(p.bill)) : ''}</div></div><button class="btn o sm ${hospReady(p) ? '' : 'dis'}" data-a="hospdo" data-v="${p.id}">${hospBtnLabel(st)}</button></div>`; }).join('') : `<div class="m">${t('hospNoPatients')}</div>`;
  b += `<div class="t" style="margin-top:10px">🏠 ${t('hospRoomsTitle')}</div><div class="m">` + hospRoomsAt(hp.lv).map(r => HOSP_ROOMS[r].icon + ' ' + t('hroom_' + r)).join(' · ') + '</div>';
  b += `<div class="t" style="margin-top:10px">🩻 ${t('hospTxList')}</div><div class="m">` + HOSP_TX.filter(x => x.stn).map(x => (hospTxAvail().some(y => y.id === x.id) ? '✅ ' : '🔒 ') + x.icon + ' ' + t('tx_' + x.id)).join(' · ') + '</div>';
  b += hospSkinRows(hp);
  b += `<div class="row" style="margin-top:10px;gap:8px"><button class="btn g block" data-a="cafepanel" data-v="hospshop">🛋️ ${t('hospShopBtn')}</button><button class="btn g block" data-a="hospedit">🔨 ${t('hospEditBtn')}</button></div>`;
  b += `<div class="t" style="margin-top:10px">⬆️ ${t('hospUp')}</div><div class="card"><div class="m">📐 ${t('hospLevelNow', { n: hp.lv, w: dm.w, d: dm.d })}</div>`;
  if (nx) { const lock = S.level < nx.ulv, d2 = hospDims(hp.lv + 1), newRooms = nx.rooms.filter(r => !hospRoomsAt(hp.lv).includes(r)).map(r => HOSP_ROOMS[r].icon + ' ' + t('hroom_' + r)).join(', '); b += `<div class="m">${t('cafeUpNext')} 📐 ${d2.w}×${d2.d}${newRooms ? ' · ➕ ' + newRooms : ''}</div>${lock ? `<div class="m">🔒 ${t('homeNeedPlayer', { n: nx.ulv })}</div>` : `<button class="btn o block ${S.coins < nx.cost ? 'dis' : ''}" data-a="hospup">⬆️ ${t('cafeUpBtn')} 🪙${fmt(nx.cost)}</button>`}`; } else b += `<div class="m">${t('cafeUpMax')}</div>`;
  return frameHTML('🏥 ' + t('hospName'), b + '</div>');
};
function hospEditBar() {
  const sel = World.hospSel, it = sel != null ? World.hospItemById(sel) : null;
  return `<div class="editbar"><div class="grow">🏥 ${it ? t('placeHint') : t('cafeEditHint')}</div>${it ? `${it ? '<button class="btn g sm" data-a="hosprot">🔄</button>' : ''}<button class="btn r sm" data-a="hosptrash">🗑️</button>` : `<button class="btn o sm" data-a="cafepanel" data-v="hospshop">🛋️ ${t('hospShopBtn')}</button>`}<button class="btn sm" data-a="hospdone">✓ ${t('done')}</button></div>`;
}
// Serve a patient: the player walks to the desk / the room, then does the step (X-ray, CT and surgery are a mini-game first)
function hospDo(pid) {
  const hp = HOSP.ensure(S), p = hp.patients.find(x => x.id === pid); if (!p) return;
  if (!hospReady(p)) { toast('⏳ ' + t('hospWaiting')); return; }
  const tx = hospTx(hospStage(p)), go = q => { const r = actR({ t: 'hospserve', pid, q }); if (r && r.ok) SND.love(); if (panel && panel.type === 'hosp') renderPanel(true); };
  const spot = World.hospPerf(pid);
  const start = () => { if (tx.mini) openHospMini(pid); else go(1); };
  if (spot && World.me) { closePanel(); World.goTo(World.me, spot.x, spot.y, () => { if (World.me && spot.fx != null) { World.me.dir = (spot.fx - World.me.x) - (spot.fy - World.me.y) > 0 ? 1 : -1; World.me.face = (spot.fx + spot.fy) < (World.me.x + World.me.y) ? 1 : 0; } start(); }); } else start();
}
let HM = null;
function openHospMini(pid) {
  const hp = HOSP.ensure(S), p = hp.patients.find(x => x.id === pid); if (!p) return;
  HM = { pid, hits: 0, round: 0, pos: 0, dir: 1, speed: 70 + hospLv() * 8, zw: 22, zx: 30 + Math.random() * 40, last: 0, msg: '' };
  openPanel({ type: 'hospmini', pid });
  requestAnimationFrame(hmLoop);
}
function hmLoop(now) {
  const m = document.getElementById('hmmark'); if (!HM || !m) { return; }
  const dt = HM.last ? Math.min(.05, (now - HM.last) / 1000) : 0; HM.last = now;
  HM.pos += HM.dir * HM.speed * dt; if (HM.pos > 100) { HM.pos = 100; HM.dir = -1; } if (HM.pos < 0) { HM.pos = 0; HM.dir = 1; }
  m.style.left = HM.pos + '%'; const z = document.getElementById('hmzone'); if (z) { z.style.left = HM.zx + '%'; z.style.width = HM.zw + '%'; }
  requestAnimationFrame(hmLoop);
}
PANELS.hospmini = m => {
  const hp = HOSP.ensure(S), p = hp.patients.find(x => x.id === m.pid); if (!p) return '';
  const tx = hospTx(hospStage(p) === 'pay' ? 'xray' : hospStage(p));
  return frameHTML(tx.icon + ' ' + t('tx_' + tx.id), `<div class="m">${t('hospMiniDesc')}</div><div style="position:relative;height:34px;background:#e8f1ef;border-radius:17px;margin:16px 0;overflow:hidden;border:2px solid #9cc9c2"><div id="hmzone" style="position:absolute;top:0;bottom:0;background:rgba(80,200,120,.6)"></div><div id="hmmark" style="position:absolute;top:0;bottom:0;width:6px;margin-left:-3px;background:#e0505a;border-radius:3px"></div></div><div id="hmst" class="m center">${t('hospMiniRound', { n: 1 })}</div><button class="btn o block" data-a="hmtap">✋ ${t('hospMiniTap')}</button>`);
};
function hmTap() {
  if (!HM) return;
  const inZone = HM.pos >= HM.zx && HM.pos <= HM.zx + HM.zw; if (inZone) HM.hits++;
  HM.round++;
  const st = document.getElementById('hmst');
  if (HM.round >= 3) {
    const q = [.8, 1, 1.25, 1.5][HM.hits], pid = HM.pid; HM = null; closePanel();
    const r = actR({ t: 'hospserve', pid, q }); if (r && r.ok) { SND.love(); toast((q >= 1.25 ? '🌟 ' : '') + t('hospMiniResult', { p: Math.round(q * 100) })); }
    return;
  }
  HM.zx = 10 + Math.random() * 70; HM.zw = Math.max(12, HM.zw - 4); HM.speed *= 1.15;
  if (st) st.textContent = (inZone ? '✅ ' : '❌ ') + t('hospMiniRound', { n: HM.round + 1 });
}
PANELS.cafestaff = () => {
  const cf = CAFE.ensure(S);
  let b = staffCatTabs('cafe') + `<div class="m">${t('cafeStaffDesc')}</div><div class="card"><div class="t">😊 ${t('cafeJoy')}</div>${bar(Math.round(cf.joy || 0), 'linear-gradient(#ffd77a,#f2a03d)', Math.round(cf.joy || 0) + '%')}<div class="m">${t('cafeJoyDesc')}</div></div>`;
  b += CAFE_STAFF.map(r => {
    const mine = cf.staff.filter(m => m.role === r.id), n = mine.length, cost = cafeStaffHire(r, n);
    return `<div class="card"><div class="t">${r.icon} ${t('cstf_' + r.id)} <span class="m">· ${t('cstf_' + r.id + '_d')}</span></div>` + mine.map(m => {
      const up = m.lv < CAFE_STAFF_LV_MAX ? cafeStaffUp(r, m.lv) : 0;
      return `<div class="li"><div class="ic">${r.icon}</div><div class="grow"><div class="t">${esc(m.name || '')} · Lv${m.lv}</div><div class="m">⏱ ${CAFE_STAFF_DUR[m.lv]}s · 💰 ${t('hospWage', { c: fmt(cafeStaffWage(r, m.lv)) })} · ✅ ${m.done | 0}</div></div>${m.lv < CAFE_STAFF_LV_MAX ? `<button class="btn o sm ${S.coins < up ? 'dis' : ''}" data-a="cafestaffup" data-v="${m.id}">⬆ 🪙${fmt(up)}</button>` : '👑'}<button class="btn r sm" data-a="cafefire" data-v="${m.id}">✕</button></div>`;
    }).join('') + (n < CAFE_STAFF_MAX ? `<button class="btn o block ${S.coins < cost ? 'dis' : ''}" data-a="cafehire" data-v="${r.id}">${t('hospHireBtn')} 🪙${fmt(cost)} · ${t('hospWage', { c: fmt(cafeStaffWage(r, 1)) })}</button>` : `<div class="m">${t('hospStaffFull')}</div>`) + '</div>';
  }).join('');
  return frameHTML('☕ ' + t('cafeName'), b);
};
PANELS.cafeshop =() => frameHTML('🛋️ ' + t('cafeShopBtn'), `<div class="row" style="gap:8px;margin-bottom:6px"><button class="btn o sm" data-a="cafepanel" data-v="cafe">◀ ${t('cafeName')}</button><button class="btn g sm" data-a="cafeedit">🔨 ${t('cafeEditBtn')}</button></div>` + cafeShopList());
function cafeEditBar() {
  const sel = World.cafeSel, it = sel != null ? World.cafeItemById(sel) : null, F = it ? cafeFurn(it.k) : null;
  return `<div class="editbar"><div class="grow">☕ ${it ? t('placeHint') : t('cafeEditHint')}</div>${it ? `${F ? '<button class="btn g sm" data-a="caferotate">🔄</button>' : ''}<button class="btn r sm" data-a="cafetrash">🗑️</button>` : `<button class="btn o sm" data-a="cafepanel" data-v="cafeshop">🛋️ ${t('cafeShopBtn')}</button>`}<button class="btn sm" data-a="cafedone">✓ ${t('done')}</button></div>`;
}
PANELS.decor = () => frameHTML('🛋️ ' + t('decorSec'), decorList());
PANELS.quest = () => {
  let h = `<div class="card"><div class="t">🎁 ${t('loginBonus')}</div><div class="m">${t('loginDay', { n: S.login.streak, c: fmt(50 * Math.min(S.login.streak, 7) + lvE(S) * 10) })}</div>
    <div class="dots">${[1, 2, 3, 4, 5, 6, 7].map(d => `<i class="${d <= Math.min(7, S.login.streak) ? 'on' : ''}"></i>`).join('')}</div></div><div class="m">${t('questReset')}</div>`;
  (S.daily ? S.daily.quests : []).forEach((q, i) => {
    h += `<div class="li"><div class="ic">${{ feed: '🍖', clean: '🧽', play: '🎾', sell: '🤝', earn: '🪙', buy: '🐾', groom: '✂️', born: '🍼', serve: '🧾', trick: '🎪', mini: '🎮', great: '💯' }[q.k]}</div><div class="grow"><div class="t">${t('q_' + q.k, { n: fmt(q.n) })}</div>
      ${bar(q.p / q.n * 100, 'linear-gradient(#b8e89a,#5cae3c)', fmt(q.p) + ' / ' + fmt(q.n))}<div class="m">🪙 ${q.r}</div></div>
      ${q.claimed ? '✅' : `<button class="btn sm ${q.done ? '' : 'dis'}" data-a="claim" data-v="${i}">${t('claim')}</button>`}</div>`;
  });
  h += `<div class="t" style="margin-top:10px">📊 ${t('stats')}</div><div class="grid2">` + [['st_sold', S.stats.sold, '🤝'], ['st_born', S.stats.born || 0, '🍼'], ['st_earned', fmt(S.stats.earned), '🪙'], ['st_fed', S.stats.fed, '🍖']]
    .map(([k, v, ic]) => `<div class="card center"><div>${ic}</div><div class="t">${v}</div><div class="m">${t(k)}</div></div>`).join('') + '</div>';
  return frameHTML('📜 ' + t('questTitle'), h);
};
// v1.20: sort tabs -- tap a tab: its default order; tap the SAME tab again: reversed. The panel always opens on 배부름순.
const PET_SORTS = {
  hunger: (a, b) => a.hunger - b.hunger,           // hungriest first
  clean: (a, b) => a.clean - b.clean,              // dirtiest first
  stress: (a, b) => b.stress - a.stress,           // most stressed first
  bored: (a, b) => b.bored - a.bored,              // most bored first
  price: (a, b) => G.price(S, b) - G.price(S, a),  // most expensive first
  level: (a, b) => (b.lv || 1) - (a.lv || 1) || G.ageOf(b) - G.ageOf(a),
  species: null,                                   // the species you have most of first, highest level first inside it
};
function sortPets(list, key, rev) {
  let out;
  if (key === 'species') { const n = {}; for (const p of list) n[p.sp] = (n[p.sp] || 0) + 1; out = list.slice().sort((a, b) => n[b.sp] - n[a.sp] || spName(a.sp).localeCompare(spName(b.sp)) || (b.lv || 1) - (a.lv || 1)); }
  else out = list.slice().sort(PET_SORTS[key] || PET_SORTS.hunger);
  return rev ? out.reverse() : out;
}
PANELS.pets = m => {
  const sortKey = (m && m.psort) || 'hunger', rev = !!(m && m.prev);
  const list = sortPets(S.pets.filter(Boolean), sortKey, rev);
  return frameHTML('🐾 ' + t('allPets') + ` (${S.pets.filter(Boolean).length}/${S.slots})`,
  `<div class="chips">${Object.keys(PET_SORTS).map(k => `<button class="chip ${sortKey === k ? 'on' : ''}" data-a="psort" data-v="${k}">${t('ps_' + k)}${sortKey === k ? (rev ? ' ▲' : ' ▼') : ''}</button>`).join('')}</div>`
  + list.map(p => `<button class="li" data-a="pet" data-v="${p.id}"><div class="ic"><img src="${PIC.my(p)}"><span class="moodic" title="${t('mood_' + ART.moodOf(p))}">${ART.moodEmoji(ART.moodOf(p))}</span></div><div class="grow"><div class="t">${esc(p.name)} <span class="sex ${p.sex}">${p.sex === 'm' ? '♂' : '♀'}</span> ${p.grow >= 1 ? '✅' : '🌱' + Math.floor(p.grow * 100) + '%'} <span class="m" style="float:right">🪙${fmt(G.price(S, p))}</span></div>
    <div class="m">${esc(spName(p.sp))} · Lv${p.lv || 1} · ${traitName(p.trait)}${p.pen ? ' · 🎠' : ''}</div><div class="m">🍖${Math.round(p.hunger)} 🧽${Math.round(p.clean)} 😣${Math.round(p.stress)} 💭${Math.round(p.bored)}</div></div>›</button>`).join('')
  + S.breeding.map(b => `<div class="li"><div class="ic">🥚</div><div class="grow"><div class="t">${t('nest')}</div><div class="m">${esc(t('nestLeft', { a: b.na, b: b.nb, t: fmtT(b.left), n: b.n }))}</div></div></div>`).join('')
  + `<button class="btn o block" data-a="open" data-v="market">🐶 ${t('tabMarket')}</button>`);
};
PANELS.book = () => frameHTML('📖 ' + t('book'), `<div class="m">${t('bookSub', { a: Object.keys(S.book).length, b: SPECIES_RAW.length })}</div><div class="grid3">` +
  SPECIES_RAW.map(([id]) => `<div class="tile ${S.book[id] ? '' : 'lock'}"><img src="${PIC.pet(id)}" style="width:64px;height:64px"><div class="m">${S.book[id] ? esc(spName(id)) : '???'}</div></div>`).join('') + '</div>');
PANELS.level = m => { const e = m.e; return frameHTML('🎉 ' + t('levelUp', { n: e.n }), `<div class="center"><div class="t">+🪙 ${fmt(e.bonus || 0)}</div>${e.tk ? `<div class="t">+🎟️ ${e.tk}</div>` : ''}${e.n > 30 && e.cb ? `<div class="m">⭐ ${t('careerB', { n: e.cb })}</div>` : ''}${e.n >= MAX_LEVEL ? `<div class="m">👑 ${t('maxLv')}</div>` : ''}
  ${e.news && e.news.length ? `<div class="m">${t('newAnimals', { list: '' })}</div><div class="grid3">${e.news.map(id => `<div class="tile"><img src="${PIC.pet(id)}" style="width:64px;height:64px"><div class="m">${esc(spName(id))}</div></div>`).join('')}</div>` : ''}
  ${(() => { const g = PRODUCTS.filter(x => x.lv === e.n), hs = HOUSE_MODELS.filter(x => x.ulv === e.n); return (g.length ? `<div class="m">🛍️ ${t('newGoods')}: ${g.map(x => x.icon + ' ' + t('pr_' + x.id)).join(', ')}</div>` : '') + (hs.length ? `<div class="m">🏠 ${t('newHouses')}: ${hs.map(x => t('hm_' + x.id)).join(', ')}</div>` : ''); })()}
  <button class="btn block" data-a="close">${t('ok')}</button></div>`, true); };
PANELS.settings = () => frameHTML('⚙️ ' + t('settings'), `
  <div class="t">${t('language')}</div>
  <button class="langbtn" data-a="lang" data-v="ko"><span class="flag">🇰🇷</span>한국어 ${CFG.lang === 'ko' ? '✓' : ''}</button>
  <button class="langbtn" data-a="lang" data-v="ru"><span class="flag">🇷🇺</span>Русский ${CFG.lang === 'ru' ? '✓' : ''}</button>
  <button class="li" data-a="charedit"><div class="ic"><img src="${PIC.human(CFG.look)}"></div><div class="grow"><div class="t">${t('myChar')}</div><div class="m">${esc(CFG.name)}</div></div>›</button>
  <button class="li" data-a="setshop"><div class="ic">🏪</div><div class="grow"><div class="t">${t('shopName')}</div><div class="m">${esc(S.shop)}</div></div>›</button>
  <button class="li" data-a="names"><div class="ic">🏷️</div><div class="grow"><div class="t">${t('showNames')}</div><div class="m">${App.showNames ? 'ON' : 'OFF'}</div></div></button>
  <button class="li" data-a="bgm"><div class="ic">🎵</div><div class="grow"><div class="t">${t('bgmL')}</div><div class="m">${CFG.bgm === false ? 'OFF' : 'ON'}</div></div></button>
  <button class="li" data-a="mute"><div class="ic">${CFG.mute ? '🔇' : '🔊'}</div><div class="grow"><div class="t">Sound</div><div class="m">${CFG.mute ? 'OFF' : 'ON'}</div></div></button>
  <div class="t" style="margin-top:8px">💾 ${t('backup')}</div>
  <button class="li" data-a="export"><div class="ic">📋</div><div class="grow t">${t('exportSave')}</div></button>
  <button class="li" data-a="import"><div class="ic">📥</div><div class="grow t">${t('importSave')}</div></button>
  <button class="li" data-a="newstart"><div class="ic">🌱</div><div class="grow"><div class="t">${t('newStart')}</div><div class="m">${t('newStartDesc')}</div></div></button>`);
PANELS.coop = m => {
  let h = `<div class="m">${t('coopDesc')}</div>`;
  if (!Net.has()) return frameHTML('📶 ' + t('coopTitle'), h + `<div class="banner">Android app only</div>`);
  if (Net.mode === 'host') {
    const ip = myIp() || Net.hostIp, others = Object.entries(Net.players).filter(([id]) => id !== CFG.id);
    h += `<div class="card center"><div>🟢 ${t('hosting')}</div><div class="ipbig">${esc(ip || '?')}</div>
      ${others.length ? others.map(([, p]) => `<div><span class="dot"></span>${esc(p.name)} · ${t('online')}</div>`).join('') : `<div class="spinner"></div><div class="m pulse">${t('waiting')}</div>`}</div>
      ${!ip ? `<div class="banner">${t('noWifi')}</div>` : ''}<button class="btn p block" data-a="heart">💕 ${t('sendHeart')}</button><button class="btn g block" data-a="stophost">${t('stopHost')}</button>`;
  } else if (Net.mode === 'guest') {
    const st = Net.synced && !Net.lost ? '🟢 ' + esc(t('connected', { name: Net.hostName })) : Net.why && Net.fails >= 2 ? '🟠 ' + t('coopWhy_' + Net.why) : '🟡 ' + t('coopConnecting');
    h += `<div class="card center"><div>${st}</div><div class="m">${esc(Net.hostIp)}</div>${!Net.synced && Net.why ? `<div class="m" style="margin-top:6px">${t('coopHelp')}</div>` : ''}</div>
      <button class="btn p block" data-a="heart">💕 ${t('sendHeart')}</button><button class="btn g block" data-a="leave">${t('disconnect')}</button>`;
  } else {
    const st = m.phase || '';
    h += `<button class="btn b block" data-a="host">🏪 ${t('host')}</button><div class="m center">${t('hostDesc')}</div>
      <button class="btn block" data-a="search">🔍 ${t('join')}</button><div class="m center">${t('joinDesc')}</div>`;
    if (st === 'search') h += `<div class="spinner"></div><div class="m center">${t('searching')}</div>`;
    if (st === 'found') h += `<div class="card center"><div>${esc(t('found', { name: m.found.name }))}</div><div class="m">${esc(m.found.ip)}</div><button class="btn b block" data-a="joinfound">${t('connect')}</button></div>`;
    if (st === 'fail') h += `<div class="banner">${t('notFound')}</div>`;
    h += `<button class="btn g block" data-a="manual">⌨️ ${t('manualIp')}</button><div class="m center">${t('yourIp', { ip: esc(myIp() || '-') })}</div>`;
  }
  return frameHTML('📶 ' + t('coopTitle'), h);
};
PANELS.prompt = m => `<div class="ov"><div class="panel"><div class="ph">${esc(m.title)}</div><div class="pb">${m.text ? `<div class="m" style="font-size:14px">${esc(m.text)}</div>` : ''}
  ${m.input != null ? `<label class="field"><input id="pin" value="${esc(m.input)}" maxlength="${m.max || 200}" ${m.num ? 'inputmode="decimal"' : ''}></label>` : ''}
  <div class="row" style="margin-top:10px"><button class="btn g grow" data-a="close">${m.cancel || t('cancel')}</button><button class="btn grow" data-a="pok">${m.okText || t('ok')}</button></div></div></div></div>`;
// character creator (welcome + settings)
const CHAR = { hs: [0, 1, 2, 3, 4], hair: ART.HAIR, skin: ART.SKIN, shirt: ART.SHIRT, bottom: ['pants', 'skirt'] };
PANELS.welcome = m => {
  if (m.step === 'lang') return `<div class="ov"><div class="panel"><div class="ph">🐾 My little Lisa Pet shop</div><div class="pb center"><canvas id="wcv" class="cv" width="300" height="130" style="width:300px;height:130px"></canvas>
    <div class="m">언어를 선택하세요 · Выберите язык</div>
    <button class="langbtn" data-a="wlang" data-v="ko"><span class="flag">🇰🇷</span>한국어</button><button class="langbtn" data-a="wlang" data-v="ru"><span class="flag">🇷🇺</span>Русский</button></div></div></div>`;
  return charHTML(m.step === 'edit');
};
const EYECOL = ['#3a2418', '#4a2c1a', '#6b4a2b', '#8a6a2a', '#3f7a4f', '#4a6fa5', '#7a8a9a', '#2b2b3a', '#8a4a8a', '#c0504a'];
const ACC = ['#ef7fa0', '#e07a5f', '#f2c14e', '#90be6d', '#4f7cac', '#8a6fb5', '#ffffff', '#2b2b33', '#7f5539'];
const DIR_CYCLE = [0, 3, 2, 1]; // 미리보기 회전 순서: 정면 -> 대각선 -> 옆면 -> 뒷면
// v1.100.14: 색상 슬라이더(드래그 막대) 대신 미리 고른 색상 버튼 12개(2줄)로 교체.
// v: 기존 색조 회전값(0~460, 기존 엔진과 동일 - 0=원래색, 361~460=검정~흰색 무채색), bg: 버튼에 보일 색
const COLOR_SWATCHES = [
  { v: 0, bg: null },        // 원래색(되돌리기)
  { v: 350, bg: '#e2574c' }, // 빨강
  { v: 28, bg: '#e8954a' },  // 주황
  { v: 55, bg: '#e8cf4a' },  // 노랑
  { v: 125, bg: '#5fa85f' }, // 초록
  { v: 195, bg: '#4aa3c9' }, // 하늘
  { v: 225, bg: '#4a72c9' }, // 파랑
  { v: 270, bg: '#8a68c9' }, // 보라
  { v: 320, bg: '#d868a0' }, // 핑크
  { v: 445, bg: '#ffffff' }, // 흰색
  { v: 430, bg: '#c7c7c7' }, // 연회색
  { v: 361, bg: '#1c1c1c' }, // 검정
];
// ================= 캐릭터 파츠/색상 해금 레벨 =================
// 파츠 번호 1~15에 대응 (index 0 = 파츠 1)
const PART_UNLOCK_LV = [1, 1, 1, 3, 5, 8, 12, 16, 20, 25, 30, 40, 50, 65, 80];

// COLOR_SWATCHES 순서와 1:1 대응 (0번은 "원래색"=항상 열림)
const COLOR_UNLOCK_LV = [0, 1, 1, 1, 1, 5, 10, 15, 20, 30, 40, 50, 65];
const DIR_CYCLE_KEYS = ['dirFrontL', 'dirDiagL', 'dirSideL', 'dirBackL'];
function charHTML(editing) {
  const L = HUM.norm(CFG.look);
  const sub = (panel && panel.pngsub) || 'hair';
  const CATS = [['face', 'pFace', 'pngFaceL'], ['hair', 'pHair', 'pngHairL'], ['top', 'pTop', 'pngTopL'], ['bottom', 'pBottom', 'pngBottomL'], ['acc', 'pAcc', 'accBtnL']];
  const capName = { face: 'Face', hair: 'Hair', top: 'Top', bottom: 'Bottom' };
  const nameOf = (cat, idx) => idx ? t('png' + capName[cat] + idx) : t('noneL');
  const CAT_ICON = { face: '\uD83D\uDE42', hair: '\uD83D\uDC87\u200D\u2640\uFE0F', top: '\uD83D\uDC55', bottom: '\uD83D\uDC56', acc: '\uD83D\uDC52' };
  const subbar = `<div class="pngsubbar">${CATS.map(([k, , lk]) => `<button class="${sub === k ? 'on' : ''}" data-a="pngsub" data-v="${k}">${CAT_ICON[k] || ''} ${t(lk)}</button>`).join('')}</div>`;
  const customs = HUM.loadCustomParts();
  let grid;
  if (sub === 'acc') {
    // ========== 🆕 슬롯별 소품 UI (v1.102) ==========
    const SLOT_LABEL = {
      head:  '🎩 ' + (CFG.lang === 'ru' ? 'Головные уборы' : '모자'),
      face:  '👓 ' + (CFG.lang === 'ru' ? 'Очки' : '안경'),
      neck:  '📿 ' + (CFG.lang === 'ru' ? 'Ожерелья' : '목걸이'),
      ear:   '💎 ' + (CFG.lang === 'ru' ? 'Серьги' : '귀걸이'),
      scarf: '🧣 ' + (CFG.lang === 'ru' ? 'Шарфы' : '목도리'),
    };
    
    const owned = (S && S.x && S.x.cosm) || {};
    const acc = L.acc || {};
    
    // 슬롯별로 그룹화
    let accHTML = '';
    for (const slot of ACC_SLOTS) {
      // 이 슬롯에 속한 소품 목록 (보유한 것만)
      const slotItems = Object.entries(COSM_DEF).filter(([id, d]) => d.slot === slot && owned[id]);
      
      // 보유한 소품이 하나도 없으면 스킵 (또는 "없음" 버튼만 표시)
      accHTML += `<div class="t" style="width:100%; margin:10px 0 6px; font-weight:bold;">${SLOT_LABEL[slot]}</div>`;
      accHTML += `<div class="thumbs pnggrid" style="width:100%;">`;
      
      // "없음" 버튼
      const curId = acc[slot] || null;
      accHTML += `<button class="th ${!curId ? 'on' : ''}" data-a="setacc" data-v="${slot}" data-w="">
        <span style="font-size:20px;">✕</span><span>${CFG.lang === 'ru' ? 'Нет' : '없음'}</span>
      </button>`;
      
      // 이 슬롯의 소품들
      for (const [id, def] of Object.entries(COSM_DEF)) {
        if (def.slot !== slot) continue;
        const isOwned = !!owned[id];
        const isCurrent = curId === id;
        
        if (!isOwned) {
          // 미보유: 잠금 표시
          accHTML += `<button class="th locked" disabled title="${CFG.lang === 'ru' ? 'Получите в гаче' : '뽑기에서 획득'}">
            <span style="font-size:20px;">🔒</span>
            <span style="font-size:10px;">${CFG.lang === 'ru' ? 'Гача' : '뽑기'}</span>
          </button>`;
        } else {
          // 보유: 착용 버튼
          accHTML += `<button class="th ${isCurrent ? 'on' : ''}" data-a="setacc" data-v="${slot}" data-w="${id}">
            <span style="font-size:22px;">${def.icon}</span>
            <span>${t('cosm_' + id) || id}</span>
          </button>`;
        }
      }
      
      accHTML += `</div>`;
    }
    
    grid = `<div class="pngwrap">${accHTML}`;
    
    // 보유한 소품이 하나도 없을 때 안내
    const totalOwned = Object.keys(owned).length;
    if (totalOwned === 0) {
      grid += `<div class="m" style="padding:10px 4px;">${t('accEmptyHint') || '아직 소품이 없어요. 뽑기로 획득해보세요!'}</div>`;
    }
    
    // 기존 커스텀 그림도 유지 (선택)
    const list = customs.acc || [];
    if (list.length) {
      grid += `<div class="t" style="width:100%; margin:10px 0 6px; font-weight:bold;">🖼️ ${CFG.lang === 'ru' ? 'Мои рисунки' : '내 그림'}</div>`;
      grid += `<div class="thumbs pnggrid" style="width:100%;">`;
      list.forEach((durl, i) => {
        const cid = 'c' + i;
        grid += `<button class="th ${L.pAcc === cid ? 'on' : ''}" data-a="setpart" data-v="acc" data-w="${cid}">
          <img src="${durl}"><span>${t('myPic')} ${i + 1}</span>
        </button>`;
      });
      grid += `</div>`;
    }
    
    grid += `</div>`;
    // ========== 슬롯별 소품 UI 끝 ==========
  } else {
    const curKey = CATS.find(c => c[0] === sub)[1];
    grid = `<div class="pngwrap"><div class="thumbs pnggrid">`;
    for (let i = 1; i <= 15; i++) {
  const needLv = PART_UNLOCK_LV[i - 1] || 1;
  const isCurrent = L[curKey] === i;
  const unlocked = (S && S.level >= needLv) || isCurrent;  // 이미 쓰고 있으면 잠금 무시
  const imgUrl = assetUrl(`spr/mychar2/${sub}/${sub}_${String(i).padStart(2, '0')}.png`);
  const name = nameOf(sub, i);
  if (!unlocked) {
    grid += `<button class="th locked" disabled>
      <img src="${imgUrl}" class="lockThumb">
      <span class="lockOverlay">🔒 Lv ${needLv}</span>
      <span class="lockName">${name}</span>
    </button>`;
  } else {
    grid += `<button class="th ${isCurrent ? 'on' : ''}" 
      data-a="setpart" data-v="${sub}" data-w="${i}">
      <img src="${imgUrl}">
      <span>${name}</span>
    </button>`;
  }
}
    (customs[sub] || []).forEach((durl, i) => { const cid = 'c' + i; grid += `<button class="th ${L[curKey] === cid ? 'on' : ''}" data-a="setpart" data-v="${sub}" data-w="${cid}"><img src="${durl}"><span>${t('myPic')} ${i + 1}</span></button>`; });
    grid += '</div></div>';
  }
  // v1.100.14: 얼굴은 색상 변경 기능 제거(기본 살색 고정) - 얼굴 탭에선 색상 줄 자체를 안 보여줌
  const hueKey = sub === 'top' ? 'pTopHue' : sub === 'bottom' ? 'pBottomHue' : sub === 'hair' ? 'pHairHue' : null;
  const curSwatch = hueKey ? (L[hueKey] || 0) : 0;
  const hueRow = hueKey ? `<div class="huerow swrow"><span class="m">🎨 ${t('colorHueL')}</span><div class="swgrid">${COLOR_SWATCHES.map((s, idx) => {
  const needLv = COLOR_UNLOCK_LV[idx] || 0;
  const isCurrent = curSwatch === s.v || (s.v === 445 && curSwatch === 460);
  const unlocked = needLv === 0 || (S && S.level >= needLv) || isCurrent;  // 원래색(0) 또는 이미 쓰는 색은 허용
  if (!unlocked) {
    return `<button class="swatch locked" disabled style="background:${s.bg || '#eee'}"><span class="lockSm">🔒</span><span class="lockLvSm">${needLv}</span></button>`;
  }
  return `<button class="swatch${isCurrent ? ' on' : ''}${s.v === 0 ? ' sw-reset' : ''}" data-a="setswatch" data-v="${sub}" data-w="${s.v}"${s.bg ? ` style="background:${s.bg}"` : ''}>${s.v === 0 ? '↺' : (isCurrent ? '✓' : '')}</button>`;
}).join('')}</div></div>` : '';
  return `<div class="ov"><div class="panel"><div class="ph">${editing ? t('myChar') : t('welcomeTitle')}</div><div class="pb">
    <div class="cstick"><div class="cprevRow">
      <div class="cprev"><button class="cprevImport" data-a="pngimport" title="${t('importHint')}">📁<span>+</span></button><canvas id="cprevCv" width="300" height="470" style="width:165px;height:226px"></canvas><button class="cdirRotBtn" data-a="rotprev" data-v="1" title="${t('rotateHint')}"><img src="${assetUrl('spr/ui/icon_rotate.png')}" draggable="false" alt="rotate"></button></div>
    </div>
    <div class="pngwrap" style="margin-top:8px"><div class="m" style="margin-bottom:8px">${t('pngHint')}</div>${subbar}</div>
    ${hueRow}</div>
    ${grid}
    <input type="file" id="pngFileInput" accept="image/*" style="display:none">
    <label class="field"><span>${t('yourName')}</span><input id="wname" maxlength="12" value="${esc(CFG.name || t('defaultPlayer'))}"></label>
    ${editing ? '' : `<label class="field"><span>${t('shopName')}</span><input id="wshop" maxlength="20" value="${esc(t('defaultShop'))}"></label>`}
    <button class="btn o block" data-a="${editing ? 'charsave' : 'wstart'}">${editing ? t('save') : t('start') + ' 🐾'}</button></div></div></div>`;
}
function rerenderChar() {
  const pb = $('#panel .pb'), sc = pb ? pb.scrollTop : 0;
  const nm = $('#wname') ? $('#wname').value : null, sh = $('#wshop') ? $('#wshop').value : null;
  renderPanel(true); if (nm != null && $('#wname')) $('#wname').value = nm; if (sh != null && $('#wshop')) $('#wshop').value = sh;
  const pb2 = $('#panel .pb'); if (pb2) pb2.scrollTop = sc;
}
PANELS.shelter = () => {
  const sh = S.shelter = S.shelter || { pets: [], staff: { name: '미소', lv: 1 }, adoptionsToday: 0, totalAdopted: 0 };
  const pets = sh.pets || [];
  const staff = sh.staff || { name: '미소', lv: 1 };
  const staffName = (!staff.name || staff.name === '미소') ? t('shelterStaffDefaultName') : staff.name;
  const staffLook = ART.randomHuman(7721);
  staffLook.top = 'tee'; staffLook.shirt = '#2f7a5a'; staffLook.apron = '#fff5eb';
  let b = `<div class="m" style="margin-bottom:8px">${t('shelterIntro')}</div>`;
  b += `<div class="card" style="background:linear-gradient(180deg,#fff8ee,#fff1dc);border:2px solid #e2c08d">
    <div class="row" style="align-items:center;gap:10px">
      <div class="ic" style="width:56px;height:56px"><img src="${PIC.head(staffLook, 56)}" style="width:56px;height:56px"></div>
      <div class="grow">
        <div class="t">${t('shelterStaffTitle')} · ${esc(staffName)} <span class="m">Lv${staff.lv || 1}</span></div>
        <div class="m">💼 ${t('shelterStaffRoleDesc')}</div>
      </div>
    </div>
  </div>`;
  b += `<div class="card" style="background:#f0fdf4;border:1.5px solid #86efac;padding:8px 12px;margin:8px 0;font-size:12px;color:#166534;line-height:1.45">
    ✨ <b>전담 직원 자동 케어:</b> 전담 직원 <b>${esc(staffName)}</b>님이 아이들에게 밥주기, 목욕과 청소, 놀아주기를 모두 정성껏 자동으로 보살피고 있습니다! (수동 관리 메뉴 불필요 · 항상 최고 컨디션 유지)
  </div>`;
  b += `<div class="row" style="justify-content:space-between;align-items:center;margin:10px 0 6px">
    <div class="t">🐾 ${t('shelterProtectedHeader', { n: pets.length })}</div>
    <div class="m" style="color:#d97746;font-weight:900">${t('shelterTodayAdopt', { n: sh.adoptionsToday || 0 })}</div>
  </div>`;
  if (!pets.length) {
    b += `<div class="card" style="text-align:center;padding:22px 12px;color:var(--muted)">
      <div style="margin-bottom:6px"><img src="${PIC.pet('shiba', 1, 68, 'happy', 1)}" style="width:68px;height:68px"><img src="${PIC.pet('kitten', 2, 68, 'happy', 1)}" style="width:68px;height:68px"></div>
      <b>${t('shelterEmptyTitle')}</b>
      <div class="m" style="margin-top:4px">${t('shelterEmptyDesc')}</div>
    </div>`;
  } else {
    b += pets.map(p => {
      // Staff ensures all stats are full 100%
      p.hunger = 100; p.clean = 100; p.happy = 100; p.stress = 0; p.bored = 0;
      const sp = SPECIES[p.sp] || { name: p.sp, icon: '🐾' };
      const sname = spName(p.sp) || sp.name || p.sp;
      const imgUrl = PIC.pet(p.sp || 'shiba', p.coat || 1, 64, 'happy', 1);
      const dispName = (p.name && typeof I18N !== 'undefined' && I18N.ko) ? (() => {
        const k = Object.keys(I18N.ko).find(key => key.startsWith('stray_') && I18N.ko[key] === p.name);
        return k ? t(k) : p.name;
      })() : p.name;
      return `<div class="card" style="padding:10px;margin-bottom:8px">
        <div class="row" style="align-items:center;gap:10px">
          <div class="ic" style="width:64px;height:64px;background:#fff8ee;border-radius:12px;border:1.5px solid #e6d2b5;display:flex;align-items:center;justify-content:center"><img src="${imgUrl}" style="width:60px;height:60px"></div>
          <div class="grow">
            <div class="t">${esc(dispName)} <span class="m">(${esc(sname)})</span></div>
            <div class="m" style="color:#15803d;font-weight:700">✨ ${t('shelterStatHunger')}: 100% · ${t('shelterStatClean')}: 100% · ${t('shelterStatHappy')}: 100% (직원 상시 케어 중)</div>
          </div>
        </div>
        <div class="row" style="gap:6px;margin-top:8px">
          <button class="btn g sm grow" data-a="sheltertoshop" data-v="${p.id}">🏪 ${t('shelterToShopBtn')}</button>
          <button class="btn o sm grow" data-a="shelteradopt" data-v="${p.id}">🏡 ${t('shelterFindFamilyBtn')}</button>
        </div>
      </div>`;
    }).join('');
  }
  b += `<div class="m" style="margin-top:10px;text-align:center">💡 ${t('shelterFooterTip')}</div>`;
  return frameHTML('🛖 ' + t('tk_shelter'), b);
};
PANELS.zoo = () => {
  const z = S.zoo = S.zoo || { visitors: 0, coins: 0, fed: {} };
  const facilities = [
    { id: 'savanna', name: t('zooFacName_savanna'), sps: [['girin', 1], ['horse', 2]], anim: '기린 & 얼룩말 가족', pos: '5.5,4.7', desc: t('zooFacDesc_savanna') },
    { id: 'panda', name: t('zooFacName_panda'), sps: [['panda', 1], ['nuguri', 2]], anim: '판다 & 레서판다 가족', pos: '20.5,4.7', desc: t('zooFacDesc_panda') },
    { id: 'elephant', name: t('zooFacName_elephant'), sps: [['koggiri', 1]], anim: '코끼리 & 아기 코끼리', pos: '5.5,10.0', desc: t('zooFacDesc_elephant') },
    { id: 'tiger', name: t('zooFacName_tiger'), sps: [['tiger', 1]], anim: '시베리아 호랑이 가족', pos: '20.5,10.0', desc: t('zooFacDesc_tiger') },
    { id: 'lagoon', name: t('zooFacName_lagoon'), sps: [['hama', 1], ['cro', 2], ['hak', 3]], anim: '하마 & 악어 & 학', pos: '5.1,15.5', desc: t('zooFacDesc_lagoon') },
    { id: 'bear', name: '갈색곰 바위 언덕', sps: [['bear', 1]], anim: '갈색곰 & 아기 곰', pos: '20.5,15.5', desc: '바위 언덕에서 휴식하는 곰 가족' },
    { id: 'polar', name: t('zooFacName_polar'), sps: [['penguin', 1]], anim: '황제 펭귄 가족', pos: '20.9,19.6', desc: t('zooFacDesc_polar') }
  ];
  let b = `<div class="m" style="margin-bottom:8px">${t('zooPanelIntro')}</div>`;
  b += `<div class="card" style="background:linear-gradient(180deg,#f0fdf4,#dcfce7);border:2px solid #86efac;margin-bottom:8px">
    <div class="row" style="justify-content:space-between;align-items:center;gap:6px;flex-wrap:wrap">
      <div>
        <div class="t">👥 ${t('zooTotalVisitors', { n: z.visitors || 0 })}</div>
        <div class="m" style="color:#15803d;font-weight:800">${t('zooUncollectedTickets', { c: fmt(z.coins || 0) })}</div>
      </div>
      <div class="row" style="gap:6px">
        <button class="btn g sm" data-a="zoofocus" data-v="13,11">🔭 ${t('zooViewAllBtn')}</button>
        <button class="btn o sm ${(z.coins || 0) > 0 ? '' : 'dis'}" data-a="zooticket">🪙 ${t('zooSettleBtn')}</button>
      </div>
    </div>
  </div>`;
  b += `<button class="btn o block" style="margin-bottom:10px" data-a="zoofeed" data-v="all">🍖 ${t('zooFeedAllBtn')}</button>`;
  b += `<div class="t" style="margin:8px 0 6px">🌿 ${t('zooFacilitiesHeader')}</div>`;
  b += facilities.map(f => {
    const fedN = (z.fed && z.fed[f.id]) || 0;
    const pics = f.sps.map(([sp, sd]) => `<img src="${PIC.zooPet(sp, sd, 'happy')}" style="width:46px;height:46px;object-fit:contain">`).join('');
    return `<div class="card" style="padding:10px;margin-bottom:8px">
      <div class="row" style="align-items:center;gap:10px">
        <div class="ic" style="min-width:94px;height:56px;background:#fff8ee;border-radius:12px;border:1.5px solid #e6d2b5;display:flex;align-items:center;justify-content:center;gap:2px;padding:2px 4px">${pics}</div>
        <div class="grow">
          <div class="t">${f.name}</div>
          <div class="m" style="color:#b45309;font-weight:700;margin:2px 0">🐾 ${f.anim}</div>
          <div class="m">${f.desc}</div>
          <div class="m" style="color:#2f7a5a;margin-top:3px">${t('zooFedCount', { n: fedN })} ${fedN > 0 ? '✨ ' + t('zooEatingHappy') : ''}</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:5px">
          <button class="btn g sm" data-a="zoofeed" data-v="${f.id}">🍖 ${t('zooFeedOneBtn')}</button>
          <button class="btn b sm" data-a="zoofocus" data-v="${f.pos}">🔍 ${t('zooWatchBtn')}</button>
        </div>
      </div>
    </div>`;
  }).join('');
  return frameHTML('🦁 ' + t('tk_zoo'), b);
};
PANELS.needcagemodal = p => {
  const hname = (p && p.h && t('hk_' + p.h) !== 'hk_' + p.h) ? t('hk_' + p.h) : (p && p.h) || t('defaultCageName');
  const spname = (p && p.sp) ? spName(p.sp) : t('defaultAnimalName');
  let b = `<div style="text-align:center;padding:12px 6px">
    <div style="font-size:48px;margin-bottom:10px">🏠⚠️</div>
    <div class="t" style="font-size:17px;color:#c0302a;margin-bottom:8px">${t('needCageModalTitle')}</div>
    <div class="m" style="line-height:1.5;margin-bottom:14px">
      ${t('needCageModalBody', { sp: spname, h: hname })}
    </div>
    <button class="btn o block" data-a="open" data-v="shop" data-w="house">🛋️ ${t('needCageModalBtn')}</button>
  </div>`;
  return frameHTML('🐾 ' + t('needCageModalHeader'), b);
};
function askPrompt(o) { openPanel(Object.assign({ type: 'prompt' }, o)); const i = $('#pin'); if (i) setTimeout(() => i.focus(), 80); }

// ---------- world taps ----------
function onWorldTap(h) {
  if (typeof TOWNUI !== 'undefined' && TOWNUI.tap(h)) return; // PET TOWN
  if (h.kind === 'train' || h.kind === 'station') {
    if (typeof TRAIN !== 'undefined') {
      const sx = typeof TRAIN.STAT_X === 'function' ? TRAIN.STAT_X() : 18;
      const sy = typeof TRAIN.STAT_Y === 'function' ? TRAIN.STAT_Y() : -4.2;
      World.walkNear(Math.floor(sx), Math.floor(sy + 2));
    }
    openPanel({ type: 'train' });
    return;
  }
  if (h.kind === 'hospedit') {
    const sel = World.hospSel;
    if (h.it && h.it.id !== sel) { World.hospSel = h.it.id; render(); return; }
    const it = sel != null ? World.hospItemById(sel) : null;
    if (!it) { World.hospSel = null; render(); return; }
    const r = actR({ t: 'hospmove', iid: sel, x: h.gx - Math.floor((it.w - 1) / 2), y: h.gy - Math.floor((it.d - 1) / 2) });
    if (r && r.ok) World.hospSel = null;
    render(); return;
  }
  if (h.kind === 'hospsign') { const sg = HOSP_ENTRY(); World.walkNear(Math.floor(sg.x), Math.floor(sg.y), () => {
    if (S.hosp && S.hosp.built) { openPanel({ type: 'hosp' }); return; }
    if (repTier(S.rep || 0) < HOSP_UNLOCK_TIER) { toast(t('hospLockedMsg')); return; }
    askPrompt({ title: '🏥 ' + t('hospName'), text: t('hospBuildConfirm', { c: fmt(HOSP_BUILD_COST) }), okText: t('cafeBuildBtn'), ok: () => { const r = actR({ t: 'buildhosp' }); if (r && r.ok) { SND.level(); fxAt(innerWidth / 2, innerHeight / 2, '🏥'); } } });
  }); return; }
  if (h.kind === 'hstaff') { // a staff member: open the staff list of the business he works for
    const role = h.actor && h.actor.m && h.actor.m.role;
    if (role && farmStaffRole(role)) openPanel({ type: 'farmstaff' });
    else if (role && cafeStaffRole(role) && !hospStaffRole(role)) openPanel({ type: 'cafestaff' });
    else openPanel({ type: 'hospstaff' });
    return;
  }
  if (h.kind === 'hospcabinet') { openPanel({ type: 'hosp' }); return; }
  if (h.kind === 'patient' && h.actor && h.actor.salon) { const a = h.actor; if (a.salonWait) { const r = actR({ t: 'salongroom', cid: a.cid }); if (r && r.ok) SND.pop && SND.pop(); } return; } // v9.99
  if (h.kind === 'patient') { const pid = h.pid != null ? h.pid : (h.actor && h.actor.pat && h.actor.pat.id); if (pid != null) hospDo(pid); return; }  if (h.kind === 'cafeedit') {
    const sel = World.cafeSel;
    if (h.it && h.it.id !== sel) { World.cafeSel = h.it.id; render(); return; }
    const it = sel != null ? World.cafeItemById(sel) : null;
    if (!it) { World.cafeSel = null; render(); return; }
    const r = actR({ t: 'cafemove', iid: sel, x: h.gx - Math.floor((it.w - 1) / 2), y: h.gy - Math.floor((it.d - 1) / 2) });
    if (r && r.ok) World.cafeSel = null;
    render(); return;
  }
  if (h.kind === 'editdrop') { // v1.10: furniture dragged with the finger
    const r = actR({ t: 'move', iid: h.id, x: h.x, y: h.y }); if (r && r.ok) World.editSel = null; render(); return;
  }
  if (h.kind === 'edit') {
    const sel = World.editSel;
    if (h.hit && h.hit.kind === 'pet') { World.editSel = 'pet:' + h.hit.actor.pet.id; render(); return; }
    if (typeof sel === 'string' && sel.startsWith('pet:')) {
      const pid = sel.slice(4);
      if (h.hit && h.hit.item && h.hit.item.k === 'hab') act({ t: 'petmove', pid, iid: h.hit.item.id });
      World.editSel = null; render(); return;
    }
    if (sel == null) { const it = h.foot || (h.hit && h.hit.item); if (it) { World.editSel = it.id; render(); } return; }
    if (h.foot && h.foot.id !== sel && !(FURN.DEF[h.foot.k] || {}).flat) { World.editSel = h.foot.id; render(); return; }
    const selIt = S.items.find(i => i.id === sel); if (!selIt) { World.editSel = null; render(); return; }
    if (!h.foot && h.hit && h.hit.item && h.hit.item.id !== sel && (h.gx < 0 || h.gy < 0 || h.gx >= S.room.w || h.gy >= S.room.h)) { World.editSel = h.hit.item.id; render(); return; }
    const [ox, oy] = World.originFor(selIt, h.gx, h.gy);
    const r = actR({ t: 'move', iid: sel, x: ox, y: oy });
    if (r && r.ok) { World.editSel = null; }
    render();
    return;
  }
  if (h.kind === 'mess') { const m = h.m; World.goTo(World.me, m.x, m.y, () => { World.broom(1.1); SND.pop && SND.pop(); setTimeout(() => { act({ t: 'cleanmess', mid: m.id }); fxAt(innerWidth / 2, innerHeight / 2, '✨'); }, 1100); }); return; } // v1.19: sweep with a broom first
  if (h.kind === 'stray') { const st = h.st, sp = World.strayPos(st); World.goTo(World.me, sp.x, sp.y + 1, () => act({ t: 'rescue', sid: st.id })); World.center(); return; }
  if (h.kind === 'strayactor') {
    World.walkNear(Math.floor(h.actor.x), Math.floor(h.actor.y), () => {
      const r = actR({ t: 'catchstray', sp: h.sp });
      if (r && r.ok) {
        SND.love && SND.love();
        fxAt(innerWidth / 2, innerHeight / 2, '💕');
        World.actors.delete(h.id);
      }
    });
    return;
  }
  if (h.kind === 'guest') { openPanel({ type: 'hotel' }); return; }
  if (h.kind === 'home') { Home.goHome(); return; }
  if (h.kind === 'fplot') { const p = h.p; World.walkNear(p.x, p.y, () => useFarmPlot(p)); return; }
  if (h.kind === 'fgrid') { World.walkNear(h.gx, h.gy, () => useFarmGrid(h.gx, h.gy)); return; }
  if (h.kind === 'store') { World.goStore(h.store, () => openPanel({ type: h.store === 'seed' ? 'farmstall' : h.store === 'tool' ? 'farmtools' : 'shop', store: h.store })); return; }
  if (h.kind === 'cafesign') { const sg = CAFE_SIGN(); World.walkNear(sg.x, sg.y, () => {
    if (S.cafe && S.cafe.built) { openPanel({ type: 'cafe' }); return; }
    if (repTier(S.rep || 0) < CAFE_UNLOCK_TIER) { toast(t('cafeLockedMsg')); return; }
    askPrompt({ title: '☕ ' + t('cafeName'), text: t('cafeBuildConfirm', { c: fmt(CAFE_BUILD_COST) }), okText: t('cafeBuildBtn'), ok: () => { const r = actR({ t: 'buildcafe' }); if (r && r.ok) { SND.level(); fxAt(innerWidth / 2, innerHeight / 2, '☕'); } } });
  }); return; }
  if (h.kind === 'parksign') { const sg = PARK_SIGN(); World.walkNear(sg.x, sg.y, () => {
    if (PARK.isBuilt()) return;
    askPrompt({ title: '🌳 ' + t('parkName'), text: t('parkBuildConfirm', { c: fmt(PARK_COST) }), okText: t('parkBuildBtn'), ok: () => { const r = actR({ t: 'buildpark' }); if (r && r.ok) { SND.level(); fxAt(innerWidth / 2, innerHeight / 2, '🌳'); } } });
  }); return; }
  // v2026-10-10: "공원 둘레 길도 못 가요" -- park.js에서 'park' 탭 영역(인사 토스트 전용) 자체를
  // 호수처럼 완전히 없앴으므로, 이제 이 kind는 더 이상 발생하지 않음. 그냥 일반 길 클릭처럼
  // World.goTo로 넘어가서 공원 둘레 어디든 눌러서 걸어갈 수 있음.
  if (h.kind === 'vsign') { const k = h.vk, sg = VILLAGE.SIGN[k](); World.walkNear(sg.x, sg.y, () => { // v9.97
    if (VILLAGE.built(k)) return;
    const others = Object.entries(Net.players || {}).filter(([id]) => id !== CFG.id).map(([, p]) => p), pn = others[0];
    const go = txt => { const looks = k === 'monu' ? [CFG.look, (pn && pn.look) || ART.randomHuman(11)] : null; const r = actR({ t: 'vbuild', k, text: txt, looks }); if (r && r.ok) { SND.level(); fxAt(innerWidth / 2, innerHeight / 2, { avenue: '🌸', lake: '🦢', monu: '💑' }[k]); } };
    askPrompt(Object.assign({ title: t('vlot_' + k), text: t('vbuild_' + k, { c: fmt(VILLAGE_COST[k]) }), okText: t('vBuildBtn'), ok: v => go(v) }, k === 'monu' ? { input: (CFG.name || '') + ' ❤ ' + ((pn && pn.name) || ''), max: 22 } : {}));
  }); return; }
  if (h.kind === 'vboard') { const b = VILLAGE.BOARD(); World.walkNear(b.x, b.y + 1, () => openPanel({ type: 'vboard' })); return; }
  if (h.kind === 'vlake_duck') {
    if (typeof SND !== 'undefined' && SND.love) SND.love();
    const k = h.kindId || (h.did === 3 || h.did === 5 || h.did === 6 ? 3 : (h.did === 2 || h.did === 4 || h.did === 9 || h.did === 10 ? 2 : 1));
    const msg = k === 3 ? '🐥 꽥꽥! 귀여운 아기 오리가 헤엄치며 물장구를 쳐요!' : (k === 2 ? '🦆 꽥! 갈색 청둥오리가 호수에서 날개를 퍼덕여요!' : '🦆 꽥! 청둥오리가 호수에서 유유히 헤엄치고 있어요!');
    toast(msg);
    return;
  }
  if (h.kind === 'vlake') { const L = VILLAGE.LAKE(); World.walkNear(L.x + 1, L.y + 3, () => openPanel({ type: 'fishing' })); return; } // v9.99: fishing
  if (h.kind === 'salonsign') { const sg = SALON_SIGN(); World.walkNear(sg.x, sg.y, () => { if (SALON.built()) return; askPrompt({ title: '✂️ ' + t('salonName'), text: t('salonBuildConfirm', { c: fmt(SALON_COST) }), okText: t('salonBuildBtn'), ok: () => { const r = actR({ t: 'buildsalon' }); if (r && r.ok) { SND.level(); fxAt(innerWidth / 2, innerHeight / 2, '✂️'); } } }); }); return; }
  if (h.kind === 'salon') { openPanel({ type: 'salon' }); return; }
  if (h.kind === 'vmonu') { toast(t('vmonuHi', { t: (S.village && S.village.monuText) || '♥' })); return; }
  if (h.kind === 'cafestove') { const st = CAFE_STOVE(); World.walkNear(st.x, st.y, () => openPanel({ type: 'cafecook' })); return; }
  if (h.kind === 'cafefridge') { const fr = CAFE_FRIDGE(); World.walkNear(fr.x, fr.y, () => openPanel({ type: 'cafefridge' })); return; }
  if (h.kind === 'cafecounter') { const st = CAFE_STOVE(); World.walkNear(st.x, st.y, () => openPanel({ type: 'cafe' })); return; }
  if (h.kind === 'pet' && h.actor.pet.escaped) { const a = h.actor; World.goTo(World.me, Math.floor(a.x), Math.floor(a.y)); act({ t: 'catch', pid: a.pet.id }); return; }
  if (h.kind === 'cafeguest') { const a = h.actor; if (a && a.ordT > 0) { a.ordT = .05; toast(t('cafeOrderTaken')); } return; } // taking an order at the cashier's desk
  if (h.kind === 'coop') { openPanel({ type: 'farm' }); return; }
  if (h.kind === 'rdrop') { const L0 = LAY('ranch'); const r = actR({ t: 'rpick', id: h.id }); if (r && r.ok) { SND.pop && SND.pop(); fxAt(innerWidth / 2, innerHeight / 2 - 40, '🧺'); } return; }
  if (h.kind === 'rhaybox') { openPanel({ type: 'rhay' }); return; }
  if (h.kind === 'rpigbox') { openPanel({ type: 'rpig' }); return; }
  if (h.kind === 'ranchbox') { openPanel({ type: 'ranchbox' }); return; }
  if (h.kind === 'ranch') { openPanel({ type: 'ranch' }); return; }
  if (h.kind === 'habclean') { const it = h.item; World.walkNear(it.x, it.y + 1, () => { World.broom(1.1); setTimeout(() => { const r = actR({ t: 'habclean', iid: it.id }); if (r && r.ok) fxAt(innerWidth / 2, innerHeight / 2 - 40, '🧽'); }, 1100); }); return; }
  if (h.kind === 'farmbox') { const fb = FARM_BOX_POS(); if (fb) World.walkNear(fb.x, fb.y + 1, () => openPanel({ type: 'farmbox' })); return; }
  if (h.kind === 'insp') { toast(t('inspecting')); return; }
  if (h.kind === 'thief') { const a = h.actor; World.walkNear(Math.floor(a.x), Math.floor(a.y), () => act({ t: 'chase' })); return; }
  if (h.kind === 'staff') { openPanel({ type: 'staff' }); return; }
  if (h.kind === 'reg') { World.walkNear(Math.floor(h.actor.x), Math.floor(h.actor.y)); openPanel({ type: 'story' }); return; }
  if (h.kind === 'crate') { const d = h.d; World.goDrop(() => { App.carry = { did: d.id, sp: d.sp, coat: d.coat, kind: G.kindOf(d.sp) }; SND.love(); toast('🤗 ' + t('carryHint')); render(); }); return; }
  if (h.kind === 'parcel') { const pc = h.p; World.goDrop(() => act({ t: 'openparcel', id: pc.id })); return; }
  if (h.kind === 'cust') {
    const a = h.actor; if (!a.cust) return;
    // v2026-10-08: still out walking to the shop (hasn't arrived yet) -- show them as an ordinary resident, not the shop transaction screen.
    // The shop "손님" screen (recommend/sell/checkout) only makes sense once they've actually walked in the door (a.inside).
    if (!a.inside) { openPanel(a.cust.residentId ? { type: 'villager', rid: a.cust.residentId } : { type: 'visitor', cid: a.cust.id }); return; }
    if (a.cust.st === 'pay') { checkoutCust(a.cust.id); return; }
    if (a.cust.st === 'gwait') { World.walkNear(Math.floor(a.x), Math.floor(a.y)); openPanel({ type: 'cust', cid: a.cust.id }); return; }
    if (a.cust.st !== 'want') return;
    World.walkNear(Math.floor(a.x), Math.floor(a.y));
    openPanel({ type: 'cust', cid: a.cust.id }); return;
  }
  if (h.kind === 'vil') { // v2026-10-08: tap a villager walking the town to see who they are, how happy they are, and any pets they own
    const a = h.actor; if (!a || !a.residentId) return;
    if (a.dstK === 'lake') {
      const r = typeof TOWN !== 'undefined' && TOWN.residentById ? TOWN.residentById(S, a.residentId) : null;
      const rName = r ? r.name : '주민';
      const rHap = r ? (r.happy || 75) : 75;
      if (a.lakeAct === 'fish') {
        toast(`🎣 ${rName} 주민이 호수에서 여유롭게 낚시를 즐기고 있어요! (행복도 ${rHap})`);
      } else {
        toast(`☕ ${rName} 주민이 호숫가에서 평화롭게 휴식을 취하고 있어요! (행복도 ${rHap})`);
      }
    }
    openPanel({ type: 'villager', rid: a.residentId }); return;
  }
  if (h.kind === 'partner') { act({ t: 'heart' }); fxAt(innerWidth / 2, innerHeight / 2, '💕'); return; }
  if (App.carry && (h.kind === 'pet' || h.kind === 'crate')) { toast(t('carryBusy')); return; }
  if (h.kind === 'pet') { const a = h.actor; World.walkNear(Math.floor(a.x), Math.floor(a.y)); openPanel({ type: 'pet', pid: a.pet.id }); return; }
  if (h.kind === 'item') {
    const it = h.item;
    if (it.k === 'hab') {
      if (App.carry) { const cr = App.carry; World.walkNear(it.x, it.y, () => { const r = cr.did != null ? actR({ t: 'unpack', did: cr.did, iid: it.id }) : actR({ t: 'petmove', pid: cr.pid, iid: it.id }); if (r && r.ok) { App.carry = null; render(); } }); return; }
      const sl = G.slotsOfItem(it), occ = sl.map(i => S.pets[i]).filter(Boolean);
      World.walkNear(it.x, it.y);
      if (sl.length === 1 && occ[0]) openPanel({ type: 'pet', pid: occ[0].id }); else openPanel({ type: 'hab', slot: it.slot });
      return;
    }
    World.walkNear(it.x, it.y);
    if (it.k === 'counter') { const pc = S.customers.find(c => c.st === 'pay'); if (pc) checkoutCust(pc.id); else openPanel({ type: 'quest' }); }
    else if (G.GOODS_[it.k]) openPanel({ type: 'shelf', iid: it.id });
    else if (it.k === 'hotel') openPanel({ type: 'hotel' });
    else if (isPenKind(it.k)) openPanel({ type: 'pets' });
    else if (PC_ITEMS.includes(it.k)) openPanel({ type: 'online' });
    else if (it.k === 'groomtable') { const cu = S.customers.find(x => x.st === 'gwait'); if (cu) openPanel({ type: 'cust', cid: cu.id }); else toast(t('groomIdle')); }
    else toast(t('d_' + it.k));
  }
}

// ---------- render ----------
function hudAvatarCanvas() {
  const cv = $('#hudAvCv'); if (!cv) return;
  const c = cv.getContext('2d');
  c.setTransform(1, 0, 0, 1, 0, 0);
  if (cv.width !== 160) cv.width = 160;
  if (cv.height !== 160) cv.height = 160;
  c.clearRect(0, 0, 160, 160); c.scale(2, 2);
  c.translate(40, 111); c.scale(1.32, 1.32);
  ART.human(c, CFG.look, 0, 0, false);
}
function render() {
  if (!S) return;
  patch($('#ui'), hudHTML());
  hudAvatarCanvas();
  if (panel && !STATIC[panel.type]) renderPanel();
}

// ---------- input (DOM) ----------
let lastActAt = 0, lastActKey = '';
function triggerAct(el) {
  if (!el) return;
  const a = el.dataset.a, v = el.dataset.v, w = el.dataset.w;
  const key = a + '|' + v + '|' + w;
  const now = Date.now();
  if (now - lastActAt < 180 && lastActKey === key) return;
  lastActAt = now; lastActKey = key;
  if (a === 'ovclose') {
    if (Date.now() - panelOpenedAt > 250) closePanel();
    return;
  }
  handle(a, v, w);
}

// Stop pointerdown and pointerup on UI buttons from leaking into canvas world tap or moving the character
document.addEventListener('pointerdown', e => {
  const el = e.target.closest('[data-a], button, .bigbtn, .rbtn, .mbtn, .btn, .chip, .hbslot, .avatar');
  if (el && !el.closest('#joy')) {
    e.stopPropagation();
  }
}, true);

document.addEventListener('pointerup', e => {
  const el = e.target.closest('[data-a], button, .bigbtn, .rbtn, .mbtn, .btn, .chip, .hbslot, .avatar');
  if (el && !el.closest('#joy')) {
    e.stopPropagation();
  }
}, true);

document.addEventListener('click', e => {
  const el = e.target.closest('[data-a]');
  if (!el) return;
  e.stopPropagation();
  if (el.dataset.a === 'ovclose') {
    if (e.target === el && Date.now() - panelOpenedAt > 250) closePanel();
    return;
  }
  triggerAct(el);
});
// 색상(색조) 슬라이더: 드래그 중엔 미리보기 캔버스만 다시 그리고(패널 전체를 다시 그리면 슬라이더가 끊겨서 드래그가 튕김),
// 손을 뗀 순간(change)에만 저장한다.
document.addEventListener('input', e => {
  const el = e.target;
  if (!el || el.dataset.a !== 'sethue') return;
  const key = el.dataset.v === 'top' ? 'pTopHue' : el.dataset.v === 'bottom' ? 'pBottomHue' : el.dataset.v === 'hair' ? 'pHairHue' : el.dataset.v === 'face' ? 'pFaceHue' : null;
  if (!key || !CFG.look) return;
  CFG.look[key] = +el.value;
  if (typeof charPreviewCanvas === 'function') charPreviewCanvas();
});
document.addEventListener('change', e => {
  const el = e.target;
  if (!el || el.dataset.a !== 'sethue') return;
  saveCfg();
});
// 내가 그린 헤어/상의/하의/소품 그림을 폰에서 바로 불러와 추가하는 기능
// (파일 선택 -> 정사각형 1024px 캔버스에 맞춰 리사이즈(투명 배경 유지) -> data: URL로 저장 -> 바로 그 그림을 선택 상태로)
document.addEventListener('change', e => {
  const el = e.target;
  if (!el || el.id !== 'pngFileInput') return;
  const file = el.files && el.files[0];
  el.value = '';
  if (!file) return;
  const cat = (panel && panel.pngsub) || 'hair';
  const reader = new FileReader();
  reader.onload = () => {
    const im = new Image();
    im.onload = () => {
      const SZ = 512;
      const cv = document.createElement('canvas'); cv.width = SZ; cv.height = SZ;
      const cx = cv.getContext('2d');
      const scale = Math.min(SZ / im.naturalWidth, SZ / im.naturalHeight);
      const dw = im.naturalWidth * scale, dh = im.naturalHeight * scale;
      cx.drawImage(im, (SZ - dw) / 2, (SZ - dh) / 2, dw, dh);
      let durl; try { durl = cv.toDataURL('image/png'); } catch (e) { toast(t('importFail2')); return; }
      const idx = HUM.saveCustomPart(cat, durl);
      const key = cat === 'face' ? 'pFace' : cat === 'hair' ? 'pHair' : cat === 'top' ? 'pTop' : cat === 'bottom' ? 'pBottom' : 'pAcc';
      CFG.look = Object.assign({}, CFG.look, { [key]: 'c' + idx, _n: 0 });
      CFG.look = HUM.norm(CFG.look); delete CFG.look._n; saveCfg();
      SND.pop(); rerenderChar(); render(); toast(t('pngImportOk'));
    };
    im.onerror = () => toast(t('importFail2'));
    im.src = reader.result;
  };
  reader.onerror = () => toast(t('importFail2'));
  reader.readAsDataURL(file);
});
function handle(a, v, w) {
  const _xa = (typeof XACT !== 'undefined' && XACT) || (typeof window !== 'undefined' && window.XACT);
  if (_xa && _xa[a]) { _xa[a](v, w); return; }
  switch (a) {
    case 'close': closePanel(); break;
    case 'panelBack': panelBack(); break;
    case 'open': openPanel(Object.assign({ type: v }, w ? { tab: w } : {})); break;
    case 'pet': openPanel({ type: 'pet', pid: v }); break;
    case 'villager': openPanel({ type: 'villager', rid: v }); break;
    case 'back': openPanel({ type: 'pet', pid: v }); break;
    case 'mate': openPanel({ type: 'mate', pid: v }); break;
    case 'care': { const pa = World.petActor(v); if (pa) World.walkNear(Math.floor(pa.x), Math.floor(pa.y)); act({ t: w, pid: v }); break; }
    case 'sell': act({ t: 'sell', pid: v, cid: +w }); closePanel(); break;
    case 'breed': act({ t: 'breed', pid: v, mate: w }); openPanel({ type: 'pet', pid: v }); break;
    case 'house': act({ t: 'house', slot: +v }); break;
    case 'buy': openPanel({ type: 'market' }); break;
    case 'slot': openPanel({ type: 'slotkind' }); break;
    case 'food': act({ t: 'food', cat: v }); break;
    case 'kit': act({ t: 'kit', direct: !!(panel && panel.direct) }); break;
    case 'buyfood': act({ t: 'buyfood', line: v, tier: +w, direct: !!(panel && panel.direct) }); break;
    case 'buyhouse': act({ t: 'buyhouse', id: v, direct: !!(panel && panel.direct) }); break;
    case 'hcat': if (panel && panel.hcat !== v) openPanel(Object.assign({}, panel, { hcat: v })); break;
    case 'psort': { const cur = panel.psort || 'hunger'; if (cur === v) panel.prev = !panel.prev; else { panel.psort = v; panel.prev = false; } renderPanel(true); break; } // same tab again -> reverse
    case 'feedt': { const pa = World.petActor(v); if (pa) World.walkNear(Math.floor(pa.x), Math.floor(pa.y)); act({ t: 'feed', pid: v, tier: +w }); break; }
    case 'decor': act({ t: 'decor', id: v, direct: !!(panel && panel.direct) }); break;
    case 'up': act({ t: 'up', id: v }); break;
    case 'expand': act({ t: 'expand' }); break;
    case 'style': act({ t: 'style', id: v, st: w }); break;
    case 'claim': act({ t: 'claim', i: +v }); break;
    case 'fav': act({ t: 'fav', pid: v }); break;
    case 'wearpick': openPanel({ type: 'wear', pid: v }); break;
    case 'wearbuy': { const r = actR({ t: 'wearbuy', id: v }); if (r && r.ok) renderPanel(true); break; }
    case 'wearset': { actR({ t: 'wear', pid: panel.pid, id: v || null, slot: w }); renderPanel(true); break; }
    case 'farmtool': App.farmTool = v && v.startsWith('tool:') ? { tool: v.slice(5) } : v && v.startsWith('seed:') ? { seed: v.slice(5) } : null; render(); break;
    case 'fbuyseed': { actR({ t: 'fbuyseed', id: v, n: +w || 1 }); renderPanel(true); break; }
    case 'habclean': { actR({ t: 'habclean', iid: +v }); renderPanel(true); break; }
    case 'fsell': { actR({ t: 'fsell', id: v, n: +w || 1 }); renderPanel(true); break; }
    case 'fbuytool': { actR({ t: 'fbuytool', id: v }); renderPanel(true); break; }
    case 'fbuygood': { actR({ t: 'fbuygood', id: v, n: +w || 1 }); renderPanel(true); break; }
    case 'cafeserve': { const r = actR({ t: 'cafeserve', oid: +v }); if (r && r.ok) { SND.coin(); const ga = World.actors.get('cg' + v); if (ga) ga.served = true; } renderPanel(true); break; }
    case 'cafepanel': openPanel({ type: v }); break;
    case 'cafecookgo': { const r = actR({ t: 'cafecook', dish: v }); if (r && r.ok) { SND.coin(); fxAt(innerWidth / 2, innerHeight / 2, (CAFE_DISHES.find(d => d.id === v) || {}).icon || '🍳'); } renderPanel(true); break; }
    case 'cafeup': { const r = actR({ t: 'cafeup' }); if (r && r.ok) { SND.level(); fxAt(innerWidth / 2, innerHeight / 2, '⬆️'); } renderPanel(true); break; }
    case 'mcat': if (panel && panel.cat !== v) openPanel(Object.assign({}, panel, { cat: v })); break;
    case 'stab': if (panel && panel.tab !== v) openPanel(Object.assign({}, panel, { tab: v })); break;
    case 'heart': if (Net.mode !== 'solo') { act({ t: 'heart' }); fxAt(innerWidth / 2, innerHeight / 2, '💕'); SND.love(); } else openPanel({ type: 'coop' }); break;
    case 'quickgo': if (v === 'train') { if (World.focusTrain) World.focusTrain(); openPanel({ type: 'train' }); break; }
      if (v === 'ranch' && LAY('ranch')) { const L0 = LAY('ranch'); World.cam.follow = false; World.cam.x = ISO.wx(L0.x + 6, L0.y + 5); World.cam.y = ISO.wy(L0.x + 6, L0.y + 5); openPanel({ type: 'ranch' }); break; }
      if (v !== 'shop' && !LAY(v)) { toast(t('tNotBuiltYet', { b: t('tk_' + v) })); openPanel({ type: 'tbuild', tab: 'big' }); break; } if (v === 'shop') { World.center(); openPanel({ type: 'shop', tab: 'room' }); } else if (v === 'cafe') { World.focusCafe(); if (S.cafe && S.cafe.built) openPanel({ type: 'cafe' }); else toast(repTier(S.rep || 0) >= CAFE_UNLOCK_TIER ? t('cafeReadyMsg') : t('cafeLockedMsg')); } else if (v === 'farm') { World.focusFarm(); openPanel({ type: 'farm' }); } else { World.focusHosp(); if (S.hosp && S.hosp.built) openPanel({ type: 'hosp' }); else toast(repTier(S.rep || 0) >= HOSP_UNLOCK_TIER ? t('bldNotBuilt') : t('hospNeedRep')); } break;
    case 'farmup': actR({ t: 'farmup' }); renderPanel(true); break;
    case 'buildcafe': { const r = actR({ t: 'buildcafe' }); if (r && r.ok) SND.level(); renderPanel(true); break; }
    case 'buildhosp': { const r = actR({ t: 'buildhosp' }); if (r && r.ok) SND.level(); renderPanel(true); break; }
    case 'fcoopbuy': case 'fcoopbuild': case 'fcoopup': case 'fcoopfeed': case 'fcoopegg': actR({ t: a }); renderPanel(true); break;
    case 'tocoop': { if (!(S.farm && S.farm.coop)) { toast(t('coopNone')); break; } const r = actR({ t: 'ftocoop', pid: +v }); if (r && r.ok) closePanel(); break; }
    case 'farmauto': actR({ t: 'farmauto', crop: v || null }); renderPanel(true); break;
    case 'farmhire': actR({ t: 'farmhire', role: v }); renderPanel(true); break;
    case 'farmstaffup': actR({ t: 'farmstaffup', sid: +v }); renderPanel(true); break;
    case 'farmfire': actR({ t: 'farmfire', sid: +v }); renderPanel(true); break;
    case 'cafehire': actR({ t: 'cafehire', role: v }); renderPanel(true); break;
    case 'cafestaffup': actR({ t: 'cafestaffup', sid: +v }); renderPanel(true); break;
    case 'cafefire': actR({ t: 'cafefire', sid: +v }); renderPanel(true); break;
    case 'shelterfeed': { const r = actR({ t: 'shelter_feed' }); if (r && r.ok) SND.feed && SND.feed(); renderPanel(true); break; }
    case 'shelterplay': { const r = actR({ t: 'shelter_play' }); if (r && r.ok) SND.love && SND.love(); renderPanel(true); break; }
    case 'shelterclean': { const r = actR({ t: 'shelter_clean' }); if (r && r.ok) SND.clean && SND.clean(); renderPanel(true); break; }
    case 'sheltertoshop': { const r = actR({ t: 'shelter_toshop', pid: +v }); if (r && r.ok) { SND.love && SND.love(); } renderPanel(true); break; }
    case 'shelteradopt': { const r = actR({ t: 'shelter_adopt', pid: +v }); if (r && r.ok) { SND.coin && SND.coin(); } renderPanel(true); break; }
    case 'zoofeed': {
      const r = actR({ t: 'zoo_feed', facility: v });
      if (r && r.ok) {
        if (typeof SND !== 'undefined' && SND.love) SND.love();
        closePanel();
        if (v === 'all' && World.focusZoo) World.focusZoo(13, 11, .52);
      }
      break;
    }
    case 'zoofeedanimal': {
      if (S.coins < 50) { toast(t('noCoins') || '코인이 부족합니다'); break; }
      S.coins -= 50;
      S.zoo = S.zoo || { visitors: 0, coins: 0, fed: {} };
      S.zoo.lastFed = Date.now();
      S.zoo.fed[v] = (S.zoo.fed[v] || 0) + 1;
      if (S.town) S.town.hap = Math.min(100, (S.town.hap || 75) + 2);
      if (typeof SND !== 'undefined' && SND.love) SND.love();
      const rawNm = t('zooPetName_' + v);
      const petName = (rawNm && !rawNm.startsWith('zooPetName_')) ? rawNm : v;
      toast(t('zooFeedAnimalSuccess', { name: petName }));
      closePanel();
      break;
    }
    case 'zoofocus': { const [dx, dy] = (v || '13,11').split(',').map(Number); closePanel(); if (World.focusZoo) World.focusZoo(dx, dy, dx === 13 && dy === 11 ? .52 : .82); break; }
    case 'zooticket': { const r = actR({ t: 'zoo_ticket' }); if (r && r.ok) { SND.coin && SND.coin(); } renderPanel(true); break; }
    case 'hospbuy': actR({ t: 'hospbuy', k: v }); if (!App.hospEdit) renderPanel(true); break;
    case 'hospdo': hospDo(+v); break;
    case 'stafftab': if (v === 'ranch') { if (S.ranch) openPanel({ type: 'ranch' }); else toast(t('stf_none')); break; } if (v === 'cafe' && !(S.cafe && S.cafe.built)) toast(t('stf_none')); else if (v === 'hosp' && !(S.hosp && S.hosp.built)) toast(t('stf_none')); else openPanel({ type: v === 'shop' ? 'staff' : v === 'cafe' ? 'cafestaff' : v === 'farm' ? 'farmstaff' : 'hospstaff' }); break;
    case 'hosptab': if (panel && panel.tab !== v) openPanel(Object.assign({}, panel, { tab: v })); break;
    case 'hosphire': actR({ t: 'hosphire', role: v }); renderPanel(true); break;
    case 'hospstaffup': actR({ t: 'hospstaffup', sid: +v }); renderPanel(true); break;
    case 'hospfire': actR({ t: 'hospfire', sid: +v }); renderPanel(true); break;
    case 'hmtap': hmTap(); break;
    case 'hcatp': if (panel && panel.hcat !== v) openPanel(Object.assign({}, panel, { hcat: v })); break;
    case 'hospedit': startHospEdit(null); break;
    case 'hospskin': actR({ t: 'hospskin', id: +v }); renderPanel(true); break;
    case 'hospdone': App.hospEdit = false; World.hospSel = null; World.center(); render(); break;
    case 'hosprot': if (World.hospSel != null) { actR({ t: 'hosprot', iid: World.hospSel }); render(); } break;
    case 'hosptrash': if (World.hospSel != null) { actR({ t: 'hospsell', iid: World.hospSel }); World.hospSel = null; render(); } break;
    case 'hospup': { const r = actR({ t: 'hospup' }); if (r && r.ok) { SND.level(); fxAt(innerWidth / 2, innerHeight / 2, '⬆️'); } renderPanel(true); break; }
    case 'cafebuy': actR({ t: 'cafebuy', k: v }); if (!App.cafeEdit) renderPanel(true); break;
    case 'ccat': if (panel && panel.ccat !== v) openPanel(Object.assign({}, panel, { ccat: v })); break;
    case 'cafeedit': startCafeEdit(null); break;
    case 'cafedone': App.cafeEdit = false; World.cafeSel = null; World.center(); render(); break;
    case 'cafetrash': if (World.cafeSel != null) { actR({ t: 'cafesell', iid: World.cafeSel }); World.cafeSel = null; render(); } break;
    case 'caferotate': if (World.cafeSel != null) { actR({ t: 'caferot', iid: World.cafeSel }); render(); } break;
    case 'edit': { // decorate whichever building the screen is looking at: the pet shop, the caf챕 or the hospital
      const c0 = World.cam, cen = (x, y, w, d) => Math.hypot(c0.x - ISO.wx(x + w / 2, y + d / 2), (c0.y - ISO.wy(x + w / 2, y + d / 2)) * 2) / ((w + d) * 16);
      const cand = [['shop', cen(0, 0, S.room.w, S.room.h)]];
      if (S.cafe && S.cafe.built) { const P = CAFE_POS(); cand.push(['cafe', cen(P.x, P.y, P.w, P.d)]); }
      if (S.hosp && S.hosp.built) { const P = HOSP_POS(); cand.push(['hosp', cen(P.x, P.y, P.w, P.d)]); }
      cand.sort((p, q) => p[1] - q[1]);
      if (cand[0][0] === 'cafe' && cand[0][1] < 1) { startCafeEdit(); break; }
      if (cand[0][0] === 'hosp' && cand[0][1] < 1) { startHospEdit(); break; }
      App.editing = true; World.editSel = null; closePanel(); render(); break; }
    case 'openNow': act({ t: 'openNow' }); break;
    case 'playpick': openPanel({ type: 'playpick', pid: v }); break;
    case 'playgo': { const pp = S.pets.find(x => x && x.id === v); if (!pp) break; const pa = World.petActor(v); if (pa) World.walkNear(Math.floor(pa.x), Math.floor(pa.y)); closePanel(); PLAY.start(w, pp.sp, sc => { act({ t: 'care', pid: v, kind: w, score: sc }); openPanel({ type: 'pet', pid: v }); }, pp.coat || ART.hashStr(pp.id)); break; }
    case 'mini': { if (w === 'toy') { runMini(v, 'toy', 1); break; } runMini(v, w, 0); break; } // v1.18: no difficulty picker for the feather toy
    case 'toygo': runMini(v, 'toy', +w); break;
    case 'trick': act({ t: 'trick', pid: v, cid: w ? +w : null }); break;
    case 'pen': act({ t: 'pen', pid: v }); break;
    case 'groomsvc': { const cu = S.customers.find(x => x.id === +v); if (!cu) break; closePanel(); MINI.start('brush', cu.vsp, sc => act({ t: 'groomsvc', cid: +v, score: sc })); break; }
    case 'letter': act({ t: 'readletter', lid: +v }); openPanel({ type: 'letter', lid: +v }); break;
    case 'icomment': { const lid = +v; askPrompt({ title: '💬 ' + t('ig_reply'), input: '', max: 100, okText: t('ig_send'), ok: val => { if (val && val.trim()) act({ t: 'icomment', lid, text: val }); openPanel({ type: 'letter', lid }); } }); break; }
    case 'ipost': { const pid = v; const pp = S.pets.find(x => x && x.id === pid); askPrompt({ title: '📸 ' + t('ig_caption'), input: t('ig_capDefault', { pet: pp ? pp.name : '' }), max: 120, okText: t('ig_share'), ok: val => { const r = actR({ t: 'ipost', pid, text: val || '' }); if (r && r.msg === 'igChDone') { SND.level && SND.level(); fxAt(innerWidth / 2, innerHeight / 2 - 60, '🔥'); } openPanel({ type: 'letters', tab: 'mine' }); } }); break; }
    case 'like': act({ t: 'likeletter', lid: +v }); SND.love(); break;
    case 'custsorry': { const cid = +v, ca = World.actors && World.actors.get('c' + cid); const r = actR({ t: 'custsorry', cid }); if (r && r.ok && ca) { ca.sadGo = 1; } closePanel(); break; }
    case 'likeall': { const r = actR({ t: 'likeall' }); if (r && r.ok) { SND.love(); fxAt(innerWidth / 2, innerHeight / 2 - 60, '❤️'); } renderPanel(true); break; }
    case 'restock': actR({ t: 'restock', iid: +v, prod: w }); renderPanel(true); break;
    case 'gcare': act({ t: 'gcare', gid: +v, what: w }); break;
    case 'bgm': CFG.bgm = CFG.bgm === false ? true : false; saveCfg(); SFX.bgm(CFG.bgm !== false); renderPanel(true); break;
    case 'nextday': act({ t: 'nextday' }); closePanel(); break;
    case 'adopt': startQuiz(+v); break;
    case 'qans': answerQuiz(+v); break;
    case 'reroll': act({ t: 'reroll' }); break;
    case 'habpanel': openPanel({ type: 'hab', slot: +v }); break;
    case 'habkind': act({ t: 'habkind', slot: +v, kind: w }); break;
    case 'slotkind': act({ t: 'slot', kind: v }); closePanel(); break;
    case 'checkout': checkoutCust(+v); break;
    case 'editdone': App.editing = false; World.editSel = null; render(); break;
    case 'move': App.moveMode = CFG.move = v; saveCfg(); renderPanel(true); render(); bindJoy(); break;
    case 'names': App.showNames = !App.showNames; renderPanel(true); break;
    case 'release': { const p = S.pets.find(x => x && x.id === v); if (!p) break; askPrompt({ title: t('release'), text: t('releaseConfirm', { name: p.name }), ok: () => act({ t: 'release', pid: v }) }); break; }
    case 'rename': { const p = S.pets.find(x => x && x.id === v); if (!p) break; askPrompt({ title: t('rename'), input: p.name, max: 12, okText: t('save'), ok: val => { act({ t: 'rename', pid: v, name: val }); openPanel({ type: 'pet', pid: v }); } }); break; }
    case 'pok': { const m = panel; const i = $('#pin'); const val = i ? i.value : null; closePanel(); if (m && m.ok) m.ok(val); break; }
    case 'lang': CFG.lang = v; if (S) { S.lang = v; if (v === 'ru') translateKoreanNames(S); else if (v === 'ko') translateRussianNames(S); save(); } saveCfg(); renderPanel(true); render(); break;
    case 'mute': CFG.mute = !CFG.mute; saveCfg(); renderPanel(true); break;
    case 'charedit': openPanel({ type: 'welcome', step: 'edit' }); break;
    case 'closeAsk': askPrompt({ title: '🔒 ' + t('closeShopBtn'), text: t('closeConfirm'), okText: t('closeShopBtn'), ok: () => act({ t: 'closeNow' }) }); break;
    case 'ctab': panel.ctab = v; rerenderChar(); { const pb = $('#panel .pb'), cp = $('.cstick'); if (pb && cp && pb.scrollTop > cp.offsetTop) pb.scrollTop = cp.offsetTop; } break;
    case 'cmood': panel.cmood = v; rerenderChar(); break;
    case 'look': {
      const NUM = ['eyes', 'glasses', 'fshape', 'nose', 'brow', 'mouth', 'print', 'bw', 'ht'], L0 = CFG.look;
      if (v === 'bottom') { if (w === 'skirt') L0.skirt = L0.skirtc || '#f2c14e'; else { if (L0.skirt) L0.skirtc = L0.skirt; L0.skirt = null; } }
      else if (w === '__none') L0[v] = null;
      else if (w === '__t') L0[v] = L0[v] ? (v === 'mole' ? 0 : false) : (v === 'mole' ? 1 : true);
      else if (NUM.includes(v)) L0[v] = +w;
      else L0[v] = w;
      if (v === 'skirt') L0.skirtc = w;
      CFG.look = HUM.norm(Object.assign({}, L0, { _n: 0 })); delete CFG.look._n; saveCfg();
      rerenderChar(); break;
    }
    case 'setswatch': {
  const key = v === 'top' ? 'pTopHue' : v === 'bottom' ? 'pBottomHue' : v === 'hair' ? 'pHairHue' : null;
  if (!key) break;
  // 잠금 검증
  const swIdx = COLOR_SWATCHES.findIndex(s => s.v === +w);
  if (swIdx >= 0) {
    const needLv = COLOR_UNLOCK_LV[swIdx] || 0;
    const curVal = CFG.look[key] || 0;
    if (needLv > 0 && S.level < needLv && curVal !== +w) {
      toast('🔒 ' + (CFG.lang === 'ru' ? `Уровень ${needLv}` : `레벨 ${needLv}에 해금`));
      break;
    }
  }
  CFG.look = Object.assign({}, CFG.look, { [key]: +w });
  saveCfg(); SND.pop(); rerenderChar(); render(); break;
}
    case 'rotprev': {
      const cur = (panel && panel.prevDirIdx) || 0;
      panel.prevDirIdx = ((cur + (+v)) % 4 + 4) % 4;
      charPreviewCanvas();
      const lbl = $('#cdirLabel'); if (lbl) lbl.textContent = t(DIR_CYCLE_KEYS[panel.prevDirIdx]);
      break;
    }
    case 'pngsub': if (panel && panel.pngsub !== v) openPanel(Object.assign({}, panel, { pngsub: v })); break;
    case 'setpart': {
  const key = v === 'face' ? 'pFace' : v === 'hair' ? 'pHair' : v === 'top' ? 'pTop' : v === 'bottom' ? 'pBottom' : 'pAcc';
  const val = w === '' ? null : (typeof w === 'string' && w.charAt(0) === 'c') ? w : +w;
  // 잠금 검증 (커스텀 파츠 'c0' 등은 제외)
  if (typeof val === 'number' && val >= 1 && val <= 15) {
    const needLv = PART_UNLOCK_LV[val - 1] || 1;
    const curVal = CFG.look[key];
    if ((S?.level || 1) < needLv && curVal !== val) {
      toast('🔒 ' + t('locked', { n: needLv }));
      break;
    }
  }
  CFG.look = Object.assign({}, CFG.look, { [key]: val, _n: 0 });
  CFG.look = HUM.norm(CFG.look); delete CFG.look._n; saveCfg();
  SND.pop(); rerenderChar(); render(); break;
}
    case 'pngimport': { const fi = $('#pngFileInput'); if (fi) fi.click(); break; }
    case 'charsave': CFG.name = ($('#wname').value || CFG.name).trim().slice(0, 12); saveCfg(); closePanel(); render(); break;
    case 'setshop': askPrompt({ title: t('shopName'), input: S.shop, max: 20, okText: t('save'), ok: val => act({ t: 'shopname', name: val }) }); break;
    case 'export': { const code = btoa(unescape(encodeURIComponent(JSON.stringify(Net.mode === 'guest' ? loadOwnSave() : S)))); try { navigator.clipboard.writeText(code).then(() => toast(t('copied')), () => askPrompt({ title: t('exportSave'), input: code, ok: () => { } })); } catch (e) { askPrompt({ title: t('exportSave'), input: code, ok: () => { } }); } break; }
    case 'import': askPrompt({ title: t('importSave'), text: t('importPrompt'), input: '', max: 500000, ok: val => { const prev = S; try { const raw = JSON.parse(decodeURIComponent(escape(atob(val.trim())))); if (!raw || !raw.pets) throw 0; S = raw; const s = G.migrate(raw); if (Net.mode === 'guest') leaveHost(); S = s; save(); lastEv = maxEv(S); World.reset(); toast(t('importOk')); render(); } catch (e) { S = prev; toast(t('importFail')); } } }); break;
    case 'hold': { const p = S.pets.find(x => x && x.id === v); if (!p) break; closePanel(); const pa = World.petActor(v); const go = () => { App.carry = { pid: p.id, sp: p.sp, coat: p.coat || ART.hashStr(p.id), kind: G.kindOf(p.sp) }; SND.love(); toast('🤗 ' + t('carryHint2', { name: p.name })); render(); }; if (pa) World.walkNear(Math.floor(pa.x), Math.floor(pa.y), go); else go(); break; }
    case 'hire': act({ t: 'hire', role: v }); renderPanel(true); break;
    case 'staffup': act({ t: 'staffup', key: v }); renderPanel(true); break;
    case 'fire': { const nm = ((S.staff || {})[v] || {}).name; askPrompt({ title: t('fireBtn'), text: t('fireConfirm', { n: nm }), ok: () => { act({ t: 'fire', key: v }); openPanel({ type: 'staff' }); } }); break; }
    case 'rot': World.rotate(+v); CFG.rot = VIEW.r; saveCfg(); SND.pop(); break;
    case 'putdown': App.carry = null; render(); break;
    case 'newstart': askPrompt({ title: '🌱 ' + t('newStart'), text: t('newStartConfirm'), okText: t('newStart'), ok: () => askPrompt({ title: '⚠️ ' + t('newStart'), text: t('newStartConfirm2'), okText: t('yes'), cancel: t('no'), ok: () => {
      RESETTING = true; try { if (Net.mode === 'host') stopHost(); if (Net.mode === 'guest') leaveHost(); } catch (e) { }
      try { Object.keys(localStorage).filter(k => k.startsWith('ps.')).forEach(k => localStorage.removeItem(k)); } catch (e) { }
      S = null; setTimeout(() => location.reload(), 50); } }) }); break;
    case 'host': if (!startHost()) toast(t('serverFail')); renderPanel(true); break;
    case 'stophost': stopHost(); render(); renderPanel(true); break;
    case 'search': panel.phase = 'search'; renderPanel(true); discover(r => { if (!panel || panel.type !== 'coop') return; if (r) { panel.phase = 'found'; panel.found = r; } else panel.phase = 'fail'; renderPanel(true); }); break;
    case 'joinfound': joinHost(panel.found.ip, panel.found.name); renderPanel(true); break;
    case 'manual': askPrompt({ title: t('manualIp'), input: CFG.hostIp || (myIp() ? myIp().split('.').slice(0, 3).join('.') + '.' : ''), num: true, max: 40, okText: t('connect'), ok: val => { if (val && val.trim()) { joinHost(val.trim(), val.trim()); openPanel({ type: 'coop' }); } } }); break;
    case 'leave': leaveHost(); renderPanel(true); break;
    case 'wlang': CFG.lang = v; saveCfg(); openPanel({ type: 'welcome', step: 'char' }); break;
    case 'wstart': {
      CFG.name = ($('#wname').value || t('defaultPlayer')).trim().slice(0, 12); saveCfg();
      S = G.newState(($('#wshop').value || t('defaultShop')).trim().slice(0, 20), CFG.name);
      lastEv = 0; save(); closePanel(); SND.level(); start(); break;
    }
  }
}
// joystick binding
function bindJoy() {
  setTimeout(() => {
    const j = $('#joy'); if (!j || j._b) return; j._b = 1;
    const k = j.querySelector('i'); let id = null;
    const mv = e => { const r = j.getBoundingClientRect(); let dx = (e.clientX - r.left - r.width / 2) / (r.width / 2), dy = (e.clientY - r.top - r.height / 2) / (r.height / 2); const l = Math.hypot(dx, dy); if (l > 1) { dx /= l; dy /= l; } World.joy.dx = dx; World.joy.dy = dy; k.style.transform = `translate(${dx * 34}px,${dy * 34}px)`; };
    j.addEventListener('pointerdown', e => { id = e.pointerId; j.setPointerCapture(id); World.joy.on = true; mv(e); e.stopPropagation(); });
    j.addEventListener('pointermove', e => { if (e.pointerId === id) mv(e); });
    const up = () => { id = null; World.joy.dx = World.joy.dy = 0; k.style.transform = ''; if (World.me) World.me.moving = false; };
    j.addEventListener('pointerup', up); j.addEventListener('pointercancel', up);
  }, 50);
}
new MutationObserver(() => { bindJoy(); }).observe(document.getElementById('ui'), { childList: true, subtree: true });

// Android hooks
window.onNativeBack = () => {
  if (panel && panel.type !== 'welcome') { closePanel(); return; }
  if (App.editing) { App.editing = false; if (typeof Home !== 'undefined') Home.sel = null; render(); return; }
  if (App.scene === 'home') { Home.leave(); return; }
  askPrompt({ title: t('exitConfirm'), okText: t('yes'), cancel: t('no'), ok: () => { save(); try { Native.exitApp(); } catch (e) { } } });
};
// v9.69: the WebView keeps running JS in the background (MainActivity doesn't pauseTimers), so the game kept ticking --
// pets got hungry / stressed while the app was put away. Now a paused/hidden app does NOT tick; on resume catchUp()
// only advances the non-pet timers (pets stay exactly as they were) and hands out the welcome-back gift.
let appPaused = false;
window.onNativePause = () => { appPaused = true; if (S) S.lastTick = Date.now(); save(); };
window.onNativeResume = () => { appPaused = false; if (S && Net.mode !== 'guest') { G.catchUp(S); render(); if (!panel && S.x && S.x.gift) openPanel({ type: 'gift' }); } };
// v9.77: Android calls these straight into the page -- guard them so a failure shows WHERE it happened (not just "Script error.")
['onNativeBack', 'onNativePause', 'onNativeResume'].forEach(k => { if (window.__guard && window[k]) window[k] = window.__guard(window[k], k); });

// ---------- main ----------
let started = false, tickN = 0;
function start() {
  if (started) return; started = true;
  if (S) {
    if (!S.lang) S.lang = CFG.lang;
    if (CFG.lang === 'ru' || S.lang === 'ru') translateKoreanNames(S);
    else if (CFG.lang === 'ko' || S.lang === 'ko') translateRussianNames(S);
  }
  const kick = () => { if (typeof SFX !== 'undefined') SFX.bgm(CFG.bgm !== false); };
  ['pointerdown', 'touchstart', 'mousedown', 'click'].forEach(evt => addEventListener(evt, kick, { once: true, capture: true }));
  World.init($('#cv'), onWorldTap);
  render(); bindJoy();
  setInterval(() => {
    if (!S) return;
    // put away: freeze. v9.74: a co-op HOST used to keep ticking too -- and hosting switches itself back on at every launch
    // once used, so on that phone the pets went hungry in the background. Now only while a partner is really connected.
    if ((appPaused || document.hidden) && !(Net.mode === 'host' && Object.keys(Net.players).some(id => id !== CFG.id))) return;
    if (Net.mode !== 'guest') { G.tick(S, 1); processEvents(); }
    render();
    if (++tickN % 5 === 0) save();
  }, 1000);
  document.addEventListener('visibilitychange', () => { if (document.hidden) { if (S) S.lastTick = Date.now(); save(); } else if (S && Net.mode !== 'guest' && !appPaused) { G.catchUp(S); render(); } });
  if (CFG.coop === 'host') setTimeout(() => startHost(), 400);
  else if (CFG.coop === 'guest' && CFG.hostIp) setTimeout(() => joinHost(CFG.hostIp, CFG.hostIp), 400);
}
function welcomeCanvas() {
  const cv = $('#wcv'); if (!cv) return; const c = cv.getContext('2d'); cv.width = 600; cv.height = 260; c.scale(2, 2);
  let tt = 0; const loop = () => { if (!$('#wcv')) return; tt += .03; c.clearRect(0, 0, 300, 130);
    [['pomeranian', 60], ['kitten', 150], ['hollandlop', 240]].forEach(([sp, x], i) => { c.save(); c.translate(x, 112); c.scale(1.6, 1.6); ART.pet(c, sp, { t: tt + i, happy: Math.sin(tt + i) > .5 }); c.restore(); });
    requestAnimationFrame(loop); }; loop();
}
// 캐릭터 미리보기: <img src=toDataURL()> 대신 캔버스에 직접 그림.
// (앱 안 WebView에서 로컬 PNG 레이어를 합성한 캔버스는 toDataURL()이 막혀서(tainted canvas)
//  예전엔 항상 기본 벡터 모습으로 굳어 보였음 -- 직접 그리면 이 문제가 아예 생기지 않음)
function charPreviewCanvas() {
  const cv = $('#cprevCv'); if (!cv) return;
  const c = cv.getContext('2d'); c.setTransform(1, 0, 0, 1, 0, 0); cv.width = 300; cv.height = 470;
  c.clearRect(0, 0, 300, 470); c.scale(2, 2);
  // v1.100.15: 프리뷰 박스 상단 빈 공간이 너무 커서(실측 결과) 캐릭터를 위로 당기고 캔버스 세로 크기를 줄임
  c.translate(75, 194); c.scale(2.25, 2.25);
  const curDir = DIR_CYCLE[(panel && panel.prevDirIdx) || 0] || 0;
  // v1.100.13: 미리보기 전용 - 그림자를 발보다 더 아래로 내려서(마지막 인자) 캐릭터가 원 안에 선 것처럼 보이게 함
  ART.human(c, CFG.look, curDir, 1.3, false, (panel && panel.cmood) || 'calm', undefined, undefined, 10);
}
// v9.74: the first launch of a new version tops every pet up once (fed + washed) -- older builds let pets starve in the background
function updateCare() {
  if (CFG.carev === APP_VER || !S || Net.mode === 'guest') return 0;
  CFG.carev = APP_VER; saveCfg(); let n = 0;
  // v9.75: EVERY pet gets full hunger + cleanliness and zero stress + boredom
  const all = S.pets.filter(Boolean).concat((S.home && S.home.pets) || []);
  for (const p of all) { if (!p || p.hunger == null) continue; p.hunger = 100; p.clean = 100; p.stress = 0; p.bored = 0; p.happy = 100; n++; }
  if (n) save(); return n;
}
function boot() {
  try {
    S = loadOwnSave();
    if (!CFG.lang || !S) { openPanel({ type: 'welcome', step: CFG.lang ? 'char' : 'lang' }); welcomeCanvas(); return; }
    const away = G.catchUp(S);
    lastEv = maxEv(S); G.tick(S, 0); processEvents();
    const cared = updateCare();
    start();
    if (cared) setTimeout(() => toast(t('updateCare', { n: cared })), 900);
    if (S.x && S.x.gift) openPanel({ type: 'gift' });
    else if (S.x && S.x.attend && S.x.attend.pending) openPanel({ type: 'quest', tab: 'attend' });
    else if (away >= 5 && S.pets.some(Boolean)) askPrompt({ title: t('offlineTitle'), text: t('offlineText', { m: away }), ok: () => { } });
  } catch (e) {
    if (window.__rep) window.__rep(e, 'boot');
    try { start(); } catch (e2) {}
  }
}
// boot() is called at the end of app2.js
