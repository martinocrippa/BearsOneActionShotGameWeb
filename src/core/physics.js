// Grid collision, floor heights and line of sight. Pure functions over a parsed level.
// Doors, secret walls and switch-moved walls carry an `open` flag on their cell, flipped by the game at runtime.
import { CELL, WALL_HEIGHT } from './level.js';

export const STEP_HEIGHT = 0.65; // steps and stand rows are walked up (as in DOOM); anything higher needs a jump
export const GRAVITY = 22;
export const BODY_HEIGHT = 1.4; // a ceiling lower than feet + this stops you

export function isSolid(cell) {
  if (!cell) return true;
  if (cell.door || cell.secret || cell.mover) return !cell.open;
  return !!cell.wall && !cell.low; // a low wall is a step you jump onto (its height is cell.h)
}

// Blocks sight and shots at height y? Railings and nets never do; low walls only below their top.
export function blocksSight(cell, y) {
  if (!cell) return true;
  if (isSolid(cell)) {
    const w = cell.wallDef;
    if (w?.rail) return false;
    return y < (w?.h ?? WALL_HEIGHT) || !!(cell.door || cell.secret || cell.mover);
  }
  return y < cell.h || (cell.ceil !== null && y > cell.ceil);
}

export function cellAtWorld(level, x, z) {
  return level.at(Math.floor(x / CELL), Math.floor(z / CELL));
}

export function floorAt(level, x, z) {
  const c = cellAtWorld(level, x, z);
  return c && !isSolid(c) ? c.h : Infinity;
}

// Highest floor under a circle: lets a body stand on a ledge it overlaps.
export function floorUnder(level, x, z, r) {
  let h = -Infinity;
  for (const [dx, dz] of [[0, 0], [r, 0], [-r, 0], [0, r], [0, -r]]) {
    const f = floorAt(level, x + dx, z + dz);
    if (f !== Infinity && f > h) h = f;
  }
  return h === -Infinity ? 0 : h;
}

// Lowest ceiling over a circle (Infinity under the sky).
export function ceilingOver(level, x, z, r) {
  let h = Infinity;
  for (const [dx, dz] of [[0, 0], [r, 0], [-r, 0], [0, r], [0, -r]]) {
    const c = cellAtWorld(level, x + dx, z + dz);
    if (c && !isSolid(c) && c.ceil !== null && c.ceil < h) h = c.ceil;
  }
  return h;
}

// Can a circle of radius r with its feet at `feet` stand at (x, z)? `tall` = body height (ceilings).
export function canStand(level, x, z, r, feet, obstacles = [], tall = BODY_HEIGHT) {
  const x0 = Math.floor((x - r) / CELL), x1 = Math.floor((x + r) / CELL);
  const z0 = Math.floor((z - r) / CELL), z1 = Math.floor((z + r) / CELL);
  for (let cz = z0; cz <= z1; cz++) for (let cx = x0; cx <= x1; cx++) {
    const c = level.at(cx, cz);
    if (isSolid(c)) return false;
    if (c.h > feet + STEP_HEIGHT) return false;
    if (c.ceil !== null && c.ceil < Math.max(feet, c.h) + tall) return false;
  }
  for (const o of obstacles) {
    const dx = x - o.x, dz = z - o.z, rr = r + o.r;
    if (dx * dx + dz * dz < rr * rr) return false;
  }
  return true;
}

// Moves a body by (dx, dz), sliding along walls one axis at a time (the classic DOOM feel).
// Returns { x, z, blockedX, blockedZ }. Flying bodies (body.fly) ignore steps and floors.
export function slide(level, body, dx, dz, obstacles = []) {
  let { x, z } = body;
  let blockedX = false, blockedZ = false;
  const feet = body.fly ? Infinity : body.y;
  const tall = body.tall ?? BODY_HEIGHT;
  const ok = (nx, nz) => (body.fly ? canFly(level, nx, nz, body.r, body.y, tall, obstacles) : canStand(level, nx, nz, body.r, feet, obstacles, tall));
  // Sub-steps so a fast body never tunnels through a 2 m cell.
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dz)) / 0.25));
  const sx = dx / steps, sz = dz / steps;
  // When a step is blocked, try shorter ones so the body ends up right against the wall.
  const advance = (pos, step, test) => {
    for (let k = 0; k < 4; k++, step /= 2) if (test(pos + step)) return { pos: pos + step, blocked: k > 0 };
    return { pos, blocked: true };
  };
  for (let i = 0; i < steps; i++) {
    if (!blockedX && sx) { const r = advance(x, sx, nx => ok(nx, z)); x = r.pos; blockedX = r.blocked; }
    if (!blockedZ && sz) { const r = advance(z, sz, nz => ok(x, nz)); z = r.pos; blockedZ = r.blocked; }
  }
  return { x, z, blockedX, blockedZ };
}

// Flying: only walls and ceilings matter (and the floor must stay below the body).
function canFly(level, x, z, r, y, tall, obstacles) {
  const x0 = Math.floor((x - r) / CELL), x1 = Math.floor((x + r) / CELL);
  const z0 = Math.floor((z - r) / CELL), z1 = Math.floor((z + r) / CELL);
  for (let cz = z0; cz <= z1; cz++) for (let cx = x0; cx <= x1; cx++) {
    const c = level.at(cx, cz);
    if (isSolid(c) || c.h > y + 0.1 || (c.ceil !== null && c.ceil < y + tall)) return false;
  }
  for (const o of obstacles) {
    const dx = x - o.x, dz = z - o.z, rr = r + o.r;
    if (dx * dx + dz * dz < rr * rr) return false;
  }
  return true;
}

// Grid line of sight between two points at eye heights (walk through the cells in small steps).
export function lineOfSight(level, ax, ay, az, bx, by, bz) {
  const dist = Math.hypot(bx - ax, bz - az);
  const n = Math.ceil(dist / (CELL * 0.25));
  for (let i = 1; i < n; i++) {
    const t = i / n;
    const x = ax + (bx - ax) * t, z = az + (bz - az) * t, y = ay + (by - ay) * t;
    if (blocksSight(cellAtWorld(level, x, z), y)) return false;
  }
  return true;
}
