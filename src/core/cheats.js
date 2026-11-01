// Typed cheat codes, as in DOOM: letters typed during play, no Enter needed.

export function createCheatReader(codes) {
  const longest = Math.max(...codes.map(c => c.code.length));
  let buffer = '';
  return {
    // Feed one key; returns the matched cheat (or null).
    feed(key) {
      if (!/^[a-z]$/i.test(key)) return null;
      buffer = (buffer + key.toUpperCase()).slice(-longest);
      const hit = codes.find(c => buffer.endsWith(c.code));
      if (hit) buffer = '';
      return hit || null;
    },
    // True while the last letters typed are the start of a code (letters like Q and E must not switch weapon then).
    typing() {
      for (let i = 0; i < buffer.length - 1; i++) if (codes.some(c => c.code.startsWith(buffer.slice(i)))) return true;
      return false;
    },
  };
}
