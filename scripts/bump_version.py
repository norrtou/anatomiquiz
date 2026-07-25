#!/usr/bin/env python3
"""Bumpa projektversionen på ALLA ställen den finns – eller kontrollera synken.

Versionen står på tre ställen som måste vara identiska (SEO_REGLER §11 A):

  1. `VERSION`                     – källan; app.js hämtar den färsk vid start.
  2. `index.html`  `app.js?v=…`    – cachebuster, tvingar webbläsaren hämta ny app.js.
  3. `js/app.js`   `APP_VERSION`   – inbakad i den körda koden, så att en gammal
                                     cachad app.js kan avslöja sig själv.

Punkt 3 KAN inte läsas ur VERSION vid körning: hela poängen är att jämföra vad
den laddade koden tror att den är mot vad servern säger. Därför måste den hållas
i synk – och därför finns det här skriptet, så att synken görs av en maskin i
stället för av mig i fyra separata redigeringar.

Bakgrund: i 0.9.237–0.9.240 bumpades VERSION och cachebustern men inte
APP_VERSION. Sajten visade "v0.9.236" i fyra släpp och ingen omladdning i
världen kunde hjälpa, eftersom den app.js som faktiskt serverades sade 0.9.236.

ÖVRIGA CACHEBUSTERS (§11 C och CLAUDE_REGLER §12)
-------------------------------------------------
Sajten har fler versionsmärkta resurser än app.js: en modulfil per spelläge
(js/matcha.js, js/leitner.js …) och tre stylesheets, refererade från upp till
116 HTML-sidor. Tidigare stod det i reglerna att de skulle "sättas för hand" –
alltså 116 redigeringar utan felmarginal, vilket §0.3 uttryckligen förbjuder:
en mekanisk, återkommande uppgift ska automatiseras, annars blir den förr eller
senare halvgjord. Skriptet gör därför följande automatiskt:

  * Frågar git vilka `js/*.js` och `css/*.css` som ändrats sedan HEAD.
  * Sätter `?v=` för PRECIS de filerna i samtliga HTML-sidor som refererar dem
    (oförändrade filer behåller sin gamla buster – ingen onödig omhämtning).
  * Uppdaterar generatorernas hårdkodade CSS-versioner (`STYLES_V`/`CSS_V` i
    scripts/generate_*.py), som annars skriver tillbaka en gammal buster nästa
    gång en sida genereras om.

`--check` verifierar både trevägssynken och att ingen ändrad js/css-fil lämnats
med en gammal buster.

Användning:
    python3 scripts/bump_version.py 0.9.251   # sätt allt som ska bumpas
    python3 scripts/bump_version.py --check    # verifiera synk (exit 1 vid glapp)
"""
import re
import subprocess
import sys
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
VERSION_FILE = ROOT / "VERSION"
INDEX_FILE = ROOT / "index.html"
APP_FILE = ROOT / "js" / "app.js"
SCRIPTS_DIR = ROOT / "scripts"

BUSTER_RX = re.compile(r"(app\.js\?v=)([0-9]+\.[0-9]+\.[0-9]+)")
APPVER_RX = re.compile(r"(const APP_VERSION = ')([0-9]+\.[0-9]+\.[0-9]+)(')")
VERSION_RX = re.compile(r"^[0-9]+\.[0-9]+\.[0-9]+$")


def html_files():
    """Alla HTML-sidor i repot (undantaget genererade byggkataloger finns inte)."""
    return sorted(p for p in ROOT.rglob("*.html") if ".git" not in p.parts)


def asset_buster_rx(name):
    """?v=-mönstret för en enskild resurs, t.ex. 'matcha.js' eller 'styles.css'."""
    return re.compile(r"(" + re.escape(name) + r"\?v=)([0-9]+\.[0-9]+\.[0-9]+)")


def changed_assets():
    """js/*.js och css/*.css som ändrats sedan HEAD (staged, ostaged eller nya).

    Returnerar en lista av filnamn ('leitner.js', 'styles.css'). Saknas git
    returneras None – då hoppar skriptet över resursbustrarna i stället för att
    stanna, och säger till om det.
    """
    try:
        tracked = subprocess.run(
            ["git", "diff", "--name-only", "HEAD", "--", "js", "css"],
            cwd=ROOT, capture_output=True, text=True, check=True).stdout.split()
        untracked = subprocess.run(
            ["git", "ls-files", "--others", "--exclude-standard", "--", "js", "css"],
            cwd=ROOT, capture_output=True, text=True, check=True).stdout.split()
    except (subprocess.CalledProcessError, FileNotFoundError):
        return None
    names = []
    for rel in tracked + untracked:
        p = pathlib.Path(rel)
        if p.suffix in (".js", ".css") and p.name not in names:
            names.append(p.name)
    return names


def generator_css_versions():
    """[(skriptfil, variabelnamn, resursnamn, nuvarande version)] i scripts/generate_*.py.

    Generatorerna bär resursversionen som en egen konstant (`STYLES_V = "0.9.247"`)
    och skriver den i sidhuvudet varje gång de kör. Missas den skrivs en gammal
    buster tillbaka nästa gång ordlistan eller en tabellsida genereras om.

    Gäller både .css och .js: sedan 0.9.259 skriver sidhuvudet även
    `theme.js?v={CSS_V}`. Matchade mönstret bara .css kunde en ändring i enbart
    js/theme.js lämna generatorerna med en gammal buster, och en regenerering
    hade då serverat gammal temakod ur cachen.
    """
    found = []
    for path in sorted(SCRIPTS_DIR.glob("generate_*.py")):
        text = path.read_text(encoding="utf-8")
        for css_name, var in re.findall(r"([a-z-]+\.(?:css|js))\?v=\{([A-Z_]+)\}", text):
            m = re.search(r"^" + var + r'\s*=\s*"([0-9]+\.[0-9]+\.[0-9]+)"', text, re.M)
            if m:
                found.append((path, var, css_name, m.group(1)))
    return found


def läs():
    """Returnera versionen enligt var och en av de tre källorna."""
    version = VERSION_FILE.read_text(encoding="utf-8").strip()
    buster = BUSTER_RX.search(INDEX_FILE.read_text(encoding="utf-8"))
    appver = APPVER_RX.search(APP_FILE.read_text(encoding="utf-8"))
    return {
        "VERSION": version,
        "index.html (app.js?v=)": buster.group(2) if buster else None,
        "js/app.js (APP_VERSION)": appver.group(2) if appver else None,
    }


def stale_asset_busters(version):
    """Ändrade js/css-filer vars ?v= inte pekar på aktuell version.

    Verifierar mot HELA sajten, inte mot en ändringslista: varje HTML-sida som
    refererar resursen läses (CLAUDE_REGLER §0.1).
    """
    names = changed_assets()
    if names is None:
        return None
    stale = []
    pages = html_files()
    for name in names:
        if name == "app.js":
            continue  # täcks av trevägssynken ovan
        rx = asset_buster_rx(name)
        for page in pages:
            for found in rx.findall(page.read_text(encoding="utf-8")):
                if found[1] != version:
                    stale.append((page.relative_to(ROOT).as_posix(), name, found[1]))
        for path, var, css_name, cur in generator_css_versions():
            if css_name == name and cur != version:
                stale.append((path.relative_to(ROOT).as_posix(), f"{var} ({css_name})", cur))
    return stale


def check():
    lägen = läs()
    saknas = [k for k, v in lägen.items() if v is None]
    if saknas:
        print("FEL: hittade ingen version i: " + ", ".join(saknas), file=sys.stderr)
        return 1
    if len(set(lägen.values())) != 1:
        print("VERSIONSGLAPP – sajten kommer visa fel version:", file=sys.stderr)
        for k, v in lägen.items():
            print(f"  {k:26} {v}", file=sys.stderr)
        print("\nKör: python3 scripts/bump_version.py <version>", file=sys.stderr)
        return 1

    version = lägen["VERSION"]
    stale = stale_asset_busters(version)
    if stale is None:
        print(f"Versionerna är i synk: {version}")
        print("(git ej tillgängligt – kunde inte kontrollera js/css-cachebusters)")
        return 0
    if stale:
        print(f"GAMMAL CACHEBUSTER – {len(stale)} avvikelser, ändrad fil serveras från cache:",
              file=sys.stderr)
        # Gruppera per resurs: 116 identiska rader hjälper ingen att förstå felet.
        grupper = {}
        for page, name, v in stale:
            grupper.setdefault((name, v), []).append(page)
        for (name, v), sidor in grupper.items():
            exempel = ", ".join(sidor[:3]) + (" …" if len(sidor) > 3 else "")
            fil = "fil" if len(sidor) == 1 else "filer"
            print(f"  {name}: {v} → {version} i {len(sidor)} {fil} ({exempel})", file=sys.stderr)
        print("\nKör: python3 scripts/bump_version.py <version>", file=sys.stderr)
        return 1
    print(f"Versionerna är i synk: {version}")
    print("Cachebustrar för ändrade js/css-filer: 0 avvikelser")
    return 0


def bump_asset_busters(ny):
    """Sätt ?v= för de js/css-filer som faktiskt ändrats, överallt de refereras."""
    names = changed_assets()
    if names is None:
        print("  (git ej tillgängligt – hoppade över js/css-cachebusters)")
        return
    names = [n for n in names if n != "app.js"]
    if not names:
        return
    pages = html_files()
    for name in names:
        rx = asset_buster_rx(name)
        träffar = 0
        sidor = 0
        for page in pages:
            text = page.read_text(encoding="utf-8")
            new_text, n = rx.subn(rf"\g<1>{ny}", text)
            if n:
                page.write_text(new_text, encoding="utf-8")
                träffar += n
                sidor += 1
        for path, var, css_name, cur in generator_css_versions():
            if css_name != name or cur == ny:
                continue
            text = path.read_text(encoding="utf-8")
            text = re.sub(r"^(" + var + r'\s*=\s*")[0-9]+\.[0-9]+\.[0-9]+(")',
                          rf"\g<1>{ny}\g<2>", text, count=1, flags=re.M)
            path.write_text(text, encoding="utf-8")
            träffar += 1
            sidor += 1
        if träffar:
            print(f"  {name:22} ({träffar} cachebuster i {sidor} filer)")
        else:
            print(f"  {name:22} (ändrad, men refereras inte med ?v= någonstans)")


def bump(ny):
    if not VERSION_RX.fullmatch(ny):
        print(f"FEL: '{ny}' är inte ett giltigt versionsnummer (X.Y.Z).", file=sys.stderr)
        return 1

    VERSION_FILE.write_text(ny, encoding="utf-8")

    html = INDEX_FILE.read_text(encoding="utf-8")
    html, n_buster = BUSTER_RX.subn(rf"\g<1>{ny}", html)
    INDEX_FILE.write_text(html, encoding="utf-8")

    app = APP_FILE.read_text(encoding="utf-8")
    app, n_app = APPVER_RX.subn(rf"\g<1>{ny}\g<3>", app)
    APP_FILE.write_text(app, encoding="utf-8")

    if not n_buster or not n_app:
        print("FEL: mönstret matchade inte – kontrollera filerna för hand.", file=sys.stderr)
        print(f"  cachebuster i index.html: {n_buster} träffar", file=sys.stderr)
        print(f"  APP_VERSION i js/app.js:  {n_app} träffar", file=sys.stderr)
        return 1

    print(f"Version satt till {ny}:")
    print("  VERSION")
    print(f"  index.html             ({n_buster} cachebuster)")
    print("  js/app.js              (APP_VERSION)")
    bump_asset_busters(ny)
    print("\nKvar att göra för hand: CHANGELOG.md-post (§11 A).")
    return 0


def main(argv):
    if not argv:
        print(__doc__)
        return 1
    if argv[0] == "--check":
        return check()
    return bump(argv[0])


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
