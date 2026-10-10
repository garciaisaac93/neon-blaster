// Stuck-touch regression tests: iPhone (WebKit) + Android-ish Chromium. Robot must stop every time.
const { webkit, chromium, devices } = require('playwright-core');
const path = require('path');
const URL = 'file://' + path.resolve(__dirname, '../index.html');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };

// in-page touch synthesiser: real TouchEvent when constructible, else an Event carrying touch lists
const INIT = () => {
  window.__tp = {};
  window.__touch = (type, pts, changedIds) => {
    const mk = ([id, x, y]) => { const target = document.elementFromPoint(x, y) || document.body;
      try { return new Touch({ identifier: id, target, clientX: x, clientY: y, pageX: x, pageY: y, screenX: x, screenY: y, radiusX: 8, radiusY: 8, force: 1 }); }
      catch (_){ return { identifier: id, target, clientX: x, clientY: y, pageX: x, pageY: y }; } };
    const all = pts.map(mk), changed = changedIds.map(id => { const p = pts.find(q => q[0] === id) || window.__tp[id]; return mk(p); });
    for (const p of pts) window.__tp[p[0]] = p;
    const tgt = changed[0] ? changed[0].target : document.body;
    let ev; try { ev = new TouchEvent(type, { bubbles: true, cancelable: true, touches: all, targetTouches: all, changedTouches: changed }); if (ev.touches.length !== all.length) throw 0; }
    catch (_){ ev = new Event(type, { bubbles: true, cancelable: true }); Object.defineProperty(ev, 'touches', { value: all }); Object.defineProperty(ev, 'changedTouches', { value: changed }); }
    tgt.dispatchEvent(ev); return ev.defaultPrevented;
  };
};

async function suite(name, browserType, opts){
  const browser = await browserType.launch(browserType === chromium ? { executablePath: '/usr/bin/google-chrome' } : {});
  const ctx = await browser.newContext(opts); const page = await ctx.newPage(); const errs = [];
  page.on('pageerror', e => errs.push(String(e))); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await page.addInitScript(INIT); await page.addInitScript(() => { window.__neonNoAutoQ = true; });
  await page.goto(URL); await sleep(900);
  const B = id => page.evaluate(id => { const r = document.getElementById(id).getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }, id);
  const st = () => page.evaluate(() => ({ x: window.__blaster.sim.p.x, y: window.__blaster.sim.p.y, ...window.__blaster.touch }));
  const T = (type, pts, ch) => page.evaluate(([t, p, c]) => window.__touch(t, p, c), [type, pts, ch]);
  const fresh = async () => { await page.evaluate(() => window.__blaster.start(0)); await sleep(700); };
  const moving = async ms => { const a = await st(); await sleep(ms); const b = await st(); return Math.abs(b.x - a.x); };
  // move buttons released + robot not running, while another (non-move) finger may legitimately still hold a button
  const moveStopped = async (label, still) => { await sleep(250); const d = await moving(400); const s = await st(); ok(d < 1.5 && !s.held.tL && !s.held.tR && s.held[still] === 1, `${name}: ${label} -> robot stopped, move released, ${still} still held (dx ${d.toFixed(2)}, held ${JSON.stringify(s.held)})`); };
  const stopped = async label => { await sleep(250); const d = await moving(400); const s = await st(); ok(d < 1.5 && !Object.values(s.held).some(Boolean), `${name}: ${label} -> robot stopped (dx ${d.toFixed(2)}, held ${JSON.stringify(s.held)})`); };
  await fresh();
  ok(await page.evaluate(() => document.body.classList.contains('touch') && getComputedStyle(document.getElementById('tR')).webkitTouchCallout !== 'default'), `${name}: touch UI on, callout disabled on buttons`);
  const css = await page.evaluate(() => { const c = getComputedStyle(document.getElementById('tR')); return [c.touchAction, c.userSelect || c.webkitUserSelect]; });
  ok(css[0] === 'none' && css[1] === 'none', `${name}: buttons touch-action/user-select none ${css}`);
  const R = await B('tR'), L = await B('tL'), A = await B('tA'), Bf = await B('tB'), D = await B('tD'), off = [R[0], R[1] - 160];

  // 1 long press 3s then release
  ok(await T('touchstart', [[1, ...R]], [1]), `${name}: touchstart on ▶ is preventDefault-ed (no callout/selection)`);
  await sleep(1000); ok(await moving(2000) > 40, `${name}: 3s long-press keeps running`);
  await T('touchend', [], [1]); await stopped('long press 3s + touchend');
  // 2 long press then touchcancel (iOS callout / system gesture)
  await T('touchstart', [[2, ...L]], [2]); await sleep(1500); ok(await moving(300) > 5, `${name}: ◀ hold moves`);
  await T('touchcancel', [], [2]); await stopped('long press + touchcancel');
  // 3 slide off the button while finger still down
  await T('touchstart', [[3, ...R]], [3]); await sleep(500); await T('touchmove', [[3, ...off]], [3]); await stopped('slide off ▶ (finger still down)');
  await T('touchmove', [[3, ...R]], [3]); await sleep(300); ok(await moving(300) > 5, `${name}: slide back onto ▶ resumes`);
  await T('touchend', [], [3]); await stopped('release after slide back');
  // 4 two-finger move + jump, both release orders
  await T('touchstart', [[4, ...R]], [4]); await T('touchstart', [[4, ...R], [5, ...A]], [5]); await sleep(500);
  { const s = await st(); ok(s.held.tR && s.held.tA, `${name}: two fingers hold ▶ + jump`); }
  await T('touchend', [[5, ...A]], [4]); await moveStopped('two-finger: release move first, jump finger still down', 'tA');
  await T('touchend', [], [5]); await stopped('two-finger: then release jump');
  await T('touchstart', [[6, ...R]], [6]); await T('touchstart', [[6, ...R], [7, ...A]], [7]); await sleep(400);
  await T('touchend', [[6, ...R]], [7]); await sleep(200); ok(await moving(300) > 5, `${name}: release jump first -> still running with ▶ held`);
  await T('touchend', [], [6]); await stopped('two-finger: release jump then move');
  // 5 contextmenu during hold
  await T('touchstart', [[8, ...R]], [8]); await sleep(1200);
  await page.evaluate(() => document.getElementById('tR').dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true })));
  await stopped('contextmenu during hold (touchend never arrives)');
  await T('touchend', [], [8]);
  // 6 touchend lost entirely; next touch event's list no longer contains the finger
  await T('touchstart', [[9, ...R]], [9]); await sleep(500);
  await T('touchstart', [[10, ...off]], [10]); await stopped('lost touchend: next touchstart list omits finger 9');
  await T('touchend', [], [10]);
  // 7 blur / visibility / pagehide
  for (const [lab, fn] of [['window blur', () => window.dispatchEvent(new Event('blur'))], ['pagehide', () => window.dispatchEvent(new Event('pagehide'))], ['orientationchange', () => window.dispatchEvent(new Event('orientationchange'))]]){
    await T('touchstart', [[11, ...R]], [11]); await sleep(400); await page.evaluate(fn); await stopped(lab); await T('touchend', [], [11]);
  }
  // 8 the other buttons: down / jump / shoot / suit long press + cancel
  for (const [id, P] of [['tD', D], ['tA', A], ['tB', Bf]]){
    await T('touchstart', [[12, ...P]], [12]); await sleep(1500); ok((await st()).held[id] === 1, `${name}: ${id} held during long press`);
    await T('touchcancel', [], [12]); await sleep(50); ok((await st()).held[id] === 0, `${name}: ${id} released on touchcancel`);
  }
  { const S2 = await B('tS'); await T('touchstart', [[13, ...S2]], [13]); await sleep(1500); await T('touchcancel', [], [13]); await sleep(50);
    ok(!(await page.evaluate(() => document.getElementById('tS').classList.contains('down'))), `${name}: suit button not stuck after long press + cancel`); }
  // 9 pause during hold
  await T('touchstart', [[14, ...R]], [14]); await sleep(300); await page.evaluate(() => { window.__blaster.sim && document.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyP' })); }); await sleep(100);
  await page.keyboard.press('KeyP'); await sleep(100); await page.keyboard.press('KeyP'); await sleep(100);
  await T('touchend', [], [14]); await stopped('pause/resume while holding then release');

  // 10 real input path (Chromium only): genuine CDP touches incl. touchCancel
  if (browserType === chromium){
    const cdp = await ctx.newCDPSession(page);
    await fresh();   // earlier scenarios may have walked the robot into a wall
    const tch = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map(([id, x, y]) => ({ x, y, id })) });
    await tch('touchStart', [[1, ...R]]); await sleep(200); ok(await moving(600) > 5, `${name}: CDP hold runs`);   // level 1 has a wall ~1.6 s to the right, so measure early
    await sleep(2200); ok((await st()).held.tR === 1, `${name}: CDP 3s hold keeps ▶ held`);
    await tch('touchEnd', []); await stopped('CDP long press + touchEnd');
    await tch('touchStart', [[1, ...R]]); await sleep(800); await tch('touchCancel', []); await stopped('CDP touchCancel');
    await tch('touchStart', [[1, ...R]]); await tch('touchStart', [[1, ...R], [2, ...A]]); await sleep(400); await tch('touchMove', [[1, ...off], [2, ...A]]); await moveStopped('CDP slide off while jumping (jump finger still down)', 'tA');
    await tch('touchEnd', []); await stopped('CDP release jump after slide off');
  } else {
    await page.touchscreen.tap(R[0], R[1]); await stopped('WebKit native tap on ▶');
  }
  ok(errs.length === 0, `${name}: no page errors ${errs.slice(0, 3).join(' | ')}`);
  await browser.close();
}
(async () => {
  await suite('iPhone/WebKit', webkit, { ...devices['iPhone 13'], viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true });
  await suite('Android/Chromium', chromium, { ...devices['Pixel 7'], viewport: { width: 915, height: 412 } });
  console.log(fails ? `${fails} FAILED` : 'ALL TOUCH TESTS PASSED'); process.exit(fails ? 1 : 0);
})();
