// E1M6 — The Castle (DOOM's Central Processing): a stone hamlet on a ridge around a ruined castle.
// Wings around the piazza: the church (golden chestnut + ambush), the castle ward and the chestnut wood
// (iron key + the switch that opens the portcullis shortcut), the alley up to the ridge (iron gate, rampart walk)
// and the keep courtyard with the two Galli. The lift goes up the broken keep to the exit.
export default {
  id: 'E1M6', name: 'The Castle', file: 'e1m6-castello.txt', par: 260, music: 'e1m6',
  // signposts (see levels/LEGENDA.md): suggested by scripts/place-signs.mjs, checked in the game
  signs: [
    { x: 30, z: 44, text: 'FIND THE GOLDEN CHESTNUT!', to: 'castagna_oro' },
    { x: 3, z: 26, text: 'GOLDEN CHESTNUT DOOR', to: 'door:castagna_oro' },
    { x: 30, z: 16, text: 'FIND THE IRON KEY!', to: 'chiave_ferro' },
    { x: 15, z: 18, text: 'IRON KEY DOOR', to: 'door:chiave_ferro' },
    { x: 51, z: 25, text: 'EXIT', to: 'exit' },
    { x: 28, z: 42, text: 'BONUS ROOM', to: 'bonus' },
  ],
  // bonus room (data/tricks.js): the knight mouse's tournament yard next to the start
  trick: { id: 'joust', topo: 'cavaliere', x: 24, z: 44, target: { x: 21, z: 40 }, prize: 'spTorte' },
  legend: {
    wallHeight: 6, // taller than usual: the keep top is at +4
    walls: {
      '#': { style: 'pietra', color: '#8a7f6c' },
      R: { style: 'mura', color: '#9a8f7a' },                 // castle curtain walls and keep
      C: { style: 'casa', color: '#b8a88a' },                 // village houses
      T: { style: 'rovi', h: 3, color: '#3f6b32' },           // brambles
      n: { style: 'pietra', h: 1.1, color: '#8a7f6c' },       // dry-stone low wall
      p: { style: 'pietra', h: 4.1, color: '#8a7f6c' },       // viewpoint parapet: 1.1 m above the ridge top (+3)
      '%': { style: 'pietra', switch: 'I', color: '#8a7f6c' }, // switch: lowers the portcullis
      I: { style: 'cancello', mover: true, color: '#3a3a3a' }, // portcullis (wood -> churchyard shortcut)
      O: { style: 'pietra', mover: true, color: '#8a7f6c' },  // church chapel walls that sink: the ambush
    },
    floors: {
      '.': { style: 'ciottoli', color: '#9c968a' },
      ',': 'erba',
      ';': 'terra',
      '-': { style: 'ghiaia', color: '#b8b0a0' },
      '=': { style: 'lastricato', color: '#a89f8a' },
      v: { style: 'lastricato', color: '#a89f8a', ceil: 3.4, ceilStyle: 'volta', ceilColor: '#7a705e', light: 0.6 }, // vaulted passages
      _: { style: 'lastricato', h: 0.4, color: '#a89f8a' },   // stone altar
      '*': { style: 'lastricato', color: '#a89f8a', trigger: 'O' }, // in front of the altar: opens the chapels
      // steps up the ridge (cobbles)
      '<': { style: 'ciottoli', h: 0.4, color: '#9c968a' },
      '>': { style: 'ciottoli', h: 0.8, color: '#9c968a' },
      '[': { style: 'ciottoli', h: 1.2, color: '#9c968a' },
      ']': { style: 'ciottoli', h: 1.5, color: '#9c968a' },   // landing before the iron gate
      '{': { style: 'ciottoli', h: 1.9, color: '#9c968a' },
      '}': { style: 'ciottoli', h: 2.3, color: '#9c968a' },
      '+': { style: 'ciottoli', h: 2.7, color: '#9c968a' },
      '^': { style: 'lastricato', h: 3, color: '#a89f8a' },   // ridge top / viewpoint
      // castle
      '"': { style: 'ghiaia', h: 1.5, color: '#b8b0a0' },     // rampart walk and keep courtyard
      '@': { style: 'lastricato', h: 4, color: '#a89f8a' },   // top of the broken keep
      '&': { style: 'lastricato', h: 4, lift: 1.5, color: '#a89f8a' }, // lift up the keep
    },
    decor: {
      ')': 'palo_giostra', // the bonus room's joust pole
      a: 'castagno', i: 'ricci', e: 'maesta', w: 'pozzo_pietra', t: 'torcia', y: 'asino', x: 'trattorino',
      f: 'spaventapasseri', z: 'cesto_castagne', b: 'balla', j: 'panchina', s: 'sasso', N: 'ceppo',
    },
    doors: { '(': { bonus: true } }, // the bonus room's door (levels/LEGENDA.md)
    keys: ['castagna_oro', 'chiave_ferro'],
    secret: 'pietra',
  },
  sky: { key: 'textures/sky_e1m6', top: '#9fd0ef', bottom: '#cfe6f5', ground: '#3f6b32' }, horizon: 'hills',
  exitProp: 'lever', next: 6,
  intro: 'Grab the GOLDEN CHESTNUT. The General is waiting...',
};
