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

Efter rundtrippen körs två kontroller mot arbetskatalogen: `check_links.py`
(varje intern länk mot disk) och `sidodatum.py --check` (varje sidas datum mot
git). Den senare kan inte ligga i KEDJA – spegeln är en naken filkopia utan
`.git`.

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
    ["scripts/generate_glossary.py"],
    ["scripts/wire_lang.py", "--all"],
    ["scripts/wire_identity.py", "--all"],
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
        for kontroll in ("scripts/check_links.py", "scripts/sidodatum.py"):
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
