// Entry point: menus → level → pause / buonanotte / report / YOU LOSE, and back.
import '@fontsource/bangers';
import '@fontsource/permanent-marker';
import './ui/style.css';
import * as THREE from 'three';
import { LEVELS, EPISODE, TRAINING } from '../levels/index.js';
import { bearById } from '../data/bears.js';
import { DEFAULT_DIFFICULTY } from '../data/difficulty.js';
import { decodePassword } from './core/password.js';
import { loadManifest } from './art/registry.js';
import { createInput } from './game/input.js';
import { Game } from './game/game.js';
import { createHud } from './ui/hud.js';
import { createWeaponView } from './ui/weaponView.js';
import { createScreens } from './ui/screens.js';
import { preloadCover } from './ui/flyer.js';
import { SweetShot } from './bonus/sweetshot.js';
import { BONUS_LEVELS } from '../data/bonus.js';
import { unlockAudio, startMusic, stopMusic, toggleMusic } from './audio.js';

const SAVE_KEY = 'orsi:v1:save';

// The list of real drawings must be known before the HUD, the weapon view and the menus are built.
await loadManifest();
await preloadCover();
// Courier Prime comes with Claude Design's pack, copied to public/assets/fonts/ by the import script (not listed in
// assets.json). Bangers and Permanent Marker are bundled from npm.
for (const [file, weight] of [['courier-prime-latin-400-normal', 400], ['courier-prime-latin-700-normal', 700]]) {
  const url = `${import.meta.env.BASE_URL}assets/fonts/${file}.woff2`;
  new FontFace('Courier Prime', `url(${url})`, { weight: String(weight) }).load().then(f => document.fonts.add(f)).catch(() => {});
}

const app = document.getElementById('app');
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25)); // flat ink drawings: no need for full retina, much lighter
renderer.outputColorSpace = THREE.SRGBColorSpace;
app.appendChild(renderer.domElement);
const ui = document.createElement('div');
ui.className = 'ui';
app.appendChild(ui);
// Photocopy grain over everything (Claude Design exports the screens without it: the game adds it).
const grain = document.createElement('div');
grain.className = 'grain';
app.appendChild(grain);

const weaponView = createWeaponView(ui);
const hud = createHud(ui);
const screens = createScreens(ui);
const input = createInput();

let game = null;
let bonus = null; // SWEET SHOT, when it is running
const BONUS_KEY = 'orsi:v1:bonus';
const bonusUnlocked = () => { try { return localStorage.getItem(BONUS_KEY) === '1'; } catch { return false; } };
const unlockBonus = () => { try { localStorage.setItem(BONUS_KEY, '1'); } catch { /* private window */ } };
let session = null; // { levelIndex, bearId, mode, difficulty }

// ---------- saving (browser only: nothing leaves the computer) ----------
function loadSave() {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (s && typeof s.level === 'number' && LEVELS[s.level] && Array.isArray(s.weapons) && s.ammo) return s;
  } catch { /* storage unavailable or corrupted */ }
  return null;
}
function writeSave(s) { try { localStorage.setItem(SAVE_KEY, JSON.stringify(s)); } catch { /* private window */ } }
function clearSave() { try { localStorage.removeItem(SAVE_KEY); } catch { /* ignore */ } }

// ---------- size ----------
// The 3D view stops at the status bar (like DOOM's): its centre is where the crosshair is, and nothing in the
// world hides behind the bar.
const hudProbe = document.createElement('div');
hudProbe.style.cssText = 'position:absolute;visibility:hidden;height:var(--hud-h);width:1px';
ui.appendChild(hudProbe);
function resize() {
  const w = window.innerWidth, h = Math.max(100, window.innerHeight - hudProbe.offsetHeight);
  renderer.setSize(w, h);
  game?.resize(w, h);
  bonus?.resize();
}
window.addEventListener('resize', resize);
resize();

// ---------- playing ----------
function setPlaying(on) {
  hud.visible = on;
  weaponView.visible = on;
}

function begin() {
  screens.hide();
  setPlaying(true);
  input.reset();
  game.paused = false;
  startMusic(game.levelDef.music);
}

async function pause() {
  if (!game || game.paused) return;
  game.paused = true;
  setPlaying(false);
  for (;;) {
    const v = await screens.pause(game.levelDef.training ? null : game.password()); // LEARN has nothing to save
    if (v === 'controls') { await screens.controls(); continue; }
    if (v === 'resume') begin(); else quitToMenu();
    return;
  }
}

// What the bear carries into the next level (as in DOOM: weapons, sweets, how sleepy), from the checkpoint-free
// start of that level.
const carryTo = (snap, level) => ({ ...snap, level, checkpoint: -1, done: false, next: undefined });
let entry = null; // what the bear had when the current level started (TRY AGAIN / PLAY AGAIN)

async function startLevel(levelIndex, bearId, mode, difficulty, save) {
  unlockAudio();
  game?.dispose();
  session = { levelIndex, bearId, mode, difficulty };
  if (!save || save.checkpoint < 0) entry = save ? { ...save } : null;
  const levelDef = levelIndex === 'training' ? TRAINING : LEVELS[levelIndex];
  const training = !!levelDef.training; // LEARN: nothing is saved, it ends back at the menu
  const bear = bearById(bearId);
  game = new Game({
    renderer, hud, weaponView, input, levelDef, levelIndex, bear, mode, difficulty, save,
    callbacks: {
      onPause: pause,
      onResume: begin,
      onToggleMusic: () => hud.message(toggleMusic() ? 'MUSIC: ON' : 'MUSIC: OFF'),
      save: training ? () => {} : writeSave,
      onSleep: async lives => { setPlaying(false); return screens.sleep(bear, lives); },
      onWin: async (stats, { secret, next, carry }) => {
        setPlaying(false); stopMusic(); startMusic('intermission');
        if (training) {
          const v = await screens.report(stats, levelDef, { training: true });
          if (v === 'again') return startLevel('training', bearId, mode, difficulty, null);
          if (v === 'play') {
            const d = await screens.difficulty();
            if (d !== 'back') return startLevel(0, bearId, mode, d, null);
          }
          return quitToMenu();
        }
        const hasNext = next !== null && next !== undefined && LEVELS[next];
        const v = await screens.report(stats, levelDef, { secret, nextName: hasNext ? LEVELS[next].name : null });
        if (v === 'next' && hasNext) return startLevel(next, bearId, mode, difficulty, carryTo(carry, next));
        if (v === 'next') { unlockBonus(); stopMusic(); startMusic('ending'); await screens.ending(EPISODE); await screens.teaser(EPISODE); return quitToMenu(); }
        if (v === 'again') return startLevel(levelIndex, bearId, mode, difficulty, entry && carryTo(entry, levelIndex));
        quitToMenu();
      },
      onLose: async () => {
        setPlaying(false); stopMusic();
        const v = await screens.lose();
        // like DOOM: the level starts again from the beginning, with what the bear had when it entered it
        // (LEARN leaves the episode's save alone)
        const again = entry ? { ...carryTo(entry, levelIndex), lives: 3, sleep: 0 } : null;
        if (!training) { if (again) writeSave(again); else clearSave(); }
        if (v === 'again') startLevel(levelIndex, bearId, mode, difficulty, again); else quitToMenu();
      },
      onUnlockBonus: unlockBonus,
      // IDCLEV: jump to another level with what the bear has now
      onWarp: n => {
        if (!LEVELS[n]) { game.paused = false; hud.message(`There is no level ${n + 1} (yet).`); return; }
        setPlaying(false); stopMusic();
        startLevel(n, bearId, mode, difficulty, carryTo(game.snapshot(), n));
      },
    },
  });
  resize();
  setPlaying(false);
  await Promise.all([game.ready(), weaponView.ready]);
  weaponView.refresh(game.player.weapon, bear);
  game.render();
  if (!save && !training) writeSave(game.snapshot());
  await screens.intro(levelDef);
  begin();
  // Hints as short in-game messages instead of text on the menus.
  hud.message(levelDef.intro);
  if (!training) setTimeout(() => game && hud.message(mode === 'coop' ? 'SCHIVA: chi guida usa ← →' : 'SCHIVA: A e D'), 2500);
}

// ---------- SWEET SHOT (the bonus) ----------
const HOWTO_BONUS = {
  solo: 'FRECCE: muovi il mirino · SPAZIO: spara · Q / E (o 1 2 3): caramelle, confetti, marshmallow · tieni premuto ALT GR: cannocchiale. Mira un po\' davanti all\'uccello: il dolce ci mette un attimo ad arrivare!',
  coop: 'CHI GUIDA: frecce per il mirino, ALT GR per il cannocchiale · CHI SPARA: SPAZIO, e Q / E per cambiare dolce. Mirate un po\' davanti all\'uccello!',
};
async function startBonus(levelIndex, bearId, mode) {
  unlockAudio();
  bonus?.dispose();
  game?.dispose(); game = null;
  setPlaying(false);
  renderer.domElement.style.display = 'none';
  const level = BONUS_LEVELS[levelIndex];
  bonus = new SweetShot({
    root: app, input, levelIndex, mode, bear: bearById(bearId),
    callbacks: {
      onToggleMusic: () => toggleMusic(),
      onPause: async () => {
        stopMusic();
        let v;
        while ((v = await screens.pause(null)) === 'controls') await screens.controls();
        if (v === 'resume') { screens.hide(); input.reset(); bonus.paused = false; startMusic(level.music); } else quitToMenu();
      },
      onEnd: async r => {
        stopMusic(); startMusic('intermission');
        const hasNext = !!BONUS_LEVELS[levelIndex + 1];
        const v = await screens.bonusResult(r, hasNext);
        if (v === 'next') return startBonus(levelIndex + 1, bearId, mode);
        if (v === 'again') return startBonus(levelIndex, bearId, mode);
        quitToMenu();
      },
    },
  });
  app.insertBefore(bonus.canvas, ui);
  bonus.render();
  await screens.intro({ id: `BONUS ${levelIndex + 1}`, name: level.name, howto: HOWTO_BONUS[mode] });
  screens.hide();
  startMusic(level.music);
  bonus.start();
}

function quitToMenu() {
  bonus?.dispose(); bonus = null;
  renderer.domElement.style.display = '';
  stopMusic();
  game?.dispose();
  game = null;
  setPlaying(false);
  menu();
}

// ---------- menus ----------
async function askMode() {
  const v = await screens.mode();
  return v === 'back' ? null : v;
}

async function menu() {
  await screens.title();
  unlockAudio();
  startMusic('title');
  for (;;) {
    const save = loadSave();
    // a finished level continues with the next one; a finished episode cannot be continued
    const canContinue = !!save && (!save.done || (save.next !== null && save.next !== undefined && LEVELS[save.next]));
    const v = await screens.main(canContinue, bonusUnlocked());
    if (v === 'bonus') {
      const lv = await screens.bonusLevels(BONUS_LEVELS);
      if (lv === 'back') continue;
      const mode = await askMode();
      if (!mode) continue;
      const bearId = await screens.bear();
      if (bearId === 'back') continue;
      return startBonus(lv, bearId, mode);
    }
    if (v === 'title') { await screens.title(); continue; }
    if (v === 'controls') { await screens.controls(); continue; }
    if (v === 'continue') {
      const mode = await askMode();
      const s = save.done ? carryTo(save, save.next) : save;
      if (mode) return startLevel(s.level, s.bear, mode, s.difficulty ?? DEFAULT_DIFFICULTY, s);
      continue;
    }
    if (v === 'code') {
      let error = '';
      for (;;) {
        const r = await screens.code(error);
        if (r.v !== 'ok') break;
        const s = decodePassword(r.text);
        if (!s || !LEVELS[s.level]) { error = 'Codice sbagliato: controlla le lettere e riprova.'; continue; }
        const mode = await askMode();
        if (mode) return startLevel(s.level, s.bear, mode, s.difficulty, s);
        break;
      }
      continue;
    }
    if (v === 'learn') {
      const mode = await askMode();
      if (!mode) continue;
      const bearId = await screens.bear();
      if (bearId === 'back') continue;
      return startLevel('training', bearId, mode, 0, null);
    }
    if (v === 'play') {
      const mode = await askMode();
      if (!mode) continue;
      const bearId = await screens.bear();
      if (bearId === 'back') continue;
      const difficulty = await screens.difficulty();
      if (difficulty === 'back') continue;
      return startLevel(0, bearId, mode, difficulty, null);
    }
  }
}


// ---------- loop ----------
let last = performance.now();
function frame(now) {
  // Game time follows real time even on a slow computer: a long frame is played as several short steps
  // (before, a slow frame made the whole game run in slow motion, as if wading in mud).
  let dt = Math.min(0.12, (now - last) / 1000);
  last = now;
  if (game) {
    while (dt > 0.0001) { const step = Math.min(dt, 1 / 40); game.update(step); dt -= step; }
    if (!game.paused) game.render(); // behind the pause, sleep and report screens the last picture stays
  } else if (bonus) {
    while (dt > 0.0001) { const step = Math.min(dt, 1 / 40); bonus.update(step); dt -= step; }
    bonus.render();
  }
  requestAnimationFrame(frame);
}

setPlaying(false); // no status bar or weapon behind the menus
requestAnimationFrame(frame);
menu();

// Handy for testing from the browser console.
window.__orsi = { get game() { return game; }, get bonus() { return bonus; }, session: () => session, levels: LEVELS, startLevel, startBonus, unlockBonus };
