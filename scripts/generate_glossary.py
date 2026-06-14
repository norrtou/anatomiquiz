#!/usr/bin/env python3
"""
generate_glossary.py — förrenderar den medicinska ordlistan för SEO och no-JS.

Källa: data/ordlista.json
Mål:   medicinskordlista.html

Skriptet är ENDA källan till sanning för de dynamiska delarna av sidan och
uppdaterar tre saker idempotent (kör om när som helst):

  1. Statiskt <dl>-innehåll mellan  GENERATED:GLOSSARY:START/END
     — alfabetiskt grupperat, varje post med stabilt id och lang="en" på
       den engelska termen. Gör hela ordlistan crawlbar utan JavaScript.
  2. JSON-LD DefinedTermSet med hasDefinedTerm mellan GENERATED:JSONLD:START/END
     — ger sökmotorer förståelse på term-nivå.
  3. Titel/meta/Open Graph/Twitter Card sätts till fasta texter ("tusentals",
     ingen siffra). Termantalet hålls statiskt i head/SEO; endast räknaren i
     sidans body är dynamisk.

glossary.js måste rendera identisk markup (samma slug-/format-logik) så att
djuplänkar är stabila oavsett om sidan renderas statiskt eller av JS.
"""

from __future__ import annotations

import html
import json
import re
import sys
from pathlib import Path


def escape_html(text: str) -> str:
    """Escapa & < > " — exakt samma teckenmängd som escapeHtml() i glossary.js.

    (Avsiktligt INTE apostrof: JS:ens escapeHtml lämnar ' orört, så vi gör
    detsamma för byte-identisk markup mellan statisk rendering och JS.)
    """
    return (
        text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "ordlista.json"
PAGE = ROOT / "medicinskordlista.html"

SITE_URL = "https://norrtou.github.io/anatomiquiz/medicinskordlista.html"

# Diakriter → ASCII för slugs (måste matcha slugify i js/glossary.js)
_SLUG_MAP = {"å": "a", "ä": "a", "ö": "o", "é": "e", "è": "e", "ü": "u"}


def slugify(term: str) -> str:
    """Stabil ankar-id från en term. Identisk logik som i js/glossary.js.

    Suffix-poster inleds med streck (t.ex. "-algi"); de får prefixet
    "term-suffix-" så att deras slug inte kolliderar med likalydande grundord
    eller prefix (strecket faller annars bort i slugen). Inga andra termer
    inleds med streck, så befintliga ankare påverkas inte.
    """
    is_suffix = term.startswith("-")
    s = term.lower()
    s = "".join(_SLUG_MAP.get(c, c) for c in s)
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return f"term-suffix-{s}" if is_suffix else f"term-{s}"


def format_def(text: str) -> str:
    """Escapa HTML och kursivera den engelska termen. Matchar formatDef i JS.

    quote=True så att " → &quot; precis som escapeHtml() i js/glossary.js,
    vilket ger byte-identisk markup mellan statisk och JS-rendering.
    """
    escaped = escape_html(text)
    return re.sub(
        r"Eng: ((?:[^.(]|\([^)]*\))+)\.",
        r'Eng: <em lang="en">\1</em>.',
        escaped,
    )


def build_glossary_html(terms: list[dict]) -> str:
    """Bygg alfabetiskt grupperad <dl>-markup i samma ordning som JS."""
    groups: dict[str, list[dict]] = {}
    for entry in terms:
        letter = entry["term"][0].upper()
        groups.setdefault(letter, []).append(entry)

    lines: list[str] = []
    for letter in sorted(groups):
        anchor = slugify(letter).replace("term-", "letter-")
        lines.append(
            f'        <h3 class="glossary-letter" id="{anchor}">{letter}'
            '<a class="glossary-top" href="#main" aria-label="Tillbaka till toppen">↑ Topp</a></h3>'
        )
        lines.append('        <dl class="glossary-group">')
        for entry in groups[letter]:
            slug = slugify(entry["term"])
            term = escape_html(entry["term"])
            definition = format_def(entry["def"])
            lines.append(
                f'          <div class="glossary-entry" id="{slug}">'
                f'<dt class="glossary-term">{term}</dt>'
                f'<dd class="glossary-def">{definition}</dd></div>'
            )
        lines.append("        </dl>")
    return "\n".join(lines)


# Svenska alfabetet — fast ordning för alfabetsraden. Bokstäver utan poster
# renderas nedtonade (icke-klickbara), så raden ser likadan ut oavsett innehåll.
SWEDISH_ALPHABET = list("ABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖ")


def build_alphabet_html(terms: list[dict]) -> str:
    """Bygg den klickbara alfabetsraden som hoppankare till bokstavsgrupperna.

    Befintliga bokstäver blir <a href="#letter-x">; saknade bokstäver blir
    nedtonade <span> (is-disabled). Eventuella icke-bokstavsinitialer (t.ex.
    siffror) läggs först, i samma sorteringsordning som grupperna renderas.
    glossary.js växlar is-disabled live efter sökträffar.
    """
    present = {entry["term"][0].upper() for entry in terms}
    extras = sorted(present - set(SWEDISH_ALPHABET))
    order = extras + SWEDISH_ALPHABET

    lines: list[str] = []
    for letter in order:
        anchor = slugify(letter).replace("term-", "letter-")
        label = escape_html(letter)
        if letter in present:
            lines.append(
                f'        <a class="glossary-alpha" href="#{anchor}" '
                f'data-letter="{label}">{label}</a>'
            )
        else:
            lines.append(
                f'        <span class="glossary-alpha is-disabled" '
                f'data-letter="{label}" aria-disabled="true">{label}</span>'
            )
    return "\n".join(lines)


def build_jsonld(terms: list[dict], count: int) -> str:
    """Bygg DefinedTermSet-objektet med samtliga termer."""
    obj = {
        "@context": "https://schema.org",
        "@type": "DefinedTermSet",
        "name": "Medicinsk ordlista — latinska och anatomiska termer",
        "description": (
            "Komplett ordlista med tusentals latinska och anatomiska termer på "
            "svenska, med definitioner, synonymer och etymologi."
        ),
        "inLanguage": "sv-SE",
        "url": SITE_URL,
        "hasDefinedTerm": [
            {
                "@type": "DefinedTerm",
                "name": e["term"],
                "description": e["def"],
                "url": f"{SITE_URL}#{slugify(e['term'])}",
            }
            for e in terms
        ],
    }
    body = json.dumps(obj, ensure_ascii=False, indent=2)
    return f'  <script type="application/ld+json">\n{body}\n  </script>'


def replace_between(text: str, start: str, end: str, payload: str) -> str:
    pattern = re.compile(
        re.escape(start) + r".*?" + re.escape(end), re.DOTALL
    )
    if not pattern.search(text):
        sys.exit(f"FEL: hittade inte markörerna {start} … {end}")
    return pattern.sub(f"{start}\n{payload}\n{end}", text)


def set_meta(text: str, attr: str, name: str, value: str) -> str:
    """Sätt content-värdet för <meta {attr}="{name}" content="...">."""
    pattern = re.compile(
        r'(<meta ' + attr + r'="' + re.escape(name) + r'" content=")[^"]*(">)'
    )
    if not pattern.search(text):
        sys.exit(f"FEL: hittade inte meta {attr}={name}")
    return pattern.sub(lambda m: m.group(1) + html.escape(value, quote=True) + m.group(2), text)


def main() -> None:
    terms = json.loads(DATA.read_text(encoding="utf-8"))
    # Stubs (status == "stub") är ofärdiga poster som samlats i ordlista.json
    # men ännu inte berikats — de ska INTE renderas live. Filtrera bort dem
    # före allt annat (count, HTML, JSON-LD, slug-kollisionskoll) så att
    # ofärdig data aldrig syns och stub-slugs aldrig kan blockera bygget.
    terms = [e for e in terms if e.get("status") != "stub"]
    count = len(terms)

    # Kontrollera unika slugs — annars blir djuplänkar tvetydiga
    slugs = [slugify(e["term"]) for e in terms]
    dupes = {s for s in slugs if slugs.count(s) > 1}
    if dupes:
        sys.exit(f"FEL: slug-kollisioner: {sorted(dupes)}")

    page = PAGE.read_text(encoding="utf-8")

    # 1. Statiskt ordlisteinnehåll
    page = replace_between(
        page,
        "<!-- GENERATED:GLOSSARY:START -->",
        "<!-- GENERATED:GLOSSARY:END -->",
        build_glossary_html(terms),
    )

    # 1b. Alfabetsrad (hoppankare)
    page = replace_between(
        page,
        "<!-- GENERATED:ALPHABET:START -->",
        "<!-- GENERATED:ALPHABET:END -->",
        build_alphabet_html(terms),
    )

    # 2. JSON-LD DefinedTermSet
    page = replace_between(
        page,
        "<!-- GENERATED:JSONLD:START -->",
        "<!-- GENERATED:JSONLD:END -->",
        build_jsonld(terms, count),
    )

    # 3. Titel + sociala metataggar. INGEN dynamisk siffra i head/SEO ("tusentals")
    # — endast räknaren i sidans body får vara dynamisk (användarens uttryckliga krav).
    title = "Medicinsk ordlista — tusentals latinska och anatomiska termer | Anatomiquiz"
    page = re.sub(r"(<title>)[^<]*(</title>)", rf"\g<1>{title}\g<2>", page)

    social_title = "Medicinsk ordlista — tusentals latinska och anatomiska termer"
    img_alt = "Medicinsk ordlista — tusentals latinska och anatomiska termer på Anatomiquiz"
    # Bing kräver 145–159 tecken; håll längden konstant (ingen {count}) så den inte driver.
    desc = (
        "Sökbar medicinsk ordlista på svenska med tusentals latinska och anatomiska "
        "termer: definition, ordklass, synonymer, lekmannauttryck och etymologi."
    )
    social_desc = (
        "Sökbar medicinsk ordlista på svenska: definitioner, synonymer, lekmannauttryck "
        "och etymologi för latinska och medicinska termer. Gratis för medicinstudenter."
    )

    page = set_meta(page, "name", "description", desc)
    page = set_meta(page, "property", "og:title", social_title)
    page = set_meta(page, "property", "og:description", social_desc)
    page = set_meta(page, "property", "og:image:alt", img_alt)
    page = set_meta(page, "name", "twitter:title", social_title)
    page = set_meta(page, "name", "twitter:description", social_desc)
    page = set_meta(page, "name", "twitter:image:alt", img_alt)

    PAGE.write_text(page, encoding="utf-8")
    print(f"OK: {count} termer förrenderade i {PAGE.name} (statiskt + JSON-LD + meta).")


if __name__ == "__main__":
    main()
