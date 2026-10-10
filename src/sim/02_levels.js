// ---------------------------------------------------------------- level builder + 4 handcrafted levels
// Legend: # solid · = one-way platform · x electrified floor (hurts, never kills) · ? cracked wall (shoot it)
// P start · C checkpoint · G goal · o cell · O big cell · + health · H big health · S suit capsule
// d drone · h hopper · t turret cam · j jelly drone · M moving platform (horizontal) · V elevator (vertical) · W short boss-arena elevator
// B boss · | boss-arena gate column · 1-9 tutorial hologram signs
function mk(w, h){
  const g = Array.from({ length: h }, () => Array(w).fill('.'));
  const b = {
    w, h, g,
    box(c0, c1, r0, r1, ch = '#'){ for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) g[r][c] = ch; return b; },
    col(c0, c1, top, ch = '#'){ return b.box(c0, c1, top, h - 1, ch); },
    put(c, r, s){ for (let i = 0; i < s.length; i++) if (s[i] !== ' ') g[r][c + i] = s[i]; return b; },
    rows(){ return g.map(r => r.join('')); }
  };
  return b;
}
const LEVELS = [];
// ---- 1. NEON STREET: tutorial street, hover over the live puddle, secret behind a cracked wall, ONI ENFORCER boss
LEVELS.push({
  name: 'Neon Street', theme: 'street', music: 0, boss: 'oni', bossName: 'ONI ENFORCER', bossKanji: '鬼の執行者', bossTag: 'STREET-GANG HEAVY MECH', drop: 'blaze',
  signs: [
    { k: 'MOVE ◀ ▶   JUMP: SPACE / Z', t: 'MOVE ◀ ▶   JUMP: Ⓐ' },
    { k: 'HOLD JUMP IN THE AIR TO HOVER', t: 'HOLD Ⓐ IN THE AIR TO HOVER' },
    { k: 'SHOOT: X / J   HOLD TO CHARGE', t: 'SHOOT: Ⓑ   HOLD TO CHARGE' }
  ],
  map: (() => {
    const b = mk(165, 17);
    b.col(0, 164, 14);
    // A: start
    b.put(1, 13, 'P').put(3, 13, '1').box(13, 17, 12, 13).put(14, 11, 'ooo').put(24, 11, 'd').put(8, 12, 'o.o');
    // B: hover over the live puddle
    b.box(36, 42, 12, 13).box(38, 42, 10, 11).box(51, 59, 10, 13).box(43, 50, 14, 14, 'x');
    b.put(32, 13, '2').put(44, 8, 'ooooo').put(42, 9, 'o').put(50, 9, 'o');
    // C: shooting lesson
    b.box(60, 65, 10, 13).box(66, 67, 12, 13).put(69, 13, 'C').put(72, 13, '3');
    b.box(72, 76, 10, 10, '=').put(72, 9, 'ooooo').put(79, 13, 'h').put(85, 11, 'd').put(88, 13, 't').put(82, 13, 'o.o');
    // D: moving platform over the puddle, cracked wall secret
    b.put(100, 8, 'j').put(94, 10, 'o.o.o').box(93, 99, 11, 11, '=').put(107, 11, 'M').put(106, 9, 'ooo');
    b.box(102, 109, 14, 14, 'x').box(111, 112, 12, 13).box(114, 119, 10, 13).box(115, 117, 12, 13, '.').box(114, 114, 12, 13, '?');
    b.put(116, 13, 'O').put(115, 13, '+').put(104, 7, 'd');
    // E: boss arena
    b.put(121, 13, 'C').put(123, 13, '|').put(149, 13, '|').put(141, 13, 'B');
    b.box(128, 131, 10, 10, '=').box(140, 143, 10, 10, '=').put(129, 9, '+').put(142, 9, '+');
    // F: exit
    b.put(152, 12, 'ooo').put(158, 13, 'G').box(164, 164, 0, 16);
    return b.rows();
  })()
});
// ---- 2. ROOFTOPS: hop between buildings, hover-car platforms, FROST capsule, KITE NINJA DRONE boss
LEVELS.push({
  name: 'Rooftop Run', theme: 'roof', music: 1, boss: 'kite', bossName: 'KITE NINJA DRONE', bossKanji: '凧忍者', bossTag: 'SHADOW OF THE ROOFTOPS', drop: 'spark', capsule: 'frost',
  signs: [
    { k: 'FALLING ONLY COSTS A LITTLE HEALTH', t: 'FALLING ONLY COSTS A LITTLE HEALTH' },
    { k: 'NEW SUIT!  Q / E  OR  1-5  TO SWITCH', t: 'NEW SUIT!  TAP ⟳ TO SWITCH' },
    { k: 'FROZEN ENEMIES ARE PLATFORMS', t: 'FROZEN ENEMIES ARE PLATFORMS' }
  ],
  map: (() => {
    const b = mk(190, 17);
    const roofs = [[0, 11, 12], [15, 24, 11], [28, 35, 13], [43, 52, 11], [56, 58, 7], [59, 70, 12], [75, 92, 11], [97, 104, 8], [111, 124, 12], [129, 140, 11], [144, 189, 12]];
    for (const [c0, c1, t] of roofs) b.col(c0, c1, t);
    b.put(2, 11, 'P').put(6, 11, '1').put(8, 9, 'oo');
    b.put(12, 8, 'ooo').put(20, 7, 'd').put(17, 10, 'o.o.o');
    b.put(25, 8, 'ooo').put(32, 12, 'h').put(38, 7, 'j');
    b.put(39, 11, 'M').put(37, 9, 'o.....o');
    b.put(45, 10, 'C').put(51, 10, 't').put(48, 8, 'oo');
    b.put(56, 6, 'ooo').put(53, 9, 'o');
    b.put(63, 11, 'h').put(67, 11, 'h').put(65, 9, '+');
    b.put(71, 8, 'oooo');
    b.put(77, 10, 'C').box(83, 85, 10, 10).put(84, 9, 'S').put(88, 10, '2').put(90, 6, 'j').put(94, 4, 'j').put(91, 10, '3');
    b.put(99, 5, 'd').put(102, 7, 'ooo');
    b.put(108, 10, 'M').put(106, 7, 'o...o');
    b.put(113, 11, 'C').put(116, 11, 'h').put(110, 8, 'o');
    b.box(119, 123, 9, 11).box(120, 122, 10, 11, '.').box(119, 119, 10, 11, '?').put(121, 11, 'O').put(122, 11, 'H').put(120, 11, 'o');
    b.put(126, 8, 'ooo').put(132, 7, 'd').put(137, 10, 't').put(131, 10, 'C');
    b.put(141, 8, 'oo');
    b.put(146, 11, '|').put(173, 11, '|').put(166, 6, 'B');
    b.box(151, 154, 9, 9, '=').box(164, 167, 9, 9, '=').box(157, 160, 6, 6, '=').put(152, 8, '+').put(165, 8, '+');
    b.put(176, 9, 'ooo').put(183, 11, 'G').box(189, 189, 0, 16);
    return b.rows();
  })()
});
// ---- 3. ELEVATOR SHAFT: vertical climb through one-way ledges + elevators, AEGIS capsule, secret pocket, SECURITY SHOGUN TURRET at the top
LEVELS.push({
  name: 'Elevator Shaft', theme: 'tower', music: 2, boss: 'shogun', bossName: 'SECURITY SHOGUN TURRET', bossKanji: '警備将軍', bossTag: 'GUARDIAN OF THE TOWER', drop: null, capsule: 'aegis', vAmp: 6, vArena: 13,
  signs: [
    { k: 'JUMP UP THROUGH THE GLOWING LEDGES', t: 'JUMP UP THROUGH THE GLOWING LEDGES' },
    { k: 'HOLD ▼ + JUMP TO DROP DOWN', t: 'HOLD ▼ + Ⓐ TO DROP DOWN' }
  ],
  map: (() => {
    const W = 26, H = 108, b0 = mk(W, H), O = 8;
    const b = { col: (c0, c1, top) => (b0.col(c0, c1, top ? top + O : 0), b), box: (c0, c1, r0, r1, ch) => (b0.box(c0, c1, r0 + O, r1 + O, ch), b), put: (c, r, t) => (b0.put(c, r + O, t), b) };
    b.col(0, 1, 0).col(24, 25, 0).box(0, 25, 97, 99);
    b.put(4, 96, 'P').put(8, 96, '1').put(14, 96, 'o.o.o');
    const ow = (r, c0, c1) => b.box(c0, c1, r, r, '=');
    ow(94, 15, 21); ow(91, 7, 12); ow(88, 2, 6); ow(85, 9, 14); ow(82, 16, 22);
    b.put(18, 93, 'ooo').put(9, 90, 'o.o').put(3, 87, 'oo').put(12, 80, 'd').put(22, 87, 't');
    ow(79, 9, 13); b.put(19, 79, 'V'); ow(73, 2, 8); b.put(4, 72, 'C').put(10, 78, 'oo');
    ow(70, 11, 15); ow(67, 18, 23); b.put(20, 66, 'h').put(13, 69, '+'); ow(64, 9, 14); b.put(3, 64, 'j');
    ow(61, 2, 6); b.put(4, 60, 'ooo'); ow(58, 10, 15); b.put(19, 57, 'V').put(12, 52, 'd');
    ow(50, 2, 8); b.put(5, 49, 'S').put(7, 49, '2');
    ow(47, 12, 16); ow(44, 18, 23); b.put(20, 43, 'C'); b.put(2, 44, 't');
    ow(41, 10, 14); ow(38, 3, 8); b.put(5, 37, 'ooo').put(15, 36, 'j');
    // secret pocket in the right wall
    b.box(22, 23, 28, 33).box(23, 23, 30, 31, '.').box(22, 22, 30, 31, '?').put(23, 31, 'O');
    ow(35, 11, 16); ow(32, 16, 21); b.put(18, 31, 'oo');
    ow(29, 8, 13); b.put(4, 27, 'V'); ow(23, 9, 14); b.put(12, 22, 'h').put(20, 24, 'd');
    ow(20, 16, 22); b.put(18, 19, 'C').put(21, 19, '+'); ow(17, 9, 13); b.put(2, 15, 't');
    ow(14, 2, 7); ow(11, 9, 14); b.put(11, 10, 'ooo'); ow(8, 16, 22); b.put(14, 6, 'j');
    b.box(2, 23, 5, 5, '='); b.put(12, 4, 'G').put(4, 4, 'H').put(18, 7, 'C');
    // boss arena (rows 0-12): SECURITY SHOGUN TURRET bolted to the ceiling, side ledges + two short elevators to reach its face
    b0.box(0, 25, 0, 0); b0.put(12, 5, 'B');
    b0.box(2, 5, 6, 6, '=').box(20, 23, 6, 6, '=').box(2, 4, 10, 10, '=').box(21, 23, 10, 10, '=');
    b0.put(8, 11, 'W').put(17, 11, 'W');
    return b0.rows();
  })()
});
// ---- 4. SUBWAY: tunnels, live rails, sewer hop, ceiling cams, SHINKANSEN DRAGON final boss
LEVELS.push({
  name: 'Midnight Subway', theme: 'subway', music: 3, boss: 'dragon', bossName: 'SHINKANSEN DRAGON', bossKanji: '新幹線竜', bossTag: 'FINAL BOSS', final: true, drop: null,
  signs: [
    { k: 'LIVE RAILS STING. HOVER OVER THEM', t: 'LIVE RAILS STING. HOVER OVER THEM' },
    { k: 'TIP: SPARK SHOTS HOME IN · FROST MAKES STEPS', t: 'TIP: SPARK SHOTS HOME IN · FROST MAKES STEPS' }
  ],
  map: (() => {
    const b = mk(200, 17);
    b.box(0, 199, 0, 2);
    b.box(0, 22, 13, 16).put(2, 12, 'P').put(6, 12, '1').put(10, 10, 'o.o.o').put(17, 12, 'h');
    b.box(23, 30, 15, 16).box(25, 28, 15, 15, 'x').put(25, 11, 'oooo');
    b.box(31, 52, 13, 16).put(40, 3, 't').put(36, 12, 'h').put(47, 12, 'h').box(34, 38, 9, 9, '=').put(34, 8, 'ooooo');
    b.box(53, 64, 15, 16).box(54, 63, 15, 15, 'x').put(58, 11, 'M').put(55, 9, 'o......o');
    b.box(65, 90, 13, 16).put(67, 12, 'C').box(75, 84, 3, 8).put(79, 11, 'd').put(76, 12, 'o.o.o.o').put(88, 3, 't').put(71, 12, '2');
    b.box(91, 120, 15, 16).box(92, 119, 15, 15, 'x');
    b.box(94, 97, 12, 12, '=').box(101, 104, 11, 11, '=').box(108, 111, 12, 12, '=').box(114, 117, 11, 11, '=');
    b.put(99, 7, 'j').put(112, 6, 'j').put(95, 11, 'oo').put(102, 10, 'oo').put(109, 11, 'oo').put(115, 10, 'oo').put(106, 5, 'd');
    b.box(121, 140, 13, 16).put(123, 12, 'C').box(131, 135, 9, 12).box(132, 134, 11, 12, '.').box(131, 131, 11, 12, '?').put(133, 12, 'O').put(134, 12, 'H');
    b.put(127, 12, 'h').put(138, 3, 't').put(137, 12, 'o');
    b.box(141, 199, 13, 16).put(145, 12, 'C').put(148, 12, '|').put(178, 12, '|').put(170, 12, 'B');
    b.box(154, 157, 9, 9, '=').box(167, 170, 9, 9, '=').put(155, 8, '+').put(168, 8, '+');
    b.put(184, 10, 'ooo').put(190, 12, 'G').box(199, 199, 0, 16);
    return b.rows();
  })()
});
