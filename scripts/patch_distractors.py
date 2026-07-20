"""Ersätt distraktorer (och vid behov `correct`) i en datafil, och mät längdbias efteråt.

    python3 scripts/patch_distractors.py <fil.json> <patch.json>

patch.json: {"q12": {"d": ["ny1","ny2","ny3"], "c": "ev. ny correct"}, ...}
`c` är valfri och används bara för språkrättelser – rör aldrig sakinnehållet i rätt svar.

Skriptet räknar stränglängderna själv (§2.13: gissa aldrig längder för hand) och skriver ut
vilka patchade frågor som FORTFARANDE har `correct` längst, samt längdbias per rört ämne.
Serialiseringen är byte-identisk med datafilerna (indent=2, ensure_ascii=False).
"""
import json, sys, collections

path, patchpath = sys.argv[1], sys.argv[2]
qs = json.load(open(path))
patch = json.load(open(patchpath))
seen, still = set(), []

for q in qs:
    p = patch.get(q["id"])
    if p is None or q.get("type") != "mc":
        continue
    if "c" in p:
        q["correct"] = p["c"]
    q["distractors"] = p["d"]
    assert q["correct"] not in p["d"], f'{q["id"]}: rätt svar finns bland distraktorerna'
    assert len(set(p["d"])) == len(p["d"]), f'{q["id"]}: duplicerad distraktor'
    seen.add(q["id"])
    gap = len(q["correct"]) - max(len(x) for x in p["d"])
    if gap > 0:
        still.append((gap, q["id"], q["correct"]))

missing = set(patch) - seen
assert not missing, f"hittade inte (eller ej type=mc): {missing}"
open(path, "w").write(json.dumps(qs, ensure_ascii=False, indent=2))
print(f"{path}: {len(seen)} frågor patchade")

if still:
    print(f"\n⚠️  {len(still)} patchade frågor har fortfarande `correct` längst – förläng mer:")
    for gap, qid, c in sorted(still, reverse=True):
        print(f"   {qid} saknar {gap} tecken (correct {len(c)}): {c}")

touched = {q["topic"] for q in qs if q["id"] in seen}
by = collections.defaultdict(list)
for q in qs:
    if q.get("type") == "mc" and q.get("correct") and q.get("distractors"):
        by[q["topic"]].append(q)
print("\nLängdbias per rört ämne:")
for t in sorted(touched):
    v = by[t]
    lo = sum(1 for q in v if len(q["correct"]) > max(len(x) for x in q["distractors"]))
    flag = "  ⚠️" if round(100 * lo / len(v)) > 40 else ""
    print(f"   {round(100*lo/len(v)):3}%  {lo}/{len(v)}  {t}{flag}")
