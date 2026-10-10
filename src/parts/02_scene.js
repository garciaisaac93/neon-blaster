// ---------------------------------------------------------------- scene (shared look with NEON RUNNER)
// ---------------------------------------------------------------- pre-rendered parallax layers
const layers = { shop: null, roofs: null };
function buildLayers(){ layers.shop = makeShopLayer(2088, 1900, 300); layers.roofs = makeRoofLayer(1337, 2100, 230); layersDirty = false; }
function drawTiled(L, par, yBottom, alpha){
  if (!L) return;
  const off = ((cam * par) % L.w + L.w) % L.w;
  ctx.globalAlpha = alpha;
  for (let x = -off; x < VW; x += L.w) ctx.drawImage(L.c, x, yBottom - L.h, L.w + 0.5, L.h);
  ctx.globalAlpha = 1;
}

const flyers = Array.from({ length: 15 }, (_, i) => ({ x0: Math.random() * 2000, v: (i % 3 === 0 ? -1 : 1) * rand(25, 70), y: rand(250, 400), c: pick(['#ff6b9a', '#ffe0a0', '#7ff6ff', '#ff4b6e']), a: rand(0.4, 0.8) }));
function drawSky(){
  // distant flying traffic
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (const f of flyers){
    const span = VW + 400, x = ((f.x0 + globalT * f.v - cam * 0.05) % span + span) % span - 200, y = GROUND - f.y;
    ctx.fillStyle = f.c; ctx.globalAlpha = f.a;
    ctx.fillRect(x, y, 3, 1.6);
    const tg2 = ctx.createLinearGradient(x, 0, x - f.v * 0.25 * Math.sign(f.v), 0); tg2.addColorStop(0, f.c); tg2.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = tg2; ctx.globalAlpha = f.a * 0.5; ctx.fillRect(Math.min(x, x - f.v * 0.25 * Math.sign(f.v)), y + 0.3, Math.abs(f.v * 0.25), 1);
  }
  ctx.globalAlpha = 1; ctx.restore();
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const hg = ctx.createLinearGradient(0, GROUND - 160, 0, GROUND);
  hg.addColorStop(0, 'rgba(150,40,200,0)'); hg.addColorStop(1, 'rgba(150,50,220,0.14)');
  ctx.fillStyle = hg; ctx.fillRect(0, GROUND - 160, VW, 160); ctx.restore();
}
function drawNear(){
  const par = 0.72, base = GROUND - 6, off = cam * par, spacing = 420;
  const first = Math.floor((off - 200) / spacing);
  for (let i = first; i * spacing - off < VW + 200; i++){
    const x = i * spacing - off + 120, top = base - 200;
    ctx.fillStyle = '#100d1f'; ctx.fillRect(x - 3, top, 6, base - top);
    ctx.strokeStyle = '#100d1f'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x, top + 4); ctx.quadraticCurveTo(x + 4, top - 14, x + 30, top - 10); ctx.stroke();
    ctx.fillStyle = '#1d1830'; roundRect(ctx, x + 22, top - 14, 26, 7, 3); ctx.fill();
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const rg = ctx.createRadialGradient(x + 35, top - 6, 1, x + 35, top - 6, 70); rg.addColorStop(0, 'rgba(255,225,180,0.8)'); rg.addColorStop(0.15, 'rgba(255,190,140,0.35)'); rg.addColorStop(1, 'rgba(255,150,120,0)');
    ctx.fillStyle = rg; ctx.fillRect(x - 40, top - 80, 150, 150);
    const cg = ctx.createLinearGradient(0, top, 0, base); cg.addColorStop(0, 'rgba(255,210,170,0.10)'); cg.addColorStop(1, 'rgba(255,210,170,0.02)');
    ctx.fillStyle = cg; ctx.beginPath(); ctx.moveTo(x + 26, top - 6); ctx.lineTo(x + 44, top - 6); ctx.lineTo(x + 100, base); ctx.lineTo(x - 30, base); ctx.closePath(); ctx.fill();
    ctx.restore();
    if (i % 2 === 0){ const nc = (i % 4 === 0) ? C.cy : C.mg; ctx.fillStyle = nc; glow(nc, 12); ctx.fillRect(x - 1, top + 40, 2, 60); noGlow(); }
  }
  ctx.fillStyle = '#120f22'; ctx.fillRect(0, base - 32, VW, 3); ctx.fillRect(0, base - 17, VW, 2);
  ctx.fillStyle = 'rgba(160,120,255,0.35)'; ctx.fillRect(0, base - 32, VW, 1);
  ctx.fillStyle = '#120f22';
  const ps = 26, po = off % ps;
  for (let x = -po; x < VW; x += ps) ctx.fillRect(x, base - 32, 2, 32);
  for (let i = Math.floor((off - 300) / spacing); i * spacing - off < VW + 300; i++){   // vending machines on the sidewalk
    if (((i % 3) + 3) % 3 === 2) continue;
    const x = i * spacing - off + 250, k = ((i % 7) + 7) % 7;
    vending(x, base, [C.cy, '#ff4b6e', C.yel, C.mg][k & 3], k); if (k % 2) vending(x + 44, base, ['#5dff9e', C.cy, '#ff9a3d'][k % 3], k + 3);
  }
  ctx.fillStyle = '#0d0b1a'; ctx.fillRect(0, base, VW, GROUND - base);
}
function drawBloom(){
  if (lowQ || noBloom) return;   // cheap bloom: downsample twice, add back blurred
  b1c.globalCompositeOperation = 'copy'; b1c.imageSmoothingEnabled = true; b1c.drawImage(canvas, 0, 0, b1.width, b1.height);
  b2c.globalCompositeOperation = 'copy'; b2c.imageSmoothingEnabled = true; b2c.drawImage(b1, 0, 0, b2.width, b2.height);
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'lighter'; ctx.imageSmoothingEnabled = true;
  ctx.globalAlpha = 0.24; ctx.drawImage(b2, 0, 0, canvas.width, canvas.height);
  ctx.restore();
}

// ---------------------------------------------------------------- atmosphere: drifting neon dust + slow haze (replaces rain)
const motes = [];
const MOTE_COLS = ['#29f0ff', '#ff4fd8', '#ffd76a', '#b49cff', '#7ff6ff'];
function newMote(init){
  const z = rand(0.2, 1);
  return { x: rand(-10, VW + 10), y: init ? rand(-10, VH + 10) : VH + 8, z, vx: rand(-5, 5), vy: -rand(3, 12) * (0.4 + z), ph: rand(0, TAU), c: pick(MOTE_COLS), r: rand(0.7, 1.6) * (0.6 + z) };
}
const petals = [];
function newPetal(init){ const z = rand(0.35, 1); return { x: rand(-20, VW + 20), y: init ? rand(-20, VH) : -14, z, vx: rand(14, 34) * z, vy: rand(16, 30) * z, ph: rand(0, TAU), rs: rand(1.5, 3.5), s: rand(2.2, 3.6) * z }; }
function initAtmos(){ petals.length = 0; for (let i = 0, n = Math.round(VW * VH / 26000); i < n; i++) petals.push(newPetal(true)); motes.length = 0; const n = Math.round(VW * VH / 8500); for (let i = 0; i < n; i++) motes.push(newMote(true)); }
function updateAtmos(dt, dx, dy){
  const W = VW + 20, H = VH + 20;
  for (const m of motes){
    m.x += (m.vx + Math.sin(globalT * 0.6 + m.ph) * 7) * dt - dx * (0.25 + m.z * 0.6);
    m.y += m.vy * dt - dy * (0.25 + m.z * 0.6);
    if (m.x < -10) m.x += W; else if (m.x > VW + 10) m.x -= W;
    if (m.y < -10) m.y += H; else if (m.y > VH + 10) m.y -= H;
  }
  for (const q of petals){
    q.x += (q.vx + Math.sin(globalT * 1.3 + q.ph) * 14) * dt - dx * (0.3 + q.z * 0.7); q.y += q.vy * dt - dy * (0.3 + q.z * 0.7);
    if (q.y > VH + 16 || q.x > VW + 30 || q.x < -40 || q.y < -30){ Object.assign(q, newPetal(false)); if (Math.random() < 0.5){ q.x = -14; q.y = rand(-10, VH * 0.7); } }
  }
}
const HAZE = [{ x: 0.2, y: 0.7, r: 0.55, c: '120,60,220', v: 9 }, { x: 0.75, y: 0.55, r: 0.45, c: '40,200,255', v: -6 }, { x: 0.5, y: 0.95, r: 0.6, c: '255,60,200', v: 4 }];
function drawAtmos(){
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (const h of HAZE){   // big soft glows that drift slowly: a light neon haze over the city
    const span = VW * 1.6, x = (((h.x * VW + globalT * h.v - CAM.x * 0.04) % span) + span) % span - VW * 0.3, y = h.y * VH, r = h.r * Math.max(VW, VH);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${h.c},0.06)`); g.addColorStop(1, `rgba(${h.c},0)`);
    ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  for (const m of motes){
    const tw = 0.55 + 0.45 * Math.sin(globalT * (1.2 + m.z) + m.ph), a = (0.18 + 0.5 * m.z) * tw;
    ctx.fillStyle = m.c; ctx.globalAlpha = a * 0.22; ctx.beginPath(); ctx.arc(m.x, m.y, m.r * 3.2, 0, TAU); ctx.fill();
    ctx.globalAlpha = a; ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, TAU); ctx.fill();
  }
  ctx.globalAlpha = 1; ctx.restore();
  if (THEME !== 'subway'){   // sakura petals drifting through the neon
    for (const q of petals){
      const a = globalT * q.rs + q.ph, flip = Math.cos(globalT * q.rs * 1.7 + q.ph);
      ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(a); ctx.scale(1, 0.35 + 0.65 * Math.abs(flip));
      ctx.globalAlpha = 0.45 + 0.45 * q.z; ctx.fillStyle = flip > 0 ? '#ffc4dd' : '#ff8fbf';
      ctx.beginPath(); ctx.moveTo(-q.s * 1.2, 0); ctx.quadraticCurveTo(0, -q.s, q.s * 1.2, -q.s * 0.15); ctx.lineTo(q.s * 0.8, 0); ctx.lineTo(q.s * 1.2, q.s * 0.15); ctx.quadraticCurveTo(0, q.s, -q.s * 1.2, 0); ctx.fill();
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }
}
