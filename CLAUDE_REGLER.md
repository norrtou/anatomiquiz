# Anatomiquiz - Instruktioner och Regler för Claude

## Övergripande Princip
Detta dokument definierar ALLA regler och instruktioner för att bygga och underhålla anatomiquiz-databasen. Dessa regler gäller för ALL arbete på projektet - nuvarande och framtida ämnen/tillägg. Följ ALLTID dessa regler utan undantag.

> **Webb / SEO / kod:** Allt som rör HTML, `<head>`, titlar, descriptions, sitemap, llms.txt,
> CSS, JSON-LD, tillgänglighet, prestanda och agenter styrs av **[`SEO_REGLER.md`](SEO_REGLER.md)**.
> Läs och följ den **innan** du rör någon sida, och bocka av dess pre-flight-checklista före commit.
> CLAUDE_REGLER täcker innehåll/quiz/JSON; SEO_REGLER täcker koden runt omkring. Båda är bindande.

---

## 0. ÖVERORDNAD REGEL: ALLA REGLER SKA VARA PROAKTIVA

**Denna regel står över alla andra och gäller varje regeldokument i repot** — CLAUDE_REGLER,
SEO_REGLER, ARTIKLAR_REGLER, UTBILDNINGAR_REGLER, ORDLISTA, BILDER_REGLER, CSS_KARTA.

En regel ska tala om **hur något skrivs rätt från början**. Den får inte nöja sig med att
beskriva hur man hittar och rättar felet efteråt.

**Varför:** korrektur kostar användarens pengar, inte mina. Ett fel som skrivs in och rättas
i ett senare svep har kostat två gånger: en gång att skriva, en gång att sanera — plus
genomläsningen som krävdes för att hitta det. Reaktiva regler producerar återkommande
saneringssvep (tooltips, FAQ, formtells, parentesstrippning). Det är inte ett arbetssätt,
det är en löpande kostnad.

**Så här skrivs en regel:**

1. **Börja med mallen, inte med förbudet.** Först "så här ser en korrekt X ut" med ett
   verkligt exempel. Förbudslistan är ett komplement, aldrig hela regeln.
2. **Placera regeln där arbetet utförs**, inte i ett kontrollavsnitt. En regel om
   definitionstext hör i avsnittet om att skriva definitioner — inte i pre-flight-checklistan.
3. **"Kontrollera att…" är en varningssignal.** Om regeln bara går att formulera som en
   kontroll: fråga först om felet kan göras *omöjligt* i stället. Kontrollen får finnas kvar
   som skyddsnät, men den ersätter inte den proaktiva formuleringen.
4. **Rekommendationer duger inte.** "Generera hellre blocket ur HTML" blir inte gjort.
   Skriv "blocket SKA genereras ur HTML; handskrivet block är ett regelbrott".

**Om ett verktyg jag byggt tvingar fram reaktivt arbete ska verktyget byggas om.**
Detta är inte förhandlingsbart och får aldrig motivera en reaktiv regel. Att ett skript är
idempotent, bara fångar kända mönster, eller inte propagerar en ändring vidare är ett fel i
skriptet — inte ett skäl att lägga bördan på manuell efterkontroll. Bygg om det så att
felet inte kan uppstå: validera indata vid källan, låt ändringar slå igenom automatiskt,
och låt skriptet **vägra** skriva något som bryter mot regeln.

**Nya upptäckter ska in i regeldokument, inte bara i minnet.** Minnet är kopian, dokumentet
är originalet — se §5.6. Och den nya regeln ska formuleras proaktivt enligt punkt 1–4 ovan;
en ny reaktiv regel är inte ett fullgjort arbete.

**Undantag:** när ett fel bevisligen inte går att förebygga vid skrivtillfället — då, och
bara då, får regeln vara en kontroll. Skriv i så fall ut *varför* förebyggande inte är
möjligt, så att antagandet kan omprövas. Att förebyggande är "svårare" eller "kräver att jag
bygger om ett skript" är inte ett giltigt skäl.

### 0.1 Verifiera mot HELA facit — aldrig mot din egen ändringslista

När en kontroll ändå körs ska den gå över **hela datamängden** och för varje post fråga
*"stämmer detta mot facit?"* — aldrig över diffen och fråga *"blev min ändring gjord?"*.

Ändringslistan är min egen bild av vad jag gjorde. Att mäta mot den bekräftar bara att jag
gjorde det jag trodde att jag gjorde; poster som ändringen aldrig nådde är per definition
osynliga för den. I 0.9.237 rapporterades "0 avvikelser" samtidigt som två länkar bar kvar
gammal text — kontrollen loopade över de 258 ändrade nycklarna, och de två förekomsterna låg
utanför. Felet gick med i commiten och hittades först när kontrollen kördes mot samtliga
7713 länkar.

Skriv alltid ut antalet avvikelser explicit, även när det är noll — en kontroll som är tyst
både när allt är rätt och när den inte tittade på något är värdelös.

### 0.2 En feltyp har oftast flera ytformer — leta efter alla innan du säger "klart"

Hittar du ett fel: anta att samma defekt finns i minst en form till, och sök efter den
**innan** du rapporterar filen ren. Varje svep som jagar den form som råkade upptäckas först
kommer att rapportera "0 kvar" med orätta.

Tooltipskulden fanns i fyra former — `def == nyckeln`, nyckeln böjd, enbart latinnamnet, och
nyckeln som ett kommaled bland synonymer. Skulden beskrevs som "~146" utifrån ett
`def == nyckel`-test; den var 338. Filtret som letade i 0.9.237 hoppade dessutom över alla
definitioner med komma — vilket var exakt den form den fjärde defekten hade.

**Praktiskt:** när ett filter utesluter något (`if ',' in x: continue`), fråga vad som göms
i det som uteslöts. Läs ett stickprov ur det bortfiltrerade, inte bara ur träffarna.
Se även §2.14 (begärd kontroll ska vara manuell) och §5.6.

### 0.3 Går det inte att automatisera säkert — SKRIV DET FÖR HAND

**Om en text, kod, funktion, quizfråga, definition eller applikationsdel inte kan skrivas
maskinellt utan uppenbar risk att den blir fel eller slarvig, ska den alltid skrivas för
hand av Claude.** Detta gäller allt innehåll i projektet, inte bara quiz och artiklar.

**Varför:** ett skript som "nästan" klarar uppgiften producerar innehåll som ser färdigt ut
men måste korrekturläsas rad för rad — och korrekturet kostar mer än handskrivandet hade
gjort, eftersom det kräver att varje post läses ändå, fast nu med ett felaktigt utgångsläge
att reda ut. Automatisering får aldrig väljas för att den är bekvämare för mig; den ska
väljas för att den bevisligen ger rätt resultat.

**Så här avgörs det — innan en rad kod skrivs:**

1. **Kan regeln uttryckas exakt?** "Byt sträng A mot sträng B", "sätt `data-def` till
   facits värde", "bumpa versionsnumret" — mekaniska, entydiga, säkra att automatisera.
   **Och då SKA de automatiseras.** En mekanisk uppgift som görs för hand blir förr eller
   senare halvgjord: versionsbumpen kräver tre samtidiga redigeringar och blev partiell i
   fyra släpp i rad (0.9.237–0.9.240) tills `scripts/bump_version.py` gjorde den till en
   operation. Samma sak med `wire_terms.py --sync-defs`. Är uppgiften mekanisk och
   återkommande: bygg verktyget, kör aldrig för hand.
2. **Kräver den omdöme?** Formulera en definition, välja distraktorer, avgöra vad en term
   *betyder*, bedöma om en mening är pedagogisk, veta att stigbygeln sitter i mellanörat —
   då är svaret handskrivet. Ett skript som gissar ur mönster gissar fel någonstans, och
   du vet inte var förrän du läst allt.
3. **Delvis automatiserbart?** Låt skriptet göra det mekaniska (hitta posterna, hämta
   källtexten, applicera ändringen, verifiera resultatet) och skriv **innehållet** för hand.
   Det var så de 338 tooltip-definitionerna gjordes rätt: skript för att hitta och
   propagera, mänsklig formulering av varje enskild text.

**Verkliga fall som motiverar regeln:** en mekanisk omklippning av ordlistedefinitioner
tappade den psykiatriska betydelsen ur `depression` och abduktorsvagheten ur `Trendelenburg`.
Parentes-strippningen 2026-07-14 skadade 22 filer och krävde granskning mot git commit för
commit. Båda var automatiseringar av något som krävde omdöme.

**Gränsdragningen mot §0:** §0 säger att ett verktyg som tvingar fram korrektur ska byggas
om. Den här regeln säger när verktyget inte ska byggas alls. Kan uppgiften inte göras säkert
maskinellt är rätt åtgärd att skriva för hand — inte att bygga ett skript med sämre omdöme
än mitt eget och sedan städa efter det.

**Detta är inte en ursäkt för att hoppa över automatisering som fungerar.** Mekaniska,
verifierbara operationer ska automatiseras — de är snabbare, billigare och mer konsekventa
än handarbete. Regeln gäller uppgifter som kräver omdöme, inte uppgifter som är tråkiga.

### 0.4 Ett skript som tyst hoppar över det okända är en framtida bugg

**Varje skript som bearbetar en mängd filer eller poster SKA stanna med exitkod 1 när det
inte hittade det det letade efter.** "Hittade inget att göra här" får aldrig se likadant ut
som "det fanns inget att göra här".

**Varför:** ett skript som filtrerar på en lista över kända fall — kända `@type`, kända
mönster, kända filnamn — behandlar allt utanför listan som *ingenting*. Det ser ut som en
lyckad körning. Felet upptäcks bara om någon råkar titta på rätt sak, och det gör ingen
nästa gång. `wire_identity.py` saknade `WebPage` i sin typlista och hoppade tyst över två
sidor; det syntes bara för att listan över sidor utan träff råkade skrivas ut under bygget.
Samma sorts tystnad är hela orsaken till att generatordriften i 0.9.266 kunde växa ostört.

**Så här byggs det rätt från början:**

1. **Räkna träffarna och kräv minst en.** Varje fil som skriptet öppnar ska producera minst
   en träff, annars `raise`. Är noll träffar ett legitimt utfall för vissa filer ska de
   filtreras bort **innan** — i urvalet — inte tyst passera i bearbetningen.
2. **Felmeddelandet ska säga vad som fanns i stället.** Inte "ingen träff", utan "sidans
   typer: BreadcrumbList, WebPage — hör någon av dem hemma i HUVUDTYPER?". Ett meddelande
   som inte pekar på nästa steg tvingar fram samma utredning en gång till.
3. **Testa larmet, inte bara lyckofallet.** Ta bort ett känt värde ur listan, kör, och
   verifiera att skriptet stannar. Ett larm som aldrig utlösts är inte verifierat.
4. **Lägg skriptet i `scripts/check_generators.py`.** Ett larm som ingen kör är inget skydd.

**Gränsdragningen mot §0.1:** §0.1 säger att en kontroll ska gå över hela facit. Den här
regeln säger att skriptet ska veta när facit innehöll något det inte förstod. En körning
över hela datamängden som tyst ignorerar en fjärdedel av den är inte en helvägskontroll.

### 0.5 SE PÅ SIDAN INNAN DU LÄGGER NÅGOT SYNLIGT PÅ DEN

**STÅENDE REGEL (2026-07-26).** Allt som blir synligt för en besökare — en rad, en ruta, en
knapp, en etikett, en ikon — ska placeras och formges **innan** det skrivs in, inte upptäckas
i efterhand. Att märkningen är korrekt och skriptet idempotent betyder ingenting om resultatet
ser ut som något som blivit över.

**Bakgrunden:** i 0.9.271 lades ansvarsfriskrivningen in som ett löst `<p>` "sist i `<main>`".
Tekniskt rätt plats, estetiskt fel: på varje sida hamnade den *under* det som visuellt
avslutar sidan — knappraden på kunskapsbankssidorna, tillbakaknapparna i ordlistan, och på
startsidan under sajtens egen sidfot. Två grå stycken efter sidans avslut. Det fick byggas om
i 0.9.272, och det var ett onödigt varv som kostade användaren tokens.

**Så här görs det rätt från början — fyra frågor innan en enda rad skrivs:**

1. **Var slutar sidan visuellt?** Läs de sista 20 raderna i `<main>` på **varje** sidtyp som
   berörs, inte på en. Anatomiquiz har minst tre olika avslut: `.actions`-knapprad (79 sidor),
   ordlistans `.glossary-footer` med tillbakaknappar (33), och `index.html`. Ett element som
   ser rätt ut på en av dem kan se ut som skräp på de andra två.
2. **Hör det nya ihop med något som redan finns?** Finstilt hör ihop med finstilt. Låg det en
   kakrad och en datumrad där redan, är svaret ett **block**, inte ett tredje löst stycke.
   Fråga alltid: kan det här bakas ihop med något befintligt i stället för att läggas bredvid?
3. **Vilken befintlig form ska det ärva?** Återanvänd en form som redan finns på sajten
   (`.footer`, `.kb-sources`) i stället för att uppfinna en ny. Se `CSS_KARTA.md`.
4. **Vad tar det uppmärksamhet från?** Metadata ska kunna hittas av den som söker den och
   annars vara tyst. **Ingen fetstil i sidfoten eller i annan finstilt** — betoning i
   metadata konkurrerar med innehållet.

**Regeln gäller också omfattningen.** Nytt synligt innehåll införs bara i den utsträckning
uppgiften kräver. Ser du något annat som skulle kunna se bättre ut — **säg det, bygg det
inte.** Sidans utseende är användarens beslut, inte en sidoeffekt av en teknisk uppgift.

Formen för sidans finstilta är avgjord och ska återanvändas: se **SEO_REGLER §6e** (sidfoten)
och `CSS_KARTA.md`.

---

## 1. SPRÅK OCH TERMINOLOGI

### 1.1 Swedish Medical Latin (Terminologia Anatomica)
- **ALLTID** använd korrekt Swedish Medical Latin enligt Terminologia Anatomica
- INTE engelska eller amerikanska medicinska termer
- **EXEMPEL PÅ KORREKT:**
  - clavicula (INTE clavicle)
  - maxilla (INTE os maxillaris)
  - humerus (INTE arm bone)
  - femur (INTE thighbone)
  - fibula (INTE smaller calf bone)

- **⚠️ Påhittat `os`-prefix – de flesta bennamn bär INTE "os" (hittat 2026-07-20 i arbetsterapeut).**
  `os` hör till namnet bara när Terminologia Anatomica har det där. Att sätta dit det "för att
  det låter latinskt" ger en term som inte existerar, och den sprider sig till distraktorerna.
  - **FEL:** os femur, os tibia, os fibula, os humerus, os radius, os ulna, os patella,
    os mandibula, os maxilla/os maxillaris, os clavicula, os scapula, os sternum.
  - **RÄTT:** femur, tibia, fibula, humerus, radius, ulna, patella, mandibula, maxilla,
    clavicula, scapula, sternum.
  - **`os` hör till namnet i bl.a.:** os frontale, os parietale, os temporale, os occipitale,
    os sphenoidale, os ethmoidale, os nasale, os zygomaticum, os hyoideum, os sacrum,
    os coccygis, os coxae, os ilium, os ischii, os pubis, handrots-/fotrotsbenen
    (os scaphoideum, os lunatum, os pisiforme, os capitatum, os naviculare, os cuboideum …)
    samt bentyperna (os longum, os breve, os planum, os irregulare) och ossa-pluralerna
    (ossa carpi, ossa metacarpi, ossa tarsi, ossa metatarsi).
  - Verkliga fynd: `ben.json` q3/q5/q6/q7/q11/q13/q377 ("Os mandibula", "Os maxilla"),
    `tentaplugg.json` studier_q59/q60/q97/q292/q293 ("os femur", "Os tibia", "os patella", "Os ulna").
  - **Dubbel skada:** felet skapar dessutom en språkparitets-tell (§2.9) när `correct` står naket
    ("Maxilla") bland os-prefixade distraktorer – då pekar formen ut svaret.
  - **Test:** `grep -rn -oi "os \(femur\|tibia\|fibula\|humerus\|radius\|ulna\|patella\|mandibula\|maxilla\|clavicula\|scapula\|sternum\|vertebra\|costa\|calcaneus\|talus\)\b" data/*.json`

### 1.2 Svenska Benämningar
- Använd etablerade svenska namn när de finns
- Exempel: lårbenet (femur), överarmsben (humerus), armbågsknotan (olecranon)
- **ALDRIG** hittepånamn eller made-up termer
  - INTE: "strålbent fiberflexor", "kort tumflexor"
  - INTE fabricerade svenska varianter

### 1.3 Grammatik och Böjning
- ALL Svenska måste ha korrekt grammatik
- Korrekt verbböjning, artiklar, prepositioner
- **EXEMPEL PÅ INKORREKT:**
  - "Vilken muskel adduktion?" → **KORRIGERA TIL:** "Vilken muskel adducerar?"
  - "Vilken muskel flexion?" → **KORRIGERA TIL:** "Vilken muskel flekterar?"
- Ingen förkortad eller telegrafisk stil i frågor

### 1.4 Stavning
- Korrekt stavning av svenska ord
- **EXEMPEL:**
  - handrotsben (INTE handrötsben)
  - fotrotsben (INTE fotrötsben)
- Verifieras noga

### 1.5 Korrekt OCH pedagogisk svenska (gäller ALLT innehåll)
Gäller frågor, svar, faktatexter, tabeller, ingresser och kort – inte bara faktan utan språket.
- **Räknebarhet:** många medicinska ord är oräknebara – säg inte "en känsel". Använd *känselintryck/känselsignal/sinnesintryck*.
- **Rätt fackterm:** t.ex. *senorgan*, inte "senspole".
- **Entydig syftning:** "den/det" ska syfta entydigt; undvik staplade substantiv och kanslisvenska.
- **Läs igenom hela texten kritiskt före commit** – läs "högt i huvudet"; låter en formulering konstig är den det. Faktagranskning räcker inte – språket måste också vara rätt.

---

## 2. FRÅGEKONSTRUKTION - LOGIK OCH STRUKTUR

### 2.1 Grundläggande Regel för Alternativ
**ALLA alternativ måste ALLTID vara semantiskt relevanta för frågan.**

En fråga utan relevanta alternativ är värdelös och förstör quizet. Inga filler-alternativ.

### 2.2 Förbjudna Alternativtyper
- **ALDRIG:** "Annat ben", "Ingen av dessa", "Annan struktur", "Inget alternativ"
- **ALDRIG:** Helt irrelevanta ord för att fylla ut ("Patientens skostorlek", "Patientens favoritfärg")
- Alla alternativ måste kunna motiveras med "detta är också ett ben/en muskel/en riktning"
- **ALDRIG självutpekande distraktorer.** En distraktor får inte skylta med att den är fel. Den ska läsas som ett trovärdigt svar, inte som en markerad felaktighet. Skräckexempel funna 2026-07-14 i röntgenfilen:
  - `"Ductus thoracicus, en helt annan struktur"` – "en (helt) annan struktur/nerv/gren" talar om att alternativet är fel.
  - `"Right Posterior Orientation, en påhittad benämning"` – erkänner öppet att den är påhittad.
  - `"MR kan inte visa någon blödning över huvud taget, vilket är felaktigt"` – dömer ut sig själv i samma mening.
  - `"Levern, inte pankreas"` / `"Mjälten, inte pankreas"` (`rtg_buk_retroperitoneum_5`) – **alla tre distraktorerna namngav rätt svar.** Negera aldrig en distraktor med rätt svarets egna nyckelord.
- **ALDRIG kontextberoende frågetext.** Frågorna blandas – en prompt får aldrig syfta på föregående fråga ("det motsatta läget", "samma klassificering", "motsvarande felställning", "dessa två ligament"). Varje fråga ska stå för sig själv.

### 2.3 Multiple Choice (MC) Struktur
**Format:** 1 korrekt svar + 1-3 distraktorer (TOTALT 2-4 alternativ efter behov)

- MC-frågor MÅSTE ha 2-4 alternativ totalt
  - Minst 2 alternativ (1 correct + 1 distractor)
  - Max 4 alternativ (1 correct + 3 distractors)
  - Använd det antal som är logiskt för frågan
- 1 = korrekt svar
- 1-3 = semantiskt relevanta distractors
- **INGEN FRÅGA får ha:**
  - 1 alternativ (måste ha minst 2 totalt)
  - Duplikat (samma svar både i "correct" och i "distractors")
  - Filler-ord

### 2.4 True/False Format
- Max 2 svarsalternativ: "Sant" och "Falskt"
- Kan användas sparsamt för vissa faktapåstående

**⚠️ TF-SKEVHET ÄR EN FORMTELL – BALANSERA SANT/FALSKT PER ÄMNE (hittat 2026-07-20 i arbetsterapeut).**
Skrivs TF-frågor genom att formulera sanna påståenden blir nästan alla svar "Sant". Då kan en
student svara "Sant" rakt igenom och få nära full poäng utan ett uns ämneskunskap – exakt samma
sorts läcka som längdbias, fast på svarsfördelningen i stället för på alternativens form.

- **Verkligt utfall:** arbetsterapeutens 946 TF-frågor låg på **84 % "Sant"**; `muskler_funktion`
  44/44, `handen_samling_fakta` 38/38, `osteologi_verify` 20/20, `grepp` 97 %, `handen` 94 %.
  321 prompts fick skrivas om i efterhand.
- **Mål: 40–60 % "Sant" i varje ämne** med ≥8 TF-frågor. Kontrollera per ämne, inte per fil –
  en balanserad fil kan bestå av ett 100 %-ämne och ett 0 %-ämne.
- **Så görs en fråga falsk (§2.12-mönstret): byt ut EN sak mot ett konkret fel** – fel nerv
  (`M. opponens pollicis innerveras av N. ulnaris`), fel rad (`Os hamatum är ett tarsalben`),
  fel riktning (`Distal betyder närmast bålen`), fel tal (`Det finns 8 halskotor`).
  **Sätt ALDRIG bara in "inte"** i den sanna meningen – det ger en tillgjord mening som avslöjar
  sig själv, och det testar ingen kunskap.
- **⚠️ Kollisionsfällan:** en vänd fråga blir lätt ordagrant identisk med en *redan befintlig*
  falsk fråga i samma ämne → blockerande dubblettfel. Det hände i fyra frågor 2026-07-20
  (`nervsystemet_q27`, `nervsystemet_q45`, `riktningar q136`, `blodomloppet_q13`). Läs ämnets
  befintliga Falskt-frågor innan du vänder, och kör validatorn efter patchen.
- **Test:** räkna andelen `correct == "Sant"` per `topic` över alla TF-frågor i filen.
  Validatorn kollar det inte – gör mätningen själv.

**⚠️ EN TF-FRÅGA MÅSTE HA `"type": "tf"` – annars dras den aldrig (hittat 2026-07-20).**
62 frågor (59 i `tentaplugg.json`, 3 i `handen.json`) hade Sant/Falskt som enda alternativ men
stod som `"type": "mc"`. `js/app.js` bygger urvalet av två pooler: `tfPool` kräver `type === 'tf'`
och `mcPool` kräver `type === 'mc'` **med 3–5 alternativ**. En tvåalternativsfråga märkt `mc`
hamnar i ingendera och plockas bara upp av nödfallssamplingen när poolerna inte räcker – i
praktiken drogs de aldrig, och de kringgick TF-takets 10 %-gräns. De förorenade dessutom
längdbias-mätningen ("Falskt" är 2 tecken längre än "Sant" → falsk 100 %-varning).
- Validatorn flaggar detta som **fel** sedan 2026-07-20.
- Kvarstår i `medicinsk_sekreterare.json` (3 frågor) – ej åtgärdat, annan utbildning.

### 2.5 Namnfrågor
- **Alternativ måste vara:** Andra namn i samma kategori
- **EXEMPEL KORREKT:**
  - Fråga: "Vad är lateinamnet för lårbenet?"
  - Alternativ: femur (korrekt), humerus, tibia, fibula (andra bennamn)
  
- **EXEMPEL FELAKTIGT:**
  - Fråga: "Vad är den svenska benämningen på Flexor carpi ulnaris?"
  - Problem: Denna muskel använder sitt latinnamn även i Svenska - det finns INGET olika svenskt namn
  - Lösning: RADERA DENNA FRÅGA
  
- **REGEL:** Om inget helt olika namn finns (på svenska eller latin) - FRÅGA ALDRIG om namnet

### 2.6 Rörelsefrågor
- **Alternativ måste vara:** Andra muskler som utför SAMMA rörelse
- **EXEMPEL KORREKT:**
  - Fråga: "Vilken muskel flekterar armen i armbågsleden?"
  - Alternativ: Biceps brachii (korrekt), Brachialis, Brachioradialis, Pronator teres (alla flekterar armen)

- **ALDRIG:** Muskler som gör en helt annan rörelse

### 2.7 Klassificerings- och Kategorifrågor
- **Alternativ måste vara:** Giltiga klassificeringsalternativ eller andra strukturer i samma kategori
- **EXEMPEL KORREKT (Extrinsisk/Intrinsisk):**
  - Fråga: "Är detta en extrinsisk eller intrinsisk muskel?"
  - Alternativ: Extrinsisk, Intrinsisk
- **EXEMPEL KORREKT (Bentyp):**
  - Fråga: "Vilken typ av ben är femur?"
  - Alternativ: Långben, Kortben, Platt ben, Oregelbundet ben (alla giltiga bentyper)

### 2.8 Ligament- och Struktur-frågor
- Alla alternativ MÅSTE vara faktiskt befintliga ligament, senor, eller strukturer
- Kan ta alternativ från andra kroppdelar om de är korrekta strukturer
- **EXEMPEL:**
  - Fråga: "Vilka ligament är viktiga för knäledstabilitet?"
  - Alternativ: ACL, PCL, MCL, LCL (korrekta knäligament) PLUS andra ligament från kroppen (validering)

### 2.9 SVARSALTERNATIVENS FORM FÅR ALDRIG AVSLÖJA SVARET
**KRITISKT.** Formen på alternativen (inte bara innehållet) får aldrig läcka vilket som är rätt. Gäller ALLA quiz (MC/TF), nuvarande och framtida ämnen.

- **Längdparitet – ingen längdbias:** Rätt svar får INTE systematiskt vara det längsta eller mest detaljerade alternativet. Distraktorerna ska vara ungefär lika långa och lika utförliga som rätt svar.
  - Vanligt fel: rätt svar skrivs som ett långt, nyanserat påstående medan distraktorerna är korta, absoluta "fel" ("alltid/aldrig/enbart"). Det gör att man kan gissa rätt på längden.
  - **⛔ TECKENANTAL ÄR INTE TELLEN – UTFÖRLIGHET ÄR DET (påtalat 2026-07-20).** Att ett enstaka ord råkar vara längre än de andra är **aldrig** en tell. `cartilágo` mot `abdómen`/`génu`/`fíbula` är fyra nakna latinska substantiv; ordlängden är godtycklig, bär ingen information och går inte att gissa på. Tellen uppstår när `correct` är en **utbyggd förklaring** och distraktorerna korta etiketter – alltså en asymmetri i omsorg och detaljnivå, inte i tecken. Den förutsätter flerordssvar.
    - **Konkret miss att inte upprepa:** vid dubblettstädningen av `medicinsk_terminologi.json` poängsattes frågepar med "facit är längst = 2 straffpoäng" rakt av. Av 233 par hade 190 enordssvar där måttet var rent brus, och 15 par fick därmed **fel** fråga bevarad. Urvalet fick byggas om från backup.
    - **Följd för mätningen:** räkna bara frågor där minst ett alternativ är flerords. `validate_quiz.py` gör det sedan 2026-07-20 (`matbara` + `LEN_BIAS_MIN_N`), och exkluderar dessutom ämnen med färre än 10 mätbara frågor eftersom "2 av 4 = 50 %" är slump.
    - ⛔ **De 9 befintliga ämnen som därmed hamnade på 43–50 % ska INTE saneras** (beslut 2026-07-20). Avvikelserna är små och användaren har avfärdat dem som oviktiga. Varningarna blockerar ingenting och ska lämnas i fred – föreslå inte ett svep. Regeln gäller fortsatt fullt ut när **nya** frågor skrivs.
    - **Falska larm är farliga här:** en falsk längdbias-varning lockar till att fylla ut distraktorer med utfyllnad, vilket skapar riktiga tells (absolut-ord, negations-svansar) där det inte fanns något problem. Se de tre fällorna längst ner i denna paragraf.
  - **Mät:** andelen frågor där `correct` är längst ska ligga nära slumpnivån (~25 % vid 4 alternativ), inte 50–90 %. Gäller **flerordsfrågor**; se punkten ovan.
  - **Åtgärda i första hand** genom att bygga ut distraktorerna till jämförbar längd (fortsatt faktamässigt fel, inte fyllnadsord). I andra hand korta ner rätt svar – och då till en **komplett, kortare mening**, aldrig en avhuggen fras.
  - Numeriska frågor ("Cirka 6–8 månader"): ge minst en distraktor samma format (ett intervall), så längden inte skiljer.
  - ⛔ Korta ALDRIG rätt svar maskinellt/automatiskt (t.ex. klipp vid kommatecken) – det stympar meningen ("En automatisk", "Ja"). Skriv om för hand och läs igenom.
  - **⚠️ Kunskaps-/förklaringsfrågor drar systematisk längdbias – bygg emot det FRÅN START.** När rätt svar är ett påstående eller en förklaring (inte ett enda ord/term) blir det nästan ALLTID längst om distraktorerna skrivs som korta etiketter → 50–60 % längdbias per ämne. Prevention: skriv distraktorerna som **fullständiga, konkret felaktiga påståenden i samma längd och register som rätt svar redan när frågan skapas** – ett halvkunnigt fel, inte en kort etikett. Detta återkom ämne för ämne i sjuksköterske-bygget (2026-07-18) och tvingade fram dyra saneringssvep (strippa parenteser + förlänga distraktorer ämne för ämne) trots att lärdomen redan låg i minnet. Därför står den nu här: minnet räcker inte.
- **Inga avslöjande parenteser ELLER synonymer enbart på rätt svar:** Lägg ALDRIG extra förklaring/exempel/synonym inom parentes enbart på rätt svar – varken en fri förklaring ELLER en term-synonym av typen `Glomerulus (kapselnystanet)`, `Hypotyreos (underfunktion)`, `Flexion (böjning)`, `Diabetes (sockersjuka)`. Asymmetrin mot distraktorerna avslöjar svaret OCH gör det längst (dubbel tell). Regel: utelämna parentesen (skriv bara `Glomerulus`, `Hypotyreos`, `Flexion`) ELLER ge alla alternativ samma form. Håll rätt svar lika kortfattat som distraktorerna. Detta var den enskilt vanligaste tellen i sjuksköterske-bygget.
- **Rätt svar får inte ekas i frågan:** Frågetexten får inte innehålla svarstermen verbatim så att frågan blir självbesvarande. Skräckexempel: `medsek_diagnoskodning`-frågan "Vad kallas de Z-koder…" med `correct: "Z-koder"` – svaret stod redan i frågan. Symmetriska antingen/eller-frågor där båda kandidaterna nämns är OK.
- **⚠️ Ekot räknas även när ordet BÖJTS om – "term → samma term med svensk ändelse" (hittat 2026-07-19).** Det räcker inte att svaret undviker att stå ordagrant i frågan. Är svaret samma ord med bytt ändelse går frågan att lösa på ren ordlikhet, utan ett uns ämneskunskap. Skräckexempel ur `medsek_lages_riktning_rorelse`:

  | Trasig fråga | `correct` | Varför den är trasig |
  |---|---|---|
  | Vad betyder riktningstermen "medialis" på svenska? | `Medial` | Alternativen var Medial/Lateral/Proximal/Distal – man matchar bokstäver |
  | Vad betyder rörelsetermen "supinatio" på svenska? | `Supination` | Samma sak; distraktorn "Pronation" hjälper inte |
  | Vad betyder rörelsetermen "eversio" (om foten) på svenska? | `Eversion` | Samma sak |

  **Regel:** när frågan lyder "Vad betyder termen X?" ska `correct` vara **vad termen betyder**, inte X i svensk språkdräkt. Distraktorerna ska vara de *andra* termernas riktiga definitioner – då är alla alternativ sanna påståenden om någon term, och det enda sättet att välja rätt är att veta vilken.
  - Rätt byggt (samma ämne, oförändrat): "Vad betyder riktningstermen `anterior` (ventralis)?" → `Främre, mot buksidan`, med `Bakre, mot ryggsidan` / `Övre` / `Nedre` som distraktorer. "anterior" liknar inte "främre" – man måste kunna det.
  - Fixade varianten: "medialis" → `Närmare kroppens mittlinje, inåt`, mot `Längre ut från mittlinjen, utåt` / `Närmare bålen räknat längs extremiteten` / `Längre bort från bålen längs extremiteten`.
  - **UNDANTAG – böjningsfrågor är inte detta fel.** "Vad blir genitiv singular av `vertebra`?" → `Vertebrae` är helt korrekt: där ÄR den böjda formen det som testas, och distraktorerna är felaktiga böjningar. Skilj på *betydelsefrågor* (svaret ska vara betydelsen) och *formfrågor* (svaret ska vara formen).
  - **Sök aktivt efter mönstret** – validatorn fångar det inte. Jämför normaliserad `correct` mot termer inom citattecken i `prompt`; flagga när de delar ordstam. Kör på varje utbildningsfil, och undanta ämnen som handlar om böjning.
- **Numerisk-/format-paritet:** Rätt svar får inte vara det enda alternativet som är numeriskt eller format-mässigt korrekt. Efterfrågas ett antal/en siffra ska ALLA alternativ vara tal. Efterfrågas ett visst antal saker (plural) ska ALLA alternativ innehålla exakt lika många – t.ex. om rätt svar listar tre strukturer måste varje distraktor också lista tre, aldrig två eller fyra. Annars kan man räkna sig fram till svaret utan sakkunskap.
  - ⚠️ **Antals-asymmetri fångas INTE av `validate_quiz.py` – den måste kontrolleras för hand.** Skräckexempel (hittat 2026-07-13 i `bma_karlfys_42`): frågan löd "Vilka **tre** huvudsakliga faktorer (Virchows triad) …", rätt svar listade tre faktorer medan alla tre distraktorer började med "Enbart …" och listade EN. Då räcker det att räkna för att hitta rätt. Fix: skriv om distraktorerna så att de också listar tre (fortsatt fel) faktorer.
  - När du bygger/rättar ett ämne: sök aktivt efter frågor vars prompt innehåller ett räkneord (två/tre/fyra/tre huvudsakliga …) och kontrollera antalet poster i VARJE alternativ.
- **Inga extra kvalificerare enbart på rätt svar:** Rätt svar får inte vara det enda alternativet som bär en extra precisering (plats, tidpunkt, orsak), även utan parentes. Skräckexempel (`bma_hjarta_30`): `correct: "Nervus medianus, vid handleden"` mot de nakna distraktorerna "Nervus ulnaris" / "Nervus radialis" / "Nervus axillaris" – tillägget "vid handleden" pekar ut svaret. Fix: stryk kvalificeraren från rätt svar (→ "Nervus medianus") eller ge alla alternativ en likvärdig precisering. Samma familj som parentes-regeln ovan.
- **Språkparitet (latin/svenska/annat språk) – gäller VARJE språk, inte bara latin/svenska (hittat 2026-07-22 i `franska_termer.json`).** Alla alternativ ska ligga i samma språkregister. Rätt svar får inte vara det enda på latin (eller det enda på svenska) och sticka ut så. Antingen alla alternativ på latin eller alla på svenska. **Samma princip gäller självklart när ett ämne testar ord ur ett SPECIFIKT språk (t.ex. "franska lånord"): då måste ALLA alternativ – korrekt svar och distraktorer – faktiskt vara äkta ord ur det språket, inte en blandning.**
  - Skräckexempel: en fråga om franska lånord hade `"Sårtoalett"` (svenska "sår" + franskans "toalett" – en hybrid, inte ett rent franskt lånord) i samma alternativlista som `Kyrettage`/`Lavemang`/`Tamponad`/`Triage` m.fl. (rena franska lånord). Hybridordet stack ut i FORM mot de rena lånorden, oavsett om det stod som rätt svar eller distraktor, i fem olika frågor. Fix: bytt mot `Debridering` (även det ett rent franskt lånord, av `débrider`), som håller sig i samma register som resten av poolen.
  - **Test:** för en ordkunskapsfråga om ett specifikt språk, slå upp varje alternativs ordhistoria. Är även ETT alternativ en hybrid, en försvenskning som blandar en inhemsk stam med lånordet, eller ett ord ur ett HELT annat språk än det frågan testar – byt ut det mot ett äkta ord ur samma språk.
- **Kategori-/typläckage i namn-frågor (eponymer m.m.) – NY FELTYP (hittat 2026-07-22 i `franska_termer.json`).** När svarsalternativen är byggda som "Namn + generisk sakbeteckning" (t.ex. `Dupuytrens kontraktur`, `Charcots led`, `Aperts syndrom`, `Babinskis reflex`) och distraktorerna hämtas ur en pool med FLERA olika sakbeteckningar (kontraktur/syndrom/led/reflex/tecken/sjukdom/tetrad …), avslöjar frågans egen beskrivning nästan alltid VILKEN TYP av tillstånd det handlar om (en beskrivning av vävnad som "förtjockas och drar ihop fingrarna" är per definition en kontraktur). Då kan man peka ut rätt alternativ genom att bara matcha TYP mot beskrivningen – utan att veta vem personen är eller ens ha hört namnet förut.
  - Skräckexempel: "Vilket tillstånd innebär att bindväven i handflatan förtjockas och gradvis drar ihop ring- och lillfingret … uppkallat efter en fransk kirurg?" hade `Dupuytrens kontraktur` (korrekt) mot `Aperts syndrom` / `Crouzons syndrom` / `Charcots led`. Beskrivningen ÄR definitionen av en kontraktur – enda alternativet som heter "kontraktur" måste vara rätt, oavsett om man känner till Dupuytren.
  - **Fix:** när distraktorerna hämtas ur en pool med blandade sakbeteckningar, ta ENDAST bort den generiska beteckningen och testa namnet för sig (`Dupuytren` mot `Charcot`/`Apert`/`Crouzon`) – inte "Namn + beteckning". Alternativet är att hålla ALLA fyra alternativ till EXAKT samma sakbeteckning (bara andra kontrakturer) – välj det i första hand om poolen faktiskt räcker till, annars namn-utan-beteckning.
  - **Test:** för varje namn-fråga där alternativen är "Namn + ord", läs frågans beskrivning för sig (utan alternativen) och fråga: pekar beskrivningen redan ut vilken SAKBETECKNING (kontraktur/syndrom/led/tecken/reflex …) som gäller? Har bara ETT av alternativen den beteckningen – bygg om till bart namn eller byt distraktorer till samma beteckning.
- **Kategori-/typläckage i UPPFÖLJNINGSFRÅGOR ("del 2") – variant av regeln ovan, NY FELTYP (hittat 2026-07-22 i `grekiska_termer.json`, påtalat av användaren).** Gäller när ett ämnespar består av (1) en "vilken gud/person → X" fråga och (2) en uppföljningsfråga "vad kallas/kännetecknar X, uppkallad efter [guden/personen]?" med HELT ANDRA svarsalternativ (diagnoser, begrepp – inte namn). Om del 2:s prompt UPPREPAR det mytologiska/beskrivande draget från del 1 (t.ex. "en fruktbarhetsgud som ofta avbildades med en ihållande erektion", "dödsgestalten i grekisk mytologi") och detta drag bara matchar det korrekta svarets EGEN definition medan distraktorerna hör till ett helt annat begreppsområde, kan frågan lösas genom att bara matcha temat i beskrivningen mot temat i alternativen – utan att känna till guden, personen eller ens ha läst del 1.
  - Skräckexempel `gre_epo_6`: "Vad kallas det urologiska akuttillståndet, uppkallat efter en grekisk fruktbarhetsgud som ofta avbildades med en ihållande erektion?" hade `Priapism, en långvarig och smärtsam stånd utan sexuell upphetsning` (korrekt) mot Fimosis/Epididymit/Hydrocele – tre tillstånd som INTE handlar om erektion. "Ihållande erektion" i frågan pekar ut det enda alternativet vars EGEN beskrivning nämner stånd, helt utan kunskap om Priapus. Samma fel i `gre_epo_18` ("… myntat av Freud efter dödsgestalten i grekisk mytologi?" mot tre Freud-begrepp som inte har med död/destruktivitet att göra).
  - **Skillnad mot del 1-frågan:** i del 1 ("vilken gud … har gett namn åt X") är samma beskrivande drag helt i sin ordning – det är själva testet (känna igen guden via sin egenskap) och distraktorerna är ANDRA GUDAR där dragen inte överlappar. Felet uppstår specifikt i del 2, där alternativen bytt karaktär till obesläktade sakbegrepp.
  - **Fix:** i del 2 – referera guden/personen enbart vid NAMN (eller ett neutralt epitet utan sakligt informationsvärde, typ "drömguden Morpheus", "herdeguden Pan"), utan att upprepa det drag som definierar det sökta svaret. Går det inte att beskriva personen alls utan att avslöja domänen (som med Thanatos, vars enda "epitet" är döden) – utelämna epitetet helt och håll frågan till vad begreppet betyder i sitt sammanhang (t.ex. "vad avser begreppet Thanatos, som Freud myntade som en del av sin drivteori?").
  - **Test:** läs del 2:s prompt utan alternativen och fråga: beskriver den ett drag som bara stämmer in på det KORREKTA alternativets egen betydelse, och INTE på distraktorernas? Då måste dragets ordval bort ur prompten.
- **Kategori-/typläckage i BILD-/FORMBESKRIVNINGSFRÅGOR – tredje varianten, missad vid FÖRSTA genomläsningen (hittat 2026-07-22 i `grekiska_termer.json`, andra gången samma dag – påtalat av användaren igen).** Gäller frågor av typen "vilket av dessa alternativ ser ut som/har egenskapen …?" där prompten stavar ut den exakta utseendemässiga/formella definitionen av rätt svar, och en eller flera distraktorer uttryckligen anger MOTSATSEN till just det draget. Då räcker det att läsa och jämföra – ingen sakkunskap krävs alls.
  - Skräckexempel `gre_epo_20`: "Vilken av dessa symboler, med en enda orm slingrad runt en stav utan vingar, är läkekonstens ursprungliga symbol …?" hade `Asklepiosstaven` (korrekt, ingen egen beskrivning) mot `Herolds stav (caduceus), med två ormar och vingar` (uttrycklig MOTSATS till "en enda orm … utan vingar") samt två alternativ som inte ens var stavar. Ren logisk negation, ingen mytologikunskap behövdes.
  - **Varför den missades i den första genomläsningen samma dag:** föregående kontroll (ovan i denna paragraf) letade specifikt efter mönstret "del 2 upprepar del 1:s drag" och stannade där – frågan testades aldrig fristående mot sitt EGET innehåll. **Slutsats: varje fråga i filen måste gissa-testas isolerat, det räcker inte att bara jaga EN redan hittad feltyp och anta att resten är rent.**
  - **Fix:** ge INGEN av alternativen en beskrivning som (a) härrör ur prompten, eller (b) uttryckligen motsäger prompten. Antingen: stryk formbeskrivningen ur prompten helt och låt varje alternativ bära sin EGEN, symmetriska beskrivning (`Asklepiosstaven, en enda orm slingrad runt en stav` mot `Herolds stav (caduceus), två ormar slingrade runt en bevingad stav` …) – då krävs faktisk kunskap om vilket som är det äkta antika symbolen. Eller: håll prompten helt formfri och fråga efter namnet/personen i stället.
  - **Test:** läs prompten ENSAM (utan alternativen) och lista dess påstådda fakta. Läs sedan VARJE alternativ för sig och fråga: bekräftar eller motsäger detta alternativs EGEN text direkt något av prompten fakta? Om bara ett alternativ varken bekräftar eller motsäger (det nakna, obeskrivna) – det är den läckan.
- **Absolut-ords-tell – minst lika avslöjande som längdbias:** Distraktorer får inte bära absoluta ord (**endast, enbart, alltid, aldrig, ingen/inget/inga, samtliga, uteslutande**) när rätt svar aldrig gör det. Varje van tentaskrivare stryker "Endast X" och "Alltid Y" utan att kunna ämnet – då är frågan värdelös oavsett hur bra faktan är.
  - Skräckexempel (`rtg_njurfunktion_11`): frågan bad om tre processer i urinbildningen; rätt svar listade tre, medan distraktorerna löd "Endast filtration och sekretion, ingen reabsorption" / "Endast reabsorption, ingen filtration eller sekretion". Två tells på en gång (absolut-ord + antals-asymmetri).
  - **Fix:** skriv om distraktorn till ett konkret, specifikt och trovärdigt fel påstående i stället för ett absolut. "Endast njurbäckenet, inte parenkymet" → "Njurbäckenet och kalkarna med tät kontrast".
  - ⚠️ **Fällan när du bygger ut distraktorer för längdparitet:** det är frestande att fylla ut med "…, alltid oavsett …" eller "… helt utan …". Då fixar du längdbiasen och inför absolut-tellen i samma andetag. Det hände i fysio-svepet (35 % → 38 %). Kontrollera med validatorn efter varje patch.
- **⚠️ Att RÄTTA en tell skapar lätt en NY tell – tre återkommande fällor (fysio-svepet 2026-07-16):**
  1. **Negations-svansen.** När du stryker ett absolut-ord genom att lägga till en kontrast som slutar med rätt svarets nyckelord ("…, inte ligament eller kapsel", "…, utan bestäms av kostens sammansättning") blir distraktorn *självutpekande* i stället (validatorn flaggar `,\s*(inte|utan)\s+<rätt-svarets ord>$`). Fix: avsluta INTE distraktorn med ", inte/utan <det rätt svaret handlar om>". Skriv om till ett fristående felpåstående.
  2. **Omvänd längdbias vid förkortning.** När du kortar bort utfyllnad ur distraktorerna blir `correct` plötsligt längst i för många frågor (fysio-träning gick till 49 % längdbias). Fix: efter att ha kortat distraktorer, **mät längdbias per ämne igen** och förläng vid behov den längsta distraktorn i några frågor med genuint innehåll (inte fyllnadsord) tills andelen ligger < 40 %.
  3. **Bruten symmetri i antingen/eller-frågor (hittat 2026-07-20).** `muskler` q41–q44 löd
     "Gör Triceps brachii flexion eller extension?" med alternativen `Extension`/`Flexion` –
     en symmetrisk fråga där båda kandidaterna nämns, alltså tillåten. Men `Extension` är alltid
     2 tecken längre → längdbias i hela ämnet. När jag förlängde distraktorn till
     "Flexion i armbågsleden" försvann längdbiasen och frågan blev **självbesvarande** i stället
     (bara `correct` ekas nu ordagrant i prompten). Fix: bygg om frågan till öppen form –
     "Vilken rörelse i armbågsleden utför Triceps brachii?" med tre jämnlånga alternativ.
     Lärdom: en tell i en tvåalternativsfråga går sällan att fila bort, frågan måste byggas om.
  4. **Nytt absolut-ord i omskrivningen.** "uteslutande" och "samtliga" glöms lätt bort som absolut-ord (de ÄR med i validatorns lista). En omskrivning som "…för samtliga deltagare" återinför tellen. Fix: läs listan i §2.13 och kör validatorn efter patchen.
- **⚠️ Kvasi-absoluta ord: "bara" och "alla" – samma tell, men fångas ALDRIG av validatorn (hittat 2026-07-20).**
  Validatorns ordlista är avsiktligt exakt (endast/enbart/alltid/aldrig/inga/ingen/inget/samtliga/uteslutande).
  Distraktorer som säger **"Bara hjässbenet"**, **"Bara två av regionerna"**, **"Alla revben lika mycket"**,
  **"Alla barn når milstolparna exakt samtidigt"** eller **"Alla äldre får demens"** är precis lika strykbara
  utan sakkunskap – men går igenom med 0 varningar. Verkliga fynd: `ben.json` q27/q141/q143/q318,
  `grepp.json` q9, `olika_aldrar.json` oa_q18/oa_q75/oa_q83.
  - **Detta får INTE läggas in i `validate_quiz.py`.** Mätt projektbrett 2026-07-20: 544 frågor träffar på
    `\b(bara|alla)\b` i en distraktor, och de allra flesta är legitima sakpåståenden
    ("Nej, eftersom bara fri substans kan transporteras", "Ledningshinder i alla frekvenser").
    En maskinregel skulle dränka de äkta fynden i brus. **Kontrolleras för hand.**
  - **Test:** grep:a filen efter `Bara `/`Alla ` i distraktorer och läs dem med gissa-testet (§2.12).
    Är påståendet en absolut avgränsning ("bara X", "alla Y gör Z") → skriv om till konkret fel.
    Är det ett vanligt sakpåstående där ordet råkar ingå → lämna.
- **Omvänd längdbias räknas också:** rätt svar får inte heller vara det enda *mycket korta* alternativet. `rtg_columna_55` hade `correct: "CT"` (2 tecken) mot en 62 teckens distraktor – lika avslöjande som motsatsen. Håll alla alternativ i samma storleksordning.

### 2.10 BILDFRÅGOR MÅSTE HA TOM PROMPT
**STÅENDE REGEL (påtalad flera gånger – får ALDRIG upprepas).** Varje bildfråga (quiz-objekt med `"image": "<id>"`) ska ha **tom `prompt`** (`""`). Lägg ALDRIG en synlig prompt på en bildfråga.

- **Varför:** den kompakta mobillayouten `.quiz-image` är tunad så att bild + svarsalternativ + Nästa-knapp ryms på EN mobilskärm utan scroll. En synlig prompt knuffar svaren/Nästa under fold, särskilt på liten iPhone. "Bilden ÄR frågan."
- Låt svarsalternativen göra frågan självklar (ben → Os-namn, leder → Articulatio-namn). Skärmläsar-alt sätts av app.js.
- Distraktor-regel för bildfrågor: ett förälder-/grupp-/översiktsnamn får ALDRIG vara distraktor till en mer specifik bild (då blir det två rätta svar).
- Kontrollera ALLTID denna regel innan bildfrågor wiras in.

### 2.11 INGA DUBLETTFRÅGOR – MEN UNIKHET GÄLLER BARA INOM ÄMNET
- **Aldrig duplicera hela frågor** (samma id eller samma frågetext) utan explicit tillåtelse. Kopiera/`cp`/copypasta ALDRIG frågor mellan filer för att fylla på antal. Ladda aldrig samma fil två gånger för samma quiz.
- **Men unikhetskravet gäller bara inom det ämne som byggs**, inte mot andra ämnen eller andra utbildningar. Skriv INTE i CHANGELOG/commit att frågor jämförts mot "hela filen" eller mot andra namngivna ämnen – skriv bara "alla X frågor i ämnet kontrollerade unika". Att aktivt leta efter och narrativisera cross-ämnes-överlapp är inte efterfrågat.
- **Att fråga samma ord åt BÅDA håll är ALLTID tillåtet – i alla filer, alla ämnen.** "Vad betyder *dyspné*?" → "andnöd" och "Vad heter andnöd med medicinsk term?" → "dyspné" är två olika frågor som testar olika kunskap (igenkänning vs. produktion), inte en dublett. Det gäller hela quizet, inte bara glos-/terminologifiler. Flagga ALDRIG bidirektionella par som dubblettfel och föreslå aldrig att stryka det ena hållet. En dublett kräver samma prompt OCH samma `correct` – exakt vad validatorn kollar (`validate_quiz.py`, `qa_by_topic`).

### 2.12 SÅ HÄR SKRIVS EN BRA DISTRAKTOR (positiv mall – följ FÖRSTA gången)
Reglerna ovan (§2.2, §2.9) listar mest vad man INTE får göra. Det här är den positiva mallen: så *ska* en distraktor se ut. Följ den när frågan skrivs, så slipper du saneringssvep senare (se §2.13).

**En bra distraktor är ett konkret, specifikt och trovärdigt FEL – i samma register, längd och form som rätt svar.**

Bygg felet ur en verklig missuppfattning som en halvkunnig student faktiskt kan göra – byt ut EN sak mot rätt svaret:
- **byt mekanism/riktning:** dorsal ↔ volar, flexion ↔ extension, inåt- ↔ utåtrotation, afferent ↔ efferent, filtration ↔ reabsorption.
- **byt nivå/struktur:** en grannstruktur, granne-nerv (medianus→ulnaris), granne-artär, angränsande kota/led.
- **byt ordning/timing:** kasta om faserna (superkompensation före belastning), fel tidsprofil, fel fas i gångcykeln.
- **byt magnitud/tal:** ett annat men rimligt intervall/antal – och ge det **samma talformat** som rätt svar.
- **vänd orsakssambandet:** "ökar" i stället för "minskar", "tvärtom …".

**Gissa-testet (kör mentalt på varje fråga):** täck över rätt svar och läs distraktorerna som en student som vill chansa utan att kunna ämnet. Kan hen stryka en distraktor på FORMEN – för att den är kortare/längre, absolut ("Endast/Aldrig"), självdömande ("… en helt annan struktur"), fel talformat, eller för att den upprepar rätt svarets ord ("…, inte pankreas")? Då är distraktorn trasig, oavsett hur bra faktan i frågan är. Skriv om den.

**Konkreta före→efter (ur fysio-svepet 2026-07-16 – gör så här direkt):**
| Trasig distraktor (tell) | Fixad distraktor (konkret fel) |
|---|---|
| "Endast abduktion" | "Abduktion och utåtrotation i axeln" |
| "Menisker skadas i princip aldrig" | "Menisker skadas mycket sällan" |
| "Den har ingen som helst koppling till belastningen" | "Den har liten koppling till belastningen på lederna" |
| "Ett annat namn för perifer sensitisering, utan skillnad" | "Samma fenomen som perifer sensitisering, utan egentlig skillnad" |
| "Bara brosket påverkas, inte ligament eller kapsel" | "Bara själva brosket påverkas vid en luxation" |

Nyckelgreppet: byt det absoluta/självdömande ordet mot ett **hedgat men fortfarande felaktigt** påstående ("mycket sällan", "liten", "främst", "snarare än"), eller skriv ett helt konkret alternativt fel. Ta INTE bort själva feluppfattningen – den ska finnas kvar, bara sluta skylta med formen.

### 2.12b FEL SOM VALIDATORN INTE FÅNGAR – LETA EFTER DEM FÖR HAND
Skriptet är facit för *formtells* (§2.13), men följande feltyper är osynliga för det och måste hittas genom att faktiskt läsa varje fråga med prompt + `correct` + samtliga distraktorer. Alla är verkliga fynd ur granskningssvepet 2026-07 (fysioterapeut, BMA, medicinsk sekreterare).

**1. Distraktorn råkar vara SANN → frågan har två rätta svar.** Den överlägset vanligaste äkta defekten. Uppstår när distraktorn skrivs som "ett annat rimligt påstående" utan att kontrolleras mot verkligheten.
  - `fys_ledsk_25` "Varför läker ledbrosk dåligt?" hade distraktorn "Brosk innehåller mycket få levande celler" – brosk *är* hypocellulärt, och det är en äkta lärobokförklaring till dålig läkning.
  - `fys_musk_37` "Vilka muskler domineras av typ I-fibrer?" hade "Andningsmuskulaturens diafragma" som distraktor – diafragma är en klassisk typ I-dominerad muskel.
  - `fys_smarta_24` "trolig bidragande mekanism bakom fantomsmärta" hade "kvarvarande nervändar i stumpen" – neurom är en erkänd bidragande mekanism.
  - `fys_axel_81` om klavikeln hade distraktorn "det ben vars förbening avslutas allra sist" – vilket är rätt svar på NÄSTA fråga i samma ämne.
  - **Test:** läs varje distraktor som ett fristående påstående och fråga "är detta sant?". Är svaret ja eller "delvis" → skriv om den. Var extra vaksam på frågor som söker "en bidragande orsak" / "bland annat" – där kvalificerar flera sanna svar.

**2. Uppfunna eller felstavade fackuttryck som ser rimliga ut.** Passerar validatorn och läses lätt förbi.
  - "gröngölefraktur" (heter grönpinnefraktur), "blygdkörteln" om prostata (heter blåshalskörteln), "ligamentum capitis femoris proprium" (existerar inte), "otho-" (heter ot-), "DNA-girastas" (heter DNA-gyras), "His-bunte-systemet" (heter His–Purkinje), "förgangliniska" (heter preganglionära), "vilomatsomsättningen" (heter viloämnesomsättningen), "tuberkelnabbarna", "kolliqvationsnekros".
  - **Test:** varje fackterm och varje namngivet exempel ska gå att slå upp. Känns ett ord "nästan rätt" – slå upp det.

**3. Distraktorer från fel ämnesområde (copy-paste-rester).** `medsek_diagnoskodning_80` frågade om vårdadministrativa system och hade "Kollimator / Grid / Bolustracking" som alternativ – röntgenutrustning, uppenbart kvarlämnat från röntgenfilen. Bryter mot §2.1. **Test:** hör alla fyra alternativen hemma i samma ämne?

**4. Sammanblandade begrepp som är varandras grannar.** Sug-/sökreflex, tendinit/tendinopati ("seninflammation" om ett icke-inflammatoriskt tillstånd), stelopera/ankylosera, trakeotomi/trakeostomi. **Test:** läs frågan mot filens *egna* andra frågor – ofta lär ett annat ämne i samma fil ut motsatsen.

**5. Faktiskt fel premiss i frågetexten.** Själva frågan bär felet, inte alternativen: "impulsen når kamrarna snabbare via AV-noden" (WPW går ju *förbi* noden), "Vilken **muskel** förbinder radius och ulna" med svaret membrana interossea (ingen muskel), "Vilka **två** muskler …" med ett enda svar, "referensintervall för joniserat/totalt kalcium" med bara totalvärdets intervall.

**6. Genus- och kongruensfel på latinska/grekiska lånord.** Återkommer i alla filer: *ett* membran (inte "den alveolokapillära membranen"), *ett* neuron (inte "en neuron"), *ett* taggutskott, *ett* rörelsesegment, *ett* tubulussegment. Se §1.3.

**7. Prompten frågar efter något annat än svaret ger – eller är rent obegriplig.** Alternativen kan vara helt korrekta medan själva frågan är trasig. Hittat i läkarsvepet 2026-07-19:
  - `lak_buk_72` "Vilken **del av mjälten** är den röda pulpans huvudsakliga **uppgift**?" – frågar efter en del, svaret är en uppgift. Ska vara "Vad är den röda pulpans huvudsakliga uppgift i mjälten?".
  - `lak_rygg_81` "Vilken **struktur skadas** vid en Chance-fraktur?" med `correct` som beskriver frakturens förlopp, inte en struktur.
  - `lak_rygg_58` "**Var mellan vilka nivåer** är ryggmärgens blodförsörjning mest sårbar?" – två frågeord i samma mening.
  - `lak_buk_80` "Vilket lager omger njuren **närmast** och innehåller fettvävnad?" – motsäger sig själv: närmast är capsula fibrosa, fettet är capsula adiposa. Distraktorn blev då lika rätt som svaret.
  - **Test:** läs prompten ensam, utan alternativ, och formulera svaret själv. Matchar din svarstyp `correct`s svarstyp (struktur/uppgift/tidpunkt/mekanism)? Bär prompten en kvalificerare som gör en distraktor sann?

**8. Fel böjning av latinska/grekiska fackord i själva svarstexten.** Skild från genusfelen i punkt 6 – här är ordet rätt men formen fel, och det ser ut som kunskap:
  - "de omyeliniserade **nodierna**" (heter Ranviers **noder**) – fanns i två skilda ämnen, `lak_neuro_74` och `lak_cell_37`.
  - "en linje mellan **tuberae** ischiadica" (heter **tubera** ischiadica) i `lak_backen_23`.
  - "Sprängfraktur av **atlas ringar**" (Jefferson-frakturen spränger **atlasringen**) i `lak_rygg_80`.
  - "Apoptotisk **kaspad**kaskad" (heter **kaspas**) i `lak_cell_96`.
  - "den **bruskkam** där trachea delar sig" (danska/norska; heter **brosk**kam) i `lak_thorax_26`.
  - **Test:** varje latinsk plural och varje sammansättning med ett fackord ska gå att slå upp i den formen. Grep gärna filen efter formen efteråt – "nodier" fanns på två ställen, inte ett.

**9. Osynliga tecken.** Mjukt bindestreck (U+00AD) hittades inuti svarsalternativ i fyra datafiler ("Sakrokoccygeal­leden", "Grupp­funktion"). Syns inte men bryter sökning och strängmatchning. **Test:** `grep -c $'\xc2\xad' data/*.json` efter varje större redigering.

### 2.13 VALIDATORN ÄR FACIT – BYGG RÄTT FRÅN BÖRJAN, KÖR SKRIPTET EFTER VARJE ÄNDRING
**KRITISKT (kostnadsregel). Att sanera formtells i efterhand, fil för fil, bränner enorma mängder av användarens tokens/pengar. Preventionen är gratis; saneringen är dyr.**

- **`scripts/validate_quiz.py <fil>` är facit, inte mitt omdöme.** Kör den och åtgärda till **0 varningar och 0 fel** INNAN en fil/ett ämne levereras. Gissa aldrig – skriptet räknar.
- Den fångar: längdbias, parentes-asymmetri, självbesvarande, numerisk asymmetri, **absolut-ord enbart i distraktorerna**, **självutpekande distraktor** (inkl. `,\s*(inte|utan)\s+<rätt-svarets ord>`), förbjudet filler, dubbletter, tomt svar, rätt svar bland distraktorerna. Den absoluta ordlistan är exakt: **endast, enbart, alltid, aldrig, inga, ingen, inget, samtliga, uteslutande** (matcha den, inte en egen ungefärlig lista).
- **Antals-asymmetri (§2.9) fångas INTE av skriptet** – den kontrolleras för hand.
- **Kör validatorn efter VARJE patch, inte bara till slut.** Under fysio-svepet fångade den mina egna slipups om och om igen: att jag råkade återinföra "inget/alltid/uteslutande/samtliga" i en omskrivning, och att jag skapade nya självutpekande distraktorer (se §2.9 om ", inte/utan"-fällan).
- **Diagnostisera skulden innan metod väljs (billigaste vägen först):** ren mekanisk tell (absolut-ord/filler) → EN samlad dump-och-patch över hela filen, inte ämne för ämne. Äkta sakfel gömda i `correct` → full genomläsning krävs. Låt ett skript räkna stränglängder och fylla ut distraktorn tills den slår `correct` – gissa ALDRIG längder för hand (jag underskattar konsekvent 15–30 tecken).
- **Rör bara de flaggade fälten.** Index-patcha distraktorer (`{id:{"idx":ny}}`) så att prompt/correct/orörda distraktorer förblir byte-identiska → ren diff, inga oavsiktliga faktaändringar.

### 2.14 BEGÄRD KONTROLL/KORREKTUR SKA ALLTID VARA MANUELL – ALDRIG MASKINELL GENOMLÄSNING
**KRITISKT, NY REGEL (2026-07-22, efter att `grekiska_termer.json` innehöll tre olika ytformer av samma avslöjande-svar-fel som en tidigare "kontroll" missade).** När användaren uttryckligen ber om **kontroll** eller **korrektur** av quiz ELLER artiklar – inte bara "bygg det här", utan en explicit granskningsbegäran – ska den granskningen alltid vara en **manuell, isolerad genomläsning av varje fråga/stycke för sig**, aldrig ersättas av eller nöja sig med:
- att bara köra `validate_quiz.py` och rapportera 0/0 (se `feedback_validator_zero_not_proof` – skriptet fångar bara kända mekaniska mönster),
- att `grep`:a efter ETT redan hittat felmönster och anta att resten av filen är rent,
- att pattern-matcha mot en lista av tidigare hittade fel utan att faktiskt läsa frågan/stycket i sin helhet mot sitt eget innehåll.

**Varför:** i grekiska-svepet samma dag hittade en första manuell genomläsning `gre_epo_6`/`gre_epo_18` (samma mönster). Nästa "kontroll" letade specifikt efter DET mönstret, rapporterade filen ren, och missade `gre_epo_20` – en helt annan ytform av exakt samma underliggande fel (§2.9, tre kodifierade varianter). Användaren fick hitta den själv genom att faktiskt spela quizet. Se [[feedback_full_isolated_reread_after_bug_found]].

**Hur det tillämpas:**
- Läs varje fråga/stycke isolerat: täck (mentalt) över det du redan vet och gissa-testa på nytt (§2.12), oavsett om frågan "redan är kontrollerad" i ett tidigare pass.
- Validatorn/skript får köras som ett FÖRSTA, billigt filter för rent mekaniska tells – men den ersätter aldrig den manuella genomläsningen, och "0 varningar" får aldrig rapporteras till användaren som att kontrollen är klar.
- Gäller lika för artiklar: en begärd korrekturläsning innebär att läsa hela artikeltexten, inte att `grep`:a efter ett tidigare hittat stavfel eller sakfel och anta att övrigt är korrekt.
- Rapportera ALDRIG en kontroll som uttömmande om den inte var det – säg hellre "jag kontrollerade X men inte Y" än att antyda fullständighet.

---

## 3. FAKTAKONTROLL OCH VERIFIERING

### 3.1 Omfattning
- **ALLT** måste faktakolleras
- ALLA frågor
- ALLA svarsalternativ
- ALLA svenska och latinska termer

### 3.2 Källor
- Använd Terminologia Anatomica för latinsk nomenklatur
- Använd medicinska läroböcker för svenska termer
- Verifiera anatomisk information mot etablerad litteratur
- Webbkällor accepteras för moderna uppdateringar men verifieras två gånger

### 3.2b Kursunderlaget vinner – överkör inte källan
- Användarens kursunderlag (t.ex. "Muskellista VT26") är **auktoritativt** för vad tentan förväntar sig. "Rätta" eller ta INTE bort innehåll baserat på egen lärobokstolkning.
- Konkret miss att inte upprepa: extrinsisk/intrinsisk-märkningen togs bort från biceps/triceps/deltoideus/supraspinatus med eget resonemang – kursen använder den bredare uppdelningen (extrinsisk = muskelbuk utanför handen). Källan hade rätt.
- När källan krockar med min anatomiska intuition: **flagga och FRÅGA**, överkör aldrig tyst.

### 3.2c Skyddade källfiler
- `data/medicinsk_terminologi.json` bygger på en säker källa och ska **INTE röras/redigeras** vid språk- eller faktagranskningar. Hoppa över den om användaren inte uttryckligen säger annat.

### 3.2d ANVÄNDA KÄLLOR SKA SKRIVAS IN I `info.html` – ALLTID
Trovärdighet (E-E-A-T) är ett krav på hela appen, inte bara på kunskapsbanken. En källa som
innehållet faktiskt vilar på men som ingen besökare kan se är **inte** en redovisad källa.

- **Bygger eller granskar du innehåll mot en källa → för in den i källistan i `info.html`**
  (sektionen "Källor och kvalitetssäkring") i samma arbetspass. Det räcker INTE att bara sätta
  den i `source`-fältet i JSON – `source` är internt, listan i info.html är det besökaren ser.
  Detta gäller utöver den per-sidas-referenslista som kunskapsbanken kräver (`SEO_REGLER.md` §6b).
- **Hellre för många källor än för få.** Är du osäker på om en källa "är stor nog" – ta med den.
  Användaren stryker hellre en överflödig post manuellt än upptäcker att en använd källa saknas.
  Konkret miss att inte upprepa: listan innehöll länge 6 poster medan appens enskilt största
  källa (Sand m.fl., *Människokroppen*, 1 400 frågor) samt Moore, Boron & Boulpaep, Aspelin &
  Pettersson och Lännergren m.fl. helt saknades. Åtgärdat först på uttrycklig tillsägelse.
- **Använd goda källor.** Prioritera akademisk/vetenskaplig standardlitteratur (läroböcker,
  standardverk, myndighetspublikationer, peer review-material) framför bloggar, wikis,
  kurskompendier och AI-genererat innehåll. Håller källan inte akademisk nivå – bygg inte
  innehållet på den.
- **APA 7, alfabetisk ordning, titlar i `<em>`** – samma format som `SEO_REGLER.md` §6b.
  Svensk kollation: å/ä/ö sorteras sist (Lindskog före Lännergren).
- **Gissa ALDRIG bibliografiska data.** `source`-fälten innehåller bara författare + titel.
  Årtal, upplaga och förlag ska slås upp (eller hämtas från ett redan granskat `kb-sources`-block
  i repot) – hitta aldrig på dem för att få posten att se komplett ut. Kontrollera också att
  upplagan finns utgiven; Boron & Boulpaep 4:e uppl. är t.ex. ännu inte publicerad.
- **Radera aldrig en källa** ur listan på eget bevåg. Utrensning är användarens beslut.

### 3.3 Duplicering
- **ALDRIG:** Samma svar både i "correct" och i "distractors"
- Kontrollera VARJE fråga för detta

### 3.4 Logik-verifiering
- Alla alternativ måste kunna försvara "varför är detta ett alternativ"
- Om ett alternativ är tveksamt eller kraftigt stretcat - RADERA det

---

## 4. DATABAS-STRUKTUR

### 4.1 Filformat
```json
{
  "id": "q1",
  "prompt": "Frågan här?",
  "correct": "Korrekt svar",
  "distractors": ["Alternativ 1", "Alternativ 2", "Alternativ 3"],
  "topic": "kategori_namn",
  "difficulty": "lätt|medel|svår"
}
```

### 4.2 Topics för Ben (osteologi)
- Använd `osteologi_` som prefix
- Exempel: `osteologi_namn`, `osteologi_klassificering`, `osteologi_region`

### 4.3 Topics för Muskler
- Använd `muskler_` som prefix
- Exempel: `muskler_namn`, `muskler_funktion`, `muskler_innervation`, `muskler_klassificering`

### 4.4 Topics för Riktningar
- Använd `any_riktningar` eller `riktningar_` som prefix
- Exempel: `riktningar_motsats`, `riktningar_definition`

### 4.5 Filnamnkonvention
- Minst 500 frågor per ämne (eller enligt specifikation)
- Filnamn: `data/[ämne].json`
- Exempel: `data/ben.json`, `data/muskler.json`, `data/riktningar.json`

### 4.6 KRITISK REGEL - EN FRÅGA EN JSON-FIL
**VARJE ÄMNE MÅSTE HA EN EGEN JSON-FIL. ALDRIG samla flera ämnen i en fil.**

- Detta förhindrar misstag vid redigering
- Eliminerar risken för att radera hela ämnen av misstag
- Gör det enkelt att hantera antalet frågor per ämne
- Exempel: ben.json ENDAST för benfrågor, muskler.json ENDAST för muskelfrågor
- **REGEL:** Ny JSON-fil för varje nytt ämne, ALLTID

---

## 5. ARBETSMETOD OCH INSTRUKTIONER

### 5.1 Följ Instruktioner Noggrant
- Gör EXAKT det som sägs
- Inte eget initiativ eller "improvements"
- INTE att ändra menyn, struktur, eller annat utan explicit instruktion

### 5.2 SLUTA FRÅGA OM TILLSTÅND
- **REGEL:** Fråga ALDRIG om du får göra något
- Du får ALLTID göra det som instrueras
- Bara gör det

### 5.3 Var Försiktig med Borttagning
- Radera ALDRIG utan att vara säker
- Om något är osäkert - FRÅGA eller VÄNTA på bekräftelse
- Regel: "Gör inget. Du förstör bara saker när du raderar."
- Verifiera två gånger innan borttagning

### 5.4 Faktabaserad Argumentation
- Om något verkar fel - identifiera VARFÖR
- Förklara problemet innan du gör ändringar
- Låt användaren bekräfta innan större ändringar

### 5.5 Parallell Processing
- Jobba på alla tre filerna samtidigt när möjligt
- Inte sekventiell bearbetning av en fil åt gången

### 5.6 NY SORTS FEL UPPTÄCKT → SKRIV IN DEN HÄR, INTE BARA I MINNET
**STÅENDE REGEL (påtalad flera gånger: "minnet räcker ej").** Så fort en *ny sorts* fel hittas – en feltyp, inte en enskild felaktig fråga – ska den kodifieras i det här dokumentet i samma arbetspass som den upptäcks.

- **Varför:** minnesanteckningar är kontextberoende och kan missas i en framtida session. Reglerna är facit och läses varje gång innehåll byggs eller granskas. Flera dyra saneringssvep har uppstått just för att en lärdom bara låg i minnet.
- **Regeln ska skrivas PROAKTIVT enligt §0.** Formulera den som "så här skrivs det rätt från början", med mallen först och förbudet som komplement — inte som "leta efter detta fel efteråt". Placera den i det avsnitt där arbetet faktiskt utförs. En ny regel som bara beskriver hur felet hittas är inte ett fullgjort arbete.
- **Så här:** lägg feltypen där den hör hemma innehållsmässigt (§2.12b för fel validatorn inte fångar, §2.9 för formtells, motsvarande avsnitt i SEO_REGLER/ARTIKLAR_REGLER/ORDLISTA), med **ett verkligt exempel med fråge-id eller filnamn**, varför det är fel, och hur en korrekt variant ser ut. Ett påhittat exempel duger inte – ta det som faktiskt hittades.
- **Fråga först om felet kan göras omöjligt, inte bara upptäckbart.** Kan verktyget vägra skriva det felaktiga? Kan ändringen propagera automatiskt så att glidning inte kan uppstå? Då är det den åtgärden som gäller — och skriptet byggs om (§0). Ett maskinellt *test* (`scripts/validate_quiz.py`, `wire_terms.py --check`) är skyddsnätet därefter, aldrig den enda åtgärden.
- **Sök efter fler ytformer av samma fel innan regeln skrivs.** En feltyp visar sig sällan i bara en form: tooltipskulden fanns i fyra (exakt självreferens, böjningsvariant, enbart latinnamn, nyckeln som kommaled bland synonymer) och varje svep som jagade en form rapporterade filen ren. Regeln ska beskriva **feltypen**, inte den enskilda ytform som råkade upptäckas först.
- Notera det i minnet också, men minnet är kopian och dokumentet är originalet.

---

## 6. SPECIFIKA FEL ATT UNDVIKA

### 6.1 Engelska/Amerikanska Termer
- **ALDRIG** clavicle, humerus (amerikanskt), coccyx
- **ANVÄND:** clavicula, humerus (latinsk), os coccygis

### 6.2 Made-Up Svenska Namn
- **ALDRIG:** Fabricerade termer som "strålbent fiberflexor"
- **ALDRIG:** Feltolkningar av latin
- **ANVÄND:** Etablerade svenska anatomiska termer eller behål latinsk term

### 6.3 Filler-Alternativ
- Totalt förbjudet - detta förstör frågorna
- Exempel på FÖRBJUDNA:
  - "Annat ben"
  - "Ingen av dessa"
  - "Annan struktur"
  - Slumpmässiga ord för att fylla ut
- **Även omskrivningarna är filler** (hittat 2026-07-20, `tentaplugg.json` studier_q253:
  "Inget av ovanstående är relevant"). Förbjudna varianter: "Inget/Ingen av **ovanstående**",
  "Inget/Ingen av **alternativen**". Validatorns `FILLER`-regex täcker dem sedan 2026-07-20.

### 6.4 Oincompleta Meningar
- **ALDRIG:** "Vilken muskel adduktion?" (felanvänd ordklasse)
- **ANVÄND:** "Vilken muskel adducerar?" (korrekt verb)

### 6.5 Antal Alternativ
- MC-frågor behöver 2-4 alternativ efter behov
- Minst 2 (1 correct + 1 distractor)
- Max 4 (1 correct + 3 distractors)
- ALDRIG 1 alternativ (måste ha minst 2 totalt)

### 6.6 Dubbletter
- Samma ord ALDRIG både i "correct" och "distractors"
- Kontrollera alla frågor för detta

---

## 7. PROCESS FÖR NYA ÄMNEN

När ett nytt ämne ska läggas till:

0. **FÖRST - SKAPA NY JSON-FIL**
   - **KRITISKT:** Varje ämne får EN egen JSON-fil
   - Filnamn: `data/[ämnenamn].json`
   - ALDRIG blanda flera ämnen i en fil
   - Detta förhindrar misstag vid redigering och radering

1. **Planering**
   - Samla källmaterial
   - Bestäm frågekategorier
   - Skapa lista över termer att verifiera
   - **Vid delad per-utbildningsfil** (flera ämnen i samma JSON, åtskilda av `topic`): läs FÖRST prompts i redan befintliga ämnen vars sakinnehåll plausibelt överlappar – inte bara grep efter identiska strängar efteråt. Styr det nya ämnet mot det som ännu INTE testats. (Missen som kostade en omskrivning: BMA "Hematologi & transfusion" dubblerade "Blod & blodbildning".)

2. **Frågegenerering**
   - Följ alla regler från avsnitt 1-6
   - Använd korrekt svenska och latinsk terminologi
   - Konstruera logiska alternativ enligt avsnitt 2
   - Spara ENDAST i denna ämnets JSON-fil

3. **Faktakontroll**
   - Verifiera VARJE fråga
   - Verifiera VARJE alternativ
   - Verifiera ALLA svenska och latinska termer

4. **Validation**
   - Köra quiz-tester
   - Kontrollera att frågorna fungerar i appen
   - Be om feedback innan slutgodkännande

5. **Commit**
   - Git commit med beskrivning
   - Inkludera antal frågor, teman, och ändringar

---

## 8. QUALITY ASSURANCE CHECKLIST

Före varje session/commit, kontrollera:

- [ ] ALLA svenska ord är grammatiskt korrekta
- [ ] ALLA latinska termer är korrekt Swedish Medical Latin
- [ ] INGA engelska medicinska termer förekommer
- [ ] ALLA MC-frågor har 2-4 alternativ (1 korrekt + 1-3 distraktorer efter behov)
- [ ] TF-frågorna ligger på 40–60 % "Sant" i varje ämne med ≥8 TF-frågor (§2.4)
- [ ] INGA dubbletter mellan "correct" och "distractors"
- [ ] INGA filler-alternativ ("Annat", "Ingen av dessa", osv)
- [ ] ALLA alternativ är semantiskt relevanta för frågan
- [ ] Rätt svar är INTE systematiskt längst ELLER kortast (ingen längdbias, per ämne < 40 %); distraktorer jämförbart långa (§2.9)
- [ ] INGA avslöjande parenteser eller extra kvalificerare enbart på rätt svar (§2.9)
- [ ] Frågetexten ekar inte svaret verbatim (ej självbesvarande) (§2.9)
- [ ] INGA absolut-ord (endast/enbart/alltid/aldrig/inga/ingen/inget/samtliga/uteslutande) enbart i distraktorerna (§2.9)
- [ ] INGA självutpekande distraktorer, inkl. ", inte/utan <rätt-svarets ord>" och "ett annat namn för …" (§2.2)
- [ ] Varje distraktor klarar gissa-testet: går inte att stryka på formen (§2.12)
- [ ] Antals-paritet kontrollerad för hand på frågor med räkneord (tre/fyra …) (§2.9)
- [ ] Testar ämnet ord/namn ur ett SPECIFIKT språk (t.ex. franska lånord): ALLA alternativ är äkta ord ur det språket, ingen hybrid eller ord ur ett annat språk (§2.9)
- [ ] Namn-frågor av typen "Namn + generisk beteckning" (kontraktur/syndrom/led/tecken …): beskrivningen i frågan avslöjar inte typen mot bara ETT alternativ – bart namn eller samma beteckning på alla (§2.9)
- [ ] INGA incompleta meningar i frågorna
- [ ] ALLA termer är verifierade mot anatomisk litteratur
- [ ] Filstruktur är korrekt (JSON, topics, IDs)
- [ ] **`python3 scripts/validate_quiz.py <fil>` ger 0 varningar och 0 fel** – körd EFTER sista ändringen (§2.13)

---

## 9. KOMMUNIKATION MED ANVÄNDAREN

### 9.1 Reporting
- Rapportera ALL arbete som gjorts
- Visa antalet ändringar per kategori
- Specifika exempel på vad som fixats

### 9.2 Problem-identifiering
- Om något verkar fel - SÄGA IT
- Förklara VARFÖR det är ett problem
- Föreslå lösning

### 9.3 Bekräftelse
- Vänta på bekräftelse för större ändringar
- Applicera ändringar omedelbar när instruktionen är klar
- SLUTA FRÅGA - bara gör det

---

## 10. TIDIGARE COMMITS OCH KÄNDA PROBLEM

### 10.1 Tidigare Fel
Dessa fel ska ALDRIG upprepas:
- Radera 300 muscle questions (KRITISKT FEL)
- Generera 500 frågor med filler-alternativ
- Använd engelska medicinska termer istället för svensk latin
- Skapa name questions för muskler utan olika svenska namn
- Generera abbreviation questions med felaktig logik
- Made-up svenska namn för anatomiska strukturer
- Grammatiska fel i frågorna (incomplete meningar)
- Använd "innervärs" (icke-existerande ord) istället för "innerveras av"
- **Längdbias:** rätt svar systematiskt längre/mer detaljerat än distraktorerna (avslöjar svaret på längden) – se §2.9
- **Avslöjande parenteser:** extra förklaring/exempel inom parentes enbart på rätt svar – se §2.9
- **Självbesvarande frågor:** frågetexten ekar svarstermen verbatim – se §2.9
- **Antals-asymmetri:** frågan ber om tre saker men bara rätt svar listar tre (distraktorerna en) – se §2.9. Fångas inte av validatorn
- **Extra kvalificerare enbart på rätt svar:** "Nervus medianus, vid handleden" bland nakna nervnamn – se §2.9
- **Maskinell trimning av rätt svar** som stympar meningen ("En automatisk", "Ja") – skriv alltid om för hand
- **Absolut-ords-tell:** distraktorer med "Endast/Enbart/Alltid/Aldrig …" när rätt svar aldrig bär dem – se §2.9. Låg dolt i HELA projektet medan vi bara mätte längdbias (röntgen 38 %, fysio 38 %, BMA 32 %, logoped 34 %, tandläkare 19 %)
- **Självutpekande distraktorer:** "en helt annan struktur", "en påhittad benämning", "vilket är felaktigt", "Levern, inte pankreas" – se §2.2
- **Kontextberoende frågetext:** "det motsatta läget", "dessa två ligament" – bryts när frågorna blandas, se §2.2
- **LÄRDOM (2026-07-14): att mäta ETT mått är inte samma sak som att frågan är bra.** Röntgen gick från 44 % längdbias till 0 % – men bar samtidigt 565 frågor med absolut-tell, 34 självutpekande distraktorer och en handfull självbesvarande frågor som ingen mätning fångade. Läs alltid igenom alternativen som en student som vill gissa sig fram, inte bara som en faktagranskare.
- **Negations-svans skapad vid rättning:** att stryka ett absolut-ord genom att lägga ", inte/utan <rätt-svarets ord>" skapar en självutpekande distraktor i stället – se §2.9-fällan.
- **Omvänd längdbias skapad vid förkortning:** förkortade distraktorer gjorde `correct` längst i 49 % av träningsfrågorna – mät längdbias igen efter förkortning, se §2.9.
- **Återinfört absolut-ord i egen omskrivning:** "uteslutande"/"samtliga" glömdes som absolut-ord flera gånger under fysio-svepet – kör validatorn efter varje patch, se §2.13.
- **LÄRDOM (2026-07-16): hela formtells-svepet är klart** (röntgen, BMA, med.sekr, läkare, tandläkare, logoped, fysioterapeut – alla 0 varningar). Skulden fanns bara för att frågorna genererades i strid med §2.2/§2.9 från början. **Bygg rätt första gången (§2.12–2.13); saneringen kostade användaren enorma mängder tokens och stort missnöje.** Detta får inte upprepas när nya ämnen byggs.
- **Kategori-/typläckage i namn-frågor (2026-07-22, `franska_termer.json`):** "Namn + generisk beteckning"-alternativ (`Dupuytrens kontraktur` mot `Aperts syndrom`/`Charcots led`) läcker typen via frågans egen beskrivning – se §2.9. Fix: bart namn, eller alla alternativ med samma beteckning.
- **Språkparitet gäller ALLA språk, inte bara latin/svenska (2026-07-22, `franska_termer.json`):** en hybrid (`Sårtoalett` = svensk stam + franskt lånord) bland rena franska lånord är samma sorts formtell som latin bland svenska – se §2.9. Fix: byt ut mot ett äkta ord ur samma språk som resten av poolen.
- **LÄRDOM (2026-07-22): validatorn gav 0/0 på `franska_termer.json` två gånger i rad – ändå var frågorna trasiga.** Skriptet fångar bara det som redan är kodifierat. Två helt nya feltyper (kategoriläckage, språkblandning i ett tredje språk) smet igenom eftersom de aldrig manuellt gissa-testades mot den faktiska frågetexten. **Läs varje fråga som en student som chansar, inte bara kör skriptet** – 0/0 betyder "inga KÄNDA tells", inte "inga tells".

### 10.2 Lyckade Lösningar
- Separera frågor i tre JSON-filer (ben.json, muskler.json, riktningar.json)
- Använd pattern matching i JavaScript för topic-val
- Verifiera att alla alternativ är semantiskt relevanta
- Faktakolla ALLT innan commit

---

## 11. FRAMTIDA EXPANSION

**KRITISK REGEL:** Varje nytt ämne MÅSTE ha en EGEN JSON-fil. ALDRIG blanda ämnen.

När nya ämnen läggs till:
- **Skapa SEPARAT ny JSON-fil** med rätt namn (data/[ämnesnavn].json)
- Detta förhindrar misstag vid redigering och radering
- Följ SAMMA format och regler som befintliga ämnen
- Använd samma prefix-konvention för topics
- Faktakolla ALLT innan lansering
- Implementera samma QA-process som befintliga ämnen

---

## 12. MODULÄR KOD: EN EGEN JS-FIL PER NYTT SPELLÄGE, APP ELLER VERKTYG

**Mall (så här görs det rätt från början):** varje nytt spelläge, delapp eller
verktyg byggs i en **egen `js/<namn>.js`** – aldrig genom att växa in i `js/app.js`.
Filen laddas som ett vanligt klassiskt `<script defer>` **efter** `app.js` i
`index.html`. Klassiska script delar samma globala scope (precis som `js/images.js`
redan anropas från `app.js`), så modulen kan använda `app.js` hjälpare direkt som
globaler: `el`, `shuffle`, `loadQuestions`, `loadQuestionsFromMultiplePaths`,
`ALLMANT_LENSES`, `getQuestionsPath`, `topicLabelFor`, `eduAbbrevFor`,
`formatDuration`, `downloadJsonBlob`, `topicCapabilities` m.fl. Modulen wire:ar sina
egna knappar i sin **egen** `DOMContentLoaded`.

**`app.js` får bara känna till modulen via skyddade krokar** – aldrig direkta anrop:
```js
if(typeof renderMatchaScores === 'function') renderMatchaScores()   // i showHighscores()
if(typeof updateMatchaButton  === 'function') updateMatchaButton()   // i updateStartButtons()
```
Så fungerar `app.js` även om modulen inte är laddad, och modulen kan tas bort/bytas
utan att röra `app.js`. Facit-implementationen är **`js/matcha.js`** (0.9.242) – följ
den som mall.

**Varför:** `app.js` var på väg mot 2 000+ rader. Varje liten fix i ETT läge tvingade
då fram en inläsning/ändring av hela filen – dyrt i tokens och riskabelt. Ett läge i
egen fil läses och ändras isolerat. Detta är en **proaktiv** regel (§0): bygg rätt
från start, extrahera inte i efterhand (Matcha låg först inbakat i `app.js` och fick
brytas ut – den kostnaden ska inte återkomma).

**Cachebuster:** sköts av `scripts/bump_version.py` (sedan 0.9.251). Skriptet frågar
git vilka `js/*.js` och `css/*.css` som ändrats och sätter `?v=` för **precis de
filerna** i alla HTML-sidor som refererar dem – plus generatorernas hårdkodade
CSS-konstanter. Sätt den aldrig för hand: kravet stod tidigare som "sätts för hand
tills skriptet lär sig dem", vilket är exakt den sortens mekaniska handpåläggning
§0.3 förbjuder (116 sidor refererar `styles.css`). `pre-commit` blockerar en commit
där en ändrad js/css-fil bär en gammal buster.

**Gäller:** spellägen (Matcha, Leitner, Tidsjakt, kommande Dagens utmaning/Gravity),
fristående delappar och verktyg. Gäller **inte** rena datafiler eller små
hjälpfunktioner som hör ihop med befintlig quiz-/flashcard-logik.

### 12.1 INGA VARUMÄRKESNAMN I KOD ELLER TEXT — ANVÄND FRIA ORD

**STÅENDE REGEL (2026-07-25, på användarens uttryckliga begäran: "Använd inga
varumärkesnamn i kod eller text. Använd bara fria begrepp som inte ägs av en firma.")**

**Mall (så här görs det rätt från början):** ett nytt spelläge, verktyg eller
begrepp får **två** namn, och båda ska vara fria ord som ingen firma äger:

| | Exempel | Används i |
|---|---|---|
| Synligt namn | **Tidsjakt** | knappar, rubriker, topplistan, CHANGELOG, `info.html` |
| Kodnamn/slug | **`tidsjakt`** | filnamn, funktioner, konstanter, element-id:n, CSS-klasser, localStorage-nyckel, exportens `type` |

**Bäst är när de är samma ord** (Tidsjakt/`tidsjakt`) – då finns ingen översättning
att hålla i huvudet. Väljer du ett synligt namn som inte kan vara en identifierare
("Dagens utmaning") måste sluggen ändå vara ett eget fritt ord, aldrig en förkortning
av en produkt.

Slugen ska vara ett enda gement ord utan diakriter, så att den fungerar rakt
igenom `js/<slug>.js`, `TIDSJAKT_*`, `#<slug>Clock`, `.<slug>-card`,
`hur_highscores_<slug>` och `scoreList-<slug>`.

**Så väljs namnet:** beskriv vad läget **gör** (tidsjakt, matcha, parspel,
dagsutmaning), inte vilken produkt det påminner om. Är det enda namn du kommer
på ett företags — då har du inte namngett läget än, du har lånat en förlaga.

**Förbjudet:** att döpa något efter en tjänst, app eller sajt. Konkret fall som
motiverar regeln: läget Tidsjakt låg i backloggen och i scaffolden under en
amerikansk quizsajts namn, och hann bli filnamn, 441 kodförekomster, 138
CSS-rader, element-id:n och ett localStorage-fack innan det byttes ut i 0.9.254.
Kostnaden var ett helt omdöpningspass — precis den dubbelkostnad §0 finns för
att förhindra. Ett arbetsnamn i en backlogg blir kod om ingen hindrar det.

**Gäller även jämförelser i kommentarer.** Skriv mekanismen, inte produkten:
"samma relearn-princip som i vanliga kortlekssystem", inte "<appnamn>-stil".
`js/leitner.js` hade två sådana och städades i samma släpp. Undantaget är §13,
där instruktionen *är* att titta på namngivna förlagor innan man bygger — där
namnges de som research, aldrig som namn på något vi levererar.

**Kontroll före commit** (skyddsnät, inte ersättning för mallen ovan):
`grep -rniE '<misstänkt namn>' --include=*.js --include=*.html --include=*.css --include=*.md .`

### 12.2 EN GENERATOR SKA RUNDTRIPPA TILL IDENTITET

**STÅENDE REGEL (2026-07-25).** Kör man en generator på en ren utcheckning ska
diffen bli **tom**. Gör den inte det har generatorn och den levererade HTML:en
glidit isär, och varje framtida ändring i den generatorn drar med sig regressioner
som ingen beställt. Driften ska **fixas först**, inte kringgås genom att patcha
generator och levererad HTML var för sig — det är dubbelarbete som betalas om
igen vid nästa ändring (§0).

**Testet ska köras med ett kommando**, inte finnas i huvudet på den som råkar
upptäcka driften:

```
python3 scripts/check_generators.py    # exit 0 = rundtripp identisk
```

**Ett larm som alltid är rött är inget larm.** `generate_glossary.py` hade fram
till 0.9.270 ett eget `--check`, och regeln pekade på det. Det kunde per
konstruktion aldrig lysa grönt igen efter att `wire_citations.py` (0.9.267) och
`wire_identity.py` (0.9.268) började skriva i de färdiga sidorna: det jämförde
generatorns rena utdata mot filer som bär tooltips, referenser, identitet och
datum, tillagda av senare steg. Det stod alltså som ett skydd i regelverket
samtidigt som det gav exit 1 på en ren utcheckning. `--check` är borttaget —
kontrollen nedan mäter samma sak korrekt, eftersom den kör **hela** kedjan.

Skriptet speglar alla spårade filer till en temporär katalog, kör hela kedjan
där (alla `generate_*.py` + `wire_terms.py` + `wire_citations.py` +
`wire_lang.py` + `wire_identity.py` + `wire_sidfot.py` + `wire_dates.py` +
`generate_llms.py`) och jämför fil för fil mot arbetskopian. Bara en körning av hela kedjan duger:
**wire-stegen kan ingen enskild generator kontrollera** — tooltips, referenser,
språkmärkning, identitet, sidfot och datum läggs på *efter* sidgenereringen, så
det är först när allt körts i ordning som man ser om de överlever. Därefter kör det `check_links.py` (varje intern länk mot disk) och
`sidodatum.py --check` (varje sidas datum mot git). **Kör det före varje commit
som rör en generator, ett facit eller en genererad sida.**

**Spegeln kopierar bara *spårade* filer.** Ett nytt kedjesteg måste vara
`git add`-at innan `check_generators.py` kan köra det — annars saknas skriptet i
spegeln och kedjan faller på en `ModuleNotFoundError` som ser ut som ett kodfel
men är en oincheckad fil (hände när `wire_sidfot.py` lades till i 0.9.271).

**Ett steg som behöver git kan inte ligga i KEDJA.** Spegeln är en naken
filkopia utan `.git`, så `sidodatum.py` körs mot arbetskatalogen efter
rundtrippen i stället. Det är också därför datumen bor i ett facit
(`data/sidodatum.json`) och inte läses ur git av kedjan själv.

**Driften går åt båda hållen — avgör per fil, kör inte bara om allt.** I
0.9.266 var den levererade filen nyare i två fall (en handinlagd mening i
muskeltabellernas ingress, versaler i flashcard-svaren → generatorn fick lära
sig dem) och generatorn nyare i ett (47 disambiguerade distraktorer i
`medicinsk_latin.json` som aldrig skrivits ut → filen regenererades). Att
reflexmässigt köra om allt hade tyst raderat de två första.

**EN KONSTANT PER RESURS.** Två resurser får aldrig dela cachebusterkonstant.
`generate_glossary.py` hade `theme.js?v={STYLES_V}`: när `styles.css` ändrades i
0.9.264 bumpades `STYLES_V`, och en regenerering hade skrivit
`theme.js?v=0.9.264` på 33 sidor trots att `js/theme.js` inte rörts sedan
0.9.260. `bump_version.py` gjorde rätt — den bumpar per **ändrad** resurs — men
`generator_css_versions()` kan inte hålla isär två resurser som pekar på samma
variabel. Samma fel fanns i fem generatorer till, och `generate_artiklar.py`
hämtade bustern ur `VERSION` (beräknad, inte literal) och var därmed helt osynlig
för `bump_version.py`.

**En generator äger sina filer helt — handredigera dem aldrig.**
`spellagen.html` hade lagts in för hand i `sitemap.xml` i en annan ordning än
generatorn emitterar. Handredigeringen överlever inte nästa körning.

**`<lastmod>` får bara flyttas av en innehållsändring.** `write_sitemap` satte
`date.today()` på **alla** URL:er, så varje körning daterade om hela sajten —
en falsk färskhetssignal på 240 URL:er, och färskhet är precis vad en svarsmotor
väger. Jämför mot disk med cachebusters bortnormaliserade
(`?v=0.9.264` → `?v=`); en busterbump är ingen innehållsändring. URL:er
generatorn skriver ut men inte äger (artiklar, tabellsidor) behåller alltid sitt
befintliga datum.

---

## 13. SPELKÄNSLA ÄR ETT KRAV – RESEARCHA LIKNANDE SPEL FÖRST

**Mall (så här görs det rätt från början):** innan en rad kod skrivs för ett nytt
spelläge ska jag **titta noga på hur liknande, väletablerade spel är gjorda** och på
vad som allmänt anses göra dem kul och stimulerande — och skriva ner slutsatserna
innan bygget börjar. För ett parspel (Matcha): hur gör Duolingo, Quizlet Match,
memory-/pexeso-spel, Tinycards? För skriv-svaret: hur gör Anki/Quizlet Learn? För
arkadläget: hur känns Quizlet Gravity? Leta efter de konkreta greppen som skapar
njutning: **omedelbar och tillfredsställande återkoppling, mikroanimationer med måtta,
tydlig känsla av framsteg, belöning/beröm, streaks och delmål, ljud/haptik där det
passar, snygg och inbjudande layout, och friktionsfri touch på mobil.**

**Spelkänsla ("game feel") ska finnas och är en förstklassig kravdimension** — likställd
med faktakorrekthet och buggfrihet, inte efterhandsputs. Ett spelläge som är logiskt
korrekt men **tråkigt, platt eller fult att röra vid är inte färdigt.** Bygget planeras
och bedöms mot frågan *"är det här roligt, snyggt och inbjudande att spela?"* — inte
bara *"gör det rätt sak?"*.

**Så här tillämpas det:**
1. **Research först, dokumenterat.** Sammanfatta i planen (som visas för användaren före
   bygge, [[feedback_write_plan_clearly_before_building]]) vilka förlagor jag tittat på
   och vilka konkreta spelkänslo-grepp jag tar med. Ingen research = inte redo att bygga.
2. **Designa återkopplingen medvetet.** Hur känns ett rätt svar? Ett fel? Övergången
   mellan omgångar? Slutet? Varje sådan moment ska kännas avsiktlig och belönande, inte
   som ett hårt tillståndsbyte.
3. **Verifiera spelkänslan visuellt** innan leverans — logik-simulering räcker aldrig för
   UI (§0.3, [[feedback-ui-fun-and-listen-first]]). Titta på det renderat, på mobil.
4. **Estetik och mobilkänsla** hör till kravet: tillräcklig träffyta, mjuka men snabba
   animationer, konsekvent färg/typografi, inget som hoppar eller känns billigt.

**Varför:** appens hela syfte med spellägen är att göra pluggandet roligt nog att man
kommer tillbaka. Ett mekaniskt korrekt men trist spel missar hela poängen — det var
precis felet i Matcha-bygget 2026-07-24. Kul och snyggt är inte en bonus ovanpå
funktionen; för ett spel **är** det funktionen.

### 13.1 MATCHA-STANDARDEN ÄR GOLVET — VARJE NYTT SPELLÄGE BYGGS DIT DIREKT

**STÅENDE REGEL (2026-07-25, på användarens uttryckliga begäran: "se till att ALLA
framtida spel följer matcha-lyftet, utan att jag behöver upprepa det").**

Matcha efter spelkänslo-lyftet (0.9.247) **är mallen**. Varje kommande spelläge —
Dagens utmaning + streak, Arkad/Gravity och allt som tillkommer — byggs med hela
listan nedan **inne i det första bygget**. Den ska aldrig behöva efterfrågas, och den får aldrig läggas som ett
polish-pass efteråt: att bygga läget platt och sedan lyfta det är precis den
dubbelkostnad §0 förbjuder (Matcha byggdes så, och lyftet blev ett eget arbetspass).

**⚠️ Det är PRINCIPEN som är bindande — utformningen anpassas efter varje spels egna
behov.** Listan nedan är inte en form att kopiera rakt av. Vad "framsteg", "payoff" och
"ett riktigt slut" *betyder* skiljer sig mellan ett parspel, ett skrivläge, ett
Leitner-schema och ett arkadläge — och en punkt som är främmande för spelets natur ska
lösas på det sättet som passar **det** spelet, inte klistras på för att den står här.
Kravet är att varje punkt är **medvetet besvarad** i planen (§13 punkt 1): antingen
"så här gör vi det i det här läget" eller "det här läget löser samma behov så här i
stället". Det som aldrig får hända är att en punkt tyst uteblir för att den var jobbig.

**Facit för hur en punkt anpassas i stället för kopieras: `js/tidsjakt.js` (0.9.254).**
Där är tiden spelarens valuta, så Leitners koreografi i tre steg om 260 ms hade
stulit av den. Punkt 2 löstes därför som **ett** snabbt steg (~180 ms: facit tänds,
poängen studsar, tidsbonusen flyger, nästa kort glider in) — fortfarande en payoff,
aldrig ett stumt tillståndsbyte, och klockan stoppas inte. Punkt 3 löstes med
klockan **som** mätare (den töms i stället för att fyllas) plus ett spökmål:
personbästa i ämnet syns under spelet, inte bara i efterhand. Motivera anpassningen
i planen på det sättet — "punkten passar inte" räcker inte, "så här löser läget
samma behov" gör det.

**De åtta punkterna — facit finns i `js/matcha.js` + `.matcha-*` i `css/styles.css`,
använd mönstret därifrån och översätt det till det nya lägets mekanik:**

1. **Mikroåterkoppling på varje handling.** Ingen interaktion får vara stum: valt
   element markeras och pulserar (`.matcha-tile.selected` + `@keyframes matchaGlow`),
   kopplingar/övergångar tonas in i stället för att poppa (`.grown`-klassen sätts i
   nästa `requestAnimationFrame` så transitionen startar från utgångsläget), och varje
   bekräftad handling ger kort haptik (`matchaVibrate(10)`).
2. **Rättningen är en payoff, inte ett tillståndsbyte.** Avslöja **ett i taget i snabb
   följd** (`MATCHA_REVEAL_STEP_MS`, ~260 ms) — rätt poppar (`.pop`), fel skakar
   (`.shake`), med ljud och haptik per steg. Aldrig "allt tänds samtidigt".
   Omfärga bara det avslöjade elementets **egna** sparade noder; rita inte om hela
   vyn, då startar redan avslöjade delar om sin animation.
3. **Framstegsmätare över HELA spelet**, inte över omgången: en fylld stapel
   (`.matcha-progress-track`/`-fill`) plus en räknare som **studsar** när den ökar
   (`.matcha-score-badge.bump`, med forcerad reflow så animationen kan köras igen).
4. **Beröm vid delmål.** Ett kort, konkret erkännande när något går perfekt
   ("Perfekt omgång! 🎯") — inte bara siffror.
5. **Slutet ska kännas som ett slut.** Resultatring (SVG-donut animerad via
   `stroke-dashoffset`), procent, minst ett nyckeltal utöver poängen (Matcha:
   snitt-tid per par) och ett **rekordmärke** mot tidigare personbästa räknat ur den
   egna localStorage-listan **innan** det nya resultatet sparas (`matchaPriorBest()`,
   `🏆 Nytt rekord!`).
6. **Ljud + haptik, avstängbart.** Korta, självgenererade Web Audio-toner
   (`playMatchaTone`) — **aldrig externa ljudfiler** (CSP tillåter dem inte).
   Kopplas till den befintliga **"Ljudeffekter"**-bocken i Inställningar
   (`el('soundEnabled')`); bygg ingen ny inställning per läge. AudioContext skapas
   först vid en spelarinitierad tryckning (autoplay-kraven).
7. **Estetik och mobilkänsla, i själva bygget.** Träffytor som går att träffa med
   tummen, hover- **och** press-lägen på allt klickbart, textlängd → typsnittsskala
   per element när innehållet varierar (`--tile-scale`, `matchaTileScale()`, med
   `max()`-golv i CSS), vertikal centrering så kolumner/paneler inte hänger snett,
   och **en sammanhållen infopanel** i stället för lösryckta textrader.
8. **`prefers-reduced-motion: reduce` respekteras** — `prefersReducedMotion()` sätter
   stegfördröjningen till 0 och media queryn stänger av animationerna, men
   **sluttillstånden (färg, procent, mätare) sätts ändå direkt.** Reducerad rörelse
   får aldrig betyda utebliven information.
   **⚠️ Nollställ bara fördröjningar som ÄR rörelse.** En fördröjning som utgör
   tiden något syns är information, inte animation, och ska lämnas i fred. I
   `js/tidsjakt.js` går nästa fråga fram efter 180 ms; nollas den vid reducerad
   rörelse hinner spelaren aldrig se om svaret var rätt — alltså precis den
   uteblivna information regeln finns för att förhindra. Fråga per fördröjning:
   *rör den något, eller visar den något?*

**Utöver de åtta, i varje nytt läge:**
- **Läget ska förklara sig självt för någon som aldrig spelat det.** Skriv en
  förklaring som svarar på *vad går det här ut på och varför*, inte bara vilka
  knappar som finns – och lägg den **i spelvyn**, överst, inte i en FAQ. En mening
  om mekaniken ("rätt svar flyttar kortet upp en låda") förklarar ingenting för den
  som inte redan förstår varför lådorna finns; det var precis kritiken mot Leitners
  första version. Mall: `#leitnerIntro` i `index.html` – en `<details>` som
  modulen **fäller upp automatiskt för den som inte spelat förut** och lämnar
  hopfälld för vana spelare, med en summary-rad som säger något i sig.
  **Gör dessutom spelplanen självförklarande** där det går: Leitners lådor skyltar
  med sina egna intervall ("4 → 8 dagar"), så trappan lär ut sin egen regel utan
  att man behöver läsa texten.
- Egen `js/<namn>.js` med skyddade `typeof`-krokar från `app.js` (§12). Cachebustern
  sätter `scripts/bump_version.py` automatiskt – aldrig för hand.
- **Vyn SKA skalas till skärmen, inte bara texten.** Lägg sektionen i
  `FIT_SECTIONS` (`js/app.js`), kalla `fitActiveView()` efter varje renderad
  vy, och använd `var(--view-fit, 1)` i lägets mobilstorlekar — annars gör
  mätningen ingenting. Att skala textlängd per element
  (`--prompt-scale`/`--opt-scale`) löser texten men **inte totalhöjden**: på en
  liten iPhone med adressfältet framme hamnar sidfoten under fold, och då är
  primärknappen borta. Golv i CSS: 44 px träffyta och läslig text (WCAG).
  Textquizet har haft mekanismen sedan tidigare — spellägena saknade den till
  0.9.255, alltså gjorde det GAMLA läget rätt och de nya fel.
- **Rätt/fel får aldrig förmedlas med enbart färg (WCAG 1.4.1).** Använd
  `markAnswerBtn(btn, ok)` ur `js/app.js` — den sätter klassen OCH lägger till
  ✓/✗ plus dold skärmläsartext. Leitner och Tidsjakt markerade bara med färg
  fram till 0.9.255; quizet har gjort rätt hela tiden. Skriv aldrig
  `classList.add('correct')` som enda utfallsmarkering.
- **Varje nytt element som ska kunna döljas behöver en egen `.x.hidden`-regel** —
  `.hidden` är inte global i projektet (CSS_KARTA). Detta orsakade en skarp bugg i
  0.9.244 och en till i 0.9.251 (`.hs-empty` saknade regeln, så "Inga resultat än"
  låg kvar ovanpå de resultat som faktiskt fanns – i både Matcha- och
  Leitner-segmentet). **Sök efter regeln innan du använder `.hidden` på ett element
  du inte själv nyss skrivit den för.**
- **Ämnesurvalet återanvänds, kopieras aldrig:** `loadPoolForTopic()` och
  `topicMatchesSelection()` i `js/app.js` är enda upplagan. Ett nytt paraplyämne
  läggs till där, inte i spelläget.
- Egen topplista/lagring i eget localStorage-fack med export/import/rensa, och
  minnesfallback vid privat läge (`warnStorageUnavailable`).
- **Visuell verifiering på mobilviewport (390×844) före leverans** — punkt 3 ovan.
  Ett Node-DOM-skal testar logiken, aldrig utseendet.

**Läget är inte färdigt förrän alla åtta punkterna är besvarade** — var och en antingen
byggd eller medvetet löst på lägets eget vis. Ett spelläge som gör rätt sak men lämnar
dem obesvarade ska varken levereras eller presenteras som klart, och frågan "vill du
att jag lyfter spelkänslan också?" ska inte ställas: svaret är redan ja.

---

**DESSA REGLER ÄR BINDANDE FÖR ALL ARBETE PÅ ANATOMIQUIZ.**

**Senast uppdaterad:** 2026-07-25
**Version:** 2.4 – §13.1 två nya krav, båda funna genom att jämföra de NYA spellägena
mot det gamla textquizet (0.9.255). Lärdomen i sig: **kontrollera alltid om det gamla
läget redan löst problemet bättre** – flödet går i båda riktningar.
- **Vyn ska skalas till skärmen, inte bara texten:** `FIT_SECTIONS` + `fitActiveView()`
  + `var(--view-fit, 1)` i mobilstorlekarna. Per-element-skalning av textlängd löser
  inte totalhöjden; sidfoten hamnade under fold på en liten iPhone. Textquizet hade
  mekanismen sedan tidigare, de tre spellägena saknade den
- **Rätt/fel aldrig med enbart färg (WCAG 1.4.1):** använd `markAnswerBtn()`, som
  lägger till ✓/✗ och dold skärmläsartext. Leitner och Tidsjakt bröt mot det

**Version:** 2.3 – lärdomar ur bygget av **Tidsjakt** (0.9.254), skrivna proaktivt:
- **§12.1 ny stående regel: inga varumärkesnamn i kod eller text.** Ett nytt läge får
  ett synligt namn och en slug, båda fria ord som ingen firma äger, och slugen går
  rakt igenom filnamn/funktioner/id:n/CSS/localStorage. Läget hann ligga under en
  quizsajts namn i 441 kodförekomster innan det byttes — ett arbetsnamn i backloggen
  blir kod om ingen hindrar det. Gäller även jämförelser i kommentarer (skriv
  mekanismen, inte produkten); §13:s research-förlagor är undantagna
- §13.1 nytt facit för hur en punkt **anpassas i stället för kopieras**: `js/tidsjakt.js`
  löser punkt 2 som ett snabbt steg om 180 ms (klockan får inte stoppas) och punkt 3
  med klockan **som** mätare plus ett spökmål (personbästa syns under spelet).
  Anpassningen ska motiveras i planen med "så här löser läget samma behov", aldrig
  med "punkten passar inte"
- §13.1 punkt 8 skärpt: nollställ bara fördröjningar som **är** rörelse. En fördröjning
  som utgör tiden något syns (facit i ett snabbhetsspel) är information, och att nolla
  den vid `prefers-reduced-motion` skapar exakt den uteblivna information regeln
  förbjuder. Fråga per fördröjning: rör den något, eller visar den något?
- §12/§13.1 uppräkningarna rättade – Tidsjakt är byggt, kvar är Dagens utmaning
  + streak och Arkad/Gravity

**Version:** 2.2 – §13.1 nytt krav (0.9.253, på användarens kritik av Leitners första
förklaring): **ett spelläge ska förklara sig självt i spelvyn för någon som aldrig spelat
det** – vad det går ut på och varför, inte bara vilka knappar som finns. En mening om
mekaniken räcker inte. Uppfälld automatiskt för förstagångsspelaren, hopfälld sedan; och
spelplanen görs självförklarande där det går (Leitners lådor skyltar med sina intervall).

**Version:** 2.1 – lärdomar ur Leitner-bygget (0.9.251), skrivna proaktivt enligt §0:
- §12 cachebustern **automatiseras** – `bump_version.py` sätter numera `?v=` för varje
  ändrad `js/*.js` och `css/*.css` i alla sidor som refererar dem, plus generatorernas
  `STYLES_V`/`CSS_V`. Den gamla formuleringen ("sätts för hand tills skriptet lär sig
  dem") var i sig ett regelbrott mot §0.3: 116 sidor refererar `styles.css`
- §13.1 `.hidden`-fällan slog till igen, nu på en **delad** klass (`.hs-empty`) som
  redan fanns – leta efter dölj-regeln med grep INNAN `classList.add('hidden')` skrivs,
  även på element du inte själv skapat (CSS_KARTA har det praktiska greppet)
- §13.1 ämnesurvalet (`loadPoolForTopic`, `topicMatchesSelection`) ligger i EN upplaga
  i `js/app.js` – ett nytt spelläge kopierar det aldrig

**Version:** 2.0 – §13.1 ny stående regel (2026-07-25, på uttrycklig begäran): **Matcha-standarden är golvet för varje nytt spelläge** och ska aldrig behöva efterfrågas:
- åtta punkter som ska sitta i det FÖRSTA bygget, inte i ett polish-pass efteråt: mikroåterkoppling, sekventiell reveal som payoff, framstegsmätare över hela spelet, beröm vid delmål, ett riktigt slut med resultatring + rekordmärke, avstängbart ljud/haptik, estetik & mobilkänsla, `prefers-reduced-motion`
- **principen är bindande, inte formen** – varje punkt ska vara medvetet besvarad i planen och anpassad efter det enskilda spelets mekanik; det som aldrig får hända är att en punkt tyst uteblir
- facit och kopieringsmall: `js/matcha.js` + `.matcha-*` i `css/styles.css` (0.9.247)

**Version:** 1.9 – kodifierade två feltyper ur granskningen av `franska_termer.json` (2026-07-22), på uttrycklig begäran efter att användaren själv hittade dem:
- §2.9 kategori-/typläckage i namn-frågor: "Namn + generisk beteckning" (`Dupuytrens kontraktur` mot `Aperts syndrom`/`Charcots led`) avslöjar typen via frågans egen beskrivning, utan att man behöver känna till personen. Fix: bart namn, eller samma beteckning på alla alternativ
- §2.9 språkparitet utökad från "latin/svenska" till att uttryckligen gälla ALLA språk: en hybrid (`Sårtoalett`) bland rena lånord ur ett testat språk är samma formtell
- §8 checklistan utökad med båda punkterna
- §10.1: 0/0 från validatorn betyder bara "inga kända tells" – nya feltyper måste hittas genom att faktiskt läsa frågorna, inte genom att lita på skriptet

**Version:** 1.8 – kodifierade två feltyper ur arbetsterapeut-svepets punkt 3b (2026-07-20):
- §2.4 TF-fråga felmärkt `"type": "mc"` – faller ur både `tfPool` och `mcPool` i `js/app.js`
  och dras därför i praktiken aldrig. 62 verkliga fall. **Nu ett fel i `validate_quiz.py`**
- §2.9 fälla 3: att rätta längdbias i en symmetrisk antingen/eller-fråga bryter symmetrin och
  gör frågan självbesvarande i stället (`muskler` q41–q44) – bygg om frågan till öppen form

**Version:** 1.7 – kodifierade TF-skevheten ur arbetsterapeut-svepets punkt 2 (2026-07-20):
- §2.4 TF-balans: 84 % "Sant" i arbetsterapeuten gjorde att man kunde svara "Sant" rakt igenom.
  Mål 40–60 % per ämne, vändningsmönstret (byt EN sak, aldrig bara "inte") och kollisionsfällan
  mot befintliga Falskt-frågor. Validatorn kollar det inte – mät själv
- §8 checklistan utökad med TF-balansen

**Version:** 1.6 – kodifierade tre feltyper ur arbetsterapeut-svepet (2026-07-20):
- §1.1 påhittat `os`-prefix på bennamn som inte bär det ("os femur", "Os mandibula") – med lista över
  vilka namn som faktiskt tar `os`, och grep-testet. Ger dessutom en språkparitets-tell i §2.9
- §2.9 kvasi-absoluta ord "bara"/"alla" – samma tell som absolut-orden men **medvetet utanför validatorn**
  (544 projektbreda träffar, mest legitima) → manuell kontroll, inte maskinregel
- §6.3 filler-varianterna "Inget av ovanstående/alternativen" – nu i validatorns `FILLER`-regex

**Version:** 1.5 – kodifierade två feltyper ur läkarsvepet (2026-07-19), §2.12b punkt 7 och 8:
- §2.12b:7 prompten frågar efter något annat än svaret ger, eller bär en kvalificerare som gör en distraktor sann (`lak_buk_72`, `lak_rygg_81`, `lak_buk_80`)
- §2.12b:8 fel böjning av latinska/grekiska fackord i svarstexten ("nodierna", "tuberae ischiadica", "kaspadkaskad") – greppa filen, samma form återkom i flera ämnen

**Version:** 1.4 – kodifierade feltyperna ur granskningssvepet (fysioterapeut, BMA, medicinsk sekreterare), på uttrycklig begäran ("minnet räcker ej"):
- §2.9 ekoregeln utökad: ekot räknas även när ordet böjts om (*medialis* → "Medial", *supinatio* → "Supination") – svaret ska vara termens BETYDELSE, inte termen i svensk språkdräkt. Med undantaget att böjningsfrågor (*vertebra* → "Vertebrae") är korrekta
- §2.12b ny: sju feltyper som validatorn INTE fångar, med verkliga fråge-id – framför allt distraktorer som råkar vara sanna (två rätta svar), uppfunna fackuttryck, distraktorer från fel ämnesområde och osynliga tecken
- §5.6 ny stående regel: ny sorts fel upptäckt → skriv in den i det här dokumentet i samma arbetspass, inte bara i minnet; överväg alltid om den går att fånga i `validate_quiz.py`

**Version:** 1.3 – §2.9 utökad med längdbias-lärdomen från sjuksköterske-bygget (2026-07-18), på uttrycklig begäran ("minnet räcker ej"):
- §2.9 längdparitet: kunskaps-/förklaringsfrågor drar systematisk längdbias – skriv distraktorerna som fullständiga, konkret felaktiga påståenden i samma längd FRÅN START (inte korta etiketter)
- §2.9 parentesregeln utökad: gäller även term-synonymer enbart på rätt svar (`Glomerulus (kapselnystanet)` osv) – dubbel tell (avslöjar + gör längst)

**Version:** 1.2 – kodifierade svep-lärdomarna som tidigare bara låg i Claudes minne (minnet räcker inte – reglerna är facit):
- §2.12 positiv mall: så här skrivs en bra distraktor (konkret fel + gissa-testet + före→efter-tabell)
- §2.13 validatorn är facit + bygg rätt från början + kör skriptet efter varje ändring (kostnadsregel)
- §2.9 utökad: tre fällor när man RÄTTAR en tell (negations-svans, omvänd längdbias, återinfört absolut-ord)
- §8 checklistan utökad med absolut-ord, självutpekande, gissa-test, antals-paritet och validator-körning
- §10.1 lärdomarna från fysio-svepet 2026-07-16 (hela svepet klart)

**Version 1.1** (2026-07-10) – kodifierade nio quiz-regler ur minnet:
- §1.5 korrekt & pedagogisk svenska (räknebarhet m.m.)
- §2.9 svarsalternativens form får aldrig avslöja svaret (längdparitet, inga avslöjande parenteser, ej självbesvarande)
- §2.10 bildfrågor måste ha tom prompt
- §2.11 inga dublettfrågor, men unikhet gäller bara inom ämnet
- §3.2b kursunderlaget vinner – överkör inte källan
- §3.2c skyddad källfil `medicinsk_terminologi.json`
- §7.1 kolla ämnesöverlapp i delad per-utbildningsfil innan nytt ämne skrivs
