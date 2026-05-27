# Anatomiquiz

Version: 0.3.0 — 2026-05-27

En interaktiv webapp för anatomifrågor på svenska. Testa dina kunskaper om skelett, muskler, organ och mer.

Kör lokalt (enkelt sätt):

```bash
cd /home/norrtou/Documents/Kod/anatomiquiz
python3 -m http.server 8000
# eller: npx serve .
# öppna sedan http://localhost:8000
```

Struktur:
- index.html — appens gränssnitt
- css/styles.css — styling
- js/app.js — quizlogik
- data/questions.json — alla frågor (lägg till fler här)

Funktioner för frågor och validering
 - Appen stöder upp till 500 frågor. Om `data/questions.json` innehåller färre än 500 genereras platshållare (icke-medicinska) för att fylla upp listan. Platshållarna är märkta och ska ersättas med riktiga, faktagranskade frågor senare.
 - Du kan markera frågor som "Felaktig" (rapporterad) och/eller "Uteslut" (temporärt utesluten från quizet). Markeringar sparas i `localStorage` så att du kan granska och hantera dem i gränssnittet.
- Kör `scripts/validate_questions.py` för att få en icke-destruktiv valideringsrapport om frågornas format.

Import / export
 - I vyn "Hantera frågor" finns ett fält för att importera en JSON-fil med frågor. Denna import slår ihop nya frågor i minnet och uppdaterar hanteringsvyn — den skriver inte automatiskt till `data/questions.json`. Efter import kan du ladda ner den sammanslagna filen manuellt om du vill ersätta `data/questions.json`.
 - I vyn "Rapporterade frågor" finns en knapp för att exportera de rapporterade frågorna som en JSON-fil.

Kommentar i koden
- I `js/app.js` finns kommentarer som förklarar att platshållarna måste importeras senare och att appen inte uppfinner medicinska fakta.

Lägga till frågor:
 - Följ formatet i `data/questions.json`.
 - Fält: `id`, `prompt`, `correct`, `distractors` (array med 3–5 förslag), `topic`, `difficulty`, `source`.
- Appen slumpmässigt blandar svaren och filtrerar på `topic` och `difficulty`.

Källor:
- Använd etablerade läroböcker i anatomi och Terminologia Anatomica när du lägger till fler frågor.
