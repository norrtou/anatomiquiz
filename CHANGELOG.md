# CHANGELOG - Anatomiquiz

## 0.9.7
- **Tillägg i "Om Anatomiquiz"-intron.** Ny mening om att det utförligaste övningsmaterialet för närvarande finns inom arbetsterapi och att arbete pågår för att alla utbildningar ska få ett lika rikt material. Endast synlig brödtext i intro-sektionen (ingen meta/head rörd).
- APP_VERSION/VERSION → 0.9.7 (cachebuster: app.js → 0.9.7).

## 0.9.6
- **Nytt flashcard-ämne "Anatomi & fysiologi (FC)" under Sjuksköterska.** 82 kort (term → definition) som täcker cell, nervsystem, hjärta/blod, andning, njurar, hormoner, matsmältning, muskler/skelett, immunförsvar och syra-basbalans. Ny datafil `data/anatomi_fysiologi_flashcards.json`, sökväg i `getQuestionsPath()` och `<option data-edu="sjukskoterska">` i ämnesväljaren. Rent FC-ämne → ingår inte i Slumpade frågor.
- APP_VERSION/VERSION → 0.9.6 (cachebuster: app.js → 0.9.6).

## 0.9.5
- **Ny utbildning "Allmänt" i väljaren "Välj utbildning".** Placerad överst (före Arbetsterapeut) och avsedd att samla framtida ämnen som inte är yrkesspecifika. Inga ämnen kopplade ännu – ämnen knyts via `data-edu="allmant"` på respektive `<option>` när de flyttas in.
- Endast `index.html` (ett nytt `<option>`). APP_VERSION/VERSION → 0.9.5 (cachebuster: app.js → 0.9.5).

## 0.9.4
- **Stickprovsverifiering av 0.9.3 års ICD-koder mot svenska källor.** 22 koder kontrollerade mot ICD-10-SE (Socialstyrelsen, Internetmedicin, ekg.nu, Region Kronoberg m.fl.) – samtliga korrekta. Bekräftat att kodningen genomgående följer **svensk ICD-10-SE/WHO**, inte amerikanska ICD-10-CM (t.ex. trombocytos D75.8, inte CM:s D75.83).
- **Finputs:** SIRS-posten ändrad från kategorinivå `R65` till `R65.9` (ospecificerat systemiskt inflammatoriskt svarssyndrom) enligt ICD-10-SE.
- Endast `data/ordlista.json` (en post). Ordlistan omgenererad. APP_VERSION/VERSION → 0.9.4 (cachebuster: app.js → 0.9.4, glossary.css/glossary.js → 0.9.4).

## 0.9.3
- **ICD-koder tillagda på 354 sjukdoms-/diagnosposter som saknade kod.** Ordlistan gick från 594 till 948 poster med ICD-kod. Berikningen gjordes kapitelvis A–Ö och omfattar diagnoser, infektioner, tumörer, syndrom, skador och förgiftningar (t.ex. ALL C91.0, Sjögrens syndrom M35.0, tetanus A35, WPW I45.6, Fallots tetrad Q21.3). Koden står sist i posten enligt 0.9.2-mallen; där koden är lokal- eller orsaksberoende anges representativ kod med kvalificerare (t.ex. "kodas efter lokal").
- **Endast äkta kodbara diagnoser kodades.** Adjektiv (t.ex. malign, idiopatisk), läkemedel (5-ASA, 5-FU), antikroppar/labbmarkörer (anti-GBM, CRP, ferritin), processer/procedurer (apoptos, debridering) och ren anatomi lämnades medvetet utan kod.
- Primärt svensk ICD-10(-SE); osäkra/sällsynta koder utelämnades hellre än gissades. Endast `data/ordlista.json` (textinnehåll); ordlistan omgenererad.
- APP_VERSION/VERSION → 0.9.3 (cachebuster: app.js → 0.9.3, glossary.css/glossary.js → 0.9.3).

## 0.9.2
- **ICD-koderna placeras nu sist i varje ordlistepost.** Klassificeringskoderna (ICD-10/ICD-11) låg tidigare mitt i definitionen – ofta före etymologin ("Av …") eller före ålderdomliga synonymer/korsreferenser – vilket var inkonsekvent. Nu står kod- och klassificeringsblocket alltid sist, efter betydelse, Sv./Eng./Vardag., etymologi, Ålderdomligt och Jfr/Se. 325 poster justerade. Ordningsföljden inom kodblocket bevaras (ICD-10 före ICD-11).
- Endast omflyttning av befintlig text i `data/ordlista.json`; inga koder ändrade, lagda till eller borttagna (prosamentioner som "enligt DSM/ICD" rörs inte). Ordlistan omgenererad.
- APP_VERSION/VERSION → 0.9.2 (cachebuster: app.js → 0.9.2, glossary.css/glossary.js → 0.9.2).

## 0.9.1
- **"Sök i hela ordlistan ovan" → "nedan" på alla ordliste-sidor.** Sökfältet ligger under ingressen i sidmallen, så hänvisningen var felvänd. Rättat i landningssidans ingress och i alla gruppsidors taglines (bokstäver, siffror, prefix, suffix).
- `scripts/generate_glossary.py` (taglines). Ordlistan omgenererad. APP_VERSION/VERSION → 0.9.1 (cachebuster: app.js → 0.9.1, glossary.css/glossary.js → 0.9.1).

## 0.9.0
- **Ingressen på medicinska ordlistans landningssida omformulerad.** Den synliga ingressen säger nu "latinska och grekiska termer" (tidigare bara "latinska och medicinska") och beskriver vad listan faktiskt innehåller: "9 383 latinska och grekiska termer: anatomi, fysiologi, sjukdomar, labbprover, förkortningar samt för- och efterleder" (ersätter det vaga "anatomiska, fysiologiska, patologiska, biologiska och tekniska termer"). Endast den synliga `<p class="tagline">` (body) – meta/SEO orört. Antalet (9 383) är fortsatt dynamiskt.
- `scripts/generate_glossary.py` (`write_landing`-tagline). Ordlistan omgenererad. APP_VERSION/VERSION → 0.9.0 (cachebuster: app.js → 0.9.0, glossary.css/glossary.js → 0.9.0).

## 0.8.74
- **Förstavelser (prefix) får en egen sida – `ordlista-prefix.html` – precis som suffixen.** Tidigare låg de 659 prefix-posterna (a-, hyper-, endo-, cefalo-, giga …) utspridda bland bokstavssidorna medan ändelserna (suffix) redan hade en samlad sida; det var inkonsekvent. Nu samlas alla prefix på en egen sida med eget chip ("prefix") i alfabetsraden, mellan siffror och suffix. Bokstavssidorna krymper i motsvarande mån (prefixen flyttas ut).
- **Routing avgörs av ordklassen i definitionen**, inte av termens form: en post är prefix om def inleds med `prefix `/`Förled` (och inte är ett streck-suffix), suffix om den inleds med `-`, `suffix ` eller `Efterled`. `page_key()` i generatorn och `pageKey()`/`isPrefixEntry()`/`isSuffixEntry()` i `js/glossary.js` hålls byte-identiska så att sök-djuplänkar pekar rätt (verifierat: 659 prefix / 153 suffix i båda).
- **Bing-vänlig meta, titel och ingress för prefix-sidan.** Egen `<title>` ("Medicinska förstavelser och prefix förklarade | Anatomiquiz", ≤60 tecken), unik `<meta name="description">` (≤157 tecken) och egen synlig ingress.
- **Prefix- OCH suffix-sidorna säger nu uttryckligen att affixen är både latinska och grekiska** (för medicinska och anatomiska termer), inte enbart latinska – i description och ingress.
- `scripts/generate_glossary.py` (ny `prefix`-grupp, `is_prefix`/`is_suffix`, `SPECIAL`-konstanter, taglines) + `js/glossary.js` (spegling). Ordlistan omgenererad (32 gruppsidor + landning + sitemap). APP_VERSION/VERSION → 0.8.74 (cachebuster: app.js → 0.8.74, glossary.css/glossary.js → 0.8.74).

## 0.8.73
- **Utbildningar utan ämnen gråas ut i "Välj utbildning".** Yrken som ännu inte har något ämne taggat åt sig (Fysioterapeut, Läkare, Medicinsk sekreterare) visas nu som inaktiverade `<option>` med suffixet "(inga ämnen ännu)" och går inte att välja. Arbetsterapeut och Sjuksköterska (som har ämnen) är opåverkade. Datadrivet: byggs av vilka `data-edu` som faktiskt förekommer bland ämnesoptionerna, så ett yrke aktiveras automatiskt när dess första ämne läggs till.
- En sparad men nu utgråad utbildning återställs inte längre vid inläsning (faller tillbaka på förvalet Arbetsterapeut).
- `js/app.js`: ny `updateEducationOptions()` (körs efter `captureTopicOptions`), `applySettings` kräver nu valbart (ej `disabled`) alternativ. APP_VERSION/VERSION → 0.8.73 (cachebuster: app.js → 0.8.73).

## 0.8.72
- **Nytt ämne "Medicinsk latin" (MC) för Sjuksköterska.** Första ämnet under utbildningen Sjuksköterska: 138 multiple choice-frågor på vanliga anatomiska/medicinska latinska termer (förleder, riktningar, rörelser, strukturer, kroppsregioner). Varje term frågas som "Vad betyder …?" med ett korrekt svar + tre distraktorer plockade ur samma betydelsefamilj. Källa: 140 flashcards från ett Quizlet-set (anatomi & fysiologi för sjuksköterskor), kvalitetssäkrade vid import.
- **Rättelser mot källan:** truncus = bål/stam (källan hade "tarm"; dubbletten "trancus = bål" sammanslagen); proximalt = närmare bålen (källan: "sämre mot bålen"); adduktion = mot mittlinjen/medialt (källan tog felaktigt även med "lateralt"); abdomen (källan felstavat "abdoment"); hyper-/hypo- = över/för mycket resp. under/för lite (källan: "överkant/underkant"); os förekom tre gånger → dubblett borttagen och betydelserna skilda med genitiv (os, oris = mun; os, ossis = ben). 140 källkort → 138 unika frågor.
- **Ingressen uppdaterad** på startsidan: "Öva på funktionell anatomi med quiz och flashcards" → "Öva på anatomi och medicinsk terminologi med quiz och flashcards" (endast on-page `<p class="tagline">`; meta/SEO orört).
- Ny `data/medicinsk_latin.json` + generator `scripts/generate_medicinsk_latin.py`. `index.html` (ny `<option data-edu="sjukskoterska">` + tagline) + `js/app.js` (sökväg i `getQuestionsPath`). APP_VERSION/VERSION → 0.8.72 (cachebuster: app.js → 0.8.72).

## 0.8.71
- **Startvyn ryms utan scroll igen efter utbildningsväljaren.** Tog bort den kursiva "Inga ämnen för den här utbildningen ännu"-notisen (tom utbildning visas nu enbart genom tom ämneslista + skuggade Starta-knappar) och tajtade den vertikala rytmen i `#setup` (label/select-marginaler 16/8 → 10/4) så att Starta-knapparna får plats utan att man behöver scrolla på mobil. Övriga formulär orörda.
- `index.html` (notis borttagen) + `js/app.js` (toggle-logiken borttagen) + `css/styles.css` (`#setup`-marginaler). APP_VERSION/VERSION → 0.8.71 (cachebuster: app.js → 0.8.71, styles.css → 0.7.3 på index.html).

## 0.8.70
- **Ny utbildningsväljare ovanför ämnet ("Välj utbildning").** Startvyn har fått en dropdown som delar upp ämnena per utbildning. **Arbetsterapeut** är förvald och har alla nuvarande ämnen; **Fysioterapeut, Läkare, Medicinsk sekreterare** och **Sjuksköterska** finns som val men har ännu inga ämnen (visar notisen "Inga ämnen för den här utbildningen ännu – de byggs ut efter hand"). Nya ämnen taggas bara med `data-edu="<utbildning>"` på sin `<option>` så fylls de på efter hand med samma system som arbetsterapeutämnena.
- **Datadrivet, byggt ovanpå befintligt filter.** `captureTopicOptions`/`updateTopicOptions` filtrerar nu på utbildning **+** frågetyp; tom utbildning tömmer ämnesväljaren och skuggar startknapparna. Valet sparas i inställningarna (`education`) och överlever omladdning.
- `index.html` (utbildnings-`<select>`, `data-edu` på alla ämnen, tom-notis) + `js/app.js` ändrade. APP_VERSION/VERSION → 0.8.70 (cachebuster: app.js → 0.8.70).

## 0.8.69
- **Kvalitetssäkring av hela ordlistan + omarbetad info-sida.** Maskinell genomgång av samtliga 9 383 poster: struktur (inga tomma/trasiga poster, inga dubbletter), slug/ankare (inga äkta kollisioner), ICD-koder (554 distinkta kategorier, alla formellt giltiga, 27/27 mot facit av kända koder), tecken/kodning (ingen mojibake; `<`/`>` escapas korrekt) och språk (inga dubbla blanksteg eller saknade slutpunkter; korrekt etikett-casing).
- **18 nya diagnoser med ICD-koder** (tidigare luckor): testikeltorsion (N44.0), epiglottit (J05.1), invagination (K56.1), akut/kronisk njursvikt (N17/N18), trumhinneperforation (H72), retinitis pigmentosa (H35.5), mollusker (B08.1), non-Hodgkin-lymfom (C82–C85), klimakteriebesvär (N95.1), livmoderframfall (N81), ablatio placentae (O45), huvudlöss (B85.0), ringorm (B35), sängvätning (F98.0), gigantism (E22.0), överaktiv blåsa (N32.8), golfarmbåge (M77.0), frusen skuldra (M75.0), vaxpropp (H61.2). Tre befintliga poster (ibs K58, parodontit K05, karies K02) fick ICD-kod. 9 366 → **9 383 termer, 594 med ICD-10-kod**.
- **Rättat:** fyra felaktiga interna länkmarkörer (`[[…]]`) i ordlistedefinitioner omgjorda till ordbokens "Jfr …"-form.
- **info.html omskriven** med formell, informativ beskrivning av både quizet och den medicinska ordlistan, ett avsnitt om källor och kvalitetssäkring, samt notering att materialet är skapat och kvalitetssäkrat av en studerande i arbetsterapi vid Lunds universitet. Ny `.info-subheading`-stil (css cachebuster på info.html → 0.7.2). SEO/`<head>`/meta orörda.
- `data/ordlista.json` + regenererade `medicinskordlista.html`/`ordlista-*.html` ändrade. APP_VERSION/VERSION → 0.8.69 (cachebuster: app.js → 0.8.69).

## 0.8.68
- **Återställde namnet "Medicinsk ordlista" i UI (ångrade 0.8.67:s "lexikon"-byte).** Startsidans knapp + brödtext, ordlistans H1, sökrubrik/sökfält (placeholder + aria-label "Sök i hela ordlistan"), bakåtknappen ("← Tillbaka till ordlistan") och ingresstexterna heter åter "ordlista"/"ordlistan". Meta/title m.m. var redan oförändrade. Diagnos- och ICD-tilläggen (9 366 termer, 574 med ICD-10-kod) är orörda.
- `scripts/generate_glossary.py` + `index.html` återställda; alla `ordlista-*.html`/`medicinskordlista.html` regenererade. APP_VERSION/VERSION → 0.8.68 (cachebuster: app.js → 0.8.68).

## 0.8.67
- **Ordlistan kallas nu "Medicinskt lexikon" i knappar och rubriker** (den har vuxit till ett fullödigt medicinskt lexikon). Ändrat i synlig UI-text: startsidans knapp ("Medicinskt lexikon") och brödtext, lexikonets H1 ("Medicinskt lexikon"), sökrubrik/sökfältets placeholder och aria-label ("Sök i hela lexikonet"), bakåtknappen ("← Tillbaka till lexikonet") samt sidornas ingresstexter. **Meta/`<title>`, meta-descriptions, Open Graph/Twitter, JSON-LD och brödsmulor lämnades medvetet oförändrade** ("Medicinsk ordlista") för att inte röra SEO; filnamn och URL:er (`medicinskordlista.html`, `ordlista-*.html`) är också oförändrade så inga länkar bryts.
- **Fler diagnoser med ICD-koder.** 9 320 → **9 366 termer**; nu bär **574 poster svensk ICD-10-(SE)-kod**. 46 nya + 36 berikade: bl.a. SVT, klusterhuvudvärk/Hortons huvudvärk, hypertensiv kris, kardiogen chock, asbestos, gastrointestinal blödning, tarmpolyp, prediabetes, urinblåse-/testikelcancer, testistorsion, spänningshuvudvärk, social fobi, postpartumdepression, hetsätningsstörning, Aspergers syndrom, intellektuell funktionsnedsättning, denguefeber, amöbiasis, giardia, springmask, huvudlöss, gula febern, kontakteksem, mollusker, närsynthet/myopi/översynthet/astigmatism/presbyopi, näsblödning, heshet, dubbelseende, nackspärr, ryggsmärta, kotkompression, neonatal gulsot, plötslig spädbarnsdöd, prematuritet, B12-/folatbrist m.fl.
- `data/ordlista.json` + `scripts/generate_glossary.py` (UI-text) + `index.html` (knapp/brödtext) ändrade; alla `ordlista-*.html`/`medicinskordlista.html` + `sitemap.xml` regenererade. Inga cachebusters för glossary.js/css bumpade (oförändrade). APP_VERSION/VERSION → 0.8.67 (cachebuster: app.js → 0.8.67).

## 0.8.66
- **Ordlistan utökad med sällsynta syndrom och subspecialitetsdiagnoser (med ICD-koder).** 9 256 → **9 320 termer**; nu bär **492 poster svensk ICD-10-(SE)-kod** (~360 även ICD-11). 64 nya diagnoser + 22 befintliga berikade med koder.
- **Genetiska/sällsynta syndrom:** Marfans, Ehlers-Danlos, neurofibromatos, tuberös skleros, fragilt X, Prader-Willis, Angelmans, Retts, akondroplasi, osteogenesis imperfecta, Duchennes muskeldystrofi, galaktosemi. **Vaskuliter/reuma:** Behçets, Wegeners granulomatos, Takayasus arterit, Kawasakis sjukdom, antifosfolipidsyndrom, reaktiv/psoriasis-/juvenil idiopatisk artrit, Raynaud. **Hematologi/lever:** von Willebrands sjukdom, faktor V Leiden, essentiell trombocytemi, myelofibros, primär biliär/skleroserande kolangit, autoimmun hepatit. **Neurologi:** spinal muskelatrofi, essentiell tremor, Creutzfeldt-Jakob, post-polio, polio. **Barn/ortopedi/gyn/öga/hud/infektion:** Hirschsprungs sjukdom, pseudokrupp, Perthes sjukdom, Osgood-Schlatter, höftledsluxation, febrila kramper, cervixdysplasi, hyperemesis gravidarum, Dupuytrens kontraktur, hallux valgus, spinal stenos, Bakercysta, rotatorkuffsruptur, torra ögat, lichen planus, pityriasis rosea, seborroiskt eksem, nagelsvamp, legionella, mykoplasma, herpesencefalit, septisk artrit, erythema nodosum m.fl.
- Genetiska syndromens ICD-10 (Q-koder) säkra; osäkra ICD-11-koder utelämnade hellre än gissade. Urval koder spot-verifierade mot Socialstyrelsen/Internetmedicin/1177/WHO (t.ex. Wegener M31.3, PBC K74.3, PSC K83.0).
- Endast `data/ordlista.json` + regenererade `medicinskordlista.html`/`ordlista-*.html` + `sitemap.xml` ändrade. Inga cachebusters för glossary.js/css bumpade (oförändrade). APP_VERSION/VERSION → 0.8.66 (cachebuster: app.js → 0.8.66).

## 0.8.65
- **Sjukdomar, skador och syndrom i ordlistan har fått diagnoskoder, och ~200 nya diagnoser har lagts till.** Ordlistan: 9 054 → **9 256 termer**. **406 poster bär nu svensk ICD-10-(SE)-kod**, ~330 även ICD-11 (samt enstaka U-koder, t.ex. covid-19 U07.1). Koden läggs in i definitionen efter det engelska namnet, före etymologin (`… Eng. asthma. ICD-10: J45 (J45.0 allergisk, J45.9 ospecificerad); ICD-11: CA23. Av gr. …`).
- **Kapitelvis genomgång A00–T:** infektioner, tumörer, blod, endokrint/metabolt, psykiatri, nerv, öga/öra, cirkulation, andning, mage-tarm, hud, rörelseapparat, urin/genital, medfött (Q), graviditet (O) och de mest sökta symtomen (R). Dessutom en omgång tier-2 internmedicin/akutmedicin (kardiomyopati, klaffel, hjärtstopp, AKS, sarkoidos, leversvikt, Sjögrens syndrom, jättecellsarterit, Guillain-Barré, myastenia gravis, Huntingtons sjukdom, TBE, sorkfeber, vinterkräksjuka, njurcancer, hyponatremi m.fl.).
- Latinskt kliniskt namn (`Lat.`) tillagt där det saknades; eponymer lagrade med versal (Downs/Klinefelters/Sjögrens/Huntingtons/Pagets/Wilsons/Barretts m.fl.). ICD-10-koderna är de svenska ICD-10-SE-kategorierna (3-tecken identiska med Socialstyrelsen/WHO; vanliga 4-tecken angivna); ett urval koder spot-verifierade mot Socialstyrelsen/Internetmedicin/1177/WHO.
- Endast `data/ordlista.json` + regenererade `medicinskordlista.html`/`ordlista-*.html` + `sitemap.xml` ändrade (innehåll). Inga cachebusters för glossary.js/css bumpade (oförändrade). APP_VERSION/VERSION → 0.8.65 (cachebuster: app.js → 0.8.65).

## 0.8.64
- **Startsidans knapp till ordlistan heter nu "Medicinsk ordlista"** (tidigare bara "Ordlista").
- **Knappen längst ner på ordlistesidorna går nu till ordlistans startsida** (`medicinskordlista.html`) i stället för quizets startsida, och heter "← Tillbaka till ordlistan" (tidigare "← Tillbaka till quizet" → `./`).
- **Tydligare markering av söktermen i ordlistans träffar.** Den gröna markeringen (rank 3 – ordet finns bara i beskrivningen) var för svag (16 % emerald) och syntes knappt på desktop. Nu starkare ton (32 %), halvfet text och en svag understreckslinje, så den läses på alla skärmar. `css/glossary.css` + cachebuster `GLOSSARY_V` → 0.8.64, ordlistesidorna regenererade. APP_VERSION/VERSION → 0.8.64.

## 0.8.63
- **Alla sidors `<title>` ned till ≤ 60 tecken (Bing "title too long").** Tre genererade ordlistesidor + en statisk sida var för långa: landningssidan `medicinskordlista.html` (75 → "Medicinsk ordlista – tusentals termer | Anatomiquiz", behåller "tusentals" utan siffra), `ordlista-b.html` (62 → "Medicinska B-ord: betydelse och ursprung | Anatomiquiz"), `ordlista-f.html` (62 → "Medicinska F-ord: definition och ursprung | Anatomiquiz") och `case.html` (63 → "Case – anatomi genom kliniska patientfall | Anatomiquiz").
- `scripts/generate_glossary.py`: `TITLE_MAX` sänkt 160 → **60**, så generatorn nu **felar** om någon framtida titel överskrider Bing-gränsen. Landningstiteln uppdaterad på båda ställena (mall + guard).
- Endast titlar ändrade; meta-descriptions, og/twitter (utom redan korta) och övrigt head orört. Ordlistesidorna regenererade. APP_VERSION/VERSION → 0.8.63.

## 0.8.62
- **Kortare startsidetitel (Bing flaggade "title too long").** `<title>` på index.html ändrad från den 80 tecken långa "Anatomiquiz — Interaktiv anatomiquiz på svenska | Skelett, muskler & terminologi" till **"Anatomiquiz - Öva på anatomi och medicinsk terminologi"** (54 tecken); tar även bort dubbel-förekomsten av ordet "anatomiquiz".
- `og:title` och `twitter:title` uppdaterade till samma nya titel.
- Endast index.html (head) + versionsbump. APP_VERSION/VERSION → 0.8.62 (cachebuster: app.js → 0.8.62).

## 0.8.61
- **Labbtermer i ordlistan har fått normalvärden (referensintervall) och flera saknade prover har lagts till.** 39 befintliga poster berikades med vuxenreferensintervall (Hb, CRP, SR, LPK, TPK, EVF, ALAT, ASAT, GFR, INR, APTT, glukos, D-dimer, ferritin, urea, albumin, kalium, kalcium, PSA, troponin, BNP, PTH, T4, T3, TSH, LD, GT, ALP, CK, urat, kolesterol, folat, laktat, TIBC, antitrombin, haptoglobin, amylas, homocystein, blodstatus) och 34 nya termer tillkom (Hb, HbA1c, kreatinin, Krea, eGFR, cystatin C, MCV, MCH, MCHC, RDW, EPK, retikulocyter, natrium, Na, K, klorid, magnesium, fosfat, kobalamin, B12, järn, transferrin, HDL, LDL, triglycerider, bilirubin, myoglobin, NT-proBNP, fibrinogen, pankreasamylas, hematokrit, folsyra, D-vitamin, provtagningsbeteckningar).
- **Engelska labbförkortningar** lades till som notiser i de svenska posterna (WBC, RBC, PLT, HGB, HCT, CBC, Cr, ALT/AST, GGT, A1C, TG, TC m.fl.) och som egna poster där svensk motsvarighet saknas (BUN, BMP, CMP).
- Värdena anges som vuxenintervall (källa: Region Kronoberg, Referensintervall Klinisk kemi, 2026; NORIP-baserat) med reservation för att de varierar mellan laboratorier/metod/ålder/kön. Tre felstavade dubblettposter städades bort (hb, HbA1C, Nt-proBNP → korrekt skiftläge).
- Ordlistan: 9 020 → **9 054** live-termer. Endast `data/ordlista.json` + regenererade `medicinskordlista.html`/`ordlista-*.html` + `sitemap.xml` ändrade. Inga cachebusters för glossary.js/css bumpade (oförändrade).
- APP_VERSION/VERSION → 0.8.61 (cachebuster: app.js → 0.8.61).

## 0.8.60
- **Ingressen på ordlistans landningssida visar nu det faktiska antalet termer i stället för "tusentals"** — t.ex. "… hoppa till en bokstav i raden — **9 020** latinska och medicinska anatomiska, fysiologiska, patologiska, biologiska och tekniska termer." Talet räknas dynamiskt vid generering (`sum(len(grupp))`) med hårt mellanslag som tusentalsavgränsare, så det uppdateras automatiskt när ordlistan växer.
- **Endast den synliga ingressen (body) ändrad** — `<head>` (title/meta-description/og/twitter) behåller "tusentals" utan siffra enligt SEO-policyn.
- Endast `scripts/generate_glossary.py` (ingresslogik) + `medicinskordlista.html` (regenererad ingress) ändrade. Inga cachebusters bumpade (glossary.js/css oförändrade).
- APP_VERSION/VERSION → 0.8.60 (cachebuster: app.js → 0.8.60).

## 0.8.59
- **Sökträffar där söktermen bara finns i beskrivningen markerar nu ordet med en svag, temahärledd ljusgrön bakgrund** (`<mark>` med `color-mix` av `--primary`), så det syns snabbt *varför* träffen kom med. Markeringen gäller enbart rank 3-träffar (söktermen saknas i termen); matchas något i själva termen markeras inget i beskrivningen. Skiftläge bevaras och `<em>`-taggar i definitionen lämnas orörda.
- Endast `js/glossary.js` (markeringslogik) + `css/glossary.css` (`.glossary-hit`) ändrade; de förrenderade ordlistesidorna regenererades enbart för cachebustern.
- APP_VERSION/VERSION → 0.8.59 (cachebuster: app.js → 0.8.59; glossary.js/glossary.css → 0.8.59 via GLOSSARY_V; styles.css oförändrad).

## 0.8.58
- **Ordlistans sökning är nu relevansrankad istället för rent alfabetisk.** Träffarna sorteras efter hur väl de matchar söktermen:
  1. Exakt uppslagsord (söker du `biceps` kommer **biceps** först).
  2. Term som börjar med söktermen (`biceps brachii`, `biceps femoris` …).
  3. Söktermen någon annanstans i termen (`musculus biceps …`).
  4. Söktermen enbart i beskrivningen.
  - Inom varje nivå sorteras träffarna alfabetiskt (svensk kollation). Tidigare grupperades alla träffar per begynnelsebokstav med `<h3>`-rubriker, vilket dolde vilken träff som var mest relevant; sökresultatet renderas nu som en enda platt lista i relevansordning. Filtreringen (term **eller** beskrivning) är oförändrad – inga träffar försvinner, de kommer bara i bättre ordning. Alfabetsraden tonas fortfarande efter vilka grupper som har träffar.
- Endast `js/glossary.js` ändrat (logik); de förrenderade ordlistesidorna regenererades enbart för att bumpa glossary-cachebustern.
- APP_VERSION/VERSION → 0.8.58 (cachebuster: app.js → 0.8.58; glossary.js → 0.8.58 via GLOSSARY_V; glossary.css/styles.css oförändrade).

## 0.8.57
- **SEO: titlar och meta-descriptions på alla ordlistesidor omarbetade för Bings strängare kvalitetskrav (≤160 tecken + tillräcklig variation i formulering).**
  - **Titlar:** alla 31 gruppsidor delade tidigare exakt samma mall (`Medicinska ord på X — ordlista med definition och etymologi | Anatomiquiz`, bara bokstaven skilde) – vilket Bing flaggar som för lika titlar. Nu har varje sida en **egen, unik titel** med varierad struktur och ordval, och kortare (max 62 tecken, nära Bings visningsideal ~60).
  - **Meta-descriptions:** omformulerade med spridda inledningar (termuppräkning, "Letar du efter…", "Nyfiken på…", "Vad döljer sig bakom…", "Vill du veta…" m.fl.), varierade verb (slå upp/bläddra/utforska/reds ut/ta reda på/få förklarade/lär dig) och roterade avslutningar (etymologi/ordhistoria/ordursprung/språkligt ursprung/synonymer/lekmannaord). Alla unika, max 142 tecken.
  - Generatorn (`scripts/generate_glossary.py`) fick en `GROUP_TITLES`-tabell och en `TITLE_MAX`-kontroll (≤160) vid sidan om den befintliga `DESC_MAX`-kontrollen (≤157). Inga termsiffror i head; landningssidan behåller "tusentals".
- Påverkar enbart `<head>` (title/description + og/twitter som speglar dem) på `medicinskordlista.html` och `ordlista-*.html`. Inget innehåll, css eller js ändrat.
- APP_VERSION/VERSION → 0.8.57 (cachebuster: app.js → 0.8.57; glossary.css/js oförändrade; styles.css oförändrad).

## 0.8.56
- **Ordlistan: latinska anatomitermer (TA98) – slutfas, sinnesorganen (A15), huden (A16) och allmän anatomi (A01). +356 poster. Därmed är hela TA-importen täckt på inlärnings-/klinisk nivå.**
  - **Sinnesorganen (A15):** ögat (ögongloben med poler, axlar och segment; senhinna/hornhinna med limbus och trabekelverket; druvhinnan med strålkroppen och ciliarmuskeln; regnbågshinnan med pupillförträngare/-vidgare; näthinnan med synnervspapillen och dess exkavation; synnerven med sina hinnor; linsen med kapsel, kärna och zonulatrådar; glaskroppen; ögonmusklerna med Zinns senring, ögonlock med Meibomska körtlar, bindehinna och tårapparat). Örat (öronmusslans landmärken; trumhinnan med umbo; mellanörats väggar, hörselbenen [hammare/städ/stigbygel] med leder, ligament och hörselbensmuskler; örontrumpeten; innerörats ben- och hinnlabyrint med båggångar, snäcka, modiolus, balansfläckar, ampullkammar och spiralgangliet). Samt lukt- och smakorganens slemhinnor.
  - **Huden (A16):** överhud/läderhud med papiller och hudåsar (Langers linjer), hår och hårfolliklar med hårresarmuskeln, svett- och talgkörtlar, naglarna, bröstet med bröstkörtel, mjölkgångar, vårtgård och Coopers ligament, samt underhuden.
  - **Allmän anatomi (A01):** läges- och riktningstermer (medial/lateral, ventral/dorsal, kranial/kaudal, proximal/distal m.fl.), referensplan (median-, sagittal-, frontal-, transpyloriska och suprakristala planet), kroppslinjer (medioklavikular-, axillarlinjerna m.fl.), kroppsdelar och gördlar, samt kliniskt namngivna trianglar, gropar och fåror (karotis-, submandibular-, femoraltriangeln, armvecket, knävecket, auskultationstriangeln m.fl.).
- Synliga termer: 8 664 → **9 020** (+356). Inga dubbletter. Den långa svansen av mikroskopiska näthinne-/snäcklager, innerörats småkärl och de mest upprepade ytregionerna/per-finger-regionerna utelämnad medvetet. **Hela A01–A16 i Terminologia Anatomica är nu importerad.**
- APP_VERSION/VERSION → 0.8.56 (cachebuster: app.js → 0.8.56; glossary.css/js oförändrade; styles.css oförändrad).

## 0.8.55
- **Ordlistan: latinska anatomitermer (TA98) – fas 24, nervsystemet del 2: kranialnerverna, de perifera nervflätorna och autonoma nervsystemet. +78 poster. Därmed är nervsystemet (A14) täckt på klinisk nivå.**
  - **De tolv kranialnerverna (I–XII)** med deras kliniskt viktiga grenar och ganglier: lukt-, syn-, ögonrörelse-, trochlearis- och abducensnerven; trillingnerven med sina tre grenar (ögon-, överkäks-, underkäksnerven) och tung-, tand-, hak- och öron-tinningnerven; ansiktsnerven med chorda tympani; balans-hörselnerven; tung-svalgnerven; vagusnerven med övre och återvändande struphuvudsnerven; samt accessorius- och hypoglossusnerven.
  - **Perifera nervflätor:** halsnervflätan (mellangärdesnerven), armnervflätan (median-, ulnaris-, radialis-, axillaris- och muskel-hudnerven m.fl.), mellanrevbensnerverna, ländnervflätan (lår-, saphenus- och obturatornerven m.fl.) och korsbensnervflätan (ischias-, skenbens-, vadbens-, säte-, vad- och blygdnerven).
  - **Autonoma nervsystemet:** sympatiska gränssträngen med övre halsgangliet och ganglion impar, stora/lilla inälvsnerven, de fyra parasympatiska huvudganglierna i huvudet (ciliar-, vinggom-, underkäks- och örongangliet) samt hjärt-, buk- (solar plexus), tarmkäx- och underbuksnervflätorna.
- Synliga termer: 8 586 → **8 664** (+78). Inga dubbletter. Den långa svansen av enskilda kärnor, fibertrakter och pyttesmå gren-nerver utelämnad medvetet. **Härnäst: A15 sinnesorganen (öga och öra).**
- APP_VERSION/VERSION → 0.8.55 (cachebuster: app.js → 0.8.55; glossary.css/js oförändrade; styles.css oförändrad).

## 0.8.54
- **Ordlistan: latinska anatomitermer (TA98) – fas 23, nervsystemet del 1: centrala nervsystemets grovanatomi. +116 poster.**
  - **Nervsystemets byggstenar och hjärnhinnor:** nervtråd, perikaryon, synaps, gliavävnad; hårda/mjuka hjärnhinnor med hjärnskäran, tentoriet och sadeldiafragmat, epidural-, subdural- och subaraknoidalrummet, likvorcisternerna (cisterna magna, lumbalcisternen), araknoidalvilli och kärlnystanet (likvorproduktion).
  - **Ryggmärgen:** cervikala/lumbosakrala förtjockningarna, märgkonen, fram-, bak- och sidohornen, strängarna, grå/vit substans samt huvudbanorna (kortikospinala, spinotalamiska, gracilis- och cuneatusbunten, spinocerebellära, rubrospinala) och kommissurerna.
  - **Hjärnstammen och lillhjärnan:** pyramiderna, oliven, de tre lillhjärnsskänklarna, storhjärnsskänkeln, mellanhjärnans tak med fyrhögarna, svarta substansen, röda kärnan och akvedukten; ventrikelsystemet (3:e/4:e/sidoventrikeln, romboida gropen, Monros öppning); lillhjärnstonsillen och lillhjärnans funktionella delar.
  - **Mellanhjärnan och storhjärnan:** epi-, hypo-, sub- och metatalamus, inre kapseln; loberna, central- och Sylvii-fåran, primära motor- och känselbarken, Brocas och Wernickes områden, gördel- och parahippocampala vindlingen, hippocampus, amygdala, luktbulben/-stråket samt basala ganglierna (svanskärna, putamen, bleka klotet, striatum) och strålkronan.
- Synliga termer: 8 470 → **8 586** (+116). Inga dubbletter (insula fanns redan). Hundratals småkärnor, laminae och fibertrakter utelämnade medvetet. **Härnäst: kranialnerverna, de perifera nervplexa och autonoma nervsystemet.**
- APP_VERSION/VERSION → 0.8.54 (cachebuster: app.js → 0.8.54; glossary.css/js oförändrade; styles.css oförändrad).

## 0.8.53
- **Ordlistan: latinska anatomitermer (TA98) – fas 22, lymfsystemet (A13 + lymftrunci). +37 poster.**
  - **Lymftrunci och lymfgångar:** bröstgången, chylescisternen, högra lymfgången samt jugular-, subklavia-, bronkomediastinal-, lumbal- och tarmtrunci.
  - **Lymfoida organ:** benmärgen, brässens (tymus) bark och märg, mjälten med röd och vit pulpa, Malpighiska kroppar, mjälthilus och bimjälte, Waldeyers svalgring, samt lymfknutans uppbyggnad (primära/sekundära lymfoida organ).
  - **Kliniskt viktiga lymfknutestationer:** axillära, supraklavikulära (Virchows körtel), jugulodigastriska och jugulo-omohyoidala, laterala hals-, trakeobronkiella, parasternala, celiakala, övre mesenteriella, para-aortala (lumbala), gemensamma iliakala, ytliga och djupa ljumsk- (Cloquets knuta) och knävecksslymfknutorna.
- Synliga termer: 8 433 → **8 470** (+37). Inga dubbletter. Den uttömmande svansen av ~150 enskilda regionala lymfknutegrupper utelämnad medvetet. **Härnäst: A14 nervsystemet (störst).**
- APP_VERSION/VERSION → 0.8.53 (cachebuster: app.js → 0.8.53; glossary.css/js oförändrade; styles.css oförändrad).

## 0.8.52
- **Ordlistan: latinska anatomitermer (TA98) – fas 21, kärlen del 4: hela vensystemet. +84 poster. Därmed är hjärt-kärlsystemet (A12) i praktiken klart.**
  - **Huvud, hals och hjärna:** övre hålvenen, brakiocefaliska venen, de inre/yttre/främre halsvenerna, ansikts-, vinkel- och retromandibularvenen, vingflätaden; hårda hjärnhinnans blodledare (durasinus) – övre/nedre sagittalsinus, raka sinus, sinusconfluensen, tvärgående och sigmoideumsinus, sinus cavernosus och de övre/nedre petrosalsinus; diploë- och emissarievener; hjärnvenerna (Galens, Rosenthals, Trolards och Labbés vener) samt ögonvenerna med Schlemms kanal.
  - **Bål och extremiteter:** nedre hålvenen med lever-, njur-, binjure- och gonadvener (med vänster-sidans asymmetri och varikocele) och pampiniforma plexus; azygos- och hemiazygossystemet samt Batsons kotpelarvennät; armens ytliga vener (cefalika, basilika, armvecksvenen) och djupa vener; höft- och bäckenvenerna med de kliniska vennäten (rektalt, prostatiskt, vesikalt, uterint); benets rosenådror (stora/lilla) och djupa vener med perforantvenerna.
  - **Portasystemet:** portådern, mjält-, övre/nedre tarmkäx- och vänstra magsäcksvenen, paraumbilikala och övre ändtarmsvenen – med de tre portakavala anastomoserna (matstrupe, ändtarm, caput medusae).
- Synliga termer: 8 353 → **8 433** (+84, varav azygos/Batson +4). Inga dubbletter. Durasinus står naturligt (sinus inverteras ej); venösa plexus inverterades ("X, plexus venosus"). Den långa svansen av pyttesmå tributärer/segmentvener utelämnad. **A12 hjärt-kärlsystemet klart utom A12.4 lymf-trunci (tas med lymfsystemet). Härnäst: A13 lymfsystemet.**
- APP_VERSION/VERSION → 0.8.52 (cachebuster: app.js → 0.8.52; glossary.css/js oförändrade; styles.css oförändrad).

## 0.8.51
- **Ordlistan: latinska anatomitermer (TA98) – fas 20, kärlen del 3: hela artärträdet (kropp och extremiteter). +121 poster.**
  - **Nyckelbensartären och armen:** kotartären med lillhjärnsartärerna (PICA/AICA/SCA) och ryggmärgsartärerna, inre bröstkorgsartären, tyro- och kostocervikala stammarna; armhåle-, överarms-, djupa överarms-, strålbens- och armbågsbensartären med de interosseösa artärerna, handflatebågarna och fingerartärerna.
  - **Bröst- och bukaorta:** bakre interkostal-, subkostal- och bronkialartärerna; buktruncus (vänster/höger magsäcks-, gemensam/egentlig leverartär, gastroduodenal-, gallblåse-, mjält-, gastroomentala och korta magsäcksartärer), övre tarmkäxartären (jejunal-/ileal-, ileokoliska, appendix-, höger/mellersta kolonartär, marginalartären), nedre tarmkäxartären (vänster kolon-, sigmoideum-, övre ändtarmsartären), samt njur-, binjure-, äggstocks-/testikel- och ländartärerna.
  - **Bäcken och benet:** inre höftbensartären (säte-, obturator-, navel-, blås-, livmoder-, slid-, mellersta ändtarms- och inre blygdartären med dess gren- och köns/perineumgrenar); yttre höftbensartären med nedre epigastriska artären; lår-, djupa lår- (med cirkumflex- och perforantartärer), knävecks-, främre/bakre skenbens- och vadbensartären, fotryggsartären, fotsuleartärerna med fotsulebågen och tåartärerna.
- Synliga termer: 8 232 → **8 353** (+121). Inga dubbletter. Recurrens-, genicular-, malleolar-, tarsal- och metatarsalsmågrenar samt segment-, ureter- och muskelrami utelämnade medvetet. Strukturord (arteria/truncus/ramus) inverterade. **Härnäst: vensystemet (v. cava sup./inf., porta, durasinus, extremitetsvener).**
- APP_VERSION/VERSION → 0.8.51 (cachebuster: app.js → 0.8.51; glossary.css/js oförändrade; styles.css oförändrad).

## 0.8.50
- **Ordlistan: latinska anatomitermer (TA98) – fas 19, kärlen del 2: huvudets, halsens och hjärnans artärer. +45 poster.**
  - **Yttre halspulsådern:** med dess namngivna huvudgrenar – övre sköldkörtel- och struphuvudsartären, uppåtstigande svalgartären, tung- och ansiktsartären (med läpp-, hak- och vinkelgrenar), nack- och bakre öronartären, ytliga tinningartären samt överkäksartären med nedre tandartären, mellersta hjärnhinneartären, kind-, infraorbital-, gom- och kilgomartären.
  - **Inre halspulsådern:** karotissifonen, ögonartären med centrala näthinneartären, tår-, supraorbital-, silbens- och näsryggsartärerna, övre och nedre hypofysartären samt bakre kommunikations- och främre koroidalartären.
  - **Hjärnans artärer:** främre, mellersta och bakre hjärnartären, främre kommunikationsartären, basilarisartären och perikallösa artären – samt Willis artärring.
- Synliga termer: 8 187 → **8 232** (+45). Inga dubbletter. Mikrogrenar till enskilda tänder, hjärnkärnor och gyri samt små muskel- och hörselgrenar utelämnade medvetet. Strukturord (arteria/truncus) inverterade. **A12 kärlträdet fortsätter (subclavia/extremiteter/buk/bäcken + vensystemen).**
- APP_VERSION/VERSION → 0.8.50 (cachebuster: app.js → 0.8.50; glossary.css/js oförändrade; styles.css oförändrad).

## 0.8.49
- **Ordlistan: latinska anatomitermer (TA98) – fas 18, kärlen del 1: allmän kärlterminologi och den centrala cirkulationen. +70 poster.**
  - **Allmän kärllära:** blodkärl, artär, ven, venol, kapillär, kärlväggens tre lager (tunica intima/media/externa), vasa vasorum, arteriovenösa anastomoser, rete mirabile, ven- och lymfklaffar, lymfkärl och lymfkapillärer.
  - **Lungkretsloppet:** lungartärstammen med bukter och delning, höger och vänster lungartär, Botallis gång (ductus arteriosus) och artärbandet, samt de fyra lungvenerna.
  - **Aorta ascendens och kranskärlen:** aortabukterna (Valsalva), höger och vänster kransartär med deras kliniska huvudgrenar (LAD, circumflex, bakre nedåtgående PDA, marginal-, nod- och septalgrenar).
  - **Aortabågen:** aortaistmus, brakiocefaliska stammen, gemensamma halspulsådern med karotissinus och karotiskroppen, samt nedersta sköldkörtelartären.
  - **Kransvenerna:** koronarsinus, stora/mellersta/lilla hjärtvenen, Thebesii och Marshalls vener.
- Synliga termer: 8 117 → **8 187** (+70). Inga dubbletter. De numrerade segmentartärerna/-venerna och de minsta kransvenerna utelämnade medvetet (A04-policyn). Strukturord (arteria/vena/truncus/ramus/ligamentum) inverterade. **A12 kärlträdet fortsätter i kommande faser (huvud-hals, extremiteter, buk, bäcken).**
- APP_VERSION/VERSION → 0.8.49 (cachebuster: app.js → 0.8.49; glossary.css/js oförändrade; styles.css oförändrad).

## 0.8.48
- **Ordlistan: latinska anatomitermer (TA98) – fas 17, hjärtat (A12.1 Cor). +83 poster.**
  - **Hjärtats yttre:** bas, spets, framyta, kransfåran och de båda kammarskiljefårorna.
  - **Rummen:** höger/vänster förmak och kammare, hjärtöron, för- och kammarskiljeväggar, gränskammen, kamtandsmusklerna, ovala gropen med fostrets ovala hål, hålvenernas och koronarsinus mynningar.
  - **Klaffapparaten:** tricuspidalis-, pulmonalis-, mitralis- och aortaklaffen med segel, semilunarsegel (knottror/lunulor/kommissurer), papillarmuskler, senstrålar, moderatorbandet och utflödeskonen.
  - **Hjärtskelettet:** höger/vänster fibrösa triangel och klaffringar.
  - **Retledningssystemet:** sinusknutan (SA), AV-knutan, His bunt och Purkinjefibrerna; samt endokardiet.
  - **Hjärtsäcken:** fibrösa och serösa perikardiet, transversella och oblika perikardsinus, sternoperikardiella banden och Marshalls veck.
- Synliga termer: 8 034 → **8 117** (+83). Inga dubbletter. Upprepade generiska segel/papillarmuskler deduplicerade till en post var; ytetiketter och obskyra senor utelämnade. Strukturord (musculus/nodus/ligamenta/rami) inverterade. **Näst på tur: A12 kärlträdet (stort, flera kommande faser) – lungkretslopp och aorta först.**
- APP_VERSION/VERSION → 0.8.48 (cachebuster: app.js → 0.8.48; glossary.css/js oförändrade; styles.css oförändrad).

## 0.8.47
- **Ordlistan: latinska anatomitermer (TA98) – fas 16. Könsorganen, bukhinnan och de endokrina körtlarna. +257 poster.**
  - **A09 könsorganen + perineum (168) – HELA A09 KLART:** kvinnligt inre (äggstock, äggledare med ampull/fimbrier, livmoder med dess ligament, slida, vestigiala rester som Gartners gång), kvinnligt yttre (vulva, klitoris, slidförgård, Bartholins körtel), manligt inre (testikel med sädeskanaler/rete testis, bitestikel, sädesledare, sädesblåsa, prostata med mellanlob/periurethral zon, Cowpers körtel), manligt yttre (penis svällkroppar, ollon, scrotum med dartos) samt mellangården (perinealkropp, ytliga/djupa perinealrummet, perinealmembran, ischiocavernosus/bulbospongiosus, ischioanala gropen, Alcocks kanal).
  - **A10 bukhålan & bukhinnan (75) – HELA A10 KLART:** vägg- och organbukhinna, retroperitoneala/retropubiska rummet, mesenterier och mesokolon, lilla och stora omentet med samtliga peritonealligament (hepato-, gastro-, spleno-, pancreatico- och phrenico-banden), leverband (krans-, skär- och triangelbanden), omentalbursan med Winslows hål samt de kliniskt viktiga bukhinnefickorna och triangarna (Morisons grop, Douglas rum, paraduodenala/ileocekala fickor, paracoliska rännorna, Calots och Hesselbachs triangel, ljumskgropar och navelveck), breda livmoderbandet med meso-delarna.
  - **A11 endokrina körtlar (19) – HELA A11 KLART:** hypofysens fram- och baklob med deras delar, tallkottkörteln, sköldkörteln (istmus, pyramidlob, accessoriska), bisköldkörtlarna (övre/nedre/accessoriska) och binjurarna (med centralven och accessoriska).
- Synliga termer: 7 777 → **8 034** (+257). Inga dubbletter. Delade termer (tunica albuginea, sphincter urethrae externus/internus, crista urethralis m.fl.) infördes en gång. Medvetet utelämnat: generiska pars-/ytetiketter, prostatans lobulus-indelning, vestigiala gångdetaljer och finhistologiska underavdelningar. Strukturord inverterade enligt sorteringsregeln. Näst på tur: A12 hjärta och kärl.
- APP_VERSION/VERSION → 0.8.47 (cachebuster: app.js → 0.8.47; glossary.css/js oförändrade; styles.css oförändrad).

## 0.8.46
- **Ordlistan: latinska anatomitermer (TA98) – fas 15. Matsmältningssystemet klart + hela andnings-, brösthåle- och urinsystemet. +269 poster.**
  - **A05 matsmältningssystemet, del 2 (88) – HELA A05 KLART:** levern (lober, ytor, porta hepatis, nakna fältet, leverband), gallvägarna (gallblåsa, gall- och levergångar, ductus choledochus/cysticus), bukspottkörteln (huvud/kropp/svans, gångar, ölandskap), tjocktarmen (taenia/haustra/fettbihang, flexurer, blindtarm med appendix) och ändtarm/analkanal (ampulla recti, columnae anales, linea pectinata, slutmuskler).
  - **A06 andningsorganen (111) – HELA A06 KLART:** yttre näsa och näsbrosk, näshåla/bihålor, struphuvudet (brosk, leder, membran/ligament, de inre struphuvudsmusklerna, struphuvudshålan med ficke- och stämband), luftstrupen, bronkträdet (huvud- och lobbronker, bronkioler) och lungorna (lober, fåror, hilus, lingula, hjärtinskärning, bronkopulmonella segment).
  - **A07 brösthålan (21) – HELA A07 KLART:** lungsäcken (viscerala/parietala pleura, kupol), lungsäcksvecken/recesserna (bl.a. det kostodiafragmatiska), lungbandet, suprapleurala membranet och mediastinums fem avdelningar samt hjärtsäckshålan.
  - **A08 urinvägarna (49) – HELA A08 KLART:** njuren (hilus, sinus, bark/märg, pyramider, papiller, kolumner, fascior/kapslar), njurens kärlträd (interlobär-, båg- och barkartärer, afferent/efferent glomerulusarteriol, vasa recta, stjärnvener), njurbäcken och kalkar, urinblåsan (delar, blåstriangel, detrusor, blåshals) samt kvinnligt/manligt urinrör.
- Synliga termer: 7 508 → **7 777** (+269). Inga dubbletter. Medvetet utelämnat (generiska/upprepade barntermer): tandkuspar/-rötter, leverns segmentindelning, finhistologiska njurmärgszoner, de numrerade segmentbronkerna/lungsegmenten och njursegmenten, samt generiska pars-/lager-etiketter. Strukturord (musculus/articulatio/ligamentum/arteria/vena/plexus m.fl.) inverterade enligt sorteringsregeln. Näst på tur: A09 könsorganen.
- APP_VERSION/VERSION → 0.8.46 (cachebuster: app.js → 0.8.46; glossary.css/js oförändrade; styles.css oförändrad).

## 0.8.45
- **Ordlistan: latinska anatomitermer (TA98) – fas 14, matsmältningssystemet (A05), del 1: mun till tunntarm. 294 poster.**
  - **Munhåla & spottkörtlar (43):** läppar, gom, tandkött och de tre stora spottkörtlarna med utförsgångar (Stensens, Whartons, Bartholins).
  - **Tänderna (41):** tandtyper, tandens delar (krona, hals, rot, pulpa), tandvävnaderna (emalj, dentin), tandalveolen, mjölktänder/permanenta tänder.
  - **Tungan (31):** tungans delar, smakpapillerna och tungmusklerna (genioglossus m.fl.).
  - **Svalg & gomsegel (svalgmandlar, gombågar, svalgsnörarmusklerna) och matstrupen** med dess tre delar och förträngningar.
  - **Magsäck & tunntarm:** magsäckens delar och portvaktsmuskeln; tunntarmens veck, tarmludd och körtlar; tolvfingertarmens fyra delar med Vaters papill, Treitz muskel och Meckels divertikel.
  - Mag-tarmväggens generiska lager (tunica mucosa, tela submucosa, tunica muscularis, serosa m.fl.) infördes en gång som allmänna begrepp.
- Synliga termer: 7 287 → **7 508** (+221 synliga; netto inkl. ompekade strukturord). Inga dubbletter. Granulära riktningsvarianter (kuspar/ytor/rötter, snörarmuskelns delar) utelämnade medvetet. Återstår av A05: tjocktarm, lever/galla/bukspott och bukhinnan.
- APP_VERSION/VERSION → 0.8.45 (cachebuster: app.js → 0.8.45; glossary.css/js oförändrade 0.8.29; styles.css oförändrad 0.7.1).

## 0.8.44
- **Ordlistan: latinska anatomitermer (TA98) – fas 13, musklerna (A04 Musculi), del 2. Hela muskelkapitlet klart (+465 totalt sedan A03).**
  - **Nedre extremiteten (91):** höft- och sätesmusklerna, de djupa utåtrotatorerna, fyrhövdade lårmuskeln, adduktorerna, hamstrings, underbenets loger (tibialis, fibularis, triceps surae med hälsenan) och fotens småmuskler; dessutom lårtriangeln, adduktorkanalen, lårkanalen och fotens retinakler.
  - **Senskidor & slemsäckar (34):** senskidans uppbyggnad, fingrarnas ringband (pulley-systemet) samt de kliniskt vedertagna slemsäckarna (subakromiala, olekranon-, trokanter-, prepatellara, anserina, hälsene-bursan m.fl.).
  - **Bäckenstöd (7):** pubovesikala/puboprostatiska banden, urinblåsans sidoband och de rektovaginala/rektoprostatiska fasciorna (Denonvilliers).
- *Musculus flexor digiti minimi brevis* slogs ihop till en post (homonym i både hand och fot).
- Synliga termer: 7 155 → **7 287** (+132 i denna commit; A04 totalt +465). Inga dubbletter. Den långa svansen av rent generiska deletiketter (caput/pars/lamina) och obskyra enskilda *bursa subtendinea musculi …* utelämnade medvetet. Näst på tur: A05 matsmältningssystemet.
- APP_VERSION/VERSION → 0.8.44 (cachebuster: app.js → 0.8.44; glossary.css/js oförändrade 0.8.29; styles.css oförändrad 0.7.1).

## 0.8.43
- **Ordlistan: latinska anatomitermer (TA98) – fas 12, musklerna (A04 Musculi), del 1: huvud till hand. 333 poster.**
  - **Allmän muskellära (42):** muskeltyper (spol-, fjäder-, ring-, en-/två-/trehövdade …), funktionsnamn (flexor, extensor, abductor, sfinkter …), fästpunkter, muskelfascia, epimysium/perimysium och senstrukturer.
  - **Huvudet (45):** mimiska muskler (occipitofrontalis, orbicularis oculi/oris, zygomaticus, buccinator, mentalis …), tuggmusklerna (masseter, temporalis, vingmusklerna) och senhjälmen.
  - **Halsen (34):** nickmuskeln, trappmusklerna, för- och undertungbensmusklerna, nackgropsmusklerna, halsfascian och karotisskidan.
  - **Ryggen (53):** kappmuskeln, breda ryggmuskeln, romboid- och sågmusklerna samt de djupa egentliga ryggmusklerna (erector spinae, transversospinala lagret) och torakolumbalfascian.
  - **Bröstkorgen (34):** stora/lilla bröstmuskeln, främre sågmuskeln, intercostalmusklerna och diafragma med dess skänklar, öppningar och centralsena.
  - **Buken & bäckenbotten (62):** raka och sneda bukmusklerna, transversus, ljumskbandet och ljumskkanalen, vita linjen, bäckenbotten (levator ani-gruppen) och yttre analsfinktern.
  - **Övre extremiteten (63):** rotatorkuffen, biceps/triceps, underarmens böj- och sträckmuskler, handens småmuskler samt flexor- och extensorretinaklet.
- Strukturord (musculus, ligamentum, tendo …) inverteras och filas på sitt egentliga namn; kompletta latinet står först i definitionen.
- Synliga termer: 6 822 → **7 155** (+333). Inga dubbletter. Generiska upprepade deletiketter (caput/pars/lamina, upprepade fasciavarianter) utelämnade. Återstår av A04: nedre extremiteten samt yttre ögon-, hörselbens-, tung-, gom-, svalg- och struphuvudmuskler.
- APP_VERSION/VERSION → 0.8.43 (cachebuster: app.js → 0.8.43; glossary.css/js oförändrade 0.8.29; styles.css oförändrad 0.7.1).

## 0.8.42
- **Ordlistan: latinska anatomitermer (TA98) – fas 11, lederna och ledbanden (A03 Juncturae). Hela kapitlet klart, 342 poster.**
  - **Allmän ledlära (52):** fog-/ledtyper (synartros, syndesmos, synkondros, synovialled, kulled, sadelled, vridled, ellipsoidled m.fl.), ledkapselns och ledhålans delar (ledkapsel, ledhinna, ledskiva, menisk, ledläpp, slemsäck, senskida) samt ledrörelser (abduktion, adduktion, pro-/supination, opposition).
  - **Skallens fogar (54):** bensömmar (sutura sphenofrontalis, frontonasalis, palatina mediana …), synkondroser i skallbasen, tandens stödjevävnad (periodontium, rotcement), käkleden (art. temporomandibularis) och övre nackleden (art. atlantooccipitalis).
  - **Kotpelaren (34):** långa ryggradsbanden, gula ledbanden, nackbandet, mellankotskivan med fiberring och diskkärna, atlas–axis-lederna med vingband och tvärband, fasettlederna samt korsbens- och svansbensfogarna.
  - **Bröstkorgen (28):** revben–kotleder, revben–tvärutskottsleder, bröstben–revbensleder och intercostalmembranen.
  - **Övre extremiteten (69):** skuldergördelns leder (akromioklavikular- och sternoklavikularled, korakoklavikularband), axelled, armbågsled med ringband, handled och handens leder (karpaltunneln, Guyons kanal, tummens sadelled, knogleder).
  - **Nedre extremiteten (105):** blygdbensfog, korsben–tarmbensled, höftled med iliofemoral-/runda ledbandet, knäled med korsband, sidoband, menisker och knäskålsband, samt fotens leder (övre/nedre fotled, deltaligament, Choparts och Lisfrancs leder, fjäderligament, långa fotsulebandet).
- Strukturnamn (articulatio, ligamentum, bursa …) inverteras som i tidigare faser och filas på sitt egentliga namn; kompletta latinet står först i definitionen och är sökbart.
- Synliga termer: 6 480 → **6 822** (+342). Inga dubbletter. Rent generiska, upprepade barntermer (ligamenta collateralia/palmaria/plantaria m.fl.) utelämnade medvetet. Näst på tur: A04 Musculi (muskler).
- APP_VERSION/VERSION → 0.8.42 (cachebuster: app.js → 0.8.42; glossary.css/js oförändrade 0.8.29; styles.css oförändrad 0.7.1).

## 0.8.41
- **Ordlistan: latinska anatomitermer (TA98) – fas 10, allmänna skallstrukturer (73 poster). Därmed är hela skelettet (A02 Ossa) klart.**
  - **Allmän skalle (73):** norma-vyer, kraniometriska punkter (nasion, bregma, lambda, pterion, asterion …), tinninggrop/okbåge/ving-gomgrop, fontaneller, skalltakets benlager, skallbasen med foramen jugulare och lacerum, hårda gommen, ögonhålan med dess väggar och öppningar, samt bennäshålan med näsgångar och öppningar.
- Synliga termer: 6 407 → **6 480** (+73). Inga dubbletter. Skelettkapitlet (A02) fullständigt; näst på tur: A03 leder/ledband, A04 muskler.
- APP_VERSION/VERSION → 0.8.41 (cachebuster: app.js → 0.8.41; glossary.css/js oförändrade 0.8.29; styles.css oförändrad 0.7.1).

## 0.8.40
- **Ordlistan: latinska anatomitermer (TA98) – fas 9, tinningbenet (62 poster).** Fortsatt kraniedetalj-import (A02.1).
  - **Tinningbenet (os temporale, 62):** klippbenet (pars petrosa) med ansiktsnervkanal, halspulsåderkanal, muskel–rörkanal, inre hörselgång och fåror för stenbenssinus; trumdelen (pars tympanica) med yttre hörselgång och trumhinnefåra; fjälldelen (pars squamosa) med käkledsgrop och ledknöl; samt vårtutskottets strukturer och tinningbenets springor.
- Synliga termer: 6 345 → **6 407** (+62). Inga dubbletter. (A02.1 forts.: allmän skalle/skallbas/fossae/foramina/fontaneller återstår, ~80 st.)
- APP_VERSION/VERSION → 0.8.40 (cachebuster: app.js → 0.8.40; glossary.css/js oförändrade 0.8.29; styles.css oförändrad 0.7.1).

## 0.8.39
- **Ordlistan: latinska strukturnamn sorteras nu på sitt egentliga namn, inte på genus-ordet.** Tidigare hamnade alla `os …` på bokstaven O, alla `musculus …` skulle hamnat på M osv. – olämpligt för ett lexikon. Nu inverteras strukturnamn: uppslagsordet visar det specifika namnet först och filas på dess bokstav, medan det kompletta latinska namnet skrivs ut först i definitionen (och förblir sökbart).
  - Exempel: `os frontale` → **`frontale, os`** (sida F), `os coxae` → `coxae, os` (C), `os hyoideum` → `hyoideum, os` (H). Definition: `subst. os frontale; pannben; …`.
  - Gäller strukturgenus (os, ossa, musculus, nervus, arteria, vena, ligamentum, glandula, nodus, ganglion, articulatio, ramus, truncus, plexus, bursa, tendo). Topografiska detaljord (fossa, sulcus, processus, facies, foramen m.fl.) lämnas som de är. 57 befintliga poster inverterade; regeln gäller alla kommande anatomibatchar (dokumenterat i `scripts/anatomi_import_mall.md`).
- APP_VERSION/VERSION → 0.8.39 (cachebuster: app.js → 0.8.39; glossary.css/js oförändrade 0.8.29; styles.css oförändrad 0.7.1).

## 0.8.38
- **Ordlistan: latinska anatomitermer (TA98) – fas 8, kilbenet (44 poster).** Fortsatt kraniedetalj-import (A02.1).
  - **Kilbenet (os sphenoidale, 44):** sella turcica-regionen (sadelknöl, hypofysgrop, sadelrygg, sadelutskott), lilla och stora vingen, synnervskanal, övre ögonhålespringan, skallbasens foramina (rotundum, ovale, spinosum m.fl.), vingutskotten med inre/yttre vingplatta och vingkrok, samt kilbenshålan (sinus sphenoidalis).
- Synliga termer: 6 301 → **6 345** (+44). Inga dubbletter. (A02.1 forts.: tinningben och allmän skalle/skallbas återstår.)
- APP_VERSION/VERSION → 0.8.38 (cachebuster: app.js → 0.8.38; glossary.css/js oförändrade 0.8.29; styles.css oförändrad 0.7.1).

## 0.8.37
- **Ordlistan: latinska anatomitermer (TA98) – fas 7, pannben och hjässben (41 poster).** Fortsatt kraniedetalj-import (A02.1).
  - **Pannbenet (os frontale, 27):** pannbensfjäll, pannknöl, ögonbrynsbåge, glabella, ögonhålekant med supraorbitalhål, ögonhåledel med tårkörtelgrop, samt pannbihålan (sinus frontalis).
  - **Hjässbenet (os parietale, 14):** hjässknöl, tinninglinjer, kanter och hörn, fåror för övre pilbladssinus och mellersta hjärnhinneartären.
- Synliga termer: 6 260 → **6 301** (+41). Inga dubbletter. (A02.1 forts.: kilben, tinningben och allmän skalle/skallbas återstår.)
- APP_VERSION/VERSION → 0.8.37 (cachebuster: app.js → 0.8.37; glossary.css/js oförändrade 0.8.29; styles.css oförändrad 0.7.1).

## 0.8.36
- **Ordlistan: latinska anatomitermer (TA98) – fas 6, nackben, silben m.fl. (57 poster).** Fortsatt kraniedetalj-import (A02.1).
  - **Nackbenet (os occipitale, 31):** nackbensfjäll, nackbensknölar, hypoglossuskanal, nacklinjer, korsupphöjningen och sinusfårorna på insidan, samt de kraniometriska punkterna basion och opisthion.
  - **Silbenet (os ethmoidale, 15):** silplattan, silbenslabyrinten med luftceller, övre och mellersta näsmusslan, krokutskott och hiatus semilunaris.
  - **Små ansiktsben (11):** nedre näsmusslans utskott, tårbenet, näsbenet och plogbenet (vomer).
- Synliga termer: 6 203 → **6 260** (+57). Inga dubbletter. (A02.1 forts.: pannben, kilben, tinningben och allmän skalle/skallbas återstår.)
- APP_VERSION/VERSION → 0.8.36 (cachebuster: app.js → 0.8.36; glossary.css/js oförändrade 0.8.29; styles.css oförändrad 0.7.1).

## 0.8.35
- **Ordlistan: latinska anatomitermer (TA98) – fas 5, ansiktsskelettet (92 poster).** Påbörjad kraniedetalj-import (A02.1).
  - **Ansiktsskelettet (92):** överkäken (maxilla) med käkhåla, ögonhåleyta, infraorbitalkanal, gomutskott och tandutskott; underkäken (mandibula) med kropp, gren, käkvinkel, hak- och muskelutskott, underkäkskanal; tungbenet (os hyoideum); okbenet (os zygomaticum); gombenet (os palatinum); samt gemensamma tandburande strukturer (alveoli dentales, septa interalveolaria m.m.).
- Synliga termer: 6 111 → **6 203** (+92). Inga dubbletter. (A02.1 forts.: skalltakets ben, kilben, tinningben, silben, allmän skalle/fossor/foramina återstår.)
- APP_VERSION/VERSION → 0.8.35 (cachebuster: app.js → 0.8.35; glossary.css/js oförändrade 0.8.29; styles.css oförändrad 0.7.1).

## 0.8.34
- **Ordlistan: latinska anatomitermer (TA98) – fas 4, underben och fot (74 poster).** Slutför nedre extremitetens skelett (A02.5).
  - **A02.5 nedre extremitet, del 2 (74):** knäskålen (basis/apex patellae), skenbenet (tibia) med ledknölar, mellankondylytor, skenbensknöl och inre fotknöl, vadbenet (fibula) med huvud, hals och yttre fotknöl, samt foten – fotrotsbenen (språngben/talus, hälben/calcaneus, båtben, de tre kilbenen, tärningsben/cuboideum), mellanfotsben och deras knölar. Därmed är hela skelettets extremiteter klara.
- Synliga termer: 6 037 → **6 111** (+74). Inga dubbletter.
- APP_VERSION/VERSION → 0.8.34 (cachebuster: app.js → 0.8.34; glossary.css/js oförändrade 0.8.29; styles.css oförändrad 0.7.1).

## 0.8.33
- **Ordlistan: latinska anatomitermer (TA98) – fas 3, bäcken och lårben (97 poster).** Fortsatt region-för-region-import enligt `scripts/anatomi_import_mall.md`.
  - **A02.5 nedre extremitet, del 1 (97):** höftbenet (os coxae) med tarmben, sittben och blygdben och alla detaljer (acetabulum, höftbenskam, höftbenstaggar, säteslinjer, foramen obturatum m.m.); bäckenet som helhet (stora/lilla bäckenet, bäckeningång/-utgång, gränslinje) och bäckenmåtten (conjugata vera/diagonalis/externa m.fl., diametrar, distantiae); lårbenet (femur) med huvud, hals, trochantrar, linea aspera, ledknölar och gropar.
- Synliga termer: 5 940 → **6 037** (+97). Inga dubbletter. (A02.5 forts.: patella, skenben, vadben och foten återstår.)
- APP_VERSION/VERSION → 0.8.33 (cachebuster: app.js → 0.8.33; glossary.css/js oförändrade 0.8.29; styles.css oförändrad 0.7.1).

## 0.8.32
- **Ordlistan: latinska anatomitermer (TA98) – fas 2, övre extremiteten (116 poster).** Fortsatt region-för-region-import enligt `scripts/anatomi_import_mall.md`.
  - **A02.4 Övre extremitet (116):** skuldergördel (skulderblad med gropar/kam/utskott, nyckelben), överarmsben (caput/collum/tuberkler/epikondyler/trochlea/capitulum/gropar), strålben och armbågsben med alla detaljer, handlovsbenen (os scaphoideum, lunatum, triquetrum, pisiforme, trapezium, trapezoideum, capitatum, hamatum), mellanhandsben och fingerben (falanger), ossa sesamoidea.
- Synliga termer: 5 824 → **5 940** (+116). Inga dubbletter.
- APP_VERSION/VERSION → 0.8.32 (cachebuster: app.js → 0.8.32; glossary.css/js oförändrade 0.8.29; styles.css oförändrad 0.7.1).

## 0.8.31
- **Ordlistan: kompletterad mot externa medicinska ordlistor (117 nya poster).** Genomgång av källor (senioralert.se, cancercentrum.se, gyncancer.se, ibrancepatient.se, carpanet.se) – endast genuint saknade *medicinska* termer infördes enligt grundmallen, dubbletter och rena böjningsvarianter hoppades över, och eHälsomyndighetens IT-/förvaltningstermbank bedömdes ligga utanför ordlistans ram.
  - Kärntermer som saknats: metastas, dottertumör, kirurgi, röntgen, mutation, vävnad, ultraljud, strålbehandling, datortomografi, kemoterapi, immunterapi, cellgift, fatigue, biverkning, livskvalitet, dos, screening, biomarkör, finnålspunktion, mellannålsbiopsi, miktion, morfologi m.fl.
  - Endokrint (hormoner/tumörer): hormon, kortisol, serotonin, vasopressin, sköldkörtel, bisköldkörtel, parathormon, tyroxin/T3/T4, GH/tillväxthormon, bukspottkörtel, lever, adenohypofys/neurohypofys, carcinoid(syndrom), insulinom/gastrinom/glukagonom/prolaktinom/somatostatinom m.fl.
  - Vård-/patientbegrepp och förkortningar (på användarens beslut): brytpunktssamtal, palliativ vård, kontaktsjuksköterska, fast vårdkontakt, prehabilitering, second opinion, evidens, morbiditet, mortalitet; RCC, MDK, SVF, PAD, HSL, IVO, SKR, NPÖ, INCA, PVK, PICC-line, RIK, BRCA, FIGO, GnRH, HER2, MR/MRT/DT/UL; bedömningsskalor (Nortonskala, MNA, DFRI, RAPS, ROAG). Läkemedels-varunamn uteslöts medvetet.
- **Ordlistan: latinska anatomitermer från Terminologia Anatomica – fas 1 (138 poster).** Påbörjad systematisk import av kroppens latinska anatominamn region för region, med Terminologia Anatomica (TA98) som auktoritativ källa (äkta latin som uppslagsord, engelska som `Eng.`-alternativ, kort definition + ordförklaring av latinet; inget påhittat svenskt namn). Arbetsmall + status/logg i `scripts/anatomi_import_mall.md`.
  - **A02 Ossa / skalle (27):** os frontale, parietale, occipitale, temporale, sphenoidale, ethmoidale … foramen magnum, fossa cranii anterior/media/posterior, sella turcica, suturae, cranium/neurocranium/viscerocranium.
  - **A02.2 Columna vertebralis (70):** kotpelarens krökningar, kotans delar (corpus/arcus/processus …), halskotor, atlas, axis, bröst-/ländkotor, os sacrum med detaljer, os coccygis.
  - **A02.3 Thorax (41):** costae (verae/spuriae/fluctuantes) med detaljer, bröstbenet (manubrium/corpus/processus xiphoideus), bröstkorgens öppningar och mått.
- Synliga termer: 5 569 → **5 824** (+255). Inga dubbletter (befintliga former hoppades över vid kollision).
- APP_VERSION/VERSION → 0.8.31 (cachebuster: app.js → 0.8.31; glossary.css/js oförändrade 0.8.29; styles.css oförändrad 0.7.1).

## 0.8.30
- **Ordlistan: ålderdomliga och latinska sjukdoms-/anatominamn inarbetade (135 poster).** Material från fem källor (hhogman.se, slaktingar.se, kvalevaag.se ×2, Riksarkivets dödregister), egengranskat — den OCR-trasiga latin–svensk-listan importerades INTE rakt av utan latinet översattes korrekt.
  - **Fas 1 (39):** 14 `Ålderdomligt:`-noter sist i befintliga poster (sökbara via def): anemi←bleksot, epilepsi←fallandesot, dysenteri←rödsot, ödem←vattusot, apoplexi←slag, chorea←danssjuka, ergotism←dragsjuka, rakit, gangrän←benbrand, influensa←spanska sjukan, osteomyelit←benröta, diabetes←sockersjuka, hemorrojd←gyllenåder. + 25 nya poster (lungsot, tvinsot, hektik, vita pesten, pest, digerdöden, frossa, fläcktyfus, gulsot, franska sjukan, skörbjugg, gikt, barnsängsfeber, stenpassion, håll och styng, moderpassion m.fl.).
  - **Fas 2 (96):** distinkta latinska/historiska namn + saknade ankare (tuberkulos, syfilis, malaria, difteri, kolera, scharlakansfeber, kikhosta, mässling, smittkoppor, hysteri, spetälska, stelkramp …), latinformer (morbilli, phthisis, skrofler, lupus vulgaris, mjältbrand, tabes dorsalis, paralysis agitans …), grundformer med organ-not (carcinoma, sarcoma, apoplexia, gangraena, embolia, thrombosis) och eponymer (Brights/Basedows/Ménières/Bantis/Littles sjukdom + Morbus-former).
  - **Tolkningskonflikter flaggade** som historiska och ej förenliga med modern medicin (angina pectoris förr brett om bröst-/halssmärtor; gikt förr all ledvärk; moderpassion/hysteri tillskrivna livmodern).
  - Synliga termer: 5 448 → **5 569** (+121 nya poster, 14 berikade). Inga dubbletter.
- **Ordlistan: unik meta-description per bokstavssida.** Varje `ordlista-*.html` (A–Ö, siffror, suffix) + landningssidan har nu en egen, olika formulerad beskrivning med en fråga, äkta exempeltermer och relevanta nyckelord, alla ≤157 tecken. Datadrivet i `scripts/generate_glossary.py` (`GROUP_DESCRIPTIONS`/`LANDING_DESC`) med inbyggd längdkontroll; slår igenom på meta, og:/twitter: och JSON-LD. `sitemap.xml` och alla 31 sidor omgenererade.
- APP_VERSION/VERSION → 0.8.30 (cachebuster: app.js → 0.8.30; glossary.css/js oförändrade 0.8.29; styles.css oförändrad 0.7.1).

## 0.8.29
- **Ordlistan: grekiska termerna kompletterade och korrigerade.** Granskning av 0.8.28 mot ursprungslistan visade tappade detaljer som nu rättats:
  - **ε-kedja** (epsilon-kedja) tillagd under E — embryonal hemoglobinkedja som tidigare fallit bort. Synliga termer 5 447 → **5 448**.
  - **Böjning återställd** i de två integrerade posterna: α-receptor `(alfa-receptor; -n, pl. -er)` och β-blockerare `(beta-blockerare; -n, pl. -∅)` (föll bort när parentesen byttes mot translittereringen).
  - **Dubbla translittereringsformer angivna** där båda används i svensk medicinsk terminologi: χ²-test `(chi-två-test, även khi-två-test)`, φ-koefficient `(fi-koefficient, även phi-koefficient)`, μ-receptor `(my-receptor, även mu-receptor)`. Gör posterna sökbara på båda stavningarna.
- APP_VERSION/VERSION → 0.8.29 (cachebuster: app.js → 0.8.29, glossary.css/js → 0.8.29; styles.css oförändrad 0.7.1).

## 0.8.28
- **Ordlistan: grekiska glyf-termer insorterade under latinsk bokstav (38 poster).** Termer med grekisk inledningsbokstav (β-blockerare, ω-3-fettsyror, χ²-test …) visas nu med den grekiska glyfen som uppslagsord men sorteras in under sin latinska translitterering (β → B, ω → O, χ → C, φ → F osv.). Hela det utskrivna ordet anges i parentes direkt efter ordklassen, t.ex. *subst.* (beta-blockerare) …, vilket gör posten sökbar utan grekiskt tangentbord.
  - **3 integrerade** i befintliga poster (β-blockerare ← betablockerare, α-receptor ← alfareceptor, α-fetoprotein ← Alfa-1-fetoprotein); deras gamla ankare bevarades så inga djuplänkar bröts.
  - **35 nya** poster enligt grundmallen (α₁/α₂/β₁/β₂-receptorer, β-amyloid, β-laktam, β-oxidation, γ-GT, γ-globulin, γ-interferon, γ-strålning, γ-aminosmörsyra, δ/κ/μ/σ-receptorer, opioidreceptorer, immunglobulinkedjor, ω-fettsyror, EEG-vågor m.fl.).
  - **Mekanism:** nytt valfritt `sort`-fält i `data/ordlista.json` styr både bokstavsgrupp och ordning inom gruppen; speglat byte-identiskt i `scripts/generate_glossary.py` (`sort_value`) och `js/glossary.js` (`sortValue`). Explicit `slug` per post hindrar kollision med de utskrivna grundorden.
  - Synliga termer: 5 412 → **5 447** (+35). Sidorna omgenererade.
- **Ordlistan: bokstavsrubrikerna får plats på mobil.** Sidtiteln (`Medicinska ord på A` m.fl.) skalar nu med skärmbredden (`clamp(1.5rem, 6.5vw, 2.5rem)`) så att även långa titlar ryms snyggt; scoped i `glossary.css`.
- APP_VERSION/VERSION → 0.8.28 (cachebuster: app.js → 0.8.28, glossary.css/js → 0.8.28; styles.css oförändrad 0.7.1).

## 0.8.27
- **Flashcards avstängda för ämnet Tentaplugg (tillsvidare).** Ämnet innehåller frågor som inte fungerar som flashcards. Etiketten i ämnesvalet ändrad från "Tentaplugg (MC+FC)" till "Tentaplugg (MC)", vilket via den befintliga `updateStartButtons`-logiken automatiskt dimmar (inaktiverar) "Starta flashcards"-knappen när Tentaplugg är valt. Ingen kodlogik ändrad.
- APP_VERSION/VERSION → 0.8.27 (cachebuster: app.js → 0.8.27; glossary oförändrad 0.8.26; styles.css 0.7.1).

## 0.8.26
- **Ordlistan: Å och Ä fyllda (21 nya poster).** Tidigare tomma bokstäver; nu egna sidor (`ordlista-aa.html`, `ordlista-ae.html`) och aktiva i alfabetsraden. Posterna följer grundmallen och kopplas till latinska/moderna termer.
  - **Kliniskt etablerade:** ärr, ärrbildning, ärrvävnad, ärrbråck, ärrkontraktur, ätstörning; ångest, ångestsyndrom, åderbråck, åderförkalkning.
  - **Historiska/kyrkbokstermer märkta *Ålderdomligt*:** åder, åderlåtning, åderlåta, åderinflammation, åderstockning, åkomma, ålderdom, ålderdomssvaghet, åldersbräcklighet, åldersförfall, ångestneuros (flera var vanliga dödsorsaker i äldre kyrkböcker).
  - **Slug-kollision löst:** `ärr` foldas annars till samma ankare som förkortningen `ARR`. Nytt valfritt `slug`-fält i `data/ordlista.json` åsidosätter foldningen för enstaka poster (`ärr` → `term-aerr`); speglat byte-identiskt i `scripts/generate_glossary.py` och `js/glossary.js`. Befintliga ankare orörda.
  - Synliga termer: 5 391 → **5 412** (+21). Sidorna omgenererade.
- APP_VERSION/VERSION → 0.8.26 (cachebuster: app.js → 0.8.26, glossary.css/js → 0.8.26; styles.css oförändrad 0.7.1).

## 0.8.25
- **Ordlistan: standardiserad grundmall för alla poster (uppslagsverksstil).** Samtliga 5 391 poster följer nu en enhetlig struktur: **fett, gement uppslagsord** (utom förkortningar och egennamn/eponymer), **kursiv förkortad ordklass** direkt följd av **böjning i parentes** (`subst. (-en, pl. -er) …`), gemen definitionsinledning, varianter (`Sv.`, `Vardag.`, `Eng.`) och etymologi.
  - **Uppslagsord gemeniserade:** 4 164 termer (Abdomen → abdomen). Förkortningar (ACE, AAT, 5-FU) och 26 kurerade eponymer (Crohns sjukdom, Parkinsons sjukdom, Cushings syndrom, Sjögren …) behåller versal; eponym-härledda gloss-ord skyddas (Apgarpoäng).
  - **Fältmarkörer:** `Lekman:` → `Vardag.`, `Eng:` → `Eng.`, `Sv:` → `Sv.`.
  - **Rendering:** `formatDef`/`format_def` kursiverar nu den **ledande ordklass-token** i stället för den engelska termen — endast ordklassen kursiveras. Speglat byte-identiskt i `scripts/generate_glossary.py` och `js/glossary.js`. Sidorna omgenererade.
  - Grundmall att bygga vidare på (t.ex. arkaiska varianter som *bleksot* senare).
- APP_VERSION/VERSION → 0.8.25 (cachebuster: app.js → 0.8.25, glossary.css/js → 0.8.25; styles.css oförändrad 0.7.1).

## 0.8.24
- **Ordlistan: kvalitetskontroll av dubbletter – svensk/latinsk formpar sammanslagna.** 56 par där samma ord stod som två poster i olika form (svensk vs latinsk) slogs ihop till en post med det **latinska/medicinska ordet som uppslagsord** och den svenska formen invävd som `Svensk form: …`; allt innehåll bevarat. Adjektiv (`Frontal→Frontalis`, `Renal→Renalis`, `Nasal→Nasalis` m.fl.) och substantiv (`Membran→Membrana`, `Ligament→Ligamentum`, `Tonsill→Tonsilla` m.fl.).
  - **4 par hölls medvetet isär** som falska vänner (lika form, olika ord): `Fibros`/`Fibrosus`, `Median`/`Medianus`, `Mental` (*mens*, psyket)/`Mentalis` (*mentum*, hakan), `Perone` (subst.)/`Peroneus` (adj.).
  - **9 korsreferenser omdirigerade** till respektive latinskt huvudord (`Jfr Lumbal`→`Lumbalis` osv.); 0 dinglande hänvisningar kvar.
  - Synliga termer: 5 447 → **5 391** (−56). Sidorna omgenererade.
- APP_VERSION/VERSION → 0.8.24 (cachebuster: app.js → 0.8.24; glossary.css/js oförändrade, styles.css oförändrad 0.7.1).

## 0.8.23
- **Alfabetsraden: tecken-/ändelsefacket märks "suffix" i stället för "#".** Facket innehåller bara suffix (poster som inleds med streck), så etiketten är nu uttrycklig. Speglat i `scripts/generate_glossary.py` (`group_label`) och `js/glossary.js` (sökträffarnas grupprubrik). Sidorna omgenererade.
- APP_VERSION/VERSION → 0.8.23 (cachebuster: app.js → 0.8.23, glossary.css/js → 0.8.23; styles.css oförändrad 0.7.1).

## 0.8.22
- **Ordlistan uppdelad i många små sidor (prestanda/SEO).** Den enda `medicinskordlista.html` hade växt till ~3,5 MB och fick katastrofal hastighet i Search Console (Core Web Vitals mäts per URL). Ordlistan är nu uppdelad i **en sida per begynnelsegrupp** — `ordlista-a.html … ordlista-z.html`, `ordlista-oe.html` (Ö), `ordlista-siffror.html`, `ordlista-tecken.html` (ändelser/suffix) — plus en lätt landningssida `medicinskordlista.html`.
  - **Indexsidan visar bokstaven A:s innehåll** (som ordlistan såg ut förr), inte hela listan — bara A laddas, så sidan är lätt (~180 KB mot 3,5 MB). Övriga bokstäver nås via alfabetsraden (egna sidor) eller sökrutan. Tyngsta gruppsidan (P) 216 KB; varje URL laddar snabbt och indexeras separat.
  - **Datadrivet, inget hårdkodat:** `scripts/generate_glossary.py` läser `data/ordlista.json` och skapar en sida för varje grupp som har termer. Tomma bokstäver (idag Å, Ä) får ingen sida men renderas nedtonade i alfabetsraden; dyker en term upp skapas sidan automatiskt vid nästa körning. Föräldralösa sidor städas bort.
  - **Global sökning bevarad:** `js/glossary.js` lazy-laddar `data/ordlista.json` först när användaren börjar söka (lätt sidladdning), och länkar varje träff till rätt sida + ankare. Söker man från en undersida används rent `#ankare` när träffen ligger på samma sida. JS bygger inte längre om listan — den jobbar ovanpå det statiska, crawlbara innehållet (fungerar utan JavaScript).
  - **Alfabetsraden** finns på alla sidor inkl. index; tecken-/ändelsefacket märks **`#`** (standard för symbolfack i A–Ö-index, t.ex. iOS-kontakter), inte "–".
  - **JSON-LD bantad:** den tidigare `DefinedTermSet`:en med samtliga termers URL:er (~1,8 MB) togs bort; varje sida har nu lätt `CollectionPage`/`WebPage` + `BreadcrumbList`. Termerna är ändå fullt crawlbara som semantisk `<dl>`.
  - **Term-ankare oförändrade:** per-post-markupen är byte-identisk, så befintliga `#term-…`-ankare fungerar (nu på respektive gruppsida). Stabila filnamns-slugs för diakriter (Å/Ä→.../Ö→`oe`) speglas identiskt i generator och `glossary.js`.
  - `sitemap.xml` omgenererad (rot + landning + 29 gruppsidor + case + info = 33 URL:er). SEO-meta i head håller fortfarande "tusentals" utan dynamisk siffra.
- **Ordklassmarkörerna städade och flyttade först i varje post.** Markören stod tidigare mitt i definitionen och ibland dubblerat (suffix-/prefix-poster: "Suffix: … (suffix) …"). Nu inleds varje post med sin ordklass som etikett: `(subst.)` → `Subst.:`, `(adj., -t, -a)` → `Adj., -t, -a:`, `(förkortn.)` → `Förkortn.:` osv.; suffix/prefix behåller `Suffix:/Prefix:`. Definitionen kapitaliseras. ~4 600 poster flyttade, ~800 suffix/prefix avdubblerade. Legitima sekundärmarkörer i etymologin ("(diminutiv)") och variantformer ("Även cancerös (adj.)") lämnades orörda.
- APP_VERSION/VERSION → 0.8.22 (cachebuster: app.js → 0.8.22, glossary.css/js → 0.8.22; styles.css oförändrad 0.7.1).

## 0.8.21
- **Medicinska ordlistan: systematiska suffix-poster (latin/grekiska).** Hela listan av medicinska efterled/slutled införd som egna poster i streck-form (`-agra`, `-algia / -algi`, `-cele` …), var och en med betydelse, ursprung och exempel – på samma sätt som prefix-posterna. Synliga termer: 5 294 → **5 447** (+153 suffix).
  - **Varianter samlade per post:** latinsk/grekisk + svensk form ligger i en gemensam post (`-algia / -algi`, `-osis / -os`, `-ektomi` osv.). Dubbletter över källans ämnesindelning slogs ihop (`-clasis/-clasia/-klasi` patologisk + kirurgisk; `-lysis/-lys` upplösning + kirurgisk frigöring; `-logia/-logi` läran om + sjukligt tal).
  - **Slug-disambiguering:** suffix-poster (inleds med streck) får ankarprefix `term-suffix-` så att de inte krockar med likalydande grundord/prefix (`-toxin` vs `Toxin`, `-plasma` vs `Plasma`, `-receptor`, `-stoma`, `-valva`, `-in` vs `in-`). Logiken speglad identiskt i `scripts/generate_glossary.py` och `js/glossary.js`; inga befintliga ankare påverkas (ingen tidigare term inleds med streck).
  - **Källrättelser verifierade mot litteratur (Wiktionary, Merriam-Webster Medical, medicinska ordböcker):** `-ont` → **`-odontia / -odonti`** (anodontia/hyperdontia/oligodontia är grek. *-odontia*; exemplet anodonti flyttat dit från `-dentia`, som behållits som latinsk variant med ex. *edentia*). `-ade` (spuriöst "funktionellt nätverk") → ersatt av det riktiga riktningssuffixet **`-ad`** (lat. *cephalad, caudad, ventrad*). `neuroexeres` → **`neurexeres`** (eng. *neurexeresis*). `-doxia`: psykiatri-påståendet borttaget (grek. *doxa* = åsikt; ortodoxi/heterodoxi). Bekräftade och behållna: `-cholia` (acholia), `-chylia` (achylia), `-thelia` (athelia/polythelia), `-icterus` (anicteric), `-tocia` (dystocia), `-liposis` (liposis).
  - **Städade/utelämnade källposter:** `-vcf` → `-valva`; `-gocrine` → `-krin`; korrupt `-spasmus`-exempel rensat. Utelämnade utan litteraturstöd: `-gasis`, `-isis` (= bara grek. `-sis`), `-strismus` (trismus < *trismos*); `-dysesthesia` slogs in i `-estesi` (dysestesi som exempel); `-ia` noterat i `-iasis`-posten.
  - `medicinskordlista.html` omgenererad via `scripts/generate_glossary.py`; statisk markup byte-identisk för befintliga poster. SEO-meta orörd ("tusentals", ingen siffra).
- APP_VERSION/VERSION → 0.8.21 (cachebuster: app.js → 0.8.21, glossary.js → 0.8.21).

## 0.8.20
- **Prefix-listan: tre källflaggade former kontrollerade mot litteratur och rättade.** Synliga termer: 5 295 → **5 294**.
  - `pycl- / pyclo-` → rättat till **`pycn- / pycno-`** (även pykn-/pykno-), grek. *pyknos* = tät/tjock. Var OCR-fel (n→l) i källistan.
  - `pemi- / pemp-` → rättat till **`pemphig- / pemphigo-`**, grek. *pemphix* (stam *pemphig-*) = blåsa/pustel. Betydelsen stämde, formerna var korrupta.
  - `parati- / paratio-` → **borttagen**; ingen attesterad kombineringsform (kontrollerat mot Wikipedias rotlista, prefix-ordböcker m.fl.). Parathyreoidea täcks redan av *para-* + *thyr-*.
  - `medicinskordlista.html` omgenererad. SEO-meta orörd.
- APP_VERSION/VERSION → 0.8.20 (cachebuster: app.js → 0.8.20, glossary.js → 0.8.20).

## 0.8.19
- **Medicinska ordlistan: systematiska prefix-poster (latin/grekiska).** Hela listan av medicinska för- och kombineringsled införd som egna poster i streck-form (`a-`, `ab-`, `aden- / adeno-` …), var och en med betydelse, ursprung och exempel. Synliga termer: 4 701 → **5 295** (+652 prefix, −58 ersatta).
  - **Ersatta gamla poster:** de 58 tidigare versala prefix-posterna (Ab, Ad, Adeno, Di, Endo, Epi, Exo, Hyper, Para, Sub …) togs bort och ersattes av de nya streck-formerna. De fyra prefix-posterna utan motsvarighet i listan (Giga, Krikos, Mylo, Psoa) lämnades orörda.
  - **Varianter samlade per post:** stavningsvarianter (t.ex. `haem-/hemat-/hemato-/hemo-`) ligger i en gemensam post; assimilerade former skrivs in i original-prefixets post (ad- → ac-/af-/ag-/al-/ap-/as-/at-, con- → co-/col-/com-/cor-, in- → il-/im-/ir-, ob- → oc-/of-/op-, sub- → suc-/suf-/…, syn- → sym-, ex- → ef-, en- → em-, dis- → dif-, apo- → ap-/aph-).
  - **Rättade OCR-fel** i källistans C-avsnitt (`gorm-`→corm-, `gorono-`→corono-, `gortic-`→cortic-, `gostat-`→cost-, `goxo-`→coxo-, `gylindr-`→cylindr-).
  - **Slug-disambiguering:** `ana- (grek.)`, `cis- (lat.)`, `genu- (lat.)` fick språktagg i titeln för att inte krocka med befintliga poster ANA, CIS, Genu.
  - **Källflaggor att verifiera:** `parati- / paratio-`, `pemi- / pemp-`, `pycl- / pyclo-` (ovanliga/oklara former i källistan – tolkade som parathyreoidea-, blåsa- resp. pykn-/pykno-).
  - `medicinskordlista.html` omgenererad via `scripts/generate_glossary.py`; statisk markup byte-identisk för befintliga poster. SEO-meta orörd ("tusentals", ingen siffra).
- APP_VERSION/VERSION → 0.8.19 (cachebuster: app.js → 0.8.19, glossary.js → 0.8.19). Highscore-data orörd.

## 0.8.18
- **Medicinska ordlistan: bokstäverna T–Ö (samt 5-ASA/5-FU) berikade** till fullt husformat. Synliga termer: 4 321 → **4 701**. Därmed är hela A–Ö berikat och 0 dolda stubbar återstår.
  - **T:** 201 berikade, 20 sammanslagna/borttagna (bl.a. Tymus → Thymus, Trokanter/Trochanter major/minor → Trochanter, Thoracal → Thoracalis, Trendelenburgs läge → Trendelenburgläge, verbformer → substantiv); rubrikfix "tics och Tourettes syndrom" → Tourettes syndrom.
  - **U:** 58 berikade, 1 sammanslagen (Undulans → Undulerande); källfel rättat: Urikosuri (var "urinsyraförgiftning" → korrekt = utsöndring av urinsyra i urinen).
  - **V:** 100 berikade, 3 sammanslagna (Varikös ven → Varice, Vasektomera → Vasektomi, Vesikulös → Vesikulär); stavningsrättning Volvolus → Volvulus.
  - **W/X/Y/Z/Ö + 5-ASA/5-FU:** 21 berikade.
  - **Källflaggor att verifiera:** TAP (ovanlig förkortning för telangiopati) och VH (angavs som tillväxthormon; standard är GH/STH).
- **SEO/meta:** Termantalet är nu helt borttaget ur head/SEO — `<title>`, og:/twitter:title och image:alt samt JSON-LD-beskrivningen säger "tusentals" (ingen siffra). Endast räknaren i sidans body (#termCount) är dynamisk. Källan satt i `scripts/generate_glossary.py` så framtida körningar aldrig återinför en siffra. `medicinskordlista.html` omgenererad.
- APP_VERSION/VERSION → 0.8.18 (cachebuster: app.js → 0.8.18). Highscore-data orörd.

## 0.8.17
- **SEO:** Meta-descriptions kortade till Bings krav (145–159 tecken) på resten av projektets sidor: index.html (204 → 150), info.html (169 → 148), case.html (162 → 149). Innehållet bevarat, bara putsat ned i längd. og:/twitter:description (sociala kort, ingen 159-gräns) orörda.
- APP_VERSION/VERSION → 0.8.17 (cachebuster: app.js → 0.8.17).

## 0.8.16
- **SEO:** Meta-descriptionen för medicinska ordlistan kortad till 146 tecken (Bing kräver 145–159; tidigare ~310). Texten är nu count-oberoende ("tusentals" i st.f. hårdkodat antal) så längden inte driver iväg när termantalet växer. Källan satt i `scripts/generate_glossary.py`; `medicinskordlista.html` omgenererad (body byte-identisk). og:/twitter:description orörda.
- APP_VERSION/VERSION → 0.8.16 (cachebuster: app.js → 0.8.16).

## 0.8.15
- **Medicinska ordlistan: bokstaven S berikad** till fullt husformat. Synliga termer: 4 051 → **4 321** (273 S-poster berikade, 0 stubbar kvar).
  - **Sammanslagningar/borttagningar (7 stubbar):** c/k-dubbletterna Sakrum → Sacrum och Sklera → Sclera (täcks redan av publicerade poster); Sequela → slagen ihop med Sekvele (lat./sv. synonym); -ös-former integrerade i grundordet enligt husregel: Soporös → Sopor, Stridorös → Stridor, Submukös → Submukosa, Seborroiskt → Seborré.
  - **Rubrikfixar:** felstavade/trasiga stubbrubriker rättade – Sekretotisk otit → Sekretorisk otit; Systemiskt: → Systemisk.
  - **Cross-referenser:** SAA/Amyloidos, SAB+SAH/Subaraknoidalblödning, SN/Sant negativ, SP/Sant positiv, Subileus/Ileus, Sensorisk afasi/Afasi, Störande variabel/Confounding factor, Supinera/Pronera, Systolisk/Diastolisk, Serum/Plasma, SXA/DXA m.fl.
  - Forsknings-/statistikbegrepp (Sannolikhetskvot, Sensitivitet/Specificitet, Sensitivitetsanalys, Signifikans(nivå), Stratifiering, Systematisk översikt, Sant pos./neg., Sham) bevarade med tolkningsförklaring.
  - Innehåller även en separat upprensning: de fyra enbokstavsposterna A/B/C/D (evidensgrad) sammanslagna till en samlad post **Evidensgrad**.
- APP_VERSION/VERSION → 0.8.15 (cachebusters: glossary.css → 0.8.15, glossary.js → 0.8.15, app.js → 0.8.15). Highscore-data orörd.

## 0.8.14
- **Medicinska ordlistan: bokstaven R berikad** till fullt husformat. Synliga termer: 3 898 → **4 051** (153 R-poster berikade, 0 stubbar kvar).
  - **Sammanslagningar (2 stubbar borttagna):** c/k-dubbletten Resekera → Resecera (även-stavning); Rektum → täcks redan av publicerade Rectum (som anger "rektum" som svensk form).
  - **Cross-referenser:** RA/Reumatoid, RAST/Allergi, RCA/Koronarkärl, RCT/Randomiserat kontrollerat försök, RR/Relativ risk, RRI/Relativ riskökning, RRR/Relativ riskreduktion, RRT/Dialys, RF/Reumatoid, RIND/TIA, RPGN/Glomerulonefrit, RMR/Basalmetabolism.
  - Forsknings-/statistikbegrepp (Randomisering, RCT, Relativ risk/RR/RRI/RRR, Retrospektiv) bevarade med tolkningsförklaring.
  - **OBS källflagga:** importens råtext angav *Rubeola* = "röda hund" (samma som Rubella). Internationell/latinsk nomenklatur skiljer dem: **Rubella = röda hund**, **Rubeola = mässling**. Berikade enligt den vedertagna åtskillnaden, inte råtexten — bör verifieras.
- APP_VERSION/VERSION → 0.8.14 (cachebusters: glossary.css → 0.8.14, glossary.js → 0.8.14, app.js → 0.8.14). Ordliste- och highscore-data orörd.

## 0.8.13
- **Medicinska ordlistan: bokstaven Q berikad** till fullt husformat. Synliga termer: 3 895 → **3 898** (3 Q-poster berikade: Q-tagg, QCT, QT-intervall; 0 stubbar kvar).
- APP_VERSION/VERSION → 0.8.13 (cachebusters: glossary.css → 0.8.13, glossary.js → 0.8.13, app.js → 0.8.13). Ordliste- och highscore-data orörd.

## 0.8.12
- **Medicinska ordlistan: bokstaven P berikad** till fullt husformat. Synliga termer: 3 446 → **3 895** (449 P-poster berikade, 0 stubbar kvar). Hittills största bokstaven.
  - **Sammanslagningar (15 stubbar borttagna):** th/t-formerna Parathyreoidea→Paratyreoidea, Pneumothorax→Pneumotorax; c/k- och stavningsdubbletter Panniculit→Pannikulit, Pediculos + Pediculosis→Pedikulos, Petechium→Petekium, Pingvekula→Pinguecula, Polynevropati→Polyneuropati, Pyoderma→Pyodermi, Proptosis→Proptos, Paronykion→Paronyki; synonympar Periodontit→Parodontit, Periodontal→Parodontal, Pip→Pip-led; slug-kollisionen Pustulös→Pustulos (pustulös/pustulos ger identiskt ankar-id, adjektivet integrerat i Pustulos-posten).
  - **Rubrik rättad:** Parasympatimimetisk → **Parasympatomimetisk** (felstavning i importen).
  - **Cross-referenser:** PMS/PMDD/PMDS, PCO/PCOS/Polycystiskt ovariesyndrom, PPV/Positivt prediktivt värde, PTH/Paratyreoideahormon, PRL/Prolaktin, PPI/Protonpumpshämmare, PTSD/Posttraumatiskt stressyndrom, PCI/PTCA, Prebiotika/Probiotika m.fl.
  - Forsknings-/statistikbegrepp (P-värde, Power, Prevalens, Publication bias, Positivt prediktivt värde) bevarade med tolkningsförklaring.
- APP_VERSION/VERSION → 0.8.12 (cachebusters: glossary.css → 0.8.12, glossary.js → 0.8.12, app.js → 0.8.12). Ordliste- och highscore-data orörd.

## 0.8.11
- **Medicinska ordlistan: bokstaven O berikad** till fullt husformat. Synliga termer: 3 314 → **3 446** (132 O-poster berikade, 0 stubbar kvar).
  - **Sammanslagningar (2 stubbar borttagna):** c/k-dubbletten Otoscleros → Otoskleros (även-stavning); slug-kollisionen Okular → Okulär (substantivet okular = mikroskopets ögonlins integrerat i Okulär-posten, eftersom okular/okulär annars ger identiskt ankar-id).
  - **Cross-referenser:** OCD ↔ Obsessiv kompulsiv neuros, Ooforektomi ↔ Ovariektomi (äkta synonymer, grek./lat. rot), Opiat → Opioid, Opportunist → Opportunistisk infektion, Ortostatisk → Ortostatisk hypotension.
  - Forsknings-/statistikbegrepp (OR = odds ratio) bevarat med tolkningsförklaring.
- APP_VERSION/VERSION → 0.8.11 (cachebusters: glossary.css → 0.8.11, glossary.js → 0.8.11, app.js → 0.8.11). Ordliste- och highscore-data orörd.

## 0.8.10
- **Medicinska ordlistan: bokstaven N berikad** till fullt husformat. Synliga termer: 3 202 → **3 314** (112 N-poster berikade, 0 stubbar kvar).
  - **Sammanslagningar (5 stubbar borttagna):** ph/f-dubbletterna Nephrolithiasis → Nefrolitiasis, Nephropati → Nefropati och Nephrotoxisk → Nefrotoxisk (alla noterade som "även"-stavning); c/k-dubbletten Nocturnal → Nokturnal (även-stavning); plural Neutrofila granulocyter → Neutrofil granulocyt (singular med pluralform i texten).
  - **Cross-referenser:** NHL ↔ non-Hodgkins lymfom, NPV ↔ Negativt prediktivt värde, NUD ↔ Non-ulcer, NT → PK-INR.
  - Forsknings-/statistikbegrepp (NNT, NNH, NS, NPV, nollhypotes, negativt prediktivt värde) bevarade med formel- och tolkningsförklaring.
- APP_VERSION/VERSION → 0.8.10 (cachebusters: glossary.css → 0.8.10, glossary.js → 0.8.10, app.js → 0.8.10). Ordliste- och highscore-data orörd.

## 0.8.9
- **Medicinska ordlistan: ny ingress och meta-beskrivningar.** Tagline-stycket under rubriken omskrivet till "Medicinska ord, förkortningar och begrepp med definitioner, synonymer och etymologi i en sökbar ordlista. Sök bland tusentals latinska och medicinska anatomiska, fysiologiska, patologiska, biologiska och tekniska termer."
  - `meta name="description"`, `og:description` och `twitter:description` omskrivna i samma anda och **utan termantal** (genereras av `scripts/generate_glossary.py`, rad ~230). `<title>` och sociala titlar behåller antalet tillsvidare.
- APP_VERSION/VERSION → 0.8.9 (cachebusters: glossary.css → 0.8.9, glossary.js → 0.8.9, app.js → 0.8.9). Ordliste- och highscore-data orörd.

## 0.8.8
- **Medicinska ordlistan: bokstaven M berikad** till fullt husformat. Synliga termer: 3 098 → **3 202** (104 M-poster berikade, 0 stubbar kvar).
  - **Sammanslagningar (5 stubbar borttagna):** c/k-dubbletten Makula → täcks av redan publicerade Macula (även-stavning); Megacolon → Megakolon; Menarche → Menarke (försvenskad form); Mesenterial → Mesenteriell (stavningsvariant); Medianvärde → Median (synonym).
  - **Rubriker rättade:** Mamillen → **Mamill** och Metafysen → **Metafys** (grundform i stället för bestämd form); Mandrin/mandräng → **Mandräng** (även-stavning mandrin).
  - **Faktarättning i importtexten:** Makulopati (källtexten angav felaktigt "sjukdomar i hornhinnan" – rättat till sjukdom i gula fläcken/makula, enligt ordets betydelse).
  - Evidens-/statistikbegrepp (MADRS, MAO/MAOH, Mol, Median) bevarade med förklaring.
- APP_VERSION/VERSION → 0.8.8 (cachebusters: glossary.css → 0.8.8, glossary.js → 0.8.8, app.js → 0.8.8). Highscore-datan orörd.

## 0.8.7
- **Medicinska ordlistan: klickbar alfabetsrad** under sökrutan. En klassisk A–Ö-rad (inkl. Å Ä Ö) där varje befintlig bokstav är ett hoppankare till sin bokstavsgrupp; bokstäver utan poster (W, Y, Å, Ä, Ö) visas nedtonade och oklickbara.
  - Förrenderad statiskt av `scripts/generate_glossary.py` (markörer `GENERATED:ALPHABET:START/END`) så den fungerar utan JS och speglar exakt vilka bokstäver som finns i `data/ordlista.json`.
  - `glossary.js` tonar ned bokstäver utan sökträffar i realtid medan man söker.
- **"↑ Topp"-länk i varje bokstavsrubrik** (höger ände) som tar tillbaka till sidans topp. Följer med när rubriken är sticky. Renderas identiskt av både `generate_glossary.py` och `glossary.js`.
- APP_VERSION/VERSION → 0.8.7 (cachebusters: glossary.css → 0.8.7, glossary.js → 0.8.7, app.js → 0.8.7). Ordliste- och highscore-data orörd.

## 0.8.6
- **Medicinska ordlistan: bokstaven L berikad** till fullt husformat. Synliga termer: 2 973 → **3 098** (125 L-poster berikade, 0 stubbar kvar).
  - **Sammanslagningar (5 stubbar borttagna):** stavningsdubbletten Lacrimal → Lakrimal (även-stavning); operationsverbet Laryngektomera → Laryngektomi; Ligering → Ligera (verb/verbalsubst.); Laxantia och Laxerande → Laxans (lat. plural resp. adj.).
  - **Rubriker rättade:** Labia major/minor → **Labia majora/minora** (korrekt latinsk pluralform); Ligamenten → **Ligament** (grundform i stället för bestämd plural).
  - **Faktarättning i importtexten:** Logoped/Logopedi (källtexten hade kastat om person och ämne – nu logoped = vårdgivaren, logopedi = ämnet/läran).
  - Diagnostiska statistikbegrepp (Likelihood ratio, LR) bevarade med formelförklaring; LR korsrefererat mot Likelihood ratio.
- APP_VERSION/VERSION → 0.8.6 (cachebuster app.js → 0.8.6). Highscore-datan orörd.

## 0.8.5
- **Medicinska ordlistan: bokstaven K berikad** till fullt husformat. Synliga termer: 2 807 → **2 973** (166 K-poster berikade, 0 stubbar kvar).
  - **c/k-dubbletter:** 28 k-stubbar togs bort till förmån för redan publicerade c-former (Katarakt→Catarakt, Karcinom→Carcinom, Kolit→Colit, Kolon→Colon, Konjunktivit→Conjunktivit, Koronar→Coronar, Kontusion→Contusion, Kornea→Cornea m.fl.). Sex c-poster som saknade k-formen kompletterades med den (Carpus, Coccyx, Coccygodyni, Choledochus, Cornea, Coitus) så att k-stavningen förblir sökbar.
  - **Sammanslagningar:** -ös-adjektiv infogade i grundordet (karcinomatös→Karcinomatos, kariös→Karies, kavernös→Kavern, komatös→Koma); operationsverben kolecystektomera/kolektomera infogade i substantiven (Kolecystektomi/Kolektomi); stavningsdubbletten Koledokolithiasis borttagen (täcks av Choledocholitiasis).
  - **Faktarättningar i importtexten:** Karbunkel (sammanflytande hårsäcksbölder, ej akne), Kloasma (melasma/graviditetsmask, ej leverfläck), Kommensal (skadar inte värden, ej snyltare), Kataton (även orörlighet/stelhet, ej bara oro).
  - Statistik-/forskningsbegrepp (Konfidensintervall, Kontrollerad studie, Klusterrandomisering, Klinisk signifikant) ramade som forskningsbegrepp.
- APP_VERSION/VERSION → 0.8.5 (cachebuster app.js → 0.8.5). Highscore-datan orörd.

## 0.8.4
- **Medicinska ordlistan: bokstaven J berikad** till fullt husformat. Synliga termer: 2 802 → **2 807** (5 J-poster, 0 stubbar kvar).
  - Berikade: JIA, JRA (korsrefererade som synonyma benämningar på barnreumatism), Jonisera, Jonisering, Juvenil.
- APP_VERSION/VERSION → 0.8.4 (cachebuster app.js → 0.8.4). Highscore-datan orörd.

## 0.8.3
- **Medicinska ordlistan: bokstaven I berikad** till fullt husformat. Synliga termer: 2 604 → **2 802** (238 I-poster, 0 stubbar kvar).
  - Dubbletter/stavning: Icterus → **Ikterus** (svensk stavning). -ös-adjektiv infogade i grundordet i stället för egen post: infektiös → Infektion, intertriginös → Intertrigo.
  - **-ös-glosor skärpta:** infektiös och eksematös fick egna, distinkta betydelseförklaringar i stället för att likställas med grundordet (infektiös = orsakad av/har samband med infektion, av infektionskaraktär; även smittsam — eksematös = av eksemkaraktär).
- **Återställning efter trasig redigeringssession:** `medicinskordlista.html` hade fått sin kropp raderad (blank sida) och länkarna i index.html/sitemap.xml pekade på det gamla filnamnet `medicinskterminologi.html` (404). Sidan återställd från `0.8.2`, länkar rättade, I-berikningen återvunnen ur backup. Se BUG_REPORT_ASSISTANT.md.
- APP_VERSION/VERSION → 0.8.3 (cachebuster app.js → 0.8.3). Highscore-datan orörd.

## 0.8.2
- **Medicinska ordlistan: bokstäverna G och H berikade** till fullt husformat. Synliga termer: 2 291 → **2 604**.
  - G: 86 poster berikade; 2 dubbletter sammanslagna (Granulomatös→Granulom, Glykosuri→Glukosuri) och 2 icke-termer borttagna ("Grupp 1"/"Grupp 2", som var resvaccinationskategorier, inte uppslagsord).
  - H: 227 poster berikade; 4 dubbletter sammanslagna (Hemorroid→Hemorrojd, Hidroadenit→Hidrosadenit, Hodgkins sjukdom→Hodgkins lymfom, Hyperhidrosis→Hyperhidros); 3 rubriker rättade (Heberdenska→Heberdens knutor, Horner→Horners syndrom, Hip Harris Score→Harris Hip Score).
  - Städning av trasiga/dubblerade källtexter (bl.a. Hjärtblock, Hyperhidros) och hyper-/hypo-par korsrefererade med sina motsatser.
- APP_VERSION/VERSION → 0.8.2 (cachebuster app.js → 0.8.2). Highscore-datan orörd.

## 0.8.1
- **Medicinska ordlistan: bokstäverna E och F berikade** till fullt husformat. Synliga termer: 1 967 → **2 291**.
  - E: 202 poster berikade; 1 inskrapad skräppost ("Enter words…") och 5 stavnings-/-ös-dubbletter borttagna (Eksematös→Eksem, Erytematös→Erytem, Eclampsi→Eklampsi, Encephalit→Encefalit, Evakuation→Evakuering).
  - F: 122 poster berikade; 5 dubbletter sammanslagna (Fibrös→Fibros, Fallots syndrom→Fallots tetrad, Fixation→Fixering, Fotosensitivitet→Fotosensibilitet, Fekalier→Feces); rättat stavfel i rubrik (Falska postitiva → Falska positiva).
  - Faktagranskning: rättat bl.a. Erytrofobi (rädsla för att rodna, ej erytrodermi), Eskarotomi (≠ fasciotomi), Falang (ben, ej led), Femurfraktur (lårbensbrott).
- APP_VERSION/VERSION → 0.8.1 (cachebuster app.js → 0.8.1). Highscore-datan orörd.

## 0.8.0
- **Stor utbyggnad av den medicinska ordlistan** mot målet att täcka all medicinsk terminologi på svenska. En omfattande lista med medicinska termer (3 965 st) har importerats och de som saknades i `data/ordlista.json` lades in. Ordlistan berikas sedan bokstav för bokstav till fullt husformat (definition, ordklass, böjning, Sv/Eng/lekmannasvenska, etymologi).
  - **Berikat och publicerat: A, B, C, D.** Synliga termer i ordlistan: 1 081 → **1 967**.
  - **Stub-arkitektur:** ännu ej berikade poster ligger i `ordlista.json` med `"status": "stub"` (3 754 nya importerades; 2 859 kvarstår som stubs E–Ö). Stubbar **döljs live** — både `scripts/generate_glossary.py` och `js/glossary.js` (`loadTerms`) filtrerar bort `status === "stub"`, så ofärdiga poster aldrig syns eller indexeras. Den renderade `medicinskordlista.html` förblev byte-identisk fram tills första bokstaven berikades.
  - **-ös-regel:** medicinska -ös-adjektiv (adenomatös, cancerös …) ges ingen egen post utan integreras i grundordet med "även …" (löser även slug-kollisioner då ö foldas till o).
  - **c/k-stavningsdubbletter:** grekisk-härledda ord (Catarakt/Katarakt, Cardio-/Kardio-, Cholecystit/Kolecystit …) berikas under c-formen med not "även k-form"; k-dubbletterna tas bort när K m.fl. berikas.
  - **Faktagranskning:** rättat flera fel i den importerade källtexten, bl.a. bakteriostatisk (tillväxthämmande, ej dödande), brachycefali (kort/brett huvud, ej litet), cervixprolaps (livmoderhalsframfall, ej diskbråck), dopaminagonist (stimulerar receptorn), BMD (bone mineral density), bäcken (pelvis); samt rättade stavfel och markerade föråldrade/icke-medicinska termer.
- **Ny dokumentation:** `ORDLISTA.md` (syfte, datamodell, arbetsgång, c/k- och -ös-regler) + länk i `README.md`. `data/ordlista_import_raw.json` sparad som råimport/backup (redigeras ej).
- Cachebustrar bumpade för ändrade filer (app.js och glossary.js → 0.8.0); CSS oförändrad. APP_VERSION/VERSION → 0.8.0.
- Highscore-datan i localStorage är orörd.

## 0.7.1
- **PageSpeed Insights-åtgärder (Tillgänglighet + Best practices)**, utan synlig designändring:
  - **Kontrast (WCAG AA, 4,5:1):** all grön TEXT på ljus bakgrund mörkad till `--primary-deep` #047857 (5,5:1 mot vitt). Tidigare användes `--primary` #10b981 (2,2:1) och `--primary-dark` #059669 (3,8:1) — båda underkända. Gäller bl.a. sekundärknapparnas text (Info/Topplista/Inställningar m.fl.), länkar i Om-texten (`.intro a`), versionsnumret i sidhuvudet, brödsmulelänkar, badges, topplistans procent, flashcardens "SVAR"-etikett/svarstext, case-taggar och fotnotskod. Hover-tillstånd för länkar → `--primary-deepest` #065f46. Kantlinjer/accent-färger (icke-text) orörda, så utseendet är nästan identiskt.
  - **Konsol-404:an borta:** `init()` i app.js anropade `loadQuestions()` UTAN sökväg → `fetch(undefined)` gav `GET /anatomiquiz/undefined` 404 + fellogg vid varje sidladdning. Förladdningen var dessutom meningslös (frågorna laddas alltid om med rätt sökväg när quiz/flashcards startas) och fyllde bara `allQuestions` med placeholders. Anropet borttaget.
  - **CSP mot XSS:** `<meta http-equiv="Content-Security-Policy">` på alla fyra sidorna: `default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'`. Säkert eftersom sajten saknar inline-skript/-stilar och externa resurser (JSON-LD-block är data, inte körbara, och påverkas inte). Verifierat i headless Chrome: inga CSP-blockeringar på någon sida.
  - **Kan INTE fixas på GitHub Pages** (kräver HTTP-svarshuvuden, som GitHub Pages inte låter en sätta; meta-taggar räcker inte): HSTS-policy, COOP, X-Frame-Options/`frame-ancestors` (clickjacking). Trusted Types hoppades över medvetet — appen renderar via `innerHTML` och skulle gå sönder utan större refaktorering.
- Cachebustrar (styles.css/app.js/case.js → 0.7.1) och APP_VERSION bumpade till 0.7.1.
- Highscore-datan i localStorage är orörd.

## 0.7.0
- **Tillgänglighets- och SEO-genomgång av hela webbplatsen** (alla fyra sidor + CSS + app.js):
  - **Timern tystad för skärmläsare:** `#timer`/`#fcTimer` hade `aria-live="polite"` och uppdateras varje sekund → skärmläsare läste upp "Tid: 1 s, 2 s, 3 s…" oavbrutet. Nu `role="timer"` (tyst). Sektionsövergripande `aria-live` på `#quiz` och `#flashcards` borttagen av samma skäl (timern ligger i sektionerna); `#fcQuestion` fick egen `aria-live="polite"` så nya kort fortfarande annonseras.
  - **Rätt/fel förmedlas inte längre med enbart färg (WCAG 1.4.1):** besvarade svarsknappar får ✓/✗-ikon + dold skärmläsartext ("rätt svar"/"fel svar") via ny `markAnswerBtn()`. Felaktiga `aria-pressed`/`role="button"` på svarsknapparna borttagna; `role="list"` på `#answers` borttagen (ogiltig utan listitem-barn).
  - **Kontrast (WCAG AA):** primärknapparnas gradient mörkad (`--primary-deep` #047857 → `--primary-deepest` #065f46; vit text ≥ 4,5:1), rätt-svar-grönt #10b981 → #047857, `--error` #ef4444 → #dc2626 (vit/på vit text klarar AA).
  - **Synliga fokusringar:** `:focus-visible` med solid 3px-outline på knappar, svarsknappar, input och select (ersätter knappt synliga 10–20 %-skuggor); accentknapparna får teal-ring. Visas bara vid tangentbordsfokus.
  - **SEO — riktiga länkar:** Info/Case/Ordlista-knapparna på startsidan var `<button onclick>` (ofollowbara för sökmotorer) → nu `<a class="btn">`; ger crawlbara interna länkar och öppna-i-ny-flik.
  - **Övrigt:** `hasPart.url` i JSON-LD nu absolut URL; `meta keywords` borttagen på alla sidor (ignoreras sedan 2009); `apple-touch-icon` → icon-192.png (Apple kräver ≥180px); meningslös `preload` av CSS borttagen; `#topicLegend`-inline-stil flyttad till CSS-klass och kopplad till ämnesväljaren via `aria-describedby`.
- Cachebustrar (CSS nu enhetligt 0.7.0 på alla sidor — låg kvar på 0.6.11 på undersidorna) och APP_VERSION bumpade till 0.7.0.
- Highscore-datan i localStorage är orörd.

## 0.6.19
- **Grundlig faktagranskning av samtliga MC/TF-ämnen** (≈2 400 frågor: ben, blodomloppet, ergonomi, grepp, handen, ledtyper, muskler, neurologi, olika_aldrar, riktningar, skuldran, tentaplugg). `medicinsk_terminologi.json` granskades inte (skyddad källa).
- **Sakfel rättade:**
  - **Hjärtat har 2 kammare, inte 4.** `tentaplugg studier_q153` ("Hur många kammare har hjärtat?") rätt svar 4 → **2** (4 blev distraktor). `blodomloppet q41` "Hjärtat har fyra kamrar" → "Hjärtat har **två** kamrar" (svar Sant).
  - **handen q220:** "M. flexor carpi radialis går genom karpaltunneln" Sant → **Falskt** (FCR löper i eget fack; krockade med att karpaltunneln rymmer 9 senor).
  - **handen q221:** "M. flexor carpi ulnaris går genom Guyons kanal" Sant → **Falskt** (kanalen rymmer n./a. ulnaris; FCU fäster på os pisiforme).
  - **handen q468:** tum-MCP-extension — rätt svar omdefinierat till "En rörelse i frontalplanet parallellt med handflatan" (det felaktiga sagittalplan-svaret blev distraktor; var inkonsekvent med abduktionsdefinitionen i q484).
- **Tvetydiga/svaga frågor borttagna:** `tentaplugg studier_q210` (nackbelastning "12 ggr" – ej källstödd), `tentaplugg studier_q224` och `grepp q44` (konservburkslock → Sollerman-grepp – ej entydigt verifierbart).
- **Omformuleringar för entydighet:** `tentaplugg studier_q98` (ledningshastighet — distraktorn "Ranviers noder" var försvarbart korrekt; frågan omformulerad med "Graden av myelinisering" och entydiga distraktorer). `tentaplugg studier_q178` ordval "vätska" → "hormon" (melatonin).
- **Stavfel rättade:** `skuldran q66/q76` Romd→Romb (romboideus), `handen q421` frakureras→fraktureras, `handen q445` lillfingeridan→lillfingersidan.
- Cachebustrar och APP_VERSION bumpade till 0.6.19.
- Highscore-datan i localStorage är orörd.

## 0.6.18
- **Slumpade frågor (blandade) innehåller inte längre flashcards.**
  - **Etiketten** i ämnesmenyn ändrad från "Slumpade frågor (MC+FC+TF)" till "Slumpade frågor (MC+TF)". Eftersom appens lägeslogik läser typtaggen ur etiketten innebär detta att knappen "Starta flashcards" nu är skuggad när Slumpade frågor är valt (det gick tidigare att köra slumpade som flashcards), och att Slumpade frågor döljs om man bara bockat i frågetypen Flashcards.
  - **Laddaren** för blandade (både quiz- och flashcards-läget i `js/app.js`) bygger nu sin fil-lista enbart från ämnen vars etikett har MC eller TF — rena flashcard-ämnen (Studenters flashcards, Muskler flashcards) tas aldrig in. Poolen innehåller därmed 0 flashcard-kort (verifierat). Quizutfallet är oförändrat (FC-ämnena bidrog ändå inte med MC/TF), men inga flashcard-filer hämtas längre i onödan.
  - Frågetypsfiltret i quizet kvarstår som extra säkerhetsnät.
- Cachebustrar och APP_VERSION bumpade till 0.6.18.
- Highscore-datan i localStorage är orörd.

## 0.6.17
- **Rättat felplacerad text i index.html:** en lös textsträng "Hitta" hade hamnat direkt efter `og:url`-metataggen inne i `<head>`. Webbläsaren flyttar lös text från `<head>` in i `<body>`, vilket gjorde att ordet dök upp överst på sidan (bl.a. ovanför topplistan). Borttagen.
- Cachebustrar och APP_VERSION bumpade till 0.6.17.
- Highscore-datan i localStorage är orörd.

## 0.6.16
- **Entydighetsgranskning av de tre nya ämnena (Grepp, Skuldra, Ledtyper):** gick igenom samtliga 252 MC-frågor och säkerställde att exakt ETT svarsalternativ är korrekt. Fyra frågor hade en distraktor som i själva verket också var korrekt — rättade:
  - **grepp q7:** "Vilket grepp använder tumme, pekfinger och långfinger tillsammans?" hade Nyckelgrepp som distraktor (kan tolkas som korrekt). Omformulerad till entydig trepunktsdefinition: "Vilket grepp bildar ett trepunktsfäste mellan tummen, pekfingret och långfingret?" (svar Chuckgrepp), nyckelgreppet utbytt.
  - **grepp q38:** glödlampa → Fem-fingergrepp hade Sfäriskt volargrepp som distraktor — ett runt föremål kan försvaras som sfäriskt. Distraktorn utbytt.
  - **grepp q47:** runt dörrvred → Sfäriskt volargrepp hade Fem-fingergrepp som distraktor — samma rund-föremåls-överlapp. Distraktorn utbytt.
  - **ledtyper q12:** beskrivningen "två plan men inte alla håll" passar både äggled OCH sadelled. Omformulerad och förankrad i de ovala/äggformade ledytorna (svar Äggled).
- Skuldra hade inga entydighetsfel.
- Cachebustrar och APP_VERSION bumpade till 0.6.16.
- Highscore-datan i localStorage är orörd.

## 0.6.15
- **Info-tabellen (statistik) kompletterad med alla ämnen** (`js/info.js`). Lade till de ämnen som saknades: Ergonomi och Olika åldrar i quiz-listan samt Muskler flashcards i flashcard-listan. Skuldra/Grepp/Ledtyper fanns redan med sedan de skapades. OTIPM och Moho utelämnade enligt önskemål. Antalen räknas live ur respektive JSON-fil, så de är alltid korrekta (totalt 3223 quizfrågor + 893 flashcards).
- **Blandade frågor verifierade att täcka allt MC/TF utom Moho/OTIPM:** laddaren är dynamisk och bygger sin fil-lista ur ämnesmenyns alternativ (exkluderar `blandade`, `moho_flashcards`, `otipm_flashcards`). Därmed dras Skuldra, Grepp, Ledtyper, Ergonomi och Olika åldrar in automatiskt; flashcard-kort filtreras bort av frågetypsfiltret. Bekräftat: blandade-poolen = 3223 MC/TF-frågor, Moho/OTIPM korrekt uteslutna. (Ingen kodändring behövdes här.)
- Cachebustrar och APP_VERSION bumpade till 0.6.15.
- Highscore-datan i localStorage är orörd.

## 0.6.14
- **Nytt ämne: Ledtyper (MC)** (`data/ledtyper.json`, 52 frågor, enbart MC, Normal-nivå). Ledtyperna så som 1177 beskriver dem (kulled, gångjärnsled, vridled, äggled, sadelled, planled samt synovialled som överordnad kategori), med fokus på vilka rörelser varje ledtyp utför. Faktagranskat mot 1177:s sida "Så fungerar skelett och leder".
- **Alla ledexempel hämtade enbart från användarens befintliga ämnen** — inga nya leder införda (gäller även distraktorerna): axelled/höftled (kulled), armbågsled/knäled/interfalangealleder (gångjärnsled), radioulnarled/atlantoaxialled (vridled), handled (äggled), tummens basled CMC I & SC-led (sadelled), AC-led/handlovsleder (planled). Klassificeringarna stämmer med ben.json/handen.json/skuldran.json/tentaplugg.json.
- **Fyra delämnen:** `ledtyper_typ` (15, varje ledtyps rörelse + jämförelser), `ledtyper_synovial` (6, synovialled samt ledbrosk/ledvätska/ledband/ledkapsel enligt 1177), `ledtyper_exempel` (18, led → ledtyp), `ledtyper_rorelse` (13, konkreta rörelser vid namngivna leder, t.ex. pronation/supination i radioulnarleden, opposition i tumbasen, rotation i atlantoaxialleden).
- Inkopplat i app.js (`getQuestionsPath` + båda `topicMatch`-blocken, prefix `ledtyper_`), ämnesmenyn i index.html samt statistiklistan i info.js.
- Cachebustrar och APP_VERSION bumpade till 0.6.14.
- Highscore-datan i localStorage är orörd.

## 0.6.13
- **Nytt ämne: Grepp (MC+TF)** (`data/grepp.json`, 100 frågor, 65 MC + 35 TF, alla på Normal-nivå). Bygger på Sollerman-greppklassificeringen och Handrehabilitering (Björkman, Johansson & Rosén 2023, kap 2, s 32-65). Endast de sju efterfrågade greppen behandlas — extensionsgreppet utelämnat. Inga termer utanför referensmaterialet (samma termflora som redan används i handen.json/tentaplugg.json).
- **Fem delämnen:**
  - `grepp_typer` (29): indelning precisionsgrepp/kraftgrepp, vilka fingrar varje grepp använder, definitioner av fingertoppsgrepp, nyckelgrepp, chuckgrepp, fem-fingergrepp samt diagonalt/transversellt/sfäriskt volargrepp.
  - `grepp_exempel` (24): konkreta vardagsexempel per grepp — synål/mynt/knapp/gem (fingertopp), nyckel/blixtlås/spelkort (nyckel), penna/pensel/nål (chuck), burklock/glödlampa (fem-finger), hammare/skruvmejsel/kniv/kvast (diagonalt), portfölj/konservburk/cykelstyre/trappräcke (transversellt), äpple/dörrvred/boll (sfäriskt).
  - `grepp_muskler` (24): inblandade muskler — opponens/adductor/abductor/flexor pollicis, flexor digitorum superficialis/profundus, mm. interossei (palmares/dorsales), mm. lumbricales, opponens digiti minimi, extensor digitorum — samt innervation (n. medianus/ulnaris/radialis). M. adductor pollicis lyft fram som nyckelgreppets nyckelmuskel.
  - `grepp_leder` (14): CMC I (sadelled, opposition), MCP/PIP/DIP-leder, tummens IP-led, handens välvning via de yttre fingrarnas CMC-leder.
  - `grepp_skador` (9): hur skada på n. medianus/ulnaris/radialis och artros i tumbasen (CMC I) påverkar olika grepp.
- Inkopplat i app.js (`getQuestionsPath` + båda `topicMatch`-blocken, prefix `grepp_`), ämnesmenyn i index.html samt statistiklistan i info.js.
- **Faktafel rättat i Handen** (`data/handen.json`): tre frågor (q1, q57, q174) påstod felaktigt att fingertoppsgreppet använder tumme + två/tre fingrar — det gör det inte (då vore det chuckgrepp). q1 omformulerad till korrekt definition ("tummens pulpa möter pekfingrets pulpa, topp mot topp", Sant); q57 och q174 omgjorda till distinkta missuppfattnings-kontroller (Falskt) så de inte dubblerar varandra och förstärker skillnaden mot chuckgreppet.
- Cachebustrar och APP_VERSION bumpade till 0.6.13.
- Highscore-datan i localStorage är orörd.

## 0.6.12
- **Nytt ämne: Skuldra (MC+TF)** (`data/skuldran.json`, 100 frågor, 70 MC + 30 TF, alla på Normal-nivå). Anatomiskt fokus, latinsk nomenklatur enligt Terminologia Anatomica och svenska benämningar enligt etablerad litteratur; nivå avsedd för 1:a-årsstudenter i arbetsterapi och fysioterapi. Inga engelska termer.
- **Fyra delämnen:**
  - `skuldra_ben` (28): skuldergördelns ben och landmärken — scapula (cavitas glenoidalis, spina, acromion, processus coracoideus, fossae, marginer, angulus inferior), clavicula (sternal/akromial ände, S-form) och proximala humerus (caput, tuberculum majus/minus, sulcus intertubercularis, collum chirurgicum, tuberositas deltoidea).
  - `skuldra_leder` (30): **de fyra lederna** som efterfrågades — art. glenohumerale (kulled, labrum, rörelser, instabilitet), art. acromioclavicularis (plan led, lig. coracoclaviculare), art. sternoclavicularis (enda äkta förbindelsen till axialskelettet, discus articularis, sadelled) och den skapulotorakala leden (funktionell, ej synovial).
  - `skuldra_muskler` (34): deltoideus, trapezius, serratus anterior, mm. rhomboidei, levator scapulae, pectoralis major/minor, latissimus dorsi, teres major, biceps/triceps/coracobrachialis (ursprung/fäste/funktion/innervation). Rotatorkuffen nedtonad till ett par stabiliseringsfrågor.
  - `skuldra_funktion` (8): skapulohumeral rytm (~2:1), samspel mellan lederna vid abduktion, bursa subacromialis, luxation (anterior).
- Frågor återanvänder och omformulerar typiska tenta-/ben-/muskelfrågor utan att dubblera befintliga frågor ordagrant.
- Inkopplat i app.js (`getQuestionsPath` + båda `topicMatch`-blocken, prefix `skuldra_`), ämnesmenyn i index.html samt statistiklistan i info.js.
- Cachebustrar och APP_VERSION bumpade till 0.6.12.
- Highscore-datan i localStorage är orörd.

## 0.6.11
- **Spoiler-städning över alla ämnen:** sökte systematiskt (med stam-/böjningsmatchning) efter MC-frågor där en redundant parentes-gloss avslöjar svaret genom att upprepa ett ord ur frågan. 8 äkta läckor täppta:
  - **ben q314:** "längd**tillväxt**?" → svar "Epifysplattorna ~~(tillväxtplattorna)~~".
  - **handen q257/q258:** prompten innehöll översättningsglosan "(volart/dorsalt radiocarpalligament)" som gav bort svaret "Volar/Dorsal" — borttagen.
  - **handen q492:** svar "Dorsala aponeurosen ~~(sträckapparaten)~~" (ekade "sträcksenorna").
  - **tentaplugg q186:** frågan namngav eponymen "(benämnt efter Leonard Hayflick)" → svar "Hayflick-gränsen" — borttagen.
  - **tentaplugg q273:** "(os ischii)" gav bort "Tuber ischiadicum" — borttagen.
  - **olika_aldrar q37/q62:** svarsglosorna "(balanssinnet)" och "(ålderssynthet)" ekade "balansen"/"åldern" i frågan — borttagna.
  - Lämnade orörda: Hard-frågornas rörelse-parenteser (t.ex. "(med böjt knä)") som är meningsfulla villkor, samt fall där parentes-ordet delas av distraktorerna (ingen läcka).
- Cachebustrar och APP_VERSION bumpade till 0.6.11.
- Highscore-datan i localStorage är orörd.

## 0.6.10
- **Studenters flashcards – andra städpassen** (`data/studenters_flashcards.json`): jakt på kvarvarande bildhänvisningar och obegripliga/hopslagna meningar.
- **Bildhänvisningar borttagna:** `(bild 1)`, `(bild 2/kanten)` m.fl. i ffc_833–836 (erector spinae & rectus abdominis) — ben-/fästesinfo behållen, bildnoteringarna borta. Inga `pil`/`markerad`-hänvisningar kvar.
- **Hopslagna ord (förlorade radbrytningar):** ~190 gränser där ord klistrats ihop (t.ex. "förmakAtrium", "höftledenOs coxae", "Exempel:Margo") separerade med mellanslag; kolon följt direkt av text fick mellanslag. De avsiktliga minnesregel-versalerna i ffc_260 (`OsteoKlaster`/`OsteoBlaster`, "K=Krossar"/"Bygger") bevarades; typo `Osterocyter` → `Osteocyter`.
- **Handfixade trasiga listor:** ffc_197 (processus spinosus) återställd till punktlista; rena gemen-gemen-hopslagningar i ffc_311, ffc_479, ffc_763, ffc_787 isärskrivna.
- Cachebustrar och APP_VERSION bumpade till 0.6.10.
- Highscore-datan i localStorage är orörd.

## 0.6.9
- **Granskning av Muskler-flashcards** (`data/muskler_flashcards.json`, 87 kort, VT26-versionen). Settet var i praktiken felfritt — korrekt och konsekvent fakta (ursprung/fäste/funktion/innervation), enhetlig stil, inga typos eller dekomponerad Unicode. Supraspinatus-ursprunget är korrekt angivet (fossa supraspinata).
- **Enda åtgärd:** de 10 innervationssvaren började med gement `n.` medan settets övriga svar börjar med versal — den inledande nervförkortningen versaliserad (`n. radialis` → `N. radialis`); förekomster mitt i sträng (t.ex. "FCU: n. ulnaris") lämnades gemena enligt korrekt svensk konvention.
- Cachebustrar och APP_VERSION bumpade till 0.6.9.
- Highscore-datan i localStorage är orörd.

## 0.6.8
- **Granskning av Studenters flashcards** (`data/studenters_flashcards.json`, 806 kort). Den informella stilen (minnesregler, emojis, "reversed"-kort) lämnades orörd; fokus på rena fel och obegripliga frågor.
- **Dolda Unicode-gremlins:** 31 kort (mest "gamla tentor") hade dekomponerad Unicode (t.ex. "ö" = o + kombinerande prick, "å" = a + ring) från copy-paste — hela filen NFC-normaliserad. Detta gjorde också att vissa typos kunde rättas (t.ex. "fö rmedlas" → "förmedlas").
- **Bildberoende frågor gjorda självständiga:** "nervflätan **på bilden**…" (ffc_290, "på bilden" borttaget), "Vilken muskel flekterar **den markerade leden**?" → "…DIP-leden (yttersta fingerleden)?" (ffc_307), och "Vilka ben/leder pekar **de röda pilarna** på?" omskriven till en självständig namnge-fråga med komplett svar (ffc_409).
- **Typos:** Claviceln → Clavicula (flera kort), Fascialis → Facialis, körtlen → körteln (Bukspottskörteln/Sköldkörteln), Klohande → Klohand, Carpometakapalled → Carpometakarpalled, Superus/Inferus → Superior/Inferior.
- **Stilnormalisering (på begäran):** förkortningarna för muskler och nerver konsekvent satta till `M. xxx` / `N. xxx` med gement namn (t.ex. "M Deltoideus" → "M. deltoideus", "n Ulnaris" → "N. ulnaris") över hela settet.
- Cachebustrar och APP_VERSION bumpade till 0.6.8.
- Highscore-datan i localStorage är orörd.

## 0.6.7
- **Blodomloppet** (`data/blodomloppet.json`): granskning av hela ämnet (100 sant/falskt-frågor) — i övrigt felfritt (korrekt fakta, rena meningar, redan versaliserade). En enda otydlig fråga skärptes:
  - **q93:** "Blodet passerar lungorna innan kroppen i kretsloppet." (tvetydig — saknade referenspunkt i ett slutet kretslopp) → "Blodet passerar lungorna direkt efter att ha lämnat **vänster kammare**." Svaret är fortsatt Falskt och bildar nu ett entydigt kontrastpar med q94 (höger kammare → Sant).
- Cachebustrar och APP_VERSION bumpade till 0.6.7.
- Highscore-datan i localStorage är orörd.

## 0.6.6
- **Granskning av hela ämnet Neurologi/Nervsystemet** (`data/neurologi.json`, 120 sant/falskt-frågor). Ämnet var mycket välskrivet (fullständiga, korrekta meningar, redan versaliserade) och faktamässigt korrekt. Endast tre språkliga finputsningar:
  - **q39:** särskrivning "Golgi senorgan" → "Golgis senorgan".
  - **q55:** calque "Noder av Ranvier" → "Ranviers noder" (samma form som i tentaplugg-ämnet).
  - **q86:** kongruensfel "Cerebellum är viktig" → "viktigt" (matchar q40).
- Cachebustrar och APP_VERSION bumpade till 0.6.6.
- Highscore-datan i localStorage är orörd.

## 0.6.5
- **Språk- och faktagranskning av hela ämnet Muskler** (`data/muskler.json`, 273 frågor, inkl. 100 Hard-tillämpningsfrågor). Fakta (innervation, ursprung/fäste, funktion) var korrekt — åtgärderna var språkliga.
- **Stavfel:** `vadsmuskel` → vadmuskeln; `Att rät ut` → Att räta ut (q157).
- **Nervförkortning:** `innerveras av n ulnaris/medianus/radialis` → `N. ulnaris/medianus/radialis` (q85–q99).
- **Versalisering:** svarsalternativen i namnfrågorna (q1–q14) och i klassificeringsfrågorna (extrinsic/intrinsic) började med liten bokstav — nu versaliserade. Termen intrinsic/extrinsic behållen (samma som det källbaserade tentaplugg-ämnet).
- Cachebustrar och APP_VERSION bumpade till 0.6.5.
- Highscore-datan i localStorage är orörd.

## 0.6.4
- **Granskning av ämnet Tentaplugg** (`data/tentaplugg.json`, 353 kliniska scenariofrågor). Ämnet var genomgående välskrivet (fullständiga meningar, korrekt grammatik, korrekta fakta, redan versaliserat) — endast två rättelser behövdes:
  - **studier_q200:** prompten var självmotsägande ("celler **i CNS** som bildar myelin i det **perifera** nervsystemet") — Schwannceller hör till PNS. "i CNS" borttaget.
  - **studier_q224:** grammatikglapp "öppna ett burklocket" → "öppna locket på en konservburk".
- Cachebustrar och APP_VERSION bumpade till 0.6.4.
- Highscore-datan i localStorage är orörd.

## 0.6.3
- **Språk- och faktagranskning av hela ämnet Riktningar/Terminologi** (`data/riktningar.json`, 543 frågor, inkl. 100 Hard-muskelfrågor). Innehållet (rörelse- och riktningsdefinitioner) var faktamässigt korrekt — problemen var nästan uteslutande språkliga.
- **Systematiska stavfel:** `kroppposition` (trippel-p) → kroppsposition (~15 frågor), `kropplig` → kroppslig (6), `Vriding` → Vridning (7), `Dorsiflexion` → Dorsalflexion.
- **Engelska/inkonsekventa termer → svenska:** `Abduction/Adduction` → Abduktion/Adduktion; `Extern rotation` → Utåtrotation; "Bukläge är supine position" omskrivet; q387–390 hade engelska svar (Supine/Prone/Fowler's/Lithotomy) → svenska lägesnamn (Ryggläge/Bukläge/Fowlerläge/Litotomiläge/Trendelenburg).
- **Omskrivna frågor:** cirkulära/genusfela definitioner av handens/fotens ytor (q412–414), etymologifrågorna för ab-/adduktion (q252–253), samt "RAKT UTÅT"-versaler.
- **Hard-typos:** `löftar`/`lyftar` → lyfts, `rycktas` → rycks, `bromsa` → bromsas, `slappet` → slappt, dubbel-s i Tibial-/Fibularsidan, och en trippelupprepning ("framför sig framför kroppen").
- Alla frågor och svarsalternativ börjar nu med versal.
- Cachebustrar och APP_VERSION bumpade till 0.6.3.
- Highscore-datan i localStorage är orörd.

## 0.6.2
- **Språk- och faktagranskning av hela ämnet Ben/Osteologi** (`data/ben.json`, 445 frågor). Samtliga frågor genomgångna mot både språk och fakta.
- **Faktafel rättade:** "Karpometakarpalleder är kulleder" var markerat Sant → **Falskt** (CMC-leder är sadel-/planleder, inte kulleder); spongiöst ben beskrevs ha "luftfyllda rum" → **märgfyllda hålrum**; "benmassa ökar genom livet" → benmassan **når sitt maximum runt 30 års ålder**.
- **Felaktigt ord genomgående:** *os coccygis* kallades "gödben" (inte ett riktigt svenskt anatomiord) → **svansbenet** i samtliga ~12 frågor.
- **Logiskt bakvända prompter:** ~25 frågor av typen "os frontale är svenska namnet för …" (kallade det *latinska* namnet "svenska namnet") omskrivna till "Vad är os frontale på svenska?".
- **Språk:** systematiska stavfel (tarbenen→tarsalbenen, bröstkassen→bröstkorgen, mellanhåndsben, Vilkett→Vilket, sittbensknöppen→sittbensknölen, Strumma→Strama, möjliggord, avstavade ben-vävnad/ben-märg), ihopblandad latin/engelska i ligamentfrågorna, samt awkward fraser ("ett ben själv", "längd-tillväxt") städade. Alla frågor och svarsalternativ börjar nu med versal.
- Cachebustrar och APP_VERSION bumpade till 0.6.2.
- Highscore-datan i localStorage är orörd.

## 0.6.1
- **Språk- och faktagranskning av hela ämnet Handen** (`data/handen.json`, 490 → 487 frågor). Samtliga frågor genomgångna mot både språk och fakta.
- **Faktafel rättade:** M. palmaris longus stod felaktigt som *Extensor* (→ Flexor); radiell/ulnar halva av ringfingrets innervation var omkastad mellan n. medianus och n. ulnaris; os pisiforme/os triquetrum var klassade som "oregelbundet ben" (→ kortben, som övriga handrotsben); en distraktor var identisk med det rätta svaret. I nervutbredningsrutan rättades fyra celler från Sant → Falskt (n. medianus saknar funktion för lillfinger och handryggen; n. radialis saknar lillfinger och palmar funktion). Antalet intrinsiska handmuskler rättat 17 → 19.
- **Borttaget:** tre meningslösa dubblettfrågor (pronation kopplat till grepptyp, där greppet var irrelevant); en behölls i omskrivet, vettigt skick.
- **Språk:** stavfel (måntbenet, tumaddduktor, Saddeleled, Gångjärnsledd, intrinsik, gynglymus m.fl.), engelska ord översatta till svenska (medial/lateral half ring finger, dorsal surface, interossei muscles m.fl.), trasig meningsbyggnad, nonsensord (tummetubsen, pekarfingerbenen, "Vid polsen"), särskrivningar, genusfel och telegrafiska meningar omskrivna. Alla frågor och svarsalternativ börjar nu med versal.
- De svåra leder-frågorna (q445–q492) var redan välskrivna och lämnades orörda.
- Cachebustrar och APP_VERSION bumpade till 0.6.1.
- Highscore-datan i localStorage är orörd.

## 0.6.0
- Ny **Case-sektion** (`case.html`): kliniska fallbeskrivningar som använder ämnenas anatomiska begrepp i sitt sammanhang. Varje case är ungefär en halv A4 långt, beskriver en person med en typisk krämpa/skada och använder medicinskt latinska termer med lekmannatermen inom parentes efter. Brödsmula tillbaka till start som vanligt.
- **Framsidan:** ny knapprad längst ned med **Case** + **Ordlista** (Ordlista flyttad dit från sekundärraden, som nu rymmer Info, Topplista, Inställningar). Raden har en **teal-accent** (`--accent` #0d9488) som komplementton till det gröna, via klassen `.accent-row`.
- **Första ämnet: Handen** med 5 faktagranskade case i olika åldrar — karpalkanalsyndrom (52 år), Guyons kanalsyndrom/klohand (38 år), rhizartros (68 år), Dupuytren kontraktur (60 år) och buttoniere deformitet (24 år). Samtliga patologier och anatomiska begrepp är hämtade ur handen-ämnet (+ medicinsk terminologi, muskler, ben). Ord som inte finns i källorna används sparsamt och med kort förklaring i parentes.
- **Filter-dropdown** överst på case-sidan (Alla ämnen / valt ämne), byggs dynamiskt ur casens ämnen så nya ämnen kommer med automatiskt (`js/case.js`).
- **case.html SEO/meta** komplett enligt projektets norm (title, description, keywords, canonical, Open Graph, Twitter Card, theme-color, ikoner, manifest). Strukturerad data berikad med `about` + `mainEntity`-`ItemList` över de fem casen, och varje case har fått ett `id` (`#case-1`…`#case-5`) så list-URL:erna blir riktiga djuplänkar. Brödsmula i JSON-LD som tidigare.
- **Lärande-/studentvinkel** genomgående: titel, description, OG/Twitter och synlig text (tagline + intro) lyfter nu att casen är till för att **plugga och studera** anatomi ("plugga smartare", "tentaplugg", "perfekt repetition"). JSON-LD-typen utökad till `["CollectionPage","LearningResource"]` med `learningResourceType`, `educationalUse`, `audience` (student) och `isAccessibleForFree`. Meta-description trimmad till ~160 tecken.
- **Topplistan** har fått samma brödsmulelänk (`‹ Start` / Topplista) som inställningssidan, överst i sektionen (`#scoresCrumb`) — leder tillbaka till startvyn.
- case.html tillagd i `sitemap.xml`. Cachebustrar och APP_VERSION bumpade till 0.6.0 — även `styles.css`-bustern på `info.html` och `medicinskordlista.html` (låg kvar på 0.4.9 trots att `styles.css` ändrats).
- Highscore-datan i localStorage är orörd.

## 0.5.3
- FIX: flashcards-knappen var alltid skuggad om Flashcards var avbockad i filtret — även på ämnen som faktiskt har flashcards (t.ex. "Tentaplugg (MC+FC)"). Startknapparna speglar nu **enbart det valda ämnet** (quiz om ämnet har MC/TF, flashcards om ämnet har FC). Frågetypsfiltret sköter ämneslistan, inte knapparna.
- Cachebustrar och APP_VERSION bumpade till 0.5.3.

## 0.5.2
- Frågetypsfiltret filtrerar nu **även ämneslistan**: ämnen som saknar någon av de valda typerna döljs ur Ämne-menyn (t.ex. avbockad Flashcards → flashcard-ämnena försvinner). Tidigare skuggades bara startknapparna.
- Ämnena tas bort och återskapas i DOM (i stället för `option hidden`) så att det fungerar även på iOS/WebKit. Valt ämne behålls om det finns kvar, annars väljs första synliga. Håller efter omladdning.
- Cachebustrar och APP_VERSION bumpade till 0.5.2.

## 0.5.1
- Fixa radbrytning i sekundärknapparna på mobil: "Topplista" och "Inställningar" bröt rad eftersom fyra knappar på en rad gav för smala kolumner. Mindre font (0.66rem), padding (8px 3px) och gap (6px) + nowrap för `.secondary-actions .btn` så de ryms på en rad ner till 360px.
- Cachebustrar och APP_VERSION bumpade till 0.5.1.

## 0.5.0
- Ny **Inställningssida** (nås via "Inställningar" på framsidan): Mitt namn, **Frågetyper** (kryssrutor: Flervalsfrågor, Sant eller falskt, Flashcards — alla ikryssade från start), "Öva extra på fel" och "Visa tid" flyttade hit. Brödsmulelänk "‹ Start" överst, Spara + Tillbaka nederst. Allt sparas permanent i localStorage (`hur_settings`) tills man ändrar.
- Framsidan bantad: behåller Ämne, Antal, Svårighet och de **två startknapparna** (Starta quiz + Starta flashcards).
- **Frågetypsfiltret styr starten:** Flervalsfrågor/Sant eller falskt avgör vilka typer quizet drar med (bara Sant eller falskt valt slopar 10%-taket så quizet faktiskt blir sant/falskt; fc-kort utesluts alltid ur quiz, även i "blandade").
- **Startknapparna skuggas dynamiskt** efter både ämnet och filtret: en knapp inaktiveras om ämnet saknar den typen ELLER om typen är avbockad i Inställningar. Ämnets typer läses ur etiketten (t.ex. "Ben (MC+TF)" → bara quiz aktiv, "Muskler (FC)" → bara flashcards, "Tentaplugg (MC+FC)" → båda). Uppdateras direkt vid ämnesbyte och filterändring.
- Checkbox-raderna i Inställningar är omjusterade: rutan ligger i linje med etikettens första rad och hjälptext hamnar på egen rad under (gäller alla nuvarande och framtida checkboxar).
- Cachebustrar och APP_VERSION bumpade till 0.5.0.

## 0.4.53
- Statistik per ämne: vid **lika antal försök** rankar nu ämnet med **högst snitt-%** över (tidigare föll lika antal tillbaka på senast spelade). Mest gjorda ämnet ligger fortsatt överst.
- Cachebustrar och APP_VERSION bumpade till 0.4.53.

## 0.4.52
- "Senaste resultaten" och "Bästa resultat" visar nu **total speltid** (m:ss) per resultat, mellan procent och datum, så man ser hur lång tid man behövde. Äldre resultat utan sparad tid visas som "–".
- Highscore-datan i localStorage är orörd; bara ny kolumn (`sr-time` + `formatDuration`) i renderingen.
- Cachebustrar och APP_VERSION bumpade till 0.4.52.

## 0.4.51
- FIX: statistikinnehållets typsnitt var fortfarande för stort. Roten var en CSS-specificitetsbugg — `.stats-list li` (0,1,1) med `font-size: 0.9rem` slog `.stat-row` (0,1,0), så storleken från 0.4.47 (0.78/0.62rem) fick aldrig effekt. Selektorn är nu `.stats-list .stat-row` (0,2,0) som vinner, så statistiken matchar de andra tabellernas storlek.
- Cachebustrar och APP_VERSION bumpade till 0.4.51.

## 0.4.50
- "Bästa resultat" färgar nu procenttexten grön vid klarat (≥ 75 %) och röd vid ej klarat (< 75 %), samma som "Senaste resultaten". Highscore-datan orörd.
- Cachebustrar och APP_VERSION bumpade till 0.4.50.

## 0.4.49
- "Senaste resultaten": procenttexten färgas nu **grön vid klarat (≥ 75 %) och röd vid ej klarat (< 75 %)**, samma tröskel och röda ton (`--error`) som statistikens svaga ämnen. Endast procentsiffrans färg ändras; övriga kolumner orörda.
- Highscore-datan i localStorage är orörd; bara en CSS-klass på `.sr-pct` i `renderScoreList`.
- Cachebustrar och APP_VERSION bumpade till 0.4.49.

## 0.4.48
- Statistik per ämne visar nu bara ämnesnamnet utan förkortningsparentes (t.ex. "Lårben (femur)" → "Lårben"), precis som topplistorna. Resultat med och utan parentes grupperas på samma namn.
- Highscore-/statistikdatan i localStorage är orörd; bara grupperingsnyckeln i `renderStats`.
- Cachebustrar och APP_VERSION bumpade till 0.4.48.

## 0.4.47
- Statistiktabellens typsnitt matchar nu resten av highscore (`.score-row`): 0.78rem på desktop och 0.62rem på mobil (tidigare 0.8/0.66rem), så texten ryms snyggt på mobilskärm.
- Cachebustrar och APP_VERSION bumpade till 0.4.47.

## 0.4.46
- Ny sektion **"Bästa resultat"** i highscore-vyn, under statistikrutan: topp 10 resultat rankade på procent (högst först), med samma kolumner som "Senaste resultaten".
- Vid lika procent (det avrundade som visas) rankar resultatet med **snabbast speltid** över. Resultat utan sparad tid hamnar sist vid lika procent.
- Listan följer samma frågeantals-filter som "Senaste resultaten" och ritas om dynamiskt vid filterbyte och varje gång highscore-vyn öppnas.
- Highscore-datan i localStorage rörs inte; bara ny rendering (`renderBestList`) + återanvänd `.score-row`-CSS.
- Cachebustrar och APP_VERSION bumpade till 0.4.46.

## 0.4.45
- Statistikrutan ("Statistik per ämne") är ombyggd från en plain textrad till prydliga kolumner: **ämne | antal försök | progress-stapel | snitt-% | tid/fråga**. Stapeln speglar snittprocenten så man ser nivån i ögonvrån; snitt-% färgas i appens gröna ton.
- Layouten matchar topplistans `.score-row`-stil (varannan rad tonad, tabular-nums) och är responsiv för mobil (smalare stapel/kolumner under 640px).
- **Svaga ämnen (under 75 % snitt) markeras rött** (stapel + procentsiffra) i samma röda ton som fel svar (`--error`), som en varningssignal om vad som behöver pluggas mer. 75 % och uppåt visas grönt.
- All statistikdata och highscore-datan i localStorage är orörd — bara renderingen i `renderStats` och tillhörande CSS är ändrad.
- Cachebustern för `styles.css` och `app.js` bumpad till 0.4.45.

## 0.4.44
- Topplistan visar nu de **20 senaste resultaten** (nyast överst) i stället för de 20 högsta poängen. Rubriken heter "Senaste resultaten".
- `saveScore` sorterar på datum (nyast först) innan lagringen kapas till 50 — så att de senaste resultaten alltid behålls, inte de högsta. Tidigare kunde ett nytt lågt resultat kastas bort till förmån för gamla höga.
- Highscore-datan i localStorage rörs inte; bara sorterings-/visningslogiken ändrad.
- Cachebustern för `styles.css` och `app.js` bumpad till 0.4.44.

## 0.4.43
- ROTORSAKEN till att topplistan ibland såg tom ut fast highscoren låg kvar i localStorage: `getScores` läste in datan men gjorde sedan migrerings-/städningsskrivningar (`setItem`/`removeItem` av gamla nyckeln) inuti SAMMA try-block. När en sådan skrivning kastade fel (full localStorage på delad github.io-origin, privat läge) fångades felet av catch som returnerade tomt — trots att datan redan var inläst. Nu parsas datan färdigt före varje skrivning, och migrering/städning sker i ett isolerat try/catch så ett skrivfel aldrig kan kasta bort redan inläst data.
- Samma trasiga mönster fixat i `loadFlags` (fråge-flaggor).
- Verifierat med headless Chrome: med blockerade skrivningar (simulerad full localStorage) och data kvar returnerar `getScores` nu datan och topplistan renderas, i stället för att visa tomt.
- Cachebustern för `styles.css` och `app.js` bumpad till 0.4.43.

## 0.4.42
- Versionsetiketten avslöjar gammal cache: app.js bär en inbakad `APP_VERSION` som jämförs mot färska `VERSION`-filen. Kör webbläsaren cachad gammal kod visas "ny version X finns, ladda om sidan" i stället för en etikett som ljuger om vilken kod som faktiskt körs. Detta är roten till att topplistan ibland såg tom ut: cachad kod *före* säkerhetsnätet (0.4.36) kördes, medan versionsetiketten (no-store) ändå visade senaste numret.
- Bevisat med headless Chrome (CDP) att nuvarande renderingskod alltid visar highscoren när data finns — även med icke-matchande filter (säkerhetsnätet) och data under gamla nyckeln `wiil_highscores` (migration). Highscore-datan rörs aldrig av renderingen.
- Cachebustern för `styles.css` och `app.js` bumpad till 0.4.42.

## 0.4.41
- Prydligare topplista: strukturerade kolumner (rang / namn / ämne / poäng / procent / datum) i stället för em-streck-sträng, ämnesnamnet kortas på förkortningsparentesen ("Handen (MC+TF)" → "Handen", endast här).
- Lärdom av 0.4.34: `#scoreList` behåller `overflow-x: auto` som behållare, så en för bred rad scrollar inuti listan i stället för att tänja ut kortet och skjuta statistiken utanför mobilskärmen. Statistiken (`#statsList`) påverkas inte.
- Endast rendering — highscore-datan (`hur_highscores`) läses, skrivs aldrig.
- Cachebustern för `styles.css` och `app.js` bumpad till 0.4.41.

## 0.4.40
- Tog bort diagnostikraden i topplistan. Highscore-datan (`hur_highscores`) rörs inte — renderingen läser bara, skriver aldrig. Säkerhetsnätet från 0.4.36 (visa alla resultat om filtret ger tomt) är kvar, så listan kan inte se falskt tom ut.
- Orsaken till att listan "försvann när diagnostiken togs bort": telefonen körde då cachad kod *före* 0.4.36, där topplistans filter kunde gömma datan. Datan har aldrig varit borta. Gör en hård omladdning på mobilen (eller vänta tills HTML-cachen släpps) för att hämta 0.4.40.
- Cachebustern för `styles.css` och `app.js` bumpad till 0.4.40.

## 0.4.39
- Återinförde diagnostikraden i topplistan, nu ALLTID synlig, för att hitta varför highscoren växlar mellan full och tom mellan laddningar. Visar om datan finns i lagringen, antal poster och om appen körs i hemskärmsläge (separat lagring på iOS).
- Cachebustern för `styles.css` och `app.js` bumpad till 0.4.39.

## 0.4.38
- Tog bort den tillfälliga diagnostikraden i topplistan (behövdes inte längre — highscore-datan var aldrig borta, det var ett filterfel som fixades i 0.4.36). Säkerhetsnätet som visar alla resultat när filtret ger tomt är kvar.
- Cachebustern för `styles.css` och `app.js` bumpad till 0.4.38.

## 0.4.37
- Tillfällig diagnostikrad i topplistan: när listan ser tom ut visas exakt vilka localStorage-nycklar som finns och hur mycket highscore-data webbläsaren faktiskt har, så vi kan se om datan finns kvar eller är borta.
- Cachebustern för `styles.css` och `app.js` bumpad till 0.4.37.

## 0.4.36
- Buggfix: topplistan kunde visas som "tom" om filtervärdet var tomt/ogiltigt trots att data fanns. Nu behandlas tomt filter som "alla", och finns det resultat men filtret ger tomt visas alla i stället för "tomt". Ingen highscore-data raderas av detta — den låg kvar i localStorage hela tiden.
- Cachebustern för `styles.css` och `app.js` bumpad till 0.4.36.

## 0.4.35
- Återställde topplistan till 0.4.33-läget (backade 0.4.34) eftersom 0.4.34 gjorde att statistiken inte visades på mobil. Ingen highscore-data har påverkats — den ligger kvar i localStorage; det var enbart ett renderingsfel.
- Cachebustern för `styles.css` och `app.js` bumpad till 0.4.35.

## 0.4.33
- Topplistan visas nu med mycket mindre typsnitt så att varje post ryms på en rad (radbryts inte). Listan kan scrollas i sidled om en post är extra lång.
- Cachebustern för `styles.css` och `app.js` bumpad till 0.4.33.

## 0.4.32
- "Öva extra på de jag svarar fel på" garanterar nu återkomst i stället för att bara vikta upp frågan. En felsvarad fråga får en "skuld" (antal garanterade återkomster) som sparas i localStorage och överlever "Spela igen", omladdning och webbläsarstängning.
- En felsvarad fråga tvingas garanterat in i kommande vändor (minst de två nästa 10-frågorsvändorna; i längre vändor är den med i själva vändan). Fortsätter man svara fel byggs skulden på (+2, tak 6) så den återkommer ännu fler gånger; rätt svar nollar skulden.
- Cachebustern för `styles.css` och `app.js` bumpad till 0.4.32.

## 0.4.31
- Bytte checkboxtexten "Timer på/av" till "Visa tid".
- Cachebustern för `styles.css` och `app.js` bumpad till 0.4.31.

## 0.4.30
- Tog bort fältet "Tid i sekunder per fråga" och inställningen att ange tidsgräns. Timern räknar nu i stället upp tiden fram till klicket (ingen tidsgräns, ingen auto-markering som fel, ingen automatisk kortvändning).
- Quiz: tiden fram till klicket visas på den svarsknapp man tryckte på (rätt eller fel).
- Flashcards: tiden fram till att man vänder kortet visas på svarssidan (baksidan).
- "Timer på/av"-checkboxen styr om tiden mäts och visas. Den totala speltiden sparas i statistiken som tidigare.
- Cachebustern för `styles.css` och `app.js` bumpad till 0.4.30.

## 0.4.29
- Tog bort den missvisande parentestexten bakom "Timer på/av"-checkboxen.
- Cachebustern för `styles.css` och `app.js` bumpad till 0.4.29.

## 0.4.28
- Checkboxen heter nu "Timer på/av" och är på som standard. Den enda funktionen är att slå av/på timern; resten av timerfunktionen är oförändrad.
- Återställde sekundfältet till originalet ("Tid i sekunder per fråga (0 = ingen tidspress)", standard 0, min 0) – ändringarna i 0.4.27 (omdöpning, standard 20, min 1) var inte önskade.
- Cachebustern för `styles.css` och `app.js` bumpad till 0.4.28.

## 0.4.27
- Buggfix: timern var dold på mobil (`.timer { display:none }` i media-queryn ≤640px) och visades därför aldrig, varken i quiz eller flashcards. Nu syns nedräkningen igen.
- Ny checkbox "Tidsgräns per fråga" bredvid "Öva extra på de jag svarar fel på". Timern är på endast när rutan är ikryssad; sekundfältet anger längden (standard 20 s).
- Cachebustern för `styles.css` och `app.js` bumpad till 0.4.27.

## 0.4.26
- Buggfix: "Spela igen" på resultatsidan startar nu ett nytt quiz direkt (med samma inställningar) i stället för att gå tillbaka till startsidan.
- Cachebustern för `styles.css` och `app.js` bumpad till 0.4.26.

## 0.4.25
- Dolde ämnena "Moho" och "OTIPM" från ämneslistan. De är ATP-teori (ej anatomi) och ska testas på annat sätt; återinförs senare. Datafiler och kod är kvar (optionerna är utkommenterade på sin plats).
- Cachebustern för `styles.css` och `app.js` bumpad till 0.4.25.

## 0.4.24
- Alla dropdowns (inte bara ämne) använder nu samma mindre textstorlek på smala mobilskärmar (≤480px); de var tidigare onödigt stora.
- Förklaringsraden under ämnesväljaren tillåts nu radbrytas korrekt i stället för att tvingas på en rad med horisontell scroll.
- Cachebustern för `styles.css` och `app.js` bumpad till 0.4.24.

## 0.4.23
- Versionsetiketten ("v0.4.xx") hämtar nu `VERSION` med cache-buster och `no-store`, så den alltid visar senaste versionen utan att fastna på en cachad siffra.
- Ämneslistan behålls som vanlig inbyggd lista som tillåts radbrytas (ingen avkortning eftersträvas via egen dropdown).
- Cachebustern för `styles.css` och `app.js` bumpad till 0.4.23.

## 0.4.22
- Ämnesväljaren krymper textstorleken på smala mobilskärmar (≤480px) så att varje ämne ryms på en rad i listan som poppar upp.
- Cachebustern för `styles.css` (och `app.js`) bumpad till 0.4.22.

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
