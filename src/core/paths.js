// The way to the bear for the opponents: a distance field over the grid, measured from the bear's cell
// (breadth-first, 4 directions). An opponent out of sight follows it round the walls instead of walking into them
// (and spinning on the spot, trying left and right).
import { isSolid, STEP_HEIGHT } from './physics.js';

export const UNREACHABLE = -1;

// Steps from every cell to the cell (cx, cz). Walkers climb only steps (a ledge up to STEP_HEIGHT) and can drop
// down from anywhere; flyers (fly: true) only mind walls. Closed doors count as walls (it is rebuilt when they open).
export function pathField(level, cx, cz, { fly = false } = {}) {
  const { width, height } = level;
  const dist = new Int16Array(width * height).fill(UNREACHABLE);
  const start = level.at(cx, cz);
  if (!start || isSolid(start)) return { dist, width, height, fly };
  dist[cz * width + cx] = 0;
  const queue = [cz * width + cx];
  for (let i = 0; i < queue.length; i++) {
    const k = queue[i], ax = k % width, az = (k - ax) / width, a = level.at(ax, az), d = dist[k];
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = ax + dx, nz = az + dz;
      if (nx < 0 || nz < 0 || nx >= width || nz >= height || dist[nz * width + nx] !== UNREACHABLE) continue;
      const n = level.at(nx, nz);
      // an opponent standing on n can move to a (towards the bear)
      if (isSolid(n) || (!fly && a.h > n.h + STEP_HEIGHT)) continue;
      dist[nz * width + nx] = d + 1;
      queue.push(nz * width + nx);
    }
  }
  return { dist, width, height, fly };
}

export function stepsAt(field, cx, cz) {
  if (cx < 0 || cz < 0 || cx >= field.width || cz >= field.height) return UNREACHABLE;
  return field.dist[cz * field.width + cx];
}

// The next cell on the way from (cx, cz): the neighbour (8 directions, never cutting a wall's corner) closest to the
// bear. null when already there or when there is no way.
export function nextStep(field, level, cx, cz) {
  const here = stepsAt(field, cx, cz);
  if (here <= 0) return null;
  const from = level.at(cx, cz);
  let best = null, bestD = here;
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
    const d = stepsAt(field, cx + dx, cz + dz);
    if (d === UNREACHABLE || d >= here) continue;
    if (!field.fly && level.at(cx + dx, cz + dz).h > from.h + STEP_HEIGHT) continue; // a ledge it cannot climb
    const diag = dx && dz;
    // a diagonal saves a step only when both sides are open (else the body would scrape the corner)
    if (diag && (isSolid(level.at(cx + dx, cz)) || isSolid(level.at(cx, cz + dz)))) continue;
    const score = diag ? d - 0.5 : d; // through a diagonal, the way is that much shorter
    if (score < bestD) { bestD = score; best = { cx: cx + dx, cz: cz + dz }; }
  }
  return best;
}
