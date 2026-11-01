// The bear's weapons. `effect` is what happens to an opponent knocked out by this weapon.
// To add a weapon: add an entry here, its drawings, and (if needed) a new effect in data/enemies.js.
// Projectiles: `count` pellets per shot, `spread` (radians), `ttl` seconds of flight, `size` metres of the
// 256 px drawing, `splash` = area knock-out where it lands { radius, damage }. `face` = the bear's HUD face while
// firing it (hud/face_<bear>/<face>).
export const WEAPONS = {
  zampata: {
    slot: 1, name: 'Zampata', ammo: null, cooldown: 0.45,
    melee: { range: 2.1, cone: 0.6, damage: [14, 24], push: 4 },
    effect: 'stordito', sound: 'whoosh',
  },
  fionda: {
    slot: 2, name: 'Fionda di caramelle', ammo: 'caramelle', cost: 1, cooldown: 0.38,
    projectile: { kind: 'caramella', speed: 40, damage: [10, 15], spread: 0.008, count: 1 },
    effect: 'panciaPiena', sound: 'pop',
  },
  sparaconfetti: {
    slot: 3, name: 'Fucile sparaconfetti', ammo: 'confetti', cost: 1, cooldown: 0.85,
    projectile: { kind: 'confetti', speed: 36, damage: [6, 10], spread: 0.085, count: 7 },
    effect: 'guance', sound: 'confetti',
  },
  // DOOM's super shotgun: two barrels, a wide fan of licorice wheels.
  liquirizia: {
    slot: 4, name: 'Spara-liquirizie', ammo: 'liquirizie', cost: 2, cooldown: 1.15,
    projectile: { kind: 'rondella', speed: 34, damage: [7, 11], spread: 0.15, count: 12 },
    effect: 'legato', sound: 'twang', frames: { idle: 'idle_1', fire: [['fire_1', 120], ['reload_1', 420]] },
  },
  gelatina: {
    slot: 5, name: 'Spara-gelatina', ammo: 'gelatina', cost: 1, cooldown: 0.1,
    projectile: { kind: 'gelatina', speed: 30, damage: [5, 8], spread: 0.03, count: 1 },
    effect: 'gelatina', sound: 'glop',
  },
  // DOOM's rocket launcher: a slow cloud of cotton candy that sticks everybody near where it lands.
  zucchero: {
    slot: 6, name: 'Lancia-zucchero-filato', ammo: 'zuccheroFilato', cost: 1, cooldown: 0.8,
    projectile: { kind: 'nuvola', speed: 20, damage: [50, 70], spread: 0, count: 1, size: 1.3, splash: { radius: 3, damage: [30, 50] } },
    effect: 'ragnatela', sound: 'fwoomp', frames: { idle: 'idle_1', fire: [['fire_1', 120], ['recoil_1', 200]] },
  },
  // DOOM's plasma gun: fast sugar arrows. The knocked-out opponent grows wings and flies to the sky.
  balestra: {
    slot: 7, name: 'Balestra di zucchero', ammo: 'frecce', cost: 1, cooldown: 0.13,
    projectile: { kind: 'freccia', speed: 46, damage: [8, 13], spread: 0.02, count: 1 },
    effect: 'angioletto', sound: 'zip', frames: { idle: 'idle_1', fire: [['fire_1', 50], ['fire_2', 60]] },
  },
  // DOOM's chainsaw: a short spray of fizzy cola. The opponent burps and stays dazed among the bubbles.
  fizz: {
    slot: 8, name: 'Estintore FIZZ', ammo: 'fizz', cost: 1, cooldown: 0.09,
    projectile: { kind: 'fizz', speed: 13, damage: [3, 5], spread: 0.13, count: 2, ttl: 0.4, size: 1.1 },
    effect: 'rutto', sound: 'fizz', face: 'fizz', frames: { idle: 'idle_1', fire: [['spray_1', 45], ['spray_2', 45]] },
  },
  // DOOM's BFG 9000: a giant gumball. Everybody near where it lands bursts into sweets and vanishes.
  bfg: {
    slot: 9, name: 'B.F.G. Big Fat Gumball', ammo: 'gumball', cost: 40, cooldown: 1.6, charge: 0.6,
    projectile: { kind: 'gumball', speed: 22, damage: [300, 400], spread: 0, count: 1, size: 2.2, splash: { radius: 9, damage: [150, 260] } },
    effect: 'esplosione', sound: 'bfg', frames: { idle: 'idle_1', fire: [['charge_1', 600], ['fire_1', 300]] },
  },

  // Bonus weapons (key 0, pressed again for the next one): won in the bonus rooms' tricks (`trick` in a level's
  // definition, data/tricks.js). `bounce` = times a shot bounces off the walls, `lob` = gravity of a shot thrown in
  // an arc (m/s²).
  // The golden carp held like a hose: short squirts of water. The opponent ends up soaked, sneezing.
  sputacarpa: {
    slot: 0, bonus: true, name: 'Sputa-carpa', ammo: 'acqua', cost: 1, cooldown: 0.14,
    projectile: { kind: 'acqua', speed: 17, damage: [6, 9], spread: 0.07, count: 2, ttl: 0.6, size: 1 },
    effect: 'fradicio', sound: 'splash', frames: { idle: 'idle_1', fire: [['fire_1', 60], ['fire_2', 80]] },
  },
  // A home-made cannon of footballs that bounce off the walls. The opponent ends up tangled in the goal net.
  sparapalloni: {
    slot: 0, bonus: true, name: 'Sparapalloni', ammo: 'palloni', cost: 1, cooldown: 0.55,
    projectile: { kind: 'pallone', speed: 21, damage: [30, 42], spread: 0.02, count: 1, ttl: 2.5, size: 0.9, bounce: 3 },
    effect: 'inRete', sound: 'boing', frames: { idle: 'idle_1', fire: [['fire_1', 90], ['fire_2', 140]] },
  },
  // A spoon catapult: cream pies thrown in an arc, a little splash where they land. A pie in the face.
  lanciatorte: {
    slot: 0, bonus: true, name: 'Lancia-torte', ammo: 'torte', cost: 1, cooldown: 0.8,
    projectile: { kind: 'torta', speed: 15, damage: [45, 60], spread: 0.02, count: 1, ttl: 3, size: 1.1, lob: 9, splash: { radius: 1.8, damage: [25, 40] } },
    effect: 'torta', sound: 'pie', frames: { idle: 'idle_1', fire: [['fire_1', 120], ['fire_2', 200]] },
  },
};

// `max` doubles with the backpack (zainetto).
export const AMMO = {
  caramelle: { max: 200, start: 50, label: 'CANDIES' },
  confetti: { max: 50, start: 12, label: 'SPRINKLES' },
  liquirizie: { max: 50, start: 0, label: 'LICORICE' },
  gelatina: { max: 300, start: 0, label: 'JELLY' },
  zuccheroFilato: { max: 50, start: 0, label: 'COTTON CANDY' },
  frecce: { max: 300, start: 0, label: 'SUGAR ARROWS' },
  fizz: { max: 300, start: 0, label: 'FIZZ' },
  gumball: { max: 300, start: 0, label: 'GUMBALLS' },
  // the bonus weapons'
  acqua: { max: 200, start: 0, label: 'WATER' },
  palloni: { max: 40, start: 0, label: 'BALLS' },
  torte: { max: 30, start: 0, label: 'PIES' },
};

export const START_WEAPONS = ['zampata', 'fionda', 'sparaconfetti'];
export const weaponBySlot = slot => Object.keys(WEAPONS).find(k => WEAPONS[k].slot === slot);
