// ================= PET TOWN v1.0: town UI — population/happiness chip, town panel, build menu, placing & turning buildings =================
const TOWNUI = (() => {
  const FACES = [[80, '😄', '#3cb371'], [60, '🙂', '#8bc34a'], [40, '😐', '#f2c230'], [20, '🙁', '#f28c28'], [0, '😠', '#e0413a']];
  const face = h => FACES.find(f => h >= f[0]);
  const nm = k => t('tk_' + k);
  // User Request 13: Weather & Sky state calculation (sun, moon, crescent, stars, weather)
  function skyState() {
    if (!S || !S.clock) return { icon: '☀️', name: '맑음', time: '12:00', weatherIcon: '☀️', weatherName: '쾌청' };
    const m = S.clock.m || 720, day = S.clock.day || 1, hh = Math.floor(m / 60), mm = Math.floor(m % 60);
    const timeStr = String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0');
    // Sky phase by hour: sun, sunset, crescent moon, full moon, stars
    let icon = '☀️', name = '맑음';
    if (m >= 5 * 60 && m < 7 * 60 + 30) {
      icon = '🌅'; name = (typeof CFG !== 'undefined' && CFG.lang === 'ru') ? 'Рассвет' : '아침 여명';
    } else if (m >= 7 * 60 + 30 && m < 11 * 60) {
      icon = '☀️'; name = (typeof CFG !== 'undefined' && CFG.lang === 'ru') ? 'Утро' : '따사로운 아침';
    } else if (m >= 11 * 60 && m < 15 * 60 + 30) {
      icon = '🌤️'; name = (typeof CFG !== 'undefined' && CFG.lang === 'ru') ? 'Полдень' : '맑은 낮';
    } else if (m >= 15 * 60 + 30 && m < 17 * 60 + 30) {
      icon = '⛅'; name = (typeof CFG !== 'undefined' && CFG.lang === 'ru') ? 'День' : '포근한 오후';
    } else if (m >= 17 * 60 + 30 && m < 19 * 60 + 30) {
      icon = '🌇'; name = (typeof CFG !== 'undefined' && CFG.lang === 'ru') ? 'Закат' : '노을빛 저녁';
    } else if (m >= 19 * 60 + 30 && m < 22 * 60) {
      icon = '🌙'; name = (typeof CFG !== 'undefined' && CFG.lang === 'ru') ? 'Сумерки' : '초승달 밤';
    } else if (m >= 22 * 60 || m < 2 * 60) {
      icon = '🌔'; name = (typeof CFG !== 'undefined' && CFG.lang === 'ru') ? 'Полнолуние' : '달 밝은 밤';
    } else {
      icon = '🌟'; name = (typeof CFG !== 'undefined' && CFG.lang === 'ru') ? 'Звёздная ночь' : '반짝이는 새벽별';
    }
    const weathers = [
      { ic: '☀️', ko: '쾌청', ru: 'Ясно' },
      { ic: '🌤️', ko: '화창', ru: 'Солнечно' },
      { ic: '🌸', ko: '꽃바람', ru: 'Ветер сакуры' },
      { ic: '🌈', ko: '무지개', ru: 'Радуга' },
      { ic: '🍃', ko: '상쾌', ru: 'Свежий бриз' },
      { ic: '✨', ko: '별빛', ru: 'Звездопад' },
      { ic: '⛅', ko: '구름조금', ru: 'Облачно' }
    ];
    const wth = weathers[day % weathers.length];
    return { icon, name, weatherIcon: wth.ic, weatherName: (typeof CFG !== 'undefined' && CFG.lang === 'ru') ? wth.ru : wth.ko };
  }

  // Helper: Pixel-art Landscape Sky Window (matching User Reference Image with mountains, river, and rising/setting sun & moon)
  function skyLandscapeSvg(m, day) {
    const w = 38, h = 28;
    // 1. SUNSET (17:30 ~ 19:30)
    if (m >= 17 * 60 + 30 && m < 19 * 60 + 30) {
      return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" class="sky-pixel-frame">
        <defs>
          <linearGradient id="sk_sunset" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#ea580c"/><stop offset="50%" stop-color="#f97316"/><stop offset="100%" stop-color="#fdba74"/></linearGradient>
        </defs>
        <rect width="${w}" height="${h}" rx="6" fill="url(#sk_sunset)"/>
        <!-- Big Round Orange Sun sitting on the horizon -->
        <circle cx="19" cy="17" r="7.5" fill="#fb923c" stroke="#c2410c" stroke-width="0.8"/>
        <circle cx="19" cy="17" r="6.2" fill="#fdba74"/>
        <!-- Distant Mountains -->
        <polygon points="0,19 7,16 14,18 19,20 25,17 31,16 38,19 38,28 0,28" fill="#431407"/>
        <!-- River flowing down the center -->
        <polygon points="19,20 17,28 22,28 20,20" fill="#38bdf8" opacity="0.85"/>
        <!-- Near Foothills & Trees -->
        <polygon points="0,22 6,21 12,24 17,23 18,28 0,28" fill="#270e04"/>
        <polygon points="38,22 32,21 26,24 21,23 20,28 38,28" fill="#270e04"/>
        <!-- Outer retro frame border -->
        <rect width="${w}" height="${h}" rx="6" fill="none" stroke="#262626" stroke-width="1.6"/>
      </svg>`;
    }
    // 2. NEARLY SET / DUSK (19:30 ~ 21:00)
    if (m >= 19 * 60 + 30 && m < 21 * 60) {
      return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" class="sky-pixel-frame">
        <defs>
          <linearGradient id="sk_dusk" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#1e1b4b"/><stop offset="60%" stop-color="#312e81"/><stop offset="100%" stop-color="#9a3412"/></linearGradient>
        </defs>
        <rect width="${w}" height="${h}" rx="6" fill="url(#sk_dusk)"/>
        <!-- Sun half-sunken below horizon -->
        <path d="M 11,18 A 8,8 0 0,1 27,18 Z" fill="#ea580c" stroke="#9a3412" stroke-width="0.8"/>
        <path d="M 13,18 A 6.2,6.2 0 0,1 25,18 Z" fill="#f97316"/>
        <!-- Dark Mountains -->
        <polygon points="0,18 8,16 14,17 19,19 24,17 30,16 38,18 38,28 0,28" fill="#172554"/>
        <polygon points="19,19 17,28 22,28 20,19" fill="#0284c7" opacity="0.7"/>
        <polygon points="0,21 6,20 12,23 18,22 18,28 0,28" fill="#0f172a"/>
        <polygon points="38,21 32,20 26,23 20,22 20,28 38,28" fill="#0f172a"/>
        <circle cx="9" cy="5" r="0.6" fill="#fef08a"/><circle cx="29" cy="6" r="0.6" fill="#fef08a"/>
        <rect width="${w}" height="${h}" rx="6" fill="none" stroke="#262626" stroke-width="1.6"/>
      </svg>`;
    }
    // 3. NIGHT / MIDNIGHT / STARS (21:00 ~ 05:30)
    if (m >= 21 * 60 || m < 5 * 60 + 30) {
      return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" class="sky-pixel-frame">
        <defs>
          <linearGradient id="sk_night" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#020617"/><stop offset="70%" stop-color="#0f172a"/><stop offset="100%" stop-color="#1e293b"/></linearGradient>
        </defs>
        <rect width="${w}" height="${h}" rx="6" fill="url(#sk_night)"/>
        <!-- Crescent / Glowing Moon -->
        <circle cx="19" cy="8" r="4.2" fill="#fef08a" opacity="0.95"/>
        <circle cx="20.5" cy="7.2" r="3.6" fill="#020617"/>
        <!-- Twinkling stars -->
        <circle cx="7" cy="5" r="0.6" fill="#ffffff"/><circle cx="31" cy="5.5" r="0.6" fill="#ffffff"/>
        <circle cx="11" cy="12" r="0.5" fill="#fde047"/><circle cx="27" cy="11.5" r="0.5" fill="#fde047"/>
        <circle cx="5" cy="15" r="0.5" fill="#ffffff"/><circle cx="33" cy="14" r="0.5" fill="#ffffff"/>
        <!-- Night mountain silhouette -->
        <polygon points="0,18 8,15 14,17 19,19 24,16 30,15 38,18 38,28 0,28" fill="#090d16"/>
        <!-- Silver Moonlit River -->
        <polygon points="19,19 17,28 22,28 20,19" fill="#94a3b8" opacity="0.6"/>
        <polygon points="0,21 6,20 12,23 18,22 18,28 0,28" fill="#030712"/>
        <polygon points="38,21 32,20 26,23 20,22 20,28 38,28" fill="#030712"/>
        <rect width="${w}" height="${h}" rx="6" fill="none" stroke="#262626" stroke-width="1.6"/>
      </svg>`;
    }
    // 4. BEGIN SUNRISE / DAWN (05:30 ~ 07:30)
    if (m >= 5 * 60 + 30 && m < 7 * 60 + 30) {
      return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" class="sky-pixel-frame">
        <defs>
          <linearGradient id="sk_dawn" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#1e3a8a"/><stop offset="45%" stop-color="#3b82f6"/><stop offset="85%" stop-color="#fbbf24"/><stop offset="100%" stop-color="#f59e0b"/></linearGradient>
        </defs>
        <rect width="${w}" height="${h}" rx="6" fill="url(#sk_dawn)"/>
        <!-- Sun Peeking from the mountain valley -->
        <path d="M 13,19 A 6,6 0 0,1 25,19 Z" fill="#fef08a" stroke="#f59e0b" stroke-width="0.8"/>
        <!-- Mountains -->
        <polygon points="0,19 8,16 14,18 19,19 24,17 30,16 38,19 38,28 0,28" fill="#1e293b"/>
        <polygon points="19,19 17,28 22,28 20,19" fill="#38bdf8" opacity="0.8"/>
        <polygon points="0,22 6,20 12,23 18,22 18,28 0,28" fill="#0f172a"/>
        <polygon points="38,22 32,20 26,23 20,22 20,28 38,28" fill="#0f172a"/>
        <rect width="${w}" height="${h}" rx="6" fill="none" stroke="#262626" stroke-width="1.6"/>
      </svg>`;
    }
    // 5. SUNRISE (07:30 ~ 09:30)
    if (m >= 7 * 60 + 30 && m < 9 * 60 + 30) {
      return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" class="sky-pixel-frame">
        <defs>
          <linearGradient id="sk_srise" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#38bdf8"/><stop offset="50%" stop-color="#93c5fd"/><stop offset="85%" stop-color="#fde047"/><stop offset="100%" stop-color="#f59e0b"/></linearGradient>
        </defs>
        <rect width="${w}" height="${h}" rx="6" fill="url(#sk_srise)"/>
        <!-- Rising golden sun -->
        <circle cx="19" cy="16" r="7" fill="#fde047" stroke="#eab308" stroke-width="0.8"/>
        <polygon points="0,19 8,16 14,18 19,20 24,18 30,16 38,19 38,28 0,28" fill="#334155"/>
        <polygon points="19,20 17,28 22,28 20,20" fill="#60a5fa" opacity="0.85"/>
        <polygon points="0,22 6,20 12,23 18,22 18,28 0,28" fill="#1e293b"/>
        <polygon points="38,22 32,20 26,23 20,22 20,28 38,28" fill="#1e293b"/>
        <rect width="${w}" height="${h}" rx="6" fill="none" stroke="#262626" stroke-width="1.6"/>
      </svg>`;
    }
    // 6. CRISP CLEAR DAY (09:30 ~ 17:30)
    return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" class="sky-pixel-frame">
      <defs>
        <linearGradient id="sk_day" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#0284c7"/><stop offset="55%" stop-color="#38bdf8"/><stop offset="100%" stop-color="#bae6fd"/></linearGradient>
      </defs>
      <rect width="${w}" height="${h}" rx="6" fill="url(#sk_day)"/>
      <!-- Bright Shining Sun -->
      <circle cx="19" cy="9.5" r="5.5" fill="#fef08a" stroke="#f59e0b" stroke-width="1"/>
      <circle cx="19" cy="9.5" r="7.5" fill="none" stroke="#fef08a" stroke-dasharray="1.5,1.5" stroke-width="0.7" opacity="0.75"/>
      <!-- Fluffy White Clouds -->
      <ellipse cx="8" cy="7" rx="3.8" ry="1.7" fill="#ffffff" opacity="0.9"/>
      <ellipse cx="30" cy="11" rx="4.5" ry="2" fill="#ffffff" opacity="0.9"/>
      <!-- Vibrant Green Mountains -->
      <polygon points="0,19 8,16 14,18 19,20 24,18 30,16 38,19 38,28 0,28" fill="#15803d"/>
      <!-- Sparkling Blue River -->
      <polygon points="19,20 17,28 22,28 20,20" fill="#38bdf8"/>
      <polygon points="0,22 6,20 12,23 18,22 18,28 0,28" fill="#166534"/>
      <polygon points="38,22 32,20 26,23 20,22 20,28 38,28" fill="#166534"/>
      <rect width="${w}" height="${h}" rx="6" fill="none" stroke="#262626" stroke-width="1.6"/>
    </svg>`;
  }

  // the chip under the coins: weather window on LEFT, population banner on RIGHT horizontally
  function chip() {
    if (!S || !S.town) return '';
    const st = TOWN.stats(S), f = face(st.hap);
    const m = (S.clock && S.clock.m) || 720, day = (S.clock && S.clock.day) || 1;
    const sky = skyState();
    const whitePeopleIcon = `<svg width="15" height="15" viewBox="0 0 24 24" fill="#ffffff" style="display:inline-block;vertical-align:-2.5px;margin-right:2px;filter:drop-shadow(0 1px 1px rgba(0,0,0,.7))"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>`;
    return `<div class="town-hud-wrap">
      <div class="sky-weather-box" data-a="open" data-v="town" title="${sky.name} (${sky.weatherName} ${sky.weatherIcon})">
        ${skyLandscapeSvg(m, day)}
      </div>
      <div class="pillw town" data-a="open" data-v="town"><span>${whitePeopleIcon}<b>${st.pop}</b><i>/${st.cap}</i></span><span class="hface" style="background:${f[2]}">${f[1]}<small>${st.hap}</small></span></div>
    </div>`;
  }
  // thumbnails of every building, drawn once with the real in-game drawing code
  const TH = {};
  function thumb(k) {
  if (k === 'home') {
    return (typeof assetUrl === 'function') ? assetUrl('spr/home.png') : 'spr/home.png';
  }
  if (TH[k] && TH[k] !== '') return TH[k];

  // ★ zoo는 PNG 그래픽 스프라이트 사용
  if (k === 'zoo') {
    return (typeof assetUrl === 'function') ? assetUrl('spr/zoo/zoo.png') : 'spr/zoo/zoo.png';
  }

  try {
    const cat = TOWN_DEF[k].cat;
    const isTree = cat === 'tree';
    const isFlw = isTree && TOWN_DEF[k].flower;

    // 오크/사쿠라는 PNG 로드가 안 됐으면 캐시하지 말고 매번 다시 시도
    if (isTree && (k === 'oaktree' || k === 'sakuratree')) {
      const img = getTownTreeImg(k === 'oaktree' ? 'tree_oak' : 'tree_sakura');
      if (!img.complete || !img.naturalWidth) {
        // 아직 로딩 안 됨 → 캐시하지 않고 빈 문자열 반환
        // (다음번 호출에서 다시 시도)
        return '';
      }
    }

    const W = 150, H = 130;  // 원래 크기로 복구
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const c = cv.getContext('2d');
    const f = TOWN.fpOf(k, 0), o = { k, x: 0, y: 0, r: 0, cw: 2, cr: 0, pd: -99 };
    const cx = ISO.wx(f.w / 2, f.d / 2), cy = ISO.wy(f.w / 2, f.d / 2);
    const s = cat === 'house' ? .95 : isTree ? (isFlw ? 1.9 : 0.45) : k === 'pet_themepark' ? 0.6 : f.w > 2 ? 1 : 1.5;
    
    const ty = isTree ? (isFlw ? 112 : 118) : k === 'pet_themepark' ? 60 : 88;
c.translate(75, ty);
    c.scale(s, s);
    if (isTree && !isFlw) {
  // ★ 나무별 썸네일 스케일 (PNG는 원래 작게 그려지고, 벡터는 크게 그려짐)
  const TREE_SCALE = {
    oaktree: 1.5, sakuratree: 1.5,   // PNG: 원래 작게 그려져서 더 크게
    evergreen: 1.3,                   // PNG: 상록수
    cherry: 0.9, maple: 0.9, ginkgo: 0.9,
    peach: 0.9, orange: 0.9, apple: 0.9,  // 새 스프라이트: 2.55배 곱해져서 작게
    pine: 1.2, bamboo: 1.3, willow: 1.2, palm: 1.2,
    _default: 1.0,
  };
  const ts = TREE_SCALE[k] || TREE_SCALE._default;
  c.scale(ts, ts);
}
    c.translate(-cx, -cy);
    TOWN.drawObj(c, o, 0, true);
    TH[k] = cv.toDataURL();
  } catch (e) { TH[k] = ''; }
  return TH[k] || '';
}
// ★ PNG 로드 완료 시 썸네일 캐시 무효화 (오크/사쿠라가 정상 표시되도록)
function clearThumbCache() {
  for (const k in TH) delete TH[k];
}
  // ---------- the town panel ----------
  PANELS.town = () => {
    if (!S.town) TOWN.ensure(S);
    const st = TOWN.stats(S), f = face(st.hap), T = S.town, day = S.clock.day;
    const row = (ic, lbl, v, col) => `<div class="row tline"><span>${ic} ${lbl}</span><b style="color:${col || '#5a3a2a'}">${v}</b></div>`;
    let h = `<div class="card tcard"><div class="row" style="gap:12px;align-items:center"><div class="bigface" style="background:${f[2]}">${f[1]}</div>
      <div class="grow"><div class="t">👥 ${t('tPopNow')} <b>${st.pop}</b> / ${t('tPopCap')} <b>${st.cap}</b></div>
      ${bar(st.hap, f[2], t('tHappy') + ' ' + st.hap)}</div></div>
      <div class="m" style="margin-top:6px">${t('tOccHint', { h: st.hap, p: Math.round(TOWN.occFrac(st.hap) * 100) })}</div>
      ${day <= TOWN_BAL.GRACE ? `<div class="m tgood">🛡️ ${t('tGrace', { d: TOWN_BAL.GRACE })}</div>` : st.hap < TOWN_BAL.LOW ? `<div class="m tbad">⚠️ ${t('tLowWarn', { n: Math.max(1, TOWN_BAL.LOW_DAYS - (T.low || 0)) })}</div>` : ''}</div>`;
    h += `<div class="card"><div class="t">😊 ${t('tWhyHappy')}</div>
      ${row('🏡', t('tBase'), '+' + TOWN_BAL.H0)}${row('🏛️', t('tFac'), '+' + Math.round(st.fac), '#3f8a28')}${row('🌳', t('tGreen'), '+' + (Math.round(st.green * 10) / 10), '#3f8a28')}
      ${row('🛎️', t('tSvc'), (st.svc >= 0 ? '+' : '') + (Math.round(st.svc * 10) / 10), st.svc >= 0 ? '#3f8a28' : '#c0402e')}
      ${row('😣', t('tCrowd', { p: st.pop, s: st.sup }), st.crowd ? '-' + Math.round(st.crowd) : '0', st.crowd ? '#c0402e' : '#5a3a2a')}
      ${Object.keys(T.why || {}).length ? `<div class="m" style="margin-top:4px">${t('tToday')}: ${Object.entries(T.why).map(([k, n]) => t('tw_' + k) + ' ×' + n).join(' · ')}</div>` : ''}
      <div class="m" style="margin-top:4px">💡 ${t('tTips')}</div></div>`;
    h += `<div class="card"><div class="t">🏪 ${t('tEffects')}</div>${row('🚶', t('tEffCust'), '×' + TOWN.custK(S).toFixed(2))}${row('👥', t('tEffMax'), '+' + TOWN.maxAdd(S))}${row('🪙', t('tEffSpend'), '×' + TOWN.spendK(S).toFixed(2))}</div>`;
    const best = TOWN.bestPop(S);
    h += `<div class="card"><div class="t">🔓 ${t('tMilestones')}</div>` + TOWN_MS.map(m => `<div class="row tline ${best >= m.pop ? 'tdone' : ''}"><span>${best >= m.pop ? '✅' : '🔒'} ${t('tPopN', { n: m.pop })}</span><span class="m" style="text-align:right">${m.u.map(msText).join(', ')}</span></div>`).join('') + '</div>';
    if ((T.log || []).length) h += `<div class="card"><div class="t">📰 ${t('tLog')}</div>${T.log.slice(0, 6).map(l => `<div class="m">${t('dayN', { n: l.d })} · ${l.x[0] === '+' ? t('tLogIn', { n: l.x.slice(1) }) : t('tLogOut', { n: l.x.slice(1) })}</div>`).join('')}</div>`;
    h += `<div class="row" style="gap:8px"><button class="btn g block" data-a="tgozone">🏘️ ${t('tZoneGo')}</button><button class="btn o block" data-a="open" data-v="tbuild">🏗️ ${t('tBuildBtn')}</button></div>`;
    return frameHTML('🏘️ ' + t('tTitle'), h);
  };
  function msText(u) {
    const [ty, k] = u.split(':');
    if (ty === 'h' || ty === 'd' || ty === 'b') return (TOWN_DEF[k].ic || '') + ' ' + nm(k);
    if (ty === 's') return '🐾 ' + spName(k);
    return t('tc_' + k);
  }
  // ---------- the build menu ----------
  // v2026-10-09: "건설 메뉴 트리를 1.집 2.운영 3.상점·공공 4.장식물 5.나무,꽃 이렇게 5개로" --
  // 게임 로직(cat: 'big'/'civic'/'deco' 등)은 건드리지 않고, 메뉴에 어느 탭으로 보여줄지만
  // 따로 매핑함. "운영": 내 집/농장/목장/펫카페/동물병원/펫미용실/동물원. "상점·공공": 기존
  // 상점·공공 건물 + 공원/호수/기념광장/가로수길/정자/풍차/펫글램핑쉼터(장식물에서 이동).
  const MENU_TAB_OVERRIDE = {
    home: 'ops', farm: 'ops', cafe: 'ops', hosp: 'ops', salon: 'ops', ranch: 'ops', zoo: 'ops',
    park: 'civic', lake: 'civic', monu: 'civic', avenue: 'civic', gazebo: 'civic', windmill: 'civic', camping_zone: 'civic'
  };
  const uiTabOf = (k, d) => MENU_TAB_OVERRIDE[k] || d.cat;
  let tab = 'house';
  PANELS.tbuild = m => {
    if (!S.town) TOWN.ensure(S);
    if (m && m.tab) tab = m.tab;
    const best = TOWN.bestPop(S), st = TOWN.stats(S);
    // v2026-10-09: '길깔기' 단축 버튼(하단 바)으로 들어온 경우엔 tab==='road'인데, 이제 'road'는
    // 건설 메뉴의 5개 탭(집/운영/상점공공/장식물/나무꽃) 안에 더 이상 없는 전용 화면이라
    // 상단에 그 5개 탭 칩이 뜰 이유가 없음(눌러도 갈 곳도 없음) -- 길 목록만 바로 보여줌.
    const isRoadQuick = tab === 'road';
    let h = isRoadQuick ? '' : `<div class="chips">${TOWN_TABS.map(([k, ic]) => `<button class="chip ${tab === k ? 'on' : ''}" data-a="ttab" data-v="${k}">${ic} ${t('tTab_' + k)}</button>`).join('')}</div>`;
    h += `<div class="m" style="margin:4px 0 8px">${t('tTabDesc_' + tab)}</div>`;
    if (tab === 'road') {
      h += `<div class="li tzoneli" style="border: 2px dashed #f87171; background: #fff8f8;">
        <div class="ic tthumb tbigic" style="font-size:26px">🧽</div>
        <div class="grow">
          <div class="t" style="color:#b91c1c">${t('tRoadEraseCard') || '길 철거 (지우기)'}</div>
          <div class="m">${t('tRoadEraseDesc') || '설치된 길을 지우고 설치 비용을 100% 전액 환불받습니다.'}</div>
        </div>
        <button class="btn r sm" data-a="troaderasego">🧽 ${t('tRoadEraseBtn') || '길 철거'}</button>
      </div>`;

      for (const rt of TOWN.ROAD_TYPES) {
        const lvlLock = (S.level || 1) < rt.lvl;
        const lockMsg = `🔒 ${t('tLvlNeed', { n: rt.lvl }) || ('레벨 ' + rt.lvl + ' 필요')}`;
        h += `<div class="li ${lvlLock ? 'lockli' : ''}">
          <div class="ic tthumb road-thumb-box">${roadPreviewSvg(rt.id)}</div>
          <div class="grow">
            <div class="t">${rt.ic} ${rt.name}</div>
            <div class="m">${rt.desc} · 🪙${fmt(rt.cost)}</div>
            ${lvlLock ? `<div class="m tbad">${lockMsg}</div>` : ''}
          </div>
          ${lvlLock ? '' : `<button class="btn o sm ${S.coins < rt.cost ? 'dis' : ''}" data-a="troadstart" data-v="${rt.id}">🛤️ ${t('tRoadPaveBtn') || '설치하기'}</button>`}
        </div>`;
      }
    }
    if (tab === 'house') {
      const zc = TOWN.zoneCost(S), zn = TOWN.zonesOf(S).length, free = TOWN.zoneLots(S).length;
      h += `<div class="li tzoneli"><div class="ic tthumb tbigic">🏘️</div><div class="grow"><div class="t">${t('tZoneNew')} <span class="m">· ${t('ownedN', { n: zn })}</span></div><div class="m">${t('tZoneDesc', { f: free })}</div></div><button class="btn g sm ${S.coins < zc ? 'dis' : ''}" data-a="tpick" data-v="zone">🪙 ${fmt(zc)}</button></div>`;

      const slotLvlNeed = TOWN.nextHouseSlotLevel(S);
      const slotLock = (S.level || 1) < slotLvlNeed;
      const objs = (S.town && S.town.objs) || [];

      for (let tier = 1; tier <= TOWN.HOUSE_TIER_MAX; tier++) {
        const req = TOWN.HOUSE_TIERS[tier];
        const tCost = TOWN.houseTierBuyCost(S, tier);
        const tName = TOWN.houseTierName ? TOWN.houseTierName(tier) : ('티어 ' + tier);
        const owned = objs.filter(o => o.k === 'cottage' && (o.tier || 1) === tier).length;
        const lvlLock = (S.level || 1) < req.lvl;
        const popLock = TOWN.pop(S) < req.pop;
        const lock = lvlLock || slotLock || popLock;

        let lockMsg = '';
        if (lvlLock) lockMsg = `🔒 ${t('tLvlNeed', { n: req.lvl })}`;
        else if (slotLock) lockMsg = `🔒 ${t('tHouseSlotLock', { n: slotLvlNeed })}`;
        else if (popLock) lockMsg = `🔒 ${t('tHouseLockPop', { n: req.pop })}`;

        const imgUrl = (TOWN.getTownHouseImg(tier) && TOWN.getTownHouseImg(tier).src) || thumb('cottage');
        const info = `👥 ${t('tResN', { n: req.cap })}`;

        h += `<div class="li ${lock ? 'lockli' : ''}">
          <div class="ic tthumb"><img src="${imgUrl}"></div>
          <div class="grow">
            <div class="t">${tName}${owned ? ` <span class="m">· ${t('ownedN', { n: owned })}</span>` : ''}</div>
            <div class="m">${info}</div>
            ${lock ? `<div class="m tbad">${lockMsg}</div>` : ''}
          </div>
          ${lock ? '' : `<button class="btn o sm ${S.coins < tCost ? 'dis' : ''}" data-a="tpickhouse" data-v="${tier}">🪙 ${fmt(tCost)}</button>`}
        </div>`;
      }
    }
    for (const [k, d] of Object.entries(TOWN_DEF).sort((A, B) => A[1].cat === 'deco' && B[1].cat === 'deco' ? ((A[1].need || 0) - (B[1].need || 0)) || (A[1].cost - B[1].cost) : 0)) { // v1.24: decorations cheapest / unlocked first
      if (uiTabOf(k, d) !== tab) continue;
      if (d.cat === 'house') continue; // v2026-10-08: 집은 12단계 티어로 위에서 전용 렌더링
      if (d.legacy) continue; // v2026-10-08: 예전 집 종류(tower~villa)는 더 이상 새로 지을 수 없음 -- 12단계 티어 사다리로 교체됨
      if (d.cat === 'big') { h += bigRow(k, d); continue; }
      // v2026-10-08: 집은 인구수 조건(need) 말고도, "이미 가진 집 채수"에 따른 레벨 조건도 추가로 걸림
      const lvlNeed = d.cat === 'house' ? TOWN.nextHouseSlotLevel(S) : 0, lvlLock = d.cat === 'house' && (S.level || 1) < lvlNeed;
      const lock = best < (d.need || 0) || lvlLock, cost = TOWN.kindCost(S, k), n = TOWN.countOf(S, k);
      const info = d.cat === 'house' ? `👥 ${t('tResN', { n: d.cap })}` : d.cat === 'tree' ? `😊 +${d.hap} · ⏳ ${t('tGrowDays', { n: d.grow[d.grow.length - 1] })}` : `😊 +${d.hap}${d.sup ? ' · 🧺 ' + t('tSupN', { n: d.sup }) : ''}${k === 'busstop' ? ' · 🚌 ' + t('tBusInfo') : ''}${d.fx ? '<br>✨ ' + t('tfx_' + d.fx) : ''}`;
      const lockMsg = lvlLock ? `🔒 ${t('tLvlNeed', { n: lvlNeed })}` : `🔒 ${t('tPopN', { n: d.need })}`;
      h += `<div class="li ${lock ? 'lockli' : ''}"><div class="ic tthumb"><img src="${thumb(k)}"></div><div class="grow"><div class="t">${nm(k)}${n ? ` <span class="m">· ${t('ownedN', { n })}</span>` : ''}</div><div class="m">${info}</div>${lock ? `<div class="m tbad">${lockMsg}</div>` : ''}</div>
        ${lock ? '' : `<button class="btn o sm ${S.coins < cost ? 'dis' : ''}" data-a="tpick" data-v="${k}">🪙 ${fmt(cost)}</button>`}</div>`;
    }
    const titleTxt = isRoadQuick ? ('🛣️ ' + t('tRoadQuickBtn')) : ('🏗️ ' + t('tBuildBtn') + ` <span class="m">👥 ${st.pop}/${st.cap}</span>`);
    return frameHTML(titleTxt, h);
  };
  // a big building: build it (choose the spot) or, once built, move it
  function bigRow(k, d) {
    const built = TOWN.bigBuilt(S, k), lockRep = d.rep && repTier(S.rep || 0) < d.rep;
    const info = d.noPlace ? t('tAlongStreet') : t('tLotSize', { w: d.w, d: d.d });
    const btn = built ? (d.noPlace ? `<span class="m tgood">✅ ${t('tBuiltMark')}</span>` : `<button class="btn g sm" data-a="tbigmove" data-v="${k}">🔁 ${t('tMove')}</button>`)
      : lockRep ? '' : `<button class="btn o sm ${S.coins < d.cost ? 'dis' : ''}" data-a="${d.noPlace ? 'tbignow' : 'tpick'}" data-v="${k}">🪙 ${fmt(d.cost)}</button>`;
    return `<div class="li ${lockRep ? 'lockli' : ''}"><div class="ic tthumb tbigic">${d.ic}</div><div class="grow"><div class="t">${nm(k)}${built ? ' ✅' : ''}</div><div class="m">${t('tBigDesc_' + k)}</div><div class="m">📐 ${info}</div>${lockRep ? `<div class="m tbad">🔒 ${t('tNeedRep', { t: (REP_TIERS[d.rep] || {}).ic || '⭐' })}</div>` : ''}</div>${btn}</div>`;
  }
  // ---------- one placed thing ----------
  PANELS.tobj = m => {
    const o = TOWN.objs().find(q => q.id === m.id); if (!o) return '';
    const d = TOWN_DEF[o.k]; let info = '';
    const cp = d.cat === 'house' ? TOWN.capOf(o) : 0, L = TOWN.lvOf(o), mul = 1 + .5 * (L - 1);
    if (d.cat === 'house') {
      info = `<div class="t">👥 ${t('tLiving', { n: o.n || 0, c: cp })}</div>${bar((o.n || 0) / cp * 100, 'linear-gradient(#b8e89a,#5cae3c)', (o.n || 0) + ' / ' + cp)}<div class="m">${t('tHouseHint')}</div>`;
      const addr = TOWN.addressOf ? TOWN.addressOf(S, o) : '', residents = TOWN.residentsOf ? TOWN.residentsOf(S, o.id) : [];
      if (addr) info += `<div class="m" style="margin-top:4px">📍 ${esc(addr)}</div>`;
      if (residents.length) {
        info += `<div class="t" style="margin-top:8px">${t('tResidentsHere')}</div>` + residents.map(r => {
          const lk = ART.randomHuman(r.seed), hp = r.happy == null ? 70 : r.happy, pets = r.pets || [];
          return `<div class="li" data-a="villager" data-v="${r.id}"><div class="ic"><img src="${PIC.human(lk, 'res' + r.id)}"></div><div class="grow"><div class="t">${esc(r.name)}</div><div class="m">😊 ${Math.round(hp)}% · 🐾 ${pets.length}${t('tPetCountUnit')}</div></div></div>`;
        }).join('');
      }
    }
    else if (d.cat === 'tree') { const sg = TOWN.stageOf(S, o), left = Math.max(0, (o.pd || 1) + d.grow[d.grow.length - 1] - S.clock.day); info = `<div class="t">${['🌱', '🌿', d.ic][sg]} ${t('tStage' + sg)}</div>${sg < 2 ? `<div class="m">${t('tGrowLeft', { n: left })}</div>` : ''}`; }
    else info = `<div class="m">😊 +${Math.round(d.hap * (d.cat === 'civic' ? mul : 1) * 10) / 10} · 🧺 ${t('tSupN', { n: Math.round(d.sup * (d.cat === 'civic' ? mul : 1)) })}</div>${d.fx ? `<div class="m">✨ ${t('tfx_' + d.fx)}${L > 1 && /spend|movein/.test(d.fx) ? ' ×' + mul : ''}</div>` : ''}`;
    const back = Math.floor((o.paid || 0) / 2);
    if (d.cat === 'house') {
      // v2026-10-08: 집은 티어(1~12)로 올라가고, 다음 티어는 "레벨 + 마을 인구 + 코인"을 전부 만족해야 함
      const up = TOWN.canUp(o), req = up ? TOWN.houseNextReq(o) : null;
      const okLvl = req && (S.level || 1) >= req.lvl, okPop = req && TOWN.pop(S) >= req.pop;
      const maxed = L >= TOWN.HOUSE_TIER_MAX;
      info = `<div class="card tlvcard"><div class="t">🏠 ${t('tTierN', { n: L })}${maxed ? ' · ' + t('tHouseMaxTier') : ''}</div>${req ? `<div class="m">${t('tHouseNextCap', { n: L + 1, c: req.cap })}</div>${okLvl ? '' : `<div class="m tbad">${t('tHouseLockLvl', { n: req.lvl })}</div>`}${okPop ? '' : `<div class="m tbad">${t('tHouseLockPop', { n: req.pop })}</div>`}<button class="btn o block ${!okLvl || !okPop || S.coins < req.cost ? 'dis' : ''}" data-a="tup" data-v="${o.id}" style="margin-top:6px">⬆️ ${t('tUpBtn')} · 🪙${fmt(req.cost)}</button>` : ''}</div>` + info;
    } else if (d.cat === 'civic') { // levels
      const up = TOWN.canUp(o), need = up && TOWN.upNeed(o), okPop = up && TOWN.bestPop(S) >= need, cost = up && TOWN.upCost(o);
      const next = !up ? '' : t('tUpCivic', { m: (1 + .5 * L).toFixed(1) });
      info = `<div class="card tlvcard"><div class="t">${'⭐'.repeat(L)} Lv${L}${L >= TOWN.LV_MAX ? ' · ' + t('tLvMax') : ''}</div>${up ? `<div class="m">⬆️ Lv${L + 1}: ${next}</div>${okPop ? '' : `<div class="m tbad">🔒 ${t('tPopN', { n: need })}</div>`}<button class="btn o block ${!okPop || S.coins < cost ? 'dis' : ''}" data-a="tup" data-v="${o.id}" style="margin-top:6px">⬆️ ${t('tUpBtn')} · 🪙${fmt(cost)}</button>` : ''}</div>` + info;
    }
    if (o.k === 'shelter') info += `<button class="btn o block" data-a="open" data-v="shelter" style="margin-top:8px">🛖 ${t('tManageShelter')}</button>`;
    if (o.k === 'zoo') info += `<button class="btn o block" data-a="open" data-v="zoo" style="margin-top:8px">🦁 ${t('tManageZoo')}</button>`;
    const houseThumb = d.cat === 'house' ? ((TOWN.getTownHouseImg(L).src) || thumb(o.k)) : thumb(o.k);
    return frameHTML((d.ic || '') + ' ' + nm(o.k), `<div class="center"><img src="${houseThumb}" style="width:130px"></div>${info}
      <div class="row" style="gap:8px;margin-top:10px">${TOWN.maxR(o.k) > 1 ? `<button class="btn b block" data-a="trotnow" data-v="${o.id}">🔄 ${t('tRotateDir')}</button>` : ''}<button class="btn g block" data-a="tmovego" data-v="${o.id}">🔁 ${t('tMove')}</button><button class="btn r block" data-a="tdemo" data-v="${o.id}">🗑️ ${t('tDemo')}${back ? ' +🪙' + fmt(back) : ''}</button></div>`);
  };

  // User Request 4: 동물 직접 클릭 시 설명 그림/글과 먹이주기 버튼만 표시 (아기 동물 지원)
  PANELS.zoo_animal = m => {
    const sp = m.sp || 'lion';
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
    const isBaby = !!m.isBaby;
    const rawNm = t('zooPetName_' + key) || t('zooPetName_' + sp) || key;
    const petName = isBaby ? ('🍼 아기 ' + rawNm) : rawNm;
    const habitat = m.habitat || t('zooBadge_savanna');
    const pic = (typeof assetUrl === 'function')
      ? assetUrl('spr/zoo/' + key + (isBaby ? '_2.png' : '_1.png'))
      : ('spr/zoo/' + key + (isBaby ? '_2.png' : '_1.png'));
    const lastFed = S && S.zoo && S.zoo.lastFed && (Date.now() - S.zoo.lastFed < 20000);
    const statusTxt = isBaby ? '🍼 아기 동물' : (lastFed ? t('zooEatingTag') : t('zooWalkingTag'));
    const statusBadge = `<span class="badge ${isBaby ? 'p' : (lastFed ? 'g' : 'b')}" style="display:inline-block;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:bold;margin-bottom:6px">${statusTxt}</span>`;
    const petDesc = isBaby
      ? (rawNm + '의 아주 사랑스러운 아기예요! 엄마 아빠 곁에서 신나게 재롱을 부리고 있어요. 달콤한 간식과 우유를 주면 기뻐서 펄쩍 뛰며 행복해해요! ✨')
      : (t('zooPetDesc_' + sp) || m.desc || (rawNm + '의 건강하고 활기찬 생태를 관찰할 수 있어요.'));

    return frameHTML('🐾 ' + petName, `
      <div style="text-align:center;margin-bottom:12px">
        <div style="background:radial-gradient(circle, #fef9c3 30%, #fef08a 70%);border-radius:18px;padding:14px;display:inline-block;border:2px solid #ca8a04;box-shadow:0 4px 12px rgba(0,0,0,.08)">
          <img src="${pic}" style="width:110px;height:110px;object-fit:contain;filter:drop-shadow(0 4px 6px rgba(0,0,0,.15))">
        </div>
      </div>
      <div style="text-align:center;margin-bottom:10px">
        <div style="font-size:18px;font-weight:800;color:#1e3a1e;margin-bottom:4px">${petName}</div>
        <div style="font-size:12px;color:#65a30d;font-weight:700;margin-bottom:6px">📍 ${habitat}</div>
        ${statusBadge}
      </div>
      <div class="card" style="background:#fcfbf7;border:1px solid #e7dfcf;border-radius:10px;padding:12px;font-size:13px;line-height:1.55;color:#443322;margin-bottom:14px">
        ${petDesc}
      </div>
      <button class="btn o block ${S.coins < 50 ? 'dis' : ''}" data-a="zoofeedanimal" data-v="${key}" style="font-size:14px;font-weight:bold;padding:10px">
        ${isBaby ? '🍼 아기 간식 주기' : t('zooFeedAnimalBtn')}
      </button>
    `);
  };
  // ---------- placing ----------
  function startPlace(k, mv, tier) {
    const big = TOWN_DEF[k].cat === 'big', o = !big && mv && TOWN.objs().find(q => q.id === mv), L = big && mv ? LAY(k) : null;
    const f = TOWN.fpOf(k, o ? o.r : 0);
    let x, y;
    const lot = !o && TOWN_DEF[k].cat === 'house' && TOWN.zoneLots(S, k)[0]; // a new house: start on a free lot in a residential zone
    if (o) { x = o.x; y = o.y; } else if (L) { x = L.x; y = L.y; } else if (lot) { x = lot.x; y = lot.y; } else { const g = World.toGrid(innerWidth / 2, innerHeight / 2 - 40); x = Math.floor(g.x - f.w / 2); y = Math.floor(g.y - f.d / 2); const p = TOWN.canPlace(S, k, x, y, 0) ? TOWN.nearFree(S, k, x, y, 0) : null; if (p) { x = p.x; y = p.y; } }
    const houseTier = tier || (o ? o.tier : 1);
    App.tplace = { k, x, y, r: o ? o.r : 0, mv: mv || null, tier: houseTier };
    closePanel(); World.cam.follow = false; World.cam.z = Math.min(World.cam.z, k === 'zone' ? .4 : big ? Math.max(.2, Math.min(.5, 14 / Math.max(f.w, f.d))) : TOWN_DEF[k].cat === 'house' ? .7 : .9);
    const c = ISO.wx(x + f.w / 2, y + f.d / 2), d = ISO.wy(x + f.w / 2, y + f.d / 2); World.cam.x = c; World.cam.y = d;
    render();
  }
  // Helper: Mini isometric preview SVG for road styles
  function roadPreviewSvg(id) {
    const w = 46, h = 26;
    if (id === 'dirt') {
      return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><polygon points="23,2 44,13 23,24 2,13" fill="#c4925e" stroke="#8a5a33" stroke-width="1.2"/><circle cx="15" cy="11" r="1.3" fill="#784420"/><circle cx="28" cy="14" r="1.4" fill="#784420"/><circle cx="21" cy="18" r="1.1" fill="#dfab7a"/><circle cx="31" cy="9" r="1.2" fill="#784420"/></svg>`;
    } else if (id === 'brick') {
      return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><polygon points="23,2 44,13 23,24 2,13" fill="#c45842" stroke="#873224" stroke-width="1.2"/><path d="M12,8 L33,18 M18,5 L39,15 M15,14 L19,16 M29,20 L33,22 M22,9 L26,11" stroke="#ecd8c6" stroke-width="0.9" opacity="0.8"/></svg>`;
    } else if (id === 'block') {
      return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><polygon points="23,2 44,13 23,24 2,13" fill="#d1cbbf" stroke="#78716c" stroke-width="1.2"/><path d="M12,8 L34,18 M23,2 L23,24" stroke="#a8a29e" stroke-width="1"/><rect x="18" y="10" width="10" height="6" fill="none" stroke="#e7e5e4" stroke-width="0.8" opacity="0.6"/></svg>`;
    } else if (id === 'step') {
      return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><polygon points="23,2 44,13 23,24 2,13" fill="#84cc16" stroke="#4d7c0f" stroke-width="1.2"/><ellipse cx="16" cy="11" rx="5" ry="3" fill="#f1f5f9" stroke="#94a3b8" stroke-width="0.8"/><ellipse cx="30" cy="15" rx="6" ry="3.5" fill="#f1f5f9" stroke="#94a3b8" stroke-width="0.8"/><circle cx="23" cy="7" r="1.5" fill="#fde047"/></svg>`;
    } else if (id === 'stone') {
      return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><polygon points="23,2 44,13 23,24 2,13" fill="#f8fafc" stroke="#d4af37" stroke-width="1.4"/><polygon points="23,6 36,13 23,20 10,13" fill="#f1f5f9" stroke="#e2e8f0" stroke-width="0.8"/><polygon points="23,9 30,13 23,17 16,13" fill="#fef08a" stroke="#eab308" stroke-width="0.7"/></svg>`;
    } else if (id === 'tile') {
      return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><polygon points="23,2 44,13 23,24 2,13" fill="#fefce8" stroke="#c2410c" stroke-width="1.2"/><polygon points="23,5 37,13 23,21 9,13" fill="#ffffff" stroke="#ea580c" stroke-width="0.8"/><polygon points="23,8 31,13 23,18 15,13" fill="#0284c7" opacity="0.7"/><circle cx="23" cy="13" r="2" fill="#d97706"/></svg>`;
    } else if (id === 'yellow') {
      return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><polygon points="23,2 44,13 23,24 2,13" fill="#facc15" stroke="#d97706" stroke-width="1.3"/><polygon points="23,6 36,13 23,20 10,13" fill="#fef08a" stroke="#ca8a04" stroke-width="0.8"/><circle cx="23" cy="13" r="2.2" fill="#fffbeb" stroke="#d97706" stroke-width="0.7"/></svg>`;
    }
    // Default cobble
    return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><polygon points="23,2 44,13 23,24 2,13" fill="#94a3b8" stroke="#475569" stroke-width="1.2"/><circle cx="17" cy="10" r="3.2" fill="#cbd5e1" stroke="#64748b" stroke-width="0.7"/><circle cx="29" cy="13" r="3.6" fill="#e2e8f0" stroke="#64748b" stroke-width="0.7"/><circle cx="20" cy="17" r="3" fill="#cbd5e1" stroke="#64748b" stroke-width="0.7"/></svg>`;
  }

  function bar_() {
    const rd = App.troad;
    if (rd) {
      const rts = TOWN.ROAD_TYPES || [{ id: 'cobble', ic: '🪨', cost: TOWN.ROAD_COST }];
      const curStyle = rd.style || 'cobble';
      const curRt = rts.find(x => x.id === curStyle) || rts[0] || { cost: 10, ic: '🛤️' };
      const isDouble = !!rd.double;
      const cards = rts.map(rt => {
        const isSel = !rd.erase && curStyle === rt.id;
        const name = t('road_' + rt.id) || rt.id;
        return `<button class="road-card ${isSel ? 'active' : ''}" data-a="troadstyle" data-v="${rt.id}">
          <div class="road-card-prev">${roadPreviewSvg(rt.id)}</div>
          <div class="road-card-title">${name}</div>
          <div class="road-card-cost">🪙${rt.cost}</div>
        </button>`;
      }).join('');
      return `<div class="editbar tplacebar road-palette-bar">
        <div class="road-cards-scroll">${cards}</div>
        <div class="road-bot-row">
          <div class="grow" style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
            <span>${rd.erase ? '🧽' : curRt.ic} <b>${rd.erase ? (t('tRoadErase') || '길 철거') : (t('tRoadPave') || '길 깔기')}</b> <span class="m">· ${rd.erase ? '1칸 철거 (100% 환불)' : (isDouble ? `2칸 동시 🪙${curRt.cost * 2}` : `1칸 🪙${curRt.cost}`)}</span></span>
            ${!rd.erase ? `
            <button type="button" class="btn sm road-double-btn ${isDouble ? 'g' : ''}" data-a="troaddouble" style="display:inline-flex;align-items:center;gap:5px;cursor:pointer;user-select:none;font-weight:700;font-size:12px;padding:3px 9px;border-radius:12px;background:${isDouble ? 'rgba(34,197,94,0.24)' : 'rgba(255,255,255,0.22)'};border:1px solid ${isDouble ? '#22c55e' : 'rgba(255,255,255,0.38)'};">
              <span class="road-chk-box" style="display:inline-flex;align-items:center;justify-content:center;width:15px;height:15px;border-radius:3px;background:${isDouble ? '#22c55e' : '#ffffff'};border:1.5px solid ${isDouble ? '#16a34a' : '#94a3b8'};color:#fff;font-size:11px;font-weight:900;line-height:1;box-shadow:inset 0 1px 2px rgba(0,0,0,0.12);">${isDouble ? '✔' : ''}</span>
              <span>2개타일동시</span>
            </button>
            ${isDouble ? `<button type="button" class="btn sm o" data-a="troaddir" style="padding:3px 8px;font-size:11px;font-weight:800;" title="2타일 방향 전환">${rd.dir === 'y' ? '↕ 세로2' : '↔ 가로2'}</button>` : ''}
            ` : ''}
          </div>
          <button class="btn ${rd.erase ? '' : 'g'} sm" data-a="troadpave">🛤️ ${t('tRoadPave') || '길 깔기'}</button>
          <button class="btn ${rd.erase ? 'r' : ''} sm" data-a="troaderase">🧽 ${t('tRoadErase') || '길 철거'}</button>
          <button class="btn sm" data-a="troaddone">✓ ${t('done') || '완료'}</button>
        </div>
      </div>`;
    }
    const p = App.tplace; if (!p) return '';
    const bad = TOWN.canPlace(S, p.k, p.x, p.y, p.r, p.mv), d = TOWN_DEF[p.k];
    const cost = p.k === 'zone' ? TOWN.zoneCost(S) : d.cat === 'big' ? d.cost : (d.cat === 'house' && !p.mv) ? TOWN.houseTierBuyCost(S, p.tier || 1) : TOWN.kindCost(S, p.k), turn = TOWN.maxR(p.k) > 1;
    return `<div class="editbar tplacebar"><div class="grow">📍 ${t('tPlaceHint')}${bad ? `<div class="tbadtxt">⛔ ${t(bad)}</div>` : ''}${d.cat === 'house' && !p.mv && !TOWN.zoneLots(S, p.k).length ? `<div class="tbadtxt">🏘️ ${t('tZoneFull')} <button class="btn g sm" data-a="tpick" data-v="zone">${t('tZoneNew')} 🪙${fmt(TOWN.zoneCost(S))}</button></div>` : ''}</div>
      ${turn ? `<button class="btn g sm" data-a="trotl" title="${t('tRotLeft')}">↺ ${t('tRotLeft')}</button><button class="btn g sm" data-a="trotr" title="${t('tRotRight')}">↻ ${t('tRotRight')}</button>` : ''}<button class="btn r sm" data-a="tcancel">✖</button>
      <button class="btn sm ${bad || (!p.mv && S.coins < cost) ? 'dis' : ''}" data-a="tok">✔ ${p.mv ? t('tMoveHere') : '🪙' + fmt(cost)}</button></div>`;
  }
  function tap(h) {
    if (h.kind === 'zoo_animal') {
      openPanel({ type: 'zoo_animal', sp: h.sp, name: h.name, desc: h.desc, habitat: h.habitat, isBaby: h.isBaby });
      return true;
    }
    if (h.kind === 'tplace' && App.tplace) { const p = App.tplace, f = TOWN.fpOf(p.k, p.r); p.x = h.gx - Math.floor(f.w / 2); p.y = h.gy - Math.floor(f.d / 2); render(); return true; }
    if (h.kind === 'tobj') {
      const o = TOWN.objs().find(q => q.id === h.id);
      if (o && o.k === 'shelter' && !App.tplace) { openPanel({ type: 'shelter' }); return true; }
      if (o && o.k === 'zoo' && !App.tplace) { return false; } // User Request 4: 동물원 클릭 시 수금/구경 창 뜨지 않고 클릭 이동 허용
      openPanel({ type: 'tobj', id: h.id }); return true;
    }
    if (h.kind === 'troad' && App.troad) {
      const rd = App.troad, pt = { x: h.gx, y: h.gy };
      const tiles = rd.double
        ? (rd.dir === 'y' ? [[pt.x, pt.y], [pt.x, pt.y + 1]] : [[pt.x, pt.y], [pt.x + 1, pt.y]])
        : [[pt.x, pt.y]];
      const r = actR({ t: 'troad', tiles, on: !rd.erase, style: rd.style || 'cobble' });
      if (r && r.ok) {
        if (typeof SND !== 'undefined' && SND.pop) SND.pop();
      } else if (r && r.err === 'notEnough') {
        if (typeof toast === 'function') toast(t('notEnough') || '코인이 부족합니다');
      } else if (r && r.err === 'tLocked') {
        if (typeof toast === 'function') toast(t('tLvlNeed', { n: (r.p && r.p.n) || 1 }) || ('레벨 ' + ((r.p && r.p.n) || 1) + ' 필요'));
      }
      render();
      return true;
    }
    if (h.kind === 'tzonesign') { openPanel({ type: 'town' }); return true; }
    return false;
  }
  function bigOk(p) {
    const go = extra => { const r = p.mv ? actR({ t: 'tbigmove', k: p.k, x: p.x, y: p.y }) : actR(Object.assign({ t: 'tbig', k: p.k, x: p.x, y: p.y }, extra || {}));
      if (r && r.ok) { SND.level && SND.level(); fxAt(innerWidth / 2, innerHeight / 2 - 60, TOWN_DEF[p.k].ic); App.tplace = null; } render(); };
    if (p.k === 'monu' && !p.mv) { // the monument needs the words carved on it (and the two of us as the statue)
      const others = Object.entries(Net.players || {}).filter(([id]) => id !== CFG.id).map(([, q]) => q), pn = others[0];
      askPrompt({ title: '💑 ' + nm('monu'), text: t('vbuild_monu', { c: fmt(TOWN_DEF.monu.cost) }), okText: t('vBuildBtn'), input: (CFG.name || '') + ' ❤ ' + ((pn && pn.name) || ''), max: 22, ok: v => go({ text: v, looks: [CFG.look, (pn && pn.look) || ART.randomHuman(11)] }) });
      return;
    }
    go();
  }
  // the old "build the café / hospital" buttons (shop panel) now start choosing a spot
  const bigStart = k => { const d = TOWN_DEF[k]; if (TOWN.bigBuilt(S, k)) return; if (d.rep && repTier(S.rep || 0) < d.rep) { toast(t('tNeedRep', { t: (REP_TIERS[d.rep] || {}).ic || '⭐' })); return; } startPlace(k); };
  Object.assign(XACT, {
    zoofeedanimal: v => {
      if (S.coins < 50) { toast(t('noCoins') || '코인이 부족합니다'); return; }
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
    },
    tgozone: () => { const z = TOWN.zonesOf(S)[0]; if (!z) return; closePanel(); World.cam.follow = false; World.cam.z = .55; World.cam.x = ISO.wx(z.x + z.w / 2, z.y + z.d / 2); World.cam.y = ISO.wy(z.x + z.w / 2, z.y + z.d / 2); },
    troadgo: () => { App.troad = { erase: false, double: false, dir: 'x', style: 'dirt' }; App.tplace = null; closePanel(); World.cam.follow = false; World.cam.z = Math.min(World.cam.z, .6); render(); },
    troadstart: v => { App.troad = { erase: false, double: false, dir: 'x', style: v || 'dirt' }; App.tplace = null; closePanel(); World.cam.follow = false; World.cam.z = Math.min(World.cam.z, .6); render(); },
    troaderasego: () => { App.troad = { erase: true, double: false, dir: 'x', style: 'dirt' }; App.tplace = null; closePanel(); World.cam.follow = false; World.cam.z = Math.min(World.cam.z, .6); render(); },
    troadstyle: v => { const rd = App.troad; if (!rd) return; rd.style = v; rd.erase = false; render(); },
    troadpave: () => { const rd = App.troad; if (!rd) return; rd.erase = false; render(); },
    troaderase: () => { const rd = App.troad; if (!rd) return; rd.erase = true; render(); },
    troaddouble: () => { const rd = App.troad; if (!rd) return; rd.double = !rd.double; render(); },
    troaddir: () => { const rd = App.troad; if (!rd) return; rd.dir = rd.dir === 'y' ? 'x' : 'y'; render(); },
    troaddone: () => { App.troad = null; render(); },
    tup: v => { const r = actR({ t: 'tup', id: +v }); if (r && r.ok) { SND.level && SND.level(); fxAt(innerWidth / 2, innerHeight / 2 - 80, '⭐'); } renderPanel(true); },
    buildcafe: () => bigStart('cafe'), buildhosp: () => bigStart('hosp'),
    tbigmove: v => { if (TOWN_DEF[v].live && S.clock.ph === 'open') { toast(t('tMoveClosed')); return; } startPlace(v, v); },
    tbignow: v => { const r = actR({ t: 'tbig', k: v }); if (r && r.ok) { SND.level && SND.level(); fxAt(innerWidth / 2, innerHeight / 2, TOWN_DEF[v].ic); } renderPanel(true); },
    ttab: v => { tab = v; if (typeof openPanel === 'function') openPanel({ type: 'tbuild', tab: v }); else renderPanel(true); },
    tpick: v => startPlace(v),
    tpickhouse: v => startPlace('cottage', null, +v),
    tmovego: v => {
      const targetObj = TOWN.objs().find(o => o.id === +v);
      startPlace(targetObj.k, +v, targetObj.tier);
    },
    trotnow: v => {
      const o = TOWN.objs().find(q => q.id === +v); if (!o) return;
      const nextR = ((o.r || 0) + 1) % TOWN.maxR(o.k);
      const r = actR({ t: 'tmove', id: o.id, x: o.x, y: o.y, r: nextR });
      if (r && r.ok) { SND.pop && SND.pop(); closePanel(); render(); }
      else startPlace(o.k, o.id);
    },
    trot: () => { const p = App.tplace; if (!p) return; p.r = ((p.r || 0) + 1) % TOWN.maxR(p.k); render(); },
    trotl: () => { const p = App.tplace; if (!p) return; const m = TOWN.maxR(p.k); p.r = ((p.r || 0) - 1 + m) % m; render(); },
    trotr: () => { const p = App.tplace; if (!p) return; const m = TOWN.maxR(p.k); p.r = ((p.r || 0) + 1) % m; render(); },
    tcancel: () => { App.tplace = null; render(); },
    tok: () => {
      const p = App.tplace; if (!p) return;
      if (TOWN_DEF[p.k].cat === 'big') { bigOk(p); return; }
      if (p.k === 'zone') { const r = actR({ t: 'tzone', x: p.x, y: p.y, r: p.r || 0 }); if (r && r.ok) { SND.level && SND.level(); fxAt(innerWidth / 2, innerHeight / 2 - 60, '🏘️'); App.tplace = null; } render(); return; }
      const r = p.mv ? actR({ t: 'tmove', id: p.mv, x: p.x, y: p.y, r: p.r }) : actR({ t: 'tbuild', k: p.k, tier: p.tier || 1, x: p.x, y: p.y, r: p.r });
      if (r && r.ok) {
        const d = TOWN_DEF[p.k];
        fxAt(innerWidth / 2, innerHeight / 2 - 60, d.cat === 'tree' ? '🌱' : d.cat === 'house' ? '🏠' : '✨'); SND.level && SND.level();
        // trees, flowers, benches and lamps: stay in planting mode for the next one, one tile over
        if (!p.mv && (d.cat === 'tree' || p.k === 'bench' || p.k === 'lamp') && S.coins >= TOWN.kindCost(S, p.k)) { const f = TOWN.fpOf(p.k, p.r); p.x += f.w + (d.cat === 'tree' ? 1 : 1); }
        else App.tplace = null;
      }
      render();
    },
    tdemo: v => { const o = TOWN.objs().find(q => q.id === +v); if (!o) return; askPrompt({ title: '🗑️ ' + nm(o.k), text: t('tDemoAsk', { c: fmt(Math.floor((o.paid || 0) / 2)) }), okText: t('tDemo'), ok: () => { actR({ t: 'tdemo', id: +v }); closePanel(); } }); }
  });
  Object.assign(XEV, {
    townDay: e => { if (e.moved) { SND.love(); toast('🏠 ' + t('tMovedIn', { n: e.moved })); } if (e.left) setTimeout(() => { SND.err(); toast('😢 ' + t('tLeft', { n: e.left })); }, e.moved ? 1500 : 0); },
    townMs: e => { SND.level(); fxAt(innerWidth / 2, innerHeight / 2, '🎉'); const m = TOWN_MS.find(q => q.pop === e.pop); toast('🎉 ' + t('tMsReached', { n: e.pop }) + (m ? ' ' + m.u.map(msText).join(', ') : '')); }
  });
  return { chip, bar: bar_, tap, thumb, startPlace, clearThumbCache };
})();
if (typeof window !== 'undefined') window.TOWNUI = TOWNUI;

Object.assign(I18N.ko, {
  tTitle: '우리 마을', tPopNow: '현재 주민', tPopCap: '가능 주민', tHappy: '행복', tBuildBtn: '건설', tRoadQuickBtn: '길깔기', tPopN: '주민 {n}명',
  tOccHint: '행복 {h}이면 집 정원의 {p}%까지 이사 와요. 행복이 높을수록 더 많이 살아요.',
  tGrace: '초반 보호: {d}일째까지는 행복이 낮아도 아무도 떠나지 않아요.', tLowWarn: '행복이 너무 낮아요! {n}일 더 이어지면 주민이 떠나기 시작해요.',
  tWhyHappy: '행복 지수 내역', tBase: '기본', tFac: '편의시설', tGreen: '나무·꽃', tSvc: '가게 서비스', tCrowd: '혼잡 (주민 {p} / 시설이 돌볼 수 있는 {s}명)',
  tToday: '오늘의 불만', tw_nomatch: '원하는 동물 없음', tw_lost: '기다리다 떠남', tw_nostock: '용품 없음', tw_badmatch: '안 맞는 동물', tw_cafe: '음식이 안 나옴', tw_hosp: '병원 자리 없음', tw_salon: '미용 대기',
  tTips: '편의시설과 나무를 지으면 행복이 올라가요. 원하는 동물이 없거나 오래 기다리게 하면 내려가요.',
  tEffects: '마을이 펫샵에 주는 효과', tEffCust: '손님 오는 빈도', tEffMax: '동시 손님 수', tEffSpend: '소비력',
  tMilestones: '주민 수 해금', tLog: '마을 소식', tLogIn: '새 주민 {n}명 입주', tLogOut: '주민 {n}명 떠남',
  tc_family: '👨‍👩‍👧 가족 손님', tc_collector: '🧐 수집가 손님', tc_rich: '💎 부자 손님 증가', tc_celeb: '🌟 유명인 증가',
  tZoneName: '주택가', tZoneNew: '새 주택가 조성', tZoneDesc: '집 10채를 지을 수 있는 동네(골목길 포함)예요. 지금 빈 집터 {f}곳', tZoneBuilt: '새 주택가를 만들었어요! 🏘️ 집을 지어 주민을 불러 보세요',
  tNeedZone: '집은 주택가 안에만 지을 수 있어요 🏘️', tZoneFull: '주택가에 빈 집터가 없어요! 새 주택가를 만들어 동네를 넓혀요 →', tOnLane: '골목길 위에는 지을 수 없어요', tInZone: '주택가 안에는 집·나무·꽃·작은 시설만 지을 수 있어요', tZoneHint: '🏘️ 주민들은 서쪽 주택가에 살아요. 집은 주택가 안에 지어요!',
  tRoadTool: '길 깔기 / 지우기', tRoadDesc: '원하는 곳에 길을 직접 내요. 한 칸 🪙{c}, 지우기는 무료', tRoadStart: '시작', tRoadHint1: '시작할 칸을 누르세요', tRoadHint2: '끝 칸을 누르면 그 사이에 길이 생겨요 (ㄱ자로 이어짐)', tRoadDesc2: '한 칸 🪙{c}', tRoadPave: '깔기', tRoadErase: '지우기', tRoadNone: '바꿀 칸이 없어요 (건물·가게·큰길 위는 안 돼요)', tRoadPaved: '길 {n}칸을 깔았어요 (🪙{c})', tRoadErased: '길 {n}칸을 지웠어요',
  priceHint: '🪙 가격은 이 손님에게 팔 때 받는 기본 금액이고, 성격이 딱 맞으면 +30%예요.', tOnPath: '길 위에는 지을 수 없어요', tZoneGo: '주택가 보기', regSadT: '{n}이(가) 서운한 얼굴로 돌아갔어요… 😢', tUpBtn: '레벨업', tLvMax: '최고 레벨', tUpHouse: '방이 늘어나 주민 {n}명까지 살아요', tUpCivic: '행복·돌봄·특별 효과 ×{m}', tUpgraded: '레벨업! ⭐ Lv{n}이 되었어요',
  tTab_civic: '상점·공공', tTabDesc_civic: '빵집·학교·소방서 같은 상점·공공 건물과, 공원·호수·기념 광장·가로수길·정자·풍차·펫 글램핑 쉼터 같은 큰 부지예요. 행복을 크게 올리고, 건물마다 특별한 효과가 있어요.',
  tTab_ops: '운영', tTabDesc_ops: '내 집, 농장, 목장, 펫 카페, 동물병원, 펫 미용실, 동물원처럼 직접 운영하는 핵심 시설이에요. 원하는 자리에 지어 보세요! (부지는 가장 크게 키웠을 때 크기예요)',
  tk_gate: '마을 입구 간판', tk_conv: '편의점', tk_bakery: '빵집', tk_florist: '꽃집', tk_clinic: '동네 의원', tk_dogpark: '펫 운동장', tk_photo: '사진관', tk_school: '학교', tk_police: '경찰서', tk_fire: '소방서',
  tk_library: '도서관', tk_market: '주말 벼룩시장', tk_training: '펫 훈련학교', tk_pethotel: '펫 호텔', tk_clocktower: '시계탑 광장', tk_lookout: '전망대', tk_chapel: '웨딩 채플', tk_shelter: '유기동물 보관소', tk_zoo: '동물원',
  rescuedShelter: '🆘 구조 성공! {name}이(가) 유기동물 보관소로 안전하게 이동했어요 🛖🐾', rescuedCafe: '🆘 구조 성공! {name}이(가) 카페 놀이방으로 안전하게 이동했어요 ☕🐾',
  strayCaughtShelter: '🐾 길에서 헤매던 {name}을(를) 구조해 유기동물 보관소로 데려왔어요!', strayCaughtCafe: '🐾 길에서 헤매던 {name}을(를) 구조해 카페 놀이방으로 데려왔어요!', strayCaughtShop: '🐾 길에서 헤매던 {name}을(를) 구조해 가게 우리로 데려왔어요!',
  shelterFed: '🍖 보호소 아이들에게 든든한 밥을 챙겨줬어요!', shelterPlayed: '🎾 보호소 아이들과 즐겁게 놀아줬어요!', shelterCleaned: '🧹 보호소를 깨끗하게 청소했어요!',
  shelterMovedToShop: '🏪 {name}을(를) 펫샵 우리로 데려왔어요!', shelterAdoptedManual: '🏡 {name}이(가) 따뜻한 새 가족을 만났어요! (입양 지원금 🪙{fee} 획득)',
  zooFed: '🍖 야생 동물에게 먹이를 주었어요! 동물이 무척 기뻐합니다 ✨', zooTicketCollected: '🪙 동물원 입장료 🪙{c}을(를) 정산받았습니다!',
  needHouseModal: '동물을 맞이할 우리가 부족해요! 상점의 가구 탭에서 우리를 구매해 주세요.',
  tfx_spend2: '펫샵 소비력 +2%', tfx_spend3: '펫샵 소비력 +3%', tfx_green: '나무·꽃 행복 한도 +4', tfx_movein: '하루 입주 +2명', tfx_thief: '도둑이 거의 안 와요', tfx_stay: '주민 이탈 절반', tfx_collector: '수집가 손님 증가', tfx_rich: '부자 손님 증가', tfx_shelter: '길동물 자동 구조·보호 및 주민 입양 (입양 지원금 수입)', tfx_zoo: '대형 사파리 테마파크 · 관람객 입장료 수입 (🪙+50)',
  tUseBuildMenu: '🏗️ 건설 메뉴에서 자리를 골라 지어 주세요', tTab_big: '큰 건물', tTabDesc_big: '농장, 내 집, 카페, 병원 같은 큰 건물이에요. 원하는 자리에 지어 보세요! (부지는 가장 크게 키웠을 때 크기예요)',
  tk_farm: '농장', tk_ranch: '목장', tBigDesc_ranch: '소와 돼지를 키워요. 소는 우유, 돼지는 고기를 줘요 (레벨 8부터)', tk_home: '내 집', tk_cafe: '펫 카페', tk_hosp: '동물병원', tk_salon: '펫 미용실', tk_park: '공원', tk_lake: '호수', tk_monu: '기념 광장', tk_avenue: '가로수길',
  tBigDesc_farm: '밭 + 씨앗 가게 + 닭장 자리. 농작물로 카페 요리를 해요', tBigDesc_home: '펫과 함께 사는 우리 집. 가구를 놓고 꾸며요', tBigDesc_cafe: '손님이 음식을 먹고 펫과 놀아요', tBigDesc_hosp: '아픈 동물을 치료해요',
  tBigDesc_salon: '손님 펫을 미용해 줘요', tBigDesc_park: '분수·연못·놀이터가 있는 큰 공원 (행복 +10)', tBigDesc_lake: '백조·다리·낚시 (행복 +8)', tBigDesc_monu: '두 사람의 동상과 새긴 글 (행복 +5)', tBigDesc_avenue: '큰길 양쪽에 계절 따라 바뀌는 가로수 (행복 +6)',
  tLotSize: '부지 {w}×{d}칸', tAlongStreet: '큰길을 따라 저절로 심어져요', tBuiltMark: '지음', tNeedRep: '평판 {t} 등급이 되면 지을 수 있어요', tMoveClosed: '손님이 드나드는 건물은 영업시간이 끝난 뒤에 옮길 수 있어요',
  tNeedHome: '먼저 건설 메뉴에서 "내 집"을 지어 주세요 🏡', tNotBuiltYet: '{b}이(가) 아직 없어요. 건설 메뉴에서 원하는 자리에 지어 보세요!', tBigBuilt_farm: '농장을 지었어요! 🌾 씨앗 가게에서 씨앗을 사서 심어 보세요', tBigBuilt_home: '우리 집을 지었어요! 🏡 집을 눌러 들어가 보세요',
  tTab_house: '집', tTab_tree: '나무·꽃', tTab_deco: '장식물',
  tTabDesc_house: '집은 🏘️ 주택가 안에만 지을 수 있어요. 자리가 모자라면 맨 위 "새 주택가 조성"으로 주택가를 더 만들 수 있어요.',
  tTabDesc_tree: '묘목을 심으면 며칠에 걸쳐 자라요. 다 자라면 행복이 올라가요.',
  tTabDesc_deco: '편의시설은 행복을 올리고, 더 많은 주민을 돌볼 수 있게 해줘요(혼잡 방지).',
  tResN: '주민 {n}명', tSupN: '{n}명 돌봄', tGrowDays: '{n}일', tBusInfo: '입주 +1/일',
  tLiving: '살고 있는 주민 {n} / {c}명', tHouseHint: '행복이 높으면 빈 방에 새 주민이 이사 와요.',
  tStage0: '묘목', tStage1: '자라는 중', tStage2: '다 자람', tGrowLeft: '다 자라려면 {n}일 남았어요',
  tMove: '옮기기', tDemo: '철거', tDemoAsk: '정말 철거할까요? 🪙{c}을(를) 돌려받아요.', tMoveHere: '여기로',
  tPlaceHint: '건물을 손가락으로 끌어서 옮기세요 (지도를 눌러도 돼요)', tOut: '마을 밖이에요', tTaken: '다른 건물과 겹쳐요', tLocked: '주민 {n}명이 되면 지을 수 있어요',
  tBuiltHouse: '집을 지었어요! 🏠 주민 {n}명이 바로 이사 왔어요', tBuiltHouse0: '집을 지었어요! 🏠 마을이 행복하면 아침마다 새 주민이 이사 와요', tPlanted: '묘목을 심었어요 🌱', tBuilt: '다 지었어요! ✨', tMoved: '옮겼어요', tDemolished: '철거했어요 (🪙{c} 돌려받음)',
  tMovedIn: '새 주민 {n}명이 이사 왔어요!', tLeft: '주민 {n}명이 마을을 떠났어요… 행복 지수를 확인해 보세요', tMsReached: '주민 {n}명 달성!',
  tk_cottage: '오두막', tk_tower: '탑집', tk_family: '가족집', tk_yard: '마당집', tk_barn: '농가', tk_twostory: '2층집', tk_row: '연립주택', tk_villa: '빌라',
  tk_sunflower: '해바라기', tk_tulip: '튤립', tk_rose: '장미 덤불', tk_lavender: '라벤더', tk_daisy: '데이지 꽃밭', tk_hydrangea: '수국 덤불', tk_cosmos: '코스모스', tk_lily: '백합 꽃밭', tk_hibiscus: '무궁화·히비스커스', tk_pine: '소나무', tk_evergreen: '풍성한 상록수', tk_cherry: '벚나무', tk_maple: '단풍나무', tk_apple: '사과나무', tk_ginkgo: '은행나무', tk_peach: '복숭아나무', tk_orange: '오렌지나무', tk_willow: '수양버들', tk_palm: '야자수', tk_bamboo: '대나무 숲', tk_oaktree: '오크 나무', tk_sakuratree: '사쿠라 나무',
  tk_bench: '벤치', tk_lamp: '가로등', tk_busstop: '버스 정류장', tk_fountain: '분수', tk_playground: '놀이터', tk_fence: '나무 울타리', tk_hedge: '생울타리', tk_flowerbed: '꽃밭 화단', tk_signpost: '이정표', tk_mailbox: '우체통', tk_topiary: '토끼 정원수', tk_stonelamp: '석등', tk_flagpole: '깃발', tk_picnic: '피크닉 테이블', tk_phonebooth: '공중전화', tk_well: '우물', tk_dogstatue: '강아지 동상', tk_catstatue: '고양이 동상', tk_sandbox: '모래놀이터', tk_heartarch: '하트 아치', tk_pond: '오리 연못', tk_monument: '기념비', tk_gazebo: '정자', tk_windmill: '풍차', tk_goldstatue: '황금 펫 동상',
  tk_pet_fountain: '크리스탈 펫 분수', tk_pet_statue_hero: '충견 영웅 동상', tk_flower_tunnel: '장미 꽃터널', tk_camping_zone: '펫 글램핑 쉼터',
  tk_aquarium_center: '해양 아쿠아리움', tk_pet_themepark: '펫 테마파크 놀이공원', tk_cat_cafe: '힐링 캣카페 라운지', tk_pet_bakery: '수제 펫 베이커리',
  groomerDoneMsg: '강아지의 미용 끝났어요. 이뻐요 ✨',
  ctype_family: '가족 손님', ctype_collector: '수집가', collectorSays: 'Lv3 이상(또는 ⭐) {sp}을(를) 찾고 있어요. 값은 넉넉히 드릴게요!', collectorNo: '수집가는 Lv3 이상(또는 ⭐)인 그 품종만 원해요', familyKit: '🧺 용품 세트 +🪙{c}',
  road_cobble: '자갈길', road_asphalt: '아스팔트길', road_brick: '붉은 벽돌길', road_wood: '원목 데크길', road_marble: '대리석 산책로', road_dirt: '흙길', road_step: '디딤돌 풀길', road_pink: '벚꽃 꽃길',
  tRotLeft: '좌회전', tRotRight: '우회전', tRotateDir: '방향 회전',
  tManageShelter: '유기동물 보관소 관리하기', tManageZoo: '동물원 둘러보기·관리하기',
  stj_rec: '맞이·자동판매', stj_sellpc: '펫·용품 결제', stj_storysolve: '사연 고민 해결',
  salesGreeting1: '어서오세요! 🐾', salesGreeting2: '귀여운 아이들 보러 오세요!', salesSoldMsg: '좋은 가족 만나렴! 💛',
  stray_shiba: '길 잃은 시바견', stray_kshort: '길고양이 코숏', stray_pome: '떠돌이 포메라니안', stray_maltese: '길 잃은 말티즈', stray_persian: '길 잃은 페르시안', stray_golden: '착한 골든리트리버', stray_ragdoll: '길 잃은 랙돌', stray_default: '길동물',
  strayActionLabel: '🐾 구조하기', strayBubbleRescue: '🐾 구조해 주세요!',
  shelterAdoptToast: '🏡 주민이 유기동물 보관소에서 {name}을(를) 입양했어요! (지원금 +🪙{fee})',
  shelterAutoRescueToast: '🛖 보호소 직원 {staff}님이 길에서 떨고 있던 {icon} {name}({sp})을(를) 구조해 보호소로 데려왔어요!',
  zooEnc_savanna: '🦁 사바나 초원 존 (사자·기린·얼룩말)', zooEnc_safari: '🐘 코끼리·코뿔소 대평원', zooEnc_jungle: '🐼 판다 대나무 숲 & 원숭이 정글', zooEnc_polar: '🐧 남극 빙하 펭귄·북극곰 마을',
  zooName_savanna: '🦁 사바나 초원 존', zooSpecies_savanna: '사자 · 기린 · 얼룩말', zooDesc_savanna: '드넓은 황금빛 초원에서 백수의 왕 사자와 키다리 기린, 얼룩말이 평화롭게 노닐고 있어요.',
  zooName_safari: '🐘 대평원 오아시스 존', zooSpecies_safari: '코끼리 · 코뿔소 · 하마', zooDesc_safari: '시원한 오아시스 폭포 주변에서 코끼리 가족이 물장구를 치며 더위를 식히고 있어요.',
  zooName_jungle: '🐼 판다 대나무 숲 & 정글', zooSpecies_jungle: '자이언트 판다 · 레서판다 · 원숭이', zooDesc_jungle: '푸른 대나무 숲에서 귀여운 판다들이 대나무를 오물오물 맛있게 먹고 있어요.',
  zooName_polar: '🐧 남극 빙하 & 북극곰 마을', zooSpecies_polar: '황제펭귄 · 북극곰 · 하프물범', zooDesc_polar: '차갑고 투명한 빙하 수영장에서 펭귄들이 다이빙하며 신나게 헤엄치고 있어요.',
  zooTitle: '🦁 사파리 동물원 테마파크', zooBannerTitle: '사파리 월드 테마파크', zooBannerSub: '관람객들이 희귀 야생 동물들을 보며 행복해해요!',
  zooStatHappiness: '주민 행복도 보너스', zooStatTicket: '관람객 1인당 입장료', zooStatPending: '정산 대기 수익',
  zooCollectBtn: '🪙 입장료 정산받기 (🪙{c})', zooCollectEmpty: '🪙 정산 대기 중인 입장료 없음',
  zooEncHeader: '🌍 사파리 동물원 구역 안내', zooFedBadge: '🍖 배부름 · 행복 최고조!', zooNeedFeedBadge: '🍽️ 특식 주기 가능',
  zooFeedBtn: '🍖 특식 주기 (🪙50)', zooFedDoneBtn: '✨ 배불러요',
  zooTip: '💡 마을 주민들과 손님들이 동물원을 방문할 때마다 입장료 수익이 쌓입니다. 동물들에게 특식을 주면 더 활발하게 움직여요!',
  shelterTitle: '🛖 유기동물 보관소 (보호소)', shelterBannerTitle: '따뜻한 유기동물 보호소',
  shelterBannerSub: '전담 직원 <b>{staff}</b>님이 길 잃은 아이들을 구조하고 돌보고 있어요',
  shelterProtectedCount: '보호 중 <b>{n}</b>/12마리', shelterTotalAdopted: '누적 입양 <b>{n}</b>마리',
  shelterCareHeader: '💖 보호소 일괄 돌봄 & 직원 관리',
  shelterCareSub: '아이들을 깨끗하고 행복하게 돌봐주면 마을 주민들이 더 빨리 입양해 가요!',
  shelterFeedAll: '🍖 전체 밥주기 (🪙20)', shelterPlayAll: '🎾 전체 놀아주기', shelterCleanAll: '🧹 보호소 대청소',
  shelterRescueDispatch: '🚑 긴급 구조 출동 (🪙80) — 길 잃은 동물 즉시 구조하기',
  shelterPetsHeader: '🐾 보호 중인 아이들 ({n}마리)',
  shelterEmptyMain: '현재 보호 중인 유기동물이 없어요 🌿',
  shelterEmptySub: '길거리에 유기동물이 나타나면 직원이 자동으로 구조해 오거나, 위 버튼으로 직접 구조 출동을 보낼 수 있어요!',
  shelterRescueTag: '구조견/묘', shelterHealthyWait: '✨ 건강함 · 좋은 가족을 기다리는 중',
  shelterStatHunger: '배부름', shelterStatClean: '청결도', shelterStatHappy: '행복도',
  shelterMoveShopBtn: '🏪 가게로 데려오기', shelterAdoptNowBtn: '🏡 주민에게 입양 추천 (+🪙{fee})',
  shelterStaffDefaultName: '미소',
  strayRescueModalTitle: '🐾 길 잃은 {name} 구조하기',
  strayRescueModalText: '길에서 떨고 있는 {name}을(를) 발견했어요! 지금 바로 구조할까요?\n(유기동물 보관소가 있으면 보관소로, 없으면 가게/카페로 데려갑니다)',
  strayRescueModalOk: '🆘 구조하기',
  shelterStaffLabel: '보호소 직원 {name}',
  shelfBuyAllBtn: '모두 사기',
  penInfoCap: '최대 {n}마리', penInfoRec: '회복 ×{m}', penInfoTip: '분양가 +{p}%',
  shelterIntro: '길에서 구조하거나 SOS로 구출된 아이들이 안전하게 보호받는 곳이에요. 매일 주민들이 찾아와 아이들을 입양해 가요!',
  shelterStaffTitle: '보호소 돌봄 직원',
  shelterStaffRoleDesc: '업무: 아이들과 놀아주기, 먹이 주기, 청소 및 입양 추천',
  shelterBtnFeed: '밥 주기', shelterBtnPlay: '놀아주기', shelterBtnClean: '청소하기',
  shelterProtectedHeader: '보호 중인 유기동물 ({n}/12)',
  shelterTodayAdopt: '오늘 주민 입양: {n}/3건',
  shelterEmptyTitle: '지금은 보호 중인 아이가 없어요',
  shelterEmptyDesc: '마을 길거리의 길동물이나 SOS 구조 이벤트를 통해 도움이 필요한 아이를 구해 주세요!',
  shelterToShopBtn: '펫샵으로 데려오기',
  shelterFindFamilyBtn: '가족 찾아주기 (입양)',
  shelterFooterTip: '하루에 2~3번 주민들이 방문해 직원의 추천을 받고 아이를 입양해 갑니다.',
  zooFacName_savanna: '아프리카 사바나 초원', zooFacAnim_savanna: '사자 3 · 기린 2 · 얼룩말 2 (총 7마리)', zooFacDesc_savanna: '프라이드 록 바위 언덕과 아카시아 나무, 오아시스 연못에서 사자 가족, 기린, 얼룩말이 뛰노는 대초원',
  zooFacName_panda: '판다 대나무 생태숲', zooFacAnim_panda: '자이언트 판다 3 · 레서판다 2 (총 5마리)', zooFacDesc_panda: '전통 기와 내실과 울창한 대나무 숲, 원목 놀이터에서 판다와 레서판다가 대나무와 사과를 먹는 숲',
  zooFacName_elephant: '코끼리 · 코뿔소 대계곡', zooFacAnim_elephant: '아프리카 코끼리 2 · 흰코뿔소 2 (총 4마리)', zooFacDesc_elephant: '코로 시원하게 물줄기를 뿜는 코끼리 모자와 든든한 갑옷 피부의 흰코뿔소가 사는 진흙 오아시스',
  zooFacName_tiger: '시베리아 호랑이 · 불곰 협곡', zooFacAnim_tiger: '벵골호랑이 2 · 백호 1 · 불곰 2 (총 5마리)', zooFacDesc_tiger: '시원하게 쏟아지는 바위 폭포와 소나무 숲에서 호랑이, 백호, 불곰이 물고기와 고기를 먹는 협곡',
  zooFacName_lagoon: '열대 악어 · 하마 · 홍학 늪지', zooFacAnim_lagoon: '나일악어 2 · 하마 1 · 홍학 2 (총 5마리)', zooFacDesc_lagoon: '에메랄드빛 열대 라군과 모래섬 위에서 입을 벌리는 악어, 하마, 분홍 홍학 무리가 노니는 수변 구역',
  zooFacName_polar: '남극 펭귄 · 물범 빙하 수족관', zooFacAnim_polar: '황제펭귄 3 · 잔점박이물범 2 (총 5마리)', zooFacDesc_polar: '하얀 빙하 얼음산과 투명 아크릴 수조에서 펭귄들이 헤엄치고 물범이 비치볼 묘기를 부리는 극지관',
  zooPanelIntro: '6개의 초대형 테마 생태관과 <b>총 31마리의 야생 동물</b>이 실제 크기로 살아 움직이는 <b>그랜드 사파리 테마파크(26×22)</b>예요! 관람객과 사육사가 산책로를 따라 걸으며 동물들에게 직접 먹이를 던져줍니다.',
  zooTotalVisitors: '누적 관람객: <b>{n}명</b> · 전시 동물: <b>31마리</b>',
  zooUncollectedTickets: '미정산 입장료 수입: 🪙{c}',
  zooViewAllBtn: '동물원 한눈에 보기',
  zooSettleBtn: '정산하기',
  zooFeedAllBtn: '전체 동물 특식 주기 (모든 우리에 먹이 투척 & 관람)',
  zooFacilitiesHeader: '6대 생태 동물 우리 & 먹이 주기',
  zooFedCount: '먹이 준 횟수: <b>{n}회</b>',
  zooEatingHappy: '동물들이 신나게 먹고 있어요!',
  zooFeedOneBtn: '먹이주기',
  zooWatchBtn: '우리 구경',
  defaultCageName: '동물 우리', defaultAnimalName: '동물',
  needCageModalHeader: '우리 추가 필요',
  needCageModalTitle: '동물 우리가 부족해요!',
  needCageModalBody: '구조한 <b>{sp}</b>을(를) 맞이할 <b>{h}</b>(이)가 없습니다.<br>유기동물 보관소나 카페 놀이방이 없거나 가득 차 있으며, 가게에도 빈 우리가 없습니다.<br><br>상점의 <b>가구 탭</b>에서 우리를 구매해 가게에 배치해 주세요!',
  needCageModalBtn: '가구 상점으로 이동하기',
  managerLabel: '매니저',
  farmHarvestBubble: '{c} 수확했어!',
  salesSayRec: '{n} 추천해 드려요! 🐾',
  salesSaySold: '🎉 {n} 분양 완료!',
  salesSayStoryOk: '✨ 고민 해결해 드렸어요!',
  salesSayStoryLater: '다음에 꼭 도와드릴게요!',
  salesSayAdopt: '🐶 새 친구 {n} 데려왔어요!'
});
Object.assign(I18N.ru, {
  tTitle: 'Наш городок', tPopNow: 'Жителей', tPopCap: 'мест', tHappy: 'Счастье', tBuildBtn: 'Стройка', tRoadQuickBtn: 'Дороги', tPopN: '{n} жит.',
  tOccHint: 'При счастье {h} дома заполняются на {p}%. Чем счастливее, тем больше жителей.',
  tGrace: 'Защита новичка: до {d}-го дня никто не уезжает.', tLowWarn: 'Счастье очень низкое! Ещё {n} дн. — и жители начнут уезжать.',
  tWhyHappy: 'Из чего счастье', tBase: 'Основа', tFac: 'Удобства', tGreen: 'Деревья и цветы', tSvc: 'Обслуживание', tCrowd: 'Теснота (жителей {p} / удобства на {s})',
  tToday: 'Жалобы сегодня', tw_nomatch: 'нет нужного питомца', tw_lost: 'ушли, не дождавшись', tw_nostock: 'нет товара', tw_badmatch: 'не тот питомец', tw_cafe: 'не принесли еду', tw_hosp: 'нет мест в клинике', tw_salon: 'долго в салоне',
  tTips: 'Удобства и деревья поднимают счастье. Долгое ожидание и отсутствие нужных питомцев — снижают.',
  tEffects: 'Что город даёт зоомагазину', tEffCust: 'Частота покупателей', tEffMax: 'Покупателей сразу', tEffSpend: 'Щедрость',
  tMilestones: 'Открывается по числу жителей', tLog: 'Новости городка', tLogIn: 'въехало {n}', tLogOut: 'уехало {n}',
  tc_family: '👨‍👩‍👧 семьи', tc_collector: '🧐 коллекционеры', tc_rich: '💎 больше богачей', tc_celeb: '🌟 больше звёзд',
  tZoneName: 'Жилой квартал', tZoneNew: 'Новый жилой квартал', tZoneDesc: 'Место под 10 домов (с улочкой). Свободных участков сейчас: {f}', tZoneBuilt: 'Новый квартал готов! 🏘️ Стройте дома',
  tNeedZone: 'Дома строятся только в жилом квартале 🏘️', tZoneFull: 'В кварталах нет свободных участков! Постройте новый квартал →', tOnLane: 'На улочке строить нельзя', tInZone: 'В жилом квартале — только дома, деревья и мелкие удобства', tZoneHint: '🏘️ Жители живут в квартале на западе. Дома стройте там!',
  tRoadTool: 'Дорожки', tRoadDesc: 'Прокладывайте дорожки сами. Клетка 🪙{c}, убрать — бесплатно', tRoadStart: 'Начать', tRoadHint1: 'Нажмите клетку начала', tRoadHint2: 'Нажмите клетку конца — дорожка ляжет между ними (углом)', tRoadDesc2: 'клетка 🪙{c}', tRoadPave: 'Класть', tRoadErase: 'Убирать', tRoadNone: 'Нечего менять (не на зданиях и не на улице)', tRoadPaved: 'Проложено клеток: {n} (🪙{c})', tRoadErased: 'Убрано клеток: {n}',
  priceHint: '🪙 — базовая цена для этого гостя; идеальное совпадение характера +30%.', tOnPath: 'На дорожке строить нельзя', tZoneGo: 'К жилому кварталу', regSadT: '{n} ушёл(ла) немного расстроенным… 😢', tUpBtn: 'Улучшить', tLvMax: 'макс. уровень', tUpHouse: 'больше комнат: до {n} жителей', tUpCivic: 'счастье, забота и бонус ×{m}', tUpgraded: 'Улучшено! ⭐ Ур.{n}',
  tTab_civic: 'Город', tTabDesc_civic: 'Пекарня, школа, пожарная часть и большие участки вроде парка, озера, памятной площади, аллеи, беседки, мельницы, кемпинга. Сильно поднимают счастье, и у каждого здания свой бонус.',
  tTab_ops: 'Хозяйство', tTabDesc_ops: 'Мой дом, ферма, ранчо, кафе, ветклиника, груминг-салон, зоопарк — ключевые объекты, которыми вы управляете сами. Стройте, где захотите!',
  tk_gate: 'Въездная арка', tk_conv: 'Магазинчик', tk_bakery: 'Пекарня', tk_florist: 'Цветочный', tk_clinic: 'Поликлиника', tk_dogpark: 'Площадка для собак', tk_photo: 'Фотостудия', tk_school: 'Школа', tk_police: 'Полиция', tk_fire: 'Пожарная часть',
  tk_library: 'Библиотека', tk_market: 'Блошиный рынок', tk_training: 'Школа дрессировки', tk_pethotel: 'Отель для питомцев', tk_clocktower: 'Часовая башня', tk_lookout: 'Смотровая башня', tk_chapel: 'Свадебная часовня', tk_shelter: 'Приют для животных', tk_zoo: 'Сафари-зоопарк',
  rescuedShelter: '🆘 Спасено! {name} благополучно доставлен(а) в приют 🛖🐾', rescuedCafe: '🆘 Спасено! {name} благополучно доставлен(а) в игровую комнату кафе ☕🐾',
  strayCaughtShelter: '🐾 Найденный на улице {name} спасён и доставлен в приют!', strayCaughtCafe: '🐾 Найденный на улице {name} спасён и доставлен в кафе!', strayCaughtShop: '🐾 Найденный на улице {name} спасён и помещён в вольер магазина!',
  shelterFed: '🍖 Животные в приюте сытно накормлены!', shelterPlayed: '🎾 Вы весело поиграли с животными в приюте!', shelterCleaned: '🧹 В приюте наведена идеальная чистота!',
  shelterMovedToShop: '🏪 {name} переведён(а) в вольер зоомагазина!', shelterAdoptedManual: '🏡 {name} обрёл(а) тёплую новую семью! (Субсидия 🪙{fee})',
  zooFed: '🍖 Вы покормили диких животных! Они очень рады ✨', zooTicketCollected: '🪙 Выручка за билеты в зоопарк получена: 🪙{c}!',
  needHouseModal: 'Не хватает вольеров для приёма животных! Купите вольеры во вкладке мебели магазина.',
  tfx_spend2: 'щедрость покупателей +2%', tfx_spend3: 'щедрость покупателей +3%', tfx_green: 'предел счастья от сада +4', tfx_movein: '+2 новосёла в день', tfx_thief: 'воры почти не приходят', tfx_stay: 'уезжают вдвое меньше', tfx_collector: 'больше коллекционеров', tfx_rich: 'больше богатых гостей', tfx_shelter: 'спасение бездомных животных и пристройство жителям', tfx_zoo: 'доход от билетов посетителей зоопарка (🪙+50)',
  tUseBuildMenu: '🏗️ Выберите место в меню стройки', tTab_big: 'Большие', tTabDesc_big: 'Ферма, свой дом, кафе, клиника... Стройте, где захотите! (участок — под самый большой размер)',
  tk_farm: 'Ферма', tk_ranch: 'Ранчо', tBigDesc_ranch: 'Коровы и свиньи: молоко и мясо (с 8 уровня)', tk_home: 'Мой дом', tk_cafe: 'Кафе с питомцами', tk_hosp: 'Ветклиника', tk_salon: 'Груминг-салон', tk_park: 'Парк', tk_lake: 'Озеро', tk_monu: 'Памятная площадь', tk_avenue: 'Аллея',
  tBigDesc_farm: 'Поле + лавка семян + место для курятника. Урожай — для кафе', tBigDesc_home: 'Наш дом с питомцами. Расставляйте мебель', tBigDesc_cafe: 'Гости едят и играют с питомцами', tBigDesc_hosp: 'Лечим больных питомцев',
  tBigDesc_salon: 'Стрижём питомцев гостей', tBigDesc_park: 'Большой парк с фонтаном и площадкой (счастье +10)', tBigDesc_lake: 'Лебеди, мостик, рыбалка (счастье +8)', tBigDesc_monu: 'Статуя двоих и надпись (счастье +5)', tBigDesc_avenue: 'Деревья вдоль главной улицы (счастье +6)',
  tLotSize: 'участок {w}×{d}', tAlongStreet: 'Высаживается вдоль главной улицы', tBuiltMark: 'построено', tNeedRep: 'Откроется на уровне репутации {t}', tMoveClosed: 'Здания с посетителями можно переносить только после закрытия',
  tNeedHome: 'Сначала постройте «Мой дом» в меню стройки 🏡', tNotBuiltYet: '{b} ещё нет. Постройте в меню стройки, где захотите!', tBigBuilt_farm: 'Ферма готова! 🌾 Купите семена в лавке и посадите', tBigBuilt_home: 'Дом построен! 🏡 Нажмите на него, чтобы войти',
  tTab_house: 'Дома', tTab_tree: 'Сад', tTab_deco: 'Украшения',
  tTabDesc_house: 'Дома строятся только в 🏘️ жилом квартале. Не хватает места — постройте «Новый жилой квартал» (вверху списка).',
  tTabDesc_tree: 'Саженцы растут несколько дней. Взрослые деревья делают город счастливее.',
  tTabDesc_deco: 'Удобства поднимают счастье и позволяют обслуживать больше жителей (без тесноты).',
  tResN: '{n} жит.', tSupN: 'на {n} жит.', tGrowDays: '{n} дн.', tBusInfo: '+1 новосёл/день',
  tLiving: 'Живут {n} из {c}', tHouseHint: 'Если город счастлив, в свободные комнаты въедут новые жители.',
  tStage0: 'Саженец', tStage1: 'Растёт', tStage2: 'Выросло', tGrowLeft: 'Вырастет через {n} дн.',
  tMove: 'Переместить', tDemo: 'Снести', tDemoAsk: 'Точно снести? Вернётся 🪙{c}.', tMoveHere: 'Сюда',
  tPlaceHint: 'Перетащите здание пальцем (или нажмите на карту)', tOut: 'За пределами города', tTaken: 'Место занято', tLocked: 'Откроется при {n} жителях',
  tBuiltHouse: 'Дом построен! 🏠 Сразу въехало: {n}', tBuiltHouse0: 'Дом построен! 🏠 Если город счастлив, жители въедут по утрам', tPlanted: 'Саженец посажен 🌱', tBuilt: 'Построено! ✨', tMoved: 'Перемещено', tDemolished: 'Снесено (вернули 🪙{c})',
  tMovedIn: 'Въехали новые жители: {n}!', tLeft: 'Уехали жители: {n}… Проверьте счастье города', tMsReached: 'В городе {n} жителей!',
  tk_cottage: 'Хижина', tk_tower: 'Домик с башней', tk_family: 'Семейный дом', tk_yard: 'Дом с двором', tk_barn: 'Фермерский дом', tk_twostory: 'Двухэтажный дом', tk_row: 'Таунхаусы', tk_villa: 'Многоэтажка',
  tk_sunflower: 'Подсолнухи', tk_tulip: 'Тюльпаны', tk_rose: 'Розовый куст', tk_lavender: 'Лаванда', tk_daisy: 'Ромашки', tk_hydrangea: 'Гортензия', tk_cosmos: 'Космея', tk_lily: 'Лилии', tk_hibiscus: 'Гибискус', tk_pine: 'Сосна', tk_evergreen: 'Пышное вечнозеленое дерево', tk_cherry: 'Сакура', tk_maple: 'Клён', tk_apple: 'Яблоня', tk_ginkgo: 'Гинкго', tk_peach: 'Персиковое дерево', tk_orange: 'Апельсиновое дерево', tk_willow: 'Плакучая ива', tk_palm: 'Пальма', tk_bamboo: 'Бамбук', tk_oaktree: 'Дуб', tk_sakuratree: 'Дерево сакуры',
  tk_bench: 'Скамейка', tk_lamp: 'Фонарь', tk_busstop: 'Остановка', tk_fountain: 'Фонтан', tk_playground: 'Детская площадка', tk_fence: 'Забор', tk_hedge: 'Живая изгородь', tk_flowerbed: 'Клумба', tk_signpost: 'Указатель', tk_mailbox: 'Почтовый ящик', tk_topiary: 'Фигурный куст', tk_stonelamp: 'Каменный фонарь', tk_flagpole: 'Флаг', tk_picnic: 'Стол для пикника', tk_phonebooth: 'Телефонная будка', tk_well: 'Колодец', tk_dogstatue: 'Статуя собаки', tk_catstatue: 'Статуя кошки', tk_sandbox: 'Песочница', tk_heartarch: 'Арка-сердце', tk_pond: 'Утиный пруд', tk_monument: 'Обелиск', tk_gazebo: 'Беседка', tk_windmill: 'Мельница', tk_goldstatue: 'Золотая статуя',
  tk_pet_fountain: 'Кристальный фонтан', tk_pet_statue_hero: 'Памятник верному псу', tk_flower_tunnel: 'Цветочная арка', tk_camping_zone: 'Глэмпинг для питомцев',
  tk_aquarium_center: 'Морской океанариум', tk_pet_themepark: 'Тематический парк развлечений', tk_cat_cafe: 'Котокафе', tk_pet_bakery: 'Пекарня лакомств',
  groomerDoneMsg: 'Стрижка собачки завершена! Такая красота ✨',
  ctype_family: 'Семья', ctype_collector: 'Коллекционер', collectorSays: 'Ищу {sp} ур.3+ (или ⭐). Заплачу щедро!', collectorNo: 'Коллекционеру нужна только эта порода ур.3+ (или ⭐)', familyKit: '🧺 Набор для питомца +🪙{c}',
  road_cobble: 'Брусчатка', road_asphalt: 'Асфальт', road_brick: 'Кирпичная дорожка', road_wood: 'Деревянный настил', road_marble: 'Мраморная дорожка', road_dirt: 'Грунтовая тропа', road_step: 'Ступени на траве', road_pink: 'Сакура (розовая)',
  tRotLeft: 'Влево', tRotRight: 'Вправо', tRotateDir: 'Повернуть',
  tManageShelter: 'Управление приютом', tManageZoo: 'Обзор и управление зоопарком',
  stj_rec: 'Встреча и автопродажа', stj_sellpc: 'Оплата питомцев и товаров', stj_storysolve: 'Помощь с особыми историями',
  salesGreeting1: 'Добро пожаловать! 🐾', salesGreeting2: 'Посмотрите на наших милашек!', salesSoldMsg: 'Счастливой жизни в новой семье! 💛',
  stray_shiba: 'Потерявшийся сиба-ину', stray_kshort: 'Уличный котёнок', stray_pome: 'Бродячий шпиц', stray_maltese: 'Потерявшаяся мальтийская болонка', stray_persian: 'Потерявшийся персидский кот', stray_golden: 'Добрый золотистый ретривер', stray_ragdoll: 'Потерявшийся рэгдолл', stray_default: 'Бездомный питомец',
  strayActionLabel: '🐾 Спасти', strayBubbleRescue: '🐾 Спасите меня!',
  shelterAdoptToast: '🏡 Житель города приютил {name} из приюта! (Субсидия +🪙{fee})',
  shelterAutoRescueToast: '🛖 Сотрудник приюта {staff} спас дрожащего на улице {icon} {name} ({sp}) и привёл в приют!',
  zooEnc_savanna: '🦁 Саванна (львы, жирафы, зебры)', zooEnc_safari: '🐘 Равнина слонов и носорогов', zooEnc_jungle: '🐼 Бамбуковый лес панд и джунгли обезьян', zooEnc_polar: '🐧 Ледник пингвинов и белых медведей',
  zooName_savanna: '🦁 Зона саванны', zooSpecies_savanna: 'Лев · Жираф · Зебра', zooDesc_savanna: 'На просторах золотой саванны мирно гуляют царь зверей лев, высокие жирафы и полосатые зебры.',
  zooName_safari: '🐘 Оазис великой равнины', zooSpecies_safari: 'Слон · Носорог · Бегемот', zooDesc_safari: 'У прохладного водопада оазиса семья слонов плещется в воде, спасаясь от жары.',
  zooName_jungle: '🐼 Бамбуковый лес панд и джунгли', zooSpecies_jungle: 'Большая панда · Красная панда · Обезьяна', zooDesc_jungle: 'В зелёной бамбуковой роще милые панды с аппетитом хрустят свежим бамбуком.',
  zooName_polar: '🐧 Антарктический ледник и деревня белых медведей', zooSpecies_polar: 'Императорский пингвин · Белый медведь · Гренландский тюлень', zooDesc_polar: 'В холодном прозрачном ледниковом бассейне пингвины весело ныряют и плавают.',
  zooTitle: '🦁 Тематический сафари-зоопарк', zooBannerTitle: 'Сафари-парк', zooBannerSub: 'Посетители в восторге от редких диких животных!',
  zooStatHappiness: 'Бонус к счастью жителей', zooStatTicket: 'Билет с посетителя', zooStatPending: 'Ожидает получения',
  zooCollectBtn: '🪙 Забрать выручку за билеты (🪙{c})', zooCollectEmpty: '🪙 Нет выручки для получения',
  zooEncHeader: '🌍 Зоны сафари-зоопарка', zooFedBadge: '🍖 Сыты · Максимальное счастье!', zooNeedFeedBadge: '🍽️ Можно покормить лакомством',
  zooFeedBtn: '🍖 Дать лакомство (🪙50)', zooFedDoneBtn: '✨ Уже сыты',
  zooTip: '💡 Каждый раз, когда жители и гости посещают зоопарк, копится выручка за билеты. Лакомства делают животных ещё активнее!',
  shelterTitle: '🛖 Приют для бездомных животных', shelterBannerTitle: 'Тёплый приют для животных',
  shelterBannerSub: 'Сотрудник <b>{staff}</b> спасает потерявшихся животных и заботится о них',
  shelterProtectedCount: 'В приюте <b>{n}</b>/12', shelterTotalAdopted: 'Всего пристроено: <b>{n}</b>',
  shelterCareHeader: '💖 Общий уход и работа приюта',
  shelterCareSub: 'Если животные чистые и счастливые, жители города быстрее забирают их в семью!',
  shelterFeedAll: '🍖 Покормить всех (🪙20)', shelterPlayAll: '🎾 Поиграть со всеми', shelterCleanAll: '🧹 Генеральная уборка',
  shelterRescueDispatch: '🚑 Выезд спасателей (🪙80) — сразу спасти бездомное животное',
  shelterPetsHeader: '🐾 Подопечные приюта ({n})',
  shelterEmptyMain: 'Сейчас в приюте нет бездомных животных 🌿',
  shelterEmptySub: 'Когда на улице появится бездомное животное, сотрудник спасёт его автоматически, или вы можете отправить спасателей кнопкой выше!',
  shelterRescueTag: 'Спасён', shelterHealthyWait: '✨ Здоров(а) · Ждёт добрую семью',
  shelterStatHunger: 'Сытость', shelterStatClean: 'Чистота', shelterStatHappy: 'Счастье',
  shelterMoveShopBtn: '🏪 В зоомагазин', shelterAdoptNowBtn: '🏡 Рекомендовать жителям (+🪙{fee})',
  shelterStaffDefaultName: 'Мисо',
  strayRescueModalTitle: '🐾 Спасти: {name}',
  strayRescueModalText: 'Вы нашли дрожащего на улице питомца ({name})! Спасти его прямо сейчас?\n(Если построен приют — отправится туда, иначе в магазин или кафе)',
  strayRescueModalOk: '🆘 Спасти',
  shelterStaffLabel: 'Сотрудник приюта {name}',
  shelfBuyAllBtn: 'Купить всё',
  penInfoCap: 'макс. {n}', penInfoRec: 'восст. ×{m}', penInfoTip: 'цена +{p}%',
  shelterIntro: 'Здесь в безопасности живут питомцы, спасённые на улице или по сигналу SOS. Каждый день жители города приходят сюда и забирают их в семью!',
  shelterStaffTitle: 'Сотрудник приюта',
  shelterStaffRoleDesc: 'Обязанности: игры с питомцами, кормление, уборка и подбор семьи',
  shelterBtnFeed: 'Покормить', shelterBtnPlay: 'Поиграть', shelterBtnClean: 'Убрать',
  shelterProtectedHeader: 'Питомцы в приюте ({n}/12)',
  shelterTodayAdopt: 'Пристроено сегодня: {n}/3',
  shelterEmptyTitle: 'Сейчас в приюте никого нет',
  shelterEmptyDesc: 'Спасайте потерявшихся животных на улицах города или в событиях SOS!',
  shelterToShopBtn: 'В зоомагазин',
  shelterFindFamilyBtn: 'Найти семью (пристроить)',
  shelterFooterTip: '2–3 раза в день жители приходят в приют и по рекомендации сотрудника забирают питомцев.',
  zooFacName_savanna: 'Африканская саванна', zooFacAnim_savanna: 'Львы 3 · Жирафы 2 · Зебры 2 (всего 7)', zooFacDesc_savanna: 'Просторная саванна со скалой Прайда, акациями и оазисом, где гуляют семья львов, жирафы и зебры',
  zooFacName_panda: 'Бамбуковый лес панд', zooFacAnim_panda: 'Большие панды 3 · Красные панды 2 (всего 5)', zooFacDesc_panda: 'Густая бамбуковая роща с деревянной площадкой, где большие и малые панды лакомятся бамбуком и яблоками',
  zooFacName_elephant: 'Долина слонов и носорогов', zooFacAnim_elephant: 'Африканские слоны 2 · Белые носороги 2 (всего 4)', zooFacDesc_elephant: 'Оазис с водопадом, где слониха со слонёнком пускают фонтанчики хоботом рядом с могучими носорогами',
  zooFacName_tiger: 'Каньон тигров и бурых медведей', zooFacAnim_tiger: 'Бенгальские тигры 2 · Белый тигр 1 · Медведи 2 (всего 5)', zooFacDesc_tiger: 'Скалистый каньон с водопадом и сосновым лесом, где тигры и медведи ловят рыбу и отдыхают',
  zooFacName_lagoon: 'Тропическая лагуна крокодилов, бегемотов и фламинго', zooFacAnim_lagoon: 'Крокодилы 2 · Бегемот 1 · Фламинго 2 (всего 5)', zooFacDesc_lagoon: 'Изумрудная лагуна с песчаным островом, где греются крокодилы, плавает бегемот и гуляют розовые фламинго',
  zooFacName_polar: 'Ледниковый аквариум пингвинов и тюленей', zooFacAnim_polar: 'Императорские пингвины 3 · Тюлени 2 (всего 5)', zooFacDesc_polar: 'Белоснежные льдины и прозрачный бассейн, где ныряют пингвины, а тюлени играют с мячом',
  zooPanelIntro: '<b>Гранд Сафари-парк (26×22)</b> с 6 огромными эко-зонами и <b>31 диким животным</b> в натуральную величину! Посетители и смотрители гуляют по дорожкам и угощают животных.',
  zooTotalVisitors: 'Всего гостей: <b>{n}</b> · Животных: <b>31</b>',
  zooUncollectedTickets: 'Выручка за билеты: 🪙{c}',
  zooViewAllBtn: 'Обзор зоопарка',
  zooSettleBtn: 'Забрать выручку',
  zooFeedAllBtn: 'Накормить всех животных лакомством (угощение и осмотр)',
  zooFacilitiesHeader: '6 эко-вольер и кормление',
  zooFedCount: 'Покормлено раз: <b>{n}</b>',
  zooEatingHappy: 'Животные с удовольствием едят!',
  zooFeedOneBtn: 'Покормить',
  zooWatchBtn: 'Смотреть',
  defaultCageName: 'Вольер', defaultAnimalName: 'питомца',
  needCageModalHeader: 'Нужен вольер',
  needCageModalTitle: 'Не хватает вольеров!',
  needCageModalBody: 'Нет свободного места (<b>{h}</b>), чтобы принять спасённого питомца (<b>{sp}</b>).<br>Приют или игровая зона кафе не построены или заполнены, а в магазине нет свободных вольеров.<br><br>Купите вольер во <b>вкладке мебели</b> магазина и поставьте его!',
  needCageModalBtn: 'Перейти в магазин мебели',
  managerLabel: 'Менеджер',
  farmHarvestBubble: 'Собрано: {c}!',
  salesSayRec: 'Рекомендую: {n}! 🐾',
  salesSaySold: '🎉 {n} обрёл новую семью!',
  salesSayStoryOk: '✨ Проблема гостя решена!',
  salesSayStoryLater: 'В следующий раз обязательно поможем!',
  salesSayAdopt: '🐶 Новый друг {n} теперь у нас!'
});
