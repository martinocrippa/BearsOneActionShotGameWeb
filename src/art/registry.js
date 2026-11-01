// Every picture in the game goes through here, by name (key).
// If public/assets/assets.json lists a real drawing for that key, the game uses it;
// otherwise it uses the placeholder drawn in code. Replacing art = dropping files, no code changes.
import * as THREE from 'three';
import { paintTexture } from './textures.js';

const BASE = import.meta.env?.BASE_URL ?? './'; // (no Vite in the Node tests)
let manifest = new Map();
const cache = new Map();
const pending = new Set();

// assets.json: either ["enemies/scoiattolo/walk_f_1.png", ...] or [{ "key", "path", "w", "h", "anchor" }, ...]
// (as written by scripts/import-assets-zip.mjs) or { "files": [...] }. Without a key, the key is the path
// without its extension. `w`/`h` = canvas size in px, `anchor` = [x, y] of the point that touches the ground.
export async function loadManifest() {
  try {
    const res = await fetch(`${BASE}assets/assets.json`, { cache: 'no-cache' });
    if (!res.ok) return;
    const json = await res.json();
    const list = Array.isArray(json) ? json : json.files || [];
    for (const f of list) {
      const path = typeof f === 'string' ? f : f.path;
      const key = (typeof f === 'string' ? null : f.key) || path.replace(/\.[a-z0-9]+$/i, '');
      manifest.set(key, { path, w: f.w, h: f.h, anchor: f.anchor });
    }
  } catch { /* no real drawings yet: placeholders it is */ }
}

export const hasAsset = key => manifest.has(key);
export const assetMeta = key => manifest.get(key) || null;
export const assetUrl = key => (manifest.has(key) ? `${BASE}assets/${manifest.get(key).path}` : null);

function track(img) {
  const p = new Promise(resolve => { img.onload = () => resolve(true); img.onerror = () => resolve(false); });
  pending.add(p);
  p.then(() => pending.delete(p));
  return p;
}

// Waits until every picture requested so far has loaded (or failed).
export async function whenLoaded() {
  while (pending.size) await Promise.all([...pending]);
}

// Bounding box of the visible (non-transparent) pixels: lets a billboard stand a drawing on the ground
// at a given height whatever canvas it was drawn on.
function measure(canvas, tex) {
  const { width: w, height: h } = canvas;
  const data = canvas.getContext('2d').getImageData(0, 0, w, h).data;
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x += 2) {
    if (data[(y * w + x) * 4 + 3] > 40) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  }
  tex.userData.size = { w, h };
  tex.userData.bbox = x1 < 0 ? { x0: 0, y0: 0, x1: w, y1: h } : { x0, y0, x1: x1 + 2, y1: y1 + 2 };
}

function newCanvasTexture(canvas) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

// Loads a picture; calls back with the image, or null if it fails.
function loadImage(src, then) {
  const img = new Image();
  track(img).then(ok => then(ok ? img : null));
  img.src = src;
}

// A texture from the real file, or from the SVG placeholder (function returning an SVG string) when the file is
// not delivered or fails to load.
export function svgTexture(key, svgFn, w, h) {
  if (cache.has(key)) return cache.get(key);
  const meta = manifest.get(key);
  if (meta?.w) { w = meta.w; h = meta.h; } // real drawings keep their own proportions
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const tex = newCanvasTexture(canvas);
  const fill = img => {
    if (!img) return;
    canvas.getContext('2d').drawImage(img, 0, 0, w, h);
    measure(canvas, tex);
    tex.needsUpdate = true;
  };
  const placeholder = () => loadImage(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgFn())}`, fill);
  if (manifest.has(key)) loadImage(assetUrl(key), img => (img ? fill(img) : placeholder()));
  else placeholder();
  cache.set(key, tex);
  return tex;
}

// A texture painted on canvas (walls, floors, sky) or the real file.
// `id` = a separate texture of the same picture (e.g. its own repeat for a taller wall).
export function paintedTexture(key, w, h, { repeat = null, color = null, id = key } = {}) {
  if (cache.has(id)) return cache.get(id);
  let tex;
  if (manifest.has(key)) {
    const meta = manifest.get(key);
    if (meta.w) { w = meta.w; h = meta.h; }
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    tex = newCanvasTexture(canvas);
    // the coded painting if the file fails to load
    loadImage(assetUrl(key), img => {
      canvas.getContext('2d').drawImage(img || paintTexture(key.split('/').pop(), w, h, color), 0, 0, w, h);
      tex.needsUpdate = true;
    });
  } else {
    tex = newCanvasTexture(paintTexture(key.split('/').pop(), w, h, color));
  }
  if (repeat) { tex.wrapS = THREE.RepeatWrapping; tex.repeat.set(...repeat); } // wrap only sideways: no bleeding at the top/bottom edges
  cache.set(id, tex);
  return tex;
}

// Picks the best available key for a character frame: exact view if drawn, else the front view.
export function frameKey(base, state, view, frame) {
  const exact = `${base}/${state}_${view}_${frame}`;
  if (manifest.has(exact)) return { key: exact, real: true };
  const front = `${base}/${state}_f_${frame}`;
  return { key: front, real: manifest.has(front) };
}
