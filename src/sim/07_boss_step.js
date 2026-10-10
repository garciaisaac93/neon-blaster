// ---------------------------------------------------------------- bosses (samurai-cyberpunk line-up)
// oni: ONI ENFORCER (street) · kite: KITE NINJA DRONE (rooftops) · shogun: SECURITY SHOGUN TURRET (shaft top) · dragon: SHINKANSEN DRAGON (subway, final)
// Every attack has a wind-up phase whose name ends in 'T' (telegraph) so the renderer can show it clearly.
const BDEF = { oni: { w: 76, h: 84, hp: 30 }, kite: { w: 84, h: 56, hp: 28 }, shogun: { w: 150, h: 120, hp: 30 }, dragon: { w: 190, h: 64, hp: 52 } };
function floorBelow(s, cx, y){ const lv = PARSED[s.lv], c = Math.floor(cx / T); for (let r = Math.max(0, Math.floor(y / T)); r < lv.h; r++){ if (SOLID[lv.grid[r][c]]) return r * T; } return lv.h * T; }
function newBoss(type, cx, by, lv, s){
  const d = BDEF[type];
  const b = { type, name: lv.def.bossName, w: d.w, h: d.h, hp: d.hp, max: d.hp, x: cx - d.w / 2, y: by - d.h, sx: cx - d.w / 2, sy: by - d.h, vx: 0, vy: 0, t: 0, ph: 'idle', pt: 1.2, dir: -1, active: false, dead: false, deadT: 0, flash: 0, slow: 0, onGround: false, minions: 0,
    n: 0, angry: false, open: 0, hide: 0, decoys: [], beams: [], form: type === 'dragon' ? 'train' : '', tx: 0, ty: 0, fy: floorBelow(s, cx, by - 4), k: 0 };
  return b;
}
function resetBoss(b){
  b.vx = b.vy = 0; b.ph = 'idle'; b.pt = 1.2; b.active = false; b.t = 0; b.open = 0; b.hide = 0; b.decoys = []; b.beams = []; b.n = 0;
  if (b.type === 'dragon' && b.form === 'dragon'){ b.x = b.sx + b.w / 2 - 55; b.y = b.fy - 230; }
  else { b.x = b.sx; b.y = b.sy; }
}
function hitBoss(s, dmg, shot){
  const b = s.boss;
  if (!b || !b.active || b.dead || s.cut) return;
  if (b.hide > 0 || b.ph === 'morph') return;
  if (b.type === 'shogun' && b.open <= 0){ if (!b.clinkT || s.time - b.clinkT > 0.15){ b.clinkT = s.time; ev(s, 'clink', { x: b.x + b.w / 2, y: b.y + b.h * 0.3 }); } return; }
  if (shot && shot.freeze) b.slow = 1.6;
  b.hp -= dmg; b.flash = 0.1; ev(s, 'bhit', { x: b.x + b.w / 2, y: b.y + b.h / 2 });
  if (b.hp <= 0){
    b.hp = 0; b.dead = true; b.deadT = 0; s.bossesBeaten++; s.ebul.length = 0; b.beams = []; b.decoys = [];
    for (const e of s.enemies) if (e.minion) e.alive = false;
    s.arena.on = false; s.arena.done = true;
    ev(s, 'bossDown', { x: b.x + b.w / 2, y: b.y + b.h / 2, type: b.type });
    const drop = PARSED[s.lv].def.drop, dx = clampN(b.x + b.w / 2, s.arena.x0 + 40, s.arena.x1 - 40), dy = Math.min(b.y + b.h / 2, b.fy - 60);
    if (drop && !s.suits.includes(drop)) s.picks.push({ id: s.nextId++, k: 'capsule', suit: drop, x: dx - 16, y: dy - 20, w: 32, h: 40, vy: -320 });
    else s.picks.push({ id: s.nextId++, k: 'HP', x: dx - 14, y: dy, w: 28, h: 28, vy: -320 });
  }
}
function bossNext(b, order){ const k = order[b.n % order.length]; b.n++; return k; }
function aimAt(s, x, y, spd){ const p = s.p, dx = p.x + p.w / 2 - x, dy = p.y + p.h / 2 - y, d = Math.hypot(dx, dy) || 1; return [dx / d * spd, dy / d * spd]; }
function rayEnd(s, x, y, a, max){   // a: angle from straight down, + = towards +x
  const sx = Math.sin(a), sy = Math.cos(a);
  for (let d = 0; d < max; d += 6){ const px = x + sx * d, py = y + sy * d, ch = tileAt(s, Math.floor(px / T), Math.floor(py / T)); if (d > 40 && (SOLID[ch] || ch === '=')) return [px, py]; }
  return [x + sx * max, y + sy * max];
}
function segHits(x0, y0, x1, y1, box){ const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 6); for (let i = 0; i <= n; i++){ const x = x0 + (x1 - x0) * i / n, y = y0 + (y1 - y0) * i / n; if (x > box.x && x < box.x + box.w && y > box.y && y < box.y + box.h) return true; } return false; }
function stepBoss(s){
  const b = s.boss; if (!b) return;
  if (b.dead){ b.deadT += DT; return; }
  if (!b.active) return;
  const p = s.p, px = p.x + p.w / 2, py = p.y + p.h / 2, bx = b.x + b.w / 2, by = b.y + b.h / 2, A = s.arena, ax0 = A.x0, ax1 = A.x1;
  b.t += DT; b.flash = Math.max(0, b.flash - DT); b.slow = Math.max(0, b.slow - DT);
  const slowK = b.slow > 0 ? 0.6 : 1;
  if (!b.angry && b.hp <= b.max / 2 && b.type !== 'dragon'){ b.angry = true; ev(s, 'enrage', { x: bx, y: b.y, type: b.type }); if (b.type === 'oni' && b.onGround){ b.ph = 'roar'; b.pt = 0.9; b.vx = 0; } }
  const angry = b.angry, spd = slowK * (angry ? 1.2 : 1);
  b.pt -= DT * slowK;
  const go = (ph, t) => { b.ph = ph; b.pt = t; };
  const face = () => { b.dir = Math.sign(px - bx) || b.dir; };
  const ground = () => { b.vy = Math.min(PH.maxFall, b.vy + PH.grav * DT); const r = moveBody(s, b, b.vx * DT, b.vy * DT); if (b.x < ax0){ b.x = ax0; r.hitX = -1; } if (b.x + b.w > ax1){ b.x = ax1 - b.w; r.hitX = 1; } const was = b.onGround; b.onGround = r.landed; if (r.landed) b.vy = 0; r.justLanded = r.landed && !was; return r; };
  let contact = 3;
  if (b.type === 'oni'){
    // ---- ONI ENFORCER: slam shockwaves (jump), shoulder charge (jump / stand on a ledge), electrified club swing (lightning arcs land in a spread)
    if (b.ph === 'idle'){ face(); b.vx = b.dir * 45 * spd; ground(); if (b.pt <= 0){ b.vx = 0; const k = bossNext(b, ['slam', 'charge', 'swing']); go(k + 'T', k === 'slam' ? (angry ? 0.6 : 0.8) : k === 'charge' ? (angry ? 0.55 : 0.75) : (angry ? 0.5 : 0.7)); ev(s, 'tele', { x: bx, y: b.y }); } }
    else if (b.ph === 'slamT'){ b.vx = 0; ground(); if (b.pt <= 0){ go('slam', 0.7); b.k = 0; } }
    else if (b.ph === 'slam'){
      b.vx = 0; ground();
      if (b.k === 0 && b.pt < 0.6){ b.k = 1; ev(s, 'bland', { x: bx + b.dir * 40, y: b.y + b.h, big: true }); for (const d of [-1, 1]) s.ebul.push({ k: 'wave', x: bx + d * 44, y: b.y + b.h - 14, vx: d * 230 * spd, vy: 0, r: 14, life: 3, dmg: 2 }); }
      if (angry && b.k === 1 && b.pt < 0.15){ b.k = 2; ev(s, 'bland', { x: bx, y: b.y + b.h }); for (const d of [-1, 1]) s.ebul.push({ k: 'wave', x: bx + d * 44, y: b.y + b.h - 14, vx: d * 200, vy: 0, r: 14, life: 3, dmg: 2 }); }
      if (b.pt <= 0) go('idle', angry ? 0.7 : 1.1);
    } else if (b.ph === 'chargeT'){ b.vx = 0; ground(); if (b.pt > 0.3) face(); if (b.pt <= 0){ go('charge', 3); ev(s, 'dash', { x: bx, y: b.y + b.h }); } }
    else if (b.ph === 'charge'){ b.vx = b.dir * (angry ? 350 : 300) * slowK; const r = ground(); if (r.hitX || b.pt <= 0){ b.vx = 0; ev(s, 'bump', { x: bx + b.dir * 40, y: b.y + b.h, big: true }); go('dazed', angry ? 0.8 : 1.1); } }
    else if (b.ph === 'dazed'){ b.vx = 0; ground(); if (b.pt <= 0) go('idle', 0.5); }
    else if (b.ph === 'swingT'){ b.vx = 0; ground(); face(); if (b.pt <= 0){ go('swing', 0.55); b.k = 0; ev(s, 'swing', { x: bx + b.dir * 50, y: b.y + 20 }); } }
    else if (b.ph === 'swing'){
      b.vx = 0; ground();
      if (b.pt > 0.35 && overlap({ x: b.dir > 0 ? b.x + b.w - 6 : b.x - 64, y: b.y - 10, w: 70, h: b.h }, p)) hurtPlayer(s, 3, bx);
      if (b.k === 0 && b.pt < 0.42){ b.k = 1;
        const n = angry ? 4 : 3, dx = px - bx;
        for (let i = 0; i < n; i++) s.ebul.push({ k: 'zap', x: bx + b.dir * 56, y: b.y + 6, vx: clampN(dx * 0.7, -250, 250) * (0.45 + i * 0.32) + b.dir * 30, vy: -440 - i * 25, r: 10, life: 3, dmg: 2 });
        ev(s, 'bshoot', {}); }
      if (b.pt <= 0) go('idle', angry ? 0.6 : 1.0);
    } else if (b.ph === 'roar'){ b.vx = 0; ground(); if (b.pt <= 0) go('idle', 0.4); }
  } else if (b.type === 'kite'){
    // ---- KITE NINJA DRONE: glides, throws shuriken spreads, dives at a marked spot, vanishes in smoke leaving decoys
    const cx = (ax0 + ax1) / 2, half = (ax1 - ax0) / 2 - b.w / 2 - 30, gy = b.fy - 175;
    for (const d of b.decoys){ d.t -= DT; if (d.t <= 0 && !d.done){ d.done = true; ev(s, 'smoke', { x: d.x, y: d.y }); const [vx, vy] = aimAt(s, d.x, d.y, 170); s.ebul.push({ k: 'shuriken', x: d.x, y: d.y, vx, vy, r: 8, life: 4, dmg: 2 }); } }
    b.decoys = b.decoys.filter(d => !d.done);
    const glide = () => { b.k += DT * 0.55 * slowK; const tx = cx + Math.sin(b.k) * half - b.w / 2, ty = gy + Math.sin(b.k * 2.3) * 30; b.vx = (tx - b.x) * 2.2; b.vy = (ty - b.y) * 2.2; b.x += b.vx * DT; b.y += b.vy * DT; b.dir = b.vx > 8 ? 1 : b.vx < -8 ? -1 : b.dir; };
    if (b.ph === 'idle'){ glide(); if (b.pt <= 0){ const k = bossNext(b, ['shuriken', 'dive', 'shuriken', 'vanish']); go(k + 'T', k === 'dive' ? 0.75 : k === 'vanish' ? 0.45 : 0.55); if (k === 'dive'){ b.tx = clampN(px, ax0 + 50, ax1 - 50); b.ty = Math.min(py, b.fy - 40); } ev(s, 'tele', { x: bx, y: b.y }); } }
    else if (b.ph === 'shurikenT'){ glide(); face(); if (b.pt <= 0){
        const n = angry ? 5 : 3, base = Math.atan2(py - by, px - bx);
        for (let i = 0; i < n; i++){ const a = base + (i - (n - 1) / 2) * 0.3; s.ebul.push({ k: 'shuriken', x: bx, y: by, vx: Math.cos(a) * 200, vy: Math.sin(a) * 200, r: 8, life: 4, dmg: 2 }); }
        ev(s, 'throw', { x: bx, y: by }); go('idle', angry ? 0.9 : 1.3); } }
    else if (b.ph === 'diveT'){ b.vx *= 0.9; b.vy *= 0.9; b.dir = Math.sign(b.tx - bx) || b.dir; if (b.pt <= 0){ go('dive', 1.1); ev(s, 'dive', { x: bx, y: by }); } }
    else if (b.ph === 'dive'){
      const dx = b.tx - bx, dy = b.ty - by, d = Math.hypot(dx, dy), v = (angry ? 470 : 400) * slowK;
      if (d < 12 || b.pt <= 0){ go('rise', 1.1); } else { b.vx = dx / d * v; b.vy = dy / d * v; b.x += b.vx * DT; b.y = Math.min(b.y + b.vy * DT, b.fy - b.h); }
    } else if (b.ph === 'rise'){ b.vx *= 0.94; b.vy = approach(b.vy, -170, 900 * DT); b.x += b.vx * DT; b.y += b.vy * DT; if (b.y < gy || b.pt <= 0) go('idle', angry ? 0.6 : 0.9); }
    else if (b.ph === 'vanishT'){ b.vx *= 0.9; b.vy *= 0.9; b.x += b.vx * DT; b.y += b.vy * DT; if (b.pt <= 0){
        ev(s, 'smoke', { x: bx, y: by, big: true });
        const mirror = cx * 2 - bx;
        b.decoys.push({ x: bx, y: by, t: 1.0 }); b.decoys.push({ x: clampN(mirror, ax0 + 60, ax1 - 60), y: gy + 30, t: 1.25 });
        if (angry) b.decoys.push({ x: cx, y: gy - 10, t: 1.5 });
        b.hide = 0.8; go('hidden', 0.8); } }
    else if (b.ph === 'hidden'){ b.hide = b.pt; if (b.pt <= 0){ b.hide = 0; b.k += Math.PI * 0.8; b.x = cx + Math.sin(b.k) * half - b.w / 2; b.y = gy; b.vx = b.vy = 0; ev(s, 'smoke', { x: b.x + b.w / 2, y: b.y + b.h / 2, big: true }); go('idle', 0.7); } }
    b.x = clampN(b.x, ax0, ax1 - b.w);
    if (b.hide > 0) contact = 0;
  } else if (b.type === 'shogun'){
    // ---- SECURITY SHOGUN TURRET: wall-mounted kabuto head. Lasers sweep the middle of the floor, missiles (shootable), drone spawns.
    // Only takes damage while its forehead weak point is exposed (after each attack).
    const e0 = [bx - 30, b.y + 66], e1 = [bx + 30, b.y + 66];
    b.open = Math.max(0, b.open - DT);
    b.beams = [];
    b.y = approach(b.y, b.sy + (b.open > 0.35 ? 96 : 0), (b.open > 0.35 ? 260 : 200) * DT);   // hydraulic arm lowers the head while the weak point is exposed
    if (b.ph === 'idle'){ if (b.pt <= 0){ const k = bossNext(b, angry ? ['laser', 'missile', 'drones', 'laser', 'missile'] : ['laser', 'missile', 'laser', 'drones']); go(k + 'T', k === 'laser' ? 1.0 : 0.6); b.k = (b.n % 2) ? 1 : -1; ev(s, k === 'laser' ? 'laserT' : 'tele', { x: bx, y: b.y }); } }
    else if (b.ph === 'laserT' || b.ph === 'laser'){
      const tele = b.ph === 'laserT', dur = angry ? 1.7 : 2.0, f = tele ? 0 : clampN(1 - b.pt / dur, 0, 1), sw = b.k;   // sweep outer->inner or inner->outer
      const lerpA = (a0, a1) => a0 + (a1 - a0) * (sw > 0 ? f : 1 - f);
      const angs = [lerpA(-0.62, 0.12), lerpA(0.62, -0.12)];
      [e0, e1].forEach((e, i) => { const [x1, y1] = rayEnd(s, e[0], e[1], angs[i], 900); b.beams.push({ x0: e[0], y0: e[1], x1, y1, live: !tele }); });
      if (!tele){ for (const bm of b.beams) if (segHits(bm.x0, bm.y0, bm.x1, bm.y1, grow(p, 2))) hurtPlayer(s, 2, bm.x1); }
      if (b.pt <= 0){ if (tele){ go('laser', dur); ev(s, 'laser', { x: bx, y: b.y }); } else { go('open', angry ? 2.4 : 2.8); b.open = b.pt; ev(s, 'expose', { x: bx, y: b.y + 30 }); } }
    } else if (b.ph === 'missileT'){ if (b.pt <= 0){
        const n = angry ? 3 : 2;
        for (let i = 0; i < n; i++){ const sd = i % 2 ? 1 : -1; s.ebul.push({ k: 'missile', x: bx + sd * 80, y: b.y + 50 + (i >> 1) * 14, vx: sd * 130, vy: -40, r: 9, life: 5, dmg: 2, hp: 1, t: 0 }); }
        ev(s, 'missile', { x: bx, y: b.y + 50 }); go('open', angry ? 2.4 : 2.8); b.open = b.pt; ev(s, 'expose', { x: bx, y: b.y + 30 }); } }
    else if (b.ph === 'dronesT'){ if (b.pt <= 0){
        for (const sd of [-1, 1]) if (s.enemies.filter(e => e.minion && e.alive).length < 2){ const e = newEnemy('d', bx + sd * 110, b.y + b.h, b.y + b.h + T, s.nextId++, s); e.minion = true; e.hx = bx + sd * 150; s.enemies.push(e); ev(s, 'spawn', { x: bx + sd * 110, y: b.y + b.h }); }
        s.ebul.push({ k: 'missile', x: bx, y: b.y + b.h, vx: 0, vy: 90, r: 9, life: 5, dmg: 2, hp: 1, t: 0 });
        go('open', 2.8); b.open = b.pt; ev(s, 'expose', { x: bx, y: b.y + 30 }); } }
    else if (b.ph === 'open'){ if (b.pt <= 0){ b.open = 0; go('idle', 0.35); } }
    contact = 3;
  } else if (b.type === 'dragon'){
    // ---- SHINKANSEN DRAGON: phase 1 bullet train charges along the track; at half health it transforms and flies (fire sweeps, falling debris, low swoops)
    if (b.form === 'train'){
      if (b.hp <= 26 && b.ph !== 'morph'){ go('morph', 2.2); b.vx = 0; s.ebul.length = 0; ev(s, 'transform', { x: bx, y: by }); }
      if (b.ph === 'idle'){ b.vx = 0; ground(); face(); if (b.pt <= 0){ go('hornT', 0.9); ev(s, 'horn', { x: bx, y: by }); } }
      else if (b.ph === 'hornT'){ b.vx = 0; ground(); if (b.pt > 0.4) face(); if (b.pt <= 0) go('rush', 4); }
      else if (b.ph === 'rush'){ b.vx = b.dir * 400 * slowK; const r = ground(); if (r.hitX || b.pt <= 0){ b.vx = 0; ev(s, 'bump', { x: bx + b.dir * 90, y: b.y + b.h, big: true }); go('sparks', 0.9); b.k = 0; } }
      else if (b.ph === 'sparks'){ b.vx = 0; ground(); face(); if (b.k === 0 && b.pt < 0.6){ b.k = 1; const dx = px - bx; for (let i = 0; i < 3; i++) s.ebul.push({ k: 'zap', x: bx, y: b.y - 6, vx: clampN(dx * 0.7, -240, 240) * (0.5 + i * 0.3), vy: -460 - i * 30, r: 10, life: 3, dmg: 2 }); ev(s, 'bshoot', {}); } if (b.pt <= 0) go('idle', 1.0); }
      else if (b.ph === 'morph'){
        b.vx = 0;
        if (b.pt <= 0){ b.form = 'dragon'; const cx = b.x + b.w / 2; b.w = 110; b.h = 70; b.x = cx - 55; b.y = b.fy - 230; b.k = 0; b.n = 0; go('idle', 1.0); ev(s, 'roar', { x: cx, y: b.y }); }
        else if (b.pt < 1.2){ b.y = approach(b.y, b.fy - 230, 160 * DT); }
      }
      contact = b.ph === 'morph' ? 0 : 4;
    } else {
      const cx = (ax0 + ax1) / 2, half = (ax1 - ax0) / 2 - 90, gy = b.fy - 230;
      const fly = (amp = 1) => { b.k += DT * 0.5 * slowK; const tx = cx + Math.sin(b.k) * half - b.w / 2, ty = gy + Math.sin(b.k * 2.1) * 36 * amp; b.vx = (tx - b.x) * 2; b.vy = (ty - b.y) * 2; b.x += b.vx * DT; b.y += b.vy * DT; if (Math.abs(b.vx) > 10) b.dir = Math.sign(b.vx); };
      if (b.ph === 'idle'){ fly(); if (b.pt <= 0){ const k = bossNext(b, ['fire', 'debris', 'fire', 'swoop']); go(k + 'T', k === 'fire' ? 0.85 : k === 'swoop' ? 0.8 : 0.6); if (k === 'swoop'){ b.dir = px > cx ? -1 : 1; } ev(s, k === 'fire' ? 'fireT' : 'tele', { x: bx, y: b.y }); } }
      else if (b.ph === 'fireT'){ b.vx *= 0.9; b.vy *= 0.9; b.x += b.vx * DT; b.y += b.vy * DT; face(); if (b.pt <= 0){ go('fire', 1.5); b.k2 = 0; } }
      else if (b.ph === 'fire'){
        b.vx *= 0.9; b.vy *= 0.9; b.x += b.vx * DT; b.y += b.vy * DT;
        b.k2 = (b.k2 || 0) - DT;
        if (b.k2 <= 0){ b.k2 = 0.11; const f = 1 - b.pt / 1.5, a = b.dir * (0.15 + f * 1.15), mx = bx + b.dir * 50, my = b.y + 46; s.ebul.push({ k: 'fire', x: mx, y: my, vx: Math.sin(a) * 270, vy: Math.cos(a) * 270, r: 10, life: 2.2, dmg: 2 }); }
        if (b.pt <= 0) go('idle', 1.1);
      } else if (b.ph === 'debrisT'){ fly(0.5); if (b.pt <= 0){
          const n = 5, w = (ax1 - ax0) / n;
          for (let i = 0; i < n; i++){ const x = ax0 + w * (i + 0.5) + (rnd(s) - 0.5) * w * 0.4; s.ebul.push({ k: 'debris', x, y: b.fy - 300, vx: 0, vy: 0, r: 12, life: 4, dmg: 2, wait: 0.75 + i * 0.12, gy: b.fy }); }
          ev(s, 'roar', { x: bx, y: b.y }); go('idle', 1.6); } }
      else if (b.ph === 'swoopT'){ const tx = b.dir > 0 ? ax0 + 10 : ax1 - b.w - 10; b.x += (tx - b.x) * 4 * DT; b.y += (b.fy - 140 - b.y) * 4 * DT; if (b.pt <= 0){ go('swoop', 3); ev(s, 'dash', { x: bx, y: by }); } }
      else if (b.ph === 'swoop'){ b.vx = b.dir * 330 * slowK; b.x += b.vx * DT; b.y = b.fy - 126 + Math.sin(b.t * 6) * 4; if ((b.dir > 0 && b.x + b.w >= ax1 - 6) || (b.dir < 0 && b.x <= ax0 + 6) || b.pt <= 0) go('rise', 0.9); }
      else if (b.ph === 'rise'){ b.vx *= 0.95; b.x += b.vx * DT; b.y += (gy - b.y) * 3 * DT; if (b.pt <= 0) go('idle', 0.6); }
      b.x = clampN(b.x, ax0, ax1 - b.w);
      contact = 3;
    }
  }
  if (contact && overlap(shrink(b, 8), p)) hurtPlayer(s, contact, bx);
}
// ---------------------------------------------------------------- pickups, checkpoints, platforms, step
function stepPicks(s){
  const p = s.p;
  for (const k of s.picks){
    if (!k.fixed){
      k.vy = Math.min(500, (k.vy || 0) + PH.grav * 0.7 * DT);
      const r = moveBody(s, k, 0, k.vy * DT); if (r.landed) k.vy = 0;
      if (k.y > PARSED[s.lv].h * T){ if (k.k === 'capsule'){ k.y = s.p.safe.y; k.x = s.p.safe.x; k.vy = 0; } else k.gone = true; }
    }
    if (k.life !== undefined){ k.life -= DT; if (k.life <= 0) k.gone = true; }
    if (!k.gone && p.dead <= 0 && overlap(grow(k, 4), p)){
      k.gone = true;
      const at = { x: k.x + k.w / 2, y: k.y + k.h / 2 };
      if (k.k === 'cell'){ s.cells++; ev(s, 'cell', at); }
      else if (k.k === 'big'){ s.cells += 5; at.big = true; ev(s, 'cell', at); }
      else if (k.k === 'hp' || k.k === 'HP'){ p.hp = Math.min(PH.maxHp, p.hp + (k.k === 'hp' ? 4 : 12)); ev(s, 'heal', at); }
      else if (k.k === 'capsule'){ if (!s.suits.includes(k.suit)) s.suits.push(k.suit); p.suit = k.suit; s.cut = { k: 'suit', suit: k.suit, t: 3.0 }; ev(s, 'suitGet', { suit: k.suit, x: at.x, y: at.y }); }
    }
  }
  s.picks = s.picks.filter(k => !k.gone);
  for (const c of s.cps) if (!c.on && overlap(c, p) && p.dead <= 0){
    c.on = true; p.cp = { x: c.x + c.w / 2 - p.w / 2, y: c.y + c.h - p.h }; p.hp = Math.min(PH.maxHp, p.hp + 6);
    ev(s, 'checkpoint', { x: c.x + c.w / 2, y: c.y });
  }
  if (s.goal && !s.done && p.dead <= 0 && overlap(s.goal, p) && (!s.arena || s.arena.done || !s.boss)){ s.done = true; s.cut = { k: 'goal', t: 999 }; ev(s, 'goal', {}); }
}
function stepPlats(s){
  for (const pl of s.plats){
    const ph = 2 * Math.PI * s.time / pl.per;
    const nx = pl.bx + pl.ax * Math.sin(ph), ny = pl.by - pl.ay * (0.5 - 0.5 * Math.cos(ph));
    pl.dx = nx - pl.x; pl.dy = ny - pl.y; pl.x = nx; pl.y = ny;
  }
}
const NOIN = { l: 0, r: 0, u: 0, d: 0, j: 0, f: 0, sw: 0 };
function step(s, inp){
  inp = inp || NOIN;
  s.ev.length = 0;
  if (s.cut){
    s.cut.t -= DT; s.p.pj = !!inp.j; s.p.pf = !!inp.f; s.p.charge = 0; s.p.chargeLv = 0;
    if (s.cut.t <= 0) s.cut = null;
    if (s.boss && s.boss.dead) s.boss.deadT += DT;
    return s;
  }
  if (s.done) return s;
  s.time += DT;
  stepPlats(s);
  stepPlayer(s, inp);
  const A = s.arena, p = s.p;
  const inA = A && (A.v ? (p.onGround && p.y + p.h <= A.r * T + 1) : (p.x > (A.c0 + 1.6) * T && p.x < A.c1 * T));
  if (A && !A.on && !A.done && s.boss && !s.boss.dead && p.dead <= 0 && inA){
    A.on = true; s.boss.active = true; s.boss.t = 0; s.boss.pt = 1.2;
    s.cut = { k: 'boss', t: s.bossSeen ? 0.6 : 2.6 }; s.bossSeen = true; ev(s, 'bossIntro', { name: s.boss.name, type: s.boss.type });
  }
  stepEnemies(s);
  stepBoss(s);
  stepShots(s);
  stepPicks(s);
  return s;
}
function cloneState(s){ return structuredClone(s); }
