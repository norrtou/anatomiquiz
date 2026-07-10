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
- **ALDRIG:** Helt irrelevanta ord för att fylla ut
- Alla alternativ måste kunna motiveras med "detta är också ett ben/en muskel/en riktning"

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
  - **Mät:** andelen frågor där `correct` är längst ska ligga nära slumpnivån (~25 % vid 4 alternativ), inte 50–90 %.
  - **Åtgärda i första hand** genom att bygga ut distraktorerna till jämförbar längd (fortsatt faktamässigt fel, inte fyllnadsord). I andra hand korta ner rätt svar – och då till en **komplett, kortare mening**, aldrig en avhuggen fras.
  - Numeriska frågor ("Cirka 6–8 månader"): ge minst en distraktor samma format (ett intervall), så längden inte skiljer.
  - ⛔ Korta ALDRIG rätt svar maskinellt/automatiskt (t.ex. klipp vid kommatecken) – det stympar meningen ("En automatisk", "Ja"). Skriv om för hand och läs igenom.
- **Inga avslöjande parenteser:** Lägg ALDRIG extra förklaring/exempel inom parentes enbart på rätt svar. Asymmetrin mot distraktorerna avslöjar svaret. Håll rätt svar lika kortfattat som distraktorerna.
- **Rätt svar får inte ekas i frågan:** Frågetexten får inte innehålla svarstermen verbatim så att frågan blir självbesvarande. Skräckexempel: `medsek_diagnoskodning`-frågan "Vad kallas de Z-koder…" med `correct: "Z-koder"` – svaret stod redan i frågan. Symmetriska antingen/eller-frågor där båda kandidaterna nämns är OK.
- **Numerisk-/format-paritet:** Rätt svar får inte vara det enda alternativet som är numeriskt eller format-mässigt korrekt. Efterfrågas ett antal/en siffra ska ALLA alternativ vara tal. Efterfrågas ett visst antal saker (plural) ska ALLA alternativ innehålla exakt lika många – t.ex. om rätt svar listar tre strukturer måste varje distraktor också lista tre, aldrig två eller fyra. Annars kan man räkna sig fram till svaret utan sakkunskap.
- **Språkparitet (latin/svenska):** Alla alternativ ska ligga i samma språkregister. Rätt svar får inte vara det enda på latin (eller det enda på svenska) och sticka ut så. Antingen alla alternativ på latin eller alla på svenska.

### 2.10 BILDFRÅGOR MÅSTE HA TOM PROMPT
**STÅENDE REGEL (påtalad flera gånger – får ALDRIG upprepas).** Varje bildfråga (quiz-objekt med `"image": "<id>"`) ska ha **tom `prompt`** (`""`). Lägg ALDRIG en synlig prompt på en bildfråga.

- **Varför:** den kompakta mobillayouten `.quiz-image` är tunad så att bild + svarsalternativ + Nästa-knapp ryms på EN mobilskärm utan scroll. En synlig prompt knuffar svaren/Nästa under fold, särskilt på liten iPhone. "Bilden ÄR frågan."
- Låt svarsalternativen göra frågan självklar (ben → Os-namn, leder → Articulatio-namn). Skärmläsar-alt sätts av app.js.
- Distraktor-regel för bildfrågor: ett förälder-/grupp-/översiktsnamn får ALDRIG vara distraktor till en mer specifik bild (då blir det två rätta svar).
- Kontrollera ALLTID denna regel innan bildfrågor wiras in.

### 2.11 INGA DUBLETTFRÅGOR – MEN UNIKHET GÄLLER BARA INOM ÄMNET
- **Aldrig duplicera hela frågor** (samma id eller samma frågetext) utan explicit tillåtelse. Kopiera/`cp`/copypasta ALDRIG frågor mellan filer för att fylla på antal. Ladda aldrig samma fil två gånger för samma quiz.
- **Men unikhetskravet gäller bara inom det ämne som byggs**, inte mot andra ämnen eller andra utbildningar. Skriv INTE i CHANGELOG/commit att frågor jämförts mot "hela filen" eller mot andra namngivna ämnen – skriv bara "alla X frågor i ämnet kontrollerade unika". Att aktivt leta efter och narrativisera cross-ämnes-överlapp är inte efterfrågat.

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
- [ ] INGA dubbletter mellan "correct" och "distractors"
- [ ] INGA filler-alternativ ("Annat", "Ingen av dessa", osv)
- [ ] ALLA alternativ är semantiskt relevanta för frågan
- [ ] Rätt svar är INTE systematiskt längst (ingen längdbias); distraktorer jämförbart långa (§2.9)
- [ ] INGA avslöjande parenteser enbart på rätt svar (§2.9)
- [ ] Frågetexten ekar inte svaret verbatim (ej självbesvarande) (§2.9)
- [ ] INGA incompleta meningar i frågorna
- [ ] ALLA termer är verifierade mot anatomisk litteratur
- [ ] Filstruktur är korrekt (JSON, topics, IDs)

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
- **Maskinell trimning av rätt svar** som stympar meningen ("En automatisk", "Ja") – skriv alltid om för hand

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

**Senast uppdaterad:** 2026-07-10
**Version:** 1.1 – kodifierade nio quiz-regler som tidigare bara låg i Claudes minne:
- §1.5 korrekt & pedagogisk svenska (räknebarhet m.m.)
- §2.9 svarsalternativens form får aldrig avslöja svaret (längdparitet, inga avslöjande parenteser, ej självbesvarande)
- §2.10 bildfrågor måste ha tom prompt
- §2.11 inga dublettfrågor, men unikhet gäller bara inom ämnet
- §3.2b kursunderlaget vinner – överkör inte källan
- §3.2c skyddad källfil `medicinsk_terminologi.json`
- §7.1 kolla ämnesöverlapp i delad per-utbildningsfil innan nytt ämne skrivs
