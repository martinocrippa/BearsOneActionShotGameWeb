// E1M7 — The River (DOOM's Computer Station): an autumn river under a grey sky. A cement works maze hides the
// FERRY TICKET; Leonardo's cable ferry rises across the water; a lift leads to the LANTERN; the dark railway
// tunnel (ambush!) runs through the rock spur to the iron lattice bridge and the railway yard with the exit.
import { FOREST } from '../../src/core/level.js';

const TUNNEL = { ceil: 3.6, ceilStyle: 'galleria', ceilColor: '#4a463e', light: 0.5 };

export default {
  id: 'E1M7', name: 'The River', file: 'e1m7-fiume.txt', par: 260, music: 'e1m7',
  sky: { key: 'textures/sky_e1m7', top: '#d9dfe4', bottom: '#e4e8ea', ground: '#6b7a4a' },
  weather: 'leaves', exitProp: 'lever', next: 7, fogNear: 35, fogFar: 100,
  intro: 'Get a FERRY TICKET and cross the river!',
  // signposts (see levels/LEGENDA.md): suggested by scripts/place-signs.mjs, checked in the game
  signs: [
    { x: 7, z: 40, text: 'FIND THE FERRY TICKET!', to: 'biglietto' },
    { x: 5, z: 17, text: 'FERRY TICKET DOOR', to: 'door:biglietto' },
    { x: 23, z: 22, text: 'FIND THE LANTERN!', to: 'lanterna' },
    { x: 59, z: 41, text: 'LANTERN DOOR', to: 'door:lanterna' },
    { x: 47, z: 15, text: 'EXIT', to: 'exit' },
  ],
  legend: {
    ...FOREST,
    wallHeight: 4,
    walls: {
      '#': { style: 'muraglione', color: '#a8a49a' },               // river walls, rock spur outside
      R: { style: 'galleria', color: '#6e6a60' },                   // tunnel lining
      w: { style: 'lamiera', color: '#8a9aa8' },                    // cement works shed, freight wagons
      O: { style: 'silos', color: '#c8c4ba' },                      // cement silos
      '|': { style: 'traliccio', rail: true, color: '#3a3a3a' },    // railway bridge lattice: see and shoot through
      n: { style: 'muraglione', h: 1.2, color: '#a8a49a' },         // east bank parapet over the river
      '%': { style: 'muraglione', switch: 't', color: '#a8a49a' },  // ferry lever on the pier
      N: { style: 'galleria', mover: true, color: '#6e6a60' },      // tunnel ambush: walls that sink
    },
    floors: {
      '.': { style: 'terra' },
      '~': { style: 'fiume', h: -0.5, slow: 0.55, liquid: true, color: '#4f8fb8' },
      '-': { style: 'alzaia', color: '#a08a6a' },                   // towpath
      ',': { style: 'foglie_rosse', color: '#c4622a' },             // red leaves
      f: { style: 'fango', h: -0.2, slow: 0.55, sleepy: 3.5, liquid: true },
      t: { style: 'traghetto', h: -0.5, to: 1.2, color: '#8b5a36' }, // ferry deck: rises across the river with the lever
      p: { style: 'traghetto', h: 1.2, color: '#8b5a36' },          // pier and landing
      i: { style: 'traghetto', h: 0.4, color: '#8b5a36' },          // steps
      j: { style: 'traghetto', h: 0.8, color: '#8b5a36' },
      '=': { style: 'binari', color: '#6b5a4a' },                   // railway (bridge deck, yard)
      v: { style: 'binari', color: '#6b5a4a', ...TUNNEL },          // dark tunnel
      '*': { style: 'binari', color: '#6b5a4a', ...TUNNEL, trigger: 'N' }, // ambush trigger
      '&': { style: 'traghetto', h: 2.4, lift: 0, color: '#8b5a36' }, // lifts
      e: { style: 'terra', h: 2.4 },                                // gantry in the works, lantern ledge
      '+': { style: 'terra', h: 0.9 },                              // sacks (secret jump)
      '@': { style: 'terra', h: 1.8 },
      '<': { style: 'terra', h: 0.8 },                              // crack in the rock (hardest secret)
      '>': { style: 'terra', h: 1.6 },
      '/': { style: 'terra', h: 2.4 },                              // lookout over the river
    },
    decor: {
      I: 'pioppo', C: 'canne', T: 'ciminiera', '!': 'lampione_ferro', '?': 'cesto_castagne',
      b: 'barca', a: 'castagno', ';': 'sasso', '[': 'panchina',
    },
    keys: ['biglietto', 'lanterna'],
    secret: 'galleria',
  },
};
