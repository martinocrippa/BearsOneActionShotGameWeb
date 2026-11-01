// Imports the asset pack exported by Claude Design (the unzipped "orsi-assets" folder) into public/assets/.
// Translates Claude Design's names into the game's keys, keeps size and anchor of every drawing, and writes
// public/assets/assets.json as [{ key, path, w, h, anchor, source }]. SVG is preferred (light, sharp); drawings that
// contain <text> use the PNG, because an SVG shown as an image cannot use the page's fonts.
// Usage: node scripts/import-assets-zip.mjs <path/to/orsi-assets> [--clean]
// A zip can hold one step only (Episode 1 is delivered step by step): its drawings are ADDED to the ones already
// imported, replacing the same names. --clean first removes everything a previous zip brought in.
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, rmSync, existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

const src = process.argv.slice(2).find(a => !a.startsWith('--'));
const clean = process.argv.includes('--clean');
if (!src || !existsSync(join(src, 'assets.json'))) { console.error('Usage: node scripts/import-assets-zip.mjs <orsi-assets folder>'); process.exit(1); }
const OUT = new URL('../public/assets/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');

const EFFECTS = { stun: 'stordito', full: 'panciaPiena', cheeks: 'guance', jelly: 'gelatina', tied: 'legato' };
const MOODS = { awake: 'sveglio', hit: 'colpito', tired: 'assonnato', yawn: 'sbadiglio', asleep: 'addormentato', grin: 'ghigno', god: 'invincibile' };
const ITEMS = { miele_piccolo: 'miele', miele_grande: 'mieleGrande', ghianda_oro: 'ghianda' };
const WALLS = { corteccia: 'wall_tronchi', siepe: 'wall_siepe', tana: 'wall_legno', staccionata: 'wall_staccionata' };
const FLOORS = { erba: 'floor_erba', terra: 'floor_terra', assi: 'floor_assi' };

// Claude Design name → list of game keys (one drawing can serve two purposes, e.g. rock walls and floors).
function keysFor(name) {
  const [cat, obj, rest] = name.split('/');
  const [, action, view, frame] = /^(.*)_([a-z]+)_(\d+)$/.exec(rest) || [];
  switch (cat) {
    case 'enemies': return [`enemies/${obj}/${EFFECTS[action] || action}_${view}_${frame}`];
    case 'projectiles': return [`projectiles/${obj}/${action}_${view}_${frame}`];
    case 'characters': return [`characters/${obj}/${action}_${view}_${frame}`];
    // bonus rooms (E1-12): the Topi and the tricks' props keep Claude Design's names
    case 'topi': return [`topi/${obj}/${action}_${view}_${frame}`];
    case 'trick': return [`trick/${obj}/${action}_${view}_${frame}`];
    // The other screens are mock-ups with the text baked in: the game builds its menus itself. Only the backgrounds
    // without text are used (title, intermission map, ending, episode 2 teaser).
    case 'screens': return action === 'background' && ['title', 'intermission', 'ending', 'episode2'].includes(obj) ? [`screens/${obj}/background`] : [];
    case 'textures':
      if (obj === 'cielo') return ['textures/sky'];
      // Episode 1: textures/<wall_|floor_|ceil_|rail_|sky_>name/tile_f_<n> (n > 1 = animation frames), the switch
      if (obj === 'switch') return [`textures/switch_${action}`];
      if (/^(wall|floor|ceil|rail|sky)_/.test(obj)) return [`textures/${obj}${frame === '1' ? '' : `_${frame}`}`];
      if (obj === 'roccia') return ['textures/wall_roccia', 'textures/floor_roccia'];
      if (obj === 'fango') return [frame === '1' ? 'textures/floor_fango' : `textures/floor_fango_${frame}`];
      return [`textures/${WALLS[obj] || FLOORS[obj] || obj}`];
    case 'decor':
      if (obj === 'porta_tronco') return [action === 'closed' ? 'textures/door' : 'textures/door_open'];
      if (obj === 'uscita_albero') return [`props/exit_${action}`];
      if (obj === 'cespuglio_segreto') return ['decor/cespuglioSegreto'];
      return [`decor/${obj}`];
    case 'items': return [`items/${ITEMS[obj] || obj}`];
    case 'doors': return [`doors/${obj}/${action}`];
    // SWEET SHOT: bonus/<dawn|noon|night>/panorama|front, bonus/<bird>/<pose>_<view>_<n>, bonus/rifle/idle_f_1
    case 'bonus':
      if (['dawn', 'noon', 'night'].includes(obj)) return [`bonus/${obj}/${action}`];
      if (obj === 'rifle') return [`bonus/rifle/${action}_${view}_${frame}`];
      return [`bonus/birds/${obj}/${action}_${view}_${frame}`];
    case 'props':
      if (obj === 'exit') return [`props/lever_${action}`];
      if (obj === 'exit_secret') return [`props/lever_secret_${action}`];
      return [`props/${obj}_${action}`];
    // overlays and bursts keep their frames; the hand-written words become fx/word_<WORD> (the game's key)
    case 'fx':
      // "@#!?" has no letters: the game looks it up by its effect (stordito)
      if (obj === 'scritte') return [action === 'grawlix' ? 'fx/word_stordito' : `fx/word_${action.toUpperCase().replace(/[^A-Z]/g, '')}`];
      return [`fx/${obj}/${action}_${view}_${frame}`];
    case 'weapons': {
      const w = obj === 'sparagelatina' ? 'gelatina' : obj;
      const PICKUP = { gelatina: 'sparaGelatina', liquirizia: 'spLiquirizia', zucchero: 'spZucchero', balestra: 'spBalestra', fizz: 'spFizz', bfg: 'spBfg' };
      if (action === 'pickup') return [PICKUP[w] ? `items/${PICKUP[w]}` : `items/pickup_${w}`];
      return [`weapons/${w}/${action}_${frame}`];
    }
    case 'hud':
      if (obj.startsWith('face_')) return [`hud/${obj}/${MOODS[action] || action}`];
      return [`hud/${obj}/${action}`];
    default: return [];
  }
}

const pack = JSON.parse(readFileSync(join(src, 'assets.json'), 'utf8'));
// Replace the previous zip's drawings (so renamed or removed ones do not linger) but keep the ones imported
// straight from the canvas (source "canvas", e.g. the animated cover).
const manifestPath = join(OUT, 'assets.json');
const kept = [];
if (existsSync(manifestPath)) {
  for (const e of JSON.parse(readFileSync(manifestPath, 'utf8'))) {
    if (!clean || (typeof e === 'object' && e.source === 'canvas')) kept.push(typeof e === 'string' ? { key: e.replace(/\.[a-z0-9]+$/i, ''), path: e } : e);
    else rmSync(join(OUT, typeof e === 'string' ? e : e.path), { force: true });
  }
}

const manifest = [];
for (const a of pack.assets) {
  const keys = keysFor(a.name);
  if (!keys.length) continue;
  const svgText = a.svg && existsSync(join(src, a.svg)) ? readFileSync(join(src, a.svg), 'utf8') : '';
  // the weapons in the paws are inlined in the page (src/ui/weaponView.js), where the fonts work: always SVG
  const inlined = a.name.startsWith('weapons/') && !a.name.includes('/pickup_');
  const usePng = !svgText || (/<text[\s>]/.test(svgText) && !inlined) || a.category === 'screens';
  const file = usePng ? a.png2x : a.svg;
  const ext = usePng ? 'png' : 'svg';
  for (const key of keys) {
    const path = `${key}.${ext}`;
    mkdirSync(dirname(join(OUT, path)), { recursive: true });
    copyFileSync(join(src, file), join(OUT, path));
    manifest.push({ key, path, w: a.width, h: a.height, anchor: a.anchor, source: 'zip' });
  }
}
// Fonts travel with the drawings (licences included).
mkdirSync(join(OUT, 'fonts'), { recursive: true });
for (const f of readdirSync(join(src, 'fonts'))) copyFileSync(join(src, 'fonts', f), join(OUT, 'fonts', f));

for (const e of kept) if (!manifest.some(m => m.key === e.key)) manifest.push(e);
manifest.sort((a, b) => a.key.localeCompare(b.key));
writeFileSync(manifestPath, JSON.stringify(manifest, null, 1) + '\n');
console.log(`imported ${manifest.length} drawings from ${pack.assets.length} assets`);
