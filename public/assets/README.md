# Disegni definitivi

Qui ci sono i disegni di Claude Design dell'MVP e dell'Episodio 1 completo (passi E1-1 … E1-11), importati dallo zip
`docs/design/orsi-assets-E1.zip` (estratto) con:
```
node scripts/import-assets-zip.mjs <cartella orsi-assets estratta dallo zip> [--clean]
```
Lo script rinomina tutto con i nomi del gioco e scrive `assets.json` con misura e punto d'appoggio di ogni disegno.
Senza `--clean` **aggiunge** i disegni a quelli già importati (uno zip può contenere un passo solo); con `--clean` prima
toglie quelli portati da uno zip precedente. In tutti e due i casi **non tocca** quelli presi direttamente dal canvas.
Dopo ogni import: `node scripts/missing-art.mjs` aggiorna `docs/disegni-mancanti.md` (oggi: nessuno manca).

La **copertina animata** viene dal canvas (artboard "CoverAnimata"), non dallo zip:
```
node scripts/import-claude-design.mjs <cartella>/CoverAnimata.dc.html=screens/title/animated
```
Il gioco la mostra nella schermata del titolo; dietro ai menu usa lo sfondo e gli orsi fermi.

Per un disegno che manca il gioco usa il **segnaposto** generato dal codice (`src/art/`). Per usare un disegno vero:
1. metti il file qui dentro (SVG oppure PNG con sfondo trasparente), con il **nome giusto**;
2. aggiungilo a `assets.json`.

Non serve toccare il codice. Si può sostituire un disegno alla volta.

## Dal canvas di Claude Design
Gli artboard del canvas (un SVG ciascuno, titolo = nome del file) si scaricano e si importano con:
```
node scripts/import-claude-design.mjs <cartella con i file .dc.html scaricati>
```

## assets.json
Un elenco di `{ key, path, w, h, anchor, source }`: `key` è il nome del disegno, `path` il file relativo a questa
cartella, `w`/`h` la tela, `anchor` il punto d'appoggio, `source` "zip" o "canvas". Va bene anche un elenco di soli
percorsi (`"items/miele.png"`): il nome è il percorso senza estensione.

SVG quando si può (leggero, nitido); PNG per i disegni con scritte (un SVG mostrato come immagine non vede i font della
pagina) e per le schermate. Le armi in mano restano sempre SVG: sono inserite nella pagina, dove i font funzionano e la
pelliccia (`class="fur"`, `"fur-light"`) prende il colore dell'orso scelto.

## Nomi e misure (nomi del gioco; lo script converte quelli di Claude Design)
| Cosa | Nome | Tela | Note |
|---|---|---|---|
| Avversari | `enemies/<avversario>/<azione>_<vista>_<frame>` | 512×512 | piedi sulla riga y=488; l'orso Piccolo è alto 300 px. In volo (Oca, Papero) le zampe sono a y≈470 |
| Boss | `enemies/maiale/…` | 1024×1024 | piedi a y=976 (`canvas: 1024` in `data/enemies.js`); `defeat_f_1..3` al posto degli effetti |
| … azioni | `idle` (1), `walk` (4) o `fly` (2), `attack` (1 carica, 2 sparo), `pain` (1) | | |
| … viste | `f` fronte, `fq` ¾ davanti, `s` profilo, `bq` ¾ dietro, `b` dietro | | l'altra metà si ottiene specchiando |
| … effetti (solo `f`) | `stordito_f_1/2`, `panciaPiena_f_1`, `guance_f_1`, `gelatina_f_1`, `legato_f_1` | 512×512 | da Claude Design: stun / full / cheeks / jelly / tied |
| Proiettili | `projectiles/<nome>/fly_f_1`, `fly_f_2`, `splat_f_1` | 256×256 | centrati, il disegno occupa ~40% della tela |
| Effetti | `fx/<ragnatela\|ali\|bollicine>/overlay_f_N`, `fx/esplosione/burst_f_N`, `fx/sagoma/stand_f_1` | 512×512 | sopra l'avversario |
| Scritte | `fx/word_<LETTERE>` (`fx/word_BURP`, `fx/word_GLOP`…), `fx/word_stordito` per "@#!?" | | da Claude Design: `fx/scritte/<parola>_f_1` |
| Oggetti | `items/<id di data/items.js>` (armi a terra: `items/sparaGelatina`, `spLiquirizia`, `spZucchero`, `spBalestra`, `spFizz`, `spBfg`) | 256×256 | base sulla riga y=240 |
| Decorazioni | `decor/<id di data/items.js>`; il cartello vuoto `decor/cartello_vuoto` (il gioco ci scrive sopra le indicazioni) | varie (cartello 256×384) | base in fondo alla tela |
| Porte | `doors/<chiave>/closed`, `doors/plain/closed` (la porta sale: l'immagine "aperta" non serve); la porta della ghianda è `textures/door` | | |
| Uscite | `props/lever_off\|on`, `props/lever_secret_off\|on`, il fungo di E1M1 `props/exit_off\|on` | 512×512 | |
| Muri, pavimenti, soffitti, ringhiere | `textures/<wall_\|floor_\|ceil_\|rail_>nome` (liquidi: secondo frame `floor_<nome>_2`) | 256×512 / 256×256 | ripetibili |
| Leva, ascensore | `textures/switch_off\|on`, `textures/floor_lift` | | |
| Cieli | `textures/sky`, `textures/sky_e1mN` | 2048×512 | si ripetono in orizzontale |
| Armi in mano | `weapons/<arma>/<azione>_<frame>` | 1024×512 | |
| HUD | `hud/face_<orso>/<umore>`, `hud/trapped/<jelly\|licorice>`, `hud/gift/<closed\|open>` | | |
| Schermate | `screens/<title\|intermission\|ending\|episode2>/background` | 1920×1080 | senza scritte: le scritte le mette il gioco |
| Bonus SWEET SHOT | `bonus/<dawn\|noon\|night>/<panorama\|front>`, `bonus/birds/<uccello>/<posa>`, `bonus/rifle/idle_f_1` | 3200×1080, 256, 1024×256 | |
