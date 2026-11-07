// TRACTOR RACE: the track is a proper loop, the bales leave room to pass, and tractors can finish the race.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RACE } from '../data/race.js';
import { ITEMS, DECOR } from '../data/items.js';
import { ENEMIES } from '../data/enemies.js';
import { DIFFICULTIES } from '../data/difficulty.js';
import { SONGS } from '../src/music.js';
import { buildTrack, createTractor, driveTractor, aiControl, collideTractors, standings, heightAt, nearest, TRACTOR_R, BALE_R } from '../src/core/race.js';

const track = buildTrack();

test('the track is a closed loop that never runs over itself', () => {
  assert.ok(track.length > 500 && track.length < 900, `length ${track.length.toFixed(0)} m`);
  const { samples, count, step } = track;
  for (let i = 0; i < count; i++) {
    const a = samples[i], b = samples[(i + 1) % count];
    assert.ok(Math.abs(Math.hypot(b.x - a.x, b.z - a.z) - step) < 0.3, 'evenly sampled');
    for (let j = i + 1; j < count; j++) {
      const along = Math.min(j - i, count - (j - i)) * step;
      if (along < 45) continue;
      const d = Math.hypot(samples[j].x - a.x, samples[j].z - a.z);
      assert.ok(d > track.width + 10, `the track comes within ${d.toFixed(1)} m of itself at ${a.s.toFixed(0)} m and ${samples[j].s.toFixed(0)} m`);
    }
  }
  const f = RACE.field;
  for (const c of samples) assert.ok(c.x > f.x0 + 15 && c.x < f.x1 - 15 && c.z > f.z0 + 15 && c.z < f.z1 - 15, 'inside the field');
});

test('the start is level and the hills stay drivable', () => {
  for (const g of track.grid) assert.ok(Math.abs(heightAt(g.x, g.z)) < 0.05, 'the grid stands on flat ground');
  let steepest = 0;
  for (const c of track.samples) steepest = Math.max(steepest, Math.abs(heightAt(c.x + c.tx, c.z + c.tz) - heightAt(c.x - c.tx, c.z - c.tz)) / 2);
  assert.ok(steepest < 0.38, `steepest slope along the track ${steepest.toFixed(2)}`);
  assert.ok(steepest > 0.1, 'there are hills to climb');
});

test('bales: the ones in the way leave room on one side, the ones on the edges stay off the dirt', () => {
  const inTrack = track.bales.filter(b => b.inTrack), edges = track.bales.filter(b => !b.inTrack);
  assert.equal(inTrack.length, RACE.bales.length);
  assert.ok(edges.length > 30 && edges.length < 160, `${edges.length} edge bales`);
  for (const b of inTrack) {
    const room = track.width / 2 + Math.abs(b.side) - BALE_R; // on the wider side
    assert.ok(room > TRACTOR_R * 2 + 3, `room to pass a bale at ${b.s.toFixed(0)} m`);
    assert.ok(b.s > 40, 'no bale right after the start');
  }
  for (const b of edges) assert.ok(Math.abs(nearest(track, b.x, b.z).side) >= track.width / 2 + BALE_R + TRACTOR_R - 0.01, 'a tractor on the dirt never touches the edge bales');
});

function race(controls, { seconds = 400, assist = 0, speeds }) {
  const list = speeds.map((maxSpeed, i) => createTractor(track, i, { maxSpeed }));
  const goal = RACE.laps * track.length;
  let time = 0;
  const dt = 1 / 40;
  while (time < seconds && list.some(t => t.finished === null)) {
    list.forEach((t, i) => {
      if (t.finished !== null) return;
      driveTractor(t, controls(t, i, time), dt, track, { assist });
      if (t.progress >= goal) t.finished = time;
    });
    collideTractors(list);
    time += dt;
  }
  return list;
}

test('the others finish both laps at every difficulty, in a sensible time', () => {
  for (const d of DIFFICULTIES.keys()) {
    const v = RACE.speed.others[d];
    const list = race((t, i, time) => aiControl(t, track, time), { speeds: [v, v * 0.95, v * 0.9, v] });
    for (const t of list) {
      assert.notEqual(t.finished, null, `difficulty ${d}: a tractor did not finish (${(t.progress / track.length).toFixed(2)} laps)`);
      const avg = RACE.laps * track.length / t.finished;
      assert.ok(avg > v * 0.6, `difficulty ${d}: too slow (${avg.toFixed(1)} m/s of ${v})`);
    }
  }
});

test('a little one holding just the gas on the easiest level is helped round the track', () => {
  const [t] = race(() => ({ gas: true, brake: false, steer: 0 }), { speeds: [RACE.speed.bear * DIFFICULTIES[0].move], assist: RACE.assist[0], seconds: 300 });
  assert.notEqual(t.finished, null, `stopped after ${(t.progress / track.length).toFixed(2)} laps`);
});

test('steering out, even with the most help, the tractor leaves the dirt and drives on in the field', () => {
  const t = createTractor(track, 0, { maxSpeed: RACE.speed.bear });
  let furthest = 0, fastOnGrass = 0;
  for (let k = 0; k < 40 * 12; k++) {
    // straight on for 2 s, then full lock right with the gas held
    driveTractor(t, { gas: true, brake: false, steer: k < 80 ? 0 : 1 }, 1 / 40, track, { assist: RACE.assist[0] });
    furthest = Math.max(furthest, Math.abs(nearest(track, t.x, t.z).side));
    if (t.offTrack) fastOnGrass = Math.max(fastOnGrass, t.speed);
  }
  assert.ok(furthest > track.width / 2 + 8, `only ${furthest.toFixed(1)} m from the middle`);
  assert.ok(fastOnGrass > RACE.speed.bear * 0.6, `on the grass at ${fastOnGrass.toFixed(1)} m/s`);
  const f = RACE.field;
  assert.ok(t.x >= f.x0 && t.x <= f.x1 && t.z >= f.z0 && t.z <= f.z1, 'still inside the field');
});

test('standings: the finished first, by time, then the furthest', () => {
  const a = { finished: 80, progress: 0 }, b = { finished: null, progress: 900 }, c = { finished: 75, progress: 0 }, d = { finished: null, progress: 1000 };
  assert.deepEqual(standings([a, b, c, d]), [c, a, d, b]);
  // src/race/race.js passes its racers, each with its tractor in `t` (the bear used to come last whatever happened)
  const racers = [b, d, a, c].map(t => ({ t }));
  assert.deepEqual(standings(racers).map(r => r.t), [c, a, d, b]);
});

test('prizes and drivers exist in data/', () => {
  for (const list of RACE.prizes) for (const id of list) assert.ok(ITEMS[id], `prize ${id}`);
  for (const d of RACE.drivers) assert.ok(ENEMIES[d.id], `driver ${d.id}`);
  assert.ok(SONGS[RACE.music], `song ${RACE.music}`);
  for (const id of Object.keys(RACE.tractors)) assert.ok(DECOR[id], `tractor ${id}`);
  assert.ok(Object.values(DECOR).some(d => d.race), 'a tractor asks for the race');
  assert.equal(RACE.assist.length, DIFFICULTIES.length);
  assert.equal(RACE.speed.others.length, DIFFICULTIES.length);
});
