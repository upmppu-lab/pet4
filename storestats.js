// storestats.js - Daily Store Visitor Count & Revenue Ledger System
// Manages daily visitor counts (일일 손님수) and earnings (돈번거/수익) across all shops and facilities.
(function() {
  const DEFS = [
    // 운영 상점 / 주요 시설
    { id: 'shop', name: '펫샵 본점', ru: 'Главный зоомагазин', icon: '🏪', cat: 'main', desc: '반려동물 분양, 사료 및 용품 판매, 호텔 위탁', checkBuilt: () => true },
    { id: 'cafe', name: '힐링 펫 카페', ru: 'Кафе для питомцев', icon: '☕', cat: 'main', desc: '음료와 디저트, 펫 전용 수제 간식 판매', checkBuilt: s => !!(s && s.cafe && s.cafe.built) },
    { id: 'hosp', name: '동물병원', ru: 'Ветеринарная клиника', icon: '🏥', cat: 'main', desc: '반려동물 건강검진, 치료 및 정밀 수술', checkBuilt: s => !!(s && s.hosp && s.hosp.built) },
    { id: 'salon', name: '펫 미용실', ru: 'Груминг-салон', icon: '✂️', cat: 'main', desc: '목욕, 털 손질 및 스페셜 스타일링', checkBuilt: s => !!(s && s.salon && s.salon.built) },
    { id: 'farm', name: '농장 직판장', ru: 'Фермерская лавка', icon: '🌾', cat: 'main', desc: '직접 수확한 신선한 농작물과 달걀 판매', checkBuilt: () => true },
    { id: 'ranch', name: '마을 목장', ru: 'Городское ранчо', icon: '🐄', cat: 'main', desc: '신선한 우유, 양모, 송로버섯 생산 판매', checkBuilt: s => !!(s && s.ranch) },
    
    // 마을 관광 및 공공/상업 시설
    { id: 'zoo', name: '마을 동물원', ru: 'Городской зоопарк', icon: '🦁', cat: 'town', desc: '사파리 관람객 입장료 및 먹이주기 체험', checkBuilt: s => hasTownObj(s, 'zoo') },
    { id: 'lake', name: '호수 낚시터', ru: 'Рыбалка на озере', icon: '🎣', cat: 'town', desc: '호수 낚시터 체험 및 희귀 어종 매점', checkBuilt: s => !!(s && s.village && s.village.lake) },
    { id: 'conv', name: '마을 편의점', ru: 'Магазинчик', icon: '🏪', cat: 'civic', desc: '주민 일상 생필품 및 간식 판매', checkBuilt: s => hasTownObj(s, 'conv') },
    { id: 'bakery', name: '동네 베이커리', ru: 'Пекарня', icon: '🥐', cat: 'civic', desc: '갓 구운 빵과 크루아상 판매', checkBuilt: s => hasTownObj(s, 'bakery') },
    { id: 'pet_bakery', name: '수제 펫 베이커리', ru: 'Пекарня лакомств', icon: '🧁', cat: 'civic', desc: '반려동물 전용 수제 컵케이크 & 쿠키', checkBuilt: s => hasTownObj(s, 'pet_bakery') },
    { id: 'florist', name: '마을 꽃집', ru: 'Цветочный магазин', icon: '💐', cat: 'civic', desc: '싱그러운 꽃다발과 화분 판매', checkBuilt: s => hasTownObj(s, 'florist') },
    { id: 'market', name: '마을 플리마켓', ru: 'Рынок', icon: '🛒', cat: 'civic', desc: '주민 직거래 장터 및 특산품 부스', checkBuilt: s => hasTownObj(s, 'market') },
    { id: 'aquarium_center', name: '해양 아쿠아리움', ru: 'Океанариум', icon: '🐬', cat: 'civic', desc: '신비로운 바다 생물 관람 및 굿즈 샵', checkBuilt: s => hasTownObj(s, 'aquarium_center') },
    { id: 'pet_themepark', name: '펫 테마파크', ru: 'Парк аттракционов', icon: '🎡', cat: 'civic', desc: '놀이기구 이용권 및 캐릭터 스토어', checkBuilt: s => hasTownObj(s, 'pet_themepark') },
    { id: 'cat_cafe', name: '힐링 캣카페', ru: 'Котокафе', icon: '🐱', cat: 'civic', desc: '고양이 교감 체험 및 라운지 음료', checkBuilt: s => hasTownObj(s, 'cat_cafe') },
    { id: 'pethotel', name: '마을 펫호텔', ru: 'Отель для питомцев', icon: '🏨', cat: 'civic', desc: '반려동물 최고급 숙박 및 케어 서비스', checkBuilt: s => hasTownObj(s, 'pethotel') },
    { id: 'photo', name: '마을 사진관', ru: 'Фотостудия', icon: '📷', cat: 'civic', desc: '주민 & 반려동물 기념사진 촬영 스튜디오', checkBuilt: s => hasTownObj(s, 'photo') },
    { id: 'clinic', name: '동네 의원', ru: 'Поликлиника', icon: '🩺', cat: 'civic', desc: '주민 건강 상담 및 보건 진료', checkBuilt: s => hasTownObj(s, 'clinic') }
  ];

  function hasTownObj(s, key) {
    if (!s || !s.town || !s.town.objs) return false;
    return s.town.objs.some(o => o && o.k === key);
  }

  function ensure(s) {
    if (!s) return null;
    const day = (s.clock && s.clock.day) || 1;
    if (!s.storeDaily) {
      s.storeDaily = {
        day: day,
        today: {},
        yesterday: {},
        history: []
      };
    }
    if (s.storeDaily.day !== day) {
      // Day transition
      if (s.storeDaily.today && Object.keys(s.storeDaily.today).length > 0) {
        s.storeDaily.yesterday = JSON.parse(JSON.stringify(s.storeDaily.today));
        s.storeDaily.yesterday.day = s.storeDaily.day;
        if (!s.storeDaily.history) s.storeDaily.history = [];
        s.storeDaily.history.unshift(s.storeDaily.yesterday);
        if (s.storeDaily.history.length > 7) s.storeDaily.history.pop();
      }
      s.storeDaily.day = day;
      s.storeDaily.today = {};
    }
    return s.storeDaily;
  }

  function record(s, storeKey, coins, visitors, note) {
    if (!s) return;
    const d = ensure(s);
    if (!d) return;
    const entry = d.today[storeKey] = d.today[storeKey] || { visitors: 0, revenue: 0, details: [] };
    if (visitors) entry.visitors = (entry.visitors || 0) + visitors;
    if (coins) entry.revenue = (entry.revenue || 0) + coins;
    if (note) {
      if (!entry.details) entry.details = [];
      entry.details.unshift(note);
      if (entry.details.length > 10) entry.details.pop();
    }
  }

  function updateTownShops(s) {
    if (!s || !s.clock) return;
    const d = ensure(s);
    if (!d) return;

    // 1. Sync Pet Shop with s.today
    if (s.today) {
      const sh = d.today.shop = d.today.shop || { visitors: 0, revenue: 0, details: [] };
      sh.visitors = Math.max(sh.visitors || 0, s.today.served || 0);
      sh.revenue = Math.max(sh.revenue || 0, s.today.earned || 0);
      const noteParts = [];
      if (s.today.sold) noteParts.push('분양 ' + s.today.sold + '건');
      if (s.today.tips) noteParts.push('팁 +' + s.today.tips + '🪙');
      if (noteParts.length) sh.details = [noteParts.join(', ')];
    }

    // 2. Town Civic & Commercial Shop background visitors & revenues based on town population and clock
    const m = s.clock.m || 720;
    const pop = (typeof TOWN !== 'undefined' && typeof TOWN.pop === 'function') ? TOWN.pop(s) : (s.town && s.town.residents ? s.town.residents.length : 12);
    const hap = (s.town && s.town.hap) || 75;
    const progress = Math.max(0.12, Math.min(1.0, (m - 420) / (20 * 60 - 420))); // daytime 7:00 ~ 20:00

    const civicConfigs = {
      conv: { baseCust: 6, spend: 85, var: 25, unit: '생필품·간식 구매' },
      bakery: { baseCust: 8, spend: 120, var: 35, unit: '크루아상·바게트 판매' },
      pet_bakery: { baseCust: 5, spend: 180, var: 45, unit: '수제 펫 간식·케이크' },
      florist: { baseCust: 4, spend: 140, var: 30, unit: '꽃다발·화분 판매' },
      market: { baseCust: 10, spend: 130, var: 40, unit: '플리마켓 물품 거래' },
      aquarium_center: { baseCust: 15, spend: 280, var: 60, unit: '수족관 입장 및 굿즈' },
      pet_themepark: { baseCust: 20, spend: 340, var: 80, unit: '테마파크 티켓·팝콘' },
      cat_cafe: { baseCust: 7, spend: 210, var: 50, unit: '캣카페 라운지 이용' },
      zoo: { baseCust: 18, spend: 320, var: 70, unit: '동물원 입장 및 먹이체험' },
      lake: { baseCust: 6, spend: 140, var: 30, unit: '호수 낚시터 이용' },
      pethotel: { baseCust: 3, spend: 380, var: 80, unit: '반려동물 호텔링 케어' },
      photo: { baseCust: 4, spend: 290, var: 60, unit: '가족·펫 사진 촬영' },
      clinic: { baseCust: 5, spend: 190, var: 40, unit: '주민 보건 및 건강상담' }
    };

    for (const [k, cfg] of Object.entries(civicConfigs)) {
      const isBuilt = (k === 'lake') ? !!(s.village && s.village.lake) : hasTownObj(s, k);
      if (!isBuilt) continue;
      const targetCust = Math.max(1, Math.round(cfg.baseCust * (0.6 + pop / 35) * (hap / 70)));
      const curCust = Math.round(targetCust * progress);
      const seedVal = Math.sin((s.clock.day * 17 + k.charCodeAt(0)) % 100);
      const curRev = Math.max(0, Math.round(curCust * (cfg.spend + seedVal * cfg.var)));

      const entry = d.today[k] = d.today[k] || { visitors: 0, revenue: 0, details: [] };
      entry.visitors = Math.max(entry.visitors || 0, curCust);
      entry.revenue = Math.max(entry.revenue || 0, curRev);
      entry.details = [cfg.unit + ' (' + entry.visitors + '건)'];
    }
  }

  function getRecordsForView(s, isYesterday) {
    ensure(s);
    updateTownShops(s);
    const d = s.storeDaily;
    const source = isYesterday ? (d.yesterday || {}) : (d.today || {});
    const targetDay = isYesterday ? (d.yesterday.day || Math.max(1, d.day - 1)) : d.day;

    const list = [];
    let totalVisitors = 0;
    let totalRevenue = 0;
    let builtCount = 0;

    for (const def of DEFS) {
      const built = def.checkBuilt(s);
      if (built) builtCount++;

      const rec = source[def.id] || { visitors: 0, revenue: 0, details: [] };
      const visitors = built ? (rec.visitors || 0) : 0;
      const revenue = built ? (rec.revenue || 0) : 0;

      if (built) {
        totalVisitors += visitors;
        totalRevenue += revenue;
      }

      list.push({
        id: def.id,
        name: (typeof CFG !== 'undefined' && CFG.lang === 'ru') ? def.ru : def.name,
        icon: def.icon,
        cat: def.cat,
        desc: def.desc,
        built: built,
        visitors: visitors,
        revenue: revenue,
        details: rec.details || []
      });
    }

    // Sort: built stores first, ordered by revenue descending
    list.sort((a, b) => {
      if (a.built !== b.built) return b.built ? 1 : -1;
      return b.revenue - a.revenue;
    });

    const topStore = list.find(x => x.built && x.revenue > 0) || (list.find(x => x.built) || list[0]);

    return {
      day: targetDay,
      isYesterday: !!isYesterday,
      totalVisitors,
      totalRevenue,
      builtCount,
      topStore,
      stores: list
    };
  }

  function renderPanelHTML(tab) {
    if (typeof S === 'undefined' || !S) return '<div class="m">로딩 중...</div>';
    const isYesterday = tab === 'yesterday';
    const data = getRecordsForView(S, isYesterday);
    const isRu = (typeof CFG !== 'undefined' && CFG.lang === 'ru');

    const fmtNum = n => (typeof fmt === 'function') ? fmt(n) : Number(n).toLocaleString();

    let h = `
      <div class="store-report-header">
        <div class="store-report-title-row">
          <div class="store-report-day-badge">📅 ${data.day}${isRu ? ' день' : '일차'} ${isYesterday ? (isRu ? '(Вчера)' : '(어제 마감)') : (isRu ? '(Сегодня)' : '(오늘 진행 중)')}</div>
          <div class="store-report-time-sub">⏰ ${S.clock ? Math.floor(S.clock.m / 60) + ':' + String(S.clock.m % 60).padStart(2, '0') : ''}</div>
        </div>

        <div class="store-report-tabs">
          <button class="store-tab-btn ${!isYesterday ? 'on' : ''}" data-a="storereporttab" data-v="today">
            ${isRu ? '☀️ Сегодня (Текущий)' : '☀️ 오늘 기록 (진행 중)'}
          </button>
          <button class="store-tab-btn ${isYesterday ? 'on' : ''}" data-a="storereporttab" data-v="yesterday">
            ${isRu ? '🌙 Вчера (Итоги)' : '🌙 어제 결산 (마감 기록)'}
          </button>
        </div>

        <div class="store-report-kpi-grid">
          <div class="store-kpi-card">
            <div class="kpi-icon">👥</div>
            <div class="kpi-content">
              <div class="kpi-val">${fmtNum(data.totalVisitors)}<small>${isRu ? ' чел.' : '명'}</small></div>
              <div class="kpi-lbl">${isRu ? 'Всего гостей' : '총 일일 손님 수'}</div>
            </div>
          </div>
          <div class="store-kpi-card highlight">
            <div class="kpi-icon">🪙</div>
            <div class="kpi-content">
              <div class="kpi-val">${fmtNum(data.totalRevenue)}</div>
              <div class="kpi-lbl">${isRu ? 'Общий доход' : '총 일일 번 돈'}</div>
            </div>
          </div>
          <div class="store-kpi-card">
            <div class="kpi-icon">🏪</div>
            <div class="kpi-content">
              <div class="kpi-val">${data.builtCount}<small>${isRu ? ' шт.' : '개소'}</small></div>
              <div class="kpi-lbl">${isRu ? 'Открыто магазинов' : '운영 중인 상점'}</div>
            </div>
          </div>
        </div>

        ${data.topStore && data.topStore.revenue > 0 ? `
          <div class="store-top-crown-card">
            <span class="crown-icon">👑</span>
            <span class="crown-label">${isRu ? 'Лидер по выручке:' : '오늘 최고 매출 상점:'}</span>
            <b>${data.topStore.icon} ${data.topStore.name}</b>
            <span class="crown-amount">(🪙 ${fmtNum(data.topStore.revenue)})</span>
          </div>
        ` : ''}
      </div>

      <div class="store-list-container">
        <div class="store-list-sec-title">
          <span>${isRu ? '🏪 Список магазинов и заведений' : '🏪 상점별 손님 수 및 수익 내역'}</span>
          <small>${isRu ? 'Обновляется в реальном времени' : '실시간 집계'}</small>
        </div>
    `;

    for (const st of data.stores) {
      const isBuilt = st.built;
      const statusBadge = isBuilt
        ? `<span class="store-status-badge open">${isRu ? '🟢 Открыто' : '🟢 운영 중'}</span>`
        : `<span class="store-status-badge closed">${isRu ? '🔒 Не построено' : '🔒 미건설'}</span>`;

      h += `
        <div class="store-item-card ${isBuilt ? '' : 'unbuilt'}">
          <div class="store-item-top">
            <div class="store-item-icon-box">${st.icon}</div>
            <div class="store-item-info">
              <div class="store-item-name-row">
                <span class="store-name">${st.name}</span>
                ${statusBadge}
              </div>
              <div class="store-item-desc">${st.desc}</div>
            </div>
          </div>

          <div class="store-item-metrics">
            <div class="metric-cell">
              <span class="m-label">👥 ${isRu ? 'Посетители:' : '일일 손님수'}</span>
              <b class="m-val ${st.visitors > 0 ? 'active' : ''}">${isBuilt ? (fmtNum(st.visitors) + (isRu ? ' чел.' : '명')) : '-'}</b>
            </div>
            <div class="metric-cell">
              <span class="m-label">🪙 ${isRu ? 'Доход:' : '일일 번 돈'}</span>
              <b class="m-val gold ${st.revenue > 0 ? 'active' : ''}">${isBuilt ? ('🪙 ' + fmtNum(st.revenue)) : '-'}</b>
            </div>
          </div>

          ${st.details && st.details.length && isBuilt ? `
            <div class="store-item-note">
              <i>📝</i> ${st.details[0]}
            </div>
          ` : ''}

          ${!isBuilt ? `
            <div class="store-unbuilt-hint">
              <span>${isRu ? 'Можно построить через меню строительства' : '건설 메뉴(🏗️)에서 건축 후 영업을 시작할 수 있습니다'}</span>
              <button class="btn sm o" data-a="open" data-v="tbuild" data-w="${st.cat === 'civic' ? 'civic' : 'ops'}">${isRu ? 'Построить' : '건설하기'}</button>
            </div>
          ` : ''}
        </div>
      `;
    }

    h += `</div>`;
    return h;
  }

  // Expose global methods
  window.STORE_STATS = {
    DEFS,
    ensure,
    record,
    updateTownShops,
    getRecordsForView,
    renderPanelHTML
  };
})();
