#!/usr/bin/env python3
"""
generate_glossary.py — förrenderar den medicinska ordlistan för SEO och no-JS.

Källa: data/ordlista.json
Mål:   medicinskordlista.html (landningssida) + en sida per icke-tom grupp:
       ordlista-<a..z|aa|ae|oe>.html, ordlista-siffror.html, ordlista-tecken.html
       samt sitemap.xml.

Bakgrund: en enda ordliste-HTML växte till ~3,5 MB och fick katastrofal
hastighet i Search Console (Core Web Vitals mäts per URL). Lösningen är att
dela upp ordlistan i många små, fokuserade sidor — en per begynnelsebokstav,
en för siffror och en för ändelser/tecken — som var och en laddar snabbt.

DATADRIVET: skriptet hårdkodar INGET om vilka bokstäver som finns. Det läser
data/ordlista.json, grupperar på begynnelsetecken och skapar en sida för varje
grupp som faktiskt har termer. Tomma bokstäver (t.ex. Å/Ä idag) får ingen sida
men renderas nedtonade i alfabetsraden; dyker en term upp imorgon skapas sidan
automatiskt vid nästa körning. Kör om när som helst (idempotent).

Sökningen är global och bor i js/glossary.js: den lazy-laddar ordlista.json
först när användaren börjar söka, och länkar träffar till rätt sida + ankare.
Därför måste page_slug()/slugify() här spegla motsvarande logik i glossary.js
byte för byte, så att djuplänkar är stabila oavsett rendering.

JSON-LD: medvetet LÄTT (WebPage/CollectionPage + BreadcrumbList). Den tidigare
DefinedTermSet:en med samtliga termers URL:er stod för ~1,8 MB och gav minimal
rich-result-nytta — innehållet är ändå fullt crawlbart som semantisk <dl>.
"""

from __future__ import annotations

import datetime
import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "ordlista.json"
SITEMAP = ROOT / "sitemap.xml"

SITE = "https://norrtou.github.io/anatomiquiz"
LANDING_FILE = "medicinskordlista.html"

# Cachebusters per asset — bumpa bara den som faktiskt ändrats.
STYLES_V = "0.7.1"        # css/styles.css (oförändrad sedan tidigare)
GLOSSARY_V = "0.8.28"     # css/glossary.css + js/glossary.js (denna release)

# Svenska alfabetet — fast ordning för alfabetsraden. Bokstäver utan poster
# renderas nedtonade (icke-klickbara), så raden ser likadan ut oavsett innehåll.
SWEDISH_ALPHABET = list("ABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖ")

# Diakriter → ASCII för term-slugs (måste matcha slugifyBase i js/glossary.js)
_SLUG_MAP = {"å": "a", "ä": "a", "ö": "o", "é": "e", "è": "e", "ü": "u"}

# Distinkta filnamns-slugs för bokstäver vars term-slug annars kolliderar
# (Å/Ä→a krockar med A; Ö→o krockar med O). Måste matcha pageSlug() i JS.
_PAGE_SLUG = {"Å": "aa", "Ä": "ae", "Ö": "oe"}


# ---------------------------------------------------------------------------
# Gruppering & slugs
# ---------------------------------------------------------------------------

def sort_value(entry: dict) -> str:
    """Sträng som styr en posts gruppering OCH ordning inom gruppen.

    Normalt termen själv, men ett valfritt "sort"-fält kan överstyra det. Det
    används för poster vars uppslagsord inte börjar på en sorterbar bokstav,
    t.ex. grekiska glyf-termer (β-blockerare) som ska filas under sin latinska
    translitterering (beta-blockerare → B). Måste spegla sortValue() i
    js/glossary.js. Se [[project_glossary_grundmall]].
    """
    return entry.get("sort") or entry["term"]


def page_key(term: str) -> str:
    """Vilken sida en term hör till. Måste matcha pageKey() i js/glossary.js.

    Siffror → 'siffror'; A–Ö → versal bokstav; allt annat (poster som inleds
    med streck, dvs ändelser/suffix) → 'tecken'.
    """
    c = term[0]
    if c.isdigit():
        return "siffror"
    cu = c.upper()
    if cu in SWEDISH_ALPHABET:
        return cu
    return "tecken"


def page_slug(key: str) -> str:
    """Filnamns-slug för en grupp. Måste matcha pageSlug() i js/glossary.js."""
    if key in ("siffror", "tecken"):
        return key
    return _PAGE_SLUG.get(key, key.lower())


def page_file(key: str) -> str:
    return f"ordlista-{page_slug(key)}.html"


def slugify(term: str) -> str:
    """Stabilt ankar-id för en term. Identisk logik som i js/glossary.js.

    Suffix-poster (inleds med streck) får prefixet 'term-suffix-' så att deras
    slug inte kolliderar med likalydande grundord eller prefix.
    """
    is_suffix = term.startswith("-")
    s = "".join(_SLUG_MAP.get(c, c) for c in term.lower())
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return f"term-suffix-{s}" if is_suffix else f"term-{s}"


def escape_html(text: str) -> str:
    """Escapa & < > " — exakt samma teckenmängd som escapeHtml() i glossary.js.

    (Avsiktligt INTE apostrof, för byte-identisk markup mot JS-renderingen.)
    """
    return (
        text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


def format_def(text: str) -> str:
    """Escapa HTML och kursivera ordklassen i början. Matchar formatDef i JS."""
    escaped = escape_html(text)
    return re.sub(
        r"^(subst\.|adj\.|adv\.|verb|prefix|suffix|förk\.|pron\.|räkn\.|interj\.|konj\.|prep\.)(?![a-zåäö])",
        r"<em>\1</em>",
        escaped,
    )


# ---------------------------------------------------------------------------
# Etiketter & rubriker per grupp
# ---------------------------------------------------------------------------

def group_label(key: str) -> str:
    """Kort etikett för alfabetsraden (chip-text).

    'tecken'-facket innehåller bara suffix (poster som inleds med streck), så
    chippet märks "suffix" i stället för en generisk symbol.
    """
    if key == "siffror":
        return "0–9"
    if key == "tecken":
        return "suffix"
    return key


def group_heading(key: str) -> str:
    """H1/rubrik-fras för gruppens egen sida."""
    if key == "siffror":
        return "siffror"
    if key == "tecken":
        return "ändelser (suffix)"
    return key


# ---------------------------------------------------------------------------
# Byggblock (HTML)
# ---------------------------------------------------------------------------

def build_group_dl(entries: list[dict]) -> str:
    """Statisk <dl> för EN grupps poster (utan bokstavsrubrik — hela sidan är
    redan den bokstaven). Per-post-markupen hålls byte-identisk med tidigare
    rendering så att befintliga term-ankare (#term-...) fortsätter fungera.
    """
    lines = ['        <dl class="glossary-group">']
    for entry in entries:
        slug = entry.get("slug") or slugify(entry["term"])
        term = escape_html(entry["term"])
        definition = format_def(entry["def"])
        lines.append(
            f'          <div class="glossary-entry" id="{slug}">'
            f'<dt class="glossary-term">{term}</dt>'
            f'<dd class="glossary-def">{definition}</dd></div>'
        )
    lines.append("        </dl>")
    return "\n".join(lines)


def build_alphabet(present: set[str], current: str | None) -> str:
    """Alfabetsrad med tvärlänkar till varje grupps sida.

    Grupper med poster blir <a href="ordlista-x.html">; tomma blir nedtonade
    <span> (is-disabled). Den aktuella sidans chip markeras aria-current.
    glossary.js tonar dessutom ned bokstäver live efter sökträffar.
    Ordning: A–Ö, därefter chips för siffror (0–9) och ändelser (–).
    """
    order = SWEDISH_ALPHABET + ["siffror", "tecken"]
    lines: list[str] = []
    for key in order:
        label = escape_html(group_label(key))
        is_current = key == current
        aria = ' aria-current="page"' if is_current else ""
        if key in present:
            lines.append(
                f'        <a class="glossary-alpha" href="{page_file(key)}" '
                f'data-group="{key}" data-letter="{label}"{aria}>{label}</a>'
            )
        else:
            lines.append(
                f'        <span class="glossary-alpha is-disabled" '
                f'data-group="{key}" data-letter="{label}" '
                f'aria-disabled="true">{label}</span>'
            )
    return "\n".join(lines)


def pick_example(entries: list[dict]) -> str:
    """Välj ett representativt, läsbart exempelord för en grupps kort.

    Föredrar ett vanligt ord (inledande bokstav, gemener, inga streck/snedstreck/
    parenteser, rimlig längd) framför förkortningar och prefix/suffix. Faller
    tillbaka på första termen om inget snyggt ord finns (t.ex. ändelse-gruppen,
    där alla termer inleds med streck).
    """
    for e in entries:
        t = e["term"]
        if "-" in t or "/" in t or "(" in t:
            continue
        if not t[:1].isalpha() or t.isupper():
            continue
        if not (4 <= len(t) <= 16):
            continue
        if all(c.isalpha() or c == " " for c in t):
            return t
    return entries[0]["term"]


def build_landing_index(groups: dict[str, list[dict]]) -> str:
    """Innehåll på landningssidan: ett rutnät av bokstavskort med antal + exempel.

    Varje kort länkar till sin gruppsida och visar stor bokstav, antal ord och
    ett exempelord — tydlig ingång och riktigt (icke-tunt) innehåll. Antalen är
    dynamiska (i body — tillåtet; head håller 'tusentals' utan siffra).
    """
    order = [k for k in (SWEDISH_ALPHABET + ["siffror", "tecken"]) if k in groups]
    lines = ['        <ul class="glossary-index" aria-label="Bläddra efter bokstav">']
    for key in order:
        label = escape_html(group_label(key))
        wide = " is-wide" if key in ("siffror", "tecken") else ""
        count = len(groups[key])
        example = escape_html(pick_example(groups[key]))
        aria_what = (
            f"Medicinska {group_heading(key)}"
            if key in ("siffror", "tecken")
            else f"Medicinska ord på {key}"
        )
        lines.append(
            f'          <li><a class="glossary-index-card" href="{page_file(key)}" '
            f'aria-label="{aria_what}, {count} ord, t.ex. {example}">'
            f'<span class="gi-letter{wide}" aria-hidden="true">{label}</span>'
            f'<span class="gi-count">{count} ord</span>'
            f'<span class="gi-example">{example}</span></a></li>'
        )
    lines.append("        </ul>")
    return "\n".join(lines)


def jsonld(obj: dict) -> str:
    body = json.dumps(obj, ensure_ascii=False, indent=2)
    return f'  <script type="application/ld+json">\n{body}\n  </script>'


def breadcrumb_jsonld(current_name: str | None, current_url: str) -> dict:
    items = [
        {
            "@type": "ListItem",
            "position": 1,
            "name": "Anatomiquiz",
            "item": f"{SITE}/",
        },
        {
            "@type": "ListItem",
            "position": 2,
            "name": "Medicinsk ordlista",
            "item": f"{SITE}/{LANDING_FILE}",
        },
    ]
    if current_name:
        items.append(
            {
                "@type": "ListItem",
                "position": 3,
                "name": current_name,
                "item": current_url,
            }
        )
    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": items,
    }


# ---------------------------------------------------------------------------
# Sidmall
# ---------------------------------------------------------------------------

def render_page(
    *,
    filename: str,
    title: str,
    description: str,
    h1: str,
    tagline: str,
    breadcrumb_label: str,
    page_jsonld: dict,
    breadcrumb_obj: dict,
    alphabet_html: str,
    content_html: str,
    is_landing: bool,
) -> str:
    """Bygg en komplett HTML-sida från den gemensamma mallen."""
    url = f"{SITE}/{filename}"
    esc_title = html.escape(title, quote=True)
    esc_desc = html.escape(description, quote=True)
    social_desc = esc_desc
    img_alt = html.escape(f"{h1} — Anatomiquiz", quote=True)
    # data-page-key låter glossary.js veta vilken grupp sidan visar, så att
    # sökträffar på samma sida länkas med rent #ankare i stället för full URL.
    page_attr = "" if is_landing else f' data-page="{page_file_key(filename)}"'

    breadcrumb_nav = (
        '<span class="breadcrumb-current" aria-current="page">Medicinsk ordlista</span>'
        if is_landing
        else (
            f'<a href="{LANDING_FILE}" class="breadcrumb-link">Medicinsk ordlista</a>'
            '<span class="breadcrumb-sep" aria-hidden="true">/</span>'
            f'<span class="breadcrumb-current" aria-current="page">{html.escape(breadcrumb_label)}</span>'
        )
    )

    # Alfabetsraden (snabbnavigering mellan bokstäver) finns på ALLA sidor,
    # även index — där visas bokstaven A:s innehåll och raden tar dig vidare
    # till övriga bokstäver/sidor.
    alphabet_block = (
        "      <!-- Alfabetsrad — tvärlänkar till varje grupps sida.\n"
        "           AUTO-GENERERAD av scripts/generate_glossary.py; glossary.js tonar\n"
        "           ned grupper utan sökträffar live. -->\n"
        '      <nav class="glossary-alphabet" id="glossaryAlphabet" aria-label="Hoppa till bokstav">\n'
        f"{alphabet_html}\n"
        "      </nav>\n"
    )

    return f"""<!doctype html>
<html lang="sv">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <!-- CSP mot XSS (skript/stilar/data endast från egen origin). OBS: GitHub Pages tillåter inga egna HTTP-headers, därav meta-tagg. -->
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'">

  <title>{esc_title}</title>
  <meta name="description" content="{esc_desc}">
  <meta name="author" content="Norrtou Creations">
  <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large">

  <link rel="canonical" href="{url}">
  <link rel="sitemap" type="application/xml" href="/anatomiquiz/sitemap.xml">

  <meta property="og:type" content="website">
  <meta property="og:url" content="{url}">
  <meta property="og:title" content="{esc_title}">
  <meta property="og:description" content="{social_desc}">
  <meta property="og:image" content="{SITE}/img/og-image.png">
  <meta property="og:image:width" content="1518">
  <meta property="og:image:height" content="864">
  <meta property="og:image:alt" content="{img_alt}">
  <meta property="og:locale" content="sv_SE">
  <meta property="og:site_name" content="Anatomiquiz">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{esc_title}">
  <meta name="twitter:description" content="{social_desc}">
  <meta name="twitter:image" content="{SITE}/img/og-image.png">
  <meta name="twitter:image:alt" content="{img_alt}">

  <!-- Strukturerad data — AUTO-GENERERAD av scripts/generate_glossary.py, redigera ej för hand. -->
{jsonld(page_jsonld)}
{jsonld(breadcrumb_obj)}

  <meta name="theme-color" content="#10b981">
  <meta name="color-scheme" content="light">

  <link rel="icon" type="image/svg+xml" href="/anatomiquiz/img/favicon.svg">
  <link rel="icon" type="image/png" sizes="64x64" href="/anatomiquiz/img/favicon.png">
  <link rel="apple-touch-icon" href="/anatomiquiz/img/icon-192.png">
  <link rel="manifest" href="/anatomiquiz/manifest.json">
  <link rel="stylesheet" href="css/styles.css?v={STYLES_V}">
  <link rel="stylesheet" href="css/glossary.css?v={GLOSSARY_V}">
</head>
<body{page_attr}>
  <a class="skip-link" href="#main">Hoppa till innehåll</a>

  <main id="main" class="container glossary-page" role="main">

    <header class="header glossary-header">
      <div class="header-title">
        <h1>{html.escape(h1)}</h1>
      </div>
      <p class="tagline">{html.escape(tagline)}</p>
    </header>

    <section class="card glossary-card" aria-labelledby="glossaryHeading">

      <nav class="breadcrumb" aria-label="Brödsmula">
        <a href="./" class="breadcrumb-link">← Anatomiquiz</a>
        <span class="breadcrumb-sep" aria-hidden="true">/</span>
        {breadcrumb_nav}
      </nav>

      <h2 id="glossaryHeading" class="sr-only">Sök i ordlistan</h2>

      <div class="glossary-toolbar">
        <input
          id="glossarySearch"
          type="search"
          placeholder="Sök i hela ordlistan…"
          class="glossary-search"
          aria-label="Sök i hela ordlistan"
          aria-controls="searchResults"
          autocomplete="off"
          spellcheck="false"
        />
        <span id="termCount" class="term-count" aria-live="polite" aria-atomic="true"></span>
      </div>

{alphabet_block}
      <!-- Sökträffar (global sökning). Fylls av glossary.js; döljs när tom. -->
      <div id="searchResults" class="glossary-results" hidden aria-live="polite"></div>

      <!-- Statiskt innehåll: bläddring/förrendering (crawlbar utan JavaScript). -->
      <div id="glossaryContent" class="glossary-content">
{content_html}
      </div>
    </section>

    <footer class="glossary-footer">
      <p class="glossary-source">
        Termer baserade på
        <em>Terminologia Anatomica</em>,
        <em>Nomina Anatomica</em>
        och svensk medicinsk ordbok.
      </p>
      <a href="./" class="btn glossary-back-btn">← Tillbaka till quizet</a>
    </footer>

  </main>

  <script src="js/glossary.js?v={GLOSSARY_V}"></script>
</body>
</html>
"""


# data-page="..."-värdet är gruppnyckelns filnamns-slug; härleds ur filnamnet.
def page_file_key(filename: str) -> str:
    return filename.removeprefix("ordlista-").removesuffix(".html")


# ---------------------------------------------------------------------------
# Sidor
# ---------------------------------------------------------------------------

def write_landing(groups: dict[str, list[dict]]) -> str:
    url = f"{SITE}/{LANDING_FILE}"
    title = "Medicinsk ordlista — tusentals latinska och anatomiska termer | Anatomiquiz"
    desc = (
        "Sökbar medicinsk ordlista på svenska med tusentals latinska och anatomiska "
        "termer: definition, ordklass, synonymer, lekmannauttryck och etymologi."
    )
    page_obj = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": "Medicinsk ordlista",
        "description": (
            "Komplett medicinsk ordlista med latinska och anatomiska termer på "
            "svenska, uppdelad per bokstav."
        ),
        "inLanguage": "sv-SE",
        "url": url,
    }
    # Index visar bokstaven A:s innehåll (eller första gruppen om A saknas) —
    # som ordlistan såg ut förr, fast bara A laddas så sidan förblir lätt.
    # Övriga bokstäver nås via alfabetsraden (egna sidor) eller sökrutan.
    first_key = "A" if "A" in groups else next(
        k for k in (SWEDISH_ALPHABET + ["siffror", "tecken"]) if k in groups
    )
    page = render_page(
        filename=LANDING_FILE,
        title=title,
        description=desc,
        h1="Medicinsk ordlista",
        tagline=(
            "Medicinska ord, förkortningar och begrepp med definitioner, synonymer "
            "och etymologi i en sökbar ordlista. Sök i hela ordlistan ovan, eller "
            "hoppa till en bokstav i raden — tusentals latinska och medicinska "
            "anatomiska, fysiologiska, patologiska, biologiska och tekniska termer."
        ),
        breadcrumb_label="Medicinsk ordlista",
        page_jsonld=page_obj,
        breadcrumb_obj=breadcrumb_jsonld(None, url),
        alphabet_html=build_alphabet(set(groups), None),
        content_html=build_group_dl(groups[first_key]),
        is_landing=True,
    )
    (ROOT / LANDING_FILE).write_text(page, encoding="utf-8")
    return LANDING_FILE


def write_group(key: str, entries: list[dict], present: set[str]) -> str:
    filename = page_file(key)
    url = f"{SITE}/{filename}"
    heading = group_heading(key)
    if key in ("siffror", "tecken"):
        h1 = f"Medicinska {heading}"
        label = "Siffror" if key == "siffror" else "Ändelser"
    else:
        h1 = f"Medicinska ord på {key}"
        label = key
    title = f"{h1} — ordlista med definition och etymologi | Anatomiquiz"
    desc = (
        f"{h1}: latinska och anatomiska termer på svenska med definition, "
        "ordklass, synonymer, lekmannauttryck och etymologi."
    )
    page_obj = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": h1,
        "description": desc,
        "inLanguage": "sv-SE",
        "url": url,
        "isPartOf": {"@type": "CollectionPage", "url": f"{SITE}/{LANDING_FILE}"},
    }
    page = render_page(
        filename=filename,
        title=title,
        description=desc,
        h1=h1,
        tagline=(
            f"Alla termer i ordlistan som börjar på {label.lower() if key not in ('siffror','tecken') else heading}. "
            "Sök i hela ordlistan ovan, eller bläddra till en annan bokstav."
        ),
        breadcrumb_label=label,
        page_jsonld=page_obj,
        breadcrumb_obj=breadcrumb_jsonld(label, url),
        alphabet_html=build_alphabet(present, key),
        content_html=build_group_dl(entries),
        is_landing=False,
    )
    (ROOT / filename).write_text(page, encoding="utf-8")
    return filename


# ---------------------------------------------------------------------------
# Sitemap
# ---------------------------------------------------------------------------

def write_sitemap(group_files: list[str]) -> None:
    """Skriv om sitemap.xml: rot + ordliste-sidor + case/info.

    Ordliste-URL:erna är dynamiska (en per genererad sida); de statiska
    sidorna (rot, case, info) behålls som fasta poster.
    """
    today = datetime.date.today().isoformat()

    def url_block(loc: str, changefreq: str, priority: str) -> str:
        return (
            "  <url>\n"
            f"    <loc>{loc}</loc>\n"
            f"    <lastmod>{today}</lastmod>\n"
            f"    <changefreq>{changefreq}</changefreq>\n"
            f"    <priority>{priority}</priority>\n"
            "  </url>"
        )

    blocks = [url_block(f"{SITE}/", "weekly", "1.0")]
    blocks.append(url_block(f"{SITE}/{LANDING_FILE}", "weekly", "0.9"))
    for f in group_files:
        blocks.append(url_block(f"{SITE}/{f}", "monthly", "0.7"))
    blocks.append(url_block(f"{SITE}/case.html", "monthly", "0.7"))
    blocks.append(url_block(f"{SITE}/info.html", "monthly", "0.5"))

    body = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n\n'
        + "\n\n".join(blocks)
        + "\n\n</urlset>\n"
    )
    SITEMAP.write_text(body, encoding="utf-8")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    terms = json.loads(DATA.read_text(encoding="utf-8"))
    # Stubs (status == "stub") är ofärdiga poster — filtrera bort dem helt.
    terms = [e for e in terms if e.get("status") != "stub"]

    # Kontrollera unika term-slugs globalt — annars blir djuplänkar tvetydiga.
    slugs = [e.get("slug") or slugify(e["term"]) for e in terms]
    dupes = {s for s in slugs if slugs.count(s) > 1}
    if dupes:
        raise SystemExit(f"FEL: slug-kollisioner: {sorted(dupes)}")

    # Gruppera på sidnyckel; sortera varje grupp alfabetiskt på term.
    groups: dict[str, list[dict]] = {}
    for entry in terms:
        groups.setdefault(page_key(sort_value(entry)), []).append(entry)
    for key in groups:
        groups[key].sort(key=lambda e: sort_value(e).lower())

    present = set(groups)

    # Rensa bort föräldralösa ordliste-sidor (grupp som tömts sedan förra körningen).
    for old in ROOT.glob("ordlista-*.html"):
        key_slug = old.name.removeprefix("ordlista-").removesuffix(".html")
        if key_slug not in {page_slug(k) for k in present}:
            old.unlink()

    group_files: list[str] = []
    order = [k for k in (SWEDISH_ALPHABET + ["siffror", "tecken"]) if k in groups]
    for key in order:
        group_files.append(write_group(key, groups[key], present))

    write_landing(groups)
    write_sitemap(group_files)

    print(
        f"OK: {len(terms)} termer → {len(group_files)} gruppsidor "
        f"+ {LANDING_FILE} + sitemap.xml."
    )
    for key in order:
        print(f"  {page_file(key):26} {len(groups[key]):>4} termer")


if __name__ == "__main__":
    main()
