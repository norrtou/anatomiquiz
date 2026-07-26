# SEO, agentisk inläsning (GEO), EEAT och tillgänglighet – åtgärdslista

**Status:** analys gjord 2026-07-25 över samtliga sidor. **Punkt 1, 2, 3 och 10 utförda i 0.9.259.
Punkt 7 utförd i 0.9.265** (plus tre generatorbuggar som blockerade den, se nedan).
**Generatordriften utredd och åtgärdad i 0.9.266 – punkt 4, 6 och 14 är inte längre blockerade.
Punkt 6 utförd i 0.9.267. Punkt 4 utförd i 0.9.268. Återfallsskydd för hela svepet i
0.9.269. Punkt 5 utförd i 0.9.270**, plus två blockerare i sitemap- och rundtrippskedjan.
**Punkt 8 utförd i 0.9.271, omarbetad till en delad sidfot i 0.9.272.
Punkt 9 utförd i 0.9.275**, plus en blockerare i datumkedjan.
**Punkt 12 utförd i 0.9.276**, plus 30 sidor som saknades i `llms.txt` och en text som
drivit isär mellan två register.
**Punkt 11 utförd i 0.9.277**, plus blockeraren i datumkedjan.
**Punkt 14 utförd i 0.9.278**, plus fyra felaktiga `about`-påståenden som legat i
märkningen sedan sidorna skrevs.
**Punkt 15 utförd i 0.9.279**, plus en handskriven datumdubblett i policyns brödtext.
**Punkt 13 utförd i 0.9.280 på användarens begäran**, tillsammans med det skydd punkt 10
saknade – plus elva kontrastbrister i mörkt läge som ingen mätning hade tittat efter.
**Svepet är därmed helt avslutat: inga öppna punkter, inga vilande punkter.**

> ✅ **Punkt 10 och 13 låg vilande 2026-07-25 – 2026-07-26 och togs upp av användaren själv,
> vilket var villkoret.** Textstorlekar är fortfarande uttryckligen fredade, se
> "Medvetet EJ åtgärdat" sist i filen.
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

**Rundtrippstestet ligger i `scripts/check_generators.py`.** Ordlistegeneratorn fick ett eget
`--check` här i 0.9.265, men det togs bort i 0.9.270: det kunde per konstruktion aldrig lysa
grönt igen efter att `wire_citations.py` och `wire_identity.py` började skriva i de färdiga
sidorna, och stod alltså som ett skydd i regelverket samtidigt som det gav exit 1 på en ren
utcheckning. Se punkt 5 nedan.

---

## Prioriterad åtgärdslista

| # | Åtgärd | Insats | Effekt |
|---|---|---|---|
| ~~4~~ | ~~Person-`author` + `@id` på alla artiklar~~ | ✅ 0.9.268 | **Hög (EEAT)** |
| ~~5~~ | ~~Synligt `<time datetime>` + `dateModified` överallt~~ | ✅ 0.9.270 | **Hög (EEAT + färskhet)** |
| ~~6~~ | ~~`citation` från befintliga referenslistor~~ | ✅ 0.9.267 | **Hög (EEAT)** |
| ~~7~~ | ~~`DefinedTerm`-microdata i ordlistan~~ | ✅ 0.9.265 | **Högst (GEO)** |
| ~~8~~ | ~~Ansvarsfriskrivning som delad komponent~~ | ✅ 0.9.271–272 | **Hög (YMYL)** |
| ~~9~~ | ~~`lang="la"` på latinska termer~~ | ✅ 0.9.275 | **Hög (WCAG AA)** |
| ~~11~~ | ~~Syskonlänkar / "Relaterat"-block~~ | ✅ 0.9.277 | Medel |
| ~~12~~ | ~~Dela `llms.txt` / `llms-full.txt`~~ | ✅ 0.9.276 | **Medel (GEO)** |
| ~~13~~ | ~~Kontrast på färgade ytor, båda teman~~ | ✅ 0.9.280 | **Hög (WCAG AA)** |
| ~~14~~ | ~~`about`/`teaches`/`keywords` i schema~~ | ✅ 0.9.278 | Medel (GEO) |
| ~~15~~ | ~~`integritet.html` rubrikhopp h1→h3~~ | ✅ 0.9.279 | Låg |

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

## 5. ✅ KLAR i 0.9.270 – synligt datum + `dateModified` överallt

**Mätt efteråt:** **117 sidor, 117 sidnoder med båda datumen, 117 synliga `<time datetime>`,
117 `<lastmod>` — och varje trio jämförd mot facit post för post. 0 avvikelser.** Verifierat
genom att parsa all JSON-LD, inte greppa den. Före: "Senast uppdaterad" på **1** sida,
`<time datetime>` på **1**, och av 117 sidnoder saknade **99** `dateModified` och **102**
`datePublished`. (Analysens "5 av 118" och "81 Article-noder" räknade fel mängd — den
verkliga populationen är 117 sidnoder över 117 indexerbara sidor.)

**Källan blev git, inte ett register som fylls i.** Backloggen föreslog `data/artiklar.json`
respektive generatorernas register. Det hade blivit ett handhållet datum, och ett handhållet
datum blir aldrig uppdaterat: varje sida som ändras utan att någon minns att flytta datumet
börjar ljuga för både läsare och sökmotor, och det syns inte. Regeln är därför inte "kom ihåg
att uppdatera datumet" utan **"rör aldrig datumet"**.

**Två nya skript + ett facit:**

- [`data/sidodatum.json`](../data/sidodatum.json) – enda sanningen. Tre konsumenter läser
  samma post: den synliga raden, `datePublished`/`dateModified` i JSON-LD och `<lastmod>` i
  `sitemap.xml`. De kan därmed inte säga tre olika saker.
- [`scripts/sidodatum.py`](sidodatum.py) – härleder datumen ur git. Går bakåt genom varje
  sidas revisioner och stannar vid den första där **innehållet** faktiskt skiljer sig.
  `--update` skriver facit, `--check` ger exit 1 när det är inaktuellt.
- [`scripts/wire_dates.py`](wire_dates.py) – skriver raden i `<main>` **och** de två fälten i
  JSON-LD, ur samma post. Ligger sist i kedjan, efter `wire_identity.py`.

**Normaliseringen är hela poängen.** `<head>`, JSON-LD, cachebusters, datumraden själv och
blankstegsskillnader räknas inte som innehåll. Utan det hade versionsbumpen till 0.9.270
(124 filer) och identitetssvepet i 0.9.268 (117 filer) daterat om hela sajten till samma dag.
Bevisat live: bumpen rörde 124 filer och flyttade **noll** datum. Resultatet är en verklig
spridning – `integritet.html` 23 juni, `versionshistorik.html` 20 juli, verktygen 23 juli,
tabellerna 24 juli, ordlistan 25 juli.

**`publicerad` sätts en gång och flyttas aldrig.** Fem artiklar bar ett handskrivet
`datePublished` som låg *före* incheckningen – de skrevs klart dagen innan – och författarens
uppgift väger tyngre än incheckningstidpunkten. Den vinner därför över git.

**`info.html` fick ingen extra rad.** Sidan hade redan en egen datumformulering i brödtexten;
dess `<time>` är märkt `data-updated` och uppdateras på plats. Det tar samtidigt bort det
handgrepp SEO_REGLER §15 krävde vid varje nyhetsnotis.

**Delad modul `scripts/jsonld.py`.** Bruten ur `wire_identity.py`, som nu importerar den.
Låg listan över sidtyper i två skript hade ett nytt sidslag kunnat hamna i det ena och inte i
det andra, och sidan tyst fått författare men inget datum. **Punkt 14 ska använda samma modul.**

### Två blockerare lagade i samma pass

1. **`sitemap.xml` daterades om vid varje körning.** `build_sitemap` räknade själv ut vad som
   ändrats genom att jämföra generatorns utdata mot disk. Det kunde bara fungera för ordlistans
   33 sidor — och gjorde fel även där: filerna på disk bär tooltips, referenser och identitet
   som generatorn inte skriver, så de 33 fick **dagens** datum varje gång kedjan kördes, medan
   de övriga 84 aldrig kunde få ett nytt. `check_generators.py` hade fällt sig själv nästa
   dygn. `<lastmod>` hämtas nu ur facit; `content_changed()`/`existing_lastmods()` är borta.
2. **`generate_glossary.py --check` var ett rött larm.** Det stod i CLAUDE_REGLER §12.2 som
   *rundtrippstestet*, men gav exit 1 på en ren utcheckning ända sedan 0.9.267 — av samma skäl
   som ovan. Ett larm som alltid är rött lär man sig att ignorera. `--check` är borttaget;
   `check_generators.py` mäter samma sak korrekt eftersom den kör hela kedjan.

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

## 8. ✅ KLAR i 0.9.271, omarbetad till en sidfot i 0.9.272

**Mätt efteråt:** **117 av 119 sidor** bär den delade sidfoten. Av dem har **113**
friskrivningsraden, **116** integritetsraden och **116** datumraden — varje avvikelse
motsvarar exakt en post i sin undantagslista, ingen annan. Alla rader är **ordagrant
identiska**, verifierat genom att extrahera blocket ur varje sida och jämföra strängarna, inte
genom att räkna träffar på klassnamnet. 0 sidfötter utanför `<main>`, 0 tooltips inuti dem,
**0 förekomster av fetstil**.

Före: **5 av 119** sidor sa något om ansvar, i **fyra olika** formuleringar (`spellagen.html`
ett helt kortavsnitt, `info.html` ett stycke under Källor, två artiklar en mening mitt i
brödtexten, läkemedelsräknaren sin `.vt-ansvar`-ruta). Analysens "4–5 sidor" stämde; däremot
stämde inte "läkemedelsberäkningssidorna har den" — det gällde **räknaren**, medan båda
faktatexterna om läkemedelsberäkning saknade friskrivning helt. Muskeltabeller, nervtabeller,
kärl, skelett, leder, ordlistans 33 sidor och startsidan hade ingenting.

**Formen blev en sidfot, inte en rad — och det var användarens invändning som gav rätt svar.**
Första bygget (0.9.271) lade friskrivningen som ett löst stycke ovanför den lika lösa
datumraden, sist i `<main>`. På varje sida hamnade de två under det som *visuellt* avslutar
sidan: knappraden, ordlistans tillbakaknappar, och på `index.html` under sajtens egen
kakfot. Tre lösa rader efter sidans avslut ser ut som något som blivit över.

Rätt åtgärd var inte att flytta raden utan att **baka ihop den med kakraden till en riktig
sidfot** — samma form som den gamla `.footer`: centrerad, liten, dämpad, med egen linje och
luft ovanför. Kakraden fanns dessutom bara på två sidor; nu står den på alla 116 där den hör
hemma. Den gamla `.footer`-klassen är uppgången i den nya och dess CSS borttagen.

**Två skript:**

- [`scripts/sidfot.py`](sidfot.py) – raderna, markupen, mönstren och de tre undantagslistorna.
  En sträng, ett ställe.
- [`scripts/wire_sidfot.py`](wire_sidfot.py) – bygger blocket sist i `<main>`. Ligger mellan
  `wire_identity.py` och `wire_dates.py` i kedjan.

**Backloggen sa "en delad footer-komponent som alla generatorer emitterar" – det blev ett eget
kedjesteg igen**, av exakt samma skäl som punkt 4, 5 och 6 kom fram till: generatorerna äger
bara tabellsidorna, hubbarna och ordlistan. Artikeltexterna, de 29 handskrivna
kunskapsbankssidorna, `index.html` och `case.html` hade blivit utan, och sex generatorer hade
fått var sin kopia av samma mening att hålla i synk.

**Datumraden bytte ägare till hälften.** `wire_dates.py` äger datumets *värde*,
`wire_sidfot.py` dess *plats*: en befintlig `<p class="page-updated">` plockas ur sidan och
läggs sist i blocket. Saknas den helt — en nygenererad sida — lägger `wire_dates.py` in den i
sidfoten i stället för före `</main>`, eftersom det steget kör efter.

**Skriptet skriver om, det hoppar inte över.** En befintlig sidfot tas bort och byggs på nytt.
Det gör att en textändring i `sidfot.py` slår igenom på alla sidorna vid nästa körning — ett
skript som hoppade över redan wirade sidor hade lämnat den gamla texten kvar, precis det som
gjorde `--sync-defs` nödvändig i `wire_terms.py`.

**Ingen variant per sidtyp.** `.vt-ansvar` på räknaren står kvar orörd: den handlar om att
stämma av ett *uträknat svar* mot ordination och produktinformation och hör hemma bredvid
räknarna. Den generella friskrivningen har exakt en formulering, för det är det enda som gör
den omöjlig att glida ifrån. De två artiklarnas handskrivna mening är borttagen — den är nu
komponentens jobb.

**`reviewedBy` skrevs INTE, och det är ett beslut, inte en glömska.** Ingen utomstående har
granskat innehållet. Ett `reviewedBy` utan granskare är ett falskt påstående i YMYL-material
och ett sämre EEAT-läge än att inte påstå något. Beslutet står i SEO_REGLER §6e så att det
inte behöver tas om.

**Tre fällor som hittades vid mätning, inte vid läsning:**

1. **`\s*` i borttagningsmönstret åt upp en tomrad per körning.** Första versionen
   rundtrippade inte: `\s*` svalde även den tomrad som skiljer blocket från `</section>`, och
   61 av 113 sidor tappade en tomrad. Mönstren matchar nu `\n[ \t]*` — exakt så mycket som
   lades till. Blocket läggs dessutom in **efter** blankstegssvepet före `</main>`, inte före.
2. **`klinisk`/`kliniska` är facitnycklar.** Utan `.page-footer` som skyddad zon i
   `wire_terms.py` hade `wire_terms` wirat dem vid nästa körning och gjort 117 identiska
   sidfötter till 117 olika. Zonen är på plats; 0 `kb-term` inuti dem, verifierat.
3. **Boilerplate måste kunna strykas i den form den hade IGÅR.** `normalisera()` i
   `sidodatum.py` jämför mot git-historiken. När 0.9.271:s `.page-disclaimer` byttes mot
   sidfoten kände normaliseringen bara igen den nya formen, och **112 sidor** stod på väg att
   dateras om till samma dag — exakt den falska färskhetssignal normaliseringen finns för att
   undvika. `HISTORISKA_RX` i `sidfot.py` stryker de gamla formerna; efter det: **0 sidor
   omdaterade**. Ändras sidfotens markup igen ska den gamla formen in där i samma pass.

**Kostnad** mot läget före hela punkten: gzipat +76 byte på `index.html` (+0,4 %, den bar
redan kakraden), +245 på en muskeltabell (+2,9 %), +214 på `ordlista-p.html` (+0,3 %).

**Skyddet är verifierat genom planterade fel, inte genom att kontrollen sagt OK:** raderad
sidfot, handredigerad text, borttagen rad, datumrad utflyttad ur blocket, ny sida utan
`<main>` och ett spöke i undantagslistan gav alla exitkod 1 med ett besked som säger vad som
ska göras.

## 9. ✅ KLAR i 0.9.275 – `lang="la"` på latinska termer

**Mätt efteråt:** **1 503 förekomster** – **398 `<em>` i tabellernas latinkolumner** (alla
398, 0 utan) och **1 105 latinska uppslagsord i ordlistan** (exakt de 1 105 som facit
`data/ordlista.json` pekar ut: 0 falska, 0 missade). `lang="la"` sitter på **enbart** `<em>`
och `<dt>`, ingen annanstans, och **0 märkta element innehåller svenska tecken**. Verifierat
genom att härleda mängden ur datafilen och HTML:en oberoende av skriptets egen logik, inte
genom att lita på dess räkning. Före: **noll** förekomster i hela sajten.

**Analysens avgränsning var för smal – latinkolumnen finns i fyra tabellfamiljer, inte en.**
Backloggen sa "muskeltabellernas latinkolumn". Mätningen hittade den även i skelettabellerna
(`Ben (latin)`, 62 + ledtabellens `Latin`, 40), kärltabellerna (`Kärl (latin)`, 44) och – det
som betydde mest – i de **handskrivna** nervtabellerna (`Nerv (latin)` 28,
`Nerv (latin / svenska)` 12, `Bana (latin)` 12), som ingen generator äger. Klassiskt §0.2:
feltypen hade flera ytformer än den som råkade beskrivas först.

**Attributet sitter på `<em>`, aldrig på `<td>` – och det är hela poängen.** Latinkolumnerna
är inte rent latinska: nervtabellerna skriver `<em>Nervus medianus</em><br>(medianusnerven)`
och kranialnervstabellen `<em>Nervus opticus</em> – synnerven`. Ett `lang="la"` på cellen hade
fått skärmläsaren att uttala den svenska översättningen med latinsk fonetik också. **Ett
felaktigt språkattribut är en regression, inte en halv förbättring** – sämre än att inte märka
något alls.

**Två nya skript:**

- [`scripts/latin.py`](latin.py) – regeln på ett ställe: kolumnmönstret `(latin)` och de 30
  latinska genusord som avslutar ordlistans inverterade TA-former.
- [`scripts/wire_lang.py`](wire_lang.py) – skriver in attributet. Idempotent genom att skriva
  om, med `--check`. Ligger efter `generate_glossary.py` och före `wire_identity.py`.

**Backloggen sa "görs i generatorerna" – det blev ett eget kedjesteg, femte gången i rad.**
Samma slutsats som punkt 4, 5, 6 och 8: generatorerna äger bara tabellsidorna, hubbarna och
ordlistan, så de handskrivna nervtabellerna hade blivit utan och fem generatorer fått var sin
kopia av frågan "är det här latin?".

**Ordlistan märktes till 1 105 av 11 176 poster, och resten är ett beslut – inte en glömska.**
De latinska uppslagsorden känns igen på Terminologia Anatomicas inverterade form
"specifik, genus" (`abductor pollicis brevis, musculus`); samtliga 1 105 slutar på ett av 30
kända genusord, så regeln är sluten och kräver inget omdöme. Resten av ordlistan är svensk
(`huvudvärk`, `snöblindhet`), internationell (`infektion`, `cytotoxisk`) eller fransk
(`Souffle`), och ett mönster som gissade språket ur definitionstexten hade märkt svenska ord
som latin. `data/ordlista.json` bär inget språkfält; ska de övriga latinska uppslagsorden
(`axilla`, `radix`, `pylorus`) märkas är rätt åtgärd ett fält i datafilen som sätts när posten
skrivs, inte en tolkning i efterhand (§0.3). **Löptextens inströdda latin är fortfarande
omärkt** och kräver att termen avgränsas i märkningen först.

**Kostnad:** gzipat +32 byte på en muskeltabell (+0,4 %), +198 på `ordlista-p.html` (+0,2 %),
+26 på `kranialnerverna.html` (+0,3 %). Attributsträngarna är identiska och komprimeras i
praktiken bort – samma effekt som microdatan i punkt 7.

### Blockeraren som lagades i samma pass

**`lang="la"` hade daterat om 63 sidor till samma dag.** Attributet ändrar sidans markup men
inte en bokstav av det läsaren ser, och `normalisera()` i `sidodatum.py` kände inte igen det.
Bevisat genom att stänga av fixen och mäta: **63 sidor** – samtliga tabellsidor och hela
ordlistan – stod på väg från sina riktiga datum (24–25 juli) till 26 juli. Det är exakt den
falska färskhetssignal normaliseringen finns för att undvika. `LANG_RX` stryker attributet ur
**båda** sidor av jämförelsen, vilket också gör att revisioner från innan det fanns fortsätter
matcha – samma sak som `HISTORISKA_RX` löser för sidfoten. Efter fixen: **0 sidor omdaterade**
trots att 63 filer skrevs om.

## 11. ✅ KLAR i 0.9.277 – syskonlänkar i kunskapsbanken

**Mätt efteråt:** **0 kunskapsbankssidor har kvar en enda ingående intern länk** — före: 36.
Blocken lägger **225 pillänkar** över **46 sidor**, varav 221 är nya källa→mål-par (fyra fanns
redan i brödtexten på de två nervbanesidorna). De 36 tidigare löven ligger nu på **3–14**
ingående länkar. Verifierat genom att räkna om hela länkgrafen två gånger — en gång med
blocken bortnormaliserade ur HTML:en, en gång med dem kvar — inte genom att lita på skriptets
egen räkning. Blocken bär 3–6 länkar var; taket är 6.

**Den ommätta utgångspunkten stämde:** inte backloggens "60+" utan **36 sidor med exakt en**
ingående länk, i samtliga fall från sidans egen hubb (skelett 11, muskeltabeller 13, kärl 6,
leder 4, nervtabeller 2). Utgående länkar till ordlistan var däremot redan täta —
`muskeltabell-handen.html` länkar till 30+ termankare. Det var bara sidhorisontellt det saknades.

**Två nya skript:**

- [`scripts/relaterat.py`](relaterat.py) – kartan som **relationsgrupper**, inte som par.
  En grupp skrivs en gång och blir symmetrisk av sig själv. Vilka sidor som hör ihop är
  anatomiskt omdöme och är handskrivet (§0.3); att göra relationen symmetrisk, hålla den
  under taket och rendera den är skriptets.
- [`scripts/wire_relaterat.py`](wire_relaterat.py) – placerar blocket före `.kb-sources`,
  med `--check`. Skriver om, hoppar inte över. Ligger efter `wire_citations.py` i kedjan.

**Rena regiongrupper räckte inte, och det var punktens enda verkliga designproblem.**
`karl-armen.html` täcker skuldra, överarm, underarm och hand. Som medlem i alla fyra
regiongrupperna hade den fått **15** länkar tillbaka — mätt, inte uppskattat. Lösningen blev
`kärna`/`vidare`: regionens sidor länkar till översiktssidan, den länkar inte tillbaka, och
får sina egna länkar ur en familjegrupp där granulariteten matchar. Ingen relation skrivs
någonstans två gånger, så ingenting kan glida isär — och taket kan hållas utan att någon lista
klipps. **Samma mekanism åt andra hållet räddade bäckenbottnen**, som annars hade blivit kvar
med en enda ingående länk: den står som `vidare` i höftgruppen.

**Backloggen sa "max 5 länkar" – det blev 6.** Kedjegrannarna (handen ↔ underarmen ↔ skuldran)
gör att en mittsida i en extremitet får sex: regiontvillingen, tre översiktssidor och två
grannar. Att i stället klippa listan hade gjort urvalet godtyckligt. Taket är hårt i skriptet:
en karta som spränger det stoppar bygget i stället för att trimmas.

**Eget kedjesteg, inte generatorändring — sjätte gången samma slutsats** (punkt 4, 5, 6, 8, 9):
nervtabellerna, `kranialnerverna` och de handskrivna faktatexterna ägs inte av någon generator.

**30 sidor står utanför, var och en med skäl.** Hubbarna *är* navigeringen, och artiklarna och
terminologisidorna korslänkas redan i brödtexten enligt ARTIKLAR_REGLER — samtliga hade tre
eller fler ingående länkar vid mätningen och var alltså inte det problem punkten löser.
Nytt synligt innehåll infördes bara i den utsträckning uppgiften krävde (§0.5).

### Blockeraren som lagades i samma pass

**Blocket hade daterat om exakt de 46 sidor punkten finns för att lyfta.** Precis som sidfoten
(0.9.272) och `lang="la"` (0.9.275) ändrar det `<main>` på alla sidorna samma dag. Bevisat
genom att köra utan fixen och mäta: **46 sidor** stod på väg från 24 juli till 26 juli.
`RELATERAT_RX` i `normalisera()` stryker blocket ur **båda** sidor av jämförelsen; efter fixen
**0 omdaterade sidor**. Regeln räcker längre än till införandet: ändras kartan så att en region
får en sida till ska regionens övriga sidor inte påstå att deras innehåll är nytt.

Att mönstret stryker *bara* blocket är verifierat separat: normaliserad sida med och utan
blocket är byte-identisk (54 097 tecken båda), medan en ändrad ordinarie tabellcell
fortfarande syns som en ändring.

**`.kb-seealso` är skyddad zon i `wire_terms.py`**, bredvid `.page-footer` och `.kb-card`.
Länktexten skyddas visserligen redan av `in_anchor`, men rubriken gör det inte.

**Skyddet är verifierat med planterade fel, inte genom att kontrollen sagt OK:** ny
kunskapsbankssida som ingen klassat, spöke i undantagslistan, sida i både grupp och
undantagslista, karta som spränger taket, målsida utan `<h1>`, sida utan både `.kb-sources`
och `.actions`, handredigerad länktext, raderat block och block flyttat efter referenslistan
gav alla exitkod 1 med ett besked som säger vad som ska göras.

## 12. ✅ KLAR i 0.9.276 – `llms.txt` delad i index och fulltext

**Mätt efteråt:** `llms.txt` **39,2 → 17,1 KB** (−56 %) samtidigt som den gick från 88 till
**118 URL:er** (+34 %) — per sida från ~450 till ~140 byte. `llms-full.txt` bär de utförliga
beskrivningarna, 47,0 KB. **Varje `<loc>` i `sitemap.xml` finns nu i indexet: 117 av 117, 0
undantag.** Båda filerna renderas ur `data/llms.json`, så deras URL-listor kan inte skilja sig
åt. Verifierat genom att konverteringen av den gamla filen till registret regenererade
**byte-identisk** utdata innan en enda text skrevs om — inget gick förlorat i flytten.

**Storleken var inte den värsta defekten.** Jämförelsen mot `sitemap.xml` visade att **30 av
117 indexerbara sidor saknades helt i `llms.txt`** — hela skelettfamiljen (12 undersidor +
hubb), hela kärlfamiljen (6 + hubb), hela ledfamiljen (4 + hubb), plus `listor-tabeller.html`,
`faktatexter.html`, `integritet.html`, `ordlista-siffror.html` och `ordlista-suffix.html`. Den
fil agenter läser **först** saknade alltså en fjärdedel av sajten, och ingenting som kördes
upptäckte det: `check_links.py` validerar att URL:erna *i* filen finns på disk, aldrig att
sidorna *på disk* finns i filen. Klassisk §0.4 — tyst uteblivet ser ut som en lyckad körning.
Alla 30 har nu både kort och utförlig beskrivning, skrivna mot sidornas eget innehåll.

**Ett register, två renderingar.** `data/llms.json` bär sektion, URL, titel, `kort` (→
`llms.txt`) och `lang` (→ `llms-full.txt`); [`scripts/generate_llms.py`](generate_llms.py)
skriver båda filerna. Två handhållna textfiler med samma URL-lista hade glidit isär — samma
slutsats som punkt 4, 5, 6, 8 och 9 kom till var för sig.

**Och de hade redan gjort det.** Artiklarnas utförliga text stod i **två** register, och
`engelska-i-medicinskt-sprak` skiljde sig: `llms.txt` bar den språkligt putsade versionen
("cirka", "c till k", "SNOMED CT"), `data/artiklar.json` den gamla ("ca", "c→k", "Snomed CT").
Ingen kontroll kunde se det. Artikeltexten bor nu bara i `data/artiklar.json` (fältet `llms`)
och slås upp därifrån — den putsade versionen vann. `llms_rader()`/`llms_rader_pelare()` i
`generate_artiklar.py`, som producerade rader att klistra in för hand, är borttagna; de var
dessutom aldrig anropade.

**Två gränser som inte flyttades.** Ordlistans 30 bokstavssidor står kvar som **en** rad med 30
länkar — de har inget eget innehåll att beskriva var för sig, och 30 rader hade varit brus i en
indexfil. `ordlista-tecken.html` står utanför båda filerna: den är `noindex` och därmed inte i
sitemap. Prefixposten hette dessutom "Prefix och suffix" fast suffixsidan finns separat och
saknades — nu tre egna poster (prefix, suffix, siffror).

**Skyddet är verifierat med planterade fel, inte genom att kontrollen sagt OK:** sida i sitemap
men inte i registret, tom `kort`, URL som inte finns på disk, artikel utan utförlig text,
handredigerad `llms.txt` och samma URL två gånger gav alla exitkod 1 med ett besked som säger
vad som ska göras. Steget ligger sist i `check_generators.py`, så filerna regenereras vid varje
rundtripp och en handredigering kan inte överleva till en commit.

**Regeln står i SEO_REGLER §9b**, med §11.B och pre-flight-listan i §12 uppdaterade: en ny sida
läggs i `data/llms.json`, aldrig i textfilerna.

## 13. ✅ KLAR i 0.9.280 – kontrast på färgade ytor, båda teman

**Beställd av användaren 2026-07-26**, efter att ha legat vilande sedan 2026-07-25.

**Mätt efteråt:** **131 mätpunkter i två teman klarar WCAG AA**, mätta av det nya
`scripts/check_kontrast.py` som räknar kvoten ur CSS:en. Före: **19 ytor under gränsen**,
varav bara 8 var de som analysen pekade ut. 9 ytor går inte att mäta och har var sin skäl i
skriptet; 1 är mätt, redovisad och medvetet oförändrad (se nedan).

**Analysens siffra var för mild: 2,5:1 gällde `--primary`, men den ljusa änden är
`--primary-light`.** Bokstavsrubriken låg på **1,92:1**, inte 2,5.

### Före → efter, värde för värde

| Yta | Tema | Före | Efter |
|---|---|---|---|
| `.glossary-letter` (33 sidor, klistrad rubrik) | ljust | `--primary`→`--primary-light`, **1,92** | `--plate-green`→`--plate-green-deep`, **5,48** |
| `.changelog-version` | ljust | samma gradient, **1,92** | samma fix, **5,48** |
| `.gm-record-badge`, `.matcha-record-badge`, `.leitner-record-badge`, `.tidsjakt-record-badge`, `.tidsjakt-record-chip.beaten`, `.tidsjakt-praise.gold` | ljust | `--primary`→`--primary-deepest`, **2,54** | `--plate-green`→`--plate-green-deep`, **5,48** |
| `.leitner-chip` | ljust | `--primary`→`--primary-deep`, **2,54** | samma fix, **5,48** |
| `.skip-link` | ljust | `--primary`, **2,54** | `--plate-green`, **5,48** |
| `.answer-btn.correct` | **mörkt** | `--primary-deep` (→`#34d399`), **1,92** | `--plate-green`, **5,48** |
| `.answer-btn.wrong` | **mörkt** | `--error` (→`#f87171`), **2,77** | `--plate-red`, **4,83** |
| `.timer.warning` | **mörkt** | `--error`, **2,77** | `--plate-red`, **4,83** |
| `@keyframes blink-red` 50 % | båda | `#ff6b6b`, **2,78** | `#b91c1c`, **6,47** |
| `.badge.placeholder` | ljust | `--warning` på gul platta, **1,99** | `--warning-text`, **4,65** |
| `.btn-cancel:hover` | **mörkt** | hårdkodad `#dc2626`, **3,19** | `--error-border`, **5,45** |
| `.vt-mode button[aria-pressed]`, `.vt-flikar button[aria-pressed]` | **mörkt** | `--primary-deep`, **1,92** | `--plate-green`, **5,48** |
| `.vt-tool.is-trana .vt-mode button[aria-pressed]`, `.vt-svarsrad button` | **mörkt** | `--accent-dark` (→`#5eead4`), **1,48** | `--plate-teal`, **5,47** |

**Bara de sex första raderna syns i ljust läge.** Alla mörkt-läge-fixar har *identiskt*
ljust värde före och efter — `--plate-green` är `#047857`, precis vad `--primary-deep` är i
ljust läge. Vill man backa hela punkten räcker det att återställa de fyra `--plate-*`-raderna
och de elva reglerna; ingen struktur och ingen markup har rörts.

### Den verkliga orsaken satt i paletten, inte i de åtta ytorna

Mörkt läge ljusnar `--primary-deep`, `--primary-deepest`, `--accent-dark` och `--error`
eftersom de är **textfärger** där (`--primary-deep` står som färg på 64 ställen). Varje yta
som använde dem som **botten** under vit text gick därför sönder i mörkt läge, tyst. Elva av
de nitton bristerna var av det slaget, och ingen av dem stod i analysen.

Fyra nya variabler i `:root` — `--plate-green`, `--plate-green-deep`, `--plate-teal`,
`--plate-red` — bär plattor som **inte** växlar med temat. `--btn-primary-from/to` är nu alias
för de två gröna i stället för egna värden, och **mörkt lägets kopia av dem är borta**: en
kopia som alltid ska vara lika är en kopia som kan bli olika.

**Ett helt block CSS försvann på köpet.** `[data-theme="dark"]`-regeln som höll de åtta
gröna ytorna mörka i mörkt läge (0.9.259) behövs inte längre — de bygger nu gradienten av
plattor som är samma i båda teman. Ytorna ser därmed likadana ut i ljust och mörkt läge, och
regeln står på ett ställe i stället för två.

### Sajttiteln är mätt, redovisad och ORÖRD

`.header h1` fyller sin text med samma gradient (`background-clip: text`) och ligger på
**1,75:1** mot mintbakgrunden i ljust läge; kravet för stor text är 3:1. Den står i
`REDOVISADE` i skriptet med sin kvot, inte i en fixlista: att mörka ner sajtens namn ändrar
hela startsidans uttryck, och det är ett designbeslut för användaren — samma gräns som
`reviewedBy` (§6e) och `license` (punkt 14) drar. **Ändras kvoten fälls posten**, så den kan
inte tystna av sig själv.

### Skyddet — punkt 10 fick sitt på samma gång

[`scripts/check_kontrast.py`](check_kontrast.py) läser `css/*.css`, löser upp `var()` mot
båda paletterna och räknar WCAG-kvoten på varje regelblock som sätter både `color` och
`background`. Den mäter tre saker som annars hade fallit mellan stolarna:

- **genomskinliga bottnar** blandas mot den bakdel som står i `BAKGRUND` (handskrivet — vad
  som ligger bakom en yta går inte att läsa ur regeln, §0.3);
- **gradient som textfyllning** (`background-clip: text`) mäts som text mot det bakomvarande,
  via `TEXT_PLATTOR`. Utan det hade sajttiteln sluppit mätningen helt — den sätter aldrig
  `color`;
- **`background` inne i `@keyframes`**, via `KEYFRAME_PLATTOR`. Det var där `blink-red` gömde
  sig: halva blinket låg på 2,78:1, och det är sekunderna innan tiden tar slut.

En yta som varken går att mäta eller står i någon av listorna **stoppar bygget** (§0.4).
Kontrollen ligger i `check_generators.py`, bredvid `check_links.py` och `check_rubriker.py`.

**Punkt 10 hade ingen kontroll och har nu samma.** `--text-secondary` mäts mot varje yta den
står på; ändras den tillbaka till `#6b7280` fälls den mot mintbakgrunden igen.

**Skyddet är verifierat med planterade fel, inte genom att kontrollen sagt OK:**
originalbuggen återinsatt ordagrant, `--plate-green` överskriven i mörkt läge, ny chip med
genomskinlig botten utan post i `BAKGRUND`, ny `@keyframes` som animerar `background`, ny
gradient som textfyllning, ändrad kvot på den redovisade ytan, `REDOVISADE`-post vars yta
tagits bort, hela paletten regredierad och blinket tillbaka på `#ff6b6b` gav **alla** exitkod
1 med ett besked som säger vad som ska göras — och en orörd utcheckning ger exit 0.

### Efterskott i 0.9.281 – ett fall som mätningen själv missade

**"Topp"-länken i bokstavsrubriken (`.glossary-top`) låg på 4,43:1** och syntes inte i
0.9.280:s mätning. Den bär dämpad vit text (`rgba(255,255,255,0.85)`) men **ingen egen
bakgrund** — plattan kommer från `.glossary-letter`, en annan regel — och kontrollen krävde
båda i samma block. Före punkt 13 låg den på 2,19:1, så fixen lyfte den; men 4,43 är under
4,5. Nu `0.92` → **4,90:1**.

`ÄRVD_BOTTEN` i skriptet anger vilken ytas botten en dämpad textfärg vilar på, och **en
halvgenomskinlig textfärg utan egen bakgrund och utan post i listan stoppar bygget**. Sajtens
enda sådana fall, nu mätt. Verifierat med planterade fel: värdet tillbaka på 0,85, ny dämpad
textfärg utan botten, och en post som pekar på en regel utan bakgrund gav alla exit 1.
Kontrollen ligger på **133 mätpunkter**.

**Lärdomen är §0.2 igen:** feltypen hade fler ytformer än den som råkade beskrivas först. Fyra
former mäts nu utöver den vanliga — genomskinlig botten, ärvd botten, textfyllning och
animerad platta — och var och en av dem hittades genom att mäta, inte genom att läsa.

**Kostnad:** inget nytt element, ingen ny klass, ingen ny CSS-regel. **31 kodrader in, 41 ut**
— netto **−10 rader CSS-kod** (radantalet i filerna växer med 20, som alla är kommentarer).
Ingen HTML ändrades utöver cachebustern på `styles.css` och `verktyg.css`, alltså inget
sidinnehåll: **0 sidor omdaterade**, verifierat av `sidodatum.py --check` (§6d).

## 14. ✅ KLAR i 0.9.278 – `about` / `teaches` / `keywords` i schema

**Mätt efteråt:** **117 sidnoder över 117 sidor** bär nu alla tre egenskaperna — **312
`about`-noder, 288 lärandemål och 707 nyckelord, 0 avvikelser** mot registret, verifierat
genom att parsa all JSON-LD och jämföra post för post, inte genom att greppa. Före: `about`
på **8** noder, `teaches` och `keywords` på **0**. (Analysens "81 Article-noder" räknade
`LearningResource` i alla kombinationer; den verkliga populationen är 117 sidnoder, varav 64
`Article + LearningResource`.)

**`about` typas efter vad strukturen är:** 149 `Thing`, 39 `Muscle`, 27 `Bone`, 22
`AnatomicalStructure`, 21 `Joint`, 19 `Nerve`, 17 `AnatomicalSystem`, 12 `Artery`, 6 `Vein`.
Backloggens exempel gick igenom precis som det stod — `muskeltabell-overarmen.html` bär nu
`{"@type": "Muscle", "name": "Musculus biceps brachii"}`.

**Två nya skript:**

- [`scripts/amne.py`](amne.py) – registret. Vad en sida *handlar om* är omdöme och är
  handskrivet (§0.3). Tre tak är hårda: 8 ämnen, 5 lärandemål, 12 nyckelord.
- [`scripts/wire_amne.py`](wire_amne.py) – skriver in dem i sidans huvudnod via `jsonld.py`,
  precis som `wire_identity.py` och `wire_dates.py`. Idempotent, med `--check`. Ligger efter
  `wire_identity.py` i kedjan.

**Latinkolumnen dög inte som källa, och det var punktens verkliga designfråga.** Att härleda
`about` maskinellt ur tabellernas `<em lang="la">` hade varit frestande — punkt 9 garanterar
ju att varje latinkolumncell har ett `<em>` — men mätningen visade tre skäl att låta bli:
skelettsidornas kolumn **blandar ben och leder** (`Femur` bredvid `Articulatio genus`), de
fyra ledsidorna har **ingen latinkolumn alls** (ledens namn står i `<caption>`) och
`nervtabell-autonoma.html` är en jämförelsetabell. En maskin hade alltså typat 21 leder som
ben och lämnat fem sidor utan. Dessutom: tjugo latinska namn i en tabell gör inte alla tjugo
till sidans *ämne*.

**Kontrollen som gör fälten ärliga: varje `about`-namn och varje nyckelord måste stå i sidans
egen text** (`<title>`, description eller `<main>`). Samma riktning som SEO_REGLER §6 drar för
`FAQPage` och §6b för `citation` — strukturdatan rättas efter sidan, aldrig tvärtom. **Den
fällde fyra påståenden som legat i märkningen sedan sidorna skrevs:** `about`-värdena "Human
anatomi", "Myologi" och "Artrologi" på `index.html` och "Spaced repetition" på
`spellagen.html`. Inget av orden stod någonstans på sin sida. Vid första körningen fälldes 30
av 117 sidor; samtliga är omskrivna mot vad sidan faktiskt säger.

För `keywords` är kravet dessutom det enda som håller fältet ärligt: fältet är gratis att
fylla på och kostar ingenting att överdriva, och kravet gör keyword-stuffing *omöjlig* i
stället för förbjuden.

**`<meta name="keywords">` är en annan sak och står kvar på noll sidor.** Taggen togs bort i
0.9.56 på användarens begäran. Att den här punkten inför ett fält som *heter* keywords gör
misstaget lätt att göra, så `wire_amne.py` stoppar bygget om taggen dyker upp någonstans.

**`teaches` skrevs INTE på tre sidor, och det är ett beslut.** `info.html`,
`integritet.html` och `versionshistorik.html` undervisar inte om något; ett lärandemål där
hade varit samma slags falska påstående som `reviewedBy` utan granskare (§6e, punkt 8). De
står i `UTAN_LAR_UT` med skäl.

**`license` skrevs inte heller.** Analysen räknade det bland de saknade fälten, men `license`
är ett rättighetspåstående — vilken licens innehållet står under är användarens beslut, inte
en metadataförbättring. Att skriva en licens som ingen valt vore samma fel som `reviewedBy`.
Frågan är lämnad öppen, inte glömd.

**Ingen blockerare den här gången — för första gången i svepet.** Punkt 8, 9 och 11 daterade
alla om sidor och krävde en ny rad i `normalisera()`. Här rörs bara `<head>`, och JSON-LD
stryks redan av normaliseringen sedan 0.9.270. Mätt, inte antaget: 117 filer omskrivna, **0
sidor omdaterade**, verifierat genom att jämföra normaliserad HEAD mot normaliserad
arbetskopia sida för sida.

**Kostnad:** gzipat +115 byte på `index.html` (+0,6 %), +183 på en muskeltabell (+3,2 %),
+151 på `skelett-skallen.html` (+1,7 %), +123 på `ordlista-p.html` (+0,1 %).

**Skyddet är verifierat med planterade fel, inte genom att kontrollen sagt OK:** ny sida som
ingen klassat, spöke i registret, `about`-namn som inte står på sidan, nyckelord som inte står
på sidan, okänd `@type`, tomt `lär_ut` utan post i undantagslistan, lärandemål trots post i
den, sprängt tak, samma nyckelord två gånger, `<meta name="keywords">` tillbaka, sida utan
`<main>` och handredigerat `about` i en levererad sida gav alla exitkod 1 med ett besked som
säger vad som ska göras.

## 15. ✅ KLAR i 0.9.279 – Rubrikhopp i `integritet.html`

**Mätt efteråt:** **118 sidor har en h1 och en rubrikkedja utan hopp** – hela trädet utanför
`_arkiv/`, mätt av `scripts/check_rubriker.py`. Integritetspolicyns åtta avsnittsrubriker gick
från `<h3>` till `<h2>`; klassen `.info-subheading` rördes inte.

**Varför felet kunde ligga kvar:** rubrikstorleken styrs av klassen, inte av taggnamnet.
`.info-subheading` ger samma 0,98 rem på en h2 som på en h3, och klassens specificitet slår
elementregeln `h3 { font-size: 11pt }` i `@media print`. Sidan såg alltså exakt likadan ut före
och efter, på skärm och i utskrift. Det som ändrades var strukturen: en skärmläsare hörde
"rubrik nivå 3" direkt efter sidans titel, utan avsnittet den skulle tillhöra.

**Skyddet:** `scripts/check_rubriker.py` kräver exakt en `<h1>`, `<h1>` först och att ingen
rubrik ligger mer än en nivå under den föregående. Att stiga tillbaka (h4 → h2) tillåts – det är
vad som händer när ett avsnitt tar slut. Kommentarer, `<script>`, `<style>` och `<template>`
maskas bort först; `spellagen.html` har en kommentar som *nämner* en rubriktagg. Redirect-stumpar
känns igen på `<meta http-equiv="refresh">` och hoppas över, så `ordlista-tecken.html` inte
behöver stå i någon handskriven lista. Kontrollen körs av `check_generators.py`.

**Skyddet är verifierat med planterade fel, inte genom att kontrollen sagt OK:** originalbuggen
återinsatt ordagrant (h1 → h3), två `<h1>` på samma sida, borttagen `<h1>`, h2 → h4 mitt i en
artikel och en redirect-stump utan sin meta-tagg gav alla exitkod 1 med ett besked som säger vad
som ska göras – medan en rubrik i en kommentar och en i en `<template>` passerar.

**Sidoupptäckt, åtgärdad i samma pass:** policyn avslutades med "Den här sidan uppdaterades
senast 2026-06-23" handskrivet i brödtexten, två rader ovanför sidfotens `<time data-updated>`.
Så fort ändringen daterade om sidan hade de motsagt varandra. Meningen pekar nu på sidfotens
datum i stället för att upprepa det (§6d: ett datum per sida, från `data/sidodatum.json`).

**Kostnad:** gzipat +40 byte på `integritet.html` (+1,0 %). Ingen CSS, ingen ny klass, inget nytt
synligt element.

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
| 5 datum | ✅ `sidodatum.py --check` mot git + `wire_dates.py` | `check_generators.py` |
| 6 `citation` | ✅ `wire_citations.py` + `apa.py` kastar hellre än gissar | `check_generators.py` |
| 7 `DefinedTerm` | ✅ `generate_glossary.py` äger märkningen | `check_generators.py` |
| 8 sidfot | ✅ `wire_sidfot.py`, stoppar på oklassad ny sida | `check_generators.py` |
| 9 `lang="la"` | ✅ `wire_lang.py`, stoppar på omärkbar latinkolumn och okänt genus | `check_generators.py` |
| 10 kontrast | ✅ `check_kontrast.py` — WCAG-kvoten ur CSS:en, båda teman | `check_generators.py` |
| 11 syskonlänkar | ✅ `wire_relaterat.py`, stoppar på oklassad sida och sprängt tak | `check_generators.py` |
| 12 agentfilerna | ✅ `generate_llms.py`, stoppar på sida i sitemap som saknas i registret | `check_generators.py` |
| 14 ämne | ✅ `wire_amne.py`, stoppar på oklassad sida och på påstående som inte står på sidan | `check_generators.py` |
| 13 färgade ytor | ✅ `check_kontrast.py`, stoppar på omätbar yta och på animerad platta | `check_generators.py` |
| 15 rubrikkedja | ✅ `check_rubriker.py` — en h1, h1 först, inga hopp; 118 sidor | `check_generators.py` |

Punkt 5:s skydd är verifierat genom att fel planterats, inte genom att kontrollen sagt OK:
ändrat innehåll utan uppdaterat datum, raderad datumrad, handredigerat datum i facit, ny sida
utan JSON-LD-sidnod och sida utan `<main>` gav alla exitkod 1 med ett besked som säger vad som
ska göras.

**Punkt 10 fick sin kontroll i 0.9.280**, tillsammans med punkt 13. Den räknar kvoten ur
CSS:en i stället för att jämföra mot en lista med värden, och blir därför aldrig inaktuell när
paletten ändras. Fram till dess var de två de enda punkterna i svepet utan skydd.

**Regeln gällde hela svepet och höll hela vägen:** varje punkt levererade sitt skydd i samma
pass som åtgärden, aldrig som en efterhandsfråga. Punkt 11 visade varför
`check_links.py` aldrig räcker som skydd: den validerar att de länkar som *finns* pekar rätt,
aldrig att en sida som *borde* ha länkar har dem. Det skyddet gör `wire_relaterat.py` genom
att stoppa på en oklassad sida (§0.4). Samma sak gällde punkt 12: `check_links.py` validerar
att URL:erna i `llms.txt` finns, aldrig att sidorna finns i `llms.txt`, och 30 sidor saknades
ändå.

Punkt 9:s skydd är verifierat genom planterade fel, inte genom att kontrollen sagt OK:
latinkolumn utan `<em>`, svenska tecken inuti ett latinskt `<em>` och ett okänt ord efter
kommat i ett uppslagsord gav alla exitkod 1 med ett besked som säger vad som ska göras — och
`LANG_RX`-fixen mättes genom att stängas av, varpå 63 sidor stod på väg att dateras om.

---

## ✅ Avslutat: punkt 10 och 13 — de visuella ändringarna

**Punkterna låg vilande på användarens beslut 2026-07-25 och togs upp av användaren själv
2026-07-26**, vilket var villkoret som stod här. Båda är åtgärdade i 0.9.280, och skyddet
som avsnittet uttryckligen förbjöd att bygga oombett är byggt på beställning.

**Regeln bakom vilandeläget står kvar oförändrad:** det som ändrar sajtens utseende föreslås
inte, påminns inte om och byggs inte oombett. Användaren tar upp det på eget initiativ.
Sajttiteln `.header h1` är exemplet i det här passet — mätt på 1,75:1, redovisad i skriptet
och orörd, eftersom att mörka ner sajtens namn är ett designbeslut.

Textstorlekar är sedan tidigare uttryckligen fredade (se "Medvetet EJ åtgärdat" nedan).

---

## Medvetet EJ åtgärdat

- **Textstorlekar.** Sajten har `font-size` ner till 0,5 rem (8 px) i Leitner-lådorna på mobil.
  Uttryckligt besked 2026-07-25: **typsnittsstorlek rörs inte.**
- **`robots.txt`.** Är minimal (`User-agent: * / Allow: /`) men blanket-allow släpper in
  samtliga AI-crawlers redan. Ingen åtgärd behövs; en explicit bot-lista tillför inget.
- **`sitemap.xml` lastmod.** 116 sidor står på 2026-07-24 trots att filerna rörts senare.
  Det är **korrekt** – bara cachebustern ändrades, inte innehållet.
- **`ordlista-tecken.html`.** Saknar description, JSON-LD och `<h1>`. Avsiktlig
  redirect-stump (se 0.9.257). Ska förbli som den är. **Sidan är `index, follow`,
  inte `noindex`** — canonical är den signal som pekar om sidan, och att kombinera
  canonical med noindex ger motstridiga besked. Sätt aldrig tillbaka noindex; se
  kommentaren i filen. Att sidan saknar `<h1>` är därför också rätt, och
  `check_rubriker.py` hoppar över den på dess `<meta http-equiv="refresh">`.
