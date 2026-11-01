// Suggests signposts for a level along its chain: start → first key → its door → next key → … → exit.
// Prints `signs: [...]` to paste into levels/defs/e1mN.js (then look at them in the game and adjust by hand).
// Usage: node scripts/place-signs.mjs levels/defs/e1m2.js [more files]
import { readFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseLevel } from '../src/core/level.js';
import { signTargets, signDirection } from '../src/core/signs.js';
import { KEYS } from '../data/items.js';

const N8 = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];

for (const file of process.argv.slice(2)) {
  const def = (await import(pathToFileURL(resolve(file)).href)).default;
  const level = parseLevel(readFileSync(join(dirname(resolve(file)), '..', def.file), 'utf8'), def.legend);
  const used = new Set(level.entities.map(e => e.cx + ',' + e.cz));
  const taken = new Set();
  // a quiet floor cell near (cx, cz): open all round (not in a doorway), same height, nothing on it
  const spotNear = (cx, cz, avoid = new Set()) => {
    const h = level.at(cx, cz)?.h ?? 0;
    let best = null;
    for (let r = 1; r <= 3 && !best; r++) {
      for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
        const x = cx + dx, z = cz + dz, c = level.at(x, z), k = x + ',' + z;
        if (!c || c.wall || c.door || c.lift || c.trigger || c.moveTo !== undefined || c.fx?.liquid || c.fx?.sleepy) continue;
        if (used.has(k) || taken.has(k) || avoid.has(k) || Math.abs(c.h - h) > 0.3) continue;
        const open = N8.filter(([ax, az]) => { const n = level.at(x + ax, z + az); return n && !n.wall; }).length;
        if (open < 6) continue;
        if (!best || open > best.open) best = { x, z, open };
      }
    }
    if (best) taken.add(best.x + ',' + best.z);
    return best;
  };
  const keys = def.legend.keys || [];
  const signs = [];
  const add = (anchor, text, to, avoid) => {
    if (!anchor) return;
    const s = spotNear(anchor[0], anchor[1], avoid);
    if (!s) { console.error(`  ${def.id}: no spot for "${text}" near ${anchor}`); return; }
    const sign = { x: s.x, z: s.z, text, to };
    if (signDirection(level, sign) === null) { console.error(`  ${def.id}: no way from ${s.x},${s.z} to ${to}`); return; }
    signs.push(sign);
  };
  const name = k => KEYS[k]?.name || k.toUpperCase();
  let from = [level.start.cx, level.start.cz];
  for (const k of keys) {
    add(from, `FIND THE ${name(k)}!`, k);
    const keyCell = signTargets(level, k)[0];
    const doors = signTargets(level, `door:${k}`);
    if (doors.length) {
      add(keyCell, `${name(k)} DOOR`, `door:${k}`);
      from = doors[0];
    } else from = keyCell;
  }
  add(from, 'EXIT', 'exit');
  console.log(`// ${def.id} ${def.name}`);
  console.log(`  signs: [\n${signs.map(s => `    { x: ${s.x}, z: ${s.z}, text: '${s.text.replace(/'/g, "\\'")}', to: '${s.to}' },`).join('\n')}\n  ],`);
}
