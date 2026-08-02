# Ordlistan — förbättringsplan och riskanalys (facit)

> **Status:** Analys och riskgenomgång gjord 2026-08-02. **Etapp 1 klar (0.9.333).**
> Nästa steg enligt ordningen i punkt 5: skyddet i punkt 4, före etapp 2.
> Filen skapades på uttrycklig begäran: *"analysera allt som kan gå sönder när
> du bygger om saker"* innan någon etapp påbörjas. Bocka av här när något görs,
> och skriv in vad som faktiskt hände — inte bara att det är klart.

---

## 1. Utgångsläget (mätt 2026-08-02, gissa inte om)

`data/ordlista.json`: **11 203 poster, 0 stubs.** Fas 2 i `ORDLISTA.md` är alltså
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

**Tekniska fynd i `js/glossary.js`:**
- Sökningen laddar hela `ordlista.json` (2,5 MB) vid fokus, innan första
  tangenttryckning — ingen lätt sökindex finns.
- `matchRank()` (rad 193–199) gör exakt/börjar-med/innehåller. Ingen
  diakritisk fold (sök "oga" hittar inte "öga") och ingen stavfelstolerans.
- `renderResults()` filtrerar redan på både `term` **och** `def` — den
  def-sökningen är det som gör att man hittar c-formen (`Kolit`) när man
  söker k-formen (`Kolit`/`kolit`) eftersom c-posterna noterar "även
  k-form" i brödtexten. Ett framtida lätt index (bara term+href) får
  **inte** ersätta detta, bara komplettera det.

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
nu (fil finns + `id=` finns). **Men `check_links.py` validerar inte
`kb_glossary_terms.json` direkt** — den kontrollerar bara länkar som redan
står i HTML. En trasig facitnyckel skulle idag inte fångas av något som körs.
→ Se punkt 4, skyddet som ska byggas FÖRST.

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

## 4. Verktyg att bygga FÖRST — skyddet som saknas

Innan etapp 2 påbörjas: utöka `check_links.py` (eller ett nytt separat skript
inkopplat i `check_generators.py`-kedjan) att läsa `kb_glossary_terms.json`
direkt och validera varje `href`/ankare mot disk — inte bara länkar som redan
står i HTML. Verifiera larmet genom att medvetet peta sönder ett ankare och se
att kontrollen faller, enligt [[feedback_ship_the_guardrail_with_the_fix]].
Utan detta är facit obevakat.

- [ ] Byggt
- [ ] Larmet verifierat genom planterat fel
- [ ] Inkopplat i `check_generators.py`

---

## 5. Etapper (reviderad ordning efter riskanalysen)

Ursprunglig rekommendation var 1 → 3 → 2. Efter analysen: **1 → skyddet
(punkt 4) → 2 → 4 → 3 → 5.** Etapp 3 flyttades sist bland kodetapperna
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

### Etapp 2 · Sök som håller på mobil — risk: låg
- [ ] Generera lätt sökindex (`data/ordlista-index.json`: term + page + slug)
      från `generate_glossary.py`. Bygger på befintlig `page_key`/`slugify`,
      ändrar dem inte.
- [ ] Diakritisk fold i sökningen som egen funktion (se skyddsregel 3).
- [ ] Behåll def-sökning som separat, andra steg (se fynd i punkt 1) —
      annars slutar c/k-sökningen fungera.
- [ ] Bumpa `GLOSSARY_JS_V`.

### Etapp 4 · Fältkomplettering — risk: låg, men LÅNGT (§0.3, för hand)
Prioritetsordning (störst lucka, minst gissningsrisk först):
1. [ ] Böjning — 5 448 saknar.
2. [ ] Etymologi — 3 574 saknar.
3. [ ] Eng. — 1 504 saknar (många prefix/suffix motiverat undantagna).

En bokstav i taget, samma arbetsform som ursprungsberikningen.

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
- `data/kb_glossary_terms.json` — facit för tooltips, 2 351 nycklar, obevakat av `check_links.py` idag.
