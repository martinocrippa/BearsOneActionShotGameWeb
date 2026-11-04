// Messages over everything for what the game cannot fix on its own:
// - showNotice: no 3D graphics at all, or the graphics card reset in the middle of a level (a driver update, the
//   computer waking from sleep, too many tabs). The second one offers RICARICA: the checkpoint is saved.
// - reportError: something broke in the code. One small note at the bottom, once, and the game goes on if it can.
let box = null;
export function showNotice(title, text, { reload = false } = {}) {
  box?.remove();
  box = document.createElement('div');
  box.className = 'notice';
  box.setAttribute('role', 'alertdialog');
  box.setAttribute('aria-labelledby', 'notice-title');
  box.innerHTML = `<div class="notice-card"><h2 id="notice-title"></h2><p></p>${reload ? '<button type="button">RICARICA</button>' : ''}</div>`;
  box.querySelector('h2').textContent = title;
  box.querySelector('p').textContent = text;
  const button = box.querySelector('button');
  button?.addEventListener('click', () => location.reload());
  document.body.appendChild(box);
  button?.focus();
}

let reported = false;
export function reportError() {
  if (reported) return;
  reported = true;
  const note = document.createElement('div');
  note.className = 'notice-toast';
  note.setAttribute('role', 'status');
  note.textContent = 'Qualcosa si è inceppato. Se il gioco si blocca, premi F5: riparti dall’ultimo punto salvato.';
  document.body.appendChild(note);
  setTimeout(() => note.remove(), 8000);
}
