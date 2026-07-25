#!/usr/bin/env python3
"""Skriv in sajtens författare och utgivare i varje sidas JSON-LD-huvudnod.

Näst sista steget i sidkedjan, efter generatorerna, `wire_terms.py` och
`wire_citations.py`. Det ligger så sent därför att `generate_glossary.py`
skriver om ordlistans 33 sidor i slutet av kedjan — ett identitetssteg tidigare
hade skrivits över av just den generatorn.

Entiteterna definieras i `scripts/identity.py`, inte här. *Var* de ska stå —
i den eller de noder som beskriver sidan — avgörs av `scripts/jsonld.py`, som
delas med `wire_dates.py`. `FAQPage` och `BreadcrumbList` beskriver något annat
än sidan och lämnas i fred, samma gräns som `wire_citations.py` drar.

Befintliga `author`/`publisher` ersätts **på plats**, så att egenskapernas
ordning i objektet bevaras och diffen stannar vid det som faktiskt ändras.

Användning:
    python3 scripts/wire_identity.py --all
    python3 scripts/wire_identity.py --check --all    # tyst = inget att göra
    python3 scripts/wire_identity.py kunskapsbank/ledtyper.html
"""
import json
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from identity import ORGANISATION, PERSON  # noqa: E402
from jsonld import ROOT, alla_sidor, antal_sidnoder, skriv_i_sidnod, sätt  # noqa: E402


def wire_html(html):
    """Returnera html med author/publisher satta i sidans huvudnod(er)."""
    def egenskaper(block):
        block = sätt(block, "author", PERSON)
        return sätt(block, "publisher", ORGANISATION)

    return skriv_i_sidnod(html, egenskaper)


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
    filer = alla_sidor() if argv[0] == "--all" else [ROOT / a for a in argv]

    ändrade, noder = 0, 0
    for f in filer:
        html = f.read_text(encoding="utf-8")
        try:
            ny = wire_html(html)
        except (ValueError, json.JSONDecodeError) as e:
            print(f"STOPP i {f.relative_to(ROOT)}: {e}", file=sys.stderr)
            return 1
        noder += antal_sidnoder(html)
        if ny != html:
            ändrade += 1
            if check:
                print(f"  {f.relative_to(ROOT)}: identitet skulle skrivas")
            else:
                f.write_text(ny, encoding="utf-8")
    verb = "skulle skrivas" if check else "skrivna"
    print(f"author + publisher {verb} i {noder} sidnoder över {ändrade} av "
          f"{len(filer)} sidor.")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
