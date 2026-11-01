// DOOM-style status bar at the bottom: ammo · SLEEP · face · chocolate (armour) · keys · weapons.
// Plus messages, pop-ups ("YOU GOT THE GOLDEN ACORN!"), screen flashes, splats on the screen when hit and
// the mud band when wading, the licorice when tied up, and the automap (TAB). Uses Claude Design's drawings
// (faces, pillows, crosshair, pop-ups) when they are in public/assets, the coded placeholders otherwise.
import { WEAPONS, AMMO } from '../../data/weapons.js';
import { bearFace } from '../art/bear.js';
import { assetUrl } from '../art/registry.js';
import { splatOf, SPLAT_COLORS } from '../art/sprites.js';
import { HIT_FLASH } from '../art/placeholders.js';
import { KEYS, ITEMS } from '../../data/items.js';
import { CELL } from '../core/level.js';

const PILLOW = '<svg viewBox="0 0 40 28" aria-hidden="true"><path d="M4 6 C14 2 26 2 36 6 C38 14 38 18 36 24 C26 28 14 28 4 24 C2 18 2 12 4 6 Z" fill="#fff" stroke="#111" stroke-width="3"/><path d="M12 12 H28 M12 18 H24" stroke="#8fb8ff" stroke-width="2.5"/></svg>';
const ACORN = '<svg viewBox="0 0 40 48"><path d="M8 20 C8 44 32 44 32 20 Z" fill="#ffd400" stroke="#111" stroke-width="3"/><path d="M5 22 C3 8 37 8 35 22 Z" fill="#a0632d" stroke="#111" stroke-width="3"/><rect x="18" y="2" width="4" height="8" fill="#6b3f1a"/></svg>';
const CUP = '<svg viewBox="0 0 40 40"><path d="M6 12 H30 L28 34 C27 37 9 37 8 34 Z" fill="#e3262b" stroke="#111" stroke-width="3"/><path d="M30 16 C38 16 38 28 29 28" fill="none" stroke="#111" stroke-width="3"/><path d="M12 4 q3 4 0 7 M20 3 q3 4 0 7" fill="none" stroke="#111" stroke-width="2.5"/></svg>';
const MAX_LIVES = 3;

const img = (url, cls = '') => `<img src="${url}" alt="" class="${cls}">`;

// The lives as pillows (HUD and the GOODNIGHT screen): the drawn full/used pillows, else coded ones.
export function pillowsHtml(n) {
  const full = assetUrl('hud/pillow/full'), used = assetUrl('hud/pillow/used');
  if (!full) return PILLOW.repeat(Math.max(0, n));
  return Array.from({ length: MAX_LIVES }, (_, i) => img(i < n ? full : used || full, i < n ? '' : 'used')).join('');
}

export function createHud(root) {
  // the key's drawing, else a token of its colour (the golden acorn has its own placeholder)
  const keyIcon = id => (assetUrl(`items/${id}`) ? img(assetUrl(`items/${id}`))
    : id === 'ghianda' ? ACORN
      : `<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="15" fill="${KEYS[id]?.color || '#ccc'}" stroke="#111" stroke-width="3"/></svg>`);
  const cupIcon = assetUrl('items/cioccolata') ? img(assetUrl('items/cioccolata')) : CUP;
  root.insertAdjacentHTML('beforeend', `
    <div class="vignette"></div><div class="mud-band"></div><div class="trapped"></div><div class="splats"></div><div class="flash"></div><canvas class="automap"></canvas><div class="tags"></div><div class="instruct"></div>
    <div class="crosshair${assetUrl('hud/crosshair/idle') ? ' drawn' : ''}">${assetUrl('hud/crosshair/idle') ? img(assetUrl('hud/crosshair/idle')) : ''}</div>
    <div class="messages"></div>
    <div class="popup"></div>
    <div class="hud">
      <div class="hud-cell hud-ammo"><b></b><span></span></div>
      <div class="hud-cell hud-sleep"><span class="lbl">SLEEP</span><div class="bar"><i></i><em>Zzz…</em></div><span class="lives"></span></div>
      <div class="hud-cell hud-face"></div>
      <div class="hud-cell hud-armor"><span class="lbl">CHOCO</span><div class="cup">${cupIcon}<b>0%</b></div></div>
      <div class="hud-cell hud-keys"><span class="lbl">KEYS</span><div class="keys"></div></div>
      <div class="hud-cell hud-arms"><span class="lbl">WEAPONS</span><div class="slots">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<span data-slot="${n}">${n}</span>`).join('')}</div></div>
    </div>`);
  const $ = sel => root.querySelector(sel);
  const ammoNum = $('.hud-ammo b'), ammoLbl = $('.hud-ammo span');
  const bar = $('.hud-sleep .bar i'), lives = $('.hud-sleep .lives');
  const face = $('.hud-face'), keys = $('.hud-keys .keys'), armor = $('.hud-armor b'), armorCell = $('.hud-armor');
  const slots = [...root.querySelectorAll('.hud-arms [data-slot]')];
  const msgs = $('.messages'), flash = $('.flash'), vignette = $('.vignette'), hud = $('.hud'), popup = $('.popup');
  const tags = $('.tags'), instructEl = $('.instruct');
  let instructTimer = null;
  const splats = $('.splats'), sleepCell = $('.hud-sleep'), trappedEl = $('.trapped'), mapCanvas = $('.automap'), crosshair = $('.crosshair');
  let mapOn = false;
  const faceCache = new Map();
  let last = {}, popupTimer = null;

  function faceHtml(bear, mood) {
    const url = assetUrl(`hud/face_${bear.id}/${mood}`);
    if (url) return img(url);
    if (mood === 'trapped' || mood === 'fizz') return faceHtml(bear, 'colpito');
    return bearFace(bear, mood);
  }

  return {
    update({ bear, weapon, ammo, infinite, sleep, mood, keyList, owned }) {
      const w = WEAPONS[weapon];
      const ammoText = !w.ammo ? '∞' : infinite ? '∞' : String(ammo[w.ammo]);
      if (ammoText !== last.ammo) { ammoNum.textContent = ammoText; last.ammo = ammoText; }
      const lbl = w.ammo ? AMMO[w.ammo].label : 'PAW';
      if (lbl !== last.lbl) { ammoLbl.textContent = lbl; last.lbl = lbl; }
      const pct = Math.round(sleep.value);
      // the bar glows while the sleep goes up (mud, hits), so it is clear what is happening
      sleepCell.classList.toggle('rising', sleep.value > (last.sleepVal ?? sleep.value) + 0.001);
      last.sleepVal = sleep.value;
      if (pct !== last.pct) { bar.style.width = `${pct}%`; bar.parentElement.classList.toggle('high', pct >= 70); last.pct = pct; }
      if (sleep.lives !== last.lives) { lives.innerHTML = pillowsHtml(sleep.lives); last.lives = sleep.lives; }
      const arm = Math.round(sleep.armor);
      if (arm !== last.arm) { armor.textContent = `${arm}%`; armorCell.classList.toggle('empty', arm <= 0); last.arm = arm; }
      const fk = bear.id + mood;
      if (fk !== last.face) {
        if (!faceCache.has(fk)) faceCache.set(fk, faceHtml(bear, mood));
        face.innerHTML = faceCache.get(fk); last.face = fk;
      }
      const kk = keyList.join();
      if (kk !== last.keys) { keys.innerHTML = keyList.map(keyIcon).join('') || '<i class="empty"></i>'; last.keys = kk; }
      const ok = owned.join() + weapon;
      if (ok !== last.owned) {
        for (const s of slots) {
          const n = +s.dataset.slot;
          s.classList.toggle('owned', owned.some(k => WEAPONS[k].slot === n));
          s.classList.toggle('current', WEAPONS[weapon].slot === n);
        }
        last.owned = ok;
      }
      const vig = Math.min(0.85, (sleep.value / 100) ** 1.4).toFixed(2);
      if (vig !== last.vig) { vignette.style.opacity = vig; last.vig = vig; }
    },
    // A bigger instruction box at the top (training; Italian, it explains how to play).
    instruct(text) {
      instructEl.textContent = text;
      instructEl.classList.remove('show'); void instructEl.offsetWidth; instructEl.classList.add('show');
      clearTimeout(instructTimer);
      instructTimer = setTimeout(() => instructEl.classList.remove('show'), 9000);
    },
    message(text) {
      const p = document.createElement('p');
      p.textContent = text;
      msgs.prepend(p);
      while (msgs.children.length > 3) msgs.lastChild.remove();
      setTimeout(() => p.classList.add('gone'), 2800);
      setTimeout(() => p.remove(), 3400);
    },
    // Big drawn banner in the middle of the screen (Claude Design's hud/popup/<name>), if drawn.
    popup(name) {
      const url = assetUrl(`hud/popup/${name}`);
      if (!url) return;
      popup.innerHTML = img(url);
      popup.classList.remove('show'); void popup.offsetWidth; popup.classList.add('show');
      clearTimeout(popupTimer);
      popupTimer = setTimeout(() => popup.classList.remove('show'), 2200);
    },
    flash(kind) {
      flash.style.background = '';
      flash.className = 'flash'; void flash.offsetWidth;
      flash.classList.add(kind);
    },
    // Hit by an opponent's shot: strong flash, the shot splats on the screen, the SLEEP box jolts.
    hit(kind) {
      // the flash takes the colour of what hit (orange jam, yellow tea, green soup…)
      this.flash('hurt');
      flash.style.background = HIT_FLASH[kind] || '';
      const url = assetUrl(`projectiles/${kind}/splat_f_1`)
        || `data:image/svg+xml;charset=utf-8,${encodeURIComponent(splatOf(kind, SPLAT_COLORS[kind] || '#b48cff'))}`;
      const s = document.createElement('img');
      s.src = url; s.alt = '';
      s.style.left = `${25 + Math.random() * 50}%`; s.style.top = `${15 + Math.random() * 45}%`;
      s.style.setProperty('--rot', `${Math.round((Math.random() - 0.5) * 50)}deg`); // a little tilt: the words stay readable
      splats.append(s);
      while (splats.children.length > 4) splats.firstChild.remove();
      setTimeout(() => s.remove(), 1300);
      sleepCell.classList.remove('bump'); void sleepCell.offsetWidth; sleepCell.classList.add('bump');
    },
    // Wading in mud or water: a band of that colour at the bottom of the view (`kind` = the floor, false = out).
    mud(kind) {
      root.classList.toggle('in-mud', !!kind);
      root.classList.toggle('in-water', !!kind && kind !== 'fango');
    },
    // Tied up with licorice / stuck in jelly: the drawing over the edges of the view (null = free again).
    trapped(kind) {
      trappedEl.className = kind ? `trapped ${kind}` : 'trapped';
      const url = kind && assetUrl(`hud/trapped/${kind}`);
      trappedEl.innerHTML = url ? img(url) : '';
    },
    // A small caption that floats up above the weapon when something is picked up ("+12 AWAKE", "+15 CANDIES").
    tag(text, color = '#ffd400') {
      const t = document.createElement('p');
      t.textContent = text; t.style.color = color;
      tags.append(t);
      while (tags.children.length > 3) tags.firstChild.remove();
      setTimeout(() => t.remove(), 1400);
    },
    // Crosshair on the locked opponent (x, y in px of the 3D view), or back in the middle (null).
    aim(x, y) {
      const locked = x !== null && x !== undefined;
      crosshair.classList.toggle('locked', locked);
      crosshair.style.left = locked ? `${x}px` : '';
      crosshair.style.top = locked ? `${y}px` : '';
    },
    // DOOM's automap, shown while TAB is held down (letting go brings the game back: no one gets stuck in it)
    showMap(on) { mapOn = on; mapCanvas.classList.toggle('show', on); },
    // DOOM's automap: the walls the bear has seen (all of them with the map item), doors in their key's colour,
    // the keys still to pick up (a dot of the same colour) and the exits.
    drawMap(game) {
      if (!mapOn) return;
      const lv = game.level, w = mapCanvas.clientWidth, h = mapCanvas.clientHeight;
      if (mapCanvas.width !== w || mapCanvas.height !== h) { mapCanvas.width = w; mapCanvas.height = h; }
      const ctx = mapCanvas.getContext('2d');
      ctx.clearRect(0, 0, w, h);
      const s = Math.min(w / lv.width, h / lv.height) * 0.94, ox = (w - lv.width * s) / 2, oy = (h - lv.height * s) / 2;
      const seen = (cx, cz) => game.mapAll || game.seen.has(cx + ',' + cz);
      for (const c of lv.cells) {
        if (!seen(c.cx, c.cz)) continue;
        const x = ox + c.cx * s, y = oy + c.cz * s;
        if (c.door) ctx.fillStyle = c.open ? '#e8dcc0' : KEYS[c.door.key]?.color || '#a0632d';
        else if (c.wall && !c.secret && !(c.mover && c.open)) {
          // only the walls that border an open cell
          const edge = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => { const n = lv.at(c.cx + dx, c.cz + dz); return n && !n.wall; });
          if (!edge) continue;
          ctx.fillStyle = '#111';
        } else ctx.fillStyle = c.fx?.liquid ? '#8fb8ff' : c.h > 0.3 ? '#d9c7a0' : '#efe4c8';
        ctx.fillRect(x, y, s + 0.5, s + 0.5);
      }
      for (const it of game.items) {
        const key = !it.taken && ITEMS[it.id]?.key;
        if (!key || !seen(Math.floor(it.x / CELL), Math.floor(it.z / CELL))) continue;
        ctx.fillStyle = KEYS[key]?.color || '#ffd400'; ctx.strokeStyle = '#111'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(ox + (it.x / CELL) * s, oy + (it.z / CELL) * s, Math.max(4, s * 0.7), 0, 7); ctx.fill(); ctx.stroke();
      }
      for (const ex of game.exits) if (seen(ex.cx, ex.cz)) { ctx.fillStyle = ex.secret ? '#1f5fbf' : '#e3262b'; ctx.fillRect(ox + ex.cx * s, oy + ex.cz * s, s, s); }
      const p = game.player, px = ox + (p.x / CELL) * s, pz = oy + (p.z / CELL) * s;
      ctx.save(); ctx.translate(px, pz); ctx.rotate(-p.yaw);
      ctx.fillStyle = '#ff2d8a'; ctx.strokeStyle = '#111'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, -s * 0.9); ctx.lineTo(s * 0.55, s * 0.6); ctx.lineTo(-s * 0.55, s * 0.6); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.restore();
    },
    set visible(v) { root.classList.toggle('playing', v); hud.style.display = v ? '' : 'none'; },
  };
}
