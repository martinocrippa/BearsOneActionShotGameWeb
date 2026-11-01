// E1M9 — Snowy Peaks (DOOM's Military Base): the SECRET level, a mountain village under the snow.
// Compact and packed: lots of supplies and lots of opponents. Lever in the chalet opens the woodpile gate,
// the bridge leads to the ski slopes and the frozen pond (SKI PASS), the turnstile opens the chairlift,
// the lift carries the bear up to the top station (Gallo + exit).
export default {
  id: 'E1M9', name: 'Snowy Peaks', file: 'e1m9-neve.txt', par: 200, music: 'e1m9',
  sky: { key: 'textures/sky_e1m9', top: '#cfe3f2', bottom: '#e4f1fb', ground: '#eef3f8' },
  weather: 'snow', exitProp: 'lever', next: 3,
  fogNear: 30, fogFar: 95,
  intro: 'SECRET LEVEL! Find the SKI PASS.',
  // signposts (see levels/LEGENDA.md): suggested by scripts/place-signs.mjs, checked in the game
  signs: [
    { x: 22, z: 39, text: 'FIND THE SKI PASS!', to: 'skipass' },
    { x: 48, z: 4, text: 'SKI PASS DOOR', to: 'door:skipass' },
    { x: 14, z: 8, text: 'EXIT', to: 'exit' },
  ],
  legend: {
    walls: {
      '#': { style: 'neve', color: '#f4f7fb' },                 // packed snow banks
      I: { style: 'neve', h: 5.6, color: '#f4f7fb' },           // snow cliff around the top station (parapet up there)
      w: { style: 'baita', color: '#6b4a2f' },                  // chalets: stone base, dark timber
      n: { style: 'legnaia', color: '#8b5a36' },                // woodpiles
      v: { style: 'legnaia', h: 1.2, color: '#8b5a36' },        // low woodpile: shoot over it
      '|': { style: 'rete_pista', rail: true, h: 1.5, color: '#ff7a12' }, // orange ski-slope nets
      '%': { style: 'baita', switch: 'N', color: '#6b4a2f' },   // lever in the chalet: opens the woodpile gate
      N: { style: 'legnaia', mover: true, color: '#8b5a36' },   // woodpile gate to the bridge
    },
    floors: {
      '.': { style: 'neve', slow: 0.85, color: '#eef3f8' },     // snow: a bit slow
      ',': { style: 'sentiero', color: '#8d8578' },             // main street, plaza
      '>': { style: 'ghiaccio', h: 1.6, slip: true, color: '#bfe3f5' }, // the frozen pond, up on the plateau
      '=': { style: 'assi_neve', h: 0.2, color: '#a07a5a' },    // plank bridge
      ';': { style: 'assi_neve', ceil: 3, ceilStyle: 'baita', ceilColor: '#6b4a2f', light: 0.75, color: '#a07a5a' }, // inside the chalets
      '~': { style: 'fiume', h: -0.5, slow: 0.6, liquid: true, color: '#4fa8d8' }, // cold river
      '+': { style: 'neve', h: 0.4, slow: 0.85, color: '#eef3f8' }, // ski slope, going up
      '*': { style: 'neve', h: 0.8, slow: 0.85, color: '#eef3f8' },
      '^': { style: 'neve', h: 1.2, slow: 0.85, color: '#eef3f8' },
      '<': { style: 'neve', h: 1.6, slow: 0.85, color: '#eef3f8' }, // plateau around the pond
      '&': { style: 'assi_neve', h: 4, lift: 0, color: '#a07a5a' }, // CHAIRLIFT: up at the top station, comes down for the bear
      '-': { style: 'assi_neve', h: 4, color: '#a07a5a' },      // top station deck (+4 m)
      '"': { style: 'assi_neve', h: 4, to: 4, color: '#a07a5a' }, // deck next to the lift: drawn as a full column, never moves
    },
    decor: {
      a: 'abete_neve', p: 'pupazzo', y: 'pilone', s: 'seggiolino', C: 'gatto_neve',
      j: 'paletto', f: 'fontana', e: 'arco', z: 'sasso',
    },
    keys: ['skipass'],
    secret: 'neve',
  },
};
