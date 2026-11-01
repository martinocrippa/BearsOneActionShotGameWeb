// The three bears. Colours drive both the placeholder drawings and the recolouring of the paws.
// Names are provisional: replace them with the ones the kids choose (fantasy names only, never real ones).
export const BEARS = [
  {
    id: 'orsa', name: 'Orsa', title: "L'ORSA", trait: 'La più veloce',
    bg: '#ff2d8a', fur: '#8b5a36', light: '#d9a877', hair: '#5a3620', iris: '#4a2e14',
    shirt: '#1f5fbf', stripes: '#111111', pants: '#111111', shoes: '#1f5fbf',
    crest: 'pony', band: '#1f5fbf', mouth: 'smirk',
    eyeHeight: 1.55, speed: 1.15, jump: 1, sleepRate: 1, bodyScale: 0.95, shoulders: 1,
  },
  {
    id: 'piccolo', name: 'Piccolo', title: 'IL PICCOLO', trait: 'Salta più in alto',
    bg: '#ffd400', fur: '#9a6239', light: '#e2b88a', hair: '#6e4122', iris: '#5a3a1a',
    shirt: '#e3262b', pants: '#f6cf2a', shorts: true, shoes: '#111111',
    crest: 'crazy', glasses: true, mouth: 'grin',
    eyeHeight: 1.3, speed: 1, jump: 1.35, sleepRate: 1, bodyScale: 0.84, shoulders: 0.82,
  },
  {
    id: 'grande', name: 'Grande', title: 'IL GRANDE', trait: 'Resiste di più al sonno',
    bg: '#28c2b4', fur: '#cf9a62', light: '#f1d7ae', hair: '#a8733f', iris: '#7f9a86',
    shirt: '#f28a16', pants: '#3f9a3c', shoes: '#5a3a1a',
    crest: 'mild', mouth: 'calm',
    eyeHeight: 1.7, speed: 1, jump: 1, sleepRate: 0.75, bodyScale: 1.04, shoulders: 1.12,
  },
];

export const bearById = id => BEARS.find(b => b.id === id) || BEARS[0];
