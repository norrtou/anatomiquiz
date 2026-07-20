# TODO: komplettera källistan i `info.html`

**Status:** planerat, INTE gjort. Skapad 2026-07-20.
**Regel som styr detta:** `CLAUDE_REGLER.md` §3.2d (använda källor ska in i info.html,
hellre för många än för få, goda akademiska källor, gissa aldrig bibliografiska data,
radera aldrig en källa). Format: APA 7, alfabetisk (svensk kollation: å/ä/ö sist), titel i `<em>`.

## Läge

Källistan i `info.html` (sektionen "Källor och kvalitetssäkring") gick 2026-07-20 från
6 → **17 poster**. En census över alla `source`-fält i `data/*.json` visade dock ~75 riktiga
bibliografiska källor. **59 kvarstår att föra in** enligt listan nedan.

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

- `ISO 389` och `ISO 8253` är **standarder**, inte böcker – APA-format för standard
  (utgivande organ som författare: `Internationella standardiseringsorganisationen (ISO). (år). <em>Titel</em> (ISO 389).`).
- `Vårdhandboken`, `Läkemedelsräkning för sjuksköterskor` och
  `Journalföring och medicinsk dokumentation för vårdadministratörer` saknar författare i
  `source` – slå upp upphovsman/utgivare innan de skrivs in.
- `Hirano, Structure and function of the vocal fold (cover-body-modellen)` är sannolikt en
  **artikel/kapitel**, inte en bok – ta reda på vilket och citera därefter.

## Kvarstående källor (59)

- [ ] **Arlinger, Nordisk lärobok i audiologi** — 500 frågor
- [ ] **Remington, Clinical Anatomy and Physiology of the Visual System** — 500 frågor
- [ ] **Rang & Dale's Pharmacology, 10 uppl.** — 500 frågor
- [ ] **Katzung, Basic & Clinical Pharmacology** — 500 frågor
- [ ] **McPherson & Pincus, Henry's Clinical Diagnosis and Management by Laboratory Methods** — 429 frågor
- [ ] **Magee, Orthopedic Physical Assessment** — 348 frågor
- [ ] **Kanski, Clinical Ophthalmology** — 300 frågor
- [ ] **Lundy-Ekman, Neuroscience: Fundamentals for Rehabilitation** — 243 frågor
- [ ] **Neumann, Kinesiology of the Musculoskeletal System** — 191 frågor
- [ ] **Junqueira & Mescher, Basic Histology: Text and Atlas** — 188 frågor
- [ ] **Ross & Pawlina, Histology** — 158 (+97) frågor
- [ ] **Seikel, King & Drumright, Anatomy & Physiology for Speech, Language, and Hearing** — 121 frågor
- [ ] **Bontrager & Lampignano, Textbook of Radiographic Positioning and Related Anatomy** — 119 frågor
- [ ] **Mettler & Guiberteau, Essentials of Nuclear Medicine and Molecular Imaging** — 103 frågor
- [ ] **Pickles, An Introduction to the Physiology of Hearing** — 100 frågor
- [ ] **Baloh & Honrubia, Clinical Neurophysiology of the Vestibular System** — 100 frågor
- [ ] **Musiek & Baran, The Auditory System** — 100 frågor
- [ ] **Moore, An Introduction to the Psychology of Hearing** — 100 frågor
- [ ] **ISO 389** — 100 frågor (standard, se ovan)
- [ ] **ISO 8253** — 100 frågor (standard, se ovan)
- [ ] **Snell & Lemp, Clinical Anatomy of the Eye** — 100 frågor
- [ ] **Atchison & Smith, Optics of the Human Eye** — 100 frågor
- [ ] **Forrester, The Eye: Basic Sciences in Practice** — 100 frågor
- [ ] **Schwartz, Visual Perception** — 100 frågor
- [ ] **von Noorden & Campos, Binocular Vision and Ocular Motility** — 100 frågor
- [ ] **Evans, Pickwell's Binocular Vision Anomalies** — 100 frågor
- [ ] **Sjöqvist, Läkemedelsboken** — 100 frågor
- [ ] **Hoffbrand & Moss, Essential Haematology** — 100 (+59) frågor
- [ ] **Läkemedelsräkning för sjuksköterskor** — 100 frågor (upphovsman saknas)
- [ ] **Vårdhandboken** — 100 frågor (utgivare saknas)
- [ ] **Björk & Kirkevold, Klinisk omvårdnad** — 100 frågor
- [ ] **Murray, Rosenthal & Pfaller, Medical Microbiology** — 90 frågor
- [ ] **Nanci, Ten Cate's Oral Histology** — 64 frågor
- [ ] **Journalföring och medicinsk dokumentation för vårdadministratörer** — 64 frågor (upphovsman saknas)
- [ ] **Logemann, Evaluation and Treatment of Swallowing Disorders** — 57 frågor
- [ ] **Zemlin, Speech and Hearing Science: Anatomy and Physiology** — 52 frågor
- [ ] **Möller & Reif, Pocket Atlas of Radiographic Anatomy** — 51 frågor
- [ ] **Duffy, Motor Speech Disorders: Substrates, Differential Diagnosis, and Management** — 43 frågor
- [ ] **Okeson, Management of Temporomandibular Disorders and Occlusion** — 40 frågor
- [ ] **Abbas, Cellular and Molecular Immunology** — 39 frågor
- [ ] **Kaufman & Lee, Vascular and Interventional Radiology** — 34 frågor
- [ ] **Gelfand, Hearing: An Introduction to Psychological and Physiological Acoustics** — 32 frågor
- [ ] **Alberts m.fl., Molecular Biology of the Cell** — 29 frågor
- [ ] **Berkovitz, Holland & Moxham, Oral Anatomy, Histology and Embryology** — 29 frågor
- [ ] **Newman, Takei, Klokkevold & Carranza, Clinical Periodontology** — 28 frågor
- [ ] **Ash & Nelson, Wheeler's Dental Anatomy, Physiology, and Occlusion** — 23 frågor
- [ ] **FitzGerald, Clinical Neuroanatomy and Neuroscience** — 20 frågor ← finns redan i repot
- [ ] **Boone & McFarlane, The Voice and Voice Therapy** — 18 frågor
- [ ] **Purves m.fl., Neuroscience** — 18 (+2) frågor
- [ ] **Fried & Ferlito (red.), The Larynx** — 15 frågor
- [ ] **Hixon, Weismer & Hoit, Preclinical Speech Science** — 12 frågor
- [ ] **Fehrenbach & Popowics, Illustrated Dental Embryology, Histology, and Anatomy** — 10 frågor
- [ ] **Netter, Atlas of Head and Neck Anatomy for Dentistry** — 9 frågor
- [ ] **Whitley m.fl., Clark's Positioning in Radiography** — 6 frågor
- [ ] **Perry, Gait Analysis** — 6 frågor
- [ ] **Hirano, Structure and function of the vocal fold** — 3 frågor (artikel? se ovan)
- [ ] **Scheid & Weiss, Woelfel's Dental Anatomy** — 3 frågor

## Redan inlagda (17) – rör ej

Aspelin & Pettersson · Bojsen-Møller · Boron & Boulpaep · FIPAT (Terminologia anatomica) ·
Hall & Hall (Guyton) · Internetodontologi · Kandel · Lindskog · Lännergren m.fl. · Medibas ·
Moore, Dalley & Agur · Paulsen & Waschke (Sobotta) · Sand m.fl. · Socialstyrelsen (ICD-10-SE) ·
Solunetti · Standring (Gray's) · Världshälsoorganisationen (ICD-11)
