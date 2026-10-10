// ---------------------------------------------------------------- music: one synthwave track per area + jingles
// sec fields: bars, prog (1 chord per bar, cycles), drums, bass, arp, pad, lead (8th-note tokens), oct, cut (filter 0..1), fill, build
const MUSIC = [
  { name: 'Neon Avenue', bpm: 112, pump: 0.55, lead: 'saw', arpWave: 'square', arpVol: 0.042, bassBright: 0.45, swing: 0.04,   // 0: Neon Street
    sec: {
      I:  { bars: 4, prog: 'Em C G D', pad: 1, arp: 'up', cut: 0.25, drums: 'none', build: 1 },
      A:  { bars: 8, prog: 'Em C G D', pad: 1, arp: 'up', drums: 'drive', bass: 'oct8', fill: 1 },
      B:  { bars: 8, prog: 'Em C G D', pad: 1, arp: 'updown', drums: 'drive', bass: 'oct8', fill: 1,
            lead: 'B4 - E5 - G5 - F#5 E5 | E5 - - - D5 - B4 - | D5 - G5 - B5 - A5 G5 | F#5 - - - D5 - . . | B4 - E5 - G5 - F#5 E5 | E5 - - - D5 - B4 - | D5 - G5 - A5 - B5 - | F#5 - - - - - . .' },
      C:  { bars: 8, prog: 'C D Em Em C D G B7', pad: 1, arp: 'wide', drums: 'four', bass: 'oct8', fill: 1,
            lead: 'G5 - - - E5 - G5 - | A5 - - - F#5 - D5 - | B5 - - - G5 - E5 - | B5 - A5 - G5 - F#5 - | G5 - - - E5 - G5 - | A5 - - - F#5 - A5 - | B5 - - - D6 - B5 - | A5 - - - F#5 - D#5 -' },
      A2: { bars: 8, prog: 'Em C G D', pad: 1, arp: 'pulse', drums: 'four', bass: 'gallop', fill: 1,
            lead: 'E6 - - - . . . . | . . . . . . . . | D6 - - - . . . . | . . . . . . . .' , leadKind: 'bell' },
      D:  { bars: 4, prog: 'Cmaj7 D Em Em', pad: 1, arp: 'up', arpRate: 2, cut: 0.5, drums: 'none', bass: 'long', build: 1,
            lead: 'G5 - - - - - E5 - | F#5 - - - - - D5 - | E5 - - - - - - - | . . . . . . . .' }
    }, order: ['I', 'A', 'B', 'C', 'A2', 'D', 'C'], loop: 1 },
  { name: 'Skyline Sprint', bpm: 124, pump: 0.6, lead: 'square', arpWave: 'sawtooth', arpVol: 0.036, bassBright: 0.6, leadVol: 0.066,   // 1: Rooftop Run
    sec: {
      I:  { bars: 4, prog: 'Bm G D A', pad: 1, arp: 'updown', cut: 0.3, drums: 'pulse', bass: 'long', build: 1 },
      A:  { bars: 8, prog: 'Bm G D A', pad: 1, arp: 'updown', drums: 'four', bass: 'gallop', fill: 1 },
      B:  { bars: 8, prog: 'Bm G D A', pad: 1, arp: 'updown', drums: 'four', bass: 'gallop', fill: 1,
            lead: 'F#5 - - - D5 - F#5 - | G5 - - - B4 - D5 - | A5 - - - F#5 - D5 - | E5 - - - C#5 - A4 - | F#5 - D5 - B4 - A4 - | G4 - B4 - D5 - G5 - | F#5 - A5 - D6 - A5 - | C#6 - - - - - . .' },
      C:  { bars: 8, prog: 'G A F#m Bm G A D D', pad: 1, arp: 'wide', drums: 'four', bass: 'oct8', fill: 1,
            lead: 'D6 - - - B5 - G5 - | C#6 - - - A5 - E5 - | C#6 - - - A5 - F#5 - | D6 - - - - - C#6 B5 | B5 - - - D6 - B5 - | A5 - - - C#6 - E6 - | F#6 - - - - - E6 D6 | D6 - - - - - . .' },
      A2: { bars: 8, prog: 'Bm G D A', pad: 1, arp: 'pulse', drums: 'drive', bass: 'pulse16', fill: 1,
            lead: 'B5 - . B5 - . A5 - | . . . . . . . . | D6 - . D6 - . C#6 - | . . . . . . . .', leadKind: 'bell' },
      D:  { bars: 4, prog: 'Gmaj7 A Bm Bm', pad: 1, arp: 'up', arpRate: 2, cut: 0.45, drums: 'none', bass: 'long', build: 1,
            lead: 'B5 - - - - - A5 - | C#6 - - - - - E6 - | D6 - - - - - - - | . . . . . . . .' }
    }, order: ['I', 'A', 'B', 'C', 'A2', 'B', 'D', 'C'], loop: 1 },
  { name: 'Vertical Drive', bpm: 100, pump: 0.45, lead: 'saw', arpWave: 'triangle', arpVol: 0.06, arpOct: 0, bassBright: 0.35, swing: 0.06,   // 2: Elevator Shaft
    sec: {
      I:  { bars: 4, prog: 'Dm Bb F C', pad: 1, arp: 'updown', cut: 0.3, drums: 'none', bass: 'long' },
      A:  { bars: 8, prog: 'Dm Bb F C', pad: 1, arp: 'updown', drums: 'half', bass: 'pulse8', fill: 1,
            lead: 'A5 - - - - - - - | . . . . . . . . | G5 - - - - - - - | . . . . . . . .', leadKind: 'bell' },
      B:  { bars: 8, prog: 'Dm Bb F C Dm Bb Gm A', pad: 1, arp: 'updown', drums: 'drive', bass: 'oct8', fill: 1,
            lead: 'D5 - - - F5 - A5 - | G5 - F5 - D5 - - - | C5 - - - F5 - A5 - | G5 - - - E5 - - - | D5 - - - F5 - A5 - | Bb5 - A5 - F5 - D5 - | G5 - - - Bb5 - D6 - | C#6 - - - A5 - E5 -' },
      C:  { bars: 8, prog: 'Dm Bb F C Dm Bb Gm A', pad: 1, arp: 'wide', drums: 'four', bass: 'oct8', fill: 1,
            lead: 'A5 - - - D6 - A5 - | Bb5 - - - F5 - D5 - | C6 - - - A5 - F5 - | G5 - - - E5 - C5 - | A5 - - - D6 - F6 - | F6 - E6 - D6 - Bb5 - | Bb5 - - - A5 - G5 - | A5 - - - - - . .' },
      D:  { bars: 4, prog: 'Bb C Dm A', pad: 1, arp: 'down', arpRate: 2, cut: 0.5, drums: 'none', bass: 'long', build: 1,
            lead: 'F5 - - - - - D5 - | E5 - - - - - G5 - | A5 - - - - - - - | C#6 - - - - - . .', leadKind: 'bell' }
    }, order: ['I', 'A', 'B', 'C', 'D', 'B', 'C'], loop: 1 },
  { name: 'Last Train', bpm: 118, pump: 0.6, lead: 'saw', arpWave: 'sawtooth', arpVol: 0.034, bassBright: 0.7,   // 3: Midnight Subway
    sec: {
      I:  { bars: 4, prog: 'Cm Ab Eb Bb', pad: 1, cut: 0.25, drums: 'pulse', bass: 'pulse16', build: 1 },
      A:  { bars: 8, prog: 'Cm Ab Eb Bb', pad: 1, arp: 'pulse', drums: 'drive', bass: 'pulse16', fill: 1 },
      B:  { bars: 8, prog: 'Cm Ab Eb Bb', pad: 1, arp: 'pulse', drums: 'drive', bass: 'pulse16', fill: 1,
            lead: 'G5 - - - Eb5 - C5 - | C5 - - - Eb5 - Ab5 - | G5 - - - Bb5 - G5 - | F5 - - - D5 - Bb4 - | G5 - - - Eb5 - C5 - | Ab5 - G5 - F5 - Eb5 - | G5 - - - Bb5 - Eb6 - | D6 - - - - - . .' },
      C:  { bars: 8, prog: 'Fm Ab Bb Cm Ab Bb Cm Cm', pad: 1, arp: 'wide', drums: 'four', bass: 'pulse16', fill: 1,
            lead: 'C6 - - - Ab5 - F5 - | Eb6 - - - C6 - Ab5 - | D6 - - - Bb5 - F5 - | Eb6 - - - - - D6 C6 | C6 - - - Eb6 - Ab5 - | D6 - - - F6 - D6 - | Eb6 - - - D6 - C6 - | C6 - - - - - . .' },
      A2: { bars: 8, prog: 'Cm Ab Eb Bb', pad: 1, arp: 'up', drums: 'four', bass: 'gallop', fill: 1,
            lead: 'C6 - - - . . . . | Eb6 - - - . . . . | G6 - - - . . . . | F6 - - - D6 - . .', leadKind: 'bell' },
      D:  { bars: 4, prog: 'Abmaj7 Bb Cm Cm', pad: 1, arp: 'up', arpRate: 2, cut: 0.4, drums: 'none', bass: 'long', build: 1,
            lead: 'Eb5 - - - - - C5 - | D5 - - - - - Bb4 - | C5 - - - - - - - | . . . . . . . .' }
    }, order: ['I', 'A', 'B', 'C', 'A2', 'D', 'B', 'C'], loop: 1 },
  { name: 'Chrome Showdown', bpm: 140, pump: 0.6, lead: 'square', arpWave: 'sawtooth', arpVol: 0.032, bassBright: 0.8, leadVol: 0.07,   // 4: boss
    sec: {
      I:  { bars: 2, prog: 'Am', drums: 'pulse', bass: 'pulse16', build: 1, crash: false },
      A:  { bars: 8, prog: 'Am Am F G Am Am Bb G', pad: 1, arp: 'pulse', drums: 'boss', bass: 'pulse16', fill: 1 },
      B:  { bars: 8, prog: 'Am Am F G Am Am Bb G', pad: 1, arp: 'pulse', drums: 'boss', bass: 'pulse16', fill: 1,
            lead: 'A5 - A5 E5 - A5 - G5 | A5 - - - C6 - B5 A5 | F5 - - F5 - A5 - C6 | B5 - - - G5 - D5 - | A5 - A5 E5 - A5 - G5 | A5 - - - C6 - D6 E6 | F6 - - - D6 - Bb5 - | B5 - - - D6 - B5 -' },
      C:  { bars: 8, prog: 'F G Am Am F G Bb G', pad: 1, arp: 'wide', drums: 'boss', bass: 'gallop', fill: 1,
            lead: 'C6 - - - A5 - F5 - | D6 - - - B5 - G5 - | E6 - - - D6 - C6 - | E6 - D6 - C6 - B5 A5 | C6 - - - A5 - F5 - | D6 - - - B5 - G5 - | F6 - - - D6 - Bb5 - | D6 - - - - - . .' },
      D:  { bars: 4, prog: 'F G Am Am', pad: 1, arp: 'up', cut: 0.5, drums: 'half', bass: 'oct8', build: 1 }
    }, order: ['I', 'A', 'B', 'C', 'A', 'D', 'B', 'C'], loop: 1 },
  { name: 'Neon Horizon', bpm: 96, pump: 0.5, lead: 'saw', arpWave: 'triangle', arpVol: 0.05, bassBright: 0.3, padVol: 0.024,   // 5: title
    sec: {
      I:  { bars: 4, prog: 'Fmaj7 G Am Am', pad: 1, arp: 'up', cut: 0.3, drums: 'none' },
      A:  { bars: 8, prog: 'Fmaj7 G Am Am Fmaj7 G Em Am', pad: 1, arp: 'up', drums: 'half', bass: 'oct8', fill: 1 },
      B:  { bars: 8, prog: 'Fmaj7 G Am Am Fmaj7 G Em Am', pad: 1, arp: 'updown', drums: 'drive', bass: 'oct8', fill: 1,
            lead: 'A4 - C5 - E5 - D5 C5 | D5 - - - B4 - G4 - | C5 - B4 - A4 - E5 - | E5 - - - - - . . | A4 - C5 - E5 - G5 - | D5 - G5 - F5 E5 D5 - | E5 - - D5 B4 - G4 - | A4 - - - - - . .' },
      C:  { bars: 8, prog: 'Fmaj7 G Am Am Fmaj7 G Em Am', pad: 1, arp: 'wide', drums: 'drive', bass: 'oct8', fill: 1,
            lead: 'E5 - A5 - G5 - E5 - | D5 - G5 - - - B5 - | C6 - B5 - A5 - E5 - | A5 - - - - - G5 A5 | C6 - - B5 A5 - G5 - | B5 - - A5 G5 - D5 - | E5 - G5 - B5 - A5 G5 | A5 - - - - - . .' },
      D:  { bars: 4, prog: 'Fmaj7 G Am Em', pad: 1, arp: 'up', arpRate: 2, cut: 0.5, drums: 'none', bass: 'long', build: 1,
            lead: 'A5 - - - - - - - | G5 - - - E5 - - - | C5 - - - - - - - | E5 - - - - - - -', leadKind: 'bell' }
    }, order: ['I', 'A', 'B', 'C', 'D', 'B', 'C'], loop: 1 }
];
const JINGLES = {
  victory: { name: 'Stage Clear', bpm: 150, pump: 0.3, lead: 'square', leadVol: 0.08, arpWave: 'square', arpVol: 0.04, once: 1,
    sec: { V: { bars: 3, prog: 'Ab Bb C', pad: 1, arp: 'up', drums: 'four', bass: 'oct8',
                lead: 'Ab5 - Ab5 - Ab5 - C6 - | Bb5 - Bb5 - Bb5 - D6 - | C6 - - - - - - - ' } }, order: ['V'] },
  suit: { name: 'Suit Get', bpm: 150, pump: 0.3, lead: 'square', leadVol: 0.08, arpWave: 'square', arpVol: 0.04, once: 1,
    sec: { V: { bars: 2, prog: 'C E', pad: 1, drums: 'pulse', bass: 'pulse8',
                lead: 'C5 E5 G5 C6 D5 F#5 A5 D6 | E6 - - - B5 - E6 -' } }, order: ['V'] }
};
