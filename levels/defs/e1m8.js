// E1M8 — The Stadium (DOOM's Phobos Anomaly): a black-and-blue English-style football ground.
// Avenue and underground car park outside, concourses and vomitories under the stands, steep roofed stands,
// skyboxes on the east stand, and the boss on the pitch. When the Big Pig falls asleep the players' tunnel
// gate drops: the exit is in the changing rooms under the main stand.
const SEATS = '#1e3f8a';
const tier = h => ({ style: 'seggiolini', h, ceil: 11.5, ceilStyle: 'tetto', ceilColor: '#9aa0a6', light: 0.85, color: SEATS });
const step = (h, ceil) => ({ style: 'cemento', h, color: '#9a9a96', ...(ceil ? { ceil, ceilStyle: 'tunnel', ceilColor: '#8a8a86', light: 0.6 } : { light: 0.8 }) });
const parkStep = h => ({ style: 'parcheggio', h, color: '#55585e', light: 0.5 });

export default {
  id: 'E1M8', name: 'The Stadium', file: 'e1m8-stadio.txt', par: 240, music: 'e1m8',
  // signposts (see levels/LEGENDA.md): suggested by scripts/place-signs.mjs, checked in the game
  signs: [
    { x: 52, z: 52, text: 'FIND THE FOOTBALL!', to: 'pallone' },
    { x: 43, z: 52, text: 'FOOTBALL DOOR', to: 'door:pallone' },
    { x: 51, z: 25, text: 'EXIT', to: 'exit' },
  ],
  legend: {
    walls: {
      O: { style: 'gradinata', h: 12, color: '#1e5bd8' },  // stand mass and back walls, up to the roof
      I: { style: 'pannelli', h: 12, color: '#5f6f86' },   // grey-blue cladding of the curves
      T: { style: 'facciata', h: 9, color: '#c8b89a' },    // historic facade with arches (main and east stands)
      '#': { style: 'tunnel', color: '#8a8a86' },          // concrete inside: rooms, car park columns
      '=': { style: 'cartelloni_stadio', h: 1.2, low: true, color: '#14161d' }, // pitch-side boards: jump onto and over them (opponents cannot)
      '|': { style: 'vetro', rail: true, h: 7.6, color: '#bfe0f0' }, // skybox glass front
      N: { style: 'tunnel', mover: true, color: '#8a8a86' }, // players' tunnel gate: drops when the boss sleeps
      // parapets along the vomitories and the players' tunnel, just above the tiers next to them
      '[': { style: 'gradinata', h: 3, color: '#1e5bd8' },
      ']': { style: 'gradinata', h: 4.2, color: '#1e5bd8' },
      '{': { style: 'gradinata', h: 5.4, color: '#1e5bd8' },
      '}': { style: 'gradinata', h: 6.6, color: '#1e5bd8' },
      '(': { style: 'gradinata', h: 7.8, color: '#1e5bd8' },
    },
    floors: {
      '.': { style: 'prato', color: '#4f9a3a' },
      ',': { style: 'prato_riga', color: '#5faa4a' },
      _: { style: 'asfalto', color: '#4a4d52' }, // the avenue outside
      ';': { style: 'cemento', ceil: 3.4, ceilStyle: 'tunnel', ceilColor: '#8a8a86', light: 0.6, color: '#9a9a96' }, // concourses, rooms
      // stands: 0.6 m per row, roofed
      v: tier(0.6), w: tier(1.2), x: tier(1.8), y: tier(2.4), z: tier(3), 0: tier(3.6),
      '<': tier(4.2), '>': tier(4.8), '!': tier(5.4), '?': tier(6), '@': tier(6.6),
      // vomitories: walkable steps from the concourse up to the mid-tier, covered at the back
      ')': step(0.43, 5), '*': step(0.86, 4.4), '%': step(1.29, 3.8), '~': step(1.71), '"': step(2.14), "'": step(2.57),
      '/': { style: 'cemento', h: 6.5, ceil: 9, ceilStyle: 'tetto', ceilColor: '#9aa0a6', light: 0.8, color: '#9a9a96' }, // skyboxes
      '&': { style: 'cemento', h: 6.5, lift: 0, color: '#9a9a96' }, // lift up to the skyboxes
      '^': { style: 'cemento', h: 0.9, color: '#9a9a96' },            // ticket office step (roof is '~')
      // underground car park: dark, low ceiling; ramp from the avenue and stairs to the south concourse
      '-': { style: 'parcheggio', h: -1.6, ceil: 1.8, ceilStyle: 'parcheggio', ceilColor: '#3a3c40', light: 0.55, color: '#55585e' },
      '+': parkStep(-0.4), '`': parkStep(-0.8), R: parkStep(-1.2),
    },
    decor: {
      p: 'porta_calcio', b: 'bandierina', n: 'panchina_coperta', s: 'cassa_palloni', i: 'coni',
      t: 'tabellone', f: 'faro', e: 'lampione', a: 'albero_autunno', j: 'panchina', C: 'auto',
    },
    keys: ['pallone'], // K: the ball opens the main gate and the car park stairs (D)
    secret: 'tunnel',
  },
  sky: { key: 'textures/sky_e1m8', top: '#9fd3f2', bottom: '#cfe9f8', ground: '#4f9a3a' },
  exitProp: 'lever', next: null, bossOpens: 'N',
  intro: 'The BIG PIG is on the pitch. Put him to bed!',
};
