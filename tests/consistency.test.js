// Things that must stay in step when content is added to data/: the password format, the sound names, the cheats.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { encodePassword, decodePassword } from '../src/core/password.js';
import { parseLevel } from '../src/core/level.js';
import { SOUNDS } from '../src/audio.js';
import { WEAPONS, AMMO, START_WEAPONS } from '../data/weapons.js';
import { BEARS } from '../data/bears.js';
import { ENEMIES, EFFECTS } from '../data/enemies.js';
import { ITEMS } from '../data/items.js';
import { CHEATS } from '../data/cheats.js';
import { SWEET_AMMO, BIRDS } from '../data/bonus.js';
import { DEFS } from '../levels/defs.js';

test('the password carries every bear, weapon and sweet of data/ (its tables are a copy)', () => {
  for (const bear of BEARS) {
    const save = {
      level: 3, bear: bear.id, difficulty: 2, lives: 2, checkpoint: -1, backpack: false,
      weapons: Object.keys(WEAPONS), ammo: Object.fromEntries(Object.entries(AMMO).map(([k, a]) => [k, a.max])),
    };
    const back = decodePassword(encodePassword(save));
    assert.ok(back, `password for ${bear.id}`);
    assert.equal(back.bear, bear.id);
    assert.deepEqual([...back.weapons].sort(), Object.keys(WEAPONS).sort(), 'a new weapon needs a bit in src/core/password.js');
    for (const [k, a] of Object.entries(AMMO)) assert.equal(back.ammo[k], a.max, `ammo ${k}: same maximum in src/core/password.js`);
  }
  const start = decodePassword(encodePassword({ level: 0, bear: BEARS[0].id, difficulty: 1, lives: 3, checkpoint: -1, weapons: [], ammo: {} }));
  for (const w of START_WEAPONS) assert.ok(start.weapons.includes(w), `${w} is always owned`);
});

test('every level has at most 6 checkpoints (3 bits in the password)', () => {
  for (const d of DEFS) {
    const level = parseLevel(readFileSync(new URL(`../levels/${d.file}`, import.meta.url), 'utf8'), d.legend);
    assert.ok(level.entities.filter(e => e.type === 'checkpoint').length <= 6, d.id);
  }
});

test('every sound named in data/ exists in src/audio.js', () => {
  const names = [
    ...Object.values(WEAPONS).map(w => w.sound),
    ...Object.values(ENEMIES).flatMap(e => Object.values(e.sounds || {})),
    ...Object.values(EFFECTS).map(e => e.sound),
    ...Object.values(ITEMS).map(i => i.sound),
    ...Object.values(SWEET_AMMO).map(a => a.sound),
    ...Object.values(BIRDS).map(b => b.sound),
  ].filter(Boolean);
  for (const n of new Set(names)) assert.ok(SOUNDS[n], `sound "${n}" is missing in src/audio.js`);
});

test('no cheat code ends with another one (the shorter one would always fire first)', () => {
  for (const a of CHEATS) for (const b of CHEATS) {
    if (a !== b) assert.ok(!a.code.endsWith(b.code), `${a.code} ends with ${b.code}`);
  }
});

test('every signpost stands on a floor the bear reaches, and its arrow finds the way to its target', async () => {
  const { progression } = await import('../src/core/level.js');
  const { signDirection } = await import('../src/core/signs.js');
  for (const d of DEFS) {
    const level = parseLevel(readFileSync(new URL(`../levels/${d.file}`, import.meta.url), 'utf8'), d.legend);
    const reach = progression(level, { bossOpens: d.bossOpens }).reach;
    for (const s of d.signs || []) {
      const c = level.at(s.x, s.z);
      assert.ok(c && !c.wall && !c.door, `${d.id} sign "${s.text}" at ${s.x},${s.z} is not on a floor`);
      assert.ok(reach.has(`${s.x},${s.z}`), `${d.id} sign "${s.text}" at ${s.x},${s.z} cannot be reached`);
      assert.ok(!level.entities.some(e => e.cx === s.x && e.cz === s.z), `${d.id} sign "${s.text}" stands on something`);
      if (s.to) assert.notEqual(signDirection(level, s), null, `${d.id} sign "${s.text}": no way to ${s.to}`);
    }
  }
});
