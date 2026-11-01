// Wall, floor and sky textures painted on a 2D canvas: flat colours, black ink, hatching.
// Deterministic (seeded) so every run looks the same.

const INK = '#111111';

function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

function inkLine(ctx, w = 3) { ctx.strokeStyle = INK; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; }

function hatch(ctx, x, y, w, h, gap = 9, ang = -0.9) {
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  inkLine(ctx, 2);
  ctx.beginPath();
  for (let i = -h; i < w + h; i += gap) {
    ctx.moveTo(x + i, y + h);
    ctx.lineTo(x + i + Math.cos(ang) * h * 1.6, y + h + Math.sin(ang) * h * 1.6);
  }
  ctx.stroke();
  ctx.restore();
}

function border(ctx, w, h, lw = 6) { inkLine(ctx, lw); ctx.strokeRect(lw / 2, lw / 2, w - lw, h - lw); }

const PAINTERS = {
  // ---- walls: 256×512 (a 2 m × 4 m face) ----
  wall_tronchi(ctx, w, h, r) {
    const n = 6, lh = h / n;
    for (let i = 0; i < n; i++) {
      const y = i * lh;
      ctx.fillStyle = i % 2 ? '#9c6a3e' : '#86562f';
      ctx.beginPath(); ctx.roundRect(2, y + 3, w - 4, lh - 6, lh / 2); ctx.fill();
      inkLine(ctx, 4); ctx.stroke();
      inkLine(ctx, 2);
      for (let k = 0; k < 3; k++) {
        const gx = 30 + r() * (w - 80), gy = y + lh * (0.3 + r() * 0.4);
        ctx.beginPath(); ctx.moveTo(gx, gy); ctx.quadraticCurveTo(gx + 20, gy - 4, gx + 40 + r() * 20, gy); ctx.stroke();
      }
      hatch(ctx, 10, y + lh * 0.62, w - 20, lh * 0.3, 10);
    }
    border(ctx, w, h);
  },
  wall_siepe(ctx, w, h, r) {
    ctx.fillStyle = '#2f8a3a'; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 140; i++) {
      const x = r() * w, y = r() * h, s = 10 + r() * 16;
      ctx.fillStyle = r() < 0.5 ? '#3a9a46' : '#25752f';
      ctx.beginPath(); ctx.ellipse(x, y, s, s * 0.6, r() * 3, 0, Math.PI * 2); ctx.fill();
      inkLine(ctx, 2); ctx.beginPath(); ctx.arc(x, y, s * 0.7, Math.PI * 0.1, Math.PI * 0.9); ctx.stroke();
    }
    hatch(ctx, 0, h * 0.7, w, h * 0.3, 11);
    border(ctx, w, h);
  },
  wall_roccia(ctx, w, h, r) {
    ctx.fillStyle = '#a3a39a'; ctx.fillRect(0, 0, w, h);
    const rows = 5, rh = h / rows;
    for (let i = 0; i < rows; i++) {
      let x = -r() * 60;
      while (x < w) {
        const bw = 70 + r() * 70;
        ctx.fillStyle = r() < 0.5 ? '#b3b3a8' : '#97978d';
        ctx.beginPath();
        ctx.moveTo(x + 6, i * rh + 6 + r() * 6); ctx.lineTo(x + bw - 6, i * rh + 4 + r() * 8);
        ctx.lineTo(x + bw - 2, (i + 1) * rh - 6); ctx.lineTo(x + 2, (i + 1) * rh - 4 - r() * 6); ctx.closePath();
        ctx.fill(); inkLine(ctx, 4); ctx.stroke();
        if (r() < 0.5) hatch(ctx, x + bw * 0.5, i * rh + rh * 0.5, bw * 0.45, rh * 0.45, 8);
        x += bw;
      }
    }
    border(ctx, w, h);
  },
  wall_legno(ctx, w, h, r) {
    const n = 4, pw = w / n;
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = i % 2 ? '#c08a55' : '#b07a45';
      ctx.fillRect(i * pw, 0, pw, h);
      inkLine(ctx, 4); ctx.strokeRect(i * pw + 2, 2, pw - 4, h - 4);
      inkLine(ctx, 2);
      for (let k = 0; k < 4; k++) {
        const gx = i * pw + 10 + r() * (pw - 20), gy = r() * h;
        ctx.beginPath(); ctx.moveTo(gx, gy); ctx.bezierCurveTo(gx + 6, gy + 40, gx - 6, gy + 80, gx + 2, gy + 120); ctx.stroke();
      }
      if (r() < 0.6) { ctx.beginPath(); ctx.ellipse(i * pw + pw / 2, r() * h, 8, 12, 0, 0, Math.PI * 2); ctx.fillStyle = '#7a4a24'; ctx.fill(); ctx.stroke(); }
    }
    hatch(ctx, 0, h * 0.8, w, h * 0.2, 10);
    border(ctx, w, h);
  },
  // ---- floors: 256×256 (2 m × 2 m) ----
  floor_erba(ctx, w, h, r) {
    ctx.fillStyle = '#8cc85a'; ctx.fillRect(0, 0, w, h);
    inkLine(ctx, 2.5);
    for (let i = 0; i < 26; i++) {
      const x = r() * w, y = r() * h;
      ctx.beginPath(); ctx.moveTo(x - 6, y - 10); ctx.lineTo(x, y); ctx.lineTo(x + 5, y - 12); ctx.stroke();
    }
    ctx.fillStyle = '#7ab84a';
    for (let i = 0; i < 10; i++) { ctx.beginPath(); ctx.arc(r() * w, r() * h, 6 + r() * 10, 0, Math.PI * 2); ctx.fill(); }
    border(ctx, w, h, 2);
  },
  floor_terra(ctx, w, h, r) {
    ctx.fillStyle = '#c8a06a'; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 30; i++) {
      ctx.fillStyle = r() < 0.5 ? '#b38a55' : '#d8b585';
      ctx.beginPath(); ctx.ellipse(r() * w, r() * h, 4 + r() * 8, 3 + r() * 5, r() * 3, 0, Math.PI * 2); ctx.fill();
      if (r() < 0.3) { inkLine(ctx, 2); ctx.stroke(); }
    }
    border(ctx, w, h, 2);
  },
  floor_fango(ctx, w, h, r) {
    ctx.fillStyle = '#6e4a2f'; ctx.fillRect(0, 0, w, h);
    // soft puddles of darker and lighter mud
    for (let i = 0; i < 9; i++) {
      ctx.fillStyle = r() < 0.5 ? '#5d3d25' : '#80583a';
      ctx.beginPath(); ctx.ellipse(r() * w, r() * h, 30 + r() * 40, 18 + r() * 24, r() * 3, 0, Math.PI * 2); ctx.fill();
    }
    // sticky swirls
    inkLine(ctx, 2.5);
    for (let i = 0; i < 4; i++) {
      const x = 30 + r() * (w - 60), y = 30 + r() * (h - 60), s = 10 + r() * 10;
      ctx.beginPath();
      for (let a = 0; a < Math.PI * 3; a += 0.3) ctx.lineTo(x + Math.cos(a) * s * a / 3, y + Math.sin(a) * s * a / 3);
      ctx.stroke();
    }
    // bubbles
    for (let i = 0; i < 10; i++) {
      const x = r() * w, y = r() * h, s = 4 + r() * 8;
      ctx.fillStyle = '#9a6b45'; ctx.beginPath(); ctx.arc(x, y, s, 0, Math.PI * 2); ctx.fill(); inkLine(ctx, 2); ctx.stroke();
      ctx.fillStyle = '#e2c49a'; ctx.beginPath(); ctx.arc(x - s * 0.35, y - s * 0.35, s * 0.28, 0, Math.PI * 2); ctx.fill();
    }
  },
  floor_assi(ctx, w, h, r) {
    const n = 4, ph = h / n;
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = i % 2 ? '#d19a5c' : '#c08a4f';
      ctx.fillRect(0, i * ph, w, ph);
      inkLine(ctx, 4); ctx.strokeRect(2, i * ph + 2, w - 4, ph - 4);
      ctx.fillStyle = INK;
      for (const x of [16, w - 16]) { ctx.beginPath(); ctx.arc(x, i * ph + ph / 2, 4, 0, Math.PI * 2); ctx.fill(); }
      inkLine(ctx, 2); ctx.beginPath(); ctx.moveTo(40 + r() * 40, i * ph + ph * 0.5); ctx.lineTo(140 + r() * 60, i * ph + ph * 0.5 + 3); ctx.stroke();
    }
  },
  floor_roccia(ctx, w, h, r) {
    ctx.fillStyle = '#b3b3a8'; ctx.fillRect(0, 0, w, h);
    inkLine(ctx, 3);
    for (let i = 0; i < 4; i++) {
      ctx.beginPath(); let x = r() * w, y = r() * h; ctx.moveTo(x, y);
      for (let k = 0; k < 4; k++) { x += (r() - 0.5) * 80; y += (r() - 0.5) * 80; ctx.lineTo(x, y); }
      ctx.stroke();
    }
    hatch(ctx, w * 0.5, h * 0.5, w * 0.5, h * 0.5, 10);
    border(ctx, w, h, 4);
  },
  // ---- sky: 2048×512, wraps around twice ----
  sky(ctx, w, h, r) {
    ctx.fillStyle = '#7fd0f0'; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 7; i++) {
      const cx = (i + 0.3 + r() * 0.4) * (w / 7), cy = 70 + r() * 110;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      for (let k = 0; k < 4; k++) ctx.arc(cx + k * 34 - 50, cy + (k % 2) * 8, 30 + r() * 14, Math.PI, 0);
      ctx.closePath(); ctx.fill(); inkLine(ctx, 4); ctx.stroke();
    }
  },
  // ---- hatched shadow at the foot of the walls (laid over Claude Design's seamless wall tiles): 256×512, transparent ----
  wall_base(ctx, w, h) {
    hatch(ctx, 0, h * 0.84, w, h * 0.16, 12, -0.95);
    inkLine(ctx, 5); ctx.beginPath(); ctx.moveTo(0, h - 2.5); ctx.lineTo(w, h - 2.5); ctx.stroke();
  },
  // ---- far hills with fir silhouettes: 2048×512, transparent above; a band behind the walls, under the sky ----
  hills(ctx, w, h, r) {
    // far ridge, paler
    ctx.fillStyle = '#8cc77a';
    ctx.beginPath(); ctx.moveTo(0, h);
    for (let x = 0; x <= w; x += 32) ctx.lineTo(x, h * 0.5 + Math.sin(x / 260 + 1) * 40 + Math.sin(x / 97) * 12);
    ctx.lineTo(w, h); ctx.closePath(); ctx.fill(); inkLine(ctx, 4); ctx.stroke();
    hatch(ctx, 0, h * 0.62, w, h * 0.12, 14, -0.95);
    ctx.fillStyle = '#5fae5a';
    ctx.beginPath(); ctx.moveTo(0, h);
    for (let x = 0; x <= w; x += 64) ctx.lineTo(x, h * 0.62 + Math.sin(x / 140) * 34 + Math.sin(x / 61) * 14);
    ctx.lineTo(w, h); ctx.closePath(); ctx.fill(); inkLine(ctx, 5); ctx.stroke();
    ctx.fillStyle = '#2f8a3a';
    for (let x = 20; x < w; x += 46 + r() * 50) {
      const base = h * 0.66 + Math.sin(x / 140) * 34 + 14, th = 50 + r() * 60, hw = 16 + th * 0.12;
      // two tiers, like Claude Design's fir
      for (const [b, top, half] of [[base, base - th * 0.7, hw], [base - th * 0.4, base - th, hw * 0.75]]) {
        ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x + half, b); ctx.lineTo(x - half, b); ctx.closePath();
        ctx.fill(); inkLine(ctx, 3); ctx.stroke();
      }
    }
  },
};

// ---- generic placeholders for the textures of the later levels, in the colour the level legend gives ----
function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16);
  const c = [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.max(0, Math.min(255, Math.round(v * k))));
  return `rgb(${c.join(',')})`;
}
function hashColor(name) {
  let x = 0;
  for (const ch of name) x = (x * 31 + ch.charCodeAt(0)) >>> 0;
  return `#${[0, 1, 2].map(i => (110 + ((x >> (i * 8)) & 127)).toString(16).padStart(2, '0')).join('')}`;
}
const GENERIC = {
  // blocks of slightly different shades, like stones, bricks or panels
  wall(ctx, w, h, r, col) {
    ctx.fillStyle = col; ctx.fillRect(0, 0, w, h);
    const rows = 6, rh = h / rows;
    for (let i = 0; i < rows; i++) {
      let x = (i % 2) * -40;
      while (x < w) {
        const bw = 70 + r() * 50;
        ctx.fillStyle = shade(col, 0.85 + r() * 0.3);
        ctx.fillRect(x + 3, i * rh + 3, bw - 6, rh - 6);
        inkLine(ctx, 3); ctx.strokeRect(x + 3, i * rh + 3, bw - 6, rh - 6);
        x += bw;
      }
    }
    border(ctx, w, h, 4);
  },
  floor(ctx, w, h, r, col) {
    ctx.fillStyle = col; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 24; i++) {
      ctx.fillStyle = shade(col, 0.8 + r() * 0.4);
      ctx.beginPath(); ctx.ellipse(r() * w, r() * h, 5 + r() * 12, 3 + r() * 8, r() * 3, 0, Math.PI * 2); ctx.fill();
    }
    inkLine(ctx, 2);
    for (let i = 0; i < 6; i++) { const x = r() * w, y = r() * h; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 10 + r() * 14, y + 3); ctx.stroke(); }
    border(ctx, w, h, 2);
  },
  // wavy liquid (water, puddles): two frames differ by their seed
  liquid(ctx, w, h, r, col) {
    ctx.fillStyle = col; ctx.fillRect(0, 0, w, h);
    inkLine(ctx, 3);
    for (let i = 0; i < 7; i++) {
      const y = 18 + i * (h / 7) + r() * 10;
      ctx.strokeStyle = i % 2 ? INK : shade(col, 1.35);
      ctx.beginPath();
      for (let x = 0; x <= w; x += 16) ctx.lineTo(x, y + Math.sin(x / 22 + r() * 6) * 5);
      ctx.stroke();
    }
  },
  ceil(ctx, w, h, r, col) {
    ctx.fillStyle = col; ctx.fillRect(0, 0, w, h);
    inkLine(ctx, 4);
    for (let i = 0; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(0, i * h / 2); ctx.lineTo(w, i * h / 2); ctx.moveTo(i * w / 2, 0); ctx.lineTo(i * w / 2, h); ctx.stroke(); }
    ctx.fillStyle = '#fff6c8';
    ctx.fillRect(w * 0.3, h * 0.42, w * 0.4, h * 0.16); ctx.strokeRect(w * 0.3, h * 0.42, w * 0.4, h * 0.16);
  },
  // railings and nets: transparent between the bars
  rail(ctx, w, h, r, col) {
    ctx.strokeStyle = INK; ctx.lineWidth = 9;
    ctx.beginPath(); ctx.moveTo(0, 8); ctx.lineTo(w, 8); ctx.moveTo(0, h - 8); ctx.lineTo(w, h - 8); ctx.stroke();
    ctx.strokeStyle = col; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(0, 8); ctx.lineTo(w, 8); ctx.moveTo(0, h - 8); ctx.lineTo(w, h - 8); ctx.stroke();
    for (let i = -h; i < w; i += 36) {
      for (const [a, b] of [[i, i + h], [i + h, i]]) {
        ctx.strokeStyle = INK; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(a, 0); ctx.lineTo(b, h); ctx.stroke();
        ctx.strokeStyle = col; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(a, 0); ctx.lineTo(b, h); ctx.stroke();
      }
    }
  },
  sky(ctx, w, h, r, col) {
    ctx.fillStyle = col; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 6; i++) {
      const cx = (i + 0.3 + r() * 0.4) * (w / 6), cy = 60 + r() * 120;
      ctx.fillStyle = '#f4ecd8';
      ctx.beginPath();
      for (let k = 0; k < 4; k++) ctx.arc(cx + k * 34 - 50, cy + (k % 2) * 8, 30 + r() * 14, Math.PI, 0);
      ctx.closePath(); ctx.fill(); inkLine(ctx, 4); ctx.stroke();
    }
    // the landscape in silhouette along the bottom
    ctx.fillStyle = shade(col, 0.45);
    ctx.beginPath(); ctx.moveTo(0, h);
    for (let x = 0; x <= w; x += 48) ctx.lineTo(x, h * 0.66 - Math.abs(Math.sin(x / 170)) * 60 - (r() < 0.2 ? 40 : 0));
    ctx.lineTo(w, h); ctx.closePath(); ctx.fill(); inkLine(ctx, 4); ctx.stroke();
  },
};
const KIND = name => (/^floor_.*(acqua|fiume|pozzanghera)/.test(name) ? 'liquid' : name.split('_')[0]);

// Wooden board with a big lever (switch), off = lever down, on = lever up.
function paintSwitch(ctx, w, h, on) {
  PAINTERS.wall_legno(ctx, w, h, rng(7));
  ctx.fillStyle = '#f4ecd8'; inkLine(ctx, 6);
  ctx.fillRect(w * 0.2, h * 0.35, w * 0.6, h * 0.3); ctx.strokeRect(w * 0.2, h * 0.35, w * 0.6, h * 0.3);
  ctx.save(); ctx.translate(w / 2, h * 0.5); ctx.rotate(on ? -0.7 : 0.7);
  ctx.fillStyle = '#6b6b6b'; ctx.fillRect(-8, -h * 0.13, 16, h * 0.13); ctx.strokeRect(-8, -h * 0.13, 16, h * 0.13);
  ctx.fillStyle = on ? '#22b14c' : '#e3262b'; ctx.beginPath(); ctx.arc(0, -h * 0.13, 22, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.restore();
}
// Lift platform: planks with a yellow and black edge.
function paintLift(ctx, w, h) {
  PAINTERS.floor_assi(ctx, w, h, rng(3));
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, w, h); ctx.rect(22, 22, w - 44, h - 44); ctx.clip('evenodd');
  for (let i = -h; i < w + h; i += 28) { ctx.fillStyle = Math.floor((i + h) / 28) % 2 ? '#ffd400' : INK; ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + 14, 0); ctx.lineTo(i + 14 + h, h); ctx.lineTo(i + h, h); ctx.fill(); }
  ctx.restore();
}

// `color` = the placeholder colour from the level legend (else derived from the name).
export function paintTexture(name, w, h, color = null) {
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  const r = rng(name.length * 7919 + name.charCodeAt(0) + name.charCodeAt(name.length - 1) * 13);
  if (PAINTERS[name]) PAINTERS[name](ctx, w, h, r);
  else if (name === 'switch_off' || name === 'switch_on') paintSwitch(ctx, w, h, name === 'switch_on');
  else if (name === 'floor_lift') paintLift(ctx, w, h);
  else (GENERIC[KIND(name)] || GENERIC.floor)(ctx, w, h, r, color || hashColor(name));
  return canvas;
}
