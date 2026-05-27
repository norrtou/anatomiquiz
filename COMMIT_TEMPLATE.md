# Commit message template (Conventional Commits)

Skriv commit-meddelanden enligt konventionen nedan. Detta gör det enklare att generera changelogs och skapa releaser.

Format:

<type>(<scope>): <kort beskrivning>

<längre beskrivning av ändringen; flera rader tillåts>

BREAKING CHANGE: <beskriv ändring som bryter bakåtkompatibilitet>

Exempel:

feat(ui): uppdatera knapptexter för topplista

Uppdaterar knappen "Visa highscore" till "Visa topplista" och migrerar localStorage-nycklar.

Typer (välj en):
- feat: ny funktion
- fix: buggfix
- docs: dokumentation
- style: formattering, vita luckor, semikolon saknas
- refactor: kodändring som varken lägger till funktionalitet eller åtgärdar en bugg
- perf: prestandaförbättring
- test: lägga till/säkerställa tester
- chore: övrigt underhåll (build, verktyg)

Regler:
- Håll ämnesraden kort (max 50 tecken).
- Använd imperativ presens, t.ex. "Lägg till" inte "La till".
- Ange scope när ändringen påverkar en specifik modul eller fil (t.ex. `ui`, `data`, `scripts`).
