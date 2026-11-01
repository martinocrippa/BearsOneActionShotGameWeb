import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseLevel, validateLevel, progression } from '../src/core/level.js';
import { DEFS } from '../levels/defs.js';
import { ITEMS, DECOR, KEYS } from '../data/items.js';
import { ENEMIES } from '../data/enemies.js';
import { SONGS } from '../src/music.js';

const load = d => parseLevel(readFileSync(new URL(`../levels/${d.file}`, import.meta.url), 'utf8'), d.legend);

test('Episode 1 has nine levels in order, the secret one reached from E1M3 and leading back to E1M4', () => {
  assert.deepEqual(DEFS.map(d => d.id), ['E1M1', 'E1M2', 'E1M3', 'E1M4', 'E1M5', 'E1M6', 'E1M7', 'E1M8', 'E1M9']);
  DEFS.slice(0, 7).forEach((d, i) => assert.equal(d.next, i + 1, `${d.id} → next`));
  assert.equal(DEFS[7].next, null, 'E1M8 ends the episode');
  assert.equal(DEFS[2].secretNext, 8);
  assert.equal(DEFS[8].next, 3);
});

for (const d of DEFS) {
  test(`${d.id} ${d.name}: valid, everything exists, finishable in order`, () => {
    const level = load(d);
    assert.deepEqual(validateLevel(level), []);
    for (const e of level.entities) {
      if (e.type === 'item') assert.ok(ITEMS[e.id], `unknown item ${e.id}`);
      if (e.type === 'enemy') assert.ok(ENEMIES[e.id], `unknown enemy ${e.id}`);
      if (e.type === 'decor') assert.ok(DECOR[e.id], `unknown decor ${e.id}`);
    }
    for (const k of d.legend.keys || []) assert.ok(KEYS[k], `unknown key ${k}`);
    assert.ok(SONGS[d.music], `unknown music ${d.music}`);
    const run = progression(level, { bossOpens: d.bossOpens || '' });
    assert.ok(run.exit, 'the exit can be reached');
    if (d.secretNext !== undefined && d.secretNext !== null) assert.ok(run.secretExit, 'the secret exit can be reached');
    assert.deepEqual(run.unreached.map(e => `${e.type} ${e.id || ''} ${e.cx},${e.cz}`), []);
  });
}

test('the boss is in E1M8 and its exit only opens when it falls asleep', () => {
  const d = DEFS[7], level = load(d);
  assert.equal(level.entities.filter(e => e.id === 'maiale').length, 1);
  assert.ok(progression(level, { bossOpens: d.bossOpens }).exit);
  assert.ok(!progression(level, { bossOpens: '' }).exit);
});

test('every weapon can be found in the episode', () => {
  const found = new Set(DEFS.flatMap(d => load(d).entities.filter(e => e.type === 'item' && ITEMS[e.id].weapon).map(e => ITEMS[e.id].weapon)));
  for (const w of ['liquirizia', 'gelatina', 'zucchero', 'balestra', 'fizz', 'bfg']) assert.ok(found.has(w), w);
});

test('the training level (LEARN) is valid, finishable, explains every room and is not part of the episode', async () => {
  const { default: t } = await import('../levels/defs/training.js');
  const level = load(t);
  assert.deepEqual(validateLevel(level), []);
  const run = progression(level);
  assert.ok(run.exit);
  assert.deepEqual(run.unreached.map(e => `${e.type} ${e.id || ''}`), []);
  assert.ok(t.training && !DEFS.includes(t));
  const said = new Set(level.cells.filter(c => c.say).map(c => c.ch));
  assert.ok(said.size >= 9, 'one instruction per room');
});

test('SWEET SHOT: three bonus levels, each with its bird, its scene and its music; three sweets', async () => {
  const { BONUS_LEVELS, BIRDS, SWEET_AMMO, AMMO_ORDER } = await import('../data/bonus.js');
  assert.equal(BONUS_LEVELS.length, 3);
  assert.deepEqual(BONUS_LEVELS.map(l => l.scene), ['dawn', 'noon', 'night']);
  for (const l of BONUS_LEVELS) {
    assert.ok(BIRDS[l.bird], l.bird);
    assert.ok(SONGS[l.music], l.music);
    assert.ok(l.goal > 0 && l.time > 30);
  }
  assert.deepEqual(AMMO_ORDER, ['caramella', 'confetti', 'marshmallow']);
  for (const k of AMMO_ORDER) assert.ok(SWEET_AMMO[k].start > 0 && SWEET_AMMO[k].flight > 0);
});
