// ---------------------------------------------------------------- Ronin portraits in the DOM overlays (suit card, result, stage select, HUD chip)
function fitCanvas(cv){
  const r = cv.getBoundingClientRect(); if (!r.width || !r.height) return null;
  const d = Math.min(2, window.devicePixelRatio || 1), w = Math.round(r.width * d), h = Math.round(r.height * d);
  if (cv.width !== w || cv.height !== h){ cv.width = w; cv.height = h; }
  const g = cv.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, w, h); g.setTransform(d, 0, 0, d, 0, 0);
  return { g, w: r.width, h: r.height };
}
function uiBot(g, x, fy, suit, mode, sc, extra = {}){
  const t = globalT + (extra.t0 || 0);
  drawBot(g, x, fy, botPose(mode, t, { phase: t * 9, hop: mode === 'cheer' ? Math.abs(Math.sin(t * 6)) : 0 }), Object.assign({ suit, face: 1, scale: sc, shadow: true, thrust: mode === 'hover' ? 0.7 : 0, ph: extra.t0 || 0 }, extra));
}
let hudIconKey = '';
function drawUi(){
  // HUD helmet chip
  if (S && $('hud').classList.contains('on')){
    const k = S.p.suit; const cv = $('suitIcon');
    if (k !== hudIconKey || Math.floor(globalT * 4) !== Math.floor((globalT - 1 / 60) * 4)){
      hudIconKey = k; const f = fitCanvas(cv); if (f) { const s = f.h / 44; drawRoninHead(f.g, k, f.w / 2 - 1, f.h / 2 + 53 * s, s); }
    }
  }
  const sc = $('suitCard');
  if (sc.classList.contains('on') && S){
    const f = fitCanvas($('scBot')); if (f){ const s = f.h / 140; uiBot(f.g, f.w / 2 - 6 * s, f.h - 8, sc.dataset.suit || 'volt', 'cheer', s, { aim: false }); }
  }
  if ($('result').classList.contains('on')){
    const f = fitCanvas($('rBot')); if (f){ const s = f.h / 140; uiBot(f.g, f.w / 2 - 6 * s, f.h - 8, $('rBot').dataset.suit || 'ronin', 'cheer', s); }
  }
  if ($('ending').classList.contains('on')){
    const f = fitCanvas($('eCv'));
    if (f){
      const g = f.g, W = f.w, H = f.h, t = globalT;
      const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#07041a'); bg.addColorStop(0.6, '#1c0b3a'); bg.addColorStop(1, '#3a0d3e'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
      // skyline silhouette + windows
      for (let i = 0; i < 40; i++){ const bw = 30 + (i * 37 % 50), bx = (i * 61) % (W + 60) - 30, bh = H * (0.18 + ((i * 53) % 40) / 100); g.fillStyle = i % 2 ? '#120a26' : '#180e30'; g.fillRect(bx, H - bh, bw, bh); g.fillStyle = 'rgba(255,215,140,0.35)'; for (let y = H - bh + 8; y < H - 10; y += 14) for (let x = bx + 5; x < bx + bw - 6; x += 10) if (((x * 7 + y * 3) | 0) % 5 === 0) g.fillRect(x, y, 4, 6); }
      // fireworks
      for (let k = 0; k < 5; k++){ const ph = (t * 0.45 + k * 0.37) % 1, fx = W * [0.1, 0.9, 0.2, 0.8, 0.07][k], fy = H * (0.14 + (k % 3) * 0.07), col = ['#ff2bd6', '#29f0ff', '#ffd76a', '#5dff9e', '#ff7a2b'][k];
        if (ph < 0.75){ const r = ph * Math.min(110, W * 0.09); g.globalAlpha = 1 - ph / 0.75; g.fillStyle = col; for (let i = 0; i < 18; i++){ const a = i * TAU / 18; g.beginPath(); g.arc(fx + Math.cos(a) * r, fy + Math.sin(a) * r + ph * ph * 30, 2.4, 0, TAU); g.fill(); } g.globalAlpha = 1; } }
      // defeated bosses on the skyline, Ronin + suits celebrating in front
      const types = ['oni', 'kite', 'shogun', 'dragon'], s = Math.min(H / 520, W / 900);
      const isz = Math.min(130 * s, W * 0.2); g.globalAlpha = 0.42; types.forEach((ty, i) => { g.save(); g.translate(W * (0.13 + i * 0.25) - isz / 2, H * 0.47); drawBossIcon(g, ty, isz, isz, t + i); g.restore(); }); g.globalAlpha = 1;
      const suits = Sim.SUIT_ORDER;
      suits.forEach((k, i) => uiBot(g, W * (0.5 + (i - 2) * 0.15) + (i < 2 ? -0.06 : i > 2 ? 0.06 : 0) * W * 0, H * 0.94, k, 'cheer', s * 0.85, { t0: i * 0.4, aim: false }));
      uiBot(g, W * 0.5, H * 0.98, 'ronin', 'cheer', s * 1.5, { t0: 0.2, aim: false });
    }
  }
  if ($('select').classList.contains('on')){
    for (const ic of document.querySelectorAll('canvas.bicon')){ const f = fitCanvas(ic); if (f) drawBossIcon(f.g, ic.dataset.boss, f.w, f.h, globalT); }
    const f = fitCanvas($('selBots'));
    if (f){
      const st = store.suits || ['volt'], all = ['ronin', ...Sim.SUIT_ORDER], n = all.length, s = Math.min(f.h / 108, f.w / n / 70);
      all.forEach((k, i) => {
        const have = k === 'ronin' || st.includes(k);
        f.g.globalAlpha = have ? 1 : 0.35; if (!have) f.g.filter = 'brightness(0.25) saturate(0)';
        uiBot(f.g, (i + 0.42) * f.w / n, f.h - 6, k, i === 0 ? 'idle' : 'idle', s, { t0: i * 0.7, aim: i > 0 && have, charge: have ? 0.25 + 0.25 * Math.sin(globalT * 3 + i) : 0 });
        f.g.filter = 'none'; f.g.globalAlpha = 1;
      });
    }
  }
}
