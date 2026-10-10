// ================= v9.99: town life — villagers' houses in the empty land, a pet that follows the player, fishing at the lake =================
// ================= PET TOWN v1.0: what can be built in the town =================
// cat house: cap = residents it holds, need = best population ever reached before it unlocks, cost grows +COST_STEP per copy
// cat tree: grow = [days to young, days to grown], hap = happiness when grown (sapling 20%, young 50%)
// cat deco: small facilities; hap = happiness, sup = residents it can serve (crowding), max = copies that count
// v2026-10-08: 집을 8종류(오두막~대저택) + 레벨1~3 방식에서, 사용자가 새로 그린 12장짜리 그림
// (house_1.png ~ house_12.png)으로 이어지는 "티어 1~12" 사다리 하나로 통일함. 이제 놓을 수 있는
// 집 종류는 'cottage' 하나뿐이고(기존 세이브와의 호환을 위해 이름은 그대로 둠), 외형/수용인원은
// o.tier(1~12)가 결정함 -- 아래 HOUSE_TIERS 테이블 참고. tower~villa 7종은 기존 세이브에 남아있는
// 집을 깨뜨리지 않으려고 정의만 남겨두고(legacy:1), 새로 짓는 메뉴에서는 더 이상 보이지 않음
// (마이그레이션 함수가 불러오자마자 전부 cottage+적절한 tier로 바꿔줌).
const TOWN_DEF = {
  cottage: { cat: 'house', w: 5, d: 5, cap: 2, cost: 1500, need: 0, ic: '🏠' },
  tower: { cat: 'house', w: 5, d: 5, cap: 3, cost: 3500, need: 12, ic: '🏰', legacy: 1 },
  family: { cat: 'house', w: 5, d: 5, cap: 4, cost: 6000, need: 20, ic: '🏠', legacy: 1 },
  yard: { cat: 'house', w: 5, d: 5, cap: 4, cost: 8000, need: 30, ic: '🏡', legacy: 1 },
  barn: { cat: 'house', w: 5, d: 5, cap: 5, cost: 12000, need: 45, ic: '🛖', legacy: 1 },
  twostory: { cat: 'house', w: 5, d: 5, cap: 6, cost: 18000, need: 60, ic: '🏘️', legacy: 1 },
  row: { cat: 'house', w: 5, d: 5, cap: 9, cost: 32000, need: 90, ic: '🏘️', legacy: 1 },
  villa: { cat: 'house', w: 5, d: 5, cap: 16, cost: 60000, need: 130, ic: '🏢', legacy: 1 },
  sunflower: { cat: 'tree', flower: 1, w: 1, d: 1, cost: 120, grow: [1, 1], hap: .1, ic: '🌻' },
  tulip: { cat: 'tree', flower: 1, w: 1, d: 1, cost: 150, grow: [1, 1], hap: .1, ic: '🌷' },
  rose: { cat: 'tree', flower: 1, w: 1, d: 1, cost: 220, grow: [1, 2], hap: .12, ic: '🌹' },
  lavender: { cat: 'tree', flower: 1, w: 1, d: 1, cost: 140, grow: [1, 1], hap: .1, ic: '🪻' },
  daisy: { cat: 'tree', flower: 1, w: 1, d: 1, cost: 130, grow: [1, 1], hap: .1, ic: '🌼' },
  cosmos: { cat: 'tree', flower: 1, w: 1, d: 1, cost: 160, grow: [1, 1], hap: .11, ic: '🌸' },
  hydrangea: { cat: 'tree', flower: 1, w: 1, d: 1, cost: 180, grow: [1, 2], hap: .12, ic: '💠' },
  lily: { cat: 'tree', flower: 1, w: 1, d: 1, cost: 200, grow: [1, 2], hap: .12, ic: '⚜️' },
  hibiscus: { cat: 'tree', flower: 1, w: 1, d: 1, cost: 240, grow: [1, 2], hap: .13, ic: '🌺' },
  pine: { cat: 'tree', w: 1, d: 1, cost: 250, grow: [1, 3], hap: .15, ic: '🌲' },
  evergreen: { cat: 'tree', w: 1, d: 1, cost: 320, grow: [1, 3], hap: .2, ic: '🌲' },
  bamboo: { cat: 'tree', w: 1, d: 1, cost: 320, grow: [1, 2], hap: .18, ic: '🎍' },
  cherry: { cat: 'tree', w: 1, d: 1, cost: 350, grow: [1, 3], hap: .2, ic: '🌸' },
  maple: { cat: 'tree', w: 1, d: 1, cost: 350, grow: [1, 3], hap: .2, ic: '🍁' },
  ginkgo: { cat: 'tree', w: 1, d: 1, cost: 360, grow: [1, 3], hap: .2, ic: '🍂' },
  willow: { cat: 'tree', w: 1, d: 1, cost: 380, grow: [1, 3], hap: .22, ic: '🌿' },
  palm: { cat: 'tree', w: 1, d: 1, cost: 400, grow: [2, 3], hap: .22, ic: '🌴' },
  peach: { cat: 'tree', w: 1, d: 1, cost: 420, grow: [2, 4], hap: .24, ic: '🍑' },
  orange: { cat: 'tree', w: 1, d: 1, cost: 440, grow: [2, 4], hap: .25, ic: '🍊' },
  apple: { cat: 'tree', w: 1, d: 1, cost: 450, grow: [2, 4], hap: .25, ic: '🍎' },
  oaktree: { cat: 'tree', w: 1, d: 1, cost: 420, grow: [2, 4], hap: .23, ic: '🌳' },
  sakuratree: { cat: 'tree', w: 1, d: 1, cost: 380, grow: [1, 3], hap: .2, ic: '🌸' },
  bench: { cat: 'deco', w: 1, d: 1, cost: 800, hap: .25, sup: 2, max: 8, ic: '🪑', solid: 1 },
  lamp: { cat: 'deco', w: 1, d: 1, cost: 1200, hap: .25, sup: 1, max: 8, ic: '🏮', solid: 1 },
  busstop: { cat: 'deco', w: 2, d: 1, cost: 12000, hap: .6, sup: 8, max: 2, ic: '🚏', solid: 1, need: 12 },
  fountain: { cat: 'deco', w: 2, d: 2, cost: 15000, hap: .8, sup: 10, max: 3, ic: '⛲', solid: 1, need: 20 },
  playground: { cat: 'deco', w: 3, d: 3, cost: 25000, hap: 1.0, sup: 15, max: 3, ic: '🛝', solid: 1, need: 30 },
  // v1.24: many more decorations -- monuments, garden bits, street furniture
  fence: { cat: 'deco', w: 1, d: 1, cost: 120, hap: .1, sup: 0, max: 40, ic: '🪵', solid: 1 },
  hedge: { cat: 'deco', w: 1, d: 1, cost: 180, hap: .12, sup: 0, max: 40, ic: '🌿', solid: 1 },
  flowerbed: { cat: 'deco', w: 2, d: 1, cost: 600, hap: .2, sup: 1, max: 12, ic: '🌺', solid: 1 },
  signpost: { cat: 'deco', w: 1, d: 1, cost: 500, hap: .15, sup: 0, max: 6, ic: '🪧', solid: 1 },
  mailbox: { cat: 'deco', w: 1, d: 1, cost: 700, hap: .15, sup: 1, max: 6, ic: '📮', solid: 1 },
  topiary: { cat: 'deco', w: 1, d: 1, cost: 1500, hap: .25, sup: 1, max: 8, ic: '🐇', solid: 1 },
  stonelamp: { cat: 'deco', w: 1, d: 1, cost: 1800, hap: .25, sup: 1, max: 8, ic: '🏮', solid: 1 },
  flagpole: { cat: 'deco', w: 1, d: 1, cost: 2000, hap: .3, sup: 1, max: 4, ic: '🚩', solid: 1, need: 8 },
  picnic: { cat: 'deco', w: 2, d: 1, cost: 2500, hap: .35, sup: 2, max: 6, ic: '🧺', solid: 1, need: 8 },
  phonebooth: { cat: 'deco', w: 1, d: 1, cost: 3000, hap: .35, sup: 2, max: 3, ic: '☎️', solid: 1, need: 10 },
  well: { cat: 'deco', w: 1, d: 1, cost: 3500, hap: .4, sup: 2, max: 3, ic: '🪣', solid: 1, need: 10 },
  dogstatue: { cat: 'deco', w: 1, d: 1, cost: 4000, hap: .45, sup: 2, max: 3, ic: '🐕', solid: 1, need: 12 },
  catstatue: { cat: 'deco', w: 1, d: 1, cost: 4000, hap: .45, sup: 2, max: 3, ic: '🐈', solid: 1, need: 12 },
  sandbox: { cat: 'deco', w: 2, d: 2, cost: 4500, hap: .45, sup: 4, max: 3, ic: '🏖️', solid: 1, need: 15 },
  heartarch: { cat: 'deco', w: 2, d: 1, cost: 5000, hap: .5, sup: 2, max: 3, ic: '💗', solid: 1, need: 15 },
  pond: { cat: 'deco', w: 2, d: 2, cost: 6000, hap: .55, sup: 4, max: 3, ic: '🦆', solid: 1, need: 18 },
  monument: { cat: 'deco', w: 1, d: 1, cost: 8000, hap: .65, sup: 3, max: 2, ic: '🗿', solid: 1, need: 22 },
  gazebo: { cat: 'deco', w: 2, d: 2, cost: 10000, hap: .75, sup: 6, max: 2, ic: '⛩️', solid: 1, need: 25 },
  windmill: { cat: 'deco', w: 2, d: 2, cost: 18000, hap: .9, sup: 8, max: 1, ic: '🌬️', solid: 1, need: 35 },
  goldstatue: { cat: 'deco', w: 2, d: 2, cost: 40000, hap: 1.5, sup: 12, max: 1, ic: '🏆', solid: 1, need: 60 },
  pet_fountain: { cat: 'deco', w: 2, d: 2, cost: 7000, hap: .7, sup: 6, max: 3, ic: '⛲', solid: 1, need: 16 },
  pet_statue_hero: { cat: 'deco', w: 1, d: 1, cost: 9000, hap: .8, sup: 5, max: 2, ic: '🐕‍🦺', solid: 1, need: 20 },
  flower_tunnel: { cat: 'deco', w: 3, d: 2, cost: 11000, hap: .9, sup: 8, max: 2, ic: '🌺', solid: 1, need: 24 },
  camping_zone: { cat: 'deco', w: 3, d: 3, cost: 16000, hap: 1.1, sup: 10, max: 2, ic: '⛺', solid: 1, need: 30 }
};
// Image loader for user-provided artwork tree PNGs (spr/tree_oak.png, spr/tree_sakura.png, spr/tree_evergreen.png)
const TOWN_TREE_IMG = {};
function getTownTreeImg(key) {
  let im = TOWN_TREE_IMG[key];
  if (im) return im;
  const url = assetUrl('spr/' + key + '.png');
  im = (typeof ASSET_CACHE !== 'undefined') ? ASSET_CACHE.load(url) : new Image();
  im.crossOrigin = 'anonymous';
  TOWN_TREE_IMG[key] = im;
  // ★ PNG 로드 완료 시 썸네일 캐시 무효화 + 패널 다시 그리기
  const onReady = () => {
    if (typeof TOWNUI !== 'undefined' && TOWNUI.clearThumbCache) TOWNUI.clearThumbCache();
    if (typeof renderPanel === 'function' && typeof panel !== 'undefined' && panel && panel.type === 'tbuild') renderPanel(true);
    if (typeof render === 'function') render();
  };
  if (im.complete && im.naturalWidth) {
    // already loaded/cached
  } else {
    im.addEventListener('load', onReady);
    if (!im.src) im.src = url;
  }
  return im;
}
// v2026-10-08: 집 티어 그림 로더 (spr/house/house_1.png ~ house_12.png) -- getTownTreeImg와 똑같은 방식
const TOWN_HOUSE_IMG = {};
function getTownHouseImg(tier) {
  let im = TOWN_HOUSE_IMG[tier];
  if (im) return im;
  const url = assetUrl('spr/house/house_' + tier + '.png');
  im = (typeof ASSET_CACHE !== 'undefined') ? ASSET_CACHE.load(url) : new Image();
  im.crossOrigin = 'anonymous';
  TOWN_HOUSE_IMG[tier] = im;
  const onReady = () => {
    if (typeof TOWNUI !== 'undefined' && TOWNUI.clearThumbCache) TOWNUI.clearThumbCache();
    if (typeof renderPanel === 'function' && typeof panel !== 'undefined' && panel && panel.type === 'tbuild') renderPanel(true);
    if (typeof render === 'function') render();
  };
  if (im.complete && im.naturalWidth) {
    // already loaded/cached
  } else {
    im.addEventListener('load', onReady);
    if (!im.src) im.src = url;
  }
  return im;
}
// v2026-10-08: 집 티어(1~12) 테이블 -- 사용자가 그린 house_1.png(초라함) ~ house_12.png(대저택)에 맞춰
// 수용인원(cap)이 늘어나고, 다음 티어로 올리려면 "레벨(lvl) + 마을 인구(pop) + 코인(cost)"이 전부 필요함
// (돈만 있다고 바로 업그레이드되지 않도록). index 1 = 시작 티어(조건 없음), index 12 = 최고 티어.
const HOUSE_TIER_MAX = 12;
const HOUSE_TIERS = [null,
  { cap: 2, cost: 0, lvl: 1, pop: 0 },
  { cap: 3, cost: 2500, lvl: 2, pop: 6 },
  { cap: 4, cost: 5000, lvl: 3, pop: 12 },
  { cap: 5, cost: 9000, lvl: 4, pop: 18 },
  { cap: 6, cost: 15000, lvl: 6, pop: 26 },
  { cap: 8, cost: 24000, lvl: 8, pop: 36 },
  { cap: 10, cost: 36000, lvl: 10, pop: 48 },
  { cap: 12, cost: 52000, lvl: 13, pop: 62 },
  { cap: 14, cost: 72000, lvl: 16, pop: 78 },
  { cap: 17, cost: 98000, lvl: 19, pop: 96 },
  { cap: 20, cost: 130000, lvl: 23, pop: 116 },
  { cap: 24, cost: 170000, lvl: 27, pop: 140 },
];
const tierOf = o => Math.min(HOUSE_TIER_MAX, o.tier || 1);
const houseCapOf = o => HOUSE_TIERS[tierOf(o)].cap;
const houseNextReq = o => { const nt = tierOf(o) + 1; return nt > HOUSE_TIER_MAX ? null : HOUSE_TIERS[nt]; };
const canUpHouse = o => !!houseNextReq(o);

const HOUSE_TIER_NAMES = [
  null,
  '오두막',
  '시골집',
  '단층 주택',
  '농가',
  '마당집',
  '가족집',
  '2층집',
  '벽돌집',
  '연립주택',
  '모던 빌라',
  '고급 주택',
  '대저택'
];
const HOUSE_TIER_NAMES_RU = [
  null,
  'Хижина',
  'Сельский дом',
  'Одноэтажный дом',
  'Фермерский дом',
  'Дом с двором',
  'Семейный дом',
  'Двухэтажный дом',
  'Кирпичный дом',
  'Таунхаус',
  'Современная вилла',
  'Элитный дом',
  'Особняк'
];
function houseTierName(tier) {
  const t = Math.max(1, Math.min(HOUSE_TIER_MAX, tier | 0));
  const isRu = (typeof LANG !== 'undefined' && LANG === 'ru') || (typeof I18N !== 'undefined' && I18N.cur === 'ru');
  return isRu ? HOUSE_TIER_NAMES_RU[t] : HOUSE_TIER_NAMES[t];
}
function houseTierBuyCost(s, tier) {
  if (typeof TOWN !== 'undefined' && TOWN.houseTierBuyCost) return TOWN.houseTierBuyCost(s, tier);
  const t = Math.max(1, Math.min(HOUSE_TIER_MAX, tier | 0));
  const baseCost = (typeof TOWN !== 'undefined' && TOWN.kindCost) ? TOWN.kindCost(s, 'cottage') : ((TOWN_DEF.cottage && TOWN_DEF.cottage.cost) || 1200);
  let extra = 0;
  for (let i = 2; i <= t; i++) {
    extra += (HOUSE_TIERS[i] ? HOUSE_TIERS[i].cost : 0);
  }
  return baseCost + extra;
}
// (houseUpOk/nextHouseSlotLevel/canPlaceNewHouse는 houses_/pop/S에 접근해야 해서, 그것들이 정의된
// TOWN IIFE 안쪽으로 옮김 -- 아래 houses_ 근처 참고)
// PET TOWN phase 2: the big buildings are placed from the build menu too (nothing exists at the start). w/d = the lot at the
// building's BIGGEST size (it grows inside it). act = the module's own build action (it takes the coins and checks its rules).
// live = has customers/staff inside, so it can only be moved while the shops are closed. noPlace = no lot to choose (along the main street).
Object.assign(TOWN_DEF, {
  farm: { cat: 'big', w: FARM_LOT.w, d: FARM_LOT.d, cost: 3000, ic: '🌾' },
  home: { cat: 'big', w: 10, d: 8, cost: 5000, ic: '🏡' },
  cafe: { cat: 'big', w: CAFE_LV[CAFE_MAX].w + 2, d: CAFE_LV[CAFE_MAX].d + 1, cost: CAFE_BUILD_COST, act: 'buildcafe', rep: CAFE_UNLOCK_TIER, ic: '☕', live: 1 },
  hosp: { cat: 'big', w: hospDims(HOSP_MAX).w + 2, d: hospDims(HOSP_MAX).d + 1, cost: HOSP_BUILD_COST, act: 'buildhosp', rep: HOSP_UNLOCK_TIER, ic: '🏥', live: 1 },
  salon: { cat: 'big', w: 12, d: 9, cost: SALON_COST, act: 'buildsalon', ic: '✂️', live: 1 },
  park: { cat: 'big', w: PARK_W, d: PARK_D, cost: PARK_COST, act: 'buildpark', ic: '🌳' },
  lake: { cat: 'big', w: 18, d: 16, cost: VILLAGE_COST.lake, act: 'vbuild', ic: '🦢' },
  monu: { cat: 'big', w: 7, d: 7, cost: VILLAGE_COST.monu, act: 'vbuild', ic: '💑' },
  avenue: { cat: 'big', noPlace: 1, cost: VILLAGE_COST.avenue, act: 'vbuild', ic: '🌸' }
});
// PET TOWN v1.4: residential zones (주택가). Houses can only be built inside one; each zone is a 20x14 block with a 2-row lane across the middle
// (5 house lots above it, 5 below). The first zone is free and starts away from the shop; more zones cost more each time.
TOWN_DEF.zone = { cat: 'zone', w: 20, d: 14, cost: 8000, ic: '🏘️', lane: 6 };
const TOWN_BIG = ['farm', 'home', 'cafe', 'hosp', 'salon', 'park', 'lake', 'monu', 'avenue'];
// v2026-10-09: "건설 메뉴 트리를 1.집 2.운영 3.상점·공공 4.장식물 5.나무,꽃 이렇게 5개로" --
// "길" 탭은 하단 바의 "🛤️ 길깔기" 바로가기 버튼으로 대체되어 건설 메뉴 탭에서는 빠짐.
const TOWN_TABS = [['house', '🏠'], ['ops', '⚙️'], ['civic', '🏪'], ['deco', '🎨'], ['tree', '🌳']];
// PET TOWN stage 3: shops & public buildings (tab 🏫). hap/sup like small facilities (only `max` copies count), plus a special effect (fx)
// look: wall / roof colours, h = wall height, roof = 'gable' | 'hip' | 'flat' | 'none' (open lots), sign = emoji on the sign board
Object.assign(TOWN_DEF, {
  gate: { cat: 'civic', w: 3, d: 1, cost: 5000, hap: 2, sup: 0, max: 1, need: 0, ic: '🪧', roof: 'none', open: 1 },
  conv: { cat: 'civic', w: 3, d: 3, cost: 15000, hap: 2, sup: 10, max: 2, need: 12, ic: '🏪', wall: '#f4f6f8', roofc: '#3aa76d', h: 22, roof: 'flat', sign: '🏪', fx: 'spend2' },
  bakery: { cat: 'civic', w: 3, d: 3, cost: 20000, hap: 3, sup: 12, max: 2, need: 12, ic: '🥐', wall: '#fdf0d8', roofc: '#c8864a', h: 22, roof: 'gable', sign: '🥐', fx: 'spend3' },
  florist: { cat: 'civic', w: 3, d: 3, cost: 18000, hap: 3, sup: 8, max: 2, need: 20, ic: '💐', wall: '#f8e6ee', roofc: '#6ab04c', h: 20, roof: 'gable', sign: '💐', fx: 'green' },
  clinic: { cat: 'civic', w: 3, d: 3, cost: 35000, hap: 3, sup: 15, max: 2, need: 20, ic: '🩺', wall: '#ffffff', roofc: '#4aa3c8', h: 24, roof: 'flat', sign: '➕' },
  dogpark: { cat: 'civic', w: 5, d: 5, cost: 30000, hap: 4, sup: 12, max: 2, need: 30, ic: '🐕', roof: 'none', open: 1 },
  photo: { cat: 'civic', w: 3, d: 3, cost: 30000, hap: 3, sup: 8, max: 1, need: 30, ic: '📷', wall: '#eef0fa', roofc: '#7a6ab5', h: 24, roof: 'hip', sign: '📷' },
  school: { cat: 'civic', w: 6, d: 4, cost: 60000, hap: 5, sup: 25, max: 1, need: 45, ic: '🏫', wall: '#f6e3c6', roofc: '#b85a4a', h: 34, roof: 'hip', sign: '🏫', fx: 'movein' },
  police: { cat: 'civic', w: 4, d: 3, cost: 50000, hap: 4, sup: 20, max: 1, need: 45, ic: '🚓', wall: '#e8eef8', roofc: '#2f4f8a', h: 28, roof: 'flat', sign: '🚓', fx: 'thief' },
  fire: { cat: 'civic', w: 4, d: 3, cost: 50000, hap: 4, sup: 20, max: 1, need: 45, ic: '🚒', wall: '#f4e4dc', roofc: '#c0302a', h: 30, roof: 'flat', sign: '🚒', fx: 'stay' },
  library: { cat: 'civic', w: 4, d: 3, cost: 45000, hap: 4, sup: 15, max: 1, need: 60, ic: '📚', wall: '#efe6d6', roofc: '#5a6a7a', h: 30, roof: 'gable', sign: '📚', fx: 'collector' },
  market: { cat: 'civic', w: 4, d: 3, cost: 40000, hap: 3, sup: 10, max: 1, need: 60, ic: '🛒', roof: 'none', open: 1, fx: 'spend3' },
  training: { cat: 'civic', w: 4, d: 4, cost: 55000, hap: 3, sup: 10, max: 1, need: 90, ic: '🎓', wall: '#e6f2e2', roofc: '#4a7fb5', h: 26, roof: 'gable', sign: '🎓' },
  pethotel: { cat: 'civic', w: 4, d: 3, cost: 70000, hap: 3, sup: 10, max: 1, need: 90, ic: '🏨', wall: '#fff6e0', roofc: '#9a6ab5', h: 40, roof: 'flat', sign: '🏨', fx: 'rich' },
  clocktower: { cat: 'civic', w: 3, d: 3, cost: 90000, hap: 5, sup: 15, max: 1, need: 130, ic: '🕰️', roof: 'none', open: 1 },
  lookout: { cat: 'civic', w: 2, d: 2, cost: 80000, hap: 4, sup: 5, max: 1, need: 130, ic: '🔭', roof: 'none', open: 1 },
  chapel: { cat: 'civic', w: 4, d: 5, cost: 150000, hap: 8, sup: 10, max: 1, need: 180, ic: '💒', wall: '#ffffff', roofc: '#e98aa8', h: 30, roof: 'gable', sign: '💒' },
  shelter: { cat: 'civic', w: 6, d: 5, cost: 40000, hap: 5, sup: 20, max: 1, need: 25, ic: '🛖', wall: '#fff5eb', roofc: '#d97746', h: 28, roof: 'hip', sign: '🐾', fx: 'shelter' },
  aquarium_center: { cat: 'civic', w: 6, d: 5, cost: 120000, hap: 9, sup: 35, max: 1, need: 50, ic: '🐬', wall: '#e0f2fe', roofc: '#0284c7', h: 32, roof: 'hip', sign: '🐬', fx: 'spend3' },
  pet_themepark: { cat: 'civic', w: 7, d: 6, cost: 220000, hap: 12, sup: 50, max: 1, need: 80, ic: '🎡', roof: 'none', open: 1, fx: 'rich' },
  cat_cafe: { cat: 'civic', w: 4, d: 4, cost: 65000, hap: 6, sup: 22, max: 2, need: 35, ic: '🐱', wall: '#fef3c7', roofc: '#f59e0b', h: 26, roof: 'gable', sign: '🐾', fx: 'collector' },
  pet_bakery: { cat: 'civic', w: 4, d: 3, cost: 48000, hap: 5, sup: 18, max: 2, need: 28, ic: '🧁', wall: '#fce7f3', roofc: '#ec4899', h: 24, roof: 'gable', sign: '🧁', fx: 'spend2' },
  zoo: { cat: 'civic', w: 20, d: 22, cost: 900000, hap: 18, sup: 80, max: 1, need: 70, ic: '🦁', wall: '#f0f4f8', roofc: '#2b8a3e', h: 56, roof: 'hip', sign: '🦁', fx: 'zoo' }
});
if (typeof window !== 'undefined') window.TOWN_DEF = TOWN_DEF;
const TOWN_BAL = {
  H0: 45,          // happiness of a town with nothing in it
  FAC_CAP: 40, GREEN_CAP: 12, CROWD_K: .8, SUP0: 16,  // facilities / greenery caps, crowding penalty per resident over what facilities can serve
  MOVE_IN: .15,    // share of capacity that can move in per day (+1 per bus stop)
  LOW: 35, LOW_DAYS: 3, GRACE: 7, // people leave only after GRACE days, and only after LOW_DAYS days in a row under LOW happiness
  CUST_CAP: 3,     // customers come up to 3x as often in a big town
  COST_STEP: .1    // every copy of the same building costs 10% more
};
// milestones (best population ever): what they unlock is listed in the town panel
const TOWN_MS = [
  { pop: 12, u: ['h:tower', 'd:busstop', 'b:conv', 'b:bakery'] }, { pop: 20, u: ['h:family', 'd:fountain', 'c:family', 'b:florist', 'b:clinic'] }, { pop: 25, u: ['b:shelter'] }, { pop: 30, u: ['h:yard', 'd:playground', 'b:dogpark', 'b:photo'] },
  { pop: 45, u: ['h:barn', 's:cocker', 'b:school', 'b:police', 'b:fire'] }, { pop: 60, u: ['h:twostory', 'c:collector', 'b:library', 'b:market'] }, { pop: 70, u: ['b:zoo'] }, { pop: 90, u: ['h:row', 's:exotic', 'b:training', 'b:pethotel'] },
  { pop: 130, u: ['h:villa', 's:macaw', 'b:clocktower', 'b:lookout'] }, { pop: 180, u: ['c:rich', 'b:chapel'] }, { pop: 250, u: ['s:beardie', 'c:celeb'] }
];
const TOWN = (() => {
  const Wd = s => { const st = s || (typeof S !== 'undefined' && S); return (st && st.room && st.room.w) || 8; }, Hd = s => { const st = s || (typeof S !== 'undefined' && S); return (st && st.room && st.room.h) || 8; };
  let MR = null; // mirror (a turned building): swap x/y around the lot's corner, which mirrors the drawing on screen
  let ROT = null; // v1.5: a building turned 180° (r = 2, 3): {ox, oy, W, D} in the art frame; we then see its back
  let HS = null; // v1.4: houses are drawn 1.25x wider/deeper and 1.6x taller than the old art (people looked as tall as the houses)
  const Q = (x, y, z) => { if (ROT) { x = 2 * ROT.ox + ROT.W - x; y = 2 * ROT.oy + ROT.D - y; } if (MR) { const nx = MR.ox + (y - MR.oy), ny = MR.oy + (x - MR.ox); x = nx; y = ny; } if (HS) { x = HS.ox + (x - HS.ox) * HS.k; y = HS.oy + (y - HS.oy) * HS.k; z = (z || 0) * HS.kz; } return [ISO.wx(x, y), ISO.wy(x, y) - (z || 0)]; };
  const poly = (c, pts, col, st, lw) => { c.beginPath(); pts.forEach((q, i) => i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); c.closePath(); if (col) { c.fillStyle = col; c.fill(); } if (st) { c.lineWidth = lw || 1; c.strokeStyle = st; c.stroke(); } };
  const hash = (a, b) => { let h = (a * 73856093) ^ (b * 19349663); h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  // ================= PET TOWN v1.0: a town you build yourself =================
  // Every house / tree / small facility is an object the player placed: S.town.objs = [{ id, k, x, y, r, n, pd, paid }]
  //   x,y = top-left tile of the footprint, r = 1 when turned (footprint w/d swapped, drawn mirrored), n = residents (houses),
  //   pd = day planted (trees), paid = coins spent (half comes back on demolish).
  // Population = residents living in houses; "possible" = the houses' capacity. Happiness (0-100) decides how full the houses
  // get and whether people leave (only after a grace period and several bad days in a row).
  const D = TOWN_DEF;
  const nm = k => (typeof t === 'function' ? (t('tk_' + k) || k) : k);
  const obj = (s, id) => ((s.town && s.town.objs) || []).find(o => o.id === id);
  const fpOf = (k, r) => { const d = D[k] || { w: 1, d: 1 }; return r % 2 && d.cat !== 'big' ? { w: d.d, d: d.w } : { w: d.w, d: d.d }; }; // big buildings don't turn; r = 0 door south, 1 east, 2 north, 3 west
  const rotPt = (o, u, v, W, Dd) => { const r = o.r || 0; if (r >= 2) { u = W - 1 - u; v = Dd - 1 - v; } if (r % 2) { const t = u; u = v; v = t; } return { x: o.x + u, y: o.y + v }; }; // a tile of the unturned lot -> where it is now
  const maxR = k => (k === 'zoo') ? 1 : (k === 'cottage') ? 2 : D[k] && (D[k].cat === 'house' || D[k].cat === 'civic' || D[k].cat === 'deco' || k === 'zone') ? 4 : 1;
  const normR = (k, r) => ((r | 0) % maxR(k) + maxR(k)) % maxR(k);
  // Railway Track & Train Station boundaries
  function trainZones(s) {
    const W = Wd(s);
    const sx = (typeof TRAIN !== 'undefined' && typeof TRAIN.STAT_X === 'function') ? TRAIN.STAT_X() : (W + 9.2);
    const sy = (typeof TRAIN !== 'undefined' && typeof TRAIN.STAT_Y === 'function') ? TRAIN.STAT_Y() : -4.2;
    const tx = (typeof TRAIN !== 'undefined' && typeof TRAIN.TRACK_X === 'function') ? TRAIN.TRACK_X() : (sx + 3.3);
    const y0 = (typeof VILLAGE_Y0 !== 'undefined' ? VILLAGE_Y0 - 5 : -65);
    const y1 = (typeof VILLAGE_S_MAX === 'function' ? VILLAGE_S_MAX() + 20 : 400);
    return [
      // 1. Continuous railway track corridor running North to South
      { x: tx - 1.8, y: y0, w: 3.8, d: y1 - y0, track: true },
      // 2. Station building and platform on the West side of the track
      { x: sx - 0.5, y: sy - 2.5, w: (tx - sx) + 2.3, d: 11.5, station: true }
    ];
  }
  const overlapsTrain = (box, s) => trainZones(s).some(z => overlap(box, z));
  // every lot that belongs to something else (shop, road, café, hospital, farm, home, park, lake, monument, board, salon, railway/station), at its biggest size
  // what is already taken: the shop + its yard, the main street (full length), the notice board and every big building's lot
  function reserved(ignore, s) {
    const W = Wd(s), H = Hd(s), R = [], add = (x, y, w, d, m) => R.push({ x: x - (m || 0), y: y - (m || 0), w: w + 2 * (m || 0), d: d + 2 * (m || 0) });
    add(-1, -1, W + 2, H + 2, 1); add(W + 1, VILLAGE_Y0 - 2, 9, 400, 0);   // x를 W-1 → W+1로, 폭 11 → 9로 축소
    if (typeof VILLAGE !== 'undefined') { const b = VILLAGE.BOARD(); add(b.x, b.y, 1, 1, 1); }
    for (const tz of trainZones(s)) add(tz.x, tz.y, tz.w, tz.d, 0);
    for (const k of TOWN_BIG) { if (k === ignore) continue; const L = LAY(k, s), d = D[k]; if (L && !d.noPlace) add(L.x, L.y, d.w, d.d, 0); }
    return R;
  }
  let _res = null, _resKey = '';
  const resv = (ig, s) => { if (ig) return reserved(ig, s); const st = s || (typeof S !== 'undefined' && S); const k = Wd(st) + 'x' + Hd(st) + JSON.stringify((st && st.lay) || 0); if (_resKey !== k) { _res = reserved(null, st); _resKey = k; } return _res; };
  const overlap = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.d && b.y < a.y + a.d;
  const inBig = (x, y) => { for (const k of TOWN_BIG) { const L = LAY(k), d = D[k]; if (L && !d.noPlace && x >= L.x && x < L.x + d.w && y >= L.y && y < L.y + d.d) return k; } return null; };
  const zonesOf = s => (s && s.town && s.town.zones) || [];
  const isVertZone = z => !!((z && z.r && z.r % 2) || (z && z.w && z.d && z.w < z.d));
  const laneOf = z => isVertZone(z)
    ? { x: z.x + D.zone.lane, y: z.y, w: 2, d: z.d || D.zone.w }
    : { x: z.x, y: z.y + D.zone.lane, w: z.w || D.zone.w, d: 2 };
  const inside = (b, z) => b.x >= z.x && b.y >= z.y && b.x + b.w <= z.x + z.w && b.y + b.d <= z.y + z.d;
  const zoneAt = (s, x, y) => zonesOf(s).find(z => x >= z.x && x < z.x + z.w && y >= z.y && y < z.y + z.d) || null;
  // v1.5: a paved path from the first residential zone to the pet shop: along the lane out of the zone, down past the shop's west side,
  // then along the shop's south side to the sidewalk (worked out from the shop's size, so it follows when the shop grows)
  function pathRects(s) {
    const z = zonesOf(s)[0]; if (!z) return [];
    const W = Wd(), H = Hd(), ly = z.y + D.zone.lane, ex = z.x + z.w, px = -4, cy = H + 5, R = []; // (row H+5: leaves room for the notice board at H+3)
    if (ex <= px) { R.push({ x: ex, y: ly, w: px + 2 - ex, d: 2 }); R.push({ x: px, y: Math.min(ly, cy), w: 2, d: Math.abs(cy - ly) + 2 }); }
    else if (z.y >= cy) { const mx = Math.min(Math.max(z.x + 2, px), W - 3); R.push({ x: mx, y: cy, w: 2, d: z.y - cy }); }
    const sx = ex <= px ? px : Math.min(Math.max(z.x + 2, px), W - 3); R.push({ x: sx, y: cy, w: W + 1 - sx, d: 2 });
    return R;
  }
  // v1.6: roads are tiles the player paves / erases ("x,y" strings in S.town.roads). A new town starts with the path above already paved.
  const ROAD_COST = 10;
  const ROAD_TYPES = [
    { id: 'dirt', ic: '🌱', cost: 10, lvl: 1, name: '기본 흙길', desc: '자연스럽고 포근한 기본 흙길' },
    { id: 'cobble', ic: '🪨', cost: 25, lvl: 3, name: '자갈길', desc: '둥글고 정겨운 조약돌 자갈길' },
    { id: 'brick', ic: '🧱', cost: 50, lvl: 5, name: '벽돌길', desc: '정갈하게 깔린 붉은 벽돌길' },
    { id: 'yellow', ic: '🟨', cost: 70, lvl: 6, name: '노란 안내길', desc: '입구·출구를 한눈에 밝혀주는 화사한 노란길' },
    { id: 'block', ic: '🏙️', cost: 90, lvl: 8, name: '보도블록길', desc: '깔끔하고 튼튼한 도시형 보도블록길' },
    { id: 'step', ic: '🌿', cost: 150, lvl: 12, name: '공원 산책로', desc: '꽃과 잔디가 어우러진 산책로' },
    { id: 'stone', ic: '🏛️', cost: 230, lvl: 16, name: '고급 석재길', desc: '품격 있는 대리석과 화강암 석재길' },
    { id: 'tile', ic: '✨', cost: 350, lvl: 20, name: '고급 타일길', desc: '화려한 기하학 문양의 고급 타일길' }
  ];
  let _rset = null, _rkey = '', _parsedRoads = [];
  const parsedRoadList = s => {
    roadSet(s);
    return _parsedRoads;
  };
  const roadSet = s => {
    const T = s && s.town;
    if (!T || !T.roads) { _parsedRoads = []; return new Set(); }
    // 시설물 내부에 잘못 깔린 길이 있으면 자동 정리
    if (!T._cleanedInside && typeof inActualBuilding === 'function') {
      const origLen = T.roads.length;
      T.roads = T.roads.filter(rk => {
        const comma = rk.indexOf(',');
        const rx = parseInt(rk.slice(0, comma), 10);
        const ry = parseInt(rk.slice(comma + 1), 10);
        return !inActualBuilding(s, rx, ry);
      });
      if (T.roads.length !== origLen) T.rv = (T.rv || 0) + 1;
      T._cleanedInside = true;
    }
    const k = T.roads.length + ':' + (T.rv || 0);
    if (k !== _rkey || !_rset) {
      _rset = new Set(T.roads);
      _parsedRoads = new Array(T.roads.length);
      for (let i = 0; i < T.roads.length; i++) {
        const rk = T.roads[i];
        const comma = rk.indexOf(',');
        const rx = parseInt(rk.slice(0, comma), 10);
        const ry = parseInt(rk.slice(comma + 1), 10);
        _parsedRoads[i] = { k: rk, x: rx, y: ry };
      }
      _rkey = k;
    }
    return _rset;
  };
  const onRoad = (s, box) => { const R = roadSet(s); if (!R.size) return false; for (let u = 0; u < box.w; u++) for (let v = 0; v < box.d; v++) if (R.has((box.x + u) + ',' + (box.y + v))) return true; return false; };
  function initRoads(s) { const T = s.town; if (T.roads) return; T.roads = []; T.rstyle = T.rstyle || {}; T.rcost = T.rcost || {}; const seen = new Set(); for (const r of pathRects(s)) for (let u = 0; u < r.w; u++) for (let v = 0; v < r.d; v++) { const k = (r.x + u) + ',' + (r.y + v); if (!seen.has(k)) { seen.add(k); T.roads.push(k); T.rstyle[k] = 'dirt'; T.rcost[k] = 10; } } T.rv = 1; }

  // 횡단보도 자동 감지 (중앙 도로 W+4, W+5 좌우 양쪽에 길이 연결된 행 y에 생성 및 가게 앞 기본 횡단보도)
  const isCrosswalk = (s, y) => {
    const W = Wd(s), H = Hd(s);
    if (y >= H - 3 && y <= H - 1) return true;
    const R = roadSet(s);
    if (!R || !R.size) return false;
    let hasWest = false;
    for (let dy = -1; dy <= 1; dy++) {
      if (R.has((W + 3) + ',' + (y + dy)) || R.has((W + 2) + ',' + (y + dy)) || R.has((W + 1) + ',' + (y + dy))) {
        hasWest = true; break;
      }
    }
    if (!hasWest) return false;
    let hasEast = false;
    for (let dy = -1; dy <= 1; dy++) {
      if (R.has((W + 6) + ',' + (y + dy)) || R.has((W + 7) + ',' + (y + dy)) || R.has((W + 8) + ',' + (y + dy))) {
        hasEast = true; break;
      }
    }
    return hasWest && hasEast;
  };
  let _cwRows = null, _cwKey = '';
  const getCrosswalkRows = s => {
    const T = s && s.town;
    const k = (T && T.roads ? T.roads.length : 0) + ':' + (T && T.rv || 0) + ':' + Wd(s);
    if (k === _cwKey && _cwRows) return _cwRows;
    _cwKey = k;
    _cwRows = new Set();
    const R = roadSet(s);
    if (!R.size) return _cwRows;
    const yMin = (typeof VILLAGE_Y0 !== 'undefined') ? VILLAGE_Y0 : -40;
    const yMax = (typeof VILLAGE_S_MAX === 'function') ? VILLAGE_S_MAX() : 60;
    for (let y = yMin; y <= yMax; y++) {
      if (isCrosswalk(s, y)) _cwRows.add(y);
    }
    return _cwRows;
  };

  // 철길 건널목 자동 감지 (철로 서쪽과 동쪽 양쪽에 길이 연결되거나 철로를 가로질러 길이 설치된 행 y에 건널목 생성)
  const isRailCrossing = (s, y) => {
    const R = roadSet(s);
    if (!R || !R.size) return false;
    const tx = (typeof TRAIN !== 'undefined' && typeof TRAIN.TRACK_X === 'function') ? TRAIN.TRACK_X() : (Wd(s) + 12.5);
    const midX = Math.round(tx);

    // 1. 철로 위(midX - 1 ~ midX + 1)에 직접 도로 타일이 깔려 있는 경우
    for (let dx = -1; dx <= 1; dx++) {
      if (R.has((midX + dx) + ',' + y)) return true;
    }

    // 2. 철로 서쪽(midX - 5 ~ midX - 1)과 동쪽(midX + 1 ~ midX + 5)에 길이 연결된 경우 (대각선 포함 dy: -1..1)
    let hasWest = false;
    for (let dy = -1; dy <= 1; dy++) {
      for (let x = midX - 5; x <= midX - 1; x++) {
        if (R.has(x + ',' + (y + dy))) { hasWest = true; break; }
      }
      if (hasWest) break;
    }
    if (!hasWest) return false;

    let hasEast = false;
    for (let dy = -1; dy <= 1; dy++) {
      for (let x = midX + 1; x <= midX + 5; x++) {
        if (R.has(x + ',' + (y + dy))) { hasEast = true; break; }
      }
      if (hasEast) break;
    }
    return hasWest && hasEast;
  };

  let _railCwRows = null, _railCwKey = '';
  const getRailCrossingRows = s => {
    const T = s && s.town;
    const k = (T && T.roads ? T.roads.length : 0) + ':' + (T && T.rv || 0) + ':' + Wd(s);
    if (k === _railCwKey && _railCwRows) return _railCwRows;
    _railCwKey = k;
    _railCwRows = new Set();
    const R = roadSet(s);
    if (!R.size) return _railCwRows;
    const yMin = (typeof VILLAGE_Y0 !== 'undefined') ? VILLAGE_Y0 : -40;
    const yMax = (typeof VILLAGE_S_MAX === 'function') ? VILLAGE_S_MAX() : 80;
    for (let y = yMin; y <= yMax; y++) {
      if (isRailCrossing(s, y)) _railCwRows.add(y);
    }
    return _railCwRows;
  };

  const isRailCrossingTile = (s, x, y) => {
    const rows = getRailCrossingRows(s);
    if (!rows.has(y)) return false;
    const tx = (typeof TRAIN !== 'undefined' && typeof TRAIN.TRACK_X === 'function') ? TRAIN.TRACK_X() : (Wd(s) + 12.5);
    const midX = Math.round(tx);
    return x >= midX - 4 && x <= midX + 4;
  };

  // 시설별 출입구 좌표 및 길 연결 여부 판정 (입장 가능한 각 시설의 입구/출구 및 문앞 접근 위치)
  const facilityEntrances = (s, f) => {
    const W = Wd(s), H = Hd(s), ents = [];
    const checkAll = !f || f === 'all';
    const k = checkAll ? null : (typeof f === 'string' ? f : (f.k || f.id));

    // 1. 펫샵 (상점): 정문 앞 두 칸(W, H-3 및 W, H-2), 배달 입구 앞 한 칸(W, 1) - 북쪽 1타일, 서쪽 1칸 이동 반영
    if (checkAll || k === 'shop') {
      ents.push({ id: 'main', x: W, y: H - 3, accessX: W, accessY: H - 3, fac: 'shop' });
      ents.push({ id: 'main2', x: W, y: H - 2, accessX: W, accessY: H - 2, fac: 'shop' });
      ents.push({ id: 'side', x: W, y: 1, accessX: W, accessY: 1, fac: 'shop' });
    }

    // 2. 카페
    if (checkAll || k === 'cafe') {
      if (s && s.cafe && s.cafe.built && typeof CAFE_POS === 'function') {
        const cp = CAFE_POS(s);
        const cw = typeof cafeW === 'function' ? cafeW(s) : (cp.x + cp.w);
        ents.push({ id: 'entry', x: cp.x + cp.w - 1, y: cp.y + cp.d - 1, accessX: cw + 1, accessY: cp.y + cp.d - 1, fac: 'cafe' });
        ents.push({ id: 'entry2', x: cp.x + cp.w - 1, y: cp.y + cp.d - 2, accessX: cw + 1, accessY: cp.y + cp.d - 2, fac: 'cafe' });
      }
    }

    // 3. 동물병원
    if (checkAll || k === 'hosp') {
      if (s && s.hosp && s.hosp.built && typeof HOSP_POS === 'function') {
        const hp = HOSP_POS(s);
        ents.push({ id: 'entry', x: hp.x1, y: hp.y + 3, accessX: hp.x1 + 1, accessY: hp.y + 3, fac: 'hosp' });
        ents.push({ id: 'entry2', x: hp.x1, y: hp.y + 2, accessX: hp.x1 + 1, accessY: hp.y + 2, fac: 'hosp' });
      }
    }

    // 4. 펫 미용실
    if (checkAll || k === 'salon') {
      if (s && s.salon && s.salon.built && typeof SALON_POS === 'function') {
        const sp = SALON_POS();
        ents.push({ id: 'entry', x: sp.x + sp.w, y: sp.y + sp.d - 2, accessX: sp.x + sp.w + 1, accessY: sp.y + sp.d - 2, fac: 'salon' });
        ents.push({ id: 'entry2', x: sp.x + sp.w, y: sp.y + sp.d - 1, accessX: sp.x + sp.w + 1, accessY: sp.y + sp.d - 1, fac: 'salon' });
      }
    }

    // 5. 공원: 남쪽 입구길 1칸으로 줄이고 북 2타일(-2y), 동 1타일(+1x) 이동 / 서쪽 입구길 1칸으로 줄이고 동 6칸(+6x) 이동
    if (checkAll || k === 'park') {
      if (s && s.park && s.park.built && typeof PARK_POS === 'function') {
        const pp = PARK_POS();
        // 서쪽 입구길: 1칸으로 줄이고 동 6칸 이동 (기존 pp.x - 8 에서 +6 -> pp.x - 2, y = pp.y + 7)
        ents.push({ id: 'west', x: pp.x - 2, y: pp.y + 7, accessX: pp.x - 2, accessY: pp.y + 7, fac: 'park' });
        // 남쪽 입구길: 1칸으로 줄이고 북 2타일(-2y), 동 1타일(+1x) 이동 (기존 pp.x + 8 에서 +1 -> pp.x + 9, 기존 pp.y + pp.d + 4 에서 -2 -> pp.y + pp.d + 2)
        ents.push({ id: 'south', x: pp.x + 9, y: pp.y + pp.d + 2, accessX: pp.x + 9, accessY: pp.y + pp.d + 2, fac: 'park' });
      }
    }

    // 6. 호수: 남쪽 입구길 기존 위치에서 서쪽으로 1칸 더 추가 생성 (lp.x + 11 및 lp.x + 10)
    if (checkAll || k === 'lake') {
      if (s && s.village && s.village.lake && typeof VILLAGE !== 'undefined' && typeof VILLAGE.LAKE === 'function') {
        const lp = VILLAGE.LAKE();
        ents.push({ id: 'south', x: lp.x + 11, y: lp.y + lp.d + 2, accessX: lp.x + 11, accessY: lp.y + lp.d + 2, fac: 'lake' });
        ents.push({ id: 'south2', x: lp.x + 10, y: lp.y + lp.d + 2, accessX: lp.x + 10, accessY: lp.y + lp.d + 2, fac: 'lake' });
      }
    }

    // 7. 목장: 북쪽 입구 아치문 앞 입구길 1칸 생성
    if (checkAll || k === 'ranch') {
      if (s && s.ranch && typeof LAY === 'function') {
        const rp = LAY('ranch', s);
        if (rp) {
          ents.push({ id: 'gate', x: rp.x + 2, y: rp.y + 1, accessX: rp.x + 2, accessY: rp.y + 1, fac: 'ranch' });
        }
      }
    }

    // 8. 농장 (서쪽 매대 및 밭 진입로)
    if (checkAll || k === 'farm') {
      if (typeof LAY === 'function') {
        const fp = LAY('farm', s);
        if (fp) {
          ents.push({ id: 'stall', x: fp.x, y: fp.y, accessX: fp.x - 1, accessY: fp.y, fac: 'farm' });
          ents.push({ id: 'stall2', x: fp.x, y: fp.y + 1, accessX: fp.x - 1, accessY: fp.y + 1, fac: 'farm' });
        }
      }
    }

    // 9. 내 집 (플레이어 하우스)
    if (checkAll || k === 'home') {
      if (typeof LAY === 'function' && LAY('home', s)) {
        const hl = LAY('home', s);
        ents.push({ id: 'home_door', x: Math.floor(hl.x + 5), y: Math.floor(hl.y + 6), accessX: Math.floor(hl.x + 5), accessY: Math.floor(hl.y + 7), fac: 'home' });
      }
    }

    // 10. 기차역 (플랫폼 승하차 출입구)
    if (checkAll || k === 'train') {
      if (typeof TRAIN !== 'undefined' && typeof TRAIN.STAT_X === 'function' && typeof TRAIN.STAT_Y === 'function') {
        const sx = Math.round(TRAIN.STAT_X(s)), sy = Math.round(TRAIN.STAT_Y(s));
        ents.push({ id: 'train_gate', x: sx, y: sy + 2, accessX: sx, accessY: sy + 3, fac: 'train' });
        ents.push({ id: 'train_gate2', x: sx + 1, y: sy + 2, accessX: sx + 1, accessY: sy + 3, fac: 'train' });
      }
    }

    // 11. 공공시설 및 동물원 (s.town.objs 내 civic 건물들)
    const objs = checkAll ? ((s && s.town && s.town.objs) || []) : (f && f.k ? [f] : []);
    for (const obj of objs) {
      const d = D[obj.k];
      if (d && d.cat === 'civic') {
        if (obj.k === 'zoo') {
          // Grand Safari Zoo: IN 입구(계단 착지대 바로 앞 x+5..6, y+22..23) 및 OUT 출구 게이트(북동쪽 아치문 앞 x+14..15, y-1..-2)
          ents.push({ id: 'zoo_in', x: obj.x + 5, y: obj.y + 22, accessX: obj.x + 5, accessY: obj.y + 23, fac: 'zoo' });
          ents.push({ id: 'zoo_in2', x: obj.x + 6, y: obj.y + 22, accessX: obj.x + 6, accessY: obj.y + 23, fac: 'zoo' });
          ents.push({ id: 'zoo_out', x: obj.x + 14, y: obj.y - 1, accessX: obj.x + 14, accessY: obj.y - 2, fac: 'zoo' });
          ents.push({ id: 'zoo_out2', x: obj.x + 15, y: obj.y - 1, accessX: obj.x + 15, accessY: obj.y - 2, fac: 'zoo' });
        } else {
          const pt = rotPt(obj, Math.floor(d.w / 2), d.d, d.w, d.d);
          ents.push({ id: 'door', x: pt.x, y: pt.y - 1, accessX: pt.x, accessY: pt.y, fac: obj.k });
        }
      }
    }
    return ents;
  };

  // v2026-10-09: 모든 시설 입구·출구 앞 노란색 길(drawFacilityGateTiles) 타일을 길찾기 보행 가능 타일로 등록
  let _agKey = '', _agSet = null;
  const autoGateTileSet = s => {
    const T = s && s.town;
    if (!s) return new Set();
    const rv = T ? (T.rv || 0) : 0;
    const objCount = (T && T.objs) ? T.objs.length : 0;
    const facKey = ((s.park && s.park.built) ? 1 : 0) |
      (((s.village && s.village.lake) ? 1 : 0) << 1) |
      (((s.cafe && s.cafe.built) ? 1 : 0) << 2) |
      (((s.hosp && s.hosp.built) ? 1 : 0) << 3) |
      (((s.salon && s.salon.built) ? 1 : 0) << 4);
    const k = rv + ':' + objCount + ':' + facKey;
    if (k === _agKey && _agSet) return _agSet;
    const out = new Set();
    const ents = facilityEntrances(s, 'all');
    for (const ent of ents) {
      out.add(Math.floor(ent.accessX) + ',' + Math.floor(ent.accessY));
      if (ent.x != null && ent.y != null) {
        out.add(Math.floor(ent.x) + ',' + Math.floor(ent.y));
      }
    }
    _agSet = out; _agKey = k;
    return out;
  };

  // 시설 입구·출구 안내 도로 스타일을 차분한 흙길('dirt')로 유지
  const syncFacilityGateRoads = s => {
    if (!s || !s.town) return;
    const T = s.town;
    if (!T.rstyle) T.rstyle = {};
    let changed = false;
    // 기존 노란색 도로 스타일이 있으면 차분한 흙길('dirt')로 전환
    for (const k in T.rstyle) {
      if (T.rstyle[k] === 'yellow') {
        T.rstyle[k] = 'dirt';
        changed = true;
      }
    }
    if (changed) {
      T.rv = (T.rv || 0) + 1;
      _rkey = '';
    }
  };

  const isEntranceConnected = (s, ent) => {
    if (!ent) return false;
    const R = roadSet(s);
    if (R.has(ent.accessX + ',' + ent.accessY)) return true;
    if (autoGateTileSet(s).has(Math.floor(ent.accessX) + ',' + Math.floor(ent.accessY))) return true;
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, 1], [1, 1], [0, 2], [0, -2], [2, 0], [-2, 0]]) {
      if (R.has((ent.accessX + dx) + ',' + (ent.accessY + dy))) return true;
    }
    const W = Wd(s);
    if ((ent.accessX >= W + 1 && ent.accessX <= W + 3) || (ent.accessX >= W + 6 && ent.accessX <= W + 8)) return true;
    for (const z of zonesOf(s)) {
      const L = laneOf(z);
      if (ent.accessX >= L.x - 1 && ent.accessX <= L.x + L.w && ent.accessY >= L.y - 1 && ent.accessY <= L.y + L.d) return true;
    }
    return false;
  };

  const isFacilityAccessible = (s, f) => {
    const ents = facilityEntrances(s, f);
    if (!ents.length) return true;
    return ents.some(e => isEntranceConnected(s, e));
  };

  const isHouseAccessible = (s, home) => {
    // v2026-10-09: 모든 집 입구 앞에 파란색 자동 연결 타일을 항상 그려주므로(drawHouseEntranceTiles)
    // 주택은 이제 "길 연결 필요" 경고 없이 언제나 연결된 상태로 취급함.
    if (!home) return false;
    return true;
  };

  // v2026-10-09: 집 문앞 연결 타일(hd)이 실제 길/골목 네트워크와 떨어져 있으면(=길찾기가 안 통하면)
  // 그 집에서 나온 주민은 아무 데도 못 가고 제자리에 멈춰 서 있게 됨. 그래서 문앞 타일에서 시작해
  // 가장 가까운 "진짜" 길/골목길 타일까지 남쪽으로 몇 칸 이내에 닿는지 찾아서, 그 사이 칸들도 전부
  // 통행 가능한 다리(연결로)로 취급함. (최대 7칸까지만 - 그 이상은 그냥 안 이어줌)
  let _heKey = '', _heSet = null;
  const houseConnectorSet = s => {
    const T = s && s.town;
    if (!T) return new Set();
    const k = (T.objs ? T.objs.length : 0) + ':' + (T.roads ? T.roads.length : 0) + ':' + (T.rv || 0) + ':' + (T.zones ? T.zones.length : 0);
    if (k === _heKey && _heSet) return _heSet;
    const R = roadSet(s), out = new Set();
    const baseWalk = (x, y) => {
      if (R.has(x + ',' + y)) return true;
      for (const z of zonesOf(s)) { const L = laneOf(z); if (x >= L.x && x < L.x + L.w && y >= L.y && y < L.y + L.d) return true; }
      return false;
    };
    // v2026-10-09: 기존엔 "남쪽"으로만 7칸 찾아봤는데, 집이 길/골목 쪽을 남쪽이 아닌 다른 방향으로
    // 바라보고 있는 배치에서는 영영 길을 못 찾고 막다른 길만 만들어져서 "길 위인데도 길이 없다"는
    // 버그로 이어졌음. 문에서 사방으로(BFS) 가장 가까운 실제 길/골목길 타일을 찾아 그 경로 전체를
    // 다리로 뚫어줌 (반경 12칸까지).
    const DIRS4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    for (const o of (T.objs || [])) {
      const d = D[o.k];
      if (o.k !== 'cottage' && !(d && d.cat === 'house')) continue;
      const hd = doorOf(o);
      out.add(hd.x + ',' + hd.y);
      if (baseWalk(hd.x, hd.y)) continue; // 문 바로 앞이 이미 길/골목이면 끝
      const startKey = hd.x + ',' + hd.y;
      const visited = new Set([startKey]);
      const parent = new Map();
      const queue = [[hd.x, hd.y]];
      let found = null;
      for (let qi = 0; qi < queue.length && qi < 400; qi++) {
        const [cx, cy] = queue[qi];
        if (Math.abs(cx - hd.x) + Math.abs(cy - hd.y) > 12) continue;
        for (const [dx, dy] of DIRS4) {
          const nx = cx + dx, ny = cy + dy, nk = nx + ',' + ny;
          if (visited.has(nk)) continue;
          visited.add(nk);
          parent.set(nk, cx + ',' + cy);
          if (baseWalk(nx, ny)) { found = nk; break; }
          queue.push([nx, ny]);
        }
        if (found) break;
      }
      if (found) {
        let k2 = parent.get(found); // found 자체(실제 길)는 넣을 필요 없음 -- 그 앞까지만 다리로
        while (k2 && k2 !== startKey) { out.add(k2); k2 = parent.get(k2); }
      } else {
        out.add(hd.x + ',' + (hd.y + 1)); // 그래도 못 찾았으면 기존처럼 한 칸만이라도 열어둠
      }
    }
    _heSet = out; _heKey = k;
    return out;
  };

  let _walkRoadKey = '', _walkRoadSet = null, _walkRoadDelivSet = null;
  const getWalkableRoadSets = s => {
    const T = s && s.town;
    const rLen = (T && T.roads) ? T.roads.length : 0;
    const rv = (T ? T.rv || 0 : 0);
    const objCount = (T && T.objs) ? T.objs.length : 0;
    const zCount = (T && T.zones) ? T.zones.length : 0;
    const facKey = ((s && s.park && s.park.built) ? 1 : 0) |
      (((s && s.village && s.village.lake) ? 1 : 0) << 1) |
      (((s && s.cafe && s.cafe.built) ? 1 : 0) << 2) |
      (((s && s.hosp && s.hosp.built) ? 1 : 0) << 3) |
      (((s && s.salon && s.salon.built) ? 1 : 0) << 4);
    const k = rLen + ':' + rv + ':' + objCount + ':' + zCount + ':' + facKey;
    if (k === _walkRoadKey && _walkRoadSet) {
      return { base: _walkRoadSet, delivery: _walkRoadDelivSet };
    }
    const baseSet = new Set();
    const R = roadSet(s);
    for (const rk of R) baseSet.add(rk);

    for (const z of zonesOf(s)) {
      const L = laneOf(z);
      for (let lx = L.x; lx < L.x + L.w; lx++) {
        for (let ly = L.y; ly < L.y + L.d; ly++) {
          baseSet.add(lx + ',' + ly);
        }
      }
    }

    const hc = houseConnectorSet(s);
    for (const ck of hc) baseSet.add(ck);

    const ag = autoGateTileSet(s);
    for (const gk of ag) baseSet.add(gk);

    const allEnts = facilityEntrances(s, 'all');
    for (const ent of allEnts) {
      if (isEntranceConnected(s, ent)) {
        baseSet.add(Math.floor(ent.x) + ',' + Math.floor(ent.y));
      }
    }

    if (typeof TRAIN !== 'undefined' && TRAIN.STAT_X && TRAIN.STAT_Y) {
      const sx = TRAIN.STAT_X(s), sy = TRAIN.STAT_Y(s);
      for (let tx = sx; tx <= sx + 3; tx++) {
        for (let ty = sy; ty <= sy + 2; ty++) {
          baseSet.add(tx + ',' + ty);
        }
      }
    }

    for (const o of (T && T.objs) || []) {
      if (o.k === 'zoo') {
        for (let zx = o.x + 3; zx <= o.x + 6; zx++) for (let zy = o.y + 18; zy <= o.y + 21; zy++) baseSet.add(zx + ',' + zy);
        for (let zx = o.x + 12; zx <= o.x + 15; zx++) for (let zy = o.y - 6; zy <= o.y - 3; zy++) baseSet.add(zx + ',' + zy);
      }
    }

    const W = Wd(s), H = Hd(s);
    for (const dy of [H - 2, H - 3]) {
      for (const dx of [W, W + 1, W + 2]) {
        baseSet.add(dx + ',' + dy);
      }
    }

    const delivSet = new Set(baseSet);
    for (let dy = 1; dy <= 3; dy++) {
      for (const dx of [W, W + 1, W + 2]) {
        delivSet.add(dx + ',' + dy);
      }
    }

    _walkRoadKey = k;
    _walkRoadSet = baseSet;
    _walkRoadDelivSet = delivSet;
    return { base: baseSet, delivery: delivSet };
  };

  // 모든 사람 캐릭터의 외부 이동 가능 여부 판정 (길 네트워크 전용)
  const isRoadTile = (s, x, y, allowDelivery) => {
    x = Math.floor(x);
    y = Math.floor(y);
    const W = Wd(s);

    // 1. 중앙 대형 도로의 양옆 인도 (빠른 수식 판정)
    const yMin = (typeof VILLAGE_Y0 !== 'undefined') ? VILLAGE_Y0 : -40;
    const yMax = (typeof VILLAGE_S_MAX === 'function') ? VILLAGE_S_MAX() : 60;
    if (y >= yMin && y <= yMax) {
      if ((x >= W + 1 && x <= W + 3) || (x >= W + 6 && x <= W + 8)) return true;
    }

    // 2. 중앙 대형 도로의 횡단보도 (차도 W+4, W+5 중 횡단보도 연결된 곳만 보행 허용)
    if (x === W + 4 || x === W + 5) {
      const cw = getCrosswalkRows(s);
      if (cw.has(y)) return true;
    }

    // 3. 철길 건널목
    if (isRailCrossingTile(s, x, y)) return true;

    // 4. 미리 계산된 캐시 Set을 통한 O(1) 길 네트워크 판정
    const sets = getWalkableRoadSets(s);
    const targetSet = allowDelivery ? sets.delivery : sets.base;
    return targetSet.has(x + ',' + y);
  };
  let _chKey = '', _chSet = null;
  const getCivicHouseBlockedSet = s => {
    const T = s && s.town;
    const k = (T && T.objs ? T.objs.length : 0) + ':' + (T ? T.rv || 0 : 0);
    if (k === _chKey && _chSet) return _chSet;
    const out = new Set();
    for (const o of (T && T.objs) || []) {
      const d = D[o.k];
      if (d && (d.cat === 'civic' || d.cat === 'house')) {
        const g = fpOf(o.k, o.r);
        for (let bx = o.x; bx < o.x + g.w; bx++) {
          for (let by = o.y; by < o.y + g.d; by++) {
            if (o.k === 'zoo') {
              if (bx >= o.x + 3 && bx <= o.x + 6 && by >= o.y + 18 && by <= o.y + 21) continue;
              if (bx >= o.x + 12 && bx <= o.x + 15 && by >= o.y - 6 && by <= o.y - 3) continue;
            }
            out.add(bx + ',' + by);
          }
        }
      }
    }
    _chSet = out; _chKey = k;
    return out;
  };

  // 실제 건물 본체 내부인지 판별 (여백/마당은 제외하고 실제 건물 안과 큰도로 차도만 차단)
  function inActualBuilding(s, x, y, gateSet) {
    const W = Wd(s), H = Hd(s);
    // 1. 가게 내부 (가게 벽 안쪽만 차단; 가게 밖 테두리 x=-1, x=W, y=-1, y=H는 허용)
    if (x >= 0 && x < W && y >= 0 && y < H) return true;
    // 2. 큰도로 중앙 차도 (W+3.4 ~ W+6.2 구간인 타일 W+4, W+5) 차단 — 양옆 인도(W+1~W+3, W+6~W+8) 및 집 앞은 연결 가능하도록 허용
    if (x >= W + 4 && x <= W + 5) return true;
    const gates = gateSet || autoGateTileSet(s);
    // 3. 마을 게시판 본체 타일
    if (typeof VILLAGE !== 'undefined') { const nb = VILLAGE.BOARD(); if (x === nb.x && y === nb.y) return true; }
    // 4. 내 집(home): 10x8 부지 전체가 아니라 실제 집 건물(HOME_POS)만 차단 (집 앞마당과 인도 사이는 길 깔기 허용!)
    if (LAY('home', s) && typeof FURN !== 'undefined' && FURN.HOME_POS) {
      const hp = FURN.HOME_POS(W, H, (s && s.home && s.home.lv) || 1);
      if (x >= hp.x && x < hp.x + hp.w && y >= hp.y && y < hp.y + hp.d) return true;
    }
    // 5. 카페 실제 건물 (지어졌을 때 현재 레벨의 실제 건물만 차단)
    if (s && s.cafe && s.cafe.built && typeof CAFE_POS === 'function') {
      const cp = CAFE_POS(s); if (x >= cp.x && x < cp.x + cp.w && y >= cp.y && y < cp.y + cp.d) return true;
    }
    // 6. 병원 실제 건물 (지어졌을 때 현재 레벨의 실제 건물만 차단)
    if (s && s.hosp && s.hosp.built && typeof HOSP_POS === 'function') {
      const hp = HOSP_POS(s); if (x >= hp.x && x < hp.x + hp.w && y >= hp.y && y < hp.y + hp.d) return true;
    }
    // 7. 미용실 실제 건물 (10x8 건물 본체만 차단, 동쪽 문 앞 2칸은 길 깔기 허용)
    if (s && s.salon && s.salon.built && typeof SALON_POS === 'function') {
      const sp = SALON_POS(); if (x >= sp.x && x < sp.x + sp.w && y >= sp.y && y < sp.y + sp.d) return true;
    }
    // 8. 농장: 밭(FARM_POS), 씨앗가게(STALL_POS), 닭장(COOP_POS), 보관상자(FARM_BOX_POS) 본체만 차단 (주변 통로는 길 깔기 허용)
    if (LAY('farm', s)) {
      if (typeof FARM_POS === 'function') {
        const fp = FARM_POS(W, H); if (x >= fp.x && x < fp.x + fp.w && y >= fp.y && y < fp.y + fp.d) return true;
      }
      if (typeof STALL_POS === 'function') {
        const sp = STALL_POS(); if (x >= Math.floor(sp.x) && x < Math.ceil(sp.x + 3.1) && y >= Math.floor(sp.y) && y < Math.ceil(sp.y + 3)) return true;
      }
      if (s && s.farm && s.farm.coop && typeof COOP_POS === 'function') {
        const cq = COOP_POS(W); if (x >= cq.x && x < cq.x + cq.w && y >= cq.y && y < cq.y + cq.d) return true;
      }
      if (typeof FARM_BOX_POS === 'function') {
        const fb = FARM_BOX_POS(); if (fb && x >= fb.x && x < fb.x + fb.w && y >= fb.y && y < fb.y + fb.d) return true;
      }
    }
    // 9. 목장, 공원, 호수, 기념광장 (시설 부지 내부 차단 — 시설물 안에는 길을 깔 수 없음, 단 입구·출구 안내 타일은 허용)
    // v2026-10-10: 공원·호수는 새로 그린 배경 그림이 부지 사각형 전체를 꽉 채우지 못해서(특히
    // 동/서쪽 뾰족한 꼭짓점 근처) 그림과 부지 경계 사이에 빈 풀밭이 남는데, 이 빈 공간까지 전부
    // "건물 내부"로 차단되어 있어서 사용자가 그 틈에 길을 못 깔았음. 그림이 실제로 덜 채우는
    // 가장자리만큼 차단 영역을 안쪽으로 줄여서(inset), 그 틈에도 길을 깔 수 있게 함.
    const BLOCK_INSET = { park: 1.5, lake: 2 };
    for (const bk of ['ranch', 'park', 'lake', 'monu']) {
      const L = LAY(bk, s), bd = D[bk];
      const ins = BLOCK_INSET[bk] || 0;
      if (L && bd && !bd.noPlace && bigBuilt(s, bk) &&
        x >= L.x + ins && x < L.x + bd.w - ins &&
        y >= L.y + ins && y < L.y + bd.d - ins) {
        if (gates.has(x + ',' + y)) continue;
        return true;
      }
    }
    // 10. 기차역 건물 (역사 벽체 위는 도로 설치 차단, 철길 구간은 도로 및 건널목 설치 허용)
    if (typeof TRAIN !== 'undefined' && typeof TRAIN.solid === 'function' && TRAIN.solid(x, y)) return true;
    // 11. 배치된 시민 건물(동물원, 쉘터, 학교 등) - O(1) Set lookup
    const k = x + ',' + y;
    if (getCivicHouseBlockedSet(s).has(k) && !gates.has(k)) return true;
    return false;
  }
  const houseBuildingHasTile = (o, x, y) => {
    for (let u = 0; u < 4; u++) for (let v = 0; v < 3; v++) { const p = rotPt(o, u, v, 5, 5); if (p.x === x && p.y === y) return true; }
    return false;
  };
  // 길 깔기: 건물 안과 큰도로 차도를 제외한 어디든 자유롭게 깔 수 있게 허용 (집과 인도 사이, 앞마당 등 모두 가능!)
const roadTileOk = (s, x, y) => {
  const b = { x, y, w: 1, d: 1 };
  const W = Wd(s), H = Hd(s);
  if (x < VILLAGE_X0 + 1 || y < VILLAGE_Y0 + 1 || x > W + VILLAGE_XE - 2 || y > VILLAGE_S_MAX() - 1) return false;
  if (inActualBuilding(s, x, y)) return false;
  // 플레이어가 배치한 마을 오브젝트: 집/큰 시설만 막고, 나무·꽃·작은 장식은 그 위에 길 깔기 허용!
  for (const o of (s && s.town && s.town.objs) || []) {
    const d = D[o.k]; if (!d) continue;
    // 주택은 실제 집 건물(4x3) 본체만 막고 앞마당(2칸)은 길 깔기 허용
    if (d.cat === 'house') {
      if (houseBuildingHasTile(o, x, y)) return false;
      continue;
    }
    // 🆕 나무·꽃은 도로 설치를 막지 않음 (자연스럽게 나무 옆으로 길이 지나감)
    if (d.cat === 'tree') continue;
    // 게이트는 통과 가능
    if (o.k === 'gate') continue;
    // 그 외 큰 시설/장식만 막음
    const g = fpOf(o.k, o.r);
    if (overlap(b, { x: o.x, y: o.y, w: g.w, d: g.d })) return false;
  }
  return true;
};
  const zoneCost = s => Math.round(D.zone.cost * Math.pow(1.8, Math.max(0, zonesOf(s).length - 1)) / 100) * 100;
  function canPlace(s, k, x, y, r, ignore) {
    const f = fpOf(k, r), box = { x, y, w: f.w, d: f.d }, W = Wd(s), H = Hd(s), cat = D[k] && D[k].cat;
    if (x < VILLAGE_X0 + 2 || y < VILLAGE_Y0 + 2 || x + f.w > W + VILLAGE_XE - 2 || y + f.d > VILLAGE_S_MAX() - 1) return 'tOut';
    const Z = zonesOf(s);
    if (cat === 'zone') { // a new residential block: clear land, not touching another block
      if (resv(null, s).some(q => overlap(box, q))) return 'tTaken';
      if (Z.some(z => overlap(box, { x: z.x - 1, y: z.y - 1, w: z.w + 2, d: z.d + 2 }))) return 'tTaken';
      for (const o of (s.town && s.town.objs) || []) { const g = fpOf(o.k, o.r); if (overlap(box, { x: o.x, y: o.y, w: g.w, d: g.d })) return 'tTaken'; }
      return null;
    }
    // v1.31: 나무나 꽃은 집 옆, 인도 옆, 도로 옆에도 심을 수 있음 (미래 확장 대비용 예약 여백 제거)
    if (cat === 'tree') {
      // 1. 가게 벽 안쪽은 막음 (가게 내부는 불가)
      if (overlap(box, { x: 0, y: 0, w: W, d: H })) return 'tTaken';
      // 2. 메인 스트리트 차도/인도 본체 위는 막음
      if (overlap(box, { x: W + 1, y: VILLAGE_Y0 - 2, w: 9, d: 400 })) return 'tTaken';
      // 3. 게시판 본체 위는 막음
      if (typeof VILLAGE !== 'undefined') { const b = VILLAGE.BOARD(); if (overlap(box, { x: b.x, y: b.y, w: 1, d: 1 })) return 'tTaken'; }
      // 4. 큰 건물의 "현재 실제 크기" 위는 막음 (미래 확장 빈 공간은 심기 허용)
      if (s && s.cafe && s.cafe.built && typeof CAFE_POS === 'function') {
        const cp = CAFE_POS(s); if (overlap(box, { x: cp.x, y: cp.y, w: cp.w, d: cp.d })) return 'tTaken';
      }
      if (s && s.hosp && s.hosp.built && typeof HOSP_POS === 'function') {
        const hp = HOSP_POS(s); if (overlap(box, { x: hp.x, y: hp.y, w: hp.w, d: hp.d })) return 'tTaken';
      }
      for (const bk of TOWN_BIG) {
        if (bk === 'cafe' || bk === 'hosp') continue;
        const L = LAY(bk, s), bd = D[bk];
        if (L && !bd.noPlace && bigBuilt(s, bk) && overlap(box, { x: L.x, y: L.y, w: bd.w, d: bd.d })) return 'tTaken';
      }
      // 5. 도로/인도 위는 심을 수 없음 (길 옆은 허용)
      if (onRoad(s, box)) return 'tOnPath';
      // 6. 주택가 중앙 통로(차선) 위는 심을 수 없음 (집 옆은 허용)
      if (Z.some(z => overlap(box, laneOf(z)))) return 'tOnLane';
      // 7. 다른 오브젝트/집 본체 위와 충돌 검사
      for (const o of (s.town && s.town.objs) || []) {
        if (o.id === ignore) continue;
        const g = fpOf(o.k, o.r);
        if (overlap(box, { x: o.x, y: o.y, w: g.w, d: g.d })) return 'tTaken';
      }
      // 8. 기차역 및 철로 위는 심을 수 없음
      if (overlapsTrain(box, s)) return 'tTaken';
      return null;
    }
    if (resv(cat === 'big' ? k : null, s).some(q => overlap(box, q))) return 'tTaken';
    if (cat === 'house') {
      const R = roadSet(s);
      if (R.size) {
        for (let u = 1; u <= 3; u++) for (let v = 1; v <= 3; v++) { if (R.has((x + u) + ',' + (y + v))) return 'tOnPath'; }
      }
    } else if (cat !== 'zone' && cat !== 'big' && onRoad(s, box)) return 'tOnPath';
    if (cat === 'house') { const z = Z.find(z => inside(box, z)); if (!z) return 'tNeedZone'; if (overlap(box, laneOf(z))) return 'tOnLane'; }
    else if (cat === 'big' || cat === 'civic') { if (Z.some(z => overlap(box, z))) return 'tInZone'; }
    else if (Z.some(z => overlap(box, laneOf(z)))) return 'tOnLane';
    for (const o of (s.town && s.town.objs) || []) {
      if (o.id === ignore) continue;
      if ((cat === 'big' || cat === 'civic') && D[o.k] && D[o.k].cat === 'tree') continue;
      const g = fpOf(o.k, o.r);
      if (overlap(box, { x: o.x, y: o.y, w: g.w, d: g.d })) return 'tTaken';
    }
    return null;
  }
  // the first residential block: away from the shop (about 20 tiles), on the first free spot of a few candidates
  function firstZone(s) {
    const W = Wd(), H = Hd(), zw = D.zone.w, zd = D.zone.d;
    for (const [x, y] of [[-zw - 20, H + 5 - D.zone.lane], [-zw - 20, 0], [-zw - 20, H + 6], [-zw - 20, -zd - 4], [-zw - 30, 0], [-10, H + 22], [-zw - 20, -zd - 20]]) if (!canPlace(s, 'zone', x, y, 0)) return { x, y, w: zw, d: zd };
    return { x: -zw - 24, y: 0, w: zw, d: zd };
  }
  // free house lots in the zones (top row faces the lane)
  function zoneLots(s, k) {
    const out = [];
    for (const z of zonesOf(s)) {
      if (isVertZone(z)) {
        for (const xx of [z.x + 1, z.x + D.zone.lane + 3]) for (let yy = z.y; yy + 5 <= z.y + z.d; yy += 5) if (!canPlace(s, k || 'cottage', xx, yy, 0)) out.push({ x: xx, y: yy });
      } else {
        for (const yy of [z.y + 1, z.y + D.zone.lane + 3]) for (let xx = z.x; xx + 5 <= z.x + z.w; xx += 5) if (!canPlace(s, k || 'cottage', xx, yy, 0)) out.push({ x: xx, y: yy });
      }
    }
    return out;
  }
  // v1.8: saves started before v1.8 have the first zone further north with a bent path. If that town is still untouched
  // (one zone at the old spot, roads exactly the starting path), slide the zone and everything in it south so the path is straight.
  function moveStartZone(s) {
    const T = s.town; T.m18 = 1;
    try {
      const zs = T.zones || [], z = zs[0], zw = D.zone.w; if (zs.length !== 1 || z.x !== -zw - 20 || z.y !== 0) return;
      const ny = Hd() + 5 - D.zone.lane, dy = ny - z.y; if (dy <= 0) return;
      const keyOf = R => { const a = []; for (const r of R) for (let u = 0; u < r.w; u++) for (let v = 0; v < r.d; v++) a.push((r.x + u) + ',' + (r.y + v)); return [...new Set(a)].sort().join('|'); };
      if (keyOf(pathRects(s)) !== [...new Set(T.roads || [])].sort().join('|')) return; // player changed the roads -> leave it alone
      const inZ = o => o.x >= z.x && o.x < z.x + z.w && o.y >= z.y && o.y < z.y + z.d, mine = T.objs.filter(inZ), rest = T.objs.filter(o => !inZ(o));
      const objs0 = T.objs, roads0 = T.roads; T.objs = rest; T.zones = []; T.roads = [];
      const bad = canPlace(s, 'zone', z.x, ny, 0);
      T.objs = objs0; T.zones = zs; T.roads = roads0;
      if (bad) return;
      z.y = ny; for (const o of mine) o.y += dy;
      T.roads = null; initRoads(s); T.rv = (T.rv || 0) + 1;
    } catch (e) { }
  }
  // ---------------- state ----------------
  function ensure(s) {
    if (!s.town) s.town = { objs: [], seq: 1, day: (s.clock && s.clock.day) || 1, svc: 0, low: 0, best: 0, log: [], why: {}, moved: 0, left: 0 };
    if (!s.town.residents) s.town.residents = [];
    if (!s.town.zones) {
      s.town.zones = []; const z = firstZone(s); s.town.zones.push(z);
      const starters = s.town.objs.filter(o => o.k === 'cottage' && !o.paid);
      if (!s.town.objs.length) for (let i = 0; i < 4; i++) s.town.objs.push({ id: s.town.seq++, k: 'cottage', x: 0, y: 0, r: 0, n: 2, paid: 0, cw: (i * 3 + 1) % 8, cr: (i * 5 + 2) % 8, starter: 1 });
      const toMove = s.town.objs.filter(o => o.starter || (o.k === 'cottage' && !o.paid));
      for (const o of toMove) { o.x = LAY_FAR; o.y = LAY_FAR; }
      for (const o of toMove) { const L = zoneLots(s, o.k)[0]; if (L) { o.x = L.x; o.y = L.y; o.r = 0; } }
      s.town.objs = s.town.objs.filter(o => o.x !== LAY_FAR);
      s.town.best = Math.max(s.town.best || 0, pop(s));
    }
    if (!s.town.roads) initRoads(s);
    if (!s.town.m18) moveStartZone(s);
    if (s.town.objs) {
      for (const o of s.town.objs) {
        if (o.k === 'zoo' || o.k === 'shelter') {
          if (o.k === 'zoo') o.r = 0;
          if (o.k === 'zoo' && !o.bigZoo2) {
            o.bigZoo = 1; o.bigZoo2 = 1;
            if (o.x + D.zoo.w > -2 && o.x < 0) o.x -= 8;
            if (o.y + D.zoo.d > -2 && o.y < 0) o.y -= 6;
            const bx = { x: o.x, y: o.y, w: D[o.k].w, d: D[o.k].d };
            s.town.objs = s.town.objs.filter(q => q === o || !D[q.k] || D[q.k].cat !== 'tree' || !overlap(bx, { x: q.x, y: q.y, w: 1, d: 1 }));
            if (s.town.roads) {
              const before = s.town.roads.length;
              s.town.roads = s.town.roads.filter(rk => { const [rx, ry] = rk.split(',').map(Number); return !(rx >= bx.x && rx < bx.x + bx.w && ry >= bx.y && ry < bx.y + bx.d); });
              if (s.town.roads.length !== before) { s.town.rv = (s.town.rv || 0) + 1; _rkey = ''; }
            }
            if (canPlace(s, o.k, o.x, o.y, 0, o.id)) {
              const p = nearFree(s, o.k, o.x, o.y, 0, o.id, 95);
              if (p) { o.x = p.x; o.y = p.y; }
            }
          }
        }
      }
    }
    // v2026-10-08: 기존 세이브의 집(tower/family/yard/barn/twostory/row/villa)을 새 12단계 티어
    // 사다리(cottage + o.tier)로 한 번만 옮겨줌 -- 예전 종류+레벨의 수용인원에 제일 가까운 티어로 매핑해서
    // 그동안의 투자가 허무하게 사라지지 않도록 함. cottage인데 tier가 없는 집(기존 오두막들)은 1단계로.
    if (s.town.objs) {
      const LEGACY_BASE_TIER = { cottage: 1, tower: 3, family: 5, yard: 5, barn: 6, twostory: 7, row: 9, villa: 12 };
      for (const o of s.town.objs) {
        if (!D[o.k] || D[o.k].cat !== 'house') continue;
        if (o.k !== 'cottage') {
          const base = LEGACY_BASE_TIER[o.k] || 1, oldLv = Math.min(3, o.lv || 1);
          o.tier = Math.min(HOUSE_TIER_MAX, base + (oldLv - 1));
          o.k = 'cottage'; delete o.lv;
        } else if (!o.tier) o.tier = 1;
      }
    }
    syncFacilityGateRoads(s);
    return s.town;
  }
  // building levels (v1.3): shops/public buildings go Lv1 -> Lv3. 집(house)은 더 이상 이 lv를 안 쓰고
  // o.tier(1~12)를 씀 -- 아래에서 cat==='house'일 때는 전부 티어 쪽으로 위임함.
  const LV_MAX = 3, lvOf = o => D[o.k] && D[o.k].cat === 'house' ? tierOf(o) : Math.min(LV_MAX, o.lv || 1), lvMul = o => 1 + .5 * (Math.min(LV_MAX, o.lv || 1) - 1); // Lv2 x1.5, Lv3 x2 happiness / residents served (civic 전용)
  const capOf = o => D[o.k].cat === 'house' ? houseCapOf(o) : D[o.k].cap + (lvOf(o) - 1) * Math.ceil(D[o.k].cap / 2); // houses: every level adds half the rooms again
  const upNeed = o => D[o.k].cat === 'house' ? ((houseNextReq(o) || {}).pop || 0) : (D[o.k].need || 0) + (lvOf(o) === 1 ? 20 : 60); // residents needed for the next level
  const upCost = o => D[o.k].cat === 'house' ? ((houseNextReq(o) || {}).cost || 0) : Math.round(D[o.k].cost * lvOf(o) * 1.2 / 100) * 100;
  const upLevel = o => D[o.k].cat === 'house' ? ((houseNextReq(o) || {}).lvl || 0) : 0; // 집 업그레이드에 필요한 플레이어 레벨 (civic은 레벨 조건 없음)
  const canUp = o => D[o.k] && D[o.k].cat === 'house' ? canUpHouse(o) : (D[o.k] && D[o.k].cat === 'civic' && lvOf(o) < LV_MAX);
  const houses_ = s => ((s.town && s.town.objs) || []).filter(o => D[o.k] && D[o.k].cat === 'house');
  const pop = s => houses_(s).reduce((a, o) => a + (o.n || 0), 0);
  const cap = s => houses_(s).reduce((a, o) => a + capOf(o), 0);
  const houseUpOk = o => { const req = houseNextReq(o); if (!req) return false; return (typeof S !== 'undefined' && S && (S.level || 1) >= req.lvl) && pop(S) >= req.pop; };
  // 새 집을 "놓는" 것 자체도 레벨로 잠김: 집을 n채 이미 가지고 있으면 (n+1)번째 집은 레벨 1+2n이 필요
  // (예: 첫 집은 레벨1, 2번째 집은 레벨3, 3번째 집은 레벨5...) -- 돈만 있으면 무한정 집을 늘릴 수 없게 함
  const HOUSE_SLOT_LVL_STEP = 2;
  const nextHouseSlotLevel = s => 1 + houses_(s).length * HOUSE_SLOT_LVL_STEP;
  const canPlaceNewHouse = s => (s.level || 1) >= nextHouseSlotLevel(s);
  const countOf = (s, k) => ((s.town && s.town.objs) || []).filter(o => o.k === k).length;
  const stageOf = (s, o) => { const d = D[o.k]; if (!d || !d.grow) return 2; const age = ((s.clock && s.clock.day) || 1) - (o.pd == null ? 1 : o.pd); return age >= d.grow[d.grow.length - 1] ? 2 : age >= d.grow[0] ? 1 : 0; };
  // the big amenities that already exist in the game: [id, happiness, residents they can serve, built?]
  const AMEN = [['park', 10, 40, s => s.park && s.park.built], ['lake', 8, 30, s => s.village && s.village.lake], ['avenue', 6, 20, s => s.village && s.village.avenue],
    ['monu', 5, 10, s => s.village && s.village.monu], ['salon', 5, 15, s => s.salon && s.salon.built], ['cafe', 6, 20, s => s.cafe && s.cafe.built],
    ['hosp', 6, 25, s => s.hosp && s.hosp.built], ['coop', 2, 5, s => s.farm && s.farm.coop]];
  function stats(s) {
    const T = s.town || { objs: [], svc: 0 }, P = pop(s), C = cap(s);
    let fac = 0, sup = TOWN_BAL.SUP0, green = 0; const facs = [];
    for (const [id, h, su, ok] of AMEN) if (ok(s)) { fac += h; sup += su; facs.push(id); }
    const per = {};
    for (const o of T.objs) {
      const d = D[o.k]; if (!d) continue;
      if (d.cat === 'tree') { const st = stageOf(s, o); green += st === 2 ? d.hap : st === 1 ? d.hap * .5 : d.hap * .2; }
      else if (d.cat === 'deco' || d.cat === 'civic') { per[o.k] = (per[o.k] || 0) + 1; if (per[o.k] <= (d.max || 99)) { fac += d.hap * lvMul(o); sup += (d.sup || 0) * lvMul(o); } }
    }
    fac = Math.min(TOWN_BAL.FAC_CAP + civicCap(T), fac); green = Math.min(TOWN_BAL.GREEN_CAP + 4 * Math.min(2, per.florist || 0), green); // 💐 florists: more room for greenery
    const crowd = P > sup ? Math.min(30, (P - sup) * TOWN_BAL.CROWD_K) : 0, svc = T.svc || 0;
    // 편의시설(fac)과 나무/꽃(green) 밸런스: 행복지수 70 이상에서는 초과 기여분이 0.2배로 점진적 증가
    const coreHap = TOWN_BAL.H0 + svc - crowd;
    const bonusHap = fac + green;
    const rawHap = coreHap + bonusHap;
    let finalHap;
    if (rawHap <= 70) {
      finalHap = rawHap;
    } else if (coreHap <= 70) {
      finalHap = 70 + (rawHap - 70) * 0.2;
    } else {
      finalHap = coreHap + bonusHap * 0.2;
    }
    const hap = Math.max(0, Math.min(100, Math.round(finalHap)));
    return { pop: P, cap: C, sup, fac, green, svc, crowd, hap, facs, best: Math.max(T.best || 0, P) };
  }
  const civicCap = T => ((T && T.objs) || []).some(o => D[o.k] && D[o.k].cat === 'civic') ? 20 : 0; // shops & public buildings can push facility happiness past the old cap
  const occFrac = h => Math.max(.35, Math.min(1, .35 + (h - 20) * .013));
  // the shop side: more residents = more (and a bit richer) customers
  const custK = s => { const P = pop(s); return Math.max(.75, Math.min(TOWN_BAL.CUST_CAP, .75 + P / 60)); };
  const maxAdd = s => Math.min(4, Math.floor(pop(s) / 40));
  const has = (s, k) => Math.min((D[k] && D[k].max) || 1, countOf(s, k));
  const pow = (s, k) => ((s.town && s.town.objs) || []).filter(o => o.k === k).slice(0, (D[k] && D[k].max) || 1).reduce((a, o) => a + lvMul(o), 0); // Lv2 = 1.5 copies' worth
  const spendK = s => { const st = stats(s); return (.9 + Math.min(.3, st.pop / 500)) * (.9 + st.hap / 500) * (1 + .02 * pow(s, 'conv') + .03 * pow(s, 'bakery') + .03 * pow(s, 'market')); }; // 🏪🥐🛒 shops nearby: people spend a bit more
  const bestPop = s => Math.max((s.town && s.town.best) || 0, pop(s));
  // happiness from how the shops treat people (pets people want, waiting, café food...)
  function mood(s, dv, why) {
    const T = s.town; if (!T) return;
    T.svc = Math.max(-20, Math.min(15, (T.svc || 0) + dv));
    if (why) T.why[why] = (T.why[why] || 0) + 1;
  }
  function ev_(s, e) { e.id = s.seq++; e.t = Date.now(); s.events.push(e); if (s.events.length > 40) s.events.splice(0, s.events.length - 40); }
  function logDay(s, txt) { const T = s.town; T.log.unshift({ d: s.clock.day, x: txt }); T.log.length = Math.min(T.log.length, 12); }
  // a new day: people move in or out, service happiness fades back toward zero, saplings grow
  function newDay(s) {
    const T = s.town, st = stats(s), hs = houses_(s), day = s.clock.day;
    const target = Math.floor(st.cap * occFrac(st.hap));
    let moved = 0, left = 0;
    if (st.pop < target) {
      let n = Math.min(target - st.pop, Math.max(1, Math.ceil(st.cap * TOWN_BAL.MOVE_IN)) + countOf(s, 'busstop') + Math.round(2 * pow(s, 'school'))); // 🏫 families move in for the school
      const open = hs.filter(o => (o.n || 0) < capOf(o)).sort((a, b) => (a.n || 0) / capOf(a) - (b.n || 0) / capOf(b));
      for (const o of open) { while (n > 0 && (o.n || 0) < capOf(o)) { o.n = (o.n || 0) + 1; n--; moved++; } if (n <= 0) break; }
    }
    T.low = st.hap < TOWN_BAL.LOW ? (T.low || 0) + 1 : 0;
    if (day > TOWN_BAL.GRACE && T.low >= TOWN_BAL.LOW_DAYS && st.pop > 4) {
      let n = Math.max(1, Math.ceil(st.pop * (TOWN_BAL.LOW - st.hap) / 100 * .6 * (has(s, 'fire') ? .5 : 1))); // 🚒 a fire station makes people feel safe: half as many leave
      const full = hs.filter(o => (o.n || 0) > 0).sort((a, b) => (b.n || 0) - (a.n || 0));
      for (const o of full) { while (n > 0 && o.n > 0 && st.pop - left > 4) { o.n--; n--; left++; } if (n <= 0) break; }
    }
    T.svc = Math.round((T.svc || 0) * .6 * 10) / 10; // yesterday's service fades T.why = {}; T.day = day;
    T.best = Math.max(T.best || 0, pop(s));
    if (moved) logDay(s, '+' + moved); if (left) logDay(s, '-' + left);
    if (moved || left) ev_(s, { k: 'townDay', moved, left, hap: st.hap });
    syncResidents(s); // move-ins/move-outs above change o.n per house, so the resident roster needs to catch up
    for (const r of T.residents) r.happy = Math.round(Math.max(0, Math.min(100, (r.happy == null ? st.hap : r.happy) * .85 + st.hap * .15))); // personal happiness drifts gently toward how the whole town feels
    checkMilestones(s);
  }
  function checkMilestones(s) {
    const T = s.town, b = bestPop(s); T.ms = T.ms || 0;
    for (const m of TOWN_MS) if (m.pop > T.ms && b >= m.pop) { T.ms = m.pop; ev_(s, { k: 'townMs', pop: m.pop }); }
  }
  // grace days in a row with low happiness before anybody leaves is TOWN_BAL.LOW_DAYS; the first TOWN_BAL.GRACE days nobody leaves at all
  function tick(s, dt) {
    const T = ensure(s);
    if (T.day !== s.clock.day) newDay(s);
    if (!T.residentsInit) { syncResidents(s); T.residentsInit = 1; } // first load on an existing save: backfill residents once, immediately (don't wait for the next day)
    // the shop grew over a house? move that house to the nearest free spot (host only: guests never tick)
    fitShop(s);
  }
  // the shop or big building grew: roads and trees/flowers under the expanded building naturally disappear (자연스럽게 삭제), houses/big lots move to nearest free spot
  function clearBuildingOverlaps(s) {
    const T = s && s.town; if (!T) return 0;
    const inBuildingTile = (x, y) => inActualBuilding(s, x, y);
    let refundCoins = 0, refundCount = 0;
    // 길 삭제 및 100% 비용 환불 (실제 건물 내부에 들어간 타일만 제거)
    if (T.roads) {
      T.rcost = T.rcost || {};
      const kept = [];
      for (const k of T.roads) {
        const [x, y] = k.split(',').map(Number);
        if (!autoGateTileSet(s).has(k) && inBuildingTile(x, y)) {
          const st = (T.rstyle && T.rstyle[k]) || 'cobble';
          const rDef = ROAD_TYPES.find(r => r.id === st) || { cost: 20 };
          const paid = (T.rcost[k] != null) ? T.rcost[k] : rDef.cost;
          refundCoins += paid;
          refundCount++;
          if (T.rstyle) delete T.rstyle[k];
          delete T.rcost[k];
        } else {
          kept.push(k);
        }
      }
      if (refundCount > 0) {
        T.roads = kept;
        T.rv = (T.rv || 0) + 1;
        _rkey = '';
        s.coins = (s.coins || 0) + refundCoins;
        const now = Date.now();
        if (typeof toast === 'function' && (!T._lastRefundToast || now - T._lastRefundToast > 4000)) {
          T._lastRefundToast = now;
          const msg = (typeof t === 'function' && t('roadRefundToast', { n: refundCount, c: refundCoins })) ||
            `건물 확장 구역의 길 ${refundCount}개가 철거되어 🪙${refundCoins}이 100% 환불되었습니다!`;
          toast(msg);
        }
      }
    }
    // 건물 확장으로 겹치게 된 나무, 꽃, 작은 장식물은 자연스럽게 사라짐
    if (T.objs) {
      T.objs = T.objs.filter(o => {
        const d = D[o.k];
        if (d && (d.cat === 'tree' || (d.cat === 'deco' && d.w === 1 && d.d === 1))) {
          if (inBuildingTile(o.x, o.y)) return false; // disappear cleanly
        }
        return true;
      });
    }
    return refundCoins;
  }
  function fitShop(s) {
    const T = s && s.town; if (!T) return;
    const trLv = ((typeof TRAIN !== 'undefined' && s.train && s.train.lv) || 1);
    const key = Wd(s) + 'x' + Hd(s) + ':' + ((s.cafe && s.cafe.lv) || 0) + ':' + ((s.hosp && s.hosp.lv) || 0) + ':tr' + trLv;
    if (T.fitKey !== key) {
      T.fitKey = key;
      clearBuildingOverlaps(s);
      relocateBuildingsOffTracks(s);
      for (const k of TOWN_BIG) {
        const L = LAY(k, s);
        if (L && !D[k].noPlace && canPlace(s, k, L.x, L.y, 0, k)) {
          const p = nearFree(s, k, L.x, L.y, 0, k, 70);
          if (p) { L.x = p.x; L.y = p.y; }
        }
      }
      for (const o of T.objs) {
        if (['tTaken', 'tOut'].includes(canPlace(s, o.k, o.x, o.y, o.r, o.id))) {
          const p = nearFree(s, o.k, o.x, o.y, o.r, o.id);
          if (p) { o.x = p.x; o.y = p.y; }
        }
      }
    }
  }
  function findSpotOutsideTracks(s, k, curX, curY, r, ignore) {
    const W = Wd(s);
    const tx = (typeof TRAIN !== 'undefined' && typeof TRAIN.TRACK_X === 'function') ? TRAIN.TRACK_X() : (W + 12.5);
    const minEastX = Math.ceil(tx + 2.0); // e.g. W + 15 (철로 동쪽 안전 마진)
    const targetX = Math.max(curX, minEastX);
    const targetY = curY;

    // 1. 철로 동쪽 동일 Y 레벨이 바로 가능한지 확인 (길 타일이 있는 경우 길 자동 제거 가능하므로 허용)
    const err0 = canPlace(s, k, targetX, targetY, r, ignore);
    if (!err0 || err0 === 'tOnPath') {
      return { x: targetX, y: targetY };
    }

    // 2. target 위치 주변 나선 탐색 (철로 밖 기준)
    const p = nearFree(s, k, targetX, targetY, r, ignore, 95);
    if (p) return p;

    // 3. 예외 시 기존 좌표 기준 나선 탐색
    return nearFree(s, k, curX, curY, r, ignore, 120);
  }
  // 철로 업데이트 전 지어진 건물이 철로와 겹칠 경우 철로 밖으로 자동 이동
  function relocateBuildingsOffTracks(s) {
    const T = s && s.town; if (!T) return false;
    const W = Wd(s);
    const tx = (typeof TRAIN !== 'undefined' && typeof TRAIN.TRACK_X === 'function') ? TRAIN.TRACK_X() : (W + 12.5);
    let movedAny = false;

    // 1. 대형 부지 건물 (농장, 내집, 카페, 병원, 미용실, 공원, 호수, 기념광장, 목장 등)
    for (const bk of TOWN_BIG) {
      const L = LAY(bk, s);
      const bd = D[bk];
      if (L && bd && !bd.noPlace && L.x > -1000) {
        const box = { x: L.x, y: L.y, w: bd.w, d: bd.d };
        if (overlapsTrain(box, s)) {
          const p = findSpotOutsideTracks(s, bk, L.x, L.y, 0, bk);
          if (p) {
            L.x = p.x;
            L.y = p.y;
            movedAny = true;
            _resKey = '';
          }
        }
      }
    }

    // 2. 주택가 구역 (residential zones)
    if (T.zones) {
      for (const z of T.zones) {
        const zw = z.w || D.zone.w, zd = z.d || D.zone.d;
        if (overlapsTrain({ x: z.x, y: z.y, w: zw, d: zd }, s)) {
          const targetX = Math.max(z.x, Math.ceil(tx + 2.0));
          const targetY = z.y;
          let p = null;
          if (!canPlace(s, 'zone', targetX, targetY, z.r || 0)) {
            p = { x: targetX, y: targetY };
          } else {
            p = nearFree(s, 'zone', targetX, targetY, z.r || 0, null, 95);
          }
          if (p) {
            const dx = p.x - z.x, dy = p.y - z.y;
            for (const o of (T.objs || [])) {
              if (o.x >= z.x && o.x < z.x + zw && o.y >= z.y && o.y < z.y + zd) {
                o.x += dx;
                o.y += dy;
              }
            }
            z.x = p.x;
            z.y = p.y;
            movedAny = true;
          }
        }
      }
    }

    // 3. 배치된 마을 오브젝트 (동물원 zoo, 쉘터, 공공시설, 주택 등)
    if (T.objs) {
      for (const o of T.objs) {
        const d = D[o.k];
        if (!d) continue;
        const g = fpOf(o.k, o.r);
        const box = { x: o.x, y: o.y, w: g.w, d: g.d };
        if (overlapsTrain(box, s)) {
          if (d.cat === 'civic' || (d.cat === 'deco' && (d.w > 1 || d.d > 1))) {
            const p = findSpotOutsideTracks(s, o.k, o.x, o.y, o.r, o.id);
            if (p) {
              o.x = p.x;
              o.y = p.y;
              movedAny = true;
            }
          } else if (d.cat === 'house') {
            const lots = zoneLots(s, o.k);
            const freeLot = lots.find(l => !overlapsTrain({ x: l.x, y: l.y, w: g.w, d: g.d }, s));
            if (freeLot) {
              o.x = freeLot.x;
              o.y = freeLot.y;
              movedAny = true;
            } else {
              const p = findSpotOutsideTracks(s, o.k, o.x, o.y, o.r, o.id);
              if (p) {
                o.x = p.x;
                o.y = p.y;
                movedAny = true;
              }
            }
          }
        }
      }

      // 철로 위에 겹쳐있는 나무 및 1x1 장식물 정리
      const beforeObj = T.objs.length;
      T.objs = T.objs.filter(o => {
        const d = D[o.k];
        if (d && (d.cat === 'tree' || (d.cat === 'deco' && d.w === 1 && d.d === 1))) {
          if (overlapsTrain({ x: o.x, y: o.y, w: 1, d: 1 }, s)) return false;
        }
        return true;
      });
      if (T.objs.length !== beforeObj) movedAny = true;
    }

    // 4. 철로 위 길 타일 자동 정리 (단, 건널목은 보존)
    if (T.roads) {
      const beforeR = T.roads.length;
      T.roads = T.roads.filter(k => {
        const [rx, ry] = k.split(',').map(Number);
        const drop = overlapsTrain({ x: rx, y: ry, w: 1, d: 1 }, s) && !isRailCrossing(s, ry);
        if (drop && T.rstyle) delete T.rstyle[k];
        return !drop;
      });
      if (T.roads.length !== beforeR) {
        T.rv = (T.rv || 0) + 1;
        _rkey = ''; _railCwKey = '';
        movedAny = true;
      }
    }

    // 5. 건물이 옮겨간 새 자리 밑에 있던 도로 및 나무 정리
    if (movedAny) {
      clearBuildingOverlaps(s);
      _resKey = '';
    }
    return movedAny;
  }
  function nearFree(s, k, x0, y0, r, ignore, maxR) {
    for (let R = 1; R < (maxR || 40); R++) for (let dx = -R; dx <= R; dx++) for (const dy of [-R, R]) { for (const [x, y] of [[x0 + dx, y0 + dy], [x0 + dy, y0 + dx]]) if (!canPlace(s, k, x, y, r, ignore)) return { x, y }; }
    return null;
  }
  // which house a customer walks out of (weighted by residents); returns the door tile
  function doorOf(o) {
    const r = ((o.r || 0) % 2 + 2) % 2;
    return r === 1 ? { x: o.x + 3, y: o.y + 4 } : { x: o.x + 2, y: o.y + 4 };
  }
  function pickHome(s) {
    const hs = houses_(s).filter(o => o.n > 0), tot = hs.reduce((a, o) => a + o.n, 0); if (!tot) return null;
    let r = Math.random() * tot; for (const o of hs) { r -= o.n; if (r <= 0) return o; } return hs[0];
  }
  // ---------------- fixed residents (v2026-10-08): each house's "o.n" head-count gets real, persistent people ----------------
  // (same look/name every time, their own happiness, and the pets they've actually bought from the shop) instead of a
  // fresh random face every single time someone steps out the door.
  const rpick = arr => arr[Math.floor(Math.random() * arr.length)];
  function syncResidents(s) { // keeps T.residents in step with who actually lives where (called every tick; cheap)
    const T = ensure(s), hs = houses_(s), liveHomes = new Set(hs.map(o => o.id));
    if (!T.residents) T.residents = [];
    if (T.residents.some(r => !liveHomes.has(r.home))) T.residents = T.residents.filter(r => liveHomes.has(r.home));
    const lang = (typeof CFG !== 'undefined' && CFG.lang) || (s && s.lang) || 'ko';

    // 기존 주민 중 언어/성별 불일치 이름이나 중복 이름이 있으면 바르게 수정 (한글/러시아어 전환 완벽 지원)
    const seenNames = new Set();
    for (const r of T.residents) {
      const g = (typeof ART !== 'undefined' && ART.genderOf) ? ART.genderOf(r.seed) : 'm';
      const mismatch = (typeof isMismatchedGenderName === 'function') && isMismatchedGenderName(r.name, g, lang);
      if (seenNames.has(r.name) || mismatch || !r.name || r.name === '주민') {
        r.name = (typeof pickHumanName === 'function') ? pickHumanName(lang, r.seed, seenNames) : r.name;
      }
      seenNames.add(r.name);
    }

    const byHome = {};
    for (const r of T.residents) (byHome[r.home] = byHome[r.home] || []).push(r);
    for (const o of hs) {
      // clamp to the house's real capacity -- o.n can occasionally end up larger than the house can actually hold (a pre-existing
      // data quirk, not something this system should blindly multiply into dozens of resident records for one tiny cottage)
      const have = byHome[o.id] || [], want = Math.max(0, Math.min(o.n || 0, capOf(o)));
      if (have.length < want) {
        for (let i = have.length; i < want; i++) {
          T.rseq = (T.rseq || 0) + 1;
          const seed = 1 + Math.floor(Math.random() * 999999);
          const name = (typeof pickHumanName === 'function') ? pickHumanName(lang, seed, seenNames) : '주민';
          seenNames.add(name);
          T.residents.push({ id: 'res' + T.rseq, home: o.id, seed, name, happy: 62 + Math.floor(Math.random() * 16), pets: [] });
        }
      } else if (have.length > want) {
        // somebody moved away: let go of the newest arrivals first, keep the ones who already have pets (nicer to not lose their history)
        const extra = have.slice().sort((a, b) => (a.pets.length - b.pets.length) || (b.id < a.id ? -1 : 1)).slice(0, have.length - want);
        const drop = new Set(extra.map(r => r.id));
        T.residents = T.residents.filter(r => !drop.has(r.id));
      }
    }
  }
  function pickResidentOf(s, home) { // a specific, persistent person who lives in this house
    if (!home) return null;
    syncResidents(s);
    const T = ensure(s), list = (T.residents || []).filter(r => r.home === home.id);
    return list.length ? rpick(list) : null;
  }
  function residentById(s, rid) { if (!rid) return null; const T = ensure(s); return (T.residents || []).find(r => r.id === rid) || null; }
  function residentsOf(s, homeId) { syncResidents(s); const T = ensure(s); return (T.residents || []).filter(r => r.home === homeId); } // everyone who lives in one specific house
  const ADDR_DONG = ['행복동', '사랑동', '햇살동', '초록동', '무지개동', '별빛동', '꽃동네', '푸른동', '포근동', '다솜동'];
  const ADDR_DONG_RU = ['Солнечная', 'Радужная', 'Зелёная', 'Цветочная', 'Звёздная', 'Уютная', 'Тёплая', 'Весёлая', 'Ласковая', 'Дружная'];
  function addressOf(s, o) { // a stable, human-readable "address" for a house, derived from its own id so it never changes
    if (!o) return '';
    const lang = (s && s.lang) || (typeof S !== 'undefined' && S && S.lang) || 'ko';
    const dongs = lang === 'ru' ? ADDR_DONG_RU : ADDR_DONG;
    const dong = dongs[o.id % dongs.length], ho = (o.id * 7 + 3) % 90 + 10;
    return lang === 'ru' ? `ул. ${dong}, д. ${ho}` : `${dong} ${ho}번지`;
  }
  const kindCost = (s, k) => { const d = D[k], n = ((s.town && s.town.objs) || []).filter(o => o.k === k && o.paid).length; return Math.round(d.cost * (1 + TOWN_BAL.COST_STEP * n) / 50) * 50; }; // the free starter houses don't count
  const houseTierBuyCost = (s, tier) => {
    const t = Math.max(1, Math.min(HOUSE_TIER_MAX, tier | 0));
    const baseCost = kindCost(s, 'cottage');
    let extra = 0;
    for (let i = 2; i <= t; i++) {
      extra += (HOUSE_TIERS[i] ? HOUSE_TIERS[i].cost : 0);
    }
    return baseCost + extra;
  };
  const unlockedK = (s, k) => bestPop(s) >= (D[k].need || 0);
  const bigBuilt = (s, k) => k === 'cafe' ? !!(s.cafe && s.cafe.built) : k === 'hosp' ? !!(s.hosp && s.hosp.built) : k === 'salon' ? !!(s.salon && s.salon.built) : k === 'park' ? !!(s.park && s.park.built)
    : (k === 'lake' || k === 'monu' || k === 'avenue') ? !!(s.village && s.village[k]) : !!(s.lay && s.lay[k]);
  function applyTown(s, a, by) {
    if (a.t === 'tbig') {
      const d = D[a.k]; if (!d || d.cat !== 'big' || bigBuilt(s, a.k)) return { err: 'gone' };
      if (d.rep && repTier(s.rep || 0) < d.rep) return { err: 'tNeedRep', p: { t: (REP_TIERS[d.rep] || {}).ic || '⭐' } };
      s.lay = s.lay || {};
      if (!d.noPlace) { const e = canPlace(s, a.k, a.x, a.y, 0); if (e) return { err: e }; }
      if (d.act) {
        if (!d.noPlace) s.lay[a.k] = { x: a.x, y: a.y };
        const r = G.apply(s, { t: d.act, k: a.k, text: a.text, looks: a.looks, lang: a.lang }, by);
        if (!r || r.err) { if (!d.noPlace) delete s.lay[a.k]; return r || { err: 'gone' }; }
        if (typeof G !== 'undefined' && G.addXpPublic) G.addXpPublic(s, 20);
        return r;
      }
      if (s.coins < d.cost) return { err: 'notEnough' };
      s.coins -= d.cost; s.lay[a.k] = { x: a.x, y: a.y };
      if (a.k === 'farm' && typeof FARM !== 'undefined' && FARM.ensure) FARM.ensure(s);
      clearBuildingOverlaps(s);
      if (typeof G !== 'undefined' && G.addXpPublic) G.addXpPublic(s, 10);
      return { ok: 1, fx: 'coin', msg: 'tBigBuilt_' + a.k };
    }
    if (a.t === 'tbigmove') {
      const d = D[a.k], L = s.lay && s.lay[a.k]; if (!d || !L) return { err: 'gone' };
      if (d.live && s.clock && s.clock.ph === 'open') return { err: 'tMoveClosed' };
      const e = canPlace(s, a.k, a.x, a.y, 0, a.k); if (e) return { err: e };
      L.x = a.x; L.y = a.y;
      clearBuildingOverlaps(s);
      return { ok: 1, msg: 'tMoved' };
    }
    if (a.t === 'tbuild') {
      const d = D[a.k]; if (!d) return { err: 'gone' }; ensure(s);
      if (!unlockedK(s, a.k)) return { err: 'tLocked', p: { n: d.need } };
      // v2026-10-08: 새 집을 "놓는" 것도 레벨로 잠김 -- 돈만 있다고 무한정 집을 늘릴 수 없게 함
      if (d.cat === 'house' && !canPlaceNewHouse(s)) return { err: 'tHouseSlotLock', p: { n: nextHouseSlotLevel(s) } };
      const e = canPlace(s, a.k, a.x, a.y, normR(a.k, a.r)); if (e) return { err: e };

      if (d.cat === 'house') {
        const tier = a.tier ? Math.min(HOUSE_TIER_MAX, Math.max(1, a.tier | 0)) : 1;
        const tierReq = HOUSE_TIERS[tier] || HOUSE_TIERS[1];
        if ((s.level || 1) < tierReq.lvl) return { err: 'tHouseLockLvl', p: { n: tierReq.lvl } };
        if (pop(s) < tierReq.pop) return { err: 'tHouseLockPop', p: { n: tierReq.pop } };
        const tierCost = houseTierBuyCost(s, tier);
        if (s.coins < tierCost) return { err: 'notEnough' };
        s.coins -= tierCost;
        const o = { id: s.town.seq++, k: 'cottage', x: a.x, y: a.y, r: normR(a.k, a.r), paid: tierCost, tier };
        o.n = Math.min(houseCapOf(o), Math.floor(houseCapOf(o) * occFrac(stats(s).hap) * .5));
        o.cw = Math.floor(Math.random() * 8); o.cr = Math.floor(Math.random() * 8);
        s.town.objs.push(o); s.town.best = Math.max(s.town.best || 0, pop(s)); checkMilestones(s);
        clearBuildingOverlaps(s);
        if (typeof G !== 'undefined' && G.addXpPublic) G.addXpPublic(s, 5);
        return { ok: 1, fx: 'coin', msg: o.n ? 'tBuiltHouse' : 'tBuiltHouse0', p: { n: o.n || 0 } };
      }

      const cost = kindCost(s, a.k); if (s.coins < cost) return { err: 'notEnough' };
      s.coins -= cost;
      const o = { id: s.town.seq++, k: a.k, x: a.x, y: a.y, r: normR(a.k, a.r), paid: cost };
      if (a.k === 'zoo') o.bigZoo = 1;
      if (d.cat === 'tree') o.pd = s.clock.day;
      if (d.cat === 'civic') {
        const bx = { x: o.x, y: o.y, w: fpOf(o.k, o.r).w, d: fpOf(o.k, o.r).d };
        s.town.objs = s.town.objs.filter(q => !D[q.k] || D[q.k].cat !== 'tree' || !overlap(bx, { x: q.x, y: q.y, w: 1, d: 1 }));
      }
      s.town.objs.push(o); s.town.best = Math.max(s.town.best || 0, pop(s)); checkMilestones(s);
      clearBuildingOverlaps(s);
      if (typeof G !== 'undefined' && G.addXpPublic) G.addXpPublic(s, d.cat === 'deco' ? 2 : 0);
      return { ok: 1, fx: 'coin', msg: d.cat === 'tree' ? 'tPlanted' : 'tBuilt' };
    }
    if (a.t === 'tmove') {
      const o = obj(s, a.id); if (!o) return { err: 'gone' };
      const e = canPlace(s, o.k, a.x, a.y, normR(o.k, a.r), o.id); if (e) return { err: e };
      o.x = a.x; o.y = a.y; o.r = normR(o.k, a.r);
      if (D[o.k] && D[o.k].cat === 'civic') {
        const bx = { x: o.x, y: o.y, w: fpOf(o.k, o.r).w, d: fpOf(o.k, o.r).d };
        s.town.objs = s.town.objs.filter(q => q === o || !D[q.k] || D[q.k].cat !== 'tree' || !overlap(bx, { x: q.x, y: q.y, w: 1, d: 1 }));
      }
      clearBuildingOverlaps(s);
      return { ok: 1, msg: 'tMoved' };
    }
    if (a.t === 'troad') { // pave (on) or erase a list of tiles
      ensure(s); const T = s.town, R = roadSet(s), tiles = (a.tiles || []).slice(0, 300).map(p => (p[0] | 0) + ',' + (p[1] | 0));
      T.rstyle = T.rstyle || {};
      T.rcost = T.rcost || {};
      const style = (ROAD_TYPES.find(q => q.id === a.style) ? a.style : 'cobble');
      const rDef = ROAD_TYPES.find(q => q.id === style) || ROAD_TYPES[0];
      if (a.on) {
        if ((s.level || 1) < (rDef.lvl || 1)) return { err: 'tLocked', p: { n: rDef.lvl } };
        const add = [...new Set(tiles)].filter(k => (!R.has(k) || (T.rstyle[k] || 'cobble') !== style) && roadTileOk(s, ...k.split(',').map(Number)));
        if (!add.length) return { err: 'tRoadNone' };
        const cost = add.length * rDef.cost;
        if (s.coins < cost) return { err: 'notEnough' };
        s.coins -= cost;
        for (const k of add) {
          if (!R.has(k)) T.roads.push(k);
          T.rstyle[k] = style;
          T.rcost[k] = rDef.cost;
        }
        const addSet = new Set(add);
        if (s.town && s.town.objs) {
          s.town.objs = s.town.objs.filter(o => {
            const d = D[o.k];
            if (d && (d.cat === 'tree' || d.flower)) {
              if (addSet.has(o.x + ',' + o.y)) return false;
            }
            return true;
          });
        }
        T.rv = (T.rv || 0) + 1; _rkey = ''; _cwKey = ''; _railCwKey = '';
        return { ok: 1, fx: 'coin', msg: 'tRoadPaved', p: { n: add.length, c: cost } };
      }
      const del = new Set(tiles.filter(k => R.has(k))); if (!del.size) return { err: 'tRoadNone' };
      T.roads = T.roads.filter(k => !del.has(k));
      let refund = 0;
      for (const k of del) {
        const st = (T.rstyle && T.rstyle[k]) || 'dirt';
        const rt = ROAD_TYPES.find(r => r.id === st) || { cost: 10 };
        const paid = (T.rcost && T.rcost[k] != null) ? T.rcost[k] : rt.cost;
        refund += paid;
        delete T.rstyle[k];
        if (T.rcost) delete T.rcost[k];
      }
      s.coins = (s.coins || 0) + refund;
      T.rv = (T.rv || 0) + 1; _rkey = ''; _cwKey = ''; _railCwKey = '';
      if (typeof toast === 'function' && refund > 0) {
        const msg = (typeof t === 'function' && t('roadErasedRefundToast', { n: del.size, c: refund })) ||
          `길 ${del.size}개가 철거되어 🪙${refund}이 100% 환불되었습니다!`;
        toast(msg);
      }
      return { ok: 1, msg: 'tRoadErased', p: { n: del.size, c: refund } };
    }
    if (a.t === 'tzone') {
      ensure(s); const r = normR('zone', a.r), f = fpOf('zone', r);
      const e = canPlace(s, 'zone', a.x, a.y, r); if (e) return { err: e };
      const cost = zoneCost(s); if (s.coins < cost) return { err: 'notEnough' };
      s.coins -= cost; s.town.zones.push({ x: a.x, y: a.y, w: f.w, d: f.d, r });
      return { ok: 1, fx: 'coin', msg: 'tZoneBuilt' };
    }
    if (a.t === 'tup') {
      const o = obj(s, a.id); if (!o || !canUp(o)) return { err: 'gone' };
      // v2026-10-08: 집은 더 이상 o.lv가 아니라 o.tier를 쓰고, "레벨 + 마을 인구 + 코인"을 전부 따짐
      // (돈만 있으면 다 업그레이드되는 게 아니게). civic 건물들은 기존 로직(마을 인구 + 코인) 그대로.
      if (D[o.k] && D[o.k].cat === 'house') {
        const req = houseNextReq(o); if (!req) return { err: 'gone' };
        if ((s.level || 1) < req.lvl) return { err: 'tHouseLockLvl', p: { n: req.lvl } };
        if (pop(s) < req.pop) return { err: 'tHouseLockPop', p: { n: req.pop } };
        if (s.coins < req.cost) return { err: 'notEnough' };
        s.coins -= req.cost; o.paid = (o.paid || 0) + req.cost; o.tier = tierOf(o) + 1;
        clearBuildingOverlaps(s);
        if (typeof G !== 'undefined' && G.addXpPublic) G.addXpPublic(s, 5 * o.tier);
        return { ok: 1, fx: 'coin', msg: 'tUpgraded', p: { n: o.tier } };
      }
      if (bestPop(s) < upNeed(o)) return { err: 'tLocked', p: { n: upNeed(o) } };
      const cost = upCost(o); if (s.coins < cost) return { err: 'notEnough' };
      s.coins -= cost; o.paid = (o.paid || 0) + cost; o.lv = lvOf(o) + 1;
      clearBuildingOverlaps(s);
      if (typeof G !== 'undefined' && G.addXpPublic) G.addXpPublic(s, 5 * o.lv);
      return { ok: 1, fx: 'coin', msg: 'tUpgraded', p: { n: o.lv } };
    }
    if (a.t === 'tdemo') {
      const o = obj(s, a.id); if (!o) return { err: 'gone' };
      const back = Math.floor((o.paid || 0) / 2); s.coins += back;
      s.town.objs = s.town.objs.filter(q => q !== o); return { ok: 1, msg: 'tDemolished', p: { c: back } };
    }
    return undefined;
  }
  // tiles that nobody can walk through (house walls, tree trunks, fountains...)
  function houseSolid(set) {
    if (typeof S === 'undefined' || !S || !S.town) return;
    for (const o of S.town.objs) {
      const d = D[o.k]; if (!d) continue;
      if (d.cat === 'house') { for (let u = 1; u <= 3; u++) for (let v = 1; v <= 3; v++) { set.add((o.x + u) + ',' + (o.y + v)); } }
      else if (o.k === 'zoo') {
        // Grand Safari Zoo: left/right entrance kiosks and fountain core are solid!
        for (let u = 0; u < d.w; u++) for (let v = 0; v < d.d; v++) {
          // Left Ticket Kiosk (u: 9..11, v: 18..21) & Right Souvenir Kiosk (u: 15..17, v: 18..21) are strictly solid buildings!
          if (v >= d.d - 4 && ((u >= 9 && u <= 11) || (u >= 15 && u <= 17))) {
            set.add((o.x + u) + ',' + (o.y + v));
            continue;
          }
          // Fountain center stone pillar is solid (User Request 3: Character walks cleanly around fountain)
          if (u >= 12 && u <= 14 && v >= 9 && v <= 11) {
            set.add((o.x + u) + ',' + (o.y + v));
            continue;
          }
          // Walkable avenues: central promenade walkway (u: 12..14), cross avenues (v: 7..8, 13..14)
          const onWalk = (u >= 12 && u <= 14) || (v >= 7 && v <= 8) || (v >= 13 && v <= 14);
          if (onWalk) continue;
          set.add((o.x + u) + ',' + (o.y + v));
        }
      }
      else if (d.cat === 'civic') { const W0 = d.w, D0 = d.open ? d.d : d.d - 1; for (let u = 0; u < W0; u++) for (let v = 0; v < D0; v++) { if (o.k === 'gate' && u > 0 && u < W0 - 1) continue; const p = rotPt(o, u, v, d.w, d.d); set.add(p.x + ',' + p.y); } }
      else if (d.solid) { const f = fpOf(o.k, o.r); for (let u = 0; u < f.w; u++) for (let v = 0; v < f.d; v++) set.add((o.x + u) + ',' + (o.y + v)); }
    }
  }
  // what the world draws: houses in the old format ({x, y, v kind index, cw, cr}) plus trees and small facilities
  function houses() { return houses_(typeof S !== 'undefined' && S ? S : {}).map(o => ({ x: o.x, y: o.y, v: KINDS.indexOf(o.k), cw: o.cw || 0, cr: o.cr || 0, r: o.r, id: o.id, o })); }
  // v10.0: many kinds of homes, smaller and varied: tiny cottage, family house, 2-storey house, villa (apartment block),
  // house with a big yard (dog house, clothesline), gambrel-roof farmhouse, townhouse row, round-tower cottage
  // Soft & Warm Cozy Storybook Pastel Palettes
  const WALLS = ['#fdf6ea', '#fdf2f4', '#f4f8fe', '#fbf5e6', '#edf4ea', '#f8f1e9', '#fdf9f2', '#f5edf8'];
  const ROOFS = ['#d47862', '#688eb2', '#7ba689', '#cb7a8b', '#8a6e5a', '#deb35b', '#6b788a', '#967ec7'];
  const KINDS = ['cottage', 'family', 'twostory', 'villa', 'yard', 'barn', 'row', 'tower'];
  const sh = (col, k) => ART.shade ? ART.shade(col, k) : col;
  const isLit = () => S && S.clock && (S.clock.m >= 1080 || S.clock.m < 360);
  // under ROT a box keeps its shape: turn its rectangle, then draw the faces we really see (south / east) -- and give the back walls windows
  const turned = (x0, y0, w, d) => ({ x: 2 * ROT.ox + ROT.W - (x0 + w), y: 2 * ROT.oy + ROT.D - (y0 + d) });
  function blk(c, x0, y0, w, d, z0, h, col) {
    if (!ROT) return blk_(c, x0, y0, w, d, z0, h, col);
    const R = ROT, p = turned(x0, y0, w, d); ROT = null;
    try { blk_(c, p.x, p.y, w, d, z0, h, col); if (h >= 14 && z0 < 6 && w >= .7 && d >= .6) backWins(c, p.x, p.y, w, d, z0, h, col); } finally { ROT = R; }
  }
  function backWins(c, x, y, w, d, z0, h, col) { // the back of a building: rows of plain windows on the two faces we see
    const fr = sh(col, -.35), lit = isLit();
    for (let z = z0 + 5; z + 8 <= z0 + h - 3; z += 13) {
      const n = Math.max(1, Math.floor(w / .75)); for (let i = 0; i < n; i++) { const ww = Math.min(.42, (w - .3) / n - .12); if (ww > .12) winS(c, x + .15 + i * (w - .3) / n, y + d, z, ww, 8, lit && (i + z) % 3 === 0, fr); }
      const m = Math.max(1, Math.floor(d / .8)); for (let i = 0; i < m; i++) { const ww = Math.min(.45, (d - .3) / m - .12); if (ww > .12) winE(c, x + w, y + .15 + i * (d - .3) / m, z, ww, 8, lit && (i + z) % 2 === 0, fr); }
    }
  }
  const roofTurn = fn => function (c, x0, y0, w, d, ...rest) { if (!ROT) return fn(c, x0, y0, w, d, ...rest); const R = ROT, p = turned(x0, y0, w, d); ROT = null; try { return fn(c, p.x, p.y, w, d, ...rest); } finally { ROT = R; } };
  function blk_(c, x0, y0, w, d, z0, h, col) { // a box: the two faces we see (south y1, east x1) + the top
    const x1 = x0 + w, y1 = y0 + d;
    // Ground contact shadow if on ground level
    if (z0 === 0) {
      poly(c, [Q(x0 - .06, y0 - .06), Q(x1 + .08, y0 - .06), Q(x1 + .08, y1 + .08), Q(x0 - .06, y1 + .08)], 'rgba(30,20,10,.25)');
    }
    const southFace = [Q(x0, y1, z0 + h), Q(x1, y1, z0 + h), Q(x1, y1, z0), Q(x0, y1, z0)];
    const eastFace = [Q(x1, y0, z0 + h), Q(x1, y1, z0 + h), Q(x1, y1, z0), Q(x1, y0, z0)];
    const topFace = [Q(x0, y0, z0 + h), Q(x1, y0, z0 + h), Q(x1, y1, z0 + h), Q(x0, y1, z0 + h)];
    poly(c, southFace, col, ART.OUT, 1);
    poly(c, eastFace, sh(col, -.15), ART.OUT, 1);
    poly(c, topFace, sh(col, .08), ART.OUT, 1);
    // Stone foundation base for buildings
    if (z0 === 0 && h >= 14) {
      const bh = Math.min(6, h * .25);
      poly(c, [Q(x0, y1, bh), Q(x1, y1, bh), Q(x1, y1, 0), Q(x0, y1, 0)], '#a89884', ART.OUT, .8);
      poly(c, [Q(x1, y0, bh), Q(x1, y1, bh), Q(x1, y1, 0), Q(x1, y0, 0)], '#8e806e', ART.OUT, .8);
      // Foundation top bevel line
      const f1 = Q(x0, y1, bh), f2 = Q(x1, y1, bh), f3 = Q(x1, y0, bh);
      c.beginPath(); c.moveTo(f1[0], f1[1]); c.lineTo(f2[0], f2[1]); c.lineTo(f3[0], f3[1]);
      c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 1; c.stroke();
    }
    // Top front edge highlight
    const e1 = Q(x0, y1, z0 + h), e2 = Q(x1, y1, z0 + h), e3 = Q(x1, y0, z0 + h);
    c.beginPath(); c.moveTo(e1[0], e1[1]); c.lineTo(e2[0], e2[1]); c.lineTo(e3[0], e3[1]);
    c.strokeStyle = 'rgba(255,255,255,.28)'; c.lineWidth = 1.2; c.stroke();
    // Vertical corner edge highlight
    const c1 = Q(x1, y1, z0 + h), c2 = Q(x1, y1, z0);
    c.beginPath(); c.moveTo(c1[0], c1[1]); c.lineTo(c2[0], c2[1]);
    c.strokeStyle = 'rgba(255,255,255,.2)'; c.lineWidth = 1; c.stroke();
  }
  function winS(c, x, y, z, w, h, lit, fr, opts) {
    if (ROT) return;
    opts = opts || {};
    // Shutters (open on left and right)
    if (opts.shutters) {
      const sw = .22, shCol = opts.shutterCol || '#5a7862';
      // Left shutter
      poly(c, [Q(x - sw - .02, y + .01, z + h + .5), Q(x - .02, y + .01, z + h + .5), Q(x - .02, y + .01, z - .5), Q(x - sw - .02, y + .01, z - .5)], shCol, ART.OUT, .8);
      // Right shutter
      poly(c, [Q(x + w + .02, y + .01, z + h + .5), Q(x + w + sw + .02, y + .01, z + h + .5), Q(x + w + sw + .02, y + .01, z - .5), Q(x + w + .02, y + .01, z - .5)], shCol, ART.OUT, .8);
      // Shutter louver lines
      for (const sz of [z + h * .3, z + h * .7]) {
        const l0 = Q(x - sw - .01, y + .01, sz), l1 = Q(x - .03, y + .01, sz);
        c.beginPath(); c.moveTo(l0[0], l0[1]); c.lineTo(l1[0], l1[1]); c.strokeStyle = 'rgba(0,0,0,.3)'; c.lineWidth = .7; c.stroke();
        const r0 = Q(x + w + .03, y + .01, sz), r1 = Q(x + w + sw + .01, y + .01, sz);
        c.beginPath(); c.moveTo(r0[0], r0[1]); c.lineTo(r1[0], r1[1]); c.strokeStyle = 'rgba(0,0,0,.3)'; c.lineWidth = .7; c.stroke();
      }
    }
    // Outer frame with molded trim
    poly(c, [Q(x - .04, y, z + h + 1.2), Q(x + w + .04, y, z + h + 1.2), Q(x + w + .04, y, z - 1), Q(x - .04, y, z - 1)], fr || '#ffffff', ART.OUT, 1);
    // Glass pane with soft glow/sky gradient
    const pane = [Q(x, y, z + h), Q(x + w, y, z + h), Q(x + w, y, z), Q(x, y, z)];
    const p0 = Q(x, y, z + h), p1 = Q(x + w, y, z);
    const g = c.createLinearGradient(p0[0], p0[1], p1[0], p1[1]);
    if (lit) {
      g.addColorStop(0, '#fffbe0'); g.addColorStop(0.5, '#ffd255'); g.addColorStop(1, '#ff9e28');
    } else {
      g.addColorStop(0, '#e4f4fb'); g.addColorStop(0.4, '#a2d4ea'); g.addColorStop(1, '#6eaec8');
    }
    poly(c, pane, g, 'rgba(40,25,15,.55)', .8);
    // Window mullions (crossbars)
    const midX = x + w / 2, midZ = z + h / 2;
    const v0 = Q(midX, y, z + h), v1 = Q(midX, y, z);
    const h0 = Q(x, y, midZ), h1 = Q(x + w, y, midZ);
    c.beginPath(); c.moveTo(v0[0], v0[1]); c.lineTo(v1[0], v1[1]); c.moveTo(h0[0], h0[1]); c.lineTo(h1[0], h1[1]);
    c.strokeStyle = fr || '#ffffff'; c.lineWidth = 1; c.stroke();
    // Glass glint reflection streak
    if (!lit) {
      const g0 = Q(x + w * .2, y, z + h * .85), g1 = Q(x + w * .7, y, z + h * .25);
      c.beginPath(); c.moveTo(g0[0], g0[1]); c.lineTo(g1[0], g1[1]); c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 1.4; c.stroke();
    }
    // Window sill
    poly(c, [Q(x - .06, y + .06, z), Q(x + w + .06, y + .06, z), Q(x + w + .06, y, z - 1.8), Q(x - .06, y, z - 1.8)], '#e4dacf', ART.OUT, .8);
    // Flower Planter Box under window
    if (opts.flowerBox) {
      const fbx0 = x - .02, fbx1 = x + w + .02, fby = y + .08, fbz = z - 1.5, fbh = 3.2;
      // Planter wooden trough
      poly(c, [Q(fbx0, fby, fbz), Q(fbx1, fby, fbz), Q(fbx1, fby, fbz - fbh), Q(fbx0, fby, fbz - fbh)], '#7a4e2d', ART.OUT, .8);
      // Lush green foliage
      for (let i = 0; i < 4; i++) {
        const fx = fbx0 + (i + .5) * (fbx1 - fbx0) / 4, q = Q(fx, fby + .02, fbz + 1.2);
        ART.ell(c, q[0], q[1], 4.2, 3, i % 2 ? '#4da23e' : '#5fb84d');
      }
      // Blooming colorful flower blossoms
      const fcols = ['#ff6b8b', '#ffd152', '#ff85a2', '#ffffff', '#b58eff'];
      for (let i = 0; i < 5; i++) {
        const fx = fbx0 + (i + .4) * (fbx1 - fbx0) / 5, q = Q(fx, fby + .03, fbz + 1.6);
        ART.ell(c, q[0], q[1], 2, 1.8, fcols[i % fcols.length]);
      }
      // Trailing ivy leaves
      for (const ix of [fbx0 + .06, fbx1 - .06]) {
        const q = Q(ix, fby + .02, fbz - fbh - 1);
        ART.ell(c, q[0], q[1], 2.2, 2.8, '#438e36');
      }
    }
  }
  function winE(c, x, y, z, w, h, lit, fr) {
    if (ROT) return;
    poly(c, [Q(x, y - .04, z + h + 1.2), Q(x, y + w + .04, z + h + 1.2), Q(x, y + w + .04, z - 1), Q(x, y - .04, z - 1)], fr || '#e8e2d8', ART.OUT, 1);
    const pane = [Q(x, y, z + h), Q(x, y + w, z + h), Q(x, y + w, z), Q(x, y, z)];
    poly(c, pane, lit ? '#ffcf52' : '#6b9db8', 'rgba(40,25,15,.55)', .8);
    // Crossbars
    const midY = y + w / 2, midZ = z + h / 2;
    const v0 = Q(x, midY, z + h), v1 = Q(x, midY, z);
    const h0 = Q(x, y, midZ), h1 = Q(x, y + w, midZ);
    c.beginPath(); c.moveTo(v0[0], v0[1]); c.lineTo(v1[0], v1[1]); c.moveTo(h0[0], h0[1]); c.lineTo(h1[0], h1[1]);
    c.strokeStyle = fr || '#e8e2d8'; c.lineWidth = 1; c.stroke();
    // Sill
    poly(c, [Q(x + .06, y - .05, z), Q(x + .06, y + w + .05, z), Q(x, y + w + .05, z - 1.6), Q(x, y - .05, z - 1.6)], '#dcd2c4', ART.OUT, .8);
  }

  // --- Roofs with Scalloped / Stepped Shingles, Eaves Overhang & Drop Shadows ---
  const gable = roofTurn(gable_), hip = roofTurn(hip_), gambrel = roofTurn(gambrel_);

  function gable_(c, x0, y0, w, d, z, rh, col, wall) {
    const x1 = x0 + w, y1 = y0 + d, ym = (y0 + y1) / 2, e = .24;
    // Under-eaves cast drop shadow onto south wall and east wall
    poly(c, [Q(x0, y1, z), Q(x1, y1, z), Q(x1, y1, z - 4.5), Q(x0, y1, z - 4.5)], 'rgba(25,12,6,.38)');
    poly(c, [Q(x1, y0, z), Q(x1, y1, z), Q(x1, y1, z - 3.5), Q(x1, y0, z - 3.5)], 'rgba(20,10,5,.3)');

    // North slope (shadowed back side)
    poly(c, [Q(x0 - e, y0 - e, z), Q(x1 + e, y0 - e, z), Q(x1 + e, ym, z + rh), Q(x0 - e, ym, z + rh)], sh(col, -.26), ART.OUT, 1.2);
    // East wall gable peak with decorative beam trim
    poly(c, [Q(x1, y0, z), Q(x1, y1, z), Q(x1, ym, z + rh)], sh(wall, -.08), ART.OUT, 1.2);
    // Gable timber cross-strut
    const gPeak = Q(x1 + .01, ym, z + rh), gMid = Q(x1 + .01, ym, z);
    c.beginPath(); c.moveTo(gPeak[0], gPeak[1]); c.lineTo(gMid[0], gMid[1]); c.strokeStyle = '#6a452a'; c.lineWidth = 1.8; c.stroke();

    // South slope (lit main side)
    poly(c, [Q(x0 - e, ym, z + rh), Q(x1 + e, ym, z + rh), Q(x1 + e, y1 + e, z), Q(x0 - e, y1 + e, z)], col, ART.OUT, 1.3);

    // Multi-tier scalloped / stepped shingle rows on south slope
    const rows = 5;
    for (let r = 1; r < rows; r++) {
      const f = r / rows, zz = z + rh * (1 - f), yy = (y1 + e) * f + ym * (1 - f);
      const a = Q(x0 - e + .02, yy, zz), b = Q(x1 + e - .02, yy, zz);
      // Dark under-shingle shadow groove
      c.beginPath(); c.moveTo(a[0], a[1] + 1); c.lineTo(b[0], b[1] + 1);
      c.strokeStyle = 'rgba(30,12,5,.45)'; c.lineWidth = 1.4; c.stroke();
      // Sunlit specular rim on shingle ridge
      c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]);
      c.strokeStyle = 'rgba(255,255,255,.32)'; c.lineWidth = 1.2; c.stroke();
      // Vertical shingle tabs
      const tabs = 6;
      for (let k = 1; k < tabs; k++) {
        const u = k / tabs, tx = (x0 - e) * (1 - u) + (x1 + e) * u;
        const t0 = Q(tx, yy, zz), t1 = Q(tx, yy - .08, zz + rh / rows * .6);
        c.beginPath(); c.moveTo(t0[0], t0[1]); c.lineTo(t1[0], t1[1]);
        c.strokeStyle = 'rgba(30,12,5,.3)'; c.lineWidth = .9; c.stroke();
      }
    }
    // Carved bargeboards (fascia trim) along the south and east eave edges
    const e0 = Q(x0 - e, y1 + e, z), e1 = Q(x1 + e, y1 + e, z);
    c.beginPath(); c.moveTo(e0[0], e0[1]); c.lineTo(e1[0], e1[1]);
    c.strokeStyle = '#ffffff'; c.lineWidth = 2; c.stroke();
    const gTop = Q(x1 + e, ym, z + rh), gBot = Q(x1 + e, y1 + e, z);
    c.beginPath(); c.moveTo(gTop[0], gTop[1]); c.lineTo(gBot[0], gBot[1]);
    c.strokeStyle = '#ffffff'; c.lineWidth = 2; c.stroke();

    // Top ridge beam with round cap tiles
    const r0 = Q(x0 - e, ym, z + rh), r1 = Q(x1 + e, ym, z + rh);
    c.beginPath(); c.moveTo(r0[0], r0[1]); c.lineTo(r1[0], r1[1]);
    c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 2.2; c.stroke();
    // Ridge end finials
    ART.ell(c, r0[0], r0[1] - 2, 2.5, 3.5, '#ffffff', ART.OUT, .8);
    ART.ell(c, r1[0], r1[1] - 2, 2.5, 3.5, '#ffffff', ART.OUT, .8);
  }

  function hip_(c, x0, y0, w, d, z, rh, col) {
    const x1 = x0 + w, y1 = y0 + d, e = .22;
    const a = Q(x0 + w * .32, (y0 + y1) / 2, z + rh), b = Q(x0 + w * .68, (y0 + y1) / 2, z + rh);
    // Under-eave shadow
    poly(c, [Q(x0, y1, z), Q(x1, y1, z), Q(x1, y1, z - 4.5), Q(x0, y1, z - 4.5)], 'rgba(25,12,6,.38)');
    poly(c, [Q(x1, y0, z), Q(x1, y1, z), Q(x1, y1, z - 3.5), Q(x1, y0, z - 3.5)], 'rgba(20,10,5,.3)');

    poly(c, [Q(x0 - e, y0 - e, z), Q(x1 + e, y0 - e, z), b, a], sh(col, -.24), ART.OUT, 1.2);
    poly(c, [Q(x1 + e, y0 - e, z), Q(x1 + e, y1 + e, z), b], sh(col, -.12), ART.OUT, 1.2);
    poly(c, [Q(x0 - e, y1 + e, z), Q(x1 + e, y1 + e, z), b, a], col, ART.OUT, 1.3);

    // Shingle rows on south slope
    const rows = 4;
    for (let r = 1; r < rows; r++) {
      const f = r / rows, zz = z + rh * (1 - f);
      const a0 = Q(x0 - e + w * .32 * (1 - f), (y1 + e) * f + (y0 + y1) / 2 * (1 - f), zz);
      const b0 = Q(x1 + e - w * .32 * (1 - f), (y1 + e) * f + (y0 + y1) / 2 * (1 - f), zz);
      c.beginPath(); c.moveTo(a0[0], a0[1]); c.lineTo(b0[0], b0[1]);
      c.strokeStyle = 'rgba(255,255,255,.32)'; c.lineWidth = 1.2; c.stroke();
    }
    // Ridge beam highlight
    c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]);
    c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 2.2; c.stroke();
  }

  function gambrel_(c, x0, y0, w, d, z, rh, col, wall) {
    const x1 = x0 + w, y1 = y0 + d, ym = (y0 + y1) / 2, q1 = y0 + d * .2, q2 = y1 - d * .2, e = .2;
    poly(c, [Q(x0 - e, ym, z + rh), Q(x1 + e, ym, z + rh), Q(x1 + e, q2, z + rh * .7), Q(x0 - e, q2, z + rh * .7)], sh(col, .08), ART.OUT, 1.2);
    poly(c, [Q(x0 - e, q2, z + rh * .7), Q(x1 + e, q2, z + rh * .7), Q(x1 + e, y1 + e, z), Q(x0 - e, y1 + e, z)], col, ART.OUT, 1.2);
    poly(c, [Q(x1, y0, z), Q(x1, q1, z + rh * .7), Q(x1, ym, z + rh), Q(x1, q2, z + rh * .7), Q(x1, y1, z)], sh(wall, -.08), ART.OUT, 1.2);
    // Eaves trim
    const e0 = Q(x0 - e, y1 + e, z), e1 = Q(x1 + e, y1 + e, z);
    c.beginPath(); c.moveTo(e0[0], e0[1]); c.lineTo(e1[0], e1[1]); c.strokeStyle = '#ffffff'; c.lineWidth = 1.8; c.stroke();
  }

  // --- Chimney with Ashlar Stone Bricks & Translucent Smoke ---
  function smoke(c, x, y, z, T, s) {
    for (let i = 0; i < 4; i++) {
      const k = (T * .3 + i / 4 + s * .13) % 1, q = Q(x, y, z);
      const drift = Math.sin(T * 1.5 + i) * 3 + k * 8, rise = k * 26;
      c.globalAlpha = .55 * (1 - k);
      ART.ell(c, q[0] + drift, q[1] - 7 - rise, 3.5 + k * 5, 2.8 + k * 4, '#ffffff');
      ART.ell(c, q[0] + drift - 1, q[1] - 8 - rise, 1.8 + k * 2, 1.4 + k * 2, 'rgba(255,255,255,.7)');
    }
    c.globalAlpha = 1;
  }
  function chimney(c, x, y, z, T, s) {
    const q = Q(x, y, z);
    // Stone chimney body
    c.fillStyle = '#9e5a48'; c.fillRect(q[0] - 3.5, q[1] - 6, 7, 13);
    c.strokeStyle = ART.OUT; c.lineWidth = .9; c.strokeRect(q[0] - 3.5, q[1] - 6, 7, 13);
    // Brick mortar lines
    c.strokeStyle = 'rgba(255,255,255,.3)'; c.lineWidth = .7;
    for (const dy of [-3, 1, 5]) { c.beginPath(); c.moveTo(q[0] - 3, q[1] + dy); c.lineTo(q[0] + 3, q[1] + dy); c.stroke(); }
    // Stepped stone cap & terracotta chimney pot
    c.fillStyle = '#b8a694'; c.fillRect(q[0] - 4.5, q[1] - 8, 9, 2.5);
    c.fillStyle = '#7a3828'; c.fillRect(q[0] - 2, q[1] - 11, 4, 3.5);
    c.strokeStyle = ART.OUT; c.lineWidth = .8; c.strokeRect(q[0] - 2, q[1] - 11, 4, 3.5);
    smoke(c, x, y, z + 8, T, s);
  }

  // --- Cozy Wooden Door with Porch Hood, Step & Lantern ---
  function door(c, x, y, h, col, opts) {
    if (ROT) return;
    opts = opts || {};
    const dw = .48, p0 = Q(x, y, h), p1 = Q(x + dw, y, h), p2 = Q(x + dw, y, 0), p3 = Q(x, y, 0);
    // Entrance stone step / threshold
    poly(c, [Q(x - .05, y + .14, 0), Q(x + dw + .05, y + .14, 0), Q(x + dw + .05, y, 0), Q(x - .05, y, 0)], '#c9c0b5', ART.OUT, .8);
    // Door frame
    poly(c, [Q(x - .03, y, h + 1.2), Q(x + dw + .03, y, h + 1.2), Q(x + dw + .03, y, 0), Q(x - .03, y, 0)], '#ffffff', ART.OUT, .9);
    // Wooden door panel
    poly(c, [p0, p1, p2, p3], col || '#7a4a2c', ART.OUT, 1);
    // Vertical wood plank grooves
    for (const dx of [.16, .32]) {
      const a = Q(x + dx, y, h), b = Q(x + dx, y, 0);
      c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.strokeStyle = 'rgba(0,0,0,.3)'; c.lineWidth = .8; c.stroke();
    }
    // Brass door handle
    const hPt = Q(x + dw - .08, y, h * .45);
    ART.ell(c, hPt[0], hPt[1], 1.4, 1.4, '#eec85a', '#6a4515', .7);
    // Upper door window pane
    if (h >= 14) {
      const w0 = Q(x + .1, y, h - 2), w1 = Q(x + dw - .1, y, h - 6);
      c.fillStyle = '#fff4c2'; c.fillRect(w0[0], w0[1], w1[0] - w0[0], w1[1] - w0[1]);
      c.strokeStyle = '#6a452a'; c.lineWidth = .7; c.strokeRect(w0[0], w0[1], w1[0] - w0[0], w1[1] - w0[1]);
    }
    // Porch Hood / Canopy over door
    if (opts.porch) {
      const c0 = Q(x - .12, y, h + 2.5), c1 = Q(x + dw + .12, y, h + 2.5);
      const c2 = Q(x + dw + .12, y + .35, h), c3 = Q(x - .12, y + .35, h);
      poly(c, [c0, c1, c2, c3], opts.porchCol || '#c04a3e', ART.OUT, 1);
      // Bracket supports
      const b0 = Q(x - .1, y, h), b1 = Q(x - .1, y + .3, h);
      c.beginPath(); c.moveTo(b0[0], b0[1]); c.lineTo(b1[0], b1[1]); c.strokeStyle = '#5a3822'; c.lineWidth = 1.4; c.stroke();
    }
    // Hanging carriage lantern
    if (opts.lantern) {
      const lPt = Q(x + dw + .16, y, h * .75);
      // Lantern mount
      c.strokeStyle = '#3a3a44'; c.lineWidth = 1.2;
      c.beginPath(); c.moveTo(lPt[0] - 4, lPt[1]); c.lineTo(lPt[0], lPt[1]); c.lineTo(lPt[0], lPt[1] + 2); c.stroke();
      // Glowing lantern glass
      ART.ell(c, lPt[0], lPt[1] + 4, 2.5, 3.2, '#ffe67a', '#3a3a44', .8);
      // Warm glow halo
      c.globalAlpha = .35; ART.ell(c, lPt[0], lPt[1] + 4, 7, 7, '#ffd84a'); c.globalAlpha = 1;
    }
  }

  // --- Dormer Window helper for roofs ---
  function dormer(c, x, y, z, w, d, h, roofCol, wallCol, lit) {
    if (ROT) return;
    const bx = x, by = y;
    // Dormer walls
    poly(c, [Q(bx, by + d, z), Q(bx + w, by + d, z), Q(bx + w, by + d, z - h), Q(bx, by + d, z - h)], wallCol, ART.OUT, .9);
    // Dormer arched glowing window
    const gPt = Q(bx + w / 2, by + d, z - h * .4);
    ART.ell(c, gPt[0], gPt[1], 3.5, 4.5, lit ? '#ffe67a' : '#92c2da', '#ffffff', 1);
    // Dormer miniature gable roof
    const dPeak = Q(bx + w / 2, by + d / 2, z + 4);
    poly(c, [Q(bx - .08, by + d + .08, z), dPeak, Q(bx + w + .08, by + d + .08, z)], roofCol, ART.OUT, 1);
  }

  // --- Stone Foundation Plinth Helper ---
  function stoneFoundation(c, bx, by, w, d, bh) {
    bh = bh || 4.5;
    // Base contact drop shadow
    poly(c, [Q(bx - .1, by - .1), Q(bx + w + .25, by - .1), Q(bx + w + .25, by + d + .25), Q(bx - .1, by + d + .25)], 'rgba(15,28,12,.28)');
    // South stone face
    poly(c, [Q(bx, by + d, bh), Q(bx + w, by + d, bh), Q(bx + w, by + d, 0), Q(bx, by + d, 0)], '#a69a8b', ART.OUT, .9);
    // East stone face
    poly(c, [Q(bx + w, by, bh), Q(bx + w, by + d, bh), Q(bx + w, by + d, 0), Q(bx + w, by, 0)], '#8e8274', ART.OUT, .9);
    // Foundation stone joint lines
    c.strokeStyle = 'rgba(40,25,15,.35)'; c.lineWidth = .8;
    for (let u = .5; u < w; u += .65) {
      const a = Q(bx + u, by + d, bh), b = Q(bx + u, by + d, 0);
      c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
    }
    // Top bevel highlight
    const f1 = Q(bx, by + d, bh), f2 = Q(bx + w, by + d, bh), f3 = Q(bx + w, by, bh);
    c.beginPath(); c.moveTo(f1[0], f1[1]); c.lineTo(f2[0], f2[1]); c.lineTo(f3[0], f3[1]);
    c.strokeStyle = 'rgba(255,255,255,.45)'; c.lineWidth = 1.2; c.stroke();
  }

  // --- Half-Timbering Wood Beams Helper ---
  function timberBeams(c, bx, by, w, d, z0, z1, col) {
    if (ROT) return;
    const tCol = col || '#6a452a';
    c.strokeStyle = tCol; c.lineWidth = 1.8;
    // Corner vertical posts
    for (const x of [bx + .04, bx + w - .04]) {
      const a = Q(x, by + d, z1), b = Q(x, by + d, z0);
      c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
    }
    // Top & bottom horizontal beams
    for (const z of [z0, z1]) {
      const a = Q(bx, by + d, z), b = Q(bx + w, by + d, z);
      c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
    }
  }

  function flowers(c, x, y, n, s) {
    for (let i = 0; i < n; i++) {
      const q = Q(x + (i % 4) * .28, y + Math.floor(i / 4) * .3);
      // Soft pastel blooms with yellow centers
      const col = ['#f78da7', '#ffd152', '#bca3ea', '#ff9e7d', '#70c7ea'][(i + s) % 5];
      ART.ell(c, q[0], q[1] - 2, 2.6, 2.6, col, 'rgba(60,20,30,.4)', .6);
      ART.ell(c, q[0], q[1] - 2, 1, 1, '#fff6c4');
    }
  }

  // ============ v1.108: 캐시된 나무/덤불 스프라이트 ============
// 매 프레임 벡터로 그리는 대신, 한 번 오프스크린 캔버스에 그려두고 drawImage로 재사용 (성능)
// variant: 0,1,2 색상별로 각각 캐시됨
const TREE_SPR = {};   // key: 'tree0', 'tree1', 'tree2'
const HEDGE_SPR = {};  // key: 'hedge0', 'hedge1'

// 오프스크린 캔버스에 나무를 그리고 sprite로 반환 (한 번만 호출됨)
function makeTreeSprite(variant) {
  const W = 150, H = 170;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const g = cv.getContext('2d');
  g.translate(W / 2, H - 8);

  let _seed = 12345 + variant * 777;
  const rnd = () => { _seed = (_seed * 9301 + 49297) % 233280; return _seed / 233280; };

  const P = [
    { deep: '#2c4a1a', dark: '#3f6b28', mid: '#5a8f38', lit: '#7cb84a', hi: '#a8d468',
      trunkDark: '#3a2410', trunkMid: '#5a3820', trunkLit: '#8a5a33',
      appleBase: '#c92e22', appleDark: '#7a1010', appleLit: '#f0483a', appleHi: '#ff9080' },
    { deep: '#2e4a20', dark: '#436f2c', mid: '#5f9440', lit: '#82b454', hi: '#abd06e',
      trunkDark: '#3a2410', trunkMid: '#5d3a22', trunkLit: '#8f5e36',
      appleBase: '#d0392a', appleDark: '#8a1515', appleLit: '#f85648', appleHi: '#ffa090' },
  ][variant % 2];
  const OUT = 'rgba(20,35,10,.7)';

  // ==================== 잎사귀 하나 그리기 (채워진 뾰족한 리본) ====================
  // 참조 이미지의 잎 = 뾰족한 타원형, 안쪽 어둡고 바깥 밝음
  const drawLeafShape = (cx, cy, size, angle, col, shadowCol, hiCol) => {
    g.save();
    g.translate(cx, cy);
    g.rotate(angle);
    const L = size * 1.4, Wl = size * .5;
    // 잎 윤곽 (뾰족한 양 끝, 볼록한 배)
    g.beginPath();
    g.moveTo(-L * .55, 0);
    g.quadraticCurveTo(-L * .1, -Wl, L * .55, 0);      // 위쪽 곡선
    g.quadraticCurveTo(-L * .1, Wl, -L * .55, 0);      // 아래쪽 곡선
    g.closePath();
    g.fillStyle = col;
    g.fill();
    // 어두운 아래쪽 (그림자)
    if (shadowCol) {
      g.beginPath();
      g.moveTo(-L * .55, 0);
      g.quadraticCurveTo(-L * .1, Wl * .8, L * .5, 0);
      g.quadraticCurveTo(-L * .1, Wl * .3, -L * .55, 0);
      g.closePath();
      g.fillStyle = shadowCol;
      g.fill();
    }
    // 밝은 하이라이트 (위쪽 왼쪽)
    if (hiCol) {
      g.beginPath();
      g.ellipse(-L * .05, -Wl * .35, L * .3, Wl * .25, angle * .1, 0, Math.PI * 2);
      g.fillStyle = hiCol;
      g.fill();
    }
    // 잎맥
    g.beginPath();
    g.moveTo(-L * .45, 0);
    g.lineTo(L * .45, 0);
    g.strokeStyle = 'rgba(255,255,255,.28)';
    g.lineWidth = .5;
    g.stroke();
    g.restore();
  };

  // ==================== 1. 그림자 ====================
  ART.ell(g, 0, 3, 38, 13, 'rgba(15,30,10,.14)');
  ART.ell(g, 0, 2, 28, 10, 'rgba(15,30,10,.22)');
  ART.ell(g, 0, 1, 16, 5, 'rgba(15,30,10,.34)');

  // ==================== 2. 줄기 + 뿌리 ====================
  // 뿌리 5가닥
  g.strokeStyle = P.trunkDark;
  g.lineCap = 'round';
  for (const [a, len, lw] of [[-2.9, 16, 3.5], [-2.4, 12, 2.5], [2.9, 16, 3.5], [2.4, 12, 2.5], [Math.PI/2, 10, 2.5]]) {
    g.lineWidth = lw;
    g.beginPath();
    g.moveTo(0, -2);
    const tx = Math.cos(a) * len;
    const ty = Math.abs(Math.sin(a)) * 3 + 2;
    g.quadraticCurveTo(tx * .5, ty * .3, tx, ty);
    g.stroke();
  }
  // 줄기 본체 (굵게)
  g.fillStyle = P.trunkMid;
  g.beginPath();
  g.moveTo(-9, 0);
  g.quadraticCurveTo(-6, -14, -4, -32);
  g.lineTo(4, -32);
  g.quadraticCurveTo(6, -14, 9, 0);
  g.closePath();
  g.fill();
  g.strokeStyle = OUT; g.lineWidth = 1.5; g.stroke();
  // 밝은 왼쪽 면
  g.fillStyle = P.trunkLit;
  g.beginPath();
  g.moveTo(-9, 0);
  g.quadraticCurveTo(-6, -14, -4, -32);
  g.lineTo(-1, -32);
  g.quadraticCurveTo(-2, -14, -2.5, 0);
  g.closePath();
  g.fill();
  // 나무결
  g.strokeStyle = P.trunkDark; g.lineWidth = .8;
  for (const [x, dx] of [[-3.5, -1], [-1, .3], [1, .2], [3, -.3]]) {
    g.beginPath();
    g.moveTo(x, -2);
    g.quadraticCurveTo(x + dx * 3, -16, x + dx * 2, -30);
    g.stroke();
  }

  // ==================== 3. 가지 5개 ====================
  g.strokeStyle = P.trunkMid; g.lineWidth = 5; g.lineCap = 'round';
  const branches = [
    [-3, -26, -20, -44, 5],
    [3, -25, 20, -42, 5],
    [-1, -28, -10, -54, 4.5],
    [1, -28, 10, -52, 4.5],
    [0, -30, 0, -58, 4],
  ];
  for (const [x0, y0, x1, y1, lw] of branches) {
    g.lineWidth = lw;
    g.beginPath();
    g.moveTo(x0, y0);
    g.quadraticCurveTo((x0 + x1) / 2 + (rnd() - .5) * 3, (y0 + y1) / 2, x1, y1);
    g.stroke();
  }

  // ==================== 4. 캐노피 (잎 200장, 뒤→앞 순서) ====================
  // 캐노피 형태: 큰 원 3개 조합
  const canopyCenters = [
    { x: 0, y: -68, rx: 36, ry: 30 },
    { x: -22, y: -56, rx: 18, ry: 18 },
    { x: 22, y: -56, rx: 18, ry: 18 },
    { x: 0, y: -50, rx: 30, ry: 20 },
    { x: 0, y: -84, rx: 22, ry: 16 },
  ];

  // 잎 배치: 200장
  const LEAF_N = 200;
  const leafList = [];
  for (let i = 0; i < LEAF_N; i++) {
    const c = canopyCenters[Math.floor(rnd() * canopyCenters.length)];
    const theta = rnd() * Math.PI * 2;
    const rr = Math.sqrt(rnd());
    const px = c.x + Math.cos(theta) * c.rx * rr;
    const py = c.y + Math.sin(theta) * c.ry * rr;
    // y가 작을수록(위) 뒤로 → 뒤쪽 어둡게
    const yNorm = (py + 100) / 60;   // 대략 0=위, 1=아래
    const depth = Math.max(0, Math.min(1, yNorm));
    leafList.push({ x: px, y: py, depth, seed: rnd() });
  }
  // 뒤→앞 정렬
  leafList.sort((a, b) => a.depth - b.depth);

  for (const L of leafList) {
    const size = 9 + L.depth * 3 + L.seed * 2.5;
    const angle = rnd() * Math.PI * 2;
    let col, shadow, hi;
    if (L.depth < .25) { col = P.deep; shadow = null; hi = null; }
    else if (L.depth < .55) { col = P.dark; shadow = ART.shade(P.dark, -.2); hi = null; }
    else if (L.depth < .8) { col = P.mid; shadow = ART.shade(P.mid, -.2); hi = 'rgba(255,255,255,.18)'; }
    else { col = P.lit; shadow = ART.shade(P.lit, -.2); hi = 'rgba(255,255,255,.35)'; }
    drawLeafShape(L.x, L.y, size, angle, col, shadow, hi);
  }

  // 캔버스 외곽 하이라이트 (왼쪽 위 광원)
  for (const [hx, hy, hr] of [[-26, -72, 8], [-18, -84, 6], [-8, -90, 5]]) {
    ART.ell(g, hx, hy, hr, hr * .5, 'rgba(255,255,255,.32)');
  }

  // ==================== 5. 사과 10개 (작고 자연스럽게) ====================
  const applePositions = [
    [-16, -50, 4.5], [12, -52, 4.5], [-4, -56, 4.2], [8, -46, 4.0], [-8, -66, 4.3],
    [6, -66, 4.3], [-1, -72, 4.2], [18, -46, 3.8], [-20, -58, 4.0], [10, -74, 3.8],
  ];
  for (const [dx, dy, r] of applePositions) {
    // 사과 몸통
    ART.ell(g, dx, dy, r, r * .95, P.appleBase, 'rgba(60,10,5,.85)', 1);
    // 어두운 오른쪽 아래
    g.beginPath();
    g.ellipse(dx + r * .25, dy + r * .3, r * .6, r * .5, 0, -Math.PI * .2, Math.PI * .9);
    g.fillStyle = P.appleDark;
    g.fill();
    // 중간 톤
    ART.ell(g, dx - r * .1, dy - r * .1, r * .7, r * .65, P.appleBase);
    // 밝은 반사 (왼쪽 위)
    ART.ell(g, dx - r * .35, dy - r * .4, r * .45, r * .4, P.appleLit);
    // 흰 하이라이트
    ART.ell(g, dx - r * .45, dy - r * .5, r * .22, r * .16, P.appleHi);
    // 꼭지
    g.strokeStyle = '#3a2210'; g.lineWidth = 1; g.lineCap = 'round';
    g.beginPath();
    g.moveTo(dx, dy - r * .9);
    g.quadraticCurveTo(dx + 1, dy - r * 1.25, dx + 1.5, dy - r * 1.5);
    g.stroke();
    // 꼭지 잎
    g.save();
    g.translate(dx + 1.5, dy - r * 1.5);
    g.rotate(-0.4 + rnd() * .3);
    g.beginPath();
    g.moveTo(0, 0);
    g.quadraticCurveTo(2, -1.5, 4, 0);
    g.quadraticCurveTo(2, 1.2, 0, 0);
    g.closePath();
    g.fillStyle = '#4f8a38';
    g.fill();
    g.strokeStyle = 'rgba(20,45,15,.8)'; g.lineWidth = .5; g.stroke();
    g.restore();
  }

  // ==================== 6. 흰 사과꽃 4개 ====================
  for (const [dx, dy, r] of [[-18, -62, 2.8], [10, -42, 2.5], [-2, -38, 2.5], [22, -66, 2.4]]) {
    for (let k = 0; k < 5; k++) {
      const a = k * Math.PI * 2 / 5 - Math.PI / 2;
      const px = dx + Math.cos(a) * r * .85;
      const py = dy + Math.sin(a) * r * .85;
      g.beginPath();
      g.ellipse(px, py, r * .6, r * .5, a, 0, Math.PI * 2);
      g.fillStyle = '#ffffff';
      g.fill();
      g.strokeStyle = 'rgba(120,90,60,.5)';
      g.lineWidth = .4;
      g.stroke();
    }
    ART.ell(g, dx, dy, r * .35, r * .35, '#ffd23a', 'rgba(150,100,20,.6)', .4);
  }

  // ==================== 7. 밑 풀 + 낙엽 ====================
  for (let i = 0; i < 6; i++) {
    const dx = -12 + i * 4.8;
    const len = 4 + rnd() * 3;
    const ang = -.25 + rnd() * .5;
    g.save();
    g.translate(dx, 0);
    g.rotate(ang);
    g.strokeStyle = i % 2 ? '#4f9a3a' : '#5faa48';
    g.lineWidth = 1.5;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(0, 0);
    g.quadraticCurveTo(len * .5, -len * .5, len, -len);
    g.stroke();
    g.restore();
  }
  for (const [dx, dy, ang, col] of [[-14, 1, .5, '#c04a28'], [12, 2, -.4, '#d9793a'], [-2, 2, .8, '#b8432a']]) {
    g.save();
    g.translate(dx, dy);
    g.rotate(ang);
    g.beginPath();
    g.moveTo(-2.5, 0); g.quadraticCurveTo(0, -1.6, 2.5, 0);
    g.quadraticCurveTo(0, 1.6, -2.5, 0); g.closePath();
    g.fillStyle = col;
    g.fill();
    g.strokeStyle = 'rgba(60,20,10,.7)'; g.lineWidth = .4; g.stroke();
    g.restore();
  }

  return cv;
}

// 덤불 sprite (풀잎 다발 + 흙)
function makeHedgeSprite(variant) {
  const W = 36, H = 32;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const g = cv.getContext('2d');
  g.translate(W / 2, H - 2);   // 밑변 기준

  let _seed = 54321 + variant * 1111;
  const rnd = () => { _seed = (_seed * 9301 + 49297) % 233280; return _seed / 233280; };

  const P = [
    { deep: '#3d6b28', dark: '#4f9c42', mid: '#5fb350', lit: '#7cc96c', hi: '#a5d98a' },
    { deep: '#456f2c', dark: '#5aa64a', mid: '#6bb85a', lit: '#8ad574', hi: '#b5dfa0' },
  ][variant % 2];
  const OUT = 'rgba(20,35,10,.6)';

  // 풀잎 하나 (넓적한 리본)
  const drawBlade = (cx, cy, len, angle, baseCol, darkCol, litCol, wide) => {
    g.save();
    g.translate(cx, cy);
    g.rotate(angle);
    const L = len, Wd = wide || L * .22;
    g.beginPath();
    g.moveTo(0, 0);
    g.quadraticCurveTo(L * .35, -Wd, L, 0);
    g.quadraticCurveTo(L * .35, Wd, 0, 0);
    g.closePath();
    g.fillStyle = baseCol;
    g.fill();
    if (darkCol) {
      g.beginPath();
      g.moveTo(0, 0);
      g.quadraticCurveTo(L * .35, Wd * .9, L, 0);
      g.quadraticCurveTo(L * .35, Wd * .3, 0, 0);
      g.closePath();
      g.fillStyle = darkCol;
      g.fill();
    }
    if (litCol) {
      g.beginPath();
      g.moveTo(0, 0);
      g.quadraticCurveTo(L * .35, -Wd * .9, L, 0);
      g.quadraticCurveTo(L * .35, -Wd * .3, 0, 0);
      g.closePath();
      g.fillStyle = litCol;
      g.fill();
    }
    g.restore();
  };

  // ==================== 1. 납작한 그림자 (밑변에 붙음) ====================
  ART.ell(g, 0, .5, 11, 2.5, 'rgba(15,30,10,.22)');
  ART.ell(g, 0, 0, 7, 1.8, 'rgba(15,30,10,.32)');

  // ==================== 2. 흙 + 돌 (밑동, 납작하게) ====================
  ART.ell(g, -1, -.5, 6.5, 1.4, '#8a6a45', '#5a3a20', .6);
  ART.ell(g, 2, -.3, 4.5, 1.1, '#9a7a50', '#5a3a20', .5);
  // 돌 3개 (작게, 납작)
  for (const [sx, sy, srx, sry] of [[-3.5, -.3, 1.4, .9], [-.5, .1, 1.1, .8], [2.8, 0, 1.4, .9]]) {
    ART.ell(g, sx, sy, srx, sry, '#b8b0a0', 'rgba(60,45,30,.7)', .5);
    ART.ell(g, sx - srx * .3, sy - sry * .35, srx * .35, sry * .3, 'rgba(255,255,255,.4)');
  }

  // ==================== 3. 덤불 본체 (반원, 아래 납작) ====================
  const R = 10;                     // 가로 반지름
  const Hh = 13;                    // 세로 높이 (지름 26 → 위로 26)
  // 반원 path: 시작(왼쪽아래) → 위 곡선 → (오른쪽 아래) → 밑변 직선
  const halfDome = (col, stroke) => {
    g.beginPath();
    g.moveTo(-R, 0);
    // 위쪽 반원 곡선
    g.quadraticCurveTo(-R, -Hh * 1.15, 0, -Hh);
    g.quadraticCurveTo(R, -Hh * 1.15, R, 0);
    g.lineTo(-R, 0);                // 밑변 (평평)
    g.closePath();
    if (col) { g.fillStyle = col; g.fill(); }
    if (stroke) { g.strokeStyle = stroke; g.lineWidth = .9; g.stroke(); }
  };
  halfDome(P.deep, OUT);

  // ==================== 4. 풀잎 (반원 안에 배치, 위→아래로 흐름) ====================
  const bladeList = [];
  for (let i = 0; i < 55; i++) {
    // 각도: 위쪽 반원만 (0~π)
    const a = Math.PI + rnd() * Math.PI;           // 위쪽 반원 각도 (-π ~ 0 또는 π ~ 2π)
    // 실제 사용할 각도: 위쪽 반원 방향
    const ang = -Math.PI + rnd() * Math.PI;         // -π ~ 0 (위쪽)
    // 시작점: 반원 내부
    const startR = rnd() * R * .55;
    const bx = Math.cos(ang) * startR;
    const by = -Hh * .5 + Math.sin(ang) * (Hh * .55) * .55;
    // 표면까지 길이 계산 (간단히)
    const surfaceR = R * .9 + rnd() * 2;
    const len = Math.max(2.5, surfaceR - startR);
    bladeList.push({ bx, by, len, ang, seed: rnd(), depth: (Math.sin(ang) + 1) / 2 });
  }
  // 아래쪽(앞) 풀잎이 나중에 그려짐
  bladeList.sort((a, b) => b.by - a.by);

  for (const b of bladeList) {
    // 밑변 아래로는 그리지 않음 (평평한 밑변 유지)
    if (b.by > -1) continue;
    // y가 0 근처면 밑변에 닿지 않도록 각도 조정 (위쪽으로만 뻗음)
    const ang = b.ang;
    // 색 결정: 위쪽 어둡고 아래쪽 밝음
    const yNorm = Math.max(0, Math.min(1, (-b.by) / Hh));   // 0=아래, 1=위
    let col, dark, lit;
    if (yNorm > .7) { col = P.deep; dark = null; lit = null; }
    else if (yNorm > .4) { col = P.dark; dark = ART.shade(P.dark, -.2); lit = null; }
    else if (yNorm > .15) { col = P.mid; dark = ART.shade(P.mid, -.2); lit = 'rgba(255,255,255,.15)'; }
    else { col = P.lit; dark = ART.shade(P.lit, -.2); lit = 'rgba(255,255,255,.3)'; }
    drawBlade(b.bx, b.by, b.len + 1, ang, col, dark, lit, Math.max(1.6, b.len * .28));
  }

  // ==================== 5. 앞쪽 넓적한 잎 2장 (납작하게 배치) ====================
  for (const [dx, dy, ang, L] of [[-4, -3, -0.15, 5], [3.5, -4, 0.15, 5.2]]) {
    g.save();
    g.translate(dx, dy);
    g.rotate(ang);
    g.beginPath();
    g.moveTo(-L * .5, 0);
    g.quadraticCurveTo(-L * .15, -L * .55, L * .55, 0);
    g.quadraticCurveTo(-L * .15, L * .55, -L * .5, 0);
    g.closePath();
    g.fillStyle = P.mid;
    g.fill();
    g.strokeStyle = OUT; g.lineWidth = .4; g.stroke();
    g.beginPath();
    g.moveTo(-L * .5, 0);
    g.quadraticCurveTo(-L * .15, L * .4, L * .4, 0);
    g.quadraticCurveTo(-L * .15, L * .15, -L * .5, 0);
    g.closePath();
    g.fillStyle = ART.shade(P.mid, -.22);
    g.fill();
    g.beginPath();
    g.moveTo(-L * .4, 0); g.lineTo(L * .45, 0);
    g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = .4; g.stroke();
    g.restore();
  }

  // ==================== 6. 낙엽 2장 (밑변에 붙여서) ====================
  for (const [lx, ly, ang, col] of [[-3, -.4, .4, '#c04a28'], [2.5, 0, -.6, '#d9793a']]) {
    g.save();
    g.translate(lx, ly); g.rotate(ang);
    g.beginPath();
    g.moveTo(-1.7, 0); g.quadraticCurveTo(0, -1, 1.7, 0);
    g.quadraticCurveTo(0, 1, -1.7, 0); g.closePath();
    g.fillStyle = col; g.fill();
    g.strokeStyle = 'rgba(60,20,10,.6)'; g.lineWidth = .3; g.stroke();
    g.restore();
  }

  return cv;
}

// lazy getter
function getTreeSprite(variant) {
  const k = 'tree' + (variant % 3);
  if (!TREE_SPR[k]) TREE_SPR[k] = makeTreeSprite(variant % 3);
  return TREE_SPR[k];
}
function getHedgeSprite(variant) {
  const k = 'hedge' + (variant % 2);
  if (!HEDGE_SPR[k]) HEDGE_SPR[k] = makeHedgeSprite(variant % 2);
  return HEDGE_SPR[k];
}

// ============ v1.109: 낙엽수(사과/복숭아/오렌지/벚꽃/단풍/은행) 캐시 스프라이트 ============
// makeTreeSprite 수준의 디테일을 유지하되, 잎 수량을 130장으로 줄여 성능 확보.
// 나무 종류별 팔레트 + 열매/꽃을 개별 정의.
const DECID_SPR = {};
function makeDeciduousSprite(kind, variant) {
  const W = 150, H = 170;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const g = cv.getContext('2d');
  g.translate(W / 2, H - 8);

  let _seed = 12345 + variant * 777 + (kind.charCodeAt(0) || 0) * 31;
  const rnd = () => { _seed = (_seed * 9301 + 49297) % 233280; return _seed / 233280; };

  // 나무별 팔레트 + 열매 설정
  const PAL = {
    cherry:  { deep: '#c9537a', dark: '#e77a98', mid: '#f89ab4', lit: '#fcc5d6', hi: '#fff0f5',
               fruit: '#ffd0e0', fruitEdge: '#e07d9b', fruitCore: '#f5cd47', fruitType: 'blossom' },
    maple:   { deep: '#7a1d10', dark: '#9c2415', mid: '#cf4622', lit: '#ea6e2e', hi: '#f9a73e',
               fruit: null, fruitType: 'leafFall' },
    ginkgo:  { deep: '#8a5e08', dark: '#b47b09', mid: '#eab308', lit: '#facc15', hi: '#fef08a',
               fruit: null, fruitType: 'leafFall' },
    peach:   { deep: '#1f4a28', dark: '#2f6e3b', mid: '#489956', lit: '#68bd76', hi: '#9ae6a7',
               fruit: '#ff758f', fruitEdge: '#9d174d', fruitHi: '#ffb3c6', fruitCore: '#fff0f3', fruitType: 'peach' },
    orange:  { deep: '#164a22', dark: '#1f5c2e', mid: '#318243', lit: '#4ea860', hi: '#7ed98f',
               fruit: '#f97316', fruitEdge: '#9a3412', fruitHi: '#fb923c', fruitCore: '#ffedd5', fruitType: 'orange' },
    apple:   { deep: '#1f4a1a', dark: '#2f6627', mid: '#4a8f3b', lit: '#6cb556', hi: '#8dd973',
               fruit: '#d8182d', fruitEdge: '#7d0d1a', fruitHi: '#f03a4e', fruitCore: '#ffffff', fruitType: 'apple' },
  };
  const P = PAL[kind] || PAL.apple;
  const OUT = 'rgba(20,35,10,.7)';

  // 잎 하나 그리기 (makeTreeSprite와 동일한 뾰족한 리본)
  const drawLeaf = (cx, cy, size, angle, col, shadowCol, hiCol) => {
    g.save();
    g.translate(cx, cy);
    g.rotate(angle);
    const L = size * 1.4, Wl = size * .5;
    g.beginPath();
    g.moveTo(-L * .55, 0);
    g.quadraticCurveTo(-L * .1, -Wl, L * .55, 0);
    g.quadraticCurveTo(-L * .1, Wl, -L * .55, 0);
    g.closePath();
    g.fillStyle = col;
    g.fill();
    if (shadowCol) {
      g.beginPath();
      g.moveTo(-L * .55, 0);
      g.quadraticCurveTo(-L * .1, Wl * .8, L * .5, 0);
      g.quadraticCurveTo(-L * .1, Wl * .3, -L * .55, 0);
      g.closePath();
      g.fillStyle = shadowCol;
      g.fill();
    }
    if (hiCol) {
      g.beginPath();
      g.ellipse(-L * .05, -Wl * .35, L * .3, Wl * .25, angle * .1, 0, Math.PI * 2);
      g.fillStyle = hiCol;
      g.fill();
    }
    g.beginPath();
    g.moveTo(-L * .45, 0);
    g.lineTo(L * .45, 0);
    g.strokeStyle = 'rgba(255,255,255,.28)';
    g.lineWidth = .5;
    g.stroke();
    g.restore();
  };

  // 1. 그림자
  ART.ell(g, 0, 3, 38, 13, 'rgba(15,30,10,.14)');
  ART.ell(g, 0, 2, 28, 10, 'rgba(15,30,10,.22)');
  ART.ell(g, 0, 1, 16, 5, 'rgba(15,30,10,.34)');

  // 2. 줄기 + 뿌리
  g.strokeStyle = '#3a2410'; g.lineCap = 'round';
  for (const [a, len, lw] of [[-2.9, 16, 3.5], [-2.4, 12, 2.5], [2.9, 16, 3.5], [2.4, 12, 2.5], [Math.PI/2, 10, 2.5]]) {
    g.lineWidth = lw; g.beginPath(); g.moveTo(0, -2);
    const tx = Math.cos(a) * len, ty = Math.abs(Math.sin(a)) * 3 + 2;
    g.quadraticCurveTo(tx * .5, ty * .3, tx, ty); g.stroke();
  }
  g.fillStyle = '#5a3820';
  g.beginPath(); g.moveTo(-9, 0); g.quadraticCurveTo(-6, -14, -4, -32); g.lineTo(4, -32); g.quadraticCurveTo(6, -14, 9, 0); g.closePath();
  g.fill(); g.strokeStyle = OUT; g.lineWidth = 1.5; g.stroke();
  g.fillStyle = '#8a5a33';
  g.beginPath(); g.moveTo(-9, 0); g.quadraticCurveTo(-6, -14, -4, -32); g.lineTo(-1, -32); g.quadraticCurveTo(-2, -14, -2.5, 0); g.closePath(); g.fill();
  g.strokeStyle = '#3a2410'; g.lineWidth = .8;
  for (const [x, dx] of [[-3.5, -1], [-1, .3], [1, .2], [3, -.3]]) {
    g.beginPath(); g.moveTo(x, -2); g.quadraticCurveTo(x + dx * 3, -16, x + dx * 2, -30); g.stroke();
  }

  // 3. 가지 5개
  g.strokeStyle = '#5a3820'; g.lineWidth = 5; g.lineCap = 'round';
  const branches = [
    [-3, -26, -20, -44, 5], [3, -25, 20, -42, 5],
    [-1, -28, -10, -54, 4.5], [1, -28, 10, -52, 4.5],
    [0, -30, 0, -58, 4],
  ];
  for (const [x0, y0, x1, y1, lw] of branches) {
    g.lineWidth = lw; g.beginPath(); g.moveTo(x0, y0);
    g.quadraticCurveTo((x0 + x1) / 2 + (rnd() - .5) * 3, (y0 + y1) / 2, x1, y1); g.stroke();
  }

  // 4. 캐노피 - 잎 130장 (성능 고려, 뒤→앞 순서)
  const canopyCenters = [
    { x: 0, y: -68, rx: 36, ry: 30 },
    { x: -22, y: -56, rx: 18, ry: 18 },
    { x: 22, y: -56, rx: 18, ry: 18 },
    { x: 0, y: -50, rx: 30, ry: 20 },
    { x: 0, y: -84, rx: 22, ry: 16 },
  ];
  const LEAF_N = 130;
  const leafList = [];
  for (let i = 0; i < LEAF_N; i++) {
    const c = canopyCenters[Math.floor(rnd() * canopyCenters.length)];
    const theta = rnd() * Math.PI * 2;
    const rr = Math.sqrt(rnd());
    const px = c.x + Math.cos(theta) * c.rx * rr;
    const py = c.y + Math.sin(theta) * c.ry * rr;
    const yNorm = (py + 100) / 60;
    const depth = Math.max(0, Math.min(1, yNorm));
    leafList.push({ x: px, y: py, depth, seed: rnd() });
  }
  leafList.sort((a, b) => a.depth - b.depth);
  for (const L of leafList) {
    const size = 9 + L.depth * 3.5 + L.seed * 2.8;
    const angle = rnd() * Math.PI * 2;
    let col, shadow, hi;
    if (L.depth < .25) { col = P.deep; shadow = null; hi = null; }
    else if (L.depth < .55) { col = P.dark; shadow = ART.shade(P.dark, -.2); hi = null; }
    else if (L.depth < .8) { col = P.mid; shadow = ART.shade(P.mid, -.2); hi = 'rgba(255,255,255,.18)'; }
    else { col = P.lit; shadow = ART.shade(P.lit, -.2); hi = 'rgba(255,255,255,.35)'; }
    drawLeaf(L.x, L.y, size, angle, col, shadow, hi);
  }

  // 캐노피 하이라이트
  for (const [hx, hy, hr] of [[-26, -72, 8], [-18, -84, 6], [-8, -90, 5]]) {
    ART.ell(g, hx, hy, hr, hr * .5, 'rgba(255,255,255,.32)');
  }

  // 5. 열매/꽃
  const fruitPts = [
    [-16, -50], [12, -52], [-4, -56], [8, -46], [-8, -66],
    [6, -66], [-1, -72], [18, -46], [-20, -58], [10, -74],
  ];
  if (P.fruitType === 'apple') {
    for (const [dx, dy] of fruitPts) {
      const r = 4.2;
      g.strokeStyle = '#4e331c'; g.lineWidth = 1; g.beginPath();
      g.moveTo(dx, dy - r * .8); g.lineTo(dx + 1, dy - r * 1.4); g.stroke();
      ART.ell(g, dx + 2.5, dy - r * 1.3, 2, 1.2, '#5ea83c');
      ART.ell(g, dx, dy, r, r * .95, P.fruit, 'rgba(60,10,5,.85)', 1);
      g.beginPath(); g.ellipse(dx + r * .25, dy + r * .3, r * .6, r * .5, 0, -Math.PI * .2, Math.PI * .9);
      g.fillStyle = P.fruitEdge; g.fill();
      ART.ell(g, dx - r * .1, dy - r * .1, r * .7, r * .65, P.fruit);
      ART.ell(g, dx - r * .35, dy - r * .4, r * .45, r * .4, P.fruitHi);
      ART.ell(g, dx - r * .45, dy - r * .5, r * .22, r * .16, P.fruitCore);
    }
  } else if (P.fruitType === 'peach') {
    for (const [dx, dy] of fruitPts) {
      const r = 4;
      g.strokeStyle = '#4e331c'; g.lineWidth = 1; g.beginPath();
      g.moveTo(dx, dy - r * .8); g.lineTo(dx + 1, dy - r * 1.4); g.stroke();
      ART.ell(g, dx + 2.5, dy - r * 1.3, 2, 1.2, '#5ea83c');
      ART.ell(g, dx, dy, r, r * .95, P.fruit, P.fruitEdge, .7);
      ART.ell(g, dx - r * .18, dy - r * .22, r * .65, r * .6, P.fruitHi);
      ART.ell(g, dx - r * .3, dy - r * .35, r * .3, r * .25, P.fruitCore);
    }
  } else if (P.fruitType === 'orange') {
    for (const [dx, dy] of fruitPts) {
      const r = 4;
      g.strokeStyle = '#4e331c'; g.lineWidth = 1; g.beginPath();
      g.moveTo(dx, dy - r * .8); g.lineTo(dx + 1, dy - r * 1.4); g.stroke();
      ART.ell(g, dx + 2.5, dy - r * 1.3, 2, 1.2, '#5ea83c');
      ART.ell(g, dx, dy, r, r * .95, P.fruit, P.fruitEdge, .7);
      ART.ell(g, dx - r * .18, dy - r * .22, r * .62, r * .58, P.fruitHi);
      ART.ell(g, dx - r * .3, dy - r * .35, r * .28, r * .22, P.fruitCore);
    }
  } else if (P.fruitType === 'blossom') {
    for (const [dx, dy] of fruitPts) {
      for (let k = 0; k < 5; k++) {
        const a = k * Math.PI * 2 / 5 - Math.PI / 2;
        const px = dx + Math.cos(a) * 2.4, py = dy + Math.sin(a) * 2.4;
        ART.ell(g, px, py, 1.8, 1.5, P.fruit, P.fruitEdge, .4);
      }
      ART.ell(g, dx, dy, 1.3, 1.3, P.fruitCore);
    }
  }
  // leafFall은 열매 없음 (단풍/은행)

  // 6. 밑동 풀 + 낙엽
  for (let i = 0; i < 6; i++) {
    const dx = -12 + i * 4.8, len = 4 + rnd() * 3, ang = -.25 + rnd() * .5;
    g.save(); g.translate(dx, 0); g.rotate(ang);
    g.strokeStyle = i % 2 ? '#4f9a3a' : '#5faa48'; g.lineWidth = 1.5; g.lineCap = 'round';
    g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(len * .5, -len * .5, len, -len); g.stroke();
    g.restore();
  }
  // 나무별 낙엽 색상
  const fallCols = P.fruitType === 'blossom' ? ['#ffc4d8', '#ffd9e4', '#ffb3cc'] :
                   kind === 'maple' ? ['#c04a28', '#d9793a', '#b8432a'] :
                   kind === 'ginkgo' ? ['#eab308', '#facc15', '#fde047'] :
                   ['#c04a28', '#d9793a', '#b8432a'];
  for (let i = 0; i < 3; i++) {
    g.save(); g.translate(-14 + i * 12, 1 + (i % 2)); g.rotate(.5 - i * .4);
    g.beginPath(); g.moveTo(-2.5, 0); g.quadraticCurveTo(0, -1.6, 2.5, 0); g.quadraticCurveTo(0, 1.6, -2.5, 0); g.closePath();
    g.fillStyle = fallCols[i]; g.fill();
    g.strokeStyle = 'rgba(60,20,10,.7)'; g.lineWidth = .4; g.stroke();
    g.restore();
  }

  return cv;
}
function getDeciduousSprite(kind) {
  const key = kind + '_0';
  if (!DECID_SPR[key]) DECID_SPR[key] = makeDeciduousSprite(kind, 0);
  return DECID_SPR[key];
}

// ============ v1.109: 꽃 9종 캐시 스프라이트 ============
const FLOWER_SPR = {};
function makeFlowerSprite(kind, variant) {
  const W = 100, H = 100;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const g = cv.getContext('2d');
  g.translate(W / 2, H - 8);

  let _seed = 44444 + variant * 333 + (kind.charCodeAt(0) || 0) * 19;
  const rnd = () => { _seed = (_seed * 9301 + 49297) % 233280; return _seed / 233280; };
  const OUT = 'rgba(30,20,10,.75)';
  const OUT_SOFT = 'rgba(30,20,10,.5)';

  // 공통: 흙 무더기
  const soil = (rx, ry) => {
    ART.ell(g, 0, -1, rx || 12, ry || 4.5, '#5d4128');
    ART.ell(g, -2, -2, (rx || 12) * .7, (ry || 4.5) * .55, '#74553a');
  };

  // 공통: 이파리 (넓적한 리본)
  const leaf = (x, y, len, ang, col1, col2) => {
    g.save(); g.translate(x, y); g.rotate(ang);
    g.beginPath();
    g.moveTo(0, 0);
    g.quadraticCurveTo(len * .3, -len * .35, len, 0);
    g.quadraticCurveTo(len * .3, len * .35, 0, 0);
    g.closePath();
    g.fillStyle = col1; g.fill();
    g.strokeStyle = OUT_SOFT; g.lineWidth = .6; g.stroke();
    // 잎맥
    g.beginPath(); g.moveTo(0, 0); g.lineTo(len * .85, 0);
    g.strokeStyle = col2 || 'rgba(255,255,255,.4)'; g.lineWidth = .5; g.stroke();
    g.restore();
  };

  // 공통: 꽃잎 여러 장
  const petals = (cx, cy, n, r, col, edge, hi) => {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const px = cx + Math.cos(a) * r * .55;
      const py = cy + Math.sin(a) * r * .55;
      g.beginPath();
      g.ellipse(px, py, r * .55, r * .4, a, 0, Math.PI * 2);
      g.fillStyle = col; g.fill();
      g.strokeStyle = edge; g.lineWidth = .6; g.stroke();
      if (hi) ART.ell(g, px - r * .15, py - r * .15, r * .18, r * .12, hi);
    }
  };

  switch (kind) {
    case 'sunflower': {
      soil(13, 5);
      // 3개 줄기 (앞/좌/우)
      const stems = [
        { x: -8, h: 30, s: .9, r: .9 },
        { x: 8, h: 33, s: .95, r: .95 },
        { x: 0, h: 42, s: 1.1, r: 1.15 }
      ];
      for (const st of stems) {
        // 줄기
        g.strokeStyle = '#3d7224'; g.lineWidth = 3 * st.s;
        g.beginPath(); g.moveTo(st.x * .4, 0);
        g.quadraticCurveTo(st.x * .8, -st.h * .5, st.x, -st.h); g.stroke();
        // 잎 2장 (좌우 교차)
        leaf(st.x * .4 - 3, -st.h * .4, 11 * st.s, -.5, '#4e9432', '#8fdb5f');
        leaf(st.x * .4 + 3, -st.h * .6, 11 * st.s, Math.PI + .5, '#5ca83c', '#8fdb5f');
        // 꽃 중심 (레이어)
        const fx = st.x, fy = -st.h, R = 10 * st.r;
        // 뒤 어두운 꽃잎
        for (let p = 0; p < 16; p++) {
          const a = (p / 16) * Math.PI * 2;
          ART.ell(g, fx + Math.cos(a) * R * .9, fy + Math.sin(a) * R * .9, R * .4, R * .32, '#c97708', OUT_SOFT, .4);
        }
        // 앞 밝은 꽃잎
        for (let p = 0; p < 14; p++) {
          const a = ((p + .5) / 14) * Math.PI * 2;
          ART.ell(g, fx + Math.cos(a) * R * .75, fy + Math.sin(a) * R * .75, R * .34, R * .26, '#f3a216', '#a35a04', .5);
          ART.ell(g, fx + Math.cos(a) * R * .6, fy + Math.sin(a) * R * .6, R * .2, R * .16, '#ffd235');
        }
        // 씨앗 중심
        ART.ell(g, fx, fy, R * .55, R * .5, '#462711', OUT, .8);
        ART.ell(g, fx, fy, R * .42, R * .38, '#633917');
        // 씨앗 점
        for (let s = 0; s < 12; s++) {
          const sa = (s / 12) * Math.PI * 2 + rnd();
          ART.ell(g, fx + Math.cos(sa) * R * .28, fy + Math.sin(sa) * R * .24, R * .06, R * .05, '#f5c53b');
        }
      }
      break;
    }
    case 'tulip': {
      soil(13, 5);
      // 잎 3장 (뒤)
      for (let i = 0; i < 3; i++) {
        const lx = (i - 1) * 6;
        leaf(lx, 0, 16, -.2 + i * .2, '#3f8a2a', '#7dce4f');
      }
      // 4송이 튤립 (다른 색)
      const tulips = [
        { x: -9, h: 24, col: '#f75985', dark: '#b82752', hi: '#ffaec4' },
        { x: -3, h: 30, col: '#f7b731', dark: '#c27e05', hi: '#ffeaa7' },
        { x: 4, h: 34, col: '#9b59b6', dark: '#632b7a', hi: '#d8b4e2' },
        { x: 10, h: 26, col: '#e74c3c', dark: '#a92415', hi: '#ff8a7d' },
      ];
      for (const t of tulips) {
        g.strokeStyle = '#3b7826'; g.lineWidth = 2;
        g.beginPath(); g.moveTo(t.x * .4, 0);
        g.quadraticCurveTo(t.x * .7, -t.h * .5, t.x, -t.h); g.stroke();
        // 튤립 꽃: 뒤 2장 + 앞 3장 컵 모양
        const fx = t.x, fy = -t.h;
        // 뒤 2장
        g.fillStyle = t.dark;
        g.beginPath(); g.moveTo(fx - 5, fy); g.quadraticCurveTo(fx - 6, fy - 13, fx, fy - 14);
        g.quadraticCurveTo(fx + 6, fy - 13, fx + 5, fy); g.closePath(); g.fill();
        // 앞 3장 (컵)
        g.fillStyle = t.col;
        g.beginPath(); g.moveTo(fx - 6, fy + 1);
        g.quadraticCurveTo(fx - 7, fy - 9, fx - 2, fy - 11);
        g.quadraticCurveTo(fx - 2, fy - 4, fx, fy + 2);
        g.quadraticCurveTo(fx + 2, fy - 4, fx + 2, fy - 11);
        g.quadraticCurveTo(fx + 7, fy - 9, fx + 6, fy + 1);
        g.quadraticCurveTo(fx, fy + 6, fx - 6, fy + 1);
        g.closePath(); g.fill();
        g.strokeStyle = OUT; g.lineWidth = .8; g.stroke();
        // 상단 하이라이트
        g.fillStyle = t.hi;
        g.beginPath(); g.moveTo(fx - 4, fy - 5);
        g.quadraticCurveTo(fx - 1.5, fy - 9, fx, fy - 6);
        g.quadraticCurveTo(fx + 1.5, fy - 9, fx + 4, fy - 5);
        g.quadraticCurveTo(fx, fy - 1, fx - 4, fy - 5); g.fill();
      }
      break;
    }
    case 'rose': {
      soil(14, 6);
      // 진짜 장미 잎 (톱니 + 뾰족 + 잎맥)
      const drawRoseLeaf = (x, y, len, ang, side) => {
        g.save(); g.translate(x, y); g.rotate(ang);
        const L = len, Wd = L * .42;
        // 잎 윤곽 (톱니 모양)
        g.beginPath();
        // 아래쪽 (톱니)
        const steps = 8;
        for (let i = 0; i <= steps; i++) {
          const t = i / steps;
          const px = L * t;
          const serr = (i % 2 ? Wd * .15 : 0); // 톱니
          const py = Math.sin(t * Math.PI) * Wd * .8 + serr;
          if (i === 0) g.moveTo(0, 0);
          g.lineTo(px, py);
        }
        // 위쪽 (톱니, 반대 방향)
        for (let i = steps; i >= 0; i--) {
          const t = i / steps;
          const px = L * t;
          const serr = (i % 2 ? -Wd * .15 : 0);
          const py = -Math.sin(t * Math.PI) * Wd * .8 + serr;
          g.lineTo(px, py);
        }
        g.closePath();
        // 잎 색 (윗면 밝은 → 아랫면 어두운 그라디언트)
        const lg = g.createLinearGradient(0, -Wd, 0, Wd);
        lg.addColorStop(0, '#4a9c3a');   // 위 (햇빛 받는 쪽)
        lg.addColorStop(.5, '#3a7a2e');
        lg.addColorStop(1, '#1e4d14');   // 아래 (그늘)
        g.fillStyle = lg; g.fill();
        g.strokeStyle = '#0d2c0a'; g.lineWidth = .7; g.stroke();
        // 중앙 잎맥 (굵게)
        g.beginPath(); g.moveTo(0, 0); g.lineTo(L * .9, 0);
        g.strokeStyle = '#7fd070'; g.lineWidth = .7; g.stroke();
        // 측맥 3~4쌍 (V자)
        for (let k = 1; k <= 4; k++) {
          const t = k / 5;
          const mx = L * t;
          const mlen = Wd * .7 * (1 - t * .5);
          g.beginPath();
          g.moveTo(mx, 0);
          g.lineTo(mx + L * .12, -mlen);
          g.moveTo(mx, 0);
          g.lineTo(mx + L * .12, mlen);
          g.strokeStyle = '#7fd070'; g.lineWidth = .5; g.stroke();
        }
        // 뾰족한 끝 강조
        g.beginPath();
        g.arc(L, 0, 1, 0, Math.PI * 2);
        g.fillStyle = '#8fdb5f'; g.fill();
        // 잎 하이라이트 (윗면 왼쪽)
        g.beginPath();
        g.ellipse(L * .3, -Wd * .35, L * .18, Wd * .15, 0, 0, Math.PI * 2);
        g.fillStyle = 'rgba(255,255,255,.35)'; g.fill();
        g.restore();
      };

      // 잎 9장 (장미 덤불처럼 자연스럽게)
      const roseLeaves = [
        { x: -11, y: -8, len: 13, ang: -2.7 },
        { x: 11, y: -8, len: 13, ang: -0.4 },
        { x: -9, y: -16, len: 12, ang: -2.4 },
        { x: 9, y: -16, len: 12, ang: -0.7 },
        { x: -4, y: -22, len: 12, ang: -2.1 },
        { x: 4, y: -22, len: 12, ang: -1.0 },
        { x: 0, y: -6, len: 11, ang: -1.57 },
        { x: -12, y: -12, len: 11, ang: -3.0 },
        { x: 12, y: -12, len: 11, ang: -0.1 },
      ];
      for (const l of roseLeaves) drawRoseLeaf(l.x, l.y, l.len, l.ang);

      // 8송이 장미 (나선형 꽃잎 - 그대로 유지)
      const roses = [
        { x: -10, y: -10, r: 6 }, { x: 10, y: -11, r: 6 },
        { x: 0, y: -15, r: 6.5 },
        { x: -8, y: -22, r: 6 }, { x: 8, y: -21, r: 6 },
        { x: 0, y: -27, r: 6.5 },
        { x: -4, y: -7, r: 5 }, { x: 4, y: -7, r: 5 },
      ];
      for (const r of roses) {
        // 어두운 외곽
        ART.ell(g, r.x, r.y, r.r, r.r * .92, '#8a1a3a', '#5a0a22', .9);
        // 중간
        ART.ell(g, r.x, r.y, r.r * .92, r.r * .85, '#d12e50');
        // 나선형 꽃잎
        for (let layer = 0; layer < 4; layer++) {
          const lr = r.r * (.7 - layer * .14);
          const rot = layer * .8;
          for (let p = 0; p < 5; p++) {
            const a = (p / 5) * Math.PI * 2 + rot;
            const px = r.x + Math.cos(a) * lr * .3;
            const py = r.y + Math.sin(a) * lr * .3;
            g.beginPath();
            g.ellipse(px, py, lr * .55, lr * .38, a, 0, Math.PI * 2);
            const cols = ['#ee496c', '#fa7290', '#ff9ebb', '#ffd0d8'];
            g.fillStyle = cols[layer];
            g.fill();
            g.strokeStyle = 'rgba(120,20,40,.4)'; g.lineWidth = .4; g.stroke();
          }
        }
        // 중심 코어
        ART.ell(g, r.x, r.y, r.r * .2, r.r * .18, '#8a1a3a');
        ART.ell(g, r.x - r.r * .05, r.y - r.r * .05, r.r * .12, r.r * .1, '#ffc0d0');
      }
      break;
    }
    case 'lavender': {
      soil(13, 5);
      // 은빛 세이지 잎 뭉치
      for (const [px, py, rx, ry, col] of [[-8, -6, 8, 5.5, '#5f8d6e'], [8, -6, 8, 5.5, '#689977'], [0, -8, 9.5, 6.5, '#74a884']]) {
        ART.ell(g, px, py, rx, ry, col, OUT, .8);
        ART.ell(g, px - 2, py - 2, rx * .5, ry * .45, '#93c79d');
      }
      // 7개 라벤더 스파이크
      const spikes = [[-10, 28], [-6, 33], [-2, 38], [2, 39], [6, 34], [10, 29], [0, 31]];
      for (const [sx0, h] of spikes) {
        const tx = sx0 + (rnd() - .5) * 3;
        g.strokeStyle = '#4d7c5b'; g.lineWidth = 1.6;
        g.beginPath(); g.moveTo(sx0 * .45, -3);
        g.quadraticCurveTo(sx0 * .75, -h * .5, tx, -h); g.stroke();
        // 꽃 이삭 (5-7 덩어리)
        for (let b = 0; b < 7; b++) {
          const u = .48 + b * .08;
          const bx = sx0 * .45 + (tx - sx0 * .45) * u;
          const by = -3 + (-h + 3) * u;
          const col = b % 2 ? '#8e54e9' : '#a770ef';
          ART.ell(g, bx - 1.8, by - .5, 2.4, 1.8, col, '#4a2380', .5);
          ART.ell(g, bx + 1.8, by - 1.2, 2.4, 1.8, '#b98eff', '#4a2380', .5);
          ART.ell(g, bx, by - 1, 1.4, 1.1, '#d6bcfa');
        }
        ART.ell(g, tx, -h - 1.5, 1.8, 2.4, '#d6bcfa');
      }
      break;
    }
    case 'daisy': {
      soil(13, 5);
      // 초록 쿠션
      for (const [px, py, r, col] of [[-8, -6, 8, '#3d8232'], [8, -6, 8, '#46913a'], [-4, -12, 9, '#52a345'], [5, -12, 9, '#5eb350'], [0, -8, 9.5, '#68bf58']]) {
        ART.ell(g, px, py, r, r * .78, col, OUT, .8);
      }
      // 9송이 데이지
      const blooms = [
        { x: -9, y: -13, s: .9 }, { x: 9, y: -14, s: .9 },
        { x: -4, y: -19, s: 1 }, { x: 5, y: -19, s: 1 },
        { x: 0, y: -14, s: 1.05 },
        { x: -7, y: -24, s: .95 }, { x: 4, y: -25, s: .95 },
        { x: -3, y: -28, s: .9 }, { x: 2, y: -29, s: .85 },
      ];
      for (const b of blooms) {
        const fx = b.x, fy = b.y, sc = b.s;
        // 줄기
        g.strokeStyle = '#3b7a2e'; g.lineWidth = 1.4;
        g.beginPath(); g.moveTo(b.x * .5, -3); g.lineTo(fx, fy); g.stroke();
        // 꽃잎 8장 (흰색)
        for (let p = 0; p < 8; p++) {
          const a = (p / 8) * Math.PI * 2;
          ART.ell(g, fx + Math.cos(a) * 4.2 * sc, fy + Math.sin(a) * 3.8 * sc, 2.4 * sc, 1.7 * sc, '#ffffff', '#cbd5e1', .5);
        }
        // 노란 중심
        ART.ell(g, fx, fy, 2.6 * sc, 2.4 * sc, '#f59e0b', '#b45309', .6);
        ART.ell(g, fx - .8 * sc, fy - .8 * sc, 1.2 * sc, 1 * sc, '#fde047');
        ART.ell(g, fx + .6 * sc, fy + .6 * sc, .7 * sc, .6 * sc, '#fff8b0');
      }
      break;
    }
    case 'cosmos': {
      soil(12, 5);
      // 6송이 코스모스 (다른 파스텔 색)
      const list = [
        { x: -9, y: -26, s: .95, col: '#ff85a2', dark: '#c9184a' },
        { x: 9, y: -28, s: .95, col: '#fbcfe8', dark: '#db2777' },
        { x: -4, y: -34, s: 1.05, col: '#f472b6', dark: '#9d174d' },
        { x: 5, y: -36, s: 1, col: '#ffffff', dark: '#ec4899' },
        { x: 0, y: -22, s: .95, col: '#ff9ebb', dark: '#be185d' },
        { x: -3, y: -40, s: .85, col: '#ffe066', dark: '#d97706' },
      ];
      for (const fl of list) {
        const fx = fl.x, fy = fl.y, sc = fl.s;
        // 줄기 (가는 것)
        g.strokeStyle = '#4d9138'; g.lineWidth = 1.4;
        g.beginPath(); g.moveTo(fl.x * .35, 0);
        g.quadraticCurveTo(fl.x * .7, fy * .5, fx, fy); g.stroke();
        // 깃털 잎
        leaf(fl.x * .6 - 4, fy * .5, 7 * sc, -.2, '#5eb346', '#96d86f');
        leaf(fl.x * .6 + 4, fy * .6, 7 * sc, Math.PI + .2, '#5eb346', '#96d86f');
        // 꽃잎 8장 (넓적한)
        for (let p = 0; p < 8; p++) {
          const a = (p / 8) * Math.PI * 2 + .2;
          ART.ell(g, fx + Math.cos(a) * 5.2 * sc, fy + Math.sin(a) * 4.6 * sc, 2.8 * sc, 2.1 * sc, fl.col, fl.dark, .55);
        }
        // 노란 중심
        ART.ell(g, fx, fy, 2.5 * sc, 2.2 * sc, '#fbbf24', '#92400e', .6);
        ART.ell(g, fx - .6 * sc, fy - .6 * sc, 1.1 * sc, 1 * sc, '#fef08a');
      }
      break;
    }
    case 'hydrangea': {
      soil(14, 6);
      // 개별 잎사귀 (넓적한 잎 여러 장)
      const hLeaves = [
        { x: -11, y: -9, len: 13, ang: -2.7, col: '#2d6a4f' },
        { x: 11, y: -9, len: 13, ang: -0.4, col: '#2d6a4f' },
        { x: -9, y: -16, len: 12, ang: -2.4, col: '#40916c' },
        { x: 9, y: -16, len: 12, ang: -0.7, col: '#40916c' },
        { x: -4, y: -22, len: 11, ang: -2.0, col: '#52b788' },
        { x: 4, y: -22, len: 11, ang: -1.1, col: '#52b788' },
        { x: 0, y: -7, len: 11, ang: -1.57, col: '#40916c' },
      ];
      for (const l of hLeaves) {
        g.save(); g.translate(l.x, l.y); g.rotate(l.ang);
        g.beginPath();
        g.moveTo(0, 0);
        g.quadraticCurveTo(l.len * .4, -l.len * .5, l.len, 0);
        g.quadraticCurveTo(l.len * .4, l.len * .5, 0, 0);
        g.closePath();
        g.fillStyle = l.col; g.fill();
        g.strokeStyle = '#1b4332'; g.lineWidth = .7; g.stroke();
        // 잎맥 (중앙 + 측맥)
        g.beginPath(); g.moveTo(0, 0); g.lineTo(l.len * .9, 0);
        g.strokeStyle = '#95d5b2'; g.lineWidth = .6; g.stroke();
        for (const k of [-.25, .25]) {
          g.beginPath();
          g.moveTo(l.len * .4, 0);
          g.lineTo(l.len * .7, l.len * .15 * k * 4);
          g.strokeStyle = '#95d5b2'; g.lineWidth = .4; g.stroke();
        }
        g.restore();
      }
      // 6송이 수국 (작은 4장 꽃이 모여 다발)
      const heads = [
        { x: -9, y: -15, base: '#63b3ed', mid: '#90cdf4', hi: '#ebf8ff' },
        { x: 9, y: -16, base: '#b794f4', mid: '#d6bcfa', hi: '#faf5ff' },
        { x: 0, y: -21, base: '#7f9cf5', mid: '#a3bffa', hi: '#ebf4ff' },
        { x: -6, y: -27, base: '#f687b3', mid: '#fbb6ce', hi: '#fff5f7' },
        { x: 6, y: -27, base: '#63b3ed', mid: '#bee3f8', hi: '#ffffff' },
        { x: 0, y: -32, base: '#f6ad55', mid: '#fbd38d', hi: '#fffaf0' },
      ];
      for (const h of heads) {
        // 다발 중심 (약간 보이게)
        ART.ell(g, h.x, h.y, 6, 5.5, h.base + '88', null);
        // 작은 4장 꽃 12개 (수국 실제 모양)
        const flowerCount = 12;
        for (let f = 0; f < flowerCount; f++) {
          const a = (f / flowerCount) * Math.PI * 2 + rnd() * .3;
          const rr = f === 0 ? 0 : 2.5 + rnd() * 2.5;
          const fx = h.x + Math.cos(a) * rr;
          const fy = h.y + Math.sin(a) * rr * .9;
          // 4장 꽃잎
          for (let p = 0; p < 4; p++) {
            const pa = (p / 4) * Math.PI * 2 + a;
            const px = fx + Math.cos(pa) * 1.8;
            const py = fy + Math.sin(pa) * 1.6;
            ART.ell(g, px, py, 1.6, 1.3, h.mid, h.base, .35);
          }
          // 중심 (작은 점)
          ART.ell(g, fx, fy, .7, .6, h.hi);
        }
      }
      break;
    }
    case 'lily': {
      soil(12, 5);
      // 잎 7장 (부채꼴)
      for (let i = -3; i <= 3; i++) {
        const lx = i * 3.5;
        g.fillStyle = i % 2 ? '#2f7a38' : '#3f9142';
        g.beginPath(); g.moveTo(lx * .5, 0);
        g.quadraticCurveTo(lx * 1.6, -12, lx * 2.1, -20);
        g.quadraticCurveTo(lx * 1.1, -9, lx * .2, 0); g.fill();
        g.strokeStyle = 'rgba(20,60,20,.5)'; g.lineWidth = .5; g.stroke();
      }
      // 4송이 백합
      const lilies = [
        { x: -8, y: -26, s: .95, col: '#fff5f7', core: '#e53e3e' },
        { x: 8, y: -27, s: .95, col: '#ffffff', core: '#ecc94b' },
        { x: -2, y: -35, s: 1.1, col: '#fed7e2', core: '#d53f8c' },
        { x: 4, y: -32, s: 1, col: '#ffffff', core: '#f6ad55' },
      ];
      for (const l of lilies) {
        const fx = l.x, fy = l.y, sc = l.s;
        // 줄기
        g.strokeStyle = '#2f7a38'; g.lineWidth = 1.8;
        g.beginPath(); g.moveTo(l.x * .4, 0); g.lineTo(fx, fy); g.stroke();
        // 꽃잎 6장 (별 모양)
        for (let p = 0; p < 6; p++) {
          const a = (p / 6) * Math.PI * 2;
          // 꽃잎 (뾰족한 타원)
          g.save(); g.translate(fx, fy); g.rotate(a);
          g.beginPath(); g.moveTo(0, 0);
          g.quadraticCurveTo(3 * sc, -2 * sc, 6 * sc, 0);
          g.quadraticCurveTo(3 * sc, 2 * sc, 0, 0);
          g.closePath();
          g.fillStyle = l.col; g.fill();
          g.strokeStyle = '#b83280'; g.lineWidth = .5; g.stroke();
          g.restore();
        }
        // 중심
        ART.ell(g, fx, fy, 2.2 * sc, 2 * sc, l.core);
        ART.ell(g, fx, fy, 1 * sc, .9 * sc, '#ffffff');
        // 수술 (긴 것)
        g.strokeStyle = '#a05050'; g.lineWidth = .8;
        for (let s = 0; s < 5; s++) {
          const a = (s / 5) * Math.PI * 2 + .3;
          g.beginPath(); g.moveTo(fx, fy);
          g.lineTo(fx + Math.cos(a) * 5 * sc, fy + Math.sin(a) * 5 * sc); g.stroke();
          ART.ell(g, fx + Math.cos(a) * 5 * sc, fy + Math.sin(a) * 5 * sc, 1 * sc, 1 * sc, '#8a5a2a');
        }
      }
      break;
    }
    case 'hibiscus': {
      soil(13, 6);
      // 개별 잎사귀 (짙은 초록, 톱니)
      const hbLeaves = [
        { x: -11, y: -9, len: 12, ang: -2.7, col: '#1e5631' },
        { x: 11, y: -9, len: 12, ang: -0.4, col: '#1e5631' },
        { x: -9, y: -17, len: 11, ang: -2.5, col: '#2e7d47' },
        { x: 9, y: -17, len: 11, ang: -0.6, col: '#2e7d47' },
        { x: -3, y: -24, len: 10, ang: -2.1, col: '#399154' },
        { x: 3, y: -24, len: 10, ang: -1.0, col: '#399154' },
        { x: 0, y: -7, len: 11, ang: -1.57, col: '#2e7d47' },
      ];
      for (const l of hbLeaves) {
        g.save(); g.translate(l.x, l.y); g.rotate(l.ang);
        g.beginPath();
        g.moveTo(0, 0);
        g.quadraticCurveTo(l.len * .4, -l.len * .42, l.len, 0);
        g.quadraticCurveTo(l.len * .4, l.len * .42, 0, 0);
        g.closePath();
        g.fillStyle = l.col; g.fill();
        g.strokeStyle = '#0d2c1a'; g.lineWidth = .7; g.stroke();
        // 잎맥
        g.beginPath(); g.moveTo(0, 0); g.lineTo(l.len * .9, 0);
        g.strokeStyle = '#7fd99a'; g.lineWidth = .6; g.stroke();
        for (const k of [-.2, .2]) {
          g.beginPath();
          g.moveTo(l.len * .35, 0);
          g.lineTo(l.len * .65, l.len * .15 * k * 4);
          g.strokeStyle = '#7fd99a'; g.lineWidth = .4; g.stroke();
        }
        g.restore();
      }
      // 6송이 무궁화 (5장 꽃잎 + 긴 수술대)
      const blooms = [
        { x: -8, y: -14, col: '#ff4d6d', edge: '#a01a3a', hi: '#ffd0d8' },
        { x: 8, y: -15, col: '#ff758f', edge: '#a01a3a', hi: '#ffe0e6' },
        { x: -4, y: -24, col: '#f72585', edge: '#8a0a3a', hi: '#ffb8d0' },
        { x: 5, y: -23, col: '#ff9e00', edge: '#9a4a00', hi: '#ffe0a8' },
        { x: 0, y: -19, col: '#ff4d6d', edge: '#a01a3a', hi: '#ffd0d8' },
        { x: 0, y: -30, col: '#c9184a', edge: '#6a0a20', hi: '#ffb0c0' },
      ];
      for (const b of blooms) {
        const fx = b.x, fy = b.y;
        // 5장 꽃잎 (넓적하고 뾰족, 물결 모양)
        for (let p = 0; p < 5; p++) {
          const a = (p / 5) * Math.PI * 2 - Math.PI / 2;
          const px = fx + Math.cos(a) * 3.5;
          const py = fy + Math.sin(a) * 3.2;
          // 꽃잎 (넓적한 타원)
          g.save(); g.translate(px, py); g.rotate(a);
          g.beginPath();
          g.moveTo(-3.5, 0);
          g.quadraticCurveTo(-3, -3, 0, -3.5);
          g.quadraticCurveTo(3, -3, 3.5, 0);
          g.quadraticCurveTo(3, 2.5, 0, 2.8);
          g.quadraticCurveTo(-3, 2.5, -3.5, 0);
          g.closePath();
          g.fillStyle = b.col; g.fill();
          g.strokeStyle = b.edge; g.lineWidth = .5; g.stroke();
          // 물결 무늬 (꽃잎 안쪽)
          g.beginPath();
          g.moveTo(-2, 0);
          g.quadraticCurveTo(-1, -1.5, 0, 0);
          g.quadraticCurveTo(1, 1.5, 2, 0);
          g.strokeStyle = b.hi; g.lineWidth = .7; g.stroke();
          // 하이라이트
          ART.ell(g, -1.2, -1.2, 1, .7, b.hi);
          g.restore();
        }
        // 중심 (진한 자주)
        ART.ell(g, fx, fy, 2.2, 2, '#6a0a20', null);
        ART.ell(g, fx, fy, 1.5, 1.4, '#a01a3a');
        // 긴 수술대 (5개, 방사형)
        for (let s = 0; s < 5; s++) {
          const sa = (s / 5) * Math.PI * 2 + .3;
          const ex = fx + Math.cos(sa) * 5;
          const ey = fy + Math.sin(sa) * 4.5;
          g.strokeStyle = '#ffd166'; g.lineWidth = 1;
          g.beginPath(); g.moveTo(fx, fy); g.lineTo(ex, ey); g.stroke();
          // 수술 끝 (꽃밥)
          ART.ell(g, ex, ey, 1.2, 1.1, '#ffd166');
          ART.ell(g, ex, ey, .6, .5, '#c9962a');
        }
        // 중앙 수술 하나 (더 긴 것)
        g.strokeStyle = '#ffd166'; g.lineWidth = 1.2;
        g.beginPath(); g.moveTo(fx, fy); g.lineTo(fx + 2, fy - 5.5); g.stroke();
        ART.ell(g, fx + 2.2, fy - 5.8, 1.3, 1.2, '#ffd166');
      }
      break;
    }
  }

  return cv;
}
function getFlowerSprite(kind) {
  const key = kind + '_0';
  if (!FLOWER_SPR[key]) FLOWER_SPR[key] = makeFlowerSprite(kind, 0);
  return FLOWER_SPR[key];
}

// ============ end 캐시 스프라이트 ============
  function tree(c, x, y, s) {
    const q = Q(x, y);
    const spr = getTreeSprite(s || 0);
    // 스프라이트는 (0,0)이 나무 밑동(하단 중앙)이라, q 위치에 그대로 그림
    c.drawImage(spr, q[0] - spr.width / 2, q[1] - spr.height + 6);
}

  function fence(c, x0, y0, x1, y1) {
    const n = Math.max(2, Math.round(Math.hypot(x1 - x0, y1 - y0) / .35));
    for (let i = 0; i <= n; i++) {
      const u = i / n, a = Q(x0 + (x1 - x0) * u, y0 + (y1 - y0) * u);
      c.fillStyle = '#ffffff'; c.fillRect(a[0] - 1, a[1] - 9, 2, 9);
    }
    const a = Q(x0, y0, 6), b = Q(x1, y1, 6);
    c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]);
    c.strokeStyle = '#ffffff'; c.lineWidth = 1.5; c.stroke();
  }

  function frameOn(o, W, D, hs) {
    const r = o.r || 0;
    ROT = r >= 2 ? { ox: o.x, oy: o.y, W, D } : null;
    MR = r % 2 ? { ox: o.x, oy: o.y } : null;
    HS = hs || null;
  }
  function frameOff() { ROT = null; MR = null; HS = null; }
  function drawHouse(c, h, T) {
    // 5x5 부지 전용 정밀 렌더링: 회전(r) 시에도 위치가 전혀 이동하지 않고
    // 부지 중심(cx, cy)에서 제자리 회전하며, 3x3 칸을 차지하도록 알맞게 확대됨
    drawHouse_(c, h, T);
  }

  // ================= v2026-10-08: 집 크기 3x3 중앙 차지 + 제자리 방향 전환 (나무 제거) =================
  function drawHouse_(c, h, T) {
    const cx = h.x + 2.5, cy = h.y + 2.5;
    const r = ((h.r || 0) % 2 + 2) % 2; // 0: 남서향(기본), 1: 남동향(반전)

    // 1. 마당 잔디 (5x5 부지 전체를 감싸는 부드러운 초록 잔디밭)
    poly(c, [
      [ISO.wx(h.x + .15, h.y + .15), ISO.wy(h.x + .15, h.y + .15)],
      [ISO.wx(h.x + 4.85, h.y + .15), ISO.wy(h.x + 4.85, h.y + .15)],
      [ISO.wx(h.x + 4.85, h.y + 4.85), ISO.wy(h.x + 4.85, h.y + 4.85)],
      [ISO.wx(h.x + .15, h.y + 4.85), ISO.wy(h.x + .15, h.y + 4.85)]
    ], 'rgba(125,190,75,.42)');

    // 2. 5x5 부지의 정중앙 3x3 (cx-1.5 ~ cx+1.5, cy-1.5 ~ cy+1.5) 집 밑바닥 기초/마루
    poly(c, [
      [ISO.wx(cx - 1.5, cy - 1.5), ISO.wy(cx - 1.5, cy - 1.5)],
      [ISO.wx(cx + 1.5, cy - 1.5), ISO.wy(cx + 1.5, cy - 1.5)],
      [ISO.wx(cx + 1.5, cy + 1.5), ISO.wy(cx + 1.5, cy + 1.5)],
      [ISO.wx(cx - 1.5, cy + 1.5), ISO.wy(cx - 1.5, cy + 1.5)]
    ], 'rgba(105,160,60,.30)');

    const tier = Math.min(HOUSE_TIER_MAX, (h.o && h.o.tier) || 1);
    const img = getTownHouseImg(tier);

    // 3. 집 본체: 5x5 땅 정중앙(cx, cy)의 3x3 칸(너비 약 192px)을 정확히 차지하도록 배치
    // PNG 스프라이트(512x512)의 아이소메트릭 밑면 중심 Y좌표 비율은 0.60~0.62(평균 0.61)에 위치함.
    // 기존에 남쪽 맨 끝점(0.792)을 기준으로 잡아 집 전체가 북쪽 모서리로 밀렸던 문제를 완벽 해결!
    // 밑면 중심(anchorY)을 (cx, cy)에 정확히 맞춤으로써 5x5 땅의 완벽한 정중앙 3x3에 안착함.
    // 좌회전/우회전 시 위치는 (cx, cy) 제자리에서 전혀 이동하지 않고 방향만 깔끔하게 전환됨.
    if (img.complete && img.naturalWidth) {
      const q = [ISO.wx(cx, cy), ISO.wy(cx, cy)];
      const dw = 285, dh = dw * (img.naturalHeight || 512) / (img.naturalWidth || 512);
      const TIER_RATIOS = {
        1: 0.604, 2: 0.622, 3: 0.610, 4: 0.610, 5: 0.611,
        6: 0.610, 7: 0.600, 8: 0.606, 9: 0.613, 10: 0.614,
        11: 0.616, 12: 0.640
      };
      const ratioY = TIER_RATIOS[tier] || 0.610;
      const anchorY = dh * ratioY;

      if (r === 1) {
        c.save();
        c.translate(q[0], q[1]);
        c.scale(-1, 1);
        c.drawImage(img, -dw / 2, -anchorY, dw, dh);
        c.restore();
      } else {
        c.drawImage(img, q[0] - dw / 2, q[1] - anchorY, dw, dh);
      }
    }

    // 4. 앞마당 우체통: 집 앞마당(도로 쪽) 진입로에 배치 (집과 겹치지 않고 마당 가장자리에 단정하게 위치)
    const mb = (r === 1)
      ? [ISO.wx(cx + 0.6, cy + 2.1), ISO.wy(cx + 0.6, cy + 2.1)]
      : [ISO.wx(cx - 0.6, cy + 2.1), ISO.wy(cx - 0.6, cy + 2.1)];
    c.fillStyle = '#6a452a'; c.fillRect(mb[0] - 1, mb[1] - 12, 2.2, 12);
    ART.rrect(c, mb[0] - 4.5, mb[1] - 17, 9, 6.5, 3);
    c.fillStyle = '#c0392b'; c.fill(); c.strokeStyle = ART.OUT; c.lineWidth = .9; c.stroke();
    c.fillStyle = '#e04038'; c.fillRect(mb[0] + 3.5, mb[1] - 19, 3, 2.5);
  }
  // ---------------- saplings, trees & flowers (grow over the days) ----------------
  function drawTree(c, o, T, ghost) {
    const st = ghost ? 2 : stageOf(S, o), k = o.k, q = Q(o.x + .5, o.y + .5), sw = Math.sin(T * 1.4 + o.x * .7 + o.y) * 1.5;
    const isFlw = D[k] && D[k].flower;
    // Ground shadow & soft grass bedding: much wider and deeper for tall majestic trees!
    ART.ell(c, q[0], q[1], isFlw ? (st === 2 ? 14 : 9) : (st === 2 ? 30 : 18), isFlw ? (st === 2 ? 6 : 4) : (st === 2 ? 11 : 7), 'rgba(0,0,0,.15)');
    if (st === 0) { // a sapling: rich soil mound, sturdy green sprout with twin leaves & dew
      ART.ell(c, q[0], q[1] - 1, 9, 4, '#5c3d24');
      ART.ell(c, q[0], q[1] - 2, 7, 3, '#785030');
      c.strokeStyle = '#3e7025'; c.lineWidth = 2.2; c.beginPath(); c.moveTo(q[0], q[1] - 2); c.quadraticCurveTo(q[0] + sw * .2, q[1] - 8, q[0] + sw * .4, q[1] - 14); c.stroke();
      ART.ell(c, q[0] - 4 + sw * .4, q[1] - 13, 4.2, 2.4, '#6db53e', ART.OUT, .8);
      ART.ell(c, q[0] + 4 + sw * .4, q[1] - 15, 4.2, 2.4, '#87d152', ART.OUT, .8);
      ART.ell(c, q[0] + 2 + sw * .4, q[1] - 15.5, 1.2, 1.2, '#ffffff');
      if (D[k].flower) return;
      c.font = 'bold 9px sans-serif'; c.textAlign = 'center'; c.fillStyle = '#4c8a2a'; c.fillText('🌱', q[0], q[1] - 20); c.textAlign = 'start'; return;
    }
    // Trees scaled up so they tower over 80px characters (now ~180-230px tall, towering majestically!)
    const s = isFlw ? (st === 2 ? 1.15 : .72) : (st === 2 ? (k === 'evergreen' ? 2.35 : 2.55) : 1.6);
    c.save(); c.translate(q[0], q[1]); c.scale(s, s);

    if (k === 'sunflower' || k === 'tulip' || k === 'rose' || k === 'lavender' ||
      k === 'daisy' || k === 'cosmos' || k === 'hydrangea' || k === 'lily' || k === 'hibiscus') {
    // v1.109: 꽃 9종 캐시 스프라이트
    const spr = getFlowerSprite(k);
    const swx = sw * 0.3;
    c.drawImage(spr, -spr.width / 2 + swx, -spr.height + 6);
  }
    else if (k === 'bamboo') {
      // v1.109: 자연스러운 대나무 숲 (6-7개, 흩어진 배치)
      ART.ell(c, 0, -1, 15, 6, '#4f6d3a');
      ART.ell(c, -2, -2, 12, 4.5, '#5d7a44');
      // 땅에 떨어진 대나무 잎
      for (const [lx, ly, ang, col] of [[-9, -1, .4, '#5c9e31'], [7, -2, -.6, '#72b840'], [2, 1, 1.1, '#64ab35'], [-4, 2, -.3, '#53912b']]) {
        c.save(); c.translate(lx, ly); c.rotate(ang);
        c.beginPath(); c.moveTo(-3, 0); c.quadraticCurveTo(0, -1.2, 3, 0); c.quadraticCurveTo(0, 1.2, -3, 0); c.closePath();
        c.fillStyle = col; c.fill();
        c.strokeStyle = 'rgba(30,60,20,.6)'; c.lineWidth = .4; c.stroke();
        c.restore();
      }
      // 대나무 줄기 7개 (자연스러운 배치: 좌우로 흩어짐 + 다른 높이)
      const stalks = [
        { x: -11, h: 44, col: '#4a8a28', lw: 2.6 },   // 왼쪽 가장자리, 낮음
        { x: -6, h: 58, col: '#5c9e31', lw: 3 },      // 왼쪽 안쪽
        { x: -2, h: 72, col: '#72b840', lw: 3.4 },    // 중앙 왼쪽, 가장 큼
        { x: 2, h: 66, col: '#64ab35', lw: 3.2 },     // 중앙 오른쪽
        { x: 7, h: 54, col: '#53912b', lw: 2.8 },     // 오른쪽 안쪽
        { x: 11, h: 46, col: '#4a8a28', lw: 2.6 },    // 오른쪽 가장자리
        { x: 0, h: 40, col: '#5c9e31', lw: 2.4 },     // 중앙 짧은 것 (앞)
      ];
      for (const s of stalks) {
        const swayX = sw * .5 * (1 + s.x * .03);
        // 줄기 (그라디언트로 입체감)
        c.save();
        const grad = c.createLinearGradient(s.x - s.lw, 0, s.x + s.lw, 0);
        grad.addColorStop(0, s.col);
        grad.addColorStop(.5, s.col);
        grad.addColorStop(1, '#3a6e20');
        c.strokeStyle = ART.OUT; c.lineWidth = s.lw + 1;
        c.beginPath(); c.moveTo(s.x, 0);
        c.quadraticCurveTo(s.x + swayX * .4, -s.h * .5, s.x + swayX, -s.h); c.stroke();
        c.strokeStyle = grad; c.lineWidth = s.lw;
        c.beginPath(); c.moveTo(s.x, 0);
        c.quadraticCurveTo(s.x + swayX * .4, -s.h * .5, s.x + swayX, -s.h); c.stroke();
        // 하이라이트 (왼쪽)
        c.strokeStyle = 'rgba(180,240,140,.5)'; c.lineWidth = s.lw * .35;
        c.beginPath(); c.moveTo(s.x - s.lw * .3, -1);
        c.quadraticCurveTo(s.x + swayX * .4 - s.lw * .3, -s.h * .5, s.x + swayX - s.lw * .3, -s.h + 1); c.stroke();
        // 마디 (ring) — 더 뚜렷하게
        for (let ny = 8; ny < s.h - 4; ny += 9 + (s.h % 4)) {
          const nx = s.x + swayX * (ny / s.h);
          // 마디 어두운 선
          c.strokeStyle = '#2a5a18'; c.lineWidth = s.lw * .5;
          c.beginPath(); c.moveTo(nx - s.lw * .7, -ny); c.lineTo(nx + s.lw * .7, -ny); c.stroke();
          // 마디 밝은 하이라이트 (살짝 위)
          c.strokeStyle = '#a8e07a'; c.lineWidth = s.lw * .3;
          c.beginPath(); c.moveTo(nx - s.lw * .6, -ny - 1); c.lineTo(nx + s.lw * .6, -ny - 1); c.stroke();
        }
        // 잎 (위쪽에서 부채꼴로 뻗음)
        const topX = s.x + swayX, topY = -s.h;
        const numLeaves = 5;
        for (let l = 0; l < numLeaves; l++) {
          const la = -.7 + (l / (numLeaves - 1)) * 1.4; // 부채꼴 각도
          const llen = 9 + (s.h % 5);
          const lx1 = topX + Math.cos(la - Math.PI / 2) * llen;
          const ly1 = topY + Math.sin(la - Math.PI / 2) * llen;
          // 잎 (긴 타원)
          c.save(); c.translate(topX, topY); c.rotate(la - Math.PI / 2);
          c.beginPath();
          c.moveTo(0, 0);
          c.quadraticCurveTo(llen * .5, -2, llen, 0);
          c.quadraticCurveTo(llen * .5, 2, 0, 0);
          c.closePath();
          c.fillStyle = l % 2 ? '#65c438' : '#86efac';
          c.fill();
          c.strokeStyle = '#1e4d14'; c.lineWidth = .5; c.stroke();
          // 잎맥
          c.beginPath(); c.moveTo(1, 0); c.lineTo(llen - 1, 0);
          c.strokeStyle = 'rgba(255,255,255,.4)'; c.lineWidth = .4; c.stroke();
          c.restore();
        }
        // 위쪽 잎 몇 개 더 (더 풍성)
        for (let l = 0; l < 3; l++) {
          const la2 = -.3 + l * .3;
          const llen = 7;
          c.save(); c.translate(topX, topY - 2); c.rotate(la2 - Math.PI / 2);
          c.beginPath();
          c.moveTo(0, 0);
          c.quadraticCurveTo(llen * .5, -1.5, llen, 0);
          c.quadraticCurveTo(llen * .5, 1.5, 0, 0);
          c.closePath();
          c.fillStyle = '#a8e07a';
          c.fill();
          c.strokeStyle = '#1e4d14'; c.lineWidth = .4; c.stroke();
          c.restore();
        }
        c.restore();
      }
    }
    else if (k === 'willow') {
      // Graceful Weeping Willow: tall twisting warm trunk + cascading curtain of emerald willow fronds
      c.fillStyle = '#5c3a24'; c.beginPath();
      c.moveTo(-6, 0); c.quadraticCurveTo(-3.5, -18, -2.5, -38); c.lineTo(3, -38); c.quadraticCurveTo(4, -18, 6, 0); c.closePath();
      c.fill(); c.strokeStyle = '#382010'; c.lineWidth = 1; c.stroke();
      // Crown dome elevated high
      for (const [px, py, rx, ry, col] of [[-13, -44, 14, 11, '#3d7a36'], [13, -44, 14, 11, '#488c40'], [-7, -54, 15, 12, '#58a34e'], [7, -54, 15, 12, '#68b55c'], [0, -60, 15, 11, '#82cc74']]) {
        ART.ell(c, px + sw * .3, py, rx, ry, col, ART.OUT, .75);
      }
      // Hanging weeping willow curtains swaying in the breeze
      for (let i = -8; i <= 8; i++) {
        const vx = i * 2.6 + sw * .3, topY = -48 - (8 - Math.abs(i)) * 1.3, len = 26 + (i % 3) * 5;
        const tipX = vx + sw * 1.2;
        c.strokeStyle = i % 2 ? '#58a84c' : '#7ad16b'; c.lineWidth = 1.5;
        c.beginPath(); c.moveTo(vx, topY); c.quadraticCurveTo((vx + tipX) * .5, topY + len * .5, tipX, topY + len); c.stroke();
        if (st === 2) {
          for (let d = .3; d <= .95; d += .3) {
            ART.ell(c, vx + (tipX - vx) * d, topY + len * d, 1.8, 3.2, i % 2 ? '#8ce07c' : '#65b858');
          }
        }
      }
    }
    else if (k === 'palm') {
      // Tropical Coconut Palm: tall curved ringed trunk + coconuts + 7 sweeping fan fronds
      c.strokeStyle = '#7c5333'; c.lineWidth = 6; c.lineCap = 'round';
      c.beginPath(); c.moveTo(0, -1); c.quadraticCurveTo(5, -28, 2.5 + sw * .4, -55); c.stroke();
      c.strokeStyle = '#52341d'; c.lineWidth = 1.2;
      for (let h = 6; h < 53; h += 6) {
        const tx = (h / 55) * 2.5;
        c.beginPath(); c.moveTo(tx - 3, -h); c.lineTo(tx + 3, -h - 1); c.stroke();
      }
      const topX = 2.5 + sw * .4, topY = -56;
      if (st === 2) {
        for (const [cx, cy] of [[-3.5, 2.5], [3.5, 2.8], [0, 4.2]]) {
          ART.ell(c, topX + cx, topY + cy, 3.8, 3.4, '#5c3818', ART.OUT, .7);
        }
      }
      const fronds = [[-26, -8], [-22, 9], [-12, -18], [12, -18], [22, 9], [26, -8], [0, -22]];
      for (const [dx, dy] of fronds) {
        const fx = topX + dx + sw * .5, fy = topY + dy;
        c.fillStyle = dy < -8 ? '#65bf47' : '#4a9e33';
        c.beginPath(); c.moveTo(topX, topY);
        c.quadraticCurveTo(topX + dx * .55, topY + dy * .2 - 9, fx, fy);
        c.quadraticCurveTo(topX + dx * .55, topY + dy * .2 - 2, topX, topY);
        c.fill(); c.strokeStyle = '#255918'; c.lineWidth = .8; c.stroke();
      }
    }
    else if (k === 'pine') {
      // Majestic Evergreen Pine: sturdy bark trunk with root flare + 4 tiered cascading pine boughs towering tall
      c.fillStyle = '#442616';
      c.beginPath();
      c.moveTo(-5.5, 0); c.lineTo(-3.2, -18); c.lineTo(3.2, -18); c.lineTo(5.5, 0); c.closePath();
      c.fill();
      c.strokeStyle = '#27140a'; c.lineWidth = 1; c.stroke();
      // Bark grain lines
      c.strokeStyle = '#5a3720'; c.lineWidth = .9; c.beginPath();
      c.moveTo(-1.4, 0); c.lineTo(-1, -17); c.moveTo(1.4, 0); c.lineTo(1, -17); c.stroke();

      // 4 tiered cascading pine foliage boughs elevated high
      const tiers = [
        { y: -16, w: 22, h: 18, dark: '#1b3f27', mid: '#285836', hi: '#3c754d' },
        { y: -29, w: 18.5, h: 17, dark: '#1e472c', mid: '#2e663f', hi: '#468658' },
        { y: -42, w: 14.5, h: 16, dark: '#245233', mid: '#357548', hi: '#509664' },
        { y: -55, w: 9.5, h: 18, dark: '#2b5f3b', mid: '#3d8653', hi: '#5eb076' }
      ];
      for (const t of tiers) {
        const w = t.w, y = t.y, h = t.h, topY = y - h, wsw = sw * .4 * (1 - y / -55);
        // Tier shadow underneath
        c.fillStyle = t.dark; c.beginPath();
        c.moveTo(-w, y);
        c.quadraticCurveTo(-w * .5, y + 2.5, 0, y + 3);
        c.quadraticCurveTo(w * .5, y + 2.5, w, y);
        c.lineTo(wsw, topY); c.closePath();
        c.fill();
        // Top vibrant foliage face
        c.fillStyle = t.mid; c.beginPath();
        c.moveTo(-w, y);
        // Sawtooth pine needle fronds
        for (let i = -5; i <= 5; i++) {
          const fx = (i / 5) * w, fy = y - (i % 2 === 0 ? 0 : 2.5);
          c.lineTo(fx, fy);
        }
        c.lineTo(w, y); c.lineTo(wsw, topY); c.closePath();
        c.fill();
        c.strokeStyle = ART.OUT; c.lineWidth = .9; c.stroke();
        // Sunlit edge highlights on top needles
        c.strokeStyle = t.hi; c.lineWidth = 1.3; c.beginPath();
        c.moveTo(-w * .75, y - 2); c.lineTo(wsw, topY + 1); c.lineTo(w * .75, y - 2); c.stroke();
      }
      // Woodland pinecones on tier 1 & 2
      if (st === 2) {
        for (const [px, py] of [[-11, -15], [10, -15.5], [-9, -28], [8, -28.5]]) {
          ART.ell(c, px, py, 2.5, 3.6, '#5e381c', '#381f0d', .6);
          c.fillStyle = '#875630'; c.fillRect(px - 1, py - 1, 2, 1.2);
        }
      }
    }
    else if (k === 'oaktree' || k === 'sakuratree') {
      // v1.100.59: "오크 나무와 사쿠라 나무" - 원화가 그린 투명 배경 PNG 그림을 그대로 그림
      const img = getTownTreeImg(k === 'oaktree' ? 'tree_oak' : 'tree_sakura');
      if (img.complete && img.naturalWidth) {
        // 각 그림의 실제 내용 영역(투명 여백 제외)을 512 캔버스 기준으로 정렬
        // 키를 크게 하여 캐릭터보다 웅장하게 서 있도록 크기 조정
        const TG = k === 'oaktree'
          ? { w: 86, h: 86, bottomFrac: 467 / 512 }
          : { w: 85, h: 85, bottomFrac: 476 / 512 };
        const swx = sw * 0.3; // 미풍에 살짝 흔들리는 느낌
        c.drawImage(img, -TG.w / 2 + swx, -TG.bottomFrac * TG.h, TG.w, TG.h);
      } else {
        // 로딩 중일 때 임시 캐노피
        ART.ell(c, 0, -36, 16, 16, k === 'oaktree' ? '#4a8f3b' : '#f89ab4');
      }
    }
    else if (k === 'evergreen') {
      const img = getTownTreeImg('tree_evergreen');
      if (img.complete && img.naturalWidth) {
        const TG = { w: 90, h: 90, bottomFrac: 480 / 512 };
        const swx = sw * 0.3;
        c.drawImage(img, -TG.w / 2 + swx, -TG.bottomFrac * TG.h, TG.w, TG.h);
      } else {
        // Majestic Grand Conical Evergreen Fir Tree (풍성한 상록수 / 전나무)
        // Matching the user's illustration: thick textured bark trunk + 5 lush layered frilly pine tiers
        // 1. Root flare and sturdy textured trunk
        c.fillStyle = '#4a2c17';
        c.beginPath();
        c.moveTo(-8, 0);
        c.quadraticCurveTo(-4.5, -10, -4, -20);
        c.lineTo(4, -20);
        c.quadraticCurveTo(4.5, -10, 8, 0);
        c.closePath();
        c.fill();
        c.strokeStyle = '#29160a'; c.lineWidth = 1.1; c.stroke();

      // Bark vertical ridges and warm highlights
      c.strokeStyle = '#6d4224'; c.lineWidth = 1; c.beginPath();
      c.moveTo(-4.5, -1); c.lineTo(-2.2, -19);
      c.moveTo(0, -2); c.lineTo(0, -19);
      c.moveTo(4.5, -1); c.lineTo(2.2, -19);
      c.stroke();
      c.strokeStyle = '#8d5730'; c.lineWidth = .7; c.beginPath();
      c.moveTo(-2.2, -2); c.lineTo(-1.2, -18);
      c.moveTo(2.2, -2); c.lineTo(1.2, -18);
      c.stroke();

      // 5 Cascading lush tiers of tiered pine/fir foliage (from bottom to top, elevated tall)
      const egTiers = [
        { y: -17, w: 26, h: 20, dark: '#0e2b17', mid: '#1b542c', hi: '#42a353', rim: '#7ed460' },
        { y: -30, w: 22.5, h: 19, dark: '#12351d', mid: '#226335', hi: '#4cae5d', rim: '#8de26e' },
        { y: -43, w: 18.5, h: 18, dark: '#163f22', mid: '#29733d', hi: '#55b966', rim: '#9beb7c' },
        { y: -55, w: 14, h: 17, dark: '#1b4a28', mid: '#318245', hi: '#60c471', rim: '#a8f289' },
        { y: -66, w: 8.5, h: 17, dark: '#225730', mid: '#3a9350', hi: '#6dd27d', rim: '#b5f996' }
      ];

      for (let idx = 0; idx < egTiers.length; idx++) {
        const t = egTiers[idx];
        const w = t.w, y = t.y, h = t.h, topY = y - h;
        const sway = sw * (.3 + idx * .18); // top tiers sway more

        // Under-tier rich shadow
        c.fillStyle = t.dark;
        c.beginPath();
        c.moveTo(-w, y);
        c.quadraticCurveTo(-w * .5, y + 2.5, 0, y + 3);
        c.quadraticCurveTo(w * .5, y + 2.5, w, y);
        c.lineTo(sway, topY);
        c.closePath();
        c.fill();

        // Dense frilly bough face with needle scallops
        c.fillStyle = t.mid;
        c.beginPath();
        c.moveTo(-w, y);
        const steps = 7;
        for (let i = -steps; i <= steps; i++) {
          const u = i / steps;
          const nx = u * w;
          const dips = (Math.abs(i) % 2 === 1) ? 2.8 : 0;
          c.lineTo(nx, y - dips);
        }
        c.lineTo(w, y);
        c.lineTo(sway, topY);
        c.closePath();
        c.fill();
        c.strokeStyle = ART.OUT; c.lineWidth = .9; c.stroke();

        // Vibrant needle layer highlights & frill curves
        c.fillStyle = t.hi;
        for (let i = -steps + 1; i < steps; i++) {
          const u = i / steps;
          const nx = u * (w * .85);
          const ny = y - 4 - Math.abs(u) * 2;
          ART.ell(c, nx + sway * .4, ny, 2.5, 2.0, t.hi);
        }

        // Sunlit golden-lime needle frill tips on top edges
        c.strokeStyle = t.rim; c.lineWidth = 1.3; c.lineCap = 'round';
        c.beginPath();
        c.moveTo(-w * .8, y - 2);
        c.quadraticCurveTo(-w * .3 + sway * .3, y - 5, sway, topY + 2);
        c.quadraticCurveTo(w * .3 + sway * .3, y - 5, w * .8, y - 2);
        c.stroke();
      }

      // Tapering top spire / crown with bright golden-green needle cap
      const topSway = sw * 1.3;
      c.fillStyle = '#65cf46';
      c.beginPath();
      c.moveTo(-4, -80);
      c.lineTo(topSway, -89);
      c.lineTo(4, -80);
      c.closePath();
      c.fill();
      c.strokeStyle = '#296b1f'; c.lineWidth = .9; c.stroke();
      ART.ell(c, topSway, -88.5, 1.6, 2.4, '#c4ff80');
    }
  }
  else if (k === 'cherry' || k === 'maple' || k === 'ginkgo' || k === 'peach' || k === 'orange' || k === 'apple') {
      // v1.109: 캐시 스프라이트로 교체 (makeTreeSprite 수준 디테일 + 잎 130장)
      const spr = getDeciduousSprite(k);
      const swx = sw * 0.3;
      c.drawImage(spr, -spr.width / 2 + swx, -spr.height + 6);
    }
    c.restore();
  }
  // ---------------- v1.24: more decorations ----------------
  const _statues = new Map();
  function statueImg(sp, tint) { // a pet drawn once on its own little canvas, then tinted bronze / gold (source-atop only touches the pet)
    const key = sp + tint; let cv = _statues.get(key); if (cv) return cv;
    cv = document.createElement('canvas'); cv.width = cv.height = 120; const g = cv.getContext('2d');
    g.translate(60, 100); g.scale(1, 1); ART.pet(g, sp, { t: 0, seed: 777, age: 1, mood: 'happy' });
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-atop'; g.fillStyle = tint; g.fillRect(0, 0, 120, 120);
    g.globalCompositeOperation = 'source-over'; _statues.set(key, cv); return cv;
  }
  function drawDeco2(c, o, T, f, cx, cy, q, lit) {
    const k = o.k, sh2 = (x0, y0, x1, y1, col) => poly(c, [Q(x0, y0), Q(x1, y0), Q(x1, y1), Q(x0, y1)], col);
    const pole = (x, y, z0, z1, col, lw) => { const a = Q(x, y, z0), b = Q(x, y, z1); c.strokeStyle = col; c.lineWidth = lw || 2; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); };
    const shadow = (rx, ry) => ART.ell(c, q[0], q[1], rx, ry, 'rgba(0,0,0,.13)');
    const emo = (e, z, px) => { const p = Q(cx, cy, z); c.font = (px || 14) + 'px sans-serif'; c.textAlign = 'center'; c.fillStyle = '#000'; c.fillText(e, p[0], p[1]); c.textAlign = 'start'; };
    switch (k) {
      case 'fence': { const [a, b] = [[o.x + .05, cy], [o.x + .95, cy]];
        for (const z of [5, 10]) { const p = Q(a[0], a[1], z), r2 = Q(b[0], b[1], z); c.strokeStyle = '#b07a44'; c.lineWidth = 2.2; c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(r2[0], r2[1]); c.stroke(); }
        for (let i = 0; i <= 2; i++) { const u = i / 2, x = a[0] + (b[0] - a[0]) * u, y = a[1] + (b[1] - a[1]) * u; pole(x, y, 0, 13, '#8a5a33', 2.4); } return true; }
      case 'hedge': blk(c, o.x + .08, o.y + .08, .84, .84, 0, 10, '#5fa24e'); for (let i = 0; i < 4; i++) { const p = Q(o.x + .25 + (i % 2) * .5, o.y + .25 + (i >> 1) * .5, 10); ART.ell(c, p[0], p[1], 5, 3, '#6fb85c'); } return true;
      case 'flowerbed': { const w = 1.8, d = .8; blk(c, o.x + .1, o.y + .1, w, d, 0, 5, '#a8703a'); sh2(o.x + .18, o.y + .18, o.x + .1 + w - .08, o.y + .1 + d - .08, '#6b4a2e');
        const cols = ['#ff6b8a', '#ffd23a', '#b58aff', '#ff9e4a', '#fff'];
        for (let i = 0; i < 8; i++) { const u = (i % 4 + .5) / 4, v = ((i >> 2) + .5) / 2, p = Q(o.x + .1 + w * u, o.y + .1 + d * v, 7); ART.ell(c, p[0], p[1] + 2, 1, 3, '#4f9a44'); ART.ell(c, p[0], p[1] - 1, 2.6, 2.2, cols[i % 5], 'rgba(60,38,25,.5)', .5); } return true; }
      case 'signpost': shadow(6, 3); pole(cx, cy, 0, 26, '#8a5a33', 3);
        for (const [z, dir, col] of [[22, (o.r % 2 ? -1 : 1), '#f2d9a8'], [15, (o.r % 2 ? 1 : -1), '#e8c38a']]) { const p = Q(cx, cy, z); c.save(); c.translate(p[0], p[1]); c.beginPath(); c.moveTo(-8 * dir, -3); c.lineTo(8 * dir, -3); c.lineTo(11 * dir, 0); c.lineTo(8 * dir, 3); c.lineTo(-8 * dir, 3); c.closePath(); c.fillStyle = col; c.fill(); c.strokeStyle = ART.OUT; c.lineWidth = .8; c.stroke(); c.restore(); } return true;
      case 'mailbox': shadow(7, 3); pole(cx, cy, 0, 12, '#555', 3); blk(c, cx - .22, cy - .15, .44, .3, 12, 11, '#e0443a'); { const p = Q(cx + .22, cy, 18); c.fillStyle = '#fff'; c.fillRect(p[0] - 2, p[1] - 1, 4, 2); } return true;
      case 'topiary': shadow(8, 4); blk(c, cx - .2, cy - .2, .4, .4, 0, 6, '#c98a55'); { const p = Q(cx, cy, 14), dir = (o.r % 2) ? -1 : 1; ART.ell(c, p[0], p[1], 8, 7, '#5fa24e', ART.OUT, .8); ART.ell(c, p[0] - 3, p[1] - 10, 2.4, 6, '#5fa24e', ART.OUT, .8); ART.ell(c, p[0] + 3, p[1] - 10, 2.4, 6, '#5fa24e', ART.OUT, .8); ART.ell(c, p[0] + 7 * dir, p[1] + 3, 3, 3, '#6fb85c', ART.OUT, .6); } return true; // a bunny-shaped hedge
      case 'stonelamp': shadow(8, 4); blk(c, cx - .25, cy - .25, .5, .5, 0, 3, '#b8b2a6'); blk(c, cx - .08, cy - .08, .16, .16, 3, 10, '#c9c4b8'); blk(c, cx - .2, cy - .2, .4, .4, 13, 7, '#d8d2c4');
        { const p = Q(cx, cy, 16); if (lit) { c.globalAlpha = .45; ART.ell(c, p[0], p[1], 8, 6, '#ffe68a'); c.globalAlpha = 1; } } blk(c, cx - .28, cy - .28, .56, .56, 20, 3, '#a8a296'); return true;
      case 'flagpole': { shadow(6, 3); pole(cx, cy, 0, 44, '#c9ccd1', 2); const p = Q(cx, cy, 44), w = Math.sin(T * 4 + o.x) * 2, dir = (o.r % 2) ? -1 : 1;
        c.beginPath(); c.moveTo(p[0], p[1]); c.quadraticCurveTo(p[0] + 9 * dir, p[1] + 2 + w, p[0] + 18 * dir, p[1] + w); c.lineTo(p[0] + 18 * dir, p[1] + 11 + w); c.quadraticCurveTo(p[0] + 9 * dir, p[1] + 13 + w, p[0], p[1] + 11); c.closePath(); c.fillStyle = '#ff7aa8'; c.fill(); c.strokeStyle = ART.OUT; c.lineWidth = .8; c.stroke();
        c.font = '7px sans-serif'; c.textAlign = 'center'; c.fillStyle = '#000'; c.fillText('🐾', p[0] + 9 * dir, p[1] + 8 + w * .5); c.textAlign = 'start'; ART.ell(c, p[0], p[1] - 1, 2, 2, '#ffd23a'); return true; }
      case 'picnic': { const w = 1.8, d = .8; shadow(16, 7);
        blk(c, o.x + .2, o.y + .35, w - .2, .3, 6, 2, '#b07a44'); // table top below cloth
        blk(c, o.x + .1, o.y + .1, w, d, 0, 3, '#a8703a');
        sh2(o.x + .25, o.y + .25, o.x + w - .05, o.y + d - .05, '#e8534f'); for (let i = 0; i < 4; i++) { const p = Q(o.x + .3 + i * (w - .4) / 3.5, o.y + .3 + i * (d - .4) / 3.5, 1); ART.ell(c, p[0], p[1], 2.5, 1.3, '#fff'); }
        emo('🧺', 10, 13); return true; }
      case 'phonebooth': shadow(8, 4); blk(c, cx - .3, cy - .3, .6, .6, 0, 30, '#d8343a'); { const p0 = Q(cx - .2, cy + .3, 8), p1 = Q(cx + .2, cy + .3, 26); c.fillStyle = 'rgba(190,230,250,.8)'; c.fillRect(Math.min(p0[0], p1[0]), p1[1], Math.abs(p1[0] - p0[0]), Math.abs(p0[1] - p1[1])); } blk(c, cx - .33, cy - .33, .66, .66, 30, 3, '#b82a30'); emo('☎️', 36, 9); return true;
      case 'well': shadow(10, 5); { const p = Q(cx, cy, 0); ART.ell(c, p[0], p[1] - 4, 11, 6, '#9a948a', ART.OUT, 1); ART.ell(c, p[0], p[1] - 9, 11, 6, '#b8b2a6', ART.OUT, 1); ART.ell(c, p[0], p[1] - 9, 8, 4, '#3a5a7a'); }
        pole(cx - .3, cy, 4, 26, '#8a5a33', 2); pole(cx + .3, cy, 4, 26, '#8a5a33', 2); { const a = Q(cx - .38, cy, 24), b = Q(cx + .38, cy, 24), top = Q(cx, cy, 33); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(top[0], top[1]); c.lineTo(b[0], b[1]); c.closePath(); c.fillStyle = '#c0533f'; c.fill(); c.strokeStyle = ART.OUT; c.lineWidth = .8; c.stroke(); } emo('🪣', 16, 8); return true;
      case 'dogstatue': case 'catstatue': shadow(9, 4); blk(c, cx - .3, cy - .3, .6, .6, 0, 9, '#d8d2c4'); blk(c, cx - .35, cy - .35, .7, .7, 9, 2, '#c9c4b8');
        { const p = Q(cx, cy, 11), im = statueImg(k === 'dogstatue' ? 'shiba' : 'kitten', 'rgba(196,150,80,.8)'), flip = (o.r % 2) ? -1 : 1; c.save(); c.translate(p[0], p[1]); c.scale(flip, 1); c.drawImage(im, -30, -50, 60, 60); c.restore(); } return true; // bronze-tinted pet on a plinth
      case 'sandbox': blk(c, o.x + .1, o.y + .1, 1.8, 1.8, 0, 3, '#c98a55'); sh2(o.x + .2, o.y + .2, o.x + 1.8, o.y + 1.8, '#f2d9a0'); { const p = Q(o.x + 1.3, o.y + 1.2, 3); ART.ell(c, p[0], p[1], 9, 5, '#e8c890', 'rgba(150,110,60,.5)', .6); } emo('🪣', 5, 11); { const p = Q(o.x + .6, o.y + 1.4, 3); c.font = '10px sans-serif'; c.fillStyle = '#000'; c.fillText('🏰', p[0] - 5, p[1]); } return true;
      case 'heartarch': { const [a, b] = [[o.x + .2, cy], [o.x + 1.8, cy]]; pole(a[0], a[1], 0, 26, '#fff', 3); pole(b[0], b[1], 0, 26, '#fff', 3);
        const p = Q(a[0], a[1], 26), r2 = Q(b[0], b[1], 26), m = [(p[0] + r2[0]) / 2, (p[1] + r2[1]) / 2 - 14]; c.beginPath(); c.moveTo(p[0], p[1]); c.quadraticCurveTo(m[0], m[1] - 10, r2[0], r2[1]); c.lineWidth = 4; c.strokeStyle = '#ff9ab8'; c.stroke();
        for (let i = 0; i <= 8; i++) { const u = i / 8, x = (1 - u) * (1 - u) * p[0] + 2 * u * (1 - u) * m[0] + u * u * r2[0], y = (1 - u) * (1 - u) * p[1] + 2 * u * (1 - u) * (m[1] - 10) + u * u * r2[1]; ART.ell(c, x, y, 2.6, 2.3, i % 2 ? '#ff6b9a' : '#fff'); }
        c.font = '14px sans-serif'; c.textAlign = 'center'; c.fillStyle = '#000'; c.fillText('💗', m[0], m[1] + 2); c.textAlign = 'start'; return true; }
      case 'pond': poly(c, [Q(o.x + .15, o.y + .5), Q(o.x + .6, o.y + .12), Q(o.x + 1.5, o.y + .15), Q(o.x + 1.88, o.y + .7), Q(o.x + 1.7, o.y + 1.7), Q(o.x + .9, o.y + 1.9), Q(o.x + .2, o.y + 1.5)], '#8fcbe8', '#b8b2a6', 2.5);
        for (const [u, v] of [[.6, .7], [1.3, 1.2], [1.1, .5]]) { const p = Q(o.x + u, o.y + v); ART.ell(c, p[0], p[1], 4, 2, '#5fa24e'); }
        { const p = Q(o.x + 1 + Math.sin(T * .4) * .35, o.y + 1 + Math.cos(T * .4) * .3); c.font = '12px sans-serif'; c.textAlign = 'center'; c.fillStyle = '#000'; c.fillText('🦆', p[0], p[1]); c.textAlign = 'start'; } return true;
      case 'monument': shadow(9, 4); blk(c, cx - .35, cy - .35, .7, .7, 0, 4, '#b8b2a6'); { const b0 = Q(cx - .18, cy + .18, 4), b1 = Q(cx + .18, cy + .18, 4), t0 = Q(cx - .12, cy + .12, 40), t1 = Q(cx + .12, cy + .12, 40), tp = Q(cx, cy, 46), e0 = Q(cx + .18, cy - .18, 4), e1 = Q(cx + .12, cy - .12, 40);
        poly(c, [b0, b1, t1, t0], '#d8d2c4', ART.OUT, 1); poly(c, [b1, e0, e1, t1], '#c2bcb0', ART.OUT, 1); poly(c, [t0, t1, tp], '#e8e4dc', ART.OUT, 1); poly(c, [t1, e1, tp], '#d0cabe', ART.OUT, 1);
        const m = Q(cx, cy + .18, 16); c.fillStyle = '#c9a227'; c.fillRect(m[0] - 4, m[1] - 5, 8, 6); } return true;
      case 'gazebo': { sh2(o.x + .1, o.y + .1, o.x + 1.9, o.y + 1.9, '#e8dcc4'); blk(c, o.x + .2, o.y + .2, 1.6, 1.6, 0, 2, '#d8c8a8');
        for (const [u, v] of [[.35, .35], [1.65, .35], [1.65, 1.65], [.35, 1.65]]) pole(o.x + u, o.y + v, 2, 26, '#fff', 3);
        const pk = Q(o.x + 1, o.y + 1, 42), cs = [[.1, .1], [1.9, .1], [1.9, 1.9], [.1, 1.9]].map(([u, v]) => Q(o.x + u, o.y + v, 26));
        const faces = [[0, 1, '#e98aa8'], [1, 2, '#d5708f'], [2, 3, '#f0a0ba'], [3, 0, '#df7d9c']];
        faces.sort((a, b) => (cs[a[0]][1] + cs[a[1]][1]) - (cs[b[0]][1] + cs[b[1]][1]));
        for (const [i0, i1, col] of faces) poly(c, [cs[i0], cs[i1], pk], col, ART.OUT, 1);
        ART.ell(c, pk[0], pk[1] - 2, 2.5, 2.5, '#ffd23a'); return true; }
      case 'windmill': {
        blk(c, o.x + .45, o.y + .45, 1.1, 1.1, 0, 12, '#b8afa2');
        blk(c, o.x + .5, o.y + .5, 1, 1, 12, 28, '#f4efe4');
        const tp = Q(o.x + 1, o.y + 1, 52), cs = [[.42, .42], [1.58, .42], [1.58, 1.58], [.42, 1.58]].map(([u, v]) => Q(o.x + u, o.y + v, 40));
        const faces = [[0, 1, '#8c3f2b'], [3, 0, '#9e4832'], [1, 2, '#a8503a'], [2, 3, '#c0633f']];
        faces.sort((a, b) => (cs[a[0]][1] + cs[a[1]][1]) - (cs[b[0]][1] + cs[b[1]][1]));
        for (const [i0, i1, col] of faces) poly(c, [cs[i0], cs[i1], tp], col, ART.OUT, 1);
        const hub = Q(o.x + 1.15, o.y + 1.56, 38), dir = (o.r === 1 || o.r === 2) ? -1 : 1;
        for (let i = 0; i < 4; i++) {
          const a = T * 1.35 * dir + i * Math.PI / 2;
          c.save(); c.translate(hub[0], hub[1]); c.rotate(a);
          c.fillStyle = '#fff8eb'; c.fillRect(-2, -27, 7.5, 23);
          c.strokeStyle = '#7a4b28'; c.lineWidth = 1; c.strokeRect(-2, -27, 7.5, 23);
          c.beginPath(); c.moveTo(-2, -19); c.lineTo(5.5, -19); c.moveTo(-2, -11); c.lineTo(5.5, -11); c.moveTo(0, 0); c.lineTo(0, -27); c.stroke();
          c.restore();
        }
        ART.ell(c, hub[0], hub[1], 3.5, 3.5, '#7a4b28', '#fff', .8);
        const dr = Q(o.x + 1, o.y + 1.52, 0); c.fillStyle = '#7a4b28'; c.fillRect(dr[0] - 3, dr[1] - 10, 6, 10);
        return true;
      }
      case 'goldstatue': { sh2(o.x + .1, o.y + .1, o.x + 1.9, o.y + 1.9, '#e8dcc4'); blk(c, o.x + .45, o.y + .45, 1.1, 1.1, 0, 14, '#d8d2c4'); blk(c, o.x + .4, o.y + .4, 1.2, 1.2, 14, 3, '#c9c4b8');
        const p = Q(o.x + 1, o.y + 1, 17), im = statueImg('shiba', 'rgba(245,197,66,.85)'), flip = (o.r % 2) ? -1 : 1; c.save(); c.translate(p[0], p[1]); c.scale(flip, 1); c.drawImage(im, -54, -90, 108, 108); c.restore();
        for (let i = 0; i < 3; i++) { const t2 = (T * .7 + i / 3) % 1, s2 = Q(o.x + .6 + i * .4, o.y + .6, 20 + t2 * 30); c.globalAlpha = 1 - t2; c.font = '8px sans-serif'; c.fillStyle = '#000'; c.fillText('✨', s2[0], s2[1]); c.globalAlpha = 1; } return true; }
      case 'pet_fountain': {
        // 2x2 Crystal Pet Drinking Fountain
        sh2(o.x + .1, o.y + .1, o.x + 1.9, o.y + 1.9, '#e8f0fe');
        poly(c, [Q(o.x + .1, o.y + .1), Q(o.x + 1.9, o.y + .1), Q(o.x + 1.9, o.y + 1.9), Q(o.x + .1, o.y + 1.9)], '#93c5fd', '#1d4ed8', 1.2);
        ART.ell(c, q[0], q[1], 28, 14, '#dbeafe', '#3b82f6', 1.2);
        ART.ell(c, q[0], q[1] - 3, 24, 11, '#60a5fa');
        // Central marble fountain column
        blk(c, o.x + .8, o.y + .8, .4, .4, 0, 20, '#ffffff');
        ART.ell(c, q[0], q[1] - 22, 12, 6, '#bfdbfe', '#2563eb', 1);
        ART.ell(c, q[0], q[1] - 24, 9, 4.5, '#60a5fa');
        // Water jet splashes
        for (let i = 0; i < 4; i++) {
          const t2 = (T * 1.5 + i * .25) % 1;
          const a = i * Math.PI / 2 + T * .8;
          ART.ell(c, q[0] + Math.cos(a) * t2 * 14, q[1] - 25 - Math.sin(t2 * Math.PI) * 8 + t2 * 18, 2, 2, '#93c5fd');
        }
        // Cute pet drinking bowl at base
        const bq = Q(o.x + 1.45, o.y + 1.45, 1);
        ART.ell(c, bq[0], bq[1], 6, 3.5, '#f59e0b', '#b45309', 1);
        ART.ell(c, bq[0], bq[1] - 1, 4.5, 2.2, '#38bdf8');
        return true;
      }
      case 'pet_statue_hero': {
        // 1x1 Hero Dog Monument
        sh2(o.x + .05, o.y + .05, o.x + .95, o.y + .95, '#d6d3d1');
        blk(c, o.x + .15, o.y + .15, .7, .7, 0, 10, '#78716c');
        blk(c, o.x + .2, o.y + .2, .6, .6, 10, 3, '#a8a29e');
        const p = Q(o.x + .5, o.y + .5, 13), im = statueImg('jindo', 'rgba(217,119,6,.9)');
        c.save(); c.translate(p[0], p[1]); c.scale(1, 1); c.drawImage(im, -44, -75, 88, 88); c.restore();
        // Plaque at base
        const plq = Q(o.x + .5, o.y + .82, 5);
        c.fillStyle = '#fde047'; c.fillRect(plq[0] - 6, plq[1] - 3, 12, 5);
        c.strokeStyle = '#b45309'; c.lineWidth = .8; c.strokeRect(plq[0] - 6, plq[1] - 3, 12, 5);
        return true;
      }
      case 'flower_tunnel': {
        // 3x2 Romantic Rose Flower Tunnel
        sh2(o.x + .1, o.y + .1, o.x + 2.9, o.y + 1.9, '#fce7f3');
        // Trellis arches with creeping climbing roses
        for (let i = 0; i < 3; i++) {
          const ax = o.x + .45 + i * 1.05;
          const a0 = Q(ax, o.y + .2), a1 = Q(ax, o.y + 1.8);
          c.strokeStyle = '#15803d'; c.lineWidth = 3.5;
          c.beginPath(); c.moveTo(a0[0], a0[1]); c.quadraticCurveTo((a0[0] + a1[0]) / 2, (a0[1] + a1[1]) / 2 - 38, a1[0], a1[1]); c.stroke();
          // Roses along arch
          for (let j = 0; j <= 6; j++) {
            const u = j / 6;
            const rx = (1 - u) * a0[0] + u * a1[0], ry = (1 - u) * a0[1] + u * a1[1] - Math.sin(u * Math.PI) * 38;
            ART.ell(c, rx, ry, 3.2, 3.2, j % 2 ? '#ec4899' : '#f43f5e', '#be185d', .8);
            ART.ell(c, rx + .8, ry - .8, 1.2, 1.2, '#fbcfe8');
          }
        }
        // Cobblestone walkway inside tunnel
        poly(c, [Q(o.x + .2, o.y + .8), Q(o.x + 2.8, o.y + .8), Q(o.x + 2.8, o.y + 1.2), Q(o.x + .2, o.y + 1.2)], '#f5ecd8');
        return true;
      }
      case 'camping_zone': {
        // 3x3 Cozy Outdoor Camping Zone with tent, campfire & log seats
        sh2(o.x + .1, o.y + .1, o.x + 2.9, o.y + 2.9, '#fef3c7');
        // Canvas Tent (North side)
        const tx0 = o.x + .4, ty0 = o.y + .4, tw0 = 1.4, td0 = 1.2;
        blk(c, tx0, ty0, tw0, td0, 0, 4, '#ca8a04');
        gable(c, tx0, ty0, tw0, td0, 4, 18, '#0284c7', '#38bdf8');
        // Campfire pit (Center)
        const cfq = Q(o.x + 1.6, o.y + 1.6, 0);
        ART.ell(c, cfq[0], cfq[1], 14, 7, '#44403c', '#1c1917', 1.5);
        // Flickering fire flames
        const flm = Math.sin(T * 8) * 3;
        ART.ell(c, cfq[0], cfq[1] - 8 + flm, 6, 9, '#f97316');
        ART.ell(c, cfq[0], cfq[1] - 6 + flm, 4, 6, '#fde047');
        // Log benches around campfire
        for (const [lx, ly, lw, ld] of [[o.x + .6, o.y + 1.7, .4, .8], [o.x + 2.2, o.y + 1.5, .8, .4]]) {
          blk(c, lx, ly, lw, ld, 0, 6, '#78350f');
        }
        return true;
      }
    }
    return false;
  }
  // ---------------- small facilities ----------------
  function drawDeco(c, o, T) { frameOn(o, D[o.k].w, D[o.k].d); try { drawDeco_(c, o, T); } finally { frameOff(); } }
  function drawDeco_(c, o, T) {
    const f = { w: D[o.k].w, d: D[o.k].d }, cx = o.x + f.w / 2, cy = o.y + f.d / 2, q = Q(cx, cy), lit = S.clock && (S.clock.m >= 1080 || S.clock.m < 360);
    // v2026-10-10: 정자/풍차도 새로 그린 상점 PNG로 교체
    if ((o.k === 'gazebo' || o.k === 'windmill') && STORE_IMG[o.k] && STORE_IMG[o.k].complete && STORE_IMG[o.k].naturalWidth > 0) { drawStoreSprite(c, o.x, o.y, f.w, f.d, o.k, o.r || 0); return; }
    if (o.k === 'bench') {
      ART.ell(c, q[0], q[1], 10, 4, 'rgba(0,0,0,.12)');
      const [a, b] = [[cx - .4, cy], [cx + .4, cy]];
      for (const z of [7, 13]) { const p = Q(a[0], a[1], z), r2 = Q(b[0], b[1], z); c.strokeStyle = '#a8703a'; c.lineWidth = z === 7 ? 4 : 3; c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(r2[0], r2[1]); c.stroke(); }
      for (const p of [a, b]) { const u = Q(p[0], p[1]), v = Q(p[0], p[1], 7); c.strokeStyle = '#5a3a22'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(u[0], u[1]); c.lineTo(v[0], v[1]); c.stroke(); }
    } else if (o.k === 'lamp') {
      const top = Q(cx, cy, 30); c.strokeStyle = '#3a3a44'; c.lineWidth = 2.4; c.beginPath(); c.moveTo(q[0], q[1]); c.lineTo(top[0], top[1]); c.stroke();
      if (lit) { c.globalAlpha = .35; ART.ell(c, q[0], q[1], 16, 7, '#ffe68a'); ART.ell(c, top[0], top[1], 11, 11, '#fff3b0'); c.globalAlpha = 1; }
      ART.ell(c, top[0], top[1], 4.5, 5, lit ? '#ffe68a' : '#f4f1e8', ART.OUT, 1);
    } else if (o.k === 'fountain') {
      poly(c, [Q(o.x + .1, o.y + .1), Q(o.x + 1.9, o.y + .1), Q(o.x + 1.9, o.y + 1.9), Q(o.x + .1, o.y + 1.9)], '#dcc79a');
      ART.ell(c, q[0], q[1], 30, 15, '#c9c4bc', ART.OUT, 1); ART.ell(c, q[0], q[1] - 4, 30, 15, '#e8e4dc', ART.OUT, 1); ART.ell(c, q[0], q[1] - 4, 25, 12, '#6ab8e0');
      c.fillStyle = '#e8e4dc'; c.fillRect(q[0] - 3, q[1] - 22, 6, 18); c.strokeStyle = ART.OUT; c.lineWidth = .8; c.strokeRect(q[0] - 3, q[1] - 22, 6, 18); ART.ell(c, q[0], q[1] - 22, 9, 4, '#e8e4dc', ART.OUT, .8);
      for (let i = 0; i < 6; i++) { const t = (T * .9 + i / 6) % 1, a = i / 6 * 6.28; ART.ell(c, q[0] + Math.cos(a) * t * 18, q[1] - 26 - Math.sin(t * 3.14) * 10 + t * 18 + Math.sin(a) * t * 7, 1.6, 1.6, 'rgba(160,220,255,.9)'); }
    } else if (o.k === 'playground') {
      poly(c, [Q(o.x + .2, o.y + .2), Q(o.x + 2.8, o.y + .2), Q(o.x + 2.8, o.y + 2.8), Q(o.x + .2, o.y + 2.8)], '#f2dfa8', 'rgba(150,120,60,.5)');
      // slide
      const s0 = Q(o.x + .8, o.y + .8, 26), s1 = Q(o.x + .8, o.y + 2.3, 2); c.strokeStyle = '#e8534f'; c.lineWidth = 5; c.beginPath(); c.moveTo(s0[0], s0[1]); c.lineTo(s1[0], s1[1]); c.stroke();
      const l0 = Q(o.x + .8, o.y + .5), l1 = Q(o.x + .8, o.y + .5, 26); c.strokeStyle = '#4a7fb5'; c.lineWidth = 2; c.beginPath(); c.moveTo(l0[0] - 3, l0[1]); c.lineTo(l1[0] - 3, l1[1]); c.moveTo(l0[0] + 3, l0[1]); c.lineTo(l1[0] + 3, l1[1]); c.stroke();
      // swing frame
      const a0 = Q(o.x + 2.2, o.y + .6), a1 = Q(o.x + 2.2, o.y + 2.4), b0 = Q(o.x + 2.2, o.y + .6, 30), b1 = Q(o.x + 2.2, o.y + 2.4, 30); c.strokeStyle = '#6a9a4a'; c.lineWidth = 2.4; c.beginPath(); c.moveTo(a0[0], a0[1]); c.lineTo(b0[0], b0[1]); c.lineTo(b1[0], b1[1]); c.lineTo(a1[0], a1[1]); c.stroke();
      const sw = Math.sin(T * 2.2) * 5, m = Q(o.x + 2.2, o.y + 1.5, 30); c.strokeStyle = '#555'; c.lineWidth = 1; c.beginPath(); c.moveTo(m[0], m[1]); c.lineTo(m[0] + sw, m[1] + 22); c.stroke(); c.fillStyle = '#ffcf3a'; c.fillRect(m[0] + sw - 4, m[1] + 22, 8, 3);
    } else if (drawDeco2(c, o, T, f, cx, cy, q, lit)) { // v1.24 decorations
    } else if (o.k === 'busstop') {
      const x0 = o.x + .25, y0 = o.y + .3, x1 = o.x + f.w - .25, y1 = o.y + f.d - .25;
      poly(c, [Q(x0, y0 - .05), Q(x1 + .1, y0 - .05), Q(x1 + .1, y1 + .1), Q(x0, y1 + .1)], '#d8d2c4'); // paving
      // glass back wall
      poly(c, [Q(x0, y0, 2), Q(x1, y0, 2), Q(x1, y0, 22), Q(x0, y0, 22)], 'rgba(170,215,240,.55)', '#6b7684', 1);
      for (const [x, y] of [[x1, y1], [x1, y0]]) { const u = Q(x, y), v = Q(x, y, 24); c.strokeStyle = '#6b7684'; c.lineWidth = 2; c.beginPath(); c.moveTo(u[0], u[1]); c.lineTo(v[0], v[1]); c.stroke(); }
      const bx0 = x0 + .2, by0 = y0 + .1; blk(c, bx0, by0, x1 - x0 - .4, .35, 6, 2, '#b07a44'); // bench
      blk(c, x0 - .1, y0 - .1, x1 - x0 + .2, y1 - y0 + .2, 23, 3, '#4a7fb5'); // roof
      const pole = [x0, y1 + .15], pu = Q(pole[0], pole[1]), pv = Q(pole[0], pole[1], 36); c.strokeStyle = '#555'; c.lineWidth = 2; c.beginPath(); c.moveTo(pu[0], pu[1]); c.lineTo(pv[0], pv[1]); c.stroke();
      ART.ell(c, pv[0], pv[1], 7, 7, '#ffffff', '#2a6ad9', 2); c.font = 'bold 6px sans-serif'; c.textAlign = 'center'; c.fillStyle = '#2a6ad9'; c.fillText('BUS', pv[0], pv[1] + 2); c.textAlign = 'start';
    }
  }
  // ---------------- stage 3: shops & public buildings ----------------
  function drawCivic(c, o, T) { frameOn(o, D[o.k].w, D[o.k].d); try { civic_(c, o, T); } finally { frameOff(); } }
  function signBoard(c, x, y, z, ic, txt) {
    if (ROT) { const R = ROT; ROT = null; try { signBoard(c, 2 * R.ox + R.W - x, R.oy + R.D - .3, z, ic, txt); } finally { ROT = R; } return; } // turned: the name sign hangs on the back wall we see
    const q = Q(x, y, z); c.font = 'bold 7px sans-serif'; const tw = Math.max(18, c.measureText(txt).width + 16);
    ART.rrect(c, q[0] - tw / 2, q[1] - 8, tw, 12, 4); c.fillStyle = '#fffaf0'; c.fill(); c.strokeStyle = ART.OUT; c.lineWidth = .8; c.stroke();
    c.textAlign = 'center'; c.fillStyle = '#5a3a2a'; c.fillText(ic + ' ' + txt, q[0], q[1] + 1); c.textAlign = 'start';
  }
  function awning(c, x0, x1, y, z, a, b) { if (ROT) return; const n = Math.max(2, Math.round((x1 - x0) / .3)); for (let i = 0; i < n; i++) poly(c, [Q(x0 + i * (x1 - x0) / n, y, z), Q(x0 + (i + 1) * (x1 - x0) / n, y, z), Q(x0 + (i + 1) * (x1 - x0) / n, y + .45, z - 5), Q(x0 + i * (x1 - x0) / n, y + .45, z - 5)], i % 2 ? a : b, ART.OUT, .6); }
  // v1.4: every shop / public building has its own silhouette + one big landmark you can spot from far away
  // (design rule from isometric city builders: shape first, then colour, then props & signs)
  const fS = (c, x0, x1, y, z0, z1, col, st) => ROT ? 0 : poly(c, [Q(x0, y, z1), Q(x1, y, z1), Q(x1, y, z0), Q(x0, y, z0)], col, st === undefined ? ART.OUT : st, .8); // a panel on a south face
  const fE = (c, x, y0, y1, z0, z1, col, st) => ROT ? 0 : poly(c, [Q(x, y0, z1), Q(x, y1, z1), Q(x, y1, z0), Q(x, y0, z0)], col, st === undefined ? ART.OUT : st, .8); // on an east face
  const pole = (c, x, y, z0, z1, col, lw) => { const a = Q(x, y, z0), b = Q(x, y, z1); c.strokeStyle = col; c.lineWidth = lw || 1.6; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); };
  const emo = (c, e, x, y, z, px) => { const q = Q(x, y, z); c.font = (px || 14) + 'px sans-serif'; c.textAlign = 'center'; c.fillText(e, q[0], q[1]); c.textAlign = 'start'; };
  function car(c, x, y, col, kind, T) { // a little parked car (kind: police / ambulance / fire)
    ART.ell(c, ...Q(x + .5, y + .25), 16, 6, 'rgba(0,0,0,.15)');
    blk(c, x, y, 1, .5, 2, 7, col); blk(c, x + .22, y + .06, .55, .38, 9, 6, kind === 'fire' ? col : '#ffffff');
    fS(c, x + .28, x + .72, y + .44, 10, 14, '#9fd3f0'); fE(c, x + .77, y + .1, y + .4, 10, 14, '#9fd3f0');
    for (const wx of [x + .18, x + .8]) { const q = Q(wx, y + .5, 2); ART.ell(c, q[0], q[1], 3, 3, '#333'); }
    if (kind === 'police') { fS(c, x, x + 1, y + .5, 4, 6, '#2f4f8a', null); const q = Q(x + .5, y + .25, 16), on = Math.sin(T * 8) > 0; ART.ell(c, q[0] - 3, q[1], 2.5, 2, on ? '#3a7aff' : '#888'); ART.ell(c, q[0] + 3, q[1], 2.5, 2, on ? '#888' : '#ff3a3a'); }
    if (kind === 'amb') { const q = Q(x + .5, y + .5, 6); c.fillStyle = '#e0303a'; c.fillRect(q[0] - 1, q[1] - 3, 2, 6); c.fillRect(q[0] - 3, q[1] - 1, 6, 2); }
    if (kind === 'fire') { const a = Q(x + .1, y + .25, 16), b = Q(x + .95, y + .25, 18); c.strokeStyle = '#ddd'; c.lineWidth = 2; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); }
  }
  function dome(c, x, y, z, r, col) { const q = Q(x, y, z); ART.ell(c, q[0], q[1], r, r * .45, sh(col, -.15), ART.OUT, 1); c.beginPath(); c.ellipse(q[0], q[1], r, r * .9, 0, Math.PI, 0); c.closePath(); c.fillStyle = col; c.fill(); c.strokeStyle = ART.OUT; c.lineWidth = 1; c.stroke(); ART.ell(c, q[0] - r * .35, q[1] - r * .5, r * .18, r * .28, 'rgba(255,255,255,.45)'); }
  // ================= 상점 "공공" 탭 PNG 교체 (2026-10-10) =================
  // 사용자가 직접 그린 아이소메트릭 건물 그림(spr/store/*.png)으로 기존 벡터(절차적) 그림을
  // 대체함. 이 그림들은 동물원/공원/호수 배경과 달리 위에서 내려다본 평면도가 아니라, 건물을
  // 비스듬히 바라본 "서 있는 건물" 형태라서(내 집 홈 스프라이트와 같은 방식), 타일 부지의
  // 중심점 위에 고정 비율로 띄워서 그리는 방식(앵커 스프라이트)으로 맞춤.
  const STORE_IMG_KEYS = ['conv', 'florist', 'bakery', 'fire', 'clocktower', 'aquarium_center', 'chapel', 'lookout', 'market', 'pet_themepark', 'school', 'gazebo', 'windmill', 'clinic', 'photo', 'training', 'police', 'library'];
  const STORE_IMG = {};
  for (const _sk of STORE_IMG_KEYS) {
    const _su = (typeof assetUrl === 'function') ? assetUrl('spr/store/' + _sk + '.png') : ('spr/store/' + _sk + '.png');
    const _sim = (typeof ASSET_CACHE !== 'undefined') ? ASSET_CACHE.load(_su) : ((typeof Image !== 'undefined') ? new Image() : null);
    if (_sim && !_sim.src) { _sim.crossOrigin = 'anonymous'; _sim.src = _su; }
    STORE_IMG[_sk] = _sim;
  }
  // v2026-10-10 (2nd pass): "건물짓기 전 초록색 칸(부지 미리보기)과 위치/크기가 안 맞는다"는
  // 피드백 -- 부지의 "중심점"에 그림 밑단을 맞췄더니, 부지 사각형(다이아몬드)의 세로 중앙에
  // 맞춰진 꼴이 되어 그림이 실제 부지보다 뒤(북쪽)로 반 칸 어긋나 보였음. 다이아몬드 모양 부지에서
  // 카메라와 가장 가까운(화면상 가장 아래) 꼭짓점은 중심점보다 (w+d)*16/2 만큼 더 아래에 있으므로,
  // 그림 밑단을 그 꼭짓점에 맞추도록 수정. 폭도 1.4배는 너무 커서 부지보다 건물이 과하게 커보였던
  // 것을 1.15배로 줄임 (처마/벤치 등 약간의 바깥쪽 여유만 남김).
  const STORE_SPRITE_W = (w, dd) => (w + dd) * 32 * 1.15;
  function drawStoreSprite(c, x, y, w, dd, key, r) {
    const im = STORE_IMG[key];
    if (!im || !im.complete || !im.naturalWidth) return false;
    const cx = x + w / 2, cy = y + dd / 2;
    const q = Q(cx, cy);
    const dw = STORE_SPRITE_W(w, dd);
    const dh = dw * (im.naturalHeight / im.naturalWidth);
    const groundY = q[1] + (w + dd) * 16 / 2; // 부지 다이아몬드의 남쪽(카메라와 가장 가까운) 꼭짓점
    // v2026-10-10: "방향 회전이 안 먹는다" -- 그림이 한 각도로만 그려진 실사풍 사진이라 진짜
    // 4방향 건축 회전은 표현할 수 없지만, 회전 버튼을 눌렀을 때 아무 변화가 없으면 "고장났다"고
    // 느껴지므로, 기존 캐릭터 방향 전환과 같은 방식(좌우 반전)으로 홀수 회전값에서 그림을 뒤집어
    // 최소한 시각적으로 "돌아갔다"는 게 보이게 함.
    const flip = (r % 2) ? -1 : 1;
    c.save();
    c.translate(q[0], groundY);
    c.scale(flip, 1);
    c.drawImage(im, -dw / 2, -dh, dw, dh);
    c.restore();
    return true;
  }

  function civic_(c, o, T) {
    const d = D[o.k], x = o.x, y = o.y, w = d.w, dd = d.d, k = o.k, lit = S.clock && (S.clock.m >= 1080 || S.clock.m < 360), nm = t('tk_' + k);
    poly(c, [Q(x + .1, y + .1), Q(x + w - .1, y + .1), Q(x + w - .1, y + dd - .1), Q(x + .1, y + dd - .1)], d.open ? 'rgba(120,180,80,.25)' : 'rgba(210,198,168,.5)');
    // v2026-10-10: 사용자가 직접 그린 새 상점 PNG가 있으면 기존 절차적(벡터) 그림 대신 그걸 사용함
    if (STORE_IMG[k] && STORE_IMG[k].complete && STORE_IMG[k].naturalWidth > 0) { drawStoreSprite(c, x, y, w, dd, k, o.r || 0); return; }
    if (d.open && k !== 'pet_themepark') { openLot(c, o, T, lit, nm); return; }
    const bx = x + .3, by = y + .25, bw = w - .6, bd = dd - .95, glow = lit ? '#ffe68a' : '#bfe0f5';
    const path = (x0, x1) => poly(c, [Q(x0, by + bd), Q(x1, by + bd), Q(x1, y + dd - .05), Q(x0, y + dd - .05)], '#e3d6bc');
    if (k === 'conv') { // flat glass box, bright colour band, rooftop "24" box, vending machine
      path(bx + bw / 2 - .3, bx + bw / 2 + .3); blk(c, bx, by, bw, bd, 0, 22, '#f4f6f8');
      fS(c, bx + .1, bx + bw - .1, by + bd, 1, 13, lit ? 'rgba(255,240,180,.95)' : 'rgba(160,215,240,.9)');
      for (let i = 0; i < 4; i++) fS(c, bx + .25 + i * .55, bx + .6 + i * .55, by + bd, 3, 7, ['#ff9a3b', '#6ab04c', '#e0507a', '#4a9be0'][i], null);
      fE(c, bx + bw, by + .2, by + bd - .2, 3, 13, lit ? 'rgba(255,240,180,.9)' : 'rgba(160,215,240,.85)');
      blk(c, bx - .03, by - .03, bw + .06, bd + .06, 14, 4, '#3aa76d'); blk(c, bx - .03, by - .03, bw + .06, bd + .06, 18, 2, '#ff8a3a'); blk(c, bx, by, bw, bd, 20, 2, '#d8dde2');
      blk(c, bx + bw / 2 - .45, by + .4, .9, .3, 22, 11, '#ff8a3a'); { const q = Q(bx + bw / 2, by + .7, 28); c.font = 'bold 9px sans-serif'; c.textAlign = 'center'; c.fillStyle = '#fff'; c.fillText('24h', q[0], q[1]); c.textAlign = 'start'; }
      blk(c, x + w - .5, y + dd - .75, .3, .3, 0, 15, '#e0303a'); fS(c, x + w - .47, x + w - .23, y + dd - .45, 6, 13, '#bfe0f5');
    } else if (k === 'bakery') { // cosy cottage, steep roof, round brick oven chimney, GIANT croissant on the ridge
      path(bx + bw / 2 - .3, bx + bw / 2 + .3); blk(c, bx, by, bw, bd, 0, 20, '#fdf0d8');
      for (const tx of [bx + .05, bx + bw / 2, bx + bw - .05]) pole(c, tx, by + bd, 0, 20, '#8a5a3b', 1.4);
      fS(c, bx + .2, bx + bw / 2 - .3, by + bd, 5, 13, '#ffe9b0'); for (let i = 0; i < 3; i++) { const q = Q(bx + .35 + i * .25, by + bd, 7); ART.ell(c, q[0], q[1], 3.5, 2.4, '#d9913a', '#8a5a2a', .6); }
      door(c, bx + bw / 2 - .21, by + bd, 14, '#8a5a3b'); awning(c, bx + .1, bx + bw - .1, by + bd, 17, '#c8864a', '#fff6e6');
      gable(c, bx, by, bw, bd, 20, 28, '#a0522d', '#fdf0d8');
      blk(c, bx + bw - .7, by + .15, .45, .45, 20, 26, '#b5654a'); smoke(c, bx + bw - .47, by + .37, 50, T, 3);
      { const q = Q(bx + bw / 2, by + bd / 2, 56), bob = Math.sin(T * 2) * 1.5; for (const [dx, dy, r] of [[-12, 6, 5], [-7, 1, 6.5], [0, -1, 7.5], [7, 1, 6.5], [12, 6, 5]]) ART.ell(c, q[0] + dx, q[1] + dy + bob, r, r * .8, '#e8a33a', '#9a5a1a', 1); for (const dx of [-7, 0, 7]) { c.strokeStyle = 'rgba(120,60,10,.6)'; c.lineWidth = 1; c.beginPath(); c.moveTo(q[0] + dx - 2, q[1] - 4 + bob); c.lineTo(q[0] + dx + 2, q[1] + 4 + bob); c.stroke(); } }
      { const tq = Q(x + .6, y + dd - .45); ART.ell(c, tq[0], tq[1] - 7, 6, 3, '#ffffff', ART.OUT, .6); pole(c, x + .6, y + dd - .45, 0, 22, '#8a5a3b', 1.2); const u = Q(x + .6, y + dd - .45, 24); c.beginPath(); c.moveTo(u[0] - 12, u[1] + 4); c.lineTo(u[0], u[1] - 6); c.lineTo(u[0] + 12, u[1] + 4); c.closePath(); c.fillStyle = '#e8534f'; c.fill(); c.stroke(); }
    } else if (k === 'florist') { // little shop + a glass greenhouse with a curved roof, flower buckets outside
      const sw = bw * .5; path(bx + sw / 2 - .25, bx + sw / 2 + .25); blk(c, bx, by, sw, bd, 0, 20, '#f8e6ee'); door(c, bx + sw / 2 - .21, by + bd, 14, '#6ab04c'); gable(c, bx, by, sw, bd, 20, 16, '#e98aa8', '#f8e6ee');
      const gx = bx + sw + .05, gw = bw - sw - .05;
      fS(c, gx, gx + gw, by + bd, 0, 18, 'rgba(210,245,225,.6)', '#ffffff'); fE(c, gx + gw, by, by + bd, 0, 18, 'rgba(200,240,220,.55)', '#ffffff');
      for (let i = 0; i < 4; i++) { const q = Q(gx + .2 + i * (gw - .3) / 3, by + bd - .3, 4); ART.ell(c, q[0], q[1], 5, 4, ['#5fae52', '#e0507a', '#6bb85c', '#ffcf3a'][i]); }
      for (let i = 0; i <= 6; i++) { const u = i / 6, a = Q(gx, by + bd * u, 18 + Math.sin(u * Math.PI) * 10), b = Q(gx + gw, by + bd * u, 18 + Math.sin(u * Math.PI) * 10); c.strokeStyle = 'rgba(255,255,255,.95)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); }
      poly(c, [Q(gx, by, 18), Q(gx + gw, by, 18), Q(gx + gw, by + bd / 2, 28), Q(gx, by + bd / 2, 28)], 'rgba(220,250,235,.5)', '#ffffff', 1); poly(c, [Q(gx, by + bd / 2, 28), Q(gx + gw, by + bd / 2, 28), Q(gx + gw, by + bd, 18), Q(gx, by + bd, 18)], 'rgba(230,255,240,.6)', '#ffffff', 1);
      for (let i = 0; i < 5; i++) { const q = Q(x + .45 + i * .5, y + dd - .4); c.fillStyle = '#8a9aa8'; c.fillRect(q[0] - 3, q[1] - 6, 6, 6); for (let j = 0; j < 3; j++) ART.ell(c, q[0] - 2.5 + j * 2.5, q[1] - 8 - (j % 2) * 2, 2.2, 2.2, ['#ff5a7a', '#ffd166', '#b59be0', '#ff9e5a', '#ffffff'][(i + j) % 5]); }
    } else if (k === 'clinic') { // white box, blue stripe, big green-cross sign on the roof, ambulance parked
      path(bx + bw / 2 - .3, bx + bw / 2 + .3); blk(c, bx, by, bw, bd, 0, 26, '#ffffff');
      fS(c, bx, bx + bw, by + bd, 11, 14, '#4aa3c8', null); fE(c, bx + bw, by, by + bd, 11, 14, '#4aa3c8', null);
      for (let i = 0; i < 3; i++) { if (i === 1) continue; winS(c, bx + .15 + i * (bw - .3) / 3, by + bd, 4, .45, 6, lit, '#4aa3c8'); winS(c, bx + .15 + i * (bw - .3) / 3, by + bd, 16, .45, 6, lit, '#4aa3c8'); }
      winS(c, bx + bw / 2 - .2, by + bd, 16, .4, 6, lit, '#4aa3c8'); door(c, bx + bw / 2 - .25, by + bd, 10, '#9fd3f0'); blk(c, bx, by, bw, bd, 26, 2, '#e8eef2');
      { const q = Q(bx + bw / 2, by + bd / 2, 46); ART.ell(c, q[0], q[1], 13, 13, '#ffffff', '#3aa76d', 2); c.fillStyle = '#3aa76d'; c.fillRect(q[0] - 3, q[1] - 9, 6, 18); c.fillRect(q[0] - 9, q[1] - 3, 18, 6); pole(c, bx + bw / 2, by + bd / 2, 28, 34, '#777'); }
      car(c, x + w - 1.1, y + dd - .65, '#ffffff', 'amb', T);
    } else if (k === 'photo') { // the building IS a big camera: dark body, huge lens on the front, flash box, red shutter button
      path(bx + .2, bx + .6); blk(c, bx, by, bw, bd, 0, 26, '#3f4250'); blk(c, bx + .15, by + .15, .8, .7, 26, 8, '#5a5e70'); fS(c, bx + .25, bx + .85, by + .85, 28, 32, '#fffbe0'); // flash
      { const q = Q(bx + bw / 2 + .25, by + bd, 13); for (const [r, col] of [[15, '#22242c'], [12, '#5a6070'], [9, '#2a3a6a'], [6, '#3a6ab5']]) ART.ell(c, q[0], q[1], r, r, col, ART.OUT, .8); ART.ell(c, q[0] - 3, q[1] - 3, 2.5, 2.5, 'rgba(255,255,255,.8)'); }
      { const q = Q(bx + bw - .5, by + .4, 26); ART.ell(c, q[0], q[1] - 3, 5, 3, '#e0303a', ART.OUT, .8); }
      door(c, bx + .2, by + bd, 13, '#b59be0');
      { const q = Q(x + w - .5, y + dd - .45); ART.rrect(c, q[0] - 7, q[1] - 22, 14, 18, 3); c.fillStyle = 'rgba(0,0,0,0)'; c.strokeStyle = '#e98aa8'; c.lineWidth = 2.5; c.stroke(); c.font = '8px sans-serif'; c.textAlign = 'center'; c.fillText('💗', q[0], q[1] - 24); c.textAlign = 'start'; pole(c, x + w - .5, y + dd - .45, 0, 4, '#e98aa8', 2); }
    } else if (k === 'school') { // long red-brick building, white window grid, central clock tower with a bell, flag + hopscotch yard
      path(bx + bw / 2 - .4, bx + bw / 2 + .4); blk(c, bx, by, bw, bd, 0, 28, '#c8664a');
      for (const z of [5, 17]) for (let i = 0; i < 7; i++) { const wx = bx + .15 + i * (bw - .3) / 7; if (Math.abs(wx + .2 - (bx + bw / 2)) < .6) continue; winS(c, wx, by + bd, z, .38, 8, lit && (i + z) % 3 === 0, '#ffffff'); }
      for (const z of [5, 17]) winE(c, bx + bw, by + .5, z, .6, 8, lit, '#ffffff');
      fS(c, bx, bx + bw, by + bd, 14, 15.5, '#f4e8d8', null); hip(c, bx, by, bw, bd, 28, 12, '#8a4a3a');
      const tx = bx + bw / 2 - .5; blk(c, tx, by + bd - 1, 1, 1, 0, 58, '#d9785a'); door(c, tx + .29, by + bd, 16, '#6a3a2a');
      { const q = Q(tx + .5, by + bd, 46); ART.ell(c, q[0], q[1], 7, 7, '#ffffff', ART.OUT, 1); const m = S.clock ? S.clock.m : 480; for (const [len, ang] of [[4, ((m / 60) % 12) / 12], [6, (m % 60) / 60]]) { const a = ang * 6.283 - 1.571; c.strokeStyle = '#333'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(q[0], q[1]); c.lineTo(q[0] + Math.cos(a) * len, q[1] + Math.sin(a) * len); c.stroke(); } }
      { const tp = Q(tx + .5, by + bd - .5, 58); c.beginPath(); c.moveTo(tp[0] - 14, tp[1] + 4); c.lineTo(tp[0], tp[1] - 22); c.lineTo(tp[0] + 14, tp[1] + 4); c.closePath(); c.fillStyle = '#8a4a3a'; c.fill(); c.strokeStyle = ART.OUT; c.stroke(); emo(c, '🔔', tx + .5, by + bd - .5, 62, 9); }
      for (let i = 0; i < 4; i++) poly(c, [Q(x + .4 + i * .35, y + dd - .6), Q(x + .7 + i * .35, y + dd - .6), Q(x + .7 + i * .35, y + dd - .3), Q(x + .4 + i * .35, y + dd - .3)], null, '#ffffff', 1);
      { pole(c, x + w - .35, y + dd - .35, 0, 48, '#777'); const b = Q(x + w - .35, y + dd - .35, 48), fw = Math.sin(T * 3) * 2; c.fillStyle = '#4a9be0'; c.beginPath(); c.moveTo(b[0], b[1]); c.lineTo(b[0] + 13, b[1] + 3 + fw); c.lineTo(b[0], b[1] + 8); c.fill(); }
    } else if (k === 'police') { // pale blue box with a blue-and-white checkered band, gold star over the door, antenna, patrol car
      path(bx + bw / 2 - .3, bx + bw / 2 + .3); blk(c, bx, by, bw, bd, 0, 28, '#e8eef8');
      for (let i = 0; i < 12; i++) { const u0 = bx + i * bw / 12; fS(c, u0, u0 + bw / 12, by + bd, 19, 21.5, i % 2 ? '#ffffff' : '#2f4f8a', null); fS(c, u0, u0 + bw / 12, by + bd, 21.5, 24, i % 2 ? '#2f4f8a' : '#ffffff', null); }
      for (let i = 0; i < 6; i++) { const v0 = by + i * bd / 6; fE(c, bx + bw, v0, v0 + bd / 6, 19, 21.5, i % 2 ? '#ffffff' : '#2f4f8a', null); fE(c, bx + bw, v0, v0 + bd / 6, 21.5, 24, i % 2 ? '#2f4f8a' : '#ffffff', null); }
      for (let i = 0; i < 4; i++) { if (i === 1 || i === 2) continue; winS(c, bx + .2 + i * (bw - .4) / 4, by + bd, 6, .45, 8, lit, '#2f4f8a'); }
      door(c, bx + bw / 2 - .25, by + bd, 14, '#2f4f8a'); blk(c, bx, by, bw, bd, 28, 2, '#c8d0dc');
      emo(c, '⭐', bx + bw / 2, by + bd, 16, 11); pole(c, bx + .4, by + .4, 30, 58, '#777', 1.2); { const q = Q(bx + .4, by + .4, 58); ART.ell(c, q[0], q[1], 2, 2, Math.sin(T * 4) > 0 ? '#ff3a3a' : '#661111'); }
      car(c, x + .35, y + dd - .65, '#ffffff', 'police', T);
    } else if (k === 'fire') { // red brick hall with a tall hose-drying tower, two big red doors, a fire truck peeking out
      const hw = bw - 1; blk(c, bx + 1, by, hw, bd, 0, 28, '#c0443a'); blk(c, bx, by, .95, .95, 0, 64, '#b83a30');
      winS(c, bx + .25, by + .95, 44, .45, 9, lit, '#ffffff'); winE(c, bx + .95, by + .25, 44, .45, 9, lit, '#ffffff');
      { const tp = Q(bx + .47, by + .47, 64); c.beginPath(); c.moveTo(tp[0] - 12, tp[1] + 5); c.lineTo(tp[0], tp[1] - 14); c.lineTo(tp[0] + 12, tp[1] + 5); c.closePath(); c.fillStyle = '#7a2a22'; c.fill(); c.strokeStyle = ART.OUT; c.stroke(); }
      blk(c, bx, by + .95, .95, bd - .95, 0, 28, '#c0443a');
      for (const gx of [bx + 1.1, bx + 1.1 + hw / 2]) { fS(c, gx, gx + hw / 2 - .2, by + bd, 0, 18, '#e8534f'); fS(c, gx + .08, gx + hw / 2 - .28, by + bd, 0, 16, '#8a1a18', null); fS(c, gx + .1, gx + hw / 2 - .3, by + bd, 2, 10, '#e0303a', null); }
      fS(c, bx, bx + bw, by + bd, 20, 23, '#ffffff', null); blk(c, bx, by, bw, bd, 28, 2, '#7a2a22');
      { const q = Q(bx + 1 + hw / 2, by + bd / 2, 32), on = Math.sin(T * 8) > 0; ART.ell(c, q[0] - 4, q[1], 3, 2.4, on ? '#ff3a3a' : '#888'); ART.ell(c, q[0] + 4, q[1], 3, 2.4, on ? '#888' : '#ffb03a'); }
      emo(c, '🧯', x + .4, y + dd - .45, 2, 10);
    } else if (k === 'library') { // classical: steps, white columns, a triangular pediment and a green copper dome
      blk(c, bx - .1, by + bd - .1, bw + .2, .5, 0, 2, '#e8e0d0'); blk(c, bx - .05, by + bd - .1, bw + .1, .35, 2, 2, '#f2ece0');
      blk(c, bx, by, bw, bd - .5, 0, 26, '#efe6d6'); winE(c, bx + bw, by + .3, 8, .6, 12, lit, '#8a7a5a');
      for (let i = 0; i < 5; i++) { const cx = bx + .1 + i * (bw - .3) / 4; blk(c, cx, by + bd - .6, .14, .14, 2, 22, '#ffffff'); }
      door(c, bx + bw / 2 - .21, by + bd - .5, 15, '#8a5a3b');
      blk(c, bx - .08, by + bd - .7, bw + .16, .25, 24, 3, '#f8f4ea');
      poly(c, [Q(bx - .08, by + bd - .45, 27), Q(bx + bw + .08, by + bd - .45, 27), Q(bx + bw / 2, by + bd - .45, 38)], '#f8f4ea', ART.OUT, 1);
      blk(c, bx, by, bw, bd - .5, 26, 2, '#d8cdb8'); dome(c, bx + bw / 2, by + (bd - .5) / 2, 28, 22, '#6ab5a0'); pole(c, bx + bw / 2, by + (bd - .5) / 2, 47, 57, '#c9a227', 1.6);
      emo(c, '📖', bx + bw / 2, by + bd - .45, 30, 8);
    } else if (k === 'training') { // small barn-roof clubhouse at the back + an agility course: A-frame, colourful tunnel, weave poles, a dog jumping
      blk(c, bx, by, bw * .45, bd * .55, 0, 18, '#e6f2e2'); gambrel(c, bx, by, bw * .45, bd * .55, 18, 16, '#4a7fb5', '#e6f2e2'); door(c, bx + bw * .22 - .2, by + bd * .55, 12, '#4a7fb5');
      { const ax = bx + bw * .6, ay = by + .3; poly(c, [Q(ax, ay, 0), Q(ax + .5, ay, 16), Q(ax + .5, ay + .6, 16), Q(ax, ay + .6, 0)], '#ffcf3a', ART.OUT, .8); poly(c, [Q(ax + .5, ay, 16), Q(ax + 1, ay, 0), Q(ax + 1, ay + .6, 0), Q(ax + .5, ay + .6, 16)], '#e8534f', ART.OUT, .8); }
      for (let i = 0; i < 5; i++) { const q = Q(bx + .3 + i * .28, y + dd - 1.2, 0); ART.ell(c, q[0], q[1] - 5, 5, 5 * .9, ['#e8534f', '#ffcf3a', '#4a9be0', '#6ab04c', '#b59be0'][i], ART.OUT, .7); ART.ell(c, q[0], q[1] - 5, 3, 2.8, '#333'); }
      for (let i = 0; i < 5; i++) pole(c, bx + bw * .6 + i * .22, y + dd - .6, 0, 12, i % 2 ? '#ffffff' : '#e8534f', 1.6);
      { const ph = (T * .5) % 1, px = bx + bw * .55 + ph * 1.2, h = Math.sin(ph * Math.PI) * 14, q = Q(px, by + bd * .7, h); c.save(); c.translate(q[0], q[1]); c.scale(.4, .4); ART.pet(c, 'bordercollie', { t: T, mood: 'happy', seed: 4, age: 1, moving: true, dir: 1 }); c.restore(); }
      emo(c, '🦴', bx + bw * .22, by + bd * .27, 40, 13);
    } else if (k === 'pethotel') { // tall 3-floor hotel, arched windows with balconies, red carpet + canopy, a glowing bone sign on the roof
      poly(c, [Q(bx + bw / 2 - .25, by + bd), Q(bx + bw / 2 + .25, by + bd), Q(bx + bw / 2 + .25, y + dd - .05), Q(bx + bw / 2 - .25, y + dd - .05)], '#d9434a');
      blk(c, bx, by, bw, bd, 0, 48, '#fff6e0');
      for (let f = 0; f < 3; f++) { const z = 6 + f * 14; for (let i = 0; i < 4; i++) { const wx = bx + .2 + i * (bw - .4) / 4; if (f === 0 && (i === 1 || i === 2)) continue; winS(c, wx, by + bd, z, .4, 9, lit && (i + f) % 2 === 0, '#b07a44'); if (f) fS(c, wx - .05, wx + .45, by + bd + .02, z - 1, z + 1, '#b07a44', null); } winE(c, bx + bw, by + .3, z, .5, 9, lit && f === 1, '#b07a44'); }
      door(c, bx + bw / 2 - .25, by + bd, 13, '#b07a44'); poly(c, [Q(bx + bw / 2 - .4, by + bd, 16), Q(bx + bw / 2 + .4, by + bd, 16), Q(bx + bw / 2 + .4, by + bd + .5, 13), Q(bx + bw / 2 - .4, by + bd + .5, 13)], '#d9434a', ART.OUT, .8);
      blk(c, bx - .05, by - .05, bw + .1, bd + .1, 48, 3, '#9a6ab5');
      { const q = Q(bx + bw / 2, by + bd / 2, 64), g = lit || Math.sin(T * 2) > 0 ? '#fff3b0' : '#ffffff'; c.fillStyle = g; c.strokeStyle = '#c9962a'; c.lineWidth = 1.2; ART.rrect(c, q[0] - 12, q[1] - 3, 24, 6, 3); c.fill(); c.stroke(); for (const [dx, dy] of [[-12, -3], [-12, 3], [12, -3], [12, 3]]) ART.ell(c, q[0] + dx, q[1] + dy, 4, 4, g, '#c9962a', 1.2); pole(c, bx + bw / 2, by + bd / 2, 51, 58, '#777'); }
      emo(c, '⭐⭐⭐', bx + bw / 2, by + bd, 44, 9);
    } else if (k === 'chapel') { // white chapel, pink roof, tall steeple with a bell, rose window, arched door, flower arch
      path(bx + bw / 2 - .35, bx + bw / 2 + .35); blk(c, bx, by, bw, bd, 0, 30, '#ffffff');
      for (let i = 0; i < 3; i++) { const q = Q(bx + bw + .01, by + .4 + i * (bd - .8) / 2, 14); c.beginPath(); c.ellipse(q[0], q[1], 3, 7, 0, 0, 7); c.fillStyle = lit ? '#ffe68a' : '#bcd8f0'; c.fill(); c.strokeStyle = '#c9962a'; c.stroke(); }
      gable(c, bx, by, bw, bd, 30, 22, '#e98aa8', '#ffffff');
      const sx = bx + bw / 2 - .45; blk(c, sx, by + bd - .9, .9, .9, 0, 56, '#ffffff');
      { const q = Q(sx + .45, by + bd, 40); ART.ell(c, q[0], q[1], 7, 7, '#ffd0e0', '#c9962a', 1.2); for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283; c.strokeStyle = '#c9962a'; c.lineWidth = .7; c.beginPath(); c.moveTo(q[0], q[1]); c.lineTo(q[0] + Math.cos(a) * 7, q[1] + Math.sin(a) * 7); c.stroke(); } }
      { const q = Q(sx + .45, by + bd, 0); c.beginPath(); c.moveTo(q[0] - 6, q[1]); c.lineTo(q[0] - 6, q[1] - 14); c.arc(q[0], q[1] - 14, 6, Math.PI, 0); c.lineTo(q[0] + 6, q[1]); c.closePath(); c.fillStyle = '#b07a44'; c.fill(); c.strokeStyle = ART.OUT; c.stroke(); }
      { const tp = Q(sx + .45, by + bd - .45, 56); c.beginPath(); c.moveTo(tp[0] - 11, tp[1] + 4); c.lineTo(tp[0], tp[1] - 28); c.lineTo(tp[0] + 11, tp[1] + 4); c.closePath(); c.fillStyle = '#e98aa8'; c.fill(); c.strokeStyle = ART.OUT; c.stroke(); emo(c, '🔔', sx + .45, by + bd - .45, 60, 9); emo(c, '💗', sx + .45, by + bd - .45, 90, 11); }
      { const a = Q(x + w / 2 - .8, y + dd - .3), b = Q(x + w / 2 + .8, y + dd - .3); c.strokeStyle = '#6bb85c'; c.lineWidth = 3; c.beginPath(); c.moveTo(a[0], a[1]); c.quadraticCurveTo((a[0] + b[0]) / 2, a[1] - 40, b[0], b[1]); c.stroke(); for (let i = 0; i <= 8; i++) { const u = i / 8, px = a[0] + (b[0] - a[0]) * u, py = a[1] + (b[1] - a[1]) * u - Math.sin(u * Math.PI) * 20; ART.ell(c, px, py, 2.4, 2.4, i % 2 ? '#ff9ec0' : '#ffffff'); } }
    } else if (k === 'shelter') { // 6x5 warm timber rescue center with twin outdoor exercise yards, doghouses, agility toys, caretaker & 5 playing rescue pets
      path(bx + bw / 2 - .45, bx + bw / 2 + .45);
      // Lush turf exercise yard in the front half
      poly(c, [Q(x + .25, y + 2.1), Q(x + w - .25, y + 2.1), Q(x + w - .25, y + dd - .2), Q(x + .25, y + dd - .2)], '#9ad976', '#6da84e', 1);
      // Central stone path dividing left dog yard & right puppy/cat yard
      poly(c, [Q(x + w / 2 - .45, y + 2.1), Q(x + w / 2 + .45, y + 2.1), Q(x + w / 2 + .45, y + dd - .1), Q(x + w / 2 - .45, y + dd - .1)], '#e5d9c3', '#bca888', .8);
      // Main rescue lodge at the north side
      const lby = y + .2, lbd = 1.95;
      blk(c, bx, lby, bw, lbd, 0, 26, '#fff6eb');
      fS(c, bx, bx + bw, lby + lbd, 0, 7, '#8c5838');
      fE(c, bx + bw, lby, lby + lbd, 0, 7, '#7a4b2e');
      door(c, bx + bw / 2 - .25, lby + lbd, 15, '#6a3e20');
       awning(c, bx + bw / 2 - .7, bx + bw / 2 + .7, lby + lbd, 18, '#d97746', '#fffaf0');
      for (const wx of [bx + .35, bx + 1.2, bx + bw - 1.65, bx + bw - .8]) winS(c, wx, lby + lbd, 8, .45, 9, lit, '#6a3e20');
      hip(c, bx, lby, bw, lbd, 26, 15, '#d97746');
      // Twin wooden doghouses in the yards
      for (const [dx, rcol] of [[x + .45, '#d9534f'], [x + w - 1.25, '#4a9be0']]) {
        blk(c, dx, y + 2.35, .8, .65, 0, 9, '#d89658');
        gable(c, dx, y + 2.35, .8, .65, 9, 6, rcol, '#d89658');
      }
      // Food & water bowls
      for (const [fx, fy, col] of [[x + 1.55, y + 2.55, '#e8534f'], [x + 1.85, y + 2.55, '#4aa3df'], [x + w - 1.6, y + 2.55, '#ffcf3a']]) {
        const fq = Q(fx, fy, 1); ART.ell(c, fq[0], fq[1], 4.5, 2.8, col, ART.OUT, .8); ART.ell(c, fq[0], fq[1] - 1, 3, 1.6, '#fff');
      }
      // Enclosure fences around left and right play pens
      fence(c, x + .25, y + 2.1, x + w / 2 - .45, y + 2.1);
      fence(c, x + w / 2 + .45, y + 2.1, x + w - .25, y + 2.1);
      fence(c, x + .25, y + 2.1, x + .25, y + dd - .2);
      fence(c, x + w - .25, y + 2.1, x + w - .25, y + dd - .2);
      fence(c, x + .25, y + dd - .2, x + w / 2 - .45, y + dd - .2);
      fence(c, x + w / 2 + .45, y + dd - .2, x + w - .25, y + dd - .2);
      // 5 animated rescue dogs & cats playing in the yards
      const spList = ['shiba', 'golden', 'corgi', 'kitten', 'maltese'];
      for (let i = 0; i < 5; i++) {
        const isRight = i >= 3;
        const cx0 = isRight ? x + w * .74 : x + w * .26;
        const cy0 = y + 3.45 + (i % 2) * .45;
        const ang = T * (.75 + i * .15) + i * 1.7;
        const px = cx0 + Math.cos(ang) * .65, py = cy0 + Math.sin(ang) * .35;
        const dir = -Math.sin(ang) > 0 ? 1 : -1;
        const pq = Q(px, py);
        c.save(); c.translate(pq[0], pq[1] - Math.abs(Math.sin(T * 8 + i)) * 2.5); c.scale(.82 * dir, .82);
        ART.pet(c, spList[i], { t: T + i, mood: 'happy', seed: i * 3 + 1, age: 1, moving: true, dir: 1 });
        c.restore();
      }
      // Caretaker tossing treats in the center path (full human scale matching player!)
      const sq = Q(x + w / 2, y + 3.65);
      c.save(); c.translate(sq[0], sq[1]); c.scale(.95, .95);
      ART.human(c, { skin: 1, hair: 3, hcol: '#4a2c11', top: 2, tcol: '#2f7a5a', bot: 1, bcol: '#334155' }, 0, T, false, 'happy', Math.sin(T * 3) > 0 ? 1 : 0, false);
      c.restore();
      emo(c, '🐾', bx + bw / 2, lby + lbd, 36, 12);
    } else if (k === 'aquarium_center') {
      // 6x5 Marine Aquarium Center
      path(bx + bw / 2 - .5, bx + bw / 2 + .5);
      blk(c, bx, by, bw, bd, 0, 32, '#e0f2fe');
      fS(c, bx, bx + bw, by + bd, 0, 8, '#0284c7');
      fE(c, bx + bw, by, by + bd, 0, 8, '#0369a1');
      door(c, bx + bw / 2 - .35, by + bd, 16, '#0284c7');
      // Large panoramic curved ocean glass windows
      for (const wx of [bx + .5, bx + 1.6, bx + bw - 2.1, bx + bw - 1.0]) {
        winS(c, wx, by + bd, 10, .85, 14, true, '#0284c7');
        // Swimming fish silhouettes inside
        const fq = Q(wx + .4, by + bd + .02, 16);
        ART.ell(c, fq[0], fq[1], 4, 2, '#38bdf8');
      }
      hip(c, bx - .1, by - .1, bw + .2, bd + .2, 32, 18, '#0284c7');
      // Dolphin rooftop mascot
      emo(c, '🐬', bx + bw / 2, by + bd / 2, 54, 18);
      awning(c, bx + bw / 2 - .9, bx + bw / 2 + .9, by + bd, 20, '#0284c7', '#ffffff');
    } else if (k === 'pet_themepark') {
      // 7x6 Pet Theme Park & Carousel Carnival
      poly(c, [Q(x + .15, y + .15), Q(x + w - .15, y + .15), Q(x + w - .15, y + dd - .15), Q(x + .15, y + dd - .15)], '#fef08a', '#ca8a04', 1.5);
      // Entrance Arch & Bunting Flags
      pole(c, x + .6, y + dd - .4, 0, 30, '#e11d48', 3);
      pole(c, x + w - .6, y + dd - .4, 0, 30, '#e11d48', 3);
      const a0 = Q(x + .6, y + dd - .4, 30), a1 = Q(x + w - .6, y + dd - .4, 30);
      c.strokeStyle = '#f59e0b'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(a0[0], a0[1]); c.quadraticCurveTo((a0[0] + a1[0]) / 2, a0[1] - 18, a1[0], a1[1]); c.stroke();
      for (let i = 0; i <= 8; i++) {
        const u = i / 8, fx = (1 - u) * a0[0] + u * a1[0], fy = (1 - u) * a0[1] + u * a1[1] - Math.sin(u * Math.PI) * 18;
        poly(c, [[fx, fy], [fx + 4, fy + 7], [fx - 4, fy + 7]], ['#f43f5e', '#3b82f6', '#10b981', '#f59e0b'][i % 4]);
      }
      // Carousel Pavilion in Center
      const cx0 = x + w / 2, cy0 = y + dd / 2 - .3;
      blk(c, cx0 - 1.6, cy0 - 1.6, 3.2, 3.2, 0, 6, '#fed7aa');
      poly(c, [Q(cx0 - 1.8, cy0 - 1.8, 6), Q(cx0 + 1.8, cy0 - 1.8, 6), Q(cx0 + 1.8, cy0 + 1.8, 6), Q(cx0 - 1.8, cy0 + 1.8, 6)], '#fdba74');
      for (let i = 0; i < 4; i++) {
        const ang = i * Math.PI / 2 + T * .8;
        const px = cx0 + Math.cos(ang) * 1.1, py = cy0 + Math.sin(ang) * 1.1;
        pole(c, px, py, 6, 28, '#f59e0b', 2);
        const pq = Q(px, py, 14 + Math.sin(T * 3 + i) * 4);
        c.font = '14px sans-serif'; c.textAlign = 'center'; c.fillText(['🎠', '🦄', '🐕', '🐱'][i], pq[0], pq[1]);
      }
      // Circus tent conic roof
      const rk = Q(cx0, cy0, 48);
      const cs = [[cx0 - 2, cy0 - 2], [cx0 + 2, cy0 - 2], [cx0 + 2, cy0 + 2], [cx0 - 2, cy0 + 2]].map(([u, v]) => Q(u, v, 28));
      for (let i = 0; i < 4; i++) poly(c, [cs[i], cs[(i + 1) % 4], rk], i % 2 ? '#f43f5e' : '#ffffff', ART.OUT, 1);
      emo(c, '🎡', x + w - 1.4, y + 1.4, 0, 24);
    } else if (k === 'cat_cafe') {
      // 4x4 Cozy Cat Cafe Lounge
      path(bx + bw / 2 - .4, bx + bw / 2 + .4);
      blk(c, bx, by, bw, bd, 0, 26, '#fffbeb');
      fS(c, bx, bx + bw, by + bd, 0, 7, '#d97706');
      door(c, bx + bw / 2 - .25, by + bd, 14, '#b45309');
      winS(c, bx + .4, by + bd, 8, .55, 10, true, '#b45309');
      winS(c, bx + bw - 1.0, by + bd, 8, .55, 10, true, '#b45309');
      // Cat ear triangular roof gables
      gable(c, bx, by, bw, bd, 26, 18, '#f59e0b', '#fef3c7');
      const earL = Q(bx + .6, by + bd, 44), earR = Q(bx + bw - .6, by + bd, 44);
      poly(c, [[earL[0] - 8, earL[1]], [earL[0], earL[1] - 12], [earL[0] + 6, earL[1]]], '#d97706', ART.OUT, 1);
      poly(c, [[earR[0] - 6, earR[1]], [earR[0], earR[1] - 12], [earR[0] + 8, earR[1]]], '#d97706', ART.OUT, 1);
      awning(c, bx + bw / 2 - .8, bx + bw / 2 + .8, by + bd, 18, '#f59e0b', '#ffffff');
      emo(c, '🐾', bx + bw / 2, by + bd, 32, 10);
    } else if (k === 'pet_bakery') {
      // 4x3 Artisan Pet Bakery
      path(bx + bw / 2 - .35, bx + bw / 2 + .35);
      blk(c, bx, by, bw, bd, 0, 24, '#fdf2f8');
      fS(c, bx, bx + bw, by + bd, 0, 7, '#db2777');
      door(c, bx + bw / 2 - .22, by + bd, 13, '#9d174d');
      winS(c, bx + .35, by + bd, 7, .5, 9, true, '#9d174d');
      winS(c, bx + bw - .9, by + bd, 7, .5, 9, true, '#9d174d');
      hip(c, bx - .08, by - .08, bw + .16, bd + .16, 24, 16, '#ec4899');
      awning(c, bx + .2, bx + bw - .2, by + bd, 16, '#f472b6', '#ffffff');
      // Bakery Chimney with rising sweet aroma
      blk(c, bx + bw - .7, by + .3, .4, .4, 24, 14, '#be185d');
      for (let i = 0; i < 3; i++) {
        const ph = (T * 1.2 + i * .35) % 1;
        const sq0 = Q(bx + bw - .5, by + .5, 40 + ph * 18);
        ART.ell(c, sq0[0] + Math.sin(T * 2 + i) * 3, sq0[1], 3 + ph * 2, 2.5 + ph * 1.5, 'rgba(255,255,255,.65)');
      }
      emo(c, '🧁', bx + bw / 2, by + bd, 30, 9);
    } else if (k === 'zoo') {
      // Zoo is decomposed into individual depth-sorted layers via collectZoo
      return;
    }
    const sgz = { conv: 16, bakery: 22, florist: 20, clinic: 20, photo: 30, school: 30, police: 16, fire: 24, library: 20, training: 20, pethotel: 18, chapel: 20, shelter: 26, zoo: 32 }[k] || 20;
    if (k !== 'zoo') signBoard(c, k === 'photo' ? bx + .9 : bx + bw / 2, k === 'shelter' ? y + 2.15 : by + bd, sgz, d.sign || d.ic, nm);
  }

  // ================= GRAND SAFARI ZOO: PNG BACKGROUND & 5-MOTION PNG ANIMALS =================
  const zooUrl = (typeof assetUrl === 'function') ? assetUrl('spr/zoo/zoo.png') : 'spr/zoo/zoo.png';
  const ZOO_IMG = (typeof ASSET_CACHE !== 'undefined') ? ASSET_CACHE.load(zooUrl) : ((typeof Image !== 'undefined') ? new Image() : null);
  if (ZOO_IMG && !ZOO_IMG.src) {
    ZOO_IMG.crossOrigin = 'anonymous';
    ZOO_IMG.src = zooUrl;
  }

  const ZOO_ANIMAL_IMGS = {};
  if (typeof Image !== 'undefined') {
    const animalList = ['bear', 'cro', 'girin', 'hak', 'hama', 'horse', 'koggiri', 'nuguri', 'panda', 'penguin', 'tiger'];
    for (const an of animalList) {
      ZOO_ANIMAL_IMGS[an] = {};
      for (let f = 1; f <= 5; f++) {
        const u = (typeof assetUrl === 'function') ? assetUrl('spr/zoo/' + an + '_' + f + '.png') : ('spr/zoo/' + an + '_' + f + '.png');
        const im = (typeof ASSET_CACHE !== 'undefined') ? ASSET_CACHE.load(u) : new Image();
        if (!im.src) {
          im.crossOrigin = 'anonymous';
          im.src = u;
        }
        ZOO_ANIMAL_IMGS[an][f] = im;
      }
    }
  }

  const SP_MAP = {
    girin: 'girin', giraffe: 'girin',
    horse: 'horse', zebra: 'horse',
    koggiri: 'koggiri', elephant: 'koggiri', rhino: 'koggiri',
    panda: 'panda',
    nuguri: 'nuguri', redpanda: 'nuguri',
    tiger: 'tiger', whitetiger: 'tiger',
    bear: 'bear',
    hama: 'hama', hippo: 'hama',
    cro: 'cro', croc: 'cro',
    hak: 'hak', flamingo: 'hak',
    penguin: 'penguin', seal: 'penguin'
  };

  const SP_NAME_KR = {
    girin: '기린',
    horse: '얼룩말',
    koggiri: '코끼리',
    panda: '판다',
    nuguri: '레서판다',
    tiger: '호랑이',
    bear: '갈색곰',
    hama: '하마',
    cro: '악어',
    hak: '학',
    penguin: '펭귄'
  };

  const ZOO_BADGE_MAP = {
    polar: '남극 빙하 펭귄 마을',
    lagoon: '하마와 코끼리 라군',
    elephant: '사바나 코끼리와 얼룩말 초원',
    bear: '갈색곰과 홍학 바위언덕',
    savanna: '기린 사파리 초원',
    panda: '판다와 얼룩말 대나무 숲',
    nuguri: '너구리 바위 폭포',
    tiger: '사자와 악어 습지',
    horse: '사파리 대초원',
    croc_lagoon: '열대 악어 습지',
    top1: '하마와 코끼리 라군',
    top2: '갈색곰과 홍학 호수',
    top3: '사자와 악어 바위동굴',
    bot1: '남극 빙하 펭귄 마을',
    bot2: '너구리 숲과 바위',
    bot3: '기린 사파리 정자',
    bot4: '얼룩말과 판다 대나무 숲'
  };

  function collectZoo(list, c, o, T, addHit) {
    const x = o.x, y = o.y, w = 26, dd = 22, ZT = T || 0;
    const recentFeed = S && S.zoo && S.zoo.lastFed && (Date.now() - S.zoo.lastFed < 16000);
    const zooReady = ZOO_IMG && ZOO_IMG.complete && ZOO_IMG.naturalWidth > 0;

    // 1. BASE GROUND LAYER: Lawn & PNG zoo layout (strictly lowest depth x + y - 10)
    list.push({
      depth: x + y - 10,
      fn: () => {
        if (zooReady) {
          // v2026-10-09: "두번째 zoo.png가 이상하게 나와" -- 예전 그림(1536x1024)에 맞춰 크기를
          // 1536x1024로 강제로 늘려 그리고 있었는데, 새로 그린 zoo.png는 실제 크기가 다름(예:
          // 1774x887)이라 비율이 안 맞게 눌리거나 늘어나 보였던 것. 이제 그림을 늘리지 않고 원본
          // 픽셀 크기 그대로(naturalWidth/naturalHeight) 그리고, 타일 기준점(nx,ny)에 맞춘 위치도
          // 예전과 같은 비율로 맞춰서(가로 45.83%, 세로 7.23% 지점) 자동으로 따라가게 함 -- 그림
          // 파일을 나중에 또 바꿔도 각도/크기를 손대지 않고 그대로 들어감.
          // v2026-10-10: 타일 정렬 보정 -- 사용자가 새로 그린 zoo.png가 부지 타일 크기와
          // 안 맞아서(울타리가 도로를 가리거나 틈이 생김) 다른 배경(park/lake/ranch)과 같은
          // content-bbox 비례 공식으로 교체. 나무/숲처럼 삐죽 튀어나온 장식은 타일 경계 밖으로
          // 자연스럽게 걸쳐도 되므로 계산에서 제외하고, 울타리/바닥 외곽선 기준으로 보정함.
          const [nx, ny] = Q(x, y);
          const iw = ZOO_IMG.naturalWidth || 1419, ih = ZOO_IMG.naturalHeight || 710;
          // v2026-10-10 (2nd pass): 단순 좌우대칭(centered bbox) 가정이 비대칭 그림(입구 건물 2개가
          // 한쪽에 몰려있음)에는 안 맞아서, 그림의 북/동/서 3개 꼭짓점(남쪽은 입구 지붕이 삐져나와
          // 측정에서 제외)을 실측 후 최소자승으로 x/y축 각각 독립 배율+오프셋을 구해 타일 꼭짓점에 맞춤.
          // v2026-10-10 (3rd pass): 꼭짓점(tip) 최소자승 방식이 비대칭 그림(입구/지붕이 삐져나옴) 때문에
          // 오차가 커서, 그림 전체 캔버스(1419x710, 거의 정확히 2:1 비율)를 타일의 bounding box에
          // 그대로 맞추는 더 단순하고 안정적인 방식으로 교체함.
          const scale = (w + dd) * 32 / iw; // uniform -- whole-canvas-to-tile-bbox fit, preserves true 2:1 isometric proportions
          const imgW = iw * scale, imgH = ih * scale;
          const imgX = -dd * 32;
          const imgY = 0;
          c.save();
          c.translate(nx, ny);
          c.drawImage(ZOO_IMG, imgX, imgY, imgW, imgH);
          c.restore();
        } else {
          for (let v = 1; v < dd - 1; v += 2) {
            poly(c, [Q(x + .2, y + v), Q(x + w - .2, y + v), Q(x + w - .2, y + v + 1), Q(x + .2, y + v + 1)], 'rgba(255,255,255,.06)');
          }
          poly(c, [Q(x + 10.6, y + .4), Q(x + 15.4, y + .4), Q(x + 15.4, y + dd - .1), Q(x + 10.6, y + dd - .1)], '#e5d8c1', '#a89474', 1.4);
          poly(c, [Q(x + .4, y + 6.8), Q(x + w - .4, y + 6.8), Q(x + w - .4, y + 8.4), Q(x + .4, y + 8.4)], '#e5d8c1', '#a89474', 1.4);
          poly(c, [Q(x + .4, y + 12.6), Q(x + w - .4, y + 12.6), Q(x + w - .4, y + 14.2), Q(x + .4, y + 14.2)], '#e5d8c1', '#a89474', 1.4);
          poly(c, [Q(x + 6.5, y + dd - 3.2), Q(x + 19.5, y + dd - 3.2), Q(x + 19.5, y + dd - .08), Q(x + 6.5, y + dd - .08)], '#dbccb2', '#9c8665', 1.4);
          for (let vp = 1.2; vp < dd - 3.2; vp += 1.8) {
            poly(c, [Q(x + 11.2, y + vp), Q(x + 14.8, y + vp), Q(x + 14.8, y + vp + 1.1), Q(x + 11.2, y + vp + 1.1)], '#efe5d4', 'rgba(130,105,75,.38)', .9);
          }
        }
        // v2026-10-09: "동물원 근처에 입구 표시 타일 지워줘" -- 새로 그린 zoo.png에 이미 자체
        // 입구/출구 장식이 들어가 있어서, 예전 그림에 맞춰 덧그리던 체크무늬 광장 타일과 화단
        // 장식(입구 표시 타일)은 이제 중복이라 제거함.
      }
    });

    // Helper: Draw Enclosure Badge Signpost
    const drawBadge = (sx, sy, badgeIc, badgeKey, mainSp) => {
      const rawTxt = t('zooBadge_' + badgeKey);
      const badgeTxt = (rawTxt && rawTxt !== ('zooBadge_' + badgeKey) && !rawTxt.startsWith('zooBadge_')) ? rawTxt : (ZOO_BADGE_MAP[badgeKey] || '사파리 구역');
      const sq = Q(sx, sy, 32);
      c.font = 'bold 9px sans-serif';
      const tw = Math.max(46, c.measureText(badgeTxt).width + 24);
      ART.rrect(c, sq[0] - tw / 2, sq[1] - 9, tw, 17, 5);
      c.fillStyle = '#fffdf2'; c.fill(); c.strokeStyle = '#5c3d24'; c.lineWidth = 1.4; c.stroke();
      c.textAlign = 'center'; c.fillStyle = '#3d2714'; c.fillText(badgeIc + ' ' + badgeTxt, sq[0], sq[1] + 3); c.textAlign = 'start';

      if (addHit && mainSp) {
        addHit({
          kind: 'zoo_animal',
          sp: mainSp,
          name: badgeTxt,
          desc: badgeTxt + '의 사랑스러운 동물 가족들을 관찰하고 먹이를 줄 수 있어요.',
          habitat: badgeTxt,
          x0: sq[0] - tw / 2 - 4,
          x1: sq[0] + tw / 2 + 4,
          y0: sq[1] - 14,
          y1: sq[1] + 16
        });
      }
      return badgeTxt;
    };

    // Helper: Draw Zoo Animal with 5-motion PNG Sprites & Baby Animal support
    const drawZooAnimal = (sp, ax, ay, az, T0, seed, extra, habitatName) => {
      const spriteKey = SP_MAP[sp] || sp;
      const isBaby = !!(extra && extra.baby);
      const cycle = (T0 * 0.45 + seed * 2.3) % 16;
      let act = 'walk';
      let isMoving = true;
      let mood = 'calm';
      let emote = null;
      let frame = 1;

      if (recentFeed) {
        act = 'eat'; isMoving = false; mood = 'happy'; frame = 2; emote = isBaby ? '🍼' : ['🍖', '🌿', '🍎', '🐟', '🍪'][seed % 5];
      } else if (cycle < 6.0) {
        act = 'walk'; isMoving = true; mood = 'calm';
        frame = (Math.floor(ZT * 4.2 + seed * 1.5) % 2 === 0) ? 4 : 5;
      } else if (cycle < 9.5) {
        act = 'idle'; isMoving = false; mood = Math.sin(T0 + seed) > 0 ? 'happy' : 'calm';
        frame = 1;
        if (Math.sin(T0 * 0.8 + seed * 3) > 0.82) emote = isBaby ? '🍼' : ['✨', '🎵', '👀', '🐾'][seed % 4];
      } else if (cycle < 12.0) {
        act = 'eat'; isMoving = false; mood = 'happy'; frame = 2; emote = isBaby ? '🍼' : ['🌿', '🍖', '🌾', '🍉', '🥕'][seed % 5];
      } else {
        act = 'sleep'; isMoving = false; mood = 'sleep'; frame = 3; emote = '💤';
      }

      // v2026-10-09: "동물들이 그 구역을 빠져나오지 않도록 해줘" -- 새로 그린 zoo.png는 울타리/연못
      // 등 구역 경계가 기존 그림과 달라졌을 수 있어서, 동물이 돌아다니는 반경을 안전하게 더 줄여서
      // 항상 각자 구역 중심 가까이에서만 움직이게 함.
      // v2026-10-10: 7개 구역별 동물 배치 재조정 & 울타리 탈출 방지 strict bounding clamp 적용
      const ZOO_WALK_SHRINK = 0.65;
      const walkR = ((extra && extra.rx) || .38) * ZOO_WALK_SHRINK, walkD = ((extra && extra.ry) || .22) * ZOO_WALK_SHRINK;
      const phase = T0 * (0.8 + (seed % 3) * .2) + seed * 3.1;
      let mx = act === 'walk' ? ax + Math.cos(phase * .6) * walkR : ax + Math.cos(seed * 3) * (walkR * 0.4);
      let my = act === 'walk' ? ay + Math.sin(phase * .6) * walkD : ay + Math.sin(seed * 3) * (walkD * 0.4);
      if (extra && extra.minX != null) mx = Math.max(extra.minX, Math.min(extra.maxX, mx));
      if (extra && extra.minY != null) my = Math.max(extra.minY, Math.min(extra.maxY, my));
      const dx = -Math.sin(phase * .6) * walkR;
      const dir = dx >= 0 ? 1 : -1;
      const sc = (extra && extra.sc) || (isBaby ? 0.09 : 0.16);
      const hop = (isBaby && isMoving) ? Math.abs(Math.sin(T0 * 12 + seed)) * 2.8 : 0;
      const q = Q(mx, my, az || 6.4);
      q[1] -= hop;

      // Subtle shadow
      ART.ell(c, q[0], q[1] + hop + 1, (isBaby ? 10 : 18), (isBaby ? 5 : 8), 'rgba(0,0,0,.18)');

      const img = ZOO_ANIMAL_IMGS[spriteKey] && ZOO_ANIMAL_IMGS[spriteKey][frame];
      const imgReady = img && img.complete && img.naturalWidth > 0;

      if (imgReady) {
        c.save();
        c.translate(q[0], q[1]);
        c.scale(dir * sc, sc);
        c.drawImage(img, -256, -438, 512, 512);
        c.restore();
      } else {
        c.save();
        c.translate(q[0], q[1]);
        c.scale((isBaby ? 0.6 : 1.0) * dir, (isBaby ? 0.6 : 1.0));
        ART.zooPet(c, spriteKey, {
          t: T0 + seed * .7,
          mood: (act === 'sleep' ? 'sleep' : 'happy'),
          seed,
          moving: isMoving,
          dir: 1,
          act
        });
        c.restore();
      }

      // Emote speech bubble
      if (emote) {
        const ey = q[1] - 440 * sc - 6;
        c.font = (act === 'sleep' ? '12px' : '14px') + ' sans-serif';
        c.textAlign = 'center';
        const bob = act === 'eat' ? Math.sin(T0 * 6) * 1.5 : act === 'sleep' ? -Math.abs(Math.sin(T0 * 2)) * 2 : 0;
        c.fillText(emote, q[0], ey + bob);
        c.textAlign = 'start';
      }

      // Click hitbox for animal info & feeding
      if (addHit) {
        const baseNm = t('zooPetName_' + spriteKey) || (SP_NAME_KR[spriteKey] || spriteKey);
        const petNm = isBaby ? ('🍼 아기 ' + baseNm) : baseNm;
        const petDesc = isBaby
          ? (baseNm + '의 아주 사랑스러운 아기예요! 엄마 아빠 곁에서 신나게 재롱을 부리고 있어요. 달콤한 간식과 우유를 주면 기뻐서 펄쩍 뛰며 행복해해요! ✨')
          : (t('zooPetDesc_' + sp) || (baseNm + '의 건강하고 활기찬 생태를 관찰할 수 있어요.'));
        addHit({
          kind: 'zoo_animal',
          sp: spriteKey,
          isBaby,
          name: petNm,
          desc: petDesc,
          habitat: habitatName || '사파리 동물원',
          x0: q[0] - 24,
          x1: q[0] + 24,
          y0: q[1] - 480 * sc - 10,
          y1: q[1] + 8
        });
      }
    };

    // 2. HABITAT 위1 (상단 1구역): 하마 그리고 코끼리 (상단 좌측 라군 & 백사장)
    const s1x = x + 3.8, s1y = y + 15.5;
    list.push({
      depth: s1x + s1y + 4.5,
      fn: () => {
        const hName = drawBadge(x + 4.2, y + 14.6, '🦛', 'top1', 'hama');
        // 하마 가족: 우측 호수 물속 및 얕은 여울 (울타리 안쪽 안전 반경)
        const bHippo = { minX: x + 3.4, maxX: x + 5.8, minY: y + 14.8, maxY: y + 17.5 };
        drawZooAnimal('hama', x + 4.2, y + 15.8, 6.5, ZT, 10, { rx: .28, ry: .16, sc: .18, ...bHippo }, hName);
        drawZooAnimal('hama', x + 5.2, y + 16.5, 6.5, ZT + 2.1, 11, { rx: .28, ry: .16, sc: .18, ...bHippo }, hName);
        drawZooAnimal('hama', x + 3.6, y + 16.8, 6.5, ZT + 1.2, 12, { rx: .20, ry: .12, sc: .10, baby: true, ...bHippo }, hName);
        drawZooAnimal('hama', x + 4.8, y + 15.2, 6.5, ZT + 2.8, 13, { rx: .20, ry: .12, sc: .10, baby: true, ...bHippo }, hName);
        // 코끼리 가족: 라군 뒤편 모래사장 및 둔덕 (울타리 안쪽)
        const bEle = { minX: x + 1.6, maxX: x + 3.5, minY: y + 12.6, maxY: y + 14.8 };
        drawZooAnimal('koggiri', x + 2.2, y + 13.5, 6.4, ZT, 20, { rx: .28, ry: .16, sc: .18, ...bEle }, hName);
        drawZooAnimal('koggiri', x + 3.2, y + 14.2, 6.4, ZT + 1.9, 21, { rx: .28, ry: .16, sc: .18, ...bEle }, hName);
        drawZooAnimal('koggiri', x + 1.8, y + 14.2, 6.4, ZT + 2.6, 22, { rx: .20, ry: .12, sc: .10, baby: true, ...bEle }, hName);
        drawZooAnimal('koggiri', x + 2.7, y + 13.0, 6.4, ZT + 0.7, 23, { rx: .20, ry: .12, sc: .10, baby: true, ...bEle }, hName);
      }
    });

    // 3. HABITAT 위2 (상단 2구역): 갈색곰 그리고 홍학 (상단 중앙 모래사장과 갈색건물, 호수)
    const s2x = x + 8.0, s2y = y + 6.0;
    list.push({
      depth: s2x + s2y + 4.5,
      fn: () => {
        const hName = drawBadge(x + 8.0, y + 6.8, '🐻', 'top2', 'bear');
        // 갈색곰 가족: 모래사장과 갈색건물 (울타리 안쪽)
        const bBear = { minX: x + 5.8, maxX: x + 7.8, minY: y + 4.8, maxY: y + 6.4 };
        drawZooAnimal('bear', x + 6.6, y + 5.4, 6.4, ZT, 30, { rx: .28, ry: .16, sc: .18, ...bBear }, hName);
        drawZooAnimal('bear', x + 7.4, y + 5.8, 6.4, ZT + 1.8, 31, { rx: .28, ry: .16, sc: .18, ...bBear }, hName);
        drawZooAnimal('bear', x + 6.2, y + 5.9, 6.4, ZT + 2.5, 32, { rx: .20, ry: .12, sc: .10, baby: true, ...bBear }, hName);
        drawZooAnimal('bear', x + 7.0, y + 5.0, 6.4, ZT + 0.9, 33, { rx: .20, ry: .12, sc: .10, baby: true, ...bBear }, hName);
        // 홍학 가족: 호수 (울타리 안쪽 안전 반경)
        const bHak = { minX: x + 8.0, maxX: x + 10.2, minY: y + 5.0, maxY: y + 6.6 };
        drawZooAnimal('hak', x + 8.6, y + 5.6, 6.5, ZT, 94, { rx: .28, ry: .16, sc: .16, ...bHak }, hName);
        drawZooAnimal('hak', x + 9.6, y + 6.2, 6.5, ZT + 1.8, 95, { rx: .28, ry: .16, sc: .16, ...bHak }, hName);
        drawZooAnimal('hak', x + 8.2, y + 6.2, 6.5, ZT + 1.2, 96, { rx: .20, ry: .12, sc: .10, baby: true, ...bHak }, hName);
        drawZooAnimal('hak', x + 9.2, y + 5.2, 6.5, ZT + 2.5, 97, { rx: .20, ry: .12, sc: .10, baby: true, ...bHak }, hName);
      }
    });

    // 4. HABITAT 위3 (상단 3구역): 사자, 악어 (상단 우측 바위 동굴 & 백사장)
    const s3x = x + 14.5, s3y = y + 4.5;
    list.push({
      depth: s3x + s3y + 4.5,
      fn: () => {
        const hName = drawBadge(x + 14.8, y + 5.6, '🦁', 'top3', 'tiger');
        // 악어 가족: 파란 연못 물속 안쪽 (울타리 안쪽 안전 반경)
        const bCro = { minX: x + 12.8, maxX: x + 14.6, minY: y + 3.0, maxY: y + 4.6 };
        drawZooAnimal('cro', x + 13.4, y + 3.6, 6.4, ZT, 90, { rx: .24, ry: .14, sc: .17, ...bCro }, hName);
        drawZooAnimal('cro', x + 14.2, y + 4.2, 6.4, ZT + 1.9, 91, { rx: .24, ry: .14, sc: .17, ...bCro }, hName);
        drawZooAnimal('cro', x + 13.0, y + 4.0, 6.4, ZT + 1.5, 92, { rx: .18, ry: .10, sc: .10, baby: true, ...bCro }, hName);
        drawZooAnimal('cro', x + 13.8, y + 3.2, 6.4, ZT + 2.4, 93, { rx: .18, ry: .10, sc: .10, baby: true, ...bCro }, hName);
        // 사자 가족: 바위 동굴 앞쪽 안전 방사장 (울타리 안쪽 안전 반경)
        const bLion = { minX: x + 14.8, maxX: x + 16.6, minY: y + 3.6, maxY: y + 5.3 };
        drawZooAnimal('tiger', x + 15.2, y + 4.2, 6.4, ZT, 70, { rx: .28, ry: .16, sc: .18, ...bLion }, hName);
        drawZooAnimal('tiger', x + 16.2, y + 4.8, 6.4, ZT + 1.6, 71, { rx: .28, ry: .16, sc: .18, ...bLion }, hName);
        drawZooAnimal('tiger', x + 15.6, y + 5.0, 6.4, ZT + 2.8, 72, { rx: .20, ry: .12, sc: .10, baby: true, ...bLion }, hName);
        drawZooAnimal('tiger', x + 16.0, y + 3.8, 6.4, ZT + 0.9, 73, { rx: .20, ry: .12, sc: .10, baby: true, ...bLion }, hName);
      }
    });

    // 5. HABITAT 아래1 (하단 1구역): 펭귄 (입구 바로 우측 빙하 수영장)
    const s4x = x + 17.0, s4y = y + 17.5;
    list.push({
      depth: s4x + s4y + 4.5,
      fn: () => {
        const hName = drawBadge(x + 17.0, y + 18.8, '🐧', 'bot1', 'penguin');
        // 펭귄 가족: 빙하 얼음섬 및 유리 울타리 수영장 내부
        const bPeng = { minX: x + 15.8, maxX: x + 17.8, minY: y + 16.4, maxY: y + 18.4 };
        drawZooAnimal('penguin', x + 16.5, y + 17.2, 6.5, ZT, 1, { rx: .28, ry: .16, sc: .16, ...bPeng }, hName);
        drawZooAnimal('penguin', x + 17.4, y + 18.0, 6.5, ZT + 1.7, 2, { rx: .28, ry: .16, sc: .16, ...bPeng }, hName);
        drawZooAnimal('penguin', x + 16.0, y + 17.8, 6.5, ZT + 2.4, 3, { rx: .20, ry: .12, sc: .09, baby: true, ...bPeng }, hName);
        drawZooAnimal('penguin', x + 17.2, y + 16.8, 6.5, ZT + 0.8, 4, { rx: .20, ry: .12, sc: .09, baby: true, ...bPeng }, hName);
      }
    });

    // 6. HABITAT 아래2 (하단 2구역): 너구리 (하단 2번 나무와 바위 1번(얼음)과 3번(동굴) 사이)
    const s5x = x + 19.2, s5y = y + 13.0;
    list.push({
      depth: s5x + s5y + 4.5,
      fn: () => {
        const hName = drawBadge(x + 19.5, y + 14.4, '🦝', 'bot2', 'nuguri');
        // 너구리(레서판다) 가족: 나무와 바위 사이 방사장 내부
        const bNug = { minX: x + 18.2, maxX: x + 20.2, minY: y + 12.0, maxY: y + 14.0 };
        drawZooAnimal('nuguri', x + 18.8, y + 12.6, 6.4, ZT, 60, { rx: .28, ry: .16, sc: .15, ...bNug }, hName);
        drawZooAnimal('nuguri', x + 19.8, y + 13.5, 6.4, ZT + 2.3, 61, { rx: .28, ry: .16, sc: .15, ...bNug }, hName);
        drawZooAnimal('nuguri', x + 18.5, y + 13.6, 6.4, ZT + 1.5, 62, { rx: .20, ry: .12, sc: .09, baby: true, ...bNug }, hName);
        drawZooAnimal('nuguri', x + 19.4, y + 12.2, 6.4, ZT + 0.8, 63, { rx: .20, ry: .12, sc: .09, baby: true, ...bNug }, hName);
      }
    });

    // 7. HABITAT 아래3 (하단 3구역): 기린 (하단 3번 바위 폭포 & 연못)
    const s6x = x + 19.5, s6y = y + 7.8;
    list.push({
      depth: s6x + s6y + 4.5,
      fn: () => {
        const hName = drawBadge(x + 19.8, y + 9.2, '🦒', 'bot3', 'girin');
        // 기린 가족: 초록 지붕 정자 쉼터 및 사바나 울타리 내부
        const bGir = { minX: x + 18.5, maxX: x + 20.6, minY: y + 6.6, maxY: y + 8.8 };
        drawZooAnimal('girin', x + 19.2, y + 7.4, 6.4, ZT, 40, { rx: .28, ry: .16, sc: .18, ...bGir }, hName);
        drawZooAnimal('girin', x + 20.2, y + 8.2, 6.4, ZT + 2.1, 41, { rx: .28, ry: .16, sc: .19, ...bGir }, hName);
        drawZooAnimal('girin', x + 18.8, y + 8.2, 6.4, ZT + 1.4, 42, { rx: .20, ry: .12, sc: .10, baby: true, ...bGir }, hName);
        drawZooAnimal('girin', x + 19.8, y + 7.0, 6.4, ZT + 2.9, 43, { rx: .20, ry: .12, sc: .10, baby: true, ...bGir }, hName);
      }
    });

    // 8. HABITAT 아래4 (하단 4구역): 말, 팬더 (하단 맨 우측 대나무 숲 & 평상)
    const s7x = x + 22.8, s7y = y + 4.0;
    list.push({
      depth: s7x + s7y + 4.5,
      fn: () => {
        const hName = drawBadge(x + 23.2, y + 5.8, '🐼', 'bot4', 'panda');
        // 얼룩말 가족: 나무 지붕 앞쪽 방사장 내부
        const bHorse = { minX: x + 21.1, maxX: x + 23.0, minY: y + 2.5, maxY: y + 4.1 };
        drawZooAnimal('horse', x + 21.8, y + 3.2, 6.4, ZT, 80, { rx: .26, ry: .15, sc: .17, ...bHorse }, hName);
        drawZooAnimal('horse', x + 22.6, y + 3.8, 6.4, ZT + 1.8, 81, { rx: .26, ry: .15, sc: .17, ...bHorse }, hName);
        drawZooAnimal('horse', x + 21.4, y + 3.6, 6.4, ZT + 2.5, 82, { rx: .18, ry: .11, sc: .10, baby: true, ...bHorse }, hName);
        drawZooAnimal('horse', x + 22.2, y + 2.8, 6.4, ZT + 0.7, 83, { rx: .18, ry: .11, sc: .10, baby: true, ...bHorse }, hName);
        // 판다 가족: 대나무쪽 평상 숲 쉼터 내부
        const bPanda = { minX: x + 22.7, maxX: x + 24.6, minY: y + 3.7, maxY: y + 5.4 };
        drawZooAnimal('panda', x + 23.4, y + 4.4, 6.4, ZT, 50, { rx: .26, ry: .15, sc: .17, ...bPanda }, hName);
        drawZooAnimal('panda', x + 24.2, y + 5.0, 6.4, ZT + 1.8, 51, { rx: .26, ry: .15, sc: .17, ...bPanda }, hName);
        drawZooAnimal('panda', x + 23.0, y + 4.9, 6.4, ZT + 2.7, 52, { rx: .18, ry: .11, sc: .09, baby: true, ...bPanda }, hName);
        drawZooAnimal('panda', x + 23.9, y + 4.0, 6.4, ZT + 0.6, 53, { rx: .18, ry: .11, sc: .09, baby: true, ...bPanda }, hName);
      }
    });

    // 12. GRAND SAFARI ENTRANCE BILLBOARD & HITBOX
    const gx = x + 24.5, gy = y + 23.5, gw = 4.5;
    list.push({
      depth: gx + gw / 2 + gy + 1.0,
      fn: () => {
        if (!zooReady) {
          // Fallback overhead billboard if image not ready
          blk(c, gx + 1.5, gy + .3, gw - 3.0, 1.2, 48, 16, '#8c5a32');
          const pTL = Q(gx + 1.3, gy + 2.15, 86), pTR = Q(gx + gw - 1.3, gy + 2.15, 86);
          const pBR = Q(gx + gw - 1.3, gy + 2.15, 62), pBL = Q(gx + 1.3, gy + 2.15, 62);
          poly(c, [pTL, pTR, pBR, pBL], '#21562b', '#133519', 2.8);
          const dx2 = pTR[0] - pTL[0], dy2 = pTR[1] - pTL[1], L = Math.hypot(dx2, dy2);
          const midX = (pTL[0] + pBR[0]) / 2, midY = (pTL[1] + pBR[1]) / 2;
          c.save();
          c.transform(dx2 / L, dy2 / L, 0, 1, midX, midY);
          c.font = 'bold 12px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#1e5628';
          c.fillText('🦁 GRAND SAFARI ZOO 🦒', 0, 0);
          c.restore();
        }
        if (addHit) {
          const eq = Q(x + 25.5, y + 24.5, 30);
          addHit({
            kind: 'zoo_entrance',
            name: '🦁 GRAND SAFARI ZOO',
            desc: '동물원 현황 및 티켓 수금 패널을 엽니다.',
            x0: eq[0] - 60,
            x1: eq[0] + 60,
            y0: eq[1] - 40,
            y1: eq[1] + 20
          });
        }
      }
    });
  }
  // open lots: town gate, dog park, weekend market, clock tower, lookout tower
  function openLot(c, o, T, lit, nm) {
    const d = D[o.k], x = o.x, y = o.y, w = d.w, dd = d.d, k = o.k;
    if (k === 'gate') {
      for (const px of [x + .3, x + w - .3]) { const a = Q(px, y + .5), b2 = Q(px, y + .5, 40); c.strokeStyle = '#8a5a33'; c.lineWidth = 4; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b2[0], b2[1]); c.stroke(); }
      const a = Q(x + .3, y + .5, 40), b2 = Q(x + w - .3, y + .5, 40); c.strokeStyle = '#b98757'; c.lineWidth = 3; c.beginPath(); c.moveTo(a[0], a[1]); c.quadraticCurveTo((a[0] + b2[0]) / 2, (a[1] + b2[1]) / 2 - 14, b2[0], b2[1]); c.stroke();
      const m = Q(x + w / 2, y + .5, 36); ART.rrect(c, m[0] - 34, m[1] - 9, 68, 16, 6); c.fillStyle = '#fff3d6'; c.fill(); c.strokeStyle = '#8a5a33'; c.lineWidth = 1.5; c.stroke();
      c.font = 'bold 8px sans-serif'; c.textAlign = 'center'; c.fillStyle = '#c0504e'; c.fillText('🐾 PET TOWN 🐾', m[0], m[1] + 2); c.textAlign = 'start'; flowers(c, x + .1, y + .8, 4, 1); flowers(c, x + w - 1, y + .8, 4, 3); return;
    }
    if (k === 'dogpark') {
      poly(c, [Q(x + .3, y + .3), Q(x + w - .3, y + .3), Q(x + w - .3, y + dd - .3), Q(x + .3, y + dd - .3)], '#8fd06a');
      fence(c, x + .3, y + .3, x + w - .3, y + .3); fence(c, x + w - .3, y + .3, x + w - .3, y + dd - .3); fence(c, x + .3, y + .3, x + .3, y + dd - .3); fence(c, x + .3, y + dd - .3, x + w / 2 - .6, y + dd - .3); fence(c, x + w / 2 + .6, y + dd - .3, x + w - .3, y + dd - .3);
      blk(c, x + .7, y + .7, .8, .7, 0, 10, '#c8864a'); gable(c, x + .7, y + .7, .8, .7, 10, 7, '#d9534f', '#c8864a');
      for (let i = 0; i < 3; i++) { const a = Q(x + 2.5 + i * .6, y + 2, 7), b2 = Q(x + 2.9 + i * .6, y + 2, 7); c.strokeStyle = ['#ffd166', '#4a9be0', '#e8534f'][i]; c.lineWidth = 2; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b2[0], b2[1]); c.stroke(); }
      for (let i = 0; i < 2; i++) { const a = T * .6 + i * 3.1, px = x + w / 2 + Math.cos(a) * 1.4, py = y + dd / 2 + .4 + Math.sin(a) * 1.1, q = Q(px, py), dir = -Math.sin(a) - Math.cos(a) > 0 ? 1 : -1; c.save(); c.translate(q[0], q[1] - Math.abs(Math.sin(T * 9 + i)) * 2); c.scale(.5 * dir, .5); ART.pet(c, ['corgi', 'shiba'][i], { t: T, mood: 'happy', seed: 3 + i, age: 1, moving: true, dir }); c.restore(); }
      return;
    }
    if (k === 'market') {
      for (let i = 0; i < 3; i++) { const sx = x + .25 + i * 1.25, sy = y + .5, col = ['#e24a3b', '#4a9be0', '#6ab04c'][i];
        blk(c, sx, sy + .9, 1, .5, 0, 7, '#b07a44'); const q = Q(sx + .5, sy + 1.15, 8); c.font = '9px sans-serif'; c.textAlign = 'center'; c.fillText(['🍎🥕', '🧸🎀', '🌷🪴'][i], q[0], q[1]); c.textAlign = 'start';
        for (const px of [sx + .05, sx + .95]) { const a = Q(px, sy + .5), b2 = Q(px, sy + .5, 26); c.strokeStyle = '#8a5a33'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b2[0], b2[1]); c.stroke(); }
        awning(c, sx, sx + 1, sy + .4, 28, col, '#ffffff'); }
      signBoard(c, x + w / 2, y + dd - .2, 4, '🛒', nm); return;
    }
    if (k === 'clocktower') {
      poly(c, [Q(x + .2, y + .2), Q(x + w - .2, y + .2), Q(x + w - .2, y + dd - .2), Q(x + .2, y + dd - .2)], '#dcc79a', 'rgba(120,95,60,.4)');
      blk(c, x + .9, y + .9, 1.2, 1.2, 0, 70, '#e8dcc8'); blk(c, x + .8, y + .8, 1.4, 1.4, 70, 4, '#b85a4a');
      const tp = Q(x + 1.5, y + 1.5, 74); c.beginPath(); c.moveTo(tp[0] - 16, tp[1] + 4); c.lineTo(tp[0], tp[1] - 26); c.lineTo(tp[0] + 16, tp[1] + 4); c.closePath(); c.fillStyle = '#b85a4a'; c.fill(); c.strokeStyle = ART.OUT; c.stroke();
      const cq = Q(x + 1.5, y + 2.1, 56), m = S.clock ? S.clock.m : 480; ART.ell(c, cq[0], cq[1], 9, 9, '#ffffff', ART.OUT, 1.2);
      for (const [len, ang] of [[5, ((m / 60) % 12) / 12], [7.5, (m % 60) / 60]]) { const a = ang * 6.283 - 1.571; c.strokeStyle = '#333'; c.lineWidth = len > 6 ? 1 : 1.8; c.beginPath(); c.moveTo(cq[0], cq[1]); c.lineTo(cq[0] + Math.cos(a) * len, cq[1] + Math.sin(a) * len); c.stroke(); }
      flowers(c, x + .2, y + dd - .5, 8, 1); return;
    }
    if (k === 'lookout') {
      for (const [px, py] of [[x + .2, y + .2], [x + w - .2, y + .2], [x + .2, y + dd - .2], [x + w - .2, y + dd - .2]]) { const a = Q(px, py), b2 = Q(x + w / 2 + (px - x - w / 2) * .45, y + dd / 2 + (py - y - dd / 2) * .45, 80); c.strokeStyle = '#8a5a33'; c.lineWidth = 2.4; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b2[0], b2[1]); c.stroke(); }
      for (const z of [26, 52]) { const r = 1 - z / 80 * .55; poly(c, [Q(x + w / 2 - r, y + dd / 2 - r, z), Q(x + w / 2 + r, y + dd / 2 - r, z), Q(x + w / 2 + r, y + dd / 2 + r, z), Q(x + w / 2 - r, y + dd / 2 + r, z)], null, '#8a5a33', 1.4); }
      blk(c, x + .35, y + .35, w - .7, dd - .7, 80, 3, '#c8864a'); fence(c, x + .35, y + dd - .35, x + w - .35, y + dd - .35);
      const q = Q(x + w / 2, y + dd / 2, 94); c.font = '14px sans-serif'; c.textAlign = 'center'; c.fillText('🔭', q[0], q[1]); c.textAlign = 'start';
    }
  }
  const HOUSE_TOP = { cottage: 70, tower: 118, family: 88, yard: 72, barn: 92, twostory: 112, row: 88, villa: 132 }; // roof top of the bigger houses (px) -> tags float just above
  // v2026-10-08: 집 그림이 이제 티어(1~12)에 따라 높이가 꽤 다르게 그려지므로, 점유 인원표/뱃지가 집
  // 꼭대기보다 낮게/높게 어긋나지 않도록 티어에 비례한 높이값을 씀 (HOUSE_TOP 고정값 대신)
  const houseTagZ = o => 146 + (tierOf(o) - 1) * 8; // 확대된 3x3 집 그림 세로 높이에 맞춰 지붕 위로 알맞게 띄움
  function occTag(c, o) {
    if (!D[o.k] || D[o.k].cat !== 'house') return;
    const q = Q(o.x + 2.5, o.y + 2.5, houseTagZ(o)), txt = (o.n || 0) + '/' + capOf(o), full = (o.n || 0) >= capOf(o);
    c.font = 'bold 9px sans-serif'; const tw = c.measureText(txt).width + 22;
    ART.rrect(c, q[0] - tw / 2, q[1] - 8, tw, 14, 7); c.fillStyle = full ? '#e8f7de' : 'rgba(255,255,255,.92)'; c.fill(); c.strokeStyle = full ? '#5cae3c' : '#b8a07a'; c.lineWidth = 1; c.stroke();
    c.textAlign = 'center'; c.fillStyle = '#5a3a2a'; c.fillText('👤' + txt, q[0], q[1] + 2.5); c.textAlign = 'start';
  }
  function lvBadge(c, o) {
    const L = lvOf(o); if (L < 2 || !D[o.k] || (D[o.k].cat !== 'civic' && D[o.k].cat !== 'house')) return;
    const isHouse = D[o.k].cat === 'house';
    const f = fpOf(o.k, o.r), open = D[o.k].open, z = isHouse ? houseTagZ(o) + 18 : open ? 34 : (D[o.k].h || 24) + 16 + D[o.k].w * 2.4 + (o.k === 'chapel' ? 40 : 0), q = Q(o.x + f.w / 2, o.y + f.d / 2, z);
    // 집은 티어가 최대 12까지라 별을 그대로 찍으면 지저분해지므로 "🏠 티어N" 식으로 간단히 표시
    const label = isHouse ? ('🏠 ' + t('tTierN', { n: L })) : ('⭐'.repeat(L - 1) + ' Lv' + L);
    c.font = 'bold 8px sans-serif'; const bw = c.measureText(label).width + 12;
    const maxed = isHouse ? L >= HOUSE_TIER_MAX : L === 3;
    ART.rrect(c, q[0] - bw / 2, q[1] - 9, bw, 14, 7); c.fillStyle = maxed ? '#fff0b8' : '#ffffff'; c.fill(); c.strokeStyle = maxed ? '#e0a020' : '#c9962a'; c.lineWidth = 1.2; c.stroke();
    c.textAlign = 'center'; c.fillStyle = '#7a4f2e'; c.fillText(label, q[0], q[1] + 1); c.textAlign = 'start';
    if (isHouse) return; // 집은 바닥 장식(꽃/램프)을 그림 자체가 이미 표현하므로 추가로 안 그림
    frameOn(o, D[o.k].w, D[o.k].d); try { const d = D[o.k]; flowers(c, o.x + .1, o.y + d.d - .45, L === 3 ? 8 : 4, o.x + L); if (L === 3 && d.cat === 'civic' && !d.open) for (const lx of [o.x + .15, o.x + d.w - .15]) { const a = Q(lx, o.y + d.d - .2), b2 = Q(lx, o.y + d.d - .2, 26); c.strokeStyle = '#3a3a44'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b2[0], b2[1]); c.stroke(); ART.ell(c, b2[0], b2[1], 3.5, 4, '#ffe68a', ART.OUT, .8); } } finally { frameOff(); }
  }
  function drawObj(c, o, T, ghost) { const d = D[o.k]; if (!d) return; drawObj_(c, o, T, ghost); if (!ghost) { occTag(c, o); lvBadge(c, o); } }
  function drawObj_(c, o, T, ghost) { const d = D[o.k]; if (!d) return; if (d.cat === 'house') drawHouse(c, { x: o.x, y: o.y, v: KINDS.indexOf(o.k), cw: o.cw || 0, cr: o.cr || 0, r: o.r, o }, T); else if (d.cat === 'tree') drawTree(c, o, T, ghost); else if (d.cat === 'civic') drawCivic(c, o, T); else drawDeco(c, o, T); }
  const depthOf = o => { const f = fpOf(o.k, o.r), d = D[o.k]; if (d && d.cat === 'house') return o.x + o.y + 5.0; if (d && d.cat === 'civic' && !d.open) return o.x + o.y + f.w / 2 + f.d / 2 + .3; return o.x + o.y + f.w + f.d - 1.02; };
  // the ghost while choosing a spot: footprint tiles (green = fine, red = not here) + the building, half see-through
  function drawGhost(c, g, T) {
    const f = fpOf(g.k, g.r), bad = canPlace(S, g.k, g.x, g.y, g.r, g.mv);
    for (let u = 0; u < f.w; u++) for (let v = 0; v < f.d; v++) poly(c, [Q(g.x + u + .05, g.y + v + .05), Q(g.x + u + .95, g.y + v + .05), Q(g.x + u + .95, g.y + v + .95), Q(g.x + u + .05, g.y + v + .95)], bad ? 'rgba(230,70,60,.45)' : 'rgba(80,200,90,.45)', bad ? '#c0302a' : '#2e8a3a', 1.2);
    if (g.k === 'zone') { const L = laneOf({ x: g.x, y: g.y, w: f.w, d: f.d, r: g.r }); poly(c, [Q(L.x, L.y), Q(L.x + L.w, L.y), Q(L.x + L.w, L.y + L.d), Q(L.x, L.y + L.d)], 'rgba(230,218,194,.8)'); }
    if (D[g.k] && (D[g.k].cat === 'big' || D[g.k].cat === 'zone')) { // a big lot: outline + the building's icon and name floating over it
      if (g.k === 'home' && typeof FURN !== 'undefined' && FURN.HOME_IMG && FURN.HOME_IMG.complete && FURN.HOME_IMG.naturalWidth > 0) {
        c.save();
        c.globalAlpha = bad ? 0.35 : 0.65;
        const hq = [ISO.wx(g.x + 5.0, g.y + 3.5), ISO.wy(g.x + 5.0, g.y + 3.5)];
        const dw = 336, dh = dw * (FURN.HOME_IMG.naturalHeight || 1024) / (FURN.HOME_IMG.naturalWidth || 1536);
        c.drawImage(FURN.HOME_IMG, hq[0] - dw / 2, hq[1] - dh * 0.6494, dw, dh);
        c.restore();
      }
      const q = Q(g.x + f.w / 2, g.y + f.d / 2); poly(c, [Q(g.x, g.y), Q(g.x + f.w, g.y), Q(g.x + f.w, g.y + f.d), Q(g.x, g.y + f.d)], null, bad ? '#c0302a' : '#2e8a3a', 4);
      c.font = '64px sans-serif'; c.textAlign = 'center'; c.fillText(D[g.k].ic, q[0], q[1] - 10); c.font = 'bold 26px sans-serif'; c.lineWidth = 6; c.strokeStyle = '#fff'; c.lineJoin = 'round'; c.strokeText(t('tk_' + g.k), q[0], q[1] + 26); c.fillStyle = '#5a3a2a'; c.fillText(t('tk_' + g.k), q[0], q[1] + 26); c.textAlign = 'start';
    } else { c.globalAlpha = .6; drawObj(c, { k: g.k, x: g.x, y: g.y, r: g.r, cw: 1, cr: 0, pd: -99, tier: g.tier || 1 }, T, true); c.globalAlpha = 1; }
    return !bad;
  }
  // ---------------- the pet that follows its owner around the village ----------------
  const follows = () => (S.follow || {});
  function followStep(dt, actors, mkActor, alive, meActor) {
    const map = follows();
    for (const who in map) {
      const pid = map[who], p = S.home && (S.home.pets || []).find(q => q.id === pid); if (!p) continue;
      const owner = who === CFG.id ? meActor : actors.get('u' + who); if (!owner) continue;
      const id = 'fw_' + who; alive.add(id);
      let a = actors.get(id); if (!a) a = mkActor(id, 'fpet', owner.x - .6, owner.y + .4, { pet: p, trail: [] });
      a.pet = p; a.t += dt;
      const tr = a.trail; if (!tr.length || Math.hypot(tr[tr.length - 1].x - owner.x, tr[tr.length - 1].y - owner.y) > .15) tr.push({ x: owner.x, y: owner.y }); while (tr.length > 60) tr.shift();
      const tgt = tr.length > 6 ? tr[tr.length - 6] : { x: owner.x - .5, y: owner.y + .3 }, dx = tgt.x - a.x, dy = tgt.y - a.y, d = Math.hypot(dx, dy);
      if (d > 6) { a.x = tgt.x; a.y = tgt.y; } // owner went through a door / teleported
      else if (d > .35) { const sp = Math.min(d, (owner.speed || 2.4) * 1.15 * dt * (d > 1.2 ? 1.6 : 1)); a.x += dx / d * sp; a.y += dy / d * sp; a.moving = true; if (Math.abs(dx - dy) > .05) a.dir = dx - dy > 0 ? 1 : -1; }
      else a.moving = false;
      a.hidden = !!owner.hidden;
    }
  }
  function drawFollower(c, a, T) {
    const sx = ISO.wx(a.x, a.y), sy = ISO.wy(a.x, a.y), p = a.pet, sz = .6 * (p.grow != null && G.ageOf ? .6 + .4 * G.ageOf(p) : 1);
    ART.ell(c, sx, sy, 10, 4, 'rgba(0,0,0,.14)');
    c.save(); c.translate(sx, sy - (a.moving ? Math.abs(Math.sin(T * 10)) * 1.5 : 0)); c.scale(sz * (a.dir || 1), sz); ART.pet(c, p.sp, { t: T, mood: 'happy', seed: p.coat, age: p.grow != null ? G.ageOf(p) : 1, moving: a.moving, dir: a.dir || 1, wear: p.wear }); c.restore();
    if (!a.moving && Math.sin(T * .7 + (a.pet.coat || 0)) > .97) { c.font = '11px sans-serif'; c.textAlign = 'center'; c.fillText('💕', sx + 6, sy - 30); c.textAlign = 'start'; }
  }
  // ---------------- residential zones: ground (under everything) + entrance sign ----------------
  // any paved tile near the shop's walls? (then world.js repaints the walls over the road)
  let _rn = null, _rnKey = '';
  const roadNearShop = () => { const R = roadSet(S), k = R.size + ':' + (S.town && S.town.rv) + ':' + Wd() + 'x' + Hd(); if (k !== _rnKey) { _rnKey = k; const W = Wd(), H = Hd(); _rn = false; for (const q of R) { const [x, y] = q.split(',').map(Number); if (x >= -12 && x <= W + 2 && y >= -12 && y <= H + 2) { _rn = true; break; } } } return _rn; };
  // Helper to draw a road tile at (x, y) with the chosen road style
  const drawRoadTile = (x, y, style, targetC) => {
    const curC = targetC || (typeof c !== 'undefined' ? c : null);
    if (!curC) return;
    const st = style === 'wood' ? 'block' : style === 'marble' ? 'stone' : style === 'pink' ? 'tile' : (style || 'cobble');
    if (st === 'dirt') {
      poly(curC, [Q(x, y), Q(x + 1, y), Q(x + 1, y + 1), Q(x, y + 1)], '#c28e5c');
      const dots = [[0.2, 0.25], [0.65, 0.3], [0.35, 0.7], [0.75, 0.75], [0.5, 0.5]];
      for (let i = 0; i < dots.length; i++) {
        const [ux, vy] = dots[i];
        const p = Q(x + ux, y + vy);
        const col = ['#a26c3d', '#d49d68', '#8f5c30'][(x + y + i) % 3];
        ART.ell(curC, p[0], p[1], 1.6, 1.1, col);
      }
    } else if (st === 'brick') {
      poly(curC, [Q(x, y), Q(x + 1, y), Q(x + 1, y + 1), Q(x, y + 1)], '#b85842');
      const bricks = [
        [0.04, 0.04, 0.48, 0.30], [0.52, 0.04, 0.96, 0.30],
        [0.04, 0.36, 0.30, 0.64], [0.34, 0.36, 0.74, 0.64], [0.78, 0.36, 0.96, 0.64],
        [0.04, 0.70, 0.48, 0.96], [0.52, 0.70, 0.96, 0.96]
      ];
      for (let i = 0; i < bricks.length; i++) {
        const [u0, v0, u1, v1] = bricks[i];
        const col = ['#cf6a4e', '#c2593f', '#d9785b', '#b54e35'][(x + y + i) % 4];
        poly(curC, [Q(x + u0, y + v0), Q(x + u1, y + v0), Q(x + u1, y + v1), Q(x + u0, y + v1)], col, 'rgba(240,225,210,.5)', .7);
      }
    } else if (st === 'block') {
      poly(curC, [Q(x, y), Q(x + 1, y), Q(x + 1, y + 1), Q(x, y + 1)], '#cac3b7');
      const blocks = [
        [0.03, 0.03, 0.48, 0.48], [0.52, 0.03, 0.97, 0.48],
        [0.03, 0.52, 0.48, 0.97], [0.52, 0.52, 0.97, 0.97]
      ];
      for (let i = 0; i < 4; i++) {
        const [u0, v0, u1, v1] = blocks[i];
        const col = ['#dcd5cb', '#c5beb1', '#d4cdc2', '#bcb5a7'][(x + y + i) % 4];
        poly(curC, [Q(x + u0, y + v0), Q(x + u1, y + v0), Q(x + u1, y + v1), Q(x + u0, y + v1)], col, 'rgba(100,90,80,.35)', .8);
      }
    } else if (st === 'step') {
      poly(curC, [Q(x, y), Q(x + 1, y), Q(x + 1, y + 1), Q(x, y + 1)], 'rgba(132,204,22,.65)');
      for (const [ux, vy, rx, ry, col] of [[.32, .34, 7.5, 4.2, '#ede4d5'], [.70, .68, 8.2, 4.5, '#dfd6c5'], [.28, .76, 4.5, 2.5, '#f4ece0']]) {
        const p = Q(x + ux, y + vy);
        ART.ell(curC, p[0], p[1] + 1, rx, ry, 'rgba(40,55,20,.22)');
        ART.ell(curC, p[0], p[1], rx, ry, col, 'rgba(90,75,55,.45)', .8);
      }
      if ((x * 3 + y * 5) % 3 === 0) {
        const fp = Q(x + .75, y + .26);
        ART.ell(curC, fp[0], fp[1], 2.2, 1.8, '#ffd166');
      }
    } else if (st === 'stone') {
      poly(curC, [Q(x, y), Q(x + 1, y), Q(x + 1, y + 1), Q(x, y + 1)], '#f6f1e8');
      poly(curC, [Q(x + .05, y + .05), Q(x + .95, y + .05), Q(x + .95, y + .95), Q(x + .05, y + .95)], (x + y) % 2 ? '#faf6ee' : '#efe9de', '#d4af37', 1);
      poly(curC, [Q(x + .5, y + .22), Q(x + .78, y + .5), Q(x + .5, y + .78), Q(x + .22, y + .5)], 'rgba(212,175,55,.22)', 'rgba(185,148,40,.45)', .7);
    } else if (st === 'tile') {
      poly(curC, [Q(x, y), Q(x + 1, y), Q(x + 1, y + 1), Q(x, y + 1)], '#fbf6ee');
      poly(curC, [Q(x + .06, y + .06), Q(x + .94, y + .06), Q(x + .94, y + .94), Q(x + .06, y + .94)], '#fff9f0', '#c86a48', 1);
      poly(curC, [Q(x + .5, y + .15), Q(x + .85, y + .5), Q(x + .5, y + .85), Q(x + .15, y + .5)], 'rgba(58,124,165,.25)', '#3a7ca5', .8);
      ART.ell(curC, Q(x + .5, y + .5)[0], Q(x + .5, y + .5)[1], 2.5, 1.8, '#d97706');
    } else if (st === 'yellow') {
      // v2026-10-09: 시설 입구·출구 자동 안내용 및 도로 포장용 고급 노란길
      poly(curC, [Q(x, y), Q(x + 1, y), Q(x + 1, y + 1), Q(x, y + 1)], '#f59e0b', '#d97706', 1.2);
      const blocks = [
        [0.05, 0.05, 0.47, 0.47], [0.53, 0.05, 0.95, 0.47],
        [0.05, 0.53, 0.47, 0.95], [0.53, 0.53, 0.95, 0.95]
      ];
      for (let i = 0; i < 4; i++) {
        const [u0, v0, u1, v1] = blocks[i];
        const col = ['#fde047', '#facc15', '#fef08a', '#eab308'][(x + y + i) % 4];
        poly(curC, [Q(x + u0, y + v0), Q(x + u1, y + v0), Q(x + u1, y + v1), Q(x + u0, y + v1)], col, 'rgba(180,100,10,.35)', .8);
        const h0 = Q(x + u0 + .03, y + v0 + .03), h1 = Q(x + u1 - .03, y + v0 + .03);
        curC.beginPath(); curC.moveTo(h0[0], h0[1]); curC.lineTo(h1[0], h1[1]);
        curC.strokeStyle = 'rgba(255,255,255,.65)'; curC.lineWidth = .9; curC.stroke();
      }
      const cp = Q(x + .5, y + .5);
      ART.ell(curC, cp[0], cp[1], 3.2, 2.0, '#fffbeb', '#d97706', 0.9);
      ART.ell(curC, cp[0], cp[1], 1.5, 1.0, '#f59e0b');
    } else {
      poly(curC, [Q(x, y), Q(x + 1, y), Q(x + 1, y + 1), Q(x, y + 1)], '#d8ccb8');
      const stones = [
        [0.05, 0.05, 0.45, 0.45],
        [0.55, 0.05, 0.95, 0.45],
        [0.05, 0.55, 0.45, 0.95],
        [0.55, 0.55, 0.95, 0.95]
      ];
      for (let sIdx = 0; sIdx < 4; sIdx++) {
        const [u0, v0, u1, v1] = stones[sIdx];
        const hash = Math.abs(Math.sin((x + u0) * 17.1 + (y + v0) * 31.7) * 43758.5453);
        const col = ['#e4d9c6', '#d6c8b4', '#dfd3c0', '#cfc2ad'][(Math.floor(hash * 10)) % 4];
        const pts = [Q(x + u0, y + v0), Q(x + u1, y + v0), Q(x + u1, y + v1), Q(x + u0, y + v1)];
        poly(curC, pts, col, 'rgba(55,38,20,.38)', .9);
        const h0 = Q(x + u0 + .02, y + v0 + .02), h1 = Q(x + u1 - .02, y + v0 + .02);
        curC.beginPath(); curC.moveTo(h0[0], h0[1]); curC.lineTo(h1[0], h1[1]);
        curC.strokeStyle = 'rgba(255,255,255,.32)'; curC.lineWidth = .9; curC.stroke();
      }
    }
  };

  // v2026-10-09: "모든 집 입구앞에도 길을 자동으로 한칸 만들어줘" -- 플레이어가 길을 직접 깔지
  // 않아도 모든 주택 출입문 바로 앞 딱 한 칸에만 길 타일을 자동으로 그려서 "길 연결 필요" 경고
  // 없이 다닐 수 있게 함. (v2026-10-09 수정: 실제 길까지 이어주는 다리 칸을 전부 그렸더니 집이
  // 멀리 떨어져 있을 때 타일이 길게 늘어져 보인다고 해서, 화면엔 문앞 딱 한 칸만 그리도록 되돌림 --
  // 길찾기용 연결 자체는 houseConnectorSet/isRoadTile에 그대로 남아있어서 주민은 여전히 다닐 수 있음.
  // 색상도 눈에 띄는 색 대신 일반 길과 똑같은 "기본 흙길" 모양으로 그려서 자연스럽게 어울리게 함.)
  const drawHouseEntranceTiles = (targetC, s) => {
    const curC = targetC || (typeof c !== 'undefined' ? c : null);
    if (!curC) return;
    const R = roadSet(s);
    for (const o of (s && s.town && s.town.objs) || []) {
      const d = D[o.k];
      if (o.k === 'cottage' || (d && d.cat === 'house')) {
        const hd = doorOf(o);
        const ex = hd.x, ey = hd.y;
        if (R.has(ex + ',' + ey)) continue;
        drawRoadTile(ex, ey, 'dirt', curC);
      }
    }
  };

  // v2026-10-09: 각종 시설들 상점들 입구 출구 앞 길 색상: 불투명도 50%인 초록색 안내길
  const drawGateGreenTile = (x, y, curC) => {
    const p0 = Q(x, y), p1 = Q(x + 1, y), p2 = Q(x + 1, y + 1), p3 = Q(x, y + 1);
    poly(curC, [p0, p1, p2, p3], 'rgba(46, 204, 64, 0.5)', 'rgba(25, 135, 45, 0.85)', 1.5);
    const cp = Q(x + 0.5, y + 0.5);
    ART.ell(curC, cp[0], cp[1], 3.5, 1.8, 'rgba(255, 255, 255, 0.85)');
    ART.ell(curC, cp[0], cp[1], 1.8, 0.9, 'rgba(20, 100, 35, 0.95)');
  };

  const drawFacilityGateTiles = (targetC, s) => {
    const curC = targetC || (typeof c !== 'undefined' ? c : null);
    if (!curC) return;
    const ents = facilityEntrances(s, 'all');
    const drawn = new Set();
    for (const ent of ents) {
      // 1. 입구/출구 앞 접근 지점 (accessX, accessY)
      const ax = Math.floor(ent.accessX), ay = Math.floor(ent.accessY);
      const ak = ax + ',' + ay;
      if (!drawn.has(ak)) {
        drawn.add(ak);
        drawGateGreenTile(ax, ay, curC);
      }
      // 2. 출입구 문턱/게이트 지점 (x, y)도 초록색 안내길로 표시
      if (ent.x != null && ent.y != null) {
        const mx = Math.floor(ent.x), my = Math.floor(ent.y);
        const mk = mx + ',' + my;
        if (!drawn.has(mk)) {
          drawn.add(mk);
          drawGateGreenTile(mx, my, curC);
        }
      }
    }
  };

  const drawCrosswalks = (targetC, s) => {
    const W = Wd(s);
    const rows = getCrosswalkRows(s);
    if (!rows || !rows.size) return;
    const curC = targetC || (typeof c !== 'undefined' ? c : null);
    if (!curC) return;
    curC.save();
    // v2026-10-09: 줄무늬를 가로(도로를 가로지르는 방향)가 아니라 세로(도로 진행 방향과 나란히)로
    // 90도 회전. 각 줄무늬를 y축(타일 길이) 전체로 길게 긋고, 여러 줄무늬를 x축(도로 폭) 방향으로
    // 나란히 배열해서 실제 횡단보도처럼 보이게 함.
    const xSpan = 6.18 - 3.42; // 횡단보도가 덮는 도로 폭
    for (const y of rows) {
      // v2026-10-09: "횡단보도를 깔았으면 그 안에 도로는 지워줘야지..지저분해 보여" -- 줄무늬만
      // 그리면 밑에 깔린 길(자갈/보도블록 등)의 무늬가 줄무늬 사이사이로 비쳐서 지저분해 보임.
      // 줄무늬를 그리기 전에 횡단보도가 덮는 영역 전체를 민무늬 바닥(진한 회색 아스팔트)으로
      // 먼저 깔끔하게 덮어서, 밑에 있던 길의 무늬가 아예 안 보이게 함.
      poly(curC, [
        Q(W + 3.42, y),
        Q(W + 6.18, y),
        Q(W + 6.18, y + 1),
        Q(W + 3.42, y + 1)
      ], '#8d897f');
      for (let sVal = 0.12; sVal <= 0.88; sVal += 0.22) {
        const x0 = W + 3.42 + sVal * xSpan;
        const x1 = x0 + 0.12 * xSpan;
        poly(curC, [
          Q(x0, y + 0.04),
          Q(x1, y + 0.04),
          Q(x1, y + 0.96),
          Q(x0, y + 0.96)
        ], 'rgba(255, 255, 255, 0.94)', 'rgba(180, 170, 155, 0.45)', 0.8);
      }
    }
    curC.restore();
  };

  // 철길 건널목 바닥 보판 및 안전 빗금 렌더링
  const drawRailCrossings = (targetC, s) => {
    const rows = getRailCrossingRows(s);
    if (!rows || !rows.size) return;
    const curC = targetC || (typeof c !== 'undefined' ? c : null);
    if (!curC) return;
    const tx = (typeof TRAIN !== 'undefined' && typeof TRAIN.TRACK_X === 'function') ? TRAIN.TRACK_X() : (Wd(s) + 12.5);
    const midX = Math.round(tx);

    curC.save();
    for (const y of rows) {
      // 1. 건널목 양쪽 접속부 자동 도로 포장 (흙길/잔디 틈새 연결)
      const rstyles = (s && s.town && s.town.rstyle) || {};
      const st = rstyles[(midX - 3) + ',' + y] || rstyles[(midX + 2) + ',' + y] || rstyles[(midX - 2) + ',' + y] || 'brick';
      drawRoadTile(midX - 2, y, st, curC);
      drawRoadTile(midX + 1, y, st, curC);

      // 2. 건널목 하부 중후한 목재 보판 (Timber Decking)
      poly(curC, [
        Q(tx - 1.45, y + 0.04),
        Q(tx + 1.45, y + 0.04),
        Q(tx + 1.45, y + 0.96),
        Q(tx - 1.45, y + 0.96)
      ], '#453222', '#2a1c12', 1.2);

      // 3. 목재 보판 널빤지 패턴 (Planks)
      for (let py = y + 0.14; py <= y + 0.86; py += 0.24) {
        poly(curC, [
          Q(tx - 1.38, py),
          Q(tx + 1.38, py),
          Q(tx + 1.38, py + 0.18),
          Q(tx - 1.38, py + 0.18)
        ], '#543d2b', 'rgba(25,16,10,0.55)', 0.8);
      }

      // 4. 레일 통과부 (Flangeway 홈 및 강철 레일 반사광)
      for (const rOff of [-0.30, 0.30]) {
        const rx = tx + rOff;
        for (const gOff of [-0.08, 0.08]) {
          const f0 = Q(rx + gOff, y + 0.04), f1 = Q(rx + gOff, y + 0.96);
          curC.beginPath(); curC.moveTo(f0[0], f0[1]); curC.lineTo(f1[0], f1[1]);
          curC.strokeStyle = '#1a140e'; curC.lineWidth = 1.2; curC.stroke();
        }
        const r0 = Q(rx, y + 0.02, 1.5), r1 = Q(rx, y + 0.98, 1.5);
        curC.beginPath(); curC.moveTo(r0[0], r0[1]); curC.lineTo(r1[0], r1[1]);
        curC.strokeStyle = '#94a3b8'; curC.lineWidth = 2.2; curC.stroke();
        curC.beginPath(); curC.moveTo(r0[0], r0[1] - 0.5); curC.lineTo(r1[0], r1[1] - 0.5);
        curC.strokeStyle = '#f8fafc'; curC.lineWidth = 0.8; curC.stroke();
      }

      // 5. 북쪽 및 남쪽 가장자리 황색/흑색 안전 빗금 경고 띠 (Hazard Stripes)
      for (const ey of [y + 0.03, y + 0.87]) {
        for (let u = -1.4; u < 1.35; u += 0.28) {
          const uNext = Math.min(1.4, u + 0.28);
          const isYellow = (Math.round((u + 1.4) / 0.28)) % 2 === 0;
          poly(curC, [
            Q(tx + u, ey),
            Q(tx + uNext, ey),
            Q(tx + uNext - 0.06, ey + 0.10),
            Q(tx + u - 0.06, ey + 0.10)
          ], isYellow ? '#facc15' : '#1e1e1e', 'rgba(0,0,0,0.3)', 0.5);
        }
      }
    }
    curC.restore();
  };

  // 철길 건널목 경보기 신호대 (경고 기둥, 차단봉, X자 표지판, 교대 점멸등)
  const drawCrossingSignal = (c, gx, gy) => {
    const base = Q(gx, gy, 0);
    const topH = 40;

    // 콘크리트 베이스
    ART.ell(c, base[0], base[1], 5, 3, '#71717a', '#3f3f46', 1);

    // 황색 & 흑색 스트라이프 기둥
    const bands = 7;
    for (let i = 0; i < bands; i++) {
      const z0 = (i / bands) * topH;
      const z1 = ((i + 1) / bands) * topH;
      const p0 = Q(gx, gy, z0), p1 = Q(gx, gy, z1);
      c.beginPath(); c.moveTo(p0[0], p0[1]); c.lineTo(p1[0], p1[1]);
      c.strokeStyle = (i % 2 === 0) ? '#eab308' : '#18181b';
      c.lineWidth = 3.2;
      c.stroke();
    }

    // 차단기 회전축 및 차단봉
    const pPivot = Q(gx, gy, 14);
    ART.ell(c, pPivot[0], pPivot[1], 4, 3.5, '#dc2626', '#991b1b', 1);
    const pArmEnd = [pPivot[0] + 16, pPivot[1] - 8];
    c.beginPath(); c.moveTo(pPivot[0], pPivot[1]); c.lineTo(pArmEnd[0], pArmEnd[1]);
    c.strokeStyle = '#ef4444'; c.lineWidth = 2.4; c.stroke();
    c.setLineDash([4, 4]);
    c.beginPath(); c.moveTo(pPivot[0], pPivot[1]); c.lineTo(pArmEnd[0], pArmEnd[1]);
    c.strokeStyle = '#ffffff'; c.lineWidth = 2; c.stroke();
    c.setLineDash([]);

    // 쌍발 적색 경보등 (열차 운행 시 교대 깜빡임)
    const pLamps = Q(gx, gy, 28);
    c.beginPath(); c.moveTo(pLamps[0] - 8, pLamps[1]); c.lineTo(pLamps[0] + 8, pLamps[1]);
    c.strokeStyle = '#18181b'; c.lineWidth = 2; c.stroke();

    const trainActive = (typeof S !== 'undefined' && S && S.train && ['approaching', 'arrived', 'departing'].includes(S.train.st));
    const blink = trainActive ? (Math.floor(Date.now() / 380) % 2) : 0;
    const l1On = trainActive ? (blink === 0) : true;
    const l2On = trainActive ? (blink === 1) : false;

    ART.ell(c, pLamps[0] - 6, pLamps[1], 3.8, 3.8, l1On ? '#ef4444' : '#7f1d1d', '#18181b', 0.8);
    if (l1On) {
      c.save();
      c.shadowColor = '#ef4444'; c.shadowBlur = 6;
      ART.ell(c, pLamps[0] - 6, pLamps[1], 2, 2, '#fecaca');
      c.restore();
    }
    ART.ell(c, pLamps[0] + 6, pLamps[1], 3.8, 3.8, l2On ? '#ef4444' : '#7f1d1d', '#18181b', 0.8);
    if (l2On) {
      c.save();
      c.shadowColor = '#ef4444'; c.shadowBlur = 6;
      ART.ell(c, pLamps[0] + 6, pLamps[1], 2, 2, '#fecaca');
      c.restore();
    }

    // X자 크로스벅(철길 건널목) 표지판
    const pSign = Q(gx, gy, 35);
    const crossR = 7;
    for (const ang of [-0.75, 0.75]) {
      const dx = Math.cos(ang) * crossR, dy = Math.sin(ang) * crossR;
      c.beginPath();
      c.moveTo(pSign[0] - dx, pSign[1] - dy);
      c.lineTo(pSign[0] + dx, pSign[1] + dy);
      c.strokeStyle = '#ffffff'; c.lineWidth = 3.2; c.stroke();
      c.strokeStyle = '#dc2626'; c.lineWidth = 1.4; c.stroke();
    }
    ART.ell(c, pSign[0], pSign[1], 1.8, 1.8, '#18181b');

    // 상단 골드 경종 벨
    const pBell = Q(gx, gy, topH + 1);
    ART.ell(c, pBell[0], pBell[1], 2.4, 2.2, '#facc15', '#a16207', 0.8);
  };

  let _warnListKey = '', _warnListCache = [];
  const collectRoadWarnings = (out, curC, s) => {
    if (!s || !s.town) return;
    const nmFunc = (typeof nm === 'function') ? nm : (k => (typeof t === 'function' ? (t('tk_' + k) || k) : k));
    const k = (s.town.rv || 0) + ':' + (s.town.objs ? s.town.objs.length : 0) + ':' +
      (s.park && s.park.built ? 1 : 0) + ':' + (s.village && s.village.lake ? 1 : 0) + ':' +
      (s.cafe && s.cafe.built ? 1 : 0) + ':' + (s.hosp && s.hosp.built ? 1 : 0) + ':' +
      (s.salon && s.salon.built ? 1 : 0);
    let warnList = _warnListCache;
    if (k !== _warnListKey) {
      warnList = [];
      if (!isFacilityAccessible(s, 'shop')) warnList.push({ name: (typeof t === 'function' && t('roomSec')) || '가게', x: Wd(s) / 2, y: Hd(s) / 2, h: 40 });
      if (s.cafe && s.cafe.built && !isFacilityAccessible(s, 'cafe')) {
        const cp = (typeof CAFE_POS === 'function') ? CAFE_POS(s) : null;
        if (cp) warnList.push({ name: (typeof t === 'function' && t('tk_cafe')) || '카페', x: cp.x + cp.w / 2, y: cp.y + cp.d / 2, h: 42 });
      }
      if (s.hosp && s.hosp.built && !isFacilityAccessible(s, 'hosp')) {
        const hp = (typeof HOSP_POS === 'function') ? HOSP_POS(s) : null;
        if (hp) warnList.push({ name: (typeof t === 'function' && t('tk_hosp')) || '병원', x: hp.x + hp.w / 2, y: hp.y + hp.d / 2, h: 42 });
      }
      if (s.salon && s.salon.built && !isFacilityAccessible(s, 'salon')) {
        const sp = (typeof SALON_POS === 'function') ? SALON_POS() : null;
        if (sp) warnList.push({ name: (typeof t === 'function' && t('tk_salon')) || '미용실', x: sp.x + sp.w / 2, y: sp.y + sp.d / 2, h: 40 });
      }
      if (s.park && s.park.built && !isFacilityAccessible(s, 'park')) {
        const pp = (typeof PARK_POS === 'function') ? PARK_POS() : null;
        if (pp) warnList.push({ name: (typeof t === 'function' && t('tk_park')) || '공원', x: pp.x + 8, y: pp.y + 7, h: 25 });
      }
      if (s.village && s.village.lake && !isFacilityAccessible(s, 'lake')) {
        const lp = (typeof VILLAGE !== 'undefined' && typeof VILLAGE.LAKE === 'function') ? VILLAGE.LAKE() : null;
        if (lp) warnList.push({ name: (typeof t === 'function' && t('tk_lake')) || '호수', x: lp.x + 9, y: lp.y + 8, h: 25 });
      }
      if (s.ranch && !isFacilityAccessible(s, 'ranch')) {
        const rp = (typeof LAY === 'function') ? LAY('ranch', s) : null;
        if (rp) warnList.push({ name: (typeof t === 'function' && t('tk_ranch')) || '목장', x: rp.x + 6, y: rp.y + 5, h: 35 });
      }
      for (const o of ((s.town && s.town.objs) || [])) {
        const d = D[o.k];
        if (d && d.cat === 'civic' && !isFacilityAccessible(s, o)) {
          if (o.k === 'zoo') {
            warnList.push({ name: nmFunc(o.k), x: o.x + 4.5, y: o.y + 19.5, h: 32 });
          } else {
            warnList.push({ name: nmFunc(o.k), x: o.x + d.w / 2, y: o.y + d.d / 2, h: (d.h || 26) + 10 });
          }
        } else if (d && d.cat === 'house' && !isHouseAccessible(s, o)) {
          warnList.push({ name: (typeof t === 'function' && t('tHouse')) || '주택', x: o.x + 2.5, y: o.y + 2.5, h: 36 });
        }
      }
      _warnListKey = k;
      _warnListCache = warnList;
    }

    const cb = (typeof World !== 'undefined' && World.cullBounds) ? World.cullBounds() : null;
    for (const w of warnList) {
      if (cb) {
        const wx = ISO.wx(w.x, w.y), wy = ISO.wy(w.x, w.y);
        if (Math.abs(wx - cb.cx) > cb.rw + 60 || Math.abs(wy - cb.cy) > cb.rh + 100) continue;
      }
      out.push({
        depth: 1e8,
        fn: () => {
          const targetCanvas = curC || (typeof c !== 'undefined' ? c : null);
          if (!targetCanvas) return;
          const sx = ISO.wx(w.x, w.y);
          const bounce = Math.sin(Date.now() / 320) * 2.5;
          const sy = ISO.wy(w.x, w.y) - w.h - 18 + bounce;
          targetCanvas.save();
          targetCanvas.font = 'bold 10.5px sans-serif';
          const txt = '⚠️ ' + ((typeof t === 'function' && t('roadNeedWarn')) || '길 연결 필요');
          const tw = targetCanvas.measureText(txt).width + 16;
          ART.rrect(targetCanvas, sx - tw / 2, sy - 11, tw, 20, 6);
          targetCanvas.fillStyle = 'rgba(255, 248, 235, 0.96)';
          targetCanvas.fill();
          targetCanvas.lineWidth = 1.6;
          targetCanvas.strokeStyle = '#ea580c';
          targetCanvas.stroke();
          targetCanvas.beginPath();
          targetCanvas.moveTo(sx - 4, sy + 9);
          targetCanvas.lineTo(sx, sy + 14);
          targetCanvas.lineTo(sx + 4, sy + 9);
          targetCanvas.fillStyle = '#ea580c';
          targetCanvas.fill();
          targetCanvas.fillStyle = '#c2410c';
          targetCanvas.textAlign = 'center';
          targetCanvas.fillText(txt, sx, sy + 3);
          targetCanvas.restore();
        }
      });
    }
  };

  let _validRoadsKey = '', _validRoadsList = [];
  const getValidPlayerRoads = s => {
    const T = s && s.town;
    const k = (T && T.roads ? T.roads.length : 0) + ':' + (T ? T.rv || 0 : 0) + ':' + (T && T.objs ? T.objs.length : 0);
    if (k === _validRoadsKey && _validRoadsList) return _validRoadsList;
    const proads = parsedRoadList(s);
    const autoGates = autoGateTileSet(s);
    const W = Wd(s), H = Hd(s);
    const out = [];
    for (let i = 0; i < proads.length; i++) {
      const r = proads[i];
      if (r.x >= 0 && r.x < W && r.y >= 0 && r.y < H) continue;
      if (inActualBuilding(s, r.x, r.y, autoGates) && !autoGates.has(r.k)) continue;
      out.push(r);
    }
    _validRoadsKey = k;
    _validRoadsList = out;
    return out;
  };

  const drawPlayerRoads = (targetC) => {
    const W = Wd(), H = Hd();
    const R = roadSet(S);
    const rstyles = (S && S.town && S.town.rstyle) || {};
    const curC = targetC || (typeof c !== 'undefined' ? c : null);
    if (!curC) return;
    const cb = (typeof World !== 'undefined' && World.cullBounds) ? World.cullBounds() : null;
    const cx = cb ? cb.cx : 0, cy = cb ? cb.cy : 0;
    const rw = cb ? cb.rw : 1e9, rh = cb ? cb.rh : 1e9;

    const validRoads = getValidPlayerRoads(S);
    for (let i = 0; i < validRoads.length; i++) {
      const r = validRoads[i];
      const x = r.x, y = r.y, k = r.k;
      // Viewport culling with generous 80px/60px margin
      if (cb) {
        const sx = ISO.wx(x + .5, y + .5), sy = ISO.wy(x + .5, y + .5);
        if (Math.abs(sx - cx) > rw + 80 || Math.abs(sy - cy) > rh + 60) continue;
      }
      const st = rstyles[k] || 'cobble';
      drawRoadTile(x, y, st, curC);
      if (st !== 'step') {
        curC.strokeStyle = st === 'tile' ? 'rgba(175,95,120,.55)' : st === 'stone' ? 'rgba(185,148,40,.65)' : st === 'dirt' ? 'rgba(120,70,30,.45)' : 'rgba(100,75,45,.65)';
        curC.lineWidth = 1.3;
        if (!R.has(x + ',' + (y - 1))) { const a = Q(x, y), b2 = Q(x + 1, y); curC.beginPath(); curC.moveTo(a[0], a[1]); curC.lineTo(b2[0], b2[1]); curC.stroke(); }
        if (!R.has(x + ',' + (y + 1))) { const a = Q(x, y + 1), b2 = Q(x + 1, y + 1); curC.beginPath(); curC.moveTo(a[0], a[1]); curC.lineTo(b2[0], b2[1]); curC.stroke(); }
        if (!R.has((x - 1) + ',' + y)) { const a = Q(x, y), b2 = Q(x, y + 1); curC.beginPath(); curC.moveTo(a[0], a[1]); curC.lineTo(b2[0], b2[1]); curC.stroke(); }
        if (!R.has((x + 1) + ',' + y)) { const a = Q(x + 1, y), b2 = Q(x + 1, y + 1); curC.beginPath(); curC.moveTo(a[0], a[1]); curC.lineTo(b2[0], b2[1]); curC.stroke(); }
      }
    }
    // 주택 입구 자동 연결 타일 렌더링
    drawHouseEntranceTiles(curC, S);
    // v2026-10-10: 공원·호수·동물원 입구에 자동으로 그려지던 초록색 안내 타일 제거 -- 사용자가
    // 배경 그림을 새로 그리면서 입구 위치와 안 맞아 보여서 제거를 요청함. 집(주택) 입구의
    // drawHouseEntranceTiles는 그대로 유지함.
    // drawFacilityGateTiles(curC, S);
    // 횡단보도 렌더링
    drawCrosswalks(curC, S);
    // 철길 건널목 바닥 렌더링
    drawRailCrossings(curC, S);
  };

  function ground(c, T) {
    const W = Wd(), H = Hd();
    const R = roadSet(S); // road tiles the player paved
    const rstyles = (S && S.town && S.town.rstyle) || {};
    // v2026-10-09: 주택가(zone) 골목길(lane) 타일 전부 모음
    const zoneList = zonesOf(S);
    const laneSet = new Set();
    for (const z of zoneList) {
      const L = laneOf(z);
      for (let lx = L.x; lx < L.x + L.w; lx++) for (let ly = L.y; ly < L.y + L.d; ly++) laneSet.add(lx + ',' + ly);
    }
    const cb = (typeof World !== 'undefined' && World.cullBounds) ? World.cullBounds() : null;
    const cx = cb ? cb.cx : 0, cy = cb ? cb.cy : 0;
    const rw = cb ? cb.rw : 1e9, rh = cb ? cb.rh : 1e9;
    // 1. Draw residential zones FIRST so player roads paved inside or across zone borders draw cleanly on top!
    for (const z of zoneList) {
      if (cb) {
        const zcx = ISO.wx(z.x + z.w / 2, z.y + z.d / 2);
        const zcy = ISO.wy(z.x + z.w / 2, z.y + z.d / 2);
        const extX = (z.w + z.d) * 16 + 120;
        const extY = (z.w + z.d) * 8 + 120;
        if (Math.abs(zcx - cx) > rw + extX || Math.abs(zcy - cy) > rh + extY) continue;
      }
      poly(c, [Q(z.x, z.y), Q(z.x + z.w, z.y), Q(z.x + z.w, z.y + z.d), Q(z.x, z.y + z.d)], 'rgba(135,196,80,.5)');
      const L = laneOf(z);
      for (let lx = L.x; lx < L.x + L.w; lx++) {
        for (let ly = L.y; ly < L.y + L.d; ly++) {
          const lst = rstyles[lx + ',' + ly] || 'cobble';
          drawRoadTile(lx, ly, lst, c);
          if (lst !== 'step') {
            c.strokeStyle = lst === 'tile' ? 'rgba(175,95,120,.55)' : lst === 'stone' ? 'rgba(185,148,40,.65)' : lst === 'dirt' ? 'rgba(120,70,30,.45)' : 'rgba(100,75,45,.65)';
            c.lineWidth = 1.3;
            if (!laneSet.has(lx + ',' + (ly - 1)) && !R.has(lx + ',' + (ly - 1))) { const a = Q(lx, ly), b2 = Q(lx + 1, ly); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b2[0], b2[1]); c.stroke(); }
            if (!laneSet.has(lx + ',' + (ly + 1)) && !R.has(lx + ',' + (ly + 1))) { const a = Q(lx, ly + 1), b2 = Q(lx + 1, ly + 1); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b2[0], b2[1]); c.stroke(); }
            if (!laneSet.has((lx - 1) + ',' + ly) && !R.has((lx - 1) + ',' + ly)) { const a = Q(lx, ly), b2 = Q(lx, ly + 1); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b2[0], b2[1]); c.stroke(); }
            if (!laneSet.has((lx + 1) + ',' + ly) && !R.has((lx + 1) + ',' + ly)) { const a = Q(lx + 1, ly), b2 = Q(lx + 1, ly + 1); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b2[0], b2[1]); c.stroke(); }
          }
        }
      }
      const hedge = (x0, y0, x1, y1) => {
        const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / 1.0));
        for (let i = 0; i <= n; i++) {
          const hx = x0 + (x1 - x0) * i / n, hy = y0 + (y1 - y0) * i / n;
          if (R.has(Math.floor(hx) + ',' + Math.floor(hy)) || R.has(Math.floor(hx - .1) + ',' + Math.floor(hy - .1))) continue;
          const q = Q(hx, hy);
          const spr = getHedgeSprite(i);
          c.drawImage(spr, q[0] - spr.width / 2, q[1] - spr.height + 4);
        }
      };
      if (isVertZone(z)) {
        hedge(z.x, z.y, z.x, z.y + z.d); hedge(z.x + z.w, z.y, z.x + z.w, z.y + z.d);
        for (const yy of [z.y, z.y + z.d]) { hedge(z.x, yy, L.x, yy); hedge(L.x + L.w, yy, z.x + z.w, yy); }
      } else {
        hedge(z.x, z.y, z.x + z.w, z.y); hedge(z.x, z.y + z.d, z.x + z.w, z.y + z.d);
        for (const xx of [z.x, z.x + z.w]) { hedge(xx, z.y, xx, L.y); hedge(xx, L.y + L.d, xx, z.y + z.d); }
      }
    }
    // 2. Draw player-paved roads on top
    drawPlayerRoads(c);
  }
  function collect(c, T, addHit) {
    const out = [];
    const cb = (typeof World !== 'undefined' && World.cullBounds) ? World.cullBounds() : null;
    if (typeof S !== 'undefined' && S && S.town && S.town.objs) {
      for (const o of S.town.objs) {
        if (o.k === 'zoo') {
          if (cb) {
            const zx = ISO.wx(o.x + 12, o.y + 11), zy = ISO.wy(o.x + 12, o.y + 11);
            if (Math.abs(zx - cb.cx) > cb.rw + 360 || Math.abs(zy - cb.cy) > cb.rh + 360) continue;
          }
          collectZoo(out, c, o, T, addHit);
        }
      }
    }
    for (const z of zonesOf(S)) {
      const L = laneOf(z);
      const signs = isVertZone(z)
        ? [[L.x - .4, z.y - .5], [L.x + L.w + .4, z.y + z.d + .5]]
        : [[z.x - .5, L.y - .4], [z.x + z.w + .5, L.y + L.d + .4]];
      for (const [sx, sy] of signs) {
        if (cb) {
          const px = ISO.wx(sx, sy), py = ISO.wy(sx, sy);
          if (Math.abs(px - cb.cx) > cb.rw + 60 || Math.abs(py - cb.cy) > cb.rh + 80) continue;
        }
        out.push({ depth: sx + sy + 1, fn: () => {
          const a = Q(sx, sy), b2 = Q(sx, sy, 30); c.strokeStyle = '#7a4e32'; c.lineWidth = 3; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b2[0], b2[1]); c.stroke();
          const txt = '🏘️ ' + t('tZoneName'); c.font = 'bold 9px sans-serif'; const tw = c.measureText(txt).width + 14;
          ART.rrect(c, b2[0] - tw / 2, b2[1] - 14, tw, 16, 5); c.fillStyle = '#fff3d6'; c.fill(); c.strokeStyle = '#8a5a33'; c.lineWidth = 1.4; c.stroke();
          c.textAlign = 'center'; c.fillStyle = '#5a3a2a'; c.fillText(txt, b2[0], b2[1] - 3); c.textAlign = 'start';
          if (addHit) addHit({ kind: 'tzonesign', x0: b2[0] - tw / 2, x1: b2[0] + tw / 2, y0: b2[1] - 16, y1: a[1] + 4 });
        } });
      }
    }
    // 철길 건널목 3D 경보기 신호대 수집
    if (typeof S !== 'undefined' && S) {
      const railRows = getRailCrossingRows(S);
      const tx = (typeof TRAIN !== 'undefined' && typeof TRAIN.TRACK_X === 'function') ? TRAIN.TRACK_X() : (Wd(S) + 12.5);
      for (const y of railRows) {
        if (cb) {
          const px = ISO.wx(tx, y), py = ISO.wy(tx, y);
          if (Math.abs(px - cb.cx) > cb.rw + 80 || Math.abs(py - cb.cy) > cb.rh + 100) continue;
        }
        if (!railRows.has(y + 1)) {
          out.push({ depth: (tx - 1.55) + (y + 0.95) + 0.8, fn: () => drawCrossingSignal(c, tx - 1.55, y + 0.95) });
        }
        if (!railRows.has(y - 1)) {
          out.push({ depth: (tx + 1.55) + (y + 0.05) + 0.8, fn: () => drawCrossingSignal(c, tx + 1.55, y + 0.05) });
        }
      }
    }
    // 길 미연결 시설 경고 배지 수집
    collectRoadWarnings(out, c, S);
    return out;
  }
  // the road tool's preview: the first point and the straight L-shaped run to where you tap next
  function roadLine(a, b) { const out = []; const sx = Math.sign(b.x - a.x), sy = Math.sign(b.y - a.y); let x = a.x, y = a.y; out.push([x, y]); while (x !== b.x) { x += sx; out.push([x, y]); } while (y !== b.y) { y += sy; out.push([x, y]); } return out; }
  function drawRoadTool(c, st) {
    if (!st || !st.a) return; const col = st.erase ? 'rgba(230,70,60,.55)' : 'rgba(80,170,230,.55)';
    const p = Q(st.a.x + .5, st.a.y + .5); poly(c, [Q(st.a.x, st.a.y), Q(st.a.x + 1, st.a.y), Q(st.a.x + 1, st.a.y + 1), Q(st.a.x, st.a.y + 1)], col, '#ffffff', 2);
    c.font = '16px sans-serif'; c.textAlign = 'center'; c.fillText(st.erase ? '🧽' : '📍', p[0], p[1] - 8); c.textAlign = 'start';
  }
  // ---------------- villagers out and about (v1.3): visual only, each phone runs its own ----------------
  // they leave a house with people in it, walk to a shop / public building / fountain..., stay a while, come back out with what they got, and go home
  const VISIT = { bakery: '🥐', conv: '🛍️', florist: '💐', clinic: '💊', dogpark: '🐕', photo: '📸', school: '📚', police: '👮', fire: '🚒', library: '📖', market: '🛒', training: '🎓', pethotel: '🏨', clocktower: '🕰️', lookout: '🔭', chapel: '💒', gate: '👋', fountain: '💦', playground: '🛝', bench: '☕', shelter: '🐾', zoo: '🦁', aquarium_center: '🐬', pet_themepark: '🎡', cat_cafe: '🐱', pet_bakery: '🧁', pet_fountain: '⛲', camping_zone: '⛺', park: '🌳', lake: '🎣' };
  const V = []; let vSeq = 0, vT = 2;
  // v2026-10-08: "공원 가면 한곳에 멍하니 서있다가 나오는게 너무 단순해" -- 공원 안의 6개 포인트
  // (분수/벤치/연못/놀이터 등)를 따로 뽑아서, 머무는 동안 이 사이를 몇 번 더 걸어다니고(wander),
  // 가끔 머리 위에 속마음을 띄우도록(say) 쓸 좌표/대사 목록.
  const PARK_SPOTS = [[8, 4], [3, 5], [13, 9], [9, 3], [5, 9], [12, 12]];
  const PARK_SAY = {
    ko: ['공원에 오니깐 너무 좋다 🌸', '기분이 나아지는걸 😊', '공원 좀 산책해볼까?', '꽃이 참 예쁘네', '분수대가 시원해 보여', '나무 그늘이 좋다', '여기 벤치에 좀 앉았다 갈까', '연못에 물고기가 보이네', '바람이 참 상쾌하다'],
    ru: ['Как хорошо здесь, в парке! 🌸', 'Настроение сразу поднимается 😊', 'Может, прогуляться по парку?', 'Какие красивые цветы', 'Фонтан выглядит так свежо', 'Приятная тень от деревьев', 'Посижу-ка на скамейке', 'Вижу рыбок в пруду', 'Какой свежий ветерок']
  };
  // 호수 방문 스팟: 낚시하는 주민, 쉬는 주민
  const LAKE_SPOTS = [
    // 낚시 스팟들 (부두 데크, 북서쪽 연못가, 남서쪽 연못가, 빨간 다리 위, 동쪽 연못 B 데크)
    { id: 'dock', u: 0.6, v: 9.6, act: 'fish', sit: true },
    { id: 'pier', u: 2.2, v: 5.6, act: 'fish', sit: false },
    { id: 'south', u: 5.5, v: 13.8, act: 'fish', sit: false },
    { id: 'bridge', u: 9.8, v: 7.6, act: 'fish', sit: false },
    { id: 'east', u: 16.4, v: 7.8, act: 'fish', sit: false },
    { id: 'north_b', u: 14.2, v: 3.2, act: 'fish', sit: false },
    // 휴식 스팟들 (정자 그늘, 호숫가 벤치들, 오리 구경 산책로)
    { id: 'gazebo', u: 13.6, v: 12.6, act: 'rest', sit: false },
    { id: 'bench_w', u: 3.2, v: 13.6, act: 'rest', sit: true },
    { id: 'bench_e', u: 11.4, v: 2.2, act: 'rest', sit: true },
    { id: 'shore_rest', u: 4.8, v: 4.4, act: 'rest', sit: false },
    { id: 'channel_rest', u: 8.6, v: 5.4, act: 'rest', sit: false }
  ];
  const LAKE_FISH_SAY = {
    ko: ['호수에서 낚시하니까 마음이 편안해 🎣', '월척을 낚아볼까? 🐟', '물결이 잔잔해서 낚시하기 딱 좋다 ✨', '입질이 오는 것 같아! 🌊', '잡았다! 손맛이 끝내주네 🐟', '낚시는 기다림의 미학이지 ☕', '호숫가에서 낚시하니 스트레스가 싹 풀려 🎣', '맑은 호수를 보며 찌를 바라보는 게 제일 좋아 😊'],
    ru: ['Какая умиротворяющая рыбалка! 🎣', 'Может, поймаю крупную рыбу? 🐟', 'Вода такая спокойная ✨', 'Кажется, клюёт! 🌊', 'Поймал! Отличный улов 🐟', 'Рыбалка — это искусство ожидания ☕']
  };
  const LAKE_REST_SAY = {
    ko: ['호숫가 바람이 정말 상쾌하다 🍃', '오리들이 헤엄치는 걸 보니 힐링돼 🦆', '경치가 너무 좋아서 쉬어가요 ☕', '정자 그늘 아래서 쉬니까 행복해 🌸', '호수를 바라보고 있으면 근심이 사라져 ✨', '마을에 이런 호수가 있어서 참 좋다 😊', '호수 물소리를 들으니 평화로워 🌊', '여유롭게 쉬다 가야겠어 🥪'],
    ru: ['У озера такой свежий ветерок 🍃', 'Уточки так мило плавают 🦆', 'Здесь так красиво, отдохну немного ☕', 'Как приятно в тени беседки 🌸', 'Вода уносит все тревоги ✨']
  };
  // v2026-10-08: "사람들이 겹쳐서 서있지 않게 해줘" -- 여러 명이 같은 고정 좌표(예: 공원 분수 앞)로
  // 몰리면 서로 완전히 포개져 보였음. 실내로 들어가는 자리(inside=true)만 빼고, 야외에서 서 있는
  // 좌표엔 약간의 랜덤 흔들림을 더해서 같은 지점을 고르더라도 서로 조금씩 떨어져 서게 함.
  const jit = p => ({ x: p.x + (Math.random() - .5) * .9, y: p.y + (Math.random() - .5) * .9 });
  function visitSpot(o) { // [tile to walk to, goes inside?]
    if (o.k === 'park') { // the big park lot isn't in D/TOWN_DEF (it's a separate "big lot" like the ranch), so handle it before the D[o.k] lookup below
      const [u, v] = PARK_SPOTS[Math.floor(Math.random() * PARK_SPOTS.length)];
      return [jit({ x: o.x + u, y: o.y + v }), false];
    }
    if (o.k === 'lake') {
      const sp = LAKE_SPOTS[Math.floor(Math.random() * LAKE_SPOTS.length)];
      return [jit({ x: o.x + sp.u, y: o.y + sp.v, act: sp.act, sit: sp.sit }), false];
    }
    const d = D[o.k], f = fpOf(o.k, o.r);
    if (o.k === 'zoo') {
      // Real villagers walk along zoo viewing walkways and admire animals
      const spots = [
        [5, 19],  // 동물원 IN 입구 돌출 계단 광장
        [13, -4], // 동물원 OUT 출구 아치문 관람로
        [20, 18], // 중앙 진입 보도
        [15, 13], // 중앙 분수대 광장
        [11, 20], // 극지 펭귄 빙하 관람로
        [6, 15],  // 열대 하마 라군 관람로
        [3, 10],  // 코끼리 쉼터 전망 펜스
        [9, 6],   // 사바나 사파리 기린 방사장 펜스
        [14, 2],  // 판다 대나무 숲 관람로
        [21, 5],  // 레서판다 수변 서식지 관람로
        [23, 11]  // 사파리 대초원 관람로
      ];
      const [u, v] = spots[Math.floor(Math.random() * spots.length)];
      return [jit({ x: o.x + u, y: o.y + v }), false];
    }
    if (o.k === 'pet_themepark') {
      return [{ x: o.x + 1 + Math.floor(Math.random() * (d.w - 2)), y: o.y + 1 + Math.floor(Math.random() * (d.d - 2)) }, false];
    }
    if (d.cat === 'civic' && !d.open) return [rotPt(o, Math.floor(d.w / 2), d.d - 1, d.w, d.d), true];
    if (o.k === 'gate') return [rotPt(o, Math.floor(d.w / 2), 0, d.w, d.d), false];
    if (d.cat === 'civic') return [jit(rotPt(o, Math.floor(d.w / 2), d.d, d.w, d.d)), false];
    return [jit({ x: o.x + Math.floor(f.w / 2), y: o.y + f.d }), false];
  }
  // v2026-10-08 (재시도 4, 근본 원인 해결): 옆걸음을 흉내내려고 a.path에 억지로 반대부호 대각선을
  // 꽂아넣었다가 다시 goTo로 꺾어 돌아오는 방식(wobbleGo + 이동 중간 끼워넣기)을 전부 제거함 --
  // "왜 홱홱 도는데, 대각선 가려면 쭉 대각선으로 가야지 왜 아래로 갔다가 대각선으로 갔다가 하는데"
  // 라는 지적이 정확함. 이건 흉내만 낸 땜질이었고, 진짜 원인은 findPath(A*)의 대각선 이동 비용이
  // 1.414(이론상 최단거리)로 설정돼 있어서 "최단거리"가 거의 항상 대각선 위주로 나왔던 것.
  // 보통 이런 게임은 반대로, 위/아래/옆(한 축)으로 주로 걷고 대각선은 모퉁이를 가로질러 거리를
  // 줄일 때만 "가끔" 쓰는 게 자연스러움. -> findPath 쪽의 대각선 비용 자체를 고쳐서(아래 DIAG_COST),
  // 길찾기가 알아서 옆/앞/뒤 위주로 걷고 대각선은 진짜 지름길일 때만 선택하도록 근본적으로 바꿈.
  // 그래서 여기서는 더 이상 옆걸음을 억지로 끼워넣지 않고 그냥 goTo를 그대로 씀.
  // 주민 일상 대화 및 상태별 대사
  const VIL_SPEECH = {
    ko: {
      stroll: ['동네 산책하니까 기분 좋다 🌸', '날씨가 정말 좋아 ☀️', '새소리가 맑네 🐦', '길 따라 걷는 게 제일 좋아 ✨', '마을이 점점 예뻐지네 🏘️', '공기가 상쾌하다 🍃'],
      rest: ['잠시 쉬었다 가야지 ☕', '여유로운 하루야 ✨', '풍경이 참 평화롭네 😌', '잠깐 다리 좀 쉬자', '따뜻한 햇살 좋다 ☀️'],
      play_pet: ['착하지~ 우리 귀염둥이 💕', '신나게 놀자! 🎾', '꼬리 흔드는 것 봐 너무 귀여워 ✨', '간식 줄까? 🍖', '산책 좋아하지? 🐾'],
      road_none: ['길이 없어요 😢', '길이 연결되지 않았어요 🚧', '어디로 가야 하지? 🧭'],
      road_cut: ['길이 끊겼어요! ⚠️', '길을 찾는 중... 🧭', '돌아가야겠네 ↩️']
    },
    ru: {
      stroll: ['Как приятно гулять по деревне! 🌸', 'Отличная погода ☀️', 'Птицы так красиво поют 🐦', 'Люблю ходить по дорожкам ✨', 'Деревня становится краше 🏘️'],
      rest: ['Отдохну немного ☕', 'Такой спокойный день ✨', 'Очень мирный вид 😌', 'Посижу чуток', 'Приятное солнышко ☀️'],
      play_pet: ['Хороший мой, умница! 💕', 'Поиграем! 🎾', 'Как виляет хвостиком! ✨', 'Хочешь вкусняшку? 🍖', 'Любишь гулять? 🐾'],
      road_none: ['Нет дороги 😢', 'Дорога не соединена 🚧', 'Куда же идти? 🧭'],
      road_cut: ['Дорога оборвалась! ⚠️', 'Ищу дорогу... 🧭', 'Придётся вернуться ↩️']
    }
  };

  function villagerStep(dt, actors, mkActor, alive, goTo, walk) {
    if (typeof S === 'undefined' || !S || !S.town || !S.clock) return;
    const m = S.clock.m, want = m < 7 * 60 || m >= 22 * 60 ? 0 : Math.min(14, Math.floor(pop(S) / 3));
    vT -= dt;
    const lang = (S.lang === 'ru' ? 'ru' : 'ko');
    const spLines = VIL_SPEECH[lang];

    // 스폰 주기: 인구수에 맞추어 스폰
    if (V.length < want && vT <= 0) {
      vT = 2 + Math.random() * 4;
      const home = pickHome(S);
      // 도로가 연결되어 있지 않은 집에서는 주민이 밖으로 나오지 않음
      if (home && isHouseAccessible(S, home)) {
        const dests = S.town.objs.filter(o => VISIT[o.k] && isFacilityAccessible(S, o));
        if (typeof PARK !== 'undefined' && PARK.isBuilt() && typeof PARK_POS === 'function' && isFacilityAccessible(S, 'park')) {
          const pp = PARK_POS();
          dests.push({ id: 'park_lot', k: 'park', x: pp.x, y: pp.y, r: 0 });
        }
        if (typeof VILLAGE !== 'undefined' && typeof VILLAGE.LAKE === 'function' && S.village && S.village.lake && isFacilityAccessible(S, 'lake')) {
          const lp = VILLAGE.LAKE();
          if (lp && lp.x < 1000) {
            dests.push({ id: 'lake_lot', k: 'lake', x: lp.x, y: lp.y, r: 0 });
          }
        }

        const hd = doorOf(home), id = 'vil' + (++vSeq);
        const res = pickResidentOf(S, home);
        const look = res ? ART.randomHuman(res.seed) : ART.randomHuman(vSeq * 7919 + home.id);

        // 다양한 행동 아젠다 (산책, 휴식, 펫과 놀기, 시설 방문 등 2~4개 행동 혼합)
        const possibleActions = ['stroll', 'rest'];
        if (dests.length > 0) possibleActions.push('visit', 'visit');
        // 펫을 입양하여 실제로 키우고 있는 주민만 펫과 놀거나 산책시킴
        if (res && res.pets && res.pets.length > 0) possibleActions.push('play_pet');

        const agenda = [];
        const numActs = 2 + Math.floor(Math.random() * 3); // 2~4개 행동
        for (let na = 0; na < numActs; na++) {
          agenda.push(possibleActions[Math.floor(Math.random() * possibleActions.length)]);
        }

        const a = mkActor(id, 'vil', hd.x + .5, hd.y + .5, {
          look,
          speed: 1.1 + Math.random() * .6,
          baseSpeed: 1.3,
          home: home.id,
          residentId: res ? res.id : null,
          st: 'start',
          age: 0,
          agenda,
          agendaIdx: 0,
          dests,
          hd
        });

        const walkablePets = res && res.pets ? res.pets.filter(p => typeof ART !== 'undefined' && ART.roams && ART.roams(p.sp)) : [];
        if (walkablePets.length) {
          a.pet = rpick(walkablePets).sp;
        } else {
          a.pet = null;
        }

        // 주민 행동 시작 함수
        startVillagerNextAction(a, S, goTo, spLines);
        V.push(id);
      }
    }
  function startVillagerNextAction(a, s, goTo, spLines) {
    if (!a) return;
    const agenda = a.agenda || ['stroll'];
    if (a.agendaIdx >= agenda.length) {
      // 모든 일정이 끝났으므로 길을 따라 집으로 복귀
      a.st = 'back';
      a.emo = '🏠';
      a.emoT = 4;
      const h = s && s.town && s.town.objs && s.town.objs.find(o => o.id === a.home);
      const hd = h ? doorOf(h) : (a.hd || { x: a.x, y: a.y });
      goTo(a, hd.x + .5, hd.y + .5, () => { a.st = 'done'; });
      return;
    }

    const currentAct = agenda[a.agendaIdx++];
    a.st = currentAct;

    if (currentAct === 'stroll') {
      // 1. 산책: 연결된 도로 타일 중 하나를 골라 산책
      const R = roadSet(s);
      const roadArr = [...R];
      let targetTile = null;
      if (roadArr.length > 0) {
        for (let tries = 0; tries < 8; tries++) {
          const cand = roadArr[Math.floor(Math.random() * roadArr.length)].split(',').map(Number);
          if (Math.hypot(cand[0] - a.x, cand[1] - a.y) < 18) { targetTile = { x: cand[0] + .5, y: cand[1] + .5 }; break; }
        }
      }
      if (!targetTile) targetTile = { x: a.x, y: a.y };
      a.emo = rpick(['🌸', '☀️', '🍃', '🚶']);
      a.emoT = 5;
      goTo(a, targetTile.x, targetTile.y, () => {
        a.st = 'idle';
        a.tt = 3 + Math.random() * 4;
        a.say = rpick(spLines.stroll);
        a.sayT = 3.2;
      });
    } else if (currentAct === 'rest') {
      // 2. 휴식: 길 위나 벤치에서 잠시 멈춰서 휴식 (v2026-10-09: 너무 오래 서있지 않도록 2초 안팎으로 단축)
      a.st = 'idle';
      a.tt = 1.6 + Math.random() * 0.8;
      a.sit = Math.random() < 0.35;
      a.emo = rpick(['☕', '🍃', '🌸', '😌', '🥤']);
      a.emoT = a.tt;
      a.say = rpick(spLines.rest);
      a.sayT = 3.5;
    } else if (currentAct === 'play_pet') {
      // 3. 펫과 놀기: 귀여운 펫과 상호작용
      a.st = 'idle';
      a.tt = 4 + Math.random() * 4;
      a.emo = rpick(['💕', '🎾', '🦴', '🐾']);
      a.emoT = a.tt;
      a.say = rpick(spLines.play_pet);
      a.sayT = 3.5;
      if (a.residentId) {
        const r2 = residentById(s, a.residentId);
        if (r2) r2.happy = Math.round(Math.min(100, (r2.happy || 70) + 1));
      }
    } else if (currentAct === 'visit') {
      // 4. 시설 방문: 접근 가능한 시설만 방문
      const dests = (a.dests || []).filter(o => isFacilityAccessible(s, o));
      if (!dests.length) {
        // 방문할 수 있는 시설이 없으면 산책으로 대체
        a.st = 'idle';
        a.tt = 3;
        a.say = rpick(spLines.road_none);
        a.sayT = 2.5;
        return;
      }
      const dst = rpick(dests);
      const [spot, inside] = visitSpot(dst);
      a.emo = VISIT[dst.k] || '✨';
      a.inside = inside;
      a.dstK = dst.k;
      goTo(a, spot.x, spot.y, () => {
        a.st = 'in';
        a.tt = dst.k === 'zoo' ? 22 + Math.random() * 14 : dst.k === 'park' ? 5 + Math.random() * 15 : dst.k === 'lake' ? 10 + Math.random() * 16 : 5 + Math.random() * 7;
        a.hidden = a.inside;
        if (!a.inside) a.emoT = 7;
        if (dst.k === 'zoo') {
          a.zooOrigin = { x: dst.x, y: dst.y };
          a.zooSayT = 1.0 + Math.random() * 2.0;
          a.zooFeedT = 2.0 + Math.random() * 2.5;
        }
        if (dst.k === 'park') { a.parkOrigin = { x: dst.x, y: dst.y }; a.parkSayT = .8 + Math.random() * 1.6; }
        if (dst.k === 'lake') {
          a.lakeOrigin = { x: dst.x, y: dst.y };
          a.lakeSayT = 0.8 + Math.random() * 1.6;
          a.lakeAct = (spot && spot.act) || (Math.random() < 0.55 ? 'fish' : 'rest');
          if ((spot && spot.sit) || (a.lakeAct === 'rest' && Math.random() < 0.6)) a.sit = true;
          if (a.lakeAct === 'fish') { a.emo = '🎣'; a.fishTug = 0; a.fishBiteT = 2.0 + Math.random() * 3.5; }
        }
      });
    }
  }
    // 유기동물 보관소 전담 직원의 자동 케어 (밥주기, 놀아주기, 청소하기 자동 유지)
    if (S.shelter && S.shelter.pets && S.shelter.pets.length > 0) {
      for (const p of S.shelter.pets) {
        p.hunger = 100;
        p.clean = 100;
        p.happy = 100;
        p.stress = 0;
        p.bored = 0;
      }
    }
    for (let i = V.length - 1; i >= 0; i--) {
      const id = V[i], a = actors.get(id); if (!a) { V.splice(i, 1); continue; }
      alive.add(id); a.age += dt; if (a.emoT > 0) a.emoT -= dt;
      if (a.sayT > 0) { a.sayT -= dt; if (a.sayT <= 0) a.say = null; }
      // v2026-10-09: "길에 가만히 서있는 사람들" -- 목적지로 가려고 goTo()를 불렀는데 길이 끊겨 있어서
      // 길찾기가 실패하면(path가 비어있고 콜백도 안 불림) st가 'stroll'/'visit'/'back'에 그대로 멈춰
      // 영원히 다음 행동으로 못 넘어가던 버그. 2초 넘게 안 움직이면 그냥 다음 행동으로 넘겨줌.
      if ((a.st === 'stroll' || a.st === 'visit' || a.st === 'back') && (!a.path || !a.path.length) && !a.moving) {
        a._stuckT = (a._stuckT || 0) + dt;
        if (a._stuckT > 2) {
          a._stuckT = 0;
          if (a.st === 'back') a.st = 'done';
          else startVillagerNextAction(a, S, goTo, spLines);
        }
      } else {
        a._stuckT = 0;
      }
      if (a.st === 'idle') {
        a.tt -= dt;
        if (a.tt <= 0) {
          a.sit = false;
          startVillagerNextAction(a, S, goTo, spLines);
        }
      }
      if (a.st === 'in') {
        a.tt -= dt;
        // 동물원 관람 및 먹이주기: 관람로 순회, 동물들에게 먹이 던지기, 감탄 대사 및 행복도 상승
        if (a.dstK === 'zoo' && a.zooOrigin) {
          a.zooSayT = (a.zooSayT == null ? 2 : a.zooSayT) - dt;
          a.zooFeedT = (a.zooFeedT == null ? 2.5 : a.zooFeedT) - dt;

          // 1. 동물들에게 먹이주기
          if (a.zooFeedT <= 0 && a.tt > 1) {
            a.zooFeedT = 3.5 + Math.random() * 4.0;
            const foodEmotes = ['🍖', '🌿', '🐟', '🍎', '🥕', '🌾', '🍪', '🍼'];
            a.emo = foodEmotes[Math.floor(Math.random() * foodEmotes.length)];
            a.emoT = 2.4;

            // 동물원 행복도/먹이 반응 업데이트 (모든 구역 동물들이 행복하게 밥 먹는 모션 전환)
            if (S && S.zoo) {
              S.zoo.lastFed = Date.now();
              S.zoo.visitors = (S.zoo.visitors || 0) + 1;
              S.zoo.coins = (S.zoo.coins || 0) + 30;
            }

            // 주민 개인 행복도 상승
            if (a.residentId) {
              const r2 = residentById(S, a.residentId);
              if (r2) r2.happy = Math.round(Math.min(100, (r2.happy || 70) + 3));
            }

            // 마을 전체 행복도 상승
            if (S && S.town) {
              S.town.hap = Math.round(Math.min(100, (S.town.hap || 75) + 0.15) * 10) / 10;
            }
          }

          // 2. 동물 구경 감탄 대사 & 관람로 산책
          if (a.zooSayT <= 0 && a.tt > 1) {
            a.zooSayT = 4.0 + Math.random() * 4.5;
            const msgsKo = [
              '와! 아기 동물들 너무 사랑스럽다 💕',
              '동물원 오니까 힐링돼요 🌿',
              '맛있게 먹어 귀염둥이들아! 🍖',
              '아기 판다가 장난치고 있어 너무 귀여워 ✨',
              '펭귄들 뒤뚱뒤뚱 걷는 모습 봐! 🐧',
              '기린이 목을 쭉 뻗고 있어요 🦒',
              '아기 코끼리 코 흔드는 거 사랑스러워 ✨',
              '호랑이가 위풍당당 멋지네! 🐯',
              '하마가 물속에서 첨벙거려요 🌊',
              '마을에 동물원이 있어서 정말 행복해! 🥰'
            ];
            const msgsRu = [
              'Какие милые зверята! 💕',
              'В зоопарке так спокойно и радостно 🌿',
              'Кушайте вкусно, малыши! 🍖',
              'Маленькая панда так забавно играет! ✨',
              'Смотрите, как пингвины ходят! 🐧',
              'Жираф такой высокий 🦒',
              'Слоник просто прелесть ✨',
              'Какой величественный тигр! 🐯',
              'Так здорово, что у нас есть зоопарк! 🥰'
            ];
            const msgs = S.lang === 'ru' ? msgsRu : msgsKo;
            a.say = msgs[Math.floor(Math.random() * msgs.length)];
            a.sayT = 3.2;

            // 관람로의 다른 동물 구역으로 이동해서 구경
            if (Math.random() < 0.65 && (!a.path || !a.path.length)) {
              const spots = [
                [15, 13], // 중앙 분수대 광장
                [11, 20], // 극지 펭귄 빙하 관람로
                [6, 15],  // 열대 하마 라군 관람로
                [3, 10],  // 코끼리 쉼터 전망대
                [9, 6],   // 사바나 사파리 관람로
                [14, 2],  // 판다 대나무 숲 관람로
                [21, 5],  // 레서판다 수변 서식지 관람로
                [23, 11], // 사파리 대초원 관람로
                [20, 18], // 중앙 진입 보도
                [24, 22]  // 동물원 정문 광장
              ];
              const sp = spots[Math.floor(Math.random() * spots.length)];
              goTo(a, a.zooOrigin.x + sp[0], a.zooOrigin.y + sp[1]);
            }
          }
        }
        // v2026-10-08: "공원 가면 한곳에 멍하니 서있다가 나오는게 너무 단순해, 걷기도 하고 혼잣말도 하고"
        // -- 공원에 머무는 동안(a.tt가 0 될 때까지) 주기적으로 (a) 공원 안 다른 포인트로 몇 걸음
        // 더 걸어가보거나 (b) 머리 위에 속마음 한마디를 띄움. 랜덤으로 둘 중 하나씩 골라 반복.
        if (a.dstK === 'park' && a.parkOrigin) {
          a.parkSayT = (a.parkSayT == null ? 2 : a.parkSayT) - dt;
          if (a.parkSayT <= 0 && a.tt > 1) {
            a.parkSayT = 3 + Math.random() * 4;
            const msgs = PARK_SAY[S.lang] || PARK_SAY.ko;
            a.say = msgs[Math.floor(Math.random() * msgs.length)]; a.sayT = 3.2;
            if (Math.random() < .55 && (!a.path || !a.path.length)) {
              const [u, v] = PARK_SPOTS[Math.floor(Math.random() * PARK_SPOTS.length)];
              goTo(a, a.parkOrigin.x + u, a.parkOrigin.y + v);
            }
          }
        }
        // v2026-10-08: 호수 체류 중 행동: 낚시하는 사람은 입질/손맛/물고기 이펙트, 쉬는 사람은 힐링 산책 & 대사
        if (a.dstK === 'lake' && a.lakeOrigin) {
          a.lakeSayT = (a.lakeSayT == null ? 2 : a.lakeSayT) - dt;
          if (a.lakeAct === 'fish') {
            a.fishBiteT = (a.fishBiteT == null ? 3 : a.fishBiteT) - dt;
            if (a.fishBiteT <= 0) {
              a.fishBiteT = 3.5 + Math.random() * 4.5;
              a.fishTug = 2.0;
              a.emo = Math.random() < 0.5 ? '❗' : '🐟';
              a.emoT = 2.0;
              if (S.town) S.town.hap = Math.min(100, (S.town.hap || 75) + 0.06);
            }
            if (a.fishTug > 0) a.fishTug -= dt;
          }
          if (a.lakeSayT <= 0 && a.tt > 1) {
            a.lakeSayT = 3.5 + Math.random() * 4.5;
            const msgs = a.lakeAct === 'fish' ? (LAKE_FISH_SAY[S.lang] || LAKE_FISH_SAY.ko) : (LAKE_REST_SAY[S.lang] || LAKE_REST_SAY.ko);
            a.say = msgs[Math.floor(Math.random() * msgs.length)]; a.sayT = 3.2;
            if (a.lakeAct === 'rest' && Math.random() < 0.45 && (!a.path || !a.path.length)) {
              const restSpots = LAKE_SPOTS.filter(s => s.act === 'rest');
              const sp2 = restSpots[Math.floor(Math.random() * restSpots.length)];
              if (sp2) {
                a.sit = !!sp2.sit;
                goTo(a, a.lakeOrigin.x + sp2.u, a.lakeOrigin.y + sp2.v);
              }
            }
          }
        }
        if (a.tt <= 0) {
          // 유기동물 보관소 방문 시 하루 2~3회 주민 입양 발생 (직원이 손님에게 추천 및 판매/입양)
          if (a.dstK === 'shelter' && S.shelter && S.shelter.pets && S.shelter.pets.length > 0) {
            S.shelter.day = S.shelter.day || (S.clock ? S.clock.day : 1);
            if (S.shelter.day !== (S.clock ? S.clock.day : 1)) { S.shelter.day = S.clock.day; S.shelter.adoptionsToday = 0; }
            if ((S.shelter.adoptionsToday || 0) < 3 && Math.random() < .6) {
              const petIdx = Math.floor(Math.random() * S.shelter.pets.length);
              const adopted = S.shelter.pets.splice(petIdx, 1)[0];
              if (adopted) {
                S.shelter.adoptionsToday = (S.shelter.adoptionsToday || 0) + 1;
                S.shelter.totalAdopted = (S.shelter.totalAdopted || 0) + 1;
                const fee = 600 + Math.floor(Math.random() * 400);
                S.coins += fee;
                a.pet = adopted.sp;
                if (typeof toast === 'function') {
                  const rawStaff = (S.shelter.staff && S.shelter.staff.name) || '미소';
                  const staffName = rawStaff === '미소' ? t('shelterStaffDefaultName') : rawStaff;
                  const spN = typeof spName === 'function' ? spName(adopted.sp) : adopted.sp;
                  const pName = t('stray_' + adopted.sp) && ['길강아지', '길고양이', '길토끼', '길쥐', '길동물'].includes(adopted.name) ? t('stray_' + adopted.sp) : adopted.name;
                  toast(t('shelterVillagerAdoptToast', { staff: staffName, name: pName, sp: spN, fee }));
                }
              }
            }
          }
          a.hidden = false;
          a.sit = false;
          startVillagerNextAction(a, S, goTo, spLines);
        }
      }
      if (a.st === 'done' || a.age > 150 || (want === 0 && a.st !== 'back' && a.age > 20)) { actors.delete(id); V.splice(i, 1); }
    }
    // 길가에 돌아다니는 길동물 (길강아지, 길토끼, 길쥐, 길고양이) 시뮬레이션
    strayStep(dt, actors, mkActor, alive, goTo);
  }
  // 길거리 유기동물 (길강아지, 길토끼, 길쥐, 길고양이)
  const STRAY_SP = [
    { sp: 'shiba', k: 'stray_shiba', name: '길강아지', icon: '🐕' },
    { sp: 'kitten', k: 'stray_kitten', name: '길고양이', icon: '🐈' },
    { sp: 'rabbit_white', k: 'stray_rabbit_white', name: '길토끼', icon: '🐇' },
    { sp: 'hamster', k: 'stray_hamster', name: '길쥐', icon: '🐹' }
  ];
  const ST = []; let stSeq = 0, stT = 1;
  function strayStep(dt, actors, mkActor, alive, goTo) {
    if (typeof S === 'undefined' || !S || !S.town) return;
    const W = Wd(S), H = Hd(S);
    // User Request 4: 동물원 입장료 수금은 자동으로 진행
    if (S.zoo && (S.zoo.coins || 0) > 0) {
      S.coins += S.zoo.coins;
      S.zoo.coins = 0;
    }
    // User Request 1: 길뿐만 아니라 집/건물/상점 안만 아니면 마을 어디든 잔디/마당/공원 등 야외 전역 탐색
    const isValidStraySpot = (x, y) => {
      // 1. 마을 전체 야외 범위 제한 (-14 .. 36, -10 .. 34)
      if (x < -14 || x > 36 || y < -10 || y > 34) return false;
      // 2. 가게 내부 및 유리벽/외벽 주변 절대 금지 (상점 침입 방지)
      if (x >= -2 && x <= W + 2 && y >= -2 && y <= H + 2) return false;
      // 3. 공공 대형 시설 및 호수/기념비 등 내부 금지
      if (inBig(x, y)) return false;
      if (S.cafe && S.cafe.built && typeof CAFE_POS === 'function') {
        const cp = CAFE_POS(S); if (x >= cp.x - 1 && x <= cp.x + cp.w && y >= cp.y - 1 && y <= cp.y + cp.d) return false;
      }
      if (S.hosp && S.hosp.built && typeof HOSP_POS === 'function') {
        const hp = HOSP_POS(S); if (x >= hp.x - 1 && x <= hp.x + hp.w && y >= hp.y - 1 && y <= hp.y + hp.d) return false;
      }
      // 4. 주민 가옥 및 배치된 건물/시설 부지 내부 금지
      for (const o of (S.town && S.town.objs) || []) {
        const g = fpOf(o.k, o.r);
        if (x >= o.x && x < o.x + g.w && y >= o.y && y < o.y + g.d) return false;
      }
      return true;
    };
    const validSpots = [];
    for (let sx = -10; sx <= 32; sx += 2) {
      for (let sy = -6; sy <= 28; sy += 2) {
        if (isValidStraySpot(sx, sy)) validSpots.push([sx, sy]);
      }
    }
    if (!validSpots.length) return;
    stT -= dt;
    if (ST.length < 4 && stT <= 0) {
      stT = 3 + Math.random() * 5;
      const [rx, ry] = validSpots[Math.floor(Math.random() * validSpots.length)];
      const def = STRAY_SP[Math.floor(Math.random() * STRAY_SP.length)];
      const id = 'stray_' + (++stSeq);
      mkActor(id, 'stray', rx + .5, ry + .5, {
        strayInfo: def,
        sp: def.sp,
        speed: .85 + Math.random() * .35,
        baseSpeed: .9,
        age: 0,
        pauseT: 1
      });
      ST.push(id);
    }
    for (let i = ST.length - 1; i >= 0; i--) {
      const id = ST[i], a = actors.get(id);
      if (!a) { ST.splice(i, 1); continue; }
      alive.add(id); a.age += dt;
      const cx = Math.floor(a.x), cy = Math.floor(a.y);
      // 만약 상점 내부나 건물 안으로 벗어났다면 유효한 야외 타일로 안전하게 재배치
      if (!isValidStraySpot(cx, cy)) {
        const [rx, ry] = validSpots[Math.floor(Math.random() * validSpots.length)];
        a.x = rx + .5; a.y = ry + .5; a.path = []; a.fx = null; a.fy = null; a.moving = false;
      }
      if (!a.moving && (!a.path || !a.path.length)) {
        a.pauseT = (a.pauseT || 0) - dt;
        if (a.pauseT <= 0) {
          a.pauseT = 1.6 + Math.random() * 3.2;
          // 인접한 야외 타일(풀밭, 잔디, 길, 광장)로 자연스럽게 산책 이동
          const neighbors = [[cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]]
            .filter(([nx, ny]) => isValidStraySpot(nx, ny));
          if (neighbors.length) {
            const next = neighbors[Math.floor(Math.random() * neighbors.length)];
            a.path = [{ x: next[0] + .5, y: next[1] + .5 }];
          }
        }
      }
      // 보호소가 지어져 있고 보호소에 자리가 있으면 길거리 유기동물도 자동 구조
      const hasShelter = has(S, 'shelter') > 0;
      const hasRescueStaff = Object.keys(S.staff || {}).some(k => ['care', 'porter'].includes(staffRoleOf(k)));
      if (a.age > 12 && hasShelter && hasRescueStaff) {
        S.shelter = S.shelter || { pets: [], seq: 1, staff: { name: '미소', lv: 1 }, adoptionsToday: 0, totalAdopted: 0 };
        S.shelter.pets = S.shelter.pets || [];
        if (S.shelter.pets.length < 12 && Math.random() < dt * 0.08) {
          const def = a.strayInfo || { sp: a.sp || 'shiba', k: 'stray_default', name: '길동물', icon: '🐾' };
          const sname = def.k ? t(def.k) : def.name;
          const np = (typeof G !== 'undefined' && G.mkPetPublic) ? G.mkPetPublic(S, def.sp) : {
            id: 'sh_' + Date.now() + '_' + Math.floor(Math.random() * 999),
            sp: def.sp,
            name: sname,
            coat: Math.floor(Math.random() * 999) + 1,
            sex: Math.random() < .5 ? 'm' : 'f',
            trait: 'calm',
            lv: 1, exp: 0, stars: 0
          };
          np.grow = 1; np.rescued = true;
          np.hunger = 35; np.clean = 30; np.stress = 55; np.bored = 45; np.happy = 50;
          S.shelter.pets.push(np);
          if (S.book) S.book[def.sp] = 1;
          if (typeof toast === 'function') {
            const rawStaff = (S.shelter.staff && S.shelter.staff.name) || '미소';
            const staffName = rawStaff === '미소' ? t('shelterStaffDefaultName') : rawStaff;
            toast(t('shelterAutoRescueToast', { staff: staffName, icon: def.icon, name: np.name, sp: sname }));
          }
          actors.delete(id); ST.splice(i, 1); continue;
        }
      }
      if (a.age > 180) { actors.delete(id); ST.splice(i, 1); }
    }
  }
  // ---------------- fishing at the lake ----------------
  const FISH = [
    { id: 'crucian', icon: '🐟', w: 44, c: [40, 90] }, { id: 'carp', icon: '🐠', w: 22, c: [120, 220] }, { id: 'catfish', icon: '🐡', w: 9, c: [260, 420] },
    { id: 'boot', icon: '👢', w: 12, c: [5, 5] }, { id: 'chest', icon: '🧰', w: 3, c: [600, 1500] }, { id: 'axolotl', icon: '🦎', w: 1, c: [0, 0] }, { id: 'shell', icon: '🐚', w: 9, c: [30, 60] } ];
  const FISH_MAX = 12;
  function apply(s, a, by) {
    { const r = applyTown(s, a, by); if (r !== undefined) return r; }
    if (a.t === 'follow') { s.follow = s.follow || {}; if (a.pid) s.follow[a.who] = a.pid; else delete s.follow[a.who]; return { ok: 1 }; }
    if (a.t === 'fishcast') {
      if (!(s.village && s.village.lake)) return { err: 'gone' };
      const day = s.clock ? s.clock.day : 1, f = s.fish = s.fish || { day, n: 0, log: {} }; if (f.day !== day) { f.day = day; f.n = 0; }
      if (f.n >= FISH_MAX) return { err: 'fishTired' };
      f.n++; if (!a.hit) return { ok: 1, fish: null, left: FISH_MAX - f.n };
      const tot = FISH.reduce((q, x) => q + x.w, 0); let r = Math.random() * tot, k = FISH[0]; for (const x of FISH) { r -= x.w; if (r <= 0) { k = x; break; } }
      let coins = k.c[0] + Math.floor(Math.random() * (k.c[1] - k.c[0] + 1)), pet = false;
      if (k.id === 'axolotl') { const h = s.home; if (h && (h.items || []).some(it => it.k === 'aquarium') && (h.pets || []).length < HOME_LV[h.lv].pets) { const np = G.mkPetPublic(s, 'axolotl'); np.grow = 1; h.pets.push(np); pet = true; } else coins = 1500; } // lives in the home aquarium; no room -> a finder's reward
      if (k.id === 'chest' && s.x) s.x.tickets = (s.x.tickets || 0) + 1;
      s.coins += coins; f.log[k.id] = (f.log[k.id] || 0) + 1;
      return { ok: 1, fish: k.id, icon: k.icon, coins, pet, left: FISH_MAX - f.n };
    }
    return undefined;
  }
  return { houses, drawHouse, houseSolid, followStep, drawFollower, apply, FISH, FISH_MAX,
    roadSet, roadNearShop, drawPlayerRoads, roadLine, drawRoadTool, ROAD_COST, ROAD_TYPES, pathRects, maxR, rotPt, ground, collect, zonesOf, laneOf, zoneAt, zoneCost, zoneLots, villagerStep, lvOf, capOf, upNeed, upCost, upLevel, canUp, LV_MAX, pow, has, inBig, bigBuilt, ensure, stats, tick, custK, maxAdd, spendK, bestPop, mood, pickHome, doorOf, canPlace, fpOf, kindCost, unlockedK, drawObj, depthOf, drawGhost, stageOf, pop, cap, countOf, occFrac, nearFree, fitShop, clearBuildingOverlaps, trainZones, overlapsTrain, relocateBuildingsOffTracks, syncResidents, pickResidentOf, residentById, residentsOf, addressOf,
    tierOf, houseCapOf, houseNextReq, houseUpOk, HOUSE_TIER_MAX, HOUSE_TIERS, HOUSE_TIER_NAMES, houseTierName, houseTierBuyCost, nextHouseSlotLevel, canPlaceNewHouse, getTownHouseImg,
    isRoadTile, isCrosswalk, getCrosswalkRows, isRailCrossing, getRailCrossingRows, isRailCrossingTile, drawRailCrossings, facilityEntrances, isEntranceConnected, isFacilityAccessible, isHouseAccessible, drawCrosswalks,
    DEF: TOWN_DEF,
    objs: () => (typeof S !== 'undefined' && S && S.town && S.town.objs) || [] };
})();
Object.assign(I18N.ko, {
  followBtn: '🐾 데리고 다니기', followStop: '🏠 집에 두기', followOn: '{n}와(과) 함께 산책해요 🐾', followOff: '{n}을(를) 집에 두었어요', followNoAqua: '물에 사는 아이는 데리고 다닐 수 없어요',
  fishTitle: '🎣 호수 낚시', fishDesc: '찌가 흔들리다 ❗가 뜨면 바로 당기세요! (오늘 {n}번 남음)', fishCast: '🎣 던지기', fishPull: '❗ 당기기!', fishWait: '기다리는 중… 🌊', fishEarly: '너무 빨리 당겼어요… 🐟💨', fishLate: '놓쳤어요! 조금 더 빨리 💨', fishTired: '오늘은 낚시를 많이 했어요. 내일 또 해요 😴',
  fishGot: '{i} {n}을(를) 잡았어요! 🪙{c}', fishGotPet: '🦎 액솔로틀을 잡았어요! 집 수족관에 넣어줬어요 ✨', fishNeedLake: '호수를 지으면 낚시할 수 있어요 🦢', fishDock: '🎣 낚시하기',
  fish_crucian: '붕어', fish_carp: '잉어', fish_catfish: '메기', fish_boot: '낡은 장화', fish_chest: '보물상자', fish_axolotl: '액솔로틀', fish_shell: '조개',
  villagerTitle: '마을 주민', villagerHappy: '행복도', villagerPets: '키우는 펫', villagerNoPet: '아직 키우는 펫이 없어요', villagerHome: '우리 마을 주민이에요',
  villagerWhyTitle: '💡 행복도는 왜 이럴까요?', villagerWhyTown: '마을 전체 분위기({n}%) 쪽으로 매일 조금씩 수렴해요', villagerWhyVisits: '나들이 {n}번 다녀왔어요 (다녀올 때마다 조금씩 올라요)', villagerWhyPets: '키우는 펫 {n}마리 (새 펫을 들일 때마다 크게 올라요)',
  tResidentsHere: '👨‍👩‍👧‍👦 여기 사는 사람들', tPetCountUnit: '마리', tAddr: '주소',
  visitorTitle: '외부 방문객', visitorDesc: '다른 마을에서 온 손님이에요. 펫샵으로 가는 중이에요!',
  tTierN: '티어{n}', tLvlNeed: '레벨 {n} 필요', tHouseNextCap: '⬆️ 티어{n}: 👥 {c}명', tHouseMaxTier: '최고 티어',
  tHouseLockLvl: '🔒 레벨 {n} 필요', tHouseLockPop: '🔒 마을 인구 {n}명 필요', tHouseSlotLock: '🔒 집을 더 늘리려면 레벨 {n} 필요',
  tTab_road: '길', tTabDesc_road: '마을 주민과 방문객이 걸어 다닐 수 있는 길을 깔거나 철거합니다. 레벨에 따라 다양한 길을 해금할 수 있어요.',
  tRoadEraseCard: '길 철거 (지우기)', tRoadEraseDesc: '깔려있는 길을 지우고 설치 비용을 100% 전액 환불받습니다.',
  tRoadPaveBtn: '설치하기', tRoadEraseBtn: '길 철거',
  roadNeedWarn: '길 연결 필요', roadCut: '길이 끊겼어요! ⚠️', roadNone: '길이 없어요 😢',
  roadRefundToast: '건물 확장 구역의 길 {n}개가 철거되어 🪙{c}이 100% 환불되었습니다!',
  roadErasedRefundToast: '길 {n}개가 철거되어 🪙{c}이 100% 환불되었습니다!',
  road_dirt: '기본 흙길', road_cobble: '자갈길', road_brick: '벽돌길', road_block: '보도블록길', road_step: '공원 산책로', road_stone: '고급 석재길', road_tile: '고급 타일길'
});
Object.assign(I18N.ru, {
  followBtn: '🐾 Взять с собой', followStop: '🏠 Оставить дома', followOn: 'Гуляем вместе с {n} 🐾', followOff: '{n} остался дома', followNoAqua: 'Водных питомцев нельзя взять с собой',
  fishTitle: '🎣 Рыбалка на озере', fishDesc: 'Когда появится ❗ — тяни! (сегодня осталось {n})', fishCast: '🎣 Забросить', fishPull: '❗ Тянуть!', fishWait: 'Ждём… 🌊', fishEarly: 'Слишком рано… 🐟💨', fishLate: 'Упустили! Чуть быстрее 💨', fishTired: 'На сегодня хватит рыбалки 😴',
  fishGot: 'Поймали: {i} {n}! 🪙{c}', fishGotPet: '🦎 Поймали аксолотля! Он в домашнем аквариуме ✨', fishNeedLake: 'Постройте озеро, чтобы рыбачить 🦢', fishDock: '🎣 Рыбачить',
  fish_crucian: 'Карась', fish_carp: 'Карп', fish_catfish: 'Сом', fish_boot: 'Старый сапог', fish_chest: 'Сундук', fish_axolotl: 'Аксолотль', fish_shell: 'Ракушка',
  villagerTitle: 'Житель деревни', villagerHappy: 'Счастье', villagerPets: 'Питомцы', villagerNoPet: 'Пока нет питомцев', villagerHome: 'Житель нашей деревни',
  villagerWhyTitle: '💡 Почему такое счастье?', villagerWhyTown: 'Постепенно приближается к настроению всего города ({n}%)', villagerWhyVisits: 'Прогулок: {n} (с каждой счастье немного растёт)', villagerWhyPets: 'Питомцев: {n} (новый питомец сильно поднимает счастье)',
  tResidentsHere: '👨‍👩‍👧‍👦 Жители дома', tPetCountUnit: '', tAddr: 'Адрес',
  visitorTitle: 'Гость из другого города', visitorDesc: 'Это гость из другого города. Идёт в зоомагазин!',
  tTierN: 'Уровень {n}', tLvlNeed: 'Нужен уровень {n}', tHouseNextCap: '⬆️ Уровень {n}: 👥 {c}', tHouseMaxTier: 'Макс. уровень',
  tHouseLockLvl: '🔒 Нужен уровень {n}', tHouseLockPop: '🔒 Нужно населения: {n}', tHouseSlotLock: '🔒 Для нового дома нужен уровень {n}',
  tTab_road: 'Дороги', tTabDesc_road: 'Стройте и сносите дорожки, по которым ходят жители. С уровнем открываются новые виды дорог.',
  tRoadEraseCard: 'Снос дорог', tRoadEraseDesc: 'Удаляйте дороги и получайте 100% возврат потраченных монет.',
  tRoadPaveBtn: 'Построить', tRoadEraseBtn: 'Снести',
  roadNeedWarn: 'Нужна дорога', roadCut: 'Дорога оборвалась! ⚠️', roadNone: 'Нет дороги 😢',
  roadRefundToast: 'Удалено {n} дорог под зданием, возвращено 🪙{c} (100%)!',
  roadErasedRefundToast: 'Снесено {n} дорог, возвращено 🪙{c} (100%)!',
  road_dirt: 'Грунтовая дорога', road_cobble: 'Брусчатка', road_brick: 'Кирпичная дорога', road_block: 'Тротуарная плитка', road_step: 'Парковая тропа', road_stone: 'Каменная дорога', road_tile: 'Элитная плитка'
});
