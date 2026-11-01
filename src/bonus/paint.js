// Coded stand-ins for the SWEET SHOT drawings (punk record-cover look: flat colours, black ink, hatching).
// The scenes are painted once into a wide panorama; birds, sweets and the rifle are drawn every frame.
// Claude Design's drawings replace them by name (bonus/<scene>/panorama, bonus/<scene>/front, bonus/birds/…).
export const WORLD_W = 3200, WORLD_H = 1080;
export const GROUND_Y = 880; // where birds land

const INK = '#111111';
const ink = (ctx, w = 4) => { ctx.strokeStyle = INK; ctx.lineWidth = w; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; };
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
function hatch(ctx, x, y, w, h, gap = 12) {
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); ink(ctx, 2); ctx.beginPath();
  for (let i = -h; i < w + h; i += gap) { ctx.moveTo(x + i, y + h); ctx.lineTo(x + i + h * 0.7, y); }
  ctx.stroke(); ctx.restore();
}
function cloud(ctx, x, y, s, fill = '#f4ecd8') {
  ctx.fillStyle = fill; ctx.beginPath();
  for (let k = 0; k < 4; k++) ctx.arc(x + k * 34 * s - 50 * s, y + (k % 2) * 8 * s, (30 + (k % 3) * 8) * s, Math.PI, 0);
  ctx.closePath(); ctx.fill(); ink(ctx, 4); ctx.stroke();
}
function hills(ctx, base, amp, fill, r, step = 40) {
  ctx.fillStyle = fill; ctx.beginPath(); ctx.moveTo(0, WORLD_H);
  for (let x = 0; x <= WORLD_W; x += step) ctx.lineTo(x, base - Math.abs(Math.sin(x / 260 + r * 3)) * amp - Math.sin(x / 90) * amp * 0.15);
  ctx.lineTo(WORLD_W, WORLD_H); ctx.closePath(); ctx.fill(); ink(ctx, 5); ctx.stroke();
}
function tree(ctx, x, base, h, crown, trunk = '#6b4a2f') {
  ctx.fillStyle = trunk; ctx.fillRect(x - h * 0.05, base - h * 0.55, h * 0.1, h * 0.55); ink(ctx, 4); ctx.strokeRect(x - h * 0.05, base - h * 0.55, h * 0.1, h * 0.55);
  ctx.fillStyle = crown; ctx.beginPath(); ctx.ellipse(x, base - h * 0.7, h * 0.28, h * 0.32, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
}

// Each scene: paint(panorama ctx, foreground ctx) and the places owls come out of (night).
export const SCENES = {
  // dawn at the pond: peach and pink sky, a low sun, hills, the pond with reeds in front
  dawn: {
    sky: '#f3b48a', dark: false,
    paint(ctx, fg) {
      const r = rng(11);
      const bands = ['#f7c9a8', '#f3b48a', '#f0a07a', '#ec8f78'];
      bands.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(0, i * 160, WORLD_W, 170); });
      ctx.fillStyle = '#ffd400'; ctx.beginPath(); ctx.arc(1600, 560, 140, 0, Math.PI * 2); ctx.fill(); ink(ctx, 6); ctx.stroke();
      for (let i = 0; i < 9; i++) cloud(ctx, 150 + i * 360 + r() * 100, 120 + r() * 200, 1 + r() * 0.6, '#ffe2cc');
      hills(ctx, 640, 110, '#c98aa0', 1);
      hills(ctx, 720, 70, '#8f9f6a', 2);
      ctx.fillStyle = '#7fb8c8'; ctx.fillRect(0, 760, WORLD_W, 320); ink(ctx, 5); ctx.beginPath(); ctx.moveTo(0, 760); ctx.lineTo(WORLD_W, 760); ctx.stroke();
      ink(ctx, 3); for (let i = 0; i < 60; i++) { const x = r() * WORLD_W, y = 790 + r() * 260; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 20, y - 8, x + 44, y); ctx.stroke(); }
      ctx.fillStyle = '#ffe680'; ctx.globalAlpha = 0.5; ctx.fillRect(1480, 770, 240, 300); ctx.globalAlpha = 1;
      // reeds in front
      for (let x = 0; x < WORLD_W; x += 18 + r() * 30) {
        const h = 140 + r() * 160; fg.fillStyle = r() < 0.5 ? '#6f8f46' : '#5a7a38';
        fg.beginPath(); fg.moveTo(x, WORLD_H); fg.quadraticCurveTo(x + 10, WORLD_H - h * 0.6, x + 4 + r() * 20, WORLD_H - h); fg.lineTo(x + 14, WORLD_H); fg.closePath(); fg.fill(); ink(fg, 3); fg.stroke();
        if (r() < 0.25) { fg.fillStyle = '#7a4a24'; fg.beginPath(); fg.ellipse(x + 8, WORLD_H - h + 10, 7, 24, 0, 0, Math.PI * 2); fg.fill(); fg.stroke(); }
      }
    },
  },
  // noon in the woods: blue sky, clouds, a clearing between big trees, bushes in front
  noon: {
    sky: '#7fd0f0', dark: false,
    paint(ctx, fg) {
      const r = rng(23);
      ctx.fillStyle = '#7fd0f0'; ctx.fillRect(0, 0, WORLD_W, WORLD_H);
      ctx.fillStyle = '#fff3b0'; ctx.beginPath(); ctx.arc(2400, 150, 90, 0, Math.PI * 2); ctx.fill(); ink(ctx, 6); ctx.stroke();
      for (let i = 0; i < 10; i++) cloud(ctx, 100 + i * 330 + r() * 80, 90 + r() * 220, 1 + r() * 0.8);
      hills(ctx, 700, 90, '#5fae5a', 3);
      for (let x = 60; x < WORLD_W; x += 200 + r() * 220) tree(ctx, x, 760 + r() * 40, 300 + r() * 220, r() < 0.5 ? '#2f8a3a' : '#3a9a46');
      ctx.fillStyle = '#8cc85a'; ctx.fillRect(0, 780, WORLD_W, 300); ink(ctx, 5); ctx.beginPath(); ctx.moveTo(0, 780); ctx.lineTo(WORLD_W, 780); ctx.stroke();
      ink(ctx, 2.5); for (let i = 0; i < 140; i++) { const x = r() * WORLD_W, y = 800 + r() * 270; ctx.beginPath(); ctx.moveTo(x - 6, y - 10); ctx.lineTo(x, y); ctx.lineTo(x + 5, y - 12); ctx.stroke(); }
      for (let x = -40; x < WORLD_W; x += 120 + r() * 120) {
        const s = 70 + r() * 60; fg.fillStyle = r() < 0.5 ? '#3a9a46' : '#2f8a3a';
        for (const [dx, dy, k] of [[0, 0, 1], [s * 0.8, 10, 0.8], [-s * 0.7, 14, 0.75]]) { fg.beginPath(); fg.arc(x + dx, WORLD_H - 40 + dy, s * k, Math.PI, 0); fg.fill(); ink(fg, 4); fg.stroke(); }
        hatch(fg, x, WORLD_H - 60, s, 60, 14);
      }
    },
  },
  // night of the owls: dark blue, a big moon, stars, bare trees with holes (owls come out of them)
  night: {
    sky: '#141a36', dark: true,
    holes: [],
    paint(ctx, fg) {
      const r = rng(37);
      ctx.fillStyle = '#141a36'; ctx.fillRect(0, 0, WORLD_W, WORLD_H);
      ctx.fillStyle = '#fff6d8'; for (let i = 0; i < 260; i++) { const x = r() * WORLD_W, y = r() * 650, s = r() < 0.1 ? 3 : 1.5; ctx.fillRect(x, y, s, s); }
      ctx.fillStyle = '#f4ecd8'; ctx.beginPath(); ctx.arc(1200, 260, 150, 0, Math.PI * 2); ctx.fill(); ink(ctx, 6); ctx.stroke();
      ctx.fillStyle = '#d8ccb0'; for (const [x, y, rr] of [[1150, 220, 26], [1250, 300, 18], [1190, 330, 12]]) { ctx.beginPath(); ctx.arc(x, y, rr, 0, Math.PI * 2); ctx.fill(); }
      hills(ctx, 760, 80, '#22284a', 4);
      ctx.fillStyle = '#1b2240'; ctx.fillRect(0, 800, WORLD_W, 280); ink(ctx, 5); ctx.beginPath(); ctx.moveTo(0, 800); ctx.lineTo(WORLD_W, 800); ctx.stroke();
      this.holes = [];
      for (let x = 160; x < WORLD_W; x += 320 + r() * 160) {
        const h = 520 + r() * 220, base = 820;
        ctx.fillStyle = '#2b2236'; ctx.beginPath();
        ctx.moveTo(x - 34, base); ctx.lineTo(x - 22, base - h); ctx.lineTo(x + 22, base - h); ctx.lineTo(x + 34, base); ctx.closePath(); ctx.fill(); ink(ctx, 5); ctx.stroke();
        for (const side of [-1, 1]) { const y = base - h * (0.5 + r() * 0.3); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + side * (110 + r() * 80), y - 60 - r() * 60); ctx.lineWidth = 14; ctx.strokeStyle = '#2b2236'; ctx.stroke(); ink(ctx, 3); ctx.stroke(); }
        const hy = base - h * (0.62 + r() * 0.2);
        ctx.fillStyle = '#05060c'; ctx.beginPath(); ctx.ellipse(x, hy, 16, 24, 0, 0, Math.PI * 2); ctx.fill(); ink(ctx, 3); ctx.stroke();
        this.holes.push({ x, y: hy });
      }
      for (let i = 0; i < 40; i++) { fg.fillStyle = '#e8ff7a'; fg.globalAlpha = 0.7; fg.beginPath(); fg.arc(r() * WORLD_W, 700 + r() * 300, 3, 0, Math.PI * 2); fg.fill(); }
      fg.globalAlpha = 1;
      for (let x = 0; x < WORLD_W; x += 26 + r() * 40) { fg.fillStyle = '#0d1226'; fg.beginPath(); fg.moveTo(x, WORLD_H); fg.lineTo(x + 10, WORLD_H - 60 - r() * 90); fg.lineTo(x + 22, WORLD_H); fg.closePath(); fg.fill(); }
    },
  },
};

// ---------- birds (side view, facing right; `dir` < 0 mirrors) ----------
export function drawBird(ctx, b, def, t) {
  const s = def.size * b.z * 60; // body radius in px
  const c = b.golden ? { body: '#ffd400', head: '#ffd400', wing: '#f0a81e', beak: '#ff7a12', breast: '#fff3a0', eyes: '#fff' } : def.colors;
  ctx.save(); ctx.translate(b.x, b.y); ctx.scale(b.dir < 0 ? -1 : 1, 1); ctx.rotate(b.rot || 0);
  const flap = Math.sin(t * (b.kind === 'uccellino' ? 28 : 16) + b.seed) > 0;
  const lw = Math.max(1.5, s * 0.08);
  ink(ctx, lw);
  if (b.effect === 'rainbow') {
    // rainbow feathers: stripes over the body
    const cols = ['#e3262b', '#ff7a12', '#ffd400', '#22b14c', '#3b8de0', '#7d5cff'];
    ctx.save(); ctx.beginPath(); ctx.ellipse(0, 0, s * 1.2, s * 0.8, 0, 0, Math.PI * 2); ctx.clip();
    cols.forEach((col, i) => { ctx.fillStyle = col; ctx.fillRect(-s * 1.3, -s + i * s * 0.34, s * 2.6, s * 0.36); });
    ctx.restore(); ctx.beginPath(); ctx.ellipse(0, 0, s * 1.2, s * 0.8, 0, 0, Math.PI * 2); ctx.stroke();
  } else {
    const fat = b.effect === 'full' ? 1.45 : 1;
    ctx.fillStyle = c.body; ctx.beginPath(); ctx.ellipse(0, 0, s * 1.2 * (fat > 1 ? 1.1 : 1), s * 0.8 * fat, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    if (c.breast) { ctx.fillStyle = c.breast; ctx.beginPath(); ctx.ellipse(s * 0.35, s * 0.2, s * 0.6, s * 0.45 * fat, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
  }
  // wing
  if (b.kind !== 'gufo' || b.state !== 'perch') {
    ctx.fillStyle = c.wing; ctx.beginPath();
    if (flap && b.state !== 'hit') { ctx.moveTo(-s * 0.4, -s * 0.2); ctx.quadraticCurveTo(-s * 0.2, -s * 1.9, s * 0.5, -s * 0.3); }
    else { ctx.moveTo(-s * 0.6, 0); ctx.quadraticCurveTo(-s * 0.1, s * 1.2, s * 0.5, 0); }
    ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  // head
  const hx = b.kind === 'gufo' ? s * 0.2 : s * 1.05, hy = b.kind === 'gufo' ? -s * 0.75 : -s * 0.55, hr = s * (b.kind === 'gufo' ? 0.62 : 0.5);
  ctx.fillStyle = b.effect === 'rainbow' ? '#ff8fc8' : c.head; ctx.beginPath(); ctx.arc(hx, hy, hr, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  if (b.kind === 'gufo') {
    // ear tufts and the big round eyes (they glow in the dark)
    ctx.fillStyle = c.head; ctx.beginPath(); ctx.moveTo(hx - hr * 0.8, hy - hr * 0.5); ctx.lineTo(hx - hr * 0.6, hy - hr * 1.4); ctx.lineTo(hx - hr * 0.2, hy - hr * 0.8); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(hx + hr * 0.8, hy - hr * 0.5); ctx.lineTo(hx + hr * 0.6, hy - hr * 1.4); ctx.lineTo(hx + hr * 0.2, hy - hr * 0.8); ctx.closePath(); ctx.fill(); ctx.stroke();
    for (const dx of [-0.38, 0.38]) {
      ctx.fillStyle = b.effect === 'full' ? '#fff' : c.eyes || '#fff'; ctx.beginPath(); ctx.arc(hx + hr * dx, hy, hr * 0.32, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(hx + hr * dx + hr * 0.06, hy, hr * (b.state === 'hit' ? 0.06 : 0.14), 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = c.beak; ctx.beginPath(); ctx.moveTo(hx - hr * 0.1, hy + hr * 0.2); ctx.lineTo(hx + hr * 0.1, hy + hr * 0.2); ctx.lineTo(hx, hy + hr * 0.5); ctx.closePath(); ctx.fill(); ctx.stroke();
  } else {
    ctx.fillStyle = c.beak; ctx.beginPath(); ctx.moveTo(hx + hr * 0.7, hy - hr * 0.1); ctx.lineTo(hx + hr * (b.kind === 'anatra' ? 1.7 : 1.3), hy + hr * 0.15); ctx.lineTo(hx + hr * 0.7, hy + hr * 0.35); ctx.closePath(); ctx.fill(); ctx.stroke();
    // a cocky half-closed eye, or a dizzy one when hit
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(hx + hr * 0.25, hy - hr * 0.15, hr * 0.26, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    if (b.state === 'hit') { ctx.beginPath(); ctx.moveTo(hx + hr * 0.1, hy - hr * 0.3); ctx.lineTo(hx + hr * 0.4, hy); ctx.moveTo(hx + hr * 0.4, hy - hr * 0.3); ctx.lineTo(hx + hr * 0.1, hy); ctx.stroke(); }
    else { ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(hx + hr * 0.32, hy - hr * 0.12, hr * 0.1, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = c.head; ctx.fillRect(hx, hy - hr * 0.45, hr * 0.55, hr * 0.25); }
  }
  // the marshmallow cloud around it
  if (b.effect === 'puff') {
    ctx.fillStyle = '#fffaf2';
    for (const [dx, dy, k] of [[-1, -0.4, 0.9], [0, -0.9, 1], [1, -0.3, 0.95], [-0.6, 0.6, 0.85], [0.7, 0.6, 0.9]]) { ctx.beginPath(); ctx.arc(dx * s * 1.1, dy * s, s * 0.75 * k, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
  }
  ctx.restore();
}

// ---------- the sweets in flight ----------
export function drawSweet(ctx, kind, x, y, s, variant = 0) {
  ink(ctx, Math.max(1.5, s * 0.12));
  if (kind === 'caramella') {
    ctx.fillStyle = '#e3262b'; ctx.beginPath(); ctx.ellipse(x, y, s, s * 0.8, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - s, y); ctx.lineTo(x - s * 1.8, y - s * 0.6); ctx.lineTo(x - s * 1.8, y + s * 0.6); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + s, y); ctx.lineTo(x + s * 1.8, y - s * 0.6); ctx.lineTo(x + s * 1.8, y + s * 0.6); ctx.closePath(); ctx.fill(); ctx.stroke();
  } else if (kind === 'confetti') {
    ctx.fillStyle = ['#e84393', '#2fae4a', '#1f5fbf', '#f39c12', '#e3262b'][variant % 5];
    ctx.beginPath(); ctx.ellipse(x, y, s * 0.9, s * 0.55, variant, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  } else {
    ctx.fillStyle = '#fffaf2'; ctx.beginPath(); ctx.ellipse(x, y, s * 1.1, s * 0.9, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffc8dc'; ctx.beginPath(); ctx.ellipse(x, y - s * 0.3, s * 0.8, s * 0.3, 0, 0, Math.PI * 2); ctx.fill();
  }
}

// ---------- the rifle: a candy-cane rifle with a jam-jar scope, seen from behind the bear's paw ----------
export function drawRifle(ctx, w, h, aimX, aimY, kick, fur = '#9a6239') {
  const bx = w * 0.7, by = h + 30 + kick * 30;
  const ang = Math.atan2(aimY - by, aimX - bx);
  const L = h * 0.5 - kick * 20;
  ctx.save(); ctx.translate(bx, by); ctx.rotate(ang);
  ink(ctx, 6);
  // the cane barrel with red and white stripes, pointing at the crosshair
  ctx.fillStyle = '#fff'; ctx.fillRect(0, -18, L, 36);
  ctx.save(); ctx.beginPath(); ctx.rect(0, -18, L, 36); ctx.clip();
  ctx.fillStyle = '#e3262b'; for (let x = -20; x < L; x += 46) { ctx.beginPath(); ctx.moveTo(x, -18); ctx.lineTo(x + 22, -18); ctx.lineTo(x + 6, 18); ctx.lineTo(x - 16, 18); ctx.closePath(); ctx.fill(); }
  ctx.restore();
  ctx.strokeRect(0, -18, L, 36);
  // the cane's hook at the end, and the jam-jar scope on top
  ctx.lineWidth = 36; ctx.strokeStyle = '#111'; ctx.beginPath(); ctx.arc(L, -34, 18, Math.PI / 2, -Math.PI / 2, true); ctx.stroke();
  ctx.lineWidth = 26; ctx.strokeStyle = '#fff'; ctx.beginPath(); ctx.arc(L, -34, 18, Math.PI / 2, -Math.PI / 2, true); ctx.stroke();
  ink(ctx, 5);
  ctx.fillStyle = '#f39c12'; ctx.fillRect(L * 0.3, -62, L * 0.32, 36); ctx.strokeRect(L * 0.3, -62, L * 0.32, 36);
  ctx.fillStyle = '#e3262b'; ctx.fillRect(L * 0.27, -68, 16, 48); ctx.strokeRect(L * 0.27, -68, 16, 48);
  ctx.fillStyle = '#bfe0f0'; ctx.beginPath(); ctx.ellipse(L * 0.62, -44, 8, 16, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  // the bear's paw holding it
  ctx.fillStyle = fur; ctx.beginPath(); ctx.ellipse(L * 0.18, 10, 64, 48, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.restore();
}
