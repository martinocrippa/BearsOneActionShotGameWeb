// One level being played. Owns the 3D scene, the player, opponents, projectiles and pickups.
// Screens (pause, buonanotte, report…) are handled by main.js through the callbacks.
import * as THREE from 'three';
import { parseLevel, CELL, cellCenter } from '../core/level.js';
import { slide, floorUnder, ceilingOver, cellAtWorld, isSolid, blocksSight, lineOfSight, GRAVITY, STEP_HEIGHT } from '../core/physics.js';
import { createSleep, addSleep, addArmor, napTaken, faceFor } from '../core/sleep.js';
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
import { readMove } from './input.js';
import { svgTexture, whenLoaded, hasAsset } from '../art/registry.js';
import { itemSprite, decorSprite, projectileSprite, splatSprite, splatOf, exitSprite, SPLAT_COLORS } from '../art/sprites.js';
import { play } from '../audio.js';

const RUN_SPEED = 7;
const PROJECTILE_CANVAS = 256; // projectiles and splats: 256×256, centred (Claude Design delivery)
const JUMP_SPEED = 7.4;
const TURN_SPEED = 2.4;
// Canvas size of the placeholder decor drawings (real drawings bring their own size).
const DECOR_CANVAS = { abete: [512, 1024], betulla: [512, 1024], cespuglio: [512, 256], funghi: [256, 256], cartello: [256, 512] };
const decorCanvas = id => DECOR_CANVAS[id] || ((DECOR[id]?.h ?? 2) > 3 ? [512, 1024] : [512, 512]);
const rand = (a, b) => a + Math.random() * (b - a);
const angleDiff = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
const aimPoint = new THREE.Vector3();
// The little caption for a picked-up item, and its colour.
function pickupTag(def, ammoMul = 1) {
  if (def.key) return [`${KEYS[def.key]?.name || 'KEY'}!`, KEYS[def.key]?.color || '#ffd400'];
  if (def.weapon) return [`${(def.msg.match(/THE (.*?)!/) || [])[1] || def.name.toUpperCase()}!`, '#ff2d8a'];
  if (def.sleep) return [def.sleep <= -100 ? 'WIDE AWAKE!' : `+${-def.sleep} AWAKE`, '#ffd400'];
  if (def.armor) return [`CHOCO +${def.armor}`, '#c87a3e'];
  if (def.ammo) return [`+${Math.round(def.amount * ammoMul)} ${AMMO[def.ammo].label}`, '#ffffff'];
  if (def.backpack) return ['BACKPACK!', '#28c2b4'];
  if (def.boots) return ['RUBBER BOOTS!', '#ffd400'];
  if (def.map) return ['MAP! (TAB)', '#ffffff'];
  return [def.name.toUpperCase(), '#ffffff'];
}
const KEY_COLORS = Object.fromEntries(Object.entries(KEYS).map(([k, v]) => [k, v.color]));

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
      return { ...e, bb, r: d.r, h: d.h, pop: d.pop, popped: false };
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
    this.staticObstacles = this.decor.filter(d => d.r > 0).map(d => (d.obstacle = { x: d.x, z: d.z, r: d.r }))
      .concat(this.checkpoints.map(c => ({ x: c.x, z: c.z, r: 0.35 })))
      .concat(this.signs.map(s => ({ x: s.x, z: s.z, r: 0.25 })));
    this.poppers = this.decor.filter(d => d.pop); // bins that burst into confetti when hit
    this.bits = []; // flying confetti
    this.projectiles = [];
    this.splats = [];
    this.fx = []; // short-lived drawings (sweets bursts)

    this.stats = {
      kills: 0, totalKills: this.enemies.length, items: 0, totalItems: this.items.length,
      secrets: 0, totalSecrets: this.secretSpots.length, time: 0,
    };

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

  // ---------- obstacles ----------
  // What can block `body` in this step: only what is near (a step is well under a metre). One reused list:
  // slide() reads it at once, and this runs for every walking body on every sub-step.
  obstaclesFor(body) {
    const list = this.obstacleList ||= [];
    list.length = 0;
    const add = o => {
      const dx = body.x - o.x, dz = body.z - o.z, rr = body.r + o.r, d2 = dx * dx + dz * dz;
      if (d2 >= rr * rr && d2 < (rr + 1.5) ** 2) list.push(o); // already overlapping: let them separate
    };
    for (const o of this.staticObstacles) add(o);
    for (const e of this.enemies) if (e !== body && !e.out && !!e.def.fly === !!body.fly) add(e);
    if (body !== this.player) add(this.player);
    return list;
  }

  // ---------- events from enemies ----------
  sound(name) { play(name); }

  // counted once: the training cut-outs get back up and can be knocked out again
  onKnockOut(e) { if (!e.counted) { e.counted = true; this.stats.kills++; } }

  // An opponent throws `atk.projectile` at its target (the bear, or another opponent it is quarrelling with).
  enemyShoot(e, atk, target) {
    const sy = e.y + e.def.height * 0.6;
    const tp = target === this.player
      ? { x: target.x, y: target.y + target.eye * 0.75, z: target.z }
      : { x: target.x, y: target.y + target.def.height * 0.5, z: target.z };
    const tx = tp.x - e.x, ty = tp.y - sy, tz = tp.z - e.z;
    const len = Math.hypot(tx, ty, tz) || 1;
    const s = (atk.spread || 0) * this.diff.spread;
    const fan = atk.count || 1;
    for (let i = 0; i < fan; i++) {
      const off = fan > 1 ? (i / (fan - 1) - 0.5) * s * 2 : 0;
      const yaw = Math.atan2(tx, tz) + off + rand(-s, s) * 0.5;
      const flat = Math.hypot(tx, tz) / len;
      const dir = { x: Math.sin(yaw) * flat, y: ty / len + rand(-s, s) * 0.5, z: Math.cos(yaw) * flat };
      this.spawnProjectile('enemy', atk.projectile, e.x + dir.x * (e.r + 0.3), sy, e.z + dir.z * (e.r + 0.3), dir, atk.speed * this.diff.projSpeed, {
        sleep: atk.sleep * this.diff.sleep, shooter: e, trap: atk.trap, homing: atk.homing, splash: atk.splash,
        size: e.def.boss ? 1.4 : undefined,
      });
    }
    play(e.def.sounds.shoot || 'throw');
  }

  // A melee opponent (Cinghialotto, the diving Papero) reaches the bear.
  enemyTouch(e, atk) {
    const p = this.player;
    if (!p.sleep.god) { play('hurt'); this.hud.hit('cuscino'); p.shakeT = 0.4; }
    this.addPlayerSleep(atk.sleep * this.diff.sleep);
    // pushed back a little: for a moment the bear's feet don't grip (see movePlayer)
    const dx = p.x - e.x, dz = p.z - e.z, l = Math.hypot(dx, dz) || 1;
    p.vx += (dx / l) * 6; p.vz += (dz / l) * 6; p.pushT = 0.3;
  }

  // ---------- the player's weapons ----------
  autoAim(yaw, pitch) {
    const best = this.aimTarget(yaw);
    if (!best) return { yaw, pitch };
    const autoPitch = Math.atan2(best.ey - (this.player.y + this.player.eye), best.dist);
    return { yaw: best.yaw, pitch: autoPitch };
  }

  // What the auto-aim would hit now: the nearest opponent or bursting bin almost in front and in sight, or null.
  aimTarget(yaw) {
    const p = this.player, eyeY = p.y + p.eye;
    let best = null;
    for (const e of this.enemies) {
      if (e.out) continue;
      const dx = e.x - p.x, dz = e.z - p.z, dist = Math.hypot(dx, dz);
      const d = Math.abs(angleDiff(Math.atan2(-dx, -dz), yaw));
      if (d > 0.2 || dist > 50) continue; // generous: there is no mouse, the aim is helped (as in DOOM)
      const ey = e.y + e.def.height * 0.55;
      if (!lineOfSight(this.level, p.x, eyeY, p.z, e.x, ey, e.z)) continue;
      if (!best || dist < best.dist) best = { e, dist, d, ey, yaw: Math.atan2(-dx, -dz) };
    }
    // bins that burst count too, if nearer (DOOM's auto-aim locks on barrels as well)
    for (const b of this.poppers) {
      if (b.popped) continue;
      const dx = b.x - p.x, dz = b.z - p.z, dist = Math.hypot(dx, dz);
      if (dist > 30 || Math.abs(angleDiff(Math.atan2(-dx, -dz), yaw)) > 0.2) continue;
      const ey = b.y + b.h * 0.5;
      if (!lineOfSight(this.level, p.x, eyeY, p.z, b.x, ey, b.z)) continue;
      if (!best || dist < best.dist) best = { e: b, dist, ey, yaw: Math.atan2(-dx, -dz) };
    }
    return best;
  }

  tryFire(dt) {
    const p = this.player, w = WEAPONS[p.weapon];
    if (p.cooldown > 0) return;
    if (w.ammo && !p.infinite && p.ammo[w.ammo] < w.cost) { this.autoSwitch(); return; }
    // the B.F.G. charges for a moment before firing (as in DOOM)
    if (w.charge) {
      if (p.charge === 0) { this.weaponView.fire(); play('charge'); }
      p.charge += dt;
      if (p.charge < w.charge) return;
      p.charge = 0;
    } else this.weaponView.fire();
    p.cooldown = w.cooldown;
    if (w.face) p.fireFaceT = 0.3;
    if (w.ammo && !p.infinite) p.ammo[w.ammo] -= w.cost;
    play(w.sound);
    // Shooting is noisy: opponents nearby wake up (as in DOOM).
    for (const e of this.enemies) if (Math.hypot(e.x - p.x, e.z - p.z) < 18) e.alert();

    if (w.melee) {
      let target = null, best = Infinity;
      for (const e of this.enemies) {
        if (e.out) continue;
        const dx = e.x - p.x, dz = e.z - p.z, dist = Math.hypot(dx, dz);
        if (dist > w.melee.range + e.r || Math.abs(angleDiff(Math.atan2(-dx, -dz), p.yaw)) > w.melee.cone) continue;
        if (Math.abs((e.y + e.def.height / 2) - (p.y + p.eye * 0.6)) > e.def.height / 2 + 1) continue; // too high (flying)
        if (dist < best) { best = dist; target = e; }
      }
      if (target) {
        const dx = target.x - p.x, dz = target.z - p.z, l = Math.hypot(dx, dz) || 1;
        target.hit(rand(...w.melee.damage), w.effect, { x: dx / l, z: dz / l }, p);
        play('splat');
      } else {
        // a paw on a bin bursts it too
        const bin = this.poppers.find(d => !d.popped && Math.hypot(d.x - p.x, d.z - p.z) < w.melee.range + d.r
          && Math.abs(angleDiff(Math.atan2(-(d.x - p.x), -(d.z - p.z)), p.yaw)) < w.melee.cone);
        if (bin) this.popDecor(bin);
      }
      return;
    }
    const pr = w.projectile, aim = this.autoAim(p.yaw, p.pitch);
    const ox = p.x - Math.sin(p.yaw) * 0.5, oz = p.z - Math.cos(p.yaw) * 0.5, oy = p.y + p.eye - 0.25 - p.sink;
    for (let i = 0; i < pr.count; i++) {
      const yaw = aim.yaw + rand(-pr.spread, pr.spread), pitch = aim.pitch + rand(-pr.spread, pr.spread) * 0.6;
      const dir = { x: -Math.sin(yaw) * Math.cos(pitch), y: Math.sin(pitch), z: -Math.cos(yaw) * Math.cos(pitch) };
      this.spawnProjectile('player', pr.kind, ox, oy, oz, dir, pr.speed * rand(0.95, 1.05), {
        damage: rand(...pr.damage), effect: w.effect, variant: i, ttl: pr.ttl, size: pr.size, splash: pr.splash,
      });
    }
  }

  autoSwitch() {
    const p = this.player;
    // like DOOM, never switch on its own to the weapons that could surprise you (B.F.G., cotton candy cannon)
    const order = [...p.weapons].filter(k => k !== 'bfg' && k !== 'zucchero').sort((a, b) => WEAPONS[b].slot - WEAPONS[a].slot);
    const next = order.find(k => !WEAPONS[k].ammo || p.infinite || p.ammo[WEAPONS[k].ammo] >= WEAPONS[k].cost) || 'zampata';
    if (next !== p.weapon) this.selectWeapon(next);
  }

  selectWeapon(k) {
    if (!this.player.weapons.includes(k)) return;
    this.player.weapon = k;
    this.player.charge = 0;
    this.player.cooldown = Math.max(this.player.cooldown, 0.2);
    this.weaponView.show(k, this.bear);
  }

  spawnProjectile(owner, kind, x, y, z, dir, speed, extra) {
    // metres covered by the 256 canvas (the drawing fills ~40% of it)
    const size = extra.size ?? (kind === 'camomilla' || kind === 'schiuma' ? 1.4 : kind === 'biberon' ? 1.6 : 0.85);
    const bb = new Billboard(this.scene, { width: size, height: size, foot: 0.5 });
    const variant = kind === 'confetti' ? (extra.variant || 0) % 5 : 0;
    // Two flight frames when drawn (projectiles/<kind>/fly_f_1, fly_f_2); placeholders vary the confetti colour.
    const frames = [1, 2].map(f => svgTexture(`projectiles/${kind}/fly_f_${f}${hasAsset(`projectiles/${kind}/fly_f_${f}`) || kind !== 'confetti' ? '' : `~${variant}`}`, () => projectileSprite(kind, variant + f - 1), PROJECTILE_CANVAS, PROJECTILE_CANVAS));
    bb.texture = frames[0];
    this.projectiles.push({ owner, kind, x, y, z, vx: dir.x * speed, vy: dir.y * speed, vz: dir.z * speed, speed, bb, frames, age: 0, ...extra, ttl: extra.ttl ?? 3 });
  }

  splat(x, y, z, kind, big = false) {
    const s = big ? 4 : 1.3;
    const bb = new Billboard(this.scene, { width: s, height: s, foot: 0.5 });
    bb.texture = svgTexture(`projectiles/${kind}/splat_f_1`, () => splatOf(kind, SPLAT_COLORS[kind] || '#fff'), PROJECTILE_CANVAS, PROJECTILE_CANVAS);
    this.splats.push({ bb, x, y, z, t: big ? 0.5 : 0.25 });
  }

  // Area knock-out where a cotton-candy cloud, a gumball or a milk bottle lands.
  explode(pr, x, y, z) {
    const sp = pr.splash;
    this.splat(x, y, z, pr.kind, sp.radius > 2);
    play(pr.kind === 'gumball' ? 'bfg' : 'whump');
    if (pr.owner === 'player') {
      for (const e of this.enemies) {
        if (e.out) continue;
        const d = Math.hypot(e.x - x, e.z - z, (e.y + e.def.height / 2) - y);
        if (d > sp.radius + e.r) continue;
        if (!lineOfSight(this.level, x, y, z, e.x, e.y + e.def.height / 2, e.z)) continue;
        const k = 1 - Math.min(1, d / (sp.radius + e.r));
        e.hit(rand(...sp.damage) * (0.4 + 0.6 * k), pr.effect, { x: (e.x - x) / (d || 1), z: (e.z - z) / (d || 1) }, this.player);
      }
      for (const b of this.poppers) if (!b.popped && Math.hypot(b.x - x, b.z - z) < sp.radius + b.r) this.popDecor(b);
    } else {
      const p = this.player;
      const d = Math.hypot(p.x - x, p.z - z, p.y + 0.8 - y);
      if (d < sp.radius && lineOfSight(this.level, x, y, z, p.x, p.y + p.eye, p.z)) {
        if (!p.sleep.god) { this.hud.hit(pr.kind); p.shakeT = 0.5; }
        this.addPlayerSleep(sp.sleep * this.diff.sleep * (1 - d / sp.radius));
      }
    }
  }

  // A bin hit by the bear bursts into confetti (DOOM's barrels, the sweet way): it is gone, confetti fly all over,
  // opponents next to it get puffed-up cheeks and bins next to it burst too.
  popDecor(d) {
    if (d.popped) return;
    d.popped = true;
    d.bb.remove();
    const i = this.staticObstacles.indexOf(d.obstacle);
    if (i >= 0) this.staticObstacles.splice(i, 1);
    const y = d.y + d.h / 2;
    this.splat(d.x, y, d.z, 'confetti', true);
    play('pop'); play('confetti');
    for (let n = 0; n < 16; n++) {
      const a = Math.random() * Math.PI * 2, s = rand(2, 6), v = n % 5;
      const bb = new Billboard(this.scene, { width: 0.7, height: 0.7, foot: 0.5 });
      bb.texture = svgTexture(`projectiles/confetti/fly_f_${1 + (n % 2)}${hasAsset('projectiles/confetti/fly_f_1') ? '' : `~${v}`}`, () => projectileSprite('confetti', v), PROJECTILE_CANVAS, PROJECTILE_CANVAS);
      this.bits.push({ bb, x: d.x, y, z: d.z, vx: Math.cos(a) * s, vy: rand(3, 8), vz: Math.sin(a) * s, t: rand(0.9, 1.4) });
    }
    const { radius, damage } = d.pop;
    for (const e of this.enemies) {
      if (e.out) continue;
      const dist = Math.hypot(e.x - d.x, e.z - d.z);
      if (dist > radius + e.r) continue;
      e.hit(damage * (1 - 0.5 * Math.min(1, dist / radius)), 'guance', { x: (e.x - d.x) / (dist || 1), z: (e.z - d.z) / (dist || 1) }, this.player);
    }
    // a chain of bins, a moment later (like DOOM's barrels)
    for (const b of this.poppers) if (!b.popped && Math.hypot(b.x - d.x, b.z - d.z) < radius + b.r) setTimeout(() => { if (!this.disposed) this.popDecor(b); }, 180);
  }

  // B.F.G.: the opponent bursts into sweets (Claude Design's fx/esplosione frames, else a big candy splat).
  burst(e) {
    const bb = new Billboard(this.scene, { width: 3, height: 3, foot: 0.3 });
    const frames = [1, 2, 3].map(f => svgTexture(`fx/esplosione/burst_f_${f}`, () => splatSprite(['#ff2d8a', '#ffd400', '#28c2b4'][f - 1]), 512, 512));
    bb.texture = frames[0];
    this.fx.push({ bb, frames, x: e.x, y: e.y, z: e.z, t: 0 });
  }

  // The boss is asleep: the level says what opens (e.g. the gate to the exit), as when DOOM's barons fall.
  onBossDown() {
    this.hud.message('THE BIG PIG IS FAST ASLEEP! Go, go, go!');
    play('secret');
    if (this.levelDef.bossOpens) this.activate(this.levelDef.bossOpens);
  }

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

  hint(id, text) {
    if (this.warned.has(id)) return;
    this.warned.add(id);
    this.hud.message(text);
  }

  // A hint that can come back a few times (every 12 s at most, 3 times per level).
  tip(id, text) {
    const t = (this.tips ||= {})[id] ||= { n: 0, at: -99 };
    if (t.n >= 3 || this.time - t.at < 12) return;
    t.n++; t.at = this.time;
    this.hud.message(text);
  }

  // ---------- cheats ----------
  applyCheat(c) {
    const p = this.player;
    if (c.action === 'god') p.sleep.god = !p.sleep.god;
    if (c.action === 'infinite') p.infinite = !p.infinite;
    if (c.action === 'all' || c.action === 'weapons') {
      p.weapons = Object.keys(WEAPONS);
      p.backpack = true;
      for (const k of Object.keys(AMMO)) p.ammo[k] = this.ammoMax(k);
      if (c.action === 'all') for (const k of this.level.legend.keys || []) p.keys.add(k);
    }
    if (c.action === 'map') this.mapAll = !this.mapAll;
    if (c.action === 'bonus') this.callbacks.onUnlockBonus?.();
    if (c.action === 'level') { this.warpWait = true; this.hud.message('IDCLEV — now type the level number (1-9).'); play('cheat'); return; }
    const off = (c.action === 'god' && !p.sleep.god) || (c.action === 'infinite' && !p.infinite) || (c.action === 'map' && !this.mapAll);
    this.hud.message(off ? `${c.code} — OFF.` : c.msg);
    if (c.action === 'god' && !off) this.hud.popup('iddqd');
    play('cheat');
    this.hud.flash('pickup');
  }

  // ---------- triggers ----------
  activateCheckpoint(cp, silent = false) {
    this.checkpointIndex = cp.index;
    for (const c of this.checkpoints) c.bb.texture = svgTexture(c === cp ? 'items/checkpointOn' : 'items/checkpoint', () => itemSprite(c === cp ? 'checkpointOn' : 'checkpoint'), 256, 256);
    if (silent) return;
    this.hud.message('CHECKPOINT! If you fall asleep, you wake up here.');
    play('checkpoint');
    this.callbacks.save(this.snapshot());
  }

  tryPickup(it) {
    const p = this.player, def = ITEMS[it.id];
    if (!def) return;
    if (def.sleep) {
      if (p.sleep.value <= 0 && !def.always) return;
      addSleep(p.sleep, def.sleep);
    } else if (def.armor) {
      if (!addArmor(p.sleep, def.armor, def.cap)) return;
    } else if (def.weapon) {
      const isNew = !p.weapons.includes(def.weapon);
      if (isNew) p.weapons.push(def.weapon);
      p.ammo[def.ammo] = Math.min(this.ammoMax(def.ammo), p.ammo[def.ammo] + Math.round(def.amount * this.diff.ammo));
      if (isNew) { this.selectWeapon(def.weapon); p.grinT = 1.6; }
    } else if (def.ammo) {
      if (p.ammo[def.ammo] >= this.ammoMax(def.ammo)) return;
      p.ammo[def.ammo] = Math.min(this.ammoMax(def.ammo), p.ammo[def.ammo] + Math.round(def.amount * this.diff.ammo));
    } else if (def.backpack) {
      p.backpack = true;
      for (const k of Object.keys(AMMO)) p.ammo[k] = Math.min(this.ammoMax(k), p.ammo[k] + Math.round((AMMO[k].max / 10) * this.diff.ammo));
    } else if (def.boots) {
      p.boots = def.boots;
    } else if (def.map) {
      this.mapAll = true;
    }
    if (def.key) p.keys.add(def.key);
    this.hud.tag(...pickupTag(def, this.diff.ammo));
    it.taken = true;
    it.bb.remove();
    this.stats.items++;
    this.hud.message(def.msg);
    if (def.popup) this.hud.popup(def.popup);
    this.hud.flash('pickup');
    play(def.sound);
  }

  // Switches and floor triggers move every cell drawn with the given characters:
  // walls marked `mover` sink into the ground, floors with `to` rise or sink to that height, `:` doors open.
  activate(chars) {
    const set = new Set(chars);
    let any = false;
    for (const m of this.movers) if (set.has(m.cell.ch) && !m.moving && !m.cell.open) { m.moving = true; any = true; }
    for (const d of this.doors) if (set.has(d.cell.ch) && !d.moving && !d.cell.open) { d.moving = true; any = true; }
    for (const f of this.floors) {
      if (!set.has(f.cell.ch) || f.cell.moveTo === undefined || f.target !== undefined) continue;
      f.target = f.cell.moveTo; any = true;
    }
    if (any) play('door');
    return any;
  }

  checkTriggers(dt) {
    const p = this.player;
    const near = (o, d) => Math.hypot(o.x - p.x, o.z - p.z) < d;
    for (const it of this.items) {
      if (!it.taken && near(it, 1.1) && p.y > it.y - 0.4 && p.y < it.y + 1.6) this.tryPickup(it);
    }
    for (const cp of this.checkpoints) if (cp.index !== this.checkpointIndex && near(cp, 1.6)) this.activateCheckpoint(cp);
    for (const s of this.secretSpots) {
      if (!s.found && near(s, 1.2)) {
        s.found = true; this.stats.secrets++;
        this.hud.message('YOU FOUND A SECRET!'); this.hud.popup('secret'); play('secret'); this.hud.flash('pickup');
      }
    }
    this.deniedT -= dt;
    const touching = c => {
      const cc = cellCenter(c.cx, c.cz);
      return Math.abs(cc.x - p.x) < CELL / 2 + p.r + 0.3 && Math.abs(cc.z - p.z) < CELL / 2 + p.r + 0.3;
    };
    for (const d of this.doors) {
      if (d.moving || d.cell.open) continue;
      const c = cellCenter(d.cell.cx, d.cell.cz);
      if (Math.hypot(c.x - p.x, c.z - p.z) > CELL / 2 + 1.1) continue;
      const key = d.cell.door.key;
      if (!key || p.keys.has(key)) {
        // open the whole door (all the door cells of the same kind touching this one)
        for (const o of this.doors) if (o.cell.ch === d.cell.ch && Math.hypot(o.cell.cx - d.cell.cx, o.cell.cz - d.cell.cz) < 3.5) o.moving = true;
        if (key) this.hud.message(`The ${KEYS[key]?.name || 'key'} opens the door!`);
        play('door');
      } else if (this.deniedT <= 0) {
        this.deniedT = 2.5;
        this.hud.message(`You need the ${KEYS[key]?.name || key} to open this door!`); play('denied');
      }
    }
    for (const s of this.secretWalls) {
      if (s.moving || s.cell.open) continue;
      if (touching(s.cell)) { s.moving = true; play('door'); }
    }
    for (const sw of this.switches) {
      if (sw.on || !touching(sw.cell)) continue;
      sw.on = true;
      sw.mesh.material.map = sw.onTex; sw.mesh.material.needsUpdate = true;
      play('switch');
      if (this.activate(sw.cell.sw)) this.hud.message('CLICK! Something moved...');
    }
    // floor triggers: walking onto them fires once
    const here = cellAtWorld(this.level, p.x, p.z);
    if (here?.trigger && !here.fired) { here.fired = true; this.activate(here.trigger); }
    // training: the instruction of this zone, once
    if (here?.say && !(this.said ||= new Set()).has(here.ch)) {
      this.said.add(here.ch);
      this.hud.instruct(typeof here.say === 'string' ? here.say : here.say[this.mode] || here.say.solo);
      play('pickup');
    }
    for (const ex of this.exits) if (!ex.on && near(ex, 1.4)) this.win(ex);
  }

  animateMovers(dt) {
    for (const d of this.doors) if (d.moving && d.t < 1) {
      d.t = Math.min(1, d.t + dt);
      // the door starts below the floor (walls do): it rises until its bottom edge is near the top of the opening
      d.mesh.position.y = d.y0 + (d.height - d.base - 0.3) * d.t;
      if (d.t > 0.7) d.cell.open = true;
    }
    for (const s of [...this.secretWalls, ...this.movers]) if (s.moving && s.t < 1) {
      s.t = Math.min(1, s.t + dt * 0.9);
      s.mesh.position.y = s.y0 - (s.height - s.base + 0.3) * s.t;
      if (s.t > 0.5) s.cell.open = true;
      if (s.t >= 1) s.mesh.visible = false;
    }
    // switch floors: towards their target
    for (const f of this.floors) {
      if (f.target === undefined) continue;
      this.moveFloor(f, f.target, dt * 1.6);
    }
    // lifts: down when the bear comes near from below, back up after a moment with the bear on it
    const p = this.player;
    for (const f of this.floors) {
      const lift = f.cell.lift;
      if (!lift) continue;
      const c = cellCenter(f.cell.cx, f.cell.cz);
      const d = Math.hypot(c.x - p.x, c.z - p.z);
      if (d < CELL * 2.5 && p.y < lift.high - 0.5) this.hint('lift', 'A LIFT! Step on the striped floor and wait: it takes you up.');
      const on = d < CELL * 0.75 && p.y >= f.cell.h - 0.1;
      f.wait = on ? (f.wait || 0) + dt : 0;
      let target = lift.high;
      if (d < CELL * 2.2 && p.y < lift.high - 0.5 && !on) target = lift.low;
      if (on && f.cell.h < lift.high - 0.01 && f.wait < 0.7) target = f.cell.h; // hop on, then up
      if (Math.abs(target - f.cell.h) > 0.001 && !f.moving) play('lift');
      f.moving = Math.abs(target - f.cell.h) > 0.001;
      this.moveFloor(f, target, dt * 2.4);
    }
  }

  moveFloor(f, target, step) {
    const c = f.cell, before = c.h;
    if (before === target) return; // standing still: nothing to carry (and the bear must be free to jump off)
    c.h = before < target ? Math.min(target, before + step) : Math.max(target, before - step);
    f.mesh.position.y = c.h - 7;
    // carry whoever stands on it (not someone jumping off it)
    const carry = b => {
      const cc = cellAtWorld(this.level, b.x, b.z);
      if (cc === c && !(b.vy > 0) && Math.abs(b.y - before) < 0.15) b.y = c.h;
    };
    carry(this.player);
    for (const e of this.enemies) if (!e.def.fly) carry(e);
  }

  win(ex) {
    if (this.paused) return; // already asleep (or leaving) in this same frame
    ex.on = true;
    ex.bb.texture = this.exitTexture(ex);
    this.paused = true;
    this.stats.time = this.time;
    play('exit');
    const next = ex.secret ? this.levelDef.secretNext : this.levelDef.next;
    this.callbacks.save({ ...this.snapshot(), checkpoint: -1, done: true, next });
    setTimeout(() => this.callbacks.onWin(this.stats, { secret: !!ex.secret, next, carry: this.snapshot() }), 900);
  }

  // ---------- per frame ----------
  handleEvents() {
    for (const ev of this.input.takeEvents()) {
      if (ev.code === 'Escape' || ev.code === 'KeyP') { this.callbacks.onPause(); return; }
      if (ev.code === 'KeyM') this.callbacks.onToggleMusic();
      const m = /^Digit([1-9])$/.exec(ev.code);
      if (m && this.warpWait) { this.warpWait = false; this.paused = true; this.callbacks.onWarp?.(+m[1] - 1); return; }
      if (m) { const k = weaponBySlot(+m[1]); if (k) this.selectWeapon(k); }
      const cheat = this.cheats.feed(ev.key);
      if (cheat) this.applyCheat(cheat);
      // Q/E change weapon, except while a code is being typed (IDDQD, ZUCCHERONE…)
      else if ((ev.code === 'KeyQ' || ev.code === 'KeyE') && !this.cheats.typing()) this.cycleWeapon(ev.code === 'KeyE' ? 1 : -1);
      // wriggling free
      if (this.player.trapT > 0 && /^Arrow|^Key[ADWS]$/.test(ev.code)) this.player.trapT -= 0.12;
    }
  }

  cycleWeapon(dir) {
    const owned = [...this.player.weapons].sort((a, b) => WEAPONS[a].slot - WEAPONS[b].slot);
    const i = owned.indexOf(this.player.weapon);
    this.selectWeapon(owned[(i + dir + owned.length) % owned.length]);
  }

  movePlayer(dt) {
    const p = this.player, input = this.input;
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
    const floor = floorUnder(this.level, p.x, p.z, p.r * 0.6);
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

  updateProjectiles(dt) {
    const p = this.player;
    for (const pr of this.projectiles) {
      pr.ttl -= dt; pr.age += dt;
      pr.bb.texture = pr.frames[Math.floor(pr.age * 10) % 2];
      // the lullaby notes slowly follow the bear
      if (pr.homing && pr.owner === 'enemy') {
        const tx = p.x - pr.x, ty = p.y + p.eye * 0.7 - pr.y, tz = p.z - pr.z, l = Math.hypot(tx, ty, tz) || 1;
        const k = Math.min(1, pr.homing * dt);
        pr.vx += (tx / l * pr.speed - pr.vx) * k; pr.vy += (ty / l * pr.speed - pr.vy) * k; pr.vz += (tz / l * pr.speed - pr.vz) * k;
      }
      pr.x += pr.vx * dt; pr.y += pr.vy * dt; pr.z += pr.vz * dt;
      const c = cellAtWorld(this.level, pr.x, pr.z);
      if (pr.ttl <= 0 || blocksSight(c, pr.y) || pr.y > 40) {
        pr.dead = true;
        const bx = pr.x - pr.vx * dt, by = Math.max(pr.y, c && !isSolid(c) ? c.h + 0.1 : 0), bz = pr.z - pr.vz * dt;
        if (pr.splash) this.explode(pr, bx, by, bz);
        else if (pr.ttl > 0) this.splat(bx, by, bz, pr.kind);
        continue;
      }
      // a bin in the way bursts into confetti
      if (pr.owner === 'player') {
        const bin = this.poppers.find(d => !d.popped && Math.hypot(d.x - pr.x, d.z - pr.z) < d.r + 0.25 && pr.y > d.y - 0.1 && pr.y < d.y + d.h + 0.2);
        if (bin) {
          pr.dead = true;
          if (pr.splash) this.explode(pr, pr.x, pr.y, pr.z);
          this.popDecor(bin);
          continue;
        }
      }
      // opponents: hit by the bear's sweets, or by another opponent's shot (then they quarrel, as in DOOM)
      for (const e of this.enemies) {
        if (e.out || e === pr.shooter) continue;
        if (Math.hypot(e.x - pr.x, e.z - pr.z) < e.r + 0.22 && pr.y > e.y && pr.y < e.y + e.def.height + 0.2) {
          const l = Math.hypot(pr.vx, pr.vz) || 1;
          if (pr.owner === 'player') e.hit(pr.damage, pr.effect, { x: pr.vx / l, z: pr.vz / l }, p);
          else e.hit(pr.sleep * 1.5, 'stordito', { x: pr.vx / l, z: pr.vz / l }, pr.shooter);
          pr.dead = true;
          if (pr.splash) this.explode(pr, pr.x, pr.y, pr.z); else this.splat(pr.x, pr.y, pr.z, pr.kind);
          break;
        }
      }
      if (pr.dead || pr.owner !== 'enemy') continue;
      if (Math.hypot(p.x - pr.x, p.z - pr.z) < p.r + 0.3 && pr.y > p.y - 0.1 && pr.y < p.y + p.eye + 0.3) {
        pr.dead = true;
        if (pr.splash) { this.explode(pr, pr.x, pr.y, pr.z); continue; }
        this.splat(pr.x, pr.y, pr.z, pr.kind);
        play('splat');
        if (!p.sleep.god) { play('hurt'); this.hud.hit(pr.kind); p.shakeT = 0.35; }
        this.addPlayerSleep(pr.sleep);
        if (pr.trap) this.trapPlayer(pr.trap, 'licorice');
      }
    }
    for (const pr of this.projectiles) if (pr.dead) pr.bb.remove();
    this.projectiles = this.projectiles.filter(pr => !pr.dead);
    for (const s of this.splats) s.t -= dt;
    for (const s of this.splats) if (s.t <= 0) s.bb.remove();
    this.splats = this.splats.filter(s => s.t > 0);
    for (const f of this.fx) {
      f.t += dt;
      f.bb.texture = f.frames[Math.min(2, Math.floor(f.t * 6))];
      if (f.t > 0.6) { f.bb.remove(); f.dead = true; }
    }
    this.fx = this.fx.filter(f => !f.dead);
    // confetti from a burst bin: they fly up and rain down
    for (const b of this.bits) {
      b.t -= dt; b.vy -= GRAVITY * 0.45 * dt;
      b.x += b.vx * dt; b.y += b.vy * dt; b.z += b.vz * dt;
      b.vx *= 1 - dt; b.vz *= 1 - dt;
      if (b.t <= 0) b.bb.remove();
    }
    this.bits = this.bits.filter(b => b.t > 0);
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
    p.cooldown -= dt; p.hurtT -= dt; p.grinT -= dt; p.fireFaceT -= dt; p.shakeT -= dt; p.pushT -= dt;
    this.weatherDt = (this.weatherDt || 0) + dt;
    if (this.input.firing) this.tryFire(dt); else p.charge = 0;
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
    for (const d of this.decor) if (!d.popped) { d.bb.light = lightAt(d.x, d.z); d.bb.place(d.x, d.y, d.z, p.yaw); }
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
    this.renderer.render(this.scene, cam);
    // the crosshair sits on the opponent the auto-aim has locked on (red), else in the middle
    const lock = !this.paused && this.aimTarget(p.yaw);
    if (lock) {
      const v = aimPoint.set(lock.e.x, lock.ey, lock.e.z).project(cam), el = this.renderer.domElement;
      this.hud.aim((v.x + 1) / 2 * el.clientWidth, (1 - v.y) / 2 * el.clientHeight);
    } else this.hud.aim(null);
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
