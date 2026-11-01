// Shared drawing helpers for the placeholder art: the "punk record cover" look
// (black brush ink, flat colours, hatching). Every function returns an SVG fragment string.

export const INK = '#111111';

// Stroke attributes for an ink line of width w.
export const L = (w = 3.5) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;

// Parallel hatching lines: n lines of length len, angle in degrees, spaced by gap.
export function hatch(x, y, n, len, ang = -55, gap = 6, w = 2) {
  const r = (ang * Math.PI) / 180, dx = Math.cos(r) * len, dy = Math.sin(r) * len;
  let p = '';
  for (let i = 0; i < n; i++) p += `M${x + i * gap} ${y} l${dx.toFixed(1)} ${dy.toFixed(1)} `;
  return `<path d="${p}" fill="none" ${L(w)}/>`;
}

// Filters every standalone SVG needs: a slight hand-made wobble of the ink.
export const DEFS = `<defs>
  <filter id="ink" x="-5%" y="-5%" width="110%" height="110%">
    <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" seed="7" result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="2.2"/>
  </filter>
</defs>`;

// Wraps a drawing into a complete SVG document (for <img> / textures).
export function svgDoc(w, h, inner, { wobble = true, viewBox } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${viewBox || `0 0 ${w} ${h}`}">${DEFS}<g ${wobble ? 'filter="url(#ink)"' : ''}>${inner}</g></svg>`;
}

// Eye seen in three-quarter view, looking right. Moods change lid, pupil and shape.
export function eye3q(cx, cy, s, lidColor, mood = 'smug', iris = INK) {
  const t = `transform="translate(${cx} ${cy}) scale(${s})"`;
  const white = `<path d="M-17 2 C-11 -10 9 -12 18 -2 C11 8 -7 10 -17 2 Z" fill="#fff" ${L(3)}/>`;
  const pupil = (dx = 6, r = 5.2) => `<circle cx="${dx}" cy="0" r="${r}" fill="${iris}"/><circle cx="${dx}" cy="0" r="${r * 0.55}" fill="${INK}"/><circle cx="${dx - 2}" cy="-2" r="1.4" fill="#fff"/>`;
  switch (mood) {
    case 'wide':
      return `<g ${t}><ellipse cx="1" cy="-1" rx="16" ry="13" fill="#fff" ${L(3)}/>${pupil(2, 4)}<path d="M-16 -18 C-6 -26 8 -26 18 -18" fill="none" ${L(4)}/></g>`;
    case 'sleepy':
      return `<g ${t}>${white}${pupil(4)}<path d="M-18 3 C-11 -12 11 -14 20 -1 C10 2 -6 4 -18 3 Z" fill="${lidColor}" ${L(3.2)}/><path d="M-19 4 C-8 2 8 2 20 0" fill="none" ${L(4.5)}/></g>`;
    case 'closed':
      return `<g ${t}><path d="M-17 0 C-8 9 9 9 18 -1" fill="none" ${L(4)}/><path d="M-12 7 l-3 5 M0 9 l0 6 M11 6 l3 5" ${L(2)}/></g>`;
    case 'spiral':
      return `<g ${t}><ellipse cx="0" cy="-1" rx="16" ry="13" fill="#fff" ${L(3)}/><path d="M0 -1 m-2 0 a2 2 0 1 1 4 0 a4 4 0 1 1 -8 0 a6 6 0 1 1 12 0 a8 8 0 1 1 -16 0" fill="none" ${L(2)}/></g>`;
    case 'angry':
      return `<g ${t}>${white}${pupil(5)}<path d="M-18 -4 L20 -12 L20 -3 C10 -4 -6 -3 -18 -4 Z" fill="${lidColor}" ${L(3)}/><path d="M-20 -6 L22 -16" fill="none" ${L(5)}/></g>`;
    case 'shades':
      return `<g ${t}><path d="M-24 -10 L40 -12 L36 6 C26 12 6 10 -2 4 C-8 10 -20 8 -24 -2 Z" fill="${INK}"/><path d="M-10 -6 L4 -7" stroke="#fff" stroke-width="2.5" opacity=".7"/></g>`;
    default: // smug: half-closed, cocky
      return `<g ${t}>${white}${pupil()}<path d="M-18 1 C-11 -13 11 -15 20 -3 C10 -4 -6 -4 -18 1 Z" fill="${lidColor}" ${L(3.2)}/><path d="M-20 1 C-11 -14 11 -16 21 -3" fill="none" ${L(5)}/></g>`;
  }
}

// Five-point star (for dizzy stars, sparkles).
export function star(x, y, r, fill = '#ffd400') {
  let p = '';
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r;
    p += `${i ? 'L' : 'M'}${(x + Math.cos(a) * rr).toFixed(1)} ${(y + Math.sin(a) * rr).toFixed(1)} `;
  }
  return `<path d="${p}Z" fill="${fill}" ${L(2.5)}/>`;
}

// Comic sound word with ink outline.
export function word(x, y, text, size = 34, fill = '#fff', rot = -8) {
  return `<text x="${x}" y="${y}" font-family="Bangers, Impact, sans-serif" font-size="${size}" fill="${fill}" stroke="${INK}" stroke-width="2.5" paint-order="stroke" transform="rotate(${rot} ${x} ${y})" text-anchor="middle">${text}</text>`;
}
