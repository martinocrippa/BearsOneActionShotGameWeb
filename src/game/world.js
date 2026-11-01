// Builds the three.js scene for a parsed level: walls, railings, floors, ceilings, doors, secret walls,
// switches and moving floors, sky and weather.
// Flat, unlit materials: the "ink and flat colour" look comes from the textures.
import * as THREE from 'three';
import { CELL, WALL_HEIGHT } from '../core/level.js';
import { isSolid } from '../core/physics.js';
import { paintedTexture, svgTexture, assetMeta } from '../art/registry.js';
import { paintTexture } from '../art/textures.js';
import { doorTexture } from '../art/sprites.js';

// DOOM's "fake contrast": east/west faces darker than north/south, so corners read without lights.
function shadedBox(w, h, d) {
  const g = new THREE.BoxGeometry(w, h, d);
  const shade = [0.74, 0.74, 1, 0.55, 0.92, 0.92]; // +x, -x, +y, -y, +z, -z
  const colors = [];
  for (const s of shade) for (let i = 0; i < 4; i++) colors.push(s, s, s);
  g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  return g;
}

function material(map) {
  return new THREE.MeshBasicMaterial({ map, vertexColors: true });
}

// Every cell a touch lighter or darker (fixed by its position): seamless tiles would otherwise melt a hedge
// or a lawn into one flat colour; with the variation each 2 m panel reads, like the tiles in DOOM.
const tint = new THREE.Color();
function panelTint(c, spread) {
  const n = Math.sin(c.cx * 12.9898 + c.cz * 78.233) * 43758.5453;
  return tint.setScalar(1 - spread + (n - Math.floor(n)) * spread * 1.15);
}

// The hatched shadow at the foot of the walls, as a transparent skin on the side faces only.
// (materials shared by every level are marked `shared`: Game.dispose() keeps them)
const HIDDEN = new THREE.MeshBasicMaterial({ visible: false });
HIDDEN.userData.shared = true;
const baseMats = new Map();
function baseShadow(height = WALL_HEIGHT) {
  if (!baseMats.has(height)) {
    // the hatching sits in the bottom 16% of a 4 m face: stretch the picture so it stays that size on any wall
    const tex = newWallBase().clone();
    tex.repeat.set(1, height / WALL_HEIGHT);
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.3, depthWrite: false });
    mat.userData.shared = true;
    baseMats.set(height, mat);
  }
  const mat = baseMats.get(height);
  return [mat, mat, HIDDEN, HIDDEN, mat, mat]; // +x, -x, (top, bottom hidden), +z, -z
}
let wallBaseTex = null;
function newWallBase() {
  if (!wallBaseTex) { wallBaseTex = new THREE.CanvasTexture(paintTexture('wall_base', 256, 512)); wallBaseTex.colorSpace = THREE.SRGBColorSpace; }
  return wallBaseTex;
}

// Wall textures: a square drawing covers 2 m × 2 m, the coded placeholders 2 m × 4 m; repeated upwards for taller walls.
function wallTexture(key, height, color) {
  // own texture per height and colour (own repeat); the registry caches it by this id
  const tex = paintedTexture(key, 256, 512, { color, id: `${key}|${height}|${color || ''}` });
  const meta = assetMeta(key);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, height / (meta?.w && meta.w === meta.h ? CELL : 4));
  return tex;
}
const at3 = (c, y) => [c.cx * CELL + CELL / 2, y, c.cz * CELL + CELL / 2];
// Colours multiply in linear space: a cell's light 0.5 must LOOK half as bright, hence the gamma.
export const lin = l => Math.pow(l, 2.2);

// Picture of a door: the drawn one for the key, else a placeholder with a lock of the key's colour.
export function doorKey(key, bonus = false) { return bonus ? 'doors/bonus/closed' : key === 'ghianda' ? 'textures/door' : `doors/${key || 'plain'}/closed`; }

export function buildWorld(level, levelDef, { keyColors = {} } = {}) {
  const group = new THREE.Group();
  const { width, height, at } = level;
  const legend = level.legend || {};
  const wallH = legend.wallHeight ?? WALL_HEIGHT;
  const dynamic = c => c.door || c.secret || c.mover || c.sw;
  // light of a wall = the brightest open cell next to it
  const wallLight = c => Math.max(0.15, ...[[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dz]) => at(c.cx + dx, c.cz + dz)).filter(n => n && !n.wall).map(n => n.light), 0);
  const m4 = new THREE.Matrix4();
  const col = new THREE.Color();
  // walls and floors start below the lowest floor of the level: no gap under a wall next to a river or a pit,
  // and a raised floor (a desk top, a ledge) is a solid block down to the ground
  const base = Math.min(0, ...level.cells.filter(c => c.floor).map(c => c.h)) - 1;
  const wallDefs = Object.values(legend.walls || {}).map(w => (typeof w === 'string' ? { style: w } : w)).filter(w => !w.rail && !w.switch);

  // ---- static walls: only cells that touch somewhere you can stand ----
  const wallGroups = {};
  for (const c of level.cells) {
    if (!c.wall || dynamic(c)) continue;
    const near = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]].some(([dx, dz]) => { const n = at(c.cx + dx, c.cz + dz); return n && (!n.wall || dynamic(n)); });
    if (!near) continue;
    const w = c.wallDef || {};
    const h = w.h ?? wallH;
    (wallGroups[`${c.wall}|${h}|${w.rail ? 1 : 0}`] ||= { style: c.wall, h, rail: !!w.rail, color: w.color, cells: [] }).cells.push(c);
  }
  for (const g of Object.values(wallGroups)) {
    const key = `textures/${g.rail ? 'rail' : 'wall'}_${g.style}`;
    const tex = wallTexture(key, g.h - base, g.color);
    const mat = g.rail
      ? new THREE.MeshBasicMaterial({ map: tex, vertexColors: true, transparent: true, alphaTest: 0.4, side: THREE.DoubleSide })
      : material(tex);
    const tall = g.rail ? g.h : g.h - base; // railings stand on the ground, they are see-through anyway
    const y0 = g.rail ? 0 : base;
    const mesh = new THREE.InstancedMesh(shadedBox(CELL, tall, CELL), g.rail ? [mat, mat, HIDDEN, HIDDEN, mat, mat] : mat, g.cells.length);
    g.cells.forEach((c, i) => {
      mesh.setMatrixAt(i, m4.makeTranslation(...at3(c, y0 + tall / 2)));
      mesh.setColorAt(i, col.copy(panelTint(c, g.rail ? 0 : 0.16)).multiplyScalar(lin(wallLight(c))));
    });
    group.add(mesh);
    // hatched foot shadow over the drawn tiles (the coded placeholders already have it painted in)
    if (!g.rail && assetMeta(key)) {
      const skin = new THREE.InstancedMesh(new THREE.BoxGeometry(CELL + 0.02, g.h, CELL + 0.02), baseShadow(g.h), g.cells.length);
      g.cells.forEach((c, i) => skin.setMatrixAt(i, m4.makeTranslation(...at3(c, g.h / 2)))); // the shadow sits at ground level
      group.add(skin);
    }
  }

  // ---- doors (slide up), secret walls and switch-moved walls (sink), switches (swap picture) ----
  const doors = [], secretWalls = [], movers = [], switches = [];
  for (const c of level.cells) {
    if (!dynamic(c)) continue;
    c.open = false;
    let mat;
    // a secret or moving wall is as tall as the walls of its style around it (a notch would give it away)
    const h = c.door || c.sw ? wallH : c.wallDef?.h ?? wallDefs.find(w => w.style === c.wall)?.h ?? wallH;
    if (c.door) mat = material(svgTexture(doorKey(c.door.key, c.door.bonus), () => doorTexture(c.door.bonus ? '#ffd400' : keyColors[c.door.key], c.door.bonus), 256, 512));
    else if (c.sw) mat = material(paintedTexture('textures/switch_off', 256, 512));
    else mat = material(wallTexture(`textures/wall_${c.wall}`, h - base, c.wallDef?.color));
    const mesh = new THREE.Mesh(shadedBox(CELL, h - base, CELL), mat);
    mesh.position.set(...at3(c, base + (h - base) / 2));
    mesh.material.color.setScalar(lin(wallLight(c)));
    // a secret wall must look exactly like the others, foot shadow included (from the ground up, as on static walls)
    if (!c.door && !c.sw && assetMeta(`textures/wall_${c.wall}`)) {
      const skin = new THREE.Mesh(new THREE.BoxGeometry(CELL + 0.02, h, CELL + 0.02), baseShadow(h));
      skin.position.y = -base / 2;
      mesh.add(skin);
    }
    group.add(mesh);
    const entry = { cell: c, mesh, moving: false, t: 0, height: h, base, y0: mesh.position.y };
    if (c.door) doors.push(entry);
    else if (c.secret) secretWalls.push(entry);
    else if (c.sw) switches.push({ ...entry, on: false, onTex: paintedTexture('textures/switch_on', 256, 512) });
    else movers.push(entry);
  }

  // ---- floors: a 1 m slab under every open cell, top at the floor height ----
  const floorGroups = {};
  const sideOf = c => c.side || legend.side || wallDefs[0]?.style || 'roccia';
  const animated = []; // floors with a second frame (mud, water)
  const floors = []; // floors that move (lifts, switch floors): one mesh each
  const floorMats = new Map();
  const floorMat = c => {
    const key = c.lift ? 'textures/floor_lift' : `textures/floor_${c.floor}`;
    if (floorMats.has(key)) return floorMats.get(key);
    const mat = material(paintedTexture(key, 256, 256, { color: c.color }));
    const second = `textures/floor_${c.floor}_2`;
    if (!c.lift && (assetMeta(second) || (c.fx?.liquid && !assetMeta(key)))) animated.push({ material: mat, frames: [mat.map, paintedTexture(second, 256, 256, { color: c.color })] });
    floorMats.set(key, mat);
    return mat;
  };
  for (const c of level.cells) {
    if (!c.floor) continue;
    if (c.lift || c.moveTo !== undefined) {
      const mesh = new THREE.Mesh(shadedBox(CELL, 14, CELL), floorMat(c).clone()); // tall enough to reach the ground from any height
      mesh.material.color.copy(panelTint(c, 0.08)).multiplyScalar(lin(c.light));
      mesh.position.set(...at3(c, c.h - 7));
      group.add(mesh);
      floors.push({ cell: c, mesh });
      continue;
    }
    (floorGroups[`${c.floor}|${sideOf(c)}`] ||= []).push(c);
  }
  // The sides of a raised floor (a ledge, a desk top, a stand) show a wall, like DOOM's lower textures:
  // the floor's `side`, else the level's `side`, else its first wall style.
  const pos = new THREE.Vector3(), quat = new THREE.Quaternion(), scl = new THREE.Vector3();
  for (const cells of Object.values(floorGroups)) {
    const top = floorMat(cells[0]);
    const tallest = Math.max(...cells.map(c => c.h - base));
    const sideDef = wallDefs.find(w => w.style === sideOf(cells[0])) || {};
    const side = material(wallTexture(`textures/wall_${sideOf(cells[0])}`, Math.max(2, tallest), sideDef.color));
    const mesh = new THREE.InstancedMesh(shadedBox(CELL, 1, CELL), [side, side, top, top, side, side], cells.length);
    cells.forEach((c, i) => {
      const tall = c.h - base;
      mesh.setMatrixAt(i, m4.compose(pos.set(...at3(c, base + tall / 2)), quat, scl.set(1, tall, 1)));
      mesh.setColorAt(i, col.copy(panelTint(c, 0.08)).multiplyScalar(lin(c.light)));
    });
    group.add(mesh);
  }

  // ---- ceilings: a 1 m slab above the cells that have one ----
  const ceilGroups = {};
  for (const c of level.cells) if (c.floor && c.ceil !== null) (ceilGroups[c.ceilStyle || 'soffitto'] ||= []).push(c);
  for (const [style, cells] of Object.entries(ceilGroups)) {
    const mat = material(paintedTexture(`textures/ceil_${style}`, 256, 256, { color: cells[0].ceilColor }));
    const mesh = new THREE.InstancedMesh(shadedBox(CELL, 1, CELL), mat, cells.length);
    cells.forEach((c, i) => {
      mesh.setMatrixAt(i, m4.makeTranslation(...at3(c, c.ceil + 0.5)));
      mesh.setColorAt(i, col.setScalar(Math.min(1.8, lin(c.light) / 0.55))); // the bottom face is shaded 0.55: back to the cell's light
    });
    group.add(mesh);
  }

  // ---- sky: a big cylinder that follows the camera, like DOOM's sky ----
  const skyDef = levelDef.sky || {};
  const skyTex = paintedTexture(skyDef.key || 'textures/sky', 2048, 512, { repeat: [2, 1], color: skyDef.top });
  const sky = new THREE.Mesh(
    new THREE.CylinderGeometry(300, 300, 160, 48, 1, true),
    new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, fog: false, depthWrite: false, transparent: true }),
  );
  sky.position.y = 40;
  sky.renderOrder = -1;
  group.add(sky);
  // far hills with firs, between the sky and the walls: the wood goes on beyond the clearing
  const ownTextures = []; // made for this level only: Game.dispose() frees them
  if (levelDef.horizon === 'hills') {
    const hillsTex = new THREE.CanvasTexture(paintTexture('hills', 2048, 512));
    hillsTex.colorSpace = THREE.SRGBColorSpace; hillsTex.wrapS = THREE.RepeatWrapping; hillsTex.repeat.set(2, 1);
    ownTextures.push(hillsTex);
    const hills = new THREE.Mesh(
      new THREE.CylinderGeometry(280, 280, 160, 48, 1, true),
      new THREE.MeshBasicMaterial({ map: hillsTex, side: THREE.BackSide, fog: false, depthWrite: false, transparent: true }),
    );
    hills.renderOrder = -0.5;
    sky.add(hills); // follows the camera with the sky
  }

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(width * CELL * 6, height * CELL * 6), new THREE.MeshBasicMaterial({ color: skyDef.ground || '#5fae5a' }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(width * CELL / 2, -1.05, height * CELL / 2);
  group.add(ground);

  const weather = levelDef.weather ? new Weather(group, levelDef.weather) : null;
  return { group, doors, secretWalls, movers, switches, floors, sky, animated, weather, ownTextures };
}

// Rain, snow or falling leaves: a box of particles that follows the camera.
const WEATHER = {
  rain: { n: 900, color: '#c8d6e6', speed: 16, size: 0.06, streak: 0.7 },
  snow: { n: 700, color: '#ffffff', speed: 1.6, size: 0.14, drift: 0.8 },
  leaves: { n: 120, color: '#e07a2e', speed: 1.2, size: 0.22, drift: 1.6 },
};
class Weather {
  constructor(group, kind) {
    this.def = WEATHER[kind];
    const { n, color, streak } = this.def;
    this.pos = new Float32Array(n * 3);
    this.seed = Float32Array.from({ length: n }, () => Math.random() * 6.28);
    for (let i = 0; i < n * 3; i++) this.pos[i] = (Math.random() - 0.5) * 40;
    const geo = new THREE.BufferGeometry();
    if (streak) {
      // rain: short vertical lines
      this.lines = new Float32Array(n * 6);
      geo.setAttribute('position', new THREE.BufferAttribute(this.lines, 3));
      this.obj = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.6 }));
    } else {
      geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
      this.obj = new THREE.Points(geo, new THREE.PointsMaterial({ color, size: this.def.size, sizeAttenuation: true }));
    }
    this.obj.frustumCulled = false;
    group.add(this.obj);
    this.t = 0;
  }
  update(dt, cx, cy, cz) {
    const { n, speed, drift = 0, streak } = this.def, p = this.pos;
    this.t += dt;
    for (let i = 0; i < n; i++) {
      p[i * 3 + 1] -= speed * dt;
      p[i * 3] += Math.sin(this.t + this.seed[i]) * drift * dt;
      if (p[i * 3 + 1] < -4) p[i * 3 + 1] += 22;
    }
    if (streak) {
      const L = this.lines;
      for (let i = 0; i < n; i++) {
        const x = cx + p[i * 3], y = cy + p[i * 3 + 1], z = cz + p[i * 3 + 2], j = i * 6;
        L[j] = x; L[j + 1] = y; L[j + 2] = z; L[j + 3] = x; L[j + 4] = y - streak; L[j + 5] = z;
      }
    } else this.obj.position.set(cx, cy, cz);
    this.obj.geometry.attributes.position.needsUpdate = true;
  }
}

// A flat drawing that always turns to face the player (DOOM sprite).
// Two ways to size it:
// - fixed: `width`/`height` in metres for the whole canvas, `foot` = fraction of the canvas below the feet line
//   (characters: every frame shares the same scale, so walking does not make them grow or shrink);
// - `fit`: the visible drawing is `fit` metres tall and stands on the ground with its lowest pixel
//   (props and items: works whatever canvas the drawing comes on). Hidden until the picture is measured.
const PLANE = new THREE.PlaneGeometry(1, 1); // one quad for every billboard, scaled per sprite
PLANE.userData.shared = true;
export class Billboard {
  constructor(scene, { width = 1, height = 1, foot = 0, fit = 0 }) {
    this.material = new THREE.MeshBasicMaterial({ transparent: true, alphaTest: 0.35, side: THREE.DoubleSide });
    this.mesh = new THREE.Mesh(PLANE, this.material);
    this.width = width; this.height = height; this.foot = foot; this.fit = fit;
    this.mesh.scale.set(width, height, 1);
    this.mesh.visible = !fit;
    this.flip = false;
    scene.add(this.mesh);
  }
  set texture(t) {
    if (this.material.map === t) return;
    // the shader only changes when the map appears or goes away: swapping frames needs no recompile
    if (!this.material.map !== !t) this.material.needsUpdate = true;
    this.material.map = t;
  }
  set light(l) { this.material.color.setScalar(lin(l)); } // the brightness of where it stands
  place(x, y, z, yaw) {
    const bb = this.fit && this.material.map?.userData.bbox;
    if (bb) {
      const { w, h } = this.material.map.userData.size, m = this.fit / (bb.y1 - bb.y0);
      this.width = w * m; this.height = h * m; this.foot = (h - bb.y1) / h;
      this.mesh.visible = true;
    }
    this.mesh.position.set(x, y + this.height / 2 - this.height * this.foot, z);
    this.mesh.rotation.y = yaw;
    this.mesh.scale.set(this.flip ? -this.width : this.width, this.height, 1);
  }
  remove() { this.mesh.removeFromParent(); this.material.dispose(); }
}
