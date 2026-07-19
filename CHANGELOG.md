# CHANGELOG - Anatomiquiz

## 0.9.167
- **Finstilt rad under utbildningsväljaren:** "Material baserat på officiella läroplaner. ”Allmänt” innehåller slumpmässigt hämtade frågor från alla utbildningar och kan därför variera i svårighetsgrad." Nytt `<p id="educationNote" class="topic-legend">` i `index.html`, kopplat till `#education` via `aria-describedby`. Raden står kvar för **alla** utbildningar – den är ingen Allmänt-specifik notis och ska inte döljas.
- **Allmänts linser heter nu "Blandat – …"** i ämnesväljaren: *Blandat – alla utbildningar*, *– bål & inre organ*, *– cellen, vävnaden & histologi*, *– hormoner, biokemi & ämnesomsättning*, *– medicinsk terminologi & latin*, *– nedre extremitet & bäcken*, *– nervsystemet & sinnesorganen*, *– övre extremitet*. Prefixet gör synligt i dropdownen att frågorna hämtas tvärs utbildningarna. Farmakologi är ett vanligt ämne med egna frågor och bär därför inte prefixet – det ligger nu sist, eftersom Allmänt står i ren bokstavsordning. `value`-attributen (`lins_*`) är oförändrade, så sparade topplistor följer med.
- **Båda finstilta raderna mindre:** `.topic-legend` 0.9 → 0.75 rem (14,4 → 12 px), och mobilregeln 0.62 → 0.56 rem (9,9 → 9,0 px). Gäller både den nya noten och MC/FC/TF-förklaringen under ämnesväljaren.
- **Buggfix: `.hidden` gjorde ingenting på legend-raden.** Appen har ingen generisk `.hidden`-regel – varje komponent bär sin egen (`.card.hidden`, `.case-card.hidden` …). `el('topicLegend')?.classList.toggle('hidden', …)` i `updateTopicOptions()` har därför varit en tyst nullhandling: MC/FC/TF-förklaringen dolde sig aldrig när en utbildning saknar ämnen. Ny regel `.topic-legend.hidden { display: none }` i `css/styles.css`.
- **Verifierat i headless Chrome:** noten syns vid start och står kvar vid byte till Sjuksköterska och Läkare, quiz startar fortfarande i `lins_alla`, noll konsolfel. Mobilvy 390 px: noten tre rader, MC/FC/TF-raden två, ingen horisontell scroll.
- VERSION/APP_VERSION/cachebusters → 0.9.167. `css/styles.css?v=` bumpad i både `index.html` (0.9.145) och `info.html` (0.9.144) – utan det får återvändande besökare den nya HTML:en men gammal CSS, och noten skulle synas för alla utbildningar.

## 0.9.166
- **Allmänt har fått sina sju tvärgående linser + slumpval över alla utbildningar** – planen i `UTBILDNINGAR_REGLER.md` är därmed byggd. Ämnena är *Bål & inre organ*, *Cellen, vävnaden & histologi*, *Hormoner, biokemi & ämnesomsättning*, *Medicinsk terminologi & latin*, *Nedre extremitet & bäcken*, *Nervsystemet & sinnesorganen*, *Övre extremitet* samt *Slumpade frågor – alla utbildningar*. Farmakologi (FC) ligger kvar oförändrat.
- **Inga nya frågor och inga nya datafiler.** En lins har inget eget innehåll: den laddar de utbildningsfiler den pekar på och plockar ur dem genom att matcha ett mönster mot frågans `topic`-nyckel. `optiker_synfysiologi`, `ssk_nervsystemet`, `nervsystemet_synaps` och `lakare_neuroanatomi` hamnar alltså i samma lins. En lins som pekar på en utbildning som byggs ut växer automatiskt.
- **Ny tabell `ALLMANT_LENSES` i `js/app.js`** (lins → filsökvägar + topic-regex), plus hjälparna `allEducationQuestionPaths()` och `lensPaths()`. `startQuiz()` testar linserna FÖRE `blandade`-grenen och filtrerar sedan på linsens regex i stället för ämneskedjan. `index.html` bär bara de åtta etiketterna – all logik ligger i tabellen.
- **`blandade_*`-mekaniken gick inte att återanvända**, som planen förutsåg: den samlar filer ur `#topic`, som redan är filtrerad på vald utbildning. Slumpvalet `lins_alla` läser i stället hela `allTopicOptions` (den ofiltrerade listan) och plockar där MC/TF-ämnenas filer – nya ämnen kommer med utan underhåll. Rena flashcard-ämnen (FC) exkluderas.
- **Uppmätta pooler:** terminologi 1 799, cell/vävnad 724, nervsystemet 2 246, hormoner/biokemi 1 309, övre extremitet 1 344, nedre extremitet 663, bål & inre organ 3 156, alla utbildningar 14 851. Sju av åtta landar på planens uppskattning; bål blev större eftersom hjärta/kärl, blod/immun, andning, buk/njure och thorax alla ryms där. Linserna får överlappa varandra, och dubbletter mellan utbildningar är designen – ingen deduplicering har gjorts.
- **Verifierat i webbläsare, inte bara statiskt.** Headless Chrome: quiz startat i alla åtta Allmänt-ämnen – samtliga ger frågor ur rätt lins med noll konsolfel. Övre extremitet-linsen tar även med bildfrågorna (14 av 100 i ett urval) och laddar bildregistret. Regressionskontroll: `blandade_sjukskoterska` drar fortfarande bara sjuksköterskeämnen, enskilt ämne (`ssk_huden`) filtrerar exakt, och topplistan sätter ALM på linserna men SSK/ATP på de gamla valen.
- `UTBILDNINGAR_REGLER.md` uppdaterad: avsnittet är BYGGT i stället för PLANERAT, tabellen visar plan mot uppmätt pool, och två nya regler – `lins_`-prefixet får aldrig krocka med `blandade`, och linserna ska inte in i `js/info.js` statistiklista (de har inga egna frågor och skulle dubbelräkna korpusen).
- VERSION/APP_VERSION/index.html- och info.html-cachebuster → 0.9.166. **Krävs**: gammal cachad `app.js` känner inte `ALLMANT_LENSES` och skulle ge "Inga frågor matchar urvalet" på varje lins.

## 0.9.165
- **Svårighetsgrad är borttaget som begrepp ur hela appen.** Vad som är "svårt" är godtyckligt inom en utbildning, så alla frågor behandlas nu lika. Väljaren `#difficulty` (Blandat/Normal/Svår) är borttagen ur `index.html`, och all filtreringslogik är utriven ur `js/app.js`: `topicsWithHardQuestions`, hela `updateDifficultyOptions()` med sina fyra anropsplatser, samt svårighetsfiltret i både quiz- och flashcardvägen. Netto −68 rader i `app.js`.
- **248 frågor märkta `Hard` omskrivna till `Normal`** – `data/handen.json` (48), `data/muskler.json` (100), `data/riktningar.json` (100). Samtliga låg i arbetsterapeut; ingen annan utbildning hade en enda `Hard`-fråga. Fältet `"difficulty": "Normal"` ligger kvar i datafilerna men läses inte längre av appen. Frågeantalen är oförändrade (487/273/543).
- **Statistiktabellen i `js/info.js` hopslagen till Ämne + Antal.** Kolumnerna Normal/Svår hade blivit meningslösa när allt är Normal. `countCards()` returnerar bara `{total}`, och den nu oanvända CSS-regeln `.stats-diff` är borttagen ur `css/styles.css`.
- **Tre besökartexter som utlovade svårighetsval omskrivna:** startsidans beskrivning ("Du väljer antal frågor och svårighetsgrad" → "Du väljer antal frågor"), kunskapsbankens quizkort, och `info.html` som listade "ytterligare svårighetsnivåer" bland planerade tillägg.
- **Verifierat i webbläsare, inte bara statiskt.** Quiz startat i headless Chrome för alla tre ombyggda ämnen (Handen, Muskler, Lägen & riktningar) plus `lakare_neuroanatomi` – samtliga ger 20 frågor med fyra svarsalternativ och noll konsolfel.
- **`UTBILDNINGAR_REGLER.md`: planen för Allmänt nedskriven.** Nytt avsnitt "Allmänt — tvärgående ämnen (PLANERAT, ej byggt)": sju linser som inte har egna frågor utan slumpar ur befintliga utbildningsfiler via mönster mot `topic`-nyckeln, plus ett slumpval över alla utbildningar. Dokumenterar även att `blandade_*`-mekaniken inte går att återanvända (den läser den utbildningsfiltrerade `#topic`-listan) och att dubbletter mellan utbildningar är förväntade och inte ska byggas bort. Ny grundregel 7 om att svårighetsgrad inte finns; fyra ställen som blivit inaktuella rättade (grundregel 2 "Allmänt rörs INTE" upphävd, slumpfrågeavsnittets punkt 4 om `topicsWithHardQuestions`, samt två statusrader om Allmänt).
- VERSION/APP_VERSION/index.html- och info.html-cachebuster → 0.9.165.

## 0.9.164
- **Optiker byggd i sin helhet – alla 5 ämnen, 500 nya MC-frågor. Därmed är hela utbildningsmålet i `UTBILDNINGAR_REGLER.md` färdigbyggt.** *Främre segmentet*, *Lins & ackommodation*, *Bakre segmentet*, *Synfysiologi & perception* och *Ögonrörelser & binokulärseende* – 100 frågor styck i den nya delade filen `data/optiker.json` (prefix `optiker_`). Ämnesindelningen följer `UTBILDNINGAR_REGLER.md` och linserna struktur → funktion → undersökningsmetod/instrument → avvikelse.
- **0 fel och 0 varningar i `validate_quiz.py`.** Längdbias per ämne 13–23 %, omvänd längdbias 12–25 %. Distraktorerna skrevs som konkreta, trovärdiga fel i samma längd och register som rätt svar redan från start (§2.12) – inga saneringssvep behövdes i efterhand. Antals-paritet handkollad på alla 26 frågor med räkneord (fem hornhinnelager, tio näthinnelager, tre skikt i tårfilmen, sex yttre ögonmuskler, sex lager i corpus geniculatum laterale m.fl.). Alla 100 frågor i varje ämne kontrollerade unika inom ämnet.
- **Ämnena byggda för optiker, inte som allmän ögonanatomi.** Anatomin bär genomgående optikerns undersökningsmetoder: främre segmentet knyter hornhinnans lager och endotelpump till pakymetri, keratometri, topografi och applanationstonometrins korneaberoende; linsämnet knyter zonula och strålkroppsmuskel till ackommodationsamplitud, push up- och minuslinsmetoden, Hofstetters formel och val av läsaddition; bakre segmentet knyter näthinnans lager och kärlförsörjning till direkt/indirekt oftalmoskopi, OCT, funduskamera och perimetri; synfysiologiämnet bär fototransduktion, mörkeradaptation, receptiva fält, synbanans defekter, färgsinnesdefekter och logMAR/kontrastkänslighet; ögonrörelseämnet bär muskelverkningar, Herings och Sherringtons lagar, VOR och nystagmus samt heterofori/heterotropi, övertäckningstest, prismadioptrier, stereotest och amblyopi.
- `getQuestionsPath()` fick regeln `topic.startsWith('optiker_')` → `./data/optiker.json`. Fem nya rader i `js/info.js` statistiklista.
- **Optiker får "Slumpade frågor" (MC)** (`blandade_optiker`) enligt det återanvändbara mönstret – poolen är 500 MC-frågor. Ämnesordningen i `#topic`: slumpvalet överst, sedan bokstavsordning (Bakre segmentet, Främre segmentet, Lins & ackommodation, Synfysiologi & perception, Ögonrörelser & binokulärseende).
- **`#topic`-scaffolden för optiker är helt tom** och ersatt av en kommentar. `UTBILDNINGAR_REGLER.md` uppdaterad: statusraden visar KLAR och optiker står med i listan över utbildningar med slumpval.
- VERSION/APP_VERSION/index.html- och info.html-cachebuster → 0.9.164.

## 0.9.163
- **Audionom byggd i sin helhet – alla 5 ämnen, 500 nya MC-frågor.** *Ytter- & mellanöra*, *Innerörat – cochlea*, *Balansorganet (vestibularis)*, *Hörselnerven & centrala hörselbanan* och *Ljud- & hörselfysiologi* – 100 frågor styck i den nya delade filen `data/audionom.json` (prefix `audionom_`). Ämnesindelningen följer `UTBILDNINGAR_REGLER.md` och linserna struktur → funktion → mätmetod → patofysiologi/hörselskada.
- **0 fel och 0 varningar i `validate_quiz.py`.** Längdbias per ämne 15–28 %, omvänd längdbias 11–28 %. Distraktorerna skrevs som konkreta, trovärdiga fel i samma längd och register som rätt svar redan från start (§2.12) – inga saneringssvep behövdes i efterhand. Antals-paritet handkollad på alla 16 frågor med räkneord (tre båggångar, två otolitorgan, två faser i nystagmus, tre system bakom balansen m.fl.). Alla 100 frågor i varje ämne kontrollerade unika inom ämnet.
- **Två fel som validatorn inte fångar rättades för hand.** En kontextberoende prompt ("Vad kallas *denna* parvisa samverkan mellan båggångarna?") skrevs om till "…mellan höger och vänster båggång" så att frågan står för sig själv när frågorna blandas (§2.2), och en självbesvarande fråga ("Vad heter hammaren på svenska?" med svaret "Hammaren") ströks.
- **Ämnena byggda för audionomer, inte som allmän öronanatomi.** Anatomin bär genomgående den audiologiska diagnostiken: mellanöreämnet knyter impedansanpassning och stapediusreflex till tympanometrikurvorna, cochleaämnet knyter yttre hårceller och prestin till otoakustiska emissioner och recruitment, balansämnet knyter båggångarnas push-pull till kalorisk provokation, huvudimpulstest och Epleys manöver, hörselbaneämnet knyter stationerna till hjärnstamssvarets vågor I–V och retrokokleär diagnostik, och fysiologiämnet bär dB SPL/HL/SL, isofonkurvor, maskering, audiogramtolkning och arbetsmiljöns bullergränser.
- `getQuestionsPath()` fick regeln `topic.startsWith('audionom_')` → `./data/audionom.json`. Fem nya rader i `js/info.js` statistiklista.
- **Audionom får "Slumpade frågor" (MC)** (`blandade_audionom`) enligt det återanvändbara mönstret – poolen är 500 MC-frågor. Ämnesordningen i `#topic`: slumpvalet överst, sedan bokstavsordning (Balansorganet, Hörselnerven, Innerörat, Ljud- & hörselfysiologi, Ytter- & mellanöra).
- **`#topic`-scaffolden för audionom är helt tom.** `UTBILDNINGAR_REGLER.md` uppdaterad: statusraden visar KLAR och audionom står med i listan över utbildningar med slumpval.
- VERSION/APP_VERSION/index.html- och info.html-cachebuster → 0.9.163.

## 0.9.162
- **Apotekare byggd i sin helhet – alla 5 ämnen, 500 nya MC-frågor.** *Cell, receptorer & signalering*, *Nervsystemet & autonom fysiologi*, *Hjärta & cirkulation*, *Mag-tarmkanal & lever* och *Njurar & utsöndring* – 100 frågor styck i den nya delade filen `data/apotekare.json` (prefix `apotekare_`). Ämnesindelningen följer `UTBILDNINGAR_REGLER.md` och linserna fysiologi/struktur → läkemedelsmål → ADME-relevans → effekt & biverkan.
- **0 fel och 0 varningar i `validate_quiz.py`.** Längdbias per ämne 13–28 %, omvänd längdbias 15–29 %. Distraktorerna skrevs som konkreta, trovärdiga fel i samma längd och register som rätt svar redan från start (§2.12) – inga saneringssvep behövdes i efterhand. Antals-paritet handkollad på alla 14 frågor med räkneord (tre subenheter i G-proteinet, två budbärare från fosfolipas C, tre processer i renal utsöndring m.fl.). Alla 100 frågor i varje ämne kontrollerade unika inom ämnet.
- **Ämnena byggda för apotekare, inte som allmän organanatomi.** Anatomin ligger som underlag för farmakologin genomgående: receptorklasserna kopplas till svarens tidsskala och till kända läkemedel, cirkulationsämnet bär även distribution och plasmaproteinbindning, mag-tarm/lever bär absorption, förstapassagemetabolism och CYP-interaktioner, och njurämnet bär clearance, halveringstid, laddnings-/underhållsdos och dosjustering vid njursvikt.
- `getQuestionsPath()` fick regeln `topic.startsWith('apotekare_')` → `./data/apotekare.json`. Fem nya rader i `js/info.js` statistiklista.
- **Apotekare får "Slumpade frågor" (MC)** (`blandade_apotekare`) enligt det återanvändbara mönstret – poolen är 500 MC-frågor. Ämnesordningen i `#topic`: slumpvalet överst, sedan bokstavsordning (Cell, Hjärta, Mag-tarmkanal, Nervsystemet, Njurar).
- **`#topic`-scaffolden för apotekare är helt tom** och ersatt av en kommentar. `UTBILDNINGAR_REGLER.md` uppdaterad: statusraden visar KLAR och apotekare står med i listan över utbildningar med slumpval.
- VERSION/APP_VERSION/index.html- och info.html-cachebuster → 0.9.162.

## 0.9.161
- **Läkare batch 4 – de basvetenskapliga tvärsnitten, 300 nya MC-frågor. Utbildningen är därmed färdigbyggd (18 av 18 ämnen).** *Histologi*, *Embryologi* och *Cell- & membranfysiologi* – 100 frågor styck. `data/lakare.json` rymmer nu 1800 frågor och slumppoolen 1900 inklusive det äldre ämnet *Blandad anatomi/fysiologi*, som ligger orört kvar.
- **0 fel och 0 varningar i `validate_quiz.py`.** Längdbias per nytt ämne 21–36 %. Två distraktorer fastnade på självutpekande-regeln genom formuleringen "en annan vävnadstyp" respektive "en annan jons gradient" och skrevs om; övriga träffar var absolut-ord som hedgades. Antals-paritet handkollad maskinellt på alla räkneords-frågor (fyra grundvävnader, tre groddblad, tre kollagentyper m.fl.).
- **En dubblerad frågetext mellan två ämnen upptäcktes vid sammanslagningen och skrevs om.** "Vad ger neurallisten upphov till?" fanns både i *Neuroanatomi* och i *Embryologi*; embryologifrågan vändes till "Vilken struktur ger upphov till binjuremärgen och melanocyterna?". Unikhetskravet gäller inom ämnet, men samma prompt två gånger i slumppoolen är onödigt.
- **Tvärsnitten byggda som tvärsnitt.** Histologi täcker de fyra grundvävnaderna, cellkontakter, kollagentyper, benets och broskets mikroanatomi samt färgningsteknik och begreppen metaplasi/dysplasi; embryologi täcker gastrulation, neurulation, gälbågarna, organanlagens missbildningar och fosterdiagnostik; cell- & membranfysiologi täcker transportmekanismer, membranpotential, aktionspotential, synaptisk överföring, cellcykel, apoptos och genetikens grunder.
- **`#topic`-scaffolden för läkare är helt tom** och ersatt av en kommentar. Tre nya live-options i bokstavsordning och tre rader i `js/info.js`.
- VERSION/APP_VERSION/index.html- och info.html-cachebuster → 0.9.161.

## 0.9.160
- **Läkare batch 3 – organsystemen, 500 nya MC-frågor.** *Njure & vätskebalans*, *Gastrointestinalt & ämnesomsättning*, *Endokrina systemet*, *Blod & immunförsvar* och *Reproduktion* – 100 frågor styck i `data/lakare.json`, som nu rymmer 1500 frågor. Utbildningen har 16 av 18 ämnen byggda; kvar är Histologi, Embryologi och Cell- & membranfysiologi.
- **0 fel och 0 varningar i `validate_quiz.py`.** Längdbias per nytt ämne 23–38 %. Distraktorerna skrivna som konkreta, trovärdiga fel i samma längd och register som rätt svar. De absolut-ord som slank in rättades direkt efter varje ämnesvalidering genom hedgning, aldrig genom att ta bort feluppfattningen. Två numeriska paritetsträffar i endokrinämnet åtgärdades genom att ge alla enzymalternativ samma sifferformat (17-alfa-hydroxylas, 11-beta-hydroxylas), i stället för att rätt svar var det enda som började med en siffra. Antals-paritet handkollad maskinellt på alla räkneords-frågor. Alla 100 frågor i varje ämne kontrollerade unika inom ämnet.
- **Överlappskoll före bygget:** de befintliga fysiologiprompterna i *Blandad anatomi/fysiologi* (njure, gastro, endokrin, blod, cell, muskel) dumpades och lästes först, så de nya ämnena styrdes bort från nefronets grundfunktion, insulin/glukagon, hemoglobinets syretransport och liknande som redan testats.
- **Ämnena byggda på läkarnivå, inte som repris på organanatomin.** Njure & vätskebalans täcker filtrationsbarriär, clearancebegrepp, motströmsmekanismen, diuretikas angreppspunkter, elektrolyt- och syra-basrubbningar; blod & immunförsvar täcker hematopoes, anemidifferentiering, koagulationskaskaden, MHC-restriktion, komplement och överkänslighetstyper – utan att återanvända buk- och bäckenämnenas makroanatomi.
- Fem nya live-options i `#topic` i bokstavsordning, fem rader i `js/info.js`, scaffold-blocket krympt till tre rader. Slumpade frågor-poolen växer automatiskt till 1600 frågor.
- VERSION/APP_VERSION/index.html- och info.html-cachebuster → 0.9.160.

## 0.9.159
- **Läkare batch 1 och 2 – tio nya ämnen, 1000 nya MC-frågor.** Batch 1 (topografisk anatomi): *Övre extremitet*, *Nedre extremitet*, *Thorax*, *Buk/abdomen* och *Bäcken & perineum*. Batch 2: *Rygg & columna*, *Huvud & hals*, *Neuroanatomi (CNS)*, *Kardiovaskulära systemet* och *Respirationssystemet*. 100 frågor styck i den nya delade filen `data/lakare.json` (prefix `lakare_`). Ämnesindelningen följer `UTBILDNINGAR_REGLER.md` och linserna makroanatomi → kärl & innervation → histologi → fysiologi → klinisk korrelation. Utbildningen har därmed 11 av 18 ämnen byggda; det befintliga `lakare_anatomi_fysiologi.json` är orört.
- **0 fel och 0 varningar i `validate_quiz.py`.** Distraktorerna skrivna som konkreta, trovärdiga fel i samma längd och register som rätt svar redan från start – inga förtydligande parenteser på rätt svar, inga självutpekande eller självbesvarande frågor. Längdbias per ämne 12–36 %. De 22 absolut-ord som slank in under skrivningen (endast/enbart/alltid/samtliga) rättades direkt efter varje ämnesvalidering genom omskrivning till hedgade men fortsatt felaktiga påståenden, aldrig genom att ta bort feluppfattningen. Antals-paritet handkollad maskinellt på alla frågor med räkneord (tre muskler i armens främre loge, tre delar av m. levator ani, tre kranialnerver genom foramen jugulare, fyra tuggmuskler m.fl.). Alla 100 frågor i varje ämne kontrollerade unika inom ämnet.
- **Överlappskoll före varje batch:** de befintliga prompterna i läkarens *Blandad anatomi/fysiologi* dumpades och lästes först – 33 topografiska inför batch 1 och 44 neuro-/fysiologiska inför batch 2 – så de nya ämnena styrdes bort från det som redan testats (dropphand, truncus coeliacus, corpus callosum, surfaktant, baroreceptorernas läge m.fl.).
- **Fysiologiämnena byggda som fysiologi, inte som upprepad thoraxanatomi.** Kardiovaskulära systemet täcker tryck-volymförhållanden, preload/afterload, Frank-Starling, EKG-tolkning, kärlmotstånd och chocktyper; Respirationssystemet täcker lungvolymer, compliance, ventilation-perfusion, gastransport, syra-bas och andningsreglering – utan att återanvända hjärtats och lungornas makroanatomi från ämnet *Thorax*.
- `getQuestionsPath()` fick regeln `topic.startsWith('lakare_')` → `./data/lakare.json`, placerad efter den exakta träffen på `lakare_anatomi_fysiologi` så att den äldre filen fortsätter resolva rätt.
- **Läkare får också "Slumpade frågor" (MC)** (`blandade_lakare`) enligt det återanvändbara mönstret – motiveringen för att avstå (bara ett ämne) gäller inte längre. Poolen är nu 1100 MC-frågor och växer automatiskt med kommande ämnen. Ämnesordningen i `#topic`: slumpvalet överst, sedan bokstavsordning (Blandad, Buk, Bäcken, Huvud, Kardiovaskulära, Nedre, Neuroanatomi, Respiration, Rygg, Thorax, Övre).
- Tio nya rader i `js/info.js` statistiklista och tio rader borttagna ur `#topic`-scaffolden. `UTBILDNINGAR_REGLER.md` uppdaterad: läkare står inte längre som undantag för slumpvalet och statusraden visar 11 byggda ämnen.
- VERSION/APP_VERSION/index.html- och info.html-cachebuster → 0.9.159.

## 0.9.158
- **"Slumpade frågor" finns nu i sex utbildningar till – fysioterapeut, biomedicinsk analytiker, röntgensjuksköterska, medicinsk sekreterare, logoped och tandläkare.** Varje utbildning får ett eget `blandade_<utbildning>`-val i `#topic` som vid start slumpar frågor ur alla utbildningens MC/TF-ämnen: fysioterapeut 1420, biomedicinsk analytiker 1800, röntgensjuksköterska 1500, medicinsk sekreterare 600, logoped 600 och tandläkare 500 frågor i poolen. Poolerna växer automatiskt när nya ämnen läggs till.
- **Inga `app.js`-ändringar behövdes** – mekaniken generaliserades redan i 0.9.156 (`topic.startsWith('blandade')`), så valen är rena `<option>`-rader enligt mönstret i `UTBILDNINGAR_REGLER.md`. Eget värde per utbildning ger separat topplista och rätt utbildningsförkortning. Path-samlingen kontrollerad för alla sex: varje ämne resolvar till rätt datafil, ingen faller tillbaka på `riktningar.json`. Ingen av filerna har `Hard`-frågor, så `topicsWithHardQuestions` är orörd.
- **Läkare och Allmänt fick medvetet inget slumpval.** Läkare har bara ett ämne (urvalet vore identiskt med ämnet) och Allmänt har bara FC-ämnen, vilket ger en tom pool. Noterat i regeldokumentet med villkoret "minst två MC/TF-ämnen".
- **Ämnesordningen i `#topic` är omgjord för samtliga tio utbildningar: "Slumpade frågor" överst, därefter övriga ämnen i bokstavsordning** (svensk kollation – å/ä/ö sist, skiljetecken ignoreras, t.ex. Ledtyper före Lägen, Klinisk kemi före Kärl-, Örat sist hos logoped). Options grupperas nu under en kommentarrubrik per utbildning. Ingen option borttagen och ingen etikett ändrad; den utkommenterade platshållar-scaffolden ligger kvar orörd.
- `UTBILDNINGAR_REGLER.md`: §Slumpade frågor listar vilka utbildningar som har valet och varför två saknar det, samt ny regel 5 om placering överst + bokstavsordning – inklusive följden att slumpvalet blir förvalt ämne vid utbildningsbyte (`topicEl.value = visible[0].value`).
- VERSION/APP_VERSION/index.html-cachebuster → 0.9.158.

## 0.9.157
- **Sjuksköterska batch 3 – ämne 11–15, 500 nya MC-frågor. Utbildningen är därmed färdigbyggd (15 av 15 ämnen).** *Huden (integumentet)*, *Immunförsvar & lymfsystem*, *Reproduktion, graviditet & förlossning*, *Vätske-, elektrolyt- & syra-basbalans* och *Åldrande & livscykelperspektiv* – 100 frågor styck, appenderade i `data/sjukskoterska.json` (nu 1500 frågor totalt). De tio tidigare ämnena ligger byte-identiska kvar; batch 3 lade bara till nya poster.
- **0 fel och 0 varningar i `validate_quiz.py`.** Distraktorerna byggda som konkreta, trovärdiga fel i samma längd och register som rätt svar, inga förtydligande parenteser på rätt svar, inga absolut-ord/självutpekande/självbesvarande frågor. Längdbias per ämne 22–34 %. Antals-paritet handkollad på alla räkneords-frågor (fyra inflammationstecken, tre trycksårskrafter, tre organsystem i syra-basbalansen, palliativ vårds fyra hörnstenar m.fl.). Alla 100 frågor i varje ämne kontrollerade unika inom ämnet.
- **Kliniknära tvärsnitt byggt som tvärsnitt.** Vätske-/elektrolyt-/syra-basämnet binder ihop njure, andning och cirkulation på en nivå som medvetet hållits utanför tidigare ämnen: kroppsvattnets fördelning, osmolalitet och tonicitet, infusionsvätskor, vätskelista och viktkontroll, natrium/kalium/kalcium med normalintervall, buffertsystem, metabol acidos/alkalos med kompensation och blodgastolkning.
- Fem nya live-options i `#topic` och sitemap-rader i `js/info.js`. Sjuksköterskans scaffold-block i `#topic` är därmed tomt och ersatt av en kommentar. "Slumpade frågor"-poolen (`blandade_sjukskoterska`) växer automatiskt med de nya ämnena – ingen ändring behövdes.
- VERSION/APP_VERSION/index.html-cachebuster → 0.9.157 (app.js + info.js).

## 0.9.156
- **Sjuksköterska får "Slumpade frågor" (MC) – ett dynamiskt urval ur alla utbildningens ämnen, inte en egen lista.** Nytt val i `#topic` (`blandade_sjukskoterska`) som vid start hämtar frågor från alla sjuksköterske-ämnen som är MC/TF just då och slumpar fram valt antal (t.ex. 100). Rena flashcard-ämnen (FC) tas aldrig med. Poolen är ~1238 MC-frågor (medicinsk latin, läkemedelsräkning + de tio organsystems-ämnena) och **växer automatiskt** när nya ämnen läggs till – ingen lista att underhålla.
- **Återanvänder befintlig "Slumpade frågor"-mekanik (arbetsterapeutens `blandade`) i stället för en ny lösning.** De hårdkodade `topic === 'blandade'`-kontrollerna i `app.js` är generaliserade till `topic.startsWith('blandade')` (och path-exkluderingen till `value.startsWith('blandade')`), så varje utbildning kan få ett eget `blandade_<utbildning>`-val. Eget värde per utbildning ger separat topplista och rätt utbildningsförkortning (SSK), i stället för att krocka med arbetsterapeutens.
- VERSION/APP_VERSION/index.html-cachebuster → 0.9.156.

## 0.9.155
- **Rättad utbildningsförkortning: arbetsterapeut visas nu som ATP, inte ATB.** `EDU_ABBREV` i `js/app.js` hade fel förkortning, som bland annat syntes i topplistan (t.ex. "Ben (ATB)"). Förkortningen slås upp live vid visning och lagras inte i sparade highscore-resultat, så rättelsen slår igenom direkt på befintliga topplistor utan datamigrering.
- **CLAUDE_REGLER.md → v1.3.** §2.9 utökad med längdbias-lärdomen från sjuksköterske-bygget: kunskaps-/förklaringsfrågor drar systematisk längdbias – distraktorerna ska skrivas som fullständiga, konkret felaktiga påståenden i samma längd som rätt svar FRÅN START. Parentesregeln utökad till att även gälla term-synonymer enbart på rätt svar (`Glomerulus (kapselnystanet)` osv).
- VERSION/APP_VERSION/index.html-cachebuster → 0.9.155.

## 0.9.154
- **Sjuksköterska batch 2 – ämne 6–10, 500 nya MC-frågor.** *Nervsystemet*, *Rörelseapparaten*, *Matsmältning & näringslära*, *Njurar & urinvägar* och *Endokrina systemet* – 100 frågor styck, appenderade i `data/sjukskoterska.json` (nu 1000 frågor totalt). De fem tidigare byggda ämnena (0.9.153) ligger byte-identiska kvar; batch 2 lade bara till nya poster. Fem nya live-options i `#topic` och sitemap-rader i `js/info.js`; app.js-routningen (`topic.startsWith('ssk_')`) fanns redan.
- **0 fel och 0 varningar i `validate_quiz.py`.** Distraktorerna byggda i samma längd och register som rätt svar, förtydligande parenteser strukna från rätt svar, inga absolut-ord/självutpekande/självbesvarande. Antals-paritet handkollad på räkneords-frågor. Alla 100 frågor i varje ämne kontrollerade unika inom ämnet. Omvårdnadslinsen invävd (t.ex. AKUT-testet vid stroke, fallprevention, vätskebalans, blodsocker- och diabetesomvårdnad).
- Sjuksköterskans tio byggda ämnesrader avkommenterade i `#topic`-scaffolden; de fem kvarvarande ämnena (huden, immunförsvar, reproduktion, vätske-/syra-bas, åldrande) ligger kvar som utkommenterade platshållare.
- VERSION/APP_VERSION/index.html-cachebuster → 0.9.154 (app.js + info.js).

## 0.9.153
- **Sjuksköterska får sina fem första organsystems-/omvårdnadsämnen – 500 nya MC-frågor.** Batch 1 av utbyggnaden enligt `UTBILDNINGAR_REGLER.md` §Sjuksköterska: *Cell, vävnad & homeostas*, *Vitalparametrar & normalvärden*, *Cirkulationssystemet*, *Blodet* och *Respirationssystemet* – 100 frågor styck. Alla ämnen ligger i en delad fil `data/sjukskoterska.json` (topic-prefix `ssk_`), inkopplad via `js/app.js` (`topic.startsWith('ssk_')`), med live-options i `#topic` (data-edu="sjukskoterska") och sitemap-rader i `js/info.js`. De tre befintliga ämnena (medicinsk latin, blandad anatomi/fysiologi-FC, läkemedelsräkning) är orörda.
- **Byggt rätt från början enligt §2.9/§2.12–2.13.** `validate_quiz.py data/sjukskoterska.json` ger 0 fel och 0 varningar: distraktorerna är konkreta, trovärdiga fel i samma längd och register som rätt svar, förtydligande parenteser är strukna från rätt svar, inga absolut-ord/självutpekande/självbesvarande frågor. Antals-paritet handkollad på alla räkneords-frågor (fyra vävnadsslag, tre GCS-reaktioner, fyra blodgrupper m.fl.). Alla 100 frågor i varje ämne kontrollerade unika inom ämnet. Omvårdnadslinsen invävd (normalvärden, RLS/GCS/NEWS2, kliniska kopplingar).
- Sjuksköterskans fem byggda ämnesrader avkommenterade i `#topic`-scaffolden; de tio kvarvarande ämnena ligger kvar som utkommenterade platshållare.
- VERSION/APP_VERSION/index.html-cachebuster → 0.9.153 (app.js + info.js).

## 0.9.152
- **Ordlistans FAQ berikad och korslänkad till terminologi-avdelningen.** Alla 6 FAQ-svar på `medicinskordlista.html` omskrivna till fylligare, mer sökintentions-riktad text med interna länkar till undersidorna i terminologi-avdelningen: `medicinskt-latin`, `grekiska-i-medicinen`, `terminologins-historia`, `deklinationer-pluralformer` och `uttalsregler`. Två delfrågor (uttal, kasus/pluralformer) täcker fler long-tail-sökningar. Källan (`LANDING_FAQ` i `scripts/generate_glossary.py`) och den handhållna landningssidan hålls byte-synkade, och FAQ-schemat härleds fortfarande ur synlig HTML så det inte kan divergera.
- VERSION/APP_VERSION/index.html-cachebuster → 0.9.152.

## 0.9.151
- **Landningssidan `medicinskordlista.html` slutar dubblera A-listan – blir en riktig beskrivande hubb.** Sidan bar tidigare hela bokstaven A:s poster inbäddade (999 st), byte-identiska med `ordlista-a.html` → dubblettinnehåll där båda sidorna var self-canonical. Nu visar landningssidan set-nivå: bokstavsrutnätet (A–Ö + siffror/förstavelser/ändelser) + ny beskrivande om-text, en FAQ (6 frågor) och en APA-referenslista. A-posterna är oförändrade kvar på `ordlista-a.html` (0 ändrade term-rader).
- **Strukturerad data uppgraderad för Bing/agent-inläsning.** Landningssidans typ `CollectionPage` → `DefinedTermSet` (rätt semantisk typ för en ordlista), men medvetet lätt: `hasPart` pekar bara på de 32 bokstavssidorna, aldrig på varje term (per-term-varianten gav förr ~1,8 MB). Ny `FAQPage`-schema där svarstexten härleds ur den synliga HTML:en (en källa → schema och sida kan aldrig divergera). Bokstavssidornas `isPartOf` följer med till `DefinedTermSet`.
- **Allt genererat, inget handredigerat.** Byggt i `scripts/generate_glossary.py`; bokstavssidorna ändrades bara i cachebuster (`glossary.css`/`glossary.js` 0.9.4→0.9.5) och isPartOf-typ. Ny scoped CSS i `glossary.css` (ramfri innehållsdiv + rubriker) som bara laddas på ordlistesidorna. Verifierat: tagg-balanserad HTML, alla 3 JSON-LD-block parsar, idempotent bygge.
- VERSION/APP_VERSION/index.html-cachebuster → 0.9.151.

## 0.9.150
- **Formtells-svepet är HELT klart – fysioterapeut var sista filen.** Alla 14 fysio-ämnen (1420 frågor) ger nu 0 fel och 0 varningar i `validate_quiz.py`. Skulden var mekanisk: 546 distraktorer med absolut-ord ("Endast/Aldrig/uteslutande …" som rätt svar aldrig bar) och 40 självutpekande distraktorer, alla omskrivna för hand till konkreta, trovärdiga fel. **985 distraktorrader** ändrade i en byte-ren diff – frågetexter och rätta svar är helt orörda (0 rader rör `prompt`/`correct`/`id`/`topic`).
- **Fysioterapeut åter synlig i utbildningsväljaren.** De 14 ämnesraderna i `#topic` är avkommenterade och den tillfälliga noten borttagen (dolda sedan 0.9.149) – utbildningen är valbar igen nu när quizet är granskat.
- **Fällor som fångades och rättades under svepet:** förkortade distraktorer införde 49 % längdbias i träningsämnet (13 frågor flippade genom att förlänga längsta distraktorn med genuint innehåll → alla ämnen < 40 %); några omskrivningar råkade återinföra absolut-ord eller skapa nya ", inte/utan …"-självutpekningar – alla åtgärdade till 0 varningar.
- **CLAUDE_REGLER.md → v1.2.** Svep-lärdomarna kodifierade som bindande regler (inte bara i minnet): §2.12 positiv mall för hur en bra distraktor skrivs (konkret fel + gissa-testet + före→efter-exempel), §2.13 "validatorn är facit / bygg rätt från början / kör skriptet efter varje ändring", §2.9 utökad med de tre fällorna när man rättar en tell, samt utökad QA-checklista (§8) och fellista (§10.1).
- VERSION/APP_VERSION/index.html-cachebuster → 0.9.150.

## 0.9.149
- **Fysioterapeut tillfälligt dold i utbildningsväljaren.** Utbildningens 14 ämnen är utkommenterade i `#topic` tills formtells-svepet av `data/fysioterapeut.json` (586 validator-varningar) är klart. Med 0 synliga ämnen gråas "Fysioterapeut" automatiskt och visas som "(inga ämnen ännu)" – inget ogranskat fysio-quiz går att öppna eller söka fram. Ämnesraderna är bevarade i kommentar och återställs (avkommenteras) när `validate_quiz.py` ger 0 varningar för filen. Ingen datafil ändrad.
- VERSION/APP_VERSION/index.html-cachebuster → 0.9.149.

## 0.9.148
- **Formtells-svepet klart i fem hela utbildningar till – biomedicinsk analytiker, medicinsk sekreterare, läkare, tandläkare och logoped ger nu alla 0 fel och 0 varningar i `validate_quiz.py`.** Kvar av svepet står bara fysioterapeut (586 varningar).
- **Biomedicinsk analytiker färdig (18/18 ämnen).** De sista fem ämnena – klinisk kemi, njur/gastro/nuklearmedicin, hematologi/transfusion, mikrobiologi och patologi – rensades på absolut-ords-tellen och självutpekande distraktorer; 320 distraktorer i 163 frågor omskrivna till konkreta, trovärdiga fel. Exempel: "Enbart hemolys, utan koppling till gallvägarna" → "Ökad hemolys av röda blodkroppar".
- **Logoped färdig (alla sex ämnen).** 343 distraktorer i 203 frågor omskrivna. Genomgående "Enbart X"/"Aldrig Y"-distraktorer gjorda till raka felalternativ, t.ex. "Enbart facialisnerven, utan bidrag från andra nerver" → "Facialisnerven ensam".
- **Tandläkare färdig (alla fem ämnen).** 169 distraktorer i 98 frågor omskrivna, bl.a. anatomiska uppräkningar där distraktorerna bar "Endast"/"Enbart" som rätt svar aldrig gjorde.
- **Medicinsk sekreterare färdig.** 141 distraktorer i 69 frågor omskrivna. Här steg dessutom längdbias i diagnoskodnings-ämnet över gränsen (44 % → 56 %) när distraktorerna kortades – rättat med 19 genuint fylligare felförklaringar tillbaka till under 40 %.
- **Läkare (anatomi/fysiologi) färdig.** De sex sista absolut-orden borta, plus tre frågor med pre-existerande längdbias (i ans/njure/gi) utjämnade.
- **Metod:** distraktorerna skrevs om för hand till konkreta fel; en index-baserad patch rörde bara de flaggade alternativen så att övriga förblev byte-identiska. Validatorn kördes efter varje fil och fångade även längdbias som infördes vid förkortning.
- VERSION/APP_VERSION/index.html-cachebuster → 0.9.148.

## 0.9.147
- **Formtells-svepet fortsätter i biomedicinsk analytiker: 13 av 18 ämnen rena.** Med de nya kontrollerna från 0.9.146 larmade filen på 657 punkter. Nu är cell/vävnad, blod, hjärta, respiration, nervsystem, njurar, matsmältning, endokrina, immunförsvar, EKG, spirometri, kärlfysiologi och neurofysiologi genomgångna – cirka 480 frågor omskrivna. Kvar: klinisk kemi, njur/gastro/nuklearmedicin, hematologi/transfusion, mikrobiologi och patologi.
- **Absolut-ords-tellen var den dominerande skulden.** Distraktorer som "Endast filtration och sekretion", "Alltid ett tecken på hjärtsvikt" och "Aldrig i förmaken" gick att stryka utan sakkunskap eftersom rätt svar aldrig bar ett sådant ord. Samtliga omskrivna till konkreta, trovärdiga fel: "Endast njurbäckenet, inte parenkymet" blev "Njurbäckenet och kalkarna med tät kontrast".
- **Förbjudna filler-alternativ borttagna**: "Ingen av dessa" fanns som svarsalternativ på tre muskelfrågor i cell/vävnad (`bma_cell_81`, `_82`, `_84`).
- **Ja/nej- och format-asymmetrier rättade.** `bma_cell_60` frågade "Är epitelvävnad vaskulariserad?" där rätt svar var det enda som började med "Nej" – frågan är omskriven till "Hur försörjs epitelvävnad med näring?" så att alla alternativ är påståenden. Samma sak i `bma_ekg_26`, där rätt svar var det enda alternativet utan siffra.
- **Självutpekande distraktorer** som negerade med rätt svarets egna nyckelord ("Bara EEG, inte nervledningsstudier") omformulerade så att de läses som trovärdiga alternativ.
- VERSION/APP_VERSION/index.html-cachebuster → 0.9.147.

## 0.9.146
- **Röntgensjuksköterska klar – och svepet visade sig ha mätt fel sak.** Alla 15 ämnen (1500 frågor) är genomgångna och filen ger nu **0 fel och 0 varningar** i `validate_quiz.py`. Utgångspunkten var längdbias (rätt svar längst i 664 frågor, 44 %), men vid genomläsning framkom att formen avslöjade svaret på fem ytterligare sätt. Cirka 900 frågor omskrivna.
- **Absolut-ords-tellen – minst lika avslöjande som längdbias, och den fanns i hela projektet.** 565 av 1500 röntgenfrågor (38 %) hade distraktorer som bar "Endast", "Enbart", "Alltid" eller "Aldrig" medan rätt svar aldrig gjorde det; 504 distraktorer *började* med ett sådant ord. Man stryker dem utan att kunna ämnet. Samtliga omskrivna till konkreta, trovärdiga fel. Exempel: `rtg_njurfunktion_11` bad om tre processer i urinbildningen och hade distraktorerna "Endast filtration och sekretion, ingen reabsorption" / "Endast reabsorption, ingen filtration eller sekretion" – två tells i samma fråga.
- **Självutpekande distraktorer.** 34 frågor hade alternativ som skyltade med att de var fel: "Ductus thoracicus, **en helt annan struktur**", "Right Posterior Orientation, **en påhittad benämning**", "MR kan inte visa någon blödning över huvud taget, **vilket är felaktigt**". Grövst var `rtg_buk_retroperitoneum_5`, där alla tre distraktorerna löd "Levern, **inte pankreas**" / "Mjälten, **inte pankreas**" / "Njuren, **inte pankreas**" – de namngav rätt svar.
- **Sakfel i rätt svar, funna vid genomläsning.** `rtg_buk_retroperitoneum_10` räknade **pankreas som primärt retroperitonealt** (det är sekundärt – rättat till uretärerna). `rtg_njurfunktion_87` påstod att ACE "aktiveras i levern och lungan" (enzymet sitter i lungans endotel). `rtg_thorax_80` frågade om companion shadow längs **klavikeln** men beskrev *revbenets* undersida i svaret. `rtg_skalle_hjarna_40` kallade durans venösa sinus för "**bihålor**" (= ansiktets bihålor). `rtg_karlanatomi_35` bar ett trasigt ord från parentes-strippningen: "shunt mellan portaven och **lever ven**".
- **Latinska genusfel genomgående**: "carotis communis *dexter*", "arteria coronaria *dexter*", "fissura obliqua *dexter*" – *arteria*, *vena* och *fissura* är femininum och tar *dextra*/*sinistra*. Rättat i alla förekomster.
- **Självbesvarande frågor**: `rtg_kontrastmedel_6` löd "Vilket grundämne ger **gadolinium**baserade kontrastmedel deras MR-effekt?" med svaret "Gadolinium". Samma fel i `rtg_backen_hoft_70`/`_71`, `rtg_snittanatomi_28`/`_99`, `rtg_huvud_hals_58`, `rtg_columna_51` m.fl. Omformulerade.
- **Kontextberoende frågor**: sju frågor syftade på den föregående frågan ("Vad kallas *det motsatta läget*…", "…enligt *samma klassificering*…", "Vilken struktur avgränsas av *dessa två ligament*…"). Eftersom frågorna blandas blev de obesvarbara. Gjorda självbärande.
- **Förbjudna filler-alternativ** borttagna: "Patientens skostorlek", "Patientens favoritfärg", "Patientens favoritmat", "Ingen av dessa kan feltolkas".
- **Validatorn utökad så att detta inte kan upprepas.** `scripts/validate_quiz.py` varnar nu även för absolut-ord enbart i distraktorerna, självutpekande distraktorer och förbjudna filler-alternativ. Den fångade femton egna misstag under arbetets gång. `CLAUDE_REGLER.md` §2.2, §2.9 och §10.1 uppdaterade med varje tell och skräckexemplen.
- **Känd kvarstående skuld:** de nya kontrollerna avslöjar att absolut-tellen finns kvar i utbildningar som tidigare rapporterats klara – biomedicinsk analytiker (657 varningar), fysioterapeut (586), logoped (207), tandläkare (99), medicinsk sekreterare (72), läkare (6). Dessa städas i kommande versioner.
- VERSION/APP_VERSION/index.html-cachebuster → 0.9.146.

## 0.9.145
- **Längdbias borta i tre hela utbildningar till – BMA, logoped och tandläkare.** Rätt svar var systematiskt det längsta alternativet och gick därför att gissa utan sakkunskap. Samtliga ämnen färdigsvepta: **biomedicinsk analytiker 53 % → 0 % (0/1800)**, **logoped 54 % → 0 % (0/600)**, **tandläkare 36 % → 0 % (0/500)**. Slumpnivån är ~25 % vid fyra alternativ. Metod: distraktorerna byggdes ut till jämförbar längd och förblev faktamässigt fel; rätt svar kortades bara för hand, aldrig maskinellt. Tillsammans med fysioterapeut (klar i 0.9.142) är fyra av fem stora quizfiler nu rensade – kvar står röntgensjuksköterska (45 %, 1500 frågor).
- **Sakfel som parentes-strippningen i 0.9.139 hade orsakat är reparerade i hela projektet.** Den maskinella borttagningen av parenteser ur svarsalternativ tog med sig sakinnehåll som stod inom parentes. Alla 22 berörda datafiler jämfördes fråga för fråga mot texten före strippningen; 243 ändringar granskades för hand. Tre rätt svar hade blivit innehållslösa: Friedewalds formel var avhuggen mitt i meningen ("LDL = totalkolesterol minus HDL minus, utan direktmätning" – triglyceridtermen borta), Philadelphiakromosomens `t(9;22)` hade reducerats till ett ensamt "t", och Poiseuilles lag hade tappat "(upphöjt till 4)" och sade bara att flödet "beror på radien" – trots att en distraktor löd "oberoende av radien". Alla tre återställda.
- **Distraktorer som besvarade fel fråga.** `log_horsel_74`, `_81` och `_82` hade svarsalternativ kopierade från en annan fråga (t.ex. "Den har enbart en enda synaps mellan örat och cortex" som svar på hur övre olivkomplexet bidrar till ljudlokalisation). Omskrivna så att de faktiskt besvarar frågan, men fel.
- **Numeriska och format-mässiga asymmetrier rensade.** Rätt svar får inte vara det enda alternativet som bär en siffra – eller det enda som saknar en. Tolv frågor rättade, bland annat "12-avlednings-EKG", "10–20-systemet", "runt 4 kHz" och `tlk_saliv_28`, där rätt svar var det ENDA alternativet utan procenttal. Validatorn rapporterar nu noll asymmetrier i hela projektet.
- **Antals-asymmetri**: ett tjugotal frågor bad om N saker (t.ex. "Vilka **tre** faktorer i Virchows triad…") där bara rätt svar listade tre och distraktorerna en – man kunde räkna sig fram till svaret. Omskrivna så att alla alternativ listar lika många.
- **Språkfel i rätt svar**: "I det röda benmärgen" → "den", "En fosfolipid-dubbelskikt" → "Ett", "Den tubulära transportmaximum" → "Det", "riklig vätskeintag" → "rikligt", "på os temporales framsida" → "på tinningbenets framsida", plus stavfelen "overtered", "saliavsöndringen", "nässgångarna", "Fosssor" och "struphuvude".
- **Reglerna skärpta i `CLAUDE_REGLER.md` §2.9/§10.1**: antals-asymmetrin markerad som något `validate_quiz.py` INTE fångar (måste läsas för hand), och den nya tell:en "extra kvalificerare enbart på rätt svar" dokumenterad ("Nervus medianus, vid handleden" bland nakna nervnamn).
- VERSION/APP_VERSION/index.html-cachebuster → 0.9.145.

## 0.9.144
- **Textquizet ryms nu på en mobilskärm även vid långa frågor och långa svar.** Med sajtens längsta fråga (`fys_traning_2`, 724 tecken inkl. fyra långa alternativ) låg Nästa-knappen 243 px under fold på iPhone 13 – värst i Safari, vars adressfält lämnar 664 px synlig yta i stället för 844 px. Ny `fitQuizToViewport()` i `js/app.js` mäter kortets underkant mot `visualViewport` (som till skillnad från `innerHeight` känner till Safaris toolbar) och drar ned CSS-variabeln `--quiz-fit` i steg om 0,04 tills allt ryms. Variabeln skalar frågetext, svarstext, paddings och mellanrum i `#quiz:not(.quiz-image)` under 640 px. Golv: träffyta ≥44 px och svarstext ≥0,82 rem (WCAG). På värstafallsfrågan landar skalan på 0,68 och Nästa hamnar på 611 px – innanför den synliga ytan. Körs om vid rotation, ändrad textstorlek och när adressfältet fälls in/ut. Bildfrågornas tunade `.quiz-image`-layout och desktopvyn är orörda.
- **Startsidans Om-sektion fälls ihop.** Utbyggnaden i 0.9.143 gjorde startsidan 3074 px hög (3,6 iPhone-skärmar). Allt utom inledningsstycket ligger nu i en hopfälld `<details>` ("Läs mer om quizet, pluggtabellerna och ordlistan") – sidan är 1274 px, dvs kortare än före utbyggnaden (1301 px), medan hela texten finns kvar i DOM:en och indexeras. Startkortet (`#setup`) var oförändrat 547 px hela tiden; det var aldrig startkortet som växte.
- VERSION/APP_VERSION/cachebusters (index.html + `STYLES_V`) → 0.9.144.

## 0.9.143
- **Startsidans Om-sektion utbyggd och sökordsbreddad.** Texten gick från två stycken till fyra avsnitt (Quiz och flashcards, Pluggtabeller och listor, Medicinsk ordlista och terminologi, Vem ligger bakom sidan?) i sakligt, icke-säljande tonläge. Termer som tidigare saknades helt på startsidan täcks nu: fysiologi (muskel-, smärt-, arbets- och elektrofysiologi), osteologi, ledlära, neuroanatomi, innervation, ursprung och fäste, kranialnerver, ICD-koder, referensvärden, pluggtabeller/studietabeller, tentaplugg och biomedicinsk analytiker.
- **Intern länkning från startsidan: 5 → 17 länkar** – muskeltabeller, skelett, leder, nervtabeller, kranialnerverna, kärltabeller, faktatexter, läkemedelsberäkning, medicinsk terminologi, medicinskt latin, deklinationer/pluralformer, uttalsregler, patientfall, ordlistan, kunskapsbanken och info. Samtliga mål verifierade att de finns.
- **Norrtou Creations namngivet och länkat på startsidan** (norrtou.se) med korta beskrivningar av och länkar till Aktivitetsdagboken och HEC. Länkarna till de egna sajterna bär `rel="noopener"` (utan `noreferrer`), så att trafiken från Anatomiquiz syns som hänvisning i deras statistik – säkerhetsspärren mot `window.opener` finns kvar. JSON-LD:s `author.url` pekar nu på norrtou.se med GitHub som `sameAs`, i stället för GitHub som primär url.
- **SEO-meta uppdaterad så den matchar innehållet** (efter godkännande): `<title>`/`og:title`/`twitter:title` → "Anatomiquiz – öva anatomi, fysiologi och medicinsk terminologi" (62 tecken, inom Bings ~65-teckensideal, unik, nyckelord tidigt); description/og/twitter omskrivna med fysiologi, flashcards, ordlista och pluggtabeller (151/203/147 tecken). JSON-LD: bredare `description`, `learningResourceType` → `["quiz","flashcard","reference"]`, `about` utökad med Fysiologi/Myologi/Artrologi/Neuroanatomi (Neurologi → Neuroanatomi), biomedicinska analytiker i `audience`, och `hasPart` som array med både ordlistan och kunskapsbanken.
- **CSS**: `.intro` fick regler för `h3`, `ul` och `li` med litet listindrag (samma mobilfix som `.info-about`, även i 640px-brytpunkten).
- **CSS-cachebustern synkad över hela sajten** – låg tidigare på två olika värden (33 sidor på 0.7.17, 68 på 0.7.28). Alla 101 sidor + `STYLES_V` i `scripts/generate_glossary.py` → 0.9.143, så generatorn fortsatt skriver byte-identiska ordlistesidor.
- VERSION/APP_VERSION/index.html-cachebuster → 0.9.143.

## 0.9.142
- **Längdbias i fysioterapeut helt åtgärdad – alla 14 ämnen klara.** De fem sista ämnena färdigsvepta så rätt svar inte längre är systematiskt längst: `fysio_hand_handled` (49→0), `fysio_hoft_backen` (49→0), `fysio_axel_skulder` (48→0), `fysio_kardio_resp` (45→0) och `fysio_armbage_underarm` (41→0). **Hela fysioterapeut.json: 815/1420 (57 %) → 0/1420 (0 %) rätt-svar-längst**, alla 1420 frågor intakta. Metod genomgående: utbyggda distraktorer till jämförbar längd och nedkortade (kompletta) rätt svar; term-/enordssvar fick en jämförbart lång distraktor.
- VERSION/APP_VERSION/index.html-cachebuster → 0.9.142.

## 0.9.141
- **Längdbias-fix i fysioterapeut, forts.**: tre ämnen till färdigsvepta – `fysio_muskelfysiologi` (56→0), `fysio_fot_fotled` (55→0) och `fysio_led_skelett` (50→0). Totalt nu 9 av 14 ämnen klara; hela filen 57 % → 16 % rätt-svar-längst. Kvar: hand/handled, höft/bäcken, axel/skuldra, kardio/resp, armbåge/underarm.
- VERSION/APP_VERSION/index.html-cachebuster → 0.9.141.

## 0.9.140
- **Längdbias-fix i fysioterapeut, forts.**: sex ämnen färdigsvepta så rätt svar inte längre är systematiskt längst – `fysio_traning_arbetsfys` (91→0), `fysio_motorisk_utv_aldrande` (87→0), `fysio_smartfysiologi` (70→0), `fysio_kna` (59→0), `fysio_nervsystemet` (58→0) och `fysio_columna` (56→0). Metod: utbyggda distraktorer till jämförbar längd + nedkortade (kompletta) rätt svar; numeriska frågor fick formatsymmetri. Hela filen: 57 % → 28 % rätt-svar-längst. Övriga 8 ämnen kvarstår (muskelfysiologi, fot/fotled, led/skelett, hand/handled, höft/bäcken, axel/skuldra, kardio/resp, armbåge/underarm).
- **Quiz-regler kodifierade i `CLAUDE_REGLER.md` (v1.1)**: nio regler som tidigare bara fanns i arbetsminnet skrevs in i regelfilen – §1.5 korrekt/pedagogisk svenska, §2.9 svarsalternativens form får aldrig avslöja svaret (längdparitet, inga avslöjande parenteser, ej självbesvarande, numerisk-/format-paritet, språkparitet), §2.10 bildfrågor tom prompt, §2.11 dubbletter/unikhet, §3.2b kursunderlaget vinner, §3.2c skyddad källfil, §7.1 ämnesöverlapp i delad JSON. QA-checklista och känt-fel-lista uppdaterade.
- **Maskinell håndhävning av quiz-reglerna**: ny `scripts/validate_quiz.py` (bildprompt, dubblett-id, tomma/duplicerade alternativ, MC-antal, äkta dubblettfrågor = FEL; längdbias, parentes-asymmetri, självbesvarande, numerisk asymmetri = VARNING). Kopplad som git pre-commit-grind (`.githooks/pre-commit` + `core.hooksPath`, kollar bara stageade filer) och som Claude Code PostToolUse-hook (`scripts/quiz_hook.sh` i `.claude/settings.json`). Verktyget `scripts/apply_distractor_patch.py` för längdbias-svepet. `.claude/settings.local.json` gitignoread.
- VERSION/APP_VERSION/index.html-cachebuster → 0.9.140.

## 0.9.139
- **Medicinsk sekreterare klart – alla 6 ämnen byggda** (600 nya MC-frågor i ny fil `data/medicinsk_sekreterare.json`, terminologifokus enligt användarens direktiv: sv/latin-namngivning, resonemang, grundläggande diagnosmetodik och journalförkortningar):
  - **Termens byggstenar** (`medsek_termens_byggstenar`) – prefix (hypo-/hyper-, brady-/tachy-, poly-/oligo- m.fl.), suffix (-itis, -om, -os, -ektomi, -tomi, -skopi, -algi, -plegi m.fl.), ordstammar, bindevokal, försvenskningsregler (ph→f, ae→e, c→k) samt sv/latin-glosor för grundorgan.
  - **Medicinsk latin: grammatik & deklinationer** (`medsek_latin_deklinationer`) – nytt renodlat ämne (utökning från 5 till 6 ämnen på användarens uttryckliga begäran): substantivens fem deklinationer, genus, kasusböjning (nominativ/genitiv, t.ex. "ossis", "cordis", "hepatis"), adjektivkongruens (t.ex. "arteria carotis communis", "musculus gluteus maximus"), grekisk-latinska lånord.
  - **Läges-, riktnings- & rörelsetermer** (`medsek_lages_riktning_rorelse`) – anatomisk grundposition, kroppsplan, riktningstermer (medial/lateral, proximal/distal m.fl.), rörelsetermer (flexio/extensio, abductio/adductio m.fl.), kroppsregioner och kroppshåligheter, samt vanliga latinska strukturbeskrivande termer (fossa, sulcus, crista, foramen, processus m.fl.) – genomgående sv/latin-par.
  - **Organsystemen & deras terminologi** (`medsek_organsystemen_terminologi`) – organnamn sv/latin system för system (cirkulation, andning, matsmältning, urinvägar, nervsystem, rörelseapparat, hormonsystem, fortplantning, hud, immunsystem).
  - **Sjukdoms-, symtom- & åtgärdstermer** (`medsek_sjukdom_symtom_atgard`) – vanliga diagnoser/ingrepp (appendicit, kolecystit, artros, trombos m.fl.), symtomtermer (dyspné, ikterus, hematuri m.fl.), grundläggande diagnosmetodik (anamnes, status, differentialdiagnos, auskultation/palpation/perkussion/inspektion) samt vanliga journalförkortningar (p.o., i.v., vb, u.a., AT, BT m.fl.).
  - **Diagnosklassificering & kodning** (`medsek_diagnoskodning`) – ICD-10(-SE) kapitelstruktur (A00–Z99), huvud-/bidiagnos, Z-koder och yttre orsakskoder, KVÅ och dess NCSP-baserade kirurgidel, DRG-systemet, kodningskvalitet och sekretess enligt Socialstyrelsens klassifikationer och patientdatalagen.
  - `UTBILDNINGAR_REGLER.md` uppdaterat med det utökade 6-ämnesupplägget. Alla sex ämnen avkommenterade i `index.html` (`#topic`, med `(MC)`-tagg), tillagda i `js/info.js`, samt ny path-mapping (`medsek_`-prefix) i `js/app.js`. Samtliga 600 frågor kontrollerade unika (inga dubbletter av id eller frågetext, ingen överlappning mellan ämnena).
- VERSION/APP_VERSION/index.html- och info.html-cachebuster → 0.9.139.

## 0.9.138
- **Röntgensjuksköterska klart – alla 15 ämnen byggda** (500 nya MC-frågor i `data/rontgensjukskoterska.json`, nu 1500 frågor totalt över 15 ämnen):
  - **Andning & rörelse** (`rtg_andning_rorelse`) – andningsmuskulatur/-fysiologi, andhållningsteknik och Valsalvamanöver, andnings-/EKG-gating vid CT/MR, 4D-CT och DIBH inför strålbehandling, frenikuspares/sniff test, lungultraljud (A-/B-linjer, lung sliding), rörelseartefakter (peristaltik, sväljning, tremor) och hantering av dem.
  - **Snittanatomi** (`rtg_snittanatomi`) – kardinalplanen och radiologisk konvention, MPR/MIP/MinIP/VRT, isotropiska voxlar och partial volume-effekt, typiska strukturer på namngivna axiala nivåer (carina, njurhilum, aortabifurkation m.fl.), plansval för specifika leder/organ (knäets ledband, hjärtats kort-/långaxelvyer, prostata), BI-/PI-/TI-/LI-RADS.
  - **Projektionslära & lägesterminologi** (`rtg_projektionslara`) – patientlägen (supint/pront/decubitus/Trendelenburg/Fowler/Sims), projektionsnomenklatur (AP/PA/lateral/oblik/axial/tangentiell) och obliksförkortningar (RAO/LPO m.fl.), SID/OID och geometrisk distorsion, kroppstyper (sthenisk–astenisk), grid/kollimering, strålskyddets tre grundprinciper.
  - **Modalitetsspecifik bildanatomi** (`rtg_modalitetsspecifik`) – hur samma vävnad (ben, vätska, luft, fett, metall, kalk, blod) framställs på röntgen/CT vs. MR vs. ultraljud, kontrastmekanismer per modalitet, artefakter (susceptibilitet, chemical shift, anisotropi, akustisk skugga/förstärkning), grå/vit substans-kontrast, nuklearmedicinska hot/cold spots.
  - **Kontrastmedel & fördelning** (`rtg_kontrastmedel`) – jod/gadolinium/mikrobubbel-kontrast, NSF och gadoliniumretention, distributionsfaser (artär/portovenös/sen), oral/rektal/intraartikulär/intratekal administrering, bariumkontraindikation vid perforation, reaktionsklassificering och premedicinering, extravasering, dual-energy CT (VNC/jodkartor).
  - Alla fem ämnen avkommenterade i `index.html` (`#topic`, med `(MC)`-tagg) och tillagda i `js/info.js`. Samtliga 1500 frågor i filen kontrollerade unika (inga dubbletter av id eller frågetext, ingen överlappning mellan ämnena).
- VERSION/APP_VERSION/index.html- och info.html-cachebuster → 0.9.138.

## 0.9.137
- **Röntgensjuksköterska: tio ämnen byggda** (1000 nya MC-frågor i ny fil `data/rontgensjukskoterska.json`, topografisk och funktionell bildanatomi):
  - **Thorax** (`rtg_thorax`) – lung- och mediastinallobering/fissurer, hilumanatomi, hjärtsilhuettens konturer och cardiothoracic ratio, revben/sternum, PA/lateral/lordotisk/decubitusprojektion, normala varianter och fallgropar (companion shadow, azygoslob, sail sign, silhouette sign).
  - **Buk & retroperitoneum** (`rtg_buk_retroperitoneum`) – lever-/pankreas-/mjältanatomi, retro- vs. intraperitoneala organ, portakärlens anatomi, ligament och bukhinnerecesser (Morisons ficka, bursa omentalis), CT-kontrastfaser, urografins faser.
  - **Skelett & extremiteter** (`rtg_skelett_extremiteter`) – karpal-/tarsalben, armbågens fettpad-tecken, frakturklassifikation (Salter-Harris, Colles/Smiths/Monteggia/Galeazzi, Bennetts/Rolando, Jones/Lisfranc), DXA/osteoporosdiagnostik, ledtyper.
  - **Columna/ryggrad** (`rtg_columna`) – kotanatomi per region, ryggmärgens/cauda equinas anatomi, scottie dog-tecknet, spondylolys/-listes, traumaklassifikation (Jefferson/Hangman's/Chance/burst), spinal stenos och Modic-liknande degenerativa fynd.
  - **Skalle & hjärna** (`rtg_skalle_hjarna`) – kraniets ben/suturer/foramina, ventrikelsystem, Willis kärlring, epi-/subduralhematomens form, Hounsfield-enheter och fönsterinställningar, standardprojektioner (Towne/Caldwell/Waters/SMV).
  - **Huvud-hals & ansiktsskelett** (`rtg_huvud_hals`) – bihålor, käkled, spott-/sköldkörtel, larynxbrosk, carotis-/jugularisanatomi, ansiktsfrakturer (Le Fort, blow-out, ZMC), temporalben/hörselorgan.
  - **Bäcken & höft** (`rtg_backen_hoft`) – höftbenets tre delar, bäckenmått och pelvimetri, urogenitala organ, bäckenringsskador, Perthes/SCFE, spädbarnshöftultraljud (Graf-metoden).
  - **Kärlanatomi** (`rtg_karlanatomi`) – perifer artär-/venanatomi för angiografi, Seldingerteknik och interventionella grundbegrepp (PTA, stent, embolisering, TIPS, TACE, EVAR), aortadissektion/aneurysm, ABI.
  - **Cirkulation & hjärtfunktion** (`rtg_cirkulation_hjarta`) – hjärtcykelns fysiologi, retledningssystemet och EKG, EKG-gating/bolustracking vid hjärt-CT, myokardscintigrafi, klaffhemodynamik, koronardominans.
  - **Njurfunktion & utsöndring** (`rtg_njurfunktion`) – nefronets funktion, GFR/clearance, kontrastmedelshantering och post-kontrast njurskada, renografi (statisk/dynamisk/diures), njurpatologi (hydronefros, njursten, njurartärstenos).
  - Alla tio ämnen avkommenterade i `index.html` (`#topic`, med `(MC)`-tagg), tillagda i `js/info.js`, samt ny path-mapping (`rtg_`-prefix) i `js/app.js`. Kvarstår: Andning & rörelse, Snittanatomi, Projektionslära & lägesterminologi, Modalitetsspecifik bildanatomi, Kontrastmedel & fördelning. Samtliga 1000 frågor kontrollerade unika (inga dubbletter av id eller frågetext, ingen överlappning mellan ämnena).
- VERSION/APP_VERSION/index.html- och info.html-cachebuster → 0.9.137.

## 0.9.136
- **Biomedicinsk analytiker klart – alla 18 ämnen byggda** (600 nya MC-frågor i `data/biomedicinsk_analytiker.json`, nu 1800 frågor totalt över 18 ämnen):
  - **Klinisk neurofysiologi** (`bma_neurofysiologi`) – EEG (frekvensband, sömnstadier, epileptiforma mönster), EMG (motorenhet, insertionsaktivitet, denervering), neurografi (F-våg, H-reflex, demyelinisering vs. axonal skada, karpaltunnelsyndrom, Guillain-Barré), framkallade svar (VEP/BAEP/SEP) samt myastenia gravis/repetitiv nervstimulering.
  - **Njur-, gastrofysiologi & nuklearmedicin** (`bma_njur_gastro_nuklear`) – nuklearmedicinska grunder (radiofarmaka, gammakamera, SPECT/PET, strålskydd), njurscintigrafi/GFR-mätning, skelett-, lung- (V/Q-scan), lever- (HIDA) och sköldkörtelscintigrafi, myokardperfusion samt teranostik.
  - **Klinisk kemi & organmarkörer** (`bma_klinisk_kemi`) – lever- (ALAT/ASAT/ALP/GT/bilirubin), njur- (kreatinin/cystatin C/eGFR) och hjärtmarkörer (troponin/NT-proBNP), elektrolyter, blodfetter, glukos/HbA1c, proteiner/elfores, enzymkinetik/referensintervall, pankreasmarkörer, preanalytik och blodgas.
  - **Hematologi & transfusionsmedicin** (`bma_hematologi_transfusion`) – fördjupad anemidiagnostik (ferritin/transferrin, hemolysparametrar, Coombs test), hemoglobinopatier och membran-/enzymopatier, leukemi-/lymfomklassifikation (flödescytometri, cytogenetik, Philadelphiakromosom), myeloproliferativa sjukdomar, koagulationsutredning (hemofili, von Willebrand, DIC, trombofili, D-dimer) samt transfusionsmedicin (blodkomponenter, transfusionsreaktioner, aferes).
  - **Mikrobiologi & immunologi** (`bma_mikrobiologi_immunologi`) – bakteriologi (cellväggsstruktur, odling/resistensbestämning, antibiotikaklasser/-resistens), virologi (replikation, PCR/serologi/serokonversion), mykologi och parasitologi, samt sterilisering/desinfektion och vårdhygien. Avgränsat mot den redan djupgående immunologin i `bma_immun_lymfatiska` för att undvika dubbletter.
  - **Patologi & histopatologisk morfologi** (`bma_patologi`) – cellulär adaptation (hypertrofi/hyperplasi/atrofi/metaplasi/dysplasi), nekrostyper, inflammations- och sårläkningsmorfologi, neoplasi (nomenklatur, gradering/TNM-stadieindelning, metastasvägar), histopatologiska tekniker (HE/immunhistokemi/specialfärgningar/fryssnitt) samt cytologi och obduktionspatologi.
  - Alla sex ämnen avkommenterade i `index.html` (`#topic`, med `(MC)`-tagg) och tillagda i `js/info.js`. Samtliga 1800 frågor i filen kontrollerade unika inom respektive ämne (inga dubbletter av id eller frågetext).
- VERSION/APP_VERSION/index.html- och info.html-cachebuster → 0.9.136.

## 0.9.135
- **Biomedicinsk analytiker: sex nya ämnen klara** (600 nya MC-frågor i `data/biomedicinsk_analytiker.json`, nu 1200 frågor över 12 ämnen totalt):
  - **Matsmältning, lever & ämnesomsättning** (`bma_matsmaltning_lever`) – GI-kanalens och leverns/pankreas/gallvägarnas grovanatomi och histologi, digestions- och absorptionsfysiologi (GI-hormoner, enzymer, galla), leverns metabolism (glukoneogenes, ureacykeln, bilirubin/ikterus, detox) samt leverstatus/pankreasenzymer och vanliga GI-/leversjukdomar.
  - **Endokrina systemet** (`bma_endokrina`) – körtlarnas grovanatomi (hypofys, sköldkörtel, bisköldkörtlar, binjurar, pankreas, gonader), hypofyshormoner och hormonaxlar, sköldkörtel- och kalciumreglering, binjurebark/-märg, endokrin pankreas samt labdiagnostik (TSH/T4, HbA1c, dexametasonhämningstest).
  - **Immunsystem & lymfatiska organ** (`bma_immun_lymfatiska`) – lymfatiska organs anatomi/histologi, medfödd och förvärvad immunitet, antikroppar/immunglobulinklasser, överkänslighetsreaktioner typ I–IV, autoimmunitet/immunbrist samt labdiagnostik (CRP, SR, ANA, flödescytometri).
  - **Hjärtats elektrofysiologi & EKG** (`bma_ekg_elektrofys`) – EKG-kurvans grunder (P/QRS/T, PR/QT-intervall, ST-sträcka), avledningar och elaxel, vanliga arytmier/retledningsstörningar samt klinisk tolkning och referensvärden.
  - **Respirationsfysiologi & spirometri** (`bma_spirometri`) – spirometrins teknik och kvalitetskrav, flow-volymkurvan (obstruktivt/restriktivt mönster), reversibilitets-/provokationstest, kroppspletysmografi/DLCO samt referensvärden och klinisk tillämpning.
  - **Kärl- & cirkulationsfysiologi** (`bma_karl_cirkulationsfys`) – blodflödets fysik (Poiseuilles lag, laminärt/turbulent flöde), artärpuls, venös cirkulation, Dopplerultraljudsprinciper samt klinisk kärlultraljud (ABI, karotis-/venduplex) och D-dimer.
  - Alla sex ämnen avkommenterade i `index.html` (`#topic`, med `(MC)`-tagg) och tillagda i `js/info.js`. Samtliga 1200 frågor i filen kontrollerade unika inom respektive ämne (inga dubbletter av id eller frågetext).
- VERSION/APP_VERSION/app.js- och info.js-cachebuster → 0.9.135.

## 0.9.134
- **Biomedicinsk analytiker: Njurar & urinvägar klart.** Sjätte ämnet i BMA-utbildningen, 100 nya MC-frågor i `data/biomedicinsk_analytiker.json` (topic `bma_njurar_urinvagar`) om njurens och urinvägarnas grovanatomi (bark/märg, pyramider, calyces, njurbäcken, uretär/blåsa/uretra, afferent/efferent arteriol), nefronets struktur (glomerulus, Bowmans kapsel, proximala/distala tubuli, Henles slynga, samlingsrör, juxtaglomerulära apparaten, kortikala/juxtamedullära nefron), glomerulär filtration (filtrationsbarriären, GFR, Starling-krafter, renal autoreglering, tubuloglomerulär feedback), tubulär reabsorption/sekretion (glukoströskel, countercurrent-multiplikation, ADH/akvaporiner, aldosterons angreppspunkt, syra-basreglering), njurfunktionsmått (clearance, kreatinin, eGFR, urea/BUN, cystatin C) samt urinproduktion/miktion/labdiagnostik (urinsticka, proteinuri/hematuri/glukosuri/pyuri, miktionsreflexen, nefrotiskt/nefritiskt syndrom). Källor bl.a. Moore/Dalley/Agur, Guyton & Hall, Junqueira & Mescher, McPherson & Pincus (Henry's). Ämnet avkommenterat i `index.html` (`#topic`, med `(MC)`-tagg) och tillagt i `js/info.js`. Alla 100 frågor i ämnet kontrollerade unika (inga dubbletter av id eller frågetext).
- VERSION/APP_VERSION/app.js- och info.js-cachebuster → 0.9.134.

## 0.9.133
- **Biomedicinsk analytiker: Nervsystem & muskler klart.** Femte ämnet i BMA-utbildningen, 100 nya MC-frågor i `data/biomedicinsk_analytiker.json` (topic `bma_nervsystem_muskler`) om CNS grovanatomi (storhjärna, hjärnstam, lillhjärna, ryggmärgens grå/vita substans, för-/bakhorn, meninger, likvor, blod-hjärnbarriären), PNS-struktur (endo-/peri-/epineurium, Schwannceller/oligodendrocyter, nervfiberklasser, dermatom, plexus, sympatikus/parasympatikus ursprung), neuronens elektrofysiologi (vilopotential, depolarisation/repolarisation, tröskelvärde, allt-eller-inget, refraktärperiod, saltatorisk ledning), synaptisk transmission (vesikelfrisättning, EPSP/IPSP, acetylkolin/GABA/glutamat), neuromuskulär överföring & muskelkontraktion (motorändplattan, sarkomer, sliding filament, troponin/tropomyosin, tvärbryggscykeln, muskelfibertyper) samt kliniskt/labperspektiv (CK, myoglobin/rabdomyolys, myasthenia gravis, dystrofin/Duchenne, EMG/neurografi). Källor bl.a. Moore/Dalley/Agur, Guyton & Hall, Junqueira & Mescher, McPherson & Pincus (Henry's). Ämnet avkommenterat i `index.html` (`#topic`, med `(MC)`-tagg) och tillagt i `js/info.js`. Alla 100 frågor i ämnet kontrollerade unika (inga dubbletter av id eller frågetext).
- VERSION/APP_VERSION/app.js- och info.js-cachebuster → 0.9.133.

## 0.9.132
- **Biomedicinsk analytiker: Respiration & lungor klart.** Fjärde ämnet i BMA-utbildningen, 100 nya MC-frågor i `data/biomedicinsk_analytiker.json` (topic `bma_respiration_lungor`) om luftvägarnas anatomi/histologi (näshåla, respiratoriskt epitel, trakea, bronker, pleura, lunglober), alveoler & gasutbyte (pneumocyter typ I/II, surfaktant, blod-luftbarriären, V/Q-kvot, dead space), andningsmekanik & lungvolymer (diafragma, pleuratryck, tidalvolym, RV/ERV/IRV, VC/TLC/FRC, compliance), andningsreglering (medulla/pons, centrala/perifera kemoreceptorer, hypoxisk drivkraft, Hering–Breuers reflex, n. phrenicus), gastransport (oxyhemoglobin, syrgasdissociationskurvan, Bohreffekten, CO2-transport, kloridskiftet) samt blodgaser/labdiagnostik och patofysiologi (arteriell blodgas, pulsoximetri, hypoxemi/hyperkapni, syra-basrubbningar, KOL/emfysem/astma/pneumothorax). Källor bl.a. Moore/Dalley/Agur, Guyton & Hall, Junqueira & Mescher, McPherson & Pincus (Henry's Clinical Diagnosis and Management by Laboratory Methods). Ämnet avkommenterat i `index.html` (`#topic`, med `(MC)`-tagg) och tillagt i `js/info.js`. Alla 100 frågor i ämnet kontrollerade unika (inga dubbletter av id eller frågetext).
- VERSION/APP_VERSION/app.js- och info.js-cachebuster → 0.9.132.

## 0.9.131
- **Biomedicinsk analytiker: Hjärta & cirkulation klart.** Tredje ämnet i BMA-utbildningen, 100 nya MC-frågor i `data/biomedicinsk_analytiker.json` (topic `bma_hjarta_cirkulation`) om hjärtats grovanatomi (kammare, klaffar, perikard, kranskärl), retledningssystemet (SA-/AV-nod, His-bunte, Purkinjefibrer, pacemakerpotential, autonom påverkan), hjärtcykeln (systole/diastole, hjärttoner, slagvolym, ejektionsfraktion, hjärtminutvolym, Frank–Starling, pre-/afterload), hemodynamik/blodtrycksreglering (baroreceptorreflexen, RAAS, ADH, ANP, perifert kärlmotstånd) samt kärlträdets histologi/topografi och kliniska hjärtbiomarkörer (troponin, NT-proBNP, CK-MB, lipidstatus). Källor bl.a. Moore/Dalley/Agur (Clinically Oriented Anatomy), Guyton & Hall (Textbook of Medical Physiology), Junqueira & Mescher (Basic Histology), McPherson & Pincus (Henry's Clinical Diagnosis and Management by Laboratory Methods). Ämnet avkommenterat i `index.html` (`#topic`, med `(MC)`-tagg) och tillagt i `js/info.js`. Alla 100 frågor i ämnet kontrollerade unika (inga dubbletter av id eller frågetext).
- VERSION/APP_VERSION/app.js- och info.js-cachebuster → 0.9.131.

## 0.9.130
- **Knapp för medicinsk ordlista på framsidan.** Ny knapp "Medicinsk ordlista" (länk till `medicinskordlista.html`) tillagd i samma rad som "Kunskapsbank" i `index.html`, placerad till vänster om den.
- VERSION/APP_VERSION/app.js- och info.js-cachebuster → 0.9.130.

## 0.9.129
- **Utbildningsförkortning flyttad i topplistan.** I "Senaste resultaten" och "Bästa resultat" stod utbildningsförkortningen tidigare EFTER ämnesnamnet, t.ex. "Handen (FYS)". Nu står den FÖRE i stället: "(FYS) Handen". Ändrat i `renderScoreList()` och `renderBestList()` i `js/app.js`.
- VERSION/APP_VERSION/app.js- och info.js-cachebuster → 0.9.129.

## 0.9.128
- **Biomedicinsk analytiker: Blod & blodbildning klart.** Andra ämnet i BMA-utbildningen, 100 nya MC-frågor i `data/biomedicinsk_analytiker.json` (topic `bma_blod_blodbildning`) om blodets sammansättning (plasma, plasmaproteiner, hematokrit), erytrocyter (struktur, hemoglobin, erytropoes/EPO, nedbrytning, anemityper, MCV/MCH), leukocyter (granulocyter/agranulocyter, funktioner, differentialräkning), trombocyter/megakaryocyter, hematopoes (benmärg, stamcellslinjer, fostrets blodbildning, tillväxtfaktorer, leukemi/aplastisk anemi), hemostas (primär/sekundär hemostas, koagulationskaskaden, fibrinolys) samt blodgrupper (ABO, Rh, korstest) och vanliga labmetoder/referensvärden (blodstatus, blodutstryk, PK/INR, APTT). Källor bl.a. Junqueira & Mescher (Basic Histology), Ross & Pawlina (Histology: A Text and Atlas), Guyton & Hall (Textbook of Medical Physiology), Hoffbrand & Moss (Essential Haematology). Ämnet avkommenterat i `index.html` (`#topic`, med `(MC)`-tagg) och tillagt i `js/info.js`. Alla 200 frågor i filen kontrollerade unika (inga dubbletter av id eller frågetext).
- VERSION/APP_VERSION/app.js- och info.js-cachebuster → 0.9.128.

## 0.9.127
- **Biomedicinsk analytiker påbörjad: Cell & vävnad (morfologi) klart.** Första ämnet i BMA-utbildningen, 100 nya MC-frågor i `data/biomedicinsk_analytiker.json` (topic `bma_cell_vavnad`) om cellbiologi (cellmembran/transport, organeller, cellkärna/DNA-RNA, cellcykel/mitos/meios/apoptos) och kroppens fyra vävnadsslag (epitel, bindväv, muskelvävnad, nervvävnad) samt grundläggande histologiska tekniker (HE-färgning, mikrotom, elektronmikroskopi, immunohistokemi). Källor bl.a. Junqueira & Mescher (Basic Histology), Ross & Pawlina (Histology: A Text and Atlas), Alberts m.fl. (Molecular Biology of the Cell). Ämnet avkommenterat i `index.html` (`#topic`, med `(MC)`-tagg) och tillagt i `js/info.js`. Testat end-to-end headless (puppeteer-core mot google-chrome): Starta fungerar, fråga+4 svarsalternativ renderas, svar går att klicka, inga konsolfel.
  - Byggordningen i `UTBILDNINGAR_REGLER.md` omstrukturerad på begäran: Läkare och Sjuksköterska flyttade till näst sist respektive näst näst sist (direkt före Arbetsterapeut-referensavsnittet, som alltid ligger sist). Ingen innehållsändring, bara omflyttning.
- VERSION/APP_VERSION/app.js- och info.js-cachebuster → 0.9.127.

## 0.9.126
- **Tandläkare klart, alla 5 ämnen.** De fyra sista ämnena i tandläkarutbildningen byggda, 400 nya MC-frågor i `data/tandlakare.json` (totalt 500 frågor, 100/ämne × 5):
  - **Käkar & käkled (TMJ)** (`tandlakare_kakar_kakled`) — maxillans och mandibelns anatomi (foramen/utskott/kanaler), käkledens uppbyggnad (discus articularis, ledrum, ligament, bilaminära zonen), tuggmusklerna (temporalis/masseter/pterygoideus medialis/lateralis) med innervation och rörelsemönster, ocklusionsbegrepp (centrisk relation/ocklusion, Bennett-rörelse, incisal/kondylär styrning) samt klinisk koppling (TMD, luxation, ankylos, mandibelfraktur). Källor bl.a. Moore/Dalley/Agur, Netter (Head and Neck Anatomy for Dentistry), Okeson (Management of TMD and Occlusion), Gray's Anatomy.
  - **Munhåla & munbotten** (`tandlakare_munhala_munbotten`) — tungans yttre/inre muskler och innervation (hypoglossus/lingualis/chorda tympani/glossopharyngeus/vagus), gommen och fauces, kinden (buccinator, Bichats fettkropp), munbottens topografi (mylohyoideus, sublinguala/submandibulära rummet, Whartons/Stensens gångar), kärl/lymfkörtlar samt svalgmuskulaturen (konstriktorer, stylopharyngeus). Klinisk koppling: Ludwigs angina, ranula, ankyloglossi.
  - **Huvud-hals: kärl & nerver** (`tandlakare_huvud_hals_karl_nerver`) — mimisk muskulatur och n. facialis (grenar, pes anserinus, Bells pares), n. trigeminus fördjupning (tre divisioner, foramina, ganglion trigeminale), a. carotis externas grenar och a. maxillaris grenar, venöst dränage, halsens lymfkörtelnivåer, samt spottkörtlarnas parasympatiska/sympatiska innervationsbanor (inkl. Freys syndrom). Medvetet avgränsat mot tuggmuskulaturen (redan i Käkar & käkled) för att undvika dubbletter.
  - **Salivkörtlar & oral fysiologi** (`tandlakare_salivkortlar_oral_fys`) — storspottkörtlarnas histologi (serösa/mukösa acini, myoepitelceller, gångsystem), mindre spottkörtlar (von Ebners körtlar), salivens sammansättning/funktioner (amylas, mucin, statherin, buffertsystem), reglering av sekretion (salivatoriska reflexen, dygnsvariation), smakfysiologi (T1R/T2R, gustducin, gustatoriska banan) och oral sensorik (trigeminal kemestesi, oral stereognosi). Klinik: xerostomi, Sjögrens syndrom, sialoadenit.
  - Alla fyra avkommenterade i `index.html` (`#topic`, med `(MC)`-tagg) och tillagda i `js/info.js`. Testat end-to-end headless (puppeteer-core mot google-chrome) för samtliga 5 ämnen: Starta fungerar, frågor + 4 svarsalternativ renderas, inga konsolfel. Alla 500 frågor kontrollerade unika (inga dubbletter, varken internt eller mot tidigare byggda ämnen).
- VERSION/APP_VERSION/app.js- och info.js-cachebuster → 0.9.126.

## 0.9.125
- **Tandläkare påbörjad: Tand & parodontium klart.** Första ämnet i tandläkarutbildningen, 100 nya MC-frågor i `data/tandlakare.json` (topic `tandlakare_tand_parodontium`) om tandens hårdvävnader och stödjeapparat: emalj (ameloblaster, prismor, Hunter–Schreger-band, Retziuslinjer), dentin (odontoblaster, dentintubuli, pre-/sekundär-/tertiärdentin), pulpa (cellskikt, innervation, blodförsörjning via foramen apicale), cement (acellulärt/cellulärt, Sharpeys fibrer), parodontalligamentet (fibergrupper, epitelresterna av Malassez), alveolarben (lamina dura, buntben), gingiva (fri/fäst gingiva, fästepitel, stippling), tandutveckling (knopp-/kapsel-/klockstadiet, Hertwigs epitelskida) samt tandmorfologi, numrering/ocklusion och klinisk koppling (karies, parodontit, attrition/abrasion/erosion). Källor bl.a. Nanci (Ten Cate's Oral Histology), Berkovitz/Holland/Moxham, Fehrenbach & Popowics, Scheid & Weiss (Woelfel's Dental Anatomy), Newman/Takei/Klokkevold/Carranza (Clinical Periodontology). Ämnet avkommenterat i `index.html` (`#topic`, med `(MC)`-tagg) och tillagt i `js/info.js`.
- VERSION/APP_VERSION/app.js- och info.js-cachebuster → 0.9.125.

## 0.9.124
- **Logoped klart, alla 6 ämnen.** De tre sista ämnena i logoped-utbildningen byggda, 300 nya MC-frågor i `data/logoped.json` (totalt 600 frågor, 100/ämne × 6):
  - **Sväljningsapparaten** (`logoped_svaljning`) — sväljningens tre faser (oral, faryngeal, esofageal), struphuvudets trippelskydd av luftvägen, UES/cricopharyngeus, esofagusanatomi och peristaltik, sväljningscentrum i hjärnstammen (nucleus tractus solitarius/ambiguus), inblandade kranialnerver (V, VII, IX, X, XII), samt dysfagi (aspiration/penetration, Zenkers divertikel, VFSS/FEES). Källa bl.a. Logemann, Evaluation and Treatment of Swallowing Disorders.
  - **Neuroanatomi för tal & språk** (`logoped_neuroanatomi_tal`) — hjärnans lober, Brocas/Wernickes område, fasciculus arcuatus, hemisfärlateralisering, afasityper (Broca/Wernicke/global/konduktion/anomisk/transkortikal), corticobulbära banan och övre/nedre motorneuron, dysartrityper (spastisk/slapp/ataktisk/hypokinetisk/hyperkinetisk), samt hjärnans kärlförsörjning (a. cerebri media, Willis ring) kopplat till stroke/afasi. Källor bl.a. Kandel/Schwartz/Jessell, Duffy (Motor Speech Disorders).
  - **Örat & hörselsystemet** (`logoped_orat_horsel`) — ytteröra, mellanöra (hörselben, örontrumpet, m. tensor tympani/stapedius), innerörats cochlea (Cortis organ, tonotopi, hårceller) och vestibularapparat (båggångar, otoliter), hela hörselbanan (cochleariskärnor → övre olivkomplexet → inferior colliculus → hörselcortex), samt klinik (konduktiv/sensorineural hörselnedsättning, otoskleros, Menieres sjukdom, cochleaimplantat). Källor bl.a. Gelfand (Hearing), Kandel/Schwartz/Jessell.
  - Alla tre avkommenterade i `index.html` (`#topic`, med `(MC)`-tagg) och tillagda i `js/info.js`.
- VERSION/APP_VERSION/app.js- och info.js-cachebuster → 0.9.124.

## 0.9.123
- **Logoped: Artikulation & resonans (ansatsröret) klart.** Tredje ämnet i logoped-utbildningen, 100 nya MC-frågor i `data/logoped.json` (topic `logoped_artikulation_resonans`) om ansatsröret som helhet, läppar/kinder (m. orbicularis oris, m. buccinator), tänder och käkar (TMJ, tuggmuskulatur, n. trigeminus), tungan (yttre/inre muskler, n. hypoglossus, sensorisk innervation per tungtredjedel), mjuka gommen och velofaryngeal funktion (m. levator/tensor veli palatini, Passavants list, hyper-/hyponasalitet), hårda gommen, svalgets tre delar och muskellager, näshåla/bihålor samt mimisk muskulatur (n. facialis). Ämnet avkommenterat i `index.html` (`#topic`, med `(MC)`-tagg) och tillagt i `js/info.js`.
- VERSION/APP_VERSION/app.js- och info.js-cachebuster → 0.9.123.

## 0.9.122
- **Logoped: Röst-/fonationsapparaten (larynx) klart.** Andra ämnet i logoped-utbildningen (efter Andningsapparaten), 100 nya MC-frågor i `data/logoped.json` (topic `logoped_larynx_fonation`) om struphuvudets brosk (sköld-, ring-, arytenoid-, corniculat-, kuneiform- och epiglottisbrosket), membran/ligament (conus elasticus, membrana quadrangularis, cricothyroidligamentet), stämbandens uppbyggnad (Hiranos cover-body-modell, Reinkes rum), inre och yttre struphuvudmuskler med innervation (n. laryngeus superior/recurrens), fonationsfysiologi (myoelastisk-aerodynamisk teori) och vanliga röststörningar (knutor, polyper, Reinkes ödem, recurrenspares, spasmodisk dysfoni). Ämnet avkommenterat i `index.html` (`#topic`) och tillagt i `js/info.js` (ämneslistan på infosidan).
- VERSION/APP_VERSION/app.js- och info.js-cachebuster → 0.9.122.

## 0.9.121
- **Sökfältet "Sök ämne i alla utbildningar" flyttat.** Låg tidigare ovanför Ämne-rubriken/dropdownen, vilket kändes fel eftersom det bröt av flödet Utbildning → Ämne. Ligger nu under `#topic`-selecten och MC/FC/TF-förklaringen (`#topicLegend`), som en tydligare egen genväg efter huvudvalen. Ingen logikändring — bara flyttad markup i `index.html`.
- VERSION/APP_VERSION/app.js- och info.js-cachebuster → 0.9.121.

## 0.9.120
- **Topplistan: utbildning efter ämnet + klockslag borttaget.** Varje rad i "Senaste resultaten" och "Bästa resultat" visar nu utbildningen som en trebokstavsförkortning i parentes efter ämnesnamnet, t.ex. "Axel/skulderkomplex (FYS)". Löses dynamiskt via `eduAbbrevFor()` som slår upp resultatets sparade ämnesvärde i `allTopicOptions` (samma data `#topic` redan fyllts med) → ingen egen ämne-till-utbildning-lista att underhålla; nya ämnen får automatiskt rätt förkortning. Saknas ämnet (borttaget/omdöpt sedan resultatet sparades) visas bara ämnesnamnet, ingen förkortning. Datumkolumnen visar nu bara datum (t.ex. "2026-07-03"), klockslaget är borttaget.
  - Förkortningar: ALM (Allmänt), APO (Apotekare), ATB (Arbetsterapeut), AUD (Audionom), BMA (Biomedicinsk analytiker), FYS (Fysioterapeut), LOG (Logoped), LÄK (Läkare), MSK (Medicinsk sekreterare), OPT (Optiker), RSK (Röntgensjuksköterska), SSK (Sjuksköterska), TLK (Tandläkare).
- VERSION/APP_VERSION/app.js- och info.js-cachebuster → 0.9.120.

## 0.9.119
- **Sökfält "Sök ämne i alla utbildningar" på startsidan.** Diskret sökruta ovanför Ämne-dropdownen. Filtrerar `#topic`-listan i bakgrunden medan man skriver (fortsatt en helt vanlig native `<select>`, ingen custom dropdown-komponent) och söker då tvärs över ALLA utbildningar oavsett vald Utbildning, inte bara det aktuella urvalet. Ämnen från en annan utbildning än den valda får utbildningsnamnet inom parentes i etiketten, t.ex. "Andningsapparaten (Logoped) (MC)" — infogat FÖRE MC/FC/TF-taggen så `typeTagOf()` fortsatt läser rätt tagg och Starta-knapparna inte skuggas felaktigt. Väljer man en träff från en annan utbildning synkas Utbildning-dropdownen automatiskt dit och sökfältet töms (`syncEducationToSelectedTopic()`). Sökningen matchar både ämnesnamn och utbildningsnamn, case-/å-ä-ö-okänslig (`toLocaleLowerCase('sv-SE')`), och visar "Inga ämnen matchar sökningen" vid nollträff. Helt dynamisk: listan byggs ur samma `allTopicOptions` som redan fylls från `#topic`-markupen vid start (`captureTopicOptions()`), så nya ämnen som byggs in i appen dyker automatiskt upp i sökningen utan någon egen underhållslista. Testat headless (Playwright) mot flera scenarier: korsutbildningsträff + auto-synk, tom sökning, nollträff, versaler/gemener, sökning på utbildningsnamn — inga JS-fel.
- styles.css-cachebustern sitewide → 0.7.28 (alla 101 HTML-sidor); VERSION/APP_VERSION/app.js- och info.js-cachebuster → 0.9.119.

## 0.9.118
- **Antal frågor + Svårighetsgrad på samma rad på startsidan.** De två dropdownarna låg tidigare staplade var för sig under varandra; nu wrappas de i `.setup-row` (flex, två `.setup-field`-kolumner) så de delar rad. `el('numQuestions')`/`el('difficulty')` läses fortfarande via id, så JS-logiken är opåverkad.
- styles.css-cachebustern sitewide → 0.7.27 (alla 101 HTML-sidor); VERSION/APP_VERSION/app.js- och info.js-cachebuster → 0.9.118.

## 0.9.117
- **Logoped, ämne 1/6: Andningsapparaten (100 MC-frågor) – utbildningen påbörjad.** Första ämnet i logoped-utbildningen enligt `UTBILDNINGAR_REGLER.md`; lins struktur → muskler & nervförsörjning (kranialnerver/n. phrenicus) → funktion i tal/röst/sväljning → avvikelse/störning. Täcker övre/nedre luftvägars anatomi (näshåla, farynx, larynx som gräns, trakea, bronkträd, lunglober, pleura, mediastinum), andningsmuskulatur och -mekanik (diafragma, externa/interna interkostalmuskler, bukmuskler, accessoriska muskler, pump-/skopskaftsrörelse, passiv vs aktiv utandning, "checking action"), lungvolymer (tidalvolym, vitalkapacitet, FRC, residualvolym, compliance), innervation (n. phrenicus C3–C5, interkostalnerver, andningscentrum i medulla/pons, kemoreceptorer, n. vagus/n. trigeminus-reflexer, kortikal kontroll av talandning) samt kliniska avvikelser med tydlig logopedisk relevans (KOL, astma, paradoxal andning, dysartri, spirometri, maximal fonationstid, s/z-kvot, trakeostomital/Passy-Muir-ventil, ventilatorstödd talandning, skolios, emfysem, restriktiv lungsjukdom, hypofonisk röst). Höll avstånd till stämläpps-/fonationsdetaljer som hör till nästa ämne (Röst-/fonationsapparaten) genom att bara nämna subglottiskt tryck som brygga. Källor: Seikel/King/Drumright (Anatomy & Physiology for Speech, Language, and Hearing), Zemlin (Speech and Hearing Science), Hixon/Weismer/Hoit (Preclinical Speech Science), Boone & McFarlane (The Voice and Voice Therapy), Sobotta (Atlas of Anatomy), Lännergren m.fl. (Fysiologi). Tillagt i ny delad fil `data/logoped.json` (`logoped_andningsapparaten`), option avkommenterad med `(MC)`-tagg, routing i `js/app.js` samt statistikrad i `js/info.js`.
- VERSION/APP_VERSION/app.js- och info.js-cachebuster → 0.9.117.

## 0.9.116
- **Fysioterapeut, ämne 14/14: Tränings-/arbetsfysiologi (100 MC-frågor) – utbildningen färdigbyggd.** Sista ämnet i fysioterapeut-utbildningen; lins grundläggande träningsprinciper (överbelastning, specificitet, progression, reversibilitet, FITT, superkompensation, periodisering, överträning) → konditionsträning (centrala/perifera anpassningar, laktattröskel, HIIT vs kontinuerlig träning, relativ vs absolut intensitet) → styrketräning (1RM, belastning/repetitionsupplägg för styrka/hypertrofi/uthållighet, neurala vs muskulära anpassningar, excentrisk träning, cross education) → rörlighet/uppvärmning (statisk/dynamisk/PNF-stretching, nedvarvning) → återhämtning/näring (sömn, kolhydrater/protein, RPE/Borgskalan, MET) → klinisk fysioterapeutisk tillämpning (FITT i rehab, progressiv belastning efter kirurgi, individualisering, hjärtfrekvensåterhämtning, core-stabilitet). Höll avstånd till redan täckta fakta i Kardiovaskulär & respiratorisk fysiologi (VO2 max-komponenter, cardiac output) och Muskelfysiologi (energisystem, DOMS, sarkopeni) genom att fokusera på just tränings-/belastningsperspektivet; sparade medvetet frågan om tränade idrottares låga vilopuls hit istället för till kardio-ämnet. Källor: Lännergren m.fl. (Fysiologi), Magee (Orthopedic Physical Assessment). Tillagt i `data/fysioterapeut.json` (`fysio_traning_arbetsfys`), option avkommenterad med `(MC)`-tagg. **Fysioterapeut har nu alla 14 planerade ämnen enligt UTBILDNINGAR_REGLER.md.**
- VERSION/APP_VERSION/app.js- och info.js-cachebuster → 0.9.116.

## 0.9.115
- **Fysioterapeut, ämne 13/14: Motorisk utveckling & åldrande (100 MC-frågor).** Första av de två övergripande temaämnena; lins grundprinciper (cefalokaudal/proximodistal, mognadsteori vs dynamisk systemteori) → spädbarnets motoriska milstolpar (0–2 år) → primitiva reflexer och deras integrationsåldrar → postural kontroll/balansutveckling → motorisk utveckling barn/ungdom → åldrande muskuloskeletalt (dynapeni, funktionell reserv, skörhet/frailty) → åldrande balans/gång/fallrisk (multifaktoriellt) → klinisk tillämpning över livscykeln. Täcker milstolpar (huvudkontroll, rullning, sittande, krypande, gående, pincergrepp), Moro/palmar grasp/rooting/stegreflex/ATNR med integrationsåldrar, upprätnings- och jämviktsreaktioner, sensorisk vägning och Romberg, Fitts & Posners inlärningsstadier, samt hos äldre: dynapeni, gångförändringar (dubbelstöd, gångbas), multifaktoriell fallriskmodell (polyfarmaci, ortostatism, hemmiljö), Frieds skörhetskriterier och multikomponentträning. Höll medvetet avstånd till redan täckta fakta i Nervsystemet (reflexdefinition, balansorganets läge, fallrisk-nervperspektiv), Muskelfysiologi (sarkopeni) och Led-/skelettlära (osteoporos, broskåldrande) genom att välja kompletterande vinklar. Källor: Lundy-Ekman (Neuroscience: Fundamentals for Rehabilitation), Magee (Orthopedic Physical Assessment). Tillagt i `data/fysioterapeut.json` (`fysio_motorisk_utv_aldrande`), option avkommenterad med `(MC)`-tagg.
- VERSION/APP_VERSION/app.js- och info.js-cachebuster → 0.9.115.

## 0.9.114
- **Fysioterapeut, ämne 12/14: Smärtfysiologi (100 MC-frågor).** Lins nociception (receptorer, nervfibrer A-delta/C, transduktion/transmission/perception/modulering) → CNS-bearbetning (bakhorn, talamus, sensorisk-diskriminativ vs affektiv komponent, refererad smärta, fantomsmärta) → smärtmodulering (gate control, descenderande hämning, PAG, endogena opioider, träningsinducerad hypoalgesi) → perifer sensitisering (inflammatorisk soppa, primär hyperalgesi) → central sensitisering (wind-up, NMDA, sekundär hyperalgesi, allodyni) → smärtklassificering (nociceptiv/neuropatisk/nociplastisk, akut vs kronisk) → skattning & biopsykosocialt (VAS/NRS, kinesiofobi, fear-avoidance, katastrofiering) → klinisk fysioterapeutisk tillämpning (PNE, graderad exponering, aktiv träning). Undvek medvetet överlapp med de kliniska smärtfrågor som redan finns i de regionala ämnena (t.ex. red/yellow flags i Columna/ryggrad) genom att hålla detta ämne på den generella smärtfysiologiska nivån. Källor: Lundy-Ekman (Neuroscience: Fundamentals for Rehabilitation), Magee (Orthopedic Physical Assessment), Lännergren m.fl. (Fysiologi). Tillagt i `data/fysioterapeut.json` (`fysio_smartfysiologi`), option avkommenterad med `(MC)`-tagg.
- VERSION/APP_VERSION/app.js- och info.js-cachebuster → 0.9.114.

## 0.9.113
- **Fysioterapeut, ämne 11/14: Led- & skelettlära (100 MC-frågor).** Sista av de rent fysiologiska/basvetenskapliga ämnena innan de övergripande temana; lins struktur (benvävnad/ossifikation/brosk) → ledklassificering → ligament/senor → biomekanik (hävarmar/moment/mekaniska belastningstyper) → klinisk koppling/åldrande. Täcker kompakt vs spongiöst ben, osteon/Haverskanal, osteoblast/osteocyt/osteoklast, benmatrix (kollagen+hydroxyapatit), periost/endost, epifysplattan och tillväxt, intramembranös vs endokondral ossifikation, broskets tre typer (hyalint/elastiskt/fibrobrosk) och dess avaskularitet, ledklassificering (fibrösa/broskiga/synoviala, syn-/amfi-/diartroser), de sex synoviala ledtyperna (gångjärn/kul/sadel/plan/ellipsoid/vrid) och frihetsgrader, ligament vs senor och deras läkningsförmåga, hävstångsklasser I–III med kroppsexempel, vridmoment/hävarm/mekanisk fördel, kompression/skjuvning/torsion, Wolffs lag, samt artros vs reumatoid artrit, osteoporos, frakturläkningens fyra steg, osteomalaci och luxation/subluxation. Källor: Bojsen-Møller (Rörelseapparatens anatomi), Neumann (Kinesiology of the Musculoskeletal System), Magee (Orthopedic Physical Assessment), Lännergren m.fl. (Fysiologi). Tillagt i `data/fysioterapeut.json` (`fysio_led_skelett`), option avkommenterad med `(MC)`-tagg.
- VERSION/APP_VERSION/app.js- och info.js-cachebuster → 0.9.113.

## 0.9.112
- **Fysioterapeut, ämne 10/14: Kardiovaskulär & respiratorisk fysiologi (100 MC-frågor).** Tredje ämnet i de fysiologiska systemen; lins struktur → hjärtcykeln → retledning/EKG → cardiac output-reglering → blodtrycksreglering → respirationens struktur → ventilationsmekanik/lungvolymer → gasutbyte → syretransport → andningsreglering/akut arbetsrespons. Täcker hjärtats fyra rum och klaffar, kranskärl, systole/diastole och hjärtljud, retledningssystemet (SA-nod, AV-nod, His bunt, Purkinjefibrer) och EKG:s P-QRS-T, cardiac output/slagvolym/ejektionsfraktion, Frank-Starlings lag, pre-/afterload, autonom påverkan (inotropi/kronotropi), MAP/baroreceptorer/RAAS, perifert kärlmotstånd och autoregulering, luftvägarnas anatomi och andningsmuskulatur, pleura, lungvolymer/-kapaciteter och dödrymme, diffusion/Ficks lag/V-Q-matchning, hemoglobin och syrgasdissociationskurvan (Bohreffekten), koldioxidtransport, andningscentrum och kemoreceptorer, samt cirkulatoriska/respiratoriska akutsvar på fysiskt arbete (inkl. VO2 max). Källor: Lännergren m.fl. (Fysiologi), Sobotta (Atlas of Anatomy). Tillagt i `data/fysioterapeut.json` (`fysio_kardio_resp`), option avkommenterad med `(MC)`-tagg.
- VERSION/APP_VERSION/app.js- och info.js-cachebuster → 0.9.112.

## 0.9.111
- **Fysioterapeut, ämne 9/14: Muskelfysiologi (100 MC-frågor).** Andra ämnet i de fysiologiska systemen; lins anpassad till struktur → excitation-kontraktion → fibertyper → kontraktionstyper/mekanik → energiomsättning → trötthet → åldrande/klinik. Täcker sarkomerens uppbyggnad (Z-linje, A-/I-band, H-zon, aktin/myosin/troponin/tropomyosin/titin), sarkoplasmatiska retikulet/T-tubuli/triaden, glidfilamentteorin och tvärbryggecykeln (Ca²⁺-frisättning, power stroke, ATP:s roll, rigor), fibertyper (typ I/IIa/IIx, myoglobin, storleksprincipen), kontraktionstyper (isometrisk/koncentrisk/excentrisk/isotonisk, tetanus/summation, längd-spännings- och kraft-hastighetssambanden, stretch-shortening-cykeln), energisystemen (ATP/kreatinfosfat/anaerob glykolys/aerob oxidation, EPOC, laktatskytteln), perifer vs central trötthet och DOMS, samt sarkopeni, myopati (Duchenne), myasthenia gravis, CK och rabdomyolys. Källor: Lännergren m.fl. (Fysiologi), Neumann (Kinesiology of the Musculoskeletal System). Tillagt i `data/fysioterapeut.json` (`fysio_muskelfysiologi`), option avkommenterad med `(MC)`-tagg.
- VERSION/APP_VERSION/app.js- och info.js-cachebuster → 0.9.111.

## 0.9.110
- **Alt-text saknades på logotypen** (`img/anatomiquiz-logo.webp`, flaggad av ahrefs). Bilden är avsiktligt dekorativ (`aria-hidden="true"`, döljs för skärmläsare eftersom `<h1>Anatomiquiz</h1>` bredvid redan säger namnet) men saknade ändå `alt`, vilket SEO-verktyg tolkar som ett fel. Lade till `alt="Anatomiquiz logotyp"` — påverkar inte skärmläsarbeteendet (aria-hidden gäller oavsett) men ger bilden text för bildsök/crawlers.
- VERSION/APP_VERSION/app.js- och info.js-cachebuster → 0.9.110.

## 0.9.109
- **OG/Twitter Card + JSON-LD saknades helt på två kunskapsbanks-hubbar.** `kunskapsbank/listor-tabeller.html` och `kunskapsbank/faktatexter.html` byggdes uppenbarligen innan sid-mallen (sitemap-länk, Open Graph, Twitter Card, `CollectionPage`/`LearningResource`-JSON-LD + separat `BreadcrumbList`) fanns på plats — de andra kunskapsbankssidorna hade redan allt detta. Kompletterat enligt samma mönster som `muskeltabeller.html`/`skelett.html`, inkl. `hasPart` mot de undersidor som faktiskt är live (t.ex. faktatexter-hubben listar bara de 3 publicerade texterna, inte "Snart"-korten).
- VERSION/APP_VERSION/app.js- och info.js-cachebuster → 0.9.109.

## 0.9.108
- **Schema.org-fel i JSON-LD rättat på 65 sidor.** Ahrefs flaggade "Unexpected property" för `breadcrumb` nästlad inuti kombinerade `@type`-arrayer (`Article`/`LearningResource`, `CollectionPage`/`LearningResource` m.fl.) — validatorn känner inte alltid igen att `LearningResource` ärver `breadcrumb` från `CreativeWork`. `BreadcrumbList` ligger nu i ett **eget separat** `<script type="application/ld+json">`-block på alla kunskapsbankssidor + `case.html` (matchar även Googles rekommenderade mönster för brödsmule-rich-results).
- **`integritet.html` använde en påhittad schema.org-typ.** `"@type": "PrivacyPolicy"` finns inte i schema.org-vokabuläret (404 på schema.org) → bytt till `WebPage`.
- De fyra generatorerna (`generate_muskeltabeller.py`, `generate_skelett.py`, `generate_karl.py`, `generate_leder.py`) uppdaterade så framtida regenerering producerar samma korrekta mönster automatiskt. `SEO_REGLER.md` §6 skärpt: breadcrumb ska ALDRIG nästlas i ett multi-typ-block, och bara riktiga schema.org-typer får användas.
- VERSION/APP_VERSION/app.js- och info.js-cachebuster → 0.9.108.

## 0.9.107
- **Frågestatistiken på Om-sidan uppdaterad.** Tabellen "Antal frågor" listade bara Allmänt, Arbetsterapeut och Sjuksköterska. Nu ingår även **Läkare** och hela **Fysioterapeut** (8 ämnen: axel, armbåge, hand & handled, höft, knä, fot, columna, nervsystemet), plus de två AT-bildämnena Handens ben och Handens leder. Fysio-ämnena delar en datafil (`data/fysioterapeut.json`), så `countCards()` tar nu ett valfritt `topic`-filter och räknar per ämne via `topic`-fältet.
- **Mobil-layout för statistiktabellen.** Tabellen blev för bred på små skärmar. Ny `@media (max-width: 640px)`: mindre cellpadding, kompaktare rubriker (mindre versalspärr/font), `table-layout: fixed` med smala sifferkolumner så ämneskolumnen får utrymmet och radbryter i stället för att tränga ut sidan.
- styles.css-cachebustern enad sitewide → 0.7.26 (var 0.7.17/0.7.25) så CSS-fixen når besökarna; info.js-cachebuster → 0.9.107.
- VERSION/APP_VERSION/app.js-cachebuster → 0.9.107.

## 0.9.106
- **Om Anatomiquiz: kontaktsektionen flyttad upp.** "Rapportera fel & synpunkter" ligger nu före "Omfattning och versionshistorik" (tabellen med antal frågor), så kontaktvägen syns tidigare.
- **Inbjudan till ämnesförslag.** Kontaktintron nämner nu att förslag på quiz-ämnen som saknas tas emot gärna, och formulärets typ-meny har fått alternativet "Förslag på ämne".
- VERSION/APP_VERSION/app.js-cachebuster → 0.9.106.

## 0.9.105
- **Om Anatomiquiz: nyhetssektionen flyttad överst.** "Nyheter"-kortet ligger nu direkt efter intro-ledet (först bland innehållskorten) i stället för längst ner före versionshistoriken, så besökaren möts av det senaste först.
- **Ny nyhetsnotis (1 juli 2026).** Kort notis om de två viktigaste pågående satsningarna: bilder har börjat läggas in i materialet, och arbetet med quiz anpassade för olika vårdutbildningar har inletts. "Senast uppdaterad" → 1 juli 2026.
- VERSION/APP_VERSION/app.js-cachebuster → 0.9.105.

## 0.9.104
- **Fysioterapeut, ämne 8/14: Nervsystemet (100 MC-frågor).** Första ämnet i de fysiologiska systemen; lins anpassad till struktur → funktion → banor/reflexer → lesion → åldersutveckling. Täcker CNS/PNS, neuron/gliaceller/myelin, hjärnans och ryggmärgens uppbyggnad, hjärnhinnor/likvor, aktionspotential (vilopotential, Na⁺/K⁺, saltatorisk ledning), synaps/signalsubstanser (ACh, dopamin, GABA, glutamat), motorisk enhet/neuromuskulär förbindelse, banor (corticospinalis/pyramidbanan, baksträng-lemniscus medialis, spinothalamicus + korsningsnivåer), reflexbåge/sträckreflex/muskelspole/Golgi, **UMN vs LMN** (spasticitet/hyperreflexi/Babinski/klonus vs slapp pares/atrofi/fascikulationer), plegi/pares-terminologi (hemi-/para-/tetraplegi), autonoma nervsystemet (sympatikus/parasympatikus), kliniska tillstånd (stroke/TIA, MS, Parkinson, Guillain-Barré, cerebellär ataxi, afasi/neglekt/apraxi, polyneuropati, spinal chock), neuroplasticitet/neurorehab samt åldersaspekter (myelinisering, primitiva reflexer, nervledning, fallrisk, demens). Källor: Lännergren m.fl. (Fysiologi), Purves (Neuroscience), FitzGerald (Clinical Neuroanatomy), Lundy-Ekman (Neuroscience: Fundamentals for Rehabilitation). Tillagt i `data/fysioterapeut.json` (`fysio_nervsystemet`), option avkommenterad med `(MC)`-tagg.
- VERSION/APP_VERSION/app.js-cachebuster → 0.9.104.

## 0.9.103
- **Fysioterapeut, Hand & handled: +20 bildfrågor (nu 120 frågor).** Lade till 20 MC-bildfrågor i `fysio_hand_handled` som återanvänder befintliga handbilder ur registret `data/bilder.json` (11 handlovsben + 9 leder, refererade via `image`-id). Latinsk+svensk benämning på svarsalternativen. **Tom `prompt`** (som arbetsterapeutens bildfrågor) – den kompakta `.quiz-image`-mobillayouten förutsätter att bilden ÄR frågan, så en synlig prompt skulle knuffa svaren/Nästa under fold. Alla bild-id verifierade mot registret och filerna mot disk.
  - Option-etiketten uppdaterad till **"Hand & handled (MC+bild)"** (typtaggen läser fortf. MC → Starta-knappen aktiv).
- VERSION/APP_VERSION/app.js-cachebuster → 0.9.103.

## 0.9.102
- **Fysioterapeut, ämne 7/14: Columna/ryggrad (100 MC-frågor).** Byggt enligt linsen (struktur → biomekanik/funktion → innervation → vanlig skada → åldersutveckling). Täcker kotpelarens 33 kotor (cervikal/torakal/lumbal/sacral), atlas/axis + kraniocervikala leder, foramen transversarium, fasett-/uncovertebralleder, disk (nucleus/anulus), ligament (longitudinale, flavum, nuchae), kurvaturer (primära/sekundära), ryggmärgskanal/cauda equina, djup (erector spinae/multifidus, rami dorsales) vs ytlig muskulatur + core/transversus/quadratus lumborum, 31 spinalnervpar, dermatom/myotom, biomekanik (rörelseregioner, motion segment, intradiskalt tryck, lyftteknik), skador (lumbalt/cervikalt diskbråck + Lasègue/radikulopati, cauda equina-red flags, spinal stenos, spondylolys/-listes, skolios, hyperkyfos/Scheuermann, whiplash, Bechterew, osteoporotisk kotkompression, facettledssyndrom, yellow flags) samt åldersaspekter (kurvaturernas utveckling, diskdegeneration, längdminskning). Källor: Bojsen-Møller, Sobotta, Neumann, Magee. Tillagt i `data/fysioterapeut.json` (`fysio_columna`), option avkommenterad med `(MC)`-tagg.
- VERSION/APP_VERSION/app.js-cachebuster → 0.9.102.

## 0.9.101
- **Fysioterapeut, ämne 6/14: Fot & fotled (100 MC-frågor).** Byggt enligt linsen (struktur → biomekanik/funktion → innervation → vanlig skada → åldersutveckling). Täcker fotens ben (tarsal/metatarsal/falanger), talocrural-/subtalar-/Chopart-/Lisfrancled, malleoler, laterala ligament (ATFL/CFL/PTFL) + deltoideum + syndesmos, fotvalv (windlass, plantarfascia, spring-ligament, tibialis posterior), triceps surae/akillessena + tibialis anterior/fibularis, ROM, pronation/supination, gångcykelns rockers, n. tibialis/fibularis (profundus/superficialis) + suralis/saphenus, reflex/myotom, skador (lateral stukning + ATFL/Ottawa rules, high ankle sprain, Weber/Maisonneuve, akillesruptur/Thompson, plantarfasciit, Mortons neurom, hallux valgus/rigidus, pes planus/cavus, Jones-/marschfraktur, kompartmentsyndrom, tarsaltunnel, turf toe) samt åldersaspekter (barns plattfot, Sever, sendegeneration, fettkudda, diabetesfot/Charcot, fallprevention). Källor: Bojsen-Møller, Sobotta, Neumann, Magee. Tillagt i `data/fysioterapeut.json` (`fysio_fot_fotled`), option avkommenterad med `(MC)`-tagg.
- VERSION/APP_VERSION/app.js-cachebuster → 0.9.101.

## 0.9.100
- **Fysioterapeut, ämne 5/14: Knä (100 MC-frågor).** Byggt enligt linsen (struktur → biomekanik/funktion → innervation → vanlig skada → åldersutveckling). Täcker knäledens uppbyggnad (femorotibial/femoropatellar, patella, menisker med röd/vit zon, korsband ACL/PCL, kollateralligament MCL/LCL, pes anserinus), quadriceps/hamstrings/popliteus, screw-home, Q-vinkel, rull-glid, sluten/öppen kedja, n. femoralis/tibialis/fibularis (droppfot vid fibulahalsen) + reflex/myotom, skador (ACL-ruptur + Lachman/draglåda/pivot shift, PCL, MCL/LCL, meniskskada + McMurray/Apley, unhappy triad, patellofemoralt smärtsyndrom, patellaluxation, jumper's/runner's knee, ITB-syndrom, bursit, Bakercysta, chondromalaci) samt åldersaspekter (Osgood-Schlatter/Sinding-Larsen, genu varum/valgum-utveckling, degenerativ menisk/gonartros, ACL-epidemiologi). Källor: Bojsen-Møller, Sobotta, Neumann, Magee. Tillagt i `data/fysioterapeut.json` (`fysio_kna`), option avkommenterad med `(MC)`-tagg.
- VERSION/APP_VERSION/app.js-cachebuster → 0.9.100.

## 0.9.99
- **Fysioterapeut, ämne 4/14: Höft & bäcken (100 MC-frågor).** Byggt enligt linsen (struktur → biomekanik/funktion → innervation → vanlig skada → åldersutveckling). Täcker os coxae/acetabulum, höftledens ligament (iliofemorale m.fl., lig. teres), collum-diafysvinkel/anteversion (coxa vara/valga), SI-led och symfys, bäckenets könsskillnader, glutealmuskulatur + iliopsoas/adduktorer/hamstrings/djupa rotatorer, gluteus medius & Trendelenburg, gångcykeln (stöd-/svingfas, ledkraft, käppavlastning), n. femoralis/obturatorius/ischiadicus + plexus lumbalis/sacralis, skador (coxartros, collum-fraktur + AVN, trokanterit, FAI/labrum, ljumsk-/hamstringsskada, piriformissyndrom, bakre luxation, barnortopedi: Perthes/SCFE/DDH/coxitis simplex) samt åldersaspekter (Y-brosk, anteversion över tid, gångförändringar, osteoporos/fallprevention, bäckenbotten/relaxin). Källor: Bojsen-Møller, Sobotta, Neumann, Magee. Tillagt i `data/fysioterapeut.json` (`fysio_hoft_backen`), option avkommenterad med `(MC)`-tagg.
- VERSION/APP_VERSION/app.js-cachebuster → 0.9.99.

## 0.9.98
- **Fysioterapeut, ämne 3/14: Hand & handled (100 MC-frågor).** Byggt enligt linsen (struktur → biomekanik/funktion → innervation → vanlig skada → åldersutveckling). Täcker karpalbenen (proximal/distal rad), radiokarpal-/midkarpal-/CMC-/MCP-/IP-leder, TFCC, karpaltunneln och dess innehåll, intrinsiska muskler (tenar/hypotenar/lumbrikaler/interosséer, PAD/DAB), extrinsiska flexorer/extensorer, snusgropen, valv och grepptyper (kraft-/precisions-/krok-/nyckel-/spets-/sfäriskt grepp), tenodeseffekt, n. medianus/ulnaris/radialis (LOAF, Guyons kanal, dermatom/myotom), skador (karpaltunnel-/Guyon-syndrom, skafoideumfraktur + AVN, De Quervain, Dupuytren, trigger-/mallet-/jersey-finger, boutonnière/svanhals, skidåkartumme, boxarfraktur, ganglion) samt åldersaspekter (karpal ossifikation/benålder, tumbasartros, Heberden/Bouchard, RA, greppstyrka som hälsomarkör). Källor: Bojsen-Møller, Sobotta, Neumann, Magee. Tillagt i `data/fysioterapeut.json` (`fysio_hand_handled`), option avkommenterad med `(MC)`-tagg. Fräscha frågor — ingen dubblering av befintliga arbetsterapeut-handfrågor.
- VERSION/APP_VERSION/app.js-cachebuster → 0.9.98.

## 0.9.97
- **Fysioterapeut, ämne 2/14: Armbåge & underarm (100 MC-frågor).** Byggt enligt `UTBILDNINGAR_REGLER.md` och linsen (struktur → biomekanik/funktion → innervation → vanlig skada → åldersutveckling). Täcker armbågens tre delleder, ben/ligament, flexorer/extensorer/pronatorer/supinatorer, pron-/supinationsmekanik, bärvinkel, n. medianus/ulnaris/radialis (inkl. interosseus-grenar och inklämningar), vanliga skador (lateral/medial epikondylit, olekranonbursit, pulled elbow, suprakondylär fraktur, radiushuvudsfraktur, Colles/Smith, Monteggia/Galeazzi) samt åldersaspekter (CRITOE-ossifikation, artros). Källor: Bojsen-Møller, Sobotta, Neumann, Magee. Tillagt i `data/fysioterapeut.json` (`fysio_armbage_underarm`), option avkommenterad med `(MC)`-tagg.
- **Fix:** fysio-ämnenas option-etiketter får nu `(MC)`-taggen som start-knappen kräver (utan tagg gråades "Starta quiz" trots att frågor fanns). Gällde Axel/skulderkomplex i 0.9.96 och framåt.
- VERSION/APP_VERSION/app.js-cachebuster → 0.9.97.

## 0.9.96
- **Fysioterapeut-quizet startar: Axel/skulderkomplex (100 MC-frågor).** Första ämnet i fysioterapeututbildningen byggt enligt `UTBILDNINGAR_REGLER.md` och dess lins (struktur → biomekanik/funktion → innervation → vanlig skada → åldersutveckling). 100 unika MC-frågor som täcker glenohumeral-/AC-/SC-/skapulotorakalled, rotatorkuffen, skapulohumeral rytm, plexus brachialis och nervförsörjning, vanliga skador (luxation/Bankart/Hill-Sachs/SLAP/impingement/kuffruptur/AC-separation/kalkaxel/TOS) samt åldersrelaterade tillstånd (frozen shoulder, degeneration). Källor: Bojsen-Møller (Rörelseapparatens anatomi), Sobotta, Neumann (Kinesiology of the Musculoskeletal System), Magee (Orthopedic Physical Assessment).
  - Ny datafil `data/fysioterapeut.json` (alla fysio-ämnen samlas här, taggade per `fysio_*`-topic). `js/app.js` `getQuestionsPath()` routar alla `fysio_*` → filen; exakt topic-match sköts av default-grenen.
  - `#topic`-optionen `fysio_axel_skulder` avkommenterad (syns nu → fysioterapeut gråas inte längre). Övriga 13 fysio-ämnen ligger kvar som utkommenterad scaffold tills de byggs.
- VERSION/APP_VERSION/app.js-cachebuster → 0.9.96.

## 0.9.95
- Teckenförklaringen under ämnesväljaren något mindre på mobil (0.62rem, var 0.7rem).
- VERSION/APP_VERSION/app.js-cachebuster → 0.9.95; styles.css → 0.7.25.

## 0.9.94
- **Teckenförklaringen: storlek + "Bild".** Förklaringsraden under ämnesväljaren ("MC = …, Bild = fråga med bild") är nu något större på dator (0.9rem) och mindre på mobil (0.7rem, var tidigare i samma storlek som dropdown-texten). Taggen "bild" skrevs om till **"Bild"** både i förklaringen och i dropdown-alternativet "Slumpade frågor (MC+TF+Bild)".
- VERSION/APP_VERSION/app.js-cachebuster → 0.9.94; styles.css → 0.7.24.

## 0.9.93
- **Ny logga + enhetliga ikoner (skeletthand).** En liten skelett-"metal horn"-hand är nu logga i sidrubriken (till vänster om "Anatomiquiz") och används som favicon/PWA-ikoner.
  - **Logga:** `img/anatomiquiz-logo.webp` (transparent svart silhuett, beskuren och nedskalad), visas höjdstyrt (44 px desktop / 34 px mobil) i `.header-title`. Transparent → blandar in på headerns bakgrund utan färgskarv.
  - **Ikoner samlade till ETT motiv:** `favicon.svg` (var ett grönt "H"), `icon-192.png` och `icon-512.png` (var gröna "H") gjordes om till skeletthanden på ljus mintplatta (`#ecfdf5`). `favicon.png` regenererades i samma stil. Filnamnen behölls, så `<head>`/manifest/undersidor rör sig inte. PNG-ikonerna är solida (utan transparens) för säker apple-touch/iOS-rendering.
  - Borttagen oanvänd källfil `img/anatomiquizmetalhorn.webp`. `og-image.png` (delningsbild) orörd.
- VERSION/APP_VERSION/app.js-cachebuster → 0.9.93; styles.css → 0.7.23.

## 0.9.92
- **Bildfrågor i "Slumpade frågor" + tydlig märkning.** Ben- och led-bildfrågorna plockas in i Slumpade frågor (de samlas redan in automatiskt eftersom de är arbetsterapeut-ämnen med MC-tagg – verifierat). Dropdown-alternativet heter nu **"Slumpade frågor (MC+TF+bild)"** och teckenförklaringen utökades med "bild = fråga med bild" så det framgår att blandade quiz kan innehålla bildfrågor.
- VERSION/APP_VERSION/app.js-cachebuster → 0.9.92.

## 0.9.91
- **Språkfix i ledquizet: konsekvent latin.** Översiktslederna (CMC, MCP, PIP, DIP) använde pluralformen "Articulationes …" som rätt svar medan distraktorerna var singular "Articulatio …" – samma fråga blandade alltså två former. Alla latinsvar är nu singular "Articulatio …". (Bildregistrets beskrivande alt-texter behåller pluralformen där den beskriver en bild med flera leder.) Inga dubbelrätt-fall, verifierat.
- VERSION/APP_VERSION/app.js-cachebuster → 0.9.91.

## 0.9.90
- **Fix: inget "Avsluta"/resultat efter sista frågan i bildquiz.** Resultatskärmen visades men hamnade utanför vyn: bildquizets fokusläge dolde sidrubriken och `scrollIntoView` hade pinnat kortet högst upp, så när rubriken kom tillbaka vid avslut låg resultatet (med Avsluta/Spela igen) nedanför skärmkanten – det såg ut som att appen låste sig.
  - `finishQuiz` scrollar nu upp till toppen, städar fokusläges-klassen och sätter resultattexten först + kapslar in sparning/länkar i try/catch så resultatskärmen alltid visas även om något delmoment fel.
  - Sista frågans knapp heter nu **"Visa resultat"** (i stället för "Nästa") i alla quiz, så det är tydligt att den avslutar. Gäller generellt – även bildfrågor inbakade i vanliga/blandade quiz.
- VERSION/APP_VERSION/app.js-cachebuster → 0.9.90.

## 0.9.89
- **Frågeräknare i footern under bildfrågor.** Frågeräknaren ("Fråga X/Y") visas nu bredvid tidräknaren i footerns mitt (mellan Avbryt och Nästa) i bildfrågornas fokusvy – så man ser var i quizet man är utan att spelarnamn/poäng-raden behöver ta plats överst. Vanliga textquiz har kvar sin fullständiga rad (med poäng) i quiz-header.
- VERSION/APP_VERSION/app.js-cachebuster → 0.9.89; styles.css → 0.7.22.

## 0.9.88
- **Bildfrågornas fokusvy: dölj spelarnamn + poäng-raden.** Hela quiz-header-raden (spelarnamn och "Fråga X/Y — Poäng") döljs nu under bildfrågor, så Nästa-knappen flyttas upp och bilden får mer plats. (Behövs inte i fokusvyn; visas fortfarande i vanliga textquiz.)
- VERSION/APP_VERSION/app.js-cachebuster → 0.9.88; styles.css → 0.7.21.

## 0.9.87
- **Större bilder i bildquizen + fokusläge under spel.** Bilderna krympte för mycket i 0.9.85; nu är de större igen (bas upp till min(56vh, 460px); mobil 48vh, små skärmar 42vh).
  - **Fokusläge:** medan ett quiz körs döljs sidrubriken (titel/tagline ovanför spelarraden) och footern, och den gröna sidbakgrunden bakom kortet tas bort – sådant behöver inte ta plats under spel, så bilden får mer yta. Återkommer automatiskt på inställnings-/resultatvyn. (CSS via `:has(#quiz:not(.hidden))`; degraderar tyst på äldre webbläsare.)
  - **Trimmad kort-krom:** mindre padding ovanför spelarraden och under Nästa-knappen samt tätare quiz-header/footer på mobil, så att bild + svar + Nästa ryms trots den större bilden.
- VERSION/APP_VERSION/app.js-cachebuster → 0.9.87; styles.css → 0.7.20.

## 0.9.86
- **Fix: sidan hoppade till toppen vid "Nästa".** Vid varje ny fråga fokuserades första svarsknappen, vilket fick webbläsaren att auto-scrolla upp till den (man "hoppade" och fick scrolla ner igen – särskilt märkbart i bildquizen). Nu fokuseras svaret med `preventScroll`, och frågekortet läggs överst i vyn (`scrollIntoView`) så att bild + svarsalternativ + Nästa-knapp hamnar synliga på samma skärm vid varje frågebyte.
- VERSION/APP_VERSION/app.js-cachebuster → 0.9.86.

## 0.9.85
- **Nytt bildquiz: "Handens leder (bilder, MC)" (58 frågor) under Arbetsterapeut.** Samma mönster som handens ben – bilden ÄR frågan, ingen frågetext, fyra svarsalternativ.
  - **21 egna ledbilder** (560×700 webp, egen licens CC BY 4.0 m. hänvisning till Anatomiquiz) i `img/media/anatomi/ovre-extremitet/handleder/`, registrerade i `data/bilder.json`. Omfattar handleden (radiocarpea), DRUJ, mediocarpea, CMC, MCP (översikt + I–V), PIP (översikt + dig 2–5), DIP (översikt + dig 2–5) samt tummens IP-led.
  - **Adaptivt antal svarsstilar per led** (latin alltid; förkortning DIP/PIP/MCP/CMC/DRUJ/IP; lekman bara där verkligt vardagsnamn finns – handleden, knogled, fingerledernas mellan-/ytterled). Leder utan förkortning/vardagsnamn (mediocarpea m.fl.) får färre varianter. Distraktorer väljs i samma stil och i första hand ur samma ledfamilj.
  - **Datafil** `data/handens_leder_bilder.json` (`"image":"<id>"`); wirad i `getQuestionsPath()` + `<option data-edu="arbetsterapeut">`. Ingen ny renderingskod – återanvänder bildhooken från 0.9.84.
- **Buggfix: distraktorer kunde innehålla ett gruppnamn som också var korrekt.** En bild på t.ex. DIP3 fick "DIP" som felalternativ, fast gruppnamnet alltid också gäller (två korrekta svar). Infört regel i båda bildquizen: ett förälder-/översiktsnamn (DIP/PIP/MCP-översikt; Ossa carpi/karpalbensrad) får aldrig vara distraktor till en mer specifik bild av samma sak. Gäller alla tre svarsstilar. Även ben-quizet (0.9.84) regenererades – karpalbensraderna hade motsvarande fel med "Ossa carpi". Verifierat: 0 dubbelrätt-fall i 97 + 58 frågor.
- **Kompaktare mobillayout för bildfrågor.** Bild + svarsalternativ + Nästa-knapp ryms nu på samma mobilskärm utan att man måste scrolla (gäller alla bildquiz – ben & leder). `app.js` sätter klassen `.quiz-image` på quizet när frågan har bild; ny CSS krymper bildhöjd (≤32vh, ≤28vh på mycket små skärmar), paddings och knapphöjd (≥46px, fortsatt touch-vänligt) enbart för bildfrågor – textquiz behåller sin luftiga layout.
- VERSION/APP_VERSION/app.js-cachebuster → 0.9.85; styles.css → 0.7.19.

## 0.9.84
- **Nytt bildquiz: "Handens ben (bilder, MC)" (97 frågor) under Arbetsterapeut.** Första ämnet som använder det nya bildsystemet – **bilden ÄR frågan, ingen frågetext alls**: bara bilden + fyra svarsalternativ.
  - **Tre svarsstilar per bild** (~33 av varje, oannonserade – framgår av alternativen): svenskt namn (t.ex. *Båtbenet*), latinskt namn (*Os scaphoideum*, *Phalanx media*) och kortform (*Scaphoideum*, *Dig 3 distal falang*, *MC III*). Alla 33 bilder används; fler frågor än bilder. 4 svarsalternativ, distraktorer ur samma bengrupp (karpalben, mellanhandsben, falanger, översiktsbilder) för rimlig svårighet.
  - **Tillgänglighet:** ingen synlig prompt, men bilden får en neutral alt ("Vilket ben visas på bilden?") så skärmläsare får en rättvis fråga utan att registrets beskrivande alt (facit) avslöjas.
  - **Datafil** `data/handens_ben_bilder.json` (varje fråga bär `"image": "<id>"` som slår upp bilden i registret `data/bilder.json`). Wirad i `getQuestionsPath()` och som `<option data-edu="arbetsterapeut">` i `#topic`.
  - **Bildrendering inkopplad i quizet (tidigare förberett).** `js/images.js` laddas nu i `index.html`; `app.js` laddar bildregistret vid quizstart om någon fråga har bild och renderar `<figure>` med lazy-laddad `<img>` + alt ovanför frågetexten (`showQuestion`). Ny CSS för `.content-image` (responsiv, vit platta, max-höjd så svaren ryms på mobil).
  - **33 handbens-bilder** (560×700 webp, egen licens CC BY 4.0 m. hänvisning till Anatomiquiz) registrerade i `data/bilder.json` under `img/media/anatomi/ovre-extremitet/hand|underarm/`.
- VERSION/APP_VERSION/app.js+images.js-cachebuster → 0.9.84; styles.css → 0.7.18.

## 0.9.83
- **Bildsystem för innehållsbilder (förberedelse).** Infört en smart lagrings- och hanteringslösning så anatomibilder kan återanvändas i flera utbildningars quiz och faktatexter UTAN dubletter. Inga bilder ännu – detta är infrastrukturen.
  - **En fil per motiv + centralt register.** Bilder lagras EN gång i en mappstruktur under `img/media/` (kategori → region/organsystem: `anatomi/`, `patologi/`, `histologi/`, `embryologi/`, `radiologi/` med regionundermappar), aldrig i projektroten. Registret `data/bilder.json` är enda källan; varje bild = en post med `id`, `file`, obligatorisk svensk `alt`, kategori/region/taggar/källa/licens. Återanvändning sker via bildens `id` (quiz: `"image":"<id>"`; faktatext: `<img src="/img/media/<file>">`) – samma id ger samma fil, ingen kopia.
  - **Rot-absoluta sökvägar** (`/img/media/…`) så samma referens fungerar från både rotsidor och `/kunskapsbank/` (egen domän).
  - **Hjälpmodul `js/images.js`** (`loadImageRegistry`, `imageMeta`, `imageSrc`, `buildImageFigure`) – laddar/cachar registret och bygger `<figure>` med lazy-laddad `<img>`, alt och ev. kreditbildtext. Ej inwirad i quizrenderingen än; kopplas in när första bild-frågan byggs (då även CSS för `.content-image`).
  - **Format/SEO-rekommendation dokumenterad:** SVG för diagram, WebP som default för foton/renderingar, AVIF för enstaka stora tunga foton; codec påverkar inte ranking direkt, men liten/snabb fil + `alt`/filnamn/lazy-load gör det.
  - **Nytt regeldokument `BILDER_REGLER.md`** styr allt ovan; `img/media/README.md` dokumenterar mappträdet.
- VERSION/APP_VERSION/app.js-cachebuster → 0.9.83.

## 0.9.82
- **Ombyggd utbildnings- & ämneslista enligt nytt regeldokument `UTBILDNINGAR_REGLER.md`.** Det dokumentet (repo-roten) är nu källan för vilka utbildningar som ska finnas, deras ämnesindelning och pedagogiska "linser" per program.
  - **Utbildningsväljaren bantad från 19 → 13 + Allmänt.** Raderade tomma alternativ: Barnmorska, Biomedicinare, Dietist, Medicintekniker, Receptarie, Tandhygienist. Kvar: Allmänt + Apotekare, Arbetsterapeut, Audionom, Biomedicinsk analytiker, Fysioterapeut, Logoped, Läkare, Medicinsk sekreterare, Optiker, Röntgensjuksköterska, Sjuksköterska, Tandläkare.
  - **"Anatomi & fysiologi" omdöpt → "Blandad anatomi/fysiologi"** för de utbildningar som redan hade ämnet: Sjuksköterska (FC) och Läkare (MC). Endast visningstext; `value` (`anatomi_fysiologi_flashcards`, `lakare_anatomi_fysiologi`) och datafiler oförändrade. Statistiklistans etikett i `js/info.js` omdöpt på samma sätt.
  - **Platshållarämnen som UTKOMMENTERAD scaffold.** De ej byggda ämnena per utbildning (~111 st) ligger som kommenterade `<option>` i `#topic`, grupperade per utbildning. Kravet är att tomma ämnen INTE ska synas för användaren – kommenterade options renderas aldrig och fångas inte av `captureTopicOptions()`, så varje ännu obyggd utbildning gråas automatiskt som "(inga ämnen ännu)". När ett ämne byggs: avkommentera raden, lägg datafilen i `getQuestionsPath()` och sätt rätt typtagg (MC/FC/TF).
  - **Allmänt och Arbetsterapeut är helt orörda** av ombyggnaden. Arbetsterapeutens ämnesmodell skiljer sig och hanteras separat (finns endast som referens i regeldokumentet).
- VERSION/APP_VERSION/app.js-cachebuster → 0.9.82.

## 0.9.81
- **Många fler utbildningar i "Välj utbildning" + platshållare.** Utbildningsväljaren utökades från 6 till **19 alternativ** (yrkesnamn, inte "...programmet"). Nya: **Tandläkare, Fysioterapeut* , Biomedicinsk analytiker, Biomedicinare, Röntgensjuksköterska, Audionom, Logoped, Dietist, Optiker, Barnmorska, Tandhygienist, Apotekare, Receptarie och Medicintekniker** (Fysioterapeut fanns sedan tidigare).
  - **Platshållarmekanik:** utbildningar utan eget ämne (ingen `data-edu`-taggad option) gråas automatiskt av `updateEducationOptions()` med "(inga ämnen ännu)" – samma beteende som Medicinsk sekreterare. Inga fejkade/platshållar­ämnen skapas; ämnen taggas med `data-edu` när de byggs.
  - **Alfabetisk ordning** (svensk sortering, å/ä/ö efter z) och **Allmänt är nu förvalt** (default) i stället för Arbetsterapeut. `getSelectedEducation()`-fallback och kommentarer uppdaterade i linje med detta. Detaljerade anatomi/fysiologi-stjärnvärden per utbildning ligger som intern notis i `project_education_split.md`.
  - **Dynamiskt antal ämnen per utbildning.** Etiketten döptes om från "Välj utbildning" till **"Utbildning och antal tillgängliga ämnen"**, och varje utbildning visar nu antalet ämnen i parentes, t.ex. *Arbetsterapeut (16)*, *Sjuksköterska (3)*, *Läkare (1)*, *Allmänt (1)*. Antalet räknas ur den faktiska ämneslistan i `updateEducationOptions()` (typ-oberoende, utkommenterade ämnen exkluderade) så det uppdateras automatiskt när ämnen läggs till. Utbildningar utan ämnen visar fortsatt "(inga ämnen ännu)" och gråas.
- **Ny inställning: "Visa även icke-medicinska ämnen".** Specialämnen som inte rör anatomi/fysiologi (ATP-teori: **Moho** och **OTIPM**, FC) är åter inlagda men döljs som standard. En ny kryssruta i inställningarna visar/döljer dem; de dyker upp under den utbildning de hör till (Arbetsterapeut). Markeras med `data-nonmedical="1"` på `<option>`; `updateTopicOptions()` filtrerar bort dem när bocken är av, och utbildningsräkningen följer bocken (Arbetsterapeut 16 ↔ 18). Valet sparas i `hur_settings` (`showNonMedical`). Ersätter den tidigare utkommenteringen av Moho/OTIPM (v0.4.25).
- **Senast valda utbildning minns nu robust.** Persistensen (spara/återställ via localStorage-nyckeln `hur_settings`) fanns sedan 0.8.70 och verifierades fungera (jsdom-round­trip: välj → ladda om → återställd). Härdade `saveSettings()` så fältläsningen är null-säker – tidigare kunde en saknad inställnings-input få hela sparningen (inkl. vald utbildning) att tyst kasta. OBS: en flik och en hemskärms-genväg har separata localStorage-fack (iOS), så valet delas inte mellan dem.
- VERSION/APP_VERSION/app.js-cachebuster → 0.9.81.

## 0.9.80
- **Nytt quiz för läkarstudenter: Anatomi & fysiologi (MC, 100 frågor).** Ny datafil `data/lakare_anatomi_fysiologi.json` med 100 flervalsfrågor (4 svarsalternativ) på normal svårighet, kalibrerade mot läkarprogrammets prekliniska termin 1–6. Faktakontrollerat mot standardlitteraturen (Guyton & Hall samt Lännergren m.fl. i fysiologi; Gray's/Moore samt Sand & Bjålie i anatomi); originalformulerade frågor, inga verbatimkopierade tentafrågor.
  - **Fördelning 50 fysiologi / 50 anatomi.** Fysiologi: cell-/membranfysiologi, nerv & muskel, autonoma nervsystemet, hjärta, cirkulation, blod, respiration, njure & syra-bas, mag-tarm/lever, endokrinologi, sinnen. Anatomi: övre & nedre extremitet (nerver/muskler), skelett, thorax & hjärta, buk & bäcken med kärl, samt neuroanatomi.
  - **Wiring:** ny option `Anatomi & fysiologi (MC)` under utbildningsväljarens `data-edu="lakare"` (tidigare tom) i `index.html`; sökvägsmappning i `js/app.js` (`getQuestionsPath`). Inga befintliga ämnen eller filer rörda.
- VERSION/APP_VERSION/app.js-cachebuster → 0.9.80.

## 0.9.79
- **Ordlistetooltips – heltäckande lyft över ALLA tabeller och faktatexter (batch 2, slutför 0.9.78).** Gick igenom samtliga 65 kunskapsbankssidor + case.html. kb-term-länkarna gick från ~4 700 till **6 582**.
  - **Aliaslager (inget nyskrivet faktainnehåll):** ytterligare kurerade alias i `data/kb_glossary_terms.json` som pekar på redan befintliga ordliste-/kb-definitioner. Tre källor: (1) latinska böjningar → grundform, (2) korta-def-poster (ol) → samma ankare, (3) **svenska synonymer → latinsk grundpost** (skenbenet→tibia, nyckelbenet→clavicula, korsbenet→sacrum, axelleden→articulatio glenohumeralis osv.), extraherade ur ordlistans egna "Sv."-fält.
  - **44 nya källförankrade ordlisteposter** för medicinska termer som helt saknade förklaring: *dorsalaponeuros, palmaraponeuros, känselbortfall, fotvalv, framhornsneuron, hypotenar, facettled, hörselben, grundled/mellanled/ytterled, munvinkel, lateralrotation, radialdeviation, iliopsoas, kontinens, hals-/bröst-/ländrygg, ledskål, glidled, kondylled, prevertebral, suboccipital, bilateral, palmar, plantar, mesencefalon, hjärnstam, musculus, intercostal, anserinus, ischiopubicus, transversospinal* m.fl. Ordlistan 11 127 → 11 171 ord.
  - **Säkerhetsspärrar:** blockerade vardagssvenska ord som krockar med medicinska förkortningar/latin (*men*=MEN, *veta*=vetus, *vara*=varus, *bra*=BRA, *vila*, *ring*, *bana/banan*, *stor* m.fl.) så de aldrig wiras felaktigt.
- **Buggfix i `scripts/generate_glossary.py`:** `STYLES_V` låg kvar på `0.7.9` och nollställde ordlistesidornas CSS-cachebuster vid varje regenerering – nu `0.7.17` i linje med övriga sidor.
- VERSION/APP_VERSION/app.js-cachebuster → 0.9.79.

## 0.9.78
- **Ordlistetooltips i muskeltabellerna – täckningslyft (batch 1).** Många medicinska ord i tabellerna saknade tooltip eftersom `wire_terms.py` bara länkar exakta ordlisteuppslag; böjda former matchade aldrig (därav "första ordet länkat, resten missat"). Lade till **129 kurerade alias** i `data/kb_glossary_terms.json`, alla pekande på redan kurerade ordlistedefinitioner (inget nyskrivet faktainnehåll):
  - Latinska böjningar → grundform: *rami→ramus, humeri→humerus, femoris→femur, scapulae→scapula, ventrales/dorsales, capitis→caput, pollicis→pollex, hallucis→hallux, ossis/oris→os, anterius→anterior* m.fl.
  - Svenska/förkortningsformer: *bäckenet, falangerna, akillessenan, dip/pip/mcp/cmc* m.fl.
  - Blockerade felvänner med fel betydelse i tabellkontext: *iii (=evidensnivå), cav, pad, rik, ten*; rättade *recti→rectus*.
- **Resultat:** muskeltabellerna gick från ~1 900 till **2 461** kb-term-länkar. Verifierat på halsens scalentabell (*Rami ventrales* m.m. nu fullt länkade).
- Återstår (kommande batchar): nyskrivna källförankrade ordlisteposter för helt saknade medicinska termer (*metacarpale, anserinus, dorsalaponeuros, sesamben, ytterfalang, trappmuskel* m.fl.) samt nerv-/skelett-/led-/kärltabeller och faktatexter.
- VERSION/APP_VERSION/app.js-cachebuster → 0.9.78.

## 0.9.77
- **Fix: tabellrubriker (`<caption>`) bröts ord-per-rad på mobil.** I mobil-layouten (≤720px) blir `.kb-mtable` `display:block`, men `<caption>` lämnades som `table-caption` och krympte då till min-content → varje ord på egen rad. Nu sätts captionen till `display:block` med full bredd och större grad (1,05rem, fet) så att tabellrubriken syns som en rubrik. Gäller alla `.kb-mtable` i hela kunskapsbanken.
- **Kortare tabellrubriker** på `lakemedelsberakning-omvandlingar.html` (t.ex. "Massa (vikt)", "Tid", "Procent till mg/ml", "Droppfaktor (droppar/ml)") så att de får plats på en rad.
- **CSS-cachebuster enhetlig:** alla sidor refererar nu `styles.css?v=0.7.17` (löser den fragmenterade versionen i SEO_REGLER §14).
- VERSION/APP_VERSION/app.js-cachebuster → 0.9.77.

## 0.9.76
- **Faktatexter-kortet på kunskapsbankens hub satt till "Live".** Pillaren har live-innehåll sedan tidigare; kortet i `kunskapsbank/index.html` uppdaterat från "Snart"/"Förhandstitt →" till "Live"/"Öppna faktatexterna →".
- VERSION/APP_VERSION/app.js-cachebuster → 0.9.76.

## 0.9.75
- **Ny faktatext + tabellmaterial: Läkemedelsberäkning.** Två nya kunskapsbankssidor som kompletterar quizet Läkemedelsräkning (0.9.74):
  - `kunskapsbank/lakemedelsberakning.html` – faktatext "Läkemedelsberäkning – så räknar du rätt dos": begreppen ordination/styrka/dos, enhetsomvandling, de tre grundformlerna, infusionshastighet och dropptakt, dosering per kg, procentlösningar och spädning samt säker kontrollräkning. Article+LearningResource + FAQPage (speglar synlig FAQ) + BreadcrumbList. Inlagd som live-kort i `faktatexter.html`.
  - `kunskapsbank/lakemedelsberakning-omvandlingar.html` – tabellmaterial "Omvandlingar & formler": massa, volym, tid, procent→mg/ml, droppfaktor och formelsamling som responsiva `.kb-mtable` (skriv ut/CSV). Inlagd som live-kort i `listor-tabeller.html`.
  - **Trippelkoppling:** faktatext ↔ tabell ↔ quiz korslänkade åt båda håll; båda sidorna länkar till ordlistan. Alla påståenden faktakollade (1 g = 1000 mg, 1 % = 10 mg/ml, 0,9 % NaCl = 9 mg/ml, droppfaktor ≈ 20 dr/ml m.m.).
  - SEO/kedjan enligt SEO_REGLER: unika titlar/descriptions, OG/Twitter, JSON-LD, kb-term-tooltips mot verifierade ordlisteankare, sitemap.xml + llms.txt uppdaterade.
- VERSION/APP_VERSION/app.js-cachebuster → 0.9.75.

## 0.9.74
- **Nytt ämne: Läkemedelsräkning (MC) för sjuksköterskor.** 100 nya flervalsfrågor i `data/lakemedelsrakning.json`, taggade `data-edu="sjukskoterska"`. 50 faktafrågor (enheter, begrepp, förkortningar p.o./i.v./s.c./i.m., formler, säkerhet/dubbelkontroll, rimlighetsbedömning) och 50 beräkningsfrågor anpassade för MC-format så de går att räkna i huvudet: enhetsomvandling (g↔mg↔µg, l↔ml), tablettberäkning (ordination ÷ styrka), dosvolym (mg ÷ mg/ml), mängd substans (mg/ml × ml), dygnsdos, infusionshastighet (ml/h), droppräkning (20 dr/ml), mg/kg-dosering samt procent-/spädningslösningar. Nivå och innehåll kalibrerade mot svensk sjuksköterskekurslitteratur (Läkemedelsräkning för sjuksköterskor, Studentlitteratur).
- Inkopplat i ämnesväljaren (index.html), `getQuestionsPath()` (app.js) och ämneslistan på info-sidan (info.js).
- VERSION/APP_VERSION/app.js-cachebuster → 0.9.74.

## 0.9.73
- **Ny ingresstext på medicinska ordlistan.** Tydligare och mer användarnära tagline: "Medicinska ord, förkortningar och begrepp med definitioner, synonymer och etymologi i en sökbar ordlista med {antal} ord. Ta reda på vad olika begrepp, förkortningar, för- och efterled betyder inom anatomi, fysiologi, sjukdomar, labbprover, farmakologi och omvårdnad." Antalet fylls i dynamiskt av generatorn.
- VERSION/APP_VERSION/app.js-cachebuster → 0.9.73.

## 0.9.72
- **Felrapportering i ordlistans sidfot.** Ny rad efter källattributionen: "Rapportera in eventuella fel till mig." där *mig* länkar till e-post (anatomiquizse@gmail.com). Gäller alla ordlistesidor (genererat).
- VERSION/APP_VERSION/app.js-cachebuster → 0.9.72.

## 0.9.71
- **Ordlistans källattribution kompletterad.** Sidfoten anger nu att diagnoser, koder och läkemedelsuppgifter även stämts av mot **Socialstyrelsens klassifikationer (ICD-10-SE)** och **FASS**, utöver de anatomiska/terminologiska standardverken. Gäller alla ordlistesidor (genererat).
- VERSION/APP_VERSION/app.js-cachebuster → 0.9.71.

## 0.9.70
- **Ordlistan: 164 historiskt viktiga läkemedelssubstanser.** Generiska namn som uppslagsord enligt grundmallen: ordklass → kort definition med användningsområde (och svenskt handelsnamn där det belyser) → `Eng.` generiskt namn → `Av …`-etymologi med **fokus på ordens betydelse** (vad namndelarna faktiskt betyder), inte bara den kemiska sammandragningen. T.ex. *Atropin* efter ödesgudinnan Atropos ("den som inte kan vändas"), *Morfin* efter drömguden Morfeus, *Salvarsan* av lat. *salvare* = frälsa + arsenik, *Penicillin* av *penicillus* = liten pensel.
  - Täcker antibiotika, cytostatika, psykofarmaka, hjärt-/kärlmedel, diuretika, hormoner, narkos/lokalbedövning, opioider, antivirala, svampmedel, antiepileptika m.m. – från ur-läkemedlen (opium, kinin, eter) till moderna milstolpar (omeprazol, fluoxetin, ciklosporin).
  - Korsreferenser (`Jfr …`) mellan besläktade substanser (Levodopa↔Karbidopa, Morfin↔Morfinsulfat, betablockerarnas `-olol`-familj m.fl.). Dubbletter mot redan befintliga poster uteslutna; sammanslagna varianter (Brom→Kaliumbromid, Eter→Dietyleter, AZT→Azidotymidin, Penicillin G→Bensylpenicillin). En källkritiskt tveksam (fabricerad) rad utelämnad.
  - 0 slug-kollisioner. Ordlistan 10 963 → **11 127**.
- VERSION/APP_VERSION/app.js-cachebuster → 0.9.70.

## 0.9.69
- **Ordlistan: 200 medicinalväxter (örtmedicinens historia).** Inlagda under sina **latinska namn** som uppslagsord, var och en enligt grundmallen: ordklass `(lat.)` → svenskt namn + växtfamilj → historisk medicinsk användning och aktiv substans → giftvarning där det behövs → etymologi (genus + artepitet). Grupperna spänner från köksväxter (vitlök, ingefära, dill) till de farligaste gifterna (stormhatt, odört, fingerborgsblomma, oleander, hösttidlösa).
  - Täcker smärta/sömn, hjärta/cirkulation, feber/malaria, matsmältning/lever/laxermedel, luftvägar, sår/hud, kvinnohälsa, stimulantia/tonika, mask-/parasitmedel, gikt/reuma, urinvägar, klassiska växtgifter, psykoaktiva/rituella örter samt aromatiska kryddor.
  - 0 slug-kollisioner; sökbara även på svenska trivialnamn (namnet inleder definitionen). Ordlistan 10 763 → **10 963**.
- VERSION/APP_VERSION/app.js-cachebuster → 0.9.69.

## 0.9.68
- **Snyggare källattribution i ordlistans sidfot.** "Termer baserade på …" ersatt med en mer professionell formulering som listar tunga standardverk: *Terminologia Anatomica* (FIPAT/IFAA), *Nomina Anatomica*, *Gray's Anatomy*, *Sobotta – Atlas of Human Anatomy*, *Svenska Akademiens ordbok* (SAOB) samt etablerade svenska medicinska uppslagsverk. Gäller alla ordlistesidor (genererat).
- VERSION/APP_VERSION/app.js-cachebuster → 0.9.68.

## 0.9.67
- **Ordlistan: 94 franska, tyska och italienska medicinska ord.** Lånord och eponymer ur de tre språken, var och en med språkmarkör (`(fr.)`/`(ty.)`/`(it.)`) efter ordklassen och etymologi precis som övriga poster.
  - **Franska (29):** Débridement, Curettage, Bruit, Râle, Souffle, Frottement, Tamponade, Bougie, Malaise, Tic douloureux, Fontanelle, Chancre, Peau d'orange, Café au lait, Coup/contrecoup, Cul-de-sac, Trocar, Bistouri, Garrot, Ballottement, Drainage, Massage, Pipette, Plaque, Rapport, Crétin, Accoucheur, Cœur en sabot, Frisson. Befintliga *Tourniquet* rättad: ordet är franskt (av *tourner* = vrida), inte engelskt.
  - **Tyska (33):** Mittelschmerz, Anlage, Gestalt, Angst, Bremsstrahlung, Kernicterus, Spinnbarkeit, Zeitgeber, Bereitschaftspotential, Gegenhalten, Mitgehen, Mitmachen, Witzelsucht, Vorbeireden, Wahn, Zwang, Wahnstimmung, Gedankenlautwerden, Verstimmung, Umwelt, Eigengrau, Mastzelle, Schwannom, Quaddel, Trieb, Verdrängung, Fehlleistung, Besetzung, Schub, Reiz, Doppelgänger, Magenstrasse, Erlebnis.
  - **Italienska (32):** Influenza, Pellagra, Scarlattina, Belladonna, Quarantena, Lazzaretto, Tarantismo, Petecchie, Galvanismo samt eponymerna Eustachio, Falloppio, Malpighi, Golgi, Pacini, Ruffini, Sertoli, Morgagni, Valsalva, Scarpa, Botallo, Negri, Monteggia, Galeazzi, Aselli, Santorini, Aranzio, Varolio, Corti, Fontana, Pacchioni, Mondini, Marchiafava–Bignami.
  - Redan befintliga med språk/etymologi (oförändrade): triage, grand mal, petit mal, lavage, malaria. Ordlistan 10 669 → **10 763**.
  - Landningssidans ingress uppdaterad: nämner nu att ordlistan även rymmer franska, tyska och italienska medicinska lånord.
- VERSION/APP_VERSION/app.js-cachebuster → 0.9.67.

## 0.9.66
- **Tooltips för anatomiska plan i led-/ROM-sidorna.** Sagittalplan, frontalplan, transversalplan (och medianplan) fanns som ordlisteposter men saknades i `kb_glossary_terms.json` → ingen tooltip i Rörelseplan-kolumnen. Nu inlagda i wire-källan (→ 1303) och led-sidorna om-wirade; planbegreppen får tooltip även på andra sidor vid nästa regenerering.
- VERSION/APP_VERSION/app.js-cachebuster → 0.9.66.

## 0.9.65
- **Ordlistan: 21 AT/fysio-mätinstrument.** Instrument för rörlighet (goniometri, goniometer, inklinometer, elektrogoniometer, skoliometer), styrka (dynamometer, handdynamometer, vigorimeter, pinchmeter, myometer, isokinetisk dynamometer), fingerfärdighet/handfunktion (Nine Hole Peg Test, Box and Blocks Test, Purdue Pegboard, Jebsen-Taylor hand function test) samt närliggande (monofilament, aestesiometer + estesiometer, tvåpunktsdiskriminering, algometer, volumeter). Ordlistan 10 648 → **10 669**; även i `kb_glossary_terms.json` (1299) → "goniometri" m.fl. får nu tooltip där de nämns i ROM-sidorna.
- VERSION/APP_VERSION/app.js-cachebuster → 0.9.65.

## 0.9.64
- **Ny tabellsektion: Leder och rörelser (ROM)** (`kunskapsbank/leder.html` + 4 regionsidor), datadriven via ny `scripts/generate_leder.py` och `data/leder_rom/*.json`. Femte Live-kortet i Listor & tabeller.
  - **Regioner:** Övre extremiteten, Nedre extremiteten, Rygg och nacke, Käken (38 ledrörelser). Per led: Rörelse · Rörelseplan · Normalt rörelseomfång (ROM) · Huvudsakliga muskler, grupperad per led (caption = svenskt namn + latin).
  - **Riktad SEO mot fysio/AT:** title/description med *rörelseomfång (ROM), grader, flexion/extension/abduktion, fysioterapi, arbetsterapi*. JSON-LD LearningResource (professional development). Brasklapp att ROM-värden varierar (goniometri); källa Norkin & White.
  - **Flerords-tooltips korrekta:** lednamn (articulatio …) och rörelsetermer wirade som hela termer; muskelnamnen i muskelkolumnen wiras som hela "m. X" (180 nya "m. X"-alias i `kb_glossary_terms.json` som pekar på de fulla muskelposterna; datan rensad från snedstreck/halva namn). 0 fragment.
  - Integrerat: 5 URL:er i sitemap, CSS-kolumner (`c-r*`), cachebuster 0.7.16, SEO §12 grön.
- VERSION/APP_VERSION/app.js-cachebuster → 0.9.64.

## 0.9.63
- **"Listor & tabeller"-kortet på kunskapsbank-hubben satt till Live** (var "Snart"/förhandstitt) – hela tabellsektionen är klar (muskler, skelett, nerver, kärl). Uppdaterad beskrivning och CTA. Faktatexter kvar som "Snart" (genuint ej klar).
- VERSION/APP_VERSION/app.js-cachebuster → 0.9.63.

## 0.9.62
- **Ny tabellsektion: Kärl** (`kunskapsbank/karl.html` + 6 regionsidor), datadriven via ny `scripts/generate_karl.py` och `data/karl/*.json`. Därmed är alla fyra tabellsektioner klara (muskler, skelett, nerver, kärl) – inga platshållare kvar i Listor & tabeller.
  - **Regioner (6, följer kärlträdet):** Huvudet och halsen, Armen, Bröstkorgen, Buken, Bäckenet, Benet (44 kärlrader). Grövre indelning än muskel-/skelettregionerna eftersom kärlträdet spänner större områden.
  - **Tabell per region:** Kärl (latin) · Svenska · Typ · Avgår från / mynnar i · Försörjer / dränerar, grupperad i artärer/vener (och centrala kärl i thorax).
  - **Binomial-korrekt från start:** 40 nya artär-/vennamn som äkta ordlisteposter + i `kb_glossary_terms.json` → hela namnen wiras som EN tooltip (Arteria carotis communis, Vena saphena magna …). 0 binomial-fel. Ordlistan 10 608 → **10 648**; termkälla → 1098.
  - **Integrerat:** Kärl-kortet i `listor-tabeller.html` satt till Live (+ uppdaterad intro), 7 URL:er i `sitemap.xml`, nya kolumnbredder i CSS (`c-k*`), CSS-cachebuster 0.7.15 för kärlsidorna. SEO §12 grön på alla 7 sidor.
- VERSION/APP_VERSION/app.js-cachebuster → 0.9.62.

## 0.9.61
- **Tooltip-fix: binomiala latinnamn = EN term (skelett + muskler + nerver).** Tidigare wirades bara det generiska/första ordet av flerords-latinnamn (t.ex. bara "Articulatio" i *Articulatio atlantooccipitalis*, ett mittord i *Musculus biceps brachii*, bara "Nervus" i *Nervus musculocutaneus*). Nu länkas hela namnet som **en sammanhållen tooltip** till sitt **eget** ordlisteuppslag.
  - **Fulla namnen tillagda som äkta ordlisteposter:** 66 ben-/lednamn + 179 muskelnamn + 43 nervtabell-nerver/banor + 23 nerver som bara fanns i muskeltabellernas innervationskolumn (t.ex. nervus thoracodorsalis, nervus interosseus posterior, tractus iliotibialis). Ordlistan 10 297 → **10 608**; `kb_glossary_terms.json` 721 → **1055**.
  - Definitioner härledda ur respektive tabellers data (svenska, bentyp/ledtyp/funktion, vilka ben/muskler). Nervsidorna (handbyggda, ingen generator) de-wirades och om-wirades med `wire_terms`; muskel- och skelettsidorna regenererades.
  - **Verifierat: 0 "generisk-ord-ensam"-länkar kvar i hela /kunskapsbank/.** `Os coxae` vs `Articulatio coxae` får var sitt korrekta ankare; parenteser/romerska intervall hålls utanför länken.
- VERSION/APP_VERSION/app.js-cachebuster → 0.9.61.

## 0.9.60
- **Ny tabellsektion: Skelettet** (`kunskapsbank/skelett.html` + 12 regionsidor), datadriven via ny `scripts/generate_skelett.py` och `data/skelett/*.json` – speglar muskelgeneratorn (full SEO-head, JSON-LD Article/CollectionPage + BreadcrumbList, APA-referenser, inbyggd kb-term-tooltip-wiring och körbar SEO §12-grind).
  - **Regioner (speglar muskelregionerna):** Skallen, Halsen, Ryggen, Bröstkorgen, Skuldran, Överarmen, Underarmen, Handen, Höften, Låret, Underbenet, Foten. De tre huvudregionerna slogs ihop till Skallen; benlösa bukväggen/bäckenbotten utgår (bäckenbenen under Höften).
  - **Bentabell per region:** Ben (latin) · Svenska · Bentyp · Viktiga utskott & landmärken · Ledförbindelser, grupperad per delskelett (62 benrader).
  - **Ledtabell per region:** Led · Latin · Förkortning · Ledtyp · Mellan vilka ben (40 leder). Förkortningar där de används kliniskt – handen: CMC, CMC I, MCP, PIP, DIP, IP; foten: MTP, PIP/DIP, IP; käkled (TMJ), axelled (GH), AC/SC, SI-led m.fl.
  - **Integrerat:** Skelett-kortet i `listor-tabeller.html` satt till Live (+ uppdaterad intro), 13 URL:er i `sitemap.xml`, nya kolumnbredder i CSS (ben- och ledtabeller), CSS-cachebuster 0.7.14 för skelettsidorna.
- VERSION/APP_VERSION/app.js-cachebuster → 0.9.60.

## 0.9.59
- **Ordlistan: 95 nya läror, specialiteter och discipliner** (10 202 → 10 297 poster). Inga dubbletter, inga slug-kollisioner. Källor: Socialstyrelsens specialitetsindelning, Wikipedias specialitetslista, regionernas laboratoriemedicin, de 23 legitimationsyrkena samt källor om komplementärmedicin.
  - **Läkarspecialiteter & kliniska fält (44):** akutsjukvård, allmänmedicin, internmedicin, infektionsmedicin, socialmedicin, rättsmedicin, rättspsykiatri, arbets- och miljömedicin, beroendemedicin, palliativ medicin, smärtmedicin, vårdhygien, skolhälsovård, nuklearmedicin, rehabiliteringsmedicin, idrottsmedicin, katastrofmedicin, flygmedicin, dykmedicin, anestesiologi, intensivvård, allmänkirurgi, barnkirurgi, handkirurgi, kärlkirurgi, thoraxkirurgi, neurokirurgi, plastikkirurgi, neuropsykiatri, äldrepsykiatri, njurmedicin, lungmedicin, klinisk farmakologi/genetik/kemi/mikrobiologi/patologi/fysiologi/neurofysiologi/immunologi, transfusionsmedicin, neuroradiologi, gynekologisk onkologi, vaccinologi.
  - **Laboratoriemedicin & biomedicin (11):** laboratoriemedicin, biomedicin, molekylärbiologi, molekylärmedicin, cytogenetik, genomik, proteomik, bioinformatik, biokemi, farmakogenetik, farmakognosi.
  - **Anatomins underområden (5):** neuroanatomi, jämförande anatomi, mikroskopisk anatomi, patologisk anatomi, ytanatomi.
  - **Rehab, terapi & legitimationsyrkens ämnen (21):** fysioterapi, sjukgymnastik, dietetik, klinisk nutrition, optometri, ortoptik, kiropraktik, naprapati, osteopati, podiatri, psykoanalys, beteendeterapi, psykodynamisk terapi, fysikalisk medicin, musikterapi, bildterapi, dansterapi, hippoterapi, trädgårdsterapi, idrottsfysiologi, arbetsfysiologi.
  - **Psykologins grenar (6):** klinisk psykologi, biologisk psykologi, kognitiv psykologi, hälsopsykologi, neurovetenskap, psykofysik.
  - **Komplementär/alternativ, flaggade (8):** homeopati, naturopati, akupunktur, antroposofisk medicin, aromaterapi, ayurveda, traditionell kinesisk medicin, zonterapi – med nyanserade reservationer (t.ex. viss evidens för akupunktur vid vissa tillstånd men ej för qi-teorin; kiropraktik/osteopati-nyanser).
  - `data/ordlista.json` ändrad additivt (inga poster omflyttade); `ordlista-*.html` + termräknaren omgenererade.
- VERSION/APP_VERSION/app.js-cachebuster → 0.9.59.

## 0.9.58
- **Ordlistan: nya "läran om"-begrepp.** Tillagt **funktionell anatomi** samt **43 `-logi`-termer** inom medicin, anatomi, psykologi och vård (44 nya poster, 10 158 → 10 202). Inga dubbletter mot befintliga `-logi`-termer (kardiologi, neurologi, fysiologi m.fl.).
  - **Specialiteter/fält:** farmakologi, nefrologi, reumatologi, dermatologi, mikrobiologi, bakteriologi, virologi, mykologi, hepatologi, pneumologi, venereologi, andrologi, gerontologi, neonatologi, allergologi, diabetologi, audiologi, sexologi, nosologi, semiologi, somnologi, teratologi, embryologi, angiologi, tanatologi, balneologi, biologi.
  - **Anatomins underavdelningar:** osteologi, myologi, artrologi (syndesmologi), splanknologi.
  - **Psykologi:** psykopatologi, psykofarmakologi, psykofysiologi, socialpsykologi, utvecklingspsykologi, etologi, kinesiologi.
  - **Flaggade som ej erkända / icke fullt vetenskapliga:** iridologi, reflexologi (zonterapi), grafologi, frenologi, parapsykologi – samt reservationer för balneologi och för *tillämpad* kinesiologi (skild från kinesiologi som rörelselära).
  - Posterna följer grundmallen. `data/ordlista.json` ändrad additivt (inga befintliga poster omflyttade); `ordlista-*.html` + termräknaren omgenererade via `scripts/generate_glossary.py`.
- VERSION/APP_VERSION/app.js-cachebuster → 0.9.58.

## 0.9.57
- **Omdesign av "Om Anatomiquiz" (`info.html`) – överskådlig, kortbaserad layout.** Det enda jättekortet med ~10 likvärdiga `<h2>` på rad är uppdelat i åtta fristående `.card` (samma känsla som startsidan), ett kort per ämne med en tydlig rubrik var.
  - **Ny, logisk ordning:** intro → *Vad är Anatomiquiz?* → *Vem har nytta?* → *Vem ligger bakom + varför* → *Källor* → *Nyheter* → *Omfattning & versionshistorik* → *Kontakt*. "Vad det är" kommer nu före författarbio (besökarperspektiv).
  - **Rätt ramberättelse:** appen presenteras nu som *anatomiquiz + Kunskapsbanken* (inte "quiz + ordbok"). De två delarna visas som rutor sida vid sida, och ett nytt block "Vad finns i Kunskapsbanken?" listar dess delar – medicinsk ordlista (med etymologi, grekiska/latin, lekmannatermer, sjukdomar+ICD, labbvärden), medicinsk terminologi, listor & tabeller, patientfall och faktatexter – var och en länkad till sin sida.
  - **Head uppdaterad till samma ramberättelse:** title/description/OG/Twitter + JSON-LD säger nu "anatomiquiz & kunskapsbank" i stället för "anatomiquiz & medicinsk ordbok" (sökterm "medicinsk ordlista" behållen). Längder inom gräns (title 61, desc 144).
  - **"Senast uppdaterad / uppdateras löpande" flyttad** från mitt i introt till en diskret notis ovanför *Nyheter*, där den hör hemma.
  - **Två visuella uppgraderingar:** quizet och ordboken visas som två rutor i ett responsivt grid; målgruppslistan bryts i två kolumner på större skärmar (kompakt i stället för en lång remsa). Allt rasar till en kolumn på mobil.
  - All text bevarad ordagrant. Nya klasser: `.about-title`, `.info-prose`, `.about-lead`, `.about-grid`, `.about-feature`, `.about-cols`, `.about-update`. `.contact` tappar sin topp-kantlinje (eget kort nu). CSS-cachebuster för info.html → 0.7.13.
- VERSION/APP_VERSION/app.js-cachebuster → 0.9.57.

## 0.9.56
- **EEAT-lyft av "Om Anatomiquiz" (`info.html`).** Sidan tydligt namngiven "Om Anatomiquiz" (menyknapp `Info` → `Om Anatomiquiz`, brödsmula → "Om Anatomiquiz", fix av tidigare danglande `aria-labelledby="infoHeading"` med en sr-only `<h2>`).
  - **Författaridentitet & trovärdighet:** nytt avsnitt "Vem ligger bakom Anatomiquiz?" namnger Daniel Medin (utbildad medicinsk sekreterare, arbetsterapeutstudent vid Lunds universitet, anatomiintresse) med länkar till norrtou.se, LinkedIn och GitHub. Ny ursprungsberättelse "Varför Anatomiquiz finns" (saknade gratis svenskt material → byggde eget).
  - **Målgrupp:** nytt avsnitt "Vem har nytta av Anatomiquiz?" listar utbildningar (arbetsterapeut, fysioterapeut, sjuksköterska, läkare, medicinsk sekreterare, undersköterska, biomedicinsk analytiker, röntgensjuksköterska, naprapat/kiropraktor/osteopat, tandvård, dietist/logoped/audionom/optiker, **personlig tränare (PT)**, idrottsvetare).
  - **Källor:** "Källor och kvalitetssäkring" fick en explicit APA-källista (Terminologia Anatomica, ICD-10-SE, ICD-11, Medibas). **Färskhet:** synlig "Senast uppdaterad"-rad.
  - **Strukturerad data:** JSON-LD `AboutPage` utökad med `author` (Person Daniel Medin + `sameAs`), `publisher` (Norrtou Creations) och `dateModified`.
  - **META:** title/description/OG/Twitter omskrivna att återanvända *anatomiquiz, anatomi, quiz, medicinsk ordbok* (ingen `meta keywords` – den är en död SEO-signal sedan 2009 och saknas på övriga sidor).
- **`index.html`:** menyknappen → "Om Anatomiquiz"; description/OG/Twitter återanvänder nu *anatomiquiz* och *medicinsk ordbok*.
- VERSION/APP_VERSION/app.js-cachebuster → 0.9.56.

## 0.9.55
- **Ny regel: kort (`.kb-card`) får aldrig innehålla tooltips.** En `kb-term`-länk i ett kort (knapp-länk) stör klicket till målsidan och blir en nästlad `<a>` i klickbara kort. Kodad i **SEO_REGLER §6c**.
  - `scripts/wire_terms.py`: skyddar nu `.kb-card` som zon (både `<a>`- och `<div>`-kort/placeholders) – precis regex `class="kb-card[ "]` så `kb-card-desc/-title/-go` inte påverkas. Klickbara `<a>`-kort skyddades redan av `in_anchor`; gapet var div-placeholders.
  - Fix: tog bort en felaktig tooltip ("ryggmärg") som wirats in i "Nervsystemet"-placeholderkortet på `faktatexter.html`. Verifierat: 0 kort med tooltip på hela sajten. Regressionstestat att vanlig tabell-/textwiring är oförändrad.
- **Språkputs av "Så leds känseln" (`sa-leds-kanseln.html`).** Löptexten omarbetad till tydligare svenska (bl.a. "Känselns väg", "Ett känselintryck som ska nå medvetandet …", "korsar kroppens mittlinje"); tooltips återlagda med `wire_terms.py` ovanpå den nya texten (39 kb-term-länkar, 26 unika). Inga nästlade `<a>`, inga tooltips i kort.
- APP_VERSION/VERSION → 0.9.55; app.js-cachebuster → 0.9.55.

## 0.9.54
- **Nervbanorna kopplade till quizet (arbetsterapeut-ämnet Neurologi).** 18 nya frågor (12 MC + 6 TF) om de motoriska och sensoriska banorna, faktagranskade mot kunskapsbankens ban-sidor: kortikospinalbanan och var den korsar (decussatio pyramidum), spinothalamicus (smärta/temperatur), baksträngsbanan (beröring/vibration/proprioception), UMN- vs LMN-tecken, framhornet, thalamus som omkopplingsstation, Brown-Séquard, extrapyramidala banor, spinocerebellaris och den motoriska ändplattan. Tillagda i `data/neurologi.json` (120 → 138 frågor; topic `nervsystemet_banor`, source "Nervbanor"); inga dubbletter, unika ID, format validerat.
- Ämnesetiketten **"Neurologi (TF)" → "Neurologi (MC+TF)"** i `index.html` (ämnet har nu både MC och TF). Knyter ihop kunskapsbankens nervban-innehåll med aktiv träning i quizet.
- APP_VERSION/VERSION → 0.9.54; app.js-cachebuster → 0.9.54.

## 0.9.53
- **Parad faktatext: Så leds känseln (sensorisk princip).** Ny `kunskapsbank/sa-leds-kanseln.html` (Article+LearningResource), motsvarighet till "Så styrs en rörelse". Tre-neuronkedjan (receptor → spinalganglion → ryggmärg/förlängda märgen → thalamus → känselbark), en **jämförelsetabell baksträngsbanan kontra spinotalamusbanan** (modalitet, var de korsar, läge, bortfall), Brown-Séquard-dissociationen, medvetet kontra omedvetet samt receptortyperna. Strikt källförankrad (Fitzgerald, Guyton, Kandel, Gray's). Andra live-kortet på faktatexter-pillaren; korslänkad till Sensoriska nervbanor.
- **Tooltips §6c (uttömmande):** 39 länkar, 0 medicinska ord utan tooltip. Ordlistan **+7 termer** (ganglion spinale, mekanoreceptor, termoreceptor, proprioceptor, muskelspole, Brown-Séquards syndrom, kontralateral → 10 158); facit → 721 inkl. plural-/bestämdformer (mekanoreceptorer, neuronet …). **Buggfix:** tre tooltipdefs var avhuggna mitt i ord (trim kapade vid 150 tecken) – brown-séquards syndrom, lemniscus medialis, medulla oblongata omskrivna till rena defs; berörda sidor om-wirade. 0 trasiga ankare (721/721).
- Sitemap (74 URL:er) + llms.txt synkade. APP_VERSION/VERSION → 0.9.53; cachebuster app.js → 0.9.53.

## 0.9.52
- **Nya banor: Sensoriska nervbanor (ascenderande).** Ny tabellsida `kunskapsbank/nervtabell-sensorbanor.html` (Article+LearningResource), parallell till de motoriska. Två tabeller: **medvetna banor** till känselbarken (baksträngs–lemniscus medialis-systemet, tractus spinothalamicus lateralis/anterior) och **omedvetna banor** till lillhjärnan (tractus spinocerebellaris posterior/anterior) – kolumner bana, modalitet, korsning, mål. Intro tar upp den kliniska korsnings­dissociationen (Brown-Séquard). Strikt källförankrad (FIPAT, Fitzgerald, Kandel, Gray's). 47 ordlistetooltips enligt §6c – latinfraser (fasciculus gracilis/cuneatus, tractus spinothalamicus/spinocerebellaris, commissura alba anterior, pedunculus cerebellaris …) som EN tooltip, svenska former mappade (känselbark→gyrus postcentralis, baksträngsbanan→fasciculus gracilis). Titel 55 / desc 135.
  - Ordlistan +2 termer (medulla oblongata, lemniscus medialis → 10 151); facit → 696; 0 trasiga ankare.
  - Hub `nervtabeller.html`: kort "Sensoriska nervbanor" efter Motoriska, `hasPart`=8; reciprok korslänk motoriska↔sensoriska. Sitemap (73 URL:er) + llms.txt synkade.
- APP_VERSION/VERSION → 0.9.52; app.js-cachebuster → 0.9.52. Nya sidan på styles.css 0.7.12.

## 0.9.51
- **Pilot: nervbanor som parad faktatext + tabell (princip + komplett lista).** Första exemplet på två-pelar-mönstret för nervbaneinnehåll – en förklarande faktatext och en referenstabell, korslänkade.
  - **Faktatext `kunskapsbank/sa-styrs-en-rorelse.html`** (Article+LearningResource, under Faktatexter): förenklad princip för hur ett motoriskt kommando leds från motorbarken via övre/nedre motorneuron till muskeln (steg-för-steg), en **UMN- vs LMN-jämförelsetabell** (förlamningstyp, reflexer, tonus, atrofi, Babinski/fascikulationer), pyramidalt vs extrapyramidalt samt finjustering via basala ganglier, cerebellum och sensorisk återkoppling. Första live-kortet på faktatexter-pillaren.
  - **Tabell `kunskapsbank/nervtabell-motorbanor.html`** (Article+LearningResource, under Nervtabeller): de descenderande banorna i två tabeller – **pyramidala** (corticospinalis lateralis/anterior, corticobulbaris) och **extrapyramidala** (rubro-, vestibulo-, reticulo-, tectospinalis) – med ursprung, korsning (decussation), mål och funktion.
  - Strikt källförankrat (Gray's/Standring, Fitzgerald, Kandel m.fl. – Guyton & Hall på faktatexten); APA-referenser på båda. Korslänkade ömsesidigt + quiz-CTA. Skriv ut/CSV + ren utskrift.
  - **Uttömmande ordlistetooltips (omgjort efter feedback om slarv):** 110 kb-term-länkar (55 + 55) – varje fetmarkerat och facklatinskt/medicinskt ord länkat. Rotorsaken var att artikeln använder svenska former (framhorn, ryggmärgen, kortikospinalbanan) som inte sträng-matchar ordlistans latinska uppslagsord; lösningen var dels att **mappa svenska former → latinska poster** i facit (framhorn→cornu anterius, ryggmärgen→medulla spinalis, motorbarken→gyrus precentralis, lillhjärnan→cerebellum m.fl.), dels att **lägga in 6 termer som genuint saknades i ordlistan** (motorneuron, acetylkolin, motorisk ändplatta, Babinskis tecken, tractus corticobulbaris, ganglia basalia → ordlistan 10 141 → 10 147). Flerordstermer som *decussatio pyramidum*, *basala ganglierna*, *motoriska ändplattan*, *gyrus precentralis*, *nucleus ruber* wire:as som EN tooltip. Facit 608→661; 0 trasiga ankare (661/661 verifierade).
  - Hub `nervtabeller.html`: kort "Motoriska nervbanor" sist, `hasPart`=7. Sitemap (72 URL:er) + llms.txt (ny Faktatexter-sektion) synkade.
  - **Tooltip-kvalitet nu BINDANDE REGEL (SEO_REGLER §6c)** + punkt i pre-flight-checklistan + verifieringsskript: varje **medicinsk/latinsk term** ska ha tooltip (fetstil är INTE kriteriet – pedagogisk betoning wiras inte), flerordstermer som EN tooltip, svenska former mappade till latinska poster, 0 trasiga ankare. Site-wide av-/om-wire med berikad facit (alla 36 kunskapsbankssidor + case): kb-term 3228 → 3301, 0 trasiga ankare (674 facit-termer). Ytterligare ordlistetermer: motorisk, interkostalnerv (10 147 → 10 149). Terminologisidornas `<strong>` är pedagogisk (meningar/FAQ/minnesramsor) + medvetet exkluderade homonymer (kasus/numerus/genus) och wiras därför inte.
- APP_VERSION/VERSION → 0.9.51; app.js-cachebuster → 0.9.51. Nya sidorna på styles.css 0.7.12.

## 0.9.50
- **Autonoma nervsystemet – jämförelseöversikt (sympatikus vs parasympatikus).** Ny sida `kunskapsbank/nervtabell-autonoma.html` (Article+LearningResource) med ett annat format än de regionala nervsidorna: två jämförelsetabeller (Egenskap/Organ | Sympatikus | Parasympatikus). **Grundegenskaper** (roll, ursprung thorakolumbalt vs kraniosakralt, ganglier, pre-/postganglionära signalsubstanser) och **organeffekter** (pupill, hjärta, bronker, mag-tarm, spottkörtlar, urinblåsa, blodkärl, binjuremärg, könsorgan). 18 ordlistetooltips. Titel 63 / desc 141.
  - Facit utökad med 8 fysiologitermer (adrenalin, noradrenalin, peristaltik, sekret/sekretion, sympaticus, vasokonstriktion, bronkdilatation → 600→608).
  - Hub `nervtabeller.html`: nytt kort sist (systemöversikt, ej regional), `hasPart`=6; hubbtexten kompletterad med en mening om autonoma systemet.
  - Sitemap (70 URL:er) + llms.txt synkade.
- Nervgrenen är därmed komplett: kranialnerver, somatiska segment/flätor (hals, bål, arm, ben) och autonom översikt. APP_VERSION/VERSION → 0.9.50; app.js-cachebuster → 0.9.50. Nya sidan på styles.css 0.7.12.

## 0.9.49
- **Nytt nervområde: Bålens nerver (interkostalnerverna, T1–T12).** Ny tabellsida `kunskapsbank/nervtabell-balen.html` (Article+LearningResource). Huvudtabell över de thorakala nervernas främre grenar – nervi intercostales (T1–T11), nervus subcostalis (T12) och nervus intercostobrachialis (T2) – med rötter, motorik (interkostal-/bukväggsmuskler), sensoriska dermatom och bortfall. Plus en liten **dermatomtabell** med kliniska minnesmärken (T4 bröstvårtorna, T6 svärdsutskottet, T10 naveln). 18 ordlistetooltips. Titel 56 / desc 148.
  - Facit utökad med 4 termer (dermatom, pyramidalis, umbilicus, xiphoideus) + flerordstermen *processus xiphoideus* som EN tooltip (596→600).
  - Hub `nervtabeller.html`: nytt kort "Bålens nerver" (anatomisk ordning huvud→hals→bål→arm→ben), `hasPart`=5.
  - Sitemap (69 URL:er) + llms.txt synkade.
- Nervgrenen täcker nu kranialnerver, halsens/bålens segment och de tre stora flätorna. APP_VERSION/VERSION → 0.9.49; app.js-cachebuster → 0.9.49. Nya sidan på styles.css 0.7.12.

## 0.9.48
- **Nytt nervområde: Halsens nerver (plexus cervicalis, C1–C4).** Ny tabellsida `kunskapsbank/nervtabell-halsen.html` (Article+LearningResource) i två tabeller – **hudgrenar** (occipitalis minor, auricularis magnus, transversus colli, supraclaviculares) och **muskelgrenar** (ansa cervicalis, nervus phrenicus till diafragma, direkta grenar till prevertebrala muskler). Kolumner: nerv, rötter, motorisk, sensorisk, bortfall. Komplett SEO-mall, responsiv `.kb-mtable`, APA-referenser, skriv ut/CSV-verktyg + ren utskrift. 43 ordlistetooltips. Titel 48 / desc 145.
  - Facit utökad med 3 termer (diafragma, parotis, pericardium → 593→596).
  - Hub `nervtabeller.html`: nytt kort "Halsens nerver" (anatomiskt mellan Kranialnerverna och Armens nerver), `hasPart`=4.
  - Sitemap (68 URL:er) + llms.txt synkade.
- Med detta täcker nervgrenen alla tre stora somatiska flätorna (cervicalis, brachialis, lumbosacralis) + kranialnerverna. APP_VERSION/VERSION → 0.9.48; app.js-cachebuster → 0.9.48. Nya sidan på styles.css 0.7.12.

## 0.9.47
- **Mobilvänligare punktlistor i löptext.** Content-`<ul>` i `.info-about` ärvde webbläsarens default-indrag (~40px), vilket inuti kortets + info-rutans egen padding gjorde textkolumnen smal och ihoptryckt på mobil (märktes mest på terminologisidorna). Nu egen regel: `.info-about ul/ol` med litet indrag (1,2rem, 1,05rem på mobil), luftigare radavstånd och samma typografi som styckena. På ≤640px krymps även `.info-about`-paddingen (20→15px) så spalten blir bredare. `<ol>` och `.kb-sources` var redan måttliga och är orörda.
- styles.css-cachebuster → **0.7.12** på de 6 sidor som har content-listor (5 terminologisidor + integritet.html); additiv ändring, övriga sidor opåverkade. APP_VERSION/VERSION → 0.9.47; app.js-cachebuster → 0.9.47.

## 0.9.46
- **Tabellverktyg: Skriv ut + Ladda ner (CSV) på alla kunskapsbankstabeller.** Ny `js/kb-table-tools.js` (deferred, CSP-säker, **inga beroenden**) injicerar en diskret, tematisk verktygsrad underst (ovanför navigeringsknapparna) på varje sida med `.kb-mtable`/`.kb-table`. Två knappar:
  - **Skriv ut** → `window.print()`. Liten hjälptext under knapparna förklarar pedagogiskt att man i utskriftsrutan kan välja **Spara som PDF** i stället för skrivare (ingen tung PDF-motor behövs).
  - **Ladda ner (CSV)** → läser tabellernas `textContent` ur DOM:en (flera tabeller per sida slås ihop med rubrik/caption), bygger CSV med UTF-8-BOM (å/ä/ö i Excel) och laddar ner via `Blob`/`URL.createObjectURL`. Öppnas i Excel och Google Kalkylark.
  - Progressiv förbättring: utan JS visas tabellerna som vanligt, bara verktygsraden uteblir.
- **CSS:** nya `.kb-tabletools*`-stilar (diskret emerald-pillerknapp) + ett `@media print`-block som ger en **ren tabellutskrift**: bara `<h1>` + tabellerna (med grupprubriker och captions, tunna cellramar, upprepad kolumnrubrik per sida, ingen radbrytning mitt i en rad). Allt övrigt döljs – brödsmula, ingress/förklaringar/CTA (`.info-about:has(p)`), referenser, verktygsrad och navigeringsknappar – och ordlistelänkarna i cellerna skrivs ut som vanlig text. Tabellgruppernas rubriker (`.info-about` med enbart `<h2>`, t.ex. "Intrinsiska muskler") behålls. styles.css-cachebuster **0.7.10 → 0.7.11** på de 24 tabellsidorna (additivt tillägg → övriga sidor påverkas ej).
- **Mallar:** `generate_muskeltabeller.py` (CSS_V 0.7.11 + script i FOOT) → 16 muskelsidor regenererade och om-wirade (2105 tooltips intakta). De 3 nervsidorna + 5 terminologisidorna handuppdaterade. Verktyget täcker nu alla 24 tabellsidor (1 script-tagg/sida verifierat).
- **`listor-tabeller.html`:** infotexten kompletterad med en ärlig notis om att tabellerna kommer bäst till sin rätt på större skärm (dator/laptop) och att delar kan vara svårare att överblicka på mobil – samt att varje tabell går att skriva ut/ladda ner.
- Inga nya URL:er (sitemap oförändrad, 67). APP_VERSION/VERSION → 0.9.46; app.js-cachebuster → 0.9.46. styles.css → 0.7.11 (tabellsidorna).

## 0.9.45
- **Tooltip-kvalitetspass på muskeltabellerna (efter feedback om snåla tabell-tooltips).** Gap-analys visade att ~100 äkta anatomiska termer i muskeltabellerna fanns i ordlistan men saknades i facit-dicten – därav glesa tooltips. Facit `data/kb_glossary_terms.json` utökad **489 → 593 termer** (+104: bl.a. facialis, linea, tuberculum, maxilla, mandibula, sacrum, arcus, crista, temporalis, pterygoideus, zygomaticus, sphincter, cartilago, manubrium, incisura, lateralflexion, inåtrotation …). Hrefs genererade via generatorns egna `slugify`/`page_key`/`page_file` (auktoritativa ankare, hanterar å/ä/ö → ascii); 0 trasiga ankare i hela facit (593/593 verifierade mot riktiga `id="term-…"`).
  - **Muskeltabellerna re-wirade:** kb-term-länkar **1751 → 2105** (+354). Mest på ansikts-, käk-, ög-, hals-, rygg-, höft-, bäckenbotten- och bröstkorgssidorna (de nya termerna är mest huvud/hals/bäcken).
  - **`wire_terms.py --all`** kört för konsekvens (delad facit) → +20 på övriga kunskapsbankssidor (nervtabeller, kranialnerverna, faktatexter, medicinskt-latin m.fl.). JSON-LD validerad, ingen kb-term i `<head>`, flerordstermer som EN tooltip (longest-match).
- Inga nya sidor/URL:er (sitemap oförändrad, 67). APP_VERSION/VERSION → 0.9.45 (cachebuster: app.js → 0.9.45). styles.css oförändrad (0.7.10/0.7.9).

## 0.9.44
- **Ny nervgren i plugglistorna: Nervtabeller-hub + Kranialnerverna (I–XII).** Speglar muskelstrukturen: Listor & tabeller → **Nervtabeller** (hub) → nervsidor (precis som → Muskeltabeller → regionsidor).
  - **Hub `kunskapsbank/nervtabeller.html`** (CollectionPage+LearningResource, `hasPart`=3): kort-grid med Kranialnerverna + Armens nerver + Benets nerver (alla live). Förklarar uppdelningen kranialnerver (fast set I–XII) vs. perifera nerver (per region via plexus).
  - **Tabellsida `kunskapsbank/nervtabell-armen.html`** (Article+LearningResource): plexus brachialis fem terminala nerver (musculocutaneus, medianus, ulnaris, radialis, axillaris) – kolumner nerv, rötter (C5–T1), motorisk innervation, sensorisk innervation, bortfall. 73 ordlistetooltips. Titel 47 / desc 139.
  - **Tabellsida `kunskapsbank/nervtabell-benet.html`** (Article+LearningResource): plexus lumbosacralis i två tabeller – lumbalis (L1–L4: iliohypogastricus, ilioinguinalis, genitofemoralis, cutaneus femoris lateralis, femoralis, obturatorius) och sacralis (L4–S4: gluteus superior/inferior, ischiadicus, tibialis, fibularis communis, pudendus, cutaneus femoris posterior). 110 ordlistetooltips. Titel 50 / desc 145.
  - **Tooltip-kvalitet (efter feedback):** facit-dicten `data/kb_glossary_terms.json` utökad med 20 termer (470 → 489) – bl.a. cutaneus, fasciculus, supinator, truncus, anus, ischias, perineum, scrotum, tensor, medius, ljumskbråck samt flerords­termerna *collum chirurgicum*, *sulcus nervi ulnaris/radialis*, *collum fibulae*, *cauda equina*. Flerordstermer wire:as som EN sammanhållen tooltip (longest-match), inte som lösa ord bredvid varann.
  - **Tabellsida `kunskapsbank/kranialnerverna.html`** (Article+LearningResource): komplett kolumnuppsättning – nr, nerv (latin/svenska), typ (sensorisk/motorisk/blandad + parasympatisk markerad), funktion, utträde ur skallen (foramen) och bortfall vid skada. Responsiv `.kb-mtable` (caption + `th scope`, stackas på mobil). 43 ordlistetooltips via `wire_terms.py`. Titel 63 / desc 130 tecken.
  - Båda enligt SEO_REGLER §1 (komplett head, OG/Twitter, BreadcrumbList) och §6b (APA-referenser: Terminologia Anatomica, Fitzgerald m.fl., Sobotta, Gray's). Brödsmula kranialnerverna = 5 nivåer (… / Nervtabeller / Kranialnerverna).
  - `listor-tabeller.html`: kortet "Kranialnerverna" → **"Nerver"** som pekar på nerv-hubben (speglar "Muskler per region").
  - `scripts/generate_glossary.py` (`write_sitemap`): la in `nervtabeller` + `kranialnerverna` samt de tidigare saknade `listor-tabeller` och `faktatexter` (båda index sedan 0.9.41 men utanför sitemap) → sitemap regenererad (67 URL:er).
  - `llms.txt`: nya rader för nerv-hubben och kranialnerverna under "Listor och tabeller".
- APP_VERSION/VERSION → 0.9.44 (cachebuster: app.js → 0.9.44). styles.css oförändrad (0.7.10/0.7.9).

## 0.9.43
- **Kunskapsbankens menysidor: bättre ingresser, omflyttad infotext och enhetlig kortstandard.** Innehållsändringar i body; ingen indexering påverkad (alla sidor `index, follow`).
  - **Hubben (`kunskapsbank/index.html`):** ny ingress under h1 (handlingsinriktad istället för "Allt material samlat …"). Den beskrivande texten flyttad från ovanför korten till under dem – på mobil möts man av alternativen direkt, inte en textvägg. Texten omformulerad.
  - **Medicinsk terminologi (`medicinsk-terminologi.html`):** beskrivande infotext flyttad till under områdeskorten (hängande "Områden som hör hit:"-inledning borttagen, sammanslagen med ordliste-hänvisningen).
  - **Listor & tabeller (`listor-tabeller.html`):** textlistan med inbäddade hyperlänkar ersatt av samma kort-/knappstandard (`.kb-grid`/`.kb-card`) som hubben – live-kort för muskeltabellerna + tre `is-placeholder` "Snart"-kort (kranialnerver, kärl, skelett). Ny ingress under h1 ("Studielistor för anatomiplugget …"). Meta description omskriven med sökordet "plugglistor".
  - **Muskeltabeller (`muskeltabeller.html`):** footern följer nu tvåknapps-standarden – primär CTA "Testa dig själv i quizet" + tillbaka-länk.
- APP_VERSION/VERSION → 0.9.43 (cachebuster: app.js → 0.9.43). styles.css oförändrad (0.7.10/0.7.9).

## 0.9.42
- **Fix: absoluta URL:er i breadcrumb-strukturdata på alla 17 muskeltabell-sidor.** Google flaggade "Ogiltig webbadress i fältet id" eftersom position 1–3 i `BreadcrumbList` använde relativa URL:er (`/`, `/kunskapsbank/`, `/kunskapsbank/listor-tabeller.html`). Nu absoluta (`https://anatomiquiz.se/…`). HTML-breadcrumbens länkar förblir relativa. Fixat vid källan i `scripts/generate_muskeltabeller.py` (`bc_jsonld` absolutiserar relativa URL:er) så det inte regrederar vid regenerering.
- APP_VERSION/VERSION → 0.9.42 (cachebuster: app.js → 0.9.42). styles.css oförändrad (0.7.10/0.7.9).

## 0.9.41
- **Fix: tog bort felaktig `noindex` på två kunskapsbank-pillarsidor.** `kunskapsbank/faktatexter.html` och `kunskapsbank/listor-tabeller.html` hade `robots: noindex, follow` (infört i 0.9.21, aldrig pushat). Båda satta till `index, follow, max-snippet:-1, max-image-preview:large` – matchar övriga kunskapsbank-sidor. Sidorna får nu indexeras av Google igen.
- APP_VERSION/VERSION → 0.9.41 (cachebuster: app.js → 0.9.41). styles.css oförändrad (0.7.10/0.7.9).

## 0.9.40
- **Ordlistan: ~160 nya poster inom vårdinstrument/skalor och operationssal (9 983 → 10 141 poster, passerade 10 000).** Två faktagranskade temalistor; befintliga poster orörda, homonymer lösta som EN post med numrerade betydelser, inga slug-kollisioner, inga gissade ICD-koder.
  - **Medicinska undersökningsinstrument & skalor (100):** 70 nya i grundmallsformat (avbildning, IVA-/sepsis-skalor, kognitiva test, psykiatriska skattningsskalor, smärt- och funktionsskalor, riskscorer m.m. – EKG, NIHSS, MMSE, MoCA, PHQ-9, GAD-7, PANSS, AUDIT, DUDIT, mRS, WOMAC, CHA2DS2-VASc, CURB-65, APACHE II, MELD, FRAX …). Homonymer utökade: VAS (kärl + visuell analog skala), ESS (endoskopisk sinuskirurgi + Epworth Sleepiness Scale). Noter om delade förkortningar: SAPS (även Simplified Acute Physiology Score), ENG (även elektronystagmografi). Hoppade nästan-dubbletter: ECHO (= Ekokardiografi), WHODAS 2.0 (= WHODAS).
  - **Operationssal (100):** 88 nya kirurgiska instrument i grundmallsformat med eponymförklaring och Eng.-namn (skalpell, saxar, peanger, pincetter, retraktorer, bensåg/-instrument, suturer, staplers, diatermi/energiinstrument, drän, anestesi- och luftvägsutrustning, katetrar, proteser/implantat m.m.). #40+#41 Stapler sammanslagna till en post; Pulsoximeter/Ortos fanns redan.
- APP_VERSION/VERSION → 0.9.40 (cachebuster: app.js → 0.9.40). styles.css oförändrad (0.7.10/0.7.9).

## 0.9.39
- **Ordlistan: stor utbyggnad inom klinik, svensk vård/juridik, psykologi och arbetsterapi (9 594 → 9 983 poster).** Fyra faktagranskade temalistor inarbetade; befintliga poster lämnades orörda och homonymer löstes som EN post med numrerade betydelser (ingen dubblering, inga slug-kollisioner). Inga ICD-koder gissade.
  - **Kliniska akronymer (2 listor):** spann AAA–HUS och A1AT–MPN i STEMI-format. Homonymer ihopslagna: CHD, FAST, FAP (behåller ICD D12.6), CAPS, HP. Korrigerat: EHL = elektrohydraulisk litotripsi, CAS = karotisstenting.
  - **Klinik ACD–LMNA + svensk vård/juridik:** sjukdomar/instrument samt lagar (HSL, PSL, PL, PDL, OSL, LPT, LRV, LVM, LVU, LSS, SoL, SmL), myndigheter (IVO, TLV, FHM, SBU …), vårdnivåer/avdelningar (IVA, MAVA, AKM, UVA, PAVA …), klassifikationer (ICD-10-SE, KVÅ, KSH97-P) och kvalitetsregister (Riksstroke, Swedeheart, SveDem, NDR, SRQ, GallRiks, SOReg …). Homonymer: HSV, HSAN, BT, CAD utökade.
  - **Psykologi/psykiatri (200 begrepp):** 151 nya i grundmallsformat (affekt­begrepp, ångest-/förstämnings-/psykos-/personlighets-syndrom, kognition, neuropsykiatri, ätstörningar, sömn, demens, beroende, terapiformer och -tekniker, försvarsmekanismer, inlärningspsykologi). Depression utökad med psykiatrisk betydelse; PDT med psykodynamisk terapi.
  - **Arbetsterapi (120 begrepp):** 98 nya nettoposter (aktivitetsbegrepp, ADL/IADL, hjälpmedel, modeller och bedömningsinstrument). GAS/OSA utökade.
- **Kvalitetskontroll mot källor – 15 overifierbara/felaktiga poster borttagna eller rättade.** De okällade (AI-genererade) deldelarna webbverifierades. Borttagna som påhittade/icke-standard: ISA (svamparterit), OCA, SPSQ, HES, WAL, AMPS-K, MOHO-IRM, MOHO-CG, COPM-R, COPM-S, AMPS-SWE, OSA-E, OSA-SF, SIP-OA, WES-R. Rättade uttydningar: ValMO (Value and Meaning in Occupations), SDO (Satisfaction with Daily Occupations), A-ONE (Árnadóttir OT-ADL), COTE, RPS-Form, GKR → GallRiks. ISA återinlagd med rätt betydelse (intrinsisk sympatomimetisk aktivitet); CVS (cykliskt kräkningssyndrom) och ICPN (intracholecystisk papillär neoplasi) tillagda korrekt.
- APP_VERSION/VERSION → 0.9.39 (cachebuster: app.js → 0.9.39). styles.css oförändrad (0.7.10/0.7.9).

## 0.9.38
- **Ordlistan: 146 nya kliniska akronymer (9 448 → 9 594 poster).** Två faktagranskade listor på vardera 100 kliniska akronymer; de som saknades lades in i STEMI-format (`förk.`, `(eng.)`, svensk betydelse + förklaring, `Eng.`-full form, `Jfr`-korslänkar), de som redan fanns lämnades orörda. Inga ICD-koder gissade. Spann A–M (kardiologi, onkologi, neurologi, nefrologi, reumatologi, infektion, lungmedicin, kirurgi m.m.).
- **Två felaktiga/tvetydiga uppslag korrigerade på begäran:** EHL lades som *elektrohydraulisk litotripsi* (inte "extrakorporeal", som är ESWL; not om att EHL i anatomin även = extensor hallucis longus); CAS lades som *karotisstenting* (standardbetydelsen, parar med CEA; not om att CAS ibland avser själva karotisstenosen).
- **Homonymer lösta som EN post med numrerade betydelser** (ingen dubblering, ingen slug-kollision): CHD (medfött hjärtfel / kranskärlssjukdom), FAST (traumaultraljud / AKUT-tecknen vid stroke), FAP (familjär adenomatös polypos – behåller ICD-10 D12.6 / familjär amyloid polyneuropati), CAPS (katastrofalt antifosfolipidsyndrom / cryopyrinassocierat periodiskt syndrom), HP (Helicobacter pylori / hypersensitivitetspneumonit). Tvetydiga förkortningar (ARF, APC, CDI, BPD, GAD, DES, ECM, HSP m.fl.) fick parentes-not om vanlig alternativbetydelse. Ordlistan regenererad via `scripts/generate_glossary.py` – JSON valid, inga slug-kollisioner.
- APP_VERSION/VERSION → 0.9.38 (cachebuster: app.js → 0.9.38). styles.css oförändrad (0.7.10/0.7.9).

## 0.9.37
- **Ordlistan: 64 nya kliniska akronymer (9 384 → 9 448 poster).** Lade in de av en given lista på 100 kliniska akronymer (kardiologi, onkologi, neurologi m.fl.) som saknades; 36 fanns redan och lämnades orörda (ingen dubblering). Format enligt STEMI/NSTEMI-mönstret: versal akronym som uppslag, `förk.` som ordklass, `(eng.)`-markering, svensk betydelse + förklaring, `Eng.`-full form och `Jfr`-korslänkar. **Inga ICD-koder gissade** – posterna lades utan ICD (kan berikas senare mot Socialstyrelsen). Tre homonymer slogs ihop till en post med numrerade betydelser: **ICD** (1 klassifikation / 2 implanterbar defibrillator), **APS** (1 antifosfolipidsyndrom / 2 autoimmunt polyglandulärt syndrom), **GBS** (1 Guillain–Barré / 2 grupp B-streptokocker). **DI** fick egen slug (`term-di-diabetes-insipidus`) för att inte krocka med prefixet `di-`. Ordlistan regenererad via `scripts/generate_glossary.py` – JSON valid, inga slug-kollisioner.
- APP_VERSION/VERSION → 0.9.37 (cachebuster: app.js → 0.9.37). styles.css oförändrad (0.7.10/0.7.9).

## 0.9.36
- **Muskeltabeller: två nya regioner – Ögat och Bäckenbotten (kroppstäckningen klar).** `kunskapsbank/muskeltabell-ogat.html` (7 muskler): de yttre ögonmusklerna – fyra raka (mm. recti superior/inferior/medialis/lateralis), två sneda (mm. obliqui superior/inferior) och levator palpebrae superioris – med ursprung från anulus tendineus communis (Zinns sena), innervation enligt "LR6 SO4 – resten 3" (n. abducens VI, n. trochlearis IV, n. oculomotorius III). `kunskapsbank/muskeltabell-backenbotten.html` (10 muskler): diaphragma pelvis (levator ani med puborectalis, pubococcygeus, iliococcygeus samt ischiococcygeus) och mellangården/perineum (transversus perinei profundus/superficialis, sphincter urethrae externus, bulbospongiosus, ischiocavernosus, sphincter ani externus) – mest på n. pudendus (S2–S4). Båda med ursprung, fäste, innervation och funktion, responsiv `.kb-mtable`, APA-referenser, kb-term-tooltips, quiz-korslänk. Under-pillaren listar nu **16 regioner**; tillagda i `sitemap.xml` och `llms.txt`.
- **Generatorn härdad (körbar SEO_REGLER).** `scripts/generate_muskeltabeller.py` gör nu hela jobbet i ett kommando: (1) genererar sidorna, (2) wire:ar in kb-term-tooltips på **exakt** de genererade sidorna (aldrig `--all` → ingen spill till orelaterade sidor, ingen nollställning), (3) kör en inbyggd **§12-grind** (`check_seo_compliance`) som stoppar bygget om någon sida bryter mot SEO_REGLER (titel ≤65, description 25–150, giltig JSON-LD + BreadcrumbList, en `<h1>`, skip-länk, canonical, OG/Twitter, Referenser, responsiv tabell, inga inline-stilar, dubblettkoll). Bevisat att grinden biter. Ny valfri `titel`-override i datan för långa regionnamn (bäckenbotten).
- APP_VERSION/VERSION → 0.9.36 (cachebuster: app.js → 0.9.36). styles.css oförändrad (0.7.10/0.7.9).

## 0.9.35
- **Muskeltabeller: ny region – Ansiktet (mimisk muskulatur).** `kunskapsbank/muskeltabell-ansiktet.html` (genererad ur `data/muskeltabeller/ansiktet.json`): 18 muskler i grupperna skalp och ögonbryn (occipitofrontalis, corrugator supercilii), ögonspringan (orbicularis oculi), näsan (procerus, nasalis, depressor septi nasi), munnen och läpparna (levator labii superioris alaeque nasi, levator labii superioris, zygomaticus minor/major, levator anguli oris, risorius, depressor anguli oris, depressor labii inferioris, mentalis, orbicularis oris), kinden (buccinator) och ytterörat (musculi auriculares). Med ursprung, fäste, innervation och funktion. Till skillnad från övriga muskelsidor fäster dessa i huden och styrs **alla av nervus facialis (VII)** (utvecklade ur andra gälbågen) – intron avgränsar mot halssidan (platysma), käksidan (tuggmusklerna) och ögongloben (yttre ögonmuskler, III/IV/VI). Responsiv `.kb-mtable`, APA-referenser, kb-term-tooltips (124 st), quiz-korslänk och unik kort-/knapptext. Under-pillaren listar nu **14 regioner**; tillagd i `sitemap.xml` och `llms.txt`.
- APP_VERSION/VERSION → 0.9.35 (cachebuster: app.js → 0.9.35). styles.css oförändrad (0.7.10/0.7.9).

## 0.9.34
- **Ordlistetooltips (kb-term) på de 7 nya muskelsidorna + permanent wiring-skript.** De sju regionerna från 0.9.27–0.9.33 (underarmen, foten, ryggen, halsen, bröstkorgen, höften, käken) saknade kb-term-tooltips eftersom regenerering nollställer dem och påkörningssteget tidigare låg i en temporär mapp. Nu finns **`scripts/wire_terms.py`** permanent i repot: ett idempotent steg-2-skript som wire:ar in `<a class="kb-term">`-länkar i löptext, rubriker, tabellceller och referenser – men aldrig i `<head>`/JSON-LD, brödsmulan, HTML-kommentarer eller befintliga `<a>`. Termkällan **`data/kb_glossary_terms.json`** (470 termer → href + kort definition) är extraherad ur de redan wirade sidorna; skriptet reproducerar samtliga befintliga muskelsidor + hubben **byte-identiskt** (validerat). De 7 nya sidorna fick **804 tooltips** totalt (underarmen 209, foten 179, höften 119, halsen 101, ryggen 100, bröstkorgen 48, käken 48), i exakt samma term-standard som de tidigare muskelsidorna. Kör om efter varje regenerering: `python3 scripts/wire_terms.py <fil> …` (eller `--all`).
- APP_VERSION/VERSION → 0.9.34 (cachebuster: app.js → 0.9.34). styles.css oförändrad (0.7.10/0.7.9).

## 0.9.33
- **Muskeltabeller: ny region – Käken (tuggmusklerna).** `kunskapsbank/muskeltabell-kaken.html` (genererad ur `data/muskeltabeller/kaken.json`): 4 muskler – masseter, temporalis, pterygoideus medialis och lateralis – som rör underkäken i käkleden (TMJ), alla innerverade av nervus mandibularis (V3). Med ursprung, fäste, innervation och funktion (käkstängning vs. öppning/diskstyrning av pterygoideus lateralis, masseter–pterygoideus medialis-slyngan). Intron avgränsar mot de suprahyoidala käköppnarna (halssidan) och de mimiska ansiktsmusklerna (n. facialis) som inte passar ursprung–fäste-formatet. Responsiv `.kb-mtable`, APA-referenser, kb-term-tooltips, quiz-korslänk och unik kort-/knapptext. Under-pillaren listar nu **13 regioner**; tillagd i `sitemap.xml` och `llms.txt`.
- APP_VERSION/VERSION → 0.9.33 (cachebuster: app.js → 0.9.33). styles.css oförändrad (0.7.10/0.7.9).

## 0.9.32
- **Muskeltabeller: ny region – Höften (och sätet).** `kunskapsbank/muskeltabell-hoften.html` (genererad ur `data/muskeltabeller/hoften.json`): 13 muskler i tre grupper – inre höftmuskler/höftböjare (psoas major, psoas minor, iliacus = iliopsoas), yttre höftmuskler/sätesmuskler (gluteus maximus, medius, minimus, tensor fasciae latae) och pelvitrokantära djupa utåtrotatorer (piriformis, obturatorius internus, gemellus superior/inferior, quadratus femoris, obturatorius externus). Med ursprung, fäste, innervation (n. gluteus superior/inferior, n. femoralis, plexus lumbalis/sacralis m.fl.) och funktion, inkl. Trendelenburg-stabilisering och piriformis foramen supra-/infrapiriforme. Intron avgränsar mot lårsidan (quadriceps, adduktorer, hamstrings). Responsiv `.kb-mtable`, APA-referenser, kb-term-tooltips, quiz-korslänk och unik kort-/knapptext. Under-pillaren listar nu **12 regioner**; tillagd i `sitemap.xml` och `llms.txt`.
- APP_VERSION/VERSION → 0.9.32 (cachebuster: app.js → 0.9.32). styles.css oförändrad (0.7.10/0.7.9).

## 0.9.31
- **Muskeltabeller: ny region – Bröstkorgen.** `kunskapsbank/muskeltabell-brostkorgen.html` (genererad ur `data/muskeltabeller/brostkorgen.json`): 8 muskler i tre grupper – egentliga bröstväggsmuskler (intercostales externi/interni/intimi, subcostales, transversus thoracis), diafragma (mellangärdet, med ursprung sternalt/kostalt/lumbalt, fäste i centrum tendineum, n. phrenicus C3–C5 och passagerna T8/T10/T12) samt accessoriska spinokostala andningsmuskler (serratus posterior superior/inferior). Med ursprung, fäste, innervation och funktion (in-/utandning). Intron avgränsar mot skuldersidan (pectoralis major/minor, serratus anterior, subclavius), halssidan (scalener, sternocleidomastoideus) och bukväggssidan. Responsiv `.kb-mtable`, APA-referenser, kb-term-tooltips, quiz-korslänk och unik kort-/knapptext. Under-pillaren listar nu **11 regioner**; tillagd i `sitemap.xml` och `llms.txt`.
- APP_VERSION/VERSION → 0.9.31 (cachebuster: app.js → 0.9.31). styles.css oförändrad (0.7.10/0.7.9).

## 0.9.30
- **Muskeltabeller: ny region – Halsen.** `kunskapsbank/muskeltabell-halsen.html` (genererad ur `data/muskeltabeller/halsen.json`): 17 muskler i fem grupper – ytliga halsmuskler (platysma, sternocleidomastoideus), suprahyoidala (digastricus, stylohyoideus, mylohyoideus, geniohyoideus), infrahyoidala (sternohyoideus, sternothyroideus, thyrohyoideus, omohyoideus), djupa laterala scalener (anterior, medius, posterior) och prevertebrala muskler (longus colli, longus capitis, rectus capitis anterior/lateralis). Med ursprung, fäste, innervation (n. facialis, n. accessorius, ansa cervicalis, rami ventrales m.fl.) och funktion; intron avgränsar mot skuldersidan (trapezius, levator scapulae) och ryggsidan (splenius, suboccipitala muskler). Responsiv `.kb-mtable`, APA-referenser, kb-term-tooltips, quiz-korslänk och unik kort-/knapptext. Under-pillaren listar nu **10 regioner**; tillagd i `sitemap.xml` och `llms.txt`.
- APP_VERSION/VERSION → 0.9.30 (cachebuster: app.js → 0.9.30). styles.css oförändrad (0.7.10/0.7.9).

## 0.9.29
- **Muskeltabeller: ny region – Ryggen.** `kunskapsbank/muskeltabell-ryggen.html` (genererad ur `data/muskeltabeller/ryggen.json`): 15 muskler – de **egentliga (autoktona) ryggmusklerna**, alla innerverade av rami dorsales – i fem grupper: spinotransversala systemet (splenius capitis/cervicis), erector spinae (iliocostalis, longissimus, spinalis), transversospinala systemet (semispinalis, multifidus, rotatores), korta segmentella muskler (interspinales, intertransversarii, levatores costarum) och de suboccipitala nackmusklerna (rectus capitis posterior major/minor, obliquus capitis superior/inferior). Med ursprung, fäste, innervation och funktion. Intron avgränsar mot de ytliga spinoskapulära/spinohumerala musklerna (trapezius, latissimus, rhomboideer, levator scapulae) som beskrivs på skuldersidan och mot de spinokostala andningsmusklerna. Responsiv `.kb-mtable`, APA-referenser, kb-term-tooltips, quiz-korslänk och unik kort-/knapptext. Under-pillaren listar nu **9 regioner**; tillagd i `sitemap.xml` och `llms.txt`.
- APP_VERSION/VERSION → 0.9.29 (cachebuster: app.js → 0.9.29). styles.css oförändrad (0.7.10/0.7.9).

## 0.9.28
- **Muskeltabeller: ny region – Foten.** `kunskapsbank/muskeltabell-foten.html` (genererad ur `data/muskeltabeller/foten.json`): 16 muskler med intrinsisk/extrinsisk-indelning (samma upplägg som handen). **Intrinsiska:** fotryggens korta sträckare (extensor digitorum/hallucis brevis) samt fotsulans fyra lager – 1:a lagret (abductor hallucis, flexor digitorum brevis, abductor digiti minimi), 2:a lagret (quadratus plantae, lumbricales), 3:e lagret (flexor hallucis brevis, adductor hallucis, flexor digiti minimi brevis) och 4:e lagret (interossei plantares/dorsales). **Extrinsiska:** de långa tåböjarna (flexor digitorum/hallucis longus) och tåsträckarna (extensor digitorum/hallucis longus) från underbenet. Med ursprung, fäste, innervation (plantaris medialis/lateralis, fibularis profundus, tibialis) och funktion; intron och typ-förklaringen knyter ihop med underbenssidan för vadens plantarflexorer. Responsiv `.kb-mtable`, APA-referenser, kb-term-tooltips, quiz-korslänk och unik kort-/knapptext. Under-pillaren listar nu **8 regioner**; tillagd i `sitemap.xml` och `llms.txt`.
- APP_VERSION/VERSION → 0.9.28 (cachebuster: app.js → 0.9.28). styles.css oförändrad (0.7.10/0.7.9).

## 0.9.27
- **Muskeltabeller: ny region – Underarmen.** `kunskapsbank/muskeltabell-underarmen.html` (genererad ur `data/muskeltabeller/underarmen.json`): 19 muskler i fem grupper – främre logens ytliga lager (pronator teres, flexor carpi radialis, palmaris longus, flexor carpi ulnaris, flexor digitorum superficialis) och djupa lager (flexor digitorum profundus, flexor pollicis longus, pronator quadratus) samt bakre logens radiala grupp (brachioradialis, ECRL, ECRB), ytliga lager (extensor digitorum, extensor digiti minimi, extensor carpi ulnaris) och djupa lager (supinator, abductor pollicis longus, extensor pollicis brevis/longus, extensor indicis) – med ursprung, fäste, innervation och funktion. Intron sammanfattar innervationstumregeln (medianus framtill utom FCU och ulnara FDP-halvan; radialis i hela bakre logen) och knyter ihop med handsidans extrinsiska muskler. Responsiv `.kb-mtable`, APA-referenser, kb-term-tooltips, quiz-korslänk och unik kort-/knapptext. Under-pillaren listar nu **7 regioner**; tillagd i `sitemap.xml` och `llms.txt`.
- APP_VERSION/VERSION → 0.9.27 (cachebuster: app.js → 0.9.27). styles.css oförändrad (0.7.10/0.7.9).

## 0.9.26
- **Muskeltabeller: ny region – Bukväggen.** `kunskapsbank/muskeltabell-bukvaggen.html` (genererad ur `data/muskeltabeller/bukvaggen.json`): 5 muskler i två grupper – främre och laterala bukväggen (rectus abdominis, obliquus externus/internus, transversus abdominis) samt bakre bukväggen (quadratus lumborum) – med ursprung, fäste, innervation och funktion. Responsiv `.kb-mtable`, APA-referenser, kb-term-tooltips, quiz-korslänk och unik kort-/knapptext. Under-pillaren listar nu **6 regioner**; tillagd i `sitemap.xml` och `llms.txt`.
- APP_VERSION/VERSION → 0.9.26 (cachebuster: app.js → 0.9.26). styles.css oförändrad (0.7.10/0.7.9).

## 0.9.25
- **Ordlistetooltips (kb-term) i hela kunskapsbanken.** Medicinska, anatomiska, latinska och grekiska termer i löptext, rubriker och tabeller får en diskret prickad linje → tooltip med kort definition (hover på dator, tryck på mobil) plus länk till rätt post i ordlistan. Det är en äkta intern länk som fungerar **utan JS** (progressiv förbättring); tooltipen visas via nya `js/kb-glossary.js` (deferred, overlay `position:fixed` → CLS 0, inga externa beroenden). Matchningen täcker enord (inkl. svenska böjningar), **flerordstermer** (hela frasen som en länk) och en kurerad lista korta anatomiska ord (cor, pes, ren, vas); homonymer som krockar med svenska ord exkluderas. Definitioner ligger inline i `data-def` (ingen fetch av den stora ordlistan). Nya stilar `.kb-term`/`.kb-tip`. Applicerat på de sex terminologisidorna, patientfallen (`case.html`) och muskeltabellerna.
- **Mer intern länkning i hela sajten.** Alla 31 ordlistesidor länkar nu tillbaka till Medicinsk terminologi (footer i `generate_glossary.py`); `case.html` länkar till ordlistan, terminologin och kunskapsbanken; `info.html` länkar till kunskapsbanken. `write_sitemap` är nu **fullständig källa** (inkluderar kunskapsbank, muskeltabeller och `integritet.html` som tidigare saknades). CSS-cachebustern på ordlistan synkad 0.7.1 → 0.7.9.
- **Trovärdighet: APA-referenser på alla dokument.** Ny regel i `SEO_REGLER.md` §6b – varje innehållsdokument ska ha en synlig **"Referenser"-lista** längst ner i **APA 7-format**. Retroaktivt infört på samtliga terminologisidor ("Källor & vidare läsning" → "Referenser", APA-formaterade poster).
- **Terminologi-pillarens länkar blev temakort.** De fem undersidolänkarna på `medicinsk-terminologi.html` visas nu som `.kb-card`-kort (samma kort-/temasystem som hubben) i stället för en punktlista.
- **Ny avdelning: Muskeltabeller.** Datadriven generator `scripts/generate_muskeltabeller.py` (`data/muskeltabeller/*.json` → sidor) bygger en under-pillar (`muskeltabeller.html`) och **5 regionsidor** – handen, skuldran, överarmen, låret och underbenet (**66 muskler** totalt) – med kärntabell (latinskt/svenskt namn, ursprung/origo, fäste/insertio, innervation, funktion), intrinsisk/extrinsisk-indelning där det är relevant (handen) med förklaringsblock, APA-referenser, kb-term-tooltips, korslänk in i quizet samt **unik kort- och knapptext per region**. Tabellerna är **responsiva `.kb-mtable`** som stackas till kort på mobil med fältetiketter (ARIA-roller bevarar tabellsemantiken) och **kräver aldrig horisontell scroll** (`SEO_REGLER.md` §7). Listor-pillaren (`listor-tabeller.html`) länkar till muskeltabellerna; ny "Listor och tabeller"-sektion i `llms.txt`.
- APP_VERSION/VERSION → 0.9.25 (cachebuster: app.js → 0.9.25). styles.css → 0.7.10 (muskelsidor) / 0.7.9 (övriga kunskapsbankssidor).

## 0.9.24
- **Ny bindande standard: `SEO_REGLER.md`.** Komplett SEO-/tillgänglighets-/prestanda-/agent-standard i repo-roten som MÅSTE följas av all HTML-/sitemap-/llms-/css-/JSON-LD-kod: den heliga `<head>`-mallen (matchar index.html), titel-/description-regler (Bing), OG/Twitter, JSON-LD per sidtyp, a11y-trädet, CLS 0, agent-kriterier, kod-dokumentation, **KEDJAN** (allt som måste uppdateras ihop) samt pre-flight-checklista med verifieringsskript. Inlänkad från `CLAUDE_REGLER.md` (båda bindande).
- **Terminologisidorna SEO-härdade mot Bing & PageSpeed.** Alla sex sidor (pillaren + medicinskt latin, grekiska, deklinationer, uttalsregler, terminologins historia):
  - **Titlar kortade till ≤65 tecken** (var 70–83), unika och utan repetition/boilerplate (t.ex. *uttal→uttalsregler*-dubbleringen och parentes-stuffing borttagna); `og:title`/`twitter:title` synkade med titel-core.
  - **Descriptions kortade till 134–144 tecken** (var 186–236) → inom Bings 25–150 och husnormen; alla unika.
  - **`<caption>` lades till på alla datatabeller** (18 st som saknade) → tillgänglighetsträdet helt grönt i PageSpeed.
- **llms.txt:** ny **Kunskapsbank**-sektion (hub + de sex terminologisidorna) → uppfyller PageSpeeds agentiska kriterium om aktuell llms.txt.
- Bekräftat via PageSpeed: tillgänglighetsträdet korrekt formaterat, **CLS = 0**, llms.txt följer rekommendationerna. Inga URL:er ändrade; endast meta/innehåll/dokumentation.
- APP_VERSION/VERSION → 0.9.24 (cachebuster: app.js → 0.9.24). styles.css oförändrad (0.7.8).

## 0.9.23
- **Tre nya innehållssidor – terminologi-pillaren komplett.** Avdelningen "Medicinsk terminologi" har nu alla fem områden som riktiga sidor:
  - `/kunskapsbank/medicinskt-latin.html` – hur anatomiska termer är byggda: latin vs. grekiska (anatomi vs. klinik), ordbildning (förled + rot + efterled + bindevokal) med uppdelningstabell, **riktnings- och lägestermer** (anterior/posterior, medial/lateral, proximal/distal, dexter/sinister m.fl.), rörelsetermer (flexio/extensio, pronatio/supinatio …), vanliga latinska rötter för kroppsdelar, latinska förled samt beskrivande adjektiv (form/storlek/antal/färg). FAQ (t.ex. *rectus abdominis*, *anterior/posterior*) speglad i `FAQPage`-JSON-LD.
  - `/kunskapsbank/grekiska-i-medicinen.html` – grekiskan som sjukdomarnas/ingreppens språk: grekiska i latinsk omskrivning, **organrötter** (kardio-, nefro-, hepato-, gastro- …), **kliniska ändelser** (-it, -os, -om, -pati, -algi, -ektomi, -tomi, -stomi, -skopi …) med skillnaden -it vs. -os, **prefix** (a-/an-, dys-, hyper-/hypo-, peri-, endo- …) och en "sätt ihop det själv"-del (läs bakifrån). FAQ + `FAQPage`-JSON-LD.
  - `/kunskapsbank/terminologins-historia.html` – tidslinje från Hippokrates och Galenos via arabiska översättare, Vesalius (1543) och Linné till standardiseringen (Basel/BNA 1895 → *Nomina Anatomica* → **Terminologia Anatomica** 1998/2019, FIPAT/IFAA), eponymernas uppgång och fall samt varför "döda" språk används. FAQ + `FAQPage`-JSON-LD.
- Alla tre är indexerbara, i sitemap (priority 0.7), med `Article`/`LearningResource`-JSON-LD, brödsmula och korslänkar inbördes + till ordlistan och quizet.
- **Terminologi-pillaren färdig och Live.** På `/kunskapsbank/medicinsk-terminologi.html` är punkterna "Medicinskt latin", "Grekiska i medicinen" och "Terminologins historia" nu länkar (deklinationer + uttalsregler var redan länkade) – samtliga fem områden pekar nu på riktiga sidor. Eftersom alla undersidor nu är fyllda gjordes pillaren **indexerbar** (`robots: index, follow`, lagd i sitemap) och fick OG/Twitter-taggar samt `CollectionPage`/`LearningResource`-JSON-LD med `hasPart` (de fem sidorna) och breadcrumb. Hub-kortet "Medicinsk terminologi" på `/kunskapsbank/` bytte status **Snart → Live** ("Öppna terminologin").
- `sitemap.xml`: de tre nya sidorna + terminologi-pillaren tillagda (lastmod 2026-06-25).
- APP_VERSION/VERSION → 0.9.23 (cachebuster: app.js → 0.9.23). Inga ändringar i befintliga sidors meta/head, styles.css oförändrad (0.7.8).

## 0.9.22
- **Ny innehållssida: Uttalsregler.** `/kunskapsbank/uttalsregler.html` – hur medicinsk latin och grekiska uttalas. Tre uttalstraditioner (klassiskt/kyrkligt/nationellt) + jämförelsetabell klassiskt vs. medicinskt, varför vården valde det kyrkligt-medeltida uttalet, hur latinets ljud rekonstruerats (med *Caesar → Kaiser/tsar*-exemplet), vokaler & diftonger (ae/oe/au/eu, inkl. svensk *eu→ev*), konsonanttabell (c/g/ti/ch/ph/th/qu m.fl.), betoning (penultima-regeln) samt grekiskan i medicinen och **hela grekiska alfabetet i tabell** (tecken, namn med dubbelformer, omskrivning, uttal). Rejäl **Fråga & svar** (t.ex. *c* i biceps → "bi-seps") speglad i `FAQPage`-JSON-LD. Indexerbar, i sitemap, `Article`/`LearningResource`-JSON-LD. Länkad från terminologi-pillaren (punkten "Uttalsregler" är nu en länk).
- `sitemap.xml`: `/kunskapsbank/uttalsregler.html` tillagd (priority 0.7).
- APP_VERSION/VERSION → 0.9.22 (cachebuster: app.js → 0.9.22). Inga ändringar i befintliga sidors meta/head, styles.css oförändrad (0.7.8).

## 0.9.21
- **Ny Kunskapsbank (innehållshub).** Egen hub-sida `/kunskapsbank/` (mapp med `index.html`) som samlar sajtens fördjupningsmaterial i ett kortrutnät: medicinsk ordlista, medicinsk terminologi, patientfall (case), samt "Listor & tabeller" och "Faktatexter" (under uppbyggnad) och en länk in i quizet. Brödsmula + `CollectionPage`/`LearningResource`-JSON-LD som övriga undersidor.
- **Framsidans meny ommöblerad.** Accent-raden med separata knappar "Exempel med case" och "Medicinsk ordlista" ersatt av en knapp **"Kunskapsbank"**. Ordlistan och casen nås nu via hubben. **Inga URL:er ändrade** – `medicinskordlista.html`, `ordlista-*.html` och `case.html` ligger kvar på sina adresser (bara menyn pekar om).
- **Första riktiga innehållssidan: Deklinationer & pluralformer.** `/kunskapsbank/deklinationer-pluralformer.html` – hur medicinska termer böjs i singular/plural: snabbtabell (`-a→-ae`, `-us→-i`, `-um→-a`, `-is→-es`, `-ex/-ix→-ices`, `-en→-ina`, 4:e/5:e dekl., grekiska `-ma→-mata`/`-on→-a`/`-nx→-nges`), detaljtabeller per deklination, fallgropar (sinus/plexus/meatus/corpus/os), FAQ och källor. Skriven för både nybörjare (t.ex. medicinska sekreterare) och proffs: grundförklaring (*vad är en deklination?* – kasus, numerus, genus, genitiven som facit), genitiven i anatomiska namn (caput femoris m.fl.), genus/kongruens, samt en kort och lugn **lathund** (fem grundregler + täck-över-övning). Alla påståenden faktakollade mot latinsk/grekisk grammatik och Terminologia Anatomica. Indexerbar, i sitemap, korslänkad till ordlistan + quiz. `Article`/`LearningResource`- och `FAQPage`-JSON-LD. Länkad från terminologi-pillaren.
- **Nya tabellstilar.** `.kb-table`/`.kb-table-wrap` (vänsterställda faktatabeller med vågrät scroll på mobil) + `.kb-sources` för källförteckning. Cachebuster `css/styles.css` → 0.7.8 (uppdaterad på framsidan och alla kunskapsbankssidor).
- **Övriga undersidor (ännu utan eget innehåll).** `/kunskapsbank/medicinsk-terminologi.html`, `/kunskapsbank/listor-tabeller.html` och `/kunskapsbank/faktatexter.html` är `noindex, follow` (ej i sitemap) tills de fyllts, men presenterar sig nu med beskrivande rubriker/taglines i stället för "under uppbyggnad". Terminologisidan listar områdena medicinskt latin, grekiska, deklinationer (länkad), **uttalsregler** och terminologins historia, plus internlänk till ordlistan.
- **Rensning av planerings-/processtext.** All intern "till mig"-text borttagen ur hubben och undersidorna (löften om "goda källor/korslänkar/byggs ut steg för steg", "vi börjar med…", "Klar – läs nu", TODO-/placeholder-kommentarer). Bara besökarriktad text ligger kvar live.
- `sitemap.xml`: `/kunskapsbank/` tillagd (priority 0.8). `css/styles.css`: ny `.kb-grid`/`.kb-card`-sektion för hubbens kort (cachebuster → 0.7.7).
- APP_VERSION/VERSION → 0.9.21 (cachebuster: app.js → 0.9.21). Inga ändringar i befintliga sidors meta/head.

## 0.9.20
- **IndexNow (snabbare omindexering på Bing m.fl.).** Sajten meddelar nu IndexNow-deltagande sökmotorer (Bing, Yandex, Seznam, Naver, Yep) direkt när innehåll ändrats, i stället för att vänta på att de crawlar om. Google deltar **inte** i IndexNow och påverkas inte; `sitemap.xml` är fortsatt huvudvägen mot Google.
- Nyckelfil `ff1efd99d9aa024279a96e753a78c317.txt` i roten (bevisar domänägande, serveras av GitHub Pages).
- Ny GitHub Action `.github/workflows/indexnow.yml`: triggas på `page_build` (dvs. efter att Pages-bygget är live, så Bing aldrig hämtar gammalt innehåll) och postar alla `<loc>`-URL:er ur `sitemap.xml` till `api.indexnow.org`. Kan även köras manuellt (`workflow_dispatch`).
- **Ingen påverkan på sidladdning eller SEO-ranking** – allt sker utanför klienten; inga extra bytes, ingen JS för besökaren.
- APP_VERSION/VERSION → 0.9.20 (cachebuster: app.js → 0.9.20). Inga ändringar i sidornas meta/head, styles.css eller innehåll.

## 0.9.19
- **Intern länk i info-texten.** "Ordlistan" i stycket om medicinska ordlistan (`info.html`) länkar nu till `medicinskordlista.html`.
- `info.html`. APP_VERSION/VERSION → 0.9.19 (cachebuster: app.js → 0.9.19). styles.css/info.js oförändrade.

## 0.9.18
- **Länk till integritetspolicyn på info-sidan.** Diskret rad sist i "Om"-texten (`info.html`) som länkar till `integritet.html`, så att policyn nås från både framsidan och Om-sidan.
- `info.html`. APP_VERSION/VERSION → 0.9.18 (cachebuster: app.js → 0.9.18). styles.css/info.js oförändrade.

## 0.9.17
- **Ny integritetspolicy (GDPR).** Egen sida `integritet.html` med kort, juridiskt hållbar text på svenska: vad appen lagrar lokalt (localStorage: topplista, inställningar, framsteg), att inga kakor/spårning/analys används, när data lämnar enheten (export/import + mailto-kontaktformulär), GitHub Pages serverloggar, rättslig grund och rättigheter (GDPR/IMY), barn samt ändringar. Brödsmula överst tillbaka till framsidan, "Tillbaka"-knapp och `PrivacyPolicy`-JSON-LD – samma struktur som info-sidan.
- **Sidfot på framsidan.** Diskret rad längst ner i `index.html` med kort integritetstext och länk till policyn (återanvänder befintlig `.footer`-stil).
- `sitemap.xml`: `integritet.html` tillagd. Ingen ändring av befintliga sidors meta/head.
- `index.html`, ny `integritet.html`. APP_VERSION/VERSION → 0.9.17 (cachebuster: app.js → 0.9.17). styles.css oförändrad (0.7.6).

## 0.9.16
- **Fix:** topplistans dolda filväljare för import syntes som en extra "Choose file"-kontroll bredvid "Importera resultat"-knappen. Projektet saknar en generell `.hidden`-regel och `input { display: block }` tvingade fram den. Inför `.file-input-hidden` så att bara knappen visas (filväljaren triggas av knappen via JS som tidigare).
- `index.html`, `css/styles.css`. Cachebuster: styles.css → 0.7.6. APP_VERSION/VERSION → 0.9.16 (cachebuster: app.js → 0.9.16).

## 0.9.15
- **"Nyheter"-sektion på info-sidan.** Ny sektion (före kontaktformuläret) för korta notiser, nyaste överst. Första notisen sammanfattar dagens ändringar (kontaktformulär, egen domän, samt ursäkt för att gamla highscore-resultat gick förlorade vid domänbytet).
- **"Antal frågor" omarbetad och korrekt.** Statistiken är nu indelad per utbildning (Allmänt, Arbetsterapeut, Sjuksköterska) med delsumma per utbildning och totalsumma – samma indelning som ämnesväljaren. Tidigare saknade ämnen är med: Farmakologi, Medicinsk latin och Anatomi & fysiologi (flashcards). Flashcard-ämnen visas med "—" i Normal/Svår. Siffrorna räknas dynamiskt ur datafilerna.
- **Ordlistans omfattning visas.** Rad under tabellen: antal uppslagsord i medicinska ordlistan (live-termer, exkl. stubs), räknat som på ordlistesidan, med länk dit.
- **Layout:** korrekt radbryt (luft) före "Antal frågor"/"Versionshistorik"; kontaktformuläret flyttat ovanför "Antal frågor"; kontakt-e-post bytt till dedikerad `anatomiquizse@gmail.com`.
- `info.html`, `js/info.js`, `css/styles.css`. Cachebusters: styles.css → 0.7.5, info.js → 0.9.15. APP_VERSION/VERSION → 0.9.15 (cachebuster: app.js → 0.9.15).

## 0.9.14
- **Fix:** tog bort en lös textnod ("Byt ") som av misstag hamnat i `index.html` mellan inställnings- och flashcard-sektionen och syntes överst på framsidan.
- Endast `index.html`. APP_VERSION/VERSION → 0.9.14 (cachebuster: app.js → 0.9.14).

## 0.9.13
- **Diskret kontaktformulär längst ner på info-sidan.** För rapportering av buggar, fel i innehåll och synpunkter. Fält: typ (Bugg/Fel i innehåll/Synpunkt/Övrigt) + meddelande. Vid skicka öppnas besökarens egen e-postklient via `mailto:` med färdigt ämne och brödtext (inkl. avsändarsida); fallback-länk finns under knappen. Mottagare: dedikerad adress `anatomiquizse@gmail.com`.
- **Backend-fritt & CSP-säkert.** GitHub Pages saknar server, så submit fångas i `info.js` (preventDefault + `window.location`) i stället för en riktig form-submit – `form-action 'self'`/`script-src 'self'` är orörda. Ingen tredjepart, inga data passerar mellanled. Ingen meta/head (SEO) ändrad.
- `info.html`, `js/info.js`, `css/styles.css` (diskret `.contact`-stil). Cachebusters bumpade: styles.css → 0.7.4 (index+info), info.js → 0.9.13. APP_VERSION/VERSION → 0.9.13 (cachebuster: app.js → 0.9.13).

## 0.9.12
- **Export/import av topplistan.** Två nya knappar i topplistan: "Exportera resultat" laddar ner en JSON-backup (`anatomiquiz-resultat-ÅÅÅÅ-MM-DD.json`), "Importera resultat" läser tillbaka den och slår ihop med befintliga resultat. Eftersom `localStorage` är unikt per origin OCH per enhet/instans (flik, hemskärms-genväg, varje enhet) ger detta ett sätt att själv säkerhetskopiera och flytta historiken mellan fack – t.ex. efter ett domän- eller enhetsbyte.
- **Dubblettskydd & validering.** Varje resultat får en signatur (datum+namn+ämne+poäng+total); återimport av samma backup dubblerar inte rader (rapporterar tillagda/överhoppade). Importen accepterar bara en äkta toppliste-export (`type: "anatomiquiz-highscores"`) eller en ren array och avvisar fel filtyp. Samma 50-tak och `getScores`/`saveScores`-fallback (privat läge) som vanlig sparning.
- Endast `index.html` + `js/app.js`. Ingen meta/head rörd. APP_VERSION/VERSION → 0.9.12 (cachebuster: app.js → 0.9.12).

## 0.9.11
- **`llms.txt` tillagd i domänroten (AI-/agentläsbarhet).** Ny fil `llms.txt` enligt llmstxt.org-standarden (H1, sammanfattande blockcitat, länkade nyckelsidor: quiz, case, medicinsk ordlista A–Ö + prefix, info, sitemap). Krävs av Google PageSpeed Insights/Lighthouse nya kategori **Agentic Browsing** – sajten går därmed från 2/3 till 3/3 (övriga kontroller, tillgänglighetsträd och CLS, klarades redan).
- Ingen meta/head rörd. APP_VERSION/VERSION → 0.9.11 (cachebuster: app.js → 0.9.11).

## 0.9.10
- **Egen domän: anatomiquiz.se.** Alla absoluta länkar i koden pekar nu på `https://anatomiquiz.se` istället för `https://norrtou.github.io/anatomiquiz`. Sidan ligger kvar på GitHub Pages – `CNAME`-fil (`anatomiquiz.se`) tillagd så Pages serverar från apex-roten istället för projektsökvägen `/anatomiquiz/`.
- Uppdaterat: canonical, `og:url`, `og:image`, `twitter:image`, schema.org-URL:er och `<link rel="sitemap">` i samtliga HTML-sidor (index, info, case, medicinskordlista + alla `ordlista-*.html`). Rotrelativa sökvägar `/anatomiquiz/...` → `/...` för favicon/ikoner/manifest/sitemap.
- `robots.txt` (Sitemap-rad), `sitemap.xml` (alla `<loc>`), `manifest.json` (`start_url`/`scope`/`icons`) och generatorn `scripts/generate_glossary.py` (`SITE`-konstant + hårdkodade sökvägar) uppdaterade så regenerering ger korrekta URL:er.
- APP_VERSION/VERSION → 0.9.10 (cachebuster: app.js → 0.9.10).

## 0.9.9
- **Nytt flashcard-ämne "Farmakologi (FC)" under Allmänt.** 217 kort som täcker läkemedelsbegrepp/regelverk (FASS, ATC, godkännande, studiefaser), beredningsformer & administreringsvägar, farmakodynamik (ligand/receptor, agonist/antagonist, potens/efficacy, TI), farmakokinetik (ADME, metabolism, halveringstid, steady state) samt interaktioner och biverkningar. Ny datafil `data/farmakologi.json`, sökväg i `getQuestionsPath()` och `<option data-edu="allmant">`. Första ämnet under "Allmänt".
- **Bildfråga borttagen.** Ett figurförklarande kort (legend A–F på en koncentration–tidkurva, utan textfråga) togs bort; inklistrad UI-text ("Not studied …") rensades. En exakt dubblettfråga ("Vad är farmakovigilans?") togs in en gång.
- Endast `data/farmakologi.json` + inkoppling. APP_VERSION/VERSION → 0.9.9 (cachebuster: app.js → 0.9.9).

## 0.9.8
- **371 nya flashcards i "Anatomi & fysiologi (FC)" under Sjuksköterska.** Deck 82 → 453 kort. Täcker näringslära/metabolism, andning, rörelseapparat & idrottsskador, njurar/urin, endokrina hormoner, blod/cirkulation, nervsystem och syra-bas/cellbiologi.
- **Bildfrågor borttagna.** Två rena rita-frågor utan textsvar ("Rita en kurva över lungvolymerna", "Beskriv var njurarna sitter") togs bort. Kort av typen "Rita en skiss … samt beskriv" som hade fullständiga textsvar omformulerades till rena beskrivningsfrågor (korsbryggecykeln, motorisk enhet, urinbildningen). En exakt dubblettfråga ("Vad är en motorisk enhet?") togs in en gång.
- Endast `data/anatomi_fysiologi_flashcards.json`. APP_VERSION/VERSION → 0.9.8 (cachebuster: app.js → 0.9.8).

## 0.9.7
- **Tillägg i "Om Anatomiquiz"-intron.** Ny mening om att det utförligaste övningsmaterialet för närvarande finns inom arbetsterapi och att arbete pågår för att alla utbildningar ska få ett lika rikt material. Endast synlig brödtext i intro-sektionen (ingen meta/head rörd).
- APP_VERSION/VERSION → 0.9.7 (cachebuster: app.js → 0.9.7).

## 0.9.6
- **Nytt flashcard-ämne "Anatomi & fysiologi (FC)" under Sjuksköterska.** 82 kort (term → definition) som täcker cell, nervsystem, hjärta/blod, andning, njurar, hormoner, matsmältning, muskler/skelett, immunförsvar och syra-basbalans. Ny datafil `data/anatomi_fysiologi_flashcards.json`, sökväg i `getQuestionsPath()` och `<option data-edu="sjukskoterska">` i ämnesväljaren. Rent FC-ämne → ingår inte i Slumpade frågor.
- APP_VERSION/VERSION → 0.9.6 (cachebuster: app.js → 0.9.6).

## 0.9.5
- **Ny utbildning "Allmänt" i väljaren "Välj utbildning".** Placerad överst (före Arbetsterapeut) och avsedd att samla framtida ämnen som inte är yrkesspecifika. Inga ämnen kopplade ännu – ämnen knyts via `data-edu="allmant"` på respektive `<option>` när de flyttas in.
- Endast `index.html` (ett nytt `<option>`). APP_VERSION/VERSION → 0.9.5 (cachebuster: app.js → 0.9.5).

## 0.9.4
- **Stickprovsverifiering av 0.9.3 års ICD-koder mot svenska källor.** 22 koder kontrollerade mot ICD-10-SE (Socialstyrelsen, Internetmedicin, ekg.nu, Region Kronoberg m.fl.) – samtliga korrekta. Bekräftat att kodningen genomgående följer **svensk ICD-10-SE/WHO**, inte amerikanska ICD-10-CM (t.ex. trombocytos D75.8, inte CM:s D75.83).
- **Finputs:** SIRS-posten ändrad från kategorinivå `R65` till `R65.9` (ospecificerat systemiskt inflammatoriskt svarssyndrom) enligt ICD-10-SE.
- Endast `data/ordlista.json` (en post). Ordlistan omgenererad. APP_VERSION/VERSION → 0.9.4 (cachebuster: app.js → 0.9.4, glossary.css/glossary.js → 0.9.4).

## 0.9.3
- **ICD-koder tillagda på 354 sjukdoms-/diagnosposter som saknade kod.** Ordlistan gick från 594 till 948 poster med ICD-kod. Berikningen gjordes kapitelvis A–Ö och omfattar diagnoser, infektioner, tumörer, syndrom, skador och förgiftningar (t.ex. ALL C91.0, Sjögrens syndrom M35.0, tetanus A35, WPW I45.6, Fallots tetrad Q21.3). Koden står sist i posten enligt 0.9.2-mallen; där koden är lokal- eller orsaksberoende anges representativ kod med kvalificerare (t.ex. "kodas efter lokal").
- **Endast äkta kodbara diagnoser kodades.** Adjektiv (t.ex. malign, idiopatisk), läkemedel (5-ASA, 5-FU), antikroppar/labbmarkörer (anti-GBM, CRP, ferritin), processer/procedurer (apoptos, debridering) och ren anatomi lämnades medvetet utan kod.
- Primärt svensk ICD-10(-SE); osäkra/sällsynta koder utelämnades hellre än gissades. Endast `data/ordlista.json` (textinnehåll); ordlistan omgenererad.
- APP_VERSION/VERSION → 0.9.3 (cachebuster: app.js → 0.9.3, glossary.css/glossary.js → 0.9.3).

## 0.9.2
- **ICD-koderna placeras nu sist i varje ordlistepost.** Klassificeringskoderna (ICD-10/ICD-11) låg tidigare mitt i definitionen – ofta före etymologin ("Av …") eller före ålderdomliga synonymer/korsreferenser – vilket var inkonsekvent. Nu står kod- och klassificeringsblocket alltid sist, efter betydelse, Sv./Eng./Vardag., etymologi, Ålderdomligt och Jfr/Se. 325 poster justerade. Ordningsföljden inom kodblocket bevaras (ICD-10 före ICD-11).
- Endast omflyttning av befintlig text i `data/ordlista.json`; inga koder ändrade, lagda till eller borttagna (prosamentioner som "enligt DSM/ICD" rörs inte). Ordlistan omgenererad.
- APP_VERSION/VERSION → 0.9.2 (cachebuster: app.js → 0.9.2, glossary.css/glossary.js → 0.9.2).

## 0.9.1
- **"Sök i hela ordlistan ovan" → "nedan" på alla ordliste-sidor.** Sökfältet ligger under ingressen i sidmallen, så hänvisningen var felvänd. Rättat i landningssidans ingress och i alla gruppsidors taglines (bokstäver, siffror, prefix, suffix).
- `scripts/generate_glossary.py` (taglines). Ordlistan omgenererad. APP_VERSION/VERSION → 0.9.1 (cachebuster: app.js → 0.9.1, glossary.css/glossary.js → 0.9.1).

## 0.9.0
- **Ingressen på medicinska ordlistans landningssida omformulerad.** Den synliga ingressen säger nu "latinska och grekiska termer" (tidigare bara "latinska och medicinska") och beskriver vad listan faktiskt innehåller: "9 383 latinska och grekiska termer: anatomi, fysiologi, sjukdomar, labbprover, förkortningar samt för- och efterleder" (ersätter det vaga "anatomiska, fysiologiska, patologiska, biologiska och tekniska termer"). Endast den synliga `<p class="tagline">` (body) – meta/SEO orört. Antalet (9 383) är fortsatt dynamiskt.
- `scripts/generate_glossary.py` (`write_landing`-tagline). Ordlistan omgenererad. APP_VERSION/VERSION → 0.9.0 (cachebuster: app.js → 0.9.0, glossary.css/glossary.js → 0.9.0).

## 0.8.74
- **Förstavelser (prefix) får en egen sida – `ordlista-prefix.html` – precis som suffixen.** Tidigare låg de 659 prefix-posterna (a-, hyper-, endo-, cefalo-, giga …) utspridda bland bokstavssidorna medan ändelserna (suffix) redan hade en samlad sida; det var inkonsekvent. Nu samlas alla prefix på en egen sida med eget chip ("prefix") i alfabetsraden, mellan siffror och suffix. Bokstavssidorna krymper i motsvarande mån (prefixen flyttas ut).
- **Routing avgörs av ordklassen i definitionen**, inte av termens form: en post är prefix om def inleds med `prefix `/`Förled` (och inte är ett streck-suffix), suffix om den inleds med `-`, `suffix ` eller `Efterled`. `page_key()` i generatorn och `pageKey()`/`isPrefixEntry()`/`isSuffixEntry()` i `js/glossary.js` hålls byte-identiska så att sök-djuplänkar pekar rätt (verifierat: 659 prefix / 153 suffix i båda).
- **Bing-vänlig meta, titel och ingress för prefix-sidan.** Egen `<title>` ("Medicinska förstavelser och prefix förklarade | Anatomiquiz", ≤60 tecken), unik `<meta name="description">` (≤157 tecken) och egen synlig ingress.
- **Prefix- OCH suffix-sidorna säger nu uttryckligen att affixen är både latinska och grekiska** (för medicinska och anatomiska termer), inte enbart latinska – i description och ingress.
- `scripts/generate_glossary.py` (ny `prefix`-grupp, `is_prefix`/`is_suffix`, `SPECIAL`-konstanter, taglines) + `js/glossary.js` (spegling). Ordlistan omgenererad (32 gruppsidor + landning + sitemap). APP_VERSION/VERSION → 0.8.74 (cachebuster: app.js → 0.8.74, glossary.css/glossary.js → 0.8.74).

## 0.8.73
- **Utbildningar utan ämnen gråas ut i "Välj utbildning".** Yrken som ännu inte har något ämne taggat åt sig (Fysioterapeut, Läkare, Medicinsk sekreterare) visas nu som inaktiverade `<option>` med suffixet "(inga ämnen ännu)" och går inte att välja. Arbetsterapeut och Sjuksköterska (som har ämnen) är opåverkade. Datadrivet: byggs av vilka `data-edu` som faktiskt förekommer bland ämnesoptionerna, så ett yrke aktiveras automatiskt när dess första ämne läggs till.
- En sparad men nu utgråad utbildning återställs inte längre vid inläsning (faller tillbaka på förvalet Arbetsterapeut).
- `js/app.js`: ny `updateEducationOptions()` (körs efter `captureTopicOptions`), `applySettings` kräver nu valbart (ej `disabled`) alternativ. APP_VERSION/VERSION → 0.8.73 (cachebuster: app.js → 0.8.73).

## 0.8.72
- **Nytt ämne "Medicinsk latin" (MC) för Sjuksköterska.** Första ämnet under utbildningen Sjuksköterska: 138 multiple choice-frågor på vanliga anatomiska/medicinska latinska termer (förleder, riktningar, rörelser, strukturer, kroppsregioner). Varje term frågas som "Vad betyder …?" med ett korrekt svar + tre distraktorer plockade ur samma betydelsefamilj. Källa: 140 flashcards från ett Quizlet-set (anatomi & fysiologi för sjuksköterskor), kvalitetssäkrade vid import.
- **Rättelser mot källan:** truncus = bål/stam (källan hade "tarm"; dubbletten "trancus = bål" sammanslagen); proximalt = närmare bålen (källan: "sämre mot bålen"); adduktion = mot mittlinjen/medialt (källan tog felaktigt även med "lateralt"); abdomen (källan felstavat "abdoment"); hyper-/hypo- = över/för mycket resp. under/för lite (källan: "överkant/underkant"); os förekom tre gånger → dubblett borttagen och betydelserna skilda med genitiv (os, oris = mun; os, ossis = ben). 140 källkort → 138 unika frågor.
- **Ingressen uppdaterad** på startsidan: "Öva på funktionell anatomi med quiz och flashcards" → "Öva på anatomi och medicinsk terminologi med quiz och flashcards" (endast on-page `<p class="tagline">`; meta/SEO orört).
- Ny `data/medicinsk_latin.json` + generator `scripts/generate_medicinsk_latin.py`. `index.html` (ny `<option data-edu="sjukskoterska">` + tagline) + `js/app.js` (sökväg i `getQuestionsPath`). APP_VERSION/VERSION → 0.8.72 (cachebuster: app.js → 0.8.72).

## 0.8.71
- **Startvyn ryms utan scroll igen efter utbildningsväljaren.** Tog bort den kursiva "Inga ämnen för den här utbildningen ännu"-notisen (tom utbildning visas nu enbart genom tom ämneslista + skuggade Starta-knappar) och tajtade den vertikala rytmen i `#setup` (label/select-marginaler 16/8 → 10/4) så att Starta-knapparna får plats utan att man behöver scrolla på mobil. Övriga formulär orörda.
- `index.html` (notis borttagen) + `js/app.js` (toggle-logiken borttagen) + `css/styles.css` (`#setup`-marginaler). APP_VERSION/VERSION → 0.8.71 (cachebuster: app.js → 0.8.71, styles.css → 0.7.3 på index.html).

## 0.8.70
- **Ny utbildningsväljare ovanför ämnet ("Välj utbildning").** Startvyn har fått en dropdown som delar upp ämnena per utbildning. **Arbetsterapeut** är förvald och har alla nuvarande ämnen; **Fysioterapeut, Läkare, Medicinsk sekreterare** och **Sjuksköterska** finns som val men har ännu inga ämnen (visar notisen "Inga ämnen för den här utbildningen ännu – de byggs ut efter hand"). Nya ämnen taggas bara med `data-edu="<utbildning>"` på sin `<option>` så fylls de på efter hand med samma system som arbetsterapeutämnena.
- **Datadrivet, byggt ovanpå befintligt filter.** `captureTopicOptions`/`updateTopicOptions` filtrerar nu på utbildning **+** frågetyp; tom utbildning tömmer ämnesväljaren och skuggar startknapparna. Valet sparas i inställningarna (`education`) och överlever omladdning.
- `index.html` (utbildnings-`<select>`, `data-edu` på alla ämnen, tom-notis) + `js/app.js` ändrade. APP_VERSION/VERSION → 0.8.70 (cachebuster: app.js → 0.8.70).

## 0.8.69
- **Kvalitetssäkring av hela ordlistan + omarbetad info-sida.** Maskinell genomgång av samtliga 9 383 poster: struktur (inga tomma/trasiga poster, inga dubbletter), slug/ankare (inga äkta kollisioner), ICD-koder (554 distinkta kategorier, alla formellt giltiga, 27/27 mot facit av kända koder), tecken/kodning (ingen mojibake; `<`/`>` escapas korrekt) och språk (inga dubbla blanksteg eller saknade slutpunkter; korrekt etikett-casing).
- **18 nya diagnoser med ICD-koder** (tidigare luckor): testikeltorsion (N44.0), epiglottit (J05.1), invagination (K56.1), akut/kronisk njursvikt (N17/N18), trumhinneperforation (H72), retinitis pigmentosa (H35.5), mollusker (B08.1), non-Hodgkin-lymfom (C82–C85), klimakteriebesvär (N95.1), livmoderframfall (N81), ablatio placentae (O45), huvudlöss (B85.0), ringorm (B35), sängvätning (F98.0), gigantism (E22.0), överaktiv blåsa (N32.8), golfarmbåge (M77.0), frusen skuldra (M75.0), vaxpropp (H61.2). Tre befintliga poster (ibs K58, parodontit K05, karies K02) fick ICD-kod. 9 366 → **9 383 termer, 594 med ICD-10-kod**.
- **Rättat:** fyra felaktiga interna länkmarkörer (`[[…]]`) i ordlistedefinitioner omgjorda till ordbokens "Jfr …"-form.
- **info.html omskriven** med formell, informativ beskrivning av både quizet och den medicinska ordlistan, ett avsnitt om källor och kvalitetssäkring, samt notering att materialet är skapat och kvalitetssäkrat av en studerande i arbetsterapi vid Lunds universitet. Ny `.info-subheading`-stil (css cachebuster på info.html → 0.7.2). SEO/`<head>`/meta orörda.
- `data/ordlista.json` + regenererade `medicinskordlista.html`/`ordlista-*.html` ändrade. APP_VERSION/VERSION → 0.8.69 (cachebuster: app.js → 0.8.69).

## 0.8.68
- **Återställde namnet "Medicinsk ordlista" i UI (ångrade 0.8.67:s "lexikon"-byte).** Startsidans knapp + brödtext, ordlistans H1, sökrubrik/sökfält (placeholder + aria-label "Sök i hela ordlistan"), bakåtknappen ("← Tillbaka till ordlistan") och ingresstexterna heter åter "ordlista"/"ordlistan". Meta/title m.m. var redan oförändrade. Diagnos- och ICD-tilläggen (9 366 termer, 574 med ICD-10-kod) är orörda.
- `scripts/generate_glossary.py` + `index.html` återställda; alla `ordlista-*.html`/`medicinskordlista.html` regenererade. APP_VERSION/VERSION → 0.8.68 (cachebuster: app.js → 0.8.68).

## 0.8.67
- **Ordlistan kallas nu "Medicinskt lexikon" i knappar och rubriker** (den har vuxit till ett fullödigt medicinskt lexikon). Ändrat i synlig UI-text: startsidans knapp ("Medicinskt lexikon") och brödtext, lexikonets H1 ("Medicinskt lexikon"), sökrubrik/sökfältets placeholder och aria-label ("Sök i hela lexikonet"), bakåtknappen ("← Tillbaka till lexikonet") samt sidornas ingresstexter. **Meta/`<title>`, meta-descriptions, Open Graph/Twitter, JSON-LD och brödsmulor lämnades medvetet oförändrade** ("Medicinsk ordlista") för att inte röra SEO; filnamn och URL:er (`medicinskordlista.html`, `ordlista-*.html`) är också oförändrade så inga länkar bryts.
- **Fler diagnoser med ICD-koder.** 9 320 → **9 366 termer**; nu bär **574 poster svensk ICD-10-(SE)-kod**. 46 nya + 36 berikade: bl.a. SVT, klusterhuvudvärk/Hortons huvudvärk, hypertensiv kris, kardiogen chock, asbestos, gastrointestinal blödning, tarmpolyp, prediabetes, urinblåse-/testikelcancer, testistorsion, spänningshuvudvärk, social fobi, postpartumdepression, hetsätningsstörning, Aspergers syndrom, intellektuell funktionsnedsättning, denguefeber, amöbiasis, giardia, springmask, huvudlöss, gula febern, kontakteksem, mollusker, närsynthet/myopi/översynthet/astigmatism/presbyopi, näsblödning, heshet, dubbelseende, nackspärr, ryggsmärta, kotkompression, neonatal gulsot, plötslig spädbarnsdöd, prematuritet, B12-/folatbrist m.fl.
- `data/ordlista.json` + `scripts/generate_glossary.py` (UI-text) + `index.html` (knapp/brödtext) ändrade; alla `ordlista-*.html`/`medicinskordlista.html` + `sitemap.xml` regenererade. Inga cachebusters för glossary.js/css bumpade (oförändrade). APP_VERSION/VERSION → 0.8.67 (cachebuster: app.js → 0.8.67).

## 0.8.66
- **Ordlistan utökad med sällsynta syndrom och subspecialitetsdiagnoser (med ICD-koder).** 9 256 → **9 320 termer**; nu bär **492 poster svensk ICD-10-(SE)-kod** (~360 även ICD-11). 64 nya diagnoser + 22 befintliga berikade med koder.
- **Genetiska/sällsynta syndrom:** Marfans, Ehlers-Danlos, neurofibromatos, tuberös skleros, fragilt X, Prader-Willis, Angelmans, Retts, akondroplasi, osteogenesis imperfecta, Duchennes muskeldystrofi, galaktosemi. **Vaskuliter/reuma:** Behçets, Wegeners granulomatos, Takayasus arterit, Kawasakis sjukdom, antifosfolipidsyndrom, reaktiv/psoriasis-/juvenil idiopatisk artrit, Raynaud. **Hematologi/lever:** von Willebrands sjukdom, faktor V Leiden, essentiell trombocytemi, myelofibros, primär biliär/skleroserande kolangit, autoimmun hepatit. **Neurologi:** spinal muskelatrofi, essentiell tremor, Creutzfeldt-Jakob, post-polio, polio. **Barn/ortopedi/gyn/öga/hud/infektion:** Hirschsprungs sjukdom, pseudokrupp, Perthes sjukdom, Osgood-Schlatter, höftledsluxation, febrila kramper, cervixdysplasi, hyperemesis gravidarum, Dupuytrens kontraktur, hallux valgus, spinal stenos, Bakercysta, rotatorkuffsruptur, torra ögat, lichen planus, pityriasis rosea, seborroiskt eksem, nagelsvamp, legionella, mykoplasma, herpesencefalit, septisk artrit, erythema nodosum m.fl.
- Genetiska syndromens ICD-10 (Q-koder) säkra; osäkra ICD-11-koder utelämnade hellre än gissade. Urval koder spot-verifierade mot Socialstyrelsen/Internetmedicin/1177/WHO (t.ex. Wegener M31.3, PBC K74.3, PSC K83.0).
- Endast `data/ordlista.json` + regenererade `medicinskordlista.html`/`ordlista-*.html` + `sitemap.xml` ändrade. Inga cachebusters för glossary.js/css bumpade (oförändrade). APP_VERSION/VERSION → 0.8.66 (cachebuster: app.js → 0.8.66).

## 0.8.65
- **Sjukdomar, skador och syndrom i ordlistan har fått diagnoskoder, och ~200 nya diagnoser har lagts till.** Ordlistan: 9 054 → **9 256 termer**. **406 poster bär nu svensk ICD-10-(SE)-kod**, ~330 även ICD-11 (samt enstaka U-koder, t.ex. covid-19 U07.1). Koden läggs in i definitionen efter det engelska namnet, före etymologin (`… Eng. asthma. ICD-10: J45 (J45.0 allergisk, J45.9 ospecificerad); ICD-11: CA23. Av gr. …`).
- **Kapitelvis genomgång A00–T:** infektioner, tumörer, blod, endokrint/metabolt, psykiatri, nerv, öga/öra, cirkulation, andning, mage-tarm, hud, rörelseapparat, urin/genital, medfött (Q), graviditet (O) och de mest sökta symtomen (R). Dessutom en omgång tier-2 internmedicin/akutmedicin (kardiomyopati, klaffel, hjärtstopp, AKS, sarkoidos, leversvikt, Sjögrens syndrom, jättecellsarterit, Guillain-Barré, myastenia gravis, Huntingtons sjukdom, TBE, sorkfeber, vinterkräksjuka, njurcancer, hyponatremi m.fl.).
- Latinskt kliniskt namn (`Lat.`) tillagt där det saknades; eponymer lagrade med versal (Downs/Klinefelters/Sjögrens/Huntingtons/Pagets/Wilsons/Barretts m.fl.). ICD-10-koderna är de svenska ICD-10-SE-kategorierna (3-tecken identiska med Socialstyrelsen/WHO; vanliga 4-tecken angivna); ett urval koder spot-verifierade mot Socialstyrelsen/Internetmedicin/1177/WHO.
- Endast `data/ordlista.json` + regenererade `medicinskordlista.html`/`ordlista-*.html` + `sitemap.xml` ändrade (innehåll). Inga cachebusters för glossary.js/css bumpade (oförändrade). APP_VERSION/VERSION → 0.8.65 (cachebuster: app.js → 0.8.65).

## 0.8.64
- **Startsidans knapp till ordlistan heter nu "Medicinsk ordlista"** (tidigare bara "Ordlista").
- **Knappen längst ner på ordlistesidorna går nu till ordlistans startsida** (`medicinskordlista.html`) i stället för quizets startsida, och heter "← Tillbaka till ordlistan" (tidigare "← Tillbaka till quizet" → `./`).
- **Tydligare markering av söktermen i ordlistans träffar.** Den gröna markeringen (rank 3 – ordet finns bara i beskrivningen) var för svag (16 % emerald) och syntes knappt på desktop. Nu starkare ton (32 %), halvfet text och en svag understreckslinje, så den läses på alla skärmar. `css/glossary.css` + cachebuster `GLOSSARY_V` → 0.8.64, ordlistesidorna regenererade. APP_VERSION/VERSION → 0.8.64.

## 0.8.63
- **Alla sidors `<title>` ned till ≤ 60 tecken (Bing "title too long").** Tre genererade ordlistesidor + en statisk sida var för långa: landningssidan `medicinskordlista.html` (75 → "Medicinsk ordlista – tusentals termer | Anatomiquiz", behåller "tusentals" utan siffra), `ordlista-b.html` (62 → "Medicinska B-ord: betydelse och ursprung | Anatomiquiz"), `ordlista-f.html` (62 → "Medicinska F-ord: definition och ursprung | Anatomiquiz") och `case.html` (63 → "Case – anatomi genom kliniska patientfall | Anatomiquiz").
- `scripts/generate_glossary.py`: `TITLE_MAX` sänkt 160 → **60**, så generatorn nu **felar** om någon framtida titel överskrider Bing-gränsen. Landningstiteln uppdaterad på båda ställena (mall + guard).
- Endast titlar ändrade; meta-descriptions, og/twitter (utom redan korta) och övrigt head orört. Ordlistesidorna regenererade. APP_VERSION/VERSION → 0.8.63.

## 0.8.62
- **Kortare startsidetitel (Bing flaggade "title too long").** `<title>` på index.html ändrad från den 80 tecken långa "Anatomiquiz — Interaktiv anatomiquiz på svenska | Skelett, muskler & terminologi" till **"Anatomiquiz - Öva på anatomi och medicinsk terminologi"** (54 tecken); tar även bort dubbel-förekomsten av ordet "anatomiquiz".
- `og:title` och `twitter:title` uppdaterade till samma nya titel.
- Endast index.html (head) + versionsbump. APP_VERSION/VERSION → 0.8.62 (cachebuster: app.js → 0.8.62).

## 0.8.61
- **Labbtermer i ordlistan har fått normalvärden (referensintervall) och flera saknade prover har lagts till.** 39 befintliga poster berikades med vuxenreferensintervall (Hb, CRP, SR, LPK, TPK, EVF, ALAT, ASAT, GFR, INR, APTT, glukos, D-dimer, ferritin, urea, albumin, kalium, kalcium, PSA, troponin, BNP, PTH, T4, T3, TSH, LD, GT, ALP, CK, urat, kolesterol, folat, laktat, TIBC, antitrombin, haptoglobin, amylas, homocystein, blodstatus) och 34 nya termer tillkom (Hb, HbA1c, kreatinin, Krea, eGFR, cystatin C, MCV, MCH, MCHC, RDW, EPK, retikulocyter, natrium, Na, K, klorid, magnesium, fosfat, kobalamin, B12, järn, transferrin, HDL, LDL, triglycerider, bilirubin, myoglobin, NT-proBNP, fibrinogen, pankreasamylas, hematokrit, folsyra, D-vitamin, provtagningsbeteckningar).
- **Engelska labbförkortningar** lades till som notiser i de svenska posterna (WBC, RBC, PLT, HGB, HCT, CBC, Cr, ALT/AST, GGT, A1C, TG, TC m.fl.) och som egna poster där svensk motsvarighet saknas (BUN, BMP, CMP).
- Värdena anges som vuxenintervall (källa: Region Kronoberg, Referensintervall Klinisk kemi, 2026; NORIP-baserat) med reservation för att de varierar mellan laboratorier/metod/ålder/kön. Tre felstavade dubblettposter städades bort (hb, HbA1C, Nt-proBNP → korrekt skiftläge).
- Ordlistan: 9 020 → **9 054** live-termer. Endast `data/ordlista.json` + regenererade `medicinskordlista.html`/`ordlista-*.html` + `sitemap.xml` ändrade. Inga cachebusters för glossary.js/css bumpade (oförändrade).
- APP_VERSION/VERSION → 0.8.61 (cachebuster: app.js → 0.8.61).

## 0.8.60
- **Ingressen på ordlistans landningssida visar nu det faktiska antalet termer i stället för "tusentals"** — t.ex. "… hoppa till en bokstav i raden — **9 020** latinska och medicinska anatomiska, fysiologiska, patologiska, biologiska och tekniska termer." Talet räknas dynamiskt vid generering (`sum(len(grupp))`) med hårt mellanslag som tusentalsavgränsare, så det uppdateras automatiskt när ordlistan växer.
- **Endast den synliga ingressen (body) ändrad** — `<head>` (title/meta-description/og/twitter) behåller "tusentals" utan siffra enligt SEO-policyn.
- Endast `scripts/generate_glossary.py` (ingresslogik) + `medicinskordlista.html` (regenererad ingress) ändrade. Inga cachebusters bumpade (glossary.js/css oförändrade).
- APP_VERSION/VERSION → 0.8.60 (cachebuster: app.js → 0.8.60).

## 0.8.59
- **Sökträffar där söktermen bara finns i beskrivningen markerar nu ordet med en svag, temahärledd ljusgrön bakgrund** (`<mark>` med `color-mix` av `--primary`), så det syns snabbt *varför* träffen kom med. Markeringen gäller enbart rank 3-träffar (söktermen saknas i termen); matchas något i själva termen markeras inget i beskrivningen. Skiftläge bevaras och `<em>`-taggar i definitionen lämnas orörda.
- Endast `js/glossary.js` (markeringslogik) + `css/glossary.css` (`.glossary-hit`) ändrade; de förrenderade ordlistesidorna regenererades enbart för cachebustern.
- APP_VERSION/VERSION → 0.8.59 (cachebuster: app.js → 0.8.59; glossary.js/glossary.css → 0.8.59 via GLOSSARY_V; styles.css oförändrad).

## 0.8.58
- **Ordlistans sökning är nu relevansrankad istället för rent alfabetisk.** Träffarna sorteras efter hur väl de matchar söktermen:
  1. Exakt uppslagsord (söker du `biceps` kommer **biceps** först).
  2. Term som börjar med söktermen (`biceps brachii`, `biceps femoris` …).
  3. Söktermen någon annanstans i termen (`musculus biceps …`).
  4. Söktermen enbart i beskrivningen.
  - Inom varje nivå sorteras träffarna alfabetiskt (svensk kollation). Tidigare grupperades alla träffar per begynnelsebokstav med `<h3>`-rubriker, vilket dolde vilken träff som var mest relevant; sökresultatet renderas nu som en enda platt lista i relevansordning. Filtreringen (term **eller** beskrivning) är oförändrad – inga träffar försvinner, de kommer bara i bättre ordning. Alfabetsraden tonas fortfarande efter vilka grupper som har träffar.
- Endast `js/glossary.js` ändrat (logik); de förrenderade ordlistesidorna regenererades enbart för att bumpa glossary-cachebustern.
- APP_VERSION/VERSION → 0.8.58 (cachebuster: app.js → 0.8.58; glossary.js → 0.8.58 via GLOSSARY_V; glossary.css/styles.css oförändrade).

## 0.8.57
- **SEO: titlar och meta-descriptions på alla ordlistesidor omarbetade för Bings strängare kvalitetskrav (≤160 tecken + tillräcklig variation i formulering).**
  - **Titlar:** alla 31 gruppsidor delade tidigare exakt samma mall (`Medicinska ord på X — ordlista med definition och etymologi | Anatomiquiz`, bara bokstaven skilde) – vilket Bing flaggar som för lika titlar. Nu har varje sida en **egen, unik titel** med varierad struktur och ordval, och kortare (max 62 tecken, nära Bings visningsideal ~60).
  - **Meta-descriptions:** omformulerade med spridda inledningar (termuppräkning, "Letar du efter…", "Nyfiken på…", "Vad döljer sig bakom…", "Vill du veta…" m.fl.), varierade verb (slå upp/bläddra/utforska/reds ut/ta reda på/få förklarade/lär dig) och roterade avslutningar (etymologi/ordhistoria/ordursprung/språkligt ursprung/synonymer/lekmannaord). Alla unika, max 142 tecken.
  - Generatorn (`scripts/generate_glossary.py`) fick en `GROUP_TITLES`-tabell och en `TITLE_MAX`-kontroll (≤160) vid sidan om den befintliga `DESC_MAX`-kontrollen (≤157). Inga termsiffror i head; landningssidan behåller "tusentals".
- Påverkar enbart `<head>` (title/description + og/twitter som speglar dem) på `medicinskordlista.html` och `ordlista-*.html`. Inget innehåll, css eller js ändrat.
- APP_VERSION/VERSION → 0.8.57 (cachebuster: app.js → 0.8.57; glossary.css/js oförändrade; styles.css oförändrad).

## 0.8.56
- **Ordlistan: latinska anatomitermer (TA98) – slutfas, sinnesorganen (A15), huden (A16) och allmän anatomi (A01). +356 poster. Därmed är hela TA-importen täckt på inlärnings-/klinisk nivå.**
  - **Sinnesorganen (A15):** ögat (ögongloben med poler, axlar och segment; senhinna/hornhinna med limbus och trabekelverket; druvhinnan med strålkroppen och ciliarmuskeln; regnbågshinnan med pupillförträngare/-vidgare; näthinnan med synnervspapillen och dess exkavation; synnerven med sina hinnor; linsen med kapsel, kärna och zonulatrådar; glaskroppen; ögonmusklerna med Zinns senring, ögonlock med Meibomska körtlar, bindehinna och tårapparat). Örat (öronmusslans landmärken; trumhinnan med umbo; mellanörats väggar, hörselbenen [hammare/städ/stigbygel] med leder, ligament och hörselbensmuskler; örontrumpeten; innerörats ben- och hinnlabyrint med båggångar, snäcka, modiolus, balansfläckar, ampullkammar och spiralgangliet). Samt lukt- och smakorganens slemhinnor.
  - **Huden (A16):** överhud/läderhud med papiller och hudåsar (Langers linjer), hår och hårfolliklar med hårresarmuskeln, svett- och talgkörtlar, naglarna, bröstet med bröstkörtel, mjölkgångar, vårtgård och Coopers ligament, samt underhuden.
  - **Allmän anatomi (A01):** läges- och riktningstermer (medial/lateral, ventral/dorsal, kranial/kaudal, proximal/distal m.fl.), referensplan (median-, sagittal-, frontal-, transpyloriska och suprakristala planet), kroppslinjer (medioklavikular-, axillarlinjerna m.fl.), kroppsdelar och gördlar, samt kliniskt namngivna trianglar, gropar och fåror (karotis-, submandibular-, femoraltriangeln, armvecket, knävecket, auskultationstriangeln m.fl.).
- Synliga termer: 8 664 → **9 020** (+356). Inga dubbletter. Den långa svansen av mikroskopiska näthinne-/snäcklager, innerörats småkärl och de mest upprepade ytregionerna/per-finger-regionerna utelämnad medvetet. **Hela A01–A16 i Terminologia Anatomica är nu importerad.**
- APP_VERSION/VERSION → 0.8.56 (cachebuster: app.js → 0.8.56; glossary.css/js oförändrade; styles.css oförändrad).

## 0.8.55
- **Ordlistan: latinska anatomitermer (TA98) – fas 24, nervsystemet del 2: kranialnerverna, de perifera nervflätorna och autonoma nervsystemet. +78 poster. Därmed är nervsystemet (A14) täckt på klinisk nivå.**
  - **De tolv kranialnerverna (I–XII)** med deras kliniskt viktiga grenar och ganglier: lukt-, syn-, ögonrörelse-, trochlearis- och abducensnerven; trillingnerven med sina tre grenar (ögon-, överkäks-, underkäksnerven) och tung-, tand-, hak- och öron-tinningnerven; ansiktsnerven med chorda tympani; balans-hörselnerven; tung-svalgnerven; vagusnerven med övre och återvändande struphuvudsnerven; samt accessorius- och hypoglossusnerven.
  - **Perifera nervflätor:** halsnervflätan (mellangärdesnerven), armnervflätan (median-, ulnaris-, radialis-, axillaris- och muskel-hudnerven m.fl.), mellanrevbensnerverna, ländnervflätan (lår-, saphenus- och obturatornerven m.fl.) och korsbensnervflätan (ischias-, skenbens-, vadbens-, säte-, vad- och blygdnerven).
  - **Autonoma nervsystemet:** sympatiska gränssträngen med övre halsgangliet och ganglion impar, stora/lilla inälvsnerven, de fyra parasympatiska huvudganglierna i huvudet (ciliar-, vinggom-, underkäks- och örongangliet) samt hjärt-, buk- (solar plexus), tarmkäx- och underbuksnervflätorna.
- Synliga termer: 8 586 → **8 664** (+78). Inga dubbletter. Den långa svansen av enskilda kärnor, fibertrakter och pyttesmå gren-nerver utelämnad medvetet. **Härnäst: A15 sinnesorganen (öga och öra).**
- APP_VERSION/VERSION → 0.8.55 (cachebuster: app.js → 0.8.55; glossary.css/js oförändrade; styles.css oförändrad).

## 0.8.54
- **Ordlistan: latinska anatomitermer (TA98) – fas 23, nervsystemet del 1: centrala nervsystemets grovanatomi. +116 poster.**
  - **Nervsystemets byggstenar och hjärnhinnor:** nervtråd, perikaryon, synaps, gliavävnad; hårda/mjuka hjärnhinnor med hjärnskäran, tentoriet och sadeldiafragmat, epidural-, subdural- och subaraknoidalrummet, likvorcisternerna (cisterna magna, lumbalcisternen), araknoidalvilli och kärlnystanet (likvorproduktion).
  - **Ryggmärgen:** cervikala/lumbosakrala förtjockningarna, märgkonen, fram-, bak- och sidohornen, strängarna, grå/vit substans samt huvudbanorna (kortikospinala, spinotalamiska, gracilis- och cuneatusbunten, spinocerebellära, rubrospinala) och kommissurerna.
  - **Hjärnstammen och lillhjärnan:** pyramiderna, oliven, de tre lillhjärnsskänklarna, storhjärnsskänkeln, mellanhjärnans tak med fyrhögarna, svarta substansen, röda kärnan och akvedukten; ventrikelsystemet (3:e/4:e/sidoventrikeln, romboida gropen, Monros öppning); lillhjärnstonsillen och lillhjärnans funktionella delar.
  - **Mellanhjärnan och storhjärnan:** epi-, hypo-, sub- och metatalamus, inre kapseln; loberna, central- och Sylvii-fåran, primära motor- och känselbarken, Brocas och Wernickes områden, gördel- och parahippocampala vindlingen, hippocampus, amygdala, luktbulben/-stråket samt basala ganglierna (svanskärna, putamen, bleka klotet, striatum) och strålkronan.
- Synliga termer: 8 470 → **8 586** (+116). Inga dubbletter (insula fanns redan). Hundratals småkärnor, laminae och fibertrakter utelämnade medvetet. **Härnäst: kranialnerverna, de perifera nervplexa och autonoma nervsystemet.**
- APP_VERSION/VERSION → 0.8.54 (cachebuster: app.js → 0.8.54; glossary.css/js oförändrade; styles.css oförändrad).

## 0.8.53
- **Ordlistan: latinska anatomitermer (TA98) – fas 22, lymfsystemet (A13 + lymftrunci). +37 poster.**
  - **Lymftrunci och lymfgångar:** bröstgången, chylescisternen, högra lymfgången samt jugular-, subklavia-, bronkomediastinal-, lumbal- och tarmtrunci.
  - **Lymfoida organ:** benmärgen, brässens (tymus) bark och märg, mjälten med röd och vit pulpa, Malpighiska kroppar, mjälthilus och bimjälte, Waldeyers svalgring, samt lymfknutans uppbyggnad (primära/sekundära lymfoida organ).
  - **Kliniskt viktiga lymfknutestationer:** axillära, supraklavikulära (Virchows körtel), jugulodigastriska och jugulo-omohyoidala, laterala hals-, trakeobronkiella, parasternala, celiakala, övre mesenteriella, para-aortala (lumbala), gemensamma iliakala, ytliga och djupa ljumsk- (Cloquets knuta) och knävecksslymfknutorna.
- Synliga termer: 8 433 → **8 470** (+37). Inga dubbletter. Den uttömmande svansen av ~150 enskilda regionala lymfknutegrupper utelämnad medvetet. **Härnäst: A14 nervsystemet (störst).**
- APP_VERSION/VERSION → 0.8.53 (cachebuster: app.js → 0.8.53; glossary.css/js oförändrade; styles.css oförändrad).

## 0.8.52
- **Ordlistan: latinska anatomitermer (TA98) – fas 21, kärlen del 4: hela vensystemet. +84 poster. Därmed är hjärt-kärlsystemet (A12) i praktiken klart.**
  - **Huvud, hals och hjärna:** övre hålvenen, brakiocefaliska venen, de inre/yttre/främre halsvenerna, ansikts-, vinkel- och retromandibularvenen, vingflätaden; hårda hjärnhinnans blodledare (durasinus) – övre/nedre sagittalsinus, raka sinus, sinusconfluensen, tvärgående och sigmoideumsinus, sinus cavernosus och de övre/nedre petrosalsinus; diploë- och emissarievener; hjärnvenerna (Galens, Rosenthals, Trolards och Labbés vener) samt ögonvenerna med Schlemms kanal.
  - **Bål och extremiteter:** nedre hålvenen med lever-, njur-, binjure- och gonadvener (med vänster-sidans asymmetri och varikocele) och pampiniforma plexus; azygos- och hemiazygossystemet samt Batsons kotpelarvennät; armens ytliga vener (cefalika, basilika, armvecksvenen) och djupa vener; höft- och bäckenvenerna med de kliniska vennäten (rektalt, prostatiskt, vesikalt, uterint); benets rosenådror (stora/lilla) och djupa vener med perforantvenerna.
  - **Portasystemet:** portådern, mjält-, övre/nedre tarmkäx- och vänstra magsäcksvenen, paraumbilikala och övre ändtarmsvenen – med de tre portakavala anastomoserna (matstrupe, ändtarm, caput medusae).
- Synliga termer: 8 353 → **8 433** (+84, varav azygos/Batson +4). Inga dubbletter. Durasinus står naturligt (sinus inverteras ej); venösa plexus inverterades ("X, plexus venosus"). Den långa svansen av pyttesmå tributärer/segmentvener utelämnad. **A12 hjärt-kärlsystemet klart utom A12.4 lymf-trunci (tas med lymfsystemet). Härnäst: A13 lymfsystemet.**
- APP_VERSION/VERSION → 0.8.52 (cachebuster: app.js → 0.8.52; glossary.css/js oförändrade; styles.css oförändrad).

## 0.8.51
- **Ordlistan: latinska anatomitermer (TA98) – fas 20, kärlen del 3: hela artärträdet (kropp och extremiteter). +121 poster.**
  - **Nyckelbensartären och armen:** kotartären med lillhjärnsartärerna (PICA/AICA/SCA) och ryggmärgsartärerna, inre bröstkorgsartären, tyro- och kostocervikala stammarna; armhåle-, överarms-, djupa överarms-, strålbens- och armbågsbensartären med de interosseösa artärerna, handflatebågarna och fingerartärerna.
  - **Bröst- och bukaorta:** bakre interkostal-, subkostal- och bronkialartärerna; buktruncus (vänster/höger magsäcks-, gemensam/egentlig leverartär, gastroduodenal-, gallblåse-, mjält-, gastroomentala och korta magsäcksartärer), övre tarmkäxartären (jejunal-/ileal-, ileokoliska, appendix-, höger/mellersta kolonartär, marginalartären), nedre tarmkäxartären (vänster kolon-, sigmoideum-, övre ändtarmsartären), samt njur-, binjure-, äggstocks-/testikel- och ländartärerna.
  - **Bäcken och benet:** inre höftbensartären (säte-, obturator-, navel-, blås-, livmoder-, slid-, mellersta ändtarms- och inre blygdartären med dess gren- och köns/perineumgrenar); yttre höftbensartären med nedre epigastriska artären; lår-, djupa lår- (med cirkumflex- och perforantartärer), knävecks-, främre/bakre skenbens- och vadbensartären, fotryggsartären, fotsuleartärerna med fotsulebågen och tåartärerna.
- Synliga termer: 8 232 → **8 353** (+121). Inga dubbletter. Recurrens-, genicular-, malleolar-, tarsal- och metatarsalsmågrenar samt segment-, ureter- och muskelrami utelämnade medvetet. Strukturord (arteria/truncus/ramus) inverterade. **Härnäst: vensystemet (v. cava sup./inf., porta, durasinus, extremitetsvener).**
- APP_VERSION/VERSION → 0.8.51 (cachebuster: app.js → 0.8.51; glossary.css/js oförändrade; styles.css oförändrad).

## 0.8.50
- **Ordlistan: latinska anatomitermer (TA98) – fas 19, kärlen del 2: huvudets, halsens och hjärnans artärer. +45 poster.**
  - **Yttre halspulsådern:** med dess namngivna huvudgrenar – övre sköldkörtel- och struphuvudsartären, uppåtstigande svalgartären, tung- och ansiktsartären (med läpp-, hak- och vinkelgrenar), nack- och bakre öronartären, ytliga tinningartären samt överkäksartären med nedre tandartären, mellersta hjärnhinneartären, kind-, infraorbital-, gom- och kilgomartären.
  - **Inre halspulsådern:** karotissifonen, ögonartären med centrala näthinneartären, tår-, supraorbital-, silbens- och näsryggsartärerna, övre och nedre hypofysartären samt bakre kommunikations- och främre koroidalartären.
  - **Hjärnans artärer:** främre, mellersta och bakre hjärnartären, främre kommunikationsartären, basilarisartären och perikallösa artären – samt Willis artärring.
- Synliga termer: 8 187 → **8 232** (+45). Inga dubbletter. Mikrogrenar till enskilda tänder, hjärnkärnor och gyri samt små muskel- och hörselgrenar utelämnade medvetet. Strukturord (arteria/truncus) inverterade. **A12 kärlträdet fortsätter (subclavia/extremiteter/buk/bäcken + vensystemen).**
- APP_VERSION/VERSION → 0.8.50 (cachebuster: app.js → 0.8.50; glossary.css/js oförändrade; styles.css oförändrad).

## 0.8.49
- **Ordlistan: latinska anatomitermer (TA98) – fas 18, kärlen del 1: allmän kärlterminologi och den centrala cirkulationen. +70 poster.**
  - **Allmän kärllära:** blodkärl, artär, ven, venol, kapillär, kärlväggens tre lager (tunica intima/media/externa), vasa vasorum, arteriovenösa anastomoser, rete mirabile, ven- och lymfklaffar, lymfkärl och lymfkapillärer.
  - **Lungkretsloppet:** lungartärstammen med bukter och delning, höger och vänster lungartär, Botallis gång (ductus arteriosus) och artärbandet, samt de fyra lungvenerna.
  - **Aorta ascendens och kranskärlen:** aortabukterna (Valsalva), höger och vänster kransartär med deras kliniska huvudgrenar (LAD, circumflex, bakre nedåtgående PDA, marginal-, nod- och septalgrenar).
  - **Aortabågen:** aortaistmus, brakiocefaliska stammen, gemensamma halspulsådern med karotissinus och karotiskroppen, samt nedersta sköldkörtelartären.
  - **Kransvenerna:** koronarsinus, stora/mellersta/lilla hjärtvenen, Thebesii och Marshalls vener.
- Synliga termer: 8 117 → **8 187** (+70). Inga dubbletter. De numrerade segmentartärerna/-venerna och de minsta kransvenerna utelämnade medvetet (A04-policyn). Strukturord (arteria/vena/truncus/ramus/ligamentum) inverterade. **A12 kärlträdet fortsätter i kommande faser (huvud-hals, extremiteter, buk, bäcken).**
- APP_VERSION/VERSION → 0.8.49 (cachebuster: app.js → 0.8.49; glossary.css/js oförändrade; styles.css oförändrad).

## 0.8.48
- **Ordlistan: latinska anatomitermer (TA98) – fas 17, hjärtat (A12.1 Cor). +83 poster.**
  - **Hjärtats yttre:** bas, spets, framyta, kransfåran och de båda kammarskiljefårorna.
  - **Rummen:** höger/vänster förmak och kammare, hjärtöron, för- och kammarskiljeväggar, gränskammen, kamtandsmusklerna, ovala gropen med fostrets ovala hål, hålvenernas och koronarsinus mynningar.
  - **Klaffapparaten:** tricuspidalis-, pulmonalis-, mitralis- och aortaklaffen med segel, semilunarsegel (knottror/lunulor/kommissurer), papillarmuskler, senstrålar, moderatorbandet och utflödeskonen.
  - **Hjärtskelettet:** höger/vänster fibrösa triangel och klaffringar.
  - **Retledningssystemet:** sinusknutan (SA), AV-knutan, His bunt och Purkinjefibrerna; samt endokardiet.
  - **Hjärtsäcken:** fibrösa och serösa perikardiet, transversella och oblika perikardsinus, sternoperikardiella banden och Marshalls veck.
- Synliga termer: 8 034 → **8 117** (+83). Inga dubbletter. Upprepade generiska segel/papillarmuskler deduplicerade till en post var; ytetiketter och obskyra senor utelämnade. Strukturord (musculus/nodus/ligamenta/rami) inverterade. **Näst på tur: A12 kärlträdet (stort, flera kommande faser) – lungkretslopp och aorta först.**
- APP_VERSION/VERSION → 0.8.48 (cachebuster: app.js → 0.8.48; glossary.css/js oförändrade; styles.css oförändrad).

## 0.8.47
- **Ordlistan: latinska anatomitermer (TA98) – fas 16. Könsorganen, bukhinnan och de endokrina körtlarna. +257 poster.**
  - **A09 könsorganen + perineum (168) – HELA A09 KLART:** kvinnligt inre (äggstock, äggledare med ampull/fimbrier, livmoder med dess ligament, slida, vestigiala rester som Gartners gång), kvinnligt yttre (vulva, klitoris, slidförgård, Bartholins körtel), manligt inre (testikel med sädeskanaler/rete testis, bitestikel, sädesledare, sädesblåsa, prostata med mellanlob/periurethral zon, Cowpers körtel), manligt yttre (penis svällkroppar, ollon, scrotum med dartos) samt mellangården (perinealkropp, ytliga/djupa perinealrummet, perinealmembran, ischiocavernosus/bulbospongiosus, ischioanala gropen, Alcocks kanal).
  - **A10 bukhålan & bukhinnan (75) – HELA A10 KLART:** vägg- och organbukhinna, retroperitoneala/retropubiska rummet, mesenterier och mesokolon, lilla och stora omentet med samtliga peritonealligament (hepato-, gastro-, spleno-, pancreatico- och phrenico-banden), leverband (krans-, skär- och triangelbanden), omentalbursan med Winslows hål samt de kliniskt viktiga bukhinnefickorna och triangarna (Morisons grop, Douglas rum, paraduodenala/ileocekala fickor, paracoliska rännorna, Calots och Hesselbachs triangel, ljumskgropar och navelveck), breda livmoderbandet med meso-delarna.
  - **A11 endokrina körtlar (19) – HELA A11 KLART:** hypofysens fram- och baklob med deras delar, tallkottkörteln, sköldkörteln (istmus, pyramidlob, accessoriska), bisköldkörtlarna (övre/nedre/accessoriska) och binjurarna (med centralven och accessoriska).
- Synliga termer: 7 777 → **8 034** (+257). Inga dubbletter. Delade termer (tunica albuginea, sphincter urethrae externus/internus, crista urethralis m.fl.) infördes en gång. Medvetet utelämnat: generiska pars-/ytetiketter, prostatans lobulus-indelning, vestigiala gångdetaljer och finhistologiska underavdelningar. Strukturord inverterade enligt sorteringsregeln. Näst på tur: A12 hjärta och kärl.
- APP_VERSION/VERSION → 0.8.47 (cachebuster: app.js → 0.8.47; glossary.css/js oförändrade; styles.css oförändrad).

## 0.8.46
- **Ordlistan: latinska anatomitermer (TA98) – fas 15. Matsmältningssystemet klart + hela andnings-, brösthåle- och urinsystemet. +269 poster.**
  - **A05 matsmältningssystemet, del 2 (88) – HELA A05 KLART:** levern (lober, ytor, porta hepatis, nakna fältet, leverband), gallvägarna (gallblåsa, gall- och levergångar, ductus choledochus/cysticus), bukspottkörteln (huvud/kropp/svans, gångar, ölandskap), tjocktarmen (taenia/haustra/fettbihang, flexurer, blindtarm med appendix) och ändtarm/analkanal (ampulla recti, columnae anales, linea pectinata, slutmuskler).
  - **A06 andningsorganen (111) – HELA A06 KLART:** yttre näsa och näsbrosk, näshåla/bihålor, struphuvudet (brosk, leder, membran/ligament, de inre struphuvudsmusklerna, struphuvudshålan med ficke- och stämband), luftstrupen, bronkträdet (huvud- och lobbronker, bronkioler) och lungorna (lober, fåror, hilus, lingula, hjärtinskärning, bronkopulmonella segment).
  - **A07 brösthålan (21) – HELA A07 KLART:** lungsäcken (viscerala/parietala pleura, kupol), lungsäcksvecken/recesserna (bl.a. det kostodiafragmatiska), lungbandet, suprapleurala membranet och mediastinums fem avdelningar samt hjärtsäckshålan.
  - **A08 urinvägarna (49) – HELA A08 KLART:** njuren (hilus, sinus, bark/märg, pyramider, papiller, kolumner, fascior/kapslar), njurens kärlträd (interlobär-, båg- och barkartärer, afferent/efferent glomerulusarteriol, vasa recta, stjärnvener), njurbäcken och kalkar, urinblåsan (delar, blåstriangel, detrusor, blåshals) samt kvinnligt/manligt urinrör.
- Synliga termer: 7 508 → **7 777** (+269). Inga dubbletter. Medvetet utelämnat (generiska/upprepade barntermer): tandkuspar/-rötter, leverns segmentindelning, finhistologiska njurmärgszoner, de numrerade segmentbronkerna/lungsegmenten och njursegmenten, samt generiska pars-/lager-etiketter. Strukturord (musculus/articulatio/ligamentum/arteria/vena/plexus m.fl.) inverterade enligt sorteringsregeln. Näst på tur: A09 könsorganen.
- APP_VERSION/VERSION → 0.8.46 (cachebuster: app.js → 0.8.46; glossary.css/js oförändrade; styles.css oförändrad).

## 0.8.45
- **Ordlistan: latinska anatomitermer (TA98) – fas 14, matsmältningssystemet (A05), del 1: mun till tunntarm. 294 poster.**
  - **Munhåla & spottkörtlar (43):** läppar, gom, tandkött och de tre stora spottkörtlarna med utförsgångar (Stensens, Whartons, Bartholins).
  - **Tänderna (41):** tandtyper, tandens delar (krona, hals, rot, pulpa), tandvävnaderna (emalj, dentin), tandalveolen, mjölktänder/permanenta tänder.
  - **Tungan (31):** tungans delar, smakpapillerna och tungmusklerna (genioglossus m.fl.).
  - **Svalg & gomsegel (svalgmandlar, gombågar, svalgsnörarmusklerna) och matstrupen** med dess tre delar och förträngningar.
  - **Magsäck & tunntarm:** magsäckens delar och portvaktsmuskeln; tunntarmens veck, tarmludd och körtlar; tolvfingertarmens fyra delar med Vaters papill, Treitz muskel och Meckels divertikel.
  - Mag-tarmväggens generiska lager (tunica mucosa, tela submucosa, tunica muscularis, serosa m.fl.) infördes en gång som allmänna begrepp.
- Synliga termer: 7 287 → **7 508** (+221 synliga; netto inkl. ompekade strukturord). Inga dubbletter. Granulära riktningsvarianter (kuspar/ytor/rötter, snörarmuskelns delar) utelämnade medvetet. Återstår av A05: tjocktarm, lever/galla/bukspott och bukhinnan.
- APP_VERSION/VERSION → 0.8.45 (cachebuster: app.js → 0.8.45; glossary.css/js oförändrade 0.8.29; styles.css oförändrad 0.7.1).

## 0.8.44
- **Ordlistan: latinska anatomitermer (TA98) – fas 13, musklerna (A04 Musculi), del 2. Hela muskelkapitlet klart (+465 totalt sedan A03).**
  - **Nedre extremiteten (91):** höft- och sätesmusklerna, de djupa utåtrotatorerna, fyrhövdade lårmuskeln, adduktorerna, hamstrings, underbenets loger (tibialis, fibularis, triceps surae med hälsenan) och fotens småmuskler; dessutom lårtriangeln, adduktorkanalen, lårkanalen och fotens retinakler.
  - **Senskidor & slemsäckar (34):** senskidans uppbyggnad, fingrarnas ringband (pulley-systemet) samt de kliniskt vedertagna slemsäckarna (subakromiala, olekranon-, trokanter-, prepatellara, anserina, hälsene-bursan m.fl.).
  - **Bäckenstöd (7):** pubovesikala/puboprostatiska banden, urinblåsans sidoband och de rektovaginala/rektoprostatiska fasciorna (Denonvilliers).
- *Musculus flexor digiti minimi brevis* slogs ihop till en post (homonym i både hand och fot).
- Synliga termer: 7 155 → **7 287** (+132 i denna commit; A04 totalt +465). Inga dubbletter. Den långa svansen av rent generiska deletiketter (caput/pars/lamina) och obskyra enskilda *bursa subtendinea musculi …* utelämnade medvetet. Näst på tur: A05 matsmältningssystemet.
- APP_VERSION/VERSION → 0.8.44 (cachebuster: app.js → 0.8.44; glossary.css/js oförändrade 0.8.29; styles.css oförändrad 0.7.1).

## 0.8.43
- **Ordlistan: latinska anatomitermer (TA98) – fas 12, musklerna (A04 Musculi), del 1: huvud till hand. 333 poster.**
  - **Allmän muskellära (42):** muskeltyper (spol-, fjäder-, ring-, en-/två-/trehövdade …), funktionsnamn (flexor, extensor, abductor, sfinkter …), fästpunkter, muskelfascia, epimysium/perimysium och senstrukturer.
  - **Huvudet (45):** mimiska muskler (occipitofrontalis, orbicularis oculi/oris, zygomaticus, buccinator, mentalis …), tuggmusklerna (masseter, temporalis, vingmusklerna) och senhjälmen.
  - **Halsen (34):** nickmuskeln, trappmusklerna, för- och undertungbensmusklerna, nackgropsmusklerna, halsfascian och karotisskidan.
  - **Ryggen (53):** kappmuskeln, breda ryggmuskeln, romboid- och sågmusklerna samt de djupa egentliga ryggmusklerna (erector spinae, transversospinala lagret) och torakolumbalfascian.
  - **Bröstkorgen (34):** stora/lilla bröstmuskeln, främre sågmuskeln, intercostalmusklerna och diafragma med dess skänklar, öppningar och centralsena.
  - **Buken & bäckenbotten (62):** raka och sneda bukmusklerna, transversus, ljumskbandet och ljumskkanalen, vita linjen, bäckenbotten (levator ani-gruppen) och yttre analsfinktern.
  - **Övre extremiteten (63):** rotatorkuffen, biceps/triceps, underarmens böj- och sträckmuskler, handens småmuskler samt flexor- och extensorretinaklet.
- Strukturord (musculus, ligamentum, tendo …) inverteras och filas på sitt egentliga namn; kompletta latinet står först i definitionen.
- Synliga termer: 6 822 → **7 155** (+333). Inga dubbletter. Generiska upprepade deletiketter (caput/pars/lamina, upprepade fasciavarianter) utelämnade. Återstår av A04: nedre extremiteten samt yttre ögon-, hörselbens-, tung-, gom-, svalg- och struphuvudmuskler.
- APP_VERSION/VERSION → 0.8.43 (cachebuster: app.js → 0.8.43; glossary.css/js oförändrade 0.8.29; styles.css oförändrad 0.7.1).

## 0.8.42
- **Ordlistan: latinska anatomitermer (TA98) – fas 11, lederna och ledbanden (A03 Juncturae). Hela kapitlet klart, 342 poster.**
  - **Allmän ledlära (52):** fog-/ledtyper (synartros, syndesmos, synkondros, synovialled, kulled, sadelled, vridled, ellipsoidled m.fl.), ledkapselns och ledhålans delar (ledkapsel, ledhinna, ledskiva, menisk, ledläpp, slemsäck, senskida) samt ledrörelser (abduktion, adduktion, pro-/supination, opposition).
  - **Skallens fogar (54):** bensömmar (sutura sphenofrontalis, frontonasalis, palatina mediana …), synkondroser i skallbasen, tandens stödjevävnad (periodontium, rotcement), käkleden (art. temporomandibularis) och övre nackleden (art. atlantooccipitalis).
  - **Kotpelaren (34):** långa ryggradsbanden, gula ledbanden, nackbandet, mellankotskivan med fiberring och diskkärna, atlas–axis-lederna med vingband och tvärband, fasettlederna samt korsbens- och svansbensfogarna.
  - **Bröstkorgen (28):** revben–kotleder, revben–tvärutskottsleder, bröstben–revbensleder och intercostalmembranen.
  - **Övre extremiteten (69):** skuldergördelns leder (akromioklavikular- och sternoklavikularled, korakoklavikularband), axelled, armbågsled med ringband, handled och handens leder (karpaltunneln, Guyons kanal, tummens sadelled, knogleder).
  - **Nedre extremiteten (105):** blygdbensfog, korsben–tarmbensled, höftled med iliofemoral-/runda ledbandet, knäled med korsband, sidoband, menisker och knäskålsband, samt fotens leder (övre/nedre fotled, deltaligament, Choparts och Lisfrancs leder, fjäderligament, långa fotsulebandet).
- Strukturnamn (articulatio, ligamentum, bursa …) inverteras som i tidigare faser och filas på sitt egentliga namn; kompletta latinet står först i definitionen och är sökbart.
- Synliga termer: 6 480 → **6 822** (+342). Inga dubbletter. Rent generiska, upprepade barntermer (ligamenta collateralia/palmaria/plantaria m.fl.) utelämnade medvetet. Näst på tur: A04 Musculi (muskler).
- APP_VERSION/VERSION → 0.8.42 (cachebuster: app.js → 0.8.42; glossary.css/js oförändrade 0.8.29; styles.css oförändrad 0.7.1).

## 0.8.41
- **Ordlistan: latinska anatomitermer (TA98) – fas 10, allmänna skallstrukturer (73 poster). Därmed är hela skelettet (A02 Ossa) klart.**
  - **Allmän skalle (73):** norma-vyer, kraniometriska punkter (nasion, bregma, lambda, pterion, asterion …), tinninggrop/okbåge/ving-gomgrop, fontaneller, skalltakets benlager, skallbasen med foramen jugulare och lacerum, hårda gommen, ögonhålan med dess väggar och öppningar, samt bennäshålan med näsgångar och öppningar.
- Synliga termer: 6 407 → **6 480** (+73). Inga dubbletter. Skelettkapitlet (A02) fullständigt; näst på tur: A03 leder/ledband, A04 muskler.
- APP_VERSION/VERSION → 0.8.41 (cachebuster: app.js → 0.8.41; glossary.css/js oförändrade 0.8.29; styles.css oförändrad 0.7.1).

## 0.8.40
- **Ordlistan: latinska anatomitermer (TA98) – fas 9, tinningbenet (62 poster).** Fortsatt kraniedetalj-import (A02.1).
  - **Tinningbenet (os temporale, 62):** klippbenet (pars petrosa) med ansiktsnervkanal, halspulsåderkanal, muskel–rörkanal, inre hörselgång och fåror för stenbenssinus; trumdelen (pars tympanica) med yttre hörselgång och trumhinnefåra; fjälldelen (pars squamosa) med käkledsgrop och ledknöl; samt vårtutskottets strukturer och tinningbenets springor.
- Synliga termer: 6 345 → **6 407** (+62). Inga dubbletter. (A02.1 forts.: allmän skalle/skallbas/fossae/foramina/fontaneller återstår, ~80 st.)
- APP_VERSION/VERSION → 0.8.40 (cachebuster: app.js → 0.8.40; glossary.css/js oförändrade 0.8.29; styles.css oförändrad 0.7.1).

## 0.8.39
- **Ordlistan: latinska strukturnamn sorteras nu på sitt egentliga namn, inte på genus-ordet.** Tidigare hamnade alla `os …` på bokstaven O, alla `musculus …` skulle hamnat på M osv. – olämpligt för ett lexikon. Nu inverteras strukturnamn: uppslagsordet visar det specifika namnet först och filas på dess bokstav, medan det kompletta latinska namnet skrivs ut först i definitionen (och förblir sökbart).
  - Exempel: `os frontale` → **`frontale, os`** (sida F), `os coxae` → `coxae, os` (C), `os hyoideum` → `hyoideum, os` (H). Definition: `subst. os frontale; pannben; …`.
  - Gäller strukturgenus (os, ossa, musculus, nervus, arteria, vena, ligamentum, glandula, nodus, ganglion, articulatio, ramus, truncus, plexus, bursa, tendo). Topografiska detaljord (fossa, sulcus, processus, facies, foramen m.fl.) lämnas som de är. 57 befintliga poster inverterade; regeln gäller alla kommande anatomibatchar (dokumenterat i `scripts/anatomi_import_mall.md`).
- APP_VERSION/VERSION → 0.8.39 (cachebuster: app.js → 0.8.39; glossary.css/js oförändrade 0.8.29; styles.css oförändrad 0.7.1).

## 0.8.38
- **Ordlistan: latinska anatomitermer (TA98) – fas 8, kilbenet (44 poster).** Fortsatt kraniedetalj-import (A02.1).
  - **Kilbenet (os sphenoidale, 44):** sella turcica-regionen (sadelknöl, hypofysgrop, sadelrygg, sadelutskott), lilla och stora vingen, synnervskanal, övre ögonhålespringan, skallbasens foramina (rotundum, ovale, spinosum m.fl.), vingutskotten med inre/yttre vingplatta och vingkrok, samt kilbenshålan (sinus sphenoidalis).
- Synliga termer: 6 301 → **6 345** (+44). Inga dubbletter. (A02.1 forts.: tinningben och allmän skalle/skallbas återstår.)
- APP_VERSION/VERSION → 0.8.38 (cachebuster: app.js → 0.8.38; glossary.css/js oförändrade 0.8.29; styles.css oförändrad 0.7.1).

## 0.8.37
- **Ordlistan: latinska anatomitermer (TA98) – fas 7, pannben och hjässben (41 poster).** Fortsatt kraniedetalj-import (A02.1).
  - **Pannbenet (os frontale, 27):** pannbensfjäll, pannknöl, ögonbrynsbåge, glabella, ögonhålekant med supraorbitalhål, ögonhåledel med tårkörtelgrop, samt pannbihålan (sinus frontalis).
  - **Hjässbenet (os parietale, 14):** hjässknöl, tinninglinjer, kanter och hörn, fåror för övre pilbladssinus och mellersta hjärnhinneartären.
- Synliga termer: 6 260 → **6 301** (+41). Inga dubbletter. (A02.1 forts.: kilben, tinningben och allmän skalle/skallbas återstår.)
- APP_VERSION/VERSION → 0.8.37 (cachebuster: app.js → 0.8.37; glossary.css/js oförändrade 0.8.29; styles.css oförändrad 0.7.1).

## 0.8.36
- **Ordlistan: latinska anatomitermer (TA98) – fas 6, nackben, silben m.fl. (57 poster).** Fortsatt kraniedetalj-import (A02.1).
  - **Nackbenet (os occipitale, 31):** nackbensfjäll, nackbensknölar, hypoglossuskanal, nacklinjer, korsupphöjningen och sinusfårorna på insidan, samt de kraniometriska punkterna basion och opisthion.
  - **Silbenet (os ethmoidale, 15):** silplattan, silbenslabyrinten med luftceller, övre och mellersta näsmusslan, krokutskott och hiatus semilunaris.
  - **Små ansiktsben (11):** nedre näsmusslans utskott, tårbenet, näsbenet och plogbenet (vomer).
- Synliga termer: 6 203 → **6 260** (+57). Inga dubbletter. (A02.1 forts.: pannben, kilben, tinningben och allmän skalle/skallbas återstår.)
- APP_VERSION/VERSION → 0.8.36 (cachebuster: app.js → 0.8.36; glossary.css/js oförändrade 0.8.29; styles.css oförändrad 0.7.1).

## 0.8.35
- **Ordlistan: latinska anatomitermer (TA98) – fas 5, ansiktsskelettet (92 poster).** Påbörjad kraniedetalj-import (A02.1).
  - **Ansiktsskelettet (92):** överkäken (maxilla) med käkhåla, ögonhåleyta, infraorbitalkanal, gomutskott och tandutskott; underkäken (mandibula) med kropp, gren, käkvinkel, hak- och muskelutskott, underkäkskanal; tungbenet (os hyoideum); okbenet (os zygomaticum); gombenet (os palatinum); samt gemensamma tandburande strukturer (alveoli dentales, septa interalveolaria m.m.).
- Synliga termer: 6 111 → **6 203** (+92). Inga dubbletter. (A02.1 forts.: skalltakets ben, kilben, tinningben, silben, allmän skalle/fossor/foramina återstår.)
- APP_VERSION/VERSION → 0.8.35 (cachebuster: app.js → 0.8.35; glossary.css/js oförändrade 0.8.29; styles.css oförändrad 0.7.1).

## 0.8.34
- **Ordlistan: latinska anatomitermer (TA98) – fas 4, underben och fot (74 poster).** Slutför nedre extremitetens skelett (A02.5).
  - **A02.5 nedre extremitet, del 2 (74):** knäskålen (basis/apex patellae), skenbenet (tibia) med ledknölar, mellankondylytor, skenbensknöl och inre fotknöl, vadbenet (fibula) med huvud, hals och yttre fotknöl, samt foten – fotrotsbenen (språngben/talus, hälben/calcaneus, båtben, de tre kilbenen, tärningsben/cuboideum), mellanfotsben och deras knölar. Därmed är hela skelettets extremiteter klara.
- Synliga termer: 6 037 → **6 111** (+74). Inga dubbletter.
- APP_VERSION/VERSION → 0.8.34 (cachebuster: app.js → 0.8.34; glossary.css/js oförändrade 0.8.29; styles.css oförändrad 0.7.1).

## 0.8.33
- **Ordlistan: latinska anatomitermer (TA98) – fas 3, bäcken och lårben (97 poster).** Fortsatt region-för-region-import enligt `scripts/anatomi_import_mall.md`.
  - **A02.5 nedre extremitet, del 1 (97):** höftbenet (os coxae) med tarmben, sittben och blygdben och alla detaljer (acetabulum, höftbenskam, höftbenstaggar, säteslinjer, foramen obturatum m.m.); bäckenet som helhet (stora/lilla bäckenet, bäckeningång/-utgång, gränslinje) och bäckenmåtten (conjugata vera/diagonalis/externa m.fl., diametrar, distantiae); lårbenet (femur) med huvud, hals, trochantrar, linea aspera, ledknölar och gropar.
- Synliga termer: 5 940 → **6 037** (+97). Inga dubbletter. (A02.5 forts.: patella, skenben, vadben och foten återstår.)
- APP_VERSION/VERSION → 0.8.33 (cachebuster: app.js → 0.8.33; glossary.css/js oförändrade 0.8.29; styles.css oförändrad 0.7.1).

## 0.8.32
- **Ordlistan: latinska anatomitermer (TA98) – fas 2, övre extremiteten (116 poster).** Fortsatt region-för-region-import enligt `scripts/anatomi_import_mall.md`.
  - **A02.4 Övre extremitet (116):** skuldergördel (skulderblad med gropar/kam/utskott, nyckelben), överarmsben (caput/collum/tuberkler/epikondyler/trochlea/capitulum/gropar), strålben och armbågsben med alla detaljer, handlovsbenen (os scaphoideum, lunatum, triquetrum, pisiforme, trapezium, trapezoideum, capitatum, hamatum), mellanhandsben och fingerben (falanger), ossa sesamoidea.
- Synliga termer: 5 824 → **5 940** (+116). Inga dubbletter.
- APP_VERSION/VERSION → 0.8.32 (cachebuster: app.js → 0.8.32; glossary.css/js oförändrade 0.8.29; styles.css oförändrad 0.7.1).

## 0.8.31
- **Ordlistan: kompletterad mot externa medicinska ordlistor (117 nya poster).** Genomgång av källor (senioralert.se, cancercentrum.se, gyncancer.se, ibrancepatient.se, carpanet.se) – endast genuint saknade *medicinska* termer infördes enligt grundmallen, dubbletter och rena böjningsvarianter hoppades över, och eHälsomyndighetens IT-/förvaltningstermbank bedömdes ligga utanför ordlistans ram.
  - Kärntermer som saknats: metastas, dottertumör, kirurgi, röntgen, mutation, vävnad, ultraljud, strålbehandling, datortomografi, kemoterapi, immunterapi, cellgift, fatigue, biverkning, livskvalitet, dos, screening, biomarkör, finnålspunktion, mellannålsbiopsi, miktion, morfologi m.fl.
  - Endokrint (hormoner/tumörer): hormon, kortisol, serotonin, vasopressin, sköldkörtel, bisköldkörtel, parathormon, tyroxin/T3/T4, GH/tillväxthormon, bukspottkörtel, lever, adenohypofys/neurohypofys, carcinoid(syndrom), insulinom/gastrinom/glukagonom/prolaktinom/somatostatinom m.fl.
  - Vård-/patientbegrepp och förkortningar (på användarens beslut): brytpunktssamtal, palliativ vård, kontaktsjuksköterska, fast vårdkontakt, prehabilitering, second opinion, evidens, morbiditet, mortalitet; RCC, MDK, SVF, PAD, HSL, IVO, SKR, NPÖ, INCA, PVK, PICC-line, RIK, BRCA, FIGO, GnRH, HER2, MR/MRT/DT/UL; bedömningsskalor (Nortonskala, MNA, DFRI, RAPS, ROAG). Läkemedels-varunamn uteslöts medvetet.
- **Ordlistan: latinska anatomitermer från Terminologia Anatomica – fas 1 (138 poster).** Påbörjad systematisk import av kroppens latinska anatominamn region för region, med Terminologia Anatomica (TA98) som auktoritativ källa (äkta latin som uppslagsord, engelska som `Eng.`-alternativ, kort definition + ordförklaring av latinet; inget påhittat svenskt namn). Arbetsmall + status/logg i `scripts/anatomi_import_mall.md`.
  - **A02 Ossa / skalle (27):** os frontale, parietale, occipitale, temporale, sphenoidale, ethmoidale … foramen magnum, fossa cranii anterior/media/posterior, sella turcica, suturae, cranium/neurocranium/viscerocranium.
  - **A02.2 Columna vertebralis (70):** kotpelarens krökningar, kotans delar (corpus/arcus/processus …), halskotor, atlas, axis, bröst-/ländkotor, os sacrum med detaljer, os coccygis.
  - **A02.3 Thorax (41):** costae (verae/spuriae/fluctuantes) med detaljer, bröstbenet (manubrium/corpus/processus xiphoideus), bröstkorgens öppningar och mått.
- Synliga termer: 5 569 → **5 824** (+255). Inga dubbletter (befintliga former hoppades över vid kollision).
- APP_VERSION/VERSION → 0.8.31 (cachebuster: app.js → 0.8.31; glossary.css/js oförändrade 0.8.29; styles.css oförändrad 0.7.1).

## 0.8.30
- **Ordlistan: ålderdomliga och latinska sjukdoms-/anatominamn inarbetade (135 poster).** Material från fem källor (hhogman.se, slaktingar.se, kvalevaag.se ×2, Riksarkivets dödregister), egengranskat — den OCR-trasiga latin–svensk-listan importerades INTE rakt av utan latinet översattes korrekt.
  - **Fas 1 (39):** 14 `Ålderdomligt:`-noter sist i befintliga poster (sökbara via def): anemi←bleksot, epilepsi←fallandesot, dysenteri←rödsot, ödem←vattusot, apoplexi←slag, chorea←danssjuka, ergotism←dragsjuka, rakit, gangrän←benbrand, influensa←spanska sjukan, osteomyelit←benröta, diabetes←sockersjuka, hemorrojd←gyllenåder. + 25 nya poster (lungsot, tvinsot, hektik, vita pesten, pest, digerdöden, frossa, fläcktyfus, gulsot, franska sjukan, skörbjugg, gikt, barnsängsfeber, stenpassion, håll och styng, moderpassion m.fl.).
  - **Fas 2 (96):** distinkta latinska/historiska namn + saknade ankare (tuberkulos, syfilis, malaria, difteri, kolera, scharlakansfeber, kikhosta, mässling, smittkoppor, hysteri, spetälska, stelkramp …), latinformer (morbilli, phthisis, skrofler, lupus vulgaris, mjältbrand, tabes dorsalis, paralysis agitans …), grundformer med organ-not (carcinoma, sarcoma, apoplexia, gangraena, embolia, thrombosis) och eponymer (Brights/Basedows/Ménières/Bantis/Littles sjukdom + Morbus-former).
  - **Tolkningskonflikter flaggade** som historiska och ej förenliga med modern medicin (angina pectoris förr brett om bröst-/halssmärtor; gikt förr all ledvärk; moderpassion/hysteri tillskrivna livmodern).
  - Synliga termer: 5 448 → **5 569** (+121 nya poster, 14 berikade). Inga dubbletter.
- **Ordlistan: unik meta-description per bokstavssida.** Varje `ordlista-*.html` (A–Ö, siffror, suffix) + landningssidan har nu en egen, olika formulerad beskrivning med en fråga, äkta exempeltermer och relevanta nyckelord, alla ≤157 tecken. Datadrivet i `scripts/generate_glossary.py` (`GROUP_DESCRIPTIONS`/`LANDING_DESC`) med inbyggd längdkontroll; slår igenom på meta, og:/twitter: och JSON-LD. `sitemap.xml` och alla 31 sidor omgenererade.
- APP_VERSION/VERSION → 0.8.30 (cachebuster: app.js → 0.8.30; glossary.css/js oförändrade 0.8.29; styles.css oförändrad 0.7.1).

## 0.8.29
- **Ordlistan: grekiska termerna kompletterade och korrigerade.** Granskning av 0.8.28 mot ursprungslistan visade tappade detaljer som nu rättats:
  - **ε-kedja** (epsilon-kedja) tillagd under E — embryonal hemoglobinkedja som tidigare fallit bort. Synliga termer 5 447 → **5 448**.
  - **Böjning återställd** i de två integrerade posterna: α-receptor `(alfa-receptor; -n, pl. -er)` och β-blockerare `(beta-blockerare; -n, pl. -∅)` (föll bort när parentesen byttes mot translittereringen).
  - **Dubbla translittereringsformer angivna** där båda används i svensk medicinsk terminologi: χ²-test `(chi-två-test, även khi-två-test)`, φ-koefficient `(fi-koefficient, även phi-koefficient)`, μ-receptor `(my-receptor, även mu-receptor)`. Gör posterna sökbara på båda stavningarna.
- APP_VERSION/VERSION → 0.8.29 (cachebuster: app.js → 0.8.29, glossary.css/js → 0.8.29; styles.css oförändrad 0.7.1).

## 0.8.28
- **Ordlistan: grekiska glyf-termer insorterade under latinsk bokstav (38 poster).** Termer med grekisk inledningsbokstav (β-blockerare, ω-3-fettsyror, χ²-test …) visas nu med den grekiska glyfen som uppslagsord men sorteras in under sin latinska translitterering (β → B, ω → O, χ → C, φ → F osv.). Hela det utskrivna ordet anges i parentes direkt efter ordklassen, t.ex. *subst.* (beta-blockerare) …, vilket gör posten sökbar utan grekiskt tangentbord.
  - **3 integrerade** i befintliga poster (β-blockerare ← betablockerare, α-receptor ← alfareceptor, α-fetoprotein ← Alfa-1-fetoprotein); deras gamla ankare bevarades så inga djuplänkar bröts.
  - **35 nya** poster enligt grundmallen (α₁/α₂/β₁/β₂-receptorer, β-amyloid, β-laktam, β-oxidation, γ-GT, γ-globulin, γ-interferon, γ-strålning, γ-aminosmörsyra, δ/κ/μ/σ-receptorer, opioidreceptorer, immunglobulinkedjor, ω-fettsyror, EEG-vågor m.fl.).
  - **Mekanism:** nytt valfritt `sort`-fält i `data/ordlista.json` styr både bokstavsgrupp och ordning inom gruppen; speglat byte-identiskt i `scripts/generate_glossary.py` (`sort_value`) och `js/glossary.js` (`sortValue`). Explicit `slug` per post hindrar kollision med de utskrivna grundorden.
  - Synliga termer: 5 412 → **5 447** (+35). Sidorna omgenererade.
- **Ordlistan: bokstavsrubrikerna får plats på mobil.** Sidtiteln (`Medicinska ord på A` m.fl.) skalar nu med skärmbredden (`clamp(1.5rem, 6.5vw, 2.5rem)`) så att även långa titlar ryms snyggt; scoped i `glossary.css`.
- APP_VERSION/VERSION → 0.8.28 (cachebuster: app.js → 0.8.28, glossary.css/js → 0.8.28; styles.css oförändrad 0.7.1).

## 0.8.27
- **Flashcards avstängda för ämnet Tentaplugg (tillsvidare).** Ämnet innehåller frågor som inte fungerar som flashcards. Etiketten i ämnesvalet ändrad från "Tentaplugg (MC+FC)" till "Tentaplugg (MC)", vilket via den befintliga `updateStartButtons`-logiken automatiskt dimmar (inaktiverar) "Starta flashcards"-knappen när Tentaplugg är valt. Ingen kodlogik ändrad.
- APP_VERSION/VERSION → 0.8.27 (cachebuster: app.js → 0.8.27; glossary oförändrad 0.8.26; styles.css 0.7.1).

## 0.8.26
- **Ordlistan: Å och Ä fyllda (21 nya poster).** Tidigare tomma bokstäver; nu egna sidor (`ordlista-aa.html`, `ordlista-ae.html`) och aktiva i alfabetsraden. Posterna följer grundmallen och kopplas till latinska/moderna termer.
  - **Kliniskt etablerade:** ärr, ärrbildning, ärrvävnad, ärrbråck, ärrkontraktur, ätstörning; ångest, ångestsyndrom, åderbråck, åderförkalkning.
  - **Historiska/kyrkbokstermer märkta *Ålderdomligt*:** åder, åderlåtning, åderlåta, åderinflammation, åderstockning, åkomma, ålderdom, ålderdomssvaghet, åldersbräcklighet, åldersförfall, ångestneuros (flera var vanliga dödsorsaker i äldre kyrkböcker).
  - **Slug-kollision löst:** `ärr` foldas annars till samma ankare som förkortningen `ARR`. Nytt valfritt `slug`-fält i `data/ordlista.json` åsidosätter foldningen för enstaka poster (`ärr` → `term-aerr`); speglat byte-identiskt i `scripts/generate_glossary.py` och `js/glossary.js`. Befintliga ankare orörda.
  - Synliga termer: 5 391 → **5 412** (+21). Sidorna omgenererade.
- APP_VERSION/VERSION → 0.8.26 (cachebuster: app.js → 0.8.26, glossary.css/js → 0.8.26; styles.css oförändrad 0.7.1).

## 0.8.25
- **Ordlistan: standardiserad grundmall för alla poster (uppslagsverksstil).** Samtliga 5 391 poster följer nu en enhetlig struktur: **fett, gement uppslagsord** (utom förkortningar och egennamn/eponymer), **kursiv förkortad ordklass** direkt följd av **böjning i parentes** (`subst. (-en, pl. -er) …`), gemen definitionsinledning, varianter (`Sv.`, `Vardag.`, `Eng.`) och etymologi.
  - **Uppslagsord gemeniserade:** 4 164 termer (Abdomen → abdomen). Förkortningar (ACE, AAT, 5-FU) och 26 kurerade eponymer (Crohns sjukdom, Parkinsons sjukdom, Cushings syndrom, Sjögren …) behåller versal; eponym-härledda gloss-ord skyddas (Apgarpoäng).
  - **Fältmarkörer:** `Lekman:` → `Vardag.`, `Eng:` → `Eng.`, `Sv:` → `Sv.`.
  - **Rendering:** `formatDef`/`format_def` kursiverar nu den **ledande ordklass-token** i stället för den engelska termen — endast ordklassen kursiveras. Speglat byte-identiskt i `scripts/generate_glossary.py` och `js/glossary.js`. Sidorna omgenererade.
  - Grundmall att bygga vidare på (t.ex. arkaiska varianter som *bleksot* senare).
- APP_VERSION/VERSION → 0.8.25 (cachebuster: app.js → 0.8.25, glossary.css/js → 0.8.25; styles.css oförändrad 0.7.1).

## 0.8.24
- **Ordlistan: kvalitetskontroll av dubbletter – svensk/latinsk formpar sammanslagna.** 56 par där samma ord stod som två poster i olika form (svensk vs latinsk) slogs ihop till en post med det **latinska/medicinska ordet som uppslagsord** och den svenska formen invävd som `Svensk form: …`; allt innehåll bevarat. Adjektiv (`Frontal→Frontalis`, `Renal→Renalis`, `Nasal→Nasalis` m.fl.) och substantiv (`Membran→Membrana`, `Ligament→Ligamentum`, `Tonsill→Tonsilla` m.fl.).
  - **4 par hölls medvetet isär** som falska vänner (lika form, olika ord): `Fibros`/`Fibrosus`, `Median`/`Medianus`, `Mental` (*mens*, psyket)/`Mentalis` (*mentum*, hakan), `Perone` (subst.)/`Peroneus` (adj.).
  - **9 korsreferenser omdirigerade** till respektive latinskt huvudord (`Jfr Lumbal`→`Lumbalis` osv.); 0 dinglande hänvisningar kvar.
  - Synliga termer: 5 447 → **5 391** (−56). Sidorna omgenererade.
- APP_VERSION/VERSION → 0.8.24 (cachebuster: app.js → 0.8.24; glossary.css/js oförändrade, styles.css oförändrad 0.7.1).

## 0.8.23
- **Alfabetsraden: tecken-/ändelsefacket märks "suffix" i stället för "#".** Facket innehåller bara suffix (poster som inleds med streck), så etiketten är nu uttrycklig. Speglat i `scripts/generate_glossary.py` (`group_label`) och `js/glossary.js` (sökträffarnas grupprubrik). Sidorna omgenererade.
- APP_VERSION/VERSION → 0.8.23 (cachebuster: app.js → 0.8.23, glossary.css/js → 0.8.23; styles.css oförändrad 0.7.1).

## 0.8.22
- **Ordlistan uppdelad i många små sidor (prestanda/SEO).** Den enda `medicinskordlista.html` hade växt till ~3,5 MB och fick katastrofal hastighet i Search Console (Core Web Vitals mäts per URL). Ordlistan är nu uppdelad i **en sida per begynnelsegrupp** — `ordlista-a.html … ordlista-z.html`, `ordlista-oe.html` (Ö), `ordlista-siffror.html`, `ordlista-tecken.html` (ändelser/suffix) — plus en lätt landningssida `medicinskordlista.html`.
  - **Indexsidan visar bokstaven A:s innehåll** (som ordlistan såg ut förr), inte hela listan — bara A laddas, så sidan är lätt (~180 KB mot 3,5 MB). Övriga bokstäver nås via alfabetsraden (egna sidor) eller sökrutan. Tyngsta gruppsidan (P) 216 KB; varje URL laddar snabbt och indexeras separat.
  - **Datadrivet, inget hårdkodat:** `scripts/generate_glossary.py` läser `data/ordlista.json` och skapar en sida för varje grupp som har termer. Tomma bokstäver (idag Å, Ä) får ingen sida men renderas nedtonade i alfabetsraden; dyker en term upp skapas sidan automatiskt vid nästa körning. Föräldralösa sidor städas bort.
  - **Global sökning bevarad:** `js/glossary.js` lazy-laddar `data/ordlista.json` först när användaren börjar söka (lätt sidladdning), och länkar varje träff till rätt sida + ankare. Söker man från en undersida används rent `#ankare` när träffen ligger på samma sida. JS bygger inte längre om listan — den jobbar ovanpå det statiska, crawlbara innehållet (fungerar utan JavaScript).
  - **Alfabetsraden** finns på alla sidor inkl. index; tecken-/ändelsefacket märks **`#`** (standard för symbolfack i A–Ö-index, t.ex. iOS-kontakter), inte "–".
  - **JSON-LD bantad:** den tidigare `DefinedTermSet`:en med samtliga termers URL:er (~1,8 MB) togs bort; varje sida har nu lätt `CollectionPage`/`WebPage` + `BreadcrumbList`. Termerna är ändå fullt crawlbara som semantisk `<dl>`.
  - **Term-ankare oförändrade:** per-post-markupen är byte-identisk, så befintliga `#term-…`-ankare fungerar (nu på respektive gruppsida). Stabila filnamns-slugs för diakriter (Å/Ä→.../Ö→`oe`) speglas identiskt i generator och `glossary.js`.
  - `sitemap.xml` omgenererad (rot + landning + 29 gruppsidor + case + info = 33 URL:er). SEO-meta i head håller fortfarande "tusentals" utan dynamisk siffra.
- **Ordklassmarkörerna städade och flyttade först i varje post.** Markören stod tidigare mitt i definitionen och ibland dubblerat (suffix-/prefix-poster: "Suffix: … (suffix) …"). Nu inleds varje post med sin ordklass som etikett: `(subst.)` → `Subst.:`, `(adj., -t, -a)` → `Adj., -t, -a:`, `(förkortn.)` → `Förkortn.:` osv.; suffix/prefix behåller `Suffix:/Prefix:`. Definitionen kapitaliseras. ~4 600 poster flyttade, ~800 suffix/prefix avdubblerade. Legitima sekundärmarkörer i etymologin ("(diminutiv)") och variantformer ("Även cancerös (adj.)") lämnades orörda.
- APP_VERSION/VERSION → 0.8.22 (cachebuster: app.js → 0.8.22, glossary.css/js → 0.8.22; styles.css oförändrad 0.7.1).

## 0.8.21
- **Medicinska ordlistan: systematiska suffix-poster (latin/grekiska).** Hela listan av medicinska efterled/slutled införd som egna poster i streck-form (`-agra`, `-algia / -algi`, `-cele` …), var och en med betydelse, ursprung och exempel – på samma sätt som prefix-posterna. Synliga termer: 5 294 → **5 447** (+153 suffix).
  - **Varianter samlade per post:** latinsk/grekisk + svensk form ligger i en gemensam post (`-algia / -algi`, `-osis / -os`, `-ektomi` osv.). Dubbletter över källans ämnesindelning slogs ihop (`-clasis/-clasia/-klasi` patologisk + kirurgisk; `-lysis/-lys` upplösning + kirurgisk frigöring; `-logia/-logi` läran om + sjukligt tal).
  - **Slug-disambiguering:** suffix-poster (inleds med streck) får ankarprefix `term-suffix-` så att de inte krockar med likalydande grundord/prefix (`-toxin` vs `Toxin`, `-plasma` vs `Plasma`, `-receptor`, `-stoma`, `-valva`, `-in` vs `in-`). Logiken speglad identiskt i `scripts/generate_glossary.py` och `js/glossary.js`; inga befintliga ankare påverkas (ingen tidigare term inleds med streck).
  - **Källrättelser verifierade mot litteratur (Wiktionary, Merriam-Webster Medical, medicinska ordböcker):** `-ont` → **`-odontia / -odonti`** (anodontia/hyperdontia/oligodontia är grek. *-odontia*; exemplet anodonti flyttat dit från `-dentia`, som behållits som latinsk variant med ex. *edentia*). `-ade` (spuriöst "funktionellt nätverk") → ersatt av det riktiga riktningssuffixet **`-ad`** (lat. *cephalad, caudad, ventrad*). `neuroexeres` → **`neurexeres`** (eng. *neurexeresis*). `-doxia`: psykiatri-påståendet borttaget (grek. *doxa* = åsikt; ortodoxi/heterodoxi). Bekräftade och behållna: `-cholia` (acholia), `-chylia` (achylia), `-thelia` (athelia/polythelia), `-icterus` (anicteric), `-tocia` (dystocia), `-liposis` (liposis).
  - **Städade/utelämnade källposter:** `-vcf` → `-valva`; `-gocrine` → `-krin`; korrupt `-spasmus`-exempel rensat. Utelämnade utan litteraturstöd: `-gasis`, `-isis` (= bara grek. `-sis`), `-strismus` (trismus < *trismos*); `-dysesthesia` slogs in i `-estesi` (dysestesi som exempel); `-ia` noterat i `-iasis`-posten.
  - `medicinskordlista.html` omgenererad via `scripts/generate_glossary.py`; statisk markup byte-identisk för befintliga poster. SEO-meta orörd ("tusentals", ingen siffra).
- APP_VERSION/VERSION → 0.8.21 (cachebuster: app.js → 0.8.21, glossary.js → 0.8.21).

## 0.8.20
- **Prefix-listan: tre källflaggade former kontrollerade mot litteratur och rättade.** Synliga termer: 5 295 → **5 294**.
  - `pycl- / pyclo-` → rättat till **`pycn- / pycno-`** (även pykn-/pykno-), grek. *pyknos* = tät/tjock. Var OCR-fel (n→l) i källistan.
  - `pemi- / pemp-` → rättat till **`pemphig- / pemphigo-`**, grek. *pemphix* (stam *pemphig-*) = blåsa/pustel. Betydelsen stämde, formerna var korrupta.
  - `parati- / paratio-` → **borttagen**; ingen attesterad kombineringsform (kontrollerat mot Wikipedias rotlista, prefix-ordböcker m.fl.). Parathyreoidea täcks redan av *para-* + *thyr-*.
  - `medicinskordlista.html` omgenererad. SEO-meta orörd.
- APP_VERSION/VERSION → 0.8.20 (cachebuster: app.js → 0.8.20, glossary.js → 0.8.20).

## 0.8.19
- **Medicinska ordlistan: systematiska prefix-poster (latin/grekiska).** Hela listan av medicinska för- och kombineringsled införd som egna poster i streck-form (`a-`, `ab-`, `aden- / adeno-` …), var och en med betydelse, ursprung och exempel. Synliga termer: 4 701 → **5 295** (+652 prefix, −58 ersatta).
  - **Ersatta gamla poster:** de 58 tidigare versala prefix-posterna (Ab, Ad, Adeno, Di, Endo, Epi, Exo, Hyper, Para, Sub …) togs bort och ersattes av de nya streck-formerna. De fyra prefix-posterna utan motsvarighet i listan (Giga, Krikos, Mylo, Psoa) lämnades orörda.
  - **Varianter samlade per post:** stavningsvarianter (t.ex. `haem-/hemat-/hemato-/hemo-`) ligger i en gemensam post; assimilerade former skrivs in i original-prefixets post (ad- → ac-/af-/ag-/al-/ap-/as-/at-, con- → co-/col-/com-/cor-, in- → il-/im-/ir-, ob- → oc-/of-/op-, sub- → suc-/suf-/…, syn- → sym-, ex- → ef-, en- → em-, dis- → dif-, apo- → ap-/aph-).
  - **Rättade OCR-fel** i källistans C-avsnitt (`gorm-`→corm-, `gorono-`→corono-, `gortic-`→cortic-, `gostat-`→cost-, `goxo-`→coxo-, `gylindr-`→cylindr-).
  - **Slug-disambiguering:** `ana- (grek.)`, `cis- (lat.)`, `genu- (lat.)` fick språktagg i titeln för att inte krocka med befintliga poster ANA, CIS, Genu.
  - **Källflaggor att verifiera:** `parati- / paratio-`, `pemi- / pemp-`, `pycl- / pyclo-` (ovanliga/oklara former i källistan – tolkade som parathyreoidea-, blåsa- resp. pykn-/pykno-).
  - `medicinskordlista.html` omgenererad via `scripts/generate_glossary.py`; statisk markup byte-identisk för befintliga poster. SEO-meta orörd ("tusentals", ingen siffra).
- APP_VERSION/VERSION → 0.8.19 (cachebuster: app.js → 0.8.19, glossary.js → 0.8.19). Highscore-data orörd.

## 0.8.18
- **Medicinska ordlistan: bokstäverna T–Ö (samt 5-ASA/5-FU) berikade** till fullt husformat. Synliga termer: 4 321 → **4 701**. Därmed är hela A–Ö berikat och 0 dolda stubbar återstår.
  - **T:** 201 berikade, 20 sammanslagna/borttagna (bl.a. Tymus → Thymus, Trokanter/Trochanter major/minor → Trochanter, Thoracal → Thoracalis, Trendelenburgs läge → Trendelenburgläge, verbformer → substantiv); rubrikfix "tics och Tourettes syndrom" → Tourettes syndrom.
  - **U:** 58 berikade, 1 sammanslagen (Undulans → Undulerande); källfel rättat: Urikosuri (var "urinsyraförgiftning" → korrekt = utsöndring av urinsyra i urinen).
  - **V:** 100 berikade, 3 sammanslagna (Varikös ven → Varice, Vasektomera → Vasektomi, Vesikulös → Vesikulär); stavningsrättning Volvolus → Volvulus.
  - **W/X/Y/Z/Ö + 5-ASA/5-FU:** 21 berikade.
  - **Källflaggor att verifiera:** TAP (ovanlig förkortning för telangiopati) och VH (angavs som tillväxthormon; standard är GH/STH).
- **SEO/meta:** Termantalet är nu helt borttaget ur head/SEO — `<title>`, og:/twitter:title och image:alt samt JSON-LD-beskrivningen säger "tusentals" (ingen siffra). Endast räknaren i sidans body (#termCount) är dynamisk. Källan satt i `scripts/generate_glossary.py` så framtida körningar aldrig återinför en siffra. `medicinskordlista.html` omgenererad.
- APP_VERSION/VERSION → 0.8.18 (cachebuster: app.js → 0.8.18). Highscore-data orörd.

## 0.8.17
- **SEO:** Meta-descriptions kortade till Bings krav (145–159 tecken) på resten av projektets sidor: index.html (204 → 150), info.html (169 → 148), case.html (162 → 149). Innehållet bevarat, bara putsat ned i längd. og:/twitter:description (sociala kort, ingen 159-gräns) orörda.
- APP_VERSION/VERSION → 0.8.17 (cachebuster: app.js → 0.8.17).

## 0.8.16
- **SEO:** Meta-descriptionen för medicinska ordlistan kortad till 146 tecken (Bing kräver 145–159; tidigare ~310). Texten är nu count-oberoende ("tusentals" i st.f. hårdkodat antal) så längden inte driver iväg när termantalet växer. Källan satt i `scripts/generate_glossary.py`; `medicinskordlista.html` omgenererad (body byte-identisk). og:/twitter:description orörda.
- APP_VERSION/VERSION → 0.8.16 (cachebuster: app.js → 0.8.16).

## 0.8.15
- **Medicinska ordlistan: bokstaven S berikad** till fullt husformat. Synliga termer: 4 051 → **4 321** (273 S-poster berikade, 0 stubbar kvar).
  - **Sammanslagningar/borttagningar (7 stubbar):** c/k-dubbletterna Sakrum → Sacrum och Sklera → Sclera (täcks redan av publicerade poster); Sequela → slagen ihop med Sekvele (lat./sv. synonym); -ös-former integrerade i grundordet enligt husregel: Soporös → Sopor, Stridorös → Stridor, Submukös → Submukosa, Seborroiskt → Seborré.
  - **Rubrikfixar:** felstavade/trasiga stubbrubriker rättade – Sekretotisk otit → Sekretorisk otit; Systemiskt: → Systemisk.
  - **Cross-referenser:** SAA/Amyloidos, SAB+SAH/Subaraknoidalblödning, SN/Sant negativ, SP/Sant positiv, Subileus/Ileus, Sensorisk afasi/Afasi, Störande variabel/Confounding factor, Supinera/Pronera, Systolisk/Diastolisk, Serum/Plasma, SXA/DXA m.fl.
  - Forsknings-/statistikbegrepp (Sannolikhetskvot, Sensitivitet/Specificitet, Sensitivitetsanalys, Signifikans(nivå), Stratifiering, Systematisk översikt, Sant pos./neg., Sham) bevarade med tolkningsförklaring.
  - Innehåller även en separat upprensning: de fyra enbokstavsposterna A/B/C/D (evidensgrad) sammanslagna till en samlad post **Evidensgrad**.
- APP_VERSION/VERSION → 0.8.15 (cachebusters: glossary.css → 0.8.15, glossary.js → 0.8.15, app.js → 0.8.15). Highscore-data orörd.

## 0.8.14
- **Medicinska ordlistan: bokstaven R berikad** till fullt husformat. Synliga termer: 3 898 → **4 051** (153 R-poster berikade, 0 stubbar kvar).
  - **Sammanslagningar (2 stubbar borttagna):** c/k-dubbletten Resekera → Resecera (även-stavning); Rektum → täcks redan av publicerade Rectum (som anger "rektum" som svensk form).
  - **Cross-referenser:** RA/Reumatoid, RAST/Allergi, RCA/Koronarkärl, RCT/Randomiserat kontrollerat försök, RR/Relativ risk, RRI/Relativ riskökning, RRR/Relativ riskreduktion, RRT/Dialys, RF/Reumatoid, RIND/TIA, RPGN/Glomerulonefrit, RMR/Basalmetabolism.
  - Forsknings-/statistikbegrepp (Randomisering, RCT, Relativ risk/RR/RRI/RRR, Retrospektiv) bevarade med tolkningsförklaring.
  - **OBS källflagga:** importens råtext angav *Rubeola* = "röda hund" (samma som Rubella). Internationell/latinsk nomenklatur skiljer dem: **Rubella = röda hund**, **Rubeola = mässling**. Berikade enligt den vedertagna åtskillnaden, inte råtexten — bör verifieras.
- APP_VERSION/VERSION → 0.8.14 (cachebusters: glossary.css → 0.8.14, glossary.js → 0.8.14, app.js → 0.8.14). Ordliste- och highscore-data orörd.

## 0.8.13
- **Medicinska ordlistan: bokstaven Q berikad** till fullt husformat. Synliga termer: 3 895 → **3 898** (3 Q-poster berikade: Q-tagg, QCT, QT-intervall; 0 stubbar kvar).
- APP_VERSION/VERSION → 0.8.13 (cachebusters: glossary.css → 0.8.13, glossary.js → 0.8.13, app.js → 0.8.13). Ordliste- och highscore-data orörd.

## 0.8.12
- **Medicinska ordlistan: bokstaven P berikad** till fullt husformat. Synliga termer: 3 446 → **3 895** (449 P-poster berikade, 0 stubbar kvar). Hittills största bokstaven.
  - **Sammanslagningar (15 stubbar borttagna):** th/t-formerna Parathyreoidea→Paratyreoidea, Pneumothorax→Pneumotorax; c/k- och stavningsdubbletter Panniculit→Pannikulit, Pediculos + Pediculosis→Pedikulos, Petechium→Petekium, Pingvekula→Pinguecula, Polynevropati→Polyneuropati, Pyoderma→Pyodermi, Proptosis→Proptos, Paronykion→Paronyki; synonympar Periodontit→Parodontit, Periodontal→Parodontal, Pip→Pip-led; slug-kollisionen Pustulös→Pustulos (pustulös/pustulos ger identiskt ankar-id, adjektivet integrerat i Pustulos-posten).
  - **Rubrik rättad:** Parasympatimimetisk → **Parasympatomimetisk** (felstavning i importen).
  - **Cross-referenser:** PMS/PMDD/PMDS, PCO/PCOS/Polycystiskt ovariesyndrom, PPV/Positivt prediktivt värde, PTH/Paratyreoideahormon, PRL/Prolaktin, PPI/Protonpumpshämmare, PTSD/Posttraumatiskt stressyndrom, PCI/PTCA, Prebiotika/Probiotika m.fl.
  - Forsknings-/statistikbegrepp (P-värde, Power, Prevalens, Publication bias, Positivt prediktivt värde) bevarade med tolkningsförklaring.
- APP_VERSION/VERSION → 0.8.12 (cachebusters: glossary.css → 0.8.12, glossary.js → 0.8.12, app.js → 0.8.12). Ordliste- och highscore-data orörd.

## 0.8.11
- **Medicinska ordlistan: bokstaven O berikad** till fullt husformat. Synliga termer: 3 314 → **3 446** (132 O-poster berikade, 0 stubbar kvar).
  - **Sammanslagningar (2 stubbar borttagna):** c/k-dubbletten Otoscleros → Otoskleros (även-stavning); slug-kollisionen Okular → Okulär (substantivet okular = mikroskopets ögonlins integrerat i Okulär-posten, eftersom okular/okulär annars ger identiskt ankar-id).
  - **Cross-referenser:** OCD ↔ Obsessiv kompulsiv neuros, Ooforektomi ↔ Ovariektomi (äkta synonymer, grek./lat. rot), Opiat → Opioid, Opportunist → Opportunistisk infektion, Ortostatisk → Ortostatisk hypotension.
  - Forsknings-/statistikbegrepp (OR = odds ratio) bevarat med tolkningsförklaring.
- APP_VERSION/VERSION → 0.8.11 (cachebusters: glossary.css → 0.8.11, glossary.js → 0.8.11, app.js → 0.8.11). Ordliste- och highscore-data orörd.

## 0.8.10
- **Medicinska ordlistan: bokstaven N berikad** till fullt husformat. Synliga termer: 3 202 → **3 314** (112 N-poster berikade, 0 stubbar kvar).
  - **Sammanslagningar (5 stubbar borttagna):** ph/f-dubbletterna Nephrolithiasis → Nefrolitiasis, Nephropati → Nefropati och Nephrotoxisk → Nefrotoxisk (alla noterade som "även"-stavning); c/k-dubbletten Nocturnal → Nokturnal (även-stavning); plural Neutrofila granulocyter → Neutrofil granulocyt (singular med pluralform i texten).
  - **Cross-referenser:** NHL ↔ non-Hodgkins lymfom, NPV ↔ Negativt prediktivt värde, NUD ↔ Non-ulcer, NT → PK-INR.
  - Forsknings-/statistikbegrepp (NNT, NNH, NS, NPV, nollhypotes, negativt prediktivt värde) bevarade med formel- och tolkningsförklaring.
- APP_VERSION/VERSION → 0.8.10 (cachebusters: glossary.css → 0.8.10, glossary.js → 0.8.10, app.js → 0.8.10). Ordliste- och highscore-data orörd.

## 0.8.9
- **Medicinska ordlistan: ny ingress och meta-beskrivningar.** Tagline-stycket under rubriken omskrivet till "Medicinska ord, förkortningar och begrepp med definitioner, synonymer och etymologi i en sökbar ordlista. Sök bland tusentals latinska och medicinska anatomiska, fysiologiska, patologiska, biologiska och tekniska termer."
  - `meta name="description"`, `og:description` och `twitter:description` omskrivna i samma anda och **utan termantal** (genereras av `scripts/generate_glossary.py`, rad ~230). `<title>` och sociala titlar behåller antalet tillsvidare.
- APP_VERSION/VERSION → 0.8.9 (cachebusters: glossary.css → 0.8.9, glossary.js → 0.8.9, app.js → 0.8.9). Ordliste- och highscore-data orörd.

## 0.8.8
- **Medicinska ordlistan: bokstaven M berikad** till fullt husformat. Synliga termer: 3 098 → **3 202** (104 M-poster berikade, 0 stubbar kvar).
  - **Sammanslagningar (5 stubbar borttagna):** c/k-dubbletten Makula → täcks av redan publicerade Macula (även-stavning); Megacolon → Megakolon; Menarche → Menarke (försvenskad form); Mesenterial → Mesenteriell (stavningsvariant); Medianvärde → Median (synonym).
  - **Rubriker rättade:** Mamillen → **Mamill** och Metafysen → **Metafys** (grundform i stället för bestämd form); Mandrin/mandräng → **Mandräng** (även-stavning mandrin).
  - **Faktarättning i importtexten:** Makulopati (källtexten angav felaktigt "sjukdomar i hornhinnan" – rättat till sjukdom i gula fläcken/makula, enligt ordets betydelse).
  - Evidens-/statistikbegrepp (MADRS, MAO/MAOH, Mol, Median) bevarade med förklaring.
- APP_VERSION/VERSION → 0.8.8 (cachebusters: glossary.css → 0.8.8, glossary.js → 0.8.8, app.js → 0.8.8). Highscore-datan orörd.

## 0.8.7
- **Medicinska ordlistan: klickbar alfabetsrad** under sökrutan. En klassisk A–Ö-rad (inkl. Å Ä Ö) där varje befintlig bokstav är ett hoppankare till sin bokstavsgrupp; bokstäver utan poster (W, Y, Å, Ä, Ö) visas nedtonade och oklickbara.
  - Förrenderad statiskt av `scripts/generate_glossary.py` (markörer `GENERATED:ALPHABET:START/END`) så den fungerar utan JS och speglar exakt vilka bokstäver som finns i `data/ordlista.json`.
  - `glossary.js` tonar ned bokstäver utan sökträffar i realtid medan man söker.
- **"↑ Topp"-länk i varje bokstavsrubrik** (höger ände) som tar tillbaka till sidans topp. Följer med när rubriken är sticky. Renderas identiskt av både `generate_glossary.py` och `glossary.js`.
- APP_VERSION/VERSION → 0.8.7 (cachebusters: glossary.css → 0.8.7, glossary.js → 0.8.7, app.js → 0.8.7). Ordliste- och highscore-data orörd.

## 0.8.6
- **Medicinska ordlistan: bokstaven L berikad** till fullt husformat. Synliga termer: 2 973 → **3 098** (125 L-poster berikade, 0 stubbar kvar).
  - **Sammanslagningar (5 stubbar borttagna):** stavningsdubbletten Lacrimal → Lakrimal (även-stavning); operationsverbet Laryngektomera → Laryngektomi; Ligering → Ligera (verb/verbalsubst.); Laxantia och Laxerande → Laxans (lat. plural resp. adj.).
  - **Rubriker rättade:** Labia major/minor → **Labia majora/minora** (korrekt latinsk pluralform); Ligamenten → **Ligament** (grundform i stället för bestämd plural).
  - **Faktarättning i importtexten:** Logoped/Logopedi (källtexten hade kastat om person och ämne – nu logoped = vårdgivaren, logopedi = ämnet/läran).
  - Diagnostiska statistikbegrepp (Likelihood ratio, LR) bevarade med formelförklaring; LR korsrefererat mot Likelihood ratio.
- APP_VERSION/VERSION → 0.8.6 (cachebuster app.js → 0.8.6). Highscore-datan orörd.

## 0.8.5
- **Medicinska ordlistan: bokstaven K berikad** till fullt husformat. Synliga termer: 2 807 → **2 973** (166 K-poster berikade, 0 stubbar kvar).
  - **c/k-dubbletter:** 28 k-stubbar togs bort till förmån för redan publicerade c-former (Katarakt→Catarakt, Karcinom→Carcinom, Kolit→Colit, Kolon→Colon, Konjunktivit→Conjunktivit, Koronar→Coronar, Kontusion→Contusion, Kornea→Cornea m.fl.). Sex c-poster som saknade k-formen kompletterades med den (Carpus, Coccyx, Coccygodyni, Choledochus, Cornea, Coitus) så att k-stavningen förblir sökbar.
  - **Sammanslagningar:** -ös-adjektiv infogade i grundordet (karcinomatös→Karcinomatos, kariös→Karies, kavernös→Kavern, komatös→Koma); operationsverben kolecystektomera/kolektomera infogade i substantiven (Kolecystektomi/Kolektomi); stavningsdubbletten Koledokolithiasis borttagen (täcks av Choledocholitiasis).
  - **Faktarättningar i importtexten:** Karbunkel (sammanflytande hårsäcksbölder, ej akne), Kloasma (melasma/graviditetsmask, ej leverfläck), Kommensal (skadar inte värden, ej snyltare), Kataton (även orörlighet/stelhet, ej bara oro).
  - Statistik-/forskningsbegrepp (Konfidensintervall, Kontrollerad studie, Klusterrandomisering, Klinisk signifikant) ramade som forskningsbegrepp.
- APP_VERSION/VERSION → 0.8.5 (cachebuster app.js → 0.8.5). Highscore-datan orörd.

## 0.8.4
- **Medicinska ordlistan: bokstaven J berikad** till fullt husformat. Synliga termer: 2 802 → **2 807** (5 J-poster, 0 stubbar kvar).
  - Berikade: JIA, JRA (korsrefererade som synonyma benämningar på barnreumatism), Jonisera, Jonisering, Juvenil.
- APP_VERSION/VERSION → 0.8.4 (cachebuster app.js → 0.8.4). Highscore-datan orörd.

## 0.8.3
- **Medicinska ordlistan: bokstaven I berikad** till fullt husformat. Synliga termer: 2 604 → **2 802** (238 I-poster, 0 stubbar kvar).
  - Dubbletter/stavning: Icterus → **Ikterus** (svensk stavning). -ös-adjektiv infogade i grundordet i stället för egen post: infektiös → Infektion, intertriginös → Intertrigo.
  - **-ös-glosor skärpta:** infektiös och eksematös fick egna, distinkta betydelseförklaringar i stället för att likställas med grundordet (infektiös = orsakad av/har samband med infektion, av infektionskaraktär; även smittsam — eksematös = av eksemkaraktär).
- **Återställning efter trasig redigeringssession:** `medicinskordlista.html` hade fått sin kropp raderad (blank sida) och länkarna i index.html/sitemap.xml pekade på det gamla filnamnet `medicinskterminologi.html` (404). Sidan återställd från `0.8.2`, länkar rättade, I-berikningen återvunnen ur backup. Se BUG_REPORT_ASSISTANT.md.
- APP_VERSION/VERSION → 0.8.3 (cachebuster app.js → 0.8.3). Highscore-datan orörd.

## 0.8.2
- **Medicinska ordlistan: bokstäverna G och H berikade** till fullt husformat. Synliga termer: 2 291 → **2 604**.
  - G: 86 poster berikade; 2 dubbletter sammanslagna (Granulomatös→Granulom, Glykosuri→Glukosuri) och 2 icke-termer borttagna ("Grupp 1"/"Grupp 2", som var resvaccinationskategorier, inte uppslagsord).
  - H: 227 poster berikade; 4 dubbletter sammanslagna (Hemorroid→Hemorrojd, Hidroadenit→Hidrosadenit, Hodgkins sjukdom→Hodgkins lymfom, Hyperhidrosis→Hyperhidros); 3 rubriker rättade (Heberdenska→Heberdens knutor, Horner→Horners syndrom, Hip Harris Score→Harris Hip Score).
  - Städning av trasiga/dubblerade källtexter (bl.a. Hjärtblock, Hyperhidros) och hyper-/hypo-par korsrefererade med sina motsatser.
- APP_VERSION/VERSION → 0.8.2 (cachebuster app.js → 0.8.2). Highscore-datan orörd.

## 0.8.1
- **Medicinska ordlistan: bokstäverna E och F berikade** till fullt husformat. Synliga termer: 1 967 → **2 291**.
  - E: 202 poster berikade; 1 inskrapad skräppost ("Enter words…") och 5 stavnings-/-ös-dubbletter borttagna (Eksematös→Eksem, Erytematös→Erytem, Eclampsi→Eklampsi, Encephalit→Encefalit, Evakuation→Evakuering).
  - F: 122 poster berikade; 5 dubbletter sammanslagna (Fibrös→Fibros, Fallots syndrom→Fallots tetrad, Fixation→Fixering, Fotosensitivitet→Fotosensibilitet, Fekalier→Feces); rättat stavfel i rubrik (Falska postitiva → Falska positiva).
  - Faktagranskning: rättat bl.a. Erytrofobi (rädsla för att rodna, ej erytrodermi), Eskarotomi (≠ fasciotomi), Falang (ben, ej led), Femurfraktur (lårbensbrott).
- APP_VERSION/VERSION → 0.8.1 (cachebuster app.js → 0.8.1). Highscore-datan orörd.

## 0.8.0
- **Stor utbyggnad av den medicinska ordlistan** mot målet att täcka all medicinsk terminologi på svenska. En omfattande lista med medicinska termer (3 965 st) har importerats och de som saknades i `data/ordlista.json` lades in. Ordlistan berikas sedan bokstav för bokstav till fullt husformat (definition, ordklass, böjning, Sv/Eng/lekmannasvenska, etymologi).
  - **Berikat och publicerat: A, B, C, D.** Synliga termer i ordlistan: 1 081 → **1 967**.
  - **Stub-arkitektur:** ännu ej berikade poster ligger i `ordlista.json` med `"status": "stub"` (3 754 nya importerades; 2 859 kvarstår som stubs E–Ö). Stubbar **döljs live** — både `scripts/generate_glossary.py` och `js/glossary.js` (`loadTerms`) filtrerar bort `status === "stub"`, så ofärdiga poster aldrig syns eller indexeras. Den renderade `medicinskordlista.html` förblev byte-identisk fram tills första bokstaven berikades.
  - **-ös-regel:** medicinska -ös-adjektiv (adenomatös, cancerös …) ges ingen egen post utan integreras i grundordet med "även …" (löser även slug-kollisioner då ö foldas till o).
  - **c/k-stavningsdubbletter:** grekisk-härledda ord (Catarakt/Katarakt, Cardio-/Kardio-, Cholecystit/Kolecystit …) berikas under c-formen med not "även k-form"; k-dubbletterna tas bort när K m.fl. berikas.
  - **Faktagranskning:** rättat flera fel i den importerade källtexten, bl.a. bakteriostatisk (tillväxthämmande, ej dödande), brachycefali (kort/brett huvud, ej litet), cervixprolaps (livmoderhalsframfall, ej diskbråck), dopaminagonist (stimulerar receptorn), BMD (bone mineral density), bäcken (pelvis); samt rättade stavfel och markerade föråldrade/icke-medicinska termer.
- **Ny dokumentation:** `ORDLISTA.md` (syfte, datamodell, arbetsgång, c/k- och -ös-regler) + länk i `README.md`. `data/ordlista_import_raw.json` sparad som råimport/backup (redigeras ej).
- Cachebustrar bumpade för ändrade filer (app.js och glossary.js → 0.8.0); CSS oförändrad. APP_VERSION/VERSION → 0.8.0.
- Highscore-datan i localStorage är orörd.

## 0.7.1
- **PageSpeed Insights-åtgärder (Tillgänglighet + Best practices)**, utan synlig designändring:
  - **Kontrast (WCAG AA, 4,5:1):** all grön TEXT på ljus bakgrund mörkad till `--primary-deep` #047857 (5,5:1 mot vitt). Tidigare användes `--primary` #10b981 (2,2:1) och `--primary-dark` #059669 (3,8:1) — båda underkända. Gäller bl.a. sekundärknapparnas text (Info/Topplista/Inställningar m.fl.), länkar i Om-texten (`.intro a`), versionsnumret i sidhuvudet, brödsmulelänkar, badges, topplistans procent, flashcardens "SVAR"-etikett/svarstext, case-taggar och fotnotskod. Hover-tillstånd för länkar → `--primary-deepest` #065f46. Kantlinjer/accent-färger (icke-text) orörda, så utseendet är nästan identiskt.
  - **Konsol-404:an borta:** `init()` i app.js anropade `loadQuestions()` UTAN sökväg → `fetch(undefined)` gav `GET /anatomiquiz/undefined` 404 + fellogg vid varje sidladdning. Förladdningen var dessutom meningslös (frågorna laddas alltid om med rätt sökväg när quiz/flashcards startas) och fyllde bara `allQuestions` med placeholders. Anropet borttaget.
  - **CSP mot XSS:** `<meta http-equiv="Content-Security-Policy">` på alla fyra sidorna: `default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'`. Säkert eftersom sajten saknar inline-skript/-stilar och externa resurser (JSON-LD-block är data, inte körbara, och påverkas inte). Verifierat i headless Chrome: inga CSP-blockeringar på någon sida.
  - **Kan INTE fixas på GitHub Pages** (kräver HTTP-svarshuvuden, som GitHub Pages inte låter en sätta; meta-taggar räcker inte): HSTS-policy, COOP, X-Frame-Options/`frame-ancestors` (clickjacking). Trusted Types hoppades över medvetet — appen renderar via `innerHTML` och skulle gå sönder utan större refaktorering.
- Cachebustrar (styles.css/app.js/case.js → 0.7.1) och APP_VERSION bumpade till 0.7.1.
- Highscore-datan i localStorage är orörd.

## 0.7.0
- **Tillgänglighets- och SEO-genomgång av hela webbplatsen** (alla fyra sidor + CSS + app.js):
  - **Timern tystad för skärmläsare:** `#timer`/`#fcTimer` hade `aria-live="polite"` och uppdateras varje sekund → skärmläsare läste upp "Tid: 1 s, 2 s, 3 s…" oavbrutet. Nu `role="timer"` (tyst). Sektionsövergripande `aria-live` på `#quiz` och `#flashcards` borttagen av samma skäl (timern ligger i sektionerna); `#fcQuestion` fick egen `aria-live="polite"` så nya kort fortfarande annonseras.
  - **Rätt/fel förmedlas inte längre med enbart färg (WCAG 1.4.1):** besvarade svarsknappar får ✓/✗-ikon + dold skärmläsartext ("rätt svar"/"fel svar") via ny `markAnswerBtn()`. Felaktiga `aria-pressed`/`role="button"` på svarsknapparna borttagna; `role="list"` på `#answers` borttagen (ogiltig utan listitem-barn).
  - **Kontrast (WCAG AA):** primärknapparnas gradient mörkad (`--primary-deep` #047857 → `--primary-deepest` #065f46; vit text ≥ 4,5:1), rätt-svar-grönt #10b981 → #047857, `--error` #ef4444 → #dc2626 (vit/på vit text klarar AA).
  - **Synliga fokusringar:** `:focus-visible` med solid 3px-outline på knappar, svarsknappar, input och select (ersätter knappt synliga 10–20 %-skuggor); accentknapparna får teal-ring. Visas bara vid tangentbordsfokus.
  - **SEO — riktiga länkar:** Info/Case/Ordlista-knapparna på startsidan var `<button onclick>` (ofollowbara för sökmotorer) → nu `<a class="btn">`; ger crawlbara interna länkar och öppna-i-ny-flik.
  - **Övrigt:** `hasPart.url` i JSON-LD nu absolut URL; `meta keywords` borttagen på alla sidor (ignoreras sedan 2009); `apple-touch-icon` → icon-192.png (Apple kräver ≥180px); meningslös `preload` av CSS borttagen; `#topicLegend`-inline-stil flyttad till CSS-klass och kopplad till ämnesväljaren via `aria-describedby`.
- Cachebustrar (CSS nu enhetligt 0.7.0 på alla sidor — låg kvar på 0.6.11 på undersidorna) och APP_VERSION bumpade till 0.7.0.
- Highscore-datan i localStorage är orörd.

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
