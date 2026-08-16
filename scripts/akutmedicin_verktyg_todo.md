# Akutmedicin — poängskalor & kalkylatorer (facit)

> **PROAKTIVA REGLER — [`CLAUDE_REGLER.md` §0](../CLAUDE_REGLER.md) gäller över detta dokument.**
> Varje punkt här ska säga hur något byggs **rätt från början**. Hittas en ny feltyp under
> arbetet skrivs den in i regeldokumentet i samma pass, inte i den här filen.

Detta är facit för utbyggnaden av `/verktyg/akutmedicin/`. **Status läses här, inte ur
minnesindexet** — grep den här filen innan något sägs vara klart eller väntande.

Beställd 2026-07-26. Förlagan är `medicinakuten.se`, vars innehåll är etablerad klinisk
allmänkunskap. Instrumenten byggs från **primärkällan**, aldrig från förlagans markup.

---

## 0. Vad förlagan innehåller (verifierad inventering 2026-07-26)

Hela `medicinakuten.se` är **ett enda 591 KB HTML-dokument** — en klientrenderad enfilsapp
där varje "sida" är en `<div class="section">`. Sektionen `id="s-scores"` ("Poäng &
kalkylatorer") ligger på byte 487351–515563, är 28 KB och innehåller **13 poster**.
Ytterligare **8 instrument** ligger utspridda i andra sektioner.

### 0a. Sektionen "Poäng & kalkylatorer" — 13 poster

| # | Verktyg | Mönster | Ingångar | Byggs? |
|---|---|---|---|---|
| 1 | NEWS2 | B | AF, SpO₂ (skala 1/2), syrgas, syst. BT, puls, temp, ACVPU | ✅ |
| 2 | Blodgastolkning | D→C | pH, pCO₂, HCO₃⁻, BE, Na, Cl, laktat | ✅ **byggs om till klassificerare** |
| 3 | Korrigerat natrium | C | s-Na, P-glukos → Katz 1,6 + Hillier 2,4 | ✅ |
| 4 | Effektiv serumosmolalitet | C | Na, K, glukos → 2×(Na+K)+glukos | ✅ |
| 5 | QTc | C | QT, HR *el.* RR, kön → Bazett + Fridericia | ✅ |
| 6 | CHA₂DS₂-VA | A | 7 kryss (ESC 2024, kön borttaget) | ✅ |
| 7 | HAS-BLED | A | 7 kryss | ✅ |
| 8 | Modifierad EHRA | D | Grad I–IV, ingen inmatning | ✅ |
| 9 | GRACE "förenklad" | A | 8 kryss | ❌ **se §0c** |
| 10 | Wells DVT | A | 9 × +1p, 1 × −2p | ✅ |
| 11 | LMH i fulldos | — | Doseringsreferens, preparatnamn | ❌ **se §0c** |
| 12 | sPESI | A | 6 kriterier | ✅ |
| 13 | PERC | A | 8 kriterier | ✅ |

### 0b. Instrument i förlagans övriga sektioner — 8 poster

qSOFA + SOFA (`s-infektion`) · CRB-65 / DS-CRB-65 (`s-dyspne`, `s-infektion`) ·
Alvarado (`s-buk`) · 4AT (`s-konfusion`) · GCS + RLS 85 (`s-abcde`, `s-status`,
`s-neurostatus`) · HINTS (`s-yrsel`) · BE-FAST (`s-neuro`) ·
Glasgow-Blatchford (`s-handlaggning`).

### 0c. Två poster byggs INTE — och varför

**GRACE "förenklad" (post 9) — faktafel att kalla den GRACE.**
Riktiga GRACE 2.0 bygger på kontinuerliga variabler i en regressionsmodell (ålder, puls,
systoliskt BT, kreatinin, Killip-klass, hjärtstillestånd, ST-deviation, biomarkör) och ger
en procentuell mortalitetsrisk. Förlagans åtta kryssrutor är en egen approximation som
aldrig validerats. Att publicera den under namnet GRACE vore att sprida ett instrument som
inte finns. **I stället:** `hjartat.html` förklarar vad GRACE är, vilka variabler som ingår
och varför den inte går att förenkla till kryssrutor — och länkar till en riktig kalkylator.

**LMH i fulldos (post 11) — förskrivningsstöd, inte allmänkunskap.**
Preparatnamn med mg/kg och njursviktsgränser är ordinationshjälp. Det står i direkt konflikt
med sajtens egen sidfot ("ska inte användas som underlag för vård eller behandling av
patienter"). **I stället:** `blodproppar.html` får en hänvisningsruta —

> Ska dosen räknas ut? Vikt × dos per kg görs i läkemedelsberäknarens **Dos och styrka**
> ([`/verktyg/lakemedelsberakning.html`](../verktyg/lakemedelsberakning.html)). Själva
> ordinationen — preparat, dosnivå och justering för njurfunktion — hämtas ur FASS och
> lokalt PM, inte härifrån.

Räknaren täcker aritmetiken (200 E/kg × 80 kg) men bär ingen preparatkunskap. Det är exakt
rätt arbetsdelning: vi lär ut räknemomentet, vi publicerar inte ordinationen.

**Godkänt av användaren 2026-07-26** ("litar i stort på ditt omdöme … gör då en hänvisning
till LMH till läkemedelsberäknaren").

---

## 1. Positionering — lärverktyg, inte sängkantsstöd

Detta är den bärande anpassningen till Anatomiquiz och avgör hela innehållsformen.

| | Förlagan | Anatomiquiz |
|---|---|---|
| Uppdrag | Kliniskt kompendium för personal i tjänst | Utbildningsmaterial |
| Frågan som besvaras | "Vad blir poängen på den här patienten?" | "Vad mäter skalan, varför väger just de variablerna, och vad betyder orden?" |

Varje kalkylator får därför **tre delar**, i den ordningen:

1. **Räknaren** — samma interaktion som läkemedelsberäknaren.
2. **"Vad betyder variablerna?"** — statisk HTML, varje term en `kb-term`-tooltip.
3. **"Varför just de här variablerna?"** — kort fysiologi/anatomi. Varför är
   andningsfrekvens den känsligaste enskilda parametern i NEWS2? Vilka vener menas med
   "djupa venernas förlopp" i Wells?

Del 2 och 3 är också det som gör sidorna till **eget innehåll** i stället för dubblett av
internetmedicin.se och medicinakuten.se. Utan dem rankar de inte.

---

## 2. Struktur och URL:er

Följer mönstret från `verktyg/lakemedelsberakning.html`.

```
/verktyg/akutmedicin/                 hubb (kb-grid + kb-card)
├── vitalparametrar.html              NEWS2
├── hjartat.html                      QTc · CHA₂DS₂-VA · HAS-BLED · EHRA · (GRACE förklarad)
├── blodproppar.html                  Wells DVT · PERC · sPESI · (LMH-hänvisning)
├── syra-bas.html                     Blodgasklassificerare · korrigerat Na · eff. osmolalitet
├── infektion.html                    qSOFA · SOFA · CRB-65 / DS-CRB-65
├── neurologi.html                    GCS · RLS 85 · 4AT · BE-FAST · HINTS
└── buken.html                        Alvarado · Glasgow-Blatchford

/kunskapsbank/kliniska-poangskalor.html   faktatexten (navet)
```

Faktatexten förklarar vad en poängskala **är**: sensitivitet vs specificitet, varför en
cut-off aldrig är ett beslut, och varför "rule-out"-instrument (PERC, Wells) fungerar
annorlunda än riskskalor (CHA₂DS₂-VA). Alla verktygssidor länkar dit — samma nav-roll som
`kunskapsbank/lakemedelsberakning.html` har för räknarna.

**Namn (§12.1):** synligt **Akutmedicin**, slug **`akutmedicin`**. Fritt ord, inget
varumärke. Skalornas egennamn (NEWS2, Wells, HAS-BLED) är etablerad facknomenklatur och
omfattas inte — regeln gäller namn på *våra* funktioner.

---

## 3. Teknisk arkitektur

### 3a. Fyra mönster täcker alla 19 instrument

| Mönster | Mekanik | Instrument | Renderare |
|---|---|---|---|
| **A. Kryssruteskala** | Summa av kryss → band | CHA₂DS₂-VA, HAS-BLED, Wells, sPESI, PERC, 4AT, Alvarado, Glasgow-Blatchford | ✅ `kryss` (0.9.415) |
| **B. Värdeskala** | Numeriskt värde → intervall → poäng | NEWS2, GCS, RLS 85, qSOFA, SOFA, CRB-65 | ✅ `varde` (0.9.287) |
| **C. Formelräknare** | Aritmetik → tröskel | QTc, korrigerat Na, effektiv osmolalitet | ✅ `formel` (0.9.305) |
| **D. Beslutsgång** | Ett eller flera steg → utfall | EHRA, BE-FAST, HINTS | ✅ `gang` (0.9.415) |

Blodgasklassificeraren fick ett eget mönster (`blodgas`) i stället för att tvingas in i C —
se §7e. **Alla fyra mönstren är byggda sedan 0.9.415.** En ny skala är därmed en JSON-post,
inte ny kod; det gäller nu på riktigt och inte bara som avsikt.

**Mönster A, det som skiljer det från B:** en urkryssad ruta betyder att kriteriet saknas,
inte att svaret uteblivit, så bedömningen är alltid komplett och resultatet visas från början
(Wells 0 poäng ÄR ett svar). Vikter kan dessutom vara negativa — Wells drar av 2 poäng — så
uträkningen skrivs med tecken. `grupp` gör två kriterier ömsesidigt uteslutande, vilket
CHA₂DS₂-VA:s två åldersrader kräver; utan det kan skalan summeras till 3 åldersspoäng, en
nivå som inte finns i instrumentet.

**Mönster D, regeln som håller för alla tre instrumenten:** utfallet är det **högst rankade**
bland de valda alternativen, aldrig en summa. Modifierad EHRA graderar efter det svåraste som
stämmer, och BE-FAST och HINTS bygger båda på att ETT centralt fynd flyttar hela bedömningen.
Ingen Träna-flik, av samma skäl som blodgasklassificeraren saknar en: det finns ingen
uträkning att kontrollera sitt svar mot.

**Blodgastolkningen byggs om.** Förlagan har en statisk stegtabell. Vi bygger en riktig
klassificerare: in med pH, pCO₂, HCO₃⁻ och BE, ut med "metabol acidos med adekvat
respiratorisk kompensation" **plus resonemanget steg för steg**. Det är sidans starkaste
pedagogiska verktyg och det tydligaste stället där vi gör det bättre än förlagan.

### 3b. Rendering — statisk prosa + monteringspunkter

Kalkylatorerna renderas i webbläsaren, som läkemedelsberäknaren (`<div id="verktyg"></div>`).
Ingen generator, alltså ingen rundtrippsrisk (§12.2).

**Men:** JS-genererade etiketter kan `wire_terms.py` aldrig nå. All termbärande text ligger
därför i **statisk HTML**, och modulen fyller bara monteringspunkter:

```html
<div data-akut="news2"></div>
```

Så hamnar SEO-texten och alla tooltips i HTML där de hör hemma, och rundtrippstestet
skyddar dem.

### 3c. Filer

| Fil | Åtgärd | Kommentar |
|---|---|---|
| `data/akutmedicin.json` | Ny | Alla skalor: variabler, poäng, band, källa |
| `js/akutmedicin.js` | Ny | §12: egen modul. Mall: `js/verktyg-lakemedel.js` |
| `css/verktyg.css` | Utökas | Återanvänder `.vt-field`, `.vt-inputrow`, `.vt-out`, `.vt-warn`. Nytt: `.vt-krit`, `.vt-band` |
| `scripts/test_verktyg_akutmedicin.js` | Ny | DOM-skal i node. Mall: `test_verktyg_lakemedel.js` |
| 8 HTML-sidor | Nya | Hubb + 7 verktygssidor |
| `kunskapsbank/kliniska-poangskalor.html` | Ny | Faktatexten |

**`verktyg.css` utökas framför ny fil:** komponenterna finns redan och det visuella språket
ska vara *identiskt* med läkemedelsberäknaren, inte "nästan lika".

### 3d. Skyddet levereras i samma pass (§ship-the-guardrail)

Varje skala får **referensfall med känt facit**, hämtade ur originalpublikationerna — inte
uträknade av mig. NEWS2 med RCP:s egna exempel, Wells med originalartikelns fall, och så
vidare. **Ett bygge utan gröna referensfall levereras inte.**
`scripts/test_verktyg_akutmedicin.js` kopplas in i `check_generators.py`.

---

## 4. Ordlistan — den stående regeln

**Allt som dyker upp under bygget och saknas i ordlistan skrivs in.** Labbvärden,
biokemiska begrepp, förkortningar, tekniska termer. Stående krav från användaren
2026-07-26; kodifierat i `CLAUDE_REGLER.md` §0.6.

Mätning 2026-07-26: av 68 sonderade kliniska termer fanns **55 redan** i
`data/ordlista.json` (11 179 poster). Träffbilden bekräftar guldgruvan — sidorna handlar om
precis de ord ordlistan förklarar.

Uppskattat utfall när alla sju sidor är byggda: **150–250 nya interna länkar** in i
ordlistan.

### 4a. Blockeraren (löst i släpp 1)

`wire_terms.py --all` täckte `kunskapsbank/`, `kunskapsbank/artiklar/` och `case.html` —
**men inte `/verktyg/`.** Därför hade `verktyg/lakemedelsberakning.html` exakt *en*
`kb-term` (handskriven i en `sr-only`-rubrik) och `verktyg-lakemedel.js` noll.
Verktygssektionen stod utanför ordlistelänkningen.

---

## 5. Källor

Byggs mot primärkällan, aldrig mot förlagans markup:

RCP (NEWS2, 2017) · ESC (2024, CHA₂DS₂-VA) · Pisters et al. (2010, HAS-BLED) ·
Wells et al. (2003) · Kline et al. (2008, PERC) · Jiménez et al. (2010, sPESI) ·
Katz (1973) · Hillier et al. (1999) · Bazett (1920) · Fridericia (1920) ·
Teasdale & Jennett (1974, GCS) · Starmark et al. (1988, RLS 85) ·
Bellelli et al. (2014, 4AT) · Alvarado (1986) · Blatchford et al. (2000) ·
Singer et al. (2016, SOFA/qSOFA) · Strama/Läkemedelsverket (CRB-65) ·
Wynn et al. (2014, EHRA).

Synlig APA 7-lista längst ner på varje sida + `citation` i JSON-LD via `wire_citations.py`.
Källorna in i `info.html` i **samma arbetspass**.

**Verifieras mot källa innan de skrivs:** DS-CRB-65:s exakta itemdefinitioner (svensk
variant, 0–6) och SOFA:s labbgränser.

---

## 6. Kedjan per ny sida (SEO_REGLER §11 A + B)

Nya sidor **stoppar bygget** om de inte registreras — det är §0.4 och det är meningen.

- [ ] `scripts/amne.py` — `about` / `teaches` / `keywords`
- [ ] `scripts/relaterat.py` — kärngrupp eller `UTAN_RELATERAT` med skäl (kunskapsbankssidan)
- [ ] `data/llms.json` — post med `kort` + `lang`, sedan `generate_llms.py`
- [ ] `sitemap.xml` — `<loc>` + `<lastmod>`
- [ ] Fullständig `<head>` enligt §1 + `BreadcrumbList`
- [ ] `wire_lang.py` · `wire_sidfot.py` · `wire_citations.py` · `wire_terms.py`
- [ ] `sidodatum.py --update && wire_dates.py --all`
- [ ] Korslänkning: `/verktyg/`-hubben + startsidans `hub-tile--tools` + kunskapsbanken
- [ ] `check_meta.py` — title ≤65, description 127–150
- [ ] `check_kontrast.py` — **riskabelt här**: resultatbanden är färgade ytor med text.
      Återanvänd kontrastplattorna `--plate-*` från 0.9.280
- [ ] `bump_version.py` — aldrig för hand

---

## 7. Releaseordning och status

> ▶️ **ÅTERUPPTAGET 2026-07-31 på användarens begäran.** Släpp 3 är byggt och levererat
> (0.9.305) utan att formen från släpp 2 stämdes av separat innan — användaren bad om
> fortsättning direkt. Släpp 4–6 väntar fortsatt på sin tur, i ordning nedan.

| Släpp | Innehåll | Status |
|---|---|---|
| **1** | `wire_terms.py` utökas till `/verktyg/` + ordlistetermerna + §0.6 i reglerna | ✅ **klart 0.9.286** |
| **2** | Motor (`akutmedicin.json` + `.js` + CSS) + hubb + `vitalparametrar.html` (NEWS2) + testskal | ✅ **klart 0.9.287** |
| **3** | `syra-bas.html` — blodgasklassificeraren, korrigerat natrium, effektiv osmolalitet | ✅ **klart 0.9.305** |
| **3,5** | Motorn färdig: mönster A och D + facit för Wells DVT, CHA₂DS₂-VA och EHRA | ✅ **klart 0.9.415** |
| **4a** | `blodproppar.html` — Wells DVT, PERC, sPESI + LMH-hänvisningen | ✅ **klart 0.9.416** |
| **4b** | `hjartat.html` — QTc, CHA₂DS₂-VA, HAS-BLED, EHRA + GRACE förklarad | väntar — QTc behöver Bazett/Fridericia i `FORMLER`, HAS-BLED en facitpost |
| **5** | `infektion.html` + `neurologi.html` + `buken.html` | väntar |
| **6** | `kunskapsbank/kliniska-poangskalor.html` + korslänkning + `info.html`-källor | väntar |

### Släpp 1 — LEVERERAT 0.9.286

- [x] `wire_terms.py`: `alla_sidor()` utökad med `verktyg/**/*.html` (rekursivt)
- [x] 17 nya ordlisteposter (se §7a) — `ordlista.json` 11 179 → 11 196
- [x] `data/kb_glossary_terms.json` 2 263 → 2 328 med kliniska termer
- [x] `poliklinik` fick `även poliklinisk (adj.)` — ingen egen post (husregeln)
- [x] 3 felpekande tooltips rättade (se §7b)
- [x] `CLAUDE_REGLER.md` §0.6 — ordlistekravet
- [x] `ORDLISTA.md` rättad på tre punkter (husformat, `Eng. `, sortering)
- [x] `check_generators.py` grönt — rundtripp identisk över 384 filer

#### 7a. Ordlisteposter i släpp 1

Mätt mot `data/ordlista.json` 2026-07-26. **Redan täckt, ingen åtgärd:**
`antikoagulantia` (finns som `antikoagulantium`, pl. antikoagulantia).

Nya poster: `andningsfrekvens` · `anjongap` · `basöverskott` · `bikarbonat` · `blodtryck` ·
`buffert` · `chock` · `hemodynamik` · `kontraindikation` · `laktacidos` · `medvetandegrad` ·
`njure` · `puls` · `syresaturation` · `syrgas` · `tonicitet` · `vitalparameter`.

`saturation` och `syremättnad` integrerades i `syresaturation` med "även …" (husregeln:
varianter ges ingen egen post). `poliklinisk` integrerades i `poliklinik`.

**Sammansättningar räcker inte som täckning.** `blodtryck` och `puls` saknades helt som
*begrepp* — bara instrumenten (`Blodtrycksmätare`, `Blodtrycksmanschett`, `Pulsoximeter`)
fanns. `chock` fanns bara som *anafylaktisk/hypovolemisk/kardiogen chock* och `njure` bara
som *njursvikt*, *njursten*, *njurcancer*. Sök på ordstammen, inte på ordet.

#### 7b. Tre felpekande tooltips, hittade i samma pass

| Nyckel | Pekade på | Pekar nu på | Varför det var fel |
|---|---|---|---|
| `puls`, `pulsen` | `#term-hjartfrekvens` "Antalet hjärtslag per minut" | `#term-puls` | På de två sidor som bar länken palperas **tryckvågen** bakom malleolen och i handleden, inte en frekvens |
| `njuren` | `#term-ren` (latin) | `#term-njure` | Svensk löptext ska peka på den svenska posten |
| `elektrolyt` / `elektrolyter` | samma ankare, **två olika** tooltips | gemensam text | Ett ankare får inte visa två definitioner |

**Böjda alias ärver ingenting av grundformen.** Varje nyckel i facit bär sin egen `href` och
`def`, så en omdirigering måste skrivas på **alla** former — det räckte inte att ändra `puls`.
Sök alltid efter böjda alias efter en facitändring:
`wire_terms.py --check --sync-defs --all` listar varje avvikande href.

**Metodfel att inte upprepa:** `puls`-länken rättades först genom handredigering av
`kunskapsbank/karl-armen.html`. Den filen ägs av `generate_karl.py` och ändringen ströks vid
nästa körning — rundtrippstestet fångade den. Rätt väg är alltid facit; genererad HTML
redigeras aldrig för hand. **Löst i verktyget 0.9.287:** `wire_terms.py --repoint <nyckel …>
--all` skriver om både `href` och `def` för namngivna facitnycklar på varje sida. Handpåläggning
är därmed inte längre ett alternativ som går att välja av misstag.

### Släpp 2 — LEVERERAT 0.9.287

- [x] `data/akutmedicin.json` — NEWS2 som facit: sju parametrar, intervall, poäng, svarstabell
- [x] `js/akutmedicin.js` — motor + renderaren för **mönster B (värdeskala)**
- [x] `css/verktyg.css` — `.vt-poang`, `.vt-band`, `.vt-krit`, `.vt-hjalp`, `.vt-field--val`
- [x] `verktyg/akutmedicin/index.html` (hubb) + `vitalparametrar.html` (NEWS2)
- [x] `scripts/test_verktyg_akutmedicin.js` — 133 tester, larmet verifierat med planterade fel
- [x] `scripts/check_akutmedicin.py` — inkopplad i `check_generators.py`
- [x] 3 nya ordlisteposter (`hals`, `koldioxid`, `kroppstemperatur`), facit 2 328 → 2 347
- [x] 39 felpekande `hals`-länkar rättade på 9 sidor (se §7c)

#### 7c. `hals` pekade fel på nio sidor — hittat under bygget

`hals`, `halsen` och `halsens` pekade på `#term-cervix` med defen *"Smal, halsformad del av ett
organ, t.ex. livmoderhalsen"*. På **samtliga** 39 förekomster på sajten avser ordet kroppsdelen
mellan huvudet och bålen — halsens muskler, halsens kärl, nerverna på halsen. Ordlistan saknade
helt en post för halsen som kroppsdel; bara `collum` och `cervix` fanns, och båda beskriver den
smala delen av ett organ. Rätt åtgärd var därför den generiska post som täcker båda lägena
(SEO_REGLER §6c), inte att blockera ordet.

**Samma feltyp som `puls` och `njuren` i släpp 1:** en svensk nyckel vars href pekar på en post
med ett organnamn i sin definition. Testet är riktningen, inte förekomsten — *hade defen
fortfarande stämt om ordet stod i en text om en annan kroppsdel?*

#### 7d. Två fel i verktygen, båda lagade i samma pass

**`--sync-defs` kunde inte peka om en länk.** Den synkar `data-def` men lämnar `href` orörd —
avsiktligt, eftersom en avvikande href ibland är rätt (`njuren` pekar med flit på det latinska
`ren` på språksidorna). Följden var att en ändrad href bara gick att applicera för hand, vilket
är precis det §0.3 förbjuder. Nu finns **`--repoint <nyckel …> --all`**, som skriver om både
`href` och `def` för uttryckligen namngivna nycklar och rör ingenting annat. De sex avsiktliga
`njuren`-länkarna står kvar orörda.

**`wire_terms.py` kastade bort sin egen returkod.** `if __name__ == "__main__": main(...)` utan
`sys.exit()` gjorde att varje `STOPP` i skriptet gav exitkod 0 — larmet kunde alltså aldrig
fällas, inte heller från `check_generators.py`. Rättat till `sys.exit(main(...) or 0)` och
verifierat genom att anropa `--repoint` med en nyckel som inte finns i facit.

### Släpp 3 — LEVERERAT 0.9.305

- [x] **Mönster C (formelräknare)** i `js/akutmedicin.js` — datadriven som mönster B: en
      formel blir en JSON-post (`falt` + `utdata`) plus en rad i `FORMLER`, inte en ny renderare
      per instrument. Byggd generiskt för att bära flera samtidiga utdata (Katz *och* Hillier ur
      samma två fält).
- [x] `natrium_korrigerat` — Katz (1973, faktor 1,6) och Hillier, Abbott & Barrett (1999, faktor
      2,4), båda ur samma natrium/P-glukos. Referenspunkten 100 mg/dL konverterad exakt till
      5,55 mmol/L, inte den ofta avrundade 5,5 (se `js/akutmedicin.js` för uträkningen).
- [x] `osmolalitet` — 2 × (Na + K) + glukos enligt Joint British Diabetes Societies (Mustafa,
      Haq, Dashora, Castro & Dhatariya, 2023), med 320 mosmol/kg som HHS-tröskel.
- [x] **Blodgasklassificeraren, ett eget mönster (`blodgas`)** — bespoke beslutslogik
      (`bedomBlodgas` i `js/akutmedicin.js`), inte tvingad in i mönster B/C. Algoritmen är
      Berend, de Vries & Gans (2014) Table 1/Figure 1: pH avgör acidemi/alkalemi, HCO₃⁻ och pCO₂
      var för sig avgör primär metabol/respiratorisk komponent, Winters formel (metabolt
      primär) eller akut/kroniskt förväntat bikarbonat (respiratoriskt primär) avgör om
      kompensationen är adekvat, och anjongapet (Na, Cl, valfritt laktat) räknas ut när det
      finns en verklig metabol acidos — inte bara ett kompensatoriskt lågt bikarbonat vid en
      annan primär rubbning (se felet nedan). Alla mmHg-koefficienter konverterade till kPa
      (× 0,1333) för svensk klinisk praxis. Ingen Träna-flik: ett flerstyckesresonemang har
      inget enskilt svar att kontrollera mot.
- [x] `verktyg/akutmedicin/syra-bas.html` — tre instrument i tredelad form (räknare, vad
      betyder variablerna, varför just de), källor för alla fyra primärkällor.
- [x] 4 nya ordlisteposter (`acidemi`, `alkalemi`, `blodgas`, `renal tubulär acidos`), facit
      2 347 → 2 351. `wire_terms.py --all` gav 107 nya kb-term-länkar på den nya sidan.
- [x] `scripts/test_verktyg_akutmedicin.js` utökad 133 → 195 tester, alla tre nya instrumenten
      handräknade mot facit (se §7e).
- [x] `scripts/check_akutmedicin.py` utökad: `syra-bas.html` kontrolleras mot facit genom att
      varje referensvärde, bandgräns och formelkoefficient ska *nämnas* på sidan — svagare än
      NEWS2:s cell-för-cell-spegling (instrumenten har ingen uppslagstabell att spegla mot),
      men fångar samma feltyp. Larmet verifierat med planterade fel i både JSON och HTML.
- [x] Hubbkortet "Syra och bas" på `verktyg/akutmedicin/index.html` bytt från "Snart" till
      live-länk, `hasPart` och actions-raden uppdaterade.

#### 7e. Ett verkligt logikfel, hittat under testningen

**Anjongapet triggade på fel villkor.** Första versionen räknade ut anjongapet så snart
bikarbonatet låg under 22 mmol/L (`metabol === 'acidos'`) — men ett lågt bikarbonat uppstår
även som en fullt förväntad *kompensation* vid en primärt respiratorisk alkalos (njurarna
utsöndrar bikarbonat för att sänka pH tillbaka). Ett testfall med kronisk respiratorisk
alkalos (pH 7,50, pCO₂ 3,5 kPa, HCO₃⁻ 20 mmol/L) avslöjade att anjongapet då räknades ut trots
att grundproblemet inte var en metabol acidos alls. Rättat till att bara trigga när
algoritmen faktiskt *landat* i `metabol_acidos` eller `blandad_acidos` som primär rubbning —
inte varje gång bikarbonatet råkar vara lågt. Samma sorts fel som `hals` i släpp 2: rätt
riktning på jämförelsen, fel villkor för när den ska prövas.

### Släpp 3,5 — LEVERERAT 0.9.415 (motorn färdigbyggd)

- [x] **Mönster A (`kryss`)** i `js/akutmedicin.js` — kryssruteskala med vikt per kriterium,
      summa mot `bandFor()` (delas rakt av med mönster B), tecken i uträkningen för negativa
      vikter och `grupp` för ömsesidigt uteslutande kriterier. Träna-läget döljer vikterna,
      vilket är hela poängen: det man ska lära sig är just vad varje kriterium väger.
- [x] **Mönster D (`gang`)** i `js/akutmedicin.js` — beslutsgång där utfallet är det högst
      rankade valda alternativet. Skriven för flera steg, med ett instrument som använder ett;
      BE-FAST och HINTS blir JSON-poster i släpp 5 utan ny kod.
- [x] `byggValfalt` fick samma `utanPoang`-flagga som `byggTalfalt` redan hade, så
      beslutsgångens steg slipper en poängchip som ändå står tom.
- [x] **Wells DVT** i facit — tio kriterier ur Wells et al. (2003), nio à +1 p och avdraget
      på −2 p, med 2003 års dikotomi (≥2 = DVT sannolik) som band.
- [x] **CHA₂DS₂-VA** i facit — sju kriterier ur ESC (2024), utan könskriteriet. De två
      åldersraderna ligger i `grupp: "alder"`.
- [x] **Modifierad EHRA** i facit — fem klasser ur Wynn et al. (2014). 2b och 3 ligger på
      samma allvarlighetsnivå, vilket är vad 2014 års modifiering visade.
- [x] `css/verktyg.css` — `.vt-kravlista`, `.vt-krav`, `.vt-krav-text`, `.vt-poang.is-aktiv`,
      `.vt-band.is-tom`. Under 480 px flyttar vikten ner under etiketten i stället för att
      klämma ihop den till en spalt på några ord.
- [x] `scripts/test_verktyg_akutmedicin.js` utökad 195 → 279 tester. Varje vikt prövas mot
      instrumentets egen tabell och varje bandgräns åt båda håll, samma metod som för NEWS2.
- [x] Larmen verifierade med fyra planterade fel: fel vikt på Wells avdrag, borttagen
      `grupp` på åldersraden, EHRA 2b som pekar på fel utfall, och ett `monster` utan
      renderare.

#### 7f. Kontrollen visste inte om att facit kunde växa

`check_akutmedicin.py` var handskriven per sida: den läste `news2` mot `vitalparametrar.html`
och de tre syra-bas-instrumenten mot `syra-bas.html`. Nya poster i facit gick den helt förbi,
alltså exakt den tystnad §0.4 finns för att förhindra — tre nya skalor hade kunnat läggas in
utan att en enda kontroll märkte det.

**Åtgärdat i samma pass:** `SPEGLAD_AV` och `UTAN_SIDA` täcker nu varje post i facit, och
`kontrollera_tackning()` stoppar bygget i tre lägen — en skala som inte står i någotdera
uppslag, ett uppslag som pekar på en skala som inte längre finns, och ett undantag i
`UTAN_SIDA` vars sida faktiskt har byggts (då ska posten flyttas till `SPEGLAD_AV`, inte ligga
kvar och tysta kontrollen för en sida som finns). Alla tre grenarna är verifierade genom att
felet planterats, den sista genom att anropa funktionen direkt eftersom nodtestet hann fälla
körningen först.

### Släpp 4a — LEVERERAT 0.9.416 (`blodproppar.html`)

- [x] `verktyg/akutmedicin/blodproppar.html` — Wells DVT, PERC och sPESI i tredelad form
      (räknare, vad betyder variablerna, varför just de här), plus LMH-hänvisningen enligt §0c.
- [x] **PERC och sPESI i facit** — Kline et al. (2008) respektive Jiménez et al. (2010). Båda
      är kryssruteskalor med band vid `max: 0`, alltså rule-out-logik: det är skillnaden mellan
      noll och minst ett kriterium som betyder något, inte hur högt summan blir.
- [x] Registrerad hela vägen: `amne.py`, `data/llms.json`, sitemap via `generate_glossary.py`,
      hubbkortet bytt från "Snart" till live-länk, `hasPart` och actions-raden uppdaterade.
- [x] **3 nya ordlisteposter** (`pittingödem`, `venklaff`, `hjärtminutvolym`) och **29 nya
      poster i wiring-facit** — 54 kb-term-länkar lades på den nya sidan.
- [x] Källorna (Wells 2003, Kline 2008, Jiménez 2010) inskrivna i `info.html` i samma pass (§3.2d).
- [x] `check_akutmedicin.py` speglar nu kryssruteskalorna **cell för cell** mot sidans tabeller,
      i båda riktningar, plus bandens rubriker. Larmet verifierat med fem planterade fel.

#### 7g. Tre fel i mitt eget arbetssätt, alla fångade av befintliga skydd

**Sitemap.xml handredigerades.** Filen ägs av `generate_glossary.py` och min rad ströks vid
nästa körning. Rätt väg var att lägga URL:en i generatorn — samma metodfel som `puls`-länken i
släpp 1, och samma lärdom: genererad utdata redigeras aldrig för hand.

**`generate_glossary.py` kördes ensam mitt i arbetet.** Det nollställer identitet, ämne, sidfot
och datum på ordlistans sidor, så rundtrippstestet larmade om 37 filer. Facit varnar för precis
det (§ "Kör alltid HELA kedjan"), och kedjan i `check_generators.py:KEDJA` fick köras i sin
ordning för att få tillbaka en ren diff.

**Den nya speglingskontrollen larmade falskt på sig själv.** `wire_terms.py` lägger tooltips
*mitt i* en bandrubrik (`<a …>DVT</a> osannolik`), och tagg-strippningen byter varje tagg mot
ett mellanslag — kontrollen letade efter `DVT osannolik` i en text som lydde `DVT  osannolik`.
Felet satt i verktyget, inte i sidan, och hittades genom att läsa ut strängarna i stället för
att lita på antalet avvikelser. Åtgärdat med `blanksteg()` i `check_akutmedicin.py`.
