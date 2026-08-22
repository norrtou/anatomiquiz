# Verktygen — analys och backlog (facit)

> **PROAKTIVA REGLER — [`CLAUDE_REGLER.md` §0](../CLAUDE_REGLER.md) gäller över detta dokument.**
> Varje punkt här ska säga hur något byggs **rätt från början**. Hittas en ny feltyp under
> arbetet skrivs den in i regeldokumentet i samma pass, inte i den här filen.

Detta är facit för `/verktyg/` som helhet. **Status läses här, inte ur minnesindexet** —
grep den här filen innan något sägs vara klart eller väntande.

Beställd 2026-08-22 som en analysfråga: *vad mer för verktyg som konkurrenter har borde
finnas för utbildningssyfte?* Analysen skulle ge en ärlig uppfattning om behov, inte
producera en lista för listans skull. Den avgränsningen gäller även framåt — en post får
läggas till här bara om den kan motiveras mot sajtens eget innehåll, inte mot vad en
konkurrent råkar ha.

**Gränsdragningen mot `akutmedicin_verktyg_todo.md`:** den filen äger `/verktyg/akutmedicin/`
och dess sju sidor. Den här filen äger verktygssektionen i stort. En post som bara rör
akutmedicinsidorna hör hemma där, inte här — undantaget är §1 nedan, som skrevs här därför
att den hittades under den här analysen, och som pekar tillbaka dit.

---

## 0. Inventering 2026-08-22 (verifierad mot repot)

| Verktyg | Omfattning | Målgrupp i praktiken |
|---|---|---|
| `/verktyg/akutmedicin/` | 21 poängskalor över 7 sidor | läkare, sjuksköterska |
| `/verktyg/lakemedelsberakning.html` | 4 räknare | sjuksköterska, apotekare |
| HEC (extern) | 12 övningar, öga–hand-koordination | arbetsterapeut |
| Aktivitetsdagboken (extern) | dygnskartläggning | arbetsterapeut |

**Underlag som finns men saknar verktyg:**

- 12 utbildningar med frågedata, 500–1 800 frågor styck (`data/<utbildning>.json`).
- 198 muskler i 16 strukturerade JSON-filer (`data/muskeltabeller/`), med fälten
  `latin`, `svenska`, `grupp`, `origo`, `insertio`, `innervation`, `funktion`.
- ROM-data per led, rörelse och plan (`data/leder_rom/`, 4 filer).
- 654 prefixposter och 153 suffixposter i `data/ordlista.json` (10 940 uppslagsord),
  med etymologi och exempel i varje `def`.

Allt ovan renderas idag som **statiska tabeller** med utskrift/PDF/CSV via
`js/kb-table-tools.js`. Ingen av dem är sökbar eller filtrerbar.

### 0a. De två luckorna analysen faktiskt hittade

**1. Verktygen är akutmedicin, men sajten är anatomi.** Hela verktygssektionen ligger i
klinisk medicin. Muskel-, nerv- och ROM-tabellerna — sajtens egen kärna, och exakt det
Kenhub och TeachMeAnatomy bygger sin produkt på — har inget interaktivt verktyg alls.

**2. Sajten frågar om formler den inte kan räkna.** Verifierat i frågedatan:
`data/apotekare.json` har Cockcroft-Gaults formel som svarsalternativ,
`data/biomedicinsk_analytiker.json` frågar vilken formel som uppskattar eGFR, och
`kroppsyta` förekommer i sju frågefiler. eGFR, kroppsyta, BMI och justerad kroppsvikt
finns **inte** som räknare någonstans. Lund–Malmö reviderad, den svenska
standardekvationen, nämns inte i repot över huvud taget (grep 2026-08-22, 0 träffar).

---

## 1. Wells PE — LEVERERAT 0.9.426

Hittades under analysen 2026-08-22. **Åtgärdat i samma arbetspass som det rapporterades**
(§fix-findings-dont-defer). Posten står här därför att fyndet gjordes här; den tekniska
historiken hör till `akutmedicin_verktyg_todo.md`.

### 1a. Vad felet var

`verktyg/akutmedicin/blodproppar.html` hade tre instrument: Wells DVT, PERC och sPESI.
Sidans egen prosa säger två saker som tillsammans inte gick ihop:

- PERC-texten (korrekt): *"Regeln gäller bara i kombination med en redan låg klinisk
  misstanke. Det är det vanligaste missförståndet om PERC."*
- sPESI-texten: *"säger ingenting om sannolikheten för diagnosen — den frågan besvaras av
  Wells och PERC ovan."*

Men sidans enda Wells var **DVT-versionen** (Wells et al. 2003). För lungemboli lärde sidan
alltså ut att förtestsannolikheten måste fastställas först, och gav inget instrument som gör
det. Hänvisningen "Wells … ovan" pekade på en skala för en annan diagnos.

Det var inte ett fel i någon räknare — alla tre räknade rätt. Det var ett hål i
**resonemangskedjan**, och därmed precis den sortens fel som sidorna är byggda för att inte
göra.

### 1b. Åtgärd

- [x] Wells PE tillagd som `wells_pe` i `data/akutmedicin.json` — mönster A
      (kryssruteskala) enligt `akutmedicin_verktyg_todo.md` §3a, alltså en JSON-post och
      ingen ny kod.
- [x] Både treniv̊agrupperingen (låg/måttlig/hög) och den dikotoma (PE unlikely ≤4 /
      PE likely >4) redovisas, eftersom originalpublikationerna använder båda och
      förväxlingen mellan dem är ett eget inlärningsproblem.
- [x] Statisk prosa i HTML enligt §3b — monteringspunkt `<div data-akut="wells_pe"></div>`,
      all termbärande text i HTML så att `wire_terms.py` når den.
- [x] sPESI-styckets hänvisning omskriven så att den pekar på rätt skala.
- [x] Wells DVT-avsnittet fick en mening som skiljer de två Wells-skalorna åt — samma
      namn, olika kriterier, olika diagnos.
- [x] Referensfall med känt facit ur originalpublikationen i
      `scripts/test_verktyg_akutmedicin.js` (§3d — ett bygge utan gröna referensfall
      levereras inte).
- [x] Källor: Wells et al. (2000) *Thromb Haemost* 83(3), 416–420 och Wells et al. (2001)
      *Ann Intern Med* 135(2), 98–107. Uppslagna före de skrevs (§6.2), in i sidans
      APA-lista och i `info.html` i samma pass.

---

## 2. Njurfunktion och kroppsmått — FÖRESLAGET, ej beslutat

Den enda posten i analysen som jag skulle kalla ett **tydligt behov**. Motiveringen är
sajtens eget innehåll (§0a punkt 2), inte att MDCalc har den.

**Var användaren möter det:** en ny sida under `/verktyg/`, i samma form som
läkemedelsberäknaren — fyll i det du vet, lämna det du vill veta tomt, få uträkningen
utskriven. Den som räknat en dos i läkemedelsberäknaren kan gå vidare och se vad
njurfunktionen gör med samma dos.

**Pedagogiska poängen, det som skiljer den från en ren kalkylator:** skillnaden mellan
relativ GFR (ml/min/1,73 m², för stadieindelning) och absolut GFR (ml/min, för dosering).
Studenter blandar ihop dem konsekvent, och konkurrenterna hanterar det dåligt.

Innehåll att bygga: Lund–Malmö reviderad (svensk standard), CKD-EPI, Cockcroft-Gault,
kroppsyta (Mosteller och Du Bois), BMI, ideal- och justerad kroppsvikt.

**Gränsen mot LMH-beslutet i `akutmedicin_verktyg_todo.md` §0c håller, och måste hållas
uttryckligen:** räknaren ger ett tal och förklarar vad talet betyder. Den säger aldrig
vilken dos som ska ges eller var en dosgräns går för ett namngivet preparat. Skrivs in i
sidans egen text, inte bara här.

## 3. Ordbyggaren — FÖRESLAGET, ej beslutat

Prefix + rot + suffix, åt båda håll: sätt ihop delar och se betydelsen växa fram, eller
mata in `hepatomegali` och se ordet falla isär. Det är verktyget som passar just den här
sajten — ingen MDCalc-liknande konkurrent har något motsvarande, och sajten har redan
tre ställen med medicinsk terminologi plus `ordlista-prefix.html` och `ordlista-suffix.html`.

**Ärlig brasklapp, verifierad 2026-08-22:** rotlagret är ofullständigt. `hepat- / hepato-`
finns som egen post i `data/ordlista.json`, men `kardi(o)-`, `nefr(o)-`, `osteo-` och `myo-`
gör det inte — de finns bara inbakade i sammansatta uppslagsord. En kuraterad rotlista måste
byggas först. **Det är riktigt innehållsarbete, inte en inkoppling av befintlig data**, och
den insatsen ska ligga på bordet innan bygget beställs (§proportional-effort).

## 4. Muskelsökaren — FÖRESLAGET, ej beslutat

Filtrera 198 muskler tvärs över de 16 regionerna. Idag går det bara att läsa en region i
taget, och frågan "vilka muskler innerveras av n. medianus?" kräver att man öppnar fyra
sidor och läser för hand.

- **Innervationsfiltrering fungerar direkt** på befintlig data — `innervation` är ett eget
  fält med konsekvent form (`Nervus suprascapularis (C5–C6)`).
- **Rörelsefiltrering gör det inte.** `funktion` är löptext (*"Initierar abduktion av armen
  (0–15°); centrerar och stabiliserar humerushuvudet i ledpannan"*). Filtrering på rörelse
  blir nyckelordsmatchning om inte varje muskel taggas manuellt — 198 taggningar, som ska
  räknas in i beställningen och inte upptäckas halvvägs.

`data/leder_rom/` kan ligga i samma verktyg: led → rörelse → plan → normalt rörelseutslag →
muskler som utför den. Tjänar fysioterapeut och arbetsterapeut samtidigt.

---

## 5. Vad som INTE ska byggas — och varför

Den här listan är lika mycket av svaret som §2–4. Den skrevs för att posterna nedan ser
lockande ut nästa gång någon jämför med en konkurrent, och skälen ska då finnas nedskrivna.

**Fler poängskalor bara för att fylla listan.** Ottawa-reglerna, HEART, PSI/PORT, MEWS.
`kunskapsbank/kliniska-poangskalor.html` förklarar redan de fyra mönster som alla 21
befintliga skalor följer. Den 22:a skalan lär ut samma sak en gång till. *Wells PE i §1 är
inte ett undantag från detta — den byggdes för att sidans eget resonemang krävde den, inte
för att listan var kort.*

**Yrkesspecifika räknare för optiker, audionom, logoped och tandläkare.**
Receptransponering och tonmedelvärde ser motiverade ut eftersom de utbildningarna har
500 frågor och noll verktyg. Men de når **en av tolv målgrupper var**. eGFR och kroppsyta
(§2) möter fem: apotekare, sjuksköterska, läkare, biomedicinsk analytiker och
röntgensjuksköterska. Det är argumentet — räckvidd i användarledet, inte byggkostnad.

**3D-anatomivisare.** Konkurrenterna har det. Det kräver licensierade modeller, och utan
dem går det inte att göra ärligt.

**Doseringsreferenser av FASS-typ.** Redan avgjort i `akutmedicin_verktyg_todo.md` §0c.
Avgörandet står fast och gäller hela verktygssektionen, inte bara blodpropparna.
