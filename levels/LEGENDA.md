# Legenda delle mappe

Ogni livello ha **due file**:
- la **mappa** `levels/e1mN-nome.txt`: ogni carattere è un quadrato di 2×2 metri, la prima riga è il nord e il bordo deve essere tutto muro;
- la **definizione** `levels/defs/e1mN.js`: dice cosa sono i caratteri di *quel* livello (muri, pavimenti, decorazioni), più cielo, musica, chiavi e cosa viene dopo.

Per provare una modifica salva i file: con `npm run dev` acceso il gioco si ricarica da solo.
Per controllare un livello: `node scripts/check-level.mjs levels/defs/e1m2.js`. Lo script verifica che la mappa sia chiusa, che ogni carattere sia conosciuto e che il livello **si possa finire in ordine** (chiave → porta → leva → uscita).

## Caratteri uguali in tutti i livelli

### Speciali
| Car. | Cosa |
|---|---|
| `P` | Partenza: l'orso guarda verso nord |
| `X` | Checkpoint: dopo una dormita si riparte da qui |
| `E` | Uscita |
| `Q` | **Uscita segreta**: porta al livello segreto |
| `$` | Punto segreto: conta nella pagella |
| `S` | **Muro segreto**: sembra un muro normale (`legend.secret` dice quale) e si apre quando lo tocchi |
| `K` `k` | La prima e la seconda **chiave** del livello (`legend.keys`) |
| `D` `d` | Porta che si apre con la prima / la seconda chiave |
| `:` | Porta senza chiave: si apre quando la tocchi |

### Avversari
| Car. | Chi | Ricalca (DOOM) |
|---|---|---|
| `1` | Scoiattolo | Zombieman |
| `2` | Donnola | Shotgun Guy |
| `3` | Volpe | Chaingunner |
| `4` | Puzzola | Imp |
| `5` | Cinghialotto (carica, corpo a corpo) | Pinky |
| `6` | Oca (vola) | Cacodemon |
| `7` | Papero in picchiata (vola) | Lost Soul |
| `8` | Gallo generale (mini-boss) | Baron of Hell |
| `9` | Maiale in blu (boss) | Cyberdemon |

### Oggetti
| Car. | Cosa | Car. | Cosa |
|---|---|---|---|
| `h` | Miele | `c` | Caramelle (fionda) |
| `H` | Barattolone di miele | `o` | Confetti (sparaconfetti) |
| `M` | Super miele (sveglia del tutto) | `l` | Liquirizie (arma 4) |
| `A` | Cioccolata calda (armatura) | `g` | Gelatina (arma 5) |
| `B` | Tazzona di cioccolata (armatura forte) | `u` | Zucchero filato (arma 6) |
| `Z` | Zainetto (il doppio di munizioni) | `r` | Frecce di zucchero (arma 7) |
| `V` | Stivali di gomma (30 s senza sonno in fango e acqua) | `q` | Bombola FIZZ (arma 8) |
| `Y` | Mappa (TAB la mostra tutta) | `m` | Gumball (arma 9) |

### Armi da raccogliere
| Car. | Arma |
|---|---|
| `L` | 4 Spara-liquirizie |
| `G` | 5 Spara-gelatina |
| `U` | 6 Lancia-zucchero-filato |
| `J` | 7 Balestra di zucchero |
| `F` | 8 Estintore FIZZ |
| `W` | 9 B.F.G. (Big Fat Gumball) |

Tutti gli altri caratteri li sceglie ogni livello nella sua legenda: le lettere libere `a b e f i j n p s t v w x y z C I N O R T` e i simboli come `# . , ~ = ^ % _ - + * & @ ! ? ; < > / [ ] { } ( ) ' " | 0` e il backtick. Se una legenda usa un carattere della tabella sopra, vale la legenda.

## La legenda di un livello (`levels/defs/e1mN.js`)

```js
legend: {
  wallHeight: 4,                       // altezza dei muri (metri), 4 di base; l'aula gigante ne ha di più
  walls: {
    '#': 'cava',                       // muro: il disegno è textures/wall_cava
    '|': { style: 'rete', rail: true },// ringhiera/rete: ferma l'orso ma ci si vede e ci si spara attraverso
    'n': { style: 'muretto', h: 1.2 }, // muretto basso: ci si vede e ci si spara sopra
    'v': { style: 'cartelloni', h: 1.2, low: true }, // in più ci si salta sopra e lo si scavalca (gli avversari no)
    '%': { style: 'legno', switch: 'N' }, // LEVA sul muro: toccandola muove tutte le celle con il carattere N
    'N': { style: 'cancello', mover: true }, // muro che sprofonda quando scatta la sua leva
  },
  floors: {
    '.': 'erba',                       // pavimento a terra (altezza 0)
    '~': { style: 'acqua', h: -0.4, slow: 0.6, liquid: true },          // acqua: rallenta, ci si affonda
    'f': { style: 'fango', h: -0.2, slow: 0.55, sleepy: 3.5, liquid: true }, // fango: in più fa venire sonno
    'i': { style: 'ghiaccio', slip: true },                             // ghiaccio: si scivola
    '^': { style: 'roccia', h: 0.75 },                                  // gradino: oltre 0,65 m si sale saltando
    ',': { style: 'linoleum', ceil: 3.5, ceilStyle: 'lampade', light: 0.8 }, // AL CHIUSO: soffitto a 3,5 m, luce 80%
    'v': { style: 'cemento', ceil: 3, light: 0.4 },                     // zona buia (luce 40%)
    '&': { style: 'assi', h: 2, lift: 0 },                              // ASCENSORE: sta a 2 m, scende a 0 quando arrivi
    '_': { style: 'pietra', h: -2, to: 0 },                             // pavimento che SALE a 0 quando scatta la leva con '_' (ponte)
    '*': { style: 'erba', trigger: 'N' },                               // camminandoci sopra scatta tutto ciò che ha il carattere N
    'a': { style: 'erba', say: 'Premi SPAZIO per sparare!' },           // ALLENAMENTO: la prima volta che ci passi mostra
                                                                        // l'istruzione (testo, o { solo, coop })
  },
  decor: { a: 'albero_autunno', x: 'canne', p: { id: 'panchina' } },  // decorazioni (vedi data/items.js DECOR;
                                               // quelle con `pop`, come il cestino, scoppiano in coriandoli se colpite)
  keys: ['piuma_blu', 'piuma_rossa'],          // K e k (vedi data/items.js KEYS)
  secret: 'cava',                              // che aspetto ha il muro segreto S
  side: 'cava',                                // muro da mostrare sui fianchi dei pavimenti rialzati (di base: il primo muro)
                                               // (un pavimento può avere il suo: { style: 'banco', h: 3.6, side: 'cattedra' })
},
```
- `color` (in un muro o pavimento) e `ceilColor` (del soffitto) sono i colori del disegno di riserva, quello fatto dal codice: si vede solo se manca il disegno di Claude Design.
- Il primo pavimento della legenda è quello di base: oggetti, avversari e decorazioni stanno sopra al pavimento che hanno intorno.
- Si sale **camminando** fino a 0,65 m di dislivello (gradini e file delle tribune) e **saltando** fino a circa 1,5 m. Il gioco suggerisce di saltare quando l'orso sbatte contro un gradino che si può saltare.
- Un soffitto deve stare almeno 2,2 m sopra il pavimento.

## Le altre impostazioni del livello
```js
{
  id: 'E1M2', name: 'Increa Park', file: 'e1m2-increa.txt', par: 180, music: 'e1m2',
  sky: { key: 'textures/sky_e1m2', top: '#f3b48a', bottom: '#f7c9a8', ground: '#6f8f46' },
  horizon: 'hills',          // facoltativo: colline con gli abeti all'orizzonte
  weather: 'leaves',         // facoltativo: 'rain' | 'snow' | 'leaves'
  exitProp: 'lever',         // l'uscita: 'lever' (palo con la leva) o 'mushroom' (solo E1M1)
  next: 2,                   // indice del livello dopo l'uscita normale (null = fine episodio)
                             // secretNext: 8 → dopo l'uscita segreta Q (solo se il livello ne ha una, come E1M3)
  fogNear: 50, fogFar: 120,  // facoltativi: nebbia da/a quanti metri (di base 50/120)
  bossOpens: 'N',            // facoltativo: quando il boss si addormenta scattano le celle con N
  intro: 'Find the BLUE QUAIL FEATHER!', // primo messaggio (in inglese)
}
```
## Cartelli con le indicazioni
```js
signs: [
  { x: 28, z: 38, text: 'FIND THE BLUE QUAIL FEATHER!', to: 'piuma_blu' }, // freccia verso la piuma
  { x: 3, z: 2, text: 'BLUE QUAIL FEATHER DOOR', to: 'door:piuma_blu' },   // freccia verso la sua porta
  { x: 48, z: 10, text: 'EXIT', to: 'exit' },                              // freccia verso l'uscita
  { x: 10, z: 5, text: 'WATCH OUT FOR THE MUD!' },                         // solo la scritta
],
```
- `x`, `z`: colonna e riga della mappa di testo (si parte da 0). Il cartello sta sul pavimento di quella cella: deve essere libera (niente oggetti, avversari o decorazioni).
- `text`: le parole, in inglese e brevi (stanno su 3 righe al massimo).
- `to`: dove porta la freccia: `'exit'`, l'id di una chiave (dove sta la chiave) o `'door:<id chiave>'` (la porta che apre). La freccia segue la strada vera, gira con lo sguardo di chi legge e non svela mai i passaggi segreti. Se l'obiettivo (una chiave o l'uscita) si raggiunge solo con una chiave che l'orso non ha ancora, il cartello scrive da solo "FIND THE <chiave> FIRST!" con la freccia verso quella chiave; i cartelli delle porte restano come sono.
- `node scripts/place-signs.mjs levels/defs/e1mN.js` propone i cartelli lungo la catena partenza → chiave → porta → … → uscita; poi si guardano nel gioco e si sistemano a mano. `npm test` controlla che ogni cartello stia su un pavimento raggiungibile e che la freccia trovi la strada.

- `training: true` (solo `levels/defs/training.js`): gli avversari diventano sagome di cartone che si rialzano, il livello non salva nulla e finisce con la sua pagella.
