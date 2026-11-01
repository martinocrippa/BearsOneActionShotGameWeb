import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSleep, addSleep, napTaken, faceFor, addArmor } from '../src/core/sleep.js';
import { createCheatReader } from '../src/core/cheats.js';
import { encodePassword, decodePassword } from '../src/core/password.js';
import { CHEATS } from '../data/cheats.js';

test('sleep fills up, honey wakes up, three naps is game over', () => {
  const s = createSleep();
  assert.equal(addSleep(s, 60), null);
  assert.equal(addSleep(s, -25), null);
  assert.equal(s.value, 35);
  assert.equal(addSleep(s, 100), 'asleep');
  assert.equal(napTaken(s), false);
  assert.equal(s.value, 0);
  assert.equal(napTaken(s), false);
  assert.equal(napTaken(s), true);
});

test('the big bear gets sleepy more slowly, IDDQD never sleeps', () => {
  const s = createSleep();
  addSleep(s, 40, 0.75);
  assert.equal(s.value, 30);
  s.god = true;
  assert.equal(addSleep(s, 500), null);
  assert.equal(s.value, 30);
  assert.equal(faceFor(s), 'invincibile');
});

test('HUD face follows the meter', () => {
  const s = createSleep();
  assert.equal(faceFor(s), 'sveglio');
  assert.equal(faceFor(s, { hurt: true }), 'colpito');
  s.value = 60;
  assert.equal(faceFor(s), 'assonnato');
  s.value = 90;
  assert.equal(faceFor(s), 'sbadiglio');
  assert.equal(faceFor(s, { grin: true }), 'ghigno');
});

test('cheat codes are recognised while typing, also mixed with other keys', () => {
  const r = createCheatReader(CHEATS);
  const type = word => [...word].map(k => r.feed(k)).filter(Boolean).map(c => c.action);
  assert.deepEqual(type('xxiddqd'), ['god']);
  assert.deepEqual(type('IDKFA'), ['all']);
  assert.deepEqual(type('idfa'), ['weapons']);
  assert.deepEqual(type('zuccherone'), ['infinite']);
  assert.deepEqual(type('hello'), []);
});

test('password round-trips the progress and rejects typos', () => {
  const save = {
    level: 0, bear: 'piccolo', difficulty: 3, lives: 2, checkpoint: 1,
    weapons: ['zampata', 'fionda', 'sparaconfetti', 'gelatina', 'bfg'], backpack: true,
    ammo: { caramelle: 120, confetti: 20, gelatina: 300, gumball: 80 },
  };
  const code = encodePassword(save);
  assert.match(code, /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{5}$/);
  const back = decodePassword(code.toLowerCase());
  assert.equal(back.bear, 'piccolo');
  assert.equal(back.lives, 2);
  assert.equal(back.difficulty, 3);
  assert.equal(back.checkpoint, 1);
  assert.deepEqual(back.weapons, save.weapons);
  assert.equal(back.backpack, true);
  assert.ok(Math.abs(back.ammo.caramelle - 120) <= 15);
  assert.ok(Math.abs(back.ammo.gumball - 80) <= 22);
  assert.equal(back.ammo.gelatina, 300);
  const typo = code.replace(/^./, c => (c === 'B' ? 'C' : 'B'));
  assert.equal(decodePassword(typo), null);
  assert.equal(decodePassword('ciao'), null);
});

test('alone the arrows turn and A/D dodge; in two the driver dodges with the arrows and the shooter turns with A/D', async () => {
  const { readMove } = await import('../src/game/input.js');
  const fake = (...codes) => ({ isDown: c => codes.includes(c), any: (...cs) => cs.some(c => codes.includes(c)) });
  assert.deepEqual(readMove(fake('ArrowUp', 'ArrowLeft'), 'solo'), { f: 1, strafe: 0, turn: -1, jump: false });
  assert.deepEqual(readMove(fake('ArrowUp', 'ArrowLeft'), 'coop'), { f: 1, strafe: -1, turn: 0, jump: false });
  assert.deepEqual(readMove(fake('KeyD', 'AltRight'), 'solo'), { f: 0, strafe: 1, turn: 0, jump: true });
  assert.equal(readMove(fake('Enter'), 'coop').jump, true);
  assert.deepEqual(readMove(fake('KeyD', 'Space'), 'coop'), { f: 0, strafe: 0, turn: 1, jump: false });
  // alone, SHIFT + arrows dodge instead of turning
  assert.deepEqual(readMove(fake('ShiftLeft', 'ArrowRight'), 'solo'), { f: 0, strafe: 1, turn: 0, jump: false });
});

test('hot chocolate takes a third of every hit until it runs out', () => {
  const s = createSleep();
  assert.equal(addArmor(s, 50), true);
  addSleep(s, 30);
  assert.equal(s.value, 20);
  assert.equal(s.armor, 40);
  assert.equal(addArmor(s, 100), true);
  assert.equal(s.armor, 100);
  assert.equal(addArmor(s, 50), false);
});
