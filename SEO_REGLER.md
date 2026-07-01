# SEO_REGLER.md — Anatomiquiz · SEO, tillgänglighet, prestanda & agent-standard

> **BINDANDE.** Det här dokumentet definierar hur **all HTML, sitemap, llms.txt, CSS och
> JSON-LD** i Anatomiquiz ska skrivas. Det MÅSTE läsas och följas **innan** en sida skapas
> eller ändras – och pre-flight-checklistan (§12) MÅSTE bockas av innan commit.
> Syftet: kod som är **snygg och perfekt för både människa och maskin** – topp på Google,
> Bing och PageSpeed (inkl. agentisk inläsning), full tillgänglighet och optimerad prestanda.
>
> Kompletterar [`CLAUDE_REGLER.md`](CLAUDE_REGLER.md) (innehåll/quiz/JSON). Vid konflikt om
> webb/kod gäller detta dokument.

**Senast uppdaterad:** 2026-06-25 · **Version:** 1.0

---

## 0. När gäller detta?

Läs och följ SEO_REGLER **varje gång** du:

- skapar en ny `.html`-sida,
- ändrar `<head>`, titel, description, struktur eller innehåll på en sida,
- rör `sitemap.xml`, `llms.txt`, `robots.txt`, `manifest.json`,
- ändrar `css/styles.css` eller `js/app.js`.

Gissa aldrig moderna SEO-/agent-krav ur minnet. Modellens kunskapsgräns är **januari 2026** –
allt nyare (t.ex. GSC- och PageSpeed-agentfunktioner) **slås upp i aktuell dokumentation** (§13).

---

## 1. Den heliga `<head>`-mallen

Varje indexerbar sida följer **samma ordning och samma element som `index.html`**. Inget får
"slarvas bort". Mall för en **innehållssida** (undersida i t.ex. `/kunskapsbank/`):

```html
<!doctype html>
<html lang="sv">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <!-- CSP mot XSS: skript/stilar/data endast från egen origin. GitHub Pages tillåter inga egna HTTP-headers, därav meta. -->
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'">

  <!-- Primär SEO -->
  <title>Sidans titel – kärnbudskap | Anatomiquiz</title>           <!-- ≤65 tecken, unik (§2) -->
  <meta name="description" content="Unik beskrivning, 25–150 tecken.">  <!-- §3 -->
  <meta name="author" content="Norrtou Creations">
  <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large">
  <!-- google-site-verification: ENDAST på startsidan, aldrig på undersidor (§4). -->

  <link rel="canonical" href="https://anatomiquiz.se/SÖKVÄG.html">
  <link rel="sitemap" type="application/xml" href="/sitemap.xml">

  <!-- Webbläsartema -->
  <meta name="theme-color" content="#10b981">
  <meta name="color-scheme" content="light">

  <!-- Open Graph -->
  <meta property="og:type" content="article">         <!-- "website" för hub-/landningssidor -->
  <meta property="og:url" content="https://anatomiquiz.se/SÖKVÄG.html">
  <meta property="og:title" content="Samma som titel-core (utan | Anatomiquiz)">
  <meta property="og:description" content="Kort social beskrivning.">
  <meta property="og:image" content="https://anatomiquiz.se/img/og-image.png">
  <meta property="og:image:width" content="1518">
  <meta property="og:image:height" content="864">
  <meta property="og:image:alt" content="Anatomiquiz — beskrivande alt-text">
  <meta property="og:locale" content="sv_SE">
  <meta property="og:site_name" content="Anatomiquiz">

  <!-- Twitter / X Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Samma som og:title">
  <meta name="twitter:description" content="Kort beskrivning.">
  <meta name="twitter:image" content="https://anatomiquiz.se/img/og-image.png">
  <meta name="twitter:image:alt" content="Anatomiquiz — beskrivande alt-text">

  <!-- Strukturerad data — schema.org (JSON-LD). Typ enligt §6. -->
  <script type="application/ld+json"> … </script>

  <link rel="icon" type="image/svg+xml" href="/img/favicon.svg">
  <link rel="icon" type="image/png" sizes="64x64" href="/img/favicon.png">
  <link rel="apple-touch-icon" href="/img/icon-192.png">
  <link rel="manifest" href="/manifest.json">
  <link rel="stylesheet" href="/css/styles.css?v=X.Y.Z">   <!-- absolut /css/ på undersidor (§11) -->
</head>
```

`<body>` börjar alltid med en skip-länk och en `<main id="main">` (§7).

---

## 2. Titlar (Bing-hårt)

| Regel | Krav |
|---|---|
| **Längd** | **≤ 65 tecken** inkl. `| Anatomiquiz` (Bing: 5–65; trunkeras ≥70). Sikta core ≤ 51. |
| **Unik** | Ingen titel får vara identisk med en annans. Bing flaggar dubbletter. |
| **Ej repetitiv/boilerplate** | Inga nästan-likadana titlar, ingen keyword-stuffing, ingen ord-dubblering inom titeln (t.ex. *uttal … uttalsregler*). |
| **Relevans** | Spegla sidans `<h1>` och faktiska innehåll. Viktigaste sökordet först. |
| **Brand** | Avsluta med ` | Anatomiquiz`. |

---

## 3. Meta description

| Regel | Krav |
|---|---|
| **Längd** | **25–150 tecken** (Bing-spann). Husnorm 127–150; överstig **aldrig 155**. |
| **Unik** | En egen description per sida. Inga dubbletter, ingen boilerplate. |
| **Innehåll** | Beskriv sidan rättvist, väv in nyckelord naturligt. Ingen keyword-stuffing, inga löften. |
| **Konsekvens** | Får skilja sig från og/twitter-description (de är sociala), men ska vara sann mot sidan. |

---

## 4. Canonical, robots, verifiering

- **Canonical:** alltid självrefererande absolut URL (`https://anatomiquiz.se/…`).
- **robots:** `index, follow, max-snippet:-1, max-image-preview:large` på indexerbara sidor.
  Interna/ofyllda sidor: `noindex, follow` **och** utanför `sitemap.xml`.
- **Att flippa `noindex → index` på en BEFINTLIG sida kräver användarens OK** (meta-regel,
  se [`CLAUDE_REGLER.md`] och feedback-minnet om meta-ändringar).
- **`google-site-verification`:** endast på startsidan (`index.html`). Aldrig på undersidor.
- **Befintliga, redan indexerade URL:er ändras ALDRIG** (GitHub Pages kan inte göra 301).

---

## 5. Open Graph & Twitter

- Alla fält i mallen (§1) är **obligatoriska**. Utelämna inget.
- **`og:title` = `twitter:title` = titelns core** (titeln utan ` | Anatomiquiz`).
- `og:type`: `article` för faktatexter, `website` för hub-/landningssidor.
- `og:url` = canonical. Bild + bredd/höjd/alt alltid med (annars CLS/aviso i validatorer).

---

## 6. Strukturerad data (JSON-LD)

| Sidtyp | `@type` |
|---|---|
| Faktatext/artikel | `["Article", "LearningResource"]` + separat `FAQPage` om sidan har FAQ |
| Hub / pillar / index | `["CollectionPage", "LearningResource"]` med `hasPart` (länkade undersidor) |
| Startsidan | `["WebApplication", "LearningResource"]` |
| Alla undersidor | inkludera `BreadcrumbList` i **ett eget separat** `<script type="application/ld+json">`-block |

Regler:

- **FAQPage måste spegla en synlig FAQ** på sidan, ord för ord i sak (annars policybrott).
- `inLanguage: "sv-SE"`, `isAccessibleForFree: true`, `publisher`/`author` = Norrtou Creations / Anatomiquiz.
- **`breadcrumb` ska ALDRIG nästlas som property inuti Article/LearningResource/CollectionPage-blocket**
  när `@type` är en array (flera typer). Ahrefs schema.org-validator (och andra strikta validatorer)
  flaggar det som "Unexpected property" eftersom LearningResource-egenskapen inte alltid ärver
  CreativeWork korrekt i deras vokabulär. Lägg alltid `BreadcrumbList` som ett **eget**
  `{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[...]}`-script,
  direkt efter huvud-JSON-LD:t. (Rättat i 0.9.108 på 63 sidor.)
- Använd bara **riktiga** schema.org-typer (kontrollera på schema.org om osäker) — t.ex. finns
  INGEN typ som heter `PrivacyPolicy`; integritetspolicyn ska använda `WebPage`.
- **Validera all JSON-LD** (giltig JSON) före commit (§12).

---

## 6b. Trovärdighet & referenser (E-E-A-T) — OBLIGATORISKT

Trovärdighet är ett **krav** på allt innehåll i kunskapsbanken (YMYL). Därför:

- **Varje innehållsdokument** (pillare OCH undersidor, faktatexter, tabeller, case) ska ha en
  synlig **referenslista längst ner** med rubriken **"Referenser"**. Källor får ALDRIG bara
  finnas på pillaren, i commit-meddelandet eller berättas i chatten – de ska stå **på sidan**.
- **APA 7 (ordentlig citation).** Format: `Författare, A. A. (År). <em>Titel</em> (uppl.). Förlag.`
  Redaktör: `(Red.)`. Standardverk/organisation som upphovsman när författare saknas
  (t.ex. *Federative International Programme for Anatomical Terminology. (2019). Terminologia
  anatomica (2:a uppl.). FIPAT.*). Listan **alfabetisk** på författare/titel. Titlar i `<em>`.
- **Inga referenser i löpande text** om inte användaren uttryckligen ber om det. Hela
  trovärdigheten bärs av referenslistan + att påståendena är faktakollade ([[feedback_trust_source_material]]).
- Använd `.kb-sources`-blocket (finns redan). Markup:
  ```html
  <div class="kb-sources">
    <h2>Referenser</h2>
    <ul>
      <li>Lindskog, B. I. (2008). <em>Medicinsk terminologi</em> (5:e uppl.). Nya Doxa.</li>
      …
    </ul>
  </div>
  ```
- Endast källor som **faktiskt** ligger till grund för sidan ska anges (ljug inte om källor).

---

## 6c. Ordlistetooltips (`kb-term`) — KVALITETSKRAV, OBLIGATORISKT

Tooltips är kärninnehåll i kunskapsbanken (tabeller OCH faktatexter), inte dekoration.
**Slarv här är ett regelbrott.** Gäller både nya sidor och revidering av befintliga.

**Grundkrav:**

- **KRITERIET ÄR MEDICINSKT/LATINSKT INNEHÅLL – inte fetstil.** Varje facklatinsk och
  medicinsk **term** ska ha en `kb-term`-tooltip, i löptext, listor, rubriker och tabellceller.
  Var INTE snål; "facit-only-minimum" räcker inte. Hellre en för mycket än en missad.
  **`<strong>` är INTE kriteriet** – fetstil används också för pedagogisk betoning (meningar,
  FAQ-frågor, minnesramsor, personnamn) och de ska INTE wiras. Att alla missade ord råkade
  vara fetmarkerade i en viss artikel var en tillfällighet. Använd `<strong>`-listan som ett
  **spaningshjälpmedel** för att hitta glömda termer, inte som en regel om att all fetstil ska länkas.
- **Flerordstermer = EN sammanhållen tooltip.** En term som hör ihop (`decussatio
  pyramidum`, `gyrus precentralis`, `nucleus ruber`, `basala ganglierna`, `motoriska
  ändplattan`, `sulcus nervi ulnaris`) länkas som **hela frasen** – aldrig genom att bara
  ta ett av orden eller dela upp den i lösa intilliggande tooltips. Lägg multiordsnyckeln i
  facit; `wire_terms` väljer längsta match. Två **genuint separata** ord (t.ex.
  `abductor pollicis`) får däremot var sin tooltip.
- **Kort (`.kb-card`) får ALDRIG innehålla tooltips.** En `kb-term`-länk inuti ett kort stör
  klicket till målsidan – och blir en **nästlad `<a>`** i klickbara kort (ogiltig HTML). Gäller
  både `<a class="kb-card">` och `<div class="kb-card">` (placeholders). `wire_terms.py`
  skyddar `.kb-card` som zon; lägg heller aldrig in kb-term manuellt i ett kort. (Samma princip
  som att navigeringsknappar/`.btn` hålls rena.)
- **Svenska medicinska former får INTE hoppas över.** Ordlistan (`data/ordlista.json`) är
  **latin-/TA-nyckad**. Svenska sammansättningar och böjningar (framhorn, framhornet,
  ryggmärgen, kortikospinalbanan, motorbarken, lillhjärnan, muskeltonus) sträng-matchar
  inte de latinska uppslagsorden och missas annars tyst. Default-felet "termen finns inte i
  ordlistan" är oftast fel: **kontrollera först om konceptet finns under sitt latinska namn**
  (grep både svensk och latinsk form + sök i definitionerna). Lös genom att (a) lägga
  facit-nycklar för de svenska formerna/böjningarna som pekar på den befintliga **latinska**
  posten (framhorn→cornu anterius, ryggmärgen→medulla spinalis, motorbarken→gyrus
  precentralis), och (b) lägga in i `data/ordlista.json` endast det som **genuint saknas**.
- **Hrefs ska peka på riktiga ankare.** Generera href via generatorns egna
  `slugify`/`page_key`/`page_file` (hanterar å/ä/ö → ascii). 0 trasiga ankare är ett krav.
- **Homonymer/korta ord-fällor** undantas medvetet (kasus, komplement, opposition, numerus,
  genus, os, axis, romerska siffror) – se [`CLAUDE_REGLER.md`] / minnet.

**Arbetsflöde vid revidering:** för att fånga flerordsfraser och missade ord rent –
**av-wira** sidan (`re.sub(r'<a class="kb-term"[^>]*>(.*?)</a>', r'\1', html)`) och **om-wira**
med `scripts/wire_terms.py`. Skriptet är idempotent och rör inte andra `<a>`-länkar.

**Verifiering (krav före commit):** (1) **Hård regel:** varje facit-href ska matcha ett verkligt
`id="term-…"` i ordlistesidorna (0 trasiga ankare). (2) **Spaningshjälpmedel (ej hård regel):**
ett skript som listar `<strong>`-innehåll utan `class="kb-term"` hjälper att hitta glömda termer
– men listan behöver INTE vara tom: gå igenom den och wira de poster som är **medicinska/latinska
termer**, lämna pedagogisk betoning, FAQ-frågor, minnesramsor, personnamn, siffror och segment­intervall.

---

## 7. Tillgänglighet (a11y-trädet MÅSTE vara grönt)

PageSpeed-kravet "tillgänglighetsträdet korrekt formaterat" = **alla** a11y-granskningar gröna.

- `<html lang="sv">`.
- **Exakt en `<h1>`** per sida; rubriker i hierarkisk ordning (h1→h2→h3, hoppa inte över nivåer).
- **Skip-länk** först i `<body>`: `<a class="skip-link" href="#main">Hoppa till innehåll</a>`.
- Landmärken: `<main id="main">`, `<nav aria-label="…">`, `<header>`. Breadcrumb-`<nav>` med
  `aria-current="page"` på sista steget.
- **Tabeller:** varje datatabell har `<caption>` **och** `<th scope="col">` (ev. `scope="row"`).
- **Tabeller får ALDRIG kräva horisontell scroll/slider.** Breda tabeller (t.ex. muskeltabeller
  med 6 kolumner) ska vara **responsiva**: fast kolumnlayout som ryms på desktop och **stackas
  till kort på mobil** (≤720px) med fältetiketter via `data-label` + `td::before`. Använd klassen
  `.kb-mtable` (ej `.kb-table-wrap` som har `overflow-x:auto`). Behåll tabellsemantiken med ARIA
  (`role="table"/"rowgroup"/"row"/"columnheader"/"cell"`) eftersom `display:block` annars tar bort den.
  Inga inline-`style`-attribut (CSP `style-src 'self'`) – kolumnbredder via CSS-klasser på `<col>`.
- **Bilder:** alltid meningsfull `alt`. Dekorativa bilder: `alt=""`.
- Kontrast ≥ WCAG AA. Synligt fokus. Klickbara ytor ≥ 24×24 px.
- Inga `tabindex > 0`. Formulärfält har `<label>`.

---

## 8. Prestanda / Core Web Vitals

Mål: **CLS = 0**, snabb LCP, minimal payload.

- **CLS 0:** sätt alltid `width`/`height` (eller `aspect-ratio`) på bilder/inbäddningar; injicera
  inget innehåll som skjuter layouten; ladda inga webbtypsnitt som orsakar omflöde.
- **Minimal JS:** ladda bara `js/app.js` på sidor som behöver den, alltid med `defer`. Rena
  faktasidor ska helst ha **0 JS**.
- **Inga externa resurser** (CSP `'self'`): inga CDN, fonter eller skript från andra origin.
- Återanvänd `css/styles.css` (en delad fil). Inga inline-stilar för layout.
- Bilder optimerade (SVG där möjligt; annars komprimerad PNG/WebP). `loading="lazy"` på
  bilder under "the fold".

---

## 9. Agenter (PageSpeed agentisk inläsning + GSC)

"Agenter" = Google Search Consoles agent-flöde (sedan maj 2026) och PageSpeeds agentiska
granskning. Officiell Google-doc: **inget särskilt markup-/filkrav** utöver standard-SEO +
robots-kontroller. **PageSpeed mäter tre kriterier – alla ska vara gröna:**

1. **Tillgänglighetsträdet korrekt formaterat** → följ §7 (agenter läser DOM + a11y-trädet).
2. **Cumulative Layout Shift = 0** → följ §8.
3. **llms.txt följer rekommendationerna** → uppdaterad vid varje ny sida (§11).

Styrning av AI-/snippet-exponering sker via `max-snippet` / `nosnippet` / `data-nosnippet` /
`noindex` och GSC-inställningen *Settings → Search generative AI*. Vi tillåter full snippet
(`max-snippet:-1`). Lägg **inte** till meta-keywords eller ad hoc "AI-filer".

---

## 10. Dokumentation i koden

Koden ska vara läsbar för människa **och** maskin:

- Behåll de kommenterade `<head>`-sektionerna (`Primär SEO`, `Open Graph`, `Twitter`,
  `Strukturerad data` …) – samma stil som `index.html`.
- Kommentera **varför**, inte vad: CSP-raden, val av JSON-LD-typ, icke-uppenbara beslut.
- Semantisk, indenterad HTML. Inga döda/utkommenterade kodblock kvar live.
- **Ingen intern "till mig"-text live** (planering/process/löften/TODO) – bara besökarriktad
  text. Grep innan commit.

---

## 11. KEDJAN — vad som ALLTID måste uppdateras tillsammans

Detta är hjärtat i dokumentet: **inget led i kedjan får glömmas.**

### A. Ny eller ändrad sida
- [ ] `VERSION` bumpas (format `0.Y.Z`).
- [ ] `index.html`: `app.js?v=` cachebuster = ny version.
- [ ] `js/app.js`: `APP_VERSION` = ny version.
- [ ] `CHANGELOG.md`: ny post överst med vad som ändrats.

### B. Ny indexerbar sida (utöver A)
- [ ] `sitemap.xml`: ny `<url>` med `<loc>` + `<lastmod>` = dagens datum + `changefreq`/`priority`.
- [ ] `llms.txt`: lägg sidan i rätt sektion (skapa sektion vid behov).
- [ ] Korslänka: lägg in länk från relevant **pillar/hub** + interna korslänkar + breadcrumb.
- [ ] `<head>` komplett enligt §1 (canonical, OG, Twitter, JSON-LD med BreadcrumbList).

### C. CSS ändrad (`css/styles.css`)
- [ ] Bumpa `styles.css?v=` cachebuster **på alla sidor som laddar filen** – håll versionen
      **enhetlig** över hela sajten (annars får återvändande besökare stale CSS).
- [ ] `CHANGELOG.md` noterar CSS-versionen.

### D. Befintlig sidas indexerbarhet/meta ändras
- [ ] Kräver användarens uttryckliga OK (meta-regel) innan ändring.
- [ ] Om `noindex → index`: lägg även in i `sitemap.xml` + `llms.txt` + uppdatera ev. hub-kort.

### E. Aldrig
- [ ] Ändra en redan publicerad/indexerad **URL**.
- [ ] Lämna `sitemap.xml`, `llms.txt` eller korslänkar osynkade med verkligheten.

---

## 12. Pre-flight checklista (kör före commit)

- [ ] **Titel** ≤65 tecken, unik, ej repetitiv, speglar `<h1>`.
- [ ] **Description** 25–150 tecken, unik.
- [ ] `og:title = twitter:title = titel-core`; alla OG/Twitter-fält ifyllda.
- [ ] Canonical självrefererande; `robots` korrekt; ingen `google-site-verification` på undersida.
- [ ] **JSON-LD validerar** (giltig JSON); FAQPage speglar synlig FAQ; BreadcrumbList finns.
- [ ] **A11y:** en `<h1>`, skip-länk, landmärken, varje tabell har `<caption>` + `th scope`,
      bilder har `alt`.
- [ ] **Prestanda:** inga externa resurser; JS bara vid behov + `defer`; bilddimensioner satta (CLS 0).
- [ ] **Kedjan (§11)** avbockad: VERSION + index.html + app.js + CHANGELOG (+ sitemap + llms.txt + korslänkar).
- [ ] **Tooltips (§6c):** varje **medicinsk/latinsk term** har `kb-term` (fetstil är INTE kriteriet);
      flerordstermer som EN tooltip; svenska former mappade; 0 trasiga facit-ankare.
- [ ] Ingen intern "till mig"-text live.

### Verifieringssnutt (kör i repo-roten)

```bash
# Titel-/description-längd + JSON-LD-validitet + tabell-captions för en sida:
python3 - "$F" <<'PY'
import sys,re,json,pathlib
h=pathlib.Path(sys.argv[1]).read_text(encoding="utf-8")
t=re.search(r"<title>(.*?)</title>",h).group(1)
d=re.search(r'name="description" content="(.*?)"',h).group(1)
print("titel",len(t),"OK" if len(t)<=65 else "FÖR LÅNG", "|", t)
print("desc ",len(d),"OK" if 25<=len(d)<=150 else "FEL")
for b in re.findall(r'application/ld\+json">(.*?)</script>',h,re.S):
    json.loads(b)
print("tabeller",h.count('<table'),"captions",h.count('<caption>'),
      "-> OK" if h.count('<table')==h.count('<caption>') else "-> SAKNAS")
print("JSON-LD: giltig")
PY
# (sätt F=… till filsökvägen)
```

```bash
# Tooltip-koll (§6c): fetord utan kb-term + trasiga facit-ankare.
python3 - "$F" <<'PY'
import sys,re,json,pathlib,glob
h=pathlib.Path(sys.argv[1]).read_text(encoding="utf-8")
miss=[re.sub(r'<[^>]+>','',s).strip() for s in re.findall(r'<strong>(.*?)</strong>',h,re.S)
      if 'class="kb-term"' not in s]
print("<strong> UTAN tooltip:", miss if miss else "inga ✓")
ids=set()
for p in glob.glob('ordlista-*.html'): ids|=set(re.findall(r'id="(term-[^"]+)"',open(p).read()))
f=json.load(open('data/kb_glossary_terms.json'))
bad=[k for k,v in f.items() if v['href'].split('#')[1] not in ids]
print("trasiga facit-ankare:", len(bad), bad[:5])
PY
```

---

## 13. Referenser (verifiera mot aktuell version – kunskapsgräns jan 2026)

- Bing Webmaster Guidelines — <https://www.bing.com/webmasters/help/webmaster-guidelines-30fba23a>
- Google: AI Features and Your Website — <https://developers.google.com/search/docs/appearance/ai-features>
- Google: Robots meta-taggar — <https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag>
- Google Search Console: Search generative AI control — <https://support.google.com/webmasters/answer/16908024>
- PageSpeed Insights / Lighthouse (a11y, CLS, agentisk inläsning) — <https://pagespeed.web.dev/>
- schema.org — <https://schema.org/>
- llms.txt — <https://llmstxt.org/>

---

## 14. Kända avvikelser att städa (chain-debt)

- **CSS-cachebuster är inte enhetlig:** majoriteten av sidorna refererar fortfarande
  `styles.css?v=0.7.1` medan aktuell version är `0.7.8`. Enligt §11.C ska den vara enhetlig
  över hela sajten. Bör synkas vid lämpligt tillfälle (kräver bump på alla berörda sidor).

---

**DETTA DOKUMENT ÄR BINDANDE FÖR ALL WEBB-/KOD-/SEO-ARBETE PÅ ANATOMIQUIZ.**
