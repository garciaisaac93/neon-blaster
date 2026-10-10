// ---------------------------------------------------------------- particles (visual only, never touch the sim)
let parts = [], bolts = [], texts = [];
function addP(o){ if (parts.length < 700) parts.push(o); }
function burst(x, y, col, n, spd, o = {}){
  for (let i = 0; i < n; i++){ const a = rand(0, TAU), v = rand(spd * 0.3, spd); addP({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - (o.up || 0), life: rand(0.3, o.life || 0.7), max: 0, col: o.cols ? pick(o.cols) : col, s: rand(1.5, o.size || 3.5), g: o.g ?? 500, k: o.k || 'dot' }); }
}
function ring(x, y, col, r, life = 0.4, w = 3){ addP({ x, y, vx: 0, vy: 0, life, max: life, col, s: r, g: 0, k: 'ring', w }); }
function ftext(x, y, str, col){ texts.push({ x, y, str, col, life: 1.1 }); }
function updateParts(dt){
  for (const p of parts){ if (!p.max) p.max = p.life; p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.g * dt; if (p.k === 'puff'){ p.vx *= 0.92; p.vy *= 0.92; } }
  parts = parts.filter(p => p.life > 0);
  for (const b of bolts) b.life -= dt; bolts = bolts.filter(b => b.life > 0);
  for (const t of texts){ t.life -= dt; t.y -= 40 * dt; } texts = texts.filter(t => t.life > 0);
}
function drawParts(){
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (const p of parts){
    const a = clamp(p.life / p.max, 0, 1), x = p.x - CAM.x, y = p.y - CAM.y;
    if (x < -60 || x > VW + 60 || y < -60 || y > VH + 60) continue;
    ctx.globalAlpha = a;
    if (p.k === 'ring'){ ctx.strokeStyle = p.col; ctx.lineWidth = p.w * a; ctx.beginPath(); ctx.arc(x, y, p.s * (1.15 - a) * 1.6 + 2, 0, TAU); ctx.stroke(); }
    else if (p.k === 'puff'){ ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = p.col; ctx.globalAlpha = a * 0.5; ctx.beginPath(); ctx.arc(x, y, p.s * (2 - a), 0, TAU); ctx.fill(); ctx.globalCompositeOperation = 'lighter'; }
    else if (p.k === 'shard'){ ctx.fillStyle = p.col; ctx.save(); ctx.translate(x, y); ctx.rotate(p.life * 9); ctx.fillRect(-p.s, -p.s * 0.5, p.s * 2, p.s); ctx.restore(); }
    else if (p.k === 'star'){ ctx.fillStyle = p.col; ctx.save(); ctx.translate(x, y); ctx.rotate(p.life * 6); ctx.beginPath(); for (let i = 0; i < 10; i++){ const r = i % 2 ? p.s * 0.45 : p.s * 1.2, an = i * Math.PI / 5; ctx.lineTo(Math.cos(an) * r, Math.sin(an) * r); } ctx.fill(); ctx.restore(); }
    else { ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(x, y, p.s * (0.4 + a * 0.6), 0, TAU); ctx.fill(); }
  }
  ctx.globalAlpha = 1;
  for (const b of bolts){
    ctx.strokeStyle = b.col; ctx.lineWidth = 3 * b.life / 0.3 + 1; glow(b.col, 16);
    for (let k = 0; k < b.pts.length - 1; k++){
      const [x0, y0] = b.pts[k], [x1, y1] = b.pts[k + 1];
      ctx.beginPath(); ctx.moveTo(x0 - CAM.x, y0 - CAM.y);
      for (let i = 1; i < 7; i++){ const f = i / 7; ctx.lineTo(lerp(x0, x1, f) - CAM.x + rand(-9, 9), lerp(y0, y1, f) - CAM.y + rand(-9, 9)); }
      ctx.lineTo(x1 - CAM.x, y1 - CAM.y); ctx.stroke();
    }
    noGlow();
  }
  ctx.restore();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = 'bold 15px ui-monospace,Menlo,monospace';
  for (const t of texts){ ctx.globalAlpha = clamp(t.life * 2, 0, 1); ctx.fillStyle = t.col; glow(t.col, 8); ctx.fillText(t.str, t.x - CAM.x, t.y - CAM.y); noGlow(); }
  ctx.globalAlpha = 1;
}
// ---------------------------------------------------------------- enemies
function eyes(x, y, dx, sz, col){
  ctx.fillStyle = col; glow(col, 8);
  ctx.beginPath(); ctx.ellipse(x - sz * 1.3 + dx, y, sz * 0.8, sz * 1.15, 0, 0, TAU); ctx.ellipse(x + sz * 1.3 + dx, y, sz * 0.8, sz * 1.15, 0, 0, TAU); ctx.fill(); noGlow();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x - sz * 1.5 + dx, y - sz * 0.4, sz * 0.3, 0, TAU); ctx.arc(x + sz * 1.1 + dx, y - sz * 0.4, sz * 0.3, 0, TAU); ctx.fill();
}
function drawEnemy(e, s){
  const x = e.x + e.w / 2 - CAM.x, y = e.y + e.h / 2 - CAM.y;
  if (x < -80 || x > VW + 80 || y < -80 || y > VH + 80) return;
  const p = s.p, look = clamp((p.x - e.x) / 200, -1, 1) * 2.5, t = globalT + e.id;
  ctx.save();
  if (e.type === 'drone'){
    const sp = Math.sin(t * 30);
    ctx.strokeStyle = '#3a3460'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y - 12); ctx.lineTo(x, y - 17); ctx.stroke();
    ctx.fillStyle = 'rgba(200,220,255,0.7)'; ctx.beginPath(); ctx.ellipse(x, y - 18, 14 * Math.abs(sp) + 2, 2.2, 0, 0, TAU); ctx.fill();
    const g = ctx.createRadialGradient(x - 4, y - 5, 2, x, y, 14); g.addColorStop(0, '#ffffff'); g.addColorStop(0.7, '#cfc8ff'); g.addColorStop(1, '#7a6fc0');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 13, 0, TAU); ctx.fill();
    ctx.fillStyle = '#0a0a16'; ctx.beginPath(); ctx.ellipse(x + look, y + 1, 8.5, 7, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = C.mg; glow(C.mg, 10); ctx.beginPath(); ctx.arc(x + look * 1.4, y + 1, 3.6, 0, TAU); ctx.fill(); noGlow();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x + look * 1.4 - 1.2, y - 0.3, 1.2, 0, TAU); ctx.fill();
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; const tg = ctx.createRadialGradient(x, y + 16, 1, x, y + 16, 12); tg.addColorStop(0, 'rgba(255,43,214,0.6)'); tg.addColorStop(1, 'rgba(255,43,214,0)'); ctx.fillStyle = tg; ctx.fillRect(x - 12, y + 6, 24, 22); ctx.restore();
  } else if (e.type === 'hopper'){
    const st = e.onGround ? 0.12 * Math.max(0, Math.sin(e.cd * 6)) : -0.12;
    const bh = 22 * (1 - st), by = e.y + e.h - CAM.y - 10;
    ctx.strokeStyle = '#9aa3c6'; ctx.lineWidth = 2.5; ctx.beginPath();
    for (const lx of [-7, 7]){ ctx.moveTo(x + lx, by); for (let k = 1; k <= 4; k++) ctx.lineTo(x + lx + (k % 2 ? 3 : -3), by + k * 2.5); }
    ctx.stroke();
    ctx.fillStyle = '#20223a'; ctx.fillRect(x - 11, by + 9, 8, 3); ctx.fillRect(x + 3, by + 9, 8, 3);
    const g = ctx.createLinearGradient(0, by - bh, 0, by); g.addColorStop(0, '#ff9ad5'); g.addColorStop(1, '#c2368f');
    ctx.fillStyle = g; roundRect(ctx, x - 15, by - bh, 30, bh, 8); ctx.fill();
    ctx.fillStyle = '#16101f'; roundRect(ctx, x - 11, by - bh + 4, 22, 11, 5); ctx.fill();
    eyes(x, by - bh + 9.5, look, 2.4, C.cy);
    ctx.fillStyle = '#ffe0f2'; ctx.fillRect(x - 2, by - bh - 5, 4, 5); ctx.fillStyle = C.yel; glow(C.yel, 6); ctx.beginPath(); ctx.arc(x, by - bh - 6, 2.5, 0, TAU); ctx.fill(); noGlow();
  } else if (e.type === 'turret'){
    const m = e.mount;
    ctx.fillStyle = '#262640';
    if (m === -1){ ctx.fillRect(x - 3, e.y - CAM.y, 6, 10); ctx.fillRect(x - 10, e.y - CAM.y - 2, 20, 4); }
    else { roundRect(ctx, x - 12, e.y + e.h - CAM.y - 10, 24, 10, 3); ctx.fill(); ctx.fillRect(x - 3, y, 6, e.h / 2); }
    const a = e.aim ?? 0;
    ctx.save(); ctx.translate(x, y + (m === -1 ? 4 : -2)); ctx.rotate(a); if (Math.cos(a) < 0) ctx.scale(1, -1);
    const g = ctx.createLinearGradient(0, -9, 0, 9); g.addColorStop(0, '#f0f2ff'); g.addColorStop(1, '#8c90b8');
    ctx.fillStyle = g; roundRect(ctx, -12, -8, 24, 16, 5); ctx.fill();
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(10, 0, 6, 0, TAU); ctx.fill();
    const warn = e.cd < 0.5;
    ctx.fillStyle = warn ? '#fff' : C.red; glow(C.red, warn ? 18 : 8); ctx.beginPath(); ctx.arc(10, 0, warn ? 4 : 3, 0, TAU); ctx.fill(); noGlow();
    ctx.fillStyle = Math.sin(globalT * 8) > 0 ? C.grn : '#123'; ctx.fillRect(-8, -5, 3, 3);
    ctx.restore();
  } else if (e.type === 'jelly'){
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = 'rgba(255,120,230,0.65)'; ctx.lineWidth = 2;
    for (let k = 0; k < 4; k++){ const tx = x - 9 + k * 6; ctx.beginPath(); ctx.moveTo(tx, y + 2); for (let j = 1; j <= 5; j++) ctx.lineTo(tx + Math.sin(t * 4 + j + k) * 3, y + 2 + j * 4); ctx.stroke(); }
    ctx.restore();
    const g = ctx.createRadialGradient(x - 4, y - 8, 2, x, y - 2, 18); g.addColorStop(0, 'rgba(255,230,250,0.95)'); g.addColorStop(0.6, 'rgba(230,90,220,0.75)'); g.addColorStop(1, 'rgba(140,40,200,0.55)');
    ctx.fillStyle = g; glow(C.mg, 14); ctx.beginPath(); ctx.arc(x, y + 2, 15, Math.PI, 0); ctx.quadraticCurveTo(x + 15, y + 6, x, y + 5); ctx.quadraticCurveTo(x - 15, y + 6, x - 15, y + 2); ctx.fill(); noGlow();
    ctx.fillStyle = '#2a0b30'; ctx.beginPath(); ctx.arc(x - 5 + look * 0.5, y - 3, 2.2, 0, TAU); ctx.arc(x + 5 + look * 0.5, y - 3, 2.2, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,120,170,0.6)'; ctx.beginPath(); ctx.arc(x - 9, y + 1, 2, 0, TAU); ctx.arc(x + 9, y + 1, 2, 0, TAU); ctx.fill();
  }
  if (e.flash > 0){ ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.arc(x, y, e.w * 0.6, 0, TAU); ctx.fill(); ctx.globalCompositeOperation = 'source-over'; }
  if (e.frozen > 0){
    const bx = e.x - CAM.x - 4, by = e.y - CAM.y - 4, bw = e.w + 8, bh = e.h + 8, blink = e.frozen < 1.2 && Math.sin(globalT * 20) > 0;
    const ig = ctx.createLinearGradient(bx, by, bx + bw, by + bh); ig.addColorStop(0, 'rgba(225,245,255,0.85)'); ig.addColorStop(1, 'rgba(120,180,255,0.55)');
    ctx.fillStyle = ig; roundRect(ctx, bx, by, bw, bh, 5); ctx.fill();
    ctx.strokeStyle = blink ? '#fff' : 'rgba(255,255,255,0.9)'; ctx.lineWidth = 1.5; glow('#9ed0ff', 10); ctx.stroke(); noGlow();
    ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fillRect(bx + 4, by + 4, bw * 0.4, 3); ctx.fillRect(bx + 4, by + 9, 3, bh * 0.3);
  }
  ctx.restore();
}
