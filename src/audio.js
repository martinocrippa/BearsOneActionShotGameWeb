// Sounds synthesised with Web Audio: no audio files needed. (Music can be replaced by a real file, see startMusic.)
import { SONGS, playSong } from './music.js';
import { assetUrl } from './art/registry.js';

let ctx = null, master = null, musicGain = null, noiseBuf = null;
let musicOn = true;

export function unlockAudio() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain(); master.gain.value = 0.5; master.connect(ctx.destination);
    musicGain = ctx.createGain(); musicGain.gain.value = 0.16; musicGain.connect(master);
  }
  if (ctx.state === 'suspended') ctx.resume();
}

function tone(freq, dur, { type = 'square', vol = 0.3, to = null, delay = 0, out = master } = {}) {
  if (!ctx) return;
  const t = ctx.currentTime + delay;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g).connect(out); o.start(t); o.stop(t + dur + 0.02);
}

function noise(dur, { vol = 0.3, freq = 1200, q = 1, type = 'bandpass', delay = 0, to = null, out = master } = {}) {
  if (!ctx) return;
  const t = ctx.currentTime + delay;
  // one second of white noise, made once and looped for longer sounds
  if (!noiseBuf) {
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const src = ctx.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
  const f = ctx.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(freq, t); f.Q.value = q;
  if (to) f.frequency.exponentialRampToValueAtTime(to, t + dur);
  const g = ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  src.connect(f).connect(g).connect(out); src.start(t, Math.random() * 0.5); src.stop(t + dur + 0.02);
}

export const SOUNDS = {
  menu: () => noise(0.05, { freq: 2500, vol: 0.25 }),
  select: () => { noise(0.12, { freq: 900, vol: 0.5, type: 'lowpass' }); tone(140, 0.12, { type: 'square', to: 60, vol: 0.25 }); },
  whoosh: () => noise(0.25, { freq: 400, to: 2400, vol: 0.4 }),
  pop: () => { tone(500, 0.08, { type: 'sine', to: 1200, vol: 0.4 }); noise(0.05, { freq: 3000, vol: 0.2 }); },
  confetti: () => { noise(0.3, { freq: 900, to: 300, vol: 0.5, type: 'lowpass' }); for (let i = 0; i < 5; i++) tone(1500 + Math.random() * 1500, 0.05, { type: 'triangle', vol: 0.08, delay: 0.05 + i * 0.03 }); },
  glop: () => tone(180, 0.12, { type: 'sine', to: 520, vol: 0.35 }),
  squirt: () => noise(0.18, { freq: 2500, to: 900, vol: 0.25 }),
  throw: () => noise(0.3, { freq: 600, to: 1600, vol: 0.25 }),
  splat: () => noise(0.15, { freq: 500, vol: 0.3, type: 'lowpass' }),
  squeak: () => { tone(1400, 0.06, { type: 'triangle', to: 2200, vol: 0.2 }); tone(1700, 0.07, { type: 'triangle', to: 2600, vol: 0.2, delay: 0.08 }); },
  hiss: () => noise(0.4, { freq: 5000, vol: 0.2, type: 'highpass' }),
  yawn: () => { tone(300, 1.1, { type: 'sawtooth', to: 140, vol: 0.18 }); tone(450, 1.1, { type: 'sine', to: 200, vol: 0.12 }); },
  burp: () => { tone(90, 0.35, { type: 'sawtooth', to: 60, vol: 0.4 }); noise(0.3, { freq: 200, vol: 0.2, type: 'lowpass' }); },
  hurt: () => { noise(0.2, { freq: 700, to: 200, vol: 0.5, type: 'lowpass' }); tone(420, 0.35, { type: 'square', to: 140, vol: 0.22 }); tone(300, 0.3, { type: 'sawtooth', to: 110, vol: 0.12, delay: 0.05 }); },
  squelch: () => { noise(0.22, { freq: 380, to: 140, vol: 0.55, type: 'lowpass', q: 4 }); tone(150, 0.18, { type: 'sine', to: 70, vol: 0.3 }); },
  pickup: () => { tone(660, 0.07, { vol: 0.15 }); tone(990, 0.09, { vol: 0.15, delay: 0.07 }); },
  pickupBig: () => [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.1, { vol: 0.15, delay: i * 0.07 })),
  weapon: () => { [196, 262, 330, 392].forEach((f, i) => tone(f, 0.12, { type: 'sawtooth', vol: 0.15, delay: i * 0.06 })); },
  key: () => [784, 988, 1175, 1568].forEach((f, i) => tone(f, 0.14, { type: 'triangle', vol: 0.2, delay: i * 0.08 })),
  door: () => { noise(0.9, { freq: 120, vol: 0.5, type: 'lowpass' }); tone(70, 0.9, { type: 'sawtooth', vol: 0.12 }); },
  denied: () => { tone(160, 0.15, { vol: 0.2 }); tone(120, 0.2, { vol: 0.2, delay: 0.16 }); },
  secret: () => [392, 523, 659, 784, 1046].forEach((f, i) => tone(f, 0.12, { type: 'triangle', vol: 0.18, delay: i * 0.06 })),
  checkpoint: () => { tone(523, 0.1, { type: 'triangle', vol: 0.2 }); tone(784, 0.2, { type: 'triangle', vol: 0.2, delay: 0.1 }); },
  exit: () => [262, 330, 392, 523, 659, 784].forEach((f, i) => tone(f, 0.15, { type: 'square', vol: 0.15, delay: i * 0.08 })),
  cheat: () => [1046, 784, 1046, 1568].forEach((f, i) => tone(f, 0.08, { type: 'square', vol: 0.15, delay: i * 0.06 })),
  // Episode 1: the new weapons
  twang: () => { tone(220, 0.25, { type: 'sawtooth', to: 110, vol: 0.25 }); noise(0.15, { freq: 1800, vol: 0.2 }); },
  fwoomp: () => { noise(0.4, { freq: 300, to: 1200, vol: 0.5, type: 'lowpass' }); tone(120, 0.3, { type: 'sine', to: 60, vol: 0.3 }); },
  zip: () => noise(0.08, { freq: 4000, to: 1500, vol: 0.25 }),
  fizz: () => noise(0.12, { freq: 6000, vol: 0.18, type: 'highpass' }),
  charge: () => tone(200, 0.6, { type: 'sawtooth', to: 900, vol: 0.18 }),
  bfg: () => { noise(0.9, { freq: 900, to: 120, vol: 0.7, type: 'lowpass' }); [784, 988, 1175, 1568].forEach((f, i) => tone(f, 0.12, { type: 'triangle', vol: 0.12, delay: 0.1 + i * 0.05 })); },
  whump: () => { noise(0.5, { freq: 500, to: 90, vol: 0.6, type: 'lowpass' }); tone(80, 0.4, { type: 'sine', to: 40, vol: 0.35 }); },
  angel: () => [1046, 1318, 1568, 2093].forEach((f, i) => tone(f, 0.3, { type: 'sine', vol: 0.1, delay: i * 0.09 })),
  knock: () => tone(600, 0.1, { type: 'square', to: 300, vol: 0.15 }),
  // the level
  switch: () => { tone(300, 0.05, { vol: 0.25 }); noise(0.08, { freq: 1500, vol: 0.3 }); },
  lift: () => { noise(0.6, { freq: 160, vol: 0.35, type: 'lowpass' }); tone(55, 0.6, { type: 'sawtooth', vol: 0.08 }); },
  // the new opponents
  slosh: () => noise(0.25, { freq: 700, to: 300, vol: 0.4, type: 'lowpass' }),
  chug: () => { noise(0.06, { freq: 900, vol: 0.4, type: 'lowpass' }); tone(140, 0.06, { vol: 0.15 }); },
  yip: () => tone(900, 0.12, { type: 'square', to: 1400, vol: 0.15 }),
  grunt: () => { tone(110, 0.25, { type: 'sawtooth', to: 70, vol: 0.3 }); noise(0.2, { freq: 300, vol: 0.2, type: 'lowpass' }); },
  honk: () => { tone(420, 0.25, { type: 'sawtooth', to: 380, vol: 0.2 }); tone(426, 0.25, { type: 'square', to: 384, vol: 0.1 }); },
  quack: () => { tone(700, 0.08, { type: 'sawtooth', to: 500, vol: 0.2 }); tone(680, 0.1, { type: 'sawtooth', to: 460, vol: 0.2, delay: 0.1 }); },
  crow: () => [520, 700, 900, 640].forEach((f, i) => tone(f, 0.14, { type: 'sawtooth', vol: 0.14, delay: i * 0.1 })),
  oink: () => { tone(160, 0.3, { type: 'sawtooth', to: 120, vol: 0.35 }); noise(0.3, { freq: 400, vol: 0.25, type: 'lowpass' }); },
  launch: () => { noise(0.35, { freq: 400, to: 2000, vol: 0.45 }); tone(200, 0.3, { type: 'square', to: 500, vol: 0.12 }); },
  // SWEET SHOT
  tweet: () => { tone(2400, 0.06, { type: 'sine', to: 3200, vol: 0.12 }); tone(2800, 0.07, { type: 'sine', to: 3600, vol: 0.12, delay: 0.08 }); },
  hoot: () => { tone(420, 0.25, { type: 'sine', to: 380, vol: 0.25 }); tone(380, 0.35, { type: 'sine', to: 340, vol: 0.25, delay: 0.3 }); },
  whee: () => tone(500, 0.4, { type: 'triangle', to: 1600, vol: 0.18 }),
  puff: () => noise(0.35, { freq: 900, to: 300, vol: 0.4, type: 'lowpass' }),
  // the bonus weapons and the bonus rooms' tricks
  splash: () => { noise(0.3, { freq: 1200, to: 400, vol: 0.45, type: 'lowpass' }); tone(300, 0.15, { type: 'sine', to: 120, vol: 0.15 }); },
  boing: () => tone(160, 0.35, { type: 'sine', to: 520, vol: 0.3 }),
  pie: () => { noise(0.2, { freq: 600, vol: 0.5, type: 'lowpass' }); tone(220, 0.2, { type: 'triangle', to: 90, vol: 0.2 }); },
  kick: () => { tone(90, 0.12, { type: 'sine', to: 50, vol: 0.5 }); noise(0.06, { freq: 1500, vol: 0.25 }); },
  cheer: () => { noise(1.1, { freq: 1500, to: 900, vol: 0.35 }); [523, 659, 784].forEach((f, i) => tone(f, 0.2, { type: 'square', vol: 0.1, delay: i * 0.1 })); },
  aww: () => [392, 349, 311].forEach((f, i) => tone(f, 0.35, { type: 'sawtooth', to: f * 0.92, vol: 0.14, delay: i * 0.3 })),
  reel: () => { for (let i = 0; i < 8; i++) tone(1800, 0.03, { type: 'square', vol: 0.06, delay: i * 0.04 }); },
  lose: () => [392, 370, 349, 330].forEach((f, i) => tone(f, 0.45, { type: 'sawtooth', vol: 0.2, delay: i * 0.4 })),
};

export function play(name) {
  if (!ctx || !SOUNDS[name]) return;
  SOUNDS[name]();
}

// Music: the level's punk track (src/music.js), or a real recording if public/assets has music/<track>.
let stopSong = null, audioEl = null, currentTrack = null;
let lastTrack = 'e1m1'; // what M plays when the music is switched back on
export function startMusic(track = 'e1m1') {
  lastTrack = track;
  if (!ctx || !musicOn) return;
  if (track === currentTrack && (stopSong || audioEl)) return;
  stopMusic();
  currentTrack = track;
  const url = assetUrl(`music/${track}`);
  if (url) {
    audioEl = new Audio(url); audioEl.loop = true; audioEl.volume = 0.5;
    audioEl.play().catch(() => {});
    return;
  }
  const song = SONGS[track] || SONGS.e1m1;
  stopSong = playSong(ctx, musicGain, song);
}
export function stopMusic() {
  stopSong?.(); stopSong = null;
  if (audioEl) { audioEl.pause(); audioEl = null; }
  currentTrack = null;
}
export function toggleMusic() { musicOn = !musicOn; if (musicOn) startMusic(lastTrack); else stopMusic(); return musicOn; }
