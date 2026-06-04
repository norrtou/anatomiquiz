# CHANGELOG - Anatomiquiz

## 0.4.21
- Ämnet "Handen": all engelska i frågorna ersatt med svenska, lekmannatermer och medicinsk latin. Inga engelska termer kvar i ämnet.
- Bytte bl.a. "Carpal tunnel" → karpaltunneln, "Carpal bones" → karpalbenen, "Ulnar tunnel"/"Guyon canal" → Guyons kanal (canalis ulnaris), "saddle led" → sadelled, "hinge joints" → gångjärnsleder, "condyloid joints" → kondylleder, "Radial/Ulnar artery" → A. radialis/A. ulnaris, "common digital arteries" → aa. digitales palmares communes, "sheaths" → senskidor, "Lumbricals" → Mm. lumbricales, "True/False" → Sant/Falskt, "pulleysystemet" → ringbandssystemet m.fl. (65 fält över ~50 frågor).
- Städade samtidigt trasiga svenska formuleringar i samma frågor ("rörlighaf", "Handledskan", "Handelten", "pekfinger finger").
- Rättade q426: "Trapezoideum är det minsta metacarpal ben" → "Trapezoideum är det minsta benet i distala karpalraden" (os trapezoideum är ett karpalben, inte metakarpalben).
- Konsekvent namngivning av ämnena i rullgardinsmenyn: varje ämne får en suffix som visar vad det duger till — `(MC)` flerval, `(FC)` flashcards, `(TF)` sant/falskt, t.ex. "Handen (MC+TF)", "Olika åldrar (MC+FC)". Tog bort gamla parenteser och ordet "Flashcards" ur namnen.
- Ny förklaringsrad under ämnesväljaren (liten, kursiv, en rad) som förklarar MC/FC/TF.
- Ämnena i menyn sorterade i bokstavsordning, med "Tentaplugg" kvar överst och "Slumpade frågor" kvar sist. Ämnet "Studenters flashcards" omdöpt till "ATP-studenters flashcards (FC)".
- "Slumpade frågor" exkluderar nu frågor från Moho och OTIPM, både i quiz- och flashcardsläget.
- `app.js`-cachebustern bumpad till 0.4.21.

## 0.4.20
- Nytt ämne "Olika åldrar" med 100 flervalsfrågor (4 alternativ per fråga) anpassade för arbetsterapistudenter. Exempel- och scenariobaserade frågor.
- 50 frågor om barnets sensomotoriska utveckling (utvecklingsprinciper cefalokaudal/proximodistal, primitiva reflexer, motoriska milstolpar, grepputveckling, syn/hörsel, objektpermanens, sensorisk integration) och 50 frågor om den åldrande kroppen (sarkopeni, osteoporos, artros, balans och fallrisk, syn/hörsel, hjärt-kärl och andning, kognition, skörhet samt arbetsterapeutiska perspektiv).
- Avsedd referens Aldskogius & Rydqvist (2024 och 2018), kompletterat med etablerad litteratur om barns utveckling och gerontologi för arbetsterapeuter.
- Ny datafil `data/olika_aldrar.json`; ämnet registrerat i `index.html` och `app.js`, placerat direkt efter "Ergonomi".
- `app.js`-cachebustern bumpad till 0.4.20.

## 0.4.19
- Nytt ämne "Ergonomi" med 50 flervalsfrågor (4 alternativ per fråga) anpassade för arbetsterapistudenter på första terminen. Frågorna är exempel- och scenariobaserade så att man lär sig av dem, snarare än rena tentafrågor.
- 25 frågor om postural kontroll (understödsyta, tyngdpunkt, sensoriska system, balansstrategier – fotled/höft/steg, anteciperande vs reaktiv kontroll, uppresnings- och skyddsreaktioner) och 25 frågor om ergonomi (neutral kroppsställning, sittställning, lyftteknik och hävarm, belastningsriskfaktorer, statiskt muskelarbete, antropometri, arbetsplatsanpassning).
- Faktakollat mot akademisk arbetsterapilitteratur: Shumway-Cook & Woollacott "Motor Control", Karen Jacobs "Ergonomics for Therapists" samt Radomski & Latham "Occupational Therapy for Physical Dysfunction".
- Ny datafil `data/ergonomi.json`; ämnet registrerat i `index.html` och `app.js`.
- `app.js`-cachebustern bumpad till 0.4.19.

## 0.4.18
- Nytt ämne "OTIPM Flashcards" (endast flashcards) med 50 grundläggande OTIPM-begrepp som arbetsterapeuter använder. Framsidan visar svensk klinisk term med engelsk term under, baksidan förklaring + exempel.
- Svenska termer faktakollade mot svensk arbetsterapilitteratur (Fisher & Nyman: OTIPM, utgiven av Förbundet Sveriges Arbetsterapeuter, m.fl.). Justerade mot OTIPM-standard: "Therapeutic use of self" → "Terapeutisk användning av jaget", "Occupational performance analysis" → "Utförandeanalys", "Occupational performance context" → "Utförandesammanhang (aktivitetskontext)".
- Inkluderar OTIPM:s fyra interventionsmodeller: kompensatorisk modell, pedagogisk modell, modell för aktivitetsträning samt modell för förbättring av personliga faktorer och kroppsfunktioner.
- Ny datafil `data/otipm_flashcards.json`; ämnet registrerat i `index.html` och `app.js`.
- `app.js`-cachebustern bumpad till 0.4.18.

## 0.4.17
- Nytt ämne "Moho Flashcards" (endast flashcards) med 52 MOHO-begrepp. Framsidan visar svensk term med engelsk term under, baksidan visar förklaring och exempel.
- Ny datafil `data/moho_flashcards.json`; ämnet registrerat i `index.html` och `app.js`.
- `app.js`-cachebustern bumpad till 0.4.17.

## 0.4.16
- Tydligare bekräftelse när man rensar topplistan: "Rensa topplista?" ersatt med "Är du säker? Hela topplistan och statistiken raderas permanent och kan inte återställas." så att man inte råkar radera av misstag.
- `app.js`-cachebustern bumpad till 0.4.16.

## 0.4.15
- Statistiken per ämne i topplistan visar nu även genomsnittlig tid per fråga (t.ex. "ca 8 s/fråga"). Tiden mäts alltid när man kör ett quiz — från start till sista svaret — oavsett om frågetimern är på eller av, och sparas (`durationMs`) med varje resultat.
- Tiden räknas bara på resultat som har en sparad speltid, så äldre resultat (utan tidsdata) påverkar inte snittet och saknar tidsdelen i statistiken.
- `app.js`-cachebustern bumpad till 0.4.15.

## 0.4.14
- Topplistan visar nu vilket ämne varje resultat gäller (t.ex. "Ben", "Muskler", "Slumpade frågor"). Ämnet sparas tillsammans med resultatet när quizet är klart. Äldre resultat utan sparat ämne visas som "Okänt ämne".
- Nytt filter högst upp i topplistan: välj "Alla antal frågor" eller ett specifikt antal (10/20/50/100 osv) så att resultat från olika quizlängder inte blandas i samma lista. Alternativen byggs dynamiskt utifrån de frågeantal som faktiskt finns sparade.
- Ny statistik längst ner på topplistesidan: per ämne visas hur många gånger man testat sig (försök) och det genomsnittliga resultatet i procent, sorterat efter flest försök.
- `app.js`- och `styles.css`-cachebustrar bumpade till 0.4.14.

## 0.4.13
- Highscore sparas nu automatiskt när quizet är klart — ingen "Spara"-knapp behövs längre. Namnet hämtas från "Mitt namn" på startsidan. Resultatskärmen bekräftar med "Resultatet sparades i topplistan".
- "Spara"-knappen på resultatskärmen ersatt med en "Avsluta"-knapp som går tillbaka till startsidan. Det numera överflödiga "Spara som"-fältet är borttaget.
- `app.js`-cachebustern bumpad till 0.4.13.

## 0.4.12
- Ny funktion "Öva extra på de jag svarar fel på" (checkbox på startsidan, gäller endast quiz, ej flashcards). När den är på vägs frågor man senast svarat fel på upp i quizurvalet så de slumpas fram ca 50% oftare (vikt 1.5 via viktad sampling utan återläggning). Helt dynamiskt: så fort man svarar rätt på en fråga tas den bort ur listan och behandlas som vilken annan fråga som helst. Tiden ut räknas som fel.
- Spårningen är lokal per webbläsare/enhet (`localStorage`-nyckel `hur_wrong_questions`) och uppdateras oavsett om checkboxen är på — checkboxen styr bara om viktningen tillämpas vid urvalet. Skrivfel (t.ex. privat läge på iPhone) hanteras tyst med fallback i minnet, som highscore.
- `app.js`- och `styles.css`-cachebustrar bumpade till 0.4.12.

## 0.4.11
- Highscore (iPhone): fixar att topplistan blev tom på iPhone. I privat läge (och vid lagringskvot) kastar `localStorage.setItem` ett `QuotaExceededError`, och `saveScore()` saknade felhantering — hela spar-funktionen avbröts tyst innan topplistan hann visas, så inget sparades och ingen varning gavs. Nu fångas felet: resultatet behålls i en minnes-fallback för den pågående sessionen så topplistan visas korrekt, och en engångsvarning förklarar att resultat inte kan sparas permanent i privat läge. Vanligt (icke-privat) läge sparar permanent som förut. Verifierat på alla 9 quizämnen.
- `app.js`-cachebustern bumpad till 0.4.11 så den uppdaterade koden hämtas.

## 0.4.10
- Muskler Flashcards: återställer extrinsisk-märkningen på supraspinatus, deltoideus, biceps brachii och triceps brachii. De togs felaktigt bort i 0.4.6 — källistan (Muskellista VT26) stämde: extrinsisk/intrinsisk gäller hela övre extremiteten (extrinsisk = muskelbuken utanför handen, intrinsisk = helt inne i handen). Nu 87 kort, 16 extrinsisk/intrinsisk-kort.
- Begreppskortet för "Extrinsisk muskel" omformulerat så det stämmer med den bredare definitionen ("muskelbuken ligger utanför handen, ursprung proximalt") istället för den tidigare för snäva "verkar på handen via långa senor".

## 0.4.9
- Flashcards (iOS/WebKit): fixar att svaret blinkade till vid avslöjandet på iPhone. Orsaken var `opacity`-övergången med `0s` varaktighet — WebKit behandlar det som "ingen övergång" och byter opacity direkt vid t=0, så svaret tändes medan frågan fortfarande syntes. Opacity har nu en riktig varaktighet (0.25s) och sidorna staggas: frågan tonar ut under flippens första halva, svaret tonar in under andra halvan. Vid mittpunkten är kortet kant-mot-kant och tomt → ingen dubbeltext.

## 0.4.8
- Flashcards: backar `will-change` och intoningsanimationen från 0.4.7 — de fick svaret att blinka till vid avslöjandet (tryck på frågan) på mobil, eftersom opacity-bytet mellan sidorna komponerades om. Avslöjande-flippen är åter i sitt ursprungliga, blinkfria skick.
- Den blinkfria fixen för kortbyte (rent snäpp till framsidan medan baksidan är dold) är kvar.

## 0.4.7
- Flashcards (mobil): fixar att nästa korts svar blinkade till vid kortbyte. Baksidan doldes tidigare bara via en fördröjd opacity-övergång medan svaret skrevs in på en timer — opålitligt på mobilens kompositlager. Nu snäpper kortet till framsidan utan animation och fyller i båda sidorna medan baksidan är garanterat dold, så inget kan skymta.
- Flip-tillbaka-animationen ersatt med en mjuk intoning av nästa kort (`fcCardEnter`). 3D-flippen vid avslöjandet är oförändrad. `will-change` på fram-/baksida ger jämnare flip på mobil.
- `app.js` får cache-buster (`?v`) så uppdaterad JS hämtas; `styles.css`-bustern bumpad till 0.4.7.

## 0.4.6
- Nytt flashcard-ämne "Muskler Flashcards" (83 kort) byggt från muskellistan VT26. Varje muskel ger upp till fyra korttyper där det är relevant: ursprung & fäste, funktion, innervation och extrinsisk/intrinsisk. Plus två allmänna begreppskort (vad extrinsisk resp. intrinsisk muskel innebär).
- Flashcard-framsidan stödjer nu en kursiv indikationsrad under namnet (t.ex. "(Vad är dess funktion?)") via nytt `sub`-fält + `.fc-question-sub`. Svarssidan renderar radbrytningar (`white-space: pre-line`).
- Extrinsisk/intrinsisk-märkning gäller endast handens muskler. Supraspinatus, deltoideus, biceps och triceps brachii fick INTE den märkningen trots att källistan felaktigt angav "EXTRINSICMUSKEL" — begreppet gäller bara muskler som verkar på handen.
- Källa till sanning: `scripts/generate_muskler_flashcards.py` genererar `data/muskler_flashcards.json`.

## 0.4.5
- SEO (canonical): startsidans `canonical` och `og:url` pekar nu på rot-URL:en `https://norrtou.github.io/anatomiquiz/` istället för `.../index.html`. GitHub Pages serverar startsidan på båda adresserna och Google kanoniserar index-sidor till rot-URL:en — den tidigare krocken gav "annan canonical än användarens" i Search Console.
- `sitemap.xml`: startsidans `<loc>` ändrad till samma rot-URL (matchar canonical + manifestets `start_url`).
- Interna länkar till startsidan i `info.html` och `medicinskordlista.html` (brödsmula + tillbaka-knapp) går från `index.html` till `./` så att alla länksignaler konsolideras på rot-URL:en.

## 0.4.4
- Startsidan: flyttar "Om Anatomiquiz"-introtexten längst ned på sidan med egen `<h2>`-rubrik. Döljs automatiskt under pågående quiz/flashcards via CSS (`#setup.hidden ~ .intro`) — ingen JS-ändring behövs.

## 0.4.3
- Startsidan (SEO): ny beskrivande introtext under taglinen med ämnen och målgrupp samt intern länk till ordlistan — ger sökmotorer unikt, indexerbart innehåll (tidigare nästan bara formulärkontroller).
- Tillgänglighet: fixar trasig ARIA-referens på startsidan (`aria-labelledby="setupHeading"` saknade målelement) genom en sr-only `<h2>`.
- info.html: rättar rubrikhierarkin — "Antal frågor" och "Versionshistorik" är nu `<h2>` (hoppade tidigare h1→h3).
- PWA: ny `manifest.json` (namn, ikoner, temafärg, standalone) länkad på alla sidor + genererade ikoner 192×192 och 512×512. Ger "Lägg till på hemskärmen" och moderna mobil-/SEO-signaler.

## 0.4.2
- Medicinsk ordlista (SEO + tillgänglighet): hela ordlistan förrenderas nu statiskt i HTML — alla 1 081 poster är crawlbara och indexerbara utan JavaScript (tidigare syntes bara 195 i no-JS-fallbacken).
- Nytt byggskript `scripts/generate_glossary.py` är enda källan till sanning: genererar statiskt `<dl>`-innehåll, JSON-LD `DefinedTermSet` med samtliga termer (`hasDefinedTerm`) och uppdaterar termantalet i titel/meta/Open Graph/Twitter.
- Korrekt termantal (1081) i alla metataggar, titel och strukturerad data — tidigare felaktigt "195".
- Semantisk markup: ordlistan renderas som `<dl>/<dt>/<dd>` med stabila ankar-id per term (`#term-...`) och `lang="en"` på engelska termer. `glossary.js` renderar byte-identisk markup.
- `glossary.js` skriver inte längre över det förrenderade innehållet om datahämtningen misslyckas (graceful degradation).
- Favikon: lägger till SVG-favikon och `apple-touch-icon` på alla sidor.
- Rättar `VERSION` (låg felaktigt kvar på 0.3.98).

## 0.4.1
- Medicinsk ordbok: alla 1 081 poster märkta med ordklass — (subst.), (adj.), (verb), (prefix) eller (adv.) — direkt i beskrivningen före Sv:/Eng:.

## 0.4.0
- Medicinsk ordbok: 886 nya poster tillagda från KI:s anatomiska termförteckning; totalt 1081 poster (A–Ö).

## 0.3.99
- Infosidan: byter rubrik "Frågestatistik" till "Antal frågor".

## 0.3.98
- Infosidan: Studenters flashcards visas dynamiskt i frågestatistiken, separat under quiztotalen med egna kolumnmarkeringar.

## 0.3.97
- Studenters flashcards: tar bort examensrelikter — instruktionsprefix ("Skriv ut de latinska namnen för...", "Skriv följande begrepp på latin...", "Välj rätt svar" m.fl.) och tentanumrering borttagna. 54 fält åtgärdade.

## 0.3.96
- Studenters flashcards: tar bort poängreferenser som (1p), (2p), (6p) m.fl. — reliker från tentafrågor. 99 fält åtgärdade.

## 0.3.95
- Studenters flashcards: ersätter alla PUA-tecken (FontAwesome-symboler som renderas som rektanglar) med radbrytningar. 103 fält åtgärdade.

## 0.3.94
- Studenters flashcards: tar bort 31 omvändningskort där en lång faktabeskrivning stod som fråga — alla hade redan ett partnerkort med rätt riktning (term → beskrivning). 806 kort.

## 0.3.93
- Studenters flashcards: fler utbytta fråga/svar fixade — 3 dubbletter med frågan på fel sida borttagna, kvarlämnad chatbot-avslutning i ffc_904 städad. 837 kort.

## 0.3.92
- Studenters flashcards: rätta utbytta fråga/svar — 4 inverterade dubbletter borttagna, 5 innehållsfel fixade (felaktiga svar på flervalsfrågor, trasig flervalsuppgift omformulerad). 840 kort.

## 0.3.91
- Studenters flashcards: andra korrekturrundan — 85 rättningar. Latinska böjningsformer (cubitii→cubiti, Spina Scapula→Spina scapulae, caput glenohumerale→caput humeri, Os ischi→Os ischii), stavfel, saknade mellanslag vid parenteser, saknade radbrytningar i listor, dubbla mellanslag, fel genus (den/det), saknade punkter, anatomisk felaktighet (atlas-kortet).

## 0.3.90
- Ta bort rubriken "Skapa ett quiz åt mig".

## 0.3.89
- Flashcard klart-vy: tre knappar på rad — "Pröva igen" (samma kort), "Nya kort" (ny omgång), "Avsluta".

## 0.3.88
- Studenters flashcards: raderar 31 bildkort där frågan är obegriplig utan bild. Städar bort "(se bild)"-noter ur kort som i övrigt har fullgott innehåll. 844 kort kvar.

## 0.3.87
- Studenters flashcards flyttas till plats 2 i ämneslistan.

## 0.3.86
- Döper om ämnet "Funktionell Anatomi FC" → "Studenters flashcards" (filnamn, topic-fält, source-fält, UI).

## 0.3.85
- Funktionell Anatomi FC: korrektur och kvalitetskontroll av alla 875 kort — stavfel, grammatik, latinska termer, felmatchade par, bildkort utan bild raderade, triple-quotes rensade.

## 0.3.84
- Nytt ämne: Funktionell Anatomi FC — 942 flashcards importerade från externa CSV-filer (Noji-export).

## 0.3.83
- Flashcard: svarsfördröjning 800→1200ms.

## 0.3.82
- Flashcard: fördröjning för svarspopulering 500ms → 800ms för att undvika att svaret skymtas.

## 0.3.81
- Flashcard: återställer transform på .fc-front (behövs för animationstiming) — grön bakgrund via .fc-card istället, .fc-front transparent.

## 0.3.80
- Info-sidan: rubrik "Info" borttagen.

## 0.3.79
- Frågestatistik: procentsatser borttagna ur tabellen.

## 0.3.78
- Info-sidan: dynamisk frågestatistik-tabell (ämne, totalt, Normal/Svår) hämtad direkt från JSON-filerna.

## 0.3.77
- fc-hint: 0.64rem (20% mindre) och kursiv stil.

## 0.3.76
- Tar bort #flashcards bakgrundsfärg — sektionen ska vara vit, bara kortet (#bbf7d0) ska vara grönt.

## 0.3.75
- CSS-länk: ?v=0.3.75 cache-busting query-parameter — tvingar webbläsare att ladda ny CSS istället för cachad version.

## 0.3.74
- Flashcard framsida: tar bort transform:rotateY(0deg) från viloläget — no-op-3D-transform skapade compositing-lager som blockerade background-color på mobil.

## 0.3.73
- Flashcard: grön bakgrund på .fc-card istället för .fc-front — 3D-transform på fc-front blockerade bakgrundsrendering på mobil.

## 0.3.72
- Flashcard framsida: background #bbf7d0 — kortet självt är grönt, inte bara sektionen.

## 0.3.71
- Flashcard-sektionen (#flashcards): background #d1fae5 — åsidosätter .card:s vita bakgrund direkt på sektionsnivå.

## 0.3.70
- Flashcard framsida: #d1fae5 (tydligare grön) — #f0fdf4 var för nära vitt för att synas på mobilskärmar.

## 0.3.69
- Flashcard framsida: solid #f0fdf4 istället för gradient — gradient renderas inte av iOS Safari i 3D-transformkontext.

## 0.3.68
- Flashcard framsida: grön bakgrundsgradient (#f0fdf4 → #ecfdf5) istället för vitt — syns mot den gröna sidabakgrunden.

## 0.3.67
- Primärknapparna: display:grid grid-template-columns:1fr 1fr — CSS grid påverkas inte av flex-overrides som bröt iOS WebKit.

## 0.3.66
- Primärknapparna: min-width: 0 tillagd — iOS WebKit låter annars flex-items behålla sin textbredd som minimum.

## 0.3.65
- Primärknapparna: flex: 1 !important i mobilmedian — identisk med sekundärknapparna.

## 0.3.64
- Primärknapparna: identisk flex-logik som sekundärknapparna. width: 100% borttagen från btn-start.

## 0.3.63
- Knappar: display:grid grid-template-columns:1fr 1fr — inga overrides behövs.
- Animation: opacity-teknik istället för backface-visibility, fungerar i alla browsers.

## 0.3.62
- Flashcard-animation: per-element-perspective istället för preserve-3d — fungerar på iOS Safari med border-radius.
- Primärknapparna: white-space: nowrap och mindre font på mobil förhindrar radbrytning.

## 0.3.61
- Flashcard-animation: webkit-prefix tillagda på alla 3D-transforms och perspective så animationen fungerar på mobil.

## 0.3.60
- Mobil: de två gröna startknapparna delar nu alltid samma rad.

## 0.3.59
- Flashcards: svaret töms innan flip-back-animationen startar så att nästa korts svar inte skymtas vid övergången.

## 0.3.58
- Flashcards: andra klicket på kortet går nu vidare till nästa kort. Ledtext "Tryck för nästa kort" visas på baksidan.

## 0.3.57
- Ny funktion: Flashcards. Välj ämne precis som i quizet — framsidan visar frågan, baksidan svaret. Klicka kortet för att flippa. Tidsinställning: timern flippar automatiskt och nästa kort visas efter 4 sekunder. Knappen "Starta flashcards" ligger bredvid "Starta quiz" på startsidan.

## 0.3.56
- Tagline på startsidan ändrad till "Öva på funktionell anatomi med quiz och flashcards".

## 0.3.55
- Favicon uppdaterad till skeletthand-ikon (64x64 PNG).

## 0.3.54
- Favicon tillagd (ben-ikon i SVG) på alla sidor.
- Ordlistans 195 termer inbäddade i noscript-block för sökmotorsynlighet.
- Ordlistesidan: preload, theme-color och color-scheme tillagda. Stavfel i keywords rättat.
- Ordlistesidan och info-sidan: OG- och Twitter-bildtexter korrigerade till sidspecifika texter.
- Info-sidan: keywords och fullständig robots-tagg tillagda. H1 ändrad till "Om Anatomiquiz".

## 0.3.53
- Startsidan: canonical och og:url uppdaterade till explicit adress, konsekvent med sitemapen.

## 0.3.52
- Sitemap: startsidan listad med explicit adress, konsekvent med övriga sidor.

## 0.3.51
- Strukturerad data: BreadcrumbList-URLs ändrade till absoluta adresser på ordliste- och info-sidan.

## 0.3.50
- Google Search Console-verifieringstaggen tillagd.

## 0.3.49
- Sitemap och robots.txt tillagda för sökmotorer. Alla sidor länkar till sitemapen.

## 0.3.48
- Open Graph komplett på alla sidor: og:url, og:image (1518x864), bildmått och alt-text aktiverade. Canonical-URL satt. Info-sidan fick Twitter Card. Bildfil tillagd i projektet.

## 0.3.47
- Medicinska ordlistan: engelska termen efter "Eng:" visas nu kursivt.

## 0.3.46
- Versionshistorik: alla filnamn med ändelser borttagna ur alla poster.

## 0.3.45
- Versionshistorik: alla poster renskrives som ren text utan filnamn, HTML-taggar eller teknisk notation som mobilwebbläsare auto-länkar.

## 0.3.44
- Info-sidan: HTML-tecken i ändringsloggen escapas nu innan de renderas.

## 0.3.43
- sr-only-klass definierad i stilmallen (saknades — skärmläsar-labels syntes som vanlig text).
- Ordlistesidan: redundant sökrubrik borttagen.

## 0.3.42
- Info separerad till egen sida med SEO och brödsmulor — samma struktur som ordlistesidan.
- Changelog-logik extraherad till separat skriptfil.

## 0.3.41
- Brödsmula ordlistesidan (mobil): alla länktillstånd täckta, tap-highlight borttagen.

## 0.3.40
- Brödsmula på ordlistesidan: specificitet ökad för att slå webbläsarens standardfärg på ankarlänkar.

## 0.3.39
- Ordlista-knappen: ändrad till knapp-element för att eliminera automatiskt understreck.

## 0.3.38
- Ordlistesidan: brödsmulorna flyttade in i kortet — samma placering som på info-sidan.

## 0.3.37
- Brödsmuleknappar: OS-standardstyling nollställd för enhetlig design på iOS och Android.

## 0.3.36
- Ordlista-knappen: understreck borttaget med !important.

## 0.3.35
- Info-sidan: tillbakaknapp överst ersatt med brödsmula.
- Brödsmule-CSS centraliserad och dubbletter borttagna.

## 0.3.34
- Ordlistesidan: tillbakaknapp tillagd högst upp i kortet.

## 0.3.33
- Ordlista-knappen (mobil): understreck borttaget för alla länktillstånd.

## 0.3.32
- Info-sidan: tillbakaknapp tillagd högst upp, precis som den befintliga längst ned.

## 0.3.31
- Ordlista-knappen: understreck borttaget.

## 0.3.30
- Startsidan: komplett SEO-uppdatering med Open Graph, Twitter Card och strukturerad data.
- Webbläsartema, preload och defer tillagt.

## 0.3.29
- Ordlistan separerad till egen sida med full SEO, brödsmulor och termräknare.
- Ordlistedata flyttad till separat JSON-fil (195 termer).
- Ordliste-logik och stilar extraherade till egna filer.

## 0.3.28
- Ordlistan: etymologinot tillagd på alla ~185 poster med latinskt/grekiskt ursprungsord och bokstavlig betydelse (t.ex. "acetabulum = ättikskål", "musculus = liten mus", "phalanx = stridsformation").

## 0.3.27
- Info-, Ordlista- och Topplista-knapparna täcker nu hela radens bredd på mobil, liksom Starta quiz-knappen ovan.

## 0.3.26
- Ordlistan berikad: alla ~185 poster kompletterade med svenska synonymer (sv:), engelska termer (eng:), lekmannauttryck och alternativa stavningar — t.ex. falanger/falang för phalanges, diafragma för diaphragma, likvor för liquor cerebrospinalis, RBC/WBC, Hb m.fl. Sökfunktionen täcker hela definitionen.

## 0.3.25
- Ordlistan utökad med 24 nya termer: kroppspositioner (anatomisk position, ryggläge, bukläge, sidoläge, Fowlerläge, Trendelenburgläge, omvänt Trendelenburgläge, litotomiläge, simsläge), rörelsetermer (inåtrotation, utåtrotation, deviation, anteversion, retroversion, protrusion, retrusion), riktningstermer (central, perifer, intermediär, internus, externus, obliqt plan) och ytor (parietal, visceral).

## 0.3.24
- Faktakontroll ordlistan: stavfelen i Fossa och Synovialis rättade.
- Ordlistan: textstorlek höjd, samma som info-sidan.

## 0.3.23
- Ny sida: Ordlista med 140 latinska och medicinska termer som används i quizet, sorterade alfabetiskt med korta förklaringar. Sökfunktion filtrerar direkt på term och förklaring. Nås via ny knapp på startsidan. Knapplayouten omstrukturerades: "Starta quiz" är nu en tydlig primärknapp ovanför Info, Ordlista och Topplista.

## 0.3.22
- Faktakontroll av riktningar: 5 rättningar — sagittalplan/frontalplan (q224, q225), adduktion/depression (q399), Superior/Kaudal som distraktor (q446), stavfel i frågetext (q214).

## 0.3.21
- Döpte om "Blandade frågor" till "Slumpade frågor" och flyttade det sist i ämnesmenyn. Slumpade frågor hämtar nu automatiskt från alla aktiva ämnen inklusive Neurologi och Blodomloppet.

## 0.3.20
- Versionsnummer i headern laddas nu dynamiskt istället för att vara hårdkodat.

## 0.3.19
- Lade till Blodomloppet som aktivt ämne: 100 sant/falskt-frågor (Normal svårighet). Täcker systemkretsloppet, lungkretsloppet, hjärtanatomi, retledningssystemet, kärltyper, blodkomponenter och fysiologi. Språkkorrigering: "bakflöde" korrigerat till "backflöde".

## 0.3.18
- Lade till Neurologi som aktivt ämne: 120 sant/falskt-frågor (Normal svårighet). Täcker CNS/PNS-struktur, neuron, myelin, synapser, signalsubstanser, aktionspotential, reflexer, hjärnstrukturer, ledning, reception, regeneration, neuroplasticitet, utveckling och åldrande.

## 0.3.17
- Fixade Info-sida: ändringsloggen visar nu alla versioner med fullständigt innehåll och sidan scrollas naturligt.

## 0.3.16
- Lade till Info-sida med appbeskrivning, länk till Norrtou Creations på GitHub och dynamisk ändringslogg. Info-knapp tillagd på framsidan.

## 0.3.15
- Faktakontroll av alla Normal-frågor om muskler: 11 rättningar — fabricerade muskelnamn borttagna ur distraktorer och ersatta med etablerade svenska anatomiska termer. Alla korrekta svar bekräftade faktamässigt korrekta.

## 0.3.14
- Kompletterade muskelfrågorna med 73 nya frågor (Normal svårighet) baserade på kurslistan: ursprung, fäste, klassificering och funktion. Totalt 273 frågor om muskler.

## 0.3.13
- Tentaplugg är nu förstaval i ämnesmenyn.

## 0.3.12
- Kvalitetsgranskning av riktningsfrågor: 9 rättningar — faktafel (Hörseln→Örat), stavfel (drejer→vrider), felaktiga distraktorer och inkonsekvent stavning av Dorsalflexion.

## 0.3.11
- Kvalitetsgranskning av muskelfrågor: 8 rättningar — duplikat-ID, inkompletta meningar och grammatikfel åtgärdade.

## 0.3.10
- Borttagen mening om Handen och svårighet från ingresstexten på framsidan.

## 0.3.9
- Kvalitetsgranskning av benfrågor: 56 rättningar — stavfel i frågetext, faktafel, grammatik och felaktigt kategoriserade frågor åtgärdade.
- Fixade bugg i Tentaplugg där ämnet inte gick att starta.

## 0.3.8
- Ändrade menytext från "Studier (tentor)" till "Tentaplugg".

## 0.3.7
- Bytte namn på ämnet Studier till Tentaplugg och uppdaterade alla referenser.

## 0.3.6
- Kvalitetsgranskning av Studier-frågorna: stavfel, grammatik och parentesformat som avslöjade korrekta svar åtgärdade (46 frågor). Bekräftade 59 sant/falskt-frågor i ämnet.

## 0.3.5
- Utökade "Studier (tentor)" med 148 nya frågor (HT25 omtenta, VT20, VT21, HT22) — totalt 353 frågor i ämnet.

## 0.3.4
- Lagt till nytt ämne "Studier (tentor)" med 205 frågor baserade på ATPB14 ordinarie tentor (HT25 och VT24). Täcker neurologi, osteologi, fysiologi, kardiologi, leder, muskler, ergonomi och åldrande.

## 0.3.3
- Fixade versionsvisning i rubriken - versionen visas nu synligt till höger om "Anatomiquiz" på både dator och mobil.

## 0.3.2
- Lagt till alla ämnen (neurologi, blodomloppet) i "Blandade frågor" och aktiverat Hard-svårighet för relevanta ämnen.

## 0.3.1
- Flyttat "Medicinsk terminologi" till position 2 i ämnes-listan för bättre synlighet.

## 0.3.0
- Skapat nytt ämne "Medicinsk terminologi" med 500 MC-frågor baserade på 133 medicinska termer (latin/grekiska). Blandad mix av svenska→latin och latin→svenska frågor med 4 alternativ vardera.
