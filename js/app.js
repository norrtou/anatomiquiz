// ============================================================================
// ORDLISTA — Latinska och medicinska termer som förekommer i quizet
// Källa: Terminologia Anatomica, Nomina Anatomica, svensk medicinsk ordbok
// ============================================================================
const GLOSSARY = [
  { term: 'Abdomen', def: 'Buk; bukhålan och dess innehåll. Sv: buk, mage. Eng: abdomen. Lekman: magen, buken.' },
  { term: 'Abduktion', def: 'Rörelse bort från kroppens mittlinje. Eng: abduction. Motsats: adduktion.' },
  { term: 'Acetabulum', def: 'Höftledsskål i bäckenet; tar emot lårbenshuvudet (caput femoris). Sv: höftledsgrop, höftledspanna, ledpanna. Eng: acetabulum, hip socket.' },
  { term: 'Acromion (akromion)', def: 'Lateralt utskott på skulderbladets ryggrad; bildar skuldertoppen. Sv: akromion. Eng: acromion. Lekman: skuldertoppen.' },
  { term: 'Adduktion', def: 'Rörelse mot kroppens mittlinje. Eng: adduction. Motsats: abduktion.' },
  { term: 'Afferent', def: 'Inkommande; leder nervsignaler från periferin till CNS. Eng: afferent. Lekman: inkommande nervsignal. Motsats: efferent.' },
  { term: 'Aktionspotential', def: 'Elektrisk impuls längs nervfiber som följer allt-eller-inget-principen. Eng: action potential.' },
  { term: 'Alvéolus (alveol)', def: 'Liten urholkning eller luftsäck, t.ex. i lungan där gasutbyte sker. Sv: alveol. Eng: alveolus (pl. alveoli). Lekman: luftsäck, lungblåsa.' },
  { term: 'Anatomisk position', def: 'Standardläget för anatomiska beskrivningar: kroppen stående upprätt, ansiktet framåt, armarna längs sidan med handflatorna vända framåt. Eng: anatomical position.' },
  { term: 'Anterior', def: 'På framsidan; mot buken (synonym: ventral). Sv: framåt, ventral. Eng: anterior, ventral.' },
  { term: 'Anteversion', def: 'Framåttippning av ett organ eller ledhals, t.ex. femurhalsen eller uterus (motsats: retroversion). Eng: anteversion.' },
  { term: 'Aorta', def: 'Kroppens största artär; utgår från vänster hjärtkammare. Eng: aorta. Lekman: stora kroppspulsådern.' },
  { term: 'Arcus', def: 'Båge; bågformig anatomisk struktur. Sv: båge. Eng: arch, arcus.' },
  { term: 'Arteria (artär)', def: 'Blodkärl som leder blod bort från hjärtat. Sv: artär. Eng: artery. Lekman: pulsåder.' },
  { term: 'Articulatio', def: 'Led; anatomisk förbindning mellan ben. Sv: led. Eng: joint, articulation.' },
  { term: 'Atlas (C1)', def: 'Första halskotan; bär upp skallen och artikulerar med nackbenet. Eng: atlas. Lekman: nickarkotan.' },
  { term: 'Atrium', def: 'Förmak; en av hjärtats två övre kamrar. Sv: förmak. Eng: atrium (pl. atria). Lekman: hjärtförmak.' },
  { term: 'Axis (C2)', def: 'Andra halskotan; densutskotet möjliggör rotation av atlas och skallen. Eng: axis. Lekman: vridkotan.' },
  { term: 'Axilla', def: 'Armhåla. Sv: armhåla. Eng: axilla, armpit.' },
  { term: 'Axon', def: 'Nervcellfibern som leder aktionspotentialen bort från cellkroppen. Eng: axon, nerve fiber.' },
  { term: 'Basis', def: 'Bas; nedre eller bredaste delen av en anatomisk struktur. Sv: bas. Eng: base, basis.' },
  { term: 'Biceps', def: 'Tvåhövdad muskel (med två ursprung), t.ex. M. biceps brachii i överarmen. Eng: biceps.' },
  { term: 'Bilateralis', def: 'Bilateral; på båda sidor av kroppen. Sv: bilateral. Eng: bilateral.' },
  { term: 'Brachium', def: 'Överarm. Sv: överarm. Eng: arm, brachium.' },
  { term: 'Brevis', def: 'Kort. Sv: kort. Eng: short, brevis.' },
  { term: 'Bukläge (prone)', def: 'Liggande på magen med ansiktet nedåt; används vid undersökning av rygg och vid intensivvård. Sv: magläge. Eng: prone position.' },
  { term: 'Calcaneus', def: 'Hälben; det största tarsalbenet. Sv: hälben; även: kalkaneus. Eng: calcaneus, heel bone.' },
  { term: 'Canalis', def: 'Kanal; rörformigt hålrum i ben eller vävnad. Sv: kanal. Eng: canal, channel.' },
  { term: 'Capitulum', def: 'Litet huvud; liten avrundad ledyta på ett ben. Eng: capitulum. Lekman: liten ledknöl.' },
  { term: 'Caput', def: 'Huvud; ledhuvudet som passar in i en ledgrop. Sv: huvud. Eng: head, caput.' },
  { term: 'Carpus', def: 'Handrot; de åtta handrotsbenen och deras region. Sv: handrot. Eng: carpus, wrist. Lekman: handleden (vardaglig).' },
  { term: 'Caudal (kaudal)', def: 'Mot svansen; nedåt i kroppen hos människan (synonym: inferior). Sv: kaudal, nedre. Eng: caudal, inferior.' },
  { term: 'Cavitas glenoidalis', def: 'Ledhålan på scapula där humerus sitter i axelleden. Sv: ledpanna, glenoidpanna. Eng: glenoid cavity, glenoid fossa.' },
  { term: 'Central', def: 'Mot centrum; i nervsystemet avser det hjärnan och ryggmärgen (CNS). Eng: central. Motsats: perifer.' },
  { term: 'Cerebellum', def: 'Lillhjärna; koordinerar rörelser, balans och finmotorik. Sv: lillhjärnan. Eng: cerebellum. Lekman: lilla hjärnan (lat: liten hjärna).' },
  { term: 'Cerebrum', def: 'Storhjärna; ansvarar för medvetande, motorik, sensorik och kognition. Sv: storhjärnan. Eng: cerebrum. Lekman: den stora hjärnan.' },
  { term: 'Cervicalis', def: 'Som hör till halsen; cervikala kotor = halskotor (C1–C7). Sv: cervikal. Eng: cervical. Lekman: hals-.' },
  { term: 'Cirkumduktion', def: 'Cirkulär rörelse i en led; kombinerar flexion, extension, abduktion och adduktion. Eng: circumduction.' },
  { term: 'Clavicula', def: 'Nyckelben; förbinder sternum med scapula. Sv: nyckelben; även: klavikel. Eng: clavicle, collarbone.' },
  { term: 'CNS', def: 'Centrala nervsystemet; hjärna och ryggmärg. Eng: central nervous system (CNS). Jfr PNS.' },
  { term: 'Collateralis', def: 'Löpande bredvid; t.ex. collaterala ligament på sidorna av en led. Sv: kollateral. Eng: collateral.' },
  { term: 'Columna vertebralis', def: 'Ryggraden; 33–34 kotor indelade i cervical-, thorakal-, lumbal-, sakral- och coccygealnivå. Sv: ryggrad, kotpelare. Eng: vertebral column, spine, spinal column.' },
  { term: 'Condylus', def: 'Ledknöl; avrundad knöl på ett ben som bildar del av en led. Sv: kondyl. Eng: condyle.' },
  { term: 'Contralateral', def: 'På motsatt sida av kroppen (jfr ipsilateral). Sv: kontralateral. Eng: contralateral.' },
  { term: 'Cor', def: 'Hjärta. Sv: hjärta. Eng: heart.' },
  { term: 'Corpus', def: 'Kropp; den centrala delen av en struktur. Sv: kropp. Eng: body, corpus.' },
  { term: 'Corpus callosum', def: 'Hjärnbalken; nervfiberbunt som förbinder vänster och höger hjärnhalva. Sv: hjärnbalk. Eng: corpus callosum.' },
  { term: 'Cortex', def: 'Bark; yttre lager, t.ex. hjärnbarken (cortex cerebri). Sv: bark, cortex. Eng: cortex.' },
  { term: 'Costa (costae)', def: 'Revben; 12 par revben bildar bröstkorgen. Sv: revben. Eng: rib, costa.' },
  { term: 'Coxa', def: 'Höft; coxaleden = höftleden. Sv: höft. Eng: hip, coxa.' },
  { term: 'Cranial (kranial)', def: 'Mot skallen/huvudet (synonym: superior). Sv: kranial, övre. Eng: cranial, superior.' },
  { term: 'Cranium (kranium)', def: 'Skallen; benskelettstrukturen som omger och skyddar hjärnan. Sv: kranium, skalle. Eng: cranium, skull.' },
  { term: 'Crista', def: 'List eller kam; upphöjd benrand, t.ex. crista iliaca (höftbensskammen). Sv: list, kam. Eng: crest, ridge.' },
  { term: 'Cubitus', def: 'Armbåge. Sv: armbåge. Eng: elbow, cubitus.' },
  { term: 'Cutis (dérma)', def: 'Hud; kroppens yttre skyddande organ. Sv: hud. Eng: skin, cutis, dermis.' },
  { term: 'Dendrit', def: 'Grenformiga utskott på en nervcell som tar emot inkommande signaler. Sv: dendrit. Eng: dendrite.' },
  { term: 'Depression', def: 'Sänkning; nedåtrörelse av en kroppsdel, t.ex. skulderblad. Eng: depression. Motsats: elevation.' },
  { term: 'Deviation (radial/ulnar)', def: 'Sidoböjning av handleden mot tumsidan (radial deviation) eller lillfingersidan (ulnar deviation). Eng: radial/ulnar deviation.' },
  { term: 'Dextrum', def: 'Höger (sida). Sv: höger. Eng: right, dexter.' },
  { term: 'Diaphragma', def: 'Mellangärdet; kupformad andningsmuskel som separerar bröst- och bukhålan. Sv: mellangärde; även stavat: diafragma. Eng: diaphragm. Lekman: andningsmuskeln.' },
  { term: 'Diaphysis', def: 'Benstammens skaft; mittdelen på ett rörben. Sv: diafys. Eng: diaphysis, shaft.' },
  { term: 'Diastole', def: 'Hjärtats avslappnings- och fyllnadsfas. Eng: diastole. Lekman: hjärtats vilofas. Motsats: systole.' },
  { term: 'Digitus', def: 'Finger eller tå. Sv: finger, tå. Eng: digit, finger, toe.' },
  { term: 'Discus', def: 'Skiva, t.ex. intervertebral discus (mellankotsskiva) eller discus articularis (ledskiva). Sv: skiva; även stavat: disk. Eng: disc, disk. Lekman: ryggens disk (vid diskbråck).' },
  { term: 'Distal', def: 'Längre från ursprunget eller kroppens centrum; motsats till proximal. Eng: distal.' },
  { term: 'Dorsal', def: 'Mot baksidan; ovansidan av hand eller fot (synonym: posterior). Sv: dorsal, bakåt. Eng: dorsal, posterior.' },
  { term: 'Dorsalflexion', def: 'Fotleden böjs uppåt; foten dras mot underbenet. Sv: dorsalflexion; även: dorsiflexion. Eng: dorsiflexion.' },
  { term: 'Efferent', def: 'Utgående; leder nervsignaler från CNS till muskler och körtlar. Eng: efferent. Lekman: utgående nervsignal. Motsats: afferent.' },
  { term: 'Elevation', def: 'Höjning; uppåtrörelse av en kroppsdel, t.ex. skulderblad. Eng: elevation. Motsats: depression.' },
  { term: 'Encephalon', def: 'Hjärna; hela hjärnan inklusive storhjärna, lillhjärna och hjärnstam. Sv: hjärna. Eng: encephalon, brain.' },
  { term: 'Epicondylus', def: 'Knöl ovanpå condylus; fäste för muskler, t.ex. på humerus vid armbågen. Sv: epikondyl. Eng: epicondyle.' },
  { term: 'Epiphysis', def: 'Benstammens ände; tillväxtzon i unga ben (epifysplatta). Sv: epifys. Eng: epiphysis. Lekman: benstammens ände.' },
  { term: 'Erytrocyt', def: 'Röd blodkropp; transporterar syre med hjälp av hemoglobin. Sv: röd blodkropp. Eng: erythrocyte, red blood cell (RBC).' },
  { term: 'Eversion', def: 'Rotation av fotsulan utåt. Eng: eversion. Motsats: inversion.' },
  { term: 'Extension', def: 'Sträckning av en led; ökar vinkeln mellan bensegmenten. Eng: extension. Motsats: flexion.' },
  { term: 'Extensor', def: 'Sträckare; muskel som utför extension. Sv: sträckmuskel. Eng: extensor. Motsats: flexor.' },
  { term: 'Externus', def: 'Extern; mot utsidan av ett organ eller en struktur (motsats: internus). Sv: yttre. Eng: external.' },
  { term: 'Extremitas', def: 'Extremitet; arm eller ben. Sv: extremitet, lem. Eng: extremity, limb.' },
  { term: 'Fascia', def: 'Bindvävshinna som omger och separerar muskler och organ. Sv: fascia, bindvävshinna. Eng: fascia.' },
  { term: 'Femur', def: 'Lårben; kroppens längsta och starkaste ben. Sv: lårben. Eng: femur, thigh bone.' },
  { term: 'Fibula', def: 'Vadben; det smala benet på utsidan av underbenet. Sv: vadben. Eng: fibula.' },
  { term: 'Fibular (peroneal)', def: 'På vadbens-/lilltåsidan av underbenet. Sv: fibulär; även kallat: peroneal. Eng: fibular, peroneal.' },
  { term: 'Flexion', def: 'Böjning av en led; minskar vinkeln mellan bensegmenten. Eng: flexion. Motsats: extension.' },
  { term: 'Flexor', def: 'Böjare; muskel som utför flexion. Sv: böjmuskel. Eng: flexor. Motsats: extensor.' },
  { term: 'Foramen', def: 'Hål eller öppning i ben, t.ex. foramen magnum i nackbenet. Sv: hål, öppning. Eng: foramen (pl. foramina).' },
  { term: 'Fossa', def: 'Grop eller fördjupning i en benyta. Sv: grop. Eng: fossa (pl. fossae).' },
  { term: 'Fowlerläge', def: 'Halvsittande ryggläge med överdelen av kroppen höjd 30–90°; används vid andningssvårigheter och i postoperativ vård. Eng: Fowler\'s position.' },
  { term: 'Frontalplan', def: 'Vertikalt plan som delar kroppen i en framre och en bakre del. Sv: koronalplan (synonym). Eng: frontal plane, coronal plane.' },
  { term: 'Genu', def: 'Knä. Sv: knä. Eng: knee, genu.' },
  { term: 'Gliacell', def: 'Stödjande och skyddande cell i nervsystemet, t.ex. oligodendrocyt och schwanncell. Sv: gliacell. Eng: glial cell, neuroglia, glia.' },
  { term: 'Hemoglobin', def: 'Syrebärande protein i de röda blodkropparna (erytrocyterna). Eng: hemoglobin (AmE), haemoglobin (BrE). Förkortning: Hb.' },
  { term: 'Humerus', def: 'Överarmsben; artikulerar med scapula i axelleden och radius/ulna i armbågsleden. Sv: överarmsben. Eng: humerus.' },
  { term: 'Hyperextension', def: 'Sträckning förbi neutral anatomisk position. Sv: översträckning. Eng: hyperextension.' },
  { term: 'Hypotalamus', def: 'Hjärnstruktur som reglerar homeostas, hunger, törst och hormonbalans. Sv: hypotalamus. Eng: hypothalamus.' },
  { term: 'Inferior', def: 'Nedre; mot fötterna (synonym: kaudal). Sv: nedre, kaudal. Eng: inferior, caudal.' },
  { term: 'Intermediär', def: 'Belägen mellan två strukturer; t.ex. mellersta kilbenet (os cuneiforme intermedium) i foten. Eng: intermediate.' },
  { term: 'Internus', def: 'Intern; mot insidan av ett organ eller en struktur (motsats: externus). Sv: inre. Eng: internal.' },
  { term: 'Inversion', def: 'Rotation av fotsulan inåt. Eng: inversion. Motsats: eversion.' },
  { term: 'Inåtrotation', def: 'Rotation av en extremitet mot kroppens mittlinje. Eng: medial rotation, internal rotation. Motsats: utåtrotation.' },
  { term: 'Ipsilateral', def: 'På samma sida av kroppen (jfr contralateral). Sv: ipsilateral. Eng: ipsilateral.' },
  { term: 'Kapillär', def: 'Det minsta blodkärlet; gasutbyte sker här mellan blod och vävnad. Sv: kapillär. Eng: capillary. Lekman: hårkärl.' },
  { term: 'Lateral', def: 'Bort från kroppens mittlinje; mot sidan. Sv: lateral, åt sidan. Eng: lateral.' },
  { term: 'Lateralflexion', def: 'Sidorörelse; böjning av ryggraden eller halsen åt sidan. Eng: lateral flexion, lateral bending.' },
  { term: 'Leukocyt', def: 'Vit blodkropp; ingår i kroppens immunförsvar. Sv: vit blodkropp. Eng: leukocyte, leucocyte, white blood cell (WBC).' },
  { term: 'Ligamentum', def: 'Band av tät bindvävnad som förbinder ben med ben. Sv: ligament, ledband. Eng: ligament. Lekman: ledband.' },
  { term: 'Liquor cerebrospinalis', def: 'Ryggmärgsvätska; skyddar och omger hjärna och ryggmärg. Sv: ryggmärgsvätska, cerebrospinalvätska; vardagligen: likvor. Eng: cerebrospinal fluid (CSF).' },
  { term: 'Litotomiläge', def: 'Ryggläge med höfterna och knäna böjda och benen hållna uppåt; används vid gynekologiska och urologiska ingrepp. Eng: lithotomy position.' },
  { term: 'Lumbalis', def: 'Som hör till ländryggen; lumbala kotor = ländkotor (L1–L5). Sv: lumbal. Eng: lumbar. Lekman: ländryggen.' },
  { term: 'Luxatio', def: 'Urledvridning; dislokation av en led. Sv: luxation, urledvridning. Eng: luxation, dislocation.' },
  { term: 'Malleolus', def: 'Knöl vid ankeln; medial malleolus på tibia, lateral på fibula. Sv: malleol. Eng: malleolus (pl. malleoli). Lekman: inre/yttre fotknölen.' },
  { term: 'Mandibula', def: 'Underkäken. Sv: underkäke. Eng: mandible, lower jaw.' },
  { term: 'Maxilla', def: 'Överkäken. Sv: överkäke. Eng: maxilla, upper jaw.' },
  { term: 'Medial', def: 'Mot kroppens mittlinje. Sv: medial. Eng: medial.' },
  { term: 'Medianplan', def: 'Sagittalplanet som löper exakt i mitten och delar kroppen i lika höger och vänster halvor. Sv: midsagittalplan (synonym). Eng: median plane, midsagittal plane.' },
  { term: 'Medulla', def: 'Märg; t.ex. ryggmärgen (medulla spinalis) eller benmärgen. Sv: märg. Eng: medulla, marrow.' },
  { term: 'Membrana', def: 'Hinna; tunn vävnadshinna. Sv: membran, hinna. Eng: membrane.' },
  { term: 'Meniscus', def: 'Halvmånformig fibrocartilaginös broskskiva, t.ex. i knäleden. Sv: menisk. Eng: meniscus (pl. menisci). Lekman: menisken.' },
  { term: 'Musculus (M.)', def: 'Muskel. Sv: muskel. Eng: muscle.' },
  { term: 'Myelin', def: 'Fettrik isolationshölje kring axon; ökar signalledningshastigheten. Sv: myelin, myelinskida. Eng: myelin, myelin sheath.' },
  { term: 'Neuron', def: 'Nervcell; består av cellkropp, axon och dendriter. Sv: nervcell. Eng: neuron, nerve cell.' },
  { term: 'Nodus Ranvieri', def: 'Avbrott i myelinskidan som möjliggör saltatorisk signalledning. Sv: Ranviers nod, Ranviers insnörning. Eng: node of Ranvier.' },
  { term: 'Obliqt plan', def: 'Diagonalt snittsplan som inte sammanfaller med sagittal-, frontal- eller transversalplanet. Sv: oblikt plan. Eng: oblique plane.' },
  { term: 'Occipitalis', def: 'Som hör till nackbenet; occipital = bakhuvudet. Sv: occipital. Eng: occipital. Lekman: nacke, bakhuvud.' },
  { term: 'Olecranon', def: 'Armbågsknölen; det bakre utskottet på ulna som bildar armbågen. Sv: olekranon, armbågsutskott. Eng: olecranon. Lekman: armbågsspetsen.' },
  { term: 'Omvänt Trendelenburgläge', def: 'Ryggläge med huvud och överkropp höjt och benen sänkta; används t.ex. vid bukkirurgi. Eng: reverse Trendelenburg position.' },
  { term: 'Opposition', def: 'Tummen förs mot fingerspetsarna; exklusivt för primaterna. Eng: opposition. Motsats: reposition.' },
  { term: 'Os (ossa)', def: 'Ben/benen; t.ex. os frontale = pannbenet. Sv: ben. Eng: bone, os.' },
  { term: 'Osteoblast', def: 'Bencell som skapar ny benmatrix och bygger upp ben. Eng: osteoblast. Lekman: benbyggande cell.' },
  { term: 'Osteoklast', def: 'Bencell som bryter ner och resorberar benvävnad. Eng: osteoclast. Lekman: bennedbrytande cell.' },
  { term: 'Osteocyt', def: 'Mogen bencell inuti benvävnaden som underhåller benmatrixen. Eng: osteocyte. Lekman: mogen bencell.' },
  { term: 'Palmar (volar)', def: 'Handflatans sida av handen. Sv: palmar, volar. Eng: palmar, volar. Lekman: handflatan.' },
  { term: 'Parasagittalplan', def: 'Sagittalplan parallellt med medianplanet men inte i kroppens mitt. Eng: parasagittal plane.' },
  { term: 'Parasympaticus', def: 'Del av autonoma nervsystemet; aktiv vid vila, matsmältning och återhämtning. Sv: parasympatikus. Eng: parasympathetic nervous system. Lekman: "rest and digest".' },
  { term: 'Parietal', def: 'Parietalyta; mot kroppsväggen (jfr visceral), t.ex. parietal pleura kläder bröstväggens insida. Sv: parietal, väggblad. Eng: parietal.' },
  { term: 'Patella', def: 'Knäskål; ett sesamben i quadriceps-senan framför knäleden. Sv: knäskål. Eng: patella, kneecap.' },
  { term: 'Perifer', def: 'Belägen i utkanten, långt från centrum; i nervsystemet = utanför hjärna och ryggmärg (jfr central). Eng: peripheral.' },
  { term: 'Pes', def: 'Fot. Sv: fot. Eng: foot, pes.' },
  { term: 'Phalanges', def: 'Finger- och tåben; singularis: phalanx (proximal, medial, distal). Sv: falanger (sg. falang). Eng: phalanges (sg. phalanx). Lekman: fingerknogarna, falangerna.' },
  { term: 'Plantar', def: 'Fotsulans sida av foten. Sv: plantar, fotsula. Eng: plantar. Lekman: undersidan av foten.' },
  { term: 'Plantarflexion', def: 'Fotleden böjs nedåt; att gå på tå eller peka med foten. Eng: plantar flexion, plantarflexion.' },
  { term: 'PNS', def: 'Perifera nervsystemet; alla nerver utanför hjärna och ryggmärg. Eng: peripheral nervous system (PNS). Jfr CNS.' },
  { term: 'Posterior', def: 'På baksidan; mot ryggen (synonym: dorsal). Sv: dorsal, bakåt. Eng: posterior, dorsal.' },
  { term: 'Processus', def: 'Utskott; framskjutande utsprång från ett ben eller organ. Sv: utskott. Eng: process, processus.' },
  { term: 'Profundus', def: 'Djup; långt från ytan (motsats: superficialis). Sv: djup. Eng: deep, profundus.' },
  { term: 'Pronation', def: 'Rotation av underarmen så handflatan vänds nedåt eller bakåt. Eng: pronation. Motsats: supination.' },
  { term: 'Protraktion', def: 'Framåtrörelse av en kroppsdel, t.ex. skulderblad eller käke. Eng: protraction. Motsats: retraktion.' },
  { term: 'Protrusion', def: 'Framskjutning av en struktur, t.ex. diskprotrusion (utbuktning av mellankotsskiva) eller framåtrörelse av underkäken. Eng: protrusion. Lekman: diskbråck (vid diskprotrusion).' },
  { term: 'Proximal', def: 'Närmare ursprunget eller kroppen; motsats till distal. Eng: proximal.' },
  { term: 'Pulmo', def: 'Lunga. Sv: lunga. Eng: lung, pulmo.' },
  { term: 'Radial', def: 'På strålbenets/tumsidans sida av underarmen och handen. Sv: radial, tumsidan. Eng: radial.' },
  { term: 'Radius', def: 'Strålben; det yttre av underarmens ben, på tumsidan. Sv: strålben. Eng: radius.' },
  { term: 'Ramus', def: 'Gren; nervgren eller utskott på ett ben. Sv: gren. Eng: ramus (pl. rami), branch.' },
  { term: 'Reposition', def: 'Återgång till neutral position, t.ex. tummen efter opposition. Eng: reposition. Motsats: opposition.' },
  { term: 'Retraktion', def: 'Bakåtrörelse av en kroppsdel, t.ex. skulderblad eller käke. Eng: retraction. Motsats: protraktion.' },
  { term: 'Retroversion', def: 'Bakåttippning av ett organ, t.ex. uterus retroversus (motsats: anteversion). Eng: retroversion.' },
  { term: 'Retrusion', def: 'Bakåtrörelse av underkäken (synonym: retraktion av mandibula; motsats: protrusion). Eng: retrusion.' },
  { term: 'Rotation', def: 'Vridande rörelse av en kroppsdel kring en axel. Eng: rotation. Se även: inåtrotation, utåtrotation.' },
  { term: 'Ryggläge (supine)', def: 'Liggande på rygg med ansiktet uppåt; standardläge vid många undersökningar och operationer. Sv: ryggläge. Eng: supine position.' },
  { term: 'Sacrum', def: 'Korsbenet; 5 sammanvuxna ryggkotor i bäckenet. Sv: korsben. Eng: sacrum, sacral bone.' },
  { term: 'Sagittalplan', def: 'Lodrätt plan som delar kroppen i vänster och höger delar; flexion och extension sker i detta plan. Eng: sagittal plane.' },
  { term: 'Scapula', def: 'Skulderblad; plattben på bröstkorgens baksida. Sv: skulderblad. Eng: scapula, shoulder blade.' },
  { term: 'Sidoläge', def: 'Liggande på sidan; används bl.a. vid återhämtningsläge och vid undersökning. Eng: lateral position, lateral decubitus.' },
  { term: 'Simsläge', def: 'Halvt bukläge med överkroppen roterad, en arm framåt och knäna lätt böjda; används t.ex. vid rektalundersökning. Eng: Sims\' position.' },
  { term: 'Sinister', def: 'Vänster (sida). Sv: vänster. Eng: left, sinister.' },
  { term: 'Sinusknutan (SA-noden)', def: 'Hjärtats naturliga pacemaker i höger förmak; initierar hjärtats elektriska impuls. Sv: sinusknuta, SA-knutan. Eng: sinoatrial node (SA node).' },
  { term: 'Sternum', def: 'Bröstben; plattben i mitten av bröstkorgens framsida. Sv: bröstben. Eng: sternum, breastbone.' },
  { term: 'Sulcus', def: 'Fåra eller ytlig fördjupning, t.ex. på hjärnans yta eller i benvävnad. Sv: fåra. Eng: sulcus (pl. sulci), groove.' },
  { term: 'Superficialis', def: 'Ytlig; nära ytan (motsats: profundus). Sv: ytlig. Eng: superficial.' },
  { term: 'Superior', def: 'Övre; mot huvudet (synonym: kranial). Sv: övre, kranial. Eng: superior, cranial.' },
  { term: 'Supination', def: 'Rotation av underarmen så handflatan vänds uppåt eller framåt. Eng: supination. Motsats: pronation.' },
  { term: 'Sympaticus', def: 'Del av autonoma nervsystemet; aktiv vid stress och fysisk aktivitet. Sv: sympatikus. Eng: sympathetic nervous system. Lekman: "fight or flight"-systemet.' },
  { term: 'Synaps', def: 'Kontaktzonen där nervsignalen överförs kemiskt från ett neuron till nästa cell. Sv: synaps. Eng: synapse.' },
  { term: 'Synovialis (synovia)', def: 'Ledvätska; smörjer, dämpar och ger näring till ledbrosket. Sv: ledvätska. Eng: synovial fluid. Lekman: ledsmörjning.' },
  { term: 'Talus', def: 'Språngben; tarsalben som bildar ankelleden med tibia och fibula. Sv: språngben. Eng: talus, ankle bone.' },
  { term: 'Tendo (sena)', def: 'Bindvävssträngen som förbinder en muskel med ett ben. Sv: sena. Eng: tendon.' },
  { term: 'Thalamus', def: 'Relästation i hjärnan för sensorisk information på väg till hjärnbarken. Sv: thalamus. Eng: thalamus.' },
  { term: 'Thoracalis', def: 'Som hör till bröstkorgen; thorakala kotor = bröstkotor (T1–T12). Sv: thorakal. Eng: thoracic.' },
  { term: 'Thorax', def: 'Bröstkorg; skelettet av revben, sternum och thorakala kotor. Sv: bröstkorg. Eng: thorax, chest.' },
  { term: 'Tibia', def: 'Skenben; det tjocka, viktbärande benet på insidan av underbenet. Sv: skenben. Eng: tibia, shin bone.' },
  { term: 'Tibial', def: 'På skenbenets/stortåsidan av underbenet. Sv: tibial. Eng: tibial.' },
  { term: 'Transversalplan', def: 'Horisontellt plan som delar kroppen i övre och nedre delar; rotation sker i detta plan. Sv: horisontellt plan. Eng: transverse plane, horizontal plane.' },
  { term: 'Trendelenburgläge', def: 'Ryggläge med sänkt huvud och höjda ben; ökar venöst återflöde till hjärtat och används bl.a. vid chock. Eng: Trendelenburg position.' },
  { term: 'Triceps', def: 'Trehövdad muskel (med tre ursprung), t.ex. M. triceps brachii i överarmens baksida. Eng: triceps.' },
  { term: 'Trochanter', def: 'Stor knöl på lårbenet; fäste för höftens muskler. Sv: trokanter. Eng: trochanter. Lekman: höftknölen (trochanter major = större trokanter; trochanter minor = mindre trokanter).' },
  { term: 'Tuber', def: 'Utbuktning eller knöl på ett ben. Sv: tuber, knöl. Eng: tuber; liten knöl: tuberculum (eng. tubercle).' },
  { term: 'Ulna', def: 'Armbågsben; det inre benet i underarmen på lillfingersidan. Sv: armbågsben. Eng: ulna.' },
  { term: 'Ulnar', def: 'På armbågsbenets/lillfingersida av underarmen och handen. Sv: ulnar, lillfingersidan. Eng: ulnar.' },
  { term: 'Utåtrotation', def: 'Rotation av en extremitet bort från kroppens mittlinje. Eng: lateral rotation, external rotation. Motsats: inåtrotation.' },
  { term: 'Varus', def: 'Sned, indragen mot mitten; t.ex. genu varum = hjulbent knä. Sv: varus. Eng: varus. Lekman: hjulbenthet.' },
  { term: 'Vena (ven)', def: 'Blodkärl som leder blod tillbaka till hjärtat. Sv: ven. Eng: vein, vena. Lekman: blodåder.' },
  { term: 'Vena cava', def: 'Den stora hålvenen; superior leder blod från övre kroppen, inferior från nedre kroppen till höger förmak. Sv: hålven. Eng: vena cava.' },
  { term: 'Ventral', def: 'Mot framsidan/buken (synonym: anterior). Sv: ventral, framåt. Eng: ventral, anterior.' },
  { term: 'Vertebra', def: 'Kotben; ryggraden består av 33–34 kotor. Sv: kota, ryggkota. Eng: vertebra (pl. vertebrae). Lekman: ryggkota.' },
  { term: 'Viscera', def: 'Inälvorna; de inre organen i buk- och bröstkorgen. Sv: inälvor. Eng: viscera, organs.' },
  { term: 'Visceral', def: 'Visceral yta; mot de inre organen (jfr parietal), t.ex. visceral pleura täcker lungans yta. Sv: inälvsblad. Eng: visceral.' },
]

// Get path based on topic
function getQuestionsPath(topic) {
  if (topic === 'osteologi') return './data/ben.json'
  if (topic === 'muskler') return './data/muskler.json'
  if (topic === 'handen') return './data/handen.json'
  if (topic === 'medicinsk_terminologi') return './data/medicinsk_terminologi.json'
  if (topic === 'tentaplugg') return './data/tentaplugg.json'
  if (topic === 'neurologi') return './data/neurologi.json'
  if (topic === 'blodomloppet') return './data/blodomloppet.json'
  // 'blandade' uses loadQuestionsFromMultiplePaths() instead
  return './data/riktningar.json'
}

// Topics that have Hard difficulty questions
const topicsWithHardQuestions = ['handen', 'muskler', 'any_riktningar', 'blandade']

function updateDifficultyOptions() {
  const topic = el('topic').value
  const difficultySelect = el('difficulty')
  const hardOption = difficultySelect.querySelector('option[value="Hard"]')
  const anyOption = difficultySelect.querySelector('option[value="any"]')

  if (topicsWithHardQuestions.includes(topic)) {
    // This topic has Hard questions - enable both Blandat and Svår
    anyOption.disabled = false
    hardOption.disabled = false
    if (difficultySelect.value !== 'any' && difficultySelect.value !== 'Normal' && difficultySelect.value !== 'Hard') {
      difficultySelect.value = 'any'
    }
  } else {
    // This topic doesn't have Hard questions - only Normal is available
    anyOption.disabled = true
    hardOption.disabled = true
    if (difficultySelect.value !== 'Normal') {
      difficultySelect.value = 'Normal'
    }
  }
}

// NOTE: This app will ensure up to MAX_QUESTIONS questions exist by generating
// placeholders for missing entries. Real questions should be imported later
// into the appropriate data files. Placeholders are non-medical and serve only
// to exercise the UI. Do NOT treat placeholders as factual content.
const MAX_QUESTIONS = 500

// LocalStorage key migration: old prefix 'wiil_' → new prefix based on app name
const OLD_FLAGS_KEY = 'wiil_question_flags'
const NEW_FLAGS_KEY = 'hur_question_flags'
const OLD_SCORES_KEY = 'wiil_highscores'
const NEW_SCORES_KEY = 'hur_highscores'

const el = id => document.getElementById(id)

let allQuestions = []
let quizQuestions = []
let currentIdx = 0
let score = 0
let timerInterval = null
let timeLeft = 0

async function loadQuestions(path){
  try {
    const res = await fetch(path)
    if (!res.ok) {
      console.error(`Failed to load questions: ${res.status} ${res.statusText}`)
      allQuestions = []
    } else {
      allQuestions = await res.json()
      console.log(`Loaded ${allQuestions.length} questions from ${path}`)
    }
  } catch(e) {
    console.error(`Error loading questions from ${path}:`, e)
    allQuestions = []
  }
  // Generate placeholders up to MAX_QUESTIONS if needed
  if(allQuestions.length < MAX_QUESTIONS){
    const needed = MAX_QUESTIONS - allQuestions.length
    const startIdx = allQuestions.length + 1
    for(let i=0;i<needed;i++){
      const idx = startIdx + i
      const id = `ph${String(idx).padStart(3,'0')}`
      allQuestions.push({
        id,
        type: 'mc',
        prompt: `Plats för fråga ${idx} (placeholder). Importera riktig fråga senare.`,
        correct: 'Placeholder korrekt svar',
        distractors: ['Placeholder alternativ 1','Placeholder alternativ 2','Placeholder alternativ 3'],
        topic: 'placeholder',
        difficulty: 'easy',
        source: 'placeholder'
      })
    }
  }
}

async function loadQuestionsFromMultiplePaths(paths){
  allQuestions = []
  for(const path of paths){
    try {
      const res = await fetch(path)
      if (!res.ok) {
        console.error(`Failed to load questions: ${res.status} ${res.statusText}`)
      } else {
        const data = await res.json()
        allQuestions = allQuestions.concat(data)
        console.log(`Loaded ${data.length} questions from ${path}`)
      }
    } catch(e) {
      console.error(`Error loading questions from ${path}:`, e)
    }
  }
  console.log(`Total loaded: ${allQuestions.length} questions from all paths`)
}

// Question flags persisted in localStorage: { [id]: { reported: bool, excluded: bool } }
function loadFlags(){
  try{
    // Prefer new key; if missing but old key exists, migrate it.
    let raw = localStorage.getItem(NEW_FLAGS_KEY)
    const oldRaw = localStorage.getItem(OLD_FLAGS_KEY)
    if(!raw && oldRaw){
      // migrate old -> new, then remove old
      raw = oldRaw
      localStorage.setItem(NEW_FLAGS_KEY, raw)
      localStorage.removeItem(OLD_FLAGS_KEY)
    } else if(oldRaw){
      // new exists (or not), but remove old to keep storage clean
      localStorage.removeItem(OLD_FLAGS_KEY)
    }
    return JSON.parse(raw || '{}')
  }catch(e){ return {} }
}

function saveFlags(flags){
  // Write to new key. Keep old key untouched to avoid surprising data loss.
  localStorage.setItem(NEW_FLAGS_KEY, JSON.stringify(flags))
}

function getScores(){
  try{
    let raw = localStorage.getItem(NEW_SCORES_KEY)
    const oldRaw = localStorage.getItem(OLD_SCORES_KEY)
    if(!raw && oldRaw){
      raw = oldRaw
      localStorage.setItem(NEW_SCORES_KEY, raw)
      localStorage.removeItem(OLD_SCORES_KEY)
    } else if(oldRaw){
      localStorage.removeItem(OLD_SCORES_KEY)
    }
    return JSON.parse(raw || '[]')
  }catch(e){ return [] }
}

function saveScores(scores){
  localStorage.setItem(NEW_SCORES_KEY, JSON.stringify(scores))
}

function isExcluded(q){
  const flags = loadFlags()
  return !!(flags[q.id] && flags[q.id].excluded)
}

function setReported(id, val=true){
  const flags = loadFlags();
  if(!flags[id]) flags[id]={}
  flags[id].reported = !!val
  saveFlags(flags)
}

function toggleExcluded(id){
  const flags = loadFlags();
  if(!flags[id]) flags[id]={}
  flags[id].excluded = !flags[id].excluded
  saveFlags(flags)
}

function getSecureRandom() {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return arr[0] / (0xffffffff + 1);
}

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(getSecureRandom() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function sampleWithoutReplacement(arr, n){
  if(n<=0) return []
  const copy = arr.slice()
  shuffle(copy)
  return copy.slice(0, Math.min(n, copy.length))
}

async function startQuiz(){
  const name = el('playerName').value.trim() || 'Spelare'
  const num = parseInt(el('numQuestions').value,10)
  const timePer = parseInt(el('timePerQuestion').value,10) || 0
  const topic = el('topic').value
  const difficulty = el('difficulty').value

  // Load questions based on topic
  if(topic === 'blandade'){
    const paths = [...new Set(
      Array.from(el('topic').options)
        .filter(o => !o.disabled && o.value !== 'blandade')
        .map(o => getQuestionsPath(o.value))
    )]
    await loadQuestionsFromMultiplePaths(paths)
  } else {
    const qsPath = getQuestionsPath(topic)
    await loadQuestions(qsPath)
  }

  const flags = loadFlags()

  // Debug info
  const realQuestions = allQuestions.filter(q => q.source !== 'placeholder')
  const placeholders = allQuestions.filter(q => q.source === 'placeholder')
  console.log(`Total frågor: ${allQuestions.length}, Riktiga: ${realQuestions.length}, Placeholders: ${placeholders.length}`)

  // Exclude questions that are explicitly marked as placeholders so they
  // are not used in quizzes until replaced with real, fact-checked content.
  // Filter by difficulty: 'any' (all), 'Normal' (normal questions), 'Hard' (difficult questions)
  const filtered = allQuestions.filter(q=> {
    const isPlaceholderSource = !!(q.source && String(q.source).toLowerCase()==='placeholder')
    const isPlaceholderId = /^ph\d{3}$/.test(String(q.id))
    if(isPlaceholderSource || isPlaceholderId) return false

    // Handle topic filtering
    let topicMatch = false
    if(topic === 'any') {
      topicMatch = true
    } else if(topic === 'any_riktningar') {
      topicMatch = q.topic === 'riktningar'
    } else if(topic === 'osteologi') {
      topicMatch = q.topic.startsWith('osteologi_')
    } else if(topic === 'muskler') {
      topicMatch = q.topic.startsWith('muskler_')
    } else if(topic === 'handen') {
      topicMatch = q.topic.startsWith('handen_')
    } else if(topic === 'tentaplugg') {
      topicMatch = q.topic.startsWith('studier_')
    } else if(topic === 'neurologi') {
      topicMatch = q.topic.startsWith('nervsystemet_')
    } else if(topic === 'blodomloppet') {
      topicMatch = q.topic.startsWith('blodomloppet_')
    } else if(topic === 'blandade') {
      // Blandade questions include all topics
      topicMatch = true
    } else {
      topicMatch = q.topic === topic
    }

    // Handle difficulty filtering
    let difficultyMatch = true
    if(difficulty === 'Normal') {
      difficultyMatch = q.difficulty === 'Normal'
    } else if(difficulty === 'Hard') {
      difficultyMatch = q.difficulty === 'Hard'
    }
    // 'any' means all difficulties

    return topicMatch && difficultyMatch && !(flags[q.id] && flags[q.id].excluded)
  })
  if(filtered.length===0){
    const msg = realQuestions.length === 0
      ? 'PROBLEM: Inga frågor laddade! Checka browser console (F12).'
      : 'Inga frågor matchar urvalet. Prova en annan kombination.'
    alert(msg)
    return
  }

  // Ensure full randomization: shuffle filtered pool first
  const shuffledFiltered = shuffle(filtered.slice())

  // Separate pools from shuffled filtered
  const tfPool = shuffledFiltered.filter(q=> q.type==='tf')
  const mcPool = shuffledFiltered.filter(q=> q.type==='mc' && (1 + (q.distractors?.length||0)) >=3 && (1 + (q.distractors?.length||0)) <=5)

  const maxTf = Math.floor(num * 0.1)
  const tfCount = Math.min(tfPool.length, maxTf)
  let mcCount = num - tfCount

  // Sample without replacement from shuffled pools
  let tfSelected = sampleWithoutReplacement(tfPool, tfCount)
  let mcSelected = sampleWithoutReplacement(mcPool, mcCount)

  // If not enough MC, try to fill from remaining shuffledFiltered (preserving randomness)
  if(mcSelected.length < mcCount){
    const pickedIds = new Set([...tfSelected, ...mcSelected].map(q=>q.id))
    const remainingPreferred = shuffledFiltered.filter(q=> !pickedIds.has(q.id) && q.type==='mc')
    const add = sampleWithoutReplacement(remainingPreferred, mcCount - mcSelected.length)
    mcSelected = mcSelected.concat(add)
  }

  // If still short, fill from remaining generic pool (no duplicates)
  const totalNeeded = Math.min(num, filtered.length)
  let combined = [...mcSelected, ...tfSelected]
  if(combined.length < totalNeeded){
    const pickedIds = new Set(combined.map(q=>q.id))
    const remaining = shuffledFiltered.filter(q=> !pickedIds.has(q.id))
    const add = sampleWithoutReplacement(remaining, totalNeeded - combined.length)
    combined = combined.concat(add)
  }

  quizQuestions = shuffle(combined).slice(0, totalNeeded)
  currentIdx = 0; score=0
  el('playerLabel').textContent = `${name}`
  el('setup').classList.add('hidden')
  el('highscores').classList.add('hidden')
  el('result').classList.add('hidden')
  el('quiz').classList.remove('hidden')
  el('nextBtn').disabled = true
  el('timer').textContent = timePer>0 ? `Tid: ${timePer}s` : ''
  el('timer').dataset.timePer = timePer
  showQuestion()
}

function showQuestion(){
  clearTimer()
  const q = quizQuestions[currentIdx]
  el('questionArea').textContent = q.prompt
  el('answers').innerHTML = ''
  const options = shuffle([q.correct, ...q.distractors])
  options.forEach((opt, i)=>{
    const b = document.createElement('button')
    b.className = 'answer-btn'
    b.type = 'button'
    b.setAttribute('role','button')
    b.setAttribute('aria-pressed','false')
    b.textContent = opt
    b.addEventListener('click', ()=>selectAnswer(b, opt, q.correct))
    el('answers').appendChild(b)
  })
  el('progress').textContent = `Fråga ${currentIdx+1}/${quizQuestions.length} — Poäng: ${score}`
  // announce for screen readers
  el('progress').setAttribute('aria-live','polite')
  const t = parseInt(el('timer').dataset.timePer,10) || 0
  if(t>0) startTimer(t)
  // focus first answer for keyboard users
  setTimeout(()=>{ const first = el('answers').querySelector('button'); if(first) first.focus() }, 50)
}

function selectAnswer(btn, selected, correct){
  Array.from(el('answers').children).forEach(b=>{b.disabled=true; b.setAttribute('aria-disabled','true')})
  if(selected===correct){
    btn.classList.add('correct'); btn.setAttribute('aria-pressed','true'); score++
  } else { btn.classList.add('wrong');
    // mark correct
    Array.from(el('answers').children).find(b=>b.textContent===correct)?.classList.add('correct')
  }
  el('nextBtn').disabled = false
  el('nextBtn').setAttribute('aria-disabled','false')
  clearTimer()
}

function nextQuestion(){
  currentIdx++
  if(currentIdx>=quizQuestions.length){ finishQuiz(); return }
  el('nextBtn').disabled = true
  showQuestion()
}

function startTimer(sec){
  timeLeft = sec
  el('timer').textContent = `Tid: ${timeLeft}s`
  timerInterval = setInterval(()=>{
    timeLeft--
    el('timer').textContent = `Tid: ${timeLeft}s`
    // Blink rött när under 4 sekunder
    if(timeLeft < 4){
      el('timer').classList.add('warning')
    } else {
      el('timer').classList.remove('warning')
    }
    if(timeLeft<=0){
      clearTimer();
      // auto mark wrong and show correct
      Array.from(el('answers').children).forEach(b=>b.disabled=true)
      const correct = quizQuestions[currentIdx].correct
      Array.from(el('answers').children).find(b=>b.textContent===correct)?.classList.add('correct')
      el('nextBtn').disabled = false
    }
  },1000)
}

function clearTimer(){ if(timerInterval){clearInterval(timerInterval);timerInterval=null} }

function finishQuiz(){
  el('quiz').classList.add('hidden')
  el('result').classList.remove('hidden')
  el('resultText').textContent = `Du fick ${score} av ${quizQuestions.length} rätt.`
  el('saveName').value = el('playerName').value || 'Spelare'
  el('resultText').setAttribute('aria-live','polite')
}

function saveScore(){
  const name = el('saveName').value || 'Spelare'
  const scores = getScores()
  scores.push({name,score, total:quizQuestions.length, date: new Date().toISOString()})
  scores.sort((a,b)=> (b.score/b.total) - (a.score/a.total))
  saveScores(scores.slice(0,50))
  showHighscores()
}

function showHighscores(){
  el('setup').classList.add('hidden')
  el('quiz').classList.add('hidden')
  el('result').classList.add('hidden')
  el('highscores').classList.remove('hidden')
  const scores = getScores()
  const ol = el('scoreList'); ol.innerHTML=''
  scores.forEach(s=>{
    const li = document.createElement('li')
    const pct = Math.round((s.score/s.total)*100)
    li.textContent = `${s.name} — ${s.score}/${s.total} (${pct}%) — ${new Date(s.date).toLocaleString()}`
    ol.appendChild(li)
  })
  // focus the list for keyboard users
  setTimeout(()=>{ el('scoreList').focus?.() },50)
}

function clearScores(){
  // Remove both keys to ensure old and new keys are cleared
  localStorage.removeItem(NEW_SCORES_KEY)
  localStorage.removeItem(OLD_SCORES_KEY)
  showHighscores()
}

// Render management UI for up to MAX_QUESTIONS questions
function renderManage(){
  const container = el('manageList')
  container.innerHTML = ''
  const flags = loadFlags()
  const list = document.createElement('div')
  list.className = 'manage-grid'
  allQuestions.slice(0, MAX_QUESTIONS).forEach(q=>{
    const row = document.createElement('div')
    row.className = 'manage-row'
    const title = document.createElement('div')
    title.className = 'manage-title'
    title.textContent = `[${q.id}] ${q.prompt}`
    // Visual badge for placeholders
    const isPlaceholder = (q.source && String(q.source).toLowerCase()==='placeholder') || /^ph\d{3}$/.test(String(q.id))
    if(isPlaceholder){
      const badge = document.createElement('span')
      badge.className = 'badge placeholder'
      badge.textContent = 'Platshållare'
      title.appendChild(badge)
    }
    const controls = document.createElement('div')
    controls.className = 'manage-controls'
    const rep = document.createElement('label')
    const repCb = document.createElement('input')
    repCb.type='checkbox'
    repCb.checked = !!(flags[q.id] && flags[q.id].reported)
    repCb.addEventListener('change', ()=>{ setReported(q.id, repCb.checked) })
    rep.appendChild(repCb); rep.appendChild(document.createTextNode(' Felaktig'))

    const exc = document.createElement('label')
    const excCb = document.createElement('input')
    excCb.type='checkbox'
    excCb.checked = !!(flags[q.id] && flags[q.id].excluded)
    excCb.addEventListener('change', ()=>{ toggleExcluded(q.id) })
    exc.appendChild(excCb); exc.appendChild(document.createTextNode(' Uteslut'))

    controls.appendChild(rep)
    controls.appendChild(document.createTextNode(' '))
    controls.appendChild(exc)
    row.appendChild(title)
    row.appendChild(controls)
    list.appendChild(row)
  })
  container.appendChild(list)
}

// Handle import of JSON questions. This merges imported questions into in-memory list
// and updates the management UI. It does NOT write to `data/questions.json` on disk.
// If you want to persist to disk, download the merged JSON and replace the file manually.
function handleImportFile(ev){
  const f = ev.target.files && ev.target.files[0]
  if(!f) return
  const reader = new FileReader()
  reader.onload = ()=>{
    try{
      const parsed = JSON.parse(reader.result)
      if(!Array.isArray(parsed)){ alert('Fel format: förväntar en array av frågor.'); return }
      const existingIds = new Set(allQuestions.map(q=>q.id))
      const added = []
      const skipped = []
      parsed.forEach(q=>{
        if(!q.id || !q.prompt) { skipped.push({q,reason:'saknar id eller prompt'}); return }
        if(existingIds.has(q.id)){ skipped.push({id:q.id,reason:'dublett id'}); return }
        // minimal acceptance: keep as-is (do not invent facts).
        allQuestions.push(q); existingIds.add(q.id); added.push(q.id)
      })
      alert(`Import klar. Tillagda: ${added.length}. Skippade: ${skipped.length}.`)
      renderManage()
    }catch(e){ alert('Kunde inte läsa JSON: '+e.message) }
  }
  reader.readAsText(f, 'utf-8')
}

function showInfo() {
  el('setup').classList.add('hidden')
  el('quiz').classList.add('hidden')
  el('result').classList.add('hidden')
  el('highscores').classList.add('hidden')
  el('info').classList.remove('hidden')
  loadChangelog()
}

async function loadChangelog() {
  const container = el('changelogContent')
  if (container.dataset.loaded) return
  container.innerHTML = '<p class="changelog-loading">Laddar ändringslogg…</p>'
  try {
    const res = await fetch('./CHANGELOG.md')
    if (!res.ok) throw new Error()
    const text = await res.text()
    container.innerHTML = renderChangelog(text)
    container.dataset.loaded = '1'
  } catch {
    container.innerHTML = '<p class="changelog-loading">Kunde inte ladda ändringslogg.</p>'
  }
}

function renderChangelog(text) {
  const entries = []
  let current = null

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trimEnd()
    if (line.startsWith('## ')) {
      if (current) entries.push(current)
      current = { version: line.slice(3).trim(), items: [] }
    } else if (current && line.startsWith('- ')) {
      current.items.push(line.slice(2).trim())
    }
  }
  if (current) entries.push(current)

  const recent = entries.slice(0, 20)
  if (!recent.length) return '<p class="changelog-loading">Ingen ändringslogg hittades.</p>'

  return recent.map(e => {
    const itemsHtml = e.items.length
      ? e.items.map(i => `<div class="cl-item">– ${i}</div>`).join('')
      : ''
    return `<div class="changelog-entry">
      <div class="changelog-version">v${e.version}</div>
      <div class="cl-body">${itemsHtml}</div>
    </div>`
  }).join('')
}

function renderGlossary(filter) {
  const container = el('glossaryContent')
  const q = (filter || '').toLowerCase().trim()
  const terms = q
    ? GLOSSARY.filter(e =>
        e.term.toLowerCase().includes(q) ||
        e.def.toLowerCase().includes(q)
      )
    : GLOSSARY

  if (!terms.length) {
    container.innerHTML = '<p class="glossary-empty">Inga träffar.</p>'
    return
  }

  // Group alphabetically by first letter of term
  const groups = {}
  terms.forEach(e => {
    const letter = e.term[0].toUpperCase()
    if (!groups[letter]) groups[letter] = []
    groups[letter].push(e)
  })

  let html = ''
  Object.keys(groups).sort().forEach(letter => {
    html += `<div class="glossary-letter">${letter}</div>`
    groups[letter].forEach(e => {
      html += `<div class="glossary-entry"><span class="glossary-term">${e.term}</span><span class="glossary-def">${e.def}</span></div>`
    })
  })
  container.innerHTML = html
}

function showGlossary() {
  el('setup').classList.add('hidden')
  el('quiz').classList.add('hidden')
  el('result').classList.add('hidden')
  el('highscores').classList.add('hidden')
  el('info').classList.add('hidden')
  el('glossary').classList.remove('hidden')
  el('glossarySearch').value = ''
  renderGlossary('')
}

function cancelQuiz(){
  if(confirm('Är du säker? Ditt resultat sparas inte.')) {
    el('quiz').classList.add('hidden')
    el('setup').classList.remove('hidden')
    el('result').classList.add('hidden')
    el('highscores').classList.add('hidden')
    clearTimer()
  }
}

async function loadVersion() {
  try {
    const res = await fetch('./VERSION')
    if (!res.ok) return
    const text = (await res.text()).trim()
    const el_ = document.getElementById('appVersion')
    if (el_) el_.textContent = 'v' + text
  } catch {}
}

function init(){
  loadVersion()
  loadQuestions().then(()=>console.log('Frågor laddade:', allQuestions.length))
  el('startBtn').addEventListener('click', startQuiz)
  el('cancelBtn').addEventListener('click', cancelQuiz)
  el('nextBtn').addEventListener('click', nextQuestion)
  el('saveScore').addEventListener('click', saveScore)
  el('restart').addEventListener('click', ()=>{el('result').classList.add('hidden');el('setup').classList.remove('hidden')})
  el('viewScores').addEventListener('click', showHighscores)
  el('viewInfo').addEventListener('click', showInfo)
  el('backFromInfo').addEventListener('click', () => { el('info').classList.add('hidden'); el('setup').classList.remove('hidden') })
  el('viewGlossary').addEventListener('click', showGlossary)
  el('backFromGlossary').addEventListener('click', () => { el('glossary').classList.add('hidden'); el('setup').classList.remove('hidden') })
  el('glossarySearch').addEventListener('input', e => renderGlossary(e.target.value))
  el('saveManage').addEventListener('click', ()=>{ alert('Ändringar sparade (sparas automatiskt).'); renderManage() })
  const imp = el('importFile')
  if(imp) imp.addEventListener('change', handleImportFile)
  el('backToSetup').addEventListener('click', ()=>{el('highscores').classList.add('hidden');el('setup').classList.remove('hidden')})
  el('clearScores').addEventListener('click', ()=>{ if(confirm('Rensa topplista?')) clearScores() })

  // Update difficulty options when topic changes
  el('topic').addEventListener('change', updateDifficultyOptions)
  updateDifficultyOptions() // Initial state
}

document.addEventListener('DOMContentLoaded', init)
