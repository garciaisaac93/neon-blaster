// ================================================================ NEON BLASTER deterministic simulation
// Pure data + fixed 1/60 s steps so the very same code runs in the browser and in Node (bot/tests).
const T = 32, DT = 1 / 60;
const PH = {
  run: 225, accG: 2600, accA: 1700, dec: 2800, grav: 1800, maxFall: 640,
  jump: 610, jumpCut: 230, coyote: 0.11, buffer: 0.14,
  flap: 330, flapCost: 0.11, hoverVy: 55, hoverDrain: 0.2, refill: 2.6,
  pw: 22, ph: 50, inv: 1.1, maxHp: 20
};
const SUITS = {
  volt:  { name: 'VOLT',  color: '#29f0ff', desc: 'Buster pellets. Hold to charge a piercing plasma ball.', perk: 'Balanced all-rounder' },
  blaze: { name: 'BLAZE', color: '#ff7a2b', desc: 'Triple fire spread. Charge lobs an exploding fireball.', perk: 'Rocket pack: hover glides level' },
  frost: { name: 'FROST', color: '#8fb8ff', desc: 'Ice shards freeze enemies into platforms you can stand on.', perk: 'Higher jump' },
  spark: { name: 'SPARK', color: '#ffe14d', desc: 'Homing sparks. Charge for chain lightning.', perk: 'Magnet: pickups fly to you' },
  aegis: { name: 'AEGIS', color: '#5dff9e', desc: 'Boomerang shield disc blocks bullets. Charge for a bubble shield.', perk: 'Armor: take less damage' }
};
const SUIT_ORDER = ['volt', 'blaze', 'frost', 'spark', 'aegis'];
function rnd(s){ // deterministic RNG stored in state
  let t = (s.seed = (s.seed + 0x6D2B79F5) | 0);
  t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const clampN = (v, a, b) => v < a ? a : v > b ? b : v;
const approach = (v, t, d) => v < t ? Math.min(t, v + d) : Math.max(t, v - d);
function overlap(a, b){ return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }
