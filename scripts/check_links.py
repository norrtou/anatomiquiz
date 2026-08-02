#!/usr/bin/env python3
"""Validera att varje intern URL sajten påstår finns faktiskt finns på disk.

Punkt 1 i SEO-svepet var två URL:er i `llms.txt` som pekade på
`/kunskapsbank/verktyg/…` medan sidorna låg på `/verktyg/…`. Sitemap och
canonical hade rätt hela tiden — felet fanns bara i den fil som agenter läser
*först*. Det upptäcktes av en manuell genomläsning, vilket är precis det
arbetssätt §0 i CLAUDE_REGLER förbjuder: felet kunde inte upptäckas av något
som kördes, så nästa gång hade det legat kvar lika länge.

Kontrollen täcker fem påståenden om att en sida finns:

- `llms.txt` / `llms-full.txt` — varje `https://anatomiquiz.se/…`-länk
- `sitemap.xml` — varje `<loc>`
- HTML — varje intern `href`, och att `<link rel=canonical>` pekar på sidan själv
- HTML — varje `#ankare` som pekar in i en annan sida på sajten
- `data/kb_glossary_terms.json` — varje tooltip-ankare, **utan** att gå via HTML

Den femte tillkom 2026-08-02. De fyra första utgår alla från något som redan
STÅR i en fil sajten levererar, och tooltip-facit gör inte det: det är
`wire_terms.py` som skriver in dess 2 351 `href` i kunskapsbanken, artiklarna
och verktygen. En nyckel vars ankare dött slutar bara wiras — sidorna blir
tysta i stället för trasiga, och en kontroll som läser HTML ser då ingenting
alls att klaga på. Facit var därmed sajtens största obevakade beroende (2 351
länkar) fram till dess.

Arkivfiler (`_ARCHIVED*`, `_arkiv/`) får inte ligga publikt — punkt 3 i samma
svep tog bort 253 KB som ingen sida länkade till men som låg utlagt ändå.

Användning:
    python3 scripts/check_links.py          # exit 1 vid första bristen
    python3 scripts/check_links.py -v       # lista allt som kontrollerades
"""
import json
import pathlib
import re
import sys
from html.parser import HTMLParser

ROOT = pathlib.Path(__file__).resolve().parent.parent
SITE = "https://anatomiquiz.se"

# Tooltip-facit: 2 351 uppslagsord → definition + djuplänk in i ordlistan.
FACIT = ROOT / "data" / "kb_glossary_terms.json"

# Formen varje facit-href måste ha. Kontraktet är inte kosmetiskt: en tooltip
# ska leda till ett UPPSLAGSORD i ordlistan, inte till en sidas topp och inte
# ut i kunskapsbanken. Samtliga 2 351 följer den redan, så regeln kostar
# ingenting att hålla — men den gör att en href som pekar någon annanstans
# tvingar fram ett beslut i stället för att tyst bli sajtens nya norm (§0.4).
FACIT_HREF = re.compile(r"/ordlista-[a-z0-9]+\.html#term-[a-z0-9-]+")

# `ordlista-tecken.html` är en avsiktlig redirect-stump (0.9.257) och ska peka
# canonical vidare till målsidan. Den enda sidan där det är rätt.
CANONICAL_UNDANTAG = {"ordlista-tecken.html"}

INTERN = re.compile(rf'{re.escape(SITE)}(/[^\s)"\'<>\]]*)')
HREF = re.compile(r'(?:href|src)="([^"]+)"')
CANONICAL = re.compile(r'<link rel="canonical" href="([^"]+)"')
LOC = re.compile(r"<loc>([^<]+)</loc>")


class Ankare(HTMLParser):
    """Samlar varje id= och name= på en sida."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.ids = set()

    def handle_starttag(self, tag, attrs):
        d = dict(attrs)
        for nyckel in ("id", "name"):
            if d.get(nyckel):
                self.ids.add(d[nyckel])


def url_till_fil(url):
    """En absolut URL eller rot-relativ väg → filen som skulle serveras.

    Returnerar None för adresser som inte pekar in i sajten (annan domän,
    mailto:, protokollrelativt). Cachebusterns `?v=` och fragmentet hör inte
    till filnamnet och strippas.
    """
    if url.startswith(SITE):
        url = url[len(SITE):] or "/"
    väg = url.split("#")[0].split("?")[0]
    if not väg.startswith("/"):
        return None
    väg = väg.lstrip("/")
    if väg == "" or väg.endswith("/"):
        väg += "index.html"
    return ROOT / väg


def _ankare(cache, fil):
    if fil not in cache:
        p = Ankare()
        p.feed(fil.read_text(encoding="utf-8"))
        cache[fil] = p.ids
    return cache[fil]


def sidor():
    return sorted(p for p in ROOT.rglob("*.html") if "_arkiv" not in p.parts)


def main(argv):
    utförligt = "-v" in argv
    brister = []
    kontrollerade = 0
    ankarcache = {}

    def kolla(url, källa, tillåt_ankare=True):
        nonlocal kontrollerade
        kontrollerade += 1
        fil = url_till_fil(url)
        if fil is None:
            return
        if not fil.is_file():
            brister.append(f"{källa}: {url} → {fil.relative_to(ROOT)} finns inte")
            return
        if tillåt_ankare and "#" in url:
            frag = url.split("#", 1)[1]
            if frag and frag not in _ankare(ankarcache, fil):
                brister.append(f"{källa}: {url} → ankaret #{frag} finns inte "
                               f"i {fil.relative_to(ROOT)}")

    # 1. llms.txt och llms-full.txt
    for namn in ("llms.txt", "llms-full.txt"):
        f = ROOT / namn
        if f.is_file():
            for url in INTERN.findall(f.read_text(encoding="utf-8")):
                kolla(SITE + url, namn)

    # 2. sitemap.xml
    sm = ROOT / "sitemap.xml"
    if sm.is_file():
        for url in LOC.findall(sm.read_text(encoding="utf-8")):
            kolla(url, "sitemap.xml", tillåt_ankare=False)

    # 3 + 4. HTML: interna href och canonical
    for p in sidor():
        rel = p.relative_to(ROOT)
        html = p.read_text(encoding="utf-8")

        m = CANONICAL.search(html)
        if m and str(rel) not in CANONICAL_UNDANTAG:
            mål = url_till_fil(m.group(1))
            if mål is None or mål.resolve() != p.resolve():
                brister.append(f"{rel}: canonical pekar på {m.group(1)}, "
                               f"inte på sidan själv")

        for href in HREF.findall(html):
            if href.startswith(SITE) or href.startswith("/"):
                kolla(href, str(rel))         # absolut eller rot-relativ
                continue
            if href.startswith(("http://", "https://", "mailto:", "tel:",
                                "data:", "#", "//")):
                continue                      # externt eller på sidan själv
            mål = (p.parent / href.split("#")[0].split("?")[0]).resolve()
            kontrollerade += 1
            if mål.is_dir():
                mål = mål / "index.html"
            if not mål.is_file():
                brister.append(f"{rel}: href=\"{href}\" finns inte")
            elif "#" in href:
                frag = href.split("#", 1)[1]
                if frag and frag not in _ankare(ankarcache, mål):
                    brister.append(f"{rel}: href=\"{href}\" → ankaret "
                                   f"#{frag} saknas")

    # 5. Arkivfiler får inte ligga publikt.
    for p in ROOT.rglob("_ARCHIVED*"):
        if "_arkiv" not in p.parts:
            brister.append(f"{p.relative_to(ROOT)}: arkivfil ligger publikt")

    # 6. Tooltip-facit, läst direkt ur JSON i stället för ur någon sida.
    #
    # Ordningen är avsiktlig: formen kontrolleras FÖRE ankaret. En href som
    # saknar fragment eller pekar utanför ordlistan hade annars rapporterats
    # som "filen finns" och sluppit igenom med ett halvt fel.
    facit_kollade = 0
    if FACIT.is_file():
        for nyckel, post in sorted(json.loads(
                FACIT.read_text(encoding="utf-8")).items()):
            källa = f"data/kb_glossary_terms.json: \"{nyckel}\""
            href = post.get("href", "")
            if not post.get("def", "").strip():
                brister.append(f"{källa}: saknar definition – tooltipen skulle "
                               f"bli en tom ruta")
            if not href:
                brister.append(f"{källa}: saknar href")
                continue
            if not FACIT_HREF.fullmatch(href):
                brister.append(
                    f"{källa}: href=\"{href}\" har inte formen "
                    f"/ordlista-<grupp>.html#term-<ankare>. En tooltip ska "
                    f"leda till ett uppslagsord i ordlistan")
                continue
            facit_kollade += 1
            kolla(href, källa)

    if utförligt:
        print(f"{kontrollerade} interna länkar kontrollerade över "
              f"{len(sidor())} sidor, varav {facit_kollade} ur tooltip-facit.")
    if brister:
        print(f"{len(brister)} brister:", file=sys.stderr)
        for b in brister:
            print(f"  {b}", file=sys.stderr)
        return 1
    print(f"OK: {kontrollerade} interna länkar pekar på filer som finns "
          f"({facit_kollade} tooltip-ankare i facit medräknade).")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
