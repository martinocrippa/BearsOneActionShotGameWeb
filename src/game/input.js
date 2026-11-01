// Keyboard only, like the original DOOM: no mouse aiming (hard for kids), the aim is helped automatically.
// Alone: arrows move and turn, A/D dodge (or SHIFT + ← →), SPACE shoots, ALT GR jumps (ENTER too).
// Two players on one keyboard: the driver (right hand) moves, dodges and jumps with arrows + ALT GR;
// the shooter (left hand) turns to aim with A/D, shoots with SPACE and changes weapon with Q/E.

const PREVENT = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Tab', 'Enter', 'NumpadEnter', 'AltRight', 'AltLeft']);

export function createInput() {
  const down = new Set();
  const events = [];

  const onKeyDown = e => {
    if (PREVENT.has(e.code)) e.preventDefault();
    // No browser shortcuts while playing: on Windows ALT GR (jump) also holds CTRL, and CTRL with + - 0 zooms the
    // page, CTRL with a digit switches tab... Typing in a text box (the password) is left alone.
    if ((e.ctrlKey || e.metaKey) && !(e.target instanceof HTMLInputElement)) e.preventDefault();
    if (!e.repeat) events.push({ code: e.code, key: e.key });
    down.add(e.code);
  };
  const onKeyUp = e => { if (PREVENT.has(e.code)) e.preventDefault(); down.delete(e.code); };
  const onBlur = () => down.clear();
  // CTRL + mouse wheel would zoom the page too
  const onWheel = e => { if (e.ctrlKey) e.preventDefault(); };

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', onBlur);
  window.addEventListener('wheel', onWheel, { passive: false });

  return {
    isDown: code => down.has(code),
    any: (...codes) => codes.some(c => down.has(c)),
    // SPACE only: on Windows ALT GR also sends a fake left CTRL, so CTRL must not shoot (every jump would fire).
    get firing() { return down.has('Space'); },
    takeEvents() { return events.splice(0); },
    // Forget keys held from the menus (ENTER/SPACE that started the level must not jump or shoot).
    reset() { down.clear(); events.length = 0; },
    dispose() {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('wheel', onWheel);
    },
  };
}

// Movement intent for this frame: forward/back, strafe (dodge) and turning (aim).
export function readMove(input, mode) {
  const f = (input.any('ArrowUp', 'KeyW') ? 1 : 0) - (input.any('ArrowDown', 'KeyS') ? 1 : 0);
  const arrows = (input.isDown('ArrowRight') ? 1 : 0) - (input.isDown('ArrowLeft') ? 1 : 0);
  const ad = (input.isDown('KeyD') ? 1 : 0) - (input.isDown('KeyA') ? 1 : 0);
  const jump = input.any('AltRight', 'Enter', 'NumpadEnter');
  // Alone the arrows turn (DOOM) and A/D dodge; holding SHIFT the arrows dodge too (DOOM's strafe key).
  // In two the shooter turns with A/D and the driver dodges with the arrows.
  if (mode === 'coop') return { f, strafe: arrows, turn: ad, jump };
  if (input.any('ShiftLeft', 'ShiftRight')) return { f, strafe: Math.max(-1, Math.min(1, ad + arrows)), turn: 0, jump };
  return { f, strafe: ad, turn: arrows, jump };
}
