# img/media/ – innehållsbilder

Alla **innehållsbilder** (anatomi, patologi, histologi m.m.) som används i quiz och
faktatexter. Sajtens chrome (favicon, ikoner, og-image) ligger kvar i `img/` och
hör INTE hit. **Ingenting läggs i projektroten.**

**En fysisk fil per motiv.** Återanvändning sker genom att referera samma bild via
dess `id` i registret `data/bilder.json` – aldrig genom att kopiera filen.

## Mappstruktur

Första nivån = kategori, andra nivån = region/organsystem:

```
img/media/
  anatomi/                 normal anatomi (per region/organsystem)
    ovre-extremitet/       nedre-extremitet/   thorax/       buk/
    backen-perineum/       rygg-columna/       huvud-hals/   nervsystem/
    hjarta-karl/           respiration/        njurar-urinvagar/
    matsmaltning-lever/    endokrina/          blod-immun/   reproduktion/
    hud/                   sinnesorgan/        rorelseapparat/
  patologi/                sjukdomar & skador (skapa systemundermapp vid behov,
                           spegla anatomins regionnamn, t.ex. patologi/hjarta-karl/)
  histologi/               vävnad/mikroskopi
  embryologi/              utveckling
  radiologi/               bildgivning (röntgen/CT/MR/ultraljud)
```

- Skapa nya undermappar vid behov, men **spegla regionnamnen** ovan så patologi/
  histologi/radiologi blir lätta att para ihop med rätt anatomi.
- `file`-fältet i registret är källan till var en bild ligger.

## Namngivning
- Filen döps efter **vad den föreställer**: kebab-case, gemener, latinsk/svensk
  anatomisk term + ev. vy. Ex: `humerus-dorsalvy.webp`, `hjarta-frontalsnitt.webp`.
- `id` i registret = filnamnet utan ändelse.

## Format & optimering
- Diagram/streckteckning → `.svg` (vektor, lättast & skarpast).
- Foto/render → `.webp` (default). Stora tunga fotobilder → ev. `.avif` (lättare).
  `.png` endast vid behov.
- Optimera för mobil (iPhone): rimliga mått, komprimerat.

Fullständiga regler: `../../BILDER_REGLER.md`.
