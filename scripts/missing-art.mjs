// Lists the drawings the game uses that Claude Design has not delivered yet, grouped by the steps of
// docs/prompt-claude-design-E1.md, with Claude Design's file names. Writes docs/disegni-mancanti.md.
// Usage: node scripts/missing-art.mjs   (run it again after every import to see what is left)
import { readFileSync, writeFileSync } from 'node:fs';
import { DEFS } from '../levels/defs.js';
import { parseLevel } from '../src/core/level.js';
import { ENEMIES, EFFECTS } from '../data/enemies.js';
import { WEAPONS } from '../data/weapons.js';
import { ITEMS, KEYS } from '../data/items.js';
import { BEARS } from '../data/bears.js';
import { TOPI } from '../data/tricks.js';

const have = new Set(JSON.parse(readFileSync(new URL('../public/assets/assets.json', import.meta.url), 'utf8')).map(e => e.key));
const CD_EFFECT = { stordito: 'stun', panciaPiena: 'full', guance: 'cheeks', gelatina: 'jelly', legato: 'tied' };
const VIEWS = ['f', 'fq', 's', 'bq', 'b'];
const steps = []; // { title, items: [{ cd, key, note }] }
const step = title => { const s = { title, items: [] }; steps.push(s); return s; };
const add = (s, cd, key, note = '') => s.items.push({ cd, key, note });

// ---- E1-2: opponents ----
const s2 = step('E1-2 — Sprite degli avversari');
for (const [kind, def] of Object.entries(ENEMIES)) {
  const base = `enemies/${kind}`;
  const move = def.fly ? 'fly' : 'walk';
  const moveFrames = def.fly ? 2 : 4;
  const views = kind === 'papero' ? ['f', 's'] : VIEWS;
  if (!def.fly) for (const v of views) add(s2, `${base}/idle_${v}_1`, `${base}/idle_${v}_1`);
  for (const v of views) for (let f = 1; f <= moveFrames; f++) add(s2, `${base}/${move}_${v}_${f}`, `${base}/${move}_${v}_${f}`);
  for (const v of (kind === 'papero' ? ['f'] : ['f', 'fq'])) for (let f = 1; f <= (kind === 'papero' ? 1 : 2); f++) add(s2, `${base}/attack_${v}_${f}`, `${base}/attack_${v}_${f}`);
  add(s2, `${base}/pain_f_1`, `${base}/pain_f_1`);
  if (def.boss) for (let f = 1; f <= 3; f++) add(s2, `${base}/defeat_f_${f}`, `${base}/defeat_f_${f}`);
  else for (const fx of ['stordito', 'panciaPiena', 'guance', 'gelatina', 'legato']) {
    if (kind === 'papero' && fx === 'guance') continue;
    for (let f = 1; f <= (fx === 'stordito' ? 2 : 1); f++) add(s2, `${base}/${CD_EFFECT[fx]}_f_${f}`, `${base}/${fx}_f_${f}`);
  }
}

// ---- E1-3: projectiles, effects, trapped bear ----
const s3 = step('E1-3 — Proiettili, effetti e orso intrappolato');
const kinds = new Set([...Object.values(ENEMIES).flatMap(d => [d.attack.projectile, d.alt?.projectile]), ...Object.values(WEAPONS).map(w => w.projectile?.kind)].filter(Boolean));
for (const k of kinds) {
  for (const f of [1, 2]) add(s3, `projectiles/${k}/fly_f_${f}`, `projectiles/${k}/fly_f_${f}`);
  add(s3, `projectiles/${k}/splat_f_1`, `projectiles/${k}/splat_f_1`);
}
add(s3, 'fx/ragnatela/overlay_f_1', 'fx/ragnatela/overlay_f_1');
for (const f of [1, 2]) add(s3, `fx/ali/overlay_f_${f}`, `fx/ali/overlay_f_${f}`);
for (const f of [1, 2]) add(s3, `fx/bollicine/overlay_f_${f}`, `fx/bollicine/overlay_f_${f}`);
for (const f of [1, 2, 3]) add(s3, `fx/esplosione/burst_f_${f}`, `fx/esplosione/burst_f_${f}`);
for (const w of new Set([...Object.values(EFFECTS).map(e => e.word), 'ZZZ...'])) {
  const name = w.replace(/[^A-Z]/g, '');
  if (name) add(s3, `fx/scritte/${name.toLowerCase()}_f_1`, `fx/word_${name}`, `scritta "${w}"`);
  else add(s3, 'fx/scritte/grawlix_f_1', 'fx/word_stordito', `scritta "${w}"`);
}
add(s3, 'hud/trapped/jelly', 'hud/trapped/jelly'); add(s3, 'hud/trapped/licorice', 'hud/trapped/licorice');
for (const b of BEARS) for (const mood of ['trapped', 'fizz']) add(s3, `hud/face_${b.id}/${mood}_f_1`, `hud/face_${b.id}/${mood}`);

// ---- E1-4: weapons and items ----
const s4 = step('E1-4 — Armi nuove e oggetti');
for (const [k, w] of Object.entries(WEAPONS)) {
  if (!w.frames) continue;
  for (const fr of [w.frames.idle, ...w.frames.fire.map(([n]) => n)]) { const [a, n] = fr.split('_'); add(s4, `weapons/${k}/${a}_f_${n}`, `weapons/${k}/${fr}`); }
}
for (const [id, it] of Object.entries(ITEMS)) {
  if (it.key) continue; // keys come with their level
  const key = `items/${id}`;
  const cd = it.weapon ? `weapons/${it.weapon}/pickup_f_1` : `items/${id}/idle_f_1`;
  add(s4, cd, key);
}
add(s4, 'items/checkpoint/idle_f_1', 'items/checkpoint', 'ceppo con la bandierina rossa (dall\'MVP, mai arrivato)');
add(s4, 'items/checkpointOn/idle_f_1', 'items/checkpointOn', 'ceppo con la bandierina verde');

// ---- E1-5 … E1-8: the places, read from the level definitions ----
const decorDone = new Set(), styleDone = new Set();
const levelStep = { E1M2: 5, E1M3: 5, E1M4: 6, E1M5: 6, E1M6: 7, E1M7: 7, E1M8: 8, E1M9: 8 };
const stepsByN = {};
for (const d of DEFS.slice(1)) {
  const n = levelStep[d.id];
  const s = stepsByN[n] ||= step(`E1-${n} — Ambienti ${Object.entries(levelStep).filter(([, v]) => v === n).map(([k]) => k).join(' e ')}`);
  const L = d.legend, styles = [];
  for (const w of Object.values(L.walls || {})) { const o = typeof w === 'string' ? { style: w } : w; if (!o.switch) styles.push(`${o.rail ? 'rail' : 'wall'}_${o.style}`); }
  for (const f of Object.values(L.floors || {})) {
    const o = typeof f === 'string' ? { style: f } : f;
    styles.push(`floor_${o.style}`);
    if (o.liquid) styles.push(`floor_${o.style}_2`);
    if (o.ceil !== undefined && o.ceil !== null) styles.push(`ceil_${o.ceilStyle || 'soffitto'}`);
  }
  if (d.sky?.key && d.sky.key !== 'textures/sky') styles.push(d.sky.key.replace('textures/', ''));
  for (const st of styles) {
    if (styleDone.has(st)) continue; styleDone.add(st);
    const [, , frame] = /^(.*?)(_2)?$/.exec(st);
    const base = st.replace(/_2$/, '');
    add(s, `textures/${base}/tile_f_${frame ? 2 : 1}`, `textures/${st}`, d.id);
  }
  const level = parseLevel(readFileSync(new URL(`../levels/${d.file}`, import.meta.url), 'utf8'), L);
  for (const e of level.entities) {
    if (e.type === 'decor' && !decorDone.has(e.id)) { decorDone.add(e.id); add(s, `decor/${e.id}/idle_f_1`, `decor/${e.id}`, d.id); }
  }
  for (const k of L.keys || []) { add(s, `items/${k}/idle_f_1`, `items/${k}`, `chiave ${KEYS[k].name}`); add(s, `doors/${k}/closed_f_1`, `doors/${k}/closed`, 'porta'); }
}
const s8 = stepsByN[8];
add(s8, 'textures/switch/off_f_1', 'textures/switch_off', 'leva (tutti i livelli)'); add(s8, 'textures/switch/on_f_1', 'textures/switch_on');
add(s8, 'textures/floor_lift/tile_f_1', 'textures/floor_lift', 'ascensore');
add(s8, 'props/exit/off_f_1', 'props/lever_off', 'uscita'); add(s8, 'props/exit/on_f_1', 'props/lever_on');
add(s8, 'props/exit_secret/off_f_1', 'props/lever_secret_off', 'uscita segreta'); add(s8, 'props/exit_secret/on_f_1', 'props/lever_secret_on');

// ---- E1-9: screens ----
const s9 = step('E1-9 — Schermate dell\'episodio');
for (const sc of ['intermission', 'ending', 'episode2']) add(s9, `screens/${sc}/background`, `screens/${sc}/background`);

// ---- E1-10: training and the SWEET SHOT bonus ----
const s10 = step('E1-10 — Allenamento e bonus SWEET SHOT');
add(s10, 'fx/sagoma/stand_f_1', 'fx/sagoma/stand_f_1', 'cavalletto delle sagome');
for (const sc of ['dawn', 'noon', 'night']) for (const layer of ['panorama', 'front']) add(s10, `bonus/${sc}/${layer}_f_1`, `bonus/${sc}/${layer}`);
for (const bird of ['anatra', 'uccellino', 'gufo']) for (const k of [bird, `${bird}_oro`]) {
  for (const pose of ['fly_s_1', 'fly_s_2', 'full_s_1', 'rainbow_s_1', 'puff_s_1', ...(bird === 'gufo' ? ['peek_f_1', 'perch_f_1'] : [])]) add(s10, `bonus/${k}/${pose}`, `bonus/birds/${k}/${pose}`);
}
add(s10, 'bonus/rifle/idle_f_1', 'bonus/rifle/idle_f_1', 'fucile a bastoncino di zucchero');

// ---- E1-11: the blank signpost (the game writes the directions on it) ----
const s11 = step('E1-11 — Cartello vuoto');
add(s11, 'decor/cartello_vuoto/idle_f_1', 'decor/cartello_vuoto', 'tavola senza scritte: il gioco ci scrive le indicazioni');

// ---- E1-12: the bonus rooms (data/tricks.js) ----
const s12 = step('E1-12 — Stanze bonus: Topi, trick e armi assurde');
const TOPO_POSES = ['idle_f_1', 'idle_f_2', 'talk_f_1', 'talk_f_2', 'cheer_f_1', 'cheer_f_2', 'sad_f_1'];
for (const t of Object.keys(TOPI)) for (const p of [...TOPO_POSES, ...(t === 'portiere' ? ['ready_f_1', 'dive_f_1'] : [])]) add(s12, `topi/${t}/${p}`, `topi/${t}/${p}`);
add(s12, 'doors/bonus/closed_f_1', 'doors/bonus/closed', 'porta della stanza bonus');
for (const c of ['carpa', 'carpa_oro']) for (const f of [1, 2]) add(s12, `trick/${c}/jump_f_${f}`, `trick/${c}/jump_f_${f}`);
for (const f of [1, 2, 3]) add(s12, `trick/bersaglio/spin_f_${f}`, `trick/bersaglio/spin_f_${f}`);
add(s12, 'trick/bersaglio/hit_f_1', 'trick/bersaglio/hit_f_1');
for (const [a, n] of [['idle', 1], ['pull', 1], ['pull', 2]]) add(s12, `weapons/canna/${a}_f_${n}`, `weapons/canna/${a}_${n}`, 'canna da pesca in prima persona');
for (const d of ['porta_rigori', 'palo_giostra']) add(s12, `decor/${d}/idle_f_1`, `decor/${d}`);
for (const h of ['try_on', 'try_off', 'star']) add(s12, `hud/trick/${h}_f_1`, `hud/trick/${h}`);

// ---- report ----
let total = 0, missing = 0;
const lines = ['# Disegni che mancano', '', `Generato da \`node scripts/missing-art.mjs\` il ${new Date().toISOString().slice(0, 10)}: confronta quello che il gioco usa con quello che c'è in \`public/assets/assets.json\`. Rilancialo dopo ogni importazione.`, '', 'I nomi sono quelli dei file di Claude Design (`categoria/nome/azione_vista_frame`), come nel brief [prompt-claude-design-E1.md](prompt-claude-design-E1.md). Tutto il resto è già arrivato.', ''];
for (const s of steps) {
  const miss = s.items.filter(i => !have.has(i.key));
  total += s.items.length; missing += miss.length;
  lines.push(`## ${s.title} — mancano ${miss.length} su ${s.items.length}`, '');
  if (!miss.length) { lines.push('Tutto arrivato.', ''); continue; }
  // group by object (enemies/donnola, textures, decor…)
  const byObj = {};
  for (const i of miss) { const parts = i.cd.split('/'); const g = parts[0] === 'textures' || parts[0] === 'decor' || parts[0] === 'items' || parts[0] === 'doors' ? parts[0] : parts.slice(0, 2).join('/'); (byObj[g] ||= []).push(i); }
  for (const [g, list] of Object.entries(byObj)) lines.push(`- **${g}** (${list.length}): ${list.map(i => `\`${i.cd.replace(`${g}/`, '')}\`${i.note ? ` (${i.note})` : ''}`).join(', ')}`);
  lines.push('');
}
lines.splice(4, 0, `**In tutto: mancano ${missing} disegni su ${total}.**`, '');
writeFileSync(new URL('../docs/disegni-mancanti.md', import.meta.url), lines.join('\n') + '\n');
for (const s of steps) console.log(`${s.title}: ${s.items.filter(i => !have.has(i.key)).length}/${s.items.length} missing`);
console.log(`total: ${missing}/${total} missing → docs/disegni-mancanti.md`);
