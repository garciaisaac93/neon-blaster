// ---------------------------------------------------------------- enemies
const EDEF = { d: { type: 'drone', w: 28, h: 24, hp: 2 }, h: { type: 'hopper', w: 30, h: 34, hp: 3 }, t: { type: 'turret', w: 30, h: 30, hp: 3 }, j: { type: 'jelly', w: 30, h: 34, hp: 2 } };
function newEnemy(ch, cx, y, by, id, s){
  const d = EDEF[ch];
  const e = { id, type: d.type, w: d.w, h: d.h, hp: d.hp, maxHp: d.hp, x: cx - d.w / 2, y: 0, vx: 0, vy: 0, t: 0, dir: -1, frozen: 0, flash: 0, alive: true, cd: 1 + (id % 5) * 0.3, mount: 0, hx: cx, hy: 0, onGround: false };
  if (e.type === 'hopper') e.y = by - e.h;
  else if (e.type === 'turret'){
    const lv = PARSED[s.lv], c = Math.floor(cx / T), r = Math.floor(y / T);
    if (r > 0 && SOLID[lv.grid[r - 1][c]]){ e.mount = -1; e.y = y; } else { e.mount = 1; e.y = by - e.h; }
  } else e.y = y + T / 2 - e.h / 2;
  e.hy = e.y;
  return e;
}
function killEnemy(s, e, how){
  e.alive = false; e.frozen = 0;
  ev(s, 'pop', { x: e.x + e.w / 2, y: e.y + e.h / 2, kind: e.type, how: how || '' });
  const r = rnd(s);
  if (r < 0.3) s.picks.push({ id: s.nextId++, k: 'hp', x: e.x + e.w / 2 - 10, y: e.y, w: 20, h: 20, vy: -200, life: 8 });
  else if (r < 0.65) s.picks.push({ id: s.nextId++, k: 'cell', x: e.x + e.w / 2 - 9, y: e.y, w: 18, h: 18, vy: -220, life: 8 });
}
function hitEnemy(s, e, dmg, shot){
  if (!e.alive) return;
  if (shot && shot.freeze){
    if (e.frozen > 0){ killEnemy(s, e, 'shatter'); return; }
    e.frozen = 5; e.vx = 0; e.vy = 0; e.flash = 0.1; ev(s, 'freeze', { x: e.x + e.w / 2, y: e.y + e.h / 2 }); return;
  }
  if (e.frozen > 0){ killEnemy(s, e, 'shatter'); return; }
  e.hp -= dmg; e.flash = 0.12;
  ev(s, 'ehit', { x: e.x + e.w / 2, y: e.y + e.h / 2 });
  if (e.hp <= 0) killEnemy(s, e);
}
function stepEnemies(s){
  const p = s.p, px = p.x + p.w / 2, py = p.y + p.h / 2;
  for (const e of s.enemies){
    if (!e.alive) continue;
    e.flash = Math.max(0, e.flash - DT);
    const ex = e.x + e.w / 2, ey = e.y + e.h / 2;
    if (Math.abs(ex - px) > 760 || Math.abs(ey - py) > 520) continue;   // dormant off-screen
    if (e.frozen > 0){ e.frozen -= DT; if (e.frozen <= 0) ev(s, 'thaw', { x: ex, y: ey }); continue; }
    e.t += DT;
    if (e.type === 'drone'){
      e.vx = (e.dir) * 55;
      e.x += e.vx * DT;
      if (Math.abs(e.x + e.w / 2 - e.hx) > 90 || isSolid(s, Math.floor((e.dir > 0 ? e.x + e.w : e.x) / T), Math.floor(ey / T))) e.dir *= -1;
      e.y = e.hy + Math.sin(e.t * 2.4 + e.id) * 14;
    } else if (e.type === 'jelly'){
      e.y = e.hy + Math.sin(e.t * 1.6 + e.id) * 22;
      if (Math.abs(px - ex) < 320 && Math.abs(py - ey) < 260) e.x += Math.sign(px - ex) * 32 * DT;
      if (Math.abs(e.x + e.w / 2 - e.hx) > 160) e.x = e.hx - e.w / 2 + Math.sign(e.x + e.w / 2 - e.hx) * 160;
    } else if (e.type === 'hopper'){
      e.vy = Math.min(PH.maxFall, e.vy + PH.grav * DT);
      const res = moveBody(s, e, e.vx * DT, e.vy * DT);
      if (res.hitX) e.vx = -e.vx * 0.5;
      if (res.landed){ if (!e.onGround) ev(s, 'hop', { x: ex, y: e.y + e.h, small: true }); e.onGround = true; e.vy = 0; e.vx = 0; }
      else e.onGround = false;
      if (e.y > PARSED[s.lv].h * T + 40){ e.alive = false; continue; }
      if (e.onGround){ e.cd -= DT; if (e.cd <= 0 && Math.abs(px - ex) < 420){ e.cd = 1.3; e.dir = Math.sign(px - ex) || 1; e.vx = e.dir * 105; e.vy = -430; e.onGround = false; } }
    } else if (e.type === 'turret'){
      e.cd -= DT;
      const dx = px - ex, dy = py - ey, d = Math.hypot(dx, dy);
      e.aim = Math.atan2(dy, dx);
      if (e.cd <= 0 && d < 400){
        e.cd = 2.0;
        s.ebul.push({ x: ex + Math.cos(e.aim) * 16, y: ey + Math.sin(e.aim) * 16, vx: dx / d * 175, vy: dy / d * 175, r: 7, life: 3, k: 'orb', dmg: 2 });
        ev(s, 'eshoot', { x: ex, y: ey });
      }
    }
    // contact damage
    if (e.alive && e.frozen <= 0 && overlap(shrink(e, 4), p)) hurtPlayer(s, 2, ex);
    if (e.alive && p.bubble > 0 && overlap(e, grow(p, 14))){ e.bt = (e.bt || 0) - DT; if (e.bt <= 0){ e.bt = 0.3; hitEnemy(s, e, 2); } }
  }
  s.enemies = s.enemies.filter(e => e.alive || false);
}
const shrink = (b, k) => ({ x: b.x + k, y: b.y + k, w: b.w - 2 * k, h: b.h - 2 * k });
const grow = (b, k) => ({ x: b.x - k, y: b.y - k, w: b.w + 2 * k, h: b.h + 2 * k });
