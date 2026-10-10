// ---------------------------------------------------------------- camera, player rendering, frame loop
function camTarget(){
  const p = S.p, px = p.x + p.w / 2, py = p.y + p.h / 2;
  let tx = px + CAM.look - VW / 2, ty = py - VH * (THEME === 'tower' ? 0.5 : 0.56);
  let x0 = 0, x1 = LW - VW;
  const A = S.arena;
  if (A && A.on && A.v){ ty = Math.max(0, (A.r + 1) * T - VH); }
  else if (A && A.on){ const a0 = A.c0 * T, a1 = (A.c1 + 1) * T; if (a1 - a0 <= VW){ x0 = x1 = (a0 + a1) / 2 - VW / 2; } else { x0 = a0; x1 = a1 - VW; } }
  tx = x1 < x0 ? (x0 + x1) / 2 : clamp(tx, x0, x1);
  if (LW < VW) tx = (LW - VW) / 2;
  ty = LH <= VH ? LH - VH : clamp(ty, 0, LH - VH);
  if (A && A.on && A.v) ty = Math.max(0, (A.r + 1) * T - VH);
  return { x: tx, y: ty };
}
let lastCamX = 0, lastCamY = 0;
function updateCam(dt){
  CAM.look = lerp(CAM.look, S.p.face * Math.min(120, VW * 0.16), 1 - Math.exp(-dt * 2.5));
  const t = camTarget();
  CAM.x = lerp(CAM.x, t.x, 1 - Math.exp(-dt * 7)); CAM.y = lerp(CAM.y, t.y, 1 - Math.exp(-dt * 5));
}
function drawPlayer(alpha){
  const p = S.p;
  const x = lerp(pv.x, p.x, alpha) + p.w / 2 - CAM.x, fy = lerp(pv.y, p.y, alpha) + p.h - CAM.y;
  if (p.dead > 0){ V.deadT += 1 / 60; if (V.deadT > 1.35) return; }
  if (p.inv > 0 && p.dead <= 0 && Math.floor(globalT * 18) % 2 === 0) return;
  let mode = 'idle';
  if (S.done) mode = 'cheer';
  else if (p.dead > 0) mode = 'down';
  else if (p.hurtT > 0) mode = 'hurt';
  else if (!p.onGround) mode = p.hover ? 'hover' : p.vy < 0 ? 'jump' : 'fall';
  else if (Math.abs(p.vx) > 25) mode = 'run';
  const pose = botPose(mode, globalT, { phase: V.phase, hop: S.done ? Math.abs(Math.sin(globalT * 6)) : 0, k: V.deadT / 0.45 });
  const aim = !S.done && p.dead <= 0 && (p.aimT < 0.4 || p.chargeLv > 0 || (p.pf && p.charge > 0.15));
  const thrust = p.hover ? 0.65 + Math.sin(globalT * 30) * 0.1 : p.flapT > 0 ? 1 : 0;
  const cl = p.chargeLv === 2 ? 1 : p.chargeLv === 1 ? 0.55 : p.charge > 0.15 ? 0.2 : 0;
  // bubble shield
  if (p.bubble > 0){
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const r = 40 + Math.sin(globalT * 8) * 2, cy = fy - 30;
    const bg = ctx.createRadialGradient(x, cy, r * 0.6, x, cy, r); bg.addColorStop(0, 'rgba(93,255,158,0)'); bg.addColorStop(1, `rgba(93,255,158,${p.bubble < 1 && Math.sin(globalT * 30) > 0 ? 0.1 : 0.35})`);
    ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(x, cy, r, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(200,255,220,0.6)'; ctx.lineWidth = 1.5; ctx.beginPath(); for (let k = 0; k < 6; k++){ const a = k * Math.PI / 3 + globalT; ctx.lineTo(x + Math.cos(a) * r, cy + Math.sin(a) * r); } ctx.closePath(); ctx.stroke();
    ctx.restore();
  }
  if (p.dead > 0 && V.deadT > 0.85) ctx.globalAlpha = Math.max(0, 1 - (V.deadT - 0.85) / 0.5);
  const muzzle = drawBot(ctx, x, fy, pose, { suit: p.suit, face: p.face, scale: 0.58, aim, charge: cl, thrust: p.dead > 0 ? 0 : thrust, blink: V.blink, dead: p.dead > 0, defeat: p.dead > 0, glow: cl, recoil: V.muzzleT > 0 ? 3 : 0, squash: p.landT > 0 ? 0.06 : 0, ph: p.x * 0.01 });
  ctx.globalAlpha = 1;
  if (p.dead > 0) return;
  V.muzzle = muzzle;
  if (V.swapT > 0 || (cl > 0.5 && Math.sin(globalT * 30) > 0)){
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; const col = Sim.SUITS[p.suit].color;
    const g = ctx.createRadialGradient(x, fy - 30, 4, x, fy - 30, 46); g.addColorStop(0, hexA(col, V.swapT > 0 ? 0.6 : 0.3)); g.addColorStop(1, hexA(col, 0));
    ctx.fillStyle = g; ctx.fillRect(x - 46, fy - 76, 92, 92); ctx.restore();
  }
  if (aim && V.muzzleT > 0){ ctx.save(); ctx.globalCompositeOperation = 'lighter'; const col = Sim.SUITS[p.suit].color, g = ctx.createRadialGradient(muzzle[0], muzzle[1], 0, muzzle[0], muzzle[1], 16); g.addColorStop(0, '#fff'); g.addColorStop(0.4, col); g.addColorStop(1, hexA(col, 0)); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(muzzle[0], muzzle[1], 16, 0, TAU); ctx.fill(); ctx.restore(); }
  // jet flame particles + charge sparks
  if (thrust > 0 && Math.random() < 0.8) addP({ x: BOT.jet[0] + CAM.x + rand(-3, 3), y: BOT.jet[1] + CAM.y + 8, vx: rand(-20, 20) - p.vx * 0.2, vy: rand(140, 260), life: rand(0.15, 0.3), col: pick(['#ffffff', C.cy, '#7fd8ff']), s: rand(1.5, 3), g: 0 });
  if (cl > 0 && Math.random() < 0.7){ const a = rand(0, TAU), r = rand(18, 30), col = Sim.SUITS[p.suit].color; addP({ x: muzzle[0] + CAM.x + Math.cos(a) * r, y: muzzle[1] + CAM.y + Math.sin(a) * r, vx: -Math.cos(a) * r * 4, vy: -Math.sin(a) * r * 4, life: 0.22, col, s: 2, g: 0 }); }
  // fuel gauge
  if (!p.onGround || p.fuel < 0.999) V.fuelShow = 0.8; else V.fuelShow = Math.max(0, V.fuelShow - 1 / 60);
  if (V.fuelShow > 0 && p.dead <= 0){
    const a = Math.min(1, V.fuelShow * 3), gx = x - 18, gy = fy - 74;
    ctx.globalAlpha = a; ctx.fillStyle = 'rgba(8,6,26,0.8)'; roundRect(ctx, gx - 1, gy - 1, 38, 7, 3.5); ctx.fill();
    const fc = p.fuel < 0.25 ? C.red : C.cy;
    ctx.fillStyle = fc; glow(fc, 8); roundRect(ctx, gx, gy, 36 * p.fuel, 5, 2.5); ctx.fill(); noGlow(); ctx.globalAlpha = 1;
  }
}
function drawBanner(){
  if (V.bannerT > 0){
    const a = clamp(Math.min(V.bannerT, 2.6 - V.bannerT) * 3, 0, 1), d = Sim.LEVELS[curLv];
    ctx.globalAlpha = a; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(8,6,26,0.55)'; ctx.fillRect(0, VH * 0.3 - 40, VW, 80);
    ctx.font = 'bold 12px ui-monospace,Menlo,monospace'; ctx.fillStyle = C.yel; ctx.fillText(`STAGE ${curLv + 1}`, VW / 2, VH * 0.3 - 20);
    ctx.font = 'italic 900 38px "Segoe UI",Roboto,Arial,sans-serif'; ctx.fillStyle = '#fff'; glow(C.cy, 18); ctx.fillText(d.name.toUpperCase(), VW / 2, VH * 0.3 + 10); noGlow();
    ctx.globalAlpha = 1;
  }
  if (S.cut && S.cut.k === 'boss' && S.boss) drawIntroCard(S.boss, S.cut.t, V.introT0 || 2.6);
}
function drawIntroCard(b, t, T0){
  const info = BOSS_INFO[b.type] || {}, col = info.col || C.mg, a = clamp(Math.min(T0 - t, t) * 4, 0, 1), slide = (1 - clamp((T0 - t) * 3, 0, 1));
  const y0 = Math.max(20, VH * 0.5 - 92), hh = 150, final = b.type === 'dragon';
  ctx.save(); ctx.globalAlpha = a;
  const bg = ctx.createLinearGradient(0, y0, 0, y0 + hh); bg.addColorStop(0, 'rgba(10,4,24,0.88)'); bg.addColorStop(0.5, 'rgba(26,6,30,0.92)'); bg.addColorStop(1, 'rgba(10,4,24,0.88)');
  ctx.fillStyle = bg; ctx.fillRect(0, y0, VW, hh);
  ctx.save(); ctx.beginPath(); ctx.rect(0, y0 - 10, VW, 10); ctx.rect(0, y0 + hh, VW, 10); ctx.clip();
  for (let x = -40 + (globalT * 140) % 40; x < VW + 40; x += 40){ ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x, y0 + hh + 10); ctx.lineTo(x + 20, y0 - 10); ctx.lineTo(x + 36, y0 - 10); ctx.lineTo(x + 16, y0 + hh + 10); ctx.fill(); }
  ctx.restore();
  // giant kanji watermark
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `900 ${Math.min(130, VW / Math.max(3, (info.kanji || '').length) * 0.95)}px ${CJK_FONT}`; ctx.fillStyle = hexA(col, 0.13); ctx.fillText(info.kanji || '', VW * 0.6 + slide * 120, y0 + hh / 2 + 4);
  // portrait
  const px = VW * 0.2 - slide * 200, py = y0 + hh / 2, pr = 64;
  { const pg = ctx.createRadialGradient(px, py, 10, px, py, pr); pg.addColorStop(0, hexA(col, 0.35)); pg.addColorStop(1, 'rgba(8,4,20,0.95)'); ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(px, py, pr, 0, TAU); ctx.fill(); }
  ctx.save(); ctx.beginPath(); ctx.arc(px, py, pr, 0, TAU); ctx.clip(); ctx.translate(px - pr, py - pr); drawBossIcon(ctx, b.type, pr * 2, pr * 2, globalT); ctx.restore();
  ctx.strokeStyle = col; ctx.lineWidth = 3; glow(col, 18); ctx.beginPath(); ctx.arc(px, py, pr, 0, TAU); ctx.stroke(); noGlow();
  // text block
  const tx = VW * 0.6 + slide * 260, maxW = VW * 0.62;
  ctx.font = 'bold 13px ui-monospace,Menlo,monospace'; ctx.fillStyle = Math.sin(globalT * 12) > 0 ? '#ff6b88' : '#fff';
  ctx.fillText(final ? '⚠ WARNING ⚠  FINAL BOSS' : b.type === 'shogun' ? '⚠ WARNING ⚠  TOWER GUARDIAN' : '⚠ WARNING ⚠  MINI-BOSS APPROACHING', tx, y0 + 24);
  let fs = 38; ctx.font = `italic 900 ${fs}px "Segoe UI",Roboto,Arial,sans-serif`; const w = ctx.measureText(b.name).width; if (w > maxW){ fs = Math.floor(fs * maxW / w); ctx.font = `italic 900 ${fs}px "Segoe UI",Roboto,Arial,sans-serif`; }
  ctx.fillStyle = '#fff'; glow(col, 20); ctx.fillText(b.name, tx, y0 + 64); noGlow();
  ctx.font = `900 26px ${CJK_FONT}`; ctx.fillStyle = '#ffd76a'; glow('#ffb347', 12); ctx.fillText(info.kanji || '', tx, y0 + 102); noGlow();
  ctx.font = 'bold 11px ui-monospace,Menlo,monospace'; ctx.fillStyle = '#c9c0f0'; ctx.fillText('— ' + (info.tag || '') + ' —', tx, y0 + 130);
  ctx.restore();
}
function drawVignette(){
  const g = ctx.createRadialGradient(VW / 2, VH * 0.5, Math.min(VW, VH) * 0.4, VW / 2, VH * 0.5, Math.max(VW, VH) * 0.8);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(2,0,10,0.5)'); ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH);
}
let menuCam = 0;
function render(alpha){
  if (layersDirty) buildLayers();
  ctx.setTransform(RS, 0, 0, RS, 0, 0);
  if (!S){   // menu backdrop: drifting street
    THEME = 'street'; menuCam += 1 / 60 * 22; CAM.x = menuCam; CAM.y = 14 * T - VH * 0.84;
    drawBackground(); drawAtmos();
    if (!lowQ) drawBloom(); ctx.setTransform(RS, 0, 0, RS, 0, 0);
    const rx = VW * (PORTRAIT ? 0.5 : 0.84), fy = VH * (PORTRAIT ? 0.84 : 0.7) + Math.sin(globalT * 2) * 8;
    { const dg = ctx.createRadialGradient(VW / 2, VH * 0.45, 40, VW / 2, VH * 0.45, VW * 0.5); dg.addColorStop(0, 'rgba(4,2,14,0.6)'); dg.addColorStop(1, 'rgba(4,2,14,0.15)'); ctx.fillStyle = dg; ctx.fillRect(0, 0, VW, VH); }
    if (state === 'title' && VH > 420){ drawBot(ctx, rx, fy, botPose('hover', globalT), { suit: ['ronin', ...Sim.SUIT_ORDER][Math.floor(globalT / 2.5) % 6], face: 1, scale: PORTRAIT ? 1.1 : 1.45, thrust: 0.7, aim: true, shadow: false, charge: 0.3 + 0.3 * Math.sin(globalT * 3) }); }
    drawVignette(); return;
  }
  ctx.save(); ctx.translate(shakeX, shakeY);
  drawBackground();
  drawAtmos();
  ctx.setTransform(RS, 0, 0, RS, 0, 0); ctx.translate(shakeX, shakeY);
  drawTiles(S); drawSubwayLamps(); drawSigns(S); drawCheckpoints(S); drawGoal(S); drawPlats(S); drawPicks(S);
  for (const e of S.enemies) drawEnemy(e, S);
  if (S.boss) drawBoss(S.boss);
  drawPlayer(alpha);
  drawShots(S); drawParts();
  ctx.restore();
  drawBloom();
  ctx.setTransform(RS, 0, 0, RS, 0, 0);
  drawVignette(); drawBanner();
  if (flashT > 0){ ctx.fillStyle = flashCol; ctx.globalAlpha = flashT * 4; ctx.fillRect(0, 0, VW, VH); ctx.globalAlpha = 1; }
}
function update(dt){
  globalT += dt;
  if ((V.nextBlink -= dt) <= 0){ V.blink = 0.12; V.nextBlink = rand(2, 5); } V.blink = Math.max(0, V.blink - dt);
  V.muzzleT = Math.max(0, V.muzzleT - dt); V.swapT = Math.max(0, V.swapT - dt); V.cellT = Math.max(0, V.cellT - dt); V.bannerT = Math.max(0, V.bannerT - dt); flashT = Math.max(0, flashT - dt);
  if (state === 'play' && S){
    acc += dt * speed;
    let n = 0; const maxN = Math.max(4, Math.ceil(speed * 4));
    while (acc >= DT && n < maxN){
      let inp;
      if (replay){ const v = replay.tape[replay.i++] || 0; inp = { l: v & 1, r: v >> 1 & 1, d: v >> 2 & 1, j: v >> 3 & 1, f: v >> 4 & 1, u: 0, sw: 0 }; if (testHold) Object.assign(inp, testHold); }
      else inp = liveInput();
      pv.x = S.p.x; pv.y = S.p.y;
      Sim.step(S, inp);
      if (S.ev.length) handleEvents(S.ev);
      acc -= DT; n++;
      if (state !== 'play') break;
    }
    if (acc > DT * 4) acc = 0;
    if (S.cut && S.cut.k === 'suit' && S.cut.t < 0.05) $('suitCard').classList.remove('on');
    if (!S.cut && $('suitCard').classList.contains('on')) $('suitCard').classList.remove('on');
    const p = S.p;
    if (p.onGround && Math.abs(p.vx) > 25) V.phase += Math.abs(p.vx) * dt * 0.052;
    Sfx.hover(p.hover && !S.cut, p.fuel); Sfx.charging(p.chargeLv, p.chargeLv > 0 && !S.cut);
    bossDeathFx(S.boss, dt);
    if (resultT > 0 && (resultT -= dt) <= 0) finishLevel();
    updateCam(dt);
    updateHud();
  } else if (state === 'pause'){ /* frozen */ }
  if (shakeAmt > 0){ shakeAmt = Math.max(0, shakeAmt - dt * 30); shakeX = rand(-1, 1) * shakeAmt; shakeY = rand(-1, 1) * shakeAmt; } else shakeX = shakeY = 0;
  if (state !== 'pause') updateParts(dt);
  const dx = CAM.x - lastCamX, dy = CAM.y - lastCamY; lastCamX = CAM.x; lastCamY = CAM.y;
  updateAtmos(dt, Math.abs(dx) > 200 ? 0 : dx, Math.abs(dy) > 200 ? 0 : dy);
}
let last = performance.now(), qAcc = 0, qN = 0, qStage = 0, qWait = 3;
function frame(now){
  const raw = Math.min(0.1, (now - last) / 1000); last = now;
  const dt = Math.min(0.05, raw);
  try { if (!window.__blasterPause) update(dt); render(state === 'play' ? clamp(acc / DT, 0, 1) : 1); drawUi(); } catch (err){ console.error(err); }
  if (!window.__neonNoAutoQ && qStage < 2){
    if ((qWait -= raw) <= 0){ qAcc += raw; qN++; if (qN >= 90){ if (qAcc / qN > 1 / 42){ qStage++; if (qStage === 1) noBloom = true; else lowQ = true; } qAcc = 0; qN = 0; qWait = 1.5; } }
  }
  requestAnimationFrame(frame);
}
// ---------------------------------------------------------------- buttons
let rotDismissed = false;
function checkRotate(){ $('rotate').classList.toggle('on', isTouch && PORTRAIT && !rotDismissed && state !== 'title'); }
function onResize(){ checkRotate(); if (S) snapCam(); }
$('rotOk').onclick = () => { rotDismissed = true; checkRotate(); };
for (const id of ['fsBtn', 'fsTitle']) $(id).onclick = e => { e.stopPropagation(); fsAuto = false; Sfx.init(); Sfx.click(); toggleFs(); };
$('startBtn').onclick = () => { autoFs(); Sfx.init(); Sfx.click(); let i = 0; while (i < NLV - 1 && store.cleared[i]) i++; startLevel(i); };
$('stagesBtn').onclick = () => { autoFs(); Sfx.init(); Sfx.click(); openSelect(); };
$('selBack').onclick = () => { Sfx.click(); goTitle(); };
$('pauseBtn').onclick = () => { Sfx.click(); pauseGame(); };
$('muteBtn').onclick = () => { Sfx.init(); Sfx.setMuted(!Sfx.muted); };
$('resumeBtn').onclick = () => { Sfx.click(); resumeGame(); };
$('retryBtn').onclick = () => { Sfx.click(); startLevel(curLv); };
$('quitBtn').onclick = () => { Sfx.click(); openSelect(); };
$('rStages').onclick = () => { Sfx.click(); openSelect(); };
$('eStages').onclick = () => { Sfx.click(); openSelect(); };
$('eTitle').onclick = () => { Sfx.click(); goTitle(); };
$('rNext').onclick = () => { Sfx.click(); if (curLv < NLV - 1) startLevel(curLv + 1); else goTitle(); };
for (const b of document.querySelectorAll('button')) b.addEventListener('pointerdown', () => Sfx.init());
resize();
Sfx.want = 5;
document.querySelectorAll('[data-vol]').forEach(el => {
  const k = el.dataset.vol; el.value = Math.round(store[k] * 100);
  el.addEventListener('input', () => { Sfx.init(); Sfx.setVol(k, el.value / 100); document.querySelectorAll(`[data-vol="${k}"]`).forEach(o => { if (o !== el) o.value = el.value; }); });
});
// test hook: render music offline (same synth + output chain as the game) and return level stats / PCM
window.__SynthProto = Synthwave.prototype; window.__ronin = { drawBot, botPose, drawRoninHead }; window.__bossArt = { drawBossArt, drawBossIcon, bossDummy, BOSS_INFO };
window.__blasterAudio = {
  stinger(type){ Sfx.stinger(type); },
  stopMusic(){ Sfx.stop(); },
  names: MUSIC.map(m => m.name).concat(Object.keys(JINGLES)),
  async render(id, secs, fromSection, wantPcm){
    const sr = 44100, oac = new OfflineAudioContext(2, Math.ceil(sr * secs), sr), o = buildOut(oac);
    o.music.gain.value = MUSIC_BASE * 0.8 * (window.__previewGain || 1);
    const syn = new Synthwave(oac, o.music), tr = typeof id === 'number' ? MUSIC[id] : JINGLES[id];
    syn.setTrack(tr, 0.05, fromSection ? { si: fromSection, bar: 0 } : null);
    // schedule in 0.5 s chunks, like the live lookahead scheduler (keeps the live node count realistic)
    let schedMs = 0; const chunk = 0.5;
    const sched = t => { const t0 = performance.now(); syn.tick(t + 0.7); schedMs += performance.now() - t0; };
    sched(0); for (let t = chunk; t < secs - 0.01; t += chunk){ const tt = t; oac.suspend(tt).then(() => { sched(tt); oac.resume(); }); }
    const tR = performance.now(); const buf = await oac.startRendering(); const renderMs = performance.now() - tR; const L = buf.getChannelData(0), R = buf.getChannelData(1);
    let peak = 0, sum = 0, n = L.length, silentWin = 0, wins = 0;
    for (let i = 0; i < n; i++){ const a = Math.abs(L[i]), b = Math.abs(R[i]); if (a > peak) peak = a; if (b > peak) peak = b; sum += L[i] * L[i] + R[i] * R[i]; }
    for (let w = 0; w + sr * 0.5 <= n; w += sr * 0.5){ let ss = 0; for (let i = w; i < w + sr * 0.5; i += 4) ss += L[i] * L[i]; wins++; if (Math.sqrt(ss / (sr * 0.125)) < 0.003) silentWin++; }
    const out = { name: tr.name, secs, renderMs, peak, rms: Math.sqrt(sum / (2 * n)), silentWin, wins, schedMs, renderBars: syn.si };
    if (wantPcm){ const pcm = new Int16Array(n * 2); for (let i = 0; i < n; i++){ pcm[2 * i] = Math.max(-1, Math.min(1, L[i])) * 32767; pcm[2 * i + 1] = Math.max(-1, Math.min(1, R[i])) * 32767; }
      const u8 = new Uint8Array(pcm.buffer); let bin = ''; for (let i = 0; i < u8.length; i += 0x8000) bin += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); out.pcm = btoa(bin); }
    return out;
  },
  async renderSfx(calls){   // peak level of each sound effect through the game's sfx chain
    const res = {};
    for (const c of calls){
      const sr = 44100, oac = new OfflineAudioContext(2, sr * 2, sr), o = buildOut(oac);
      const comp = oac.createDynamicsCompressor(); comp.threshold.value = -12; comp.ratio.value = 3; comp.connect(o.master);
      const sg = oac.createGain(); sg.gain.value = SFX_BASE * 0.9; sg.connect(comp);
      const keep = [Sfx.ac, Sfx.sfx]; Sfx.ac = oac; Sfx.sfx = sg; if (!Sfx.noiseBuf){ const nb = oac.createBuffer(1, sr * 2, sr), d = nb.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; Sfx.noiseBuf = nb; }
      const [fn, ...args] = c; [Sfx.ac, Sfx.sfx] = keep;
      oac.suspend(0.5).then(() => { const k2 = [Sfx.ac, Sfx.sfx]; Sfx.ac = oac; Sfx.sfx = sg; Sfx[fn](...args); [Sfx.ac, Sfx.sfx] = k2; oac.resume(); });   // after the compressors settle
      const buf = await oac.startRendering(), L = buf.getChannelData(0); let pk = 0, ss = 0; for (let i = 0; i < L.length; i++){ pk = Math.max(pk, Math.abs(L[i])); }
      res[c.join(':')] = +pk.toFixed(3);
    }
    return res;
  },
  _suspendForTest(){ return Sfx.ac ? Sfx.ac.suspend() : null; },
  level(){   // RMS of what the master bus is outputting right now (test hook)
    if (!Sfx.ac) return 0; if (!Sfx._an){ Sfx._an = Sfx.ac.createAnalyser(); Sfx._an.fftSize = 2048; Sfx.master.connect(Sfx._an); }
    const d = new Float32Array(Sfx._an.fftSize); Sfx._an.getFloatTimeDomainData(d); let s = 0; for (const v of d) s += v * v; return Math.sqrt(s / d.length);
  },
  get unlock(){ return { ctx: Sfx.ac ? Sfx.ac.state : 'none', steps: Sfx.mus ? Sfx.mus.steps || 0 : 0, ahead: Sfx.mus && Sfx.ac ? +(Sfx.mus.nextT - Sfx.ac.currentTime).toFixed(3) : null, t: Sfx.ac ? Sfx.ac.currentTime : 0, track: Sfx.track, muted: Sfx.muted, musicVol: store.musicVol, musicGain: Sfx.music ? Sfx.music.gain.value : null, silentEl: Sfx.silentEl ? (Sfx.silentEl.paused ? 'paused' : 'playing') : 'none', session: navigator.audioSession ? navigator.audioSession.type : 'n/a', hint: document.getElementById('sndHint').classList.contains('on') }; },
  get state(){ return Sfx.ac ? { ctx: Sfx.ac.state, track: Sfx.track, jingling: Sfx.jingling, paused: Sfx.paused, musicVol: store.musicVol } : null; }
};
requestAnimationFrame(frame);
// ---------------------------------------------------------------- test hooks
window.__blaster = {
  get state(){ return state; }, get sim(){ return S; }, get V(){ return V; }, get backs(){ return Object.keys(BACKS); }, get view(){ return { VW, VH, SCALE, zoomed: ZOOMED, botScale: 0.58 }; },
  start(i, suits, tape){ startLevel(i, { suits, tape }); },
  get touch(){ return { held: { ...touchHeld }, touches: ttch.size, pointers: tptr.size, live: liveTouches }; },
  speed(x){ speed = x; }, hold(o){ testHold = o; }, swap(d){ pendSw = d; },
  select: openSelect, title: goTitle, quality(b, l){ noBloom = b; lowQ = l; },
  stepN(n, inp){ for (let k = 0; k < n; k++){ pv.x = S.p.x; pv.y = S.p.y; Sim.step(S, inp || {}); if (S.ev.length) handleEvents(S.ev); } updateCam(1); updateHud(); }
};
})();
