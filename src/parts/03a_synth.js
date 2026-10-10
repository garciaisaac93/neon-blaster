// ---------------------------------------------------------------- synthwave engine (pure WebAudio, works with AudioContext or OfflineAudioContext)
const NOTE_PC = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
const midiOf = s => { const m = /^([A-G][#b]?)(-?\d)$/.exec(s); return m ? NOTE_PC[m[1]] + (+m[2] + 1) * 12 : null; };   // C4 = 60
const CHORD_IV = { '': [0, 4, 7], m: [0, 3, 7], maj7: [0, 4, 7, 11], m7: [0, 3, 7, 10], '7': [0, 4, 7, 10], sus2: [0, 2, 7], sus4: [0, 5, 7], add9: [0, 4, 7, 14], madd9: [0, 3, 7, 14], dim: [0, 3, 6] };
const chordCache = {};
function parseChord(s){
  if (chordCache[s]) return chordCache[s];
  const m = /^([A-G][#b]?)(maj7|madd9|add9|sus2|sus4|dim|m7|m|7)?(?:\/([A-G][#b]?))?$/.exec(s);
  if (!m) throw new Error('bad chord ' + s);
  const r = NOTE_PC[m[1]], iv = CHORD_IV[m[2] || ''];
  const pcs = iv.map(i => (r + i) % 12), bass = m[3] ? NOTE_PC[m[3]] : r;
  // pad voicing: close voicing between F3 and E4 + root an octave below (lush but not muddy)
  const pad = pcs.map(pc => { let n = 48 + pc; if (n < 53) n += 12; return n; }).sort((a, b) => a - b);
  // arp pool: chord tones across two octaves from C5
  const pool = []; for (const o of [0, 12]) for (const pc of pcs.slice().sort((a, b) => a - b)) pool.push(60 + o + pc + (pc < 2 ? 12 : 0));
  pool.sort((a, b) => a - b);
  return (chordCache[s] = { pad, pool, bass: 28 + ((bass - 4 + 12) % 12) });   // bass E1..D#2
}
// melody: tokens per 8th note; NOTE = new note, '-' = hold, '.' = rest, '|' = bar line (ignored)
function parseMelody(str){
  if (!str) return null;
  const toks = str.split(/\s+/).filter(t => t && t !== '|'), ev = {};
  let cur = null;
  toks.forEach((t, i) => {
    if (t === '-'){ if (cur) cur.len++; return; }
    if (t === '.'){ cur = null; return; }
    const m = midiOf(t); if (m === null) throw new Error('bad note ' + t);
    cur = ev[i] = { m, len: 1 };
  });
  return { ev, n: toks.length };
}
const DRUMS = {   // 16 steps per bar: k = kick, s = snare, h = closed hat, o = open hat, c = clap
  none:  { k: '', s: '', h: '', o: '' },
  half:  { k: 'x.........x.....', s: '........x.......', h: 'x.x.x.x.x.x.x.x.', o: '' },
  drive: { k: 'x.......x.x.....', s: '....x.......x...', h: 'x.xxx.xxx.xxx.xx', o: '..x...x...x...x.' },
  four:  { k: 'x...x...x...x...', s: '....x.......x...', h: 'xxxxxxxxxxxxxxxx', o: '..x...x...x...x.' },
  boss:  { k: 'x...x...x...x.x.', s: '....x.......x...', h: 'xxxxxxxxxxxxxxxx', o: '..x...x...x...x.', c: '....x.......x..x' },
  pulse: { k: 'x...x...x...x...', s: '', h: '..x...x...x...x.', o: '' }
};
const ARPS = { up: [0, 1, 2, 3, 4, 5, 6, 7], updown: [0, 1, 2, 3, 4, 3, 2, 1], wide: [0, 2, 1, 3, 2, 4, 3, 5], down: [5, 4, 3, 2, 1, 0, 1, 2], pulse: [0, 2, 0, 3, 0, 2, 0, 4] };

class Synthwave {
  constructor(ac, out){
    this.ac = ac; this.out = out; this.tr = null; this.nextT = 0;
    const g = v => { const n = ac.createGain(); n.gain.value = v; return n; };
    // noise
    const nb = ac.createBuffer(1, ac.sampleRate * 1.5, ac.sampleRate), nd = nb.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1; this.nb = nb;
    // bus layout
    this.comp = ac.createDynamicsCompressor(); this.comp.threshold.value = -14; this.comp.knee.value = 8; this.comp.ratio.value = 3.5; this.comp.attack.value = 0.006; this.comp.release.value = 0.18;
    this.mix = g(0.9); this.mix.connect(this.comp); this.comp.connect(out);
    this.drums = g(1); this.drums.connect(this.mix);
    this.pump = g(1); this.pump.connect(this.mix);                    // sidechain-style ducking bus (pads/arp/bass)
    this.leadBus = g(1); this.leadBus.connect(this.mix);
    // hall reverb
    this.rev = ac.createConvolver(); this.rev.buffer = this.impulse(2.2, 2.4, false); this.revRet = g(0.55);
    this.rev.connect(this.revRet); this.revRet.connect(this.mix); this.revSend = g(1); this.revSend.connect(this.rev);
    // gated reverb for the snare (dense burst, hard cut ~ classic 80s)
    this.gate = ac.createConvolver(); this.gate.buffer = this.impulse(0.3, 0.6, true); this.gateRet = g(0.7);
    this.gate.connect(this.gateRet); this.gateRet.connect(this.drums); this.gateSend = g(1); this.gateSend.connect(this.gate);
    // stereo ping-pong delay
    this.dSend = g(1); this.dA = ac.createDelay(2); this.dB = ac.createDelay(2);
    const dlp = ac.createBiquadFilter(); dlp.type = 'lowpass'; dlp.frequency.value = 3200; const dhp = ac.createBiquadFilter(); dhp.type = 'highpass'; dhp.frequency.value = 300;
    const fb = g(0.42), pl = ac.createStereoPanner(), pr = ac.createStereoPanner(); pl.pan.value = -0.7; pr.pan.value = 0.7;
    this.dSend.connect(dhp); dhp.connect(this.dA); this.dA.connect(dlp); dlp.connect(pl); dlp.connect(this.dB); this.dB.connect(pr); this.dB.connect(fb); fb.connect(this.dA);
    this.dRet = g(0.5); pl.connect(this.dRet); pr.connect(this.dRet); this.dRet.connect(this.mix); this.dRet.connect(this.revSend);
    // shared pre-panned buses (cheaper than a panner per note)
    this.pan = {}; for (const [k, dest, v] of [['hL', this.drums, -0.25], ['hR', this.drums, 0.3], ['aL', this.pump, -0.4], ['aR', this.pump, 0.4]]){
      const pn = ac.createStereoPanner(); pn.pan.value = v; pn.connect(dest); this.pan[k] = pn;
    }
    this.arpDel = g(0.55); this.pan.aL.connect(this.arpDel); this.pan.aR.connect(this.arpDel); this.arpDel.connect(this.dSend);
    // pad bus with stereo chorus (two LFO-modulated short delays)
    this.padBus = g(1); this.padBus.connect(this.pump); this.padBus.connect(this.revSend);
    for (const [base, rate, pan] of [[0.012, 0.45, -0.8], [0.017, 0.31, 0.8]]){
      const d = ac.createDelay(0.05); d.delayTime.value = base; const lfo = ac.createOscillator(); lfo.frequency.value = rate; const lg = g(0.0028);
      lfo.connect(lg); lg.connect(d.delayTime); lfo.start();
      const p = ac.createStereoPanner(); p.pan.value = pan; const wg = g(0.75); this.padBus.connect(d); d.connect(p); p.connect(wg); wg.connect(this.pump);
    }
  }
  impulse(dur, decay, gated){
    const ac = this.ac, n = Math.floor(ac.sampleRate * dur), b = ac.createBuffer(2, n, ac.sampleRate);
    for (let c = 0; c < 2; c++){
      const d = b.getChannelData(c);
      for (let i = 0; i < n; i++){
        const t = i / n;
        const env = gated ? (t < 0.04 ? t / 0.04 : 1 - t * 0.35) * (i > n - 200 ? (n - i) / 200 : 1) : Math.pow(1 - t, decay) * (t < 0.01 ? t / 0.01 : 1);
        d[i] = (Math.random() * 2 - 1) * env;
      }
    }
    return b;
  }
  // ---------- voices
  osc(type, f, t, stop, det = 0){ const o = this.ac.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); if (det) o.detune.setValueAtTime(det, t); o.start(t); o.stop(stop); return o; }
  env(t, peak, a, d, sus, rel, len){   // ADSR gain node
    const g = this.ac.createGain(), p = g.gain;
    p.setValueAtTime(0.0001, t); p.linearRampToValueAtTime(peak, t + a);
    p.setTargetAtTime(peak * sus, t + a, d / 3);
    p.setTargetAtTime(0.0001, Math.max(t + a + 0.001, t + len), rel / 4);   // release glides from wherever the decay is (no clicks)
    return g;
  }
  noiseSrc(t, dur, off = 0){ const s = this.ac.createBufferSource(); s.buffer = this.nb; s.start(t, off || Math.random() * 1.2); s.stop(t + dur); return s; }
  filt(type, f, q = 0.7){ const b = this.ac.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; return b; }
  duck(t, depth){ const p = this.pump.gain; p.setValueAtTime(1 - depth, t); p.setTargetAtTime(1, t + 0.03, 0.09); }
  kick(t, v){
    const o = this.osc('sine', 170, t, t + 0.5); o.frequency.exponentialRampToValueAtTime(50, t + 0.1);
    const g = this.ac.createGain(); g.gain.setValueAtTime(v, t); g.gain.setTargetAtTime(0.0001, t + 0.06, 0.09);
    o.connect(g); g.connect(this.drums);
    const c = this.noiseSrc(t, 0.02), cf = this.filt('highpass', 3000), cg = this.ac.createGain(); cg.gain.setValueAtTime(v * 0.25, t); cg.gain.exponentialRampToValueAtTime(0.0001, t + 0.015);
    c.connect(cf); cf.connect(cg); cg.connect(this.drums);
    this.duck(t, this.tr.pump);
  }
  snare(t, v){
    const n = this.noiseSrc(t, 0.3), bp = this.filt('bandpass', 2600, 0.5), hp = this.filt('highpass', 900);
    const g = this.ac.createGain(); g.gain.setValueAtTime(v * 1.3, t); g.gain.setTargetAtTime(0.0001, t + 0.01, 0.06);
    n.connect(hp); hp.connect(bp); bp.connect(g); g.connect(this.drums);
    const sg = this.ac.createGain(); sg.gain.value = 1.0; g.connect(sg); sg.connect(this.gateSend);
    const o = this.osc('triangle', 210, t, t + 0.15); o.frequency.exponentialRampToValueAtTime(150, t + 0.1);
    const og = this.ac.createGain(); og.gain.setValueAtTime(v * 0.45, t); og.gain.setTargetAtTime(0.0001, t + 0.01, 0.03); o.connect(og); og.connect(this.drums); og.connect(this.gateSend);
  }
  clap(t, v){
    const n = this.noiseSrc(t, 0.25), bp = this.filt('bandpass', 1300, 1.2), g = this.ac.createGain(), p = g.gain;
    p.setValueAtTime(0.0001, t); for (let i = 0; i < 3; i++){ p.setValueAtTime(v, t + i * 0.011); p.setTargetAtTime(0.0001, t + i * 0.011 + 0.002, 0.004); }
    p.setValueAtTime(v * 0.8, t + 0.035); p.setTargetAtTime(0.0001, t + 0.036, 0.04);
    n.connect(bp); bp.connect(g); g.connect(this.drums); g.connect(this.gateSend);
  }
  hat(t, v, open, pan){
    const n = this.noiseSrc(t, open ? 0.35 : 0.08), hp = this.filt('highpass', open ? 7000 : 8500), g = this.ac.createGain();
    g.gain.setValueAtTime(v, t); g.gain.setTargetAtTime(0.0001, t + 0.003, open ? 0.07 : 0.014);
    n.connect(hp); hp.connect(g); g.connect(pan > 0 ? this.pan.hR : this.pan.hL);
  }
  tom(t, f, v){
    const o = this.osc('sine', f, t, t + 0.45); o.frequency.exponentialRampToValueAtTime(f * 0.55, t + 0.3);
    const g = this.ac.createGain(); g.gain.setValueAtTime(v, t); g.gain.setTargetAtTime(0.0001, t + 0.02, 0.09);
    o.connect(g); g.connect(this.drums); g.connect(this.gateSend);
  }
  crash(t, v){
    const n = this.noiseSrc(t, 2.2), hp = this.filt('highpass', 4500), g = this.ac.createGain();
    g.gain.setValueAtTime(v, t); g.gain.setTargetAtTime(0.0001, t + 0.02, 0.5);
    n.connect(hp); hp.connect(g); g.connect(this.drums); g.connect(this.revSend);
  }
  bass(t, m, len, v, bright){
    const f = hz(m), end = t + len + 0.12;
    const o1 = this.osc('sawtooth', f, t, end), o2 = this.osc('square', f, t, end, -7), sub = this.osc('sine', f, t, end);
    const lp = this.filt('lowpass', 160, 2), q = lp.frequency;
    q.setValueAtTime(160, t); q.linearRampToValueAtTime(380 + bright * 1300, t + 0.008); q.setTargetAtTime(220 + bright * 200, t + 0.01, 0.07 + len * 0.15);
    const g = this.env(t, v, 0.004, 0.12, 0.75, 0.06, len), sg = this.env(t, v * 0.5, 0.004, 0.2, 0.9, 0.06, len);
    const mg = this.ac.createGain(); mg.gain.value = 0.5;
    o1.connect(lp); o2.connect(mg); mg.connect(lp); lp.connect(g); g.connect(this.pump); sub.connect(sg); sg.connect(this.pump);
  }
  arp(t, m, len, v, pan, wave, cut){
    const end = t + len + 0.25, o = this.osc(wave, hz(m), t, end), lp = this.filt('lowpass', 900 + cut * 3600, 2);
    lp.frequency.setTargetAtTime(500 + cut * 1200, t + 0.01, 0.06);
    const g = this.env(t, v, 0.003, 0.08, 0.35, 0.08, len);
    o.connect(lp); lp.connect(g); g.connect(pan > 0 ? this.pan.aR : this.pan.aL);
  }
  pad(t, notes, len, v, cut){
    const end = t + len + 1.4, lp = this.filt('lowpass', 700 + cut * 2600, 0.9);
    lp.frequency.setValueAtTime(600 + cut * 1500, t); lp.frequency.linearRampToValueAtTime(800 + cut * 2800, t + len * 0.6);
    const g = this.env(t, v * 1.2, Math.min(0.5, len * 0.3), 0.6, 0.85, 1.1, len);
    for (const m of notes) for (const det of [-10, 10]){ const o = this.osc('sawtooth', hz(m), t, end, det + (Math.random() - 0.5) * 4); o.connect(lp); }
    const o = this.osc('triangle', hz(notes[0] - 12), t, end); const og = this.ac.createGain(); og.gain.value = 0.35; o.connect(og); og.connect(lp);
    lp.connect(g); g.connect(this.padBus);
  }
  lead(t, m, len, v, kind){
    const end = t + len + 0.6, f = hz(m), lp = this.filt('lowpass', kind === 'bell' ? 5000 : 2600, 1.2);
    lp.frequency.setValueAtTime(kind === 'bell' ? 6000 : 4200, t); lp.frequency.setTargetAtTime(kind === 'bell' ? 3000 : 3200, t + 0.02, 0.3);
    const g = kind === 'bell' ? this.env(t, v, 0.004, 0.5, 0.25, 0.4, len) : this.env(t, v, 0.012, 0.25, 0.75, 0.22, len);
    const vib = this.osc('sine', 5.4, t, end), vg = this.ac.createGain(); vg.gain.setValueAtTime(0, t); vg.gain.linearRampToValueAtTime(len > 0.35 ? 14 : 0, t + Math.min(len, 0.45));
    vib.connect(vg);
    const waves = kind === 'square' ? [['square', -5], ['square', 6], ['sawtooth', 0]] : kind === 'bell' ? [['sine', 0], ['triangle', 1200.5], ['sine', 1902]] : [['sawtooth', -8], ['sawtooth', 8], ['square', -1200]];
    waves.forEach(([w, det], i) => { const o = this.osc(w, f, t, end, det); vg.connect(o.detune); const og = this.ac.createGain(); og.gain.value = i === 2 ? 0.35 : 0.6; o.connect(og); og.connect(lp); });
    lp.connect(g); g.connect(this.leadBus);
    const ds = this.ac.createGain(); ds.gain.value = 0.45; g.connect(ds); ds.connect(this.dSend);
    const rs = this.ac.createGain(); rs.gain.value = 0.35; g.connect(rs); rs.connect(this.revSend);
  }
  // ---------- sequencer
  setTrack(tr, t0, pos){
    this.tr = tr; if (!tr) return;
    if (!tr._p){ tr._p = true; for (const k in tr.sec){ const s = tr.sec[k]; s.mel = parseMelody(s.lead); s.prog = s.prog.split(/\s+/); s.prog.forEach(parseChord); } }
    this.spb = 60 / tr.bpm / 4; this.si = pos ? pos.si : 0; this.bar = pos ? pos.bar : 0; this.st = 0; this.nextT = t0; this.done = false;
    const beat = 60 / tr.bpm; this.dA.delayTime.setValueAtTime(beat * 0.75, t0); this.dB.delayTime.setValueAtTime(beat * 0.75, t0);
  }
  pos(){ return { si: this.si, bar: this.bar }; }
  tick(until){
    if (!this.tr || this.done) return;
    if (this.nextT < this.ac.currentTime - 0.05){ this.nextT = this.ac.currentTime + 0.05; }   // timers were throttled: skip ahead, never burst
    while (this.nextT < until && !this.done){ this.steps = (this.steps || 0) + 1; this.stepAt(this.nextT); this.nextT += this.spb; this.advance(); }
  }
  advance(){
    const tr = this.tr, sec = tr.sec[tr.order[this.si]];
    if (++this.st < 16) return;
    this.st = 0; if (++this.bar < sec.bars) return;
    this.bar = 0; if (++this.si < tr.order.length) return;
    if (tr.once){ this.done = true; this.endT = this.nextT; return; }
    this.si = tr.loop || 0;
  }
  stepAt(t){
    const tr = this.tr, sec = tr.sec[tr.order[this.si]], s = this.st, b = this.bar, spb = this.spb, last = b === sec.bars - 1;
    const ch = parseChord(sec.prog[b % sec.prog.length]), cut = sec.cut === undefined ? 1 : sec.cut;
    const sw = (s % 2) ? spb * (tr.swing || 0) : 0, T = t + sw;
    const dr = DRUMS[sec.drums || 'none'], fillNow = sec.fill && last && s >= 12, buildNow = sec.build && last;
    // drums
    if (s === 0 && b === 0 && sec.crash !== false && sec.drums && sec.drums !== 'none') this.crash(t, 0.16);
    if (buildNow){
      if (s % 4 === 0) this.kick(t, 0.85);
      if (s >= 8 || s % 2 === 0) this.snare(t, 0.12 + 0.3 * s / 15);
    } else if (fillNow){
      this.tom(t, [190, 160, 130, 100][s - 12], 0.5); if (s === 12) this.kick(t, 0.9); this.snare(t, 0.08);
    } else {
      if (dr.k[s] === 'x') this.kick(t, 0.66);
      if (dr.s[s] === 'x') this.snare(t, 0.55);
      if (dr.c && dr.c[s] === 'x') this.clap(t, 0.32);
      if (dr.o[s] === 'x') this.hat(T, 0.16, true, 0.25);
      else if (dr.h[s] === 'x') this.hat(T, s % 4 === 0 ? 0.14 : s % 2 ? 0.08 : 0.11, false, -0.2);
    }
    // bass
    const bm = ch.bass, bp = sec.bass, bv = 0.085, bri = tr.bassBright || 0.5;
    if (bp === 'long'){ if (s === 0) this.bass(t, bm, spb * 15, bv * 0.8, 0.2); }
    else if (bp === 'oct8'){ if (s % 2 === 0) this.bass(t, bm + (s % 4 === 2 ? 12 : 0), spb * 1.6, bv, bri); }
    else if (bp === 'pulse8'){ if (s % 2 === 0) this.bass(t, bm, spb * 1.5, bv * (s % 4 === 0 ? 1 : 0.8), bri); }
    else if (bp === 'pulse16'){ this.bass(t, bm + (s % 8 === 6 ? 12 : 0), spb * 0.8, bv * (s % 4 === 0 ? 1 : 0.72), bri); }
    else if (bp === 'gallop'){ if (s % 4 !== 1) this.bass(t, bm + (s % 8 === 7 ? 12 : 0), spb * (s % 4 === 0 ? 1.6 : 0.8), bv * (s % 4 === 0 ? 1 : 0.78), bri); }
    // pads (chord per bar)
    if (sec.pad && s === 0) this.pad(t, ch.pad, spb * 16, (tr.padVol || 0.022) * 1.6, cut);
    // arp
    if (sec.arp){
      const pat = ARPS[sec.arp], rate = sec.arpRate || 1;   // 1 = 16ths, 2 = 8ths
      if (s % rate === 0){ const i = pat[(s / rate) % pat.length] % ch.pool.length; this.arp(T, ch.pool[i] + (tr.arpOct || 0), spb * rate * 0.9, (tr.arpVol || 0.05) * 1.5 * (s % 4 === 0 ? 1.15 : 1), (s / rate) % 2 ? 0.35 : -0.35, tr.arpWave || 'square', cut); }
    }
    // lead
    if (sec.mel && s % 2 === 0){
      const i = (b * 8 + s / 2) % sec.mel.n, e = sec.mel.ev[i];
      if (e) this.lead(t, e.m + (sec.oct || 0), e.len * spb * 2 - 0.02, (tr.leadVol || 0.075) * 1.5, sec.leadKind || tr.lead || 'saw');
    }
  }
}
