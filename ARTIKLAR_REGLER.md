# ARTIKLAR_REGLER.md — Anatomiquiz · artikelstrategi, hierarki och redaktionella regler

> **BINDANDE.** Läs det här dokumentet **innan** en artikel planeras, skrivs eller revideras,
> och innan artikelinfrastrukturen ändras. Det styr *vad* som skrivs, *för vem*, *var det
> hamnar i hierarkin* och *hur det beläggs*.
>
> Kompletterar:
> - [`SEO_REGLER.md`](SEO_REGLER.md) — head-mall, JSON-LD, a11y, kedjan, tooltips. **Vid konflikt om kod/SEO gäller SEO_REGLER.**
> - [`CLAUDE_REGLER.md`](CLAUDE_REGLER.md) — språk, terminologi, faktakontroll, källor i `info.html`.
> - [`UTBILDNINGAR_REGLER.md`](UTBILDNINGAR_REGLER.md) — vilka utbildningar/ämnen som finns (styr målgrupp och quiz-CTA).
>
> **Status:** GODKÄND. Infrastrukturen (våg 0) byggd i 0.9.186, terminologipelaren lagd på
> artikelstandard i 0.9.191. Våg 1 klar; våg 2 påbörjad: artikel 8 (*Ledtyper*) skriven
> 2026-07-21 och artikel 9 (*Så läser du en muskeltabell*) 2026-07-22, båda ännu utan
> versionsbump.
> **Senast uppdaterad:** 2026-07-22. **Version:** 1.0

---

## 0. Grundprinciper

1. **Kvalitet före kvantitet.** En artikel med en egen, verifierad poäng är värd mer än tio
   tunna sidor. Målet är många artiklar *över tid*, aldrig många artiklar *snabbt*.
2. **En sak i taget.** Bygg en artikel färdig (text + referenser + tooltips + länkar + kedjan)
   innan nästa påbörjas. Ingen batch-produktion av artiklar.
3. **Varje artikel ska ha en poäng.** Kan poängen inte formuleras i en mening — skriv inte
   artikeln. Poängen skrivs in i registret (§2.3) och får inte dubbleras av en annan artikel.
4. **Artiklar förstärker det som redan finns.** Anatomiquiz har ordlista, tabeller, case och
   quiz. En artikel som inte länkar in i den strukturen är en missad artikel.
5. **Inget påstående utan täckning.** Se §6. Detta är en YMYL-sajt; en felaktig faktauppgift
   kostar mer trovärdighet än tio artiklar bygger upp.

---

## 1. Arkitektur — hierarki och URL:er

### 1.1 Den hårda begränsningen

**Publicerade URL:er ändras aldrig** (GitHub Pages kan inte göra 301 — `SEO_REGLER.md` §11.E).
Allt som redan ligger i `/kunskapsbank/` ligger kvar där det ligger. Ny hierarki byggs
**additivt**: nya nivåer uttrycks i navigation, brödsmulor och JSON-LD — inte genom att flytta filer.

### 1.2 Fyra nivåer

```
N0  /kunskapsbank/                     Kunskapsbanken (hub)
     │
N1   ├── /medicinskordlista.html       Ordlistan          ← nås först, orörd
     ├── medicinsk-terminologi.html    Terminologipelaren ← har redan 5 undersidor
     ├── listor-tabeller.html          Listor & tabeller  ← har redan 3 undernivåer
     ├── /case.html                    Patientfall
     └── faktatexter.html              ARTIKLAR (ingång)
          │
N2        ├── artiklar/rorelseapparaten.html     ämneshubb
          ├── artiklar/nervsystemet.html         ämneshubb
          ├── artiklar/hjarta-karl.html          ämneshubb
          ├── artiklar/inre-organ.html           ämneshubb
          ├── artiklar/klinisk-anatomi.html      ämneshubb
          └── artiklar/plugga-och-tenta.html     ämneshubb
               │
N3             └── artiklar/<slug>.html          artiklarna
```

Plus **en tvärgående, platt ingång**: `artiklar/index.html` = *Alla artiklar*, filtrerbar på
ämne, målgrupp och typ. Den är till för människor som vet vad de söker, för crawlers och för
agentisk inläsning. Ämneshubbarna är till för den som bläddrar.

### 1.3 Varför platt URL-namnrymd under `/kunskapsbank/artiklar/`

Alla artiklar ligger i **samma katalog**, oavsett vilken ämneshubb de hänger under.

- **Omkategorisering blir gratis.** Flyttas en artikel från *Rörelseapparaten* till *Klinisk
  anatomi* ändras ett fält i registret — inte URL:en. Läggs artikeln i `artiklar/rorelseapparaten/…`
  är den inlåst för alltid. Det här är precis det misstag som är "oerhört idiotiskt att behöva ändra sedan".
- **Katalogdjup är ingen rankingfaktor.** Hierarki kommuniceras till Google/Bing via
  brödsmulor, `BreadcrumbList`, interna länkar och `hasPart` i JSON-LD — inte via sökvägen.
- **Artiklar blir maskinellt urskiljbara** från tabeller (`muskeltabell-*`, `nervtabell-*`,
  `skelett-*`, `leder-*`, `karl-*`), som ligger platt direkt i `/kunskapsbank/`.

Ämneshubbarna ligger också i `artiklar/` (`artiklar/nervsystemet.html`) — samma resonemang:
en hubb kan behöva byta nivå.

### 1.4 De befintliga platshållarna

`faktatexter.html` har idag fyra platshållarkort — *Rörelseapparaten*, *Nervsystemet*,
*Hjärta & kärl*, *Inre organ*. Dessa **blir** N2-ämneshubbar. Kontinuitet mot det Google redan
sett. Två nya tillkommer: *Klinisk anatomi* och *Plugga & tenta*.

De tre befintliga faktatexterna behåller sina URL:er men får ny brödsmula:
- `sa-styrs-en-rorelse.html`, `sa-leds-kanseln.html` → under *Nervsystemet*
- `lakemedelsberakning.html` → under *Plugga & tenta* (eller egen; se §12, öppen fråga)

### 1.5 Språk- och terminologiartiklar hör INTE hit

Artiklar om prefix, suffix, ordfamiljer, latin, eponymer och ordbildning hänger under den
**befintliga terminologipelaren** (`medicinsk-terminologi.html`), inte under Faktatexter.
Att bygga en parallell språkavdelning under artiklar vore innehållsdubblering mot en pelare
som redan rankar. De skrivs som `artiklar/<slug>.html` (samma namnrymd, §1.3) men
brödsmulas och länkas under terminologipelaren.

### 1.6 Registret är sanningen

`data/artiklar.json` är **enda källan** för artikelmetadata. Ur den genereras:
ämneshubbarnas kort · `artiklar/index.html` · `llms.txt`-sektionen · `sitemap.xml`-poster ·
"Relaterat"-block · framtida sökindex.

Handunderhållna kortlistor på flera ställen driver *alltid* isär. Samma mönster som
`generate_glossary.py` och `data/bilder.json` redan använder. Generator: `scripts/generate_artiklar.py`.

**Fältschema:**

```json
{
  "slug": "anatomiska-riktningar",
  "titel": "Anatomiska riktningar, plan och rörelser",
  "h1": "Anatomiska riktningar, plan och rörelser",
  "beskrivning": "…",              // = meta description, 127–150 tecken
  "poang": "…",                    // artikelns tes i EN mening; unik, se §0.3
  "typ": "oversikt",               // §2
  "hubb": "rorelseapparaten",      // N2-tillhörighet (får ändras fritt)
  "malgrupp": ["alla"],            // §3
  "taggar": ["riktningar", "planer", "rörelseterminologi"],
  "publicerad": "2026-08-01",
  "uppdaterad": "2026-08-01",
  "granskad": "2026-08-01",        // faktagranskningsdatum, visas på sidan
  "beroenden": [],                 // slugs denna artikel förutsätter
  "quiz": ["riktningar"],          // topic-nycklar för CTA
  "tabeller": ["/kunskapsbank/leder.html"],
  "ordlista_nav": true             // artikeln fungerar som nav in i ordlistan
}
```

---

## 2. Artikeltyper och längd

Fem typer, **stängd lista**. Ny typ kräver att den skrivs in här först.

| Typ | Vad | Prosaomfång | Kännetecken |
|---|---|---|---|
| `oversikt` | Fundament som andra artiklar lutar sig mot | 1 800–2 800 ord | Definierar begrepp, brett anslag, tung intern länkning |
| `fordjupning` | Ett smalt ämne på djupet | 1 400–2 200 ord | Förutsätter en `oversikt`, går längre än läroböcker orkar |
| `jamforelse` | X kontra Y, uttömmande | 1 400–2 200 ord | **Alltid flera begreppspar per artikel** — se §8.2 |
| `navsida` | Ingång till ordlistan/tabellerna | 900–1 600 ord | Rejäl brödtext *plus* strukturerad länktabell |
| `guide` | Process, studieteknik, examination | 1 600–2 600 ord | Praktisk, stegvis, tydligt daterad |

**Ord = prosa i brödtext.** Referenslista, tabellceller, navigation och tooltips räknas inte.

**Längd får aldrig komma av utfyllnad.** Når en artikel inte undre gränsen betyder det att
ämnet är för smalt för en egen sida — slå ihop den med ett angränsande ämne, eller gör den
till en ordlistepost. Utspädning är ett Bing-formaliabrott (§8), inte en genväg till längd.

---

## 3. Målgrupper

`malgrupp` styr ton, referensdjup, exempelval och quiz-CTA. Flera får kombineras.

| Nyckel | Läsare | Ton och referenser |
|---|---|---|
| `alla` | Nyfiken allmänhet + tidiga studenter | Förklara varje fackterm vid första förekomst. Läroböcker räcker. |
| `sjukskoterska` | SSK-student | Klinisk vinkling, omvårdnadsnära exempel. Läroböcker + myndighet. |
| `lakare` | Läkarstudent | Får förutsätta grundterminologi. Standardverk (Moore, Boron & Boulpaep) + peer review. |
| `fysioterapeut` | Fysio/naprapat | Rörelseapparat, biomekanik, funktionell anatomi. |
| `arbetsterapeut` | AT-student | Aktivitet, handfunktion, ADL-relevans. |
| `sprakvetare` | Språkintresserad, medicinsk sekreterare | Etymologi, morfologi, historik. Filologiska källor tillåtna och önskvärda. |
| `specialist` | Audionom, optiker, logoped, tandläkare, BMA | Smalt fackspråk tillåtet; låg konkurrens, hög precision. |

**Regel: `alla` står ensamt.** Nyckeln anger förkunskapsnivå, inte intresse, och kan därför
aldrig kombineras med en annan målgrupp — antingen förutsätter texten förkunskaper eller så
gör den inte det. En artikel som säger sig vara för `alla` men i praktiken är skriven för
`lakare` är skriven för `lakare`.

Två **utbildningsnycklar** får däremot kombineras när ämnet genuint delas av dem
(`lakare` + `fysioterapeut` för dermatom och myotom), eftersom de ligger på samma
förkunskapsnivå. Bestäm målgrupp *före* första meningen och håll den genom hela texten.

Kravet kontrolleras av `scripts/generate_artiklar.py`, som vägrar skriva vid brott. Kör
validatorn mot varje ny målgruppskombination du skriver in här — se §14.

---

## 4. Ämneshubbarna (N2)

| Hubb | Innehåll | Status |
|---|---|---|
| `rorelseapparaten` | Riktningar, plan, ledtyper, ledrörelser, ursprung/fäste/funktion, fascia, loger | Platshållare finns |
| `nervsystemet` | Banor, dermatom, myotom, innervationsprinciper, kranialnervsfördjupning | Platshållare + 2 live-artiklar |
| `hjarta-karl` | Cirkulation, retledning, kärlträd | Platshållare |
| `inre-organ` | Andning, matsmältning, urinvägar, endokrint | Platshållare |
| `klinisk-anatomi` | Anatomin bakom vanliga tillstånd — rotatorkuff, karpaltunnel, ischias, plantarfascia | NY |
| `plugga-och-tenta` | Studieteknik, minnesregler, hur man lär sig muskler/innervation, vanliga misstag | NY |

**`klinisk-anatomi` — hård avgränsning.** Dessa artiklar beskriver **anatomi och
patofysiologisk mekanism**. De ger inte diagnostiska kriterier, behandlingsråd,
egenvårdsinstruktioner, prognos eller "när du ska söka vård". Anatomiquiz är en pluggresurs,
inte en vårdgivare. Varje artikel i hubben bär en synlig rad: *"Den här texten beskriver
anatomi i utbildningssyfte och är inte medicinsk rådgivning."* Vid minsta tveksamhet om en
formulering glider mot råd — ta bort den.

---

## 5. Redaktionella regler

### 5.1 Struktur

- **Ingress** (2–4 meningar): vad texten handlar om och varför det är värt att förstå. Ingen
  innehållsförteckning i prosaform, ingen "I den här artikeln kommer vi att…".
- **`<h2>`-avsnitt** som följer en genomtänkt tankegång, inte en godtycklig uppräkning.
  Rubriker ska vara beskrivande och sökordsbärande utan att vara stolpiga.
- **Avslutning** som knyter ihop poängen — inte en sammanfattning som upprepar texten.
- **CTA-block** sist före referenserna: länk till relevant quiz, tabell och ordlisteavsnitt.
- **Referenser** enligt `SEO_REGLER.md` §6b.
- **Granskningsdatum** synligt: *"Faktagranskad 2026-08-01."*

### 5.2 Ton och form — det här är den viktigaste paragrafen

Texten ska läsas som skriven av en kunnig människa som bryr sig om ämnet.

**Skriv:**
- Sammanhängande stycken om 4–8 meningar som bygger ett resonemang.
- Varierad meningslängd. Underordnade satser. Ett resonemang som *går någonstans*.
- Konkreta exempel som förankrar det abstrakta.
- Aktiv, tydlig svenska enligt `CLAUDE_REGLER.md` §1.5.

**Skriv inte:**
- Tvåradsstycken staplade på varandra. Punktlistor som ersätter resonemang.
- Fetstil som betoningskrycka i var tredje mening.
- Uppradade "Det är viktigt att notera att…", "Sammanfattningsvis…", "I dagens…".
- Trippelkonstruktioner ("snabbt, säkert och effektivt") och ihåliga superlativ.
- Retoriska frågor som rubriker, om det inte är en faktisk FAQ-sektion.
- Emojier. Utropstecken.

**Punktlistor tillåts** för genuina uppräkningar (ledtyper, nervrötter, steg i en kedja) —
aldrig för att bryta upp ett resonemang som borde vara prosa. Tumregel: kan punkterna läsas
som en mening är de en mening. Se även [[feedback_mobile_friendly_lists]]: långa texter blir
prosa, inte bullets.

### 5.3 Terminologi

Följer `CLAUDE_REGLER.md` §1 fullt ut: Terminologia Anatomica för latin, svenska benämningar
enligt kursstandard, inga anglicismer. Vid första förekomst av en fackterm i en `alla`-artikel:
förklara den i texten *utöver* tooltipen — tooltipen är en bonus, inte en förutsättning för
att texten ska gå att läsa.

---

## 6. Källor, verifiering och referenser

### 6.1 Fyra påståendeklasser

Varje faktapåstående tillhör en klass, och klassen avgör vad som krävs.

| Klass | Exempel | Krav |
|---|---|---|
| **A. Etablerad läroboksfakta** | *N. medianus innerverar tenarmuskulaturen* | Standardverk i referenslistan. Ingen text-länk. |
| **B. Nyare, omdiskuterat eller precist siffersatt** | *prevalens, nyare klassifikation, ändrad nomenklatur* | Peer review-artikel. **Verifiera att artikeln finns och faktiskt säger detta.** Korrekt DOI. |
| **C. Regulatoriskt/formellt** | *behörighetskrav, provformat, myndighetsbeslut* | Myndighetskälla + **hämtningsdatum** + `granskad`-datum på sidan. |
| **D. Praxis, åsikt eller studentfolklore** | *"de flesta studenter tycker…", minnesramsor, tentarykten* | Markeras **explicit i texten** som just det, och länkas till den faktiska diskussionen/källan. Presenteras aldrig som fakta. |

### 6.2 Absoluta förbud

- **Hitta aldrig på en referens.** Ingen påhittad titel, författare, årtal, upplaga, DOI eller
  sidnummer. Gäller även när posten "ser rimlig ut". (`CLAUDE_REGLER.md` §3.2d.)
- **Citera aldrig en artikel du inte kontrollerat innehållet i.** Att en titel matchar
  påståendet är inte verifiering.
- **Gissa aldrig bibliografiska data.** Slå upp dem, eller hämta från ett redan granskat
  `kb-sources`-block i repot.
- **Kan ett påstående inte beläggas — stryk påståendet.** Aldrig hedge, aldrig gissa.
  (Samma princip som [[feedback_delete_unverifiable_questions]].)

### 6.3 Formalia

- APA 7, alfabetisk ordning, titlar i `<em>`, `.kb-sources`-block — `SEO_REGLER.md` §6b.
- Svensk kollation: å/ä/ö sist.
- **Varje ny källa förs in i `info.html`:s källista samma arbetspass** — `CLAUDE_REGLER.md`
  §3.2d. Inte "senare".
- Externa länkar i text: `rel="noopener"`. Peka på primärkällan, aldrig på en aggregator.

### 6.4 Vad som duger som källa

Prioritetsordning: standardverk och läroböcker → peer review → myndighet (Socialstyrelsen,
Läkemedelsverket, FIPAT) → etablerade fackorgan (Läkartidningen, Läkarförbundet, Vårdförbundet).

**Duger inte som faktagrund:** wikis, kursanteckningar, Studocu, Quizlet, AI-genererat
innehåll, kommersiella pluggsajter. Studentforum får citeras **endast** som klass D — som
belägg för att en uppfattning finns, aldrig för att uppfattningen stämmer.

---

## 7. Intern länkning

Länkning är strategin, inte dekorationen. Varje artikel ska ha:

1. **Ordlistetooltips** enligt `SEO_REGLER.md` §6c — medicinskt/latinskt innehåll är kriteriet,
   inte fetstil. Kör `scripts/wire_terms.py`. 0 trasiga ankare.
2. **Minst två länkar till andra artiklar** — helst en uppåt (den `oversikt` artikeln bygger på)
   och en i sidled. Isolerade artiklar är förbjudna.
3. **Minst en länk till en tabell eller ett case** där ämnet katalogiseras.
4. **En quiz-CTA** mot rätt `topic`, med rätt utbildning för målgruppen.
5. **Brödsmula** hela vägen: Anatomiquiz / Kunskapsbank / [ämneshubb] / artikeln.

Länkankare skrivs beskrivande ("tabellen över kranialnerverna"), aldrig "läs mer" eller "här".

**Navsidor** (`typ: navsida`) har en extra uppgift: de länkar systematiskt till många
ordlisteposter. En sida om medicinska förled ska peka in i ordlistan för varje behandlat
förled. Det är där sajtens befintliga försprång ligger.

---

## 8. SEO, GEO och Bings formaliakrav

Utöver `SEO_REGLER.md` (som gäller oavkortat) styr följande *innehållets* form.

### 8.1 Unikhet

Varje artikel ska ha en egen `poang` i registret. **Två artiklar får inte dela poäng.**
Innan en ny artikel skrivs: läs poängerna i registret. Överlappar den — slå ihop istället.

### 8.2 Doorway- och tunnhetsrisken — kodifierad varning

Råmaterialet till den här planen föreslog serier av typen *"Vad betyder -it?"*, *"Vad betyder
-os?"*, *"Vad betyder -emi?"* som separata sidor, och *"Vad betyder proximal och distal?"*,
*"Vad betyder medial och lateral?"*, *"Vad betyder ventral och dorsal?"* likaså.

**Sådana serier byggs inte.** Tio nästan identiska sidor som skiljer sig på ett morfem är
precis vad Bings riktlinjer beskriver som doorway pages och tunt, upprepat innehåll — och de
kannibaliserar dessutom varandras rankning. Risken för hela domänen är större än den möjliga
vinsten.

**Istället:**
- Suffixserien → **en** artikel *Kliniska efterled* som behandlar alla i sammanhang, med
  länktabell in i ordlistan per efterled.
- Riktningsserien → **en** artikel *Anatomiska riktningar, plan och rörelser*, som täcker
  samtliga axelpar och därtill planen.
- Enskilda efterled/riktningar som *söks* var för sig fångas ändå — via `<h2>`-ankare i den
  samlade artikeln och via ordlisteposterna, som redan rankar separat.

**Testet:** kan två planerade artiklars innehållsförteckning bytas ut mot varandra utan att
någon märker det — är de en artikel.

### 8.3 Sökordsarbete

Nyckelfrasen ska förekomma naturligt i `<title>`, `<h1>`, ingressen och minst en `<h2>`.
Semantiskt närliggande fraser vävs in i löptexten. **Keyword stuffing är ett formaliabrott** —
`SEO_REGLER.md` §2 och §3 sätter hårda gränser för titel och description.

### 8.4 GEO / agentisk inläsning

Det som gör en text citerbar för en språkmodell är samma sak som gör den bra för människor:
en tydlig tes tidigt, självbärande avsnitt, korrekta definitioner nära termen, och belägg som
går att följa. Konkret:

- Besvara sidans huvudfråga **inom de första 100 orden**.
- Håll varje `<h2>`-avsnitt självbärande — det ska gå att förstå utryckt ur sitt sammanhang.
- `Article` + `LearningResource` i JSON-LD, `FAQPage` **endast** när en synlig FAQ finns
  (`SEO_REGLER.md` §6).
- Sidan in i `llms.txt` med en beskrivning som faktiskt säger vad den innehåller.
- Inga särskilda "AI-filer" utöver `llms.txt` — `SEO_REGLER.md` §9.

---

## 9. Teknisk mall och kedjan

Ny artikel = **ny indexerbar sida**. `SEO_REGLER.md` §11.A **och** §11.B gäller i sin helhet:
VERSION · cachebuster · `APP_VERSION` · CHANGELOG · sitemap · llms.txt · korslänkar · komplett `<head>`.

Utöver det, artikelspecifikt:

- `og:type` = `article` för artiklar, `website` för ämneshubbar.
- JSON-LD: `["Article","LearningResource"]`; ämneshubbar `["CollectionPage","LearningResource"]`
  med `hasPart`. `BreadcrumbList` **alltid i eget script-block** (§6 i SEO_REGLER).
- `datePublished` / `dateModified` från registret.
- **0 JS på artikelsidor.** Filtrering på `artiklar/index.html` är enda undantaget.
- Bilder: `BILDER_REGLER.md`, dimensioner satta (CLS 0), `loading="lazy"` under fold.
- Efter skrivning: av-wira och om-wira tooltips (`SEO_REGLER.md` §6c), kör verifieringssnuttarna i §12.

Versionsbump: **inget antalskrav.** Regeln om att samla ihop ungefär fem uppgifter före en
bump ([[feedback_batch_versions]]) kom ur quizbygget, där en utbildning kunde ge fem nästan
identiska delleveranser i rad, och gäller **inte** artiklar. En färdig artikel får bumpas för
sig, och flera får lika gärna dela en release — det avgörs av när användaren vill släppa, inte
av en siffra. Rapportera alltid i versioner, aldrig i hashar ([[feedback_communicate_in_versions]]).

---

## 10. Sökfunktion (byggs när artikelantalet motiverar det)

Tröskel: **~25 artiklar**. Innan dess räcker ämneshubbar plus `artiklar/index.html`.

Design, förberedd redan nu genom registret:

- `scripts/generate_artiklar.py` skriver `data/artiklar_index.json` — slug, titel, poäng,
  taggar, målgrupp, hubb, `<h2>`-rubriker.
- Klientsidig sökning i `artiklar/index.html`, ren JS, ingen extern resurs (CSP `'self'`).
- Progressiv förbättring: hela artikellistan renderas i HTML och är fullt navigerbar utan JS.
  Sökfältet filtrerar bara det som redan finns i DOM. Crawlers och agenter ser allt.
- **Slås inte ihop med ordlistesökningen.** Olika innehållstyper, olika förväntningar.

---

## 11. Byggordning

Beroendedriven — en artikel byggs aldrig före den den lutar sig mot. `beroenden` i registret
är bindande. Numreringen är fast: en struken punkt tas aldrig bort och ingenting numreras om,
eftersom beroendepilarna (`← 6, 8`) pekar på nummer.

> **Planen åldras.** Listan skrevs 2026-07-20 mot sajten som den såg ut då. Sedan dess har
> terminologipelarens fem sidor byggts om från 676–1 763 ord till 1 874–2 349, och två
> planerade artiklar blev därmed dubbletter av innehåll vi själva just skrivit. **Kör §8.2:s
> test mot det som faktiskt ligger live innan en punkt påbörjas** — kan artikelns
> innehållsförteckning bytas mot avsnitt på en befintlig sida är den redan skriven. Se §14.

### Våg 0 — Infrastruktur ✅ KLAR (0.9.186)
1. `data/artiklar.json` + `scripts/generate_artiklar.py`
2. `artiklar/index.html` (Alla artiklar)
3. Sex N2-ämneshubbar; `faktatexter.html` byggs om till ingång
4. Brödsmulor och hubbtillhörighet för de tre befintliga faktatexterna
5. Kedjan: sitemap, llms.txt, kunskapsbankens hub

### Våg 1 — Fundamenten ✅ KLAR
6. ✅ **Anatomiska riktningar, plan och rörelser** — `oversikt`, `alla`, hubb
   `rorelseapparaten`. Skriven 2026-07-21. Ersatte hela den föreslagna riktningsserien (§8.2)
   och skapade ämneshubben *Rörelseapparaten*.
7. ⛔ **Medicinsk ordbildning: förled, rot och efterled** — **STRUKEN 2026-07-21**, se §13.
   Ordbildningen behandlas sedan 0.9.190–0.9.191 i löptext på `medicinskt-latin` och
   `grekiska-i-medicinen`, och ingången till ordlistan finns redan i `ordlista-prefix.html`
   (659 poster) och `ordlista-suffix.html` (153 poster).

### Våg 2 — Bygger på våg 1
8. **Ledtyper och ledrörelser** — `oversikt`, `alla`, hubb `rorelseapparaten`. ← 6
   Kontrollerat 2026-07-21: ledtyperna finns bara som tabellceller i regionsidorna och som
   quizfrågor i `data/ledtyper.json`; `leder.html` är en ROM-tabellhubb på 200 ord. Ingen
   löptext täcker ämnet. **Nästa artikel att bygga.**
9. ✅ **Så läser du en muskeltabell** — `guide`, `alla`, hubb `rorelseapparaten`. ← 6, 8
   Skriven 2026-07-22. Kontrollerat mot live-sajten samma dag: `muskeltabeller.html` var 16
   kort plus en enda mening om vad kolumnerna betyder, regionsidorna rena tabeller. Artikeln
   länkas nu även från `muskeltabeller.html`.
10. ⚠️ **Medicinska ordfamiljer** — `navsida`, `sprakvetare`. Beroendet på 7 är borta.
    **Prövas mot §8.2 mot `medicinskt-latin` och `grekiska-i-medicinen` innan den planeras in**
    — bara den axel som är genuint ny (samma rot genom många kliniska termer) motiverar sidan.
11. ⛔ **Kliniska efterled** — **STRUKEN 2026-07-21**, se §13. `grekiska-i-medicinen` bär redan
    efterledstabellen, skillnaden mellan -it och -os, -emi och -uri som fynd samt den
    kirurgiska serien -tomi, -ektomi, -stomi, -plastik och -des.

### Våg 3 — Fördjupning
12. **Fascia, bursor, senskidor och muskelloger** — `fordjupning`, `fysioterapeut`. ← 8, 9
    Kontrollerat 2026-07-21: förekommer bara som enstaka omnämnanden i muskeltabellerna.
13. **Dermatom, myotom och sklerotom** — `fordjupning`, `lakare` + `fysioterapeut`.
    ← `sa-leds-kanseln` (finns). Kontrollerat 2026-07-21: `nervtabell-balen.html` har en
    dermatomtabell för bålen; myotom och sklerotom saknas helt, liksom all löptext.
14. **Minnesregler för kranialnerverna** — `guide`, `alla`. ← kranialnervstabellen (finns).
    Kontrollerat 2026-07-21: `kranialnerverna.html` (244 ord) har inga minnesregler.
    Minnesramsor är klass D (§6.1) och ska märkas som praxis, aldrig presenteras som fakta.

### Våg 4 — Klinisk anatomi (efter §4:s avgränsning)
15. Rotatorkuffen · 16. Karpaltunneln · 17. Ischiasnerven — samtliga `fordjupning`. ← 9, 12
    Kontrollerat 2026-07-21: strukturerna finns i muskel- och nervtabellerna, ingen löptext.

### Våg 5 — Plugga & tenta
18. **Hur du lär dig musklerna** · 19. **Vanliga anatomiska missuppfattningar** — `guide`. ← 9

Vågordningen är bindande; enskild artikel inom en våg får omprioriteras.

---

## 12. Avgjorda frågor (2026-07-20)

1. **Referenser i löptext — GODKÄND.** Påståendeklassningen i §6.1 gäller: klass A bärs av
   referenslistan, klass B, C och D länkas i texten. Undantaget är inskrivet i
   `SEO_REGLER.md` §6b, som annars förbjuder referenser i löptext.
2. **`lakemedelsberakning.html` → `plugga-och-tenta`.** Ämnesområdet omfattar därmed
   "studieteknik, minnesregler och de färdigheter du tenteras på". Läkemedelsberäkning är en
   färdighet studenter examineras på, inte ett anatomiskt ämne — den passar där utan att
   tänjas in. Får en egen hubb om klinisk räkning växer till flera artiklar.
3. **Terminologipelaren hålls platt tills vidare.** Underhubbar införs först vid **fler än
   tolv** språkartiklar. Tröskeln finns för att slippa bygga om en fungerande pelare i förtid.

### Byggbeslut fattade under våg 0

- **Tomma ämneshubbar får ingen egen sida.** Fyra av sex hubbar saknar artiklar och renderas
  som "Snart"-kort på ingången. Fem nästan innehållslösa hubbsidor vore precis den tunnhet
  §8.2 varnar för, och de skulle behöva `noindex`. Generatorn skapar hubbsidan automatiskt när
  den första artikeln registreras.
- **Artikelindexet använder kortrutnätet, inte en tabell.** `.kb-mtable` kräver
  kolumnbreddsklasser per tabelltyp, alltså ny CSS och en cachebusterbump på ~100 sidor
  (`SEO_REGLER.md` §11.C). Kortrutnätet är redan responsivt och statusbrickan bär artikeltypen.
  Tabell eller filter övervägs på nytt när sökfunktionen byggs (§10).

---

## 13. Bortvalt ur råmaterialet — och varför

Dokumenteras så att förslagen inte återuppstår vid nästa idégenomgång.

| Förslag | Beslut | Skäl |
|---|---|---|
| *"Medicinsk terminologi inför läkarnas nya nationella kunskapsprov"* | **Byggs inte nu** | Kontrollerat 2026-07-20: det "nya nationella kunskapsprovet" är ett **policyförslag från Sveriges läkarförbund** (nov 2025), inte ett beslutat och infört prov. Råmaterialet påstod det som genomfört faktum. Att bygga en artikel på det vore ett faktafel i ett högriskämne. Kan omprövas **om** Socialstyrelsen fattar beslut — då som klass C med hämtningsdatum. |
| *"Anatomi och fysiologi inför kunskapsprovet för sjuksköterskor"* | **Byggs inte i föreslagen form** | Kontrollerat 2026-07-20: provet (Göteborgs universitet på Socialstyrelsens uppdrag) består av **MEQ-tentamen i klinisk resonemangsförmåga + OSCE**, inte flervalsfrågor i anatomi. Att lova pluggstöd med Anatomiquiz MC-quiz mot det provet vore missvisande mot en målgrupp med legitimationen på spel. |
| **Artikel 7:** *"Medicinsk ordbildning: förled, rot och efterled"* (navsida) | **Struken 2026-07-21** | Planerad 2026-07-20, när `medicinskt-latin` var 756 ord och `grekiska-i-medicinen` 676. Ombyggnaden i 0.9.190–0.9.191 la in exakt det innehållet — *Hur ett medicinskt ord är byggt*, bindevokalen, rötterna, förleden, efterleden — som löptext på båda sidorna. Innehållsförteckningen går att byta rakt av mot deras avsnitt, alltså samma artikel enligt §8.2:s test. Ingången till ordlistan finns dessutom redan förrenderad i `ordlista-prefix.html` (659 poster) och `ordlista-suffix.html` (153), som en navsida hade konkurrerat med om samma sökningar. |
| **Artikel 11:** *"Kliniska efterled"* (navsida) | **Struken 2026-07-21** | Samma skäl. `grekiska-i-medicinen` bär sedan 0.9.191 tabellen över kliniska efterled, skillnaden mellan -it och -os, -emi och -uri som fynd snarare än diagnoser, -pati som medvetet vagt efterled och hela den kirurgiska serien. Sidan lutade sig dessutom på artikel 7. |
| Serie: *"Vad betyder -it/-os/-emi/-uri…"* (10 sidor) | **Konsolideras** | Doorway-/tunnhetsrisk, §8.2. → numera `grekiska-i-medicinen`, inte artikel 11 (struken). |
| Serie: *"Vad betyder proximal och distal / medial och lateral / …"* | **Konsolideras** | Samma skäl. → artikel 6. |
| *"Gamla tentor"-hubb*, *spärrtentor*, *"tentafrågor som brukar komma"* | **Byggs inte** | Bygger på studentforum och läckta tentor — klass D-material presenterat som fakta. Upphovsrättsligt och trovärdighetsmässigt olämpligt. Studieteknik utan tentapåståenden är däremot fine (våg 5). |
| *"Normalvärden och referensvärden"*, *"Vanliga medicinska förkortningar A–Ö"* | **Inte artiklar** | Detta är uppslagsdata. Hör hemma i *Listor & tabeller* respektive ordlistan — som redan bär labbvärden och förkortningar. Egna artiklar vore dubblering. |
| *"Skillnaden mellan AT, BT, ST"* | **Skjuts upp** | Regulatoriskt innehåll i förändring (klass C), kräver underhållsrutin. Tas när §12.1 är avgjord och en dateringsrutin finns. |

---

## 14. Lärdomar (fylls på löpande)

**STÅENDE REGEL**, samma princip som `CLAUDE_REGLER.md` §5.6: upptäcks en *ny sorts* fel eller
en icke-uppenbar insikt om artikelbygge — skriv in den här **samma arbetspass**, med konkret
exempel. Minnet är kopian; det här dokumentet är originalet.

- **2026-07-20** — **Styrdokument och validator som skrivs i samma pass kan motsäga varandra
  från dag ett.** §11 föreskrev `alla` + `sprakvetare` för artikel 7, 8 och 10, medan
  `generate_artiklar.py` samtidigt förbjöd `alla` i kombination med något annat. Ingen av
  raderna var beställd; båda kom ur samma bygge (0.9.186) och motsägelsen upptäcktes först när
  nästa artikel skulle registreras. **Kör validatorn mot dokumentets egna exempel innan bygget
  anses klart** — ett styrdokument vars exempel inte passerar sin egen grind är inte färdigt.
  Vid krock: rätta dokumentet efter validatorn, inte tvärtom. Frestelsen är att luckra upp
  kontrollen för att rädda texten man just skrivit.
- **2026-07-21** — **En sida om språkets regler drar till sig fel som andra sidor inte kan få.**
  Deklinationssidan citerar med flit former som är fel (*sini*, *meati*, *sinusar*), och
  tooltip-wiringen gjorde dem till uppslagsord som sedan lästes in i facit. Samma sida hade
  dessutom grammatikorden *genus* och *kasus* länkade till ordlistans *genu* (knä) respektive
  *kasus* (sjukdomsfall) – rätt uppslagsord, fel betydelse i just den texten. Båda feltyperna
  är nu inskrivna i `SEO_REGLER.md` §6c. **Läs igenom tooltipsen i en språkartikel för hand
  efter wiringen**; kriteriet ”termen finns i ordlistan” räcker inte när sidan handlar om orden
  själva i stället för om strukturerna de betecknar.
- **2026-07-21** — **Revidering av en gammal sida är också en FAQ-revidering.** Den synliga
  FAQ:n och `FAQPage`-blocket på deklinationssidan hade glidit isär i tysthet: sex frågor i
  märkningen, sju på sidan, och bara fem gemensamma. Ingen validator på sajten fångade det
  förrän jämförelsen skrevs in i verifieringssnutten (`SEO_REGLER.md` §12). Kör den mot varje
  sida som har FAQ, även när arbetspasset inte rör själva frågorna.
- **2026-07-21** — **En innehållsplan blir osann av att man bygger enligt den.** Två av §11:s
  punkter (7 och 11) blev dubbletter medan de stod i kö, därför att ombyggnaden av
  terminologipelaren i 0.9.190–0.9.191 skrev in just det innehåll de skulle bära. Ingen märkte
  det förrän artikel 7 skulle placeras — planen hade lästs som en beställning i stället för som
  en hypotes om vad som saknas. **Kör §8.2:s test mot live-sajten när en punkt tas upp, inte
  när den skrevs in**, och stryk den i §11 plus §13 samma arbetspass om den fallit. Skäl:
  numreringen är fast och beroendepilarna pekar på nummer, så en tyst borttagning skulle bryta
  dem. Kostnaden för att upptäcka det sent är en skriven artikel som kannibaliserar en egen
  sida som redan rankar.
- **2026-07-21** — **En artikel som definierar vokabulär drar tooltipsen mot fel betydelse.**
  På *Anatomiska riktningar, plan och rörelser* wirades `snitt` (tomografiskt) till incision,
  `ulnardeviation` (handledens normala rörelse) till ordlistans felställning vid reumatoid
  artrit, och två engelska boktitlar i referenslistan fick medicinska tooltips på orden *basis*
  och *neural*. Ingen av träffarna var ett fel i facit i sig – de var rätt uppslagsord i fel
  sammanhang. **Läs igenom hela tooltip-listan för hand efter wiringen, inklusive
  referensblocket**, och fråga för varje träff om definitionen beskriver den betydelse texten
  faktiskt använder. Feltyperna är inskrivna i `SEO_REGLER.md` §6c.
- **2026-07-22** — **Tooltip-facit är blint för termer som ingen sida ännu använt.**
  `data/kb_glossary_terms.json` byggs ur redan wirade sidor, så ett uppslagsord som aldrig
  förekommit i kunskapsbanken hamnar aldrig i facit — hur centralt det än är. På *Så läser du
  en muskeltabell* gällde det `agonist`, `antagonist`, `synergist` och `excentrisk`: alla fyra
  fanns i `data/ordlista.json`, ingen fanns i facit, och `wire_terms.py` gick förbi dem tyst
  eftersom skriptet bara matchar exakta facitnycklar. Blindfläcken är självförstärkande: ett ord
  som aldrig wirats kan aldrig komma in i facit av sig självt. **Grep `data/ordlista.json` efter
  artikelns kärnbegrepp innan wiringen anses klar** — inte bara efter latinet (`SEO_REGLER.md`
  §6c), utan efter de svenska och grekiska fackord artikeln bygger sitt resonemang på — och lägg
  in de saknade som facitnycklar med böjningsalias. Lägg dem **sist i filen**; en omsortering av
  `kb_glossary_terms.json` skriver om hela filen och dränker ändringen i 3 000 raders diff.
- **2026-07-20** — AI-genererade innehållsförslag kan presentera *policyförslag* och
  *provformat* som genomförd verklighet. Två av råmaterialets högst prioriterade förslag föll
  på faktakontroll (§13). **Kontrollera alltid ett förslags faktapremiss innan det planeras in**,
  inte först när artikeln ska skrivas.

---

**DETTA DOKUMENT ÄR BINDANDE FÖR ALLT ARTIKELARBETE PÅ ANATOMIQUIZ.**
