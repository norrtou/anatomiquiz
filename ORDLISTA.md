# Medicinska ordlistan — syfte och arbetsgång

Detta dokument beskriver **vad** den medicinska ordlistan är, **varför** vi bygger ut den och **hur** arbetet går till. Det är skrivet för att vara självförklarande även utan extern kontext.

---

## Syfte / vision

Målet är att göra `data/ordlista.json` till **nätets bästa medicinska ordbok på svenska**.

- **Allt medicinskt ska finnas med** — inte bara anatomiska termer, utan även:
  - kliniska begrepp, sjukdomar, undersökningar, läkemedelsgrupper
  - förkortningar (ALAT, ACE, AAA, APTT …)
  - prefix/suffix och rena latinska/grekiska byggstenar
  - forsknings- och statistikbegrepp (evidensgrad, absolut risk, NNT …)
- **Varje post i fullt format** (se nedan): definition, ordklass, böjning, svensk synonym, engelsk motsvarighet, lekmannasvenska och etymologi.

## Källmaterial

Ordlistan byggs ut från en omfattande importerad lista med medicinska termer (3 965 poster: `term` + kort förklaring + böjningsvarianter), sparad råt i `data/ordlista_import_raw.json`. Den filen är **referens/backup** och redigeras inte under arbetet.

---

## Två faser

**Fas 1 – Import (klar):** Alla importerade termer som inte redan fanns i `ordlista.json` lades in som *stubs* (se nedan). 211 fanns redan, 3 754 var nya.

**Fas 2 – Berikning (pågår):** Varje stub görs om till en färdig post i husformat, **en bokstav i taget** (A, B, C … Ö). När en post är berikad blir den synlig live.

### Status

- **A: klart** (475 poster berikade).
- **B: klart** (99 berikade, 3 stavningsdubbletter sammanslagna).
- **C: klart** (143 berikade, 3 dubbletter sammanslagna).
- **D: klart** (170 berikade, 2 dubbletter sammanslagna).
- **E: klart** (202 berikade, 1 skräppost + 5 dubbletter borttagna).
- **F: klart** (122 berikade, 5 dubbletter sammanslagna).
- Återstår (stubs per bokstav):
  G 90 · H 231 · I 201 · J 5 · K 201 · L 130 · M 109 · N 117 · O 134 · P 464 · Q 3 · R 155 · S 280 · T 221 · U 59 · V 103 · W 5 · X 6 · Y 1 · Z 2 · Ö 5

### c/k-stavningsdubbletter (viktigt vid K m.fl.)
Grekisk-härledda medicinska ord finns ofta i både c- och k-stavning (Catarakt/Katarakt, Carcinom/Karcinom, Cardio-/Kardio-, Cholecystit/Kolecystit, Colit/Kolit, Coronar/Koronar, Conjunktivit/Konjunktivit, Curativ/Kurativ …). C-formerna är redan berikade och **publicerade** (de noterar k-formen med "även …"). När K (och andra letter) berikas: ta bort k-stubben om en redan publicerad c-post täcker samma ord — behåll den publicerade, lägg ev. till "även k-form". Kontrollera genom att byta k→c i K-termen och se om en synlig post finns.

Aktuell totalsumma kontrolleras med:
```bash
python3 -c "import json;d=json.load(open('data/ordlista.json'));\
print('total',len(d),'synliga',sum(1 for e in d if e.get('status')!='stub'),\
'stubs',sum(1 for e in d if e.get('status')=='stub'))"
```

---

## Datamodell

`data/ordlista.json` är en lista av poster.

**Färdig (synlig) post:**
```json
{ "term": "Aneurysm", "def": "Sjuklig, lokal utvidgning … (subst., -et, pl. -er) Eng: aneurysm. Av gr. aneurysma = utvidgning." }
```

**Stub (ofärdig, dold live):**
```json
{ "term": "Bradykardi", "def": "<importerad råtext>", "status": "stub", "variants": ["bradykardin", "..."] }
```

- `status: "stub"` = ej berikad ännu. `def` är seedad med den importerade korta råtexten; `variants` håller böjningar/alternativstavningar att arbeta in.
- **Att berika en post** = skriv full `def` i husformat och **ta bort** `status` och `variants`.

### Stubs döljs live (viktigt)

Stubs får aldrig synas på sajten förrän de är berikade. Det sköts på **två** ställen som måste hållas i synk:

1. `scripts/generate_glossary.py` — filtrerar bort `status == "stub"` före rendering/JSON-LD/termräkning (statisk förrendering).
2. `js/glossary.js` → `loadTerms()` — filtrerar bort `status === "stub"` (dynamisk rendering + sökning).

---

## Husformat för `def`

```
Definition i klartext. (ordklass, böjning) Sv: svensk synonym. Eng: english term. Lekman: vardagsuttryck. Av lat./gr. etymologi.
```

Riktlinjer:
- Endast de fält som tillför värde tas med (alla poster har inte Sv/Lekman/etymologi).
- **Böjning** läggs kompakt i ordklass-parentesen, t.ex. `(subst., -en, pl. -er)`, `(adj., -t, -a)`, `(verb)`, `(förkortn.)`.
- **`Eng: …`** måste vara **en mening som avslutas med punkt** — förrenderaren och `glossary.js` kursiverar texten mellan `Eng: ` och nästa punkt (`<em lang="en">`). Lägg inte punkter mitt i den engelska frasen.
- Förkortningar: expandera, ange engelsk motsvarighet, hoppa över latinsk etymologi om den inte tillför.
- **Faktakonservativt:** den importerade råtexten ger betydelsen. Lägg hellre till mindre etymologi än att gissa. Kör inte över kursunderlaget med eget resonemang (se `CLAUDE_REGLER.md`).

### -ös-adjektiv integreras i grundordet
Medicinska **-ös**-former (adenomatös, fibrös, ödematös …) betyder "lik/av samma slag som" grundordet och är en **böjning**, inte ett eget uppslagsord. Ge dem ingen egen post — integrera i grundformen med "**även …**", t.ex.:
> Adenomatos — "… Eng: adenomatosis. Även adenomatös (adj.) = körtelliknande …"

Detta löser samtidigt slug-kollisioner (se nedan) och formen förblir sökbar eftersom sökningen även matchar `def`-texten.

---

## Slug-kollisioner

Ankar-id byggs av `slugify`, som **foldar** å→a, ä→a, ö→o och tar bort övriga tecken. Logiken är **identisk** i `generate_glossary.py` och `js/glossary.js` för att djuplänkar ska vara stabila — **ändra den inte**.

Följd: ord som bara skiljer på diakrit (t.ex. *Adenomatos* / *Adenomatös*) får samma slug och generatorn **hård-felar**. Lös genom att slå ihop enligt -ös-regeln ovan, eller på annat sätt göra termtexten slug-unik. Kör alltid generatorn efter varje bokstav — den fungerar som kollisionskontroll.

---

## Arbetsflöde per bokstav

1. Plocka ut bokstavens stubs (term + `def`-råtext + `variants`).
2. Författa full `def` i husformat för varje; ta bort `status`/`variants`.
3. Hantera -ös-former och ev. dubbletter (se `CLAUDE_REGLER.md` om dubblettförbud).
4. Kör `python3 scripts/generate_glossary.py` — bygger `medicinskordlista.html` + JSON-LD + metataggar och kontrollerar slug-unikhet.
5. Versionsbump (VERSION, `index.html`-cachebustrar, `CHANGELOG.md`) enligt projektets regler, sedan commit.

## Sortering

`ordlista.json` hålls alfabetiskt sorterad med diakritiskt **foldad** nyckel (samma fold som slugify), och mellanslag/bindestreck före bokstäver — det matchar den befintliga ordningen och håller synliga posters inbördes ordning stabil.

---

## Relaterade filer

| Fil | Roll |
|-----|------|
| `data/ordlista.json` | Sanningskälla för ordlistan (synliga poster + stubs). |
| `data/ordlista_import_raw.json` | Råimport av termlistan (referens/backup, redigeras ej). |
| `scripts/generate_glossary.py` | Förrenderar `medicinskordlista.html` (hoppar över stubs). |
| `js/glossary.js` | Dynamisk rendering + sökning (hoppar över stubs). |
| `medicinskordlista.html` | Genererad sida (redigera inte de genererade blocken för hand). |
| `CLAUDE_REGLER.md` | Projektregler (dubblettförbud, källtrohet, versionering). |
