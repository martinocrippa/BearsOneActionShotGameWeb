// One level being played. Owns the 3D scene, the player, opponents, projectiles and pickups.
// Screens (pause, buonanotte, report…) are handled by main.js through the callbacks.
import * as THREE from 'three';
import { parseLevel, CELL, cellCenter } from '../core/level.js';
import { slide, floorUnder, topUnder, ceilingOver, cellAtWorld, isSolid, lineOfSight, GRAVITY, STEP_HEIGHT, HEAD_ROOM } from '../core/physics.js';
import { createSleep, addSleep, napTaken, faceFor } from '../core/sleep.js';
import { createCheatReader } from '../core/cheats.js';
import { encodePassword } from '../core/password.js';
import { signDirection, arrowFor, keyRounds, signNeeds } from '../core/signs.js';
import { signTexture } from '../art/signs.js';
import { WEAPONS, AMMO, START_WEAPONS, weaponBySlot } from '../../data/weapons.js';
import { ITEMS, DECOR, KEYS } from '../../data/items.js';
import { ENEMIES } from '../../data/enemies.js';
import { CHEATS } from '../../data/cheats.js';
import { difficultyAt } from '../../data/difficulty.js';
import { buildWorld, Billboard } from './world.js';
import { Enemy } from './enemies.js';
import { Trick } from './trick.js';
import { readMove } from './input.js';
import { svgTexture, whenLoaded } from '../art/registry.js';
import { itemSprite, decorSprite, exitSprite } from '../art/sprites.js';
import { play } from '../audio.js';
import { RUN_SPEED, JUMP_SPEED, TURN_SPEED, decorCanvas, aimPoint, KEY_COLORS } from './game-shared.js';
import { combatMethods } from './combat.js';
import { levelMethods } from './level-logic.js';

// The core of a level: building it, the player's movement, the main update and render, dispose. Combat
// (combat.js) and the level's own logic (level-logic.js) are method groups attached to the prototype at the
// bottom, so `this` and every method name are what they were.
export class Game {
  constructor({ renderer, hud, weaponView, input, levelDef, levelIndex, bear, mode, difficulty, save, callbacks }) {
    Object.assign(this, { renderer, hud, weaponView, input, levelDef, levelIndex, bear, mode, difficulty, callbacks });
    this.diff = difficultyAt(difficulty);
    this.level = parseLevel(levelDef.map, levelDef.legend);
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(levelDef.sky.top);
    this.scene.fog = new THREE.Fog(levelDef.sky.bottom, levelDef.fogNear ?? 50, levelDef.fogFar ?? 120);
    this.camera = new THREE.PerspectiveCamera(74, 16 / 9, 0.05, 600);
    this.camera.rotation.order = 'YXZ';
    this.paused = true;
    this.cheats = createCheatReader(CHEATS);
    this.time = 0;
    this.warned = new Set(); // one-time hints already shown
    this.hud.mud(false);
    this.hud.trapped(null);
    this.deniedT = 0;

    const world = buildWorld(this.level, levelDef, { keyColors: KEY_COLORS });
    this.scene.add(world.group);
    Object.assign(this, {
      doors: world.doors, secretWalls: world.secretWalls, movers: world.movers, switches: world.switches,
      floors: world.floors, sky: world.sky, animated: world.animated, weather: world.weather, ownTextures: world.ownTextures,
    });

    // ---- player ----
    const start = this.level.start;
    this.player = {
      x: start.x, z: start.z, y: start.y, vy: 0, yaw: 0, pitch: 0, r: 0.35, eye: bear.eyeHeight,
      onGround: true, jumpHeld: false, cooldown: 0, bob: 0, hurtT: 0, grinT: 0, fireFaceT: 0, shakeT: 0, pushT: 0, sink: 0, inMud: false, mudFlashT: 0,
      weapons: [...START_WEAPONS], weapon: 'fionda', infinite: false, keys: new Set(), backpack: false,
      ammo: Object.fromEntries(Object.entries(AMMO).map(([k, a]) => [k, a.start])),
      sleep: createSleep(), boots: 0, trapT: 0, trapKind: null, vx: 0, vz: 0, charge: 0,
    };
    this.checkpointIndex = -1;
    this.seen = new Set(); // map cells the bear has seen (automap)
    this.looked = new Set(); // floor cells already looked at
    this.mapAll = false;

    // ---- things in the level ----
    const ents = this.level.entities;
    // easier levels have fewer opponents (DOOM's skill flags): a fixed pick by position, bosses always stay
    const keep = e => {
      if (ENEMIES[e.id]?.boss || ENEMIES[e.id]?.miniBoss || levelDef.training) return true; // training: every cut-out
      const n = Math.sin(e.cx * 91.7 + e.cz * 37.3) * 9301.13;
      return n - Math.floor(n) < (this.diff.crowd ?? 1);
    };
    this.enemies = ents.filter(e => e.type === 'enemy' && keep(e)).map(e => new Enemy(this, e));
    this.items = ents.filter(e => e.type === 'item').map(e => {
      const bb = new Billboard(this.scene, { fit: ITEMS[e.id]?.fit || 0.5 });
      bb.texture = svgTexture(`items/${e.id}`, () => itemSprite(e.id), 256, 256);
      return { ...e, bb, taken: false, phase: Math.random() * 6 };
    });
    this.decor = ents.filter(e => e.type === 'decor').map(e => {
      const d = DECOR[e.id] || { r: 0.4, h: 2 }, [cw, ch] = decorCanvas(e.id);
      const bb = new Billboard(this.scene, { fit: d.h });
      bb.texture = svgTexture(`decor/${e.id}`, () => decorSprite(e.id, cw, ch), cw, ch);
      return { ...e, bb, r: d.r, h: d.h, top: d.top, pop: d.pop, popped: false };
    });
    this.checkpoints = ents.filter(e => e.type === 'checkpoint').map((e, i) => {
      const bb = new Billboard(this.scene, { fit: 1.2 });
      bb.texture = svgTexture('items/checkpoint', () => itemSprite('checkpoint'), 256, 256);
      return { ...e, bb, index: i };
    });
    this.exits = ents.filter(e => e.type === 'exit').map(e => {
      const bb = new Billboard(this.scene, { fit: levelDef.exitProp === 'mushroom' ? 3.2 : 2.2 });
      const ex = { ...e, bb, on: false };
      bb.texture = this.exitTexture(ex);
      return ex;
    });
    this.secretSpots = ents.filter(e => e.type === 'secretSpot').map(e => ({ ...e, found: false }));
    // signposts (levelDef.signs): their arrow follows the way to a key, a door or the exit; a sign whose goal comes
    // later asks for the keys it needs first (see src/core/signs.js)
    const order = keyRounds(this.level, { bossOpens: levelDef.bossOpens });
    this.signs = (levelDef.signs || []).map(s => {
      const c = cellCenter(s.x, s.z);
      const bb = new Billboard(this.scene, { width: 1.5, height: 2.25, foot: 6 / 384 }); // the board ~1.3 m wide, at eye height
      return {
        text: s.text, dir: signDirection(this.level, s), needs: signNeeds(s, order), dirs: new Map(), cx: s.x, cz: s.z,
        x: c.x, z: c.z, y: this.level.at(s.x, s.z)?.h ?? 0, bb, arrow: undefined, shown: undefined,
      };
    });
    // a car or a tractor (`top` in data/items.js) is also a platform, where the ceiling leaves room for the head
    const roomOver = d => { const c = cellAtWorld(this.level, d.x, d.z); return !c || c.ceil === null || c.ceil - (d.y + d.top) >= HEAD_ROOM; };
    this.staticObstacles = this.decor.filter(d => d.r > 0)
      .map(d => (d.obstacle = { x: d.x, z: d.z, r: d.r, top: d.top !== undefined && roomOver(d) ? d.y + d.top : undefined }))
      .concat(this.checkpoints.map(c => ({ x: c.x, z: c.z, r: 0.35 })))
      .concat(this.signs.map(s => ({ x: s.x, z: s.z, r: 0.25 })));
    this.poppers = this.decor.filter(d => d.pop); // bins that burst into confetti when hit
    this.bits = []; // flying confetti
    this.projectiles = [];
    this.splats = [];
    this.fx = []; // short-lived drawings (sweets bursts)

    this.stats = {
      kills: 0, totalKills: this.enemies.length, items: 0, totalItems: this.items.length,
      secrets: 0, totalSecrets: this.secretSpots.length, time: 0, tricks: 0, totalTricks: levelDef.trick ? 1 : 0,
    };
    // the bonus room's trick (data/tricks.js): the Topo, 3 tries, an absurd weapon as the prize
    this.trick = levelDef.trick && !levelDef.training ? new Trick(this, levelDef.trick) : null;

    if (save) this.restore(save);
    this.weaponView.show(this.player.weapon, bear);
  }

  async ready() { await whenLoaded(); }

  exitTexture(ex) {
    const state = ex.on ? 'on' : 'off';
    if (this.levelDef.exitProp === 'mushroom') return svgTexture(`props/exit_${state}`, () => exitSprite(ex.on), 512, 512);
    const key = ex.secret ? `props/lever_secret_${state}` : `props/lever_${state}`;
    return svgTexture(key, () => exitSprite(ex.on, ex.secret ? 'secret' : 'lever'), 512, 512);
  }

  // ---------- save / restore ----------
  // What travels with the bear: weapons, sweets, backpack, lives, how sleepy and how much chocolate (as in DOOM).
  snapshot() {
    const p = this.player;
    return {
      level: this.levelIndex, bear: this.bear.id, difficulty: this.difficulty, lives: p.sleep.lives, checkpoint: this.checkpointIndex,
      weapons: [...p.weapons], ammo: { ...p.ammo }, backpack: p.backpack,
      sleep: Math.round(p.sleep.value), armor: Math.round(p.sleep.armor), strong: p.sleep.strong,
    };
  }
  password() { return encodePassword(this.snapshot()); }

  restore(save) {
    const p = this.player;
    p.sleep.lives = save.lives;
    p.backpack = !!save.backpack;
    p.weapons = [...new Set([...START_WEAPONS, ...save.weapons])].filter(k => WEAPONS[k]);
    for (const k of Object.keys(AMMO)) p.ammo[k] = Math.min(this.ammoMax(k), save.ammo[k] ?? p.ammo[k]);
    p.sleep.value = save.sleep ?? 0;
    p.sleep.armor = save.armor ?? 0;
    p.sleep.strong = !!save.strong;
    if (save.checkpoint >= 0 && this.checkpoints[save.checkpoint]) this.activateCheckpoint(this.checkpoints[save.checkpoint], true);
    this.respawnAtCheckpoint();
  }

  respawnAtCheckpoint() {
    const p = this.player;
    const cp = this.checkpoints[this.checkpointIndex];
    const at = cp ? { x: cp.x, z: cp.z + CELL * 0.45, y: cp.y } : this.level.start;
    Object.assign(p, { x: at.x, z: at.z, y: at.y, vy: 0, vx: 0, vz: 0, yaw: 0, pitch: 0, trapT: 0 });
    this.hud.trapped(null);
    p.ammo.caramelle = Math.max(p.ammo.caramelle, 20);
  }

  ammoMax(k) { return AMMO[k].max * (this.player.backpack ? 2 : 1); }

  // ---------- sleep ----------
  addPlayerSleep(amount) {
    const p = this.player;
    const r = addSleep(p.sleep, amount, this.bear.sleepRate);
    if (amount > 0 && !p.sleep.god) { p.hurtT = 0.45; }
    if (r === 'asleep') this.fallAsleep();
    return r;
  }

  // Tied up with licorice (or stuck in jelly): the bear cannot walk for a moment; moving keys wriggle it free faster.
  trapPlayer(seconds, kind) {
    const p = this.player;
    if (p.sleep.god) return;
    p.trapT = Math.max(p.trapT, seconds * this.diff.sleep ** 0.5);
    p.trapKind = kind;
    this.hud.trapped(kind);
    this.hint('trap', 'TIED UP! Wiggle with the arrows to get free!');
  }

  async fallAsleep() {
    if (this.paused) return;
    this.paused = true;
    play('yawn');
    const over = napTaken(this.player.sleep);
    if (over) { play('lose'); this.callbacks.onLose(); return; }
    await this.callbacks.onSleep(this.player.sleep.lives);
    this.respawnAtCheckpoint();
    this.callbacks.save(this.snapshot());
    this.callbacks.onResume();
  }

  // ---------- per frame ----------
  handleEvents() {
    for (const ev of this.input.takeEvents()) {
      if (ev.code === 'Escape' || ev.code === 'KeyP') { this.callbacks.onPause(); return; }
      if (ev.code === 'KeyM') this.callbacks.onToggleMusic();
      if (ev.code === 'Space') this.trick?.press(); // even a quick tap counts in a timing trick
      const m = /^Digit([0-9])$/.exec(ev.code);
      if (m && m[1] !== '0' && this.warpWait) { this.warpWait = false; this.paused = true; this.callbacks.onWarp?.(+m[1] - 1); return; }
      if (m && m[1] === '0') this.cycleBonus();
      else if (m) { const k = weaponBySlot(+m[1]); if (k) this.selectWeapon(k); }
      const cheat = this.cheats.feed(ev.key);
      if (cheat) this.applyCheat(cheat);
      // Q/E change weapon, except while a code is being typed (IDDQD, ZUCCHERONE…)
      else if ((ev.code === 'KeyQ' || ev.code === 'KeyE') && !this.cheats.typing()) this.cycleWeapon(ev.code === 'KeyE' ? 1 : -1);
      // wriggling free
      if (this.player.trapT > 0 && /^Arrow|^Key[ADWS]$/.test(ev.code)) this.player.trapT -= 0.12;
    }
  }

  movePlayer(dt) {
    const p = this.player, input = this.input;
    // playing a timing trick: the bear stands on the spot, facing the target
    const hold = this.trick?.holds;
    if (hold) { Object.assign(p, { x: hold.x, z: hold.z, yaw: hold.yaw, vx: 0, vz: 0 }); p.bob *= 0.9; return; }
    const mv = readMove(input, this.mode);
    p.yaw -= mv.turn * TURN_SPEED * dt;

    // tied up: no walking until free
    if (p.trapT > 0) {
      p.trapT -= dt;
      if (p.trapT <= 0) { this.hud.trapped(null); play('twang'); }
      mv.f = 0; mv.strafe = 0; mv.jump = false;
    }

    const cell = cellAtWorld(this.level, p.x, p.z);
    const onFloor = cell && p.y <= cell.h + 0.05;
    const fx = onFloor ? cell.fx : null;
    const boots = p.boots > 0;
    if (p.boots > 0) { p.boots -= dt; if (p.boots <= 0) this.hud.message('The rubber boots are worn out.'); }
    const slow = fx && !boots ? fx.slow : 1;
    const speed = RUN_SPEED * this.bear.speed * slow;
    const fwx = -Math.sin(p.yaw), fwz = -Math.cos(p.yaw), rx = Math.cos(p.yaw), rz = -Math.sin(p.yaw);
    let dx = (fwx * mv.f + rx * mv.strafe), dz = (fwz * mv.f + rz * mv.strafe);
    const len = Math.hypot(dx, dz);
    if (len > 1) { dx /= len; dz /= len; }
    // grip: on ice the bear keeps sliding; just after a pillow hit it slides back a little; elsewhere it starts
    // and stops at once
    const grip = fx?.slip ? 1.6 : p.pushT > 0 ? 5 : 40;
    p.vx += (dx * speed - p.vx) * Math.min(1, grip * dt);
    p.vz += (dz * speed - p.vz) * Math.min(1, grip * dt);
    const r = slide(this.level, p, p.vx * dt, p.vz * dt, this.obstaclesFor(p));
    if (r.blockedX) p.vx = 0;
    if (r.blockedZ) p.vz = 0;
    // bumped into a step too high to walk but low enough to jump: say so (kids don't guess it)
    if ((r.blockedX || r.blockedZ) && len > 0.5 && p.onGround) {
      const ahead = cellAtWorld(this.level, p.x + dx * 1.2, p.z + dz * 1.2);
      if (ahead && !isSolid(ahead) && ahead.h > p.y + STEP_HEIGHT && ahead.h < p.y + 1.5) this.tip('jump', this.mode === 'coop' ? 'Too high? JUMP! (driver: ALT GR)' : 'Too high? JUMP with ALT GR!');
    }
    const moved = Math.hypot(r.x - p.x, r.z - p.z);
    p.x = r.x; p.z = r.z;

    // vertical: gravity, jumping, smooth step-up onto ledges, head against the ceiling
    // the floor, or the roof of the car the bear stands on (its drawing is hidden meanwhile: the bear is inside it)
    const roof = topUnder(this.staticObstacles, p.x, p.z, p.r * 0.6, p.y);
    const floor = Math.max(floorUnder(this.level, p.x, p.z, p.r * 0.6), roof);
    p.onTop = roof > -Infinity && p.y <= roof + 0.05 ? roof : null;
    const ceil = ceilingOver(this.level, p.x, p.z, p.r * 0.6);
    if (mv.jump && !p.jumpHeld && p.onGround) { p.vy = JUMP_SPEED * Math.sqrt(this.bear.jump); p.onGround = false; play('whoosh'); }
    p.jumpHeld = mv.jump;
    if (p.y > floor + 0.001 || p.vy > 0) {
      p.vy -= GRAVITY * dt;
      p.y += p.vy * dt;
      if (p.y + p.eye + 0.15 > ceil) { p.y = ceil - p.eye - 0.15; p.vy = Math.min(0, p.vy); }
      if (p.y <= floor) { p.y = floor; p.vy = 0; p.onGround = true; } else p.onGround = false;
    } else {
      p.y += (floor - p.y) * Math.min(1, dt * 18);
      p.vy = 0; p.onGround = true;
    }

    // Mud and water: the bear sinks to the knees (lower view, weapon lower), it squelches at every step and a
    // band covers the bottom of the screen. Sleepy floors (mud) flash lightly, like DOOM's toxic slime.
    const wading = !!(fx?.liquid && p.onGround);
    if (wading !== p.inMud) {
      p.inMud = wading; this.hud.mud(wading ? cell.floor : false);
      if (wading) play('squelch');
      p.mudFlashT = 0;
    }
    p.sink += ((wading ? 0.35 : 0) - p.sink) * Math.min(1, dt * 6);
    if (fx?.sleepy && p.onGround && !boots) {
      // (not over a hit's flash)
      if ((p.mudFlashT -= dt) <= 0 && !p.sleep.god && p.shakeT <= 0) { this.hud.flash('mud'); p.mudFlashT = 0.9; }
      this.hint('mud', 'Sticky mud! It makes you sleepy...');
      this.addPlayerSleep(fx.sleepy * this.diff.mud * dt);
    }
    if (fx?.slip) this.hint('ice', 'ICE! Slippery...');
    const prevBob = p.bob;
    p.bob = p.onGround && moved > 0.001 ? p.bob + dt * (wading ? 6 : 9) : p.bob * 0.9;
    if (wading && Math.floor(p.bob / Math.PI) !== Math.floor(prevBob / Math.PI)) play('squelch');
  }

  // Cells around the bear go on the automap.
  updateSeen() {
    const p = this.player, cx = Math.floor(p.x / CELL), cz = Math.floor(p.z / CELL);
    for (let dz = -6; dz <= 6; dz++) for (let dx = -6; dx <= 6; dx++) {
      const k = (cx + dx) + ',' + (cz + dz);
      if (this.looked.has(k)) continue;
      const c = this.level.at(cx + dx, cz + dz);
      if (!c) continue;
      const cc = cellCenter(c.cx, c.cz);
      if (c.wall && !c.door) continue; // walls go on the map with the floors next to them
      if (Math.hypot(dx, dz) < 1.5 || lineOfSight(this.level, p.x, p.y + p.eye, p.z, cc.x, p.y + p.eye, cc.z)) {
        this.looked.add(k);
        for (let nz = -1; nz <= 1; nz++) for (let nx = -1; nx <= 1; nx++) this.seen.add((c.cx + nx) + ',' + (c.cz + nz));
      }
    }
  }

  update(dt) {
    if (this.paused) return;
    this.time += dt;
    // liquids "boil": swap their two drawings
    for (const a of this.animated) a.material.map = a.frames[Math.floor(this.time * 2.5) % 2];
    const p = this.player;
    this.handleEvents();
    if (this.paused) return;
    this.movePlayer(dt);
    this.trick?.update(dt);
    p.cooldown -= dt; p.hurtT -= dt; p.grinT -= dt; p.fireFaceT -= dt; p.shakeT -= dt; p.pushT -= dt;
    this.weatherDt = (this.weatherDt || 0) + dt;
    if (this.input.firing) this.tryFire(dt); else p.charge = 0;
    this.updatePaths(dt);
    for (const e of this.enemies) e.update(dt);
    this.updateProjectiles(dt);
    this.animateMovers(dt);
    this.checkTriggers(dt);
    if (Math.floor(this.time * 4) !== Math.floor((this.time - dt) * 4)) this.updateSeen();
  }

  // Once per screen frame (update() can run several sub-steps per frame on a slow computer).
  render() {
    const p = this.player, cam = this.camera;
    if (!this.paused) {
      this.hud.showMap(this.input.isDown('Tab'));
      this.hud.update({
        bear: this.bear, weapon: p.weapon, ammo: p.ammo, infinite: p.infinite, sleep: p.sleep,
        mood: faceFor(p.sleep, { hurt: p.hurtT > 0, grin: p.grinT > 0, trapped: p.trapT > 0, firing: p.fireFaceT > 0 && WEAPONS[p.weapon].face }),
        keyList: [...p.keys], owned: p.weapons,
      });
      this.hud.drawMap(this);
      this.weaponView.bob(Math.sin(p.bob) * 16, Math.abs(Math.cos(p.bob)) * 12 + p.sink * 90);
    }
    // hit: the view jolts for a moment
    const shake = Math.max(0, p.shakeT) * 0.5, jx = (Math.random() - 0.5) * shake, jy = (Math.random() - 0.5) * shake;
    cam.position.set(p.x + jx, p.y + p.eye - p.sink + Math.sin(p.bob * 2) * 0.035 + jy, p.z);
    cam.rotation.y = p.yaw; cam.rotation.x = p.pitch;
    cam.rotation.z = (Math.random() - 0.5) * shake * 0.4;
    this.sky.position.x = p.x; this.sky.position.z = p.z;
    // the weather moves by the game time gone by since the last frame (so it stops while paused)
    if (this.weather && this.weatherDt) { this.weather.update(this.weatherDt, p.x, p.y, p.z); this.weatherDt = 0; }
    const lightAt = (x, z) => cellAtWorld(this.level, x, z)?.light ?? 1;
    for (const e of this.enemies) e.render(p.yaw);
    const t = performance.now() / 1000;
    for (const it of this.items) if (!it.taken) { it.bb.light = lightAt(it.x, it.z); it.bb.place(it.x, it.y + 0.08 + Math.sin(t * 2.5 + it.phase) * 0.06, it.z, p.yaw); }
    for (const d of this.decor) if (!d.popped) {
      d.bb.light = lightAt(d.x, d.z); d.bb.place(d.x, d.y, d.z, p.yaw);
      if (d.obstacle?.top !== undefined && Math.hypot(p.x - d.x, p.z - d.z) < d.r && p.y >= d.obstacle.top - 0.3) d.bb.mesh.visible = false;
    }
    for (const c of this.checkpoints) c.bb.place(c.x, c.y, c.z, p.yaw);
    for (const s of this.signs) {
      // until the keys that come first are in the bear's paws, the sign asks for the first of them
      const first = s.needs.find(k => !p.keys.has(k));
      if (first && !s.dirs.has(first)) s.dirs.set(first, signDirection(this.level, { x: s.cx, z: s.cz, to: first }));
      const text = first ? `FIND THE ${KEYS[first]?.name || 'KEY'} FIRST!` : s.text;
      const arrow = arrowFor(first ? s.dirs.get(first) : s.dir, p.yaw); // the arrow turns with the way you look at the sign
      if (arrow !== s.arrow || text !== s.shown) { s.bb.texture = signTexture(text, arrow); s.arrow = arrow; s.shown = text; }
      s.bb.light = lightAt(s.x, s.z);
      s.bb.place(s.x, s.y, s.z, p.yaw);
    }
    for (const ex of this.exits) ex.bb.place(ex.x, ex.y, ex.z, p.yaw);
    for (const pr of this.projectiles) pr.bb.place(pr.x, pr.y, pr.z, p.yaw);
    for (const s of this.splats) s.bb.place(s.x, s.y, s.z, p.yaw);
    for (const f of this.fx) f.bb.place(f.x, f.y, f.z, p.yaw);
    for (const b of this.bits) b.bb.place(b.x, b.y, b.z, p.yaw);
    this.trick?.render(p.yaw);
    this.renderer.render(this.scene, cam);
    // the opponent the auto-aim has locked on gets a red mark over its head, so nothing covers its face; else the
    // crosshair in the middle, hidden for a moment after a knock-out so the comic effect shows whole
    const lock = !this.paused && this.aimTarget(p.yaw);
    if (lock) {
      const v = aimPoint.set(lock.e.x, lock.top, lock.e.z).project(cam), el = this.renderer.domElement;
      this.hud.aim((v.x + 1) / 2 * el.clientWidth, (1 - v.y) / 2 * el.clientHeight);
    } else this.hud.aim(null, null, performance.now() < (this.koUntil || 0) || !!this.trick?.holds); // (no crosshair while fishing or kicking)
  }

  resize(w, h) { this.camera.aspect = w / h; this.camera.updateProjectionMatrix(); }

  // Frees what this level put on the graphics card. Pictures from the registry stay cached for the next level,
  // and so do the materials and geometries shared by every level (marked `shared`).
  dispose() {
    this.disposed = true;
    for (const e of this.enemies) e.dispose();
    this.scene.traverse(o => {
      if (o.geometry && !o.geometry.userData.shared) o.geometry.dispose();
      for (const m of [].concat(o.material || [])) if (!m.userData.shared) m.dispose();
      if (o.isInstancedMesh) o.dispose();
    });
    for (const t of this.ownTextures || []) t.dispose();
    this.scene.clear();
  }
}

Object.assign(Game.prototype, combatMethods, levelMethods);
