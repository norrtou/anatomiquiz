#!/usr/bin/env python3
"""Skriv sidans datum — synligt på sidan och i JSON-LD, ur samma källa.

Sista steget i sidkedjan. Läser `data/sidodatum.json` och skriver in:

  * `datePublished` och `dateModified` i den nod som beskriver sidan, och
  * raden "Senast uppdaterad <time datetime=…>" sist i `<main>`.

**Båda kommer ur samma post i registret.** Det är hela poängen: Googles
riktlinje är att det synliga datumet ska stämma med den strukturerade datan, och
den enda garanti som håller över tid är att de inte har varsin källa. Skriv
därför aldrig in ett datum för hand i vare sig HTML eller JSON-LD — rätta
`data/sidodatum.json` (eller innehållet, som är det datumet mäter) och kör om.

Sidor som redan har en egen datumformulering i brödtexten (info.html: "Anatomiquiz
uppdateras löpande. Senast uppdaterad …") märker `<time>`-elementet med
`data-updated` och får då **ingen** extra rad — elementet uppdateras på plats.
Så slipper den sidan den handpåläggning SEO_REGLER §15 tidigare krävde.

Skriptet ligger efter `wire_identity.py` i kedjan av samma skäl som den ligger
efter `generate_glossary.py`: generatorerna skriver ren HTML och hade annars
raderat raden vid varje körning.

Användning:
    python3 scripts/wire_dates.py --all
    python3 scripts/wire_dates.py --check --all    # exit 1 om något skulle ändras
    python3 scripts/wire_dates.py kunskapsbank/ledtyper.html
"""
import json
import pathlib
import re
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from jsonld import ROOT, antal_sidnoder, skriv_i_sidnod, sätt  # noqa: E402
from sidodatum import (DATUMRAD, TIME_RX, läs_register,  # noqa: E402
                       synligt_datum)

# Sista </main> på sidan, med radens indrag. Raden läggs ett steg längre in.
MAIN_RX = re.compile(r"\n([ \t]*)</main>")

# datePublished/dateModified ska stå före identiteten och referenserna, så att
# noden läses uppifrån och ner: vad sidan är, när den skrevs, vem som skrev den.
ANKARE = ("author", "publisher", "citation")


def _time(iso: str) -> str:
    return f'<time data-updated datetime="{iso}">{synligt_datum(iso)}</time>'


def wire_html(html: str, publicerad: str, andrad: str) -> str:
    """Returnera html med datumen satta i JSON-LD och synligt sist i <main>."""
    def egenskaper(block):
        block = sätt(block, "datePublished", publicerad, före=ANKARE)
        return sätt(block, "dateModified", andrad, före=ANKARE)

    html = skriv_i_sidnod(html, egenskaper)

    if TIME_RX.search(html):                   # sidan bär redan sitt datum
        return TIME_RX.sub(_time(andrad), html)

    m = MAIN_RX.search(html)
    if not m:
        raise ValueError(
            "varken <time data-updated> eller </main> — det synliga datumet "
            "hade tyst uteblivit (CLAUDE_REGLER §0.4). Ge sidan ett <main> "
            "enligt SEO_REGLER §7, eller märk ett befintligt <time> med "
            "data-updated.")
    rad = DATUMRAD.format(iso=andrad, synligt=synligt_datum(andrad))
    return html[:m.start()] + f"\n{m.group(1)}  {rad}" + html[m.start():]


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

    register = läs_register()
    if not register:
        print("STOPP: data/sidodatum.json saknas eller är tomt. Kör "
              "python3 scripts/sidodatum.py --update", file=sys.stderr)
        return 1

    if argv[0] == "--all":
        filer = [ROOT / rel for rel in sorted(register)]
    else:
        filer = [ROOT / a for a in argv]

    ändrade, noder = 0, 0
    for f in filer:
        rel = f.relative_to(ROOT).as_posix()
        post = register.get(rel)
        if not post:
            print(f"STOPP: {rel} saknas i data/sidodatum.json. Kör "
                  "python3 scripts/sidodatum.py --update", file=sys.stderr)
            return 1
        html = f.read_text(encoding="utf-8")
        try:
            ny = wire_html(html, post["publicerad"], post["andrad"])
        except (ValueError, json.JSONDecodeError) as e:
            print(f"STOPP i {rel}: {e}", file=sys.stderr)
            return 1
        noder += antal_sidnoder(html)
        if ny != html:
            ändrade += 1
            if check:
                print(f"  {rel}: datum skulle skrivas")
            else:
                f.write_text(ny, encoding="utf-8")
    verb = "skulle skrivas" if check else "skrivna"
    print(f"datePublished + dateModified {verb} i {noder} sidnoder, synligt "
          f"datum på {len(filer)} sidor – {ändrade} sida/sidor ändrad(e).")
    return 1 if (check and ändrade) else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
