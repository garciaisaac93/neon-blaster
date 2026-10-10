# Neon Blaster

Play it in the browser: [garciaisaac93.github.io/neon-blaster](https://garciaisaac93.github.io/neon-blaster/)

Neon Blaster is a jetpack platformer in the spirit of Kirby meeting Mega Man. You are the Ronin Mech, a small armored hero with a scarf, a horned helmet, and an arm cannon, running and hovering through neon Tokyo.

There are four stages:

1. **Neon Street** — street-level tutorial, ending with the Oni Enforcer
2. **Rooftop Run** — hops between buildings, ending with the Kite Ninja Drone
3. **Elevator Shaft** — a vertical climb, ending with the Security Shogun Turret
4. **Midnight Subway** — live rails and tunnels, ending with the final boss, the Shinkansen Dragon

You start with the **Volt** suit and can find four more: **Blaze**, **Frost**, **Spark**, and **Aegis**. Each one changes your shot and gives a small perk (a steadier hover, a higher jump, a pickup magnet, or extra armor).

`index.html` at the root of this repo is the whole game in one file. Open it locally, or play the copy GitHub Pages serves from this repository.

## How to play

**Keyboard**

- Move: arrow keys or A / D
- Drop through a platform: hold Down or S
- Jump: Space, Z, K, W, or Up. Hold the jump button in the air to hover on the jetpack
- Shoot: X, J, or C. Hold to charge a stronger shot
- Switch suit: Q / E, or number keys 1–5
- Pause: P or Escape
- Mute: M

**Gamepad**

A standard controller works. Left stick or D-pad moves (down drops through platforms). The bottom face button (A / Cross) or D-pad Up jumps. The other face buttons, or the right trigger, shoot. Bumpers switch suits. Start pauses, and also starts the game from the title screen.

**Touch**

On a phone or tablet, on-screen buttons appear: left, right, down, **A** to jump (hold in the air to hover), **B** to shoot (hold to charge), and a cycle button for suits. Tap the title screen once so the music can start.

## Development

Game code lives in `src/`.

- `src/sim/` is the gameplay simulation: physics, suits, enemies, bosses, and levels
- `src/parts/` plus `src/index.template.html` is rendering, audio, input, and UI
- `assets/` holds the Tokyo photos baked into the page

After you edit those files, rebuild the single page:

```bash
python3 build.py
```

That writes `build/sim.js` and refreshes `index.html`. The `build/` folder is created if it is missing. You only need Python 3.

Tests are Playwright scripts in `tests/` (tape replays, UI, touch, and audio). They expect `playwright-core` and a local browser; `tests/hosted.test.js` can be pointed at the live Pages URL.
