// ---------------------------------------------------------------- pre-rendered Tokyo layers: shopfront row (street) + rooftop clutter (roof/tower)
function layerCanvas(w, h){ const R = Math.min(RS, 2), c = document.createElement('canvas'); c.width = Math.ceil(w * R); c.height = Math.ceil(h * R); const g = c.getContext('2d'); g.scale(R, R); return { c, g }; }
function acUnit(g, x, y, s = 1){
  g.fillStyle = '#2a2a3c'; g.fillRect(x, y, 26 * s, 18 * s); g.fillStyle = '#1a1a28'; g.fillRect(x, y + 16 * s, 26 * s, 2 * s);
  g.strokeStyle = '#4a4a62'; g.lineWidth = 1; g.beginPath(); g.arc(x + 9 * s, y + 9 * s, 6 * s, 0, TAU); g.stroke();
  g.beginPath(); g.moveTo(x + 3 * s, y + 9 * s); g.lineTo(x + 15 * s, y + 9 * s); g.moveTo(x + 9 * s, y + 3 * s); g.lineTo(x + 9 * s, y + 15 * s); g.stroke();
  g.fillStyle = '#3c3c54'; for (let k = 0; k < 4; k++) g.fillRect(x + 18 * s, y + (3 + k * 3.5) * s, 6 * s, 1.5 * s);
}
function waterTank(g, x, yb, s){
  g.fillStyle = '#0b0918'; for (const lx of [x + 3, x + 28 * s - 6]) g.fillRect(lx, yb - 22 * s, 3, 22 * s);
  g.strokeStyle = '#0b0918'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x + 4, yb - 2); g.lineTo(x + 28 * s - 4, yb - 20 * s); g.moveTo(x + 4, yb - 20 * s); g.lineTo(x + 28 * s - 4, yb - 2); g.stroke();
  const tg = g.createLinearGradient(x, 0, x + 28 * s, 0); tg.addColorStop(0, '#2c2840'); tg.addColorStop(0.5, '#1c1a2e'); tg.addColorStop(1, '#100e1c');
  g.fillStyle = tg; g.fillRect(x, yb - 52 * s, 28 * s, 30 * s); g.beginPath(); g.moveTo(x - 2, yb - 52 * s); g.lineTo(x + 14 * s, yb - 62 * s); g.lineTo(x + 28 * s + 2, yb - 52 * s); g.fill();
  g.fillStyle = 'rgba(255,255,255,0.06)'; for (let k = 0; k < 3; k++) g.fillRect(x, yb - (46 - k * 9) * s, 28 * s, 1);
}
function makeShopLayer(seed, w, h){
  const { c, g } = layerCanvas(w, h), rnd = mulberry32(seed), r = (a, b) => a + rnd() * (b - a), rp = a => a[Math.floor(rnd() * a.length)];
  const items = []; let x = 0;
  while (x < w - 60){ const bw = Math.min(r(110, 200), w - x); items.push({ x, bw, bh: r(150, 280), s: Math.floor(rnd() * 1e9) }); x += bw + r(0, 18); }
  const draw = (it, ox) => {
    const lr = mulberry32(it.s), r2 = (a, b) => a + lr() * (b - a), rp2 = a => a[Math.floor(lr() * a.length)];
    const X = it.x + ox, bw = it.bw, Y = h - it.bh;
    const gr = g.createLinearGradient(X, 0, X + bw, 0); gr.addColorStop(0, '#16112e'); gr.addColorStop(0.6, '#100c24'); gr.addColorStop(1, '#0b0919');
    g.fillStyle = gr; g.fillRect(X, Y, bw, it.bh);
    g.fillStyle = '#0d0a1e'; g.fillRect(X - 3, Y - 6, bw + 6, 8);   // cornice
    if (lr() < 0.4) waterTank(g, X + r2(10, bw - 40), Y - 6, 0.8);
    // floors: windows with warm blinds / dark
    for (let fy = Y + 14; fy < h - 70; fy += 30) for (let wx = X + 10; wx < X + bw - 24; wx += 26){
      const v = lr(); if (v < 0.3){ g.fillStyle = rp2(['rgba(255,196,130,0.5)', 'rgba(255,150,200,0.35)', 'rgba(120,210,255,0.35)']); g.fillRect(wx, fy, 16, 14); g.fillStyle = 'rgba(0,0,0,0.25)'; for (let k = 2; k < 14; k += 3) g.fillRect(wx, fy + k, 16, 1); }
      else if (v < 0.75){ g.fillStyle = 'rgba(40,30,80,0.5)'; g.fillRect(wx, fy, 16, 14); }
      if (v > 0.9) acUnit(g, wx - 2, fy + 14, 0.7);
    }
    // shopfront: lit interior + awning + noren curtains
    const sy = h - 58, sc = rp2([['#ff3b5c', '#ffd2a0'], ['#2bd6ff', '#d8f6ff'], ['#ffb347', '#fff0c8'], ['#ff5ea8', '#ffe0f0']]);
    const ig = g.createLinearGradient(0, sy, 0, h); ig.addColorStop(0, sc[1]); ig.addColorStop(1, 'rgba(255,160,90,0.4)');
    g.globalAlpha = 0.55; g.fillStyle = ig; g.fillRect(X + 8, sy + 8, bw - 16, 50); g.globalAlpha = 1;
    g.fillStyle = 'rgba(20,10,30,0.55)'; for (let k = 0; k < 4; k++) g.fillRect(X + 14 + k * (bw - 28) / 3, sy + 34, 5, 24);   // silhouettes / stools
    const aw = sc[0]; g.fillStyle = aw; g.beginPath(); g.moveTo(X + 2, sy); g.lineTo(X + bw - 2, sy); g.lineTo(X + bw + 4, sy + 12); g.lineTo(X - 4, sy + 12); g.fill();
    g.fillStyle = 'rgba(0,0,0,0.3)'; for (let k = X + 2; k < X + bw; k += 12) g.fillRect(k, sy, 6, 12);
    const nn = Math.max(3, Math.floor((bw - 20) / 18)), nw = (bw - 20) / nn, ncol = rp2(['#1d2a6a', '#7a1424', '#20202a']);
    for (let k = 0; k < nn; k++){ g.fillStyle = ncol; g.fillRect(X + 10 + k * nw + 1, sy + 12, nw - 2, 18); }
    if (hasCJK){ g.fillStyle = '#fff'; g.font = `bold 11px ${CJK_FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; const wd = Array.from(rp2(['ラーメン', '寿司', '居酒屋', 'やきとり', 'うどん', '喫茶'])); wd.slice(0, nn).forEach((ch, k) => g.fillText(ch, X + 10 + k * nw + nw / 2, sy + 21)); }
    // horizontal shop sign
    if (lr() < 0.7){
      const col = rp2([C.mg, C.cy, '#ff4b4b', C.yel, C.pu]), word = rp2(SIGN_WORDS), sw = Math.min(bw - 20, 30 + Array.from(word).length * 18);
      const sx = X + (bw - sw) / 2, syy = sy - 34;
      g.fillStyle = 'rgba(8,4,20,0.92)'; roundRect(g, sx, syy, sw, 24, 4); g.fill();
      g.strokeStyle = col; g.lineWidth = 1.5; g.shadowColor = col; g.shadowBlur = 10; g.stroke();
      g.fillStyle = '#fff'; g.font = `bold 15px ${hasCJK ? CJK_FONT : 'ui-monospace,Menlo,monospace'}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(word, sx + sw / 2, syy + 13); g.shadowBlur = 0;
    }
    g.fillStyle = 'rgba(255,60,220,0.3)'; g.fillRect(X, Y, 1.5, it.bh);
  };
  for (const it of items){ draw(it, 0); if (it.x + it.bw > w) draw(it, -w); }
  const hz = g.createLinearGradient(0, 0, 0, h); hz.addColorStop(0, 'rgba(30,10,60,0)'); hz.addColorStop(1, 'rgba(60,20,110,0.25)');
  g.fillStyle = hz; g.fillRect(0, 0, w, h);
  return { c, w, h };
}
function makeRoofLayer(seed, w, h){
  const { c, g } = layerCanvas(w, h), rnd = mulberry32(seed), r = (a, b) => a + rnd() * (b - a);
  let x = 0;
  while (x < w - 80){
    const bw = Math.min(r(140, 300), w - x), top = h - r(60, 150), lr = mulberry32(Math.floor(rnd() * 1e9)), r2 = (a, b) => a + lr() * (b - a);
    const gr = g.createLinearGradient(0, top, 0, h); gr.addColorStop(0, '#15102c'); gr.addColorStop(1, '#0b0819');
    g.fillStyle = gr; g.fillRect(x, top, bw, h - top);
    g.fillStyle = 'rgba(255,60,220,0.35)'; g.fillRect(x, top, bw, 1.5);
    g.strokeStyle = 'rgba(30,24,60,0.95)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x, top - 12); g.lineTo(x + bw, top - 12); for (let k = x; k <= x + bw; k += 14){ g.moveTo(k, top - 12); g.lineTo(k, top); } g.stroke();   // railing
    let px = x + 10;
    while (px < x + bw - 40){
      const v = lr();
      if (v < 0.3){ waterTank(g, px, top, r2(0.8, 1.1)); px += 40; }
      else if (v < 0.6){ acUnit(g, px, top - 18); if (lr() < 0.5) acUnit(g, px, top - 36); px += 32; }
      else if (v < 0.75){ g.fillStyle = '#120e24'; g.fillRect(px, top - 34, 30, 34); g.fillStyle = 'rgba(255,190,120,0.7)'; g.shadowColor = '#ffb070'; g.shadowBlur = 8; g.fillRect(px + 10, top - 22, 10, 22); g.fillRect(px + 13, top - 30, 4, 3); g.shadowBlur = 0; px += 40; }
      else if (v < 0.83){ g.fillStyle = '#0d0a1e'; g.fillRect(px + 8, top - 70, 2, 70); g.fillRect(px + 2, top - 60, 14, 2); g.fillRect(px + 4, top - 48, 10, 2); g.fillStyle = '#ff4b6e'; g.shadowColor = '#ff4b6e'; g.shadowBlur = 6; g.fillRect(px + 7, top - 73, 4, 3); g.shadowBlur = 0; px += 24; }
      else if (v < 0.88 && hasCJK){   // tiny rooftop shrine
        g.fillStyle = '#1a0e1e'; g.fillRect(px, top - 26, 34, 26); g.fillStyle = '#2a1626'; g.beginPath(); g.moveTo(px - 6, top - 26); g.quadraticCurveTo(px + 17, top - 34, px + 40, top - 26); g.lineTo(px + 17, top - 42); g.fill();
        g.fillStyle = '#ff4030'; g.shadowColor = '#ff4030'; g.shadowBlur = 10; g.beginPath(); g.ellipse(px + 17, top - 12, 5, 7, 0, 0, TAU); g.fill(); g.shadowBlur = 0; px += 48;
      } else px += 18;
    }
    for (let wy = top + 14; wy < h - 6; wy += 16) for (let wx = x + 8; wx < x + bw - 12; wx += 18) if (lr() < 0.16){ g.fillStyle = lr() < 0.5 ? 'rgba(255,196,130,0.45)' : 'rgba(120,210,255,0.35)'; g.fillRect(wx, wy, 9, 7); }
    if (lr() < 0.5){ const col = [C.mg, C.cy, C.pu][Math.floor(lr() * 3)], word = SIGN_WORDS[Math.floor(lr() * SIGN_WORDS.length)]; const ch = Array.from(word), fs = 14, sx = x + bw - 30, sy = top + 10;
      g.fillStyle = 'rgba(8,4,20,0.92)'; roundRect(g, sx, sy, fs + 10, ch.length * (fs + 3) + 10, 3); g.fill(); g.strokeStyle = col; g.lineWidth = 1.4; g.shadowColor = col; g.shadowBlur = 10; g.stroke();
      g.fillStyle = '#fff'; g.font = `bold ${fs}px ${hasCJK ? CJK_FONT : 'ui-monospace,Menlo,monospace'}`; g.textAlign = 'center'; g.textBaseline = 'middle'; ch.forEach((cc, k) => g.fillText(cc, sx + (fs + 10) / 2, sy + 6 + fs / 2 + k * (fs + 3))); g.shadowBlur = 0; }
    x += bw + r(10, 50);
  }
  return { c, w, h };
}
