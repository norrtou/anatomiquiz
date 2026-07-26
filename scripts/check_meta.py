#!/usr/bin/env python3
"""Mät `<title>` och `<meta name="description">` mot Bings hårda krav.

`SEO_REGLER.md` §2 och §3 anger exakta spann, men ingenting har hittills mätt
dem. En description som glidit till 168 tecken ser korrekt ut i källkoden och
i webbläsaren — den kapas först i Bings träfflista, alltså på det enda ställe
där den har en uppgift. Det är samma sorts osynliga fel som kontrasten
(`check_kontrast.py`) och rubrikkedjan (`check_rubriker.py`): bara något som
körs kan hitta det.

Bakgrunden är att fälten är **handjusterade**. Användaren har finskurit dem
sida för sida (0.8.16/0.8.17) och de får inte ändras utan uttrycklig begäran
(CLAUDE_REGLER, meta-regeln). Just därför behövs mätningen: ett fält som ingen
generator äger kan bara hållas rätt av en kontroll, inte av en omkörning.

## Vad som mäts (SEO_REGLER §2–3)

`<title>`
  * 5–65 tecken inklusive ` | Anatomiquiz`. Bing trunkerar vid ~70.
  * Unik över sajten — Bing flaggar dubbletter.
  * Avslutas med ` | Anatomiquiz` (varumärkessuffixet).

`<meta name="description">`
  * Finns, och är 25–155 tecken. **155 är takgränsen som aldrig får överskridas.**
  * Husnormen 127–150 rapporteras som en anmärkning, inte som ett fel: ett
    kortare fält är inte trasigt, bara outnyttjat, och att tvinga fram
    utfyllnad vore precis den keyword-stuffing §3 förbjuder.
  * Unik över sajten.

Bara sidor i `sitemap.xml` mäts — `noindex`-sidor har ingen träfflista att
kapas i.

Användning:
    python3 scripts/check_meta.py           # exit 1 vid brott mot ett hårt krav
    python3 scripts/check_meta.py -v        # lista varje sida med sina längder
    python3 scripts/check_meta.py --husnorm # låt husnormen 127–150 också fälla
"""
import html as _html
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SITE = "https://anatomiquiz.se/"

TITEL_MIN, TITEL_MAX = 5, 65
DESC_MIN, DESC_TAK = 25, 155
HUS_MIN, HUS_MAX = 127, 150
SUFFIX = " | Anatomiquiz"

LOC_RX = re.compile(r"<loc>([^<]+)</loc>")
TITEL_RX = re.compile(r"<title>(.*?)</title>", re.S | re.I)
DESC_RX = re.compile(r'<meta\s+name=["\']description["\']\s+content=["\'](.*?)["\']\s*/?>', re.S | re.I)


def sidor():
    """Filerna bakom sitemap.xml:s URL:er, i sitemapens ordning."""
    sitemap = (ROOT / "sitemap.xml").read_text(encoding="utf-8")
    ut = []
    for loc in LOC_RX.findall(sitemap):
        rel = loc[len(SITE):] if loc.startswith(SITE) else loc
        if rel in ("", "/"):
            rel = "index.html"
        fil = ROOT / rel
        if fil.is_dir():
            fil = fil / "index.html"
        if fil.is_file():
            ut.append((rel or "index.html", fil))
    return ut


def falt(html_text, rx):
    m = rx.search(html_text)
    if not m:
        return None
    return _html.unescape(m.group(1)).strip()


def main(argv):
    utforlig = "-v" in argv or "--verbose" in argv
    husnorm_faller = "--husnorm" in argv

    fel, anmarkningar = [], []
    sedda_titlar, sedda_desc = {}, {}
    matta = 0

    for rel, fil in sidor():
        text = fil.read_text(encoding="utf-8")
        titel = falt(text, TITEL_RX)
        desc = falt(text, DESC_RX)
        matta += 1

        if not titel:
            fel.append((rel, "saknar <title>"))
        else:
            if not TITEL_MIN <= len(titel) <= TITEL_MAX:
                fel.append((rel, f"title {len(titel)} tecken, kravet är "
                                 f"{TITEL_MIN}–{TITEL_MAX} (§2)"))
            if not titel.endswith(SUFFIX):
                anmarkningar.append((rel, f"title saknar suffixet '{SUFFIX.strip()}' (§2)"))
            if titel in sedda_titlar:
                fel.append((rel, f"title är identisk med {sedda_titlar[titel]} (§2)"))
            else:
                sedda_titlar[titel] = rel

        if not desc:
            fel.append((rel, "saknar <meta name=\"description\">"))
        else:
            if len(desc) > DESC_TAK:
                fel.append((rel, f"description {len(desc)} tecken — taket är "
                                 f"{DESC_TAK} och får aldrig överskridas (§3)"))
            elif len(desc) < DESC_MIN:
                fel.append((rel, f"description {len(desc)} tecken, minst {DESC_MIN} (§3)"))
            elif not HUS_MIN <= len(desc) <= HUS_MAX:
                rad = (rel, f"description {len(desc)} tecken, utanför husnormen "
                            f"{HUS_MIN}–{HUS_MAX} (§3)")
                (fel if husnorm_faller else anmarkningar).append(rad)
            if desc in sedda_desc:
                fel.append((rel, f"description är identisk med {sedda_desc[desc]} (§3)"))
            else:
                sedda_desc[desc] = rel

        if utforlig and titel and desc:
            print(f"  {len(titel):3d}/{len(desc):3d}  {rel}")

    for rel, text in anmarkningar:
        print(f"  anm   {rel}: {text}")

    if fel:
        print(f"\nAVVIKELSE: {len(fel)} brott mot Bings hårda krav "
              f"(SEO_REGLER §2–3).", file=sys.stderr)
        for rel, text in fel:
            print(f"  {rel}: {text}", file=sys.stderr)
        print("\nFälten är handjusterade och ägs av användaren — rätta dem inte "
              "utan uttrycklig begäran (CLAUDE_REGLER, meta-regeln).", file=sys.stderr)
        return 1

    svans = f" ({len(anmarkningar)} anmärkning(ar) om husnormen)" if anmarkningar else ""
    print(f"OK: {matta} indexerbara sidor har unik title ≤{TITEL_MAX} tecken och "
          f"description ≤{DESC_TAK} tecken{svans}.")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
