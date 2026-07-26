#!/usr/bin/env python3
"""Vad varje sida HANDLAR OM, LÄR UT och kan hittas på — registret bakom
`about`, `teaches` och `keywords` i sidornas JSON-LD (SEO-svepets punkt 14).

Mätt 2026-07-26 över alla 117 sidnoder: **109 saknade `about`** och **samtliga
117 saknade `teaches` och `keywords`**. En svarsmotor som läste en muskeltabell
kunde alltså se att sidan var en `Article` av typen `LearningResource`, vem som
skrivit den och när — men inte *vilken muskel* den handlade om.

**Vad en sida handlar om är omdöme och skrivs för hand** (CLAUDE_REGLER §0.3
punkt 2). Att en tabell råkar rada upp tjugo latinska namn gör inte alla tjugo
till sidans ämne, och en maskin som läste latinkolumnen rakt av hade dessutom
typat fel: skelettsidornas kolumn blandar ben och leder, ledsidorna har ingen
latinkolumn alls och `nervtabell-autonoma.html` är en jämförelsetabell. Att
kontrollera, formatera och skriva in är mekaniskt och görs av `wire_amne.py`.

**Ingenting får påstås som sidan inte säger.** Varje namn i `om` och varje
`nyckelord` måste förekomma i sidans egen text — `<title>`, description eller
`<main>` — annars stoppar bygget. Regeln är densamma som gör att `citation`
läses ur den synliga referenslistan (SEO_REGLER §6b) och att `FAQPage` måste
spegla den synliga FAQ:n (§6): **strukturdatan rättas efter sidan, aldrig
tvärtom.** Den är inte teoretisk — den fällde vid införandet `about`-värdena
"Human anatomi", "Myologi" och "Artrologi" på startsidan och "Spaced
repetition" på `spellagen.html`, fyra påståenden som stått i märkningen sedan
sidorna skrevs utan att någonsin ha stått på sidan.

För `nyckelord` är samma regel dessutom det enda som håller fältet ärligt.
`keywords` är gratis att fylla på och kostar ingenting att överdriva; kravet att
ordet ska finnas på sidan gör keyword-stuffing omöjlig i stället för förbjuden.

**`<meta name="keywords">` är något helt annat och ska aldrig tillbaka.** Taggen
togs bort på användarens begäran i 0.9.56 (död signal sedan 2009).
`wire_amne.py` stoppar bygget om den dyker upp igen på någon sida.

Användning:
    python3 scripts/amne.py          # visa registret, spännvidder och exempel
"""
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent

# ---------------------------------------------------------------------------
# Tak — ett register som spränger dem ska skrivas om, inte klippas
# ---------------------------------------------------------------------------
# `about` med tjugo poster är ingen ämnesangivelse utan en innehållsförteckning,
# och `keywords` som växer obegränsat blir keyword-stuffing även när varje ord
# finns på sidan. Taken är hårda av samma skäl som MAX_LANKAR i relaterat.py:
# en lista som klipps automatiskt blir godtycklig, en som stoppar bygget blir
# omskriven av någon som tänkt efter.
MAX_OM = 8
MAX_LAR_UT = 5
MAX_NYCKELORD = 12

# ---------------------------------------------------------------------------
# Tillåtna @type i `about`
# ---------------------------------------------------------------------------
# Kontrollerade mot schema.org 2026-07-26 (SEO_REGLER §6: bara riktiga typer).
# AnatomicalStructure ligger under MedicalEntity och har undertyperna Bone,
# BrainStructure, Joint, Ligament, Muscle, Nerve och Vessel; Vessel har i sin
# tur Artery, Vein och LymphaticVessel. Listan är stängd: en typ utanför den
# stoppar bygget i stället för att skrivas ut och tyst ignoreras av läsaren
# (CLAUDE_REGLER §0.4).
TYPER = {
    "Thing",
    "AnatomicalStructure", "AnatomicalSystem",
    "Bone", "BrainStructure", "Joint", "Ligament", "Muscle", "Nerve",
    "Vessel", "Artery", "Vein", "LymphaticVessel",
}


class Ämne:
    """Vad en sida handlar om, lär ut och kan sökas på.

    `om`      – (typ, namn) per ämne, i fallande ordning av hur centralt det är.
    `lär_ut`  – lärandemål i klartext. Tom lista kräver en post i UTAN_LAR_UT.
    `nyckelord` – sökord som faktiskt står på sidan.
    """

    __slots__ = ("om", "lär_ut", "nyckelord")

    def __init__(self, om, lär_ut, nyckelord):
        self.om = om
        self.lär_ut = lär_ut
        self.nyckelord = nyckelord


# Ord som återkommer på en hel tabellfamilj. De står som konstanter för att en
# ändring ska slå igenom på alla sidorna samtidigt — samma skäl som sidfotens
# text bor på ett ställe (SEO_REGLER §6e).
MUSKEL_ORD = ["ursprung", "fäste", "innervation", "funktion"]
SKELETT_ORD = ["bentyp", "leder", "tentaplugg"]
KARL_ORD = ["artärer", "vener", "avgång", "försörjningsområde"]
NERV_ORD = ["innervation", "bortfall", "rötter"]
LED_ORD = ["rörelseomfång", "rörelseplan", "flexion", "extension"]

# ---------------------------------------------------------------------------
# Registret
# ---------------------------------------------------------------------------
SIDOR: dict[str, Ämne] = {}


def _s(rel: str, om, lär_ut, nyckelord) -> None:
    if rel in SIDOR:
        raise SystemExit(f"STOPP: {rel} står två gånger i registret.")
    SIDOR[rel] = Ämne(om, lär_ut, nyckelord)


# --- Startsidan, appen och sajtens egna sidor -------------------------------
_s("index.html",
   [("Thing", "Anatomi"), ("Thing", "Fysiologi"),
    ("Thing", "Medicinsk terminologi"), ("Thing", "Osteologi"),
    ("Thing", "Neuroanatomi"), ("Thing", "Blodomloppet")],
   ["Att känna igen kroppens skelett, muskler, nerver och kärl.",
    "Vad medicinska och latinska termer betyder.",
    "Att befästa anatomin genom att svara i stället för att läsa om."],
   ["anatomiquiz", "anatomi", "quiz", "flashcards", "medicinsk terminologi",
    "skelett", "muskler", "nerver", "tentaplugg"])

_s("case.html",
   [("Thing", "Anatomi"), ("Thing", "Medicinsk terminologi"),
    ("AnatomicalStructure", "Handens muskler")],
   ["Att känna igen anatomiska strukturer i en patientberättelse.",
    "Hur handens muskler, leder och nerver hänger ihop kliniskt.",
    "Vad de begrepp betyder som återkommer i journaltext."],
   ["case", "patientfall", "anatomi", "handen", "medicinsk terminologi",
    "tentaplugg"])

_s("spellagen.html",
   [("Thing", "Studieteknik"), ("Thing", "Aktiv repetition"),
    ("Thing", "Anatomi")],
   ["Vad varje spelläge tränar och hur poängen räknas.",
    "Varför det ger mer att svara på en fråga än att läsa svaret.",
    "Hur repetition med ökande mellanrum lägger upp pluggandet."],
   # "dagens utmaning" och inte sluggen "dagsutmaning": nyckelordet måste stå
   # på sidan, och sidan skriver lägets SYNLIGA namn. Sluggen är ett kodnamn.
   ["spellägen", "studieteknik", "flashcards", "quiz", "matcha", "leitner",
    "tidsjakt", "dagens utmaning", "anatomi"])

_s("info.html",
   [("Thing", "Anatomiquiz"), ("Thing", "Norrtou Creations")],
   [],
   ["anatomiquiz", "om anatomiquiz", "daniel medin", "norrtou creations",
    "källor", "kunskapsbank"])

_s("integritet.html",
   [("Thing", "Integritetspolicy")],
   [],
   ["integritetspolicy", "kakor", "personuppgifter", "spårning",
    "anatomiquiz"])

_s("versionshistorik.html",
   [("Thing", "Versionshistorik")],
   [],
   ["versionshistorik", "anatomiquiz", "uppdateringar", "kunskapsbank"])

# --- Verktyg ----------------------------------------------------------------
_s("verktyg/index.html",
   [("Thing", "Läkemedelsberäknare"), ("Thing", "Aktivitetsdagbok")],
   ["Vilka interaktiva verktyg som finns och vad var och ett gör."],
   ["verktyg", "läkemedelsberäknare", "aktivitetsdagbok", "anatomiquiz"])

_s("verktyg/lakemedelsberakning.html",
   [("Thing", "Läkemedelsberäkning"), ("Thing", "Infusion"),
    ("Thing", "Spädning")],
   ["Att räkna om mellan gram, milligram och mikrogram.",
    "Att beräkna dos ur styrka, infusionstakt och spädning.",
    "Att kontrollräkna ett svar innan det används."],
   ["läkemedelsberäkning", "dos och styrka", "infusionstakt", "spädning",
    "enhetsomvandling"])

# --- Ordlistan --------------------------------------------------------------
_s("medicinskordlista.html",
   [("Thing", "Medicinsk terminologi"), ("Thing", "Medicinsk ordlista"),
    ("Thing", "Anatomiska termer")],
   ["Vad en medicinsk eller anatomisk term betyder på svenska.",
    "Vilken ordklass en term tillhör och hur den böjs.",
    "Varifrån ordet kommer och vad det hette från början."],
   ["medicinsk ordlista", "medicinsk terminologi", "anatomiska termer",
    "definition", "etymologi", "synonymer"])

# De 29 bokstavssidorna plus prefix, suffix och siffror. Formen är densamma på
# alla — de skiljer sig bara i vilken bokstav de samlar — så posterna byggs ur
# en lista i stället för att skrivas av 32 gånger. Det är CLAUDE_REGLER §0.3
# punkt 1: regeln går att uttrycka exakt, alltså ska den automatiseras.
BOKSTÄVER = [
    ("a", "A"), ("b", "B"), ("c", "C"), ("d", "D"), ("e", "E"), ("f", "F"),
    ("g", "G"), ("h", "H"), ("i", "I"), ("j", "J"), ("k", "K"), ("l", "L"),
    ("m", "M"), ("n", "N"), ("o", "O"), ("p", "P"), ("q", "Q"), ("r", "R"),
    ("s", "S"), ("t", "T"), ("u", "U"), ("v", "V"), ("w", "W"), ("x", "X"),
    ("y", "Y"), ("z", "Z"), ("aa", "Å"), ("ae", "Ä"), ("oe", "Ö"),
]

for _fil, _bokstav in BOKSTÄVER:
    _s(f"ordlista-{_fil}.html",
       [("Thing", "Medicinsk terminologi"), ("Thing", "Medicinsk ordlista")],
       [f"Vad medicinska och anatomiska termer på {_bokstav} betyder.",
        "Vilken ordklass termen tillhör och vilka synonymer den har."],
       ["medicinsk ordlista", "medicinsk terminologi", "definition",
        f"medicinska ord på {_bokstav}"])

_s("ordlista-prefix.html",
   [("Thing", "Medicinsk terminologi"), ("Thing", "Prefix")],
   ["Vad de vanligaste latinska och grekiska förstavelserna betyder.",
    "Att läsa ut en okänd terms betydelse ur dess förled."],
   ["prefix", "förstavelser", "medicinsk terminologi", "latinska",
    "grekiska", "betydelse"])

_s("ordlista-suffix.html",
   [("Thing", "Medicinsk terminologi"), ("Thing", "Suffix")],
   ["Vad de vanligaste latinska och grekiska ändelserna betyder.",
    "Att skilja en inflammation från en tumör på ändelsen."],
   ["suffix", "ändelser", "medicinsk terminologi", "latinska", "grekiska",
    "betydelse"])

_s("ordlista-siffror.html",
   [("Thing", "Medicinsk terminologi")],
   ["Vad medicinska förkortningar som inleds med en siffra står för."],
   ["medicinsk ordlista", "medicinsk terminologi", "förkortningar",
    "definition"])

# --- Kunskapsbankens hubbar -------------------------------------------------
_s("kunskapsbank/index.html",
   [("Thing", "Anatomi"), ("Thing", "Medicinsk terminologi")],
   ["Var i kunskapsbanken varje slags material finns.",
    "Vilken tabell, ordlista eller faktatext som svarar på vilken fråga."],
   ["kunskapsbank", "anatomi", "medicinsk ordlista", "tabeller",
    "faktatexter"])

_s("kunskapsbank/faktatexter.html",
   [("Thing", "Anatomi"), ("Thing", "Fysiologi")],
   ["Vilka fördjupande faktatexter som finns och vilket ämnesområde de hör "
    "till."],
   ["faktatexter", "anatomi", "fysiologi", "nervsystemet",
    "rörelseapparaten", "studieteknik"])

_s("kunskapsbank/listor-tabeller.html",
   [("Thing", "Anatomi"), ("AnatomicalSystem", "Muskler"),
    ("AnatomicalSystem", "Skelett")],
   ["Vilka plugglistor som finns över muskler, nerver, kärl, skelett och "
    "leder."],
   ["tabeller", "listor", "muskler", "nerver", "kärl", "skelett", "leder",
    "anatomiplugg"])

_s("kunskapsbank/muskeltabeller.html",
   [("AnatomicalSystem", "Muskler"), ("Thing", "Anatomi")],
   ["Vilken muskeltabell som täcker vilken kroppsregion.",
    "Vad kolumnerna ursprung, fäste, innervation och funktion svarar på."],
   ["muskeltabeller", "muskler"] + MUSKEL_ORD + ["tentaplugg"])

_s("kunskapsbank/skelett.html",
   [("AnatomicalSystem", "Skelettet"), ("Thing", "Anatomi")],
   ["Vilken skelettabell som täcker vilken kroppsregion.",
    "Vad ett bens latinska namn, bentyp och landmärken säger om det."],
   ["skelettet", "ben", "latinska namn", "ledförbindelser", "bentyp",
    "tentaplugg"])

_s("kunskapsbank/karl.html",
   [("AnatomicalSystem", "Kärl"), ("Thing", "Anatomi")],
   ["Vilken kärltabell som täcker vilken kroppsregion.",
    "Hur artärer och vener namnges efter var de går."],
   ["kärl"] + KARL_ORD + ["anatomi", "tentaplugg"])

_s("kunskapsbank/leder.html",
   [("AnatomicalSystem", "Leder"), ("Thing", "Rörelseomfång")],
   ["Vilken ledtabell som täcker vilken kroppsregion.",
    "Vad normalt rörelseomfång betyder och hur det anges."],
   ["leder", "rom", "rörelseomfång", "grader", "fysioterapi", "arbetsterapi"])

_s("kunskapsbank/nervtabeller.html",
   [("AnatomicalSystem", "Nervsystemet"), ("Nerve", "Kranialnerverna")],
   ["Vilken nervtabell som täcker vilka nerver.",
    "Skillnaden mellan kranialnerver och perifera nerver."],
   ["nervtabeller", "nerver", "kranialnerverna", "innervation",
    "anatomiplugg"])

_s("kunskapsbank/medicinsk-terminologi.html",
   [("Thing", "Medicinsk terminologi"), ("Thing", "Medicinskt latin"),
    ("Thing", "Ordbildning")],
   ["Hur en medicinsk term är uppbyggd av förled, rot och efterled.",
    "Vilka fördjupningssidor som finns om latin, grekiska, böjning och uttal."],
   ["medicinsk terminologi", "medicinskt latin", "grekiska", "ordbildning",
    "deklinationer", "uttal"])

_s("kunskapsbank/artiklar/index.html",
   [("Thing", "Anatomi"), ("Thing", "Medicinsk terminologi")],
   ["Vilka artiklar som finns och vilket ämnesområde var och en hör till."],
   ["artiklar", "kunskapsbank", "anatomi", "ämnesområde"])

_s("kunskapsbank/artiklar/klinisk-anatomi.html",
   [("Thing", "Klinisk anatomi"), ("Thing", "Rotatorkuffen")],
   ["Vilka artiklar som beskriver anatomin bakom vanliga besvär."],
   ["klinisk anatomi", "rotatorkuffen", "karpaltunneln", "ischiasnerven"])

_s("kunskapsbank/artiklar/nervsystemet.html",
   [("AnatomicalSystem", "Nervsystemet"), ("Thing", "Ryggmärgen")],
   ["Hur motoriska kommandon leds från hjärnan ut till musklerna.",
    "Hur känselsignaler leds från kroppen upp till hjärnan."],
   ["nervsystemet", "motoriska kommandon", "känselsignaler", "ryggmärgen",
    "hjärnan"])

_s("kunskapsbank/artiklar/rorelseapparaten.html",
   [("AnatomicalSystem", "Rörelseapparaten"), ("Thing", "Anatomi")],
   ["Hur riktningstermer, plan och ledtyper hänger ihop.",
    "Hur muskler, senor och fascia samverkar när en rörelse utförs."],
   ["rörelseapparaten", "riktningar", "plan", "ledtyper", "muskler", "senor",
    "fascia"])

_s("kunskapsbank/artiklar/plugga-och-tenta.html",
   [("Thing", "Studieteknik"), ("Thing", "Läkemedelsberäkning")],
   ["Vilka artiklar som handlar om hur du pluggar och vad du tenteras på."],
   ["studieteknik", "tenta", "plugga", "läkemedelsberäkning"])

# --- Muskeltabellerna -------------------------------------------------------
_s("kunskapsbank/muskeltabell-ansiktet.html",
   [("AnatomicalStructure", "Ansiktets muskler"),
    ("Muscle", "Musculus orbicularis oculi"),
    ("Muscle", "Musculus orbicularis oris"),
    ("Nerve", "Nervus facialis")],
   ["Vilka mimiska muskler som rör ögonlock, näsa, mun och ytteröra.",
    "Att de mimiska musklerna fäster i huden och inte i ett ben.",
    "Att hela gruppen innerveras av nervus facialis."],
   ["ansiktets muskler", "mimiska muskler", "nervus facialis"] + MUSKEL_ORD)

_s("kunskapsbank/muskeltabell-backenbotten.html",
   [("AnatomicalStructure", "Bäckenbottens muskler"),
    ("Muscle", "Musculus puborectalis"),
    ("Muscle", "Musculus sphincter ani externus")],
   ["Vilka muskler som bygger upp levator ani och mellangården.",
    "Vilken roll bäckenbotten spelar för kontinens och bukstöd."],
   ["bäckenbottens muskler", "levator ani", "perineum"] + MUSKEL_ORD)

_s("kunskapsbank/muskeltabell-brostkorgen.html",
   [("AnatomicalStructure", "Bröstkorgens muskler"),
    ("Muscle", "Diaphragma"),
    ("Muscle", "Musculi intercostales externi")],
   ["Vilka muskler som vidgar och trycker ihop bröstkorgen vid andning.",
    "Hur interkostalmusklernas fiberriktning avgör vad de gör.",
    "Varför diafragma är den viktigaste inandningsmuskeln."],
   ["bröstkorgens muskler", "andningsmuskler", "diafragma",
    "interkostalmuskler"] + MUSKEL_ORD)

_s("kunskapsbank/muskeltabell-bukvaggen.html",
   [("AnatomicalStructure", "Bukväggens muskler"),
    ("Muscle", "Musculus rectus abdominis"),
    ("Muscle", "Musculus transversus abdominis")],
   ["Vilka lager bukväggen är uppbyggd av och hur de korsar varandra.",
    "Hur bukväggens muskler böjer och roterar bålen och höjer buktrycket."],
   ["bukväggens muskler", "rectus abdominis", "obliquus",
    "quadratus lumborum"] + MUSKEL_ORD)

_s("kunskapsbank/muskeltabell-foten.html",
   [("AnatomicalStructure", "Fotens muskler"),
    ("Muscle", "Musculus abductor hallucis"),
    ("Muscle", "Musculus flexor digitorum brevis")],
   ["Vilka muskler som ligger i fotsulans fyra lager.",
    "Skillnaden mellan fotens egna muskler och de långa från underbenet.",
    "Hur musklerna bär upp fotvalven."],
   ["fotens muskler", "fotsulan", "tåböjare", "tåsträckare"] + MUSKEL_ORD)

_s("kunskapsbank/muskeltabell-halsen.html",
   [("AnatomicalStructure", "Halsens muskler"),
    ("Muscle", "Musculus sternocleidomastoideus"),
    ("Muscle", "Platysma")],
   ["Vilka muskler som ligger ytligt, kring tungbenet och prevertebralt.",
    "Hur sternocleidomastoideus vrider och böjer huvudet.",
    "Vad de infrahyoidala och suprahyoidala musklerna gör vid sväljning."],
   ["halsens muskler", "sternocleidomastoideus", "scalener",
    "tungbenet"] + MUSKEL_ORD)

_s("kunskapsbank/muskeltabell-handen.html",
   [("AnatomicalStructure", "Handens muskler"),
    ("Muscle", "Musculus opponens pollicis"),
    ("Muscle", "Musculus flexor digitorum profundus"),
    ("Nerve", "Nervus ulnaris")],
   ["Skillnaden mellan handens egna muskler och de extrinsiska från "
    "underarmen.",
    "Vilka muskler som bygger tenar och hypotenar.",
    "Hur medianus och ulnaris delar upp handens motorik mellan sig."],
   ["handens muskler", "tenar", "hypotenar", "lumbricaler",
    "interosseer"] + MUSKEL_ORD)

_s("kunskapsbank/muskeltabell-hoften.html",
   [("AnatomicalStructure", "Höftens muskler"),
    ("Muscle", "Musculus gluteus maximus"),
    ("Muscle", "Musculus psoas major"),
    ("Muscle", "Musculus piriformis")],
   ["Vilka muskler som böjer, sträcker, abducerar och roterar i höftleden.",
    "Hur iliopsoas kombinerar psoas och iliacus till en böjare.",
    "Vilka de djupa utåtrotatorerna är och var de ligger."],
   ["höftens muskler", "sätesmuskler", "iliopsoas", "gluteus maximus",
    "utåtrotatorer"] + MUSKEL_ORD)

_s("kunskapsbank/muskeltabell-kaken.html",
   [("AnatomicalStructure", "Käkens muskler"),
    ("Muscle", "Musculus masseter"), ("Muscle", "Musculus temporalis"),
    ("Nerve", "Nervus mandibularis")],
   ["Vilka fyra tuggmuskler som finns och vad var och en gör.",
    "Att alla fyra innerveras av nervus mandibularis.",
    "Vilken muskel som öppnar käken och varför det bara är en."],
   ["käkens muskler", "tuggmuskler", "masseter", "temporalis",
    "pterygoideus"] + MUSKEL_ORD)

_s("kunskapsbank/muskeltabell-laret.html",
   [("AnatomicalStructure", "Lårets muskler"),
    ("Muscle", "Musculus rectus femoris"),
    ("Muscle", "Musculus biceps femoris"),
    ("Muscle", "Musculus adductor magnus")],
   ["Vilka muskler som ligger i lårets främre, mediala och bakre loge.",
    "Vilka fyra muskler som bildar den främre knästräckarlogen.",
    "Varför en muskel som går över både höft och knä gör två saker."],
   ["lårets muskler", "knästräckare", "adduktorer", "hamstrings",
    "loge"] + MUSKEL_ORD)

_s("kunskapsbank/muskeltabell-ogat.html",
   [("AnatomicalStructure", "Ögats muskler"),
    ("Muscle", "Musculus rectus lateralis"),
    ("Muscle", "Musculus obliquus superior")],
   ["Vilka sex yttre ögonmuskler som finns och åt vilket håll de för ögat.",
    "Hur kranialnerverna III, IV och VI delar upp ögonmusklerna mellan sig.",
    "Vad levator palpebrae superioris gör med ögonlocket."],
   ["ögats muskler", "ögonmuskler", "levator palpebrae superioris",
    "kranialnerver"] + MUSKEL_ORD)

_s("kunskapsbank/muskeltabell-overarmen.html",
   [("AnatomicalStructure", "Överarmens muskler"),
    ("Muscle", "Musculus biceps brachii"),
    ("Muscle", "Musculus triceps brachii"),
    ("Muscle", "Musculus brachialis")],
   ["Vilka muskler som ligger i överarmens främre respektive bakre loge.",
    "Vilken muskel som är armbågens starkaste böjare och vilken som sträcker.",
    "Varför biceps brachii också supinerar underarmen."],
   ["överarmens muskler", "biceps brachii", "triceps brachii", "böjarloge",
    "sträckarloge"] + MUSKEL_ORD)

_s("kunskapsbank/muskeltabell-ryggen.html",
   [("AnatomicalStructure", "Ryggens muskler"),
    ("Muscle", "Musculus longissimus"), ("Muscle", "Musculus multifidus"),
    ("Muscle", "Musculus splenius capitis")],
   ["Hur ryggens egna muskler är ordnade i ytliga och djupa system.",
    "Vilka tre pelare erector spinae består av.",
    "Vad de korta segmentella musklerna gör för ryggradens stabilitet."],
   ["ryggens muskler", "erector spinae", "multifidus", "nackmuskler",
    "transversospinala"] + MUSKEL_ORD)

_s("kunskapsbank/muskeltabell-skuldran.html",
   [("AnatomicalStructure", "Skuldrans muskler"),
    ("Muscle", "Musculus supraspinatus"), ("Muscle", "Musculus deltoideus"),
    ("Muscle", "Musculus trapezius")],
   ["Vilka fyra muskler som bildar rotatorkuffen och vad de gör.",
    "Skillnaden mellan musklerna som rör skulderbladet och de som rör "
    "överarmen.",
    "Hur de tre delarna av deltoideus drar armen åt olika håll."],
   ["skuldrans muskler", "rotatorkuffen", "deltoideus", "trapezius",
    "scapula"] + MUSKEL_ORD)

_s("kunskapsbank/muskeltabell-underarmen.html",
   [("AnatomicalStructure", "Underarmens muskler"),
    ("Muscle", "Musculus flexor carpi radialis"),
    ("Muscle", "Musculus extensor carpi ulnaris"),
    ("Muscle", "Musculus pronator teres")],
   ["Vilka muskler som ligger i underarmens främre respektive bakre loge.",
    "Vilka muskler som böjer och sträcker handleden och fingrarna.",
    "Hur pronation och supination åstadkoms."],
   ["underarmens muskler", "böjare", "fingersträckare",
    "pronation", "supination"] + MUSKEL_ORD)

_s("kunskapsbank/muskeltabell-underbenet.html",
   [("AnatomicalStructure", "Underbenets muskler"),
    ("Muscle", "Musculus gastrocnemius"),
    ("Muscle", "Musculus tibialis anterior"),
    ("Muscle", "Musculus fibularis longus")],
   ["Vilka muskler som ligger i underbenets främre, laterala och bakre loge.",
    "Vilka muskler som lyfter respektive sänker foten.",
    "Hur vadmusklerna verkar via akillessenan."],
   ["underbenets muskler", "vadmuskler", "dorsalflexorer", "gastrocnemius",
    "soleus"] + MUSKEL_ORD)

# --- Skelettabellerna -------------------------------------------------------
_s("kunskapsbank/skelett-brostkorgen.html",
   [("Bone", "Sternum"), ("Bone", "Costae verae (I–VII)"),
    ("Joint", "Articulationes costovertebrales")],
   ["Vilka delar bröstbenet består av.",
    "Skillnaden mellan äkta, falska och flytande revben.",
    "Vilka leder revbenen bildar mot kotorna och bröstbenet."],
   ["bröstkorgens ben", "bröstbenet", "revben", "sternum"] + SKELETT_ORD)

_s("kunskapsbank/skelett-foten.html",
   [("Bone", "Calcaneus"), ("Bone", "Talus"), ("Bone", "Ossa metatarsi I–V"),
    ("Joint", "Articulatio talocruralis")],
   ["Vilka sju fotrotsben som finns och var de ligger.",
    "Hur mellanfotsbenen och tåbenen är numrerade.",
    "Vilka leder foten har och var Chopart och Lisfranc går."],
   ["fotens ben", "fotrotsben", "mellanfotsben", "falanger"] + SKELETT_ORD)

_s("kunskapsbank/skelett-halsen.html",
   [("Bone", "Atlas (C1)"), ("Bone", "Axis (C2)"),
    ("Joint", "Articulatio atlantoaxialis")],
   ["Vad som skiljer atlas och axis från de övriga halskotorna.",
    "Vad foramen transversarium är och vad som går genom det.",
    "Var nickningen och vridningen av huvudet faktiskt sker."],
   ["halsens ben", "halskotor", "atlas", "axis",
    "foramen transversarium"] + SKELETT_ORD)

_s("kunskapsbank/skelett-handen.html",
   [("Bone", "Os scaphoideum"), ("Bone", "Ossa metacarpi I–V"),
    ("Joint", "Articulatio radiocarpalis")],
   ["Vilka åtta handlovsben som finns och i vilka två rader de ligger.",
    "Hur mellanhandsben och fingerben numreras.",
    "Vilka leder handen har och varför tummens sadelled är särskild."],
   ["handens ben", "handlovsben", "mellanhandsben",
    "falanger"] + SKELETT_ORD)

_s("kunskapsbank/skelett-hoften.html",
   [("Bone", "Os coxae"), ("Bone", "Os ilium"), ("Bone", "Os ischii"),
    ("Joint", "Articulatio coxae")],
   ["Vilka tre ben höftbenet växer samman av.",
    "Var acetabulum bildas och vilket ben som ledar mot det.",
    "Vad som skiljer det manliga och kvinnliga bäckenet."],
   ["höftens ben", "höftbenet", "bäckenet", "tarmben",
    "sittben"] + SKELETT_ORD)

_s("kunskapsbank/skelett-laret.html",
   [("Bone", "Femur"), ("Bone", "Patella"), ("Joint", "Articulatio genus")],
   ["Vilka landmärken lårbenet har från collum till kondylerna.",
    "Varför patella räknas som ett sesamben.",
    "Vilka leder lårbenet och knäskålen ingår i."],
   ["lårets ben", "lårbenet", "femur", "knäskål", "patella"] + SKELETT_ORD)

_s("kunskapsbank/skelett-overarmen.html",
   [("Bone", "Humerus"), ("Joint", "Articulatio humeroulnaris")],
   ["Vilka landmärken överarmsbenet har från caput till epikondylerna.",
    "Vilka ledytor humerus bildar mot underarmens ben.",
    "Var nervus radialis löper tätt mot benet."],
   ["överarmens ben", "överarmsbenet", "humerus",
    "epikondyler"] + SKELETT_ORD)

_s("kunskapsbank/skelett-ryggen.html",
   [("Bone", "Vertebrae thoracicae"), ("Bone", "Vertebrae lumbales"),
    ("Bone", "Os sacrum"), ("Joint", "Articulatio sacroiliaca")],
   ["Vad som skiljer bröstkotor från ländkotor.",
    "Hur korsbenet och svansbenet bildas av sammanvuxna kotor.",
    "Vilka leder som finns mellan kotorna."],
   ["ryggens ben", "bröstkotor", "ländkotor", "korsbenet",
    "svansbenet"] + SKELETT_ORD)

_s("kunskapsbank/skelett-skallen.html",
   [("Bone", "Os frontale"), ("Bone", "Os temporale"), ("Bone", "Mandibula"),
    ("Joint", "Articulatio temporomandibularis")],
   ["Vilka ben som bygger hjärnskålen och vilka som bygger ansiktsskelettet.",
    "Vilka de tre hörselbenen är och var de sitter.",
    "Vilka suturer skallens ben möts i."],
   ["skallens ben", "hjärnskålen", "ansiktsskelettet", "hörselben",
    "suturer"] + SKELETT_ORD)

_s("kunskapsbank/skelett-skuldran.html",
   [("Bone", "Clavicula"), ("Bone", "Scapula"),
    ("Joint", "Articulatio glenohumeralis")],
   ["Vilka två ben skuldergördeln består av.",
    "Vilka landmärken skulderbladet har och vad som fäster i dem.",
    "Vilka leder som knyter armen till bålen."],
   ["skuldrans ben", "nyckelben", "skulderblad", "clavicula",
    "scapula"] + SKELETT_ORD)

_s("kunskapsbank/skelett-underarmen.html",
   [("Bone", "Radius"), ("Bone", "Ulna"),
    ("Joint", "Articulatio radioulnaris proximalis")],
   ["Vilket av underarmens ben som ligger på tumsidan och vilket på "
    "lillfingersidan.",
    "Vilka landmärken radius och ulna har.",
    "Hur underarmens vridrörelse sker mellan de två benen."],
   ["underarmens ben", "strålbenet", "armbågsbenet", "radius",
    "ulna"] + SKELETT_ORD)

_s("kunskapsbank/skelett-underbenet.html",
   [("Bone", "Tibia"), ("Bone", "Fibula"),
    ("Joint", "Syndesmosis tibiofibularis")],
   ["Vilket av underbenets ben som bär kroppsvikten och vilket som inte gör "
    "det.",
    "Vilka landmärken tibia och fibula har.",
    "Vad syndesmosen mellan benen gör för fotledens stabilitet."],
   ["underbenets ben", "skenbenet", "vadbenet", "tibia",
    "fibula"] + SKELETT_ORD)

# --- Kärltabellerna ---------------------------------------------------------
_s("kunskapsbank/karl-armen.html",
   [("Artery", "Arteria brachialis"), ("Artery", "Arteria radialis"),
    ("Vein", "Vena cephalica")],
   ["Hur artärkedjan subclavia–axillaris–brachialis fortsätter ut i armen.",
    "Var pulsen känns och var blodtrycket mäts.",
    "Skillnaden mellan armens djupa och ytliga vener."],
   ["armens kärl", "arteria brachialis", "arteria radialis",
    "vena cephalica"] + KARL_ORD)

_s("kunskapsbank/karl-backenet.html",
   [("Artery", "Arteria iliaca interna"), ("Artery", "Arteria iliaca externa"),
    ("Vein", "Vena iliaca communis")],
   ["Var bukaortan delar sig i de gemensamma höftartärerna.",
    "Vad den inre respektive yttre höftartären försörjer.",
    "Hur bäckenets vener följer artärerna tillbaka."],
   ["bäckenets kärl", "arteria iliaca communis",
    "höftartärer"] + KARL_ORD)

_s("kunskapsbank/karl-benet.html",
   [("Artery", "Arteria femoralis"), ("Artery", "Arteria poplitea"),
    ("Vein", "Vena saphena magna")],
   ["Hur artärkedjan femoralis–poplitea fortsätter ned i foten.",
    "Var pulsen kan kännas i ljumsken, knävecket och på foten.",
    "Vad som skiljer de djupa venerna från rosenvenerna."],
   ["benets kärl", "arteria femoralis", "arteria poplitea",
    "rosenvener"] + KARL_ORD)

_s("kunskapsbank/karl-brostkorgen.html",
   [("Artery", "Aorta"), ("Artery", "Truncus pulmonalis"),
    ("Vein", "Vena cava superior")],
   ["Hur aortan är indelad och vilka grenar som avgår ur aortabågen.",
    "Vilka kärl som för blod till och från lungorna.",
    "Var den övre och den nedre hålvenen mynnar."],
   ["bröstkorgens kärl", "aorta", "lungstammen",
    "hålvenen"] + KARL_ORD)

_s("kunskapsbank/karl-buken.html",
   [("Artery", "Aorta abdominalis"), ("Artery", "Truncus coeliacus"),
    ("Vein", "Vena portae")],
   ["Vilka opariga och pariga grenar bukaortan avger.",
    "Vilka organ varje tarmartär försörjer.",
    "Vad portavenen gör och varför blodet passerar levern."],
   ["bukens kärl", "bukaorta", "truncus coeliacus", "portavenen"] + KARL_ORD)

_s("kunskapsbank/karl-huvud-hals.html",
   [("Artery", "Arteria carotis communis"), ("Artery", "Arteria vertebralis"),
    ("Vein", "Vena jugularis interna")],
   ["Var halspulsådern delar sig och vad de två grenarna försörjer.",
    "Hur kotpulsådern går upp genom halskotorna till hjärnan.",
    "Vilka vener som för blodet från huvudet tillbaka till hjärtat."],
   ["huvudet och halsens kärl", "halspulsådern", "kotpulsådern",
    "arteria carotis"] + KARL_ORD)

# --- Ledtabellerna ----------------------------------------------------------
_s("kunskapsbank/leder-bal-nacke.html",
   [("Joint", "Columna cervicalis"), ("Thing", "Rörelseomfång")],
   ["Vilka rörelser hals-, bröst- och ländryggen kan utföra.",
    "Vad som räknas som normalt rörelseomfång i varje avsnitt.",
    "Varför bröstryggen roterar mer än ländryggen."],
   ["nackens rörelser", "halsryggen", "ländryggen"] + LED_ORD)

_s("kunskapsbank/leder-kaken.html",
   [("Joint", "Articulatio temporomandibularis"), ("Thing", "Rörelseomfång")],
   ["Vilka rörelser käkleden kan utföra.",
    "Vad som räknas som normal gapning mätt i millimeter.",
    "Varför käkledens rörelse både är en glidning och en rotation."],
   ["käkledens rörelser", "käkleden", "gapning", "protrusion",
    "rörelseomfång"])

_s("kunskapsbank/leder-nedreextremitet.html",
   [("Joint", "Articulatio coxae"), ("Joint", "Articulatio genus"),
    ("Joint", "Articulatio talocruralis")],
   ["Vilka rörelser höft, knä och fotled kan utföra.",
    "I vilket rörelseplan varje rörelse sker.",
    "Vad som räknas som normalt rörelseomfång i grader."],
   ["nedre extremitetens leder", "höftleden", "knäleden",
    "fotleden"] + LED_ORD)

_s("kunskapsbank/leder-overextremitet.html",
   [("Joint", "Articulatio glenohumeralis"), ("Joint", "Articulatio cubiti"),
    ("Joint", "Articulatio radiocarpalis")],
   ["Vilka rörelser axel, armbåge, underarm och handled kan utföra.",
    "I vilket rörelseplan varje rörelse sker.",
    "Vad som räknas som normalt rörelseomfång i grader."],
   ["övre extremitetens leder", "axelleden", "armbågsleden",
    "handleden"] + LED_ORD)

# --- Nervtabellerna ---------------------------------------------------------
_s("kunskapsbank/kranialnerverna.html",
   [("Nerve", "Nervus trigeminus"), ("Nerve", "Nervus facialis"),
    ("Nerve", "Nervus vagus"), ("Nerve", "Nervus opticus")],
   ["Vad de tolv kranialnerverna heter och vilken ordning de har.",
    "Vilka nerver som är motoriska, sensoriska eller blandade.",
    "Var varje nerv lämnar skallen och vilket bortfall en skada ger."],
   ["kranialnerverna", "nervus trigeminus", "nervus facialis", "nervus vagus",
    "bortfall", "tentaplugg"])

_s("kunskapsbank/nervtabell-armen.html",
   [("Nerve", "Nervus medianus"), ("Nerve", "Nervus ulnaris"),
    ("Nerve", "Nervus radialis")],
   ["Vilka fem terminala nerver plexus brachialis delar sig i.",
    "Ur vilka rötter varje nerv kommer.",
    "Vilka muskler och vilket hudområde varje nerv försörjer."],
   ["armens nerver", "plexus brachialis", "nervus medianus", "nervus ulnaris",
    "nervus radialis"] + NERV_ORD)

_s("kunskapsbank/nervtabell-autonoma.html",
   [("AnatomicalSystem", "Autonoma nervsystemet"), ("Thing", "Sympatikus"),
    ("Thing", "Parasympatikus")],
   ["Var sympatikus och parasympatikus har sitt ursprung.",
    "Vilka signalsubstanser respektive del använder.",
    "Vad de gör med pupill, hjärta, lungor och mag-tarmkanal."],
   ["autonoma nervsystemet", "sympatikus", "parasympatikus", "ganglier",
    "signalsubstanser"])

_s("kunskapsbank/nervtabell-balen.html",
   [("Nerve", "Nervi intercostales"), ("Nerve", "Nervus subcostalis"),
    ("Thing", "Dermatom")],
   ["Hur bålens nerver löper segmentellt mellan revbenen.",
    "Vilka dermatomnivåer som är lätta att komma ihåg.",
    "Vad interkostalnerverna försörjer motoriskt och sensoriskt."],
   ["bålens nerver", "interkostalnerver", "dermatom", "segmentell"]
   + NERV_ORD)

_s("kunskapsbank/nervtabell-benet.html",
   [("Nerve", "Nervus femoralis"), ("Nerve", "Nervus ischiadicus"),
    ("Nerve", "Nervus tibialis")],
   ["Vilka nerver som utgår ur plexus lumbalis och plexus sacralis.",
    "Ur vilka rötter varje nerv kommer.",
    "Vilka muskler och vilket hudområde varje nerv försörjer."],
   ["benets nerver", "plexus lumbosacralis", "nervus femoralis",
    "nervus ischiadicus"] + NERV_ORD)

_s("kunskapsbank/nervtabell-halsen.html",
   [("Nerve", "Nervus phrenicus"), ("Nerve", "Nervus occipitalis minor"),
    ("Thing", "Plexus cervicalis")],
   ["Vilka hud- och muskelgrenar plexus cervicalis avger.",
    "Ur vilka rötter nervus phrenicus kommer och vad den styr.",
    "Varför en hög nackskada slår ut andningen."],
   ["halsens nerver", "plexus cervicalis", "nervus phrenicus",
    "diafragma"] + NERV_ORD)

_s("kunskapsbank/nervtabell-motorbanor.html",
   [("AnatomicalStructure", "Tractus corticospinalis lateralis"),
    ("AnatomicalStructure", "Tractus rubrospinalis"),
    ("Thing", "Motoriska nervbanor")],
   ["Vilka pyramidala och extrapyramidala banor som finns.",
    "Var varje bana börjar, var den korsar och var den slutar.",
    "Vilken sorts rörelse varje bana styr."],
   ["motoriska nervbanor", "tractus corticospinalis", "pyramidala",
    "extrapyramidala", "korsning"])

_s("kunskapsbank/nervtabell-sensorbanor.html",
   [("AnatomicalStructure", "Tractus spinothalamicus lateralis"),
    ("AnatomicalStructure", "fasciculus gracilis"),
    ("AnatomicalSystem", "Nervsystemet")],
   ["Vilka medvetna och omedvetna känselbanor som finns.",
    "Vilken modalitet varje bana för och var den korsar.",
    "Varför korsningsnivån avgör vilket bortfall en skada ger."],
   ["sensoriska nervbanor", "baksträngsbanan", "spinothalamicus",
    "modalitet", "korsning"])

# --- Faktatexter i kunskapsbanken -------------------------------------------
_s("kunskapsbank/sa-leds-kanseln.html",
   [("Thing", "Känsel"), ("AnatomicalSystem", "Nervsystemet"),
    ("AnatomicalStructure", "Baksträngsbanan")],
   ["Att känselns väg från hud till hjärnbark är tre neuron lång.",
    "Vilka receptorer som svarar på beröring, smärta och temperatur.",
    "Skillnaden mellan baksträngsbanan och spinotalamusbanan."],
   ["känsel", "receptorer", "baksträngsbanan", "spinotalamusbanan",
    "neuron", "korsning"])

_s("kunskapsbank/sa-styrs-en-rorelse.html",
   [("Thing", "Rörelse"), ("AnatomicalSystem", "Nervsystemet"),
    ("Thing", "Motorisk enhet")],
   ["Att ett viljemässigt kommando passerar två neuron på väg till muskeln.",
    "Vad en motorisk enhet är.",
    "Hur bortfallet skiljer sig vid skada på övre och nedre motorneuron."],
   ["rörelse", "motoriska enheten", "övre motorneuron", "nedre motorneuron",
    "ryggmärgen"])

_s("kunskapsbank/lakemedelsberakning.html",
   [("Thing", "Läkemedelsberäkning"), ("Thing", "Dosering")],
   ["Att räkna med enheterna så att svaret får rätt sort.",
    "Hur dos, styrka och volym hänger ihop.",
    "Att kontrollräkna innan svaret används."],
   ["läkemedelsberäkning", "dos", "styrka", "spädning", "infusionstakt",
    "kontrollräkning"])

_s("kunskapsbank/lakemedelsberakning-omvandlingar.html",
   [("Thing", "Läkemedelsberäkning"), ("Thing", "Droppfaktor")],
   ["Att omvandla mellan gram, milligram och mikrogram.",
    "Att räkna om en procentlösning till mg/ml.",
    "Vilka formler som gäller för dropptakt och infusion."],
   ["omvandlingar", "formler", "procent", "droppfaktor",
    "läkemedelsberäkning"])

# --- Medicinsk terminologi --------------------------------------------------
_s("kunskapsbank/medicinskt-latin.html",
   [("Thing", "Medicinskt latin"), ("Thing", "Medicinsk terminologi"),
    ("Thing", "Nomenklatur")],
   ["Hur en anatomisk term byggs av förled, rot och efterled.",
    "Vilka latinska rötter som återkommer i kroppsdelarnas namn.",
    "Vad riktnings- och rörelsetermerna betyder."],
   ["medicinskt latin", "nomenklatur", "rötter", "prefix",
    "riktningstermer", "rörelsetermer"])

_s("kunskapsbank/grekiska-i-medicinen.html",
   [("Thing", "Medicinsk terminologi"), ("Thing", "Grekiska"),
    ("Thing", "Ordbildning")],
   ["Vilka grekiska rötter som står för organ och vävnader.",
    "Vad de kliniska efterleden -it, -om och -ektomi betyder.",
    "Hur bindevokalen håller ihop en sammansatt term."],
   ["grekiska", "medicinsk terminologi", "rötter", "suffix", "prefix",
    "ordbildning"])

_s("kunskapsbank/deklinationer-pluralformer.html",
   [("Thing", "Medicinsk terminologi"), ("Thing", "Medicinskt latin"),
    ("Thing", "Deklinationer")],
   ["Hur latinska och grekiska termer bildar plural.",
    "Vad de fem latinska deklinationerna heter och hur de böjs.",
    "Varför genitivformen är den som avgör böjningen."],
   ["deklinationer", "pluralformer", "medicinskt latin", "genitiv",
    "böjning"])

_s("kunskapsbank/uttalsregler.html",
   [("Thing", "Medicinsk terminologi"), ("Thing", "Medicinskt latin"),
    ("Thing", "Grekiska alfabetet")],
   ["Hur medicinskt latin uttalas i klassiskt och medicinskt uttal.",
    "Hur diftonger och konsonantkombinationer läses ut.",
    "Var betoningen hamnar i ett latinskt ord."],
   ["uttal", "uttalsregler", "medicinskt latin", "diftonger", "betoning",
    "grekiska alfabetet"])

_s("kunskapsbank/terminologins-historia.html",
   [("Thing", "Medicinsk terminologi"), ("Thing", "Terminologia Anatomica"),
    ("Thing", "Eponymer")],
   ["Hur den medicinska terminologin vuxit fram i lager, språk för språk.",
    "Vilken roll Hippokrates, Galenos och Vesalius spelat.",
    "Vad Terminologia Anatomica är och varför eponymer är omdiskuterade."],
   ["terminologins historia", "hippokrates", "terminologia anatomica",
    "eponymer", "vesalius"])

# --- Artiklar ---------------------------------------------------------------
_s("kunskapsbank/artiklar/anatomiska-riktningar.html",
   [("Thing", "Anatomiska riktningar"), ("Thing", "Kroppens plan"),
    ("AnatomicalSystem", "Rörelseapparaten")],
   ["Vad det anatomiska normalläget är och varför allt utgår från det.",
    "Vad riktningstermerna betyder och hur de bildar motsatspar.",
    "Vilka tre plan kroppen delas i och vilka rörelser som sker i vart och "
    "ett."],
   ["anatomiska riktningar", "riktningstermer", "proximal", "distal",
    "sagittalplan", "frontalplan", "transversalplan"])

_s("kunskapsbank/artiklar/dermatom-myotom-sklerotom.html",
   [("Thing", "Dermatom"), ("Thing", "Myotom"),
    ("AnatomicalSystem", "Nervsystemet")],
   ["Vad ett ryggmärgssegment försörjer i hud, muskel och skelett.",
    "Skillnaden mellan ett dermatom och en perifer nervs utbredning.",
    "Vilka landmärken som används för att bestämma nivå."],
   ["dermatom", "myotom", "sklerotom", "ryggmärgssegment", "innervation"])

_s("kunskapsbank/artiklar/fascia-bursor-senskidor.html",
   [("Thing", "Fascia"), ("Thing", "Bursa"), ("Thing", "Senskida")],
   ["Vad fascian gör och hur den delar in musklerna i loger.",
    "Var slemsäckarna sitter och varför de finns.",
    "Varför långa senor behöver senskidor."],
   ["fascia", "bursor", "senskidor", "muskelloger", "bindväv"])

_s("kunskapsbank/artiklar/rotatorkuffen.html",
   [("AnatomicalStructure", "Rotatorkuffen"),
    ("Muscle", "Musculus supraspinatus"),
    ("Muscle", "Musculus subscapularis"),
    ("Joint", "Axelleden")],
   ["Vilka fyra muskler som bildar rotatorkuffen och var de fäster.",
    "Att kuffens senor växer ihop till en gemensam infästning.",
    "Att kuffens mekaniska uppgift är att centrera ledhuvudet.",
    "Vilka två modeller som förklarar varför kuffens senor bryts ner."],
   ["rotatorkuffen", "musculus supraspinatus", "senplatta", "centrering",
    "tuberculum majus", "bursa subacromialis", "rotatorkabeln",
    "cavitas glenoidalis"])

_s("kunskapsbank/artiklar/ledtyper.html",
   [("Joint", "Synovialled"), ("AnatomicalSystem", "Leder"),
    ("Thing", "Rörelseomfång")],
   ["Hur lederna delas in efter vilken vävnad som förbinder benen.",
    "Vilka sex typer av synovialleder som finns och hur de ser ut.",
    "Hur ledens form avgör antalet axlar och därmed rörligheten."],
   ["ledtyper", "synovialled", "kulled", "gångjärnsled", "sadelled",
    "frihetsgrader"])

_s("kunskapsbank/artiklar/sa-laser-du-en-muskeltabell.html",
   [("Thing", "Muskeltabell"), ("AnatomicalSystem", "Muskler")],
   ["Vad muskeltabellens kolumner svarar på.",
    "Att en muskels funktion går att härleda ur var den fäster.",
    "Varför innervationen hör ihop med muskelns läge."],
   ["muskeltabell", "ursprung", "fäste", "innervation", "funktion",
    "origo", "insertio"])

_s("kunskapsbank/artiklar/minnesregler-kranialnerverna.html",
   [("Thing", "Minnesregler"), ("Nerve", "Kranialnerverna")],
   ["Vilka minnesramsor som finns för kranialnervernas ordning.",
    "Vad en ramsa faktiskt lagrar och var den tar slut.",
    "Vilka minnesregler som bär anatomisk mening i sig."],
   ["minnesregler", "kranialnerverna", "minnesramsa", "plugga"])

_s("kunskapsbank/artiklar/engelska-i-medicinskt-sprak.html",
   [("Thing", "Medicinsk terminologi"), ("Thing", "Engelska"),
    ("Thing", "Fackspråk")],
   ["Hur engelskan blev medicinens gemensamma språk.",
    "Hur engelsk och svensk stavning av medicinska termer skiljer sig.",
    "Vilka falska vänner som är lätta att gå på."],
   ["engelska", "medicinskt språk", "falska vänner", "stavning",
    "lånord"])

_s("kunskapsbank/artiklar/franska-och-tyska-i-medicinskt-sprak.html",
   [("Thing", "Medicinsk terminologi"), ("Thing", "Franska"),
    ("Thing", "Tyska")],
   ["Vilka franska och tyska lånord som lever kvar i journalspråket.",
    "Varför de kom in i svenskan och när.",
    "Hur de uttalas och böjs."],
   ["franska", "tyska", "lånord", "medicinskt språk", "journalen"])

# ---------------------------------------------------------------------------
# Sidor utan `teaches` — var och en med sitt skäl (§0.4)
# ---------------------------------------------------------------------------
# `teaches` är ett påstående om ett lärandemål. En sida som inte undervisar om
# någonting ska inte påstå att den gör det — det är samma slags falska
# påstående som `reviewedBy` utan granskare (SEO_REGLER §6e). Tomt `lär_ut`
# kräver därför en rad här; annars stoppar bygget.
UTAN_LAR_UT = {
    "info.html": "presentation av sajten och dess upphovsperson, inte "
                 "undervisning",
    "integritet.html": "policytext",
    "versionshistorik.html": "ändringslogg",
}


# ---------------------------------------------------------------------------
# Kontroller
# ---------------------------------------------------------------------------
def kontrollera_register(alla: set[str]) -> None:
    """Registret mot verkligheten: inga spöken, inga omappade sidor.

    `alla` är populationen — sidorna som bär en JSON-LD-sidnod och därmed har
    någonstans att skriva egenskaperna. En sida som saknas här hade tyst blivit
    utan `about`, `teaches` och `keywords`, och det hade sett ut precis som en
    lyckad körning (CLAUDE_REGLER §0.4).
    """
    spöken = sorted((set(SIDOR) | set(UTAN_LAR_UT)) - alla)
    if spöken:
        raise SystemExit(
            "STOPP: scripts/amne.py nämner sidor som inte finns eller saknar "
            f"JSON-LD-sidnod: {spöken}. Ta bort dem eller rätta sökvägen.")

    omappade = sorted(alla - set(SIDOR))
    if omappade:
        raise SystemExit(
            f"STOPP: dessa sidor saknas i registret i scripts/amne.py: "
            f"{omappade}.\nSkriv vad sidan handlar om, vad den lär ut och "
            "vilka ord den kan sökas på. En sida utan ämnesangivelse ska vara "
            "ett beslut, inte något som tyst uteblev (CLAUDE_REGLER §0.4).")

    for rel, ämne in sorted(SIDOR.items()):
        _kontrollera_ämne(rel, ämne)


def _kontrollera_ämne(rel: str, ämne: Ämne) -> None:
    if not ämne.om:
        raise SystemExit(f"STOPP: {rel} har tom `om` i scripts/amne.py.")
    if len(ämne.om) > MAX_OM:
        raise SystemExit(
            f"STOPP: {rel} har {len(ämne.om)} ämnen i `om`, taket är {MAX_OM}. "
            "En about-lista som blir en innehållsförteckning säger inte längre "
            "vad sidan handlar om — skriv om den, klipp den inte.")
    for typ, namn in ämne.om:
        if typ not in TYPER:
            raise SystemExit(
                f"STOPP: {rel} använder @type \"{typ}\", som inte står i "
                f"TYPER i scripts/amne.py. Kända typer: "
                f"{', '.join(sorted(TYPER))}. Kontrollera på schema.org att "
                "typen finns innan du lägger till den (SEO_REGLER §6).")
        if not namn.strip():
            raise SystemExit(f"STOPP: {rel} har ett tomt namn i `om`.")

    if not ämne.lär_ut and rel not in UTAN_LAR_UT:
        raise SystemExit(
            f"STOPP: {rel} saknar lärandemål i `lär_ut`. Skriv vad sidan lär "
            "ut, eller lägg sidan i UTAN_LAR_UT i scripts/amne.py med ett "
            "skäl. Ett tomt fält får inte betyda två olika saker "
            "(CLAUDE_REGLER §0.4).")
    if ämne.lär_ut and rel in UTAN_LAR_UT:
        raise SystemExit(
            f"STOPP: {rel} står i UTAN_LAR_UT men har lärandemål. Välj ett.")
    if len(ämne.lär_ut) > MAX_LAR_UT:
        raise SystemExit(
            f"STOPP: {rel} har {len(ämne.lär_ut)} lärandemål, taket är "
            f"{MAX_LAR_UT}.")

    if not ämne.nyckelord:
        raise SystemExit(f"STOPP: {rel} har tomma `nyckelord`.")
    if len(ämne.nyckelord) > MAX_NYCKELORD:
        raise SystemExit(
            f"STOPP: {rel} har {len(ämne.nyckelord)} nyckelord, taket är "
            f"{MAX_NYCKELORD}. Fler ord gör inte sidan lättare att hitta, bara "
            "påståendet svagare.")
    if len(set(ämne.nyckelord)) != len(ämne.nyckelord):
        dubbletter = sorted({k for k in ämne.nyckelord
                             if ämne.nyckelord.count(k) > 1})
        raise SystemExit(
            f"STOPP: {rel} har samma nyckelord flera gånger: {dubbletter}.")


def main():
    import jsonld
    alla = {p.relative_to(ROOT).as_posix() for p in jsonld.alla_sidor()}
    kontrollera_register(alla)

    antal_om = sum(len(ä.om) for ä in SIDOR.values())
    antal_lär = sum(len(ä.lär_ut) for ä in SIDOR.values())
    antal_ord = sum(len(ä.nyckelord) for ä in SIDOR.values())
    print(f"{len(SIDOR)} sidor i registret, {len(UTAN_LAR_UT)} utan lärandemål "
          "med skäl.")
    print(f"  about   {antal_om} ämnen, "
          f"{min(len(ä.om) for ä in SIDOR.values())}–"
          f"{max(len(ä.om) for ä in SIDOR.values())} per sida (tak {MAX_OM})")
    print(f"  teaches {antal_lär} lärandemål (tak {MAX_LAR_UT} per sida)")
    print(f"  keywords {antal_ord} ord, "
          f"{min(len(ä.nyckelord) for ä in SIDOR.values())}–"
          f"{max(len(ä.nyckelord) for ä in SIDOR.values())} per sida "
          f"(tak {MAX_NYCKELORD})")
    typer_använda = sorted({t for ä in SIDOR.values() for t, _ in ä.om})
    print(f"  @type i bruk: {', '.join(typer_använda)}")
    print()
    exempel = "kunskapsbank/muskeltabell-overarmen.html"
    ä = SIDOR[exempel]
    print(f"Exempel – {exempel}:")
    for typ, namn in ä.om:
        print(f"  about    {typ}: {namn}")
    for rad in ä.lär_ut:
        print(f"  teaches  {rad}")
    print(f"  keywords {', '.join(ä.nyckelord)}")
    return 0


if __name__ == "__main__":
    sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
    sys.exit(main())
