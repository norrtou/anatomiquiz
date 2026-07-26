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

| Mönster | Mekanik | Instrument |
|---|---|---|
| **A. Kryssruteskala** | Summa av kryss → band | CHA₂DS₂-VA, HAS-BLED, Wells, sPESI, PERC, 4AT, Alvarado, Glasgow-Blatchford |
| **B. Värdeskala** | Numeriskt värde → intervall → poäng | NEWS2, GCS, RLS 85, qSOFA, SOFA, CRB-65 |
| **C. Formelräknare** | Aritmetik → tröskel | QTc, korrigerat Na, effektiv osmolalitet, blodgas |
| **D. Beslutsgång** | Strukturerad tabell/steg | EHRA, BE-FAST, HINTS |

Därför: **`data/akutmedicin.json` + `js/akutmedicin.js` med fyra renderare.** En ny skala
blir en JSON-post, inte ny kod.

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

> ⏸️ **PAUSAT 2026-07-27 — vila på användarens begäran.** Krediterna räcker bara till
> småpyssel i flera dagar framåt, och släpp 3–6 är alla stora byggen. **Ingen av
> punkterna nedan startas** förrän användaren själv säger till att vi fortsätter.
> Fråga inte, föreslå inte, plocka inte "en liten bit" av släpp 3 i förbifarten.
> Släpp 1 och 2 är levererade och live — inget står halvfärdigt, ingenting behöver
> städas innan pausen. Vid återstart: läs §7 nedifrån och upp, stäm av formen från
> släpp 2 med användaren, bygg sedan släpp 3.

| Släpp | Innehåll | Status |
|---|---|---|
| **1** | `wire_terms.py` utökas till `/verktyg/` + ordlistetermerna + §0.6 i reglerna | ✅ **klart 0.9.286** |
| **2** | Motor (`akutmedicin.json` + `.js` + CSS) + hubb + `vitalparametrar.html` (NEWS2) + testskal | ✅ **klart 0.9.287** |
| **3** | `syra-bas.html` — blodgasklassificeraren | ⏸️ pausat 2026-07-27 |
| **4** | `blodproppar.html` + `hjartat.html` | ⏸️ pausat 2026-07-27 |
| **5** | `infektion.html` + `neurologi.html` + `buken.html` | ⏸️ pausat 2026-07-27 |
| **6** | `kunskapsbank/kliniska-poangskalor.html` + korslänkning + `info.html`-källor | ⏸️ pausat 2026-07-27 |

**Släpp 2 är referensimplementationen** — formen stäms av med användaren innan resten rullas
ut. Bygg inte vidare på en form som inte godkänts.

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
