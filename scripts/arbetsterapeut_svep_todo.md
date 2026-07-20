# Arbetsterapeut – kvalitetssvep enligt CLAUDE_REGLER.md

**Status:** punkt 1–5, 7a–7c UTFÖRDA 2026-07-20. **Punkt 6 (faktagranskningen) PÅBÖRJAD 2026-07-20, se nedan.**
Skapad 2026-07-19. **Validatorn ger 0 fel och 0 varningar på alla arbetsterapeutfiler**, och
de mekaniska/strukturella defekterna är därmed uttömda. Det som återstår kräver läsning mot
källorna, inte mätning.
**Utgångsläget 24 blockerande fel → 0.** 82 absolut-ords-varningar → 0.
54 kategorifel-frågor omskrivna. Kvarvarande varningar är uteslutande längdbias (punkt 3b).
**Bakgrund:** arbetsterapeut byggdes före de flesta quizreglerna och har aldrig svepts.
Alla åtgärder nedan är godkända av användaren utom där annat anges.

Kör `python3 scripts/validate_quiz.py <filer>` efter varje ändring – validatorn är facit.

## Omfattning

17 filer, 4 288 frågor (2 093 MC, 884 TF, 995 FC, 155 bild).
Utgångsläge: **24 blockerande fel, 111 varningar.**

Filer: `ben` (445), `blodomloppet` (100), `ergonomi` (50), `grepp` (99), `handen` (487),
`handens_ben_bilder` (97), `handens_leder_bilder` (58), `ledtyper` (52), `riktningar` (543),
`muskler` (273), `neurologi` (138), `olika_aldrar` (100), `tentaplugg` (351),
`muskler_flashcards` (87), `moho_flashcards` (52), `otipm_flashcards` (50),
`studenters_flashcards` (806), `medicinsk_terminologi` (500).

## ⛔ Rör INTE (uttryckligt besked 2026-07-19)

- **`data/medicinsk_terminologi.json`** – skyddad källa (§3.2c). Innehåller 233 par med
  identisk prompt + identiskt svar, bara olika distraktorer. Validatorn kallar det fel;
  det är sannolikt avsiktlig variation i slumpdragningen. **Lämnas som det är.**
  (De bidirektionella paren lat→sv / sv→lat är helt korrekta, se §2.11 – aldrig ett fel.)
- **`data/studenters_flashcards.json`** – studenternas eget material. Lämnas orört,
  även stavning/typografi.

---

## 1. ✅ KLAR – raderade `generated`-batchen i `ben.json` (42 frågor)

Alla 42 har `"source": "generated"`: **q326–q367** (löpande, inga hål).

Varför bort:
- 24 av dem är **äkta dubbletter** (samma prompt + samma `correct` som befintliga
  Osteologi-frågor, bara andra distraktorer) → hela blockeringen av commit sitter här.
- Distraktortripletter återanvänds ordagrant: `Femur/Vertebra/Processus` 5×,
  `Tibia/Vertebra/Processus` 5×, `Fibula/Vertebra/Processus` 4×.
- Kategorifel: `q329 "Vad heter kindbenet på latin?" ✔ Os zygomaticum ✘ Femur, Vertebra, Processus`.
- Faktafel: `q331 "Vad heter käkbenet på latin? → Maxilla"` – käkben är tvetydigt,
  mandibula lika giltigt. Försvinner med batchen.

Utfört 2026-07-20: ben.json 445 → 403 frågor, alla 24 blockerande fel borta. Var:
ben.json 445 → 403 frågor, alla med `"source": "Osteologi"`. Id-luckorna q326–q367
lämnas (enligt regeln om att lämna id-luckor). Kontrollera att de 24 dubbletterna är borta.

## 2. ✅ KLAR – TF-balans rättad från 84 % till 53 % "Sant"

**Utgångsläge: 84 % av 946 TF-svar var "Sant".** Grövsta formtellen i hela utbildningen och
något validatorn inte kollar alls. Utfört 2026-07-20: **321 prompts omskrivna till falska
påståenden** enligt §2.12 (byt ut EN sak – fel nerv, fel rad, fel riktning, fel tal), aldrig
genom att sätta in "inte".

Utfall per fil (Sant-andel före → efter):

| Fil | Före | Efter | Flippade |
|---|---|---|---|
| handen | 94 % | 52 % | 126 |
| ben | 92 % | 52 % | 75 |
| muskler | 100 % | 54 % | 27 |
| neurologi | 70 % | 54 % | 20 |
| grepp | 97 % | 46 % | 18 |
| riktningar | 77 % | 54 % | 17 |
| **skuldran** | 97 % | 53 % | 13 |
| blodomloppet | 64 % | 55 % | 9 |
| **Totalt** | **84 %** | **53 %** | **321** |

Inget ämne ligger nu över 60 % Sant; skevaste kvarvarande är `neurologi:nervsystemet_utveckling`
6/10. Metod: `scripts/tf_flip.py`-mönstret (id → ny prompt, sätter `correct` = Falskt och
`distractors` = ["Sant"]), byte-identisk serialisering så diffen bara rör de flippade fälten.

⚠️ **Fälla som slog till:** fyra omskrivna prompts blev **ordagrant identiska med redan
befintliga falska frågor i samma ämne** (`nervsystemet_q27`, `nervsystemet_q45`, `riktningar q136`,
`blodomloppet_q13`) → 4 blockerande dubblettfel. Validatorn fångade dem; alla fyra omformulerades.
Kontrollera alltid mot ämnets *befintliga* Falskt-frågor innan en Sant-fråga vänds.

⚠️ **`data/skuldran.json` saknades i fillistan nedan men är wirad i `js/app.js`.** Den var
därmed osvept även för punkt 3a: 8 absolut-ords-varningar hittades och åtgärdades 2026-07-20
(q39, q52, q57, q60, q64, q65, q82, q85 – distraktorerna omskrivna till konkreta fel med
antals-paritet). Ny post till punkt 3b: `skuldran:skuldra_leder` längdbias 50 %.

Språkfynd rättade i samma pass: "Finger har både…" → "Fingrarna har…", "Chuckgrepp är ett
precision-grepp" → "precisionsgrepp", `Os ischi` → `Os ischii`, "lårbenshuvet" → "lårbenshuvudet",
"Höftbenen är ett parigt ben" → "pariga ben", "Olecranon sitter på armbågsben" → "armbågsbenet",
samt fyra prompts som inledde med "Sant eller falskt: " (redundant – svarsalternativen säger det).

<details><summary>Ursprunglig åtgärdslista (ämnen ≥8 frågor, ≥80 % Sant)</summary>

| Fil:ämne | Sant |
|---|---|
| ben:osteologi_cells | 11/11 (100 %) |
| ben:osteologi_columna | 15/15 (100 %) |
| ben:osteologi_joints | 9/11 (82 %) |
| ben:osteologi_lower | 8/8 (100 %) |
| ben:osteologi_pelvis | 11/11 (100 %) |
| ben:osteologi_placement | 29/34 (85 %) |
| ben:osteologi_summary | 18/18 (100 %) |
| ben:osteologi_upper | 15/15 (100 %) |
| ben:osteologi_verify | 20/20 (100 %) |
| blodomloppet:blodomloppet_blod | 8/10 (80 %) |
| grepp:grepp_typer | 12/12 (100 %) |
| handen:handen_avslutande_fakta | 9/9 (100 %) |
| handen:handen_ben_klassificering | 8/8 (100 %) |
| handen:handen_ben_namn | 8/8 (100 %) |
| handen:handen_extrinsic_klassificering | 14/14 (100 %) |
| handen:handen_fakta | 7/8 (88 %) |
| handen:handen_fakta_enkla | 16/16 (100 %) |
| handen:handen_grepptyper | 13/14 (93 %) |
| handen:handen_innervation | 23/26 (88 %) |
| handen:handen_innervation_detaljerad | 8/9 (89 %) |
| handen:handen_kombi | 10/10 (100 %) |
| handen:handen_muskelakton | 14/14 (100 %) |
| handen:handen_muskler_extrinsic | 14/14 (100 %) |
| handen:handen_muskler_klassificering | 13/13 (100 %) |
| handen:handen_nervfördelning | 17/21 (81 %) |
| handen:handen_patologi | 8/9 (89 %) |
| handen:handen_rörelser_klassificering | 9/9 (100 %) |
| handen:handen_samling_fakta | **38/38 (100 %)** |
| riktningar:positioner | 8/8 (100 %) |
| riktningar:riktningar | 11/11 (100 %) |

</details>

## 3. Mekanisk sanering av distraktorer (samlat svep per fil)

**Bara distraktorer skrivs om. Prompts och rätta svar rörs inte.**
Metod enligt `feedback_sweep_cheapest_method_first`: EN samlad dump-och-patch per fil,
inte ämne för ämne. Låt skript räkna stränglängder – gissa aldrig för hand.

### 3a. ✅ KLAR – absolut-ord enbart i distraktorerna (82 frågor, §2.9)

Ordlistan är exakt: **endast, enbart, alltid, aldrig, inga, ingen, inget, samtliga, uteslutande**.

- `ben` (4): q27, q141, q143, q318
- `ergonomi` (8): pke_q21, pke_q22, pke_q29, pke_q33, pke_q39, pke_q45, pke_q47, pke_q50
- `grepp` (7): q9, q26, q75, q83, q86, q89, q97
- `handen` (5): q450, q463, q466, q488, q490
- `ledtyper` (9): q1, q2, q6, q17, q40, q43, q44, q45, q47
- `riktningar` (1): q419
- `muskler` (7): q193, q202, q203, q225, q240, q246, q247
- `neurologi` (2): nervbanor_q9, nervbanor_q10
- `olika_aldrar` (29): oa_q1, oa_q4, oa_q12, oa_q18, oa_q21, oa_q22, oa_q28, oa_q30, oa_q39,
  oa_q41, oa_q42, oa_q47, oa_q50, oa_q53, oa_q55, oa_q61, oa_q65, oa_q72, oa_q73, oa_q74,
  oa_q75, oa_q76, oa_q78, oa_q80, oa_q81, oa_q83, oa_q88, oa_q96, oa_q98
- `tentaplugg` (10): studier_q64, studier_q76, studier_q172, studier_q191, studier_q203,
  studier_q253, studier_q256, studier_q266, studier_q346, studier_q353

⚠️ Vid rättning: se §2.9 om de tre fällorna – negations-svans, **omvänd längdbias**
(mät om efter förkortning) och återinfört absolut-ord.

### 3b. ✅ KLAR – längdbias under 40 % i samtliga ämnen

Utfört 2026-07-20. **30 ämnen över gränsen → 0.** Skevaste kvarvarande ämne i hela utbildningen
är nu `skuldran:skuldra_funktion` 40 % (2/5). ~200 distraktorer omskrivna med genuint
sceninnehåll – aldrig fyllnadsord, aldrig maskinell trimning av rätt svar.

Verktyg: `scripts/patch_distractors.py` (id → nya distraktorer, valfri språkrättelse av `correct`).
**Skriptet räknar stränglängderna och rapporterar vilka frågor som fortfarande har `correct`
längst** – nödvändigt, se fällan nedan.

⚠️ **Jag underskattade längder systematiskt, precis som §2.13 varnar för.** Första patchen av
`muskler_rörelse_applicering` lämnade 22 av 32 frågor kvar över gränsen; det tog **tre rundor**
att komma i mål. Skriv alltid tillägget rejält längre än du tror och låt skriptet mäta.

⚠️ **Att fixa längdbias skapade en NY tell i fyra frågor.** `muskler` q41–q44 löd
"Gör X flexion eller extension?" med alternativen `Extension` / `Flexion` – en symmetrisk
antingen/eller-fråga (tillåten enligt §2.9), men `Extension` är alltid 2 tecken längre.
När jag förlängde distraktorn till "Flexion i armbågsleden" bröts symmetrin och validatorn
flaggade frågan som **självbesvarande** i stället. Löst genom att skriva om prompten till öppen
form ("Vilken rörelse i armbågsleden utför Triceps brachii?") med tre jämnlånga alternativ.

**Två strukturella fynd:**

1. **62 TF-frågor var märkta `"type": "mc"`** med bara två alternativ (Sant/Falskt) – 59 i
   `tentaplugg.json`, 3 i `handen.json`. De faller ur **både** `tfPool` och `mcPool`
   (`js/app.js` rad 499–500, mcPool kräver 3–5 alternativ) och plockas bara upp av
   nödfallssamplingen på rad 505 → de drogs i praktiken nästan aldrig, och kringgick TF-taket
   på 10 %. Omtypade till `tf`. Detta löste samtidigt hela längdbiasen i `studier_åldrande`
   (den var "Falskt"(6) mot "Sant"(4), inte en äkta tell). **Samma defekt finns i
   `medicinsk_sekreterare.json` (3 frågor) – annan utbildning, orörd.**
2. **`muskler_rörelse_applicering` 94 %** var som väntat strukturellt: 100 frågor med ETT
   alternativ där `correct` är en utförlig vardagsscen. Löst som planen föreskrev – distraktorerna
   omskrivna till lika utförliga scener. Nu 31 %. Samma mall fanns i `riktningar:rörelser`
   (100 av 179 frågor) och åtgärdades där också: 47 % → 33 %.

Språk-/faktafynd rättade i samma pass: `Vertebrorna` → `Kotorna`, `Mot centerlinjen` →
`Mot kroppens mittlinje`, `Arbetstagares` → `Arbetstagarens`, "ett kraftfullt sparkrörelse" →
"en kraftfull sparkrörelse", samt distraktorn `Castin och karotin` / `Fibrin och elastan` i
`studier_q319` (**elastan är ett textilmaterial**, "Castin" existerar inte) → `Kasein och karotin`
/ `Fibrin och keratin`.

<details><summary>Ursprunglig tabell (mätt 2026-07-20 före åtgärd)</summary>

| % | Ämne | (längst/antal) |
|---|---|---|
| **94** | muskler:muskler_rörelse_applicering | 94/100 |
| **91** | handen:handen_muskler_extrinsic | 10/11 |
| **89** | ben:osteologi_cells | 8/9 |
| **80** | handen:handen_ben_metakarpaler | 4/5 |
| 67 | tentaplugg:studier_ergonomi | 6/9 |
| 67 | ben:osteologi_orientation | 4/6 |
| 64 | ben:osteologi_joints | 7/11 |
| 60 | handen:handen_muskler_funktioner | 3/5 |
| 60 | handen:handen_grepptyper | 3/5 |
| 60 | ben:osteologi_ligaments | 3/5 |
| 55 | ben:osteologi_types | 6/11 |
| 54 | ledtyper:ledtyper_rorelse | 7/13 |
| 53 | tentaplugg:studier_fysiologi | 29/55 |
| 52 | ergonomi:ergonomi | 26/50 |
| 52 | ben:osteologi_upper | 14/27 |
| 47 | riktningar:rörelser | 85/179 |
| 50 | muskler:muskler_flexion_vs_extension | 10/20 |
| 50 | ledtyper:ledtyper_synovial | 3/6 |
| 50 | handen:handen_ligament | 2/4 |
| 50 | ben:osteologi_summary | 3/6 |
| 50 | ben:osteologi_pelvis | 4/8 |
| 45 | ben:osteologi_placement | 20/44 |
| 44 | olika_aldrar:olika_aldrar | 44/100 |
| 43 | tentaplugg:studier_åldrande | 9/21 |
| 43 | handen:handen_muskler_region | 3/7 |
| 43 | handen:handen_intrinsic_func | 3/7 |
| 42 | neurologi:nervsystemet_banor | 5/12 |
| 41 | tentaplugg:studier_hand | 9/22 |
| 41 | ben:osteologi_kranium | 12/29 |

Förändringar mot 2026-07-19 (effekt av punkt 1/3a): `olika_aldrar` 56 → 44,
`ergonomi` 58 → 52, `ben:osteologi_ligaments` 80 → 60, `ben:osteologi_upper` 46 → 52
(batchen som togs bort bar korta distraktorer). **Nytt ämne över gränsen:**
`ben:osteologi_kranium` 41 % – fanns inte i listan 2026-07-19 eftersom `generated`-batchen
späddes ut den. `tentaplugg:studier_hand` 45 → 41. Efter punkt 3c: `riktningar:rörelser` 51 → 47
(tabellraden nedan är uppdaterad), `ben:osteologi_types`/`osteologi_placement` oförändrade –
kategorifelen låg i ämnen som ändå inte drev längdbiasen.

⚠️ **`muskler:muskler_rörelse_applicering` 94 % är strukturellt, inte kosmetiskt.** De 100
frågorna har bara ETT alternativ var (`correct` = en lång vardagsscen, distraktorn en kortare).
Det går inte att fixa genom att fila på längder – distraktorerna måste skrivas som lika
utförliga vardagsscener, eller frågorna byggas om. Störst enskild post i hela punkt 3b.

</details>

### 3c. ✅ KLAR – kategorifel-distraktorer (54 frågor, inte 35)

Frågan gällde vad en rörelse/term betyder, men distraktorerna var kategorietiketter i stället
för betydelser → strykbara utan sakkunskap (§2.2). Utfört 2026-07-20.

**Planen underskattade omfattningen.** Listan byggdes på exakta strängmatchningar och missade
tre grupper. Verkligt utfall:

| Grupp | Antal | Frågor |
|---|---|---|
| Set `En benstruktur / En muskelgrupp / En nervväg` | 20 | q180–q184, q187–q199, q202, q203 |
| Set `En anatomisk riktning / En kroppsposition / Ett rörelseplans namn` | 15 | q61–q75 |
| **MISSAD:** samma etiketter med ortssuffix (`En muskelgrupp **i underarmen**`) | 2 | q185, q186 |
| **MISSAD:** tredje etikettvarianten `En kroppslig position / En anatomisk plats / En motsatt rörelse` | 6 | q76–q81 |
| **MISSAD:** vaga kategorisvar i `ben.json` (`Ett ben`, `Ett eget ben`, `Ett ben i bäckenet`) | 11 | q48, q49, q60, q75, q81, q83, q92, q94, q96, q118, q123 |

Åtgärd enligt §2.9-mönstret: distraktorerna är nu **de andra termernas riktiga definitioner**,
så att varje alternativ är ett sant påstående om *någon* term och det enda sättet att välja rätt
är att veta vilken. Exempel:

    Vad betyder 'Superficialis'?
      ✔ Nära ytan     ✘ Långt från ytan | Nära mittlinjen | Nära bålen

Sidofynd rättade i samma pass: `riktningar:q202` frågade efter engelska *'Superficial'* – TA-formen
är **superficialis** (§1.1). `ben:q75` frågade efter *'os ischi'* – rätt form är **os ischii**.

⚠️ **Lärdom för resten av svepet:** en åtgärdslista byggd på exakta strängmatchningar missar
varianter av samma defekt. Sök på *mönstret* (`^(En|Ett) <kategoriord>`), inte på strängen.
Efterkontrollen `PAT.match` över alla 14 filerna ger nu 0 träffar.

### 3d. ✅ KLAR – självutpekande distraktor (1 st, §2.2)

`muskler:q225` – distraktorn `"Scapula enbart, utan fäste på humerus…"` skyltade med att
den var fel. Utfört 2026-07-20: alla tre distraktorerna omskrivna till trovärdiga felaktiga
ursprung (`Scapula och clavicula` / `Humerus och ulna` / `Ulna och radius`). Samma mönster
fanns i `muskler:q240` och rättades där också.

## 4. ✅ KLAR – stavfel: mellanfottsben → mellanfotsben (9 frågor i `ben.json`)

q340, q342, q359, q364, q365, **q375, q376, q377, q398**

q340/q342/q359/q364/q365 försvann med generated-batchen; q375/q376/q377/q398 rättades för hand
till *mellanfotsben*. Verifierat: 0 träffar på `mellanfott` i `data/ben.json`.

## 5. ✅ KLAR – städning / verktyg

- **Dött `difficulty`-fält – BESLUT 2026-07-20: lämnas kvar.** Kontrollerat att inget i `js/`
  läser det (enda förekomsten är placeholder-generatorn `js/app.js` rad 179, som *skriver*
  fältet, plus kommentaren rad 112–114 som redan förklarar att det är dött). Men fältet visade
  sig finnas i **17 450 frågor i 37 datafiler** – hela projektet, inte bara arbetsterapeutens
  4 288. Att stryka det ger en 17 450-raders diff genom alla elva utbildningar för noll
  funktionell vinst, och grumlar git-historiken. **Användarens beslut: låt ligga.**
- ✅ **Validatorns SKIP-lista rensad 2026-07-20.** `handens_ben_bilder.json` och
  `handens_leder_bilder.json` ligger inte längre i SKIP – de 155 bildfrågorna valideras nu
  varje körning och ger 0 fel, vilket bekräftar den manuella kontrollen från 2026-07-19.
- ✅ **Ny validatorregel** blev inte TF-balans utan **TF-fråga felmärkt som `mc`** (§2.4),
  som är entydigt maskinellt avgörbar. TF-*balansen* lämnas medvetet manuell: gränsen beror
  på ämnets storlek och en fast regel hade gett falska utslag på små ämnen. Det står nu i
  validatorns docstring vilka tre kontroller som kräver handpåläggning.
- ✅ **`FILLER`-regexen utökad 2026-07-20** med "Inget/Ingen av ovanstående" och
  "Inget/Ingen av alternativen". Kodifierat i CLAUDE_REGLER §6.3.

## 6. 🔄 PÅGÅR – faktagranskning ämne för ämne (0.9.183)

**Granskade och klara (12 filer, ~2 500 frågor):** blodomloppet, ergonomi, grepp, ledtyper,
neurologi, olika_aldrar, skuldran, muskler, tentaplugg, handen, ben — samt `riktningar`
t.o.m. q405 (av 543). Sju av tolv filer var faktamässigt rena.

**Kvar att granska:** slutet av `riktningar.json` (q406–), `muskler_flashcards.json` (87),
`moho_flashcards.json` (52), `otipm_flashcards.json` (50), `handens_ben_bilder.json` (97),
`handens_leder_bilder.json` (58).

**Fynd och åtgärder i 0.9.183** (fullständig lista i CHANGELOG):
- `muskler:q22` distraktor `Latissimus dorsi` var sann (filen säger själv i q280 att den
  extenderar) → två rätta svar. Bytt mot `Biceps brachii`.
- `handen:q223` "FDS går genom vinculum" = Sant — falskt påstående. Omskriven.
- `handen:q233` "Supination sker vid armbågen" = Falskt — motsäger `tentaplugg` q58/q209.
  Omskriven.
- `handen:q68–q71` språkparitet (svenskt rätt svar bland latinska distraktorer).
- `handen:q72–q80` distraktorerna `Tarsus`/`Carpale` är inga ben. Utbytta.
- `handen:q61`/`q72` "båtbenet" är tvetydigt (scaphoideum vs naviculare) → preciserat
  till "båtbenet i handloven".
- `ben:q322` distraktorn `Periosteum` är ingen benstruktur. `ben:q70` `Os ischi` → `os ischii`.
- `ben:q275`/`q276` och `olika_aldrar:oa_q57` var självbesvarande. Omskrivna.
- `tentaplugg` q152 (självutpekande), q204 (`Exostoser` ≈ osteofyt), q193 (prompt/svar-
  missmatch + "inneslutas"), q302/q273 (`Art. cruralis`, `Fossa tabatiere` finns inte).
- `grepp:q9` distraktorn om sträckt handled är sann för kraftgrepp. Omskriven.
- Språk: *käkningen* → tuggfunktionen; "Vilken är det största benet" → "Vilket".

### ⚠️ ÖPPEN FRÅGA TILL ANVÄNDAREN – påhittade svenska muskelnamn

`handen.json` q82, q84–q91 och q358–q363 frågar efter "det svenska namnet" på handmuskler
som saknar etablerat svenskt namn: **Kort tumabduktor, Kort tumflexor, Tumadduktor,
Lillfingerabduktor, Kort lillfingerflexor, Oppositionsmuskeln för tummen/lillfingret,
Palmära/Dorsala interossei.**

`CLAUDE_REGLER.md` §1.2 pekar uttryckligen ut **"kort tumflexor"** som exempel på ett
förbjudet hittepånamn, och §2.5 säger att en namnfråga där inget eget svenskt namn finns
ska **RADERAS**. Det handlar om ~15 frågor. Enligt §5.3 raderar jag inte på eget bevåg –
**beslut behövs**: stryka dem, eller behålla dem för att kursunderlaget använder formerna
(§3.2b, kursunderlaget vinner)?

## 6b. Ursprunglig formulering

Punkt 1–5 är mekaniska/strukturella fynd. **En egentlig faktagranskning ämne för ämne
mot källorna är inte gjord** – motsvarande den som gjordes för de 11 andra utbildningarna
(se minnet `project_factcheck_sweep.md`). Vanligaste defekten där var *distraktorer som
råkar vara sanna*, vilket inget skript hittar. Stickprov i `ledtyper.json` (52 frågor,
läst i sin helhet) visade inga faktafel – bara mekaniska tells.

Gör den granskningen efter punkt 1–3, annars faktagranskas text som ändå skrivs om.

## 7. Fynd 2026-07-20 som INTE stod i den ursprungliga planen

Tre feltyper dök upp under arbetet med punkt 1/3a/4. Alla tre är nu kodifierade i
`CLAUDE_REGLER.md` (v1.6) enligt §5.6.

### 7a. ✅ ÅTGÄRDAT – påhittat `os`-prefix på latinska bennamn (§1.1)

`os femur`, `Os mandibula`, `Os maxilla`, `Os tibia`, `os patella`, `Os ulna` – termer som
inte existerar i Terminologia Anatomica. Rättade: `ben.json` q3, q5, q6, q7, q11, q13, q377
och `tentaplugg.json` studier_q59, q60, q97, q292, q293.

**Dubbel skada:** i `ben.json` q5 stod `correct: "Maxilla"` naket bland os-prefixade
distraktorer → formen pekade ut svaret (språkparitet, §2.9). Rättningen löste båda.

Sveptes över alla 14 arbetsterapeut-filer med grep-testet i §1.1 – 0 träffar kvar.

### 7b. ✅ KLAR – kvasi-absoluta ord "bara" / "alla" (§2.9)

Utfört 2026-07-20. **42 distraktorer som INLEDDES med Bara/Alla/Enbart → 0.** Därutöver
granskades de 17 träffar där ordet står inuti meningen; **11 lämnades orörda som legitima
sakpåståenden**, 6 skrevs om. Det är precis den avvägning som gör att mönstret inte får
maskinregleras – se skiljelinjen nedan.

**Lämnat (ordet ingår i ett sakpåstående):** `ledtyper` "Rörelse åt alla håll" (en korrekt
beskrivning av en kulled, alltså ett trovärdigt fel om en gångjärnsled), `muskler` "så högt upp
mot näsan som det bara går" (idiom), "böja alla tårna nedåt" (beskriver en scen),
`tentaplugg:studier_q223` "kan flektera i alla fingrarna utom tummen" (konkret funktionspåstående).

**Omskrivet (absolut avgränsning som går att stryka på formen):** `oa_q53` "Styrkan ökar bara hos
den som tränat i unga år" → "…främst hos…", `oa_q79` "Träning är farligt för alla äldre" →
"Träning medför större risker än nytta i hög ålder", `oa_q93` "Snabba fibrer används bara under
sömn", `studier_q64` "…bara förekommer hos människor, inte hos andra organismer" (dessutom en
negations-svans), `ledtyper:q14` "Den kan bara böjas", `pke_q42` "Alla människor har exakt samma
kroppsmått".

**Skiljelinjen:** är påståendet en *avgränsning* ("bara X", "alla Y gör Z") är det strykbart utan
sakkunskap → skriv om till ett hedgat men fortfarande felaktigt påstående ("främst", "i stort
sett", "liten betydelse"). Beskriver ordet däremot något i sak → lämna.

Flera av dessa bar samtidigt **antals-asymmetri** (§2.9): `ben:q68` frågade vilka organ bröstkorgen
skyddar, rätt svar listade två och distraktorerna "Bara hjärta" / "Bara lungor" listade ett – två
tells i samma alternativ. Samtliga sådana är nu jämnlånga och listar lika många poster.

<details><summary>Ursprunglig beskrivning</summary>

Samma tell som absolut-orden, men **medvetet utanför validatorn**: mätt projektbrett
2026-07-20 träffar `\b(bara|alla)\b` i **544 frågors distraktorer**, och de flesta är
legitima sakpåståenden ("Nej, eftersom bara fri substans kan transporteras"). En maskinregel
hade dränkt de äkta fynden. **Kontrolleras för hand.**

De som låg i frågor jag ändå rörde under 3a och 3b är fixade. **Mätt efter 3b: 42 distraktorer
i arbetsterapeutens 12 filer INLEDS fortfarande med `Bara`/`Alla`/`Enbart`** – merparten i
`ben.json` (mönstret `Bara <benet> ensamt`, q145–q150 m.fl.). Testa med:

    grep -n '"Bara \|"Alla ' data/*.json

Detta är det billigaste kvarvarande delsteget: mönstret är mekaniskt igenkännbart, men varje
träff måste läsas med gissa-testet (§2.12) innan den skrivs om – en del är legitima sakpåståenden.

</details>

### 7c. ✅ ÅTGÄRDAT – filler-variant som validatorn missade (§6.3)

`tentaplugg:studier_q253` hade distraktorn "Inget av ovanstående är relevant". Ersatt med ett
konkret felaktigt påstående. `FILLER`-regexen täcker nu varianten; 0 träffar kvar projektbrett.

## Version & commit

Enligt `feedback_batch_versions` / `feedback_versioning`: samla ~5 delsteg, bumpa sedan
VERSION + index.html + CHANGELOG i EN commit. Rapportera i versionsnummer, aldrig hashar.
Commit/push endast på uttrycklig begäran.
