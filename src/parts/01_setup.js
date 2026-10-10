(() => {
'use strict';
const Sim = window.NeonSim, T = Sim.T, DT = Sim.DT;
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const $ = id => document.getElementById(id);
const TAU = Math.PI * 2;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a, b) => a + Math.random() * (b - a);
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const ease = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
function mulberry32(a){ return function(){ a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const isTouch = (window.matchMedia && matchMedia('(pointer: coarse)').matches) || ('ontouchstart' in window && navigator.maxTouchPoints > 0);
if (isTouch) document.body.classList.add('touch');
const C = { cy: '#29f0ff', mg: '#ff2bd6', pu: '#9b4dff', pink: '#ff5ea8', yel: '#ffd76a', org: '#ff9a3d', am: '#ffb347', red: '#ff3b5c', grn: '#5dff9e' };
// ---------------------------------------------------------------- view
let VW = 960, VH = 540, SCALE = 1, DPR = 1, RS = 1, GROUND = 430, PORTRAIT = false;
const b1 = document.createElement('canvas'), b1c = b1.getContext('2d');
const b2 = document.createElement('canvas'), b2c = b2.getContext('2d');
let layersDirty = true, tilesDirty = true;
const ZOOM = 1.42; let ZOOMED = false;   // gameplay camera zoom: the world view is 1/1.42 of the menu view, so the Ronin reads ~1.5x bigger
function setZoom(on){ if (ZOOMED !== on){ ZOOMED = on; resize(); } }
function resize(){
  const cw = innerWidth, ch = innerHeight;
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  PORTRAIT = cw < ch;
  let s;
  const z = ZOOMED ? ZOOM : 1, BH = 540 / z, MW = 760 / z, PW = 640 / z;
  if (!PORTRAIT){ s = ch / BH; VW = cw / s; VH = BH; if (VW < MW){ VW = MW; s = cw / MW; VH = ch / s; } }
  else { s = cw / PW; VW = PW; VH = ch / s; }
  SCALE = s; RS = SCALE * DPR;
  canvas.width = Math.round(cw * DPR); canvas.height = Math.round(ch * DPR);
  b1.width = Math.max(1, canvas.width >> 2); b1.height = Math.max(1, canvas.height >> 2);
  b2.width = Math.max(1, canvas.width >> 3); b2.height = Math.max(1, canvas.height >> 3);
  layersDirty = true; tilesDirty = true;
  if (typeof initAtmos === 'function') initAtmos();
  if (typeof onResize === 'function') onResize();
}
let resizeT = 0;
function queueResize(){ clearTimeout(resizeT); resizeT = setTimeout(resize, 60); }
window.addEventListener('resize', queueResize);
window.addEventListener('orientationchange', () => { queueResize(); setTimeout(resize, 350); });   // iOS reports the new size late
if (window.visualViewport) visualViewport.addEventListener('resize', queueResize);
// ---------------------------------------------------------------- fullscreen + landscape lock (mobile)
const fsEl = () => document.fullscreenElement || document.webkitFullscreenElement;
const fsSupported = !!(document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen);
function enterFs(){
  const el = document.documentElement;
  try {
    if (!fsEl()){ const r = el.requestFullscreen ? el.requestFullscreen({ navigationUI: 'hide' }) : el.webkitRequestFullscreen && el.webkitRequestFullscreen(); if (r && r.catch) r.catch(() => {}); }
    if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => {});
  } catch (_){}
}
function exitFs(){ try { const r = document.exitFullscreen ? document.exitFullscreen() : document.webkitExitFullscreen && document.webkitExitFullscreen(); if (r && r.catch) r.catch(() => {}); } catch (_){} }
function toggleFs(){ if (fsEl()) exitFs(); else enterFs(); }
let fsAuto = isTouch;   // first tap on a phone/tablet goes fullscreen once; afterwards the button decides
function autoFs(){ if (fsAuto && fsSupported){ fsAuto = false; enterFs(); } }
for (const ev of ['fullscreenchange', 'webkitfullscreenchange']) document.addEventListener(ev, () => { document.body.classList.toggle('fs', !!fsEl()); queueResize(); setTimeout(resize, 300); });
if (!fsSupported) document.body.classList.add('nofs');
// no page scroll / bounce / pinch / long-press menus
document.addEventListener('touchmove', e => { if (!(e.target && e.target.tagName === 'INPUT')) e.preventDefault(); }, { passive: false });
for (const ev of ['gesturestart', 'gesturechange', 'contextmenu', 'selectstart', 'dblclick']) document.addEventListener(ev, e => { if (!(e.target && e.target.tagName === 'INPUT')) e.preventDefault(); }, { passive: false });
// ---------------------------------------------------------------- fonts / misc
const CJK_FONT = '"Hiragino Kaku Gothic ProN","Yu Gothic","Meiryo","Noto Sans CJK JP","Noto Sans JP","Noto Serif CJK JP","MS Gothic",sans-serif';
const hasCJK = (() => {
  try {
    const c = document.createElement('canvas'); c.width = c.height = 24; const x = c.getContext('2d', { willReadFrequently: true });
    const draw = ch => { x.clearRect(0, 0, 24, 24); x.fillStyle = '#fff'; x.font = '20px ' + CJK_FONT; x.fillText(ch, 2, 20); return x.getImageData(0, 0, 24, 24).data.join(''); };
    const a = draw('未'), b = draw('来'), tofu = draw('\uFFFF');
    return a !== b && a !== tofu;
  } catch(e){ return false; }
})();
const SIGN_WORDS = hasCJK ? ['ラーメン','東京','ネオン','電脳','カラオケ','居酒屋','ロニン','夜','寿司','新宿','秋葉原','未来'] : ['RAMEN','TOKYO','NEON','SUSHI','KARAOKE','RONIN','NITE','AKIBA','2088','SHINJUKU'];
const BACKS = {};   // photographic Tokyo backdrops (pre-darkened, seamless loop)
for (const [k, src] of [['street', STREET_SRC], ['roof', ROOF_SRC]]){ const im = new Image(); im.onload = () => { BACKS[k] = im; }; im.src = src; }
function roundRect(g, x, y, w, h, r){ r = Math.max(0, Math.min(r, w / 2, h / 2)); g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function hexA(hex, a){ const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; }
function hexRGB(hex){ const n = parseInt(hex.slice(1), 16); return `${n >> 16},${(n >> 8) & 255},${n & 255}`; }
let lowQ = false, noBloom = false;
function glow(col, blur){ if (lowQ) return; ctx.shadowColor = col; ctx.shadowBlur = blur; }
function noGlow(){ ctx.shadowBlur = 0; }
let globalT = 0, cam = 0;           // cam = horizontal parallax origin used by the shared scene code
const CAM = { x: 0, y: 0, look: 0 };
let shakeX = 0, shakeY = 0, shakeAmt = 0;
