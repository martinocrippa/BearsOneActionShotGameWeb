// Smoke test in a real browser (Microsoft Edge already installed on Windows, via playwright-core).
// Plays through the menus, walks, shoots, uses a cheat, falls asleep, finishes the level, taking screenshots.
// Usage: start `npm run dev`, then `node scripts/smoke.mjs [outDir]`.
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const URL = process.env.ORSI_URL || 'http://127.0.0.1:5180/';
const out = process.argv[2] || 'smoke-shots';
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
page.on('console', m => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });

const shot = async name => { await page.screenshot({ path: `${out}/${name}.png` }); console.log('shot', name); };
const wait = ms => page.waitForTimeout(ms);
const game = (fn, arg) => page.evaluate(fn, arg);

await page.goto(URL);
await page.waitForSelector('.screen.show button');
await wait(800);
await shot('01-title');
await page.keyboard.press('Enter');
await page.waitForSelector('button[data-v="play"]');
await wait(300);
await shot('01b-menu');
await page.click('button[data-v="play"]');
await page.click('button[data-v="solo"]');
await wait(400);
await shot('02-bears');
await page.click('button[data-v="piccolo"]');
await page.waitForSelector('button[data-v="1"]');
await wait(200);
await shot('02b-difficulty');
await page.click('button[data-v="2"]'); // normal: the smoke test checks the game as designed
await page.waitForSelector('button[data-v="go"]', { timeout: 20000 });
await shot('03-intro');
await page.click('button[data-v="go"]');
await wait(1200);
await shot('04-start');

// walk north out of the den
await page.keyboard.down('ArrowUp'); await wait(1600); await page.keyboard.up('ArrowUp');
await wait(300);
await shot('05-walk');

// stand 6 m in front of an opponent, aim at it and shoot: one per weapon
const aimAt = (kind, weaponKey) => game(([kind, weaponKey]) => {
  const g = window.__orsi.game, p = g.player;
  const e = g.enemies.find(x => !x.out && x.kind === kind);
  if (!e) return false;
  // a free spot 4-6 m away with nothing solid in between
  const free = (x, z) => { const c = g.level.at(Math.floor(x / 2), Math.floor(z / 2)); return c && !c.wall && Math.abs(c.h - e.y) < 0.4; };
  let spot = null;
  for (const d of [6, 5, 4]) for (const [dx, dz] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
    if (spot) break;
    let ok = true;
    for (let t = 1; t <= d; t += 0.5) if (!free(e.x + dx * t, e.z + dz * t)) ok = false;
    if (ok) spot = { x: e.x + dx * d, z: e.z + dz * d };
  }
  if (!spot) return false;
  Object.assign(p, { x: spot.x, z: spot.z, y: e.y, vy: 0, pitch: 0, yaw: Math.atan2(-(e.x - spot.x), -(e.z - spot.z)) });
  p.sleep.god = true;
  e.state = 'idle';
  g.selectWeapon(weaponKey);
  return true;
}, [kind, weaponKey]);
async function shootUntilOut(kind, weaponKey, maxShots, name) {
  await aimAt(kind, weaponKey);
  for (let i = 0; i < maxShots; i++) {
    await page.keyboard.down('Space'); await wait(80); await page.keyboard.up('Space'); await wait(weaponKey === 'gelatina' ? 60 : 650);
    const done = await game(() => window.__orsi.game.enemies.some(e => e.out && e.wordT > 1));
    if (done) break;
  }
  await wait(250);
  await shot(name);
}
await page.keyboard.type('idkfa');
await shootUntilOut('scoiattolo', 'fionda', 8, '06-fionda');
await shootUntilOut('scoiattolo', 'sparaconfetti', 6, '07-confetti');
await shootUntilOut('puzzola', 'gelatina', 40, '08-gelatina');
await shootUntilOut('scoiattolo', 'zampata', 8, '08b-zampata');
await game(() => { const g = window.__orsi.game; g.player.sleep.god = false; g.player.sleep.value = 55; Object.assign(g.player, { x: 26 * 2 + 1, z: 14 * 2 + 1, y: 0, yaw: 0.2 }); });
await wait(700);
await shot('08c-courtyard');

// secret hedge east of the corridor, then the secret spot in the niche
await game(() => { const g = window.__orsi.game; Object.assign(g.player, { x: 23 * 2 + 1, z: 18 * 2 + 1, y: 0, yaw: -Math.PI / 2 }); });
await page.keyboard.down('ArrowUp'); await wait(4000); await page.keyboard.up('ArrowUp');
await shot('08d-secret');
// the log door (we have the acorn from IDKFA)
await game(() => { const g = window.__orsi.game; Object.assign(g.player, { x: 5 * 2 + 2, z: 9 * 2 + 1.5, y: 0, yaw: 0 }); });
await page.keyboard.down('ArrowUp'); await wait(1500); await page.keyboard.up('ArrowUp');
await shot('08e-door');

const state = await game(() => {
  const g = window.__orsi.game;
  return { kills: g.stats.kills, total: g.stats.totalKills, sleep: Math.round(g.player.sleep.value), weapons: g.player.weapons, keys: [...g.player.keys], effects: g.enemies.filter(e => e.out).map(e => `${e.kind}:${e.effect}`), secrets: g.stats.secrets, doorsOpen: g.doors.every(d => d.cell.open), secretWallOpen: g.secretWalls.every(s => s.cell.open), password: g.password() };
});
console.log('state', JSON.stringify(state));

// fall asleep
await game(() => { const g = window.__orsi.game; g.player.sleep.god = false; g.player.sleep.value = 98; g.addPlayerSleep(10); });
await page.waitForSelector('.screen.night', { timeout: 5000 });
await wait(400);
await shot('09-buonanotte');
await page.click('button[data-v="next"]');
await wait(800);
await shot('10-respawn');
await page.keyboard.press('Escape');
await page.waitForSelector('button[data-v="resume"]', { timeout: 5000 });
await shot('10b-pause');
await page.click('button[data-v="resume"]');
await wait(300);

// go to the exit
await game(() => { const g = window.__orsi.game; const e = g.exits[0]; Object.assign(g.player, { x: e.x, z: e.z + 2.2, yaw: 0 }); });
await page.keyboard.down('ArrowUp'); await wait(900); await page.keyboard.up('ArrowUp');
await page.waitForSelector('.report', { timeout: 8000 });
await wait(1800);
await shot('11-report');

// E1M2: the hidden bonus room door, then the TRACTOR RACE won, its golden spade on three opponents
const check = (ok, what) => { if (!ok) errors.push(`check: ${what}`); };
await game(() => { window.__orsi.startLevel(1, 'piccolo', 'solo', 1, null); });
await page.waitForSelector('button[data-v="go"]', { timeout: 20000 });
await page.click('button[data-v="go"]');
await wait(1500);
const bonusDoor = () => game(() => { const g = window.__orsi.game, d = g.doors.find(x => x.cell.door.bonus); return d && { x: d.mesh.position.x, z: d.mesh.position.z, look: d.cell.door.look?.style, open: d.cell.open, found: !!d.cell.door.found }; });
const door = await bonusDoor();
check(door?.look, 'the bonus door is dressed as a wall');
// from 6 m east of it (the room is to the west): the Topo calls, the door opens at a touch
await game(([x, z]) => { const p = window.__orsi.game.player; p.sleep.god = true; Object.assign(p, { x: x + 6, z, y: 0, yaw: Math.PI / 2 }); }, [door.x, door.z]);
await wait(1500);
await shot('12-bonus-hidden');
check(await page.evaluate(() => document.body.innerText.includes('Psst!')), 'the Topo calls "Psst!" by the hidden door');
await page.keyboard.down('ArrowUp'); await wait(2500); await page.keyboard.up('ArrowUp');
await wait(1000);
const opened = await bonusDoor();
check(opened.open && opened.found, 'the hidden bonus door opens at a touch');
await shot('12b-bonus-open');

await game(() => { window.__orsi.tractorRace(); });
await page.waitForSelector('button[data-v="go"]', { timeout: 20000 });
await page.click('button[data-v="go"]'); // TRACTOR RACE? LET'S RACE!
await page.waitForSelector('button[data-v="go"]', { timeout: 20000 });
await page.click('button[data-v="go"]'); // the race's card
await page.waitForFunction(() => window.__orsi.race && window.__orsi.race.time > 0.3, null, { timeout: 60000 });
// ↑ is not the gas any more; SPACE is
await page.keyboard.down('ArrowUp'); await wait(800); await page.keyboard.up('ArrowUp');
check(await game(() => window.__orsi.race.players[0].t.speed) < 0.5, '↑ does not accelerate');
await page.keyboard.down('Space');
await page.waitForFunction(() => window.__orsi.race.time > 3, null, { timeout: 60000 });
await shot('13-race');
check(await game(() => window.__orsi.race.players[0].t.speed) > 3, 'SPACE accelerates');
// off the road on the right, into the field
await page.keyboard.down('ArrowRight'); await wait(2500); await page.keyboard.up('ArrowRight');
await wait(1500);
await page.keyboard.up('Space');
await shot('13b-off-road');
check(await game(() => window.__orsi.race.players[0].t.offTrack), 'the tractor can leave the road');
// first across the line: the cup, back to the level with the golden spade
await game(() => { const r = window.__orsi.race; for (const x of r.racers) x.t.finished = null; r.players[0].t.finished = r.time; r.finish(); });
await page.waitForSelector('button[data-v="level"]', { timeout: 20000 });
await shot('14-race-result');
check(await page.evaluate(() => /win the cup/i.test(document.body.innerText)), 'the bear that crossed first wins the cup');
await page.click('button[data-v="level"]');
await wait(1500);
const spade = await game(() => {
  const g = window.__orsi.game, p = g.player;
  const near = g.enemies.filter(e => !e.out && !e.fly).slice(0, 3);
  near.forEach((e, i) => { e.x = p.x - Math.sin(p.yaw) * 2.2 + Math.cos(p.yaw) * (i - 1) * 1.3; e.z = p.z - Math.cos(p.yaw) * 2.2 - Math.sin(p.yaw) * (i - 1) * 1.3; e.y = p.y; });
  p.cooldown = 0;
  g.tryFire(1 / 60);
  return { weapon: p.weapon, out: near.filter(e => e.out).length, of: near.length };
});
await wait(500);
await shot('15-spade');
check(spade.weapon === 'vanga', 'the winner holds the golden spade');
check(spade.out === spade.of && spade.of > 1, `the spade knocks out everyone in front (${spade.out}/${spade.of})`);
console.log('race', JSON.stringify({ door: opened, spade }));

console.log(errors.length ? `ERRORS:\n${errors.join('\n')}` : 'no errors');
if (errors.length) process.exitCode = 1;
await browser.close();
