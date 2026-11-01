// The signposts' picture: a board on a post with the words and an arrow (up, left, right, down or none).
// The board is Claude Design's `decor/cartello_vuoto` (a blank sign) when delivered, else painted here in ink;
// the words are always written by the game (game text is English), in Bangers like the rest of the lettering.
import * as THREE from 'three';
import { assetUrl } from './registry.js';

export const SIGN_CANVAS = [256, 384]; // the post's foot is at the bottom edge
const BOARD = { x0: 22, y0: 36, x1: 234, y1: 250 }; // where the words and the arrow go
const INK = '#111';
const cache = new Map();
let blank = null; // the drawn blank sign, once loaded

function paintBoard(ctx) {
  const [w, h] = SIGN_CANVAS;
  ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = INK;
  // post
  ctx.fillStyle = '#7a4a24'; ctx.lineWidth = 8;
  ctx.beginPath(); ctx.rect(114, 230, 28, h - 236); ctx.fill(); ctx.stroke(); // (h = canvas height)
  // board: a slightly crooked plank, cream paint, thick brush outline, hatched shadow at the bottom
  ctx.fillStyle = '#f4ecd8'; ctx.lineWidth = 10;
  ctx.beginPath(); ctx.moveTo(14, 30); ctx.lineTo(244, 40); ctx.lineTo(238, 258); ctx.lineTo(18, 248); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.save(); ctx.clip(); ctx.lineWidth = 3;
  for (let x = -40; x < w; x += 14) { ctx.beginPath(); ctx.moveTo(x, 258); ctx.lineTo(x + 30, 222); ctx.stroke(); }
  ctx.restore();
  // nails
  ctx.fillStyle = INK; for (const [x, y] of [[30, 48], [226, 56], [32, 234], [224, 242]]) { ctx.beginPath(); ctx.arc(x, y, 5, 0, 7); ctx.fill(); }
}

// Splits the words into lines that fit the width at this font size.
function lines(ctx, text, maxW) {
  const out = [];
  for (const word of text.split(/\s+/)) {
    const line = out.length ? `${out[out.length - 1]} ${word}` : word;
    if (out.length && ctx.measureText(line).width <= maxW) out[out.length - 1] = line; else out.push(word);
  }
  return out;
}

function paintArrow(ctx, arrow, cx, cy) {
  const rot = { up: 0, right: Math.PI / 2, down: Math.PI, left: -Math.PI / 2 }[arrow];
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot);
  ctx.beginPath();
  ctx.moveTo(0, -38); ctx.lineTo(34, 0); ctx.lineTo(14, 0); ctx.lineTo(14, 34); ctx.lineTo(-14, 34); ctx.lineTo(-14, 0); ctx.lineTo(-34, 0); ctx.closePath();
  ctx.fillStyle = '#ffd400'; ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = INK; ctx.stroke();
  ctx.restore();
}

function paint(canvas, text, arrow) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (blank) ctx.drawImage(blank, 0, 0, canvas.width, canvas.height); else paintBoard(ctx);
  const maxW = BOARD.x1 - BOARD.x0 - 44, textBottom = arrow ? BOARD.y1 - 92 : BOARD.y1 - 16;
  let size = 50, ls;
  // the biggest lettering that fits the board
  for (; size >= 22; size -= 2) {
    ctx.font = `${size}px Bangers, Impact, sans-serif`;
    ls = lines(ctx, text, maxW);
    if (ls.length * size * 0.95 <= textBottom - BOARD.y0 - 8 && ls.every(l => ctx.measureText(l).width <= maxW)) break;
  }
  ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const top = BOARD.y0 + 8 + ((textBottom - BOARD.y0 - 8) - ls.length * size * 0.95) / 2;
  ls.forEach((l, i) => {
    ctx.save(); ctx.translate(128, top + (i + 0.5) * size * 0.95); ctx.rotate(0.02); ctx.fillText(l, 0, 0); ctx.restore();
  });
  if (arrow) paintArrow(ctx, arrow, 128, BOARD.y1 - 50);
}

// The texture of a sign with these words and this arrow (shared by every sign that says the same).
export function signTexture(text, arrow) {
  const id = `${text}|${arrow || ''}`;
  if (cache.has(id)) return cache.get(id).tex;
  loadBlank();
  const canvas = document.createElement('canvas');
  [canvas.width, canvas.height] = SIGN_CANVAS;
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const redraw = () => { paint(canvas, text, arrow); tex.needsUpdate = true; };
  redraw();
  // again once the lettering font is ready (and once the drawn blank sign has loaded)
  document.fonts?.load('40px Bangers').then(redraw).catch(() => {});
  cache.set(id, { tex, redraw });
  return tex;
}

// Loads Claude Design's blank sign once, if delivered (the list of drawings is known by the first sign),
// and repaints the signs already made with it.
let blankAsked = false;
function loadBlank() {
  if (blankAsked) return;
  blankAsked = true;
  const url = assetUrl('decor/cartello_vuoto');
  if (!url) return;
  const img = new Image();
  img.onload = () => { blank = img; for (const s of cache.values()) s.redraw(); };
  img.src = url;
}
