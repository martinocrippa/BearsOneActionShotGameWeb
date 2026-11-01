// 90s-style password: the progress fits in a short code to type on another computer.
// Layout (bits): level 4 · bear 2 · difficulty 2 · lives 2 · checkpoint 3 · backpack 1 · weapons 6 · ammo buckets 8×3 ·
// checksum 6 = 50 bits, 11 characters (XXXX-XXXX-XXX).

const ALPHABET = 'BCDFGHJKLMNPQRSTVWXZ23456789'; // no vowels (no accidental words), no 0/O/1/I
const BEARS = ['orsa', 'piccolo', 'grande'];
const START = ['zampata', 'fionda', 'sparaconfetti']; // always owned
const WEAPON_BITS = ['liquirizia', 'gelatina', 'zucchero', 'balestra', 'fizz', 'bfg'];
const AMMO = [['caramelle', 200], ['confetti', 50], ['liquirizie', 50], ['gelatina', 300], ['zuccheroFilato', 50], ['frecce', 300], ['fizz', 300], ['gumball', 300]];
const Q = 7; // 3-bit ammo buckets (of the normal maximum; a backpack can hold more, the password rounds down)

function checksum(n) {
  let s = 0;
  let v = n;
  while (v > 0) { s = (s * 31 + (v % 997)) % 64; v = Math.floor(v / 997); }
  return s;
}

export function encodePassword(save) {
  let n = 0;
  const push = (value, bits) => { n = n * 2 ** bits + Math.max(0, Math.min(2 ** bits - 1, value)); };
  push(save.level, 4);
  push(BEARS.indexOf(save.bear), 2);
  push(save.difficulty ?? 1, 2);
  push(save.lives, 2);
  push(save.checkpoint + 1, 3); // -1 = level start
  push(save.backpack ? 1 : 0, 1);
  push(WEAPON_BITS.reduce((m, w, i) => m | (save.weapons.includes(w) ? 1 << i : 0), 0), 6);
  for (const [k, max] of AMMO) push(Math.round((Math.min(max, save.ammo[k] || 0) / max) * Q), 3);
  push(checksum(n), 6);
  let out = '';
  while (n > 0) { out = ALPHABET[n % ALPHABET.length] + out; n = Math.floor(n / ALPHABET.length); }
  return out.padStart(11, ALPHABET[0]).replace(/(.{4})(?=.)/g, '$1-');
}

export function decodePassword(code) {
  const clean = String(code).toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!clean) return null;
  let n = 0;
  for (const ch of clean) {
    const d = ALPHABET.indexOf(ch);
    if (d < 0) return null;
    n = n * ALPHABET.length + d;
  }
  const pop = bits => { const v = n % 2 ** bits; n = Math.floor(n / 2 ** bits); return v; };
  const sum = pop(6);
  const ammoQ = AMMO.map(() => pop(3)).reverse();
  const wbits = pop(6);
  const backpack = pop(1);
  const cp = pop(3) - 1;
  const lives = pop(2);
  const difficulty = pop(2);
  const bear = BEARS[pop(2)];
  const level = pop(4);
  if (n !== 0 || !bear || lives < 1) return null;
  // Re-encode the payload to check the checksum.
  let payload = 0;
  const push = (value, bits) => { payload = payload * 2 ** bits + value; };
  push(level, 4); push(BEARS.indexOf(bear), 2); push(difficulty, 2); push(lives, 2); push(cp + 1, 3); push(backpack, 1); push(wbits, 6);
  for (const q of ammoQ) push(q, 3);
  if (checksum(payload) !== sum) return null;
  return {
    level, bear, difficulty, lives, checkpoint: cp, backpack: !!backpack,
    weapons: [...START, ...WEAPON_BITS.filter((_, i) => wbits & (1 << i))],
    ammo: Object.fromEntries(AMMO.map(([k, max], i) => [k, Math.round((ammoQ[i] / Q) * max)])),
  };
}
