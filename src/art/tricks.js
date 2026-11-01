// Coded stand-ins for the bonus rooms (data/tricks.js): the Topi, the jumping carp, the joust's target, the spot
// where the bear plays, the penalty goal and the joust's pole. Drawn only when Claude Design's drawing is missing.
import { L, hatch, star, svgDoc, INK } from './ink.js';
import { TOPI } from '../../data/tricks.js';

// A Topo (512 canvas, feet on y=488, about 230 px tall): pose idle | talk | cheer | sad | ready | dive.
export function topoSprite(topo, pose = 'idle', frame = 1) {
  const o = TOPI[topo] || TOPI.pescatore, fur = o.color;
  const up = pose === 'cheer' ? (frame === 2 ? -24 : -10) : 0, low = pose === 'ready' ? 26 : 0;
  const body = `
    <path d="M300 470 C380 470 420 430 410 380" fill="none" stroke="#e8a0a8" stroke-width="8" stroke-linecap="round"/>
    <ellipse cx="256" cy="${410 + low + up}" rx="62" ry="70" fill="${fur}" ${L(5)}/>
    <ellipse cx="256" cy="${425 + low + up}" rx="36" ry="44" fill="#e8e0d0" ${L(3)}/>
    <ellipse cx="226" cy="${482 + up}" rx="26" ry="9" fill="${o.accent}" ${L(4)}/><ellipse cx="286" cy="${482 + up}" rx="26" ry="9" fill="${o.accent}" ${L(4)}/>`;
  const arms = {
    cheer: `<path d="M206 ${380 + up} L170 ${300 + up} M306 ${380 + up} L342 ${300 + up}" stroke="${fur}" stroke-width="20" stroke-linecap="round"/>${star(150, 280 + up, 18)}${star(366, 270 + up, 14, '#ff8fc8')}`,
    sad: `<path d="M210 ${400 + low} C240 420 272 420 302 400" fill="none" stroke="${fur}" stroke-width="20" stroke-linecap="round"/>`,
    talk: `<path d="M306 ${390} L${frame === 2 ? 360 : 350} ${frame === 2 ? 340 : 360}" stroke="${fur}" stroke-width="20" stroke-linecap="round"/><path d="M206 390 L190 440" stroke="${fur}" stroke-width="20" stroke-linecap="round"/>`,
    ready: `<path d="M206 ${400 + low} L140 ${380 + low} M306 ${400 + low} L372 ${380 + low}" stroke="${fur}" stroke-width="20" stroke-linecap="round"/><circle cx="134" cy="${378 + low}" r="22" fill="${o.accent}" ${L(4)}/><circle cx="378" cy="${378 + low}" r="22" fill="${o.accent}" ${L(4)}/>`,
  }[pose] || `<path d="M206 390 L190 440 M306 390 L322 440" stroke="${fur}" stroke-width="20" stroke-linecap="round"/>`;
  const eyes = pose === 'sad' ? 'M226 300 l20 6 M286 300 l-20 6' : pose === 'cheer' ? 'M222 300 q12 -12 24 0 M266 300 q12 -12 24 0' : 'M222 300 l24 0 M266 300 l24 0';
  const head = `
    <circle cx="186" cy="${236 + low + up}" r="44" fill="${fur}" ${L(5)}/><circle cx="186" cy="${236 + low + up}" r="26" fill="#f2b8c0"/>
    <circle cx="326" cy="${236 + low + up}" r="44" fill="${fur}" ${L(5)}/><circle cx="326" cy="${236 + low + up}" r="26" fill="#f2b8c0"/>
    <ellipse cx="256" cy="${306 + low + up}" rx="70" ry="58" fill="${fur}" ${L(5)}/>
    <g transform="translate(0 ${low + up})"><path d="${eyes}" fill="none" ${L(6)}/>
    <ellipse cx="256" cy="332" rx="12" ry="9" fill="#e8667a" ${L(3)}/>
    <path d="M236 346 q20 ${pose === 'sad' ? -8 : 14} 40 0" fill="none" ${L(4)}/>
    <path d="M200 330 l-40 -6 M200 340 l-40 4 M312 330 l40 -6 M312 340 l40 4" ${L(2)}/></g>`;
  const hat = {
    fisher: `<path d="M196 ${262 + low + up} C200 214 312 214 316 ${262 + low + up} Z" fill="${o.accent}" ${L(4)}/><path d="M176 ${262 + low + up} L336 ${262 + low + up}" ${L(6)}/>`,
    gloves: '',
    colander: `<path d="M200 ${270 + low + up} C200 220 312 220 312 ${270 + low + up} Z" fill="${o.accent}" ${L(4)}/>${[220, 244, 268, 292].map(x => `<circle cx="${x}" cy="${248 + low + up}" r="4" fill="${INK}"/>`).join('')}`,
  }[o.hat] || '';
  const inner = `${body}${arms}${head}${hat}${hatch(300, 470 + up, 4, 60, -70, 8)}`;
  // the keeper's dive: the whole mouse leaning to its right (the game mirrors it for the other side)
  return svgDoc(512, 512, pose === 'dive' ? `<g transform="rotate(-62 256 470) translate(0 -20)">${inner}</g>` : inner);
}

// The props of the tricks: carpa / carpa_oro (jump, 512, the water on y=488), bersaglio (spin 1-3, hit; 256,
// centred), spot (the star where the bear plays, 256).
export function trickSprite(name, pose = 'jump', frame = 1) {
  if (name === 'carpa' || name === 'carpa_oro') {
    const c = name === 'carpa_oro' ? '#ffc21a' : '#d9773a', rot = frame === 2 ? 30 : -30;
    return svgDoc(512, 512, `
      <g transform="rotate(${rot} 256 300)"><path d="M150 300 C190 220 320 220 360 300 C320 380 190 380 150 300 Z" fill="${c}" ${L(5)}/>
      <path d="M360 300 L420 250 L420 350 Z" fill="${c}" ${L(5)}/><circle cx="190" cy="290" r="10" fill="${INK}"/>
      <path d="M150 304 q10 10 20 0" fill="none" ${L(3)}/>${hatch(300, 340, 4, 50, -60, 8)}</g>
      ${name === 'carpa_oro' ? star(130, 200, 20) + star(390, 190, 16, '#fff') : ''}
      ${[[200, 470, 18], [260, 480, 24], [320, 468, 16]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#9fd4f5" ${L(3)}/>`).join('')}`, { wobble: false });
  }
  if (name === 'bersaglio') {
    const squash = pose === 'hit' ? 1 : [1, 0.6, 0.18][frame - 1] ?? 1;
    const rings = ['#e3262b', '#fff', '#1f5fbf', '#fff', '#ffd400'].map((f, i) => `<circle r="${90 - i * 18}" fill="${f}" ${L(4)}/>`).join('');
    return svgDoc(256, 256, `<g transform="translate(128 128) scale(${squash} 1)">${rings}</g>${pose === 'hit' ? star(128, 128, 30, '#e3262b') + star(60, 50, 14) + star(200, 60, 12, '#fff') : ''}`, { wobble: false });
  }
  return svgDoc(256, 256, `${star(128, 150, 70)}${star(60, 70, 18, '#fff')}`, { wobble: false }); // spot
}

// The penalty goal (1024×512, posts and net) and the joust's striped pole (256×768).
export function goalSprite() {
  const net = [];
  for (let x = 120; x <= 904; x += 40) net.push(`M${x} 90 L${x} 500`);
  for (let y = 120; y <= 500; y += 40) net.push(`M100 ${y} L924 ${y}`);
  return svgDoc(1024, 512, `<path d="${net.join(' ')}" fill="none" stroke="#d8d8d0" stroke-width="3"/>
    <path d="M100 506 L100 80 L924 80 L924 506" fill="none" stroke="${INK}" stroke-width="34" stroke-linejoin="round"/>
    <path d="M100 506 L100 80 L924 80 L924 506" fill="none" stroke="#f4f4ee" stroke-width="22" stroke-linejoin="round"/>`);
}
export function poleSprite() {
  const bands = [0, 1, 2, 3, 4, 5, 6].map(i => `<rect x="112" y="${180 + i * 82}" width="32" height="82" fill="${i % 2 ? '#fff' : '#e3262b'}" ${L(3)}/>`).join('');
  return svgDoc(256, 768, `${bands}<path d="M128 180 L128 70" ${L(6)}/><path d="M128 74 L210 96 L128 120 Z" fill="#ffd400" ${L(4)}/>
    <rect x="40" y="200" width="176" height="20" rx="6" fill="#a0632d" ${L(4)}/><ellipse cx="128" cy="756" rx="60" ry="12" fill="#7a4a24" ${L(4)}/>`);
}
