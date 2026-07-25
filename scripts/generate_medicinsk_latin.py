#!/usr/bin/env python3
"""Genererar data/medicinsk_latin.json (ämne "Medicinsk latin" för sjuksköterska).

Källa: 140 flashcards kopierade från ett Quizlet-set (anatomi & fysiologi för
sjuksköterskor). Listan är kvalitetssäkrad vid import — se rättelser nedan.

Varje term blir en MC-fråga "Vad betyder ... ?" med 1 korrekt + 3 distraktorer.
Distraktorerna plockas deterministiskt ur SAMMA betydelsefamilj (kategori) så att
de är rimliga men entydigt fel; fylls vid behov ut från hela poolen.

Rättelser mot källan (användaren bad om kontroll):
  * truncus = "bål/stam" (källan hade fel: "tarm"); dubbletten "trancus = bål"
    (felstavat truncus) sammanslagen.
  * proximalt = "närmare bålen" (källan: "sämre mot bålen").
  * adduktion = "mot kroppens mittlinje (medialt)" (källan tog även med "lateralt",
    vilket är abduktion).
  * abdomen = "buk" (källan felstavat: "abdoment").
  * hyper- = "över / för mycket", hypo- = "under / för lite"
    (källan: "överkant"/"underkant").
  * os förekom tre gånger (mun ×2 + ben). Dubbletten borttagen; de två betydelserna
    skiljs med genitiv: "os, oris" = mun, "os, ossis" = ben (plural "ossa").
"""
import json
import random
from pathlib import Path

# (term, betydelse, kategori)
# Kategorier styr distraktorvalet: rikt(ningar) / förled / rörelse /
# struktur / storlek / region.
ITEMS = [
    # --- riktningar & lägen ---
    ("afferent", "inåtledande", "rikt"),
    ("efferent", "utåtledande", "rikt"),
    ("ascenderande", "uppåtstigande", "rikt"),
    ("descenderande", "nedåtgående", "rikt"),
    ("medial", "åt mitten", "rikt"),
    ("lateral", "åt sidan", "rikt"),
    ("kontralateral", "motsatt sida", "rikt"),
    ("bilateral", "båda sidor", "rikt"),
    ("dexter", "åt höger", "rikt"),
    ("sinister", "åt vänster", "rikt"),
    ("superior", "övre (hela kroppen)", "rikt"),
    ("inferior", "nedre (hela kroppen)", "rikt"),
    ("cranial", "övre (inom bålen)", "rikt"),
    ("caudal", "nedre (inom bålen)", "rikt"),
    ("anterior", "främre (hela kroppen)", "rikt"),
    ("posterior", "bakre (hela kroppen)", "rikt"),
    ("ventral", "främre (inom bålen)", "rikt"),
    ("dorsal", "bakre (inom bålen)", "rikt"),
    ("proximalt", "närmare bålen", "rikt"),
    ("distalt", "längre bort från bålen", "rikt"),
    ("radialt", "tumsidan", "rikt"),
    ("ulnart", "lillfingersidan", "rikt"),
    ("profundus", "djup", "rikt"),
    ("superficialis", "ytlig", "rikt"),

    # --- förleder ---
    ("ab-", "från", "forled"),
    ("ad-", "till", "forled"),
    ("epi-", "på / ovanpå", "forled"),
    ("sub-", "under", "forled"),
    ("externus", "yttre", "forled"),
    ("internus", "inre", "forled"),
    ("extra-", "utanför", "forled"),
    ("intra-", "innanför", "forled"),
    ("inter-", "emellan", "forled"),
    ("hyper-", "över / för mycket", "forled"),
    ("hypo-", "under / för lite", "forled"),
    ("infra-", "nere / nedtill", "forled"),
    ("supra-", "ovanför", "forled"),
    ("pre-", "före / framför", "forled"),
    ("post-", "efter", "forled"),
    ("per-", "genom", "forled"),
    ("peri-", "runtom", "forled"),

    # --- rörelser ---
    ("agonist", "muskel som åstadkommer en rörelse", "rorelse"),
    ("antagonist", "motverkande muskel", "rorelse"),
    ("synergist", "medverkande, samverkande muskel", "rorelse"),
    ("innervering", "nervförsörjning", "rorelse"),
    ("extension", "sträcka ut", "rorelse"),
    ("flexion", "böjning", "rorelse"),
    # Parentesen "(medialt)" är struken: den tillförde inget som inte redan står
    # i svaret, och adduktion är enda posten i kategorin rorelse med parentes –
    # den hade därför pekat ut sig själv bland tre parenteslösa distraktorer.
    ("adduktion", "förande mot kroppens mittlinje", "rorelse"),
    ("rotation", "vridning", "rorelse"),
    ("palmarflexion", "böjer mot handflatan", "rorelse"),
    ("dorsalflexion (hand)", "böjer mot handryggen", "rorelse"),
    ("plantarflexion", "böjer åt fotsulan", "rorelse"),
    ("dorsalflexion (fot)", "böjer åt fotryggen", "rorelse"),
    ("supination", "utåtvridning", "rorelse"),
    ("pronation", "inåtvridning", "rorelse"),

    # --- strukturer (allmänna anatomiska substantiv) ---
    ("anus", "ändtarmsöppning", "struktur"),
    ("apex", "spets", "struktur"),
    ("arcus", "båge", "struktur"),
    ("arteria", "artär", "struktur"),
    ("arteriae", "artärer (plural)", "struktur"),
    ("articulatio", "led", "struktur"),
    ("bifurkation", "delningsställe", "struktur"),
    ("canalis", "kanal", "struktur"),
    ("cauda", "svans", "struktur"),
    ("chondro", "brosk", "struktur"),
    ("condylus", "ledhuvud", "struktur"),
    ("corpus", "kropp", "struktur"),
    ("cortex", "bark", "struktur"),
    ("crista", "kant", "struktur"),
    ("ductus", "gång", "struktur"),
    ("epicondylus", "utbuktning på ledhuvudet", "struktur"),
    ("fascia", "bindvävshinna", "struktur"),
    ("fasciculus", "bunt", "struktur"),
    ("foramen", "hål", "struktur"),
    ("glandula", "körtel", "struktur"),
    ("ligamentum", "ledband", "struktur"),
    ("lumen", "ihåligt rum i körtel eller kanal", "struktur"),
    ("malleolus", "fotknöl", "struktur"),
    ("medulla", "märg", "struktur"),
    ("musculus", "muskel", "struktur"),
    ("musculi", "muskler (plural)", "struktur"),
    ("nervus", "nerv", "struktur"),
    ("nervi", "nerver (plural)", "struktur"),
    ("nucleus", "kärna", "struktur"),
    ("os, oris", "mun", "struktur"),
    ("os, ossis", "ben (skelett)", "struktur"),
    ("ossa", "flera ben (skelett)", "struktur"),
    ("processus", "utskott", "struktur"),
    ("septum", "skiljevägg", "struktur"),
    ("sinus", "hålrum", "struktur"),
    ("soma", "kropp (cellkropp)", "struktur"),
    ("spina", "bentagg / ryggrad", "struktur"),
    ("sulcus", "fåra", "struktur"),
    ("tendo", "sena", "struktur"),
    ("truncus", "bål / stam", "struktur"),
    ("tuberositas", "skrovlighet", "struktur"),
    ("vas", "kärl", "struktur"),
    ("vena", "ven", "struktur"),
    ("venae", "vener (plural)", "struktur"),
    ("ventriculus", "magsäcken", "struktur"),
    ("vesica", "blåsa (urinblåsa)", "struktur"),
    ("viscera", "inälvor", "struktur"),

    # --- storleksadjektiv ---
    ("magnum", "stor", "storlek"),
    ("major, majus", "större", "storlek"),
    ("minor, minus", "mindre", "storlek"),

    # --- kroppsregioner ---
    ("caput", "huvud", "region"),
    ("cranium", "skalle", "region"),
    ("occiput", "bakhuvud", "region"),
    ("tempora", "tinning", "region"),
    ("nasus", "näsa", "region"),
    ("collum", "hals", "region"),
    ("jugulum", "halsgrop", "region"),
    ("thorax", "bröstkorg", "region"),
    ("abdomen", "buk", "region"),
    ("epigastriet", "maggrop", "region"),
    ("umbilicus", "navel", "region"),
    ("dorsum", "rygg", "region"),
    ("pelvis", "bäcken", "region"),
    ("inguen", "ljumske", "region"),
    ("gluteus", "säte", "region"),
    ("axilla", "armhåla", "region"),
    ("brachium", "överarm", "region"),
    ("cubitus", "armbåge", "region"),
    ("antebrachium", "underarm", "region"),
    ("manus", "handen", "region"),
    ("dorsum manus", "handrygg", "region"),
    ("palma manus", "handflata", "region"),
    ("carpus", "handled", "region"),
    ("metacarpus", "mellanhanden", "region"),
    ("digiti", "fingrarna", "region"),
    ("femur", "lår", "region"),
    ("genu", "knä", "region"),
    ("crus", "underben", "region"),
    ("pes", "fot", "region"),
    ("dorsum pedis", "fotrygg", "region"),
    ("tarsus", "vrist", "region"),
    ("metatarsus", "mellanfot", "region"),
    ("digiti pedis", "tår", "region"),
]


def pick_distractors(idx, term, meaning, category):
    """Tre distraktorer: i första hand ur samma kategori, annars hela poolen.

    Formen väger lika tungt som kategorin. Åtta av posterna bär ett
    förtydligande inom parentes – "övre (hela kroppen)" mot "övre (inom bålen)",
    "artärer (plural)" mot "artär" – och parentesen finns för att svaren annars
    vore identiska. Men om ett sådant svar ställs mot tre parenteslösa
    distraktorer blir parentesen i sig facit: man ser vilket alternativ som är
    rätt utan att veta vad termen betyder. Distraktorerna sorteras därför så att
    de med samma parentesform kommer först, inom den kategori som redan valts.
    Sorteringen är stabil, så slumpordningen inom varje form är kvar.
    """
    rng = random.Random(f"medlatin-{idx}-{term}")
    parentes = "(" in meaning

    def samma_form_först(pool):
        rng.shuffle(pool)
        pool.sort(key=lambda m: ("(" in m) != parentes)
        return pool

    same = samma_form_först([m for (t, m, c) in ITEMS
                             if c == category and m != meaning])
    chosen, seen = [], {meaning}
    for m in same:
        if m not in seen:
            chosen.append(m)
            seen.add(m)
        if len(chosen) == 3:
            break
    if len(chosen) < 3:
        rest = samma_form_först([m for (t, m, c) in ITEMS if m not in seen])
        for m in rest:
            chosen.append(m)
            seen.add(m)
            if len(chosen) == 3:
                break
    return chosen


def main():
    questions = []
    for i, (term, meaning, cat) in enumerate(ITEMS, start=1):
        lead = "förleden" if term.rstrip().endswith("-") else "den medicinska termen"
        questions.append({
            "id": f"medlatin_q{i}",
            "type": "mc",
            "prompt": f'Vad betyder {lead} "{term}"?',
            "correct": meaning,
            "distractors": pick_distractors(i, term, meaning, cat),
            "topic": "medicinsk_latin",
            "difficulty": "Normal",
            "source": "Medicinsk latin",
        })

    out = Path(__file__).resolve().parent.parent / "data" / "medicinsk_latin.json"
    out.write_text(json.dumps(questions, ensure_ascii=False, indent=2) + "\n",
                   encoding="utf-8")
    print(f"Skrev {len(questions)} frågor till {out}")


if __name__ == "__main__":
    main()
