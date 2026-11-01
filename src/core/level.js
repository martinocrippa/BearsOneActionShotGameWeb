// Reads a level drawn as a text grid (see levels/LEGENDA.md) into plain data.
// No three.js here: the same code runs in the browser and in the Node tests.
//
// Every level brings its own LEGEND for walls, floors and decorations (a school has no hedges), while opponents,
// items, weapons and the special marks use the same characters in every level (THINGS below).

export const CELL = 2; // metres per map character
export const WALL_HEIGHT = 4;

// The forest of E1M1, also the default legend (tests, quick sketches).
export const FOREST = {
  walls: { '#': 'tronchi', T: 'siepe', R: 'roccia', w: 'legno' },
  floors: {
    '.': 'erba',
    ',': 'terra',
    '~': { style: 'fango', h: -0.2, slow: 0.55, sleepy: 3.5, liquid: true },
    '=': { style: 'assi', h: 0.2 },
    '^': { style: 'roccia', h: 0.75 },
  },
  decor: { a: 'abete', b: 'betulla', x: 'cespuglio', f: 'funghi', C: 'cartello' },
  keys: ['ghianda'],
  secret: 'siepe', // what a secret wall `S` looks like
  side: 'roccia', // the sides of raised floors (ledges)
};

// Same characters in every level.
export const THINGS = {
  P: { type: 'start' },
  X: { type: 'checkpoint' },
  E: { type: 'exit' },
  Q: { type: 'exit', secret: true },
  $: { type: 'secretSpot' },
  // keys: K = the level's first key, k = the second one (legend.keys)
  K: { type: 'key', slot: 0 },
  k: { type: 'key', slot: 1 },
  // opponents
  1: { type: 'enemy', id: 'scoiattolo' },
  2: { type: 'enemy', id: 'donnola' },
  3: { type: 'enemy', id: 'volpe' },
  4: { type: 'enemy', id: 'puzzola' },
  5: { type: 'enemy', id: 'cinghialotto' },
  6: { type: 'enemy', id: 'oca' },
  7: { type: 'enemy', id: 'papero' },
  8: { type: 'enemy', id: 'gallo' },
  9: { type: 'enemy', id: 'maiale' },
  // wake-up and armour
  h: { type: 'item', id: 'miele' },
  H: { type: 'item', id: 'mieleGrande' },
  M: { type: 'item', id: 'superMiele' },
  A: { type: 'item', id: 'cioccolata' },
  B: { type: 'item', id: 'tazzona' },
  Z: { type: 'item', id: 'zainetto' },
  V: { type: 'item', id: 'stivali' },
  Y: { type: 'item', id: 'mappa' },
  // ammo
  c: { type: 'item', id: 'caramelle' },
  o: { type: 'item', id: 'confetti' },
  l: { type: 'item', id: 'liquirizie' },
  g: { type: 'item', id: 'gelatina' },
  u: { type: 'item', id: 'zuccheroFilato' },
  r: { type: 'item', id: 'frecce' },
  q: { type: 'item', id: 'fizz' },
  m: { type: 'item', id: 'gumball' },
  // weapons
  L: { type: 'item', id: 'spLiquirizia' },
  G: { type: 'item', id: 'sparaGelatina' },
  U: { type: 'item', id: 'spZucchero' },
  J: { type: 'item', id: 'spBalestra' },
  F: { type: 'item', id: 'spFizz' },
  W: { type: 'item', id: 'spBfg' },
};
// Doors and secret walls: D opens with the first key, d with the second, ':' with nothing (just walk into it),
// S is a secret wall that opens when touched. A level can add its own doors in the legend (`doors`), e.g. the
// door of a bonus room: { '(': { bonus: true } } (opens with nothing, closes behind the bear during the trick).
export const DOOR_CHARS = { D: 0, d: 1, ':': null };

const asFloor = f => (typeof f === 'string' ? { style: f } : f);
const asWall = w => (typeof w === 'string' ? { style: w } : w);

export const cellCenter = (cx, cz) => ({ x: cx * CELL + CELL / 2, z: cz * CELL + CELL / 2 });

export function parseLevel(text, legend = FOREST) {
  const walls = legend.walls || {}, floors = legend.floors || {}, decor = legend.decor || {};
  const keys = legend.keys || [];
  const rows = text.replace(/\r/g, '').split('\n').filter(r => r.length > 0);
  const height = rows.length;
  const width = Math.max(...rows.map(r => r.length));
  const cells = [];
  const entities = [];
  let start = null;
  const unknown = [];

  for (let cz = 0; cz < height; cz++) {
    for (let cx = 0; cx < width; cx++) {
      const ch = rows[cz][cx] ?? '#';
      const cell = { ch, cx, cz, wall: null, floor: null, h: 0, ceil: null, light: 1 };
      if (walls[ch]) {
        const w = { h: legend.wallHeight ?? WALL_HEIGHT, ...asWall(walls[ch]) };
        Object.assign(cell, { wall: w.style, wallDef: w, mover: !!w.mover, sw: w.switch || null });
        // `low`: a low wall you can jump onto and over (pitch boards): its top works as a floor
        if (w.low) Object.assign(cell, { low: true, h: w.h, fx: { slow: 1, sleepy: 0, slip: false, liquid: false } });
      } else if (floors[ch]) {
        applyFloor(cell, asFloor(floors[ch]));
      } else if (!THINGS[ch] && !decor[ch] && !(ch in DOOR_CHARS) && !legend.doors?.[ch] && ch !== 'S') unknown.push(cell);
      cells.push(cell);
    }
  }
  const at = (cx, cz) => (cx < 0 || cz < 0 || cx >= width || cz >= height ? null : cells[cz * width + cx]);

  // Things, decorations and doors borrow the most common floor among their 8 neighbours (default: the first floor).
  const firstFloor = Object.keys(floors)[0];
  for (const cell of cells) {
    if (floors[cell.ch]) continue;
    if (walls[cell.ch] && !cell.mover) continue; // the level's legend wins over the shared characters
    const thing = !walls[cell.ch] && THINGS[cell.ch], deco = !walls[cell.ch] && decor[cell.ch];
    const ownDoor = legend.doors?.[cell.ch];
    const door = !walls[cell.ch] && (cell.ch in DOOR_CHARS || !!ownDoor), secret = !walls[cell.ch] && cell.ch === 'S';
    if (!thing && !deco && !door && !secret && !cell.mover) continue;
    const votes = {};
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
      const n = at(cell.cx + dx, cell.cz + dz);
      if (n && floors[n.ch]) votes[n.ch] = (votes[n.ch] || 0) + 1;
    }
    const best = Object.entries(votes).sort((a, b) => b[1] - a[1])[0];
    if (floors[best ? best[0] : firstFloor]) applyFloor(cell, asFloor(floors[best ? best[0] : firstFloor]), true);
    if (cell.mover) continue; // a wall that sinks: it only needed a floor to show once it is down

    if (door) {
      const slot = DOOR_CHARS[cell.ch];
      cell.door = ownDoor ? { key: null, ...ownDoor } : { key: slot === null ? null : keys[slot] || null };
      cell.wall = 'door';
      entities.push({ type: 'door', key: cell.door.key, bonus: !!cell.door.bonus, ch: cell.ch, cx: cell.cx, cz: cell.cz, ...cellCenter(cell.cx, cell.cz) });
      continue;
    }
    if (secret) {
      cell.secret = true; cell.wall = legend.secret || 'siepe';
      entities.push({ type: 'secretWall', ch: 'S', cx: cell.cx, cz: cell.cz, ...cellCenter(cell.cx, cell.cz) });
      continue;
    }
    const { x, z } = cellCenter(cell.cx, cell.cz);
    const base = { ch: cell.ch, cx: cell.cx, cz: cell.cz, x, z, y: cell.h };
    if (deco) { entities.push({ type: 'decor', id: typeof deco === 'string' ? deco : deco.id, ...base }); continue; }
    if (thing.type === 'key') {
      const id = keys[thing.slot];
      if (!id) { unknown.push(cell); continue; }
      entities.push({ type: 'item', id, key: true, ...base });
      continue;
    }
    if (thing.type === 'start') start = { ...thing, ...base };
    else entities.push({ ...thing, ...base });
  }
  return { width, height, cells, entities, start, at, legend, unknown };
}

function applyFloor(cell, f, borrowed = false) {
  cell.floor = f.style;
  cell.h = f.h ?? 0;
  cell.ceil = f.ceil ?? null; // null = open sky
  cell.ceilStyle = f.ceilStyle || null;
  cell.side = f.side || null; // wall style of its sides where it stands above its neighbours (else legend.side)
  cell.say = f.say || null; // an instruction shown the first time the bear steps here (training): text or { solo, coop }
  cell.color = f.color || null; cell.ceilColor = f.ceilColor || null; // tint of the coded fallback pictures
  cell.light = f.light ?? 1;
  // what the floor does to the bear: slow (speed factor), sleepy (sleep per second), slip (ice), liquid (sinks in)
  cell.fx = { slow: f.slow || 1, sleepy: f.sleepy || 0, slip: !!f.slip, liquid: !!f.liquid };
  if (borrowed) return;
  // floors that move: a lift (goes down to `low` when you come near, back up to `h` with you on it),
  // or a floor that rises/sinks to `to` when a switch or a trigger fires.
  if (f.lift !== undefined) cell.lift = { low: f.lift, high: cell.h };
  if (f.to !== undefined) cell.moveTo = f.to;
  if (f.trigger) cell.trigger = f.trigger; // walking on it fires these characters once
}

// Problems a hand-edited map can have. Returns a list of Italian messages (empty = ok).
export function validateLevel(level) {
  const errors = [];
  const { width, height, at } = level;
  if (!level.start) errors.push('Manca la partenza P.');
  const closed = c => c.wall || c.door || c.secret;
  for (let cx = 0; cx < width; cx++) for (const cz of [0, height - 1]) if (!closed(at(cx, cz))) errors.push(`Bordo aperto in ${cx},${cz}.`);
  for (let cz = 0; cz < height; cz++) for (const cx of [0, width - 1]) if (!closed(at(cx, cz))) errors.push(`Bordo aperto in ${cx},${cz}.`);
  for (const c of level.unknown) errors.push(`Carattere sconosciuto "${c.ch}" in ${c.cx},${c.cz}.`);
  if (!level.entities.some(e => e.type === 'exit' && !e.secret)) errors.push('Manca l\'uscita E.');
  for (const d of level.entities.filter(e => e.type === 'door' && e.key)) {
    if (!level.entities.some(e => e.type === 'item' && e.id === d.key)) errors.push(`C'è una porta che vuole "${d.key}" ma la chiave non c'è.`);
  }
  return errors;
}

// Flood fill from the start over everything a player can reach, treating doors, secret walls and switch-moved
// walls as open. Used by the tests to prove that every item, enemy and the exit can be reached.
export function reachableCells(level) {
  const seen = new Set();
  const { at } = level;
  const stack = [[level.start.cx, level.start.cz]];
  const open = c => c && (!c.wall || c.door || c.secret || c.mover);
  while (stack.length) {
    const [cx, cz] = stack.pop();
    const k = cx + ',' + cz;
    if (seen.has(k)) continue;
    const c = at(cx, cz);
    if (!open(c)) continue;
    seen.add(k);
    stack.push([cx + 1, cz], [cx - 1, cz], [cx, cz + 1], [cx, cz - 1]);
  }
  return seen;
}

// Plays the level "on paper": from the start, walk everywhere you can (climbing at most `climb` metres, with a
// jump), pick up the keys you reach, open their doors, fire the switches and floor triggers you reach, and repeat
// until nothing changes. Returns what was reached: the tests use it to prove that every level can be finished
// in order (key → door → … → exit), not just that everything is connected.
export function progression(level, { climb = 1.0, headroom = 2.2, bossOpens = '' } = {}) {
  const { at } = level;
  const keys = new Set(), fired = new Set(), reach = new Set();
  const open = c => {
    if (!c) return false;
    if (c.door) return !c.door.key || keys.has(c.door.key) || fired.has(c.ch);
    if (c.secret) return true;
    if (c.mover) return fired.has(c.ch);
    return !c.wall || c.low;
  };
  // floors that move count at their best height for the walker (lifts carry you up)
  const heightOf = c => (c.lift ? c.lift.low : fired.has(c.ch) && c.moveTo !== undefined ? c.moveTo : c.h);
  let changed = true;
  while (changed) {
    changed = false;
    reach.clear();
    const stack = [[level.start.cx, level.start.cz]];
    while (stack.length) {
      const [cx, cz] = stack.pop();
      const k = cx + ',' + cz;
      if (reach.has(k)) continue;
      reach.add(k);
      const c = at(cx, cz);
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const n = at(cx + dx, cz + dz);
        if (!open(n) || reach.has((cx + dx) + ',' + (cz + dz))) continue;
        const from = c.lift ? c.lift.high : heightOf(c), to = heightOf(n);
        if (!(n.door || n.secret || n.mover) && to - from > climb) continue;
        if (n.ceil !== null && n.ceil - to < headroom) continue;
        stack.push([cx + dx, cz + dz]);
      }
      // switches on the walls around, and triggers on this floor
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const n = at(cx + dx, cz + dz);
        if (n?.sw) for (const ch of n.sw) if (!fired.has(ch)) { fired.add(ch); changed = true; }
      }
      if (c.trigger) for (const ch of c.trigger) if (!fired.has(ch)) { fired.add(ch); changed = true; }
    }
    for (const e of level.entities) {
      if (!reach.has(e.cx + ',' + e.cz)) continue;
      if (e.type === 'item' && e.key && !keys.has(e.id)) { keys.add(e.id); changed = true; }
      if (e.type === 'enemy' && e.id === 'maiale') for (const ch of bossOpens) if (!fired.has(ch)) { fired.add(ch); changed = true; }
    }
  }
  const exits = level.entities.filter(e => e.type === 'exit');
  return {
    reach, keys, fired,
    exit: exits.some(e => !e.secret && reach.has(e.cx + ',' + e.cz)),
    secretExit: exits.some(e => e.secret && reach.has(e.cx + ',' + e.cz)),
    unreached: level.entities.filter(e => e.type !== 'door' && e.type !== 'secretWall' && !reach.has(e.cx + ',' + e.cz)),
  };
}
