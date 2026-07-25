#!/usr/bin/env python3
"""Lägg sidfoten sist i `<main>` på varje sida.

Raderna och sidlistorna bor i `scripts/sidfot.py`; det här skriptet gör inget
annat än att placera blocket rätt och hålla det identiskt. Skriv aldrig in
friskrivningen eller integritetsraden för hand på en sida — då finns det två
strängar, och två strängar glider isär (SEO_REGLER §6e).

**En sidfot, inte tre lösa rader.** Före 0.9.272 låg kakraden i ett eget
`<footer class="footer">` på två sidor, datumraden löst före `</main>` på 116 och
friskrivningen som ett tredje stycke under den. Efter det som avslutar sidan —
knappraden, ordlistans tillbakaknappar — såg det ut som något som blivit över.
Nu är det ett block, och sidan slutar där den ser ut att sluta.

**Datumraden flyttas med in.** `wire_dates.py` äger datumets *värde*, men inte
dess plats: hittas en befintlig `<p class="page-updated">` någonstans på sidan
plockas den ur och läggs sist i sidfoten. Saknas den helt (en nygenererad sida)
lägger `wire_dates.py` in den i sidfoten i stället, eftersom det steget kör
efter det här.

**Idempotent genom att skriva om, inte hoppa över.** En befintlig sidfot tas bort
och byggs på nytt. Det är avsiktligt: ändrar man en rad i `sidfot.py` slår
ändringen igenom på alla sidor vid nästa körning, och en sidfot som råkat hamna
fel flyttar sig tillbaka. Ett skript som hoppar över redan wirade sidor hade
lämnat den gamla texten kvar — precis det som gjorde `--sync-defs` nödvändig i
`wire_terms.py`.

Skriptet ligger efter `wire_identity.py` och före `wire_dates.py` i kedjan, av
samma skäl som de: generatorerna skriver ren HTML och hade annars raderat
sidfoten vid varje körning.

Användning:
    python3 scripts/wire_sidfot.py --all
    python3 scripts/wire_sidfot.py --check --all   # exit 1 om något skulle ändras
    python3 scripts/wire_sidfot.py kunskapsbank/ledtyper.html
"""
import pathlib
import re
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from sidfot import ROOT, RX, block, sidor  # noqa: E402

# Sista </main> med sitt indrag och hela blankstegssvepet före. Sidfoten läggs in
# EFTER svepet, inte före: en tomrad ovanför `</section>` hör till stycket ovan
# och ska stanna där. Läggs den in före svepet äts tomraden upp, och sidan tappar
# en tomrad per körning.
MAIN_RX = re.compile(r"(\s*\n)([ \t]*)</main>")

# Datumraden med sitt radbrott och indrag — inte `\s*`-varianten i sidodatum.py.
# Den äter även tomraden ovanför, och då tappar sidan en tomrad första gången
# raden flyttas in i sidfoten.
DATUMRAD_RX = re.compile(r'\n[ \t]*<p class="page-updated">.*?</p>', re.S)


def wire_html(rel: str, html: str) -> str:
    """Returnera html med sidfoten på sin kanoniska plats."""
    # Datumraden plockas ur FÖRST: ligger den redan i sidfoten hade den annars
    # rivits med när sidfoten togs bort, och byggts om utan datum varje körning.
    datum = DATUMRAD_RX.search(html)
    datumrad = datum.group(0).strip() if datum else None
    if datum:
        html = html[:datum.start()] + html[datum.end():]

    html = RX.sub("", html)                    # ta bort ev. befintlig sidfot

    m = MAIN_RX.search(html)
    if not m:
        raise ValueError(
            "sidan saknar </main> — sidfoten hade tyst uteblivit "
            "(CLAUDE_REGLER §0.4). Ge sidan ett <main> enligt SEO_REGLER §7, "
            "eller lägg den i UTAN_SIDFOT i scripts/sidfot.py med ett skäl.")
    indrag = m.group(2) + "  "                 # ett steg in i <main>
    return html[:m.end(1)] + block(rel, indrag, datumrad) + "\n" + html[m.end(1):]


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

    filer = sidor() if argv[0] == "--all" else list(argv)

    ändrade = 0
    for rel in filer:
        f = ROOT / rel
        html = f.read_text(encoding="utf-8")
        try:
            ny = wire_html(rel, html)
        except ValueError as e:
            print(f"STOPP i {rel}: {e}", file=sys.stderr)
            return 1
        if ny != html:
            ändrade += 1
            if check:
                print(f"  {rel}: sidfoten skulle skrivas")
            else:
                f.write_text(ny, encoding="utf-8")
    verb = "skulle skrivas" if check else "skriven"
    print(f"Sidfoten {verb} på {len(filer)} sidor – {ändrade} sida/sidor "
          "ändrad(e).")
    return 1 if (check and ändrade) else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
