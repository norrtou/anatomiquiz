# Bildregler – lagring & hantering av innehållsbilder

Gäller **alla** innehållsbilder i Anatomiquiz (anatomibilder m.m.) som används i
quiz och faktatexter. Site-chrome (favicon, ikoner, og-image) omfattas inte –
det ligger kvar i `img/`.

## Grundprincip: en bild – en fil – ett register

> **En fysisk bild per motiv.** Varje bild lagras EN gång och refereras via sin
> `id` från hur många quiz/faktatexter som helst. Återanvändning skapar ALDRIG
> en kopia. Inga dubbletter.

Tre delar:

1. **Lagring:** `img/media/` i en mappstruktur (se nedan) – **aldrig i projektroten**.
2. **Register:** `data/bilder.json` – enda källan. Varje bild = en post med `id`,
   `file`, `alt`, m.m. (schema i filens `_schema`, exempel i `_example`).
3. **Referens:** allt pekar på registrets `id`, aldrig på en kopierad fil.

## Mappstruktur (alla bilder – inget i roten)

Första nivån = kategori, andra nivån = region/organsystem:

```
img/media/
  anatomi/      <region/organsystem>  ovre-extremitet, nedre-extremitet, thorax,
                buk, backen-perineum, rygg-columna, huvud-hals, nervsystem,
                hjarta-karl, respiration, njurar-urinvagar, matsmaltning-lever,
                endokrina, blod-immun, reproduktion, hud, sinnesorgan, rorelseapparat
  patologi/     sjukdomar & skador (skapa systemundermapp vid behov, spegla
                anatomins regionnamn, t.ex. patologi/hjarta-karl/)
  histologi/    vävnad/mikroskopi
  embryologi/   utveckling
  radiologi/    bildgivning (röntgen/CT/MR/ultraljud)
```

- Skapa nya undermappar vid behov men **spegla regionnamnen** så kategorierna
  blir lätta att para ihop. Site-chrome ligger kvar i `img/`.

## Sökvägar
- Alltid **rot-absolut**: `/img/media/<file>`. Fungerar identiskt från rotsidor
  och från `/kunskapsbank/` (sajten körs på egen domän, anatomiquiz.se).
- `file` i registret anges relativt `/img/media/` och inkluderar kategori + region,
  t.ex. `anatomi/ovre-extremitet/humerus-dorsalvy.webp`.

## Namngivning
- Filen döps efter **vad den föreställer**: kebab-case, gemener, latinsk/svensk
  anatomisk term + ev. vy. Ex: `humerus-dorsalvy.webp`, `hjarta-frontalsnitt.webp`.
- `id` i registret = filnamnet utan ändelse.

## Format & prestanda
Välj format efter motivtyp – det är den enskilt största prestanda-/viktvinsten:
- **Diagram, streckteckningar, scheman → `.svg`** (vektor). Pyttelätt, knivskarp vid
  all zoom/retina, texten kan indexeras. Slår allt annat för linjer/flata färger.
- **Foton, 3D-renderingar, komplexa anatomibilder → `.webp`** (default). ~25–35 %
  mindre än JPEG, transparens, stöds av alla moderna webbläsare inkl. Safari/iPhone.
- **`.avif`** = enda formatet lättare än WebP (ofta 20–50 % mindre). Stöds brett
  (Chrome, Safari iOS 16+, Firefox). Krångligare att skapa → använd bara för
  **stora, tunga fotobilder** där varje kB räknas. `.png` endast vid särskilt behov.
- En fil per motiv i ETT valt format (ingen `<picture>`/formatdublett-strategi).
- Optimera för mobil (iPhone): rimliga mått, komprimerat.
- `<img>` ska alltid ha `loading="lazy"` och `decoding="async"`.

**SEO:** själva codec:en påverkar inte ranking direkt (Google indexerar både WebP
och AVIF i bildsök). Det som spelar roll är liten/snabb fil (Core Web Vitals/LCP),
samt `alt`, filnamn och lazy-load. Tunga ooptimerade PNG/JPEG är den enda verkliga
SEO-nackdelen.

## Tillgänglighet & SEO
- **`alt` är obligatorisk** och beskrivande på svenska (a11y + bild-SEO). Ligger i
  registret så samma bild får samma alt överallt.
- Dekorbild utan informationsvärde: tom `alt=""` (men sådana hör sällan hemma här).

## Rättigheter
- Registrera `source` och `license` för varje bild. Egna foton/illustrationer =
  `"eget verk"`. Tredjepartsbild: säkerställ licens och fyll i `credit` om den
  kräver synlig kreditering (visas som `<figcaption>`).
- Ladda aldrig upp bild utan klarlagd licens.

## Arbetsflöde när en ny bild kommer in
1. Lägg filen i rätt mapp under `img/media/<kategori>/<region>/` (rätt namn, optimerad).
2. Lägg EN post i `data/bilder.json` → `images` med `id` = filnamn utan ändelse.
3. **Kolla först att `id`/`file` inte redan finns** (ingen dubblett).
4. Referera bilden via dess `id`:
   - **Quiz:** lägg `"image": "<id>"` på frågeobjektet i `data/<ämne>.json`.
     Renderas via `js/images.js` (`buildImageFigure`). *(Render-hooken i `app.js`
     wires in när första bild-frågan byggs och kan testas live.)*
   - **Faktatext (statisk HTML):** `<figure class="content-image">
     <img src="/img/media/<file>" alt="<alt ur registret>" loading="lazy"
     decoding="async"></figure>`. Kopiera alt-texten från registret – ladda
     ALDRIG upp samma bild på nytt.
5. Vill flera ämnen/utbildningar ha samma bild: återanvänd `id`. Klart – ingen kopia.

## Att göra (förberedelse klar, render-wiring kvar)
- `js/images.js` finns och är redo. När första bild-frågan byggs: anropa
  `loadImageRegistry()` i `app.js` laddningsflöde och rendera `buildImageFigure`
  i frågevyn; lägg CSS för `.content-image`/`.image-credit` i `css/styles.css`.
  Bumpa då cachebusters enligt versioneringsregeln.

Kopplingar: tillgänglighet/SEO speglar `SEO_REGLER.md`; bilderna ska stötta
utbildningsbygget i `UTBILDNINGAR_REGLER.md`.
