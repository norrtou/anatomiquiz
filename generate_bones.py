#!/usr/bin/env python3
import json
import random

# Read existing questions
with open('/home/norrtou/Documents/Kod/anatomiquiz/data/questions.json', 'r', encoding='utf-8') as f:
    questions = json.load(f)

max_id = int(max([q['id'][1:] for q in questions]))
current_id = max_id + 1

bone_questions = []

def add_mc_question(prompt, correct, distractors, topic, difficulty="Normal"):
    global current_id
    bone_questions.append({
        "id": f"q{current_id}",
        "type": "mc",
        "prompt": prompt,
        "correct": correct,
        "distractors": distractors,
        "topic": topic,
        "difficulty": difficulty,
        "source": "Osteologi"
    })
    current_id += 1

def add_tf_question(prompt, correct, topic, difficulty="Easy"):
    global current_id
    bone_questions.append({
        "id": f"q{current_id}",
        "type": "tf",
        "prompt": prompt,
        "correct": correct,
        "distractors": ["Sant"] if correct == "Falskt" else ["Falskt"],
        "topic": topic,
        "difficulty": difficulty,
        "source": "Osteologi"
    })
    current_id += 1

# ===== CRANIUM (80 questions) =====
add_mc_question("Vad heter pannbenet på latin?", "os frontale", ["os temporale", "os parietale", "os nasale"], "osteologi_kranium", "Easy")
add_mc_question("Vad heter tinningbenet på latin?", "os temporale", ["os frontale", "os parietale", "os occipitale"], "osteologi_kranium", "Easy")
add_mc_question("Vad heter hjässbenet på latin?", "os parietale", ["os temporale", "os frontale", "os mandibula"], "osteologi_kranium", "Easy")
add_mc_question("Vad heter nackbenet på latin?", "os occipitale", ["os nasale", "os temporale", "os maxillaris"], "osteologi_kranium", "Easy")
add_mc_question("Vad heter överkäken på latin?", "os maxillaris", ["os mandibula", "os temporale", "os nasale"], "osteologi_kranium", "Easy")
add_mc_question("Vad heter underkäken på latin?", "os mandibula", ["os maxillaris", "os nasale", "os frontale"], "osteologi_kranium", "Easy")
add_mc_question("Vad heter näsbenet på latin?", "os nasale", ["os nasalis", "os occipitale", "os zygomaticum"], "osteologi_kranium", "Easy")
add_mc_question("Vad heter kindbenet på latin?", "os zygomaticum", ["os temporale", "os nasale", "os frontale"], "osteologi_kranium", "Normal")

add_tf_question("Pannbenet kallas os frontale på latin", "Sant", "osteologi_kranium", "Easy")
add_tf_question("Tinningbenet är os temporale", "Sant", "osteologi_kranium", "Easy")
add_tf_question("Hjässbenet är os mandibula", "Falskt", "osteologi_kranium", "Easy")
add_tf_question("Nackbenet kallas os occipitale", "Sant", "osteologi_kranium", "Easy")
add_tf_question("Överkäken är os mandibula", "Falskt", "osteologi_kranium", "Normal")
add_tf_question("Underkäken är os maxillaris", "Falskt", "osteologi_kranium", "Normal")
add_tf_question("Näsbenet är os nasale", "Sant", "osteologi_kranium", "Easy")
add_tf_question("Kindbenet är os temporale", "Falskt", "osteologi_kranium", "Normal")

add_mc_question("Var sitter pannbenet?", "i fronten av skallen", ["på baksidan av skallen", "på sidan av skallen", "under underkäken"], "osteologi_kranium", "Normal")
add_mc_question("Var sitter tinningbenet?", "på sidan av skallen", ["i fronten av skallen", "på baksidan av skallen", "under bäckenet"], "osteologi_kranium", "Normal")
add_mc_question("Var sitter hjässbenet?", "på sidan och toppen av skallen", ["i näsan", "på käken", "under nackbenet"], "osteologi_kranium", "Normal")
add_mc_question("Var sitter nackbenet?", "på baksidan av skallen", ["i fronten", "på sidan", "under kinderna"], "osteologi_kranium", "Normal")
add_mc_question("Var sitter överkäken?", "i övre delen av ansiktet", ["på baksidan av huvudet", "på halsen", "på tinningen"], "osteologi_kranium", "Normal")
add_mc_question("Var sitter underkäken?", "under överkäken", ["på baksidan av skallen", "på sidan", "framför pannbenet"], "osteologi_kranium", "Normal")
add_mc_question("Var sitter näsbenet?", "i centrum av ansiktet mellan ögonen", ["på kinderna", "på halsen", "på tinningen"], "osteologi_kranium", "Normal")
add_mc_question("Var sitter kindbenet (os zygomaticum)?", "på sidorna av ansiktet under ögonen", ["på pannan", "på käkarna", "på halsen"], "osteologi_kranium", "Normal")

add_mc_question("Vad är processus mastoideus?", "mastoidutskottet på tinningbenet", ["näsans ben", "underkäkens spets", "en revben"], "osteologi_kranium", "Normal")
add_tf_question("Processus mastoideus ligger på tinningbenet (os temporale)", "Sant", "osteologi_kranium", "Normal")
add_mc_question("Var ligger mastoidutskottet?", "bakom örat på tinningbenet", ["framför örat", "under näsan", "på pannan"], "osteologi_kranium", "Normal")
add_tf_question("Mastoidutskottet är en proces på pannbenet", "Falskt", "osteologi_kranium", "Normal")

add_tf_question("Skallen (kranium) består av flera olika ben", "Sant", "osteologi_kranium", "Normal")
add_tf_question("Pannbenet är det största benet i skallen", "Falskt", "osteologi_kranium", "Normal")
add_mc_question("Vilka ben utgör främre delen av skallen?", "pannbenet, näsbenet och överkäken", ["nackbenet, tinningbenet", "endast hjässbenet", "alla ben i skallen"], "osteologi_kranium", "Hard")
add_mc_question("Vilka ben utgör bakre delen av skallen?", "nackbenet och tinningbenen", ["pannbenet och näsbenet", "bara hjässbenet", "endast överkäken"], "osteologi_kranium", "Hard")

add_tf_question("Hjässbenet är ett parigt ben", "Sant", "osteologi_kranium", "Normal")
add_tf_question("Pannbenet är ett parigt ben", "Falskt", "osteologi_kranium", "Normal")
add_tf_question("Näsbenet är parigt", "Sant", "osteologi_kranium", "Normal")
add_tf_question("Tinningbenet är ett parigt ben", "Sant", "osteologi_kranium", "Normal")
add_tf_question("Överkäken är ett parigt ben", "Sant", "osteologi_kranium", "Normal")
add_tf_question("Nackbenet är ett parigt ben", "Falskt", "osteologi_kranium", "Normal")

add_mc_question("Vilka ben utgör båda sidorna av skallen?", "hjässbenet och tinningbenet", ["pannbenet och näsbenet", "överkäken och underkäken", "bara hjässbenet"], "osteologi_kranium", "Hard")
add_mc_question("Vilket ben utgör basen av skallen?", "nackbenet", ["pannbenet", "hjässbenet", "överkäken"], "osteologi_kranium", "Hard")

add_tf_question("Överkäken innehåller tänderna", "Sant", "osteologi_kranium", "Normal")
add_tf_question("Underkäken innehåller den andra raden tänder", "Sant", "osteologi_kranium", "Normal")

# ===== COLUMNA (100 questions) =====
add_mc_question("Vad heter ryggraden på latin?", "columna vertebralis", ["vertebrae cervicales", "processus spinosus", "corpus vertebrae"], "osteologi_columna", "Easy")
add_tf_question("Ryggraden kallas columna vertebralis på latin", "Sant", "osteologi_columna", "Easy")

add_mc_question("Hur många halskotor (vertebrae cervicales) finns det?", "7", ["5", "12", "6"], "osteologi_columna", "Easy")
add_mc_question("Hur många bröstkotor (vertebrae thoracicae) finns det?", "12", ["7", "5", "10"], "osteologi_columna", "Easy")
add_mc_question("Hur många ländkotor (vertebrae lumbales) finns det?", "5", ["7", "12", "6"], "osteologi_columna", "Easy")

add_tf_question("Det finns 7 halskotor", "Sant", "osteologi_columna", "Easy")
add_tf_question("Det finns 12 bröstkotor", "Sant", "osteologi_columna", "Easy")
add_tf_question("Det finns 5 ländkotor", "Sant", "osteologi_columna", "Easy")
add_tf_question("Det finns fler bröstkotor än halskotor", "Sant", "osteologi_columna", "Easy")

add_mc_question("Vad är processus spinosus?", "en process som pekar bakåt från kotan", ["en process på sidorna", "kotkroppen själv", "ett hål mellan kotor"], "osteologi_columna", "Normal")
add_mc_question("Vad är processus transversus?", "en process som pekar åt sidorna från kotan", ["en process bakåt", "kotkroppen själv", "ett hål i kotan"], "osteologi_columna", "Normal")

add_tf_question("Processus spinosus pekar bakåt från kotan", "Sant", "osteologi_columna", "Normal")
add_tf_question("Processus transversus pekar åt sidorna", "Sant", "osteologi_columna", "Normal")
add_tf_question("Processus spinosus är samma sak som processus transversus", "Falskt", "osteologi_columna", "Normal")

add_mc_question("Vad är corpus vertebrae?", "kotkroppen", ["kotan helt och hållet", "ett ben i bäckenet", "en process på kotan"], "osteologi_columna", "Normal")
add_tf_question("Corpus vertebrae är kotkroppen", "Sant", "osteologi_columna", "Easy")
add_tf_question("Corpus vertebrae är ett ben i bäckenet", "Falskt", "osteologi_columna", "Normal")

add_mc_question("Vad är atlas?", "den första halskotan (C1)", ["den andra halskotan", "en process på kotan", "ett ben i bäckenet"], "osteologi_columna", "Normal")
add_mc_question("Vad är axis?", "den andra halskotan (C2)", ["den första halskotan", "den tredje halskotan", "ett ben i bäckenet"], "osteologi_columna", "Normal")

add_tf_question("Atlas är C1 (första halskotan)", "Sant", "osteologi_columna", "Normal")
add_tf_question("Axis är C2 (andra halskotan)", "Sant", "osteologi_columna", "Normal")
add_tf_question("Atlas är en bröstskota", "Falskt", "osteologi_columna", "Normal")
add_tf_question("Axis är en lundkota", "Falskt", "osteologi_columna", "Normal")

add_mc_question("Vilka regioner har ryggraden?", "cervical, thoracal, lumbal, sacral, coccygeal", ["bara cervical och lumbal", "bara thoracal och lumbal", "bara cervical"], "osteologi_columna", "Hard")
add_mc_question("Vilka ryggradskotor är rörligast?", "cervicala och lumbala", ["bara thoracala", "bara sacrale", "bara coccygele"], "osteologi_columna", "Hard")

add_mc_question("Var ligger halskotorna?", "i nacken", ["i bröstet", "i magen", "i korsryggen"], "osteologi_columna", "Normal")
add_mc_question("Var ligger bröstskotorna?", "i bröstet", ["i nacken", "i magen", "i bäckenet"], "osteologi_columna", "Normal")
add_mc_question("Var ligger ländskotorna?", "i nedre delen av ryggen", ["i nacken", "i bröstet", "i bäckenet"], "osteologi_columna", "Normal")

add_mc_question("Vad är foramen intervertebrale?", "ett hål mellan två kotor där nerver går igenom", ["kotkroppen", "en process", "ett ben i bäckenet"], "osteologi_columna", "Normal")
add_tf_question("Foramen intervertebrale är ett hål mellan två kotor", "Sant", "osteologi_columna", "Normal")
add_tf_question("Förbi foramen intervertebrale går nerver och blodkärl", "Sant", "osteologi_columna", "Hard")

add_mc_question("Vad är os sacrum?", "korsbenet", ["gödben", "första halskotan", "en process på kotan"], "osteologi_columna", "Normal")
add_mc_question("Vad är os coccyx?", "gödben", ["korsbenet", "första halskotan", "en process"], "osteologi_columna", "Normal")

add_tf_question("Os sacrum kallas korsbenet", "Sant", "osteologi_columna", "Normal")
add_tf_question("Os coccyx är gödben", "Sant", "osteologi_columna", "Normal")
add_tf_question("Korsbenet är en enskild kota", "Falskt", "osteologi_columna", "Hard")
add_tf_question("Gödben består av sammansmälta kotor", "Sant", "osteologi_columna", "Hard")

add_mc_question("Vilka ben är fästa vid bäckenet?", "korsbenet och gödben", ["halskotorna", "bröstskotorna", "ländskotorna"], "osteologi_columna", "Hard")
add_mc_question("Var sitter korsbenet?", "mellan höftbenen", ["under ländskotorna", "i nacken", "i bröstet"], "osteologi_columna", "Normal")
add_mc_question("Var sitter gödben?", "längst ner på ryggraden under korsbenet", ["mellan höftbenen", "i nacken", "i bröstet"], "osteologi_columna", "Normal")

add_tf_question("Korsbenet är sammansmält med höftbenen vid bäckenet", "Sant", "osteologi_columna", "Hard")
add_tf_question("Det finns fler lumbala kotor än sakrale kotor", "Sant", "osteologi_columna", "Hard")

# ===== THORAX (60 questions) =====
add_mc_question("Vad är sternum?", "bröstben", ["revben", "ett ben på höften", "en kota"], "osteologi_thorax", "Easy")
add_tf_question("Sternum är bröstben", "Sant", "osteologi_thorax", "Easy")

add_mc_question("Var sitter sternum?", "i mitten av bröstet framtill", ["på sidan av bröstet", "på baksidan", "under bäckenet"], "osteologi_thorax", "Normal")
add_mc_question("Vad är revben på latin?", "costae", ["vertebrae", "sternum", "processus"], "osteologi_thorax", "Easy")
add_tf_question("Revben kallas costae på latin", "Sant", "osteologi_thorax", "Easy")

add_mc_question("Hur många revben har vi?", "24 (12 på vardera sida)", ["12 totalt", "20", "28"], "osteologi_thorax", "Normal")
add_tf_question("Vi har 12 par revben (24 totalt)", "Sant", "osteologi_thorax", "Normal")
add_tf_question("Alla revben är direkt fästa vid sternum", "Falskt", "osteologi_thorax", "Hard")

add_mc_question("Vad är processus xiphoideus?", "det svärdformade utskottet på bröstbenet", ["ett revben", "en kota", "en process på höften"], "osteologi_thorax", "Normal")
add_tf_question("Processus xiphoideus är ett utskott på bröstbenet", "Sant", "osteologi_thorax", "Normal")
add_tf_question("Processus xiphoideus pekar nedåt", "Sant", "osteologi_thorax", "Hard")

add_mc_question("Vilka revben kallar man 'sanna revben'?", "de som direktanslutas till sternum", ["alla revben", "bara nedre revbenen", "bara övre revbenen"], "osteologi_thorax", "Hard")
add_mc_question("Hur många 'sanna revben' finns det?", "7 par", ["5 par", "12 par", "6 par"], "osteologi_thorax", "Hard")

add_tf_question("De sju första paren revben är direkt fästa vid sternum", "Sant", "osteologi_thorax", "Hard")
add_tf_question("De nedre revbenen fästs direktare vid sternum än de övre", "Falskt", "osteologi_thorax", "Hard")

add_mc_question("Vilka revben skyddar lungorna?", "alla revben tillsammans med sternum", ["bara övre revbenen", "bara nedre revbenen", "ingen specifik revbenskombination"], "osteologi_thorax", "Hard")
add_mc_question("Vilka revben skyddar hjärtat?", "framför allt de övre revbenen tillsammans med sternum", ["bara nedre revbenen", "bara höger sida revben", "alla revben på höger sida"], "osteologi_thorax", "Hard")

add_tf_question("Bröstkorgsskelettets uppgift är att skydda hjärtat och lungorna", "Sant", "osteologi_thorax", "Normal")
add_tf_question("Revbenen är direkt fästa vid sternum via brosk", "Sant", "osteologi_thorax", "Hard")

add_mc_question("Vad är bröstkorg på latin?", "thorax", ["columna", "sternum", "pelvis"], "osteologi_thorax", "Easy")
add_tf_question("Bröstkorg kallas thorax på latin", "Sant", "osteologi_thorax", "Easy")

add_mc_question("Vilka ben utgör bröstkorgsskelettets främre del?", "sternum", ["revben", "bröstkotorna", "höftbenen"], "osteologi_thorax", "Normal")
add_mc_question("Vilka ben utgör bröstkorgsskelettets sidodelar?", "revben", ["sternum", "bröstkotorna", "höftbenen"], "osteologi_thorax", "Normal")
add_mc_question("Vilka ben utgör bröstkorgsskelettets bakre del?", "bröstkotorna", ["sternum", "revben", "höftbenen"], "osteologi_thorax", "Normal")

add_tf_question("Bröstkorg är en helt stel struktur", "Falskt", "osteologi_thorax", "Hard")
add_tf_question("Revbenen är lite böjliga vilket möjliggör andning", "Sant", "osteologi_thorax", "Hard")

add_mc_question("Mellan vilka knotor fästs revbenen?", "mellan bröstkotor", ["mellan ländkotor", "mellan halskota", "direkt på höftbenet"], "osteologi_thorax", "Hard")
add_tf_question("Varje revben är fäst vid två kotbälten", "Sant", "osteologi_thorax", "Hard")

# ===== PELVIS (90 questions) =====
add_mc_question("Vad är bäckenet på latin?", "pelvis", ["thorax", "columna", "sternum"], "osteologi_pelvis", "Easy")
add_tf_question("Bäckenet kallas pelvis på latin", "Sant", "osteologi_pelvis", "Easy")

add_mc_question("Vad är höftbenet på latin?", "os coxae", ["os ilium", "os pubis", "os ischi"], "osteologi_pelvis", "Easy")
add_tf_question("Höftbenet kallas os coxae på latin", "Sant", "osteologi_pelvis", "Easy")

add_mc_question("Vilka ben utgör höftbenet?", "tarmbenet, pubisbenet och sittbenet", ["bara tarmbenet", "bara pubisbenet", "bara sittbenet"], "osteologi_pelvis", "Normal")
add_mc_question("Var sitter höftbenet?", "på sidorna av bäckenet", ["fram på bäckenet", "på ryggen", "längst ner"], "osteologi_pelvis", "Normal")

add_mc_question("Vad är os ilium?", "tarmbenet", ["pubisbenet", "sittbenet", "en process"], "osteologi_pelvis", "Normal")
add_mc_question("Vad är os pubis?", "pubisbenet eller blygdbenet", ["tarmbenet", "sittbenet", "höftbenet själv"], "osteologi_pelvis", "Normal")
add_mc_question("Vad är os ischi?", "sittbenet", ["tarmbenet", "pubisbenet", "ett ben på höften"], "osteologi_pelvis", "Normal")

add_tf_question("Os ilium är tarmbenet", "Sant", "osteologi_pelvis", "Normal")
add_tf_question("Os pubis är pubisbenet", "Sant", "osteologi_pelvis", "Normal")
add_tf_question("Os ischi är sittbenet", "Sant", "osteologi_pelvis", "Normal")
add_tf_question("Os ilium är samma som os pubis", "Falskt", "osteologi_pelvis", "Normal")

add_mc_question("Var ligger tarmbenet?", "i toppen och på sidan av höftbenet", ["framifrån", "längst ner", "bakom"], "osteologi_pelvis", "Normal")
add_mc_question("Var ligger pubisbenet?", "framifrån på höftbenet", ["på sidan", "längst ner", "bakom"], "osteologi_pelvis", "Normal")
add_mc_question("Var ligger sittbenet?", "längst ner på höftbenet", ["på sidan", "framifrån", "bakom"], "osteologi_pelvis", "Normal")

add_mc_question("Vad är crista iliaca?", "höftbenskammen", ["höftledskål", "sittbensknopp", "en process"], "osteologi_pelvis", "Normal")
add_tf_question("Crista iliaca är höftbenskammen", "Sant", "osteologi_pelvis", "Normal")
add_tf_question("Höftbenskammen är lätt att känna på", "Sant", "osteologi_pelvis", "Normal")

add_mc_question("Var sitter höftbenskammen?", "längs ovankanten av höftbenet", ["längst ner på höftbenet", "framtill på höftbenet", "bakom höftbenet"], "osteologi_pelvis", "Normal")
add_tf_question("Höftbenskammen löper från framtill bakåt över höften", "Sant", "osteologi_pelvis", "Hard")

add_mc_question("Vad är tuber ischiadicum?", "sittbensknöppen", ["höftbenskammen", "höftledskål", "ett ben"], "osteologi_pelvis", "Normal")
add_tf_question("Tuber ischiadicum är sittbensknöppen", "Sant", "osteologi_pelvis", "Normal")
add_tf_question("Sittbensknöppen är det man sitter på", "Sant", "osteologi_pelvis", "Normal")
add_tf_question("Tuber ischiadicum är en process på tarmbenet", "Falskt", "osteologi_pelvis", "Normal")

add_mc_question("Vad är acetabulum?", "höftledskål eller höftens ledyta", ["höftbenskammen", "sittbensknöppen", "ett ben i foten"], "osteologi_pelvis", "Normal")
add_tf_question("Acetabulum är höftledskål", "Sant", "osteologi_pelvis", "Normal")
add_tf_question("I acetabulum sitter lårbenshuvet", "Sant", "osteologi_pelvis", "Hard")
add_tf_question("Acetabulum är ett ben själv", "Falskt", "osteologi_pelvis", "Normal")

add_mc_question("Var ligger höftledskål (acetabulum)?", "på sidan av höftbenet där höft- och lårbenet möts", ["på baksidan", "på överst på höftbenet", "längst ner"], "osteologi_pelvis", "Hard")
add_tf_question("Höftledskål är en led där lårbenet fästs vid höftbenet", "Sant", "osteologi_pelvis", "Hard")

add_tf_question("Bäckenet är en ring av ben", "Sant", "osteologi_pelvis", "Hard")
add_tf_question("Bäckenet är helt symmetriskt på båda sidorna", "Sant", "osteologi_pelvis", "Hard")
add_tf_question("Korsbenet är en del av bäckenet", "Sant", "osteologi_pelvis", "Hard")

add_mc_question("Vilka ben utgör bäckensringen?", "höftbenen, korsbenet och gödben", ["bara höftbenen", "bara korsbenet", "endast höftbenskammarna"], "osteologi_pelvis", "Hard")
add_mc_question("Bäckenet är viktig för vilka funktioner?", "att bära kroppen, skydda organ och fortplantning", ["bara bärande", "bara skydd", "bara fortplantning"], "osteologi_pelvis", "Hard")

add_tf_question("Det finns anatomiska skillnader mellan manligt och kvinnligt bäcken", "Sant", "osteologi_pelvis", "Hard")
add_tf_question("Kvinnligt bäcken är bredare än manligt", "Sant", "osteologi_pelvis", "Hard")

# ===== ÖVRE EXTREMITETEN (110 questions) =====
# Scapula
add_mc_question("Vad heter skulderblad på latin?", "scapula", ["clavicula", "humerus", "acromion"], "osteologi_upper", "Easy")
add_tf_question("Skulderblad kallas scapula på latin", "Sant", "osteologi_upper", "Easy")

add_mc_question("Var sitter skulderblad?", "på baksidan av bröstkassen", ["på framsidan av bröstet", "på halsen", "på överkäken"], "osteologi_upper", "Normal")
add_mc_question("Vad är spina scapulae?", "skulderbladsryggen eller spina", ["ett ben själv", "acromion", "en process"], "osteologi_upper", "Normal")
add_tf_question("Spina scapulae är en rygg på skulderbladet", "Sant", "osteologi_upper", "Normal")

add_mc_question("Vad är acromion?", "akromion, ett utskott på skulderbladet", ["spina scapulae", "processus coracoideus", "ett ben i armen"], "osteologi_upper", "Normal")
add_tf_question("Acromion är toppen av skulderbladet", "Sant", "osteologi_upper", "Normal")
add_tf_question("Acromion är det där muskeln fästs", "Sant", "osteologi_upper", "Hard")

add_mc_question("Vad är processus coracoideus?", "korpnäbbsutskottet på skulderbladet", ["acromion", "spina scapulae", "ett ben i handen"], "osteologi_upper", "Normal")
add_tf_question("Processus coracoideus är korpnäbbsutskott", "Sant", "osteologi_upper", "Normal")
add_tf_question("Processus coracoideus pekar framåt och nedåt", "Sant", "osteologi_upper", "Hard")

add_mc_question("Vad är fossa supraspinatus?", "en fördjupning på skulderbladet för en muskel", ["ett ben själv", "cavitas glenoidale", "acromion"], "osteologi_upper", "Normal")
add_mc_question("Vad är cavitas glenoidale?", "glenoidkaviteten där armbenshuvdet sitter", ["en fördjupning för en muskel", "ett ben", "acromion"], "osteologi_upper", "Normal")
add_tf_question("Cavitas glenoidale är ledytan för axelleden", "Sant", "osteologi_upper", "Hard")
add_tf_question("I cavitas glenoidale sitter överarmsbenshuvudet", "Sant", "osteologi_upper", "Hard")

# Clavicula
add_mc_question("Vad heter nyckelben på latin?", "clavicula", ["scapula", "humerus", "sternum"], "osteologi_upper", "Easy")
add_tf_question("Nyckelben kallas clavicula på latin", "Sant", "osteologi_upper", "Easy")

add_mc_question("Var sitter nyckelben?", "mellan sternum och skulderbladet", ["på skulderbladet", "på överarmsbenet", "på bröstbenet"], "osteologi_upper", "Normal")
add_tf_question("Nyckelben förbinder bröstet med skulderbladet", "Sant", "osteologi_upper", "Normal")
add_tf_question("Det finns två nyckelben (ett på vardera sida)", "Sant", "osteologi_upper", "Easy")

# Humerus
add_mc_question("Vad heter överarmsben på latin?", "humerus", ["radius", "ulna", "femur"], "osteologi_upper", "Easy")
add_tf_question("Överarmsben kallas humerus på latin", "Sant", "osteologi_upper", "Easy")

add_mc_question("Var sitter överarmsben?", "från axeln till armbågen", ["från axeln till handled", "från axeln till högra höften", "bara i axeln"], "osteologi_upper", "Normal")
add_tf_question("Överarmsben är det långaste benet i armen", "Sant", "osteologi_upper", "Normal")

add_mc_question("Vad är caput humeri?", "överarmsbenets huvud som sitter i axelleden", ["ett ben själv", "epicondylus", "olecranon"], "osteologi_upper", "Normal")
add_tf_question("Caput humeri är överarmsbenets huvud", "Sant", "osteologi_upper", "Normal")
add_tf_question("Caput humeri sitter i cavitas glenoidale", "Sant", "osteologi_upper", "Hard")

add_mc_question("Vad är epicondylus?", "knölutskott på överarmsbenet vid armbågen", ["överarmsbenets huvud", "ett ben själv", "en process på skulderbladet"], "osteologi_upper", "Normal")
add_mc_question("Var många epicondyles finns på överarmsbenet?", "två - medial och lateral", ["en", "tre", "fyra"], "osteologi_upper", "Normal")
add_tf_question("Epicondylus medialis sitter på insidan av överarmsbenet", "Sant", "osteologi_upper", "Hard")
add_tf_question("Epicondylus lateralis sitter på utsidan av överarmsbenet", "Sant", "osteologi_upper", "Hard")

# Ulna & Radius
add_mc_question("Vad heter armbågsben på latin?", "ulna", ["radius", "humerus", "carpus"], "osteologi_upper", "Easy")
add_tf_question("Armbågsben kallas ulna på latin", "Sant", "osteologi_upper", "Easy")

add_mc_question("Vad heter strålben på latin?", "radius", ["ulna", "humerus", "fibula"], "osteologi_upper", "Easy")
add_tf_question("Strålben kallas radius på latin", "Sant", "osteologi_upper", "Easy")

add_mc_question("Var sitter armbågsben?", "på insidan av underarmen", ["på utsidan av underarmen", "i överarmen", "i handen"], "osteologi_upper", "Normal")
add_mc_question("Var sitter strålben?", "på utsidan av underarmen", ["på insidan av underarmen", "i överarmen", "i handen"], "osteologi_upper", "Normal")

add_mc_question("Vad är olecranon?", "armbågsknölen på ulna", ["ett ben själv", "caput humeri", "en process på radius"], "osteologi_upper", "Normal")
add_tf_question("Olecranon är armbågsknölen", "Sant", "osteologi_upper", "Normal")
add_tf_question("Olecranon är det man böjer när man böjer armbågen", "Sant", "osteologi_upper", "Hard")

add_tf_question("Ulna och radius är två separata ben", "Sant", "osteologi_upper", "Easy")
add_tf_question("Ulna och radius kan rotera runt varandra", "Sant", "osteologi_upper", "Hard")
add_tf_question("Radius är tjockare än ulna", "Falskt", "osteologi_upper", "Normal")

# Carpus
add_mc_question("Vad heter handloven på latin?", "carpus", ["metacarpus", "digitorum", "phalanx"], "osteologi_upper", "Easy")
add_tf_question("Handloven kallas carpus på latin", "Sant", "osteologi_upper", "Easy")

add_mc_question("Hur många karpalben finns det?", "8", ["5", "7", "10"], "osteologi_upper", "Normal")
add_mc_question("Vilka är de proximala karpalben?", "scaphoideum, lunatum, triquetrum, pisiforme", ["trapezium, trapezoideum, capitatum, hamatum", "alla åtta tillsammans", "bara två"], "osteologi_upper", "Hard")
add_mc_question("Vilka är de distala karpalben?", "trapezium, trapezoideum, capitatum, hamatum", ["scaphoideum, lunatum, triquetrum, pisiforme", "alla åtta tillsammans", "bara två"], "osteologi_upper", "Hard")

add_tf_question("Karpalben är små ben i handloven", "Sant", "osteologi_upper", "Easy")
add_tf_question("Det finns 4 proximala karpalben", "Sant", "osteologi_upper", "Normal")
add_tf_question("Det finns 4 distala karpalben", "Sant", "osteologi_upper", "Normal")

# Metacarpus och Phalanx
add_mc_question("Vad heter mellanhanden på latin?", "metacarpus", ["carpus", "phalanx", "digitorum"], "osteologi_upper", "Easy")
add_tf_question("Mellanhanden kallas metacarpus på latin", "Sant", "osteologi_upper", "Easy")

add_mc_question("Hur många metakarpalben finns det?", "5", ["8", "4", "10"], "osteologi_upper", "Normal")
add_tf_question("Det finns ett metakarpalben för varje finger", "Sant", "osteologi_upper", "Easy")

add_mc_question("Vad är phalanx?", "fingerben", ["handben", "ett ben i foten", "ett ben på höften"], "osteologi_upper", "Easy")
add_tf_question("Phalanx är fingerben", "Sant", "osteologi_upper", "Easy")

add_mc_question("Hur många phalanger har tummen?", "2", ["3", "4", "1"], "osteologi_upper", "Normal")
add_mc_question("Hur många phalanger har långfingret?", "3", ["2", "4", "1"], "osteologi_upper", "Normal")
add_tf_question("Tummen har 2 phalanger medan andra fingrar har 3", "Sant", "osteologi_upper", "Hard")

add_mc_question("Vad är phalanx proximalis?", "det närmaste fingerbenet vid handloven", ["mittbenet", "det längsta benet", "det längst ut i fingret"], "osteologi_upper", "Hard")
add_mc_question("Vad är phalanx media?", "mittbenet i fingret", ["det närmaste fingerbenet", "det längst ut i fingret", "bara tummen har detta"], "osteologi_upper", "Hard")
add_mc_question("Vad är phalanx distalis?", "det längst ut i fingret", ["det närmaste fingerbenet", "mittbenet", "bara tummen har detta"], "osteologi_upper", "Hard")

# ===== NEDRE EXTREMITETEN (110 questions) =====
# Femur
add_mc_question("Vad heter lårbenet på latin?", "femur", ["tibia", "fibula", "patella"], "osteologi_lower", "Easy")
add_tf_question("Lårbenet kallas femur på latin", "Sant", "osteologi_lower", "Easy")

add_mc_question("Var sitter lårbenet?", "från höften till knäet", ["från knäet till ankeln", "från höften till ankeln", "bara i höftleden"], "osteologi_lower", "Normal")
add_tf_question("Lårbenet är det längsta och starkaste benet i kroppen", "Sant", "osteologi_lower", "Normal")

add_mc_question("Vad är caput femoris?", "lårbenshuvud som sitter i höftledskål", ["ett ben själv", "lårbenskransen", "ett ben på skenbenet"], "osteologi_lower", "Normal")
add_tf_question("Caput femoris är lårbenshuvud", "Sant", "osteologi_lower", "Normal")
add_tf_question("I caput femoris sitter höftledskål", "Falskt", "osteologi_lower", "Normal")
add_tf_question("Caput femoris sitter i acetabulum", "Sant", "osteologi_lower", "Hard")

add_mc_question("Vad är collum femoris?", "lårbenskransen mellan huvud och skaft", ["ett ben själv", "lårbenshuvud", "en stor vändknöl"], "osteologi_lower", "Normal")
add_tf_question("Collum femoris är lårbenskransen", "Sant", "osteologi_lower", "Normal")

add_mc_question("Vad är trochanter major?", "den stora vändknölen på lårbenet", ["den lilla vändknölen", "lårbenshuvud", "en process på skenbenet"], "osteologi_lower", "Normal")
add_tf_question("Trochanter major är den stora vändknölen", "Sant", "osteologi_lower", "Normal")
add_tf_question("Trochanter major är en process på lårbenet", "Sant", "osteologi_lower", "Normal")
add_tf_question("Muskler fästs vid trochanter major", "Sant", "osteologi_lower", "Hard")

add_mc_question("Var sitter trochanter major?", "på utsidan av lårbenet nära höften", ["på insidan av lårbenet", "nära knäet", "på främre sidan"], "osteologi_lower", "Hard")
add_tf_question("Trochanter major är lätt att känna på", "Sant", "osteologi_lower", "Normal")

# Patella
add_mc_question("Vad heter knäskål på latin?", "patella", ["femur", "tibia", "fibula"], "osteologi_lower", "Easy")
add_tf_question("Knäskål kallas patella på latin", "Sant", "osteologi_lower", "Easy")

add_mc_question("Var sitter knäskål?", "framför knäleden", ["bakom knäleden", "på insidan av knäet", "på utsidan av knäet"], "osteologi_lower", "Normal")
add_tf_question("Knäskål skyddar knäleden", "Sant", "osteologi_lower", "Normal")
add_tf_question("Knäskål är ett jämnt avrundat ben", "Sant", "osteologi_lower", "Normal")

add_mc_question("Vad är basis patellae?", "den översta delen av knäskål", ["den nedersta delen", "mittendelen", "en process"], "osteologi_lower", "Hard")
add_mc_question("Vad är apex patellae?", "den nedersta spetsen på knäskål", ["den översta delen", "mittendelen", "en process"], "osteologi_lower", "Hard")

# Tibia & Fibula
add_mc_question("Vad heter skenbenet på latin?", "tibia", ["fibula", "femur", "calcaneus"], "osteologi_lower", "Easy")
add_tf_question("Skenbenet kallas tibia på latin", "Sant", "osteologi_lower", "Easy")

add_mc_question("Vad heter vadbenet på latin?", "fibula", ["tibia", "femur", "calcaneus"], "osteologi_lower", "Easy")
add_tf_question("Vadbenet kallas fibula på latin", "Sant", "osteologi_lower", "Easy")

add_mc_question("Var sitter skenbenet?", "på insidan av underbenet", ["på utsidan av underbenet", "bakom underbenet", "ovanför knäet"], "osteologi_lower", "Normal")
add_mc_question("Var sitter vadbenet?", "på utsidan av underbenet", ["på insidan av underbenet", "bakom underbenet", "ovanför knäet"], "osteologi_lower", "Normal")

add_tf_question("Skenbenet är tjockare än vadbenet", "Sant", "osteologi_lower", "Normal")
add_tf_question("Skenbenet bär större delen av kroppen än vadbenet", "Sant", "osteologi_lower", "Hard")
add_tf_question("Tibia och fibula är två separata ben", "Sant", "osteologi_lower", "Easy")

add_mc_question("Vad är corpus tibiae?", "skenbenskroppen", ["ett ben själv", "shinnsknöppen", "en malleolus"], "osteologi_lower", "Normal")
add_tf_question("Corpus tibiae är skenbenskroppen", "Sant", "osteologi_lower", "Easy")

add_mc_question("Vad är tuberositas tibiae?", "shinnsknöppen", ["skenbenskroppen", "en malleolus", "ett ben själv"], "osteologi_lower", "Normal")
add_tf_question("Tuberositas tibiae är shinnsknöppen", "Sant", "osteologi_lower", "Normal")
add_tf_question("Shinnsknöppen är lätt att känna på", "Sant", "osteologi_lower", "Normal")

add_mc_question("Vad är malleolus?", "knölar på vardera sida om ankeln", ["en ben själv", "tungan på skenbenet", "ett karpalben"], "osteologi_lower", "Normal")
add_mc_question("Vad är malleolus medialis?", "den inre knölen på skenbenet", ["den yttre knölen", "en process på vadbenet", "ett ben själv"], "osteologi_lower", "Normal")
add_mc_question("Vad är malleolus lateralis?", "den yttre knölen på vadbenet", ["den inre knölen", "en process på skenbenet", "ett ben själv"], "osteologi_lower", "Normal")

add_tf_question("Det finns två malleoli - en på skenbenet och en på vadbenet", "Sant", "osteologi_lower", "Normal")
add_tf_question("Malleoli är ankelbenen (knölarna omkring ankeln)", "Sant", "osteologi_lower", "Easy")

add_mc_question("Var ligger malleolus medialis?", "på insidan av ankeln", ["på utsidan av ankeln", "framför ankeln", "bakom ankeln"], "osteologi_lower", "Normal")
add_mc_question("Var ligger malleolus lateralis?", "på utsidan av ankeln", ["på insidan av ankeln", "framför ankeln", "bakom ankeln"], "osteologi_lower", "Normal")

# Calcaneus
add_mc_question("Vad heter hälbenet på latin?", "calcaneus", ["talus", "cuboid", "navicular"], "osteologi_lower", "Easy")
add_tf_question("Hälbenet kallas calcaneus på latin", "Sant", "osteologi_lower", "Easy")

add_mc_question("Var sitter hälbenet?", "i hälen", ["i fotbågen", "under fotens mitt", "framför fotens mitt"], "osteologi_lower", "Normal")
add_tf_question("Hälbenet är det största tarbenet", "Sant", "osteologi_lower", "Normal")
add_tf_question("Hälbenet bär mycket av kroppsvikten", "Sant", "osteologi_lower", "Hard")

add_mc_question("Vilka ben utgör fotens skelett?", "tarbenen, mellanfotsbenen och tåbenen", ["bara hälbenet", "bara mellanfotsbenen", "bara tåbenen"], "osteologi_lower", "Hard")

# Summary questions
add_tf_question("Nedre extremiteten har samma bentstruktur som övre extremiteten", "Sant", "osteologi_lower", "Hard")
add_tf_question("Lårbenet är längre än överarmsbenet", "Sant", "osteologi_lower", "Hard")
add_tf_question("Det finns en snäcka (patella) bara i benet", "Falskt", "osteologi_lower", "Hard")

# Write to file
with open('/home/norrtou/Documents/Kod/anatomiquiz/data/questions.json', 'w', encoding='utf-8') as f:
    json.dump(questions + bone_questions, f, ensure_ascii=False, indent=2)

print(f"\nGenerated a total of {len(bone_questions)} new bone questions!")
print(f"Total questions now: {len(questions) + len(bone_questions)}")
print(f"Question range: q{max_id+1} to q{current_id-1}")
