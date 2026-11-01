// Signposts: a board with a few words and an arrow that shows the way to something (a key, its door, the exit).
// Written in the level definition: signs: [{ x, z, text, to }] — x, z = column and row in the map text,
// to = 'exit' | a key id (where the key lies) | 'door:<key id>' (the door it opens) | absent (no arrow).
// The arrow follows the real way there (around walls, through doors), not the straight line.
import { cellCenter } from './level.js';

// Where a sign points to: the cells of its target.
export function signTargets(level, to) {
  if (!to) return [];
  if (to === 'exit') return level.entities.filter(e => e.type === 'exit' && !e.secret).map(e => [e.cx, e.cz]);
  if (to.startsWith('door:')) {
    const key = to.slice(5);
    return level.cells.filter(c => c.door?.key === key).map(c => [c.cx, c.cz]);
  }
  return level.entities.filter(e => e.type === 'item' && e.id === to).map(e => [e.cx, e.cz]);
}

// Walkable for the arrow: open floors, doors and moving walls (they open), the low boards. Never a secret wall:
// a sign must not give a secret away.
const passable = c => c && (!c.wall || c.door || c.mover || c.low);

// Steps from every cell to the nearest target cell (breadth-first, 4 directions).
function distanceField(level, targets) {
  const dist = new Map(), queue = [];
  for (const [cx, cz] of targets) { dist.set(cx + ',' + cz, 0); queue.push([cx, cz]); }
  for (let i = 0; i < queue.length; i++) {
    const [cx, cz] = queue[i], d = dist.get(cx + ',' + cz);
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const k = (cx + dx) + ',' + (cz + dz);
      if (dist.has(k) || !passable(level.at(cx + dx, cz + dz))) continue;
      dist.set(k, d + 1); queue.push([cx + dx, cz + dz]);
    }
  }
  return dist;
}

// The direction of the way from the sign to its target, as a yaw (same convention as the player's: 0 = towards -z),
// looking a few steps ahead along the way so the arrow points down the corridor, not at the first corner.
// null when there is no target or no way there.
export function signDirection(level, sign, lookAhead = 3) {
  const targets = signTargets(level, sign.to);
  if (!targets.length) return null;
  const dist = distanceField(level, targets);
  let cx = sign.x, cz = sign.z;
  if (!dist.has(cx + ',' + cz)) return null;
  for (let s = 0; s < lookAhead && dist.get(cx + ',' + cz) > 0; s++) {
    let best = null;
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const d = dist.get((cx + dx) + ',' + (cz + dz));
      if (d !== undefined && (!best || d < best.d)) best = { d, cx: cx + dx, cz: cz + dz };
    }
    if (!best || best.d >= dist.get(cx + ',' + cz)) break;
    cx = best.cx; cz = best.cz;
  }
  if (cx === sign.x && cz === sign.z) return null;
  const a = cellCenter(sign.x, sign.z), b = cellCenter(cx, cz);
  return Math.atan2(-(b.x - a.x), -(b.z - a.z));
}

// Which arrow to show to someone looking with `viewYaw` (yaw grows turning left): ahead, left, right or back.
export function arrowFor(dirYaw, viewYaw) {
  if (dirYaw === null || dirYaw === undefined) return null;
  const rel = Math.atan2(Math.sin(dirYaw - viewYaw), Math.cos(dirYaw - viewYaw));
  if (Math.abs(rel) < Math.PI * 0.28) return 'up';
  if (Math.abs(rel) > Math.PI * 0.72) return 'down';
  return rel > 0 ? 'left' : 'right';
}
