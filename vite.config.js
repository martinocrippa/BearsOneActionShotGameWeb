import { defineConfig } from 'vite';

export default defineConfig({
  // Relative base: the same build works from a local folder and from GitHub Pages under /<repo>/.
  base: './',
  // the dev server always on 5180 (README, Avvia-Gioco.cmd and the smoke test expect it)
  server: { host: '127.0.0.1', port: 5180, strictPort: true },
  build: {
    chunkSizeWarningLimit: 800,
    // three.js in its own chunk: it rarely changes, so browsers keep it cached while the game evolves.
    rollupOptions: { output: { manualChunks: { three: ['three'] } } },
  },
});
