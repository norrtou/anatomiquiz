#!/usr/bin/env python3
"""
generate_changelog_teaser.py — liten teaser-fil för info.html.

info.html visar bara de tre senaste versionerna, men hämtade tidigare hela
CHANGELOG.md (~420 KB) för att göra det. Det här skriptet klipper ut de
senaste posterna till changelog-latest.json (~10 KB), som info.js hämtar
i stället.

Filen ligger i repo-roten tillsammans med de andra genererade sajtfilerna
(sitemap.xml, llms.txt, manifest.json) — medvetet INTE i data/, eftersom
pre-commit-hooken kör allt som matchar data/*.json genom quizvalidatorn.

Körs automatiskt av .githooks/pre-commit när CHANGELOG.md är stagead, så
filen aldrig hinner glida ur synk. Kan också köras för hand:

    python3 scripts/generate_changelog_teaser.py
"""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CHANGELOG = ROOT / "CHANGELOG.md"
OUT = ROOT / "changelog-latest.json"

# Måste vara minst lika många som TEASER_ENTRIES i js/info.js.
ENTRIES = 3


def parse(text):
    """Plockar ut versionsposter ur CHANGELOG.md — samma format som parseChangelog() i js/changelog.js."""
    entries = []
    current = None
    for raw in text.splitlines():
        line = raw.rstrip()
        if line.startswith("## "):
            if current:
                entries.append(current)
            current = {"version": line[3:].strip(), "items": []}
        elif current is not None and line.startswith("- "):
            current["items"].append(line[2:].strip())
    if current:
        entries.append(current)
    return entries


def main():
    entries = parse(CHANGELOG.read_text(encoding="utf-8"))[:ENTRIES]
    OUT.write_text(
        json.dumps(entries, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    versions = ", ".join(e["version"] for e in entries)
    print(f"changelog-latest.json: {len(entries)} versioner ({versions}), {OUT.stat().st_size} byte")


if __name__ == "__main__":
    main()
