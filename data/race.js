// TRACTOR RACE: the tractors' easter egg. Standing on the roof of a tractor (`race: true` in DECOR, data/items.js)
// the game asks for a race: a dirt track round a hay field, up and down the hills, round bales along the edges and a
// few in the way. The game's opponents drive the other tractors. Alone: the bear and three of them; in two: two
// bears (split screen, one tractor each) and two of them. Rules and maths in src/core/race.js, the 3D in src/race/.
export const RACE = {
  name: 'Hay Bale Grand Prix',
  laps: 2,
  width: 12, // the dirt track, metres
  // The middle of the track, metres (x, z): a closed loop driven in this order; the start line is at the first point.
  path: [
    [0, 0], [50, 0], [95, 6], [124, 32], [124, 66], [100, 86], [72, 76], [46, 90], [36, 120],
    [0, 136], [-40, 122], [-56, 88], [-44, 52], [-60, 22], [-42, 2],
  ],
  // The hills: height = Σ a·sin(x·kx + p)·cos(z·kz − 0.7p), flattened round the start (the grid stands level).
  hills: [[3.2, 0.045, 0.052, 0.4], [1.6, 0.105, 0.084, 1.7], [0.6, 0.19, 0.153, 2.9]],
  flatStart: [14, 40], // flat within the first radius (m), full hills beyond the second
  field: { x0: -110, x1: 175, z0: -45, z1: 185 }, // the tractors stay inside (a fence of poplars beyond)
  // Round bales in the way: [where along the lap (0-1), metres right (+) or left (−) of the middle].
  bales: [[0.14, -2.4], [0.27, 2.4], [0.41, -2.2], [0.52, 2.6], [0.64, -2.6], [0.78, 2.2], [0.9, -2.2]],
  edgeBales: { straight: 30, curve: 9, out: 2.4 }, // along the edges: every n metres (closer on the bends), so far out
  // Who drives the other tractors (the opponents' drawings, `enemies/<id>/<frame>`) and with which tractor drawing.
  drivers: [
    { id: 'cinghialotto', name: 'THE BOARLET', tractor: 'trattore', frame: 'walk_f_1', skill: 1 },
    { id: 'gallo', name: 'THE ROOSTER', tractor: 'trattorino', frame: 'walk_f_1', skill: 0.95 },
    { id: 'volpe', name: 'THE FOX', tractor: 'trattore', frame: 'walk_f_1', skill: 0.9 },
  ],
  // The tractors' drawings: decor/<id> from the side (facing right), decor/<id>_back from behind, decor/<id>_front from
  // in front (src/race/race.js picks the one the camera sees). Where the driver sits in each: across the drawing
  // (0 left … 1 right) and up from the ground (share of the drawing's height). The bears drive `bearTractor`.
  tractors: {
    trattore: { seat: [0.4, 0.42], back: [0.5, 0.42], front: [0.5, 0.42] },
    trattorino: { seat: [0.6, 0.3], back: [0.5, 0.3], front: [0.5, 0.3] },
  },
  // Off the dirt, on the grass of the field (the tractors can go anywhere inside `field`): top speed × this.
  grass: 0.75,
  bearTractor: 'trattore',
  // By difficulty (data/difficulty.js order): top speed of the bears (times the difficulty's `move`) and of the
  // others (m/s), and how much the steering helps the bears follow the track (the little ones steer better with a hand).
  speed: { bear: 13, others: [6.8, 8.6, 11.8, 12.8] },
  assist: [1.5, 1, 0.45, 0],
  // Prizes by place (items of data/items.js, straight into the bear's paws back in the level): the winner gets the
  // golden spade (data/weapons.js `vanga`, key 0).
  prizes: [['superMiele', 'spVanga'], ['mieleGrande'], ['miele'], ['caramelle']],
  music: 'race',
};
