// Constants and small helpers shared by game.js and its method groups (combat.js, level-logic.js), moved here
// unchanged from game.js.
import * as THREE from 'three';
import { AMMO } from '../../data/weapons.js';
import { DECOR, KEYS } from '../../data/items.js';

export const RUN_SPEED = 7;
export const PROJECTILE_CANVAS = 256; // projectiles and splats: 256×256, centred (Claude Design delivery)
export const JUMP_SPEED = 7.4;
export const TURN_SPEED = 2.4;
// Canvas size of the placeholder decor drawings (real drawings bring their own size).
export const DECOR_CANVAS = { abete: [512, 1024], betulla: [512, 1024], cespuglio: [512, 256], funghi: [256, 256], cartello: [256, 512], porta_rigori: [1024, 512], palo_giostra: [256, 768] };
export const decorCanvas = id => DECOR_CANVAS[id] || ((DECOR[id]?.h ?? 2) > 3 ? [512, 1024] : [512, 512]);
export const rand = (a, b) => a + Math.random() * (b - a);
export const angleDiff = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
export const aimPoint = new THREE.Vector3();
// The little caption for a picked-up item, and its colour.
export function pickupTag(def, ammoMul = 1) {
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
export const KEY_COLORS = Object.fromEntries(Object.entries(KEYS).map(([k, v]) => [k, v.color]));
