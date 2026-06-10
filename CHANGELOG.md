# CHANGELOG - Anatomiquiz

## 0.6.19
- **Grundlig faktagranskning av samtliga MC/TF-ämnen** (≈2 400 frågor: ben, blodomloppet, ergonomi, grepp, handen, ledtyper, muskler, neurologi, olika_aldrar, riktningar, skuldran, tentaplugg). `medicinsk_terminologi.json` granskades inte (skyddad källa).
- **Sakfel rättade:**
  - **Hjärtat har 2 kammare, inte 4.** `tentaplugg studier_q153` ("Hur många kammare har hjärtat?") rätt svar 4 → **2** (4 blev distraktor). `blodomloppet q41` "Hjärtat har fyra kamrar" → "Hjärtat har **två** kamrar" (svar Sant).
  - **handen q220:** "M. flexor carpi radialis går genom karpaltunneln" Sant → **Falskt** (FCR löper i eget fack; krockade med att karpaltunneln rymmer 9 senor).
  - **handen q221:** "M. flexor carpi ulnaris går genom Guyons kanal" Sant → **Falskt** (kanalen rymmer n./a. ulnaris; FCU fäster på os pisiforme).
  - **handen q468:** tum-MCP-extension — rätt svar omdefinierat till "En rörelse i frontalplanet parallellt med handflatan" (det felaktiga sagittalplan-svaret blev distraktor; var inkonsekvent med abduktionsdefinitionen i q484).
- **Tvetydiga/svaga frågor borttagna:** `tentaplugg studier_q210` (nackbelastning "12 ggr" – ej källstödd), `tentaplugg studier_q224` och `grepp q44` (konservburkslock → Sollerman-grepp – ej entydigt verifierbart).
- **Omformuleringar för entydighet:** `tentaplugg studier_q98` (ledningshastighet — distraktorn "Ranviers noder" var försvarbart korrekt; frågan omformulerad med "Graden av myelinisering" och entydiga distraktorer). `tentaplugg studier_q178` ordval "vätska" → "hormon" (melatonin).
- **Stavfel rättade:** `skuldran q66/q76` Romd→Romb (romboideus), `handen q421` frakureras→fraktureras, `handen q445` lillfingeridan→lillfingersidan.
- Cachebustrar och APP_VERSION bumpade till 0.6.19.
- Highscore-datan i localStorage är orörd.

## 0.6.18
- **Slumpade frågor (blandade) innehåller inte längre flashcards.**
  - **Etiketten** i ämnesmenyn ändrad från "Slumpade frågor (MC+FC+TF)" till "Slumpade frågor (MC+TF)". Eftersom appens lägeslogik läser typtaggen ur etiketten innebär detta att knappen "Starta flashcards" nu är skuggad när Slumpade frågor är valt (det gick tidigare att köra slumpade som flashcards), och att Slumpade frågor döljs om man bara bockat i frågetypen Flashcards.
  - **Laddaren** för blandade (både quiz- och flashcards-läget i `js/app.js`) bygger nu sin fil-lista enbart från ämnen vars etikett har MC eller TF — rena flashcard-ämnen (Studenters flashcards, Muskler flashcards) tas aldrig in. Poolen innehåller därmed 0 flashcard-kort (verifierat). Quizutfallet är oförändrat (FC-ämnena bidrog ändå inte med MC/TF), men inga flashcard-filer hämtas längre i onödan.
  - Frågetypsfiltret i quizet kvarstår som extra säkerhetsnät.
- Cachebustrar och APP_VERSION bumpade till 0.6.18.
- Highscore-datan i localStorage är orörd.

## 0.6.17
- **Rättat felplacerad text i index.html:** en lös textsträng "Hitta" hade hamnat direkt efter `og:url`-metataggen inne i `<head>`. Webbläsaren flyttar lös text från `<head>` in i `<body>`, vilket gjorde att ordet dök upp överst på sidan (bl.a. ovanför topplistan). Borttagen.
- Cachebustrar och APP_VERSION bumpade till 0.6.17.
- Highscore-datan i localStorage är orörd.

## 0.6.16
- **Entydighetsgranskning av de tre nya ämnena (Grepp, Skuldra, Ledtyper):** gick igenom samtliga 252 MC-frågor och säkerställde att exakt ETT svarsalternativ är korrekt. Fyra frågor hade en distraktor som i själva verket också var korrekt — rättade:
  - **grepp q7:** "Vilket grepp använder tumme, pekfinger och långfinger tillsammans?" hade Nyckelgrepp som distraktor (kan tolkas som korrekt). Omformulerad till entydig trepunktsdefinition: "Vilket grepp bildar ett trepunktsfäste mellan tummen, pekfingret och långfingret?" (svar Chuckgrepp), nyckelgreppet utbytt.
  - **grepp q38:** glödlampa → Fem-fingergrepp hade Sfäriskt volargrepp som distraktor — ett runt föremål kan försvaras som sfäriskt. Distraktorn utbytt.
  - **grepp q47:** runt dörrvred → Sfäriskt volargrepp hade Fem-fingergrepp som distraktor — samma rund-föremåls-överlapp. Distraktorn utbytt.
  - **ledtyper q12:** beskrivningen "två plan men inte alla håll" passar både äggled OCH sadelled. Omformulerad och förankrad i de ovala/äggformade ledytorna (svar Äggled).
- Skuldra hade inga entydighetsfel.
- Cachebustrar och APP_VERSION bumpade till 0.6.16.
- Highscore-datan i localStorage är orörd.

## 0.6.15
- **Info-tabellen (statistik) kompletterad med alla ämnen** (`js/info.js`). Lade till de ämnen som saknades: Ergonomi och Olika åldrar i quiz-listan samt Muskler flashcards i flashcard-listan. Skuldra/Grepp/Ledtyper fanns redan med sedan de skapades. OTIPM och Moho utelämnade enligt önskemål. Antalen räknas live ur respektive JSON-fil, så de är alltid korrekta (totalt 3223 quizfrågor + 893 flashcards).
- **Blandade frågor verifierade att täcka allt MC/TF utom Moho/OTIPM:** laddaren är dynamisk och bygger sin fil-lista ur ämnesmenyns alternativ (exkluderar `blandade`, `moho_flashcards`, `otipm_flashcards`). Därmed dras Skuldra, Grepp, Ledtyper, Ergonomi och Olika åldrar in automatiskt; flashcard-kort filtreras bort av frågetypsfiltret. Bekräftat: blandade-poolen = 3223 MC/TF-frågor, Moho/OTIPM korrekt uteslutna. (Ingen kodändring behövdes här.)
- Cachebustrar och APP_VERSION bumpade till 0.6.15.
- Highscore-datan i localStorage är orörd.

## 0.6.14
- **Nytt ämne: Ledtyper (MC)** (`data/ledtyper.json`, 52 frågor, enbart MC, Normal-nivå). Ledtyperna så som 1177 beskriver dem (kulled, gångjärnsled, vridled, äggled, sadelled, planled samt synovialled som överordnad kategori), med fokus på vilka rörelser varje ledtyp utför. Faktagranskat mot 1177:s sida "Så fungerar skelett och leder".
- **Alla ledexempel hämtade enbart från användarens befintliga ämnen** — inga nya leder införda (gäller även distraktorerna): axelled/höftled (kulled), armbågsled/knäled/interfalangealleder (gångjärnsled), radioulnarled/atlantoaxialled (vridled), handled (äggled), tummens basled CMC I & SC-led (sadelled), AC-led/handlovsleder (planled). Klassificeringarna stämmer med ben.json/handen.json/skuldran.json/tentaplugg.json.
- **Fyra delämnen:** `ledtyper_typ` (15, varje ledtyps rörelse + jämförelser), `ledtyper_synovial` (6, synovialled samt ledbrosk/ledvätska/ledband/ledkapsel enligt 1177), `ledtyper_exempel` (18, led → ledtyp), `ledtyper_rorelse` (13, konkreta rörelser vid namngivna leder, t.ex. pronation/supination i radioulnarleden, opposition i tumbasen, rotation i atlantoaxialleden).
- Inkopplat i app.js (`getQuestionsPath` + båda `topicMatch`-blocken, prefix `ledtyper_`), ämnesmenyn i index.html samt statistiklistan i info.js.
- Cachebustrar och APP_VERSION bumpade till 0.6.14.
- Highscore-datan i localStorage är orörd.

## 0.6.13
- **Nytt ämne: Grepp (MC+TF)** (`data/grepp.json`, 100 frågor, 65 MC + 35 TF, alla på Normal-nivå). Bygger på Sollerman-greppklassificeringen och Handrehabilitering (Björkman, Johansson & Rosén 2023, kap 2, s 32-65). Endast de sju efterfrågade greppen behandlas — extensionsgreppet utelämnat. Inga termer utanför referensmaterialet (samma termflora som redan används i handen.json/tentaplugg.json).
- **Fem delämnen:**
  - `grepp_typer` (29): indelning precisionsgrepp/kraftgrepp, vilka fingrar varje grepp använder, definitioner av fingertoppsgrepp, nyckelgrepp, chuckgrepp, fem-fingergrepp samt diagonalt/transversellt/sfäriskt volargrepp.
  - `grepp_exempel` (24): konkreta vardagsexempel per grepp — synål/mynt/knapp/gem (fingertopp), nyckel/blixtlås/spelkort (nyckel), penna/pensel/nål (chuck), burklock/glödlampa (fem-finger), hammare/skruvmejsel/kniv/kvast (diagonalt), portfölj/konservburk/cykelstyre/trappräcke (transversellt), äpple/dörrvred/boll (sfäriskt).
  - `grepp_muskler` (24): inblandade muskler — opponens/adductor/abductor/flexor pollicis, flexor digitorum superficialis/profundus, mm. interossei (palmares/dorsales), mm. lumbricales, opponens digiti minimi, extensor digitorum — samt innervation (n. medianus/ulnaris/radialis). M. adductor pollicis lyft fram som nyckelgreppets nyckelmuskel.
  - `grepp_leder` (14): CMC I (sadelled, opposition), MCP/PIP/DIP-leder, tummens IP-led, handens välvning via de yttre fingrarnas CMC-leder.
  - `grepp_skador` (9): hur skada på n. medianus/ulnaris/radialis och artros i tumbasen (CMC I) påverkar olika grepp.
- Inkopplat i app.js (`getQuestionsPath` + båda `topicMatch`-blocken, prefix `grepp_`), ämnesmenyn i index.html samt statistiklistan i info.js.
- **Faktafel rättat i Handen** (`data/handen.json`): tre frågor (q1, q57, q174) påstod felaktigt att fingertoppsgreppet använder tumme + två/tre fingrar — det gör det inte (då vore det chuckgrepp). q1 omformulerad till korrekt definition ("tummens pulpa möter pekfingrets pulpa, topp mot topp", Sant); q57 och q174 omgjorda till distinkta missuppfattnings-kontroller (Falskt) så de inte dubblerar varandra och förstärker skillnaden mot chuckgreppet.
- Cachebustrar och APP_VERSION bumpade till 0.6.13.
- Highscore-datan i localStorage är orörd.

## 0.6.12
- **Nytt ämne: Skuldra (MC+TF)** (`data/skuldran.json`, 100 frågor, 70 MC + 30 TF, alla på Normal-nivå). Anatomiskt fokus, latinsk nomenklatur enligt Terminologia Anatomica och svenska benämningar enligt etablerad litteratur; nivå avsedd för 1:a-årsstudenter i arbetsterapi och fysioterapi. Inga engelska termer.
- **Fyra delämnen:**
  - `skuldra_ben` (28): skuldergördelns ben och landmärken — scapula (cavitas glenoidalis, spina, acromion, processus coracoideus, fossae, marginer, angulus inferior), clavicula (sternal/akromial ände, S-form) och proximala humerus (caput, tuberculum majus/minus, sulcus intertubercularis, collum chirurgicum, tuberositas deltoidea).
  - `skuldra_leder` (30): **de fyra lederna** som efterfrågades — art. glenohumerale (kulled, labrum, rörelser, instabilitet), art. acromioclavicularis (plan led, lig. coracoclaviculare), art. sternoclavicularis (enda äkta förbindelsen till axialskelettet, discus articularis, sadelled) och den skapulotorakala leden (funktionell, ej synovial).
  - `skuldra_muskler` (34): deltoideus, trapezius, serratus anterior, mm. rhomboidei, levator scapulae, pectoralis major/minor, latissimus dorsi, teres major, biceps/triceps/coracobrachialis (ursprung/fäste/funktion/innervation). Rotatorkuffen nedtonad till ett par stabiliseringsfrågor.
  - `skuldra_funktion` (8): skapulohumeral rytm (~2:1), samspel mellan lederna vid abduktion, bursa subacromialis, luxation (anterior).
- Frågor återanvänder och omformulerar typiska tenta-/ben-/muskelfrågor utan att dubblera befintliga frågor ordagrant.
- Inkopplat i app.js (`getQuestionsPath` + båda `topicMatch`-blocken, prefix `skuldra_`), ämnesmenyn i index.html samt statistiklistan i info.js.
- Cachebustrar och APP_VERSION bumpade till 0.6.12.
- Highscore-datan i localStorage är orörd.

## 0.6.11
- **Spoiler-städning över alla ämnen:** sökte systematiskt (med stam-/böjningsmatchning) efter MC-frågor där en redundant parentes-gloss avslöjar svaret genom att upprepa ett ord ur frågan. 8 äkta läckor täppta:
  - **ben q314:** "längd**tillväxt**?" → svar "Epifysplattorna ~~(tillväxtplattorna)~~".
  - **handen q257/q258:** prompten innehöll översättningsglosan "(volart/dorsalt radiocarpalligament)" som gav bort svaret "Volar/Dorsal" — borttagen.
  - **handen q492:** svar "Dorsala aponeurosen ~~(sträckapparaten)~~" (ekade "sträcksenorna").
  - **tentaplugg q186:** frågan namngav eponymen "(benämnt efter Leonard Hayflick)" → svar "Hayflick-gränsen" — borttagen.
  - **tentaplugg q273:** "(os ischii)" gav bort "Tuber ischiadicum" — borttagen.
  - **olika_aldrar q37/q62:** svarsglosorna "(balanssinnet)" och "(ålderssynthet)" ekade "balansen"/"åldern" i frågan — borttagna.
  - Lämnade orörda: Hard-frågornas rörelse-parenteser (t.ex. "(med böjt knä)") som är meningsfulla villkor, samt fall där parentes-ordet delas av distraktorerna (ingen läcka).
- Cachebustrar och APP_VERSION bumpade till 0.6.11.
- Highscore-datan i localStorage är orörd.

## 0.6.10
- **Studenters flashcards – andra städpassen** (`data/studenters_flashcards.json`): jakt på kvarvarande bildhänvisningar och obegripliga/hopslagna meningar.
- **Bildhänvisningar borttagna:** `(bild 1)`, `(bild 2/kanten)` m.fl. i ffc_833–836 (erector spinae & rectus abdominis) — ben-/fästesinfo behållen, bildnoteringarna borta. Inga `pil`/`markerad`-hänvisningar kvar.
- **Hopslagna ord (förlorade radbrytningar):** ~190 gränser där ord klistrats ihop (t.ex. "förmakAtrium", "höftledenOs coxae", "Exempel:Margo") separerade med mellanslag; kolon följt direkt av text fick mellanslag. De avsiktliga minnesregel-versalerna i ffc_260 (`OsteoKlaster`/`OsteoBlaster`, "K=Krossar"/"Bygger") bevarades; typo `Osterocyter` → `Osteocyter`.
- **Handfixade trasiga listor:** ffc_197 (processus spinosus) återställd till punktlista; rena gemen-gemen-hopslagningar i ffc_311, ffc_479, ffc_763, ffc_787 isärskrivna.
- Cachebustrar och APP_VERSION bumpade till 0.6.10.
- Highscore-datan i localStorage är orörd.

## 0.6.9
- **Granskning av Muskler-flashcards** (`data/muskler_flashcards.json`, 87 kort, VT26-versionen). Settet var i praktiken felfritt — korrekt och konsekvent fakta (ursprung/fäste/funktion/innervation), enhetlig stil, inga typos eller dekomponerad Unicode. Supraspinatus-ursprunget är korrekt angivet (fossa supraspinata).
- **Enda åtgärd:** de 10 innervationssvaren började med gement `n.` medan settets övriga svar börjar med versal — den inledande nervförkortningen versaliserad (`n. radialis` → `N. radialis`); förekomster mitt i sträng (t.ex. "FCU: n. ulnaris") lämnades gemena enligt korrekt svensk konvention.
- Cachebustrar och APP_VERSION bumpade till 0.6.9.
- Highscore-datan i localStorage är orörd.

## 0.6.8
- **Granskning av Studenters flashcards** (`data/studenters_flashcards.json`, 806 kort). Den informella stilen (minnesregler, emojis, "reversed"-kort) lämnades orörd; fokus på rena fel och obegripliga frågor.
- **Dolda Unicode-gremlins:** 31 kort (mest "gamla tentor") hade dekomponerad Unicode (t.ex. "ö" = o + kombinerande prick, "å" = a + ring) från copy-paste — hela filen NFC-normaliserad. Detta gjorde också att vissa typos kunde rättas (t.ex. "fö rmedlas" → "förmedlas").
- **Bildberoende frågor gjorda självständiga:** "nervflätan **på bilden**…" (ffc_290, "på bilden" borttaget), "Vilken muskel flekterar **den markerade leden**?" → "…DIP-leden (yttersta fingerleden)?" (ffc_307), och "Vilka ben/leder pekar **de röda pilarna** på?" omskriven till en självständig namnge-fråga med komplett svar (ffc_409).
- **Typos:** Claviceln → Clavicula (flera kort), Fascialis → Facialis, körtlen → körteln (Bukspottskörteln/Sköldkörteln), Klohande → Klohand, Carpometakapalled → Carpometakarpalled, Superus/Inferus → Superior/Inferior.
- **Stilnormalisering (på begäran):** förkortningarna för muskler och nerver konsekvent satta till `M. xxx` / `N. xxx` med gement namn (t.ex. "M Deltoideus" → "M. deltoideus", "n Ulnaris" → "N. ulnaris") över hela settet.
- Cachebustrar och APP_VERSION bumpade till 0.6.8.
- Highscore-datan i localStorage är orörd.

## 0.6.7
- **Blodomloppet** (`data/blodomloppet.json`): granskning av hela ämnet (100 sant/falskt-frågor) — i övrigt felfritt (korrekt fakta, rena meningar, redan versaliserade). En enda otydlig fråga skärptes:
  - **q93:** "Blodet passerar lungorna innan kroppen i kretsloppet." (tvetydig — saknade referenspunkt i ett slutet kretslopp) → "Blodet passerar lungorna direkt efter att ha lämnat **vänster kammare**." Svaret är fortsatt Falskt och bildar nu ett entydigt kontrastpar med q94 (höger kammare → Sant).
- Cachebustrar och APP_VERSION bumpade till 0.6.7.
- Highscore-datan i localStorage är orörd.

## 0.6.6
- **Granskning av hela ämnet Neurologi/Nervsystemet** (`data/neurologi.json`, 120 sant/falskt-frågor). Ämnet var mycket välskrivet (fullständiga, korrekta meningar, redan versaliserade) och faktamässigt korrekt. Endast tre språkliga finputsningar:
  - **q39:** särskrivning "Golgi senorgan" → "Golgis senorgan".
  - **q55:** calque "Noder av Ranvier" → "Ranviers noder" (samma form som i tentaplugg-ämnet).
  - **q86:** kongruensfel "Cerebellum är viktig" → "viktigt" (matchar q40).
- Cachebustrar och APP_VERSION bumpade till 0.6.6.
- Highscore-datan i localStorage är orörd.

## 0.6.5
- **Språk- och faktagranskning av hela ämnet Muskler** (`data/muskler.json`, 273 frågor, inkl. 100 Hard-tillämpningsfrågor). Fakta (innervation, ursprung/fäste, funktion) var korrekt — åtgärderna var språkliga.
- **Stavfel:** `vadsmuskel` → vadmuskeln; `Att rät ut` → Att räta ut (q157).
- **Nervförkortning:** `innerveras av n ulnaris/medianus/radialis` → `N. ulnaris/medianus/radialis` (q85–q99).
- **Versalisering:** svarsalternativen i namnfrågorna (q1–q14) och i klassificeringsfrågorna (extrinsic/intrinsic) började med liten bokstav — nu versaliserade. Termen intrinsic/extrinsic behållen (samma som det källbaserade tentaplugg-ämnet).
- Cachebustrar och APP_VERSION bumpade till 0.6.5.
- Highscore-datan i localStorage är orörd.

## 0.6.4
- **Granskning av ämnet Tentaplugg** (`data/tentaplugg.json`, 353 kliniska scenariofrågor). Ämnet var genomgående välskrivet (fullständiga meningar, korrekt grammatik, korrekta fakta, redan versaliserat) — endast två rättelser behövdes:
  - **studier_q200:** prompten var självmotsägande ("celler **i CNS** som bildar myelin i det **perifera** nervsystemet") — Schwannceller hör till PNS. "i CNS" borttaget.
  - **studier_q224:** grammatikglapp "öppna ett burklocket" → "öppna locket på en konservburk".
- Cachebustrar och APP_VERSION bumpade till 0.6.4.
- Highscore-datan i localStorage är orörd.

## 0.6.3
- **Språk- och faktagranskning av hela ämnet Riktningar/Terminologi** (`data/riktningar.json`, 543 frågor, inkl. 100 Hard-muskelfrågor). Innehållet (rörelse- och riktningsdefinitioner) var faktamässigt korrekt — problemen var nästan uteslutande språkliga.
- **Systematiska stavfel:** `kroppposition` (trippel-p) → kroppsposition (~15 frågor), `kropplig` → kroppslig (6), `Vriding` → Vridning (7), `Dorsiflexion` → Dorsalflexion.
- **Engelska/inkonsekventa termer → svenska:** `Abduction/Adduction` → Abduktion/Adduktion; `Extern rotation` → Utåtrotation; "Bukläge är supine position" omskrivet; q387–390 hade engelska svar (Supine/Prone/Fowler's/Lithotomy) → svenska lägesnamn (Ryggläge/Bukläge/Fowlerläge/Litotomiläge/Trendelenburg).
- **Omskrivna frågor:** cirkulära/genusfela definitioner av handens/fotens ytor (q412–414), etymologifrågorna för ab-/adduktion (q252–253), samt "RAKT UTÅT"-versaler.
- **Hard-typos:** `löftar`/`lyftar` → lyfts, `rycktas` → rycks, `bromsa` → bromsas, `slappet` → slappt, dubbel-s i Tibial-/Fibularsidan, och en trippelupprepning ("framför sig framför kroppen").
- Alla frågor och svarsalternativ börjar nu med versal.
- Cachebustrar och APP_VERSION bumpade till 0.6.3.
- Highscore-datan i localStorage är orörd.

## 0.6.2
- **Språk- och faktagranskning av hela ämnet Ben/Osteologi** (`data/ben.json`, 445 frågor). Samtliga frågor genomgångna mot både språk och fakta.
- **Faktafel rättade:** "Karpometakarpalleder är kulleder" var markerat Sant → **Falskt** (CMC-leder är sadel-/planleder, inte kulleder); spongiöst ben beskrevs ha "luftfyllda rum" → **märgfyllda hålrum**; "benmassa ökar genom livet" → benmassan **når sitt maximum runt 30 års ålder**.
- **Felaktigt ord genomgående:** *os coccygis* kallades "gödben" (inte ett riktigt svenskt anatomiord) → **svansbenet** i samtliga ~12 frågor.
- **Logiskt bakvända prompter:** ~25 frågor av typen "os frontale är svenska namnet för …" (kallade det *latinska* namnet "svenska namnet") omskrivna till "Vad är os frontale på svenska?".
- **Språk:** systematiska stavfel (tarbenen→tarsalbenen, bröstkassen→bröstkorgen, mellanhåndsben, Vilkett→Vilket, sittbensknöppen→sittbensknölen, Strumma→Strama, möjliggord, avstavade ben-vävnad/ben-märg), ihopblandad latin/engelska i ligamentfrågorna, samt awkward fraser ("ett ben själv", "längd-tillväxt") städade. Alla frågor och svarsalternativ börjar nu med versal.
- Cachebustrar och APP_VERSION bumpade till 0.6.2.
- Highscore-datan i localStorage är orörd.

## 0.6.1
- **Språk- och faktagranskning av hela ämnet Handen** (`data/handen.json`, 490 → 487 frågor). Samtliga frågor genomgångna mot både språk och fakta.
- **Faktafel rättade:** M. palmaris longus stod felaktigt som *Extensor* (→ Flexor); radiell/ulnar halva av ringfingrets innervation var omkastad mellan n. medianus och n. ulnaris; os pisiforme/os triquetrum var klassade som "oregelbundet ben" (→ kortben, som övriga handrotsben); en distraktor var identisk med det rätta svaret. I nervutbredningsrutan rättades fyra celler från Sant → Falskt (n. medianus saknar funktion för lillfinger och handryggen; n. radialis saknar lillfinger och palmar funktion). Antalet intrinsiska handmuskler rättat 17 → 19.
- **Borttaget:** tre meningslösa dubblettfrågor (pronation kopplat till grepptyp, där greppet var irrelevant); en behölls i omskrivet, vettigt skick.
- **Språk:** stavfel (måntbenet, tumaddduktor, Saddeleled, Gångjärnsledd, intrinsik, gynglymus m.fl.), engelska ord översatta till svenska (medial/lateral half ring finger, dorsal surface, interossei muscles m.fl.), trasig meningsbyggnad, nonsensord (tummetubsen, pekarfingerbenen, "Vid polsen"), särskrivningar, genusfel och telegrafiska meningar omskrivna. Alla frågor och svarsalternativ börjar nu med versal.
- De svåra leder-frågorna (q445–q492) var redan välskrivna och lämnades orörda.
- Cachebustrar och APP_VERSION bumpade till 0.6.1.
- Highscore-datan i localStorage är orörd.

## 0.6.0
- Ny **Case-sektion** (`case.html`): kliniska fallbeskrivningar som använder ämnenas anatomiska begrepp i sitt sammanhang. Varje case är ungefär en halv A4 långt, beskriver en person med en typisk krämpa/skada och använder medicinskt latinska termer med lekmannatermen inom parentes efter. Brödsmula tillbaka till start som vanligt.
- **Framsidan:** ny knapprad längst ned med **Case** + **Ordlista** (Ordlista flyttad dit från sekundärraden, som nu rymmer Info, Topplista, Inställningar). Raden har en **teal-accent** (`--accent` #0d9488) som komplementton till det gröna, via klassen `.accent-row`.
- **Första ämnet: Handen** med 5 faktagranskade case i olika åldrar — karpalkanalsyndrom (52 år), Guyons kanalsyndrom/klohand (38 år), rhizartros (68 år), Dupuytren kontraktur (60 år) och buttoniere deformitet (24 år). Samtliga patologier och anatomiska begrepp är hämtade ur handen-ämnet (+ medicinsk terminologi, muskler, ben). Ord som inte finns i källorna används sparsamt och med kort förklaring i parentes.
- **Filter-dropdown** överst på case-sidan (Alla ämnen / valt ämne), byggs dynamiskt ur casens ämnen så nya ämnen kommer med automatiskt (`js/case.js`).
- **case.html SEO/meta** komplett enligt projektets norm (title, description, keywords, canonical, Open Graph, Twitter Card, theme-color, ikoner, manifest). Strukturerad data berikad med `about` + `mainEntity`-`ItemList` över de fem casen, och varje case har fått ett `id` (`#case-1`…`#case-5`) så list-URL:erna blir riktiga djuplänkar. Brödsmula i JSON-LD som tidigare.
- **Lärande-/studentvinkel** genomgående: titel, description, OG/Twitter och synlig text (tagline + intro) lyfter nu att casen är till för att **plugga och studera** anatomi ("plugga smartare", "tentaplugg", "perfekt repetition"). JSON-LD-typen utökad till `["CollectionPage","LearningResource"]` med `learningResourceType`, `educationalUse`, `audience` (student) och `isAccessibleForFree`. Meta-description trimmad till ~160 tecken.
- **Topplistan** har fått samma brödsmulelänk (`‹ Start` / Topplista) som inställningssidan, överst i sektionen (`#scoresCrumb`) — leder tillbaka till startvyn.
- case.html tillagd i `sitemap.xml`. Cachebustrar och APP_VERSION bumpade till 0.6.0 — även `styles.css`-bustern på `info.html` och `medicinskordlista.html` (låg kvar på 0.4.9 trots att `styles.css` ändrats).
- Highscore-datan i localStorage är orörd.

## 0.5.3
- FIX: flashcards-knappen var alltid skuggad om Flashcards var avbockad i filtret — även på ämnen som faktiskt har flashcards (t.ex. "Tentaplugg (MC+FC)"). Startknapparna speglar nu **enbart det valda ämnet** (quiz om ämnet har MC/TF, flashcards om ämnet har FC). Frågetypsfiltret sköter ämneslistan, inte knapparna.
- Cachebustrar och APP_VERSION bumpade till 0.5.3.

## 0.5.2
- Frågetypsfiltret filtrerar nu **även ämneslistan**: ämnen som saknar någon av de valda typerna döljs ur Ämne-menyn (t.ex. avbockad Flashcards → flashcard-ämnena försvinner). Tidigare skuggades bara startknapparna.
- Ämnena tas bort och återskapas i DOM (i stället för `option hidden`) så att det fungerar även på iOS/WebKit. Valt ämne behålls om det finns kvar, annars väljs första synliga. Håller efter omladdning.
- Cachebustrar och APP_VERSION bumpade till 0.5.2.

## 0.5.1
- Fixa radbrytning i sekundärknapparna på mobil: "Topplista" och "Inställningar" bröt rad eftersom fyra knappar på en rad gav för smala kolumner. Mindre font (0.66rem), padding (8px 3px) och gap (6px) + nowrap för `.secondary-actions .btn` så de ryms på en rad ner till 360px.
- Cachebustrar och APP_VERSION bumpade till 0.5.1.

## 0.5.0
- Ny **Inställningssida** (nås via "Inställningar" på framsidan): Mitt namn, **Frågetyper** (kryssrutor: Flervalsfrågor, Sant eller falskt, Flashcards — alla ikryssade från start), "Öva extra på fel" och "Visa tid" flyttade hit. Brödsmulelänk "‹ Start" överst, Spara + Tillbaka nederst. Allt sparas permanent i localStorage (`hur_settings`) tills man ändrar.
- Framsidan bantad: behåller Ämne, Antal, Svårighet och de **två startknapparna** (Starta quiz + Starta flashcards).
- **Frågetypsfiltret styr starten:** Flervalsfrågor/Sant eller falskt avgör vilka typer quizet drar med (bara Sant eller falskt valt slopar 10%-taket så quizet faktiskt blir sant/falskt; fc-kort utesluts alltid ur quiz, även i "blandade").
- **Startknapparna skuggas dynamiskt** efter både ämnet och filtret: en knapp inaktiveras om ämnet saknar den typen ELLER om typen är avbockad i Inställningar. Ämnets typer läses ur etiketten (t.ex. "Ben (MC+TF)" → bara quiz aktiv, "Muskler (FC)" → bara flashcards, "Tentaplugg (MC+FC)" → båda). Uppdateras direkt vid ämnesbyte och filterändring.
- Checkbox-raderna i Inställningar är omjusterade: rutan ligger i linje med etikettens första rad och hjälptext hamnar på egen rad under (gäller alla nuvarande och framtida checkboxar).
- Cachebustrar och APP_VERSION bumpade till 0.5.0.

## 0.4.53
- Statistik per ämne: vid **lika antal försök** rankar nu ämnet med **högst snitt-%** över (tidigare föll lika antal tillbaka på senast spelade). Mest gjorda ämnet ligger fortsatt överst.
- Cachebustrar och APP_VERSION bumpade till 0.4.53.

## 0.4.52
- "Senaste resultaten" och "Bästa resultat" visar nu **total speltid** (m:ss) per resultat, mellan procent och datum, så man ser hur lång tid man behövde. Äldre resultat utan sparad tid visas som "–".
- Highscore-datan i localStorage är orörd; bara ny kolumn (`sr-time` + `formatDuration`) i renderingen.
- Cachebustrar och APP_VERSION bumpade till 0.4.52.

## 0.4.51
- FIX: statistikinnehållets typsnitt var fortfarande för stort. Roten var en CSS-specificitetsbugg — `.stats-list li` (0,1,1) med `font-size: 0.9rem` slog `.stat-row` (0,1,0), så storleken från 0.4.47 (0.78/0.62rem) fick aldrig effekt. Selektorn är nu `.stats-list .stat-row` (0,2,0) som vinner, så statistiken matchar de andra tabellernas storlek.
- Cachebustrar och APP_VERSION bumpade till 0.4.51.

## 0.4.50
- "Bästa resultat" färgar nu procenttexten grön vid klarat (≥ 75 %) och röd vid ej klarat (< 75 %), samma som "Senaste resultaten". Highscore-datan orörd.
- Cachebustrar och APP_VERSION bumpade till 0.4.50.

## 0.4.49
- "Senaste resultaten": procenttexten färgas nu **grön vid klarat (≥ 75 %) och röd vid ej klarat (< 75 %)**, samma tröskel och röda ton (`--error`) som statistikens svaga ämnen. Endast procentsiffrans färg ändras; övriga kolumner orörda.
- Highscore-datan i localStorage är orörd; bara en CSS-klass på `.sr-pct` i `renderScoreList`.
- Cachebustrar och APP_VERSION bumpade till 0.4.49.

## 0.4.48
- Statistik per ämne visar nu bara ämnesnamnet utan förkortningsparentes (t.ex. "Lårben (femur)" → "Lårben"), precis som topplistorna. Resultat med och utan parentes grupperas på samma namn.
- Highscore-/statistikdatan i localStorage är orörd; bara grupperingsnyckeln i `renderStats`.
- Cachebustrar och APP_VERSION bumpade till 0.4.48.

## 0.4.47
- Statistiktabellens typsnitt matchar nu resten av highscore (`.score-row`): 0.78rem på desktop och 0.62rem på mobil (tidigare 0.8/0.66rem), så texten ryms snyggt på mobilskärm.
- Cachebustrar och APP_VERSION bumpade till 0.4.47.

## 0.4.46
- Ny sektion **"Bästa resultat"** i highscore-vyn, under statistikrutan: topp 10 resultat rankade på procent (högst först), med samma kolumner som "Senaste resultaten".
- Vid lika procent (det avrundade som visas) rankar resultatet med **snabbast speltid** över. Resultat utan sparad tid hamnar sist vid lika procent.
- Listan följer samma frågeantals-filter som "Senaste resultaten" och ritas om dynamiskt vid filterbyte och varje gång highscore-vyn öppnas.
- Highscore-datan i localStorage rörs inte; bara ny rendering (`renderBestList`) + återanvänd `.score-row`-CSS.
- Cachebustrar och APP_VERSION bumpade till 0.4.46.

## 0.4.45
- Statistikrutan ("Statistik per ämne") är ombyggd från en plain textrad till prydliga kolumner: **ämne | antal försök | progress-stapel | snitt-% | tid/fråga**. Stapeln speglar snittprocenten så man ser nivån i ögonvrån; snitt-% färgas i appens gröna ton.
- Layouten matchar topplistans `.score-row`-stil (varannan rad tonad, tabular-nums) och är responsiv för mobil (smalare stapel/kolumner under 640px).
- **Svaga ämnen (under 75 % snitt) markeras rött** (stapel + procentsiffra) i samma röda ton som fel svar (`--error`), som en varningssignal om vad som behöver pluggas mer. 75 % och uppåt visas grönt.
- All statistikdata och highscore-datan i localStorage är orörd — bara renderingen i `renderStats` och tillhörande CSS är ändrad.
- Cachebustern för `styles.css` och `app.js` bumpad till 0.4.45.

## 0.4.44
- Topplistan visar nu de **20 senaste resultaten** (nyast överst) i stället för de 20 högsta poängen. Rubriken heter "Senaste resultaten".
- `saveScore` sorterar på datum (nyast först) innan lagringen kapas till 50 — så att de senaste resultaten alltid behålls, inte de högsta. Tidigare kunde ett nytt lågt resultat kastas bort till förmån för gamla höga.
- Highscore-datan i localStorage rörs inte; bara sorterings-/visningslogiken ändrad.
- Cachebustern för `styles.css` och `app.js` bumpad till 0.4.44.

## 0.4.43
- ROTORSAKEN till att topplistan ibland såg tom ut fast highscoren låg kvar i localStorage: `getScores` läste in datan men gjorde sedan migrerings-/städningsskrivningar (`setItem`/`removeItem` av gamla nyckeln) inuti SAMMA try-block. När en sådan skrivning kastade fel (full localStorage på delad github.io-origin, privat läge) fångades felet av catch som returnerade tomt — trots att datan redan var inläst. Nu parsas datan färdigt före varje skrivning, och migrering/städning sker i ett isolerat try/catch så ett skrivfel aldrig kan kasta bort redan inläst data.
- Samma trasiga mönster fixat i `loadFlags` (fråge-flaggor).
- Verifierat med headless Chrome: med blockerade skrivningar (simulerad full localStorage) och data kvar returnerar `getScores` nu datan och topplistan renderas, i stället för att visa tomt.
- Cachebustern för `styles.css` och `app.js` bumpad till 0.4.43.

## 0.4.42
- Versionsetiketten avslöjar gammal cache: app.js bär en inbakad `APP_VERSION` som jämförs mot färska `VERSION`-filen. Kör webbläsaren cachad gammal kod visas "ny version X finns, ladda om sidan" i stället för en etikett som ljuger om vilken kod som faktiskt körs. Detta är roten till att topplistan ibland såg tom ut: cachad kod *före* säkerhetsnätet (0.4.36) kördes, medan versionsetiketten (no-store) ändå visade senaste numret.
- Bevisat med headless Chrome (CDP) att nuvarande renderingskod alltid visar highscoren när data finns — även med icke-matchande filter (säkerhetsnätet) och data under gamla nyckeln `wiil_highscores` (migration). Highscore-datan rörs aldrig av renderingen.
- Cachebustern för `styles.css` och `app.js` bumpad till 0.4.42.

## 0.4.41
- Prydligare topplista: strukturerade kolumner (rang / namn / ämne / poäng / procent / datum) i stället för em-streck-sträng, ämnesnamnet kortas på förkortningsparentesen ("Handen (MC+TF)" → "Handen", endast här).
- Lärdom av 0.4.34: `#scoreList` behåller `overflow-x: auto` som behållare, så en för bred rad scrollar inuti listan i stället för att tänja ut kortet och skjuta statistiken utanför mobilskärmen. Statistiken (`#statsList`) påverkas inte.
- Endast rendering — highscore-datan (`hur_highscores`) läses, skrivs aldrig.
- Cachebustern för `styles.css` och `app.js` bumpad till 0.4.41.

## 0.4.40
- Tog bort diagnostikraden i topplistan. Highscore-datan (`hur_highscores`) rörs inte — renderingen läser bara, skriver aldrig. Säkerhetsnätet från 0.4.36 (visa alla resultat om filtret ger tomt) är kvar, så listan kan inte se falskt tom ut.
- Orsaken till att listan "försvann när diagnostiken togs bort": telefonen körde då cachad kod *före* 0.4.36, där topplistans filter kunde gömma datan. Datan har aldrig varit borta. Gör en hård omladdning på mobilen (eller vänta tills HTML-cachen släpps) för att hämta 0.4.40.
- Cachebustern för `styles.css` och `app.js` bumpad till 0.4.40.

## 0.4.39
- Återinförde diagnostikraden i topplistan, nu ALLTID synlig, för att hitta varför highscoren växlar mellan full och tom mellan laddningar. Visar om datan finns i lagringen, antal poster och om appen körs i hemskärmsläge (separat lagring på iOS).
- Cachebustern för `styles.css` och `app.js` bumpad till 0.4.39.

## 0.4.38
- Tog bort den tillfälliga diagnostikraden i topplistan (behövdes inte längre — highscore-datan var aldrig borta, det var ett filterfel som fixades i 0.4.36). Säkerhetsnätet som visar alla resultat när filtret ger tomt är kvar.
- Cachebustern för `styles.css` och `app.js` bumpad till 0.4.38.

## 0.4.37
- Tillfällig diagnostikrad i topplistan: när listan ser tom ut visas exakt vilka localStorage-nycklar som finns och hur mycket highscore-data webbläsaren faktiskt har, så vi kan se om datan finns kvar eller är borta.
- Cachebustern för `styles.css` och `app.js` bumpad till 0.4.37.

## 0.4.36
- Buggfix: topplistan kunde visas som "tom" om filtervärdet var tomt/ogiltigt trots att data fanns. Nu behandlas tomt filter som "alla", och finns det resultat men filtret ger tomt visas alla i stället för "tomt". Ingen highscore-data raderas av detta — den låg kvar i localStorage hela tiden.
- Cachebustern för `styles.css` och `app.js` bumpad till 0.4.36.

## 0.4.35
- Återställde topplistan till 0.4.33-läget (backade 0.4.34) eftersom 0.4.34 gjorde att statistiken inte visades på mobil. Ingen highscore-data har påverkats — den ligger kvar i localStorage; det var enbart ett renderingsfel.
- Cachebustern för `styles.css` och `app.js` bumpad till 0.4.35.

## 0.4.33
- Topplistan visas nu med mycket mindre typsnitt så att varje post ryms på en rad (radbryts inte). Listan kan scrollas i sidled om en post är extra lång.
- Cachebustern för `styles.css` och `app.js` bumpad till 0.4.33.

## 0.4.32
- "Öva extra på de jag svarar fel på" garanterar nu återkomst i stället för att bara vikta upp frågan. En felsvarad fråga får en "skuld" (antal garanterade återkomster) som sparas i localStorage och överlever "Spela igen", omladdning och webbläsarstängning.
- En felsvarad fråga tvingas garanterat in i kommande vändor (minst de två nästa 10-frågorsvändorna; i längre vändor är den med i själva vändan). Fortsätter man svara fel byggs skulden på (+2, tak 6) så den återkommer ännu fler gånger; rätt svar nollar skulden.
- Cachebustern för `styles.css` och `app.js` bumpad till 0.4.32.

## 0.4.31
- Bytte checkboxtexten "Timer på/av" till "Visa tid".
- Cachebustern för `styles.css` och `app.js` bumpad till 0.4.31.

## 0.4.30
- Tog bort fältet "Tid i sekunder per fråga" och inställningen att ange tidsgräns. Timern räknar nu i stället upp tiden fram till klicket (ingen tidsgräns, ingen auto-markering som fel, ingen automatisk kortvändning).
- Quiz: tiden fram till klicket visas på den svarsknapp man tryckte på (rätt eller fel).
- Flashcards: tiden fram till att man vänder kortet visas på svarssidan (baksidan).
- "Timer på/av"-checkboxen styr om tiden mäts och visas. Den totala speltiden sparas i statistiken som tidigare.
- Cachebustern för `styles.css` och `app.js` bumpad till 0.4.30.

## 0.4.29
- Tog bort den missvisande parentestexten bakom "Timer på/av"-checkboxen.
- Cachebustern för `styles.css` och `app.js` bumpad till 0.4.29.

## 0.4.28
- Checkboxen heter nu "Timer på/av" och är på som standard. Den enda funktionen är att slå av/på timern; resten av timerfunktionen är oförändrad.
- Återställde sekundfältet till originalet ("Tid i sekunder per fråga (0 = ingen tidspress)", standard 0, min 0) – ändringarna i 0.4.27 (omdöpning, standard 20, min 1) var inte önskade.
- Cachebustern för `styles.css` och `app.js` bumpad till 0.4.28.

## 0.4.27
- Buggfix: timern var dold på mobil (`.timer { display:none }` i media-queryn ≤640px) och visades därför aldrig, varken i quiz eller flashcards. Nu syns nedräkningen igen.
- Ny checkbox "Tidsgräns per fråga" bredvid "Öva extra på de jag svarar fel på". Timern är på endast när rutan är ikryssad; sekundfältet anger längden (standard 20 s).
- Cachebustern för `styles.css` och `app.js` bumpad till 0.4.27.

## 0.4.26
- Buggfix: "Spela igen" på resultatsidan startar nu ett nytt quiz direkt (med samma inställningar) i stället för att gå tillbaka till startsidan.
- Cachebustern för `styles.css` och `app.js` bumpad till 0.4.26.

## 0.4.25
- Dolde ämnena "Moho" och "OTIPM" från ämneslistan. De är ATP-teori (ej anatomi) och ska testas på annat sätt; återinförs senare. Datafiler och kod är kvar (optionerna är utkommenterade på sin plats).
- Cachebustern för `styles.css` och `app.js` bumpad till 0.4.25.

## 0.4.24
- Alla dropdowns (inte bara ämne) använder nu samma mindre textstorlek på smala mobilskärmar (≤480px); de var tidigare onödigt stora.
- Förklaringsraden under ämnesväljaren tillåts nu radbrytas korrekt i stället för att tvingas på en rad med horisontell scroll.
- Cachebustern för `styles.css` och `app.js` bumpad till 0.4.24.

## 0.4.23
- Versionsetiketten ("v0.4.xx") hämtar nu `VERSION` med cache-buster och `no-store`, så den alltid visar senaste versionen utan att fastna på en cachad siffra.
- Ämneslistan behålls som vanlig inbyggd lista som tillåts radbrytas (ingen avkortning eftersträvas via egen dropdown).
- Cachebustern för `styles.css` och `app.js` bumpad till 0.4.23.

## 0.4.22
- Ämnesväljaren krymper textstorleken på smala mobilskärmar (≤480px) så att varje ämne ryms på en rad i listan som poppar upp.
- Cachebustern för `styles.css` (och `app.js`) bumpad till 0.4.22.

## 0.4.21
- Ämnet "Handen": all engelska i frågorna ersatt med svenska, lekmannatermer och medicinsk latin. Inga engelska termer kvar i ämnet.
- Bytte bl.a. "Carpal tunnel" → karpaltunneln, "Carpal bones" → karpalbenen, "Ulnar tunnel"/"Guyon canal" → Guyons kanal (canalis ulnaris), "saddle led" → sadelled, "hinge joints" → gångjärnsleder, "condyloid joints" → kondylleder, "Radial/Ulnar artery" → A. radialis/A. ulnaris, "common digital arteries" → aa. digitales palmares communes, "sheaths" → senskidor, "Lumbricals" → Mm. lumbricales, "True/False" → Sant/Falskt, "pulleysystemet" → ringbandssystemet m.fl. (65 fält över ~50 frågor).
- Städade samtidigt trasiga svenska formuleringar i samma frågor ("rörlighaf", "Handledskan", "Handelten", "pekfinger finger").
- Rättade q426: "Trapezoideum är det minsta metacarpal ben" → "Trapezoideum är det minsta benet i distala karpalraden" (os trapezoideum är ett karpalben, inte metakarpalben).
- Konsekvent namngivning av ämnena i rullgardinsmenyn: varje ämne får en suffix som visar vad det duger till — `(MC)` flerval, `(FC)` flashcards, `(TF)` sant/falskt, t.ex. "Handen (MC+TF)", "Olika åldrar (MC+FC)". Tog bort gamla parenteser och ordet "Flashcards" ur namnen.
- Ny förklaringsrad under ämnesväljaren (liten, kursiv, en rad) som förklarar MC/FC/TF.
- Ämnena i menyn sorterade i bokstavsordning, med "Tentaplugg" kvar överst och "Slumpade frågor" kvar sist. Ämnet "Studenters flashcards" omdöpt till "ATP-studenters flashcards (FC)".
- "Slumpade frågor" exkluderar nu frågor från Moho och OTIPM, både i quiz- och flashcardsläget.
- `app.js`-cachebustern bumpad till 0.4.21.

## 0.4.20
- Nytt ämne "Olika åldrar" med 100 flervalsfrågor (4 alternativ per fråga) anpassade för arbetsterapistudenter. Exempel- och scenariobaserade frågor.
- 50 frågor om barnets sensomotoriska utveckling (utvecklingsprinciper cefalokaudal/proximodistal, primitiva reflexer, motoriska milstolpar, grepputveckling, syn/hörsel, objektpermanens, sensorisk integration) och 50 frågor om den åldrande kroppen (sarkopeni, osteoporos, artros, balans och fallrisk, syn/hörsel, hjärt-kärl och andning, kognition, skörhet samt arbetsterapeutiska perspektiv).
- Avsedd referens Aldskogius & Rydqvist (2024 och 2018), kompletterat med etablerad litteratur om barns utveckling och gerontologi för arbetsterapeuter.
- Ny datafil `data/olika_aldrar.json`; ämnet registrerat i `index.html` och `app.js`, placerat direkt efter "Ergonomi".
- `app.js`-cachebustern bumpad till 0.4.20.

## 0.4.19
- Nytt ämne "Ergonomi" med 50 flervalsfrågor (4 alternativ per fråga) anpassade för arbetsterapistudenter på första terminen. Frågorna är exempel- och scenariobaserade så att man lär sig av dem, snarare än rena tentafrågor.
- 25 frågor om postural kontroll (understödsyta, tyngdpunkt, sensoriska system, balansstrategier – fotled/höft/steg, anteciperande vs reaktiv kontroll, uppresnings- och skyddsreaktioner) och 25 frågor om ergonomi (neutral kroppsställning, sittställning, lyftteknik och hävarm, belastningsriskfaktorer, statiskt muskelarbete, antropometri, arbetsplatsanpassning).
- Faktakollat mot akademisk arbetsterapilitteratur: Shumway-Cook & Woollacott "Motor Control", Karen Jacobs "Ergonomics for Therapists" samt Radomski & Latham "Occupational Therapy for Physical Dysfunction".
- Ny datafil `data/ergonomi.json`; ämnet registrerat i `index.html` och `app.js`.
- `app.js`-cachebustern bumpad till 0.4.19.

## 0.4.18
- Nytt ämne "OTIPM Flashcards" (endast flashcards) med 50 grundläggande OTIPM-begrepp som arbetsterapeuter använder. Framsidan visar svensk klinisk term med engelsk term under, baksidan förklaring + exempel.
- Svenska termer faktakollade mot svensk arbetsterapilitteratur (Fisher & Nyman: OTIPM, utgiven av Förbundet Sveriges Arbetsterapeuter, m.fl.). Justerade mot OTIPM-standard: "Therapeutic use of self" → "Terapeutisk användning av jaget", "Occupational performance analysis" → "Utförandeanalys", "Occupational performance context" → "Utförandesammanhang (aktivitetskontext)".
- Inkluderar OTIPM:s fyra interventionsmodeller: kompensatorisk modell, pedagogisk modell, modell för aktivitetsträning samt modell för förbättring av personliga faktorer och kroppsfunktioner.
- Ny datafil `data/otipm_flashcards.json`; ämnet registrerat i `index.html` och `app.js`.
- `app.js`-cachebustern bumpad till 0.4.18.

## 0.4.17
- Nytt ämne "Moho Flashcards" (endast flashcards) med 52 MOHO-begrepp. Framsidan visar svensk term med engelsk term under, baksidan visar förklaring och exempel.
- Ny datafil `data/moho_flashcards.json`; ämnet registrerat i `index.html` och `app.js`.
- `app.js`-cachebustern bumpad till 0.4.17.

## 0.4.16
- Tydligare bekräftelse när man rensar topplistan: "Rensa topplista?" ersatt med "Är du säker? Hela topplistan och statistiken raderas permanent och kan inte återställas." så att man inte råkar radera av misstag.
- `app.js`-cachebustern bumpad till 0.4.16.

## 0.4.15
- Statistiken per ämne i topplistan visar nu även genomsnittlig tid per fråga (t.ex. "ca 8 s/fråga"). Tiden mäts alltid när man kör ett quiz — från start till sista svaret — oavsett om frågetimern är på eller av, och sparas (`durationMs`) med varje resultat.
- Tiden räknas bara på resultat som har en sparad speltid, så äldre resultat (utan tidsdata) påverkar inte snittet och saknar tidsdelen i statistiken.
- `app.js`-cachebustern bumpad till 0.4.15.

## 0.4.14
- Topplistan visar nu vilket ämne varje resultat gäller (t.ex. "Ben", "Muskler", "Slumpade frågor"). Ämnet sparas tillsammans med resultatet när quizet är klart. Äldre resultat utan sparat ämne visas som "Okänt ämne".
- Nytt filter högst upp i topplistan: välj "Alla antal frågor" eller ett specifikt antal (10/20/50/100 osv) så att resultat från olika quizlängder inte blandas i samma lista. Alternativen byggs dynamiskt utifrån de frågeantal som faktiskt finns sparade.
- Ny statistik längst ner på topplistesidan: per ämne visas hur många gånger man testat sig (försök) och det genomsnittliga resultatet i procent, sorterat efter flest försök.
- `app.js`- och `styles.css`-cachebustrar bumpade till 0.4.14.

## 0.4.13
- Highscore sparas nu automatiskt när quizet är klart — ingen "Spara"-knapp behövs längre. Namnet hämtas från "Mitt namn" på startsidan. Resultatskärmen bekräftar med "Resultatet sparades i topplistan".
- "Spara"-knappen på resultatskärmen ersatt med en "Avsluta"-knapp som går tillbaka till startsidan. Det numera överflödiga "Spara som"-fältet är borttaget.
- `app.js`-cachebustern bumpad till 0.4.13.

## 0.4.12
- Ny funktion "Öva extra på de jag svarar fel på" (checkbox på startsidan, gäller endast quiz, ej flashcards). När den är på vägs frågor man senast svarat fel på upp i quizurvalet så de slumpas fram ca 50% oftare (vikt 1.5 via viktad sampling utan återläggning). Helt dynamiskt: så fort man svarar rätt på en fråga tas den bort ur listan och behandlas som vilken annan fråga som helst. Tiden ut räknas som fel.
- Spårningen är lokal per webbläsare/enhet (`localStorage`-nyckel `hur_wrong_questions`) och uppdateras oavsett om checkboxen är på — checkboxen styr bara om viktningen tillämpas vid urvalet. Skrivfel (t.ex. privat läge på iPhone) hanteras tyst med fallback i minnet, som highscore.
- `app.js`- och `styles.css`-cachebustrar bumpade till 0.4.12.

## 0.4.11
- Highscore (iPhone): fixar att topplistan blev tom på iPhone. I privat läge (och vid lagringskvot) kastar `localStorage.setItem` ett `QuotaExceededError`, och `saveScore()` saknade felhantering — hela spar-funktionen avbröts tyst innan topplistan hann visas, så inget sparades och ingen varning gavs. Nu fångas felet: resultatet behålls i en minnes-fallback för den pågående sessionen så topplistan visas korrekt, och en engångsvarning förklarar att resultat inte kan sparas permanent i privat läge. Vanligt (icke-privat) läge sparar permanent som förut. Verifierat på alla 9 quizämnen.
- `app.js`-cachebustern bumpad till 0.4.11 så den uppdaterade koden hämtas.

## 0.4.10
- Muskler Flashcards: återställer extrinsisk-märkningen på supraspinatus, deltoideus, biceps brachii och triceps brachii. De togs felaktigt bort i 0.4.6 — källistan (Muskellista VT26) stämde: extrinsisk/intrinsisk gäller hela övre extremiteten (extrinsisk = muskelbuken utanför handen, intrinsisk = helt inne i handen). Nu 87 kort, 16 extrinsisk/intrinsisk-kort.
- Begreppskortet för "Extrinsisk muskel" omformulerat så det stämmer med den bredare definitionen ("muskelbuken ligger utanför handen, ursprung proximalt") istället för den tidigare för snäva "verkar på handen via långa senor".

## 0.4.9
- Flashcards (iOS/WebKit): fixar att svaret blinkade till vid avslöjandet på iPhone. Orsaken var `opacity`-övergången med `0s` varaktighet — WebKit behandlar det som "ingen övergång" och byter opacity direkt vid t=0, så svaret tändes medan frågan fortfarande syntes. Opacity har nu en riktig varaktighet (0.25s) och sidorna staggas: frågan tonar ut under flippens första halva, svaret tonar in under andra halvan. Vid mittpunkten är kortet kant-mot-kant och tomt → ingen dubbeltext.

## 0.4.8
- Flashcards: backar `will-change` och intoningsanimationen från 0.4.7 — de fick svaret att blinka till vid avslöjandet (tryck på frågan) på mobil, eftersom opacity-bytet mellan sidorna komponerades om. Avslöjande-flippen är åter i sitt ursprungliga, blinkfria skick.
- Den blinkfria fixen för kortbyte (rent snäpp till framsidan medan baksidan är dold) är kvar.

## 0.4.7
- Flashcards (mobil): fixar att nästa korts svar blinkade till vid kortbyte. Baksidan doldes tidigare bara via en fördröjd opacity-övergång medan svaret skrevs in på en timer — opålitligt på mobilens kompositlager. Nu snäpper kortet till framsidan utan animation och fyller i båda sidorna medan baksidan är garanterat dold, så inget kan skymta.
- Flip-tillbaka-animationen ersatt med en mjuk intoning av nästa kort (`fcCardEnter`). 3D-flippen vid avslöjandet är oförändrad. `will-change` på fram-/baksida ger jämnare flip på mobil.
- `app.js` får cache-buster (`?v`) så uppdaterad JS hämtas; `styles.css`-bustern bumpad till 0.4.7.

## 0.4.6
- Nytt flashcard-ämne "Muskler Flashcards" (83 kort) byggt från muskellistan VT26. Varje muskel ger upp till fyra korttyper där det är relevant: ursprung & fäste, funktion, innervation och extrinsisk/intrinsisk. Plus två allmänna begreppskort (vad extrinsisk resp. intrinsisk muskel innebär).
- Flashcard-framsidan stödjer nu en kursiv indikationsrad under namnet (t.ex. "(Vad är dess funktion?)") via nytt `sub`-fält + `.fc-question-sub`. Svarssidan renderar radbrytningar (`white-space: pre-line`).
- Extrinsisk/intrinsisk-märkning gäller endast handens muskler. Supraspinatus, deltoideus, biceps och triceps brachii fick INTE den märkningen trots att källistan felaktigt angav "EXTRINSICMUSKEL" — begreppet gäller bara muskler som verkar på handen.
- Källa till sanning: `scripts/generate_muskler_flashcards.py` genererar `data/muskler_flashcards.json`.

## 0.4.5
- SEO (canonical): startsidans `canonical` och `og:url` pekar nu på rot-URL:en `https://norrtou.github.io/anatomiquiz/` istället för `.../index.html`. GitHub Pages serverar startsidan på båda adresserna och Google kanoniserar index-sidor till rot-URL:en — den tidigare krocken gav "annan canonical än användarens" i Search Console.
- `sitemap.xml`: startsidans `<loc>` ändrad till samma rot-URL (matchar canonical + manifestets `start_url`).
- Interna länkar till startsidan i `info.html` och `medicinskordlista.html` (brödsmula + tillbaka-knapp) går från `index.html` till `./` så att alla länksignaler konsolideras på rot-URL:en.

## 0.4.4
- Startsidan: flyttar "Om Anatomiquiz"-introtexten längst ned på sidan med egen `<h2>`-rubrik. Döljs automatiskt under pågående quiz/flashcards via CSS (`#setup.hidden ~ .intro`) — ingen JS-ändring behövs.

## 0.4.3
- Startsidan (SEO): ny beskrivande introtext under taglinen med ämnen och målgrupp samt intern länk till ordlistan — ger sökmotorer unikt, indexerbart innehåll (tidigare nästan bara formulärkontroller).
- Tillgänglighet: fixar trasig ARIA-referens på startsidan (`aria-labelledby="setupHeading"` saknade målelement) genom en sr-only `<h2>`.
- info.html: rättar rubrikhierarkin — "Antal frågor" och "Versionshistorik" är nu `<h2>` (hoppade tidigare h1→h3).
- PWA: ny `manifest.json` (namn, ikoner, temafärg, standalone) länkad på alla sidor + genererade ikoner 192×192 och 512×512. Ger "Lägg till på hemskärmen" och moderna mobil-/SEO-signaler.

## 0.4.2
- Medicinsk ordlista (SEO + tillgänglighet): hela ordlistan förrenderas nu statiskt i HTML — alla 1 081 poster är crawlbara och indexerbara utan JavaScript (tidigare syntes bara 195 i no-JS-fallbacken).
- Nytt byggskript `scripts/generate_glossary.py` är enda källan till sanning: genererar statiskt `<dl>`-innehåll, JSON-LD `DefinedTermSet` med samtliga termer (`hasDefinedTerm`) och uppdaterar termantalet i titel/meta/Open Graph/Twitter.
- Korrekt termantal (1081) i alla metataggar, titel och strukturerad data — tidigare felaktigt "195".
- Semantisk markup: ordlistan renderas som `<dl>/<dt>/<dd>` med stabila ankar-id per term (`#term-...`) och `lang="en"` på engelska termer. `glossary.js` renderar byte-identisk markup.
- `glossary.js` skriver inte längre över det förrenderade innehållet om datahämtningen misslyckas (graceful degradation).
- Favikon: lägger till SVG-favikon och `apple-touch-icon` på alla sidor.
- Rättar `VERSION` (låg felaktigt kvar på 0.3.98).

## 0.4.1
- Medicinsk ordbok: alla 1 081 poster märkta med ordklass — (subst.), (adj.), (verb), (prefix) eller (adv.) — direkt i beskrivningen före Sv:/Eng:.

## 0.4.0
- Medicinsk ordbok: 886 nya poster tillagda från KI:s anatomiska termförteckning; totalt 1081 poster (A–Ö).

## 0.3.99
- Infosidan: byter rubrik "Frågestatistik" till "Antal frågor".

## 0.3.98
- Infosidan: Studenters flashcards visas dynamiskt i frågestatistiken, separat under quiztotalen med egna kolumnmarkeringar.

## 0.3.97
- Studenters flashcards: tar bort examensrelikter — instruktionsprefix ("Skriv ut de latinska namnen för...", "Skriv följande begrepp på latin...", "Välj rätt svar" m.fl.) och tentanumrering borttagna. 54 fält åtgärdade.

## 0.3.96
- Studenters flashcards: tar bort poängreferenser som (1p), (2p), (6p) m.fl. — reliker från tentafrågor. 99 fält åtgärdade.

## 0.3.95
- Studenters flashcards: ersätter alla PUA-tecken (FontAwesome-symboler som renderas som rektanglar) med radbrytningar. 103 fält åtgärdade.

## 0.3.94
- Studenters flashcards: tar bort 31 omvändningskort där en lång faktabeskrivning stod som fråga — alla hade redan ett partnerkort med rätt riktning (term → beskrivning). 806 kort.

## 0.3.93
- Studenters flashcards: fler utbytta fråga/svar fixade — 3 dubbletter med frågan på fel sida borttagna, kvarlämnad chatbot-avslutning i ffc_904 städad. 837 kort.

## 0.3.92
- Studenters flashcards: rätta utbytta fråga/svar — 4 inverterade dubbletter borttagna, 5 innehållsfel fixade (felaktiga svar på flervalsfrågor, trasig flervalsuppgift omformulerad). 840 kort.

## 0.3.91
- Studenters flashcards: andra korrekturrundan — 85 rättningar. Latinska böjningsformer (cubitii→cubiti, Spina Scapula→Spina scapulae, caput glenohumerale→caput humeri, Os ischi→Os ischii), stavfel, saknade mellanslag vid parenteser, saknade radbrytningar i listor, dubbla mellanslag, fel genus (den/det), saknade punkter, anatomisk felaktighet (atlas-kortet).

## 0.3.90
- Ta bort rubriken "Skapa ett quiz åt mig".

## 0.3.89
- Flashcard klart-vy: tre knappar på rad — "Pröva igen" (samma kort), "Nya kort" (ny omgång), "Avsluta".

## 0.3.88
- Studenters flashcards: raderar 31 bildkort där frågan är obegriplig utan bild. Städar bort "(se bild)"-noter ur kort som i övrigt har fullgott innehåll. 844 kort kvar.

## 0.3.87
- Studenters flashcards flyttas till plats 2 i ämneslistan.

## 0.3.86
- Döper om ämnet "Funktionell Anatomi FC" → "Studenters flashcards" (filnamn, topic-fält, source-fält, UI).

## 0.3.85
- Funktionell Anatomi FC: korrektur och kvalitetskontroll av alla 875 kort — stavfel, grammatik, latinska termer, felmatchade par, bildkort utan bild raderade, triple-quotes rensade.

## 0.3.84
- Nytt ämne: Funktionell Anatomi FC — 942 flashcards importerade från externa CSV-filer (Noji-export).

## 0.3.83
- Flashcard: svarsfördröjning 800→1200ms.

## 0.3.82
- Flashcard: fördröjning för svarspopulering 500ms → 800ms för att undvika att svaret skymtas.

## 0.3.81
- Flashcard: återställer transform på .fc-front (behövs för animationstiming) — grön bakgrund via .fc-card istället, .fc-front transparent.

## 0.3.80
- Info-sidan: rubrik "Info" borttagen.

## 0.3.79
- Frågestatistik: procentsatser borttagna ur tabellen.

## 0.3.78
- Info-sidan: dynamisk frågestatistik-tabell (ämne, totalt, Normal/Svår) hämtad direkt från JSON-filerna.

## 0.3.77
- fc-hint: 0.64rem (20% mindre) och kursiv stil.

## 0.3.76
- Tar bort #flashcards bakgrundsfärg — sektionen ska vara vit, bara kortet (#bbf7d0) ska vara grönt.

## 0.3.75
- CSS-länk: ?v=0.3.75 cache-busting query-parameter — tvingar webbläsare att ladda ny CSS istället för cachad version.

## 0.3.74
- Flashcard framsida: tar bort transform:rotateY(0deg) från viloläget — no-op-3D-transform skapade compositing-lager som blockerade background-color på mobil.

## 0.3.73
- Flashcard: grön bakgrund på .fc-card istället för .fc-front — 3D-transform på fc-front blockerade bakgrundsrendering på mobil.

## 0.3.72
- Flashcard framsida: background #bbf7d0 — kortet självt är grönt, inte bara sektionen.

## 0.3.71
- Flashcard-sektionen (#flashcards): background #d1fae5 — åsidosätter .card:s vita bakgrund direkt på sektionsnivå.

## 0.3.70
- Flashcard framsida: #d1fae5 (tydligare grön) — #f0fdf4 var för nära vitt för att synas på mobilskärmar.

## 0.3.69
- Flashcard framsida: solid #f0fdf4 istället för gradient — gradient renderas inte av iOS Safari i 3D-transformkontext.

## 0.3.68
- Flashcard framsida: grön bakgrundsgradient (#f0fdf4 → #ecfdf5) istället för vitt — syns mot den gröna sidabakgrunden.

## 0.3.67
- Primärknapparna: display:grid grid-template-columns:1fr 1fr — CSS grid påverkas inte av flex-overrides som bröt iOS WebKit.

## 0.3.66
- Primärknapparna: min-width: 0 tillagd — iOS WebKit låter annars flex-items behålla sin textbredd som minimum.

## 0.3.65
- Primärknapparna: flex: 1 !important i mobilmedian — identisk med sekundärknapparna.

## 0.3.64
- Primärknapparna: identisk flex-logik som sekundärknapparna. width: 100% borttagen från btn-start.

## 0.3.63
- Knappar: display:grid grid-template-columns:1fr 1fr — inga overrides behövs.
- Animation: opacity-teknik istället för backface-visibility, fungerar i alla browsers.

## 0.3.62
- Flashcard-animation: per-element-perspective istället för preserve-3d — fungerar på iOS Safari med border-radius.
- Primärknapparna: white-space: nowrap och mindre font på mobil förhindrar radbrytning.

## 0.3.61
- Flashcard-animation: webkit-prefix tillagda på alla 3D-transforms och perspective så animationen fungerar på mobil.

## 0.3.60
- Mobil: de två gröna startknapparna delar nu alltid samma rad.

## 0.3.59
- Flashcards: svaret töms innan flip-back-animationen startar så att nästa korts svar inte skymtas vid övergången.

## 0.3.58
- Flashcards: andra klicket på kortet går nu vidare till nästa kort. Ledtext "Tryck för nästa kort" visas på baksidan.

## 0.3.57
- Ny funktion: Flashcards. Välj ämne precis som i quizet — framsidan visar frågan, baksidan svaret. Klicka kortet för att flippa. Tidsinställning: timern flippar automatiskt och nästa kort visas efter 4 sekunder. Knappen "Starta flashcards" ligger bredvid "Starta quiz" på startsidan.

## 0.3.56
- Tagline på startsidan ändrad till "Öva på funktionell anatomi med quiz och flashcards".

## 0.3.55
- Favicon uppdaterad till skeletthand-ikon (64x64 PNG).

## 0.3.54
- Favicon tillagd (ben-ikon i SVG) på alla sidor.
- Ordlistans 195 termer inbäddade i noscript-block för sökmotorsynlighet.
- Ordlistesidan: preload, theme-color och color-scheme tillagda. Stavfel i keywords rättat.
- Ordlistesidan och info-sidan: OG- och Twitter-bildtexter korrigerade till sidspecifika texter.
- Info-sidan: keywords och fullständig robots-tagg tillagda. H1 ändrad till "Om Anatomiquiz".

## 0.3.53
- Startsidan: canonical och og:url uppdaterade till explicit adress, konsekvent med sitemapen.

## 0.3.52
- Sitemap: startsidan listad med explicit adress, konsekvent med övriga sidor.

## 0.3.51
- Strukturerad data: BreadcrumbList-URLs ändrade till absoluta adresser på ordliste- och info-sidan.

## 0.3.50
- Google Search Console-verifieringstaggen tillagd.

## 0.3.49
- Sitemap och robots.txt tillagda för sökmotorer. Alla sidor länkar till sitemapen.

## 0.3.48
- Open Graph komplett på alla sidor: og:url, og:image (1518x864), bildmått och alt-text aktiverade. Canonical-URL satt. Info-sidan fick Twitter Card. Bildfil tillagd i projektet.

## 0.3.47
- Medicinska ordlistan: engelska termen efter "Eng:" visas nu kursivt.

## 0.3.46
- Versionshistorik: alla filnamn med ändelser borttagna ur alla poster.

## 0.3.45
- Versionshistorik: alla poster renskrives som ren text utan filnamn, HTML-taggar eller teknisk notation som mobilwebbläsare auto-länkar.

## 0.3.44
- Info-sidan: HTML-tecken i ändringsloggen escapas nu innan de renderas.

## 0.3.43
- sr-only-klass definierad i stilmallen (saknades — skärmläsar-labels syntes som vanlig text).
- Ordlistesidan: redundant sökrubrik borttagen.

## 0.3.42
- Info separerad till egen sida med SEO och brödsmulor — samma struktur som ordlistesidan.
- Changelog-logik extraherad till separat skriptfil.

## 0.3.41
- Brödsmula ordlistesidan (mobil): alla länktillstånd täckta, tap-highlight borttagen.

## 0.3.40
- Brödsmula på ordlistesidan: specificitet ökad för att slå webbläsarens standardfärg på ankarlänkar.

## 0.3.39
- Ordlista-knappen: ändrad till knapp-element för att eliminera automatiskt understreck.

## 0.3.38
- Ordlistesidan: brödsmulorna flyttade in i kortet — samma placering som på info-sidan.

## 0.3.37
- Brödsmuleknappar: OS-standardstyling nollställd för enhetlig design på iOS och Android.

## 0.3.36
- Ordlista-knappen: understreck borttaget med !important.

## 0.3.35
- Info-sidan: tillbakaknapp överst ersatt med brödsmula.
- Brödsmule-CSS centraliserad och dubbletter borttagna.

## 0.3.34
- Ordlistesidan: tillbakaknapp tillagd högst upp i kortet.

## 0.3.33
- Ordlista-knappen (mobil): understreck borttaget för alla länktillstånd.

## 0.3.32
- Info-sidan: tillbakaknapp tillagd högst upp, precis som den befintliga längst ned.

## 0.3.31
- Ordlista-knappen: understreck borttaget.

## 0.3.30
- Startsidan: komplett SEO-uppdatering med Open Graph, Twitter Card och strukturerad data.
- Webbläsartema, preload och defer tillagt.

## 0.3.29
- Ordlistan separerad till egen sida med full SEO, brödsmulor och termräknare.
- Ordlistedata flyttad till separat JSON-fil (195 termer).
- Ordliste-logik och stilar extraherade till egna filer.

## 0.3.28
- Ordlistan: etymologinot tillagd på alla ~185 poster med latinskt/grekiskt ursprungsord och bokstavlig betydelse (t.ex. "acetabulum = ättikskål", "musculus = liten mus", "phalanx = stridsformation").

## 0.3.27
- Info-, Ordlista- och Topplista-knapparna täcker nu hela radens bredd på mobil, liksom Starta quiz-knappen ovan.

## 0.3.26
- Ordlistan berikad: alla ~185 poster kompletterade med svenska synonymer (sv:), engelska termer (eng:), lekmannauttryck och alternativa stavningar — t.ex. falanger/falang för phalanges, diafragma för diaphragma, likvor för liquor cerebrospinalis, RBC/WBC, Hb m.fl. Sökfunktionen täcker hela definitionen.

## 0.3.25
- Ordlistan utökad med 24 nya termer: kroppspositioner (anatomisk position, ryggläge, bukläge, sidoläge, Fowlerläge, Trendelenburgläge, omvänt Trendelenburgläge, litotomiläge, simsläge), rörelsetermer (inåtrotation, utåtrotation, deviation, anteversion, retroversion, protrusion, retrusion), riktningstermer (central, perifer, intermediär, internus, externus, obliqt plan) och ytor (parietal, visceral).

## 0.3.24
- Faktakontroll ordlistan: stavfelen i Fossa och Synovialis rättade.
- Ordlistan: textstorlek höjd, samma som info-sidan.

## 0.3.23
- Ny sida: Ordlista med 140 latinska och medicinska termer som används i quizet, sorterade alfabetiskt med korta förklaringar. Sökfunktion filtrerar direkt på term och förklaring. Nås via ny knapp på startsidan. Knapplayouten omstrukturerades: "Starta quiz" är nu en tydlig primärknapp ovanför Info, Ordlista och Topplista.

## 0.3.22
- Faktakontroll av riktningar: 5 rättningar — sagittalplan/frontalplan (q224, q225), adduktion/depression (q399), Superior/Kaudal som distraktor (q446), stavfel i frågetext (q214).

## 0.3.21
- Döpte om "Blandade frågor" till "Slumpade frågor" och flyttade det sist i ämnesmenyn. Slumpade frågor hämtar nu automatiskt från alla aktiva ämnen inklusive Neurologi och Blodomloppet.

## 0.3.20
- Versionsnummer i headern laddas nu dynamiskt istället för att vara hårdkodat.

## 0.3.19
- Lade till Blodomloppet som aktivt ämne: 100 sant/falskt-frågor (Normal svårighet). Täcker systemkretsloppet, lungkretsloppet, hjärtanatomi, retledningssystemet, kärltyper, blodkomponenter och fysiologi. Språkkorrigering: "bakflöde" korrigerat till "backflöde".

## 0.3.18
- Lade till Neurologi som aktivt ämne: 120 sant/falskt-frågor (Normal svårighet). Täcker CNS/PNS-struktur, neuron, myelin, synapser, signalsubstanser, aktionspotential, reflexer, hjärnstrukturer, ledning, reception, regeneration, neuroplasticitet, utveckling och åldrande.

## 0.3.17
- Fixade Info-sida: ändringsloggen visar nu alla versioner med fullständigt innehåll och sidan scrollas naturligt.

## 0.3.16
- Lade till Info-sida med appbeskrivning, länk till Norrtou Creations på GitHub och dynamisk ändringslogg. Info-knapp tillagd på framsidan.

## 0.3.15
- Faktakontroll av alla Normal-frågor om muskler: 11 rättningar — fabricerade muskelnamn borttagna ur distraktorer och ersatta med etablerade svenska anatomiska termer. Alla korrekta svar bekräftade faktamässigt korrekta.

## 0.3.14
- Kompletterade muskelfrågorna med 73 nya frågor (Normal svårighet) baserade på kurslistan: ursprung, fäste, klassificering och funktion. Totalt 273 frågor om muskler.

## 0.3.13
- Tentaplugg är nu förstaval i ämnesmenyn.

## 0.3.12
- Kvalitetsgranskning av riktningsfrågor: 9 rättningar — faktafel (Hörseln→Örat), stavfel (drejer→vrider), felaktiga distraktorer och inkonsekvent stavning av Dorsalflexion.

## 0.3.11
- Kvalitetsgranskning av muskelfrågor: 8 rättningar — duplikat-ID, inkompletta meningar och grammatikfel åtgärdade.

## 0.3.10
- Borttagen mening om Handen och svårighet från ingresstexten på framsidan.

## 0.3.9
- Kvalitetsgranskning av benfrågor: 56 rättningar — stavfel i frågetext, faktafel, grammatik och felaktigt kategoriserade frågor åtgärdade.
- Fixade bugg i Tentaplugg där ämnet inte gick att starta.

## 0.3.8
- Ändrade menytext från "Studier (tentor)" till "Tentaplugg".

## 0.3.7
- Bytte namn på ämnet Studier till Tentaplugg och uppdaterade alla referenser.

## 0.3.6
- Kvalitetsgranskning av Studier-frågorna: stavfel, grammatik och parentesformat som avslöjade korrekta svar åtgärdade (46 frågor). Bekräftade 59 sant/falskt-frågor i ämnet.

## 0.3.5
- Utökade "Studier (tentor)" med 148 nya frågor (HT25 omtenta, VT20, VT21, HT22) — totalt 353 frågor i ämnet.

## 0.3.4
- Lagt till nytt ämne "Studier (tentor)" med 205 frågor baserade på ATPB14 ordinarie tentor (HT25 och VT24). Täcker neurologi, osteologi, fysiologi, kardiologi, leder, muskler, ergonomi och åldrande.

## 0.3.3
- Fixade versionsvisning i rubriken - versionen visas nu synligt till höger om "Anatomiquiz" på både dator och mobil.

## 0.3.2
- Lagt till alla ämnen (neurologi, blodomloppet) i "Blandade frågor" och aktiverat Hard-svårighet för relevanta ämnen.

## 0.3.1
- Flyttat "Medicinsk terminologi" till position 2 i ämnes-listan för bättre synlighet.

## 0.3.0
- Skapat nytt ämne "Medicinsk terminologi" med 500 MC-frågor baserade på 133 medicinska termer (latin/grekiska). Blandad mix av svenska→latin och latin→svenska frågor med 4 alternativ vardera.
