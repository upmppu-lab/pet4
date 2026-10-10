// ================= Personalities, customer needs, letters =================
const TRAITS = {
  playful:   { icon: '😜', ko: '장난꾸러기', ru: 'Проказник',  hunger: 1,   bored: 1.5, stress: 1,   bath: 0 },
  shy:       { icon: '🙈', ko: '겁쟁이',     ru: 'Трусишка',   hunger: 1,   bored: .9,  stress: 1.3, bath: 8 },
  glutton:   { icon: '🍗', ko: '식탐왕',     ru: 'Обжора',     hunger: 1.6, bored: 1,   stress: 1,   bath: 0 },
  sweet:     { icon: '🥰', ko: '애교쟁이',   ru: 'Ласкушка',   hunger: 1,   bored: 1.1, stress: .9,  bath: 0 },
  lazy:      { icon: '😴', ko: '잠꾸러기',   ru: 'Соня',       hunger: .9,  bored: .6,  stress: .8,  bath: 4 },
  curious:   { icon: '🧐', ko: '호기심쟁이', ru: 'Любопытный', hunger: 1,   bored: 1.3, stress: 1,   bath: 0 },
  calm:      { icon: '😌', ko: '얌전이',     ru: 'Тихоня',     hunger: .9,  bored: .8,  stress: .7,  bath: 0 },
  energetic: { icon: '⚡', ko: '활발이',     ru: 'Непоседа',   hunger: 1.2, bored: 1.4, stress: 1.1, bath: 2 },
};
const TRAIT_IDS = Object.keys(TRAITS);
const NEEDS = [
  { id: 'apt', traits: ['calm', 'shy', 'lazy'], ko: '아파트에서 키우기 좋은 조용한 아이를 찾아요', ru: 'Ищу тихого питомца для квартиры' },
  { id: 'kids', traits: ['playful', 'energetic', 'sweet'], ko: '어린 아이들과 잘 어울리는 활발한 아이면 좋겠어요', ru: 'Нужен весёлый питомец, который поладит с детьми' },
  { id: 'cuddle', traits: ['sweet'], ko: '안기는 걸 좋아하는 애교 많은 아이요!', ru: 'Хочу ласкового питомца, который любит обнимашки!' },
  { id: 'busy', traits: ['lazy', 'calm'], ko: '바쁜 직장인이라 순하고 손이 덜 가는 아이가 좋아요', ru: 'Я много работаю — нужен спокойный, неприхотливый питомец' },
  { id: 'walk', traits: ['energetic', 'playful'], ko: '같이 산책하고 뛰어놀 에너지 넘치는 아이!', ru: 'Ищу энергичного друга для прогулок и игр!' },
  { id: 'elder', traits: ['sweet', 'calm'], ko: '할머니 말벗이 되어줄 다정한 아이를 찾아요', ru: 'Ищу доброго компаньона для бабушки' },
  { id: 'smart', traits: ['curious'], ko: '이것저것 궁금해하는 똑똑한 아이가 좋아요', ru: 'Хочу любознательного и умного питомца' },
  { id: 'foodie', traits: ['glutton', 'energetic'], ko: '잘 먹고 튼튼한 아이면 좋겠어요', ru: 'Хочу крепкого питомца с хорошим аппетитом' },
];
const CUST_NAMES = {
  ko: {
    m: {
      two: [
        '김준', '이솔', '박찬', '최건', '정민', '한결', '오혁', '장훈', '서진', '강산',
        '조윤', '윤재', '임율', '류한', '신우', '권혁', '황현', '송민', '홍찬', '고민',
        '문결', '양준', '백솔', '손율', '허진', '남우', '심환', '노겸', '곽율', '차민',
        '민준', '서준', '도윤', '예준', '시우', '하준', '주원', '지호', '지후', '준서',
        '준우', '현우', '도현', '건우', '우진', '선우', '연우', '정우', '승우', '승현',
        '유준', '시윤', '민재', '진우', '성민', '태민', '동현', '재윤', '태윤', '수호'
      ],
      three: [
        '김민준', '이서준', '박도윤', '최예준', '정시우', '강하준', '조주원', '윤지호', '장준서', '임현우',
        '한도현', '오건우', '서우진', '신선우', '권연우', '황정우', '안승우', '송승현', '류유준', '홍시윤',
        '고민재', '문진우', '양동현', '손준혁', '배은우', '백유찬', '허하민', '유규민', '남재윤', '심수호',
        '노태민', '곽동하', '차성민', '전태윤', '구지훈', '성재원', '나민규', '민찬우', '유진성', '진광수',
        '엄경민', '채상우', '원세진', '천승호', '방우혁', '공도원', '현로운', '함서진', '표태양', '변선호',
        '강마루', '김바다', '이우람', '박도담', '신마루', '윤가람', '정슬옹', '최산들', '한마루', '오새론'
      ],
      four: [
        '남궁민수', '남궁도윤', '남궁준서', '남궁현우', '황보민재', '황보하준', '황보우진', '선우민준', '선우지호', '선우도현',
        '제갈지훈', '제갈승우', '제갈정우', '독고준혁', '사공은우', '사공준혁', '남궁선우', '황보승호', '제갈유찬', '독고태윤',
        '김하늘솔', '이바다람', '박마루한', '최도담찬', '정우람솔', '강푸른솔', '윤가람찬', '장새마루', '신늘푸름', '임한빛누리',
        '한슬옹찬', '오큰바위', '서새솔찬', '권빛가람', '황든해솔', '안힘찬솔', '송참나무', '류벼리솔', '백마루솔', '고가람찬'
      ]
    },
    f: {
      two: [
        '김별', '이봄', '박린', '최빛', '정하', '한설', '윤채', '서란', '강꽃', '조은',
        '임솔', '오진', '신비', '유라', '권슬', '황초', '송이', '홍단', '고은', '문별',
        '양희', '백린', '손봄', '허솔', '남채', '심비', '노율', '곽린', '차별', '전빛',
        '서연', '서윤', '지우', '서현', '하은', '하윤', '민서', '지아', '윤서', '채원',
        '지유', '은서', '수아', '다은', '예은', '수빈', '지민', '소율', '예원', '지원',
        '시은', '채은', '나은', '하린', '유진', '아린', '유나', '서아', '다인', '가은'
      ],
      three: [
        '김서연', '이서윤', '박지우', '최서현', '정하은', '강하윤', '조민서', '윤지아', '장채원', '임지유',
        '한은서', '오수아', '서다은', '신예은', '권수빈', '황소율', '안예원', '송지원', '류시은', '홍채은',
        '고나은', '문하린', '양유진', '손아린', '배유나', '백서아', '허가은', '유민지', '남예린', '심보민',
        '노윤아', '곽지안', '차소은', '전채윤', '구수현', '성혜원', '나다현', '민아윤', '유은채', '진세아',
        '엄미소', '채서영', '원다인', '천예나', '방하율', '공아라', '현나린', '함소피', '표아현', '변채아',
        '이하늘', '박아름', '김보람', '최슬기', '정나래', '강새롬', '윤다솜', '장소리', '신보미', '임이슬'
      ],
      four: [
        '남궁서연', '남궁지우', '남궁하은', '황보혜린', '황보수아', '황보채원', '선우은서', '선우채원', '선우지유', '제갈서윤',
        '제갈하은', '제갈다은', '독고혜린', '사공채원', '사공서연', '남궁예린', '황보서현', '선우민서', '제갈수아', '사공소율',
        '김꽃보라', '이꽃잎새', '박나예슬', '최이슬비', '정은하수', '강한나래', '윤별하늘', '장소리새', '신새하늘', '임초롱이',
        '오미리내', '서보드레', '권달빛솔', '황단비꽃', '안아침별', '송솔바람', '류물보라', '백들꽃별', '고하늘새', '문별빛아'
      ]
    }
  },
  ru: {
    m: [
      'Александр', 'Дмитрий', 'Максим', 'Артём', 'Михаил', 'Иван', 'Даниил', 'Кирилл', 'Андрей', 'Егор',
      'Никита', 'Алексей', 'Матвей', 'Роман', 'Владимир', 'Ярослав', 'Сергей', 'Владислав', 'Павел', 'Тимофей',
      'Николай', 'Денис', 'Константин', 'Виктор', 'Антон', 'Илья', 'Олег', 'Глеб', 'Юрий', 'Борис',
      'Вадим', 'Вячеслав', 'Леонид', 'Семён', 'Руслан', 'Степан', 'Евгений', 'Григорий', 'Фёдор', 'Лев',
      'Анатолий', 'Арсений', 'Марк', 'Пётр', 'Станислав'
    ],
    f: [
      'Анастасия', 'Мария', 'Анна', 'София', 'Дарья', 'Виктория', 'Полина', 'Екатерина', 'Ксения', 'Арина',
      'Александра', 'Алиса', 'Валерия', 'Елизавета', 'Варвара', 'Вероника', 'Милана', 'Кристина', 'Ольга', 'Елена',
      'Татьяна', 'Наталья', 'Юлия', 'Светлана', 'Евгения', 'Надежда', 'Любовь', 'Кира', 'Диана', 'Алёна',
      'Василиса', 'Ульяна', 'Маргарита', 'Ангелина', 'Злата', 'Вера', 'Инна', 'Яна', 'Марина', 'Олеся',
      'Аделина', 'Лариса', 'Мирослава', 'Таисия', 'Нина'
    ]
  }
};
// 하위 호환성을 위해 flat 배열도 함께 제공
(() => {
  const flatKo = [...CUST_NAMES.ko.m.two, ...CUST_NAMES.ko.m.three, ...CUST_NAMES.ko.m.four, ...CUST_NAMES.ko.f.two, ...CUST_NAMES.ko.f.three, ...CUST_NAMES.ko.f.four];
  const flatRu = [...CUST_NAMES.ru.m, ...CUST_NAMES.ru.f];
  Object.assign(flatKo, { m: CUST_NAMES.ko.m, f: CUST_NAMES.ko.f });
  Object.assign(flatRu, { m: CUST_NAMES.ru.m, f: CUST_NAMES.ru.f });
  CUST_NAMES.ko = flatKo;
  CUST_NAMES.ru = flatRu;
})();

function pickHumanName(lang, seedOrGender, excludeNames) {
  const isRu = lang === 'ru';
  let gender = 'm';
  if (seedOrGender === 'f' || seedOrGender === 'm') {
    gender = seedOrGender;
  } else if (typeof ART !== 'undefined' && ART.genderOf) {
    gender = ART.genderOf(seedOrGender);
  } else if (typeof seedOrGender === 'number') {
    const s = (Math.abs(seedOrGender || 1) * 2654435761) % 4294967296;
    gender = (((s * 1664525 + 1013904223) % 4294967296) / 4294967296) < .55 ? 'f' : 'm';
  } else {
    gender = Math.random() < .5 ? 'f' : 'm';
  }

  let candidates = [];
  if (isRu) {
    candidates = CUST_NAMES.ru[gender] || CUST_NAMES.ru.m;
  } else {
    const pools = CUST_NAMES.ko[gender] || CUST_NAMES.ko.m;
    // 다양하게 2자(~25%), 3자(~65%), 4자(~10%) 골고루 배정
    const roll = typeof seedOrGender === 'number' ? ((Math.abs(seedOrGender) * 13) % 100) / 100 : Math.random();
    if (roll < .25) candidates = pools.two;
    else if (roll < .90) candidates = pools.three;
    else candidates = pools.four;
  }

  if (excludeNames && typeof excludeNames.has === 'function') {
    const filtered = candidates.filter(n => !excludeNames.has(n));
    if (filtered.length) candidates = filtered;
  }

  const pickIdx = typeof seedOrGender === 'number' ? Math.abs(seedOrGender) % candidates.length : Math.floor(Math.random() * candidates.length);
  return candidates[pickIdx] || (isRu ? 'Иван' : '김민준');
}

function isMismatchedGenderName(name, gender, lang) {
  if (!name) return true;
  const isRu = lang === 'ru';
  if (isRu) {
    // 러시아어 플레이 중 한국어 이름이 있으면 반드시 교체
    if (/[가-힣]/.test(name)) return true;
    if (gender === 'f' && CUST_NAMES.ru.m.includes(name)) return true;
    if (gender === 'm' && CUST_NAMES.ru.f.includes(name)) return true;
    const oldMaleRu = ['Дима', 'Иван', 'Миша', 'Паша', 'Егор', 'Лёша', 'Никита', 'Артём'];
    const oldFemaleRu = ['Аня', 'Маша', 'Катя', 'Оля', 'Лиза', 'Настя', 'Вика', 'Соня', 'Юля', 'Полина', 'Даша'];
    if (gender === 'f' && oldMaleRu.includes(name)) return true;
    if (gender === 'm' && oldFemaleRu.includes(name)) return true;
  } else {
    // 한국어 플레이 중 키릴 문자(러시아어) 이름이 있으면 반드시 교체
    if (/[а-яА-ЯёЁ]/.test(name)) return true;
    const maleAll = [...CUST_NAMES.ko.m.two, ...CUST_NAMES.ko.m.three, ...CUST_NAMES.ko.m.four, '지훈', '도윤', '예준', '현우', '민준', '태양', '준호', '시우'];
    const femaleAll = [...CUST_NAMES.ko.f.two, ...CUST_NAMES.ko.f.three, ...CUST_NAMES.ko.f.four, '민지', '서연', '하은', '수아', '지아', '다은', '채원', '나래', '소율', '윤아', '보람'];
    if (gender === 'f' && maleAll.includes(name) && !femaleAll.includes(name)) return true;
    if (gender === 'm' && femaleAll.includes(name) && !maleAll.includes(name)) return true;
  }
  return false;
}
const LETTERS = {
  great: {
    ko: ['{pet}가 온 뒤로 집이 매일 웃음바다예요 🥹 딱 저희 가족에게 맞는 아이를 골라주셔서 감사해요!', '{pet} 벌써 우리 집 서열 1위예요 😂 사장님 추천 최고!', '오늘 {pet}랑 첫 산책(?) 했어요! 너무 행복해요. 정말 감사합니다 💕', '{pet}가 제 무릎에서 잠들었어요… 이런 행복을 알려주셔서 고마워요 🌷'],
    ru: ['С тех пор как {pet} с нами, дома всегда смех 🥹 Спасибо, что подобрали идеального питомца!', '{pet} уже главный в доме 😂 Ваш совет был лучшим!', 'Сегодня первый день вместе с {pet}! Мы так счастливы. Спасибо 💕', '{pet} уснул(а) у меня на коленях… Спасибо за это счастье 🌷'],
  },
  ok: {
    ko: ['{pet}랑 조금씩 친해지는 중이에요 😊 잘 키울게요!', '{pet}가 새 집을 탐험 중이에요. 적응 잘하고 있어요!', '처음엔 낯가렸는데 {pet} 이제 밥 달라고 조르네요 ㅎㅎ'],
    ru: ['Мы с {pet} потихоньку привыкаем друг к другу 😊', '{pet} исследует новый дом. Всё хорошо!', 'Сначала стеснялся(ась), а теперь {pet} выпрашивает еду 😄'],
  },
  bad: {
    ko: ['{pet}는 귀엽지만… 저희 집이랑은 좀 안 맞는 것 같아요 😢 다음엔 조금 더 상담해 주세요.', '생각보다 {pet}가 저희 생활이랑 달라서 힘들어요 ㅠㅠ 그래도 노력해볼게요.'],
    ru: ['{pet} милый(ая), но нам не очень подходит 😢 В следующий раз посоветуйте внимательнее.', '{pet} оказался(ась) не таким, как мы ожидали… Будем стараться.'],
  },
  rescue: {
    ko: ['구조된 아이였다는 {pet}, 이제는 소파 주인이에요 🛋️ 새 삶을 선물해주셔서 감사합니다.'],
    ru: ['{pet}, которого(ую) когда-то спасли, теперь хозяин дивана 🛋️ Спасибо, что подарили ему новую жизнь.'],
  },
  celeb: {
    ko: ['팬 여러분 소개할게요, 우리 {pet} 💖 {shop}에서 만났어요! 강력 추천 ✨'],
    ru: ['Знакомьтесь, мой {pet} 💖 Нашли в «{shop}». Всем рекомендую ✨'],
  },
};
const TAGS = { ko: ['#반려동물', '#펫스타그램', '#새가족', '#입양', '#행복', '#냥스타그램', '#멍스타그램', '#오늘의털뭉치'], ru: ['#питомец', '#новыйдруг', '#любовь', '#счастье', '#котики', '#собачки', '#пушистик'] };
function randTrait() { return TRAIT_IDS[Math.floor(Math.random() * TRAIT_IDS.length)]; }
function traitName(id) { const tr = TRAITS[id]; return tr ? tr.icon + ' ' + (CFG.lang === 'ru' ? tr.ru : tr.ko) : ''; }
// Tricks learned by pet level, per category
const TRICKS = {
  dog: [['sit', 2], ['paw', 3], ['spin', 5], ['jump', 7], ['dance', 9]],
  cat: [['meow', 2], ['roll', 3], ['spin', 5], ['highfive', 7], ['dance', 9]],
  small: [['stand', 2], ['spin', 3], ['jump', 5], ['roll', 7], ['dance', 9]],
  bird: [['sing', 2], ['spin', 3], ['wave', 5], ['talk', 7], ['dance', 9]],
  fish: [['bubble', 2], ['spin', 3], ['jump', 5], ['hoop', 7], ['dance', 9]],
  reptile: [['nod', 2], ['spin', 3], ['stand', 5], ['wave', 7], ['dance', 9]],
};
const TRICK_NAME = {
  sit: ['앉아', 'Сидеть'], paw: ['손!', 'Лапу!'], spin: ['빙글빙글', 'Кружок'], jump: ['점프', 'Прыжок'], dance: ['댄스', 'Танец'],
  meow: ['애옹 인사', 'Мяу-привет'], roll: ['데굴데굴', 'Кувырок'], highfive: ['하이파이브', 'Дай пять'], stand: ['두 발로 서기', 'Стойка'],
  sing: ['노래하기', 'Песенка'], wave: ['손 흔들기', 'Помахать'], talk: ['말하기', 'Говорить'], bubble: ['뽀글뽀글', 'Пузырьки'], hoop: ['링 통과', 'Через кольцо'], nod: ['끄덕끄덕', 'Кивок'],
};
const petLvNeed = lv => 20 + lv * 15;
const PET_MAX_LV = 10;
function tricksOf(p) { const cat = SPECIES[p.sp].cat; return (TRICKS[cat] || TRICKS.small).filter(([, lv]) => (p.lv || 1) >= lv).map(([k]) => k); }
function trickName(k) { const n = TRICK_NAME[k]; return n ? (CFG.lang === 'ru' ? n[1] : n[0]) : k; }
