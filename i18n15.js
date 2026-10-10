// v8.7 strings
(() => {
  const L = { l_candles: ['캔들 세트', 'Свечи'], l_lantern: ['랜턴', 'Фонарик'], l_tablelamp: ['테이블 스탠드', 'Настольная лампа'], l_string: ['반짝 전구 줄', 'Гирлянда'], l_arc: ['아치 조명', 'Арочный торшер'], l_street: ['미니 가로등', 'Мини-фонарь'], l_moon: ['달 조명', 'Лампа-луна'], l_neon: ['네온 사인', 'Неоновая вывеска'], l_tree: ['반짝 나무', 'Светящееся дерево'] };
  const ko = {}, ru = {}; for (const k in L) { ko['d_' + k] = ko['hf_' + k] = L[k][0]; ru['d_' + k] = ru['hf_' + k] = L[k][1]; ko['huse_' + k] = '은은한 불빛이 예뻐요 ✨'; ru['huse_' + k] = 'Какой уютный свет ✨'; }
  Object.assign(I18N.ko, ko, {
    ownedN: '{n}개 보유', lightTag: '밤에 빛나요', hireMore: '한 명 더 고용',
    rt_0: '새싹 가게', rt_1: '브론즈 가게', rt_2: '실버 가게', rt_3: '골드 가게', rt_4: '다이아 가게', rt_5: '전설의 가게',
    repTierUp: '🎉 평판 등급 UP! {t} · 🪙{c} + 🎟️{n}', repPerk: '판매가 +{p}%', repTierDesc: '별 5개를 모으면 다음 등급으로 올라가요. 등급이 오를수록 판매가와 손님이 늘지만, 별 모으기는 조금씩 어려워져요.',
    playMenu: '놀아주기', playMenuDesc: '어떤 놀이를 할까요? 놀아주면 심심함·스트레스가 줄고 경험치를 받아요',
    pg_toyD: '구멍에서 튀어나오는 깃털을 잡아요', pg_catch: '간식 받아먹기', pg_catchHint: '끌어서 간식을 받아요! 연속으로 받으면 콤보, 8콤보면 🔥피버! 🧅🍫는 피하기', pg_catchD: '떨어지는 간식을 받아먹어요. 양파·초콜릿은 조심!',
    pg_hide: '숨바꼭질', pg_hideHint: '아이가 어느 상자에 숨는지 잘 보세요!', pg_hidePick: '어디에 숨었을까요? 상자를 누르세요', pg_hideD: '상자가 섞여요. 아이가 숨은 상자를 찾아요 (5판)', pg_found: '찾았다!', pg_miss: '여기 없어요', pg_round: '{n}판',
    pg_fetch: '공 던지기', pg_fetchHint: '움직이는 막대가 초록(노랑=만점) 칸에 올 때 탭! 3번 던져요', pg_fetchD: '타이밍 맞춰 공을 던지면 아이가 물어 와요 (3번, 짧아요)', pg_bubble: '비눗방울 놀이', pg_bubbleHint: '빠르게 연속으로 터뜨리면 콤보! 🌈는 주변까지 한꺼번에 펑!', pg_bubbleD: '비눗방울을 터뜨리면 아이가 폴짝 뛰어요',
  });
  Object.assign(I18N.ru, ru, {
    ownedN: 'есть: {n}', lightTag: 'светится ночью', hireMore: 'Нанять ещё',
    rt_0: 'Росток', rt_1: 'Бронза', rt_2: 'Серебро', rt_3: 'Золото', rt_4: 'Алмаз', rt_5: 'Легенда',
    repTierUp: '🎉 Новый ранг! {t} · 🪙{c} + 🎟️{n}', repPerk: 'цена +{p}%', repTierDesc: 'Соберите 5 звёзд — и магазин перейдёт на новый ранг. Выше ранг — выше цены и больше гостей, но звёзды копятся медленнее.',
    playMenu: 'Поиграть', playMenuDesc: 'Во что поиграем? Игры снижают скуку и стресс и дают опыт',
    pg_toyD: 'Ловите пёрышки из норок', pg_catch: 'Поймай вкусняшку', pg_catchHint: 'Ловите подряд — комбо, 8 подряд — 🔥 FEVER! Избегайте 🧅🍫', pg_catchD: 'Ловите падающие угощения. Осторожно: лук и шоколад!',
    pg_hide: 'Прятки', pg_hideHint: 'Смотрите, в какую коробку прячется питомец!', pg_hidePick: 'Где он? Нажмите на коробку', pg_hideD: 'Коробки перемешиваются. Найдите питомца (5 раундов)', pg_found: 'Нашли!', pg_miss: 'Тут пусто', pg_round: 'раунд {n}',
    pg_fetch: 'Апорт', pg_fetchHint: 'Тапните, когда стрелка в зелёной (жёлтая — идеально) зоне! 3 броска', pg_fetchD: 'Бросьте мяч в нужный момент — питомец принесёт его (3 броска)', pg_bubble: 'Мыльные пузыри', pg_bubbleHint: 'Лопайте быстро подряд — комбо! 🌈 лопает соседей', pg_bubbleD: 'Лопайте пузыри, а питомец будет прыгать',
  });
})();
Object.assign(I18N.ko, { st_floor_walnut: '호두나무', st_floor_white: '화이트 원목', st_floor_parquet: '쪽모이 원목', st_floor_lav: '라벤더 타일', st_floor_lemon: '레몬 타일', st_floor_checker: '핑크 체크', st_floor_carpetp: '핑크 카펫', st_floor_carpets: '하늘 카펫', st_floor_grass: '꽃잔디 카펫',
  st_wall_lav: '라벤더 줄무늬', st_wall_lemon: '레몬 도트', st_wall_heart: '하트 벽지', st_wall_star: '밤하늘 별', st_wall_gingham: '민트 깅엄', st_wall_brick: '빨간 벽돌', st_wall_flower: '꽃무늬', st_wall_peach: '피치 단색', st_wall_choco: '초코 판넬' });
Object.assign(I18N.ru, { st_floor_walnut: 'Орех', st_floor_white: 'Белёное дерево', st_floor_parquet: 'Паркет', st_floor_lav: 'Лавандовая плитка', st_floor_lemon: 'Лимонная плитка', st_floor_checker: 'Розовая клетка', st_floor_carpetp: 'Розовый ковёр', st_floor_carpets: 'Голубой ковёр', st_floor_grass: 'Ковёр-лужайка',
  st_wall_lav: 'Лавандовые полоски', st_wall_lemon: 'Лимонный горошек', st_wall_heart: 'Сердечки', st_wall_star: 'Звёздное небо', st_wall_gingham: 'Мятная клетка', st_wall_brick: 'Красный кирпич', st_wall_flower: 'Цветочки', st_wall_peach: 'Персиковые', st_wall_choco: 'Шоколадные панели' });
Object.assign(I18N.ko, { rotateBtn: '회전', noRotate: '이 가구는 돌릴 수 없어요', cantRotate: '돌릴 자리가 없어요. 조금 옮긴 뒤 돌려 주세요' });
Object.assign(I18N.ru, { rotateBtn: 'Повернуть', noRotate: 'Эту мебель нельзя повернуть', cantRotate: 'Нет места для поворота — сдвиньте немного' });
(() => {
  const N = { x_board: ['입간판', 'Штендер'], x_balloon: ['풍선 다발', 'Шарики'], x_scale: ['펫 체중계', 'Весы для питомцев'], x_monstera: ['몬스테라', 'Монстера'], x_beanbag: ['빈백 소파', 'Кресло-мешок'], x_rocking: ['흔들의자', 'Кресло-качалка'], x_photozone: ['하트 포토존', 'Фотозона-сердце'], x_gacha: ['캡슐 뽑기 기계', 'Автомат с капсулами'], x_agility: ['어질리티 코스', 'Аджилити'], x_vending: ['자판기', 'Торговый автомат'], x_dresser: ['서랍장', 'Комод'], x_island: ['아일랜드 식탁', 'Кухонный остров'] };
  const U = { x_rocking: ['흔들흔들~ 편안해요', 'Покачались~'], x_beanbag: ['푹신하게 쉬었어요', 'Мягко отдохнули'], x_photozone: ['찰칵! 커플 사진 📸', 'Щёлк! Фото вдвоём 📸'], x_island: ['간식을 만들었어요', 'Приготовили перекус'], x_dresser: ['옷을 정리했어요', 'Разложили вещи'], x_balloon: ['풍선이 둥실둥실', 'Шарики парят'], x_monstera: ['물을 줬어요 🌱', 'Полили 🌱'] };
  for (const k in N) { I18N.ko['d_' + k] = I18N.ko['hf_' + k] = N[k][0]; I18N.ru['d_' + k] = I18N.ru['hf_' + k] = N[k][1]; }
  for (const k in U) { I18N.ko['huse_' + k] = U[k][0]; I18N.ru['huse_' + k] = U[k][1]; }
  Object.assign(I18N.ko, { dc_all: '전체', dc_furn: '가구', dc_light: '조명', dc_deco: '장식', dc_pet: '펫 용품', homeOnlyNote: '욕조·세탁기 같은 생활 가구는 "우리 집 → 가구"에서 살 수 있어요' });
  Object.assign(I18N.ru, { dc_all: 'Все', dc_furn: 'Мебель', dc_light: 'Свет', dc_deco: 'Декор', dc_pet: 'Для питомцев', homeOnlyNote: 'Ванна, стиралка и т.п. — в разделе «Наш дом → Мебель»' });
})();
Object.assign(I18N.ko, { hc_all: '전체', hc_bed: '침실', hc_living: '거실', hc_kitchen: '주방·욕실', hc_deco: '장식', hc_light: '조명', hc_pet: '펫' });
Object.assign(I18N.ru, { hc_all: 'Все', hc_bed: 'Спальня', hc_living: 'Гостиная', hc_kitchen: 'Кухня/ванная', hc_deco: 'Декор', hc_light: 'Свет', hc_pet: 'Питомцы' });
Object.assign(I18N.ko, {
  la_cook: '요리하기', la_eat: '식사하기', la_sleep: '낮잠', la_toilet: '화장실', la_shower: '샤워·목욕', la_tv: 'TV 보기', la_piano: '피아노', la_read: '책 읽기', la_laundry: '빨래', la_water: '화분 물주기', la_petfeed: '펫 밥 주기', la_rest: '쉬기', la_fire: '불멍', la_music: '음악 듣기', la_photo: '사진 찍기', la_dress: '옷 갈아입기',
  rc_egg: '계란말이', rc_kimbap: '김밥', rc_pasta: '스파게티', rc_curry: '카레라이스', rc_cake: '딸기 케이크', rc_treat: '수제 펫 간식',
  homeLife: '생활', lifeToday: '오늘의 집안 생활 {n}/{m}', lifeBonusGot: '오늘 보너스 받음!', lifeDesc: '가구를 눌러 요리·식사·화장실·샤워 등을 해 보세요. 하루에 활동마다 첫 번째에 코인을 받고, 5가지를 하면 보너스(코인+뽑기권)!', lifeGo: '누르면 해요', myDishes: '만들어 둔 음식',
  lifeDone: '{a} 완료! 🪙{c} ({n}/{m})', lifeBonus: '🎉 오늘의 집안 생활 달성! 🪙{c} + 🎟️1', cooked: '{d} 완성! 식탁에서 먹을 수 있어요', ate: '{d} 냠냠! 맛있어요 😋', petFed: '아이들이 맛있게 먹었어요 🥣', petTreat: '수제 간식에 아이들이 신났어요! 🦴💕',
  needCookItem: '가스레인지나 주방 조리대가 있어야 요리할 수 있어요', needEatItem: '식탁이나 테이블이 있어야 해요', noDish: '먹을 음식이 없어요', noDishHint: '먹을 음식이 없어요. 가스레인지를 눌러 먼저 요리해요!',
  cookTitle: '요리하기', cookDesc: '재료비를 내고 요리해요. 만든 음식은 식탁·테이블을 눌러 먹을 수 있어요. 수제 펫 간식은 펫 밥그릇에서 아이들에게 줘요', rcEat: '먹으면 경험치 +{x}', rcPet: '펫 밥그릇에서 아이들에게 줄 수 있어요',
  eatTitle: '식사하기', eatDesc: '무엇을 먹을까요?', nyam: '냠냠',
  hf_x_toilet: '변기', hf_x_shower: '샤워 부스', hf_x_petbowl: '펫 밥그릇',
});
Object.assign(I18N.ru, {
  la_cook: 'Готовить', la_eat: 'Поесть', la_sleep: 'Поспать', la_toilet: 'Туалет', la_shower: 'Душ/ванна', la_tv: 'Смотреть ТВ', la_piano: 'Пианино', la_read: 'Читать', la_laundry: 'Стирка', la_water: 'Полить цветы', la_petfeed: 'Покормить питомцев', la_rest: 'Отдохнуть', la_fire: 'У камина', la_music: 'Музыка', la_photo: 'Фото', la_dress: 'Переодеться',
  rc_egg: 'Омлет-ролл', rc_kimbap: 'Кимпап', rc_pasta: 'Спагетти', rc_curry: 'Карри с рисом', rc_cake: 'Клубничный торт', rc_treat: 'Домашнее лакомство',
  homeLife: 'Быт', lifeToday: 'Домашние дела сегодня {n}/{m}', lifeBonusGot: 'Бонус получен!', lifeDesc: 'Нажимайте на мебель: готовка, еда, туалет, душ и др. За первое дело каждого вида в день — монеты, за 5 разных — бонус (монеты + билет)!', lifeGo: 'нажмите', myDishes: 'Готовая еда',
  lifeDone: '{a} — готово! 🪙{c} ({n}/{m})', lifeBonus: '🎉 Все дела на сегодня! 🪙{c} + 🎟️1', cooked: '{d} готово! Можно съесть за столом', ate: '{d} — ням-ням! 😋', petFed: 'Питомцы поели 🥣', petTreat: 'Питомцы в восторге от лакомства! 🦴💕',
  needCookItem: 'Нужна плита или кухня', needEatItem: 'Нужен стол', noDish: 'Нет еды', noDishHint: 'Нет еды. Сначала приготовьте на плите!',
  cookTitle: 'Готовка', cookDesc: 'Оплатите продукты и готовьте. Еду можно съесть за столом, лакомство — дать питомцам у миски', rcEat: 'опыт +{x}', rcPet: 'для питомцев (у миски)',
  eatTitle: 'Еда', eatDesc: 'Что будем есть?', nyam: 'ням',
  hf_x_toilet: 'Унитаз', hf_x_shower: 'Душевая', hf_x_petbowl: 'Миска для питомцев',
});
Object.assign(I18N.ko, { hm_dog1: '구름 쿠션 하우스', hm_cat1: '고양이 귀 쿠션집', trashQ: '가구 버리기', trashText: '{n}을(를) 버릴까요? 산 값의 30%를 돌려받아요.', trashBtn: '버리기', trashed: '버렸어요 · 🪙{c} 환불', trashCounter: '계산대는 버릴 수 없어요', trashBusy: '손님 아이가 묵고 있어서 버릴 수 없어요', trashHab: '안에 아이가 있거나 도착 예정이라 버릴 수 없어요. 먼저 옮겨 주세요', homeSellQ: '이 가구를 버릴까요? (절반 가격 환불)' });
Object.assign(I18N.ru, { hm_dog1: 'Домик-облачко', hm_cat1: 'Домик с ушками', trashQ: 'Выбросить мебель', trashText: 'Выбросить «{n}»? Вернётся 30% цены.', trashBtn: 'Выбросить', trashed: 'Выброшено · 🪙{c} возврат', trashCounter: 'Кассу выбросить нельзя', trashBusy: 'Там гостит питомец', trashHab: 'Внутри есть питомец или он в пути — сначала переселите', homeSellQ: 'Выбросить эту мебель? (вернётся половина)' });
// v9.7: farm
Object.assign(I18N.ko, {
  myFarm: '우리 농장', myFarmShort: '농장', farmWelcome: '농장에 왔어요! 씨앗을 심고 물을 줘 보세요',
  seedShop: '씨앗·농산물 상점', seedShopDesc: '씨앗을 사서 밭에 심고, 다 자란 농산물을 팔 수 있어요', buySeeds: '씨앗 사기', seedUnit: '개', haveSeed: '보유 {n}개',
  farmBox: '보관 상자', farmBoxDesc: '농장에서 수확한 작물과 달걀은 모두 이 상자에 모여요. 여기서 팔거나, 마을 게시판 부탁에 쓸 수 있어요. 나중에 카페를 지으면 카페 냉장고가 이 상자와 연결돼요.', farmBoxDescCafe: '수확물은 이 상자에 모이고, 카페 냉장고와 연결되어 있어요 (같은 재고).',
  sellProduce: '농산물 팔기', sellBtn: '1개 팔기', sellAllBtn: '전부 팔기', noProduce: '아직 수확한 농산물이 없어요',
  plantTitle: '무엇을 심을까요?', noSeedHint: '가진 씨앗이 없어요. 농장 입구의 상점에서 씨앗을 사 오세요!',
  crop_wheat: '밀', crop_carrot: '당근', crop_tomato: '토마토', crop_pumpkin: '호박',
  harvested: '{d} 수확했어요!', farmUpOk: '농장이 Lv{n}로 넓어졌어요! 🌾', noSeed: '심을 씨앗이 없어요',
  myTown: '우리 동네', myTownShort: '동네', townWelcome: '동네에 왔어요! 병원과 카페를 둘러보세요',
  tb_hospital: '펫 병원', tb_cafe: '펫 카페', hospitalDesc: '컨디션이 안 좋은 아이를 즉시 치료해요. 상태가 나쁠수록 치료비가 비싸요',
  cafeDesc: '아이를 카페에 데려가면 행복해지고, 하루 한 번 용돈도 받아요', treatBtn: '치료하기', visitBtn: '데려가기', noPetsYet: '아직 아이가 없어요',
  vetOk: '{name}를 치료했어요! 💚', cafeOk: '{name}와 카페에서 즐거운 시간을 보냈어요 ☕ 🪙{c}', cafeDone: '오늘은 이미 카페에 다녀왔어요',
  toolShop: '농기구 상점', toolShopDesc: '농기구를 사면 핫바에 추가돼요. 호미가 있어야 밭을 갈고, 물뿌리개가 있어야 물을 줄 수 있어요',
  tool_hoe: '호미', tool_watercan: '물뿌리개', toolOwned: '보유중 ✓', buyBtn: '구매하기', toolBought: '농기구를 샀어요! 핫바에서 선택해 보세요',
  needHoe: '호미가 있어야 밭을 갈 수 있어요', needWaterCan: '물뿌리개가 있어야 물을 줄 수 있어요',
  needHoeHint: '핫바에서 호미를 선택하세요 (농기구 상점에서 구매)', needWaterCanHint: '핫바에서 물뿌리개를 선택하세요 (농기구 상점에서 구매)',
  cafeName: '펫 카페', cafeLockedMsg: '🔒 브론즈 등급이 되면 펫 카페를 만들 수 있습니다', cafeReadyMsg: '☕ 이제 펫 카페를 지을 수 있어요! 눌러서 지어보세요',
  cafeBuildConfirm: '펫 카페를 지을까요? 🪙{c}', cafeBuildBtn: '건설하기', cafeBuilt: '☕ 펫 카페를 열었어요!', cafeComingSoon: '펫 카페는 곧 운영을 시작해요. 조금만 기다려주세요!',
  cafeNeedRep: '🔒 브론즈 등급이 되어야 지을 수 있어요',
  cafeShopBtn: '카페 가구 상점', cafeEditBtn: '카페 꾸미기', cafeShopDesc: '카페 전용 가구예요. 사면 카페 안에 놓이고, 눌러서 원하는 곳으로 옮길 수 있어요. 카페 레벨이 오르면 건물이 커지고 더 많은 가구를 놓을 수 있어요', cafeShopLocked: '펫 카페를 먼저 지어 주세요',
  cafeEditHint: '가구를 끌어서 옮기거나, 눌러 고른 뒤 옮길 자리를 눌러요', cafeBought: '🛋️ 카페 가구를 샀어요! 놓을 자리를 눌러 주세요', cafeSold: '🪙{c}에 되팔았어요',
  cafeBlocked: '길이 막혀요! 손님이 자리·문·기계에 갈 수 있어야 해요', cafeOverlap: '다른 가구와 겹쳐요', cafeOutside: '카페 안에만 놓을 수 있어요', cafePenOnly: '놀이터 울타리 안 전용', cafeNoRoom: '놓을 자리가 없어요. 카페를 넓혀 보세요', cafeNeedLv: '카페 Lv{n}부터',
  cc_all: '전체', cc_seat: '테이블', cc_play: '놀이·슬롯', cc_deco: '인테리어', cc_kit: '주방', cc_pen: '펫 놀이기구',
  cf_table: '2인용 테이블', cf_slot: '슬롯머신', cf_sofa: '소파', cf_bookshelf: '책장', cf_plant: '화분', cf_lamp: '스탠드 조명', cf_fountain: '펫 분수대', cf_towertree: '캣타워', cf_aquarium: '수족관', cf_jukebox: '주크박스', cf_arcade: '인형 뽑기', cf_photobooth: '포토부스', cf_counter: '카운터 (2칸)', cf_espresso: '커피머신', cf_shelf: '디저트 진열장', cf_ballpit: '볼풀', cf_slide: '미끄럼틀', cf_tunnel: '터널', cf_cattree: '캣휠·캣타워', cf_seesaw: '시소', cf_hoop: '점프 링', cf_scratch: '스크래처', cf_bowls: '물·밥그릇',
  cf_sink: '싱크대',
  hospName: '펫 병원', hospLockedMsg: '🔒 실버 등급이 되면 펫 병원을 지을 수 있어요', hospBuildConfirm: '펫 병원을 지을까요? 🪙{c}', hospBuilt: '🏥 펫 병원을 열었어요!', hospNeedRep: '🔒 실버 등급이 되어야 지을 수 있어요',
  farmMaxLand: '가장 넓은 밭이에요', farmAutoTitle: '일꾼이 심을 작물', farmAutoDesc: '일꾼은 씨앗이 없으면 씨앗 상점 가격에 수수료 15%를 더해 알아서 사 와요. 빈 땅은 직접 갈아요. 수확하면 25% 확률로 씨앗도 하나 나와요', farmAutoBest: '자동 (이익 최고)', st_farm: '농장', farmPanelDesc: '농장 밭을 넓히려면 땅을 사야 해요. 레벨이 올라도 저절로 넓어지지 않아요. 일꾼을 고용하면 씨 뿌리기·물주기·수확을 대신 해줘요 (밭은 직접 갈아 두어야 해요)', farmPlotsInfo: '갈아 둔 밭 {n}칸 · 수확 가능 {r}칸', farmBuyLand: '땅 넓히기', farmStaffDesc: '일꾼은 밭을 돌아다니며 알아서 일해요. 월급은 하루가 끝날 때 나가요', farmStaffFull: '일꾼은 {n}명까지 고용할 수 있어요', fstf_hand: '농장 일꾼', fstf_hand_d: '물주기·수확·닭 모이·달걀·씨 심기 중 가장 급한 일부터 알아서 해요. 레벨이 오르면 한 번에 더 많은 칸에 물을 줘요. 여러 명이면 일을 나눠서 해요', fstf_sower: '씨 뿌리는 일꾼', fstf_sower_d: '빈 밭에 가진 씨앗을 심어요', fstf_waterer: '물 주는 일꾼', fstf_waterer_d: '하루에 한 번 작물에 물을 줘요', fstf_harvester: '수확 일꾼', fstf_harvester_d: '다 자란 작물을 거둬요',
  hospFixedKeep: '기본 시설은 팔 수 없어요. 옮기는 건 돼요', cafeFixedKeep: '기본 시설은 팔 수 없어요. 옮기는 건 돼요', hsf_part: '유리 칸막이', hfd_part: '방을 나누는 벽이에요. 돌려서 원하는 곳에 세워요',
  cafe_cashdesk: '계산대', cstf_cashier: '계산 직원', cstf_cashier_d: '계산대에서 손님 계산을 도와요. 계산 금액이 조금 늘어요',
  cafeOrderTaken: '주문을 받았어요!',
  farmStockTitle: '수확물 · 씨앗 재고 (카페 냉장고와 같아요)',
  farmGrowing: '아직 다 안 자랐어요 (물 준 날 {n}/{m}일). 하루에 한 번씩 물을 줘야 자라요.', farmWateredToday: '오늘은 이미 물을 줬어요. 내일 다시 주세요!',
  fwhy_coin: '씨앗을 살 코인이 부족해요', fwhy_full: '심을 빈 땅이 없어요 (밭을 넓혀 보세요)', fwhy_none: '지금은 할 일이 없어요',
  coopBuyChick: '펫샵에서 병아리 사기',
  henTitle: '닭장', henDesc: '펫샵에서 병아리를 사서 닭장에 넣어 키워요. 3일이 지나 닭이 되면, 하루 한 번 사료를 주면 다음 날 아침에 계란을 0~3개 낳아요. 사료는 씨앗 상점에서 사요', coopBuild: '닭장 짓기', coopEmpty: '아직 닭이 없어요. 병아리를 사서 "닭장으로 보내기"를 눌러요',
  coopFeedStock: '사료 {n}개', coopFedToday: '오늘 먹이 {a}/{b}', coopEggsWait: '계란 {n}개 대기', coopFeedBtn: '🥣 먹이 주기', coopEggBtn: '🥚 계란 모으기', coopUpBtn: '닭장 넓히기', coopSend: '닭장으로 보내기',
  coopFull: '닭장이 꽉 찼어요. 닭장을 넓혀 보세요', coopNone: '먼저 농장에서 닭장을 지어야 해요', coopOnlyChick: '병아리만 닭장에 넣을 수 있어요', coopNoFeed: '사료가 없어요. 씨앗 상점에서 사 오세요', coopAllFed: '오늘은 모두 먹었어요', coopNoEgg: '모을 계란이 없어요',
  coopBuilt: '닭장을 지었어요! 🐔', coopUp: '닭장이 넓어졌어요!', coopFed: '{n}마리에게 먹이를 줬어요 🥣', coopEggs: '계란 {n}개를 모았어요 🥚', coopMoved: '{name}이(가) 닭장에 들어갔어요 🐤', good_chickfeed: '병아리·닭 사료',
  hosp_full: '사람들이 꽉 찼네…', hosp_reception: '접수', st_shop: '펫샵', st_cafe: '펫카페', st_hosp: '펫병원', stf_none: '아직 직원이 없어요',
  hospDesc: '아픈 아이를 데려온 손님이 와요. 접수 → 진료 → 치료 → 접수대에서 수납(치료비 받기) 순서예요. 손님은 직접 걸어 다니고, 방이 차 있으면 로비 긴 의자에서 기다려요. 환자를 눌러 단계를 진행하고, 직원을 고용하면 대신 해줘요. 병원 레벨이 오르면 공간이 넓어지고 새 방과 장비를 살 수 있어요. 기본 시설(로비 의자 2, 침대 1) 외에는 직접 사야 해요', hospTreatedCount: '지금까지 {n}마리 치료', hospPatients: '진료 대기', hospNoPatients: '아직 환자가 없어요. 병상이 비어 있으면 곧 아픈 아이가 와요', hospTreatBtn: '치료하기',
  hospTxList: '치료 종류', hospUnlocksTx: '해금:', hospUp: '병원 넓히기', hospUpOk: '🏥 병원이 {f}층이 되었어요! (Lv{n})', hospTreated: '🏥 치료 완료! 🪙{c}',
  hospShopBtn: '병원 가구 상점', hospEditBtn: '병원 꾸미기', hospShopDesc: '병원 전용 가구·장비예요. 사면 병원 안에 놓이고, 눌러서 옮길 수 있어요. 장비를 사면 새로운 치료가 열려요', hospShopLocked: '펫 병원을 먼저 지어 주세요',
  hospBought: '🏥 병원 가구를 샀어요! 놓을 자리를 눌러 주세요', hospSold: '🪙{c}에 되팔았어요', hospBlocked: '길이 막혀요! 손님이 병상·장비에 갈 수 있어야 해요', hospOverlap: '다른 가구와 겹쳐요', hospOutside: '병원 안에만 놓을 수 있어요', hospNoRoom: '놓을 자리가 없어요. 병원을 넓혀 보세요', hospNeedLv: '병원 Lv{n}부터', hospNeedEquip: '이 치료에 필요한 장비가 없어요',
  hc2_all: '전체', hc2_bed: '병상', hc2_equip: '의료 장비', hc2_deco: '인테리어',
  hsf_bed: '병상', hsf_pharmacy: '약 진열장', hsf_xray: 'X-ray 촬영기', hsf_incubator: '인큐베이터', hsf_medbath: '약욕 욕조', hsf_surgery: '수술대', hsf_scale: '체중계', hsf_iv: '링거대', hsf_sofa: '대기 소파', hsf_plant: '화분', hsf_lamp: '스탠드 조명', hsf_aquarium: '수족관', hsf_fountain: '분수대', hsf_vending: '자판기',
  tx_checkup: '건강 검진', tx_vaccine: '예방 접종', tx_bandage: '상처 치료', tx_xray: 'X-ray 검사', tx_incubate: '인큐베이터 치료', tx_medbath: '약욕', tx_surgery: '수술',  cafeDesc2: '펫샵에서 펫을 데려간 손님이 카페에 들러요. 조리대에서 요리를 만들어 서빙해보세요', cafeServedCount: '오늘까지 {n}번 서빙', cafeOrders: '들어온 주문', cafeOrdersEmpty: '아직 손님이 없어요. 펫을 분양하면 손님이 카페에 들러요',
  hfl_lobby: '접수·로비', hfl_clinic: '진료실', hfl_radio: '영상의학 (X-ray)', hfl_surgery: '수술실', hfl_ward: '입원실',
  hfld_lobby: '접수대와 대기 공간', hfld_clinic: '진료대를 사서 놓아요', hfld_radio: 'X-ray 촬영기를 사서 놓아요', hfld_surgery: '수술대를 사서 놓아요', hfld_ward: '병상·인큐베이터·약욕조',
  hospFloorsTitle: '층별 안내', hospLevelNow: '병원 Lv{n} · 크기 {w}×{d}', hroom_lobby: '로비·접수', hroom_clinic: '진료실', hroom_treat: '치료실', hroom_radio: '영상실(X-ray·CT)', hroom_surgery: '수술실', hroom_ward: '입원실', hph_walkin: '병원으로 오는 중', hph_regwait: '접수 대기', hph_paywait: '수납 대기', hph_registering: '접수 중', hph_paying: '수납 중', hph_todesk: '접수대로 이동 중', hph_bench: '긴 의자에서 대기', hph_tostn: '이동 중', hph_atstn: '치료 기다리는 중', hph_leaving: '치료 끝! 집으로', hospRoomsTitle: '진료 공간', hospSkinTitle: '접수대 디자인', hskin_0: '기본', hskin_1: '대리석', hskin_2: '글라스', hskin_3: '럭셔리', hospCapFull: '지금 병원 레벨에서는 {n}개까지예요', hsf_ct: 'CT 촬영기', hsf_bench: '긴 의자 (3인)', hsf_desk: '의사 책상', cafeJoy: '손님 만족도', cafeJoyDesc: '놀이 직원이 펫들과 놀아 주면 올라가요. 만족도가 높을수록 손님이 식사비를 더 내요 (최대 +50%)', cafeStaffDesc: '직원을 고용하면 요리·서빙·놀이를 대신 해줘요. 직원 일급은 매일 정산돼요', cstf_cook: '요리사', cstf_cook_d: '주문에 필요한 요리를 만들어요', cstf_server: '서빙 직원', cstf_server_d: '완성된 요리를 손님께 서빙해요', cstf_play: '놀이 직원', cstf_play_d: '손님의 펫과 놀아 줘서 만족도를 올려요', buildingsTitle: '건물 (카페·병원)', farmTitle: '농장', farmUpDesc: '밭이 넓어져서 작물을 더 많이 키울 수 있어요', farmUpOk: '🌾 농장이 {n}×{n}로 넓어졌어요!', bldNotBuilt: '아직 짓지 않았어요', floorSuffix: '층', hospRaiseDesc: '병원을 넓혀 새 방과 장비를 열어요',
 tx_exam: '진료', tx_drip: '수액 치료', tx_pay: '수납', hsf_tbed: '치료 침대', hospPayBtn: '수납하기', hospExamBtn: '진료하기', hospAtDesk: '접수대',
 hospStaffTab: '직원', hospStaffDesc: '직원을 고용하면 접수·진료·치료를 대신 해줘요. 처음엔 사장님이 직접 해요. 직원 월급은 매일 정산돼요', hstf_recept: '접수·수납 직원', hstf_recept_d: '접수와 수납(치료비 받기)', hstf_doctor: '수의사', hstf_doctor_d: '진료·X-ray·수술', hstf_nurse: '간호사', hstf_nurse_d: '수액·주사·상처 치료·입원',
 hospWage: '일급 {c}', hospHireBtn: '고용하기', hospStaffFull: '이 직종은 2명까지 고용할 수 있어요',
 hospPaid: '🧾 수납 완료! 🪙{c}', hospStepOk: '✅ 다음 단계로 넘어갔어요', hospHired: '👩‍⚕️ 직원을 고용했어요!', hospStaffUp: '⬆️ 직원이 Lv{n}이 되었어요', hospStations: '치료 자리 {n}개', hospFloorLock: '병원 Lv{n}에 열려요', hospNewFloor: '{n}층 {d} 개방',
  hospRegBtn: '접수하기', hospWaiting: '치료 자리가 나기를 기다리는 중이에요', hospWaitingShort: '대기', hospStepDone: '✅ 치료 한 단계 완료! 🪙{c}', hospWrongFloor: '이 가구는 이 층에 놓을 수 없어요',
  hospMiniDesc: '빨간 막대가 초록 구간에 있을 때 누르세요! 3번 중 많이 맞출수록 진료비가 올라가요', hospMiniRound: '{n}번째 시도', hospMiniTap: '지금!', hospMiniResult: '진료비 {p}%',
  ail_cold: '감기', ail_stomach: '배탈', ail_wound: '상처', ail_skin: '피부병', ail_fracture: '골절', ail_chill: '저체온', ail_swallow: '이물질 삼킴', ail_tumor: '종양', ail_beak: '부리·날개 부상',
  tx_reg: '접수', tx_rest: '입원 요양',
  hsf_reception: '접수 데스크', hsf_cabinet: '약장', hsf_sink: '세면대', hsf_monitor: '판독 모니터', hsf_exam: '진료대', hc2_stn: '치료 장비',
  cafeServeBtn: '서빙하기', cafeStock: '완성된 요리', cafeServed: '☕ 주문을 서빙했어요! 🪙{c}', cafeNoProduce: '그 요리가 부족해요. 조리대에서 만들어오세요', noDish: '아직 완성한 요리가 없어요',
  cafeCook: '조리대', cafeCookDesc: '농장 재료로 요리를 만들어요', cafeCookBtn: '만들기', cafeNeedIngredient: '재료가 부족해요. 농장에서 수확해오세요', cafeCooked: '🍳 요리를 완성했어요!', haveDish: '보유 {n}개',
  dish_bread: '빵', dish_saladbowl: '샐러드', dish_tomatosoup: '토마토 수프', dish_pumpkinpie: '호박 파이',
  rDayShort: '일', rBreed_full: '가득 찼어요 — 목장 레벨업하면 더 키울 수 있어요', rBreed_pair: '어른 암수 한 쌍이 필요해요', rBreed_grow: '아직 아기예요 — {n}일 뒤 어른이 되면 새끼를 낳을 수 있어요', rBreed_hungry: '오늘 암수 둘 다 밥을 먹어야 내일 아침 새끼가 생길 수 있어요', rBreed_ok: '배불러요! 내일 아침 새끼가 생길 수 있어요 (50%, 늦어도 3일 안에)', rHayBox: '건초 먹이통', rPigBox: '돼지 먹이통', rDrops: '바닥에 {n}개', rPickAll: '모두 줍기', ranchDesc2: '소는 건초 먹이통, 돼지는 돼지 먹이통에서 스스로 하루 한 번 먹어요. 밥을 먹은 어른은 다음 날 아침 목장 안에 🥛우유·🥩고기를 떨어뜨려요 — 눌러서 주우면 목장 상자(=카페 냉장고)로 가요.', rHayDesc: '버튼 한 번에 건초 10개를 사서 먹이통에 넣어요. 소 한 마리가 하루에 1개 먹어요.', rHayNeed: '소 {n}마리 → 하루 {n}개', rPigDesc: '오른쪽 농장 보관 상자의 수확물을 누르면 1개씩 돼지 먹이통으로 옮겨져요. 돼지 한 마리가 하루에 1개 먹어요.', rEmpty: '비어 있어요', rTapMove: '눌러서 옮기기', ranchPicked: '{i} 목장 상자로!', ranchHayBought: '🌿 건초 10개를 샀어요!', ranchAte: '{n}마리가 먹이를 먹었어요', ranchNoHayCoin: '건초 살 돈이 부족해요', ranchWage: '하루 {w}', ranchAct_hay: '건초 사서 채우는 중 🌿', ranchAct_pig: '돼지 먹이 옮기는 중 🥕', ranchName: '목장', ranchBox: '보관 상자', ranchDesc: '소는 건초(씨앗 가게), 돼지는 농작물(농장 보관 상자)을 하루에 한 번 먹어요. 밥을 먹은 어른 소·돼지는 다음 날 아침 우유·고기를 주고, 암수가 있으면 새끼도 낳아요 (목장 레벨만큼).', ranchCows: '소', ranchPigs: '돼지', ranchHay: '건초 {n}', ranchPigFood: '돼지 먹이: {c}', ranchNoCropShort: '돼지 먹이(농작물) 없음', ranchFeedBtn: '모두 먹이 주기', ranchCollectBtn: '모으기', ranchCap: '종류별 {n}마리', ranchBoxDesc: '우유·고기는 농장 보관 상자·카페 냉장고와 같은 창고에 보관돼요.', rg_milk: '우유', rg_meat: '고기', ranchHands: '목장 직원', ranchHandsDesc: '건초를 사서 먹이통을 채우고, 농장 상자의 수확물을 돼지 먹이통으로 옮기고, 떨어진 우유·고기를 주워 상자에 넣어요 (하루 월급 🪙{w})', ranchAct_feed: '먹이 주는 중 🌿🥕', ranchAct_collect: '우유·고기 줍는 중 🧺', ranchAct_idle: '쉬는 중', ranchNoHay: '건초가 없어요 (씨앗 가게에서 사요)', ranchNoCrop: '돼지 먹이로 줄 농작물이 없어요', ranchFed: '모두 이미 먹었어요', ranchFedOk: '🐄 {a}마리, 🐖 {b}마리에게 먹이를 줬어요!', ranchNothing: '모을 게 없어요', ranchCollected: '🧺 {n}개를 보관 상자에 넣었어요!', ranchUp: '목장이 Lv{n}이 됐어요!', ranchHired: '목장 직원을 고용했어요 🧑‍🌾', ranchBuilt: '목장을 지었어요! 🐄🐖 송아지·아기돼지가 두 마리씩 왔어요', ranchNeedLv: '목장은 레벨 {n}부터 지을 수 있어요', good_hay: '건초 (소 먹이)', treeSeeds: '열매나무 묘목', treeSeedsDesc: '한 번 심으면 계속 열매가 열려요! 처음엔 오래 걸리지만 그 뒤로는 며칠마다 여러 개씩 수확해요.', treeInfo: '{a}일 뒤 첫 수확 · 이후 {b}일마다 ×{n}', crop_apple: '사과나무', crop_peach: '복숭아나무', crop_orange: '오렌지나무', crop_cherry: '체리나무', crop_lemon: '레몬나무', crop_pear: '배나무', crop_mango: '망고나무', crop_potato: '감자', crop_corn: '옥수수', crop_lettuce: '상추', crop_strawberry: '딸기', crop_blueberry: '블루베리', crop_grape: '포도',
  goodsTitle: '식재료', good_egg: '계란',
  dish_milkshake: '밀크셰이크', dish_cheese: '수제 치즈', dish_pancake: '팬케이크', dish_icecream: '딸기 아이스크림', dish_steak: '스테이크', dish_burger: '햄버거', dish_pizza: '피자', dish_meatstew: '고기 스튜', dish_applepie: '사과파이', dish_peachsmoothie: '복숭아 스무디', dish_fruitsalad: '과일 샐러드', dish_lemonade: '레모네이드', dish_pearjuice: '배 주스', dish_mangolassi: '망고 라씨', dish_fries: '감자튀김', dish_cornsoup: '옥수수 수프', dish_omelet: '오믈렛', dish_sandwich: '샌드위치', dish_strawberrycake: '딸기 케이크', dish_blueberrymuffin: '블루베리 머핀', dish_grapejuice: '포도 주스',
  cafeFridge: '냉장고', cafeFridgeDesc: '농장에서 수확한 작물은 자동으로 냉장고에 들어와요. 요리는 여기 있는 재료로만 만들 수 있어요', cafeFridgeEmpty: '냉장고가 비었어요. 농장에서 수확하거나 씨앗상점에서 계란을 사오세요', cafeMoreDishes: '레벨이 오르면 새 요리 {n}개가 열려요',
  hospLotName: '펫 병원 부지', hospLotSoon: '준비 중',
  cafeUp: '카페 확장', cafeUpNext: '⬆️ 다음 단계 →', cafeUpBtn: '확장하기', cafeUpOk: '☕ 카페를 확장했어요! Lv{n}', cafeUpMax: '이미 최대로 확장했어요', cafeOrderMax: '동시 주문 {n}개',
});
Object.assign(I18N.ru, {
  myFarm: 'Наша ферма', myFarmShort: 'Ферма', farmWelcome: 'Добро пожаловать на ферму! Сажайте и поливайте',
  seedShop: 'Лавка семян и урожая', seedShopDesc: 'Покупайте семена, сажайте на грядки и продавайте урожай', buySeeds: 'Купить семена', seedUnit: 'шт', haveSeed: 'есть {n}',
  farmBox: 'Ящик', farmBoxDesc: 'Весь урожай и яйца попадают в этот ящик. Отсюда можно продавать или отдавать по просьбам жителей. Когда построите кафе, его холодильник будет брать продукты отсюда.', farmBoxDescCafe: 'Урожай хранится здесь; холодильник кафе использует тот же запас.',
  sellProduce: 'Продать урожай', sellBtn: 'Продать 1', sellAllBtn: 'Продать всё', noProduce: 'Урожая пока нет',
  plantTitle: 'Что посадить?', noSeedHint: 'Нет семян. Купите их в лавке у входа на ферму!',
  crop_wheat: 'Пшеница', crop_carrot: 'Морковь', crop_tomato: 'Помидор', crop_pumpkin: 'Тыква',
  harvested: '{d} собрано!', farmUpOk: 'Ферма выросла до ур.{n}! 🌾', noSeed: 'Нет семян для посадки',
  myTown: 'Наш городок', myTownShort: 'Городок', townWelcome: 'Добро пожаловать в городок! Загляните в больницу и кафе',
  tb_hospital: 'Ветклиника', tb_cafe: 'Кафе для питомцев', hospitalDesc: 'Мгновенно лечит питомца в плохом состоянии. Чем хуже состояние, тем дороже лечение',
  cafeDesc: 'Сходите с питомцем в кафе — он станет счастливее, и раз в день вы получите чаевые', treatBtn: 'Лечить', visitBtn: 'Взять с собой', noPetsYet: 'Питомцев пока нет',
  vetOk: '{name} вылечен(а)! 💚', cafeOk: 'Отличное время в кафе с {name} ☕ 🪙{c}', cafeDone: 'Уже были в кафе сегодня',
  toolShop: 'Магазин инвентаря', toolShopDesc: 'Купленный инвентарь появляется в хотбаре. Нужна мотыга, чтобы вскопать грядку, и лейка, чтобы полить',
  tool_hoe: 'Мотыга', tool_watercan: 'Лейка', toolOwned: 'Есть ✓', buyBtn: 'Купить', toolBought: 'Инструмент куплен! Выберите его в хотбаре',
  needHoe: 'Нужна мотыга, чтобы вскопать', needWaterCan: 'Нужна лейка, чтобы полить',
  needHoeHint: 'Выберите мотыгу в хотбаре (купите в магазине инвентаря)', needWaterCanHint: 'Выберите лейку в хотбаре (купите в магазине инвентаря)',
  cafeName: 'Кафе для питомцев', cafeLockedMsg: '🔒 Кафе откроется на бронзовом ранге', cafeReadyMsg: '☕ Теперь можно построить кафе! Нажмите, чтобы построить',
  cafeBuildConfirm: 'Построить кафе? 🪙{c}', cafeBuildBtn: 'Построить', cafeBuilt: '☕ Кафе открыто!', cafeComingSoon: 'Кафе скоро откроется. Подождите немного!',
  cafeNeedRep: '🔒 Нужен бронзовый ранг',
  cafeShopBtn: 'Мебель для кафе', cafeEditBtn: 'Обустроить кафе', cafeShopDesc: 'Мебель только для кафе. Купленное ставится внутри, нажмите и переместите куда хотите. С уровнем кафе здание растёт', cafeShopLocked: 'Сначала постройте кафе',
  cafeEditHint: 'Перетащите мебель или нажмите на неё, затем на новое место', cafeBought: '🛋️ Куплено! Нажмите, куда поставить', cafeSold: 'Продано за 🪙{c}',
  cafeBlocked: 'Проход перекрыт! Гости должны дойти до столов, двери и автоматов', cafeOverlap: 'Пересекается с мебелью', cafeOutside: 'Только внутри кафе', cafePenOnly: 'Только в загоне', cafeNoRoom: 'Нет места. Расширьте кафе', cafeNeedLv: 'С ур. кафе {n}',
  cc_all: 'Все', cc_seat: 'Столы', cc_play: 'Игры', cc_deco: 'Декор', cc_kit: 'Кухня', cc_pen: 'Для питомцев',
  cf_table: 'Стол на 2', cf_slot: 'Игровой автомат', cf_sofa: 'Диван', cf_bookshelf: 'Книжный шкаф', cf_plant: 'Цветок', cf_lamp: 'Торшер', cf_fountain: 'Фонтан', cf_towertree: 'Кошачье дерево', cf_aquarium: 'Аквариум', cf_jukebox: 'Музыкальный автомат', cf_arcade: 'Хватайка', cf_photobooth: 'Фотобудка', cf_counter: 'Стойка (2)', cf_espresso: 'Кофемашина', cf_shelf: 'Витрина', cf_ballpit: 'Бассейн с шарами', cf_slide: 'Горка', cf_tunnel: 'Туннель', cf_cattree: 'Игровой комплекс', cf_seesaw: 'Качели', cf_hoop: 'Кольцо', cf_scratch: 'Когтеточка', cf_bowls: 'Миски',
  cf_sink: 'Раковина',
  hospName: 'Ветклиника', hospLockedMsg: '🔒 Клинику можно построить с серебряного ранга', hospBuildConfirm: 'Построить ветклинику? 🪙{c}', hospBuilt: '🏥 Клиника открыта!', hospNeedRep: '🔒 Нужен серебряный ранг',
  farmMaxLand: 'Максимальный размер', farmAutoTitle: 'Что сажают работники', farmAutoDesc: 'Работник сам покупает семена по цене магазина +15% и вскапывает землю. При сборе урожая с шансом 25% выпадает семя', farmAutoBest: 'Авто (самое выгодное)', st_farm: 'Ферма', farmPanelDesc: 'Чтобы расширить поле, нужно купить землю — само оно не растёт. Работники сажают, поливают и собирают урожай (грядки нужно вскопать самому)', farmPlotsInfo: 'Грядок: {n} · Готово к сбору: {r}', farmBuyLand: 'Расширить поле', farmStaffDesc: 'Работники сами ходят по полю. Зарплата — в конце дня', farmStaffFull: 'Можно нанять до {n} работников', fstf_hand: 'Работник фермы', fstf_hand_d: 'Сам выбирает самое срочное: полив, урожай, корм для кур, яйца, посадка. С уровнем поливает больше грядок за раз. Несколько работников делят дела', fstf_sower: 'Сеятель', fstf_sower_d: 'Сажает семена на пустые грядки', fstf_waterer: 'Поливальщик', fstf_waterer_d: 'Раз в день поливает посевы', fstf_harvester: 'Сборщик', fstf_harvester_d: 'Собирает созревший урожай',
  hospFixedKeep: 'Базовое оборудование нельзя продать, но можно переставить', cafeFixedKeep: 'Базовое оборудование нельзя продать, но можно переставить', hsf_part: 'Стеклянная перегородка', hfd_part: 'Стенка для комнат. Можно повернуть',
  cafe_cashdesk: 'Касса', cstf_cashier: 'Кассир', cstf_cashier_d: 'Помогает на кассе — чуть больше выручки с каждого счёта',
  cafeOrderTaken: 'Заказ принят!',
  farmStockTitle: 'Урожай и семена (то же, что холодильник кафе)',
  farmGrowing: 'Ещё не выросло (дней полива: {n}/{m}). Поливайте раз в день.', farmWateredToday: 'Сегодня уже полито — приходите завтра!',
  fwhy_coin: 'Не хватает монет на семена', fwhy_full: 'Нет свободной земли (расширьте поле)', fwhy_none: 'Пока нет работы',
  coopBuyChick: 'Купить цыплёнка',
  henTitle: 'Курятник', henDesc: 'Купите цыплят в зоомагазине и переселите в курятник. Через 3 дня они станут курами: кормите раз в день — утром получите 0–3 яйца. Корм продаётся в магазине семян', coopBuild: 'Построить курятник', coopEmpty: 'Кур пока нет. Купите цыплёнка и нажмите «В курятник»',
  coopFeedStock: 'Корма: {n}', coopFedToday: 'Накормлено {a}/{b}', coopEggsWait: 'Яиц: {n}', coopFeedBtn: '🥣 Кормить', coopEggBtn: '🥚 Собрать яйца', coopUpBtn: 'Расширить', coopSend: 'В курятник',
  coopFull: 'Курятник полон — расширьте его', coopNone: 'Сначала постройте курятник на ферме', coopOnlyChick: 'В курятник можно только цыплят', coopNoFeed: 'Нет корма — купите в магазине семян', coopAllFed: 'Сегодня все накормлены', coopNoEgg: 'Нет яиц',
  coopBuilt: 'Курятник построен! 🐔', coopUp: 'Курятник расширен!', coopFed: 'Накормлено: {n} 🥣', coopEggs: 'Собрано яиц: {n} 🥚', coopMoved: '{name} в курятнике 🐤', good_chickfeed: 'Корм для кур',
  hosp_full: 'Все места заняты…', hosp_reception: 'Регистратура', st_shop: 'Магазин', st_cafe: 'Кафе', st_hosp: 'Клиника', stf_none: 'Сотрудников пока нет',
  hospDesc: 'Гости приводят больных питомцев. Нажмите на пациента, чтобы вылечить и получить плату. Оборудование открывает более дорогие процедуры', hospTreatedCount: 'Вылечено: {n}', hospPatients: 'Очередь', hospNoPatients: 'Пока нет пациентов. Если есть свободная койка, скоро придут', hospTreatBtn: 'Лечить',
  hospTxList: 'Процедуры', hospUnlocksTx: 'Открывает:', hospUp: 'Расширить клинику', hospUpOk: '🏥 Клиника выросла до {f} эт.! (ур.{n})', hospTreated: '🏥 Вылечено! 🪙{c}',
  hospShopBtn: 'Мебель для клиники', hospEditBtn: 'Обустроить клинику', hospShopDesc: 'Мебель и оборудование только для клиники. Купленное ставится внутри, можно переставлять. Оборудование открывает новые процедуры', hospShopLocked: 'Сначала постройте клинику',
  hospBought: '🏥 Куплено! Нажмите, куда поставить', hospSold: 'Продано за 🪙{c}', hospBlocked: 'Проход перекрыт! Гости должны дойти до коек и оборудования', hospOverlap: 'Пересекается с мебелью', hospOutside: 'Только внутри клиники', hospNoRoom: 'Нет места. Расширьте клинику', hospNeedLv: 'С ур. клиники {n}', hospNeedEquip: 'Нет нужного оборудования',
  hc2_all: 'Все', hc2_bed: 'Койки', hc2_equip: 'Оборудование', hc2_deco: 'Декор',
  hsf_bed: 'Койка', hsf_pharmacy: 'Аптечный шкаф', hsf_xray: 'Рентген', hsf_incubator: 'Инкубатор', hsf_medbath: 'Лечебная ванна', hsf_surgery: 'Операционный стол', hsf_scale: 'Весы', hsf_iv: 'Капельница', hsf_sofa: 'Диван', hsf_plant: 'Цветок', hsf_lamp: 'Торшер', hsf_aquarium: 'Аквариум', hsf_fountain: 'Фонтан', hsf_vending: 'Автомат',
  tx_checkup: 'Осмотр', tx_vaccine: 'Прививка', tx_bandage: 'Перевязка', tx_xray: 'Рентген', tx_incubate: 'Инкубатор', tx_medbath: 'Лечебная ванна', tx_surgery: 'Операция',  cafeDesc2: 'Гости, купившие питомца в зоомагазине, заходят в кафе. Готовьте блюда на плите и подавайте по заказу', cafeServedCount: 'Подано сегодня: {n}', cafeOrders: 'Заказы', cafeOrdersEmpty: 'Пока нет гостей. Продайте питомца, и гость зайдёт в кафе',
  hfl_lobby: 'Регистратура', hfl_clinic: 'Кабинеты', hfl_radio: 'Рентген', hfl_surgery: 'Операционная', hfl_ward: 'Стационар',
  hfld_lobby: 'Стойка регистрации и зал ожидания', hfld_clinic: 'Купите смотровые столы', hfld_radio: 'Купите рентген-аппарат', hfld_surgery: 'Купите операционный стол', hfld_ward: 'Койки, инкубатор, ванна',
  hospFloorsTitle: 'Этажи', hospLevelNow: 'Клиника ур.{n} · размер {w}×{d}', hroom_lobby: 'Холл и запись', hroom_clinic: 'Кабинет', hroom_treat: 'Процедурная', hroom_radio: 'Рентген и КТ', hroom_surgery: 'Операционная', hroom_ward: 'Стационар', hph_walkin: 'идёт в клинику', hph_regwait: 'ждёт записи', hph_paywait: 'ждёт оплаты', hph_registering: 'записывается', hph_paying: 'платит', hph_todesk: 'идёт к стойке', hph_bench: 'ждёт на скамье', hph_tostn: 'идёт', hph_atstn: 'ждёт лечения', hph_leaving: 'вылечен, идёт домой', hospRoomsTitle: 'Помещения', hospSkinTitle: 'Вид стойки', hskin_0: 'Обычная', hskin_1: 'Мрамор', hskin_2: 'Стекло', hskin_3: 'Люкс', hospCapFull: 'На этом уровне клиники максимум {n}', hsf_ct: 'КТ', hsf_bench: 'Скамья (3)', hsf_desk: 'Стол врача', cafeJoy: 'Довольство гостей', cafeJoyDesc: 'Растёт, когда сотрудник играет с питомцами. Чем выше, тем больше платят гости (до +50%)', cafeStaffDesc: 'Нанятые сотрудники готовят, подают и играют вместо вас. Зарплата — каждый день', cstf_cook: 'Повар', cstf_cook_d: 'готовит нужные блюда', cstf_server: 'Официант', cstf_server_d: 'подаёт готовые блюда', cstf_play: 'Аниматор', cstf_play_d: 'играет с питомцами гостей', buildingsTitle: 'Здания (кафе, клиника)', farmTitle: 'Ферма', farmUpDesc: 'Больше грядок для посадок', farmUpOk: '🌾 Ферма выросла до {n}×{n}!', bldNotBuilt: 'Ещё не построено', floorSuffix: ' эт.', hospRaiseDesc: 'Добавить этаж и новые отделения',
 tx_exam: 'Осмотр', tx_drip: 'Капельница', tx_pay: 'Оплата', hsf_tbed: 'Процедурная кушетка', hospPayBtn: 'Принять оплату', hospExamBtn: 'Осмотреть', hospAtDesk: 'у стойки',
 hospStaffTab: 'Персонал', hospStaffDesc: 'Нанятые сотрудники сами принимают, осматривают и лечат. Сначала всё делаете вы. Зарплата — каждый день', hstf_recept: 'Администратор', hstf_recept_d: 'запись и оплата', hstf_doctor: 'Ветеринар', hstf_doctor_d: 'осмотр, рентген, операции', hstf_nurse: 'Медсестра', hstf_nurse_d: 'капельницы, уколы, перевязки, стационар',
 hospWage: 'в день {c}', hospHireBtn: 'Нанять', hospStaffFull: 'Не больше 2 на должность',
 hospPaid: '🧾 Оплачено! 🪙{c}', hospStepOk: '✅ Следующий этап', hospHired: '👩‍⚕️ Сотрудник нанят!', hospStaffUp: '⬆️ Сотрудник получил ур.{n}', hospStations: 'Мест для лечения: {n}', hospFloorLock: 'Откроется на ур. {n}', hospNewFloor: 'Открывается {n} эт.: {d}',
  hospRegBtn: 'Записать', hospWaiting: 'Ждёт свободного места', hospWaitingShort: 'ждёт', hospStepDone: '✅ Этап завершён! 🪙{c}', hospWrongFloor: 'Эту мебель нельзя поставить на этот этаж',
  hospMiniDesc: 'Нажмите, когда красная полоса в зелёной зоне! Чем больше попаданий из 3, тем выше оплата', hospMiniRound: 'Попытка {n}', hospMiniTap: 'Сейчас!', hospMiniResult: 'Оплата {p}%',
  ail_cold: 'Простуда', ail_stomach: 'Живот', ail_wound: 'Рана', ail_skin: 'Кожа', ail_fracture: 'Перелом', ail_chill: 'Переохлаждение', ail_swallow: 'Проглотил', ail_tumor: 'Опухоль', ail_beak: 'Клюв/крыло',
  tx_reg: 'Запись', tx_rest: 'Стационар',
  hsf_reception: 'Регистратура', hsf_cabinet: 'Шкаф', hsf_sink: 'Раковина', hsf_monitor: 'Монитор', hsf_exam: 'Смотровой стол', hc2_stn: 'Оборудование',
  cafeServeBtn: 'Подать', cafeStock: 'Готовые блюда', cafeServed: '☕ Заказ подан! 🪙{c}', cafeNoProduce: 'Не хватает этого блюда. Приготовьте на плите', noDish: 'Пока нет готовых блюд',
  cafeCook: 'Плита', cafeCookDesc: 'Готовьте блюда из урожая с фермы', cafeCookBtn: 'Приготовить', cafeNeedIngredient: 'Не хватает урожая. Соберите на ферме', cafeCooked: '🍳 Блюдо готово!', haveDish: 'есть {n}',
  dish_bread: 'Хлеб', dish_saladbowl: 'Салат', dish_tomatosoup: 'Томатный суп', dish_pumpkinpie: 'Тыквенный пирог',
  rDayShort: 'д', rBreed_full: 'Мест нет — повысьте уровень ранчо', rBreed_pair: 'Нужна взрослая пара ♂♀', rBreed_grow: 'Ещё малыши — через {n} дн. вырастут и смогут размножаться', rBreed_hungry: 'Сегодня оба (♂ и ♀) должны поесть — тогда завтра утром может появиться малыш', rBreed_ok: 'Сыты! Завтра утром может появиться малыш (50%, самое позднее за 3 дня)', rHayBox: 'Кормушка сена', rPigBox: 'Кормушка свиней', rDrops: 'на земле {n}', rPickAll: 'Собрать всё', ranchDesc2: 'Коровы едят сено из кормушки, свиньи — из своей кормушки, раз в день. Сытые взрослые утром оставляют 🥛молоко и 🥩мясо в загоне — нажмите, чтобы отнести в ящик (= холодильник кафе).', rHayDesc: 'Кнопка покупает 10 сена. Корова съедает 1 в день.', rHayNeed: 'коров {n} → {n} в день', rPigDesc: 'Нажимайте на урожай справа — по 1 шт. в кормушку свиней. Свинья съедает 1 в день.', rEmpty: 'пусто', rTapMove: 'нажмите, чтобы переложить', ranchPicked: '{i} в ящик ранчо!', ranchHayBought: '🌿 Куплено 10 сена!', ranchAte: 'Поели: {n}', ranchNoHayCoin: 'Не хватает денег на сено', ranchWage: '{w}/день', ranchAct_hay: 'покупает сено 🌿', ranchAct_pig: 'носит корм свиньям 🥕', ranchName: 'Ранчо', ranchBox: 'Ящик', ranchDesc: 'Коровы едят сено (лавка семян), свиньи — урожай из ящика фермы, раз в день. Сытые взрослые утром дают молоко и мясо, а пары приносят потомство (по уровню ранчо).', ranchCows: 'Коровы', ranchPigs: 'Свиньи', ranchHay: 'Сено {n}', ranchPigFood: 'Корм свиньям: {c}', ranchNoCropShort: 'Нет урожая для свиней', ranchFeedBtn: 'Накормить всех', ranchCollectBtn: 'Собрать', ranchCap: '{n} каждого вида', ranchBoxDesc: 'Молоко и мясо хранятся там же, где урожай фермы и холодильник кафе.', rg_milk: 'Молоко', rg_meat: 'Мясо', ranchHands: 'Работники ранчо', ranchHandsDesc: 'Покупают сено, берут урожай для свиней, кормят и собирают продукцию (зарплата 🪙{w}/день)', ranchAct_feed: 'кормит 🌿🥕', ranchAct_collect: 'собирает 🥛', ranchAct_idle: 'отдыхает', ranchNoHay: 'Нет сена (купите в лавке семян)', ranchNoCrop: 'Нет урожая для свиней', ranchFed: 'Все уже сыты', ranchFedOk: 'Накормлено 🐄 {a}, 🐖 {b}!', ranchNothing: 'Нечего собирать', ranchCollected: '🧺 {n} шт. в ящике!', ranchUp: 'Ранчо Lv{n}!', ranchHired: 'Работник нанят 🧑‍🌾', ranchBuilt: 'Ранчо построено! 🐄🐖 Пришли по два телёнка и поросёнка', ranchNeedLv: 'Ранчо можно строить с {n} уровня', good_hay: 'Сено (корм коровам)', treeSeeds: 'Саженцы фруктовых деревьев', treeSeedsDesc: 'Посадили один раз — плодоносит снова и снова! Сначала растёт долго, потом урожай каждые несколько дней.', treeInfo: 'первый урожай через {a} дн. · потом каждые {b} дн. ×{n}', crop_apple: 'Яблоня', crop_peach: 'Персик', crop_orange: 'Апельсин', crop_cherry: 'Вишня', crop_lemon: 'Лимон', crop_pear: 'Груша', crop_mango: 'Манго', crop_potato: 'Картофель', crop_corn: 'Кукуруза', crop_lettuce: 'Салат', crop_strawberry: 'Клубника', crop_blueberry: 'Черника', crop_grape: 'Виноград',
  goodsTitle: 'Продукты', good_egg: 'Яйцо',
  dish_milkshake: 'Молочный коктейль', dish_cheese: 'Домашний сыр', dish_pancake: 'Блинчики', dish_icecream: 'Клубничное мороженое', dish_steak: 'Стейк', dish_burger: 'Бургер', dish_pizza: 'Пицца', dish_meatstew: 'Рагу', dish_applepie: 'Яблочный пирог', dish_peachsmoothie: 'Персиковый смузи', dish_fruitsalad: 'Фруктовый салат', dish_lemonade: 'Лимонад', dish_pearjuice: 'Грушевый сок', dish_mangolassi: 'Манго-ласси', dish_fries: 'Картофель фри', dish_cornsoup: 'Кукурузный суп', dish_omelet: 'Омлет', dish_sandwich: 'Сэндвич', dish_strawberrycake: 'Клубничный торт', dish_blueberrymuffin: 'Черничный маффин', dish_grapejuice: 'Виноградный сок',
  cafeFridge: 'Холодильник', cafeFridgeDesc: 'Собранный на ферме урожай попадает сюда автоматически. Блюда готовятся только из этих продуктов', cafeFridgeEmpty: 'Холодильник пуст. Соберите урожай или купите яйца в магазине семян', cafeMoreDishes: 'Новых блюд с ростом уровня: {n}',
  hospLotName: 'Участок под ветклинику', hospLotSoon: 'Скоро',
  cafeUp: 'Расширение кафе', cafeUpNext: '⬆️ Следующий уровень →', cafeUpBtn: 'Расширить', cafeUpOk: '☕ Кафе расширено! Ур.{n}', cafeUpMax: 'Уже максимальный размер', cafeOrderMax: 'Заказов одновременно: {n}',
});

// v9.71 co-op connection feedback
Object.assign(I18N.ko, {
  coopConnecting: '연결하는 중…', coopArrived: '{name}님의 마을에 왔어요! 💕',
  coopWhy_noreply: '상대 폰에서 응답이 없어요', coopWhy_nohost: '상대 폰의 가게가 열려 있지 않아요', coopWhy_bad: '받은 데이터가 이상해요',
  coopHelp: '① 두 폰이 같은 Wi-Fi인지 ② 상대 폰에서 \'같이하기 → 내 가게 열기\'를 눌렀는지 ③ 같은 폰에 일반판과 TEST판이 둘 다 켜져 있지 않은지 확인하세요 (TEST판을 완전히 종료한 뒤 다시 열어 주세요)',
});
Object.assign(I18N.ru, {
  coopConnecting: 'Подключаемся…', coopArrived: 'Вы в деревне {name}! 💕',
  coopWhy_noreply: 'Второй телефон не отвечает', coopWhy_nohost: 'На втором телефоне магазин не открыт', coopWhy_bad: 'Получены странные данные',
  coopHelp: '① Оба телефона в одной сети Wi-Fi? ② На втором телефоне нажато «Играть вместе → Открыть мой магазин»? ③ На одном телефоне не запущены одновременно обычная и TEST-версия? (полностью закройте TEST и откройте снова)',
});

// v9.72 VIP customers & rare pets
Object.assign(I18N.ko, {
  ctype_vip: 'VIP 손님', vipOnlyTag: 'VIP 전용', vipSays: '희귀한 털색(✨)의 아이만 찾고 있어요. 값은 넉넉히 드릴게요!',
  vipInHas: '👑 VIP 손님이 왔어요! 희귀동물(✨)을 비싸게 사 가요', vipInNone: '👑 VIP 손님이 왔어요… 희귀동물(✨)이 있으면 비싸게 사 갈 텐데!',
  vipLeft: '👑 VIP 손님이 돌아갔어요. 다음엔 희귀동물(✨)을 준비해 두세요', vipOnly: '✨ 희귀동물은 👑 VIP 손님만 살 수 있어요', vipWantsRare: '👑 VIP 손님은 희귀동물(✨)만 원해요',
});
Object.assign(I18N.ru, {
  ctype_vip: 'VIP-гость', vipOnlyTag: 'только VIP', vipSays: 'Ищу только питомца редкого окраса (✨). Заплачу щедро!',
  vipInHas: '👑 Пришёл VIP-гость! Он дорого купит редкого питомца (✨)', vipInNone: '👑 Пришёл VIP-гость… Жаль, нет редкого питомца (✨)!',
  vipLeft: '👑 VIP-гость ушёл. В следующий раз приготовьте редкого питомца (✨)', vipOnly: '✨ Редких питомцев покупают только 👑 VIP-гости', vipWantsRare: '👑 VIP-гостю нужен только редкий питомец (✨)',
});

// v9.74
Object.assign(I18N.ko, { alsoOpen: '☕🏥 펫카페·펫병원도 함께 문을 열었어요', updateCare: '🎁 업데이트 선물! 아이들 {n}마리 모두 배부르고 깨끗해졌어요. 스트레스·심심함도 싹 사라졌어요 💕' });
Object.assign(I18N.ru, { alsoOpen: '☕🏥 Кафе и клиника тоже открылись', updateCare: '🎁 Подарок к обновлению! Все {n} питомцев сыты и чисты, без стресса и скуки 💕' });

// v9.76 impatient café guests
Object.assign(I18N.ko, { cafeAngry0: '음식이 없네…', cafeAngry1: '음식을 안 주네!', cafeAngry2: '음식을 언제 주는 거야!', cafeAngryToast: '☕ 음식을 못 받은 손님이 화가 나서 나갔어요' });
Object.assign(I18N.ru, { cafeAngry0: 'Еды нет…', cafeAngry1: 'Еду не несут!', cafeAngry2: 'Когда же принесут еду?!', cafeAngryToast: '☕ Гость не дождался еды и ушёл сердитым' });

// v9.78 clothes
Object.assign(I18N.ko, { wearCloth: '옷', noCloth: '이 아이는 몸이 작거나 비늘·깃털이 있어서 옷은 못 입어요 (목걸이·모자는 돼요)' });
Object.assign(I18N.ru, { wearCloth: 'Одежда', noCloth: 'Этому питомцу одежда не подходит (ошейник и шапочка — можно)' });

// v9.80
Object.assign(I18N.ko, { coopFallback: '📶 같이하기 연결이 안 돼서 내 가게로 돌아왔어요' });
Object.assign(I18N.ru, { coopFallback: '📶 Нет связи для совместной игры — вы снова в своём магазине' });

// v9.82
Object.assign(I18N.ko, { homeNeedAquarium: '🐠 물고기는 집에 수족관이 있어야 데려올 수 있어요 (집 → 가구 → 수족관, 집 Lv4)' });
Object.assign(I18N.ru, { homeNeedAquarium: '🐠 Рыбок можно забрать домой только если дома есть аквариум (Дом → Мебель → Аквариум, дом ур.4)' });
// v9.88: home furniture (y_*)
(() => {
  const N = { y_bunk: ['2층 침대', 'Двухъярусная кровать'], y_nightstand: ['협탁', 'Тумбочка'], y_mirror: ['전신 거울', 'Зеркало в полный рост'], y_closet: ['붙박이 옷장', 'Большой шкаф'], y_crib: ['아기 침대', 'Детская кроватка'], y_desk2: ['공부 책상', 'Письменный стол'],
    y_lsofa: ['L자 소파', 'Угловой диван'], y_coffee: ['원형 커피 테이블', 'Кофейный столик'], y_game: ['게임기 TV장', 'ТВ с приставкой'], y_hammock: ['해먹', 'Гамак'], y_massage: ['안마 의자', 'Массажное кресло'], y_record: ['레코드 플레이어', 'Проигрыватель'], y_aircon: ['에어컨', 'Кондиционер'], y_fan: ['선풍기', 'Вентилятор'], y_shelf: ['오픈 선반', 'Открытый стеллаж'],
    y_sink: ['세면대', 'Раковина'], y_kitchen: ['싱크대 세트', 'Кухонный гарнитур'], y_micro: ['전자레인지 선반', 'Микроволновка'], y_bar: ['홈바', 'Домашний бар'], y_espresso: ['커피 머신', 'Кофемашина'], y_vanity2: ['욕실 수납장', 'Шкафчик для ванной'],
    y_cactus: ['선인장', 'Кактус'], y_tulip: ['튤립 꽃병', 'Ваза с тюльпанами'], y_globe: ['지구본', 'Глобус'], y_teddy: ['대형 곰인형', 'Большой мишка'], y_easel: ['그림 이젤', 'Мольберт'], y_sunflower: ['해바라기 화분', 'Подсолнухи'], y_clock: ['괘종시계', 'Напольные часы'], y_cloudrug: ['구름 러그', 'Коврик-облако'], y_roundrug: ['무지개 원형 러그', 'Круглый коврик'], y_bonsai: ['분재', 'Бонсай'], y_piggy: ['돼지 저금통', 'Копилка-свинка'],
    y_crystal: ['크리스탈 스탠드', 'Хрустальный торшер'], y_lava: ['무드등', 'Лава-лампа'], y_starlamp: ['별 스탠드', 'Лампа-звезда'],
    y_cattower: ['캣타워', 'Когтеточка-башня'], y_dogtent: ['강아지 텐트', 'Палатка для собаки'], y_toybox: ['장난감 상자', 'Коробка игрушек'], y_petstairs: ['펫 계단', 'Лесенка для питомцев'] };
  const U = { y_hammock: ['해먹에서 흔들흔들~', 'Покачались в гамаке~'], y_massage: ['시원하다~ 💆', 'Как приятно~ 💆'], y_lsofa: ['소파에서 뒹굴뒹굴', 'Повалялись на диване'], y_record: ['LP 음악이 흘러요 🎶', 'Играет пластинка 🎶'], y_game: ['게임 한 판! 🎮', 'Сыграли партию! 🎮'], y_mirror: ['오늘도 예뻐요 ✨', 'Прекрасно выглядишь ✨'], y_teddy: ['폭신폭신 꼭 안아줬어요', 'Крепко обняли мишку'], y_piggy: ['짤랑! 저금했어요', 'Дзынь! Отложили монетку'], y_crib: ['모빌이 빙글빙글~', 'Мобиль кружится~'], y_fan: ['시원한 바람~', 'Прохладный ветерок~'], y_aircon: ['시원해요~', 'Прохладно~'], y_globe: ['다음 여행은 어디로 갈까?', 'Куда поедем в следующий раз?'], y_clock: ['똑딱똑딱', 'Тик-так'], y_espresso: ['향긋한 커피 한 잔', 'Чашечка ароматного кофе'], y_cattower: ['아이들이 신나게 올라가요', 'Малыши карабкаются наверх'], y_dogtent: ['아늑한 텐트예요', 'Уютная палатка'], y_toybox: ['장난감을 꺼냈어요', 'Достали игрушки'], x_gacha: ['뭐가 나올까? 두근두근', 'Что же выпадет?'], x_vending: ['음료수 한 캔!', 'Баночка газировки!'] };
  for (const k in N) { I18N.ko['hf_' + k] = N[k][0]; I18N.ru['hf_' + k] = N[k][1]; }
  for (const k in U) { I18N.ko['huse_' + k] = U[k][0]; I18N.ru['huse_' + k] = U[k][1]; }
})();
Object.assign(I18N.ko, { cafeYum: '냠냠' }); Object.assign(I18N.ru, { cafeYum: 'Ням-ням' });
Object.assign(I18N.ko, { fwhy_off: '퇴근했어요 (가게 오픈하면 출근)' }); Object.assign(I18N.ru, { fwhy_off: 'Ушёл домой (придёт, когда откроетесь)' });
Object.assign(I18N.ko, { spec_exam: '담당: 진료실', spec_surg: '담당: 엑스레이·CT·수술실', spec_treat: '담당: 치료실', spec_ward: '담당: 입원실' });
Object.assign(I18N.ru, { spec_exam: 'Кабинет осмотра', spec_surg: 'Рентген · КТ · операционная', spec_treat: 'Процедурная', spec_ward: 'Стационар' });

// New Furniture & Facility strings
(() => {
  const F = {
    petbed_deluxe: ['최고급 깃털 펫 방석', 'Люкс-лежанка для питомцев', '폭신폭신 구름 같은 잠자리예요 🛏️', 'Мягко, как на облачке 🛏️'],
    cozy_fireplace: ['아늑한 모닥불 벽난로', 'Уютный камин', '따뜻한 모닥불 앞에서 불멍했어요 🔥', 'Посидели у тёплого камина 🔥'],
    catcastle: ['호화 캣 캐슬 타워', 'Кошачий замок', '고양이들이 성에서 신나게 놀아요 🏰', 'Котики играют в замке 🏰'],
    music_jukebox: ['앤틱 뮤직 주크박스', 'Музыкальный автомат', '신나는 올드 팝송이 흘러나와요 🎵', 'Играет весёлая ретро-музыка 🎵'],
    crystal_fountain: ['크리스탈 분수대', 'Хрустальный фонтан', '시원하고 맑은 물줄기가 솟아요 ⛲', 'Бьют чистые прохладные струи ⛲']
  };
  for (const k in F) {
    I18N.ko['d_' + k] = I18N.ko['hf_' + k] = F[k][0];
    I18N.ru['d_' + k] = I18N.ru['hf_' + k] = F[k][1];
    I18N.ko['huse_' + k] = F[k][2];
    I18N.ru['huse_' + k] = F[k][3];
  }
  const T = {
    pet_fountain: ['크리스탈 펫 분수', 'Хрустальный фонтанчик'],
    pet_statue_hero: ['충견 영웅 동상', 'Статуя верного пса'],
    flower_tunnel: ['장미 꽃터널', 'Розовый тоннель'],
    camping_zone: ['감성 캠핑존', 'Кемпинг'],
    aquarium_center: ['해양 아쿠아리움', 'Океанариум'],
    pet_themepark: ['펫 테마파크 놀이공원', 'Парк аттракционов'],
    cat_cafe: ['힐링 캣카페 라운지', 'Кошачье лаундж-кафе'],
    pet_bakery: ['수제 펫 베이커리', 'Пекарня для питомцев']
  };
  for (const k in T) {
    I18N.ko['tk_' + k] = T[k][0];
    I18N.ru['tk_' + k] = T[k][1];
  }
})();

// Stray animals & Zoo badges & Animal details
Object.assign(I18N.ko, {
  stray_shiba: '길 잃은 시바견',
  stray_kitten: '길 잃은 아기 고양이',
  stray_rabbit_white: '길 잃은 하얀 토끼',
  stray_hamster: '길 잃은 햄스터',
  stray_default: '길 잃은 동물',
  stray_kshort: '길 잃은 코숏 고양이',
  stray_pome: '떠돌이 포메라니안',
  stray_maltese: '길 잃은 말티즈',
  stray_persian: '길 잃은 페르시안 고양이',
  stray_golden: '착한 골든 리트리버',
  stray_ragdoll: '길 잃은 랙돌',

  zooBadge_savanna: '사바나 사파리',
  zooBadge_panda: '판다 대나무 숲',
  zooBadge_elephant: '코끼리 쉼터',
  zooBadge_tiger: '호랑이 정글 협곡',
  zooBadge_lagoon: '열대 하마 라군',
  zooBadge_polar: '극지 펭귄 빙하',
  zooBadge_monkey: '원숭이 정글 섬',
  zooBadge_bear: '갈색곰 바위 언덕',
  zooBadge_top1: '하마와 코끼리 라군',
  zooBadge_top2: '갈색곰과 홍학 호수',
  zooBadge_top3: '사자와 악어 바위동굴',
  zooBadge_bot1: '남극 빙하 펭귄 마을',
  zooBadge_bot2: '너구리 숲과 바위',
  zooBadge_bot3: '기린 사파리 정자',
  zooBadge_bot4: '얼룩말과 판다 대나무 숲',

  zooPetName_lion: '아프리카 사자',
  zooPetName_lioness: '암사자',
  zooPetName_tiger: '시베리아 호랑이',
  zooPetName_whitetiger: '신비로운 백호',
  zooPetName_bear: '그리즐리 불곰',
  zooPetName_panda: '자이언트 판다',
  zooPetName_redpanda: '귀여운 레서판다',
  zooPetName_giraffe: '키다리 기린',
  zooPetName_girin: '키다리 기린',
  zooPetName_zebra: '줄무늬 얼룩말',
  zooPetName_horse: '줄무늬 얼룩말',
  zooPetName_elephant: '아프리카 코끼리',
  zooPetName_koggiri: '아프리카 코끼리',
  zooPetName_rhino: '흰코뿔소',
  zooPetName_hippo: '아기 하마',
  zooPetName_hama: '하마',
  zooPetName_croc: '나일 악어',
  zooPetName_cro: '나일 악어',
  zooPetName_flamingo: '분홍 홍학',
  zooPetName_hak: '학',
  zooPetName_redpanda: '귀여운 레서판다',
  zooPetName_nuguri: '귀여운 레서판다',
  zooPetName_penguin: '황제 펭귄',
  zooPetName_seal: '점박이 물범',
  zooPetName_monkey: '장난꾸러기 원숭이',

  zooPetDesc_lion: '사바나의 백수의 왕! 풍성한 갈기와 위엄 있는 표정으로 프라이드 록 언덕을 지키며, 낮에는 따뜻한 햇살 아래 엎드려 낮잠을 즐겨요.',
  zooPetDesc_lioness: '날렵하고 다정한 사냥의 명수. 무리를 이끌며 어린 사자들을 자상하게 돌봐줍니다.',
  zooPetDesc_tiger: '용맹하고 날렵한 맹수의 제왕. 멋진 호랑이 줄무늬를 뽐내며 시원한 폭포수 아래를 거닐거나 물놀이를 즐겨요.',
  zooPetDesc_whitetiger: '푸른 눈동자와 은빛 털을 가진 전설 속의 영물. 보는 이들에게 큰 행운과 평온을 가져다준다고 전해져요.',
  zooPetDesc_bear: '묵직하고 듬직한 체격의 숲속 대장. 물고기와 꿀, 신선한 베리를 좋아하며 바위 위에 엎드려 뒹굴뒹굴 쉬는 것을 좋아해요.',
  zooPetDesc_panda: '세계적으로 사랑받는 귀염둥이! 향긋한 생대나무와 죽순을 하루 종일 오물오물 맛있게 먹으며 둥글둥글 굴러다녀요.',
  zooPetDesc_redpanda: '풍성한 꼬리와 귀여운 얼굴의 숲속 요정. 나무 위를 쪼르르 오르내리며 신선한 사과와 대나무 잎을 냠냠 먹어요.',
  zooPetDesc_giraffe: '세상에서 가장 키가 큰 동물! 긴 목으로 높은 나뭇가지의 연한 잎을 골라 먹으며 우아하게 걸어 다녀요.',
  zooPetDesc_zebra: '흑백의 매혹적인 기하학 줄무늬를 가진 동물. 무리를 지어 초원을 시원하게 달리며 오아시스에서 목을 축여요.',
  zooPetDesc_elephant: '거대한 몸집통에 다정한 눈망울을 가진 지혜로운 동물. 긴 코로 물을 뿜어 시원하게 샤워하고 진흙 목욕을 즐겨요.',
  zooPetDesc_rhino: '단단한 갑옷 피부와 위엄 넘치는 뿔을 가진 초원의 든든한 수호자. 진흙 웅덩이에서 쉬며 열을 식히는 것을 좋아해요.',
  zooPetDesc_hippo: '물속에서 여유롭게 수영하는 귀여운 거구! 낮에는 시원한 물웅덩이에 몸을 담그고 물풀을 우물우물 먹어요.',
  zooPetDesc_croc: '태고의 신비를 간직한 파충류의 제왕. 햇볕이 잘 드는 모래톱에 엎드려 일광욕을 하며 입을 벌리고 휴식해요.',
  zooPetDesc_flamingo: '화려한 산호빛 깃털과 우아한 각선미를 자랑하는 새. 라군 얕은 물가에서 한 발로 서서 물고기를 잡아요.',
  zooPetDesc_penguin: '얼음 위를 뒤뚱뒤뚱 걷다가 차가운 바닷속으로 쏜살같이 다이빙하는 극지의 마스코트! 물고기를 아주 좋아해요.',
  zooPetDesc_seal: '매끈한 은빛 몸매와 동그란 눈을 가진 바다의 귀염둥이. 얼음 위에서 낮잠을 자거나 물속에서 공놀이 묘기를 선보여요.',
  zooPetDesc_monkey: '나무를 타며 바나나를 먹는 숲의 활력소. 친구들과 서로 털을 골라주며 호기심 가득한 눈으로 관람객을 바라봐요.',

  zooFeedAnimalBtn: '🍖 맛있는 특식 주기 (🪙50)',
  zooFeedAnimalSuccess: '✨ {name}에게 맛있는 특식을 주었어요! 너무 기뻐하며 냠냠 먹고 있어요 💕',
  zooSleepingTag: '💤 평화롭게 낮잠 자는 중',
  zooEatingTag: '😋 맛있는 식사 중',
  zooWalkingTag: '🌿 활기차게 산책 중',
  zooAutoTicketNotice: '🪙 동물원 입장료가 자동으로 정산되었습니다! (+🪙{c})',

  sp_shiba_black: '흑시바',
  sp_shiba_red: '적시바',
  sp_maltese_cream: '크림 말티즈',
  sp_maltese_brown: '갈색 말티즈',
  tk_evergreen: '풍성한 상록수',
  tree_evergreen: '풍성한 상록수'
});

Object.assign(I18N.ru, {
  stray_shiba: 'Потерявшийся сиба-ину',
  stray_kitten: 'Потерявшийся котёнок',
  stray_rabbit_white: 'Потерявшийся белый кролик',
  stray_hamster: 'Потерявшийся хомячок',
  stray_default: 'Потерявшийся питомец',
  stray_kshort: 'Уличный котёнок',
  stray_pome: 'Бродячий шпиц',
  stray_maltese: 'Потерявшаяся мальтийская болонка',
  stray_persian: 'Потерявшийся персидский кот',
  stray_golden: 'Добрый золотистый ретривер',
  stray_ragdoll: 'Потерявшийся рэгдолл',

  zooBadge_savanna: 'Саванна-сафари',
  zooBadge_panda: 'Бамбуковый лес панд',
  zooBadge_elephant: 'Оазис слонов',
  zooBadge_tiger: 'Каньон тигров',
  zooBadge_lagoon: 'Тропическая лагуна',
  zooBadge_polar: 'Полярный ледник',
  zooBadge_monkey: 'Остров обезьян',
  zooBadge_bear: 'Скалистый холм медведей',
  zooBadge_top1: 'Лагуна бегемотов и слонов',
  zooBadge_top2: 'Озеро медведей и фламинго',
  zooBadge_top3: 'Пещера львов и крокодилов',
  zooBadge_bot1: 'Ледник пингвинов',
  zooBadge_bot2: 'Лес и скалы енотов',
  zooBadge_bot3: 'Беседка сафари жирафов',
  zooBadge_bot4: 'Бамбуковый лес зебр и панд',

  zooPetName_lion: 'Африканский лев',
  zooPetName_lioness: 'Львица',
  zooPetName_tiger: 'Сибирский тигр',
  zooPetName_whitetiger: 'Белый тигр',
  zooPetName_bear: 'Бурый медведь',
  zooPetName_panda: 'Большая панда',
  zooPetName_redpanda: 'Красная панда',
  zooPetName_giraffe: 'Жираф',
  zooPetName_girin: 'Жираф',
  zooPetName_zebra: 'Зебра',
  zooPetName_horse: 'Зебра',
  zooPetName_elephant: 'Африканский слон',
  zooPetName_koggiri: 'Африканский слон',
  zooPetName_rhino: 'Белый носорог',
  zooPetName_hippo: 'Бегемот',
  zooPetName_hama: 'Бегемот',
  zooPetName_croc: 'Нилский крокодил',
  zooPetName_cro: 'Нилский крокодил',
  zooPetName_flamingo: 'Фламинго',
  zooPetName_hak: 'Журавль',
  zooPetName_redpanda: 'Красная панда',
  zooPetName_nuguri: 'Красная панда',
  zooPetName_penguin: 'Императорский пингвин',
  zooPetName_seal: 'Тюлень',
  zooPetName_monkey: 'Обезьянка',

  zooPetDesc_lion: 'Царь зверей саванны! С пышной гривой он охраняет скалу Прайда, а днём сладко дремлет на солнце.',
  zooPetDesc_lioness: 'Ловкая и заботливая охотница, заботящаяся о прайде.',
  zooPetDesc_tiger: 'Могучий владыка тайги. Любит гулять у водопада и купаться в прохладной воде.',
  zooPetDesc_whitetiger: 'Редкий белый тигр с голубыми глазами, приносящий удачу.',
  zooPetDesc_bear: 'Могучий хозяин леса, обожающий свежую рыбку, ягоды и отдых на тёплых камнях.',
  zooPetDesc_panda: 'Любимец всего мира! С аппетитом хрустит бамбуком и весело кувыркается.',
  zooPetDesc_redpanda: 'Маленькая пушистая панда, ловко лазающая по веткам.',
  zooPetDesc_giraffe: 'Самое высокое животное на планете с длинной грациозной шеей.',
  zooPetDesc_zebra: 'Красивая полосатая зебра, любящая простор саванны.',
  zooPetDesc_elephant: 'Мудрый великан с добрыми глазами, пускающий фонтаны из хобота.',
  zooPetDesc_rhino: 'Могучий носорог с надёжной броней, отдыхающий в прохладе оазиса.',
  zooPetDesc_hippo: 'Величественный бегемот, наслаждающийся купанием в лагуне.',
  zooPetDesc_croc: 'Древний хищник, греющийся на тёплом песчаном берегу.',
  zooPetDesc_flamingo: 'Изящная розовая птица, стоящая на одной ноге у прозрачной воды.',
  zooPetDesc_penguin: 'Забавный полярный пингвин, ныряющий среди айсбергов.',
  zooPetDesc_seal: 'Милый тюлень, играющий с мячом и греющийся на льдинах.',
  zooPetDesc_monkey: 'Ловкая озорная обезьянка, прыгающая по лианам.',

  zooFeedAnimalBtn: '🍖 Угостить лакомством (🪙50)',
  zooFeedAnimalSuccess: '✨ Вы угостили {name}! Питомец счастлив 💕',
  zooSleepingTag: '💤 Сладко спит',
  zooEatingTag: '😋 С аппетитом кушает',
  zooWalkingTag: '🌿 Гуляет',
  zooAutoTicketNotice: '🪙 Доход зоопарка зачислен автоматически! (+🪙{c})',

  sp_shiba_black: 'Черный сиба-ину',
  sp_shiba_red: 'Рыжий сиба-ину',
  sp_maltese_cream: 'Кремовый мальтезе',
  sp_maltese_brown: 'Коричневый мальтезе',
  tk_evergreen: 'Пышное вечнозеленое дерево',
  tree_evergreen: 'Пышное вечнозеленое дерево'
});

// 기차 시스템 (CityVille 스타일) 번역
Object.assign(I18N.ko, {
  trainTitle: '펫 익스프레스 기차 무역',
  trainStation: '펫 타운 기차역',
  trainExpress: '펫 익스프레스',
  trainDepart: '출발까지',
  trainNext: '다음 열차 도착까지',
  trainDelivered: '🚂 {n} 납품 완료! 🪙+{c}',
  trainBonusClaimed: '🎉 완납 보너스 수령! 🪙+{c} · 60 XP',
  trainSent: '🚂 펫 익스프레스가 다음 도시로 출발했습니다!',
  trainCalled: '⚡ 펫 익스프레스가 기차역에 급행 도착했습니다!',
  trainStationUp: '🚉 기차역이 Lv{n}(으)로 증축되었습니다!',
  trainNoPet: '미보유',
  trainSendNow: '조기 출발',
  trainCallExpress: '급행 호출',
  petIsFavorite: '⭐ 즐겨찾기(보호)로 잠겨있지 않은 펫만 납품할 수 있어요',
  noPetAvailable: '납품할 수 있는 펫이 가게 또는 집에 없어요',
  noProduceAvailable: '보관 상자에 해당 품목이 부족해요',
  orderNotFound: '해당 주문을 찾을 수 없습니다',
  orderAlreadyFilled: '이미 납품 완료된 항목입니다',
  trainNotHere: '🚂 기차가 아직 역에 도착하지 않았거나 운행 중입니다',
  trainWholesale: '오늘 높은 가격으로 매입하는 품목',
  trainStationBonus: '역 보너스: +{n}% 적용',
  trainCustPrice: '손님가',
  trainTrainPrice: '기차가',
  trainCompleted: '완납',
  trainCompletedUnit: '{filled} / {count} 완료',
  trainDeliver: '납품',
  trainOwned: '보유 수량: {n}{u}',
  trainNone: ' (보유 중인 품목 없음)',
  trainDone: '완료',
  trainAllBonusTitle: '모든 화물칸 완납 달성!',
  trainAllBonusDesc: '기차 납품을 모두 완료했습니다. 완납 보너스를 받으세요!',
  trainClaimBonusBtn: '🎁 완납 보너스 수령 (+🪙{c} · 60 XP)',
  trainDepartIn: '출발까지',
  trainFastDepart: '급행 출발',
  trainApproachingTitle: '기차가 기차역으로 천천히 진입 중입니다',
  trainArriveIn: '도착까지 약',
  trainRunningTitle: '기차가 다음 도시로 운행 중입니다',
  trainNextIn: '다음 펫 익스프레스 도착까지',
  trainCallExpressCost: '⚡ 급행 호출 (🪙{c})',
  trainUpgrade: '증축',
  trainMaxLevel: '최고 등급 ✓',
  trainStatTrains: '운행 열차:',
  trainStatSold: '총 납품:',
  trainStatEarned: '누적 수익:',
  trainBoundFor: '행 펫 익스프레스',
  trainUnitPet: '마리',
  trainUnitItem: '개',
  dest_family: '패밀리 타운',
  dest_family_desc: '소형견, 고양이, 귀여운 소동물을 사랑하는 가족들의 마을',
  dest_bigcity: '빅 시티',
  dest_bigcity_desc: '트렌디하고 개성 넘치는 반려동물을 찾는 대도시 바이어',
  dest_country: '컨트리 빌리지',
  dest_country_desc: '넓은 마당과 들판에서 뛰어놀 대형견과 목장 동물을 찾는 시골 마을',
  dest_rich: '리치 타운',
  dest_rich_desc: '최고급 및 희귀 반려동물을 아낌없는 가격에 매입하는 부촌 컬렉터',
  dest_capital: '왕립 수도 메트로폴리스',
  dest_capital_desc: '대도시 귀족들과 부유한 애호가들이 품격 있는 희귀 펫과 고급 요리를 찾습니다.',
  dest_seaside: '낭만의 에메랄드 해변 휴양지',
  dest_seaside_desc: '따뜻한 남쪽 휴양객들과 해변 펜션에서 반려 가족을 입양하러 찾아왔습니다.',
  dest_mountain: '알프스 은빛 산림 리조트',
  dest_mountain_desc: '깨끗한 숲속 롯지와 별장 지대에서 활발하고 건강한 동물 친구들을 원합니다.',
  dest_springs: '꽃피는 봄바람 화원 온천마을',
  dest_springs_desc: '꽃향기 가득한 관광 온천 마을에서 손님맞이용 마스코트 동물과 농산물을 원합니다.',
  trainArrivingBadge: '펫 익스프레스 도착 중!',
  trainDepartingBadge: '펫 익스프레스 출발 중...',
  trainNextBadge: '다음 열차:',
  trainLv1_name: '간이 승강장',
  trainLv1_perk: '품목 5개 (펫 3 · 농작물 1 · 카페 음식 1)',
  trainLv2_name: '시골 기차역',
  trainLv2_perk: '품목 6개 · 납품 수량 증가 · 보너스 +5% · 정차 6분',
  trainLv3_name: '중앙 펫역',
  trainLv3_perk: '품목 7개 · 수량 대폭 증가 · 보너스 +10% · 완납 선물상자',
  trainLv4_name: '골드 익스프레스역',
  trainLv4_perk: '품목 8개 · 골드 열차 · 보너스 +15%',
  trainLv5_name: '그랜드 센트럴역',
  trainLv5_perk: '품목 9개 · 최고 수량 특급 매입 · 보너스 +25%'
});

Object.assign(I18N.ru, {
  trainTitle: 'Торговый поезд Pet Express',
  trainStation: 'Вокзал Pet Town',
  trainExpress: 'Pet Express',
  trainDepart: 'До отправления',
  trainNext: 'До прибытия поезда',
  trainDelivered: '🚂 {n} доставлен(о)! 🪙+{c}',
  trainBonusClaimed: '🎉 Бонус за все заказы! 🪙+{c} · 60 XP',
  trainSent: '🚂 Поезд отправился в следующий город!',
  trainCalled: '⚡ Экспресс-поезд прибыл на станцию!',
  trainStationUp: '🚉 Вокзал улучшен до ур.{n}!',
  trainNoPet: 'Нет в наличии',
  trainSendNow: 'Отправить сейчас',
  trainCallExpress: 'Вызов экспресса',
  petIsFavorite: '⭐ Нельзя продать избранного питомца (снимите защиту)',
  noPetAvailable: 'В магазине или дома нет подходящего питомца',
  noProduceAvailable: 'Недостаточно товара на складе/ферме',
  orderNotFound: 'Заказ не найден',
  orderAlreadyFilled: 'Этот заказ уже выполнен',
  trainNotHere: '🚂 Поезд еще не прибыл на станцию или уже уехал',
  trainWholesale: 'Сегодня закупаем по высокой цене',
  trainStationBonus: 'Бонус вокзала: +{n}%',
  trainCustPrice: 'Обычная',
  trainTrainPrice: 'Цена поезда',
  trainCompleted: 'Сдано',
  trainCompletedUnit: '{filled} / {count} выполнено',
  trainDeliver: 'Сдать',
  trainOwned: 'В наличии: {n}{u}',
  trainNone: ' (нет в наличии)',
  trainDone: 'Готово',
  trainAllBonusTitle: 'Все вагоны загружены!',
  trainAllBonusDesc: 'Все заказы поезда выполнены. Заберите бонус за отправку!',
  trainClaimBonusBtn: '🎁 Забрать бонус (+🪙{c} · 60 XP)',
  trainDepartIn: 'До отправления',
  trainFastDepart: 'Отправить поезд',
  trainApproachingTitle: 'Поезд медленно прибывает на вокзал',
  trainArriveIn: 'Прибытие примерно через',
  trainRunningTitle: 'Поезд едет в следующий город',
  trainNextIn: 'Следующий поезд через',
  trainCallExpressCost: '⚡ Вызов экспресса (🪙{c})',
  trainUpgrade: 'Улучшить',
  trainMaxLevel: 'Макс. уровень ✓',
  trainStatTrains: 'Поездок:',
  trainStatSold: 'Сдано:',
  trainStatEarned: 'Доход:',
  trainBoundFor: 'экспресс в {d}',
  trainUnitPet: ' шт.',
  trainUnitItem: ' шт.',
  dest_family: 'Семейный городок',
  dest_family_desc: 'Семьи с детьми с нетерпением ждут милых собачек, кошек и мелких зверюшек.',
  dest_bigcity: 'Большой город',
  dest_bigcity_desc: 'Городские покупатели ищут модных и стильных питомцев.',
  dest_country: 'Деревня Кантри',
  dest_country_desc: 'В просторные дворы и поля требуются крупные собаки и фермерские питомцы.',
  dest_rich: 'Элитный район',
  dest_rich_desc: 'Коллекционеры скупают редких и премиальных питомцев по высшей цене.',
  dest_capital: 'Столичный Метрополис',
  dest_capital_desc: 'Столичные жители и коллекционеры ищут редких породистых питомцев.',
  dest_seaside: 'Приморский курорт',
  dest_seaside_desc: 'Гости тёплых курортов ищут верных пушистых друзей для отдыха.',
  dest_mountain: 'Горный курорт',
  dest_mountain_desc: 'В альпийские шале требуются активные и крепкие питомцы.',
  dest_springs: 'Цветочные источники',
  dest_springs_desc: 'Цветущий городок закупает продукты фермы и питомцев-маскотов.',
  trainArrivingBadge: 'Pet Express прибывает!',
  trainDepartingBadge: 'Pet Express отправляется...',
  trainNextBadge: 'Следующий поезд:',
  trainLv1_name: 'Полустанок',
  trainLv1_perk: '5 товаров (питомцы: 3 · урожай: 1 · блюдо: 1)',
  trainLv2_name: 'Сельский вокзал',
  trainLv2_perk: '6 товаров · больше спрос · бонус +5% · стоянка 6 мин',
  trainLv3_name: 'Центральный зоовокзал',
  trainLv3_perk: '7 товаров · крупный спрос · бонус +10% · подарок за отправку',
  trainLv4_name: 'Золотой экспресс-вокзал',
  trainLv4_perk: '8 товаров · золотой поезд · бонус +15%',
  trainLv5_name: 'Гранд Централ',
  trainLv5_perk: '9 товаров · максимальный экспресс-закуп · бонус +25%'
});
