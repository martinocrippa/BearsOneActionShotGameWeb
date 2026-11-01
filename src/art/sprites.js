// Placeholder sprites (front view). Every function returns a full SVG document string.
// Sizes follow docs/prompt-claude-design.md: characters on a 512 canvas with the feet on y=488,
// items on 256 with the base on y=240. Real drawings in public/assets/ replace these by name.
import { L, hatch, eye3q, star, word, svgDoc, INK } from './ink.js';
import { genericEnemy, genericProjectile, genericItem, genericDecor, leverExit, overlaySprite, NEW_SPLAT_COLORS, hasSplat, genericSplat } from './placeholders.js';
import { goalSprite, poleSprite } from './tricks.js';

export { overlaySprite };

// ---------- heads (300 box, three-quarter view looking right) ----------
const CRITTER_MOUTH = {
  smirk: `<path d="M182 168 C198 174 214 168 228 158" fill="none" ${L(4)}/><path d="M182 168 C176 166 174 160 178 156" fill="none" ${L(3)}/>`,
  O: `<ellipse cx="214" cy="168" rx="10" ry="12" fill="#7a1f24" ${L(3.5)}/>`,
  tongue: `<path d="M186 166 C200 176 218 172 230 160" fill="none" ${L(4)}/><path d="M204 172 C204 192 220 194 222 176 Z" fill="#e8667a" ${L(3)}/>`,
  cheeks: `<circle cx="160" cy="150" r="30" fill="#f78fa7" ${L(3.5)}/><circle cx="238" cy="150" r="22" fill="#f78fa7" ${L(3.5)}/><path d="M200 166 C206 170 214 170 220 166" fill="none" ${L(3)}/>`,
  happy: `<path d="M180 160 C196 178 220 174 232 156" fill="none" ${L(4)}/>`,
};

function squirrelHead(mood = 'smug', mouth = 'smirk') {
  const fur = '#d9773a';
  const teeth = mouth === 'O' || mouth === 'cheeks' ? '' : `<path d="M212 160 L214 182 L222 182 L222 160 M222 160 L222 182 L230 180 L230 158" fill="#fff" ${L(2.5)}/>`;
  return `
    <path d="M96 84 L80 18 L92 30 L96 10 L128 66 Z" fill="${fur}" ${L(3.5)}/>
    <path d="M95 80 C112 48 176 44 198 76 C210 92 230 100 246 110 C262 118 262 136 248 144 C232 154 214 160 200 164
             C188 180 170 188 150 188 C120 192 92 182 78 160 C66 140 70 104 95 80 Z" fill="${fur}" ${L(4)}/>
    <path d="M152 62 L166 0 L176 16 L186 4 L190 72 Z" fill="${fur}" ${L(3.5)}/>
    <path d="M166 54 L172 22" fill="none" ${L(2)}/>
    <path d="M196 120 C220 108 248 112 252 132 C250 146 232 156 210 158 C196 150 190 132 196 120 Z" fill="#f3d9b1" ${L(3)}/>
    <ellipse cx="250" cy="126" rx="9" ry="7" fill="${INK}"/>
    ${hatch(86, 170, 5, 20, -40, 7)}
    ${eye3q(172, 100, 1.1, fur, mood)}
    <path d="M148 80 C162 70 182 70 196 80" fill="none" ${L(5)}/>
    ${CRITTER_MOUTH[mouth]}${teeth}`;
}

function skunkHead(mood = 'smug', mouth = 'smirk') {
  const fur = '#1b1b1b';
  return `
    <path d="M88 82 C68 62 76 30 102 34 C120 37 126 54 118 66 Z" fill="${fur}" ${L(3.5)}/>
    <path d="M95 74 C118 46 172 44 194 72 C206 88 226 98 252 108 C268 114 270 130 258 136 C238 146 216 150 200 152
             C190 166 176 176 156 178 C136 188 112 188 96 178 C76 166 66 144 68 120 C70 100 80 86 95 74 Z" fill="${fur}" ${L(4)}/>
    <path d="M150 58 C150 34 174 24 188 40 C196 50 192 62 184 70 Z" fill="${fur}" ${L(3.5)}/>
    <path d="M250 110 C220 92 190 70 150 52 C130 46 108 52 96 66 C120 60 150 70 176 84 C200 98 226 112 250 120 Z" fill="#fff" ${L(2.5)}/>
    <path d="M70 132 L56 140 L70 146 L58 158 L76 160 L68 172" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>
    <ellipse cx="262" cy="122" rx="11" ry="8" fill="#ff8fb3" ${L(2.5)}/>
    ${eye3q(176, 106, 1.2, '#2c2c2c', mood)}
    <path d="M150 88 C164 80 184 80 198 90" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/>
    <g transform="translate(-4 -6)">${CRITTER_MOUTH[mouth].replaceAll(INK, '#f4ecd8')}</g>`;
}

// ---------- weapons held by opponents ----------
const jamPistol = (raised = 0) => `<g transform="translate(0 ${-raised})">
  <rect x="300" y="380" width="72" height="26" rx="8" fill="#29a3d9" ${L(4)}/>
  <circle cx="330" cy="374" r="13" fill="#ffd400" ${L(3)}/><rect x="368" y="386" width="20" height="12" fill="#ffd400" ${L(3)}/>
  <rect x="310" y="402" width="16" height="26" rx="4" fill="#29a3d9" ${L(3.5)}/></g>`;
const jamSpray = `<g ${L(2.5)} fill="#f39c12"><path d="M392 372 C420 360 440 378 432 392 C452 396 446 418 424 412 C414 428 392 420 396 404 Z"/>
  <circle cx="460" cy="380" r="9"/><circle cx="478" cy="404" r="6"/><circle cx="456" cy="420" r="5"/></g>`;
const chamomile = (cx, cy, r = 24) => `<g transform="translate(${cx} ${cy})">
  ${[0, 60, 120, 180, 240, 300].map(a => `<ellipse cx="${(Math.cos(a * Math.PI / 180) * r * 0.85).toFixed(1)}" cy="${(Math.sin(a * Math.PI / 180) * r * 0.85).toFixed(1)}" rx="${r * 0.5}" ry="${r * 0.3}" fill="#fff" transform="rotate(${a} ${(Math.cos(a * Math.PI / 180) * r * 0.85).toFixed(1)} ${(Math.sin(a * Math.PI / 180) * r * 0.85).toFixed(1)})" ${L(2.5)}/>`).join('')}
  <circle r="${r * 0.62}" fill="#f6c430" ${L(3)}/><circle r="${r * 0.3}" fill="#ffe680"/>
  <path d="M${-r * 0.4} ${-r * 1.3} q6 -10 0 -18 M${r * 0.3} ${-r * 1.2} q6 -10 0 -18" fill="none" ${L(2.5)}/></g>`;

// ---------- full bodies ----------
function feet(color, frame) {
  const [ly, ry] = frame === 2 ? [474, 484] : frame === 1 ? [484, 474] : [482, 482];
  return `<ellipse cx="228" cy="${ly}" rx="30" ry="11" fill="${color}" ${L(4)}/><ellipse cx="290" cy="${ry}" rx="30" ry="11" fill="${color}" ${L(4)}/>`;
}

function squirrelBody(state, frame, headOverride = null, rot = 0) {
  const fur = '#d9773a', head = headOverride || { idle: ['smug', 'smirk'], walk: ['smug', 'smirk'], attack: ['angry', 'smirk'], pain: ['wide', 'O'] }[state] || ['smug', 'smirk'];
  return `
    <path d="M236 470 C150 470 108 400 128 330 C140 280 118 250 150 226 C182 206 210 240 190 262 C172 282 196 300 200 330 C206 380 230 410 262 430 Z" fill="#c8662e" ${L(4)}/>
    ${hatch(132, 420, 7, 60, -70, 9)}
    ${feet('#b5562a', state === 'walk' ? frame : 0)}
    <path d="M214 476 C196 430 200 350 256 336 C312 350 322 430 304 476 Z" fill="${fur}" ${L(4.5)}/>
    <path d="M238 470 C228 430 234 382 258 374 C284 382 290 430 282 470 Z" fill="#f3d9b1" ${L(3)}/>
    <path d="M222 362 C206 382 204 406 214 422" fill="none" stroke="${fur}" stroke-width="18" stroke-linecap="round"/><path d="M222 362 C206 382 204 406 214 422" fill="none" ${L(3)}/>
    ${jamPistol(state === 'attack' ? 22 : 0)}
    <path d="M296 360 C314 370 322 382 318 ${state === 'attack' ? 372 : 394}" fill="none" stroke="${fur}" stroke-width="18" stroke-linecap="round"/>
    ${state === 'attack' && frame === 2 ? `<g transform="translate(0 -22)">${jamSpray}</g>` : ''}
    <g transform="translate(150 ${state === 'walk' && frame ? 214 : 210}) scale(.56) rotate(${rot} 160 120)">${squirrelHead(...head)}</g>`;
}

function skunkBody(state, frame, headOverride = null, rot = 0) {
  const fur = '#1b1b1b', head = headOverride || { idle: ['smug', 'smirk'], walk: ['smug', 'smirk'], attack: ['angry', 'smirk'], pain: ['wide', 'O'] }[state] || ['smug', 'smirk'];
  const throwing = state === 'attack';
  return `
    <path d="M226 468 C150 470 96 400 112 300 C124 230 170 180 214 196 C240 206 236 240 210 250 C180 262 168 300 176 340 C186 390 210 420 252 440 Z" fill="${fur}" ${L(4)}/>
    <path d="M204 214 C166 232 146 300 162 360 C172 396 198 424 234 440" fill="none" stroke="#fff" stroke-width="13" stroke-linecap="round"/>
    ${feet('#2c2c2c', state === 'walk' ? frame : 0)}
    <path d="M210 478 C192 430 196 350 256 330 C316 350 326 430 308 478 Z" fill="${fur}" ${L(4.5)}/>
    <path d="M256 342 C272 382 272 440 256 476 C240 440 240 382 256 342 Z" fill="#fff" ${L(2.5)}/>
    <path d="M216 360 C200 384 200 408 212 424" fill="none" stroke="${fur}" stroke-width="18" stroke-linecap="round"/>
    ${throwing
      ? `<path d="M298 352 C330 330 340 300 336 ${frame === 2 ? 300 : 280}" fill="none" stroke="${fur}" stroke-width="18" stroke-linecap="round"/>${frame === 2 ? '' : chamomile(338, 262)}`
      : `<path d="M298 352 C316 372 322 392 316 410" fill="none" stroke="${fur}" stroke-width="18" stroke-linecap="round"/>${chamomile(322, 420, 20)}`}
    <g transform="translate(140 ${state === 'walk' && frame ? 196 : 190}) scale(.6) rotate(${rot} 160 120)">${skunkHead(...head)}</g>`;
}

// Lying on the back with a full belly: the "pancia piena" knock-out.
function lying(kind) {
  const fur = kind === 'puzzola' ? '#1b1b1b' : '#d9773a';
  const belly = kind === 'puzzola' ? '#fff' : '#f3d9b1';
  const head = kind === 'puzzola' ? skunkHead('closed', 'happy') : squirrelHead('closed', 'happy');
  return `
    <path d="M330 470 C390 470 450 440 470 400 C440 420 400 430 360 440 Z" fill="${fur}" ${L(4)}/>
    <ellipse cx="290" cy="440" rx="110" ry="44" fill="${fur}" ${L(4.5)}/>
    <ellipse cx="292" cy="414" rx="70" ry="54" fill="${belly}" ${L(4)}/>
    <path d="M262 400 C276 390 300 390 314 400" fill="none" ${L(2.5)}/>
    <ellipse cx="372" cy="402" rx="14" ry="26" transform="rotate(-30 372 402)" fill="${fur}" ${L(3.5)}/>
    <ellipse cx="398" cy="414" rx="14" ry="26" transform="rotate(-50 398 414)" fill="${fur}" ${L(3.5)}/>
    <g transform="translate(64 330) rotate(-14) scale(.52)">${head}</g>
    ${word(370, 330, 'BURP!', 46, '#ffd400', -10)}`;
}

function overlayEffect(effect, body, kind) {
  if (effect === 'gelatina') return `${body}
    <path d="M118 210 L386 210 L414 186 L146 186 Z" fill="#7ed957" opacity=".6" ${L(4)}/>
    <path d="M386 210 L414 186 L414 464 L386 488 Z" fill="#3f8f22" opacity=".6" ${L(4)}/>
    <rect x="118" y="210" width="268" height="278" fill="#5ab030" opacity=".55" ${L(4.5)}/>
    <path d="M136 230 L170 230 M136 246 L150 246" stroke="#fff" stroke-width="7" stroke-linecap="round" opacity=".9"/>`;
  if (effect === 'stordito') return `${body}${star(190, 176, 18)}${star(256, 158, 14, '#fff')}${star(322, 176, 18, '#ff8fc8')}`;
  return body;
}

export function enemySprite(kind, state, frame = 1, effect = null) {
  if (kind !== 'scoiattolo' && kind !== 'puzzola') return genericEnemy(kind, state, frame, effect);
  if (effect === 'legato' || effect === 'defeat') return genericEnemy(kind, state, frame, effect);
  const draw = kind === 'puzzola' ? skunkBody : squirrelBody;
  let inner;
  if (effect === 'panciaPiena') inner = lying(kind);
  else if (effect === 'stordito') inner = overlayEffect('stordito', draw('idle', 0, ['spiral', 'tongue'], frame === 2 ? 6 : -6), kind);
  else if (effect === 'guance') {
    inner = draw('idle', 0, ['wide', 'cheeks'])
      + ['#e84393', '#2fae4a', '#1f5fbf', '#f39c12', '#e3262b'].map((c, i) => `<ellipse cx="${150 + i * 52}" cy="${170 + (i % 2) * 30}" rx="8" ry="5" fill="${c}" ${L(2)}/>`).join('');
  } else if (effect === 'gelatina') inner = overlayEffect('gelatina', draw('pain', 0), kind);
  else inner = draw(state, frame);
  return svgDoc(512, 512, inner);
}

// ---------- projectiles & splats (64 / 128) ----------
const CONFETTI_COLORS = ['#e84393', '#2fae4a', '#1f5fbf', '#f39c12', '#e3262b'];
export const SPLAT_COLORS = { caramella: '#e3262b', confetti: '#ff8fc8', gelatina: '#7ed957', marmellata: '#f39c12', camomilla: '#f6c430', ...NEW_SPLAT_COLORS };
export function projectileSprite(kind, variant = 0) {
  const inner = {
    caramella: `<path d="M18 32 L4 20 L4 44 Z M46 32 L60 20 L60 44 Z" fill="#e3262b" ${L(3)}/><ellipse cx="32" cy="32" rx="16" ry="13" fill="#e3262b" ${L(3)}/><path d="M24 22 L38 42" stroke="#fff" stroke-width="5"/>`,
    confetti: `<ellipse cx="32" cy="32" rx="18" ry="12" fill="${CONFETTI_COLORS[variant % 5]}" ${L(3)}/><ellipse cx="26" cy="27" rx="6" ry="3" fill="#fff" opacity=".7"/>`,
    gelatina: `<path d="M10 36 C8 18 26 8 38 14 C54 10 60 30 52 42 C46 56 20 58 10 36 Z" fill="#5ab030" ${L(3)}/><ellipse cx="26" cy="24" rx="7" ry="4" fill="#d6ffb8"/>`,
    marmellata: `<path d="M32 6 C44 24 52 34 50 44 C48 56 16 56 14 44 C12 34 20 24 32 6 Z" fill="#f39c12" ${L(3)}/><ellipse cx="26" cy="38" rx="5" ry="7" fill="#ffd08a"/>`,
    camomilla: chamomile(32, 36, 20).replace(/<path d="M[^"]*q6[^"]*"[^>]*\/>/, ''),
  }[kind] || genericProjectile(kind, variant);
  // drawn on 64 and scaled to the 256 canvas: the projectile fills the middle quarter
  return svgDoc(256, 256, `<g transform="translate(72 72) scale(1.75)">${inner}</g>`, { wobble: false });
}

// A splat: the one drawn in the code for this projectile (`kind`) if there is one, else a blob of `color`.
export function splatOf(kind, color) {
  return kind && hasSplat(kind) ? genericSplat(kind) : splatSprite(color);
}
export function splatSprite(color) {
  const pts = Array.from({ length: 14 }, (_, i) => {
    const a = (i / 14) * Math.PI * 2, r = i % 2 ? 26 : 50 + (i % 3) * 6;
    return `${(64 + Math.cos(a) * r).toFixed(1)} ${(64 + Math.sin(a) * r).toFixed(1)}`;
  });
  return svgDoc(256, 256, `<g transform="translate(48 48) scale(1.25)"><path d="M${pts.join(' L')} Z" fill="${color}" ${L(4)}/><circle cx="20" cy="22" r="7" fill="${color}" ${L(2.5)}/><circle cx="108" cy="104" r="6" fill="${color}" ${L(2.5)}/></g>`, { wobble: false });
}

export function wordSprite(text, fill = '#ffd400') {
  return svgDoc(256, 128, word(128, 84, text, 60, fill, -6), { wobble: false });
}

// ---------- items (256, base y=240) ----------
export function itemSprite(id) {
  const jar = (w, h, label, big) => `
    <path d="M${128 - w / 2} ${240 - h} L${128 + w / 2} ${240 - h} L${128 + w / 2 + 6} 236 C${128 + w / 2} 242 ${128 - w / 2} 242 ${128 - w / 2 - 6} 236 Z" fill="#f2a516" ${L(4)}/>
    <rect x="${128 - w / 2 - 6}" y="${240 - h - 22}" width="${w + 12}" height="24" rx="5" fill="#e3262b" ${L(4)}/>
    <path d="M${128 - w / 2 + 8} ${240 - h - 2} C${128 - w / 2 + 10} ${240 - h + 22} ${128 - w / 2 + 20} ${240 - h + 22} ${128 - w / 2 + 22} ${240 - h}" fill="#f2a516" ${L(3)}/>
    <rect x="${128 - w / 2 + 8}" y="${240 - h * 0.62}" width="${w - 16}" height="${h * 0.34}" fill="#f4ecd8" ${L(3)}/>
    <text x="128" y="${240 - h * 0.62 + h * 0.25}" text-anchor="middle" font-family="Bangers, Impact" font-size="${big ? 34 : 22}" fill="${INK}">${label}</text>
    ${hatch(128 + w / 2 - 22, 236, 4, h * 0.5, -70, 7)}`;
  const box = (fill, dots) => `
    <path d="M60 140 L196 140 L206 240 L50 240 Z" fill="${fill}" ${L(4)}/>
    <path d="M60 140 L84 112 L220 112 L196 140 Z" fill="#fff" ${L(4)}/><path d="M196 140 L220 112 L230 212 L206 240 Z" fill="${fill}" ${L(4)}/>
    ${dots}${hatch(200, 236, 3, 80, -80, 8)}`;
  const inner = {
    miele: jar(90, 100, 'MIELE'),
    mieleGrande: jar(150, 160, 'MIELE XXL', true),
    caramelle: box('#e3262b', [[90, 180], [130, 200], [160, 170], [110, 220]].map(([x, y]) => `<g transform="translate(${x} ${y})"><path d="M-14 0 L-24 -8 L-24 8 Z M14 0 L24 -8 L24 8 Z" fill="#fff" ${L(2.5)}/><ellipse rx="14" ry="11" fill="#fff" ${L(2.5)}/></g>`).join('')),
    confetti: box('#1f5fbf', CONFETTI_COLORS.map((c, i) => `<ellipse cx="${80 + i * 24}" cy="${170 + (i % 2) * 34}" rx="11" ry="7" fill="${c}" ${L(2)}/>`).join('')),
    gelatina: `<rect x="70" y="110" width="116" height="130" rx="22" fill="#5ab030" opacity=".85" ${L(4)}/><rect x="62" y="96" width="132" height="24" rx="6" fill="#e3262b" ${L(4)}/><path d="M88 134 L88 190" stroke="#d6ffb8" stroke-width="9" stroke-linecap="round"/>`,
    sparaGelatina: `<g transform="rotate(-8 128 180)"><rect x="40" y="160" width="140" height="36" rx="10" fill="#9aa0a6" ${L(4)}/><rect x="80" y="104" width="62" height="58" rx="14" fill="#5ab030" opacity=".9" ${L(4)}/>
      <path d="M180 162 L230 150 L230 206 L180 194 Z" fill="#9aa0a6" ${L(4)}/><rect x="60" y="194" width="24" height="40" rx="5" fill="#9aa0a6" ${L(4)}/></g>${star(212, 92, 16)}${star(52, 112, 11, '#fff')}`,
    ghianda: `<path d="M84 128 C84 210 172 210 172 128 Z" fill="#ffd400" ${L(4.5)}/><path d="M74 130 C70 84 186 84 182 130 Z" fill="#a0632d" ${L(4.5)}/>
      <path d="M90 116 L104 100 M112 116 L124 98 M136 116 L148 100 M158 116 L168 104" fill="none" ${L(2.5)}/><rect x="122" y="66" width="12" height="22" rx="4" fill="#6b3f1a" ${L(3)}/>
      <path d="M104 150 C104 176 120 188 130 190" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round"/>${star(196, 92, 16)}${star(60, 180, 12, '#fff')}`,
    checkpoint: `<path d="M58 240 L72 168 L184 168 L198 240 Z" fill="#a0632d" ${L(4)}/><ellipse cx="128" cy="168" rx="56" ry="18" fill="#e2b88a" ${L(4)}/><ellipse cx="128" cy="168" rx="30" ry="9" fill="none" ${L(2.5)}/>
      <path d="M140 166 L140 40" ${L(6)}/><path d="M140 44 L204 64 L140 86 Z" fill="#e3262b" ${L(3.5)}/>`,
    checkpointOn: `<path d="M58 240 L72 168 L184 168 L198 240 Z" fill="#a0632d" ${L(4)}/><ellipse cx="128" cy="168" rx="56" ry="18" fill="#e2b88a" ${L(4)}/>
      <path d="M140 166 L140 40" ${L(6)}/><path d="M140 44 L204 64 L140 86 Z" fill="#22b14c" ${L(3.5)}/>${star(208, 40, 14)}${star(84, 76, 11, '#fff')}`,
  }[id];
  return inner ? svgDoc(256, 256, inner) : genericItem(id);
}

// ---------- big props ----------
export function exitSprite(on, kind = 'mushroom') {
  if (kind !== 'mushroom') return leverExit(on, kind === 'secret');
  return svgDoc(512, 512, `
    <path d="M216 488 C206 420 214 340 228 300 L292 300 C304 340 310 420 300 488 Z" fill="#f4ecd8" ${L(5)}/>
    ${hatch(268, 486, 5, 160, -84, 8)}
    <path d="M96 304 C96 160 416 160 416 304 C360 324 152 324 96 304 Z" fill="${on ? '#22b14c' : '#e3262b'}" ${L(5)}/>
    ${[[160, 240, 18], [236, 206, 22], [320, 236, 18], [372, 280, 12], [140, 290, 10]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" ${L(3)}/>`).join('')}
    <rect x="226" y="350" width="64" height="44" rx="10" fill="${on ? '#ffd400' : '#9aa0a6'}" ${L(4)}/>
    ${word(258, 440, on ? 'VIA!' : 'USCITA', 36, on ? '#ffd400' : '#fff', 0)}
    ${on ? star(110, 170, 20) + star(410, 170, 20) : ''}`);
}

export function doorTexture(lock = null, bonus = false) {
  // Used as a canvas texture on the door box: logs + acorn lock (or a lock plate of the key's colour; a star on a
  // bonus room's door). 256×512.
  return svgDoc(256, 512, `
    <rect width="256" height="512" fill="#8a5a33"/>
    ${[0, 1, 2, 3, 4].map(i => `<rect x="${i * 51 + 2}" y="4" width="48" height="504" rx="18" fill="${i % 2 ? '#9c6a3e' : '#7f512c'}" ${L(4)}/>`).join('')}
    <rect x="12" y="120" width="232" height="26" fill="#5a3620" ${L(4)}/><rect x="12" y="380" width="232" height="26" fill="#5a3620" ${L(4)}/>
    <circle cx="128" cy="262" r="46" fill="#3a2414" ${L(5)}/>
    ${bonus ? `${star(128, 262, 58)}${word(128, 112, 'BONUS', 44, '#ffd400', -4)}` : lock ? `<circle cx="128" cy="262" r="34" fill="${lock}" ${L(4)}/><path d="M120 250 a8 8 0 1 1 16 0 l-4 22 h-8 Z" fill="${INK}"/>`
    : `<path d="M104 252 C104 300 152 300 152 252 Z" fill="#ffd400" ${L(3.5)}/><path d="M98 254 C96 226 160 226 158 254 Z" fill="#a0632d" ${L(3.5)}/>`}
    <rect width="256" height="512" fill="none" stroke="${INK}" stroke-width="10"/>`, { wobble: false });
}

export function decorSprite(id, w = 512, h = 512) {
  const fir = (x, base, w, h) => `
    <rect x="${x - 16}" y="${base - 70}" width="32" height="70" fill="#7a4a24" ${L(4)}/>
    <path d="M${x} ${base - h} L${x + w * 0.32} ${base - h * 0.62} L${x + w * 0.2} ${base - h * 0.62} L${x + w * 0.45} ${base - h * 0.3} L${x + w * 0.3} ${base - h * 0.3} L${x + w / 2} ${base - 60}
             L${x - w / 2} ${base - 60} L${x - w * 0.3} ${base - h * 0.3} L${x - w * 0.45} ${base - h * 0.3} L${x - w * 0.2} ${base - h * 0.62} L${x - w * 0.32} ${base - h * 0.62} Z" fill="#2f8a3a" ${L(5)}/>
    ${hatch(x + 20, base - 70, 8, 160, -64, 12)}`;
  switch (id) {
    case 'abete': return svgDoc(512, 1024, fir(256, 1012, 460, 980));
    case 'betulla': return svgDoc(512, 1024, `
      <path d="M232 1012 L240 300 L272 300 L282 1012 Z" fill="#f4ecd8" ${L(5)}/>
      ${[400, 520, 640, 760, 880].map((y, i) => `<path d="M${i % 2 ? 244 : 254} ${y} l${i % 2 ? 22 : 18} -6" ${L(6)}/>`).join('')}
      ${[[256, 260, 150], [176, 380, 110], [340, 380, 110], [256, 420, 120]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#8cc85a" ${L(5)}/>`).join('')}
      ${hatch(300, 480, 7, 120, -60, 12)}`);
    case 'cespuglio': return svgDoc(512, 256, `
      ${[[140, 170, 90], [256, 140, 110], [372, 170, 90], [200, 200, 70], [320, 200, 70]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#3a9a46" ${L(5)}/>`).join('')}
      <rect x="40" y="236" width="432" height="20" fill="#3a9a46"/>${hatch(300, 250, 8, 90, -60, 12)}`);
    case 'funghi': return svgDoc(256, 256, [[80, 240, 40], [160, 240, 56], [210, 240, 30]].map(([x, b, r]) => `
      <rect x="${x - r * 0.3}" y="${b - r * 1.4}" width="${r * 0.6}" height="${r * 1.4}" fill="#f4ecd8" ${L(4)}/>
      <path d="M${x - r} ${b - r * 1.3} C${x - r} ${b - r * 2.5} ${x + r} ${b - r * 2.5} ${x + r} ${b - r * 1.3} Z" fill="#e3262b" ${L(4)}/>
      <circle cx="${x - r * 0.3}" cy="${b - r * 1.8}" r="${r * 0.18}" fill="#fff"/><circle cx="${x + r * 0.35}" cy="${b - r * 1.65}" r="${r * 0.14}" fill="#fff"/>`).join(''));
    case 'porta_rigori': return goalSprite();
    case 'palo_giostra': return poleSprite();
    case 'cartello': return svgDoc(256, 512, `
      <rect x="116" y="200" width="24" height="304" fill="#7a4a24" ${L(4)}/>
      <path d="M20 40 L236 52 L230 222 L26 210 Z" fill="#f4ecd8" ${L(5)}/>
      <text x="128" y="104" text-anchor="middle" font-family="Bangers, Impact" font-size="46" fill="#e3262b" transform="rotate(2 128 104)">VIETATO</text>
      <text x="128" y="156" text-anchor="middle" font-family="Bangers, Impact" font-size="46" fill="${INK}" transform="rotate(2 128 156)">DORMIRE</text>
      <text x="128" y="200" text-anchor="middle" font-family="Bangers, Impact" font-size="30" fill="#3b5bdb" transform="rotate(2 128 200)">Zzz</text>
      <path d="M92 172 L166 208" stroke="#e3262b" stroke-width="8" stroke-linecap="round"/>`);
    default: return genericDecor(id, w, h);
  }
}
