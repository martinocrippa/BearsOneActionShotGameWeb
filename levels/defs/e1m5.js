// E1M5 — Break Time (DOOM's Phobos Lab): an empty classroom seen by a bear as small as a mouse. Everything is giant:
// rows of desks make a maze, a fallen pencil climbs to a desk top, a ruler rises out of the spilled sugar as a bridge,
// the teacher's desk hides the sugar crossbow.

const CEIL = { ceil: 9.5, ceilStyle: 'aula', ceilColor: '#f4f0e6', light: 0.95 };
const room = (style, color, extra = {}) => ({ style, color, ...CEIL, ...extra });
// Walls are 10 m here: `h` keeps them blocking sight and shots all the way up (default is 4 m).
const wall = (style, color, extra = {}) => ({ style, color, h: 10, ...extra });
// Desk tops and pencil steps (raised floors are drawn as solid blocks down to the ground).
const block = (style, color, h) => room(style, color, { h });

const BANCO = '#e8c070', RIGHELLO = '#ffd74a', MATT = '#dcd2bd';

export default {
  id: 'E1M5', name: 'Break Time', file: 'e1m5-aula.txt', par: 220, music: 'e1m5',
  // signposts (see levels/LEGENDA.md): suggested by scripts/place-signs.mjs, checked in the game
  signs: [
    { x: 25, z: 41, text: 'FIND THE RED CHALK!', to: 'gessetto_rosso' },
    { x: 43, z: 18, text: 'RED CHALK DOOR', to: 'door:gessetto_rosso' },
    { x: 29, z: 8, text: 'FIND THE BLUE CHALK!', to: 'gessetto_blu' },
    { x: 55, z: 4, text: 'BLUE CHALK DOOR', to: 'door:gessetto_blu' },
    { x: 46, z: 27, text: 'EXIT', to: 'exit' },
  ],
  legend: {
    wallHeight: 10,
    walls: {
      '#': wall('cartelloni', '#f4ecd8'),                 // children's drawings on the walls
      C: wall('lavagna', '#2f4a3a'),                      // the blackboard
      w: wall('finestra', '#8fd0f0'),                     // windows onto the garden
      b: wall('libri', '#3b8de0'),                        // giant books standing up
      T: { style: 'cattedra', color: '#a0632d', h: 5.4 }, // teacher's desk sides, 1 m above its top
      '%': wall('libri', '#3b8de0', { switch: '_' }),     // bookmark lever: raises the ruler
      N: wall('libri', '#3b8de0', { mover: true }),       // books that sink: the ambush cupboard
    },
    floors: {
      '.': room('mattonelle', MATT),
      ',': room('mattonelle', MATT, { light: 1 }),                                    // tiled corner by the sink
      '*': room('mattonelle', MATT, { light: 1, trigger: 'N' }),                      // near the blue chalk: ambush!
      '~': room('pozzanghera', '#8fd0f0', { h: -0.2, slow: 0.7, liquid: true }),      // puddle under the sink
      z: room('zucchero', '#fafafa', { h: -0.4, slip: true }),                        // spilled sugar pit
      _: room('righello', RIGHELLO, { h: -0.4, to: 3.6 }),                            // ruler: rises to a bridge
      '-': block('banco', BANCO, 3.6),                                                // desk tops
      '+': room('banco', BANCO, { h: 4.4 }),                                          // top of the teacher's desk
      '&': room('banco', BANCO, { h: 3.6, lift: 0 }),                                 // lift to desk C
      '@': room('banco', BANCO, { h: 4.4, lift: 0 }),                                 // lift to the teacher's desk
      p: room('astuccio', '#e0503c', { h: 0.9 }),                                     // pencil case rim (jump)
      a: room('astuccio', '#e0503c', { h: 0.3 }),                                     // inside the pencil case
      // the fallen pencil: a ramp from the floor to desk A, 0.4 m per step
      ';': block('righello', RIGHELLO, 0.4), '<': block('righello', RIGHELLO, 0.8),
      '>': block('righello', RIGHELLO, 1.2), '[': block('righello', RIGHELLO, 1.6),
      ']': block('righello', RIGHELLO, 2.0), '{': block('righello', RIGHELLO, 2.4),
      '}': block('righello', RIGHELLO, 2.8), "'": block('righello', RIGHELLO, 3.2),
    },
    decor: {
      j: 'gamba_banco', x: 'sedia', y: 'zaino', e: 'gomma', i: 'scotch',
      n: 'temperino', v: 'pennarelli', s: 'merendina', f: 'matita',
    },
    keys: ['gessetto_rosso', 'gessetto_blu'],
    secret: 'libri',
    side: 'cattedra', // the sides of the desk tops and of the pencil ramp: wood
  },
  sky: { key: 'textures/sky', top: '#8fd0f0', bottom: '#f4f0e6', ground: '#dcd2bd' },
  fogNear: 60, fogFar: 160,
  exitProp: 'lever', next: 5,
  intro: 'You are tiny! Find the RED CHALK.',
};
