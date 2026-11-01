// Prints a password for the start of every level, one per bear, to type in PASSWORD in the menu (a level code
// in the 90s way). The bear starts with 3 pillows, the weapons lying in the levels before (the main way: the
// secret E1M9 only counts for itself) with half their sweets, at the difficulty given
// (default: the menu's, It Tickles).
// The codes change when the password tables change (src/core/password.js): print them again then.
// Usage: node scripts/level-passwords.mjs [difficulty 0-3]
import { readFileSync } from 'node:fs';
import { parseLevel } from '../src/core/level.js';
import { encodePassword } from '../src/core/password.js';
import { LIVES } from '../src/core/sleep.js';
import { ITEMS } from '../data/items.js';
import { AMMO, START_WEAPONS, WEAPONS } from '../data/weapons.js';
import { BEARS } from '../data/bears.js';
import { DIFFICULTIES, DEFAULT_DIFFICULTY } from '../data/difficulty.js';
import { DEFS } from '../levels/defs.js';

const difficulty = Number(process.argv[2] ?? DEFAULT_DIFFICULTY);
const weaponsIn = d => parseLevel(readFileSync(new URL(`../levels/${d.file}`, import.meta.url), 'utf8'), d.legend)
  .entities.filter(e => e.type === 'item' && ITEMS[e.id]?.weapon).map(e => ITEMS[e.id].weapon);

// the main way through the episode (next), then the secret level reached from the level that leads to it
const order = [];
for (let i = 0; i !== null && i !== undefined && !order.includes(i); i = DEFS[i].next) order.push(i);
const before = new Map();
order.forEach((i, n) => before.set(i, order.slice(0, n)));
DEFS.forEach((d, i) => { if (!before.has(i)) before.set(i, [...before.get(DEFS.findIndex(x => x.secretNext === i)), DEFS.findIndex(x => x.secretNext === i)]); });

console.log(`Difficulty: ${DIFFICULTIES[difficulty]?.name ?? difficulty}`);
console.log(['Level', ...BEARS.map(b => b.name)].join(' | '));
DEFS.forEach((d, i) => {
  const weapons = [...new Set([...START_WEAPONS, ...before.get(i).flatMap(j => weaponsIn(DEFS[j]))])];
  const ammo = Object.fromEntries(Object.entries(AMMO).map(([k, a]) => {
    const owned = Object.entries(WEAPONS).some(([id, w]) => w.ammo === k && weapons.includes(id));
    return [k, owned ? Math.max(a.start, a.max / 2) : a.start];
  }));
  const codes = BEARS.map(b => encodePassword({ level: i, bear: b.id, difficulty, lives: LIVES, checkpoint: -1, backpack: false, weapons, ammo }));
  console.log([`${d.id} ${d.name}`, ...codes].join(' | '));
});
