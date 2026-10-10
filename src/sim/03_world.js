// ---------------------------------------------------------------- parsing, collision, state creation
const PARSED = [];
const SOLID = { '#': 1, 'x': 1, '?': 1 };
function parseLevel(idx){
  if (PARSED[idx]) return PARSED[idx];
  const def = LEVELS[idx], rows = def.map, h = rows.length, w = rows[0].length;
  const grid = rows.map(r => r.split(''));
  const spawns = [], gates = [];
  for (let r = 0; r < h; r++) for (let c = 0; c < w; c++){
    const ch = grid[r][c];
    if (SOLID[ch] || ch === '=' || ch === '.') continue;
    if (ch === '|') gates.push({ c, r });
    else spawns.push({ ch, c, r });
    grid[r][c] = '.';
  }
  const lv = { idx, def, w, h, grid: grid.map(r => r.join('')), spawns, gates };
  // distance-to-goal map over open cells (used by the test bot heuristic and by nothing in gameplay)
  PARSED[idx] = lv; return lv;
}
function tileAt(s, c, r){
  const lv = PARSED[s.lv];
  if (c < 0 || c >= lv.w) return '#';
  if (r < 0) return lv.def.theme === 'tower' ? '#' : '.';
  if (r >= lv.h) return '.';
  if (s.arena && s.arena.on){ if (s.arena.v){ if (r === s.arena.r && lv.grid[r][c] === '=') return '#'; } else if ((c === s.arena.c0 || c === s.arena.c1) && r <= s.arena.r) return '#'; }
  const ch = lv.grid[r][c];
  if (ch === '?' && s.broken[c + ',' + r]) return '.';
  return ch;
}
const isSolid = (s, c, r) => SOLID[tileAt(s, c, r)] === 1;
function createState(idx, suits, opts = {}){
  const lv = parseLevel(idx);
  const s = {
    lv: idx, time: 0, seed: 12345 + idx * 777, nextId: 1,
    p: null, enemies: [], shots: [], ebul: [], picks: [], plats: [], cps: [], signs: [], goal: null, boss: null, arena: null,
    broken: {}, ev: [], suits: (suits || ['volt']).slice(), cells: 0, cellsTotal: 0, cut: null, done: false, deaths: 0, hits: 0, bossesBeaten: 0
  };
  for (const sp of lv.spawns){
    const x = sp.c * T, y = sp.r * T, cx = x + T / 2, by = y + T;
    const id = s.nextId++;
    switch (sp.ch){
      case 'P': s.p = newPlayer(cx, by, s); break;
      case 'C': s.cps.push({ id, x: cx - 10, y: by - 64, w: 20, h: 64, on: false }); break;
      case 'G': s.goal = { x: cx - 24, y: by - 80, w: 48, h: 80 }; break;
      case 'o': s.picks.push({ id, k: 'cell', x: cx - 9, y: y + 7, w: 18, h: 18, fixed: true }); s.cellsTotal++; break;
      case 'O': s.picks.push({ id, k: 'big', x: cx - 14, y: y + 2, w: 28, h: 28, fixed: true }); s.cellsTotal += 5; break;
      case '+': s.picks.push({ id, k: 'hp', x: cx - 10, y: y + 6, w: 20, h: 20, fixed: true }); break;
      case 'H': s.picks.push({ id, k: 'HP', x: cx - 14, y: y + 2, w: 28, h: 28, fixed: true }); break;
      case 'S': s.picks.push({ id, k: 'capsule', suit: lv.def.capsule, x: cx - 16, y: by - 40, w: 32, h: 40, fixed: true }); break;
      case 'M': s.plats.push({ id, x: cx - 48, y: y + 4, w: 96, h: 14, bx: cx - 48, by: y + 4, ax: 3 * T, ay: 0, per: 4.2, dx: 0, dy: 0 }); break;
      case 'W': s.plats.push({ id, x: cx - 48, y: y + 4, w: 96, h: 14, bx: cx - 48, by: y + 4, ax: 0, ay: 5 * T, per: 4.6 + (sp.c % 2) * 0.9, dx: 0, dy: 0 }); break;
      case 'V': s.plats.push({ id, x: cx - 48, y: y + 4, w: 96, h: 14, bx: cx - 48, by: y + 4, ax: 0, ay: (lv.def.vAmp || 4) * T, per: 5.5, dx: 0, dy: 0 }); break;
      case 'B': s.boss = newBoss(lv.def.boss, cx, by, lv, s); break;
      case 'd': case 'h': case 't': case 'j': s.enemies.push(newEnemy(sp.ch, cx, y, by, id, s)); break;
      default:
        if (sp.ch >= '1' && sp.ch <= '9') s.signs.push({ x: cx, y: by, n: +sp.ch - 1 });
    }
  }
  if (lv.gates.length >= 2){
    const g = lv.gates.slice().sort((a, b) => a.c - b.c);
    s.arena = { on: false, c0: g[0].c, c1: g[g.length - 1].c, r: g[0].r, done: false, x0: (g[0].c + 1) * T, x1: g[g.length - 1].c * T };
  }
  if (lv.def.vArena !== undefined) s.arena = { on: false, v: true, r: lv.def.vArena, c0: 1, c1: lv.w - 2, done: false, x0: 2 * T, x1: (lv.w - 2) * T };
  if (s.arena) s.arena.top = lv.def.arenaTop !== undefined ? lv.def.arenaTop * T : undefined;
  if (opts.suit && s.suits.includes(opts.suit)) s.p.suit = opts.suit;
  return s;
}
function newPlayer(cx, by, s){
  return { x: cx - PH.pw / 2, y: by - PH.ph, w: PH.pw, h: PH.ph, vx: 0, vy: 0, face: 1, onGround: true, onPlat: 0, coyote: 0, buf: 0,
    fuel: 1, hover: false, flapT: 0, jumping: false, hp: PH.maxHp, inv: 0, dead: 0, suit: (s && s.suits[0]) || 'volt', charge: 0, chargeLv: 0,
    shootCd: 0, aimT: 9, pj: false, pf: false, pd: false, bubble: 0, safe: { x: cx - PH.pw / 2, y: by - PH.ph }, cp: { x: cx - PH.pw / 2, y: by - PH.ph }, hurtT: 0, landT: 0, airT: 0, swapT: 0, dropT: 0 };
}
function ev(s, type, o){ const e = o || {}; e.type = type; s.ev.push(e); }
// axis-separated tile collision for an AABB. Returns flags.
function moveBody(s, b, dx, dy, opt = {}){
  let hitX = 0, hitY = 0, landed = false, landTile = null;
  // X
  b.x += dx;
  if (dx !== 0){
    const r0 = Math.floor(b.y / T), r1 = Math.floor((b.y + b.h - 0.01) / T);
    const c = dx > 0 ? Math.floor((b.x + b.w - 0.01) / T) : Math.floor(b.x / T);
    for (let r = r0; r <= r1; r++) if (isSolid(s, c, r)){ b.x = dx > 0 ? c * T - b.w : (c + 1) * T; hitX = dx > 0 ? 1 : -1; break; }
  }
  // Y
  const prevBottom = b.y + b.h;
  b.y += dy;
  const c0 = Math.floor(b.x / T), c1 = Math.floor((b.x + b.w - 0.01) / T);
  if (dy > 0){
    const r = Math.floor((b.y + b.h - 0.01) / T);
    for (let c = c0; c <= c1; c++){
      const ch = tileAt(s, c, r);
      if (SOLID[ch] || (ch === '=' && !opt.drop && prevBottom <= r * T + 0.5)){ b.y = r * T - b.h; hitY = 1; landed = true; landTile = ch; break; }
    }
  } else if (dy < 0){
    const r = Math.floor(b.y / T);
    for (let c = c0; c <= c1; c++) if (isSolid(s, c, r)){ b.y = (r + 1) * T; hitY = -1; break; }
  }
  return { hitX, hitY, landed, landTile, prevBottom };
}
