// 90s-style password: the progress fits in a short code to type on another computer.
// Layout (bits): level 4 · bear 2 · difficulty 2 · lives 2 · checkpoint 3 · backpack 1 · weapons 9 · ammo buckets 11×3 ·
// checksum 6 = 62 bits, 13 characters (XXXX-XXXX-XXXXX). More than a JS number holds exactly: BigInt.
// The tables below are a copy of data/ (tests/consistency.test.js keeps them in step): adding to them changes
// every password (scripts/level-passwords.mjs prints the level codes again).

const ALPHABET = 'BCDFGHJKLMNPQRSTVWXZ23456789'; // no vowels (no accidental words), no 0/O/1/I
const BASE = BigInt(ALPHABET.length);
const LENGTH = 13;
const BEARS = ['orsa', 'piccolo', 'grande'];
const START = ['zampata', 'fionda', 'sparaconfetti']; // always owned
const WEAPON_BITS = ['liquirizia', 'gelatina', 'zucchero', 'balestra', 'fizz', 'bfg', 'sputacarpa', 'sparapalloni', 'lanciatorte'];
const AMMO = [['caramelle', 200], ['confetti', 50], ['liquirizie', 50], ['gelatina', 300], ['zuccheroFilato', 50], ['frecce', 300], ['fizz', 300], ['gumball', 300],
  ['acqua', 200], ['palloni', 40], ['torte', 30]];
const Q = 7; // 3-bit ammo buckets (of the normal maximum; a backpack can hold more, the password rounds down)

function checksum(n) {
  let s = 0n;
  for (let v = n; v > 0n; v /= 997n) s = (s * 31n + (v % 997n)) % 64n;
  return s;
}

// The payload as a big number, field after field (the same order for writing and reading).
function pack(fields) {
  let n = 0n;
  for (const [value, bits] of fields) n = (n << BigInt(bits)) + BigInt(Math.max(0, Math.min(2 ** bits - 1, value)));
  return n;
}

const fieldsOf = s => [
  [s.level, 4], [BEARS.indexOf(s.bear), 2], [s.difficulty ?? 1, 2], [s.lives, 2], [s.checkpoint + 1, 3], // -1 = level start
  [s.backpack ? 1 : 0, 1], [WEAPON_BITS.reduce((m, w, i) => m | (s.weapons.includes(w) ? 1 << i : 0), 0), WEAPON_BITS.length],
  ...AMMO.map(([k, max]) => [Math.round((Math.min(max, s.ammo[k] || 0) / max) * Q), 3]),
];

export function encodePassword(save) {
  let n = pack(fieldsOf(save));
  n = (n << 6n) + checksum(n);
  let out = '';
  for (; n > 0n; n /= BASE) out = ALPHABET[Number(n % BASE)] + out;
  return out.padStart(LENGTH, ALPHABET[0]).replace(/^(.{4})(.{4})/, '$1-$2-');
}

export function decodePassword(code) {
  const clean = String(code).toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (clean.length !== LENGTH) return null;
  let n = 0n;
  for (const ch of clean) {
    const d = ALPHABET.indexOf(ch);
    if (d < 0) return null;
    n = n * BASE + BigInt(d);
  }
  const pop = bits => { const v = Number(n & ((1n << BigInt(bits)) - 1n)); n >>= BigInt(bits); return v; };
  const sum = pop(6);
  const ammoQ = AMMO.map(() => pop(3)).reverse();
  const wbits = pop(WEAPON_BITS.length);
  const backpack = pop(1);
  const cp = pop(3) - 1;
  const lives = pop(2);
  const difficulty = pop(2);
  const bear = BEARS[pop(2)];
  const level = pop(4);
  if (n !== 0n || !bear || lives < 1) return null;
  const save = {
    level, bear, difficulty, lives, checkpoint: cp, backpack: !!backpack,
    weapons: [...START, ...WEAPON_BITS.filter((_, i) => wbits & (1 << i))],
    ammo: Object.fromEntries(AMMO.map(([k, max], i) => [k, Math.round((ammoQ[i] / Q) * max)])),
  };
  // the checksum of the same payload, written again
  return checksum(pack(fieldsOf({ ...save, ammo: Object.fromEntries(AMMO.map(([k, max], i) => [k, (ammoQ[i] / Q) * max])) }))) === BigInt(sum) ? save : null;
}
