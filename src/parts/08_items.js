// ---------------------------------------------------------------- shots, enemy bullets, pickups, platforms, checkpoints, goal, signs
function drawShots(s){
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (const q of s.shots){
    const x = q.x - CAM.x, y = q.y - CAM.y, col = Sim.SUITS[q.suit].color, ang = Math.atan2(q.vy, q.vx);
    if (q.disc){
      ctx.save(); ctx.translate(x, y); ctx.rotate(globalT * 20);
      ctx.fillStyle = 'rgba(93,255,158,0.35)'; ctx.beginPath(); ctx.arc(0, 0, q.r + 5, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#d9ffe9'; ctx.lineWidth = 3; glow(C.grn, 14); ctx.beginPath(); for (let k = 0; k < 6; k++){ const a = k * Math.PI / 3; ctx.lineTo(Math.cos(a) * q.r, Math.sin(a) * q.r); } ctx.closePath(); ctx.stroke();
      ctx.fillStyle = C.yel; ctx.beginPath(); ctx.arc(0, 0, 3, 0, TAU); ctx.fill(); noGlow(); ctx.restore(); continue;
    }
    if (q.lance){
      ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
      const lg = ctx.createLinearGradient(-60, 0, 20, 0); lg.addColorStop(0, 'rgba(158,208,255,0)'); lg.addColorStop(1, 'rgba(230,248,255,0.95)');
      ctx.fillStyle = lg; glow('#9ed0ff', 18); ctx.beginPath(); ctx.moveTo(22, 0); ctx.lineTo(4, -9); ctx.lineTo(-60, -3); ctx.lineTo(-60, 3); ctx.lineTo(4, 9); ctx.closePath(); ctx.fill(); noGlow(); ctx.restore(); continue;
    }
    if (q.freeze){
      ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
      ctx.fillStyle = 'rgba(158,208,255,0.35)'; ctx.fillRect(-22, -2, 18, 4);
      ctx.fillStyle = '#eaf7ff'; glow('#9ed0ff', 12); ctx.beginPath(); ctx.moveTo(9, 0); ctx.lineTo(0, -5); ctx.lineTo(-7, 0); ctx.lineTo(0, 5); ctx.closePath(); ctx.fill(); noGlow(); ctx.restore(); continue;
    }
    if (q.fire){
      const r = q.r * (q.big ? 1.3 : 1.45);
      for (let k = 1; k <= 3; k++){ ctx.fillStyle = `rgba(255,${120 - k * 25},60,${0.35 / k})`; ctx.beginPath(); ctx.arc(x - q.vx * 0.012 * k, y - q.vy * 0.012 * k, r * (1 - k * 0.15), 0, TAU); ctx.fill(); }
      const fg = ctx.createRadialGradient(x, y, 0, x, y, r * 1.6); fg.addColorStop(0, '#fff6d0'); fg.addColorStop(0.4, '#ff8a2b'); fg.addColorStop(1, 'rgba(255,43,214,0)');
      ctx.fillStyle = fg; ctx.beginPath(); ctx.arc(x, y, r * 1.6, 0, TAU); ctx.fill();
      if (Math.random() < 0.4) addP({ x: q.x, y: q.y, vx: rand(-30, 30), vy: rand(-60, 0), life: 0.3, col: '#ff7a2b', s: 2.5, g: -100 });
      continue;
    }
    if (q.home){
      const r = q.r * (q.big ? 1.4 : 1);
      ctx.strokeStyle = C.yel; ctx.lineWidth = 1.5; glow(C.yel, 12); ctx.beginPath(); ctx.moveTo(x, y); for (let k = 1; k < 4; k++) ctx.lineTo(x - q.vx * 0.012 * k + rand(-4, 4), y - q.vy * 0.012 * k + rand(-4, 4)); ctx.stroke();
      ctx.fillStyle = '#fffbe0'; ctx.save(); ctx.translate(x, y); ctx.rotate(globalT * 12); ctx.beginPath(); for (let i = 0; i < 8; i++){ const rr = i % 2 ? r * 0.5 : r * 1.4, a = i * Math.PI / 4; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } ctx.fill(); ctx.restore(); noGlow();
      continue;
    }
    // volt
    const r = q.r;
    ctx.fillStyle = hexA(col, 0.25); ctx.beginPath(); ctx.ellipse(x - Math.sign(q.vx) * r * 1.2, y, r * 2.4, r * 0.9, 0, 0, TAU); ctx.fill();
    const g = ctx.createRadialGradient(x, y, 0, x, y, r * 1.8); g.addColorStop(0, '#ffffff'); g.addColorStop(0.45, col); g.addColorStop(1, hexA(col, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 1.8, 0, TAU); ctx.fill();
    if (q.big){ ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, r * 1.3, globalT * 15, globalT * 15 + 4); ctx.stroke(); }
  }
  ctx.restore();
  for (const b of s.ebul){
    const x = b.x - CAM.x, y = b.y - CAM.y;
    if (b.k === 'bubble'){
      ctx.fillStyle = 'rgba(180,240,255,0.18)'; ctx.strokeStyle = 'rgba(220,250,255,0.85)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(x, y, b.r, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,150,240,0.7)'; ctx.beginPath(); ctx.arc(x, y, b.r - 3, 3.6, 4.6); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x - b.r * 0.35, y - b.r * 0.35, 2, 0, TAU); ctx.fill();
    } else if (b.k === 'wave'){
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const wg = ctx.createLinearGradient(0, y - 30, 0, y + 14); wg.addColorStop(0, 'rgba(255,215,106,0)'); wg.addColorStop(1, 'rgba(255,215,106,0.85)');
      ctx.fillStyle = wg; ctx.beginPath(); ctx.moveTo(x - 18, y + 14); ctx.quadraticCurveTo(x, y - 34 + Math.sin(globalT * 30) * 4, x + 18, y + 14); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 14, y + 14); ctx.quadraticCurveTo(x, y - 22, x + 14, y + 14); ctx.stroke(); ctx.restore();
    } else if (b.k === 'shuriken'){
      ctx.save(); ctx.translate(x, y); ctx.rotate(globalT * 18 + b.x * 0.01);
      ctx.fillStyle = '#e8ecff'; glow('#ff2bd6', 12); ctx.beginPath(); for (let i = 0; i < 8; i++){ const r = i % 2 ? 3 : 11, a = i * Math.PI / 4; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); ctx.fill(); noGlow();
      ctx.strokeStyle = '#ff2bd6'; ctx.lineWidth = 1.2; ctx.stroke(); ctx.fillStyle = '#1a1530'; ctx.beginPath(); ctx.arc(0, 0, 2.5, 0, TAU); ctx.fill(); ctx.restore();
    } else if (b.k === 'missile'){
      const a = Math.atan2(b.vy, b.vx);
      ctx.save(); ctx.translate(x, y); ctx.rotate(a);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; const fl = 14 + Math.sin(globalT * 50) * 4, fg = ctx.createLinearGradient(-8, 0, -8 - fl, 0); fg.addColorStop(0, '#fff'); fg.addColorStop(0.4, C.org); fg.addColorStop(1, 'rgba(255,90,40,0)'); ctx.fillStyle = fg; ctx.beginPath(); ctx.moveTo(-8, -4); ctx.lineTo(-8 - fl, 0); ctx.lineTo(-8, 4); ctx.fill(); ctx.restore();
      ctx.fillStyle = '#d8dcf0'; roundRect(ctx, -9, -4.5, 16, 9, 4); ctx.fill(); ctx.fillStyle = C.red; glow(C.red, 10); ctx.beginPath(); ctx.moveTo(7, -4.5); ctx.lineTo(13, 0); ctx.lineTo(7, 4.5); ctx.fill(); noGlow();
      ctx.fillStyle = '#5a0f22'; ctx.beginPath(); ctx.moveTo(-9, -4); ctx.lineTo(-13, -8); ctx.lineTo(-5, -4); ctx.moveTo(-9, 4); ctx.lineTo(-13, 8); ctx.lineTo(-5, 4); ctx.fill();
      if (Math.sin(globalT * 16) > 0){ ctx.strokeStyle = 'rgba(255,59,92,0.8)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(0, 0, 13, 0, TAU); ctx.stroke(); }
      ctx.restore();
    } else if (b.k === 'fire'){
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let k = 0; k < 3; k++){ const ox = -b.vx * 0.012 * k, oy = -b.vy * 0.012 * k, r = b.r * (1.6 - k * 0.35); const g = ctx.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, r); g.addColorStop(0, k ? 'rgba(255,90,200,0.7)' : '#fff'); g.addColorStop(0.45, k ? 'rgba(255,43,214,0.5)' : C.org); g.addColorStop(1, 'rgba(255,43,214,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x + ox, y + oy, r, 0, TAU); ctx.fill(); }
      ctx.restore();
    } else if (b.k === 'debris'){
      if (b.wait > 0){
        const gy = (b.gy || b.y + 300) - CAM.y, a = 0.5 + 0.5 * Math.sin(globalT * 24);
        ctx.save(); ctx.fillStyle = `rgba(255,59,92,${0.25 + 0.35 * a})`; ctx.beginPath(); ctx.ellipse(x, gy - 2, 22, 5, 0, 0, TAU); ctx.fill();
        ctx.strokeStyle = `rgba(255,215,106,${0.5 + 0.5 * a})`; ctx.lineWidth = 2; ctx.setLineDash([4, 5]); ctx.beginPath(); ctx.moveTo(x, y + 14); ctx.lineTo(x, gy - 6); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = C.yel; ctx.font = 'bold 14px Arial,sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('!', x, gy - 16); ctx.restore();
      }
      ctx.save(); ctx.translate(x, y); ctx.rotate(b.x * 0.05 + (b.wait > 0 ? 0 : globalT * 6));
      ctx.fillStyle = '#4a4468'; ctx.beginPath(); ctx.moveTo(-12, -8); ctx.lineTo(4, -12); ctx.lineTo(13, -2); ctx.lineTo(8, 11); ctx.lineTo(-9, 10); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#0a0714'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#ffd76a'; ctx.fillRect(-8, -2, 14, 3); ctx.restore();
      if (b.wait <= 0 && Math.random() < 0.6) addP({ x: b.x + rand(-8, 8), y: b.y - 10, vx: rand(-60, 60), vy: rand(-80, 0), life: 0.3, col: pick([C.yel, '#fff', C.cy]), s: 2, g: 300 });
    } else {
      const col = b.k === 'arc' ? C.yel : b.k === 'zap' ? C.cy : C.mg;
      if (b.k === 'zap'){ ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; for (let k = 0; k < 2; k++){ ctx.beginPath(); ctx.moveTo(x, y); for (let i = 1; i < 4; i++) ctx.lineTo(x + rand(-14, 14), y + rand(-14, 14)); ctx.stroke(); } ctx.restore(); }
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(x, y, 0, x, y, b.r * 2); g.addColorStop(0, '#fff'); g.addColorStop(0.4, col); g.addColorStop(1, hexA(col, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, b.r * 2, 0, TAU); ctx.fill(); ctx.restore();
    }
  }
}
function drawPicks(s){
  for (const k of s.picks){
    const x = k.x + k.w / 2 - CAM.x, by = Math.sin(globalT * 3 + k.id) * 3, y = k.y + k.h / 2 - CAM.y + (k.fixed ? by : 0);
    if (x < -60 || x > VW + 60 || y < -80 || y > VH + 60) continue;
    if (k.life !== undefined && k.life < 2 && Math.sin(globalT * 25) > 0) continue;
    if (k.k === 'cell' || k.k === 'big'){
      const r = k.k === 'big' ? 13 : 8, col = k.k === 'big' ? C.mg : C.cy, sq = Math.cos(globalT * 3 + k.id);
      ctx.save(); ctx.translate(x, y); ctx.scale(Math.max(0.25, Math.abs(sq)), 1);
      ctx.fillStyle = hexA(col, 0.9); glow(col, 14); ctx.beginPath(); for (let i = 0; i < 6; i++){ const a = i * Math.PI / 3 + Math.PI / 6; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); ctx.fill(); noGlow();
      ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.beginPath(); for (let i = 0; i < 6; i++){ const a = i * Math.PI / 3 + Math.PI / 6; ctx.lineTo(Math.cos(a) * r * 0.45, Math.sin(a) * r * 0.45); } ctx.fill();
      ctx.restore();
    } else if (k.k === 'hp' || k.k === 'HP'){
      const big = k.k === 'HP', w = big ? 26 : 18, h = big ? 18 : 12;
      ctx.fillStyle = '#fff'; glow(C.grn, 12); roundRect(ctx, x - w / 2, y - h / 2, w, h, h / 2); ctx.fill(); noGlow();
      ctx.fillStyle = C.grn; roundRect(ctx, x, y - h / 2, w / 2, h, h / 2); ctx.fill(); ctx.fillRect(x, y - h / 2, 2, h);
      ctx.fillStyle = '#ff4b7d'; ctx.fillRect(x - w / 4 - 1.5, y - h * 0.32, 3, h * 0.64); ctx.fillRect(x - w / 4 - h * 0.32, y - 1.5, h * 0.64, 3);
    } else if (k.k === 'capsule'){
      const col = Sim.SUITS[k.suit].color;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const bg = ctx.createLinearGradient(0, y - 160, 0, y + 20); bg.addColorStop(0, hexA(col, 0)); bg.addColorStop(1, hexA(col, 0.3));
      ctx.fillStyle = bg; ctx.fillRect(x - 18, y - 160, 36, 180); ctx.restore();
      ctx.strokeStyle = col; ctx.lineWidth = 2; glow(col, 14); ctx.beginPath(); ctx.ellipse(x, y + 18, 20, 5, 0, 0, TAU); ctx.stroke();
      ctx.fillStyle = 'rgba(10,8,30,0.7)'; roundRect(ctx, x - 14, y - 20, 28, 40, 12); ctx.fill(); ctx.stroke(); noGlow();
      drawRoninHead(ctx, k.suit, x - 2, y + 26, 0.55);
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(x - 10, y - 16, 4, 26);
      ctx.font = 'bold 11px ui-monospace,Menlo,monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff'; glow(col, 10);
      ctx.fillText(Sim.SUITS[k.suit].name + ' SUIT', x, y - 34 + by); noGlow();
    }
  }
}
function drawPlats(s){
  for (const pl of s.plats){
    const x = pl.x - CAM.x, y = pl.y - CAM.y;
    if (x > VW + 50 || x + pl.w < -50) continue;
    if (pl.ay){ // elevator
      ctx.strokeStyle = 'rgba(150,150,190,0.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + 14, y); ctx.lineTo(x + 14, -10); ctx.moveTo(x + pl.w - 14, y); ctx.lineTo(x + pl.w - 14, -10); ctx.stroke();
      ctx.fillStyle = '#3a3f60'; roundRect(ctx, x, y, pl.w, 14, 3); ctx.fill();
      ctx.fillStyle = C.yel; glow(C.am, 8); ctx.fillRect(x + 4, y + 2, pl.w - 8, 2); noGlow();
      ctx.fillStyle = Math.sin(globalT * 6) > 0 ? C.am : '#552'; ctx.fillRect(x + 4, y + 8, 6, 3); ctx.fillRect(x + pl.w - 10, y + 8, 6, 3);
      ctx.fillStyle = 'rgba(10,8,20,0.8)'; ctx.fillRect(x + 6, y + 14, pl.w - 12, 6);
    } else { // hover car
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const tg = ctx.createLinearGradient(0, y + 14, 0, y + 46); tg.addColorStop(0, 'rgba(41,240,255,0.5)'); tg.addColorStop(1, 'rgba(41,240,255,0)');
      ctx.fillStyle = tg; ctx.fillRect(x + 10, y + 14, 18, 32); ctx.fillRect(x + pl.w - 28, y + 14, 18, 32); ctx.restore();
      const g = ctx.createLinearGradient(0, y - 6, 0, y + 16); g.addColorStop(0, '#ff9ad5'); g.addColorStop(1, '#6a2a8e');
      ctx.fillStyle = g; roundRect(ctx, x, y, pl.w, 16, 8); ctx.fill();
      ctx.fillStyle = C.cy; glow(C.cy, 8); ctx.fillRect(x + 6, y, pl.w - 12, 2); noGlow();
      ctx.fillStyle = '#fff6c0'; glow('#fff', 10); ctx.fillRect(x + pl.w - 6, y + 6, 5, 4); noGlow();
      ctx.fillStyle = '#ff4b6e'; ctx.fillRect(x + 1, y + 6, 4, 4);
    }
  }
}
function drawCheckpoints(s){
  for (const c of s.cps){
    const x = c.x + c.w / 2 - CAM.x, y = c.y + c.h - CAM.y;
    if (x < -60 || x > VW + 60) continue;
    const col = c.on ? C.cy : C.mg;
    ctx.fillStyle = '#2a2540'; ctx.fillRect(x - 2, y - 60, 4, 60); roundRect(ctx, x - 10, y - 6, 20, 6, 2); ctx.fill();
    const wv = Math.sin(globalT * 4);
    ctx.fillStyle = hexA(col, c.on ? 0.85 : 0.45); glow(col, c.on ? 16 : 6);
    ctx.beginPath(); ctx.moveTo(x + 2, y - 60); ctx.quadraticCurveTo(x + 14, y - 58 + wv * 3, x + 26, y - 54); ctx.lineTo(x + 26, y - 40); ctx.quadraticCurveTo(x + 14, y - 44 + wv * 3, x + 2, y - 42); ctx.fill(); noGlow();
    ctx.fillStyle = col; glow(col, 10); ctx.beginPath(); ctx.arc(x, y - 62, 4, 0, TAU); ctx.fill(); noGlow();
    if (c.on){ ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = hexA(C.cy, 0.4 - (globalT % 1.5) / 4); ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x, y, 10 + (globalT % 1.5) * 20, 3 + (globalT % 1.5) * 5, 0, 0, TAU); ctx.stroke(); ctx.restore(); }
  }
}
function drawGoal(s){
  const g = s.goal; if (!g) return;
  const x = g.x + g.w / 2 - CAM.x, y = g.y + g.h - CAM.y;
  if (x < -120 || x > VW + 120) return;
  const locked = s.arena && !s.arena.done && s.boss;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let k = 0; k < 5; k++){
    const rr = ((globalT * 0.8 + k / 5) % 1);
    ctx.strokeStyle = locked ? `rgba(255,60,90,${0.5 * (1 - rr)})` : `rgba(${k % 2 ? '255,43,214' : '41,240,255'},${0.8 * (1 - rr)})`; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(x, y - 42, 24 * (1 - rr) + 2, 38 * (1 - rr) + 3, 0, 0, TAU); ctx.stroke();
  }
  const pg = ctx.createRadialGradient(x, y - 42, 2, x, y - 42, 40); pg.addColorStop(0, locked ? 'rgba(255,60,90,0.3)' : 'rgba(200,255,255,0.6)'); pg.addColorStop(1, 'rgba(41,240,255,0)');
  ctx.fillStyle = pg; ctx.fillRect(x - 40, y - 90, 80, 90); ctx.restore();
  ctx.fillStyle = '#1e1a36'; ctx.fillRect(x - 34, y - 86, 8, 86); ctx.fillRect(x + 26, y - 86, 8, 86); roundRect(ctx, x - 38, y - 98, 76, 16, 5); ctx.fill();
  ctx.fillStyle = locked ? C.red : C.grn; ctx.font = 'bold 12px ui-monospace,Menlo,monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; glow(ctx.fillStyle, 10);
  ctx.fillText(locked ? 'LOCKED' : 'EXIT ▶', x, y - 90); noGlow();
  ctx.fillStyle = C.cy; ctx.fillRect(x - 34, y - 86, 2, 86); ctx.fillStyle = C.mg; ctx.fillRect(x + 32, y - 86, 2, 86);
}
function drawSigns(s){
  const defs = Sim.PARSED[s.lv].def.signs || [];
  ctx.font = 'bold 13px ui-monospace,Menlo,monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const sg of s.signs){
    const d = defs[sg.n]; if (!d) continue;
    const txt = isTouch ? d.t : d.k, x = sg.x - CAM.x, y = sg.y - CAM.y - 96 + Math.sin(globalT * 1.5 + sg.n) * 3;
    const w = ctx.measureText(txt).width + 30;
    if (x + w / 2 < -20 || x - w / 2 > VW + 20) continue;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const bg = ctx.createLinearGradient(0, y + 16, 0, sg.y - CAM.y); bg.addColorStop(0, 'rgba(41,240,255,0.18)'); bg.addColorStop(1, 'rgba(41,240,255,0)');
    ctx.fillStyle = bg; ctx.beginPath(); ctx.moveTo(x - 30, y + 16); ctx.lineTo(x + 30, y + 16); ctx.lineTo(x + 6, sg.y - CAM.y); ctx.lineTo(x - 6, sg.y - CAM.y); ctx.fill(); ctx.restore();
    ctx.fillStyle = 'rgba(8,10,34,0.72)'; roundRect(ctx, x - w / 2, y - 16, w, 32, 8); ctx.fill();
    ctx.strokeStyle = C.cy; ctx.lineWidth = 1.5; glow(C.cy, 10); ctx.stroke(); noGlow();
    ctx.fillStyle = 'rgba(41,240,255,0.08)'; for (let yy = y - 14; yy < y + 14; yy += 3) ctx.fillRect(x - w / 2 + 2, yy, w - 4, 1);
    ctx.fillStyle = '#eaffff'; glow(C.cy, 6); ctx.fillText(txt, x, y + 1); noGlow();
    ctx.fillStyle = '#2a2540'; ctx.fillRect(x - 2, sg.y - CAM.y - 8, 4, 8); ctx.fillStyle = C.cy; ctx.fillRect(x - 8, sg.y - CAM.y - 3, 16, 3);
  }
}
