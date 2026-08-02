# Medicinska ordlistan — syfte och arbetsgång

> **PROAKTIVA REGLER — [`CLAUDE_REGLER.md` §0](CLAUDE_REGLER.md) gäller över detta dokument.**
> Varje regel här ska tala om hur något skrivs **rätt från början**, inte hur felet hittas och
> rättas efteråt. Formulerar du en ny regel: mallen först, förbudet som komplement, och lägg
> den där arbetet utförs. Tvingar ett verktyg fram korrekturarbete ska verktyget byggas om.
>
> **§0.3:** kan något inte skrivas maskinellt utan uppenbar risk att bli fel eller slarvigt —
> text, kod, quizfråga, definition — **skrivs det för hand**. Automatisering väljs för att den
> bevisligen ger rätt resultat, aldrig för att den är bekvämare.

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

**Fas 2 – Berikning (klar):** Varje stub gjordes om till en färdig post i husformat, **en bokstav i taget** (A, B, C … Ö). När en post är berikad blir den synlig live.

---

## Status: fas 2 avslutad

`data/ordlista.json` innehåller **11 200 poster och 0 stubs** (mätt 2026-08-02). Varje
importerad term är berikad — det finns ingenting kvar att hämta ur råimporten, och
sedan dess har filen dessutom vuxit långt förbi importen med TA-anatomi, labbvärden,
sjukdomar med ICD-koder, psykiatritermer, läkemedel och örter.

Arbetet fortsätter därför **inne i posterna**, inte över bokstäverna: se
fälttäckningen nedan, som är facit för fältkompletteringen.

Aktuell totalsumma kontrolleras med:
```bash
python3 -c "import json;d=json.load(open('data/ordlista.json'));\
print('total',len(d),'synliga',sum(1 for e in d if e.get('status')!='stub'),\
'stubs',sum(1 for e in d if e.get('status')=='stub'))"
```

### Fälttäckning (mätt 2026-08-02) — facit för fältkompletteringen

Mät aldrig detta på känsla; kör snutten under tabellen. **Siffrorna gäller alla 11 200
poster**, även de där fältet är motiverat frånvarande (ett prefix behöver ingen böjning,
en förkortning sällan en etymologi) — "saknas" är alltså ett tak för arbetet, inte en
arbetslista rakt av.

| Fält | Poster | Täckning | Saknas |
|---|---:|---:|---:|
| Ordklasstagg | 11 200 | 100 % | 0 |
| `Eng. ` | 9 696 | 86,6 % | 1 504 |
| Etymologi (`Av lat./gr. …`) | 7 721 | 68,9 % | 3 479 |
| `Sv. ` | 2 685 | 24,0 % | 8 515 |
| Böjning i parentes | 3 106 | 27,7 % | 8 094 |
| `Jfr ` | 1 394 | 12,4 % | 9 806 |
| `ICD-10: ` | 947 | 8,5 % | 10 253 |
| `Vardag. ` | 782 | 7,0 % | 10 418 |
| `Se ` | 358 | 3,2 % | 10 842 |
| `Motsats` | 157 | 1,4 % | 11 043 |
| `Referensvärde` | 78 | 0,7 % | 11 122 |
| Uttalsangivelse | **0** | 0,0 % | 11 200 |

```bash
python3 - <<'PY'
import json, re
d = json.load(open('data/ordlista.json')); n = len(d)
FALT = {
    "Ordklasstagg":  r"(?i)^(?:subst|adj|verb|adv|förk|egennamn|lat|gr|prefix|suffix"
                     r"|prep|pron|räkn|interj|konj)\b",
    "Eng.":          r"Eng\. ",
    "Etymologi":     r"\bAv (?:lat|gr|grek|eng|fr|ty|ital|arab|sanskr)",
    "Sv.":           r"Sv\. ",
    "Böjning":       r"\((?:-[a-zåäö∅]|pl\. -)",
    "Jfr":           r"Jfr ",
    "ICD-10":        r"ICD-10: ",
    "Vardag.":       r"Vardag\. ",
    "Se":            r"(?<![A-Za-zåäöÅÄÖ])Se ",
    "Motsats":       r"Motsats",
    "Referensvärde": r"Referensvärde",
    "Uttal":         r"\buttal(?:as|sangivelse)",
}
for k, p in FALT.items():
    c = sum(1 for e in d if re.search(p, e["def"]))
    print(f'{k:14s} {c:6d}  {100*c/n:5.1f} %  saknas {n-c}')
PY
```

Två fällor i mätningen, båda påträffade 2026-08-02:

- **Sök inte uttalsangivelser på `uttal`.** Ordet ger 12 träffar i filen och samtliga
  tolv är *uttalad*/*uttalade* i löptext (`fatigue`, `somnolens`, `mononukleos` …).
  Ordlistan har **noll** uttalsangivelser — mät på `uttalas`/`uttalsangivelse`.
- **Böjningen står i en egen parentes efter ordklasstaggen**, `subst. (-en, pl. -er)`,
  inte inuti taggparentesen. En regex som bara letar bindestreck var som helst inom
  parentes fångar också `(A01.1-A01.4)`, `(5-HT)` och liknande och överskattar
  täckningen grovt.
- **55 poster bär plural utan bindestreck** — `analgetikum (pl. analgetika)`,
  `antibiotikum (pl. antibiotika)` och de övriga `-um`-läkemedlen. Mätsnutten
  räknar dem som obojda, eftersom mönstret kräver `-`. De är alltså *inte* en
  arbetslista: de har redan den böjning som är relevant för formen.

**Skriv `(-ret)`/`(-let)`, inte `(-et)`, när ordet tappar en vokal i bestämd form.**
Uppslagsord på obetonat `-er`/`-el` synkoperar: *flimmer → flimret*, *foster → fostret*,
*koagel → koaglet*. `(-et)` där ger *flimmeret*, *fosteret*, *koagelet* — ord som inte
finns. Alla tre var felskrivna och rättades 0.9.343. Regeln gäller **inte** ord med
betonad slutstavelse (`endotel → endotelet`, `epitel`, `kardinalfel`, `allel`, `D-dimer`),
så pröva formen i huvudet innan du väljer — ändelsen ensam avgör inte.

**Ett uppslagsord som redan står i bestämd form får ingen böjning.** `fransosen` bar
`(-en)` och gav *fransosenen* (rättat 0.9.343). Samma sak som med flerordstermerna:
parentesen står direkt efter taggen och läses som uppslagsordets egen.

**Inga formavvikelser kvar (0.9.342):** samtliga 11 200 poster inleds med en gement
skriven ordklasstagg. Före det passet saknade 50 poster tagg helt och 28 skrev den med
versal (`Adj./subst.:`, `Egennamn:`, `Förled:`) — de renderades utan kursiv ordklass,
eftersom `format_def()` bara kursiverar en gement skriven tagg. **Skriv aldrig en ny
post utan tagg först**, och skriv den gement: mätsnutten ovan ska förbli 0 saknade.

### Berikningslogg per bokstav (fas 2, avslutad)

- **A: klart** (475 poster berikade).
- **B: klart** (99 berikade, 3 stavningsdubbletter sammanslagna).
- **C: klart** (143 berikade, 3 dubbletter sammanslagna).
- **D: klart** (170 berikade, 2 dubbletter sammanslagna).
- **E: klart** (202 berikade, 1 skräppost + 5 dubbletter borttagna).
- **F: klart** (122 berikade, 5 dubbletter sammanslagna).
- **G: klart** (86 berikade, 2 dubbletter + 2 icke-termer ("Grupp 1/2") borttagna).
- **H: klart** (227 berikade, 4 dubbletter borttagna; 3 rubriker rättade).
- **I: klart** (238 poster; Icterus→Ikterus; -ös-formerna infektiös/intertriginös infogade i grundord. Synliga termer totalt: 2 802).
- **J: klart** (5 poster: JIA, JRA, Jonisera, Jonisering, Juvenil. Synliga termer totalt: 2 807).
- **K: klart** (166 poster berikade; 28 c/k-stubbar borttagna till förmån för publicerade c-former – 6 c-poster fick k-formen tillagd; 4 -ös-former + 2 operationsverb sammanslagna med grundordet; 1 stavningsdubblett (Koledokolithiasis) borttagen. Synliga termer totalt: 2 973).
- **L: klart** (125 poster berikade; 5 stubbar sammanslagna: Lacrimal→Lakrimal, Laryngektomera→Laryngektomi, Ligering→Ligera, Laxantia + Laxerande→Laxans; rubriker rättade: Labia major/minor→Labia majora/minora, Ligamenten→Ligament; Logoped/Logopedi-rättning. Synliga termer totalt: 3 098).
- **M: klart** (104 poster berikade; 5 dubbletter sammanslagna: Makula→Macula, Megacolon→Megakolon, Menarche→Menarke, Mesenterial→Mesenteriell, Medianvärde→Median; rubriker rättade Mamillen→Mamill, Metafysen→Metafys, Mandrin→Mandräng; faktarättning Makulopati. Synliga termer totalt: 3 202).
- **N: klart** (112 poster berikade; 5 stubbar sammanslagna: ph/f-formerna Nephrolithiasis→Nefrolitiasis, Nephropati→Nefropati, Nephrotoxisk→Nefrotoxisk, c/k-formen Nocturnal→Nokturnal, plural Neutrofila granulocyter→Neutrofil granulocyt; cross-ref NHL/NPV/NUD/NT. Synliga termer totalt: 3 314).
- **O: klart** (132 poster berikade; 2 stubbar borttagna: c/k Otoscleros→Otoskleros, slug-kollisionen Okular→Okulär (okular = mikroskoplins integrerat i Okulär); cross-ref OCD/Ooforektomi↔Ovariektomi/Opiat/Opportunist/Ortostatisk. Synliga termer totalt: 3 446).
- **P: klart** (449 poster berikade — största bokstaven; 15 stubbar borttagna: th/t Parathyreoidea→Paratyreoidea, Pneumothorax→Pneumotorax; stavnings-/c-k-dubbletter Panniculit→Pannikulit, Pediculos+Pediculosis→Pedikulos, Petechium→Petekium, Pingvekula→Pinguecula, Polynevropati→Polyneuropati, Pyoderma→Pyodermi, Proptosis→Proptos, Paronykion→Paronyki; synonympar Periodontit→Parodontit, Periodontal→Parodontal, Pip→Pip-led; slug-kollision Pustulös→Pustulos. Rubrik rättad: Parasympatimimetisk→Parasympatomimetisk. Synliga termer totalt: 3 895).
- **Q: klart** (3 poster berikade: Q-tagg, QCT, QT-intervall. Synliga termer totalt: 3 898).
- **R: klart** (153 poster berikade; 2 stubbar borttagna: c/k Resekera→Resecera, Rektum→täcks av publicerade Rectum; cross-ref RA/RAST/RCA/RCT/RR/RRI/RRR/RRT/RF/RIND/RPGN/RMR; källflagga Rubeola=mässling vs råtextens "röda hund". Synliga termer totalt: 4 051).
- **S: klart** (271 poster berikade; 9 stubbar borttagna, bl.a. Evidensgrad-sammanslagningen. Synliga termer totalt: 4 321). *(0.8.15)*
- **T–Ö: klart** — sista berikningspasset, som tömde stub-listan: T 200, U 58, V 99, W 5, X 6, Y 1, Z 2, Ö 5 poster berikade, plus `5-ASA` och `5-FU` på siffersidan. 26 stubbar borttagna som täckta av redan publicerade poster (th/t-formerna Thoracal→Torakal, verbstubbar Torakotomera/Trombektomera/Vasektomera, Tendovaginit→Tendosynovit, Trokanter/Trochanter major/minor, -ös-formerna Varikös ven/Vesikulös m.fl.). Synliga termer totalt: 4 701, **stubs: 0**. *(0.8.18)*
- **Å/Ä: klart** (21 nya poster — inga stubbar fanns; historiska termer märkta ålderdomliga, slug-override mot `ärr`/ARR-kollisionen). *(0.8.26)*

### c/k-stavningsdubbletter (viktigt vid K m.fl.)
Grekisk-härledda medicinska ord finns ofta i både c- och k-stavning (Catarakt/Katarakt, Carcinom/Karcinom, Cardio-/Kardio-, Cholecystit/Kolecystit, Colit/Kolit, Coronar/Koronar, Conjunktivit/Konjunktivit, Curativ/Kurativ …). C-formerna är redan berikade och **publicerade** (de noterar k-formen med "även …"). När K (och andra bokstäver) berikas: ta bort k-stubben om en redan publicerad c-post täcker samma ord — behåll den publicerade, lägg ev. till "även k-form". Kontrollera genom att byta k→c i K-termen och se om en synlig post finns.

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
ordklass. (böjning) definition i klartext. Sv. svensk synonym. Eng. english term. Vardag. vardagsuttryck. Av lat./gr. etymologi.
```

Så ser de 11 200 posterna faktiskt ut: **ordklasstaggen först**, böjningen i parentes direkt
efter, och därefter definitionen med liten begynnelsebokstav. Mallen stod tidigare med
definitionen först och ordklassen inskjuten i mitten, vilket ingen post följer — och den
inledande taggen är dessutom det enda `format_def()` kursiverar, så den *måste* stå först
för att renderas rätt.

Riktlinjer:
- Endast de fält som tillför värde tas med (alla poster har inte Sv/Lekman/etymologi).
- **Böjning** står i en egen parentes direkt efter ordklasstaggen: `subst. (-en, pl. -er)`,
  `adj. (-t, -a)`, `verb (-r, -de, -t)`. Se notationstabellen nedan.
- **Ordklassen bestäms av UPPSLAGSORDET, inte av definitionens första ord.** Skriv taggen
  genom att fråga "vilken ordklass är termen?" — inte genom att titta på hur förklaringen
  råkar inledas. Ett latinskt/grekiskt substantiv är `subst.` även när definitionen börjar
  med ett annat substantiv: `calcaneus`, `umbilicus`, `hepar`, `malleus`, `cuneus`, `calcar`,
  `thenar` stod alla som `adj.` (rättat 0.9.238). Omvänt är `incisivus` och `visceral` `adj.`
  trots att deras definitioner inleds med substantiven "framtand" respektive "visceral yta".
  **Skriv aldrig en ordklasstagg som motsägs inne i samma post** — `sopor`, `submukosa`,
  `laxans` och `stridor` inleddes med `adj.` men bar `(subst.)` i sin egen brödtext.
- **Definitionen får aldrig vara uppslagsordet i annan form.** `sopor` → "sopor",
  `submukosa` → "submukosa" säger ingenting. Beskriv vad termen betyder; se motsvarande
  förbudstabell i [`SEO_REGLER.md` §6c.0](SEO_REGLER.md), som gäller i sak även här.
- **Lokalisationer och sakuppgifter kontrolleras mot filens egna poster.** `stapes` stod som
  "innerörats minsta hörselben" medan `malleus`-posten två rader bort korrekt sade
  "i mellanörat" (rättat 0.9.238). Grep efter grannposterna i samma anatomiska region innan
  en ny post skrivs — motsägelser inne i ordlistan är dyrare att hitta än att undvika.
- **Markören är `Eng. `, inte `Eng: `.** Alla 9 699 poster som bär engelsk motsvarighet
  skriver `Eng. <term>.` — noll använder kolon. Skriv aldrig `Eng:`; det bryter mot filens
  enda form och blir osökbart bland de övriga.
  *(Rättat 0.9.286: regeln stod tidigare som `Eng: …` och påstod att förrenderaren
  kursiverar texten mellan `Eng: ` och nästa punkt. Det gör den inte — `format_def()` i
  `generate_glossary.py` kursiverar **enbart** den inledande ordklasstaggen, och `formatDef`
  i `js/glossary.js` gör detsamma. Ingen av dem känner till `Eng` över huvud taget.)*
- Övriga fältmarkörer följer samma punktform: `Sv. ` (svensk synonym), `Vardag. ` (lekmanna­
  uttryck, 782 poster), `Förk. ` (förkortning), `Lat. `, `Jfr ` (1 394 poster),
  `Motsats: ` (157), `Referensvärde (…): ` för labbvärden (78 poster), `ICD-10: ` sist
  (947 poster). Aktuella siffror: kör mätsnutten i statusavsnittet.
- Förkortningar: expandera, ange engelsk motsvarighet, hoppa över latinsk etymologi om den inte tillför.
- **Faktakonservativt:** den importerade råtexten ger betydelsen. Lägg hellre till mindre etymologi än att gissa. Kör inte över kursunderlaget med eget resonemang (se `CLAUDE_REGLER.md`).

### Böjningsnotation — och vilka poster som ska ha böjning

Notationen är husets, härledd ur de poster som redan bär böjning. Använd dessa
former; hitta inte på en ny för att den ser prydligare ut i just den posten.

| Situation | Form | Exempel |
|---|---|---|
| en-ord, räknebart | `(-en, pl. -er)` / `(-n, pl. -er)` | `agonist`, `autopsi` |
| en-ord, oräknebart | `(-en)` / `(-n)` | `abstinens`, `anatomi` |
| ord på `-ing` | `(-en, pl. -ar)` | `Anpassningsstörning` |
| ett-ord, räknebart | `(-et, pl. -er)` | `axon`, `hormon` |
| ett-ord, oförändrad plural | `(-et, pl. -∅)` | `angiokeratom`, `Aktivitetsmål` |
| ett-ord på `-e` | `(-t)` | `alkoholberoende`, `Arbetsminne` |
| ett-ord på `-o`/`-a`, plural på `-n` | `(-t, pl. -n)` | `embryo`, `trauma`, `hydrocele` |
| ämnesnamn (läkemedel, hormon) | `(-et)` | `Atropin`, `testosteron` |
| adjektiv | `(-t, -a)` | `allogen`, `antalgisk` |
| adjektiv som redan slutar på `-t` | `(pl. -a)` | `adekvat`, `adult` |
| verb på `-era` | `(-r, -de, -t)` | `abducera`, `aspirera` |
| dubbel ordklass | `(-t, -a; -en, pl. -er)` | `adenoid`, `analog` |

Vid dubbel ordklass skiljer **semikolon** sinnena, och ordningen följer taggen:
`adj./subst.` ⇒ adjektivböjningen först. Parentesen **måste börja med bindestreck**
(eller `pl. -`) — annars ser mätsnutten posten som obojd och den ligger kvar i
arbetslistan för alltid.

**Kända avvikelser, rör dem inte i förbifarten:** fem K-verb skriver
`(-ar, -ade, -at)` i stället för `(-r, -de, -t)` (*katalysera*, *kateterisera*,
*kauterisera*, *koagulera*, *konisera*), och oförändrad plural förekommer i tre
skrivningar — `pl. -∅` (80 poster), `pl. -` (12) och `pl. =` (11). `-∅` är husets
form för nya poster.

**Böjning skrivs inte i varje post.** "Saknas" i täckningstabellen är ett tak, inte
en arbetslista. Utanför står:

- **latinska och grekiska uppslagsformer och fraser** — `cornea`, `retina`, `arcus`,
  `articulatio`, `aorta thoracica`. Filen böjer dem redan konsekvent inte, och en
  svensk böjning av ett latinskt lemma är en gissning oftare än ett faktum;
- **svenska flerordstermer och eponymfraser** — `djup ventrombos`, `dilaterad ven`,
  `dental plack`, `Downs syndrom`, `Duchennes muskeldystrofi`. Böjningen hör till
  frasens huvudord, inte till frasen, och parentesen står direkt efter taggen där
  den skulle läsas som frasens egen (avgjort i D-passet, 0.9.340);
- **prefix och suffix**, som inte böjs;
- **förkortningar** (`ACE`, `APTT`);
- **particip som används adjektiviskt** — `adstringerande`, `antikoagulerande`;
- **`-um`-läkemedlen** som redan bär `(pl. antibiotika)`-formen.

**Läkemedels- och ämnesnamn böjs däremot**, med `(-et)` — `Atropin`, `testosteron`,
`Doxycyklin`, `Dexametason`. Undantaget är de som bygger på ett n-ord: `Dietyleter`
får `(-n)`, eftersom *eter* heter *etern*.

### -ös-adjektiv integreras i grundordet
Medicinska **-ös**-former (adenomatös, fibrös, ödematös …) ges ingen egen post — integrera dem i grundformen med "**även …**". **MEN:** substantivet och -ös-adjektivet är relaterade, inte samma ord. Glosan måste vara en **egen, tydlig förklaring som visar skillnaden** — aldrig bara likställa adjektivet med grundordet. Skriv `även <ordet> (adj.) = <distinkt betydelse>`, t.ex.:
> Adenomatos — "… Eng: adenomatosis. Även adenomatös (adj.) = körtelliknande, av adenomkaraktär …"
> Infektion — "… Även infektiös (adj.) = som orsakas av eller har samband med infektion; även smittsam." (INTE bara "= smittsam".)

Detta löser samtidigt slug-kollisioner (se nedan) och formen förblir sökbar eftersom sökningen även matchar `def`-texten.

---

## Slug-kollisioner

Ankar-id byggs av `slugify`, som **foldar** å→a, ä→a, ö→o och tar bort övriga tecken. Logiken är **identisk** i `generate_glossary.py` och `js/glossary.js` för att djuplänkar ska vara stabila — **ändra den inte**.

Följd: ord som bara skiljer på diakrit (t.ex. *Adenomatos* / *Adenomatös*) får samma slug och generatorn **hård-felar**. Lös genom att slå ihop enligt -ös-regeln ovan, eller på annat sätt göra termtexten slug-unik. Kör alltid generatorn efter varje bokstav — den fungerar som kollisionskontroll.

---

## Sökningen laddar i två steg (0.9.335)

Sökrutan hämtade tidigare hela `data/ordlista.json` — 2,4 MB, varav 1,9 MB definitioner —
redan när den fick fokus, alltså innan en enda tangent tryckts. Nu laddas datan i två steg:

| Steg | Fil | Storlek | Innehåll | Hämtas |
|---|---|---|---|---|
| 1 | `data/ordlista-index.json` | ~190 KB | uppslagsord + sidgrupp + de 41 slug-överstyrningarna | vid fokus |
| 2 | `data/ordlista.json` | 2,4 MB | allt, inkl. definitionerna | vid första tangenttrycket, i bakgrunden |

Steg 1 räcker för att **hitta ett ord och länka rätt**; träffarna ritas direkt, med tom
beskrivningskolumn. När steg 2 landar ritas listan om med beskrivningar och med de träffar
som bara står i en definition.

**Definitionssökningen i steg 2 får aldrig tas bort.** Den är det som gör att en sökning på
k-formen hittar c-formen (*kolit* → **colit**), eftersom c-posterna nämner k-formen i sin
brödtext — se c/k-avsnittet ovan. Indexet **kompletterar** den, ersätter den inte.

`data/ordlista-index.json` skrivs av `generate_glossary.py` (`build_search_index()`) och
redigeras aldrig för hand. Sökningen viker dessutom diakriter (`foldForSearch()` i
`js/glossary.js`), så *hoft* hittar *höft* och *arr* hittar *ärr*. Den funktionen är **skild
från `slugify()`** med flit: `slugify()` är ankarkontraktet mot 2 351 tooltips i
kunskapsbanken och byter ut allt som inte är a–z0–9 mot bindestreck, medan sökfolden måste
lämna mellanslag och streck kvar.

`node scripts/test_ordlista_sok.js` kör den riktiga sökkoden mot den riktiga datan och prövar
bl.a. att båda stegen ger identiska länkar för var och en av de 11 200 posterna, att
slug-tabellen är identisk i Python och JS, och att k-formen fortfarande hittar c-formen.
Skalet körs automatiskt av `scripts/check_generators.py`.

---

## Arbetsflöde per bokstav

1. Plocka ut bokstavens stubs (term + `def`-råtext + `variants`).
2. Författa full `def` i husformat för varje; ta bort `status`/`variants`.
3. Hantera -ös-former och ev. dubbletter (se `CLAUDE_REGLER.md` om dubblettförbud).
4. Kör `python3 scripts/generate_glossary.py` — bygger `medicinskordlista.html` + JSON-LD + metataggar och kontrollerar slug-unikhet.
5. Versionsbump (VERSION, `index.html`-cachebustrar, `CHANGELOG.md`) enligt projektets regler, sedan commit.

## Sortering

`ordlista.json` är **ungefärligt** alfabetiskt sorterad, inte strikt. Filen består av en
huvudlista A–Ö (index 0–9594) följd av ett antal tematiska batchar som lagts till i efterhand
(labbvärden, psykiatritermer, läkemedel, örter, latinska anatomitermer) — var och en internt
sorterad, men efter huvudlistan.

**Härled aldrig en global sorteringsnyckel och sortera aldrig om filen.** Både diakritisk
fold (å→a, ä→a, ö→o) och svensk kollation (å ä ö sist) ger ~6 % avvikande par mot den
faktiska ordningen; grekiska bokstäver (α, β, χ, δ, ε, φ, γ) sorteras dessutom som sina
utskrivna namn. En omsortering skulle ge en diff på tusentals rader och ingen vinst.

**Så läggs en ny post in:** hitta dess två grannar i huvudlistan, kontrollera dem med
ögonen, och infoga däremellan. Då blir diffen fyra rader per post och den befintliga
ordningen kan inte rubbas. (0.9.286 lade in 17 poster så: 68 rader, noll omflyttningar.)

---

## Relaterade filer

| Fil | Roll |
|-----|------|
| `data/ordlista.json` | Sanningskälla för ordlistan (synliga poster + stubs). |
| `data/ordlista_import_raw.json` | Råimport av termlistan (referens/backup, redigeras ej). |
| `data/ordlista-index.json` | Genererat sökindex (steg 1). Skrivs av generatorn, redigeras aldrig för hand. |
| `scripts/generate_glossary.py` | Förrenderar `medicinskordlista.html` (hoppar över stubs). |
| `js/glossary.js` | Dynamisk rendering + sökning (hoppar över stubs). |
| `scripts/test_ordlista_sok.js` | Testskal för sökningen — körs av `check_generators.py`. |
| `medicinskordlista.html` | Genererad sida (redigera inte de genererade blocken för hand). |
| `CLAUDE_REGLER.md` | Projektregler (dubblettförbud, källtrohet, versionering). |
