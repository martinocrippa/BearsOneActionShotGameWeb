// Checks one level before playing it: the map is closed, every character is known, everything placed exists in
// the data, and the level can be finished in order (keys → doors → switches → exit). Prints a short report.
// Usage: node scripts/check-level.mjs levels/defs/e1m2.js   (or several files)
import { readFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseLevel, validateLevel, progression } from '../src/core/level.js';
import { ITEMS, DECOR, KEYS } from '../data/items.js';
import { ENEMIES } from '../data/enemies.js';
import { SONGS } from '../src/music.js';

let failed = false;
for (const file of process.argv.slice(2)) {
  const def = (await import(pathToFileURL(resolve(file)).href)).default;
  const text = readFileSync(join(dirname(resolve(file)), '..', def.file), 'utf8');
  const level = parseLevel(text, def.legend);
  const problems = [...validateLevel(level)];
  for (const e of level.entities) {
    if (e.type === 'item' && !ITEMS[e.id]) problems.push(`Oggetto sconosciuto "${e.id}" in ${e.cx},${e.cz}.`);
    if (e.type === 'enemy' && !ENEMIES[e.id]) problems.push(`Avversario sconosciuto "${e.id}" in ${e.cx},${e.cz}.`);
    if (e.type === 'decor' && !DECOR[e.id]) problems.push(`Decorazione sconosciuta "${e.id}" in ${e.cx},${e.cz}.`);
  }
  for (const k of def.legend.keys || []) if (!KEYS[k]) problems.push(`Chiave sconosciuta "${k}" (data/items.js KEYS).`);
  if (def.music && !SONGS[def.music]) problems.push(`Musica sconosciuta "${def.music}".`);
  const run = progression(level, { bossOpens: def.bossOpens || '' });
  if (!run.exit) problems.push('L\'uscita E non si raggiunge seguendo chiavi, porte e leve.');
  if (def.secretNext !== undefined && def.secretNext !== null && !run.secretExit) problems.push('L\'uscita segreta Q non si raggiunge.');
  for (const e of run.unreached) problems.push(`Non raggiungibile: ${e.type} ${e.id || ''} in ${e.cx},${e.cz}.`);

  const count = type => level.entities.filter(e => e.type === type);
  const byId = list => Object.entries(list.reduce((m, e) => ({ ...m, [e.id]: (m[e.id] || 0) + 1 }), {})).map(([k, n]) => `${k}×${n}`).join(' ');
  console.log(`\n${def.id} "${def.name}" — ${level.width}×${level.height}`);
  console.log(`  avversari: ${byId(count('enemy'))}`);
  console.log(`  oggetti:   ${byId(count('item'))}`);
  console.log(`  decor:     ${byId(count('decor'))}`);
  console.log(`  segreti: ${count('secretSpot').length} · checkpoint: ${count('checkpoint').length} · chiavi raccolte: ${[...run.keys].join(', ') || '—'} · leve/trigger: ${[...run.fired].join('') || '—'}`);
  if (problems.length) { failed = true; console.log('  PROBLEMI:'); for (const p of problems) console.log('   - ' + p); } else console.log('  OK');
}
process.exitCode = failed ? 1 : 0;
