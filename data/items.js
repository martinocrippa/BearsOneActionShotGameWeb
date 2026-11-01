// Things to pick up. `sleep` < 0 wakes the bear up (honey is DOOM's medikit), `armor` (hot chocolate) takes a
// share of every hit, `cap` = how high this item can fill it. `fit` = height of the drawing in metres.
export const ITEMS = {
  miele: { name: 'Miele', sleep: -12, msg: 'HONEY! Wide awake!', sound: 'pickup', fit: 0.5 },
  mieleGrande: { name: 'Barattolone di miele', sleep: -35, msg: 'BIG JAR OF HONEY! Super awake!', sound: 'pickupBig', fit: 0.75 },
  superMiele: { name: 'Super miele', sleep: -100, always: true, msg: 'SUPER HONEY! Totally, completely awake!', sound: 'pickupBig', fit: 0.8 },
  // Hot chocolate = DOOM's armour: it takes a share of the sleepiness of every hit.
  cioccolata: { name: 'Cioccolata calda', armor: 50, cap: 100, msg: 'HOT CHOCOLATE! Hits make you less sleepy.', sound: 'pickupBig', fit: 0.5 },
  tazzona: { name: 'Tazzona di cioccolata', armor: 200, cap: 200, msg: 'HUGE MUG OF CHOCOLATE! Hits barely tickle.', sound: 'pickupBig', fit: 0.65 },
  zainetto: { name: 'Zainetto', backpack: true, msg: 'A BACKPACK! Room for twice the sweets.', sound: 'pickupBig', fit: 0.6 },
  stivali: { name: 'Stivali di gomma', boots: 30, msg: 'RUBBER BOOTS! Mud and water cannot make you sleepy.', sound: 'pickupBig', fit: 0.55 },
  mappa: { name: 'Mappa', map: true, msg: 'A MAP OF THE LEVEL! Hold TAB to look at it.', sound: 'pickupBig', fit: 0.45 },

  // ammo
  caramelle: { name: 'Caramelle', ammo: 'caramelle', amount: 15, msg: 'A handful of candies.', sound: 'pickup', fit: 0.5 },
  confetti: { name: 'Confetti', ammo: 'confetti', amount: 6, msg: 'A box of sprinkles.', sound: 'pickup', fit: 0.45 },
  liquirizie: { name: 'Liquirizie', ammo: 'liquirizie', amount: 8, msg: 'A box of licorice wheels.', sound: 'pickup', fit: 0.45 },
  gelatina: { name: 'Gelatina', ammo: 'gelatina', amount: 40, msg: 'A jar of green jelly.', sound: 'pickup', fit: 0.55 },
  zuccheroFilato: { name: 'Zucchero filato', ammo: 'zuccheroFilato', amount: 2, msg: 'Two clouds of cotton candy.', sound: 'pickup', fit: 0.7 },
  frecce: { name: 'Frecce di zucchero', ammo: 'frecce', amount: 40, msg: 'A quiver of sugar arrows.', sound: 'pickup', fit: 0.6 },
  fizz: { name: 'Bombola FIZZ', ammo: 'fizz', amount: 60, msg: 'A bottle of FIZZ.', sound: 'pickup', fit: 0.6 },
  gumball: { name: 'Gumball', ammo: 'gumball', amount: 40, msg: 'A jar of gumballs.', sound: 'pickup', fit: 0.55 },

  // weapons (picked up from the ground)
  sparaGelatina: { name: 'Spara-gelatina', weapon: 'gelatina', ammo: 'gelatina', amount: 60, msg: 'YOU GOT THE JELLY BLASTER! (5)', sound: 'weapon', fit: 0.5 },
  spLiquirizia: { name: 'Spara-liquirizie', weapon: 'liquirizia', ammo: 'liquirizie', amount: 8, msg: 'YOU GOT THE LICORICE LAUNCHER! (4)', sound: 'weapon', fit: 0.5 },
  spZucchero: { name: 'Lancia-zucchero-filato', weapon: 'zucchero', ammo: 'zuccheroFilato', amount: 4, msg: 'YOU GOT THE COTTON CANDY CANNON! (6)', sound: 'weapon', fit: 0.6 },
  spBalestra: { name: 'Balestra', weapon: 'balestra', ammo: 'frecce', amount: 40, msg: 'YOU GOT THE SUGAR CROSSBOW! (7)', sound: 'weapon', fit: 0.5 },
  spFizz: { name: 'Estintore FIZZ', weapon: 'fizz', ammo: 'fizz', amount: 80, msg: 'YOU GOT THE FIZZ EXTINGUISHER! (8)', sound: 'weapon', fit: 0.65 },
  spBfg: { name: 'B.F.G.', weapon: 'bfg', ammo: 'gumball', amount: 40, msg: 'YOU GOT THE B.F.G.! BIG FAT GUMBALL! (9)', sound: 'weapon', fit: 0.7 },
};

// Keys: they change with the place (DOOM's red/blue/yellow cards). `color` = the lock on the doors and the HUD.
export const KEYS = {
  ghianda: { name: 'GOLDEN ACORN', color: '#ffd400', popup: 'acorn' },
  piuma_blu: { name: 'BLUE QUAIL FEATHER', color: '#3b8de0' },
  piuma_rossa: { name: 'RED QUAIL FEATHER', color: '#e3262b' },
  fischietto: { name: 'WHISTLE', color: '#c0c0c0' },
  cartellino: { name: 'YELLOW CARD', color: '#ffd400' },
  campanella: { name: 'SCHOOL BELL', color: '#f0a81e' },
  mazzo_chiavi: { name: "JANITOR'S KEYS", color: '#9c968a' },
  gessetto_rosso: { name: 'RED CHALK', color: '#e0503c' },
  gessetto_blu: { name: 'BLUE CHALK', color: '#3b8de0' },
  castagna_oro: { name: 'GOLDEN CHESTNUT', color: '#ffd400' },
  chiave_ferro: { name: 'IRON KEY', color: '#6b6b6b' },
  biglietto: { name: 'FERRY TICKET', color: '#ff7a12' },
  lanterna: { name: 'LANTERN', color: '#ffd74a' },
  pallone: { name: 'FOOTBALL', color: '#ffffff' },
  skipass: { name: 'SKI PASS', color: '#3b8de0' },
};
for (const [id, k] of Object.entries(KEYS)) {
  ITEMS[id] ??= { name: k.name, key: id, msg: `YOU GOT THE ${k.name}!`, popup: k.popup, sound: 'key', fit: 0.6 };
}
ITEMS.ghianda.fit = 0.65;

// Decorations: `r` = collision radius in metres (0 = you walk through it), `h` = height of the drawing in metres,
// `color` = main colour of the coded fallback drawing,
// `pop` = it bursts into confetti when the bear hits it, like DOOM's barrels: opponents within `radius` metres get
// up to `damage` (the confetti effect: puffed-up cheeks), and other poppers nearby burst too.
export const DECOR = {
  // E1M1 forest
  abete: { r: 0.6, h: 5.5 },
  betulla: { r: 0.4, h: 5 },
  cespuglio: { r: 0.6, h: 1.4 },
  funghi: { r: 0, h: 0.7 },
  cartello: { r: 0.25, h: 1.9 },
  sasso: { r: 0.5, h: 0.8, color: '#9c968a' },
  ceppo: { r: 0.45, h: 0.7, color: '#8b5a36' },
  // E1M2 park
  tartarughe: { r: 0.5, h: 0.6, color: '#3f6b32' },
  canne: { r: 0, h: 2.2, color: '#8cc85a' },
  balla: { r: 0.7, h: 1.2, color: '#e2c060' },
  pozzo: { r: 0.8, h: 2, color: '#a8503c' },
  trattore: { r: 1.2, h: 2.4, color: '#e3262b' },
  albero_autunno: { r: 0.5, h: 6, color: '#c27a2e' },
  panchina: { r: 0.6, h: 0.9, color: '#8b5a36' },
  cestino: { r: 0.3, h: 1, color: '#3f6b32', pop: { radius: 2.5, damage: 70 } },
  // E1M3 pitch
  porta_calcio: { r: 0, h: 2.5, color: '#f4f4ee' },
  panchina_coperta: { r: 0.9, h: 2.2, color: '#14161a' },
  cassa_palloni: { r: 0.5, h: 0.8, color: '#ff7a12' },
  faro: { r: 0.4, h: 9, color: '#9c968a' },
  lampione: { r: 0.25, h: 4, color: '#14161a' },
  coni: { r: 0, h: 0.5, color: '#ff7a12' },
  campanile: { r: 1, h: 12, color: '#a8503c' },
  armadietti: { r: 0.6, h: 2, color: '#9c968a' },
  // E1M4 school
  banco: { r: 0.6, h: 1.1, color: '#f0a81e' },
  sedia: { r: 0.35, h: 1, color: '#e0503c' },
  lucidatrice: { r: 0.45, h: 1.2, color: '#ff7a12' },
  auto: { r: 1.3, h: 1.6, color: '#3b8de0' },
  canestro: { r: 0.4, h: 4, color: '#ff7a12' },
  // E1M5 classroom (giant)
  gamba_banco: { r: 0.5, h: 8, color: '#9c968a' },
  matita: { r: 0, h: 1.2, color: '#ffd74a' },
  temperino: { r: 0.8, h: 1.6, color: '#3b8de0' },
  gomma: { r: 0.9, h: 1.2, color: '#ff8fc8' },
  scotch: { r: 1.2, h: 2.6, color: '#d8d0b0' },
  pennarelli: { r: 0.8, h: 4, color: '#e0503c' },
  merendina: { r: 0.9, h: 1.3, color: '#f0a81e' },
  zaino: { r: 1.2, h: 3.2, color: '#3b8de0' },
  // E1M6 castle
  castagno: { r: 0.7, h: 7, color: '#3f6b32' },
  ricci: { r: 0, h: 0.4, color: '#8cc85a' },
  maesta: { r: 0.6, h: 2.6, color: '#8a7f6c' },
  pozzo_pietra: { r: 0.8, h: 2, color: '#8a7f6c' },
  torcia: { r: 0.2, h: 2.2, color: '#ff7a12' },
  asino: { r: 0.8, h: 1.8, color: '#9c968a' },
  trattorino: { r: 1.2, h: 2, color: '#ff7a12' },
  spaventapasseri: { r: 0.4, h: 2.4, color: '#e2c060' },
  cesto_castagne: { r: 0.4, h: 0.7, color: '#8b5a36' },
  // E1M7 river
  pioppo: { r: 0.5, h: 8, color: '#e0a33a' },
  ciminiera: { r: 1.2, h: 16, color: '#e3262b' },
  lampione_ferro: { r: 0.25, h: 4, color: '#3a3a3a' },
  barca: { r: 1.2, h: 1.2, color: '#8b5a36' },
  // E1M8 stadium
  bandierina: { r: 0, h: 1.8, color: '#1e5bd8' },
  tabellone: { r: 1, h: 6, color: '#14161d' },
  // E1M9 snow
  abete_neve: { r: 0.6, h: 6, color: '#2f8a3a' },
  pupazzo: { r: 0.5, h: 1.8, color: '#f4f7fb' },
  pilone: { r: 0.6, h: 10, color: '#9c968a' },
  seggiolino: { r: 0, h: 1.6, color: '#e3262b' },
  gatto_neve: { r: 1.6, h: 2.6, color: '#ff7a12' },
  paletto: { r: 0, h: 1.6, color: '#3b8de0' },
  fontana: { r: 0.6, h: 1.4, color: '#8d8578' },
  arco: { r: 0, h: 7, color: '#3a3a3a' },
};
