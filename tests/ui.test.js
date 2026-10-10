// Headless Chromium test: console errors, tape replays (all levels), hover/shoot/charge/suit checks, screenshots.
const { chromium } = require('playwright-core');
const path = require('path'), fs = require('fs');
const URL = 'file://' + path.resolve(__dirname, '../index.html');
const SHOTS = path.resolve(__dirname, '../screenshots'); fs.mkdirSync(SHOTS, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const ALL = ['volt', 'blaze', 'frost', 'spark', 'aegis'];
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const tape = n => JSON.parse(fs.readFileSync(path.join(__dirname, 'tapes', `level${n}.json`)));

async function newPage(browser, opts){
  const ctx = await browser.newContext(opts); const page = await ctx.newPage(); const errs = [];
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  page.on('pageerror', e => errs.push(String(e)));
  await page.addInitScript(() => { window.__neonNoAutoQ = true; window.__fsCalls = 0; window.__lockCalls = 0;
    const rf = Element.prototype.requestFullscreen; if (rf) Element.prototype.requestFullscreen = function(o){ window.__fsCalls++; return rf.call(this, o); };
    if (screen.orientation && screen.orientation.lock){ const lk = screen.orientation.lock.bind(screen.orientation); screen.orientation.lock = o => { window.__lockCalls++; return lk(o); }; } });
  await page.goto(URL); await sleep(900); return { page, errs, ctx };
}
// pause the game the moment `cond` (evaluated in page with s = sim state) becomes true
async function pauseWhen(page, cond, timeout = 60000){
  await page.waitForFunction(c => { const s = window.__blaster.sim; if (!s) return false;
    let r = new Function('s', 'return (' + c + ')')(s); if (typeof r === 'function') r = r(s); if (r) window.__blasterPause = true; return r; }, cond.toString(), { polling: 'raf', timeout });
}
const inked = (page, id) => page.evaluate(id => { const c = document.getElementById(id); if (!c || !c.width) return 0; const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 40) n++; return n / (c.width * c.height); }, id);
const resume = page => page.evaluate(() => { window.__blasterPause = false; });
const shot = async (page, name) => { await sleep(120); await page.screenshot({ path: path.join(SHOTS, 'v5_' + name) }); console.log('  shot ' + name); };

(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--autoplay-policy=no-user-gesture-required'] });
  // ---------- desktop ----------
  {
    const { page, errs, ctx } = await newPage(browser, { viewport: { width: 1280, height: 720 } });
    await page.evaluate(() => localStorage.clear()); await page.reload(); await sleep(900);
    await shot(page, '01_title.png');
    ok(await page.evaluate(() => typeof window.__ronin.drawBot === 'function' && window.__blaster.backs.join() === 'street,roof'), 'Ronin renderer + both Tokyo backdrops loaded');
    { const ttl = await page.evaluate(() => document.title); ok(/ronin/i.test(ttl), 'title mentions the Ronin Mech: ' + ttl); }
    // start via keyboard / button
    await page.click('#startBtn'); await sleep(500);
    ok(await page.evaluate(() => window.__blaster.state === 'play'), 'START begins level 1');
    {
      const au = await page.evaluate(() => window.__blasterAudio.state);
      ok(au && au.ctx === 'running' && au.track === 0, 'audio starts after first input and plays the Neon Street track ' + JSON.stringify(au));
    }
    { const v = await page.evaluate(() => window.__blaster.view), r = v.SCALE * v.botScale / (720 / 540 * 0.55); ok(v.zoomed && r >= 1.45, `desktop: Ronin drawn ${r.toFixed(2)}x bigger on screen than v3 (world view ${v.VW.toFixed(0)}x${v.VH.toFixed(0)})`); }
    await sleep(300); { const k = await inked(page, 'suitIcon'); ok(k > 0.15, 'HUD suit chip shows the Ronin helmet (ink ' + k.toFixed(2) + ')'); }
    // ---- real keyboard controls: run, jump, hover, shoot, charge
    await page.keyboard.down('ArrowRight'); await sleep(500); await page.keyboard.up('ArrowRight');
    const x1 = await page.evaluate(() => window.__blaster.sim.p.x); ok(x1 > 120, 'arrow keys move robot (x=' + x1.toFixed(0) + ')');
    await page.keyboard.down('Space'); await sleep(450);
    const hv = await page.evaluate(() => { const p = window.__blaster.sim.p; return { hover: p.hover, vy: p.vy, fuel: p.fuel }; });
    ok(hv.hover && hv.vy < 120 && hv.fuel < 1, 'holding jump in air hovers (vy=' + hv.vy.toFixed(0) + ', fuel=' + hv.fuel.toFixed(2) + ')');
    await page.keyboard.down('KeyX'); await sleep(60); await page.keyboard.up('KeyX'); await sleep(30);
    const n1 = await page.evaluate(() => window.__blaster.sim.shots.filter(b => !b.foe).length); ok(n1 >= 1, 'tap X fires while hovering (' + n1 + ' shot)');
    await page.keyboard.up('Space'); await sleep(900);
    ok(await page.evaluate(() => window.__blaster.sim.p.fuel > 0.95), 'fuel refills on landing');
    await page.keyboard.down('KeyX'); await sleep(1200);
    const ch = await page.evaluate(() => window.__blaster.sim.p.charge); ok(ch >= 1.0, 'holding X charges (' + ch.toFixed(2) + 's)');
    await page.keyboard.up('KeyX'); await sleep(40);
    const big = await page.evaluate(() => window.__blaster.sim.shots.some(b => !b.foe && b.big)); ok(big, 'release fires a full charged shot');
    // ---- suit switching via keys
    await page.evaluate(() => { const s = window.__blaster.sim; s.suits = ['volt', 'blaze', 'frost', 'spark', 'aegis']; });
    const suitSeq = [];
    for (const k of ['KeyE', 'KeyE', 'KeyQ', 'Digit4', 'Digit5', 'Digit1']){ await page.keyboard.press(k); await sleep(80); suitSeq.push(await page.evaluate(() => window.__blaster.sim.p.suit)); }
    ok(suitSeq.join() === 'blaze,frost,blaze,spark,aegis,volt', 'Q/E/1-5 switch suits: ' + suitSeq.join(' > '));
    const hudName = await page.textContent('#suitName'); ok(/volt/i.test(hudName), 'HUD shows current suit (' + hudName + ')');
    // each suit fires its own shot type
    const kinds = {};
    for (let i = 0; i < 5; i++){
      await page.keyboard.press('Digit' + (i + 1)); await sleep(60);
      await page.evaluate(() => { window.__blaster.sim.shots = window.__blaster.sim.shots.filter(b => b.foe); });
      await page.keyboard.press('KeyX'); await sleep(50);
      kinds[ALL[i]] = await page.evaluate(() => [...new Set(window.__blaster.sim.shots.filter(b => !b.foe).map(b => b.disc ? 'disc' : b.home ? 'homing' : b.freeze ? 'ice' : b.fire ? 'fire' : 'pellet'))].join('+'));
    }
    ok(new Set(Object.values(kinds)).size === 5, 'each suit has a distinct shot: ' + JSON.stringify(kinds));
    // pause/mute
    await page.keyboard.press('KeyP'); await sleep(150); ok(await page.evaluate(() => window.__blaster.state === 'pause'), 'P pauses');
    await sleep(150); ok(await page.evaluate(() => window.__blasterAudio.state.ctx) === 'suspended', 'music pauses with the game');
    await page.keyboard.press('KeyP'); await sleep(150); ok(await page.evaluate(() => window.__blaster.state === 'play'), 'P resumes');
    await sleep(150); ok(await page.evaluate(() => window.__blasterAudio.state.ctx) === 'running', 'music resumes');

    // ---- suit showcase screenshots (level 1 enemy cluster, all suits)
    const showcase = async (suit, file, setup, holdMs, charge) => {
      await page.evaluate(([suit, setup]) => { const b = window.__blaster; b.start(0, ['volt', 'blaze', 'frost', 'spark', 'aegis']); const s = b.sim;
        s.p.suit = suit; b.V.bannerT = 0; new Function('s', setup)(s); s.cut = null; }, [suit, setup]);
      await sleep(400);
      if (charge){ await page.evaluate(() => window.__blaster.hold({ f: 1 })); await sleep(1150); await page.evaluate(() => window.__blaster.hold({})); await sleep(holdMs); }
      else { await page.evaluate(() => window.__blaster.hold({ f: 1 })); await sleep(holdMs); }
      await page.evaluate(() => { window.__blasterPause = true; }); await shot(page, file); await resume(page); await page.evaluate(() => window.__blaster.hold({}));
    };
    const at = c => `s.p.x = ${c} * 32; s.p.y = 14 * 32 - 50 - 1; s.p.vy = 0; s.p.face = 1; s.enemies.forEach(e => e.awake = 1);`;
    await showcase('volt', '03_suit_volt.png', at(74), 120, true);
    await showcase('blaze', '04_suit_blaze.png', at(76), 260, false);
    await showcase('frost', '05_suit_frost.png', at(76), 700, false);
    await showcase('spark', '06_suit_spark.png', at(77), 80, true);
    await showcase('aegis', '07_suit_aegis.png', at(76), 400, false);

    // ---- full tape replays: every level reaches the goal in the real page
    const stats = {};
    for (let n = 1; n <= 4; n++){
      const t = tape(n);
      await page.evaluate(([i, t]) => { window.__blaster.start(i, t.suits, t.tape); window.__blaster.speed(3); }, [n - 1, t]);
      const hasBoss = await page.evaluate(() => !!window.__blaster.sim.boss);
      if (n === 1){ // hover + shooting moment
        await pauseWhen(page, 's => s.p.hover && s.p.y < 300 && s.shots.some(b => !b.foe) && s.p.x > 1300', 60000).catch(() => console.log('  (no hover-shot moment found)'));
        await page.evaluate(() => window.__blaster.speed(0.0001)); await resume(page); await sleep(150); await page.evaluate(() => { window.__blasterPause = true; });
        await shot(page, '02_hover_shoot.png'); await resume(page); await page.evaluate(() => window.__blaster.speed(3));
      }
      if (n >= 2){ // Tokyo backdrop moments
        const cond = { 2: 's => s.p.x > 1500 && s.p.onGround', 3: 's => s.time > 5 && s.p.onGround', 4: 's => s.p.x > 1400 && s.p.onGround' }[n];
        await pauseWhen(page, cond, 60000).catch(() => console.log('  (no scenic moment for ' + n + ')'));
        await page.evaluate(() => window.__blaster.speed(1)); await resume(page); await sleep(60); await page.evaluate(() => { window.__blasterPause = true; });
        await shot(page, `08_tokyo_L${n}_${['', 'rooftop', 'elevator', 'subway'][n - 1]}.png`); await resume(page); await page.evaluate(() => window.__blaster.speed(3));
      }
      const btype = ['oni', 'kite', 'shogun', 'dragon'][n - 1];
      const suitCard = async () => {
        await pauseWhen(page, 's => s.cut && s.cut.k === "suit" && s.cut.t < 2.2', 90000);
        await sleep(30); await page.evaluate(() => window.__blaster.speed(1)); await resume(page); await sleep(500); await page.evaluate(() => { window.__blasterPause = true; });
        if (n === 1) ok(await page.evaluate(() => window.__blasterAudio.state.jingling), 'suit-unlock jingle plays');
        { const k = await inked(page, 'scBot'); ok(k > 0.05, `suit card L${n} draws the newly coloured Ronin (ink ${k.toFixed(2)})`); }
        await shot(page, `12_suit_unlock_L${n}.png`); await resume(page); await page.evaluate(() => window.__blaster.speed(3));
      };
      if (n === 3) await suitCard();   // AEGIS capsule sits mid-climb, before the boss
      if (hasBoss){
        // intro title card
        await pauseWhen(page, 's => s.cut && s.cut.k === "boss" && s.cut.t < 1.7', 120000);
        await page.evaluate(() => window.__blaster.speed(1)); await resume(page); await sleep(250); await page.evaluate(() => { window.__blasterPause = true; });
        { const b = await page.evaluate(() => ({ type: window.__blaster.sim.boss.type, name: window.__blaster.sim.boss.name })); ok(b.type === btype, `level ${n} boss is ${b.name} (${b.type})`); }
        await shot(page, `10a_intro_L${n}_${btype}.png`); await resume(page); await page.evaluate(() => window.__blaster.speed(3));
        // mid-fight
        const mid = { oni: 's => s.boss.ph === "slam" || s.boss.ph === "swing" || s.boss.ph === "charge"', kite: 's => s.boss.ph === "shurikenT" || s.boss.ph === "diveT" || s.ebul.some(e => e.k === "shuriken")', shogun: 's => s.boss.ph === "laser" || s.boss.open > 0', dragon: 's => s.boss.ph === "rush" || s.boss.ph === "hornT"' }[btype];
        await pauseWhen(page, `s => s.boss && s.arena.on && !s.cut && s.boss.hp < s.boss.max * 0.9 && (${mid})(s)`, 90000).catch(() => pauseWhen(page, 's => s.boss && s.arena.on && !s.cut && s.boss.hp < s.boss.max * 0.8', 90000));
        await page.evaluate(() => window.__blaster.speed(1)); await resume(page); await sleep(70); await page.evaluate(() => { window.__blasterPause = true; });
        await shot(page, `10_boss_L${n}_${btype}.png`); await resume(page); await page.evaluate(() => window.__blaster.speed(3));
        if (n === 4){ // final boss phase 2: dragon form
          await pauseWhen(page, 's => s.boss && s.boss.form === "dragon" && !s.cut && s.boss.ph !== "morph" && (s.boss.ph === "fire" || s.ebul.some(e => e.k === "fire" || e.k === "debris"))', 90000).catch(() => console.log('  (no dragon fire moment)'));
          await page.evaluate(() => window.__blaster.speed(1)); await resume(page); await sleep(70); await page.evaluate(() => { window.__blasterPause = true; });
          ok(await page.evaluate(() => window.__blaster.sim.boss.form === 'dragon'), 'final boss transforms into the dragon (phase 2)');
          await shot(page, '10b_boss_L4_dragon_phase2.png'); await resume(page); await page.evaluate(() => window.__blaster.speed(3));
        }
      }
      if (n === 1 || n === 2) await suitCard();
      await page.waitForFunction(() => window.__blaster.state === 'result', null, { timeout: 120000 }).catch(() => {});
      const r = await page.evaluate(() => { const s = window.__blaster.sim; return { state: window.__blaster.state, done: s.done, boss: s.boss ? s.boss.hp <= 0 : null, suits: s.suits.join(','), hoverF: s.stats && s.stats.hoverF, t: s.time }; });
      stats[n] = r;
      ok(r.state === 'result' && r.done, `level ${n} completed via replay in browser (t=${r.t.toFixed(1)}s, boss beaten=${r.boss}, suits=${r.suits})`);
      if (hasBoss) ok(r.boss === true, `level ${n} boss defeated`);
      if (n === 4){ await sleep(1200); const v = await page.evaluate(() => document.getElementById('ending').classList.contains('on') && /CITY IS SAFE/.test(document.getElementById('ending').textContent)); const k = await inked(page, 'eCv'); ok(v && k > 0.5, 'victory screen: THE CITY IS SAFE + celebrating Ronin (ink ' + k.toFixed(2) + ')'); await shot(page, '13_victory.png'); }
      if (n === 3){ await sleep(300); const k = await inked(page, 'rBot'); ok(k > 0.05, 'result screen shows the celebrating Ronin (ink ' + k.toFixed(2) + ')'); await shot(page, '13_result.png'); }
    }
    await page.evaluate(() => window.__blaster.select()); await sleep(600);
    await shot(page, '09_stage_select.png');
    { const k = await inked(page, 'selBots'); ok(k > 0.05, 'stage select shows the Ronin suit line-up (ink ' + k.toFixed(2) + ')'); }
    { const b = await page.evaluate(() => ({ n: document.querySelectorAll('canvas.bicon').length, names: [...document.querySelectorAll('.stage .boss')].map(e => e.textContent).join(' | '), ink: [...document.querySelectorAll('canvas.bicon')].map(c => { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let k = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 40) k++; return +(k / (c.width * c.height)).toFixed(2); }) }));
      ok(b.n === 4 && b.ink.every(v => v > 0.03) && /ONI ENFORCER/.test(b.names) && /KITE NINJA DRONE/.test(b.names) && /SECURITY SHOGUN TURRET/.test(b.names) && /SHINKANSEN DRAGON/.test(b.names) && !/MOPBOT|JELLY|TRAM/.test(b.names), 'stage select shows new boss names + icons ' + JSON.stringify(b)); }
    // big suit line-up render (all colourways, several poses)
    await page.evaluate(() => {
      const c = document.createElement('canvas'), d = 2; c.id = 'lineup'; c.width = 1280 * d; c.height = 720 * d; c.style.cssText = 'position:fixed;inset:0;width:1280px;height:720px;z-index:99'; document.body.appendChild(c);
      const g = c.getContext('2d'); g.scale(d, d); const bg = g.createLinearGradient(0, 0, 0, 720); bg.addColorStop(0, '#0b0826'); bg.addColorStop(1, '#22103e'); g.fillStyle = bg; g.fillRect(0, 0, 1280, 720);
      const R = window.__ronin, suits = ['ronin', 'volt', 'blaze', 'frost', 'spark', 'aegis'], modes = ['idle', 'hover', 'run', 'idle', 'jump', 'cheer'];
      g.font = 'italic 900 34px Arial'; g.fillStyle = '#fff'; g.textAlign = 'center'; g.shadowColor = '#ff4fd8'; g.shadowBlur = 18; g.fillText('RONIN MECH · SUIT LINE-UP', 640, 70); g.shadowBlur = 0;
      g.font = 'bold 16px monospace';
      suits.forEach((s, i) => { const x = 120 + i * 208; R.drawBot(g, x, 470, R.botPose(modes[i], 1.3 + i * 0.4, { phase: 1 + i, hop: 0.4 }), { suit: s, scale: 2.0, face: 1, aim: i % 2 === 0, charge: i === 0 ? 0.9 : 0.3, thrust: modes[i] === 'hover' ? 0.8 : 0 });
        g.fillStyle = '#fff'; g.fillText(s.toUpperCase(), x, 540); });
      suits.forEach((s, i) => R.drawBot(g, 120 + i * 208, 680, R.botPose(['run', 'hover', 'jump', 'hurt', 'fall', 'idle'][i], 2, { phase: 2 }), { suit: s, scale: 0.55, face: 1, aim: true, thrust: i === 1 ? 0.8 : 0 }));
      g.fillStyle = '#bfb6e6'; g.font = '12px monospace'; g.fillText('in-game scale ↓', 640, 600);
    });
    await shot(page, '11_suit_lineup.png');
    await page.evaluate(() => document.getElementById('lineup').remove());
    // death / defeat animation frame
    await page.evaluate(() => { const b = window.__blaster; b.start(0, ['volt']); b.sim.p.x = 20 * 32; b.V.bannerT = 0; b.sim.cut = null; }); await sleep(500);
    await page.evaluate(() => { const s = window.__blaster.sim; s.p.hp = 0; s.p.dead = 1.5; window.__blaster.V.deadT = 0; }); await sleep(450);
    { const st = await page.evaluate(() => ({ dead: window.__blaster.sim.p.dead, deadT: window.__blaster.V.deadT })); ok(st.dead > 0 && st.deadT > 0.2, 'defeat animation plays (deadT ' + st.deadT.toFixed(2) + ')'); }
    await page.evaluate(() => { window.__blasterPause = true; }); await shot(page, '18_defeat.png'); await resume(page);
    ok(await page.evaluate(() => document.querySelectorAll('#stages .stage.clear').length) === 4, 'stage select shows 4 cleared stages');
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('neonBlaster.v1')));
    ok(saved && saved.suits.length === 5 && Object.keys(saved.cleared).length === 4, 'progress saved to localStorage: ' + JSON.stringify(saved));
    ok(errs.length === 0, 'desktop: zero console errors ' + JSON.stringify(errs));
    await ctx.close();
  }
  // ---------- phone landscape ----------
  {
    const { page, errs, ctx } = await newPage(browser, { viewport: { width: 844, height: 390 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    await shot(page, '14_phone_title.png');
    { const m = await page.evaluate(() => ({ vp: document.querySelector('meta[name=viewport]').content, apple: !!document.querySelector('meta[name="apple-mobile-web-app-capable"][content=yes]'), ob: getComputedStyle(document.body).overscrollBehavior, fsBtn: !!document.getElementById('fsTitle') }));
      ok(/viewport-fit=cover/.test(m.vp) && /user-scalable=no/.test(m.vp) && m.apple && m.ob === 'none' && m.fsBtn, 'phone: viewport-fit=cover, no zoom, apple-mobile-web-app-capable, no overscroll, fullscreen button ' + JSON.stringify(m)); }
    await page.tap('#startBtn'); await sleep(500);
    { const f = await page.evaluate(() => ({ fs: window.__fsCalls, lock: window.__lockCalls })); ok(f.fs >= 1 && f.lock >= 1, 'phone: first tap requests fullscreen + landscape lock ' + JSON.stringify(f)); }
    ok(await page.isVisible('#fsBtn'), 'phone: fullscreen toggle in HUD');
    { const v = await page.evaluate(() => window.__blaster.view), r = v.SCALE * v.botScale / (390 / 540 * 0.55); ok(v.zoomed && r >= 1.45, `phone: Ronin drawn ${r.toFixed(2)}x bigger on screen than v3 (world view ${v.VW.toFixed(0)}x${v.VH.toFixed(0)})`); }
    { const sa = await page.evaluate(() => getComputedStyle(document.getElementById('tA')).right); ok(parseFloat(sa) >= 18, 'phone: touch buttons inset from edges (safe-area aware): right=' + sa); }
    ok(await page.isVisible('#touch'), 'phone: touch controls visible');
    const box = async id => { const b = await page.locator(id).boundingBox(); return [b.x + b.width / 2, b.y + b.height / 2]; };
    const cdp = await ctx.newCDPSession(page);
    const touch = async (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map(([x, y], i) => ({ x, y, id: i })) });
    const R = await box('#tR'), A = await box('#tA'), B = await box('#tB'), Sw = await box('#tS');
    await touch('touchStart', [R]); await sleep(600);
    await touch('touchMove', [R, A]); await sleep(500);
    const ph = await page.evaluate(() => { const p = window.__blaster.sim.p; return { x: p.x, hover: p.hover }; });
    ok(ph.x > 150 && ph.hover, 'phone: touch d-pad runs and held jump hovers ' + JSON.stringify(ph));
    await touch('touchMove', [R, A, B]); await sleep(80);
    ok(await page.evaluate(() => window.__blaster.sim.shots.some(b => !b.foe)), 'phone: touch shoot fires');
    await touch('touchMove', [R, A]); await sleep(60);
    await shot(page, '15_phone_play.png');
    await touch('touchEnd', []); await sleep(300);
    await page.evaluate(() => { window.__blaster.sim.suits = ['volt', 'blaze']; });
    await page.touchscreen.tap(Sw[0], Sw[1]); await sleep(120);
    ok(await page.evaluate(() => window.__blaster.sim.p.suit) === 'blaze', 'phone: suit button swaps suit');
    const t = tape(2);
    await page.evaluate(t => { window.__blaster.start(1, t.suits, t.tape); window.__blaster.speed(4); }, t);
    await page.waitForFunction(() => window.__blaster.state === 'result', null, { timeout: 120000 }).catch(() => {});
    ok(await page.evaluate(() => window.__blaster.state === 'result'), 'phone: level 2 replay completes');
    await page.evaluate(() => window.__blaster.select()); await sleep(500); await shot(page, '16_phone_select.png');
    // rotation: portrait then back to landscape resizes cleanly
    await page.setViewportSize({ width: 390, height: 844 }); await sleep(500);
    const pr = await page.evaluate(() => ({ w: document.getElementById('game').width, h: document.getElementById('game').height, sy: window.scrollY }));
    await page.setViewportSize({ width: 844, height: 390 }); await sleep(500);
    const ls = await page.evaluate(() => ({ w: document.getElementById('game').width, h: document.getElementById('game').height, dpr: Math.min(2, devicePixelRatio), sy: window.scrollY }));
    ok(pr.w === 390 * 2 && pr.h === 844 * 2 && ls.w === 844 * ls.dpr && ls.h === 390 * ls.dpr && ls.sy === 0, 'phone: canvas resizes cleanly on rotation ' + JSON.stringify({ pr, ls }));
    await page.evaluate(() => window.__blaster.start(0, ['volt', 'blaze', 'frost', 'spark', 'aegis'])); await sleep(600);
    await page.evaluate(() => window.__blaster.hold({ r: 1 })); await sleep(1200); await page.evaluate(() => window.__blaster.hold({ r: 1, j: 1, f: 1 })); await sleep(700);
    await page.evaluate(() => { window.__blasterPause = true; }); await shot(page, '19_phone_landscape_play.png'); await resume(page); await page.evaluate(() => window.__blaster.hold({}));
    ok(errs.length === 0, 'phone: zero console errors ' + JSON.stringify(errs));
    await ctx.close();
  }
  // ---------- phone portrait: rotate hint ----------
  {
    const { page, errs, ctx } = await newPage(browser, { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    await page.tap('#startBtn').catch(() => {}); await sleep(400);
    ok(await page.isVisible('#rotate'), 'phone portrait: rotate-to-landscape hint shown');
    await shot(page, '17_phone_portrait.png');
    ok(errs.length === 0, 'portrait: zero console errors ' + JSON.stringify(errs));
    await ctx.close();
  }
  await browser.close();
  console.log(fails ? `\n${fails} FAILED` : '\nALL PASSED'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
