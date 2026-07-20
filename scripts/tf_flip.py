"""Flippa TF-frågor: skriv om prompten till ett falskt påstående och sätt correct=Falskt.

Anropas som:  python3 tf_flip.py <fil.json> <patch.json>
patch.json: {"q405": "ny prompt", ...}   (värdet None = bara rätta prompten, behåll Sant)
Serialiseringen är byte-identisk med datafilerna (indent=2, ensure_ascii=False).
"""
import json, sys

path, patchpath = sys.argv[1], sys.argv[2]
qs = json.load(open(path))
patch = json.load(open(patchpath))
seen = set()
for q in qs:
    if q["id"] in patch:
        newprompt = patch[q["id"]]
        assert q["correct"] == "Sant", f'{q["id"]} är inte Sant'
        assert set(q["distractors"]) == {"Falskt"}, f'{q["id"]} är inte TF'
        q["prompt"] = newprompt
        q["correct"] = "Falskt"
        q["distractors"] = ["Sant"]
        seen.add(q["id"])
missing = set(patch) - seen
assert not missing, f"hittade inte: {missing}"
open(path, "w").write(json.dumps(qs, ensure_ascii=False, indent=2))
print(f"{path}: {len(seen)} frågor flippade till Falskt")
