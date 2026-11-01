// Imports drawings straight from the Claude Design canvas (artboards saved as .dc.html files) into public/assets/.
// Two ways:
//   node scripts/import-claude-design.mjs <folder>                 every `<category>-<name>-<frame>.dc.html` in the folder
//   node scripts/import-claude-design.mjs <file.dc.html>=<key> …   explicit artboards, e.g. CoverAnimata.dc.html=screens/title/animated
// The artboard's single <svg> is extracted; its <helmet> CSS (animations) is moved inside the SVG. Entries are merged
// into public/assets/assets.json as { key, path, w, h, source: 'canvas' } (same format as scripts/import-assets-zip.mjs,
// which keeps canvas entries when a new zip is imported).
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { dirname, join, basename } from 'node:path';

const args = process.argv.slice(2);
if (!args.length) { console.error('Usage: node scripts/import-claude-design.mjs <folder> | <file.dc.html>=<key> …'); process.exit(1); }
const OUT = new URL('../public/assets/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');

// Claude Design's names → the game's names.
const EFFECTS = { stun: 'stordito', full: 'panciaPiena', cheeks: 'guance', jelly: 'gelatina', tied: 'legato' };
const CATEGORIES = ['enemies', 'projectiles', 'weapons', 'items', 'decor', 'props', 'textures', 'fx', 'hud', 'screens', 'characters'];

function keyFor(file) {
  const base = basename(file).replace(/\.dc\.html$/, '');
  const [cat, name, ...rest] = base.split('-');
  if (!CATEGORIES.includes(cat) || !rest.length) return null;
  let frame = rest.join('-');
  const m = /^([A-Za-z]+)(_.*)?$/.exec(frame);
  if (m && EFFECTS[m[1]]) frame = EFFECTS[m[1]] + (m[2] || '');
  return `${cat}/${name}/${frame}`;
}

function extractSvg(html) {
  const body = /<x-dc>([\s\S]*?)<\/x-dc>/.exec(html)?.[1] ?? html;
  const helmetCss = (/<helmet>[\s\S]*?<style>([\s\S]*?)<\/style>[\s\S]*?<\/helmet>/.exec(body)?.[1] || '')
    .replace(/body\{[^}]*\}/g, '').trim();
  const svgs = body.replace(/<helmet>[\s\S]*?<\/helmet>/, '').match(/<svg[\s\S]*<\/svg>/);
  if (!svgs) throw new Error('no <svg> found');
  let svg = svgs[0];
  if ((svg.match(/<svg[\s>]/g) || []).length !== 1) throw new Error('expected exactly 1 <svg>');
  if (/\{\{[^}]+\}\}/.test(svg)) throw new Error('contains {{template holes}}');
  if (!/xmlns=/.test(svg)) svg = svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
  svg = svg.replace(/<svg([^>]*?)\sstyle="[^"]*"/, '<svg$1');
  if (helmetCss) svg = svg.replace(/(<svg[^>]*>)/, `$1<style>${helmetCss}</style>`);
  const [, w, h] = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(svg) || [];
  return { text: `<?xml version="1.0" encoding="UTF-8"?>\n${svg}\n`, w: Number(w) || undefined, h: Number(h) || undefined };
}

// Existing manifest (both formats) → Map key → entry.
const manifestPath = join(OUT, 'assets.json');
const manifest = new Map();
if (existsSync(manifestPath)) {
  for (const f of JSON.parse(readFileSync(manifestPath, 'utf8'))) {
    const e = typeof f === 'string' ? { path: f } : f;
    manifest.set(e.key || e.path.replace(/\.[a-z0-9]+$/i, ''), { ...e, key: e.key || e.path.replace(/\.[a-z0-9]+$/i, '') });
  }
}

const jobs = [];
for (const a of args) {
  if (a.includes('=')) { const [file, key] = a.split('='); jobs.push({ file, key }); continue; }
  if (statSync(a).isDirectory()) {
    for (const f of readdirSync(a).filter(f => f.endsWith('.dc.html')).sort()) {
      const key = keyFor(f);
      if (key) jobs.push({ file: join(a, f), key });
    }
  } else jobs.push({ file: a, key: keyFor(a) });
}

let ok = 0;
const problems = [];
for (const { file, key } of jobs) {
  if (!key) { problems.push(`${file}: no key (name it <category>-<name>-<frame>.dc.html or pass file=key)`); continue; }
  try {
    const { text, w, h } = extractSvg(readFileSync(file, 'utf8'));
    const path = `${key}.svg`;
    mkdirSync(dirname(join(OUT, path)), { recursive: true });
    writeFileSync(join(OUT, path), text);
    manifest.set(key, { ...(manifest.get(key) || {}), key, path, w, h, source: 'canvas' });
    ok++;
  } catch (e) { problems.push(`${file}: ${e.message}`); }
}
const list = [...manifest.values()].sort((a, b) => a.key.localeCompare(b.key));
writeFileSync(manifestPath, JSON.stringify(list, null, 1) + '\n');
console.log(`imported ${ok} drawings → public/assets (assets.json: ${list.length} entries)`);
if (problems.length) { console.log('problems:'); for (const p of problems) console.log('  ' + p); process.exitCode = 1; }
