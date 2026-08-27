# Ordlistans breddtäckning — metod och facit

> **Status:** Analys gjord 2026-08-27 på frågan *"det saknas många ord i ordlistan,
> varför finns inte X? Hur garanterar vi att den blir mer komplett?"* Mätverktyget
> `scripts/ordlista_luckor.py` är byggt och kört; utgångsläget nedan är mätt, inte
> gissat. Ingen post är ännu skriven ur listorna — det är etapp 1 och framåt.
>
> **PROAKTIVA REGLER — [`CLAUDE_REGLER.md` §0](../CLAUDE_REGLER.md) gäller över detta
> dokument.** Särskilt §0.3: kandidatlistorna nedan är *underlag*, aldrig poster.
> Varje uppslagsord skrivs för hand i husformat.

---

## 1. Varför frågan inte gick att besvara förut

Ordlistan har ett välbyggt mått på **djup** och inget alls på **bredd**.

`ORDLISTA.md` mäter fälttäckning: hur många av de 10 940 posterna som bär `Eng. `,
etymologi, böjning, `Jfr `, `ICD-10: `. `scripts/ordlista_forbattring_todo.md` driver
fem etapper — alla inne i poster som redan finns. Arbetsflödet är "en bokstav i taget".

Ingen av de mätningarna kan se ett saknat ord. **En bokstavsvandring läser de rader
som är skrivna; ett hål har per definition ingen rad att läsa.** Fas 1 och 2 tömde
råimporten på 3 965 termer, och sedan dess har filen vuxit med tematiska batchar
(TA-anatomi, labbvärden, ICD-sjukdomar, psykiatri, läkemedel, örter). Bredden har
alltså aldrig bestämts av en täckningsanalys, utan av vad importen och batcharna
råkade innehålla.

### Det syns i filen

| Ordlistan har | Ordlistan saknar |
|---|---|
| `enterokolit`, `ulcerös kolit`, `mikroskopisk kolit` | `kolit` |
| `antimetabolit` | `metabolit` |
| `karcinomatos`, `-carcinoma / -karcinom` | `karcinom` |
| `hyperplasia` | `hyperplasi` |
| `fibromyalgi`, `nackmyalgi`, `polymyalgi` | `myalgi` |
| `kardiomyopati`, `polymyopati` m.fl. | `myopati` |
| åtta `-skopi`-poster (`artroskopi`, `bronkoskopi` …) | `koloskopi`, `otoskopi`, `mikroskopi` |
| `epikondyl`, `epikondylalgi` | `epikondylit` |
| — | `scintigrafi`, trots 47 förekomster i sajtens eget innehåll |

Mönstret är entydigt: **sammansättningen finns, grundordet saknas.** Det är precis
den lucka en alfabetisk genomgång är blind för, eftersom sammansättningen står på sin
plats och ser färdig ut.

### Om frågans exempel

**`alexinomi` finns inte i ordlistan — men det är inte heller en etablerad medicinsk
term.** Det närmaste i filen är `alexitymi` (svårighet att identifiera och sätta ord
på egna känslor), som redan har en post. Två *riktiga* termer som ligger nära i form
och betydelse saknas dock, och de är typiska för hålet ovan:

- **`alexi`** (alexia, förvärvad oförmåga att läsa) — `dyslexi` finns, `alexi` inte.
- **`anomi`** (anomisk afasi, ordfinnandesvårighet) — `afasi` finns, `anomi` inte.

Samma prov över 30 vanliga neurologiska bristtermer gav **21 saknade**: `agrafi`,
`akalkuli`, `amusi`, `anartri`, `prosopagnosi`, `astereognosi`, `abasi`, `astasi`,
`ageusi`, `simultanagnosi`, `hemineglekt`, `asomatognosi`, `Gerstmanns syndrom`,
`Balints syndrom` m.fl. — trots att `agnosi`, `apraxi`, `afasi`, `anosognosi` och
`akatisi` alla har poster. Grannarna finns, familjen är halv.

---

## 2. Metoden

Ett ord kan inte läggas in för att någon *tycker* att det saknas — då blir listan
lika godtycklig som importen var. Metoden är därför byggd på samma princip som
resten av projektet: **härled kandidaterna maskinellt ur belägg som redan finns,
triagera för hand, och spärra mot återfall.**

```
       BELÄGG                     TRIAGE                      SPÄRR
  sex källor i trädet   →   ord som ska skrivas    →   facit + --check
  (ordlista_luckor.py)      eller ignoreras           i CI/arbetsflödet
                            med motivering
```

### 2.1 Sex källor — `scripts/ordlista_luckor.py`

Ingen källa gissar fram ord. **Varje kandidat är belagd någonstans i trädet.**

| Källa | Belägget | Varför utslaget är en lucka |
|---|---|---|
| `korsref` | `Jfr …`, `Se …`, `Motsats …` som pekar på något utan post | Ordlistan lovar ett uppslagsord som inte finns. Hårdast av alla — posten har redan sagt att ordet hör hit. |
| `exempel` | `Ex: …` i prefix-/suffixposterna | Byggstenen är förklarad, ordet den bygger går inte att slå upp. |
| `synonym` | `Sv. <ord>` där det svenska ordet inte själv är lemma | Policyfråga, se §4. |
| `brodtext` | Ord i ordlistans **egna definitioner** med medicinsk morfologi | Vi förklarar ett ord med ett annat ord som inte går att slå upp. |
| `korpus` | Ord i sajtens **eget innehåll** (quizbanker, kunskapsbank, sidor) | Vi lär ut ordet och kan sedan inte förklara det. |
| `huvudord` | Sammansättningar i ordlistan vars huvudord saknas | `ulcerös kolit` utan `kolit`. |

**Kombinatorik är medvetet bortvald.** Att korsa stammar med ändelser (`gastr-` bär
`-it`, `-ektomi` och `-skopi`, alltså borde …) prövades och gav `dysalgi`, `dyscyt`,
`dysektomi` — påhittade ord. En ordbok som fylls med konstruerade former blir sämre,
inte bättre, och §0.3 förbjuder det uttryckligen. Vill man ha bredd bortom trädet är
svaret externa auktoritetslistor (§5), inte generering.

### 2.2 Filtren — och varför de måste finnas

Källorna är råa textsvep, så tre klasser av falska träffar filtreras bort i koden
(inte i triagen — de är för många och för regelbundna för handpåläggning):

1. **Svensk böjning av befintligt lemma.** `epikondylerna` är inte ett nytt
   uppslagsord när `epikondyl` står i filen.
2. **Latinsk/grekisk böjning av befintligt lemma.** `musculi`, `arteriae`, `ossa`,
   `cordis` är böjda former av lemman som redan finns. Utan det filtret svarade
   `huvudord` med 375 kandidater varav de flesta var TA-genitiver; med filtret 17.
3. **Främmandespråksfälten.** `Eng. arthritis.` och `Av gr. arthron = led.` bär per
   konstruktion utländska ord. Räknas de med svarar `brodtext` `disease`, `anaemia`,
   `capitis` — engelska motsvarigheter och etymon, inte saknade svenska uppslagsord.

Dessutom **två suffixnivåer med flit**. De öppna källorna (`brodtext`, `korpus`)
läser löpande svenska och kräver suffix på minst tre tecken — släpps `-al`, `-in`
och `-om` in där svarar de `normal`, `sedan`, `eftersom`. De slutna källorna läser
bara ordlistans egna lemman, som redan är medicinska, och använder den vida listan:
utan tvåteckensformen `-it` syns inte att `kolit` saknas bakom `ulcerös kolit`.

### 2.3 Triagen är en del av metoden, inte efterarbete

Varje utslag har exakt två utgångar:

- **Ordet ska finnas** → skrivs för hand i husformat, infogas mellan sina två
  grannar enligt sorteringsregeln i `ORDLISTA.md`.
- **Ordet ska inte finnas** → in i `data/ordlista_luckor_ignorerade.json`
  **med motivering**. Nästa person ska kunna se att beslutet är taget, inte gissa.

Ignorerlistan är inte en soptunna. Ett ord hamnar där för att det inte hör hemma i
en medicinsk ordbok — inte för att posten är jobbig att skriva.

### 2.4 Spärren — det som gör metoden till en garanti

`data/ordlista_luckor_facit.json` håller antalet otriagerade utslag per källa.

```bash
python3 scripts/ordlista_luckor.py --check     # exit 1 om någon källa VUXIT
```

Spärren är en spärrhake: **talen kan bara gå nedåt.** Skriver någon en ny quizfråga
med ett ord ordlistan inte täcker växer `korpus` och `--check` faller. Då är valet
att skriva posten eller att motivera bort ordet — inte att låta sajten glida ifrån
sin egen ordbok. Efter varje triagerat pass:

```bash
python3 scripts/ordlista_luckor.py --skriv-facit
```

Det är skillnaden mot "vi ska bli mer kompletta": utan spärr är fullständighet en
ambition, med spärr är den ett tillstånd som inte kan försämras obemärkt.

---

## 3. Utgångsläget (mätt 2026-08-27 — gissa inte om)

`data/ordlista.json`: **10 940 poster** (11 098 efter etapp 1).

| Källa | Kandidater | Vad utslaget betyder |
|---|---:|---|
| `korsref` | 176 → **0** | posten lovar ett uppslagsord som inte finns (etapp 1, 0.9.427) |
| `exempel` | 415 | byggstenens exempelord saknar egen post |
| `synonym` | 2 296 | svenskt synonymord utan eget uppslagsord |
| `brodtext` | 548 | ordet förklarar en annan post men saknar egen |
| `korpus` | 786 | ordet används på sajten men saknas i ordlistan |
| `huvudord` | 17 → **0** | sammansättningar finns, huvudordet saknas (etapp 2, 0.9.428) |

**3 770 unika ord** totalt; **1 576** om `synonym` räknas bort (efter etapp 1: 3 612 respektive 1 404) (den är en policyfråga,
se §4). Källorna överlappar med flit — ett ord som faller ut ur flera är starkare
belagt, och `--json` ger hela materialet för den som vill korsa listorna.

Ett urval ur varje lista, för att visa vad det handlar om:

- **`korsref`:** tyfus, urinsyra, kallbrand, signalsubstans, fettsyra, benmärg,
  slagvolym, kontraktur, varicer, sätesbjudning, antibiotikaresistens, dermatofyt,
  nikotin, curare, kapsaicin, stryknin, kolkicin, johannesört.
- **`exempel`:** scintigrafi, sfygmomanometer, kromosom, baroreceptor, nefropexi,
  heterofori, kakosmi, myalgi, lymfangiom, rektocele.
- **`brodtext`:** diagnos, analys, organism, mikroorganism, kromosom, mikroskop,
  hyperplasi, gallstas, ventrombos, ledgångsreumatism, småkärlsvaskulit.
- **`korpus`:** skelettscintigrafi, metaplasi, muskelatrofi, epikondylit, myelografi,
  sialografi, pulsoximetri, koloskopi, blodgasanalys, immunhistokemi, lysozym,
  njurartärstenos, omfalocele, diapedes, bradypné.
- **`huvudord`:** sjukdom, medicin, analys, myopati, myalgi, myosit, myelit,
  aponeuros, renal, sternal, faryngeal.

---

## 4. Ett beslut som behöver fattas innan `synonym` arbetas av

2 296 svenska ord står i dag **bara** som `Sv. <ord>` inne i en latinsk post. De
vanligaste vardagsorden i hela ämnet hör dit: `hjärta`, `muskel`, `blod`, `nerv`,
`cell`, `hud`, `ben`, `led`, `sena`, `lunga`, `urin`, `smärta`, `svullnad`, `vaccin`,
`organ`, `medicin`.

Det är **inte trasigt** — sökningens steg 2 letar i definitionerna, så en sökning på
*hjärta* hittar `cor`. Men det är ett vägval som aldrig skrivits ner, och det slår
mot den uttalade visionen ("nätets bästa medicinska ordbok **på svenska**"): den som
söker på svenska får en latinsk post som svar, och sajtens tooltips kan bara peka på
lemman.

Tre vägar, att välja mellan innan listan rörs — **inte** en och en post för post:

- **(a) Låt stå.** Latinet är uppslagsordet, svenskan är synonym. Kräver noll arbete
  och ingenting går sönder. Skriv då ner beslutet i `ORDLISTA.md` och lägg hela
  `synonym`-källan i ignorerlistan, så att den slutar bruka mätningen.
- **(b) Se-poster.** `hjärta` blir en egen kort post: `subst. (-at, pl. -an) Se cor.`
  Ger svenska ingångar och tooltip-ankare till låg kostnad per post, men lägger till
  tusentals poster som inte bär eget innehåll och blåser upp postantalet.
- **(c) Fullständiga svenska poster** för de vanligaste hundratalet, `Se`-post för
  resten. Dyrast och bäst; kräver att man först rangordnar vilka hundra.

**Rekommendation: (c), avgränsad till de ord som faller ut ur mer än en källa.**
`medicin`, `analys`, `diagnos` och `sjukdom` faller ut ur tre källor var — de är
inte gränsfall.

---

## 5. Vad metoden inte gör — och vad som krävs sedan

De sex källorna mäter **inre** fullständighet: att ordlistan täcker det sajten själv
säger och lovar. Det är den halva som går att göra i trädet, och den är värd att göra
först — ett ord som redan står i en quizfråga är bevisligen efterfrågat.

Den mäter **inte** yttre fullständighet: om ordlistan täcker *ämnet*. Ett ord som
varken sajten eller ordlistan nämner kan ingen intern källa upptäcka — det är därför
`alexi` och `anomi` inte hittas av verktyget ovan, och varför de 21 neurologiska
bristtermerna i §1 hittades med ett handskrivet prov i stället.

Det kräver externa auktoritetslistor, prövade en i taget:

| Källa | Ger | Anmärkning |
|---|---|---|
| Terminologia Anatomica | anatomins fullständiga nomenklatur | delvis redan importerad; täckningen mot listan är omätt |
| ICD-10-SE (Socialstyrelsen) | diagnoserna med kod | 944 poster bär `ICD-10: ` i dag; hur många kapitel är tomma? |
| ATC-registret / FASS | läkemedelssubstanser och grupper | `korsref` visar redan hål (nikotin, kolkicin, curare) |
| NPU/labbhandboken | analyser och referensvärden | 78 poster bär `Referensvärde` |
| Svenska MeSH (KI) | ämnesord med svensk/engelsk parning | bra facit för `Eng. `-fältet på köpet |

**Var och en är en egen etapp med eget upphovsrättsligt och källkritiskt övervägande**
— ingen lista importeras rakt av, och ingen post skrivs av från en källa. Listan
används som *täckningsfacit*: vilka begrepp saknas, inte vilken text de ska ha.

---

## 6. Etapper (förslag, i den ordning som ger mest per timme)

Bocka av här när något görs, och skriv in vad som faktiskt hände.

- [ ] **Etapp 0 · Beslut om `synonym`** (§4). Blockerar 2 296 av 3 770 kandidater;
      allt annat arbete blir billigare när vägvalet är gjort. En sittning, inte ett pass.
- [x] **Etapp 1 · `korsref` (176) — KLAR (0.9.427). Nollad.** 158 nya poster
      (10 940 → 11 098), 19 utslag motiverat ignorerade, 2 fel i befintliga poster
      rättade (`tarsorafi` hänvisade till `-rafi` med ett r; `maternell` pekade på
      `paternell` som bara fanns som `paternal`). Två saker att ta med sig:
      **(a)** de nyskrivna definitionerna kördes genom källan *före* insättning och
      innehöll då 33 egna hängande referenser — en etapp som stänger 176 luckor och
      öppnar 33 nya är ingen etapp, så det steget hör till arbetsordningen nedan.
      **(b)** insättningsnyckeln mättes fram: filen sorterar grekiska bokstäver som
      sina utskrivna namn och å/ä/ö efter z i ordningen ä, å, ö (98,95 % av
      granneparen, mot 98,28 % för diakritisk fold). Sidoeffekt utan eget arbete:
      `exempel` 415 → 405, `brodtext` 548 → 536, `korpus` 786 → 775.
- [x] **Etapp 2 · `huvudord` (17) — KLAR (0.9.428). Nollad.** 14 nya poster
      (11 098 → 11 112), 3 motiverat ignorerade. `sjukdom` stod bakom 30
      sammansättningar och `medicin` bakom 21 utan att själva vara uppslagsord.
      **Placeringslogiken byggdes om i samma pass:** ren `bisect` landade
      `myopati` efter `Ménières sjukdom`, och "första platsen som inte bryter
      ordningen" tog emot allt i suffixblocket först i filen (som tappar sitt
      bindestreck i nyckeln och sorterar som a-ord). Nu poängsätts varje giltig
      plats efter delat prefix med **båda** grannarna. `kolit` ligger kvar i
      `korpus` — den kommer i etapp 5.
- [ ] **Etapp 3 · `exempel` (415).** Prefix-/suffixposterna blir samtidigt
      genomgångna, vilket ORDLISTA.md:s byggstensavsnitt tjänar på.
- [ ] **Etapp 4 · `brodtext` (548)** och **etapp 5 · `korpus` (786)**, i den ordningen:
      brödtexten är ordlistans eget löfte, korpusen sajtens.
- [ ] **Etapp 6 · Spärren in i arbetsflödet.** Lägg `ordlista_luckor.py --check` i
      `scripts/check_generators.py` efter de sex befintliga kontrollerna, eller i
      `.githooks/pre-commit` bredvid versionssynken. **Görs sist**, när talen är
      nere — en spärr som är röd från dag ett lärs man sig att kringgå.
- [ ] **Etapp 7 · Externa auktoritetslistor** (§5), en i taget, med täckningsmätning
      före beslut om import.

### Arbetsordning inom en etapp

1. `python3 scripts/ordlista_luckor.py --lista <källa> --topp 0`
2. Gå igenom uppifrån (frekvensordnat = mest efterfrågat först). Varje ord:
   skriv post, eller motivera in det i ignorerlistan.
3. **Kör utkasten genom korsreferenskontrollen innan de sätts in.** Varje `Jfr`,
   `Se` och `Motsats` i en ny definition ska peka på ett lemma som finns — annars
   betalar etappen tillbaka en del av det den tjänade. I etapp 1 var det 33 av 158.
4. Nya poster infogas mellan sina två grannar — **sortera aldrig om filen**
   (`ORDLISTA.md`, avsnittet Sortering). Nyckeln: grekiska bokstäver som utskrivna
   namn, å/ä/ö efter z i ordningen ä, å, ö. Granska grannparen i utskrift före
   skrivning, och skriv med `indent=2` + avslutande radbrytning så att diffen blir
   fyra rader per post.
5. `python3 scripts/generate_glossary.py` — sluggkollisionskontroll.
6. `python3 scripts/check_generators.py` — rundtripp identisk.
7. `python3 scripts/ordlista_luckor.py --skriv-facit`, versionsbump, commit.

---

## 7. Skyddsregler (bindande)

1. **Ingen post skrivs maskinellt.** Kandidatlistan är underlag; texten skrivs för
   hand i husformat (§0.3). Ett skript som genererar definitioner får inte byggas.
2. **Inget ord läggs in som inte går att belägga.** Faller ett ord ut ur en källa men
   visar sig inte vara en etablerad term — som `alexinomi` — ignoreras det med
   motivering. Ordboken ska inte innehålla ord som inte finns.
3. **Kontrollera mot filens grannposter innan en post skrivs.** Motsägelser inne i
   ordlistan är dyrare att hitta än att undvika (`ORDLISTA.md`, Husformat).
4. **`--skriv-facit` körs efter triage, aldrig för att tysta en röd `--check`.**
   Ett växande tal är informationen; att skriva över det är att kasta den.
5. **En etapp per commit**, som i `ordlista_forbattring_todo.md`.

---

## Relaterat

| Fil | Roll |
|---|---|
| `scripts/ordlista_luckor.py` | Mätverktyget — sex källor, triage, spärr. |
| `data/ordlista_luckor_ignorerade.json` | Triagerade falska träffar, med motivering. |
| `data/ordlista_luckor_facit.json` | Facit för `--check`. Skrivs av verktyget. |
| `../ORDLISTA.md` | Vad ordlistan är, husformat, sortering — och fälttäckningen (djupet). |
| `ordlista_forbattring_todo.md` | Fältkompletteringen inne i befintliga poster (djupet). |
| `../CLAUDE_REGLER.md` | §0 proaktiva regler, §0.3 handskrivet framför maskinellt. |
