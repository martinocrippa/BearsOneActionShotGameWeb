// The music: one ORIGINAL track per level, each in a different corner of melodic punk rock (pop-punk à la
// Screeching Weasel, skate punk à la Millencolin, ska-punk, folk-punk, surf-punk, a stadium chant…), played by a
// small synthesised band. When the real music arrives, drop public/assets/music/<track>.mp3 and list it in
// assets.json (key "music/<track>"): it replaces the synthesised track of the same name.
//
// A song: { bpm, key (MIDI note of the root), band: { gain (volume, to even out the songs), lead, drive, echo }, parts, order }.
// A part (one chord per bar):
//   chords: semitones above the key, one per bar; add "m" for minor (only arpeggios play the third): '0 7 9m 5'
//   strum:  'down' (downstroked eighths) · 'mute' (palm-muted eighths) · 'chug' (muted sixteenths, open accents)
//           · 'ska' (short upstrokes on the off-beats) · 'gallop' · 'arp' (clean arpeggio) · 'ring' (once per bar)
//           · 'stop' (hit on the 1, then silence)
//   bass:   'eighths' (default) · 'walk' (root-fifth-octave-sixth) · 'quarters' · 'none'
//   beat:   a key of BEATS (drum pattern per sixteenth) · fill: true = drum fill on the last bar
//   mel:    lead line, one token per eighth: semitones above the key one octave up · _ hold · . rest (| = bar line)

const P = (chords, strum, beat, opts = {}) => ({ chords, strum, beat, ...opts });

export const SONGS = {
  // E1M1 — The Clearing: Ramones-style pop-punk, three chords and a sunny chorus.
  e1m1: {
    bpm: 196, key: 40, band: { lead: 'square', drive: 4 },
    parts: {
      intro: P('0 0 5 7', 'down', 'rock'),
      verse: P('0 5 0 7', 'mute', 'rock', { mel: '7 _ 7 9 7 _ 4 _ | 5 _ 5 7 5 _ 2 _ | 7 _ 7 9 7 _ 4 _ | 2 _ 4 _ 2 _ . .' }),
      chorus: P('0 7 9 5', 'down', 'skate', { mel: '12 _ 11 _ 9 _ 7 _ | 7 _ 9 _ 11 _ 12 _ | 9 _ 7 _ 4 _ 7 _ | 5 _ 4 _ 2 _ . .', fill: true }),
      bridge: P('5 5 7 7', 'ring', 'half', { mel: '9 _ _ _ 7 _ _ _ | 5 _ _ _ 4 _ _ _ | 11 _ _ _ 12 _ _ _ | 14 _ _ _ _ _ . .' }),
    },
    order: ['intro', 'verse', 'verse', 'chorus', 'chorus', 'verse', 'chorus', 'bridge', 'chorus', 'chorus'],
  },
  // E1M2 — Increa Park: Millencolin-style skate punk, sixteenth chugs and a soaring saw lead.
  e1m2: {
    bpm: 204, key: 45, band: { gain: 0.6, lead: 'saw', drive: 5 },
    parts: {
      riff: P('0 0 3 5', 'chug', 'skate', { mel: '12 14 15 _ 14 12 10 _ | 12 14 15 _ 17 _ 15 _ | 12 14 15 _ 14 12 10 _ | 7 _ 10 _ 12 _ . .' }),
      verse: P('0 5 7 5', 'mute', 'skate', { mel: '4 _ 4 _ 5 4 2 _ | 4 _ 4 _ 7 _ 5 _ | 4 _ 4 _ 5 4 2 _ | 0 _ 2 _ 0 _ . .' }),
      chorus: P('5 7 0 9m 5 7 0 0', 'down', 'skate', { mel: '9 _ 9 _ 7 _ 5 _ | 7 _ 7 _ 4 _ 2 _ | 4 _ 5 _ 7 _ 12 _ | 11 _ 9 _ 7 _ . . | 9 _ 9 _ 7 _ 5 _ | 7 _ 7 _ 4 _ 2 _ | 4 _ 2 _ 0 _ _ _ | . . . . . . . .', fill: true }),
    },
    order: ['riff', 'riff', 'verse', 'verse', 'chorus', 'riff', 'verse', 'chorus', 'chorus'],
  },
  // E1M3 — The Pitch in the Rain: minor melodic hardcore, grumpy, with a slow breakdown; organ lead.
  e1m3: {
    bpm: 172, key: 38, band: { gain: 0.85, lead: 'organ', drive: 6 },
    parts: {
      verse: P('9m 5 0 7', 'mute', 'rock', { mel: '9 _ 9 _ 12 _ 9 _ | 5 _ 7 _ 9 _ _ _ | 7 _ 4 _ 7 _ 9 _ | 7 _ _ _ . . . .' }),
      chorus: P('5 7 9m 9m 5 7 0 0', 'down', 'skate', { mel: '12 _ 12 _ 14 _ 12 _ | 11 _ 9 _ 7 _ _ _ | 9 _ 12 _ 16 _ 14 _ | 12 _ _ _ . . . . | 12 _ 12 _ 14 _ 12 _ | 11 _ 9 _ 7 _ _ _ | 9 _ 7 _ 4 _ 2 _ | 0 _ _ _ . . . .', fill: true }),
      breakdown: P('9m 9m 5 7', 'ring', 'half', { mel: '21 _ _ _ _ _ _ _ | 19 _ _ _ 17 _ _ _ | 16 _ _ _ _ _ _ _ | 14 _ _ _ 12 _ _ _' }),
    },
    order: ['verse', 'verse', 'chorus', 'breakdown', 'breakdown', 'verse', 'chorus', 'chorus'],
  },
  // E1M4 — School at Dawn: the fastest, it starts with the school bell; a whistle for the teacher.
  e1m4: {
    bpm: 216, key: 43, band: { lead: 'whistle', drive: 5 },
    parts: {
      bell: P('0 0', 'ring', 'none', { mel: '24 24 24 24 24 24 24 24 | 24 24 24 24 . . . .' }),
      intro: P('0 10 5 0', 'stop', 'stop'),
      verse: P('0 10 5 0', 'mute', 'skate', { mel: '7 7 7 _ 5 _ 7 _ | 10 _ 9 _ 7 _ _ _ | 5 5 5 _ 4 _ 5 _ | 7 _ _ _ . . . .' }),
      chorus: P('5 0 7 0', 'down', 'skate', { mel: '12 _ 12 _ 10 _ 9 _ | 7 _ 9 _ 12 _ _ _ | 14 _ 12 _ 11 _ 9 _ | 7 _ _ _ . . . .', fill: true }),
    },
    order: ['bell', 'intro', 'verse', 'verse', 'chorus', 'chorus', 'verse', 'chorus', 'chorus'],
  },
  // E1M5 — Break Time: ska-punk! Off-beat upstrokes, a walking bass and a brass section.
  e1m5: {
    bpm: 168, key: 47, band: { gain: 1.9, lead: 'brass', drive: 2 },
    parts: {
      skank: P('0 4 5 7', 'ska', 'ska', { bass: 'walk', mel: '0 2 4 _ 0 2 4 _ | 4 5 7 _ 4 5 7 _ | 9 _ 7 _ 5 _ 4 _ | 2 _ _ _ 7 _ _ _' }),
      horns: P('5 7 4 9m 5 7 0 0', 'ska', 'ska', { bass: 'walk', mel: '12 _ 12 14 12 _ 9 _ | 11 _ 11 12 11 _ 7 _ | 9 _ 9 11 9 _ 4 _ | 9 _ _ _ . . . . | 12 _ 12 14 12 _ 9 _ | 11 _ 11 12 14 _ 11 _ | 12 _ _ _ _ _ _ _ | . . . . . . . .' }),
      punk: P('0 4 5 7', 'down', 'skate', { fill: true, mel: '12 _ 12 _ 11 _ 9 _ | 11 _ 11 _ 9 _ 7 _ | 9 _ 9 _ 7 _ 5 _ | 7 _ _ _ . . . .' }),
    },
    order: ['skank', 'skank', 'horns', 'punk', 'skank', 'horns', 'horns', 'punk'],
  },
  // E1M6 — The Castle: folk-punk gallop with a tin whistle, a "whoa-oh" for the courtyard.
  e1m6: {
    bpm: 184, key: 40, band: { gain: 0.8, lead: 'whistle', drive: 4 },
    parts: {
      jig: P('0 0 7 7 9m 9m 5 7', 'gallop', 'gallop', { mel: '12 14 16 _ 14 12 11 _ | 12 14 16 _ 19 _ 16 _ | 14 _ 16 _ 14 _ 12 _ | 11 _ 9 _ 7 _ _ _ | 9 11 12 _ 11 9 7 _ | 9 11 12 _ 16 _ 12 _ | 14 _ 12 _ 11 _ 9 _ | 7 _ _ _ . . . .' }),
      verse: P('0 7 9m 5', 'mute', 'skate', { mel: '4 _ 4 _ 4 _ 2 4 | 7 _ 7 _ 5 _ 4 _ | 4 _ 4 _ 4 _ 2 4 | 2 _ 0 _ . . . .' }),
      whoa: P('9m 5 0 7 9m 5 7 7', 'down', 'half', { mel: '12 _ _ _ 11 _ 9 _ | 9 _ _ _ 7 _ 5 _ | 7 _ _ _ 9 _ 11 _ | 12 _ _ _ 14 _ _ _ | 12 _ _ _ 11 _ 9 _ | 9 _ _ _ 7 _ 5 _ | 7 _ 9 _ 11 _ 12 _ | 14 _ _ _ _ _ _ _', fill: true }),
    },
    order: ['jig', 'verse', 'verse', 'whoa', 'jig', 'verse', 'whoa', 'whoa'],
  },
  // E1M7 — The River: wistful emo-punk, a clean arpeggio by the water, then the big chorus.
  e1m7: {
    bpm: 152, key: 42, band: { gain: 1.8, lead: 'saw', drive: 3, echo: 0.33 },
    parts: {
      water: P('9m 5 0 7', 'arp', 'half', { bass: 'quarters', mel: '. . . . 16 _ 14 _ | 12 _ _ _ . . . . | . . . . 11 _ 12 _ | 14 _ _ _ . . . .' }),
      verse: P('9m 5 0 7', 'mute', 'rock', { mel: '9 _ 7 _ 9 _ 12 _ | 9 _ 7 _ 5 _ _ _ | 4 _ 5 _ 7 _ 9 _ | 7 _ _ _ . . . .' }),
      chorus: P('5 0 7 9m 5 0 7 7', 'down', 'skate', { mel: '9 _ 9 _ 7 _ 9 _ | 12 _ _ _ 11 _ 9 _ | 7 _ 7 _ 5 _ 7 _ | 9 _ _ _ . . . . | 9 _ 9 _ 7 _ 9 _ | 12 _ _ _ 14 _ 12 _ | 11 _ _ _ _ _ _ _ | . . . . . . . .', fill: true }),
    },
    order: ['water', 'water', 'verse', 'chorus', 'water', 'verse', 'chorus', 'chorus'],
  },
  // E1M8 — The Stadium: the boss. A stadium chant: claps, "HEY!", the crowd's tune, then flat out.
  e1m8: {
    bpm: 188, key: 38, band: { gain: 1.15, lead: 'saw', drive: 6 },
    parts: {
      chant: P('0 0 10 10 5 5 7 7', 'stop', 'chant', { mel: '12 _ _ _ 12 _ _ _ | 10 _ 12 _ . . . . | 12 _ _ _ 12 _ _ _ | 14 _ 12 _ . . . . | 9 _ _ _ 9 _ _ _ | 7 _ 9 _ . . . . | 11 _ _ _ 11 _ _ _ | 12 _ _ _ _ _ _ _' }),
      run: P('0 10 5 7', 'chug', 'skate'),
      chorus: P('5 7 0 9m 5 7 0 0', 'down', 'clapskate', { mel: '12 _ 12 _ 12 _ 14 _ | 12 _ 11 _ 9 _ 7 _ | 7 _ 9 _ 11 _ 12 _ | 14 _ 12 _ . . . . | 12 _ 12 _ 12 _ 14 _ | 16 _ 14 _ 12 _ 11 _ | 12 _ _ _ _ _ _ _ | . . . . . . . .', fill: true }),
    },
    order: ['chant', 'run', 'run', 'chorus', 'chant', 'run', 'chorus', 'chorus'],
  },
  // E1M9 — Snowy Peaks: surf-punk down the slopes, tremolo-picked lead with echo.
  e1m9: {
    bpm: 200, key: 45, band: { gain: 0.85, lead: 'tremolo', drive: 4, echo: 0.22 },
    parts: {
      surf: P('0 0 5 5 7 5 0 0', 'down', 'surf', { mel: '12 _ _ _ 16 _ _ _ | 19 _ _ _ 17 _ 16 _ | 17 _ _ _ 21 _ _ _ | 19 _ _ _ _ _ _ _ | 19 _ _ _ 17 _ 16 _ | 17 _ 16 _ 14 _ 12 _ | 12 _ _ _ _ _ _ _ | . . . . . . . .' }),
      verse: P('0 7 5 5', 'mute', 'skate', { mel: '7 _ 7 _ 4 _ 7 _ | 9 _ 7 _ 4 _ _ _ | 5 _ 4 _ 2 _ 0 _ | 2 _ _ _ . . . .' }),
      chorus: P('5 7 9m 7 5 7 0 0', 'down', 'skate', { mel: '12 _ 11 _ 12 _ 14 _ | 12 _ _ _ 9 _ _ _ | 12 _ 14 _ 16 _ 14 _ | 12 _ _ _ . . . . | 12 _ 11 _ 12 _ 14 _ | 16 _ 14 _ 12 _ 11 _ | 12 _ _ _ _ _ _ _ | . . . . . . . .', fill: true }),
    },
    order: ['surf', 'verse', 'verse', 'chorus', 'surf', 'chorus', 'chorus'],
  },
  // SWEET SHOT 1 — Dawn at the Pond: easy-going, sleepy sun, an organ with echo.
  bonus1: {
    bpm: 136, key: 38, band: { gain: 1.4, lead: 'organ', drive: 3, echo: 0.36 },
    parts: {
      a: P('0 5 0 7', 'down', 'half', { mel: '12 _ _ _ 14 _ 16 _ | 17 _ _ _ 16 _ 14 _ | 12 _ _ _ 14 _ 16 _ | 14 _ _ _ . . . .' }),
      b: P('5 7 9m 7', 'down', 'rock', { mel: '17 _ 16 _ 14 _ 12 _ | 14 _ _ _ 11 _ _ _ | 12 _ 14 _ 16 _ 19 _ | 19 _ _ _ . . . .', fill: true }),
    },
    order: ['a', 'a', 'b', 'a', 'b'],
  },
  // SWEET SHOT 2 — Noon in the Woods: fast and bright, birds everywhere, a whistle.
  bonus2: {
    bpm: 212, key: 45, band: { gain: 0.9, lead: 'whistle', drive: 4 },
    parts: {
      a: P('0 7 5 7', 'mute', 'skate', { mel: '12 14 16 _ 19 _ 16 _ | 14 16 17 _ 21 _ 17 _ | 16 14 12 _ 14 _ 16 _ | 12 _ _ _ . . . .' }),
      b: P('5 7 0 0', 'down', 'skate', { mel: '21 _ 19 _ 17 _ 16 _ | 19 _ 17 _ 16 _ 14 _ | 12 _ 14 _ 16 _ 19 _ | 24 _ _ _ . . . .', fill: true }),
    },
    order: ['a', 'a', 'b', 'a', 'b', 'b'],
  },
  // SWEET SHOT 3 — Night of the Owls: spooky surf-punk under the moon, tremolo guitar and echo.
  bonus3: {
    bpm: 168, key: 40, band: { gain: 0.95, lead: 'tremolo', drive: 4, echo: 0.3 },
    parts: {
      a: P('9m 9m 5 7', 'mute', 'surf', { mel: '9 _ 12 _ 16 _ 15 _ | 16 _ _ _ . . . . | 12 _ 14 _ 15 _ 14 _ | 12 _ _ _ 11 _ _ _' }),
      b: P('5 7 9m 9m', 'down', 'surf', { mel: '17 _ _ _ 19 _ _ _ | 21 _ _ _ 19 _ 17 _ | 16 _ _ _ 15 _ _ _ | 16 _ _ _ . . . .', fill: true }),
    },
    order: ['a', 'a', 'b', 'a', 'b'],
  },
  // Title: the anthem.
  title: {
    bpm: 192, key: 40, band: { lead: 'square', drive: 5 },
    parts: {
      a: P('0 0 5 7', 'stop', 'stop'),
      b: P('0 7 9m 5 0 7 5 5', 'down', 'skate', { mel: '12 _ 12 _ 11 _ 9 _ | 7 _ _ _ 11 _ 12 _ | 12 _ 14 _ 12 _ 9 _ | 9 _ _ _ . . . . | 12 _ 12 _ 11 _ 9 _ | 7 _ 9 _ 11 _ 12 _ | 9 _ 7 _ 5 _ 4 _ | 4 _ _ _ . . . .', fill: true }),
    },
    order: ['a', 'b', 'b'],
  },
  // Between levels (the report): a laid-back half-time singalong.
  intermission: {
    bpm: 150, key: 40, band: { gain: 1.5, lead: 'organ', drive: 3 },
    parts: { a: P('0 5 7 5', 'down', 'half', { mel: '7 _ 9 _ 11 _ 12 _ | 12 _ 11 _ 9 _ _ _ | 7 _ 9 _ 11 _ 14 _ | 12 _ _ _ . . . .' }) },
    order: ['a'],
  },
  // The end of the episode: slow, proud, a bit silly.
  ending: {
    bpm: 132, key: 43, band: { gain: 2.2, lead: 'brass', drive: 3, echo: 0.3 },
    parts: { a: P('0 7 9m 5 0 7 5 7', 'ring', 'half', { mel: '12 _ _ _ 14 _ 16 _ | 14 _ _ _ 12 _ _ _ | 16 _ _ _ 17 _ 19 _ | 17 _ _ _ 16 _ _ _ | 12 _ _ _ 14 _ 16 _ | 19 _ _ _ 17 _ 16 _ | 17 _ _ _ 14 _ _ _ | 12 _ _ _ _ _ _ _', fill: true }) },
    order: ['a'],
  },
};

// Drum patterns, one char per sixteenth (16 per bar):
// k kick · s snare · h hat · x kick+hat · o snare+hat · c crash+kick · t tom · p clap · y shout ("HEY!") · b tambourine
const BEATS = {
  skate: 'x.o.x.o.x.o.x.o.', // the punk "polka": kick and snare alternate on the eighths
  rock: 'x.h.o.h.x.x.o.h.',
  half: 'x.h.h.h.o.h.h.h.',
  stop: 'c...............',
  none: '................',
  ska: 'k.h.s.h.k.h.s.h.',
  gallop: 'x.hkx.hkx.hkx.o.',
  chant: 'k.k.p...k.k.p..y',
  clapskate: 'x.p.x.o.x.p.x.o.',
  surf: 'x.bbo.b.x.bbo.b.',
};
const FILL = 'x.o.ooo.tttts.ss';

// Which sixteenths of the bar the guitar plays, how long each hit rings (in sixteenths), and how.
const STRUMS = {
  down: { at: [0, 2, 4, 6, 8, 10, 12, 14], ring: 2 },
  mute: { at: [0, 2, 4, 6, 8, 10, 12, 14], ring: 2, mute: true },
  chug: { at: [...Array(16).keys()], ring: 1, mute: true, accent: [0, 8] },
  ska: { at: [2, 6, 10, 14], ring: 1.2, ska: true },
  gallop: { at: [0, 2, 3, 4, 6, 7, 8, 10, 11, 12, 14, 15], ring: 1, mute: true, accent: [0, 4, 8, 12] },
  arp: { at: [0, 2, 4, 6, 8, 10, 12, 14], ring: 3, arp: true },
  ring: { at: [0], ring: 16 },
  stop: { at: [0], ring: 16 },
};

// Expands a part into sixteenth steps.
function expand(part) {
  const chords = part.chords.trim().split(/\s+/);
  const mel = part.mel ? part.mel.replace(/\|/g, ' ').trim().split(/\s+/) : [];
  const strum = STRUMS[part.strum] || STRUMS.down;
  const steps = [];
  chords.forEach((tok, bar) => {
    const chord = parseInt(tok, 10), minor = tok.endsWith('m');
    const drums = part.fill && bar === chords.length - 1 ? FILL : BEATS[part.beat] ?? BEATS.rock;
    let arpI = 0;
    for (let s = 0; s < 16; s++) {
      const eighth = bar * 8 + Math.floor(s / 2);
      const hit = strum.at.includes(s);
      steps.push({
        chord: hit ? chord : null,
        minor,
        arp: hit && strum.arp ? [0, 7, 12, minor ? 15 : 16][arpI++ % 4] : null,
        ring: strum.ring,
        mute: !!strum.mute && !(strum.accent || []).includes(s),
        ska: !!strum.ska,
        bass: bassAt(part.bass || (strum.ska ? 'walk' : 'eighths'), s, chord, part.strum),
        lead: s % 2 === 0 ? mel[eighth] ?? '.' : '_',
        drum: drums[s],
      });
    }
  });
  return steps;
}

// The bass note for this sixteenth (semitones above the key, null = silent).
function bassAt(style, s, chord, strum) {
  if (style === 'none') return null;
  if (strum === 'stop' || strum === 'ring') return s === 0 ? chord : null;
  if (style === 'quarters') return s % 4 === 0 ? chord : null;
  if (style === 'walk') return s % 4 === 0 ? chord + [0, 7, 12, 9][s / 4] : null;
  return s % 2 === 0 ? chord : null;
}

const hz = midi => 440 * 2 ** ((midi - 69) / 12);

// The synthesised band: distorted power-chord guitar, bass, drum kit (with claps, shouts and tambourine), and a
// lead "voice" that changes with the song.
export function createBand(ctx, dest, band = {}) {
  const out = ctx.createGain(); out.gain.value = band.gain ?? 1; out.connect(dest);
  const noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const nd = noiseBuf.getChannelData(0);
  for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
  const drive = band.drive ?? 4;
  const curve = new Float32Array(1024);
  for (let i = 0; i < 1024; i++) { const x = i / 512 - 1; curve[i] = Math.tanh(x * drive); }
  // the lead can go through an echo (surf, the river)
  let leadOut = out;
  if (band.echo) {
    const delay = ctx.createDelay(1); delay.delayTime.value = band.echo;
    const fb = ctx.createGain(); fb.gain.value = 0.35;
    const wet = ctx.createGain(); wet.gain.value = 0.5;
    leadOut = ctx.createGain();
    leadOut.connect(out); leadOut.connect(delay); delay.connect(fb).connect(delay); delay.connect(wet).connect(out);
  }
  const env = (g, t, vol, dur, attack = 0.004) => {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(dur, attack + 0.01));
  };
  const osc = (type, freq, t, dur, dest, detune = 0) => {
    const o = ctx.createOscillator(); o.type = type; o.frequency.value = freq; o.detune.value = detune;
    o.connect(dest); o.start(t); o.stop(t + dur + 0.05);
    return o;
  };
  const noise = (t, dur, vol, type, freq, q = 1) => {
    const src = ctx.createBufferSource(); src.buffer = noiseBuf;
    const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = ctx.createGain(); env(g, t, vol, dur, 0.002);
    src.connect(f).connect(g).connect(out); src.start(t, Math.random() * 0.5); src.stop(t + dur + 0.02);
  };
  return {
    out,
    // a power chord (root, fifth, octave); muted = short and dark; ska = thin bright upstroke; arp = one note, clean
    guitar(t, midi, dur, { mute = false, ska = false, arp = null } = {}) {
      const shaper = ctx.createWaveShaper(); shaper.curve = curve;
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = arp !== null ? 2200 : mute ? 1100 : ska ? 4200 : 3200;
      const g = ctx.createGain(); env(g, t, arp !== null ? 0.09 : mute ? 0.1 : ska ? 0.08 : 0.12, dur);
      (arp !== null ? lp : shaper.connect(lp)).connect(g).connect(out);
      const into = arp !== null ? lp : shaper;
      const notes = arp !== null ? [[arp, 0]] : ska ? [[12, 0], [19, 4], [24, -4]] : [[0, -7], [7, 6], [12, 0], ...(mute ? [] : [[0, 9]])];
      for (const [semi, detune] of notes) {
        const pre = ctx.createGain(); pre.gain.value = arp !== null ? 0.6 : 0.4;
        pre.connect(into);
        osc(arp !== null ? 'triangle' : 'sawtooth', hz(midi + semi), t, dur, pre, detune);
      }
    },
    bass(t, midi, dur) {
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 700;
      const g = ctx.createGain(); env(g, t, 0.2, dur);
      const g2 = ctx.createGain(); g2.gain.value = 0.35;
      lp.connect(g).connect(out); g2.connect(lp);
      osc('triangle', hz(midi - 12), t, dur, lp);
      osc('square', hz(midi - 12), t, dur, g2);
    },
    lead(t, midi, dur) {
      const kind = band.lead || 'square', f = hz(midi);
      const g = ctx.createGain();
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2600;
      lp.connect(g).connect(leadOut);
      const vibrato = (o, depth, rate) => {
        const v = ctx.createOscillator(); v.frequency.value = rate; const vg = ctx.createGain(); vg.gain.value = depth;
        v.connect(vg).connect(o.detune); v.start(t); v.stop(t + dur + 0.05);
      };
      if (kind === 'organ') {
        env(g, t, 0.06, dur, 0.01);
        for (const [mul, v] of [[1, 1], [2, 0.5], [3, 0.3], [4, 0.15]]) { const gg = ctx.createGain(); gg.gain.value = v; gg.connect(lp); osc('sine', f * mul, t, dur, gg); }
      } else if (kind === 'whistle') {
        env(g, t, 0.09, dur, 0.03);
        lp.frequency.value = 5000;
        vibrato(osc('sine', f * 2, t, dur, lp), 14, 5.5);
        noise(t, Math.min(dur, 0.08), 0.02, 'bandpass', f * 2, 4); // a little breath
      } else if (kind === 'brass') {
        // a section: two detuned saws, the filter opens like a horn blowing
        env(g, t, 0.08, dur, 0.03);
        lp.frequency.setValueAtTime(600, t); lp.frequency.linearRampToValueAtTime(2800, t + 0.08);
        osc('sawtooth', f, t, dur, lp, -8); osc('sawtooth', f, t, dur, lp, 8); osc('sawtooth', f / 2, t, dur, lp);
      } else if (kind === 'tremolo') {
        // surf guitar: fast-picked, the volume flutters
        const trem = ctx.createGain(); trem.gain.value = 0.5; trem.connect(lp);
        const lfo = ctx.createOscillator(); lfo.type = 'square'; lfo.frequency.value = 14; const lg = ctx.createGain(); lg.gain.value = 0.5;
        lfo.connect(lg).connect(trem.gain); lfo.start(t); lfo.stop(t + dur + 0.05);
        env(g, t, 0.11, dur, 0.01);
        const shaper = ctx.createWaveShaper(); shaper.curve = curve; shaper.connect(trem);
        osc('sawtooth', f, t, dur, shaper);
      } else {
        env(g, t, kind === 'saw' ? 0.06 : 0.075, dur, 0.015);
        vibrato(osc(kind === 'saw' ? 'sawtooth' : 'square', f, t, dur, lp, 0), 8, 5.5);
        if (kind === 'saw') osc('sawtooth', f, t, dur, lp, 12);
      }
    },
    drum(t, kind) {
      const thump = (f0, f1, dur, vol) => {
        const o = ctx.createOscillator(); o.type = 'sine';
        o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
        const g = ctx.createGain(); env(g, t, vol, dur, 0.002);
        o.connect(g).connect(out); o.start(t); o.stop(t + dur + 0.02);
      };
      if ('kxc'.includes(kind)) thump(140, 50, 0.13, 0.7);
      if ('so'.includes(kind)) { noise(t, 0.12, 0.5, 'bandpass', 2000); thump(240, 170, 0.07, 0.25); }
      if ('hxo'.includes(kind)) noise(t, 0.025, 0.1, 'highpass', 8000);
      if (kind === 'c') noise(t, 0.8, 0.2, 'highpass', 5000);
      if (kind === 't') thump(200, 100, 0.15, 0.45);
      if (kind === 'p') { for (const d of [0, 0.012, 0.024]) noise(t + d, 0.06, 0.35, 'bandpass', 1400, 1.5); }
      if (kind === 'b') noise(t, 0.05, 0.12, 'highpass', 9000);
      if (kind === 'y') { noise(t, 0.18, 0.4, 'bandpass', 750, 6); noise(t, 0.18, 0.3, 'bandpass', 1250, 6); thump(260, 200, 0.15, 0.15); }
    },
  };
}

// Plays a song in a loop, scheduling a little ahead (Web Audio timing). Returns stop().
export function playSong(ctx, out, song) {
  const band = createBand(ctx, out, song.band);
  const steps = song.order.flatMap(name => expand(song.parts[name]));
  const six = 60 / song.bpm / 4;
  let i = 0, next = ctx.currentTime + 0.08;
  const leadLen = at => {
    let n = 2;
    while (steps[(at + n) % steps.length].lead === '_' && n < 32) n++;
    return n * six;
  };
  const timer = setInterval(() => {
    while (next < ctx.currentTime + 0.25) {
      const at = i % steps.length, s = steps[at];
      if (s.chord !== null) {
        const dur = six * s.ring * (s.mute ? 0.55 : 0.92);
        band.guitar(next, song.key + 12 + s.chord, dur, { mute: s.mute, ska: s.ska, arp: s.arp });
      }
      if (s.bass !== null) band.bass(next, song.key + 12 + s.bass, six * (s.ring >= 16 ? 14 : 1.8));
      if (s.lead !== '.' && s.lead !== '_') band.lead(next, song.key + 24 + parseInt(s.lead, 10), leadLen(at) * 0.92);
      if (s.drum && s.drum !== '.') band.drum(next, s.drum);
      next += six; i++;
    }
  }, 40);
  // stop: no new notes, and the ones already scheduled (ringing bass, crashes, echo) fade out at once
  return () => {
    clearInterval(timer);
    band.out.gain.setTargetAtTime(0, ctx.currentTime, 0.03);
    setTimeout(() => band.out.disconnect(), 400);
  };
}

// Schedules `seconds` of a song in one go (for an OfflineAudioContext: checks, or exporting a preview).
export function renderSong(ctx, out, song, seconds) {
  const band = createBand(ctx, out, song.band);
  const steps = song.order.flatMap(name => expand(song.parts[name]));
  const six = 60 / song.bpm / 4;
  for (let i = 0, t = 0.05; t < seconds; i++, t += six) {
    const at = i % steps.length, s = steps[at];
    if (s.chord !== null) band.guitar(t, song.key + 12 + s.chord, six * s.ring * (s.mute ? 0.55 : 0.92), { mute: s.mute, ska: s.ska, arp: s.arp });
    if (s.bass !== null) band.bass(t, song.key + 12 + s.bass, six * (s.ring >= 16 ? 14 : 1.8));
    if (s.lead !== '.' && s.lead !== '_') band.lead(t, song.key + 24 + parseInt(s.lead, 10), six * 2);
    if (s.drum && s.drum !== '.') band.drum(t, s.drum);
  }
}
