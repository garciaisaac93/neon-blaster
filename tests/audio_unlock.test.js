// Verifies audio unlocks from a real tap on mobile emulation in Chromium and WebKit (iPhone descriptor), from a file:// URL.
const pw = require('playwright-core'); const path = require('path');
const URL = 'file://' + path.resolve(__dirname, '../index.html');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const runs = [
  { name: 'webkit / iPhone 13 (Mobile Safari emulation)', type: 'webkit', opts: () => ({ ...pw.devices['iPhone 13 landscape'] }) },
  { name: 'chromium / Pixel 7 (default autoplay policy)', type: 'chromium', launch: { executablePath: '/usr/bin/google-chrome' }, opts: () => ({ ...pw.devices['Pixel 7 landscape'] }) },
  { name: 'chromium / desktop (default autoplay policy)', type: 'chromium', launch: { executablePath: '/usr/bin/google-chrome' }, opts: () => ({ viewport: { width: 1280, height: 720 } }), desktop: true }
];
(async () => {
  for (const r of runs){
    console.log('== ' + r.name);
    const browser = await pw[r.type].launch(r.launch || {}); const ctx = await browser.newContext(r.opts()); const page = await ctx.newPage(); const errs = [];
    page.on('pageerror', e => errs.push(String(e))); page.on('console', m => m.type() === 'error' && errs.push(m.text()));
    await page.addInitScript(() => { localStorage.setItem('neonBlaster.v1', JSON.stringify({ musicVol: 0, sfxVol: 0, muted: true })); });   // worst-case saved settings
    await page.goto(URL); await sleep(800);
    const U = () => page.evaluate(() => window.__blasterAudio.unlock);
    const before = await U();
    ok(before.ctx === 'none' && before.hint && await page.isVisible('#sndHint'), 'before any gesture: no context yet, "TAP TO ENABLE SOUND" hint visible ' + JSON.stringify({ ctx: before.ctx, hint: before.hint }));
    { const bb = await page.locator('#sndHint').boundingBox(); if (r.desktop) await page.mouse.click(bb.x + bb.width / 2, bb.y + bb.height / 2); else await page.touchscreen.tap(bb.x + bb.width / 2, bb.y + bb.height / 2); }
    await sleep(700);
    const a = await U(); await sleep(500); const b = await U(); const lvl = await page.evaluate(() => window.__blasterAudio.level()); await sleep(300); const lvl2 = await page.evaluate(() => window.__blasterAudio.level());
    console.log('   after tap: ' + JSON.stringify(b) + ' level=' + Math.max(lvl, lvl2).toFixed(4));
    ok(b.ctx === 'running', 'tap -> AudioContext running');
    ok(b.track === 5 && b.steps > a.steps && b.steps >= 6 && b.ahead > 0, `title music scheduled and advancing (steps ${a.steps} -> ${b.steps}, ${b.ahead}s ahead)`);
    ok(!b.muted && b.musicVol >= 0.05 && b.musicGain > 0.01, `not muted, saved volume 0 reset to default (musicVol ${b.musicVol}, gain ${b.musicGain && b.musicGain.toFixed(3)})`);
    ok(Math.max(lvl, lvl2) > 0.003, 'master bus is producing signal (RMS ' + Math.max(lvl, lvl2).toFixed(4) + ')');
    ok(!b.hint && !(await page.isVisible('#sndHint')), 'hint hidden once sound runs');
    if (!r.desktop) ok(b.silentEl === 'playing', 'silent <audio> keep-alive playing (iOS ringer-switch workaround): ' + b.silentEl + ', audioSession=' + b.session);
    // context gets suspended/interrupted (e.g. phone call, app switch): next gesture resumes it
    await page.evaluate(() => window.__blasterAudio && window.__blaster && null);
    await page.evaluate(async () => { await window.__blasterAudio._suspendForTest(); });
    const c = await U();
    { const bb = await page.locator('#startBtn').boundingBox(); if (r.desktop) await page.mouse.click(bb.x + bb.width / 2, bb.y + bb.height / 2); else await page.touchscreen.tap(bb.x + bb.width / 2, bb.y + bb.height / 2); }
    await sleep(800); const d = await U();
    ok(c.ctx === 'suspended' && d.ctx === 'running' && d.track === 0, `suspended context resumes on next tap and stage music starts (${c.ctx} -> ${d.ctx}, track ${d.track})`);
    { await page.evaluate(() => window.__blasterAudio.stopMusic()); await sleep(1200); const base = +(await page.evaluate(() => window.__blasterAudio.level())).toFixed(4); const lv = {}; for (const ty of ['oni', 'kite', 'shogun', 'dragon']){ await page.evaluate(() => window.__blasterAudio.setVolForTest && 0); await page.evaluate(t => window.__blasterAudio.stinger(t), ty); let pk = 0; for (let k = 0; k < 16; k++){ await sleep(100); pk = Math.max(pk, await page.evaluate(() => window.__blasterAudio.level())); } lv[ty] = +pk.toFixed(4); await sleep(600); }
      ok(Object.values(lv).every(v => v > 0.01 && v > base + 0.005), 'per-boss intro stingers clearly audible (music stopped, residual RMS ' + base + '; oni/kite/shogun/dragon RMS ' + JSON.stringify(lv) + ')'); }
    ok(errs.length === 0, 'zero console errors ' + JSON.stringify(errs));
    await browser.close();
  }
  console.log(fails ? `\n${fails} FAILED` : '\nALL PASSED'); process.exit(fails ? 1 : 0);
})();
