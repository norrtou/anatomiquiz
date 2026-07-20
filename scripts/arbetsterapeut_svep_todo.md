# Arbetsterapeut – kvalitetssvep enligt CLAUDE_REGLER.md

**Status:** punkt 1, 3a, 3c, 3d, 4 UTFÖRDA 2026-07-20. Kvar: 2 (TF-balans), 3b (längdbias),
5, 6, 7b. Skapad 2026-07-19.
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

## 2. TF-balans – rätta till ~60/40 per ämne

**85 % av alla 884 TF-svar är "Sant"** (700 Sant / 125 Falskt). Grövsta formtellen i hela
utbildningen och validatorn kollar den inte alls. Per fil: grepp 97 %, handen 94 %,
ben 92 %, riktningar 77 %, neurologi 70 %, blodomloppet 64 %.

Mål: inget ämne över ~60 % Sant. Innebär att ~250–300 prompts skrivs om till **falska**
påståenden (byt ut en sak mot fel enligt §2.12 – fel nerv, fel rad, fel riktning – inte
bara sätta "inte" i meningen).

Ämnen att åtgärda (≥8 frågor, ≥80 % Sant):

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

### 3b. Längdbias > 40 % (29 ämnen) – OGJORD

Siffrorna nedan är **ommätta 2026-07-20**, efter punkt 1/3a/4. Mät om per ämne efter varje patch.
Både för lång OCH för kort `correct` räknas som tell.

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

## 5. Städning / verktyg (lägre prioritet)

- **Dött `difficulty`-fält** på alla 4 288 frågor (`"difficulty": "Normal"`).
  Svårighetsgrad togs bort ur appen i 0.9.165. Kan strippas i samma patch-svep.
  Kontrollera först att inget i `js/` läser fältet.
- **Validatorns SKIP-lista** (`scripts/validate_quiz.py` rad 21–22) utesluter
  `handens_ben_bilder.json` och `handens_leder_bilder.json` → 155 bildfrågor kontrolleras
  aldrig. Manuellt kontrollerade 2026-07-19: alla har tom prompt + `image`, inga fel.
  Överväg att ta bort dem ur SKIP nu när de följer §2.10.
- **Ny validatorregel: TF-balans.** Varna när ett ämne med ≥8 TF-frågor har ≥70 % (eller
  ≤30 %) "Sant". Hade fångat punkt 2 automatiskt. Kodifiera samtidigt i CLAUDE_REGLER §2.4.
- ✅ **`FILLER`-regexen utökad 2026-07-20** med "Inget/Ingen av ovanstående" och
  "Inget/Ingen av alternativen". Kodifierat i CLAUDE_REGLER §6.3.

## 6. Kvar att göra som INTE är utrett

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

### 7b. ⚠️ KVAR – kvasi-absoluta ord "bara" / "alla" (§2.9)

Samma tell som absolut-orden, men **medvetet utanför validatorn**: mätt projektbrett
2026-07-20 träffar `\b(bara|alla)\b` i **544 frågors distraktorer**, och de flesta är
legitima sakpåståenden ("Nej, eftersom bara fri substans kan transporteras"). En maskinregel
hade dränkt de äkta fynden. **Kontrolleras för hand.**

De som låg i frågor jag ändå rörde under 3a är fixade (`ben` q27/q141/q143/q318, `grepp` q9,
`olika_aldrar` oa_q18/oa_q75/oa_q83). **Resten av arbetsterapeut-filerna är osvepta för detta.**
Görs lämpligen i samma pass som punkt 3b, eftersom båda kräver läsning av alternativen.

### 7c. ✅ ÅTGÄRDAT – filler-variant som validatorn missade (§6.3)

`tentaplugg:studier_q253` hade distraktorn "Inget av ovanstående är relevant". Ersatt med ett
konkret felaktigt påstående. `FILLER`-regexen täcker nu varianten; 0 träffar kvar projektbrett.

## Version & commit

Enligt `feedback_batch_versions` / `feedback_versioning`: samla ~5 delsteg, bumpa sedan
VERSION + index.html + CHANGELOG i EN commit. Rapportera i versionsnummer, aldrig hashar.
Commit/push endast på uttrycklig begäran.
