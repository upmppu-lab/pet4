// Central Asset URL manager fallback
if (typeof window !== 'undefined' && typeof window.assetUrl === 'function') {
  var assetUrl = window.assetUrl;
} else if (typeof globalThis !== 'undefined' && typeof globalThis.assetUrl === 'function') {
  var assetUrl = globalThis.assetUrl;
} else {
  var assetUrl = function(path) {
    if (!path) return '';
    var s = String(path).trim();
    var RAW_BASE = 'https://raw.githubusercontent.com/upmppu-lab/pet4-assets/main';
    var prefix = RAW_BASE + '/';
    if (s.startsWith('data:') || s.startsWith('blob:')) return s;
    var host = (typeof window !== 'undefined' && window.location && window.location.hostname) || '';
    var isLocalHost = (!host || host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '0.0.0.0' || host.endsWith('.local'));
    var isRemote = (!isLocalHost && typeof window !== 'undefined' && (
      window.__PET_TOWN_ASSET_MODE === 'remote' ||
      (!window.__PET_TOWN_ASSET_MODE && (host.endsWith('.run.app') || host.includes('aistudio') || host.includes('googleusercontent.com')))
    ));
    if (s.startsWith('http://') || s.startsWith('https://')) {
      if (s.startsWith(prefix)) {
        return isRemote ? s : s.slice(prefix.length);
      }
      return s;
    }
    s = s.replace(/^\.?\/+/, '');
    if (s.startsWith('assets/')) s = s.slice(7);
    return isRemote ? (prefix + s) : s;
  };
  if (typeof window !== 'undefined') window.assetUrl = assetUrl;
  if (typeof globalThis !== 'undefined') globalThis.assetUrl = assetUrl;
}

// ================= Central Image Cache & Preloader =================
var ASSET_CACHE = (function() {
  var cache = new Map();
  var promises = new Map();

  function get(url) {
    if (!url) return null;
    return cache.get(url) || null;
  }

  function load(url, crossOrigin) {
    if (!url) return null;
    if (cache.has(url)) return cache.get(url);
    if (typeof Image === 'undefined') return null;
    var im = new Image();
    if (crossOrigin !== false) im.crossOrigin = 'anonymous';
    cache.set(url, im);

    var p = new Promise(function(resolve) {
      im.onload = function() {
        if (typeof im.decode === 'function') {
          im.decode().then(function() { resolve(im); }).catch(function() { resolve(im); });
        } else {
          resolve(im);
        }
      };
      im.onerror = function() {
        resolve(im);
      };
    });
    promises.set(url, p);
    im.src = url;
    return im;
  }

  function preload(relPath, crossOrigin) {
    var url = typeof assetUrl === 'function' ? assetUrl(relPath) : relPath;
    return load(url, crossOrigin);
  }

  function preloadList(relPaths, crossOrigin) {
    for (var i = 0; i < relPaths.length; i++) {
      preload(relPaths[i], crossOrigin);
    }
  }

  return { get: get, load: load, preload: preload, preloadList: preloadList, cache: cache, promises: promises };
})();
if (typeof window !== 'undefined') window.ASSET_CACHE = ASSET_CACHE;
if (typeof globalThis !== 'undefined') globalThis.ASSET_CACHE = ASSET_CACHE;

// Asynchronously preload initial core assets without blocking main thread
if (typeof setTimeout === 'function') {
  setTimeout(function() {
    try {
      var essentials = [
        'spr/home.png', 'spr/ui/title_bg.jpg', 'spr/ui/icon_rotate.png',
        'spr/park.png', 'spr/lake/lake.png', 'spr/ranch/ranch.png', 'spr/train.png', 'spr/zoo/zoo.png', 'spr/station_1.png',
        'spr/shelf.png', 'spr/counter.png', 'spr/toyshelf.png', 'spr/plant.png', 'spr/bench.png', 'spr/table.png',
        'spr/tree_oak.png', 'spr/house/house_1.png', 'spr/house/house_2.png'
      ];
      for (var i = 1; i <= 6; i++) {
        essentials.push('spr/grass/grass' + i + '.png');
        essentials.push('spr/grass/stone_' + i + '.png');
      }
      ASSET_CACHE.preloadList(essentials);
    } catch (e) {}
  }, 60);
}

// ---- Species data ----
// id, category, unlock level, buy cost, base sell price, grow minutes, [ko name, ru name]
const SPECIES_RAW = [
 ['rat_black_1', 'small', 1, 40, 90, 3, '블랙 래트 1', 'Чёрная крыса 1'],
 ['rat_black_2', 'small', 1, 40, 90, 3, '블랙 래트 2', 'Чёрная крыса 2'],
 ['rat_black_3', 'small', 1, 40, 90, 3, '블랙 래트 3', 'Чёрная крыса 3'],
 ['rat_brown_1', 'small', 1, 40, 90, 3, '브라운 래트 1', 'Коричневая крыса 1'],
 ['rat_brown_2', 'small', 1, 40, 90, 3, '브라운 래트 2', 'Коричневая крыса 2'],
 ['rat_brown_3', 'small', 1, 40, 90, 3, '브라운 래트 3', 'Коричневая крыса 3'],
 ['rat_brown_4', 'small', 1, 40, 90, 3, '브라운 래트 4', 'Коричневая крыса 4'],
 ['rat_cream_1', 'small', 1, 40, 90, 3, '크림 래트 1', 'Кремовая крыса 1'],
 ['rat_cream_2', 'small', 1, 40, 90, 3, '크림 래트 2', 'Кремовая крыса 2'],
 ['rat_cream_3', 'small', 1, 40, 90, 3, '크림 래트 3', 'Кремовая крыса 3'],
 ['rat_gray_1', 'small', 1, 40, 90, 3, '그레이 래트 1', 'Серая крыса 1'],
 ['rat_gray_2', 'small', 1, 40, 90, 3, '그레이 래트 2', 'Серая крыса 2'],
 ['rat_gray_3', 'small', 1, 40, 90, 3, '그레이 래트 3', 'Серая крыса 3'],
 ['rat_white_1', 'small', 1, 40, 90, 3, '화이트 래트 1', 'Белая крыса 1'],
 ['rat_white_2', 'small', 1, 40, 90, 3, '화이트 래트 2', 'Белая крыса 2'],
 ['rat_white_3', 'small', 1, 40, 90, 3, '화이트 래트 3', 'Белая крыса 3'],
 ['rat_white_4', 'small', 1, 40, 90, 3, '화이트 래트 4', 'Белая крыса 4'],
 ['rat_white_5', 'small', 1, 40, 90, 3, '화이트 래트 5', 'Белая крыса 5'],
 ['goldfish','fish',1,25,60,2,'금붕어','Золотая рыбка'],
 ['budgie','bird',1,60,130,4,'사랑앵무','Волнистый попугай'],
 ['guinea','small',2,90,190,5,'기니피그','Морская свинка'],
 ['neon','fish',2,35,80,2,'네온테트라','Неон'],
 ['canary','bird',2,80,170,4,'카나리아','Канарейка'],
 ['rabbit','small',3,120,260,6,'집토끼','Домашний кролик'],
 ['robo','small',3,70,150,3,'로보로브스키 햄스터','Хомячок Роборовского'],
 ['kitten','cat',3,150,330,7,'아기 고양이','Котёнок'],
 ['turtle','reptile',4,140,300,6,'붉은귀거북','Красноухая черепаха'],
 ['betta','fish',4,60,140,3,'베타','Петушок'],
 ['lovebird','bird',4,160,340,6,'모란앵무','Неразлучник'],
 ['hollandlop','small',5,220,470,8,'홀랜드 롭','Голландский вислоухий кролик'],
 ['pomeranian','dog',5,350,760,10,'포메라니안','Померанский шпиц'],
 ['chinchilla','small',5,260,560,8,'친칠라','Шиншилла'],
 ['british','cat',6,420,900,10,'브리티시 숏헤어','Британская кошка'],
 ['cockatiel','bird',6,240,520,7,'왕관앵무','Корелла'],
 ['hedgehog','small',7,300,650,8,'고슴도치','Африканский ёжик'],
 ['dwarfrabbit','small',7,250,540,7,'드워프 토끼','Карликовый кролик'],
 ['shiba_sinu_black','dog',10,510,1100,12,'시바 시누 블랙','Сиба-сину чёрный'],
 ['shiba_sinu_black_brown','dog',10,520,1120,12,'시바 시누 브라운','Сиба-сину коричневый'],
 ['dalmatian_black','dog',10,650,1400,12,'블랙 달마시안','Чёрный далматинец'],
 ['dalmatian_eye','dog',10,660,1420,12,'외눈 달마시안','Далматинец с пятном'],
 ['dalmatian_red','dog',10,670,1440,12,'레드 달마시안','Рыжий далматинец'],
 ['maltese_brown2','dog',10,530,1140,12,'브라운 말티즈','Коричневый мальтезе'],
 ['maltese_dark_brown','dog',10,550,1180,12,'다크 브라운 말티즈','Тёмно-коричневый мальтезе'],
 ['maltese_white','dog',10,540,1160,12,'화이트 말티즈','Белый мальтезе'],
 ['retriever_black','dog',10,700,1500,12,'블랙 리트리버','Чёрный ретривер'],
 ['retriever_brown','dog',10,690,1480,12,'브라운 리트리버','Коричневый ретривер'],
 ['retriever_dark_brown','dog',10,710,1520,12,'다크 브라운 리트리버','Тёмно-коричневый ретривер'],
 ['husky_black', 'dog', 14, 1600, 400, 12, '허스키 블랙', 'Чёрный хаски'],
 ['husky_brown', 'dog', 14, 1600, 400, 12, '허스키 브라운', 'Коричневый хаски'],
 ['husky_white', 'dog', 14, 1700, 400, 12, '허스키 화이트', 'Белый хаски'],
 ['persian','cat',8,520,1120,12,'페르시안','Персидская кошка'],
 ['bichon','dog',8,450,970,11,'비숑 프리제','Бишон фризе'],
 ['gecko','reptile',8,280,610,8,'레오파드 게코','Леопардовый геккон'],
 ['corgi','dog',9,560,1200,13,'웰시코기','Вельш-корги'],
 ['russianblue','cat',9,540,1160,12,'러시안 블루','Русская голубая'],
 ['conure','bird',9,420,900,10,'썬코뉴어','Солнечная аратинга'],
 ['scottish','cat',10,600,1290,13,'스코티시 폴드','Шотландская вислоухая'],
 ['ferret','small',10,380,820,10,'페럿','Хорёк'],
 ['ragdoll','cat',11,680,1460,14,'랙돌','Рэгдолл'],
 ['chihuahua_black','dog',11,400,860,10,'치와와 블랙','Чихуахуа чёрный'],
 ['chihuahua_brown','dog',11,410,880,10,'치와와 브라운','Чихуахуа коричневый'],
 ['chihuahua_dark_brown','dog',11,420,900,10,'치와와 다크 브라운','Чихуахуа тёмно-коричневый'],
 ['poodle_black','dog',11,430,930,10,'푸들 블랙','Пудель чёрный'],
 ['poodle_gray','dog',11,440,950,10,'푸들 그레이','Пудель серый'],
 ['poodle_brown','dog',11,450,970,10,'푸들 브라운','Пудель коричневый'],
 ['samoyed','dog',12,750,1620,15,'사모예드','Самоед'],
 ['bengal','cat',12,760,1640,15,'벵갈','Бенгальская кошка'],
 ['axolotl','fish',12,500,1080,12,'우파루파','Аксолотль'],
 ['yorkie','dog',13,560,1200,13,'요크셔테리어','Йоркширский терьер'],
 ['mainecoon','cat',13,800,1720,16,'메인쿤','Мейн-кун'],
 ['beagle','dog',13,520,1120,12,'비글','Бигль'],
 ['siamese','cat',14,700,1500,14,'샴 고양이','Сиамская кошка'],
 ['dachshund','dog',14,540,1160,12,'닥스훈트','Такса'],
 ['jindo','dog',15,850,1830,16,'진돗개','Чиндо'],
 ['sphynx','cat',15,900,1940,17,'스핑크스','Сфинкс'],
 ['pug','dog',15,600,1290,13,'퍼그','Мопс'],
 ['frenchie','dog',15,700,1500,14,'프렌치 불도그','Французский бульдог'],
 ['bordercollie','dog',15,780,1680,15,'보더콜리','Бордер-колли'],
 ['guppy','fish',1,20,50,2,'구피','Гуппи'],
 ['gerbil','small',2,55,120,3,'저빌','Песчанка'],
 ['duckling','bird',3,90,200,5,'아기 오리','Утёнок'],
 ['chick','bird',1,50,110,3,'병아리','Цыплёнок'],
 ['clownfish','fish',5,120,260,4,'흰동가리','Рыба-клоун'],
 ['shihtzu','dog',6,400,860,11,'시츄','Ши-тцу'],
 ['munchkin','cat',7,480,1030,11,'먼치킨','Манчкин'],
 ['papillon','dog',8,460,990,11,'파피용','Папийон'],
 ['lionhead','small',9,300,650,8,'라이언헤드 토끼','Львиноголовый кролик'],
 ['schnauzer','dog',10,540,1160,12,'미니어처 슈나우저','Миниатюрный шнауцер'],
 ['abyssinian','cat',11,700,1500,14,'아비시니안','Абиссинская кошка'],
 ['cavalier','dog',12,720,1550,14,'캐벌리어 킹 찰스','Кавалер-кинг-чарльз-спаниель'],
 ['angora','cat',12,720,1550,14,'터키시 앙고라','Турецкая ангора'],
 ['greyparrot','bird',13,900,1940,15,'회색앵무','Жако'],
 ['norwegian','cat',14,820,1760,16,'노르웨이숲','Норвежская лесная'],
 ['cornsnake','reptile',9,320,680,9,'콘스네이크','Маисовый полоз'],
 ['ballpython','reptile',13,650,1380,13,'볼파이썬','Королевский питон'],
 // PET TOWN: breeds that only come once the town is big enough (TOWN_SP = best population needed; the level column is ignored for them)
 ['cocker','dog',8,560,1200,13,'코커 스패니얼','Кокер-спаниель'],
 ['exotic','cat',10,650,1400,14,'엑조틱 숏헤어','Экзотическая короткошёрстная'],
 ['macaw','bird',12,1100,2300,16,'금강앵무','Ара'],
 ['beardie','reptile',14,900,1900,15,'비어디드 드래곤','Бородатая агама'],
];
const TOWN_SP = { cocker: 45, exotic: 90, macaw: 130, beardie: 250 };
const SPECIES = {};
SPECIES_RAW.forEach(([id,cat,lv,cost,sell,grow,ko,ru])=>{SPECIES[id]={id,cat,lv,cost,sell,grow,name:{ko,ru}}});
SPECIES.rabbit_white = SPECIES.rabbit;
// 레거시 종 및 별칭 호환성 (구 세이브 데이터 보존)
const LEGACY_SP_MAP = {
  hamster: 'rat_brown_1',
  husky: 'husky_black',
  maltese: 'maltese_white',
  maltese_cream: 'maltese_white',
  maltese_brown: 'maltese_brown2',
  shiba: 'shiba_sinu_black',
  shiba_black: 'shiba_sinu_black_brown',
  shiba_red: 'shiba_sinu_black',
  shiba_sinu: 'shiba_sinu_black',
  golden: 'retriever_brown',
  labrador: 'retriever_brown',
  dalmatian: 'dalmatian_black',
  poodle: 'poodle_brown',
};
for (const [k, v] of Object.entries(LEGACY_SP_MAP)) {
  if (!SPECIES[k] && SPECIES[v]) SPECIES[k] = SPECIES[v];
}
// photo framing tweaks (object-position)
const PHOTO_POS = {cockatiel:'50% 30%',conure:'50% 35%',hollandlop:'50% 40%',jindo:'50% 35%',mainecoon:'50% 30%',
  russianblue:'50% 35%',siamese:'50% 30%',sphynx:'50% 30%',yorkie:'50% 30%',persian:'50% 35%',bengal:'50% 30%',
  scottish:'50% 40%',samoyed:'50% 40%',kitten:'40% 50%',pomeranian:'35% 40%',chihuahua:'50% 40%',shiba:'50% 40%',
  shiba_black:'50% 40%',shiba_sinu:'50% 40%',shiba_sinu_black:'50% 40%',shiba_sinu_black_brown:'50% 40%',shiba_red:'50% 40%',
  dalmatian_black:'50% 40%',dalmatian_eye:'50% 40%',dalmatian_red:'50% 40%',maltese_brown2:'50% 40%',maltese_dark_brown:'50% 40%',maltese_white:'50% 40%',retriever_black:'50% 40%',retriever_brown:'50% 40%',retriever_dark_brown:'50% 40%',maltese:'50% 40%',maltese_cream:'50% 40%',maltese_brown:'50% 40%'};

const CATS = ['small','fish','bird','reptile','cat','dog'];
const FOOD = { // food per category: pack of 10 servings
  small:{price:20}, fish:{price:15}, bird:{price:20}, reptile:{price:30}, cat:{price:40}, dog:{price:40}
};
const CAT_ICON = {small:'🐹',fish:'🐟',bird:'🐦',reptile:'🐢',cat:'🐱',dog:'🐶'};
const GROOMABLE = {cat:1,dog:1,small:1};

const DECOR = [
  {id:'plant', cost:100, pts:1, lv:1, icon:'🪴'},
  {id:'lamp', cost:250, pts:2, lv:2, icon:'💡'},
  {id:'rug', cost:400, pts:3, lv:3, icon:'🧶'},
  {id:'bench', cost:700, pts:4, lv:4, icon:'🛋️'},
  {id:'aquarium', cost:1100, pts:5, lv:5, icon:'🐠'},
  {id:'cattower', cost:1600, pts:6, lv:7, icon:'🏰'},
  {id:'fountain', cost:2400, pts:8, lv:9, icon:'⛲'},
  {id:'chandelier', cost:3500, pts:10, lv:11, icon:'✨'},
  {id:'garden', cost:5000, pts:14, lv:13, icon:'🌷'},
];
const UPGRADES = [
  {id:'feeder', cost:1800, lv:5, icon:'🥣'},
  {id:'cleaner', cost:2600, lv:7, icon:'🧽'},
  {id:'sign', cost:900, lv:4, icon:'🪧'},
  {id:'vipdesk', cost:3000, lv:10, icon:'🎩'},
];
const APP_VER = '1.320'; // build_nosdk.py rewrites this to the version being built
// v9.85 economy balance (girlfriend earned too easily with a full staff): one place to tune it
const BAL = { WAGE_K: 3, FARM_WAGE_K: 1.5, EXPAND_K: 2.5, BUILD_K: 3, SALE_K: .8, TOP_K: .65, BUY_K: 1.35, DECOR_CAP: .25, TIP: .06, COMBO_STEP: .06, COMBO_CAP: .3 }; // v9.98: pet shop margin trimmed (buy cost, decor bonus, tips, rush combos)
const balCost = c => Math.round(c * BAL.EXPAND_K / 100) * 100;
const GAUGE_SPEED = 0.35; // v1.25: 30% slower again (was 0.5) // pet gauge drift speed (1 = the original pace)
const MAX_SLOTS = 100000; const MAX_HOUSES = 100000;
const slotCost = n => Math.round(150*Math.pow(1.6, n-3)/10)*10;
// PET TOWN v1.7: levels go to 100. Up to 30 the old curve; after that it keeps rising gently (Lv30 11,544 -> Lv99 ~30,900 per level)
const xpNeed = L => L <= 30 ? Math.round(50*Math.pow(L,1.6)) : Math.round(50*Math.pow(30,1.6) + 280*(L-30));
const MAX_LEVEL = 100;
// money formulas that grew with the player's level stop growing at 30 (otherwise tips / goods / quest rewards would balloon at Lv100)
const LV_ECON_CAP = 30;
const lvE = s => Math.min((s && s.level) || 1, LV_ECON_CAP);
// above 30: every 5 levels +1% on pet sales (career bonus, +14% at 100), every 10 levels a gacha ticket
const careerBonus = s => Math.floor(Math.max(0, ((s && s.level) || 1) - 30) / 5) * .01;

const NAMES = {
 ko:['콩이','보리','코코','초코','두부','모카','뭉치','호두','밤이','까미','루루','쿠키','나비','복실이','몽이','단비','하루','설기','망고','체리','버터','우유','라떼','구름','별이','토리','치즈','꼬미','레오','해피','솜이','찰떡','감자','양말','도토리','깜지','땅콩','율무','꿀떡','봄이'],
 ru:['Пушок','Барсик','Мурка','Кузя','Лапка','Снежок','Персик','Бусинка','Тимоша','Соня','Ириска','Кнопка','Рыжик','Плюша','Марсик','Зефирка','Чапа','Бублик','Ласка','Тучка','Шарик','Малыш','Пряник','Фунтик','Зайка','Мишка','Лучик','Вишенка','Масик','Буся','Сырник','Пончик','Кекс','Луна','Звёздочка','Тиша','Ватрушка','Мила','Персей','Боня']
};
const AVATARS = ['👩','👨','👵','👴','👧','🧑','👩‍🦰','🧔','👱‍♀️','👨‍🦱','👩‍🦳','🧑‍🦱','👦','👸','🧑‍🎨','👩‍🍳'];

// Photo credits (Wikimedia Commons)
const CREDITS = {"hamster": ["Golden_hamster_front_1.jpg", "CC BY 2.5", "Adamjennison111 at English Wikipedia"], "robo": ["Phodopus_roborovskii.jpg", "CC BY-SA 3.0", "Bullet"], "goldfish": ["Gold_fish1.jpg", "CC BY-SA 3.0", "לינה אבוגוש"], "betta": ["HM_Orange_M_Sarawut.jpg", "CC BY 2.0", "Daniella Vereeken"], "neon": ["Neonsalmler_Paracheirodon_innesi.jpg", "CC BY 3.0", "Holger Krisp"], "budgie": ["Budgerigar-male-strzelecki-qld.jpg", "GFDL 1.2", "Benjamint444"], "canary": ["GelbA.JPG", "CC BY-SA 4.0", "NEWSchr"], "lovebird": ["Rosy-faced_lovebird_(Agapornis_roseicollis_roseicollis).jpg", "CC BY-SA 4.0", "Charles J. Sharp"], "cockatiel": ["Cockatiel_3.jpg", "CC BY-SA 4.0", "Photo by: Ganatron – paulweberphoto.com"], "conure": ["Aratinga_solstitialis_-captive-two-8a.jpg", "CC BY 3.0", "Wayne Deeker"], "rabbit": ["Heimtier_004_2023_08_26.jpg", "CC BY-SA 4.0", "Friedrich Haag"], "hollandlop": ["Holland_Lop_Bunny_Standing_On_Her_Back_Feet.jpg", "CC0", "SirDukeOfAwe"], "dwarfrabbit": ["Rabbit-with-grass.jpg", "CC BY-SA 4.0", "金色黎明"], "guinea": ["George_the_amazing_guinea_pig.jpg", "CC BY-SA 3.0", ""], "chinchilla": ["Chinchilla_lanigera_(Wroclaw_zoo)-2.JPG", "CC BY-SA 3.0", "Guérin Nicolas (messages)"], "hedgehog": ["Atelerix_albiventris.jpg", "CC BY-SA 3.0", "Jkasvi (talk · contribs)"], "ferret": ["Ferret_2008.png", "CC BY-SA 4.0", "Alfredo Gutiérrez"], "turtle": ["RedEaredSlider05.jpg", "CC BY-SA 3.0", "Greg Hume"], "gecko": ["Eublepharis_macularius_2009_G6.jpg", "Public domain", "George Chernilevsky"], "axolotl": ["Axolotl_ganz.jpg", "CC BY-SA 3.0", "LoKiLeCh"], "british": ["Mystica_from_British_Empire_Cattery.jpg", "CC BY-SA 3.0", "BritishEmpire"], "russianblue": ["Russian_blue_kitten_(cropped).jpg", "CC BY-SA 3.0", "Anna Utekhina http://kidsphoto.ru/"], "scottish": ["Scottish_Fold_-_CFF_cat_show_Heinola_2008-05-03_IMG_7882.JPG", "CC BY 3.0", "Heikki Siltala"], "persian": ["Persialainen.jpg", "CC BY-SA 3.0", "The original uploader was Lajoma at Finnish Wikipedia."], "ragdoll": ["Ragdoll_from_Gatil_Ragbelas.jpg", "CC BY-SA 2.0", "Simone Johnsson"], "bengal": ["Paintedcats_Red_Star_standing.jpg", "CC BY-SA 4.0", "User:Lightburst"], "mainecoon": ["Mâle_Black_Silver_Blotched_Tabby.jpeg", "CC BY-SA 4.0", ""], "siamese": ["Siamese_cat_Vaillante.JPG", "CC BY-SA 3.0", "Meekahoo"], "sphynx": ["Sphynx_-_cat._img_031.jpg", "CC BY-SA 4.0", "Dmitry Makeev"], "pomeranian": ["Pomeranian.JPG", "Public domain", "Blackoranges"], "maltese": ["Maltese_600.jpg", "CC BY-SA 3.0", "Sannse"], "chihuahua": ["Chihuahua1_bvdb.jpg", "CC BY-SA 3.0", "Bonnie van den Born, http://www.bonfoto.nl. The original uploader was Cwazi at D"], "bichon": ["Bichon_Frisé_-_studdogbichon.jpg", "CC BY-SA 3.0 de", "Heike Andres"], "poodle": ["Full_attention_(8067543690).jpg", "CC BY 2.0", "Tim Wilson from Blaine, MN, USA"], "shiba": ["Taka_Shiba.jpg", "Public domain", "Takashiba at English Wikipedia"], "corgi": ["Welsh_Pembroke_Corgi.jpg", "CC BY-SA 4.0", "Dog breed facts"], "beagle": ["Beagle_600.jpg", "CC BY-SA 3.0", ""], "dachshund": ["닥스훈트(단모종)_(Dachshund_(Short)).jpg", "CC BY-SA 4.0", "Katemil94"], "pug": ["Mops-duke-mopszucht-vom-maegdebrunnen.jpg", "CC BY-SA 3.0", "Xidrep"], "frenchie": ["2008-07-28_Dog_at_Frolick_Field.jpg", "CC BY-SA 4.0", "Ildar Sagdejev (Specious)"], "yorkie": ["(2_version)_Grupp_3,_YORKSHIRETERRIER,_NO_UCH_SE_UCH_Oxzar_Amazing_Bel’s_Toffy_(24310212305).jpg", "CC BY-SA 4.0", "Svenska Mässan from Sweden"], "golden": ["Golden_Retriever_Dukedestiny01_drvd.jpg", "Public domain", "Dukedestiny01.jpg: \"Janneke Vreugdenhil\" derivative work: Anka Friedrich ([[User"], "bordercollie": ["Border_Collie_600.jpg", "CC BY-SA 3.0", ""], "samoyed": ["Samojed00.jpg", "CC BY-SA 3.0", "No machine-readable author provided. Pleple2000 assumed (based on copyright clai"], "husky": ["Husky_L.jpg", "CC BY-SA 3.0", "xJaM (talk · contribs)"], "jindo": ["ARIRANG.jpg", "CC BY-SA 4.0", "Herocosmos"], "kitten": ["1-month-old_kittens_32.jpg", "CC BY-SA 2.0", "0x010C"]};

const ROOM_SIZES = [{ w: 8, lv: 1, cost: 0 }, { w: 10, lv: 2, cost: 6000 }, { w: 12, lv: 4, cost: 16000 }, { w: 14, lv: 6, cost: 35000 }, { w: 16, lv: 8, cost: 60000 }, { w: 18, lv: 11, cost: 95000 }, { w: 20, lv: 14, cost: 140000 }, { w: 22, lv: 17, cost: 200000 }, { w: 24, lv: 20, cost: 280000 }, { w: 26, lv: 23, cost: 380000 }, { w: 28, lv: 26, cost: 500000 }, { w: 30, lv: 29, cost: 650000 }];
ROOM_SIZES.forEach(r => { r.cost = balCost(r.cost); });
const STYLES = [
  { id: 'wood', type: 'floor', cost: 0 }, { id: 'oak', type: 'floor', cost: 400 }, { id: 'tile', type: 'floor', cost: 500 },
  { id: 'pink', type: 'floor', cost: 700 }, { id: 'mint', type: 'floor', cost: 700 }, { id: 'dark', type: 'floor', cost: 900 },
  { id: 'walnut', type: 'floor', cost: 900 }, { id: 'white', type: 'floor', cost: 800 }, { id: 'parquet', type: 'floor', cost: 1200 }, { id: 'lav', type: 'floor', cost: 700 }, { id: 'lemon', type: 'floor', cost: 700 },
  { id: 'checker', type: 'floor', cost: 900 }, { id: 'carpetp', type: 'floor', cost: 1000 }, { id: 'carpets', type: 'floor', cost: 1000 }, { id: 'grass', type: 'floor', cost: 1300 },
  { id: 'lav', type: 'wall', cost: 600 }, { id: 'lemon', type: 'wall', cost: 600 }, { id: 'heart', type: 'wall', cost: 900 }, { id: 'star', type: 'wall', cost: 1100 }, { id: 'gingham', type: 'wall', cost: 800 },
  { id: 'brick', type: 'wall', cost: 1200 }, { id: 'flower', type: 'wall', cost: 900 }, { id: 'peach', type: 'wall', cost: 500 }, { id: 'choco', type: 'wall', cost: 1000 },
  { id: 'cream', type: 'wall', cost: 0 }, { id: 'mint', type: 'wall', cost: 400 }, { id: 'pink', type: 'wall', cost: 500 },
  { id: 'sky', type: 'wall', cost: 600 }, { id: 'wood', type: 'wall', cost: 800 }, { id: 'xmas', type: 'wall', cost: 1200 },
];
STYLES.sort((a, b) => a.type === b.type ? a.cost - b.cost : a.type === 'floor' ? -1 : 1);
UPGRADES.push({ id: 'cashier', cost: 3500, lv: 8, icon: '🧑‍💼' });
DECOR.push(
  { id: 'playpen', cost: 900, pts: 6, lv: 2, icon: '🎠' },
  { id: 'playpen_adventure', cost: 2400, pts: 12, lv: 5, icon: '🎪' },
  { id: 'playpen_castle', cost: 5200, pts: 22, lv: 9, icon: '🏰' },
  { id: 'playpen_waterpark', cost: 9500, pts: 38, lv: 14, icon: '🏖️' },
  { id: 'toyshelf', cost: 500, pts: 2, lv: 3, icon: '🧸' },
  { id: 'supshelf', cost: 450, pts: 2, lv: 3, icon: '🧴' },
  { id: 'clothrack', cost: 800, pts: 3, lv: 5, icon: '👕' },
  { id: 'groomtable', cost: 1500, pts: 4, lv: 5, icon: '✂️' },
  { id: 'hotel', cost: 2800, pts: 5, lv: 8, icon: '🏨' },
);
const PEN_INFO = {
  playpen: { w: 3, d: 3, cap: 3, rate: 1, xpMul: 1, tipMul: 1, cleanRate: 0 },
  playpen_adventure: { w: 4, d: 3, cap: 5, rate: 1.5, xpMul: 1.3, tipMul: 1.5, cleanRate: 0 },
  playpen_castle: { w: 4, d: 4, cap: 8, rate: 2.0, xpMul: 1.7, tipMul: 2.2, cleanRate: 0.4 },
  playpen_waterpark: { w: 5, d: 4, cap: 12, rate: 2.6, xpMul: 2.2, tipMul: 3.0, cleanRate: 1.0 },
};
const isPenKind = k => !!(k && PEN_INFO[k]);
DECOR.sort((a, b) => a.lv - b.lv);
DECOR.push(
  { id: 'table', cost: 350, pts: 2, lv: 2, icon: '🪑' },
  { id: 'armchair', cost: 450, pts: 2, lv: 2, icon: '🛋️' },
  { id: 'coatrack', cost: 200, pts: 1, lv: 1, icon: '🧥' },
  { id: 'radio', cost: 380, pts: 2, lv: 3, icon: '📻' },
  { id: 'bookcase', cost: 600, pts: 3, lv: 3, icon: '📚' },
  { id: 'fridge', cost: 700, pts: 3, lv: 4, icon: '🧊' },
  { id: 'tv', cost: 900, pts: 4, lv: 4, icon: '📺' },
  { id: 'cafe', cost: 1200, pts: 5, lv: 6, icon: '☕' },
  { id: 'desk', cost: 800, pts: 3, lv: 5, icon: '💻' },
  { id: 'washer', cost: 1000, pts: 3, lv: 6, icon: '🧺' },
  { id: 'bathtub', cost: 1400, pts: 4, lv: 7, icon: '🛁' },
);
DECOR.push(
  { id: 'l_candles', cost: 180, pts: 1, lv: 1, icon: '🕯️' },
  { id: 'l_lantern', cost: 220, pts: 1, lv: 1, icon: '🏮' },
  { id: 'l_tablelamp', cost: 320, pts: 2, lv: 2, icon: '💡' },
  { id: 'l_string', cost: 450, pts: 2, lv: 2, icon: '✨' },
  { id: 'l_arc', cost: 550, pts: 2, lv: 3, icon: '🛋️' },
  { id: 'l_street', cost: 650, pts: 3, lv: 3, icon: '🏙️' },
  { id: 'l_moon', cost: 800, pts: 3, lv: 4, icon: '🌙' },
  { id: 'l_neon', cost: 1000, pts: 4, lv: 5, icon: '💗' },
  { id: 'l_tree', cost: 1200, pts: 4, lv: 6, icon: '🎄' },
);
DECOR.push(
  { id: 'petbed_deluxe', cost: 1200, pts: 4, lv: 4, icon: '🛏️' },
  { id: 'cozy_fireplace', cost: 2800, pts: 7, lv: 6, icon: '🪵' },
  { id: 'catcastle', cost: 3200, pts: 8, lv: 8, icon: '🏰' },
  { id: 'music_jukebox', cost: 3600, pts: 9, lv: 9, icon: '📻' },
  { id: 'crystal_fountain', cost: 4200, pts: 12, lv: 10, icon: '⛲' },
  { id: 'x_pcdesk', cost: 700, pts: 2, lv: 1, icon: '💻' },
  { id: 'x_board', cost: 250, pts: 1, lv: 1, icon: '🪧' },
  { id: 'x_balloon', cost: 300, pts: 2, lv: 1, icon: '🎈' },
  { id: 'x_scale', cost: 400, pts: 2, lv: 2, icon: '⚖️' },
  { id: 'x_monstera', cost: 450, pts: 2, lv: 2, icon: '🌿' },
  { id: 'x_beanbag', cost: 500, pts: 2, lv: 2, icon: '🛋️' },
  { id: 'x_rocking', cost: 650, pts: 3, lv: 3, icon: '🪑' },
  { id: 'x_photozone', cost: 900, pts: 4, lv: 3, icon: '📸' },
  { id: 'x_gacha', cost: 1200, pts: 4, lv: 4, icon: '🎰' },
  { id: 'x_agility', cost: 1500, pts: 5, lv: 5, icon: '🐕' },
  { id: 'x_vending', cost: 1800, pts: 5, lv: 6, icon: '🥤' },
);
// category for the shop list; homeOnly items are sold only for "our home"
const DECOR_CAT = { petbed_deluxe: 'pet', cozy_fireplace: 'furn', catcastle: 'pet', music_jukebox: 'deco', crystal_fountain: 'deco', plant: 'deco', coatrack: 'furn', lamp: 'light', playpen: 'pet', playpen_adventure: 'pet', playpen_castle: 'pet', playpen_waterpark: 'pet', table: 'furn', armchair: 'furn', rug: 'deco', toyshelf: 'pet', supshelf: 'pet', radio: 'deco', bookcase: 'furn', bench: 'furn', fridge: 'furn', tv: 'furn', aquarium: 'deco', clothrack: 'pet', groomtable: 'pet', desk: 'furn', cafe: 'furn', cattower: 'pet', hotel: 'pet', fountain: 'deco', chandelier: 'deco', garden: 'deco', x_pcdesk: 'furn', x_board: 'deco', x_balloon: 'deco', x_scale: 'pet', x_monstera: 'deco', x_beanbag: 'furn', x_rocking: 'furn', x_photozone: 'deco', x_gacha: 'deco', x_agility: 'pet', x_vending: 'furn', washer: 'home', bathtub: 'home' };
DECOR.forEach(d => { d.cat = d.id.startsWith('l_') ? 'light' : DECOR_CAT[d.id] || 'deco'; if (d.cat === 'home') d.homeOnly = 1; });
DECOR.sort((a, b) => a.lv - b.lv);

// ---------- v6: feed lines (per diet) x tiers ----------
const FEED_LINES = {
  dog: { icon: '🦴', price: 40, ko: '강아지 사료', ru: 'Корм для собак' },
  cat: { icon: '🐟', price: 40, ko: '고양이 사료', ru: 'Корм для кошек' },
  seed: { icon: '🌻', price: 20, ko: '설치류 씨앗믹스', ru: 'Смесь для грызунов' },
  hay: { icon: '🌾', price: 25, ko: '티모시 건초', ru: 'Сено тимофеевки' },
  insect: { icon: '🐛', price: 30, ko: '밀웜·귀뚜라미', ru: 'Черви и сверчки' },
  ferret: { icon: '🥩', price: 35, ko: '페럿 전용 사료', ru: 'Корм для хорьков' },
  birdseed: { icon: '🌰', price: 20, ko: '앵무새 모이', ru: 'Корм для попугаев' },
  duck: { icon: '🥬', price: 25, ko: '아기 오리 사료', ru: 'Корм для утят' },
  flake: { icon: '🫧', price: 15, ko: '열대어 플레이크', ru: 'Хлопья для рыб' },
  axo: { icon: '🦐', price: 30, ko: '우파루파 펠렛', ru: 'Гранулы для аксолотля' },
  turtle: { icon: '🐢', price: 30, ko: '거북이 스틱', ru: 'Корм для черепах' },
};
const FEED_TIERS = [
  { k: .6, hunger: 40, lv: 1, ko: '알뜰', ru: 'Эконом', icon: '🥫' },
  { k: 1, hunger: 55, lv: 1, ko: '기본', ru: 'Стандарт', icon: '🍚' },
  { k: 2.2, hunger: 75, lv: 3, ko: '고급', ru: 'Премиум', icon: '🌟' },
];
const DIET_BY_SP = { hamster: 'seed', robo: 'seed', gerbil: 'seed', chinchilla: 'seed', rabbit: 'hay', hollandlop: 'hay', dwarfrabbit: 'hay', lionhead: 'hay', guinea: 'hay',
  hedgehog: 'insect', gecko: 'insect', ferret: 'ferret', duckling: 'duck', axolotl: 'axo', turtle: 'turtle' };
const dietOf = sp => DIET_BY_SP[sp] || { dog: 'dog', cat: 'cat', bird: 'birdseed', fish: 'flake', small: 'seed', reptile: 'insect' }[(SPECIES[sp] || {}).cat] || 'seed';
const feedPrice = (line, tier) => Math.max(5, Math.round(FEED_LINES[line].price * FEED_TIERS[tier].k / 5) * 5);
const DELIVERY = { rate: .15, min: 5, secs: 30 };
const deliveryFee = c => Math.max(DELIVERY.min, Math.round(c * DELIVERY.rate));

// ---------- v6: goods sold on shelves (unlock by level) ----------
const PRODUCTS = [
  { id: 'treat', shelf: 'shelf', lv: 1, cost: 6, price: 15, icon: '🍪' },
  { id: 'feedbag', shelf: 'shelf', lv: 1, cost: 10, price: 24, icon: '🦴' },
  { id: 'catbag', shelf: 'shelf', lv: 2, cost: 10, price: 24, icon: '🐟' },
  { id: 'seedbag', shelf: 'shelf', lv: 3, cost: 7, price: 18, icon: '🌻' },
  { id: 'birdbag', shelf: 'shelf', lv: 4, cost: 7, price: 18, icon: '🌰' },
  { id: 'fishfood', shelf: 'shelf', lv: 5, cost: 6, price: 16, icon: '🫧' },
  { id: 'premiumbag', shelf: 'shelf', lv: 8, cost: 26, price: 62, icon: '🌟' },
  { id: 'dental', shelf: 'shelf', lv: 10, cost: 14, price: 34, icon: '🦷' },
  { id: 'shampoo', shelf: 'supshelf', lv: 1, cost: 12, price: 30, icon: '🧴' },
  { id: 'bowl', shelf: 'supshelf', lv: 3, cost: 10, price: 26, icon: '🥣' },
  { id: 'pads', shelf: 'supshelf', lv: 5, cost: 14, price: 34, icon: '🧻' },
  { id: 'brushp', shelf: 'supshelf', lv: 6, cost: 16, price: 38, icon: '🪮' },
  { id: 'vitamin', shelf: 'supshelf', lv: 8, cost: 24, price: 58, icon: '💊' },
  { id: 'autofeeder', shelf: 'supshelf', lv: 12, cost: 60, price: 140, icon: '⏲️' },
  { id: 'ball', shelf: 'toyshelf', lv: 1, cost: 8, price: 22, icon: '🎾' },
  { id: 'squeaky', shelf: 'toyshelf', lv: 2, cost: 10, price: 26, icon: '🐤' },
  { id: 'wand', shelf: 'toyshelf', lv: 4, cost: 14, price: 36, icon: '🪶' },
  { id: 'rope', shelf: 'toyshelf', lv: 6, cost: 16, price: 40, icon: '🪢' },
  { id: 'nosework', shelf: 'toyshelf', lv: 9, cost: 28, price: 66, icon: '🧩' },
  { id: 'laser', shelf: 'toyshelf', lv: 12, cost: 40, price: 95, icon: '🔴' },
  { id: 'tunnel', shelf: 'toyshelf', lv: 3, cost: 12, price: 32, icon: '🌀' },
  { id: 'feather', shelf: 'toyshelf', lv: 5, cost: 15, price: 38, icon: '🪽' },
  { id: 'puzzlefeeder', shelf: 'toyshelf', lv: 14, cost: 45, price: 105, icon: '🎲' },
  { id: 'ribbon', shelf: 'clothrack', lv: 1, cost: 10, price: 28, icon: '🎀' },
  { id: 'collar', shelf: 'clothrack', lv: 3, cost: 16, price: 40, icon: '📿' },
  { id: 'tshirt', shelf: 'clothrack', lv: 5, cost: 20, price: 50, icon: '👕' },
  { id: 'harness', shelf: 'clothrack', lv: 7, cost: 26, price: 62, icon: '🦺' },
  { id: 'raincoat', shelf: 'clothrack', lv: 9, cost: 30, price: 72, icon: '🧥' },
  { id: 'carrier', shelf: 'clothrack', lv: 13, cost: 70, price: 170, icon: '👜' },
];

// ---------- v6: pet house models (bought at the furniture store) ----------
// cat: which tab shows it; kind: habitat kind; lv: starting house level; ulv: unlock level
const HOUSE_MODELS = [
  { id: 'dog1', cat: 'dog', kind: 'dogbed', lv: 1, cap: 1, ulv: 1, cost: 60, icon: '☁️' },
  { id: 'dog2', cat: 'dog', kind: 'dogbed', lv: 2, cap: 2, ulv: 2, cost: 260, icon: '🛏️' },
  { id: 'dog3', cat: 'dog', kind: 'dogbed', lv: 3, cap: 3, ulv: 4, cost: 700, icon: '🏡' },
  { id: 'dog4', cat: 'dog', kind: 'dogbed', lv: 5, cap: 5, ulv: 8, cost: 2200, icon: '👑' },
  { id: 'cat1', cat: 'cat', kind: 'catbed', lv: 1, cap: 1, ulv: 1, cost: 60, icon: '🐱' },
  { id: 'cat2', cat: 'cat', kind: 'catbed', lv: 2, cap: 2, ulv: 2, cost: 260, icon: '🧺' },
  { id: 'cat3', cat: 'cat', kind: 'catbed', lv: 3, cap: 3, ulv: 4, cost: 700, icon: '🏠' },
  { id: 'cat4', cat: 'cat', kind: 'catbed', lv: 5, cap: 5, ulv: 8, cost: 2200, icon: '🏰' },
  { id: 'cage1', cat: 'rodent', kind: 'cage', lv: 1, cap: 1, ulv: 1, cost: 40, icon: '🥡' },
  { id: 'cage2', cat: 'rodent', kind: 'cage', lv: 2, cap: 2, ulv: 2, cost: 200, icon: '🪜' },
  { id: 'cage3', cat: 'rodent', kind: 'cage', lv: 3, cap: 3, ulv: 4, cost: 600, icon: '🪵' },
  { id: 'cage4', cat: 'rodent', kind: 'cage', lv: 5, cap: 5, ulv: 8, cost: 1800, icon: '🏯' },
  { id: 'hutch1', cat: 'bunny', kind: 'hutch', lv: 1, cap: 1, ulv: 1, cost: 50, icon: '🧱' },
  { id: 'hutch2', cat: 'bunny', kind: 'hutch', lv: 2, cap: 2, ulv: 2, cost: 230, icon: '🏕️' },
  { id: 'hutch3', cat: 'bunny', kind: 'hutch', lv: 3, cap: 3, ulv: 4, cost: 650, icon: '🛖' },
  { id: 'hutch4', cat: 'bunny', kind: 'hutch', lv: 5, cap: 5, ulv: 8, cost: 1900, icon: '🏘️' },
  { id: 'bird1', cat: 'bird', kind: 'birdcage', lv: 1, cap: 1, ulv: 1, cost: 50, icon: '🔔' },
  { id: 'bird2', cat: 'bird', kind: 'birdcage', lv: 2, cap: 2, ulv: 2, cost: 240, icon: '🪺' },
  { id: 'bird3', cat: 'bird', kind: 'birdcage', lv: 3, cap: 3, ulv: 4, cost: 650, icon: '🌿' },
  { id: 'bird4', cat: 'bird', kind: 'birdcage', lv: 5, cap: 5, ulv: 8, cost: 1900, icon: '🕌' },
  { id: 'tank1', cat: 'fish', kind: 'tank', lv: 1, cap: 1, ulv: 1, cost: 35, icon: '🫙' },
  { id: 'tank2', cat: 'fish', kind: 'tank', lv: 2, cap: 2, ulv: 2, cost: 220, icon: '🌱' },
  { id: 'tank3', cat: 'fish', kind: 'tank', lv: 3, cap: 3, ulv: 4, cost: 700, icon: '🐚' },
  { id: 'tank4', cat: 'fish', kind: 'tank', lv: 5, cap: 5, ulv: 8, cost: 2000, icon: '🪸' },
  { id: 'terra1', cat: 'reptile', kind: 'terrarium', lv: 1, cap: 1, ulv: 1, cost: 70, icon: '🧊' },
  { id: 'terra2', cat: 'reptile', kind: 'terrarium', lv: 2, cap: 2, ulv: 3, cost: 300, icon: '🪨' },
  { id: 'terra3', cat: 'reptile', kind: 'terrarium', lv: 3, cap: 3, ulv: 5, cost: 750, icon: '🌴' },
  { id: 'terra4', cat: 'reptile', kind: 'terrarium', lv: 5, cap: 5, ulv: 9, cost: 2100, icon: '🌋' },
];
const HOUSE_TABS = [['dog', '🐶'], ['cat', '🐱'], ['rodent', '🐀'], ['bunny', '🐰'], ['bird', '🐦'], ['fish', '🐟'], ['reptile', '🦎']];
// ---------- v9.7: pet wearables (collars & hats/bows) ----------
const PET_WEAR = [
  { id: 'collar_red', slot: 'collar', col: '#e0604e', cost: 150, icon: '🔴' },
  { id: 'collar_blue', slot: 'collar', col: '#4f7cac', cost: 150, icon: '🔵' },
  { id: 'collar_pink', slot: 'collar', col: '#ef7fa0', cost: 150, icon: '🌸' },
  { id: 'collar_green', slot: 'collar', col: '#90be6d', cost: 150, icon: '🟢' },
  { id: 'collar_gold', slot: 'collar', col: '#e8c25a', cost: 450, icon: '⭐' },
  { id: 'hat_party_pink', slot: 'hat', kind: 'party', hatCol: '#ef7fa0', cost: 320, icon: '🎉' },
  { id: 'hat_party_blue', slot: 'hat', kind: 'party', hatCol: '#4f7cac', cost: 320, icon: '🎉' },
  { id: 'bow_pink', slot: 'hat', kind: 'bow', hatCol: '#ff9ac1', cost: 260, icon: '🎀' },
  { id: 'bow_purple', slot: 'hat', kind: 'bow', hatCol: '#8a6fb5', cost: 260, icon: '🎀' },
  { id: 'bow_yellow', slot: 'hat', kind: 'bow', hatCol: '#f2c14e', cost: 260, icon: '🎀' },
  // v9.78: more collars, hats and a new CLOTHES slot
  { id: 'collar_bell', slot: 'collar', kind: 'bell', col: '#e0604e', cost: 250, icon: '🔔' },
  { id: 'collar_heart', slot: 'collar', kind: 'heart', col: '#ff9ac1', cost: 300, icon: '💗' },
  { id: 'collar_pearl', slot: 'collar', kind: 'pearl', col: '#ffffff', cost: 600, icon: '🤍' },
  { id: 'collar_rainbow', slot: 'collar', kind: 'rainbow', col: '#ff9ac1', cost: 500, icon: '🌈' },
  { id: 'bandana_red', slot: 'collar', kind: 'bandana', col: '#e0604e', cost: 280, icon: '🧣' },
  { id: 'bandana_blue', slot: 'collar', kind: 'bandana', col: '#4f7cac', cost: 280, icon: '🧣' },
  { id: 'hat_crown', slot: 'hat', kind: 'crown', cost: 800, icon: '👑' },
  { id: 'hat_flower', slot: 'hat', kind: 'flower', cost: 450, icon: '💐' },
  { id: 'hat_beret', slot: 'hat', kind: 'beret', hatCol: '#d9534f', cost: 350, icon: '🎨' },
  { id: 'hat_santa', slot: 'hat', kind: 'santa', cost: 400, icon: '🎅' },
  { id: 'hat_witch', slot: 'hat', kind: 'witch', hatCol: '#f2c14e', cost: 450, icon: '🧙' },
  { id: 'cap_blue', slot: 'hat', kind: 'cap', hatCol: '#4f7cac', cost: 300, icon: '🧢' },
  { id: 'cap_pink', slot: 'hat', kind: 'cap', hatCol: '#ef7fa0', cost: 300, icon: '🧢' },
  { id: 'sweater_red', slot: 'cloth', kind: 'stripe', col: '#e0604e', col2: '#ffffff', cost: 500, icon: '🧶' },
  { id: 'sweater_blue', slot: 'cloth', kind: 'stripe', col: '#4f7cac', col2: '#bfe0ff', cost: 500, icon: '🧶' },
  { id: 'hoodie_pink', slot: 'cloth', kind: 'hoodie', col: '#ff9ac1', cost: 650, icon: '🧥' },
  { id: 'hoodie_gray', slot: 'cloth', kind: 'hoodie', col: '#9aa0aa', cost: 650, icon: '🧥' },
  { id: 'dress_polka', slot: 'cloth', kind: 'dress', col: '#ff7ab8', col2: '#ffffff', cost: 800, icon: '👗' },
  { id: 'raincoat', slot: 'cloth', kind: 'rain', col: '#ffd23a', cost: 700, icon: '☔' },
  { id: 'tux', slot: 'cloth', kind: 'tux', col: '#2b2d42', cost: 900, icon: '🤵' },
  { id: 'sailor', slot: 'cloth', kind: 'sailor', col: '#ffffff', cost: 750, icon: '⚓' },
  { id: 'tee_heart', slot: 'cloth', kind: 'heart', col: '#ffffff', col2: '#ff5a7a', cost: 450, icon: '👕' },
  { id: 'dots_mint', slot: 'cloth', kind: 'dots', col: '#7bd3b0', col2: '#ffffff', cost: 500, icon: '👚' },
];
const PET_WEAR_SLOTS = ['collar', 'hat', 'cloth'];
const HOUSE_SIZE = cap => cap >= 5 ? 3 : cap >= 3 ? 2 : cap >= 2 ? 1 : 0;
const houseModelCost = (m, slots) => Math.round(m.cost * (1 + Math.max(0, slots - 3) * .08) / 5) * 5;

// ---------- v8.3: staff ----------
const STAFF_ROLES = [
  { id: 'clean', icon: '🧹', ulv: 1, hire: 250, wage: 30, col: '#8fd0f0' },
  { id: 'porter', icon: '📦', ulv: 1, hire: 300, wage: 35, col: '#f0b43c' },
  { id: 'cashier', icon: '🧾', ulv: 2, hire: 500, wage: 45, col: '#90be6d' },
  { id: 'care', icon: '🍖', ulv: 3, hire: 600, wage: 50, col: '#ef8fa8' },
  { id: 'online', icon: '💻', ulv: 2, hire: 550, wage: 45, col: '#9a7ad9' },
  { id: 'guard', icon: '💂', ulv: 6, hire: 700, wage: 55, col: '#c9a06a' },
  { id: 'groomer', icon: '✂️', ulv: 5, hire: 1500, wage: 80, col: '#e98ad0', needItem: 'groomtable' }, // v1.25: grooms at the grooming table
  { id: 'sales', icon: '🤵', ulv: 20, hire: 2500, wage: 85, col: '#2f4f8a' },                      // 펫샾 매니저: 추천·상담·분양 및 고민 해결
];
// v1.100.42: 직원(펫샵/펫카페/펫병원/농장 등 전부) 전용 원화가님 그림(머리 30종+옷 30종) 배정 -
// 펫샵 매니저(sales)만 1번(빨간 M자 모자) 고정, 나머지는 같은 캐릭터 시드(seed)로 뽑힌 성별
// (ART.randomHuman이 반환하는 lk.lash: true=여성)에 맞는 머리/옷 번호 중에서 결정적으로(매번 같은 값) 골라줌.
// 완벽한 성별 구분은 아니고(그림만 보고 눈대중으로 구분함) 최선의 매칭.
const STAFF_HEAD_MALE = [6, 9, 12, 15, 18, 22, 24, 28, 30];
const STAFF_HEAD_FEMALE = [2, 3, 4, 5, 7, 8, 10, 11, 13, 14, 16, 17, 19, 20, 21, 23, 25, 26, 27, 29];
// 몸(outfit) 30번 검정 앞치마는 매니저 전용 - 일반 직원 풀에서는 제외
const STAFF_OUTFIT_MALE = [1, 6, 9, 10, 12, 13, 15, 16, 18, 22, 24, 25, 26, 28];
const STAFF_OUTFIT_FEMALE = [2, 3, 4, 5, 7, 8, 11, 14, 17, 19, 20, 21, 23, 27, 29];
const STAFF_MANAGER_HEAD = 1;
const STAFF_MANAGER_OUTFIT = 30; // 매니저는 머리1번 + 몸30번(검정 앞치마) 고정, 다른 조합 불가
function applyStaffArt(lk, seed, isManager) {
  const s2 = Math.floor((Math.abs(seed || 1) * 48271) % 2147483647); // randomHuman과는 다른 값이 나오게 한번 더 섞은 결정적 난수
  const headPool = lk.lash ? STAFF_HEAD_FEMALE : STAFF_HEAD_MALE;
  const outfitPool = lk.lash ? STAFF_OUTFIT_FEMALE : STAFF_OUTFIT_MALE;
  if (isManager) {
    lk.staffHead = STAFF_MANAGER_HEAD;
    lk.staffOutfit = STAFF_MANAGER_OUTFIT;
  } else {
    lk.staffHead = headPool[s2 % headPool.length];
    lk.staffOutfit = outfitPool[Math.floor(s2 / headPool.length) % outfitPool.length];
  }
  return lk;
}
const ONLINE_RATE = 0.2;
const PC_ITEMS = ['x_pcdesk', 'desk'];
const REP_MAX = 500;
const repTier = r => Math.min(5, Math.floor((r || 0) / 100));
const REP_TIERS = [{ ic: '', col: '#f2b632' }, { ic: '🥉', col: '#d08a4e' }, { ic: '🥈', col: '#a8b4c4' }, { ic: '🥇', col: '#f5c542' }, { ic: '💎', col: '#5fc8f0' }, { ic: '👑', col: '#ff6fae' }];
const STAFF_MAX = 10;
const STAFF_PER_ROLE = 5;
const staffRoleOf = key => String(key).split('#')[0];
const staffHireCost = (r, n) => Math.round(r.hire * (1 + n * .6) / 10) * 10;
const STAFF_DUR = [0, 3, 2.4, 2, 1.6, 1.3, 1.1, 0.9, 0.75, 0.6, 0.4];          // seconds of work per task (plus walking)
const STAFF_WAGE_K = [0, 1, 1.6, 2.4, 3.4, 4.6, 5.6, 6.7, 7.9, 9.2, 10.6];      // daily wage multiplier
const STAFF_UP_K = [0, 0, 1.5, 3, 6, 10, 15, 21, 28, 36, 45];             // upgrade cost multiplier (× hire cost)
const staffWage = (r, lv) => Math.round(r.wage * BAL.WAGE_K * STAFF_WAGE_K[lv] / 5) * 5;
const staffUpCost = (r, lv) => Math.round(r.hire * STAFF_UP_K[lv] * (r.id === 'sales' ? 4 : 1) / 10) * 10;

// v9.98 balance: ordering pets from the supplier costs more (sale prices unchanged)
for (const k in SPECIES) SPECIES[k].cost = Math.round(SPECIES[k].cost * BAL.BUY_K / 5) * 5;

// PET TOWN phase 2: the big buildings (café, hospital, farm, my home, salon, park, lake, monument) stand where the player built
// them. S.lay[k] = { x, y } = top-left tile of the building's biggest footprint (it grows inside that box). No entry = not built.
const LAY = (k, s) => { const st = s || (typeof S !== 'undefined' && S); return (st && st.lay && st.lay[k]) || null; };
const LAY_FAR = -5000; // where a building that is not built yet "is": far outside the map, never drawn, never in the way
