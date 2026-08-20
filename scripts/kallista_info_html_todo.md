# TODO: komplettera källistan i `info.html`

**Status:** UTFÖRD 2026-08-20 (0.9.423). Skapad 2026-07-20.
54 nya poster inskrivna, listan gick 91 → **145 poster**. Tre poster ur listan visade sig
redan ligga inne sedan filen skrevs, två går inte att skriva in utan att gissa — se
**"Kvar att lösa"** sist i filen. **Status läses i kryssrutorna nedan, inte i minnesindexet.**
**Regel som styr detta:** `CLAUDE_REGLER.md` §3.2d (använda källor ska in i info.html,
hellre för många än för få, goda akademiska källor, gissa aldrig bibliografiska data,
radera aldrig en källa). Format: APA 7, alfabetisk (svensk kollation: å/ä/ö sist), titel i `<em>`.

## Läge

Källistan i `info.html` (sektionen "Källor och kvalitetssäkring") gick 2026-07-20 från
6 → **17 poster**. En census över alla `source`-fält i `data/*.json` visade dock ~75 riktiga
bibliografiska källor. **59 kvarstod att föra in** enligt listan nedan.

**2026-08-20:** listan hade hunnit växa till **91 poster** av annat arbete (akutmedicin-
utbyggnaden, artiklarna) och gick i det här passet till **145**. Censusen kördes om över
`data/**/*.json` och gav 161 distinkta `source`-strängar, varav ~75 riktiga bibliografiska
källor — resten är ämnesnamn, flashcard-etiketter och eget material.

Census återskapas med:

```bash
python3 -c "
import json,glob,collections
c=collections.Counter()
for f in glob.glob('data/*.json'):
    try: d=json.load(open(f))
    except: continue
    def walk(o):
        if isinstance(o,dict):
            if 'source' in o and isinstance(o['source'],str): c[o['source']]+=1
            for v in o.values(): walk(v)
        elif isinstance(o,list):
            for v in o: walk(v)
    walk(d)
s=collections.Counter()
for k,n in c.items():
    for p in k.split(';'): s[p.strip()]+=n
for k,n in s.most_common(200): print(f'{n:5} | {k}')
"
```

## Arbetssätt

1. **Slå upp år, upplaga och förlag för varje titel** – `source`-fälten innehåller bara
   författare + titel. Gissa aldrig. Kontrollera även att upplagan faktiskt är **utgiven**
   (Boron & Boulpaep 4:e uppl. var pre-order till dec 2027 → 3:e uppl. 2016 citerades).
2. **Kolla först om posten redan finns färdigskriven i repot** innan du söker på webben –
   `kunskapsbank/*.html` har granskade `kb-sources`-block att skörda:
   ```bash
   python3 -c "
   import re,glob
   for f in glob.glob('kunskapsbank/*.html'):
       for b in re.findall(r'<div class=\"kb-sources\">(.*?)</div>', open(f).read(), re.S):
           for li in re.findall(r'<li>(.*?)</li>', b, re.S):
               print(re.sub(r'<[^>]+>','',li).strip())
   " | sort -u
   ```
   **Redan skördbar därifrån:** FitzGerald (2012, 6:e uppl., Saunders/Elsevier).
3. Skriv in i `<ul>` i info.html på rätt alfabetisk plats, `&amp;` för `&`, `<em>` runt titeln,
   webbkällor med `<a … target="_blank" rel="noopener noreferrer" class="info-link">`.
4. Verifiera ordning + antal efteråt (svensk kollation, å/ä/ö sist).

## Slå ihop dubbletter vid införandet

Tre källor står i två varianter i `source`-fälten och ska bli **en** post var:

- `Ross & Pawlina, Histology` (158) + `Ross & Pawlina, Histology: A Text and Atlas` (97)
- `Hoffbrand & Moss, Essential Haematology` (100) + `Hoffbrand, Essential Haematology` (59)
- `Purves m.fl., Neuroscience` (18) + `Purves, Neuroscience` (2)

## Att kontrollera

- ✅ `ISO 389` och `ISO 8253` är **standarder**, inte böcker. Inskrivna med utgivande organ
  som författare. `source`-fältet namnger bara **serien**, inte vilken del innehållet vilar på;
  del 1 i vardera serien är den som bär referensnollnivåerna respektive rentonsmetodiken, så
  det är den som citerats: **ISO 389-1:2017** och **ISO 8253-1:2010**. Titlarna är hämtade
  ordagrant ur ISO:s egna standardblad (engelska), inte översatta på egen hand. Skulle det visa
  sig att en annan del faktiskt användes är det bara att lägga till den posten också.
- ✅ `Vårdhandboken` och `Läkemedelsräkning för sjuksköterskor` behövde inte lösas — båda hade
  redan skrivits in i listan av annat arbete (Inera, 2023 respektive Björkman & Hagberg, 2023).
- ⛔ `Journalföring och medicinsk dokumentation för vårdadministratörer` gick **inte** att slå
  upp. Se "Kvar att lösa".
- ✅ `Hirano, Structure and function of the vocal fold (cover-body-modellen)` är en **artikel**,
  precis som filen misstänkte: Hirano, M. (1974). Morphological structure of the vocal cord as
  a vibrator and its variations. *Folia Phoniatrica, 26*(2), 89–94, doi 10.1159/000263771.
  Inskriven som tidskriftsartikel med DOI.

## Kvarstående källor (59) — 57 avklarade, 2 kvar

- [x] **Arlinger, Nordisk lärobok i audiologi** — 500 frågor
- [x] **Remington, Clinical Anatomy and Physiology of the Visual System** — 500 frågor
- [x] **Rang & Dale's Pharmacology, 10 uppl.** — 500 frågor
- [x] **Katzung, Basic & Clinical Pharmacology** — 500 frågor
- [x] **McPherson & Pincus, Henry's Clinical Diagnosis and Management by Laboratory Methods** — 429 frågor
- [x] **Magee, Orthopedic Physical Assessment** — 348 frågor
- [x] **Kanski, Clinical Ophthalmology** — 300 frågor
- [x] **Lundy-Ekman, Neuroscience: Fundamentals for Rehabilitation** — 243 frågor
- [x] **Neumann, Kinesiology of the Musculoskeletal System** — 191 frågor
- [x] **Junqueira & Mescher, Basic Histology: Text and Atlas** — 188 frågor
- [x] **Ross & Pawlina, Histology** — 158 (+97) frågor
- [x] **Seikel, King & Drumright, Anatomy & Physiology for Speech, Language, and Hearing** — 121 frågor
- [x] **Bontrager & Lampignano, Textbook of Radiographic Positioning and Related Anatomy** — 119 frågor
- [x] **Mettler & Guiberteau, Essentials of Nuclear Medicine and Molecular Imaging** — 103 frågor
- [x] **Pickles, An Introduction to the Physiology of Hearing** — 100 frågor
- [x] **Baloh & Honrubia, Clinical Neurophysiology of the Vestibular System** — 100 frågor
- [x] **Musiek & Baran, The Auditory System** — 100 frågor
- [x] **Moore, An Introduction to the Psychology of Hearing** — 100 frågor
- [x] **ISO 389** — 100 frågor (standard, se ovan)
- [x] **ISO 8253** — 100 frågor (standard, se ovan)
- [x] **Snell & Lemp, Clinical Anatomy of the Eye** — 100 frågor
- [x] **Atchison & Smith, Optics of the Human Eye** — 100 frågor
- [x] **Forrester, The Eye: Basic Sciences in Practice** — 100 frågor
- [x] **Schwartz, Visual Perception** — 100 frågor
- [x] **von Noorden & Campos, Binocular Vision and Ocular Motility** — 100 frågor
- [x] **Evans, Pickwell's Binocular Vision Anomalies** — 100 frågor
- [x] **Sjöqvist, Läkemedelsboken** — 100 frågor → inskriven som **Läkemedelsverket (u.å.)**, se not nedan
- [x] **Hoffbrand & Moss, Essential Haematology** — 100 (+59) frågor
- [x] **Läkemedelsräkning för sjuksköterskor** — 100 frågor (upphovsman saknas) → låg redan inne (Björkman & Hagberg, 2023)
- [x] **Vårdhandboken** — 100 frågor (utgivare saknas) → låg redan inne (Inera, 2023)
- [ ] **Björk & Kirkevold, Klinisk omvårdnad** — 100 frågor
- [x] **Murray, Rosenthal & Pfaller, Medical Microbiology** — 90 frågor
- [x] **Nanci, Ten Cate's Oral Histology** — 64 frågor
- [ ] **Journalföring och medicinsk dokumentation för vårdadministratörer** — 64 frågor (upphovsman saknas)
- [x] **Logemann, Evaluation and Treatment of Swallowing Disorders** — 57 frågor
- [x] **Zemlin, Speech and Hearing Science: Anatomy and Physiology** — 52 frågor
- [x] **Möller & Reif, Pocket Atlas of Radiographic Anatomy** — 51 frågor
- [x] **Duffy, Motor Speech Disorders: Substrates, Differential Diagnosis, and Management** — 43 frågor
- [x] **Okeson, Management of Temporomandibular Disorders and Occlusion** — 40 frågor
- [x] **Abbas, Cellular and Molecular Immunology** — 39 frågor
- [x] **Kaufman & Lee, Vascular and Interventional Radiology** — 34 frågor
- [x] **Gelfand, Hearing: An Introduction to Psychological and Physiological Acoustics** — 32 frågor
- [x] **Alberts m.fl., Molecular Biology of the Cell** — 29 frågor
- [x] **Berkovitz, Holland & Moxham, Oral Anatomy, Histology and Embryology** — 29 frågor
- [x] **Newman, Takei, Klokkevold & Carranza, Clinical Periodontology** — 28 frågor
- [x] **Ash & Nelson, Wheeler's Dental Anatomy, Physiology, and Occlusion** — 23 frågor
- [x] **FitzGerald, Clinical Neuroanatomy and Neuroscience** — 20 frågor ← finns redan i repot → låg redan inne (Fitzgerald, Gruener & Mtui, 2012)
- [x] **Boone & McFarlane, The Voice and Voice Therapy** — 18 frågor
- [x] **Purves m.fl., Neuroscience** — 18 (+2) frågor
- [x] **Fried & Ferlito (red.), The Larynx** — 15 frågor
- [x] **Hixon, Weismer & Hoit, Preclinical Speech Science** — 12 frågor
- [x] **Fehrenbach & Popowics, Illustrated Dental Embryology, Histology, and Anatomy** — 10 frågor
- [x] **Netter, Atlas of Head and Neck Anatomy for Dentistry** — 9 frågor
- [x] **Whitley m.fl., Clark's Positioning in Radiography** — 6 frågor
- [x] **Perry, Gait Analysis** — 6 frågor
- [x] **Hirano, Structure and function of the vocal fold** — 3 frågor (artikel? se ovan)
- [x] **Scheid & Weiss, Woelfel's Dental Anatomy** — 3 frågor

## Redan inlagda (17) – rör ej

Aspelin & Pettersson · Bojsen-Møller · Boron & Boulpaep · FIPAT (Terminologia anatomica) ·
Hall & Hall (Guyton) · Internetodontologi · Kandel · Lindskog · Lännergren m.fl. · Medibas ·
Moore, Dalley & Agur · Paulsen & Waschke (Sobotta) · Sand m.fl. · Socialstyrelsen (ICD-10-SE) ·
Solunetti · Standring (Gray's) · Världshälsoorganisationen (ICD-11)


## Kvar att lösa (2)

Båda saknar upphovsman i `source` och gick inte att belägga — de är därför **inte** inskrivna.
Att skriva in dem hade krävt en gissning, vilket §3.2d uttryckligen förbjuder. Sökningarna
nedan är gjorda 2026-08-20 så nästa pass slipper göra om dem:

- **`Björk & Kirkevold, Klinisk omvårdnad`** (100 frågor). Ingen svensk titel med den
  författarkombinationen går att hitta. Liber ger ut *Klinisk omvårdnad 1* och *2* med
  Almås, Stubberud & Grønseth som redaktörer; Kirkevold står bakom *Omvårdnadsteorier* och
  (med Brodtkorb & Ranhoff) *Geriatrisk omvårdnad*. Antingen är `source`-strängen en
  sammanblandning av två verk, eller så är det en titel som inte syns i öppna kataloger.
  **Nästa steg:** fråga användaren vilken bok som faktiskt användes, eller slå i LIBRIS
  (libris.kb.se är blockerad av nätverkspolicyn i agentmiljön och gick inte att nå härifrån).
- **`Journalföring och medicinsk dokumentation för vårdadministratörer`** (64 frågor). Ingen
  bok med den titeln hittas. Närmast liggande verkliga titlar är Fröberg & Höllgren,
  *Medicinsk dokumentation: Om journalföring och personuppgifter inom hälso- och sjukvård*
  (Institutet för Medicinsk Rätt) och Björvell, *Sjuksköterskans journalföring och
  informationshantering* (Studentlitteratur) — men ingen av dem är samma titel, och den
  regelmässiga sidan täcks redan av Socialstyrelsens HSLF-FS 2016:40 som ligger i listan.
  **Nästa steg:** samma som ovan.

## Utfört 2026-08-20 (0.9.423)

**54 nya poster**, listan 91 → 145. Varje år, upplaga och förlag slaget upp mot förlagets
egen katalog eller mot en oberoende bibliografisk post — ingen uppgift gissad.

**Fyra beslut som styrde vilken upplaga som citerades**, så att nästa pass inte behöver
gissa om dem:

1. **Namnger `source`-strängen en författaruppsättning som pekar ut en viss upplaga, citeras
   den upplagan** — annars den senast utgivna. Därför Hoffbrand **&amp; Moss** (7:e uppl. 2016,
   inte 8:e som är Hoffbrand & Steensma), Ross **&amp; Pawlina** (8:e uppl. 2020, inte 9:e som
   är Pawlina ensam), **Ash &amp; Nelson** Wheeler's (9:e uppl. 2010), **Seikel, King &amp;
   Drumright** (5:e uppl. 2015, Cengage — 6:e uppl. har Hudock i stället för King) och Newman,
   Takei, Klokkevold &amp; Carranza *Clinical Periodontology* (13:e uppl. 2019 — 14:e uppl.
   heter *…and Implantology*).
2. **Upplagan kontrollerad som utgiven**, precis som Boron & Boulpaep-fallet filen varnar för:
   Henry's 25:e uppl. är satt till mars 2027 och är alltså **inte** utgiven — 24:e uppl. (2021)
   citerades i stället.
3. **Copyrightåret gäller före tryckdatumet** när förlaget anger båda (APA 7). Därav Okeson
   (2020), Woelfel's (2017), Musiek & Baran (2020), Neumann (2025) och Boone m.fl. (2021).
4. **Rätt upphovsman, inte den i `source`-fältet**, där de skiljer sig: `Kanski, Clinical
   Ophthalmology` → **Salmon** (9:e uppl. 2020); `Netter, Atlas of Head and Neck Anatomy for
   Dentistry` → **Norton**, *Netter's head and neck anatomy for dentistry* (Netter står för
   illustrationerna); `Junqueira & Mescher` → **Mescher**; `Bontrager & Lampignano` →
   **Lampignano & Kendrick**; `Sjöqvist, Läkemedelsboken` → **Läkemedelsverket**, som är den
   verifierbara utgivaren av *Läkemedelsboken* (numera enbart webb). Sjöqvist-attributionen i
   `source`-fältet gick inte att belägga och har därför inte förts vidare — verket är rätt,
   upphovsuppgiften är den som går att styrka.

**Dubbletterna sammanslagna som filen föreskrev:** Ross & Pawlina (158+97), Hoffbrand & Moss
(100+59) och Purves m.fl. (18+2) blev en post var.

**Två källor utanför listan togs med** enligt "hellre för många än för få": Moore, Persaud &
Torchia, *The developing human* (115 frågor) och Drake, Vogl & Mitchell, *Gray's anatomy for
students* (52 frågor). Båda fanns i censusen men saknades i både den här filen och `info.html`.

**Sorteringen om från grunden.** Hela `<ul>` sorterades maskinellt med svensk kollation
(å/ä/ö/ø/æ sist, ü≈y, övriga diakriter fällda) i stället för att de nya posterna trycktes in
för hand. Det rättade samtidigt **sex felsorterade poster som redan låg i listan**: Butler stod
före Bojsen-Møller, Internetodontologi före Hansson, Inera låg mellan Moore och Nordeng,
Spitzer före Solunetti och Vilensky/Vincent stod i fel inbördes ordning.

**Verifierat efteråt:** 0 poster tappade (alla 91 gamla `<li>` återfinns i de 145),
0 dubbletter, 0 oescapade `&` utanför entiteter, `check_links.py` grön (17 726 interna länkar),
`check_meta.py` grön, `check_generators.py` rundtripp identisk över 418 filer.

**Kvar i censusen, ej utrett här:** `Medicinsk latin och grekiska för vårdyrken` (299 frågor)
och `Medicinsk terminologi (Nilsson/Nathorst-Böös)` (181 frågor) gick inte heller att belägga
i öppna kataloger. De stod inte i den här filens lista över 59 och lämnas därför orörda —
men de bör utredas i samma veva som de två posterna under "Kvar att lösa".
