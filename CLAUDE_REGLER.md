# Anatomiquiz - Instruktioner och Regler för Claude

## Övergripande Princip
Detta dokument definierar ALLA regler och instruktioner för att bygga och underhålla anatomiquiz-databasen. Dessa regler gäller för ALL arbete på projektet - nuvarande och framtida ämnen/tillägg. Följ ALLTID dessa regler utan undantag.

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
**Format:** 1 korrekt svar + 3 distraktorer (TOTALT 4 alternativ)

- ALLA MC-frågor MÅSTE ha exakt 4 alternativ
- 1 = korrekt svar
- 3 = semantiskt relevanta distractors
- **INGEN FRÅGA får ha:**
  - Bara 1-2 alternativ
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

### 6.5 För Få Alternativ
- Varje MC-fråga behöver EXAKT 4 alternativ
- Aldrig 2-3 alternativ för MC-frågor

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
- [ ] ALLA MC-frågor har exakt 4 alternativ (1 korrekt + 3 distraktorer)
- [ ] INGA dubbletter mellan "correct" och "distractors"
- [ ] INGA filler-alternativ ("Annat", "Ingen av dessa", osv)
- [ ] ALLA alternativ är semantiskt relevanta för frågan
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

**Senast uppdaterad:** 2026-05-28
**Version:** 1.0
