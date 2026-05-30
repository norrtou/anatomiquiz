# CHANGELOG - Anatomiquiz

## 0.3.41
- Brödsmula ordlistesidan (mobil): täcker nu :visited, :hover, :focus, :active — index.html är alltid besökt så länken visades lila. Lade även till -webkit-tap-highlight-color: transparent.

## 0.3.40
- Brödsmula på ordlistesidan: a.breadcrumb-link (specificitet 0,1,1) slår nu webbläsarens a:-webkit-any-link — grön färg och inget understreck, identiskt med info-sidan.

## 0.3.39
- Ordlista-knappen: ändrad från <a> till <button onclick> — eliminerar understrecket permanent. CSS-fixar för a.btn borttagna.

## 0.3.38
- Ordlistesidan: brödsmulorna flyttade in i kortet (vit bakgrund) — samma placering och design som på info-sidan.

## 0.3.37
- Brödsmuleknappar: appearance: none + -webkit-appearance: none tillagt så att button.breadcrumb-link ser identisk ut med a.breadcrumb-link på iOS/Safari.

## 0.3.36
- Ordlista-knappen: text-decoration: none !important för att säkert slå mobilwebbläsares standardstilar.

## 0.3.35
- Info-sidan: tillbakaknappen överst ersatt med brödsmula (← Anatomiquiz / Info).
- Ordlistesidan: tillbakaknappen borttagen; brödsmule-nav (som redan fanns) räcker.
- Brödsmule-CSS flyttad till styles.css (delas nu av båda sidorna); glossary.css rensat från duplikat.

## 0.3.34
- Ordlistesidan: tillbakaknapp tillagd högst upp i kortet.

## 0.3.33
- Ordlista-knappen (mobil): understreck borttaget på alla tillstånd (a.btn, :hover, :focus, :visited) — täcker alla webbläsares standardstilar.

## 0.3.32
- Info-sidan: tillbakaknapp tillagd högst upp, precis som den befintliga längst ned.

## 0.3.31
- Ordlista-knappen: understreck borttaget (text-decoration: none tillagt i .btn).

## 0.3.30
- index.html: komplett SEO-uppdatering — beskrivande title, meta description/keywords/author/robots, Open Graph (6 taggar), Twitter Card, schema.org WebApplication + LearningResource + EducationalAudience (JSON-LD).
- Webbläsartema: theme-color (#10b981) och color-scheme deklarerade.
- Preload på kritisk CSS, defer på app.js-scriptet.
- Indentering och HTML-kommentarer rättade i alla sektioner; &amp;-escaping i title och select-option.

## 0.3.29
- Ordlistan separerad till egen sida: medicinskordlista.html med full SEO (title, description, Open Graph, Twitter Card, schema.org DefinedTermSet + BreadcrumbList), brödsmulor och termräknare.
- Ordlistedata flyttad från hårdkodat JS-array i app.js till data/ordlista.json (195 termer).
- Ordliste-logik extraherad till js/glossary.js med egna stilar i css/glossary.css.
- Ordlista-knappen på startsidan är nu en direktlänk till medicinskordlista.html.

## 0.3.28
- Ordlistan: etymologinot tillagd på alla ~185 poster med latinskt/grekiskt ursprungsord och bokstavlig betydelse (t.ex. "acetabulum = ättikskål", "musculus = liten mus", "phalanx = stridsformation").

## 0.3.27
- Info-, Ordlista- och Topplista-knapparna täcker nu hela radens bredd på mobil, liksom Starta quiz-knappen ovan.

## 0.3.26
- Ordlistan berikad: alla ~185 poster kompletterade med svenska synonymer (sv:), engelska termer (eng:), lekmannauttryck och alternativa stavningar — t.ex. falanger/falang för phalanges, diafragma för diaphragma, likvor för liquor cerebrospinalis, RBC/WBC, Hb m.fl. Sökfunktionen täcker hela definitionen.

## 0.3.25
- Ordlistan utökad med 24 nya termer: kroppspositioner (anatomisk position, ryggläge, bukläge, sidoläge, Fowlerläge, Trendelenburgläge, omvänt Trendelenburgläge, litotomiläge, simsläge), rörelsetermer (inåtrotation, utåtrotation, deviation, anteversion, retroversion, protrusion, retrusion), riktningstermer (central, perifer, intermediär, internus, externus, obliqt plan) och ytor (parietal, visceral).

## 0.3.24
- Faktakontroll ordlistan: stavfelen "beny ta" → "benyta" (Fossa) och "ledbroskyt" → "ledbrosket" (Synovialis) rättade.
- Ordlistan: textstorlek höjd till 0.95rem, samma som info-sidan.

## 0.3.23
- Ny sida: Ordlista med 140 latinska och medicinska termer som används i quizet, sorterade alfabetiskt med korta förklaringar. Sökfunktion filtrerar direkt på term och förklaring. Nås via ny knapp på startsidan. Knapplayouten omstrukturerades: "Starta quiz" är nu en tydlig primärknapp ovanför Info, Ordlista och Topplista.

## 0.3.22
- Faktakontroll av riktningar.json: 5 rättningar — q224 (rörelse fram/bak = sagittalplan, inte frontalplan), q225 (rörelse vänster/höger = frontalplan, inte sagittalplan), q399 (sänka armen = adduktion, inte depression), q446 (Superior utbytt mot Kaudal som distraktor; Superior är synonym till Kranial och kan inte vara fel svar), q214 (stavfel "Döja höftleden" → "Föra benet ut åt sidan från höften").

## 0.3.21
- Döpte om "Blandade frågor" till "Slumpade frågor" och flyttade det sist i ämnesmenyn. Slumpade frågor hämtar nu automatiskt från alla aktiva ämnen inklusive Neurologi och Blodomloppet.

## 0.3.20
- Versionsnummer i headern laddas nu dynamiskt från VERSION-filen istället för att vara hårdkodat i HTML.

## 0.3.19
- Lade till Blodomloppet som aktivt ämne: 100 sant/falskt-frågor (Normal svårighet) i data/blodomloppet.json. Täcker systemkretsloppet, lungkretsloppet, hjärtanatomi, hjärtats retledningssystem, kärltyper, blodkomponenter och fysiologi. Aktiverade blodomloppet-alternativet i dropdown-menyn och kopplade ämnet i app.js. Språkkorrigering: "bakflöde" → "backflöde" (q88).

## 0.3.18
- Lade till Neurologi som aktivt ämne: 120 sant/falskt-frågor (Normal svårighet) i data/neurologi.json. Täcker CNS/PNS-struktur, neuron, myelin, synapser, signalsubstanser, aktionspotential, reflexer, hjärnstrukturer, ledning, reception, regeneration, neuroplasticitet, utveckling och åldrande. Aktiverade neurologi-alternativet i dropdown-menyn och kopplade ämnet i app.js.

## 0.3.17
- Fixade Info-sida: changelog visar nu alla versioner med fullständigt innehåll. Bytte från ul/li till div-baserad rendering för att undvika overflow:hidden-klippning; tog bort max-height-begränsning så hela loggen är synlig och sidan scrollas naturligt.

## 0.3.16
- Lade till Info-sida med appbeskrivning, länk till Norrtou Creations på GitHub och dynamisk ändringslogg hämtad från CHANGELOG.md. Info-knapp tillagd på framsidan till vänster om Topplista.

## 0.3.15
- Faktakontroll av alla Normal-frågor i muskler.json: 11 rättningar — fabricerade svenska muskelnamn borttagna ur distraktorer (q1, q2, q3, q4, q5, q6, q8, q10, q13, q14) och ersatta med etablerade svenska anatomiska termer (kappmuskeln, breda ryggmuskeln, deltamuskeln m.fl.); q238 distraktorn "Os coxae" ersatt med "Sacrum" då tuber ischiadicum tekniskt är en del av os coxae. Alla korrekta svar och T/F-påståenden bekräftade faktamässigt korrekta.

## 0.3.14
- Kompletterade muskler.json med 73 nya frågor (Normal svårighet) baserade på kurslistan: 29 ursprung-frågor (MC), 29 fäste-frågor (MC), 5 klassificerings-frågor (FDP/FPL/EPB/EPL/APL som extrinsic) och 10 funktions-frågor (T/F) för tidigare ej täckta funktioner (höftextension Hamstrings, höftflexion Quadriceps, knäflexion Gastrocnemius, supination Tibialis anterior m.fl.). Totalt 273 frågor i muskler.json.

## 0.3.13
- Tentaplugg är nu förstaval i ämnesmenyn.

## 0.3.12
- Kvalitetsgranskning riktningar.json: 9 rättningar — faktafel ('Hörseln'→'Örat', q104), stavfel ('drejer'→'vrider', q113), correct i distractors (q169), självrefererande distraktorer (q150/q151), fråga med sin egna term som distraktor (q30), inkonsekvent stavning Dorsiflexion→Dorsalflexion (q94/q116/q120).

## 0.3.11
- Kvalitetsgranskning muskler.json: 8 rättningar — duplikat ID (q113 → q113b), inkompletta meningar (q17, q60), grammatikfel ('opponerar tumme', 'för och', 'vrid'→'vrida', 'sätts sig').

## 0.3.10
- Ta bort meningen om Handen och svårighet från ingresstexten på framsidan.

## 0.3.9
- Kvalitetsgranskning ben.json: 56 rättningar — stavfel i 11 prompts (pannbenetet→pannbenet m.fl.), faktafel (stapesius→stapes, Os coccyx→Os coccygis), grammatik (en revben→ett revben), fixade sifferfrågor med bennamn-distraktorer (q38/39/40/64/114/245), duplikat-distraktor (q233), semantisk dubblettdistraktor (q170), korrigerade topics för 28 frågor felaktigt märkta osteologi_kranium.
- Fixade bugg i tentaplugg.json: difficulty-fältet saknades vilket gjorde att ämnet inte gick att starta.

## 0.3.8
- Ändrade menytext från "Studier (tentor)" till "Tentaplugg".

## 0.3.7
- Döpte om studier.json till tentaplugg.json och uppdaterade alla referenser i app.js och index.html.

## 0.3.6
- Kvalitetsgranskning av studier.json: fixade stavfel (överarmsbenet, Kontorslandskapets), korrigerade grammatik, samt tog bort parentesformat som avslöjade korrekta svar (46 frågor åtgärdade). Bekräftade 59 sant/falskt-frågor i ämnet.

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
