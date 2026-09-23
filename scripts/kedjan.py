#!/usr/bin/env python3
"""KEDJAN — generator- och wire-stegen i den ordning de måste köras.

**Detta är enda sanningen om vilka steg som ingår och i vilken ordning.**
Listan låg fram till 0.9.438 bara i `check_generators.py`, som kör den i en
spegelkatalog för att bevisa att den rundtrippar. Samma kedja stod dessutom
avskriven för hand som en punktlista i SEO_REGLER §11 A — och den avskriften
saknade fyra steg: `generate_glossary.py` självt, `wire_terms.py`,
`wire_citations.py` och `wire_identity.py`.

Det är inte en kosmetisk lucka. Följde man §11 A ordagrant efter att ha rört en
ordlistesida regenererades de 33 `ordlista-*.html` plus `medicinskordlista.html`
utan `author`- och `publisher`-noderna i JSON-LD:n: generatorn skriver ren HTML
och identiteten läggs på av `wire_identity.py`, som inte stod i listan. Sidorna
blev korrekt HTML, alla `--check`-steg som fanns i listan lyste grönt, och
sajtens starkaste E-E-A-T-signal försvann från 34 sidor utan att något sa till.
Exakt den tysta drift §0.4 handlar om, och den uppstod ur att samma konvention
fanns i två upplagor där den ena inte kunde köras.

Därför finns den här filen: kedjan **körs**, den skrivs inte av. `check_generators.py`
importerar `KEDJA` härifrån i stället för att äga den, och SEO_REGLER §11 A säger
numera `python3 scripts/kedjan.py` i stället för att räkna upp stegen.

Användning:
    python3 scripts/kedjan.py          # kör hela kedjan mot arbetskopian
    python3 scripts/kedjan.py -v       # visa varje stegs utdata

Kedjan är idempotent: mot ett orört träd ändrar den ingenting. Det är precis
den egenskapen `check_generators.py` mäter, och den är vad som gör det ofarligt
att kräva hela kedjan i stället för de fem steg någon råkade skriva ned.
"""
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# Ordningen är kedjans: sidgeneratorerna skriver REN HTML, wire_terms lägger på
# tooltipsen, wire_citations läser sidans synliga referenslista och skriver in
# den som `citation` i JSON-LD, och generate_glossary körs näst sist eftersom
# den äger sitemap.xml och måste se de färdiga sidorna. wire_lang, wire_identity
# och wire_dates ligger allra sist just därför — de skriver i ordlistans 33 sidor
# också, och hade blivit överskrivna av glossary-generatorn i vilket tidigare
# läge som helst.
#
# Stegen här måste gå att köra i en naken filkopia UTAN `.git`, eftersom
# check_generators.py kör dem i en spegelkatalog. Allt som läser git ligger
# därför utanför listan — se FÖRE_WIRE_DATES nedan.
KEDJA = [
    ["scripts/generate_glossary.py"],
    ["scripts/generate_karl.py"],
    ["scripts/generate_leder.py"],
    ["scripts/generate_muskeltabeller.py"],
    ["scripts/generate_skelett.py"],
    ["scripts/generate_artiklar.py"],
    ["scripts/generate_medicinsk_latin.py"],
    ["scripts/generate_muskler_flashcards.py"],
    ["scripts/wire_terms.py", "--all"],
    ["scripts/wire_citations.py", "--all"],
    # Se även-blocket läggs före referenslistan och måste därför skrivas efter
    # att den finns. Steget stoppar på en kunskapsbankssida som varken står i
    # en relationsgrupp eller i UTAN_RELATERAT — en ny tabellsida ska tvinga
    # fram ett beslut, inte tyst hamna utanför korslänkningen (§0.4).
    ["scripts/wire_relaterat.py", "--all"],
    ["scripts/generate_glossary.py"],
    # FAQPage ur sidans synliga #faq. Efter generate_glossary, som skriver om
    # medicinskordlista.html utan märkningen, och före wire_identity & co, som
    # inte rör FAQPage. Steget stoppar på en FAQ det inte kan läsa och på ett
    # FAQPage-block utan synlig FAQ (§0.4).
    ["scripts/wire_faq.py", "--all"],
    ["scripts/wire_lang.py", "--all"],
    ["scripts/wire_identity.py", "--all"],
    # about/teaches/keywords. Steget stoppar på en sida som saknas i registret,
    # på ett about-namn eller nyckelord som inte står i sidans egen text, och
    # på att <meta name="keywords"> dykt upp igen någonstans.
    ["scripts/wire_amne.py", "--all"],
    ["scripts/wire_sidfot.py", "--all"],
    ["scripts/wire_dates.py", "--all"],
    # Sist: llms.txt och llms-full.txt beskriver sajten och behöver se den
    # färdig. Steget kontrollerar dessutom att varje <loc> i sitemap.xml står i
    # data/llms.json — en ny sida som aldrig kom in i indexfilen stoppar bygget
    # i stället för att tyst utebli (§0.4).
    ["scripts/generate_llms.py"],
]

# `sidodatum.py --update` härleder varje sidas ändringsdatum ur git och är
# därför omöjlig i spegeln. Den hör ändå till kedjan: `wire_dates.py` skriver
# ut det datum registret bär, så körs registret inte om först skriver wire_dates
# gårdagens datum på en sida som ändrats idag. Beroendet uttrycks som ett steg
# som skjuts in FÖRE wire_dates när kedjan körs mot arbetskopian — inte som en
# mening i en checklista, och inte som ett index som tyst pekar fel den dag
# listan ordnas om.
FORE_WIRE_DATES = ["scripts/sidodatum.py", "--update"]
WIRE_DATES = ["scripts/wire_dates.py", "--all"]


def steg_mot_arbetskopian() -> list[list[str]]:
    """KEDJA plus de steg som kräver git, i rätt ordning.

    Positionen räknas fram ur listan i stället för att skrivas som en siffra:
    flyttas `wire_dates.py` följer datumsteget med av sig självt.
    """
    if WIRE_DATES not in KEDJA:
        raise SystemExit(
            f"FEL: {' '.join(WIRE_DATES)} finns inte i KEDJA — datumsteget vet "
            "då inte var det ska in. Rättas i scripts/kedjan.py."
        )
    steg = [list(s) for s in KEDJA]
    steg.insert(steg.index(WIRE_DATES), list(FORE_WIRE_DATES))
    return steg


def kor(steg: list[list[str]], verbose: bool = False) -> int:
    """Kör stegen mot arbetskopian. Första fallerande steget stoppar kedjan.

    Ett steg som faller efter att tidigare steg redan skrivit på disk lämnar
    trädet halvgenererat — därför skrivs det ut vilket steg som föll och hur
    långt kedjan kom, så nästa körning inte gissar.
    """
    for n, cmd in enumerate(steg, 1):
        r = subprocess.run([sys.executable] + cmd, cwd=ROOT,
                           capture_output=True, text=True)
        if r.returncode != 0:
            print(f"STOPP i steg {n}/{len(steg)}: {' '.join(cmd)}\n"
                  f"{r.stdout}{r.stderr}", file=sys.stderr)
            print(f"Kedjan avbröts — steg 1–{n - 1} har skrivit på disk, "
                  f"steg {n}–{len(steg)} har inte körts.", file=sys.stderr)
            return 1
        if verbose:
            print(f"--- {n}/{len(steg)} {' '.join(cmd)}\n{r.stdout}")
        else:
            print(f"  {n:2}/{len(steg)}  {' '.join(cmd)}")
    return 0


def main(argv: list[str]) -> int:
    verbose = "-v" in argv or "--verbose" in argv
    steg = steg_mot_arbetskopian()
    print(f"KEDJAN — {len(steg)} steg mot {ROOT}")
    if kor(steg, verbose):
        return 1
    # Ingen sammanfattning som bara säger "klart": kedjan skriver på disk, och
    # det som betyder något är om resultatet håller. Verifieringen är ETT
    # kommando och står här, inte i ett dokument som kan glömmas.
    print(f"OK: alla {len(steg)} steg körda. Verifiera med "
          "`python3 scripts/check_generators.py`.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
