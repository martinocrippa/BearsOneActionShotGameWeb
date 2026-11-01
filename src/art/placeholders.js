// Coded stand-ins for the Episode 1 drawings: a generic critter built from the colours in data/enemies.js
// (`placeholder`), and simple labelled props, items, projectiles and effects. Every drawing is delivered now, so
// they are only fallbacks: drawn when a key is missing from assets.json or its file fails to load.
import { L, hatch, eye3q, star, word, svgDoc, INK } from './ink.js';
import { ENEMIES } from '../../data/enemies.js';
import { DECOR, KEYS } from '../../data/items.js';

const PX_PER_M = 512 / 2.2; // the enemies' scale: 512 px = 2.2 m

// ---------- opponents ----------
function head(o, mood, mouth, cx, cy, r) {
  const eyes = `${eye3q(cx - r * 0.32, cy - r * 0.1, r / 40, o.fur, mood)}${eye3q(cx + r * 0.32, cy - r * 0.1, r / 40, o.fur, mood)}`;
  let ears = '';
  if (o.ears === 'pointy') ears = `<path d="M${cx - r * 0.8} ${cy - r * 0.4} L${cx - r * 0.7} ${cy - r * 1.5} L${cx - r * 0.2} ${cy - r * 0.8} Z M${cx + r * 0.8} ${cy - r * 0.4} L${cx + r * 0.7} ${cy - r * 1.5} L${cx + r * 0.2} ${cy - r * 0.8} Z" fill="${o.fur}" ${L(4)}/>`;
  if (o.ears === 'round' || o.ears === 'small') { const s = o.ears === 'small' ? 0.28 : 0.38; ears = `<circle cx="${cx - r * 0.75}" cy="${cy - r * 0.75}" r="${r * s}" fill="${o.fur}" ${L(4)}/><circle cx="${cx + r * 0.75}" cy="${cy - r * 0.75}" r="${r * s}" fill="${o.fur}" ${L(4)}/>`; }
  if (o.ears === 'pig') ears = `<path d="M${cx - r * 0.9} ${cy - r * 0.3} L${cx - r * 0.95} ${cy - r * 1.2} L${cx - r * 0.3} ${cy - r * 0.85} Z M${cx + r * 0.9} ${cy - r * 0.3} L${cx + r * 0.95} ${cy - r * 1.2} L${cx + r * 0.3} ${cy - r * 0.85} Z" fill="${o.fur}" ${L(4)}/>`;
  const snout = o.bird
    ? `<path d="M${cx - r * 0.3} ${cy + r * 0.2} L${cx + r * 0.9} ${cy + r * 0.35} L${cx - r * 0.3} ${cy + r * 0.6} Z" fill="${o.accent}" ${L(4)}/>`
    : o.ears === 'pig' || o.wide
      ? `<ellipse cx="${cx}" cy="${cy + r * 0.38}" rx="${r * 0.42}" ry="${r * 0.28}" fill="${o.belly}" ${L(4)}/><circle cx="${cx - r * 0.13}" cy="${cy + r * 0.38}" r="${r * 0.07}" fill="${INK}"/><circle cx="${cx + r * 0.13}" cy="${cy + r * 0.38}" r="${r * 0.07}" fill="${INK}"/>`
      : `<ellipse cx="${cx}" cy="${cy + r * 0.4}" rx="${r * 0.36}" ry="${r * 0.24}" fill="${o.belly}" ${L(3.5)}/><ellipse cx="${cx}" cy="${cy + r * 0.28}" rx="${r * 0.12}" ry="${r * 0.08}" fill="${INK}"/>`;
  const m = {
    smirk: `<path d="M${cx - r * 0.3} ${cy + r * 0.66} C${cx} ${cy + r * 0.76} ${cx + r * 0.25} ${cy + r * 0.66} ${cx + r * 0.38} ${cy + r * 0.52}" fill="none" ${L(4)}/>`,
    O: `<ellipse cx="${cx}" cy="${cy + r * 0.7}" rx="${r * 0.14}" ry="${r * 0.18}" fill="#7a1f24" ${L(3)}/>`,
    cheeks: `<circle cx="${cx - r * 0.62}" cy="${cy + r * 0.4}" r="${r * 0.36}" fill="#f78fa7" ${L(3)}/><circle cx="${cx + r * 0.62}" cy="${cy + r * 0.4}" r="${r * 0.36}" fill="#f78fa7" ${L(3)}/>`,
    happy: `<path d="M${cx - r * 0.3} ${cy + r * 0.6} C${cx - r * 0.1} ${cy + r * 0.8} ${cx + r * 0.2} ${cy + r * 0.8} ${cx + r * 0.36} ${cy + r * 0.56}" fill="none" ${L(4)}/>`,
  }[mouth] || '';
  const cap = o.cap ? `<path d="M${cx - r * 0.75} ${cy - r * 0.62} C${cx - r * 0.6} ${cy - r * 1.3} ${cx + r * 0.6} ${cy - r * 1.3} ${cx + r * 0.75} ${cy - r * 0.62} Z" fill="${o.cap}" ${L(4)}/><rect x="${cx - r * 0.95}" y="${cy - r * 0.7}" width="${r * 1.9}" height="${r * 0.16}" fill="${INK}"/>` : '';
  const crest = o.tall ? `<path d="M${cx - r * 0.3} ${cy - r * 0.9} q${r * 0.1} ${-r * 0.7} ${r * 0.3} ${-r * 0.1} q${r * 0.2} ${-r * 0.7} ${r * 0.3} ${0} q${r * 0.3} ${-r * 0.6} ${r * 0.3} ${r * 0.2} Z" fill="#e3262b" ${L(4)}/>` : '';
  return `${ears}${crest}<circle cx="${cx}" cy="${cy}" r="${r}" fill="${o.fur}" ${L(5)}/>${cap}${snout}${eyes}${m}`;
}

// The critter standing; `pose` tweaks it: walk frame, attack (weapon up + flash), pain.
function critter(kind, { state = 'idle', frame = 1, mood = 'smug', mouth = 'smirk', extra = '' } = {}) {
  const def = ENEMIES[kind], o = def.placeholder || { fur: '#888', belly: '#ddd', accent: '#e3262b' };
  const C = def.canvas || 512, foot = C - C * (24 / 512);
  const H = def.height * PX_PER_M; // same px per metre on the 512 and the 1024 (boss) canvas
  const cx = C / 2;
  const w = H * (o.wide ? 0.62 : o.thin ? 0.34 : 0.44) * (o.small ? 1.3 : 1);
  const legH = o.bird && def.fly ? 0 : H * 0.18;
  const bodyTop = foot - legH - H * 0.52, bodyBot = foot - legH;
  const hr = H * (o.small ? 0.26 : 0.18);
  const hy = bodyTop - hr * 0.6;
  const step = state === 'walk' || state === 'fly' ? (frame % 2 ? 1 : -1) : 0;
  const legs = legH ? `<rect x="${cx - w * 0.32}" y="${bodyBot - 4}" width="${w * 0.22}" height="${legH + 4 - step * 6}" fill="${o.fur}" ${L(4)}/><rect x="${cx + w * 0.1}" y="${bodyBot - 4}" width="${w * 0.22}" height="${legH + 4 + step * 6}" fill="${o.fur}" ${L(4)}/>` : '';
  const wings = o.bird ? `<path d="M${cx - w * 0.45} ${bodyTop + H * 0.12} C${cx - w * 1.4} ${bodyTop - (step > 0 ? H * 0.25 : -H * 0.15)} ${cx - w * 1.2} ${bodyTop + H * 0.35} ${cx - w * 0.4} ${bodyTop + H * 0.36} Z M${cx + w * 0.45} ${bodyTop + H * 0.12} C${cx + w * 1.4} ${bodyTop - (step > 0 ? H * 0.25 : -H * 0.15)} ${cx + w * 1.2} ${bodyTop + H * 0.35} ${cx + w * 0.4} ${bodyTop + H * 0.36} Z" fill="${o.fur}" ${L(4)}/>` : '';
  const tail = o.tail === 'bushy' || o.tail === 'long'
    ? `<path d="M${cx + w * 0.4} ${bodyBot - H * 0.08} C${cx + w * 1.3} ${bodyBot} ${cx + w * 1.4} ${bodyTop} ${cx + w * 0.9} ${bodyTop - H * 0.1}" fill="none" stroke="${o.fur}" stroke-width="${o.tail === 'bushy' ? H * 0.12 : H * 0.05}" stroke-linecap="round"/>`
    : o.tail === 'plume' ? `<path d="M${cx + w * 0.4} ${bodyTop + H * 0.2} C${cx + w * 1.4} ${bodyTop - H * 0.2} ${cx + w * 1.2} ${bodyTop + H * 0.5} ${cx + w * 0.4} ${bodyTop + H * 0.4} Z" fill="#2f8a3a" ${L(4)}/>` : '';
  const torso = `<ellipse cx="${cx}" cy="${(bodyTop + bodyBot) / 2}" rx="${w / 2}" ry="${(bodyBot - bodyTop) / 2}" fill="${o.shirt || o.fur}" ${L(5)}/>`
    + (o.shirt ? '' : `<ellipse cx="${cx}" cy="${(bodyTop + bodyBot) / 2 + H * 0.04}" rx="${w * 0.3}" ry="${(bodyBot - bodyTop) * 0.36}" fill="${o.belly}" ${L(3)}/>`)
    + (o.vee ? `<path d="M${cx - w * 0.3} ${bodyTop + H * 0.06} L${cx} ${bodyTop + H * 0.3} L${cx + w * 0.3} ${bodyTop + H * 0.06} L${cx + w * 0.18} ${bodyTop + H * 0.06} L${cx} ${bodyTop + H * 0.2} L${cx - w * 0.18} ${bodyTop + H * 0.06} Z" fill="#fff" ${L(3)}/>` : '')
    + (o.stripes ? [0.3, 0.5, 0.7].map(t => `<path d="M${cx - w * 0.4} ${bodyTop + (bodyBot - bodyTop) * t} L${cx + w * 0.4} ${bodyTop + (bodyBot - bodyTop) * t}" stroke="${o.belly}" stroke-width="${H * 0.03}"/>`).join('') : '')
    + hatch(cx + w * 0.1, bodyBot - 6, 5, H * 0.18, -60, H * 0.025);
  // what it shoots with, held in front
  const up = state === 'attack';
  const gx = cx + w * 0.42, gy = up ? bodyTop + H * 0.02 : bodyTop + H * 0.22;
  const gun = def.attack.melee
    ? `<rect x="${gx - H * 0.2}" y="${gy - H * 0.12}" width="${H * 0.36}" height="${H * 0.24}" rx="${H * 0.08}" fill="#fff" ${L(4)}/>` // pillow
    : def.attack.dive ? ''
      : `<rect x="${gx - H * 0.06}" y="${gy - H * 0.05}" width="${H * 0.28}" height="${H * 0.1}" rx="${H * 0.03}" fill="${o.accent}" ${L(4)}/>`;
  const flash = up && frame === 2 ? star(gx + H * 0.3, gy, H * 0.08) : '';
  return `${tail}${wings}${legs}${torso}${gun}${flash}${head(o, mood, mouth, cx, hy, hr)}${extra}`;
}

export function genericEnemy(kind, state, frame = 1, effect = null) {
  const def = ENEMIES[kind];
  const C = def.canvas || 512, cx = C / 2, foot = C - C * (24 / 512);
  const H = def.height * PX_PER_M;
  // lying on its back: rotated around the feet, then slid right so the whole body stays on the canvas
  const lying = inner => `<g transform="translate(${H * 0.5} 0) rotate(-82 ${cx} ${foot - 10}) translate(0 ${H * 0.1})">${inner}</g>`;
  let inner;
  switch (effect) {
    case 'stordito': inner = critter(kind, { mood: 'spiral', mouth: 'O' }) + star(cx - H * 0.2, foot - H * 1.1, H * 0.06) + star(cx + H * 0.2, foot - H * 1.15, H * 0.05, '#fff') + star(cx, foot - H * 1.25, H * 0.05, '#ff8fc8'); break;
    case 'panciaPiena': inner = lying(critter(kind, { mood: 'closed', mouth: 'happy' })) + word(cx + H * 0.3, foot - H * 0.55, 'BURP!', H * 0.2, '#ffd400', -10); break;
    case 'guance': inner = critter(kind, { mood: 'wide', mouth: 'cheeks' }); break;
    case 'gelatina': inner = critter(kind, { state: 'pain', mood: 'wide', mouth: 'O' }) + `<rect x="${cx - H * 0.5}" y="${foot - H * 1.25}" width="${H}" height="${H * 1.25}" fill="#5ab030" opacity=".55" ${L(4.5)}/>`; break;
    case 'legato': inner = lying(critter(kind, { mood: 'angry', mouth: 'smirk' }) + [0.25, 0.45, 0.65].map(t => `<rect x="${cx - H * 0.35}" y="${foot - H * t}" width="${H * 0.7}" height="${H * 0.06}" rx="${H * 0.03}" fill="#2a1a1a" ${L(3)}/>`).join('')); break;
    case 'defeat': inner = critter(kind, { mood: 'closed', mouth: 'happy' }) + `<circle cx="${cx}" cy="${foot - H * 0.86}" r="${H * 0.05}" fill="#8fd3ff" ${L(4)}/>` + word(cx + H * 0.35, foot - H * 1.1, 'ZZZ', H * 0.16, '#fff', -8); break;
    default: inner = critter(kind, { state, frame, mood: state === 'pain' ? 'wide' : state === 'attack' ? 'angry' : 'smug', mouth: state === 'pain' ? 'O' : 'smirk' });
  }
  return svgDoc(C, C, inner);
}

// ---------- effects laid over a knocked-out opponent (512, body ~300 px) ----------
export function overlaySprite(name, frame = 1) {
  const inner = {
    ragnatela: `<g fill="none" stroke="#ff8fc8" stroke-width="7" stroke-linecap="round">${[0, 30, 60, 90, 120, 150].map(a => `<path d="M256 300 l${(Math.cos(a * Math.PI / 180) * 200).toFixed(0)} ${(Math.sin(a * Math.PI / 180) * 200).toFixed(0)} M256 300 l${(-Math.cos(a * Math.PI / 180) * 200).toFixed(0)} ${(-Math.sin(a * Math.PI / 180) * 200).toFixed(0)}"/>`).join('')}${[60, 110, 160].map(r => `<circle cx="256" cy="300" r="${r}"/>`).join('')}</g>`,
    ali: `<path d="M220 300 C120 ${frame === 1 ? 180 : 240} 60 260 110 330 C150 360 200 340 220 320 Z M292 300 C392 ${frame === 1 ? 180 : 240} 452 260 402 330 C362 360 312 340 292 320 Z" fill="#fff" ${L(5)}/><ellipse cx="256" cy="96" rx="60" ry="16" fill="none" stroke="#ffd400" stroke-width="10"/><ellipse cx="256" cy="96" rx="60" ry="16" fill="none" ${L(2.5)}/>`,
    // training: the wooden stand and tape of a cardboard cut-out (laid over the opponent's drawing)
    sagoma: `<path d="M150 488 L362 488 L352 470 L160 470 Z" fill="#a0632d" ${L(4)}/>
      <path d="M300 300 L392 486" stroke="#7a4a24" stroke-width="16" stroke-linecap="round"/><path d="M300 300 L392 486" fill="none" ${L(3)}/>
      <rect x="196" y="446" width="44" height="14" fill="#e8dcb0" transform="rotate(-12 218 453)" ${L(2)}/><rect x="282" y="440" width="44" height="14" fill="#e8dcb0" transform="rotate(10 304 447)" ${L(2)}/>
      ${word(256, 500, 'TARGET', 22, '#fff', 0)}`,
    // licorice laces tying up a body lying on the ground (laid over Claude Design's "pancia piena" pose)
    lacci: [150, 230, 310, 390].map((x, i) => `<path d="M${x} ${330 + (i % 2) * 20} C${x + 30} 380 ${x - 30} 430 ${x + 10} 490" fill="none" stroke="#2a1a1a" stroke-width="22" stroke-linecap="round"/><path d="M${x} ${330 + (i % 2) * 20} C${x + 30} 380 ${x - 30} 430 ${x + 10} 490" fill="none" stroke="#e3262b" stroke-width="4" stroke-dasharray="10 14"/>`).join('')
      + '<path d="M250 320 c-30 -40 -60 0 -20 10 c-40 10 -10 50 20 10 c30 40 60 0 20 -10 c40 -10 10 -50 -20 -10 z" fill="#2a1a1a"/>',
    bollicine: [[170, 200], [330, 180], [210, 120], [300, 90], [150, 300], [360, 290]].map(([x, y], i) => `<circle cx="${x + (frame === 2 ? 8 : 0)}" cy="${y - (frame === 2 ? 20 : 0)}" r="${14 + (i % 3) * 6}" fill="#c8915a" opacity=".85" ${L(3)}/>`).join(''),
    // the bonus weapons' knock-outs: soaked, tangled in the goal net, a pie in the face
    acqua: [[200, 240], [300, 260], [240, 330], [320, 360], [190, 400]].map(([x, y]) => `<path d="M${x} ${y + (frame === 2 ? 14 : 0)} c-8 14 -8 24 0 26 c8 -2 8 -12 0 -26 Z" fill="#7fc8f0" ${L(2.5)}/>`).join('') + `<ellipse cx="256" cy="490" rx="110" ry="14" fill="#7fc8f0" opacity=".8" ${L(3)}/>`,
    rete: `<g fill="none" stroke="#f4f4ee" stroke-width="5">${Array.from({ length: 9 }, (_, i) => `<path d="M${130 + i * 32} 150 L${130 + i * 32} 490"/><path d="M120 ${170 + i * 36} L392 ${170 + i * 36}"/>`).join('')}</g><path d="M120 150 L392 150" ${L(6)}/>`,
    panna: `<path d="M170 ${frame === 2 ? 140 : 130} C190 90 320 90 342 ${frame === 2 ? 140 : 130} C350 190 320 230 300 260 C296 290 284 300 280 270 C260 240 230 250 226 290 C222 310 210 300 212 270 C180 240 160 190 170 130 Z" fill="#fffaf0" ${L(4)}/><circle cx="256" cy="104" r="14" fill="#e3262b" ${L(3)}/>`,
  }[name] || '';
  return svgDoc(512, 512, inner, { wobble: false });
}

// ---------- projectiles (drawn on 64, shown on the 256 canvas) ----------
export const NEW_SPLAT_COLORS = {
  zuppa: '#9bb84a', broccolo: '#2f8a3a', schiuma: '#f4ecd8', nota: '#7d5cff', lacci: '#2a1a1a', biberon: '#f4f4ee',
  rondella: '#2a1a1a', nuvola: '#ff8fc8', freccia: '#ff5a8a', fizz: '#8a5a20', gumball: '#ff2d8a', cuscino: '#ffffff',
  acqua: '#7fc8f0', pallone: '#f4f4ee', torta: '#fffaf0',
};
export function genericProjectile(kind, variant = 0) {
  const c = NEW_SPLAT_COLORS[kind] || '#fff';
  return {
    zuppa: `<path d="M12 34 C10 18 30 10 44 18 C58 26 54 48 36 52 C22 54 12 46 12 34 Z" fill="#9bb84a" ${L(3)}/><circle cx="26" cy="30" r="5" fill="#ff7a12"/><circle cx="40" cy="38" r="4" fill="#5ab030"/>`,
    broccolo: `<rect x="28" y="34" width="10" height="22" fill="#8cc85a" ${L(3)}/>${[[22, 26], [34, 18], [44, 28], [32, 32]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="11" fill="#2f8a3a" ${L(3)}/>`).join('')}`,
    schiuma: `${[[22, 36, 13], [36, 26, 14], [44, 40, 12], [28, 46, 10]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#f4ecd8" ${L(3)}/>`).join('')}<circle cx="34" cy="34" r="4" fill="#f6c430"/><path d="M46 14 h8 l-8 8 h8" fill="none" ${L(2)}/>`,
    nota: `<ellipse cx="22" cy="46" rx="11" ry="8" fill="#7d5cff" ${L(3)}/><path d="M32 46 V10 L50 16 V24 L32 18" fill="#7d5cff" ${L(3)}/>`,
    lacci: `<path d="M10 32 C18 10 30 54 38 32 S54 14 58 30" fill="none" stroke="#2a1a1a" stroke-width="7" stroke-linecap="round"/>`,
    biberon: `<rect x="18" y="20" width="26" height="34" rx="8" fill="#f4f4ee" ${L(3)}/><path d="M24 20 L26 8 H36 L38 20 Z" fill="#ff8fc8" ${L(3)}/><path d="M22 54 l-6 10 M31 56 v10 M40 54 l6 10" stroke="#ffd400" stroke-width="4"/>`,
    rondella: `<circle cx="32" cy="32" r="20" fill="#2a1a1a" ${L(3)}/><circle cx="32" cy="32" r="12" fill="none" stroke="#e3262b" stroke-width="3"/><circle cx="32" cy="32" r="4" fill="#ff8fc8"/>`,
    nuvola: `${[[22, 30, 14], [38, 26, 16], [30, 40, 14], [44, 40, 11]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#ff8fc8" ${L(3)}/>`).join('')}`,
    freccia: `<path d="M6 32 H50" stroke="#ff5a8a" stroke-width="6"/><path d="M6 32 H50" stroke="#fff" stroke-width="2" stroke-dasharray="5 5"/><path d="M50 22 L62 32 L50 42 Z" fill="#fff" ${L(3)}/>`,
    fizz: [[20, 28, 8], [36, 22, 6], [42, 38, 9], [28, 42, 5]].map(([x, y, r]) => `<circle cx="${x + variant * 2}" cy="${y}" r="${r}" fill="#a0682e" opacity=".8" ${L(2)}/>`).join(''),
    gumball: `<circle cx="32" cy="32" r="26" fill="#ff2d8a" ${L(4)}/><path d="M16 22 C26 12 40 12 48 20" stroke="#ffd400" stroke-width="6" fill="none"/><path d="M14 38 C26 48 40 48 52 38" stroke="#28c2b4" stroke-width="6" fill="none"/><ellipse cx="22" cy="18" rx="6" ry="4" fill="#fff"/>`,
    acqua: `<path d="M32 8 C44 26 50 36 48 44 C46 56 18 56 16 44 C14 36 20 26 32 8 Z" fill="#7fc8f0" ${L(3)}/><ellipse cx="26" cy="38" rx="5" ry="7" fill="#fff" opacity=".7"/>`,
    pallone: `<circle cx="32" cy="32" r="24" fill="#f4f4ee" ${L(3.5)}/><path d="M32 22 l9 7 l-3 11 h-12 l-3 -11 Z" fill="#111" transform="rotate(${variant * 36} 32 32)"/>`,
    torta: `<ellipse cx="32" cy="40" rx="26" ry="10" fill="#c08a4f" ${L(3)}/><path d="M8 38 C10 18 54 18 56 38 Z" fill="#fffaf0" ${L(3)}/><circle cx="32" cy="18" r="6" fill="#e3262b" ${L(2.5)}/>`,
  }[kind] || `<circle cx="32" cy="32" r="14" fill="${c}" ${L(3)}/>`;
}

// ---------- items (256, base y=240) ----------
export function genericItem(id) {
  const key = KEYS[id];
  if (key) {
    return svgDoc(256, 256, `<circle cx="128" cy="150" r="78" fill="${key.color}" ${L(5)}/><circle cx="128" cy="150" r="56" fill="none" ${L(2.5)}/>
      ${word(128, 166, key.name.split(' ').pop().slice(0, 8), 34, '#fff', -6)}${star(206, 82, 16)}${star(54, 112, 11, '#fff')}`);
  }
  const look = {
    superMiele: ['#ffd400', 'SUPER'], tazzona: ['#e3262b', 'XXL'], zainetto: ['#3b8de0', 'BAG'], stivali: ['#ffd400', 'BOOTS'],
    mappa: ['#f4ecd8', 'MAP'], liquirizie: ['#2a1a1a', 'LICO'], zuccheroFilato: ['#ff8fc8', 'COTTON'], frecce: ['#ff5a8a', 'ARROWS'],
    fizz: ['#8a5a20', 'FIZZ'], gumball: ['#ff2d8a', 'GUM'], spLiquirizia: ['#2a1a1a', '4'], spZucchero: ['#ff8fc8', '6'],
    spBalestra: ['#ff5a8a', '7'], spFizz: ['#e3262b', '8'], spBfg: ['#28c2b4', 'BFG'],
    spCarpa: ['#e0a800', 'CARP'], spPalloni: ['#e3262b', 'BALLS'], spTorte: ['#ff8fc8', 'PIES'], acqua: ['#3b8de0', 'WATER'], palloni: ['#2a2a2a', 'BALLS'], torte: ['#ff8fc8', 'PIES'],
  }[id] || ['#9c968a', '?'];
  const weapon = id.startsWith('sp');
  const body = weapon
    ? `<g transform="rotate(-8 128 180)"><rect x="36" y="150" width="170" height="46" rx="12" fill="${look[0]}" ${L(4)}/><rect x="60" y="194" width="26" height="40" rx="6" fill="${look[0]}" ${L(4)}/></g>${star(212, 92, 16)}`
    : `<rect x="64" y="120" width="128" height="120" rx="16" fill="${look[0]}" ${L(4)}/>`;
  return svgDoc(256, 256, `${body}${word(128, weapon ? 140 : 196, look[1], weapon ? 44 : 36, '#fff', -6)}${hatch(170, 236, 3, 70, -80, 8)}`);
}

// ---------- decorations: a labelled stand-in in the decoration's colour ----------
export function genericDecor(id, w, h) {
  const d = DECOR[id] || { h: 2 }, col = d.color || '#9c968a';
  const label = word(w / 2, h * 0.5, id.toUpperCase().replace(/_/g, ' '), Math.min(64, w / 7), '#fff', -4);
  const tall = d.h > 3;
  const shape = tall
    ? `<rect x="${w / 2 - w * 0.06}" y="${h * 0.45}" width="${w * 0.12}" height="${h * 0.53}" fill="#7a4a24" ${L(5)}/><ellipse cx="${w / 2}" cy="${h * 0.3}" rx="${w * 0.42}" ry="${h * 0.28}" fill="${col}" ${L(5)}/>`
    : `<path d="M${w * 0.12} ${h - 8} L${w * 0.2} ${h * 0.25} L${w * 0.8} ${h * 0.22} L${w * 0.88} ${h - 8} Z" fill="${col}" ${L(5)}/>`;
  return svgDoc(w, h, `${shape}${hatch(w * 0.55, h - 10, 6, h * 0.25, -60, w * 0.03)}${label}`);
}

// ---------- exits that are not the E1M1 mushroom: a post with a big lever and a sign ----------
export function leverExit(on, secret) {
  const sign = secret ? '#1f5fbf' : '#e3262b';
  return svgDoc(512, 512, `
    <rect x="236" y="180" width="40" height="308" fill="#7a4a24" ${L(5)}/>
    <rect x="120" y="70" width="272" height="110" rx="10" fill="${sign}" ${L(5)}/>
    ${word(256, 148, secret ? 'SECRET EXIT' : 'EXIT', secret ? 46 : 70, '#fff', 0)}
    <rect x="196" y="300" width="120" height="70" rx="10" fill="#9c968a" ${L(5)}/>
    <g transform="rotate(${on ? -40 : 40} 256 335)"><rect x="248" y="250" width="16" height="90" fill="#6b6b6b" ${L(4)}/><circle cx="256" cy="250" r="22" fill="${on ? '#22b14c' : '#e3262b'}" ${L(4)}/></g>
    ${on ? star(150, 260, 22) + star(370, 250, 18, '#fff') : ''}`);
}

// ---------- splats: what hits the bear (and what the bear's sweets do on a wall), each one recognisable ----------
const blob = (cx, cy, r, fill, n = 12, seed = 1) => {
  const pts = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2, rr = r * (i % 2 ? 0.62 : 0.9 + ((i * seed) % 3) * 0.08);
    return `${(cx + Math.cos(a) * rr).toFixed(1)} ${(cy + Math.sin(a) * rr).toFixed(1)}`;
  });
  return `<path d="M${pts.join(' L')} Z" fill="${fill}" ${L(4)}/>`;
};
const SPLATS = {
  // chamomile foam from the Oca's extinguisher: a cream foam puddle, little daisies, sleepy Zs
  schiuma: () => `${blob(128, 132, 92, '#f4ecd8', 14, 2)}
    ${[[110, 130], [150, 110], [140, 160]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="11" fill="#fff" ${L(2.5)}/><circle cx="${x}" cy="${y}" r="5" fill="#f6c430"/>`).join('')}
    <path d="M150 50 h18 l-18 18 h18 M176 30 h12 l-12 12 h12" fill="none" ${L(3)}/>${word(128, 236, 'SPLOFF!', 34, '#fff', -6)}`,
  // the Donnola's minestrone: green with peas and carrot cubes
  zuppa: () => `${blob(128, 128, 96, '#9bb84a', 16, 3)}
    ${[[96, 110], [150, 96], [120, 160], [170, 150], [84, 150]].map(([x, y], i) => (i % 2 ? `<rect x="${x - 7}" y="${y - 7}" width="14" height="14" fill="#ff7a12" ${L(2.5)}/>` : `<circle cx="${x}" cy="${y}" r="8" fill="#5ab030" ${L(2.5)}/>`)).join('')}
    ${word(128, 236, 'SPLASH!', 34, '#fff', -6)}`,
  // the Volpe's broccoli, squashed
  broccolo: () => `${[[90, 110, 34], [140, 92, 38], [170, 140, 30], [110, 156, 32], [130, 128, 26]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#2f8a3a" ${L(4)}/>`).join('')}
    <rect x="122" y="150" width="20" height="44" fill="#8cc85a" transform="rotate(25 132 172)" ${L(3)}/>${word(128, 236, 'BLEAH!', 34, '#fff', -6)}`,
  // the Gallo's lullaby notes
  nota: () => `${[[80, 120, 1.2], [140, 90, 1], [170, 150, 1.3], [110, 170, 0.9]].map(([x, y, k]) => `<g transform="translate(${x} ${y}) scale(${k})"><ellipse cx="0" cy="20" rx="16" ry="12" fill="#7d5cff" ${L(3)}/><path d="M14 20 V-24 L40 -16 V-4 L14 -12" fill="#7d5cff" ${L(3)}/></g>`).join('')}
    ${word(128, 236, 'LA LA LA', 32, '#fff', -6)}`,
  // the Gallo's licorice laces
  lacci: () => [0, 1, 2, 3].map(i => `<path d="M${30 + i * 10} ${60 + i * 40} C90 ${20 + i * 30} 170 ${140 - i * 20} ${226 - i * 8} ${70 + i * 36}" fill="none" stroke="#2a1a1a" stroke-width="16" stroke-linecap="round"/>`).join(''),
  // the Maiale's warm milk
  biberon: () => `${blob(128, 128, 108, '#fbfbf4', 18, 5)}${blob(96, 104, 30, '#ffffff', 10, 2)}
    <path d="M150 150 l18 -30 l16 10 l-18 30 z" fill="#ff8fc8" ${L(3)}/>${word(128, 236, 'GLUG!', 36, '#7a5cff', -6)}`,
  // pillows (Cinghialotto, the diving Papero): feathers everywhere
  cuscino: () => `${[[70, 80, 20], [150, 60, -30], [190, 130, 50], [90, 160, -10], [140, 120, 80], [60, 130, 30]].map(([x, y, a]) => `<path d="M${x} ${y} c18 -20 40 -10 46 6 c-16 4 -36 12 -46 -6 z" fill="#fff" transform="rotate(${a} ${x} ${y})" ${L(3)}/>`).join('')}
    ${word(128, 236, 'FLUMP!', 34, '#fff', -6)}`,
  // the bear's new sweets on a wall
  rondella: () => [[90, 110], [150, 100], [120, 160]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="26" fill="#2a1a1a" ${L(3)}/><circle cx="${x}" cy="${y}" r="10" fill="#ff8fc8"/>`).join(''),
  nuvola: () => [[100, 110, 44], [150, 100, 48], [126, 150, 46], [80, 150, 30], [176, 146, 32]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#ff8fc8" ${L(3)}/>`).join(''),
  freccia: () => `<path d="M60 196 L170 86" stroke="#ff5a8a" stroke-width="12"/><path d="M60 196 L170 86" stroke="#fff" stroke-width="4" stroke-dasharray="8 8"/>${[[170, 86], [150, 70], [190, 104]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="10" fill="#fff" ${L(2.5)}/>`).join('')}`,
  fizz: () => [[90, 110, 22], [140, 90, 16], [160, 140, 26], [110, 160, 18], [70, 150, 12], [190, 100, 14]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#a0682e" opacity=".85" ${L(2.5)}/>`).join(''),
  gumball: () => `${[[80, 90, '#ff2d8a'], [150, 80, '#ffd400'], [180, 140, '#28c2b4'], [110, 150, '#e3262b'], [70, 170, '#7d5cff'], [150, 180, '#22b14c']].map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="24" fill="${c}" ${L(3)}/>`).join('')}${word(128, 236, 'POP!', 40, '#fff', -6)}`,
};
export const hasSplat = kind => !!SPLATS[kind];
export function genericSplat(kind) {
  return svgDoc(256, 256, SPLATS[kind](), { wobble: false });
}
// The flash colour of the screen when this hits the bear.
export const HIT_FLASH = {
  marmellata: '#f39c12', camomilla: '#f6c430', schiuma: '#f4ecd8', zuppa: '#9bb84a', broccolo: '#2f8a3a',
  nota: '#7d5cff', lacci: '#5a3a2a', biberon: '#ffffff', cuscino: '#ffffff',
};
