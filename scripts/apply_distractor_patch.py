#!/usr/bin/env python3
"""Applicera en patch {id: [d1,d2,d3,...]} på en quiz-JSON: ersätter distractors för angivna id.
Kör: python3 scripts/apply_distractor_patch.py data/fysioterapeut.json /tmp/patch.json
Skriver tillbaka in-place och rapporterar kvarvarande längdbias för de patchade frågorna."""
import json, sys

data_path, patch_path = sys.argv[1], sys.argv[2]
data = json.load(open(data_path))
patch = json.load(open(patch_path))
by_id = {q['id']: q for q in data}

applied = 0
still_flagged = []
for qid, entry in patch.items():
    if qid not in by_id:
        print('SAKNAS:', qid); continue
    q = by_id[qid]
    if isinstance(entry, dict):
        new_ds = entry.get('distractors', q['distractors'])
        if 'correct' in entry:
            q['correct'] = entry['correct']
    else:
        new_ds = entry
    assert len(new_ds) == len(q['distractors']), f'{qid}: antal distraktorer ändrat'
    q['distractors'] = new_ds
    applied += 1
    if len(q['correct']) > max(len(x) for x in new_ds):
        still_flagged.append((qid, len(q['correct']), max(len(x) for x in new_ds)))

json.dump(data, open(data_path, 'w'), ensure_ascii=False, indent=2)
print(f'Patchade {applied} frågor.')
if still_flagged:
    print('FORTFARANDE FLAGGADE (correct längst):')
    for qid, lc, md in still_flagged:
        print(f'  {qid}: correct={lc} > maxdistr={md}')
else:
    print('Inga av de patchade är längst längre. ✔')
