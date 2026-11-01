// The rules of the bonus rooms' tricks (data/tricks.js), without three.js: tested in Node. The game
// (src/game/trick.js) draws the Topo, the props and the gauge, and asks these.

// The needle of the timing tricks sweeps 0 → 1 → 0 (a triangle wave), `speed` sweeps per second.
export function needleAt(t, speed) {
  const p = (t * speed) % 2;
  return p < 1 ? p : 2 - p;
}

// Fishing: a new bar for every cast, a narrow gold stripe inside a wider green one, somewhere in the middle.
export function castZones(rng = Math.random, { goldHalf = 0.06, greenHalf = 0.18 } = {}) {
  const at = 0.25 + rng() * 0.5;
  return { gold: { at, half: goldHalf }, green: { at, half: greenHalf } };
}

// Where the needle stopped on the bar: 'gold' (the golden carp), 'green' (a plain carp) or 'miss'.
export function judgeCast(pos, zones) {
  if (Math.abs(pos - zones.gold.at) <= zones.gold.half) return 'gold';
  if (Math.abs(pos - zones.green.at) <= zones.green.half) return 'green';
  return 'miss';
}

// Penalty: `aim` 0..1 from the left post to the right one (as the kicker sees it); the keeper dives to `dive`
// (-1 left, 0 stays in the middle, 1 right) and reaches `reach` around where he lands. Too near a post: off the post.
export const keeperAt = dive => 0.5 + dive * 0.3;
export function judgeKick(aim, dive, { posts = 0.07, reach = 0.2 } = {}) {
  if (aim < posts || aim > 1 - posts) return 'post';
  return Math.abs(aim - keeperAt(dive)) <= reach ? 'saved' : 'goal';
}

// The joust's target goes round the pole (cx, cz in metres) at `radius`, `speed` radians per second.
export function targetAt(t, cx, cz, radius, speed) {
  return { x: cx + Math.cos(t * speed) * radius, z: cz + Math.sin(t * speed) * radius };
}

// The bonus room: every cell the Topo's cell reaches without crossing a wall or a door (a door is a wall cell).
export function roomCells(level, cx, cz) {
  const room = new Set(), stack = [[cx, cz]];
  while (stack.length) {
    const [x, z] = stack.pop(), k = x + ',' + z, c = level.at(x, z);
    if (room.has(k) || !c || c.wall) continue;
    room.add(k);
    stack.push([x + 1, z], [x - 1, z], [x, z + 1], [x, z - 1]);
  }
  return room;
}

// The doors that close the room: door cells next to one of its cells.
export function roomDoors(level, room) {
  const doors = [];
  for (const k of room) {
    const [x, z] = k.split(',').map(Number);
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const c = level.at(x + dx, z + dz);
      if (c?.door && !doors.includes(c)) doors.push(c);
    }
  }
  return doors;
}
