# Granskning september 2026 – SEO, GEO, agentläsning och tillgänglighet

**Gäller:** Anatomiquiz 0.9.439 · **Granskad:** 2026-09-22 · **Ändringar i appen:** inga.
Dokumentet samlar brister och förslag. Inget förslag är genomfört. Allt som kräver ett beslut
från dig står samlat i [avsnitt 2](#2-beslut-som-är-dina).

---

## 1. Sammanfattning

Sajten håller redan en hög nivå. Den egna kontrollkedjan är grön rakt igenom, och Lighthouse ger
96–100 i prestanda och 100 i SEO och bästa praxis på de sidor jag mätte. Bristerna nedan är av
andra slag än i förra svepet: de flesta syns först i en **renderad** webbläsare, under **en
viss kombination** av tema och skärmbredd, eller i **byggsteget hos GitHub Pages**. Ingen av
dem kan fångas av skript som läser HTML och CSS som text, och därför har de gått förbi
`check_generators.py`.

| # | Brist | Omfattning | Prioritet |
|---|---|---|---|
| A | GitHub Pages publicerar 23 interna `.md`-dokument som HTML-sidor på anatomiquiz.se | 23 sidor | **1** – liten insats |
| B | Länkar får webbläsarens standardfärg när telefonens läge och sajtens tema skiljer sig åt, med kontrast ned till 1,7:1 | 471 länkar på 106 sidor | **1** |
| C | Verktygssidorna kan scrollas i sidled på mobil, och två artiklar vid 320 px | 5 sidor vid 390 px, 9 vid 320 px | **1** |
| D | Lighthouse underkänner tillgänglighetsträdet för agenter p.g.a. tooltiplänkar i `<caption>` | 40 sidor | **1** – ✅ 0.9.445 |
| E | Fokus hamnar på `<body>` vid varje vybyte i appen, utom i quizet | 9 vybyten | 2 |
| F | Ordlistans bokstavsrad är för liten att träffa, och tre av länkarna har kontrast 2,5:1 | 33 sidor | 2 – ✅ 0.9.446 |
| G | Inladdningsanimationen gör att länkar till en ordlistepost landar 20 px för högt, och den skjuter upp LCP med upp till 0,5 s | alla sidor | 2 |
| H | `llms-full.txt` säger fortfarande att man väljer svårighetsgrad | 1 post | 2 – liten insats |
| I | IndexNow skickar alla 129 URL:er vid varje publicering, även de som inte ändrats | varje push | 2 |
| J | "Testa dig själv i quizet" leder till startsidan och inte till rätt ämne | CTA:er på tabell- och artikelsidor | 3 |
| K | Strukturdata: `WebSite`-nod och ordlistetermens `url` saknas, och FAQ-rika resultat är nedlagda | – | 3 |
| L–O | Mindre a11y- och underhållsfynd | – | 3 |
| P | SEO_REGLER har åldrats på flera punkter | regeldokument | 2 |

**Utgångsläget i siffror**, mätt i den här granskningen:

- `check_generators.py`: rundtrippen är identisk (427 filer), 18 557 interna länkar är hela,
  130 sidor har en korrekt rubrikkedja, 211 kontrastmätpunkter klarar AA i båda teman och
  599 tester är gröna.
- Lighthouse 13.5, mobil med simulerad strypning, mot en lokal server med gzip som efterliknar
  GitHub Pages:

  | Sida | Prestanda | Tillgängl. | Bästa praxis | SEO | Agentic Browsing | LCP | CLS |
  |---|---|---|---|---|---|---|---|
  | `index.html` | 96 | 100 | 100 | 100 | 3/3 | 2,7 s | 0 |
  | `muskeltabell-handen.html` | 100 | **95** | 100 | 100 | **2/3** | 1,5 s | 0 |
  | `artiklar/rotatorkuffen.html` | 99 | 100 | 100 | 100 | 3/3 | 1,8 s | 0 |
  | `ordlista-p.html` (519 KB) | 98 | **92** | 100 | 100 | 3/3 | 2,1 s | 0 |
  | `medicinskordlista.html` | 100 | **92** | 100 | 100 | 3/3 | 1,7 s | 0 |
  | `akutmedicin/neurologi.html` | 99 | 100 | 100 | 100 | 3/3 | 1,8 s | 0 |

---

## 2. Beslut som är dina

Förslagen nedan ändrar sajtens utseende, publicering eller policy. Enligt CLAUDE_REGLER §0.5
och förra svepets regel ska sådant läggas fram men inte byggas oombett. Varje punkt har sitt
eget stycke.

**2.1 `.nojekyll` i roten (fynd A).** ✅ **Beslutat 2026-09-23. Genomfört i 0.9.442** –
`.nojekyll` finns, regeln för nya `.md` står i SEO_REGLER §11 F, och både `check_links.py`
och pre-commit-hooken stoppar om filen försvinner.

**2.2 Egen länkfärg för innehållslänkar (fynd B, steg 3).** ✅ **Beslutat 2026-09-23.
Genomfört i 0.9.444** – länkar utan egen stil har sajtens gröna (`--primary-deep`, hover
`--primary-deepest`, samma som `.info-link`) i stället för webbläsarens blå och lila.
Steg 1–2 genomfördes i 0.9.443.

**2.3 Större träffytor i ordlistans bokstavsrad (fynd F).** ✅ **Beslutat 2026-09-23.
Genomfört i 0.9.446** – 24 × 24 px med utfyllnad, samma textstorlek, färgen `--primary-deep`.

**2.4 Inladdningsanimationen på `.card` och `.header` (fynd G).** Sidorna slutar glida in. I
gengäld landar länkar rätt och LCP sjunker med upp till 0,5 s (mätt 0,1–0,5 s beroende på sida).

**2.5 FAQPage-blocken (fynd K4).** ✅ **Beslutat 2026-09-23: alternativ a. Genomfört i
0.9.441** – `scripts/wire_faq.py` skriver blocken ur den synliga FAQ:n.

**2.6 Klinisk granskning av verktygen (avsnitt 6).** Bara om en legitimerad person faktiskt
granskar verktygen kan `reviewedBy` sättas.

---

## 3. Metod och underlag

**Läst:** CLAUDE_REGLER, SEO_REGLER, ARTIKLAR_REGLER, UTBILDNINGAR_REGLER, BILDER_REGLER,
CSS_KARTA, ORDLISTA, README och `scripts/seo_geo_eeat_svep_todo.md` (förra svepet), så att
inget redan avgjort föreslås på nytt.

**Kört:**

1. `python3 scripts/check_generators.py`, efter `git fetch --unshallow` eftersom datumkontrollen kräver hela historiken.
2. En egen statisk genomgång av samtliga 131 HTML-filer: head, JSON-LD-typer, skript, bilder, ARIA och länkar.
3. **axe-core 4.13** i Chromium på alla 131 sidor, i ljust och mörkt tema, vid 390 px. 21 sidor kördes dessutom på datorbredd.
4. **Lighthouse 13.5** med den nya konfigurationen `agentic-browsing` på sex sidtyper, både mot en server utan komprimering och mot en med gzip.
5. Playwright-mätningar av tangentbordsfokus, var ankarlänkar landar, horisontellt överspill vid 320 och 390 px och länkfärger i alla fyra kombinationer av telefonläge och sajttema.
6. **GitHub Pages byggsteg återskapat lokalt** med gem-paketet `github-pages` (Jekyll 3.10, `--safe`), samma byggmiljö som Pages använder för en gren utan `.nojekyll`.
7. Webbresearch om läget i september 2026. Källorna står sist.

**Begränsningar.** Sandlådans nätverksregler blockerar anatomiquiz.se, så varken live-sajten,
dess HTTP-huvuden, fältdata (CrUX) eller Search Console har kunnat kontrolleras. Alla
prestandasiffror är labbvärden. Skärmläsare (VoiceOver, NVDA) och riktig iPhone har inte
testats. Fynd A är belagt med ett lokalt bygge och bör bekräftas live (se A).

---

## 4. Läget 2026 – vad som ändrats sedan reglerna skrevs

SEO_REGLER §0 och §13 säger att allt efter januari 2026 ska slås upp. Det här har hänt:

| Område | Nytt | Betydelse för Anatomiquiz |
|---|---|---|
| **Googles AI-guide** (15 maj 2026) | "Optimizing for generative AI search is … still SEO." Inga särskilda AI-filer eller särskild markup behövs för AI Overviews och AI Mode. | Bekräftar sajtens linje (SEO_REGLER §9). Inget nytt att bygga. |
| **FAQ-rika resultat nedlagda** (7 maj 2026) | Visas inte längre. Rapporten i Search Console togs bort i juni och API-stödet i augusti. Markupen är fortfarande giltig. | 21 sidor har `FAQPage`. Se K4. |
| **Övningsproblem (`Quiz`)** | Stödet avvecklat sedan januari 2026. | Bygg inte `Quiz`-markup för frågorna. |
| **Search Console: rapport för generativ AI** (3 juni 2026, alla sajter sedan 31 aug) | Visningar i AI Overviews, AI Mode och Discover, plus en ny kontroll för att välja bort AI-funktionerna. | Följ rapporten. Låt kontrollen stå på "tillåt". |
| **Lighthouse "Agentic Browsing"** (Lighthouse 13.x, 2026, "under utveckling") | Sju granskningar: agentens tillgänglighetsträd (en utvald uppsättning axe-regler), `llms.txt` (kräver en H1 och minst en länk), ARD-katalogen `/.well-known/ai-catalog.json`, tre WebMCP-granskningar (informativa) och CLS. | SEO_REGLER §9 beskriver "tre kriterier". Sajten klarar allt utom trädet på 40 sidor (D). ARD och WebMCP blir "ej tillämpligt", vilket räknas som godkänt. |
| **WebMCP** | Deklarativa formulärattribut (`toolname`, `tooldescription`) och ett API för verktyg i JS. Ursprungsprov i Chrome 149–156. | Se avsnitt 6. Avvakta. |
| **Agentic Resource Discovery** (ARD, juli 2026) | `ai-catalog.json` listar en domäns MCP-servrar, API:er och agenter. | Inte tillämpligt, sajten har inga sådana. Lägg inte till något. |
| **Agentwebbläsare** (ChatGPT Atlas, Gemini i Chrome) | Läser sidan via tillgänglighetsträdet och ARIA. | Samma krav som tillgänglighet. B, D, E och M påverkar agenterna direkt. |
| **Bing Webmaster Tools, AI Performance** (feb 2026, utökad juni 2026) | Visar hur ofta sidorna citeras i Copilot och vilka sökfrågor som ligger bakom. | Kräver att sajten är verifierad i Bing. Det kan göras genom import från Search Console, utan kodändring. |
| **IndexNow** | Skicka bara URL:er som faktiskt ändrats, och inte samma URL många gånger per dag. | Se I. |
| **AI-preferenser i robots.txt** | IETF AIPREF (`Content-Usage`) är fortfarande ett utkast. Cloudflares `Content-Signal` används brett men är ingen standard. | Inget att göra nu. Dagens `Allow: /` är ett giltigt val. |
| **Markdown till agenter** | Innehållsförhandling på `Accept: text/markdown` eller `.md`-alternativ. | Går inte på GitHub Pages, som saknar innehållsförhandling. `llms-full.txt` täcker behovet. |
| **EN 301 549 v4.1.1** (publicerad 2 sep 2026) | Bygger nu på **WCAG 2.2** och tar därmed med 2.5.8 Target Size, 2.5.7 Dragging och 2.4.11 Focus Not Obscured. Den är ännu inte utpekad i EU:s officiella tidning. | Tillgänglighetsdirektivet och EAA gäller sannolikt inte en gratis, icke-kommersiell sajt, men WCAG 2.2 AA är nu riktmärket. F träffar 2.5.8. |
| **WCAG 3.0** | Fortfarande arbetsutkast. Kandidatrekommendation tidigast Q4 2027. | Inget att göra. |

---

## 5. Fynden

Varje fynd har samma uppställning: **belägg**, **varför det spelar roll**, **förslag** och
**konsekvenser**. Konsekvenserna räknar med kedjan, `sidodatum.py`, kontrollskripten och
regeldokumenten, eftersom det är där en ändring brukar få följder man inte ser.

### A. GitHub Pages publicerar interna dokument som HTML-sidor — prioritet 1

**Belägg.** Repot har ingen `.nojekyll` och ingen `_config.yml`, och Pages bygger från grenen,
vilket `indexnow.yml` bekräftar med `build_type: legacy`. Då kör Pages Jekyll med sina
standardtillägg, och `jekyll-optional-front-matter` gör **varje** Markdown-fil till en sida.
Det lokala bygget med `github-pages` gav 154 HTML-filer mot de 131 som finns i repot. De 23
extra är:

- `CLAUDE_REGLER.html`, `SEO_REGLER.html`, `ARTIKLAR_REGLER.html`, `UTBILDNINGAR_REGLER.html`,
  `BILDER_REGLER.html`, `CSS_KARTA.html` och `ORDLISTA.html`
- `CHANGELOG.html`, på **1,58 MB**
- `RELEASE_NOTES.html`, som fortfarande har appens gamla namn "Hur är läget?", samt
  `BUG_REPORT_ASSISTANT.html` och `COMMIT_TEMPLATE.html`
- elva `scripts/*_todo.html` och `scripts/anatomi_import_mall.html`
- `img/media/index.html`, som byggs ur `img/media/README.md`

Sidorna får GitHubs standardtema (Primer) med `lang="en-US"`, `og:locale en_US` och **samma
description** på alla 23, hämtad från repots beskrivning. Titeln slutar på "| anatomiquiz".
Sidorna saknar CSP och robots-meta och är alltså indexerbara. Temat lägger dessutom ut
`/assets/css/style.css`. De 131 riktiga sidorna blev byte-identiska i bygget, så själva
sajten påverkas inte.

**Varför det spelar roll.** SEO_REGLER §10 kräver "ingen intern 'till mig'-text live", och
här ligger hela regelverket och backloggen på domänen. Dubblerade descriptions och engelsk
språkmärkning på svensk text är just det Bing flaggar (SEO_REGLER §2–3). `check_meta.py` kan
inte se sidorna, eftersom de inte finns som HTML i repot. Risken är måttlig så länge ingen
länkar dit, men insatsen är minimal.

**Bekräfta live först:** öppna `https://anatomiquiz.se/CLAUDE_REGLER.html` och sök
`site:anatomiquiz.se REGLER` på Google och Bing.

**Förslag.** En tom fil `.nojekyll` i roten.

**Konsekvenser.**
- De 23 HTML-sidorna och `/assets/css/style.css` försvinner. Är några indexerade blir de 404
  och faller ur indexet. Det kan påskyndas med *Ta bort* i Search Console.
- `.md`-filerna serveras fortfarande som råtext. `versionshistorik.html` hämtar
  `CHANGELOG.md` och fortsätter att fungera. Ska dokumenten inte vara publika alls krävs mer,
  eftersom repot måste vara publikt för Pages på gratisplanen.
- Filer och mappar som börjar på `_` eller `.` publiceras, till exempel
  `scripts/_build_prefixes.py`, `.claude/settings.json`, `.githooks/` och `.github/`.
  Innehållet är redan publikt i repot, så inget nytt läcker, men det blir nåbart via domänen.
  `check_links.py` letar redan efter `_ARCHIVED*`, så regeln om arkivfiler (SEO_REGLER §6b)
  blir viktigare.
- `page_build` fortsätter att utlösas, så IndexNow-flödet påverkas inte.
- Kedjan: ingen HTML ändras och inga datum flyttas, men VERSION och CHANGELOG krävs som vid
  varje commit.
- Regeldokument: SEO_REGLER §11 E bör få en rad om att `.nojekyll` aldrig får tas bort.
- **Den här rapporten** blir själv en publik sida om den når `main` innan filen finns.

✅ **Genomfört i 0.9.442** enligt förslaget ovan, med regel i SEO_REGLER §11 F och skydd i
`check_links.py` och `.githooks/pre-commit`.

**Alternativ som avråds:** `_config.yml` med `exclude:`. Listan måste hållas i synk med varje
ny `.md`-fil och glömmer tyst den som inte står där, alltså CLAUDE_REGLER §0.4.

### B. Länkarna tappar kontrast när telefonen och sajten har olika tema — prioritet 1

**Belägg.** Alla sidor har `<meta name="color-scheme" content="light dark">`, men `styles.css`
sätter aldrig `color-scheme` per tema och ger inte innehållslänkar någon egen färg. Webbläsaren
väljer då sina **egna** standardfärger efter telefonens läge, inte efter sajtens tema:

| Telefon | Sajtens tema | Länkfärg | Bakgrund | Kontrast |
|---|---|---|---|---|
| mörkt | ljust (förvalet) | `#9e9eff` | vitt kort | **2,4:1** |
| ljust | mörkt (valt) | `#0000EE` | `#16241e` | **1,7:1** |
| samma | samma | UA-blå eller UA-lila | – | godkänd |

Mätt renderat på alla 131 sidor: **471 länkar på 106 sidor** i båda felkombinationerna.
Exempel är "Testa dig själv på handen i quizet", "medicinska ordlistan", de interna länkarna
i alla artiklar och källänkarna på läkemedelssidorna. Förvalt tema är ljust
(`js/theme.js`), och därför drabbas i praktiken **varje besökare som har telefonen i mörkt
läge**. Det är en stor andel mobilanvändare.

**Varför `check_kontrast.py` inte såg det.** Skriptet räknar på regler i CSS:en.
Webbläsarens standardfärger står inte i någon regel och kan per konstruktion inte mätas där.
Det är en ny ytform av kontrastfelet (CLAUDE_REGLER §0.2).

**Förslag, i tre steg:**
1. Lägg till `:root[data-theme="light"] { color-scheme: light; }` och
   `:root[data-theme="dark"] { color-scheme: dark; }` i `styles.css`. Webbläsarens
   standardfärger för länkar, formulär och rullister följer då sajtens tema i stället för
   telefonens. Ingen visuell ändring för den som har samma läge på båda.
2. Låt `theme.js` skriva det lösta temat till `<meta name="color-scheme">`, på samma sätt som
   den redan skriver `theme-color`. Då målas även den första bildrutan innan CSS:en laddats
   i rätt läge, och den som har ljust tema i en mörk telefon slipper en mörk blixt.
3. *(Ditt beslut, 2.2)* En gemensam länkfärg för innehållslänkar, som en token i paletten.

✅ **Steg 1–2 genomförda i 0.9.443.** 471 länkar på 106 sidor gick ned till 0. Ljus sajt i
mörk telefon renderas nu identiskt med ljus sajt i ljus telefon, och likadant för mörkt, på
alla 130 sidor. Det är mätt på varje länks och formulärdels färg och med skärmbilder pixel
för pixel. Skyddet ligger i `test_theme.js`, och regeln står i SEO_REGLER §7c.

✅ **Steg 3 genomfört i 0.9.444.** `:where(a:any-link)` i `styles.css` ger länkar utan egen
färg sajtens gröna. Regeln har noll specificitet och vinner därför bara över webbläsarens
standard; varje länk som redan hade en egen färg behåller den. Ingen ny palettvariabel.
Renderat: 473 länkar i ljust läge hade webbläsarens färger (318 i artiklarnas brödtext, 80 i
tabellceller, 33 i ordlistans källrad), nu 0. Lägsta kontrast är 4,99:1 i ljust läge och
7,61:1 i mörkt. `check_kontrast.py` mäter nu regeln via `TEXT_PÅ_YTOR`, en ny form i
skriptet, och stoppar både vid för låg kontrast och om selektorn försvinner.

**Konsekvenser.**
- Steg 1–2 rör bara `styles.css` och `theme.js`. `bump_version.py` sätter om cachebustern på
  ca 130 sidor automatiskt. Inget innehåll ändras, så `sidodatum.py` flyttar inga datum.
- `scripts/test_theme.js`, med 35 tester, behöver ett fall för meta-taggen.
- SEO_REGLER §1-mallen säger `color-scheme` = `light`, medan sajten har `light dark`.
  Mallen bör visa den nya lösningen (se P).
- Skyddet: CLAUDE_REGLER §0 kräver att felet görs omöjligt. En regel i `check_kontrast.py` om
  att `color-scheme` ska sättas per `data-theme` är mekanisk och går att bygga. En renderad
  kontroll i Chromium skulle se allt men drar in ett beroende i kedjan. Se O.

### C. Horisontell scroll på verktygssidorna och i två artiklar — prioritet 1

**Belägg.** Mätt efter att skripten ritat klart:

| Bredd | Sidor med sidledsscroll |
|---|---|
| 390 px | `neurologi` +308 px, `hjartat` +102, `infektion` +61, `vitalparametrar` +18, `verktyg/lakemedelsberakning` +13 |
| 320 px | de fem ovan (neurologi +378) samt `buken` +55, `syra-bas` +55, `artiklar/rotatorkuffen` +43 och `artiklar/minnesregler-kranialnerverna` +36 |

Orsaken i verktygen är `.vt-grid { grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)) }`.
Ett rutnätsobjekt har `min-width: auto`, så kolumnen växer till innehållets minsta bredd.
Den bestäms av `<select>` med långa alternativ, t.ex. "Invalidiserande symtom, vanliga
aktiviteter går inte att göra", och av enheter med `nowrap`. I kranialnervsartikeln är det en
tabell med `nowrap` på `<th>` och en tooltiplänk med `nowrap`. Skärmbilden av `neurologi.html`
vid 390 px visar kortet förskjutet och en tom mintgrön kant till höger.

**Varför det spelar roll.** WCAG 1.4.10 Reflow (AA) mäts vid 320 CSS-px. SEO_REGLER §7 säger
att tabeller aldrig får kräva horisontell scroll. Verktygen används på telefon, ofta i ett
kliniskt sammanhang.

**Förslag.** `minmax(min(190px, 100%), 1fr)`, `min-width: 0` på `.vt-field` och
`.vt-inputrow`, `max-width: 100%` på `select` med `text-overflow: ellipsis`, och att tabellen
i kranialnervsartikeln får bryta rubrikerna. Mät sedan alla 131 sidor vid 320 och 390 px.

**Konsekvenser.**
- Bara CSS (`verktyg.css` och `styles.css`) och cachebustrar. Inga datum flyttas.
- Långa alternativ **kortas visuellt i den stängda rullgardinen**. Hela texten syns i listan
  när den fälls ut. Ska texten alltid synas måste alternativen skrivas kortare, och det är
  ett innehållsbeslut.
- Skydd: det här är en ny feltyp och ska kodifieras (CLAUDE_REGLER §5.6). En Node-miljö utan
  rendering kan inte mäta överspill, så kontrollen kräver Chromium. Se O.
- 0.9.439 mätte knappar som bröts mitt i ord vid tio bredder, men inte sidans totala bredd.
  Den mätningen är ett naturligt ställe att lägga till `scrollWidth`.

### D. Tooltiplänkar i `<caption>` fäller Lighthouse på 40 sidor — prioritet 1

**Belägg.** axe-regeln `aria-required-children` (kritisk) slår till på **84 tabeller på 40
sidor**, t.ex. `<caption><a class="kb-term" …>Artärer</a></caption>` i en tabell med
`role="table"`. Regeln ingår i Lighthouse-granskningen av agentens tillgänglighetsträd, så
dessa sidor får **2 av 3** tillämpliga granskningar i Agentic Browsing och **95** i tillgänglighet. Statiskt finns 98
captions med tooltip på 49 sidor. På de nio som inte fälls saknar tabellen explicit roll.

**Nyans.** Chromes eget träd är korrekt: tabellen heter "Artärer" och har ett caption-barn.
Felet ligger i hur axe tolkar strukturen och drabbar alltså granskningen, inte en
skärmläsare i Chrome. Men SEO_REGLER §9 gör just den här granskningen till ett krav.

**Provat i en kopia:**

| Ändring | axe |
|---|---|
| ingen | 1 fel |
| `role="caption"` på `<caption>` | 2 fel plus `aria-allowed-role`, alltså sämre |
| tooltiplänken borttagen ur `<caption>` | **0 fel** |

**Förslag.** Gör `<caption>` till en skyddad zon i `wire_terms.py`, på samma sätt som `.kb-card`,
och avwira de 98 länkarna.

**Konsekvenser.**
- 98 tooltips försvinner. Termerna står oftast även i tabellens celler eller i ingressen.
- **`sidodatum.py` flyttar datum på 49 sidor** om inget görs, eftersom `normalisera()`
  jämför HTML och inte synlig text. Rätt åtgärd är ett `KBTERM_RX` som stryker
  `<a class="kb-term">`-omslaget på båda sidorna av jämförelsen, med samma motivering som
  `LANG_RX`: wiring är märkning, inte innehåll. Det ändrar vad historiska ändringar räknas
  som, så verifiera med `--check` att **0** sidor flyttas.
- `build_terms()` bygger facit ur redan wirade sidor. Kontrollera att ingen nyckel bara finns
  i en caption, annars tappas den ur facit.
- SEO_REGLER §6c säger "rubriker och tabellceller" och behöver ett uttryckligt undantag för
  `<caption>`, skrivet proaktivt enligt §0.

✅ **Genomfört i 0.9.445.** `wire_terms.py` skyddar `<caption>` som zon och tar bort varje
kb-term som redan står där; ordet står kvar som text. Det behövdes eftersom wiringen bara
lägger till. En annan länk i en rubrik stoppar skriptet. 145 länkar i 98 rubriker på 49 sidor
togs bort. axe över alla 131 sidor: `aria-required-children` gick från 84 tabeller på 40
sidor till **0**, och övriga överträdelser är oförändrade. Lighthouse på
`muskeltabell-handen`: Agentic Browsing 67 → **100**, tillgänglighet 95 → **100**.
- **Datumen:** `sidodatum.py` stryker kb-term-omslaget, men bara inne i `<caption>`. Utan det
  hade alla 49 sidor fått dagens datum. Nu flyttas **0** sidor, och samma normalisering mot
  läget före ändringen ger också 0, så inget historiskt datum ändras. Att stryka alla tooltips
  hade ändrat vad varje tidigare wiring räknas som, och därför är strykningen avgränsad.
- **Facit:** `build_terms()` finns inte längre. `data/kb_glossary_terms.json` underhålls för
  hand och läses aldrig ur sidorna, så ingen nyckel kan tappas. Docstringen i `wire_terms.py`
  som påstod något annat är rättad.
- **Regler:** SEO_REGLER §6c (undantaget med skäl), §7 (tabellrubrik är ren text) och §9.

### E. Fokus försvinner vid vybyten i appen — prioritet 2

**Belägg.** Testat med tangentbordet i Chromium. När man aktiverar Inställningar, Tillbaka,
Topplista eller startar Matcha, Leitner Light, Tidsjakt, Dagens utmaning, Sortera, Pop! eller
Shoot! döljs knappen man stod på, och fokus hamnar på `<body>`. Bara textquizet flyttar fokus,
till första svarsknappen (`app.js` rad 674).

**Varför det spelar roll.** Tangentbordsanvändaren måste tabba från sidans början, och en
skärmläsare får ingen signal om att vyn bytts (WCAG 2.4.3, nivå A). Sektionerna har redan
dolda `<h2>`, så det finns ett naturligt mål.

**Förslag.** En gemensam hjälpfunktion i `app.js` som flyttar fokus till den nya sektionens
rubrik, med `tabindex="-1"` och `preventScroll`. Modulerna anropar den via skyddade
`typeof`-krokar enligt CLAUDE_REGLER §12.

**Konsekvenser.**
- Rör `app.js` och sju moduler, alltså testskalen i `scripts/test_*.js`.
- Rubriken får en fokusmarkering. Den bör bara synas vid `:focus-visible`, annars blir det en
  synlig ändring.
- Kontrollera `fitActiveView()` och mobilvyn, så att fokus inte scrollar spelytan.
- Ljudet på iOS påverkas inte, eftersom fokus inte är en användargest.

### F. Ordlistans bokstavsrad — prioritet 2

**Belägg.** På alla 33 ordlistesidor, i ljust tema:
- 32 länkar är **9,5 × 17,9 px** (axe `target-size`). WCAG 2.2 2.5.8 kräver 24 × 24 px eller
  motsvarande avstånd, och SEO_REGLER §7 säger detsamma.
- `siffror`, `prefix` och `suffix` har **`#10b981` på vitt, 2,5:1** (WCAG 1.4.3).
  `.glossary-alpha` sätter bara `color` och ärver bakgrunden. `check_kontrast.py` mäter bara
  regler som sätter både färg och bakgrund, så detta är ytterligare en ytform av felet.

**Förslag.** Utfyllnad och `min-width`/`min-height` till 24 px, **utan att ändra
teckenstorleken**, som enligt beslut inte får röras. Färgen blir `--primary-deep`, som ger
5,48:1. Utöka `check_kontrast.py` med ett register som anger vilken yta en regel med bara
`color` ligger på, i samma anda som `ÄRVD_BOTTEN`.

**Konsekvenser.** Raden blir högre och bryter oftare på mobil, se beslut 2.3.
`glossary.css` får ny cachebuster på 33 sidor. Den utökade mätningen kommer sannolikt att
hitta fler regler med bara `color`, och de ska mätas, inte tystas.

✅ **Genomfört i 0.9.446.** Varje bokstav är minst 24 × 24 px och texten har samma storlek
(12,8 px). Rutorna ligger kant i kant. Färgen är `--primary-deep`, 5,48:1 i ljust och 8,37:1 i
mörkt, och hover är `--primary-deepest`. Raden blev högre: 390 px gick från 2 till 3 rader
(38 → 72 px), 320 px från 3 till 4 (58 → 96 px) och 768 px från 1 till 2. På dator är den
fortfarande en rad. axe över alla 131 sidor: `color-contrast` gick från 102 noder till **0**,
och alla 102 satt i raden. `target-size` gick från 1036 till 16. De 16 som är kvar är
ordlistelänkar i tabellceller på en sida.
- **Samma fel på ett ställe till:** `.gi-count` ("1018 ord" på indexkorten i
  `medicinskordlista.html`) hade också `--primary` på vitt, 2,54:1 på 32 kort. axe såg det inte,
  eftersom kortets bakgrund är en gradient. Nu `--primary-deep`, samma färg som bokstaven bredvid.
- **Varför kontrollen missade det:** `check_kontrast.py` hade `.glossary-alpha` i `BAKGRUND`,
  men den posten används bara för regler med genomskinlig bakgrund, och den regeln hade tappat
  sin. Posten såg ut som ett mått men mätte ingenting. Skriptet stoppar nu på döda
  `BAKGRUND`-poster, och raden och indexkorten mäts via `TEXT_PÅ_YTOR` (237 mätpunkter).
- ✅ **Nedtoningen under sökning, 0.9.447:** bokstäver utan träffar tonades ned och gick inte
  att klicka med mus, men de gick fortfarande att nå med Tab och följa med Enter, och
  skärmläsaren läste dem som vanliga länkar. Nu får de `aria-disabled` och `tabindex="-1"`,
  och ett klick på dem stoppas. Renderat med sökningen "ödem": Tab nådde 16 nedtonade
  bokstäver före och 0 efter, Enter följde länken före men inte efter, och axe gick från 1
  kontrastfel i raden till 0.

### G. Inladdningsanimationen flyttar innehåll och skjuter upp LCP — prioritet 2

**Belägg.**
- `.card { animation: fadeInUp 0.5s }` (opacitet 0 och 20 px nedåt) och
  `.header { animation: slideDown 0.6s }` körs på varje sidvisning.
- **Ankarlänkar landar fel:** efter `ordlista-b.html#term-brachium` hamnar termen **19,6 px
  ovanför** skärmkanten och namnet klipps. Mätt över tid: posten står på 0 vid
  `DOMContentLoaded` och glider upp när animationen löper. Alla tooltiplänkar till ordlistan
  landar så (facit har 2 410 ankare). Det finns heller ingen `:target`-markering som visar
  vilken post man kom till.
- **LCP**, mätt med gzip och animationerna bortplockade i en kopia: fördröjningen innan
  LCP-elementet ritas sjönk från **610–740 ms** till **115–185 ms**. För
  `muskeltabell-handen` sjönk LCP från 1,7 s till 1,2 s, och för `index.html` från 2,7 s
  till 2,6 s.
- Animationerna stängs inte av vid `prefers-reduced-motion`. Animationsnamnet sitter kvar
  även då.

**Förslag, alternativ för beslut 2.4:**
(a) ta bort animationerna på `.card` och `.header`,
(b) behåll dem bara på startsidan, eller
(c) behåll dem men utan `transform` och med `animation: none` vid reducerad rörelse.
Oavsett val: lägg till `.glossary-entry:target` med en diskret markering och `scroll-margin-top`.

**Konsekvenser.** Alternativ (a) och (b) är synliga formändringar, eftersom sidorna slutar
glida in. Alternativ (c) lagar ankarfelet, men vad det gör för LCP är inte mätt: jag
mätte bara med båda animationerna borttagna, och det går inte att säga hur mycket som
beror på opaciteten ensam. Det här rör bara CSS, så inga datum flyttas. CLS ligger kvar på 0, för
transformer räknas inte som layoutskift, och det är därför felet inte syns i CLS-måttet.

### H. Inaktuell uppgift i agentfilen — prioritet 2

**Belägg.** `data/llms.json` → `llms-full.txt` säger om startsidan: "Välj utbildning, ämne,
antal frågor **och svårighetsgrad**." Svårighetsgraden togs bort 2026-07-19
(UTBILDNINGAR_REGLER, grundregel 7). Kortraden om spellägen i `llms.txt` nämner dessutom inte
Pop! och Shoot!, men det gör den utförliga texten.

**Varför det spelar roll.** Filen är det agenter läser först, och en funktion som inte finns
blir ett felaktigt svar i en AI-sammanfattning.

**Förslag.** Skriv om de två texterna för hand. Någon maskinell kontroll av sakinnehållet går
inte att bygga (CLAUDE_REGLER §0.3). Stäm av `lang`-texterna mot sidorna när en funktion tas
bort.

**Konsekvenser.** Försumbara. `generate_llms.py` skriver filerna.

### I. IndexNow skickar hela sitemapen vid varje publicering — prioritet 2

**Belägg.** `indexnow.yml` postar alla `<loc>` i `sitemap.xml`, 129 URL:er, vid varje
`page_build`. Sedan 1 augusti har repot 123 commits, ofta flera per dag. IndexNow och Bing
ber om att bara ändrade URL:er skickas och att samma URL inte skickas många gånger per dag.

**Förslag.** Skicka bara URL:er vars `<lastmod>` ändrats i pushen, genom att jämföra
`sitemap.xml` mot föregående commit eller läsa `data/sidodatum.json`, som redan bara flyttas
av verkliga innehållsändringar. Nya och borttagna URL:er skickas alltid. Blir listan tom
avslutas jobbet med exit 0, inte 1.

**Konsekvenser.** `actions/checkout` behöver `fetch-depth: 2`. Sidor som bara fått ny
cachebuster pingas inte längre, och det är avsikten. Risken är att en ändring som inte flyttar
`<lastmod>` inte pingas, men enligt §6d är det rätt, eftersom den inte är en
innehållsändring.

### J. Quizlänkarna leder till startsidan — prioritet 3

**Belägg.** "Testa dig själv på handen i quizet" på `muskeltabell-handen.html` länkar till `/`.
Appen läser inga parametrar ur adressen (`URLSearchParams` används inte), så det går inte att
länka till ett ämne.

**Varför det spelar roll.** Besökaren måste välja utbildning och ämne själv. En AI-svarsmotor
eller agent kan inte hänvisa till "Anatomiquiz, handen" som en adress, och en lärare kan inte
dela en länk till ett ämne.

**Förslag.** `/?amne=<value>` förväljer utbildning och ämne i `#education` och `#topic` utan
att starta quizet.

**Konsekvenser.**
- `value`-namnen på ämnena blir ett publikt kontrakt och får aldrig byta namn, samma logik
  som SEO_REGLER §4 om URL:er. Det behöver en regel och en kontroll.
- Canonical förblir `/`, så inga dubblettsidor uppstår.
- CTA-länkarna finns i generatorer och handskrivna sidor, så sidornas datum flyttas. Det är
  korrekt, eftersom det är en verklig ändring.
- Logiken hör hemma i `app.js`, eftersom urvalslogiken bara finns där (CLAUDE_REGLER §13.1).

### K. Strukturdata — prioritet 3

1. **`WebSite`-nod på startsidan saknas.** Googles system för sajtnamn läser `WebSite` med
   `name` och `alternateName` på startsidan. Undersidornas `isPartOf: WebSite` saknar `@id`
   och kopplas därför inte ihop. **Förslag:** en `WebSite`-nod med
   `@id https://anatomiquiz.se/#website` och `publisher` → `#norrtou-creations`, skriven av
   `wire_identity.py` och `jsonld.py`, aldrig för hand (§6b). Kostnaden är några hundra byte.
2. **Ordlistans `DefinedTerm` saknar `url` och `inDefinedTermSet`.** Varje post har redan ett
   ankare. Med `<link itemprop="url" href="…#term-x">` och `inDefinedTermSet` →
   `…medicinskordlista.html#ordlista` blir varje term en egen, citerbar entitet i samma
   uppsättning. Det skrivs av `generate_glossary.py`. Kostnaden blir några procent efter gzip,
   jämför punkt 7 i förra svepet.
3. **`WebApplication` på startsidan** gör sidan till kandidat för Googles rika resultat för
   programvara, som kräver `offers` och betyg. Rapporten i Search Console kan därför visa
   ogiltiga objekt. `offers` med pris 0 SEK är sant men räcker inte, och betyg får aldrig
   hittas på. **Förslag:** låt det vara. Det är bara brus i en rapport.
4. **FAQ-rika resultat är nedlagda** sedan 7 maj 2026. De 21 `FAQPage`-blocken skadar inte och
   kan hjälpa Bing och andra motorer att förstå sidan, men den synliga vinsten i Google är
   borta. `wire_faq.py` (ARTIKLAR_REGLER §14, 2026-07-26) är därmed mindre brådskande.
   **Beslut 2.5:** (a) bygg `wire_faq.py` så att blocken inte kan glida isär, (b) låt dem stå
   och fortsätt med kontrollsnutten i §12, eller (c) ta bort blocken och därmed risken för
   isärglidning. Jag lutar åt (a) eller (c). (b) är det enda läget som lämnar en känd
   reaktiv kontroll kvar.
   ✅ **Beslutat 2026-09-23: (a). Genomfört i 0.9.441.** `scripts/wire_faq.py` ligger i kedjan
   och skriver alla 21 block ur sidornas synliga FAQ. Innehållet var redan i synk på alla
   114 frågor, så bara formen ändrades.

### L. `manifest.json` låser stående läge — prioritet 3

`"orientation": "portrait"` låser appen när den är installerad på hemskärmen och bryter mot
WCAG 1.3.4 Orientation (AA). **Förslag:** ta bort fältet. **Konsekvens:** spellägena är trimmade
för stående läge (`FIT_SECTIONS`) och behöver kontrolleras i liggande på telefon.

### M. Mindre ARIA- och etikettfynd — prioritet 3

- `aria-label` på element utan roll, som `span#appVersion`, `div.game-modes`, `div.hs-modes` och
  `div.matcha-col`, är inte tillåtet enligt ARIA och ignoreras oftast. Ge elementet en roll,
  t.ex. `role="group"`, eller ta bort etiketten.
- Startsidans logotyp har `alt="Anatomiquiz logotyp"` och samtidigt `aria-hidden="true"`,
  vilket är motsägelsefullt. 404-sidan gör rätt med `alt=""`.
- Korten på `medicinskordlista.html` har en `aria-label` som inte innehåller den synliga
  texten (WCAG 2.5.3 Label in Name, nivå A). Lighthouse underkänner sidan på det.
- På `info.html` heter både regionen och sektionen "Nyheter" (axe `landmark-unique`).
- `<a href="#">` används som knapp för "‹ Start" i Inställningar och Topplista.
- *Arcade: Shoot!* går inte att spela med tangentbord (WCAG 2.1.1). Samma innehåll finns i
  andra lägen, så inget blockeras, men det bör stå i `spellagen.html`.

### N. Prestanda — prioritet 3

- `styles.css` är 229 KB (52 KB med gzip), blockerar renderingen och laddas på alla sidor.
  Lighthouse uppskattar att ca 90 % är oanvänt på en given sida, mest spellägenas CSS. En
  uppdelning skulle kräva att CSS_KARTA ritas om. Poängen är redan 96–100, så nyttan är liten
  i förhållande till risken.
- `versionshistorik.html` hämtar hela `CHANGELOG.md`, 1 MB (370 KB med gzip), för att visa 50
  poster.

### O. Underhåll och verktyg — prioritet 3

- **`kb-glossary.js` saknar `?v=` på 87 sidor.** `bump_version.py` varnar bara
  ("refereras inte med ?v= någonstans") och stoppar inte, trots CLAUDE_REGLER §0.4. Filen har
  inte ändrats sedan 0.9.25, så felet är vilande. Nästa ändring serveras ur cachen.
- **`js/glossary.js` innehåller två råa NUL-byte** som avgränsare på rad 199 och 210. `grep`
  och ripgrep behandlar då filen som binär och **hoppar tyst över den vid sökning**, också det
  sökverktyg Claude använder. Skriv `'\u0000'` i stället, så får koden samma värde.
- `.glossary-letter` är död CSS. Den används varken av generatorn eller av JS men mäts ändå av
  `check_kontrast.py`.
- `/favicon.ico` saknas och ger 404 för klienter som frågar efter den direkt, bland annat
  omdirigeringssidan `ordlista-tecken.html`, som saknar ikonlänk.
- **Renderade kontroller.** B, C och F syns bara i en renderad sida. Förslaget är ett skript,
  `scripts/check_renderat.py` eller `.js`, som kör Chromium via Playwright och mäter
  sidledsscroll vid 320 och 390 px, länkfärger i de fyra temakombinationerna och axe-reglerna
  i Lighthouses agentuppsättning. **Konsekvens:** kedjan får ett beroende som inte finns
  överallt, nämligen Chromium och `playwright-core`. Skriptet ska därför stoppa med ett
  tydligt besked när webbläsaren saknas, inte hoppa över tyst (§0.4). Om det ska vara
  obligatoriskt före commit eller köras separat är ditt beslut.

### P. Regeldokumenten har åldrats — prioritet 2

- SEO_REGLER-huvudet säger "Senast uppdaterad 2026-06-25 · Version 1.0".
- **§1-mallen:** `author` är "Norrtou Creations" men sajten har "Daniel Medin (Norrtou
  Creations)". `color-scheme` är `light` men sajten har `light dark`, se B. `theme.js`-raden
  saknas.
- **§9** beskriver "tre kriterier" och "GSC:s agentflöde sedan maj 2026". Lighthouse har nu en
  kategori med sju granskningar, och trädgranskningen bygger på en bestämd lista med
  axe-regler. Search Console har fått en rapport för generativ AI och en kontroll för att välja
  bort AI-funktionerna. FAQ-rika resultat är nedlagda.
- **§13** hänvisar till en kunskapsgräns i januari 2026. Lägg till Googles AI-guide och
  Lighthouses agentdokumentation.
- **§14** "Kända avvikelser" beskriver en cachebusterskuld från 0.7.x som är löst sedan länge.
- **§7** säger "Klickbara ytor ≥ 24×24 px" men har ingen kontroll, se F.

Enligt CLAUDE_REGLER §5.6 och §0 ska nya feltyper in i reglerna och skrivas proaktivt. De nya
feltyperna här är standardfärger från webbläsaren (B), sidledsscroll i rutnät (C), länkar i
`<caption>` (D), fokus vid vybyte (E), regler med bara `color` (F) och animationer som
flyttar ankare (G).

---

## 6. Strategiska frågor – bedömning, inte brist

| Fråga | Bedömning | Varför |
|---|---|---|
| Publicera quizfrågorna, ca 11 800, som statiska sidor för sök och AI? | **Avråds** | Tunna sidor i serie (ARTIKLAR_REGLER §8.2), facit läcker, stort underhåll. Kunskapsbanken och ordlistan är sajtens citerbara innehåll. |
| WebMCP-verktyg, t.ex. "räkna GCS" eller "sök i ordlistan"? | **Avvakta** | Fortfarande ursprungsprov (token per domän), och API:t kan ändras. Ett kliniskt räkneverktyg som en agent anropar skulle ge ett svar utan sidans friskrivning, vilket är en risk i YMYL-material. Sök i ordlistan är den enda kandidaten med låg risk när API:t blir stabilt. |
| `ai-catalog.json` (ARD)? | **Nej** | Sajten har inga API:er, MCP-servrar eller agenter att lista. "Ej tillämpligt" räknas som godkänt i Lighthouse. |
| Markdownversioner eller innehållsförhandling för agenter? | **Nej** | Går inte på GitHub Pages. `llms-full.txt` täcker behovet, och Google säger uttryckligen att det inte behövs. |
| AI-policy i `robots.txt` (`Content-Signal`, AIPREF)? | **Ingen ändring** | Dagens "allt tillåtet" passar en sajt som vill bli citerad. Standarderna är utkast. Välj bort bara om du *vill* stoppa AI-träning, och i så fall via Search Console och `Google-Extended`. |
| Bing Webmaster Tools? | **Gör** | Verifiera genom import från Search Console. Då syns citeringarna i Copilot, och ingen kod behövs. |
| E-E-A-T för de kliniska verktygen | **Ditt beslut (2.6)** | NEWS2, GCS, Wells och blodgas är YMYL-material. En faktisk granskning av en legitimerad person gör att `reviewedBy` och `lastReviewed` kan sättas **sanningsenligt**. Utan granskning ska fälten inte sättas (SEO_REGLER §6e). |
| Tillgänglighetsredogörelse? | **Valfritt** | Inte lagkrav för en privat, icke-kommersiell sajt. En sida som anger målet WCAG 2.2 AA och kända avsteg, som Shoot!, stärker trovärdigheten. Det blir en ny indexerbar sida med hela kedjan. |

---

## 7. Medvetet inte föreslaget

Följande är redan avgjort i reglerna och tas inte upp igen: **textstorlekar**, som är fredade,
**sajttitelns kontrast** på 1,75:1, som är redovisad, **omskrivning av meta** (fyra titlar
utan "| Anatomiquiz" och 52 descriptions under husnormen rapporteras redan av `check_meta.py`
och ändras bara på begäran), `reviewedBy` utan granskare, `license`, ändrade URL:er, byte
mellan `noindex` och `index`, samt jämförelser av frågeinnehåll mellan ämnen. Latin i löptexten
som saknar `lang="la"` är känt och kräver ett språkfält i datafilen (SEO_REGLER §7b).

---

## 8. Föreslagen ordning

1. **A** efter att det bekräftats live, **H**, och **B steg 1–2**. Alla tre är små, har ingen
   synlig påverkan och kräver inga beslut utöver 2.1.
2. **C** och **D** (D genomförd i 0.9.445).
3. **E** och **I**.
4. **P**, uppdatering av reglerna, i samma pass som de fynd den gäller, inte i efterhand.
5. Dina beslut: **2.4 och 2.6** (2.1, 2.2, 2.3 och 2.5 är genomförda), sedan **J**, **K** och **L–O**.

---

## 9. Källor

- Google Search Central: *A new resource for optimizing for generative AI in Google Search* (maj 2026). https://developers.google.com/search/blog/2026/05/a-new-resource-for-optimizing
- Google Search Central: *Optimizing for generative AI features*. https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
- Google Search Central: *Introducing Search generative AI performance reports* (juni 2026). https://developers.google.com/search/blog/2026/06/gen-ai-performance-reports
- Search Engine Land: *Search Console AI performance reports rolling out globally*. https://searchengineland.com/google-search-console-ai-performance-reports-and-search-generative-ai-control-rolling-out-globally-486269
- Google Search Central: *Latest documentation updates* (FAQ-rika resultat nedlagda 7 maj 2026). https://developers.google.com/search/updates
- PPC Land: *Google phases out practice problem and dataset structured data*. https://ppc.land/google-phases-out-practice-problem-and-dataset-structured-data/
- Google Search Central: *Site names*. https://developers.google.com/search/docs/appearance/site-names
- Chrome for Developers: *Lighthouse agentic browsing scoring*. https://developer.chrome.com/docs/lighthouse/agentic-browsing/scoring
- Chrome for Developers: *llms.txt (Lighthouse)*. https://developer.chrome.com/docs/lighthouse/agentic-browsing/llms-txt
- Search Engine Land: *Google adds llms.txt check to Chrome Lighthouse*. https://searchengineland.com/google-llms-txt-chrome-lighthouse-478246
- Chrome for Developers: *WebMCP Declarative API*. https://developer.chrome.com/docs/ai/webmcp/declarative-api
- Google Developers Blog: *Announcing the Agentic Resource Discovery specification*. https://developers.googleblog.com/announcing-the-agentic-resource-discovery-specification/
- OpenAI Help Center: *Publishers and Developers FAQ* (Atlas och ARIA). https://help.openai.com/en/articles/12627856-publishers-and-developers-faq
- Bing Webmaster Blog: *Introducing AI Performance in Bing Webmaster Tools* (feb 2026). https://blogs.bing.com/webmaster/February-2026/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview
- IndexNow: *Documentation*. https://www.indexnow.org/documentation
- IETF AIPREF: *Vocabulary* (utkast). https://ietf-wg-aipref.github.io/drafts/draft-ietf-aipref-vocab.html
- AccessibleEU: *EN 301 549 has been updated* (sep 2026). https://accessible-eu-centre.ec.europa.eu/content-corner/news/european-accessibility-standard-en-301-549-has-been-updated-2026-09-07_en
- W3C: *WCAG 3.0* (arbetsutkast). https://www.w3.org/TR/wcag-3.0/
- MDN: *color-scheme*. https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/color-scheme
- benbalter/jekyll-optional-front-matter. https://github.com/benbalter/jekyll-optional-front-matter
- Lighthouse 13.5.0, källkod i npm-paketet: `core/config/agentic-browsing-config.js` och `core/audits/agentic/*.js`, lästa direkt för att se exakt vad som mäts.
