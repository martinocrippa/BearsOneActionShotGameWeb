// Entry point: menus → level → pause / buonanotte / report / YOU LOSE, and back.
// Latin subset only: Italian and English need nothing else, and the vietnamese/latin-ext files stay out of dist/.
import '@fontsource/bangers/latin-400.css';
import '@fontsource/permanent-marker/latin-400.css';
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
import { TractorRace } from './race/race.js';
import { RACE } from '../data/race.js';
import { unlockAudio, startMusic, stopMusic, toggleMusic, suspendAudio } from './audio.js';
import { showNotice, reportError } from './ui/notice.js';

window.addEventListener('error', reportError);
// The built game keeps itself in the browser (dist/sw.js, scripts/offline-plugin.mjs): no network needed after the
// first visit. Not in `npm run dev`, where a cache would hide every change.
if (import.meta.env.PROD && 'serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});
window.addEventListener('unhandledrejection', reportError);

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
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
} catch (error) {
  console.error(error);
  showNotice('NIENTE GRAFICA 3D', 'Per giocare apri ORSI! in Chrome, Edge o Firefox con l’accelerazione grafica attiva.');
  await new Promise(() => {}); // without WebGL there is nothing to play: stop here, the message stays
}
// The graphics card can reset mid-game (driver update, the computer waking up): everything drawn is gone, so the
// level stops and the page offers a reload; the last checkpoint is in the save.
renderer.domElement.addEventListener('webglcontextlost', e => {
  e.preventDefault();
  if (game) game.paused = true;
  stopMusic();
  showNotice('LA GRAFICA SI È FERMATA', 'Il computer ha fatto ripartire la scheda grafica. Ricarica: riparti dall’ultimo punto salvato.', { reload: true });
});
renderer.domElement.addEventListener('webglcontextrestored', () => location.reload());
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
let race = null;  // the TRACTOR RACE, when it is running (over the paused level)
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
  // (the race has no status bar: its view takes the whole window)
  const w = window.innerWidth, h = race ? window.innerHeight : Math.max(100, window.innerHeight - hudProbe.offsetHeight);
  renderer.setSize(w, h);
  game?.resize(w, h);
  bonus?.resize();
  race?.resize();
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
      onTractor: tractorRace,
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

// ---------- TRACTOR RACE (the tractors' easter egg) ----------
// Standing on a tractor's roof asks for a race; the level waits, paused, and gets the prize at the end.
const HOWTO_RACE = {
  solo: 'SPAZIO: accelera · ↓: frena · ← →: sterza. Due giri attorno al campo: occhio alle balle di fieno! Chi arriva primo vince la VANGA D\'ORO (tasto 0).',
  coop: 'Un trattore a testa! CHI GUIDA (sopra): ALT GR accelera, ← → sterza, ↓ frena · CHI SPARA (sotto): SPAZIO accelera, A e D sterzano. Chi vince prende la VANGA D\'ORO!',
};
async function tractorRace() {
  if (!game || race) return;
  const g = game;
  g.paused = true;
  setPlaying(false);
  if (await screens.raceAsk() !== 'go') { begin(); return; }
  for (;;) {
    const result = await runRace(g);
    if (!result) return; // gone back to the menu meanwhile
    stopMusic(); startMusic('intermission');
    const v = await screens.raceResult(result);
    if (v === 'again') continue;
    begin();
    hud.message(`TRACTOR RACE: ${result.place === 1 ? 'YOU WON!' : `you came ${['', '1st', '2nd', '3rd', '4th'][result.place]}.`}`);
    g.racePrize(result.place);
    return;
  }
}
function runRace(g) {
  return new Promise(resolve => {
    race = new TractorRace({
      renderer, root: app, input, mode: session.mode, bear: g.bear, difficulty: session.difficulty,
      callbacks: {
        onToggleMusic: () => toggleMusic(),
        onPause: async () => {
          stopMusic();
          let v;
          while ((v = await screens.pause(null)) === 'controls') await screens.controls();
          if (v === 'resume') { screens.hide(); input.reset(); race.paused = false; startMusic(RACE.music); return; }
          endRace(); resolve(null); quitToMenu();
        },
        onEnd: r => { endRace(); resolve(r); },
      },
    });
    app.insertBefore(race.canvas, ui);
    resize();
    race.render();
    screens.intro({ id: 'TRACTOR RACE', name: RACE.name, howto: HOWTO_RACE[session.mode] }).then(() => {
      if (!race) return;
      screens.hide(); input.reset(); startMusic(RACE.music); race.start();
    });
  });
}
function endRace() { race?.dispose(); race = null; resize(); }

function quitToMenu() {
  race?.dispose(); race = null;
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


// ---------- leaving the tab or the window ----------
// Another tab, another window or the screen locking pauses the level (as Esc does) and silences the sound. In a
// hidden tab the browser slows the timers down, and the music used to come back in bursts.
function pauseFromOutside() {
  if (race && !race.paused && !race.over) { race.paused = true; race.callbacks.onPause(); }
  else if (game && !game.paused) pause();
  else if (bonus && !bonus.paused && !bonus.over) { bonus.paused = true; bonus.callbacks.onPause(); }
}
document.addEventListener('visibilitychange', () => {
  suspendAudio(document.hidden);
  if (document.hidden) pauseFromOutside();
});
window.addEventListener('blur', pauseFromOutside);

// ---------- loop ----------
let last = performance.now();
function frame(now) {
  // Game time follows real time even on a slow computer: a long frame is played as several short steps
  // (before, a slow frame made the whole game run in slow motion, as if wading in mud).
  let dt = Math.min(0.12, (now - last) / 1000);
  last = now;
  if (race) {
    while (dt > 0.0001) { const step = Math.min(dt, 1 / 40); race?.update(step); dt -= step; }
    race?.render();
  } else if (game) {
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
window.__orsi = { get game() { return game; }, get bonus() { return bonus; }, get race() { return race; }, tractorRace, session: () => session, levels: LEVELS, startLevel, startBonus, unlockBonus };
