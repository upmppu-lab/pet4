// ================= Online orders: HUD chip, panel, events =================
function onlineChip() {
  const n = (S.online || []).length; if (!n) return '';
  const inF = !App.editing && World.me && typeof inFarm === 'function' && inFarm(Math.floor(World.me.x), Math.floor(World.me.y), S.room.w, S.room.h);
  return `<button class="onlinebar ${inF ? 'up' : ''}" data-a="gopc">💻 ${t('onlineOrders')} <b>${n}</b></button>`;
}
PANELS.online = () => {
  const list = S.online || [], hasStaff = Object.keys(S.staff || {}).some(k => staffRoleOf(k) === 'online'), hasPC = S.items.some(i => PC_ITEMS.includes(i.k));
  let h = `<div class="m">${t('onlineDesc')}</div>${!hasPC ? `<div class="card" style="padding:6px 10px;border-color:#e0604e">🖥️ ${t('needPC')}</div>` : ''}${hasStaff ? `<div class="card" style="padding:6px 10px">💻 ${t('onlineStaffOn')}</div>` : `<div class="card" style="padding:6px 10px">💡 ${t('onlineStaffHint')} <button class="btn b sm" data-a="open" data-v="staff">👥 ${t('staffShort')}</button></div>`}`;
  if (!list.length) return frameHTML('💻 ' + t('onlineTitle'), h + `<div class="card center"><div style="font-size:34px">📭</div><div class="m">${t('onlineEmpty')}</div></div>`);
  for (const c of list) {
    const lk = ART.randomHuman(c.seed || c.id), timer = bar(c.pat / c.max * 100, 'linear-gradient(#c9b6f0,#8a6fb5)', '⏳ ' + fmtT(c.pat));
    h += `<div class="card"><div class="row"><div style="width:48px;height:48px;flex:none;border-radius:12px;overflow:hidden;background:#f3e3c7"><img src="${PIC.head(lk)}" style="width:48px;height:48px"></div><div class="grow"><div class="t">@${esc(c.name)} ${c.type && c.type !== 'normal' ? `<span class="tag2 ${c.type}">${t('ctype_' + c.type)}</span>` : ''}</div>`;
    if (c.st === 'oshop') {
      const pr = PRODUCTS.find(x => x.id === c.prod) || { icon: '🛍️' }, st = S.items.find(i => i.inv ? (i.inv[c.prod] || 0) > 0 : i.prod === c.prod && i.stock > 0);
      h += `<div class="m">🛒 ${pr.icon} ${t('pr_' + c.prod)} ×${c.n}</div>${timer}</div></div><div class="row" style="margin-top:6px"><button class="btn o sm grow ${st ? '' : 'dis'}" data-a="oship" data-v="${c.id}">📦 ${st ? t('onlineShip') : t('onlineNoStock')}</button><button class="btn g sm" data-a="odecline" data-v="${c.id}">✕</button></div></div>`;
    } else {
      const need = NEEDS.find(n => n.id === c.need);
      const say = c.type === 'breeder' ? t('breederSays') : (need ? (CFG.lang === 'ru' ? need.ru : need.ko) : t('anyPet')) + (c.cat || c.sp ? ' (' + (c.sp ? spName(c.sp) : t('f_' + c.cat)) + ')' : '');
      const cands = S.pets.filter(p => p && G.matches(c, p)).map(p => [p, G.matchKind(c, p)]).sort((a, b) => ({ great: 0, ok: 1, bad: 2 }[a[1]] - { great: 0, ok: 1, bad: 2 }[b[1]]));
      h += `<div class="m">🐾 ${esc(say)}</div>${timer}</div></div>`;
      h += cands.length ? cands.slice(0, 4).map(([p, mk]) => `<div class="li"><div class="ic"><img src="${PIC.my(p)}"></div><div class="grow"><div class="t">${esc(p.name)} <span class="m">Lv${p.lv || 1}</span> ${mk === 'great' ? '💯' : mk === 'bad' ? '😕' : '🙂'}</div><div class="m">${esc(spName(p.sp))} · 🪙${fmt(Math.round(G.price(S, p, c) * (mk === 'great' ? 1.3 : mk === 'bad' ? .9 : 1) * .95))}</div></div><button class="btn o sm" data-a="osell" data-v="${p.id}" data-w="${c.id}">🚚 ${t('onlineSend')}</button></div>`).join('')
        : `<div class="m" style="margin-top:4px">🤷 ${t('onlineNoPet')}</div>`;
      h += `<div class="row" style="margin-top:4px"><span class="grow"></span><button class="btn g sm" data-a="odecline" data-v="${c.id}">✕ ${t('onlineDecline')}</button></div></div>`;
    }
  }
  return frameHTML('💻 ' + t('onlineTitle'), h);
};
Object.assign(XACT, {
  gopc: () => { const pc = App.scene !== 'home' && S.items.find(i => PC_ITEMS.includes(i.k)); if (pc) { World.walkNear(pc.x, pc.y + 1, () => openPanel({ type: 'online' })); toast('🖥️ ' + t('toPC')); } else openPanel({ type: 'online' }); },
  osell: (v, w) => { act({ t: 'osell', pid: v, cid: +w }); renderPanel(true); },
  oship: v => { act({ t: 'oship', cid: +v }); renderPanel(true); },
  odecline: v => { act({ t: 'odecline', cid: +v }); renderPanel(true); },
});
Object.assign(XEV, {
  online: e => { SND.pop(); toast('💻 ' + t('onlineNew', { n: e.name })); },
  onlineLost: e => toast('⌛ ' + t('onlineLostT', { n: e.name })),
});
(() => { const s = document.createElement('style'); s.textContent = '.onlinebar{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(104px + env(safe-area-inset-bottom));background:#8a6fb5;color:#fff;font-size:12px;font-weight:800;border-radius:14px;padding:6px 14px;z-index:35;border:2px solid #fff;box-shadow:0 3px 8px rgba(0,0,0,.25);transition:bottom .2s ease}.onlinebar.up,body:has(.hotbar) .onlinebar,#ui:has(.hotbar) .onlinebar,.hotbar ~ .onlinebar{bottom:calc(156px + env(safe-area-inset-bottom))}.onlinebar b{background:#fff;color:#8a6fb5;border-radius:8px;padding:0 6px;margin-left:4px}'; document.head.appendChild(s); })();
Object.assign(I18N.ko, {
  onlineOrders: '온라인 주문', onlineTitle: '온라인 주문', onlineDesc: '가게에 오지 않고 온라인으로 주문한 손님들이에요. 아이를 골라 보내거나 상품을 택배로 보내요 (배송비 5% 차감). 시간이 지나면 주문이 취소돼요.',
  onlineStaffOn: '온라인 매니저가 주문을 자동으로 처리하고 있어요', onlineStaffHint: '온라인 매니저를 고용하면 자동으로 처리해요', onlineEmpty: '지금은 주문이 없어요', onlineShip: '택배 보내기', onlineNoStock: '진열대 재고 없음', onlineSend: '분양 보내기', onlineNoPet: '조건에 맞는 아이가 없어요', onlineDecline: '거절',
  onlineNew: '@{n}님의 온라인 주문이 들어왔어요!', onlineLostT: '@{n}님의 온라인 주문이 취소됐어요', onlineSold: '🚚 {name}(이)가 @{who}님 집으로 출발! 🪙{c}', onlineShipped: '📦 @{who}님께 택배 발송! 🪙{c}', onlineNoStock2: '재고가 없어요',
  role_online: '온라인 매니저', roleD_online: '온라인 주문을 확인하고 아이 분양·상품 택배를 자동으로 보내요', roleL_online: 'Lv{lv}: Lv3부터 딱 맞지 않는 아이도 골라 보내요', stj_online: '온라인 주문 처리',
});
Object.assign(I18N.ru, {
  onlineOrders: 'Онлайн-заказы', onlineTitle: 'Онлайн-заказы', onlineDesc: 'Эти покупатели заказали онлайн. Отправьте питомца или товар (доставка −5%). Со временем заказ отменяется.',
  onlineStaffOn: 'Онлайн-менеджер обрабатывает заказы сам', onlineStaffHint: 'Наймите онлайн-менеджера для автообработки', onlineEmpty: 'Заказов пока нет', onlineShip: 'Отправить', onlineNoStock: 'Нет на полке', onlineSend: 'Отправить', onlineNoPet: 'Нет подходящих питомцев', onlineDecline: 'Отказать',
  onlineNew: 'Новый онлайн-заказ от @{n}!', onlineLostT: 'Заказ @{n} отменён', onlineSold: '🚚 {name} едет к @{who}! 🪙{c}', onlineShipped: '📦 Посылка для @{who}! 🪙{c}', onlineNoStock2: 'Нет товара',
  role_online: 'Онлайн-менеджер', roleD_online: 'Сам отправляет питомцев и товары по онлайн-заказам', roleL_online: 'Ур.{lv}: с 3 ур. отправляет и неидеальные варианты', stj_online: 'онлайн-заказ',
});
I18N.ko.onlineNoStock = I18N.ko.onlineNoStock; 
Object.assign(I18N.ko, { d_x_pcdesk: '컴퓨터 책상', needPC: '온라인 매니저는 컴퓨터 책상(또는 노트북 책상)에서 일해요. 인테리어 → 가구에서 컴퓨터 책상을 놓아 주세요. 책상 1개에 직원 1명이 일할 수 있어요', toPC: '컴퓨터 앞으로 가요', roleD_online: '컴퓨터 책상에 앉아 온라인 주문을 처리해요 (책상 1개당 1명)' });
Object.assign(I18N.ru, { d_x_pcdesk: 'Компьютерный стол', needPC: 'Онлайн-менеджеру нужен компьютерный стол (или стол с ноутбуком). Один стол — один сотрудник', toPC: 'Иду к компьютеру', roleD_online: 'Работает за компьютером с онлайн-заказами (1 стол — 1 сотрудник)' });
if (typeof render === 'function' && typeof S !== 'undefined' && S) { try { render(); } catch (e) {} }
