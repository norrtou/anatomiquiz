# Utbildningar & ämnesindelning — regeldokument

Underlag för hur utbildnings- och ämneslistan i Anatomiquiz ska byggas upp.
Detta är **källan vi utgår från** när vi bygger ut quizet per vårdutbildning.
Varje utbildning är indelad i ämnesområden anpassade efter hur anatomi/fysiologi
faktiskt undervisas i programmet.

Tekniskt sitter listan som två kopplade `<select>` i `index.html`
(`#education` + `#topic`), där varje ämne knyts till sin utbildning via
`data-edu`. Se minnesfilen `project_education_split.md` för historik.

---

## Grundregler (gäller hela ombyggnaden)

1. **Utbildningar som ska finnas** = de 12 nedan. Övriga tomma utbildningar i
   dropdownen raderas (barnmorska, biomedicinare, dietist, medicintekniker,
   receptarie, tandhygienist).
2. **Allmänt rörs INTE.** Kategorin "Allmänt" (med ämnet Farmakologi) är helt
   separat från detta och lämnas precis som den är.
3. **Arbetsterapeut rörs INTE här.** Arbetsterapeutens ämnesindelning är
   annorlunda än underlaget i detta dokument och hanteras separat vid ett annat
   tillfälle. Lägg inte till eller ta bort något på arbetsterapeut utifrån detta
   dokument. (Arbetsterapeut-avsnittet längst ner är endast referens för det
   framtida, separata arbetet — det är INTE en byggorder.)
4. **Befintliga ämnen behålls.** Utbildningar som redan har riktiga ämnen (SSK,
   läkare) får behålla dem; vi kompletterar med tomma platshållare för resten.
5. **"Anatomi & fysiologi" döps om.** De utbildningar som redan har ett ämne som
   heter "Anatomi & fysiologi" (sjuksköterska och läkare) får det omdöpt till
   **"Blandad anatomi/fysiologi"** (format­taggen `(MC)`/`(FC)` behålls).
6. **Tomma platshållare** = ämnesrader utan riktigt frågeunderlag ännu. De får
   aldrig kunna laddas som vanliga ämnen (skulle annars falla tillbaka på
   `riktningar.json`). Mekaniken för hur de visas/spärras beslutas separat.

---

## Slumpade frågor per utbildning (återanvändbart mönster)

Varje utbildning kan få ett **"Slumpade frågor"-val** som dynamiskt drar ett
slumpurval ur ALLA utbildningens ämnen (inte en egen frågelista). Det byggdes
först för arbetsterapeut (`blandade`) och sjuksköterska (`blandade_sjukskoterska`,
0.9.156). **Återanvänd detta – bygg aldrig en ny lösning.**

Finns idag för: arbetsterapeut, sjuksköterska, fysioterapeut, biomedicinsk
analytiker, röntgensjuksköterska, medicinsk sekreterare, logoped, tandläkare,
läkare (tillagt i 0.9.159; utbildningen är färdigbyggd sedan 0.9.161),
apotekare (tillagt i 0.9.162, utbildningen färdigbyggd samtidigt), audionom (tillagt
när utbildningen byggdes, 5 ämnen). Saknas medvetet för Allmänt (bara FC-ämnen → tom pool). Lägg till valet
så snart utbildningen har minst två MC/TF-ämnen.

**Så lägger du till det för en ny utbildning – enda steget som behövs:**
lägg en `<option>` i `#topic` i `index.html`:
```html
<option value="blandade_<utbildning>" data-edu="<utbildning>">Slumpade frågor (MC)</option>
```
Inga `app.js`-ändringar behövs – mekaniken är redan generisk (se nedan).

**Regler & varför:**
1. **Eget `value` per utbildning (`blandade_<utbildning>`), ALDRIG återanvänd bara
   `blandade`.** Samma värde skulle ge delad topplista mellan utbildningarna och
   fel utbildningsförkortning (`eduAbbrevFor()` tar första träffen i
   `allTopicOptions`). Eget värde → egen topplista + rätt förkortning.
2. **`data-edu` måste matcha utbildningen.** `updateTopicOptions()` visar bara den
   valda utbildningens ämnen, och slump-valet samlar frågefiler från just de
   synliga ämnena → automatiskt rätt pool, och den **växer när nya ämnen läggs
   till** utan underhåll.
3. **Bara MC/TF kommer med – rena flashcard-ämnen (FC) exkluderas** (path-samlingen
   filtrerar på typtaggen i etiketten). Sätt etiketten efter poolen: `(MC)` om alla
   ämnen är MC, annars t.ex. `(MC+TF+Bild)`.
4. **Svårighetsgrad:** valet ger bara `Normal` om det inte står i
   `topicsWithHardQuestions` i `app.js`. Lägg bara till det där om utbildningens
   ämnen faktiskt har `Hard`-frågor.
5. **Placering: överst i utbildningens ämnesgrupp.** `#topic` renderas i
   DOM-ordning (`updateTopicOptions()` bygger om listan i `allTopicOptions`-
   ordning), så ordningen i `index.html` ÄR den användaren ser. Per utbildning
   gäller: `Slumpade frågor` först, sedan övriga ämnen i **bokstavsordning**
   (svensk kollation: å/ä/ö sist, skiljetecken ignoreras). Följd att känna till:
   slumpvalet blir utbildningens förvalda ämne när man byter utbildning
   (`topicEl.value = visible[0].value`). Håll ordningen när nya ämnen läggs till.

**Hur mekaniken funkar (redan generisk, rör inte i onödan):** i `app.js` triggar
`topic.startsWith('blandade')` `loadQuestionsFromMultiplePaths()`, som samlar
`getQuestionsPath()` för alla synliga `#topic`-options utom disabled och de vars
`value.startsWith('blandade')`. Alla `blandade*`-värden matchar därför utan att
någon lista behöver utökas.

---

## Utbildningar som ska finnas (12)

| Utbildning | `value` (data-edu) | Status idag |
|---|---|---|
| Apotekare | `apotekare` | KLAR – 5 byggda ämnen |
| Arbetsterapeut | `arbetsterapeut` | **rörs ej** (separat) |
| Audionom | `audionom` | KLAR – 5 byggda ämnen |
| Biomedicinsk analytiker | `biomedicinsk_analytiker` | tom → platshållare |
| Fysioterapeut | `fysioterapeut` | tom → platshållare |
| Logoped | `logoped` | tom → platshållare |
| Läkare | `lakare` | KLAR – 1 tidigare ämne + 18 byggda ämnen |
| Medicinsk sekreterare | `medicinsk_sekreterare` | tom → platshållare |
| Optiker | `optiker` | tom → platshållare |
| Röntgensjuksköterska | `rontgensjukskoterska` | tom → platshållare |
| Sjuksköterska | `sjukskoterska` | KLAR – 3 tidigare ämnen + 15 byggda ämnen |
| Tandläkare | `tandlakare` | tom → platshållare |

Plus **Allmänt** (`allmant`) som separat, orörd kategori.

### Utbildningar som raderas ur dropdownen
barnmorska, biomedicin (Biomedicinare), dietist, medicintekniker, receptarie,
tandhygienist.

---

## Ämnesindelningar per utbildning

### Fysioterapeut
Treårigt program (180 hp), 8 lärosäten. Regionsindelad rörelseapparat +
fysiologiska system.
*Linser: struktur → biomekanik/funktion → innervation → vanlig skada → åldersutveckling.*

Rörelseapparaten (regionalt)
1. Axel/skulderkomplex – glenohumeralled, skapulotorakal rytm, rotatorkuffen, plexus brachialis, impingement/instabilitet.
2. Armbåge & underarm – led/muskler, pronation/supination, n. ulnaris/radialis/medianus, epikondylit.
3. Hand & handled – anatomi, nervkompressioner (karpaltunnel), grepptyper, finmotorik, åldersutveckling.
4. Höft & bäcken – ledhuvud/acetabulum, glutealmuskulatur, SI-led, n. ischiadicus, höftartros, gånganalys.
5. Knä – menisker, korsband, kollateralligament, quadriceps/hamstrings, ACL-skada, biomekanik.
6. Fot & fotled – fotvalv, talocrural/subtalar led, vadmuskulatur, stukning, gångcykeln.
7. Columna/ryggrad – cervikal/torakal/lumbal, disk, djup vs ytlig muskulatur, dermatom/myotom, diskbråck.

Fysiologiska system
8. Nervsystemet – centralt vs perifert, motoriska/sensoriska banor, reflexbågar, övre vs nedre motorneuronlesion.
9. Muskelfysiologi – muskelkontraktion, fibertyper, aktin/myosin, energiomsättning, trötthet.
10. Kardiovaskulär & respiratorisk fysiologi – hjärtcykeln, blodtrycksreglering, gasutbyte, syreupptag.
11. Led- & skelettlära – ledtyper, benvävnad, brosk, ligament, biomekanik (moment, hävarm).
12. Smärtfysiologi – nociception, perifer vs central sensitisering, akut vs långvarig smärta.

Övergripande teman
13. Motorisk utveckling & åldrande – motoriska milstolpar och åldersrelaterade förändringar i muskel, skelett, balans.
14. Tränings-/arbetsfysiologi – kondition vs styrka, superkompensation, laktattröskel, träningsprinciper.

### Biomedicinsk analytiker
Treårigt program (180 hp). Två inriktningar: laboratoriemedicin och klinisk
fysiologi.
*Linser: anatomi/fysiologi → vad som mäts/analyseras → metod → referensvärden → patofysiologisk avvikelse.*

Gemensam grund (organsystem, år 1)
1. Cell & vävnad (morfologi) – celltyper, fyra vävnadsslag, morfologisk cellbiologi.
2. Blod & blodbildning – blodkroppar, benmärg/hematopoes, hemostas.
3. Hjärta & cirkulation – hjärtanatomi, retledningssystem, hjärtcykel, kärlträd.
4. Respiration & lungor – luftvägar, alveoler, gasutbyte, lungvolymer.
5. Nervsystem & muskler – CNS/PNS, perifera nerver, muskelfysiologi, aktionspotentialer.
6. Njurar & urinvägar – nefronet, filtration/clearance, urinproduktion.
7. Matsmältning, lever & ämnesomsättning – GI-organ, levermetabolism, energiomsättning.
8. Endokrina systemet – körtlar, hormonaxlar, feedbackreglering.
9. Immunsystem & lymfatiska organ – immunceller, lymfoid vävnad, inflammation.

Inriktning klinisk fysiologi
10. Hjärtats elektrofysiologi & EKG – retledning kopplad till EKG-kurvan, normalvärden, avvikelser.
11. Respirationsfysiologi & spirometri – ventilationsmekanik, lungfunktionsmått.
12. Kärl- & cirkulationsfysiologi – blodflöde, tryck, ultraljud/doppler av hjärta och kärl.
13. Klinisk neurofysiologi – EEG, EMG, neurografi.
14. Njur-, gastrofysiologi & nuklearmedicin – funktionsmätningar och bildgivande diagnostik.

Inriktning laboratoriemedicin
15. Klinisk kemi & organmarkörer – biokemiska analyter kopplade till lever-, njur- och hjärtfunktion.
16. Hematologi & transfusionsmedicin – blodcellsmorfologi, blodgrupper, koagulationsanalys.
17. Mikrobiologi & immunologi – mikroorganismer, infektionsförsvar, immunologiska metoder.
18. Patologi & histopatologisk morfologi – vävnadsförändringar och morfologisk diagnostik.

### Röntgensjuksköterska
Treårigt program (180 hp), huvudområde radiografi. Topografisk, bildorienterad
anatomi.
*Linser: anatomi → fysiologi/funktion → hur strukturen avbildas (modalitet/projektion) → normalt bildutseende → patologisk avvikelse.*

Topografisk bildanatomi (regionalt)
1. Thorax – lungor, hjärta, mediastinum, revben (lungröntgen).
2. Buk & retroperitoneum – lever, njurar, pankreas, mjälte, tarm (CT-buk).
3. Skelett & extremiteter – ben, leder, frakturanatomi (konventionell röntgen).
4. Columna/ryggrad – kotor, disker, ryggmärg, nervrötter (CT/MR).
5. Skalle & hjärna – kranium, hjärnstrukturer, kärl (CT/MR).
6. Huvud-hals & ansiktsskelett – bihålor, käke, halsens mjukdelar och körtlar.
7. Bäcken & höft – bäckenben, höftled, urogenitala organ.
8. Kärlanatomi – artärer och vener vid angiografi och intervention.

Fysiologi för bildgivning
9. Cirkulation & hjärtfunktion – flöde och perfusion vid hjärt-/kärlavbildning.
10. Njurfunktion & utsöndring – kontrastmedelshantering, urografi, njurpåverkan.
11. Andning & rörelse – andningsstyrd avbildning, rörelseartefakter.

Snitt-, projektions- & modalitetslära
12. Snittanatomi – axiala, sagittala och koronala snitt i CT/MR.
13. Projektionslära & lägesterminologi – riktningar, projektioner, patientpositionering.
14. Modalitetsspecifik bildanatomi – samma struktur på röntgen/CT/MR/ultraljud.
15. Kontrastmedel & fördelning – anatomisk/fysiologisk fördelning i olika vävnader.

### Medicinsk sekreterare
400 YH-poäng (~2 år). Fokus terminologi, inte djup anatomi.
*Linser: ordbildning/stavning → anatomisk struktur → vanliga termer & diagnoser → skrivregler/kodning.*

**UPPDATERAD (2026-07-07) på användarens uttryckliga direktiv:** genomgående fokus på vad saker heter på **svenska respektive latin**, kompletterat med resonerande frågor, grundläggande diagnosmetodik och vanliga journalförkortningar vävda in i de relevanta ämnena. Deklinationsgrammatiken (en klassiker för med sek) får ett eget renodlat ämne istället för att bara nämnas kort under ämne 1. **6 ämnen istället för 5:**

1. Termens byggstenar – prefix, suffix, ordstam, singular/plural, försvenskning, sv↔latin-namngivning av vanliga strukturer.
2. Medicinsk latin: grammatik & deklinationer – substantivens fem deklinationer, genus, kasusböjning (nominativ/genitiv m.fl.), adjektivkongruens, hur böjda latinska termer används korrekt i diagnoser/journaltext.
3. Läges-, riktnings- & rörelsetermer – anatomisk grundposition, kroppsplan, riktningar, regioner, kroppshåligheter.
4. Organsystemen & deras terminologi – organens namn och strukturer system för system, sv/latin (det tyngsta blocket; kan delas per organsystem).
5. Sjukdoms-, symtom- & åtgärdstermer – ändelser (-it, -om, -os, -ektomi, -tomi, -skopi), vanliga diagnoser och ingrepp, grundläggande diagnosmetodik, vanliga journalförkortningar.
6. Diagnosklassificering & kodning – ICD-10 och KVÅ enligt Socialstyrelsens anvisningar.

### Logoped
Fyraårigt program (240 hp), legitimationsyrke. Anatomin inriktad på
kommunikationens och sväljningens organ samt neuroanatomi och hörsel.
*Linser: struktur → muskler & nervförsörjning (kranialnerver) → funktion i tal/röst/sväljning → avvikelse/störning.*

1. Andningsapparaten – lungor, luftvägar, andningsmuskulatur (diafragma, interkostaler, bukpress) med innervation.
2. Röst-/fonationsapparaten (larynx) – struphuvudets brosk, stämläppar, larynxmuskler, innervation (n. vagus/n. laryngeus recurrens).
3. Artikulation & resonans (ansatsröret) – munhåla, tunga, läppar, mjuka gommen, svalg, näshåla/bihålor, mimisk muskulatur, käkar, tänder.
4. Sväljningsapparaten – oral, faryngeal och esofageal fas, struplock, muskler och kranialnerver (dysfagi).
5. Neuroanatomi för tal & språk – CNS/PNS, språkområden (Broca/Wernicke), banor, kranialnerver, kärlförsörjning.
6. Örat & hörselsystemet – ytteröra, mellanöra med hörselben, inneröra, perifer och central hörselbana.

### Apotekare
Femårigt program (300 hp), Uppsala/Göteborg/Umeå. Anatomi/fysiologi som underlag
för farmakologin.
*Linser: fysiologi/struktur → läkemedelsmål (receptor/process) → ADME-relevans → effekt & biverkan.*

1. Cell, receptorer & signalering – membran, receptortyper, signaltransduktion (farmakodynamikens grund).
2. Nervsystemet & autonom fysiologi – CNS/PNS, sympatikus/parasympatikus, signalsubstanser.
3. Hjärta & cirkulation – hjärtfunktion, kärl, blodtrycksreglering; läkemedelsmål och distribution.
4. Mag-tarmkanal & lever – absorption av perorala läkemedel, levermetabolism (first pass, CYP-enzymer).
5. Njurar & utsöndring – filtration och elimination (E i ADME), dosjustering vid nedsatt njurfunktion.

### Optiker
Treårigt program (180 hp), KI och Linnéuniversitetet. Liten allmän bas + fokus på
ögat (främre/bakre segment) och synfysiologi.
*Linser: struktur → funktion → undersökningsmetod/instrument → avvikelse.*

1. Främre segmentet – ögonlock, tårapparat/tårfilm, bindhinna, hornhinna, sclera, främre kammare, intraokulärt tryck.
2. Lins & ackommodation – linsen, strålkroppen, regnbågshinnan, fokuseringsmekanismen, pupillresponser, presbyopi.
3. Bakre segmentet – glaskropp, näthinna, gula fläcken, synnerv, kärlförsörjning; oftalmoskop, OCT, funduskamera, perimeter.
4. Synfysiologi & perception – fototransduktion, receptiva fält, synfält, synbanorna, bearbetning i hjärnan.
5. Ögonrörelser & binokulärseende – externa ögonmuskler och innervation, motilitet, fixation, VOR/nystagmus, samsyn.

### Tandläkare
Femårigt program (300 hp), KI/Göteborg/Malmö/Umeå. Bred bas → fördjupning
huvud/hals och oral anatomi.
*Linser: struktur → kärl & innervation (kranialnerver) → funktion → klinisk koppling (bett/käke/odontologi).*

1. Tand & parodontium – tändernas morfologi och vävnader (emalj, dentin, pulpa, cement), tandutveckling, fäste (parodontalligament, alveolarben, gingiva).
2. Käkar & käkled (TMJ) – maxilla och mandibula, käkledens anatomi och biomekanik, käkmuskler, ocklusion, artikulation.
3. Munhåla & munbotten – tunga, gom, kinder, munbottens topografi (muskler, kärl, nerver, lymfknutor, spottkörtlar), svalgmuskulatur.
4. Huvud-hals: kärl & nerver – ansikts- och tuggmuskulatur, kranialnerver (särskilt n. trigeminus och n. facialis), blod-/lymfkärl, spottkörtlarnas innervation.
5. Salivkörtlar & oral fysiologi – stora och små spottkörtlar, salivsekretion och reglering, smak och oral sensorik.

### Audionom
Treårigt program (180 hp), KI/Göteborg/Lund/Örebro. Liten anatomibas + hörselns
och balansens anatomi/fysiologi.
*Linser: struktur → funktion → mätmetod (audiologisk diagnostik) → patofysiologi/hörselskada.*

1. Ytter- & mellanöra – ytterörat, hörselgången, trumhinnan, hörselbenen (hammare, städ, stigbygel), örontrumpeten.
2. Innerörat – cochlea – snäckans uppbyggnad, hårceller, basilarmembranet, omvandling av vibration till nervimpuls (tonotopi).
3. Balansorganet (vestibularis) – båggångar och otolitorgan; registrering av rörelse och läge.
4. Hörselnerven & centrala hörselbanan – n. vestibulocochlearis, hörselbanan upp till hörselbarken, central bearbetning.
5. Ljud- & hörselfysiologi – akustikens grunder, ljudtransmission, lednings- vs sensorineural hörselnedsättning.

### Sjuksköterska
Treårigt program (180 hp), ~20 lärosäten. Organsystemsbaserat med
omvårdnadsprägel.
*Linser: struktur → fysiologi → normalvärden & mätning → omvårdnadskoppling → förändring vid åldrande/sjukdom.*

Befintliga ämnen: **Medicinsk latin (MC)**, **Blandad anatomi/fysiologi (FC)**
(omdöpt från "Anatomi & fysiologi (FC)"), **Läkemedelsräkning (MC)**.

Grundläggande
1. Cell, vävnad & homeostas – celltyper, fyra vävnadsslag, homeostasbegreppet.
2. Vitalparametrar & normalvärden – puls, blodtryck, andningsfrekvens, temperatur, saturation, medvetandegrad.

Organsystem
3. Cirkulationssystemet – hjärtanatomi, hjärtcykel, blodkärl, blodtrycksreglering, EKG-grunder.
4. Blodet – blodkroppar, hemoglobin, koagulation, blodgrupper, anemi.
5. Respirationssystemet – luftvägar, gasutbyte, andningsreglering, syra-bas, pulsoximetri.
6. Nervsystemet – CNS/PNS, autonoma nervsystemet, sinnesorgan, reflexer.
7. Rörelseapparaten – skelett, leder, muskler – mobilisering och fallprevention.
8. Matsmältning & näringslära – GI-organ, lever/pankreas, näringsämnen, nutritions-/vätskebedömning.
9. Njurar & urinvägar – urinproduktion, filtration, vätske- och elektrolytbalans.
10. Endokrina systemet – hormonaxlar, insulin/blodsockerreglering, diabetesomvårdnad.
11. Huden (integumentet) – hudens lager, temperaturreglering, sårläkning, trycksår.
12. Immunförsvar & lymfsystem – medfött och förvärvat försvar, inflammation.
13. Reproduktion, graviditet & förlossning – reproduktiva organ, menscykel, normal graviditet/förlossning.

Kliniknära tvärsnitt
14. Vätske-, elektrolyt- & syra-basbalans – binder ihop njure, andning och cirkulation.
15. Åldrande & livscykelperspektiv – fysiologiska förändringar från barn till äldre.

### Läkare
Sexårigt sammanhållet program (360 hp), 7 lärosäten. Topografisk fullständig
anatomi + organsystemsfysiologi + basvetenskapliga tvärsnitt.
*Linser: makroanatomi → kärl & innervation → histologi → fysiologi → embryologi → klinisk korrelation.*

Befintligt ämne: **Blandad anatomi/fysiologi (MC)** (omdöpt från "Anatomi & fysiologi (MC)").

Topografisk anatomi (regionalt)
1. Övre extremitet – axel/arm/hand, plexus brachialis, kärl, nervskador (radialis/ulnaris/medianus).
2. Nedre extremitet – höft/knä/fot, plexus lumbosacralis, n. ischiadicus/femoralis, gångfunktion.
3. Thorax – bröstkorg, hjärta, lungor, mediastinum, pleura, diafragma.
4. Buk/abdomen – bukväggens lager, peritoneum, GI-organ, lever/pankreas/mjälte, kärl.
5. Bäcken & perineum – bäckenbotten, urogenitala och reproduktiva organ, kärl och nerver.
6. Rygg & columna – kotpelarens segment, ryggmärgens nivåer, spinalnerver, dermatom/myotom.
7. Huvud & hals – kraniet, ansiktsmuskler, de tolv kranialnerverna, spottkörtlar, svalg/larynx, kärl.
8. Neuroanatomi (CNS) – storhjärna, hjärnstam, lillhjärna, banor, kärlförsörjning, ventrikelsystem.

Organsystem (fysiologi + integrerad anatomi)
9. Kardiovaskulära systemet – hjärtcykeln, retledning/EKG, hemodynamik, blodtrycksreglering.
10. Respirationssystemet – ventilation, gasutbyte, syra-bas, syrgastransport, lungvolymer.
11. Njure & vätskebalans – filtration/reabsorption, elektrolyt-/syra-basreglering, RAAS.
12. Gastrointestinalt & ämnesomsättning – digestion, absorption, levermetabolism, energireglering.
13. Endokrina systemet – hypofys-/sköldkörtel-/binjureaxlar, insulin/glukagon, feedbackloopar.
14. Blod & immunförsvar – blodkroppar, hemostas, immunceller, medfött vs adaptivt försvar.
15. Reproduktion – manliga/kvinnliga organ, menscykel, hormonell styrning, befruktning, graviditet.

Basvetenskapliga tvärsnitt
16. Histologi – epitel, bind-/stödjevävnad, muskel- och nervvävnad.
17. Embryologi – groddblad, organogenes, vanliga missbildningar.
18. Cell- & membranfysiologi – membranpotential, transportmekanismer, signalering.

---

## ENDAST REFERENS — hanteras separat (bygg INTE utifrån detta)

### Arbetsterapeut
Treårigt program (180 hp). Allt ramas in genom aktivitet/aktivitetsutförande;
tyngdpunkt arm/hand.
*Linser: struktur → funktion → betydelse i aktivitet → påverkan vid skada/sjukdom → utveckling/åldrande.*

> OBS: Arbetsterapeutens nuvarande ämnen i appen är annorlunda än indelningen
> nedan. Rör inte arbetsterapeut utifrån detta dokument — vi fixar det separat.

Rörelseapparaten (funktionell, tyngdpunkt övre extremitet)
1. Hand & grepp – grepptyper, finmotorik, handens betydelse i aktivitet.
2. Arm, axel & skuldra – räckvidd, lyft, positionering för aktivitet.
3. Bål, rygg & hållning – stabilitet och sittfunktion, grund för ergonomi.
4. Nedre extremitet & förflyttning – gång, transfer, balans i vardagsaktiviteter.
5. Allmän rörelselära – ledtyper, muskelfunktion, rörelseuttag (ROM).

Nervsystem & högre funktioner
6. Nervsystemets grundanatomi – CNS/PNS, motoriska och sensoriska banor.
7. Hand–hjärna-interaktion & sensomotorik – sensorik, motorisk kontroll, koordination.
8. Högre kognitiva funktioner – perception, minne, exekutiva funktioner kopplat till aktivitetsförmåga.
9. Perifera nervskador – nervkompressioner och känselbortfall i hand/arm.

Organsystem & uthållighet
10. Hjärt-kärl & respiration – kondition och ork som förutsättning för aktivitet.
11. Muskelfysiologi & energi – uthållighet, trötthet, aktivitetsbalans.
12. Sinnena – syn, hörsel, balanssinne (vestibulärt), proprioception.

Livslopp & tillämpning
13. Sensomotorisk utveckling (barn) – motoriska milstolpar, greppets utveckling.
14. Fysiologiskt åldrande – förändringar i muskel, led, nerv, balans.
15. Ergonomi & belastning – kroppen i arbete ur funktionellt anatomiskt perspektiv.
