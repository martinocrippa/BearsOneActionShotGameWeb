// The weapon held by the bear's paws, bottom centre (DOOM's weapon sprite). An SVG in the DOM:
// fur colours come from the chosen bear, so the same drawing works for all three.
import { L, hatch, star, INK } from '../art/ink.js';
import { assetUrl } from '../art/registry.js';
import { WEAPONS } from '../../data/weapons.js';

function arms(o) {
  return `
    <path d="M250 520 C300 440 360 400 420 380" fill="none" stroke="${INK}" stroke-width="96" stroke-linecap="round"/>
    <path d="M250 520 C300 440 360 400 420 380" fill="none" stroke="${o.fur}" stroke-width="84" stroke-linecap="round"/>
    <path d="M774 520 C724 440 664 400 604 380" fill="none" stroke="${INK}" stroke-width="96" stroke-linecap="round"/>
    <path d="M774 520 C724 440 664 400 604 380" fill="none" stroke="${o.fur}" stroke-width="84" stroke-linecap="round"/>
    ${hatch(650, 512, 8, 110, -60, 12)}`;
}
const paw = (o, x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">
  <ellipse rx="56" ry="46" fill="${o.fur}" ${L(5)}/>
  ${[[-34, -36], [-12, -48], [12, -48], [34, -36]].map(([dx, dy]) => `<ellipse cx="${dx}" cy="${dy}" rx="13" ry="15" fill="${o.light}" ${L(3.5)}/>`).join('')}
  <path d="M-22 6 C-10 -8 10 -8 22 6" fill="none" ${L(3)}/></g>`;

const DRAW = {
  zampata: o => `
    <g class="w-swipe">
      <path d="M840 540 C800 460 780 400 760 340" fill="none" stroke="${INK}" stroke-width="120" stroke-linecap="round"/>
      <path d="M840 540 C800 460 780 400 760 340" fill="none" stroke="${o.fur}" stroke-width="106" stroke-linecap="round"/>
      <g transform="translate(756 300) rotate(-14)">
        <ellipse rx="92" ry="80" fill="${o.fur}" ${L(6)}/><ellipse cx="0" cy="20" rx="46" ry="36" fill="${o.light}" ${L(4)}/>
        ${[[-60, -50], [-22, -76], [22, -76], [60, -50]].map(([dx, dy]) => `<ellipse cx="${dx}" cy="${dy}" rx="20" ry="24" fill="${o.light}" ${L(4)}/>
          <path d="M${dx} ${dy - 24} l-4 -26 l12 22" fill="#fff" ${L(3)}/>`).join('')}
      </g>
      <path class="w-flash" d="M600 240 L660 280 M590 300 L660 310 M610 360 L668 340" ${L(8)}/>
    </g>`,
  fionda: o => `
    <path d="M512 520 L512 330" stroke="${INK}" stroke-width="44" stroke-linecap="round"/><path d="M512 520 L512 330" stroke="#a0522d" stroke-width="32" stroke-linecap="round"/>
    <path d="M512 340 L420 190 M512 340 L604 190" stroke="${INK}" stroke-width="40" stroke-linecap="round"/><path d="M512 340 L420 190 M512 340 L604 190" stroke="#a0522d" stroke-width="28" stroke-linecap="round"/>
    <g class="w-band"><path d="M420 190 L500 300 M604 190 L524 300" stroke="#e84393" stroke-width="12" stroke-linecap="round"/>
      <g class="w-ammo" transform="translate(512 300)"><path d="M-22 0 L-40 -14 L-40 14 Z M22 0 L40 -14 L40 14 Z" fill="#e3262b" ${L(3)}/><ellipse rx="26" ry="21" fill="#e3262b" ${L(4)}/><path d="M-10 -14 L10 14" stroke="#fff" stroke-width="7"/></g></g>
    ${arms(o)}${paw(o, 512, 430, 0.9)}${paw(o, 560, 318, 0.7)}`,
  sparaconfetti: o => `
    <path d="M370 520 L440 300 L584 300 L654 520 Z" fill="#ffd400" ${L(7)}/>
    <path d="M410 470 L614 470" stroke="#e84393" stroke-width="24"/><path d="M410 470 L614 470" ${L(3)}/>
    ${hatch(560, 512, 6, 210, -72, 14)}
    <path d="M462 300 L474 200 L550 200 L562 300 Z" fill="#e3262b" ${L(7)}/>
    <ellipse cx="512" cy="200" rx="38" ry="12" fill="#3a1010" ${L(5)}/>
    <g class="w-flash">${['#e84393', '#2fae4a', '#1f5fbf', '#f39c12', '#e3262b', '#fff'].map((c, i) => `<ellipse cx="${430 + i * 34}" cy="${120 - (i % 3) * 30}" rx="16" ry="10" fill="${c}" transform="rotate(${i * 37} ${430 + i * 34} ${120 - (i % 3) * 30})" ${L(3)}/>`).join('')}${star(512, 150, 50, '#fff')}</g>
    ${arms(o)}${paw(o, 420, 420, 0.95)}${paw(o, 604, 420, 0.95)}`,
  gelatina: o => `
    <path d="M400 520 L452 330 L572 330 L624 520 Z" fill="#9aa0a6" ${L(7)}/>
    ${hatch(560, 512, 5, 190, -72, 14)}
    <rect x="452" y="210" width="120" height="110" rx="26" fill="#5ab030" opacity=".9" ${L(6)}/>
    <path d="M480 236 L480 290" stroke="#d6ffb8" stroke-width="12" stroke-linecap="round"/>
    <path d="M488 210 L500 150 L524 150 L536 210 Z" fill="#9aa0a6" ${L(6)}/>
    <g class="w-flash"><path d="M470 130 C460 80 500 50 520 70 C550 50 580 90 560 120 C548 150 482 156 470 130 Z" fill="#7ed957" ${L(5)}/></g>
    ${arms(o)}${paw(o, 430, 430, 0.95)}${paw(o, 594, 430, 0.95)}`,
  // Episode 1 weapons: simple coded stand-ins, used only if Claude Design's frames fail to load
  liquirizia: o => `
    <path d="M420 520 L452 300 L512 300 L512 520 Z M604 520 L572 300 L512 300 L512 520 Z" fill="#6b4a2f" ${L(7)}/>
    <rect x="452" y="150" width="56" height="160" rx="10" fill="#2a1a1a" ${L(6)}/><rect x="516" y="150" width="56" height="160" rx="10" fill="#2a1a1a" ${L(6)}/>
    <circle cx="480" cy="150" r="16" fill="#e3262b" ${L(4)}/><circle cx="544" cy="150" r="16" fill="#e3262b" ${L(4)}/>
    <g class="w-flash">${[0, 1, 2, 3, 4].map(i => `<circle cx="${430 + i * 42}" cy="${90 - (i % 2) * 30}" r="20" fill="#2a1a1a" ${L(3)}/><circle cx="${430 + i * 42}" cy="${90 - (i % 2) * 30}" r="8" fill="#ff8fc8"/>`).join('')}</g>
    ${arms(o)}${paw(o, 430, 430, 0.95)}${paw(o, 594, 430, 0.95)}`,
  zucchero: o => `
    <path d="M380 520 L470 250 L554 250 L644 520 Z" fill="#28c2b4" ${L(7)}/>${hatch(560, 512, 6, 210, -72, 14)}
    <path d="M440 260 L512 110 L584 260 Z" fill="#f4ecd8" ${L(6)}/>
    ${[[490, 130, 40], [534, 120, 44], [512, 90, 40]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#ff8fc8" ${L(5)}/>`).join('')}
    <g class="w-flash">${star(512, 60, 60, '#ff8fc8')}</g>
    ${arms(o)}${paw(o, 420, 430, 0.95)}${paw(o, 604, 430, 0.95)}`,
  balestra: o => `
    <path d="M300 250 C400 300 624 300 724 250" fill="none" stroke="${INK}" stroke-width="34" stroke-linecap="round"/><path d="M300 250 C400 300 624 300 724 250" fill="none" stroke="#ff5a8a" stroke-width="22" stroke-linecap="round"/>
    <path d="M300 250 L512 330 L724 250" fill="none" ${L(4)}/>
    <rect x="486" y="200" width="52" height="320" rx="10" fill="#a0522d" ${L(6)}/>
    <g class="w-ammo"><path d="M512 330 L512 120" stroke="#ff5a8a" stroke-width="16"/><path d="M512 330 L512 120" stroke="#fff" stroke-width="6" stroke-dasharray="12 12"/><path d="M496 130 L512 96 L528 130 Z" fill="#fff" ${L(3)}/></g>
    ${arms(o)}${paw(o, 470, 440, 0.9)}${paw(o, 560, 360, 0.75)}`,
  fizz: o => `
    <rect x="430" y="230" width="164" height="300" rx="60" fill="#e3262b" ${L(7)}/>${hatch(560, 512, 5, 200, -72, 14)}
    <rect x="452" y="300" width="120" height="70" fill="#f4ecd8" ${L(4)}/><text x="512" y="350" text-anchor="middle" font-family="Bangers, Impact" font-size="44" fill="${INK}">FIZZ</text>
    <path d="M512 230 L512 170 L600 150" fill="none" stroke="${INK}" stroke-width="26" stroke-linecap="round"/><path d="M512 230 L512 170 L600 150" fill="none" stroke="#3a3a3a" stroke-width="14" stroke-linecap="round"/>
    <g class="w-flash">${[[620, 130, 22], [660, 100, 16], [650, 150, 14], [700, 120, 18]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#a0682e" ${L(3)}/>`).join('')}</g>
    ${arms(o)}${paw(o, 430, 440, 0.95)}${paw(o, 594, 440, 0.95)}`,
  bfg: o => `
    <path d="M340 520 L420 250 L604 250 L684 520 Z" fill="#28c2b4" ${L(8)}/>${hatch(580, 512, 7, 230, -72, 14)}
    <circle cx="512" cy="230" r="110" fill="#f4ecd8" opacity=".9" ${L(7)}/>
    ${[[480, 210, '#ff2d8a'], [540, 200, '#ffd400'], [510, 260, '#28c2b4'], [560, 250, '#e3262b'], [460, 260, '#7d5cff']].map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="26" fill="${c}" ${L(3)}/>`).join('')}
    <g class="w-flash">${star(512, 110, 90, '#ff2d8a')}${star(512, 110, 50, '#ffd400')}</g>
    ${arms(o)}${paw(o, 400, 440, 1)}${paw(o, 624, 440, 1)}`,
};

// Claude Design's frames (weapons/<weapon>/<frame>): shown while idle, then the firing sequence [frame, ms].
// The Episode 1 weapons bring theirs in data/weapons.js (`frames`).
const FRAMES = {
  zampata: { idle: 'idle_1', fire: [['attack_1', 90], ['attack_2', 170]] },
  fionda: { idle: 'idle_1', fire: [['pull_1', 70], ['release_1', 170]] },
  sparaconfetti: { idle: 'idle_1', fire: [['fire_1', 90], ['recoil_1', 150]] },
  gelatina: { idle: 'idle_1', fire: [['fire_1', 50], ['recoil_1', 50]] },
};
for (const [k, w] of Object.entries(WEAPONS)) if (w.frames) FRAMES[k] = w.frames;

// Real drawings are inlined (not <img>) so CSS can recolour the fur (class="fur" / "fur-light") for each bear.
const svgCache = new Map();
function loadFrames() {
  const jobs = [];
  for (const [w, f] of Object.entries(FRAMES)) {
    for (const frame of [f.idle, ...f.fire.map(([n]) => n)]) {
      const url = assetUrl(`weapons/${w}/${frame}`);
      if (!url) continue;
      // a picture that is not SVG cannot be inlined: shown as an image (the fur keeps its drawn colour)
      if (!/\.svg(\?|$)/i.test(url)) { svgCache.set(`${w}/${frame}`, `<img src="${url}" alt="">`); continue; }
      jobs.push(fetch(url).then(r => (r.ok ? r.text() : '')).then(t => {
        // drop the XML header and the fixed size of the root <svg>: CSS sizes it
        if (t) svgCache.set(`${w}/${frame}`, t.replace(/<\?xml[^>]*>/, '').replace(/<svg[^>]*>/, tag => tag.replace(/\s(width|height)="[^"]*"/g, '')));
      }).catch(() => {}));
    }
  }
  return Promise.all(jobs);
}

export function createWeaponView(root) {
  const el = document.createElement('div');
  el.className = 'weapon-view';
  root.appendChild(el);
  let current = null, bear = null, timers = [], lastBob = '';
  const ready = loadFrames();
  const real = w => svgCache.has(`${w}/${FRAMES[w].idle}`);
  const drawFrame = frame => { el.innerHTML = svgCache.get(`${current}/${frame}`) || el.innerHTML; };
  return {
    ready,
    show(weapon, o) {
      if (weapon === current && o === bear) return;
      timers.forEach(clearTimeout); timers = []; // a firing sequence of the previous weapon must not draw over this one
      current = weapon; bear = o;
      el.style.setProperty('--fur', o.fur);
      el.style.setProperty('--fur-light', o.light);
      el.classList.toggle('drawn', real(weapon));
      if (real(weapon)) drawFrame(FRAMES[weapon].idle);
      else el.innerHTML = `<svg viewBox="0 0 1024 512" xmlns="http://www.w3.org/2000/svg"><g filter="url(#ink)">${DRAW[weapon](o)}</g></svg>`;
      el.classList.remove('raise'); void el.offsetWidth; el.classList.add('raise');
    },
    fire() {
      timers.forEach(clearTimeout); timers = [];
      if (real(current)) {
        let t = 0;
        for (const [frame, ms] of FRAMES[current].fire) { timers.push(setTimeout(() => drawFrame(frame), t)); t += ms; }
        timers.push(setTimeout(() => drawFrame(FRAMES[current].idle), t));
        return;
      }
      el.classList.remove('fire'); void el.offsetWidth; el.classList.add('fire');
      timers.push(setTimeout(() => el.classList.remove('fire'), current === 'zampata' ? 320 : current === 'bfg' ? 700 : 160));
    },
    // Redraw even if nothing changed (e.g. once the drawn frames have finished loading).
    refresh(weapon, o) { current = null; this.show(weapon, o); },
    // Walking sway: only the container moves (a transform, no restyle of the drawing inside); skipped when still.
    bob(x, y) {
      const t = `translate(calc(-50% + ${Math.round(x)}px), ${Math.round(y)}px)`;
      if (t !== lastBob) { el.style.transform = t; lastBob = t; }
    },
    set visible(v) { el.style.display = v ? '' : 'none'; },
  };
}
