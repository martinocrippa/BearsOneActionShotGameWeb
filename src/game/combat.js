// Game methods: the fight. Opponents finding their way and shooting, aiming and firing, weapons, projectiles,
// splats and explosions. Plain methods on `this`, attached to Game.prototype in game.js; moved here unchanged.
import { CELL, cellCenter } from '../core/level.js';
import { pathField, nextStep, stepsAt } from '../core/paths.js';
import { cellAtWorld, isSolid, blocksSight, lineOfSight, GRAVITY } from '../core/physics.js';
import { WEAPONS } from '../../data/weapons.js';
import { Billboard } from './world.js';
import { svgTexture, hasAsset } from '../art/registry.js';
import { projectileSprite, splatSprite, splatOf, SPLAT_COLORS } from '../art/sprites.js';
import { play } from '../audio.js';
import { PROJECTILE_CANVAS, rand, angleDiff } from './game-shared.js';

export const combatMethods = {
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
  },

  // ---------- the way to the bear (src/core/paths.js) ----------
  // Rebuilt when the bear changes cell, and twice a second anyway (doors open, lifts move).
  updatePaths(dt) {
    const p = this.player, cx = Math.floor(p.x / CELL), cz = Math.floor(p.z / CELL);
    const pt = this.paths ||= { cx: -1, cz: -1, t: 0 };
    pt.t -= dt;
    if (cx === pt.cx && cz === pt.cz && pt.t > 0) return;
    Object.assign(pt, { cx, cz, t: 0.5, ground: pathField(this.level, cx, cz), fly: null });
  },

  // Where an opponent should head for to reach the bear round the walls: the centre of its next cell, the bear
  // itself when it is in the same cell, or null when there is no way (or it is too far to bother).
  wayToBear(e, maxSteps = 30) {
    const pt = this.paths;
    if (!pt) return null;
    const field = e.fly ? (pt.fly ||= pathField(this.level, pt.cx, pt.cz, { fly: true })) : pt.ground;
    const cx = Math.floor(e.x / CELL), cz = Math.floor(e.z / CELL), d = stepsAt(field, cx, cz);
    if (d === 0) return { x: this.player.x, z: this.player.z };
    if (d < 0 || d > maxSteps) return null;
    const n = nextStep(field, this.level, cx, cz);
    return n && cellCenter(n.cx, n.cz);
  },

  // ---------- events from enemies ----------
  sound(name) { play(name); },

  // counted once: the training cut-outs get back up and can be knocked out again
  onKnockOut(e) {
    if (!e.counted) { e.counted = true; this.stats.kills++; }
    this.koUntil = performance.now() + 1500; // the crosshair steps aside while the comic effect plays
  },

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
  },

  // A melee opponent (Cinghialotto, the diving Papero) reaches the bear.
  enemyTouch(e, atk) {
    const p = this.player;
    if (!p.sleep.god) { play('hurt'); this.hud.hit('cuscino'); p.shakeT = 0.4; }
    this.addPlayerSleep(atk.sleep * this.diff.sleep);
    // pushed back a little: for a moment the bear's feet don't grip (see movePlayer)
    const dx = p.x - e.x, dz = p.z - e.z, l = Math.hypot(dx, dz) || 1;
    p.vx += (dx / l) * 6; p.vz += (dz / l) * 6; p.pushT = 0.3;
  },

  // ---------- the player's weapons ----------
  autoAim(yaw, pitch) {
    const best = this.aimTarget(yaw);
    if (!best) return { yaw, pitch };
    const autoPitch = Math.atan2(best.ey - (this.player.y + this.player.eye), best.dist);
    return { yaw: best.yaw, pitch: autoPitch };
  },

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
      if (!best || dist < best.dist) best = { e, dist, d, ey, top: e.y + e.def.height + 0.3, yaw: Math.atan2(-dx, -dz) };
    }
    // bins that burst count too, if nearer (DOOM's auto-aim locks on barrels as well)
    for (const b of this.poppers) {
      if (b.popped) continue;
      const dx = b.x - p.x, dz = b.z - p.z, dist = Math.hypot(dx, dz);
      if (dist > 30 || Math.abs(angleDiff(Math.atan2(-dx, -dz), yaw)) > 0.2) continue;
      const ey = b.y + b.h * 0.5;
      if (!lineOfSight(this.level, p.x, eyeY, p.z, b.x, ey, b.z)) continue;
      if (!best || dist < best.dist) best = { e: b, dist, ey, top: b.y + b.h + 0.3, yaw: Math.atan2(-dx, -dz) };
    }
    return best;
  },

  tryFire(dt) {
    const p = this.player, w = WEAPONS[p.weapon];
    if (p.cooldown > 0 || this.trick?.blocksFire) return;
    const free = p.infinite || this.trick?.freeShots; // the joust's slingshot shots cost no candy
    if (w.ammo && !free && p.ammo[w.ammo] < w.cost) { this.autoSwitch(); return; }
    // the B.F.G. charges for a moment before firing (as in DOOM)
    if (w.charge) {
      if (p.charge === 0) { this.weaponView.fire(); play('charge'); }
      p.charge += dt;
      if (p.charge < w.charge) return;
      p.charge = 0;
    } else this.weaponView.fire();
    p.cooldown = w.cooldown;
    if (w.face) p.fireFaceT = 0.3;
    if (w.ammo && !free) p.ammo[w.ammo] -= w.cost;
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
      // a pie is thrown upwards a little: it flies in an arc (`lob`)
      const yaw = aim.yaw + rand(-pr.spread, pr.spread), pitch = aim.pitch + rand(-pr.spread, pr.spread) * 0.6 + (pr.lob ? 0.22 : 0);
      const dir = { x: -Math.sin(yaw) * Math.cos(pitch), y: Math.sin(pitch), z: -Math.cos(yaw) * Math.cos(pitch) };
      this.spawnProjectile('player', pr.kind, ox, oy, oz, dir, pr.speed * rand(0.95, 1.05), {
        damage: rand(...pr.damage), effect: w.effect, pain: w.pain, variant: i, ttl: pr.ttl, size: pr.size, splash: pr.splash, bounce: pr.bounce, lob: pr.lob,
      });
    }
    this.trick?.shot(this.projectiles.at(-1));
  },

  autoSwitch() {
    const p = this.player;
    // like DOOM, never switch on its own to the weapons that could surprise you (B.F.G., cotton candy cannon)
    const order = [...p.weapons].filter(k => k !== 'bfg' && k !== 'zucchero').sort((a, b) => WEAPONS[b].slot - WEAPONS[a].slot);
    const next = order.find(k => !WEAPONS[k].ammo || p.infinite || p.ammo[WEAPONS[k].ammo] >= WEAPONS[k].cost) || 'zampata';
    if (next !== p.weapon) this.selectWeapon(next);
  },

  selectWeapon(k) {
    if (!this.player.weapons.includes(k)) return;
    this.player.weapon = k;
    this.player.charge = 0;
    this.player.cooldown = Math.max(this.player.cooldown, 0.2);
    this.weaponView.show(k, this.bear);
  },

  spawnProjectile(owner, kind, x, y, z, dir, speed, extra) {
    // metres covered by the 256 canvas (the drawing fills ~40% of it)
    const size = extra.size ?? (kind === 'camomilla' || kind === 'schiuma' ? 1.4 : kind === 'biberon' ? 1.6 : 0.85);
    const bb = new Billboard(this.scene, { width: size, height: size, foot: 0.5 });
    const variant = kind === 'confetti' ? (extra.variant || 0) % 5 : 0;
    // Two flight frames when drawn (projectiles/<kind>/fly_f_1, fly_f_2); placeholders vary the confetti colour.
    const frames = [1, 2].map(f => svgTexture(`projectiles/${kind}/fly_f_${f}${hasAsset(`projectiles/${kind}/fly_f_${f}`) || kind !== 'confetti' ? '' : `~${variant}`}`, () => projectileSprite(kind, variant + f - 1), PROJECTILE_CANVAS, PROJECTILE_CANVAS));
    bb.texture = frames[0];
    this.projectiles.push({ owner, kind, x, y, z, vx: dir.x * speed, vy: dir.y * speed, vz: dir.z * speed, speed, bb, frames, age: 0, ...extra, ttl: extra.ttl ?? 3 });
  },

  splat(x, y, z, kind, big = false) {
    const s = big ? 4 : 1.3;
    const bb = new Billboard(this.scene, { width: s, height: s, foot: 0.5 });
    bb.texture = svgTexture(`projectiles/${kind}/splat_f_1`, () => splatOf(kind, SPLAT_COLORS[kind] || '#fff'), PROJECTILE_CANVAS, PROJECTILE_CANVAS);
    this.splats.push({ bb, x, y, z, t: big ? 0.5 : 0.25 });
  },

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
  },

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
  },

  // B.F.G.: the opponent bursts into sweets (Claude Design's fx/esplosione frames, else a big candy splat).
  burst(e) {
    const bb = new Billboard(this.scene, { width: 3, height: 3, foot: 0.3 });
    const frames = [1, 2, 3].map(f => svgTexture(`fx/esplosione/burst_f_${f}`, () => splatSprite(['#ff2d8a', '#ffd400', '#28c2b4'][f - 1]), 512, 512));
    bb.texture = frames[0];
    this.fx.push({ bb, frames, x: e.x, y: e.y, z: e.z, t: 0 });
  },

  // The boss is asleep: the level says what opens (e.g. the gate to the exit), as when DOOM's barons fall.
  onBossDown() {
    this.hud.message('THE BIG PIG IS FAST ASLEEP! Go, go, go!');
    play('secret');
    if (this.levelDef.bossOpens) this.activate(this.levelDef.bossOpens);
  },

  // Key 0: the bonus weapons, one after the other.
  cycleBonus() {
    const bonus = Object.keys(WEAPONS).filter(k => WEAPONS[k].bonus && this.player.weapons.includes(k));
    if (bonus.length) this.selectWeapon(bonus[(bonus.indexOf(this.player.weapon) + 1) % bonus.length]);
  },

  cycleWeapon(dir) {
    // the bonus weapons (key 0) come after the 9
    const order = k => WEAPONS[k].slot || 10;
    const owned = [...this.player.weapons].sort((a, b) => order(a) - order(b));
    const i = owned.indexOf(this.player.weapon);
    this.selectWeapon(owned[(i + dir + owned.length) % owned.length]);
  },

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
      if (pr.lob) pr.vy -= pr.lob * dt; // thrown in an arc
      pr.x += pr.vx * dt; pr.y += pr.vy * dt; pr.z += pr.vz * dt;
      const c = cellAtWorld(this.level, pr.x, pr.z);
      // footballs bounce off the walls a few times: back where it was, its speed mirrored on the side that hit
      if (pr.bounce > 0 && pr.ttl > 0 && isSolid(c) && blocksSight(c, pr.y)) {
        const ox = pr.x - pr.vx * dt, oz = pr.z - pr.vz * dt;
        const hitX = blocksSight(cellAtWorld(this.level, pr.x, oz), pr.y), hitZ = blocksSight(cellAtWorld(this.level, ox, pr.z), pr.y);
        if (hitX || !hitZ) pr.vx = -pr.vx;
        if (hitZ || !hitX) pr.vz = -pr.vz;
        pr.x = ox; pr.z = oz; pr.bounce--;
        play('boing');
        continue;
      }
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
          if (pr.owner === 'player') e.hit(pr.damage, pr.effect, { x: pr.vx / l, z: pr.vz / l }, p, pr.pain);
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
  },
};
