#!/usr/bin/env python3
"""Skriv in den medicinska ansvarsfriskrivningen på varje innehållssida.

Texten och sidlistan bor i `scripts/friskrivning.py`; det här skriptet gör
inget annat än att placera raden rätt och hålla den identisk. Skriv aldrig in
friskrivningen för hand på en sida — då finns det två strängar, och två
strängar glider isär (SEO_REGLER §6e).

**Placering:** sist i `<main>`, direkt **före** datumraden. Sidans metadata
läses då i den ordning den hör hemma: innehållet, referenserna, vad materialet
är, och när det senast ändrades. Raden läggs in före `.page-updated` om den
finns och annars före `</main>` — båda vägarna ger samma slutresultat, eftersom
`wire_dates.py` kör efter och lägger sin rad före `</main>`.

**Idempotent genom att skriva om, inte hoppa över.** En befintlig rad tas bort
och läggs in på nytt på den kanoniska platsen. Det är avsiktligt: ändrar man
texten i `friskrivning.py` slår ändringen igenom på alla 113 sidorna vid nästa
körning, och en rad som råkat hamna fel flyttar sig tillbaka. Ett skript som
hoppar över redan wirade sidor hade lämnat den gamla texten kvar — precis det
som gjorde `--sync-defs` nödvändig i `wire_terms.py`.

Skriptet ligger efter `wire_identity.py` och före `wire_dates.py` i kedjan, av
samma skäl som de: generatorerna skriver ren HTML och hade annars raderat raden
vid varje körning.

Användning:
    python3 scripts/wire_friskrivning.py --all
    python3 scripts/wire_friskrivning.py --check --all   # exit 1 om något skulle ändras
    python3 scripts/wire_friskrivning.py kunskapsbank/ledtyper.html
"""
import pathlib
import re
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from friskrivning import MARKUP, ROOT, RX, sidor  # noqa: E402
from sidodatum import DATUMRAD_RX  # noqa: E402

# Datumraden respektive den sista </main>, var och en med hela det blankstegs-
# svep som föregår den. Raden läggs in EFTER svepet, inte före: en tomrad ovanför
# `</section>` hör till stycket ovan och ska stanna där. Läggs den in före svepet
# äts tomraden upp, och sidan tappar en tomrad per körning.
FÖRE_DATUM_RX = re.compile(r'(\s*\n)([ \t]*)<p class="page-updated">')
MAIN_RX = re.compile(r"(\s*\n)([ \t]*)</main>")


def wire_html(html: str) -> str:
    """Returnera html med friskrivningen på sin kanoniska plats."""
    html = RX.sub("", html)                    # ta bort ev. befintlig rad

    m = FÖRE_DATUM_RX.search(html)             # före datumraden, samma indrag
    if not m:
        m = MAIN_RX.search(html)               # datumraden läggs in i <main>;
        if not m:                              # utan <main> finns ingen plats
            raise ValueError(
                "varken <p class=\"page-updated\"> eller </main> — "
                "friskrivningen hade tyst uteblivit (CLAUDE_REGLER §0.4). Ge "
                "sidan ett <main> enligt SEO_REGLER §7, eller lägg den i "
                "UTAN_FRISKRIVNING i scripts/friskrivning.py med ett skäl.")
        indrag = m.group(2) + "  "             # ett steg in i <main>
    else:
        indrag = m.group(2)
    return html[:m.end(1)] + f"{indrag}{MARKUP}\n" + html[m.end(1):]


def main(argv):
    if not argv:
        print(__doc__)
        return 0
    check = argv[0] == "--check"
    if check:
        argv = argv[1:]
    if not argv:
        print("--check kräver filer eller --all", file=sys.stderr)
        return 1

    filer = [ROOT / rel for rel in sidor()] if argv[0] == "--all" \
        else [ROOT / a for a in argv]

    ändrade = 0
    for f in filer:
        rel = f.relative_to(ROOT).as_posix()
        html = f.read_text(encoding="utf-8")
        try:
            ny = wire_html(html)
        except ValueError as e:
            print(f"STOPP i {rel}: {e}", file=sys.stderr)
            return 1
        if ny != html:
            ändrade += 1
            if check:
                print(f"  {rel}: friskrivningen skulle skrivas")
            else:
                f.write_text(ny, encoding="utf-8")
    verb = "skulle skrivas" if check else "skriven"
    print(f"Ansvarsfriskrivningen {verb} på {len(filer)} sidor – "
          f"{ändrade} sida/sidor ändrad(e).")
    return 1 if (check and ändrade) else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
