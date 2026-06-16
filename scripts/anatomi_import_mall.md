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
- 2026-06-15 — **A02.5 Nedre extremitet, del 2**: KLAR, 74 poster – knäskål, skenben,
  vadben, fotrotsben (talus/calcaneus/naviculare/cuneiformia/cuboideum), mellanfotsben.
  Committat 0.8.34. Hela extremitetsskelettet klart.
- 2026-06-15 — **A02.1 ansiktsskelett**: KLAR, 92 poster – maxilla, mandibula, os
  hyoideum, os zygomaticum, os palatinum. Committat 0.8.35.
- 2026-06-15 — **A02.1 nackben/silben/små ansiktsben**: KLAR, 57 poster (os occipitale,
  os ethmoidale, concha inf.-utskott, lacrimale, nasale, vomer). Committat 0.8.36.
- 2026-06-15 — **A02.1 pannben + hjässben**: KLAR, 41 poster (os frontale, os parietale).
  Committat 0.8.37.
- 2026-06-15 — **A02.1 kilben**: KLAR, 44 poster (os sphenoidale). Committat 0.8.38.
- 2026-06-15 — **SORTERINGSFIX**: 57 strukturnamn inverterade (`os frontale`→`frontale, os`
  osv.) så de filas på rätt bokstav istället för att hopa sig på O. Regel + helper införd
  ovan; ska användas i ALLA kommande batchar. Committas 0.8.39.
- 2026-06-15 — **A02.1 tinningben**: KLAR, 62 poster (os temporale). Committat 0.8.40.
- 2026-06-15 — **A02.1 allmän skalle**: KLAR, 73 poster. Committat 0.8.41.
  ✅ **HELA A02 OSSA (skelettet) KLART.** Ordlistan 6 480 termer.
- 2026-06-15 — **A03 Juncturae (leder/ledband)**: ✅ **HELA KAPITLET KLART**, 342 poster.
  7 batchar: allmän ledlära (52), skallens fogar (54), kotpelaren (34), bröstkorgen (28),
  övre extremiteten (69), nedre extremiteten utom fot (51), foten (54), + 3 efterskörd.
  Strukturord (articulatio/ligamentum/bursa) inverterade. Rent generiska upprepade
  barntermer (ligamenta collateralia/palmaria/plantaria, ligamentum laterale/mediale,
  membrana synovialis superior/inferior, pars transversa/descendens, periodontium-subtyper)
  UTELÄMNADE medvetet. Committat 0.8.42. Ordlistan **6 822** termer.
- 2026-06-15 — **A04 Musculi (muskler)**: ✅ **HELA KAPITLET KLART**, ~470 poster.
  Batchar: allmän muskellära (42), huvud (45), hals (34), rygg (53), thorax/diafragma
  (34), buk+bäckenbotten (62), övre extr. (63), nedre extr. (91), senskidor+slemsäckar
  (34), bäckenstöd-komplettering (7). Committat 0.8.43 (huvud–hand) + 0.8.44 (resten).
  Ordlistan **7 287** termer. Musculus/tendo inverterade; proper latin används som
  uppslagsord även där TA alfabetiserar om (t.ex. `musculus flexor carpi radialis`,
  ej TA:s `radialis flexor carpi`). MEDVETET UTELÄMNAT: generiska deletiketter
  (caput/pars/lamina/venter), upprepade fasciavarianter och A04.8:s långa svans av
  obskyra `bursa subtendinea musculi …` / enskilda fotledssenskidor (~200 TA-rader).
  Homonymen flexor digiti minimi brevis (hand+fot) sammanslogs i en post.
- 2026-06-16 — **A05 Systema digestorium (matsmältningssystemet)**: ✅ **HELA KAPITLET KLART.**
  Del 1 (mun–tunntarm, +294) committat 0.8.45. Del 2 (lever, gallvägar, pankreas, tjocktarm,
  ändtarm/anus, 88 poster) i arbetsträdet OCOMMITTAT. UTELÄMNAT medvetet (generiska/upprepade
  barntermer): tandkuspar/-rötter (cuspis/radix mesiobuccalis m.fl.), leverns segment-/divisio-
  indelning (segmentum/divisio …), pars superficialis/profunda, paries ant./post., svalgknipernas
  pars-varianter. Tonsilla palatina/lingualis/pharyngealis/tubaria fanns redan.
- 2026-06-16 — **A06 Systema respiratorium (andningsorganen)**: ✅ **HELA KAPITLET KLART**, 111 poster.
  Yttre näsa, näsbrosk, näshåla/bihålor, struphuvud (brosk/leder/membran/ligament/muskler/hålan),
  luftstrupe, bronker (huvud- + lobbronker, bronkträd, bronkioler), lungor (lober, fåror, hilus,
  lingula, hjärtinskärning), segmenta bronchopulmonalia. Musculus/articulatio/ligamentum/ligamenta/
  plexus inverterade; cartilago/membrana/plica/sinus läses naturligt. UTELÄMNAT medvetet: de 40
  numrerade segmentbronkerna/lungsegmenten [B I]–[B X]/[S I]–[S X] (upprepade L/H med samma namn),
  generiska pars ant./post., små arytenoid-ytdetaljer. Conchae nasi finns redan som benformer
  (concha nasalis …). OCOMMITTAT i arbetsträdet tillsammans med A05 del 2. Ordlistan **7 707** termer.
- 2026-06-16 — **A07 Cavitas thoracis (brösthålan)**: ✅ KLAR, 21 poster. Pleura (viscerala/parietala,
  kupol, delar), lungsäcksrecesserna (kostodiafragmatiska m.fl.), lungbandet, suprapleurala membranet,
  mediastinums 5 avdelningar, hjärtsäckshålan. Committat 0.8.46.
- 2026-06-16 — **A08 Systema urinarium (urinvägarna)**: ✅ KLAR, 49 poster. Njure (hilus/sinus/bark/märg/
  pyramider/papiller/kolumner/fascior), njurens kärlträd (afferent/efferent arteriol, vasa recta, stjärnvener),
  njurbäcken/kalkar, urinblåsa (blåstriangel, detrusor, blåshals), urinrör (kvinnligt/manligt). Committat 0.8.46.
  UTELÄMNAT: finhistologiska märgzoner, numrerade njursegment/kalkar, generiska pars/lager.
- 2026-06-16 — **A09 Systemata genitalia (könsorganen + perineum)**: ✅ **HELA KAPITLET KLART**, 168 poster.
  Kvinnligt inre (äggstock, äggledare, livmoder m. ligament, slida, vestigiala rester), kvinnligt yttre
  (vulva, klitoris, vestibulum, Bartholin), manligt inre (testikel, bitestikel, sädesledare, sädesblåsa,
  prostata, Cowper), manligt yttre (penis svällkroppar, scrotum), urinrörsdetaljer, perineum (perinealkropp,
  ytliga/djupa perinealrummet, perinealmembran, ischiocavernosus/bulbospongiosus, ischioanala gropen, Alcocks
  kanal). Strukturord (musculus/ligamentum/glandula/arteria/vena) inverterade; delade termer (tunica albuginea,
  sphincter urethrae ext/int, crista urethralis, ostium urethrae externum, glandulae/lacunae urethrales) en gång.
  UTELÄMNAT: pars/paries ant./post., prostatans lobulus-indelning, vestigiala gångdetaljer, funktionella
  blåsmynningstillstånd. OCOMMITTAT (→ 0.8.47).
- 2026-06-16 — **A10 Cavitas abdominopelvica (buk-/bäckenhåla + bukhinnan)**: ✅ **HELA KAPITLET KLART**, ~75 poster.
  Peritoneum (parietale/viscerale), retroperitoneala/retropubiska rummet, mesenterier/mesokolon, oment (minus/majus)
  och alla peritonealligament (hepato-/gastro-/spleno-/pancreatico-/phrenico-), leverband (coronarium/falciforme/
  triangulare), omentalbursan + Winslows hål, kliniskt viktiga recesser/gropar (Morisons grop, Douglas/rektovesikala
  fickan, paraduodenala, ileocekala, paracoliska fårorna, Calots & Hesselbachs triangel, ljumskgropar/navelveck),
  breda livmoderbandet (mesometrium/-salpinx/-ovarium). OCOMMITTAT (→ 0.8.47).
- 2026-06-16 — **A11 Glandulae endocrinae (endokrina körtlar)**: ✅ **HELA KAPITLET KLART**, ~19 poster.
  Hypofys (adeno-/neurohypophysis + pars distalis/tuberalis/nervosa), tallkottkörtel, sköldkörtel (istmus,
  pyramidlob, accessoriska), bisköldkörtlar (övre/nedre/accessoriska), binjurar (+ centralven, accessoriska).
  UTELÄMNAT: generiska stroma/parenchyma/lobuli/hilum/facies renalis. OCOMMITTAT (→ 0.8.47). Ordlistan **8 034** termer.
- NÄSTA: **A12 Systema cardiovasculare** (hjärta + kärl – stor; kör recept CH="12"). Sedan A13 lymf, A14 nervsystem
  (störst), A15 sinnesorgan, A16 hud, A01 allmän anatomi. Kom ihåg inv()-helpern i varje batch.

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

### SORTERING – invertera strukturnamn (VIKTIGT)
Användaren vill INTE ha alla `os …` på O, alla `musculus …` på M osv. (absurt för ett
lexikon). Därför **inverteras strukturnamn** så de filas på sitt egentliga namns bokstav,
med kompletta latinet utskrivet (och sökbart) i definitionen:
- Uppslagsord: `os frontale` → **`frontale, os`** (sida F); `musculus biceps brachii` →
  `biceps brachii, musculus` (B); `nervus ulnaris` → `ulnaris, nervus` (U);
  `arteria femoralis` → `femoralis, arteria` (F).
- Definition: skriv in kompletta latinska namnet FÖRST (direkt efter ordklassen) så det
  blir sökbart: `subst. os frontale; pannben; …`.
- **Gäller strukturgenus:** os, ossa, musculus, musculi, nervus, nervi, arteria, arteriae,
  vena, venae, ligamentum, ligamenta, glandula, glandulae, nodus, nodi, ganglion, ganglia,
  articulatio, articulationes, ramus, rami, truncus, plexus, bursa, tendo.
- **Inverteras INTE** (läses naturligt, står kvar på egen bokstav): topografiska detaljord
  `fossa, sulcus, processus, facies, foramen, crista, tuberculum, incisura, linea, margo,
  spina, sinus, canalis, pars, apertura, recessus …`. Tveka? Fråga användaren.
- Enordsnamn (femur, patella, scapula, mandibula, atlas …) står redan rätt – ingen åtgärd.

Använd denna helper i varje batch (kör term+def genom den innan append):
```python
import re
INVERT={"os","ossa","musculus","musculi","nervus","nervi","arteria","arteriae","vena","venae","ligamentum","ligamenta","glandula","glandulae","nodus","nodi","ganglion","ganglia","articulatio","articulationes","ramus","rami","truncus","trunci","plexus","bursa","bursae","tendo"}
_OK=re.compile(r'^(subst\.|adj\.|adv\.|verb|prefix|suffix|förk\.|pron\.|räkn\.|interj\.|konj\.|prep\.)\s+')
def inv(term,defi):
    w=term.split()
    if "," in term or "(" in term or len(w)<2 or w[0].lower() not in INVERT or not re.match(r'^[A-Za-zÅÄÖåäö]',w[1]):
        return term,defi
    nt=" ".join(w[1:])+", "+w[0]
    m=_OK.match(defi); nd=(defi[:m.end()]+term+"; "+defi[m.end():]) if m else term+"; "+defi
    return nt,nd
```

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
