# Ordlistan — förbättringsplan och riskanalys (facit)

> **Status:** Analys och riskgenomgång gjord 2026-08-02. **Etapp 1 klar (0.9.333),
> skyddet i punkt 4 klart (0.9.334), etapp 2 klar (0.9.335).** Nästa steg enligt
> ordningen i punkt 5: etapp 4 (fältkomplettering).
> Filen skapades på uttrycklig begäran: *"analysera allt som kan gå sönder när
> du bygger om saker"* innan någon etapp påbörjas. Bocka av här när något görs,
> och skriv in vad som faktiskt hände — inte bara att det är klart.

---

## 1. Utgångsläget (mätt 2026-08-02, gissa inte om)

`data/ordlista.json`: **11 196 poster, 0 stubs.** Fas 2 i `ORDLISTA.md` är alltså
**helt klar** — men `ORDLISTA.md`:s statusavsnitt är stale och påstår
fortfarande att S/T/U/V m.fl. återstår. Faktiska antal per bokstav:

| Bokstav | Antal | Bokstav | Antal |
|---|---|---|---|
| S | 1 049 | X | 12 |
| T | 656 | Y | 6 |
| U | 125 | Z | 21 |
| V | 311 | Ö | 9 |
| W | 23 | Å | 18, Ä | 8 |

**Fälttäckning** (andel av 11 203 poster). Tabellen nedan är **omätt i etapp 1** — två
rader höll inte. Facit lever numera i [`ORDLISTA.md`](../ORDLISTA.md) med körbar mätsnutt;
den här tabellen står kvar bara för att visa vad som rättades.

| Fält | Täckning | Saknas | Rättat i etapp 1 |
|---|---|---|---|
| Ordklass-tagg | 99,0 % | — | 99,5 %, 54 saknar |
| Eng. | 86,6 % | 1 504 | ✔ stämde |
| Etymologi | 68,1 % | 3 574 | 68,9 %, 3 481 saknar |
| Böjning i parentes | 51,4 % | 5 448 | ❌ **fel — 24,0 %, 8 516 saknar.** Ursprungsmätningen räknade parenteser som `(A01.1-A01.4)` och `(5-HT)` som böjning |
| Sv. synonym | 24,0 % | — | ✔ stämde (2 686) |
| Vardag. | 7,0 % | — | ✔ stämde (782) |
| Uttal | **12 poster totalt** | — | ❌ **fel — 0 poster.** Alla tolv träffarna var ordet *uttalad*/*uttalade* i löptext, ingen enda uttalsangivelse |

**Tekniska fynd i `js/glossary.js`** (samtliga åtgärdade i etapp 2, 0.9.335):
- ~~Sökningen laddar hela `ordlista.json` (2,5 MB) vid fokus, innan första
  tangenttryckning — ingen lätt sökindex finns.~~ → två steg, se etapp 2.
- ~~`matchRank()` (rad 193–199) gör exakt/börjar-med/innehåller. Ingen
  diakritisk fold (sök "oga" hittar inte "öga")~~ → `foldForSearch()`.
  Stavfelstolerans finns fortfarande inte och är inte planerad.
- `renderResults()` filtrerar redan på både `term` **och** `def` — den
  def-sökningen är det som gör att man hittar c-formen (`Kolit`) när man
  söker k-formen (`Kolit`/`kolit`) eftersom c-posterna noterar "även
  k-form" i brödtexten. Ett framtida lätt index (bara term+href) får
  **inte** ersätta detta, bara komplettera det. **Kravet hölls:** indexet
  är steg 1, def-sökningen ligger kvar oförändrad i steg 2, och
  `test_ordlista_sok.js` prövar just fallet *kolit* → **colit**.

**Outnyttjad länkpotential:** 1 394 poster innehåller `Jfr …`, 358 `Se …`,
157 `Motsats: …` — allt ren text idag, inga klickbara länkar. Bokstavssidorna
länkar bara till andra bokstavssidor, aldrig till quiz eller kunskapsbank.

**Inga kvalitetsproblem hittade** i de sex misstänkta "eko-defs" (def som
bara upprepar uppslagsordet) — fem av sex är korrekt husformat
(`… Eng. <term>.`), bara `estesiometer` är en ren korsreferens och det är
avsett.

---

## 2. Beroendekarta / sprängradie (LÄS FÖRE något rörs)

**2 351 tooltips i andra dokument.** `data/kb_glossary_terms.json` hårdkodar
`href: "/ordlista-X.html#term-<slug>"` för varje av sina 2 351 nycklar.
`wire_terms.py` skriver in dem i `kunskapsbank/*.html`,
`kunskapsbank/artiklar/*.html` och `verktyg/**/*.html`. Ändras `slugify()`
eller `page_key()` i `generate_glossary.py`/`js/glossary.js` dör alla 2 351
tyst samtidigt.

**Verifierat 2026-08-02:** samtliga 2 351 facit-hrefar upplöses mot disk just
nu (fil finns + `id=` finns). **Men `check_links.py` validerade inte
`kb_glossary_terms.json` direkt** — den kontrollerade bara länkar som redan
stod i HTML. → Åtgärdat i punkt 4 (0.9.334).

**Rättelse av påståendet ovan, gjord när skyddet byggdes:** den här punkten sa
först att "en trasig facitnyckel skulle idag inte fångas av något som körs".
Det var för kategoriskt. `wire_terms.py` skriver in facits href **med fragment**
i HTML (`<a class="kb-term" href="/ordlista-a.html#term-anatomi" data-def="…">`),
så för en nyckel som faktiskt är wirad någonstans fångade den befintliga
HTML-ankarkontrollen felet ändå — och kördes inte kedjan om, fångade
rundtrippen det. Det verkliga hålet var mindre men skarpare: **91 av 2 351
nycklar (90 unika hrefar) står inte wirade i en enda HTML-fil** och var därmed
osynliga för allt som mätte. Det är dessutom de farligaste, eftersom ett dött
ankare bland dem upptäcks först den dag någon skriver ett dokument som råkar
använda ordet — och då wiras felet in färdigt.

**Generatorkedjans ordning är säkerhetskritisk** (`scripts/check_generators.py`,
`KEDJA`-listan): `generate_glossary.py` körs **två gånger** — tidigt (skriver
ren HTML) och igen efter `wire_relaterat.py` (äger `sitemap.xml`, måste se
färdiga sidor). Fem wire-steg körs **efter** den sista glossary-körningen:
`wire_lang`, `wire_identity`, `wire_amne`, `wire_sidfot`, `wire_dates` — de
ligger sist just för att inte skrivas över.

**`wire_lang.py` regexar exakt markup:**
`<dt class="glossary-term"(?: lang="la")? itemprop="name">(.*?)</dt>`.
Ändras `<dt>`-raden i `build_group_dl()` (generate_glossary.py, ~rad 375–408)
matchar regexen **tyst inte längre** och 1 105 `lang="la"`-märkningar
försvinner utan felmeddelande. `wire_lang` rör aldrig `<dd>` — ändringar i
själva definitionstexten är alltså säkra för språkmärkningen.

**41 `slug`- och 39 `sort`-överstyrningar** i `ordlista.json` är kollisionsskydd
(t.ex. `α₁-receptor` → `term-alfa-1-receptor`, `ärr` → `term-aerr`) eftersom
`slugify()` foldar å/ä→a, ö→o. Får aldrig tas bort eller genereras om
heuristiskt.

**Cachebustrar bor i generatorn**, inte i versionsfilen:
`GLOSSARY_CSS_V = "0.9.313"`, `GLOSSARY_JS_V = "0.9.189"`
(`scripts/generate_glossary.py`, rad ~89–90). Ändras `js/glossary.js` utan att
bumpa `GLOSSARY_JS_V` i samma pass får ingen användare den nya koden.

**`format_def()` måste vara byte-identisk** i `scripts/generate_glossary.py`
och `js/glossary.js` (styrdokumentets egen regel). Python-versionen körs vid
generering och har tillgång till hela termindexet om man vill. JS-versionen
är en ren strängfunktion utan index. Det spelar ingen roll för dagens
funktion (bara ordklasstaggen kursiveras), men blir ett öppet designbeslut
för etapp 3 — se punkt 6.

**Baslinje verifierad 2026-08-02:** `python3 scripts/check_generators.py` →
**exit 0**. 195 tester gröna, `sidodatum.json` 0 avvikelser, 2 351/2 351
tooltip-ankare hela. Det här är läget varje etapp ska kunna återställas till.

---

## 3. Skyddsregler (bindande för hela arbetet)

1. `slugify()`, `page_key()`, `page_slug()`, `sort_value()` rörs inte.
   De är ankarkontraktet mot 2 351 tooltips.
2. `python3 scripts/check_generators.py` körs **före och efter varje etapp**.
   Röd rundtripp = backa den etappen, inte "fixa vidare".
3. Diakritisk fold för **sökning** byggs som en egen, fristående funktion —
   aldrig genom att ändra `slugify()`.
4. En etapp per commit.
5. Ändras `js/glossary.js` → bumpa `GLOSSARY_JS_V` i samma pass. Ändras
   `css/glossary.css` → bumpa `GLOSSARY_CSS_V`.
6. Ändrat `term`-fält (inte `def`) i en post kan föräldralösa ett befintligt
   tooltip-ankare — kontrollera mot `kb_glossary_terms.json` innan en term
   döps om, slås ihop eller tas bort.

---

## 4. Verktyg att bygga FÖRST — skyddet som saknas ✅ KLAR (0.9.334)

- [x] Byggt
- [x] Larmet verifierat genom planterat fel
- [x] Inkopplat i `check_generators.py`

Byggt som **punkt 6 i `scripts/check_links.py`** i stället för som ett nytt
skript. Det skriptet står redan i `check_generators.py`:s kontrollista, så
inkopplingen följde med gratis — ett nytt skript hade krävt en rad till i en
lista, alltså ett nytt ställe att glömma. Kontrollen läser facit direkt ur
JSON och prövar fyra saker per nyckel: att `def` inte är tom, att `href` finns,
att den har formen `/ordlista-<grupp>.html#term-<ankare>` (`FACIT_HREF`), och
att fil + ankare upplöses mot disk. Formen prövas **före** ankaret — annars
hade en href utan fragment rapporterats som "filen finns" och sluppit igenom.

**Larmet verifierat mot sju planterade fel**, ett i taget, med facit återställd
efteråt: dött ankare, sida som inte finns, href utan fragment, href ut ur
ordlistan, tom def, href som saknas helt, och rätt ankare på fel bokstavssida.
Alla sju gav exit 1 med ett meddelande som pekar ut nyckeln vid namn.

**Inkopplingen bevisad, inte antagen.** Ett dött ankare planterades på
`algometer` — en av de 91 nycklar som inte står wirad i någon HTML, och som
därför inte kan ändra en enda sida. `check_generators.py` rapporterade
*"rundtripp identisk – 405 filer oförändrade efter 18 generatorsteg"* och
föll ändå med exit 1 på facitraden. Eftersom rundtrippen var grön kan ingenting
annat än den nya kontrollen ha fällt den.

Kontraktet `FACIT_HREF` är medvetet snävt: en tooltip ska leda till ett
uppslagsord i ordlistan, inte till en sidas topp och inte ut i kunskapsbanken.
Samtliga 2 351 följer det redan, så regeln kostar ingenting att hålla — men
skulle någon vilja peka en term någon annanstans stoppar bygget och tvingar
fram ett beslut i stället för att den nya formen tyst blir norm (§0.4).

---

## 5. Etapper (reviderad ordning efter riskanalysen)

Ursprunglig rekommendation var 1 → 3 → 2. Efter analysen: **1 ✅ → skyddet
(punkt 4) ✅ → 2 ✅ → 4 → 3 → 5.** Etapp 3 flyttades sist bland kodetapperna
eftersom den vilar på ett öppet designbeslut (punkt 6) som inte ska tas som
bieffekt av att bygget startar.

### Etapp 1 · Rätta `ORDLISTA.md` — risk: ingen ✅ KLAR (0.9.333)
- [x] Skriv om statusavsnittet: fas 2 avslutad, 11 203 poster, 0 stubs.
- [x] Lägg in fälttäckningstabellen från punkt 1 som facit för etapp 4.

**Vad som faktiskt hände:** dokumentet påstod inte bara att S–Ö återstod — det saknade
helt de tre commits som avslutade fas 2. Berikningsloggen slutade vid R (0.8.14) trots att
**S** blev klar i 0.8.15 (271 berikade, 9 stubbar borttagna), **T–Ö** i 0.8.18 (T 200,
U 58, V 99, W 5, X 6, Y 1, Z 2, Ö 5 + `5-ASA`/`5-FU`, 26 stubbar borttagna som redan
täckta — det passet tömde stub-listan) och **Å/Ä** i 0.8.26 (21 nya poster). Siffrorna
räknades fram ur `git show <commit>^:data/ordlista.json` mot commiten, inte gissade.

Täckningstabellen mättes om från grunden i stället för att kopieras — **två av sju rader
höll inte** (se punkt 1). Den ligger nu i `ORDLISTA.md` tillsammans med den körbara
mätsnutten som producerar exakt tabellens siffror, plus de två mätfällorna skrivna
som varningar så nästa mätning inte gör om felen.

Fyra stale siffror i husformatsavsnittet rättade i samma pass (11 196 → 11 203 poster,
`Eng. ` 9 678 → 9 699, `Vardag. ` 781 → 782, `Jfr ` 1 371 → 1 394, `Referensvärde` 71 → 78).
Nytt fynd inskrivet som känd formavvikelse: **36 poster skriver ordklasstaggen med versal**
(`Adj.`/`Subst.`/`Förk.`) och 54 saknar den helt. `check_generators.py` grön före och efter.

### Etapp 2 · Sök som håller på mobil — risk: låg ✅ KLAR (0.9.335)
- [x] Generera lätt sökindex (`data/ordlista-index.json`: term + page + slug)
      från `generate_glossary.py`. Bygger på befintlig `page_key`/`slugify`,
      ändrar dem inte.
- [x] Diakritisk fold i sökningen som egen funktion (se skyddsregel 3).
- [x] Behåll def-sökning som separat, andra steg (se fynd i punkt 1) —
      annars slutar c/k-sökningen fungera.
- [x] Bumpa `GLOSSARY_JS_V` (gjordes av `bump_version.py`, inte för hand).

**Vad som faktiskt hände.** Mätt före bygget: `def` står för **1 915 KB av 2 477 KB** i
`ordlista.json` — alltså 77 % av filen, och exakt den del som inte behövs för att *hitta*
ett ord. Indexet blev **189 KB (57 KB gzip)** mot ordlistans 2,42 MB (668 KB gzip); det som
måste komma fram före första träffen krympte alltså **12×**. `JSON.parse` 2 ms mot 17 ms.

**Formatet blev `{"grupper": {...}, "slugg": {...}}`, inte en platt lista.** Tre kandidater
mättes: platt `[term, page, slug]` gav 290 KB, grupperad med blandade typer 188 KB,
grupperad + separat slug-tabell 189 KB. Den sista valdes för 1 KB mer eftersom den inte
kräver att klienten typkontrollerar varje post. **Sidgruppen måste stå i filen** — den går
inte att räkna fram ur enbart termen, eftersom `is_prefix()`/`is_suffix()` läser
definitionen. Slug-tabellen bär bara de 41 överstyrningarna; övriga slugar räknar klienten
fram med sin spegling av `slugify()`.

**Hittat hål som täpptes på vägen:** slug-tabellen nycklas på termen, så två poster med
samma uppslagsord hade tyst tappat den enas ankare. Slug-unikhetskontrollen i `main()`
fångar det bara när båda saknar överstyrning — har en av dem en, går den igenom. Generatorn
stoppar nu uttryckligen på dubblerat uppslagsord. (Idag: 0 dubbletter av 11 203.)

**Steg 2 startar vid första tangenttrycket, inte vid fokus.** En tapp i sökrutan som inte
leder till en sökning ska inte kosta 2,4 MB. Faller indexet används hela ordlistan som
förut; faller ordlistan står steg 1-träffarna kvar och går att klicka på. Sökrutan slås av
först när **båda** faller — förut räckte det att den enda filen inte kom fram.

**Definitionstexten viks INTE.** Skulle den vikas blev "öga" i söktermen "oga" och slutade
matcha definitioner som skriver "öga" — en försämring av dagens beteende, i utbyte mot en
vikning av 1,9 MB per tangenttryck. Uppslagsordet viks, definitionen matchas rått.

**Skyddet:** `scripts/test_ordlista_sok.js`, 71 tester, kör riktiga `js/glossary.js` mot
riktig data med styrbar fetch och timer (annars går det inte att pröva vad som händer
*mellan* stegen). Plockas upp automatiskt av `check_generators.py` sedan 0.9.331. Tyngsta
testet jämför **de två stegens länkar för var och en av de 11 203 posterna** — de härleds på
var sitt sätt och en avvikelse hade gett en träff som leder rätt eller fel beroende på
nätets hastighet. Skalet mäter dessutom att `SLUG_MAP` (JS) och `_SLUG_MAP` (Python) är
identiska, vilket ingenting gjorde förut. Larmet verifierat mot **sju planterade fel**.

**Kvar, medvetet orört:** en bred sökning (t.ex. "a") ger 7 649 träffar och renderar lika
många rader i ett svep. Det gjorde den före den här etappen också — filtreringen kostar
1 ms, renderingen är hela kostnaden. Att kapa listan kräver ett synligt "visar N av M", och
det är en egen fråga.

### Etapp 4 · Fältkomplettering — risk: låg, men LÅNGT (§0.3, för hand) 🔄 PÅGÅR
Prioritetsordning (störst lucka, minst gissningsrisk först). Siffrorna är de
ommätta ur `ORDLISTA.md`, inte punkt 1:s felaktiga:
1. [ ] Böjning — **8 516 saknade vid start**, 7 924 kvar (A–K klara).
2. [ ] Etymologi — 3 481 saknar.
3. [ ] Eng. — 1 504 saknar (många prefix/suffix motiverat undantagna).

**Ett fält per bokstav och commit**, i den ordningen — inte alla tre fälten på
samma bokstav. A saknade böjning i 762 poster, etymologi i 396 och `Eng.` i 139;
allt i ett pass hade blivit en ogranskbar commit.

**"Saknas" är ett tak, inte en arbetslista.** Kriterierna för vilka poster som
faktiskt ska ha böjning står i [`ORDLISTA.md`](../ORDLISTA.md) tillsammans med
notationstabellen. Kort: försvenskade substantiv, svenska adjektiv och `-era`-verb
får böjning; latinska/grekiska lemman och fraser, prefix/suffix, förkortningar,
particip och `-um`-läkemedlen får det inte.

#### Böjningslogg per bokstav
- **A: klart** (0.9.336). 762 poster saknade böjning, 125 fick den: 99 substantiv,
  5 adjektiv, 15 verb och 6 omskrivningar. De återstående 637 är motiverade
  undantag — 346 latinska flerordstermer ur TA-importen, 106 förkortningar,
  46 prefix/suffix, 44 latinska adjektiv (`abdominalis`, `accessorius`) och
  ~20 `-um`-läkemedel som redan bär `(pl. antibiotika)`.

  **Tre fynd som blev regler i stället för engångsbeslut:**
  1. Husets notation var aldrig nedskriven, bara utövad. Den ligger nu i en
     tabell i `ORDLISTA.md`, med de kända avvikelserna namngivna (fem K-verb
     skriver `(-ar, -ade, -at)`; oförändrad plural förekommer som `-∅`, `-` och `=`).
  2. Första utkastet skrev dubbel ordklass som `(adj. -t, -a; subst. -en, pl. -er)`.
     Insättningsskriptets efterkontroll fällde det: parentesen börjar inte med
     bindestreck, så mätsnutten hade räknat posten som obojd i evighet. Formen
     blev `(-t, -a; -en, pl. -er)`, där taggordningen disambiguerar.
  3. `ORDLISTA.md`:s egen mall sa `(subst., -en, pl. -er)` — böjningen inuti
     taggparentesen. Ingen av de 2 687 poster som bar böjning gjorde så. Rättat.

  Sex poster med versal, kombinerad tagg skrevs om till husformat i samma pass
  (`adenoid`, `amyloid`, `analog`, `androgen`, `antitussiv`, `antiöstrogen`) — de
  renderades helt utan kursiv ordklass förut, eftersom `format_def()` kräver gement.
  `antitussiv` fick bara adjektivböjningen: substantivformen är `antitussivum`,
  inte `antitussiv`, så en substantivböjning där hade varit påhittad.
- **B: klart** (0.9.337). 231 poster saknade böjning, 47 fick den: 42 substantiv,
  2 adjektiv, 1 verb och 2 rättade formfel. Två fynd:
  - `blodsocker` bar `(-/-värdet)` — ingen böjning alls, utan en hopskrivning av
    *blodsocker/blodsockervärdet* som råkat hamna i böjningsparentesen. Rättat
    till `(-ret)`.
  - `baktericid` var B:s enda post med versal, kombinerad tagg (`Adj./subst., pl. -a:`).
    Den fick bara adjektivböjningen, av samma skäl som `antitussiv` i A-passet:
    substantivet heter *baktericid* i vissa källor och *baktericidum* i andra, och
    det är inte avgjort i posten.
- **C: klart** (0.9.338). 989 av 1 039 poster saknade böjning — högsta andelen i
  hela alfabetet (95 %), eftersom C är TA-anatomins bokstav: *calcaneus*, *cartilago*,
  *cortex*, *cranium*, *cavitas* och hundratals till står i latinsk uppslagsform.
  33 poster ändrade: 32 fick böjning, 1 fick bara sin tagg normaliserad.
  - `cancer`, `cysta` och `cytoplasma` **fick** böjning trots latinskt ursprung.
    Gränsen går inte vid etymologin utan vid om ordet är ett svenskt ord idag:
    *cancern*, *cystan/cystor*, *cytoplasman*. `Bakercysta` fick böjning i B-passet,
    så att lämna huvudordet `cysta` oböjt hade varit inkonsekvent.
  - `concomitans` är latinsk och ska **inte** böjas, men bar versal, kombinerad tagg
    (`Adj./subst., lat.:`) och renderades därför utan kursiv ordklass. Taggen
    normaliserad till gement, ingen böjning inskriven.

- **D: klart** (0.9.340). 331 av 432 poster saknade böjning vid start;
  **80 fick den** — 62 substantiv, 11 `-era`-verb, 6 adjektiv och `defekt`
  (dubbel ordklass). Störst enskild grupp: de 17 läkemedels-/ämnesnamnen
  (`Doxycyklin`, `Dexametason`, `dopamin` …), som alla tar `(-et)` efter mallen
  `Atropin`. Kvar står 250 av nu 431 D-poster, alla motiverade undantag:
  107 i TA-serierna (`ductus …`, `dorsum …`, `dens …`, `dorsalis …`),
  45 förkortningar, 39 övriga latinska/grekiska lemman (`dermis`, `diploe`,
  `dolor`), 31 flerordstermer inkl. växtnamnen och 28 prefix.
  - **`Dietyleter` fick `(-n)`, inte `(-et)`.** Läkemedelsregeln `(-et)` gäller
    ämnesnamnet, inte grundordet: *eter* är ett n-ord (*etern*). Regeln står nu
    utskriven i `ORDLISTA.md`, för den hade annars fällt nästa `-eter`-post.
  - **Svenska flerordstermer böjs inte** — `djup ventrombos`, `dilaterad ven`,
    `Downs syndrom`, `Duchennes muskeldystrofi`. Böjningen hör till huvudordet,
    men parentesen står efter taggen och skulle läsas som frasens egen. Ny
    punkt i `ORDLISTA.md`:s undantagslista; gällde 8 poster i D.
  - **`dysrrafi` fanns inte som ord** — dubbel-r uppstår bara efter vokal
    (*perineorrafi*), inte efter konsonant. Omdöpt till `dysrafi` efter kontroll
    av skyddsregel 6: noll träffar i `kb_glossary_terms.json`, ingen
    icke-genererad fil nämnde den, slugen `term-dysrafi` ledig.
  - **`daktyli` struken** — importrest som påstod sig vara ett förled. Efterledet
    står redan i `-dactyly / -daktyli` och förledet i `dactyl- / dactylo-`, båda
    byggda av `_build_suffixes.py`/`_build_prefixes.py`. Posten var dessutom den
    enda strecklösa termen i suffixgruppen, så `pick_example()` gjorde den till
    ändelsesidans skyltord ("t.ex. daktyli"). 11 203 → 11 202 poster.
  - Två poster med avvikande tagg rättade till husformat: `defekt`
    (`Adj./subst., pl. -a:`) och `dexter`, som saknade ordklasstagg helt och
    inledde med "Höger." — formen tagen från systerposten `sinister`.
    `D-vitamin` bar `(D-vitaminet)`; skrivet som `(-et)`.
  - **Sju textfel lästa i samma dumpar:** `snedddiametern` → *sneddiametern*,
    `muskelbuklar` → *muskelbukar*, `syncceller` → *synceller*, `densutskotet`
    → *densutskottet* (två poster, `dens` och `Axis (C2)`), `axiståten` →
    *axistappen* (filens egen `axis`-post säger "tappen"), `Sv. descenderade`
    → *descenderande* (jfr `ascendens`) och `Sv. darthinnmuskel` →
    *dartosmuskel* (jfr systerposten `dartos, musculus`). Två osvenska former
    strukna hellre än gissade om: `Sv. sädesledarens` (genitiv som synonym till
    ett adjektiv) och `Sv. denterad` — samma beslut som `Sv. kaudad` i A-passet.

- **E: klart** (0.9.341). 272 av 402 poster saknade böjning; **52 fick den** —
  26 substantiv, 12 `-era`-verb, 6 adjektiv, 7 läkemedelsnamn och `eosinofil`
  (dubbel ordklass). Kvar står 220: 72 flerordstermer, 58 latinska/grekiska
  ettordslemman (`epidermis`, `epiglottis`, `esofagus`), 55 förkortningar —
  E är förkortningarnas bokstav näst efter C — och 32 prefix.
  - **`embryo` fick `(-t, pl. -n)`** — formen fanns redan i filen (`trauma`,
    `hydrocele`, `huvudtrauma`) men saknades i notationstabellen. Inskriven nu.
  - **Rörelsetermerna var halvgjorda.** `abduktion`, `adduktion` och `depression`
    bar `(-en, pl. -er)`, medan `elevation`, `eversion` och `extension` stod
    oböjda i samma familj. De tre i E rättade; `flexion` och `inversion` ligger
    kvar under F och I.
  - Tre poster utan husets ordklasstagg rättade: `eosinofil` skrev
    `Adj./subst., pl. -a:`, `evidensgrad` saknade tagg och bar en lös
    `(beteckning)` mitt i texten, och `ex juvantibus` fick formen från
    `emollitio cerebri` (`lat. uttryck för …`). `eosinofil`:s glosa inleddes
    dessutom med uppslagsordet ("Eosinofil granulocyt") — omskriven efter
    `neutrofil`, som beskriver infärgningen först.
  - **Ett sakfel:** `ejaculatorius` sade att *ductus ejaculatorius* är
    "sädessträngens utföringsgång". Sädessträngen är *funiculus spermaticus*,
    och filens egen `ductus ejaculatorius`-post säger "utsprutningsgången".
    Rättat dit.
  - **Sju textfel:** `slungaa` → *slunga* (två poster), `eminetia` → *eminentia*,
    `struploket` → *struplocket* (sju andra poster stavar rätt), `e.g.` → *t.ex.*
    (filens enda anglicism av det slaget), `maculary pucker` → *macular pucker*
    och `european Medicines Agency` → versal *European*. Grepet efter
    sädessträngen visade dessutom att tre poster utanför E stavade den
    `sädesträngen` med ett s (`cremaster`, `funiculus`, `spermaticus`) mot 14
    poster med två — rättade, liksom `tunnt rep` → *tunt rep* i `funiculus`.

- **F: klart** (0.9.343). 533 av 633 poster saknade böjning; **53 fick den** —
  39 substantiv, 2 `-era`-verb, 1 adjektiv (`fusiform`) och 11 läkemedels-/
  ämnesnamn. Täckning 27,0 % → 27,5 %. Kvar står 482, varav 245 i fem latinska
  serier (`facies` 69, `fascia` 57, `fossa` 56, `foramen`/`foramina` 47,
  `fissura` 16), 34 förkortningar och 13 prefix. `flexion` var den ena av de två
  rörelsetermer E-passet lämnade; bara `inversion` (I) återstår.
  - **Två böjningar var felskrivna och gav ord som inte finns.** `flimmer` bar
    `(-et)` → *flimmeret*, `foster` bar `(-et, pl. -∅)` → *fosteret*. Rätt form
    är `(-ret)`: obetonat `-er`/`-el` tappar vokalen i bestämd form. Systerposten
    `förmaksflimmer` skrev redan `(-ret)`, så felet gick att se inne i filen.
    **Ett svep över hela filen** efter samma mönster gav en tredje träff utanför
    F — `koagel` → *koagelet*, rättad till `(-let, pl. koagler)`. Sex övriga
    träffar (`allel`, `D-dimer`, `endotel`, `epitel`, `flimmerepitel`,
    `kardinalfel`) är korrekta: betonad slutstavelse, ingen synkope. Regeln står
    nu i `ORDLISTA.md` — ändelsen ensam avgör inte, formen måste prövas.
  - **Två böjningar togs bort.** `fast vårdkontakt` är en svensk flerordsterm
    (D-passets regel): `(-en)` läses som frasens egen och ger *fast
    vårdkontakten*. `fransosen` står redan i bestämd form som uppslagsord;
    `(-en)` gav *fransosenen*. Ny punkt i `ORDLISTA.md` för det senare.
  - **`fasettled` sammanslagen med `facettled`** (stavningsdubblett, samma
    betydelse). C-formen behölls efter kontroll av skyddsregel 6:
    `kb_glossary_terms.json` pekar på `#term-facettled` i tre nycklar
    (`facettled`, `facettleder`, `facettlederna`), grundordet `facett`
    korshänvisar till den, och **ingenting** pekade på s-formens ankare.
    S-stavningen bevarad som "Även fasettled." (efter `Eng.`, husets placering:
    64 poster mot 9). 11 202 → 11 201 poster.
  - **Två sakfel:** `falciformis` kallade *ligamentum falciforme hepatis* för
    "leversenan" — det är ett bukhinneveck, och filens egen post
    `falciforme, ligamentum` säger "skärformiga leverbandet". `forceps` sade
    "forceps minor/major = talade fibrer i corpus callosum"; omskrivet till
    *corpus callosums framåt- respektive bakåtböjda fiberbuntar*.
  - **Nio textfel:** `break i ett ben` → *kontinuitetsbrott* (engelskt ord kvar
    i svensk text, `fractura`), `food and Drug Administration` → versal *Food*
    (`FDA`, samma feltyp som *european Medicines Agency* i E), `framre` →
    *främre* (`frontalplan`; systerposten `frontalis` stavar rätt),
    `massetorfascia` → *masseterfascia*, `kollagenfibrerbuntar` →
    *kollagenfiberbuntar*, `= liten rep` → *litet rep* (`funiculus`, neutrum),
    `Eng. frenulum, frenulum.` (ordet två gånger) samt versal mitt i
    definitionen i `fagocytos` och `fluor`.
    - Ett svep efter husets språkförkortning visade att **sex poster skrev
      `Av fra.`** mot 44 med `Av fr.` — `facett`, `mandräng`, `manschett`,
      `petit mal`, `plack`, `reservoar`. Normaliserade.
  - **Öppet fynd, medvetet inte åtgärdat i F-passet:** 17 flerordstermer i filen
    bär böjning trots D-passets regel (`beprövad erfarenhet`, `palliativ vård`,
    `relativ risk`, `metabolt syndrom`, `Raynauds fenomen` …). Bara F:s egen
    (`fast vårdkontakt`) togs här; övriga 16 ligger i bokstäver som ännu inte
    böjts och fångas när de står på tur. **Kontrollera dem i respektive pass.**
  - Fyra poster lämnades oböjda för att formen inte är avgjord: `fokus`,
    `fatigue`, `fluor` (två sinnen, olika genus) och `forceps`. `flegmone`
    bär sedan tidigare `(-t, pl. -r)` — neutrumformen är osäker (utrum
    förekommer i svensk medicinsk text) och rördes inte utan belägg.

- **G: klart** (0.9.344). 188 av 267 poster saknade böjning; **23 fick den** —
  18 substantiv, 1 `-era`-verb och 4 läkemedelsnamn. Täckning 27,5 % → 27,7 %.
  Kvar står 165: 66 latinska flerordstermer, 45 latinska/grekiska ettordslemman
  (`gaster`, `glandula`, `gyrus`, `glottis`), 26 förkortningar, 25 prefix och
  3 egennamn.
  - **Tre uppslagsord rättade**, samtliga kontrollerade mot skyddsregel 6
    (noll facitträffar, ingen icke-genererad fil, ledig slug): `glutos` →
    `gloutos` (formen finns inte; postens **egen etymologi** sade
    `Av grek. gloutos`), `gerd` → `GERD` (förkortningar skrivs med versaler, och
    systerposten `GORD` hänvisade redan till "GERD") och `guglielmi` →
    `Guglielmi`. Bara `gloutos` bytte slug; de två andra foldar likadant.
  - `Guglielmi`-glosan fick husets egennamnsform från `Golgi`/`Galeazzi`:
    språkmarkören `(it.)` + fullt namn, **Guido Guglielmi**. Årtalen utelämnade
    i stället för gissade. `GDC` skrev hans namn gement i sin expansion — versal.
  - **`glykosuri` sammanslagen med `glukosuri`.** `glukosuri` bar redan husets
    markör "Även glykosuri." medan `glykosuri` stod kvar som egen post — en
    halvgjord hopslagning. Innehållet från s-formen ("klassiskt tecken på
    diabetes", `Jfr Diabetes, Sockersjuka`) fördes över. 11 201 → 11 200 poster.
  - **Två sakfel:** `glenoidalis` glossades "glänsande som ögongloben" —
    adjektivet betyder *som hör till ledpannan*, vilket postens egen etymologi
    (`glene` = ledpanna) redan sade. `granulosus` skrev `layer granulosum`
    (engelska); hudlagret heter *stratum granulosum*.
  - **Ett tyskt ord utanför G, hittat av ett grep.** Kontrollen av
    `karos`-etymologin visade att `carotis` skrev "tryck mot artären ger
    **bewusstlosighet**" — samma feltyp som de tre tyska orden i C-passet.
    Rättat. Samma grep: `bifurcatio carotidis` och `glomus caroticum` lämnade
    `grek. karos` oglossat medan familjens fem övriga skriver `= djup sömn`.
  - **Fyra språkfel:** `en liten kemoreceptororgan` → *ett litet*
    (`glomus caroticum`), `medial lårmuskeln` → *den mediala lårmuskeln*
    (`gracilis`), `körtelns rundan form` → *runda* (`glandula`) och
    `Sv. glossofaryngealt.` → *glossofaryngeal* — Sv.-formen av ett adjektiv
    skrivs i grundform (jfr `gluteus` "Sv. gluteal."). `gc` inledde med
    `förk. förkortning för …`; taggen säger redan förk.
  - **Ett misstänkt fel som visade sig vara husets form.** `Sv. `-fältet
    upprepar uppslagsordet i **253 poster** (`anulus` → "Sv. anulus, ring",
    `apex` → "Sv. spets, apex"). Det är avsiktligt för latinska uppslagsord:
    fältet säger att latinformen används på svenska *och* ger det inhemska
    ordet. **Rör dem inte** — mät före du rättar.

- **H: klart** (0.9.345). 279 av 444 poster saknade böjning; **65 fick den** —
  51 substantiv, 3 `-era`-verb och 11 läkemedels-/ämnesnamn. Täckning
  27,7 % → 28,3 %. Kvar står 214: 78 flerordstermer, **66 förkortningar**
  (H är förkortningarnas bokstav), 40 latinska/grekiska ettordslemman
  (`hallux`, `humerus`, `hiatus`, `hypophysis`), 29 prefix och 1 egennamn.
  - **Synkoperegeln från F-passet betalade sig direkt.** `Hjälpmedel` böjs
    *hjälpmedlet* och fick `(-let, pl. -∅)` från början i stället för det
    felaktiga `(-et)`. `hjärnstam` fick `(-men)` (*hjärnstammen*) efter
    `audiogram` `(-met)` — dubbelteckning vid ändelse, samma princip.
  - **En felskriven böjning:** `hypoxi` bar bara `(pl. -er)` — en
    adjektivnotation på ett substantiv, så den definita formen fattades.
    Rättad till `(-n, pl. -er)` som systerposterna `hypoxemi`/`hyperoxi`.
  - **Tre uppslagsord fick versal**, alla med oförändrad slug och kontrollerade
    mot skyddsregel 6: `heimlichs manöver` → `Heimlichs manöver`,
    `helicobacter pylori` → `Helicobacter pylori` (släktnamn; postens egen
    `Eng.`-rad skrev det redan med versal) och `herxheimer` → `Herxheimer`.
    Den sista saknade husets egennamnsform helt — skriven efter `Golgi`/
    `Guglielmi` med `(ty.)` + **Karl Herxheimer**, årtalen utelämnade.
  - **Fem textfel:** `kroppskonstituion` → *kroppskonstitution* (`habitus`),
    `krokhansen` → *krokbenet* (`hamatus`; systerposten `hamatum, os` har rätt),
    `haustrae coli` → *haustra coli* (latinsk plural av *haustrum*),
    `en liten märke` → *ett litet* (`hilus`) och `ledförbinding` →
    *ledförbindning* (`hyoideus`). `HDL-kolesterol` inledde med versal.
  - **Tre dubbletter hittade; sammanslagna i 0.9.346 — se posten nedan:**
    1. **`hypotenar` / `hypothenar`.** Båda står i `kb_glossary_terms.json`
       med **var sin href**, och båda ankarna används skarpt: `case.html` →
       `#term-hypothenar`; `kunskapsbank/muskeltabell-handen.html` (×2) och
       `nervtabell-armen.html` → `#term-hypotenar`. En hopslagning kräver att
       facit skrivs om **och** att tre sidor wiras om. Båda fick böjning.
    2. **`hypotalamus` / `hypothalamus`.** Inga facitberoenden, men valet är
       inte givet: filen håller `thalamus` i th-form och **den är wirad**,
       medan svensk medicinsk standard skriver *hypotalamus*. Ingendera böjdes
       — `thalamus`, `hippocampus` och `hypophysis` står också oböjda.
    3. **`hemorrojd` / `hemorrojder`** — singular- respektive pluralpost för
       samma sak. Jfr N-passets `Neutrofila granulocyter` → `Neutrofil granulocyt`.

- **Sidopass: H-passets tre dubbletter** (0.9.346). Sammanslagna efter användarens
  beslut: **den korrekta svenska formen vinner** — grekiskans `th` skrivs `t`
  (filens egen linje sedan P- och N-passen) och uppslagsordet står i **singular**.
  Kvar: `hypotenar`, `hypotalamus`, `hemorrojd`. Borta: `hypothenar`,
  `hypothalamus`, `hemorrojder`, med innehållet överfört och th-formen bevarad
  som "Även …" efter `Eng.` (fortsatt sökbar via def-sökningen).
  11 200 → 11 197 poster.
  - **`hypothenar` bar en egen wirad href — den kunde inte bara tas bort.**
    Nyckeln stod i `kb_glossary_terms.json` med `#term-hypothenar` och användes i
    `case.html`. Facitnyckeln pekades om till `#term-hypotenar` och sidan skrevs
    om med `wire_terms.py --repoint hypothenar hypotenar --all`.
  - **`check_generators.py` fällde första försöket** — och gjorde precis sitt jobb.
    `wire_terms.py` är idempotent och rör **aldrig** en redan wirad länk, så hela
    kedjan kunde köras utan att `case.html` ändrades; larmet löd "ankaret
    #term-hypothenar finns inte i ordlista-h.html". **`--repoint` är det enda
    steget som byter href på en befintlig länk; `--sync-defs` lämnar href orörd
    med flit.** Rutinen står nu i `ORDLISTA.md` under "th → t".
  - `check_links.py` punkt 6 prövar att facits `def` finns och att href löser ut —
    **inte** att def-texten matchar ordlistan. Den synken görs för hand; båda
    hypotenar-nycklarnas tooltiptext skrevs om i samma pass.
  - Innehållsrättelser på köpet: `hypotalamus`-glosan inledde med sitt eget
    uppslagsord (förbjudet i `ORDLISTA.md`) och skrev "den lilla men centrala
    **del** av mellanhjärnan" → *delen*. `hypotenar` skrev `muskelvallen` medan
    `thenar`/`hypothenar` skriver *valk* — familjen följs nu.
  - ~~Öppet: `thenar`/`thalamus` i th-form~~ → **avslutat i 0.9.347**, se nedan.

- **I: klart** (0.9.348). 353 av 490 poster saknade böjning; **50 fick den** —
  19 substantiv, 5 adjektiv, 17 `-era`-verb, 9 läkemedelsnamn. 28,3 % → 28,8 %.
  De 303 kvarvarande: 173 flerords-/latinska fraser (`incisura`-, `impressio`-,
  `junctura`-familjerna), 57 förkortningar, 51 latinska lemman, 22 prefix.
  - **Filen svarar själv på genusfrågor — leta i sammansättningarna.**
    `ocklusionsikterus` och `adherensileus` bar redan `(-en)`, alltså fick
    `ikterus` och `ileus` det. `impetigo`/`intertrigo` följde `libido`/`polio`.
  - `Ipratropiumbromid` fick `(-en)` (n-ordsundantaget: *bromid*, jfr `klorid`).
    `intrinsisk` fick `(pl. -a)` — filens `-isk`-adjektiv gör det undantagslöst.
  - **Två felskrivna böjningar:** `interkostalnerv` bar bara `(pl. -er)` utan
    definit form (samma feltyp som `hypoxi` i H), `irreponibel` saknade `-t`.
  - **Ett felstavat uppslagsord:** `ileosakralled` → `iliosakralled` (`ileo-` är
    krumtarmen, `ilio-` tarmbenet; postens egen `Sv.`-rad sade redan rätt).
    Skyddsregel 6 prövad först — ingen facitnyckel, ingen href att peka om.

- **J: klart** (0.9.349). Filens minsta bokstav: 51 poster, **5 fick böjning**.
  44 motiverade undantag (31 flerords-/latinska fraser ur `junctura`- och
  `jugularis`-familjerna, 6 latinska lemman, 5 förkortningar, 2 prefix).
  - **Två poster bar böjning men var osynliga för mätningen.** `jonisera` skrev
    `(joniserar, joniserade, joniserat)` och `juvenil` `(juvenilt, juvenila)` —
    utskrivna former, och en parentes utan inledande bindestreck räknas som obojd.
    Normaliserade. Leta efter fler av den här sorten i varje bokstav.
  - `jonisering` fick `(-en)`: filens `-ering`-processord tar aldrig plural.

- **K: klart** (0.9.350). 112 av 288 poster saknade böjning; **45 fick den** —
  33 substantiv, 12 läkemedelsnamn. 28,8 % → 29,2 %. 67 kvar (33 flerordstermer,
  14 ettordslemman, 11 förkortningar, 9 prefix).
  - **`koma` fick `(-t)` för att filen redan skrivit *komat* tre gånger** och
    *i koma* två — aldrig *koman*. Sök i löptexten innan du gissar genus.
  - `Kaliumbromid`, `Kaliumjodid` och `Kloroform` fick `(-en)`. **`Kalomel` och
    `Karbidopa` lämnades obojda** — genus går inte att fastställa utan att gissa,
    och `Levodopa` står obojd av samma skäl. Hellre en lucka än ett påhitt.
  - **Fyra rättelser:** `kolesteatom` bar `(-en, pl. -er)` fast `-om`-ord är
    neutrum (`kondylom`, `kolangiom` skriver `(-et, pl. -∅)`); `kvalitetsregister`
    bar den oskrivna platshållaren `(-/-ret, pl. ...)`; `komatös` och `kompatibel`
    skrev ut formerna; `klimakteriebesvär` skrev `(pluralis)`, unikt i filen.
  - `koebners fenomen` → `Koebners fenomen`, slug oförändrad.

- **Sidopass: böjningsparentesernas notation, hela filen** (0.9.351). **328 poster**
  normaliserade, och skyddet levererat i samma commit.
  - **325 skrev plural utan `pl.`** (`makrofag (-en, -er)`) och **3 substantiv bar
    bara plural** (`mekanoreceptor (pl. -er)`, `termoreceptor`, `proprioceptor`).
  - **Båda formerna räknas som *bojda* av mätsnutten** och var därför osynliga för
    bokstavspassen, som bara läser det mätningen pekar ut. De hade legat kvar för
    alltid. 143 av dem låg i P, 57 i R, 51 i O, 35 i N, 33 i M — alltså i bokstäver
    som ännu inte gåtts igenom.
  - **`generate_glossary.py` hård-felar nu på båda**, som den gör på en otaggad
    post. Larmet verifierat mot två planterade fel OCH mot att de korrekta
    undantagen går igenom: adjektivens `(pl. -a)` och `-um`-läkemedlens
    `(pl. antibiotika)` saknar bestämd form med rätta, så kontrollen kräver
    bindestreck + svensk pluraländelse. Regeln inskriven i `ORDLISTA.md`.

- **Sidopass: th → t i hela filen** (0.9.347). Sex uppslagsord bytte stavning med
  th-formen bevarad som "Även …": `thalamus`→`talamus`, `thenar`→`tenar`,
  `epithalamus`→`epitalamus`, `metathalamus`→`metatalamus`,
  `subthalamus`→`subtalamus`, `spontanpneumothorax`→`spontanpneumotorax`.
  Dubbletten `pneumothorax` slogs ihop med `pneumotorax` (som redan bar
  markören). 11 197 → 11 196 poster.
  - **Gränsen går vid om ordet är SVENSKT, inte vid bokstavskombinationen.**
    246 poster har `th` i uppslagsordet; de allra flesta är korrekt latin och
    rördes inte — TA-termer, latinska lemman (`thorax`, `thymus`, `theca`,
    `urethra`, `isthmus`), vetenskapliga växtnamn och de grekiska
    kombinationsformerna, vars prefix-/suffixposter redan visar båda formerna.
    `thoraxkirurgi`/`Thoraxdrän` behölls: th är specialitetens officiella namn.
  - **Fem `Sv.`-fält gav th-formen där filen själv skriver t** — `thymus`
    ("Ex: tymus" i egen prefixpost), `isthmus` (filen skriver *aortaistmus*,
    *sköldkörtelistmus*), `urethra` ("Ex: uretrit") och `thoracalis` (mot
    systerposten `thoracicus` "Sv. torakal"). `thorax` fick "Även torax."
    `thorakal` i löptext (5 träffar mot 2 för t-formen) normaliserat.
  - **Fyra facitnycklar pekades om → 24 länkar skrevs om i fem sidor**
    (`sa-leds-kanseln.html` 12, `nervtabell-sensorbanor.html` 7,
    `grekiska-i-medicinen.html` 2, `case.html` 2, `sa-styrs-en-rorelse.html` 1)
    med `wire_terms.py --repoint`. **Kedjan gör INTE detta åt en.**

- **Sidopass: ordklasstaggen, hela filen** (0.9.342). 78 poster inledde inte med
  husets gement skrivna tagg — 50 saknade den helt, 28 skrev den med versal
  (`Adj./subst.:`, `Egennamn:`, `Förled:`, `Förk.:`). De 28 renderades utan
  kursiv ordklass. Nu är täckningen **100 %** av 11 202 poster.
  - **Skyddet sitter i `generate_glossary.py`** och hård-felar på en post utan
    gement skriven tagg, som den redan gjorde på slug-kollisioner. Verifierat
    mot tre planterade fel. Nya poster kan alltså inte längre smyga in otaggade.
  - **Böjning bara där formen är säker** — 11 poster. `fungicid` fick bara den
    substantivböjning posten redan bar; adjektivformen av ett `-id`-ord är inte
    given (samma skäl som `baktericid`). `gestagen` fick formen från `androgen`.
    `postinfarkt` och `sederande` fick ingen: ingen substantivform finns, och
    presens particip böjs inte.
  - Tre uppslagsord rättade: `klinisk signifikant` → `kliniskt signifikant`,
    `ia`/`ib` → `Ia`/`Ib`. Kontrollerade mot skyddsregel 6.
  - `Schobers test` och `Severs sjukdom` inledde glosan med sitt eget
    uppslagsord. Omskrivna. Tre språkfel därtill: satsradning, hängande `av`
    och en etymologi utan språkangivelse.
  - **Mätsnuttens tagglista undermätte** — den saknade `prep|pron|räkn|interj|konj`,
    som `format_def()` ändå kursiverar. `inklusive` räknades som otaggad. Rättad.

- **Sidopass: ordklasstaggar och textfel** (0.9.339). C-passet avslöjade tre
  latinska adjektiv taggade `subst.` Fyndet svepte jag över **hela filen**, inte
  bara C: **tio** poster bar fel tagg — `cavus`, `communis`, `convexus`, `durus`,
  `jejunus`, `opponens`, `proprius`, `splenius`, `teres`, `triquetrus`. Samma
  feltyp som `sopor`/`submukosa`/`stridor` (0.9.238). Det omvända svepet
  (`adj.`-taggade substantiv) gav en enda träff, `incisivus`, som `ORDLISTA.md`
  redan slår fast är korrekt taggad — alltså inget fel.

  Åtta textfel lästa i samma dumpar: tyska ord i svensk text (`hohlfot` →
  *hålfot*, `eigen` → *egen*, `schulderleden` → *skulderleden*), kongruens
  (`jejunum är ofta tom` → *tomt*), skrivfel (`hudd-` → *hud-*), ett obegripligt
  ord (`den bromskkörningsformation` → *den kölformade list*), ett sakfel
  (`corpus coracoideum` finns inte — strukturen heter *processus coracoideus*),
  och en osvensk form som ströks hellre än gissades om (`Sv. kaudad`).

  Uppslagsordet **`cremster` fanns inte som ord** — muskeln heter *cremaster*.
  Omdöpt efter kontroll av skyddsregel 6: nyckeln stod inte i
  `kb_glossary_terms.json`, ingen icke-genererad fil nämnde den, och slugen
  `term-cremaster` var ledig (TA-posten heter `cremaster, musculus`).

### Etapp 3 · Jfr/Se/Motsats-länkning — risk: hög, kräver beslut (se punkt 6)
- [ ] Designbeslut taget (väg a eller b, punkt 6).
- [ ] Byggt enligt beslutet.
- [ ] `check_generators.py` grönt.

### Etapp 5 · Uttal — risk: låg, differentierande
Utgångsläget är **noll** uttalsangivelser i hela filen (rättat i etapp 1 — de "12 poster"
punkt 1 rapporterade var alla ordet *uttalad* i löptext). Fältet byggs alltså från grunden.
- [ ] Pilot på latinska/grekiska anatomitermer (regelbunden, belagbar betoning).
- [ ] Utvärdera innan bredare utrullning.

---

## 6. Öppet designbeslut inför etapp 3

Kravet på att `format_def()`/`formatDef()` ska vara byte-identiska håller inte
rakt av för Jfr/Se-länkning: Python-generatorn **kan** ha tillgång till ett
fullt termindex vid byggtid (slå upp `Jfr kolit` → rätt href), men
`formatDef()` i JS är en ren strängfunktion utan index och kan inte göra
samma uppslag dynamiskt.

**Två vägar:**
- **(a)** Ge båda funktionerna ett index-argument, håll transformationslogiken
  identisk, bara datakällan skiljer.
- **(b)** Låt Python-generatorn skriva färdiga `<a>`-taggar direkt i den
  statiska `<dd>`-HTML:en (crawlbar, fungerar utan JS). Låt JS:s sökträffar
  (`renderResults()`, en redan separat renderingsväg) visa Jfr/Se som
  oformaterad text i sökresultat-vyn — ingen länk där, bara i den statiska
  sidan.

Väg (b) bedöms enklare och mindre riskabel eftersom sökträffar redan renderas
annorlunda än den statiska sidan (`itemprop`-microdata finns t.ex. inte i
sökträffar heller, se kommentar i `build_group_dl()`). **Ska beslutas
uttryckligen innan etapp 3 påbörjas.**

---

## Relaterat

- [`ORDLISTA.md`](../ORDLISTA.md) — styrdokument, husformat, arbetsflöde per bokstav.
- [`CLAUDE_REGLER.md`](../CLAUDE_REGLER.md) — §0.3 (handarbete när maskinellt är osäkert).
- `scripts/check_generators.py` — rundtrippstestet, körs före/efter varje etapp.
- `data/kb_glossary_terms.json` — facit för tooltips, 2 351 nycklar. Bevakas av
  `check_links.py` punkt 6 sedan 0.9.334 (se punkt 4).
- `data/ordlista-index.json` — lätt sökindex, genererat i etapp 2. Redigeras aldrig
  för hand; `scripts/test_ordlista_sok.js` prövar det mot ordlistan.
