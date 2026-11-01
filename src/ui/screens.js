// Full-screen pages, DOOM-style: a big title picture, then menus of a few huge words with a paw cursor.
// Game text is in English (like the drawings); instructions (the controls page) stay in Italian.
// Little text: hints are given in the game as short messages. Each page returns a Promise with the choice.
// Keys: ↑ ↓ (or ← →) + ENTER, digits for numbered choices, ESC = back. Mouse works too.
import { BEARS } from '../../data/bears.js';
import { DIFFICULTIES, DEFAULT_DIFFICULTY } from '../../data/difficulty.js';
import { bearCover, bearPajama } from '../art/bear.js';
import { flyerHtml, animateFlyer, hasAnimatedCover } from './flyer.js';
import { assetUrl } from '../art/registry.js';
import { play } from '../audio.js';
import { pillowsHtml } from './hud.js';


const key = k => `<kbd>${k}</kbd>`;
const CONTROLS = `
  <div class="keys-grid">
    <div class="col"><h3>DA SOLO</h3>
      <p>${key('↑')}${key('↓')} <b>AVANTI</b></p>
      <p>${key('←')}${key('→')} <b>GIRA</b></p>
      <p>${key('A')}${key('D')} o ${key('SHIFT')}+${key('←')}${key('→')} <b>SCHIVA</b></p>
      <p>${key('SPAZIO')} <b>SPARA</b></p>
      <p>${key('ALT GR')} o ${key('INVIO')} <b>SALTA</b></p>
      <p>${key('Q')}${key('E')} o ${key('1')}-${key('9')} <b>ARMI</b> ${key('0')} <b>ARMI BONUS</b></p>
      <p>${key('TAB')} <b>MAPPA</b> (tienilo premuto)</p></div>
    <div class="col"><h3>IN DUE</h3>
      <p class="who">CHI GUIDA</p>
      <p>${key('↑')}${key('↓')} <b>AVANTI</b></p>
      <p>${key('←')}${key('→')} <b>SCHIVA</b></p>
      <p>${key('ALT GR')} <b>SALTA</b></p>
      <p class="who">CHI SPARA</p>
      <p>${key('A')}${key('D')} <b>MIRA</b></p>
      <p>${key('SPAZIO')} <b>SPARA</b> ${key('Q')}${key('E')} <b>ARMI</b></p></div>
  </div>
  <p class="keys-foot">${key('ESC')} PAUSA · ${key('M')} MUSICA</p>`;

const item = (v, label, extra = '') => `<button class="mi" data-v="${v}"${extra}>${label}</button>`;
const back = item('back', '‹ BACK', ' data-small');

export function createScreens(root) {
  const el = document.createElement('div');
  el.className = 'screen';
  root.appendChild(el);
  let cleanup = null;

  // bind(e, done): page-specific keys; return false to skip the arrow navigation.
  // `backdrop` = a picture instead of the cover behind the page (e.g. the episode map between levels)
  function show(html, cls, bind, { flyer = true, backdrop = null } = {}) {
    cleanup?.();
    el.className = `screen show ${cls}`;
    const back = backdrop ? `<img class="backdrop" src="${backdrop}" alt="">` : flyer ? flyerHtml({ title: cls === 'title' }) : '';
    el.innerHTML = `${back}<div class="page">${html}</div>`;
    const stopFlyer = flyer && !backdrop ? animateFlyer(el, { still: cls !== 'title' }) : () => {};
    return new Promise(resolve => {
      const done = v => { cleanup?.(); cleanup = null; if (v !== 'start') play(v === 'back' ? 'menu' : 'select'); resolve(v); };
      const onClick = e => {
        const b = e.target.closest('[data-v]');
        if (b) { e.stopPropagation(); done(b.dataset.v); }
      };
      const onOver = e => { const b = e.target.closest('button[data-v]'); if (b && b !== document.activeElement) b.focus(); };
      const onFocus = e => { if (e.target.matches?.('button[data-v]')) play('menu'); };
      const onKey = e => {
        if (bind?.(e, done) === false) return;
        if (e.code === 'Escape' && el.querySelector('[data-v="back"]')) { e.preventDefault(); done('back'); return; }
        // ENTER or SPACE confirm the focused button (the game's keyboard handler stops the browser from doing it).
        // Not a held key: the fire or jump key still down from the game must not skip the page.
        const focused = document.activeElement;
        if (['Enter', 'NumpadEnter', 'Space'].includes(e.code) && !e.repeat && focused?.matches('[data-v]') && el.contains(focused)) {
          e.preventDefault(); done(focused.dataset.v); return;
        }
        const buttons = [...el.querySelectorAll('button[data-v]')];
        if (!buttons.length) return;
        const i = buttons.indexOf(document.activeElement);
        if (['ArrowDown', 'ArrowRight'].includes(e.code)) { buttons[(i + 1) % buttons.length].focus(); e.preventDefault(); }
        if (['ArrowUp', 'ArrowLeft'].includes(e.code)) { buttons[(i - 1 + buttons.length) % buttons.length].focus(); e.preventDefault(); }
      };
      el.addEventListener('click', onClick);
      el.addEventListener('mouseover', onOver);
      el.addEventListener('focusin', onFocus);
      window.addEventListener('keydown', onKey);
      cleanup = () => {
        stopFlyer();
        el.removeEventListener('click', onClick); el.removeEventListener('mouseover', onOver);
        el.removeEventListener('focusin', onFocus); window.removeEventListener('keydown', onKey);
      };
      requestAnimationFrame(() => (el.querySelector('button[data-default]') || el.querySelector('button[data-v]'))?.focus({ preventScroll: true }));
    });
  }

  const menu = (title, items, bind, cls = '') => show(`
    <div class="doom-menu ${cls}">
      ${title ? `<h2 class="menu-title">${title}</h2>` : ''}
      <nav class="menu-list">${items.join('')}</nav>
    </div>`, 'menu', bind);

  return {
    hide() { cleanup?.(); cleanup = null; el.className = 'screen'; el.innerHTML = ''; },

    // The title picture alone; any key or click goes on.
    title() {
      // The animated cover writes PRESS ANY KEY itself.
      const press = hasAnimatedCover() ? '' : '<span class="press">PRESS ANY KEY</span>';
      return show(`<button class="title-hit" data-v="start" aria-label="Press any key">${press}</button>`, 'title', (e, done) => { done('start'); return false; });
    },

    main(hasSave, hasBonus = false) {
      return menu('', [
        item('play', 'NEW GAME'),
        item('learn', 'LEARN'),
        hasSave ? item('continue', 'CONTINUE') : '',
        hasBonus ? item('bonus', 'BONUS: SWEET SHOT') : '',
        item('code', 'PASSWORD'),
        item('controls', 'CONTROLS'),
      ], (e, done) => { if (e.code === 'Escape') { done('title'); return false; } }, 'main');
    },

    controls() {
      return show(`<div class="doom-menu"><h2 class="menu-title">COMANDI</h2>${CONTROLS}<nav class="menu-list">${back}</nav></div>`, 'menu');
    },

    mode() {
      return menu('HOW MANY PLAYERS?', [item('solo', '1 PLAYER'), item('coop', '2 PLAYERS'), back], (e, done) => {
        if (e.code === 'Digit1') done('solo');
        if (e.code === 'Digit2') done('coop');
      });
    },

    bear() {
      return show(`<div class="doom-menu"><h2 class="menu-title">CHOOSE YOUR BEAR</h2>
        <div class="bears">${BEARS.map(b => `<button class="bear-card" data-v="${b.id}">${bearCover(b, { title: false })}<b>${b.name.toUpperCase()}</b></button>`).join('')}</div>
        <nav class="menu-list">${back}</nav></div>`, 'menu', (e, done) => {
        const n = { Digit1: 0, Digit2: 1, Digit3: 2 }[e.code];
        if (n !== undefined) done(BEARS[n].id);
      });
    },

    difficulty() {
      return menu('HOW SLEEPY ARE YOU?', [
        ...DIFFICULTIES.map((d, i) => item(String(i), d.name.toUpperCase(), i === DEFAULT_DIFFICULTY ? ' data-default' : '')),
        back,
      ], (e, done) => {
        const n = /^Digit([1-9])$/.exec(e.code);
        if (n && DIFFICULTIES[+n[1] - 1]) done(String(+n[1] - 1));
      }).then(v => (v === 'back' ? 'back' : Number(v)));
    },

    code(error = '') {
      const p = show(`<div class="doom-menu"><h2 class="menu-title">PASSWORD</h2>
        <input class="code-input" maxlength="15" autocomplete="off" spellcheck="false" aria-label="Password" placeholder="XXXX-XXXX-XXXXX">
        ${error ? '<p class="err">WRONG PASSWORD</p>' : ''}
        <nav class="menu-list">${item('ok', 'GO')}${back}</nav></div>`, 'menu', (e, done) => {
        if (e.code === 'Enter' && document.activeElement?.classList.contains('code-input')) { done('ok'); return false; }
        if (document.activeElement?.classList.contains('code-input') && e.code !== 'Escape') return false;
      });
      const input = el.querySelector('.code-input');
      requestAnimationFrame(() => input.focus());
      return p.then(v => ({ v, text: input.value }));
    },

    // Level card, like DOOM's "entering": just the name. ENTER, SPACE or a click starts.
    intro(level) {
      return show(`<div class="level-card"><p class="lvl">${level.id}</p><h2>${level.name.toUpperCase()}</h2>
        ${level.howto ? `<p class="howto">${level.howto}</p>` : ''}
        <button class="go" data-v="go">GO!</button></div>`, 'menu', (e, done) => {
        if ((e.code === 'Enter' || e.code === 'Space') && !e.repeat) { e.preventDefault(); done('go'); return false; }
      });
    },

    pause(code) {
      return show(`<div class="doom-menu"><h2 class="menu-title">PAUSED</h2>
        <nav class="menu-list">${item('resume', 'RESUME')}${item('controls', 'CONTROLS')}${item('menu', 'QUIT')}</nav>
        ${code ? `<p class="code-line">PASSWORD <b>${code}</b></p>` : ''}</div>`, 'menu', (e, done) => {
        if (e.code === 'Escape') { done('resume'); return false; }
      });
    },

    sleep(bear, lives) {
      // Claude Design's three frames: yawn, nightgown, asleep. Otherwise the coded pyjama bear.
      const frames = [1, 2, 3].map(f => assetUrl(`characters/${bear.id}/goodnight_f_${f}`));
      const drawn = frames.every(Boolean);
      const art = drawn ? `<img class="gn" src="${frames[0]}" alt="">` : bearPajama(bear);
      const p = show(`<div class="sleep"><div class="pj">${art}</div>
        <h2>GOODNIGHT…</h2><div class="pillows">${pillowsHtml(lives)}</div>
        <nav class="menu-list">${item('next', 'NEXT')}</nav></div>`, 'night', null, { flyer: false });
      const gn = el.querySelector('.gn');
      const timers = drawn ? [setTimeout(() => { gn.src = frames[1]; }, 900), setTimeout(() => { gn.src = frames[2]; }, 1800)] : [];
      timers.push(setTimeout(() => el.querySelector('[data-v="next"]')?.click(), 4200));
      return p.then(v => { timers.forEach(clearTimeout); return v; });
    },

    report(s, level, { secret = false, nextName = null, training = false } = {}) {
      const pct = (a, b) => (b ? Math.round((a / b) * 100) : 100);
      const mmss = t => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
      const rows = [['CAUGHT', pct(s.kills, s.totalKills)], ['ITEMS', pct(s.items, s.totalItems)], ['SECRETS', pct(s.secrets, s.totalSecrets)]];
      const p = show(`<div class="doom-menu report"><p class="lvl">${level.name.toUpperCase()}</p><h2 class="menu-title">${training ? 'TRAINING COMPLETE!' : 'LEVEL COMPLETE!'}</h2>
        <table>${rows.map(([n, v]) => `<tr><td>${n}</td><td data-count="${v}">0%</td></tr>`).join('')}
          ${s.totalTricks ? `<tr><td>TRICK</td><td class="trick">${s.tricks ? '★' : '—'}</td></tr>` : ''}
          <tr><td>TIME</td><td>${mmss(s.time)}</td></tr><tr class="par"><td>PAR</td><td>${mmss(level.par)}</td></tr></table>
        ${secret ? '<p class="lvl secret-exit">SECRET EXIT!</p>' : ''}
        <nav class="menu-list">${training
          ? `${item('play', 'START THE GAME!')}${item('again', 'TRAIN AGAIN')}${item('menu', 'MENU')}`
          : `${item('next', nextName ? `NEXT: ${nextName.toUpperCase()}` : 'THE END')}${item('again', 'PLAY AGAIN')}${item('menu', 'MENU')}`}</nav></div>`, 'menu', null,
        { backdrop: assetUrl('screens/intermission/background') }); // DOOM's episode map between levels, once drawn
      // DOOM intermission: the percentages count up.
      const cells = [...el.querySelectorAll('[data-count]')];
      const t0 = performance.now();
      const tick = now => {
        const k = Math.min(1, (now - t0) / 1400);
        for (const c of cells) c.textContent = `${Math.round(+c.dataset.count * k)}%`;
        if (k < 1 && cells[0]?.isConnected) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      return p;
    },

    // SWEET SHOT: which of the three bonus levels
    bonusLevels(levels) {
      return menu('SWEET SHOT', [...levels.map((l, i) => item(String(i), `${i + 1}. ${l.name.toUpperCase()}`)), back], (e, done) => {
        const n = /^Digit([1-9])$/.exec(e.code);
        if (n && levels[+n[1] - 1]) done(String(+n[1] - 1));
      }).then(v => (v === 'back' ? 'back' : Number(v)));
    },

    // SWEET SHOT: the result, with up to three stars
    bonusResult(r, hasNext) {
      const stars = [1, 2, 3].map(i => `<span class="star${i <= r.stars ? ' on' : ''}">★</span>`).join('');
      return show(`<div class="doom-menu report"><p class="lvl">${r.level.name.toUpperCase()}</p>
        <h2 class="menu-title">${r.stars ? 'BONUS COMPLETE!' : 'NOT ENOUGH BIRDS...'}</h2>
        <p class="stars">${stars}</p>
        <table><tr><td>BIRDS</td><td>${r.hits} / ${r.goal}</td></tr><tr><td>SCORE</td><td>${r.score}</td></tr></table>
        <nav class="menu-list">${r.stars && hasNext ? item('next', 'NEXT BONUS') : ''}${item('again', 'TRY AGAIN')}${item('menu', 'MENU')}</nav></div>`, 'menu');
    },

    // End of the episode, like DOOM's text screen after E1M8: a few lines that type themselves, then the menu.
    // A small present waits at the top: opened, it tells about the real match and links to its highlights.
    async ending(ep) {
      const bg = assetUrl('screens/ending/background');
      const lines = ep.ending || [];
      const gift = ep.gift;
      let opened = false;
      for (let first = true; ; first = false) {
        const giftImg = gift && assetUrl(`hud/gift/${opened ? 'open' : 'closed'}`);
        const giftHtml = !gift ? '' : opened
          ? `<div class="gift-card">${giftImg ? `<img src="${giftImg}" alt="">` : ''}<div><h3>${gift.title}</h3>${gift.lines.map(l => `<p>${l}</p>`).join('')}
              ${item('watch', 'WATCH THE HIGHLIGHTS ▶', ' data-small')}</div></div>`
          : `<button class="gift" data-v="gift">${giftImg ? `<img src="${giftImg}" alt="">` : '🎁'}<span>OPEN THE GIFT</span></button>`;
        const p = show(`<div class="ending${first ? '' : ' still'}"${bg ? ` style="background-image:url('${bg}')"` : ''}>${giftHtml}
          <div class="ending-text">${lines.map(l => `<p>${l}</p>`).join('')}</div>
          <nav class="menu-list">${item('next', 'NEXT', ' data-default')}</nav></div>`, 'night', null, { flyer: false });
        el.querySelectorAll('.ending-text p').forEach((q, i) => { q.style.animationDelay = first ? `${i * 1.1}s` : '0s'; });
        const v = await p;
        if (v === 'gift') { opened = true; continue; }
        if (v === 'watch') { window.open(gift.url, '_blank', 'noopener,noreferrer'); continue; }
        return v;
      }
    },

    // "To be continued": the next episode's picture with one line.
    teaser(ep) {
      const bg = assetUrl('screens/episode2/background');
      return show(`<div class="ending teaser"${bg ? ` style="background-image:url('${bg}')"` : ''}>
        <h2 class="teaser-text">${ep.teaser || ''}</h2>
        <nav class="menu-list">${item('menu', 'MENU')}</nav></div>`, 'night', null, { flyer: false });
    },

    lose() {
      return show(`<div class="lose-wrap"><h1 class="lose">YOU LOSE</h1>
        <nav class="menu-list">${item('again', 'TRY AGAIN')}${item('menu', 'MENU')}</nav></div>`, 'black', null, { flyer: false });
    },
  };
}
