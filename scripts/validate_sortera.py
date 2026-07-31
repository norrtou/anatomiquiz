#!/usr/bin/env python3
"""Maskinell kontroll av frågearkivet för spelläget Sortera (data/sortera.json).

    python3 scripts/validate_sortera.py        # exit 1 vid FEL
    python3 scripts/validate_sortera.py -v     # lista varje fråga

## Varför en EGEN validator

`scripts/validate_quiz.py` kan bara läsa MC/TF-frågor (prompt + correct +
distractors). Sortera-frågan har ett annat skelett: en ORDNING av fem
strukturer. Filen står därför i validate_quiz.py:s SKIP, och det som gör
sorteringsfrågor felbara kontrolleras här i stället. Skyddet levereras i samma
pass som spelläget (CLAUDE_REGLER §0.4) — en regel som bara står i ett dokument
är den handpåläggning §0.3 förbjuder.

## Vad som gör just en sorteringsfråga felbar

En MC-fråga bär ETT faktapåstående. En sorteringsfråga med fem poster bär FYRA
parvisa påståenden, och det räcker att ett av dem är omtvistat för att frågan
ska ha två försvarbara svar. De tre spärrarna nedan är därför inte formalia:

1. **Närhetsspärren** (mätbara axlar): två intilliggande värden måste skilja
   minst NARHET_MIN. "Levern 1 500 g" bredvid "hjärnan 1 400 g" är 7 % isär —
   båda är genomsnitt med spridning, och den som svarar tvärtom har inte fel.
   Exakta ANTAL undantas: 24 revben är inte ett estimat.
2. **Riktningen måste stå i prompten.** Utan "flest först" eller "från
   proximalt till distalt" är frågan inte svarbar, bara gissbar.
3. **Självutpekande etiketter** (VARNING): en post som bär axelns eget
   riktningsord ("Os cuneiforme laterale" i en medial→lateral-fråga) avslöjar
   sin egen plats. Den som kan latin behöver då inte kunna anatomin.

Axeltabellen och ämnesnamnen läses ur SAMMA fil som frågorna, inte ur en kopia
här — två upplagor av samma sanning glider isär (§12.2).
"""
import json
import pathlib
import re
import shutil
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
FIL = ROOT / "data" / "sortera.json"
# Motorn prövas i samma steg som frågorna, efter mönstret från
# check_akutmedicin.py: ett läge är inte grönt för att facit är rätt om koden
# som läser facit är trasig, och två kommandon att komma ihåg blir förr eller
# senare ett kommando som körs (§0.4).
NODTEST = "scripts/test_sortera.js"

ANTAL_POSTER = 5      # varje fråga har exakt fem poster – spelplanen har fem platser
NARHET_MIN = 0.15     # minsta relativa skillnad mellan intilliggande mätvärden
MIN_FORKLARING = 40   # tecken; en förklaring som inte förklarar något är ingen förklaring

# Prompten måste peka ut åt vilket håll listan ska ordnas.
FORST = re.compile(r"\bförst\b", re.I)
# Räkneomfånget i antalsfrågor: totalt eller unilateralt (VARNING, inte FEL —
# opariga organ och "par" bär omfånget i sig).
OMFANG = re.compile(r"hela kroppen|båda sidor|en sida|unilateralt|totalt|hela skallen|"
                    r"hela bettet|båda käkhalvorna|per liter|par\b", re.I)


def stam(ord_):
    """Polen 'Proximalt' ska matcha 'proximalt', 'proximal' och 'proximala'."""
    s = ord_.lower()
    return s[:-1] if s.endswith("t") else s


class Fel(list):
    """Samlar meddelanden och kommer ihåg om något var blockerande."""

    def __init__(self):
        super().__init__()
        self.blockerande = 0

    def fel(self, qid, text):
        self.append(f"FEL     [{qid}] {text}")
        self.blockerande += 1

    def varning(self, qid, text):
        self.append(f"VARNING [{qid}] {text}")


def kontrollera_fraga(q, axlar, amnen, sedda_id, sedda_prompt, ut):
    qid = q.get("id") or "(saknar id)"

    for falt in ("id", "topic", "axis", "prompt", "items", "explanation", "source"):
        if not q.get(falt):
            ut.fel(qid, f"saknar fältet '{falt}'")
            return

    if qid in sedda_id:
        ut.fel(qid, "dubblerat id")
    sedda_id.add(qid)

    if q["topic"] not in amnen:
        ut.fel(qid, f"okänt ämne '{q['topic']}' (finns inte i 'amnen')")
        return
    if q["axis"] not in axlar:
        ut.fel(qid, f"okänd axel '{q['axis']}' (finns inte i 'axlar')")
        return

    axel = axlar[q["axis"]]
    prompt = q["prompt"]
    nyckel = (q["topic"], prompt.strip().lower())
    if nyckel in sedda_prompt:
        ut.fel(qid, "dubblerad frågetext inom ämnet")
    sedda_prompt.add(nyckel)

    if len(q["explanation"]) < MIN_FORKLARING:
        ut.fel(qid, f"förklaringen är kortare än {MIN_FORKLARING} tecken")

    # --- Posterna ------------------------------------------------------------
    items = q["items"]
    if len(items) != ANTAL_POSTER:
        ut.fel(qid, f"har {len(items)} poster, ska ha exakt {ANTAL_POSTER}")
        return

    etiketter = [str(i.get("label", "")).strip() for i in items]
    if any(not e for e in etiketter):
        ut.fel(qid, "en post saknar etikett")
        return
    if len(set(e.lower() for e in etiketter)) != len(etiketter):
        ut.fel(qid, "två poster har samma etikett")

    # Alfabetisk ordning i filen betyder att ordningen inte är genomtänkt utan
    # ärvd från hur posterna råkade skrivas ned.
    if etiketter == sorted(etiketter, key=str.lower):
        ut.fel(qid, "posterna ligger i bokstavsordning i filen – ordningen ser oavsiktlig ut")

    # Parentes-asymmetri: en enda post med förklarande parentes sticker ut ur
    # mängden på ett sätt som inte har med sakinnehållet att göra (§2.9).
    med_parentes = [e for e in etiketter if "(" in e]
    if len(med_parentes) == 1:
        ut.varning(qid, f"exakt en post har parentes: {med_parentes[0]!r}")

    # --- Riktningsaxel eller mätaxel ----------------------------------------
    matt = axel.get("matt")
    if matt:
        kontrollera_matt(q, axel, matt, items, prompt, qid, ut)
    else:
        kontrollera_riktning(axel, etiketter, prompt, qid, ut)


def kontrollera_riktning(axel, etiketter, prompt, qid, ut):
    """Prompten ska namnge BÅDA polerna, och ingen etikett ska bära dem."""
    poler = [stam(axel["top"]), stam(axel["bottom"])]
    lagt = prompt.lower()
    saknade = [p for p in poler if p not in lagt]
    if saknade:
        ut.fel(qid, "prompten namnger inte båda polerna (saknar: "
                    + ", ".join(saknade) + ")")

    for ord_ in axel.get("riktningsord", []):
        for e in etiketter:
            if re.search(r"\b" + re.escape(ord_), e, re.I):
                ut.varning(qid, f"posten {e!r} bär axelns eget riktningsord "
                                f"({ord_}) och avslöjar sin plats")


def kontrollera_matt(q, axel, matt, items, prompt, qid, ut):
    """Mätaxel: värden, enhet, strikt fallande ordning och närhetsspärren."""
    lagt = prompt.lower()
    if stam(matt) not in lagt:
        ut.fel(qid, f"prompten säger inte VAD som mäts (saknar '{matt}')")
    if stam(axel["top"]) not in lagt or not FORST.search(prompt):
        ut.fel(qid, f"prompten säger inte åt vilket håll "
                    f"(förväntat: '{axel['top'].lower()} först')")

    varden, enheter = [], set()
    for i, post in enumerate(items):
        if "value" not in post or not isinstance(post["value"], (int, float)):
            ut.fel(qid, f"post {i + 1} ({post.get('label')!r}) saknar numeriskt 'value'")
            return
        if not post.get("unit"):
            ut.fel(qid, f"post {i + 1} ({post.get('label')!r}) saknar 'unit'")
            return
        varden.append(float(post["value"]))
        enheter.add(post["unit"])

    if len(enheter) > 1:
        ut.fel(qid, "posterna blandar enheter: " + ", ".join(sorted(enheter)))

    exakt = bool(axel.get("exakt"))
    if exakt and any(float(v) != int(v) for v in varden):
        ut.fel(qid, "antalsfråga med icke-heltal bland värdena")

    for i in range(len(varden) - 1):
        hog, lag = varden[i], varden[i + 1]
        if lag > hog:
            ut.fel(qid, f"post {i + 2} ({items[i + 1]['label']!r}) är större än "
                        f"post {i + 1} – filen ska stå i rätt ordning, störst först")
            continue
        if lag == hog:
            ut.fel(qid, f"post {i + 1} och {i + 2} har samma värde ({hog:g}) – "
                        f"frågan har då två rätta svar")
            continue
        if not exakt:
            skillnad = (hog - lag) / hog
            if skillnad < NARHET_MIN:
                ut.fel(qid, f"{items[i]['label']!r} ({hog:g}) och "
                            f"{items[i + 1]['label']!r} ({lag:g}) skiljer bara "
                            f"{skillnad:.0%} – under närhetsspärren på "
                            f"{NARHET_MIN:.0%}, alltså två försvarbara svar")

    if exakt and not OMFANG.search(prompt):
        ut.varning(qid, "antalsfråga utan uttalat räkneomfång "
                        "(totalt / båda sidor / unilateralt)")


def kor_nodtest():
    nod = shutil.which("node")
    if not nod:
        print("STOPP: node saknas, så " + NODTEST + " kunde inte köras. En "
              "överhoppad kontroll får inte se ut som en godkänd "
              "(CLAUDE_REGLER §0.4).", file=sys.stderr)
        return 1
    r = subprocess.run([nod, NODTEST], cwd=ROOT, capture_output=True, text=True)
    if r.returncode != 0:
        print(r.stdout + r.stderr, file=sys.stderr)
        print("STOPP: " + NODTEST + " föll.", file=sys.stderr)
        return 1
    print("Sortera-motorn: " + r.stdout.strip().splitlines()[-1])
    return 0


def main(argv):
    utforlig = "-v" in argv or "--verbose" in argv

    if kor_nodtest() != 0:
        return 1

    try:
        data = json.loads(FIL.read_text(encoding="utf-8"))
    except FileNotFoundError:
        print(f"FEL: {FIL} finns inte.", file=sys.stderr)
        return 1
    except json.JSONDecodeError as e:
        print(f"FEL: {FIL.name} är inte giltig JSON: {e}", file=sys.stderr)
        return 1

    for falt in ("axlar", "amnen", "fragor"):
        if falt not in data:
            print(f"FEL: {FIL.name} saknar toppnivåfältet '{falt}'.", file=sys.stderr)
            return 1

    axlar, amnen, fragor = data["axlar"], data["amnen"], data["fragor"]
    ut = Fel()
    sedda_id, sedda_prompt = set(), set()
    for q in fragor:
        kontrollera_fraga(q, axlar, amnen, sedda_id, sedda_prompt, ut)

    per_amne = {}
    for q in fragor:
        per_amne[q.get("topic", "?")] = per_amne.get(q.get("topic", "?"), 0) + 1

    if utforlig:
        for amne, etikett in amnen.items():
            print(f"  {etikett}: {per_amne.get(amne, 0)} frågor")

    for rad in ut:
        print(rad, file=sys.stderr if rad.startswith("FEL") else sys.stdout)

    varningar = len(ut) - ut.blockerande
    print(f"Sortera: {len(fragor)} frågor i {len(amnen)} ämnen "
          f"({', '.join(f'{per_amne.get(a, 0)} {amnen[a]}' for a in amnen)}) — "
          f"{ut.blockerande} fel, {varningar} varningar.")
    return 1 if ut.blockerande else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
