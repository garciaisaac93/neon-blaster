// Beam-search bot: plays the REAL deterministic simulation with macro inputs (8 frames each) until it
// reaches the goal. Proves every level (including mini-bosses) can be completed; saves the input tape.
const S = require('../build/sim.js');
const fs = require('fs'), path = require('path');
const T = S.T;
const PROG = [['volt'], ['volt', 'blaze'], ['volt', 'blaze', 'frost', 'spark'], ['volt', 'blaze', 'frost', 'spark', 'aegis']];
function bfsFrom(lv, tc, tr){
  const W = lv.w, Hh = lv.h, D = new Float32Array(W * Hh).fill(1e6), q = [];
  const open = (c, r) => c >= 0 && r >= 0 && c < W && r < Hh && !'#x'.includes(lv.grid[r][c]);
  if (!open(tc, tr)) tr--;
  D[tr * W + tc] = 0; q.push([tc, tr]);
  for (let i = 0; i < q.length; i++){
    const [c, r] = q[i], d = D[r * W + c];
    for (const [dc, dr, w] of [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1.2]]){
      const nc = c + dc, nr = r + dr;
      if (!open(nc, nr) && !(lv.grid[nr] && lv.grid[nr][nc] === '?')) continue;
      if (D[nr * W + nc] > d + w){ D[nr * W + nc] = d + w; q.push([nc, nr]); }
    }
  }
  return D;
}
const ACTS = [];
for (const dir of [-1, 0, 1]) for (const jm of [0, 1, 2]) ACTS.push({ dir, jm });
ACTS.push({ dir: 0, jm: 3 });
function inputFor(a, k, chargeMode){
  const j = a.jm === 1 ? 1 : a.jm === 2 ? (k < 2 ? 1 : 0) : a.jm === 3 ? (k < 2 ? 1 : 0) : 0;
  return { l: a.dir < 0 ? 1 : 0, r: a.dir > 0 ? 1 : 0, u: 0, d: a.jm === 3 ? 1 : 0, j, f: chargeMode ? 1 : (k % 8 < 4 ? 1 : 0), sw: 0 };
}
const pack = i => i.l | i.r << 1 | i.d << 2 | i.j << 3 | i.f << 4;
function run(idx, opts = {}){
  const lv = S.parseLevel(idx), W = lv.w;
  const s0 = S.createState(idx, PROG[idx]);
  const goal = s0.goal, dGoal = bfsFrom(lv, Math.floor((goal.x + goal.w / 2) / T), Math.floor((goal.y + goal.h - 1) / T));
  const capMaps = {};
  const cellOf = (x, y) => Math.max(0, Math.min(lv.h - 1, Math.floor(y / T))) * W + Math.max(0, Math.min(W - 1, Math.floor(x / T)));
  function score(s){
    const p = s.p;
    let d;
    const cap = s.picks.find(k => k.k === 'capsule');
    const pc = cellOf(p.x + p.w / 2, p.y + p.h / 2);
    if (cap && cap.fixed){
      const key = cap.id; if (!capMaps[key]) capMaps[key] = bfsFrom(lv, Math.floor((cap.x + 16) / T), Math.floor((cap.y + 30) / T));
      d = capMaps[key][pc] + dGoal[cellOf(cap.x + 16, cap.y + 30)];
    } else if (cap){ d = Math.hypot(cap.x - p.x, cap.y - p.y) / T + dGoal[cellOf(cap.x + 16, cap.y + 20)]; }
    else d = dGoal[pc];
    if (d >= 1e6) d = 5000;
    let sc = d * 10 + (S.PH.maxHp - p.hp) * 4 + s.deaths * 400 - s.suits.length * 3000;
    if (s.boss && !s.boss.dead) sc += 3000 + s.boss.hp * 60;
    if (s.boss && !s.boss.dead && s.boss.type === 'shogun' && s.arena && s.arena.on){ const b = s.boss; sc += Math.abs(p.y + 16 - (b.y + b.h * 0.55)) * 1.5 + Math.max(0, Math.abs(p.x + p.w / 2 - b.x - b.w / 2) - 240) * 0.8; }
    if (s.done) sc -= 1e6;
    return sc;
  }
  let beam = [{ s: s0, node: null, sc: score(s0) }];
  const B = opts.beam || 48, maxIt = opts.maxIt || 2600;
  const seen = new Map();
  let best = Infinity, stale = 0, it = 0;
  for (; it < maxIt; it++){
    const kids = [];
    for (const b of beam){
      const boss = b.s.arena && b.s.arena.on;
      for (let ai = 0; ai < ACTS.length; ai++){
        const a = ACTS[ai];
        const s = S.cloneState(b.s);
        for (let k = 0; k < 8; k++){ S.step(s, inputFor(a, k, false)); if (s.done) break; }
        const sc = score(s);
        const p = s.p;
        const key = Math.round(p.x / 8) + ',' + Math.round(p.y / 8) + ',' + (p.onGround ? 1 : 0) + ',' + Math.round(p.fuel * 4) + ',' + (s.boss ? s.boss.hp : 0) + ',' + s.suits.length + ',' + (boss ? Math.floor(s.time * 2) : 0) + (s.cut ? ',c' + Math.round(s.cut.t * 10) : '') + (p.dead > 0 ? ',d' + Math.round(p.dead * 10) : '') + (s.time < 0.3 ? ',t' + s.time.toFixed(2) : '');
        const prev = seen.get(key);
        if (prev !== undefined && prev <= sc) continue;
        seen.set(key, sc);
        kids.push({ s, node: { parent: b.node, a: ai }, sc });
        if (s.done){ return finish(idx, kids[kids.length - 1], it); }
      }
    }
    if (!kids.length){ console.log('  beam died'); break; }
    kids.sort((x, y) => x.sc - y.sc);
    // keep diversity: best B by score, plus a few random survivors
    beam = kids.slice(0, B);
    for (let r = 0; r < 6 && kids.length > B; r++) beam.push(kids[B + Math.floor(Math.random() * (kids.length - B))]);
    if (beam[0].sc < best - 0.5){ best = beam[0].sc; stale = 0; } else if (++stale > 400){ console.log('  stuck'); break; }
    if (opts.verbose && it % 100 === 0){ const p = beam[0].s.p; console.log(`  it ${it} sc ${beam[0].sc.toFixed(0)} x ${(p.x / T).toFixed(1)} y ${(p.y / T).toFixed(1)} hp ${p.hp} boss ${beam[0].s.boss ? beam[0].s.boss.hp : '-'} suits ${beam[0].s.suits.length}`); }
  }
  const p = beam[0].s.p; console.log(`  FAILED at x ${(p.x / T).toFixed(1)} y ${(p.y / T).toFixed(1)}`);
  return null;
}
function finish(idx, kid, it){
  const acts = []; for (let n = kid.node; n; n = n.parent) acts.push(n.a); acts.reverse();
  const tape = [];
  for (const ai of acts) for (let k = 0; k < 8; k++) tape.push(pack(inputFor(ACTS[ai], k, false)));
  // verify by straight replay from a fresh state
  const s = S.createState(idx, PROG[idx]);
  const stats = { bossDown: 0, suitGet: [], hover: 0, flaps: 0, shots: 0 };
  let f = 0;
  for (; f < tape.length + 600 && !s.done; f++){
    const v = tape[Math.min(f, tape.length - 1)] || 0;
    S.step(s, { l: v & 1, r: v >> 1 & 1, d: v >> 2 & 1, j: v >> 3 & 1, f: v >> 4 & 1, u: 0, sw: 0 });
    if (s.p.hover) stats.hover++;
    for (const e of s.ev){ if (e.type === 'bossDown') stats.bossDown++; if (e.type === 'suitGet') stats.suitGet.push(e.suit); if (e.type === 'flap') stats.flaps++; if (e.type === 'shoot') stats.shots++; }
  }
  const out = { level: idx, name: S.LEVELS[idx].name, frames: f, seconds: +(f / 60).toFixed(1), done: s.done, deaths: s.deaths, hp: s.p.hp, cells: s.cells + '/' + s.cellsTotal, bossDown: stats.bossDown, suitGet: stats.suitGet, hoverFrames: stats.hover, flaps: stats.flaps, shots: stats.shots, searchIters: it };
  fs.writeFileSync(path.join(__dirname, 'tapes', `level${idx + 1}.json`), JSON.stringify({ suits: PROG[idx], tape }));
  return out;
}
if (require.main === module){
  const which = process.argv[2] ? [+process.argv[2] - 1] : [0, 1, 2, 3];
  let ok = true;
  for (const i of which){
    const t0 = Date.now();
    console.log(`Level ${i + 1}: ${S.LEVELS[i].name}`);
    const r = run(i, { verbose: process.argv.includes('-v') });
    if (!r || !r.done){ ok = false; console.log('  NOT COMPLETED'); continue; }
    console.log('  ', JSON.stringify(r), `(${((Date.now() - t0) / 1000).toFixed(1)}s search)`);
  }
  console.log(ok ? 'ALL LEVELS COMPLETED BY BOT' : 'SOME LEVELS FAILED');
  process.exit(ok ? 0 : 1);
}
module.exports = { run, PROG };
