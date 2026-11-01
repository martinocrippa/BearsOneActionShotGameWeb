// E1M2 — Increa Park (DOOM's Nuclear Plant): an old quarry with a lake, a quail pen and a farm with a barn.
// Hub = the lake shore; the quarry ledge (lift) has the blue feather, the quail pen's switch raises the
// sunken bridge to the island with the red feather, the red feather opens the barn (exit on the loft).

const INSIDE = { ceil: 3.5, ceilStyle: 'travi', ceilColor: '#6b4a2f', light: 0.7 }; // the barn

export default {
  id: 'E1M2', name: 'Increa Park', file: 'e1m2-increa.txt', par: 180, music: 'e1m2',
  // signposts (see levels/LEGENDA.md): suggested by scripts/place-signs.mjs, checked in the game
  signs: [
    { x: 28, z: 38, text: 'FIND THE BLUE QUAIL FEATHER!', to: 'piuma_blu' },
    { x: 3, z: 2, text: 'BLUE QUAIL FEATHER DOOR', to: 'door:piuma_blu' },
    { x: 19, z: 9, text: 'FIND THE RED QUAIL FEATHER!', to: 'piuma_rossa' },
    { x: 27, z: 20, text: 'RED QUAIL FEATHER DOOR', to: 'door:piuma_rossa' },
    { x: 48, z: 10, text: 'EXIT', to: 'exit' },
  ],
  legend: {
    walls: {
      '#': { style: 'cava', h: 6, color: '#c9bfa8' },          // quarry cliffs
      w: { style: 'mattoni', color: '#a8503c' },               // farmhouse and quail shed
      I: { style: 'fienile', color: '#8b3a2a' },               // barn
      T: 'siepe',
      '|': { style: 'recinto', rail: true, color: '#8b5a36' }, // quail pen net
      '!': { style: 'canne', rail: true, color: '#8cc85a' },   // reeds around the island
      '%': { style: 'mattoni', switch: '_', color: '#a8503c' }, // switch on the shed: raises the bridge
    },
    floors: {
      '.': 'erba',
      ',': 'terra',
      '~': { style: 'acqua', h: -0.4, slow: 0.6, liquid: true, color: '#4fa8d8' },
      '=': { style: 'pontile', h: 0.2, color: '#9a6a3e' },
      ';': { style: 'foglie', h: 0.75, color: '#c27a2e' },     // park entrance, on the leafy plateau
      '-': { style: 'cemento', color: '#b8b2a6' },             // farm courtyard
      '>': { style: 'cemento', color: '#b8b2a6', ceil: 3.2, ceilStyle: 'travi', ceilColor: '#6b4a2f', light: 0.8 }, // portico
      '[': { style: 'erba', h: 0.25 },                         // amphitheatre tiers
      ']': { style: 'erba', h: 0.5 },
      '{': { style: 'erba', h: 0.75 },
      '^': { style: 'roccia', h: 0.75 },
      '"': { style: 'roccia', h: 1.5 },                        // jump secret
      '*': { style: 'erba', h: 0.75 },                         // island meadow
      '+': { style: 'roccia', h: 2.5 },                        // quarry ledge
      '&': { style: 'assi', h: 2.5, lift: 0 },                 // lift to the ledge
      '_': { style: 'pontile', h: -1.5, to: 0.4, color: '#9a6a3e' }, // sunken bridge, rises with the switch
      v: { style: 'terra', ceil: 3, ceilStyle: 'galleria', light: 0.45 },           // secret cave
      '/': { style: 'terra', ...INSIDE },                      // barn floor
      '?': { style: 'assi', h: 1.2, ...INSIDE },               // barn loft
      '@': { style: 'assi', h: 1.2, lift: 0, ...INSIDE },      // lift to the loft
    },
    decor: {
      a: 'albero_autunno', b: 'betulla', e: 'abete', p: 'panchina', C: 'cestino', s: 'sasso', j: 'ceppo',
      i: 'cespuglio', n: 'funghi', x: 'canne', t: 'tartarughe', y: 'balla', O: 'pozzo', N: 'trattore',
    },
    keys: ['piuma_blu', 'piuma_rossa'],
    secret: 'cava',
  },
  sky: { key: 'textures/sky_e1m2', top: '#f3b48a', bottom: '#f7c9a8', ground: '#6f8f46' }, horizon: 'hills',
  weather: 'leaves', exitProp: 'lever', next: 2,
  intro: 'Find the BLUE QUAIL FEATHER and open the quail pen!',
};
