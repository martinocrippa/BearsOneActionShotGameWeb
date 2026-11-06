// Game methods: the level's own logic. Hints, cheats, checkpoints, pickups, switches and triggers, moving
// floors, the exit. Plain methods on `this`, attached to Game.prototype in game.js; moved here unchanged.
import { CELL, cellCenter } from '../core/level.js';
import { cellAtWorld } from '../core/physics.js';
import { addSleep, addArmor } from '../core/sleep.js';
import { WEAPONS, AMMO } from '../../data/weapons.js';
import { pickupTag } from './game-shared.js';
import { ITEMS, KEYS, DECOR } from '../../data/items.js';
import { RACE } from '../../data/race.js';
import { svgTexture } from '../art/registry.js';
import { itemSprite } from '../art/sprites.js';
import { play } from '../audio.js';

export const levelMethods = {
  hint(id, text) {
    if (this.warned.has(id)) return;
    this.warned.add(id);
    this.hud.message(text);
  },

  // A hint that can come back a few times (every 12 s at most, 3 times per level).
  tip(id, text) {
    const t = (this.tips ||= {})[id] ||= { n: 0, at: -99 };
    if (t.n >= 3 || this.time - t.at < 12) return;
    t.n++; t.at = this.time;
    this.hud.message(text);
  },

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
  },

  // ---------- triggers ----------
  activateCheckpoint(cp, silent = false) {
    this.checkpointIndex = cp.index;
    for (const c of this.checkpoints) c.bb.texture = svgTexture(c === cp ? 'items/checkpointOn' : 'items/checkpoint', () => itemSprite(c === cp ? 'checkpointOn' : 'checkpoint'), 256, 256);
    if (silent) return;
    this.hud.message('CHECKPOINT! If you fall asleep, you wake up here.');
    play('checkpoint');
    this.callbacks.save(this.snapshot());
  },

  tryPickup(it) {
    const def = ITEMS[it.id];
    if (!def || !this.grant(def)) return;
    it.taken = true;
    it.bb.remove();
    this.stats.items++;
  },

  // A bonus room's prize (an item of data/items.js), given straight into the bear's paws.
  grantItem(id) { if (ITEMS[id]) this.grant(ITEMS[id]); },

  // ---------- the TRACTOR RACE (the easter egg, data/race.js) ----------
  // Standing a moment on the roof of a tractor (`race` in DECOR) asks for a race; once per climb: the bear has to
  // get down and up again to be asked again.
  checkRace(dt) {
    const p = this.player;
    const tractor = p.onTop !== null && p.onGround && this.decor.find(d => DECOR[d.id]?.race && Math.hypot(p.x - d.x, p.z - d.z) < d.r + 0.4);
    if (!tractor) { this.raceT = 0; if (p.onGround) this.raceAsked = false; return; }
    if (this.raceAsked || !this.callbacks.onTractor || this.trick?.holds) return;
    this.raceT = (this.raceT || 0) + dt;
    if (this.raceT > 0.7) { this.raceAsked = true; this.callbacks.onTractor(); }
  },

  // The prizes of the race by the bears' best place (1 = first).
  racePrize(place) {
    for (const id of RACE.prizes[place - 1] || []) this.grantItem(id);
  },

  // What an item does for the bear (picked up, or won). false: no use for it now (it stays on the ground).
  grant(def) {
    const p = this.player;
    if (def.sleep) {
      if (p.sleep.value <= 0 && !def.always) return false;
      addSleep(p.sleep, def.sleep);
    } else if (def.armor) {
      if (!addArmor(p.sleep, def.armor, def.cap)) return false;
    } else if (def.weapon) {
      const isNew = !p.weapons.includes(def.weapon);
      if (isNew) p.weapons.push(def.weapon);
      p.ammo[def.ammo] = Math.min(this.ammoMax(def.ammo), p.ammo[def.ammo] + Math.round(def.amount * this.diff.ammo));
      if (isNew) { this.selectWeapon(def.weapon); p.grinT = 1.6; }
    } else if (def.ammo) {
      if (p.ammo[def.ammo] >= this.ammoMax(def.ammo)) return false;
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
    this.hud.message(def.msg);
    if (def.popup) this.hud.popup(def.popup);
    this.hud.flash('pickup');
    play(def.sound);
    return true;
  },

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
  },

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
      if (d.moving || d.cell.open || d.closing || d.cell.door.locked) continue; // locked: a bonus room during its trick
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
  },

  animateMovers(dt) {
    // a bonus room's door closing behind the bear (down again, solid once nearly shut)
    for (const d of this.doors) if (d.closing && d.t > 0) {
      d.t = Math.max(0, d.t - dt);
      d.mesh.position.y = d.y0 + (d.height - d.base - 0.3) * d.t;
      if (d.t < 0.7) d.cell.open = false;
    }
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
  },

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
  },

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
  },
};
