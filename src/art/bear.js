// Placeholder drawings of the three bears (three-quarter view, punk record-cover style).
// Coordinates live in a 300×300 box; the head occupies roughly x 60-275, y 0-195.
import { L, hatch, eye3q, INK } from './ink.js';

const HEAD = `M95 74 C118 46 172 44 194 72 C204 86 216 94 240 99 C262 103 272 118 263 133 C252 150 232 162 212 166
  C200 178 184 184 163 184 C146 194 126 196 112 190 C88 176 70 158 69 130 C68 104 79 86 95 74 Z`;

const MOUTHS = {
  smirk: `<path d="M170 160 C188 170 210 164 230 150" fill="none" ${L(4)}/>
          <path d="M170 160 C163 156 163 149 170 146" fill="none" ${L(3)}/>
          <path d="M200 166 L201 175 L210 174 L209 164 Z" fill="#fff" ${L(2.5)}/>`,
  grin: `<path d="M166 154 C184 182 220 178 236 148 C216 160 190 162 166 154 Z" fill="#7a1f24" ${L(4)}/>
         <path d="M176 158 L180 166 L188 160 L192 168 L200 161 L204 169 L212 160 L216 166 L224 156" fill="#fff" ${L(2)}/>
         <path d="M190 172 C200 178 214 174 222 166 C212 168 200 170 190 172 Z" fill="#e8667a"/>`,
  calm: `<path d="M176 162 C194 170 214 166 230 154" fill="none" ${L(4)}/>
         <path d="M176 162 C170 160 168 155 172 151" fill="none" ${L(3)}/>`,
  O: `<ellipse cx="206" cy="162" rx="10" ry="13" fill="#7a1f24" ${L(3.5)}/>`,
  flat: `<path d="M182 164 C198 166 214 162 228 156" fill="none" ${L(4)}/>`,
  yawn: `<path d="M170 148 C176 192 228 192 240 142 C218 152 192 154 170 148 Z" fill="#7a1f24" ${L(4)}/>
         <path d="M190 178 C204 186 222 182 230 170 C216 172 202 174 190 178 Z" fill="#e8667a"/>`,
  asleep: `<path d="M184 164 C198 170 214 166 226 158" fill="none" ${L(3.5)}/>
           <path d="M196 168 C194 178 200 184 204 176" fill="#bfe3ff" ${L(2)}/>`,
};

// mood: sveglio · colpito · assonnato · sbadiglio · addormentato · ghigno · invincibile
export function bearHead(o, mood = 'sveglio') {
  const crest = {
    crazy: `<path d="M98 70 L84 18 L112 50 L110 2 L134 46 L148 -2 L154 44 L178 12 L170 58 Z" fill="${o.hair}" ${L(3.5)}/>
            <path d="M112 50 L106 30 M134 46 L132 26 M154 44 L158 24" fill="none" ${L(2)}/>`,
    mild: `<path d="M110 60 L108 28 L126 48 L134 22 L146 46 L164 30 L164 60 Z" fill="${o.hair}" ${L(3.5)}/>`,
    pony: `<path d="M92 84 C52 70 28 112 38 160 C46 138 58 120 84 116 Z" fill="${o.hair}" ${L(3.5)}/>
           <path d="M50 110 C44 124 42 136 44 146 M62 100 C56 112 54 122 54 132" fill="none" ${L(2)}/>`,
  }[o.crest];
  const band = o.crest === 'pony'
    ? `<path d="M90 80 C120 52 170 48 198 74" fill="none" stroke="${INK}" stroke-width="15" stroke-linecap="round"/>
       <path d="M90 80 C120 52 170 48 198 74" fill="none" stroke="${o.band}" stroke-width="9" stroke-linecap="round"/>` : '';
  const glasses = o.glasses && mood !== 'invincibile'
    ? `<g fill="none"><path d="M146 92 L110 82" ${L(6)}/>
         <rect x="146" y="78" width="54" height="40" rx="11" ${L(13)}/><rect x="146" y="78" width="54" height="40" rx="11" stroke="#22b14c" stroke-width="7"/>
         <path d="M200 92 L206 92" ${L(7)}/>
         <path d="M206 82 C214 79 224 80 228 84 L226 112 C220 116 210 116 206 112 Z" ${L(11)}/>
         <path d="M206 82 C214 79 224 80 228 84 L226 112 C220 116 210 116 206 112 Z" stroke="#22b14c" stroke-width="6"/></g>` : '';
  const eyeMood = { sveglio: 'smug', colpito: 'wide', assonnato: 'sleepy', sbadiglio: 'closed', addormentato: 'closed', ghigno: 'angry', invincibile: 'shades' }[mood];
  const mouth = { sveglio: o.mouth, colpito: 'O', assonnato: 'flat', sbadiglio: 'yawn', addormentato: 'asleep', ghigno: 'grin', invincibile: 'smirk' }[mood];
  const brow = mood === 'colpito' ? `<path d="M150 66 C166 56 186 58 200 66" fill="none" ${L(5)}/>`
    : mood === 'ghigno' || mood === 'invincibile' ? '' : `<path d="M150 76 C166 66 186 66 200 76" fill="none" ${L(5)}/>`;
  const sweat = mood === 'colpito' ? `<path d="M120 60 C112 74 114 84 122 84 C130 84 130 74 120 60 Z" fill="#bfe3ff" ${L(2.5)}/>` : '';
  const cap = mood === 'addormentato'
    ? `<path d="M84 86 C96 30 170 20 200 70 C214 40 246 34 262 54 L250 72 C238 60 222 62 204 84 Z" fill="#3b5bdb" ${L(4)}/>
       <path d="M84 86 C120 66 170 62 204 84" fill="none" stroke="#fff" stroke-width="10"/><path d="M84 86 C120 66 170 62 204 84" fill="none" ${L(3)}/>
       <circle cx="264" cy="54" r="12" fill="#fff" ${L(3)}/>
       <circle cx="272" cy="140" r="12" fill="#bfe3ff" opacity=".9" ${L(2.5)}/>
       <text x="226" y="30" font-family="Bangers, Impact" font-size="34" fill="#fff" stroke="${INK}" stroke-width="2" paint-order="stroke">Zzz</text>` : '';
  return `
    ${o.crest === 'pony' ? crest : ''}
    <path d="M88 82 C68 62 76 30 102 34 C120 37 126 54 118 66 Z" fill="${o.fur}" ${L(3.5)}/>
    <path d="M94 70 C88 58 94 46 104 46" fill="none" ${L(2.5)}/>
    <path d="${HEAD}" fill="${o.fur}" ${L(4)}/>
    ${o.crest !== 'pony' && mood !== 'addormentato' ? crest : ''}
    <path d="M150 58 C150 34 174 24 188 40 C196 50 192 62 184 70 Z" fill="${o.fur}" ${L(3.5)}/>
    <path d="M160 54 C162 42 172 38 180 44" fill="none" ${L(2.5)}/>
    ${band}
    <path d="M198 108 C222 98 254 102 262 124 C262 142 242 158 212 162 C196 150 190 122 198 108 Z" fill="${o.light}" ${L(3)}/>
    <path d="M72 138 L60 146 L74 150 L62 162 L78 164 L70 174" fill="none" ${L(3)}/>
    ${hatch(84, 178, 6, 22, -40, 7)}
    <ellipse cx="258" cy="117" rx="15" ry="11" fill="${INK}"/><ellipse cx="254" cy="112" rx="5" ry="3" fill="#fff" opacity=".8"/>
    <path d="M232 128 C236 136 240 140 246 140" fill="none" ${L(3)}/>
    ${eye3q(176, 97, 1.15, o.fur, eyeMood, o.iris)}
    ${brow}${glasses}${MOUTHS[mouth]}${sweat}${cap}`;
}

// Bust as on the record cover. `pajama` swaps the shirt for the nightgown.
export function bearBust(o, mood = 'sveglio', { pajama = false } = {}) {
  const id = 'sh' + o.id + (pajama ? 'p' : '');
  const shirt = 'M24 300 C34 238 82 208 126 202 L196 202 C242 208 280 238 292 300 Z';
  const fill = pajama ? '#cfe0ff' : o.shirt;
  const pattern = pajama
    ? `<g clip-path="url(#${id})" fill="#3b5bdb">${Array.from({ length: 24 }, (_, i) => `<circle cx="${30 + (i % 8) * 36 + (Math.floor(i / 8) % 2) * 18}" cy="${222 + Math.floor(i / 8) * 28}" r="5"/>`).join('')}</g>`
    : o.stripes ? `<g clip-path="url(#${id})">${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `<path d="M${10 + i * 38} 300 L${40 + i * 30} 200 L${58 + i * 30} 200 L${30 + i * 38} 300 Z" fill="${o.stripes}"/>`).join('')}</g>` : '';
  return `
    <g transform="translate(158 300) scale(${o.shoulders} 1) translate(-158 -300)">
      <clipPath id="${id}"><path d="${shirt}"/></clipPath>
      <path d="${shirt}" fill="${fill}"/>${pattern}
      <path d="${shirt}" fill="none" ${L(4)}/>
      ${hatch(224, 300, 9, 70, -62, 7)}
      <path d="M118 204 C138 226 184 228 204 204" fill="none" ${L(4)}/>
    </g>
    <g transform="translate(160 200) scale(${o.bodyScale + 0.08}) translate(-160 -200)">${bearHead(o, mood)}</g>`;
}

// Square "record cover": coloured background, hand-written title, bust.
export function bearCover(o, { title = true } = {}) {
  return `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
    <rect width="300" height="300" fill="${o.bg}"/>
    <g filter="url(#ink)"><g transform="translate(22 46) scale(.86)">${bearBust(o)}</g></g>
    ${title ? `<text x="16" y="44" font-family="Permanent Marker, cursive" font-size="34" fill="${INK}" transform="rotate(-4 16 44)">${o.title}</text>` : ''}
  </svg>`;
}

// Seen from behind (the TRACTOR RACE: the other bear's tractor, ahead): the back of the head, the ears, the shirt.
// 512×512, feet on y=488 like the characters' drawings, about 300 px tall.
export function bearBack(o) {
  const crest = o.crest === 'crazy'
    ? `<path d="M226 150 L214 112 L238 136 L246 100 L262 134 L282 106 L280 146 Z" fill="${o.hair}" ${L(4)}/>`
    : o.crest === 'pony'
      ? `<path d="M240 150 C236 130 276 130 272 150 Z" fill="${o.band || o.hair}" ${L(4)}/><path d="M246 152 C232 190 236 232 256 262 C276 232 280 190 266 152 Z" fill="${o.hair}" ${L(4)}/>`
      : `<path d="M232 150 L234 124 L250 142 L260 118 L270 142 L284 128 L282 152 Z" fill="${o.hair}" ${L(4)}/>`;
  const stripes = o.stripes ? [0, 1, 2].map(i => `<path d="M178 ${330 + i * 28} H334" stroke="${o.stripes}" stroke-width="10"/>`).join('') : '';
  return `<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <path d="M196 410 L196 488 L246 488 L248 420 Z M316 410 L316 488 L266 488 L264 420 Z" fill="${o.pants}" ${L(5)}/>
    <path d="M150 340 C140 380 146 410 160 420 L176 404 C170 384 172 360 180 340 Z M362 340 C372 380 366 410 352 420 L336 404 C342 384 340 360 332 340 Z" fill="${o.fur}" ${L(5)}/>
    <path d="M172 300 C176 282 214 270 256 270 C298 270 336 282 340 300 L346 420 L166 420 Z" fill="${o.shirt}" ${L(6)}/>
    ${stripes}
    ${hatch(300, 416, 6, 90, -70, 11)}
    <circle cx="190" cy="168" r="30" fill="${o.fur}" ${L(5)}/><circle cx="322" cy="168" r="30" fill="${o.fur}" ${L(5)}/>
    <circle cx="190" cy="168" r="14" fill="${o.light}" ${L(3)}/><circle cx="322" cy="168" r="14" fill="${o.light}" ${L(3)}/>
    <path d="M182 232 C176 176 212 148 256 148 C300 148 336 176 330 232 C326 268 296 286 256 286 C216 286 186 268 182 232 Z" fill="${o.fur}" ${L(6)}/>
    <path d="M230 270 C240 262 272 262 282 270" fill="none" ${L(3)}/>
    ${crest}
  </svg>`;
}

// Full body in nightgown, cap and striped socks: the "buonanotte" scene. Box 300×460.
export function bearPajama(o) {
  const legs = [118, 182].map(x => `
    <rect x="${x - 17}" y="372" width="34" height="62" rx="8" fill="#fff" ${L(4)}/>
    ${[386, 400, 414].map(y => `<path d="M${x - 17} ${y} H${x + 17}" stroke="#e3262b" stroke-width="6"/>`).join('')}
    <path d="M${x - 24} 450 C${x - 26} 430 ${x + 26} 430 ${x + 30} 450 Z" fill="#ff8fc8" ${L(4)}/>`).join('');
  return `<svg viewBox="0 0 300 460" xmlns="http://www.w3.org/2000/svg"><g filter="url(#ink)">
    ${legs}
    <path d="M70 206 C90 196 210 196 232 206 L262 384 C200 396 100 396 40 384 Z" fill="#cfe0ff" ${L(4.5)}/>
    <g fill="#3b5bdb">${Array.from({ length: 22 }, (_, i) => `<circle cx="${70 + (i % 6) * 34 + (Math.floor(i / 6) % 2) * 16}" cy="${236 + Math.floor(i / 6) * 40}" r="6"/>`).join('')}</g>
    ${hatch(206, 380, 8, 150, -76, 7)}
    <path d="M76 214 C52 260 50 300 64 330" fill="none" stroke="${o.fur}" stroke-width="26" stroke-linecap="round"/><path d="M76 214 C52 260 50 300 64 330" fill="none" ${L(3)}/>
    <path d="M226 214 C250 250 254 270 232 292" fill="none" stroke="${o.fur}" stroke-width="26" stroke-linecap="round"/>
    <g transform="translate(206 268) rotate(-12)"><ellipse rx="22" ry="26" fill="#b98a5a" ${L(3.5)}/><circle cx="-14" cy="-24" r="8" fill="#b98a5a" ${L(3)}/><circle cx="14" cy="-24" r="8" fill="#b98a5a" ${L(3)}/><circle cx="-6" cy="-4" r="2.5" fill="${INK}"/><circle cx="6" cy="-4" r="2.5" fill="${INK}"/></g>
    <g transform="translate(-6 10)">${bearHead(o, 'addormentato')}</g>
  </g></svg>`;
}

// Small square head for the HUD (box 300×300 → shown at ~110 px).
export function bearFace(o, mood) {
  return `<svg viewBox="40 -12 250 230" xmlns="http://www.w3.org/2000/svg"><g filter="url(#ink)">${bearHead(o, mood)}</g></svg>`;
}
