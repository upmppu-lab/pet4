// ================= Sound effects (WebAudio synth, no files) =================
const SFX = (() => {
  let ac = null, master = null, noiseBuf = null, bgmOn = true, bgmTimer = null;
  function ctx() {
    if (!ac) {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          ac = new AudioCtx();
          master = ac.createGain();
          master.gain.value = .7;
          master.connect(ac.destination);
        }
      } catch (e) {
        return null;
      }
    }
    if (ac && ac.state === 'suspended') {
      ac.resume().catch(() => {});
    }
    return ac;
  }
  const ok = () => (!window.CFG || !CFG.mute) && ctx();
  function unlock() {
    const c = ctx();
    if (c && c.state === 'suspended') {
      c.resume().catch(() => {});
    }
    if (bgmOn && !bgmTimer && (!window.CFG || !CFG.mute) && (window.CFG ? CFG.bgm !== false : true)) {
      SFX.bgm(true);
    }
  }
  ['pointerdown', 'mousedown', 'touchstart', 'touchend', 'click', 'keydown'].forEach(evt => {
    window.addEventListener(evt, unlock, { capture: true, passive: true });
  });
  function tone(f, d, o = {}) {
    if (!ok()) return;
    const t0 = ac.currentTime + (o.at || 0), g = ac.createGain(), os = ac.createOscillator();
    os.type = o.type || 'sine'; os.frequency.setValueAtTime(f, t0);
    if (o.to) os.frequency.exponentialRampToValueAtTime(o.to, t0 + d);
    if (o.vib) { const l = ac.createOscillator(), lg = ac.createGain(); l.frequency.value = o.vib; lg.gain.value = f * .04; l.connect(lg).connect(os.frequency); l.start(t0); l.stop(t0 + d); }
    const v = o.vol || .12;
    g.gain.setValueAtTime(.0001, t0); g.gain.exponentialRampToValueAtTime(v, t0 + (o.att || .01)); g.gain.exponentialRampToValueAtTime(.0001, t0 + d);
    os.connect(g).connect(master); os.start(t0); os.stop(t0 + d + .05);
  }
  function noise(d, o = {}) {
    if (!ok()) return;
    if (!noiseBuf) { noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate); const ch = noiseBuf.getChannelData(0); for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1; }
    const t0 = ac.currentTime + (o.at || 0), src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    src.buffer = noiseBuf; f.type = o.ft || 'bandpass'; f.frequency.value = o.f || 1200; f.Q.value = o.q || 1;
    const v = o.vol || .1; g.gain.setValueAtTime(.0001, t0); g.gain.exponentialRampToValueAtTime(v, t0 + (o.att || .01)); g.gain.exponentialRampToValueAtTime(.0001, t0 + d);
    src.connect(f).connect(g).connect(master); src.start(t0); src.stop(t0 + d + .05);
  }
  const cries = {
    dog: () => { tone(420, .12, { type: 'square', to: 260, vol: .07 }); noise(.1, { f: 700, vol: .05 }); tone(460, .12, { type: 'square', to: 280, vol: .07, at: .18 }); },
    cat: () => tone(520, .55, { type: 'triangle', to: 780, vib: 7, vol: .08, att: .08 }),
    small: () => { tone(1800, .06, { to: 2400, vol: .05 }); tone(2000, .06, { to: 2600, vol: .05, at: .09 }); },
    bird: () => { for (let i = 0; i < 4; i++) tone(2200 + Math.random() * 800, .07, { to: 3200, vol: .05, at: i * .09 }); },
    fish: () => { tone(300, .12, { to: 700, vol: .08 }); tone(420, .1, { to: 900, vol: .06, at: .15 }); },
    reptile: () => noise(.25, { f: 500, vol: .05 }),
  };
  return {
    ctx,
    cry: sp => { const cat = SPECIES[sp] ? SPECIES[sp].cat : 'dog'; (cries[cat] || cries.small)(); },
    door: () => { tone(1320, .5, { vol: .06 }); tone(990, .7, { vol: .06, at: .18 }); },
    cash: () => { noise(.06, { f: 3000, vol: .06 }); tone(1568, .1, { type: 'square', vol: .05, at: .05 }); tone(2093, .35, { vol: .08, at: .12 }); },
    step: () => noise(.05, { f: 400 + Math.random() * 200, vol: .025, q: .7 }),
    jingle: () => { for (let i = 0; i < 5; i++) tone(2600 + i * 220, .18, { vol: .04, at: i * .05 }); },
    splash: () => { noise(.4, { f: 1500, q: .5, vol: .09 }); noise(.25, { f: 800, vol: .05, at: .1 }); },
    brush: () => noise(.12, { f: 5000, ft: 'highpass', vol: .04 }),
    pop: () => { tone(660, .07); tone(880, .08, { at: .05 }); },
    coin: () => { tone(988, .08, { type: 'square', vol: .05 }); tone(1319, .18, { type: 'square', vol: .05, at: .07 }); },
    love: () => { tone(523, .12); tone(659, .12, { at: .1 }); tone(784, .22, { at: .2 }); },
    level: () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, .18, { at: i * .1 })); },
    err: () => tone(220, .18, { type: 'triangle' }),
    tada: () => { [784, 988, 1175, 1568].forEach((f, i) => tone(f, .25, { at: i * .08, type: 'triangle' })); },
    alarm: () => { for (let i = 0; i < 3; i++) tone(880, .12, { type: 'square', vol: .05, at: i * .22 }); },
    bgm(on) {
      bgmOn = Boolean(on); clearInterval(bgmTimer); bgmTimer = null;
      if (!on) return;
      ctx();
      const notes = [[523, 659, 784], [440, 523, 659], [349, 440, 523], [392, 494, 587]]; let bar = 0, step = 0;
      bgmTimer = setInterval(() => {
        if ((window.CFG && CFG.mute) || !bgmOn || document.hidden) return;
        const c = ctx();
        if (!c || c.state !== 'running') return;
        const ch = notes[bar % 4]; tone(ch[step % 3] / 2, .9, { type: 'triangle', vol: .032, att: .05 });
        if (step % 3 === 0) tone(ch[0] / 4, 1.6, { vol: .038, att: .1 });
        step++; if (step % 6 === 0) bar++;
      }, 420);
    },
  };
})();
// keep old SND API
SND.coin = SFX.coin; SND.pop = SFX.pop; SND.love = SFX.love; SND.level = SFX.level; SND.err = SFX.err;
