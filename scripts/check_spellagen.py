#!/usr/bin/env python3
"""Kontrollera att varje spelläge är registrerat på ALLA ställen det måste vara.

Ett spelläge är inte en fil utan fyra åtaganden, och glöms ett av dem ser sidan
korrekt ut ända tills man spelar läget. `CSS_KARTA.md` listar dem som en tabell
att komma ihåg — den här kontrollen gör listan till något som *körs*, eftersom
en checklista i ett dokument är precis den mekaniska handpåläggning §0.3
förbjuder.

Felet som motiverar kontrollen (0.9.284): `#dagsutmaning` lades i `FIT_SECTIONS`
och fick sin `.gm-*`-bas, men glömdes i fokuslägets `:has()`-lista i
`css/styles.css`. Följden var att sajtrubriken och sidfoten låg kvar mitt i ett
pågående spel — exakt den bugg 0.9.274 fixade för Flashcards, Matcha, Leitner
och Tidsjakt, återinförd för det femte läget. Ingen av 111 tester kunde se den:
ett Node-DOM-skal renderar ingen CSS.

## Vad som räknas som ett spelläge

En `<section id="X">` i `index.html` som har en modulfil `js/X.js`. Det är
precis vad CLAUDE_REGLER §12 föreskriver (egen fil per läge, sektionen döpt
efter sluggen), så definitionen kan inte glida isär från regeln. Quizet och
flashcards bor i `js/app.js` och räknas därför inte här; de står redan rätt.

## Vad som krävs av ett läge

1. `FIT_SECTIONS` i `js/app.js` — annars krymps vyn inte på mobil och
   primärknappen hamnar under fold på en liten iPhone.
2. Fokuslägets `:has()`-lista i `css/styles.css` — annars ligger sidrubrik och
   sidfot kvar under spelet.
3. `<script src="js/X.js">` i `index.html` — annars laddas modulen aldrig.
4. En `.X-*.hidden`- eller `#X*.hidden`-regel i CSS:en. `.hidden` är INTE en
   global utility i det här projektet (CSS_KARTA), så ett läge utan egna
   döljregler visar sin klart-vy mitt i rundan (skarp bugg i 0.9.244 och 0.9.251).

Användning:
    python3 scripts/check_spellagen.py        # exit 1 vid första bristen
    python3 scripts/check_spellagen.py -v     # lista varje läge och dess status
"""
import pathlib
import re
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
INDEX = ROOT / "index.html"
APP = ROOT / "js" / "app.js"
STYLES = ROOT / "css" / "styles.css"


def spellagen(index_html):
    """Sektioner i index.html som har en egen modulfil js/<id>.js."""
    ider = re.findall(r'<section\s+id="([a-z0-9]+)"', index_html)
    return [i for i in ider if (ROOT / "js" / f"{i}.js").exists()]


def fit_sections(app_js):
    m = re.search(r"const FIT_SECTIONS\s*=\s*\[([^\]]*)\]", app_js)
    if not m:
        return None
    return {a or b for a, b in re.findall(r"'([^']*)'|\"([^\"]*)\"", m.group(1))}


def fokuslista(css):
    """Id:n i fokuslägets .container:has(...)-regel."""
    m = re.search(r"\.container:has\(([^)]*(?:\)[^{]*?)?)\)\s*>\s*\.header", css, re.S)
    if not m:
        # Regeln har flera :has(...)-selektorer separerade med komma; ta den
        # första blocket fram till "> .header".
        return None
    return set(re.findall(r"#([a-zA-Z0-9_-]+):not\(\.hidden\)", m.group(1)))


def main(argv):
    utforlig = "-v" in argv or "--verbose" in argv
    index_html = INDEX.read_text(encoding="utf-8")
    app_js = APP.read_text(encoding="utf-8")
    css = STYLES.read_text(encoding="utf-8")

    lagen = spellagen(index_html)
    if not lagen:
        print("check_spellagen: hittade inga spellägessektioner i index.html — "
              "har konventionen <section id=\"slug\"> + js/slug.js ändrats?",
              file=sys.stderr)
        return 1

    fit = fit_sections(app_js)
    if fit is None:
        print("check_spellagen: kunde inte läsa FIT_SECTIONS ur js/app.js.", file=sys.stderr)
        return 1

    fokus = fokuslista(css)
    if fokus is None:
        print("check_spellagen: kunde inte läsa fokuslägets :has()-lista ur "
              "css/styles.css.", file=sys.stderr)
        return 1

    brister = []
    for slug in lagen:
        saknas = []
        if slug not in fit:
            saknas.append("FIT_SECTIONS i js/app.js (vyn krymps inte på mobil)")
        if slug not in fokus:
            saknas.append("fokuslägets :has()-lista i css/styles.css "
                          "(sidrubrik och sidfot ligger kvar under spelet)")
        if not re.search(rf'<script src="js/{slug}\.js\?v=', index_html):
            saknas.append(f"<script src=\"js/{slug}.js?v=…\"> i index.html "
                          "(modulen laddas aldrig)")
        # .hidden är inte global: läget måste dölja sina egna inre delar själv.
        if not re.search(rf"[.#]{slug}[a-zA-Z-]*\.hidden", css):
            saknas.append("egna .hidden-regler i css/styles.css "
                          "(klart-vyn visas mitt i rundan)")
        if saknas:
            brister.append((slug, saknas))
        elif utforlig:
            print(f"  ok    {slug}")

    if brister:
        print(f"AVVIKELSE: {len(brister)} spelläge(n) är inte registrerade överallt "
              "(CSS_KARTA + CLAUDE_REGLER §12/§13.1).", file=sys.stderr)
        for slug, saknas in brister:
            print(f"  {slug}:", file=sys.stderr)
            for s in saknas:
                print(f"    saknas i {s}", file=sys.stderr)
        return 1

    print(f"OK: {len(lagen)} spellägen registrerade på alla fyra ställen "
          f"({', '.join(lagen)}).")

    # Femte åtagandet: har läget ett DOM-testskal ska det också KÖRAS före
    # commit. Testerna låg tidigare inne i den datafilsvalidering som råkade
    # finnas per läge (validate_sortera.py kör test_sortera.js), vilket betyder
    # att ett läge utan egen datafil tyst blev utan testkörning. Här hittas de
    # på konventionen i stället, så nästa läge får sin körning gratis.
    kvar = []
    for slug in lagen:
        test = ROOT / "scripts" / f"test_{slug}.js"
        if not test.exists():
            kvar.append(slug)
            continue
        kod = subprocess.run(["node", str(test)], cwd=ROOT,
                             stdout=subprocess.DEVNULL).returncode
        if kod != 0:
            print(f"AVVIKELSE: scripts/test_{slug}.js underkänd — kör "
                  f"`node scripts/test_{slug}.js` för utskriften.", file=sys.stderr)
            return kod
        print(f"OK: scripts/test_{slug}.js grön.")
    if kvar:
        print(f"Anm: {len(kvar)} läge(n) saknar testskal ({', '.join(kvar)}) — "
              "logiken prövas bara manuellt där.")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
