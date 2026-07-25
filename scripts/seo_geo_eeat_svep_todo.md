# SEO, agentisk inläsning (GEO), EEAT och tillgänglighet – åtgärdslista

**Status:** analys gjord 2026-07-25 över samtliga sidor. **Punkt 1, 2, 3 och 10 utförda i 0.9.259.**
Resten är öppen och prioriterad nedan.
**Skapad:** 2026-07-25. **Underlag:** hela sajten lästes maskinellt – titlar, descriptions,
canonicals, JSON-LD, rubrikhierarki, tabellmärkning, intern länkning, `llms.txt`, `sitemap.xml`,
`robots.txt` och CSS-kontraster. Siffrorna nedan är mätta, inte uppskattade.

Filen finns för att analysen inte ska gå förlorad mellan arbetspass. **Bocka av i den här filen
när något görs**, och skriv in vad mätningen visade efteråt – inte bara att det är gjort.

---

## Utgångsläget: vad som redan är starkt

Mätt över 118 sidor (119 efter att `404.html` tillkom i 0.9.259):

| Kontroll | Resultat |
|---|---|
| Titlar / canonical / description | 118/118, **noll** dubbletter, alla descriptions 110–165 tecken |
| `<h1>` per sida | Exakt en, på alla sidor |
| Tabeller | 186 st — **186 med `<caption>`, 186 med `scope=`, 186 med `<th>`** (100 %) |
| BreadcrumbList | 114/118 |
| FAQPage | 19 sidor |
| Rubrikhopp | 1 sida (`integritet.html`, h1→h3) |
| Bilder utan alt | 0 |
| Ordlistan | Förrenderad statiskt i `<dl>/<dt>/<dd>` — crawlbar utan JS |
| Startsidan | 1 880 ord statisk text trots JS-driven app |

Det är ovanligt bra hygien. **Åtgärderna nedan handlar därför inte om att laga trasiga saker,
utan om att exponera arbete som redan är gjort** – framför allt referenserna och ordlistan.

---

## ✅ UTFÖRDA i 0.9.259

### 1. ✅ KLAR – två trasiga URL:er i `llms.txt`

Verktygshubben och läkemedelsberäknaren pekade på `/kunskapsbank/verktyg/…`; sidorna ligger
på `/verktyg/…`. Sitemap och canonical hade rätt hela tiden. Bet extra hårt eftersom `llms.txt`
är den fil agenter läser först. **Samtliga 88 URL:er i filen är nu validerade mot disk.**

### 2. ✅ KLAR – `404.html` saknades

GitHub Pages serverade sin generiska felsida utan väg tillbaka. Ny sida med länkar vidare.
Alla sökvägar absoluta (Pages serverar filen även för djupa adresser). Inte i sitemap,
ingen canonical, ingen `robots`-meta – HTTP-status 404 är signalen som gäller.

### 3. ✅ KLAR – arkivfiler låg publikt

`data/_ARCHIVED_questions.json` (223 KB) + `_ARCHIVED_questions_positions_only.json` (30 KB)
borttagna. Refererades bara av `validate_quiz.py`, som redan hoppar över `_ARCHIVED`-prefixet.

### 10. ✅ KLAR – kontrastmiss i ljust läge

`--text-secondary` `#6b7280` → `#5f6672`. Gav 4,83:1 mot vita kort men bara **4,40:1** mot
mintbakgrunden där `.tagline` sitter (AA-gränsen är 4,5). Nu 5,78 / 5,27:1.

---

## ⚠️ BLOCKERANDE UPPTÄCKT – läs innan något genereras om

**Generatorerna har glidit isär från den levererade HTML:en.** Verifierat 2026-07-25 genom att
köra hela pipelinen `generate_* → wire_terms.py --all` och diffa mot HEAD. Rundtrippen ger
**inte** identitet, utan tre klasser av regression:

1. **Felaktig tooltip läggs till.** I `minnesregler-kranialnerverna.html` länkas *"ursprunget"*
   (om en ramsas ursprung) till `origo` med definitionen "Muskelns proximala fästpunkt".
   Klassisk homonymfälla – hör hemma i `BLOCKERADE` i `wire_terms.py`.
2. **Befintliga tooltips försvinner.** Samtliga `region`-länkar i `karl.html` och `leder.html`
   tas bort.
3. **Binomiala latinnamn splittras.** `Centrum tendineum perinei` blir två spans
   (`Centrum tendineum` + `perinei`). Det bryter direkt mot regeln att ett binomialt latinnamn
   är EN term / EN span.

**Konsekvens:** den levererade HTML:en innehåller handkurerad wiring som en regenerering
förstör. Kör **inte** generatorerna förrän driften är utredd. I 0.9.259 patchades därför
sidhuvudena i både generatorerna *och* den levererade HTML:en var för sig.

**Att göra:** utred om facit (`data/kb_glossary_terms.json` + `BLOCKERADE`) ska rättas så att
pipelinen åter blir idempotent, eller om de kurerade avvikelserna ska dokumenteras som
undantag. Tills dess är regenerering en manuell operation som kräver diffgranskning.

---

## Prioriterad åtgärdslista

| # | Åtgärd | Insats | Effekt |
|---|---|---|---|
| 4 | Person-`author` + `@id` på alla artiklar | ~1 h, generator | **Hög (EEAT)** |
| 5 | Synligt `<time datetime>` + `dateModified` överallt | ~2 h | **Hög (EEAT + färskhet)** |
| 6 | `citation` från befintliga referenslistor | ~2 h | **Hög (EEAT)** |
| 7 | `DefinedTerm`-microdata i ordlistan | ~2 h, i generatorn | **Högst (GEO)** |
| 8 | Ansvarsfriskrivning som delad komponent | ~1 h | Hög (YMYL) |
| 9 | `lang="la"` på latinska termer | ~3 h | Hög (WCAG AA) |
| 11 | Syskonlänkar / "Relaterat"-block | ~3 h | Medel |
| 12 | Dela `llms.txt` / `llms-full.txt` | ~30 min | Medel |
| 13 | `.glossary-letter`-kontrast i ljust läge | ~15 min | Medel (WCAG) |
| 14 | `about`/`teaches`/`keywords` i schema | ~2 h | Medel (GEO) |
| 15 | `integritet.html` rubrikhopp h1→h3 | 5 min | Låg |

---

## 4. ⬜ Person-`author` + `@id` på artiklarna

**Mätt:** artiklarnas `author` är `{"@type": "Organization", "name": "Norrtou Creations"}`.
Samtidigt bär `index.html` den fullständiga Person-noden med `sameAs` till norrtou.se,
LinkedIn och GitHub.

Den starkaste E-E-A-T-signalen – namngiven person med verifierbar närvaro, arbetsterapeutstudent
vid Lunds universitet, tidigare medicinsk sekreterare – sitter alltså på startsidan men saknas
på de YMYL-sidor där den väger tyngst.

**Dessutom: noll `@id`-referenser i hela sajten.** Person- och Organization-noderna upprepas
inline utan att knytas ihop. Ett `@id` som `https://anatomiquiz.se/#daniel-medin`, refererat
från alla sidor, bygger *en* entitet i stället för 118 löskopplade kopior.

Görs i `scripts/generate_artiklar.py` m.fl. – **inte** i genererad HTML. Se den blockerande
upptäckten ovan om regenerering.

## 5. ⬜ Synligt datum + `dateModified` överallt

**Mätt:** "Senast uppdaterad" finns på **5 av 118** sidor. `<time datetime>` på **1** sida.
Av 81 `Article`/`LearningResource`-noder saknar **65** `dateModified` och **66** `datePublished`.

Artiklarna *har* datum i JSON-LD men visar inget på sidan. Googles riktlinje är att det synliga
datumet ska matcha den strukturerade datan. Svarsmotorer väger färskhet tungt.

Kräver en källa till sanning för "senast ändrad" per sida – rimligen `data/artiklar.json`
respektive generatorernas register, inte filsystemets mtime (som ändras av cachebuster-bumpar).

## 6. ⬜ `citation` från de referenslistor som redan finns

**Mätt:** **80 sidor** har en synlig "Referenser"-rubrik. **Noll** av 81 Article-noder har
egenskapen `citation`.

Arbetet är alltså redan gjort och kvalitetssäkrat – det är bara inte maskinläsbart. Det här är
den mest direkta auktoritetssignal som finns för en svarsmotor, och den billigaste att lägga
till eftersom källorna redan är strukturerade i sidorna.

Gör det till en del av artikelgeneratorn så att en ny artikel får `citation` automatiskt ur
sin referenslista – annars driver de isär igen.

## 7. ⬜ `DefinedTerm`-microdata i ordlistan ← största GEO-vinsten

**Mätt:** 4 701 termer ligger i perfekt `<dl><dt><dd>`-struktur över 32 sidor, men sidorna är
bara märkta `CollectionPage`. Ingen `DefinedTerm` någonstans.

Sajtens största unika tillgång är alltså osynlig för strukturerad tolkning.

**Använd inline microdata, inte JSON-LD.** `itemscope itemtype="https://schema.org/DefinedTerm"`
på `.glossary-entry`, `itemprop="name"` på `<dt>`, `itemprop="description"` på `<dd>`. JSON-LD
hade dubblerat all text och nästan fördubblat en redan 378 KB stor sida som `ordlista-p.html`;
microdata kostar ~60 byte per term och ingen dubblering.

Görs i `scripts/generate_glossary.py`. Håll generator och `js/glossary.js` byte-identiska.

## 8. ⬜ Medicinsk ansvarsfriskrivning som delad komponent

**Mätt:** friskrivning finns på **4–5 av 118** sidor. Läkemedelsberäkningssidorna har den (bra).
Muskeltabellerna, nervtabellerna och de kliniska artiklarna har den inte.

Innehållet är YMYL. Bör vara en delad footer-komponent som alla generatorer emitterar, inte
text som skrivs in per sida.

Relaterat: **`reviewedBy` saknas överallt**, och bara 1 sida innehåller ordet "Granskad".
Övervägs tillsammans – men lova inget som inte stämmer: skriv bara "granskad av" om någon
faktiskt granskat.

## 9. ⬜ `lang="la"` på latinska termer

**Mätt:** `lang="la"` förekommer **noll** gånger i hela sajten, trots tusentals latinska termer.

En skärmläsare uttalar *musculus sternocleidomastoideus* med svensk fonetik. Det här är
**WCAG 3.1.2 Language of Parts på nivå AA** – ett formellt AA-fel, inte en finess.

Rimlig avgränsning i ett första steg: muskeltabellernas latinkolumn (den är redan en egen
`<td>` med `<em>`) samt ordlistans latinska uppslagsord. Löptextens inströdda latin är
svårare och kan vänta.

## 11. ⬜ Syskonlänkar i kunskapsbanken

**Mätt:** 60+ djupa kunskapsbankssidor har **exakt en** ingående intern länk – bara från sin
hubb. Endast **1 sida** i hela kunskapsbanken har ett "Relaterat"/"Se även"-block.

Utgående länkarna till ordlistan är däremot exemplariskt täta (`muskeltabell-handen.html`
länkar till 30+ termankare). Det är bara sidhorisontellt det saknas: handen ↔ underarmen ↔
skuldran, skelett-foten ↔ muskeltabell-foten ↔ leder-nedreextremitet.

Begränsar både crawldjup och hur topical authority samlas.

## 12. ⬜ Dela `llms.txt` i två filer

**Mätt:** `llms.txt` är 39 KB. Enskilda artikelbeskrivningar är 1 500+ tecken.

Specen vill ha en kort, skannbar indexfil. Innehållet är utmärkt GEO-material – problemet är
bara var det ligger. Kort `llms.txt` (~5 KB) + `llms-full.txt` med nuvarande innehåll.

## 13. ⬜ `.glossary-letter`-kontrast i ljust läge

**Mätt:** vit text på `linear-gradient(#10b981, #34d399)` ger **2,5:1** i den ljusa änden –
på varje ordlistesidas klistrade bokstavsrubrik. Samma problem i rekordmärkenas ljusa
gradientände (`.gm-record-badge`, `.matcha-record-badge`, `.leitner-record-badge`,
`.tidsjakt-record-badge`, `.tidsjakt-record-chip.beaten`, `.tidsjakt-praise.gold`,
`.leitner-chip`).

**Mörkt läge är redan åtgärdat** i 0.9.259 via en egen `[data-theme="dark"]`-regel som håller
bottnen mörkgrön (5,48:1). Ljust läge lämnades medvetet orört eftersom fixen ändrar den
visuella designen och inte var beställd.

Fixen är att låta gradienten börja på `--primary-deep` (`#047857`) i stället för `--primary`,
eller lägga en mörkare textskugga. **Fråga innan** – det syns.

## 14. ⬜ `about` / `teaches` / `keywords` i schema

**Mätt:** av 81 Article-noder saknar **73** `about`, och **alla 81** saknar `teaches`, `keywords`
och `license`.

Muskeltabellerna beskriver anatomiska entiteter. `"about": {"@type": "AnatomicalStructure",
"name": "Musculus biceps brachii"}` är exakt vad en svarsmotor behöver för att veta *vilken*
muskel sidan handlar om. Schema.org har health-lifesci-tilläggen färdiga.

## 15. ⬜ Rubrikhopp i `integritet.html`

Sidan går h1 → h3. Enda sidan i hela sajten med ett hopp. Femminutersfix.

---

## Medvetet EJ åtgärdat

- **Textstorlekar.** Sajten har `font-size` ner till 0,5 rem (8 px) i Leitner-lådorna på mobil.
  Uttryckligt besked 2026-07-25: **typsnittsstorlek rörs inte.**
- **`robots.txt`.** Är minimal (`User-agent: * / Allow: /`) men blanket-allow släpper in
  samtliga AI-crawlers redan. Ingen åtgärd behövs; en explicit bot-lista tillför inget.
- **`sitemap.xml` lastmod.** 116 sidor står på 2026-07-24 trots att filerna rörts senare.
  Det är **korrekt** – bara cachebustern ändrades, inte innehållet.
- **`ordlista-tecken.html`.** Saknar description, JSON-LD och `<h1>`, och är `noindex`.
  Avsiktlig redirect-stump (se 0.9.257). Ska förbli som den är.
