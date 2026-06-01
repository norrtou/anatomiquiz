#!/usr/bin/env python3
"""Genererar data/muskler_flashcards.json från muskellistan (VT26).

Enda källa till sanning för flashcard-ämnet "Muskler Flashcards". Varje muskel
ger upp till fyra kort (där det är relevant):
  1. Ursprung & fäste
  2. Funktion
  3. Innervation (endast de muskler där det anges)
  4. Extrinsisk/intrinsisk (endast övre extremitet/handen)

Framsidan = muskelns namn (prompt) + en kursiv indikationsrad (sub).
Baksidan  = svaret (correct), \n ger radbrytning i kortet.

Kör om efter ändring:  python3 scripts/generate_muskler_flashcards.py
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "muskler_flashcards.json"

TOPIC = "muskler_flashcards"
SOURCE = "Muskler Flashcards (VT26)"

SUB = {
    "uf": "(Ursprung och fäste?)",
    "funktion": "(Vad är dess funktion?)",
    "innervation": "(Vilken innervation?)",
    "kategori": "(Extrinsisk eller intrinsisk muskel?)",
    "definition": "(Vad innebär det?)",
}

# Allmänna begreppskort (inte knutna till en enskild muskel).
CONCEPT_CARDS = [
    ("Extrinsisk muskel", "Muskelbuken sitter utanför handen (i underarmen) och verkar på handen via långa senor."),
    ("Intrinsisk muskel", "Ligger helt inne i handen (både ursprung och fäste i handen)."),
]

# namn = framsida. uf/funktion/innervation = svar (None = inget kort).
# kategori = "Extrinsisk muskel" / "Intrinsisk muskel" / None.
MUSCLES = [
    # ---- Bålen ----
    {
        "namn": "Trapezius",
        "uf": "Ursprung: Occiput, cervikalkotorna, thoracalkotorna\nFäste: Scapula, clavicula",
        "funktion": "Eleverar och fixerar scapula",
    },
    {
        "namn": "Pectoralis major",
        "uf": "Ursprung: Sternum, clavicula\nFäste: Humerus",
        "funktion": "Adducerar i art. glenohumerale",
    },
    {
        "namn": "Pectoralis minor",
        "uf": "Ursprung: Costae III-V\nFäste: Processus coracoideus",
        "funktion": "Inåtrotation och depression av scapula",
    },
    {
        "namn": "Erector spinae",
        "uf": "Ursprung: Sacrum, crista iliaca\nFäste: Samtliga kotor i ländrygg, bröstrygg och nacke",
        "funktion": "Extenderar columna",
    },
    {
        "namn": "Rectus abdominis",
        "uf": "Ursprung: Os pubis\nFäste: Revbensbrosket, processus xiphoideus",
        "funktion": "Flekterar columna",
    },
    {
        "namn": "Transversus abdominis",
        "uf": "Ursprung: Djupa bladet av fascia thoracolumbalis, insidan av costa 7-12, crista iliaca\nFäste: Rektusskidan, linea alba",
        "funktion": "Ökar buktrycket, andningsmuskel",
    },
    {
        "namn": "Serratus anterior",
        "uf": "Ursprung: Lateralt på costae 1-9\nFäste: Scapula",
        "funktion": "Fixerar skulderbladet in mot thoraxväggen",
    },
    {
        "namn": "Rhomboidei (minor & major)",
        "uf": "Ursprung: Processus spinosus\nFäste: Margo medialis scapulae",
        "funktion": "Lyfta, adducera och inåtrotera skulderbladet",
    },
    {
        "namn": "Latissimus dorsi",
        "uf": "Ursprung: T7-L5, fascia, crista iliaca, nedersta 3-4 revbenen\nFäste: Humerus",
        "funktion": "Adduktion, extension och inåtrotation i art. glenohumerale",
    },
    {
        "namn": "Diafragma",
        "uf": None,
        "funktion": "Primär andningsmuskel",
    },
    # ---- Övre extremitet (extrinsisk/intrinsisk anges) ----
    # OBS: extrinsisk/intrinsisk gäller endast handens muskler (ursprung i
    # underarmen resp. helt inne i handen). Supraspinatus, deltoideus, biceps
    # och triceps brachii verkar på skuldra/armbåge och får därför ingen sådan
    # märkning, trots att källistan felaktigt angav "EXTRINSICMUSKEL".
    {
        "namn": "Supraspinatus",
        "uf": "Ursprung: Fossa supraspinata (scapula)\nFäste: Humerus",
        "funktion": "Abducerar och stabiliserar i art. glenohumerale",
    },
    {
        "namn": "Deltoideus",
        "uf": "Ursprung: Clavicula, acromion, scapula\nFäste: Humerus",
        "funktion": "Abducerar i art. glenohumerale",
    },
    {
        "namn": "Biceps brachii",
        "uf": "Ursprung: Scapula\nFäste: Radius",
        "funktion": "Flekterar i art. cubiti, flekterar i art. glenohumerale",
    },
    {
        "namn": "Triceps brachii",
        "uf": "Ursprung: Scapula, humerus\nFäste: Ulna",
        "funktion": "Extenderar i art. cubiti, extenderar i art. glenohumerale",
    },
    {
        "namn": "Flexor carpi ulnaris (FCU) & Flexor carpi radialis (FCR)",
        "uf": "Ursprung: Mediala epicondylen på humerus\nFäste: Metacarpalbenen",
        "funktion": "Flekterar i art. radiocarpea",
        "innervation": "FCU: n. ulnaris\nFCR: n. medianus",
        "kategori": "Extrinsisk muskel",
    },
    {
        "namn": "Extensor carpi radialis longus & brevis (ECRL & ECRB)",
        "uf": "Ursprung: Laterala epicondylen på humerus\nFäste: Metacarpalbenen",
        "funktion": "Extenderar i art. radiocarpea",
        "innervation": "n. radialis",
        "kategori": "Extrinsisk muskel",
    },
    {
        "namn": "Extensor digitorum communis (EDC)",
        "uf": "Ursprung: Laterala epicondylen på humerus\nFäste: De fyra fingrarna",
        "funktion": "Extenderar de fyra fingrarna",
        "innervation": "n. radialis",
        "kategori": "Extrinsisk muskel",
    },
    {
        "namn": "Flexor digitorum superficialis (FDS)",
        "uf": "Ursprung: Mediala epicondylen på humerus, radius och ulna\nFäste: De fyra fingrarna",
        "funktion": "Flekterar de fyra fingrarna",
        "innervation": "n. medianus",
        "kategori": "Extrinsisk muskel",
    },
    {
        "namn": "Flexor digitorum profundus (FDP)",
        "uf": "Ursprung: Ulna\nFäste: De fyra fingrarna",
        "funktion": "Flekterar de fyra fingrarna",
        "innervation": "Dig II-III: n. medianus\nDig IV-V: n. ulnaris",
        "kategori": "Extrinsisk muskel",
    },
    {
        "namn": "Flexor pollicis longus (FPL)",
        "uf": "Ursprung: Radius\nFäste: Tummens ytterfalang",
        "funktion": "Flekterar tummen (pollicis)",
        "innervation": "n. medianus",
        "kategori": "Extrinsisk muskel",
    },
    {
        "namn": "Extensor pollicis brevis (EPB) & Extensor pollicis longus (EPL)",
        "uf": "Ursprung: Radius respektive ulna\nFäste: Tummens två falanger (EPL ytterfalangen, EPB grundfalangen)",
        "funktion": "Extenderar tummen",
        "innervation": "n. radialis",
        "kategori": "Extrinsisk muskel",
    },
    {
        "namn": "Opponens pollicis (OP)",
        "uf": None,
        "funktion": "Opponerar tummen",
        "innervation": "n. medianus",
        "kategori": "Intrinsisk muskel",
    },
    {
        "namn": "Flexor pollicis brevis (FPB)",
        "uf": None,
        "funktion": "Flekterar tummen",
        "innervation": "n. medianus och n. ulnaris",
        "kategori": "Intrinsisk muskel",
    },
    {
        "namn": "Abductor pollicis longus (APL)",
        "uf": "Ursprung: Radius, ulna\nFäste: Basen av os metacarpale I",
        "funktion": "Abducerar tummen",
        "innervation": "n. radialis",
        "kategori": "Extrinsisk muskel",
    },
    {
        "namn": "Abductor pollicis brevis (APB)",
        "uf": None,
        "funktion": "Abducerar tummen",
        "innervation": "n. medianus",
        "kategori": "Intrinsisk muskel",
    },
    {
        "namn": "Adductor pollicis (ADP)",
        "uf": None,
        "funktion": "Adducerar tummen",
        "innervation": "n. ulnaris",
        "kategori": "Intrinsisk muskel",
    },
    # ---- Nedre extremitet ----
    {
        "namn": "Gluteus maximus",
        "uf": "Ursprung: Os coxae\nFäste: Femur",
        "funktion": "Extenderar i art. coxae",
    },
    {
        "namn": "Hamstrings",
        "uf": "Ursprung: Tuber ischiadicum (os coxae)\nFäste: Tibia, fibula",
        "funktion": "Extenderar i art. coxae, flekterar i art. genu",
    },
    {
        "namn": "Quadriceps",
        "uf": "Ursprung: Os coxae, femur\nFäste: Tibia",
        "funktion": "Extenderar i art. genu, flekterar i art. coxae",
    },
    {
        "namn": "Triceps surae (Gastrocnemius + Soleus)",
        "uf": "Ursprung: Tibia, fibula och femurs mediala och laterala kondyl\nFäste: Calcaneus",
        "funktion": "Flekterar fotleden\nKnäflexion (endast gastrocnemius)",
    },
    {
        "namn": "Tibialis anterior",
        "uf": "Ursprung: Tibias lateralsida\nFäste: Metatarsale 1",
        "funktion": "Extenderar fotleden, supination",
    },
]


def main() -> None:
    cards = []
    n = 0

    def add(prompt, kind, answer):
        nonlocal n
        n += 1
        cards.append({
            "id": f"mfc_{n}",
            "type": "fc",
            "prompt": prompt,
            "sub": SUB[kind],
            "correct": answer,
            "topic": TOPIC,
            "difficulty": "Normal",
            "source": SOURCE,
        })

    for prompt, answer in CONCEPT_CARDS:
        add(prompt, "definition", answer)

    for m in MUSCLES:
        name = m["namn"]
        if m.get("uf"):
            add(name, "uf", m["uf"])
        add(name, "funktion", m["funktion"])
        if m.get("innervation"):
            add(name, "innervation", m["innervation"])
        if m.get("kategori"):
            add(name, "kategori", m["kategori"])

    OUT.write_text(json.dumps(cards, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Skrev {len(cards)} kort till {OUT.relative_to(ROOT)} ({len(MUSCLES)} muskler)")


if __name__ == "__main__":
    main()
