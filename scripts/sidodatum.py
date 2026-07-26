#!/usr/bin/env python3
"""Sidornas publicerings- och ändringsdatum — härledda ur git, lagrade i facit.

`data/sidodatum.json` är **enda sanningen** för när en sida publicerades och när
dess innehåll senast ändrades. Härur hämtar tre konsumenter samma datum, så att
de inte kan avvika från varandra:

  * `wire_dates.py`      → `datePublished`/`dateModified` i JSON-LD **och** den
                           synliga raden "Senast uppdaterad" sist i `<main>`
  * `generate_glossary.py` → `<lastmod>` i `sitemap.xml`
  * (framtida) llms.txt

**Varför git och inte ett register som fylls i för hand:** ett handhållet datum
blir aldrig uppdaterat. Varje sida som ändras utan att någon minns att flytta
datumet börjar ljuga för både läsare och sökmotor, och det syns inte. Git vet
redan exakt när varje fil ändrades — datumet ska läsas därifrån, inte skrivas.

**Varför inte filsystemets mtime:** en cachebusterbump (`?v=0.9.269`) rör 116
filer utan att en enda bokstav av innehållet ändras. mtime hade daterat om hela
sajten vid varje versionsbump. Samma sak gäller de svep som bara skriver i
JSON-LD (identitet 0.9.268, referenser 0.9.267).

**Vad som räknas som en innehållsändring** definieras av `normalisera()` nedan:
sidans kropp, med `<head>`, JSON-LD, cachebusters, själva datumraden och
blankstegsskillnader bortnormaliserade. Det är medvetet *läsarens* innehåll som
styr datumet — Googles riktlinje är att `dateModified` ska spegla en verklig
uppdatering, inte varje teknisk ändring av filen.

Registret är avsiktligt **inte** en del av generatorkedjan: kedjan måste kunna
köras i en naken filkopia utan git (se `check_generators.py`). Därför är det här
skriptet det enda som talar med git, och det körs för hand före commit.

Användning:
    python3 scripts/sidodatum.py --update    # räkna om ur git, skriv registret
    python3 scripts/sidodatum.py --check     # exit 1 om registret är inaktuellt
"""
import collections
import datetime
import json
import pathlib
import re
import subprocess
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from jsonld import LD, ROOT, är_sidnod  # noqa: E402
from relaterat import RX as RELATERAT_RX  # noqa: E402
from sidfot import HISTORISKA_RX  # noqa: E402
from sidfot import RX as SIDFOT_RX  # noqa: E402

REGISTER = ROOT / "data" / "sidodatum.json"

# ---------------------------------------------------------------------------
# Datumraden — hur den ser ut i HTML
# ---------------------------------------------------------------------------
# Markupen bor här och inte i wire_dates.py därför att normalisera() nedan måste
# kunna stryka den. Skulle raden räknas som innehåll blev resonemanget cirkulärt:
# att skriva ut datumet hade i sig varit en innehållsändring, och varje sida hade
# daterats om till den dag raden lades in.
DATUMRAD = ('<p class="page-updated">Senast uppdaterad '
            '<time data-updated datetime="{iso}">{synligt}</time></p>')

# Hela raden, som wire_dates lägger in sist i <main> på sidor som saknar egen.
DATUMRAD_RX = re.compile(r'\s*<p class="page-updated">.*?</p>', re.S)

# Enskilt <time data-updated>. Sidor som redan har en egen, inskriven
# datumformulering (info.html) märks med attributet i stället för att få en
# extra rad; då är det bara elementet som ska bytas ut respektive strykas.
TIME_RX = re.compile(r'<time data-updated datetime="[^"]*">.*?</time>', re.S)

MÅNADER = ["januari", "februari", "mars", "april", "maj", "juni", "juli",
           "augusti", "september", "oktober", "november", "december"]


def synligt_datum(iso: str) -> str:
    """2026-07-25 → 25 juli 2026."""
    d = datetime.date.fromisoformat(iso)
    return f"{d.day} {MÅNADER[d.month - 1]} {d.year}"


# ---------------------------------------------------------------------------
# Vad som räknas som innehåll
# ---------------------------------------------------------------------------
HEAD_RX = re.compile(r"<head>.*?</head>", re.S)
LD_RX = re.compile(r'<script type="application/ld\+json">.*?</script>', re.S)
CACHEBUSTER_RX = re.compile(r"\?v=[0-9]+\.[0-9]+\.[0-9]+")
# `lang="la"` (wire_lang.py) är märkning, inte innehåll. Attributet lades på 63
# sidor samma dag och ändrar inte en bokstav av det läsaren ser — räknades det
# som en uppdatering hade samtliga tabellsidor och hela ordlistan daterats om
# till den dagen. Samma skäl som sidfoten och datumraden stryks för. Att stryka
# det ur BÅDA sidor av jämförelsen är också det som gör att en revision från
# innan attributet fanns fortfarande matchar (jfr HISTORISKA_RX i sidfot.py).
LANG_RX = re.compile(r' lang="la"')
BLANKSTEG_RX = re.compile(r"\s+")

# "Se även"-blocket (wire_relaterat.py) är navigering, inte artikelinnehåll.
# Det lades på 46 sidor samma dag och hade annars daterat om exakt de sidor
# punkten finns för att lyfta — mätt genom att stänga av den här raden: 46
# sidor stod på väg från 24 juli till 26 juli. Samma skäl som sidfoten stryks
# för, och samma sak som Googles råd säger: `dateModified` ska spegla en
# verklig innehållsuppdatering, inte att en länkrad tillkommit. Konsekvensen
# räcker längre än till införandet: ändras kartan så att en region får en sida
# till, ska inte regionens övriga sidor påstå att deras innehåll är nytt.
# Mönstret bor i relaterat.py, av samma skäl som sidfotens bor i sidfot.py:
# den som äger markupen äger också mönstret som stryker den.


def normalisera(html: str) -> str:
    """Sidans läsbara innehåll, med allt som inte är en uppdatering borttaget.

    Stryker i tur och ordning:

    * `<head>` — titel, meta och OG är sidans skyltfönster, inte dess innehåll.
      En omskriven description är inte en uppdatering för läsaren.
    * JSON-LD — strukturdatan speglar sidan, den *är* inte sidan. Annars hade
      det här skriptets egen utdata (`dateModified`) räknats som en ändring.
    * datumraden — se DATUMRAD ovan.
    * sidfoten — samma resonemang. Friskrivningen och integritetsraden är
      identiska på alla sidor och lades på dem alla samma dag; räknades de som
      innehåll hade hela sajten daterats om till den dagen, vilket är precis den
      falska färskhetssignal den här normaliseringen finns för att undvika.
    * cachebusters — `?v=0.9.269` är en versionsbump, inte en ändring.
    * `lang="la"` — se LANG_RX ovan. Märkning för skärmläsare, inte innehåll.
    * "Se även"-blocket — se RELATERAT_RX ovan. Navigering, inte artikeltext.
    * blankstegsskillnader — omindentering är inte en uppdatering.
    """
    html = HEAD_RX.sub("", html)
    html = LD_RX.sub("", html)
    html = RELATERAT_RX.sub("", html)
    html = SIDFOT_RX.sub("", html)             # före DATUMRAD_RX: datumraden
    for rx in HISTORISKA_RX:                   # ligger inuti sidfoten
        html = rx.sub("", html)
    html = DATUMRAD_RX.sub("", html)
    html = TIME_RX.sub("", html)
    html = CACHEBUSTER_RX.sub("?v=", html)
    html = LANG_RX.sub("", html)
    return BLANKSTEG_RX.sub(" ", html).strip()


# ---------------------------------------------------------------------------
# Git
# ---------------------------------------------------------------------------
def _git(*args) -> str:
    r = subprocess.run(["git", "-C", str(ROOT), *args],
                       capture_output=True, text=True)
    if r.returncode != 0:
        raise SystemExit(f"STOPP: git {' '.join(args)} misslyckades:\n{r.stderr}")
    return r.stdout


def historik() -> dict[str, list[tuple[str, str, str]]]:
    """{sökväg: [(datum, blob, status), …]} med nyaste revisionen först.

    En enda `git log` över hela historiken i stället för ett anrop per fil —
    117 sidor med i snitt 55 revisioner var blir annars 117 processer.
    `--no-renames` gör att en flyttad sida syns som ett tillägg på sin nya
    sökväg, vilket är rätt: URL:en är sidans identitet (SEO_REGLER §11.E).
    """
    ut = _git("log", "--format=C %H %as", "--raw", "--no-renames", "--no-merges")
    hist = collections.defaultdict(list)
    datum = None
    for rad in ut.split("\n"):
        if rad.startswith("C "):
            datum = rad.split(" ")[2]
        elif rad.startswith(":"):
            fält = rad.split("\t")
            meta = fält[0].split()
            if fält[1].endswith(".html"):
                hist[fält[1]].append((datum, meta[3], meta[4]))
    return hist


class Blobbar:
    """Normaliserat innehåll för en git-blob, via en enda `cat-file --batch`."""

    def __init__(self):
        self.proc = subprocess.Popen(["git", "-C", str(ROOT), "cat-file", "--batch"],
                                     stdin=subprocess.PIPE, stdout=subprocess.PIPE)
        self.cache = {}

    def __call__(self, sha: str) -> str:
        if sha not in self.cache:
            self.proc.stdin.write((sha + "\n").encode())
            self.proc.stdin.flush()
            huvud = self.proc.stdout.readline().decode().split()
            if len(huvud) < 3:
                raise SystemExit(f"STOPP: okänd blob {sha}")
            rå = self.proc.stdout.read(int(huvud[2]))
            self.proc.stdout.read(1)                    # avslutande radbrytning
            self.cache[sha] = normalisera(rå.decode("utf-8", errors="replace"))
        return self.cache[sha]

    def stäng(self):
        self.proc.stdin.close()
        self.proc.wait()


def senast_ändrad(rel: str, revs, blob, idag: str) -> str:
    """Datumet då sidans INNEHÅLL senast ändrades.

    Går bakåt genom filens revisioner och stannar vid den första där det
    normaliserade innehållet skiljer sig från revisionen före. En rad
    cachebusterbumpar eller JSON-LD-svep hoppas alltså över — de är inte
    uppdateringar.
    """
    if not revs:                                   # aldrig incheckad
        return idag
    nu = normalisera((ROOT / rel).read_text(encoding="utf-8"))
    for i, (datum, sha, status) in enumerate(revs):
        if i == 0 and blob(sha) != nu:
            return idag                            # oincheckad ändring i arbetskopian
        if status == "A":
            return datum                           # filen skapades här
        if status == "D":
            raise SystemExit(
                f"STOPP: {rel} raderades i historiken utan att ha lagts till "
                "igen — datumet går inte att härleda.")
        if i + 1 >= len(revs):
            return datum
        if blob(sha) != blob(revs[i + 1][1]):
            return datum
    return idag


def egen_datepublished(html: str) -> str | None:
    """Sidans egen `datePublished`, om någon skrivits in för hand."""
    for m in LD.finditer(html):
        data = json.loads(m.group(2))
        if är_sidnod(data) and data.get("datePublished"):
            return data["datePublished"]
    return None


# ---------------------------------------------------------------------------
# Registret
# ---------------------------------------------------------------------------
KOMMENTAR = (
    "Publicerings- och ändringsdatum per sida. ENDA sanningen för <time "
    "datetime>, datePublished/dateModified i JSON-LD och <lastmod> i "
    "sitemap.xml. Skrivs av scripts/sidodatum.py --update (härleds ur git) och "
    "läses av scripts/wire_dates.py. Redigera inte 'andrad' för hand — den "
    "räknas om vid varje --update. 'publicerad' sätts en gång och flyttas "
    "aldrig; den får rättas för hand om ett publiceringsdatum är fel."
)

# Sidor som medvetet saknar JSON-LD-sidnod och därför inte har datum. Listan är
# uttrycklig: en NY sida som råkar sakna sin strukturdata ska stoppa bygget, inte
# tyst hamna utanför (CLAUDE_REGLER §0.4).
UTAN_SIDNOD = {
    # Felsidan indexeras inte och ligger utanför sitemap – HTTP-status 404 är
    # signalen som gäller (SEO-svepets punkt 2).
    "404.html",
    # Avsiktlig redirect-stump sedan 0.9.257, noindex och utan h1.
    "ordlista-tecken.html",
}


def sidor() -> list[str]:
    """Sökvägarna till de sidor som ska ha datum, relativa mot repo-roten."""
    hittade, utan = [], set()
    for p in sorted(ROOT.rglob("*.html")):
        if "_arkiv" in p.parts:
            continue
        rel = p.relative_to(ROOT).as_posix()
        html = p.read_text(encoding="utf-8")
        if any(är_sidnod(json.loads(m.group(2))) for m in LD.finditer(html)):
            hittade.append(rel)
        else:
            utan.add(rel)
    if utan != UTAN_SIDNOD:
        nya = sorted(utan - UTAN_SIDNOD)
        borta = sorted(UTAN_SIDNOD - utan)
        raise SystemExit(
            "STOPP: listan över sidor utan JSON-LD-sidnod stämmer inte.\n"
            + (f"  saknar strukturdata (nya): {nya}\n" if nya else "")
            + (f"  har fått strukturdata: {borta}\n" if borta else "")
            + "Lägg in sidan i UTAN_SIDNOD om det är avsiktligt, annars ge den "
              "en JSON-LD-nod enligt SEO_REGLER §6.")
    return hittade


def läs_register() -> dict[str, dict[str, str]]:
    if not REGISTER.exists():
        return {}
    data = json.loads(REGISTER.read_text(encoding="utf-8"))
    return {k: v for k, v in data.items() if not k.startswith("_")}


def bygg(gammalt: dict[str, dict[str, str]]) -> dict[str, dict[str, str]]:
    """Registret som det ska se ut just nu.

    `andrad` räknas alltid om ur git. `publicerad` sätts en gång och flyttas
    aldrig — ett publiceringsdatum är ett påstående om historien, inte en
    mätning. Ordningen när det ska sättas första gången:

      1. registret, om sidan redan står där,
      2. sidans egen handskrivna `datePublished` — författarens uppgift väger
         tyngre än git (fem artiklar skrevs klart dagen före de checkades in),
      3. datumet då filen lades till i git,
      4. dagens datum, för en sida som ännu inte är incheckad.
    """
    idag = datetime.date.today().isoformat()
    hist = historik()
    blob = Blobbar()
    try:
        nytt = {}
        for rel in sidor():
            revs = hist.get(rel, [])
            tillagd = [d for d, _, st in revs if st == "A"]
            publicerad = (
                (gammalt.get(rel) or {}).get("publicerad")
                or egen_datepublished((ROOT / rel).read_text(encoding="utf-8"))
                or (tillagd[-1] if tillagd else None)
                or idag
            )
            ändrad = senast_ändrad(rel, revs, blob, idag)
            # En sida kan inte ha ändrats innan den fanns. Händer när ett
            # handskrivet publiceringsdatum ligger efter första incheckningen.
            nytt[rel] = {"publicerad": publicerad,
                         "andrad": max(ändrad, publicerad)}
    finally:
        blob.stäng()
    return nytt


def skriv(reg: dict[str, dict[str, str]]) -> str:
    ut = {"_kommentar": KOMMENTAR}
    ut.update({k: reg[k] for k in sorted(reg)})
    return json.dumps(ut, ensure_ascii=False, indent=2) + "\n"


def main(argv):
    if not argv or argv[0] not in ("--update", "--check"):
        print(__doc__)
        return 0
    gammalt = läs_register()
    nytt = bygg(gammalt)
    text = skriv(nytt)

    avvikelser = [rel for rel in sorted(set(gammalt) | set(nytt))
                  if gammalt.get(rel) != nytt.get(rel)]
    if argv[0] == "--check":
        # Skriv alltid ut antalet, även när det är noll: en kontroll som är tyst
        # både när allt stämmer och när den inte tittade är värdelös (§0.1).
        if not avvikelser and REGISTER.exists() and \
                REGISTER.read_text(encoding="utf-8") == text:
            print(f"OK: data/sidodatum.json aktuellt – {len(nytt)} sidor, "
                  "0 avvikelser.")
            return 0
        print(f"AVVIKELSE: data/sidodatum.json är inaktuellt – "
              f"{len(avvikelser)} sida/sidor.", file=sys.stderr)
        for rel in avvikelser[:20]:
            print(f"  {rel}: {gammalt.get(rel)} → {nytt.get(rel)}", file=sys.stderr)
        if len(avvikelser) > 20:
            print(f"  … och {len(avvikelser) - 20} till", file=sys.stderr)
        print("\nKör: python3 scripts/sidodatum.py --update "
              "&& python3 scripts/wire_dates.py --all", file=sys.stderr)
        return 1

    REGISTER.write_text(text, encoding="utf-8")
    print(f"OK: {len(nytt)} sidor i data/sidodatum.json, "
          f"{len(avvikelser)} ändrad(e).")
    for rel in avvikelser[:20]:
        print(f"  {rel}: {gammalt.get(rel)} → {nytt[rel]}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
