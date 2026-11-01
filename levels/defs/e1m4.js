// E1M4 — School at Dawn (DOOM's Command Control): a school laid out as a cross around a wooden atrium,
// in → out → in → out.
// 1. Forecourt with the canopy (out) → wooden atrium (in): white staircase or lift up to the first-floor
//    walkway; the SCHOOL BELL waits in the classroom upstairs. Classrooms in the west wing.
// 2. A glass door at the top of the staircase opens on a balcony: jump down into the wet garden (out), with
//    ducklings, the half-moon tiers and, through the fence, the softball field.
// 3. The bell door in the garden leads down a ramp into the sunken car park (in, dark): the caretaker's
//    switch lowers the shutter in front of the JANITOR'S KEYS; stairs go up to the keys door of the gym.
// 4. A lift in the gym climbs to the solar-panel roof (out) with the cotton candy cannon; jump down onto the
//    street, cross it and pull the lever. The janitor's keys also open the school gate (forecourt ↔ street).

const STAIRS = { style: 'scalini', color: '#e8e4dc', ceil: 5.6, ceilStyle: 'travi_lamellari', ceilColor: '#c8a06a', light: 0.95 };
const TIERS = { style: 'scalini', color: '#e8e4dc', light: 0.9 };
const RAMP = h => ({ style: 'parcheggio', color: '#55585c', h, ceil: h + 3, ceilStyle: 'cemento', ceilColor: '#8a8a86', light: 0.45 });

export default {
  id: 'E1M4', name: 'School at Dawn', file: 'e1m4-scuola.txt', par: 260, music: 'e1m4',
  // signposts (see levels/LEGENDA.md): suggested by scripts/place-signs.mjs, checked in the game
  signs: [
    { x: 28, z: 42, text: 'FIND THE SCHOOL BELL!', to: 'campanella' },
    { x: 14, z: 22, text: 'SCHOOL BELL DOOR', to: 'door:campanella' },
    { x: 40, z: 13, text: 'FIND THE JANITOR\'S KEYS!', to: 'mazzo_chiavi' },
    { x: 60, z: 11, text: 'JANITOR\'S KEYS DOOR', to: 'door:mazzo_chiavi' },
    { x: 56, z: 21, text: 'EXIT', to: 'exit' },
  ],
  legend: {
    wallHeight: 6, // the gym is 6 m tall
    walls: {
      '#': { style: 'intonaco', color: '#efe8da' },
      w: { style: 'listelli', color: '#c8a06a' },             // timber grid of the atrium
      '=': { style: 'vetrata', color: '#8fb8d8' },            // glazed front of the atrium
      p: { style: 'palestra', color: '#d6cdba' },             // gym, small square windows
      C: { style: 'cemento', color: '#9a9a96' },              // car park walls and columns
      '|': { style: 'balaustra', rail: true, h: 3.5, color: '#2a2a2e' }, // dark balustrade of the walkway
      '+': { style: 'rete', rail: true, h: 4, color: '#9c968a' },       // backstop and field fence
      '%': { style: 'cemento', switch: 'N', color: '#9a9a96' },         // caretaker's switch: lowers the shutter
      N: { style: 'intonaco', mover: true, color: '#f0a81e' },          // yellow car park shutter
    },
    floors: {
      '.': { style: 'lastre', color: '#b8b0a0', light: 0.9 },                         // paving and pavements (outdoor)
      '/': { style: 'lastre', color: '#b8b0a0', ceil: 4.5, ceilStyle: 'cemento', ceilColor: '#8a8a86', light: 0.8 }, // canopy, dugout roof
      v: { style: 'erba_bagnata', color: '#5f8f46', light: 0.9 },                    // wet grass
      t: { style: 'terra_battuta', color: '#b8865a', light: 0.9 },                   // softball diamond
      O: { style: 'asfalto', color: '#3e4044', light: 0.85 },                        // street
      z: { style: 'strisce', color: '#e8e8e0', light: 0.85 },                        // pedestrian crossing
      y: { style: 'pannelli_solari', color: '#2f4f8f', h: 4.8, light: 1, side: 'palestra' },           // solar-panel roof of the gym block
      '@': { style: 'pannelli_solari', color: '#2f4f8f', h: 4.8, lift: 0 },          // lift from the gym up to the roof
      '-': { style: 'lastre', color: '#b8b0a0', ceil: 5.6, ceilStyle: 'travi_lamellari', ceilColor: '#c8a06a', light: 1 }, // atrium
      '^': { style: 'linoleum', color: '#d6cdba', h: 2.4, ceil: 5.6, ceilStyle: 'travi_lamellari', ceilColor: '#c8a06a', light: 0.9 }, // first-floor walkway + balcony
      T: { style: 'linoleum', color: '#d6cdba', h: 2.4, ceil: 5.8, ceilStyle: 'lampade', ceilColor: '#f4f0e6', light: 0.55 }, // bell classroom upstairs (dim)
      ',': { style: 'linoleum', color: '#d6cdba', ceil: 3.5, ceilStyle: 'lampade', ceilColor: '#f4f0e6', light: 0.8 },
      _: { style: 'parquet', color: '#c8904a', ceil: 6, ceilStyle: 'lampade', ceilColor: '#f4f0e6', light: 0.9 },  // gym
      ';': { style: 'parcheggio', color: '#55585c', h: -2, ceil: 0.8, ceilStyle: 'cemento', ceilColor: '#8a8a86', light: 0.4 }, // sunken car park
      '&': { style: 'lastre', color: '#b8b0a0', h: 2.4, lift: 0, ceil: 5.6, ceilStyle: 'travi_lamellari', ceilColor: '#c8a06a', light: 1 }, // lift to the walkway
      // the white staircase up to the walkway (0.4 m a step)
      '!': { ...STAIRS, h: 0.4 }, '?': { ...STAIRS, h: 0.8 }, '<': { ...STAIRS, h: 1.2 }, '>': { ...STAIRS, h: 1.6 }, '[': { ...STAIRS, h: 2 },
      // half-moon tiers in the garden and the low stand of the softball field (outdoor)
      '{': { ...TIERS, h: 0.4 }, '}': { ...TIERS, h: 0.8 }, "'": { ...TIERS, h: 1.2 },
      // ramp and stairs down to the car park (0.4 m a step)
      ']': RAMP(-0.4), '*': RAMP(-0.8), '~': RAMP(-1.2), '"': RAMP(-1.6),
    },
    decor: {
      b: 'banco', s: 'sedia', x: 'cestino', R: 'lucidatrice', a: 'auto', n: 'canestro', j: 'panchina', I: 'lampione',
      f: 'albero_autunno', i: 'coni',
    },
    keys: ['campanella', 'mazzo_chiavi'],
    secret: 'intonaco',
  },
  sky: { key: 'textures/sky_e1m4', top: '#8a8fc0', bottom: '#c0a8b8', ground: '#55585c' },
  fogNear: 40, fogFar: 110,
  exitProp: 'lever', next: 4,
  intro: 'Ring the SCHOOL BELL... somewhere in here.',
};
