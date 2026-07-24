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

Användning:
    python3 scripts/bump_version.py 0.9.241   # sätt alla tre
    python3 scripts/bump_version.py --check    # verifiera synk (exit 1 vid glapp)
"""
import re
import sys
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
VERSION_FILE = ROOT / "VERSION"
INDEX_FILE = ROOT / "index.html"
APP_FILE = ROOT / "js" / "app.js"

BUSTER_RX = re.compile(r"(app\.js\?v=)([0-9]+\.[0-9]+\.[0-9]+)")
APPVER_RX = re.compile(r"(const APP_VERSION = ')([0-9]+\.[0-9]+\.[0-9]+)(')")


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


def check():
    lägen = läs()
    saknas = [k for k, v in lägen.items() if v is None]
    if saknas:
        print("FEL: hittade ingen version i: " + ", ".join(saknas), file=sys.stderr)
        return 1
    if len(set(lägen.values())) == 1:
        print(f"Versionerna är i synk: {next(iter(lägen.values()))}")
        return 0
    print("VERSIONSGLAPP – sajten kommer visa fel version:", file=sys.stderr)
    for k, v in lägen.items():
        print(f"  {k:26} {v}", file=sys.stderr)
    print("\nKör: python3 scripts/bump_version.py <version>", file=sys.stderr)
    return 1


def bump(ny):
    if not re.fullmatch(r"[0-9]+\.[0-9]+\.[0-9]+", ny):
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
    print(f"  index.html               ({n_buster} cachebuster)")
    print(f"  js/app.js                (APP_VERSION)")
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
