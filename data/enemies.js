// Opponents. They never hurt the bear: their shots fill the SONNO meter.
// `height` in metres; `scale` = metres covered by the drawing's canvas (512 px; the boss draws on 1024).
// attack: `projectile` (what they throw), `count`/`spread` (a fan), `burst` (shots in a row), `melee` (no
// projectile: they must touch you), `dive` (flies straight at you), `trap` (ties the bear up for a moment),
// `splash` (area). `alt` = a second attack used every other time (the Gallo).
// `fly` = metres above the floor when flying. `placeholder` = colours of the coded drawing until the real one.
export const ENEMIES = {
  // Scoiattolo: spara-marmellata d'albicocca (orange, never red: it must not look like blood).
  scoiattolo: {
    name: 'Scoiattolo', doom: 'Zombieman', hp: 20, speed: 3.4, radius: 0.35, height: 1.15,
    sight: 24, painChance: 0.85, zigzag: false,
    attack: { projectile: 'marmellata', range: 18, windup: 0.35, cooldown: [1.3, 2.4], speed: 16, sleep: 7, spread: 0.05 },
    sounds: { alert: 'squeak', pain: 'squeak', knock: 'squeak', shoot: 'squirt' },
  },
  donnola: {
    name: 'Donnola', doom: 'Shotgun Guy', hp: 30, speed: 3.6, radius: 0.35, height: 1.2,
    sight: 24, painChance: 0.7,
    attack: { projectile: 'zuppa', range: 14, windup: 0.4, cooldown: [1.5, 2.6], speed: 15, sleep: 5, spread: 0.12, count: 3 },
    sounds: { alert: 'squeak', pain: 'squeak', knock: 'squeak', shoot: 'slosh' },
    placeholder: { fur: '#9a6239', belly: '#f1d7ae', accent: '#f4ecd8', ears: 'round', tail: 'long', thin: true },
  },
  volpe: {
    name: 'Volpe', doom: 'Chaingunner', hp: 70, speed: 3, radius: 0.4, height: 1.4,
    sight: 28, painChance: 0.65,
    attack: { projectile: 'broccolo', range: 22, windup: 0.5, cooldown: [1.4, 2.4], speed: 18, sleep: 4, spread: 0.06, burst: 4 },
    sounds: { alert: 'yip', pain: 'yip', knock: 'yip', shoot: 'chug' },
    placeholder: { fur: '#ff5a1f', belly: '#f4ecd8', accent: '#111111', ears: 'pointy', tail: 'bushy' },
  },
  puzzola: {
    name: 'Puzzola', doom: 'Imp', hp: 55, speed: 2.8, radius: 0.4, height: 1.3,
    sight: 26, painChance: 0.6, zigzag: true,
    attack: { projectile: 'camomilla', range: 22, windup: 0.55, cooldown: [1.7, 2.8], speed: 12, sleep: 14, spread: 0.02 },
    sounds: { alert: 'hiss', pain: 'hiss', knock: 'hiss', shoot: 'throw' },
  },
  cinghialotto: {
    name: 'Cinghialotto', doom: 'Pinky', hp: 150, speed: 6.2, radius: 0.55, height: 1.3,
    sight: 22, painChance: 0.7,
    attack: { melee: true, range: 1.7, windup: 0.3, cooldown: [0.8, 1.2], sleep: 12 },
    sounds: { alert: 'grunt', pain: 'grunt', knock: 'grunt', shoot: 'whump' },
    placeholder: { fur: '#6b4a2f', belly: '#c8a06a', accent: '#f4ecd8', ears: 'small', tail: 'curl', stripes: true, wide: true },
  },
  oca: {
    name: 'Oca', doom: 'Cacodemon', hp: 200, speed: 2.2, radius: 0.55, height: 1.3, fly: 2.2,
    sight: 30, painChance: 0.5,
    attack: { projectile: 'schiuma', range: 26, windup: 0.6, cooldown: [1.8, 3], speed: 10, sleep: 16, spread: 0.03 },
    sounds: { alert: 'honk', pain: 'honk', knock: 'honk', shoot: 'throw' },
    placeholder: { fur: '#f4ecd8', belly: '#ffffff', accent: '#ff7a12', ears: 'none', tail: 'none', bird: true, cap: '#3f6b32' },
  },
  papero: {
    name: 'Papero in picchiata', doom: 'Lost Soul', hp: 60, speed: 3, radius: 0.35, height: 0.8, fly: 1.3,
    sight: 26, painChance: 1,
    attack: { dive: true, range: 14, windup: 0.5, cooldown: [1.8, 2.8], speed: 13, sleep: 8 },
    sounds: { alert: 'quack', pain: 'quack', knock: 'quack', shoot: 'quack' },
    placeholder: { fur: '#ffd400', belly: '#fff3a0', accent: '#9c968a', ears: 'none', tail: 'none', bird: true, cap: '#9c968a', small: true },
  },
  gallo: {
    name: 'Gallo generale', doom: 'Baron of Hell', hp: 600, speed: 2.6, radius: 0.5, height: 1.75,
    sight: 30, painChance: 0.3, miniBoss: true,
    attack: { projectile: 'lacci', range: 22, windup: 0.5, cooldown: [1.2, 2], speed: 15, sleep: 10, spread: 0.03, trap: 1.4 },
    alt: { projectile: 'nota', range: 26, windup: 0.7, cooldown: [1.4, 2.2], speed: 9, sleep: 14, spread: 0.08, count: 3, homing: 1.2 },
    sounds: { alert: 'crow', pain: 'crow', knock: 'crow', shoot: 'throw' },
    placeholder: { fur: '#f4ecd8', belly: '#ffffff', accent: '#e3262b', ears: 'none', tail: 'plume', bird: true, cap: '#1f5fbf', tall: true },
  },
  maiale: {
    name: 'Maiale del Brescia', doom: 'Cyberdemon', hp: 2600, speed: 2.1, radius: 1.1, height: 3.5, scale: 4.4, canvas: 1024,
    sight: 50, painChance: 0.04, boss: true,
    attack: { projectile: 'biberon', range: 45, windup: 0.6, cooldown: [1.6, 2.4], speed: 15, sleep: 22, spread: 0.02, burst: 3, splash: { radius: 2.6, sleep: 10 } },
    sounds: { alert: 'oink', pain: 'oink', knock: 'oink', shoot: 'launch' },
    placeholder: { fur: '#f2a0b4', belly: '#f8c8d4', accent: '#1f5fbf', ears: 'pig', tail: 'curl', shirt: '#1f5fbf', vee: true, wide: true },
  },
};

// Knock-out effects (shared by every opponent).
// `pose` = which drawing (enemies/<kind>/<pose>_f_n), `overlay` = an fx drawing laid on top, `word` = the comic
// line above the head, `float` = rises to the sky and fades (angel), `vanish` = bursts into sweets and disappears.
export const EFFECTS = {
  stordito: { label: 'stordito', pose: 'stordito', frames: 2, word: '@#!?', sound: 'knock' },
  panciaPiena: { label: 'pancia piena', pose: 'panciaPiena', word: 'BURP!', sound: 'burp' },
  guance: { label: 'guance gonfie', pose: 'guance', word: 'MMPF!', sound: 'burp' },
  legato: { label: 'legato con la liquirizia', pose: 'legato', word: 'GRRR!', sound: 'twang' },
  gelatina: { label: 'nella gelatina', pose: 'gelatina', word: 'GLOP', sound: 'glop' },
  ragnatela: { label: 'incollato nello zucchero filato', pose: 'stordito', overlay: 'ragnatela', word: 'STUCK!', sound: 'glop' },
  angioletto: { label: 'angioletto', pose: 'pain', overlay: 'ali', overlayFrames: 2, float: true, word: 'BYE!', sound: 'angel' },
  rutto: { label: 'rutto di cola', pose: 'stordito', frames: 2, overlay: 'bollicine', overlayFrames: 2, word: 'BUUURP!', sound: 'burp' },
  esplosione: { label: 'esploso in dolciumi', pose: 'pain', vanish: true, word: 'POP!', sound: 'bfg' },
};
