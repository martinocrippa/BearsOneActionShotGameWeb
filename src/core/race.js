// TRACTOR RACE, the rules and the maths (no three.js: tested in Node, tests/race.test.js). The track is a closed
// Catmull-Rom curve through data/race.js `path`, sampled every STEP metres; a tractor is a point with a heading and a
// speed that climbs and rolls down the hills; the others follow the track with their own lane and dodge the bales.
// Headings are the game's: forward = (−sin yaw, −cos yaw), steering right makes the yaw smaller.
import { RACE } from '../../data/race.js';

export const STEP = 2;            // metres between two samples of the track
export const TRACTOR_R = 1.3;     // a tractor's collision radius
export const BALE_R = 0.95;       // a round bale's
const ACCEL = 4.5, BRAKE = 9, COAST = 2.2, REVERSE = 4, TURN = 1.25, GRAVITY = 9.8;

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const angleDiff = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
const smooth = (x, a, b) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const yawOf = (dx, dz) => Math.atan2(-dx, -dz);

function catmull(p0, p1, p2, p3, t) {
  const t2 = t * t, t3 = t2 * t;
  const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
  return [f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])];
}

// The hills of the field (metres above the start line).
export function heightAt(x, z, def = RACE) {
  let h = 0;
  for (const [a, kx, kz, p] of def.hills) h += a * Math.sin(x * kx + p) * Math.cos(z * kz - 0.7 * p);
  const [x0, z0] = def.path[0];
  return h * smooth(Math.hypot(x - x0, z - z0), ...def.flatStart);
}

/** The track: samples every STEP metres { x, z, tx, tz (unit tangent), s (metres from the start line) }, its length,
    the bales (in the way and along the edges) and where each tractor starts. */
export function buildTrack(def = RACE) {
  const P = def.path, n = P.length, dense = [];
  for (let i = 0; i < n; i++) {
    const p0 = P[(i - 1 + n) % n], p1 = P[i], p2 = P[(i + 1) % n], p3 = P[(i + 2) % n];
    for (let k = 0; k < 60; k++) dense.push(catmull(p0, p1, p2, p3, k / 60));
  }
  const cum = [0];
  for (let i = 1; i <= dense.length; i++) {
    const a = dense[i - 1], b = dense[i % dense.length];
    cum.push(cum[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1]));
  }
  const length = cum[dense.length], count = Math.round(length / STEP), step = length / count;
  const samples = [];
  for (let k = 0, j = 0; k < count; k++) {
    const s = k * step;
    while (cum[j + 1] < s) j++;
    const a = dense[j], b = dense[(j + 1) % dense.length], t = (s - cum[j]) / (cum[j + 1] - cum[j] || 1);
    samples.push({ x: a[0] + (b[0] - a[0]) * t, z: a[1] + (b[1] - a[1]) * t, s });
  }
  for (let k = 0; k < count; k++) {
    const a = samples[(k - 1 + count) % count], b = samples[(k + 1) % count], d = Math.hypot(b.x - a.x, b.z - a.z) || 1;
    samples[k].tx = (b.x - a.x) / d; samples[k].tz = (b.z - a.z) / d;
  }
  // how much the track bends round each sample (radians per metre, averaged over ~12 m): bends get more bales
  for (let k = 0; k < count; k++) {
    const a = samples[(k - 3 + count) % count], b = samples[(k + 3) % count];
    samples[k].bend = angleDiff(Math.atan2(b.tz, b.tx), Math.atan2(a.tz, a.tx)) / (6 * step);
  }
  const track = { samples, length, step, count, width: def.width, def };
  track.at = (s) => samples[((Math.round(s / step) % count) + count) % count];
  // a point `side` metres right of the middle at distance s (right = the tangent turned clockwise, seen from above)
  track.point = (s, side = 0) => { const c = track.at(s); return { x: c.x - c.tz * side, z: c.z + c.tx * side, c }; };

  const bales = def.bales.map(([f, side]) => ({ ...track.point(f * length, side), side, s: f * length, inTrack: true }));
  const { straight, curve, out } = def.edgeBales;
  for (let s = 20, last = { l: -1e9, r: -1e9 }; s < length - 12; s += step) {
    const b = track.at(s).bend;
    const outer = b > 0 ? 'l' : 'r'; // bend > 0 turns right: the outside of the bend is on the left
    for (const side of ['l', 'r']) {
      const isOuter = Math.abs(b) > 0.012 && side === outer;
      const gap = isOuter ? curve : straight;
      if (s - last[side] < gap) continue;
      last[side] = s;
      const off = (def.width / 2 + out) * (side === 'r' ? 1 : -1);
      bales.push({ ...track.point(s, off), side: off, s, inTrack: false });
    }
  }
  for (const b of bales) delete b.c;
  track.bales = bales;
  // the grid: two by two behind the start line
  track.grid = [0, 1, 2, 3].map(i => {
    const s = length - 7 - Math.floor(i / 2) * 8, side = (i % 2 ? 1 : -1) * 2.6, p = track.point(s, side);
    return { x: p.x, z: p.z, yaw: yawOf(p.c.tx, p.c.tz) };
  });
  return track;
}

/** The sample nearest to (x, z), looking round `hint` (the last one) when given. */
export function nearest(track, x, z, hint = null) {
  const { samples, count } = track;
  let best = 0, bd = Infinity;
  const scan = i => { const c = samples[i], d = (c.x - x) ** 2 + (c.z - z) ** 2; if (d < bd) { bd = d; best = i; } };
  if (hint === null) for (let i = 0; i < count; i++) scan(i);
  else for (let k = -25; k <= 25; k++) scan(((hint + k) % count + count) % count);
  const c = samples[best];
  return { i: best, side: -(x - c.x) * c.tz + (z - c.z) * c.tx, dist: Math.sqrt(bd) };
}

export function createTractor(track, slot, { maxSpeed, seed = slot }) {
  const g = track.grid[slot];
  const t = { x: g.x, z: g.z, yaw: g.yaw, speed: 0, maxSpeed, seed, steer: 0, lap: -1, i: 0, side: 0, progress: 0, finished: null, wrongWay: false, offTrack: false, bumped: 0 };
  Object.assign(t, nearest(track, t.x, t.z));
  t.progress = (t.i < track.count / 2 ? 0 : -track.length) + track.samples[t.i].s;
  t.lap = t.progress < 0 ? -1 : 0;
  return t;
}

/** One step of a tractor: ctl = { gas, brake, steer (−1 left … 1 right) }; assist pulls it along the track.
    Returns what happened ('bale' when it hit one). */
export function driveTractor(t, ctl, dt, track, { assist = 0, bales = track.bales } = {}) {
  const fx = -Math.sin(t.yaw), fz = -Math.cos(t.yaw);
  // the slope along the way: climbing slows down, rolling down speeds up
  const slope = (heightAt(t.x + fx, t.z + fz, track.def) - heightAt(t.x - fx, t.z - fz, track.def)) / 2;
  const top = t.maxSpeed * (t.offTrack ? 0.55 : 1);
  if (ctl.gas) t.speed += ACCEL * dt * (t.speed < 0 ? 2 : 1);
  else if (ctl.brake) t.speed -= (t.speed > 0 ? BRAKE : ACCEL * 0.6) * dt;
  else t.speed -= Math.sign(t.speed) * Math.min(Math.abs(t.speed), COAST * dt);
  t.speed -= GRAVITY * slope * 0.35 * dt;
  if (t.speed > top) t.speed = Math.max(top, t.speed - 7 * dt); // off the track the grass holds it back
  t.speed = clamp(t.speed, -REVERSE, t.maxSpeed * 1.15);
  t.steer += (clamp(ctl.steer, -1, 1) - t.steer) * Math.min(1, dt * 8);
  const grip = clamp(Math.abs(t.speed) / 4, 0, 1) * Math.sign(t.speed || 1);
  t.yaw -= t.steer * TURN * grip * dt;
  // the helping hand: the heading turns a little towards the track's own, aiming back at the middle
  const c = track.samples[t.i], along = yawOf(c.tx, c.tz) + clamp(t.side * 0.06, -0.35, 0.35), off = angleDiff(along, t.yaw);
  if (assist && t.speed > 1 && Math.abs(off) < 1.3 && !ctl.brake) t.yaw += off * assist * dt * (Math.abs(ctl.steer) > 0.1 ? 0.35 : 1);
  t.x += -Math.sin(t.yaw) * t.speed * dt;
  t.z += -Math.cos(t.yaw) * t.speed * dt;
  let hit = null;
  for (const b of bales) {
    const dx = t.x - b.x, dz = t.z - b.z, d = Math.hypot(dx, dz), min = TRACTOR_R + BALE_R;
    if (d >= min || d === 0) continue;
    const nx = dx / d, nz = dz / d;
    t.x = b.x + nx * min; t.z = b.z + nz * min;
    // a knock the first time (it slows down), then it slides round the bale instead of pushing into it
    if (t.bumped <= 0 && Math.abs(t.speed) > 2.5) { hit = 'bale'; t.speed *= 0.5; }
    t.bumped = 0.4;
    const gx = -Math.sin(t.yaw) * Math.sign(t.speed || 1), gz = -Math.cos(t.yaw) * Math.sign(t.speed || 1);
    if (gx * nx + gz * nz < 0) {
      const t1 = [-nz, nx], tan = gx * t1[0] + gz * t1[1] >= 0 ? t1 : [nz, -nx];
      const slideYaw = t.speed >= 0 ? yawOf(tan[0], tan[1]) : yawOf(-tan[0], -tan[1]);
      t.yaw += angleDiff(slideYaw, t.yaw) * Math.min(1, dt * 6);
    }
  }
  const f = track.def.field;
  if (t.x < f.x0 || t.x > f.x1 || t.z < f.z0 || t.z > f.z1) { t.x = clamp(t.x, f.x0, f.x1); t.z = clamp(t.z, f.z0, f.z1); t.speed *= 0.5; }
  if (!hit) t.bumped = Math.max(0, t.bumped - dt);
  follow(t, track);
  return hit;
}

// Where the tractor is along the race: the nearest sample, the laps (the start line is crossed going forwards only).
function follow(t, track) {
  const prev = t.i, n = nearest(track, t.x, t.z, t.i), N = track.count;
  if (n.i < N / 4 && prev > (3 * N) / 4) t.lap++;
  else if (n.i > (3 * N) / 4 && prev < N / 4) t.lap--;
  t.i = n.i; t.side = n.side;
  t.offTrack = Math.abs(n.side) > track.width / 2 + 0.4;
  t.progress = t.lap * track.length + track.samples[n.i].s;
  const c = track.samples[n.i];
  t.wrongWay = t.speed > 1 && (-Math.sin(t.yaw) * c.tx - Math.cos(t.yaw) * c.tz) < -0.3;
}

/** Tractors bump into each other: pushed apart, the one behind slows down. */
export function collideTractors(list) {
  let any = false;
  for (let a = 0; a < list.length; a++) for (let b = a + 1; b < list.length; b++) {
    const A = list[a], B = list[b], dx = B.x - A.x, dz = B.z - A.z, d = Math.hypot(dx, dz), min = TRACTOR_R * 2;
    if (d >= min || d === 0) continue;
    const push = (min - d) / 2, nx = dx / d, nz = dz / d;
    A.x -= nx * push; A.z -= nz * push; B.x += nx * push; B.z += nz * push;
    const back = A.progress < B.progress ? A : B;
    back.speed *= 0.8;
    any = true;
  }
  return any;
}

/** How the computer drives: a point ahead on its own lane (weaving a little), round the bales in the way. */
export function aiControl(t, track, time) {
  const look = 7 + Math.max(0, t.speed) * 0.7, half = track.width / 2 - 1.6;
  const s = track.samples[t.i].s + look;
  let lane = clamp(((t.seed % 3) - 1) * 2.2 + Math.sin(time * 0.35 + t.seed * 1.7) * 1.4, -half, half);
  for (const b of track.bales) {
    if (!b.inTrack) continue;
    const ahead = ((b.s - track.samples[t.i].s) % track.length + track.length) % track.length;
    if (ahead > -2 && ahead < look + 16 && Math.abs(b.side - lane) < 3.6) {
      // round the bale on the side with more room
      const right = b.side + 3.8, left = b.side - 3.8;
      lane = right <= half && (left < -half || Math.abs(right - lane) <= Math.abs(left - lane)) ? right : left;
    }
  }
  if (Math.abs(lane) > half) lane = Math.sign(lane) * half;
  const p = track.point(s, lane);
  const diff = angleDiff(yawOf(p.x - t.x, p.z - t.z), t.yaw);
  return { gas: !(Math.abs(diff) > 0.7 && t.speed > 6), brake: false, steer: clamp(-diff * 2.5, -1, 1) };
}

/** The order of the race: who finished first, then who has gone furthest. */
export function standings(list) {
  return [...list].sort((a, b) => {
    if (a.finished !== null && b.finished !== null) return a.finished - b.finished;
    if (a.finished !== null) return -1;
    if (b.finished !== null) return 1;
    return b.progress - a.progress;
  });
}

export const ordinal = n => `${n}${n === 1 ? 'ST' : n === 2 ? 'ND' : n === 3 ? 'RD' : 'TH'}`;
