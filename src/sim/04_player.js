// ---------------------------------------------------------------- player
function hurtPlayer(s, dmg, fromX, opt = {}){
  const p = s.p;
  if (p.dead > 0 || s.done) return;
  if (!opt.force && (p.inv > 0)) return;
  if (p.bubble > 0 && !opt.force){ ev(s, 'block', { x: p.x + p.w / 2, y: p.y + p.h / 2 }); return; }
  if (p.suit === 'aegis') dmg = Math.max(1, dmg - 1);
  p.hp -= dmg; p.inv = PH.inv; p.hurtT = 0.35; s.hits++;
  if (!opt.noKb){ const d = fromX !== undefined ? (p.x + p.w / 2 < fromX ? -1 : 1) : -p.face; p.vx = d * 200; p.vy = Math.min(p.vy, -260); p.onGround = false; }
  ev(s, 'hurt', { x: p.x + p.w / 2, y: p.y + p.h / 2, dmg });
  if (p.hp <= 0){ p.hp = 0; p.dead = 1.5; s.deaths++; ev(s, 'die', { x: p.x + p.w / 2, y: p.y + p.h / 2 }); }
}
function respawn(s){
  const p = s.p;
  p.x = p.cp.x; p.y = p.cp.y; p.vx = p.vy = 0; p.hp = PH.maxHp; p.fuel = 1; p.inv = 1.5; p.dead = 0; p.charge = 0; p.chargeLv = 0; p.bubble = 0;
  p.safe = { x: p.x, y: p.y };
  s.shots.length = 0; s.ebul.length = 0;
  if (s.arena && s.arena.on && s.boss && !s.boss.dead){ s.arena.on = false; resetBoss(s.boss); }
  ev(s, 'respawn', { x: p.x + p.w / 2, y: p.y + p.h / 2 });
}
function supportedBy(s, p){
  // standing on a platform or frozen enemy?
  for (const pl of s.plats) if (p.x + p.w > pl.x + 2 && p.x < pl.x + pl.w - 2 && Math.abs(p.y + p.h - pl.y) < 1.5) return pl;
  return null;
}
function platformLand(s, b, prevBottom, drop){
  if (drop) return null;
  const list = s.plats.concat(s.enemies.filter(e => e.frozen > 0 && e.alive));
  for (const pl of list){
    const top = pl.y;
    if (b.x + b.w > pl.x + 2 && b.x < pl.x + pl.w - 2 && prevBottom <= top + 1 + Math.max(0, -(pl.dy || 0)) && b.y + b.h >= top){
      b.y = top - b.h; return pl;
    }
  }
  return null;
}
function stepPlayer(s, inp){
  const p = s.p;
  const jP = inp.j && !p.pj, jR = !inp.j && p.pj, fP = inp.f && !p.pf, fR = !inp.f && p.pf;
  p.pj = inp.j; p.pf = inp.f;
  if (p.dead > 0){ p.dead -= DT; if (p.dead <= 0) respawn(s); return; }
  p.inv = Math.max(0, p.inv - DT); p.hurtT = Math.max(0, p.hurtT - DT); p.aimT += DT; p.shootCd = Math.max(0, p.shootCd - DT);
  p.bubble = Math.max(0, p.bubble - DT); p.swapT = Math.max(0, p.swapT - DT); p.landT = Math.max(0, p.landT - DT);
  // suit swap
  if (inp.sw){
    const have = SUIT_ORDER.filter(k => s.suits.includes(k));
    let ni;
    if (inp.sw >= 10) ni = have.indexOf(SUIT_ORDER[inp.sw - 10]);
    else ni = (have.indexOf(p.suit) + inp.sw + have.length) % have.length;
    if (ni >= 0 && have[ni] !== p.suit){ p.suit = have[ni]; p.swapT = 0.4; p.charge = 0; p.chargeLv = 0; ev(s, 'swap', { suit: p.suit }); }
  }
  // carried by platform
  if (p.onPlat){
    const pl = s.plats.find(q => q.id === p.onPlat) || s.enemies.find(q => q.id === p.onPlat && q.frozen > 0);
    if (pl){ moveBody(s, p, pl.dx || 0, 0); p.y += (pl.dy || 0); }
  }
  // horizontal
  const dir = (inp.r ? 1 : 0) - (inp.l ? 1 : 0);
  if (dir) p.face = dir;
  const hurtLock = p.hurtT > 0.2;
  if (!hurtLock){
    if (dir) p.vx = approach(p.vx, dir * PH.run, (p.onGround ? PH.accG : PH.accA) * DT);
    else p.vx = approach(p.vx, 0, (p.onGround ? PH.dec : PH.accA * 0.8) * DT);
  }
  // jump / flap / hover
  if (jP) p.buf = PH.buffer; else p.buf = Math.max(0, p.buf - DT);
  p.coyote = p.onGround ? PH.coyote : Math.max(0, p.coyote - DT);
  let drop = false;
  if (p.buf > 0 && inp.d && p.onGround){
    // drop through one-way ledge if standing on one
    const r = Math.floor((p.y + p.h + 1) / T), c0 = Math.floor(p.x / T), c1 = Math.floor((p.x + p.w - 0.01) / T);
    let ow = true; for (let c = c0; c <= c1; c++){ const ch = tileAt(s, c, r); if (SOLID[ch]) ow = false; }
    if (ow){ p.dropT = 0.22; p.buf = 0; p.onGround = false; p.coyote = 0; p.onPlat = 0; p.y += 2; }
  }
  p.dropT = Math.max(0, p.dropT - DT); drop = p.dropT > 0;
  const jumpV = PH.jump * (p.suit === 'frost' ? 1.1 : 1);
  if (p.buf > 0 && p.coyote > 0){
    p.vy = -jumpV; p.buf = 0; p.coyote = 0; p.onGround = false; p.onPlat = 0; p.jumping = true; ev(s, 'jump', { x: p.x + p.w / 2, y: p.y + p.h });
  } else if (jP && !p.onGround && p.coyote <= 0){
    if (p.fuel > 0.04){ p.vy = Math.min(p.vy, -PH.flap * (p.suit === 'blaze' ? 1.15 : 1)); p.fuel = Math.max(0, p.fuel - PH.flapCost); p.flapT = 0.25; p.buf = 0; p.jumping = false; ev(s, 'flap', { x: p.x + p.w / 2, y: p.y + p.h }); }
  }
  if (p.jumping && !inp.j && p.vy < -PH.jumpCut){ p.vy = -PH.jumpCut; p.jumping = false; }
  if (p.vy >= 0) p.jumping = false;
  p.flapT = Math.max(0, p.flapT - DT);
  p.hover = false;
  let g = PH.grav;
  if (!p.onGround && inp.j && p.fuel > 0 && p.vy > -60 && !hurtLock){
    p.hover = true;
    const hv = p.suit === 'blaze' ? 12 : PH.hoverVy;
    p.vy = approach(p.vy + g * DT * 0.3, hv, 2600 * DT); g = 0;
    p.fuel = Math.max(0, p.fuel - PH.hoverDrain * DT);
  }
  p.vy = Math.min(PH.maxFall, p.vy + g * DT);
  if (p.onGround) p.fuel = Math.min(1, p.fuel + PH.refill * DT);
  // move + collide
  const wasGround = p.onGround;
  const res = moveBody(s, p, p.vx * DT, p.vy * DT, { drop });
  if (res.hitX) p.vx = 0;
  p.onGround = false; p.onPlat = 0;
  if (res.landed){ p.onGround = true; }
  else if (p.vy >= 0){ const pl = platformLand(s, p, res.prevBottom, drop); if (pl){ p.onGround = true; p.onPlat = pl.id; } }
  if (res.hitY === -1) p.vy = Math.max(0, p.vy);
  if (p.onGround){
    if (!wasGround){ if (p.vy > 300) ev(s, 'land', { x: p.x + p.w / 2, y: p.y + p.h, v: p.vy }); p.landT = 0.12; }
    p.vy = 0; p.airT = 0;
    // electrified floor
    const r = Math.floor((p.y + p.h + 1) / T); let hz = false, safe = !p.onPlat;
    const c0 = Math.floor(p.x / T), c1 = Math.floor((p.x + p.w - 0.01) / T);
    for (let c = c0; c <= c1; c++){ const ch = tileAt(s, c, r); if (ch === 'x') hz = true; if (!(SOLID[ch] || ch === '=')) safe = false; }
    if (hz){ hurtPlayer(s, 2, undefined, { noKb: true }); p.vy = -480; p.onGround = false; p.jumping = false; ev(s, 'zap', { x: p.x + p.w / 2, y: p.y + p.h }); }
    else if (safe) p.safe = { x: p.x, y: p.y };
  } else p.airT += DT;
  // fell into a pit: small penalty, back to last safe ground
  if (p.y > PARSED[s.lv].h * T + 60){
    ev(s, 'fall', {});
    p.x = p.safe.x; p.y = p.safe.y; p.vx = p.vy = 0;
    hurtPlayer(s, 3, undefined, { force: true, noKb: true });
    if (p.dead <= 0) p.inv = 1.3;
  }
  // shooting
  if (fP) fireShot(s, 0);
  if (inp.f){
    p.charge += DT;
    const lv = p.charge >= 1.0 ? 2 : p.charge >= 0.45 ? 1 : 0;
    if (lv > p.chargeLv){ p.chargeLv = lv; ev(s, 'charge', { lv }); }
  }
  if (fR){
    if (p.chargeLv === 2) fireShot(s, 2); else if (p.chargeLv === 1 && p.suit === 'volt') fireShot(s, 1);
    p.charge = 0; p.chargeLv = 0;
  }
  // magnet perk
  if (p.suit === 'spark'){
    const px = p.x + p.w / 2, py = p.y + p.h / 2;
    for (const k of s.picks){ if (k.k === 'capsule') continue; const dx = px - (k.x + k.w / 2), dy = py - (k.y + k.h / 2), d = Math.hypot(dx, dy); if (d < 170 && d > 1){ k.x += dx / d * 260 * DT; k.y += dy / d * 260 * DT; k.fixed = true; k.vy = 0; } }
  }
}
