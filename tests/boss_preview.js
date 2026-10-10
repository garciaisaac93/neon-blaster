// Renders every boss in several phases onto one sheet (art review). Usage: node tests/boss_preview.js out.png
const pw = require('playwright-core'), path = require('path');
(async () => {
  const b = await pw.chromium.launch({ executablePath: '/usr/bin/google-chrome' }); const p = await b.newPage({ viewport: { width: 1600, height: 1000 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.addInitScript(() => { window.__neonNoAutoQ = true; });
  await p.goto('file://' + path.resolve(__dirname, '../index.html')); await p.waitForTimeout(800);
  await p.evaluate(() => {
    const c = document.createElement('canvas'); c.width = 1600; c.height = 1000; c.id = 'prev'; c.style.cssText = 'position:fixed;inset:0;z-index:99'; document.body.appendChild(c);
    const g = c.getContext('2d'), A = window.__bossArt; g.fillStyle = '#140c2a'; g.fillRect(0, 0, 1600, 1000);
    const rows = [['oni', ['idle', 'slamT', 'slam', 'charge', 'swing', 'dazed'], 84], ['kite', ['idle', 'shurikenT', 'dive', 'idle', 'idle', 'idle'], 56], ['shogun', ['idle', 'laserT', 'open', 'missileT'], 120], ['dragon', ['idle', 'hornT', 'morph', 'D', 'Dfire', 'Dswoop'], 64]];
    rows.forEach(([ty, phs, h], r) => phs.forEach((ph, i) => {
      const d = A.bossDummy(ty); d.form = ty === 'dragon' ? 'train' : ''; d.h = h; d.w = { oni: 76, kite: 84, shogun: 150, dragon: 190 }[ty]; d.ph = ph; d.pt = 0.3; d.dir = 1;
      if (ph === 'open'){ d.open = 1.5; } if (ty === 'oni' && i === 5) d.angry = true;
      if (ph === 'morph') d.pt = 0.5;
      if (ph[0] === 'D'){ d.form = 'dragon'; d.w = 110; d.h = 70; d.ph = ph === 'Dfire' ? 'fire' : ph === 'Dswoop' ? 'swoop' : 'idle'; }
      const cw = ty === 'shogun' ? 400 : 266, x = (ty === 'shogun' ? 200 : 133) + i * cw, by = 200 + r * 250 - (ty === 'shogun' ? 40 : 0);
      g.save(); A.drawBossArt(g, d, x, by, { t: 1.3 + i, icon: ty === 'shogun' ? false : false }); g.restore();
      g.fillStyle = '#fff'; g.font = '12px monospace'; g.textAlign = 'center'; g.fillText(ty + ':' + ph, x, by + 30);
    }));
  });
  await p.screenshot({ path: process.argv[2] || '/tmp/boss_sheet.png' });
  // icons
  await p.evaluate(() => { const c = document.getElementById('prev'); const g = c.getContext('2d'); g.fillStyle = '#140c2a'; g.fillRect(0, 0, 1600, 1000); ['oni', 'kite', 'shogun', 'dragon'].forEach((t, i) => { g.save(); g.translate(40 + i * 300, 40); g.strokeStyle = '#555'; g.strokeRect(0, 0, 200, 200); window.__bossArt.drawBossIcon(g, t, 200, 200, 1); g.restore(); g.save(); g.translate(40 + i * 300, 300); g.strokeStyle = '#555'; g.strokeRect(0, 0, 80, 80); window.__bossArt.drawBossIcon(g, t, 80, 80, 1); g.restore(); }); });
  await p.screenshot({ path: '/tmp/boss_icons.png', clip: { x: 0, y: 0, width: 1250, height: 400 } });
  console.log('errors', JSON.stringify(errs)); await b.close();
})();
