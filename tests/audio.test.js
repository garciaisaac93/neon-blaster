// Offline-render every music track in headless Chromium; check level/peaks; export WAV (+MP3) previews.
const { chromium } = require('playwright-core');
const path = require('path'), fs = require('fs'), { execSync } = require('child_process');
const URL = 'file://' + path.resolve(__dirname, '../index.html');
const OUT = path.resolve(__dirname, '../audio_previews'); fs.mkdirSync(OUT, { recursive: true });
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
function wav(file, b64, sr = 44100){
  const pcm = Buffer.from(b64, 'base64'), h = Buffer.alloc(44);
  // previews are normalised to -1 dBFS peak so they are comfortable to listen to (in-game the music sits lower, under the SFX)
  let pk = 1; for (let i = 0; i < pcm.length; i += 2) pk = Math.max(pk, Math.abs(pcm.readInt16LE(i)));
  const k = 0.89 * 32767 / pk; for (let i = 0; i < pcm.length; i += 2) pcm.writeInt16LE(Math.round(pcm.readInt16LE(i) * k), i);
  h.write('RIFF', 0); h.writeUInt32LE(36 + pcm.length, 4); h.write('WAVE', 8); h.write('fmt ', 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(2, 22);
  h.writeUInt32LE(sr, 24); h.writeUInt32LE(sr * 4, 28); h.writeUInt16LE(4, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(pcm.length, 40);
  fs.writeFileSync(file, Buffer.concat([h, pcm]));
}
const PREVIEWS = { 5: ['title_neon_horizon', 2, 28], 0: ['street_neon_avenue', 2, 28], 4: ['boss_chrome_showdown', 2, 24], 1: ['rooftop_skyline_sprint', 3, 24] };
(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  const page = await browser.newPage(); const errs = [];
  page.on('pageerror', e => errs.push(String(e))); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await page.goto(URL); await page.waitForTimeout(500);
  const names = await page.evaluate(() => window.__blasterAudio.names);
  const ids = [0, 1, 2, 3, 4, 5, 'victory', 'suit'];
  for (const id of ids){
    for (const [from, secs] of typeof id === 'number' ? [[0, 20], [2, 20], [3, 20]] : [[0, 6]]){
      const pv = PREVIEWS[id] && PREVIEWS[id][1] === from ? PREVIEWS[id] : null;
      const r = await page.evaluate(([id, s, f, w]) => window.__blasterAudio.render(id, s, f, w), [id, pv ? pv[2] : secs, from, !!pv]);
      const label = `${r.name} [section ${from}] ${r.secs}s: peak ${r.peak.toFixed(3)} rms ${r.rms.toFixed(3)} (${(20 * Math.log10(r.rms)).toFixed(1)} dBFS) silent ${r.silentWin}/${r.wins} sched ${r.schedMs.toFixed(0)}ms`;
      const silentOk = typeof id === 'number' ? r.silentWin <= 1 : r.silentWin <= 6;
      ok(r.peak < 1.0 && r.peak > 0.2 && r.rms > 0.03 && r.rms < 0.3 && silentOk, label);
      if (pv){ const f = path.join(OUT, pv[0] + '.wav'); wav(f, r.pcm); console.log('  wrote ' + f); }
    }
  }
  ok(errs.length === 0, 'no page errors ' + JSON.stringify(errs));
  await browser.close();
  let enc = null; try { execSync('which ffmpeg'); enc = 'ffmpeg'; } catch (_){ try { execSync('which lame'); enc = 'lame'; } catch (_){} }
  if (enc) for (const f of fs.readdirSync(OUT).filter(f => f.endsWith('.wav'))){
    const src = path.join(OUT, f), dst = src.replace(/\.wav$/, '.mp3');
    execSync(enc === 'ffmpeg' ? `ffmpeg -y -loglevel error -i "${src}" -codec:a libmp3lame -b:a 192k "${dst}"` : `lame --silent -b 192 "${src}" "${dst}"`); console.log('  mp3 ' + dst);
  } else console.log('  (no ffmpeg/lame: WAV only)');
  console.log(fails ? `\n${fails} FAILED` : '\nALL PASSED'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
