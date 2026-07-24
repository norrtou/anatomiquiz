#!/usr/bin/env python3
"""
generate_glossary.py — förrenderar den medicinska ordlistan för SEO och no-JS.

Källa: data/ordlista.json
Mål:   medicinskordlista.html (landningssida) + en sida per icke-tom grupp:
       ordlista-<a..z|aa|ae|oe>.html, ordlista-siffror.html, ordlista-prefix.html
       (förstavelser), ordlista-suffix.html (ändelser) samt sitemap.xml.

       ordlista-tecken.html är den GAMLA filnamns-sluggen för suffix-sidan
       (bytt namn 2026-07-12) och underhålls nu för hand som en ren
       klient-redirect till ordlista-suffix.html, för att inte tappa den sidans
       indexering. Se LEGACY_REDIRECT_FILES nedan.

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

JSON-LD: medvetet LÄTT. Bokstavssidorna är CollectionPage; landningssidan är en
DefinedTermSet på SET-nivå (namn + länkar till bokstavssidorna, INGA per-term-
URL:er) plus en FAQPage. Den tidigare DefinedTermSet:en med SAMTLIGA termers
URL:er stod för ~1,8 MB och gav minimal rich-result-nytta och återinförs INTE —
per-term-innehållet är ändå fullt crawlbart som semantisk <dl>.
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

SITE = "https://anatomiquiz.se"
LANDING_FILE = "medicinskordlista.html"


def artikel_sitemap_urls() -> list[str]:
    """Artikelsidornas URL:er ur data/artiklar.json.

    write_sitemap() nedan skriver om HELA sitemap.xml. Artiklarna hämtas
    därför härifrån istället för att hårdkodas – annars tappas de tyst vid
    nästa körning av det här skriptet. Registret är sanningen
    (ARTIKLAR_REGLER.md §1.6).
    """
    import sys
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    import generate_artiklar as ga
    return ga.sitemap_urls(ga.load())

# Cachebusters per asset — bumpa bara den som faktiskt ändrats.
STYLES_V = "0.9.242"       # css/styles.css (synkad med övriga sidor 2026-07-23)
GLOSSARY_V = "0.9.189"      # css/glossary.css + js/glossary.js (denna release)

# Svenska alfabetet — fast ordning för alfabetsraden. Bokstäver utan poster
# renderas nedtonade (icke-klickbara), så raden ser likadan ut oavsett innehåll.
SWEDISH_ALPHABET = list("ABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖ")

# Specialgrupper (egna sidor som inte är en begynnelsebokstav), i den ordning de
# visas EFTER A–Ö i alfabetsraden och på landningssidan: siffror först, sedan
# förstavelser (prefix) och ändelser (suffix).
SPECIAL_ORDER = ["siffror", "prefix", "suffix"]
SPECIAL = set(SPECIAL_ORDER)
GROUP_ORDER = SWEDISH_ALPHABET + SPECIAL_ORDER

# Gamla filnamn som ska finnas kvar som permanenta klient-redirects till en
# nyare slug, i stället för att raderas av föräldralös-städningen i main().
# Underhålls för hand (INTE av render_page/write_group) — se toppdocstring.
LEGACY_REDIRECT_FILES = {"ordlista-tecken.html"}

# Diakriter → ASCII för term-slugs (måste matcha slugifyBase i js/glossary.js)
#
# Allt som INTE står här faller igenom till [^a-z0-9]+ och blir ett bindestreck,
# vilket ger stympade ankare: Râle → term-r-le, Behçets sjukdom →
# term-beh-ets-sjukdom. Kartan täcker därför hela Latin-1-området plus de
# ligaturer och specialtecken som förekommer i medicinsk och eponym latin,
# franska och tyska – inte bara de sex tecken svenskan råkade behöva först.
# Grekiska bokstäver hanteras INTE här: de translittereras per post via
# fältet "slug" i data/ordlista.json (α → alfa, χ → chi), eftersom deras
# namn inte går att härleda mekaniskt.
_SLUG_MAP = {
    # Svenska
    "å": "a", "ä": "a", "ö": "o",
    # Accenter (franska, spanska, italienska, portugisiska)
    "à": "a", "á": "a", "â": "a", "ã": "a",
    "è": "e", "é": "e", "ê": "e", "ë": "e",
    "ì": "i", "í": "i", "î": "i", "ï": "i",
    "ò": "o", "ó": "o", "ô": "o", "õ": "o",
    "ù": "u", "ú": "u", "û": "u", "ü": "u",
    "ý": "y", "ÿ": "y", "ñ": "n", "ç": "c",
    # Ligaturer och nordiska/centraleuropeiska tecken
    "œ": "oe", "æ": "ae", "ø": "o", "ß": "ss",
    "đ": "d", "ð": "d", "þ": "th", "ł": "l", "š": "s", "ž": "z", "č": "c",
}

# Distinkta filnamns-slugs för bokstäver vars term-slug annars kolliderar
# (Å/Ä→a krockar med A; Ö→o krockar med O). Måste matcha pageSlug() i JS.
_PAGE_SLUG = {"Å": "aa", "Ä": "ae", "Ö": "oe"}

# Unik <meta name="description"> per grupp-sida. Var och en är skriven för sin
# bokstav (egen formulering, en fråga och äkta exempeltermer som verkligen finns
# på sidan) för bättre SEO/CTR. HÅRD GRÄNS 157 tecken (kontrolleras i main()).
# Landningssidan har sin egen i LANDING_DESC. Tomma grupper utan rad faller
# tillbaka på en generisk text i group_description().
GROUP_DESCRIPTIONS = {
    "A": "Vad betyder abdomen, anemi och atrofi? På A-sidan hittar du anatomiska och latinska termer med definition, uttal och etymologi.",
    "B": "Bursit, bråck, bakteriemi – stöter du på medicinska ord på B? Här får du betydelsen på svenska, med ordklass, synonymer och ordhistoria.",
    "C": "Vad är caecum, carcinoma eller cor? Bläddra bland latinska och anatomiska termer på C med tydlig definition, lekmannaord och ordhistoria.",
    "D": "Diafragma, dyspné, dysenteri – vill du veta vad de betyder? Medicinska begrepp på D förklaras här på svenska, med synonymer och ursprung.",
    "E": "Vad döljer sig bakom eksem, emboli och endokardit? Utforska anatomiska och latinska ord på E med definition, uttal och språkligt ursprung.",
    "F": "Letar du efter betydelsen av facies, fraktur eller fagocytos? Medicinska termer på F förklaras enkelt – med ordklass och etymologi.",
    "G": "Ganglion, gangrän, gikt – vad står orden för? Sök bland anatomiska och latinska termer på G med betydelse, synonymer och ordhistoria.",
    "H": "Nyfiken på hematom, hallux eller habitus? Här samlas medicinska och anatomiska termer på H med förklaring, uttal och etymologi.",
    "I": "Vad är ikterus, infarkt eller idiopatisk? Ta reda på betydelsen av latinska ord på I – med definition, lekmannaord och ordursprung.",
    "J": "Jejunum, jugularis, jonisering – vad betyder de? Få medicinska och anatomiska termer på J förklarade på svenska, med ordhistoria.",
    "K": "Kakexi, karies, kateter – behöver du förklaringen? Medicinska begrepp på K reds ut med ordklass, synonymer och språkligt ursprung.",
    "L": "Vad innebär labialis, labyrintit eller leukemi? Bläddra bland anatomiska och latinska termer på L med förklaring, uttal och etymologi.",
    "M": "Vill du veta vad macula, malign eller meningit betyder? Medicinska ord på M reds ut med ordklass, synonymer och ordhistoria.",
    "N": "Nekros, nefrit, neuralgi – vad innebär orden? Slå upp anatomiska och latinska termer på N med definition, lekmannaord och etymologi.",
    "O": "Vad står obesitas, ocklusion och oblongatus för? Anatomiska och medicinska ord på O med tydlig betydelse, synonymer och ordursprung.",
    "P": "Vad döljer sig bakom palliativ, pares och pneumoni? Här reds latinska medicinska termer på P ut – med förklaring, uttal och etymologi.",
    "Q": "Quadriceps, quadratus – vad betyder Q-orden? Få medicinska och anatomiska termer på Q förklarade på svenska, med ordklass och ursprung.",
    "R": "Letar du efter betydelsen av rabies, radius eller reflux? Slå upp medicinska ord på R med synonymer, lekmannaord och ordhistoria.",
    "S": "Vad är sacrum, sepsis eller syfilis? Utforska anatomiska och latinska termer på S med tydlig definition, uttal och språkligt ursprung.",
    "T": "Tibia, trombos, tuberkulos – vad betyder de? Medicinska begrepp på T förklaras enkelt, med ordklass, synonymer och etymologi.",
    "U": "Undrar du vad ulceration, uremi eller urtikaria betyder? Bläddra bland medicinska ord på U med definition, lekmannaord och ordhistoria.",
    "V": "Vill du veta vad vagina, ventrikel eller vaskulit betyder? Anatomiska och latinska termer på V med förklaring, uttal och etymologi.",
    "W": "Warfarin, whiplash – vad står W-orden för? Få medicinska termer på W förklarade på svenska, med definition, ordklass och etymologi.",
    "X": "Vad är xantom, xerostomi eller xerodermi? Slå upp ovanliga medicinska ord på X med tydlig definition, uttal och språkligt ursprung.",
    "Y": "Vad betyder yttre vändning? Få medicinska och anatomiska termer på Y förklarade på svenska, med ordklass, synonym och etymologi.",
    "Z": "Nyfiken på zoonos, zygoma eller zona? Medicinska och anatomiska ord på Z reds ut med definition, uttal och språkligt ursprung.",
    "Å": "Åderbråck, åderförkalkning, åderlåtning – vad betyder de? Medicinska ord på Å med förklaring, synonymer, lekmannaord och etymologi.",
    "Ä": "Undrar du vad ärrbråck, ärrvävnad eller ätstörning betyder? Medicinska och anatomiska termer på Ä med definition, uttal och ordhistoria.",
    "Ö": "Vad är ödem, östrogen eller ödematös? Slå upp medicinska och anatomiska ord på Ö med tydlig definition, synonymer och språkligt ursprung.",
    "siffror": "Vad betyder 5-ASA eller 5-FU? Slå upp medicinska termer och förkortningar som inleds med en siffra – med definition och förklaring på svenska.",
    "prefix": "Vad betyder förstavelser som a-, hyper-, endo- och hemi-? Latinska och grekiska prefix i medicinska och anatomiska termer – med betydelse och exempel.",
    "suffix": "Vad betyder ändelser som -it, -emi, -ektomi och -patia? Latinska och grekiska suffix i medicinska och anatomiska termer – med betydelse och exempel.",
}

# Unik <title> per grupp-sida. ALLA delade tidigare exakt samma mall (bara
# bokstaven skilde), vilket Bing flaggar som "för lika titlar". Var och en är nu
# egenformulerad — varierad inledning, ordval och avslutning — men identifierar
# alltid bokstaven + att det är en medicinsk ordlista + varumärket. Nya bokstäver
# utan rad faller tillbaka på fallbacken i write_group(). Gräns: TITLE_MAX.
GROUP_TITLES = {
    "A": "Medicinska ord på A – förklaring och etymologi | Anatomiquiz",
    "B": "Medicinska B-ord: betydelse och ursprung | Anatomiquiz",
    "C": "Ordlista – medicinska ord på C med etymologi | Anatomiquiz",
    "D": "Medicinska termer på D förklarade på svenska | Anatomiquiz",
    "E": "E – latinska och anatomiska ord med förklaring | Anatomiquiz",
    "F": "Medicinska F-ord: definition och ursprung | Anatomiquiz",
    "G": "Medicinska G-ord i ordlistan | Anatomiquiz",
    "H": "H-ord i medicinska ordlistan med etymologi | Anatomiquiz",
    "I": "Slå upp medicinska ord på I | Anatomiquiz",
    "J": "J – medicinska termer med etymologi | Anatomiquiz",
    "K": "Medicinska K-ord: betydelse och bakgrund | Anatomiquiz",
    "L": "Ordlista – medicinska ord på L | Anatomiquiz",
    "M": "Medicinska M-ord på svenska | Anatomiquiz",
    "N": "Medicinska ord på N – definition och ursprung | Anatomiquiz",
    "O": "O i den medicinska ordlistan | Anatomiquiz",
    "P": "Medicinska P-ord: betydelse och etymologi | Anatomiquiz",
    "Q": "Medicinska ord på Q – ovanliga termer | Anatomiquiz",
    "R": "Slå upp medicinska R-ord med förklaring | Anatomiquiz",
    "S": "Utforska medicinska ord på S | Anatomiquiz",
    "T": "Medicinska termer på T förklarade | Anatomiquiz",
    "U": "U – medicinska ord med etymologi | Anatomiquiz",
    "V": "Medicinska V-ord förklarade på svenska | Anatomiquiz",
    "W": "Medicinska ord på W med etymologi | Anatomiquiz",
    "X": "Ovanliga medicinska X-ord med förklaring | Anatomiquiz",
    "Y": "Medicinska ord på Y | Anatomiquiz",
    "Z": "Medicinska Z-ord: betydelse och ursprung | Anatomiquiz",
    "Å": "Medicinska ord på Å i ordlistan | Anatomiquiz",
    "Ä": "Ä – medicinska termer med förklaring | Anatomiquiz",
    "Ö": "Medicinska Ö-ord förklarade | Anatomiquiz",
    "siffror": "Medicinska termer som börjar med siffra | Anatomiquiz",
    "prefix": "Medicinska förstavelser och prefix förklarade | Anatomiquiz",
    "suffix": "Medicinska ändelser och suffix förklarade | Anatomiquiz",
}

LANDING_DESC = (
    "Sökbar medicinsk ordlista på svenska: tusentals latinska och anatomiska "
    "termer med definition, ordklass, synonymer, lekmannauttryck och etymologi."
)

# Hård gräns för meta-description (Google klipper ~155–160 tecken).
DESC_MAX = 157

# Hård gräns för <title>. Bing visar/klipper ~60 tecken och flaggar längre titlar
# som "title too long", så ALLA sidor (även landningssidan) hålls inom 60. Gäller
# raw-strängen (inte HTML-escapad). Kontrolleras i main().
TITLE_MAX = 60


def group_description(key: str, h1: str) -> str:
    """Unik meta-description för en grupp; generisk fallback för nya bokstäver."""
    return GROUP_DESCRIPTIONS.get(
        key,
        f"{h1}: latinska och anatomiska termer på svenska med definition, "
        "ordklass, synonymer, lekmannauttryck och etymologi.",
    )


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


def is_suffix(entry: dict) -> bool:
    """Är posten ett suffix (ändelse)? Måste matcha isSuffixEntry() i JS.

    Suffix-poster inleds med streck (t.ex. -itis); de berikade affix-posterna
    bär dessutom ordklassen 'suffix '/'Efterled' först i definitionen.
    """
    return entry["term"].startswith("-") or entry["def"].startswith(
        ("suffix ", "Efterled")
    )


def is_prefix(entry: dict) -> bool:
    """Är posten ett prefix (förstavelse)? Måste matcha isPrefixEntry() i JS.

    Prefix-poster känns igen på ordklassen 'prefix '/'Förled' först i
    definitionen (t.ex. a-, hyper-, cefalo-, giga). Streck-inledda poster är
    suffix och räknas aldrig som prefix.
    """
    return not entry["term"].startswith("-") and entry["def"].startswith(
        ("prefix ", "Förled")
    )


def page_key(entry: dict) -> str:
    """Vilken sida en post hör till. Måste matcha pageKey() i js/glossary.js.

    Suffix → 'suffix'; prefix → 'prefix'; siffror → 'siffror'; A–Ö → versal
    bokstav. Affix avgörs av ordklassen (def) så att prefix samlas på en egen
    sida i stället för att spridas ut bland bokstavssidorna.
    """
    if is_suffix(entry):
        return "suffix"
    if is_prefix(entry):
        return "prefix"
    c = sort_value(entry)[0]
    if c.isdigit():
        return "siffror"
    cu = c.upper()
    if cu in SWEDISH_ALPHABET:
        return cu
    return "suffix"


def page_slug(key: str) -> str:
    """Filnamns-slug för en grupp. Måste matcha pageSlug() i js/glossary.js."""
    if key in SPECIAL:
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
    """Kort etikett för alfabetsraden (chip-text)."""
    if key == "siffror":
        return "0–9"
    if key == "prefix":
        return "prefix"
    if key == "suffix":
        return "suffix"
    return key


def group_heading(key: str) -> str:
    """H1/rubrik-fras för gruppens egen sida."""
    if key == "siffror":
        return "siffror"
    if key == "prefix":
        return "förstavelser (prefix)"
    if key == "suffix":
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
    Ordning: A–Ö, därefter chips för siffror (0–9), prefix och suffix.
    """
    order = GROUP_ORDER
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
    order = [k for k in GROUP_ORDER if k in groups]
    lines = ['        <ul class="glossary-index" aria-label="Bläddra efter bokstav">']
    for key in order:
        label = escape_html(group_label(key))
        wide = " is-wide" if key in SPECIAL else ""
        count = len(groups[key])
        example = escape_html(pick_example(groups[key]))
        aria_what = (
            f"Medicinska {group_heading(key)}"
            if key in SPECIAL
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


# ---------------------------------------------------------------------------
# Landningssidans beskrivande innehåll — om-text, FAQ och referenser.
# Detta ger sidan egen, unik brödtext (EEAT + Bing gynnar substantiell text) i
# stället för den A-lista som förr dubblerade ordlista-a.html. A-posterna finns
# oförändrade kvar på ordlista-a.html; här visas bara set-nivå: rutnät + prosa.
# ---------------------------------------------------------------------------

_TAG_RE = re.compile(r"<[^>]+>")


def strip_tags(markup: str) -> str:
    """Ren text ur enkel inline-HTML (endast <a>/<em> förekommer). Används för
    FAQ-schemats text så att den ALLTID matchar den synliga texten (en källa,
    kan aldrig divergera)."""
    return html.unescape(_TAG_RE.sub("", markup)).strip()


# FAQ: EN källa för både synlig text och FAQPage-schemat. Svaren får innehålla
# <a>/<em>; schematexten härleds via strip_tags(). Frågorna är valda efter äkta
# sökintention kring "medicinsk ordlista/termer", inte fyllnad.
LANDING_FAQ: list[dict[str, str]] = [
    {
        "q": "Vad är en medicinsk ordlista och vad har jag för nytta av den?",
        "a": (
            "En medicinsk ordlista översätter och förklarar vårdens fackspråk – de "
            "latinska, grekiska och kliniska ord, förkortningar och begrepp du möter "
            "i studier och arbete. Den här ordlistan spänner över anatomi, fysiologi, "
            "sjukdomar och skador, labbprover, farmakologi och omvårdnad, och är lika "
            "användbar för vårdstudenten som slår upp en tentaterm som för patienten "
            "som vill förstå ett ord i sitt journalutdrag."
        ),
    },
    {
        "q": "Varför är medicinska termer på latin och grekiska?",
        "a": (
            "Latinet och grekiskan blev vetenskapens gemensamma språk – latinet via "
            "antikens Rom och medeltidens lärda, grekiskan via den antika läkekonsten "
            "– och de ger ett entydigt fackspråk där en term betyder samma sak oavsett "
            "modersmål. Grovt sett kommer anatomins namn oftast från "
            "<a href=\"/kunskapsbank/medicinskt-latin.html\">latinet</a> "
            "(<em>musculus</em>, <em>vena</em>), medan ord för sjukdom och funktion "
            "oftast är <a href=\"/kunskapsbank/grekiska-i-medicinen.html\">grekiska</a> "
            "(<em>-it</em> för inflammation, <em>-emi</em> för blod). Hur det blev så "
            "berättar vi i <a href=\"/kunskapsbank/terminologins-historia.html\">"
            "terminologins historia</a>."
        ),
    },
    {
        "q": "Hur är ett medicinskt ord uppbyggt?",
        "a": (
            "Nästan alla medicinska ord kan delas i förled (prefix), ordstam och "
            "efterled (suffix). <em>Endokardit</em> blir <em>endo-</em> ’inuti’ + "
            "<em>card</em> ’hjärta’ + <em>-it</em> ’inflammation’ = inflammation i "
            "hjärtats innersida. Kan du de vanligaste "
            "<a href=\"/ordlista-prefix.html\">förstavelserna</a> och "
            "<a href=\"/ordlista-suffix.html\">ändelserna</a> kan du tyda ord du "
            "aldrig sett. Ändelserna växlar dessutom med kasus och antal – varför det "
            "heter en <em>musculus</em> men flera <em>musculi</em> reder vi ut i "
            "<a href=\"/kunskapsbank/deklinationer-pluralformer.html\">deklinationer "
            "&amp; pluralformer</a>."
        ),
    },
    {
        "q": "Hur hittar jag ett visst ord i ordlistan?",
        "a": (
            "Snabbast är sökrutan högst upp: den söker igenom hela ordlistan på en "
            "gång och tar dig rakt till posten – och hittar även ord som bara nämns "
            "inuti en förklaring. Vill du hellre bläddra har varje begynnelsebokstav "
            "en egen sida (A–Ö), plus särskilda sidor för siffror, förstavelser och "
            "ändelser."
        ),
    },
    {
        "q": "Vad innehåller varje post, och hur uttalas orden?",
        "a": (
            "Varje uppslagsord ger betydelsen och, där det är relevant, ordklass, "
            "böjningsform, svensk motsvarighet, vardaglig synonym, engelsk förkortning "
            "och etymologi. Sjukdomar får ofta sin ICD-10-kod och labbprover sina "
            "normala referensvärden. Osäker på hur ett latinskt ord ska sägas – varför "
            "<em>c</em> i <em>cochlea</em> blir k men mjukt i <em>cerebrum</em>? Det "
            "reder <a href=\"/kunskapsbank/uttalsregler.html\">uttalsreglerna</a> ut."
        ),
    },
    {
        "q": "Är ordlistan gratis, och vem står bakom den?",
        "a": (
            "Ja, ordlistan är helt gratis. Den är sammanställd och kvalitetsgranskad "
            "av Anatomiquiz mot vedertagna standardverk inom anatomi och medicinsk "
            "terminologi. Mer om källorna och personen bakom sidan finns under "
            "<a href=\"/info.html\">Om Anatomiquiz</a>."
        ),
    },
]

# Referenser i APA 7-format (stående regel: varje kunskapsbanksdokument har en
# synlig referenslista). Speglar verken som anges i sidfoten.
LANDING_REFERENCES: list[str] = [
    "Federative International Programme for Anatomical Terminology. (2019). "
    "<em>Terminologia anatomica</em> (2:a uppl.). FIPAT.",
    "Lindskog, B. I. (2008). <em>Medicinsk terminologi</em> (5:e uppl.). Nya Doxa.",
    "Standring, S. (Red.). (2020). <em>Gray’s anatomy: The anatomical basis of "
    "clinical practice</em> (42:a uppl.). Elsevier.",
    "Paulsen, F., & Waschke, J. (2018). <em>Sobotta atlas of human anatomy</em> "
    "(16:e uppl.). Elsevier.",
    "Socialstyrelsen. (2023). <em>Internationell statistisk klassifikation av "
    "sjukdomar och relaterade hälsoproblem – systematisk förteckning "
    "(ICD-10-SE)</em>. Socialstyrelsen.",
    "Svenska Akademien. (2009). <em>Svenska Akademiens ordbok</em> (SAOB). "
    "Hämtad från https://www.saob.se",
]


def build_faq_html(faq: list[dict[str, str]]) -> str:
    """Synlig FAQ: <h3>-fråga + <p>-svar, öppet (ej hopfällt) så skärmläsare och
    crawlers får hela texten direkt."""
    lines = [
        '        <section class="info-about glossary-about glossary-faq" id="faq">',
        "          <h2>Frågor och svar om medicinska termer</h2>",
    ]
    for item in faq:
        lines.append(f"          <h3>{escape_html(item['q'])}</h3>")
        lines.append(f"          <p>{item['a']}</p>")
    lines.append("        </section>")
    return "\n".join(lines)


def faq_jsonld(faq: list[dict[str, str]]) -> dict:
    """FAQPage-schema. Svarstexten härleds ur den synliga HTML:en (strip_tags),
    så schema och sida aldrig kan skilja sig åt."""
    return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": item["q"],
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": strip_tags(item["a"]),
                },
            }
            for item in faq
        ],
    }


def build_landing_about() -> str:
    """Beskrivande om-text (unik brödtext för SEO/EEAT)."""
    return (
        '        <section class="info-about glossary-about">\n'
        "          <h2>Om den medicinska ordlistan</h2>\n"
        "          <p>Anatomiquiz medicinska ordlista är ett svenskt uppslagsverk "
        "för medicinska och anatomiska termer. Här förklaras latinska och grekiska "
        "ord, förkortningar, för- och efterled samt kliniska begrepp inom anatomi, "
        "fysiologi, sjukdomar och skador, labbprover, farmakologi och omvårdnad. "
        "Varje post ger en tydlig definition på svenska och, där det hjälper, "
        "ordklass, böjning, synonymer, vardagsuttryck och ordets etymologi.</p>\n"
        "          <p>Ordlistan är uppdelad i en sida per begynnelsebokstav (A–Ö) "
        "plus egna sidor för siffror, förstavelser och ändelser, så att varje sida "
        "laddar snabbt. Använd sökrutan för att slå upp ett enskilt ord, eller "
        "bläddra via bokstavskorten ovan. Termer, stavning och koder följer "
        "vedertagna standardverk och Socialstyrelsens klassifikationer – se "
        "referenserna längst ner.</p>\n"
        "        </section>"
    )


def build_landing_references(refs: list[str]) -> str:
    lines = [
        '        <section class="info-about glossary-about">',
        "          <h2>Referenser</h2>",
        "          <ul>",
    ]
    for ref in refs:
        lines.append(f"            <li>{ref}</li>")
    lines.append("          </ul>")
    lines.append("        </section>")
    return "\n".join(lines)


def build_landing_content(
    groups: dict[str, list[dict]], faq: list[dict[str, str]]
) -> str:
    """Hela landningssidans statiska innehåll (inuti #glossaryContent):
    bokstavsrutnät + om-text + FAQ + referenser."""
    return "\n".join(
        [
            '        <h2 class="glossary-browse-title">Bläddra efter bokstav</h2>',
            build_landing_index(groups),
            build_landing_about(),
            build_faq_html(faq),
            build_landing_references(LANDING_REFERENCES),
        ]
    )


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
    extra_jsonld: list[dict] | None = None,
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

    # Extra JSON-LD (t.ex. FAQPage på landningssidan) läggs efter brödsmulan.
    extra_jsonld_html = (
        "\n" + "\n".join(jsonld(obj) for obj in extra_jsonld) if extra_jsonld else ""
    )

    # Landningssidan bär rutnät + info-rutor (inte en <dl>) i #glossaryContent →
    # ta bort listramen så info-rutorna inte dubbelinramas. Gruppsidor behåller.
    content_class = (
        "glossary-content glossary-content--plain"
        if is_landing
        else "glossary-content"
    )

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
  <link rel="sitemap" type="application/xml" href="/sitemap.xml">

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
{jsonld(breadcrumb_obj)}{extra_jsonld_html}

  <meta name="theme-color" content="#10b981">
  <meta name="color-scheme" content="light">

  <link rel="icon" type="image/svg+xml" href="/img/favicon.svg">
  <link rel="icon" type="image/png" sizes="64x64" href="/img/favicon.png">
  <link rel="apple-touch-icon" href="/img/icon-192.png">
  <link rel="manifest" href="/manifest.json">
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
      <div id="glossaryContent" class="{content_class}">
{content_html}
      </div>
    </section>

    <footer class="glossary-footer">
      <p class="glossary-source">
        Termer, definitioner och stavning följer vedertagna standardverk inom
        anatomi och medicinsk terminologi:
        <em>Terminologia Anatomica</em> (FIPAT/IFAA),
        <em>Nomina Anatomica</em>,
        <em>Gray&rsquo;s Anatomy</em>,
        <em>Sobotta &ndash; Atlas of Human Anatomy</em>,
        <em>Svenska Akademiens ordbok</em> (SAOB)
        samt etablerade svenska medicinska uppslagsverk och ordböcker.
        Diagnoser, koder och läkemedelsuppgifter har även stämts av mot
        Socialstyrelsens klassifikationer (ICD-10-SE) och FASS.
      </p>
      <p class="glossary-source">
        Rapportera in eventuella fel till
        <a href="mailto:anatomiquizse@gmail.com">mig</a>.
      </p>
      <a href="medicinskordlista.html" class="btn glossary-back-btn">← Tillbaka till ordlistan</a>
      <a href="/kunskapsbank/medicinsk-terminologi.html" class="btn glossary-back-btn">Förstå termerna: Medicinsk terminologi →</a>
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
    title = "Medicinsk ordlista – tusentals termer | Anatomiquiz"
    desc = LANDING_DESC
    # Faktiskt antal live-termer, med hårt mellanslag som tusentalsavgränsare
    # (t.ex. 9 020). Används i den synliga ingressen (body) — head håller kvar
    # "tusentals" utan siffra (SEO).
    total = sum(len(v) for v in groups.values())
    total_str = f"{total:,}".replace(",", " ")
    # Landningssidan är en DefinedTermSet på SET-nivå: den korrekta semantiska
    # typen för en ordlista, men LÄTT — hasPart pekar bara på bokstavssidorna
    # (~35 URL:er), aldrig på varje term (det gav förr ~1,8 MB, se docstring).
    order = [k for k in GROUP_ORDER if k in groups]
    page_obj = {
        "@context": "https://schema.org",
        "@type": "DefinedTermSet",
        "name": "Medicinsk ordlista",
        "description": (
            "Sökbar medicinsk ordlista på svenska med latinska och anatomiska "
            "termer, förkortningar samt för- och efterled – uppdelad per bokstav."
        ),
        "inLanguage": "sv-SE",
        "url": url,
        "hasPart": [
            {"@type": "CreativeWork", "url": f"{SITE}/{page_file(k)}"} for k in order
        ],
    }
    page = render_page(
        filename=LANDING_FILE,
        title=title,
        description=desc,
        h1="Medicinsk ordlista",
        tagline=(
            "Medicinska ord, förkortningar och begrepp med definitioner, synonymer "
            f"och etymologi i en sökbar ordlista med {total_str} ord. Ta reda på "
            "vad olika begrepp, förkortningar, för- och efterled betyder inom "
            "anatomi, fysiologi, sjukdomar, labbprover, farmakologi och omvårdnad."
        ),
        breadcrumb_label="Medicinsk ordlista",
        page_jsonld=page_obj,
        breadcrumb_obj=breadcrumb_jsonld(None, url),
        alphabet_html=build_alphabet(set(groups), None),
        content_html=build_landing_content(groups, LANDING_FAQ),
        is_landing=True,
        extra_jsonld=[faq_jsonld(LANDING_FAQ)],
    )
    (ROOT / LANDING_FILE).write_text(page, encoding="utf-8")
    return LANDING_FILE


# Synliga ingresser (taglines) för specialsidorna. Prefix- och suffix-sidorna
# nämner uttryckligen att affixen är BÅDE latinska OCH grekiska, för medicinska
# och anatomiska termer (inte enbart latinska).
SPECIAL_TAGLINES = {
    "siffror": (
        "Alla medicinska termer och förkortningar i ordlistan som inleds med en "
        "siffra. Sök i hela ordlistan nedan, eller bläddra till en bokstav."
    ),
    "prefix": (
        "Medicinska och anatomiska förstavelser (prefix) ur latinet och grekiskan "
        "– som a-, hyper- och endo- – med betydelse, ursprung och exempel. "
        "Sök i hela ordlistan nedan, eller bläddra vidare."
    ),
    "suffix": (
        "Medicinska och anatomiska ändelser (suffix) ur latinet och grekiskan – "
        "som -it, -emi och -ektomi – med betydelse, ursprung och exempel. "
        "Sök i hela ordlistan nedan, eller bläddra vidare."
    ),
}

SPECIAL_LABELS = {"siffror": "Siffror", "prefix": "Förstavelser", "suffix": "Ändelser"}


def write_group(key: str, entries: list[dict], present: set[str]) -> str:
    filename = page_file(key)
    url = f"{SITE}/{filename}"
    heading = group_heading(key)
    if key in SPECIAL:
        h1 = f"Medicinska {heading}"
        label = SPECIAL_LABELS[key]
    else:
        h1 = f"Medicinska ord på {key}"
        label = key
    title = GROUP_TITLES.get(
        key, f"{h1} — ordlista med definition och etymologi | Anatomiquiz"
    )
    desc = group_description(key, h1)
    page_obj = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": h1,
        "description": desc,
        "inLanguage": "sv-SE",
        "url": url,
        "isPartOf": {"@type": "DefinedTermSet", "url": f"{SITE}/{LANDING_FILE}"},
    }
    page = render_page(
        filename=filename,
        title=title,
        description=desc,
        h1=h1,
        tagline=SPECIAL_TAGLINES.get(
            key,
            f"Alla termer i ordlistan som börjar på {label.lower()}. "
            "Sök i hela ordlistan nedan, eller bläddra till en annan bokstav.",
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

    # Kunskapsbanken (hub + indexerbara undersidor). Denna funktion skriver om
    # HELA sitemap.xml, så ALLA indexerbara sidor måste listas här – annars
    # tappas de vid nästa generering. Håll synkad med faktiska sidor.
    # Terminologipelaren själv. Pelarens UNDERSIDOR står inte här: i takt med
    # att de registreras i data/artiklar.json kommer de in via
    # artikel_sitemap_urls() nedan, och två källor för samma URL ger en
    # dubblerad <url>-post i sitemap.xml (ARTIKLAR_REGLER.md §1.6).
    kb_pages = [
        "medicinsk-terminologi",
    ]

    blocks = [url_block(f"{SITE}/", "weekly", "1.0")]
    blocks.append(url_block(f"{SITE}/kunskapsbank/", "weekly", "0.8"))
    for f in kb_pages:
        blocks.append(url_block(f"{SITE}/kunskapsbank/{f}.html", "monthly", "0.7"))
    # Listor & tabeller-pillaren + faktatexter-pillaren + fristående tabeller
    # (utanför muskel-serien). Båda pillarna är index,follow sedan 0.9.41.
    blocks.append(url_block(f"{SITE}/kunskapsbank/listor-tabeller.html", "weekly", "0.7"))
    blocks.append(url_block(f"{SITE}/kunskapsbank/faktatexter.html", "weekly", "0.7"))
    # Artikelsidorna (ämneshubbar + artiklar) kommer ur data/artiklar.json och
    # räknas INTE upp här. Skulle de hårdkodas skulle varje ny artikel behöva
    # läggas in på två ställen – och glömdes den här försvann den ur sitemap
    # vid nästa ordlistegenerering. Se ARTIKLAR_REGLER.md §1.6.
    for u in artikel_sitemap_urls():
        blocks.append(url_block(f"{SITE}{u}", "monthly", "0.7"))
    blocks.append(url_block(f"{SITE}/kunskapsbank/lakemedelsberakning-omvandlingar.html", "monthly", "0.7"))
    # Verktygsavdelningen. Hubben ligger på katalog-URL:en (index.html serveras
    # av GitHub Pages) så att den kan växa utan att någon länk måste ändras.
    blocks.append(url_block(f"{SITE}/verktyg/", "monthly", "0.7"))
    blocks.append(url_block(f"{SITE}/verktyg/lakemedelsberakning.html", "monthly", "0.7"))
    # Nervtabeller (under-pillar + nervsidor)
    blocks.append(url_block(f"{SITE}/kunskapsbank/nervtabeller.html", "weekly", "0.7"))
    blocks.append(url_block(f"{SITE}/kunskapsbank/kranialnerverna.html", "monthly", "0.7"))
    blocks.append(url_block(f"{SITE}/kunskapsbank/nervtabell-armen.html", "monthly", "0.7"))
    blocks.append(url_block(f"{SITE}/kunskapsbank/nervtabell-benet.html", "monthly", "0.7"))
    blocks.append(url_block(f"{SITE}/kunskapsbank/nervtabell-halsen.html", "monthly", "0.7"))
    blocks.append(url_block(f"{SITE}/kunskapsbank/nervtabell-balen.html", "monthly", "0.7"))
    blocks.append(url_block(f"{SITE}/kunskapsbank/nervtabell-autonoma.html", "monthly", "0.7"))
    blocks.append(url_block(f"{SITE}/kunskapsbank/nervtabell-motorbanor.html", "monthly", "0.7"))
    blocks.append(url_block(f"{SITE}/kunskapsbank/nervtabell-sensorbanor.html", "monthly", "0.7"))
    # Muskeltabeller (under-pillar + regionsidor)
    blocks.append(url_block(f"{SITE}/kunskapsbank/muskeltabeller.html", "weekly", "0.7"))
    for f in ["handen", "skuldran", "overarmen", "underarmen", "laret", "underbenet", "foten", "hoften", "bukvaggen", "ryggen", "halsen", "brostkorgen", "kaken", "ansiktet", "ogat", "backenbotten"]:
        blocks.append(url_block(f"{SITE}/kunskapsbank/muskeltabell-{f}.html", "monthly", "0.7"))
    # Skelett-/bentabeller (under-pillar + regionsidor)
    blocks.append(url_block(f"{SITE}/kunskapsbank/skelett.html", "weekly", "0.7"))
    for f in ["skallen", "halsen", "ryggen", "brostkorgen", "skuldran", "overarmen", "underarmen", "handen", "hoften", "laret", "underbenet", "foten"]:
        blocks.append(url_block(f"{SITE}/kunskapsbank/skelett-{f}.html", "monthly", "0.7"))
    # Kärltabeller (under-pillar + regionsidor)
    blocks.append(url_block(f"{SITE}/kunskapsbank/karl.html", "weekly", "0.7"))
    for f in ["huvud-hals", "armen", "brostkorgen", "buken", "backenet", "benet"]:
        blocks.append(url_block(f"{SITE}/kunskapsbank/karl-{f}.html", "monthly", "0.7"))
    # Leder och rörelser (ROM) (under-pillar + regionsidor)
    blocks.append(url_block(f"{SITE}/kunskapsbank/leder.html", "weekly", "0.7"))
    for f in ["overextremitet", "nedreextremitet", "bal-nacke", "kaken"]:
        blocks.append(url_block(f"{SITE}/kunskapsbank/leder-{f}.html", "monthly", "0.7"))
    blocks.append(url_block(f"{SITE}/{LANDING_FILE}", "weekly", "0.9"))
    for f in group_files:
        blocks.append(url_block(f"{SITE}/{f}", "monthly", "0.7"))
    blocks.append(url_block(f"{SITE}/case.html", "monthly", "0.7"))
    blocks.append(url_block(f"{SITE}/info.html", "monthly", "0.5"))
    blocks.append(url_block(f"{SITE}/versionshistorik.html", "weekly", "0.3"))
    blocks.append(url_block(f"{SITE}/integritet.html", "yearly", "0.3"))

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
        groups.setdefault(page_key(entry), []).append(entry)
    for key in groups:
        groups[key].sort(key=lambda e: sort_value(e).lower())

    present = set(groups)

    # Säkra att varje sidas meta-description håller sig inom gränsen.
    over = [("(landning)", len(LANDING_DESC))] if len(LANDING_DESC) > DESC_MAX else []
    for key in present:
        h1 = f"Medicinska {group_heading(key)}" if key in SPECIAL else f"Medicinska ord på {key}"
        d = group_description(key, h1)
        if len(d) > DESC_MAX:
            over.append((key, len(d)))
    if over:
        raise SystemExit(f"FEL: meta-description >{DESC_MAX} tecken: {over}")

    # Säkra att varje sidas <title> håller sig inom gränsen.
    landing_title = "Medicinsk ordlista – tusentals termer | Anatomiquiz"
    too_long = [("(landning)", len(landing_title))] if len(landing_title) > TITLE_MAX else []
    for key in present:
        t = GROUP_TITLES.get(key, "x" * 40)  # fallback antas kort
        if len(t) > TITLE_MAX:
            too_long.append((key, len(t)))
    if too_long:
        raise SystemExit(f"FEL: <title> >{TITLE_MAX} tecken: {too_long}")

    # Rensa bort föräldralösa ordliste-sidor (grupp som tömts sedan förra körningen).
    # Undantag: LEGACY_REDIRECT_FILES underhålls för hand som redirects och ska
    # aldrig raderas här.
    for old in ROOT.glob("ordlista-*.html"):
        if old.name in LEGACY_REDIRECT_FILES:
            continue
        key_slug = old.name.removeprefix("ordlista-").removesuffix(".html")
        if key_slug not in {page_slug(k) for k in present}:
            old.unlink()

    group_files: list[str] = []
    order = [k for k in GROUP_ORDER if k in groups]
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
