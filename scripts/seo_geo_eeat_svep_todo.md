# SEO, agentisk inläsning (GEO), EEAT och tillgänglighet – åtgärdslista

**Status:** analys gjord 2026-07-25 över samtliga sidor. **Punkt 1, 2, 3 och 10 utförda i 0.9.259.
Punkt 7 utförd i 0.9.265** (plus tre generatorbuggar som blockerade den, se nedan).
**Generatordriften utredd och åtgärdad i 0.9.266 – punkt 4, 6 och 14 är inte längre blockerade.
Punkt 6 utförd i 0.9.267. Punkt 4 utförd i 0.9.268. Återfallsskydd för hela svepet i
0.9.269.** Resten är öppen och prioriterad nedan.

> 🔒 **Punkt 10 och 13 är vilande och ska inte tas upp, föreslås eller utföras.** Användaren
> beslutade 2026-07-25 att inget visuellt ska göras och tar upp dem på eget initiativ.
> Öppna punkter är därmed **5, 8, 9, 11, 12, 14, 15** — inga andra.
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

## ✅ BLOCKERAREN ÄR BORTA – utredd och åtgärdad i 0.9.266

**Hela kedjan rundtrippar nu till identitet.** `python3 scripts/check_generators.py` speglar
alla spårade filer till en temporär katalog, kör alla `generate_*.py` + `wire_terms.py --all`
och jämför fil för fil. Exit 0 = noll ändrade filer. **Punkt 4, 6 och 14 är därmed öppna.**

Den ursprungliga analysen läste diffen bakvänt. Vid mätning var **den levererade HTML:en
stale i de flesta fall**, inte generatorn – handarbetet fanns redan i facit, sidorna hade
bara wirats innan det lades till. Varje fil avgjordes för sig:

1. **`ursprunget` → origo i minnesregelartikeln.** Äkta fel, men *bara där*: tooltipen är
   korrekt på 16 andra ställen. Löst med ny mekanism `BLOCKERADE_PER_SIDA` (sökväg → nycklar)
   i stället för global blockering.
2. **`region`-länkarna som "försvann".** Inte en regression – `region` står i `BLOCKERADE`
   sedan tidigare, och de 16 kvarvarande länkarna var stale. Borttagna, som avsett.
3. **Splittrade binomialnamn.** Även detta bakvänt läst: **HEAD hade splitten**, generatorn
   lagade den. Tolv namn låg live som två tooltips – `aponeurosis plantaris`,
   `vena jugularis interna`, `arteria subclavia`, `canalis opticus`, `dura mater`,
   `ossa carpi`, `m. flexor carpi ulnaris`, `lamina cribrosa`, `malleolus lateralis`.
   Undantaget var `Centrum tendineum perinei`, som var handwirad till *diafragmas*
   centralsena (fel struktur) – ny ordlistepost + ny facitnyckel.

Tre fall som analysen inte sett alls, funna vid mätningen:

4. **Muskeltabellhubbens ingress** tappade sin sista mening (länken till läsguiden) vid varje
   regenerering – den fanns bara i levererad HTML. Nu i generatorn.
5. **`data/medicinsk_latin.json` var stale i 47 frågor.** Generatorn hade disambiguerat
   riktningstermerna men filen aldrig skrivits om, så *superior* och *cranial* stod live med
   identiskt rätt svar ("övre") och var varandras distraktorer. Regenererad – plus en fix i
   `pick_distractors` så att den nya parentesen inte i sig blir facit.
6. **`data/muskler_flashcards.json`** hade handrättade versaler på 10 kort. Nu i generatorn.

**Kvarstående regel:** kör `scripts/check_generators.py` före varje commit som rör en
generator, ett facit eller en genererad sida. Se CLAUDE_REGLER §12.2.

### ✅ Ordlistegeneratorns egen drift – FIXAD i 0.9.265

Mättes när punkt 7 skulle byggas: `generate_glossary.py` rundtrippade inte heller, av tre
helt andra skäl. Alla tre är åtgärdade, och regeln står nu i **CLAUDE_REGLER.md §12.2**.

1. **`theme.js` fick fel cachebuster.** Mallen skrev `theme.js?v={STYLES_V}`. `styles.css`
   ändrades i 0.9.264 → `STYLES_V` bumpades → en regenerering hade skrivit
   `theme.js?v=0.9.264` på 33 sidor fast `js/theme.js` inte rörts sedan 0.9.260.
   `bump_version.py` gjorde rätt hela tiden; felet var att **en konstant bar två resurser**.
   Fanns i sex generatorer. Nu `THEME_V` skild från `STYLES_V`/`CSS_V` överallt, och
   `GLOSSARY_V` uppdelad i `GLOSSARY_CSS_V`/`GLOSSARY_JS_V`. `generate_artiklar.py` hämtade
   dessutom bustern ur beräknade `VERSION` och var därför osynlig för `bump_version.py`:s
   `generator_css_versions()` (som kräver ett literalt `VAR = "x.y.z"`) — nu literala konstanter.
2. **`sitemap.xml` daterade om hela sajten.** `write_sitemap` satte `date.today()` på alla
   240 URL:er vid varje körning. Nu jämförs varje sida mot disk med cachebusters
   bortnormaliserade (`?v=0.9.264` → `?v=`); bara sidor med ändrat **innehåll** får nytt
   `<lastmod>`, URL:er generatorn inte äger behåller sitt datum. Verifierat i 0.9.265:
   de 33 ordlistesidorna fick 2026-07-25, de 83 övriga stod kvar på 2026-07-24.
3. **`spellagen.html` var handinlagd i `sitemap.xml`** i annan ordning än generatorn emitterar.
   Generatorn äger filen; ordningen normaliserades.

**Rundtrippstest finns nu:** `python3 scripts/generate_glossary.py --check` bygger i minnet,
skriver inget och ger exit 1 vid avvikelse. Ren utcheckning + `--check` ska alltid ge
"rundtripp identisk".

---

## Prioriterad åtgärdslista

| # | Åtgärd | Insats | Effekt |
|---|---|---|---|
| ~~4~~ | ~~Person-`author` + `@id` på alla artiklar~~ | ✅ 0.9.268 | **Hög (EEAT)** |
| 5 | Synligt `<time datetime>` + `dateModified` överallt | ~2 h | **Hög (EEAT + färskhet)** |
| ~~6~~ | ~~`citation` från befintliga referenslistor~~ | ✅ 0.9.267 | **Hög (EEAT)** |
| ~~7~~ | ~~`DefinedTerm`-microdata i ordlistan~~ | ✅ 0.9.265 | **Högst (GEO)** |
| 8 | Ansvarsfriskrivning som delad komponent | ~1 h | Hög (YMYL) |
| 9 | `lang="la"` på latinska termer | ~3 h | Hög (WCAG AA) |
| 11 | Syskonlänkar / "Relaterat"-block | ~3 h | Medel |
| 12 | Dela `llms.txt` / `llms-full.txt` | ~30 min | Medel |
| ~~13~~ | ~~`.glossary-letter`-kontrast i ljust läge~~ | 🔒 **VILANDE** | ta inte upp |
| 14 | `about`/`teaches`/`keywords` i schema | ~2 h | Medel (GEO) |
| 15 | `integritet.html` rubrikhopp h1→h3 | 5 min | Låg |

---

## 4. ✅ KLAR i 0.9.268 – Person-`author` + `@id` på artiklarna

**Mätt efteråt:** **117 sidnoder över 117 sidor** bär nu `author` = Daniel Medin (Person,
`@id: https://anatomiquiz.se/#daniel-medin`) och `publisher` = Norrtou Creations
(`@id: .../#norrtou-creations`). **0 avvikelser**, verifierat genom att parsa alla 250
JSON-LD-block, inte greppa dem. Före: 65 noder hade `author` = Organization, 66 saknade
`author` helt, och de tre Person-noder som fanns var tre olika varianter utan `@id`.

**Två nya skript:**

- [`scripts/identity.py`](identity.py) – entiteterna definierade **en** gång. Person-noden är
  info.html:s fylligare variant; det är kvalifikationerna som är signalen, inte namnet.
- [`scripts/wire_identity.py`](wire_identity.py) – skriver in dem i varje sidas huvudnod.
  Idempotent, med `--check`. `FAQPage` och `BreadcrumbList` lämnas i fred, samma gräns som
  `wire_citations.py` drar.

**Skriptet ligger sist i kedjan**, efter `generate_glossary.py`. Det är inte godtyckligt:
glossary-generatorn skriver om ordlistans 33 sidor i slutet av kedjan och hade skrivit över
identiteten i vilket tidigare läge som helst.

**Backloggen sa "görs i generatorerna" – det blev tvärtom.** Identiteten är nu *borttagen* ur
de fyra tabellgeneratorerna (muskeltabeller, kärl, skelett, leder). Att lägga den i
generatorerna hade lämnat artikeltexterna och de 29 handskrivna kunskapsbankssidorna utan, och
gett sex kopior av sanningen att hålla i synk. Samma slutsats som punkt 6 kom till.

**Två inkonsekvenser rättades på köpet.** Kunskapsbanken angav `publisher: "Anatomiquiz"` medan
startsidan angav `"Norrtou Creations"` – två namn för samma utgivare motverkar hela poängen med
`@id`. Integritetspolicyn säger att Norrtou Creations är utgivaren, så det blev den.
`<meta name="author">` skiljde sig likadant (114 sidor "Norrtou Creations", 4 sidor "Daniel
Medin (Norrtou Creations)") och är nu enhetlig på alla 118. `isPartOf: WebSite "Anatomiquiz"`
står kvar orört – det är sajtens namn, inte utgivarens.

**Kostnad:** gzipat +102 byte på `index.html` (+0,5 %), +215 på minnesregelartikeln (+1,7 %),
+221 på en muskeltabell (+2,7 %), +245 på `ordlista-p.html` (+0,3 %).

## 5. ⬜ Synligt datum + `dateModified` överallt

**Mätt:** "Senast uppdaterad" finns på **5 av 118** sidor. `<time datetime>` på **1** sida.
Av 81 `Article`/`LearningResource`-noder saknar **65** `dateModified` och **66** `datePublished`.

Artiklarna *har* datum i JSON-LD men visar inget på sidan. Googles riktlinje är att det synliga
datumet ska matcha den strukturerade datan. Svarsmotorer väger färskhet tungt.

Kräver en källa till sanning för "senast ändrad" per sida – rimligen `data/artiklar.json`
respektive generatorernas register, inte filsystemets mtime (som ändras av cachebuster-bumpar).

## 6. ✅ KLAR i 0.9.267 – `citation` från de referenslistor som redan finns

**Mätt efteråt:** **71 sidor** bär `.kb-sources` (analysens "80 sidor" räknade även sidor som
bara nämner ordet Referenser). Alla 71 har nu `citation` i sin huvudnod: **292 noder, 55 unika
referenser, 0 otolkade.** Antalet noder är verifierat lika med antalet synliga `<li>` på varje
enskild sida, och all JSON-LD är omparsad efteråt.

**Två nya skript:**

- [`scripts/apa.py`](apa.py) tolkar en APA 7-sträng till en schema.org-nod och **vägrar gissa**
  – okänt mönster ger `APAError` och stoppar bygget. `python3 scripts/apa.py -v` kör hela
  sajtens referenskorpus och skriver ut varje nod.
- [`scripts/wire_citations.py`](wire_citations.py) läser sidans **synliga** `<li>`-lista och
  skriver in resultatet i huvudnoden (`Article`/`CollectionPage`/`WebApplication` — aldrig
  `FAQPage` eller `BreadcrumbList`). Idempotent, med `--check`.

**Källan är den synliga listan, inte ett register vid sidan om.** Backloggen föreslog att lägga
det i artikelgeneratorn, men generatorn äger bara hubbar och index — artikeltexterna och de 29
handskrivna kunskapsbankssidorna hade då blivit utan. Ett eget steg efter `wire_terms.py`
täcker alla 71 sidor med samma mekanism och garanterar dessutom att strukturdatan inte kan
avvika från det läsaren ser.

**Typfördelning:** 265 `Book`, 15 `ScholarlyArticle`, 9 `WebPage`, 3 `CreativeWork`.
`CreativeWork` används för organisationsutgivna skrifter utan upplaga (SFS 2009:600, ICD-10-SE,
HSLF-FS) — att kalla en föreskrift `Book` vore att påstå mer än vi vet.

**Kostnad:** gzipat +351 byte på en muskeltabell (+4 %), +370 på `spellagen.html` (+3 %),
+1 025 på minnesregelartikeln (+7 %, den har 8 referenser med DOI).

## 7. ✅ KLAR i 0.9.265 – `DefinedTerm`-microdata i ordlistan

**Utfört i [`build_group_dl()`](generate_glossary.py).** Inline microdata som planerat:
`itemscope itemtype="https://schema.org/DefinedTerm"` på `.glossary-entry`, `itemprop="name"`
på `<dt>`, `itemprop="description"` på `<dd>`.

**Mätt efteråt:** **11 175** poster över 32 sidor, alla med typ + `name` + `description`
(HTML-parsad, inte greppad: 11 175 objekt, **0** med fel typ eller tomt fält). Analysens
ursprungliga siffra 4 701 var stale — generatorn rapporterar 11 175 live-termer.

**Kostnaden blev mindre än befarat.** `ordlista-p.html` (1 087 termer, störst): 379 041 →
478 027 byte okomprimerat (+26 %), men **gzip 81 412 → 83 361 byte, +1 949 byte (+2,4 %)**.
Attributsträngarna är identiska och komprimeras i praktiken bort. Inga nya DOM-noder.

**Sökträffarna i `js/glossary.js` fick medvetet INTE attributen** — de renderas i klienten ur
samma data och hade gett en JS-körande crawler samma term två gånger på samma sida. De delade
funktionerna (`slugify`/`page_key`/`escapeHtml`/`formatDef`) är orörda, så byte-identiteten som
håller `#term-…`-ankarna stabila gäller fortfarande.

**Dessutom:** landningssidans `DefinedTermSet` fick `"@id": ".../medicinskordlista.html#ordlista"`
och bokstavssidornas `isPartOf` pekar nu på samma `@id`. Ordlistan är därmed **en** entitet i
stället för 33 löskopplade kopior — samma princip som punkt 4 vill ha på Person-noden.

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

## 13. 🔒 VILANDE – `.glossary-letter`-kontrast i ljust läge

> **Ta inte upp den här punkten.** Användaren beslutade 2026-07-25 att inget visuellt ska
> göras. Mätningen nedan står kvar som dokumentation; den är inte en åtgärdslista. Se
> avsnittet "Vilande: punkt 10 och 13" ovan.

**Mätt:** vit text på `linear-gradient(#10b981, #34d399)` ger **2,5:1** i den ljusa änden –
på varje ordlistesidas klistrade bokstavsrubrik. Samma problem i rekordmärkenas ljusa
gradientände (`.gm-record-badge`, `.matcha-record-badge`, `.leitner-record-badge`,
`.tidsjakt-record-badge`, `.tidsjakt-record-chip.beaten`, `.tidsjakt-praise.gold`,
`.leitner-chip`).

**Mörkt läge är redan åtgärdat** i 0.9.259 via en egen `[data-theme="dark"]`-regel som håller
bottnen mörkgrön (5,48:1). Ljust läge lämnades medvetet orört eftersom fixen ändrar den
visuella designen och inte var beställd.

Fixen vore att låta gradienten börja på `--primary-deep` (`#047857`) i stället för `--primary`,
eller lägga en mörkare textskugga. Noterat för användarens skull – inte som ett förslag.

## 14. ⬜ `about` / `teaches` / `keywords` i schema

**Mätt:** av 81 Article-noder saknar **73** `about`, och **alla 81** saknar `teaches`, `keywords`
och `license`.

Muskeltabellerna beskriver anatomiska entiteter. `"about": {"@type": "AnatomicalStructure",
"name": "Musculus biceps brachii"}` är exakt vad en svarsmotor behöver för att veta *vilken*
muskel sidan handlar om. Schema.org har health-lifesci-tilläggen färdiga.

## 15. ⬜ Rubrikhopp i `integritet.html`

Sidan går h1 → h3. Enda sidan i hela sajten med ett hopp. Femminutersfix.

---

## Är punkterna skyddade mot återfall? (granskat 0.9.269)

§0 i CLAUDE_REGLER kräver att en åtgärdad punkt inte kan komma tillbaka. En punkt är inte
klar för att felet är borta — den är klar när något som *körs* hindrar att det uppstår igen.
Granskningen efter punkt 4:

| Punkt | Skydd | Kör var |
|---|---|---|
| 1 trasiga URL:er | ✅ `check_links.py` — 11 244 länkar mot disk | `check_generators.py` |
| 2 `404.html` | ✅ `check_links.py` stoppar om filen försvinner | `check_generators.py` |
| 3 arkivfiler publikt | ✅ `check_links.py` — `_ARCHIVED*` utanför `_arkiv/` | `check_generators.py` |
| 4 identitet | ✅ `wire_identity.py`, larmar på okänd `@type` | `check_generators.py` |
| 6 `citation` | ✅ `wire_citations.py` + `apa.py` kastar hellre än gissar | `check_generators.py` |
| 7 `DefinedTerm` | ✅ `generate_glossary.py` äger märkningen | `check_generators.py` |
| 10 kontrast | 🔒 vilande — se nedan | — |

**Punkt 10 saknar kontroll, och det förblir så.** En kontrastkontroll (räkna WCAG-kvot ur
CSS-variablerna) skulle täcka både den och punkt 13, men båda rör hur sajten *ser ut*.

**Regeln för resten av svepet:** varje kommande punkt (5, 8, 9, 11, 12, 14, 15) ska leverera
sitt skydd i samma pass som åtgärden, inte som en efterhandsfråga. Punkt 11 och 12 skyddas
redan av `check_links.py` — nya syskonlänkar och en delad `llms-full.txt` valideras automatiskt.

---

## 🔒 Vilande: punkt 10 och 13 — visuella ändringar

**Beslut av användaren 2026-07-25: inget visuellt ska göras.** Punkterna står kvar här som
dokumentation av vad som mätts, ingenting annat.

**De ska inte tas upp, föreslås, påminnas om eller utföras.** Inte i statusrapporter, inte
som "det finns förresten kvar", inte som ett erbjudande i slutet av ett annat pass. Användaren
tar upp dem på eget initiativ om och när hen vill. Det gäller även den kontrastkontroll som
skulle skydda punkt 10 mot återfall — bygg den inte oombedd.

Detsamma gäller allt annat som ändrar sajtens utseende: textstorlekar är sedan tidigare
uttryckligen fredade (se "Medvetet EJ åtgärdat" nedan).

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
