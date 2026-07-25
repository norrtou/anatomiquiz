#!/usr/bin/env python3
"""Skriv in sajtens författare och utgivare i varje sidas JSON-LD-huvudnod.

Sista steget i sidkedjan, efter generatorerna, `wire_terms.py` och
`wire_citations.py`. Det ligger sist därför att `generate_glossary.py` skriver
om ordlistans 33 sidor i slutet av kedjan — ett identitetssteg tidigare hade
skrivits över av just den generatorn.

Entiteterna definieras i `scripts/identity.py`, inte här. Det här skriptet vet
bara *var* de ska stå: i den eller de noder som beskriver sidan
(`Article`/`LearningResource`/`CollectionPage`/`WebApplication`/`AboutPage`/
`DefinedTermSet`). `FAQPage` och `BreadcrumbList` beskriver något annat än
sidan och lämnas i fred — samma gräns som `wire_citations.py` drar.

Befintliga `author`/`publisher` ersätts **på plats**, så att egenskapernas
ordning i objektet bevaras och diffen stannar vid det som faktiskt ändras.
Saknas de infogas de före `citation` om den finns, annars sist.

Användning:
    python3 scripts/wire_identity.py --all
    python3 scripts/wire_identity.py --check --all    # tyst = inget att göra
    python3 scripts/wire_identity.py kunskapsbank/ledtyper.html
"""
import json
import pathlib
import re
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from identity import ORGANISATION, PERSON  # noqa: E402

ROOT = pathlib.Path(__file__).resolve().parent.parent

LD = re.compile(r'(<script type="application/ld\+json">)(.*?)(</script>)', re.S)

# Noder som beskriver SIDAN och därför bär sidans författare och utgivare.
HUVUDTYPER = {"Article", "LearningResource", "CollectionPage", "WebApplication",
              "AboutPage", "DefinedTermSet", "WebPage"}

# Noder som beskriver något annat än sidan. En FAQ har ingen egen författare.
UNDANTAG = {"FAQPage", "BreadcrumbList"}


def _indrag(block):
    """(basindrag, innerindrag) för JSON-objektet i ett ld+json-block."""
    rader = [r for r in block.split("\n") if r.strip()]
    bas = re.match(r"\s*", rader[0]).group(0)
    inner = re.match(r"\s*", rader[1]).group(0) if len(rader) > 1 else bas + "  "
    return bas, inner


def _toppnivå(block, inner, namn):
    """(start, slut) för raden `"namn": <värde>` på objektets toppnivå.

    Toppnivån känns igen på indraget: `json.dumps(indent=2)` ger varje
    toppnivåegenskap exakt `inner` som radbörjan, medan allt djupare ligger
    längre in. Värdets slut hittas med `raw_decode`, som klarar godtyckligt
    nästlade objekt och listor — en regex hade fallit på första `}` i en
    inbäddad nod.
    """
    nyckel = f'\n{inner}"{namn}": '
    i = block.find(nyckel)
    if i < 0:
        return None
    start = i + 1
    _, slut = json.JSONDecoder().raw_decode(block, start + len(nyckel) - 1)
    return start, slut


def _formatera(inner, namn, värde):
    """`"namn": <värde>` med `värde` indraget till objektets toppnivå."""
    kropp = json.dumps(värde, ensure_ascii=False, indent=2)
    rader = kropp.split("\n")
    kropp = "\n".join([rader[0]] + [inner + r for r in rader[1:]])
    return f'{inner}"{namn}": {kropp}'


def _sätt(block, namn, värde):
    """Returnera blocket med toppnivåegenskapen `namn` satt till `värde`."""
    bas, inner = _indrag(block)
    ny = _formatera(inner, namn, värde)

    träff = _toppnivå(block, inner, namn)
    if träff:                                  # ersätt på plats
        start, slut = träff
        return block[:start] + ny + block[slut:]

    ankare = _toppnivå(block, inner, "citation")
    if ankare:                                 # infoga före citation
        start = ankare[0]
        return block[:start] + ny + ",\n" + block[start:]

    slut = block.rstrip()                      # infoga sist, före rotens }
    if not slut.endswith("}"):
        raise ValueError("ld+json-blocket slutar inte med }")
    svans = block[len(slut):]
    return slut[:-1].rstrip() + ",\n" + ny + "\n" + bas + "}" + svans


def _är_sidnod(data):
    typ = data.get("@type")
    typ = set(typ if isinstance(typ, list) else [typ])
    return bool(typ & HUVUDTYPER) and not (typ & UNDANTAG)


def wire_html(html):
    """Returnera html med author/publisher satta i sidans huvudnod(er)."""
    def skriv(m):
        data = json.loads(m.group(2))
        if "@graph" in data:
            raise ValueError("@graph stöds inte — identiteten skulle hamna fel")
        if not _är_sidnod(data):
            return m.group(0)
        block = _sätt(m.group(2), "author", PERSON)
        block = _sätt(block, "publisher", ORGANISATION)
        return m.group(1) + block + m.group(3)

    return LD.sub(skriv, html)


def alla_sidor():
    return sorted(p for p in ROOT.rglob("*.html")
                  if "_arkiv" not in p.parts
                  and LD.search(p.read_text(encoding="utf-8")))


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
        noder += sum(1 for m in LD.finditer(html)
                     if _är_sidnod(json.loads(m.group(2))))
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
