# Anatomiquiz – gratis anatomiquiz och medicinsk ordlista på svenska

**▶ Öppna appen: [anatomiquiz.se](https://anatomiquiz.se)**

Anatomiquiz är en svensk webbapp för att plugga anatomi, fysiologi och medicinsk terminologi inför tentan. Träna med flervalsfrågor om skelett, muskler, leder, nerver, kärl, organ och neurologi – och slå upp fackterminologin i en medicinsk ordlista. Gratis, utan inloggning och utan installation, direkt i webbläsaren på mobil, surfplatta eller dator.

## Innehåll på sajten

| Del | Omfattning | Länk |
| --- | --- | --- |
| **Quiz** | 11 800+ frågor i 88 ämnen, med svårighetsgrad, tidspress och topplista | [anatomiquiz.se](https://anatomiquiz.se/) |
| **Medicinsk ordlista** | 11 100+ uppslagsord A–Ö: anatomiska latinska termer, sjukdomar med ICD-10-koder, labbprover med referensvärden, prefix och suffix | [medicinskordlista.html](https://anatomiquiz.se/medicinskordlista.html) |
| **Kunskapsbank** | 60+ faktasidor: muskeltabeller, ledtabeller, nerv- och kärltabeller, kranialnerverna, medicinskt latin och grekiska, läkemedelsberäkning | [/kunskapsbank/](https://anatomiquiz.se/kunskapsbank/) |
| **Patientfall** | Kliniska case att resonera kring | [case.html](https://anatomiquiz.se/case.html) |
| **Om sajten och källor** | Bakgrund, författare och referenslista | [info.html](https://anatomiquiz.se/info.html) |

## Vem den är till för

Quizet är uppdelat per vårdutbildning, så att man bara får frågor som är relevanta för sin egen kurs:

Läkare · Sjuksköterska · Fysioterapeut · Biomedicinsk analytiker · Tandläkare · Röntgensjuksköterska · Medicinsk sekreterare · Logoped · Apotekare · Optiker · Audionom · Arbetsterapeut – plus ett allmänt spår för alla som vill öva blandad anatomi och fysiologi.

## Bakom sajten

Anatomiquiz är byggd och skriven av Daniel Medin – **[norrtou.se](https://norrtou.se)**. Frågor, tabeller och faktatexter är källförankrade i kurslitteratur och medicinska referensverk; se referenslistorna på respektive sida och [Om Anatomiquiz](https://anatomiquiz.se/info.html).

## Teknik

Statisk sajt (HTML, CSS och vanilla JavaScript) som körs på GitHub Pages med egen domän. Frågor, ordlista och tabeller ligger som JSON i `data/` och renderas i klienten; ordlistan förrenderas dessutom till en sida per bokstav med `scripts/generate_glossary.py`.

Ordlistans syfte, datamodell och arbetsgång beskrivs i **[ORDLISTA.md](ORDLISTA.md)**.

### IndexNow (sökmotor-ping)

Sajten använder [IndexNow](https://www.indexnow.org/) för att meddela Bing, Yandex m.fl. direkt när innehåll ändrats. Google deltar inte – `sitemap.xml` är fortsatt huvudvägen dit.

- **Nyckelfil:** `ff1efd99d9aa024279a96e753a78c317.txt` i roten (måste ligga kvar; bevisar domänägande).
- **Automatik:** `.github/workflows/indexnow.yml` körs när GitHub Pages-bygget är live (`page_build`) och postar URL:erna ur `sitemap.xml`.
- **Manuell körning:** Actions-fliken → *IndexNow* → *Run workflow* (`workflow_dispatch`).
