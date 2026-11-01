// E1M1 — The Clearing (DOOM's Hangar): the forest tutorial.
import { FOREST } from '../../src/core/level.js';

export default {
  id: 'E1M1', name: 'The Clearing', file: 'e1m1-radura.txt', legend: FOREST, par: 150, music: 'e1m1',
  sky: { key: 'textures/sky', top: '#7fd0f0', bottom: '#bfe8f7', ground: '#5fae5a' }, horizon: 'hills',
  exitProp: 'mushroom', next: 1,
  intro: 'Find the GOLDEN ACORN and run to the den!',
  // signposts (see levels/LEGENDA.md): suggested by scripts/place-signs.mjs, checked in the game
  signs: [
    { x: 20, z: 26, text: 'FIND THE GOLDEN ACORN!', to: 'ghianda' },
    { x: 39, z: 3, text: 'GOLDEN ACORN DOOR', to: 'door:ghianda' },
    { x: 3, z: 6, text: 'EXIT', to: 'exit' },
  ],
};
