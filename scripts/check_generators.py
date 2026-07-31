#!/usr/bin/env python3
"""Rundtrippstest för hela generatorkedjan (CLAUDE_REGLER §12.2).

En generator ska rundtrippa till identitet: kör man den mot ett orört träd ska
ingenting ändras. Håller det inte har den levererade filen och generatorn glidit
isär, och nästa regenerering raderar tyst någons handarbete. Det hände 2026-07-25
i sex olika former – felaktiga och försvunna tooltips, splittrade binomialnamn,
en handinlagd mening i muskeltabellernas ingress, versaler i flashcard-svaren och
en hel uppsättning distraktorer som aldrig skrevs ut.

Generatorerna skriver direkt till disk och kan inte bygga i minnet. I stället
kopieras hela trädet till en temporär katalog, kedjan körs där, och resultatet
jämförs fil för fil mot arbetskopian. Bara så testas wire-stegen: tooltips,
referenser, identitet och datum läggs på **efter** sidgenereringen, så det är
först när allt körts i ordning som man ser om de överlever.

Ingen enskild generator kan göra det. `generate_glossary.py` hade ett eget
`--check` fram till 0.9.270; det jämförde generatorns rena utdata mot filer som
senare steg skrivit i, och kunde därför aldrig lysa grönt igen efter 0.9.267.

Efter rundtrippen körs sex kontroller mot arbetskatalogen: `check_links.py`
(varje intern länk mot disk), `check_rubriker.py` (varje sidas rubrikkedja utan
hopp), `check_kontrast.py` (WCAG-kvoten på varje färgad yta, i båda teman),
`check_spellagen.py` (varje spelläge registrerat på alla fyra ställen),
`check_meta.py` (title och description mot Bings spann) och
`sidodatum.py --check` (varje sidas datum mot git). Den sista kan inte
ligga i KEDJA – spegeln är en naken filkopia utan `.git`.

Testet läser arbetskopian, inte HEAD – oincheckade ändringar räknas med.

Användning:
    python3 scripts/check_generators.py          # tyst + exit 0 = rundtripp identisk
    python3 scripts/check_generators.py -v       # visa generatorernas utdata
"""
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# Ordningen är kedjans: sidgeneratorerna skriver REN HTML, wire_terms lägger på
# tooltipsen, wire_citations läser sidans synliga referenslista och skriver in
# den som `citation` i JSON-LD, och generate_glossary körs näst sist eftersom
# den äger sitemap.xml och måste se de färdiga sidorna. wire_lang, wire_identity
# och wire_dates ligger allra sist just därför — de skriver i ordlistans 33 sidor
# också, och hade blivit överskrivna av glossary-generatorn i vilket tidigare
# läge som helst.
KEDJA = [
    ["scripts/generate_glossary.py"],
    ["scripts/generate_karl.py"],
    ["scripts/generate_leder.py"],
    ["scripts/generate_muskeltabeller.py"],
    ["scripts/generate_skelett.py"],
    ["scripts/generate_artiklar.py"],
    ["scripts/generate_medicinsk_latin.py"],
    ["scripts/generate_muskler_flashcards.py"],
    ["scripts/wire_terms.py", "--all"],
    ["scripts/wire_citations.py", "--all"],
    # Se även-blocket läggs före referenslistan och måste därför skrivas efter
    # att den finns. Steget stoppar på en kunskapsbankssida som varken står i
    # en relationsgrupp eller i UTAN_RELATERAT — en ny tabellsida ska tvinga
    # fram ett beslut, inte tyst hamna utanför korslänkningen (§0.4).
    ["scripts/wire_relaterat.py", "--all"],
    ["scripts/generate_glossary.py"],
    ["scripts/wire_lang.py", "--all"],
    ["scripts/wire_identity.py", "--all"],
    # about/teaches/keywords. Steget stoppar på en sida som saknas i registret,
    # på ett about-namn eller nyckelord som inte står i sidans egen text, och
    # på att <meta name="keywords"> dykt upp igen någonstans.
    ["scripts/wire_amne.py", "--all"],
    ["scripts/wire_sidfot.py", "--all"],
    ["scripts/wire_dates.py", "--all"],
    # Sist: llms.txt och llms-full.txt beskriver sajten och behöver se den
    # färdig. Steget kontrollerar dessutom att varje <loc> i sitemap.xml står i
    # data/llms.json — en ny sida som aldrig kom in i indexfilen stoppar bygget
    # i stället för att tyst utebli (§0.4).
    ["scripts/generate_llms.py"],
]


def spårade_filer():
    ut = subprocess.run(["git", "-C", str(ROOT), "ls-files", "-z"],
                        capture_output=True, text=True, check=True).stdout
    return [f for f in ut.split("\0") if f]


def main(argv):
    verbose = "-v" in argv or "--verbose" in argv
    filer = spårade_filer()
    with tempfile.TemporaryDirectory(prefix="anatomiquiz-rundtripp-") as tmp:
        spegel = Path(tmp)
        for rel in filer:
            mål = spegel / rel
            mål.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(ROOT / rel, mål)

        for cmd in KEDJA:
            r = subprocess.run([sys.executable] + cmd, cwd=spegel,
                               capture_output=True, text=True)
            if r.returncode != 0:
                print(f"STOPP: {' '.join(cmd)} misslyckades:\n{r.stderr}",
                      file=sys.stderr)
                return 1
            if verbose:
                print(f"--- {' '.join(cmd)}\n{r.stdout}")

        avvikande = [rel for rel in filer
                     if (spegel / rel).read_bytes() != (ROOT / rel).read_bytes()]
        # Filer generatorerna skapat men som inte är spårade fångas separat –
        # en ny sida som aldrig checkats in är också en drift.
        spårat = set(filer)
        nya = sorted(str(p.relative_to(spegel)) for p in spegel.rglob("*")
                     if p.is_file() and str(p.relative_to(spegel)) not in spårat
                     and "__pycache__" not in p.parts)

    if not avvikande and not nya:
        print(f"OK: rundtripp identisk – {len(filer)} filer oförändrade efter "
              f"{len(KEDJA)} generatorsteg.", flush=True)
        # Rundtrippen bevisar att generatorerna är i synk med filerna, inte att
        # filerna pekar på något som finns eller att datumen stämmer. Båda
        # kontrollerna körs här därför att det här är kommandot som faktiskt
        # körs före commit – ett larm ingen kör är inget skydd (§0.4).
        #
        # sidodatum.py kan inte ligga i KEDJA: den läser git, och spegeln är en
        # naken filkopia. Den körs därför mot ROOT, efter rundtrippen. Larmar
        # den betyder det att en sidas innehåll ändrats utan att datumet följt
        # med — kör `--update` och sedan `wire_dates.py --all`.
        #
        # check_rubriker.py mäter en tredje sak ingen generator äger: att varje
        # sidas rubrikkedja går h1 → h2 → h3 utan hopp. Felet syns inte —
        # `.info-subheading` gav `integritet.html` samma utseende på h3 som på
        # h2 — så bara något som körs kan hitta det.
        #
        # check_kontrast.py mäter WCAG-kvoten på varje yta som sätter både
        # textfärg och bakgrund, i båda teman. Den läser CSS:en, inte en lista
        # med värden, så den kan inte bli inaktuell när paletten ändras. Felet
        # den finns för att fånga syns inte alls: vit text på #34d399 ser prydlig
        # ut i en skärmdump och ger 1,92:1.
        #
        # check_spellagen.py mäter en femte sak: att varje spelläge är
        # registrerat på ALLA fyra ställen ett läge måste stå på. CSS_KARTA
        # listade dem som en tabell att komma ihåg, och i 0.9.284 glömdes
        # fokuslägets :has()-lista ändå — sajtrubrik och sidfot låg kvar mitt i
        # spelet, precis den bugg 0.9.274 fixade för de fyra andra lägena. En
        # checklista i ett dokument är den handpåläggning §0.3 förbjuder.
        #
        # check_meta.py mäter title och description mot Bings hårda spann
        # (SEO_REGLER §2–3). Fälten är HANDJUSTERADE och ägs av användaren,
        # vilket är just därför de behöver en mätning: ett fält som ingen
        # generator äger kan inte hållas rätt av en omkörning. En description
        # på 160 tecken ser korrekt ut överallt utom i träfflistan, där den
        # kapas — alltså på det enda ställe där den har en uppgift.
        #
        # check_akutmedicin.py mäter en sjunde sak: att poängskalornas facit
        # (data/akutmedicin.json) och sidornas statiska uppslagstabeller säger
        # samma sak, och att js/akutmedicin.js räknar rätt mot facit. Skalorna
        # MÅSTE finnas på två ställen — räknaren läser facit, läsaren utan
        # JavaScript läser tabellen — och två upplagor av samma sanning glider
        # isär om ingenting mäter dem. Steget kör även
        # scripts/test_verktyg_akutmedicin.js, som driver modulen i ett DOM-skal
        # och prövar varje intervallgräns i NEWS2 åt båda håll.
        #
        # validate_sortera.py mäter en åttonde sak: att spelläget Sorteras
        # frågearkiv håller ihop. En sorteringsfråga med fem poster bär FYRA
        # parvisa faktapåståenden, och validate_quiz.py kan inte läsa formatet
        # (den kan bara MC/TF). Den viktigaste spärren är närhetsspärren: två
        # mätvärden som skiljer under 15 % ger en fråga med två försvarbara
        # svar. Steget kör även scripts/test_sortera.js, som driver modulen i
        # ett DOM-skal.
        for kontroll in ("scripts/check_links.py", "scripts/check_rubriker.py",
                         "scripts/check_kontrast.py", "scripts/check_spellagen.py",
                         "scripts/check_meta.py", "scripts/check_akutmedicin.py",
                         "scripts/validate_sortera.py", "scripts/sidodatum.py"):
            argv = [kontroll] + (["--check"] if "sidodatum" in kontroll else [])
            kod = subprocess.run([sys.executable] + argv, cwd=ROOT).returncode
            if kod != 0:
                return kod
        return 0

    print(f"AVVIKELSE: {len(avvikande) + len(nya)} filer skiljer sig efter en "
          f"full generatorkörning (CLAUDE_REGLER §12.2).", file=sys.stderr)
    for rel in avvikande:
        print(f"  ändrad: {rel}", file=sys.stderr)
    for rel in nya:
        print(f"  ospårad: {rel}", file=sys.stderr)
    print("\nAntingen är den levererade filen handredigerad och generatorn måste "
          "lära sig ändringen, eller så är generatorn nyare än filen och kedjan "
          "behöver köras. Avgör per fil – kör inte bara om allt.", file=sys.stderr)
    return 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
