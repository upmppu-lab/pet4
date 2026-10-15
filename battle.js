// ================= Pet Battle: tap a villager walking the street to challenge their pet =================
// Design (2026-10-15): tap-once auto-battle (no manual move picking). Trigger is tapping a villager actor in
// town who owns a pet (not a passive random encounter). Reward is pet battle level/EXP, NOT coins (keeps the
// "non-monetary pet goal" direction discussed earlier).
// Extra risk/reward: winning has a chance to recruit the villager's pet into the player's home roster;
// losing has a (smaller) chance that the villager takes one of the player's pets instead.
//
// New fields added to a home pet (S.home.pets[i]): blv (battle level, starts 1), bxp (battle exp),
// hpFrac (0..1 fraction of max battle HP currently "recovered" -- null/undefined means full),
// hpSetAt (real-world Date.now() ms when hpFrac was last set, for the regen calc).
// These are separate from the existing care/growth p.lv / p.exp, which stay untouched.
// v2026-10-15 (v2): losing used to flat-out block the pet from battling again for 12 minutes
// (tiredUntil). Per feedback ("완전히 전투를 쉬게 하는건 좋지 않은것 같아"), a loss now instead drops the
// pet to effectively 1 HP and lets it regenerate back to full over real time -- the pet CAN immediately
// fight again, it's just risky until it heals up, rather than being locked out entirely.

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
const BATTLE_REGEN_MS = 10 * 60 * 1000; // 10 real-world minutes to fully regenerate HP after being knocked down to 1

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

  // current fraction (0..1) of max battle HP a pet has recovered since it was last knocked down to 1 --
  // 1 (full) if it's never been reduced, or it's had long enough to fully regenerate since.
  function hpFracOf(p) {
    if (!p || p.hpFrac == null || p.hpFrac >= 1) return 1;
    const elapsed = Date.now() - (p.hpSetAt || 0);
    return Math.min(1, p.hpFrac + elapsed / BATTLE_REGEN_MS);
  }

  // the strongest atk skill and strongest unlocked heal skill (if any) for a pet at this battle level
  // (used for the AI side, and as the "자동" one-tap option for the player's own pet)
  function skillsOf(sp, blv) {
    const cat = (SPECIES[sp] && SPECIES[sp].cat) || 'small';
    const set = BATTLE_SKILLS[cat] || BATTLE_SKILLS_DEF;
    const n = Math.max(1, blv || 1);
    const atk = set.atk.filter(s => n >= s.lv).sort((a, b) => b.lv - a.lv)[0] || set.atk[0];
    const heal = set.heal.filter(s => n >= s.lv).sort((a, b) => b.lv - a.lv)[0] || null;
    return { atk, heal };
  }

  // 2026-10-15 (v2): the full skill tree for a pet's species category, every skill marked whether it's
  // unlocked yet at the pet's current battle level -- so the player can SEE every skill (and the battle
  // level it unlocks at), not just whichever one the AI happens to be using that turn.
  function skillTreeOf(sp, blv) {
    const cat = (SPECIES[sp] && SPECIES[sp].cat) || 'small';
    const set = BATTLE_SKILLS[cat] || BATTLE_SKILLS_DEF;
    const n = Math.max(1, blv || 1);
    const mark = (arr, kind) => arr.map(s => Object.assign({ kind, unlocked: n >= s.lv }, s));
    return { cat, atk: mark(set.atk, 'atk'), heal: mark(set.heal, 'heal') };
  }

  // look up one specific skill by id among a pet's (possibly locked) skills -- used when the player
  // taps a skill to use it themselves, so we can tell "no such skill" apart from "not unlocked yet"
  function findSkill(sp, blv, id) {
    const tree = skillTreeOf(sp, blv);
    for (const kind of ['atk', 'heal']) { const s = tree[kind].find(x => x.id === id); if (s) return s; }
    return null;
  }

  function resolveAction(stat, skill) {
    if (skill.kind === 'heal') {
      const amt = Math.round(stat.heal * 2.2 * skill.mult);
      return { t: 'heal', amt, skill: { name: skill.name, icon: skill.icon } };
    }
    const crit = Math.random() < .15 + (skill.crit || 0);
    const amt = Math.round(stat.atk * skill.mult * (.85 + Math.random() * .3) * (crit ? 1.6 : 1));
    return { t: 'atk', amt, crit, skill: { name: skill.name, icon: skill.icon } };
  }

  // one side's AI-picked action (used for the foe every turn, and for the player's pet when they tap "자동")
  function aiChoice(sp, blv, hp, maxHp, cd) {
    const sk = skillsOf(sp, blv);
    if (hp / maxHp < .4 && sk.heal && cd <= 0) return sk.heal;
    return sk.atk;
  }

  // applies my pet's chosen skill, then (if the fight isn't over) the foe's auto-picked reply --
  // i.e. one full "round". Mutates b (hpA/hpB/cdA/cdB/log/side/turn) and sets b.win once it's over.
  function resolveRound(s, b, myP, chosenSkill) {
    const A = statOf(myP.sp, myP.blv || 1), B = statOf(b.foe.sp, b.foeBlv);
    const act = resolveAction(A, chosenSkill);
    if (chosenSkill.kind === 'heal') { b.hpA = Math.min(b.maxA, b.hpA + act.amt); b.cdA = 3; }
    else { b.hpB = Math.max(0, b.hpB - act.amt); }
    b.log.push(Object.assign({ side: 0, hpA: b.hpA, hpB: b.hpB }, act));
    b.cdA = Math.max(0, b.cdA - 1); b.cdB = Math.max(0, b.cdB - 1); b.turn = (b.turn || 0) + 1;
    if (b.hpB <= 0 || b.hpA <= 0 || b.turn >= 24) { b.side = -1; b.win = b.hpA > b.hpB; return; }
    const foeSkill = aiChoice(b.foe.sp, b.foeBlv, b.hpB, b.maxB, b.cdB);
    const fact = resolveAction(B, foeSkill);
    if (foeSkill.kind === 'heal') { b.hpB = Math.min(b.maxB, b.hpB + fact.amt); b.cdB = 3; }
    else { b.hpA = Math.max(0, b.hpA - fact.amt); }
    b.log.push(Object.assign({ side: 1, hpA: b.hpA, hpB: b.hpB }, fact));
    b.cdA = Math.max(0, b.cdA - 1); b.cdB = Math.max(0, b.cdB - 1); b.turn = (b.turn || 0) + 1;
    if (b.hpB <= 0 || b.hpA <= 0 || b.turn >= 24) { b.side = -1; b.win = b.hpA > b.hpB; return; }
    b.side = 0; // back to the player's turn
  }

  function apply(s, a, by) {
    if (a.t === 'battleChallenge') { // tapped a villager on the street -- challenge their pet to a fight
      if (s.battle && s.battle.active) return { err: 'battleBusy' };
      const who = (typeof CFG !== 'undefined' && CFG && CFG.id) || (s.follow && Object.keys(s.follow)[0]);
      const pid = who && s.follow && s.follow[who];
      const p = pid && s.home && (s.home.pets || []).find(q => q.id === pid);
      if (!p) return { err: 'battleNeedFollow' };
      const T = TOWN.ensure(s), res = (T.residents || []).find(x => x.id === a.rid);
      if (!res || !res.pets || !res.pets.length) return { err: 'battleNoPet', p: { n: (res && res.name) || '' } };
      let idx = -1; if (a.spHint) idx = res.pets.findIndex(x => x.sp === a.spHint);
      if (idx < 0) idx = Math.floor(Math.random() * res.pets.length);
      const fp = res.pets[idx];
      s.battle = { active: true, pid: p.id, foe: { rid: res.id, idx, ownerName: res.name, sp: fp.sp, name: fp.name, coat: fp.coat || 1 }, started: false, resolved: false };
      return { ok: 1 };
    }
    if (a.t === 'battleStart') { // v2: no more precomputed full fight -- just set up the first turn and wait for the player to pick a skill
      const b = s.battle; if (!b || !b.active) return { err: 'gone' };
      const p = s.home && (s.home.pets || []).find(q => q.id === b.pid); if (!p) { s.battle = null; return { err: 'gone' }; }
      const myBlv = p.blv || 1, foeBlv = Math.max(1, myBlv + Math.floor(Math.random() * 3) - 1);
      const A = statOf(p.sp, myBlv), B = statOf(b.foe.sp, foeBlv);
      // v2: start at however much HP the pet has currently regenerated back to (see hpFracOf) rather
      // than always full -- a pet that was just knocked down to 1 HP walks into its next fight weak.
      const startHp = Math.max(1, Math.round(A.hp * hpFracOf(p)));
      b.foeBlv = foeBlv; b.maxA = A.hp; b.maxB = B.hp; b.hpA = startHp; b.hpB = B.hp; b.cdA = 0; b.cdB = 0; b.turn = 0;
      b.log = [{ t: 'start', hpA: b.hpA, hpB: b.hpB }];
      b.side = 0; // the player's pet always acts first
      b.started = true;
      return { ok: 1 };
    }
    if (a.t === 'battleSkill') { // the player tapped their own pet during battle and chose one of its skills
      const b = s.battle; if (!b || !b.started || b.resolved) return { err: 'gone' };
      if (b.side !== 0) return { err: 'battleNotYourTurn' };
      const p = s.home && (s.home.pets || []).find(q => q.id === b.pid); if (!p) return { err: 'gone' };
      const sk = findSkill(p.sp, p.blv || 1, a.skillId);
      if (!sk || !sk.unlocked) return { err: 'battleSkillLocked' };
      resolveRound(s, b, p, sk);
      return { ok: 1 };
    }
    if (a.t === 'battleAuto') { // "자동" -- let the AI pick this one round for the player's pet too
      const b = s.battle; if (!b || !b.started || b.resolved) return { err: 'gone' };
      if (b.side !== 0) return { err: 'battleNotYourTurn' };
      const p = s.home && (s.home.pets || []).find(q => q.id === b.pid); if (!p) return { err: 'gone' };
      resolveRound(s, b, p, aiChoice(p.sp, p.blv || 1, b.hpA, b.maxA, b.cdA));
      return { ok: 1 };
    }
    if (a.t === 'battleAutoAll') { // "빠르게 보기" -- auto-resolve every remaining round at once
      const b = s.battle; if (!b || !b.started || b.resolved) return { err: 'gone' };
      const p = s.home && (s.home.pets || []).find(q => q.id === b.pid); if (!p) return { err: 'gone' };
      let guard = 0;
      while (b.side !== -1 && guard++ < 30) resolveRound(s, b, p, aiChoice(p.sp, p.blv || 1, b.hpA, b.maxA, b.cdA));
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
        const oldBlv = p.blv;
        let lvup = 0;
        while (p.bxp >= needXp(p.blv)) { p.bxp -= needXp(p.blv); p.blv++; lvup++; }
        b.lvup = lvup; b.blvAfter = p.blv; b.stolen = null;
        p.hpFrac = 1; p.hpSetAt = null; // a win still fully restores the pet, same as before
        // v2026-10-15: list any skill(s) newly unlocked by this level-up, so the UI can say "{pet} learned {skill}"
        if (lvup > 0) {
          const tree = skillTreeOf(p.sp, p.blv);
          b.learned = tree.atk.concat(tree.heal).filter(sk => sk.lv > oldBlv && sk.lv <= p.blv).map(sk => ({ name: sk.name, icon: sk.icon }));
        }
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
        // v2: knocked down to effectively 1 HP (rather than locked out of battling entirely) -- it can
        // still fight again right away, just weak, and heals back up to full over BATTLE_REGEN_MS.
        p.hpFrac = 1 / (b.maxA || statOf(p.sp, p.blv || 1).hp || 1);
        p.hpSetAt = Date.now();
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

  return { apply, statOf, hpFracOf, needXp, skillsOf, skillTreeOf };
})();

Object.assign(I18N.ko, {
  battleAppear: '🐾 {o}님의 {p}이(가) 나타났어요!',
  battleRiskNote: '이기면 경험치를 얻고, 운이 좋으면 상대 펫을 데려올 수도 있어요. 지면 펫의 체력이 크게 떨어져서(서서히 회복) 약해지고, 운이 나쁘면 펫을 빼앗길 수도 있어요.',
  battleStartBtn: '⚔️ 전투 시작', battleIgnoreBtn: '🚶 그냥 지나가기',
  battleTitle: '⚔️ 펫 대결', battleSkipBtn: '⏭ 빠르게 보기', battleCloseBtn: '확인',
  battleStepStart: '전투 시작!',
  battleStepAtkMe: '{n}의 {s}! -{d}', battleStepAtkFoe: '{n}의 {s}! -{d}',
  battleStepCrit: ' 💥 크리티컬!',
  battleStepHealMe: '{n}의 {s}! +{d}', battleStepHealFoe: '{n}의 {s}! +{d}',
  battleWinTitle: '🎉 승리했어요!', battleLoseTitle: '😿 패배했어요...',
  battleXpGain: '경험치 +{n}', battleLvUp: '레벨 업! Lv.{n}',
  battleTiredMsg: '전투로 체력이 크게 떨어졌어요. 시간이 지나면 서서히 회복돼요',
  battleStolenMsg: '🏠✨ {o}님의 {n}을(를) 데려왔어요!',
  battleLostMsg: '😱 {n}을(를) {o}님에게 빼앗겼어요!',
  battleHpBadge: '💔 체력 회복 중 ({n}%)',
  battleNeedFollow: '펫을 데리고 다녀야 도전할 수 있어요 🐾',
  battleBusy: '이미 다른 전투가 진행 중이에요',
  battleNoPet: '{n}님은 키우는 펫이 없어요',
  battleChallengeBtn: '⚔️ 전투 신청',
  battleYourTurnHint: '👆 펫을 탭해서 스킬을 사용하세요',
  battleAutoBtn: '⚡ 자동으로 선택',
  battleSkillLocked: '아직 배우지 못한 스킬이에요',
  battleNotYourTurn: '지금은 상대 펫의 차례예요',
  battleSkillLockedTag: '🔒 전투Lv.{n}에 해금',
  battleSkillAtkTag: '⚔️ 공격기', battleSkillHealTag: '💗 회복기',
  petStatusTitle: '🐾 펫 상태', battleLvL: '⚔️ 전투 레벨', battleStatL: '전투 능력치',
  battleStatHp: '체력', battleStatAtk: '공격력', battleStatHeal: '회복량',
  battleSkillTreeL: '📖 배운 스킬 / 배울 스킬',
  followHint: '🐾 데리고 다니는 중',
  battleSkillLearned: '{p}이(가) {s} 스킬을 배웠어요!',
  battleApproach: '🚶 상대에게 다가가는 중...',
  battleFoeFled: '🏃 상대가 도망갔어',
});
Object.assign(I18N.ru, {
  battleAppear: '🐾 Появился питомец {o} — {p}!',
  battleRiskNote: 'Победа даёт опыт, а иногда и питомца соперника. Поражение сильно снижает здоровье питомца (постепенно восстановится), а иногда он достаётся сопернику.',
  battleStartBtn: '⚔️ В бой', battleIgnoreBtn: '🚶 Пройти мимо',
  battleTitle: '⚔️ Битва питомцев', battleSkipBtn: '⏭ Быстро', battleCloseBtn: 'Ок',
  battleStepStart: 'Бой начался!',
  battleStepAtkMe: '{n}: {s}! -{d}', battleStepAtkFoe: '{n}: {s}! -{d}',
  battleStepCrit: ' 💥 Крит!',
  battleStepHealMe: '{n}: {s}! +{d}', battleStepHealFoe: '{n}: {s}! +{d}',
  battleWinTitle: '🎉 Победа!', battleLoseTitle: '😿 Поражение...',
  battleXpGain: 'Опыт +{n}', battleLvUp: 'Новый уровень! Ур.{n}',
  battleTiredMsg: 'Здоровье питомца сильно упало. Оно постепенно восстановится со временем',
  battleStolenMsg: '🏠✨ Забрали питомца {o} — {n}!',
  battleLostMsg: '😱 {o} забрал питомца {n}!',
  battleHpBadge: '💔 Восстановление здоровья ({n}%)',
  battleNeedFollow: 'Чтобы бросить вызов, возьмите питомца с собой 🐾',
  battleBusy: 'Бой уже идёт',
  battleNoPet: 'У жителя {n} нет питомцев',
  battleChallengeBtn: '⚔️ Вызвать на бой',
  battleYourTurnHint: '👆 Нажмите на питомца, чтобы выбрать умение',
  battleAutoBtn: '⚡ Выбрать автоматически',
  battleSkillLocked: 'Этот приём ещё не изучен',
  battleNotYourTurn: 'Сейчас ход питомца соперника',
  battleSkillLockedTag: '🔒 Откроется на ур.{n}',
  battleSkillAtkTag: '⚔️ Атака', battleSkillHealTag: '💗 Лечение',
  petStatusTitle: '🐾 Статус питомца', battleLvL: '⚔️ Боевой уровень', battleStatL: 'Боевые характеристики',
  battleStatHp: 'Здоровье', battleStatAtk: 'Атака', battleStatHeal: 'Лечение',
  battleSkillTreeL: '📖 Изученные / будущие приёмы',
  followHint: '🐾 Гуляет с вами',
  battleSkillLearned: '{p} выучил приём {s}!',
  battleApproach: '🚶 Подходим к сопернику...',
  battleFoeFled: '🏃 Соперник сбежал!',
});
