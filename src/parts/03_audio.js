// ---------------------------------------------------------------- save data + WebAudio synth (sfx + synthwave/chiptune tracks)
const store = (() => { try { return JSON.parse(localStorage.getItem('neonBlaster.v1')) || {}; } catch(_){ return {}; } })();
store.cleared = store.cleared || {}; store.best = store.best || {}; store.suits = store.suits || ['volt'];
function saveStore(){ try { localStorage.setItem('neonBlaster.v1', JSON.stringify(store)); } catch(_){} }
const hz = m => 440 * Math.pow(2, (m - 69) / 12);
const MUSIC_BASE = 0.42, SFX_BASE = 3.2;   // bus levels at slider 100%
// never start a session silent: a saved volume of ~0 falls back to the default, and mute is per-session only
store.musicVol = !(store.musicVol >= 0.05) ? 0.8 : Math.min(1, store.musicVol); store.sfxVol = !(store.sfxVol >= 0.05) ? 0.9 : Math.min(1, store.sfxVol); delete store.muted;
// tiny silent looping WAV for the iOS ringer-switch workaround (an <audio> element playing puts the page in the 'playback' session)
const SILENT_WAV = (() => { const n = 4410, b = new Uint8Array(44 + n * 2), v = new DataView(b.buffer), w = (o, t) => { for (let i = 0; i < t.length; i++) b[o + i] = t.charCodeAt(i); };
  w(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); w(8, 'WAVEfmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, 44100, true); v.setUint32(28, 88200, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, n * 2, true);
  let s = ''; for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]); return 'data:audio/wav;base64,' + btoa(s); })();
function buildOut(ac){   // shared output chain: music + sfx -> master (mute) -> brickwall limiter
  const master = ac.createGain(); master.gain.value = 0.8;
  const lim = ac.createDynamicsCompressor(); lim.threshold.value = -2; lim.knee.value = 0; lim.ratio.value = 20; lim.attack.value = 0.001; lim.release.value = 0.12;
  master.connect(lim); lim.connect(ac.destination);
  const music = ac.createGain(); music.gain.value = MUSIC_BASE * store.musicVol; music.connect(master);
  return { master, music };
}
const Sfx = {
  ac: null, master: null, music: null, sfx: null, muted: !!store.muted, track: -1, want: -1, paused: false, after: null, jingling: false,
  // Called synchronously from every user gesture (touchstart/touchend/pointerdown/pointerup/click/keydown) until audio runs.
  unlock(){
    try { if (navigator.audioSession && navigator.audioSession.type !== 'playback') navigator.audioSession.type = 'playback'; } catch (_){}
    if (!this.silentEl){   // iOS: play a looping silent <audio> inside the gesture so WebAudio isn't muted by the ringer switch
      try { const a = this.silentEl = document.createElement('audio'); a.src = SILENT_WAV; a.loop = true; a.preload = 'auto'; a.setAttribute('playsinline', ''); a.setAttribute('webkit-playsinline', ''); a.setAttribute('x-webkit-airplay', 'deny'); a.volume = 0.01; } catch (_){}
    }
    if (this.silentEl && this.silentEl.paused && !document.hidden){ try { const r = this.silentEl.play(); if (r && r.catch) r.catch(() => {}); } catch (_){} }
    this.init();
    const ac = this.ac; if (!ac) return;
    if (ac.state !== 'running' && !this.paused && !document.hidden){
      try { const r = ac.resume(); if (r && r.then) r.then(() => updateSoundHint(), () => {}); } catch (_){}
      try { const b = ac.createBuffer(1, 1, 22050), src = ac.createBufferSource(); src.buffer = b; src.connect(ac.destination); src.start(0); } catch (_){}   // classic iOS unlock blip
    }
    updateSoundHint();
  },
  init(){
    if (this.ac){ if (this.ac.state !== 'running' && this.ac.state !== 'closed' && !this.paused && !document.hidden){ try { const r = this.ac.resume(); if (r && r.catch) r.catch(() => {}); } catch (_){} } return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    let ac; try { ac = this.ac = new AC({ latencyHint: 'interactive' }); } catch (_){ ac = this.ac = new AC(); }
    ac.onstatechange = () => updateSoundHint();
    const o = buildOut(ac); this.master = o.master; this.music = o.music;
    if (this.muted) this.master.gain.value = 0;
    const comp = ac.createDynamicsCompressor(); comp.threshold.value = -12; comp.ratio.value = 3; comp.connect(this.master);
    this.sfx = ac.createGain(); this.sfx.gain.value = SFX_BASE * store.sfxVol; this.sfx.connect(comp);
    this.mus = new Synthwave(ac, this.music);
    const nb = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate), d = nb.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; this.noiseBuf = nb;
    // jetpack hover loop
    const hs = ac.createBufferSource(); hs.buffer = nb; hs.loop = true; const hf = ac.createBiquadFilter(); hf.type = 'bandpass'; hf.frequency.value = 900; hf.Q.value = 1.2; this.hoverF = hf;
    this.hoverG = ac.createGain(); this.hoverG.gain.value = 0; hs.connect(hf); hf.connect(this.hoverG); this.hoverG.connect(this.sfx); hs.start();
    // charge whine
    const co = ac.createOscillator(); co.type = 'sawtooth'; co.frequency.value = 220; const cf = ac.createBiquadFilter(); cf.type = 'lowpass'; cf.frequency.value = 1800;
    this.chargeO = co; this.chargeG = ac.createGain(); this.chargeG.gain.value = 0; co.connect(cf); cf.connect(this.chargeG); this.chargeG.connect(this.sfx); co.start();
    setInterval(() => this.schedule(), 25);   // lookahead scheduler: notes are queued ~0.2 s ahead on the audio clock
    const wake = () => { if (!document.hidden && !this.paused && ac.state !== 'running'){ try { const r = ac.resume(); if (r && r.catch) r.catch(() => {}); } catch (_){} } updateSoundHint(); };
    document.addEventListener('visibilitychange', () => { if (document.hidden){ ac.suspend(); if (this.silentEl) this.silentEl.pause(); } else wake(); });
    window.addEventListener('pageshow', wake); window.addEventListener('focus', wake);
    if (this.want >= 0){ const w = this.want; this.want = -1; this.play(w); }
  },
  setMuted(m){ this.muted = m; if (this.master) this.master.gain.setTargetAtTime(m ? 0 : 0.8, this.ac.currentTime, 0.03); updateMuteIcon(); },
  setVol(kind, v){
    store[kind] = v; saveStore();
    if (!this.ac) return; const t = this.ac.currentTime;
    if (kind === 'musicVol') this.music.gain.setTargetAtTime(MUSIC_BASE * v, t, 0.05); else this.sfx.gain.setTargetAtTime(SFX_BASE * v, t, 0.05);
  },
  setPaused(p){ this.paused = p; if (!this.ac) return; if (p) this.ac.suspend(); else if (this.ac.state !== 'running' && !document.hidden) this.ac.resume(); },
  play(i){
    if (this.jingling){ this.after = { i }; return; }
    if (this.track === i && this.want === i) return;
    this.want = i; if (!this.ac) return;
    this.track = i; this.mus.setTrack(MUSIC[i], this.ac.currentTime + 0.12);
  },
  stop(){ this.want = -1; this.track = -1; this.after = null; if (this.mus && !this.jingling) this.mus.setTrack(null); },
  jingle(kind, then){   // then: 'resume' (continue the current track where it was) or a track index
    if (!this.ac) return;
    this.after = then === 'resume' ? (this.track >= 0 ? { i: this.track, pos: this.mus.pos() } : null) : then >= 0 ? { i: then } : null;
    this.jingling = true; this.track = -2; this.want = -2; this.mus.setTrack(JINGLES[kind], this.ac.currentTime + 0.05);
  },
  hover(on, fuel){ if (!this.ac) return; const t = this.ac.currentTime; this.hoverG.gain.setTargetAtTime(on ? 0.06 : 0, t, 0.05); this.hoverF.frequency.setTargetAtTime(600 + fuel * 700, t, 0.1); },
  charging(lv, on){ if (!this.ac) return; const t = this.ac.currentTime; this.chargeG.gain.setTargetAtTime(on ? 0.014 : 0, t, 0.03); this.chargeO.frequency.setTargetAtTime(lv === 2 ? 660 + Math.sin(t * 40) * 40 : 200 + lv * 220, t, 0.15); },
  tone(f, dur, type = 'square', vol = 0.15, f2 = null, t0 = 0, out = null, atk = 0.006){
    if (!this.ac) return; const ac = this.ac, t = ac.currentTime + t0;
    const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + atk); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(out || this.sfx); o.start(t); o.stop(t + dur + 0.05);
  },
  noise(dur, vol = 0.2, freq = 1200, type = 'bandpass', t0 = 0, f2 = null, out = null){
    if (!this.ac) return; const ac = this.ac, t = ac.currentTime + t0;
    const s = ac.createBufferSource(); s.buffer = this.noiseBuf; const f = ac.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(freq, t); f.Q.value = 0.8;
    if (f2) f.frequency.exponentialRampToValueAtTime(f2, t + dur);
    const g = ac.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(out || this.sfx); s.start(t, Math.random()); s.stop(t + dur + 0.05);
  },
  jump(){ this.tone(300, 0.14, 'square', 0.07, 620); },
  flap(){ this.noise(0.16, 0.12, 700, 'bandpass', 0, 2400); this.tone(180, 0.1, 'triangle', 0.06, 320); },
  land(){ this.noise(0.08, 0.1, 400, 'lowpass'); },
  shoot(suit, lvl){
    if (lvl === 2){
      if (suit === 'aegis'){ this.tone(400, 0.5, 'sine', 0.12, 1200); this.tone(800, 0.4, 'triangle', 0.06, 1600, 0.05); return; }
      this.noise(0.35, 0.2, 1500, 'bandpass', 0, 300); this.tone(900, 0.3, 'sawtooth', 0.09, 120); return;
    }
    if (lvl === 1){ this.tone(1100, 0.15, 'square', 0.08, 300); return; }
    if (suit === 'volt') this.tone(1400, 0.07, 'square', 0.06, 700);
    else if (suit === 'blaze'){ this.noise(0.12, 0.1, 1800, 'bandpass', 0, 600); this.tone(500, 0.08, 'sawtooth', 0.04, 250); }
    else if (suit === 'frost'){ this.tone(2200, 0.1, 'sine', 0.07, 3200); this.tone(3300, 0.06, 'triangle', 0.03, null, 0.02); }
    else if (suit === 'spark'){ this.tone(1800, 0.08, 'square', 0.04, 2600); this.noise(0.06, 0.06, 5000, 'highpass'); }
    else if (suit === 'aegis') this.tone(600, 0.18, 'triangle', 0.07, 900);
  },
  chargeLv(lv){ this.tone(lv === 2 ? 1320 : 880, 0.12, 'triangle', 0.07); },
  ehit(){ this.tone(520, 0.05, 'square', 0.05, 300); },
  pop(){ this.tone(880, 0.09, 'square', 0.07, 1760); this.tone(1320, 0.12, 'triangle', 0.05, 2400, 0.04); this.noise(0.15, 0.08, 2500); },
  freeze(){ this.tone(2600, 0.25, 'sine', 0.06, 1800); this.noise(0.2, 0.06, 6000, 'highpass'); },
  shatter(){ this.noise(0.25, 0.14, 5000, 'highpass'); this.tone(3000, 0.15, 'triangle', 0.05, 1500); },
  hurt(){ this.tone(220, 0.22, 'sawtooth', 0.1, 90); this.noise(0.15, 0.1, 800); },
  die(){ [523, 392, 330, 262, 196].forEach((f, i) => this.tone(f, 0.2, 'square', 0.07, null, i * 0.09)); },
  zap(){ this.noise(0.2, 0.15, 3000, 'bandpass'); this.tone(120, 0.18, 'sawtooth', 0.07, 60); },
  cell(n){ const f = 988 * Math.pow(2, Math.min(n, 12) / 24); this.tone(f, 0.08, 'square', 0.05); this.tone(f * 1.5, 0.12, 'square', 0.04, null, 0.05); },
  heal(){ [660, 880, 1100].forEach((f, i) => this.tone(f, 0.12, 'triangle', 0.07, null, i * 0.05)); },
  checkpoint(){ [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.18, 'triangle', 0.08, null, i * 0.07)); },
  swap(){ this.tone(600, 0.1, 'square', 0.05, 1200); this.tone(1200, 0.12, 'triangle', 0.05, 1800, 0.06); },
  fanfare(){ [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => this.tone(f, i === 6 ? 0.6 : 0.16, 'square', 0.07, null, i * 0.11)); [262, 330, 392].forEach(f => this.tone(f, 1.2, 'triangle', 0.06, null, 0.66)); },
  bossIntro(){ this.tone(110, 1.0, 'sawtooth', 0.12, 55); for (let i = 0; i < 3; i++){ this.tone(880, 0.12, 'square', 0.06, null, i * 0.3); this.tone(660, 0.12, 'square', 0.06, null, i * 0.3 + 0.15); } },
  stinger(type){   // per-boss intro stinger (plays over the start of the boss track)
    if (type === 'oni'){   // taiko hits + growl
      [0, 0.26, 0.52, 0.95].forEach((d, i) => { this.tone(i === 3 ? 62 : 78, 0.45, 'sine', i === 3 ? 0.32 : 0.24, 38, d); this.noise(0.16, 0.16, 380, 'lowpass', d); });
      this.tone(92, 1.1, 'sawtooth', 0.08, 52, 0.95); this.noise(1.0, 0.07, 600, 'bandpass', 0.95, 180);
    } else if (type === 'kite'){   // shakuhachi swoop + koto plucks + wind
      this.noise(0.9, 0.08, 1400, 'bandpass', 0, 500); this.tone(587, 0.5, 'sine', 0.14, 659, 0.05); this.tone(659, 0.55, 'sine', 0.12, 622, 0.55);
      [880, 1175, 1319, 1760].forEach((f, i) => this.tone(f, 0.35, 'triangle', 0.1, null, 1.05 + i * 0.09));
    } else if (type === 'shogun'){   // security klaxon + temple gong
      for (let i = 0; i < 4; i++){ this.tone(880, 0.13, 'square', 0.07, null, i * 0.26); this.tone(660, 0.13, 'square', 0.07, null, i * 0.26 + 0.13); }
      [[110, 0.16], [221, 0.07], [331.5, 0.05], [442.7, 0.03]].forEach(([f, v]) => this.tone(f, 2.0, 'sine', v, f * 0.98, 1.05, null, 0.004)); this.noise(0.25, 0.1, 900, 'bandpass', 1.05);
    } else if (type === 'dragon'){   // two-tone train horn into a roar
      this.tone(311, 0.9, 'sawtooth', 0.05, 300); this.tone(370, 0.9, 'sawtooth', 0.05, 358); this.tone(466, 0.9, 'square', 0.025, 450);
      this.noise(1.3, 0.16, 500, 'bandpass', 0.95, 140); this.tone(110, 1.2, 'sawtooth', 0.1, 48, 0.95); this.tone(55, 1.4, 'sine', 0.22, 35, 0.95);
    } else this.bossIntro();
  },
  horn(){ this.tone(311, 0.6, 'sawtooth', 0.045, 305); this.tone(370, 0.6, 'sawtooth', 0.045, 362); },
  roar(){ this.noise(0.9, 0.16, 520, 'bandpass', 0, 140); this.tone(100, 0.8, 'sawtooth', 0.08, 50); },
  whoosh(){ this.noise(0.35, 0.14, 600, 'bandpass', 0, 2400); },
  laserCharge(){ this.tone(300, 1.0, 'sawtooth', 0.04, 1600); },
  laser(){ this.tone(1500, 1.8, 'sawtooth', 0.035, 1100); this.noise(1.8, 0.05, 3000, 'bandpass'); },
  clink(){ this.tone(2400, 0.06, 'triangle', 0.06, 2100); this.tone(3600, 0.05, 'sine', 0.04, null, 0.01); },
  expose(){ [784, 1047, 1319].forEach((f, i) => this.tone(f, 0.12, 'triangle', 0.06, null, i * 0.05)); },
  launch(){ this.noise(0.4, 0.12, 900, 'bandpass', 0, 300); this.tone(220, 0.3, 'square', 0.04, 440); },
  smoke(){ this.noise(0.4, 0.12, 1800, 'highpass', 0, 600); },
  bhit(){ this.tone(300, 0.06, 'square', 0.06, 180); this.noise(0.05, 0.06, 2000); },
  boom(){ this.noise(0.6, 0.3, 600, 'lowpass', 0, 80); this.tone(90, 0.5, 'sine', 0.2, 40); },
  bump(){ this.noise(0.3, 0.2, 300, 'lowpass'); this.tone(70, 0.25, 'sine', 0.18, 40); },
  tele(){ this.tone(1200, 0.1, 'square', 0.06); this.tone(1200, 0.1, 'square', 0.06, null, 0.16); },
  eshoot(){ this.tone(700, 0.1, 'triangle', 0.04, 400); },
  breakB(){ this.noise(0.3, 0.2, 900, 'lowpass', 0, 200); this.tone(160, 0.2, 'square', 0.06, 80); },
  chain(){ this.noise(0.4, 0.2, 4000, 'bandpass', 0, 800); this.tone(1600, 0.3, 'sawtooth', 0.06, 300); },
  block(){ this.tone(1500, 0.08, 'triangle', 0.06, 2000); },
  respawn(){ this.tone(200, 0.5, 'sine', 0.1, 1200); this.noise(0.4, 0.06, 3000, 'highpass'); },
  goal(){ [784, 988, 1175, 1568].forEach((f, i) => this.tone(f, 0.2, 'square', 0.07, null, i * 0.1)); this.tone(1568, 0.8, 'triangle', 0.06, null, 0.45); },
  click(){ this.tone(1300, 0.05, 'square', 0.04); },
  train(){ this.noise(2.4, 0.08, 220, 'lowpass', 0, 600); },
  schedule(){
    if (!this.ac || this.ac.state !== 'running' || !this.mus) return;
    const now = this.ac.currentTime;
    if (this.jingling && this.mus.done && now > this.mus.endT + 0.4){
      this.jingling = false; const a = this.after; this.after = null; this.track = -1; this.mus.setTrack(null);
      if (a){ this.want = a.i; this.track = a.i; this.mus.setTrack(MUSIC[a.i], now + 0.1, a.pos); }
    }
    this.mus.tick(now + 0.2);
  }
};
const ICON_ON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9z" fill="currentColor"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>';
const ICON_OFF = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9z" fill="currentColor"/><path d="M17 9l5 6M22 9l-5 6"/></svg>';
function soundRunning(){ return !!(Sfx.ac && Sfx.ac.state === 'running'); }
function updateSoundHint(){ const h = document.getElementById('sndHint'); if (h) h.classList.toggle('on', !soundRunning()); }
// unlock on every kind of first gesture (iOS needs touchend/click; Chrome accepts pointerdown/keydown); keeps retrying while not running
for (const ev of ['touchstart', 'touchend', 'pointerdown', 'pointerup', 'mousedown', 'click', 'keydown']) window.addEventListener(ev, () => { if (!soundRunning() || !Sfx.silentEl || Sfx.silentEl.paused) Sfx.unlock(); }, { capture: true, passive: true });
function updateMuteIcon(){ $('muteBtn').innerHTML = Sfx.muted ? ICON_OFF : ICON_ON; }
updateMuteIcon();
