import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseLevel } from '../src/core/level.js';
import { BEARS } from '../data/bears.js';
import { WEAPONS, AMMO, START_WEAPONS } from '../data/weapons.js';
import { ENEMIES, EFFECTS } from '../data/enemies.js';
import { ITEMS, DECOR } from '../data/items.js';
import { CHEATS } from '../data/cheats.js';
import { DIFFICULTIES } from '../data/difficulty.js';

test('every data file loads and is consistent', () => {
  assert.equal(BEARS.length, 3);
  assert.equal(DIFFICULTIES.length, 4);
  for (const k of START_WEAPONS) assert.ok(WEAPONS[k], k);
  for (const [k, w] of Object.entries(WEAPONS)) {
    if (w.ammo) assert.ok(AMMO[w.ammo], `${k} uses unknown ammo ${w.ammo}`);
    assert.ok(EFFECTS[w.effect], `${k} has unknown effect ${w.effect}`);
  }
  for (const [k, it] of Object.entries(ITEMS)) {
    if (it.ammo) assert.ok(AMMO[it.ammo], `${k} gives unknown ammo`);
    if (it.weapon) assert.ok(WEAPONS[it.weapon], `${k} gives unknown weapon`);
  }
  for (const c of CHEATS) assert.match(c.code, /^[A-Z]+$/);
});

test('everything placed in La Radura exists in the data', () => {
  const level = parseLevel(readFileSync(new URL('../levels/e1m1-radura.txt', import.meta.url), 'utf8'));
  for (const e of level.entities) {
    if (e.type === 'item') assert.ok(ITEMS[e.id], `unknown item ${e.id}`);
    if (e.type === 'enemy') assert.ok(ENEMIES[e.id], `unknown enemy ${e.id}`);
    if (e.type === 'decor') assert.ok(DECOR[e.id], `unknown decor ${e.id}`);
  }
  assert.ok(level.entities.some(e => e.id === 'cioccolata'), 'the level has hot chocolate');
});
