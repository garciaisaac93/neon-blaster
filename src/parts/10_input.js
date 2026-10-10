// ---------------------------------------------------------------- input: keyboard, touch, gamepad
const keys = {}, touchHeld = { tL: 0, tR: 0, tD: 0, tA: 0, tB: 0 };
let pendSw = 0, padPrev = {}; const latch = { j: 0, f: 0 };   // quick taps shorter than a frame still register
const KMAP = { ArrowLeft: 'l', KeyA: 'l', ArrowRight: 'r', KeyD: 'r', ArrowDown: 'd', KeyS: 'd', Space: 'j', KeyZ: 'j', KeyK: 'j', ArrowUp: 'j', KeyW: 'j', KeyX: 'f', KeyJ: 'f', KeyC: 'f' };
window.addEventListener('keydown', e => {
  Sfx.init();
  const c = e.code;
  if (KMAP[c] || c === 'Space') e.preventDefault();
  if (c === 'KeyM'){ Sfx.setMuted(!Sfx.muted); return; }
  if (state === 'title'){ if (c === 'Enter' || c === 'Space'){ $('startBtn').click(); } return; }
  if (state === 'select'){ if (c === 'Escape') goTitle(); if (c === 'Enter'){ const n = [...Array(NLV).keys()].reverse().find(i => unlocked(i)); startLevel(n || 0); } return; }
  if (state === 'pause'){ if (c === 'KeyP' || c === 'Escape' || c === 'Enter') resumeGame(); return; }
  if (state === 'result'){ if (c === 'Enter' || c === 'Space') $('rNext').click(); return; }
  if (state !== 'play') return;
  if (c === 'KeyP' || c === 'Escape'){ pauseGame(); return; }
  if (e.repeat) return;
  if (c === 'KeyQ') pendSw = -1;
  else if (c === 'KeyE') pendSw = 1;
  else if (/^Digit[1-5]$/.test(c)){ const k = Sim.SUIT_ORDER[+c[5] - 1]; if (S && S.suits.includes(k)) pendSw = 10 + (+c[5] - 1); else if (S) ftext(S.p.x + 11, S.p.y - 24, 'SUIT LOCKED', '#8a80c0'); }
  if (KMAP[c] && KMAP[c] in latch) latch[KMAP[c]] = 1;
  if (KMAP[c]) keys[KMAP[c]] = (keys[KMAP[c]] || 0) | (1 << (Object.keys(KMAP).indexOf(c) % 31));
});
window.addEventListener('keyup', e => { const k = KMAP[e.code]; if (k) keys[k] = (keys[k] || 0) & ~(1 << (Object.keys(KMAP).indexOf(e.code) % 31)); });
// ---- touch controls
// Touch events are the source of truth on phones: on EVERY touchstart/move/end/cancel the held buttons are rebuilt from the
// complete e.touches list, so a finger whose touchend/pointerup got lost (iOS long-press callout, system gesture, alert...)
// is simply missing from the next list and its button is released. Pointer events are only used for pens / non-touch-event browsers.
const hasTE = 'ontouchstart' in window;
const TBS = ['tL', 'tR', 'tD', 'tA', 'tB', 'tS'];
const tptr = new Map();    // pointerId  -> control (pen / browsers without touch events)
const ttch = new Map();    // touch.identifier -> control
let liveTouches = 0;       // e.touches.length from the latest touch event
function tbAt(x, y){
  for (const id of TBS){ const el = $(id); if (!el) continue; const r = el.getBoundingClientRect(); if (!r.width) continue; const pad = 10; if (x >= r.left - pad && x <= r.right + pad && y >= r.top - pad && y <= r.bottom + pad) return id; }
  return null;
}
function refreshTouch(){
  for (const k in touchHeld) touchHeld[k] = 0;
  const all = [...tptr.values(), ...ttch.values()];
  for (const id of all) if (id && id in touchHeld) touchHeld[id] = 1;
  for (const id of TBS){ const el = $(id); if (el) el.classList.toggle('down', !!touchHeld[id] || (id === 'tS' && all.includes('tS'))); }
}
function releaseAllTouch(){ tptr.clear(); ttch.clear(); liveTouches = 0; refreshTouch(); }
function releaseAllInput(){ for (const k in keys) keys[k] = 0; releaseAllTouch(); }
function onTouch(e){
  const fresh = new Set(); if (e.type === 'touchstart') for (const t of e.changedTouches) fresh.add(t.identifier);
  const next = new Map(); let mine = false;
  for (const t of e.touches){
    const tid = t.identifier;
    if (ttch.has(tid)){
      const was = ttch.get(tid); mine = true;
      if (was === 'tS'){ next.set(tid, 'tS'); continue; }
      const id = tbAt(t.clientX, t.clientY); next.set(tid, id === 'tS' ? null : id);   // slide between ◀ ▶; sliding off releases
    } else if (fresh.has(tid) && state === 'play'){
      const id = tbAt(t.clientX, t.clientY); if (!id) continue;
      next.set(tid, id); mine = true; if (id === 'tS') pendSw = 1;
    }
  }
  for (const t of e.changedTouches) if (ttch.has(t.identifier)) mine = true;
  ttch.clear(); for (const [k, v] of next) ttch.set(k, v);
  liveTouches = e.touches.length;
  if (!liveTouches) tptr.clear();
  refreshTouch();
  if (mine && e.cancelable) e.preventDefault();   // no callout / selection / synthetic mouse / dbl-tap zoom on the pad
}
for (const ev of ['touchstart', 'touchmove', 'touchend', 'touchcancel']) window.addEventListener(ev, onTouch, { passive: false, capture: true });
window.addEventListener('pointerdown', e => {
  Sfx.init();
  if (e.pointerType !== 'mouse' && !(e.target && e.target.closest && e.target.closest('.fsb'))) autoFs();
  if (e.pointerType === 'mouse' || state !== 'play') return;
  const id = tbAt(e.clientX, e.clientY); if (!id) return;
  if (e.cancelable) e.preventDefault();
  if (hasTE && e.pointerType === 'touch') return;      // handled by the touch-event path above
  tptr.set(e.pointerId, id); if (id === 'tS') pendSw = 1;
  refreshTouch();
}, { passive: false });
window.addEventListener('pointermove', e => {
  if (!tptr.has(e.pointerId)) return;
  const id = tbAt(e.clientX, e.clientY), was = tptr.get(e.pointerId);
  if (was === 'tS') return;
  if (id !== was && id !== 'tS'){ tptr.set(e.pointerId, id); refreshTouch(); }
});
const endPtr = e => { if (tptr.delete(e.pointerId)) refreshTouch(); };
for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) window.addEventListener(ev, endPtr);
// anything that can swallow a touchend releases everything
window.addEventListener('blur', releaseAllInput);
window.addEventListener('pagehide', releaseAllInput);
document.addEventListener('visibilitychange', () => { if (document.hidden) releaseAllInput(); });
window.addEventListener('contextmenu', e => { releaseAllTouch(); if (!(e.target && e.target.tagName === 'INPUT')) e.preventDefault(); }, { capture: true });
window.addEventListener('orientationchange', releaseAllTouch);
if (screen.orientation && screen.orientation.addEventListener) screen.orientation.addEventListener('change', releaseAllTouch);
// watchdog (every input poll): nothing touching the screen / not playing / page hidden => no virtual button may stay held
function touchWatchdog(){
  if (!tptr.size && !ttch.size) return;
  if (state !== 'play' || document.hidden) return releaseAllTouch();
  if (ttch.size && liveTouches === 0){ ttch.clear(); refreshTouch(); }
}
function padState(){
  const out = { l: 0, r: 0, d: 0, j: 0, f: 0 };
  const pads = navigator.getGamepads ? navigator.getGamepads() : [];
  for (const gp of pads){
    if (!gp) continue;
    const bt = i => gp.buttons[i] && gp.buttons[i].pressed;
    const ax = gp.axes[0] || 0, ay = gp.axes[1] || 0;
    if (ax < -0.4 || bt(14)) out.l = 1; if (ax > 0.4 || bt(15)) out.r = 1; if (ay > 0.55 || bt(13)) out.d = 1;
    if (bt(0) || bt(12)) out.j = 1; if (bt(1) || bt(2) || bt(7)) out.f = 1;
    const edge = i => bt(i) && !padPrev[gp.index + ':' + i];
    if (edge(4)) pendSw = -1; if (edge(5)) pendSw = 1;
    if (edge(9)){ if (state === 'play') pauseGame(); else if (state === 'pause') resumeGame(); else if (state === 'title') $('startBtn').click(); else if (state === 'result') $('rNext').click(); }
    if (edge(0) && state === 'title') $('startBtn').click();
    for (let i = 0; i < gp.buttons.length; i++) padPrev[gp.index + ':' + i] = bt(i);
  }
  return out;
}
let testHold = null;   // test hook: forced held inputs
function liveInput(){
  touchWatchdog();
  const g = padState(), th = touchHeld;
  const inp = { l: +!!(keys.l || th.tL || g.l), r: +!!(keys.r || th.tR || g.r), u: 0, d: +!!(keys.d || th.tD || g.d), j: +!!(keys.j || th.tA || g.j || latch.j), f: +!!(keys.f || th.tB || g.f || latch.f), sw: pendSw };
  latch.j = latch.f = 0;
  if (testHold) Object.assign(inp, testHold);
  pendSw = 0;
  return inp;
}
