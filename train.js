// ================= CityVille-style Train System: Pet Express Wholesale Trading =================
// The train visits Pet Town Station periodically to buy specific pets & farm goods at premium wholesale prices (+20% ~ +60%).
// Players fulfill orders to earn bonus coins, player XP, and train station upgrades.

const TRAIN_DESTS = {
  family: {
    id: 'family',
    ic: '🏘️',
    name: '패밀리 타운',
    nameEn: 'Family Town',
    nameRu: 'Семейный городок',
    desc: '소형견, 고양이, 귀여운 소동물을 사랑하는 가족들의 마을',
    descEn: 'A cozy family town loving small dogs, cats, and pocket pets',
    descRu: 'Семьи с детьми с нетерпением ждут милых собачек, кошек и мелких зверюшек.',
    color: '#ff8a65',
    bgGrad: 'linear-gradient(135deg, #ffe0b2, #ffccbc)',
    bonusMin: 25,
    bonusMax: 35,
    prefCats: ['dog', 'cat', 'small'],
    prefSpecies: ['chihuahua_black', 'chihuahua_brown', 'maltese', 'pomeranian', 'bichon', 'scottish', 'ragdoll', 'russianblue', 'hamster', 'robo', 'rabbit', 'guinea']
  },
  bigcity: {
    id: 'bigcity',
    ic: '🏙️',
    name: '빅 시티',
    nameEn: 'Big City',
    nameRu: 'Большой город',
    desc: '트렌디하고 개성 넘치는 반려동물을 찾는 대도시 바이어',
    descEn: 'Metropolitan buyers seeking trendy and stylish companions',
    descRu: 'Городские покупатели ищут модных и стильных питомцев.',
    color: '#42a5f5',
    bgGrad: 'linear-gradient(135deg, #bbdefb, #b3e5fc)',
    bonusMin: 35,
    bonusMax: 45,
    prefCats: ['dog', 'cat', 'bird'],
    prefSpecies: ['corgi', 'shiba', 'beagle', 'poodle', 'frenchie', 'pug', 'bengal', 'siamese', 'sphynx', 'parrot', 'conure', 'cockatiel', 'ferret']
  },
  country: {
    id: 'country',
    ic: '🏡',
    name: '컨트리 빌리지',
    nameEn: 'Country Village',
    nameRu: 'Деревня Кантри',
    desc: '넓은 마당과 들판에서 뛰어놀 대형견과 목장 동물을 찾는 시골 마을',
    descEn: 'A pastoral countryside seeking large outdoor dogs and farm pets',
    descRu: 'В просторные дворы и поля требуются крупные собаки и фермерские питомцы.',
    color: '#66bb6a',
    bgGrad: 'linear-gradient(135deg, #c8e6c9, #dcedc8)',
    bonusMin: 30,
    bonusMax: 40,
    prefCats: ['dog', 'small', 'bird'],
    prefSpecies: ['golden', 'bordercollie', 'husky', 'samoyed', 'jindo', 'dachshund', 'rabbit', 'chinchilla', 'hedgehog', 'canary', 'budgie']
  },
  rich: {
    id: 'rich',
    ic: '💎',
    name: '리치 타운',
    nameEn: 'Rich Town',
    nameRu: 'Элитный район',
    desc: '최고급 및 희귀 반려동물을 아낌없는 가격에 매입하는 부촌 컬렉터',
    descEn: 'Luxury collectors buying rare and premium pets at top prices',
    descRu: 'Коллекционеры скупают редких и премиальных питомцев по высшей цене.',
    color: '#ab47bc',
    bgGrad: 'linear-gradient(135deg, #e1bee7, #f8bbd0)',
    bonusMin: 50,
    bonusMax: 60,
    prefCats: ['reptile', 'cat', 'dog', 'small'],
    prefSpecies: ['axolotl', 'gecko', 'turtle', 'ragdoll', 'sphynx', 'frenchie', 'husky_black', 'chihuahua_black', 'chihuahua_dark_brown', 'samoyed']
  }
};

const TRAIN_LV = {
  1: { lv: 1, name: '간이 승강장', slots: 5, bonusAdd: 0, cost: 0, waitMin: 5, coolMin: 15, perk: '품목 5개 (펫 3 · 농작물 1 · 카페 음식 1)' },
  2: { lv: 2, name: '시골 기차역', slots: 6, bonusAdd: 5, cost: 20000, waitMin: 6, coolMin: 13, perk: '품목 6개 · 납품 수량 증가 · 보너스 +5% · 정차 6분' },
  3: { lv: 3, name: '중앙 펫역', slots: 7, bonusAdd: 10, cost: 60000, waitMin: 7, coolMin: 11, perk: '품목 7개 · 수량 대폭 증가 · 보너스 +10% · 완납 선물상자' },
  4: { lv: 4, name: '골드 익스프레스역', slots: 8, bonusAdd: 15, cost: 150000, waitMin: 8, coolMin: 9, perk: '품목 8개 · 골드 열차 · 보너스 +15%' },
  5: { lv: 5, name: '그랜드 센트럴역', slots: 9, bonusAdd: 25, cost: 300000, waitMin: 10, coolMin: 7, perk: '품목 9개 · 최고 수량 특급 매입 · 보너스 +25%' }
};

const TRAIN = (() => {
  // Sound helper: locomotive steam whistle chord
  function whistle() {
    try {
      if (typeof beep === 'function') {
        beep([
          [587, 0.22, 'triangle'],
          [740, 0.22, 'triangle'],
          [880, 0.45, 'triangle'],
          [0, 0.06, 'triangle'],
          [740, 0.18, 'triangle'],
          [880, 0.55, 'triangle']
        ]);
      } else if (typeof SND !== 'undefined' && SND.pop) {
        SND.pop();
      }
    } catch (e) {}
  }

  function ensure(s) {
    if (!s) return null;
    if (!s.train) {
      s.train = {
        lv: 1,
        st: 'arrived', // starts in station so player experiences it right away!
        dest: 'family',
        nextTime: 0,
        departTime: Date.now() + 6 * 60 * 1000, // 6 minutes
        orders: [],
        claimedBonus: false,
        stats: { totalTrains: 0, totalPetsSold: 0, totalCoinsEarned: 0 }
      };
      generateOrders(s);
    }
    // Backward compatibility validation: guarantee minimum 5 orders with at least one pet, produce, and dish
    if (!s.train.orders || s.train.orders.length < 5 || !s.train.orders.some(o => o.kind === 'dish')) {
      generateOrders(s);
    }
    if (!s.train.stats) {
      s.train.stats = { totalTrains: 0, totalPetsSold: 0, totalCoinsEarned: 0 };
    }
    if (s.town && typeof TOWN !== 'undefined' && typeof TOWN.relocateBuildingsOffTracks === 'function' && !s.train._tracksChecked) {
      s.train._tracksChecked = true;
      TOWN.relocateBuildingsOffTracks(s);
    }
    return s.train;
  }

  function tr(key, params) {
    if (typeof t === 'function') {
      try {
        const res = t(key, params);
        if (res && res !== key) return res;
      } catch (e) {}
    }
    const lang = (typeof CFG !== 'undefined' && CFG.lang) || 'ko';
    const dict = (typeof I18N !== 'undefined' && I18N[lang]) || (typeof I18N !== 'undefined' && I18N.ko) || {};
    let str = dict[key] || key;
    if (params && typeof str === 'string') {
      for (const k in params) str = str.replaceAll('{' + k + '}', params[k]);
    }
    return str;
  }
  if (typeof window !== 'undefined') window.tr = tr;
  if (typeof globalThis !== 'undefined') globalThis.tr = tr;

  function destObj(destId) {
    return TRAIN_DESTS[destId] || TRAIN_DESTS.family;
  }

  function destName(destId) {
    const k = 'dest_' + destId;
    const translated = tr(k);
    if (translated && translated !== k) return translated;
    const d = destObj(destId);
    const lang = (typeof CFG !== 'undefined' && CFG.lang) || ((typeof S !== 'undefined' && S && S.lang) || 'ko');
    if (lang === 'ru' && d.nameRu) return d.nameRu;
    const isEn = lang === 'en';
    return isEn ? d.nameEn : d.name;
  }

  function destDesc(destId) {
    const k = 'dest_' + destId + '_desc';
    const translated = tr(k);
    if (translated && translated !== k) return translated;
    const d = destObj(destId);
    const lang = (typeof CFG !== 'undefined' && CFG.lang) || ((typeof S !== 'undefined' && S && S.lang) || 'ko');
    if (lang === 'ru' && d.descRu) return d.descRu;
    const isEn = lang === 'en';
    return isEn ? d.descEn : d.desc;
  }

  function lvName(lv) {
    const k = 'trainLv' + lv + '_name';
    const translated = tr(k);
    if (translated && translated !== k) return translated;
    return (TRAIN_LV[lv] && TRAIN_LV[lv].name) || ('Lv.' + lv);
  }

  function lvPerk(lv) {
    const k = 'trainLv' + lv + '_perk';
    const translated = tr(k);
    if (translated && translated !== k) return translated;
    return (TRAIN_LV[lv] && TRAIN_LV[lv].perk) || '';
  }

  function getPetName(spKey) {
    if (typeof spName === 'function') {
      try { const n = spName(spKey); if (n) return n; } catch (e) {}
    }
    const lang = (typeof CFG !== 'undefined' && CFG.lang) || 'ko';
    if (typeof SPECIES !== 'undefined' && SPECIES[spKey] && SPECIES[spKey].name) {
      const nmObj = SPECIES[spKey].name;
      if (typeof nmObj === 'object') return nmObj[lang] || nmObj.ko || spKey;
      return nmObj;
    }
    if (typeof t === 'function') {
      const k = t('sp_' + spKey);
      if (k && !k.startsWith('sp_')) return k;
    }
    return spKey;
  }

  function getCropName(cropKey) {
    const lang = (typeof CFG !== 'undefined' && CFG.lang) || 'ko';
    if (typeof t === 'function') {
      const k = t('crop_' + cropKey);
      if (k && !k.startsWith('crop_')) return k;
      const g = t('rg_' + cropKey);
      if (g && !g.startsWith('rg_')) return g;
      const g2 = t('good_' + cropKey);
      if (g2 && !g2.startsWith('good_')) return g2;
    }
    const ruMap = {
      wheat: 'Пшеница', carrot: 'Морковь', potato: 'Картофель', tomato: 'Томат', corn: 'Кукуруза',
      pumpkin: 'Тыква', lettuce: 'Салат', strawberry: 'Клубника', blueberry: 'Черника', grape: 'Виноград',
      apple: 'Яблоко', peach: 'Персик', orange: 'Апельсин', cherry: 'Вишня', lemon: 'Лимон',
      milk: 'Молоко', meat: 'Мясо', egg: 'Яйцо'
    };
    const koMap = {
      wheat: '밀', carrot: '당근', potato: '감자', tomato: '토마토', corn: '옥수수',
      pumpkin: '호박', lettuce: '상추', strawberry: '딸기', blueberry: '블루베리', grape: '포도',
      apple: '사과', peach: '복숭아', orange: '오렌지', cherry: '체리', lemon: '레몬',
      milk: '우유', meat: '고기', egg: '달걀'
    };
    if (lang === 'ru') return ruMap[cropKey] || koMap[cropKey] || cropKey;
    return koMap[cropKey] || cropKey;
  }

  function getCropIcon(cropKey) {
    const map = {
      wheat: '🌾', carrot: '🥕', potato: '🥔', tomato: '🍅', corn: '🌽',
      pumpkin: '🎃', lettuce: '🥬', strawberry: '🍓', blueberry: '🫐', grape: '🍇',
      apple: '🍎', peach: '🍑', orange: '🍊', cherry: '🍒', lemon: '🍋',
      milk: '🥛', meat: '🥩', egg: '🥚'
    };
    return map[cropKey] || '📦';
  }

  function getDishName(dishKey) {
    const lang = (typeof CFG !== 'undefined' && CFG.lang) || 'ko';
    if (typeof t === 'function') {
      const k = t('dish_' + dishKey);
      if (k && !k.startsWith('dish_')) return k;
    }
    const ruMap = {
      bread: 'Хлеб', saladbowl: 'Салат', tomatosoup: 'Томатный суп', pumpkinpie: 'Тыквенный пирог',
      milkshake: 'Милкшейк', cheese: 'Сыр', pancake: 'Блинчики', icecream: 'Мороженое',
      steak: 'Стейк', burger: 'Бургер', pizza: 'Пицца', meatstew: 'Рагу', applepie: 'Яблочный пирог',
      peachsmoothie: 'Смузи', fruitsalad: 'Фруктовый салат', lemonade: 'Лимонад', pearjuice: 'Грушевый сок',
      mangolassi: 'Манго ласси', fries: 'Картофель фри', cornsoup: 'Кукурузный суп', omelet: 'Омлет',
      sandwich: 'Сэндвич', strawberrycake: 'Клубничный торт', blueberrymuffin: 'Маффин', grapejuice: 'Виноградный сок'
    };
    const koMap = {
      bread: '빵', saladbowl: '샐러드', tomatosoup: '토마토 수프', pumpkinpie: '호박 파이',
      milkshake: '밀크셰이크', cheese: '수제 치즈', pancake: '팬케이크', icecream: '딸기 아이스크림',
      steak: '스테이크', burger: '햄버거', pizza: '피자', meatstew: '고기 스튜', applepie: '사과파이',
      peachsmoothie: '복숭아 스무디', fruitsalad: '과일 샐러드', lemonade: '레모네이드', pearjuice: '배 주스',
      mangolassi: '망고 라씨', fries: '감자튀김', cornsoup: '옥수수 수프', omelet: '오믈렛',
      sandwich: '샌드위치', strawberrycake: '딸기 케이크', blueberrymuffin: '블루베리 머핀', grapejuice: '포도 주스'
    };
    if (lang === 'ru') return ruMap[dishKey] || koMap[dishKey] || dishKey;
    return koMap[dishKey] || dishKey;
  }

  function getDishIcon(dishKey) {
    if (typeof CAFE_DISHES !== 'undefined' && Array.isArray(CAFE_DISHES)) {
      const d = CAFE_DISHES.find(x => x.id === dishKey);
      if (d && d.icon) return d.icon;
    }
    const map = {
      bread: '🍞', saladbowl: '🥗', tomatosoup: '🍲', pumpkinpie: '🥧',
      milkshake: '🥤', cheese: '🧀', pancake: '🥞', icecream: '🍨',
      steak: '🥩', burger: '🍔', pizza: '🍕', meatstew: '🥘', applepie: '🥧',
      peachsmoothie: '🍑', fruitsalad: '🥣', lemonade: '🍋', pearjuice: '🍐',
      mangolassi: '🥭', fries: '🍟', cornsoup: '🌽', omelet: '🍳',
      sandwich: '🥪', strawberrycake: '🍰', blueberrymuffin: '🧁', grapejuice: '🍇'
    };
    return map[dishKey] || '🍳';
  }

  function generateOrders(s) {
    if (!s || !s.train) return;
    const t = s.train;
    const curLv = t.lv || 1;
    const cfg = TRAIN_LV[curLv] || TRAIN_LV[1];
    const dest = destObj(t.dest);

    // Minimum 5 items: 3 pets, 1 produce, 1 cafe food
    // As train level increases, both slot count and item quantity increase!
    let petSlots = 3;
    let produceSlots = 1;
    let dishSlots = 1;

    if (curLv === 2) {
      petSlots = 3; produceSlots = 2; dishSlots = 1; // 6 slots
    } else if (curLv === 3) {
      petSlots = 4; produceSlots = 2; dishSlots = 1; // 7 slots
    } else if (curLv === 4) {
      petSlots = 4; produceSlots = 2; dishSlots = 2; // 8 slots
    } else if (curLv >= 5) {
      petSlots = 5; produceSlots = 2; dishSlots = 2; // 9 slots
    }

    const pLv = s.lv || s.level || 1;
    const allKeys = Object.keys((typeof SPECIES !== 'undefined' && SPECIES) || {});
    let cands = allKeys.filter(k => {
      const sp = SPECIES[k];
      if (!sp) return false;
      return (sp.unlock || 1) <= Math.max(3, pLv + 2);
    });
    if (!cands.length) cands = allKeys.slice(0, 10);

    const prefList = dest.prefSpecies.filter(k => SPECIES[k] && (SPECIES[k].unlock || 1) <= Math.max(3, pLv + 2));
    const catList = cands.filter(k => dest.prefCats.includes(SPECIES[k].cat));
    const pool = [...new Set([...prefList, ...catList, ...cands])];
    const shuffledPets = pool.sort(() => Math.random() - 0.5);

    const orders = [];
    let nextOrdId = 1;

    // 1. Pet Orders (at least 3 pets)
    for (let i = 0; i < petSlots; i++) {
      const spKey = shuffledPets[i % shuffledPets.length] || 'chihuahua_brown';
      const sp = (typeof SPECIES !== 'undefined' && SPECIES[spKey]) || { sell: 800, cost: 400, cat: 'dog' };
      const isPref = dest.prefSpecies.includes(spKey) || dest.prefCats.includes(sp.cat);
      const randBonus = Math.floor(dest.bonusMin + Math.random() * (dest.bonusMax - dest.bonusMin + 1));
      const totalBonusPct = randBonus + cfg.bonusAdd + (isPref ? 5 : 0);

      let count = 1;
      if (curLv >= 5 && Math.random() < 0.35) count = 3;
      else if (curLv >= 3 && Math.random() < 0.45) count = 2;

      const baseVal = Math.round((sp.sell || 800) * count);
      const trainPrice = Math.round(baseVal * (1 + totalBonusPct / 100) / 10) * 10;

      orders.push({
        id: nextOrdId++,
        kind: 'pet',
        sp: spKey,
        cat: sp.cat || 'dog',
        count: count,
        filled: 0,
        basePrice: baseVal,
        trainPrice: trainPrice,
        bonusPct: totalBonusPct,
        pref: isPref
      });
    }

    // 2. Farm Produce / Crop Orders (at least 1 crop, quantity scales with level)
    const farmPool = ['carrot', 'wheat', 'potato', 'tomato', 'corn', 'pumpkin', 'strawberry', 'milk', 'egg'];
    const shuffledCrops = [...farmPool].sort(() => Math.random() - 0.5);
    for (let i = 0; i < produceSlots; i++) {
      const cropId = shuffledCrops[i % shuffledCrops.length];
      const count = curLv === 1 ? (4 + Math.floor(Math.random() * 3)) :
                    curLv === 2 ? (6 + Math.floor(Math.random() * 4)) :
                    curLv === 3 ? (9 + Math.floor(Math.random() * 5)) :
                    curLv === 4 ? (12 + Math.floor(Math.random() * 6)) :
                                  (16 + Math.floor(Math.random() * 9));

      const unitBase = cropId === 'milk' ? 35 : cropId === 'egg' ? 30 : cropId === 'carrot' ? 35 : cropId === 'pumpkin' ? 50 : 30;
      const baseVal = unitBase * count;
      const randBonus = Math.floor(dest.bonusMin + Math.random() * (dest.bonusMax - dest.bonusMin + 1));
      const totalBonusPct = randBonus + cfg.bonusAdd + (dest.id === 'country' ? 5 : 0);
      const trainPrice = Math.round(baseVal * (1 + totalBonusPct / 100) / 10) * 10;

      orders.push({
        id: nextOrdId++,
        kind: 'produce',
        crop: cropId,
        count: count,
        filled: 0,
        basePrice: baseVal,
        trainPrice: trainPrice,
        bonusPct: totalBonusPct,
        pref: dest.id === 'country'
      });
    }

    // 3. Cafe Food / Dish Orders (at least 1 dish, quantity scales with level)
    const cafeLv = (s.cafe && s.cafe.lv) || 1;
    let dishList = (typeof CAFE_DISHES !== 'undefined' && Array.isArray(CAFE_DISHES))
      ? CAFE_DISHES.filter(d => (d.clv || 1) <= Math.max(1, cafeLv + 1)).map(d => d.id)
      : ['bread', 'saladbowl', 'tomatosoup', 'pancake', 'sandwich', 'burger'];
    if (!dishList.length) dishList = ['bread', 'saladbowl', 'tomatosoup'];
    const shuffledDishes = [...dishList].sort(() => Math.random() - 0.5);

    for (let i = 0; i < dishSlots; i++) {
      const dishId = shuffledDishes[i % shuffledDishes.length];
      const count = curLv === 1 ? (2 + Math.floor(Math.random() * 2)) :
                    curLv === 2 ? (3 + Math.floor(Math.random() * 2)) :
                    curLv === 3 ? (4 + Math.floor(Math.random() * 3)) :
                    curLv === 4 ? (6 + Math.floor(Math.random() * 3)) :
                                  (8 + Math.floor(Math.random() * 5));

      const dObj = (typeof CAFE_DISHES !== 'undefined' && Array.isArray(CAFE_DISHES)) ? CAFE_DISHES.find(x => x.id === dishId) : null;
      const unitBase = (dObj && typeof cafeDishPrice === 'function') ? Math.max(100, cafeDishPrice(dObj)) : 140;
      const baseVal = unitBase * count;
      const randBonus = Math.floor(dest.bonusMin + Math.random() * (dest.bonusMax - dest.bonusMin + 1));
      const totalBonusPct = randBonus + cfg.bonusAdd;
      const trainPrice = Math.round(baseVal * (1 + totalBonusPct / 100) / 10) * 10;

      orders.push({
        id: nextOrdId++,
        kind: 'dish',
        dish: dishId,
        count: count,
        filled: 0,
        basePrice: baseVal,
        trainPrice: trainPrice,
        bonusPct: totalBonusPct,
        pref: dest.id === 'bigcity'
      });
    }

    t.orders = orders;
    t.claimedBonus = false;
  }

  function allFilled(s) {
    if (!s || !s.train || !s.train.orders || !s.train.orders.length) return false;
    return s.train.orders.every(o => o.filled >= o.count);
  }

  const ARRIVE_DUR = 300000; // 5 minutes (300 seconds) for slow scenic approach
  const DEPART_DUR = 50000; // 50 seconds for slow, leisurely departure chugging peacefully south

  function tick(s) {
    if (!s) return;
    const t = ensure(s);
    const now = Date.now();
    const cfg = TRAIN_LV[t.lv] || TRAIN_LV[1];

    if (t.st === 'arrived') {
      if (now >= t.departTime) {
        // Depart train with animation
        t.st = 'departing';
        t.departStart = now;
        t.departDur = DEPART_DUR;
        t.departEnd = now + DEPART_DUR;
        whistle();
        if (typeof toast === 'function') {
          toast('🚂 ' + destName(t.dest) + '행 펫 익스프레스가 기적을 울리며 천천히 출발합니다!');
        }
      }
    } else if (t.st === 'departing') {
      if (now >= (t.departEnd || now)) {
        t.st = 'away';
        const coolMs = (cfg.coolMin || 15) * 60 * 1000;
        t.nextTime = now + coolMs;
        t.whistled = false;
      }
    } else if (t.st === 'approaching') {
      if (now >= (t.nextTime || now)) {
        t.st = 'arrived';
        t.expressCall = false;
        t.departTime = now + (cfg.waitMin || 5) * 60 * 1000;

        // Rotate destination
        const destKeys = Object.keys(TRAIN_DESTS).filter(k => k !== t.dest);
        t.dest = destKeys[Math.floor(Math.random() * destKeys.length)] || 'family';
        generateOrders(s);

        t.stats.totalTrains = (t.stats.totalTrains || 0) + 1;
        whistle();

        if (typeof toast === 'function') {
          toast('🚂 펫 익스프레스가 역에 정차했습니다! [' + destName(t.dest) + '행 특별 매입]');
        }
      }
    } else {
      // away state
      const rem = t.nextTime - now;
      if (rem <= ARRIVE_DUR) {
        // Starts visible slow arrival sequence!
        t.st = 'approaching';
        t.whistled = false;
        whistle();
        if (typeof toast === 'function') {
          toast('🔔 펫 익스프레스가 멀리서 서서히 역으로 진입하고 있습니다!');
        }
      }
    }
  }

  function deliver(s, orderId, specificPid) {
    ensure(s);
    const t = s.train;
    if (t.st !== 'arrived') return { err: 'trainNotHere' };

    const ord = t.orders.find(o => String(o.id) === String(orderId));
    if (!ord) return { err: 'orderNotFound' };
    if (ord.filled >= ord.count) return { err: 'orderAlreadyFilled' };

    if (ord.kind === 'produce') {
      const pr = (s.farm && s.farm.produce) || {};
      const have = pr[ord.crop] || 0;
      if (have < ord.count) return { err: 'noProduceAvailable' };
      pr[ord.crop] -= ord.count;
      const payout = ord.trainPrice;
      s.coins = (s.coins || 0) + payout;
      ord.filled = ord.count;
      t.stats.totalPetsSold = (t.stats.totalPetsSold || 0) + 1;
      t.stats.totalCoinsEarned = (t.stats.totalCoinsEarned || 0) + payout;

      if (typeof G !== 'undefined' && G.addXpPublic) G.addXpPublic(s, 25);
      if (typeof SND !== 'undefined' && SND.coin) SND.coin();

      return {
        ok: 1,
        payout,
        name: getCropName(ord.crop),
        bonusClaimable: allFilled(s) && !t.claimedBonus
      };
    }

    if (ord.kind === 'dish') {
      const cf = (s.cafe && s.cafe.dishes) || {};
      const have = cf[ord.dish] || 0;
      if (have < ord.count) return { err: 'noProduceAvailable' };
      cf[ord.dish] -= ord.count;
      const payout = ord.trainPrice;
      s.coins = (s.coins || 0) + payout;
      ord.filled = ord.count;
      t.stats.totalPetsSold = (t.stats.totalPetsSold || 0) + 1;
      t.stats.totalCoinsEarned = (t.stats.totalCoinsEarned || 0) + payout;

      if (typeof G !== 'undefined' && G.addXpPublic) G.addXpPublic(s, 30);
      if (typeof SND !== 'undefined' && SND.coin) SND.coin();

      return {
        ok: 1,
        payout,
        name: getDishName(ord.dish),
        bonusClaimable: allFilled(s) && !t.claimedBonus
      };
    }

    // Find candidate pet from shop pets (s.pets) first, then from home pets (s.home.pets)
    let pet = null;
    let fromShop = false;
    let shopIndex = -1;
    let homeIndex = -1;

    if (s.pets && Array.isArray(s.pets)) {
      if (specificPid) {
        shopIndex = s.pets.findIndex(p => p && p.id === specificPid && p.sp === ord.sp && !p.fav);
      } else {
        shopIndex = s.pets.findIndex(p => p && p.sp === ord.sp && !p.fav);
      }
      if (shopIndex >= 0) {
        pet = s.pets[shopIndex];
        fromShop = true;
      }
    }

    if (!pet && s.home && s.home.pets && Array.isArray(s.home.pets)) {
      if (specificPid) {
        homeIndex = s.home.pets.findIndex(p => p && p.id === specificPid && p.sp === ord.sp && !p.fav);
      } else {
        homeIndex = s.home.pets.findIndex(p => p && p.sp === ord.sp && !p.fav);
      }
      if (homeIndex >= 0) {
        pet = s.home.pets[homeIndex];
        fromShop = false;
      }
    }

    if (!pet) {
      const hasFavShop = s.pets && s.pets.some(p => p && p.sp === ord.sp && p.fav);
      const hasFavHome = s.home && s.home.pets && s.home.pets.some(p => p && p.sp === ord.sp && p.fav);
      if (hasFavShop || hasFavHome) return { err: 'petIsFavorite' };
      return { err: 'noPetAvailable' };
    }

    const payout = ord.trainPrice;

    // Remove pet from slot
    if (fromShop) {
      s.pets[shopIndex] = null;
    } else if (s.home && s.home.pets) {
      s.home.pets.splice(homeIndex, 1);
    }

    // Clean up world actor
    if (typeof World !== 'undefined' && World.actors) {
      World.actors.delete('p' + pet.id);
      World.actors.delete('home_pet_' + pet.id);
    }

    s.coins = (s.coins || 0) + payout;
    s.stats = s.stats || {};
    s.stats.sold = (s.stats.sold || 0) + 1;
    s.today = s.today || {};
    s.today.sold = (s.today.sold || 0) + 1;

    // Add player XP
    const xpAmt = Math.round(((typeof SPECIES !== 'undefined' && SPECIES[pet.sp]) ? SPECIES[pet.sp].sell : 500) / 7) + 20;
    if (typeof G !== 'undefined' && G.addXpPublic) {
      G.addXpPublic(s, xpAmt);
    }

    // Increment filled count
    ord.filled++;
    t.stats.totalPetsSold = (t.stats.totalPetsSold || 0) + 1;
    t.stats.totalCoinsEarned = (t.stats.totalCoinsEarned || 0) + payout;

    if (typeof SND !== 'undefined' && SND.coin) SND.coin();

    const bonusClaimable = allFilled(s) && !t.claimedBonus;

    return {
      ok: 1,
      payout,
      name: pet.name || getPetName(pet.sp),
      bonusClaimable
    };
  }

  function claimBonus(s) {
    ensure(s);
    const t = s.train;
    if (!allFilled(s) || t.claimedBonus) return { err: 'notEligible' };

    t.claimedBonus = true;
    const bonusCoin = 2500 * t.lv;
    s.coins = (s.coins || 0) + bonusCoin;

    if (typeof G !== 'undefined' && G.addXpPublic) {
      G.addXpPublic(s, 60);
    }
    if (typeof SFX !== 'undefined' && SFX.tada) {
      SFX.tada();
    }

    return { ok: 1, bonusCoin };
  }

  function sendTrain(s) {
    ensure(s);
    const t = s.train;
    if (t.st !== 'arrived') return { err: 'notHere' };

    whistle();
    t.st = 'departing';
    t.departStart = Date.now();
    t.departDur = DEPART_DUR;
    t.departEnd = Date.now() + DEPART_DUR;
    if (typeof toast === 'function') {
      toast(tr('trainSent'));
    }

    return { ok: 1 };
  }

  function callTrain(s) {
    ensure(s);
    const t = s.train;
    if (t.st === 'arrived') return { err: 'alreadyHere' };

    const cost = 5000;
    if ((s.coins || 0) < cost) return { err: 'notEnoughCoins' };

    s.coins -= cost;
    t.st = 'approaching';
    t.expressCall = true;
    t.arriveStart = Date.now();
    t.expressDur = 20000; // 20s scenic approach
    t.nextTime = Date.now() + 20000;
    t.whistled = false;
    whistle();
    if (typeof toast === 'function') {
      toast(tr('trainCalled'));
    }
    return { ok: 1 };
  }

  function upgradeStation(s) {
    ensure(s);
    const t = s.train;
    const curLv = t.lv || 1;
    if (curLv >= 5) return { err: 'maxLevel' };

    const nxt = TRAIN_LV[curLv + 1];
    if (!nxt) return { err: 'maxLevel' };
    if ((s.coins || 0) < nxt.cost) return { err: 'notEnoughCoins' };

    s.coins -= nxt.cost;
    t.lv = curLv + 1;
    if (typeof SFX !== 'undefined' && SFX.tada) SFX.tada();

    return { ok: 1, newLv: t.lv };
  }

  function countOwned(s, spKey) {
    if (!s) return 0;
    let count = 0;
    if (s.pets && Array.isArray(s.pets)) {
      count += s.pets.filter(p => p && p.sp === spKey && !p.fav).length;
    }
    if (s.home && s.home.pets && Array.isArray(s.home.pets)) {
      count += s.home.pets.filter(p => p && p.sp === spKey && !p.fav).length;
    }
    return count;
  }

  // Hook into G.apply
  function apply(s, a, by) {
    switch (a.t) {
      case 'traindeliver': {
        const res = deliver(s, a.oid, a.pid);
        if (res.ok) {
          if (res.bonusClaimable && typeof toast === 'function') {
            setTimeout(() => toast('🎉 모든 화물칸 납품 완료! 완납 보너스를 수령하세요!'), 400);
          }
          const payoutFmt = (typeof fmt === 'function') ? fmt(res.payout) : res.payout;
          return { ok: 1, fx: 'coin', msg: 'trainDelivered', p: { n: res.name, c: payoutFmt } };
        }
        return { err: res.err };
      }
      case 'trainclaimbonus': {
        const res = claimBonus(s);
        if (res.ok) {
          const coinFmt = (typeof fmt === 'function') ? fmt(res.bonusCoin) : res.bonusCoin;
          return { ok: 1, fx: 'level', msg: 'trainBonusClaimed', p: { c: coinFmt } };
        }
        return { err: res.err };
      }
      case 'trainsend': {
        const res = sendTrain(s);
        if (res.ok) return { ok: 1, msg: 'trainSent' };
        return { err: res.err };
      }
      case 'traincall': {
        const res = callTrain(s);
        if (res.ok) return { ok: 1, msg: 'trainCalled' };
        return { err: res.err };
      }
      case 'trainup': {
        const res = upgradeStation(s);
        if (res.ok) return { ok: 1, fx: 'level', msg: 'trainStationUp', p: { n: res.newLv } };
        return { err: res.err };
      }
    }
    return undefined;
  }

  // Train sprite asset loading
  const trainUrl = (typeof assetUrl === 'function') ? assetUrl('spr/train.png') : 'spr/train.png';
  const TRAIN_IMG = (typeof ASSET_CACHE !== 'undefined') ? ASSET_CACHE.load(trainUrl) : ((typeof Image !== 'undefined') ? new Image() : null);
  if (TRAIN_IMG && !TRAIN_IMG.src) {
    TRAIN_IMG.crossOrigin = 'anonymous';
    TRAIN_IMG.src = trainUrl;
  }

  // Station sprite assets loading (Levels 1 to 5)
  const STATION_IMGS = [null];
  if (typeof Image !== 'undefined') {
    for (let i = 1; i <= 5; i++) {
      const u = (typeof assetUrl === 'function') ? assetUrl('spr/station_' + i + '.png') : ('spr/station_' + i + '.png');
      const im = (typeof ASSET_CACHE !== 'undefined') ? ASSET_CACHE.load(u) : new Image();
      im.crossOrigin = 'anonymous';
      if (!im.src) im.src = u;
      STATION_IMGS.push(im);
    }
  }

  // Isometric Coordinates for Train Track & Station
  // Running North to South along the Y-axis across the map,
  // located east of the main road (across from the pet shop).
  // Station moved further North as requested by user.
  const STAT_X = () => ((typeof S !== 'undefined' && S && S.room && S.room.w) || 8) + 9.2;
  const STAT_Y = () => -4.2; // Moved further North as requested
  const TRACK_X = () => STAT_X() + 3.3; // Railway track runs alongside platform

  function solid(x, y) {
    const sx = STAT_X();
    const sy = STAT_Y();
    // Station building walls (located on west side of platform facing tracks)
    const bx = sx + 0.2, by = sy + 0.6, bw = 2.4, bd = 3.6;
    if (x >= bx && x <= bx + bw && y >= by && y <= by + bd) return true;
    return false;
  }

  function drawTrack(c, x, y0, y1) {
    const q = (gx, gy, z = 0) => [ISO.wx(gx, gy), ISO.wy(gx, gy) - z];
    const quad = (pts, col, stroke, lw) => {
      c.beginPath();
      pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]));
      c.closePath();
      if (col) { c.fillStyle = col; c.fill(); }
      if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw || 1; c.stroke(); }
    };

    // 1. Gravel Ballast Bed (North-to-South continuous within map boundaries)
    const b0 = q(x - 0.75, y0 - 0.5), b1 = q(x + 0.75, y0 - 0.5);
    const b2 = q(x + 0.75, y1 + 0.5), b3 = q(x - 0.75, y1 + 0.5);
    quad([b0, b1, b2, b3], '#6f6a62', 'rgba(50,45,40,.5)', 1);

    // 2. Wooden Sleepers / Ties (horizontal cross-ties spaced every 0.7 tiles along Y)
    for (let gy = y0; gy <= y1; gy += 0.7) {
      const t0 = q(x - 0.58, gy - 0.22), t1 = q(x + 0.58, gy - 0.22);
      const t2 = q(x + 0.58, gy + 0.22), t3 = q(x - 0.58, gy + 0.22);
      quad([t0, t1, t2, t3], '#4e3629', '#2d1e16', 0.8);
    }

    // 3. Two Steel Rails (offset in X, running continuously from North to South)
    for (const rOff of [-0.30, 0.30]) {
      const rx = x + rOff;
      const r0 = q(rx, y0 - 0.5, 0), r1 = q(rx, y1 + 0.5, 0);
      const r0t = q(rx, y0 - 0.5, 4), r1t = q(rx, y1 + 0.5, 4);

      c.beginPath();
      c.moveTo(r0[0], r0[1]);
      c.lineTo(r1[0], r1[1]);
      c.lineTo(r1t[0], r1t[1]);
      c.lineTo(r0t[0], r0t[1]);
      c.closePath();
      c.fillStyle = '#858d99';
      c.fill();

      c.beginPath();
      c.moveTo(r0t[0], r0t[1]);
      c.lineTo(r1t[0], r1t[1]);
      c.strokeStyle = '#dce2eb';
      c.lineWidth = 2.4;
      c.stroke();

      c.beginPath();
      c.moveTo(r0t[0], r0t[1] - 0.8);
      c.lineTo(r1t[0], r1t[1] - 0.8);
      c.strokeStyle = '#ffffff';
      c.lineWidth = 1.0;
      c.stroke();
    }

    // North track terminal buffer stop bumper so rail terminates cleanly at fence
    const buf0 = q(x - 0.70, y0), buf1 = q(x + 0.70, y0);
    c.save();
    c.beginPath();
    c.moveTo(buf0[0], buf0[1]);
    c.lineTo(buf1[0], buf1[1]);
    c.strokeStyle = '#c62828';
    c.lineWidth = 4;
    c.stroke();
    c.strokeStyle = '#ffebee';
    c.lineWidth = 1.5;
    c.setLineDash([4, 4]);
    c.stroke();
    c.restore();
  }

  // Station configs per level (1..5):
  // Using vertical shear k (c.transform(1, cfg.k, 0, 1, 0, 0)) aligns the platform rails
  // to the EXACT -26.565° (Math.atan(-0.5)) railway track slope in true 2:1 quarter view,
  // while keeping all vertical lines (clock tower, walls, windows, flagpole) 100% upright!
  // westOffset shifts the sprite West so its rails align precisely onto the game's railway track!
  const STATION_CFGS = {
    1: { dw: 310, k: -0.026, ax: 0.500, ay: 0.693, westOffset: 0.48 },
    2: { dw: 310, k: -0.013, ax: 0.500, ay: 0.711, westOffset: 0.48 },
    3: { dw: 315, k: -0.048, ax: 0.500, ay: 0.723, westOffset: 0.48 },
    4: { dw: 320, k: -0.055, ax: 0.500, ay: 0.748, westOffset: 0.48 },
    5: { dw: 380, k: -0.1272, ax: 0.638, ay: 0.872, westOffset: 0.0 },
  };

  function drawStationPlatform(c, T, sx, sy, lv) {
    const stLv = Math.min(5, Math.max(1, lv || 1));
    const stImg = STATION_IMGS[stLv];
    const cfg = STATION_CFGS[stLv] || STATION_CFGS[1];

    // Snapped directly on the track line, shifted West to align station rails with game rails:
    const tx = TRACK_X() - (cfg.westOffset || 0.48);
    const anchorY = sy + 2.0;
    const [px, py] = [ISO.wx(tx, anchorY), ISO.wy(tx, anchorY)];

    if (stImg && stImg.complete && stImg.naturalWidth > 0) {
      c.save();
      c.translate(px, py);
      if (cfg.k) c.transform(1, cfg.k, 0, 1, 0, 0);
      const dw = cfg.dw;
      const dh = Math.round(dw * (stImg.naturalHeight / stImg.naturalWidth));
      c.drawImage(stImg, -dw * cfg.ax, -dh * cfg.ay, dw, dh);
      c.restore();
      return;
    }

    // Clean isometric fallback while image loads
    const q = (gx, gy, z = 0) => [ISO.wx(gx, gy), ISO.wy(gx, gy) - z];
    const quad = (pts, col, stroke, lw) => {
      c.beginPath();
      pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]));
      c.closePath();
      if (col) { c.fillStyle = col; c.fill(); }
      if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw || 1; c.stroke(); }
    };
    const pw = 2.8, pd = 6.4;
    const p0 = q(sx, sy), p1 = q(sx + pw, sy), p2 = q(sx + pw, sy + pd), p3 = q(sx, sy + pd);
    const p0t = q(sx, sy, 6), p1t = q(sx + pw, sy, 6), p2t = q(sx + pw, sy + pd, 6), p3t = q(sx, sy + pd, 6);
    quad([p3, p2, p2t, p3t], '#8a7e72', '#5c5248', 1.0);
    quad([p1, p2, p2t, p1t], '#73685e', '#4f453c', 1.0);
    quad([p0t, p1t, p2t, p3t], '#d8cebf', '#998d7e', 1.0);
  }

  function drawTrain(c, T, tx, ty, lv, isMoving, speedRatio) {
    const [cx, cy] = [ISO.wx(tx, ty), ISO.wy(tx, ty)];

    // 1. Contact shadow on track (aligned along track slope)
    c.save();
    c.translate(cx, cy);
    c.rotate(Math.atan(-0.5));
    c.beginPath();
    c.ellipse(0, 0, 190, 13, 0, 0, Math.PI * 2);
    c.fillStyle = 'rgba(25, 18, 12, 0.40)';
    c.fill();
    c.restore();

    // 2. High-resolution Vintage Steam Train PNG Sprite
    if (TRAIN_IMG && TRAIN_IMG.complete && TRAIN_IMG.naturalWidth > 0) {
      const dw = 440;
      const dh = Math.round(dw * (TRAIN_IMG.naturalHeight / TRAIN_IMG.naturalWidth));

      c.save();
      c.translate(cx, cy);
      // Vertical shear: k = -0.382
      // Matches the wheels to the -26.565° track slope perfectly across all wagons
      // while keeping vertical lines (smokestack, cabin, wagons) 100% upright!
      c.transform(1, -0.382, 0, 1, 0, 0);

      const dx = -dw * 0.48;
      const dy = -dh * 0.75;
      c.drawImage(TRAIN_IMG, dx, dy, dw, dh);

      // Front Headlight Glow (shining South / down-left along the track)
      const lampX = dx + dw * 0.055;
      const lampY = dy + dh * 0.61;
      c.save();
      const lg = c.createRadialGradient(lampX, lampY, 2, lampX, lampY, 32);
      lg.addColorStop(0, 'rgba(255, 240, 160, 0.85)');
      lg.addColorStop(0.35, 'rgba(255, 200, 80, 0.35)');
      lg.addColorStop(1, 'rgba(255, 200, 80, 0)');
      c.fillStyle = lg;
      c.beginPath();
      c.arc(lampX, lampY, 32, 0, Math.PI * 2);
      c.fill();

      // Light beam forward along the track
      c.beginPath();
      c.moveTo(lampX, lampY);
      c.lineTo(lampX - 60, lampY + 30);
      c.lineTo(lampX - 25, lampY + 40);
      c.closePath();
      const beamGrad = c.createLinearGradient(lampX, lampY, lampX - 55, lampY + 28);
      beamGrad.addColorStop(0, 'rgba(255, 245, 180, 0.4)');
      beamGrad.addColorStop(1, 'rgba(255, 245, 180, 0)');
      c.fillStyle = beamGrad;
      c.fill();
      c.restore();

      // Smokestack Animated Steam Puffs
      const stackX = dx + dw * 0.12;
      const stackY = dy + dh * 0.38;
      c.save();
      const puffSpeed = isMoving ? (1.6 + (speedRatio || 1) * 1.6) : 0.9;
      for (let p = 0; p < 5; p++) {
        const phase = ((T * puffSpeed + p * 0.2) % 1);
        const px = stackX + (isMoving ? phase * 36 : -phase * 10) + Math.sin(T * 3 + p) * 3;
        const py = stackY - phase * 44;
        const r = 6 + phase * 16;
        const alpha = (1 - phase) * 0.72;
        c.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        c.beginPath();
        c.arc(px, py, r, 0, Math.PI * 2);
        c.fill();
      }
      c.restore(); // restores smokestack puffs
      c.restore(); // restores train transform
      return;
    }

    // Fallback Procedural Isometric Train Engine & Wagons (if image is loading)
    const q = (gx, gy, z = 0) => [ISO.wx(gx, gy), ISO.wy(gx, gy) - z];
    const quad = (pts, col, stroke, lw) => {
      c.beginPath();
      pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]));
      c.closePath();
      if (col) { c.fillStyle = col; c.fill(); }
      if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw || 1; c.stroke(); }
    };

    const colors = {
      1: { body: '#c62828', dark: '#8e0000', trim: '#ffd54f', roof: '#212121' },
      2: { body: '#2e7d32', dark: '#1b5e20', trim: '#ffe082', roof: '#263238' },
      3: { body: '#1565c0', dark: '#0d47a1', trim: '#ffd54f', roof: '#1a237e' },
      4: { body: '#fbc02d', dark: '#f57f17', trim: '#ffffff', roof: '#bf360c' }
    }[lv || 1];

    const ew = 1.3, ed = 3.6, eh = 24;
    const e0 = q(tx, ty, 3), e1 = q(tx + ew, ty, 3), e2 = q(tx + ew, ty + ed, 3), e3 = q(tx, ty + ed, 3);
    const e0t = q(tx, ty, 3 + eh), e1t = q(tx + ew, ty, 3 + eh), e2t = q(tx + ew, ty + ed, 3 + eh), e3t = q(tx, ty + ed, 3 + eh);

    quad([e3, e2, e2t, e3t], colors.body, '#111', 1.2);
    quad([e0, e3, e3t, e0t], colors.dark, '#111', 1.2);
    quad([e0t, e1t, e2t, e3t], colors.roof, '#111', 1.2);
  }

  function formatRemain(ms) {
    const s = Math.max(0, Math.floor(ms / 1000));
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }

  // World integration collect()
  function collect(c, T, addHit) {
    const out = [];
    const st = (typeof S !== 'undefined' && S) ? ensure(S) : null;
    if (!st) return out;

    const sx = STAT_X();
    const sy = STAT_Y();
    const tx = TRACK_X();
    const H = ((typeof S !== 'undefined' && S && S.room && S.room.h) || 8);
    const now = Date.now();
    const dockY = sy + 2.0;

    const northBound = (typeof VILLAGE_Y0 !== 'undefined' ? VILLAGE_Y0 : -60);
    const southBound = (typeof VILLAGE_S_MAX === 'function' ? VILLAGE_S_MAX() : H + 36);

    // 1. Draw Railway Track strictly within map boundaries (never extends into void outside map)
    out.push({
      depth: -999,
      fn: () => drawTrack(c, tx, northBound, southBound)
    });

    // 2. Draw Station Platform & Building (beside track)
    out.push({
      depth: sx + sy + 4.0,
      fn: () => drawStationPlatform(c, T, sx, sy, st.lv)
    });

    // 3. Train Arrival & Departure Animation Logic (travels North to South)
    let showTrain = false;
    let trainY = dockY;
    let isMoving = false;
    let speedRatio = 0;

    if (st.st === 'arrived') {
      showTrain = true;
      trainY = dockY;
      isMoving = false;
      speedRatio = 0;
    } else if (st.st === 'approaching') {
      showTrain = true;
      const dur = st.expressCall ? (st.expressDur || 20000) : ARRIVE_DUR;
      const rem = Math.max(0, st.nextTime - now);
      const p = Math.min(1, Math.max(0, 1 - rem / dur));
      // Appears and glides slowly and gracefully toward station, arriving at 0:00
      const ease = p < 0.85 ? (p / 0.85) * 0.82 : 0.82 + 0.18 * (1 - Math.pow((1 - p) / 0.15, 2));
      const startY = Math.max(northBound + 2, dockY - 45);
      trainY = startY + (dockY - startY) * ease;
      isMoving = true;
      speedRatio = Math.max(0.08, 0.25 * (1 - p));
    } else if (st.st === 'departing') {
      showTrain = true;
      const dur = st.departDur || DEPART_DUR;
      const p = Math.min(1, Math.max(0, (now - (st.departStart || now)) / dur));
      // Steady, gentle slow departure south along the tracks (same leisurely pace as arrival)
      const ease = p;
      trainY = dockY + 52 * ease;
      isMoving = true;
      speedRatio = 0.15;
    }

    if (showTrain) {
      out.push({
        depth: tx + trainY + 3.0,
        fn: () => drawTrain(c, T, tx, trainY, st.lv, isMoving, speedRatio)
      });
    }

    // 4. Hit Testing and Floating Status Bubble
    const centerPos = [ISO.wx(sx + 1.2, sy + 2.0), ISO.wy(sx + 1.2, sy + 2.0)];
    const pushHit = typeof addHit === 'function' ? addHit : (addHit && addHit.push ? (h => addHit.push(h)) : () => {});
    
    // Register hit for both station and train so tapping platform/station always opens panel
    pushHit({
      kind: 'station',
      x0: centerPos[0] - 200,
      x1: centerPos[0] + 200,
      y0: centerPos[1] - 160,
      y1: centerPos[1] + 90
    });
    pushHit({
      kind: 'train',
      x0: centerPos[0] - 200,
      x1: centerPos[0] + 200,
      y0: centerPos[1] - 160,
      y1: centerPos[1] + 90
    });

    if (showTrain) {
      const trainCenter = [ISO.wx(tx, trainY + 1.2), ISO.wy(tx, trainY + 1.2)];
      pushHit({
        kind: 'train',
        x0: trainCenter[0] - 220,
        x1: trainCenter[0] + 220,
        y0: trainCenter[1] - 120,
        y1: trainCenter[1] + 60
      });
      pushHit({
        kind: 'station',
        x0: trainCenter[0] - 220,
        x1: trainCenter[0] + 220,
        y0: trainCenter[1] - 120,
        y1: trainCenter[1] + 60
      });
    }

    // Floating Bubble over station / train
    out.push({
      depth: 1e8,
      fn: () => {
        let badgeTxt = '';
        let badgeCol = '#4caf50';

        if (st.st === 'arrived') {
          const rem = Math.max(0, st.departTime - now);
          badgeTxt = `🚂 ${destName(st.dest)} [${formatRemain(rem)}]`;
          badgeCol = allFilled(S) ? '#ff9800' : '#4caf50';
        } else if (st.st === 'approaching') {
          const rem = Math.max(0, st.nextTime - now);
          badgeTxt = `🚂 ${tr('trainArrivingBadge')} [${formatRemain(rem)}]`;
          badgeCol = '#e65100';
        } else if (st.st === 'departing') {
          badgeTxt = `🚂 ${tr('trainDepartingBadge')}`;
          badgeCol = '#b71c1c';
        } else {
          const rem = Math.max(0, st.nextTime - now);
          badgeTxt = `🚂 ${tr('trainNextBadge')} ${formatRemain(rem)}`;
          badgeCol = '#455a64';
        }

        const bob = Math.sin(T * 3.5) * 3;
        // Fixed over the station platform so the arrival status message never wanders with the train
        const bx = centerPos[0];
        const by = centerPos[1] - 80 + bob;

        c.save();
        c.font = 'bold 11px sans-serif';
        const tw = c.measureText(badgeTxt).width + 20;

        c.fillStyle = badgeCol;
        c.beginPath();
        c.roundRect(bx - tw / 2, by - 12, tw, 24, 12);
        c.fill();
        c.strokeStyle = '#ffffff';
        c.lineWidth = 1.8;
        c.stroke();

        c.beginPath();
        c.moveTo(bx - 4, by + 12);
        c.lineTo(bx, by + 18);
        c.lineTo(bx + 4, by + 12);
        c.fillStyle = badgeCol;
        c.fill();

        c.fillStyle = '#ffffff';
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillText(badgeTxt, bx, by);
        c.restore();
      }
    });

    return out;
  }

  return {
    ensure,
    tick,
    generateOrders,
    deliver,
    claimBonus,
    sendTrain,
    callTrain,
    upgradeStation,
    countOwned,
    allFilled,
    destName,
    getPetName,
    getCropName,
    getCropIcon,
    getDishName,
    getDishIcon,
    formatRemain,
    whistle,
    apply,
    solid,
    collect,
    tr,
    lvName,
    lvPerk,
    renderPanel: function(p) { return renderTrainPanel(p); },
    TRACK_X,
    STAT_X,
    STAT_Y
  };
})();

// UI Panel Declaration
if (typeof tr === 'undefined') {
  var tr = (typeof window !== 'undefined' && window.tr) || function(k, p) { return (TRAIN && TRAIN.tr) ? TRAIN.tr(k, p) : k; };
}
function renderTrainPanel(panelObj) {
  const s = (typeof S !== 'undefined') ? S : null;
  if (!s) return '';
  const t = TRAIN.ensure(s);
  const cfg = TRAIN_LV[t.lv] || TRAIN_LV[1];
  const dest = TRAIN_DESTS[t.dest] || TRAIN_DESTS.family;
  const now = Date.now();
  const isArrived = t.st === 'arrived';
  const remainDepart = Math.max(0, (t.departTime || 0) - now);
  const remainNext = Math.max(0, (t.nextTime || 0) - now);
  const isAllFilled = TRAIN.allFilled(s);
  const nxtCfg = TRAIN_LV[t.lv + 1];

  let body = '';

  // 1. Destination / Timetable Header Banner
  if (isArrived) {
    const boundTxt = tr('trainBoundFor', { d: TRAIN.destName(t.dest) });
    body += `
    <div class="card" style="background:${dest.bgGrad};border:2px solid ${dest.color};margin-top:0">
      <div class="row" style="justify-content:space-between">
        <div class="row" style="gap:8px">
          <div style="font-size:32px;filter:drop-shadow(0 2px 4px rgba(0,0,0,.2))">${dest.ic}</div>
          <div>
            <div class="t" style="color:#2c1810;font-size:16px">${TRAIN.destName(t.dest)} <small style="font-size:11px;color:#5d4037;font-weight:bold">${boundTxt}</small></div>
            <div class="m" style="color:#4e342e;font-size:11.5px">${TRAIN.destDesc ? TRAIN.destDesc(t.dest) : dest.desc}</div>
          </div>
        </div>
      </div>
      <div class="row" style="margin-top:8px;padding-top:6px;border-top:1px dashed rgba(90,50,20,.2);justify-content:space-between;align-items:center">
        <div style="font-size:12px;font-weight:bold;color:#bf360c">
          ⏳ ${tr('trainDepartIn')} <span style="font-family:monospace;font-size:14px;font-weight:900;background:rgba(255,255,255,.7);padding:2px 6px;border-radius:6px">${TRAIN.formatRemain(remainDepart)}</span>
        </div>
        <div class="row" style="gap:6px">
          <button class="btn sm o" data-a="trainsend" title="${tr('trainFastDepart')}">🚂 ${tr('trainFastDepart')}</button>
        </div>
      </div>
    </div>`;
  } else if (t.st === 'approaching') {
    body += `
    <div class="card" style="background:linear-gradient(135deg,#e8f5e9,#c8e6c9);border:2px solid #81c784;margin-top:0">
      <div class="row" style="gap:10px">
        <div style="font-size:32px">🚂✨</div>
        <div class="grow">
          <div class="t" style="color:#1b5e20">${tr('trainApproachingTitle')}</div>
          <div class="m" style="color:#2e7d32">${tr('trainArriveIn')} <b>${TRAIN.formatRemain(remainNext)}</b></div>
        </div>
      </div>
    </div>`;
  } else {
    body += `
    <div class="card" style="background:linear-gradient(135deg,#eceff1,#cfd8dc);border:2px solid #90a4ae;margin-top:0">
      <div class="row" style="gap:10px">
        <div style="font-size:32px">🚂💨</div>
        <div class="grow">
          <div class="t" style="color:#37474f">${tr('trainRunningTitle')}</div>
          <div class="m" style="color:#546e7a">${tr('trainNextIn')} <b>${TRAIN.formatRemain(remainNext)}</b></div>
        </div>
      </div>
      <div class="row" style="margin-top:8px;padding-top:6px;border-top:1px dashed rgba(60,80,100,.2);justify-content:flex-end">
        <button class="btn sm o ${(s.coins || 0) < 5000 ? 'dis' : ''}" data-a="traincall">${tr('trainCallExpressCost', { c: '5,000' })}</button>
      </div>
    </div>`;
  }

  // 2. Train Complete Bonus Box
  if (isArrived && isAllFilled && !t.claimedBonus) {
    body += `
    <div class="card" style="background:linear-gradient(135deg,#fff8e1,#ffe082);border:2.5px solid #ffb300;box-shadow:0 3px 8px rgba(255,160,0,.35)">
      <div class="row" style="gap:8px">
        <div style="font-size:28px">🎉</div>
        <div class="grow">
          <div class="t" style="color:#b78103">${tr('trainAllBonusTitle')}</div>
          <div class="m" style="color:#6d4c41">${tr('trainAllBonusDesc')}</div>
        </div>
      </div>
      <button class="btn block" style="background:linear-gradient(180deg,#ffb300 0%,#f57c00 100%);margin-top:8px" data-a="trainclaimbonus">
        ${tr('trainClaimBonusBtn', { c: fmt(2500 * t.lv) })}
      </button>
    </div>`;
  }

  // 3. Wholesale Orders List
  body += `
  <div style="margin:10px 0 4px;font-weight:900;font-size:13px;color:#5d4037;display:flex;align-items:center;justify-content:space-between">
    <span>📦 ${tr('trainWholesale')}</span>
    <span style="font-size:11px;color:#8d6e63">${tr('trainStationBonus', { n: cfg.bonusAdd })}</span>
  </div>`;

  if (t.orders && t.orders.length) {
    body += t.orders.map(ord => {
      const isFilled = ord.filled >= ord.count;
      let picHtml = '';
      let titleHtml = '';
      let ownedCount = 0;

      if (ord.kind === 'produce') {
        const cropIcon = TRAIN.getCropIcon(ord.crop);
        picHtml = `<div style="width:52px;height:52px;border-radius:12px;background:#fff8ea;border:2px solid #e0c8a0;display:grid;place-items:center;font-size:28px">${cropIcon}</div>`;
        titleHtml = `🌾 ${TRAIN.getCropName(ord.crop)}`;
        ownedCount = (s.farm && s.farm.produce && s.farm.produce[ord.crop]) || 0;
      } else if (ord.kind === 'dish') {
        const dishIcon = TRAIN.getDishIcon(ord.dish);
        picHtml = `<div style="width:52px;height:52px;border-radius:12px;background:#fff8ea;border:2px solid #e0c8a0;display:grid;place-items:center;font-size:28px">${dishIcon}</div>`;
        titleHtml = `🍳 ${TRAIN.getDishName(ord.dish)}`;
        ownedCount = (s.cafe && s.cafe.dishes && s.cafe.dishes[ord.dish]) || 0;
      } else {
        const spKey = ord.sp;
        const petPic = (typeof PIC !== 'undefined' && PIC.pet) ? PIC.pet(spKey) : '';
        picHtml = petPic
          ? `<img src="${petPic}" style="width:52px;height:52px;border-radius:12px;background:#fff8ea;border:2px solid #e0c8a0;object-fit:cover">`
          : `<div style="width:52px;height:52px;border-radius:12px;background:#fff8ea;border:2px solid #e0c8a0;display:grid;place-items:center;font-size:26px">🐾</div>`;
        titleHtml = `🐾 ${TRAIN.getPetName(spKey)}`;
        ownedCount = TRAIN.countOwned(s, spKey);
      }

      const canDeliver = isArrived && !isFilled && (
        (ord.kind === 'produce' || ord.kind === 'dish') ? ownedCount >= ord.count : ownedCount > 0
      );
      const unitStr = (ord.kind === 'produce' || ord.kind === 'dish') ? tr('trainUnitItem') : tr('trainUnitPet');
      const noneStr = ownedCount === 0 ? tr('trainNone') : '';

      return `
      <div class="card row" style="align-items:center;padding:9px 10px;gap:10px;background:${isFilled ? '#f1f8e9' : '#fffdf9'};border-color:${isFilled ? '#aed581' : '#e2c596'}">
        ${picHtml}
        <div class="grow">
          <div class="row" style="justify-content:space-between">
            <div class="t" style="font-size:14px">${titleHtml}</div>
            <div style="font-size:11px;font-weight:900;color:${isFilled ? '#2e7d32' : '#d84315'}">
              ${isFilled ? ('✅ ' + tr('trainCompleted')) : tr('trainCompletedUnit', { filled: ord.filled, count: ord.count })}
            </div>
          </div>
          <div class="row" style="gap:6px;margin:3px 0 2px">
            <span style="font-size:11px;color:#8d6e63;text-decoration:line-through">${tr('trainCustPrice')} 🪙${fmt(ord.basePrice)}</span>
            <span style="font-size:13px;font-weight:900;color:#d84315">${tr('trainTrainPrice')} 🪙${fmt(ord.trainPrice)}</span>
            <span style="font-size:9.5px;font-weight:900;background:#ff5722;color:#fff;padding:1px 5px;border-radius:6px">+${ord.bonusPct}%</span>
          </div>
          <div class="m" style="font-size:11px;color:${ownedCount > 0 ? '#4e342e' : '#9e9e9e'}">
            ${tr('trainOwned', { n: ownedCount, u: unitStr })}${noneStr}
          </div>
        </div>
        <div>
          ${isFilled ? `
            <button class="btn sm g dis" style="min-width:68px">✅ ${tr('trainDone')}</button>
          ` : canDeliver ? `
            <button class="btn sm" data-a="traindeliver" data-v="${ord.id}" style="min-width:68px">
              📦 ${tr('trainDeliver')}
            </button>
          ` : `
            <button class="btn sm g dis" style="min-width:68px">${tr('trainNoPet')}</button>
          `}
        </div>
      </div>`;
    }).join('');
  }

  // 4. Station Upgrade & Perks
  body += `
  <div class="card" style="margin-top:12px;background:#faf7f2">
    <div class="row" style="justify-content:space-between">
      <div class="row" style="gap:8px">
        <div style="font-size:24px">🚉</div>
        <div>
          <div class="t" style="font-size:13.5px">Lv.${t.lv} ${(TRAIN && TRAIN.lvName) ? TRAIN.lvName(t.lv) : cfg.name}</div>
          <div class="m" style="font-size:11px">${(TRAIN && TRAIN.lvPerk) ? TRAIN.lvPerk(t.lv) : cfg.perk}</div>
        </div>
      </div>
      ${nxtCfg ? `
        <button class="btn sm o ${(s.coins || 0) < nxtCfg.cost ? 'dis' : ''}" data-a="trainup">
          ⬆️ ${tr('trainUpgrade')} 🪙${fmt(nxtCfg.cost)}
        </button>
      ` : `
        <span style="font-size:11px;font-weight:bold;color:#2e7d32">${tr('trainMaxLevel')}</span>
      `}
    </div>
    <div class="row" style="margin-top:8px;padding-top:6px;border-top:1px solid #ebd9c8;justify-content:space-around;font-size:11px;color:#6d4c41">
      <div>${tr('trainStatTrains')} <b>${t.stats.totalTrains}</b></div>
      <div>${tr('trainStatSold')} <b>${t.stats.totalPetsSold}</b></div>
      <div>${tr('trainStatEarned')} <b>🪙${fmt(t.stats.totalCoinsEarned)}</b></div>
    </div>
  </div>`;

  const titleText = tr('trainTitle');
  return frameHTML('🚂 ' + titleText, body);
}

// UI Panel Registration
function registerTrainPanel() {
  if (typeof PANELS !== 'undefined') PANELS.train = renderTrainPanel;
  if (typeof window !== 'undefined') {
    window.PANELS = window.PANELS || {};
    window.PANELS.train = renderTrainPanel;
  }
}
registerTrainPanel();
if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  window.addEventListener('DOMContentLoaded', registerTrainPanel);
  window.addEventListener('load', registerTrainPanel);
}

// XACT Action Handlers Registration
const trainHandlers = {
  traindeliver: (v, w) => {
    if (typeof actR === 'function') {
      actR({ t: 'traindeliver', oid: +v, pid: w ? +w : undefined });
    } else if (typeof act === 'function') {
      act({ t: 'traindeliver', oid: +v, pid: w ? +w : undefined });
    }
    if (typeof renderPanel === 'function') renderPanel(true);
  },
  trainclaimbonus: () => {
    if (typeof actR === 'function') actR({ t: 'trainclaimbonus' });
    else if (typeof act === 'function') act({ t: 'trainclaimbonus' });
    if (typeof renderPanel === 'function') renderPanel(true);
  },
  trainsend: () => {
    if (typeof actR === 'function') actR({ t: 'trainsend' });
    else if (typeof act === 'function') act({ t: 'trainsend' });
    if (typeof renderPanel === 'function') renderPanel(true);
  },
  traincall: () => {
    if (typeof actR === 'function') actR({ t: 'traincall' });
    else if (typeof act === 'function') act({ t: 'traincall' });
    if (typeof renderPanel === 'function') renderPanel(true);
  },
  trainup: () => {
    if (typeof actR === 'function') actR({ t: 'trainup' });
    else if (typeof act === 'function') act({ t: 'trainup' });
    if (typeof renderPanel === 'function') renderPanel(true);
  }
};

function bindTrainActions() {
  if (typeof window !== 'undefined') {
    window.XACT = window.XACT || {};
    Object.assign(window.XACT, trainHandlers);
  }
  if (typeof XACT !== 'undefined') {
    Object.assign(XACT, trainHandlers);
  }
}
bindTrainActions();
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', bindTrainActions);
  window.addEventListener('load', bindTrainActions);
}

// Global registration
if (typeof window !== 'undefined') {
  window.TRAIN = TRAIN;
  window.TRAIN_DESTS = TRAIN_DESTS;
  window.TRAIN_LV = TRAIN_LV;
}
if (typeof globalThis !== 'undefined') {
  globalThis.TRAIN = TRAIN;
  globalThis.TRAIN_DESTS = TRAIN_DESTS;
  globalThis.TRAIN_LV = TRAIN_LV;
}
