import { defineConfig } from 'vite';
import { offline } from './scripts/offline-plugin.mjs';

export default defineConfig({
  // Relative base: the same build works from a local folder and from GitHub Pages under /<repo>/.
  base: './',
  // dist/sw.js: the game keeps working without a network once opened (not cached: the woff files, since browsers
  // take the woff2 ones, and the notes in public/assets)
  plugins: [offline({ name: 'orsi', skip: [/\.woff$/, /\.md$/] })],
  // the dev server always on 5180 (README, Avvia-Gioco.cmd and the smoke test expect it)
  server: { host: '127.0.0.1', port: 5180, strictPort: true },
  build: {
    chunkSizeWarningLimit: 800,
    // three.js in its own chunk: it rarely changes, so browsers keep it cached while the game evolves.
    // (Vite 8 bundles with Rolldown: `codeSplitting` groups replace Rollup's manualChunks object.)
    rolldownOptions: { output: { codeSplitting: { groups: [{ name: 'three', test: /node_modules[\\/]three[\\/]/ }] } } },
  },
});
