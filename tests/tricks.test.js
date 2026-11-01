// The bonus rooms' tricks (data/tricks.js, src/core/trick.js): the rules, and every room written in the levels.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseLevel, progression } from '../src/core/level.js';
import { needleAt, castZones, judgeCast, judgeKick, keeperAt, targetAt, roomCells, roomDoors } from '../src/core/trick.js';
import { TRICKS, TOPI } from '../data/tricks.js';
import { ITEMS } from '../data/items.js';
import { WEAPONS } from '../data/weapons.js';
import { DEFS } from '../levels/defs.js';

test('the needle sweeps back and forth across the bar', () => {
  assert.equal(needleAt(0, 1), 0);
  assert.equal(needleAt(0.5, 1), 0.5);
  assert.equal(needleAt(1, 1), 1);
  assert.equal(needleAt(1.25, 1), 0.75);
  assert.equal(needleAt(2, 1), 0);
});

test('fishing: gold stripe = golden carp, green = a plain carp, else nothing', () => {
  const z = castZones(() => 0.5, { goldHalf: 0.05, greenHalf: 0.15 });
  assert.equal(z.gold.at, 0.5);
  assert.equal(judgeCast(0.52, z), 'gold');
  assert.equal(judgeCast(0.6, z), 'green');
  assert.equal(judgeCast(0.9, z), 'miss');
  for (let i = 0; i < 50; i++) { const r = castZones(); assert.ok(r.gold.at - r.green.half >= 0 && r.gold.at + r.green.half <= 1); }
});

test('penalty: a goal where the keeper is not, saved where he dives, off the post at the edges', () => {
  assert.equal(judgeKick(0.2, 1), 'goal'); // keeper dives right, ball left
  assert.equal(judgeKick(0.8, 1), 'saved');
  assert.equal(judgeKick(0.5, 0), 'saved'); // keeper stays, ball in the middle
  assert.equal(judgeKick(0.02, -1), 'post');
  assert.equal(keeperAt(-1), 0.2);
  // whatever the keeper does, there is always a way to score
  for (const dive of [-1, 0, 1]) assert.ok([0.1, 0.3, 0.5, 0.7, 0.9].some(a => judgeKick(a, dive) === 'goal'), `dive ${dive}`);
});

test('the joust target goes round the pole at its radius', () => {
  for (const t of [0, 1, 2.5]) { const p = targetAt(t, 10, 20, 2, 1.3); assert.ok(Math.abs(Math.hypot(p.x - 10, p.z - 20) - 2) < 1e-9); }
});

test('every bonus room is closed by its own door, reachable, and its trick and prize exist', () => {
  let rooms = 0;
  for (const d of DEFS) {
    if (!d.trick) continue;
    rooms++;
    const t = d.trick, rules = TRICKS[t.id];
    assert.ok(rules, `${d.id}: unknown trick ${t.id}`);
    assert.ok(TOPI[t.topo], `${d.id}: unknown Topo ${t.topo}`);
    assert.ok(WEAPONS[ITEMS[t.prize]?.weapon]?.bonus, `${d.id}: the prize ${t.prize} is not a bonus weapon`);
    const level = parseLevel(readFileSync(new URL(`../levels/${d.file}`, import.meta.url), 'utf8'), d.legend);
    const room = roomCells(level, t.x, t.z);
    const doors = roomDoors(level, room);
    assert.ok(doors.length > 0 && doors.every(c => c.door.bonus), `${d.id}: the room must be closed by bonus doors only`);
    for (const p of [t.spot, t.target].filter(Boolean)) assert.ok(room.has(`${p.x},${p.z}`), `${d.id}: ${p.x},${p.z} is outside the room`);
    if (rules.kind === 'timing') assert.ok(t.spot, `${d.id}: a timing trick needs a spot`);
    const reach = progression(level, { bossOpens: d.bossOpens }).reach;
    assert.ok(reach.has(`${t.x},${t.z}`), `${d.id}: the bonus room cannot be reached`);
    assert.ok(room.size < 200, `${d.id}: the room leaks into the level`);
    assert.ok(!level.entities.some(e => e.type === 'enemy' && room.has(`${e.cx},${e.cz}`)), `${d.id}: an opponent in the bonus room`);
  }
  assert.equal(rooms, 3, 'Episode 1 has three bonus rooms');
});
