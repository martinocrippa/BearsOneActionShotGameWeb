// SWEET SHOT: the bonus shooting gallery (unlocked by beating the Big Pig). A 2D canvas over the game:
// a wide landscape that pans with the crosshair, birds at different depths, sweets that take a moment to arrive
// (aim ahead), a scope that zooms. Keyboard only: arrows aim, SPACE fires, Q/E or 1-3 pick the sweet,
// ALT GR / ENTER held = scope. Two players: the driver aims (arrows, ALT GR), the shooter fires (SPACE, Q/E).
import { SWEET_AMMO, AMMO_ORDER, BIRDS, BONUS_LEVELS } from '../../data/bonus.js';
import { SCENES, WORLD_W, WORLD_H, GROUND_Y, drawBird, drawSweet, drawRifle } from './paint.js';
import { assetUrl } from '../art/registry.js';
import { play } from '../audio.js';

const rand = (a, b) => a + Math.random() * (b - a);
const AIM_SPEED = 950, SCOPE_ZOOM = 2.3;
const WORDS = { full: 'BURP!', rainbow: 'WHEE!', puff: 'PUFF!' };

function image(key) {
  const url = assetUrl(key);
  if (!url) return null;
  const im = new Image(); im.src = url;
  return im;
}
const ready = im => !!(im?.complete && im.naturalWidth);

export class SweetShot {
  constructor({ root, input, levelIndex, mode, bear, callbacks }) {
    Object.assign(this, { root, input, levelIndex, mode, bear, callbacks });
    this.level = BONUS_LEVELS[levelIndex];
    this.bird = BIRDS[this.level.bird];
    this.scene = SCENES[this.level.scene];
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'sweetshot';
    root.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');
    // the landscape: a drawing from Claude Design, else painted by the code (only if needed, see coded())
    this.pano = this.front = null;
    this.panoImg = image(`bonus/${this.level.scene}/panorama`);
    this.frontImg = image(`bonus/${this.level.scene}/front`);
    // the birds and the rifle drawn by Claude Design (side view facing right, 256×256 centred), if delivered
    const kinds = [this.level.bird, `${this.level.bird}_oro`];
    this.birdImg = Object.fromEntries(kinds.map(k => [k, Object.fromEntries(['fly_s_1', 'fly_s_2', 'full_s_1', 'rainbow_s_1', 'puff_s_1', 'peek_f_1', 'perch_f_1'].map(p => [p, image(`bonus/birds/${k}/${p}`)]))]));
    this.rifleImg = image('bonus/rifle/idle_f_1');
    this.ammo = Object.fromEntries(AMMO_ORDER.map(k => [k, SWEET_AMMO[k].start]));
    this.current = 'caramella';
    this.aim = { x: WORLD_W / 2, y: 420 };
    this.camX = WORLD_W / 2 - 900;
    this.birds = []; this.shots = []; this.words = [];
    this.time = 0; this.left = this.level.time; this.score = 0; this.hits = 0; this.spawnT = 1; this.reload = 0; this.kick = 0;
    this.paused = true; this.over = false;
    this.resize();
  }

  resize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.canvas.width = w; this.canvas.height = h;
    this.scale = h / WORLD_H;
    this.viewW = w / this.scale;
  }

  start() { this.paused = false; this.input.reset(); }

  // ---------- birds ----------
  spawn() {
    const def = this.bird, kind = this.level.bird;
    const z = rand(0.5, 1);
    const golden = Math.random() < 0.06;
    const dir = Math.random() < 0.5 ? 1 : -1;
    const make = extra => ({ kind, z, dir, golden, state: 'fly', t: 0, seed: Math.random() * 6, rot: 0, ...extra });
    const viewL = this.camX, viewR = this.camX + this.viewW;
    if (def.path === 'rise') {
      // ducks take off from the reeds near the middle of the view and climb across
      const x = rand(viewL + 200, viewR - 200);
      this.birds.push(make({ x, y: GROUND_Y - 40, vx: dir * def.speed * z * rand(0.6, 1), vy: -def.speed * z * rand(0.5, 0.8) }));
    } else if (def.path === 'zigzag') {
      // little birds come in small flocks from one side, wiggling
      const y = rand(180, 620), x = dir > 0 ? viewL - 80 : viewR + 80;
      for (let i = 0; i < (def.flock || 1); i++) this.birds.push(make({ x: x - dir * i * 90, y: y + rand(-50, 50), vx: dir * def.speed * z * rand(0.8, 1.1), vy: 0, base: y, zig: rand(80, 150) }));
    } else {
      // owls peek out of a tree hole (of the drawn panorama, or of the coded one), then swoop out; sometimes they
      // stop on a branch
      const all = ready(this.panoImg) && this.level.holes ? this.level.holes.map(([x, y]) => ({ x, y })) : this.coded().holes;
      const holes = all.filter(hh => hh.x > viewL - 300 && hh.x < viewR + 300);
      const hh = holes.length ? holes[Math.floor(Math.random() * holes.length)] : { x: rand(viewL, viewR), y: 400 };
      this.birds.push(make({ x: hh.x, y: hh.y, vx: 0, vy: 0, state: 'peek', z: rand(0.7, 1) }));
    }
  }

  updateBirds(dt) {
    const def = this.bird;
    for (const b of this.birds) {
      b.t += dt;
      if (b.state === 'peek') { if (b.t > 0.9) { b.state = 'fly'; b.t = 0; b.vx = b.dir * def.speed * b.z; b.vy = rand(80, 160); } continue; }
      if (b.state === 'perch') { if (b.t > 1.6) { b.state = 'fly'; b.t = 0; b.vy = -60; } continue; }
      if (b.state === 'hit') {
        if (b.effect === 'full') { b.vy = Math.min(b.vy + 260 * dt, 160); b.vx *= 0.98; b.rot += dt * 0.6 * b.dir; }
        if (b.effect === 'rainbow') { b.loop = (b.loop || 0) + dt * 7; b.vx = b.dir * 260 * Math.cos(b.loop); b.vy = -180 + 260 * Math.sin(b.loop); }
        if (b.effect === 'puff') { b.vy = 70; b.vx = Math.sin(b.t * 2.5) * 60; }
        b.x += b.vx * dt; b.y += b.vy * dt;
        if (b.y > GROUND_Y || b.y < -200 || b.t > 6) b.dead = true;
        continue;
      }
      if (def.path === 'rise' && b.y < 360) b.vy += (Math.sin(b.t * 2 + b.seed) * 40 - b.vy) * dt * 2; // levels off
      if (def.path === 'zigzag') b.vy = Math.cos(b.t * 5 + b.seed) * b.zig;
      if (def.path === 'swoop') {
        b.vy -= 120 * dt; // the arc: down out of the hole, then up again
        if (b.t > 1.2 && !b.perched && Math.random() < 0.004) { b.state = 'perch'; b.t = 0; b.perched = true; continue; }
      }
      b.x += b.vx * dt; b.y += b.vy * dt;
      if (b.x < -200 || b.x > WORLD_W + 200 || b.y < -200 || b.y > GROUND_Y + 50) b.dead = true;
    }
    this.birds = this.birds.filter(b => !b.dead);
  }

  // ---------- shooting ----------
  fire() {
    const a = SWEET_AMMO[this.current];
    if (this.reload > 0) return;
    if (this.ammo[this.current] <= 0) { this.nextAmmo(1, true); return; }
    this.ammo[this.current]--; this.reload = a.reload; this.kick = 1;
    play(a.sound);
    for (let i = 0; i < a.pellets; i++) {
      const ang = (i / Math.max(1, a.pellets)) * Math.PI * 2, r = i === 0 && a.pellets > 1 ? 0 : a.spread * (0.6 + Math.random() * 0.4);
      this.shots.push({ kind: this.current, x: this.aim.x + Math.cos(ang) * r, y: this.aim.y + Math.sin(ang) * r + a.drop, t: 0, flight: a.flight, variant: i });
    }
  }

  updateShots(dt) {
    for (const s of this.shots) {
      s.t += dt;
      if (s.t < s.flight) continue;
      s.done = true;
      const a = SWEET_AMMO[s.kind];
      // the nearest bird under the sweet when it arrives
      let best = null, bestD = Infinity;
      for (const b of this.birds) {
        if (b.state === 'hit' || b.state === 'peek') continue;
        const r = 64 * this.bird.size * b.z * a.radius, d = Math.hypot(b.x - s.x, b.y - s.y);
        if (d < r && d < bestD) { best = b; bestD = d; }
      }
      if (best) this.knockOut(best, s.kind);
      else if (s.variant === 0) this.words.push({ x: s.x, y: s.y, text: 'MISS', t: 0, color: '#fff', small: true });
    }
    this.shots = this.shots.filter(s => !s.done);
  }

  knockOut(b, kind) {
    const a = SWEET_AMMO[kind];
    b.state = 'hit'; b.effect = a.effect; b.t = 0; b.vy = b.effect === 'puff' ? 60 : -40;
    const pts = Math.round(this.bird.points * a.points * (b.golden ? 3 : 1) * (0.7 + b.z * 0.6));
    this.score += pts; this.hits++;
    this.words.push({ x: b.x, y: b.y - 60, text: `${WORDS[b.effect]} +${pts}`, t: 0, color: b.golden ? '#ffd400' : '#fff' });
    play(b.effect === 'full' ? 'burp' : b.effect === 'rainbow' ? 'whee' : 'puff');
    play(this.bird.sound);
  }

  nextAmmo(dir, auto = false) {
    const i = AMMO_ORDER.indexOf(this.current);
    for (let k = 1; k <= AMMO_ORDER.length; k++) {
      const next = AMMO_ORDER[(i + dir * k + AMMO_ORDER.length * 3) % AMMO_ORDER.length];
      if (!auto || this.ammo[next] > 0) { this.current = next; play('select'); return; }
    }
  }

  // ---------- per frame ----------
  update(dt) {
    if (this.paused || this.over) return;
    const inp = this.input;
    for (const ev of inp.takeEvents()) {
      if (ev.code === 'Escape' || ev.code === 'KeyP') { this.paused = true; this.callbacks.onPause(); return; }
      if (ev.code === 'KeyM') this.callbacks.onToggleMusic();
      if (ev.code === 'KeyQ') this.nextAmmo(-1);
      if (ev.code === 'KeyE') this.nextAmmo(1);
      const n = { Digit1: 0, Digit2: 1, Digit3: 2 }[ev.code];
      if (n !== undefined) { this.current = AMMO_ORDER[n]; play('select'); }
    }
    this.time += dt; this.left -= dt;
    this.zoom = inp.any('AltRight', 'Enter', 'NumpadEnter', 'ShiftLeft', 'ShiftRight');
    const sp = AIM_SPEED * (this.zoom ? 0.4 : 1) * dt;
    const ax = (inp.any('ArrowRight', 'KeyD') ? 1 : 0) - (inp.any('ArrowLeft', 'KeyA') ? 1 : 0);
    const ay = (inp.any('ArrowDown', 'KeyS') ? 1 : 0) - (inp.any('ArrowUp', 'KeyW') ? 1 : 0);
    this.aim.x = Math.max(40, Math.min(WORLD_W - 40, this.aim.x + ax * sp));
    this.aim.y = Math.max(40, Math.min(GROUND_Y + 60, this.aim.y + ay * sp));
    // the view follows the crosshair when it gets near the edges
    const margin = this.viewW * 0.3;
    if (this.aim.x < this.camX + margin) this.camX = this.aim.x - margin;
    if (this.aim.x > this.camX + this.viewW - margin) this.camX = this.aim.x - this.viewW + margin;
    this.camX = Math.max(0, Math.min(WORLD_W - this.viewW, this.camX));
    this.reload -= dt; this.kick = Math.max(0, this.kick - dt * 5);
    if (inp.firing) this.fire();
    // keep 2-4 birds in the air
    this.spawnT -= dt;
    const flying = this.birds.filter(b => b.state !== 'hit').length;
    if (this.spawnT <= 0 && flying < 4) { this.spawn(); this.spawnT = rand(0.9, 2.2) * (flying < 2 ? 0.5 : 1); }
    this.updateBirds(dt);
    this.updateShots(dt);
    for (const w of this.words) w.t += dt;
    this.words = this.words.filter(w => w.t < 1.2);
    const out = AMMO_ORDER.every(k => this.ammo[k] <= 0) && !this.shots.length;
    if (this.left <= 0 || out) this.finish();
  }

  finish() {
    if (this.over) return;
    this.over = true;
    const goal = this.level.goal;
    const stars = this.hits >= goal * 2 ? 3 : this.hits >= goal * 1.5 ? 2 : this.hits >= goal ? 1 : 0;
    play(stars ? 'exit' : 'lose');
    setTimeout(() => this.callbacks.onEnd({ score: this.score, hits: this.hits, goal, stars, level: this.level }), 900);
  }

  // ---------- drawing ----------
  render() {
    const { ctx, canvas } = this, w = canvas.width, h = canvas.height, s = this.scale;
    const toScreen = (x, y) => [(x - this.camX) * s, y * s];
    const [cx, cy] = toScreen(this.aim.x, this.aim.y);
    ctx.save();
    ctx.fillStyle = this.scene.sky; ctx.fillRect(0, 0, w, h);
    if (this.zoom) { ctx.translate(cx, cy); ctx.scale(SCOPE_ZOOM, SCOPE_ZOOM); ctx.translate(-cx, -cy); }
    ctx.save(); ctx.scale(s, s); ctx.translate(-this.camX, 0);
    const pano = ready(this.panoImg) ? this.panoImg : this.coded().pano;
    ctx.drawImage(pano, 0, 0, WORLD_W, WORLD_H);
    // birds, far ones first
    for (const b of [...this.birds].sort((p, q) => p.z - q.z)) {
      if (b.state === 'peek') { // only the eyes in the hole: the drawn peek_f_1, else two yellow dots
        const im = this.birdImg[b.golden ? `${b.kind}_oro` : b.kind]?.peek_f_1;
        if (ready(im)) { const size = this.bird.size * b.z * 300; ctx.drawImage(im, b.x - size / 2, b.y - size / 2, size, size); continue; }
        ctx.fillStyle = '#ffd400'; for (const dx of [-7, 7]) { ctx.beginPath(); ctx.arc(b.x + dx, b.y - 2, 5, 0, Math.PI * 2); ctx.fill(); }
        continue;
      }
      if (!this.drawBirdImage(ctx, b)) drawBird(ctx, b, this.bird, this.time);
    }
    // sweets on their way: from the rifle (bottom right) shrinking towards the target
    for (const sh of this.shots) {
      const k = sh.t / sh.flight, sx0 = this.camX + this.viewW * 0.72, sy0 = WORLD_H + 40;
      const x = sx0 + (sh.x - sx0) * k, y = sy0 + (sh.y - sy0) * k - Math.sin(k * Math.PI) * (sh.kind === 'marshmallow' ? 120 : 30);
      drawSweet(ctx, sh.kind, x, y, 26 * (1 - k * 0.7), sh.variant);
    }
    const front = ready(this.frontImg) ? this.frontImg : this.coded().front;
    ctx.drawImage(front, 0, 0, WORLD_W, WORLD_H);
    for (const wd of this.words) {
      ctx.font = `${wd.small ? 28 : 46}px Bangers, Impact, sans-serif`; ctx.textAlign = 'center';
      ctx.lineWidth = 6; ctx.strokeStyle = '#111'; ctx.fillStyle = wd.color;
      const y = wd.y - wd.t * 50;
      ctx.globalAlpha = Math.max(0, 1 - wd.t / 1.2);
      ctx.strokeText(wd.text, wd.x, y); ctx.fillText(wd.text, wd.x, y);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
    ctx.restore();
    // night: everything is dark but the moonlit middle and the scope
    if (this.scene.dark && !this.zoom) {
      const g = ctx.createRadialGradient(cx, cy, h * 0.12, cx, cy, h * 0.7);
      g.addColorStop(0, 'rgba(10,12,30,0)'); g.addColorStop(1, 'rgba(10,12,30,.6)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    }
    if (this.zoom) this.drawScope(cx, cy, w, h);
    else {
      if (this.rifleImg?.complete && this.rifleImg.naturalWidth) {
        // the drawn rifle points right (1024×256, the paw on the left): turned towards the crosshair
        const bx = w * 0.7, by = h + 30 + this.kick * 30, L = h * 0.62;
        ctx.save(); ctx.translate(bx, by); ctx.rotate(Math.atan2(cy - by, cx - bx));
        ctx.drawImage(this.rifleImg, -L * 0.15, -L * 0.125, L, L * 0.25); ctx.restore();
      } else drawRifle(ctx, w, h, cx, cy, this.kick, this.bear?.fur);
      this.drawCrosshair(cx, cy);
    }
    this.drawHud(w, h);
  }

  // Claude Design's bird for this pose, if delivered (else false: the coded one is drawn).
  // The coded landscape (and its owl holes), painted the first time it is needed: when a drawing is missing or
  // has not loaded yet.
  coded() {
    if (!this.pano) {
      this.pano = document.createElement('canvas'); this.pano.width = WORLD_W; this.pano.height = WORLD_H;
      this.front = document.createElement('canvas'); this.front.width = WORLD_W; this.front.height = WORLD_H;
      this.scene.paint(this.pano.getContext('2d'), this.front.getContext('2d'));
    }
    return { pano: this.pano, front: this.front, holes: this.scene.holes || [] };
  }

  drawBirdImage(ctx, b) {
    const set = this.birdImg[b.golden ? `${b.kind}_oro` : b.kind] || this.birdImg[b.kind];
    const pose = b.state === 'hit' ? `${b.effect}_s_1` : b.state === 'perch' ? 'perch_f_1' : `fly_s_${Math.sin(this.time * 16 + b.seed) > 0 ? 1 : 2}`;
    const im = set?.[pose] || this.birdImg[b.kind]?.[pose];
    if (!im?.complete || !im.naturalWidth) return false;
    const size = this.bird.size * b.z * 300;
    ctx.save(); ctx.translate(b.x, b.y); ctx.scale(b.dir < 0 ? -1 : 1, 1); ctx.rotate(b.rot || 0);
    ctx.drawImage(im, -size / 2, -size / 2, size, size);
    ctx.restore();
    return true;
  }

  drawCrosshair(x, y) {
    const { ctx } = this;
    // where a marshmallow will land (it drops on the way)
    if (this.current === 'marshmallow') {
      const dy = SWEET_AMMO.marshmallow.drop * this.scale;
      ctx.setLineDash([6, 6]); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + dy); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = '#fffaf2'; ctx.strokeStyle = '#111'; ctx.beginPath(); ctx.arc(x, y + dy, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
    ctx.lineWidth = 5; ctx.strokeStyle = '#111'; ctx.beginPath(); ctx.arc(x, y, 24, 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = 3; ctx.strokeStyle = this.reload > 0 ? '#9aa0a6' : '#ff2d8a'; ctx.beginPath(); ctx.arc(x, y, 24, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 36, y); ctx.lineTo(x - 12, y); ctx.moveTo(x + 12, y); ctx.lineTo(x + 36, y); ctx.moveTo(x, y - 36); ctx.lineTo(x, y - 12); ctx.moveTo(x, y + 12); ctx.lineTo(x, y + 36); ctx.stroke();
  }

  drawScope(x, y, w, h) {
    const { ctx } = this, r = h * 0.4;
    ctx.save(); ctx.fillStyle = '#05060c'; ctx.beginPath(); ctx.rect(0, 0, w, h); ctx.arc(x, y, r, 0, Math.PI * 2, true); ctx.fill('evenodd');
    ctx.lineWidth = 14; ctx.strokeStyle = '#e3262b'; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = 4; ctx.strokeStyle = '#111'; ctx.beginPath(); ctx.arc(x, y, r - 9, 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - r, y); ctx.lineTo(x + r, y); ctx.moveTo(x, y - r); ctx.lineTo(x, y + r); ctx.stroke();
    ctx.lineWidth = 3; ctx.strokeStyle = this.reload > 0 ? '#9aa0a6' : '#ff2d8a'; ctx.beginPath(); ctx.arc(x, y, 14, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }

  drawHud(w, h) {
    const { ctx } = this;
    const text = (t, x, y, size, color = '#fff', align = 'left') => {
      ctx.font = `${size}px Bangers, Impact, sans-serif`; ctx.textAlign = align; ctx.lineWidth = 6; ctx.strokeStyle = '#111'; ctx.fillStyle = color;
      ctx.strokeText(t, x, y); ctx.fillText(t, x, y);
    };
    const u = h / 1080;
    text(`TIME ${Math.max(0, Math.ceil(this.left))}`, 30 * u, 70 * u, 56 * u, this.left < 15 ? '#ff2d8a' : '#fff');
    text(`SCORE ${this.score}`, 30 * u, 130 * u, 44 * u, '#ffd400');
    text(`${this.bird.name}S ${this.hits} / ${this.level.goal}`, w - 30 * u, 70 * u, 50 * u, this.hits >= this.level.goal ? '#22b14c' : '#fff', 'right');
    // the three sweets, the chosen one on a yellow card
    AMMO_ORDER.forEach((k, i) => {
      const x = 30 * u + i * 200 * u, y = h - 120 * u, sel = k === this.current;
      ctx.fillStyle = sel ? '#ffd400' : 'rgba(244,236,216,.85)'; ctx.strokeStyle = '#111'; ctx.lineWidth = 5;
      ctx.fillRect(x, y, 180 * u, 96 * u); ctx.strokeRect(x, y, 180 * u, 96 * u);
      drawSweet(ctx, k, x + 40 * u, y + 46 * u, 22 * u, 1);
      text(String(this.ammo[k]), x + 80 * u, y + 62 * u, 46 * u, this.ammo[k] ? '#fff' : '#9aa0a6');
      text(`${i + 1}`, x + 160 * u, y + 30 * u, 26 * u, '#111');
    });
    text(SWEET_AMMO[this.current].name, 30 * u, h - 140 * u, 34 * u, '#fff');
  }

  dispose() { this.canvas.remove(); }
}
