#!/usr/bin/env python3
"""Lägg in ordlistetooltips (kb-term) i kunskapsbankens HTML-sidor.

Steg 2 efter sidgenerering: generatorerna (generate_glossary.py,
generate_muskeltabeller.py m.fl.) skriver REN HTML utan tooltips. Detta skript
wire:ar in `<a class="kb-term" …>`-länkar i löptext, rubriker, tabellceller och
referenser – men ALDRIG i <head>/JSON-LD, brödsmulan eller befintliga <a>.

Körs OM efter varje gång en sida regenererats (regenerering nollställer
tooltipsen). Skriptet är idempotent: befintliga kb-term/<a> hoppas över, så en
redan wirad sida ändras inte.

Termkälla = `data/kb_glossary_terms.json` (term → href + kort definition).
Den filen byggs av build_terms() ur de redan wirade sidorna (facit) + en
kurerad utökning för anatomitermer som är nya för en sida. Håll href/def
byte-identiska mot js/glossary.js-ankarna.

Användning:
    python3 scripts/wire_terms.py kunskapsbank/muskeltabell-foten.html ...
    python3 scripts/wire_terms.py --all           # kunskapsbanken + artiklarna + case.html
    python3 scripts/wire_terms.py --check --all   # dry-run över allt; tyst = inget att göra
    python3 scripts/wire_terms.py --check FIL ...  # dry-run för enskilda filer
"""
import json, re, sys, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
TERMS_FILE = ROOT / "data" / "kb_glossary_terms.json"

# Svenska ordtecken (för ordgränser som respekterar åäö och bindestreck).
WORD = r"[0-9A-Za-zÀ-ÖØ-öø-ÿ]"

# Homonymfällor: ord som ÄR riktiga uppslagsord men som också är vanliga
# svenska ord, och därför wirades fel i löptext ("medicinens ledande centrum"
# länkat till anatomiskt centrum). Samma undantagsprincip som redan gäller
# kasus, komplement, opposition, numerus, genus, os och axis (SEO_REGLER §6c).
# Behövs termen på en enskild sida skrivs kb-term-länken för hand.
#
# Vardagsord som INTE var uppslagsord (stort → grand mal, sina → sinus,
# plats → locus, gången → ductus, platta → lamina, olust → malaise) är i
# stället borttagna ur data/kb_glossary_terms.json – de hörde aldrig hemma
# i facit. Listan här är regressionsskyddet: facit underhålls för hand.
BLOCKERADE = {
    "centrum",   # -> centrum (anatomiskt); flerordsnyckeln "centrum tendineum"
                 #    finns i facit och matchas som hel fras (§6c längsta match)
}

def load_terms():
    data = json.load(open(TERMS_FILE, encoding="utf-8"))
    # nyckel = gemener; värde = {"href":..., "def":...}
    return {k.lower(): v for k, v in data.items() if k.lower() not in BLOCKERADE}

def build_regex(terms):
    # Längsta termer först → flerordsfraser vinner över enord på samma position.
    keys = sorted(terms.keys(), key=len, reverse=True)
    alt = "|".join(re.escape(k) for k in keys)
    # Ordgräns som inte tillåter att matchen sitter inuti ett längre ord.
    return re.compile(rf"(?<!{WORD})(?:{alt})(?!{WORD})", re.IGNORECASE)

def wire_html(html, terms, rx, stats=None):
    """Returnera html med kb-term-länkar inlagda i aktiv text.

    Aktiv text = utanför <head>, <script>, <style>, brödsmule-<nav> och
    befintliga <a>…</a>. Vi går igenom HTML token för token (text / tagg) och
    håller koll på skyddade zoner.
    """
    out = []
    i, n = 0, len(html)
    protected = []        # stack av skyddande tag-namn (head/script/style/breadcrumb-nav)
    in_anchor = False
    tag_rx = re.compile(r"<(/?)([a-zA-Z0-9]+)([^>]*)>")
    def active():
        return not protected and not in_anchor
    while i < n:
        lt = html.find("<", i)
        if lt == -1:
            text = html[i:]
            out.append(_sub(text, rx, terms, stats) if active() else text)
            break
        # text före nästa tagg
        text = html[i:lt]
        if text:
            out.append(_sub(text, rx, terms, stats) if active() else text)
        if html.startswith("<!--", lt):     # HTML-kommentar: kopiera ordagrant
            end = html.find("-->", lt)
            end = (end + 3) if end != -1 else n
            out.append(html[lt:end])
            i = end
            continue
        m = tag_rx.match(html, lt)
        if not m:
            out.append(html[lt])      # lös '<'
            i = lt + 1
            continue
        closing, name, attrs = m.group(1), m.group(2).lower(), m.group(3)
        self_closing = attrs.rstrip().endswith("/")
        if closing:
            # Vilken stängande tagg som helst poppar matchande skyddad zon.
            if protected and protected[-1] == name:
                protected.pop()
            elif name == "a":
                in_anchor = False
        else:
            is_breadcrumb_nav = (name == "nav" and 'class="breadcrumb"' in attrs)
            # Kort (.kb-card) får ALDRIG tooltips inuti sig – en kb-term-länk där stör
            # klicket på kortet (och blir nästlad <a> i klickbara kort). Matcha bara
            # själva kort-behållaren (class börjar med kb-card följt av blank/citat),
            # inte kb-card-desc/-title/-go. <a>-kort fångas redan av in_anchor nedan.
            is_kb_card = bool(re.search(r'class="kb-card[ "]', attrs))
            if (name in ("head", "script", "style") or is_breadcrumb_nav
                    or (is_kb_card and name != "a")) and not self_closing:
                protected.append(name)        # öppna skyddad zon
            elif name == "a" and not self_closing:
                in_anchor = True
        out.append(m.group(0))
        i = m.end()
    return "".join(out)

def _sub(text, rx, terms, stats):
    def repl(mo):
        token = mo.group(0)
        v = terms[token.lower()]
        if stats is not None:
            stats[token.lower()] = stats.get(token.lower(), 0) + 1
        return (f'<a class="kb-term" href="{v["href"]}" '
                f'data-def="{v["def"]}">{token}</a>')
    return rx.sub(repl, text)

def wire_file(path, terms, rx, write=True):
    html = pathlib.Path(path).read_text(encoding="utf-8")
    stats = {}
    new = wire_html(html, terms, rx, stats)
    n = sum(stats.values())
    if write and new != html:
        pathlib.Path(path).write_text(new, encoding="utf-8")
    return n, stats

def alla_sidor():
    """Varje wire:bar sida. Artiklarna ligger i en underkatalog och missades
    tidigare av --all, vilket gjorde att nya artiklar tyst hamnade utanför
    tooltipsvepet."""
    kb = ROOT / "kunskapsbank"
    return (sorted(kb.glob("*.html"))
            + sorted(kb.glob("artiklar/*.html"))
            + [ROOT / "case.html"])

def main(argv):
    terms = load_terms()
    rx = build_regex(terms)
    if not argv:
        print(__doc__); return

    check = argv[0] == "--check"
    if check:
        argv = argv[1:]
        if not argv:
            print("--check kräver filer eller --all", file=sys.stderr); return 1

    if argv[0] == "--all":
        files = alla_sidor()
    else:
        files = [ROOT / a for a in argv]

    tot = 0
    for f in files:
        n, stats = wire_file(f, terms, rx, write=not check)
        tot += n
        # Vid --check är tystnad det intressanta: bara sidor som skulle ändras
        # skrivs ut, så en ren körning ger ingen utdata alls.
        if not check:
            print(f"  {f.relative_to(ROOT)}: {n} kb-term-länkar")
        elif n:
            print(f"  {f.relative_to(ROOT)}: {n} skulle läggas ({len(stats)} unika): "
                  f"{', '.join(sorted(stats))}")
    verb = "skulle läggas" if check else "lagda"
    print(f"Totalt {tot} länkar {verb} i {len(files)} filer.")
    return 0

if __name__ == "__main__":
    main(sys.argv[1:])
