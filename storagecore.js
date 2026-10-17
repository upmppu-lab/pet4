// ================= v2026-10-17: 보관상자(STORAGE) — 전투 승리 보상으로 얻은 펫/가구/소품을 담아두는 50슬롯 창고 =================
// 마을게시판 바로 옆에 세워둔 상자. 전투에서 "상대 펫 데려오기"에 성공했을 때, 그리고 승리 보상(데려오기/
// 경험치/돈) 중 무엇을 고르든 추가로 뽑힐 수 있는 보너스 아이템(펫샵·내집·카페 가구, 캐릭터 소품)이
// 전부 여기 보관된다. 뽑기 추천권은 상자를 거치지 않고 즉시 지급된다.
const STORAGE_MAX = 50;
const STORAGE_BONUS_CHANCE = .65; // 승리 보상을 고를 때마다 추가로 보너스를 더 얻을 확률 (높게: 뭔가는 잘 나오지만, 좋은 건 귀하게)
const STORAGE = (() => {
  function ensure(s) { if (!s.storage) s.storage = []; return s.storage; }
  function push(s, entry) { // 자리가 가득 차면 false
    const arr = ensure(s);
    if (arr.length >= STORAGE_MAX) return false;
    entry.id = 'st' + Date.now() + Math.floor(Math.random() * 10000);
    arr.push(entry);
    return true;
  }
  const furnName = (cat, k) => {
    const pre = cat === 'petshop' ? 'd_' : cat === 'home' ? 'hf_' : 'cf_';
    const nm = (typeof t === 'function') ? t(pre + k) : k;
    return (nm && nm !== pre + k) ? nm : k;
  };
  const furnIcon = (cat, k) => {
    if (cat === 'petshop') { const d = (typeof DECOR !== 'undefined') ? DECOR.find(x => x.id === k) : null; return (d && d.icon) || '📦'; }
    return cat === 'home' ? '🏠' : '☕';
  };
  // 전투 승리 보상을 고른 뒤 추가로 뽑는 보너스 아이템. 뽑기 추천권이 가장 흔하고, 가구가 그 다음,
  // 캐릭터 소품(미보유 우선)이 가장 귀하다 -- "확률은 높게, 하지만 너무 쉽게 좋은 걸 가져오면 안 된다".
  function rollBonusItem(s) {
    if (Math.random() >= STORAGE_BONUS_CHANCE) return null;
    const r = Math.random();
    if (r < .45) { // 🎫 뽑기 추천권 - 가장 흔함, 상자 자리 없이 바로 지급
      s.x = s.x || {}; s.x.tickets = (s.x.tickets || 0) + 1;
      return { kind: 'ticket', name: '🎫 뽑기 추천권' };
    }
    if (r < .85) { // 🪑 가구 (펫샵 / 내집 / 카페 중 랜덤)
      const pool = [];
      if (typeof DECOR !== 'undefined') for (const d of DECOR) pool.push({ cat: 'petshop', k: d.id });
      if (typeof HOME_FURN !== 'undefined') for (const f of HOME_FURN) pool.push({ cat: 'home', k: f.k });
      if (typeof CAFE_FURN !== 'undefined') for (const f of CAFE_FURN) pool.push({ cat: 'cafe', k: f.k });
      if (!pool.length) return null;
      const f = pool[Math.floor(Math.random() * pool.length)];
      const name = furnName(f.cat, f.k), icon = furnIcon(f.cat, f.k);
      if (!push(s, { type: 'furn', furnCat: f.cat, furnK: f.k })) return null;
      return { kind: 'furn', name: icon + ' ' + name };
    }
    // 👕 캐릭터 소품 - 가장 귀함, 아직 갖고 있지 않은 소품을 우선으로 뽑는다
    if (typeof COSM_ALL === 'undefined' || !COSM_ALL.length) return null;
    s.x = s.x || {}; s.x.cosm = s.x.cosm || {};
    const unowned = COSM_ALL.filter(id => !s.x.cosm[id]);
    const pool = unowned.length ? unowned : COSM_ALL;
    const id = pool[Math.floor(Math.random() * pool.length)];
    const nm = (typeof COSM_DEF !== 'undefined' && COSM_DEF[id] && COSM_DEF[id].name) || id;
    if (!push(s, { type: 'acc', accId: id })) return null;
    return { kind: 'acc', name: '👕 ' + nm };
  }
  function apply(s, a, by) {
    if (!a.t || a.t.indexOf('storage') !== 0) return undefined;
    const arr = ensure(s);
    switch (a.t) {
      case 'storagePetToHome': {
        const i = arr.findIndex(e => e.id === a.id && e.type === 'pet'); if (i < 0) return { err: 'gone' };
        const h = HOME.ensure(s), cap = HOME.cap(h);
        if ((s.home.pets || []).length >= cap) return { err: 'homeFull' };
        s.home.pets = s.home.pets || [];
        s.home.pets.push(arr[i].pet);
        arr.splice(i, 1);
        return { ok: 1, msg: 'storageSentHome' };
      }
      case 'storagePetToShop': {
        const i = arr.findIndex(e => e.id === a.id && e.type === 'pet'); if (i < 0) return { err: 'gone' };
        s.pets = s.pets || [];
        s.pets.push(arr[i].pet);
        arr.splice(i, 1);
        return { ok: 1, msg: 'storageSentShop' };
      }
      case 'storagePlaceFurn': {
        const i = arr.findIndex(e => e.id === a.id && e.type === 'furn'); if (i < 0) return { err: 'gone' };
        const e = arr[i];
        let r;
        if (e.furnCat === 'petshop') r = (typeof G !== 'undefined') ? G.apply(s, { t: 'decorPlaceFree', id: e.furnK }, by) : null;
        else if (e.furnCat === 'home') r = HOME.apply(s, { t: 'hbuyFree', k: e.furnK, fl: 0 }, by);
        else if (e.furnCat === 'cafe') r = CAFE.apply(s, { t: 'cafebuyFree', k: e.furnK }, by);
        if (!r || r.err) return r || { err: 'gone' };
        arr.splice(i, 1);
        return r;
      }
      case 'storageRegisterAcc': {
        const i = arr.findIndex(e => e.id === a.id && e.type === 'acc'); if (i < 0) return { err: 'gone' };
        s.x = s.x || {}; s.x.cosm = s.x.cosm || {};
        s.x.cosm[arr[i].accId] = 1;
        arr.splice(i, 1);
        return { ok: 1, msg: 'storageAccOk' };
      }
    }
    return undefined;
  }
  return { ensure, push, rollBonusItem, furnName, furnIcon, apply };
})();
