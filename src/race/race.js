// TRACTOR RACE: the tractors' easter egg (data/race.js), played over a paused level and back to it at the end.
// First person from the driver's seat, like the rest of the game: the bonnet and the steering wheel are drawn by the
// code on a 2D canvas over the 3D, with the place, the lap and a little map of the track. In two, the screen is
// split: the driver (arrows, ALT GR) on top, the shooter (A/D, SPACE) below, one tractor each.
// The rules and the maths are in src/core/race.js; here the 3D world, the cameras, the sounds and the canvas.
import * as THREE from 'three';
import { RACE } from '../../data/race.js';
import { BEARS } from '../../data/bears.js';
import { DECOR } from '../../data/items.js';
import { ENEMIES } from '../../data/enemies.js';
import { difficultyAt } from '../../data/difficulty.js';
import { buildTrack, heightAt, createTractor, driveTractor, aiControl, collideTractors, standings, ordinal } from '../core/race.js';
import { Billboard, lin } from '../game/world.js';
import { decorCanvas } from '../game/game-shared.js';
import { svgTexture, paintedTexture } from '../art/registry.js';
import { paintTexture } from '../art/textures.js';
import { decorSprite, enemySprite } from '../art/sprites.js';
import { bearCover } from '../art/bear.js';
import { play } from '../audio.js';

const FOV_H = 96;           // degrees across, whatever the shape of the view
const SEAT = 2.15;          // the driver's eyes above the ground
const COUNTDOWN = 3.6;      // seconds of "3 2 1" before GO
const FAR = 190;            // the fog's end: billboards beyond it (or behind the camera) are not even placed
const INK = '#111111';
const RACER_COLORS = ['#ffd400', '#28c2b4', '#ff2d8a', '#ff7a12', '#7d5cff'];
const SKY = { top: '#f3b48a', bottom: '#f7c9a8', ground: '#6f8f46' }; // the sunset of the park (E1M2)
const font = (size, kind = 'Bangers, Impact, sans-serif') => `${Math.round(size)}px ${kind}`;

const PLANE = new THREE.PlaneGeometry(1, 1);

// Many copies of one drawing standing on the field (the bales, the poplars...): one instanced mesh, each copy turned
// to the camera of the view being drawn. Far fewer objects than a Billboard each, which counts in two (split
// screen: every copy turns twice a frame) and on the Raspberry Pi.
class BillboardSet {
  constructor(scene, texture, fit, points) {
    this.material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, alphaTest: 0.35, side: THREE.DoubleSide });
    this.mesh = new THREE.InstancedMesh(PLANE, this.material, points.length);
    this.mesh.frustumCulled = false; // (the copies move with every view: no bounding sphere to trust)
    this.mesh.count = 0;
    this.fit = fit;
    this.points = points;
    scene.add(this.mesh);
  }
  // Like Billboard.place for every copy in front of the camera and within `far` metres.
  place(cam, yaw, far) {
    const map = this.material.map, bb = map?.userData.bbox;
    if (!bb) { this.mesh.count = 0; return; }
    const { w, h } = map.userData.size, k = this.fit / (bb.y1 - bb.y0), width = w * k, height = h * k, lift = height / 2 - height * ((h - bb.y1) / h);
    const c = Math.cos(yaw), sn = Math.sin(yaw), fx = -sn, fz = -c, e = this.mesh.instanceMatrix.array;
    let n = 0;
    for (const p of this.points) {
      const dx = p.x - cam.x, dz = p.z - cam.z;
      if (dx * fx + dz * fz < -4 || dx * dx + dz * dz > far * far) continue;
      const o = n++ * 16;
      e[o] = c * width; e[o + 1] = 0; e[o + 2] = -sn * width; e[o + 3] = 0;
      e[o + 4] = 0; e[o + 5] = height; e[o + 6] = 0; e[o + 7] = 0;
      e[o + 8] = sn; e[o + 9] = 0; e[o + 10] = c; e[o + 11] = 0;
      e[o + 12] = p.x; e[o + 13] = p.y + lift; e[o + 14] = p.z; e[o + 15] = 1;
    }
    this.mesh.count = n;
    this.mesh.instanceMatrix.needsUpdate = true;
  }
  remove() { this.mesh.removeFromParent(); this.mesh.dispose(); this.material.dispose(); }
}

function tractorTexture(id) {
  const [cw, ch] = decorCanvas(id);
  return svgTexture(`decor/${id}`, () => decorSprite(id, cw, ch), cw, ch);
}

export class TractorRace {
  constructor({ renderer, root, input, mode, bear, difficulty, callbacks }) {
    Object.assign(this, { renderer, root, input, mode, bear, callbacks });
    this.diff = difficultyAt(difficulty);
    const level = this.level = Math.max(0, Math.min(RACE.assist.length - 1, difficulty | 0));
    this.track = buildTrack();
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(SKY.top);
    this.scene.fog = new THREE.Fog(SKY.bottom, 60, FAR);
    this.own = []; // geometries, materials and textures made here (dispose)
    this.buildSky();
    this.buildGround();
    this.buildTrackMesh();
    this.buildStartLine();
    this.buildProps();

    // the racers: the others in front, the bears on the back row
    const players = mode === 'coop' ? 2 : 1;
    const bears = [bear, BEARS[(BEARS.indexOf(bear) + 1) % BEARS.length] || bear];
    const bearTop = RACE.speed.bear * (this.diff.move ?? 1);
    const others = RACE.speed.others[level];
    this.racers = [];
    const ais = RACE.drivers.slice(0, 4 - players);
    ais.forEach((d, i) => this.racers.push(this.makeRacer({ slot: i, who: 'ai', name: d.name, tractor: d.tractor, maxSpeed: others * d.skill, seed: i, skill: d.skill,
      driverTex: svgTexture(`enemies/${d.id}/${d.frame}`, () => enemySprite(d.id, 'walk', 1), ENEMIES[d.id]?.canvas || 512, ENEMIES[d.id]?.canvas || 512) })));
    for (let p = 0; p < players; p++) {
      const b = bears[p];
      this.racers.push(this.makeRacer({ slot: ais.length + p, who: p ? 'p2' : 'p1', name: b.name.toUpperCase(), tractor: RACE.bearTractor, maxSpeed: bearTop, seed: 7 + p,
        driverTex: svgTexture(`characters/${b.id}/walk_f_1`, () => bearCover(b, { title: false }), 512, 512), bear: b }));
    }
    this.players = this.racers.filter(r => r.who !== 'ai');
    this.racers.forEach((r, i) => { r.color = r.who === 'p1' ? RACER_COLORS[0] : r.who === 'p2' ? RACER_COLORS[1] : RACER_COLORS[2 + (i % 3)]; });
    this.players.forEach(r => {
      r.camera = new THREE.PerspectiveCamera(70, 16 / 9, 0.1, 600);
      r.camera.rotation.order = 'YXZ';
      r.pitch = 0; r.roll = 0;
    });
    this.assist = RACE.assist[level];
    this.goal = RACE.laps * this.track.length;

    this.canvas = document.createElement('canvas');
    this.canvas.className = 'race';
    this.ctx = this.canvas.getContext('2d');
    this.mapPts = this.track.samples.filter((_, i) => i % 9 === 0);
    const xs = this.track.samples.map(c => c.x), zs = this.track.samples.map(c => c.z);
    this.mapBox = { x0: Math.min(...xs), x1: Math.max(...xs), z0: Math.min(...zs), z1: Math.max(...zs) };

    this.time = -COUNTDOWN; this.paused = true; this.over = false; this.endT = null;
    this.chugT = 0; this.flash = null;
    this.resize();
  }

  makeRacer({ slot, who, name, tractor, maxSpeed, seed, driverTex, bear = null, skill = 1 }) {
    const t = createTractor(this.track, slot, { maxSpeed, seed });
    const body = new Billboard(this.scene, { fit: DECOR[tractor]?.h || 2.4 });
    body.texture = tractorTexture(tractor);
    const driver = new Billboard(this.scene, { fit: 1.15 });
    driver.texture = driverTex;
    return { t, who, name, tractor, body, driver, bear, skill, seat: RACE.tractors[tractor]?.seat || [0.45, 0.45], bob: Math.random() * 6, lastLap: -1 };
  }

  // ---------- the world ----------
  buildSky() {
    const skyTex = paintedTexture('textures/sky_e1m2', 2048, 512, { repeat: [2, 1], color: SKY.top });
    this.sky = new THREE.Mesh(new THREE.CylinderGeometry(300, 300, 160, 48, 1, true),
      new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, fog: false, depthWrite: false, transparent: true }));
    this.sky.position.y = 40; this.sky.renderOrder = -1;
    const hillsTex = new THREE.CanvasTexture(paintTexture('hills', 2048, 512));
    hillsTex.colorSpace = THREE.SRGBColorSpace; hillsTex.wrapS = THREE.RepeatWrapping; hillsTex.repeat.set(2, 1);
    const hills = new THREE.Mesh(new THREE.CylinderGeometry(280, 280, 160, 48, 1, true),
      new THREE.MeshBasicMaterial({ map: hillsTex, side: THREE.BackSide, fog: false, depthWrite: false, transparent: true }));
    hills.renderOrder = -0.5;
    this.sky.add(hills);
    this.scene.add(this.sky);
    this.own.push(this.sky.geometry, this.sky.material, hills.geometry, hills.material, hillsTex);
  }

  // A surface following the hills: rows × cols vertices from fn(i, j) → [x, z, u, v]; shaded by the slope.
  surface(rows, cols, fn, lift, map) {
    const pos = [], uv = [], col = [], idx = [];
    const L = new THREE.Vector3(-0.5, 0.8, -0.3).normalize(), n = new THREE.Vector3();
    for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) {
      const [x, z, u, v] = fn(i, j), y = heightAt(x, z);
      n.set(heightAt(x - 1, z) - heightAt(x + 1, z), 2, heightAt(x, z - 1) - heightAt(x, z + 1)).normalize();
      const shade = lin(0.66 + 0.42 * Math.max(0, n.dot(L)));
      pos.push(x, y + lift, z); uv.push(u, v); col.push(shade, shade, shade);
    }
    for (let i = 0; i < rows - 1; i++) for (let j = 0; j < cols - 1; j++) {
      const a = i * cols + j, b = a + 1, c = a + cols, d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.setIndex(idx);
    const m = new THREE.MeshBasicMaterial({ map, vertexColors: true, side: THREE.DoubleSide });
    this.own.push(g, m);
    const mesh = new THREE.Mesh(g, m);
    this.scene.add(mesh);
    return mesh;
  }

  repeating(key, id) {
    const tex = paintedTexture(key, 256, 256, { id });
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.needsUpdate = true;
    return tex;
  }

  buildGround() {
    const f = RACE.field, pad = 80, cell = 6;
    const x0 = f.x0 - pad, z0 = f.z0 - pad, cols = Math.ceil((f.x1 - f.x0 + 2 * pad) / cell) + 1, rows = Math.ceil((f.z1 - f.z0 + 2 * pad) / cell) + 1;
    this.surface(rows, cols, (i, j) => { const x = x0 + j * cell, z = z0 + i * cell; return [x, z, x / 6, z / 6]; }, 0, this.repeating('textures/floor_prato', 'race:prato'));
    // beyond: the flat ground under the far hills
    const g = new THREE.PlaneGeometry(2000, 2000), m = new THREE.MeshBasicMaterial({ color: SKY.ground });
    const ground = new THREE.Mesh(g, m);
    ground.rotation.x = -Math.PI / 2; ground.position.y = -6;
    this.scene.add(ground);
    this.own.push(g, m);
  }

  buildTrackMesh() {
    const { samples, count, width } = this.track;
    const sides = [-width / 2 - 0.7, -width / 4, 0, width / 4, width / 2 + 0.7];
    this.surface(count + 1, sides.length, (i, j) => {
      const c = samples[i % count], side = sides[j];
      return [c.x - c.tz * side, c.z + c.tx * side, (side + width / 2) / 4, (i === count ? this.track.length : c.s) / 5];
    }, 0.12, this.repeating('textures/floor_terra_battuta', 'race:terra'));
  }

  // A chequered strip across the track, and a banner on two poles over it.
  buildStartLine() {
    const c = this.track.samples[0], w = this.track.width + 1.4, cols = 12, rows = 2, sq = w / cols;
    const pos = [], col = [];
    const quad = (pts, rgb) => { for (const k of [0, 1, 2, 0, 2, 3]) { pos.push(...pts[k]); col.push(...rgb); } };
    const white = [0.95, 0.95, 0.92], black = [0.02, 0.02, 0.02];
    // on the ground
    for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++) {
      const s0 = -sq + r * sq, s1 = s0 + sq, a = -w / 2 + k * sq, b = a + sq;
      const P = (s, side) => { const x = c.x + c.tx * s - c.tz * side, z = c.z + c.tz * s + c.tx * side; return [x, heightAt(x, z) + 0.16, z]; };
      quad([P(s0, a), P(s1, a), P(s1, b), P(s0, b)], (r + k) % 2 ? white : black);
    }
    // the banner, 3.6 to 4.8 m up, across the track
    const top = 4.8, bottom = 3.6, bw = w + 1, bcols = 14, bsq = bw / bcols, brows = 2, bh = (top - bottom) / brows;
    for (let r = 0; r < brows; r++) for (let k = 0; k < bcols; k++) {
      const a = -bw / 2 + k * bsq, b = a + bsq, y0 = bottom + r * bh, y1 = y0 + bh;
      const P = (side, y) => [c.x - c.tz * side, y, c.z + c.tx * side];
      quad([P(a, y0), P(b, y0), P(b, y1), P(a, y1)], (r + k) % 2 ? white : black);
    }
    // the poles
    for (const side of [-bw / 2 - 0.15, bw / 2 + 0.15]) {
      const x = c.x - c.tz * side, z = c.z + c.tx * side, s = 0.15;
      for (const [dx, dz] of [[1, 0], [0, 1]]) {
        quad([[x - dx * s, 0, z - dz * s], [x + dx * s, 0, z + dz * s], [x + dx * s, top + 0.3, z + dz * s], [x - dx * s, top + 0.3, z - dz * s]], [0.89, 0.15, 0.17]);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    const m = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide });
    this.scene.add(new THREE.Mesh(g, m));
    this.own.push(g, m);
  }

  // Bales, poplars round the field, scarecrows and flags: the levels' decor drawings, one instanced set each.
  buildProps() {
    const spots = {};
    const add = (id, x, z) => (spots[id] ||= []).push({ x, z, y: heightAt(x, z) });
    for (const b of this.track.bales) add('balla', b.x, b.z);
    const f = RACE.field, m = 10;
    for (let x = f.x0; x <= f.x1; x += 38) { add('pioppo', x, f.z0 - m); add('pioppo', x + 19, f.z1 + m); }
    for (let z = f.z0 + 19; z <= f.z1; z += 38) { add('pioppo', f.x0 - m, z); add('pioppo', f.x1 + m, z - 19); }
    for (const [x, z] of [[40, 50], [-10, 70], [85, 45]]) add('spaventapasseri', x, z);
    const c = this.track.samples[0];
    for (const side of [-1, 1]) for (const s of [6, -10]) {
      const off = (this.track.width / 2 + 3.2) * side;
      add('bandierina', c.x + c.tx * s - c.tz * off, c.z + c.tz * s + c.tx * off);
    }
    this.props = Object.entries(spots).map(([id, points]) => {
      const [cw, ch] = decorCanvas(id);
      return new BillboardSet(this.scene, svgTexture(`decor/${id}`, () => decorSprite(id, cw, ch), cw, ch), DECOR[id]?.h || 2, points);
    });
  }

  // ---------- running ----------
  start() { this.paused = false; this.input.reset(); this.beep = 4; }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  controls(r) {
    const k = c => this.input.isDown(c);
    if (this.mode !== 'coop') {
      return {
        gas: k('ArrowUp') || k('KeyW') || k('Space') || k('AltRight') || k('Enter') || k('NumpadEnter'),
        brake: k('ArrowDown') || k('KeyS'),
        steer: (k('ArrowRight') || k('KeyD') ? 1 : 0) - (k('ArrowLeft') || k('KeyA') ? 1 : 0),
      };
    }
    if (r.who === 'p1') return { gas: k('ArrowUp') || k('AltRight') || k('Enter') || k('NumpadEnter'), brake: k('ArrowDown'), steer: (k('ArrowRight') ? 1 : 0) - (k('ArrowLeft') ? 1 : 0) };
    return { gas: k('Space') || k('KeyW'), brake: k('KeyS'), steer: (k('KeyD') ? 1 : 0) - (k('KeyA') ? 1 : 0) };
  }

  update(dt) {
    if (this.paused || this.over) return;
    for (const ev of this.input.takeEvents()) {
      if (ev.code === 'Escape' || ev.code === 'KeyP') { this.paused = true; this.callbacks.onPause(); return; }
      if (ev.code === 'KeyM') this.callbacks.onToggleMusic();
    }
    this.time += dt;
    // 3 2 1 GO!
    if (this.time < 0) {
      const n = Math.ceil(-this.time);
      if (n < this.beep) { this.beep = n; play('menu'); }
      return;
    }
    if (this.beep > 0) { this.beep = 0; play('launch'); this.flash = { text: 'GO!', t: this.time, color: '#7ed957' }; }
    const T = this.time;
    for (const r of this.racers) {
      const t = r.t;
      r.bob += dt * (2 + Math.abs(t.speed) * 0.6);
      if (t.finished !== null) { t.speed *= 0.97; driveTractor(t, { gas: false, brake: false, steer: 0 }, dt, this.track); continue; }
      const ctl = r.who === 'ai' ? aiControl(t, this.track, T) : this.controls(r);
      if (r.who === 'ai') t.maxSpeed = this.rubberBand(r);
      const hit = driveTractor(t, ctl, dt, this.track, { assist: r.who === 'ai' ? 0 : this.assist });
      if (hit && r.who !== 'ai') play('whump');
      if (t.progress >= this.goal) {
        t.finished = T;
        if (r.who !== 'ai') {
          const place = standings(this.racers).indexOf(r) + 1;
          r.flash = { text: place === 1 ? 'YOU WIN!' : `${ordinal(place)}!`, t: T, color: place === 1 ? '#ffd400' : '#ffffff', stay: true };
          play(place === 1 ? 'cheer' : 'exit');
        }
      } else if (r.who !== 'ai' && t.lap !== r.lastLap) {
        if (t.lap === RACE.laps - 1 && r.lastLap === RACE.laps - 2) { r.flash = { text: 'FINAL LAP!', t: T, color: '#ff2d8a' }; play('pickupBig'); }
        r.lastLap = t.lap;
      }
    }
    if (collideTractors(this.racers.map(r => r.t)) && this.players.some(p => this.racers.some(o => o !== p && Math.hypot(o.t.x - p.t.x, o.t.z - p.t.z) < 3))) {
      if ((this.knockT || 0) < T) { play('knock'); this.knockT = T + 0.4; }
    }
    // the engine: chug, faster with the speed
    const fast = Math.max(...this.players.map(p => Math.abs(p.t.speed))) / RACE.speed.bear;
    if ((this.chugT -= dt) <= 0) { play('chug'); this.chugT = 0.5 - 0.3 * Math.min(1, fast); }
    // the end: every bear across the line (or a long time gone by)
    if (this.endT === null && (this.players.every(p => p.t.finished !== null) || T > 360)) this.endT = T + 3;
    if (this.endT !== null && T >= this.endT) this.finish();
  }

  // The others wait a little for a bear far behind and push a little when far ahead (the race stays a race).
  rubberBand(r) {
    const best = Math.max(...this.players.map(p => p.t.progress));
    const gap = r.t.progress - best;
    return RACE.speed.others[this.level] * r.skill * (gap > 40 ? 0.85 : gap < -60 ? 1.08 : 1);
  }

  finish() {
    this.over = true;
    const order = standings(this.racers);
    const places = order.map((r, i) => ({ place: i + 1, name: r.name, who: r.who, color: r.color, time: r.t.finished }));
    const best = Math.min(...this.players.map(p => order.indexOf(p) + 1));
    this.callbacks.onEnd({ name: RACE.name, places, place: best, laps: RACE.laps });
  }

  // ---------- drawing ----------
  views() {
    const size = this.renderer.getSize(new THREE.Vector2()), W = size.x, H = size.y;
    if (this.players.length === 1) return [{ r: this.players[0], x: 0, y: 0, w: W, h: H, gl: [0, 0, W, H] }];
    const h = Math.floor(H / 2);
    return [
      { r: this.players[0], x: 0, y: 0, w: W, h, gl: [0, H - h, W, h] },
      { r: this.players[1], x: 0, y: H - h, w: W, h, gl: [0, 0, W, H - h] },
    ];
  }

  placeCamera(v) {
    const r = v.r, t = r.t, cam = r.camera;
    const fx = -Math.sin(t.yaw), fz = -Math.cos(t.yaw), rx = Math.cos(t.yaw), rz = -Math.sin(t.yaw);
    const ground = heightAt(t.x, t.z);
    const pitch = Math.atan2(heightAt(t.x + fx * 3, t.z + fz * 3) - heightAt(t.x - fx * 3, t.z - fz * 3), 6);
    const roll = Math.atan2(heightAt(t.x + rx * 1.5, t.z + rz * 1.5) - heightAt(t.x - rx * 1.5, t.z - rz * 1.5), 3);
    r.pitch += (pitch - r.pitch) * 0.15; r.roll += (roll - r.roll) * 0.15;
    const shake = (t.bumped > 0 ? 0.08 : 0) + Math.min(1, Math.abs(t.speed) / 13) * 0.025;
    cam.position.set(t.x - fx * 0.4, ground + SEAT + Math.sin(r.bob * 2.3) * shake, t.z - fz * 0.4);
    cam.rotation.set(r.pitch * 0.85 - 0.06, t.yaw, -r.roll * 0.5 + (t.bumped > 0 ? (Math.random() - 0.5) * 0.04 : 0));
    const aspect = v.w / v.h;
    cam.aspect = aspect;
    cam.fov = 2 * Math.atan(Math.tan(FOV_H * Math.PI / 360) / aspect) * 180 / Math.PI;
    cam.updateProjectionMatrix();
  }

  // Billboards turn to the camera of this view; the tractors face the way they drive.
  placeBillboards(v) {
    const yaw = v.r.t.yaw, cfx = -Math.sin(yaw), cfz = -Math.cos(yaw), crx = Math.cos(yaw), crz = -Math.sin(yaw);
    for (const set of this.props) set.place(v.r.camera.position, yaw, FAR);
    for (const r of this.racers) {
      const t = r.t, mine = r === v.r;
      r.body.mesh.visible = !mine; r.driver.mesh.visible = !mine;
      if (mine) continue;
      const fx = -Math.sin(t.yaw), fz = -Math.cos(t.yaw);
      r.body.flip = fx * crx + fz * crz < 0;
      const y = heightAt(t.x, t.z) + Math.abs(Math.sin(r.bob * 3)) * 0.05 * Math.min(1, Math.abs(t.speed) / 5);
      r.body.place(t.x, y, t.z, yaw);
      // the driver sits just behind the drawing (the tractor hides the legs), at the seat
      const across = (r.seat[0] - 0.5) * r.body.width * (r.body.flip ? -1 : 1);
      r.driver.place(t.x + cfx * 0.25 + crx * across, y + r.body.height * (1 - r.body.foot) * r.seat[1], t.z + cfz * 0.25 + crz * across, yaw);
    }
  }

  render() {
    const R = this.renderer;
    const views = this.views();
    for (const v of views) {
      this.placeCamera(v);
      this.placeBillboards(v);
      this.sky.position.set(v.r.camera.position.x, 40, v.r.camera.position.z);
      R.setViewport(...v.gl); R.setScissor(...v.gl); R.setScissorTest(views.length > 1);
      R.render(this.scene, v.r.camera);
    }
    if (views.length > 1) { R.setScissorTest(false); const s = R.getSize(new THREE.Vector2()); R.setViewport(0, 0, s.x, s.y); }
    this.drawHud(views);
  }

  drawHud(views) {
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

  text(str, x, y, size, color, align = 'center') {
    const ctx = this.ctx;
    ctx.font = font(size); ctx.textAlign = align; ctx.textBaseline = 'alphabetic';
    ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(3, size / 9); ctx.strokeStyle = INK; ctx.fillStyle = color;
    ctx.strokeText(str, x, y); ctx.fillText(str, x, y);
  }

  // The red bonnet, the exhaust, the speedometer and the steering wheel with the bear's paws: drawn by the code.
  drawCockpit(b, r) {
    const ctx = this.ctx, s = b.h / 720, cx = b.x + b.w / 2, by = b.y + b.h, t = r.t;
    const shakeY = t.bumped > 0 ? Math.sin(this.time * 70) * 4 * s : Math.sin(r.bob * 2.3) * 2 * s;
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
      const k = ((this.time * (1.2 + Math.abs(t.speed) / 8) + i / puffs) % 1 + 1) % 1, rr = (10 + 22 * k) * s;
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
    const ctx = this.ctx, s = Math.max(0.6, b.h / 720), t = r.t, order = standings(this.racers), place = order.indexOf(r) + 1;
    const pad = 22 * s;
    this.text(ordinal(place), b.x + pad, b.y + pad + 70 * s, 84 * s, place === 1 ? '#ffd400' : '#ffffff', 'left');
    ctx.font = font(84 * s);
    const pw = ctx.measureText(ordinal(place)).width;
    this.text(`/${this.racers.length}`, b.x + pad + pw + 8 * s, b.y + pad + 70 * s, 44 * s, '#ffffff', 'left');
    const lap = Math.max(1, Math.min(RACE.laps, t.lap + 1));
    this.text(`LAP ${lap}/${RACE.laps}`, b.x + pad, b.y + pad + 118 * s, 40 * s, '#ffffff', 'left');
    const time = Math.max(0, (t.finished ?? this.time));
    this.text(`${Math.floor(time / 60)}:${String(Math.floor(time % 60)).padStart(2, '0')}`, b.x + pad, b.y + pad + 160 * s, 34 * s, '#f4ecd8', 'left');
    if (this.mode === 'coop') this.text(r.name, b.x + b.w / 2, b.y + pad + 40 * s, 36 * s, r.color);
    // the big words in the middle
    const cx = b.x + b.w / 2, cy = b.y + b.h * 0.36;
    if (this.time < 0) {
      const n = Math.ceil(-this.time);
      if (n <= 3) this.text(String(n), cx, cy + 50 * s, 170 * s, n === 1 ? '#ffd400' : '#ffffff');
      else this.text('READY?', cx, cy + 30 * s, 110 * s, '#ffffff');
      return;
    }
    const f = r.flash?.stay || (r.flash && this.time - r.flash.t < 1.6) ? r.flash : this.flash && this.time - this.flash.t < 0.9 ? this.flash : null;
    if (f) this.text(f.text, cx, cy + 40 * s, 120 * s, f.color);
    else if (t.wrongWay && t.finished === null) this.text('WRONG WAY!', cx, cy + 30 * s, 90 * s, '#ff2d8a');
  }

  drawMap(b, r, s) {
    const ctx = this.ctx, box = this.mapBox, mw = 230 * s, mh = mw * (box.z1 - box.z0) / (box.x1 - box.x0);
    const x0 = b.x + b.w - mw - 26 * s, y0 = b.y + 22 * s;
    const P = (x, z) => [x0 + (x - box.x0) / (box.x1 - box.x0) * mw, y0 + (z - box.z0) / (box.z1 - box.z0) * mh];
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    for (const [w, c] of [[16 * s, INK], [8 * s, '#e8c890']]) {
      ctx.lineWidth = w; ctx.strokeStyle = c;
      ctx.beginPath();
      this.mapPts.forEach((p, i) => { const [x, y] = P(p.x, p.z); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); });
      ctx.closePath(); ctx.stroke();
    }
    const [lx, ly] = P(this.track.samples[0].x, this.track.samples[0].z);
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = INK; ctx.lineWidth = 3 * s;
    ctx.beginPath(); ctx.rect(lx - 3 * s, ly - 9 * s, 6 * s, 18 * s); ctx.fill(); ctx.stroke();
    for (const o of [...this.racers].sort((a) => (a.who === 'ai' ? -1 : 1))) {
      const [x, y] = P(o.t.x, o.t.z), rad = (o === r || (!r && o.who !== 'ai') ? 11 : 8) * s;
      ctx.fillStyle = o.color; ctx.lineWidth = 3.5 * s; ctx.strokeStyle = INK;
      ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
  }

  dispose() {
    this.over = true;
    for (const r of this.racers) { r.body.remove(); r.driver.remove(); }
    for (const set of this.props) set.remove();
    for (const o of this.own) o.dispose?.();
    this.scene.clear();
    this.canvas.remove?.();
  }
}
