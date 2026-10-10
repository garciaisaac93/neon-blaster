// ---------------------------------------------------------------- boss art (procedural, samurai-cyberpunk): ONI ENFORCER · KITE NINJA DRONE · SECURITY SHOGUN TURRET · SHINKANSEN DRAGON
// drawBossArt(g, b, x, by, o): x = screen centre, by = screen bottom of the hitbox. Works on any 2D context (game canvas, stage-select icons, intro card).
const BOSS_INFO = {
  oni: { kanji: '鬼の執行者', tag: 'STREET-GANG HEAVY MECH', col: '#ff3355' },
  kite: { kanji: '凧忍者', tag: 'SHADOW OF THE ROOFTOPS', col: '#29f0ff' },
  shogun: { kanji: '警備将軍', tag: 'GUARDIAN OF THE TOWER', col: '#ffcc4d' },
  dragon: { kanji: '新幹線竜', tag: 'FINAL BOSS', col: '#ff2bd6' }
};
const OL = '#0a0714';
function bGlow(g, col, blur){ if (lowQ) return; g.shadowColor = col; g.shadowBlur = blur; }
function bNoGlow(g){ g.shadowBlur = 0; }
function bPoly(g, pts){ g.beginPath(); g.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]); g.closePath(); }
function bFill(g, fill, lw = 2){ g.fillStyle = fill; g.fill(); if (lw){ g.strokeStyle = OL; g.lineWidth = lw; g.lineJoin = 'round'; g.stroke(); } }
function vGrad(g, y0, y1, a, b){ const gr = g.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, a); gr.addColorStop(1, b); return gr; }
function bolt(g, x0, y0, x1, y1, col, w, seg = 6, jit = 6){
  g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.moveTo(x0, y0);
  for (let i = 1; i < seg; i++){ const f = i / seg; g.lineTo(x0 + (x1 - x0) * f + (Math.random() - 0.5) * jit * 2, y0 + (y1 - y0) * f + (Math.random() - 0.5) * jit * 2); }
  g.lineTo(x1, y1); g.stroke();
}
function warnMark(g, x, y, col, t){
  const a = 0.6 + 0.4 * Math.sin(t * 22);
  g.save(); g.globalAlpha *= a; g.fillStyle = col; bGlow(g, col, 14);
  bPoly(g, [x, y - 26, x + 15, y, x - 15, y]); g.fill(); bNoGlow(g);
  g.fillStyle = '#1a0610'; g.font = 'bold 17px Arial,sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('!', x, y - 8);
  g.restore();
}
function uprightText(g, str, x, y, d){ g.save(); g.translate(x, y); g.scale(d < 0 ? -1 : 1, 1); g.fillText(str, 0, 0); g.restore(); }   // text inside a mirrored sprite stays readable
function phK(b, total){ return clamp(1 - b.pt / total, 0, 1); }   // 0..1 progress through the current phase
// ---------------------------------------------------------------- 1. ONI ENFORCER
function drawOni(g, b, x, by, o){
  const t = o.t, d = b.dir || -1, angry = b.angry, ph = b.ph;
  let lean = 0, club = 1.0 + Math.sin(t * 2) * 0.05, bob = Math.sin(t * 3) * 1.5, crouch = 0;
  if (ph === 'slamT'){ const k = phK(b, angry ? 0.6 : 0.8); club = lerp(1.0, -1.45, Math.min(1, k * 1.6)); lean = -0.12 * k; bob = -4 * k; }
  else if (ph === 'slam'){ const e = 0.7 - b.pt; club = e < 0.1 ? lerp(-1.45, 0.75, e / 0.1) : 0.75; lean = e < 0.1 ? 0.18 * e / 0.1 : 0.18; crouch = 6; }
  else if (ph === 'chargeT'){ club = -2.85; lean = 0.12; crouch = 5; bob = Math.sin(t * 30) * 1.2; }
  else if (ph === 'charge'){ club = -2.95; lean = 0.32; crouch = 8; bob = Math.abs(Math.sin(t * 18)) * -3; }
  else if (ph === 'dazed'){ club = 1.3; lean = -0.05; crouch = 3; }
  else if (ph === 'swingT'){ const k = phK(b, angry ? 0.5 : 0.7); club = lerp(1.0, -3.45, Math.min(1, k * 1.6)); lean = -0.1 * k; }
  else if (ph === 'swing'){ const e = 0.55 - b.pt; club = e < 0.14 ? lerp(-3.45, 0.35, e / 0.14) : 0.35; lean = 0.15; }
  else if (ph === 'roar'){ club = -1.4 + Math.sin(t * 40) * 0.06; lean = -0.2; bob = Math.sin(t * 40) * 2; }
  const S = o.s || 1;
  g.save(); g.translate(x, by); g.scale(d * S, S);
  // ground shadow
  g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.ellipse(0, 0, 46, 7, 0, 0, TAU); g.fill();
  // enraged aura
  if (angry){ g.save(); g.globalCompositeOperation = 'lighter'; const ag = g.createRadialGradient(0, -48, 10, 0, -48, 80); ag.addColorStop(0, 'rgba(255,40,70,0.32)'); ag.addColorStop(1, 'rgba(255,40,70,0)'); g.fillStyle = ag; g.fillRect(-90, -140, 180, 150); g.restore(); }
  const steel = vGrad(g, -90, 0, '#5e5784', '#221c36'), dark = '#1d1830', red = angry ? '#ff2244' : '#e8243f', gold = '#ffcc4d';
  // legs (thick, armoured, slightly bowed)
  const legs = [[-16, -1], [14, 1]];
  legs.forEach(([lx, sd], i) => {
    const step = ph === 'charge' ? Math.sin(t * 18 + i * Math.PI) * 6 : 0;
    g.save(); g.translate(lx + step, 0);
    bPoly(g, [-12, -36 + crouch, 12, -36 + crouch, 14, -12, 10, -6, -10, -6, -13, -12]); bFill(g, i ? steel : '#2c2646');
    bPoly(g, [-14, -8, 16, -8, 20, 0, -14, 0]); bFill(g, dark);   // boot
    g.fillStyle = red; g.fillRect(-10, -24 + crouch, 20, 3);   // knee stripe
    g.fillStyle = gold; g.fillRect(12, -4, 6, 2);
    g.restore();
  });
  g.save(); g.translate(0, crouch + bob); g.rotate(lean);
  // back arm (fist)
  g.save(); g.translate(-30, -62); g.rotate(0.3 + Math.sin(t * 3) * 0.05);
  roundRect(g, -7, 0, 14, 26, 6); bFill(g, '#2c2646'); g.beginPath(); g.arc(0, 30, 9, 0, TAU); bFill(g, dark);
  g.restore();
  // torso: hunched heavy chest
  bPoly(g, [-34, -32, -40, -66, -22, -82, 26, -80, 38, -62, 34, -32, 18, -26, -20, -26]); bFill(g, steel, 2.4);
  // belly hazard band
  g.save(); bPoly(g, [-32, -40, 33, -40, 32, -32, -31, -32]); g.clip(); for (let k = -6; k < 10; k++){ g.fillStyle = k % 2 ? '#141020' : '#ffcc4d'; bPoly(g, [-40 + k * 9, -32, -34 + k * 9, -40, -29 + k * 9, -40, -35 + k * 9, -32]); g.fill(); } g.restore();
  // chest plate + core
  bPoly(g, [-24, -46, -26, -70, 20, -72, 26, -46, 0, -40]); bFill(g, vGrad(g, -72, -40, '#7a72a8', '#3a3358'));
  const core = 0.6 + 0.4 * Math.sin(t * (angry ? 14 : 6)) + (ph.endsWith('T') ? 0.4 : 0);
  g.fillStyle = red; bGlow(g, red, 16 * core); g.beginPath(); g.arc(0, -56, 6 + core * 1.5, 0, TAU); g.fill(); bNoGlow(g);
  g.fillStyle = 'rgba(255,255,255,0.8)'; g.beginPath(); g.arc(-1.5, -57.5, 2, 0, TAU); g.fill();
  // exhaust pipes on the back
  for (const px of [-30, -22]){ g.fillStyle = '#2a2440'; g.fillRect(px, -96, 6, 18); g.strokeStyle = OL; g.lineWidth = 1.5; g.strokeRect(px, -96, 6, 18); }
  if (angry && Math.random() < 0.5) addP && o.world && addP({ x: o.wx - d * 26 + rand(-3, 3), y: o.wy - 98, vx: rand(-15, 15), vy: rand(-80, -40), life: 0.6, col: 'rgba(255,120,120,1)', s: 4, g: 0, k: 'puff' });
  // pauldrons (with gang kanji decal)
  for (const [px, py, sc] of [[-30, -76, 1], [30, -78, 1.08]]){
    g.save(); g.translate(px, py); g.scale(sc, sc);
    g.beginPath(); g.ellipse(0, 0, 17, 13, 0, Math.PI * 1.05, Math.PI * 1.95 + TAU * 0.5); bFill(g, vGrad(g, -13, 13, '#6c6496', '#2c2646'), 2.2);
    for (const sx of [-8, 0, 8]){ bPoly(g, [sx - 3, -11, sx, -19, sx + 3, -11]); bFill(g, '#d8d2f0', 1.2); }
    g.strokeStyle = red; g.lineWidth = 2; g.beginPath(); g.ellipse(0, 0, 13, 9, 0, 3.6, 5.8); g.stroke();
    if (px > 0){ g.fillStyle = '#ff2bd6'; g.font = `900 13px ${CJK_FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; bGlow(g, '#ff2bd6', 8); uprightText(g, '鬼', 0, 1, d); bNoGlow(g); }
    g.restore();
  }
  // head: oni mask set low between the shoulders
  g.save(); g.translate(6, -86); g.scale(1.3, 1.3); if (ph === 'roar') g.rotate(-0.25);
  // horns
  for (const hx of [-1, 1]){
    g.save(); g.translate(hx * 11, -12);
    g.beginPath(); g.moveTo(-4, 2); g.quadraticCurveTo(hx * 4 - 2, -14, hx * 10, -26); g.quadraticCurveTo(hx * 4 + 4, -12, 5, 2); g.closePath(); bFill(g, vGrad(g, -26, 2, '#fffbe8', '#cdbf9a'), 1.8);
    g.fillStyle = gold; bGlow(g, gold, 10); g.beginPath(); g.arc(hx * 10, -26, 2.2, 0, TAU); g.fill(); bNoGlow(g);
    g.restore();
  }
  // mask
  bPoly(g, [-18, -14, 18, -14, 22, 0, 18, 14, 8, 20, -8, 20, -18, 14, -22, 0]);
  g.fillStyle = vGrad(g, -14, 20, angry ? '#ff5a5a' : '#ff4a5a', '#9a0f26'); bGlow(g, red, angry ? 24 : 14); g.fill(); bNoGlow(g); g.strokeStyle = OL; g.lineWidth = 2; g.stroke();
  // brows + eyes
  bPoly(g, [-17, -8, -3, -3, -4, 0, -16, -4]); bFill(g, '#3a0610', 0); bPoly(g, [17, -8, 3, -3, 4, 0, 16, -4]); bFill(g, '#3a0610', 0);
  const eyeC = ph.endsWith('T') && Math.sin(t * 30) > 0 ? '#ffffff' : '#ffe14d';
  g.fillStyle = eyeC; bGlow(g, eyeC, 12); bPoly(g, [-15, -2, -5, 1, -7, 4, -14, 2]); g.fill(); bPoly(g, [15, -2, 5, 1, 7, 4, 14, 2]); g.fill(); bNoGlow(g);
  // fanged grin
  bPoly(g, [-12, 8, 12, 8, 9, 15, -9, 15]); bFill(g, '#1a0208', 1.2);
  g.fillStyle = '#fff6e0'; for (let k = 0; k < 5; k++){ const tx = -9 + k * 4.5; bPoly(g, [tx, 8, tx + 3, 8, tx + 1.5, 11]); g.fill(); }
  bPoly(g, [-11, 15, -8, 15, -9.5, 9]); g.fill(); bPoly(g, [8, 15, 11, 15, 9.5, 9]); g.fill();
  g.fillStyle = gold; g.fillRect(-2, -14, 4, 5);
  g.restore();
  // front arm + electrified kanabo club
  const shx = 26, shy = -64, hx = shx + Math.cos(club) * 20, hy = shy + Math.sin(club) * 20;
  g.strokeStyle = OL; g.lineWidth = 15; g.lineCap = 'round'; g.beginPath(); g.moveTo(shx, shy); g.lineTo(hx, hy); g.stroke();
  g.strokeStyle = '#4a4270'; g.lineWidth = 11; g.stroke(); g.lineCap = 'butt';
  g.save(); g.translate(hx, hy); g.rotate(club);
  if (ph === 'swing' && b.pt > 0.3){ g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = 'rgba(120,230,255,0.25)'; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, 80, -1.6, 0.1); g.closePath(); g.fill(); g.restore(); }
  bPoly(g, [-6, -4, 14, -5, 74, -10, 78, 0, 74, 10, 14, 5, -6, 4]); bFill(g, vGrad(g, -10, 10, '#4a4466', '#14101f'), 2);
  g.fillStyle = '#d9d4ee'; for (let k = 0; k < 6; k++){ const sx = 24 + k * 9; g.beginPath(); g.arc(sx, -7 - k * 0.4, 2.2, 0, TAU); g.arc(sx + 4, 6 + k * 0.4, 2.2, 0, TAU); g.fill(); }
  g.fillStyle = gold; g.fillRect(8, -5, 4, 10);
  const charge = ph === 'swingT' || ph === 'swing' || angry;
  g.save(); g.globalCompositeOperation = 'lighter'; bGlow(g, C.cy, 14);
  g.strokeStyle = 'rgba(120,240,255,0.85)'; g.lineWidth = 2; g.beginPath(); g.moveTo(18, 0); g.lineTo(74, 0); g.stroke();
  if (charge || Math.random() < 0.25){ for (let k = 0; k < (charge ? 3 : 1); k++){ const sx = rand(20, 70); bolt(g, sx, rand(-12, 12), sx + rand(-14, 14), rand(-26, 26), k ? '#fff' : C.cy, 1.6, 4, 4); } }
  bNoGlow(g); g.restore();
  g.restore();
  g.beginPath(); g.arc(hx, hy, 8, 0, TAU); bFill(g, dark);
  g.restore();
  // dazed stars
  if (ph === 'dazed'){ for (let k = 0; k < 3; k++){ const a = t * 5 + k * TAU / 3; g.fillStyle = C.yel; g.save(); g.translate(Math.cos(a) * 22 + 8, -104 + Math.sin(a) * 6); g.rotate(t * 4); bPoly(g, [0, -5, 1.5, -1.5, 5, 0, 1.5, 1.5, 0, 5, -1.5, 1.5, -5, 0, -1.5, -1.5]); g.fill(); g.restore(); } }
  g.restore();
  if (ph.endsWith('T') && !o.icon) warnMark(g, x, by - 118 * S, ph === 'chargeT' ? C.org : C.red, t);
}
// ---------------------------------------------------------------- 2. KITE NINJA DRONE
function drawKiteBody(g, b, t, d, o){
  const ph = b.ph, tilt = ph === 'dive' ? 0.5 : clamp((b.vx || 0) / 700, -0.3, 0.3) * d;
  g.save(); g.scale(d, 1); g.rotate(tilt);
  // mechanical kite (tako) wing
  g.save(); g.translate(-6, -30); g.rotate(-0.12 + Math.sin(t * 2.2) * 0.04);
  const W = 46, H = 26;
  g.beginPath(); g.moveTo(-W, -H + 4); g.quadraticCurveTo(0, -H - 10, W, -H + 4); g.lineTo(W - 4, H - 6); g.quadraticCurveTo(0, H + 2, -W + 4, H - 6); g.closePath();
  const kg = g.createLinearGradient(-W, -H, W, H); kg.addColorStop(0, '#2a1440'); kg.addColorStop(0.5, '#4a1a5e'); kg.addColorStop(1, '#170a26');
  bFill(g, kg, 2.2);
  g.save(); g.clip();
  g.fillStyle = '#e8213f'; bGlow(g, '#ff3355', 10); g.beginPath(); g.arc(4, -2, 15, 0, TAU); g.fill(); bNoGlow(g);
  g.fillStyle = '#0a0714'; g.font = `900 19px ${CJK_FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; uprightText(g, '忍', 4, -1, d);
  g.strokeStyle = 'rgba(255,255,255,0.12)'; g.lineWidth = 1; for (let k = -4; k <= 4; k++){ g.beginPath(); g.moveTo(k * 12, -H - 10); g.lineTo(k * 12, H + 4); g.stroke(); }
  g.restore();
  // carbon spars + neon trim
  g.strokeStyle = '#9aa0c8'; g.lineWidth = 2; g.beginPath(); g.moveTo(-W + 2, -H + 6); g.lineTo(W - 6, H - 8); g.moveTo(W - 2, -H + 6); g.lineTo(-W + 6, H - 8); g.stroke();
  g.strokeStyle = C.cy; g.lineWidth = 1.6; bGlow(g, C.cy, 10); g.beginPath(); g.moveTo(-W, -H + 4); g.quadraticCurveTo(0, -H - 10, W, -H + 4); g.stroke(); bNoGlow(g);
  // corner thrusters
  for (const sx of [-W + 6, W - 8]){ g.fillStyle = '#2a2440'; roundRect(g, sx - 5, H - 10, 10, 8, 2); g.fill(); g.save(); g.globalCompositeOperation = 'lighter'; const fl = 8 + Math.sin(t * 40 + sx) * 3; const fg = g.createLinearGradient(0, H - 2, 0, H - 2 + fl); fg.addColorStop(0, 'rgba(255,255,255,0.9)'); fg.addColorStop(1, 'rgba(41,240,255,0)'); g.fillStyle = fg; bPoly(g, [sx - 4, H - 2, sx + 4, H - 2, sx, H - 2 + fl]); g.fill(); g.restore(); }
  // tail ribbons
  g.strokeStyle = '#ff2bd6'; g.lineWidth = 2.5; bGlow(g, '#ff2bd6', 8); for (const off of [0, 6]){ g.beginPath(); g.moveTo(-W + 4, H - 8 + off * 0.3); for (let k = 1; k <= 5; k++) g.lineTo(-W + 4 - k * 9, H - 8 + off + Math.sin(t * 7 + k * 0.9 + off) * 5); g.stroke(); } bNoGlow(g);
  g.restore();
  // hang bar
  g.strokeStyle = '#c9cce6'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(-14, -10); g.lineTo(14, -10); g.moveTo(-4, -10); g.lineTo(-6, -24); g.stroke();
  // ninja bot body
  const sc = '#1a1530';
  // scarf
  g.strokeStyle = '#e8213f'; g.lineWidth = 4; g.lineCap = 'round'; g.beginPath(); g.moveTo(-2, 0); for (let k = 1; k <= 5; k++) g.lineTo(-2 - k * 7, 1 + k * 1.5 + Math.sin(t * 9 + k) * 3); g.stroke(); g.lineCap = 'butt';
  // arms up to the bar
  const throwArm = ph === 'shurikenT';
  g.strokeStyle = OL; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); g.moveTo(-6, 8); g.lineTo(-10, -9); if (!throwArm){ g.moveTo(6, 8); g.lineTo(10, -9); } else { g.moveTo(6, 8); g.lineTo(20, -4); } g.stroke();
  g.strokeStyle = '#3a3458'; g.lineWidth = 3.5; g.stroke(); g.lineCap = 'butt';
  // torso
  bPoly(g, [-9, 2, 9, 2, 8, 20, -8, 20]); bFill(g, vGrad(g, 2, 20, '#3a3458', sc));
  g.fillStyle = '#ff2bd6'; g.fillRect(-8, 11, 16, 2);
  // tucked legs
  bPoly(g, [-8, 18, 0, 18, -4, 27, -14, 26]); bFill(g, sc, 1.6); bPoly(g, [1, 18, 8, 18, 10, 26, 2, 27]); bFill(g, '#2a2440', 1.6);
  // hooded head + visor
  g.beginPath(); g.ellipse(1, -4, 9, 8.5, 0, 0, TAU); bFill(g, vGrad(g, -12, 4, '#2c2646', '#0e0b1a'));
  const vis = (ph === 'diveT' || ph === 'dive') ? (Math.sin(t * 30) > 0 ? '#ffffff' : C.red) : C.cy;
  g.fillStyle = vis; bGlow(g, vis, 12); g.fillRect(1, -6, 9, 3); bNoGlow(g);
  g.strokeStyle = '#e8213f'; g.lineWidth = 2; g.beginPath(); g.moveTo(-8, -9); g.lineTo(9, -9); g.stroke();   // hachimaki band
  if (throwArm){ g.save(); g.translate(22, -6); g.rotate(t * 20); g.fillStyle = '#e8ecff'; bGlow(g, '#fff', 14); bPoly(g, [0, -8, 2, -2, 8, 0, 2, 2, 0, 8, -2, 2, -8, 0, -2, -2]); g.fill(); bNoGlow(g); g.restore(); }
  g.restore();
}
function drawKite(g, b, x, by, o){
  const t = o.t, d = b.dir || -1, S = o.s || 1, cy = by - b.h / 2 * S;
  if (!o.icon){
    for (const dc of b.decoys || []){
      const sx = dc.x - CAM.x, sy = dc.y - CAM.y;
      g.save(); g.translate(sx + (Math.random() < 0.15 ? rand(-4, 4) : 0), sy); g.globalAlpha = 0.45 + 0.2 * Math.sin(t * 20); g.filter = 'hue-rotate(160deg) saturate(1.4)'; drawKiteBody(g, { ph: 'idle', vx: 0 }, t + 1, d, o); g.filter = 'none'; g.restore();
      g.save(); g.globalAlpha = 0.7; g.strokeStyle = C.cy; g.setLineDash([3, 4]); g.beginPath(); g.arc(sx, sy, 30 + (dc.t % 0.3) * 30, 0, TAU); g.stroke(); g.setLineDash([]); g.restore();
    }
    if (b.ph === 'diveT'){
      const tx = b.tx - CAM.x, ty = b.ty - CAM.y, k = phK(b, 0.75);
      g.save(); g.strokeStyle = `rgba(255,59,92,${0.4 + 0.5 * k})`; g.lineWidth = 2; g.setLineDash([8, 6]); g.lineDashOffset = -t * 60; g.beginPath(); g.moveTo(x, cy); g.lineTo(tx, ty); g.stroke(); g.setLineDash([]);
      g.strokeStyle = C.red; bGlow(g, C.red, 10); g.beginPath(); g.arc(tx, ty, 18 - k * 6, 0, TAU); g.moveTo(tx - 26, ty); g.lineTo(tx - 10, ty); g.moveTo(tx + 10, ty); g.lineTo(tx + 26, ty); g.moveTo(tx, ty - 26); g.lineTo(tx, ty - 10); g.moveTo(tx, ty + 10); g.lineTo(tx, ty + 26); g.stroke(); bNoGlow(g); g.restore();
    }
  }
  if (b.hide > 0 && !o.icon) return;
  g.save(); g.translate(x, cy); g.scale(S * 1.3, S * 1.3);
  if (b.ph === 'dive'){ g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 2; const a = Math.atan2(b.vy || 0, b.vx || 1); for (let k = 0; k < 5; k++){ const off = (k - 2) * 9; g.beginPath(); g.moveTo(-Math.cos(a) * 30 - Math.sin(a) * off, -Math.sin(a) * 30 + Math.cos(a) * off); g.lineTo(-Math.cos(a) * (70 + k * 6) - Math.sin(a) * off, -Math.sin(a) * (70 + k * 6) + Math.cos(a) * off); g.stroke(); } g.restore(); }
  drawKiteBody(g, b, t, d, o);
  g.restore();
  if (!o.icon && (b.ph === 'shurikenT' || b.ph === 'vanishT')) warnMark(g, x, cy - 84 * S, b.ph === 'vanishT' ? C.pu : C.red, t);
}
// ---------------------------------------------------------------- 3. SECURITY SHOGUN TURRET
function drawShogun(g, b, x, by, o){
  const t = o.t, S = o.s || 1, top = by - b.h * S, angry = b.angry, open = b.open > 0, ph = b.ph;
  // beams (behind the head so they appear to come out of the eyes)
  if (!o.icon && b.beams && b.beams.length){
    for (const bm of b.beams){
      const x0 = bm.x0 - CAM.x, y0 = bm.y0 - CAM.y, x1 = bm.x1 - CAM.x, y1 = bm.y1 - CAM.y;
      g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
      if (!bm.live){ g.strokeStyle = `rgba(255,59,92,${0.35 + 0.35 * Math.sin(t * 30)})`; g.lineWidth = 2; g.setLineDash([10, 8]); g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); g.setLineDash([]); }
      else {
        g.strokeStyle = 'rgba(255,40,80,0.35)'; g.lineWidth = 18; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
        g.strokeStyle = '#ff3b5c'; g.lineWidth = 8; bGlow(g, '#ff3b5c', 20); g.stroke(); bNoGlow(g);
        g.strokeStyle = '#fff'; g.lineWidth = 3; g.stroke();
        const r = 14 + Math.sin(t * 40) * 3, ig = g.createRadialGradient(x1, y1, 0, x1, y1, r * 2); ig.addColorStop(0, '#fff'); ig.addColorStop(0.4, '#ff3b5c'); ig.addColorStop(1, 'rgba(255,59,92,0)'); g.fillStyle = ig; g.beginPath(); g.arc(x1, y1, r * 2, 0, TAU); g.fill();
        if (Math.random() < 0.6 && typeof addP === 'function') addP({ x: bm.x1 + rand(-6, 6), y: bm.y1 - 4, vx: rand(-160, 160), vy: rand(-260, -80), life: 0.35, col: pick(['#fff', '#ff3b5c', C.yel]), s: 2, g: 700 });
      }
      g.restore();
    }
  }
  g.save(); g.translate(x, top); g.scale(S, S);
  // ceiling armature
  if (!o.icon){
    for (const px of [-46, 0, 46]){ g.fillStyle = vGrad(g, -260, 10, '#2a2440', '#3c3560'); g.fillRect(px - 7, -260, 14, 266); g.strokeStyle = OL; g.lineWidth = 2; g.strokeRect(px - 7, -260, 14, 266); g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(px - 5, -260, 3, 266); }
    bPoly(g, [-64, -14, 64, -14, 54, 6, -54, 6]); bFill(g, '#2c2646');
    g.save(); bPoly(g, [-60, -12, 60, -12, 56, -4, -56, -4]); g.clip(); for (let k = -10; k < 12; k++){ g.fillStyle = k % 2 ? '#141020' : '#ffcc4d'; bPoly(g, [k * 10, -4, k * 10 + 6, -12, k * 10 + 11, -12, k * 10 + 5, -4]); g.fill(); } g.restore();
  }
  const lac = angry ? '#7a0e26' : '#5a0f22', gold = '#ffcc4d';
  // shikoro (layered neck guard) flaring out behind the face
  for (let k = 3; k >= 0; k--){
    const y0 = 44 + k * 17, w0 = 70 + k * 9, w1 = 80 + k * 10;
    bPoly(g, [-w0, y0, w0, y0, w1, y0 + 20, -w1, y0 + 20]); bFill(g, vGrad(g, y0, y0 + 20, lac, '#2a0612'), 2);
    g.strokeStyle = gold; g.lineWidth = 1.5; g.beginPath(); g.moveTo(-w1 + 2, y0 + 18); g.lineTo(w1 - 2, y0 + 18); g.stroke();
    g.fillStyle = C.cy; for (let i = -4; i <= 4; i++){ g.fillRect(i * w0 / 4.6 - 1, y0 + 8, 2, 4); }
  }
  // fukigaeshi flaps = missile pods
  for (const sd of [-1, 1]){
    g.save(); g.translate(sd * 80, 36); g.scale(sd, 1);
    bPoly(g, [-12, -16, 14, -22, 18, 20, -10, 22]); bFill(g, vGrad(g, -22, 22, '#6a1630', '#2a0612'), 2.2);
    g.strokeStyle = gold; g.lineWidth = 1.5; g.strokeRect(-6, -12, 18, 26);
    const hot = ph === 'missileT' || ph === 'dronesT';
    for (let i = 0; i < 4; i++){ const tx = -2 + (i % 2) * 9, ty = -7 + (i >> 1) * 11; g.fillStyle = '#0d0a18'; g.beginPath(); g.arc(tx, ty, 3.6, 0, TAU); g.fill(); g.fillStyle = hot && Math.sin(t * 30 + i) > 0 ? '#fff' : C.red; bGlow(g, C.red, hot ? 12 : 4); g.beginPath(); g.arc(tx, ty, 1.8, 0, TAU); g.fill(); bNoGlow(g); }
    g.restore();
  }
  // helmet bowl
  g.beginPath(); g.moveTo(-64, 48); g.bezierCurveTo(-66, 4, -36, -6, 0, -6); g.bezierCurveTo(36, -6, 66, 4, 64, 48); g.closePath(); bFill(g, vGrad(g, -6, 48, '#4a4268', '#1a1530'), 2.4);
  g.strokeStyle = 'rgba(255,255,255,0.12)'; g.lineWidth = 1.5; for (let k = -4; k <= 4; k++){ g.beginPath(); g.moveTo(k * 8, -4); g.quadraticCurveTo(k * 14, 20, k * 15, 46); g.stroke(); }
  g.fillStyle = '#d8d2f0'; for (let k = -5; k <= 5; k++){ g.beginPath(); g.arc(k * 11, 40 - Math.abs(k) * 0.6, 1.6, 0, TAU); g.fill(); }
  // weak point (forehead): armoured hatch that slides open after each attack
  const wy = 24, pulse = 0.5 + 0.5 * Math.sin(t * 9);
  if (open){
    const k = clamp((b.open > 2.2 ? (2.8 - b.open) : 1) * 4, 0, 1);
    const wg = g.createRadialGradient(0, wy, 0, 0, wy, 16); wg.addColorStop(0, '#ffffff'); wg.addColorStop(0.35, '#ff7ae8'); wg.addColorStop(1, '#8a1aff');
    g.fillStyle = wg; bGlow(g, '#ff2bd6', 26 + pulse * 14); g.beginPath(); g.arc(0, wy, 12 + pulse * 2, 0, TAU); g.fill(); bNoGlow(g);
    g.fillStyle = '#2c2646'; g.fillRect(-14 - 10 * k - 12, wy - 13, 14, 26); g.fillRect(12 + 10 * k - 2, wy - 13, 14, 26);
    if (!o.icon){ g.save(); g.strokeStyle = `rgba(255,255,255,${0.5 + 0.5 * pulse})`; g.lineWidth = 2; g.rotate(0); g.beginPath(); g.arc(0, wy, 22 + pulse * 3, 0, TAU); g.stroke(); for (let i = 0; i < 4; i++){ const a = i * Math.PI / 2 + t * 2; g.beginPath(); g.moveTo(Math.cos(a) * 26, wy + Math.sin(a) * 26); g.lineTo(Math.cos(a) * 34, wy + Math.sin(a) * 34); g.stroke(); } g.restore(); }
  } else {
    g.fillStyle = '#2c2646'; roundRect(g, -14, wy - 13, 28, 26, 4); bFill(g, vGrad(g, wy - 13, wy + 13, '#5a5280', '#2a2440'));
    g.strokeStyle = OL; g.lineWidth = 1.5; g.beginPath(); g.moveTo(0, wy - 13); g.lineTo(0, wy + 13); g.stroke();
    g.fillStyle = 'rgba(255,43,214,0.5)'; g.fillRect(-1, wy - 10, 2, 20);
  }
  // gold crescent crest (maedate)
  g.save(); g.translate(0, 2);
  g.beginPath(); g.moveTo(-6, 4); g.bezierCurveTo(-40, 2, -74, -18, -86, -56); g.bezierCurveTo(-60, -30, -30, -14, 0, -12); g.bezierCurveTo(30, -14, 60, -30, 86, -56); g.bezierCurveTo(74, -18, 40, 2, 6, 4); g.closePath();
  g.fillStyle = vGrad(g, -56, 4, '#fff3b0', '#e0a21c'); bGlow(g, gold, 18); g.fill(); bNoGlow(g); g.strokeStyle = '#6a4600'; g.lineWidth = 2; g.stroke();
  g.fillStyle = gold; bPoly(g, [-8, 4, 8, 4, 5, 12, -5, 12]); g.fill();
  g.restore();
  // visor brim
  bPoly(g, [-70, 48, 70, 48, 62, 58, -62, 58]); bFill(g, vGrad(g, 48, 58, '#2c2646', '#120e20'), 2); g.fillStyle = gold; g.fillRect(-68, 48, 136, 2.5);
  // menpo mask
  bPoly(g, [-46, 56, 46, 56, 44, 84, 30, 104, 12, 114, -12, 114, -30, 104, -44, 84]); bFill(g, vGrad(g, 56, 114, '#7c7698', '#2e2946'), 2.4);
  // eyes (laser emitters)
  const hot = ph === 'laserT' || ph === 'laser', eyeR = ph === 'laserT' ? 3 + phK(b, 1.0) * 4 : ph === 'laser' ? 6 : 2.5;
  for (const sd of [-1, 1]){
    bPoly(g, [sd * 14, 62, sd * 40, 60, sd * 38, 70, sd * 16, 70]); bFill(g, '#0a0714', 0);
    g.fillStyle = hot ? '#fff' : open ? '#5a1020' : '#ff3b5c'; bGlow(g, '#ff3b5c', hot ? 26 : 10); g.beginPath(); g.ellipse(sd * 27, 65.5, 9, eyeR, 0, 0, TAU); g.fill(); bNoGlow(g);
  }
  // furrowed brow + nose ridge
  g.strokeStyle = OL; g.lineWidth = 3; g.beginPath(); g.moveTo(-42, 58); g.lineTo(-10, 66); g.moveTo(42, 58); g.lineTo(10, 66); g.stroke();
  bPoly(g, [-5, 66, 5, 66, 8, 84, -8, 84]); bFill(g, '#5c5680', 1.5);
  // gold moustache moulding
  g.fillStyle = gold; g.beginPath(); g.moveTo(0, 86); g.bezierCurveTo(-14, 82, -28, 86, -38, 96); g.bezierCurveTo(-26, 92, -14, 92, 0, 92); g.bezierCurveTo(14, 92, 26, 92, 38, 96); g.bezierCurveTo(28, 86, 14, 82, 0, 86); g.fill(); g.strokeStyle = '#6a4600'; g.lineWidth = 1; g.stroke();
  // mouth vent grille
  roundRect(g, -18, 96, 36, 12, 3); bFill(g, '#14101f', 1.5);
  const vc = angry ? '#ff5a2b' : '#ff9a3d'; g.fillStyle = vc; bGlow(g, vc, 8); for (let k = -3; k <= 3; k++) g.fillRect(k * 5 - 1, 98, 2, 8); bNoGlow(g);
  // throat plates
  for (let k = 0; k < 3; k++){ bPoly(g, [-30 + k * 4, 112 + k * 5, 30 - k * 4, 112 + k * 5, 26 - k * 4, 117 + k * 5, -26 + k * 4, 117 + k * 5]); bFill(g, k % 2 ? lac : '#3a3358', 1.2); }
  if (angry && !o.icon && Math.random() < 0.3){ g.save(); g.globalCompositeOperation = 'lighter'; bolt(g, rand(-60, 60), rand(10, 50), rand(-70, 70), rand(40, 110), '#ff5a7a', 1.5, 4, 5); g.restore(); }
  g.restore();
  if (open && !o.icon){ g.save(); g.font = 'bold 11px ui-monospace,Menlo,monospace'; g.textAlign = 'center'; g.fillStyle = Math.sin(t * 12) > 0 ? '#fff' : '#ff7ae8'; bGlow(g, '#ff2bd6', 10); g.fillText('▲ WEAK POINT 弱点 ▲', x, top + 138 * S); bNoGlow(g); g.restore(); }
  if (!o.icon && (ph === 'laserT' || ph === 'missileT' || ph === 'dronesT')) warnMark(g, x + 110 * S, top + 20 * S, C.red, t);
}
// ---------------------------------------------------------------- 4. SHINKANSEN DRAGON
function trainCar(g, x0, x1, top, bot, t, opts = {}){   // one white bullet-train body section
  roundRect(g, x0, top, x1 - x0, bot - top, 10); bFill(g, vGrad(g, top, bot, '#ffffff', '#b8bedc'), 2.2);
  g.fillStyle = '#1f5cff'; g.fillRect(x0 + 2, bot - (bot - top) * 0.42, x1 - x0 - 4, (bot - top) * 0.12);
  g.fillStyle = '#ff2bd6'; bGlow(g, '#ff2bd6', 6); g.fillRect(x0 + 2, bot - (bot - top) * 0.28, x1 - x0 - 4, 2); bNoGlow(g);
  const wy = top + (bot - top) * 0.2, wh = (bot - top) * 0.2;
  for (let wx = x0 + 8; wx < x1 - 14; wx += 13){ g.fillStyle = '#1a1530'; g.fillRect(wx, wy, 9, wh); g.fillStyle = ((wx * 7) | 0) % 3 ? 'rgba(255,220,150,0.75)' : 'rgba(120,240,255,0.7)'; g.fillRect(wx + 1, wy + 1, 7, wh - 2); }
}
function drawTrain(g, b, t, o, morphK){
  const ph = b.ph, tele = ph === 'hornT' && Math.sin(t * 30) > 0, shakeX = morphK ? (Math.random() - 0.5) * 6 * morphK : 0;
  g.save(); g.translate(shakeX, 0);
  if (ph === 'rush' && !o.icon){ g.strokeStyle = 'rgba(255,255,255,0.45)'; g.lineWidth = 2; for (let k = 0; k < 7; k++){ const ly = -56 + k * 8; g.beginPath(); g.moveTo(-100, ly); g.lineTo(-150 - Math.random() * 70, ly); g.stroke(); } }
  // pantograph horns
  g.strokeStyle = '#8a8fb5'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(-50, -64); g.lineTo(-36, -84); g.lineTo(-20, -64); g.moveTo(-44, -84); g.lineTo(-24, -92); g.moveTo(-36, -84); g.lineTo(-48, -94); g.stroke();
  if (Math.random() < 0.35 || ph === 'sparks'){ g.save(); g.globalCompositeOperation = 'lighter'; bGlow(g, C.yel, 10); bolt(g, -36, -92, -36 + rand(-20, 20), -104 - rand(0, 10), C.yel, 1.8, 3, 4); bNoGlow(g); g.restore(); }
  // body + duck-bill nose
  trainCar(g, -95, 10, -64, -10, t);
  g.beginPath(); g.moveTo(0, -64); g.bezierCurveTo(46, -64, 70, -40, 97, -18); g.quadraticCurveTo(100, -12, 94, -10); g.lineTo(0, -10); g.closePath(); bFill(g, vGrad(g, -64, -10, '#ffffff', '#c4c9e4'), 2.2);
  g.fillStyle = '#1f5cff'; bPoly(g, [0, -33, 60, -33, 88, -22, 90, -20, 0, -20]); g.fill();
  // cockpit windshield = dragon eye
  g.beginPath(); g.moveTo(20, -60); g.bezierCurveTo(40, -58, 52, -50, 62, -40); g.lineTo(34, -40); g.closePath(); g.fillStyle = vGrad(g, -60, -40, '#2a2f5a', '#05040c'); g.fill(); g.strokeStyle = OL; g.lineWidth = 1.5; g.stroke();
  const ey = tele || morphK > 0.3 ? '#ffffff' : C.red; g.fillStyle = ey; bGlow(g, C.red, 14); g.beginPath(); g.ellipse(44, -47, 7, 2.6, 0.4, 0, TAU); g.fill(); bNoGlow(g);
  // headlights
  g.fillStyle = tele ? '#ffffff' : '#fff3a0'; bGlow(g, tele ? '#fff' : '#fff3a0', tele ? 30 : 12); g.beginPath(); g.ellipse(84, -17, 6, 2.5, 0.3, 0, TAU); g.fill(); bNoGlow(g);
  if (tele && !o.icon){ g.save(); g.globalCompositeOperation = 'lighter'; const lg = g.createLinearGradient(90, 0, 260, 0); lg.addColorStop(0, 'rgba(255,250,200,0.55)'); lg.addColorStop(1, 'rgba(255,250,200,0)'); g.fillStyle = lg; bPoly(g, [88, -20, 260, -60, 260, 20, 88, -12]); g.fill(); g.restore(); }
  // dragon kanji roundel
  g.fillStyle = '#e8213f'; g.beginPath(); g.arc(-60, -36, 11, 0, TAU); g.fill(); g.fillStyle = '#fff'; g.font = `900 14px ${CJK_FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; uprightText(g, '竜', -60, -35, o.d || 1);
  // bogies
  for (const wx of [-74, -44, 14, 50]){ g.fillStyle = '#16121f'; g.beginPath(); g.arc(wx, -8, 8, 0, TAU); g.fill(); g.strokeStyle = C.cy; g.lineWidth = 2; g.beginPath(); g.arc(wx, -8, 4.5, b.x / 8, b.x / 8 + 4); g.stroke(); }
  g.fillStyle = '#2a2440'; g.fillRect(-92, -12, 184, 4);
  g.restore();
}
function drawDragonForm(g, b, t, o){
  const ph = b.ph, jaw = ph === 'fire' ? 0.55 : ph === 'fireT' ? 0.25 + 0.1 * Math.sin(t * 20) : ph === 'debrisT' ? 0.4 : 0.08 + 0.05 * Math.sin(t * 2);
  // serpentine body: train-car segments trailing behind the head
  const segs = [];
  for (let i = 0; i < 7; i++){ const sx = -58 - i * 34, sy = Math.sin(t * 3 - i * 0.8) * 14 + i * 3 + 6; segs.push([sx, sy]); }
  for (let i = segs.length - 1; i >= 0; i--){
    const [sx, sy] = segs[i], sc = 1 - i * 0.06;
    g.save(); g.translate(sx, sy); g.scale(sc, sc); g.rotate(Math.cos(t * 3 - i * 0.8) * 0.25);
    if (i === 1 || i === 4){ for (const lx of [-8, 8]){ g.strokeStyle = OL; g.lineWidth = 5; g.beginPath(); g.moveTo(lx, 12); g.lineTo(lx + 4, 26 + Math.sin(t * 6 + i + lx) * 3); g.stroke(); g.strokeStyle = '#9aa0c8'; g.lineWidth = 3; g.stroke(); g.fillStyle = '#ffcc4d'; bPoly(g, [lx + 4, 26, lx + 10, 30, lx + 2, 31]); g.fill(); } }
    trainCar(g, -20, 20, -16, 16, t);
    g.fillStyle = '#ff2bd6'; bGlow(g, '#ff2bd6', 8); bPoly(g, [-6, -16, 0, -26 - (i % 2) * 3, 6, -16]); g.fill(); bNoGlow(g);
    if (i === segs.length - 1){ g.fillStyle = C.cy; bGlow(g, C.cy, 12); bPoly(g, [-20, -10, -44, -22, -36, 0, -44, 20, -20, 10]); g.fill(); bNoGlow(g); }
    g.restore();
  }
  // neck joint
  g.fillStyle = '#2a2440'; g.beginPath(); g.ellipse(-40, 6, 14, 16, 0, 0, TAU); g.fill();
  // antler pantographs + neon mane
  g.strokeStyle = '#9aa0c8'; g.lineWidth = 3; g.lineCap = 'round'; g.beginPath(); g.moveTo(-14, -22); g.lineTo(-34, -46); g.lineTo(-52, -50); g.moveTo(-28, -38); g.lineTo(-24, -56); g.moveTo(-2, -24); g.lineTo(-16, -50); g.lineTo(-30, -60); g.stroke(); g.lineCap = 'butt';
  g.fillStyle = '#ff2bd6'; bGlow(g, '#ff2bd6', 10); for (let k = 0; k < 4; k++){ const mx = -30 - k * 7; bPoly(g, [mx, -14, mx - 10, -30 - Math.sin(t * 8 + k) * 4, mx - 6, -10]); g.fill(); } bNoGlow(g);
  // lower jaw (hinged)
  g.save(); g.translate(-18, 8); g.rotate(jaw);
  g.beginPath(); g.moveTo(0, -4); g.lineTo(62, -2); g.quadraticCurveTo(70, 2, 62, 8); g.lineTo(0, 12); g.closePath(); bFill(g, vGrad(g, -4, 12, '#d8dcf0', '#9aa0c8'), 2);
  g.fillStyle = '#fff6e0'; for (let k = 0; k < 6; k++){ bPoly(g, [8 + k * 9, -3, 12 + k * 9, -3, 10 + k * 9, -9]); g.fill(); }
  g.restore();
  // mouth glow
  if (ph === 'fireT' || ph === 'fire'){ g.save(); g.globalCompositeOperation = 'lighter'; const mg = g.createRadialGradient(40, 10, 0, 40, 10, 34); mg.addColorStop(0, '#fff'); mg.addColorStop(0.3, '#ff9a3d'); mg.addColorStop(1, 'rgba(255,43,214,0)'); g.fillStyle = mg; g.beginPath(); g.arc(40, 10, 34, 0, TAU); g.fill(); g.restore(); }
  // upper jaw = bullet-train nose
  g.beginPath(); g.moveTo(-30, -24); g.bezierCurveTo(10, -30, 44, -20, 66, -2); g.quadraticCurveTo(72, 4, 64, 8); g.lineTo(-24, 10); g.quadraticCurveTo(-36, -6, -30, -24); g.closePath(); bFill(g, vGrad(g, -30, 10, '#ffffff', '#bfc4e0'), 2.4);
  g.fillStyle = '#1f5cff'; bPoly(g, [-26, -4, 40, -4, 62, 4, 60, 6, -24, 6]); g.fill();
  g.fillStyle = '#fff6e0'; for (let k = 0; k < 6; k++){ bPoly(g, [10 + k * 9, 8, 14 + k * 9, 8, 12 + k * 9, 14]); g.fill(); }
  // windshield eye
  g.beginPath(); g.moveTo(-6, -24); g.bezierCurveTo(10, -24, 22, -18, 30, -10); g.lineTo(4, -10); g.closePath(); g.fillStyle = '#05040c'; g.fill();
  g.fillStyle = C.red; bGlow(g, C.red, 16); g.beginPath(); g.ellipse(14, -16, 8, 3, 0.35, 0, TAU); g.fill(); bNoGlow(g);
  g.fillStyle = '#fff'; g.beginPath(); g.arc(17, -17, 1.4, 0, TAU); g.fill();
  // neon whiskers
  g.strokeStyle = C.cy; g.lineWidth = 2; bGlow(g, C.cy, 10); for (const sd of [0, 1]){ g.beginPath(); g.moveTo(56, 2 + sd * 6); for (let k = 1; k <= 6; k++) g.lineTo(56 - k * 12, 10 + sd * 8 + k * 3 + Math.sin(t * 5 + k * 0.8 + sd) * 6); g.stroke(); } bNoGlow(g);
  // headlight nostril
  g.fillStyle = '#fff3a0'; bGlow(g, '#fff3a0', 12); g.beginPath(); g.ellipse(60, -1, 4, 2, 0.3, 0, TAU); g.fill(); bNoGlow(g);
}
function drawDragon(g, b, x, by, o){
  const t = o.t, d = b.dir || -1, S = o.s || 1;
  g.save();
  if (b.form === 'train' || o.train){
    o.d = d; g.translate(x, by); g.scale(d * S, S);
    if (!o.icon){ g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.ellipse(0, 0, 100, 7, 0, 0, TAU); g.fill(); }
    if (b.ph === 'morph'){
      const k = 1 - b.pt / 2.2;
      if (k < 0.62){ drawTrain(g, b, t, o, k); g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = k; g.fillStyle = '#fff'; bGlow(g, '#ff2bd6', 30); roundRect(g, -95, -64, 190, 54, 14); g.fill(); bNoGlow(g); g.restore(); }
      else { const k2 = (k - 0.62) / 0.38; g.translate(0, -35 - k2 * 30); g.scale(0.6 + 0.4 * k2, 0.6 + 0.4 * k2); drawDragonForm(g, b, t, o); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 1 - k2; g.fillStyle = '#fff'; g.beginPath(); g.arc(0, 0, 80, 0, TAU); g.fill(); }
      if (!o.icon && Math.random() < 0.8 && typeof addP === 'function') addP({ x: b.x + b.w / 2 + rand(-90, 90), y: b.y + rand(0, 60), vx: rand(-200, 200), vy: rand(-300, -60), life: 0.5, col: pick(['#fff', C.cy, '#ff2bd6', C.yel]), s: 3, g: 600 });
    } else drawTrain(g, b, t, o, 0);
  } else {
    g.translate(x, by - b.h / 2 * S); g.scale(d * S, S);
    if (b.ph === 'swoop' && !o.icon){ g.strokeStyle = 'rgba(255,255,255,0.4)'; g.lineWidth = 2; for (let k = 0; k < 6; k++){ g.beginPath(); g.moveTo(-60, -20 + k * 8); g.lineTo(-120 - Math.random() * 80, -20 + k * 8); g.stroke(); } }
    drawDragonForm(g, b, t, o);
  }
  g.restore();
  if (!o.icon && (b.ph === 'hornT' || b.ph === 'fireT' || b.ph === 'swoopT' || b.ph === 'debrisT')) warnMark(g, x, by - (b.form === 'train' ? 110 : 120) * S, b.ph === 'debrisT' ? C.yel : C.red, t);
}
function drawBossArt(g, b, x, by, o = {}){
  o.t = o.t ?? globalT;
  if (b.type === 'oni') drawOni(g, b, x, by, o);
  else if (b.type === 'kite') drawKite(g, b, x, by, o);
  else if (b.type === 'shogun') drawShogun(g, b, x, by, o);
  else if (b.type === 'dragon') drawDragon(g, b, x, by, o);
}
// a posed dummy boss for icons / intro card portraits
function bossDummy(type){ const d = { oni: [76, 84], kite: [84, 56], shogun: [150, 120], dragon: [110, 70] }[type]; return { type, w: d[0], h: d[1], ph: 'idle', pt: 1, dir: -1, hp: 2, max: 2, angry: false, open: 0, form: type === 'dragon' ? 'dragon' : '', beams: [], decoys: [], vx: 0, vy: 0, x: 0, k: 0 }; }
function drawBossIcon(g, type, w, h, t = globalT){
  const b = bossDummy(type);
  const fit = { oni: [0.66, 0.9, 0.5], kite: [0.6, 0.62, 0.54], shogun: [0.42, 0.9, 0.5], dragon: [0.34, 0.6, 0.62] }[type];
  const s = Math.min(w, h) / 100 * fit[0] * 1.3;
  drawBossArt(g, b, w * fit[2], h * fit[1], { icon: true, s, t });
}
// ---------------------------------------------------------------- in-game boss draw + death explosion sequence
function drawBoss(b){
  if (b.dead && b.deadT > 1.6) return;
  const x = b.x + b.w / 2 - CAM.x, by = b.y + b.h - CAM.y;
  ctx.save();
  if (b.dead){ ctx.globalAlpha = Math.max(0, 1 - b.deadT / 1.6); ctx.translate(rand(-5, 5), rand(-5, 5) + b.deadT * 18); }
  drawBossArt(ctx, b, x, by, { world: true, wx: b.x + b.w / 2, wy: b.y + b.h });
  if (b.flash > 0){ ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(255,240,250,0.22)'; roundRect(ctx, b.x - CAM.x, b.y - CAM.y, b.w, b.h, 20); ctx.fill(); ctx.globalCompositeOperation = 'source-over'; }
  if (b.slow > 0){ ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(150,200,255,0.22)'; roundRect(ctx, b.x - CAM.x, b.y - CAM.y, b.w, b.h, 20); ctx.fill(); }
  ctx.restore();
}
function bossDeathFx(b, dt){
  if (!b || !b.dead || b.deadT > 1.7) return;
  V.bossFxT = (V.bossFxT || 0) - dt;
  if (V.bossFxT > 0) return;
  V.bossFxT = 0.11;
  const x = b.x + rand(0, b.w), y = b.y + rand(0, b.h), col = (BOSS_INFO[b.type] || {}).col || C.org;
  for (let k = 0; k < 2; k++) ring(x, y, k ? col : '#fff', 18 + k * 14, 0.45, 4);
  burst(x, y, C.org, 16, 260, { cols: [C.org, '#fff', C.yel, col], g: 80 });
  shake(5); if (Math.random() < 0.6) Sfx.boom();
}
