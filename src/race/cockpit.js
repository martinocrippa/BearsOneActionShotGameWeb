// TRACTOR RACE: everything drawn by the code on a 2D canvas over the 3D (src/race/race.js): the red bonnet, the
// exhaust, the speedometer and the steering wheel with the bear's paws, the place, the lap and the time, the big
// words in the middle (3 2 1 GO!, WRONG WAY!, FINAL LAP!, the result) and the little map of the track.
// In two (split screen) one cockpit per half and one map for both, on the line between the halves.
import { RACE } from '../../data/race.js';
import { standings, ordinal } from '../core/race.js';

const INK = '#111111';
const font = (size, kind = 'Bangers, Impact, sans-serif') => `${Math.round(size)}px ${kind}`;

export class RaceHud {
  /** @param {import('./race.js').TractorRace} race */
  constructor(race) {
    this.race = race;
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'race';
    this.ctx = this.canvas.getContext('2d');
    const { samples } = race.track;
    this.mapPts = samples.filter((_, i) => i % 9 === 0);
    const xs = samples.map(c => c.x), zs = samples.map(c => c.z);
    this.mapBox = { x0: Math.min(...xs), x1: Math.max(...xs), z0: Math.min(...zs), z1: Math.max(...zs) };
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  /** Draws everything over the 3D for these views (src/race/race.js `views()`). */
  draw(views) {
    const ctx = this.ctx, W = this.canvas.width, H = this.canvas.height;
    ctx.clearRect(0, 0, W, H);
    const sx = W / (views[0].w || W), sy = H / (views.reduce((a, v) => a + v.h, 0) || H);
    for (const v of views) {
      const box = { x: v.x * sx, y: v.y * sy, w: v.w * sx, h: v.h * sy };
      this.drawCockpit(box, v.r);
      this.drawInfo(box, v.r);
    }
    if (views.length > 1) { ctx.fillStyle = INK; ctx.fillRect(0, views[1].y * sy - 4, W, 8); }
    // the little map: in the corner, or (in two) one for both, on the line between the halves
    if (views.length > 1) this.drawMap({ x: 0, y: views[1].y * sy - 130 * (H / 720), w: W, h: H }, null, H / 720 * 1.05);
    else this.drawMap({ x: 0, y: 0, w: W, h: H }, views[0].r, Math.max(0.6, H / 720));
  }

  /** @param {CanvasTextAlign} [align] */
  text(str, x, y, size, color, align = 'center') {
    const ctx = this.ctx;
    ctx.font = font(size); ctx.textAlign = align; ctx.textBaseline = 'alphabetic';
    ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(3, size / 9); ctx.strokeStyle = INK; ctx.fillStyle = color;
    ctx.strokeText(str, x, y); ctx.fillText(str, x, y);
  }

  // The red bonnet, the exhaust, the speedometer and the steering wheel with the bear's paws: drawn by the code.
  drawCockpit(b, r) {
    const ctx = this.ctx, s = b.h / 720, cx = b.x + b.w / 2, by = b.y + b.h, t = r.t;
    const shakeY = t.bumped > 0 ? Math.sin(this.race.time * 70) * 4 * s : Math.sin(r.bob * 2.3) * 2 * s;
    ctx.save();
    ctx.translate(0, shakeY);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    // bonnet
    ctx.beginPath();
    ctx.moveTo(cx - 360 * s, by + 10); ctx.lineTo(cx - 190 * s, by - 150 * s); ctx.lineTo(cx + 190 * s, by - 150 * s); ctx.lineTo(cx + 360 * s, by + 10);
    ctx.closePath();
    ctx.fillStyle = '#e3262b'; ctx.fill();
    ctx.lineWidth = 7 * s; ctx.strokeStyle = INK; ctx.stroke();
    // its seam, the vents and a little ink hatching on the shaded side
    // (one path for each width: fewer calls, lighter on the Raspberry Pi; the small views of the split screen skip
    // the details)
    const small = s < 0.75;
    ctx.lineWidth = 4 * s;
    ctx.beginPath(); ctx.moveTo(cx, by - 150 * s); ctx.lineTo(cx, by);
    for (let i = 0; i < 4; i++) {
      const y = by - 120 * s + i * 26 * s;
      ctx.moveTo(cx + 60 * s, y); ctx.lineTo(cx + 150 * s + i * 12 * s, y);
    }
    ctx.stroke();
    if (!small) {
      ctx.lineWidth = 2.5 * s;
      ctx.beginPath();
      for (let i = 0; i < 7; i++) {
        const x = cx - 300 * s + i * 22 * s;
        ctx.moveTo(x, by); ctx.lineTo(x + 40 * s, by - 60 * s);
      }
      ctx.stroke();
    }
    // the exhaust pipe with puffs of smoke
    ctx.fillStyle = '#2b2b2b'; ctx.lineWidth = 5 * s;
    ctx.beginPath(); ctx.rect(cx + 205 * s, by - 330 * s, 26 * s, 190 * s); ctx.fill(); ctx.stroke();
    const puffs = small ? 2 : 3;
    for (let i = 0; i < puffs; i++) {
      const k = ((this.race.time * (1.2 + Math.abs(t.speed) / 8) + i / puffs) % 1 + 1) % 1, rr = (10 + 22 * k) * s;
      ctx.globalAlpha = 0.85 * (1 - k);
      ctx.fillStyle = '#d8d2c4';
      ctx.beginPath(); ctx.arc(cx + 218 * s + k * 30 * s, by - 345 * s - k * 120 * s, rr, 0, Math.PI * 2); ctx.fill();
      ctx.lineWidth = 3 * s; ctx.stroke();
    }
    ctx.globalAlpha = 1;
    // the speedometer
    const gx = cx - 290 * s, gy = by - 70 * s, gr = 52 * s;
    ctx.fillStyle = '#f4ecd8'; ctx.lineWidth = 6 * s;
    ctx.beginPath(); ctx.arc(gx, gy, gr, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    const sp = Math.min(1, Math.abs(t.speed) / RACE.speed.bear), a = Math.PI * (0.8 + sp * 1.4);
    ctx.lineWidth = 5 * s; ctx.strokeStyle = '#e3262b';
    ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx + Math.cos(a) * gr * 0.8, gy + Math.sin(a) * gr * 0.8); ctx.stroke();
    ctx.strokeStyle = INK;
    // the steering wheel: its upper half, turning with the steering
    const wr = 175 * s, turn = t.steer * 1.1, wy = by + 6 * s;
    ctx.lineWidth = 30 * s; ctx.strokeStyle = INK;
    ctx.beginPath(); ctx.arc(cx, wy, wr, Math.PI, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = 16 * s; ctx.strokeStyle = '#3a3a3a';
    ctx.beginPath(); ctx.arc(cx, wy, wr, Math.PI, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = INK; ctx.lineWidth = 14 * s;
    for (const k of [0, 2 / 3, 4 / 3]) {
      const ang = -Math.PI / 2 + turn + k * Math.PI;
      if (Math.sin(ang) > -0.05) continue; // only the spokes pointing up show
      ctx.beginPath(); ctx.moveTo(cx, wy); ctx.lineTo(cx + Math.cos(ang) * wr, wy + Math.sin(ang) * wr); ctx.stroke();
    }
    ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(cx, wy, 30 * s, Math.PI, Math.PI * 2); ctx.fill();
    // the paws on the wheel
    const fur = r.bear?.fur || '#8b5a36';
    for (const k of [-0.62, 0.62]) {
      const ang = -Math.PI / 2 + k + turn;
      const px = cx + Math.cos(ang) * wr, py = wy + Math.sin(ang) * wr;
      if (py > by) continue;
      ctx.fillStyle = fur; ctx.lineWidth = 6 * s;
      ctx.beginPath(); ctx.ellipse(px, py, 46 * s, 36 * s, ang + Math.PI / 2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = r.bear?.light || '#d9a877';
      ctx.beginPath(); ctx.arc(px, py + 4 * s, 15 * s, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  // Place, lap, time, the little map; in the middle 3 2 1 GO!, WRONG WAY!, FINAL LAP!, the result.
  drawInfo(b, r) {
    const ctx = this.ctx, s = Math.max(0.6, b.h / 720), t = r.t, order = standings(this.race.racers), place = order.indexOf(r) + 1;
    const pad = 22 * s;
    this.text(ordinal(place), b.x + pad, b.y + pad + 70 * s, 84 * s, place === 1 ? '#ffd400' : '#ffffff', 'left');
    ctx.font = font(84 * s);
    const pw = ctx.measureText(ordinal(place)).width;
    this.text(`/${this.race.racers.length}`, b.x + pad + pw + 8 * s, b.y + pad + 70 * s, 44 * s, '#ffffff', 'left');
    const lap = Math.max(1, Math.min(RACE.laps, t.lap + 1));
    this.text(`LAP ${lap}/${RACE.laps}`, b.x + pad, b.y + pad + 118 * s, 40 * s, '#ffffff', 'left');
    const time = Math.max(0, (t.finished ?? this.race.time));
    this.text(`${Math.floor(time / 60)}:${String(Math.floor(time % 60)).padStart(2, '0')}`, b.x + pad, b.y + pad + 160 * s, 34 * s, '#f4ecd8', 'left');
    if (this.race.mode === 'coop') this.text(r.name, b.x + b.w / 2, b.y + pad + 40 * s, 36 * s, r.color);
    // the big words in the middle
    const cx = b.x + b.w / 2, cy = b.y + b.h * 0.36;
    if (this.race.time < 0) {
      const n = Math.ceil(-this.race.time);
      if (n <= 3) this.text(String(n), cx, cy + 50 * s, 170 * s, n === 1 ? '#ffd400' : '#ffffff');
      else this.text('READY?', cx, cy + 30 * s, 110 * s, '#ffffff');
      return;
    }
    const f = r.flash?.stay || (r.flash && this.race.time - r.flash.t < 1.6) ? r.flash : this.race.flash && this.race.time - this.race.flash.t < 0.9 ? this.race.flash : null;
    if (f) this.text(f.text, cx, cy + 40 * s, 120 * s, f.color);
    else if (t.wrongWay && t.finished === null) this.text('WRONG WAY!', cx, cy + 30 * s, 90 * s, '#ff2d8a');
  }

  drawMap(b, r, s) {
    const ctx = this.ctx, box = this.mapBox, mw = 230 * s, mh = mw * (box.z1 - box.z0) / (box.x1 - box.x0);
    const x0 = b.x + b.w - mw - 26 * s, y0 = b.y + 22 * s;
    const P = (x, z) => [x0 + (x - box.x0) / (box.x1 - box.x0) * mw, y0 + (z - box.z0) / (box.z1 - box.z0) * mh];
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    for (const [w, c] of /** @type {Array<[number, string]>} */ ([[16 * s, INK], [8 * s, '#e8c890']])) {
      ctx.lineWidth = w; ctx.strokeStyle = c;
      ctx.beginPath();
      this.mapPts.forEach((p, i) => { const [x, y] = P(p.x, p.z); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); });
      ctx.closePath(); ctx.stroke();
    }
    const [lx, ly] = P(this.race.track.samples[0].x, this.race.track.samples[0].z);
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = INK; ctx.lineWidth = 3 * s;
    ctx.beginPath(); ctx.rect(lx - 3 * s, ly - 9 * s, 6 * s, 18 * s); ctx.fill(); ctx.stroke();
    for (const o of [...this.race.racers].sort((a) => (a.who === 'ai' ? -1 : 1))) {
      const [x, y] = P(o.t.x, o.t.z), rad = (o === r || (!r && o.who !== 'ai') ? 11 : 8) * s;
      ctx.fillStyle = o.color; ctx.lineWidth = 3.5 * s; ctx.strokeStyle = INK;
      ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
  }

  dispose() { this.canvas.remove?.(); }
}