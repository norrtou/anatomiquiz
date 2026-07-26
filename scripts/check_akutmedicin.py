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

Skriptet gör två saker:

  1. Kör `node scripts/test_verktyg_akutmedicin.js` — motorn mot facit.
  2. Jämför den statiska poängtabellen och svarstabellen mot facit, cell för
     cell, i BÅDA riktningar: varje intervall i facit ska stå i sin cell, och
     varje rad i tabellen ska ha en post i facit. En rad som inte känns igen
     stoppar bygget i stället för att tyst hoppas över (§0.4).

Radernas koppling till facit står i `RADER` nedan och är handskriven, eftersom
tabellen slår ihop band som facit håller isär ("≤8" och "≥25" står i samma
cell). Att kontrollera, hitta och jämföra är mekaniskt och görs här.

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
NODTEST = "scripts/test_verktyg_akutmedicin.js"

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
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
