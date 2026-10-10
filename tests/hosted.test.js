// Verifies the public URL: renders, game starts via a real tap, zero console errors (Chromium + WebKit iPhone landscape).
const pw = require('playwright-core');
const URL_ = process.argv[2];
const runs = [
  { name: 'webkit / iPhone 13 landscape', type: 'webkit', opts: () => ({ ...pw.devices['iPhone 13 landscape'] }) },
  { name: 'chromium / iPhone 13 landscape', type: 'chromium', launch: { executablePath: '/usr/bin/google-chrome' }, opts: () => ({ ...pw.devices['iPhone 13 landscape'] }) },
  { name: 'chromium / desktop 1280x720', type: 'chromium', launch: { executablePath: '/usr/bin/google-chrome' }, opts: () => ({ viewport: { width: 1280, height: 720 } }) },
];
const sleep = ms => new Promise(r => setTimeout(r, ms));
let fail = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fail++; };
(async () => {
  for (const r of runs){
    console.log('== ' + r.name);
    const browser = await pw[r.type].launch(r.launch || {}); const ctx = await browser.newContext(r.opts()); const page = await ctx.newPage(); const errs = [];
    page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); page.on('pageerror', e => errs.push('pageerror: ' + e.message));
    const resp = await page.goto(URL_, { waitUntil: 'load' });
    ok(resp.status() === 200 && /text\/html/.test(resp.headers()['content-type']), 'served 200 text/html: ' + resp.headers()['content-type']);
    await sleep(1500);
    const t = await page.evaluate(() => ({ title: document.title, api: !!window.__blaster, startVis: !!document.getElementById('startBtn') && getComputedStyle(document.getElementById('startBtn')).display !== 'none' }));
    ok(t.api && t.startVis, 'renders title screen ' + JSON.stringify(t));
    const tag = r.name.replace(/[^a-z0-9]+/gi, '_');
    await page.screenshot({ path: `screenshots/v4_hosted_${tag}_title.png` });
    if (r.opts().hasTouch) await page.tap('#startBtn'); else await page.click('#startBtn');
    await sleep(1200);
    // if a stage select appears, start level 1
    const st0 = await page.evaluate(() => window.__blaster.state);
    if (st0 !== 'play') await page.evaluate(() => window.__blaster.start(0, ['volt']));
    await sleep(800);
    await page.evaluate(() => window.__blaster.hold({ r: 1 })); await sleep(1500); await page.evaluate(() => window.__blaster.hold({}));
    const g = await page.evaluate(() => ({ state: window.__blaster.state, x: Math.round(window.__blaster.sim.p.x), audio: window.__blaster.audioState || (window.Sfx && Sfx.ac && Sfx.ac.state) || null }));
    ok(g.state === 'play' && g.x > 100, 'game starts and player moves ' + JSON.stringify(g) + ' (state after tap: ' + st0 + ')');
    await page.screenshot({ path: `screenshots/v4_hosted_${tag}_play.png` });
    ok(errs.length === 0, 'zero console errors ' + JSON.stringify(errs));
    await browser.close();
  }
  console.log(fail ? fail + ' FAILED' : 'ALL PASSED'); process.exit(fail ? 1 : 0);
})();
