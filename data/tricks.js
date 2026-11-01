// The bonus rooms' tricks and their Topi. A level gets one with `trick` in its definition (levels/LEGENDA.md):
//   trick: { id: 'fishing', topo: 'pescatore', x, z, spot: { x, z }, target: { x, z }, prize: 'spCarpa' }
// x, z = where the Topo stands; spot = where the bear stands to play (timing tricks); target = the water where the
// carp jumps, the goal, or the joust's pole; prize = the item it wins (an absurd weapon of data/weapons.js).
// The bonus room is everything walkable around the Topo, closed by a door of the legend's `doors` with `bonus`.
// `say` = the Topo's lines (game text: English), `howto` = the instruction (Italian, like the training's).
export const TRICK_TRIES = 3;

export const TRICKS = {
  // A needle sweeps a bar: SPACE when it is on the gold stripe catches the golden carp (the green one: a plain carp).
  fishing: {
    kind: 'timing', speed: 0.85, goldHalf: 0.06, greenHalf: 0.18,
    say: {
      hello: 'Psst! Want to catch the GOLDEN CARP? Walk to the end of the pier!',
      start: 'Wait for the needle on the GOLD... 3 casts!',
      gold: 'THE GOLDEN CARP! You win the CARP SQUIRTER!',
      green: 'Just a plain carp... Again!',
      miss: 'SPLASH! Nothing. Again!',
      lost: 'No golden carp today. Next time!',
    },
    howto: { solo: 'Vai in fondo al pontile, poi premi SPAZIO quando l\'ago è sulla striscia d\'oro.', coop: 'Chi guida: in fondo al pontile. Chi spara: SPAZIO quando l\'ago è sulla striscia d\'oro.' },
  },
  // A needle sweeps from post to post: SPACE kicks there; the keeper dives one way. A goal wins.
  penalty: {
    kind: 'timing', speed: 1.1, posts: 0.07, reach: 0.2,
    say: {
      hello: 'Hey! Bet you can\'t score a PENALTY! Stand on the spot!',
      start: 'Kick when the arrow points where I am NOT! 3 kicks!',
      goal: 'GOOOAL! You win the BALL BLASTER!',
      saved: 'SAVED! Ha! Again!',
      post: 'OFF THE POST! Again!',
      lost: 'Unbeatable! Come back next time!',
    },
    howto: { solo: 'Mettiti sul dischetto, poi premi SPAZIO quando la freccia punta dove il portiere non arriva.', coop: 'Chi guida: sul dischetto. Chi spara: SPAZIO quando la freccia punta dove il portiere non arriva.' },
  },
  // A target goes round the pole: 3 shots of the slingshot, one on the target wins.
  joust: {
    kind: 'target', radius: 2.4, speed: 1.2, height: 1.5, size: 0.55,
    say: {
      hello: 'Halt, knight! Hit my spinning TARGET with your slingshot! 3 shots!',
      hit: 'BULLSEYE! You win the PIE CATAPULT!',
      miss: 'Missed! Again!',
      lost: 'Out of shots! Next time, knight!',
    },
    howto: { solo: 'Il bersaglio gira attorno al palo: hai 3 colpi di fionda, SPAZIO per tirare.', coop: 'Il bersaglio gira attorno al palo: chi spara ha 3 colpi di fionda.' },
  },
};

// The Topi: a different mouse for every place. `color`/`accent` = the coded stand-in's colours, until drawn
// (topi/<topo>/<pose>_f_<n>: idle 1-2, talk 1-2, cheer 1-2, sad 1; the keeper also ready 1, dive 1).
export const TOPI = {
  pescatore: { color: '#9c968a', accent: '#3f6b32', hat: 'fisher' },
  portiere: { color: '#8b8b8b', accent: '#ff7a12', hat: 'gloves' },
  cavaliere: { color: '#a8a39a', accent: '#c0c0c0', hat: 'colander' },
};
