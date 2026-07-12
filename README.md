# Anatomiquiz 🧬

En modernt utformad interaktiv anatomiquiz för att testa dina kunskaper om skelett, muskler, organ och anatomi.

Skapad av [norrtou.se](https://norrtou.se).

## ✨ Funktioner

- **Interaktiv quiz** – Välj svårighetsgrad, antal frågor och tidspress
- **Topplista** – Spara och jämför dina resultat
- **Frågekontroll** – Rapportera felaktiga frågor direkt i appen
- **Responsiv design** – Fungerar perfekt på mobil, surfplatta och dator
- **Modern gränssnitt** – Vacker grön design med smidiga animationer
- **Tillgänglighet** – Fokus på användarupplevelse för alla

## 🚀 Komma igång

1. Välj dina quizinställningar (ämne, svårighetsgrad, antal frågor)
2. Ange ditt namn
3. Starta quizet och testa dina kunskaper
4. Se dina resultat och spara på topplistan

## 📖 Medicinsk ordlista

Sajten har en medicinsk ordlista (`medicinskordlista.html`) som byggs ut till att täcka all medicinsk terminologi på svenska. Syfte, datamodell och arbetsgång (inkl. hur poster berikas bokstav för bokstav) beskrivs i **[ORDLISTA.md](ORDLISTA.md)**.

## 🔎 IndexNow (sökmotor-ping)

Sajten använder [IndexNow](https://www.indexnow.org/) för att meddela Bing/Yandex m.fl. direkt när innehåll ändrats. Google deltar inte – `sitemap.xml` är fortsatt huvudvägen dit.

- **Nyckelfil:** `ff1efd99d9aa024279a96e753a78c317.txt` i roten (måste ligga kvar; bevisar domänägande).
- **Automatik:** `.github/workflows/indexnow.yml` körs när GitHub Pages-bygget är live (`page_build`) och postar URL:erna ur `sitemap.xml`. Inget manuellt steg behövs.
- **Manuell körning:** Actions-fliken → *IndexNow* → *Run workflow* (`workflow_dispatch`).

## 📄 Licens

Fritt att använda och modifiera för utbildningsändamål.
