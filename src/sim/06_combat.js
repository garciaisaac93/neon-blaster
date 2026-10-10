// ---------------------------------------------------------------- player shots per suit
function fireShot(s, lvl){
  const p = s.p, suit = p.suit, f = p.face;
  const mx = p.x + p.w / 2 + f * 22, my = p.y + 16;
  const small = s.shots.filter(q => !q.big).length;
  p.aimT = 0;
  const push = o => { o.id = s.nextId++; o.hits = {}; o.suit = suit; s.shots.push(o); return o; };
  if (lvl === 0){
    if (p.shootCd > 0) return;
    if (suit === 'volt'){ if (small >= 3) return; push({ x: mx, y: my, vx: f * 640, vy: 0, r: 5, dmg: 1, life: 1.2 }); }
    else if (suit === 'blaze'){ if (small >= 6) return; for (const a of [-0.24, 0, 0.24]) push({ x: mx, y: my, vx: f * Math.cos(a) * 520, vy: Math.sin(a) * 520, r: 6, dmg: 1, life: 0.42, fire: true }); }
    else if (suit === 'frost'){ if (small >= 3) return; push({ x: mx, y: my, vx: f * 560, vy: 0, r: 6, dmg: 1, life: 1.1, freeze: true }); }
    else if (suit === 'spark'){ if (small >= 4) return; push({ x: mx, y: my, vx: f * 430, vy: -40, r: 5, dmg: 1, life: 1.6, home: true }); }
    else if (suit === 'aegis'){ if (s.shots.some(q => q.disc)) return; push({ x: mx, y: my, vx: f * 560, vy: 0, r: 11, dmg: 2, life: 2.5, disc: true, pierce: true, t: 0 }); }
    p.shootCd = 0.12; ev(s, 'shoot', { suit, x: mx, y: my, f });
    return;
  }
  if (lvl === 1){ push({ x: mx, y: my, vx: f * 600, vy: 0, r: 9, dmg: 2, life: 1.2, mid: true }); ev(s, 'shoot', { suit, x: mx, y: my, f, lvl: 1 }); return; }
  // full charge
  if (suit === 'volt') push({ x: mx, y: my, vx: f * 560, vy: 0, r: 15, dmg: 4, life: 1.4, pierce: true, big: true });
  else if (suit === 'blaze') push({ x: mx, y: my, vx: f * 430, vy: -60, r: 14, dmg: 4, life: 0.9, big: true, boom: true, fire: true });
  else if (suit === 'frost') push({ x: mx, y: my, vx: f * 620, vy: 0, r: 11, dmg: 3, life: 1.2, pierce: true, big: true, freeze: true, lance: true });
  else if (suit === 'spark'){
    const px = p.x + p.w / 2, py = p.y + p.h / 2;
    const tg = targets(s).map(t => ({ t, d: Math.hypot(t.x + t.w / 2 - px, t.y + t.h / 2 - py) })).filter(o => o.d < 480).sort((a, b) => a.d - b.d).slice(0, 4);
    if (tg.length){
      const pts = [[mx, my]];
      for (const o of tg){ pts.push([o.t.x + o.t.w / 2, o.t.y + o.t.h / 2]); if (o.t === s.boss) hitBoss(s, 3); else hitEnemy(s, o.t, 3); }
      ev(s, 'chain', { pts });
    } else push({ x: mx, y: my, vx: f * 500, vy: 0, r: 12, dmg: 3, life: 1.2, pierce: true, big: true, home: true });
  } else if (suit === 'aegis'){ p.bubble = 4; ev(s, 'bubble', {}); }
  ev(s, 'shoot', { suit, x: mx, y: my, f, lvl: 2 });
}
function targets(s){
  const out = s.enemies.filter(e => e.alive && e.frozen <= 0);
  if (s.boss && s.boss.active && !s.boss.dead) out.push(s.boss);
  return out;
}
function explode(s, x, y){
  ev(s, 'boom', { x, y });
  for (const e of s.enemies) if (e.alive && Math.hypot(e.x + e.w / 2 - x, e.y + e.h / 2 - y) < 80) hitEnemy(s, e, 2);
  const b = s.boss; if (b && b.active && !b.dead && Math.hypot(b.x + b.w / 2 - x, b.y + b.h / 2 - y) < 100) hitBoss(s, 2);
}
function stepShots(s){
  const p = s.p, px = p.x + p.w / 2, py = p.y + p.h / 2;
  for (const q of s.shots){
    q.life -= DT;
    if (q.disc){
      q.t += DT;
      if (q.t > 0.36){ const dx = px - q.x, dy = py - q.y, d = Math.hypot(dx, dy) || 1; q.vx = dx / d * 620; q.vy = dy / d * 620; if (d < 18) q.life = 0; }
      else q.vx *= 0.985;
    }
    if (q.home){
      let best = null, bd = 380;
      for (const t of targets(s)){ const d = Math.hypot(t.x + t.w / 2 - q.x, t.y + t.h / 2 - q.y); if (d < bd){ bd = d; best = t; } }
      if (best){
        const want = Math.atan2(best.y + best.h / 2 - q.y, best.x + best.w / 2 - q.x), cur = Math.atan2(q.vy, q.vx);
        let da = want - cur; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
        const na = cur + clampN(da, -7 * DT, 7 * DT), sp = Math.hypot(q.vx, q.vy);
        q.vx = Math.cos(na) * sp; q.vy = Math.sin(na) * sp;
      }
    }
    if (q.boom) q.vy += 300 * DT;
    q.x += q.vx * DT; q.y += q.vy * DT;
    // walls / cracked blocks
    const c = Math.floor(q.x / T), r = Math.floor(q.y / T), ch = tileAt(s, c, r);
    if (SOLID[ch] && !q.disc){
      if (ch === '?'){ s.broken[c + ',' + r] = 1; ev(s, 'break', { x: c * T + T / 2, y: r * T + T / 2 }); }
      if (q.boom) explode(s, q.x, q.y);
      q.life = 0; ev(s, 'spark', { x: q.x, y: q.y, suit: q.suit }); continue;
    } else if (SOLID[ch] && q.disc){
      if (ch === '?'){ s.broken[c + ',' + r] = 1; ev(s, 'break', { x: c * T + T / 2, y: r * T + T / 2 }); }
      q.t = Math.max(q.t, 0.36);
    }
    const box = { x: q.x - q.r, y: q.y - q.r, w: q.r * 2, h: q.r * 2 };
    for (const e of s.enemies){
      if (!e.alive || q.life <= 0) continue;
      if (q.hits[e.id] && (!q.disc || s.time - q.hits[e.id] < 0.25)) continue;
      if (overlap(box, grow(e, 3))){
        q.hits[e.id] = s.time;
        hitEnemy(s, e, q.dmg, q);
        if (q.boom){ explode(s, q.x, q.y); q.life = 0; }
        else if (!q.pierce) q.life = 0;
      }
    }
    const b = s.boss;
    if (b && b.active && !b.dead && q.life > 0 && overlap(box, b) && !(q.hits.boss && (!q.disc || s.time - q.hits.boss < 0.25))){
      q.hits.boss = s.time;
      hitBoss(s, q.dmg, q);
      if (q.boom) explode(s, q.x, q.y);
      if (!q.pierce || q.boom) q.life = 0;
      else if (!q.disc) q.life = Math.min(q.life, 0.05);
    }
    if (q.life > 0) for (const eb of s.ebul) if (eb.k === 'missile' && eb.life > 0 && Math.hypot(eb.x - q.x, eb.y - q.y) < q.r + eb.r + 3){ eb.life = 0; ev(s, 'ebreak', { x: eb.x, y: eb.y, k: 'missile' }); if (!q.pierce) q.life = 0; }
    if (q.disc) for (const eb of s.ebul) if (Math.hypot(eb.x - q.x, eb.y - q.y) < q.r + eb.r){ eb.life = 0; ev(s, 'block', { x: eb.x, y: eb.y }); }
    if (q.life <= 0 && q.boom) explode(s, q.x, q.y);
  }
  s.shots = s.shots.filter(q => q.life > 0);
  // enemy bullets
  for (const b of s.ebul){
    b.life -= DT;
    if (b.k === 'bubble'){ b.vy = Math.sin(s.time * 3 + b.x * 0.05) * 40 - 20; }
    if (b.k === 'arc' || b.k === 'zap') b.vy += 700 * DT;
    if (b.k === 'fire') b.vy += 120 * DT;
    if (b.k === 'missile'){ b.t += DT; if (b.t > 0.35 && b.t < 2.6){ const [tx, ty] = [p.x + p.w / 2 - b.x, p.y + p.h / 2 - b.y], want = Math.atan2(ty, tx), cur = Math.atan2(b.vy, b.vx); let da = want - cur; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI; const na = cur + clampN(da, -2.2 * DT, 2.2 * DT); b.vx = Math.cos(na) * 150; b.vy = Math.sin(na) * 150; } }
    if (b.k === 'debris'){ if (b.wait > 0){ b.wait -= DT; continue; } b.vy = Math.min(700, b.vy + 900 * DT); }
    b.x += b.vx * DT; b.y += b.vy * DT;
    if (b.k !== 'wave' && b.k !== 'bubble' && isSolid(s, Math.floor(b.x / T), Math.floor(b.y / T))){ b.life = 0; if (b.k === 'debris' || b.k === 'missile' || b.k === 'zap') ev(s, 'ebreak', { x: b.x, y: b.y, k: b.k }); continue; }
    if (b.k === 'wave' && isSolid(s, Math.floor((b.x + Math.sign(b.vx) * 10) / T), Math.floor((b.y - 4) / T))) b.life = 0;
    if (b.life > 0 && overlap({ x: b.x - b.r * 0.7, y: b.y - b.r * 0.7, w: b.r * 1.4, h: b.r * 1.4 }, p)){
      if (p.bubble > 0){ b.life = 0; ev(s, 'block', { x: b.x, y: b.y }); } else { hurtPlayer(s, b.dmg || 2, b.x); if (p.inv > 0) b.life = 0; }
    }
  }
  s.ebul = s.ebul.filter(b => b.life > 0);
}
