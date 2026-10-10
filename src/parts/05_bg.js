// ---------------------------------------------------------------- Neo-Tokyo backgrounds (photo backdrops + drawn animated props)
let LW = 1000, LH = 544, THEME = 'street';
let trainT = 6, overT = 2.5, maglevT = 1.5;
const wrapS = (v, span) => ((v % span) + span) % span;
const hash1 = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const JP = () => hasCJK ? CJK_FONT : 'ui-monospace,Menlo,monospace';

// ---- photo backdrop (seamless strip) with a drawn building column hiding the loop seam
function backdrop(key, par, yBottom, H, sky, tint){
  const im = BACKS[key], top = yBottom - H;
  if (top > 0){ ctx.fillStyle = sky; ctx.fillRect(0, 0, VW, top + 2); }
  if (!im) return;
  const s = H / im.height, W = im.width * s, base = cam * par, off = wrapS(base, W);
  for (let x = -off; x < VW; x += W) ctx.drawImage(im, x, top, W + 0.6, H);
  for (let x = -off; x < VW + 120 * s; x += W) seamTower(x + 62 * s, yBottom, H, s, Math.round((base + x + off) / W));
  const tg = ctx.createLinearGradient(0, top, 0, top + 70); tg.addColorStop(0, sky); tg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = tg; ctx.fillRect(0, top - 1, VW, 71);
  if (tint){ ctx.fillStyle = tint; ctx.fillRect(0, Math.max(0, top), VW, Math.min(VH, yBottom) - Math.max(0, top)); }
}
function seamTower(cx, yb, H, s, k){
  if (cx < -120 * s || cx > VW + 120 * s) return;
  const w = 128 * s, x = cx - w / 2, top = yb - H * (0.78 + hash1(k) * 0.12);
  const g = ctx.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, '#0d0920'); g.addColorStop(0.6, '#08061a'); g.addColorStop(1, '#050412');
  ctx.fillStyle = g; ctx.fillRect(x, top, w, yb - top);
  ctx.fillRect(x + w * 0.2, top - 16 * s, w * 0.5, 16 * s); ctx.fillRect(x + w * 0.62, top - 46 * s, 3, 46 * s);
  ctx.fillStyle = Math.sin(globalT * 3 + k) > 0 ? '#ff4b6e' : '#4a1020'; ctx.fillRect(x + w * 0.62 - 1.5, top - 48 * s, 6, 4);
  ctx.fillStyle = 'rgba(255,60,220,0.35)'; ctx.fillRect(x, top, 1.5, yb - top);
  for (let wy = top + 14 * s, r = 0; wy < yb - 10; wy += 13 * s, r++) for (let c = 0; c < 6; c++){
    const v = hash1(k * 97 + r * 7 + c); if (v < 0.3){ ctx.fillStyle = v < 0.1 ? 'rgba(255,200,140,0.55)' : 'rgba(120,200,255,0.3)'; ctx.fillRect(x + 12 * s + c * 18 * s, wy, 8 * s, 6 * s); }
  }
  vSign(x + w - 8 * s, top + 40 * s, SIGN_WORDS[k % SIGN_WORDS.length], [C.mg, C.cy, '#ff4b4b', C.yel][k & 3], 15 * s + 3, k);
}
// ---- vertical neon kanji sign with per-character flicker
function vSign(x, y, word, col, fs, seed){
  const ch = Array.from(word), n = ch.length, sw = fs + 12, sh = n * (fs + 4) + 12;
  ctx.fillStyle = 'rgba(6,3,16,0.92)'; roundRect(ctx, x, y, sw, sh, 4); ctx.fill();
  ctx.strokeStyle = col; ctx.lineWidth = 1.6; glow(col, 10); ctx.stroke();
  ctx.font = `bold ${fs}px ${JP()}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (let i = 0; i < n; i++){
    const f = hash1(seed * 13 + i + Math.floor(globalT * 9) * 0.37), off = f > 0.985 || (i === (seed % n) && Math.sin(globalT * 1.7 + seed) > 0.93);
    ctx.fillStyle = off ? hexA(col, 0.25) : '#fff'; glow(col, off ? 0 : 12); ctx.fillText(ch[i], x + sw / 2, y + 8 + fs / 2 + i * (fs + 4));
  }
  noGlow();
}
// ---- red paper lantern (chōchin)
function lantern(x, y, r, sw, txt, col = '#ff3b2f'){
  ctx.save(); ctx.translate(x, y); ctx.rotate(sw);
  const cy = 5 + r * 1.25;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const hg = ctx.createRadialGradient(0, cy, r * 0.3, 0, cy, r * 3.4); hg.addColorStop(0, hexA(col, 0.35)); hg.addColorStop(1, hexA(col, 0));
  ctx.fillStyle = hg; ctx.fillRect(-r * 3.4, cy - r * 3.4, r * 6.8, r * 6.8); ctx.restore();
  ctx.strokeStyle = '#120a14'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 5); ctx.stroke();
  const bg = ctx.createRadialGradient(-r * 0.25, cy - r * 0.3, r * 0.1, 0, cy, r * 1.3); bg.addColorStop(0, '#ffe6b0'); bg.addColorStop(0.45, col); bg.addColorStop(1, '#6a0c14');
  ctx.fillStyle = bg; ctx.beginPath(); ctx.ellipse(0, cy, r, r * 1.22, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(90,10,10,0.45)'; ctx.lineWidth = 0.8;
  for (let k = -2; k <= 2; k++){ const yy = cy + k * r * 0.38, hw = r * Math.sqrt(Math.max(0, 1 - (k * 0.38 / 1.22) ** 2)); ctx.beginPath(); ctx.moveTo(-hw, yy); ctx.quadraticCurveTo(0, yy + r * 0.12, hw, yy); ctx.stroke(); }
  ctx.fillStyle = '#17101a'; ctx.fillRect(-r * 0.55, cy - r * 1.3, r * 1.1, r * 0.22); ctx.fillRect(-r * 0.55, cy + r * 1.1, r * 1.1, r * 0.22);
  if (txt && r > 6){ ctx.fillStyle = 'rgba(30,0,0,0.8)'; ctx.font = `bold ${Math.round(r * 0.9)}px ${JP()}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, 0, cy + 1); }
  ctx.strokeStyle = '#ffb347'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, cy + r * 1.32); ctx.lineTo(0, cy + r * 1.32 + r * 0.6); ctx.stroke();
  ctx.restore();
}
function lanternString(x0, x1, y, n, r, seed){
  const sag = 18 + (x1 - x0) * 0.04;
  ctx.strokeStyle = 'rgba(20,12,30,0.9)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x0, y); ctx.quadraticCurveTo((x0 + x1) / 2, y + sag * 2, x1, y); ctx.stroke();
  const words = hasCJK ? ['祭', '酒', '麺', '夜', '灯', '寿'] : [];
  for (let i = 1; i <= n; i++){
    const t = i / (n + 1), lx = x0 + (x1 - x0) * t, ly = y + sag * 4 * t * (1 - t);
    lantern(lx, ly, r, Math.sin(globalT * 1.5 + seed + i * 0.9) * 0.1, words[(seed + i) % words.length], (seed + i) % 5 === 0 ? '#ff7a2f' : '#ff3b2f');
  }
}
// ---- neon torii gate
function torii(x, yb, h, a = 1){
  const w = h * 1.25, pw = h * 0.075, px = w * 0.32, red = '#c4202c';
  ctx.globalAlpha = a;
  ctx.fillStyle = red; glow('#ff3b3b', 8);
  for (const sx of [-1, 1]){ ctx.beginPath(); ctx.moveTo(x + sx * px - pw * 0.6, yb); ctx.lineTo(x + sx * (px - h * 0.03) - pw * 0.45, yb - h * 0.86); ctx.lineTo(x + sx * (px - h * 0.03) + pw * 0.45, yb - h * 0.86); ctx.lineTo(x + sx * px + pw * 0.6, yb); ctx.fill(); }
  ctx.fillRect(x - w * 0.42, yb - h * 0.72, w * 0.84, h * 0.06);   // nuki
  ctx.beginPath(); ctx.moveTo(x - w * 0.56, yb - h * 0.99); ctx.quadraticCurveTo(x, yb - h * 0.86, x + w * 0.56, yb - h * 0.99); ctx.lineTo(x + w * 0.5, yb - h * 0.86); ctx.quadraticCurveTo(x, yb - h * 0.79, x - w * 0.5, yb - h * 0.86); ctx.fill();   // kasagi
  noGlow(); ctx.fillStyle = '#16080c'; ctx.beginPath(); ctx.moveTo(x - w * 0.58, yb - h * 1.02); ctx.quadraticCurveTo(x, yb - h * 0.9, x + w * 0.58, yb - h * 1.02); ctx.lineTo(x + w * 0.56, yb - h * 0.97); ctx.quadraticCurveTo(x, yb - h * 0.86, x - w * 0.56, yb - h * 0.97); ctx.fill();
  ctx.fillStyle = '#16080c'; ctx.fillRect(x - h * 0.09, yb - h * 0.86, h * 0.18, h * 0.15);
  ctx.strokeStyle = C.yel; ctx.lineWidth = 1.2; glow(C.yel, 8); ctx.strokeRect(x - h * 0.09, yb - h * 0.86, h * 0.18, h * 0.15);
  ctx.fillStyle = '#ffe9b0'; ctx.font = `bold ${Math.round(h * 0.06)}px ${JP()}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (hasCJK){ ctx.fillText('未', x, yb - h * 0.82); ctx.fillText('来', x, yb - h * 0.755); }
  noGlow();
  ctx.strokeStyle = 'rgba(255,90,90,0.8)'; ctx.lineWidth = 1.5; glow('#ff2b3b', 12);
  ctx.beginPath(); ctx.moveTo(x - w * 0.56, yb - h * 0.99); ctx.quadraticCurveTo(x, yb - h * 0.86, x + w * 0.56, yb - h * 0.99); ctx.stroke(); noGlow();
  ctx.globalAlpha = 1;
}
// ---- vending machine
function vending(x, yb, col, k){
  const w = 40, h = 74, y = yb - h;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const lg = ctx.createRadialGradient(x + w / 2, yb, 2, x + w / 2, yb, 70); lg.addColorStop(0, hexA(col, 0.32)); lg.addColorStop(1, hexA(col, 0));
  ctx.fillStyle = lg; ctx.fillRect(x - 50, yb - 70, w + 100, 80); ctx.restore();
  ctx.fillStyle = '#1a1830'; roundRect(ctx, x, y, w, h, 3); ctx.fill();
  ctx.fillStyle = col; ctx.fillRect(x + 2, y + 2, w - 4, 7);
  ctx.fillStyle = 'rgba(210,240,255,0.85)'; glow(col, 10); ctx.fillRect(x + 4, y + 12, w - 8, 36); noGlow();
  const cols = ['#ff4b6e', '#2bd6ff', '#ffd76a', '#5dff9e', '#ff9a3d', '#b49cff'];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++){ ctx.fillStyle = cols[(k + r * 5 + c * 2) % 6]; ctx.fillRect(x + 6 + c * 6.2, y + 15 + r * 11, 4, 8); }
  ctx.fillStyle = '#0a0a16'; ctx.fillRect(x + 4, y + 52, w - 8, 6); ctx.fillRect(x + 8, y + 62, w - 16, 8);
  ctx.fillStyle = Math.sin(globalT * 4 + k) > 0 ? C.grn : '#164'; ctx.fillRect(x + w - 9, y + 52, 3, 3);
}
// ---- overhead train on an elevated track (street)
function overheadRail(y, par){
  const off = cam * par;
  ctx.fillStyle = '#0b0818'; ctx.fillRect(0, y, VW, 9);
  ctx.fillStyle = 'rgba(255,60,200,0.45)'; ctx.fillRect(0, y + 9, VW, 1.2);
  ctx.strokeStyle = 'rgba(20,14,40,0.8)'; ctx.lineWidth = 1.5; ctx.beginPath();
  for (let x = -wrapS(off, 30); x < VW; x += 30){ ctx.moveTo(x, y + 9); ctx.lineTo(x + 15, y + 18); ctx.lineTo(x + 30, y + 9); }
  ctx.moveTo(0, y + 18); ctx.lineTo(VW, y + 18); ctx.stroke();
  for (let x = -wrapS(off, 620); x < VW; x += 620){ ctx.fillStyle = '#090614'; ctx.fillRect(x + 250, y + 18, 14, 900); }
  overT -= 1 / 60;
  if (overT < 0){
    const len = 980, tx = VW + 60 - (-overT) * 330;
    if (tx < -len - 60) overT = rand(7, 11);
    else {
      for (let c = 0; c < 4; c++){
        const cx = tx + c * 245;
        ctx.fillStyle = '#2a2648'; roundRect(ctx, cx, y - 46, 238, 46, c === 0 ? 14 : 4); ctx.fill();
        ctx.fillStyle = '#3a3460'; ctx.fillRect(cx, y - 46, 238, 4);
        for (let wv = 0; wv < 7; wv++){ ctx.fillStyle = (c * 7 + wv) % 4 === 1 ? 'rgba(255,190,240,0.85)' : 'rgba(255,225,170,0.85)'; glow('#ffd9a0', 8); ctx.fillRect(cx + 14 + wv * 31, y - 37, 22, 15); }
        noGlow(); ctx.fillStyle = C.mg; ctx.fillRect(cx, y - 16, 238, 2.5);
      }
      ctx.fillStyle = '#fff'; glow('#fff', 18); ctx.fillRect(tx + 2, y - 20, 8, 5); noGlow();
    }
  }
}
// ---- holographic koi
const KOI = [{ x0: 200, v: 16, y: 0.2, s: 1.15, c: '#7ff6ff', c2: '#ff7ad9', ph: 0 }, { x0: 900, v: -11, y: 0.33, s: 0.75, c: '#ff8ad8', c2: '#ffd76a', ph: 2 }, { x0: 1500, v: 8, y: 0.12, s: 0.55, c: '#a98bff', c2: '#7ff6ff', ph: 4 }];
function drawKoi(x, y, s, dir, col, col2, t){
  ctx.save(); ctx.translate(x, y); ctx.scale(dir * s, s); ctx.globalCompositeOperation = 'lighter';
  const N = 12, pts = [];
  for (let i = 0; i <= N; i++){ const u = i / N; pts.push([30 - u * 80, Math.sin(t * 2.4 - u * 3.2) * (2 + u * 7)]); }
  const wid = u => 13 * Math.sin(Math.PI * Math.min(1, 0.12 + u * 1.05)) * (1 - u * 0.55);
  ctx.beginPath();
  pts.forEach(([px, py], i) => { const u = i / N; ctx.lineTo(px, py - wid(u)); });
  for (let i = N; i >= 0; i--){ const u = i / N; ctx.lineTo(pts[i][0], pts[i][1] + wid(u)); }
  ctx.closePath();
  const g = ctx.createLinearGradient(30, 0, -50, 0); g.addColorStop(0, hexA(col, 0.32)); g.addColorStop(1, hexA(col2, 0.16));
  ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = hexA(col, 0.85); ctx.lineWidth = 1.4 / s; glow(col, 14); ctx.stroke();
  const [tx, ty] = pts[N], ta = Math.sin(t * 2.4 - 3.4) * 0.5;   // tail
  ctx.beginPath(); ctx.moveTo(tx, ty); ctx.quadraticCurveTo(tx - 14, ty - 18 + ta * 10, tx - 26, ty - 20 + ta * 14); ctx.quadraticCurveTo(tx - 16, ty + ta * 6, tx - 26, ty + 20 + ta * 14); ctx.quadraticCurveTo(tx - 14, ty + 18 + ta * 10, tx, ty); ctx.fillStyle = hexA(col2, 0.22); ctx.fill(); ctx.stroke();
  for (const [i, sy] of [[3, 1], [3, -1], [6, 1]]){ const [fx, fy] = pts[i], fa = Math.sin(t * 3 + i) * 0.3; ctx.beginPath(); ctx.moveTo(fx, fy + sy * 8); ctx.quadraticCurveTo(fx - 6, fy + sy * (18 + fa * 6), fx - 14, fy + sy * (16 + fa * 8)); ctx.lineTo(fx - 8, fy + sy * 8); ctx.fill(); ctx.stroke(); }
  ctx.fillStyle = hexA('#ffffff', 0.5); ctx.lineWidth = 0.8 / s;   // scales
  for (let i = 2; i < N - 2; i++){ const [px, py] = pts[i], w = wid(i / N) * 0.55; ctx.beginPath(); ctx.arc(px, py - w * 0.4, 2.2, 0.3, Math.PI - 0.3); ctx.arc(px, py + w * 0.5, 2.2, 0.3, Math.PI - 0.3); ctx.stroke(); }
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(22, -3, 1.8, 0, TAU); ctx.fill();
  ctx.strokeStyle = hexA(col, 0.7); ctx.beginPath(); ctx.moveTo(30, 2); ctx.quadraticCurveTo(38, 6, 36, 14); ctx.stroke();
  noGlow(); ctx.restore();
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = hexA(col, 0.5);   // sparkle trail
  for (let k = 0; k < 5; k++){ const ph = (t * 0.7 + k * 0.2) % 1; ctx.globalAlpha = 1 - ph; ctx.fillRect(x - dir * (50 + ph * 60) * s, y + Math.sin(k * 7 + t) * 10 * s, 2, 2); }
  ctx.restore();
}
function drawKois(yTop, yBot){
  for (const k of KOI){
    const span = VW + 500, x = wrapS(k.x0 + globalT * k.v - cam * 0.05, span) - 250, y = yTop + (yBot - yTop) * k.y + Math.sin(globalT * 0.5 + k.ph) * 16;
    drawKoi(x, y, k.s, Math.sign(k.v), k.c, k.c2, globalT + k.ph);
  }
}
// ---- maglev passing over the rooftops
function maglev(y){
  ctx.fillStyle = 'rgba(41,240,255,0.35)'; ctx.fillRect(0, y + 13, VW, 2); ctx.fillStyle = '#0c0a1e'; ctx.fillRect(0, y + 15, VW, 6);
  maglevT -= 1 / 60;
  if (maglevT < 0){
    const len = 760, tx = -len - 40 + (-maglevT) * 520;
    if (tx > VW + 40) maglevT = rand(6, 10);
    else {
      ctx.fillStyle = '#1e2246'; ctx.beginPath(); ctx.moveTo(tx, y + 12); ctx.lineTo(tx + len - 40, y + 12); ctx.quadraticCurveTo(tx + len + 10, y + 10, tx + len - 6, y - 2); ctx.quadraticCurveTo(tx + len - 40, y - 12, tx + len - 70, y - 12); ctx.lineTo(tx, y - 12); ctx.fill();
      ctx.fillStyle = C.cy; glow(C.cy, 10); ctx.fillRect(tx, y + 4, len - 30, 2); noGlow();
      for (let w = 0; w < 22; w++){ ctx.fillStyle = w % 6 === 3 ? 'rgba(255,170,240,0.8)' : 'rgba(190,240,255,0.8)'; ctx.fillRect(tx + 12 + w * 31, y - 7, 20, 7); }
      ctx.fillStyle = '#fff'; glow('#bff', 16); ctx.fillRect(tx + len - 22, y + 1, 9, 3); noGlow();
    }
  }
}
function drawBlimp(x, y){
  ctx.fillStyle = '#1a1533'; ctx.beginPath(); ctx.ellipse(x, y, 90, 26, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#0f0c22'; ctx.fillRect(x - 20, y + 22, 40, 9);
  const sc = ctx.createLinearGradient(x - 50, 0, x + 50, 0); sc.addColorStop(0, C.mg); sc.addColorStop(1, C.cy);
  ctx.globalAlpha = 0.75; ctx.fillStyle = sc; roundRect(ctx, x - 52, y - 12, 104, 24, 6); ctx.fill(); ctx.globalAlpha = 1;
  ctx.fillStyle = '#fff'; ctx.font = `bold 13px ${JP()}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; glow('#fff', 8);
  ctx.fillText(Math.floor(globalT / 3) % 2 ? (hasCJK ? 'ロニン参上' : 'RONIN ♥ YOU') : (hasCJK ? 'ネオ東京' : 'NEO TOKYO'), x, y + 1); noGlow();
  ctx.fillStyle = Math.sin(globalT * 6) > 0 ? '#ff4b6e' : '#400'; ctx.fillRect(x + 86, y - 2, 4, 4);
}
// ---- street-level props: torii, lantern strings and flickering signs (par 0.5)
function streetProps(base){
  const par = 0.5, off = cam * par;
  const sp = 380;
  for (let i = Math.floor((off - 300) / sp); i * sp - off < VW + 300; i++){
    const x = i * sp - off;
    if (i % 4 !== 1) lanternString(x + 40, x + 300, base - 205 - (i & 1) * 18, 4 + (i & 1), 9, i * 3);
    if (i % 3 === 0) vSign(x + 330, base - 240, SIGN_WORDS[wrapS(i, SIGN_WORDS.length)], [C.mg, C.cy, '#ff4b4b', C.yel, C.pu][wrapS(i, 5)], 15, i);
  }
}
function drawBackground(){
  cam = CAM.x;
  if (THEME === 'street'){
    GROUND = 14 * T - CAM.y;
    backdrop('street', 0.1, GROUND - 40, 470, '#05041a', 'rgba(10,5,30,0.22)');
    drawSky(); overheadRail(GROUND - 330, 0.3);
    { const o = cam * 0.3; for (let i = Math.floor((o - 400) / 1700); i * 1700 - o < VW + 400; i++) torii(i * 1700 - o + 760, GROUND - 40, 210, 0.85); }
    drawTiled(layers.shop, 0.36, GROUND - 4, 1);
    streetProps(GROUND - 6);
    drawNear();
    ctx.fillStyle = '#0b0918'; ctx.fillRect(0, GROUND, VW, VH - GROUND + 10);
  } else if (THEME === 'roof'){
    GROUND = 12 * T - CAM.y + 200;
    backdrop('roof', 0.05, GROUND - 40, 560, '#0a0930', 'rgba(10,5,30,0.18)');
    drawSky();
    drawKois(GROUND - 640, GROUND - 260);
    drawBlimp(wrapS(900 - CAM.x * 0.06 + globalT * 12, VW + 400) - 200, GROUND - 520);
    maglev(GROUND - 190);
    drawTiled(layers.roofs, 0.3, GROUND + 6, 1);
    const fg = ctx.createLinearGradient(0, GROUND - 160, 0, VH); fg.addColorStop(0, 'rgba(110,40,170,0)'); fg.addColorStop(0.5, 'rgba(110,40,170,0.3)'); fg.addColorStop(1, 'rgba(255,60,200,0.2)');
    ctx.fillStyle = fg; ctx.fillRect(0, GROUND - 160, VW, VH - GROUND + 160);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 2; i++){
      const bx = wrapS(i * 700 + 300 - CAM.x * 0.15, VW + 600) - 300, a = Math.sin(globalT * 0.4 + i * 2) * 0.35 - Math.PI / 2;
      const lg = ctx.createLinearGradient(bx, GROUND, bx + Math.cos(a) * 600, GROUND + Math.sin(a) * 600); lg.addColorStop(0, 'rgba(140,220,255,0.1)'); lg.addColorStop(1, 'rgba(140,220,255,0)');
      ctx.fillStyle = lg; ctx.beginPath(); ctx.moveTo(bx, GROUND); ctx.lineTo(bx + Math.cos(a - 0.05) * 700, GROUND + Math.sin(a - 0.05) * 700); ctx.lineTo(bx + Math.cos(a + 0.05) * 700, GROUND + Math.sin(a + 0.05) * 700); ctx.fill();
    }
    ctx.restore();
  } else if (THEME === 'tower'){
    const maxY = Math.max(1, LH - VH);
    GROUND = VH * 0.95 + (maxY - CAM.y) * 0.12;
    const sky = ctx.createLinearGradient(0, 0, 0, VH); sky.addColorStop(0, '#04031a'); sky.addColorStop(1, '#0a0930');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, VW, VH);
    backdrop('roof', 0.04, GROUND + 30, 600, 'rgba(0,0,0,0)', 'rgba(10,5,30,0.3)');
    drawSky();
    drawKois(Math.min(GROUND - 700, 0), GROUND - 300);
    drawTiled(layers.roofs, 0.2, GROUND + 60 + (maxY - CAM.y) * 0.05, 1);
    // glass elevator-tower frame (girders + floors), parallax 0.85
    ctx.fillStyle = 'rgba(12,8,30,0.4)'; ctx.fillRect(0, 0, VW, VH);
    const px = -CAM.x * 0.85, py = -CAM.y * 0.85;
    ctx.fillStyle = '#0d0a1e';
    for (let gx = wrapS(px, 220) - 220; gx < VW; gx += 220){ ctx.fillRect(gx, 0, 18, VH); ctx.fillStyle = 'rgba(255,60,200,0.25)'; ctx.fillRect(gx + 17, 0, 1, VH); ctx.fillStyle = '#0d0a1e'; }
    const fy0 = wrapS(py, 256) - 256;
    for (let fy = fy0; fy < VH; fy += 256){
      ctx.fillStyle = '#0d0a1e'; ctx.fillRect(0, fy, VW, 22);
      ctx.fillStyle = 'rgba(155,77,255,0.6)'; ctx.fillRect(0, fy + 22, VW, 1.5);
      const floor = Math.round((LH * 0.85 - (fy - py)) / 256) + 1;
      ctx.font = `bold 14px ${JP()}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      for (let gx = wrapS(px, 660) - 660 + 40; gx < VW; gx += 660){ ctx.fillStyle = hexA(C.cy, 0.7); glow(C.cy, 8); ctx.fillText(hasCJK ? `${floor}階` : `F${String(floor).padStart(2, '0')}`, gx, fy + 11); noGlow(); }
      for (let gx = wrapS(px + 330, 660) - 660; gx < VW; gx += 660) lantern(gx, fy + 22, 8, Math.sin(globalT * 1.3 + fy * 0.01) * 0.08, hasCJK ? '灯' : '');
    }
  } else { // subway: station hall with big windows onto the street above
    const wy0 = 3 * T - CAM.y, wy1 = 13 * T - CAM.y, px = -CAM.x * 0.55;
    const g = ctx.createLinearGradient(0, 0, 0, VH); g.addColorStop(0, '#07060f'); g.addColorStop(0.5, '#120e26'); g.addColorStop(1, '#0a0816');
    ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH);
    backdrop('street', 0.12, wy1 - 50, 400, '#05041a', 'rgba(14,4,40,0.5)');
    // tiled wall with window cut-outs
    const winTop = wy0 + 140, winBot = wy1 - 70;
    ctx.beginPath(); ctx.rect(0, wy0 + 30, VW, wy1 - wy0 - 30);
    for (let x = wrapS(px, 420) - 420; x < VW + 420; x += 420) ctx.rect(x + 60, winTop, 300, winBot - winTop);
    ctx.fillStyle = '#161430'; ctx.fill('evenodd');
    ctx.save(); ctx.clip('evenodd');
    ctx.strokeStyle = 'rgba(120,110,200,0.12)'; ctx.lineWidth = 1; ctx.beginPath();
    for (let y = wy0 + 30; y < wy1; y += 18){ ctx.moveTo(0, y); ctx.lineTo(VW, y); }
    for (let x = wrapS(px, 24); x < VW; x += 24){ ctx.moveTo(x, wy0 + 30); ctx.lineTo(x, wy1); }
    ctx.stroke(); ctx.restore();
    for (let x = wrapS(px, 420) - 420; x < VW + 420; x += 420){ ctx.strokeStyle = 'rgba(41,240,255,0.5)'; ctx.lineWidth = 2; ctx.strokeRect(x + 60, winTop, 300, winBot - winTop); ctx.fillStyle = '#0c0a1c'; ctx.fillRect(x + 207, winTop, 6, winBot - winTop); }
    ctx.fillStyle = C.mg; glow(C.mg, 10); ctx.fillRect(0, wy0 + 120, VW, 3); noGlow();
    ctx.fillStyle = 'rgba(41,240,255,0.5)'; ctx.fillRect(0, wy0 + 128, VW, 1);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (let x = wrapS(px, 900) - 900 + 200; x < VW + 200; x += 900){
      ctx.fillStyle = '#05040c'; roundRect(ctx, x - 110, wy0 + 54, 220, 52, 8); ctx.fill();
      ctx.strokeStyle = C.cy; ctx.lineWidth = 2; glow(C.cy, 12); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.font = `bold 20px ${JP()}`; ctx.fillText(hasCJK ? '地下鉄 · 新宿線' : 'SHINJUKU LINE', x, wy0 + 72); noGlow();
      ctx.font = '10px ui-monospace,Menlo,monospace'; ctx.fillStyle = C.yel; ctx.fillText('MIDNIGHT SUBWAY  ▶ NEO SHINJUKU', x, wy0 + 94);
    }
    for (let x = wrapS(px, 640) - 640 + 520; x < VW + 100; x += 640) vSign(x, wy0 + 150, hasCJK ? '出口' : 'EXIT', C.yel, 15, 3);
    trainT -= 1 / 60;
    if (trainT < 0){
      const tx = VW + 200 - (-trainT) * 1500;
      if (tx < -1800) trainT = rand(9, 14);
      else {
        ctx.fillStyle = '#23203e'; roundRect(ctx, tx, wy0 + 150, 1600, 110, 16); ctx.fill();
        for (let k = 0; k < 16; k++){ ctx.fillStyle = k % 5 === 2 ? 'rgba(255,200,240,0.85)' : 'rgba(180,240,255,0.8)'; glow('#bff', 10); ctx.fillRect(tx + 30 + k * 98, wy0 + 170, 70, 40); }
        noGlow(); ctx.fillStyle = C.mg; ctx.fillRect(tx, wy0 + 222, 1600, 4);
        ctx.fillStyle = '#fff'; glow('#fff', 20); ctx.fillRect(tx + 4, wy0 + 200, 10, 8); noGlow();
      }
    }
    for (let x = wrapS(-CAM.x * 0.8, 340) - 340; x < VW; x += 340){
      const pg = ctx.createLinearGradient(x, 0, x + 46, 0); pg.addColorStop(0, '#1e1a38'); pg.addColorStop(1, '#0c0a1c');
      ctx.fillStyle = pg; ctx.fillRect(x, wy0, 46, wy1 - wy0);
      ctx.fillStyle = hexA(C.cy, 0.55); ctx.fillRect(x + 44, wy0, 2, wy1 - wy0);
      lantern(x + 23, wy0 + 30, 7, Math.sin(globalT + x * 0.01) * 0.05, hasCJK ? '駅' : '');
    }
  }
}
// hanging lamps (subway) drawn in world space after tiles
function drawSubwayLamps(){
  if (THEME !== 'subway') return;
  const y = 3 * T - CAM.y;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let wx = Math.floor(CAM.x / 320) * 320 + 100; wx < CAM.x + VW + 320; wx += 320){
    const x = wx - CAM.x, fl = (Math.sin(globalT * 13 + wx) > 0.97) ? 0.3 : 1;
    const lg = ctx.createLinearGradient(0, y, 0, y + 330); lg.addColorStop(0, `rgba(255,220,180,${0.22 * fl})`); lg.addColorStop(1, 'rgba(255,220,180,0)');
    ctx.fillStyle = lg; ctx.beginPath(); ctx.moveTo(x - 14, y + 6); ctx.lineTo(x + 14, y + 6); ctx.lineTo(x + 110, y + 330); ctx.lineTo(x - 110, y + 330); ctx.fill();
  }
  ctx.restore();
  for (let wx = Math.floor(CAM.x / 320) * 320 + 100; wx < CAM.x + VW + 320; wx += 320){ const x = wx - CAM.x; ctx.fillStyle = '#2a2640'; ctx.fillRect(x - 16, y, 32, 6); ctx.fillStyle = '#ffe9c8'; glow('#ffd9a0', 12); ctx.fillRect(x - 12, y + 5, 24, 2); noGlow(); }
}
