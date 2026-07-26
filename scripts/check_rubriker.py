#!/usr/bin/env python3
"""Validera varje sidas rubrikkedja: en h1, och inga hopp nedåt i nivå.

Punkt 15 i SEO-svepet var `integritet.html`, som gick h1 → h3. Enda sidan på
hela sajten med ett hopp, och just därför det svåraste felet att upptäcka: det
syns inte, sidan såg exakt likadan ut, och `.info-subheading` gav samma
utseende oavsett vilket taggnamn rubriken bar. En skärmläsare läser däremot
rubriknivån som struktur — ett hopp säger "här saknas en nivå" — och sökmotorer
och agenter läser samma kedja som sidans disposition.

Fixen var fem minuter. Utan något som *körs* hade nästa handskrivna sida kunnat
återinföra hoppet lika tyst (§0.4: en punkt är klar först när återfallet
stoppas, inte när felet är borta).

Kontrollen läser varje HTML-sida utanför `_arkiv/` och kräver tre saker:

- **exakt en `<h1>`** — sidans namn, inte fler och inte noll
- **`<h1>` först** — inga rubriker före sidans egen titel
- **inga hopp** — varje rubrik ligger högst en nivå under den föregående
  (h2 → h4 är ett hopp, h4 → h2 är det inte: att stiga tillbaka är normalt när
  ett avsnitt tar slut)

Redirect-stumpar (`<meta http-equiv="refresh">`) hoppas över automatiskt. De har
per definition inget innehåll att disponera — `ordlista-tecken.html` är sajtens
enda. Undantaget är detekterat, inte listat: en ny redirect ska inte behöva
läggas in här för hand, och en sida som slutar vara redirect faller tillbaka in
i kontrollen av sig själv.

Kommentarer, `<script>`, `<style>` och `<template>` maskas bort före mätningen.
En kommentar som *nämner* en rubriktagg (spellagen.html gör det) är inte en
rubrik, och en rubrik i en template renderas inte i den ordning den står.

Användning:
    python3 scripts/check_rubriker.py          # exit 1 vid första bristen
    python3 scripts/check_rubriker.py -v       # lista varje sidas kedja
"""
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent

MASKERA = re.compile(r"<!--.*?-->|<(script|style|template)\b[^>]*>.*?</\1\s*>",
                     re.S | re.I)
RUBRIK = re.compile(r"<h([1-6])\b[^>]*>(.*?)</h\1\s*>", re.S | re.I)
TAGG = re.compile(r"<[^>]+>")
REDIRECT = re.compile(r'<meta[^>]+http-equiv="refresh"', re.I)


def sidor():
    return sorted(p for p in ROOT.rglob("*.html") if "_arkiv" not in p.parts)


def rubriker(text):
    """[(nivå, text), …] i dokumentordning, utan maskerade block."""
    ren = MASKERA.sub(" ", text)
    return [(int(m.group(1)), " ".join(TAGG.sub(" ", m.group(2)).split()))
            for m in RUBRIK.finditer(ren)]


def main(argv):
    utförligt = "-v" in argv
    brister = []
    kontrollerade = 0
    hoppade = []

    for fil in sidor():
        rel = fil.relative_to(ROOT)
        text = fil.read_text(encoding="utf-8")
        if REDIRECT.search(text):
            hoppade.append(str(rel))
            continue

        kedja = rubriker(text)
        kontrollerade += 1
        if utförligt:
            print(f"{rel}: " + " → ".join(f"h{n}" for n, _ in kedja))

        ettor = sum(1 for n, _ in kedja if n == 1)
        if ettor != 1:
            brister.append(f"{rel}: {ettor} st <h1> – varje sida ska ha exakt en")
        if kedja and kedja[0][0] != 1:
            brister.append(f"{rel}: första rubriken är h{kedja[0][0]} "
                           f"(\"{kedja[0][1]}\") – sidan ska inledas med sin h1")
        if not kedja:
            brister.append(f"{rel}: inga rubriker alls")

        for (föregående, _), (nivå, rubriktext) in zip(kedja, kedja[1:]):
            if nivå > föregående + 1:
                brister.append(f"{rel}: h{föregående} → h{nivå} "
                               f"(\"{rubriktext}\") hoppar över h{föregående + 1}")

    if utförligt and hoppade:
        print(f"Hoppade över {len(hoppade)} redirect-stump(ar): "
              + ", ".join(hoppade))
    if brister:
        print(f"{len(brister)} brister i rubrikkedjan:", file=sys.stderr)
        for b in brister:
            print(f"  {b}", file=sys.stderr)
        print("\nSänk rubriken till närmast tillåtna nivå, eller lägg till den "
              "nivå som saknas. Utseendet styrs av klassen (t.ex. "
              "`.info-subheading`), inte av taggnamnet – att byta h3 mot h2 "
              "ändrar strukturen utan att ändra hur sidan ser ut.",
              file=sys.stderr)
        return 1

    print(f"OK: {kontrollerade} sidor har en h1 och en rubrikkedja utan hopp.")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
