#!/usr/bin/env python3
"""Lägg "Se även"-blocket på plats i varje kunskapsbankssida som ska ha ett.

Kartan bor i `scripts/relaterat.py`; det här skriptet gör inget annat än att
placera blocket rätt och hålla det identiskt. Skriv aldrig in ett Se
även-block för hand på en sida — då finns det två upplagor av relationen, och
två upplagor glider isär (SEO_REGLER §6f).

**Placeringen är bestämd genom att läsa slutet av `<main>` på varje berörd
sidtyp** — muskeltabell, skelett, kärl, nervtabell och ledtabell (CLAUDE_REGLER
§0.5 punkt 1). Alla fem slutar likadant: brödtext → `.info-about` →
`.kb-sources` → `.actions` → sidfot. Blocket läggs **före `.kb-sources`**:

  * Efter referenserna hade det knuffat ner referenslistan från sista plats,
    där SEO_REGLER §6b vill ha den.
  * Mellan referenserna och `.actions` hade sidan fått två rader
    knapp­liknande länkar efter varandra — pillarna och knappraden läser som
    samma sak två gånger.

Före `.kb-sources` hamnar det i stället direkt efter `.info-about`, som redan
säger "vill du träna aktivt?". Finstilt hör ihop med finstilt, och vidarelänkar
hör ihop med vidarelänkar (§0.5 punkt 2).

**Formen är återanvänd, inte uppfunnen.** `.kb-seealso` med rubriken "Se även"
finns sedan tidigare på `kunskapsbank/index.html`. Ingen ny CSS skrivs, och
ordet är detsamma — två namn för samma sak är precis det problem punkt 8 löste.

**Idempotent genom att skriva om, inte hoppa över.** Ett befintligt block tas
bort och byggs på nytt, så att en ändrad karta slår igenom på alla sidor vid
nästa körning. Ett skript som hoppade över redan wirade sidor hade lämnat den
gamla länklistan kvar — precis det som gjorde `--sync-defs` nödvändig i
`wire_terms.py`.

Steget ligger efter `wire_citations.py` i kedjan: generatorerna skriver ren
HTML och hade annars raderat blocket vid varje körning.

Användning:
    python3 scripts/wire_relaterat.py --all
    python3 scripts/wire_relaterat.py --check --all   # exit 1 om något ändras
    python3 scripts/wire_relaterat.py kunskapsbank/muskeltabell-handen.html
"""
import pathlib
import re
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from relaterat import ROOT, RX, block, kartan  # noqa: E402

# Ankarna vi lägger oss före, i prioritetsordning. Radbrottet och indraget före
# taggen fångas med, så att blocket kan sättas in på exakt samma form.
ANKARE = [
    re.compile(r'\n([ \t]*)<div class="kb-sources"'),
    re.compile(r'\n([ \t]*)<div class="actions"'),
]


def wire_html(rel: str, html: str, mål: list[str]) -> str:
    """Returnera html med Se även-blocket på sin kanoniska plats."""
    html = RX.sub("", html)            # ta bort ev. befintligt block

    for ankare in ANKARE:
        m = ankare.search(html)
        if m:
            indrag = m.group(1)
            return (html[:m.start()] + "\n" + block(rel, indrag, mål) + "\n"
                    + html[m.start() + 1:])

    raise ValueError(
        "sidan har varken .kb-sources eller .actions att lägga blocket före — "
        "Se även-blocket hade tyst uteblivit (CLAUDE_REGLER §0.4). Ge sidan en "
        "referenslista enligt SEO_REGLER §6b, eller lägg den i UTAN_RELATERAT "
        "i scripts/relaterat.py med ett skäl.")


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

    karta = kartan()                   # validerar kartan innan något skrivs
    filer = sorted(karta) if argv[0] == "--all" else list(argv)

    ändrade = 0
    for rel in filer:
        if rel not in karta:
            print(f"STOPP: {rel} står inte i kartan i scripts/relaterat.py.",
                  file=sys.stderr)
            return 1
        f = ROOT / rel
        html = f.read_text(encoding="utf-8")
        try:
            ny = wire_html(rel, html, karta[rel])
        except ValueError as e:
            print(f"STOPP i {rel}: {e}", file=sys.stderr)
            return 1
        if ny != html:
            ändrade += 1
            if check:
                print(f"  {rel}: Se även-blocket skulle skrivas")
            else:
                f.write_text(ny, encoding="utf-8")

    verb = "skulle skrivas" if check else "skrivet"
    print(f"Se även-blocket {verb} på {len(filer)} sidor – {ändrade} "
          "sida/sidor ändrad(e).")
    return 1 if (check and ändrade) else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
