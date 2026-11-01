// The SONNO meter: it replaces DOOM's health. 0 = wide awake, 100 = asleep.
// Three naps and it is YOU LOSE.

export const SLEEP_MAX = 100;
export const LIVES = 3;
// Hot chocolate works like DOOM's green armour: it takes a third of every hit until it runs out.
// The huge mug is the blue armour: half of every hit.
export const ARMOR_SHARE = 1 / 3;
export const ARMOR_SHARE_STRONG = 1 / 2;

export function createSleep() {
  return { value: 0, lives: LIVES, god: false, armor: 0, strong: false };
}

// Adds sleep (positive) or wakes up (negative, e.g. honey). `rate` is the bear's resistance.
// Returns 'asleep' when the meter reaches the top, otherwise null.
export function addSleep(s, amount, rate = 1) {
  if (amount > 0) {
    if (s.god) return null;
    let hit = amount * rate;
    if (s.armor > 0) {
      const absorbed = Math.min(s.armor, hit * (s.strong ? ARMOR_SHARE_STRONG : ARMOR_SHARE));
      s.armor -= absorbed;
      hit -= absorbed;
      if (s.armor <= 0) s.strong = false;
    }
    s.value = Math.min(SLEEP_MAX, s.value + hit);
    return s.value >= SLEEP_MAX ? 'asleep' : null;
  }
  s.value = Math.max(0, s.value + amount);
  return null;
}

// Drinking hot chocolate. `cap` = how high this cup can fill (100 the cup, 200 the huge mug).
// Returns false when the cup would be wasted (already that full).
export function addArmor(s, amount, cap = 100) {
  if (s.armor >= cap) return false;
  s.armor = Math.min(cap, s.armor + amount);
  if (cap > 100) s.strong = true;
  return true;
}

// After the "buonanotte" scene: lose a life and wake up again. Returns true when the game is over.
export function napTaken(s) {
  s.lives -= 1;
  s.value = 0;
  return s.lives <= 0;
}

// Which HUD face to show. `hurt` = just hit, `grin` = just picked up a new weapon, `trapped` = tied up.
export function faceFor(s, { hurt = false, grin = false, trapped = false } = {}) {
  if (s.god) return 'invincibile';
  if (trapped) return 'trapped';
  if (grin) return 'ghigno';
  if (s.value >= 85) return 'sbadiglio';
  if (hurt) return 'colpito';
  if (s.value >= 50) return 'assonnato';
  return 'sveglio';
}
