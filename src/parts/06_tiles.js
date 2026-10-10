// ---------------------------------------------------------------- tile sprites (pre-rendered per theme) + map drawing
const TPAL = {
  street: { top: '#2a2740', topHi: '#57537a', inner: '#100e1e', inner2: '#131124', line: C.cy, trim: 'rgba(255,43,214,0.55)', win: ['rgba(255,190,120,0.35)', 'rgba(120,230,255,0.3)'] },
  roof:   { top: '#3a3550', topHi: '#77709a', inner: '#13102a', inner2: '#171332', line: C.mg, trim: 'rgba(41,240,255,0.5)', win: ['rgba(120,230,255,0.45)', 'rgba(255,150,230,0.4)', 'rgba(255,214,150,0.4)'] },
  tower:  { top: '#2f3250', topHi: '#5a5f88', inner: '#171a30', inner2: '#1d2140', line: C.yel, trim: 'rgba(41,240,255,0.45)', win: [] },
  subway: { top: '#3a3d5c', topHi: '#6b6f98', inner: '#191b2e', inner2: '#1e2138', line: C.yel, trim: 'rgba(41,240,255,0.4)', win: [] }
};
let TS = null;  // sprite set
function mkSprite(draw){
  const R = RS, c = document.createElement('canvas'); c.width = c.height = Math.ceil(T * R);
  const g = c.getContext('2d'); g.scale(R, R); draw(g); return c;
}
function buildTiles(){
  const P = TPAL[THEME], rr = mulberry32(99);
  const inner = (g, k) => {
    g.fillStyle = P.inner; g.fillRect(0, 0, T, T); if (k === 2){ g.fillStyle = P.inner2; g.fillRect(0, 0, T, T); }
    if (THEME === 'roof'){   // building face: windows, pipes, the odd AC unit
      if (k === 3){ g.fillStyle = 'rgba(40,30,80,0.45)'; g.fillRect(4, 4, 9, 8); acUnit(g, 4, 12, 0.92); }
      else for (let y = 4; y < T - 4; y += 14) for (let x = 4; x < T - 4; x += 14){ g.fillStyle = rr() < 0.13 ? pick(P.win) : 'rgba(40,30,80,0.45)'; g.fillRect(x, y, 9, 8); }
      if (k === 1){ g.fillStyle = '#0b0918'; g.fillRect(T - 7, 0, 3, T); g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(T - 7, 0, 1, T); }
    } else if (THEME === 'street'){   // dark asphalt with soft neon reflections
      for (let i = 0; i < 26; i++){ g.fillStyle = rr() < 0.5 ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.25)'; g.fillRect(rr() * T, rr() * T, 1.5, 1.5); }
      const rc = ['255,43,214', '41,240,255', '255,90,80', '255,215,106'][k];
      const rg = g.createLinearGradient(0, 0, 0, T); rg.addColorStop(0, `rgba(${rc},0.06)`); rg.addColorStop(1, `rgba(${rc},0)`);
      g.fillStyle = rg; g.fillRect(4 + k * 5, 0, 5 + (k & 1) * 4, T); 
      g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineWidth = 1; g.beginPath(); g.moveTo(0, T - 0.5); g.lineTo(T, T - 0.5); g.stroke();
    } else if (THEME === 'tower'){
      g.strokeStyle = 'rgba(255,255,255,0.06)'; g.strokeRect(1.5, 1.5, T - 3, T - 3);
      g.fillStyle = 'rgba(255,255,255,0.12)'; for (const [x, y] of [[4, 4], [T - 6, 4], [4, T - 6], [T - 6, T - 6]]) g.fillRect(x, y, 2, 2);
      if (k === 2){ g.fillStyle = 'rgba(41,240,255,0.25)'; g.fillRect(6, 14, T - 12, 2); }
    } else {
      g.strokeStyle = 'rgba(255,255,255,0.05)'; g.lineWidth = 1; g.beginPath(); g.moveTo(0, 16); g.lineTo(T, 16); g.moveTo(16, 0); g.lineTo(16, T); g.stroke();
      if (k === 1){ g.fillStyle = 'rgba(80,200,160,0.12)'; g.fillRect(3, 20, 10, 9); }
    }
  };
  const top = (g, k) => {
    inner(g, k);
    const tg = g.createLinearGradient(0, 0, 0, 12); tg.addColorStop(0, P.topHi); tg.addColorStop(1, P.top);
    g.fillStyle = tg; g.fillRect(0, 0, T, 12);
    if (THEME === 'tower' || THEME === 'subway'){
      g.save(); g.beginPath(); g.rect(0, 9, T, 4); g.clip();
      for (let x = -8; x < T + 8; x += 8){ g.fillStyle = THEME === 'tower' ? (x / 8 % 2 ? '#ffd76a' : '#14121c') : '#ffd76a'; if (THEME === 'subway' && (x / 8) % 2) continue; g.beginPath(); g.moveTo(x, 13); g.lineTo(x + 4, 9); g.lineTo(x + 8, 9); g.lineTo(x + 4, 13); g.fill(); }
      g.restore();
    }
    if (THEME === 'street'){   // curb stone + yellow tactile paving
      g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(15, 2, 1, 10); g.fillRect(31, 2, 1, 10);
      if (k === 1){ g.fillStyle = 'rgba(255,215,106,0.55)'; for (let x = 3; x < T; x += 6) for (let y = 4; y < 11; y += 4) g.fillRect(x, y, 2, 2); }
    } else if (THEME === 'roof'){   // concrete parapet cap
      g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(0, 2, T, 2); g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(0, 10, T, 2); g.fillRect(T - 1, 2, 1, 10);
      if (k === 1){ g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(8, 5, 6, 3); g.fillRect(22, 6, 3, 2); }
    }
    g.fillStyle = P.line; g.shadowColor = P.line; g.shadowBlur = 6; g.fillRect(0, 0, T, 2); g.shadowBlur = 0;
    g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(0, 12, T, 2);
  };
  TS = { inner: [0, 1, 2, 3].map(k => mkSprite(g => inner(g, k))), top: [0, 1].map(k => mkSprite(g => top(g, k))),
    oneway: mkSprite(g => {
      const lg = g.createLinearGradient(0, 0, 0, 12); lg.addColorStop(0, '#3a2f66'); lg.addColorStop(1, '#151030');
      g.fillStyle = lg; g.fillRect(0, 0, T, 10);
      g.fillStyle = C.cy; g.shadowColor = C.cy; g.shadowBlur = 8; g.fillRect(0, 0, T, 2.5); g.shadowBlur = 0;
      const ug = g.createLinearGradient(0, 10, 0, 26); ug.addColorStop(0, 'rgba(41,240,255,0.22)'); ug.addColorStop(1, 'rgba(41,240,255,0)');
      g.fillStyle = ug; g.fillRect(0, 10, T, 16);
      g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(6, 5, 4, 2); g.fillRect(22, 5, 4, 2);
    }),
    hazard: mkSprite(g => {
      g.fillStyle = '#100a1e'; g.fillRect(0, 0, T, T);
      const wg = g.createLinearGradient(0, 0, 0, 14); wg.addColorStop(0, 'rgba(255,60,200,0.55)'); wg.addColorStop(1, 'rgba(120,20,160,0.1)');
      g.fillStyle = wg; g.fillRect(0, 2, T, 12);
      g.fillStyle = '#ffd76a'; g.shadowColor = '#ffd76a'; g.shadowBlur = 8; g.fillRect(0, 0, T, 2); g.shadowBlur = 0;
      g.strokeStyle = 'rgba(255,215,106,0.5)'; g.lineWidth = 1; g.beginPath(); g.moveTo(0, 18); g.lineTo(T, 18); g.stroke();
    }),
    cracked: mkSprite(g => {
      inner(g, 1);
      g.strokeStyle = 'rgba(160,240,255,0.7)'; g.lineWidth = 1.4; g.beginPath();
      g.moveTo(16, 0); g.lineTo(13, 9); g.lineTo(19, 15); g.lineTo(12, 24); g.lineTo(15, T); g.moveTo(13, 9); g.lineTo(4, 12); g.moveTo(19, 15); g.lineTo(28, 19); g.stroke();
      g.strokeStyle = 'rgba(41,240,255,0.35)'; g.strokeRect(1, 1, T - 2, T - 2);
    })
  };
  tilesDirty = false;
}
function drawTiles(s){
  if (tilesDirty || !TS) buildTiles();
  const lv = Sim.PARSED[s.lv];
  const c0 = Math.max(0, Math.floor(CAM.x / T)), c1 = Math.min(lv.w - 1, Math.floor((CAM.x + VW) / T));
  const r0 = Math.max(0, Math.floor(CAM.y / T)), r1 = Math.min(lv.h - 1, Math.floor((CAM.y + VH) / T));
  const ox = Math.round(CAM.x * RS) / RS, oy = Math.round(CAM.y * RS) / RS;
  const A = s.arena;
  const solid = (c, r) => { if (c < 0 || c >= lv.w) return true; if (r < 0 || r >= lv.h) return false; const ch = Sim.tileAt(s, c, r); return ch === '#' || ch === 'x' || ch === '?'; };
  const isGate = (c, r) => A && A.on && (c === A.c0 || c === A.c1) && r <= A.r;
  for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++){
    if (isGate(c, r)) continue;
    const ch = Sim.tileAt(s, c, r);
    if (ch === '.') continue;
    const x = c * T - ox, y = r * T - oy;
    if (ch === '#'){
      const up = r > 0 && !solid(c, r - 1) && !isGate(c, r - 1);
      const h = (c * 7 + r * 13) & 3;
      ctx.drawImage(up ? TS.top[h & 1] : TS.inner[h], x, y, T + 0.5, T + 0.5);
      if (!solid(c - 1, r)){ ctx.fillStyle = TPAL[THEME].trim; ctx.fillRect(x, y, 1.5, T); }
      if (!solid(c + 1, r)){ ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(x + T - 2, y, 2, T); }
    } else if (ch === '=') ctx.drawImage(TS.oneway, x, y, T + 0.5, T + 0.5);
    else if (ch === 'x'){
      ctx.drawImage(TS.hazard, x, y, T + 0.5, T + 0.5);
      if (((c * 31 + Math.floor(globalT * 9)) % 7) === 0){
        ctx.strokeStyle = Math.random() < 0.5 ? '#fff' : C.yel; ctx.lineWidth = 1.5; glow(C.yel, 10);
        ctx.beginPath(); ctx.moveTo(x + 2, y); for (let k = 1; k <= 4; k++) ctx.lineTo(x + k * 7.5, y - rand(2, 12)); ctx.stroke(); noGlow();
      }
    } else if (ch === '?'){
      ctx.drawImage(TS.cracked, x, y, T + 0.5, T + 0.5);
      const a = 0.15 + 0.15 * Math.sin(globalT * 3 + c);
      ctx.fillStyle = `rgba(41,240,255,${a})`; ctx.fillRect(x + 2, y + 2, T - 4, T - 4);
    }
  }
  // arena energy gates
  if (A && A.on){
    for (const c of [A.c0, A.c1]){
      const x = c * T - ox, yb = (A.r + 1) * T - oy;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createLinearGradient(x, 0, x + T, 0); g.addColorStop(0, 'rgba(255,43,214,0)'); g.addColorStop(0.5, 'rgba(255,43,214,0.45)'); g.addColorStop(1, 'rgba(255,43,214,0)');
      ctx.fillStyle = g; ctx.fillRect(x, -oy, T, yb + oy);
      ctx.strokeStyle = 'rgba(255,200,250,0.8)'; ctx.lineWidth = 1.5;
      for (let k = 0; k < 3; k++){ const xx = x + 8 + k * 8; ctx.beginPath(); ctx.moveTo(xx, -oy); for (let y = -oy; y < yb; y += 20) ctx.lineTo(xx + rand(-3, 3), y); ctx.stroke(); }
      ctx.fillStyle = 'rgba(255,255,255,0.25)'; const sy = ((globalT * 300) % (yb + oy)) - oy; ctx.fillRect(x, sy, T, 6);
      ctx.restore();
    }
  }
}
