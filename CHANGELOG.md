# CHANGELOG - Anatomiquiz

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
