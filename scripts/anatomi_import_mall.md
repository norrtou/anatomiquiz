# Mall: import av latinska anatomitermer (Terminologia Anatomica) till ordlistan

Arbetsspecifikation för den pågående utbyggnaden av `data/ordlista.json` med kroppens
alla latinska anatomiska namn. Följ den här mallen vid varje fortsättning – även i en
ny session. Mål: komplett, korrekt täckning (≈6 200 termer kvar att lägga till), gjort
region för region.

## STATUS & ÅTERUPPTAGNING (läs först!)
Arbetet kan avbrytas när som helst (t.ex. slut på kontext) och återupptas utan att
börja om. Gör så här vid fortsättning:

1. Ladda ner TA98-databasen (se "Källa" nedan) om `/tmp/ta98.sqlite` saknas.
2. Kör återupptagnings-recepet för att se vad som ÄR KVAR i nästa region:
   ```python
   import sqlite3, re, json
   EXP={"m.":"musculus","mm.":"musculi","a.":"arteria","aa.":"arteriae","v.":"vena","vv.":"venae","n.":"nervus","nn.":"nervi","r.":"ramus","rr.":"rami","lig.":"ligamentum","ligg.":"ligamenta","gl.":"glandula","art.":"articulatio","proc.":"processus","nl.":"nodus","nll.":"nodi"}
   def expand(la):
       p=la.split()
       if p and p[0].lower() in EXP: p[0]=EXP[p[0].lower()]
       return " ".join(p)
   ex={e["term"].strip().lower() for e in json.load(open("data/ordlista.json"))}
   c=sqlite3.connect("/tmp/ta98.sqlite")
   CH="02"   # <-- byt till nästa regions kapitelprefix
   rem=[]
   for sid,la,en in c.execute("SELECT source_id,name_la,name_en FROM ta98"):
       if not la or not (sid or "").startswith("A"+CH): continue
       laf=expand(la).strip()
       if laf.lower() not in ex: rem.append((laf,en,sid))
   print(len(rem),"kvar i A"+CH); [print(" ",t,"|",e) for t,e,_ in rem[:80]]
   ```
3. Skriv mallenliga poster för en lagom batch (≈25–60), lägg till + sortera + kör
   generatorn (se "Workflow per batch"). Uppdatera loggen nedan.

### Logg (uppdatera efter varje batch)
- 2026-06-15 — **A02 Ossa / skalle**: KLAR, 27 poster (os frontale … viscerocranium).
- 2026-06-15 — **A02.2 Columna vertebralis**: KLAR, 70 poster (curvatura primaria …
  cornu coccygeum). atlas/axis fanns redan.
- 2026-06-15 — **A02.3 Thorax**: KLAR, 41 poster (skeleton thoracis … angulus infrasternalis).
- 2026-06-15 — **A02.4 Övre extremitet**: KLAR, 116 poster (skuldergördel, humerus,
  radius, ulna, carpus, metacarpus, phalanges, ossa sesamoidea). Committat 0.8.32.
- 2026-06-15 — **A02.5 Nedre extremitet, del 1**: KLAR, 97 poster – höftben (os coxae:
  ilium/ischium/pubis + detaljer), bäcken som helhet + bäckenmått (conjugata m.fl.),
  lårben (femur). Committat 0.8.33.
- NÄSTA: **A02.5 del 2** – patella (basis/apex patellae, facies articularis), tibia
  (skenben), fibula (vadben), foten (ossa tarsi: talus, calcaneus, os naviculare,
  ossa cuneiformia, os cuboideum; ossa metatarsi; falanger). Kör recept CH="02" och
  filtrera bort redan tillagda. Därefter A02.1 cranium-resten (~427), A02.0, sedan
  A03–A16.

## Källa (auktoritativ)
- **Terminologia Anatomica (TA)** – den internationella standarden (FIPAT/IFAA).
  Endast de **latinska** namnen är officiella; engelskan är översättning, inte original.
- Praktiskt strukturerad form: **TA98 i SQLite** (`mhalle/ta98-sqlite`, MIT-licens på
  databasen; själva nomenklaturen saknar tydlig licens men enskilda anatominamn är
  standardfakta – användaren har godkänt användning).
- Ladda ner arbetskopia (≈10 MB, hamnar i /tmp som rensas mellan sessioner):
  ```
  curl -sL -o /tmp/ta98.sqlite \
    https://raw.githubusercontent.com/mhalle/ta98-sqlite/master/db/ta98.sqlite
  ```
  Tabell `ta98`: kolumnerna `source_id` (TA-kod, t.ex. A02.1.00.001), `name_la`
  (latin), `name_en` (engelska), `type_of_entity`, `parent_*`. 7 474 rader.
  OBS: `name_la` förkortar släktordet i underposter – **expandera alltid**:
  `m.`→musculus, `mm.`→musculi, `a.`→arteria, `aa.`→arteriae, `v.`→vena, `vv.`→venae,
  `n.`→nervus, `nn.`→nervi, `r.`→ramus, `rr.`→rami, `lig.`→ligamentum, `ligg.`→ligamenta,
  `gl.`→glandula, `art.`→articulatio, `proc.`→processus, `nl.`→nodus, `nll.`→nodi.

## Postmall (följ EXAKT – samma grundmall som resten av ordlistan)
Format på `def`-strängen (ren text; kursiveringen av ordklassen sker vid rendering):

```
<ordklass>. <kort definition>. [Sv. <svenskt namn>.] Eng. <engelsk term>. Av <ordförklaring av latinet>.
```

Delar i ordning:
1. **Uppslagsord** (`term`): den **fulla, expanderade latinska** termen, gement
   (t.ex. `musculus biceps brachii`, `fossa cranii anterior`). Flerords-/sammansatta
   termer är OK och önskvärda (`fossa supraclavicularis major`). Inga eponym-versaler
   om de inte hör till namnet.
2. **Ordklass** (kursiveras automatiskt av `format_def`): nästan alltid `subst.`;
   rena riktnings-/formadjektiv (anterior, medialis, obliquus …) = `adj.`
3. **Definition**: kort och överskådlig, på svenska. Beskriv VAD och VAR det är.
   - Slå upp vid behov (webben tillåten). Saknas exakt info → ge en **mer generell**
     beskrivning. Modell (användarens exempel):
     *fossa supraclavicularis* → "en fördjupning (grop) strax ovanför nyckelbenet".
4. **`Sv.`** – ENDAST om ett etablerat svenskt namn finns (pannben, lårpulsåder …).
   **Hitta ALDRIG på** ett svenskt namn. Saknas det – utelämna `Sv.` helt.
5. **`Eng.`** – engelska motsvarigheten ordagrant från TA (`name_en`). Utelämna om den
   är identisk med latinet (t.ex. foramen magnum).
6. **Ordförklaring av latinet** ("Av lat. … / Av grek. …"): förklara vad de latinska/
   grekiska orden betyder. För beskrivande termer SAMMANFALLER detta ofta med
   definitionen (fossa = grop, supra = ovanför, clavicula = nyckelben).

Frivilligt: `Jfr <Term>.`-korsreferenser, `Vardag.`-form. Ingen böjningsparentes behövs
för latinska uppslagsord (de saknar svensk böjning).

### Exempel (godkända av användaren)
```
os frontale → subst. pannben; det opariga ben som bildar pannan, övre delen av
  ögonhålorna och främre delen av skalltaket. Sv. pannben. Eng. frontal bone.
  Av lat. os = ben + frons (frontis) = panna.

fossa cranii anterior → subst. främre skallgropen; den främre av tre fördjupningar i
  skallbasens insida, som bär upp hjärnans pannlober. Sv. främre skallgropen.
  Eng. anterior cranial fossa. Av lat. fossa = grop + cranium = skalle + anterior = främre.

foramen magnum → subst. det stora hålet i nackbenet där ryggmärgen övergår i förlängda
  märgen och lämnar skallen. Eng. foramen magnum. Av lat. foramen = öppning, hål +
  magnum = stort.
```

## Säker svensk kategori per latinskt släktord (hjälp för definitionen)
musculus=skelettmuskel · arteria=artär (pulsåder) · vena=ven (blodåder) · nervus=nerv ·
ramus=gren (av kärl/nerv) · ligamentum=ledband · glandula=körtel · articulatio=led ·
processus=utskott · nucleus=kärna i nervsystemet · nodi (lymphoidei)=lymfkörtlar ·
sulcus=fåra · fossa=grop/fördjupning · foramen=öppning/hål · tuberculum=liten knöl ·
crista=list/kam · spina=tagg/utskott · sutura=bensöm i skallen · plexus=fläta av
nerver/kärl · ganglion=nervknut · fascia=bindvävshinna · bursa=slemsäck · sinus=hålrum/
bihåla/blodtomrum · plica=veck · canalis=kanal · ductus=gång · meatus=gång · gyrus=
hjärnvindling · lobus=lob · regio=kroppsregion · facies=yta/sida · margo=kant ·
lamina=platta/skiva · cornu=horn · ala=vingformig del · caput=huvud/övre del ·
corpus=kropp/huvuddel · collum=hals · cavitas=hålighet · recessus=ficka/fördjupning ·
incisura=inskärning · trochanter=benutskott på lårbenet · condylus=ledknöl ·
epicondylus=benknöl ovan ledknölen · tuberositas=knöl/ojämnhet · fovea=liten grop.

Vanliga adjektiv: anterior=främre, posterior=bakre, superior=övre, inferior=nedre,
medialis=medial/inre, lateralis=lateral/yttre, major/magnus=större/stor,
minor/parvus=mindre/liten, medius=mellersta, profundus=djup, superficialis=ytlig,
internus=inre, externus=yttre, dexter=höger, sinister=vänster, communis=gemensam,
transversus=tvär, obliquus=sned, longus=lång, brevis=kort, rectus=rak.

## Arbetsordning (region för region)
Bocka av i `data/ordlista.json` via TA-kapitel (`source_id`-prefix `A0n`):
- A02 Ossa (ben) – delas i: **skalle** ✓ (klar), bål (kotor/revben/bröstben),
  övre extremitet, nedre extremitet
- A03 Juncturae (leder/ledband)
- A04 Musculi (muskler) – stor
- A05 Systema digestorium
- A06 Systema respiratorium
- A07 Cavitas thoracis
- A08 Systema urinarium
- A09 Systemata genitalia
- A10 Cavitas abdominopelvica
- A11 Glandulae endocrinae
- A12 Systema cardiovasculare (kärl) – stor
- A13 Systema lymphoideum
- A14 Systema nervosum – störst
- A15 Organa sensuum
- A16 Integumentum commune
- A01 Anatomia generalis (regioner, plan, riktningar – många finns redan)

## Workflow per batch
1. Lista TA-termer för regionen och **filtrera bort dem som redan finns** i
   `data/ordlista.json` (jämför på expanderad, gemen latinsk term).
2. Skriv mallenliga poster (handgjorda, slå upp vid behov).
3. Lägg till i `data/ordlista.json` (append + sortera om listan på
   `(entry.get("sort") or entry["term"]).lower()`; behåll `indent=2`,
   `ensure_ascii=False`, avslutande radbrytning).
4. Kör `python3 scripts/generate_glossary.py` (validerar slug-kollisioner, exit 0).
   `GLOSSARY_V` behöver INTE bumpas (ingen css/js-ändring).
5. Användaren granskar via Live Server. Commit/push ENDAST på uttrycklig begäran;
   bumpa då VERSION/index.html/CHANGELOG.

## Regler att minnas
- Hitta aldrig på svenska namn eller anatomiska fakta. Osäker → slå upp eller håll
  definitionen generell. ("Var noga!")
- Engelska = alternativ (`Eng.`), aldrig huvudord.
- Dubbla/sammansatta latinska termer är tillåtna och önskade.
- Dubblera inte befintliga poster.
