// ================= Pet Battle: tap a villager walking the street to challenge their pet =================
// Design (2026-10-15): tap-once auto-battle (no manual move picking). Trigger is tapping a villager actor in
// town who owns a pet (not a passive random encounter). Reward is pet battle level/EXP, NOT coins (keeps the
// "non-monetary pet goal" direction discussed earlier). Losing tires the pet out for a while.
// Extra risk/reward: winning has a chance to recruit the villager's pet into the player's home roster;
// losing has a (smaller) chance that the villager takes one of the player's pets instead.
//
// New fields added to a home pet (S.home.pets[i]): blv (battle level, starts 1), bxp (battle exp),
// tiredUntil (real-world Date.now() ms; pet can't battle again until this passes, but can still follow/walk).
// These are separate from the existing care/growth p.lv / p.exp, which stay untouched.

const BATTLE_CAT = { // base stats at battle level 1, by SPECIES[].cat
  dog: { hp: 30, atk: 7, heal: 3 },
  cat: { hp: 26, atk: 6, heal: 4 },
  small: { hp: 22, atk: 5, heal: 6 },
  bird: { hp: 20, atk: 6, heal: 5 },
  reptile: { hp: 34, atk: 5, heal: 3 },
};
const BATTLE_CAT_DEF = { hp: 24, atk: 6, heal: 4 }; // fallback (e.g. fish -- though fish can't follow anyway)
const BATTLE_STEAL_WIN = .25;  // win: chance to recruit the villager's pet
const BATTLE_STEAL_LOSE = .15; // lose: chance the villager takes one of your pets instead
const BATTLE_TIRED_MS = 12 * 60 * 1000; // 12 real-world minutes of rest after a loss

// each species category has its own skill "tree": a basic skill from battle level 1, and a stronger
// version that unlocks at a higher battle level (lv). Every category's skills are distinct -- no two
// categories share the same names/icons -- and the AI always uses the strongest unlocked skill of the
// kind it needs (heal when hurt, otherwise attack).
const BATTLE_SKILLS = {
  dog: {
    atk: [
      { id: 'bite', lv: 1, name: '물어뜯기', icon: '🦷', mult: 1.0 },
      { id: 'tackle', lv: 4, name: '돌진 태클', icon: '💥', mult: 1.35, crit: .1 },
    ],
    heal: [
      { id: 'lick', lv: 2, name: '신난 핥기', icon: '💗', mult: 1.0 },
      { id: 'howl', lv: 6, name: '충성의 하울링', icon: '✨', mult: 1.6 },
    ],
  },
  cat: {
    atk: [
      { id: 'scratch', lv: 1, name: '할퀴기', icon: '🐾', mult: 1.0 },
      { id: 'pounce', lv: 4, name: '그림자 덮치기', icon: '🌙', mult: 1.3, crit: .15 },
    ],
    heal: [
      { id: 'groom', lv: 2, name: '그루밍', icon: '🧼', mult: 1.0 },
      { id: 'purr', lv: 6, name: '골골 집중', icon: '💞', mult: 1.6 },
    ],
  },
  small: {
    atk: [
      { id: 'nibble', lv: 1, name: '갉아먹기', icon: '🐹', mult: 1.0 },
      { id: 'roll', lv: 4, name: '데굴데굴 박치기', icon: '🌀', mult: 1.3, crit: .1 },
    ],
    heal: [
      { id: 'fluff', lv: 2, name: '포근한 털고르기', icon: '🧶', mult: 1.0 },
      { id: 'seed', lv: 6, name: '해바라기씨 충전', icon: '🌻', mult: 1.6 },
    ],
  },
  bird: {
    atk: [
      { id: 'peck', lv: 1, name: '부리 쪼기', icon: '🪶', mult: 1.0 },
      { id: 'windflap', lv: 4, name: '돌풍 날갯짓', icon: '🌪️', mult: 1.3, crit: .1 },
    ],
    heal: [
      { id: 'preen', lv: 2, name: '깃털 다듬기', icon: '🕊️', mult: 1.0 },
      { id: 'song', lv: 6, name: '지저귐 세레나데', icon: '🎵', mult: 1.6 },
    ],
  },
  reptile: {
    atk: [
      { id: 'tailwhip', lv: 1, name: '꼬리치기', icon: '🦎', mult: 1.0 },
      { id: 'chomp', lv: 4, name: '꽉 물기', icon: '🐊', mult: 1.35, crit: .1 },
    ],
    heal: [
      { id: 'sunbathe', lv: 2, name: '일광욕', icon: '☀️', mult: 1.0 },
      { id: 'molt', lv: 6, name: '허물벗기 재생', icon: '✨', mult: 1.6 },
    ],
  },
};
const BATTLE_SKILLS_DEF = BATTLE_SKILLS.small;

const BATTLE = (() => {
  const needXp = lv => 12 + (lv - 1) * 9;

  function statOf(sp, blv) {
    const cat = (SPECIES[sp] && SPECIES[sp].cat) || 'small';
    const base = BATTLE_CAT[cat] || BATTLE_CAT_DEF;
    const n = Math.max(1, blv || 1);
    return {
      hp: Math.round(base.hp + (n - 1) * 5),
      atk: Math.round((base.atk + (n - 1) * 1.1) * 10) / 10,
      heal: Math.round((base.heal + (n - 1) * .8) * 10) / 10,
    };
  }

  const tiredLeft = p => (p && p.tiredUntil) ? Math.max(0, p.tiredUntil - Date.now()) : 0;

  // the strongest atk skill and strongest unlocked heal skill (if any) for a pet at this battle level
  function skillsOf(sp, blv) {
    const cat = (SPECIES[sp] && SPECIES[sp].cat) || 'small';
    const set = BATTLE_SKILLS[cat] || BATTLE_SKILLS_DEF;
    const n = Math.max(1, blv || 1);
    const atk = set.atk.filter(s => n >= s.lv).sort((a, b) => b.lv - a.lv)[0] || set.atk[0];
    const heal = set.heal.filter(s => n >= s.lv).sort((a, b) => b.lv - a.lv)[0] || null;
    return { atk, heal };
  }

  function simulate(myP, foe) {
    const myBlv = myP.blv || 1, foeBlv = Math.max(1, myBlv + Math.floor(Math.random() * 3) - 1);
    const A = statOf(myP.sp, myBlv), B = statOf(foe.sp, foeBlv);
    const skA = skillsOf(myP.sp, myBlv), skB = skillsOf(foe.sp, foeBlv);
    let hpA = A.hp, hpB = B.hp, cdA = 0, cdB = 0;
    const log = [{ t: 'start', hpA, hpB }];
    let turn = 0, side = 0; // 0 = my pet acts, 1 = foe acts
    while (hpA > 0 && hpB > 0 && turn < 24) {
      turn++;
      const stat = side === 0 ? A : B, sk = side === 0 ? skA : skB;
      const myHp = side === 0 ? hpA : hpB, myMax = side === 0 ? A.hp : B.hp, cd = side === 0 ? cdA : cdB;
      if (myHp / myMax < .4 && sk.heal && cd <= 0) {
        const h = Math.round(stat.heal * 2.2 * sk.heal.mult);
        if (side === 0) { hpA = Math.min(A.hp, hpA + h); cdA = 3; } else { hpB = Math.min(B.hp, hpB + h); cdB = 3; }
        log.push({ t: 'heal', side, amt: h, hpA, hpB, skill: { name: sk.heal.name, icon: sk.heal.icon } });
      } else {
        const skill = sk.atk;
        const crit = Math.random() < .15 + (skill.crit || 0);
        const dmg = Math.round(stat.atk * skill.mult * (.85 + Math.random() * .3) * (crit ? 1.6 : 1));
        if (side === 0) hpB = Math.max(0, hpB - dmg); else hpA = Math.max(0, hpA - dmg);
        log.push({ t: 'atk', side, amt: dmg, crit, hpA, hpB, skill: { name: skill.name, icon: skill.icon } });
      }
      cdA = Math.max(0, cdA - 1); cdB = Math.max(0, cdB - 1);
      side = 1 - side;
    }
    return { log, win: hpA > hpB, foeBlv, maxA: A.hp, maxB: B.hp };
  }

  function apply(s, a, by) {
    if (a.t === 'battleChallenge') { // tapped a villager on the street -- challenge their pet to a fight
      if (s.battle && s.battle.active) return { err: 'battleBusy' };
      const who = (typeof CFG !== 'undefined' && CFG && CFG.id) || (s.follow && Object.keys(s.follow)[0]);
      const pid = who && s.follow && s.follow[who];
      const p = pid && s.home && (s.home.pets || []).find(q => q.id === pid);
      if (!p) return { err: 'battleNeedFollow' };
      if (tiredLeft(p) > 0) return { err: 'battleTiredErr' };
      const T = TOWN.ensure(s), res = (T.residents || []).find(x => x.id === a.rid);
      if (!res || !res.pets || !res.pets.length) return { err: 'battleNoPet', p: { n: (res && res.name) || '' } };
      let idx = -1; if (a.spHint) idx = res.pets.findIndex(x => x.sp === a.spHint);
      if (idx < 0) idx = Math.floor(Math.random() * res.pets.length);
      const fp = res.pets[idx];
      s.battle = { active: true, pid: p.id, foe: { rid: res.id, idx, ownerName: res.name, sp: fp.sp, name: fp.name, coat: fp.coat || 1 }, started: false, resolved: false };
      return { ok: 1 };
    }
    if (a.t === 'battleStart') {
      const b = s.battle; if (!b || !b.active) return { err: 'gone' };
      const p = s.home && (s.home.pets || []).find(q => q.id === b.pid); if (!p) { s.battle = null; return { err: 'gone' }; }
      const res = simulate(p, b.foe);
      b.log = res.log; b.win = res.win; b.foeBlv = res.foeBlv; b.maxA = res.maxA; b.maxB = res.maxB; b.started = true;
      return { ok: 1 };
    }
    if (a.t === 'battleFinish') {
      const b = s.battle; if (!b || !b.started || b.resolved) return undefined;
      b.resolved = true;
      const p = s.home && (s.home.pets || []).find(q => q.id === b.pid);
      if (!p) return { ok: 1 };
      const T = TOWN.ensure(s), resident = (T.residents || []).find(r => r.id === b.foe.rid);
      if (b.win) {
        p.blv = p.blv || 1; p.bxp = (p.bxp || 0) + (6 + b.foeBlv * 3);
        let lvup = 0;
        while (p.bxp >= needXp(p.blv)) { p.bxp -= needXp(p.blv); p.blv++; lvup++; }
        b.lvup = lvup; b.blvAfter = p.blv; b.stolen = null;
        if (resident && resident.pets && resident.pets[b.foe.idx] && resident.pets[b.foe.idx].sp === b.foe.sp && resident.pets[b.foe.idx].name === b.foe.name) {
          const cap = (typeof HOME_LV !== 'undefined' && HOME_LV[s.home.lv]) ? HOME_LV[s.home.lv].pets : 99;
          if (Math.random() < BATTLE_STEAL_WIN && (s.home.pets || []).length < cap) {
            const taken = resident.pets.splice(b.foe.idx, 1)[0];
            const np = { id: 'p' + Date.now() + Math.floor(Math.random() * 1000), sp: taken.sp, name: taken.name,
              sex: Math.random() < .5 ? 'm' : 'f', coat: taken.coat || 1, gen: 0, grow: 1, hunger: 70, clean: 90, happy: 70, stress: 20, bored: 30,
              trait: (typeof randTrait === 'function') ? randTrait() : undefined, bcd: 0, pat: 0, stars: 0, blv: 1, bxp: 0 };
            s.home.pets.push(np); b.stolen = np.name;
            resident.happy = Math.max(0, (resident.happy || 70) - 12);
          }
        }
      } else {
        p.tiredUntil = Date.now() + BATTLE_TIRED_MS;
        b.lost = null;
        if (resident && !p.fav && (s.home.pets || []).length > 1 && Math.random() < BATTLE_STEAL_LOSE) {
          const idx = s.home.pets.findIndex(q => q.id === p.id);
          if (idx >= 0) {
            const taken = s.home.pets.splice(idx, 1)[0];
            resident.pets = resident.pets || [];
            resident.pets.push({ sp: taken.sp, name: taken.name, coat: taken.coat || 1, day: (s.clock && s.clock.day) || 1 });
            resident.happy = Math.min(100, (resident.happy || 70) + 8);
            if (s.follow) for (const k in s.follow) if (s.follow[k] === taken.id) delete s.follow[k];
            b.lost = taken.name;
          }
        }
      }
      return { ok: 1 };
    }
    if (a.t === 'battleClose') { s.battle = null; return { ok: 1 }; }
    return undefined;
  }

  return { apply, statOf, tiredLeft, needXp };
})();

Object.assign(I18N.ko, {
  battleAppear: '🐾 {o}님의 {p}이(가) 나타났어요!',
  battleRiskNote: '이기면 경험치를 얻고, 운이 좋으면 상대 펫을 데려올 수도 있어요. 지면 펫이 지쳐서 쉬어야 하고, 운이 나쁘면 펫을 빼앗길 수도 있어요.',
  battleStartBtn: '⚔️ 전투 시작', battleIgnoreBtn: '🚶 그냥 지나가기',
  battleTitle: '⚔️ 펫 대결', battleSkipBtn: '⏭ 빠르게 보기', battleCloseBtn: '확인',
  battleStepStart: '전투 시작!',
  battleStepAtkMe: '{n}의 {s}! -{d}', battleStepAtkFoe: '{n}의 {s}! -{d}',
  battleStepCrit: ' 💥 크리티컬!',
  battleStepHealMe: '{n}의 {s}! +{d}', battleStepHealFoe: '{n}의 {s}! +{d}',
  battleWinTitle: '🎉 승리했어요!', battleLoseTitle: '😿 패배했어요...',
  battleXpGain: '경험치 +{n}', battleLvUp: '레벨 업! Lv.{n}',
  battleTiredMsg: '전투로 지쳐서 당분간 쉬어야 해요',
  battleStolenMsg: '🏠✨ {o}님의 {n}을(를) 데려왔어요!',
  battleLostMsg: '😱 {n}을(를) {o}님에게 빼앗겼어요!',
  battleTiredBadge: '😴 쉬는 중 ({n}분)',
  battleNeedFollow: '펫을 데리고 다녀야 도전할 수 있어요 🐾',
  battleTiredErr: '내 펫이 지쳐서 아직 쉬고 있어요 😴',
  battleBusy: '이미 다른 전투가 진행 중이에요',
  battleNoPet: '{n}님은 키우는 펫이 없어요',
  battleChallengeBtn: '⚔️ 전투 신청',
});
Object.assign(I18N.ru, {
  battleAppear: '🐾 Появился питомец {o} — {p}!',
  battleRiskNote: 'Победа даёт опыт, а иногда и питомца соперника. Поражение утомляет питомца (нужен отдых), а иногда он достаётся сопернику.',
  battleStartBtn: '⚔️ В бой', battleIgnoreBtn: '🚶 Пройти мимо',
  battleTitle: '⚔️ Битва питомцев', battleSkipBtn: '⏭ Быстро', battleCloseBtn: 'Ок',
  battleStepStart: 'Бой начался!',
  battleStepAtkMe: '{n}: {s}! -{d}', battleStepAtkFoe: '{n}: {s}! -{d}',
  battleStepCrit: ' 💥 Крит!',
  battleStepHealMe: '{n}: {s}! +{d}', battleStepHealFoe: '{n}: {s}! +{d}',
  battleWinTitle: '🎉 Победа!', battleLoseTitle: '😿 Поражение...',
  battleXpGain: 'Опыт +{n}', battleLvUp: 'Новый уровень! Ур.{n}',
  battleTiredMsg: 'Питомец устал от боя и должен отдохнуть',
  battleStolenMsg: '🏠✨ Забрали питомца {o} — {n}!',
  battleLostMsg: '😱 {o} забрал питомца {n}!',
  battleTiredBadge: '😴 Отдыхает ({n} мин)',
  battleNeedFollow: 'Чтобы бросить вызов, возьмите питомца с собой 🐾',
  battleTiredErr: 'Ваш питомец ещё отдыхает после боя 😴',
  battleBusy: 'Бой уже идёт',
  battleNoPet: 'У жителя {n} нет питомцев',
  battleChallengeBtn: '⚔️ Вызвать на бой',
});
