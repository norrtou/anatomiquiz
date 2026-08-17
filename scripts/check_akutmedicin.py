#!/usr/bin/env python3
"""Skyddet för de akutmedicinska poängskalorna (CLAUDE_REGLER §0.4, §12.2).

Skalorna finns på **två** ställen och det är med avsikt:

  * `data/akutmedicin.json` — facit som räknaren i `js/akutmedicin.js` läser.
  * `verktyg/akutmedicin/*.html` — samma poängsättning som statisk
    uppslagstabell, för läsaren utan JavaScript, för sökmotorn och för den som
    vill kontrollera vad räknaren gör.

Två upplagor av samma sanning glider isär — det är den slutsats SEO_REGLER §6b,
§6d, §6e och §9b kom till var för sig. Här går det inte att lösa genom att
generera tabellen ur facit: sidan är handskriven, bär tooltips från
`wire_terms.py` och ska formuleras för en läsare, inte serialiseras. Alltså
mäts likheten i stället, exakt och före commit.

Skriptet gör tre saker:

  1. Kör `node scripts/test_verktyg_akutmedicin.js` — motorn mot facit.
  2. Jämför NEWS2:s statiska poängtabell och svarstabell mot facit, cell för
     cell, i BÅDA riktningar: varje intervall i facit ska stå i sin cell, och
     varje rad i tabellen ska ha en post i facit. En rad som inte känns igen
     stoppar bygget i stället för att tyst hoppas över (§0.4).
  3. Kontrollerar att `syra-bas.html` (korrigerat natrium, effektiv
     osmolalitet, blodgasklassificeraren) nämner varje referensvärde,
     bandgräns och koefficient som facit bär, i löptext eller tabell.

För NEWS2 är sidan en fullständig cell-för-cell-spegling av facit — det går
tack vare att poängtabellen är en riktig uppslagstabell. `syra-bas.html`s tre
instrument har ingen sådan tabellstruktur (två har en formel, ett en
beslutsgång), så där kontrolleras i stället att varje tal ur facit *nämns* på
sidan — svagare än en cell-för-cell-spegling, men det fångar ändå den
vanligaste driften: att en gräns eller koefficient ändras i det ena stället
och glöms i det andra.

Radernas koppling till facit står i `RADER` nedan och är handskriven, eftersom
tabellen slår ihop band som facit håller isär ("≤8" och "≥25" står i samma
cell). Att kontrollera, hitta och jämföra är mekaniskt och görs här.

**Formlernas koefficienter finns bara i `js/akutmedicin.js` (FORMLER,
metabolKompensation, respKompensation) — inte som egna fält i facit.** De
återges här i `KOEFFICIENTER`, handskrivna av samma skäl som `RADER`: ändras
en koefficient i JS men inte i `KOEFFICIENTER` upptäcks det ändå, eftersom
`scripts/test_verktyg_akutmedicin.js` redan pinnar samma tal via sina
uträknade facit — de två skydden täcker varandras blinda fläck.

Användning:
    python3 scripts/check_akutmedicin.py
    python3 scripts/check_akutmedicin.py -v    # visa varje jämförd cell
"""
import html as htmllib
import json
import pathlib
import re
import shutil
import subprocess
import sys

ROT = pathlib.Path(__file__).resolve().parent.parent
FACIT = ROT / "data" / "akutmedicin.json"
SIDA = ROT / "verktyg" / "akutmedicin" / "vitalparametrar.html"
SIDA_SYRABAS = ROT / "verktyg" / "akutmedicin" / "syra-bas.html"
SIDA_BLODPROPPAR = ROT / "verktyg" / "akutmedicin" / "blodproppar.html"
NODTEST = "scripts/test_verktyg_akutmedicin.js"

# Vilken sida som speglar vilken skala. Varje post i facit måste stå i EN av
# de två uppslagen nedan, annars stoppar skriptet: en ny skala som ingen sida
# kontrollerar ska synas, inte tyst passera (CLAUDE_REGLER §0.4). Det var
# precis så den här kontrollen kunde växa ifrån facit — den var handskriven
# per sida och visste inte om att facit fått fler poster.
SPEGLAD_AV = {
    "news2": "vitalparametrar.html",
    "natrium_korrigerat": "syra-bas.html",
    "osmolalitet": "syra-bas.html",
    "blodgas": "syra-bas.html",
    "wells_dvt": "blodproppar.html",
    "perc": "blodproppar.html",
    "spesi": "blodproppar.html",
    "qtc": "hjartat.html",
    "chadsva": "hjartat.html",
    "has_bled": "hjartat.html",
    "ehra": "hjartat.html",
    "qsofa": "infektion.html",
    "sofa": "infektion.html",
    "dscrb65": "infektion.html",
    "gcs": "neurologi.html",
    "rls85": "neurologi.html",
    "fyra_at": "neurologi.html",
    "befast": "neurologi.html",
    "hints": "neurologi.html",
}

# Kryssruteskalorna speglas cell för cell, som NEWS2 – de HAR en riktig
# uppslagstabell (kriterium → vikt), till skillnad från formlerna på
# syra-bas.html. Värdet är (sidfil, tabellens <caption>); tabellen slås upp
# på sin caption och aldrig på ordningen i filen, så att en ny tabell mellan
# två gamla inte tyst förskjuter varje jämförelse.
KRYSSTABELLER = {
    "wells_dvt": ("blodproppar.html", "Wells score – kriterier och poäng"),
    "perc": ("blodproppar.html", "PERC – de åtta kriterierna"),
    "spesi": ("blodproppar.html", "sPESI – de sex kriterierna"),
    "chadsva": ("hjartat.html", "CHA₂DS₂-VA – kriterier och poäng"),
    "has_bled": ("hjartat.html", "HAS-BLED – kriterier och poäng"),
    "dscrb65": ("infektion.html", "DS-CRB-65 – de sex kriterierna"),
}

# Beslutsgången har inga vikter att spegla, bara utfall. Varje utfalls rubrik
# ska stå på sidan – det är dem läsaren känner igen sin patient i.
GANGSKALOR = {
    "ehra": "hjartat.html",
    "rls85": "neurologi.html",
    "befast": "neurologi.html",
    "hints": "neurologi.html",
}

# Värdeskalor utanför NEWS2. NEWS2 speglas cell för cell via RADER nedan, vilket
# kräver en handskriven radmappning eftersom dess tabell slår ihop band som facit
# håller isär. De här skalorna har en rakare tabell, och kontrolleras därför
# generiskt: varje intervalltext ur facit ska stå på sidan, i den form facit
# skriver den ("≤21", "<300", "20–32", eller ett valalternativs egen text).
VARDESKALOR = {
    "qsofa": "infektion.html",
    "sofa": "infektion.html",
    "gcs": "neurologi.html",
    "fyra_at": "neurologi.html",
}

# Formelräknarnas tal lever i js/akutmedicin.js (FORMLER) och i facits band.
# De kontrolleras som på syra-bas.html: varje tal ska NÄMNAS på sidan.
FORMELTAL = {
    "qtc": ("hjartat.html", ["450", "460", "500", "60"]),
}

# Skalor som ligger i facit men ännu inte har någon sida. Motorn och testskalet
# täcker dem (scripts/test_verktyg_akutmedicin.js), men ingen statisk tabell
# finns att spegla mot förrän sidan skrivs. Posten ska bort härifrån samma pass
# som sidan byggs — därför står släppet i värdet.
UTAN_SIDA = {}

# Formelkoefficienter som bara lever i JS — se modulens docstring.
KOEFFICIENTER = {
    "natrium_korrigerat": ["1,6", "2,4", "5,55"],
    "osmolalitet": [],   # formeln 2×(Na+K)+glukos bär inga egna fria koefficienter
    "blodgas": ["0,2", "1,1", "0,3", "0,09", "5,3", "0,75", "3,4", "1,5", "24"],
}

# Radrubrik i poängtabellen → (parameter i facit, bandnyckel eller None).
# Syresaturationen har två rader, en per mättnadsskala, och delar parameter.
RADER = {
    "Andningsfrekvens (andetag/min)": ("af", None),
    "Syresaturation, mättnadsskala 1 (%)": ("spo2", "1"),
    "Syresaturation, mättnadsskala 2 (%)": ("spo2", "2"),
    "Andas patienten luft eller syrgas?": ("syrgas", None),
    "Systoliskt blodtryck (mmHg)": ("sbt", None),
    "Puls (slag/min)": ("puls", None),
    "Kroppstemperatur (°C)": ("temp", None),
    "Medvetandegrad": ("acvpu", None),
}

# Radrubrik i svarstabellen → bandets nivå i facit. `kritisk` är inget band i
# listan utan regeln som lyfter en låg summa, och står därför för sig.
SVARSRADER = {
    "0": "ingen",
    "1–4": "lag",
    "3 i en enskild parameter": "kritisk",
    "5–6": "medel",
    "7 eller mer": "hog",
}

TABELL = re.compile(r"<table class=\"kb-mtable\">(.*?)</table>", re.S)
RAD = re.compile(r"<tr>(.*?)</tr>", re.S)
CELL = re.compile(r"<t[hd][^>]*>(.*?)</t[hd]>", re.S)


def text(s: str) -> str:
    """Cellens rena textinnehåll, utan taggar och med entiteter avkodade."""
    return htmllib.unescape(re.sub(r"<[^>]+>", "", s)).strip()


def rader(tabell: str) -> list[list[str]]:
    """Tabellkroppens rader som listor av celltexter."""
    kropp = tabell.split("<tbody>", 1)[-1].split("</tbody>", 1)[0]
    return [[text(c) for c in CELL.findall(r)] for r in RAD.findall(kropp)]


def band_lista(param: dict, nyckel):
    return param["band"][nyckel] if nyckel else param["band"]


def kontrollera_poangtabell(skala: dict, tabell: str, fel: list, visa: bool):
    kolumner = {0: 1, 1: 2, 2: 3, 3: 4}   # poäng → cellindex (0 är radrubriken)
    params = {p["namn"]: p for p in skala["parametrar"]}
    sedda = set()

    for rad in rader(tabell):
        rubrik = rad[0]
        if rubrik not in RADER:
            fel.append(
                f"poängtabellen har raden {rubrik!r} som inte står i RADER i "
                f"{pathlib.Path(__file__).name}. En rad utan koppling till "
                "facit kan inte kontrolleras och får inte tyst passera.")
            continue
        sedda.add(rubrik)
        namn, nyckel = RADER[rubrik]
        param = params[namn]

        if param["typ"] == "val":
            # Valfältets alternativ: rätt kolumn ska ha innehåll, och
            # alternativets första ord ska stå där.
            anvanda = sorted({v["poang"] for v in param["val"]})
            fyllda = sorted(p for p, i in kolumner.items() if rad[i] != "—")
            if anvanda != fyllda:
                fel.append(f"{rubrik}: facit använder poängen {anvanda}, "
                           f"tabellen har innehåll i kolumnerna {fyllda}.")
            for v in param["val"]:
                ord0 = v["text"].split(" ")[0]
                cell = rad[kolumner[v["poang"]]]
                if not re.search(r"(?<!\w)" + re.escape(ord0) + r"(?!\w)", cell):
                    fel.append(f"{rubrik}: alternativet {ord0!r} ({v['poang']} p) "
                               f"står inte i cellen {cell!r}.")
                elif visa:
                    print(f"  OK  {rubrik} · {v['poang']} p · {ord0}")
            continue

        for regel in band_lista(param, nyckel):
            cell = rad[kolumner[regel["poang"]]]
            if regel["intervall"] not in cell:
                fel.append(
                    f"{rubrik}: facit har {regel['intervall']!r} för "
                    f"{regel['poang']} poäng, men cellen säger {cell!r}.")
            elif visa:
                print(f"  OK  {rubrik} · {regel['poang']} p · {regel['intervall']}")

    saknade = set(RADER) - sedda
    if saknade:
        fel.append("poängtabellen saknar rad för: " + ", ".join(sorted(saknade)))


def kontrollera_svarstabell(skala: dict, tabell: str, fel: list, visa: bool):
    poster = {b["niva"]: b for b in skala["band"]}
    poster["kritisk"] = skala["kritisk"]
    sedda = set()

    for rad in rader(tabell):
        rubrik = rad[0]
        if rubrik not in SVARSRADER:
            fel.append(
                f"svarstabellen har raden {rubrik!r} som inte står i "
                "SVARSRADER. En rad utan koppling till facit kan inte "
                "kontrolleras och får inte tyst passera.")
            continue
        sedda.add(rubrik)
        post = poster[SVARSRADER[rubrik]]
        for i, nyckel in ((1, "rubrik"), (2, "overvakning"), (3, "atgard")):
            if rad[i] != post[nyckel]:
                fel.append(f"svarstabellen, raden {rubrik!r}: cellen säger\n"
                           f"      {rad[i]!r}\n    men facit säger\n"
                           f"      {post[nyckel]!r}")
            elif visa:
                print(f"  OK  svarstabellen · {rubrik} · {nyckel}")

    saknade = set(SVARSRADER) - sedda
    if saknade:
        fel.append("svarstabellen saknar rad för: " + ", ".join(sorted(saknade)))


def sv(n) -> str:
    """Svensk talvisning, samma avrundningsprincip som visaTal() i
    js/akutmedicin.js: heltal utan decimaler, annars komma."""
    if float(n).is_integer():
        return str(int(n))
    s = f"{n:.3f}".rstrip("0").rstrip(".")
    return s.replace(".", ",")


def normaliserad(text: str) -> str:
    """Minustecknet skrivs − (U+2212) i löptext men -/− spelar ingen roll
    för om talet nämns — normalisera bort skillnaden före sökningen."""
    return text.replace("−", "-")


def kontrollera_forekomst(etikett: str, tal: list[str], text: str, fel: list, visa: bool):
    text_n = normaliserad(text)
    for t in tal:
        t_n = normaliserad(str(t))
        if t_n not in text_n:
            fel.append(f"{etikett}: talet {t!r} ur facit nämns inte på {SIDA_SYRABAS.name}.")
        elif visa:
            print(f"  OK  {etikett} · {t} nämns")


def granser_for(utdata: dict) -> list[int]:
    """Gränstalen ur ett bandschema, avrundade till närmaste heltal — samma
    knep som 136.99 i facit gör för att undvika glapp mellan banden."""
    return [round(b["max"]) for b in (utdata.get("band") or []) if b.get("max") is not None]


def kontrollera_natrium(facit: dict, text: str, fel: list, visa: bool):
    utdata = facit["natrium_korrigerat"]["utdata"][0]
    tal = [str(g) for g in granser_for(utdata)] + KOEFFICIENTER["natrium_korrigerat"]
    kontrollera_forekomst("Korrigerat natrium", tal, text, fel, visa)


def kontrollera_osmolalitet(facit: dict, text: str, fel: list, visa: bool):
    utdata = facit["osmolalitet"]["utdata"][0]
    granser = granser_for(utdata)
    granser.append(granser[-1] + 1)   # 319 → 320, HHS-tröskeln, är bandets nästa heltal
    kontrollera_forekomst("Effektiv serumosmolalitet", [str(g) for g in granser], text, fel, visa)


def kontrollera_blodgas(facit: dict, text: str, fel: list, visa: bool):
    ref = facit["blodgas"]["referens"]
    tal = []
    for namn in ("ph", "pco2", "hco3", "be", "anjongap", "laktat"):
        tal.append(sv(ref[namn]["min"]))
        tal.append(sv(ref[namn]["max"]))
    tal += KOEFFICIENTER["blodgas"]
    kontrollera_forekomst("Blodgasklassificeraren", tal, text, fel, visa)


def kör_nodtest() -> int:
    nod = shutil.which("node")
    if not nod:
        print("STOPP: node saknas, så " + NODTEST + " kunde inte köras. En "
              "överhoppad kontroll får inte se ut som en godkänd "
              "(CLAUDE_REGLER §0.4).", file=sys.stderr)
        return 1
    r = subprocess.run([nod, NODTEST], cwd=ROT, capture_output=True, text=True)
    if r.returncode != 0:
        print(r.stdout + r.stderr, file=sys.stderr)
        print("STOPP: " + NODTEST + " föll.", file=sys.stderr)
        return 1
    print(r.stdout.strip().splitlines()[-1])
    return 0


def blanksteg(text: str) -> str:
    """Alla följder av blanktecken till ett enda mellanslag."""
    return re.sub(r"\s+", " ", text)


def vikt(n: int) -> str:
    """Vikten som den skrivs på sidan: '+1', '−2'. Minustecknet är U+2212, samma
    som js/akutmedicin.js skriver ut – ett bindestreck här hade gett falskt larm."""
    return ("−" if n < 0 else "+") + str(abs(n))


# Taggar som sitter INUTI en mening och inte avgränsar något. De tas bort utan
# att lämna mellanslag efter sig; blocktaggar byts mot ett mellanslag, så att
# två celler aldrig kan smälta ihop till ett ord och ge en falsk träff.
INLINE_TAGG = re.compile(r"</?(?:a|em|strong|span|sup|sub|abbr|b|i|code)\b[^>]*>",
                         re.I)
OVRIG_TAGG = re.compile(r"<[^>]+>")


def sidtext_for(sidfil: str) -> str:
    """Sidans rena text, normaliserad för jämförelse mot facit.

    Två fällor, båda upptäckta som falska larm från den här kontrollen:

    1. `wire_terms.py` lägger tooltips MITT I en mening ("<a …>DVT</a>
       osannolik"). Byts varje tagg mot ett mellanslag blir det "DVT
       osannolik" med dubbelt mellanslag — därav `blanksteg()`.
    2. Värre: två intilliggande länkar ("adrenalin</a>/<a …>noradrenalin")
       får då ett mellanslag INSKJUTET där facit inte har något, och
       "adrenalin/noradrenalin" hittas aldrig. Kollapsen räddar inte det,
       eftersom mellanslagen är nya och inte dubblerade.

    Därför tas inline-taggar bort helt medan blocktaggar blir mellanslag.
    """
    p = ROT / "verktyg" / "akutmedicin" / sidfil
    rå = p.read_text(encoding="utf-8")
    utan_inline = INLINE_TAGG.sub("", rå)
    return blanksteg(normaliserad(htmllib.unescape(
        OVRIG_TAGG.sub(" ", utan_inline))))


def tabeller_pa(sidfil: str) -> dict:
    """Sidans kb-mtable-tabeller, uppslagna på sin <caption>."""
    html = (ROT / "verktyg" / "akutmedicin" / sidfil).read_text(encoding="utf-8")
    ut = {}
    for t in TABELL.findall(html):
        m = re.search(r"<caption>(.*?)</caption>", t, re.S)
        if m:
            ut[text(m.group(1))] = t
    return ut


def kontrollera_krysstabell(namn: str, skala: dict, fel: list, visa: bool):
    """Varje kriterium i facit ska stå i sidans tabell med rätt vikt, och varje
    rad i tabellen ska ha ett kriterium i facit. Båda riktningarna, så att
    varken en tillagd eller en bortglömd rad kan passera (§0.1)."""
    sidfil, rubrik = KRYSSTABELLER[namn]
    tabeller = tabeller_pa(sidfil)
    if rubrik not in tabeller:
        fel.append(f"{namn}: tabellen {rubrik!r} finns inte på "
                   f"{sidfil}. Utan den har läsaren utan "
                   "JavaScript ingen upplaga av facit.")
        return

    pa_sidan = {r[0]: r[1] for r in rader(tabeller[rubrik]) if len(r) >= 2}
    i_facit = {k["etikett"]: vikt(k["poang"]) for k in skala["kriterier"]}

    for etikett, v in i_facit.items():
        if etikett not in pa_sidan:
            fel.append(f"{namn}: kriteriet {etikett!r} står i facit men inte i "
                       f"tabellen {rubrik!r}.")
        elif pa_sidan[etikett] != v:
            fel.append(f"{namn}: {etikett!r} har vikten {v} i facit men "
                       f"{pa_sidan[etikett]!r} på sidan.")
        elif visa:
            print(f"  {namn}: {etikett[:50]!r} = {v}")

    for etikett in pa_sidan:
        if etikett not in i_facit:
            fel.append(f"{namn}: tabellen {rubrik!r} har raden {etikett!r} som "
                       "inte finns i facit. En rad utan koppling till facit kan "
                       "inte kontrolleras och får inte tyst passera.")

    # Bandens rubriker ska också stå på sidan – det är dem läsaren tolkar
    # summan med, och de glider isär lika lätt som vikterna.
    sidtext = sidtext_for(sidfil)
    for b in skala["band"]:
        if blanksteg(normaliserad(b["rubrik"])) not in sidtext:
            fel.append(f"{namn}: bandet {b['rubrik']!r} ur facit nämns inte på "
                       f"{sidfil}.")
        elif visa:
            print(f"  {namn}: band {b['rubrik']!r}")


def kontrollera_gang(namn: str, skala: dict, fel: list, visa: bool):
    """Beslutsgången har inga vikter, bara utfall. Varje utfalls rubrik ska stå
    på sidan, och varje steg-alternativ ska peka på ett utfall som finns."""
    sidfil = GANGSKALOR[namn]
    sidtext = sidtext_for(sidfil)
    for nyckel, u in skala["utfall"].items():
        if blanksteg(normaliserad(u["rubrik"])) not in sidtext:
            fel.append(f"{namn}: utfallet {u['rubrik']!r} ur facit nämns inte "
                       f"på {sidfil}.")
        elif visa:
            print(f"  {namn}: utfall {u['rubrik']!r}")
    for steg in skala["steg"]:
        for alt in steg["val"]:
            if alt.get("utfall") and alt["utfall"] not in skala["utfall"]:
                fel.append(f"{namn}: steget {steg['namn']!r} pekar på utfallet "
                           f"{alt['utfall']!r} som inte finns i facit. "
                           f"Utfall som finns: {', '.join(skala['utfall'])}.")


def kontrollera_vardeskala(namn: str, skala: dict, fel: list, visa: bool):
    """Varje intervall och varje bandrubrik ur facit ska stå på sidan.

    Ett valfälts "intervall" ÄR alternativets egen text (så skriver
    poangForVal i js/akutmedicin.js), så den jämförs som den är.
    Parametrar med roll `instalning` ger ingen poäng och har inga
    intervall att spegla.
    """
    sidfil = VARDESKALOR[namn]
    sidtext = sidtext_for(sidfil)

    def finns(s):
        return blanksteg(normaliserad(s)) in sidtext

    for p in skala["parametrar"]:
        if p.get("roll") == "instalning":
            continue
        if p["typ"] == "val":
            texter = [v["text"] for v in p["val"]]
        else:
            band = p["band"]
            grupper = band.values() if isinstance(band, dict) else [band]
            texter = [b["intervall"] for g in grupper for b in g]
        for s in texter:
            if not finns(s):
                fel.append(f"{namn}: intervallet {s!r} för {p['kort']!r} ur facit "
                           f"står inte på {sidfil}.")
            elif visa:
                print(f"  {namn}: {p['kort']} {s!r}")

    for b in skala["band"]:
        if not finns(b["rubrik"]):
            fel.append(f"{namn}: bandet {b['rubrik']!r} ur facit nämns inte på "
                       f"{sidfil}.")
        elif visa:
            print(f"  {namn}: band {b['rubrik']!r}")


def kontrollera_formeltal(namn: str, fel: list, visa: bool):
    """Formelräknarens gränsvärden lever i facit och i JS. Samma metod som för
    syra-bas.html: varje tal ska nämnas på sidan, annars har läsaren utan
    JavaScript ingen upplaga av det räknaren gör."""
    sidfil, tal = FORMELTAL[namn]
    sidtext = sidtext_for(sidfil)
    for t in tal:
        if t not in sidtext:
            fel.append(f"{namn}: talet {t!r} ur facit nämns inte på {sidfil}.")
        elif visa:
            print(f"  {namn}: talet {t}")


def kontrollera_tackning(facit: dict) -> int:
    """Varje skala i facit ska vara känd — speglad av en sida eller uttryckligen
    undantagen. En okänd post stoppar bygget (CLAUDE_REGLER §0.4)."""
    skalor = {n for n in facit if not n.startswith("_")}
    okanda = sorted(skalor - set(SPEGLAD_AV) - set(UTAN_SIDA))
    if okanda:
        print("STOPP: dessa skalor finns i data/akutmedicin.json men är okända "
              "för kontrollen:", file=sys.stderr)
        for n in okanda:
            print(f"  - {n}", file=sys.stderr)
        print("\nLägg posten i SPEGLAD_AV (skalan har en sida med statisk "
              "tabell) eller i UTAN_SIDA (sidan är inte byggd än). Att bara "
              "ligga i facit räcker inte — då kontrolleras skalan aldrig.",
              file=sys.stderr)
        return 1

    försvunna = sorted((set(SPEGLAD_AV) | set(UTAN_SIDA)) - skalor)
    if försvunna:
        print("STOPP: dessa skalor står i kontrollens uppslag men saknas i "
              f"facit: {', '.join(försvunna)}.", file=sys.stderr)
        return 1

    # En skala i UTAN_SIDA vars sida faktiskt har byggts ska flyttas över, inte
    # ligga kvar som undantag — annars tystnar kontrollen för en sida som finns.
    kvar = []
    for namn, var in UTAN_SIDA.items():
        sidfil = var.split(", ")[-1]
        if (ROT / "verktyg" / "akutmedicin" / sidfil).exists():
            kvar.append(f"{namn}: {sidfil} finns nu — flytta posten till SPEGLAD_AV")
    if kvar:
        print("STOPP: undantag som inte längre gäller:", file=sys.stderr)
        for r in kvar:
            print("  - " + r, file=sys.stderr)
        return 1

    print(f"OK: alla {len(skalor)} skalor i facit är kända – {len(SPEGLAD_AV)} "
          f"speglade av en sida, {len(UTAN_SIDA)} utan sida än "
          f"({', '.join(sorted(UTAN_SIDA))}).")
    return 0


def main(argv) -> int:
    visa = "-v" in argv or "--verbose" in argv

    if kör_nodtest() != 0:
        return 1

    if kontrollera_tackning(json.loads(FACIT.read_text(encoding="utf-8"))) != 0:
        return 1

    skala = json.loads(FACIT.read_text(encoding="utf-8"))["news2"]
    html = SIDA.read_text(encoding="utf-8")
    tabeller = TABELL.findall(html)
    if len(tabeller) != 2:
        print(f"STOPP: väntade två .kb-mtable på {SIDA.name}, hittade "
              f"{len(tabeller)}. Poängtabellen och svarstabellen är sidans "
              "statiska upplaga av facit och måste båda finnas.", file=sys.stderr)
        return 1

    fel: list[str] = []
    kontrollera_poangtabell(skala, tabeller[0], fel, visa)
    kontrollera_svarstabell(skala, tabeller[1], fel, visa)

    if fel:
        print(f"AVVIKELSE: {len(fel)} skillnader mellan data/akutmedicin.json "
              f"och {SIDA.relative_to(ROT)}:", file=sys.stderr)
        for f in fel:
            print("  - " + f, file=sys.stderr)
        print("\nFacit är räknarens sanning och sidan är läsarens. Rätta den "
              "som är fel – lämna dem aldrig olika.", file=sys.stderr)
        return 1

    antal = sum(len(band_lista(p, n)) for r, (namn, n) in RADER.items()
                for p in [next(x for x in skala["parametrar"] if x["namn"] == namn)]
                if p["typ"] != "val")
    print(f"OK: poängtabellen speglar facit – {antal} intervall och "
          f"{len(SVARSRADER)} svarsrader identiska, 0 avvikelser.")

    facit = json.loads(FACIT.read_text(encoding="utf-8"))
    if not SIDA_SYRABAS.exists():
        print(f"STOPP: {SIDA_SYRABAS.relative_to(ROT)} saknas trots att facit "
              "har poster för natrium_korrigerat, osmolalitet och blodgas.",
              file=sys.stderr)
        return 1
    text_syrabas = htmllib.unescape(re.sub(r"<[^>]+>", " ", SIDA_SYRABAS.read_text(encoding="utf-8")))

    fel2: list[str] = []
    kontrollera_natrium(facit, text_syrabas, fel2, visa)
    kontrollera_osmolalitet(facit, text_syrabas, fel2, visa)
    kontrollera_blodgas(facit, text_syrabas, fel2, visa)

    if fel2:
        print(f"AVVIKELSE: {len(fel2)} tal ur data/akutmedicin.json nämns inte "
              f"på {SIDA_SYRABAS.relative_to(ROT)}:", file=sys.stderr)
        for f in fel2:
            print("  - " + f, file=sys.stderr)
        return 1

    print("OK: syra-bas.html nämner alla referensvärden, bandgränser och "
          f"koefficienter ur facit – 0 avvikelser.")

    # Varje sida som något uppslag pekar på måste finnas – annars är facit
    # och leveransen ur synk åt andra hållet (§0.4).
    sidor = ({s for s, _ in KRYSSTABELLER.values()} | set(GANGSKALOR.values())
             | set(VARDESKALOR.values()) | {s for s, _ in FORMELTAL.values()})
    for s in sorted(sidor):
        if not (ROT / "verktyg" / "akutmedicin" / s).exists():
            print(f"STOPP: verktyg/akutmedicin/{s} saknas trots att facit har "
                  "poster som ska speglas där.", file=sys.stderr)
            return 1

    fel3: list[str] = []
    for namn in KRYSSTABELLER:
        kontrollera_krysstabell(namn, facit[namn], fel3, visa)
    for namn in GANGSKALOR:
        kontrollera_gang(namn, facit[namn], fel3, visa)
    for namn in VARDESKALOR:
        kontrollera_vardeskala(namn, facit[namn], fel3, visa)
    for namn in FORMELTAL:
        kontrollera_formeltal(namn, fel3, visa)

    if fel3:
        print(f"AVVIKELSE: {len(fel3)} skillnader mellan data/akutmedicin.json "
              f"och verktygssidorna:", file=sys.stderr)
        for f in fel3:
            print("  - " + f, file=sys.stderr)
        print("\nFacit är räknarens sanning och sidan är läsarens. Rätta den "
              "som är fel – lämna dem aldrig olika.", file=sys.stderr)
        return 1

    antal_krit = sum(len(facit[n]["kriterier"]) for n in KRYSSTABELLER)
    antal_band = sum(len(facit[n]["band"]) for n in KRYSSTABELLER)
    antal_utfall = sum(len(facit[n]["utfall"]) for n in GANGSKALOR)
    print(f"OK: {', '.join(sorted(sidor))} speglar facit – {antal_krit} "
          f"kriterier, {antal_band} band och {antal_utfall} utfall identiska, "
          "0 avvikelser.")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
