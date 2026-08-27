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

`data/ordlista.json` innehåller **10 928 poster och 0 stubs** (mätt 2026-08-04). Varje
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

Mät aldrig detta på känsla; kör snutten under tabellen. **Siffrorna gäller alla 10 928
poster**, även de där fältet är motiverat frånvarande (ett prefix behöver ingen böjning,
en förkortning sällan en etymologi) — "saknas" är alltså ett tak för arbetet, inte en
arbetslista rakt av. Mätt 2026-08-04, efter att böjningsetappen (etapp 4 punkt 1)
avslutades i hela alfabetet A–Ö.

| Fält | Poster | Täckning | Saknas |
|---|---:|---:|---:|
| Ordklasstagg | 10 928 | 100 % | 0 |
| `Eng. ` | 9 942 | 91,0 % | 986 |
| Etymologi (`Av lat./gr. …`) | 7 859 | 71,9 % | 3 069 |
| `Sv. ` | 2 627 | 24,0 % | 8 301 |
| Böjning i parentes | 4 769 | 43,6 % | 6 159 |
| `Jfr ` | 1 386 | 12,7 % | 9 542 |
| `ICD-10: ` | 944 | 8,6 % | 9 984 |
| `Vardag. ` | 781 | 7,1 % | 10 147 |
| `Se ` | 355 | 3,2 % | 10 573 |
| `Motsats` | 157 | 1,4 % | 10 771 |
| `Referensvärde` | 78 | 0,7 % | 10 850 |
| Uttalsangivelse | **0** | 0,0 % | 10 928 |

**Böjningssiffran hoppade 32,0 % → 41,7 % (0.9.361) utan att en enda post ändrades** — mätsnutten
kände tidigare bara igen böjning som börjar med bindestreck eller `pl. -`. Men filen bär sedan
länge en parallell, lika avsiktlig konvention: en bar språk-/statustagg som **hela** innehållet i
den parentes som annars skulle hålla böjningen — `(lat.)`, `(fr.)`, `(ty.)`, `(it.)`, `(eng.)`,
`(gr.)`, `(lat./gr.)`, `(lat. uttryck)`, `(pl.)`, `(plural)`, `(plur.)`, `(best.)`, `(oböjl.)` —
och det **är** svaret på böjningsfrågan för den posten (”det här är ett latinskt/franskt/tyskt/
italienskt/engelskt låneord, oböjt”, ”det här är redan bestämd form”, ”det här förekommer bara i
plural”), inte en lucka. 1 063 poster bar en sådan tagg utan att mätsnutten räknade dem — `(eng.)`
och `(lat.)` ensamma svarar för de flesta (många är TA-flerordstermer som ändå räknas som
motiverat undantag, men gott och väl hundratals är ettordslemman/adjektiv/förkortningar/egennamn
som annars setts som obearbetade). Hittat i R-passet när `rigid`, `resistent` m.fl. visade att
samma "skriven ut i stället för bindestreck"-fälla (se nedan) även gäller de här taggarna.
**Kontrollera alltid mot den här listan innan en post bedöms sakna böjning** — en post som redan
bär en ensam språktagg i böjningsparentesen är klar, inte en arbetslista-post.

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
    "Böjning":       r"\((?:-[a-zåäö∅]|pl\. -)|\((?:lat\.|fr\.|ty\.|it\.|eng\.|gr\."
                     r"|pl\.|plural|plur\.|best\.|oböjl\.|lat\./gr\.|lat\. uttryck)\)",
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

**Etymologimätningen har samma sorts blinda fläck, hittad 2026-08-04 i A-passet.**
Regexen `Av (?:lat|gr|grek|eng|fr|ty|ital|arab|sanskr)` missar tre redan levande
notationer: (1) eponymer skrivna `Efter [Namn]` eller `beskrevs … av [Namn]`
(`Addisons sjukdom`, `Aselli`, `Aranzio`, `atlas`), (2) kemiska bildningar skrivna
`Bildat av …`/`Namnet är en sammandragning …`/`Ändelsen -X betecknar …`
(`Amitriptylin`, `Atenolol`, `Azatioprin`), och (3) `Av <ord> + <ord>` utan språkkod
när båda leden redan är svenska/vedertagna (`aminosyra`: "Av amin + syra"). 24 poster
i bokstav A bar redan en sådan notering utan att synas i mätningen — samma lärdom som
böjningens dolda språktaggar (se `scripts/ordlista_forbattring_todo.md`, etapp 4 punkt 2).
**Kontrollera alltid för `Efter `/`beskrevs av`/`Bildat av`/`Av <ord> \+` innan en post
bedöms sakna etymologi.**

**Skriv `(-ret)`/`(-let)`, inte `(-et)`, när ordet tappar en vokal i bestämd form.**
Uppslagsord på obetonat `-er`/`-el` synkoperar: *flimmer → flimret*, *foster → fostret*,
*koagel → koaglet*. `(-et)` där ger *flimmeret*, *fosteret*, *koagelet* — ord som inte
finns. Alla tre var felskrivna och rättades 0.9.343. Regeln gäller **inte** ord med
betonad slutstavelse (`endotel → endotelet`, `epitel`, `kardinalfel`, `allel`, `D-dimer`),
så pröva formen i huvudet innan du väljer — ändelsen ensam avgör inte.

**Ett uppslagsord som redan står i bestämd form får ingen böjning.** `fransosen` bar
`(-en)` och gav *fransosenen* (rättat 0.9.343). Samma sak som med flerordstermerna:
parentesen står direkt efter taggen och läses som uppslagsordets egen.

**En parentes som inte börjar med bindestreck räknas som obojd av mätsnutten.** Formen
`(-, -a)` såg ut som en böjning men var osynlig i mätningen (`latent`, `somnolent`,
rättade 0.9.352) — samma fälla som utskrivna former, `jonisera (joniserar, joniserade,
joniserat)` (0.9.349). **Leta efter den i varje bokstav:** en post som *ser* böjd ut men
inte syns i mätningen blir aldrig arbetad på.

**Inga formavvikelser kvar (0.9.342):** samtliga 10 937 poster inleds med en gement
skriven ordklasstagg. Före det passet saknade 50 poster tagg helt och 28 skrev den med
versal (`Adj./subst.:`, `Egennamn:`, `Förled:`) — de renderades utan kursiv ordklass,
eftersom `format_def()` bara kursiverar en gement skriven tagg. **Skriv aldrig en ny
post utan tagg först**, och skriv den gement: mätsnutten ovan ska förbli 0 saknade.

### Breddtäckning — vilka ord som SAKNAS (mätt 2026-08-27, efter etapp 1–3)

Fälttäckningen ovan mäter **djup**: hur färdiga de poster som finns är. Den kan inte
se ett saknat uppslagsord, och det kan inte arbetsflödet "en bokstav i taget" heller —
**en bokstavsvandring läser de rader som är skrivna, och ett hål har ingen rad att
läsa.** Filen har därför `enterokolit`, `ulcerös kolit` och `mikroskopisk kolit` men
inte `kolit`; `antimetabolit` men inte `metabolit`; `karcinomatos` men inte `karcinom`;
åtta `-skopi`-poster men varken `koloskopi` eller `otoskopi`. `kolit` och `sjukdom` är
skrivna sedan etapp 2–3; `metabolit`, `karcinom` och `koloskopi` ligger kvar i `korpus`
och står här för att visa hålets form.

Bredden mäts med ett eget verktyg, som härleder kandidater ur belägg som redan finns
i trädet — **ingen källa gissar fram ord, och kombinatorik är medvetet bortvald**
(stam × ändelse ger `dysalgi` och `dyscyt`, alltså påhittade ord; §0.3 förbjuder det):

```bash
python3 scripts/ordlista_luckor.py                  # sammanfattning per källa
python3 scripts/ordlista_luckor.py --lista korsref  # kandidaterna i en källa
python3 scripts/ordlista_luckor.py --check          # spärr: exit 1 om en källa vuxit
```

| Källa | Kandidater | Belägget |
|---|---:|---|
| `korsref` | **0** | `Jfr …`/`Se …`/`Motsats …` pekar på något utan post — nollad i 0.9.427 |
| `exempel` | **0** | `Ex:` i en prefix-/suffixpost nämner ordet — nollad i 0.9.429 |
| `synonym` | 2 306 | ordet står som `Sv. <ord>` men är inte lemma |
| `brodtext` | 360 | ordlistans egen definitionstext använder ordet |
| `korpus` | 721 | sajtens quiz/kunskapsbank använder ordet |
| `huvudord` | **0** | sammansättningen finns, huvudordet saknas — nollad i 0.9.428 |

3 234 unika ord, varav 989 utanför `synonym` (som är en policyfråga: ska `hjärta`,
`muskel` och `blod` vara egna uppslagsord eller bara synonymer inne i `cor`,
`musculus` och `sanguis`?). **Metoden, triagen, vägvalet och etapperna står i
[`scripts/ordlista_tackning_todo.md`](scripts/ordlista_tackning_todo.md)** — läs den
innan en post skrivs ur listorna.

Två saker gäller ovillkorligt: kandidatlistan är **underlag, aldrig poster** — texten
skrivs för hand i husformat — och ett ord som visar sig inte vara en etablerad term
läggs inte in, utan motiveras bort i `data/ordlista_luckor_ignorerade.json`.

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

Så ser de 10 937 posterna faktiskt ut: **ordklasstaggen först**, böjningen i parentes direkt
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
| adjektiv på `-ad`/`-erad` (particip) | `(-e)` | `protraherad`, `retarderad` |
| adjektiv på `-bel`/`-abel` | `(-t, pl. -bla)` | `kompatibel`, `reversibel` |
| dubbel ordklass | `(-t, -a; -en, pl. -er)` | `adenoid`, `analog` |

Vid dubbel ordklass skiljer **semikolon** sinnena, och ordningen följer taggen:
`adj./subst.` ⇒ adjektivböjningen först. Parentesen **måste börja med bindestreck**
(eller `pl. -`) — annars ser mätsnutten posten som obojd och den ligger kvar i
arbetslistan för alltid.

**Pluralen skrivs alltid med `pl.`, och ett substantiv bär alltid sin bestämda form.**
`(-en, -er)` och `(pl. -er)` är båda otillåtna: den första saknar `pl.`, den andra
saknar bestämd form. Ingen av dem syns i mätsnutten ovan — de räknas som bojda — så de
kan ligga kvar hur länge som helst. 325 respektive 3 poster rättades i 0.9.351, och
`generate_glossary.py` **hård-felar** nu på båda formerna, precis som på en otaggad post.
Undantagna är adjektivens `(pl. -a)` och `-um`-läkemedlens `(pl. antibiotika)`, som
saknar bestämd form med rätta; kontrollen kräver bindestreck + svensk pluraländelse.

**Kända avvikelser, rör dem inte i förbifarten:** fem K-verb skriver
`(-ar, -ade, -at)` i stället för `(-r, -de, -t)` (*katalysera*, *kateterisera*,
*kauterisera*, *koagulera*, *konisera*), och oförändrad plural förekommer i tre
skrivningar — `pl. -∅` (80 poster), `pl. -` (12) och `pl. =` (11). `-∅` är husets
form för nya poster.

**Latinsk plural skrivs `(pl. …)`, aldrig `(plur. …)`** — `nevus (pl. nevi)`,
`neuroleptikum (pl. neuroleptika)`, `nares (pl., lat.)`. 219 poster mot 8 innan
0.9.354.

**Ett uppslagsord som bara finns i plural skrivs `(pl.)`, inte `(plural)` eller
`(plur.)`.** N-passet trodde `(plural)` var husformen (utifrån tre exempel:
`nässelutslag`, `mollusker`, `klimakteriebesvär`) utan att räkna hela filen —
en helfilsräkning i R-passet (0.9.361) visade att den bara skrivna, korta
`(pl.)` är den faktiska majoritetsformen: **31** poster mot 13 `(plural)` och
4 `(plur.)`. `(pl.)` normaliserat i R:s två (`radikulära smärtor`, `ragader`);
`psykofarmaka`/`protektiva ämnen` (P) står kvar med `(plur.)` och rättas när
en bokstavspass ändå rör dem. Samma mätfälla som språktaggarna ovan —
`(plural)`/`(plur.)`/`(pl.)` börjar inget av dem med bindestreck, så alla tre
är osynliga för mätsnutten oavsett vilken som väljs; skillnaden är bara
inbördes konsekvens.

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

### Etymologinotation — och vilka poster som ska ha etymologi

Härlett i A-passet (0.9.370), efter samma metod som böjningen: mät hela bokstaven,
kategorisera varje "saknas"-post innan något skrivs. **Facit av A: 380 poster
saknade enligt mätsnutten, bara 45 (11,8 %) var faktiska luckor.** Användarens
egen misstanke ("det är inte så många som listan säger") stämde och är
utgångspunkten för varje kommande bokstav — förvänta en liknande kvot, inte 1:1.

**Placering:** `Av lat./gr. …` står som **egen mening efter** `Eng.`/`Sv.`/`Vardag.`
och **före** `Jfr `/`ICD-10: `/`ICD-11: `/`Referensvärde`/`Motsats:` — aldrig sist.
Exempel: `…Eng. amylase. Av lat. amylum = stärkelse. Referensvärde (…): … Jfr …`
(`amylas`). Saknas alla tre tail-fält, läggs den sist i meningen.

**"Saknas" är samma sorts tak som böjningen, inte en arbetslista.** Sex kategorier
är motiverade undantag, i fallande andel av A:s 380:

1. **Förkortningar** (`förk.`) — expansionen i brödtexten ÄR ursprungsförklaringen.
   En extra `Av eng. …` tillför inget (redan skrivet i husformatsavsnittet ovan).
   **Sök efter ALLA TRE formerna** när du filtrerar fram en bokstavs förkortningar:
   posten kan börja direkt med `förk.`, med `subst. (förk.)`, ELLER med
   `subst. förkortning` (utan parentes) — P-passet (0.9.386) missade 43 av 68
   för att söksträngen bara matchade den första formen. T-passet (0.9.390)
   hittade den tredje varianten (`TAP`, `TB`, `TS`) genom att proaktivt lägga
   till en tredje sökning, en lärdom från P applicerad i förväg.
2. **TA-/latinska flerordsfraser** där uppslagsordet redan är på latin/grekiska
   (`articulatio genus`, `aorta abdominalis`, `ansa cervicalis`) — samma undantag
   som böjningen. Termen ÄR redan sitt eget ursprungssvar; `Sv. `-översättningen
   räcker. **Undantag från undantaget:** enskilda, vanligt förekommande kliniska
   latin-/grekfraser (inte en systematisk TA-serie) FÅR en `Av lat./gr. X = Y + Z
   = W`-nedbrytning om den tillför — `otitis media`, `pectus excavatum`,
   `placenta praevia` har redan det. Gränsen är register: en TA-anatomisk
   namnserie (leder, kärl, muskler) byggd på samma mönster i hundratals varianter
   behöver inte upprepningen; en enskild, namngiven klinisk diagnos gör.
3. **Sammansättningar av redan glosade svenska/medicinska led** — roten bär sin
   etymologi på sin EGEN post, och en sammansättning ska inte upprepa den.
   `aortaklaff`, `autoimmun sjukdom`, `antikropp`, hela OT-/psykiatribatchen
   (`Aktivitets-`/`Arbets-`) hör hit. **Kontrollera alltid roten i filen
   innan den avfärdas** — `autoimmun`, `affekt`, `anestesi`, `koagulation`,
   `astma`, `arytmi` har alla redan `Av gr./lat. …` på sin egen post.
4. **Arkaiska latinska diagnosnamn** vars moderna svenska syskon redan bär
   etymologin (`apoplexia cerebri` → `apoplexi`, `cholera` → `kolera`,
   `hysteria` → `hysteri`) — samma mönster som hela [[project_archaic_terms]]-
   importen. Skriv INTE etymologin på båda; den hör hemma på den moderna formen.
5. **Varunamn** (`antabus`).
6. **Redan besvarade, osynliga för mätregexen** — se stycket i fälttäckningen
   ovan ("Etymologimätningen har samma sorts blinda fläck"). 24 av A:s 380 satt
   här. Kontrollera ALLTID för `Efter `/`beskrevs … av`/`Bildat av`/`Namnet är`/
   `Ändelsen -`/`Av <ord> \+ <ord>` (utan språkkod) innan en post räknas som tom.

**Metod för de faktiska luckorna: slå upp roten i FILEN, gissa aldrig fritt.**
En standalone grekisk/latinsk/arabisk fackterm får etymologi när jag har hög
säkerhet i den vedertagna nedbrytningen — helst bekräftad av att ett syskonord
redan bär samma rot i filen (`arterioskleros` skrevs mot redan-bojda
`ateroskleros`/`aorta`/`skleros`; `artroskopi` mot `artros`; `appendicit` mot
`appendix`). **`anti-`-läkemedelsklasser** (`-ikum`/`-ivum`, `subst. (pl. …)`)
följer exakt `antibiotikum`s mönster (`Av gr. anti- = mot + bios = liv`) —
kontrollera bara att förledsroten redan är belagd (`antiarytmikum` mot `arytmi`,
`antidiabetikum` mot `diabetes`, osv.) innan den återanvänds i en ny post.

**Eponymer: `Efter [yrke] [namn]`, årtal ENDAST vid hög säkerhet.** Samma
försiktighet som H-passets Golgi/Guglielmi/Herxheimer. Är jag inte säker på ett
exakt årtal (födelseår, publiceringsår) — utelämna det hellre än att gissa en
siffra som blir ett falskt faktapåstående i en offentlig ordbok. `alzheimers
sjukdom` fick 1906 (mycket väldokumenterat); `Angelmans syndrom`/`Aspergers
syndrom`/`Allis-klämma`/`Adson-pincett` fick bara namn + yrke + nationalitet.

**Vad som INTE ska skrivas:** en gissad, plausibel-låtande men obekräftad
nedbrytning. Hellre en lucka kvar än en felaktig "fakta" i en sökbar ordbok —
samma princip som böjningens `Kalomel`/`Karbidopa` (lämnade obojda hellre än
gissade).

**Två fynd till från B-passet (0.9.371), båda värda att kolla i varje
kommande bokstav:**

1. **En `Lat. X.`-tagg är INTE en etymologi.** Den ger bara den formella
   latinska/vetenskapliga namnformen på en svensk vardagsterm (`bronkit …
   Lat. bronchitis.`, `botulism … Lat. botulismus.`, `Barretts esofagus …
   Lat. oesophagus Barrett.`) — helt separat information från `Av lat./gr.
   X = Y`, som förklarar vad ordet **betyder**. En post med bara `Lat. `-tagg
   är alltså fortfarande en riktig etymologilucka, inte klar. B-passet gav
   fyra sådana poster (`bronkit`, `botulism`, `basaliom`, `bakteriell
   vaginos`) en riktig `Av …`/`Ändelsen …`-etymologi utöver den befintliga
   `Lat. `-taggen.
2. **Ett bart `(eng.)`/`(lat.)`-taggat ord där uppslagsordet är IDENTISKT
   med `Eng. `-fältet är sitt eget ursprungssvar** — samma princip som
   TA-flerordsfraserna (kategori 2), fast för enskilda oöversatta lånord:
   `bias`, `bypass`, `biofeedback`, `Box and Blocks Test`, `Barthel Index`
   (innan eponymen lades till). Taggen säger redan "det här är engelska/
   latin, oöversatt" — en `Av eng. bias = bias`-mening hade varit cirkulär.
   **Gäller inte om ordet är en eponym** (uppkallat efter en person) — då
   krävs ändå `Efter [yrke] [namn]`, som för `Barthel Index`/`Berg Balance
   Scale`/`BDI` nedan; taggen svarar bara på SPRÅK-frågan, inte VEM-frågan.

**Eponymer gäller även förkortningsposter utan egen utskriven syskonpost.**
`BCS` (Budd-Chiaris syndrom) och `BDI` (Beck Depression Inventory) fick
`Efter …` skrivet direkt på förkortningsposten, eftersom ingen fullt
utskriven post för det bakomliggande namnet finns någon annanstans i filen.
`BBS` (Berg Balance Scale) fick INGEN egen `Efter`-mening — sifferexemplet
finns redan på syskonposten `Berg Balance Scale` i samma fil, samma
"roten bär sin etymologi på sin EGEN post"-princip som kategori 3.

**Ett helt kluster av redan-skrivna, mätsnutts-osynliga läkemedels-/
växtetymologier upptäcktes i B** (`Berberis vulgaris`, `Boswellia sacra`,
`Banisteriopsis caapi`, `Barbital`, `Bacitracin`, `Beklometason`,
`Betametason`, `Bensylpenicillin`, `Bleomycin`, `Busulfan`) — alla bär redan
fullständiga, korrekta etymologier (`Bildat av …`, `Sammandragning av …`,
`Ändelsen -X av …`, eller `Av <ord> + <ord med språkkod längre in i
meningen>`), bara i en formulering mätregexen inte fångar. Samma mönster
gäller `bakteriell`-familjens `Av bakterie + gr. …`-poster
(`baktericid`/`bakteriemi`/`bakteriostatisk`/`bakteriuri`/`bakteroid`,
redan klara sedan tidigare) — språkkoden sitter efter `+`, inte direkt efter
`Av `. **Kontrollera alltid hela meningen, inte bara de första två orden,
innan en post räknas som lucka.**

**C klar 0.9.373** (2026-08-04): av 1 040 C-poster saknade 185 enligt
mätsnutten, bara **24 (13,0 %) faktiska luckor** — samma kvot som A och B.
Kategorifördelningen av de 161 motiverade undantagen: 96 förkortningar, 21
TA-/latinska flerordsfraser (systematisk serie, t.ex. `colon ascendens/
transversum/sigmoideum` — roten `colon` bär redan `Av grek. kolon =
tjocktarm`), 16 redan-skrivna men mätsnutts-osynliga poster (samma
läkemedels-/växtkluster-mönster som B: `Cinchona officinalis`, `Coffea
arabica`, `Camellia sinensis`, `Cola nitida`, `Colchicum autumnale`, `Catha
edulis`, `Carapichea ipecacuanha`, `Chaulmoograolja`, samt läkemedlen
`Captopril`, `Cefalotin`, `Cefotaxim`, `Cimetidin`, `Ciprofloxacin`,
`Ciklofosfamid`, `Cinnarizin`, `Citalopram`, `Clobetasol`), och resten
sammansättningar av redan i filen glosade rötter (`cervixcancer`→`cancer`,
`cardioselektiv`→`cardio-`/`selektiv`, `cellulit`s `-itis`-familj där andra
led redan var etablerade, `carcinoid`→`-karcinom`/`-oid` osv. — kontrollerat
med `grep` mot varje rot, inte gissat).

**Nytt fynd i C: "enskild namngiven klinisk diagnos" (kategori 2:s
undantag-från-undantaget) användes för första gången på riktigt.**
Regeln fanns redan (”otitis media, pectus excavatum, placenta praevia”) men
hade inte utlöst en ny post tidigare. Fem fristående latinska klinisktermer
sedan tidigare **helt utan familj i filen** fick en egen nedbrytning:
`claudicatio` (`Av lat. claudicare = halta`), `commotio cerebri` (`Av lat.
commovere = sätta i rörelse, skaka + cerebrum = hjärna`), `caput
succedaneum` (`Av lat. caput = huvud + succedaneum = som kommer i stället,
ersättande`), `coarctatio aortae` (`Av lat. coarctare = trånga in,
sammanpressa + aorta`), `calculus dentalis` (`Av lat. calculus = liten sten
(egentligen räknesten) + dentalis = tand-`). Skillnaden mot `colon
X`/`coma X`/`corpus X`/`cortex X` (skip) är att de senare är en **systematisk
serie** byggd på en redan etablerad rot (`colon`, `koma`, `membrana`), medan
de fem tillagda är **ensamma** i sin familj — ingen annan post i filen delar
deras stam.

**Fyra standalone fackord fick etymologi mot en bekräftad rot i filen**, som
i A/B: `cellulit` (`Av lat. cellula = liten cell + -itis = inflammation`,
`cella` och `-itis` redan glosade), `cefalosporin` (samma fakta som redan
stod på `Cefalotin`s post — `Av svampsläktet Cephalosporium, grek. kephale =
huvud + spora = frö`, flyttad till familjens rotpost), `candidiasis` (`Av
Candida, lat. candidus = vit, skinande + gr. -iasis = sjukligt tillstånd`
— gör `candida-vaginit`/`candidos` till kategori-3-sammansättningar av den
nya roten), `canalolithiasis` (`Av lat. canalis = kanal + gr. lithos = sten
+ -iasis`, `canalis` och `lithos`/`-iasis`-mönstret redan belagda via
`kolelitiasis`). `Cyklotymi` fick sin etymologi genom att spegla
syskonordet `dystymi`s redan skrivna `Av gr. dys- = svårt + thymos = sinne`
→ `Av gr. kyklos = cirkel + thymos = sinne`.

**Tre lånord och en historisk folketymologi:** `Coping` (`Av eng. cope =
klara av, hantera` — saknade `(eng.)`-taggen som annars hade gjort den till
ett rule-2-undantag), `chock` (`Av fr. choc = stöt, sammanstötning`),
`comedon` (`Av lat. comedo = frossare, av comedere = äta upp` — den
historiska föreställningen om en matmask i huden), `covid-19` (`Bildat av
engelskans "corona virus disease 2019"`, samma `Bildat av`-mönster som
läkemedelsnamnen).

**Nio eponymer i husformat `Efter den [nationalitet]e [yrke] [Namn]`,**
tre av dem på förkortningsposter helt utan utskriven syskonpost (samma regel
som B:s `BCS`/`BDI`): `Cheyne-Stokes andning`, `Crohns sjukdom` (årtal 1932,
hög säkerhet), `Cushings syndrom` (årtal 1932, hög säkerhet), `Conns
syndrom`, `Creutzfeldt-Jakobs sjukdom`, `Centor criteria`, `Child-Pugh
score`, samt `CMT` (Charcot-Marie-Tooths sjukdom, tre namngivna upptäckare)
och `CNC` (Carney-komplex) och `CSS` (Churg–Strauss syndrom, ett kvinnligt
och ett manligt namn — kontrollerade grammatiskt kön i "den … -e/-a
patologen"-frasen separat för varje namn).

Etymologitäckning 70,9 % → **71,0 % (7 757 av 10 928, 3 171 saknar).**
`check_generators.py`: rundtripp identisk, 407 filer oförändrade efter 18
generatorsteg, 195 tester gröna, 2 351/2 351 tooltip-ankare hela.

**D klar 0.9.374** (2026-08-04): av 431 D-poster saknade 153 enligt
mätsnutten, bara **19 (12,4 %) faktiska luckor** — samma kvot som A/B/C.
Kategorier: 45 förkortningar, 6 TA-/latinska flerordsfraser, 16 redan-skrivna
men mätsnutts-osynliga poster (`diskektomi` hade redan `Av diskus + gr.
ektome`; `Dakarbazin`/`Dapson` hade `Sammandragning av`/`Förkortning av`
det kemiska namnet; `Doxorubicin` hade `Av en hydroxylgrupp (doxo-) …`;
`Droperidol` "Besläktat med haloperidol"), resten sammansättningar av
redan glosade rötter. **`de-`-prefixet (`Av lat. de = från, bort`) visade
sig bära nästan hela bokstaven** — 15 av D:s `de-`-verb/-substantiv
(`defibrillator`, `degradering`, `dekompensation`, `dekompression`,
`demineralisation`, `demyelinisering`, `denervering`, `depersonalisation`,
`depigmentering`, `depolarisation`, `derealisation`, `desensibilisering`,
`desorientering`, `detoxifiering`) är kategori 3 rakt av eftersom BÅDA
leden redan är etablerade i filen (`myelin`, `toxin`, `kompensation` m.fl.
har egna `Av`-meningar sedan tidigare bokstäver). Samma sak för `dansterapi`
(`terapi` etablerad), `datortomografi` (`tomografi` etablerad),
`dilatera`/`dilaterad ven` (`dilatation` bär redan `Av lat. dilatare =
vidga`) och `deskvamera` (`squama` etablerad, `Av lat. squama = fjäll`).

**Metodfynd: "kontrollera roten i filen" kan avslöja att en planerad
tillägg redan är onödigt.** `dilatera` var tilltänkt för en egen etymologi
tills sökningen visade att syskonordet `dilatation` redan bär exakt samma
verb (`Av lat. dilatare`) — samma sak för `deskvamera` mot `squama`. Två
mindre lyckade kandidater (`demarkera`, `denguefeber`) lämnades som
**äkta luckor** trots delvis kända ursprung: `demarkera`s exakta
långivarspråk (franska vs. spanska vs. medeltidslatinets `marca`) gick
inte att fastställa med tillräcklig säkerhet, och `dengue` har en
omtvistad etymologi (swahili via spanska, eller tvärtom) i etablerade
källor — hellre en lucka än en gissning som kan vara fel.

**Fem standalone fackord fick etymologi mot bekräftad rot i filen:**
`dissektion` (`secare = skära`, samma rot som redan-etablerade `resektion`),
`dyslexi` (`dys-` etablerad via `dystrofi`/`dyskinesi`, `lexis = ord, tal`
ny), `dysdiadokokinesi` (`kinesis = rörelse` etablerad via `dyskinesi`,
`diadochos` ny), `dermatofytos` (`derma = hud` etablerad via
`dermatit`/`dermatologi`, `phyton = växt` ny), `diuretikum` (`dia-` +
`ourein = kissa`, fristående grekisk fackterm). Tre rena standalone-ord:
`dislokera` (`Av lat. dis- = isär + locare = placera`), `deviera` (`Av lat.
deviare, av via = väg`), `diaforetisk` (`Av gr. diaphorein = bära igenom`),
`deprivation` (`Av lat. deprivare, av privus = enskild`), `debris` (`Av fr.
débris, av briser = bryta sönder`), `dominans` (`Av lat. dominari, av
dominus = herre`). Två kemiska bildningar (`Bildat av`-mönster som C-passets
läkemedel): `dopamin` (`Bildat av DOPA + amin`), `diazepam` (`di- + azepin,
en kväveinnehållande sjuring`). `difteri` hade bara en `Lat. diphtheria.`-
tagg (samma B-passfälla — den formella namnformen är inte en förklaring)
och fick sin riktiga etymologi: `Av gr. diphthera = läderhud, hinna`.
`dränage` fick roten (`Av eng. to drain … via fr. drainage`); `drän`,
`dränera` och `dränering` är sammansättningar/avledningar av den och
förblir kategori 3.

**Fyra eponymer i husformat**, alla med full utskriven syskonpost (inga
förkortningar krävde `Efter` den här bokstaven): `Downs syndrom` (årtal
1866, hög säkerhet), `Duchennes muskeldystrofi`, `Dupuytrens kontraktur`,
`DeBakey-pincett`.

Etymologitäckning 71,0 % → **71,1 % (7 770 av 10 928, 3 158 saknar).**
`check_generators.py`: rundtripp identisk, 407 filer oförändrade efter 18
generatorsteg, 195 tester gröna, 2 351/2 351 tooltip-ankare hela.

**E klar 0.9.375** (2026-08-04): av 402 E-poster saknade 176 enligt
mätsnutten, men denna gång **33 (18,8 %) faktiska luckor** — en klart
högre kvot än A/B/C/D (12–14 %). Orsaken: bokstav E domineras av
`e-`/`ex-`/`epi-`/`endo-`-prefixade fristående grekiska/latinska
fackord, precis den ordtyp som kvalificerar för tillägg, snarare än
svenska sammansättningar av redan etablerade led.

**Metodfynd: samma "kolla roten i filen"-disciplin räddade nio
tilltänkta tillägg som redan var täckta**, mer än i något tidigare pass
— ett bevis på att metoden fungerar, inte ett tecken på slarv. Efter en
första bred kandidatlista på 41 ord visade en rotkontroll att nio redan
hade sin etymologi täckt av en etablerad syskonpost och ströks:
`ejektionsfraktion` (`fraktur` bär redan `Av lat. frangere`), `eruptiv`
(`ruptur` bär redan `Av lat. rumpere`), `excentrisk` (`centrum`/`central`
bär redan `Av lat. centrum, av grek. kentron`), `exspirium`
(`respiration` bär redan `Av lat. respirare`), `egodyston`/`egosynton`
(`tonus` bär redan `Av grek. tonos`), `expektorat` (`pectus excavatum`
bär redan `Av lat. pectus … + excavare`), `eradikation` (`radix` bär
redan `Av lat. radix = rot`), `exkavera` (`kavitet`/`pectus excavatum`
bär redan `Av lat. cavitas, av cavus`). **Två mönster upprepades från
tidigare bokstäver:** ett ord kan dela exakt SAMMA latinska verb som en
redan etablerad post (`exkavera`/`excavare` = ordagrant samma verb som
i `pectus excavatum`s etymologi), eller bara dela roten (`erysipelas`
delar `erythros = röd` med redan-etablerade `erytrocyt`, men fick ändå
sin egen etymologi eftersom den andra leden, `pella = hud`, var ny).

**24 standalone fackord/lånord mot antingen ny rot eller en rot delvis
bekräftad i filen:** `echinococcus`, `ekografi` (etablerar `graphein =
skriva` för framtida bruk), `eksem`, `ektopisk graviditet` (etablerar
`topos = plats`), `elektrolyt` (bärnsten-fakta om `elektron`),
`elimination`, `emulsion`, `endokrinologi` (`krinein` ny trots att
`endo-`/`logos` redan fanns via `epi-`/`dermatologi`), `endoskopi`
(etablerar `skopein = betrakta`), `enteroklysis` (`enteron` redan
etablerad via `enterit`, `klysis` ny), `entesopati` (`pathos` redan
etablerad via `patologi`, `enthesis` ny), `epidemiologi`, `epikantus`,
`episiotomi`, `eponychium`, `eponym`, `ergoterapi` (`ergon = arbete`
ny), `ergotism`, `erodera`, `erysipelas`, `esotropi`/`exotropi`
(symmetriskt par, etablerar `trope = vändning`), `evakuering`,
`evaluering`, `evaporation`, `excitabilitet`, `exfoliering`,
`exstirpera`, `exsudation`. Ett `Bildat av`-mönster: `EMLA-kräm` (`Av
engelskans Eutectic Mixture of Local Anesthetics`).

**Tre eponymer**, en av dem ett bakteriesläkte snarare än en person-
diagnos: `ehrlichios` (bakteriesläktet `Ehrlichia` uppkallat efter Paul
Ehrlich — samma "genus är uppkallat efter forskaren"-mönster som C-
passets `Corti`), `Epstein-Barr-virus` (Michael Epstein och Yvonne Barr,
1964, hög säkerhet), `Ehlers-Danlos syndrom` (Edvard Ehlers och Henri-
Alexandre Danlos). **Ett fynd avfärdat, inte en eponym trots namnet:**
`Epworth Sleepiness Scale` är uppkallad efter Epworth Hospital i
Melbourne (i sin tur uppkallat efter en plats i England) — en institu-
tions-/ortnamnskedja, inte en person, och passar därför inte husformatet
`Efter [yrke] [namn]`. **Två äkta luckor lämnade pga. osäkert ursprung**
(samma försiktighet som D-passets `demarkera`/`denguefeber`): `etanol`
(oklar exakt lånkedja för `-ol`-ändelsen) och `eskarotomi` (`eschara`s
exakta klassiska betydelse för osäker för en säker nedbrytning).

Etymologitäckning 71,1 % → **71,4 % (7 799 av 10 928, 3 129 saknar).**
Nästa bokstav: F. `check_generators.py`: rundtripp identisk, 407 filer
oförändrade efter 18 generatorsteg, 195 tester gröna, 2 351/2 351
tooltip-ankare hela.

**F klar 0.9.376** (2026-08-07): av 632 F-poster saknade 158 enligt
mätsnutten, bara **18 (11,4 %) faktiska luckor** — tillbaka till A–D:s
kvot efter E:s högre 18,8 %. Kategorier: 34 förkortningar, 13 poster som
redan bar en etymologisk not mätsnutten missade (samma läkemedelskluster-
mönster som B/C: `Fenobarbital`, `Fenoximetylpenicillin`, `Fenytoin`,
`Flukonazol`, `Flufenazin`, `Fluorouracil`, `Fluoxetin`, `Flunitrazepam`,
`Flurazepam`, `Furosemid` — alla `Av <ord> (+ <ord>)`-formuleringar utan
språkkod direkt efter `Av `; `flimmer` `Av lågty. flimmern`, samt
eponymerna `Falloppio`/`Fontana`/`fowlerläge` som redan hade
`Efter …`/`Uppkallat efter …`), resten sammansättningar av redan i
filen glosade rötter.

**Rotkontrollen räddade ovanligt många tilltänkta tillägg — högsta
antalet hittills.** Nästan varenda kandidat med ett klassiskt förled
visade sig redan täckt: `fertilitet` (`fertil`), `filarier`/
`follikelcysta`/`follikulit` (`follikel`, `Av lat. folliculus = liten
säck`), `fixera`/`fixering` (`fixus`, `Av lat. figere = fästa`),
`flebografi` (`phleb-`/`graphein`, båda redan egna prefixposter),
`femurfraktur`/`femurkondyl`/`femoralbråck` (`femur`), `fibrinogen`
(`fibrin` + `gen`, båda etablerade oberoende av varandra),
`fasciotomi` (`fascia` + grekiskans `tome` via `flebotomi`),
`faryngit` (`farynx`), `fenylketonuri` (`fenyl` via `Fenobarbital` +
`-uri` via `ketonuri`), `flimmerepitel` (`epitel`), `fungistatisk`
(`fungi-` + `statikos` via `bakteriostatisk`), `familjeanamnes`/
`framhornsneuron`/`födoämnesallergi` (`anamnes`/`neuron`/`allergi`,
alla redan egna poster). **Hela OT-/psykiatribatchen** (`Förstämning`,
`Fobisk personlighetsstörning`, `Frontotemporal demens`,
`Familjeterapi`, `Försvarsmekanism`, `Förnekelse`, `Förstärkning`,
`Funktionsnivå`, `Förskrivning`, `Funktionsförmåga`,
`Funktionsnedsättning`, `Funktionshinder`, `Finmotorik`) följde samma
mönster som A-passets Aktivitets-/Arbets-batch — svenska sammansättningar
vars klassiska led redan är glosade eller inte finns i filen.

**Nytt mönster: arkaiska/vardagliga svenska namn vars TEKNISKA syskon
redan bär etymologin.** Samma logik som regel 4 (arkaiska latinska
diagnosnamn), fast riktningen vänd — det är den svenska vardagstermen
som saknar `Av …` medan den latinska facktermen redan har den:
`frossa` → `malaria` (`Av ital. mala aria = dålig luft`),
`fönstertittarsjuka` → `claudicatio` (`Av lat. claudicare = halta`),
`fetma` → `obesitas` (`Av lat. obesus = fet`), `förstoppning` →
`obstipation` (`Av lat. obstipare = packa tätt`), `födelsemärke` →
`nevus` (`Av lat. naevus = födelsemärke`). Etymologin skrivs på den
tekniska termens post, inte upprepas på den svenska. **Samma mönster
men UTAN att syskonet ännu finns:** `franska sjukan`/`fransosen`
hör hemma på `syfilis`, `förgiftning` på `intoxikation`,
`förkylning`/`rinit` redan besvarad `rinit`-post — men syfilis och
intoxikation saknar själva etymologi ännu (S/I är inte etymologi-
passade), så luckan flyttas dit i stället för att fyllas i förtid på
fel bokstav.

**18 fick riktig etymologi, i två grupper:**
1. **14 fristående fackord/lånord** mot ny eller delvis bekräftad rot:
   `fenomenologi` (`Av gr. phainomenon = det som visar sig + logos =
   lära` — samma `phainein`-rot som redan-bojda `fenotyp`),
   `feokromocytom` (`Av gr. phaios = mörk, grå + chroma = färg + kytos
   = cell + -oma = svulst` — tre av fyra led redan etablerade via
   prefix-/suffixposterna `-chrome/-krom`, `-cyte/-cyt`, `adenom`;
   bara `phaios` nytt), `fermentering`, `fluor` (`Av lat. fluor =
   flöde, av fluere = flyta` — gäller båda betydelserna, flytning och
   grundämnet), `flush` (bar inte den vanliga `(eng.)`-taggen och
   föll därför utanför kategori 2:s skydd), `fruktos`, `feber` (`Av
   lat. febris = feber`), `fläcktyfus` (`Av gr. typhos = dimma,
   dvala`, eftersom `tyfus` självt saknar egen post), `fimosis` (`Av
   gr. phimos = munkorg`), `fremitus` (`Av lat. fremere = brumma,
   dåna`), `ferritin` (`Av lat. ferrum = järn`), `fosfat` (`Av gr.
   phosphoros = ljusbärande, av phos = ljus + pherein = bära` — `phos`
   redan etablerad via `fotofobi`), `fatigue` (`Av fr. fatigue, av
   lat. fatigare = trötta ut` — som `flush` utan `(fr.)`-tagg),
   `fysiologi` (`Av gr. physis = natur + logos = lära` — exakt samma
   mall som redan-bojda `biologi`/`farmakologi`, gör `fysiologisk`/
   `fysioterapi` till sammansättningar).
2. **4 eponymer i husformat**, alla verifierade mot webbkällor innan de
   skrevs (namn/nationalitet/yrke/år): `Fagerströmtest` (den svenske
   psykologen Karl-Olov Fagerström, legitimerad 1975), `Farabeuf-
   retraktor` (den franske kirurgen Louis Hubert Farabeuf, 1841–1910),
   `Finochietto-retraktor` (den argentinske kirurgen Enrique
   Finochietto, 1881–1948), `Fallots tetrad` (den franske läkaren
   Étienne-Louis Arthur Fallot, 1850–1911, beskrev missbildningen
   1888).

**Flera grundord ("medicin", "kontraktur", "tyfus", "punktion",
"provokation") saknar EGEN post i filen men förekommer i flera
F-sammansättningar** (`flygmedicin`, `fysikalisk medicin`,
`flexionskontraktur`, `finnålspunktion`, `födoämnesprovokation`). Ingen
ny rotpost uppfanns mitt i F-passet för dem — sammansättningarna lämnades
som motiverade undantag (ren svensk/allmän sammansättning där den ena
leden inte har ett hem att peka mot), samma försiktighet som att inte
gissa fram en etymologi. `fläcktyfus` är undantaget: eftersom det är en
riktig, icke-arkaisk sjukdomsbeteckning (inte en sammansättning som kan
vänta på en bättre värdpost) fick den sin etymologi direkt.

Etymologitäckning 71,4 % → **71,5 % (7 813 av 10 928, 3 115 saknar).**
Nästa bokstav: G. `check_generators.py`: rundtripp identisk, 407 filer
oförändrade efter 18 generatorsteg, 195 tester gröna, 2 351/2 351
tooltip-ankare hela.

**G klar 0.9.377** (2026-08-07): av 266 G-poster saknade 118 enligt
mätsnutten, bara **15 (12,7 %) faktiska luckor.** 26 förkortningar, 12
poster som redan bar en etymologisk not mätsnutten missade (samma
läkemedels-/växtkluster-mönster som B/C/F: `Gentiana lutea`,
`Guaiacum officinale`, `Ginkgo biloba`, `Gaultheria procumbens`,
`Glyceroltrinitrat`, `Griseofulvin`, `Gentamicin`, `Glibenklamid`,
samt `gulsot` som redan hade `Av gul + sot (sjukdom)` — en helt
svensk, icke-språkkodad etymologimening som mätregexen inte kan se —
och eponymerna `Golgi`/`Galeazzi`/`Galvanismo` med redan skrivet
`Efter …`), resten sammansättningar av redan glosade rötter.

**Rotkontrollen bar nästan hela bokstaven — färre enskilda rotkoll-
fynd men fler ord per rot än i något tidigare pass.** `gaster` (`Av
grek. gaster = mage, buk`) gjorde ensam nio gastro-sammansättningar
till kategori 3 (`gastrektomera`, `gastrin`, `gastrinom`,
`gastroenterit`, `gastroenterologi`, `gastroesofageal`,
`gastrointestinaltractus`, `gastroskop`, `gastroskopi` — det gemen-
samma, igenkännbara ledet räcker, andra ledets suffix behöver inte
också vara belagt). `glukos` (`Av gr. glykys = söt`) bar på samma
sätt nio glyk-/gluk-ord (`glukagon`, `glukagonom`, `glukokortikoid`,
`glukoneogenes`, `glukosuri`, `glykemiskt index`, `glykogenolys`,
`glykolys`, `glykosid`), `granulum`/`granul-` sex granul-ord
(`granulation`, `granulationsvävnad`, `granulocyt`,
`granulocytopeni`, `granulocytos`, `granulom`), `gonad` tre gonado-ord
och `ganglion` två TA-fraser (`ganglia basalia`, `ganglion spinale`).
`gangraena` visade sig vara exakt samma ord som redan-bojda `gangrän`
(`Av gr. gangraina`), bara den latinska stavningsvarianten.

**15 fick riktig etymologi, i två grupper:**
1. **6 fristående fackord:** `glaukom` (`Av gr. glaukos = blågrön,
   grumlig` — samma B-passfälla som `bronkit`/`botulism`: posten bar
   bara en missvisande `Lat.`-namntagg, ingen riktig ordförklaring),
   `gonorré` (`Av gr. gone = säd + rhoia = flöde` — `rhoia`-roten
   redan belagd via redan-bojda `diarré`s `dia + rhein = flyta`),
   `gonioskopi` (`Av gr. gonia = vinkel + skopein = betrakta`),
   `galaktosemi` (`Av gr. gala (galaktos) = mjölk + haima = blod`),
   `gestagen` (`Av lat. gestare = bära, bära på + gr. -gen =
   alstrande`), `Grandiositet` (`Av lat. grandis = stor`).
2. **9 eponymer**, alla verifierade mot webbkällor innan de skrevs
   (namn/nationalitet/yrke/år): `gramnegativ`/`grampositiv` (danske
   bakteriologen Hans Christian Gram, 1853–1938, båda posterna fick
   varsin `Efter`-mening eftersom `Gram`/`gramfärgning` saknar egen
   post att peka mot), `Graves sjukdom` (irländske läkaren Robert
   James Graves, 1796–1853 — samma diagnos som redan-bojda `Basedows
   sjukdom` under ett annat namn, två oberoende eponymer för samma
   sjukdom), `giardia` (franske zoologen Alfred Giard + tjeckiske
   läkaren Vilém Dušan Lambl, samma "släkte uppkallat efter
   forskaren"-mönster som E-passets `ehrlichios`), `Guillain-Barré`
   (franska neurologerna Georges Guillain och Jean-Alexandre Barré,
   beskrev syndromet 1916), `Gigli-såg` (italienske kirurgen Leonardo
   Gigli, 1863–1908), `Guedel-tub` (amerikanske narkosläkaren Arthur
   Guedel, 1883–1956), `Gelpi-retraktor` (amerikanske kirurgen
   Maurice Gelpi, 1883–1939 — webbsökningen rättade en första,
   felaktig förnamnsgissning innan något skrevs), `Guglielmi`
   (självrefererande `Efter Guido Guglielmi`, samma mönster som redan
   klara `Golgi`/`Galeazzi`).

Etymologitäckning 71,5 % → **71,6 % (7 819 av 10 928, 3 109 saknar).**
Nästa bokstav: H. `check_generators.py`: rundtripp identisk, 407
filer oförändrade efter 18 generatorsteg, 195 tester gröna, 2 351/
2 351 tooltip-ankare hela.

**H klar 0.9.378** (2026-08-07): av 441 H-poster saknade 269 enligt
mätsnutten, men bara **20 (7,4 %) faktiska luckor** — klart lägre kvot
än någon tidigare bokstav (A–G låg på 11–19 %). Orsaken: H domineras
av två jättelika, redan etablerade prefixfamiljer. `hyper-`/`hypo-`
(`Av grek. hyper/hypo = över/under`, med posternas EGNA exempel
`hypertoni`/`hypotoni`) bar ensamma **73 ord** — praktiskt taget hela
`hyper-`/`hypo-`-vokabulären i filen (`hyperaldosteronism` …
`hypovolemisk chock`, plus den elidera formen `hypestesi` = `hyp-` +
`estesi` före vokal). `hem-/hemo-/hemato-` (`Av grek. haima = blod`,
etablerad via `hemoglobin`s `Av grek. haima + lat. globus`) bar 19
ord (`hemagglutination` … `hemostas`, `hematokrit`), och `hepat-/
hepato-` (`Av grek. hepar (hepatos) = lever`) bar 7 (`heparin`,
`heparinisera`, `hepatit`, `hepatocellulär`, `hepatocyt`,
`hepatomegali`, `hepatosplenomegali`, `hepatotoxisk` — `heparin`
namngavs efter LEVERN, inte blodet, en fälla värd att komma ihåg).
66 förkortningar, 10 poster som redan bar en etymologisk not
mätsnutten missade (läkemedelsklustret `Halotan`, `Hydrokortison`,
`Hydroklortiazid`, `Hydroxiklorokin`, `Haloperidol`, `Hydralazin`,
`Hydroxizin`, växtnamnet `Humulus lupulus`, eponymen `Heberdens
knutor`, samt `hysteri` vars etymologi stod skriven med **litet**
`av` mitt i löptexten — "namnet av gr. hystera = livmoder" — en
tredje variant av mätsnutts-blinda-fläcken utöver B-passets
`Lat. X.`-fälla och tidigare bokstävers `Av <ord> (`-mönster).

**Rotkontrollen bar en majoritet av hela bokstaven, samma mönster
som G-passets `gaster`/`glukos`/`granulum` fast i större skala.**
Redan etablerade rötter på andra bokstäver gjorde tiotals H-
sammansättningar till kategori 3 utan att något skrevs:
`eklampsi`/`preeklampsi` (→ `havandeskapsförgiftning`),
`luxatio`/`luxation` (→ `höftledsluxation`), `dysplasi` (→
`höftledsdysplasi`), `tumör` (→ `hjärntumör`), `trauma` (→
`huvudtrauma`), `psykologi` (→ `hälsopsykologi`), `infarkt` (→
`hjärtinfarkt`), `pylorus` (→ `Helicobacter pylori`), `tonsillit`
(→ `halsfluss`), `fasciit`/`fascia` (→ indirekt `hälsporre` via
`calcar`), `calcar` (→ `hälsporre`), `coxa` + `artros` (→
`höftledsartros`, båda halvorna redan belagda), `flexion`
(F-passet, → `handledsflexion`), `humerus` + `scapula` (→
`humeroskapulär`), `helmint` (→ `helmintisk`), `hallux` + `valgus`
(→ `hallux valgus`), `encefalit` (→ `herpesencefalit`),
`suppurativ` + `aden` (delvis, → `hidradenitis suppurativa`, se
nedan), `follikel`-mönstrets syskon `gangrän` (F/G-passen). **`gulsot`-
fyndet från G upprepade sig:** `Hodgkins lymfom` visade sig redan
täckt av syskonposten `non-Hodgkins lymfom`s `Efter läkaren Thomas
Hodgkin + grek. lympha = vatten` (skriven i ett tidigare pass, före
etymologietappen).

**20 fick riktig etymologi, i två grupper:**
1. **9 fristående fackord**, flera valda för att de etablerar en ny
   rot som redan syns täcka andra H-poster: `Hallucination` (`Av lat.
   hallucinari = vandra i tankarna, drömma`), `hidradenitis
   suppurativa` (`Av gr. hidros = svett + aden = körtel + -itis =
   inflammation` — `aden` och `suppurativ` redan etablerade, bara
   `hidros` nytt), `hamartom` (`Av gr. hamartia = fel, missbildning +
   -oma = svulst`), `hebefren` (`Av gr. hebe = ungdom + phren = sinne,
   förstånd`), `histamin` (`Av gr. histos = väv + amin` — etablerar
   `histos` för `histologisk`/`histopatologi`, kategori 3 direkt),
   `heterogenitet`/`homogenitet` (`Av gr. heteros/homos = annan/samma
   + genos = ursprung, art` — `genos` redan etablerad via `gen`),
   `haptoglobin` (`Av gr. haptein = binda, fästa + globin`, jfr
   `hemoglobin`), `herpes simplex` (`Av gr. herpein = krypa, kräla` —
   etablerar roten för `herpes zoster`/`herpetiform`/
   `herpesencefalit`, kategori 3 direkt).
2. **11 eponymer**, alla verifierade mot webbkällor innan de skrevs:
   `Huntingtons sjukdom` (George Huntington, amerikansk läkare,
   1850–1916, beskrev sjukdomen 1872), `Hirschsprungs sjukdom`
   (Harald Hirschsprung, dansk läkare, 1830–1916, 1886),
   `Hortons huvudvärk` (Bayard Taylor Horton, amerikansk läkare,
   1895–1980, 1939), `Hashimotos tyreoidit` (Hakaru Hashimoto,
   japansk kirurg, 1881–1934, 1912), `Harris Hip Score` (William H.
   Harris, amerikansk ortoped, 1969), `Holter-EKG` (Norman Holter,
   amerikansk biofysiker, 1914–1983), `Hohmann-retraktor` (Georg
   Hohmann, tysk ortoped, 1880–1970), `Heimlichs manöver` (Henry
   Heimlich, amerikansk thoraxkirurg, 1920–2016, 1974),
   `Henoch-Schönleins purpura` (Eduard Heinrich Henoch + Johann Lukas
   Schönlein, tyska läkare), `Horners syndrom` (Johann Friedrich
   Horner, schweizisk oftalmolog, 1831–1886, 1869), `Herxheimer`
   (självrefererande `Efter Karl Herxheimer`, samma mönster som redan
   klara `Golgi`/`Galeazzi`/`Falloppio`/`Fontana`).

Etymologitäckning 71,6 % → **71,6 % (7 828 av 10 928, 3 100 saknar).**
Nästa bokstav: I. `check_generators.py`: rundtripp identisk, 407
filer oförändrade efter 18 generatorsteg, 195 tester gröna, 2 351/
2 351 tooltip-ankare hela.

**I klar 0.9.379** (2026-08-07): av 490 I-poster saknade 244 enligt
mätsnutten, men bara **5 (2,0 %) faktiska luckor** — den lägsta
kvoten hittills, ännu lägre än H:s 7,4 %. Orsaken går längre än
H:s: `in-`/`im-` (`Av lat. in = i / in- = icke`, med posternas EGNA
exempel `injektion = införing` och `inkontinens = oförmåga att
hålla tätt`, och assimilationen till `il-`/`im-`/`ir-` uttryckligen
dokumenterad i prefixpostens egen text) bar **över 140 ord** helt
själv — praktiskt taget hela `im-`/`in-`-vokabulären. `inter-`
(`Ex: interkostal = mellan revbenen`), `intra-` (`Ex: intravenös =
inuti en ven`), `intro-` (`Ex: introvert = inåtvänd`) och `iso-`
(`Ex: isoton = med samma osmotiska tryck`) — fyra ytterligare egna
prefixposter — täckte ett tjugotal till. 57 förkortningar, 9 poster
som redan bar en etymologisk not mätsnutten missade (läkemedels-
klustret `Isoniazid`, `Indometacin`, `Ipratropiumbromid`,
`Isotretinoin`, `Imipramin`, `Indoramin`, `Inositolnikotinat`,
`Ibuprofen`, `Isosorbidmononitrat`).

**Rotkontrollen visade att nästan alla `in-`-sammansättningar redan
var täckta i BÅDA sina led, inte bara prefixet** — ett tydligare
mönster än i något tidigare pass: `infertil` (`fertil`, F-passet),
`impotens` (`potens`, `Av lat. potentia`), `immunitet`/
`immunkompetent` m.fl. (`immun` har en EGEN etymologi utöver den
generiska `in-`-posten), `iridocyklit` (`iris`), `ileocekal`/
`ileostomi` (`ileum` + `cekum`/`stoma`), `iliosakralled` (`ilium` +
`sacrum`), `iliopsoas` (`ilium` + `psoas`), `ischiopubicus`
(`ischion` + `pubis`), `isoenzym`/`isoton`/`isotop` (`iso-` +
`enzym`/`tonus`/`topos`, alla fyra redan belagda), `infibulation`
(`fibula` = spänne, inte bara skenbensordet), `irreponibel`/
`irreversibel`/`irrigation` (`ir-` = den dokumenterade
assimilationsformen av `in-`), `ischemisk` (`ischemi` bär redan
`Av gr. ischein = hejda + haima = blod`), `icterus` (samma ord som
redan-bojda `ikterus`, bara den latinska stavningen), `influensa`
(`in-` + `fluere`, båda leden redan belagda via F-passets `fluor`).

**5 fick riktig etymologi**, samtliga valda för att deras ANDRA led
saknade dokumentation trots att `in-`-prefixet redan var känt:
`impetigo` (`Av lat. impetere = angripa, av in- = mot + petere =
söka, anfalla` — `petere` fanns inte belagt någon annanstans i
filen), `inflammation` (`Av lat. inflammare = sätta i brand, av
in- + flamma = låga` — `flamma` ny), `insulin` (`Av lat. insula = ö,
efter de Langerhanska öarna i bukspottkörteln` — `insula` redan
etablerad via sin egen post, men kopplingen till hormonets namn
värd att skriva ut explicit). Två helt fristående ord utan
`in-`-koppling: `idiosynkrasi` (`Av gr. idios = egen + synkrasis =
sammanblandning, temperament`), `Irritabilitet` (`Av lat. irritare
= reta, egga`).

Etymologitäckning 71,6 % → **71,7 % (7 833 av 10 928, 3 095 saknar).**
Nästa bokstav: J. `check_generators.py`: rundtripp identisk, 407
filer oförändrade efter 18 generatorsteg, 195 tester gröna, 2 351/
2 351 tooltip-ankare hela.

**J klar 0.9.380** (2026-08-07): filens minsta bokstav (51 poster
totalt). Av 11 J-poster utan `Av lat./gr. …` var 4 förkortningar och
5 sammansättningar av redan glosade rötter: `anatomi` (`Av gr. ana- =
upp + tome = snitt`) täckte `jämförande anatomi`, `artrit`/`arterit`
täckte `jättecellsarterit`, och `juvenil` (`Av lat. juvenilis =
ungdomlig`) täckte `juvenil idiopatisk artrit` — där alla tre led
redan var belagda, inklusive `idiopatisk` via I-passets `idios`.
`järn`/`järnbristanemi` är rena svenska/germanska ord utan klassiskt
ursprung att bryta ner (`järn` är inte ett lånord, till skillnad från
grundämnets Latinska namn `ferrum`, som inte är uppslagsordet här).

**2 eponymer**, båda verifierade mot webbkällor innan de skrevs:
`Jebsen-Taylor hand function test` (de amerikanska läkarna Robert H.
Jebsen och Neal Taylor, publicerade testet 1969) och `Jackson-Pratt-
drän` (de amerikanska kirurgerna Frederick E. Jackson och Richard A.
Pratt, utvecklade dränet 1971).

Etymologitäckning oförändrad på **71,7 % (7 833 av 10 928, 3 095
saknar)** — båda tilläggen är `Efter`-eponymer, osynliga för
mätregexen precis som tidigare bokstävers eponymer. Nästa bokstav: K.
`check_generators.py`: rundtripp identisk, 407 filer oförändrade
efter 18 generatorsteg, 195 tester gröna, 2 351/2 351 tooltip-ankare
hela.

**K klar 0.9.381** (2026-08-07): av 286 K-poster saknade 146 enligt
mätsnutten, bara **10 (6,8 %) faktiska luckor**. 11 förkortningar,
32 poster som redan bar en etymologisk not mätsnutten missade —
läkemedels-/växtklustret `Kloroform`, `Klorpromazin`, `Klomipramin`,
`Klonidin`, `Karbidopa`, `Ketokonazol`, `Ketoprofen`, `Karbamazepin`,
`Kokain`, `Kinin`, grundämnet `kalium` (`Av nylat. kalium, av arab.
al-qaly = aska, pottaska`), eponymerna `Koebners fenomen`/`Kawasakis
syndrom`, och ett helt kluster kemiska/anatomiska `Av X + Y`-
förklaringar där språkkoden sitter efter `+` i stället för direkt
efter `Av` (samma B-passfälla som återkommit i varje bokstav sedan
dess): `kammartakykardi`, `karboanhydrashämmare`, `karcinomatos`,
`karpaltunnelsyndrom`, `katekolamin`, `kattklössjuka`,
`kemoprofylax`, `kemoreceptor`, `kemotaxis`, `ketoacidos`,
`ketonuri`, `koagulopati`, `koenzym`, `kolesteatom`, `kolinerg`,
`kollagenos`, `kolorektal`, `kompressionsfraktur`, `käkläsa`,
`klimakteriebesvär`.

**Nytt mönster upptäckt: en uttrycklig `Se X`-korsreferens till en
redan etablerad rot räcker för att stänga hela klustret utan att
något skrivs.** Ett dussintal K-poster avslutar sin definition med
`Se Kardiologi`/`Se Katarr`/`Se Kateter`/`Se Keratin`/`Se
Koagulation` (fyra gånger) osv. — när målposten redan bär `Av
lat./gr. …` är det uttryckliga beviset på att sammansättningen
räknats som kategori 3 med avsikt, inte bara implicit antaget:
`kardiologisk` (`Se Kardiologi`), `katarral` (`Se Katarr`),
`kateterisera` (`Se Kateter`), `keratinisering` (`Se Keratin`),
`keratolytikum` (`Se Keratolys`), `koagulas`/`koagulationsfaktor`/
`koagulationstid`/`koagulera` (`Se Koagulation`), `koarktation av
aorta` (`Se Koarktation`), `kollateralkretslopp` (`Se Kollateral`),
`kolon descendens`/`kolonflora` (`Se Colon`), `komorbid` (`Se
Komorbiditet`), `kompatibilitet` (`Se Kompatibel`),
`kompressionsbrott` (`Se Kompressionsfraktur`, som själv är kategori
6 ovan), `kolorektalcancer` (`Se Kolorektal`, också kategori 6).
**Samma mönster utan uttrycklig `Se`-länk** stängde två hela ordfamiljer
på en gång: alla tio `klinisk X`-specialiteter (farmakologi,
fysiologi, genetik, immunologi, kemi, mikrobiologi, neurofysiologi,
nutrition, patologi, psykologi) täcktes av `klinisk`s egen `Av gr.
kline = säng`, och hela `Kognitiv X`/`Kognition`-serien (sex poster)
av `kognitiv`s `Av lat. cognoscere = lära känna`.

**10 fick riktig etymologi:** `katarakt` (`Av gr. katarrhaktes =
vattenfall`, syftar på den grumlade synen — bar ingen etymologi alls
trots att ordet redan använts i sju tidigare bokstäver, A–H),
`klimakteriet` (`Av gr. klimakter = kritisk tidpunkt i livet, av
klimax = stege, trappa` — gör den redan skrivna men ytliga noten på
`klimakteriebesvär`, "Av klimakterium = övergångsålder", begriplig på
riktigt först nu), `kreatinin` (`Av gr. kreas = kött, muskel`),
`kobalamin` (`Av kobolt, efter tyska bergsandan "kobold" — malmen
ansågs förhäxad, + amin`), `klamydia` (`Av gr. chlamys = mantel`,
efter inneslutningskropparnas form), `kyfos` (`Av gr. kyphos =
puckelryggig, krokig`), `Konfabulation` (`Av lat. confabulari =
samtala, av fabula = berättelse`) — samt 3 eponymer, alla verifierade
mot webbkällor innan de skrevs: `Klinefelters syndrom` (den
amerikanske läkaren Harry Klinefelter, 1912–1990, beskrev syndromet
1942), `Katz ADL` (den amerikanske läkaren Sidney Katz, 1924–2012,
publicerade indexet 1963), `Kocher-peang` (den schweiziske kirurgen
Emil Theodor Kocher, 1841–1917, nobelpristagare 1909).

Etymologitäckning 71,7 % → **71,7 % (7 839 av 10 928, 3 089 saknar).**
Nästa bokstav: L. `check_generators.py`: rundtripp identisk, 407
filer oförändrade efter 18 generatorsteg, 195 tester gröna, 2 351/
2 351 tooltip-ankare hela.

**L klar 0.9.382** (2026-08-07): av 432 L-poster saknade 85 enligt
mätsnutten, bara **9 (10,6 %) faktiska luckor.** 27 förkortningar,
14 poster som redan bar en etymologisk not mätsnutten missade —
läkemedels-/växtklustret `Lidokain` (med hela historien om de
svenska uppfinnarna Nils Löfgren och Bengt Lundqvist), `Lorazepam`,
`Lobelia inflata`, `Levisticum officinale`, eponymen `Lhermittes
tecken`, och ett kluster `Av X + gr./lat. Y`-förklaringar med
språkkoden efter `+` i stället för direkt efter `Av` (samma B-
passfälla): `laktosintolerans`, `ledläpp`, `levercirros`,
`luftemboli`, `lungemboli`, `lungödem`, `läkemedelsexantem`,
`läkemedelsresistens`, `lågvirulent`.

**Rotkontrollen bar en majoritet av bokstaven.** `laktat`/`laktos`/
`laktas` (alla `Av lat. lac`) täckte `laktacidos` tillsammans med
redan-bojda `acidos`; `lymfa`/`lymfocyt`/`lymfom` (`Av lat. lympha`)
täckte `lymfatisk leukemi`, `lymfocytisk` och `lymphogranulomatosis`
(tillsammans med redan-bojda `leukemi` och `granulom`). Var sin egen
etablerad rot täckte ytterligare en klunga: `lues` → `luetisk`,
`pneumoni` → `lunginflammation`, `fibros` → `lungfibros`, `letargi`
→ `letargisk`, `carcinoma` → `lungcancer`/`levercancer`, `hepar` →
`lever` (fast `lever` i sig är ett inhemskt germanskt ord, inte ett
lånord — `hepar` är bara den grekiska motsvarigheten), `laparoskopi`
→ `Laparoskop`, `lateral`/`latus` → `lateralrotation`.

**9 fick riktig etymologi:** `lordos` (`Av gr. lordos = bakåtböjd,
krokig` — motsatsen till K-passets `kyfos`, men saknade helt egen
etymologi trots att den använts sedan A), `lichen planus` (`Av gr.
leichen = lav + lat. planus = platt`, syftar på utslagets utseende),
`legionella` (`Bildat av engelskans "Legionnaires' disease", efter
ett utbrott bland deltagare i en amerikansk veterankonferens i
Philadelphia 1976` — en namnhistoria, inte en person-eponym, men
lika verifierbar) + 5 eponymer och 1 varumärkesförklaring, alla
kontrollerade mot webbkällor: `Langerhans` (självrefererande `Efter
Paul Langerhans`, samma mönster som redan klara `Golgi`/`Galeazzi`),
`Lewykroppsdemens` (den tysk-amerikanske neurologen Friedrich Lewy,
1885–1950, upptäckte inlagringarna 1912), `Lawton IADL` (den
amerikanske psykologen M. Powell Lawton och Elaine Brody,
publicerade skalan 1969), `Langenbeck-retraktor` (den tyske kirurgen
Bernhard von Langenbeck, 1810–1887), `Littles sjukdom` (den engelske
kirurgen William John Little, 1810–1894), `LigaSure` (`Bildat av
eng. ligate = avbinda + secure = säkra`, samma varumärkesnamns-
mönster som E-passets `EMLA-kräm`).

Etymologitäckning 71,7 % → **71,8 % (7 841 av 10 928, 3 087 saknar).**
Nästa bokstav: M. `check_generators.py`: rundtripp identisk, 407
filer oförändrade efter 18 generatorsteg, 195 tester gröna, 2 351/
2 351 tooltip-ankare hela.

**M klar 0.9.383** (2026-08-07): av 533 M-poster saknade 152 enligt
mätsnutten, bara **13 (8,6 %) faktiska luckor.** 36 förkortningar,
25 poster som redan bar en etymologisk not mätsnutten missade —
läkemedelsklustret `Medroxyprogesteron`…`Metotrexat` (elva
preparat), eponymerna `Malpighi`/`Morgagni`/`Monteggia`/`Mondini`/
`Marchiafava–Bignami`/`Modic`, `Morfin` (`Efter Morfeus, drömmarnas
gud i grekisk mytologi`) och ett kluster `Av X + gr./lat. Y`-
förklaringar med språkkoden efter `+` (samma B-passfälla).

**Rotkontrollen bar en stor del av bokstaven.** `mani` (`Av grek.
mania`) täckte `manodepressiv`/`mania`; `melankoli` (`melas+chole`)
täckte `mjältsjuka`/`melancholia`; `myelin` (`Av grek. myelos =
märg`) täckte `myelofibros`/`myelodysplastiskt syndrom`; `skleros`,
`melanin`/`melanom`, `purpura`, `dystrofi`, `abortus`, `placenta`,
`asteni`, `musculus` (`Av lat. mus = mus + -culus` — en muskel som
rör sig under huden liknade en löpande mus) och `malign` täckte var
sin klunga sammansättningar. Sex Latin-`Morbus X`-fraser (`Morbus
Addisonii`/`Basedowii`/`Brighti`/`maculosus Werlhofii`/`Menieri`/
`Parkinsonii`) är alla självförklarande `lat. uttryck` som pekar på
redan etablerade eponymer.

**Metodfynd: två lika stavade men olika grekiska rötter fick hållas
isär.** `myelos` = märg (`myelom`-familjen ovan) och `mys`/`myos` =
mus/muskel (`myom`) är två helt olika ord som råkar dela bokstäverna
"my-" — och `myopi` visade sig vara en TREDJE, orelaterad rot
(`myein` = blinka, inget med mus eller märg att göra). Att blint anta
gemensam rot för alla "my-"-ord hade gett en felaktig etymologi;
varje ord kontrollerades separat mot en oberoende källa.

**13 fick riktig etymologi:** 6 fristående fackord — `marasmus`
(`Av gr. marasmos = avmattning, vissnande`), `myom` (`Av gr. mys
(myos) = mus, muskel + -om = svulst`, samma "muskel liknar en
mus"-fakta som redan-bojda `musculus` men på grekiska), `myopi`
(`Av gr. myein = blinka, sluta ögonen + ops = öga`), `mitralis-
insufficiens` (`Av lat. mitra = biskopsmössa`, klaffens form liknar
en biskopsmössa), `metabolt syndrom` (`Av gr. metabole = förändring,
av meta = byte + ballein = kasta`), `medulla oblongata` (`Av lat.
medulla = märg + oblongata = avlång`) — samt 7 eponymer/
institutionsnamn, alla verifierade mot webbkällor innan de skrevs:
`Ménières sjukdom` (den franske läkaren Prosper Ménière, 1799–1862,
beskrev sjukdomen 1861), `Marfans syndrom` (den franske barnläkaren
Antoine Marfan, 1858–1942, beskrev syndromet 1896), `McGill Pain
Questionnaire` (uppkallat efter McGill University i Montreal, där
psykologen Ronald Melzack utvecklade formuläret 1975), `Metzenbaum-
sax` (den amerikanske kirurgen Myron Firth Metzenbaum, 1876–1944),
`Mayo-sax` (bröderna William och Charles Mayo, grundare av Mayo
Clinic), `Magill-tång` (den nordirländske narkosläkaren Ivan Magill,
1888–1986), `MADRS` (den brittiske psykiatrikern Stuart Montgomery
och den svenska psykiatrikern Marie Åsberg, publicerade skalan 1979).

Etymologitäckning 71,8 % → **71,8 % (7 847 av 10 928, 3 081 saknar).**
Nästa bokstav: N. `check_generators.py`: rundtripp identisk, 407
filer oförändrade efter 18 generatorsteg, 195 tester gröna, 2 351/
2 351 tooltip-ankare hela.

**N klar 0.9.384** (2026-08-07): av 269 N-poster saknade 105 enligt
mätsnutten, bara **3 (2,9 %) faktiska luckor** — näst lägst hittills
efter I:s 2,0 %, av samma orsak. `neuron`/`nervus` (`Av grek./lat.
neuron/nervus = nerv`) täckte ensamma hela `neuro-`-klustret
(`neuroanatomi`, `neurohypofys`, `neurokirurgi`, `neuropsykiatri`,
`neuroradiologi`, `neurovetenskap`, `Neuropsykologi`) och **22**
systematiska `nervus X`/`nervi X`-TA-fraser i ett enda svep. 19
förkortningar, 21 poster som redan bar en etymologisk not mätsnutten
missade — läkemedelsklustret `Nalorfin`…`Nystatin` (arton preparat),
eponymen `Negri`, och `nollhypotes`, som redan förklarar sig själv
med formeln `Förled noll + grek. hypothesis = antagande` (en tredje
variant av "kompositionsförklaring utan `Av`-prefix"-fällan).

**Rotkontrollen bar resten.** `urtikaria` (→ `nässelutslag`),
`torticollis` (→ `nackspärr`), `ren` (→ `njure`-familjen),
`epistaxis` (→ `näsblödning`), `myopi` (M-passet, → `närsynthet`),
`ikterus`/`gulsot` (G-passet, → `neonatal gulsot`), `fibros`
(L-passet, → `neurofibromatos`) och `carcinoma` (M-passet, →
`njurcancer`) täckte var sin svenska sammansättning. Flera av dessa
(`njure`, `näsblödning`, `nackspärr`) är dessutom rena inhemska
svenska ord som inte ens BEHÖVER ett lånords-ursprung — den latinska
`Lat. X`-taggen ger bara den formella parallellbeteckningen.

**3 fick riktig etymologi:** `noma` (`Av gr. nome = spridning (av
sår), av nemein = beta, sprida sig`), `norovirus` (`Bildat av
Norwalk, Ohio, platsen för det första identifierade utbrottet
1968 + virus` — en namnhistoria i samma stil som L-passets
`legionella`), `Nortonskala` (Efter den engelska sjuksköterskan
Doreen Norton, 1922–2007, som tog fram skalan 1962 tillsammans med
sitt team — verifierad mot webbkällor).

Etymologitäckning 71,8 % → **71,8 % (7 848 av 10 928, 3 080 saknar).**
Nästa bokstav: O. `check_generators.py`: rundtripp identisk, 407
filer oförändrade efter 18 generatorsteg, 195 tester gröna, 2 351/
2 351 tooltip-ankare hela.

**O klar 0.9.385** (2026-08-07): av 352 O-poster saknade 69 enligt
mätsnutten, bara **2 (2,9 %) faktiska luckor** — samma låga kvot som
N-passet, av samma orsaksfamilj (en handfull redan etablerade rötter
bär enorma systematiska kluster). `os` (`Av lat. os = ben` — posten
bär till och med en inbyggd varning "ej att förväxla med os = mun",
`os, oris`) täckte ensamt **27** systematiska `os X`/`ossa X`-TA-
bennamn (`os capitatum` … `ossa metatarsi`) i ett enda svep.
`ortopedi` (`Av grek. orthos = rak + pais = barn`) gav `orthos`-
roten och `anorexi` (`Av gr. an- = utan + orexis = aptit`) gav
`orexis`-roten till `Ortorexi` — BÅDA leden i ordet var alltså redan
täckta var för sig, ingenting nytt att lägga till. `genesis` (`Av
grek. genesis = uppkomst`) täckte `osteogenesis imperfecta`
tillsammans med redan-bojda `osteoporos`/`osteotomi`. 11 förkort-
ningar, 5 poster som redan bar en etymologisk not mätsnutten missade
— läkemedelsklustret `Omeprazol`, `Ondansetron`, `Oxitetracyklin`,
`Oxazepam`, samt eponymen `Omvänt Trendelenburgläge` (`Uppkallat
efter Friedrich Trendelenburg`).

**2 fick riktig etymologi**, båda platsuppkallade snarare än person-
uppkallade och verifierade mot webbkällor: `Osgood-Schlatter` (en
riktig dubbel-eponym: den amerikanske kirurgen Robert Bayley Osgood,
1873–1956, och den schweiziske kirurgen Carl Schlatter, 1864–1934,
som oberoende av varandra beskrev tillståndet 1903), `Oswestry
Disability Index` (uppkallat efter staden Oswestry i England, där
indexet utvecklades vid Robert Jones and Agnes Hunt Orthopaedic
Hospital och publicerades 1980 — samma namnhistoria-mönster som
L-passets `legionella` och N-passets `norovirus`).

Etymologitäckning oförändrad på **71,8 % (7 848 av 10 928, 3 080
saknar)** — båda tilläggen är `Efter`/`Uppkallat efter`-formuleringar,
osynliga för mätregexen. Nästa bokstav: P. `check_generators.py`:
rundtripp identisk, 407 filer oförändrade efter 18 generatorsteg,
195 tester gröna, 2 351/2 351 tooltip-ankare hela.

**P klar 0.9.386** (2026-08-07): alfabetets största bokstav (1 178
poster totalt). Av 188 P-poster saknade etymologi enligt mätsnutten
var bara **7 (3,7 %) faktiska luckor** — en av de lägsta kvoterna
hittills, i klass med N och O. **Metodfynd: 43 av bokstavens
förkortningar var formen `subst. (förk.)` snarare än bara `förk.`**
— den tidigare abbreviations-filtreringen (grep efter `förk.` direkt
efter tabbtecknet) missade dem alla, och en bredare sökning fick
läggas till mitt i passet. Totalt 68 förkortningar, 47 poster som
redan bar en etymologisk not mätsnutten missade — det hittills
största läkemedelsklustret (arton preparat: `Penicillamin`,
`Pivampicillin`, `Prednisolon`, `Primidon`, `Prokainamid`,
`Pancuronium`, `Pentazocin`, `Pentobarbital`, `Petidin`, `Pimozid`,
`Pramoxin`, `Prazosin`, `Prometazin`, `Propranolol`,
`Propyltiouracil`, `Protriptylin`, `Prontosil`, `Podofyllotoxin`),
sex växtnamn (`Pimpinella anisum`, `Paullinia cupana`, `Pausinystalia
johimbe`, `Pilocarpus jaborandi` m.fl.), sex eponymer som redan hade
`Efter …` (`parinauds syndrom`, `Parkinsonism`, `Parkinsons sjukdom`,
`Pemberton`, `Pacini`, `Pacchioni`, `Peang`) och nio `Av X + Y`-
formförklaringar med språkkoden efter `+` (`paracetamol`,
`penicillinas`, `plasminogen`, `priapism` — efter Priapos, grekisk
fruktbarhetsgud, samma mytologimönster som nedan — `prostaglandin`,
`proteas`, `proteinuri`, `proteolys`, `proteolytisk`).

**Rotkontrollen bar en stor del av resten.** `patologi`, `tumör`,
`prostata`, `pankreas`, `hyperplasia`, `arteria`, `pleura`,
`poliomyelit`, `larynx`, `vertebra`, `planta`, `palma` och `proprius`
— alla redan etablerade sedan tidigare bokstäver — täckte tillsammans
över tjugo P-sammansättningar: `patologisk anatomi`, `primärtumör`,
`prostatacancer`, `pankreascancer`, `prostataförstoring`, `perifer
kärlsjukdom`, `pleurautgjutning`, `postpolio`, `pseudokrupp`,
`plantar`, `palmar`, `palmaraponeuros`, `proprioceptor`. **`prevertebral`
fick BÅDA sina led täckta separat** — `prae-` (H-passets `preeklampsi`,
`Av lat. prae = före`) och `vertebra` (`Av lat. vertere = vända`) —
ingenting nytt att lägga till.

**7 fick riktig etymologi:** 3 fristående fackord — `Protes` (`Av gr.
prosthesis = tillägg, av pros = till + tithenai = sätta, placera`),
`pyemi` (`Av gr. pyon = var + haima = blod`), `paniksyndrom` (`Av gr.
Pan, herde- och naturguden` — plötslig, omotiverad skräck ansågs
orsakad av guden Pan, samma mytologiska namnmönster som redan-bojda
`narcissism`/Narkissos och `priapism`/Priapos) — samt 4 eponymer,
alla verifierade mot webbkällor innan de skrevs: `Penrosedrän` (den
amerikanske kirurgen Charles Bingham Penrose, 1862–1925, konstruerade
dränet 1890), `Perthes sjukdom` (den tyske kirurgen Georg Clemens
Perthes, 1869–1927), `Prader-Willis syndrom` (de schweiziska
barnläkarna Andrea Prader och Heinrich Willi, beskrev syndromet
1956), `Pagets sjukdom` (den engelske kirurgen James Paget,
1814–1899, beskrev sjukdomen 1877).

Etymologitäckning 71,8 % → **71,8 % (7 851 av 10 928, 3 077 saknar).**
Nästa bokstav: Q. `check_generators.py`: rundtripp identisk, 407
filer oförändrade efter 18 generatorsteg, 195 tester gröna, 2 351/
2 351 tooltip-ankare hela.

**Q klar 0.9.387** (2026-08-07): alfabetets minsta bokstav (20
poster totalt — samma bokstav som gav böjningspassets "0 nya"
0.9.358). Av 6 Q-poster utan `Av lat./gr. …` var 3 rena förkortningar
(`QCT`, `QuickDASH`, `qSOFA`) och 3 redan fullständigt förklarade
utan att mätregexen kände igen mönstret: `Q-tagg` och `QT-intervall`
förklaras båda med `Efter EKG-kurvans bokstavsbeteckning(ar) Q (och
T)`, och `Quassia amara` bär redan `Av Quassia (efter slaven Graman
Quassi, som visade dess bruk) + lat. amara = bitter`. **Ingen enda
äkta lucka — 0 fick riktig etymologi.**

Etymologitäckning oförändrad på **71,8 % (7 851 av 10 928, 3 077
saknar).** Nästa bokstav: R. `check_generators.py`: rundtripp
identisk, 407 filer oförändrade efter 18 generatorsteg, 195 tester
gröna, 2 351/2 351 tooltip-ankare hela.

**R klar 0.9.388** (2026-08-07): av 380 R-poster saknade 74 enligt
mätsnutten, bara **5 (6,8 %) faktiska luckor.** 27 förkortningar
(flera av formen `subst. (förk.)`, samma P-passfälla som redan
skrevs in i metoden ovan), 8 poster som redan bar en etymologisk
not mätsnutten missade — läkemedlet `Reserpin` (`Ur växten Rauvolfia
serpentina, artnamnet av lat. serpens = orm, efter den slingrande
roten`), eponymerna `Raynauds fenomen`, `refsums sjukdom`, `röntgen`,
`Ruffini`.

**Rotkontrollen bar en stor del av bokstaven via arkaiska/vardagliga
svenska syskon till redan etablerade latin-/grektermer** — samma
mönster som H- och N-passen, men nu med rollerna omvända: `erysipelas`
→ `rosfeber`, `lumbago` → `ryggskott`, `spina bifida` →
`ryggmärgsbråck`, `rubella` → `röda hund`, `tinea` → `ringorm`,
`dorsal` → `ryggsmärta`. `rakit`/`rachitis` är ett extra tydligt
exempel: den SVENSKA formen (`rakit`, `Av gr. rhachis = ryggrad`)
bär etymologin, den latinska sidoformen (`rachitis`) är sibling —
motsatt riktning mot den vanliga "arkaiskt latinskt namn, modernt
svenskt syskon"-regeln. Dessutom täckte `reflex`, `rete`/`reticulum`,
`radius` (tillsammans med F-passets `deviera`), `psykiatri`,
`rotator` och `ramus` ytterligare en klunga: `reflexologi`,
`retikulocyter`, `radialdeviation` (där BÅDA leden var täckta
separat — `radial` via `radius`, `-deviation` via `deviera`),
`rättspsykiatri`, `rotatorkuffsruptur`, `rami musculares`.

**5 fick riktig etymologi:** 2 fristående fackord (`rotavirus` —
`Av lat. rota = hjul`, syftar på partiklarnas hjulliknande form i
elektronmikroskopet, `Rongeur` — `Av fr. ronger = gnaga`) + 3
eponymer, alla verifierade mot webbkällor innan de skrevs: `Retts
syndrom` (den österrikiske barnläkaren Andreas Rett, 1924–1997,
beskrev syndromet 1966), `Richardson-retraktor` (den amerikanske
kirurgen Maurice Howe Richardson), `Redon-drän` (den franske
kirurgen Henri Redon, 1899–1974, utvecklade dränet 1950).

Etymologitäckning 71,8 % → **71,9 % (7 853 av 10 928, 3 075 saknar).**
Nästa bokstav: S. `check_generators.py`: rundtripp identisk, 407
filer oförändrade efter 18 generatorsteg, 195 tester gröna, 2 351/
2 351 tooltip-ankare hela.

**S klar 0.9.389** (2026-08-07): alfabetets näst största bokstav
(1 031 poster). Av 201 S-poster saknade etymologi enligt mätsnutten
var bara **11 (5,5 %) faktiska luckor.** 53 förkortningar, 20 poster
som redan bar en etymologisk not mätsnutten missade — hela `synovia`-
familjen (`synovia`, `synovial`, `synovialhinna`, `synovialvätska`,
`synovit`, `synovektomi`, `synovektomera`, alla `Av nylat. synovia =
ledvätska`), växtnamn, samt eponymerna `Schwannom`, `Sertoli`,
`Scarpa`, `Santorini` och `simsläge` (Uppkallat efter gynekolog James
Marion Sims).

**Rotkontrollen bar en majoritet av bokstaven.** `sub-` (`Av lat.
sub = under`, med assimilationsformerna `suc-/suf-/sug-/sum-/sup-/
sur-/sus-` uttryckligen dokumenterade i prefixpostens egen text) och
en rad andra redan etablerade rötter — `strabism`, `stenos`,
`distorsion`, `scabies`, `tetanus`, `lepra`, `senil`, `cirrhosis`
(via L-passets `levercirros`) och `impetigo` (I-passet) — täckte
sina arkaiska/vardagliga svenska syskon i ett svep: `skelning`,
`spinal stenos`, `stukning`, `skabb`, `stelkramp`, `spetälska`,
`senilitas`, `skrumplever`, `svinkoppor`. `fobi`, `schizofreni`,
`suicid`, `sepsis`, `serum` + `tonus` (K-passet) och `soma` +
`statikos` (K-passet, `bakteriostatisk`s rot) täckte ytterligare
stora kluster: hela `social fobi`/`Specifik fobi`/`Separationsångest`-
gruppen, hela `Schizoid`/`Schizotyp`/`Schizoaffektivt`-familjen, hela
`Suicidtanke`/`Suicidrisk`/`Suicidalitet`-familjen, samt
`septicaemia`, `serotonin`, `somatostatin`/`somatostatinom`.

**11 fick riktig etymologi:** 3 fristående fackord — `Somnambulism`
(`Av lat. somnus = sömn + ambulare = gå, vandra`), `Stetoskop`
(`Av gr. stethos = bröst + skopein = betrakta`), `syfilis` (`Bildat
av den italienske läkaren och diktaren Girolamo Fracastoro, som 1530
gav sjukdomen namnet i diktverket "Syphilis sive morbus gallicus",
efter herden Syphilus i berättelsen` — ett av husets viktigaste ord
inom infektionsmedicin, hade saknat etymologi helt sedan bokstav A),
`Skalpell` (`Av lat. scalpellum, diminutiv av scalprum = kniv,
mejsel`) — samt 2 namnhistorier och 5 eponymer, alla verifierade mot
webbkällor innan de skrevs: `salmonellos` (den amerikanske
veterinärpatologen Daniel Elmer Salmon, 1850–1914, chefen för
laboratoriet där bakterien isolerades 1885), `stent` (den engelske
tandläkaren Charles Thomas Stent, 1807–1885, vars dentala
avtrycksmaterial gav namnet sin väg in i medicinen), `Stroop-test`
(John Ridley Stroop, 1935), `Schobers test` (Paul Schober, 1937),
`Severs sjukdom` (James Warren Sever, 1912), `Sjögren`/`Sjögrens
syndrom` (Henrik Sjögren, 1933 — båda dubbla entries fick tillägget).

**Metodfynd: efter att användaren ifrågasatte varför alla 18
generatorsteg kördes för en ren `data/ordlista.json`-ändring**
kördes S-passets tillämpning bara med de scripten som faktiskt
konsumerar ordlistan — `generate_glossary.py`, samtliga
`wire_*.py --all` och `generate_llms.py` — och `check_generators.py`
visade ändå "rundtripp identisk" på det riktiga trädet, vilket
bekräftar att de sju sidgeneratorerna (`generate_karl.py` m.fl.) var
onödiga för den här ändringstypen. Se `feedback_ordlista_relevant_
generators_only` i minnessystemet.

Etymologitäckning 71,9 % → **71,9 % (7 856 av 10 928, 3 072 saknar).**
Nästa bokstav: T. `check_generators.py`: rundtripp identisk, 407
filer oförändrade, 195 tester gröna, 2 351/2 351 tooltip-ankare hela.

**T klar 0.9.390** (2026-08-07): av 150 T-poster saknade etymologi
enligt mätsnutten, bara **5 (3,3 %) faktiska luckor** — en av de
lägsta kvoterna hittills. 12 förkortningar (en tredje mätfälla
hittad PROAKTIVT den här gången: `subst. förkortning` utan parentes,
utöver P-passets `förk.`/`subst. (förk.)` — sökningen utökades i
förväg baserat på P-passets lärdom, i stället för att missas och
upptäckas efteråt), 21 poster som redan bar en etymologisk not
mätsnutten missade — hela `trombocyt`-klustret (`trombocytemi`,
`trombocytopeni`, `trombocytos`), `Trendelenburg`-familjen
(`Trendelenburg`, `Trendelenburgläge`, `Omvänt Trendelenburgläge`),
eponymerna `Tinels`, `tourettes syndrom`, `Turners syndrom`.

**Rotkontrollen bar en ovanligt stor andel av bokstaven.**
`trombocyt` (`Av gr. thrombos = propp + kytos = cell`), `tromb`,
`tuberkel`/`tuberculum` (`Av lat. tuberculum = liten knöl`),
`torsion`, `trachea`, `tension`, `transitorisk`, `obsession`,
`polyp`, `tic`, `tuba`, `trans-` (`Av lat. trans = över`),
`trigeminus` (`Av lat. tri- + geminus = tvilling`), `tendinit`,
`trochanter` (`Av grek. trokhazein = löpa, springa` — muskelfästet
möjliggör löpning) och hela `tyreoidea`-familjen (H-passet) täckte
tillsammans över tjugofem T-sammansättningar utan att något behövde
skrivas. Två exempel där BÅDA leden var separat täckta: `tuberös
skleros` (`tuberkel` + S-passets `skleros`) och `trokantertendinit`
(`trochanter` + `tendinit`).

**5 fick riktig etymologi:** 3 fristående fackord — `Termometer`
(`Av gr. thermos = varm + metron = mått`), `talassemi` (`Av gr.
thalassa = hav + haima = blod`, syftar på sjukdomens ursprung kring
Medelhavet), `trikinos` (`Av gr. thrix (trichos) = hår`, de hårtunna
larverna) — samt 1 namnhistoria och 1 eponym, båda verifierade mot
webbkällor innan de skrevs: `tularemi` (bildad efter Tulare County i
Kalifornien, där bakterien upptäcktes 1911, samma platsuppkallnings-
mönster som L-passets `legionella` och N-passets `norovirus`),
`Takayasus arterit` (den japanske oftalmologen Mikito Takayasu,
1860–1938, rapporterade fallet 1908).

Etymologitäckning 71,9 % → **71,9 % (7 859 av 10 928, 3 069 saknar).**
Passet kördes med bara de relevanta generatorerna (glossary +
wire-steg + llms), som beslutat efter S-passet. Nästa bokstav: U.
`check_generators.py`: rundtripp identisk, 407 filer oförändrade,
195 tester gröna, 2 351/2 351 tooltip-ankare hela.

**U klar 0.9.391** (2026-08-07): av 122 U-poster saknade 29 enligt
mätsnutten — 4 förkortningar och 1 redan besvarad eponym (`ushers
syndrom`, `Uppkallat efter Charles Usher`). De resterande 24 var
alla sammansättningar av rötter redan etablerade sedan tidigare
bokstäver: `uremi` (`Av gr. ouron = urin + haima = blod`) täckte
`uremisk`; `urologi`/`urogenital` täckte `urolog`/
`urogenitalsystemet`; `extra-` (`Av lat. extra = utanför`) + `uterus`
(`Av lat. uterus = livmoder`) täckte tillsammans `utomkvedshavande-
skap` (`Lat. graviditas extrauterina`, BÅDA leden separat täckta)
samt `uteruskontraktion`/`uteruskontraherande`; `sekretion` täckte
`utsöndra`. Resten var rena svenska sammansättningar (`utsot`,
`undernäring`, `utmattningssyndrom`, `Ultraljudskniv` m.fl.) eller
självförklarande förkortningsliknande termer utan formell `förk.`-
tagg (`UFH`, `UVI`, båda med redan etablerade rötter i sin egen
expansion). **Ingen enda äkta lucka — 0 fick riktig etymologi.**

Etymologitäckning oförändrad på **71,9 % (7 859 av 10 928, 3 069
saknar).** Nästa bokstav: V. `check_generators.py`: rundtripp
identisk, 407 filer oförändrade, 195 tester gröna, 2 351/2 351
tooltip-ankare hela.

**V klar 0.9.392** (2026-08-07): av 61 V-poster saknade etymologi
enligt mätsnutten, bara **1 (1,6 %) faktisk lucka** — den lägsta
kvoten hittills. 6 förkortningar, 7 poster som redan bar en
etymologisk not mätsnutten missade (`vas`, `Av lat. vas = kärl`,
eponymerna `Valsalva`, `Varolio`).

**Rotkontrollen bar nästan hela bokstaven.** `ventrikel` (`Av lat.
ventriculus = liten buk`) täckte ensam åtta `ventrikel-X`-
sammansättningar (`ventrikelaspiration`, `ventrikelcancer`,
`ventrikeldilation`, `ventrikelflimmer`, `ventrikelresektion`,
`ventrikelretention`, `ventrikelsköljning`, `ventrikeltakykardi`)
tillsammans med redan etablerade `carcinoma`, `dilatation`,
`resektion`, `retention` och `takykardi`. `vas` (hidden) bar hela
`vaso-`-familjen (`vasodilator`, `vasokonstriktor`, `vasomotorisk
rinit`, `vasopressin`, `vasospastisk`). `varicella`, `verruca`,
`hordeolum` och `variola` täckte sina svenska/arkaiska syskon
(`vattkoppor`, `vårta`, `vagel`, `varioloides`). `laryngoskop` och
`kateter` täckte `Videolaryngoskop` respektive `Venkateter` — den
sistnämnda med BÅDA leden separat täckta.

**1 fick riktig etymologi:** eponymen `von Willebrands sjukdom`,
verifierad mot webbkällor innan den skrevs (den finländske läkaren
Erik Adolf von Willebrand, 1870–1949, beskrev sjukdomen 1926 hos en
familj på Åland).

Etymologitäckning oförändrad på **71,9 % (7 859 av 10 928, 3 069
saknar)** — tillägget är en `Efter`-eponym, osynlig för mätregexen.
Nästa bokstav: W. `check_generators.py`: rundtripp identisk, 407
filer oförändrade, 195 tester gröna, 2 351/2 351 tooltip-ankare hela.

**W klar 0.9.393** (2026-08-07): liten bokstav (23 poster totalt).
Av 20 W-poster saknade etymologi enligt mätsnutten var 10 förkort-
ningar, 2 redan besvarade (`WDHA-syndrom` — akronymen självförklarad
i brödtexten, `Withania somnifera` — växtnamn), `whiplash` ett bare-
taggat engelskt lånord (kategori 2, `Sv. pisksnärtsskada` är redan
en självständig svensk översättning i egen post).

**6 fick riktig etymologi, samtliga eponymer/namnhistorier, alla
verifierade mot webbkällor innan de skrevs:** `warfarin` (`Bildat av
WARF, Wisconsin Alumni Research Foundation, som finansierade forsk-
ningen, + ändelsen -arin, av kumarin` — en av medicinens mer ovan-
liga namnhistorier, uppkallat efter en finansiär snarare än en
person eller upptäckt), `Wilsons sjukdom` (den brittiske neurologen
Samuel Alexander Kinnier Wilson, 1878–1937, beskrev sjukdomen 1912),
`Wegeners granulomatos` (den tyske patologen Friedrich Wegener,
1907–1990, beskrev sjukdomen på 1930-talet), `Wong-Baker Faces` (de
amerikanska sjuksköterskorna Donna Wong och Connie Baker, utvecklade
skalan 1983), `Wells score` (den kanadensiske hematologen Philip
Wells), `Weitlaner-retraktor` (den österrikiske läkaren Franz
Weitlaner, 1872–1944, publicerade konstruktionen 1905).

Etymologitäckning oförändrad på **71,9 % (7 859 av 10 928, 3 069
saknar)** — alla sex är `Efter`/`Bildat av`-formuleringar, osynliga
för mätregexen. Nästa bokstav: X. `check_generators.py`: rundtripp
identisk, 407 filer oförändrade, 195 tester gröna, 2 351/2 351
tooltip-ankare hela.

**X, Y, Z, Å, Ä, Ö klara 0.9.394** (2026-08-07): de sex sista
bokstäverna genomgångna i ett svep, på uttrycklig begäran ("Gör alla
återstående bokstäver i ett svep") i stället för en och en. 72 poster
granskade totalt (X 12, Y 6, Z 20, Å 18, Ä 8, Ö 8). **X hade 0 luckor**
— redan klar sedan tidigare bokstav. Av de återstående 60 (Y–Ö) saknade
55 etymologi enligt mätsnutten.

**Rotkontrollen bar 53 av de 55 luckorna (96 %), utan att en enda
rad behövde skrivas.** Rena svenska ord utan lånordskomponent:
hela `åder`-familjen (`åder`, `åderbråck`, `åderförkalkning`,
`åderinflammation`, `åderlåta`, `åderlåtning`, `åderstockning`),
hela `ålderdom`-familjen (`ålderdom`, `ålderdomssvaghet`,
`åldersbräcklighet`, `åldersförfall`), hela `ärr`-familjen
(`ärrbildning`, `ärrvävnad`), `åkomma`, `återfallsfeber`, `Återfall`,
`Återhämtning`, `ytanatomi` (ytled), `yttre vändning`, `ytterled`,
`ätstörning`, `Ältande`, `övervikt`, `överaktiv blåsa`, `Överföring`.
Sammansättningar täckta av rötter etablerade i tidigare bokstäver:
`anatomi` bar `ytanatomi`; `zona` + `terapi` bar tillsammans
`zonterapi` (Z:s enda lucka); `ångest` (redan etablerad: `Av lat.
angustia = trånghet, beklämning`) + `neuron`/`neuro-` bar
`ångestneuros`/`ångestsyndrom`; `psykiatri` bar `äldrepsykiatri`;
`con-` (`Av lat. con- = med`) + `trahere` (`Av lat. trahere = dra`,
etablerad via `protraktion`/`retraktion`/`traktion`) bar tillsammans
`ärrkontraktur` trots att `kontraktur` saknar egen post; `pronation`/
`pronator` (`Av lat. pronus`) bar `överpronera`; `hyper-` (`Av grek.
hyper = över`) + `ops`/`opi` = öga (etablerad via `myopi`/`diplopi`/
`amblyopi` m.fl.) bar tillsammans `översynthet` trots att `hyperopi`
saknar egen post. **`yrsel`** följer samma mönster som tidigare
bokstävers arkaisk/vardaglig-mot-facktermen: den bär bara en `Lat.
vertigo`-tagg (inte en etymologi, se B-passets fynd), men `vertigo`
har sin egna fulla etymologi (`Av lat. vertere = vända, snurra`,
etablerad i V-passet) på sin egen post. **`östradiol`** hade redan
sin bildning utskriven inline (`Av östrogen + diol`) trots att den
inte matchar mätregexen (`östrogen` är inget språkkodsord) — inget
att lägga till.

**2 fick riktig etymologi, båda i Y, båda verifierade mot
webbkällor innan de skrevs:** `YMRS` (`Efter den amerikanske
psykiatern Robert C. Young, som konstruerade skalan 1978`) och
`Y-BOCS` — en namnhistoria snarare än en person-eponym, samma
kategori som `legionella`/`tularemi`: `Bildat av namnen på
universiteten Yale och Brown`, där utvecklarna Wayne Goodman
respektive Steven Rasmussen var verksamma när skalan publicerades
1989.

Etymologitäckning oförändrad på **71,9 % (7 859 av 10 928, 3 069
saknar)** — båda tilläggen är `Efter`/`Bildat av`-formuleringar,
osynliga för mätregexen. `check_generators.py`: rundtripp identisk,
407 filer oförändrade, 195 tester gröna, 2 351/2 351 tooltip-ankare
hela.

**MILSTOLPE: etapp 4 punkt 2 (etymologi) är nu helt avslutad A–Ö.**
Hela alfabetet genomgånget bokstav för bokstav sedan starten
(0.9.371–0.9.394). Nästa steg i etapp 4: punkt 3, `Eng.`-fältet
(1 257 saknar).

**Prefix/suffix kontrollerade 0.9.395** (2026-08-07): på uttrycklig
begäran ("Kontrollera prefix och suffix med [etymologin]") ett
komplement till A–Ö-slingan, eftersom prefix/suffix är en EGEN
klassificering (`is_prefix()`/`is_suffix()` läser ordklasstaggen i
`def`, inte uppslagsordets bokstav) och egna sidor
(`ordlista-prefix.html`/`ordlista-suffix.html`). **Suffix (153
poster, alla inledda med `-`) föll strukturellt UTANFÖR hela
A–Ö-slingan** — `term[0]` är `-`, ingen bokstav i A–Ö — men var
redan 152/153 täckta av tidigare arbete innan det här projektet ens
började. **Prefix (657 poster) täcktes redan indirekt** via den
vanliga bokstavsgenomgången, eftersom prefix-uppslagsord oftast
börjar på en riktig bokstav (`hyper-` kom med i H-passet, `neuro-`
i N-passet, osv.) — 656/657 täckta.

**1 äkta lucka: `bredspektrum-`.** `bred` inhemsk svenska, `spektrum`
saknade helt egen rot i filen (kontrollerat: `spektrum`/`spectrum`/
`specere`/`spekulum` — inga egna poster). Verifierad mot webbkällor:
`Av sv. bred + lat. spectrum = syn, bild, av specere = se,
betrakta`. Suffixets enda regex-miss (`-ase / -as`) var redan
besvarad (`Efter diastas, det första namngivna enzymet`), ingen
åtgärd. Etymologitäckning oförändrad **71,9 % (7 859 av 10 928,
3 069 saknar)** — tillägget skrivs `Av sv. … + lat. …`, samma dolda
mönster som `tankedetraktion` sedan tidigare, osynligt för
mätregexen. `check_generators.py`: rundtripp identisk, 407 filer
oförändrade, 195 tester gröna, sidodatum.json aktuellt, 2 351/2 351
tooltip-ankare hela.

**Metodfynd: `sidodatum.py --update` FÖRST i kedjan räcker inte.**
Den läser sidans innehåll på DISK i det ögonblicket — körs den
innan `generate_glossary.py` hunnit skriva den nya texten ser den
den gamla filen och sätter inget nytt datum, vilket senare gör att
`sitemap.xml` (byggd ur `data/sidodatum.json`) blir inaktuell och
`check_generators.py` larmar trots grön rundtripp. Robust ordning:
kör den smala kedjan en gång rakt igenom, kör DÄREFTER
`sidodatum.py --update` (ser nu sidornas färdiga innehåll), kör
SEDAN kedjan en andra gång (så både sitemap och synligt datum
byggs mot det uppdaterade registret).

### Engelsknotation — och vilka poster som ska ha `Eng. `

Etapp 4 punkt 3, påbörjad 0.9.396 (2026-08-07) efter att etymologin (punkt 2) blev
helt klar A–Ö. Samma metod som böjningen och etymologin: mät hela bokstaven,
kategorisera varje "saknas"-post innan något skrivs — **"saknas" är ett tak, inte
en arbetslista.** Facit av A–E: 156 poster saknade `Eng. ` enligt mätsnutten, bara
**47 (30,1 %)** var faktiska luckor värda att fylla — en klart högre kvot äkta
luckor än etymologins ~12 %, eftersom flertalet motiverade undantag nedan är
koncentrerade till enstaka bokstäver (särskilt TA-ledserien i A) snarare än
utspridda jämnt.

**Placering:** `Eng. …` står **direkt efter** `Sv. …` (husformatets egen ordning,
verifierad mot `reumatoid artrit`: `… Sv. ledgångsreumatism. Eng. rheumatoid
arthritis. Förk. RA. ICD-10: …`) och **före** `Förk. `/`Jfr `/`ICD-10: `/övriga
tail-fält. Saknas `Sv. `, läggs `Eng. …` sist i den beskrivande meningen, före ett
eventuellt `Jfr `.

**Fem kategorier motiverade undantag**, i den ordning de dominerade A–E:

1. **Latinska binomiala växtnamn** (`Atropa belladonna`, `Allium sativum`,
   `Berberis vulgaris`, `Cannabis sativa`, `Digitalis purpurea` …) — det
   vetenskapliga binomialnamnet är internationellt och används **identiskt** i
   engelsk facktext; ett `Eng. `-fält hade bara upprepat uppslagsordet.
   **Kontrollerat, inte antaget:** noll av alla binomialposter i hela filen bär
   vare sig `Sv. ` eller `Eng. `-tagg — husets egen konsekventa praxis är att låta
   den svenska/engelska vardagsbenämningen stå inline i löptexten (”vitlök,
   lökväxt”) i stället för en formell tagg. Störst kategori i alla fem
   bokstäverna: 26 (A), 5 (B), 32 (C, störst enskilda kategori i hela passet),
   8 (D), 11 (E) = **82 av 109 undantag.**
2. **Redan tautologiska engelska/latinska lånord** — uppslagsordet ÄR redan sin
   egen engelska form (`anasarca`, `anthrax`, `encephalomalacia`; jfr B-passets
   etymologimotsvarighet `bias`/`bypass`/`biofeedback`). Ett `Eng. `-fält hade
   bara upprepat termen.
3. **Modern/primär syskonpost bär redan fältet** — en arkaisk, sällsynt eller
   dubblerande term vars huvudkoncept redan har `Eng. ` på sin egen post, oftast
   uttryckligen länkad via `Jfr `/`Ålderdomligt:`. Samma logik som etymologins
   "arkaiska latinska diagnosnamn"-undantag, men här gäller den även levande
   ord: `apostem`→`böld`/`abscess` (Eng. abscess), `digerdöden`→`pest` (Eng.
   plague, listar `digerdöden` som Ålderdomligt:-synonym), `caries`→`karies`
   (Eng. caries, tooth decay — `karies` är dessutom explicit "Även stavat
   caries"),
   `decubitus`→`trycksår` (Eng. pressure ulcer, Jfr Decubitus), `cholera
   infantum`/`cholera nostras`→`kolera` (Eng. cholera), `commotio cerebri`→
   `hjärnskakning` (Eng. concussion, Lat. commotio cerebri), `estesiometer`→
   `aestesiometer` (ren "se X"-korsreferens), `epithelioma`→`carcinoma` (Eng.
   carcinoma), `embolia`→`emboli` (Eng. embolism). **Kontrollmetod:** slå upp
   varje misstänkt syskon i FILEN innan posten avfärdas — precis som
   etymologins rotkontroll, fast riktningen är omvänd (leta framåt mot den
   moderna termen, inte bakåt mot roten).
4. **Svenskspecifika institutioner/utbildningssystem utan internationell
   motsvarighet** — `AT`, `BT` (redan obesvarade sedan tidigare, bekräftar
   mönstret), `EHM` (E-hälsomyndigheten), `BOA` (namnet på ett svenskt
   kvalitetsregister). En engelsk "motsvarighet" hade varit en approximation,
   inte en översättning — samma gräns som etymologins varunamnsundantag.
5. **Flertydiga förkortningar där båda betydelserna redan är parentetiskt
   översatta i löptexten** — `CAPS`, `CHD`, `CAD`, `ESS` skriver redan
   `(catastrophic antiphospholipid syndrome)`/`(coronary artery disease)` osv.
   inline för varje sifferled. Ett formellt `Eng. `-fält hade varit tvetydigt
   (vilken av de två betydelserna?) och `BT` sätter samma precedens: dess
   `blodtryck`-betydelse har redan `(blood pressure)` inline utan formell tagg.

**47 fick riktig `Eng. `, i två grupper:**
1. **35 TA-ledtermer i den latinska prefixformen** (`articulatio X`/
   `articulationes X`) fick sin engelska TA-standardbenämning
   (`articulatio coxae` → hip joint, `articulatio genus` → knee joint,
   `articulatio femoropatellaris` → **patellofemoral** joint — engelskan vänder
   ordordningen jämfört med latinets femoro-patellaris, kontrollerat separat
   eftersom en ren transkribering hade gett fel term). Symmetriskt med `Sv. `-
   fältet som redan fanns på alla 35. Plus `aorta abdominalis`/`aorta thoracica`
   (abdominal/thoracic aorta, omvänd ordföljd som joint-termerna).
2. **12 fristående fackord/institutioner**, verifierade mot etablerad
   anatomisk/klinisk standardterminologi: `anococcygeum` (anococcygeal body),
   `anserinus` (pes anserinus, samma Latin-i-engelskan-princip som `ansa
   cervicalis` ovan men här verkligen den använda engelska termen), `AKM`
   (emergency department), `BVC` (child health centre), `BMM` (midwifery
   clinic), `BIVA` (paediatric intensive care unit), `bröstrygg` (thoracic
   spine), `costae fluitantes` (floating ribs), `CIVA` (central intensive care
   unit), `dränering` (drainage — trots att syskonet `dränage` redan hade
   fältet, är `dränering` en egen, levande term utan `Jfr`-länk till syskonet,
   så den fick sin egen rad i stället för att räknas som dubblettundantag).

**Stavningskonvention: brittisk engelska.** `paediatric` (inte pediatric),
`centre` (inte center) — kontrollerat mot filens egna redan skrivna `Eng. `-fält
(`barnkirurgi`: paediatric surgery, `vårdcentral`/`VC`: health centre, `RCC`:
regional cancer centre) innan `BVC`/`BIVA` skrevs.

Etymologitäckning-mönstret upprepade sig: **Eng.-täckning 88,5 % → 88,9 %
(9 671 → 9 718 av 10 928, 1 257 → 1 210 saknar)**, mätt 2026-08-07 efter A–E.
`check_generators.py`: rundtripp identisk, 407 filer oförändrade efter 18
generatorsteg, 195 tester gröna, sidodatum.json aktuellt, 2 351/2 351
tooltip-ankare hela.

#### Engelskloggen per bokstav

**A klar** (0.9.396, 2026-08-07): 72 poster saknade `Eng. ` enligt mätsnutten.
**40 fick fältet** — 35 TA-leder + `aorta abdominalis`/`aorta thoracica` +
`anococcygeum`/`anserinus` + `AKM`. **32 motiverade undantag:** 26 binomiala
växtnamn (kategori 1) + `ansa cervicalis`/`anasarca`/`anthrax` (kategori 2) +
`apoplexia cerebri`/`apostem` (kategori 3, syskon `apoplexi`/`abscess` bär redan
fältet) + `AT` (kategori 4).

**B klar** (0.9.396, 2026-08-07): 12 poster saknade `Eng. `. **4 fick fältet:**
`BVC`, `BMM`, `BIVA`, `bröstrygg`. **8 motiverade undantag:** 5 binomiala
växtnamn + `bröstsjuka` (kategori 3, syskon `lungsot` listar `bröstsot` som
Ålderdomligt-synonym med Eng. redan satt) + `BT` (kategori 4/5) + `BOA`
(kategori 4).

**C klar** (0.9.396, 2026-08-07): 42 poster saknade `Eng. ` — flest av de fem,
men också högst undantagskvot (95 %). **2 fick fältet:** `costae fluitantes`,
`CIVA`. **40 motiverade undantag:** 32 binomiala växtnamn (störst enskilda grupp
i hela A–E-passet) + `caries`/`cholera`/`cholera infantum`/`cholera nostras`/
`commotio cerebri` (kategori 3, syskon `karies`/`kolera`/`hjärnskakning` bär
redan fältet) + `CAPS`/`CHD`/`CAD` (kategori 5).

**D klar** (0.9.396, 2026-08-07): 12 poster saknade `Eng. `. **1 fick fältet:**
`dränering`. **11 motiverade undantag:** 8 binomiala växtnamn + `decubitus`/
`dementia paralytica`/`digerdöden` (kategori 3, syskon `trycksår`/`paralysis
generalis`+`syfilis`/`pest` bär redan fältet eller täcker konceptet).

**E klar** (0.9.396, 2026-08-07): 18 poster saknade `Eng. ` — **0 fick fältet**,
första bokstaven med noll äkta luckor i det här passet (samma sak hände Q och U
i etymologipasset). **18 motiverade undantag:** 11 binomiala växtnamn +
`embolia`/`epithelioma`/`estesiometer` (kategori 3, syskon `emboli`/`carcinoma`/
`aestesiometer` bär redan fältet) + `emollitio cerebri`/`encephalomalacia`
(kategori 2/3 kombinerat — `encephalomalacia` är själv redan sin engelska form,
`emollitio cerebri` är den arkaiska latinska sidoformen) + `ESS`/`EHM`
(kategori 5/4).

**F klar** (0.9.397, 2026-08-07): 11 poster saknade `Eng. `. **1 fick fältet:**
`FHM` → Public Health Agency of Sweden (till skillnad från `EHM`/`BOA`: FHM har ett
etablerat, internationellt använt engelskt namn — myndighetens eget engelskspråkiga
namn, väl belagt bl.a. från covid-bevakningen — så den räknas INTE som kategori 4
trots att den också är en svensk myndighet). **10 motiverade undantag:** 4 binomiala
växtnamn + `febris intermittens`/`febris recurrens`/`febris typhoides` (kategori 3,
syskonen `malaria`/`återfallsfeber`/`tyfoidfeber` bär redan fältet, den sistnämnda
med `Lat. febris typhoides` explicit utskrivet) + `fransosen` (kategori 3, syskon
`syfilis` bär redan fältet) + `FAP`/`FAST` (kategori 5).

**G klar** (0.9.397, 2026-08-07): 9 poster saknade `Eng. ` — **0 fick fältet**,
andra bokstaven i det här passet med noll äkta luckor. **9 motiverade undantag:**
7 binomiala växtnamn + `GAS` (kategori 5) + `GERD` (ny undantagsvariant: expansionen
i brödtexten ÄR redan den engelska frasen ordagrant — `förk. gastro-oesophageal
reflux disease; …` — ett formellt `Eng. `-fält hade upprepat exakt samma fras en
gång till i samma post, samma logik som en bar-taggad engelsk term men tillämpad på
en förkortnings egen expansion i stället för uppslagsordet).

**H klar** (0.9.397, 2026-08-07): 19 poster saknade `Eng. `. **5 fick fältet:**
`HIA` → coronary care unit, `HAB` → habilitation (ett äkta engelskt fackord, skilt
från "rehabilitation"), `HMC` → assistive technology centre, `halsrygg` → cervical
spine, `hjärnstam` → brainstem. **14 motiverade undantag:** 7 binomiala växtnamn +
`hydrophobia`/`hysteria`/`håll och styng` (kategori 3, syskonen `rabies`/`hysteri`/
`pleurit` bär redan fältet — `pleurit`s `Vardag. `-fält nämner uttryckligen "håll" i
bröstet) + `hp`/`HSV`/`HSAN` (kategori 5) + `HSLF-FS` (kategori 4, svensk
författningssamling utan engelsk motsvarighet).

**I klar** (0.9.397, 2026-08-07): 7 poster saknade `Eng. `. **2 fick fältet:**
`IVA` → intensive care unit (basförkortningen själv saknade fältet trots att
syskonen `BIVA`/`CIVA` redan fått sitt i A/C-passen — kontrollerat i FILEN, inte
antaget), `ischiopubicus` → ischiopubic (bar Latinsk adjektivform, samma mönster
som redan skrivna `articularis`→articular, `costalis`→costal, `radialis`→radial:
strippa den latinska ändelsen, sätt den engelska adjektivändelsen). **5 motiverade
undantag:** 2 binomiala växtnamn + `icterus` (kategori 3, syskon `ikterus` bär redan
fältet OCH listar `icterus` explicit som "Även stavn.") + `insania` (kategori 3,
BÅDA syskonen `mani`/`melankoli` bär redan fältet) + `ICD-10-SE` (kategori 4, svensk
anpassning av en internationell standard, inget eget engelskt namn).

**J klar** (0.9.397, 2026-08-07): 2 poster saknade `Eng. ` — **0 fick fältet**,
båda binomiala växtnamn (`Juniperus sabina`, `Juniperus communis`).

Eng.-täckning efter F–J: **88,9 % → 89,0 % (9 726 av 10 928, 1 202 saknar).**
`check_generators.py`: rundtripp identisk, 407 filer oförändrade, 195 tester gröna,
sidodatum.json aktuellt, 2 351/2 351 tooltip-ankare hela.

**⚠️ Stort nytt dubblettfynd, upptäckt under N/O-passet, INTE åtgärdat (0.9.398):**
utöver det redan lösta "248-dubblettfyndet" (`musculus X`/`arteria X`/`vena X`/
`nervus X`/`musculi X`, åtgärdat 0.9.360) finns **56 fler prefix-/suffixform-par**
som slank igenom den kartläggningen, koncentrerade till tre kluster: 25
`articulatio X`/`articulationes X` (mest i A, redan Eng.-ifyllda i A-passet ovan —
kontrollerat att mina tillägg exakt matchar syskonens redan skrivna `Eng. `,
t.ex. `articulatio coxae`/`coxae, articulatio` båda "hip joint"), 2 `nervi X`
(`nervi intercostales`, `nervi supraclaviculares`), och **29 `os X`/`ossa X`**
(hela den TA-bennomenklaturen, koncentrerad till O eftersom alla börjar på "o" —
samma strukturella mönster som gjorde att ledserien samlades i A). Alla 56 par
har suffixformen wirad i facit (`kb_glossary_terms.json`) och prefixformen
owirad — samma "facit vinner"-situation som 248-fyndet. **Metod för att hitta
dem:** jämför varje `<prefix> <rest>`-term mot `<rest>, <prefix>` för de åtta
prefixen `musculus/musculi/vena/venae/arteria/arteriae/nervus/nervi/ligamentum/
ligamenta/articulatio/articulationes/os/ossa`. **Hanterat i det här Eng.-passet
utan att röra dubbletterna:** i N/O kopierades syskonets redan skrivna `Eng. `-
text ordagrant in i prefixformen (i stället för att omöversättas från grunden)
— snabbare och risikofritt eftersom svaret redan fanns verifierat i filen. **Inte
åtgärdat:** själva sammanslagningen (som 248-fyndet krävde två svep + href-kontroll
mot facit) är en egen, större uppgift — kräver samma riskgenomgång som
0.9.360. Facit: `scripts/ordlista_forbattring_todo.md`.

**K klar** (0.9.398, 2026-08-07): 2 poster saknade `Eng. ` — **0 fick fältet.**
Båda (`KVÅ`, `KSH97-P`) är Socialstyrelsens svenska kodverk utan internationell
motsvarighet (kategori 4).

**L klar** (0.9.398, 2026-08-07): 18 poster saknade `Eng. `. **3 fick fältet:**
`LAB` → laboratory medicine, `ländrygg` → lumbar spine (samma mönster som
`halsrygg`/`bröstrygg`), `ledskål` → socket (matchar `acetabulum`s eget
`Eng. acetabulum, hip socket`). **15 motiverade undantag:** 7 binomiala
växtnamn + `lupus vulgaris`/`lyssa` (kategori 3, syskonen `tuberkulos`/`rabies`
bär redan fältet) + `lymphogranulomatosis` (kategori 3, syskon `Hodgkins lymfom`
bär redan `Eng. Hodgkin lymphoma`) + `LPT`/`LRV`/`LVM`/`LVU`/`LSS` (kategori 4,
svenska lagar utan engelsk motsvarighet).

**M klar** (0.9.398, 2026-08-07): 29 poster saknade `Eng. `. **7 fick fältet:**
`MAVA` → acute medical unit, `Morbus maculosus Werlhofii` → immune
thrombocytopenic purpura (den enda av bokstavens sex `Morbus X`-latinfraser utan
en modern syskonpost som redan bar fältet — de fem andra är kategori 3), 4
TA-muskelnamn i prefixform (`musculus levator labii superioris alaeque nasi`,
`musculus multifidus`, `musculus rectus capitis lateralis`,
`musculus transversus perinei superficialis` — kontrollerat mot suffixformens
341/341 100%-täckning INNAN dessa skrevs, se dubblettstycket ovan; tre fick den
bara latinet minus "musculus" som redan är engelska anatomins egen konvention,
den fjärde `superficial transverse perineal muscle` matchande sin redan skrivna
motpart `deep transverse perineal muscle`), `munvinkel` → angle of the mouth,
oral commissure. **22 motiverade undantag:** 9 arkaiska Latin-/svensktermer
(`mania`, `marasm`, `marasmus senilis`, `melancholia`, `mjältsjuka`,
`moderpassion`, `Morbus Addisonii`, `Morbus Basedowii`, `Morbus Brighti`,
`Morbus Menieri`, `Morbus Parkinsonii` — kategori 3, syskonen `mani`/
`marasmus`/`melankoli`/`hysteri`/`Addisons sjukdom`/`Basedows sjukdom`/
`Brights sjukdom`/`Ménières sjukdom`/`Parkinsons sjukdom` bär redan fältet) +
`MVC` (kategori 3, syskon `BMM` bär redan fältet, MVC är institutionens äldre
namn) + `MI` (kategori 5) + 9 binomiala växtnamn.

**N klar** (0.9.398, 2026-08-07): 31 poster saknade `Eng. `, dominerat av en
TA-nervserie i prefixform (22 poster, `nervi X`/`nervus X`). **24 fick fältet:**
20 unika nerver fick genuin engelsk översättning, verifierad mot mönstret i
redan skrivna `Sv. `-fält på samma poster (`nerven till m. X` → `nerve to X` för
de namnlösa grenarna, translaterad adjektivform för de namngivna — `nervus
subscapularis` → subscapular nerve, `nervus transversus colli` → transverse
cervical nerve); 2 (`nervi intercostales`, `nervi supraclaviculares`) var
dubbletter av redan Eng.-ifyllda suffixformer (se dubblettstycket ovan) och fick
syskonets text kopierad ordagrant; plus `NIVA` → neurointensive care unit och
`nackled` → craniocervical joints (samlingstermen för `articulatio
atlantoaxialis`+`articulatio atlantooccipitalis`, båda redan Eng.-ifyllda i
A-passet). **⚠️ Skrivfel hittat och rättat under passet:** tre `Sv. nerven
till m. X`-poster (`nervus musculi obturatorii interni`, `nervus musculi
quadrati femoris`, `nervus subclavius`) fick sin `Eng. `-mening infogad FÖRE
punkten i "m." (den latinska muskelförkortningen) i stället för efter hela
frasen, eftersom infogningsregexen `Sv\. [^.]*\.` tolkade "m." som meningsslut.
Upptäckt genom en egen efterkontroll (sökte hela filen efter mönstret
`m\. Eng\. `) innan generatorkedjan kördes, rättat direkt för hand. **7
motiverade undantag:** `nervfeber` (kategori 3, syskon `tyfoidfeber` bär redan
fältet) + `NT-rådet`/`NDR` (kategori 4) + 4 binomiala växtnamn.

**O klar** (0.9.398, 2026-08-07): 36 poster saknade `Eng. `, dominerat av HELA
den TA-bennomenklaturen i prefixform (30 poster, `os X`/`ossa X`). **31 fick
fältet:** 29 var dubbletter av redan Eng.-ifyllda suffixformer (`capitatum, os`
osv., se dubblettstycket ovan) och fick sin text kopierad ordagrant (`os coxae`
→ hip bone — inte att förväxla med `coxae, articulatio` → hip JOINT, båda nu
korrekt åtskilda); `ossa cuneiformia` (den enda bennamnet UTAN suffixsyskon) fick
genuin översättning → cuneiform bones; `OP` → operating department. **5
motiverade undantag:** `OSA` (kategori 5) + `OSL` (kategori 4) + 3 binomiala
växtnamn.

Eng.-täckning efter K–O: **89,0 % → 89,6 % (9 791 av 10 928, 1 137 saknar).**
`check_generators.py`: rundtripp identisk, 407 filer oförändrade, 195 tester
gröna, sidodatum.json aktuellt, 2 351/2 351 tooltip-ankare hela.

**P klar** (0.9.399, 2026-08-07): 33 poster saknade `Eng. `. **1 fick fältet:**
`PAVA` → post-anaesthesia care unit. **32 motiverade undantag:** 22 binomiala
växtnamn + `paralysis agitans`/`paralysis generalis`/`parotitis epidemica`/
`phthisis pulmonum`/`podagra`/`pustula maligna` (kategori 3, syskonen
`Parkinsons sjukdom`/`syfilis`/`påssjuka`/`tuberkulos`/`podager`/`mjältbrand`
bär redan fältet — `podagra` dessutom kategori 2, `podager`s eget `Eng. `-fält
ÄR ordet "podagra") + `PDT` (kategori 5) + `PSL`/`PL`/`PDL` (kategori 4,
svenska lagar).

**Q klar** (0.9.399, 2026-08-07): 2 poster saknade `Eng. ` — **0 fick fältet**,
båda binomiala växtnamn (`Quercus robur`, `Quassia amara`).

**R klar** (0.9.399, 2026-08-07): 17 poster saknade `Eng. `. **3 fick fältet:**
`rami musculares` → muscular branches, `RÖ` → radiology department, `REHAB` →
rehabilitation (skilt från `HAB`s "habilitation", trots att REHAB cross-refar
HAB — de är två distinkta engelska fackord, inte samma översättning). **14
motiverade undantag:** 8 binomiala växtnamn + `rachitis`/`rosen`/`rötfeber`
(kategori 3, syskonen `rakit`/`erysipelas`/`sepsis` bär redan fältet) +
`Riksstroke`/`Rikshöft` (kategori 4, svenska kvalitetsregisternamn) +
`revbensvinkel` (kategori 3, syskon `angulus costae` bär redan `Eng. angle of
rib`).

**S klar** (0.9.399, 2026-08-07): 35 poster saknade `Eng. ` — **0 fick fältet**,
den STÖRSTA bokstaven hittills med noll äkta luckor (100 % motiverade
undantag). 17 binomiala växtnamn + 9 arkaiska Latin-/svensktermer (`scirrhus`,
`scorbutus`, `senilitas`, `septicaemia`, `skrofulos`, `sphacelus`,
`stenocardia`, `stenpassion`, `strupsjuka` — samtliga kategori 3, syskonen
`carcinoma`/`skörbjugg`/`senil`+`marasmus`/`sepsis`/`tuberkulos`/`gangrän`/
`angina pectoris`/`njursten`+`gallsten`/`difteri`+`krupp` bär redan fältet) +
`SoL`/`SmL`/`SOSFS`/`ST`/`SPUR`/`SNR`/`SveDem`/`SRQ` (8, kategori 4, svenska
lagar/register/institutioner) + `svärdsutskott` (kategori 3, syskon `processus
xiphoideus` bär redan `Eng. xiphoid process`).

**T klar** (0.9.399, 2026-08-07): 24 poster saknade `Eng. `. **6 fick fältet:**
3 TA-neuroanatomiska banor (`tractus reticulospinalis`, `tractus
tectospinalis`, `tractus vestibulospinalis`) + 2 TA-artärstammar (`truncus
brachiocephalicus` → brachiocephalic trunk, `truncus coeliacus` → coeliac
trunk, brittisk stavning) + `TLV` → Dental and Pharmaceutical Benefits Agency
(samma undantag-från-undantaget som `FHM`: myndigheten har ett etablerat eget
engelskt namn, inte kategori 4 trots att den är svensk). **18 motiverade
undantag:** 12 binomiala växtnamn + `thrombosis`/`tussis convulsiva`/
`tvinsot`/`typhus abdominalis`/`tärsot` (kategori 3, syskonen `trombos`/
`kikhosta`+`pertussis`/`lungsot`/`tyfoidfeber`/`lungsot` bär redan fältet) +
`transversospinal` (kategori 2, tautologiskt — samma stavning på svenska och
engelska).

Eng.-täckning efter P–T: **89,6 % → 89,7 % (9 801 av 10 928, 1 127 saknar).**
`check_generators.py`: rundtripp identisk, 407 filer oförändrade, 195 tester
gröna, sidodatum.json aktuellt, 2 351/2 351 tooltip-ankare hela.

**U–Ö + prefix + suffix klara — HELA ORDLISTAN NU GENOMGÅNGEN A–Ö** (0.9.400,
2026-08-07), på uttrycklig begäran ("Ta alla återstående nu och även prefix
och suffix") i ett enda svep i stället för bokstav för bokstav.

**U (3 saknade):** `UVA` → post-anaesthesia care unit (samma koncept som `PAVA`
men egen, ej `Jfr`-länkad post, fick sitt eget svar). **1 motiverat undantag
till:** `utsot` (kategori 3, syskonen `diarré`/`dysenteri` bär redan fältet) +
`Urtica dioica` (binomialt växtnamn).

**V (16 saknade):** `vena portae` → hepatic portal vein, `vena renalis` →
renal vein. **14 motiverade undantag:** 9 binomiala växtnamn + `varfeber`/
`varioloides`/`vita pesten` (kategori 3, syskonen `sepsis`/`smittkoppor`+
`variola`/`tuberkulos` bär redan fältet) + `vas` (kategori 5, andra
betydelsen redan inline-översatt) + `VFU` (kategori 4, svensk
utbildningsterm utan etablerad engelsk motsvarighet, samma mönster som
`AT`/`ST`/`BT`).

**W, X, Y, Z, Å, Ä, Ö:** X, Y, Å, Ä, Ö hade 0 saknade sedan tidigare. W (1) och
Z (1) var båda binomiala växtnamn — 0 nya.

**Prefix (652 saknade av 657) och suffix (153 saknade av 153) — en helt egen
klassificering** (`is_prefix()`/`is_suffix()` läser ordklasstaggen i `def`,
egna sidor `ordlista-prefix.html`/`ordlista-suffix.html`, utanför hela
bokstavsslingan). **Metodfynd, avgörande för hela passet:** dessa är
grekiska/latinska kombinationsformer (`hyper-`, `-itis`, `cardio-` osv.) där
den engelska facktermen i den överväldigande majoriteten är **identiskt
stavad** som den redan skrivna svenska formen — engelsk och svensk
medicinsk fackvokabulär ärver samma nylatinska/grekiska stam nästan
oförändrat. Ett `Eng. `-fält hade där bara upprepat uppslagsordet, exakt
samma logik som de binomiala växtnamnen (kategori 2). **Kontrollerat
post för post, inte antaget masstautologiskt:** varje post lästes mot sin
egen `Av lat./grek. …`-etymologi (redan angiven i SAMMA post) och jämfördes
med etablerad engelsk facklitteratur.

**Prefix: 15 äkta avvikelser av 652** hittade och fyllda, i tre mönster:
1. **C/K-dubbletter** där den svenska filen bär BÅDA stavningsvarianterna
   som separata uppslagsord för samma grekiska rot, men engelskan bara
   använder EN av dem: `caryo-` → engelska är `karyo-` (med K, som
   `kary-/karyo-`s egen — redan korrekta — post); `cerat-/cerato-` →
   engelska är `kerat-/kerato-` (keratitis, keratoconus, aldrig
   "ceratitis"); `cric-/crico-/krik-/kriko-` → engelska använder bara
   `cric-/crico-`, aldrig k-formen.
2. **Brittisk stavning (ae/oe)** som den svenska formen saknar, samma
   mönster som filens redan etablerade `oesophagus`/`paediatric`/
   `hemoglobin (AmE), haemoglobin (BrE)`: `esophag-/esophago-` →
   `oesophago-` (BrE), `esthesi-/esthesio-` → `aesthesio-` (BrE),
   `eti-/etio-` → `aetio-` (BrE), `gyn-/gyne-/gynec-/gyneco-` →
   `gynaeco-` (BrE), `nevi-/nevo-` → `naevo-` (BrE), `pale-/paleo-` →
   `palaeo-` (BrE), `ped-/pedi-/pedo-` → `paed-` (BrE, bara
   barnbetydelsen — fotbetydelsen är latinsk och opåverkad), `emia-` →
   `-aemia` (BrE, komplement till den redan AmE-lika svenska formen).
3. **Enskilda felstavningar/ovanliga varianter** där den etablerade
   engelska facktermen skiljer sig på ett sätt som inte följer något
   mönster: `leci-/lecido-` → `lecith-/lecitho-` (lecithin, inte
   "lecitin" — samma th-återställning som husets `th → t`-regel fast i
   motsatt riktning), `ptyl-/ptyalo-` → `ptyalo-` (ptyalin, ptyalism),
   `pycn-/pycno-` → `pykno-` (pyknosis, standardstavningen).

**Suffix: 124 äkta avvikelser av 153** — en helt annan, mycket högre kvot än
prefixens 2,3 %, av en tydlig lingvistisk anledning. Suffixposterna ger
konsekvent BÅDA formerna i uppslagsordet, `-X / -x` (internationell/
vetenskaplig latinform / svensk förenklad form, t.ex. `-logia / -logi`,
`-therapia / -terapi`). Men den vetenskapliga latinformen på `-ia`/`-ica`
är OFTA INTE den engelska formen — ett stort antal av dessa ord kom in i
engelskan via franskan och kortades då systematiskt till `-y`
(samma ljudlag som `philosophia → philosophy`, `democratia → democracy`):
`-logia` → engelska **-logy** (oncology, inte "oncologia"), `-graphia` →
**-graphy**, `-metria` → **-metry**, `-ectomia` → **-ectomy**, `-scopia` →
**-scopy**, `-stomia` → **-stomy**, `-tomia` → **-tomy**, `-pathia` →
**-pathy**, `-therapia` → **-therapy**, `-trophia` → **-trophy**,
`-megalia` → **-megaly**, `-pexia` → **-pexy**, `-plastica` → **-plasty**,
`-rrhaphia` → **-rrhaphy**, `-tripsia` → **-tripsy**, `-doxia` → **-doxy**,
`-toxism/-toxikos` → **-toxicosis**. Andra `-ia`-suffix som myntades DIREKT
som nylatinsk/grekisk facklitteratur (inte via franskans folkliga
ljudutveckling) BEHÖLL `-ia` oförändrat i engelskan: `-algia`, `-mania`,
`-phobia`, `-plegia`, `-plasia`, `-uria`, `-emia`, `-itis`, `-osis` —
dessa fick alltså `Eng. ` = samma `-ia`-form som redan gavs (fortfarande
en äkta skillnad från den svenska `-i`-formen i posten, så en genuin
avvikelse värd att fylla, inte tautologisk). Ett dussintal fick dessutom
brittisk ae/oe-parallellform på samma sätt som prefixen (`-emia` →
`-aemia`, `-esthesia` → `-aesthesia`, `-edema` → `-oedema`, `-pnea` →
`-pnoea`, `-rrhea` → `-rrhoea`, `-menorrhea` → `-menorrhoea`, `-cythemia`
→ `-cythaemia`). **29 motiverade undantag** i suffixgruppen: enstaka
redan-tautologiska korta suffix (`-ad`, `-blast`, `-cele`, `-form`,
`-gram`, `-ism`, `-oid`, `-plasm`, `-stat` m.fl., redan identiska med
engelskan) samt två poster lämnade **obesvarade av osäkerhet snarare än
gissning** (`-liposis/-lipos` och delvis `-dermia/-derma`, där källorna
går isär) — i linje med husets regel att hellre lämna en lucka än gissa.

Eng.-täckning **89,7 % → 91,0 % (9 801 → 9 942 av 10 928, 1 127 → 986
saknar)** — det enskilt största hoppet i hela etapp 4 punkt 3, drivet av
prefix/suffix-passet. `check_generators.py`: rundtripp identisk, 407 filer
oförändrade efter 18 generatorsteg, 195 tester gröna, sidodatum.json
aktuellt, 2 351/2 351 tooltip-ankare hela.

**✅ MILSTOLPE: etapp 4 punkt 3 (`Eng.`-fältet) är nu helt avslutad — hela
ordlistan (A–Ö, prefix, suffix) genomgången.** De kvarvarande 986 är
motiverade undantag i de fem etablerade kategorierna (dominerat av
binomiala växtnamn och tautologiska kombinationsformer), inte en
arbetslista. Per grupp: A–E 0.9.396, F–J 0.9.397, K–O 0.9.398, P–T 0.9.399,
U–Ö+prefix+suffix 0.9.400.

**✅ MILSTOLPE: etapp 3 (Jfr/Se/Motsats-länkning) är klar (0.9.401).**
`scripts/generate_glossary.py` länkar nu 2 390 av 2 587 (92 %) Jfr/Se/Motsats-
referenser mot riktiga uppslagsord, direkt i den statiska `<dd>`-HTML:en (väg
(b), designbeslutet i `scripts/ordlista_forbattring_todo.md` §6) — `Se
scripts/ordlista_forbattring_todo.md` för hela metodloggen. `js/glossary.js`
rördes inte: sökträffar visar referenserna som text, precis som förut.

### Prefix- och suffixposter bär alltid sitt bindestreck

Ett uppslagsord i prefixgruppen **slutar** med bindestreck (`brady-`, `pseud- / pseudo-`),
ett i suffixgruppen **börjar** med det (`-itis`, `-ad`). Sedan 0.9.355 gäller det utan
undantag: 657 av 657 prefix och 153 av 153 suffix. Två skäl utöver formen:

- **Ett rotord är inte ett förled.** `krikos` och `psoa` låg i prefixgruppen fast de är
  grekiska rotord. Rätt åtgärd är att skriva om posten till husets kombinationsform
  (`cric- / crico- / krik- / kriko-`, med `Ex:`-rad) eller att låta den uppgå i den
  svenska grundposten (`psoa` → `psoas`) — inte att sätta dit ett streck på ett ord som
  inte är ett förled.
- **`pick_example()` väljer första strecklösa gemena termen i gruppen**, så en enda
  strecklös post kapar gruppkortets skyltord på `medicinskordlista.html`. `daktyli` blev
  suffixgruppens skyltord i D-passet, `bredspektrum` prefixgruppens. **Kontrollera kortet
  efter varje ändring av en `prefix `- eller `suffix `-tagg**; när ingen strecklös finns
  kvar visar kortet gruppens första post (`a-`, `-ad`), vilket är det önskade läget.

**Kemiska ämnesnamn på `-id` är n-ord och tar `(-en)`**, inte `(-et)`. Filens egna
`klorid`, `lipid`, `peptid`, `steroid`, `opioid`, `glykosid`, `karbamid` och `tiazid`
skriver alla `(-en)`, och läkemedelsnamnen följer grundordet: `Kaliumbromid`,
`Ipratropiumbromid`, `Ciklofosfamid`, `Loperamid`, `Furosemid`, `Glibenklamid`,
`Hydroklortiazid`, `Isoniazid`. De fyra sista bar `(-et)` till 0.9.352 —
`Hydroklortiazid` motsade till och med sitt eget grundord. **Undantag:** `suicid (-et)`
är genuint neutrum (lat. *suicidium*), inte ett ämnesnamn.

### th → t, och uppslagsordet i singular

Grekiskans `th` skrivs **`t`** i försvenskade termer: `hypotenar`, `hypotalamus`,
`paratyreoidea`, `pneumotorax`, `nefropati`. Uppslagsordet står i **singular**
(`hemorrojd`, inte `hemorrojder`). När en dubblett slås ihop behålls den korrekta
formen och den andra bevaras som "**Även …**" efter `Eng.` — då är den fortfarande
sökbar, eftersom sökningen matchar `def`-texten.

**Kontrollera ALLTID facit först (skyddsregel 6).** Den form du tar bort kan bära en
egen wirad `href`: `hypothenar` gjorde det och användes i `case.html`. Rätt ordning är

```bash
# 1. peka om facitnyckeln i data/kb_glossary_terms.json till den kvarvarande posten
# 2. skriv om sidorna – wire_terms.py är idempotent och rör ALDRIG en redan wirad länk:
python3 scripts/wire_terms.py --repoint <nyckel> ... --all
```

`--sync-defs` räcker inte: den lämnar `href` orörd med flit. Och `check_links.py`
punkt 6 prövar att facits `def` finns och att href löser ut mot ett verkligt ankare —
**inte** att texten matchar ordlistan, så def-synken görs för hand.
**Gränsen går vid om ordet är svenskt — inte vid bokstavskombinationen.** Genomfört i
hela filen 0.9.347: `talamus`, `tenar`, `epitalamus`, `metatalamus`, `subtalamus`,
`pneumotorax`, `spontanpneumotorax`, `paratyreoidea`, `nefropati`.
**Latinet behåller sitt th** — TA-termerna (`aorta thoracica`, `musculus thyrohyoideus`,
`os ethmoidale`), de latinska lemmana (`thorax`, `thymus`, `theca`, `urethra`, `isthmus`,
`phthisis`), de vetenskapliga växtnamnen (`Thymus vulgaris`) och de grekiska
kombinationsformerna, vars prefix-/suffixposter redan visar båda formerna
(`-thermia / -termi`). `thoraxkirurgi` och `Thoraxdrän` är undantag åt andra hållet:
th-stavningen är specialitetens officiella namn i Sverige.
**Men `Sv.`-fältet ska alltid ge t-formen** — `thymus` → "Sv. tymus, bräss",
`isthmus` → "Sv. istmus", `urethra` → "Sv. urinrör, uretra", `thoracalis` → "Sv. torakal".
Fyra sådana stod fel till 0.9.347.

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
bl.a. att båda stegen ger identiska länkar för var och en av de 10 937 posterna, att
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
| `scripts/ordlista_luckor.py` | Mäter breddtäckning: vilka uppslagsord som saknas. |
| `scripts/ordlista_tackning_todo.md` | Metod, triage och etapper för breddtäckningen. |
| `data/ordlista_luckor_ignorerade.json` | Triagerade falska träffar, med motivering. |
| `data/ordlista_luckor_facit.json` | Facit för `ordlista_luckor.py --check`. Skrivs av verktyget. |
| `CLAUDE_REGLER.md` | Projektregler (dubblettförbud, källtrohet, versionering). |
