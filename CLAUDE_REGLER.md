# Anatomiquiz - Instruktioner och Regler för Claude

## Övergripande Princip
Detta dokument definierar ALLA regler och instruktioner för att bygga och underhålla anatomiquiz-databasen. Dessa regler gäller för ALL arbete på projektet - nuvarande och framtida ämnen/tillägg. Följ ALLTID dessa regler utan undantag.

> **Webb / SEO / kod:** Allt som rör HTML, `<head>`, titlar, descriptions, sitemap, llms.txt,
> CSS, JSON-LD, tillgänglighet, prestanda och agenter styrs av **[`SEO_REGLER.md`](SEO_REGLER.md)**.
> Läs och följ den **innan** du rör någon sida, och bocka av dess pre-flight-checklista före commit.
> CLAUDE_REGLER täcker innehåll/quiz/JSON; SEO_REGLER täcker koden runt omkring. Båda är bindande.

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
- **Språkparitet (latin/svenska):** Alla alternativ ska ligga i samma språkregister. Rätt svar får inte vara det enda på latin (eller det enda på svenska) och sticka ut så. Antingen alla alternativ på latin eller alla på svenska.
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
- **Så här:** lägg feltypen under §2.12b (fel som validatorn inte fångar) eller §2.9 (formtells), med **ett verkligt exempel med fråge-id**, varför det är fel, och hur man testar för det. Ett påhittat exempel duger inte – ta det som faktiskt hittades.
- **Överväg alltid om felet går att fånga maskinellt.** Kan det uttryckas som en regel över `prompt`/`correct`/`distractors` hör det hemma i `scripts/validate_quiz.py`, inte bara i prosa. Går det inte att automatisera – skriv ut testet som en manuell kontroll.
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

**DESSA REGLER ÄR BINDANDE FÖR ALL ARBETE PÅ ANATOMIQUIZ.**

**Senast uppdaterad:** 2026-07-20
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
