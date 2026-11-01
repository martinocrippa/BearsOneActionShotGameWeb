// Title art, used full screen on the title and darkened behind every menu (like DOOM's title picture).
// Title: Claude Design's animated cover (screens/title/animated: an 8 s SVG loop — black silhouettes, then the
// three bears advance from the back and shoot at the screen, Scoiattolo and Puzzola in the corners).
// Menus: their background + the bears standing still. Without the drawings: the coded punk flyer.
import { BEARS } from '../../data/bears.js';
import { bearBust } from '../art/bear.js';
import { enemySprite } from '../art/sprites.js';
import { hasAsset, assetUrl } from '../art/registry.js';

function spriteSrc(kind, frame, fallback) {
  return assetUrl(`enemies/${kind}/${frame}`) || `data:image/svg+xml;charset=utf-8,${encodeURIComponent(fallback())}`;
}

const bust = (o, flip) => `<svg viewBox="0 0 300 300" class="bust${flip ? ' flip' : ''}" aria-hidden="true"><g filter="url(#ink)">${bearBust(o)}</g></svg>`;

const ORDER = ['orsa', 'piccolo', 'grande']; // left to right, Piccolo in the middle

function drawnCover() {
  const bears = ORDER.map(id => `<img class="cover-bear" data-bear="${id}" src="${assetUrl(`characters/${id}/walk_f_1`)}" alt="">`).join('');
  return `
    <div class="flyer drawn" aria-hidden="true">
      <img class="cover-bg" src="${assetUrl('screens/title/background')}" alt="">
      <div class="cover-band">${bears}</div>
      <img class="foe left" src="${spriteSrc('scoiattolo', 'attack_fq_2', () => enemySprite('scoiattolo', 'attack', 2))}" alt="">
      <img class="foe right" src="${spriteSrc('puzzola', 'attack_fq_1', () => enemySprite('puzzola', 'attack', 1))}" alt="">
    </div>`;
}

function codedFlyer() {
  const [orsa, piccolo, grande] = BEARS;
  return `
    <div class="flyer" aria-hidden="true">
      <div class="rays"></div>
      <div class="dots"></div>
      <span class="tape t1"></span><span class="tape t2"></span>
      <span class="sticker">EP.1</span>
      <h1 class="logo">ORSI!</h1>
      <div class="band">
        <img class="foe left" src="${spriteSrc('scoiattolo', 'attack_fq_2', () => enemySprite('scoiattolo', 'attack', 2))}" alt="">
        <div class="bears-row">${bust(grande)}${bust(piccolo)}${bust(orsa, true)}</div>
        <img class="foe right" src="${spriteSrc('puzzola', 'attack_fq_1', () => enemySprite('puzzola', 'attack', 1))}" alt="">
      </div>
    </div>`;
}

let coverSvg = null;

// The animated cover is inlined (fonts and CSS animations work), so its class and keyframe names are prefixed:
// otherwise rules like `.flash` or `@keyframes flash` would clash with the game's own.
function scope(svg, prefix = 'cv-') {
  const style = /<style>([\s\S]*?)<\/style>/.exec(svg)?.[1] || '';
  const names = new Set([...style.matchAll(/\.([a-zA-Z][\w-]*)/g), ...style.matchAll(/@keyframes\s+([\w-]+)/g)].map(m => m[1]));
  let out = svg;
  for (const n of names) {
    const re = new RegExp(`(\\.|@keyframes\\s+|animation:\\s*|class="(?:[^"]*\\s)?)${n}(?![\\w-])`, 'g');
    out = out.replace(re, `$1${prefix}${n}`);
  }
  // ids too (filters, gradients, <use>): they live in the page's single id space
  const ids = [...out.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]);
  for (const id of ids) out = out.replaceAll(`id="${id}"`, `id="${prefix}${id}"`).replaceAll(`#${id})`, `#${prefix}${id})`).replaceAll(`href="#${id}"`, `href="#${prefix}${id}"`);
  // the game adds its own grain over the whole screen
  return out.replace(/<\?xml[^>]*>/, '').replace(/<rect[^>]*filter="url\(#[^)]*Gr\)"[^>]*\/>/, '');
}

// Loads the animated cover's SVG text once (call before showing the title).
export async function preloadCover() {
  const url = assetUrl('screens/title/animated');
  if (!url || coverSvg) return;
  try { const r = await fetch(url); if (r.ok) coverSvg = scope(await r.text()); } catch { /* keep the still cover */ }
}

export const hasAnimatedCover = () => !!coverSvg;

export function flyerHtml({ title = false } = {}) {
  if (title && coverSvg) return `<div class="flyer animated" aria-hidden="true">${coverSvg}</div>`;
  return hasAsset('screens/title/background') && hasAsset('characters/piccolo/walk_f_1') ? drawnCover() : codedFlyer();
}

// Brings the drawn cover to life. `still` = menus: bears already there, just idling. Returns a stop function.
export function animateFlyer(root, { still = false } = {}) {
  const flyer = root.querySelector('.flyer.drawn');
  if (!flyer) return () => {};
  const imgs = [...flyer.querySelectorAll('.cover-bear')];
  const set = (frame) => imgs.forEach(im => { im.src = assetUrl(`characters/${im.dataset.bear}/${frame}`); });
  if (still) { flyer.classList.add('alive', 'still'); return () => {}; }
  let tick = 0;
  const timers = [setTimeout(() => flyer.classList.add('alive'), 2000)];
  const iv = setInterval(() => {
    tick++;
    if (!flyer.classList.contains('alive')) return;
    // walk while advancing (about 1.6 s), then shoot in a loop
    if (tick < 22) set(`walk_f_${(tick % 4) + 1}`);
    else set(`shoot_f_${(tick % 2) + 1}`);
  }, 180);
  return () => { clearInterval(iv); timers.forEach(clearTimeout); };
}
