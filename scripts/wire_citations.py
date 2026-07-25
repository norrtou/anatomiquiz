#!/usr/bin/env python3
"""Lägg in `citation` i sidornas JSON-LD ur deras egna, synliga referenslistor.

Steg 3 i sidkedjan, efter generatorerna och `wire_terms.py`. 71 sidor bär en
`.kb-sources`-lista med APA 7-referenser – kvalitetssäkrade, faktagranskade och
synliga för läsaren – men noll av dem var maskinläsbara. `citation` är den mest
direkta auktoritetssignal som finns för en svarsmotor på YMYL-innehåll, och den
billigaste att lägga till, eftersom källorna redan är strukturerade i sidan.

**Källan är sidans egen `<li>`-lista, inte ett register vid sidan om.** Det är
avsiktligt: en referens kan då inte stå i strukturdatan utan att synas för
läsaren, och kan inte ändras på sidan utan att strukturdatan följer med. Samma
princip som gör att `wire_terms.py` läser sitt facit i stället för att gissa.

Skriptet är idempotent och rör bara `citation`-egenskapen i sidans huvudnod
(den enda `Article`/`CollectionPage`/`WebApplication`-noden – `FAQPage` och
`BreadcrumbList` lämnas i fred). Referenser som inte går att tolka stoppar
körningen; se `scripts/apa.py`.

Användning:
    python3 scripts/wire_citations.py --all
    python3 scripts/wire_citations.py --check --all    # tyst = inget att göra
    python3 scripts/wire_citations.py kunskapsbank/ledtyper.html
"""
import json
import pathlib
import re
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from apa import APAError, citations  # noqa: E402

ROOT = pathlib.Path(__file__).resolve().parent.parent

KÄLLBLOCK = re.compile(r'<div class="kb-sources">.*?</div>', re.S)
POST = re.compile(r"<li>(.*?)</li>", re.S)
LD = re.compile(r'(<script type="application/ld\+json">)(.*?)(</script>)', re.S)

# Noder som beskriver SIDAN. FAQPage och BreadcrumbList beskriver något annat
# och ska inte bära sidans källförteckning.
HUVUDTYPER = {"Article", "LearningResource", "CollectionPage", "WebApplication"}


def referenser(html):
    """APA-strängarna i sidans synliga referenslista, i sidans ordning."""
    m = KÄLLBLOCK.search(html)
    if not m:
        return []
    return [" ".join(s.split()) for s in POST.findall(m.group(0))]


def _indrag(block):
    """(basindrag, innerindrag) för JSON-objektet i ett ld+json-block."""
    rader = [r for r in block.split("\n") if r.strip()]
    bas = re.match(r"\s*", rader[0]).group(0)
    inner = re.match(r"\s*", rader[1]).group(0) if len(rader) > 1 else bas + "  "
    return bas, inner


def _utan_citation(block, inner):
    """Ta bort ett tidigare inlagt citation-block. Formen är vår egen, se nedan."""
    rx = re.compile(r",\n" + re.escape(inner) + r'"citation": \[\n.*?\n'
                    + re.escape(inner) + r"\]", re.S)
    return rx.sub("", block)


def _med_citation(block, noder):
    """Returnera blocket med `citation` som sista egenskap i rotobjektet."""
    bas, inner = _indrag(block)
    block = _utan_citation(block, inner)
    kropp = json.dumps(noder, ensure_ascii=False, indent=2)
    kropp = "\n".join(inner + r for r in kropp.split("\n"))
    # Rotobjektets avslutande } är sista icke-tomma raden i blocket.
    slut = block.rstrip()
    if not slut.endswith("}"):
        raise ValueError("ld+json-blocket slutar inte med }")
    svans = block[len(slut):]                      # blankrader/indrag efter }
    return (slut[:-1].rstrip() + ",\n" + inner + '"citation": '
            + kropp.lstrip() + "\n" + bas + "}" + svans)


def wire_html(html):
    """Returnera html med citation inlagt i huvudnoden. Utan källista: oförändrad."""
    refs = referenser(html)
    if not refs:
        return html
    noder = citations(refs)

    träffar = []

    def spana(m):
        data = json.loads(m.group(2))
        typ = data.get("@type")
        typ = set(typ if isinstance(typ, list) else [typ])
        if typ & HUVUDTYPER and "FAQPage" not in typ:
            träffar.append(m)
        return m.group(0)

    LD.sub(spana, html)
    if len(träffar) != 1:
        raise ValueError(f"hittade {len(träffar)} huvudnoder, förväntade exakt 1")
    m = träffar[0]
    return (html[:m.start()] + m.group(1) + _med_citation(m.group(2), noder)
            + m.group(3) + html[m.end():])


def alla_sidor():
    return sorted(p for p in ROOT.rglob("*.html")
                  if KÄLLBLOCK.search(p.read_text(encoding="utf-8")))


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

    ändrade, tot = 0, 0
    for f in filer:
        html = f.read_text(encoding="utf-8")
        try:
            ny = wire_html(html)
        except (APAError, ValueError) as e:
            print(f"STOPP i {f.relative_to(ROOT)}: {e}", file=sys.stderr)
            return 1
        tot += len(referenser(html))
        if ny != html:
            ändrade += 1
            if check:
                print(f"  {f.relative_to(ROOT)}: citation skulle skrivas")
            else:
                f.write_text(ny, encoding="utf-8")
    verb = "skulle skrivas" if check else "skrivna"
    print(f"{tot} referenser {verb} som citation i {ändrade} av "
          f"{len(filer)} sidor.")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
