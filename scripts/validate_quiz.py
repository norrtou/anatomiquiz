#!/usr/bin/env python3
"""Maskinell kontroll av quiz-reglerna i CLAUDE_REGLER.md.

Körs fristående eller som git pre-commit-hook / Claude Code-hook.
  python3 scripts/validate_quiz.py            # kollar alla data/*.json
  python3 scripts/validate_quiz.py f1 f2 ...  # kollar angivna filer

ERROR (avslutkod 1, blockerar commit): bildfråga med icke-tom prompt, dubblett-id,
tomt/duplicerat svarsalternativ, rätt svar bland distraktorerna, fel antal MC-alternativ,
dubblerad frågetext inom ett ämne, TF-fråga felmärkt som "mc" (dras aldrig av appen, §2.4).

Kontrolleras INTE maskinellt (§2.4, §2.9) – gör dem för hand: TF-balansen Sant/Falskt per
ämne, antals-paritet i frågor med räkneord, och kvasi-absoluta "bara"/"alla" i distraktorer.

WARNING (blockerar inte): längdbias, parentes-asymmetri, självbesvarande fråga,
numerisk asymmetri, absolut-ord enbart i distraktorerna, självutpekande distraktor,
förbjudet filler-alternativ.
Dessa kräver omdöme att åtgärda men rapporteras så de aldrig glöms bort.
"""
import json, sys, glob, re, os
from collections import defaultdict, Counter

# Filer som inte är MC/TF-quiz (ordlista, register, flashcards utan distraktorer)
SKIP = {"ordlista.json", "ordlista_import_raw.json", "kb_glossary_terms.json",
        "bilder.json"}
LEN_BIAS_LIMIT = 40  # % frågor där correct är längst, per ämne, innan varning

# §2.9: absoluta ord gör en distraktor strykbar utan sakkunskap om rätt svar aldrig bär dem
ABSOLUTE = re.compile(r"\b(endast|enbart|alltid|aldrig|inga|ingen|inget|samtliga|uteslutande)\b", re.I)
# §2.2: distraktorn skyltar med att den är fel i stället för att vara ett trovärdigt alternativ
SELF_LABEL = re.compile(r"\b(en|ett)\s+(helt\s+)?(annan|annat)\b|vilket är felaktigt|"
                        r"vilket inte stämmer|är felaktigt påstått|en påhittad benämning", re.I)
FILLER = re.compile(r"(ing[ae]n av dessa|inget av dessa|ing[ae]n av ovanstående|inget av ovanstående|"
                    r"ing[ae]n av alternativen|inget av alternativen|inget alternativ|"
                    r"annat ben|annan struktur)", re.I)

# §2.9: frågor som testar BÖJNING – där ska svaret vara den böjda formen av frågans ord,
# så morfologiskt eko är korrekt och ska inte flaggas.
FORM_Q = re.compile(r"\b(genitiv|nominativ|ackusativ|dativ|ablativ|kasus|deklination|"
                    r"pluralform|singularform|plural|singular|böjs|böjning|kongruer)", re.I)

def _morphological_echo(prompt, correct):
    """True om svaret är frågans egen citerade term med bytt ändelse (§2.9).

    Fångar 'Vad betyder riktningstermen "medialis"?' -> correct "Medial", som går att
    lösa på ren ordlikhet. Böjningsfrågor undantas via FORM_Q.
    """
    if FORM_Q.search(prompt) or " " in correct.strip():
        return None            # formfråga, eller ett svar som är en definition (flera ord)
    c = re.sub(r"[^a-zåäö]", "", correct.lower())
    if len(c) < 5:
        return None
    for term in re.findall(r"[\"'«»]([A-Za-zÅÄÖåäö-]{4,})[\"'«»]", prompt):
        t = re.sub(r"[^a-zåäö]", "", term.lower())
        if not t or t == c:
            continue           # ordagrant eko fångas redan av kontrollen ovan
        stem = min(len(c), len(t)) - 2      # tillåt att ändelsen skiljer
        if stem >= 4 and c[:stem] == t[:stem]:
            return term
    return None

def _negates_correct(distractor, correct):
    """True om distraktorn negerar med rätt svarets egna nyckelord ('Levern, inte pankreas')."""
    m = re.search(r",\s*(?:inte|utan)\s+(.{3,40})$", distractor, re.I)
    if not m:
        return False
    tail = m.group(1).lower()
    return any(t in tail for t in re.findall(r"\w{5,}", correct.lower()))

def load(path):
    try:
        d = json.load(open(path))
        return d if isinstance(d, list) else None
    except Exception:
        return None

def check_file(path, errors, warnings):
    items = load(path)
    if items is None:
        return
    name = os.path.basename(path)
    ids = Counter()
    qa_by_topic = defaultdict(Counter)  # (prompt, correct) → antal, för äkta dubbletter
    by_topic = defaultdict(list)
    for it in items:
        if not isinstance(it, dict):
            continue
        qid = it.get("id", "?")
        ids[qid] += 1
        topic = it.get("topic", "?")
        prompt = it.get("prompt", "")
        correct = it.get("correct")
        ds = it.get("distractors")

        # Bildfråga måste ha tom prompt (§2.10)
        if it.get("image") and prompt.strip():
            errors.append(f"{name}:{qid} bildfråga har icke-tom prompt")

        if ds is not None:
            opts = [correct] + list(ds)
            if any((o is None or not str(o).strip()) for o in opts):
                errors.append(f"{name}:{qid} tomt svarsalternativ")
            if correct in ds:
                errors.append(f"{name}:{qid} rätt svar finns även bland distraktorerna")
            if len(ds) != len(set(ds)):
                errors.append(f"{name}:{qid} duplicerade distraktorer")
            if it.get("type") == "mc" and not (2 <= len(opts) <= 4):
                errors.append(f"{name}:{qid} MC har {len(opts)} alternativ (ska vara 2–4)")
            # TF-fråga felmärkt som mc: faller ur BÅDE tfPool och mcPool i app.js
            # (mcPool kräver 3–5 alternativ) → frågan dras i praktiken aldrig. §2.4
            if (it.get("type") == "mc" and len(ds) == 1
                    and {str(correct), *map(str, ds)} <= {"Sant", "Falskt"}):
                errors.append(f"{name}:{qid} TF-fråga märkt \"type\": \"mc\" (ska vara \"tf\")")
            if it.get("type") == "mc" and correct and ds:
                by_topic[topic].append(it)
            # äkta dubbletter (samma fråga OCH samma svar) – dubbelriktade frågor
            # (samma prompt, olika correct) är legitima och flaggas inte
            if prompt.strip():
                qa_by_topic[topic][(prompt.strip(), str(correct))] += 1

    for qid, n in ids.items():
        if n > 1:
            errors.append(f"{name}: id '{qid}' förekommer {n} gånger")
    for topic, c in qa_by_topic.items():
        for (p, _corr), n in c.items():
            if n > 1:
                errors.append(f"{name}:{topic} identisk fråga+svar {n}× : {p[:60]}…")

    # Varningar per ämne
    for topic, qs in by_topic.items():
        longest = sum(1 for q in qs if len(q["correct"]) > max(len(x) for x in q["distractors"]))
        pct = round(100 * longest / len(qs))
        if pct > LEN_BIAS_LIMIT:
            warnings.append(f"{name}:{topic} längdbias {pct}% (rätt svar längst i {longest}/{len(qs)})")
        cparen = sum(1 for q in qs if "(" in q["correct"])
        dparen = sum(1 for q in qs for x in q["distractors"] if "(" in x)
        if cparen and cparen / len(qs) > 0.15 and cparen > (dparen / 3):
            warnings.append(f"{name}:{topic} parentes-asymmetri: {cparen} rätt-svar med parentes vs {dparen} distraktorer")
        for q in qs:
            c = q["correct"].strip().rstrip(".?!")
            if len(c) < 3:
                continue
            # självbesvarande: svaret står ordagrant i frågan (§2.9)
            if re.search(r"\b" + re.escape(c) + r"\b", q["prompt"], re.I):
                if not any(re.search(r"\b" + re.escape(str(x).strip().rstrip(".?!")) + r"\b", q["prompt"], re.I) for x in q["distractors"]):
                    warnings.append(f"{name}:{q.get('id')} självbesvarande: '{c}' står i frågetexten")
            # självbesvarande variant: svaret är frågans term med bytt ändelse (§2.9)
            term = _morphological_echo(q["prompt"], c)
            if term:
                warnings.append(f"{name}:{q.get('id')} självbesvarande: svaret '{c}' är frågans term '{term}' med bytt ändelse")
            # numerisk-/format-paritet (§2.9): rätt svar är ett ANTAL/tal (börjar med en siffra,
            # ev. efter cirka/ca/~) men någon distraktor saknar siffra. Börjar svaret med en
            # bokstav (t.ex. "A1-pulleyn") räknas siffran som del av ett namn, inte ett antal.
            if re.match(r"^\s*(cirka|ca|c:a|ungefär|omkring|drygt|knappt|minst|högst|>|<|~)?\s*\d", c, re.I) and len(c.split()) <= 4:
                if any(not re.search(r"\d", str(x)) for x in q["distractors"]):
                    warnings.append(f"{name}:{q.get('id')} numerisk asymmetri: rätt svar '{c}' är ett tal men någon distraktor saknar siffra")
            # absolut-ords-tell (§2.9): distraktorerna bär "endast/enbart/alltid/aldrig …"
            # men rätt svar gör det aldrig → går att stryka utan sakkunskap
            if any(ABSOLUTE.search(str(x)) for x in q["distractors"]) and not ABSOLUTE.search(q["correct"]):
                warnings.append(f"{name}:{q.get('id')} absolut-ord enbart i distraktorerna (går att stryka utan sakkunskap)")
            # självutpekande distraktor (§2.2): talar om att den är fel, eller negerar med
            # rätt svarets egna nyckelord ("Levern, inte pankreas")
            for x in q["distractors"]:
                if SELF_LABEL.search(str(x)) or _negates_correct(str(x), q["correct"]):
                    warnings.append(f"{name}:{q.get('id')} självutpekande distraktor: '{str(x)[:60]}…'")
                    break
            # förbjudna filler-alternativ (§2.2)
            for x in q["distractors"]:
                if FILLER.search(str(x)):
                    warnings.append(f"{name}:{q.get('id')} förbjudet filler-alternativ: '{str(x)[:60]}…'")
                    break

def main():
    args = [a for a in sys.argv[1:] if a.endswith(".json")]
    files = args or sorted(glob.glob("data/*.json"))
    files = [f for f in files if os.path.basename(f) not in SKIP
             and not os.path.basename(f).startswith("_ARCHIVED")]
    errors, warnings = [], []
    for f in files:
        check_file(f, errors, warnings)
    if warnings:
        print(f"⚠️  {len(warnings)} VARNINGAR (blockerar ej):")
        for w in warnings:
            print("   -", w)
    if errors:
        print(f"\n❌ {len(errors)} FEL (blockerar commit):")
        for e in errors:
            print("   -", e)
        return 1
    print(f"\n✅ Inga blockerande fel i {len(files)} filer.")
    return 0

if __name__ == "__main__":
    sys.exit(main())
