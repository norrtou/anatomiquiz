# Anatomiquiz 🧬

En modernt utformad interaktiv anatomiquiz för att testa dina kunskaper om skelett, muskler, organ och anatomi. 

## ✨ Funktioner

- **Interaktiv quiz** – Välj svårighetsgrad, antal frågor och tidspress
- **Topplista** – Spara och jämför dina resultat
- **Frågekontroll** – Rapportera felaktiga frågor direkt i appen
- **Responsiv design** – Fungerar perfekt på mobil, surfplatta och dator
- **Modern gränssnitt** – Vacker grön design med smidiga animationer
- **Tillgänglighet** – Fokus på användarupplevelse för alla

## 🚀 Komma igång

Öppna helt enkelt [anatomiquiz](https://github.com/norrtou/anatomiquiz) i en webbläsare – inga installationer behövs!

1. Välj dina quizinställningar (ämne, svårighetsgrad, antal frågor)
2. Ange ditt namn
3. Starta quizet och testa dina kunskaper
4. Se dina resultat och spara på topplistan

## 📚 Frågor

Appen kommer med en grund av anatomifrågor. Du kan:

- **Lägg till frågor** – Importera nya frågor via JSON-formatet
- **Hantera frågor** – Granska och uppdatera frågorna i appen
- **Rapportera fel** – Markera felaktiga frågor för senare granskning
- **Exportera** – Ladda ner rapporterade frågor för analys

### Frågeformat

Följ denna struktur när du lägger till nya frågor:

```json
{
  "id": "unique-id",
  "prompt": "Vilken ben är längst i kroppen?",
  "correct": "Lårbenet (femur)",
  "distractors": ["Skenbenet", "Vaden", "Höftbenet"],
  "topic": "skelett",
  "difficulty": "Normal",
  "source": "Lärobok eller källa"
}
```

**Fält:**
- `id` – Unikt identifikator
- `prompt` – Själva frågan
- `correct` – Det rätta svaret
- `distractors` – 3-5 felaktiga svar
- `topic` – Kategori (t.ex. "skelett", "muskler", "organ")
- `difficulty` – "Easy", "Normal" eller "Hard"
- `source` – Källa eller lärobok

## 📖 Medicinsk ordlista

Sajten har en medicinsk ordlista (`medicinskordlista.html`) som byggs ut till att täcka all medicinsk terminologi på svenska. Syfte, datamodell och arbetsgång (inkl. hur poster berikas bokstav för bokstav) beskrivs i **[ORDLISTA.md](ORDLISTA.md)**.

## 🔎 IndexNow (sökmotor-ping)

Sajten använder [IndexNow](https://www.indexnow.org/) för att meddela Bing/Yandex m.fl. direkt när innehåll ändrats. Google deltar inte – `sitemap.xml` är fortsatt huvudvägen dit.

- **Nyckelfil:** `ff1efd99d9aa024279a96e753a78c317.txt` i roten (måste ligga kvar; bevisar domänägande).
- **Automatik:** `.github/workflows/indexnow.yml` körs när GitHub Pages-bygget är live (`page_build`) och postar URL:erna ur `sitemap.xml`. Inget manuellt steg behövs.
- **Manuell körning:** Actions-fliken → *IndexNow* → *Run workflow* (`workflow_dispatch`).

## 🛠️ Utveckling

För att bidra eller utveckla vidare:

```bash
# Klona repot
git clone https://github.com/norrtou/anatomiquiz.git

# Öppna index.html i en webbläsare
# eller starta en lokal server:
python3 -m http.server 8000
```

## 📄 Licens

Fritt att använda och modifiera för utbildningsändamål.

## 🤝 Bidrag

Förslag på nya frågor och förbättringar är välkomna! Öppna ett issue eller skicka en pull request.
