import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseLevel, validateLevel, reachableCells, progression, CELL } from '../src/core/level.js';
import { canStand, lineOfSight, slide, floorUnder, topUnder, isSolid } from '../src/core/physics.js';

const radura = parseLevel(readFileSync(new URL('../levels/e1m1-radura.txt', import.meta.url), 'utf8'));

test('La Radura is a valid, closed map', () => {
  assert.deepEqual(validateLevel(radura), []);
  assert.equal(radura.width, 44);
  assert.equal(radura.height, 32);
});

test('everything in La Radura can be reached from the start', () => {
  const reach = reachableCells(radura);
  for (const e of radura.entities) {
    if (e.type === 'door' || e.type === 'secretWall') continue;
    assert.ok(reach.has(`${e.cx},${e.cz}`), `${e.type} ${e.id || ''} at ${e.cx},${e.cz} unreachable`);
  }
});

test('MVP content is all there', () => {
  const count = (type, id) => radura.entities.filter(e => e.type === type && (!id || e.id === id)).length;
  assert.ok(count('enemy', 'scoiattolo') >= 5);
  assert.ok(count('enemy', 'puzzola') >= 3);
  assert.equal(count('item', 'ghianda'), 1);
  assert.equal(count('item', 'sparaGelatina'), 1);
  assert.equal(count('exit'), 1);
  assert.ok(count('secretSpot') >= 1);
  assert.ok(count('checkpoint') >= 1);
});

test('entities borrow the floor around them', () => {
  const gun = radura.entities.find(e => e.id === 'sparaGelatina');
  assert.equal(radura.at(gun.cx, gun.cz).floor, 'assi');
  const key = radura.entities.find(e => e.id === 'ghianda');
  assert.equal(radura.at(key.cx, key.cz).h, 0.75);
});

test('closed doors and secret walls block, open ones do not', () => {
  const door = radura.entities.find(e => e.type === 'door');
  const cell = radura.at(door.cx, door.cz);
  assert.ok(isSolid(cell));
  cell.open = true;
  assert.ok(!isSolid(cell));
  cell.open = false;
});

test('the rock ledge needs a jump, the walkway does not', () => {
  const map = parseLevel('#####\n#.^=#\n#.P.#\n#####\n');
  const ledge = { x: 2 * CELL + 1, z: 1 * CELL + 1 };
  const walk = { x: 3 * CELL + 1, z: 1 * CELL + 1 };
  assert.ok(!canStand(map, ledge.x, ledge.z, 0.35, 0));
  assert.ok(canStand(map, ledge.x, ledge.z, 0.35, 0.5));
  assert.ok(canStand(map, walk.x, walk.z, 0.35, 0));
  assert.equal(floorUnder(map, walk.x, walk.z, 0.35), 0.2);
});

test('walls stop movement and the body slides along them', () => {
  const map = parseLevel('#####\n#...#\n#.P.#\n#####\n');
  const body = { x: 5, z: 5, y: 0, r: 0.35 };
  const r = slide(map, body, 10, -1, []);
  assert.ok(r.blockedX);
  assert.ok(r.x < 8 && r.x > 7);
  assert.ok(r.z < 5);
});

test('a car roof (an obstacle with a top) blocks from below and carries a bear that jumped high enough', () => {
  const map = parseLevel('#######\n#.....#\n#P....#\n#######\n');
  const car = { x: 7, z: 5, r: 1.3, top: 1.4 };
  // walking into it: stopped
  assert.ok(!canStand(map, 7, 5, 0.35, 0, [car]));
  assert.equal(topUnder([car], 7, 5, 0.35, 0), -Infinity);
  // in the air within a step of the roof: over it, and the roof is its floor
  assert.ok(canStand(map, 7, 5, 0.35, 0.9, [car]));
  assert.equal(topUnder([car], 7, 5, 0.35, 0.9), 1.4);
  // off the edge: no roof under the bear
  assert.equal(topUnder([car], 7 + 2, 5, 0.35, 1.4), -Infinity);
  // an obstacle without a top never carries anyone
  assert.ok(!canStand(map, 7, 5, 0.35, 5, [{ x: 7, z: 5, r: 1.3 }]));
});

test('line of sight is blocked by walls', () => {
  const map = parseLevel('#######\n#..#..#\n#P....#\n#######\n');
  assert.ok(!lineOfSight(map, 3, 1.5, 3, 11, 1.5, 3));
  assert.ok(lineOfSight(map, 3, 1.5, 5, 11, 1.5, 5));
});

test('walking into a wall ends right against it (secret hedges need the touch)', () => {
  const map = parseLevel('#####\n#..S#\n#P..#\n#####\n');
  const body = { x: 3, z: 3, y: 0, r: 0.35 };
  const r = slide(map, body, 10, 0, []);
  assert.ok(r.blockedX);
  assert.ok(6 - r.x - 0.35 < 0.05, `stopped ${(6 - r.x - 0.35).toFixed(3)} m before the hedge`);
});

test('a level legend overrides the shared characters, and the progression follows keys, switches and lifts', () => {
  const legend = {
    walls: { '#': 'muro', '%': { style: 'legno', switch: 'N' }, N: { style: 'cancello', mover: true }, '|': { style: 'rete', rail: true } },
    floors: { '.': 'erba', L: { style: 'assi', h: 2, lift: 0 }, '^': { style: 'tetto', h: 2 } },
    keys: ['piuma_blu'],
  };
  const map = parseLevel([
    '#########',
    '#P.K#^^E#',
    '#...D^^^#',
    '#%..#L..#',
    '###N#####',
    '#...#...#',
    '#########',
  ].join('\n'), legend);
  assert.deepEqual(validateLevel(map), []);
  assert.ok(!map.entities.some(e => e.id === 'spLiquirizia'), 'L is the lift here, not the licorice launcher');
  assert.equal(map.at(5, 3).lift.low, 0);
  const run = progression(map);
  assert.ok(run.keys.has('piuma_blu'));
  assert.ok(run.fired.has('N'));
  assert.ok(run.exit, 'key → door → lift up to the roof → exit');
  // the rail blocks walking but not sight
  const railed = parseLevel('#####\n#P|.#\n#####\n', { ...legend, floors: { '.': 'erba' } });
  assert.ok(isSolid(railed.at(2, 1)));
  assert.ok(lineOfSight(railed, 3, 1.5, 3, 7, 1.5, 3));
});

test('a low wall marked `low` is a step to jump onto, a plain low wall stays solid', () => {
  const legend = { walls: { '#': 'muro', o: { style: 'cartelloni', h: 1.2, low: true }, n: { style: 'muretto', h: 1.2 } }, floors: { '.': 'erba' } };
  const map = parseLevel('#######\n#P.o.n#\n#######\n', legend);
  const board = map.at(3, 1), wall = map.at(5, 1);
  assert.ok(!isSolid(board) && isSolid(wall));
  assert.ok(!canStand(map, 3 * CELL + 1, 1 * CELL + 1, 0.35, 0), 'too high to walk onto');
  assert.ok(canStand(map, 3 * CELL + 1, 1 * CELL + 1, 0.35, 1.0), 'reachable with a jump');
  assert.equal(floorUnder(map, 3 * CELL + 1, 1 * CELL + 1, 0.2), 1.2);
});
