// E1M3 — The Pitch in the Rain (DOOM's Toxin Refinery): the neighbourhood football club on a rainy winter day.
// Car park and pitch 1 (whistle on the terraces) → changing rooms (whistle door, long corridor, locker-room switch
// opens the back gate) → pitch 2 and the churchyard (lift to the canopy roof: yellow card) → referee room (yellow-card
// door, switch raises the bridge over the muddy ditch) → exit. Secret exit behind the east goal of pitch 2.

const INSIDE = { h: 0.2, ceil: 3.4, ceilStyle: 'spogliatoio', ceilColor: '#d8d8d0' }; // changing rooms: raised floor, 3.2 m ceiling

export default {
  id: 'E1M3', name: 'The Pitch in the Rain', file: 'e1m3-campo.txt', par: 200, music: 'e1m3',
  // signposts (see levels/LEGENDA.md): suggested by scripts/place-signs.mjs, checked in the game
  signs: [
    { x: 15, z: 41, text: 'FIND THE WHISTLE!', to: 'fischietto' },
    { x: 3, z: 4, text: 'WHISTLE DOOR', to: 'door:fischietto' },
    { x: 28, z: 29, text: 'FIND THE YELLOW CARD!', to: 'cartellino' },
    { x: 54, z: 8, text: 'YELLOW CARD DOOR', to: 'door:cartellino' },
    { x: 45, z: 30, text: 'EXIT', to: 'exit' },
  ],
  legend: {
    wallHeight: 6, // tall flats: the canopy roof and the church ledge stand at 3-3.8 m
    walls: {
      '#': { style: 'condominio', color: '#d8c8a8' },               // blocks of flats with red roofs
      O: { style: 'spogliatoio', color: '#ff7a12' },                // changing-room block, black and orange
      I: { style: 'piastrelle', color: '#e8e8e0' },                 // tiled walls inside
      C: { style: 'chiesa', color: '#a8503c' },                     // the church
      '|': { style: 'rete', rail: true, h: 4, color: '#9c968a' },   // tall fence around the pitches
      '%': { style: 'spogliatoio', switch: 'N', color: '#ff7a12' }, // locker-room switch: opens the back gate
      '!': { style: 'spogliatoio', switch: '_', color: '#ff7a12' }, // referee-room switch: raises the bridge
      N: { style: 'cancello', mover: true, color: '#14161a' },      // back gate of the changing rooms
    },
    floors: {
      '.': { style: 'campo', color: '#5f9a48' },                    // striped grass
      '-': { style: 'campo_riga', color: '#6faa58' },               // grass with the chalk line
      ',': { style: 'asfalto', color: '#55585c' },
      w: { style: 'pozzanghera', h: -0.1, slow: 0.8, liquid: true, color: '#7f97a8' },       // puddle: wet, not sleepy
      '~': { style: 'fango', h: -0.2, slow: 0.55, sleepy: 3.5, liquid: true },               // mud: sleepy
      f: { style: 'fango', h: -1.4, slow: 0.55, sleepy: 3.5, liquid: true },                 // deep muddy ditch
      y: { style: 'fango', h: -0.7, slow: 0.55, sleepy: 3.5, liquid: true },                 // way out of the ditch
      _: { style: 'assi', h: -1.4, to: 0, color: '#c08a4f' },                                // bridge: rises with '!'
      t: { style: 'piastrelle', ...INSIDE, light: 0.75, color: '#e8e8e0' },                 // changing rooms
      v: { style: 'piastrelle', ...INSIDE, light: 0.5, color: '#d0d0c8' },                  // showers and cellars (dark)
      '=': { style: 'asfalto', ceil: 3.8, ceilStyle: 'spogliatoio', ceilColor: '#14161a', light: 0.85, color: '#55585c' }, // canopy
      '^': { style: 'gradoni', h: 0.5, color: '#8d8d86' },          // terraces: 0.5 m steps
      '+': { style: 'gradoni', h: 1, color: '#8d8d86' },
      '*': { style: 'gradoni', h: 1.5, color: '#8d8d86' },
      '@': { style: 'lamiera', h: 3, color: '#14161a' },            // canopy roof over the pitch-2 stands
      '&': { style: 'asfalto', h: 3, lift: 0 },                     // lift up to the canopy roof
      R: { style: 'tegole', h: 3.8, color: '#9c968a' },             // church roof ledge (secret): the 'tegole' drawing is the grey metal sheet roof
    },
    decor: {
      a: 'porta_calcio', b: 'panchina_coperta', p: 'cassa_palloni', j: 'faro', i: 'lampione',
      e: 'coni', T: 'campanile', x: 'armadietti', z: 'cestino', s: 'panchina',
    },
    keys: ['fischietto', 'cartellino'],
    secret: 'condominio', // every S sits in a wall of flats
  },
  sky: { key: 'textures/sky_e1m3', top: '#8e9ba6', bottom: '#a9b4bc', ground: '#4f7a3a' },
  weather: 'rain', exitProp: 'lever', next: 3, secretNext: 8,
  fogNear: 30, fogFar: 90,
  intro: 'Find the WHISTLE! Watch out for the mud...',
};
