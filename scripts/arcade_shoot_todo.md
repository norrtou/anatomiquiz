# Arcade: Shoot! — plan och facit

> **Status:** PLANERAD och **beslutad** (alla frågor besvarade 2026-08-01),
> inget byggt. Den här filen är facit för bygget — klar att börja på.
> **Slug:** `shoot` · **Synligt namn:** Arcade: Shoot! (båda fria ord, §12.1)
> **Föregångare:** `js/pop.js` (0.9.314–315) är närmaste förlaga — samma
> ämnesurval, samma `.gm-*`-bas, samma teststruktur.
>
> Läs **[`CLAUDE_REGLER.md`](../CLAUDE_REGLER.md) §12 och §13.1** före bygget.
> Punkterna i §13.1 är besvarade längre ner och ska byggas i FÖRSTA bygget —
> aldrig som ett polishpass efteråt.

---

## 1. Vad spelet är

Ett prickskytte som lånar Quizlet Gravitys grundkänsla (tidspress, ett tåg av
objekt som kommer emot dig) men vänder på den: **målen står stilla, hindren
rör sig.**

Fyra prickskyttetavlor formade som **kranier** står på rad högst upp. I varje
kranium står ett ord — svarsalternativen till frågan, hämtade ur det ämne som
är valt i startvyn. Nedtill i mitten sitter en **gevärspipa** som du siktar
med, och en **röd streckad laserlinje** visar siktlinjen.

Skjut kraniet med rätt svar → det **faller omkull**, poäng, ny fråga.

Mellan dig och målen glider **tomma kranier** horisontellt förbi. De är
oskyldiga. Träffar du ett sådant är rundan **slut** — det är hela spänningen.
Rundan pågår alltså tills du missar och träffar en oskyldig, eller tills
5 minuter gått.

---

## 2. Mätt underlag (gjort 2026-08-01, gissa inte om)

Kranierna är smala: fyra på rad i ett fält som är ~336 px brett på mobil ger
**~76 px per mål**. Ordet måste rymmas där, med radbrytning på två rader.

| Maxtecken | Maxord | Frågor | Ämnen med ≥8 |
|---|---|---|---|
| 22 | 2 | 4 679 | 138 |
| 16 | 2 | 3 403 | 124 |
| **14** | **2** | **2 861** | **109** |
| 12 | 2 | 2 180 | 84 |
| 10 | 2 | 1 432 | 52 |

Underlaget är MC-frågor med **minst 3 distraktorer** (13 321 st totalt), vilket
krävs för att fylla fyra mål.

**Beslut: ≤14 tecken och ≤2 ord.** Ger 2 861 frågor i 109 ämnen, och
alternativens längd har median 8 och p90 12 tecken — alltså ryms de allra
flesta på en rad, och de längsta på två. Samma mjuka lättnad som i Pop!
(ett steg lösare filter innan ämnet skuggas).

⚠️ **Verifiera geometrin renderat innan resten byggs.** Om ett 14-teckensord
inte ryms läsbart i ett 76 px-kranium på 390×844 är det filtret som ska
skärpas, inte kravet på fyra mål — användaren har varit tydlig med fyra på rad.

---

## 3. Regler (användarens spec, ordagrant tolkad)

| Regel | Beteende |
|---|---|
| Mål | 4 kranier på rad överst, ett ord i varje (1 rätt + 3 distraktorer) |
| Skjut rätt kranium | Det faller omkull, poäng, ny fråga direkt |
| Skjut tomt kranium (oskyldigt) | **Rundan slut** |
| Skjut fel kranium (fel ord) | Räknas som miss (träffsäkerhet ned), ny fråga. **Inte** slut |
| Skott som inte träffar något | Räknas som miss. Frågan står kvar tills 6-sekunderna går ut |
| 6-sekundersklocka per fråga | Hinner du inte skjuta byts målen ut och det räknas som miss |
| Maxlängd | 5 minuter → rundan avslutas med **"Du är en mästerskytt!"** + utmärkelse i topplistan |

Raderna om fel kranium, bomskott och vad 6-sekundersklockan gör med *frågan*
var från början mina tolkningar av specen. **Bekräftade av användaren
2026-08-01** och gäller därmed som skrivna.

---

## 4. Svårighetstrappa

Specen sa både "max svårighet uppnådd vid ca 2 minuter" och räknade sedan upp
fartökningar vid 2, 2,5 och 3 minuter. **Beslutat 2026-08-01: två skilda
trappor** — **antalet** hinder är maxat tidigt, **farten** fortsätter uppåt:

| Tid | Antal hinder | Fart |
|---|---|---|
| 0:00 | 1 | bas |
| 0:30 | 2 | bas |
| 1:00 | 3 | bas |
| 1:30 | 4 (max) | bas |
| 2:00 | 4 | snabbare |
| 2:30 | 4 | ännu snabbare |
| 3:00 | 4 | mycket snabb (max) |
| 5:00 | — | rundan slut, mästerskytt |

✅ **Bekräftat:** full uppsättning hinder vid 1:30, full fart först vid 3:00.
Trappan ovan är alltså facit; "max vid 2 minuter" gäller *antalet*, inte farten.

**Hårt designkrav:** det ska alltid *gå* att skjuta igenom. När hindren placeras
måste motorn garantera en lucka — ingen slumpkonfiguration får stänga korridoren
helt, ens vid 4 hinder i max fart. Det är skillnaden mellan svårt och orättvist,
och det är en spärr som ska testas, inte hoppas på.

---

## 5. Poäng

**poäng = träffar × 10 × träffsäkerhet + 1 poäng per överlevd sekund**

Exempel: 40 träffar, 85 % träffsäkerhet, 3 minuter → 40 × 10 × 0,85 + 180 = **520**.

Alla tre delarna vägs in, och formeln går att förklara på en rad i spelvyn.
Mästerskytt (5 min) ger **ingen extra poäng** utan en **utmärkelse** (⭐) på
raden i topplistan — annars blir poängen svårläst.

Topplistan sorterar på poäng, med träffsäkerhet som utslag.

✅ **Bekräftat 2026-08-01:** formeln enligt ovan, och mästerskytt förblir ett
märke — inte poäng.

---

## 6. Motor och känsla

### Sikte och skott
- **Fältet** mäts med `getBoundingClientRect` (samma som Pop!), rAF-loop med
  taket `POP_MAX_STEP_MS`-motsvarighet så ett flikbyte inte ger ett jättehopp.
- **Sikte:** `pointerdown` sätter vinkeln, `pointermove` justerar löpande,
  `pointerup` **avfyrar**. Vinkeln är `atan2` från pipans bas till fingret,
  begränsad till ±70° från lodrätt. Fungerar likadant med mus på dator.
  Att sikta med draget och skjuta på släppet ger precision på mobil, där ett
  enkelt tryck alltid blir oprecist.
- **Laserlinjen:** röda prickar från mynningen i skjutriktningen upp till
  fältets överkant. Prickar, inte heldragen linje — det läser som sikte och
  inte som en vägg.
- **Projektilen har restid.** Det är det som gör hindren till en utmaning:
  ~1 000 px/s som startvärde, **ställs in genom att spela**, inte gissas.
  Kollision stegas längs banan varje bildruta (cirkel mot cirkel).

### Rekyl och träff — det som ger känslan
- Pipan **rekylerar** bakåt och tillbaka (~120 ms) vid skott.
- **Mynningsflamma** + kort ljud.
- Träffat kranium **faller omkull**: roterar ~80° och tippar ner ur bild.
- Träffat oskyldigt kranium: skärmen **skakar kort**, allt fryser, slutvy.
- Bom: laserlinjen blinkar rött ett ögonblick.

### Hinder
- Egen korridor strax under målraden. Varje hinder `{x, y, vx, size}`, glider
  horisontellt och wrappar runt kanterna.
- Tomma kranier — **formen** skiljer dem, inte färgen. Ett läge där rätt och
  fel bara skiljs av färg bryter WCAG 1.4.1, och här är skillnaden dessutom
  hela spelet.

---

## 7. §13.1 — de åtta punkterna, besvarade

1. **Mikroåterkoppling.** Pipan följer fingret direkt, laserlinjen uppdateras
   varje bildruta, rekyl + mynningsflamma + haptik (10 ms) på varje skott.
2. **Payoff, inte tillståndsbyte.** Träff = kraniet faller omkull, poängen
   studsar, "+1" flyger upp, nya mål glider in uppifrån. ~150 ms, som Pop!.
   Vid miss: kort röd blink, frågan står kvar — ingen stum omritning.
3. **Framstegsmätare över HELA spelet.** Två mätare, för det finns två sorters
   framsteg: **överlevnadstiden** (räknar uppåt mot 5 min, med trappstegen
   utmärkta) och **6-sekundersklockan** för den aktuella frågan. Personbästa i
   ämnet syns som spökmål under spelet, som i Pop!.
4. **Beröm vid delmål.** Vid varje ny nivå i svårighetstrappan ("2 hinder nu!")
   och var tionde träff. Kort, konkret, försvinner av sig självt.
5. **Ett riktigt slut.** Resultatring med träffsäkerhet, poäng, längsta svit,
   överlevd tid, rekordmärke mot personbästa — och listan över missade frågor
   med rätt svar. **Två olika slut** ska kännas olika: "du sköt en oskyldig"
   är ett nederlag, "Du är en mästerskytt!" är en triumf med egen utmärkelse.
6. **Ljud + haptik, avstängbart.** Skott, träff, fall, bom, nivåhöjning, slut.
   Egna Web Audio-toner, kopplade till befintliga "Ljudeffekter"-bocken.
   ⚠️ **`unlockShootAudio()` med tyst enprovsbuffert i gesten + 20 ms
   förhållningstid före varje ton** — annars är läget tyst på iPhone. Se
   §13.1 punkt 6; det kostade ett släpp i Pop! (0.9.315).
7. **Estetik och mobilkänsla.** Spelytan tar all plats som går, paddingar
   minimerade, `var(--view-fit)`. Siktet får en generös träffyta: man siktar
   genom att dra var som helst i fältet, inte genom att träffa pipan.
8. **`prefers-reduced-motion`.** ⚠️ **Här går det inte att bara stänga av
   rörelse — hindrens rörelse ÄR spelet.** Ärligt svar: dekoren (rekyl,
   skärmskak, mynningsflamma, fallanimation) stängs av och ersätts med
   direkta tillståndsbyten, medan hindren fortsätter röra sig — men
   **trappan startar ett steg mildare**. Läget kan inte göras rörelsefritt,
   och det ska stå i förklaringstexten så att den som inte tål rörelse
   slipper upptäcka det själv. Pop!, quiz och flashcards finns kvar för dem.

**Utöver de åtta:**
- **Startrutan inne i spelytan** (`.shoot-start`), som i Pop! — reglerna där,
  inte i en `<details>` ovanför fältet. Den fällde spelplanen under fold i
  Pop! och är dessutom den gest iOS kräver för ljudet.
- ~~**Inga avbrytknappar under rundan.** Rundan tar slut av sig själv.~~
  **ÄNDRAT 0.9.325 på användarens begäran:** en liten Avbryt-knapp finns i
  fältets nedre högra hörn, speglad mot träffräknaren till vänster. Bekräftar
  först och sparar inget — en halvspelad runda hör inte hemma i topplistan.
  Pop! har fortfarande ingen avbrytknapp; det gäller alltså bara Shoot!.

---

## 8. Filer och registrering

| Var | Vad |
|---|---|
| `js/shoot.js` | Hela läget. Egen fil (§12), laddas efter `app.js` |
| `index.html` | `<section id="shoot">`, `<script src="js/shoot.js?v=…">`, aktivera knappen (ta bort `disabled`) |
| `css/styles.css` | `.shoot-*`, egna `.hidden`-regler, fokuslägets `:has()`-lista |
| `js/app.js` | `FIT_SECTIONS` + två skyddade `typeof`-krokar |
| topplistan | `hs-segment[data-mode="shoot"]` finns redan som platshållare — ta bort `--placeholder` och `disabled` |
| `scripts/test_shoot.js` | DOM-skal. Körs automatiskt av `check_spellagen.py` |
| `spellagen.html` | åtta → nio sätt, eget avsnitt, ta bort ur "På väg" |

`python3 scripts/check_spellagen.py` kontrollerar de fyra registreringspunkterna
och kör testskalet — den ska vara grön innan något kallas klart.

---

## 9. Testskal (`scripts/test_shoot.js`)

Samma tre stubbar som Pop!: **styrbar klocka**, **styrbara bildrutor**
(rAF köas, annars rekurserar loopen) och **seedad slump** (annars blir sviten
flakig — det hände i Pop! och föll i varannan körning).

Ska täcka:
- Poolbygge: bara MC med ≥3 distraktorer, ordfiltret, mjuka lättnaden
- Ballistik: projektilen träffar det den siktar på; restiden gör att ett
  hinder hinner in i banan
- **Luckegarantin:** ingen hinderkonfiguration stänger korridoren helt — kör
  många seeds
- Svårighetstrappan byter antal och fart vid rätt tidpunkter
- 6-sekundersklockan byter mål och sänker träffsäkerheten
- Träff på oskyldigt kranium avslutar rundan
- 5-minutersgränsen ger mästerskytt + utmärkelse
- Poängformeln räknar rätt
- Lagring, export/import, rekord per ämne

## 10. Verifiering före leverans

1. `node scripts/test_shoot.js` grön
2. `python3 scripts/check_generators.py` exit 0 (kör kontrast, spellägen, meta)
3. **Renderat på 390×844** i headless Chrome: ryms orden i kranierna, tar
   spelytan skärmen, syns laserlinjen, faller målen omkull
4. **Ljud på riktig iPhone.** Kan inte kvitteras med test — DOM-skalet har
   inget ljud och headless Chrome rapporterade `running` medan iPhone var tyst
5. Ljust **och** mörkt läge

## 11. Byggetapper

1. Spelplan + sikte + laserlinje + skott med ballistik (ingen fråga än)
2. Mål med ord, ämnesurval, träff/miss, 6-sekundersklockan
3. Hinder + luckegaranti + svårighetstrappan
4. Poäng, slutvyer (båda), topplista, utmärkelse
5. Ljud, haptik, rekyl, fall, skärmskak, reducerad rörelse
6. `spellagen.html`, testskal, kontroller, visuell verifiering

---

## 12. Beslutade frågor

Alla fem öppna punkter **bekräftade av användaren 2026-08-01**. Inget här är
längre min tolkning — ändras något ska det ändras här först.

| Fråga | Beslut |
|---|---|
| Svårighetstrappan | Antal hinder maxat 1:30, fart maxad 3:00 |
| Poängformeln | `träffar × 10 × träffsäkerhet + 1 p/sekund` |
| Fel kranium | Miss (träffsäkerhet ned) + ny fråga — **inte** slut |
| Bomskott | Miss; frågan står kvar tills 6-sekunderna går ut |
| Mästerskytt | Utmärkelse ⭐ i topplistan, **inte** extra poäng |

**Kvar innan etapp 1:** inget. Planen är komplett och går att bygga på.

Två saker som ändå ska avgöras **genom att spela**, inte genom att gissa i
förväg — startvärdena i planen är kvalificerade utgångspunkter, inte facit:
projektilens fart (~1 000 px/s) och hindrens bas- respektive maxfart. De
sätts när etapp 1 och 3 går att köra på en telefon.
