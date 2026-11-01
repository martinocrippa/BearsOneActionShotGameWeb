// Episode 1: the level definitions (levels/defs/*.js: legend, sky, music, what comes next) plus their text maps.
import { DEFS } from './defs.js';
import training from './defs/training.js';

const MAPS = import.meta.glob('./*.txt', { query: '?raw', import: 'default', eager: true });

export const LEVELS = DEFS.map(d => ({ ...d, map: MAPS[`./${d.file}`] }));
// LEARN in the menu: the training level, outside the episode
export const TRAINING = { ...training, map: MAPS[`./${training.file}`] };

// The text after the last level, typed line by line like DOOM's end-of-episode screen (English: game text).
export const EPISODE = {
  name: 'Knee-Deep in the Woods',
  ending: [
    'The Big Pig of the Farm Squad is snoring on the pitch, hugging his bottle.',
    'The crowd goes wild. Nobody fell asleep. Nobody even yawned.',
    'But far away, beyond the hills, a castle made of candy glows in the dark...',
    'and somebody up there is planning the biggest pillow fight ever.',
  ],
  // the small present at the top of the ending screen: the real match behind the stadium's scoreboard,
  // with a link to the official highlights (a link only: the video is never copied into the game)
  gift: {
    title: 'ATALANTA 6 - 2 BRESCIA',
    lines: ['Serie A 2019-20 · 14 July 2020 · Bergamo', 'A hat-trick for Pasalic!', 'The last official match between the two teams.'],
    url: 'https://www.youtube.com/watch?v=LVt9UT2iSyE', // official Serie A channel
  },
  // after the ending: the teaser over screens/episode2/background (the Candy Castle)
  teaser: 'TO BE CONTINUED IN EPISODE 2...',
};
