#!/usr/bin/env python3
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
QPATH = ROOT / 'data' / 'questions.json'
OUT = ROOT / 'data' / 'validation-report.txt'

def load_questions(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def validate(qs):
    report = []
    ids = set()
    dup_ids = []
    for i,q in enumerate(qs, start=1):
        ctx = f"[{i}] id={q.get('id','<missing>')}"
        # required fields
        missing = [k for k in ('id','type','prompt','correct','distractors','topic','difficulty','source') if k not in q]
        if missing:
            report.append(f"{ctx}: MISSING fields: {missing}")
            continue

        if q['id'] in ids:
            dup_ids.append(q['id'])
        ids.add(q['id'])

        typ = q['type']
        dlen = len(q.get('distractors') or [])
        if typ=='tf':
            # TF must have exactly 1 distractor (so total 2 options)
            if dlen != 1:
                report.append(f"{ctx}: TF question should have exactly 1 distractor (has {dlen}).")
        elif typ=='mc':
            total = 1 + dlen
            if total < 3 or total > 5:
                report.append(f"{ctx}: MC question should have 3–5 options (has {total}).")
        else:
            report.append(f"{ctx}: Unknown type '{typ}'. Use 'tf' or 'mc'.")

        # Correct answer should not appear among distractors
        if q['correct'] in (q.get('distractors') or []):
            report.append(f"{ctx}: Correct answer appears in distractors.")

        # Prompt should not include leading directive for TF (basic heuristic)
        if typ=='tf' and ('sant' in q['prompt'].lower() or 'falskt' in q['prompt'].lower()):
            report.append(f"{ctx}: Prompt contains 'sant'/'falskt' — prefer just the statement without question prefix.")

    if dup_ids:
        report.append(f"Duplicate IDs found: {dup_ids}")

    # Summary
    report.insert(0, f"Total questions: {len(qs)}")
    return report

def main():
    qs = load_questions(QPATH)
    rep = validate(qs)
    OUT.write_text('\n'.join(rep), encoding='utf-8')
    print('\n'.join(rep))
    print(f"\nReport written to: {OUT}")

if __name__=='__main__':
    main()
