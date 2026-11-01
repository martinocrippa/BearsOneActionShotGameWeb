// A bonus room's trick (`trick` in a level's definition, data/tricks.js): the Topo, the props, the 3 tries, the
// prize. The rules are in src/core/trick.js. The game calls update() and render() every frame and asks:
// `holds` (the bear stands still at the spot, facing the target), `blocksFire` (SPACE belongs to the trick),
// `freeShots` (the joust's slingshot shots cost no candy); it is told press() (SPACE) and shot(pr) (a slingshot
// shot fired in the joust).
import { Billboard } from './world.js';
import { svgTexture } from '../art/registry.js';
import { topoSprite, trickSprite } from '../art/tricks.js';
import { projectileSprite } from '../art/sprites.js';
import { cellAtWorld } from '../core/physics.js';
import { cellCenter } from '../core/level.js';
import { needleAt, castZones, judgeCast, judgeKick, keeperAt, targetAt, roomCells, roomDoors } from '../core/trick.js';
import { TRICKS, TRICK_TRIES } from '../../data/tricks.js';
import { play } from '../audio.js';

const FOOT = 24 / 512; // characters and the carp: feet (or the water) on y=488 of the 512 canvas
const GOAL_HALF = 3; // metres from the middle of the goal to a post

export class Trick {
  constructor(game, def) {
    this.game = game;
    this.def = def;
    this.rules = TRICKS[def.id];
    const lv = game.level;
    this.room = roomCells(lv, def.x, def.z);
    this.doorCells = roomDoors(lv, this.room);
    const at = (x, z) => ({ ...cellCenter(x, z), y: lv.at(x, z)?.h ?? 0 });
    this.home = at(def.x, def.z);
    this.spot = def.spot ? at(def.spot.x, def.spot.z) : null;
    this.goal = def.target ? at(def.target.x, def.target.z) : this.home;
    this.state = 'idle'; // idle → met (talked) → play → show (a try's result) → won | lost
    this.tries = TRICK_TRIES;
    this.t = 0; this.anim = 0;
    this.pose = 'idle'; this.talkT = 0;
    this.topo = new Billboard(game.scene, { width: 2.2, height: 2.2, foot: FOOT });
    this.pos = { x: this.home.x, z: this.home.z };
    game.staticObstacles.push(this.obstacle = { x: this.home.x, z: this.home.z, r: 0.35 });
    if (this.spot) {
      this.mark = new Billboard(game.scene, { width: 0.6, height: 0.6, foot: 0.5 });
      this.mark.texture = svgTexture('trick/spot', () => trickSprite('spot'), 256, 256);
      // facing the target from the spot (yaw 0 = towards -z)
      this.faceYaw = Math.atan2(-(this.goal.x - this.spot.x), -(this.goal.z - this.spot.z));
    }
    if (this.rules.kind === 'target') {
      this.target = new Billboard(game.scene, { width: 1.3, height: 1.3, foot: 0.5 });
      this.shots = [];
    }
  }

  get kind() { return this.def.id; }
  // the bear stands at the spot, facing the target, while a timing trick is being played
  get holds() { return this.spot && (this.state === 'play' || this.state === 'show') ? { x: this.spot.x, z: this.spot.z, yaw: this.faceYaw } : null; }
  get blocksFire() {
    if (this.rules.kind === 'timing') return this.state === 'play' || this.state === 'show';
    return this.state === 'play' && (this.tries <= 0 || this.game.player.weapon !== 'fionda');
  }
  get freeShots() { return this.rules.kind === 'target' && this.state === 'play'; }
  // SPACE pressed (a key event, so a quick tap is never lost between two frames)
  press() { this.pressedNow = true; }

  say(line) {
    if (!line) return;
    this.game.hud.message(line);
    if (this.state !== 'won' && this.state !== 'lost') { this.pose = 'talk'; this.talkT = 2.2; }
  }

  // the door closes behind the bear (opponents stay out) while the trick is played; it opens again at the end
  lock(locked) {
    for (const d of this.game.doors) {
      if (!this.doorCells.includes(d.cell)) continue;
      d.cell.door.locked = locked;
      if (locked) { d.closing = true; d.moving = false; } else { d.closing = false; d.moving = true; }
    }
    play('door');
  }

  begin() {
    this.state = 'play';
    this.t = 0;
    this.lock(true);
    this.say(this.rules.say.start);
    const g = this.game;
    if (this.kind === 'fishing') { g.weaponView.show('canna', g.bear); this.zones = castZones(Math.random, this.rules); }
    if (this.kind === 'penalty') { g.weaponView.visible = false; this.dive = 0; this.ball = this.newBall(); }
    if (this.kind === 'joust') g.selectWeapon('fionda');
  }

  update(dt) {
    const g = this.game, p = g.player, r = this.rules;
    this.anim += dt; this.t += dt; this.talkT -= dt;
    const here = cellAtWorld(g.level, p.x, p.z);
    const inRoom = here && !here.door && this.room.has(here.cx + ',' + here.cz);
    if (this.state === 'idle' && inRoom) {
      this.state = 'met';
      this.say(r.say.hello);
      g.hud.instruct(r.howto[g.mode] || r.howto.solo);
      play('squeak');
      if (r.kind === 'target') this.begin();
    }
    if (this.state === 'met' && this.spot && Math.hypot(p.x - this.spot.x, p.z - this.spot.z) < 0.9) this.begin();
    const pressed = this.pressedNow;
    this.pressedNow = false;

    if (this.state === 'play' && r.kind === 'timing') {
      this.needle = needleAt(this.t, r.speed);
      if (pressed) this.tryTiming();
    }
    if (this.state === 'show') {
      this.showT -= dt;
      if (this.kind === 'penalty') this.moveBall(dt);
      if (this.showT <= 0) this.next();
    }
    if (r.kind === 'target' && this.state === 'play') {
      if (p.weapon !== 'fionda') g.selectWeapon('fionda');
      this.updateTarget();
    }
    this.hud();
  }

  // ---- timing tricks: SPACE stops the needle ----
  tryTiming() {
    const g = this.game, pos = this.needle;
    this.state = 'show';
    this.showT = 1.8;
    this.tries--;
    if (this.kind === 'fishing') {
      this.result = judgeCast(pos, this.zones);
      g.weaponView.fire();
      play('reel');
      if (this.result === 'miss') { g.splat(this.goal.x, this.goal.y + 0.2, this.goal.z, 'acqua'); play('splash'); }
      else this.carp = { gold: this.result === 'gold' };
    } else {
      // the keeper guesses a side (or stays), the ball flies where the needle pointed
      this.dive = [-1, 0, 1][Math.floor(Math.random() * 3)];
      this.result = judgeKick(pos, this.dive, this.rules);
      this.aim = pos;
      this.ball.fly = 0;
      play('kick');
    }
  }

  // after a try's result: win, lose, or the next try
  next() {
    const r = this.rules, g = this.game, won = this.result === 'gold' || this.result === 'goal';
    this.carp = null;
    if (won) return this.end(true);
    this.say(r.say[this.result]);
    if (this.tries <= 0) return this.end(false);
    this.state = 'play'; this.t = Math.random() * 2;
    if (this.kind === 'fishing') this.zones = castZones(Math.random, r);
    if (this.kind === 'penalty') { this.dive = 0; this.ball = this.newBall(); }
    g.hud.message(`${this.tries} ${this.tries === 1 ? 'TRY' : 'TRIES'} LEFT!`);
  }

  end(won) {
    const g = this.game, r = this.rules;
    this.state = won ? 'won' : 'lost';
    this.pose = won ? 'cheer' : 'sad';
    this.t = 0;
    this.lock(false);
    if (this.kind === 'fishing' || this.kind === 'penalty') {
      g.weaponView.visible = true;
      g.weaponView.refresh(g.player.weapon, g.bear);
    }
    this.ball?.bb.remove(); this.ball = null;
    if (won) {
      g.hud.message(r.say[this.kind === 'joust' ? 'hit' : this.result]);
      g.stats.tricks = 1;
      play('cheer');
      g.hud.flash('pickup');
      g.grantItem(this.def.prize);
    } else {
      g.hud.message(r.say.lost);
      play('aww');
    }
  }

  // ---- penalty: the ball on the spot, then flying to the goal ----
  newBall() {
    this.ball?.bb.remove();
    const bb = new Billboard(this.game.scene, { width: 0.9, height: 0.9, foot: 0.5 });
    const frames = [1, 2].map(f => svgTexture(`projectiles/pallone/fly_f_${f}`, () => projectileSprite('pallone', f - 1), 256, 256));
    bb.texture = frames[0];
    const dx = this.goal.x - this.spot.x, dz = this.goal.z - this.spot.z, l = Math.hypot(dx, dz) || 1;
    const from = { x: this.spot.x + (dx / l) * 1.1, z: this.spot.z + (dz / l) * 1.1 };
    return { bb, frames, from, x: from.x, z: from.z, y: this.spot.y + 0.2, fly: -1 };
  }
  moveBall(dt) {
    const b = this.ball;
    if (!b || b.fly < 0) return;
    b.fly = Math.min(1, b.fly + dt / 0.55);
    // the goal line, sideways by where the needle pointed (left post = 0, right post = 1)
    const yaw = this.faceYaw, rx = Math.cos(yaw), rz = -Math.sin(yaw);
    const side = (this.aim - 0.5) * 2 * GOAL_HALF * (this.result === 'post' ? 1.15 : 1);
    const to = { x: this.goal.x + rx * side, z: this.goal.z + rz * side };
    b.x = b.from.x + (to.x - b.from.x) * b.fly; b.z = b.from.z + (to.z - b.from.z) * b.fly;
    b.y = this.spot.y + 0.2 + Math.sin(b.fly * Math.PI) * 0.9;
    b.bb.texture = b.frames[Math.floor(this.anim * 10) % 2];
  }

  // ---- joust: the target goes round the pole; a slingshot shot that touches it wins ----
  shot(pr) {
    if (!this.freeShots || !pr) return;
    this.tries--;
    pr.trickShot = true;
    this.shots.push(pr);
  }
  updateTarget() {
    const r = this.rules, c = targetAt(this.t, this.goal.x, this.goal.z, r.radius, r.speed);
    this.tpos = { ...c, y: this.goal.y + r.height };
    for (const pr of this.shots) {
      if (pr.done) continue;
      if (Math.hypot(pr.x - c.x, pr.z - c.z) < r.size + 0.15 && Math.abs(pr.y - this.tpos.y) < r.size + 0.2) {
        pr.done = true; pr.dead = true;
        this.result = 'hit';
        play('pop');
        return this.end(true);
      }
      if (pr.dead) { pr.done = true; this.say(r.say.miss); }
    }
    if (this.tries <= 0 && this.shots.every(s => s.done)) this.end(false);
  }

  // the gauge and the cheese wedges (tries) at the bottom of the view
  hud() {
    const playing = this.state === 'play' || this.state === 'show';
    if (!playing) { if (this.shown) { this.game.hud.trick(null); this.shown = false; } return; }
    this.shown = true;
    const r = this.rules;
    this.game.hud.trick({
      tries: this.tries, of: TRICK_TRIES,
      gauge: r.kind !== 'timing' ? null
        : this.kind === 'fishing' ? { pos: this.needle ?? 0, gold: this.zones?.gold, green: this.zones?.green }
          : { pos: this.state === 'show' ? this.aim : this.needle ?? 0, posts: r.posts, keeper: this.state === 'show' ? keeperAt(this.dive) : null },
    });
  }

  render(yaw) {
    const g = this.game, light = x => cellAtWorld(g.level, x.x, x.z)?.light ?? 1;
    // the Topo: talks, cheers, sulks; the keeper crouches ready and dives
    let pose = this.pose, flip = false;
    if (pose === 'talk' && this.talkT <= 0) pose = this.pose = 'idle';
    let tx = this.home.x, tz = this.home.z;
    if (this.kind === 'penalty' && (this.state === 'play' || this.state === 'show')) {
      pose = 'ready';
      if (this.state === 'show' && this.dive) {
        pose = 'dive'; flip = this.dive > 0; // drawn diving to its right (the kicker's left): mirrored for the other side
        const k = Math.min(1, (1.8 - this.showT) / 0.4), fy = this.faceYaw;
        tx += Math.cos(fy) * this.dive * 1.6 * k; tz += -Math.sin(fy) * this.dive * 1.6 * k;
      }
    }
    const frames = { idle: 2, talk: 2, cheer: 2 }[pose] || 1;
    const f = 1 + (Math.floor(this.anim * (pose === 'idle' ? 1.5 : 5)) % frames);
    this.topo.texture = svgTexture(`topi/${this.def.topo}/${pose}_f_${f}`, () => topoSprite(this.def.topo, pose, f), 512, 512);
    this.topo.flip = flip;
    this.topo.light = light(this.home);
    this.topo.place(tx, this.home.y, tz, yaw);
    if (this.mark) {
      this.mark.mesh.visible = this.state === 'idle' || this.state === 'met';
      this.mark.place(this.spot.x, this.spot.y + 0.35 + Math.sin(this.anim * 3) * 0.08, this.spot.z, yaw);
    }
    if (this.carp) {
      // the carp jumps out of the water and back
      const k = Math.min(1, (1.8 - this.showT) / 1.2), name = this.carp.gold ? 'carpa_oro' : 'carpa';
      this.carpBb ||= new Billboard(g.scene, { width: 2, height: 2, foot: FOOT });
      const cf = 1 + (Math.floor(this.anim * 6) % 2);
      this.carpBb.texture = svgTexture(`trick/${name}/jump_f_${cf}`, () => trickSprite(name, 'jump', cf), 512, 512);
      this.carpBb.mesh.visible = k < 1;
      this.carpBb.place(this.goal.x, this.goal.y + Math.sin(k * Math.PI) * 1.4 - 0.3, this.goal.z, yaw);
    } else if (this.carpBb) this.carpBb.mesh.visible = false;
    if (this.ball) this.ball.bb.place(this.ball.x, this.ball.y, this.ball.z, yaw);
    if (this.target) {
      const done = this.state === 'won' || this.state === 'lost';
      this.target.mesh.visible = this.state !== 'idle';
      if (!this.tpos) this.tpos = { ...targetAt(0, this.goal.x, this.goal.z, this.rules.radius, this.rules.speed), y: this.goal.y + this.rules.height };
      const hit = this.state === 'won';
      const sf = 1 + (Math.floor(this.anim * 6) % 3);
      this.target.texture = hit
        ? svgTexture('trick/bersaglio/hit_f_1', () => trickSprite('bersaglio', 'hit'), 256, 256)
        : svgTexture(`trick/bersaglio/spin_f_${done ? 1 : sf}`, () => trickSprite('bersaglio', 'spin', done ? 1 : sf), 256, 256);
      this.target.place(this.tpos.x, this.tpos.y, this.tpos.z, yaw);
    }
  }
}
