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
NODTEST = "scripts/test_verktyg_akutmedicin.js"

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


def main(argv) -> int:
    visa = "-v" in argv or "--verbose" in argv

    if kör_nodtest() != 0:
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
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
