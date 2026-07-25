#!/usr/bin/env python3
"""Märk latinsk text med `lang="la"` (WCAG 3.1.2 Language of Parts, AA).

Utan attributet läser en skärmläsare *musculus sternocleidomastoideus* med
svensk fonetik. Sajten hade **noll** förekomster före 0.9.275.

Två ställen märks, båda med en exakt regel ur `scripts/latin.py`:

* **Tabellernas latinkolumner** — varje `<em>` i en cell vars `data-label`
  följer konventionen "(latin)". Attributet sitter på `<em>`, aldrig på cellen:
  nervtabellerna skriver `<em>Nervus medianus</em><br>(medianusnerven)`, och ett
  `lang="la"` på cellen hade märkt den svenska översättningen som latin också.
* **Ordlistans latinska uppslagsord** — de som står i Terminologia Anatomicas
  inverterade form ("abductor pollicis brevis, musculus"). Resten av ordlistan
  är svensk eller internationell och lämnas omärkt; se GENUS i `latin.py`.

**Ett eget kedjesteg, inte fem generatorer.** Latinkolumner finns både i
genererade tabeller (muskler, skelett, kärl) och i handskrivna (nervtabellerna,
kranialnerverna). Samma slutsats som punkt 4, 6 och 8 i SEO-svepet.

**Idempotent genom att skriva om, inte hoppa över.** Ett befintligt `lang="la"`
plockas bort och sätts tillbaka enligt regeln, så att en ändring i `latin.py`
slår igenom på alla sidor vid nästa körning.

Skriptet ligger efter `generate_glossary.py` (som annars skriver över ordlistans
33 sidor) och före `wire_identity.py` i kedjan.

Användning:
    python3 scripts/wire_lang.py --all
    python3 scripts/wire_lang.py --check --all   # exit 1 om något skulle ändras
    python3 scripts/wire_lang.py kunskapsbank/nervtabell-armen.html
"""
import html as _html
import pathlib
import re
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from latin import KOLUMN_RX, är_inverterad_ta, är_svenska  # noqa: E402

ROOT = pathlib.Path(__file__).resolve().parent.parent

CELL_RX = re.compile(r'<td role="cell" data-label="([^"]*)">(.*?)</td>', re.S)
EM_RX = re.compile(r"<em(?: lang=\"la\")?>(.*?)</em>", re.S)
DT_RX = re.compile(
    r'<dt class="glossary-term"(?: lang="la")? itemprop="name">(.*?)</dt>')


def _text(fragment: str) -> str:
    """Cellens läsbara text, utan taggar."""
    return _html.unescape(re.sub(r"<[^>]+>", "", fragment)).strip()


def wire_html(rel: str, html: str) -> tuple[str, int, int]:
    """Returnera (html, antal märkta <em>, antal märkta <dt>)."""
    em_antal = 0

    def cell(m: re.Match) -> str:
        nonlocal em_antal
        etikett, innehåll = m.group(1), m.group(2)
        if not KOLUMN_RX.search(_html.unescape(etikett)):
            return m.group(0)
        träffar = EM_RX.findall(innehåll)
        if not träffar:
            raise ValueError(
                f'cellen "{etikett}" saknar <em> och hade tyst lämnats omärkt '
                "(CLAUDE_REGLER §0.4). Latinkolumnens latinska fras ska stå i "
                f"<em>. Cellens text: {_text(innehåll)[:60]!r}")
        for t in träffar:
            if är_svenska(_text(t)):
                raise ValueError(
                    f'<em> i kolumnen "{etikett}" innehåller svenska tecken och '
                    f"skulle märkts som latin: {_text(t)[:60]!r}. Flytta den "
                    "svenska texten utanför <em> — ett felaktigt lang=\"la\" "
                    "läses upp med latinsk fonetik och är sämre än inget alls.")
        em_antal += len(träffar)
        return (f'<td role="cell" data-label="{etikett}">'
                + EM_RX.sub(lambda e: f'<em lang="la">{e.group(1)}</em>',
                            innehåll) + "</td>")

    html = CELL_RX.sub(cell, html)

    dt_antal = 0

    def dt(m: re.Match) -> str:
        nonlocal dt_antal
        term = _html.unescape(m.group(1))
        try:
            latin = är_inverterad_ta(term)
        except ValueError as e:
            raise ValueError(f"{e} (på sidan {rel})") from None
        if not latin:
            return ('<dt class="glossary-term" itemprop="name">'
                    f"{m.group(1)}</dt>")
        dt_antal += 1
        return ('<dt class="glossary-term" lang="la" itemprop="name">'
                f"{m.group(1)}</dt>")

    return DT_RX.sub(dt, html), em_antal, dt_antal


def sidor() -> list[str]:
    """Alla HTML-sidor utanför `_arkiv`.

    Populationen är hela sajten, inte de sidor som råkar ha en latinkolumn
    idag: en ny tabellsida ska märkas utan att någon minns att lägga till den.
    """
    return sorted(p.relative_to(ROOT).as_posix()
                  for p in ROOT.rglob("*.html")
                  if "_arkiv" not in p.parts and "node_modules" not in p.parts)


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

    ändrade = em_totalt = dt_totalt = 0
    for rel in filer:
        f = ROOT / rel
        gammal = f.read_text(encoding="utf-8")
        try:
            ny, em, dt_ = wire_html(rel, gammal)
        except ValueError as e:
            print(f"STOPP i {rel}: {e}", file=sys.stderr)
            return 1
        em_totalt += em
        dt_totalt += dt_
        if ny != gammal:
            ändrade += 1
            if check:
                print(f"  {rel}: lang=\"la\" skulle skrivas")
            else:
                f.write_text(ny, encoding="utf-8")

    verb = "skulle märkas" if check else "märkta"
    print(f'lang="la" {verb}: {em_totalt} <em> i latinkolumner och '
          f"{dt_totalt} latinska uppslagsord över {len(filer)} sidor – "
          f"{ändrade} sida/sidor ändrad(e).")
    return 1 if (check and ändrade) else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
