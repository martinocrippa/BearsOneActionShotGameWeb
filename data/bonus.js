// SWEET SHOT: the bonus unlocked by putting the Big Pig to sleep. A shooting gallery with a precision rifle:
// birds fly over a landscape, the bear knocks them out with sweets (they never get hurt: they burp, do
// loop-the-loops or float down in a marshmallow). Three levels at three times of day.

// Ammo: `flight` = seconds to reach the target (you must aim ahead of the bird), `drop` = how much it falls on the
// way (px at full depth: aim higher), `radius` = how forgiving a hit is, `pellets` = a fan of shots.
export const SWEET_AMMO = {
  caramella: { name: 'CANDY', flight: 0.18, drop: 0, radius: 1, pellets: 1, spread: 0, reload: 0.35, start: 40, points: 1, effect: 'full', sound: 'pop' },
  confetti: { name: 'SPRINKLES', flight: 0.26, drop: 0, radius: 0.55, pellets: 7, spread: 46, reload: 0.85, start: 14, points: 0.8, effect: 'rainbow', sound: 'confetti' },
  marshmallow: { name: 'MARSHMALLOW', flight: 0.6, drop: 70, radius: 1.7, pellets: 1, spread: 0, reload: 1.1, start: 10, points: 1.6, effect: 'puff', sound: 'fwoomp' },
};
export const AMMO_ORDER = ['caramella', 'confetti', 'marshmallow'];

// Birds: `size` (1 = a duck seen up close), `speed` (px/s at full depth), `path`, `points`, `sound`.
export const BIRDS = {
  anatra: { name: 'DUCK', size: 1, speed: 190, path: 'rise', points: 100, sound: 'quack', colors: { body: '#8b5a36', head: '#2f8a3a', wing: '#c8a06a', beak: '#ffb400' } },
  uccellino: { name: 'LITTLE BIRD', size: 0.5, speed: 310, path: 'zigzag', points: 150, sound: 'tweet', flock: 3, colors: { body: '#3b8de0', head: '#3b8de0', wing: '#1f5fbf', beak: '#ffb400', breast: '#ffd400' } },
  gufo: { name: 'OWL', size: 0.85, speed: 150, path: 'swoop', points: 200, sound: 'hoot', colors: { body: '#8b6a4a', head: '#8b6a4a', wing: '#5a4030', beak: '#ffb400', eyes: '#ffd400' } },
};

// The three levels. `goal` = birds to knock out to pass; stars at goal, 1.5× and 2×. `time` in seconds.
export const BONUS_LEVELS = [
  {
    id: 'B1', name: 'Dawn at the Pond', bird: 'anatra', goal: 10, time: 90, music: 'bonus1', scene: 'dawn',
    intro: 'DAWN AT THE POND: knock out 10 ducks!',
  },
  {
    id: 'B2', name: 'Noon in the Woods', bird: 'uccellino', goal: 14, time: 90, music: 'bonus2', scene: 'noon',
    intro: 'NOON IN THE WOODS: knock out 14 little birds!',
  },
  {
    id: 'B3', name: 'Night of the Owls', bird: 'gufo', goal: 10, time: 100, music: 'bonus3', scene: 'night',
    intro: 'NIGHT OF THE OWLS: knock out 10 owls!',
    // the tree holes of Claude Design's panorama (bonus/night/panorama, 3200×1080): the owls peek out of them
    holes: [[248, 675], [262, 355], [898, 568], [1651, 700], [2310, 701], [2329, 421], [2940, 322], [2970, 662]],
  },
];
