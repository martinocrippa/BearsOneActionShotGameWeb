// TRAINING ("LEARN" in the menu): one room per lesson, an instruction box (in Italian: it explains how to play)
// the first time the bear walks into each room, cardboard cut-outs to shoot at (they never shoot back and stand
// up again). Not part of the episode: it ends back at the menu.
const say = (solo, coop = solo) => ({ solo, coop });
const room = (style, text, extra = {}) => ({ style, say: text, ...extra });

export default {
  id: 'TRAINING', name: 'Training', file: 'training.txt', par: 300, music: 'title', training: true,
  sky: { key: 'textures/sky', top: '#7fd0f0', bottom: '#bfe8f7', ground: '#5fae5a' }, horizon: 'hills',
  exitProp: 'lever', next: null,
  intro: 'TRAINING: learn everything, nobody will make you sleepy here!',
  legend: {
    walls: {
      '#': 'tronchi',
      '%': { style: 'legno', switch: 'N' }, // the lever on the wall
      N: { style: 'cancello', mover: true, color: '#3a3a3a' }, // the gate it lowers
    },
    floors: {
      a: room('terra', say(
        'BENVENUTO ALL\'ALLENAMENTO! Cammina con ↑ ↓ e girati con ← →. A e D ti spostano di lato. Esci dal passaggio!',
        'BENVENUTI! CHI GUIDA: ↑ ↓ per camminare, ← → per spostarsi di lato. CHI SPARA: A e D per girarsi e mirare.')),
      b: room('erba', say(
        'Sagome di CARTONE! Girati verso una: il mirino diventa ROSSO. Poi SPARA con SPAZIO!',
        'Sagome di CARTONE! CHI SPARA: gira con A e D finché il mirino è ROSSO, poi SPAZIO!')),
      e: room('erba', 'Cambia arma con Q ed E (o con i numeri). Prova lo SPARACONFETTI (3) sulle Puzzole: ogni arma fa uno scherzo diverso!'),
      f: room('terra', 'Un\'arma nuova! Passaci sopra per prenderla: è lo SPARA-GELATINA (5). Le sagome si rialzano: provale tutte!'),
      i: room('erba', say(
        'Questo gradino è troppo alto: SALTA con ALT GR (o INVIO)! Lassù c\'è del miele.',
        'Gradino alto: CHI GUIDA salta con ALT GR (o INVIO)!')),
      j: room('erba', 'FANGO! Rallenta e fa venire SONNO: la barra SLEEP sale. Passa sulla passerella di legno. Il MIELE ti sveglia!'),
      n: room('terra', 'ASCENSORE: sali sul pavimento a strisce gialle e nere e aspetta. Lassù c\'è la GHIANDA D\'ORO!'),
      y: room('assi', 'La GHIANDA D\'ORO apre la porta di tronchi. Salta giù e vai alla porta!', { h: 2.4 }),
      p: room('terra', 'Tocca la LEVA sul muro: il cancello si apre. Psst... un muro qui nasconde un SEGRETO: toccalo!'),
      t: room('erba', 'Tieni premuto TAB per vedere la mappa. Poi tocca la leva EXIT per finire l\'allenamento!'),
      '~': { style: 'fango', h: -0.2, slow: 0.55, sleepy: 3.5, liquid: true },
      '=': { style: 'assi', h: 0.2 },
      '^': { style: 'roccia', h: 1.0 },
      '&': { style: 'assi', h: 2.4, lift: 0 },
    },
    decor: { '!': 'cartello' },
    keys: ['ghianda'],
    secret: 'legno',
    side: 'roccia',
  },
};
