// Opponents: DOOM-style behaviour (wake up on sight or noise, chase, wind up, shoot, flinch, quarrel).
// They are never knocked out for real: at zero "energy" they get the comic effect of the last weapon.
// Everything specific (fan of shots, bursts, charging, flying, diving, two attacks) comes from data/enemies.js.
import { ENEMIES, EFFECTS } from '../../data/enemies.js';
import { lineOfSight, slide, floorUnder, cellAtWorld } from '../core/physics.js';
import { Billboard } from './world.js';
import { svgTexture, frameKey, hasAsset } from '../art/registry.js';
import { enemySprite, wordSprite, overlaySprite } from '../art/sprites.js';

const SPRITE_SIZE = 2.2; // metres covered by the 512 px canvas (the small bear, 300 px, is 1.3 m)
const FOOT = 24 / 512;
const FLY_FOOT = 42 / 512; // flyers in the air: their dangling feet are at y≈470, not 488
const VIEWS = ['f', 'fq', 's', 'bq', 'b'];
const rand = (a, b) => a + Math.random() * (b - a);
// An opponent Claude Design has drawn, but not yet in this pose: show its closest drawn pose (+ an overlay), so it
// still looks like itself instead of a coded stand-in.
const POSE_FALLBACK = { legato: { pose: 'panciaPiena', overlay: 'lacci' }, defeat: { pose: 'pain' } };

export class Enemy {
  constructor(game, ent) {
    this.game = game;
    this.kind = ent.id;
    this.def = ENEMIES[ent.id];
    this.x = ent.x; this.z = ent.z;
    this.floor = ent.y;
    this.fly = this.def.fly || 0;
    this.y = ent.y + this.fly;
    this.r = this.def.radius;
    this.tall = this.def.height;
    this.hp = this.def.hp;
    this.yaw = Math.random() * Math.PI * 2; // facing direction (radians, 0 = towards -z)
    this.state = 'idle';
    this.t = 0; this.cool = rand(0.5, 1.5); this.anim = Math.random(); this.zig = Math.random() * 6;
    this.effect = null; this.shotFlash = 0; this.push = null; this.burstLeft = 0; this.useAlt = false;
    this.target = null; // another opponent it is quarrelling with
    this.base = `enemies/${this.kind}`;
    this.canvas = this.def.canvas || 512;
    this.walkName = this.fly ? 'fly' : 'walk';
    this.frames = hasAsset(`${this.base}/${this.walkName}_f_4`) ? 4 : 2;
    const size = this.def.scale || SPRITE_SIZE;
    this.sprite = new Billboard(game.scene, { width: size, height: size, foot: FOOT });
    // training: a cardboard cut-out on a wooden stand; it never moves or shoots, and gets back up after a while
    this.dummy = !!game.levelDef.training;
    if (this.dummy) {
      this.hp = Math.min(this.hp, 30);
      this.stand = new Billboard(game.scene, { width: size, height: size, foot: FOOT });
      this.stand.texture = svgTexture('fx/sagoma/stand_f_1', () => overlaySprite('sagoma'), 512, 512);
    }
    this.overlay = null;
    this.word = null;
  }

  get out() { return this.state === 'out'; }

  texture(state, view, frame, effect = null) {
    const name = effect || state;
    const { key, real } = frameKey(this.base, name, view, frame);
    // 'pain' used as a knock-out pose is the pain drawing, not an effect
    const [st, ef] = effect === 'pain' ? ['pain', null] : [state, effect];
    return { tex: svgTexture(key, () => enemySprite(this.kind, st, frame, ef), this.canvas, this.canvas), real };
  }

  alert() {
    if (this.state !== 'idle' || this.dummy) return;
    this.state = 'chase';
    this.game.sound(this.def.sounds.alert, this);
  }

  // `by` = who hit it: the bear, or another opponent (then they quarrel, unless they are the same kind).
  // `pain` = the weapon's flinch factor (data/weapons.js).
  hit(damage, effect, dir, by, pain = 1) {
    if (this.out) return;
    this.alert();
    if (by && by !== this.game.player && by.kind !== this.kind && !by.out) this.target = by;
    this.hp -= damage;
    if (this.hp <= 0) return this.knockOut(effect, dir);
    if (Math.random() < this.def.painChance * pain) { this.state = 'pain'; this.t = 0.28; this.game.sound(this.def.sounds.pain, this); }
  }

  knockOut(effect, dir) {
    this.state = 'out';
    // the boss sits down with the dummy whatever weapon it was (its own drawing: defeat_f_1..3)
    this.effect = this.def.boss ? 'defeat' : effect;
    const fx = EFFECTS[effect] || EFFECTS.stordito;
    let pose = this.def.boss ? 'defeat' : fx.pose, overlay = this.def.boss ? null : fx.overlay;
    const fb = POSE_FALLBACK[pose];
    if (fb && !hasAsset(`${this.base}/${pose}_f_1`) && hasAsset(`${this.base}/${fb.pose}_f_1`)) { pose = fb.pose; overlay = overlay || fb.overlay; }
    this.outPose = pose;
    this.outFrames = pose === 'defeat' ? 3 : pose === fx.pose ? fx.frames || 1 : 1;
    this.anim = 0;
    if (this.fly && !fx.float) this.falling = true; // knocked-out birds drop to the ground
    if (effect === 'stordito' && dir) this.push = { x: dir.x * 5, z: dir.z * 5, t: 0.35 };
    this.game.onKnockOut(this);
    this.game.sound(fx.sound === 'knock' ? this.def.sounds.knock : fx.sound, this);
    this.word = new Billboard(this.game.scene, { width: 1.6, height: 0.8 });
    const wordText = this.def.boss ? 'ZZZ...' : fx.word;
    this.word.texture = svgTexture(`fx/word_${wordText.replace(/[^A-Z]/g, '') || effect}`, () => wordSprite(wordText), 256, 128);
    this.wordT = 1.6;
    if (overlay) {
      const size = this.def.scale || SPRITE_SIZE;
      this.overlay = new Billboard(this.game.scene, { width: size, height: size, foot: FOOT });
      this.overlayFrames = [1, 2].slice(0, overlay === fx.overlay ? fx.overlayFrames || 1 : 1).map(f => svgTexture(`fx/${overlay}/overlay_f_${f}`, () => overlaySprite(overlay, f), 512, 512));
    }
    if (fx.vanish && !this.def.boss) this.game.burst?.(this);
    if (this.def.boss) this.game.onBossDown?.(this);
  }

  // Who it is after: the opponent it quarrels with while that one is still up, else the bear.
  get foe() {
    if (this.target && this.target.out) this.target = null;
    return this.target || this.game.player;
  }

  update(dt) {
    const g = this.game;
    this.anim += dt;
    if (this.dummy) return this.updateDummy(dt);
    if (this.out) return this.updateOut(dt);
    const foe = this.foe, isBear = foe === g.player;
    const fx = foe.x - this.x, fz = foe.z - this.z;
    const dist = Math.hypot(fx, fz);
    const eye = this.y + this.def.height * 0.8;
    const foeEye = isBear ? foe.y + foe.eye : foe.y + foe.def.height * 0.7;
    const sees = dist < this.def.sight * (isBear ? 1 : 1.5) && lineOfSight(g.level, this.x, eye, this.z, foe.x, foeEye, foe.z);
    this.cool -= dt;
    this.shotFlash -= dt;

    if (this.state === 'idle') {
      if (sees && isBear) this.alert();
      return;
    }
    if (this.state === 'pain') {
      this.t -= dt;
      if (this.t <= 0) this.state = 'chase';
      return;
    }
    if (this.state === 'dive') return this.updateDive(dt);
    if (this.state === 'windup') {
      this.yaw = Math.atan2(-fx, -fz);
      this.t -= dt;
      if (this.t <= 0) this.attack(sees, foe, dist);
      return;
    }
    // chase
    const atk = this.useAlt && this.def.alt ? this.def.alt : this.def.attack;
    if (sees && this.cool <= 0 && dist < atk.range && !g.paused) {
      this.state = 'windup'; this.t = atk.windup;
      return;
    }
    if (dist > (this.def.attack.melee ? 1.2 : 2.2)) this.walk(dt, foe, fx, fz, sees);
    else this.turnTo(Math.atan2(-fx, -fz), dt);
  }

  attack(sees, foe, dist) {
    const g = this.game;
    const atk = this.useAlt && this.def.alt ? this.def.alt : this.def.attack;
    this.state = 'chase';
    this.cool = rand(...atk.cooldown) * g.diff.fireRate;
    if (this.def.alt) this.useAlt = !this.useAlt;
    if (atk.melee) {
      // the Cinghialotto swings its pillow only if it really got there
      if (dist < atk.range + this.r) {
        this.shotFlash = 0.25;
        g.sound(this.def.sounds.shoot, this);
        if (foe === g.player) g.enemyTouch(this, atk); else foe.hit(atk.sleep * 2, 'stordito', null, this);
      }
      return;
    }
    if (atk.dive) {
      // the Papero dives straight at its foe
      this.state = 'dive'; this.t = 1.6;
      const dy = (foe === g.player ? foe.y + foe.eye * 0.6 : foe.y + foe.def.height / 2) - (this.y + this.def.height / 2);
      const l = Math.hypot(foe.x - this.x, dy, foe.z - this.z) || 1;
      this.dv = { x: (foe.x - this.x) / l * atk.speed, y: dy / l * atk.speed, z: (foe.z - this.z) / l * atk.speed };
      g.sound(this.def.sounds.shoot, this);
      return;
    }
    if (!sees) return;
    this.shotFlash = 0.18;
    g.enemyShoot(this, atk, foe);
    // bursts: the Volpe's broccoli gun, the Maiale's three bottles
    if (atk.burst > 1) {
      let left = atk.burst - 1;
      const next = () => {
        if (this.out || g.paused || left-- <= 0) return;
        this.shotFlash = 0.12;
        g.enemyShoot(this, atk, this.foe);
        setTimeout(next, 140);
      };
      setTimeout(next, 140);
    }
  }

  updateDive(dt) {
    const g = this.game, p = g.player;
    this.t -= dt;
    const r = slide(g.level, this, this.dv.x * dt, this.dv.z * dt, []);
    this.y = Math.max(this.floor + 0.3, this.y + this.dv.y * dt);
    const bumped = r.blockedX || r.blockedZ;
    this.x = r.x; this.z = r.z;
    this.yaw = Math.atan2(-this.dv.x, -this.dv.z);
    const foe = this.foe;
    const fy = foe === p ? p.y + p.eye * 0.6 : foe.y + foe.def.height / 2;
    if (Math.hypot(foe.x - this.x, foe.z - this.z) < this.r + (foe.r || 0.35) + 0.2 && Math.abs(fy - (this.y + this.def.height / 2)) < 1) {
      if (foe === p) g.enemyTouch(this, this.def.attack); else foe.hit(this.def.attack.sleep * 2, 'stordito', null, this);
      this.endDive();
      return;
    }
    if (bumped || this.t <= 0) this.endDive();
  }

  endDive() {
    this.state = 'chase';
    this.cool = rand(...this.def.attack.cooldown) * this.game.diff.fireRate;
  }

  // Turns towards `ang` at a natural speed (never snapping round, so it does not look like spinning).
  turnTo(ang, dt, rate = 7) {
    const d = Math.atan2(Math.sin(ang - this.yaw), Math.cos(ang - this.yaw));
    this.yaw += Math.sign(d) * Math.min(Math.abs(d), rate * dt);
  }

  // Straight at its foe while it sees it; otherwise (or after bumping into something) along the way round the walls
  // (game.wayToBear). Stuck against something (another opponent, a tree): a short sidestep, always to the same side
  // until it gets moving again. Too far, or no way at all: it waits, looking towards the bear.
  walk(dt, foe, fx, fz, sees) {
    const g = this.game, direct = Math.atan2(-fx, -fz);
    if (sees || foe !== g.player) this.roundT = Math.max(0, (this.roundT || 0) - dt);
    let ang = direct;
    if (foe === g.player && (!sees || this.roundT > 0)) {
      const to = g.wayToBear(this);
      if (!to) { this.turnTo(direct, dt, 3); return; }
      ang = Math.atan2(-(to.x - this.x), -(to.z - this.z));
    } else if (this.def.zigzag) ang += Math.sin(this.anim * 3 + this.zig) * 0.9;
    if (this.detour > 0) { this.detour -= dt; ang = this.detourAng; }
    const sp = this.def.speed * dt;
    const before = { x: this.x, z: this.z };
    const r = slide(g.level, this, -Math.sin(ang) * sp, -Math.cos(ang) * sp, g.obstaclesFor(this));
    this.x = r.x; this.z = r.z;
    const mx = this.x - before.x, mz = this.z - before.z, moved = Math.hypot(mx, mz);
    // it faces where it really goes
    if (moved > sp * 0.3) { this.turnTo(Math.atan2(-mx, -mz), dt); this.stuck = 0; }
    else {
      this.roundT = 2; // walking straight did not work: go round the walls for a while
      this.stuck = (this.stuck || 0) + 1;
      if (this.stuck > 1 && !(this.detour > 0)) {
        if (this.stuck > 6) { this.side = -(this.side || 1); this.stuck = 0; } // that side did not work either
        this.side ||= Math.random() < 0.5 ? 1 : -1;
        this.detour = rand(0.3, 0.6);
        this.detourAng = ang + this.side * rand(0.9, 1.5);
      }
    }
    this.floor = floorUnder(g.level, this.x, this.z, this.r * 0.5);
    if (this.fly) {
      // flyers keep their height over the floor, bobbing a little
      const want = this.floor + this.fly + Math.sin(this.anim * 2 + this.zig) * 0.25;
      this.y += (want - this.y) * Math.min(1, dt * 2);
    } else this.y = this.floor;
  }

  updateOut(dt) {
    const g = this.game;
    const fx = EFFECTS[this.effect];
    if (this.push && this.push.t > 0) {
      this.push.t -= dt;
      const r = slide(g.level, this, this.push.x * dt, this.push.z * dt, g.obstacles);
      this.x = r.x; this.z = r.z;
    }
    if (this.falling) {
      this.floor = floorUnder(g.level, this.x, this.z, this.r * 0.5);
      this.y = Math.max(this.floor, this.y - 9 * dt);
      if (this.y <= this.floor) this.falling = false;
    }
    // angel: rises to the sky, fading away
    if (fx?.float) {
      this.y += 1.6 * dt;
      const a = Math.max(0, 1 - this.anim / 3);
      this.sprite.material.opacity = a * 0.6; this.sprite.material.alphaTest = 0.05;
      if (this.overlay) { this.overlay.material.opacity = a; this.overlay.material.alphaTest = 0.05; }
      if (a <= 0) this.hide();
    }
    if (fx?.vanish && !this.def.boss && this.anim > 0.15) this.hide();
    if (this.word) {
      this.wordT -= dt;
      if (this.wordT <= 0) { this.word.remove(); this.word = null; }
    }
  }

  // A cut-out: flinches when hit, shows the weapon's effect when knocked out, then stands up again.
  updateDummy(dt) {
    if (this.state === 'pain') { this.t -= dt; if (this.t <= 0) this.state = 'idle'; return; }
    if (!this.out) return;
    this.updateOut(dt);
    if (this.anim < 3.5) return;
    this.state = 'idle'; this.hp = Math.min(this.def.hp, 30); this.effect = null; this.gone = false; this.falling = false;
    this.y = this.floor + (this.fly || 0);
    this.sprite.mesh.visible = true; this.sprite.material.opacity = 1; this.sprite.material.alphaTest = 0.35;
    this.overlay?.remove(); this.overlay = null;
    this.word?.remove(); this.word = null;
    this.game.sound('pop', this);
  }

  hide() { this.sprite.mesh.visible = false; if (this.overlay) this.overlay.mesh.visible = false; this.gone = true; }

  // Picks frame and view for the camera, like DOOM's 8 rotations (front view only until drawn).
  render(camYaw) {
    if (this.gone) { this.word?.place(this.x, this.y + 2.1 + (1.6 - this.wordT) * 0.4, this.z, camYaw); return; }
    const p = this.game.player;
    let frame = 1, state = 'idle', effect = null;
    if (this.out) {
      effect = this.outPose;
      state = 'idle';
      const n = this.outFrames;
      frame = effect === 'defeat' ? Math.min(3, 1 + Math.floor(this.anim * 1.5)) : (Math.floor(this.anim * 6) % n) + 1;
    } else if (this.state === 'pain') state = 'pain';
    else if (this.state === 'windup' || this.state === 'dive' || this.shotFlash > 0) { state = 'attack'; frame = this.shotFlash > 0 || this.state === 'dive' ? 2 : 1; }
    else if (this.state === 'chase') { state = this.walkName; frame = (Math.floor(this.anim * 7) % this.frames) + 1; }
    else if (this.fly) { state = 'fly'; frame = (Math.floor(this.anim * 5) % 2) + 1; }

    // Angle between where the opponent faces and where the camera is → one of 8 sectors.
    const toCam = Math.atan2(-(p.x - this.x), -(p.z - this.z));
    let rel = ((toCam - this.yaw) / (Math.PI / 4)) % 8;
    if (rel < 0) rel += 8;
    const sector = Math.round(rel) % 8; // 0 front, 4 back
    const viewIdx = sector <= 4 ? sector : 8 - sector;
    const { tex, real } = this.texture(state, effect ? 'f' : VIEWS[viewIdx], frame, effect);
    this.sprite.texture = tex;
    // Side and three-quarter drawings face screen-right; seen from the opponent's left (sectors 1-3) they are mirrored.
    this.sprite.flip = real && sector > 0 && sector < 4;
    this.sprite.light = cellAtWorld(this.game.level, this.x, this.z)?.light ?? 1;
    this.sprite.foot = this.fly && !effect ? FLY_FOOT : FOOT; // knocked-out flyers lie on the ground at 488
    this.sprite.place(this.x, this.y, this.z, camYaw);
    if (this.overlay) {
      this.overlay.texture = this.overlayFrames[Math.floor(this.anim * 5) % this.overlayFrames.length];
      this.overlay.place(this.x, this.y, this.z, camYaw);
    }
    if (this.word) this.word.place(this.x, this.y + this.def.height + 0.9 + (1.6 - this.wordT) * 0.4, this.z, camYaw);
    if (this.stand) { this.stand.mesh.visible = !this.out; this.stand.place(this.x, this.floor, this.z, camYaw); }
  }

  dispose() { this.sprite.remove(); this.word?.remove(); this.overlay?.remove(); this.stand?.remove(); }
}
