function rGlow(g, col, blur){ if (lowQ) return; g.shadowColor = col; g.shadowBlur = blur; }
function rNoGlow(g){ g.shadowBlur = 0; }
// ---------------------------------------------------------------- RONIN MECH (procedural, angular samurai mech; drawn facing +x, feet at y=0)
const THIGH = 12, SHIN = 11.5, BOOT = 8, UARM = 9, FARM = 10;
let OLW = 1.6;   // outline width (thicker when drawn small so the silhouette stays crisp)
const OUTL = '#101117';
function shade(hex, k){ const [r, g, b] = hexRGB(hex).split(',').map(Number); const f = v => Math.max(0, Math.min(255, Math.round(k < 1 ? v * k : v + (255 - v) * (k - 1)))); return `rgb(${f(r)},${f(g)},${f(b)})`; }
function mkPal(o){
  const p = Object.assign({ metal: ['#555a66', '#2a2d36', '#1a1c23'], line: '#ff4fd8' }, o);
  p.aB = p.armor.map(c => shade(c, 0.62)); p.mB = p.metal.map(c => shade(c, 0.7)); p.scB = p.scarf.map(c => shade(c, 0.75));
  p.ar = hexRGB(p.glow); return p;
}
const SUITPAL = {
  ronin: mkPal({ armor: ['#ece8e4', '#bdb7b3', '#807a78'], trim: '#e0559a', visor: '#ff3bd0', glow: '#ff4fd8', scarf: ['#b56584', '#7c3b58'], emblem: '#ff7ab8' }),
  volt:  mkPal({ armor: ['#eef1f5', '#bfc6d1', '#7d8695'], trim: '#2aa8ff', visor: '#3fd0ff', glow: '#29f0ff', scarf: ['#2d74c4', '#173e78'], emblem: '#4fd1ff' }),
  blaze: mkPal({ armor: ['#ec5a40', '#b9302a', '#6a1915'], trim: '#ffb02b', visor: '#ffbf4a', glow: '#ff8a2b', scarf: ['#e8772c', '#9a4216'], emblem: '#ffc35a' }),
  frost: mkPal({ armor: ['#f4faff', '#c9def0', '#8ea9c6'], trim: '#6cbcff', visor: '#7fe0ff', glow: '#9ed0ff', scarf: ['#7db7e6', '#4579ae'], emblem: '#a8dcff' }),
  spark: mkPal({ armor: ['#f2cf4e', '#cc9c27', '#7a5a14'], metal: ['#3a3a40', '#1d1d22', '#101014'], trim: '#1c1c20', visor: '#ffe14d', glow: '#ffe14d', scarf: ['#bf9330', '#7c5c18'], emblem: '#fff07a' }),
  aegis: mkPal({ armor: ['#78b25a', '#4f8a39', '#2b5321'], trim: '#e6bd4c', visor: '#6dffa6', glow: '#5dff9e', scarf: ['#548f42', '#2f5a25'], emblem: '#8dffb4' })
};
let RC = SUITPAL.volt;
const BOT = { muzzle: [0, 0], jet: [0, 0] };   // filled by drawBot (world coords)
function poly(g, pts, fill, stroke = OUTL, lw = OLW){
  g.beginPath(); g.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]); g.closePath();
  if (fill){ g.fillStyle = fill; g.fill(); } if (stroke){ g.strokeStyle = stroke; g.lineWidth = Math.max(lw, OLW * 0.8); g.lineJoin = 'round'; g.stroke(); }
}
function armorGrad(g, x0, y0, x1, y1, back){ const A = back ? RC.aB : RC.armor, gr = g.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, A[0]); gr.addColorStop(0.55, A[1]); gr.addColorStop(1, A[2]); return gr; }
function stripes(g, x, y, w, h, n, col){   // diagonal hazard stripes clipped to a box
  g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip(); g.strokeStyle = col; g.lineWidth = w / (n * 2.2);
  g.beginPath(); for (let i = -1; i <= n + 1; i++){ const sx = x + (i / n) * w; g.moveTo(sx, y + h); g.lineTo(sx + h * 0.7, y); } g.stroke(); g.restore();
}
function sakura(g, x, y, r, col){
  g.fillStyle = col; rGlow(g, col, 6); g.beginPath();
  for (let i = 0; i < 5; i++){ const a = -Math.PI / 2 + i * TAU / 5; g.moveTo(x, y); g.ellipse(x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55, r * 0.5, r * 0.32, a, 0, TAU); }
  g.fill(); rNoGlow(g); g.fillStyle = '#fff'; g.beginPath(); g.arc(x, y, r * 0.22, 0, TAU); g.fill();
}
// ---- limbs (angles measured from straight down, + = forward)
function seg(g, x, y, a, fn){ g.save(); g.translate(x, y); g.rotate(-a); fn(); g.restore(); }
function drawLeg(g, hx, hy, a1, a2, back){
  const kx = hx + Math.sin(a1) * THIGH, ky = hy + Math.cos(a1) * THIGH, ax = kx + Math.sin(a2) * SHIN, ay = ky + Math.cos(a2) * SHIN;
  const M = back ? RC.mB : RC.metal;
  seg(g, hx, hy, a1, () => {
    g.fillStyle = M[1]; roundRect(g, -7, -2, 14, THIGH + 3, 3); g.fill(); g.strokeStyle = OUTL; g.lineWidth = OLW; g.stroke();
    poly(g, [-2, -1, 9.5, -2, 10.5, THIGH * 0.75, 0, THIGH * 0.9], armorGrad(g, -1, 0, 9, THIGH, back));
  });
  seg(g, kx, ky, a2, () => {
    g.fillStyle = M[1]; roundRect(g, -6.5, -1, 13, SHIN + 2, 3); g.fill(); g.strokeStyle = OUTL; g.lineWidth = OLW; g.stroke();
    poly(g, [-3, 0, 9.5, -1.5, 11, SHIN * 0.8, 4, SHIN + 1.5, -4, SHIN * 0.85], armorGrad(g, -2, 0, 9, SHIN, back));
    if (!back){ g.fillStyle = RC.trim; g.fillRect(3.5, SHIN * 0.25, 1.6, SHIN * 0.45); }
  });
  // knee guard
  seg(g, kx, ky, (a1 + a2) / 2, () => poly(g, [-1, -5, 9, -5.5, 12, 1, 8, 5.5, -1, 5], armorGrad(g, -1, -4, 9, 4, back)));
  // boot
  g.save(); g.translate(ax, ay); g.rotate(-a2 * 0.45);
  poly(g, [-8, -3, 8, -4, 14, 1, 15.5, BOOT - 1, -9.5, BOOT - 1, -10, 0], armorGrad(g, -8, -3, 12, BOOT, back));
  g.fillStyle = M[2]; g.fillRect(-10, BOOT - 3, 25.5, 3);
  if (!back){ g.fillStyle = RC.trim; g.fillRect(4, -0.5, 5, 1.4); }
  g.restore();
}
function drawBackArm(g, sx, sy, a1, a2){
  const ex = sx + Math.sin(a1) * UARM, ey = sy + Math.cos(a1) * UARM, hx = ex + Math.sin(a2) * FARM, hy = ey + Math.cos(a2) * FARM;
  seg(g, sx, sy, a1, () => { g.fillStyle = RC.mB[1]; roundRect(g, -4.5, -2, 9, UARM + 3, 3); g.fill(); g.strokeStyle = OUTL; g.lineWidth = 1.3; g.stroke(); });
  seg(g, ex, ey, a2, () => poly(g, [-5, -1, 5.5, -1.5, 6, FARM, -5.5, FARM + 0.5], armorGrad(g, -5, 0, 6, FARM, true)));
  g.fillStyle = RC.mB[0]; roundRect(g, hx - 4.5, hy - 3, 9, 8, 2.5); g.fill(); g.strokeStyle = OUTL; g.lineWidth = 1.3; g.stroke();
  BOT.offHand = [hx, hy];
}
function drawShield(g, hx, hy){
  {
    g.save(); g.translate(hx + 6, hy - 6);
    const pts = []; for (let k = 0; k < 6; k++){ const a = k * Math.PI / 3 + Math.PI / 6; pts.push(Math.cos(a) * 15, Math.sin(a) * 17); }
    poly(g, pts, armorGrad(g, -15, -17, 15, 17), OUTL, 2);
    g.strokeStyle = RC.trim; g.lineWidth = 2; g.beginPath(); for (let k = 0; k < 6; k++){ const a = k * Math.PI / 3 + Math.PI / 6; g.lineTo(Math.cos(a) * 12, Math.sin(a) * 14); } g.closePath(); g.stroke();
    sakura(g, 0, 0, 6, RC.glow); g.restore();
  }
}
function drawCannonArm(g, sx, sy, a1, a2, charge, recoil){
  const ex = sx + Math.sin(a1) * UARM, ey = sy + Math.cos(a1) * UARM;
  seg(g, sx, sy, a1, () => { g.fillStyle = RC.metal[1]; roundRect(g, -5, -2, 10, UARM + 3, 3); g.fill(); g.strokeStyle = OUTL; g.lineWidth = 1.4; g.stroke(); });
  const L = 30;
  seg(g, ex, ey, a2, () => {   // forearm = big modular arm cannon (local +y runs along the barrel)
    g.translate(0, -recoil);
    poly(g, [-8.5, -3, 8.5, -3, 9.5, L - 4, -9.5, L - 4], RC.metal[1]);                                   // core
    poly(g, [-10.5, -1, 10.5, -2.5, 11.5, L * 0.62, -11, L * 0.66], armorGrad(g, -11, 0, 11, L * 0.6));       // armored sleeve
    stripes(g, -10, L * 0.36, 20, 7, 3, RC.trim);
    g.strokeStyle = OUTL; g.lineWidth = 1.2; g.beginPath(); g.moveTo(-8.5, L * 0.38); g.lineTo(9, L * 0.38); g.stroke();
    poly(g, [-8, L - 5, 8, L - 5, 9, L + 1.5, -9, L + 1.5], RC.metal[0]);                      // muzzle ring
    const cg = RC.glow, k = 0.45 + charge * 0.55;
    g.fillStyle = hexA(cg, k); rGlow(g, cg, 8 + charge * 16); g.beginPath(); g.ellipse(0, L + 1.6, 6, 2.6, 0, 0, TAU); g.fill(); rNoGlow(g);
    // charge lights crawl up the barrel
    for (let i = 0; i < 3; i++){ const on = charge > i * 0.33; g.fillStyle = on ? cg : RC.metal[2]; if (on) rGlow(g, cg, 6); g.fillRect(-1.2, L * 0.66 + i * 2.6, 2.4, 1.6); rNoGlow(g); }
    if (charge > 0.02){
      const r = 3 + charge * 7 + Math.sin(globalT * 40) * 1.2;
      const og = g.createRadialGradient(0, L + 3, 0, 0, L + 3, r * 2.2); og.addColorStop(0, '#fff'); og.addColorStop(0.35, cg); og.addColorStop(1, hexA(cg, 0));
      g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = og; g.beginPath(); g.arc(0, L + 3, r * 2.2, 0, TAU); g.fill(); g.restore();
    }
    if (RC === SUITPAL.frost){ poly(g, [-9, 4, -15, 9, -9, 11], 'rgba(215,240,255,0.9)', 'rgba(120,180,240,0.9)', 1); poly(g, [-9, 9, -13, 15, -8.5, 15], 'rgba(215,240,255,0.85)', 'rgba(120,180,240,0.9)', 1); }
  });
  return [ex + Math.sin(a2) * (L + 3 - recoil), ey + Math.cos(a2) * (L + 3 - recoil)];
}
// ---- torso pieces (torso frame: origin at hip, +x forward)
function drawScarfTails(g, wind, windY, t, ph){
  const ax = -11, ay = -44;
  wind = Math.max(wind, 0.22);
  for (const [len, w, off, col] of [[56, 13, 0, RC.scarf[1]], [44, 10, 2.5, RC.scarf[0]]]){
    const N = 8, sl = len / N, base = lerp(1.2, 0.1, wind) - windY * 0.5 + off * 0.12, amp = 0.1 + 0.28 * wind;
    let x = ax, y = ay + off; const L = [], R = [];
    for (let i = 0; i <= N; i++){
      const f = i / N, a = base + Math.sin(t * (5 + 6 * wind) - i * 0.85 + off * 2 + ph) * amp * f + (1 - wind) * f * 0.35;
      const nx = -Math.sin(a), ny = -Math.cos(a), ww = w * (1 - f * 0.45) / 2;   // perpendicular
      L.push([x + nx * ww, y + ny * ww]); R.push([x - nx * ww, y - ny * ww]);
      if (i < N){ x -= Math.cos(a) * sl; y += Math.sin(a) * sl; }
    }
    g.beginPath(); g.moveTo(L[0][0], L[0][1]); for (const p of L) g.lineTo(p[0], p[1]);
    const e = L[N], r = R[N];   // tattered tip
    for (let k = 1; k <= 3; k++){ const q = k / 4; g.lineTo(lerp(e[0], r[0], q) - (k % 2 ? 5 : 1) * Math.cos(base), lerp(e[1], r[1], q) + (k % 2 ? 5 : 1) * Math.sin(base)); }
    for (let i = N; i >= 0; i--) g.lineTo(R[i][0], R[i][1]);
    g.closePath(); g.fillStyle = col; g.fill(); g.strokeStyle = shade(col, 0.6); g.lineWidth = 1.2; g.stroke();
  }
}
function drawJetpack(g, thrust){
  g.save(); g.translate(-18, -30); g.scale(1.3, 1.25); g.translate(18, 30);
  poly(g, [-26, -44, -12, -45, -11, -15, -25, -14], RC.metal[1]);
  poly(g, [-25, -42, -15, -43, -15, -19, -24, -18], armorGrad(g, -25, -43, -15, -18, true));
  stripes(g, -24, -40, 8, 6, 2, RC.trim);
  for (const nx of [-22, -15.5]){ poly(g, [nx - 3.5, -15, nx + 3.5, -15, nx + 4.5, -9, nx - 4.5, -9], RC.metal[0]); g.fillStyle = '#7ff6ff'; rGlow(g, '#29f0ff', 8); g.fillRect(nx - 2.5, -10, 5, 1.5); rNoGlow(g); }
  if (RC === SUITPAL.frost){ poly(g, [-24, -44, -21, -55, -18, -44], 'rgba(220,244,255,0.9)', 'rgba(120,180,240,0.9)', 1); poly(g, [-19, -45, -15, -52, -13, -45], 'rgba(220,244,255,0.9)', 'rgba(120,180,240,0.9)', 1); }
  if (thrust > 0.02){
    g.save(); g.globalCompositeOperation = 'lighter';
    for (const nx of [-22, -15.5]){
      const L = (16 + thrust * 40) * (0.85 + Math.random() * 0.3);
      const fg = g.createLinearGradient(0, -9, 0, -9 + L); fg.addColorStop(0, 'rgba(255,255,255,0.95)'); fg.addColorStop(0.25, 'rgba(41,240,255,0.9)'); fg.addColorStop(1, 'rgba(41,120,255,0)');
      g.fillStyle = fg; g.beginPath(); g.moveTo(nx - 4.5, -9); g.quadraticCurveTo(nx - 2, -9 + L * 0.6, nx, -9 + L); g.quadraticCurveTo(nx + 2, -9 + L * 0.6, nx + 4.5, -9); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.9)'; g.beginPath(); g.ellipse(nx, -7, 1.8, L * 0.2, 0, 0, TAU); g.fill();
    }
    const hg = g.createRadialGradient(-19, -6, 0, -19, -6, 26); hg.addColorStop(0, 'rgba(41,240,255,0.4)'); hg.addColorStop(1, 'rgba(41,240,255,0)'); g.fillStyle = hg; g.fillRect(-45, -32, 52, 52);
    g.restore();
  }
  g.restore();
}
function drawTorso(g, charge){
  poly(g, [-14, -8, -3, -7, -4, 8, -15, 6], armorGrad(g, -15, -8, -3, 8, true));                 // rear skirt plate
  g.fillStyle = RC.metal[1]; roundRect(g, -10, -19, 20, 18, 3); g.fill(); g.strokeStyle = OUTL; g.lineWidth = 1.4; g.stroke();   // abdomen
  g.strokeStyle = RC.metal[0]; g.lineWidth = 1; g.beginPath(); for (const y of [-15, -12]){ g.moveTo(-7, y); g.lineTo(7, y); } g.stroke();
  g.fillStyle = RC.metal[2]; g.fillRect(-11, -8, 23, 4); g.fillStyle = RC.trim; g.fillRect(1, -7.5, 4, 3);                  // belt + buckle
  poly(g, [-14.5, -19, -16, -33, -11, -42, 9, -43, 15.5, -36, 15, -21, 8, -16, -9, -16], armorGrad(g, -16, -43, 15, -16));   // chest
  poly(g, [-1, -38, 9, -38.5, 12, -31, 9, -22, -1, -22], RC.armor[0], OUTL, 1.2);                                             // pec plate
  stripes(g, 9.5, -33, 5, 9, 2, RC.trim);
  g.fillStyle = RC.metal[2]; for (let i = 0; i < 3; i++) g.fillRect(1, -35 + i * 4, 6, 1.6);                                    // vents
  g.fillStyle = hexA(RC.trim, 0.9); g.fillRect(-9, -36, 1.6, 6); g.fillRect(-12, -34, 2.6, 1.4); g.fillRect(-12, -31, 2.6, 1.4);   // katakana-ish decal
  const cg = RC.glow; g.fillStyle = cg; rGlow(g, cg, 8 + charge * 10); g.beginPath(); g.arc(4, -26, 2.2 + charge, 0, TAU); g.fill(); rNoGlow(g);   // core
  poly(g, [3, -7, 13, -6, 16, 8, 5, 9], armorGrad(g, 3, -7, 16, 9));                                                         // front skirt plate
  g.fillStyle = RC.trim; g.fillRect(6, 0, 7, 1.8);
}
function drawScarfWrap(g){   // bulky cowl wrapped round the neck
  poly(g, [-16, -49, -4, -53, 11, -52, 17, -45, 15, -39, 4, -35, -8, -36, -17, -40], RC.scarf[0], shade(RC.scarf[0], 0.5), OLW);
  g.strokeStyle = shade(RC.scarf[0], 0.68); g.lineWidth = 1.3; g.beginPath(); g.moveTo(-13, -46); g.quadraticCurveTo(0, -47, 13, -44); g.moveTo(-14, -41); g.quadraticCurveTo(-2, -40, 9, -39); g.stroke();
  g.strokeStyle = shade(RC.scarf[0], 1.25); g.lineWidth = 1; g.beginPath(); g.moveTo(-8, -50); g.quadraticCurveTo(2, -51, 10, -49); g.stroke();
}
function drawPauldron(g){
  poly(g, [-3, -46, 12, -47, 18, -37, 16, -29, 1, -29, -5, -37], armorGrad(g, -6, -47, 17, -27));
  stripes(g, 1, -36, 13, 6, 3, RC.trim);
  g.strokeStyle = OUTL; g.lineWidth = 1; g.beginPath(); g.moveTo(-5, -37); g.lineTo(16, -36); g.stroke();
}
function drawHelmet(g, flick, dead, defeat){
  poly(g, [-1.5, -24, 4.5, -25, 8, -41, 4, -39.5, 0.5, -31], RC.armor[0]);                     // horn crest
  poly(g, [-6, -22, -3, -23, -5, -30, -7.5, -27], RC.armor[1], OUTL, 1.2);                  // rear fin
  poly(g, [-12, -1, -13.5, -15, -8, -23, 2, -26.5, 10.5, -24.5, 15.5, -17, 16.5, -7, 13.5, 0.5, -9, 1.5], armorGrad(g, -13, -26, 16, 1));   // helmet
  poly(g, [-13.5, -14, -4, -16, -3, -2, -11.5, 0], armorGrad(g, -13, -16, -3, 0, true), OUTL, 1.3);                                        // side guard
  g.fillStyle = RC.metal[1]; g.beginPath(); g.arc(-8, -8, 3, 0, TAU); g.fill(); g.fillStyle = RC.glow; g.beginPath(); g.arc(-8, -8, 1.1, 0, TAU); g.fill();
  stripes(g, -12.5, -4.5, 7, 3.5, 2, RC.trim);
  poly(g, [1, -17, 16.5, -16, 17, -12.5, 1.5, -13], RC.metal[1], OUTL, 1.2);              // brow
  poly(g, [2.5, -12.5, 17.5, -12, 17, -8, 3.5, -8.5], RC.metal[2], OUTL, 1.2);            // visor housing
  const vc = dead ? (Math.sin(globalT * 30) > 0 ? '#ff3d5a' : '#40101a') : RC.visor;
  const va = dead ? 1 : flick ? 0.25 : 1;
  g.globalAlpha = va; g.fillStyle = vc; rGlow(g, dead ? '#ff3d5a' : RC.glow, defeat ? 6 : 14);
  poly(g, [4, -11.3, 17, -10.9, 16.4, -9.2, 5, -9.6], vc, null); rNoGlow(g);
  g.fillStyle = 'rgba(255,255,255,0.9)'; g.fillRect(9, -10.9, 6, 0.9); g.globalAlpha = 1;
  poly(g, [4, -7.5, 16.5, -7, 14, 0.5, 5.5, 1.5], armorGrad(g, 4, -8, 16, 1), OUTL, 1.3);   // jaw / face guard
  g.fillStyle = RC.metal[2]; for (let i = 0; i < 3; i++) g.fillRect(8 + i * 2.6, -5, 1.2, 4);
  sakura(g, 7.5, -20.5, 3, RC.emblem);
  if (RC === SUITPAL.blaze){   // smouldering flames off the helmet
    g.save(); g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 3; i++){ const fx = -10 + i * 4, h = 7 + Math.sin(globalT * 12 + i * 2) * 3; const fg = g.createLinearGradient(0, -20, 0, -20 - h); fg.addColorStop(0, 'rgba(255,170,60,0.85)'); fg.addColorStop(1, 'rgba(255,60,20,0)');
      g.fillStyle = fg; g.beginPath(); g.moveTo(fx - 3, -18); g.quadraticCurveTo(fx - 3, -20 - h * 0.6, fx + Math.sin(globalT * 9 + i) * 2, -20 - h); g.quadraticCurveTo(fx + 3, -20 - h * 0.5, fx + 3, -18); g.fill(); }
    g.restore();
  }
}
function arcs(g, x, y, col, n, r){
  g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = col; g.lineWidth = 1.2; rGlow(g, col, 8);
  for (let k = 0; k < n; k++){ g.beginPath(); let px = x, py = y; g.moveTo(px, py); const a = rand(0, TAU); for (let i = 0; i < 4; i++){ px += Math.cos(a) * r / 4 + rand(-3, 3); py += Math.sin(a) * r / 4 + rand(-3, 3); g.lineTo(px, py); } g.stroke(); }
  rNoGlow(g); g.restore();
}
// ---------------------------------------------------------------- poses
function legPose(q, amp){ const th = 0.08 + amp * Math.sin(q); const bend = 0.2 + amp * 1.5 * Math.max(0, Math.cos(q + 0.35)); return [th, th - bend]; }
function legFootY(a){ return Math.cos(a[0]) * THIGH + Math.cos(a[1]) * SHIN + BOOT - 1; }
function botPose(mode, t, o = {}){
  const b = Math.sin(t * 2.1);
  switch (mode){
    case 'run': { const q = o.phase || 0, amp = 0.7; return { lean: 0.16, nl: legPose(q, amp), fl: legPose(q + Math.PI, amp), na: [0.5 + 0.5 * Math.sin(q), 0.9 + 0.3 * Math.sin(q)], fa: [0.1 + 0.6 * Math.sin(q + Math.PI), 0.7], head: -0.06, wind: 0.8, bob: Math.abs(Math.cos(q)) * 2.5 }; }
    case 'jump': return { lean: 0.06, nl: [1.0, -0.3], fl: [0.4, -0.85], na: [-0.3, 0.4], fa: [-0.8, -0.4], head: -0.12, wind: 0.4, windY: -0.6 };
    case 'fall': return { lean: 0, nl: [0.35, 0.1], fl: [-0.25, -0.5], na: [1.6, 1.9], fa: [-1.3, -0.9], head: 0.06, wind: 0.35, windY: 0.9 };
    case 'hover': { const w = Math.sin(t * 6) * 0.08; return { lean: 0.08, nl: [0.25 + w, 0.05 + w], fl: [-0.05 - w, -0.3 - w], na: [0.9, 1.3], fa: [-0.7, -0.5], head: -0.08, wind: 0.75, windY: 0.4 }; }
    case 'hurt': return { lean: -0.35, nl: [0.5, 0.3], fl: [-0.4, -0.2], na: [2.2, 2.5], fa: [-2.1, -2.4], head: 0.3, wind: 0.6 };
    case 'down': { const k = Math.min(1, o.k || 0); return { lean: lerp(-0.3, 0.55, k), nl: [lerp(0.5, 1.5, k), lerp(0.3, -0.05, k)], fl: [lerp(-0.4, 0.2, k), lerp(-0.2, -1.6, k)], na: [lerp(2.2, 0.1, k), lerp(2.5, 0.05, k)], fa: [lerp(-2.1, 0.2, k), lerp(-2.4, 0.1, k)], head: lerp(0.3, 0.6, k), wind: 0.15 }; }
    case 'cheer': { const k = o.hop || 0; return { lean: -0.05, nl: [lerp(0.08, 0.9, k), lerp(0.02, -0.4, k)], fl: [lerp(-0.1, -0.3, k), lerp(-0.12, -1.2, k)], na: [2.9, 3.05 + Math.sin(t * 14) * 0.1], fa: [-2.0 - Math.sin(t * 14) * 0.2, -2.6], head: -0.25, lift: k * 20, wind: 0.5 + k * 0.4 }; }
    default: return { lean: 0.03, nl: [0.07, 0.03], fl: [-0.12, -0.14], na: [0.25 + b * 0.03, 0.3 + b * 0.03], fa: [-0.15, 0.12], head: -0.03 + Math.sin(t * 0.7) * 0.04, breathe: b, wind: 0.08 + 0.06 * Math.sin(t * 1.3) };
  }
}
// draws the Ronin with feet at (x, footY). Fills BOT.muzzle / BOT.jet (world coords) and returns the muzzle.
function drawBot(g, x, footY, pose, opt = {}){
  RC = SUITPAL[opt.suit || 'volt'] || SUITPAL.volt;
  const sc = opt.scale || 0.5, face = opt.face || 1, charge = opt.charge || 0;
  OLW = Math.max(1.6, 1.05 / sc);
  g.save(); g.translate(x, footY); g.scale(sc * face, sc);
  if (opt.squash) g.scale(1 + opt.squash, 1 - opt.squash);
  const hipY = -Math.max(legFootY(pose.nl), legFootY(pose.fl)) - (pose.lift || 0) + (pose.breathe ? pose.breathe * 0.5 : 0) - (pose.bob || 0);
  const lean = pose.lean, cs = Math.cos(lean), sn = Math.sin(lean);
  const toW = (lx, ly) => [lx * cs - ly * sn, hipY + lx * sn + ly * cs];
  if (opt.shadow !== false){
    g.save(); g.globalCompositeOperation = 'lighter'; g.scale(1, 0.22);
    const gr = g.createRadialGradient(0, 0, 2, 0, 0, 50); gr.addColorStop(0, `rgba(${RC.ar},0.3)`); gr.addColorStop(1, `rgba(${RC.ar},0)`);
    g.fillStyle = gr; g.fillRect(-50, -50, 100, 100); g.restore();
  }
  const torsoFrame = fn => { g.save(); g.translate(0, hipY); g.rotate(lean); fn(); g.restore(); };
  torsoFrame(() => drawScarfTails(g, pose.wind || 0, pose.windY || 0, globalT, opt.ph || 0));
  const [sbX, sbY] = toW(-6, -37); drawBackArm(g, sbX, sbY, pose.fa[0], pose.fa[1]);
  torsoFrame(() => drawJetpack(g, opt.thrust || 0));
  drawLeg(g, -3, hipY, pose.fl[0], pose.fl[1], true);
  torsoFrame(() => {
    g.save(); g.scale(1.14, 1); drawTorso(g, charge); g.restore();
    g.save(); g.translate(1, -45); g.rotate(pose.head - lean * 0.5); g.scale(1.32, 1.32);
    drawHelmet(g, opt.blink > 0, !!opt.dead, !!opt.defeat); g.restore();
    g.save(); g.translate(0, 1); g.scale(1.1, 1.1); drawScarfWrap(g); g.restore();
  });
  drawLeg(g, 3, hipY, pose.nl[0], pose.nl[1], false);
  const [shX, shY] = toW(5, -37);
  const a1 = opt.aim ? 1.15 : pose.na[0], a2 = opt.aim ? Math.PI / 2 : pose.na[1];
  const m = drawCannonArm(g, shX, shY, a1, a2, charge, opt.recoil || 0);
  torsoFrame(drawPauldron.bind(null, g));
  if (RC === SUITPAL.aegis && BOT.offHand) drawShield(g, BOT.offHand[0], BOT.offHand[1]);
  if ((RC === SUITPAL.spark || RC === SUITPAL.volt) && (charge > 0.3 || Math.random() < (RC === SUITPAL.spark ? 0.12 : 0.04))) arcs(g, m[0], m[1], RC.glow, charge > 0.3 ? 3 : 1, 18);
  const j = toW(-23, 2);
  g.restore();
  BOT.muzzle = [x + m[0] * sc * face, footY + m[1] * sc]; BOT.jet = [x + j[0] * sc * face, footY + j[1] * sc];
  return BOT.muzzle;
}
// small helmet portrait (HUD chips, capsules)
function drawRoninHead(g, suit, x, y, s){
  RC = SUITPAL[suit] || SUITPAL.volt; OLW = Math.max(1.6, 1.05 / s); g.save(); g.translate(x, y); g.scale(s, s); g.save(); g.translate(1, -45); g.scale(1.32, 1.32); drawHelmet(g, false, false, false); g.restore(); g.translate(0, 1); g.scale(1.1, 1.1); drawScarfWrap(g); g.restore();
}
