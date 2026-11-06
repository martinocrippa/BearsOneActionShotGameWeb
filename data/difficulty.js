// Difficulty levels, as in DOOM ("I'm too young to die" … "Ultra-Violence"). Names from Claude Design's
// screen (game text is in English). Every value multiplies the normal game (1 = as designed).
// sleep: how much a hit makes you sleepy · projSpeed: how fast opponents' shots fly
// fireRate: pause between their shots · spread: how much they miss · mud: sleepiness in the mud
// move / turn: how fast the bear walks / turns (the little ones steer better slowly)
// ammo: sweets found in boxes · crowd: share of the opponents placed in the map that show up (bosses always do)
// desc: a note for whoever edits this file (not shown in the game)
export const DIFFICULTIES = [
  { id: 'dormiglione', name: 'Sleepy Cub', desc: 'Per imparare: colpi lenti e leggeri, tanti dolci.', sleep: 0.35, projSpeed: 0.55, fireRate: 1.9, spread: 2.2, mud: 0.3, ammo: 2, crowd: 0.6, move: 0.7, turn: 0.72 },
  { id: 'solletico', name: 'It Tickles', desc: 'Facile: si schiva bene, si gioca in tranquillità.', sleep: 0.6, projSpeed: 0.75, fireRate: 1.4, spread: 1.6, mud: 0.6, ammo: 1.5, crowd: 0.8, move: 0.85, turn: 0.86 },
  { id: 'miele', name: 'Gimme Honey', desc: 'Normale: come Doom, bisogna schivare.', sleep: 1, projSpeed: 1, fireRate: 1, spread: 1, mud: 1, ammo: 1, crowd: 1 },
  { id: 'glicemia', name: 'Ultra-Sugar', desc: 'Difficile: per orsi veri.', sleep: 1.4, projSpeed: 1.15, fireRate: 0.8, spread: 0.7, mud: 1.3, ammo: 1, crowd: 1 },
];

export const DEFAULT_DIFFICULTY = 1; // the menu starts on "It Tickles": the kids begin on the easy side
export const difficultyAt = i => DIFFICULTIES[i] ?? DIFFICULTIES[DEFAULT_DIFFICULTY];
