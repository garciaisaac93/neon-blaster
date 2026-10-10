// ---------------------------------------------------------------- game flow, HUD, sim events -> juice
let S = null, state = 'title', curLv = 0, acc = 0, replay = null, speed = 1, resultT = 0;
const pv = { x: 0, y: 0 };
const V = { phase: 0, blink: 0, nextBlink: 2, muzzleT: 0, swapT: 0, fuelShow: 0, cellCombo: 0, cellT: 0, bannerT: 0, lastHp: -1, lastSuit: '', lastCells: -1, deadT: 0 };
const NLV = Sim.LEVELS.length;
const unlocked = i => i === 0 || !!store.cleared[i - 1];
function showOv(id){ for (const o of ['title', 'select', 'pause', 'result', 'ending']) $(o).classList.toggle('on', o === id); }
function setHud(on){ $('hud').classList.toggle('on', on); $('touch').classList.toggle('on', on); if (!on) $('bossBar').classList.remove('on'); }
function buildHpBar(){ const b = $('hpBar'); b.innerHTML = ''; for (let i = 0; i < Sim.PH.maxHp; i++) b.appendChild(document.createElement('i')); }
buildHpBar();
function updateHud(force){
  if (!S) return;
  const p = S.p;
  if (force || p.hp !== V.lastHp){ V.lastHp = p.hp; const segs = $('hpBar').children; for (let i = 0; i < segs.length; i++) segs[i].className = i < p.hp ? 'on' : ''; $('hpBar').classList.toggle('low', p.hp <= 6); }
  const sk = p.suit + S.suits.join();
  if (force || sk !== V.lastSuit){
    V.lastSuit = sk;
    const col = Sim.SUITS[p.suit].color;
    document.documentElement.style.setProperty('--suit', col);
    $('suitName').textContent = Sim.SUITS[p.suit].name;
    $('suitDots').innerHTML = Sim.SUIT_ORDER.map(k => `<i class="${S.suits.includes(k) ? 'have' : ''} ${k === p.suit ? 'cur' : ''}" style="--c:${Sim.SUITS[k].color}" title="${Sim.SUITS[k].name}"></i>`).join('');
  }
  if (force || S.cells !== V.lastCells){ V.lastCells = S.cells; $('cells').textContent = `⬢ ${S.cells}/${S.cellsTotal}`; }
  const b = S.boss, show = b && (S.arena && S.arena.on) && !b.dead;
  $('bossBar').classList.toggle('on', !!show);
  if (show){ const nm = b.name + ' · ' + ((BOSS_INFO[b.type] || {}).kanji || '') + (b.type === 'dragon' ? (b.form === 'dragon' ? ' · PHASE 2' : ' · PHASE 1') : ''); if ($('bossName').textContent !== nm) $('bossName').textContent = nm; $('bossHp').firstElementChild.style.width = (100 * b.hp / b.max) + '%'; }
}
function snapCam(){ const t = camTarget(); CAM.x = t.x; CAM.y = t.y; CAM.look = 0; }
function startLevel(i, opts = {}){
  curLv = i;
  S = Sim.createState(i, opts.suits || store.suits);
  if (store.curSuit && S.suits.includes(store.curSuit) && !opts.suits) S.p.suit = store.curSuit;
  const lv = Sim.PARSED[i];
  THEME = lv.def.theme; LW = lv.w * T; LH = lv.h * T; tilesDirty = true;
  pv.x = S.p.x; pv.y = S.p.y; acc = 0; parts = []; bolts = []; texts = []; resultT = 0;
  replay = opts.tape ? { tape: opts.tape, i: 0 } : null;
  setZoom(true); snapCam();
  state = 'play'; showOv(null); $('suitCard').classList.remove('on'); setHud(true); updateHud(true);
  Sfx.play(lv.def.music); Sfx.setPaused(false); blurUi();
  V.bannerT = 2.6;
  checkRotate();
}
function pauseGame(){ if (state !== 'play') return; state = 'pause'; showOv('pause'); Sfx.hover(false, 0); Sfx.charging(0, false); Sfx.setPaused(true); }
function resumeGame(){ if (state !== 'pause') return; state = 'play'; showOv(null); Sfx.setPaused(false); blurUi(); }
function blurUi(){ if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); }
function miniMap(i){   // stage card preview drawn from the real level map
  const L = Sim.parseLevel(i), d = Sim.LEVELS[i], cv = document.createElement('canvas'); cv.className = 'mini';
  const sc = Math.min(240 / L.w, 200 / L.h), W = Math.ceil(L.w * sc), H = Math.ceil(L.h * sc);
  cv.width = W * 2; cv.height = H * 2; const g = cv.getContext('2d'); g.scale(2, 2);
  const tc = { street: '#5a4f9a', roof: '#7a4fb0', tower: '#4f5f9a', subway: '#6a6f98' }[d.theme];
  for (let r = 0; r < L.h; r++) for (let c = 0; c < L.w; c++){
    const ch = L.grid[r][c]; let col = null, hh = 1;
    if (ch === '#' || ch === '?') col = tc; else if (ch === '=') { col = '#29f0ff'; hh = 0.35; } else if (ch === 'x') col = '#ff2bd6';
    else if (ch === 'o' || ch === 'O') col = '#ffd76a'; else if (ch === 'G') col = '#5dff9e';
    if (col){ g.fillStyle = col; g.fillRect(c * sc, r * sc, Math.max(sc, 1), Math.max(sc * hh, 1)); }
  }
  for (const s of L.spawns){
    const col = s.ch === 'P' ? '#ffffff' : s.ch === 'B' ? '#ff2bd6' : s.ch === 'C' || s.ch === 'G' ? '#5dff9e' : s.ch === 'o' || s.ch === 'O' || s.ch === 'S' ? '#ffd76a' : /[dhtj]/.test(s.ch) ? '#ff6a9e' : null;
    if (!col) continue; const rr = s.ch === 'B' ? 4.5 : s.ch === 'P' || s.ch === 'G' ? 3.2 : s.ch === 'o' ? 0.9 : 1.6;
    g.fillStyle = col; g.beginPath(); g.arc((s.c + 0.5) * sc, (s.r + 0.5) * sc, rr, 0, Math.PI * 2); g.fill();
  }
  return cv;
}
function openSelect(){
  setZoom(false); state = 'select'; S = null; setHud(false); Sfx.setPaused(false); Sfx.play(5);
  const bgs = { street: 'linear-gradient(160deg,#2a1450,#0c0820 60%,#3b0d3a)', roof: 'linear-gradient(160deg,#3a1a5e,#14093a 55%,#ff2bd640)', tower: 'linear-gradient(180deg,#0d1640,#1b0f3a 60%,#29f0ff30)', subway: 'linear-gradient(160deg,#141026,#0a0816 50%,#ffd76a30)' };
  const g = $('stages'); g.innerHTML = '';
  Sim.LEVELS.forEach((d, i) => {
    const un = unlocked(i), b = document.createElement('button'), best = store.best[i];
    b.className = 'stage' + (un ? '' : ' locked') + (store.cleared[i] ? ' clear' : '');
    b.style.setProperty('--bg', bgs[d.theme]);
    b.innerHTML = `<div class="n">${String(i + 1).padStart(2, '0')}</div><div class="nm">${d.name}</div><div class="boss mono">${d.bossName ? (d.final ? '♛ ' : '☠ ') + d.bossName : '⇡ VERTICAL CLIMB'}</div><div class="st mono">${best ? `⬢ ${best.cells}/${best.total} · ${best.time}s` : un ? 'NEW!' : ''}</div>`;
    b.prepend(miniMap(i));
    if (d.boss){ const ic = document.createElement('canvas'); ic.className = 'bicon'; ic.dataset.boss = d.boss; b.appendChild(ic); }
    b.onclick = () => { Sfx.init(); if (!un){ Sfx.hurt(); return; } Sfx.click(); startLevel(i); };
    g.appendChild(b);
  });
  showOv('select');
}
const ENDING_CREDITS = ['NEON//BLASTER · RONIN MECH', '', '— DEFEATED —', '鬼 ONI ENFORCER', '凧 KITE NINJA DRONE', '将 SECURITY SHOGUN TURRET', '竜 SHINKANSEN DRAGON', '', '— SUITS —', 'VOLT · BLAZE · FROST · SPARK · AEGIS', '', '— STARRING —', 'THE RONIN MECH', '', 'NEO TOKYO SLEEPS SAFE TONIGHT', 'ARIGATŌ FOR PLAYING!'];
function goTitle(){ setZoom(false); state = 'title'; S = null; setHud(false); showOv('title'); Sfx.setPaused(false); Sfx.play(5); }
function finishLevel(){
  state = 'result';
  const i = curLv, prev = store.best[i];
  store.cleared[i] = true;
  store.best[i] = { cells: Math.max(S.cells, prev ? prev.cells : 0), total: S.cellsTotal, time: Math.min(Math.round(S.time), prev ? prev.time : 1e9) };
  store.suits = Array.from(new Set(store.suits.concat(S.suits))); store.curSuit = S.p.suit; saveStore();
  $('rTitle').textContent = i === NLV - 1 ? 'CITY SAVED!' : 'STAGE CLEAR!';
  $('rCells').textContent = `${S.cells} / ${S.cellsTotal}`; $('rTime').textContent = `${Math.round(S.time)}s`; $('rHits').textContent = S.hits;
  $('rNote').textContent = i === NLV - 1 ? 'ALL STAGES CLEAR · ARIGATŌ, RONIN!' : S.cells >= S.cellsTotal ? 'ALL CELLS FOUND!' : S.hits === 0 ? 'NO DAMAGE!' : 'SECRETS HIDE BEHIND CRACKED WALLS…';
  $('rNext').textContent = i === NLV - 1 ? 'TITLE ▶' : 'NEXT ▶';
  $('rBot').dataset.suit = S.p.suit; setHud(false);
  if (i === NLV - 1){   // final boss down: ending / credits screen
    $('eCells').textContent = $('rCells').textContent; $('eTime').textContent = $('rTime').textContent; $('eHits').textContent = S.hits;
    $('eCred').innerHTML = ENDING_CREDITS.map(l => l ? `<div>${l}</div>` : '<div>&nbsp;</div>').join('');
    showOv('ending'); Sfx.jingle('victory', 5);
  } else showOv('result'); Sfx.hover(false, 0); Sfx.charging(0, false);
}
// ---------------------------------------------------------------- sim events -> particles, sound, shake
function shake(a){ shakeAmt = Math.max(shakeAmt, a); }
function handleEvents(evs){
  for (const e of evs){
    const col = S ? Sim.SUITS[S.p.suit].color : C.cy;
    switch (e.type){
      case 'jump': Sfx.jump(); for (let i = 0; i < 6; i++) addP({ x: e.x + rand(-8, 8), y: e.y, vx: rand(-60, 60), vy: rand(-40, -5), life: 0.4, col: 'rgba(200,190,255,1)', s: 3, g: 0, k: 'puff' }); break;
      case 'flap': Sfx.flap(); ring(e.x, e.y - 10, C.cy, 12, 0.3, 2); for (let i = 0; i < 8; i++) addP({ x: e.x - S.p.face * 6, y: e.y - 18, vx: rand(-40, 40), vy: rand(120, 260), life: 0.3, col: pick(['#fff', C.cy]), s: 2.5, g: 0 }); break;
      case 'land': Sfx.land(); for (let i = 0; i < 8; i++) addP({ x: e.x + rand(-10, 10), y: e.y, vx: rand(-90, 90), vy: rand(-30, -5), life: 0.35, col: 'rgba(200,190,255,1)', s: 3, g: 0, k: 'puff' }); break;
      case 'shoot': Sfx.shoot(e.suit, e.lvl || 0); V.muzzleT = 0.07; if (e.lvl === 2){ shake(3); burst(e.x, e.y, Sim.SUITS[e.suit].color, 14, 220, { g: 0 }); } break;
      case 'charge': Sfx.chargeLv(e.lv); ring(S.p.x + 11 + S.p.face * 22, S.p.y + 16, col, 14, 0.3, 2); break;
      case 'ehit': Sfx.ehit(); burst(e.x, e.y, '#fff', 5, 160, { g: 200 }); break;
      case 'pop': Sfx.pop(); if (e.how === 'shatter'){ Sfx.shatter(); burst(e.x, e.y, '#dff4ff', 16, 260, { k: 'shard', size: 4 }); } burst(e.x, e.y, C.yel, 14, 240, { cols: ['#fff', C.yel, C.mg, C.cy], k: 'star', size: 4, g: 300 }); ring(e.x, e.y, '#fff', 22, 0.35); shake(2); break;
      case 'freeze': Sfx.freeze(); burst(e.x, e.y, '#bfe4ff', 12, 160, { k: 'shard', g: 100 }); break;
      case 'thaw': burst(e.x, e.y, '#bfe4ff', 8, 100, { k: 'shard' }); break;
      case 'hurt': Sfx.hurt(); shake(7); burst(e.x, e.y, C.red, 10, 200, { g: 200 }); ftext(e.x, e.y - 30, '-' + e.dmg, '#ff6b88'); flashScreen('rgba(255,40,80,0.18)'); break;
      case 'die': Sfx.die(); shake(10); for (let k = 0; k < 3; k++) ring(e.x, e.y, k ? C.cy : '#fff', 20 + k * 16, 0.6, 4); burst(e.x, e.y, C.cy, 40, 380, { cols: [C.cy, '#fff', C.mg], g: 0, life: 1 }); V.deadT = 0; break;
      case 'respawn': Sfx.respawn(); snapCam(); pv.x = S.p.x; pv.y = S.p.y; for (let i = 0; i < 20; i++) addP({ x: e.x + rand(-14, 14), y: e.y + rand(-200, 40), vx: 0, vy: rand(300, 500), life: 0.4, col: C.cy, s: 2, g: 0 }); ftext(e.x, e.y - 50, 'BACK IN ACTION!', C.cy); break;
      case 'zap': Sfx.zap(); burst(e.x, e.y, C.yel, 14, 220, { cols: [C.yel, '#fff'], g: 300 }); break;
      case 'fall': Sfx.hurt(); ftext(S.p.x + 11, S.p.y - 20, 'WHOOPS!', C.yel); snapCam(); pv.x = S.p.x; pv.y = S.p.y; break;
      case 'cell': V.cellCombo = V.cellT > 0 ? V.cellCombo + 1 : 0; V.cellT = 0.6; Sfx.cell(V.cellCombo); burst(e.x, e.y, e.big ? C.mg : C.cy, e.big ? 18 : 7, e.big ? 200 : 120, { g: 0, k: e.big ? 'star' : 'dot' }); if (e.big) ftext(e.x, e.y - 20, 'SECRET +5!', C.mg); break;
      case 'heal': Sfx.heal(); ftext(e.x, e.y - 16, '+HP', C.grn); burst(e.x, e.y, C.grn, 10, 140, { g: -50 }); break;
      case 'checkpoint': Sfx.checkpoint(); ring(e.x, e.y + 30, C.cy, 40, 0.6, 4); ftext(e.x, e.y - 20, 'CHECKPOINT', C.cy); burst(e.x, e.y, C.cy, 16, 160, { g: 100, k: 'star' }); break;
      case 'swap': Sfx.swap(); V.swapT = 0.35; ring(S.p.x + 11, S.p.y + 25, Sim.SUITS[e.suit].color, 30, 0.4, 4); burst(S.p.x + 11, S.p.y + 25, Sim.SUITS[e.suit].color, 14, 180, { g: 0 }); ftext(S.p.x + 11, S.p.y - 24, Sim.SUITS[e.suit].name, Sim.SUITS[e.suit].color); store.curSuit = e.suit; saveStore(); break;
      case 'suitGet': {
        Sfx.jingle('suit', 'resume'); shake(4); const sc = Sim.SUITS[e.suit];
        for (let k = 0; k < 4; k++) ring(e.x, e.y, k % 2 ? '#fff' : sc.color, 30 + k * 25, 0.9, 4);
        burst(e.x, e.y, sc.color, 50, 400, { cols: [sc.color, '#fff', C.yel], k: 'star', g: 100, life: 1.2 });
        store.suits = Array.from(new Set(store.suits.concat(S.suits))); saveStore();
        $('suitCard').dataset.suit = e.suit; $('scName').textContent = sc.name; $('scDesc').textContent = sc.desc; $('scPerk').textContent = 'PERK · ' + sc.perk;
        $('scHow').textContent = isTouch ? 'TAP ⟳ TO SWITCH SUITS ANY TIME' : 'SWITCH SUITS WITH Q / E OR 1-5 (GAMEPAD: LB / RB)';
        document.documentElement.style.setProperty('--suit', sc.color);
        $('suitCard').classList.add('on'); break;
      }
      case 'bossIntro': Sfx.stinger(e.type); Sfx.play(4); V.bannerBoss = e.name; V.introT0 = S.cut ? S.cut.t + 1 / 60 : 2.6; shake(4); break;
      case 'enrage': Sfx.roar(); shake(8); flashScreen('rgba(255,40,80,0.25)'); for (let k = 0; k < 3; k++) ring(e.x, e.y + 20, k ? C.red : '#fff', 40 + k * 22, 0.7, 5); ftext(e.x, e.y - 20, 'ENRAGED!', '#ff6b88'); break;
      case 'smoke': Sfx.smoke(); for (let i = 0; i < (e.big ? 22 : 12); i++) addP({ x: e.x + rand(-26, 26), y: e.y + rand(-20, 20), vx: rand(-90, 90), vy: rand(-90, 30), life: rand(0.5, 0.9), col: pick(['rgba(160,140,220,1)', 'rgba(90,70,150,1)', 'rgba(255,43,214,1)']), s: rand(6, 11), g: 0, k: 'puff' }); break;
      case 'throw': Sfx.eshoot(); Sfx.whoosh(); break;
      case 'dive': case 'dash': Sfx.whoosh(); shake(3); break;
      case 'swing': Sfx.whoosh(); Sfx.zap(); shake(4); break;
      case 'laserT': Sfx.laserCharge(); break;
      case 'laser': Sfx.laser(); shake(4); break;
      case 'expose': Sfx.expose(); ring(e.x, e.y, C.mg, 30, 0.6, 4); break;
      case 'clink': Sfx.clink(); burst(e.x + rand(-30, 30), e.y + rand(0, 30), '#fff', 4, 160, { g: 300 }); break;
      case 'missile': Sfx.launch(); break;
      case 'ebreak': if (e.k === 'missile'){ Sfx.pop(); ring(e.x, e.y, C.org, 16, 0.3); } burst(e.x, e.y, e.k === 'zap' ? C.cy : C.org, 10, 200, { g: 300 }); break;
      case 'horn': Sfx.horn(); break;
      case 'roar': Sfx.roar(); shake(6); break;
      case 'fireT': Sfx.laserCharge(); break;
      case 'transform': Sfx.roar(); Sfx.boom(); shake(14); flashScreen('rgba(255,255,255,0.6)'); for (let k = 0; k < 4; k++) ring(e.x, e.y, k % 2 ? C.mg : '#fff', 50 + k * 30, 0.9, 6); ftext(e.x, e.y - 60, 'PHASE 2!', '#ff7ae8'); break;
      case 'bhit': Sfx.bhit(); burst(e.x + rand(-20, 20), e.y + rand(-20, 20), '#fff', 6, 200, { g: 200 }); break;
      case 'bossDown': Sfx.boom(); Sfx.stop(); shake(12); V.bossBoomT = 1.5; V.bossBoomAt = [e.x, e.y]; flashScreen('rgba(255,255,255,0.5)'); setTimeout(() => { if (state === 'play') Sfx.play(Sim.LEVELS[curLv].music); }, 2600); break;
      case 'bump': Sfx.bump(); shake(e.big ? 8 : 4); for (let i = 0; i < 10; i++) addP({ x: e.x + rand(-40, 40), y: e.y, vx: rand(-100, 100), vy: rand(-60, -10), life: 0.5, col: 'rgba(200,190,255,1)', s: 4, g: 0, k: 'puff' }); break;
      case 'bland': Sfx.bump(); shake(e.big ? 9 : 6); for (let i = 0; i < 14; i++) addP({ x: e.x + rand(-50, 50), y: e.y, vx: rand(-160, 160), vy: rand(-80, -10), life: 0.6, col: 'rgba(220,200,255,1)', s: 5, g: 0, k: 'puff' }); break;
      case 'tele': Sfx.tele(); break;
      case 'eshoot': case 'bshoot': Sfx.eshoot(); break;
      case 'bjump': Sfx.jump(); break;
      case 'spawn': ring(e.x, e.y, C.mg, 20, 0.4); break;
      case 'break': Sfx.breakB(); shake(3); burst(e.x, e.y, '#8a80c0', 16, 220, { k: 'shard', size: 5, g: 600 }); ring(e.x, e.y, C.cy, 20); break;
      case 'boom': Sfx.boom(); shake(6); for (let k = 0; k < 3; k++) ring(e.x, e.y, k ? C.org : '#fff', 30 + k * 20, 0.5, 5); burst(e.x, e.y, C.org, 30, 320, { cols: [C.org, C.mg, '#fff', C.yel], g: 100 }); break;
      case 'chain': Sfx.chain(); bolts.push({ pts: e.pts, life: 0.35, col: C.yel }); bolts.push({ pts: e.pts, life: 0.25, col: '#fff' }); shake(4); for (const [x, y] of e.pts.slice(1)) burst(x, y, C.yel, 10, 200, { g: 0 }); break;
      case 'bubble': ring(S.p.x + 11, S.p.y + 25, C.grn, 40, 0.5, 4); break;
      case 'block': Sfx.block(); ring(e.x, e.y, C.grn, 14, 0.25, 2); break;
      case 'spark': burst(e.x, e.y, Sim.SUITS[e.suit] ? Sim.SUITS[e.suit].color : '#fff', 4, 120, { g: 0 }); break;
      case 'goal': Sfx.jingle('victory', 5); for (let k = 0; k < 3; k++) ring(S.p.x + 11, S.p.y + 25, k ? C.grn : '#fff', 40 + k * 20, 0.8, 4); burst(S.p.x + 11, S.p.y, C.yel, 40, 300, { cols: [C.yel, C.cy, C.mg, '#fff'], k: 'star', g: 200, life: 1.2 }); resultT = 1.6; break;
    }
  }
}
let flashCol = null, flashT = 0;
function flashScreen(col){ flashCol = col; flashT = 0.25; }
