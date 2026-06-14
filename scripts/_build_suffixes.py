#!/usr/bin/env python3
"""Engångsskript: infoga systematiska suffix-poster (streck-former) i
data/ordlista.json — på samma sätt som _build_prefixes.py gjorde med prefix.

- Varje suffix får en egen post med termen inledd med streck (t.ex. "-algi").
- Posten sorteras in på FÖRSTA BOKSTAVEN (det inledande strecket ignoreras),
  in-place i rätt bokstavsgrupp, som rent tillägg utan att flytta annat.
- Varianter (latin/grekisk + svensk form) samlas i samma post via "/".
- Format speglar prefix-posterna:
    "Suffix: <mening>. (suffix) Av grek./lat. <ord> = <bet>. Ex: <ex>. Jfr …"

OBS — poster som medvetet UTELÄMNATS pga oklar/garblad källa (verifierat mot
litteratur, se CHANGELOG 0.8.21):
  -gasis   (inget litteraturstöd; spuriös variant av -iasis)
  -isis    (är bara grek. -sis = tillstånd/process; täcks av -sis i -osis m.fl.)
  -ia      (för generisk; noteras i -iasis-posten i stället)
  -ade     (spuriös; det riktiga anatomiska suffixet är -ad = riktning mot)
  -strismus (garbled; trismus kommer av grek. trismos = gnissel, via -ismus)
  -dysesthesia (= dys- + -esthesia; dysestesi ges som exempel under -estesi)

Källrättelser verifierade mot litteratur:
  "-ont" -> "-odontia / -odonti" (anodontia m.fl. är grek. -odontia)
  "-ade" -> "-ad" (lat. riktningssuffix: cephalad, caudad)
  "neuroexeres" -> "neurexeres" (eng. neurexeresis)
  "-gocrine" -> "-krin";  "-vcf" -> "-valva";  "-spasmus"-exemplet rensat.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "ordlista.json"


def S(term, definition):
    return {"term": term, "def": definition}


def sortkey(term: str) -> str:
    """Normaliserad sorteringsnyckel: strunta i inledande streck/blanksteg."""
    return term.lstrip("-").strip().casefold()


def group_letter(term: str) -> str:
    return term.lstrip("-").strip()[0].upper()


SUFFIXES = [
    # --- A ---
    S("-ad", "Suffix: i riktning mot, -åt (anatomisk riktningsterm). (suffix) Av lat. -ad = mot, till. Ex: cephalad = mot huvudet; caudad = mot svansänden; ventrad = mot buksidan."),
    S("-agra", "Suffix: akut smärta, anfall. (suffix) Av grek. agra = gripande, anfall. Ex: podagra = akut gikt i stortån (portvinstå)."),
    S("-al / -an / -ar / -ic", "Suffix: anatomiska adjektivändelser – som hör till, är belägen vid. (suffix) Av lat. -alis, -anus, -aris, -icus. Ex: renalis = njur-; cardiacus = hjärt-; muscularis = muskel-."),
    S("-algia / -algi", "Suffix: smärta, värk. (suffix) Av grek. algos = smärta. Ex: myalgi = muskelsmärta; neuralgi = nervsmärta. Jfr -dyni."),
    S("-angio", "Suffix: kärl- (suffixliknande slutled). (suffix) Av grek. angeion = kärl. Ex: lymfangiom = godartad tumör i lymfkärl. Jfr prefix angio-."),
    S("-ase / -as", "Suffix: enzym. (suffix) Efter diastas, det första namngivna enzymet. Ex: amylas = stärkelsespjälkande enzym; laktas; polymeras."),
    S("-asthenia / -asteni", "Suffix: svaghet, kraftlöshet. (suffix) Av grek. a- = utan + sthenos = styrka. Ex: myasteni = muskelsvaghet; neurasteni. Jfr -steni."),
    S("-atrophy / -atrofi", "Suffix: förtvining, näringsbrist i vävnad. (suffix) Av grek. a- = utan + trophe = näring. Ex: muskelatrofi = förtvinad muskel. Jfr -trofi."),
    # --- B ---
    S("-blast", "Suffix: omogen cell, modercell under utveckling. (suffix) Av grek. blastos = grodd, gröddel. Ex: erytroblast = förstadium till röd blodkropp; fibroblast."),
    # --- C ---
    S("-calcinosis / -kalcinos", "Suffix: förkalkning av vävnad. (suffix) Av lat. calx (calcis) = kalk. Ex: nefrokalcinos = kalkutfällning i njurarna."),
    S("-capnia / -kapni", "Suffix: koldioxidhalt i blodet. (suffix) Av grek. kapnos = rök, os. Ex: hyperkapni = förhöjd koldioxidhalt i blodet."),
    S("-carcinoma / -karcinom", "Suffix: cancer utgången från epitelvävnad. (suffix) Av grek. karkinos = kräfta. Ex: adenokarcinom = körtelcellscancer."),
    S("-cele", "Suffix: bråck, utbuktning, vätskefylld svullnad. (suffix) Av grek. kele = bråck, svulst. Ex: rektocele = ändtarmsbråck; hydrocele = vattenbråck."),
    S("-centesis / -centes", "Suffix: punktion, instick för att tappa ut vätska. (suffix) Av grek. kentesis = stick. Ex: paracentes = buktappning; torakocentes = lungsäckspunktion."),
    S("-cholia / -koli", "Suffix: tillstånd rörande galla. (suffix) Av grek. khole = galla. Ex: akoli = brist på galla."),
    S("-chrome / -krom", "Suffix: färg, cellulärt pigment. (suffix) Av grek. khroma = färg. Ex: cytokrom = färgat protein i cellandningen. Jfr -kromi."),
    S("-chromia / -kromi", "Suffix: färg, pigmentering. (suffix) Av grek. khroma = färg. Ex: heterokromi = olikfärgade ögon; hypokromi = blek färg (på blodkroppar)."),
    S("-chylia / -kyli", "Suffix: tillstånd rörande mag-/mjölksaft. (suffix) Av grek. khylos = saft. Ex: akyli = avsaknad av magsaft."),
    S("-clasis / -clasia / -klasi", "Suffix: brott, krossning, nedbrytning (även avsiktlig kirurgisk brytning). (suffix) Av grek. klasis = brytning. Ex: osteoklasi = (kirurgisk) brytning av felvuxet ben. Jfr -klast."),
    S("-clast / -klast", "Suffix: cell som bryter ner eller resorberar vävnad. (suffix) Av grek. klastos = bruten. Ex: osteoklast = bennedbrytande cell; odontoklast. Jfr -klasi."),
    S("-clysis / -klys", "Suffix: infusion, spolning av vätska. (suffix) Av grek. klysis = sköljning. Ex: hypodermoklys = vätsketillförsel i underhuden."),
    S("-cyte / -cyt", "Suffix: mogen, specialiserad cell. (suffix) Av grek. kytos = ihålighet, cell. Ex: hepatocyt = levercell; trombocyt = blodplätt."),
    S("-cythemia / -cytemi", "Suffix: ökning av antalet celler i blodet. (suffix) Av grek. kytos = cell + haima = blod. Ex: polycytemi = för många röda blodkroppar."),
    # --- D ---
    S("-dactyly / -daktyli", "Suffix: tillstånd rörande fingrar eller tår. (suffix) Av grek. daktylos = finger, tå. Ex: syndaktyli = sammanvuxna fingrar; polydaktyli = övertaliga fingrar."),
    S("-dentia / -denti", "Suffix: tillstånd rörande tänderna (latinsk variant av -odonti). (suffix) Av lat. dens (dentis) = tand. Ex: edentia = medfödd tandlöshet. Jfr -odonti."),
    S("-dermia / -dermi", "Suffix: hudsjukdom, hudtillstånd. (suffix) Av grek. derma = hud. Ex: sklerodermi = hård hud; pakydermi = förtjockad hud."),
    S("-desis / -des", "Suffix: kirurgisk steloperation, sammanbindning. (suffix) Av grek. desis = bindning. Ex: artrodes = steloperation av led; pleurodes."),
    S("-dilation / -dilatation", "Suffix: utvidgning. (suffix) Av lat. dilatare = vidga. Ex: vasodilatation = kärlutvidgning."),
    S("-doxia / -doxi", "Suffix: åsikt, tro, uppfattning. (suffix) Av grek. doxa = åsikt, tro. Ex: heterodoxi = avvikande uppfattning; ortodoxi = renlärighet."),
    S("-dynia / -dyni", "Suffix: smärta, värk. (suffix) Av grek. odyne = smärta. Ex: otodyni = öronsmärta; koccydyni = smärta i svanskotan. Jfr -algi."),
    # --- E ---
    S("-ectasia / -ectasis / -ektasi", "Suffix: sjuklig utvidgning av hålorgan. (suffix) Av grek. ektasis = utvidgning. Ex: bronkiektasi = utvidgade luftrör; atelektas = sammanfallen lungvävnad."),
    S("-ectomia / -ektomi", "Suffix: operativt borttagande, total utskärning. (suffix) Av grek. ektome = utskärning. Ex: kolecystektomi = bortta gallblåsan; lobektomi. Jfr -tomi."),
    S("-edema / -ödem", "Suffix: svullnad pga vätska i vävnad. (suffix) Av grek. oidema = svullnad. Ex: lymfödem; papillödem = svullen synnervspapill."),
    S("-emesis / -emes", "Suffix: kräkning. (suffix) Av grek. emesis = kräkning. Ex: hematemes = blodkräkning; hyperemesis = svåra kräkningar."),
    S("-emia / -emi", "Suffix: tillstånd i blodet. (suffix) Av grek. haima = blod. Ex: anemi = blodbrist; uremi = urinförgiftning."),
    S("-esthesia / -estesi", "Suffix: känsel, förnimmelse. (suffix) Av grek. aisthesis = förnimmelse. Ex: anestesi = känsellöshet/bedövning; hyperestesi; parestesi = stickningar; dysestesi = förvrängd känsel."),
    S("-exeresis / -exeres", "Suffix: kirurgiskt fullständigt utdragande. (suffix) Av grek. exairesis = borttagande. Ex: neurexeres = utslitning av en nerv."),
    # --- F ---
    S("-form", "Suffix: formad som, till utseendet lik. (suffix) Av lat. forma = form. Ex: vermiform = maskformad; pisiform = ärtformad."),
    # --- G ---
    S("-gemma", "Suffix: knoppstruktur. (suffix) Av lat. gemma = knopp. Ex: gemma gustatoria = smaklök."),
    S("-genesis / -genes", "Suffix: ursprung, utveckling, bildning. (suffix) Av grek. genesis = uppkomst. Ex: glukoneogenes = nyskapande av glukos; organogenes = organbildning."),
    S("-globin / -globulin", "Suffix: globulärt protein. (suffix) Av lat. globus = klot. Ex: hemoglobin = syrebärande blodprotein; gammaglobulin = antikroppar."),
    S("-gnosis / -gnos", "Suffix: kunskap, bedömning. (suffix) Av grek. gnosis = kunskap. Ex: diagnos = fastställande av sjukdom; prognos = framtidsbedömning."),
    S("-gonia / -goni", "Suffix: stamcell, tidigt cellstadium. (suffix) Av grek. gone = säd, avkomma. Ex: spermatogoni = tidig könscell hos mannen."),
    S("-gram", "Suffix: registreringens resultat (bild, kurva, diagram). (suffix) Av grek. gramma = skrift. Ex: elektrokardiogram (EKG); mammogram = röntgenbild av bröstet. Jfr -graf, -grafi."),
    S("-graph / -graf", "Suffix: instrument som registrerar eller ritar. (suffix) Av grek. graphein = skriva. Ex: elektrokardiograf = apparat som registrerar hjärtats elektriska aktivitet. Jfr -gram, -grafi."),
    S("-graphia / -grafi", "Suffix: undersökningsmetod eller process. (suffix) Av grek. graphein = skriva. Ex: angiografi = kärlavbildning; scintigrafi. Jfr -gram, -graf."),
    S("-gusia / -geusia / -geusi", "Suffix: smak, smaksinne. (suffix) Av grek. geusis = smak. Ex: ageusi = förlorat smaksinne; dysgeusi = förvrängd smak."),
    # --- I ---
    S("-iasis / -ias", "Suffix: sjukdomstillstånd, process (även -ia). (suffix) Av grek. -iasis. Ex: psoriasis; nefrolitiasis = njurstensjukdom."),
    S("-icterus / -ikterus", "Suffix: gulsot. (suffix) Av grek. ikteros = gulsot. Ex: anikterisk = utan gulsot."),
    S("-in", "Suffix: protein, hormon, enzym eller aktiv substans. (suffix) Av lat. -ina. Ex: tyroxin = sköldkörtelhormon; pepsin; myosin = muskelprotein."),
    S("-ism", "Suffix: tillstånd, doktrin eller förgiftning. (suffix) Av grek. -ismos. Ex: merkurialism = kvicksilverförgiftning; mutism = stumhet."),
    S("-itis / -it", "Suffix: inflammation. (suffix) Av grek. -itis. Ex: gastrit = magkatarr; myokardit = hjärtmuskelinflammation."),
    # --- K ---
    S("-kinesia / -kinesi", "Suffix: rörelse, rörelseförmåga. (suffix) Av grek. kinesis = rörelse. Ex: bradykinesi = långsamma rörelser; akinesi = rörelsefattigdom; dyskinesi."),
    S("-krin", "Suffix: utsöndring, avsöndring från körtlar. (suffix) Av grek. krinein = avskilja. Ex: exokrin = utsöndring via kanal; endokrin = utsöndring till blodet; parakrin."),
    # --- L ---
    S("-lalia / -lali", "Suffix: talstörning, defekt i talproduktionen. (suffix) Av grek. lalia = tal, pladder. Ex: ekolali = tvångsmässigt härmande av ord."),
    S("-lemma", "Suffix: cellulärt hölje, membran. (suffix) Av grek. lemma = skal, hölje. Ex: sarkolemma = muskelcellens membran; neurolemma."),
    S("-lepsy / -lepsi", "Suffix: anfall, attack. (suffix) Av grek. lepsis = gripande, anfall. Ex: epilepsi; narkolepsi = okontrollerade sömnattacker."),
    S("-liposis / -lipos", "Suffix: sjuklig fettinlagring i vävnad. (suffix) Av grek. lipos = fett. Ex: lipomatos = onormal fettansamling i vävnad."),
    S("-lith / -lit", "Suffix: sten, konkrement. (suffix) Av grek. lithos = sten. Ex: nefrolit = njursten; otolit = öronsten."),
    S("-lithotomy / -litotomi", "Suffix: kirurgiskt snitt för att avlägsna stenar. (suffix) Av grek. lithos = sten + tome = snitt. Ex: koledokolitotomi = stenextraktion ur stora gallgången."),
    S("-logia / -logi", "Suffix: 1) läran om, medicinsk specialitet; 2) (psyk.) sjukligt tal. (suffix) Av grek. logos = ord, lära. Ex: gastroenterologi = läran om mag-tarmkanalen; onkologi; makrologi = överdriven pratsamhet. Jfr -log."),
    S("-logist / -log", "Suffix: specialist, yrkesutövare inom området. (suffix) Av grek. logos = lära. Ex: dermatolog = hudläkare; kardiolog. Jfr -logi."),
    S("-lysis / -lys", "Suffix: upplösning, nedbrytning, sönderfall (även kirurgisk frigöring av sammanväxningar). (suffix) Av grek. lysis = upplösning. Ex: hemolys = sönderfall av röda blodkroppar; rabdomyolys; adhesiolys = lossande av ärrvävnad."),
    # --- M ---
    S("-malacia / -malaci", "Suffix: sjuklig uppmjukning av vävnad. (suffix) Av grek. malakia = mjukhet. Ex: osteomalaci = benuppmjukning vid mineralbrist; kondromalaci = uppmjukat ledbrosk."),
    S("-mania / -mani", "Suffix: sjukligt tvång, besatthet. (suffix) Av grek. mania = vansinne, raseri. Ex: pyromani = tvång att anlägga bränder; trikotillomani."),
    S("-megalia / -megali", "Suffix: sjuklig förstoring av ett organ. (suffix) Av grek. megas (megalo-) = stor. Ex: akromegali = förstoring av kroppens yttersta delar; hepatomegali = förstorad lever."),
    S("-melia / -meli", "Suffix: medfödd missbildning av extremiteter. (suffix) Av grek. melos = lem. Ex: amelia = avsaknad av arm/ben; fokomeli = säldjurslika korta extremiteter."),
    S("-menorrhea / -menorré", "Suffix: menstruationsflöde. (suffix) Av grek. men = månad + rhoia = flöde. Ex: amenorré = utebliven mens; dysmenorré = smärtsam mens."),
    S("-meter", "Suffix: mätinstrument. (suffix) Av grek. metron = mått. Ex: sfygmomanometer = blodtrycksmätare; glukosmeter. Jfr -metri."),
    S("-metria / -metri", "Suffix: kvantitativ mätning, analysmetod. (suffix) Av grek. metron = mått. Ex: spirometri = mätning av lungfunktion; pelvimetri = mätning av bäckenet. Jfr -meter."),
    S("-mnesia / -mnesi", "Suffix: tillstånd rörande minnet. (suffix) Av grek. mnesis = minne. Ex: amnesi = minnesförlust; hypermnesi = ovanligt gott minne."),
    S("-morphic / -morf", "Suffix: form, strukturell uppbyggnad. (suffix) Av grek. morphe = form. Ex: polymorf = mångformig; pleomorf."),
    S("-mycosis / -mykos", "Suffix: svampinfektion. (suffix) Av grek. mykes = svamp. Ex: dermatomykos = hudsvamp; otomykos = svampinfektion i örat."),
    # --- N ---
    S("-necrosis / -nekros", "Suffix: lokal cell- eller vävnadsdöd. (suffix) Av grek. nekrosis = avdöende. Ex: osteonekros = bendöd; pankreasnekros."),
    S("-nychia / -nyki", "Suffix: tillstånd rörande naglarna. (suffix) Av grek. onyx (onykhos) = nagel. Ex: koilonyki = skednaglar; paronyki = nagelbandsinfektion."),
    # --- O ---
    S("-odontia / -odonti", "Suffix: tillstånd rörande tänderna (antal, utveckling). (suffix) Av grek. odous (odontos) = tand. Ex: anodonti = avsaknad av tänder; hyperdonti = övertaliga tänder; oligodonti = för få tänder. Jfr -denti."),
    S("-oid", "Suffix: liknande, som påminner om till formen. (suffix) Av grek. -oeides, av eidos = form. Ex: reumatoid; fibroid; sarkoid."),
    S("-oma / -om", "Suffix: tumör, knöl, vävnadsutväxt. (suffix) Av grek. -oma = svulst. Ex: melanom = pigmentcellscancer; lipom = fettsvulst; hematom = blåmärke."),
    S("-opia / -opsia / -opi", "Suffix: synfel, synrelaterat tillstånd. (suffix) Av grek. ops (opsis) = syn. Ex: myopi = närsynthet; presbyopi = ålderssynthet; diplopi = dubbelseende. Jfr -opsi (besiktning)."),
    S("-opsia / -opsi", "Suffix: okulär besiktning, mikroskopisk granskning. (suffix) Av grek. opsis = seende, syn. Ex: biopsi = vävnadsprov; autopsi = obduktion. Jfr -opi (synfel)."),
    S("-orexia / -orexi", "Suffix: aptit. (suffix) Av grek. orexis = aptit, längtan. Ex: anorexi = nervös aptitlöshet; ortorexi."),
    S("-orthosis / -ortos", "Suffix: rätning, ortopedisk korrigering. (suffix) Av grek. orthos = rak, rät. Ex: ortos = ortopedisk skena för korrigering."),
    S("-osis / -os", "Suffix: kroniskt degenerativt tillstånd, sjuklig ökning. (suffix) Av grek. -osis = tillstånd. Ex: artros = ledförslitning; nefros; leukocytos = ökat antal vita blodkroppar."),
    S("-osmia / -osmi", "Suffix: lukt, luktsinne. (suffix) Av grek. osme = lukt. Ex: anosmi = förlorat luktsinne; kakosmi = upplevelse av stank; parosmi = förvrängd lukt."),
    # --- P ---
    S("-paralysis / -paralys", "Suffix: fullständig förlamning. (suffix) Av grek. paralysis = förlamning. Ex: neuroparalys = förlamning pga nervskada. Jfr -plegi, -pares."),
    S("-paresis / -pares", "Suffix: muskelsvaghet, partiell/lätt förlamning. (suffix) Av grek. paresis = avslappning, försvagning. Ex: hemipares = halvsidig svaghet. Jfr -plegi."),
    S("-pathia / -pati", "Suffix: sjukdom, lidande i ett organ. (suffix) Av grek. pathos = lidande. Ex: kardiomyopati = hjärtmuskelsjukdom; retinopati = näthinnesjukdom."),
    S("-penia / -peni", "Suffix: brist, för lågt antal celler. (suffix) Av grek. penia = brist, fattigdom. Ex: trombocytopeni = brist på blodplättar; osteopeni; leukopeni."),
    S("-pepsia / -pepsi", "Suffix: matsmältning. (suffix) Av grek. pepsis = matsmältning. Ex: dyspepsi = matsmältningsbesvär."),
    S("-pexia / -pexi", "Suffix: kirurgisk fästning, fixering av rörligt organ. (suffix) Av grek. pexis = fastsättning. Ex: orkidopexi = fixering av testikel i pungen; nefropexi."),
    S("-phagia / -fagi", "Suffix: sväljning, ätande. (suffix) Av grek. phagein = äta. Ex: dysfagi = sväljsvårigheter; polyfagi = sjuklig aptit; afagi."),
    S("-phasia / -fasi", "Suffix: språkförmåga, talproduktion. (suffix) Av grek. phasis = tal. Ex: afasi = språknedsättning pga hjärnskada; dysfasi."),
    S("-philia / -fili", "Suffix: sjuklig dragning till; genetisk blödningsbenägenhet. (suffix) Av grek. philia = kärlek, dragning. Ex: hemofili = blödarsjuka. Jfr -fil."),
    S("-phil / -fil", "Suffix: cell eller organism som färgas av eller dras till något. (suffix) Av grek. philein = älska. Ex: eosinofil = färgas av eosin; basofil; neutrofil. Jfr -fili."),
    S("-phobia / -fobi", "Suffix: sjuklig, irrationell rädsla. (suffix) Av grek. phobos = fruktan. Ex: fotofobi = ljuskänslighet; klaustrofobi."),
    S("-phonia / -foni", "Suffix: röst, röstbildning. (suffix) Av grek. phone = röst, ljud. Ex: afoni = röstförlust; dysfoni = heshet."),
    S("-phoria / -fori", "Suffix: sinnesstämning; (ögon) latent skelning. (suffix) Av grek. pherein = bära. Ex: dysfori = nedstämdhet; eufori; heterofori = dold skelning."),
    S("-phore / -for", "Suffix: bärare av specifik substans eller färg. (suffix) Av grek. phoros = bärande. Ex: melanofor = pigmentbärande cell."),
    S("-phthisis / -ftis", "Suffix: tynande, förtvining, svinn. (suffix) Av grek. phthisis = tvinsot. Ex: panmyeloftis = total benmärgsförtvining; phthisis bulbi = skrumpnat öga."),
    S("-phyte / -fyt", "Suffix: patologisk utväxt. (suffix) Av grek. phyton = växt. Ex: osteofyt = benpålagring."),
    S("-physis / -fys", "Suffix: utväxt, anatomisk struktur som vuxit fram. (suffix) Av grek. physis = växt, natur. Ex: hypofys; epifys = ändparti på rörben."),
    S("-plasia / -plasi", "Suffix: cell- eller vävnadsbildning. (suffix) Av grek. plasis = formning. Ex: dysplasi = cellförändring; hyperplasi = ökat antal celler; anaplasi."),
    S("-plasm", "Suffix: vävnadsbildning. (suffix) Av grek. plasma = något format. Ex: neoplasm = nybildning, tumör. Jfr -plasma."),
    S("-plasma", "Suffix: formbar biologisk substans, cellsaft. (suffix) Av grek. plasma = något format. Ex: nukleoplasma = cellkärnans saft; blodplasma. Jfr -plasm."),
    S("-plast", "Suffix: cellulär partikel, organell. (suffix) Av grek. plastos = formad. Ex: kloroplast = fotosyntesorganell."),
    S("-plastica / -plastik", "Suffix: kirurgisk rekonstruktion, formning. (suffix) Av grek. plassein = forma. Ex: rinoplastik = näsplastik; hernioplastik = bråckplastik."),
    S("-plegia / -plegi", "Suffix: total förlamning. (suffix) Av grek. plege = slag. Ex: paraplegi = förlamning av underkroppen; tetraplegi; hemiplegi. Jfr -pares."),
    S("-pnea / -pné", "Suffix: andning, andningsmönster. (suffix) Av grek. pnoia = andning. Ex: dyspné = andnöd; takypné = snabb andning; ortopné; apné."),
    S("-poiesis / -poes", "Suffix: bildning, nyproduktion. (suffix) Av grek. poiein = göra, skapa. Ex: erytropoes = bildning av röda blodkroppar; hematopoes."),
    S("-porosis / -poros", "Suffix: sjuklig hålighet, porositet. (suffix) Av grek. poros = por, gång. Ex: osteoporos = benskörhet."),
    S("-praxia / -praxi", "Suffix: handling, utförande av rörelser. (suffix) Av grek. praxis = handling. Ex: apraxi = oförmåga att utföra inlärda rörelser."),
    S("-ptosis / -ptos", "Suffix: framfall, nedsjunkning, hängande organ. (suffix) Av grek. ptosis = fall. Ex: nefroptos = vandrande njure; blefaroptos = hängande ögonlock."),
    S("-ptysis / -ptys", "Suffix: uppspottning, upphostning. (suffix) Av grek. ptysis = spottning. Ex: hemoptys = blodhosta."),
    # --- R ---
    S("-receptor", "Suffix: mottagarmolekyl, mottagarstruktur. (suffix) Av lat. recipere = ta emot. Ex: baroreceptor = tryckkänslig nervände; kemoreceptor."),
    S("-rrhagia / -rragi", "Suffix: kraftigt flöde, häftig blödning. (suffix) Av grek. rhegnynai = brista. Ex: menorragi = riklig mens; hemorragi = blödning."),
    S("-rrhaphia / -rrafi", "Suffix: operativ suturering, sammansömnad. (suffix) Av grek. rhaphe = söm. Ex: perineorrafi = suturering av bristning i bäckenbotten."),
    S("-rrhea / -rré", "Suffix: flytning, vätskande flöde. (suffix) Av grek. rhoia = flöde. Ex: diarré; gonorré; seborré = ökad talgavsöndring."),
    S("-rrhexis / -rrexis", "Suffix: spontan bristning, ruptur av vävnad/organ. (suffix) Av grek. rhexis = bristning. Ex: kolorrexis = tarmbristning; onykorrexis = spruckna naglar."),
    # --- S ---
    S("-sarcoma / -sarkom", "Suffix: malign tumör i stödjevävnad. (suffix) Av grek. sarx (sarkos) = kött. Ex: osteosarkom = bencancer; liposarkom."),
    S("-schisis", "Suffix: medfödd klyvning, spaltbildning. (suffix) Av grek. skhisis = klyvning. Ex: keiloschisis = läppspalt; rachischisis = öppen ryggmärgskanal."),
    S("-sclerosis / -skleros", "Suffix: förhårdnad av vävnad. (suffix) Av grek. skleros = hård. Ex: multipel skleros; ateroskleros = åderförkalkning."),
    S("-scopia / -skopi", "Suffix: undersökning av insidan av ett organ med optik. (suffix) Av grek. skopein = betrakta. Ex: artroskopi = titthålsundersökning av led; gastroskopi. Jfr -skop."),
    S("-scop / -skop", "Suffix: tittinstrument. (suffix) Av grek. skopein = betrakta. Ex: oftalmoskop = ögonspegel; otoskop. Jfr -skopi."),
    S("-soma / -som", "Suffix: cellulär kropp, partikel. (suffix) Av grek. soma = kropp. Ex: ribosom = proteinfabrik; lysosom; kromosom."),
    S("-somia / -somi", "Suffix: kroppslig storleksavvikelse. (suffix) Av grek. soma = kropp. Ex: makrosomi = onormalt stor kropp vid födseln."),
    S("-spasmus / -spasm", "Suffix: ofrivillig kramp i muskulatur. (suffix) Av grek. spasmos = kramp. Ex: laryngospasm = stämbandskramp; blefarospasm = ögonlockskramp."),
    S("-stasis / -stas", "Suffix: stillastående flöde, stagnation. (suffix) Av grek. stasis = stillastående. Ex: kolestas = gallstopp; hemostas = blodstillning."),
    S("-stat", "Suffix: substans eller apparat som hämmar rörelse/tillväxt. (suffix) Av grek. statos = stillastående. Ex: bakteriostatika = medel som hämmar bakterietillväxt; hemostat."),
    S("-stenosis / -stenos", "Suffix: sjuklig förträngning av kanal eller öppning. (suffix) Av grek. stenos = trång. Ex: pylorusstenos = magmunsförträngning; mitralisstenos."),
    S("-sthenia / -steni", "Suffix: styrka, kraft (används oftast negerat). (suffix) Av grek. sthenos = styrka. Ex: se -asteni (svaghet). Jfr -asteni."),
    S("-stigma", "Suffix: punkt, märke, öppning. (suffix) Av grek. stigma = märke, stick. Ex: astigmatism = brytningsfel där ljus inte samlas i en punkt."),
    S("-stoma", "Suffix: anatomisk mun eller por. (suffix) Av grek. stoma = mun, öppning. Ex: nefrostoma = öppning till njurbäckenet. Jfr -stomi."),
    S("-stomia / -stomi", "Suffix: operativt anlagd öppning ut ur kroppen. (suffix) Av grek. stoma = mun, öppning. Ex: trakeostomi = andningshål på halsen; ileostomi. Jfr -stoma."),
    S("-syndrome / -syndrom", "Suffix: samling av sjukdomstecken/symtom. (suffix) Av grek. syndrome = sammanlöpande. Ex: metabolt syndrom."),
    # --- T ---
    S("-tasis", "Suffix: kirurgisk uttänjning, sträckbehandling. (suffix) Av grek. tasis = sträckning. Ex: myotasis = muskelsträckning. Jfr -stas."),
    S("-therapia / -terapi", "Suffix: medicinsk eller fysikalisk behandling. (suffix) Av grek. therapeia = vård. Ex: kemoterapi = cytostatikabehandling; fysioterapi."),
    S("-thelia / -teli", "Suffix: tillstånd rörande bröstvårtor. (suffix) Av grek. thele = bröstvårta. Ex: polyteli = övertaliga bröstvårtor."),
    S("-thermia / -termi", "Suffix: kroppstemperatur. (suffix) Av grek. therme = värme. Ex: hypotermi = nedkylning; hypertermi = överhettning."),
    S("-thrombosis / -trombos", "Suffix: blodproppsbildning. (suffix) Av grek. thrombos = propp. Ex: sinustrombos; ventrombos."),
    S("-tocia / -toki", "Suffix: förlossning, värkarbete. (suffix) Av grek. tokos = födsel. Ex: dystoki = försvårad förlossning."),
    S("-tomia / -tomi", "Suffix: operativt insnitt, klyvning utan borttagande. (suffix) Av grek. tome = snitt. Ex: laparotomi = snitt genom bukväggen; osteotomi. Jfr -ektomi."),
    S("-tonia / -toni", "Suffix: muskelspänning, tryck. (suffix) Av grek. tonos = spänning. Ex: hypertoni = högt blodtryck/ökad muskelspänning; atoni = slapphet; dystoni."),
    S("-toxin", "Suffix: biologiskt eller kemiskt gift. (suffix) Av grek. toxikon = (pil)gift. Ex: endotoxin = bakteriegift; nefrotoxin = njurgift. Jfr -toxikos."),
    S("-toxism / -toxikos", "Suffix: förgiftningstillstånd. (suffix) Av grek. toxikon = gift. Ex: tyreotoxikos = akut överskott av sköldkörtelhormon. Jfr -toxin."),
    S("-tresia / -tresi", "Suffix: hål, öppning (nästan alltid negerat). (suffix) Av grek. tresis = perforering. Ex: atresi = medfödd tillslutning av hålorgan."),
    S("-tripsia / -tripsi", "Suffix: mekanisk krossning av konkrement. (suffix) Av grek. tripsis = krossning. Ex: litotripsi = stenkross med tryckvågor."),
    S("-trophia / -trofi", "Suffix: tillväxt, cellstorlek, näringstillstånd. (suffix) Av grek. trophe = näring. Ex: hypertrofi = förstoring av celler/vävnad. Jfr -atrofi."),
    S("-trophin / -tropin", "Suffix: hormon som stimulerar eller styr ett annat organ. (suffix) Av grek. trophe = näring / tropos = vändning. Ex: gonadotropin; somatotropin = tillväxthormon."),
    S("-tropic / -trop", "Suffix: som har riktning mot, påverkar. (suffix) Av grek. tropos = vändning, riktning. Ex: kronotrop = som påverkar hjärtats rytm; inotrop = som påverkar hjärtats kraft."),
    # --- U ---
    S("-ula / -ulus / -culum", "Suffix: anatomiska diminutivändelser – liten variant av organet. (suffix) Av lat. -ula, -ulus, -culum. Ex: venula = litet venöst kärl; divertikulum = liten utbuktning."),
    S("-uria / -uri", "Suffix: sjuklig förändring i urinen, urinering. (suffix) Av grek. ouron = urin. Ex: hematuri = blod i urinen; glukosuri = socker i urinen; polyuri."),
    # --- V ---
    S("-valva", "Suffix: klaff, ventil. (suffix) Av lat. valva = dörrhalva, klaff. Ex: valvula = liten klaff (t.ex. i ven eller hjärta)."),
    # --- Z ---
    S("-zyme / -zym", "Suffix: enzym, jäsningsämne. (suffix) Av grek. zyme = surdeg, jäsning. Ex: lysozym = bakteriedödande enzym. Jfr prefix zym-."),
]


def main():
    data = json.loads(DATA.read_text(encoding="utf-8"))
    before = len(data)

    # Krocka inte: ingen ny term får redan finnas.
    existing = {e["term"] for e in data}
    clash = [s["term"] for s in SUFFIXES if s["term"] in existing]
    if clash:
        raise SystemExit(f"FEL: nya termer krockar med befintliga: {clash}")

    # Krocka inte internt heller.
    seen = set()
    dup = [s["term"] for s in SUFFIXES if s["term"] in seen or seen.add(s["term"])]
    if dup:
        raise SystemExit(f"FEL: dubbletter i suffix-listan: {dup}")

    # Infoga varje ny post in-place i rätt bokstavsgrupp (strecket ignoreras).
    for new in sorted(SUFFIXES, key=lambda s: sortkey(s["term"])):
        L = group_letter(new["term"])
        k = sortkey(new["term"])
        idx = None
        for i, e in enumerate(data):
            if group_letter(e["term"]) == L and sortkey(e["term"]) > k:
                idx = i
                break
        if idx is None:
            same = [i for i, e in enumerate(data) if group_letter(e["term"]) == L]
            idx = (max(same) + 1) if same else len(data)
        data.insert(idx, new)

    DATA.write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(f"Nya suffix tillagda: {len(SUFFIXES)}")
    print(f"Totalt poster: {before} -> {len(data)}")


if __name__ == "__main__":
    main()
