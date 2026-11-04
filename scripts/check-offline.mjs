// Checks that the built game works without a network: serves dist/ with `vite preview`, opens it once in Edge,
// waits for the service worker (scripts/offline-plugin.mjs) to cache everything, cuts the network, reloads and
// plays into the first level. Fails on any page error.
// Usage: npm run build, then node scripts/check-offline.mjs
import { chromium } from 'playwright-core';
import { preview } from 'vite';

const server = await preview({ preview: { port: 4180, strictPort: true, host: '127.0.0.1' }, logLevel: 'warn' });
const url = 'http://127.0.0.1:4180/';
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
const page = await context.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
page.on('requestfailed', (r) => errors.push(`request failed: ${r.url()}`));
let failed = false;
try {
  await page.goto(url);
  const cached = await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.ready;
    const keys = await caches.keys();
    return { active: !!reg.active, files: keys.length ? (await (await caches.open(keys[0])).keys()).length : 0 };
  });
  console.log(`service worker active: ${cached.active}, files cached: ${cached.files}`);
  if (!cached.active || cached.files < 10) throw new Error('nothing cached');

  await context.setOffline(true);
  await page.reload();
  await page.waitForSelector('.screen.show button');
  await page.keyboard.press('Enter');
  await page.click('button[data-v="play"]'); await page.click('button[data-v="solo"]');
  await page.click('button[data-v="piccolo"]'); await page.click('button[data-v="2"]');
  await page.waitForSelector('button[data-v="go"]', { timeout: 20000 });
  await page.click('button[data-v="go"]');
  await page.waitForTimeout(1500);
  const playing = await page.evaluate(() => !!window.__orsi?.game && !window.__orsi.game.paused);
  console.log(`offline: level started = ${playing}`);
  if (!playing) throw new Error('the level did not start offline');
} catch (e) {
  failed = true;
  console.error(e.message);
}
if (errors.length) { failed = true; console.error(errors.join('\n')); }
await browser.close();
await server.close();
console.log(failed ? 'OFFLINE CHECK FAILED' : 'offline check passed');
process.exit(failed ? 1 : 0);
