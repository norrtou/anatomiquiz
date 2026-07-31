#!/usr/bin/env python3
"""Generera muskeltabell-sidor ur data/muskeltabeller/*.json.

Bygger:
  - kunskapsbank/muskeltabeller.html        (under-pillar: regionkort)
  - kunskapsbank/muskeltabell-<slug>.html   (en regionsida per datafil)

Följer SEO_REGLER.md: full <head>, unik titel ≤65 / description ≤155, OG/Twitter,
Article/CollectionPage + BreadcrumbList-JSON-LD, a11y (en h1, tabell-caption +
th scope), APA-referenser längst ner, quiz-korslänk. Inga URL:er hårdkodas utanför
SITE. sitemap.xml ägs av generate_glossary.py (lägg nya sidor i dess write_sitemap).

Tooltip-wiring (kb-term) är INBYGGD: efter att varje sida skrivits wire:ar main()
in ordlistetooltips via wire_terms på EXAKT de sidor som genererats (aldrig --all).
Output blir därför alltid färdig och deterministisk – inget separat steg att glömma,
ingen spill till orelaterade sidor. Omkörning ger byte-identiska sidor (idempotent).
"""
import json, html, pathlib, re
from wire_terms import load_terms, build_regex, wire_file

ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "muskeltabeller"
KB = ROOT / "kunskapsbank"
SITE = "https://anatomiquiz.se"
CSS_V = "0.9.312"
THEME_V = "0.9.260"  # js/theme.js — EGEN konstant, se generate_glossary.py

def esc(s): return html.escape(s, quote=True)

# APA-referenser för under-pillaren (allmän grund för muskeltabellerna).
PILLAR_KALLOR = [
    "Bojsen-Møller, F., Simonsen, E. B., & Tranum-Jensen, J. (2018). <em>Rörelseapparatens anatomi</em> (2:a uppl.). Liber.",
    "Federative International Programme for Anatomical Terminology. (2019). <em>Terminologia anatomica</em> (2:a uppl.). FIPAT.",
    "Paulsen, F., & Waschke, J. (Red.). (2018). <em>Sobotta atlas of human anatomy</em> (16:e uppl.). Elsevier.",
    "Standring, S. (Red.). (2021). <em>Gray's anatomy: The anatomical basis of clinical practice</em> (42:a uppl.). Elsevier.",
]

def head(title, desc, canon, ogtype, jsonld):
    assert len(title) <= 65, f"TITEL för lång ({len(title)}): {title}"
    assert 25 <= len(desc) <= 155, f"DESC fel längd ({len(desc)}): {desc}"
    core = title.rsplit(" | ", 1)[0]
    jsonld = dict(jsonld)
    bc = jsonld.pop("breadcrumb", None)
    bc_script = ""
    if bc is not None:
        bc_full = {"@context": "https://schema.org", **bc}
        bc_script = ('  <script type="application/ld+json">\n'
                     + json.dumps(bc_full, ensure_ascii=False, indent=2)
                     + '\n  </script>')
    return f"""<!doctype html>
<html lang="sv">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'">

  <title>{esc(title)}</title>
  <meta name="description" content="{esc(desc)}">
  <meta name="author" content="Daniel Medin (Norrtou Creations)">
  <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large">

  <link rel="canonical" href="{canon}">
  <link rel="sitemap" type="application/xml" href="/sitemap.xml">

  <meta property="og:type" content="{ogtype}">
  <meta property="og:url" content="{canon}">
  <meta property="og:title" content="{esc(core)}">
  <meta property="og:description" content="{esc(desc)}">
  <meta property="og:image" content="{SITE}/img/og-image.png">
  <meta property="og:image:width" content="1518">
  <meta property="og:image:height" content="864">
  <meta property="og:image:alt" content="Anatomiquiz — muskeltabeller">
  <meta property="og:locale" content="sv_SE">
  <meta property="og:site_name" content="Anatomiquiz">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{esc(core)}">
  <meta name="twitter:description" content="{esc(desc)}">
  <meta name="twitter:image" content="{SITE}/img/og-image.png">
  <meta name="twitter:image:alt" content="Anatomiquiz — muskeltabeller">

  <meta name="theme-color" content="#10b981">
  <meta name="color-scheme" content="light dark">
  <!-- Tema (ljust/mörkt). Laddas SYNKRONT och före stilmallen: attributet
       data-theme måste sitta på <html> innan första målningen, annars
       blinkar sidan ljus. Inline gick inte – CSP:n tillåter bara egen origin. -->
  <script src="/js/theme.js?v={THEME_V}"></script>

  <script type="application/ld+json">
{json.dumps(jsonld, ensure_ascii=False, indent=2)}
  </script>
{bc_script}

  <link rel="icon" type="image/svg+xml" href="/img/favicon.svg">
  <link rel="icon" type="image/png" sizes="64x64" href="/img/favicon.png">
  <link rel="apple-touch-icon" href="/img/icon-192.png">
  <link rel="manifest" href="/manifest.json">
  <link rel="stylesheet" href="/css/styles.css?v={CSS_V}">
</head>
<body>

  <a class="skip-link" href="#main">Hoppa till innehåll</a>

  <main id="main" class="container" role="main">
"""

FOOT = """  </main>

  <!-- Ordlistetooltips i löptexten (progressiv förbättring; .kb-term funkar som länk utan JS) -->
  <script src="/js/kb-glossary.js" defer></script>
  <!-- Skriv ut / ladda ner (CSV) för tabellerna (progressiv förbättring; CSP-säkert) -->
  <script src="/js/kb-table-tools.js?v=0.9.223" defer></script>

</body>
</html>
"""

def crumb(items):
    parts = []
    for i, (name, url) in enumerate(items):
        if url:
            parts.append(f'<a href="{url}" class="breadcrumb-link">{esc(name)}</a>')
        else:
            parts.append(f'<span class="breadcrumb-current" aria-current="page">{esc(name)}</span>')
    sep = '\n        <span class="breadcrumb-sep" aria-hidden="true">/</span>\n        '
    inner = sep.join(parts)
    return f'      <nav class="breadcrumb" aria-label="Brödsmula">\n        {inner}\n      </nav>'

def bc_jsonld(items):
    # Google kräver absoluta URL:er i breadcrumb-strukturdata (HTML-länkarna får vara relativa)
    return {"@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": i+1, "name": n,
         "item": (SITE + u if u.startswith("/") else u)}
        for i, (n, u) in enumerate(items)]}

def refs_html(kallor):
    lis = "\n".join(f"          <li>{k}</li>" for k in kallor)
    return ('      <div class="kb-sources">\n        <h2>Referenser</h2>\n'
            f'        <ul>\n{lis}\n        </ul>\n      </div>')

# ---------------------------------------------------------------------------

def region_page(d):
    region = d["region"]; slug = d["slug"]
    canon = f"{SITE}/kunskapsbank/muskeltabell-{slug}.html"
    # Standardtitel; data får ange "titel" för långa regionnamn (≤65, §2).
    title = d.get("titel") or f"{region}s muskler – ursprung, fäste, innervation | Anatomiquiz"
    desc = (f"Tabell över {region.lower()}s muskler: ursprung (origo), fäste (insertio), "
            f"innervation och funktion – för tentaplugg i anatomi.")
    crumbs = [("← Anatomiquiz", "/"), ("Kunskapsbank", "/kunskapsbank/"),
              ("Listor & tabeller", "/kunskapsbank/listor-tabeller.html"),
              ("Muskeltabeller", "/kunskapsbank/muskeltabeller.html"),
              (f"{region}s muskler", None)]
    jsonld = {"@context": "https://schema.org", "@type": ["Article", "LearningResource"],
              "headline": f"{region}s muskler – ursprung, fäste, innervation och funktion",
              "description": desc, "inLanguage": "sv-SE", "isAccessibleForFree": True,
              "learningResourceType": "table", "educationalUse": ["self study", "professional development"],
              "isPartOf": {"@type": "WebSite", "name": "Anatomiquiz", "url": f"{SITE}/"},
              "breadcrumb": bc_jsonld([(n if n != "← Anatomiquiz" else "Anatomiquiz", u or canon) for n, u in crumbs])}

    out = [head(title, desc, canon, "article", jsonld)]
    out.append(f"""    <header class="header">
      <div class="header-title">
        <h1>{esc(d.get("rubrik", region + "s muskler"))}</h1>
      </div>
      <p class="tagline">{esc(d.get("underrubrik", ""))}</p>
    </header>

    <section class="card" aria-labelledby="mtabHeading">
""")
    out.append(crumb(crumbs))
    out.append(f'\n      <h2 id="mtabHeading" class="sr-only">{esc(region)}s muskler</h2>\n')
    out.append(f'      <div class="info-about">\n        <p>{esc(d["intro"])}</p>\n      </div>\n')

    # Förklaring av intrinsisk vs extrinsisk (data-driven, innehåller avsedd <strong>)
    if d.get("typ_intro"):
        out.append('      <div class="info-about">\n'
                   '        <h2>Vad menas med intrinsisk och extrinsisk?</h2>\n'
                   f'        <p>{d["typ_intro"]}</p>\n      </div>\n')

    # (etikett, kolumnklass, datafält) – styr rubrik, bredd och mobil-etikett.
    COLS = [("Muskel (latin)", "c-mus", "latin"), ("Svenska", "c-sv", "svenska"),
            ("Ursprung (origo)", "c-ori", "origo"), ("Fäste (insertio)", "c-ins", "insertio"),
            ("Innervation", "c-inn", "innervation"), ("Funktion", "c-fun", "funktion")]

    def render_table(caption, rows):
        out.append('      <table class="kb-mtable" role="table">\n')
        out.append(f'        <caption>{esc(caption)}</caption>\n')
        out.append('        <colgroup>' + "".join(f'<col class="{c}">' for _, c, _ in COLS) + '</colgroup>\n')
        out.append('        <thead role="rowgroup">\n          <tr role="row">'
                   + "".join(f'<th scope="col" role="columnheader">{esc(l)}</th>' for l, _, _ in COLS)
                   + '</tr>\n        </thead>\n')
        out.append('        <tbody role="rowgroup">\n')
        for m in rows:
            tds = []
            for i, (label, _, key) in enumerate(COLS):
                val = esc(m[key])
                if i == 0:
                    val = f"<em>{val}</em>"
                tds.append(f'<td role="cell" data-label="{esc(label)}">{val}</td>')
            out.append('          <tr role="row">' + "".join(tds) + '</tr>\n')
        out.append('        </tbody>\n      </table>\n')

    def grupp_order(muskler):
        order = []
        for m in muskler:
            g = m.get("grupp", "")
            if g not in order: order.append(g)
        return order

    # Har regionen typ (intrinsisk/extrinsisk, t.ex. hand/fot)? Annars bara grupper.
    typ_order = []
    for m in d["muskler"]:
        if m.get("typ") and m["typ"] not in typ_order: typ_order.append(m["typ"])
    if typ_order:
        for typ in typ_order:
            ms = [m for m in d["muskler"] if m.get("typ") == typ]
            out.append(f'      <div class="info-about">\n        <h2>{esc(typ)}a muskler</h2>\n      </div>\n')
            for g in grupp_order(ms):
                render_table(g, [m for m in ms if m.get("grupp") == g])
    else:
        for g in grupp_order(d["muskler"]):
            render_table(g, [m for m in d["muskler"] if m.get("grupp") == g])

    out.append(f"""      <div class="info-about">
        <p>Vill du träna aktivt? <a href="/">Testa dig själv på {esc(region.lower())} i quizet</a>. Slå upp enskilda termer i den <a href="/medicinskordlista.html">medicinska ordlistan</a>.</p>
      </div>
""")
    out.append(refs_html(d["kallor"]))
    out.append(f"""
      <div class="actions">
        <a href="/kunskapsbank/muskeltabeller.html" class="btn">← Muskeltabeller</a>
        <a href="/" class="btn primary">Till quizet</a>
      </div>

    </section>
""")
    out.append(FOOT)
    (KB / f"muskeltabell-{slug}.html").write_text("".join(out), encoding="utf-8")
    return {
        "slug": slug, "region": region,
        # Unik kortbeskrivning + knapptext per region (variation – inte samma ramsa).
        "beskrivning": d.get("kort_beskrivning") or
            f"Ursprung, fäste, innervation och funktion för musklerna i {region.lower()}.",
        "cta": d.get("kort_cta") or f"Till {region.lower()}s muskler →",
    }

def pillar_page(regions):
    canon = f"{SITE}/kunskapsbank/muskeltabeller.html"
    title = "Muskeltabeller per kroppsregion | Anatomiquiz"
    desc = ("Muskeltabeller per kroppsregion: ursprung, fäste, innervation och funktion – "
            "för tentaplugg i anatomi. Välj region nedan.")
    crumbs = [("← Anatomiquiz", "/"), ("Kunskapsbank", "/kunskapsbank/"),
              ("Listor & tabeller", "/kunskapsbank/listor-tabeller.html"),
              ("Muskeltabeller", None)]
    jsonld = {"@context": "https://schema.org", "@type": ["CollectionPage", "LearningResource"],
              "name": "Muskeltabeller per kroppsregion", "description": desc,
              "inLanguage": "sv-SE", "isAccessibleForFree": True, "learningResourceType": "reference",
              "isPartOf": {"@type": "WebSite", "name": "Anatomiquiz", "url": f"{SITE}/"},
              "hasPart": [{"@type": "LearningResource", "name": f"{r['region']}s muskler",
                           "url": f"{SITE}/kunskapsbank/muskeltabell-{r['slug']}.html"} for r in regions],
              "breadcrumb": bc_jsonld([(n if n != "← Anatomiquiz" else "Anatomiquiz", u or canon) for n, u in crumbs])}
    out = [head(title, desc, canon, "website", jsonld)]
    out.append("""    <header class="header">
      <div class="header-title">
        <h1>Muskeltabeller</h1>
      </div>
      <p class="tagline">Ursprung, fäste, innervation och funktion – per kroppsregion</p>
    </header>

    <section class="card" aria-labelledby="mpHeading">
""")
    out.append(crumb(crumbs))
    out.append('\n      <h2 id="mpHeading" class="sr-only">Muskeltabeller per region</h2>\n')
    # Sista meningen länkar till läsguiden. Den låg länge bara i den levererade
    # HTML:en och hade försvunnit vid nästa regenerering (CLAUDE_REGLER §12.2).
    out.append('      <div class="info-about">\n        <p>Musklerna presenteras region för region, var och en med ursprung (origo), fäste (insertio), innervation och funktion. Välj en region för att se hela tabellen. Vad kolumnerna betyder, och hur en muskels funktion går att räkna ut ur var den fäster, står i guiden <a href="/kunskapsbank/artiklar/sa-laser-du-en-muskeltabell.html">så läser du en muskeltabell</a>.</p>\n      </div>\n')
    out.append('      <div class="kb-grid">\n')
    for r in regions:
        out.append(f"""        <a class="kb-card" href="/kunskapsbank/muskeltabell-{r['slug']}.html">
          <h3 class="kb-card-title">{esc(r['region'])}s muskler</h3>
          <p class="kb-card-desc">{esc(r['beskrivning'])}</p>
          <span class="kb-card-go">{esc(r['cta'])}</span>
        </a>
""")
    out.append('      </div>\n')
    out.append(refs_html(PILLAR_KALLOR))
    out.append("""
      <div class="actions">
        <a href="/kunskapsbank/listor-tabeller.html" class="btn">← Listor &amp; tabeller</a>
      </div>

    </section>
""")
    out.append(FOOT)
    (KB / "muskeltabeller.html").write_text("".join(out), encoding="utf-8")

def main():
    regions = []
    generated = []
    for f in sorted(DATA.glob("*.json")):
        d = json.load(open(f, encoding="utf-8"))
        r = region_page(d)
        regions.append(r)
        generated.append(KB / f"muskeltabell-{r['slug']}.html")
        print(f"  muskeltabell-{r['slug']}.html ({r['region']}, {len(d['muskler'])} muskler)")
    pillar_page(regions)
    generated.append(KB / "muskeltabeller.html")
    print(f"  muskeltabeller.html (under-pillar, {len(regions)} region(er))")

    # Steg 2 inbyggt: wire:a kb-term-tooltips på exakt de sidor vi just skrev
    # (aldrig --all → ingen spill till orelaterade sidor). Generatorn skriver ren
    # HTML; utan detta nollas tooltipsen vid varje omkörning.
    terms = load_terms(); rx = build_regex(terms)
    tot = 0
    for p in generated:
        n, _ = wire_file(p, terms, rx)
        tot += n
    print(f"  tooltips wirade: {tot} kb-term-länkar i {len(generated)} sidor")

    # Steg 3 inbyggt: SEO_REGLER.md §12-grind. Körbar regelefterlevnad – varje
    # genererad sida MÅSTE klara checklistan, annars kastar bygget. Då kan ingen
    # regelbrytande sida skapas tyst, oberoende av om någon "kommer ihåg" att läsa MD.
    check_seo_compliance(generated)
    print(f"  SEO §12: alla {len(generated)} sidor godkända")

def check_seo_compliance(paths):
    """SEO_REGLER.md §12 som kod. Kastar AssertionError som listar alla brott."""
    titles, descs, problems = {}, {}, []
    for p in paths:
        h = p.read_text(encoding="utf-8")
        name = p.name
        is_hub = (name == "muskeltabeller.html")          # kortgrid, ej tabellsida
        bad = []
        t = re.search(r"<title>(.*?)</title>", h)
        d = re.search(r'name="description" content="(.*?)"', h)
        t = t.group(1) if t else ""; d = d.group(1) if d else ""
        titles.setdefault(t, []).append(name); descs.setdefault(d, []).append(name)
        if not (5 <= len(t) <= 65): bad.append(f"titel {len(t)} tecken (§2: ≤65)")
        if not (25 <= len(d) <= 150): bad.append(f"description {len(d)} tecken (§3: 25–150)")
        for b in re.findall(r'application/ld\+json">(.*?)</script>', h, re.S):
            try: json.loads(b)
            except Exception: bad.append("ogiltig JSON-LD (§6)")
        if "BreadcrumbList" not in h: bad.append("saknar BreadcrumbList (§6)")
        if h.count("<h1") != 1: bad.append(f"{h.count('<h1')} st <h1> (§7: exakt 1)")
        if 'class="skip-link"' not in h: bad.append("saknar skip-länk (§7)")
        if 'id="main"' not in h: bad.append("saknar <main id=main> (§7)")
        if f'rel="canonical" href="{SITE}/kunskapsbank/{name}"' not in h:
            bad.append("canonical ej självrefererande (§4)")
        if "google-site-verification" in h: bad.append("google-site-verification på undersida (§4)")
        core = t.rsplit(" | ", 1)[0]
        ogt = re.search(r'property="og:title" content="(.*?)"', h)
        twt = re.search(r'name="twitter:title" content="(.*?)"', h)
        if not (ogt and twt and ogt.group(1) == twt.group(1) == esc(core)):
            bad.append("og:title ≠ twitter:title ≠ titel-core (§5)")
        for fld in ('og:url', 'og:image', 'og:image:alt', 'twitter:card', 'twitter:image'):
            if fld not in h: bad.append(f"saknar {fld} (§5)")
        if not ('kb-sources' in h and 'Referenser</h2>' in h):
            bad.append("saknar Referenser-block (§6b)")
        if h.count("<table") != h.count("<caption>"):
            bad.append("tabell utan <caption> (§7)")
        if not is_hub:
            if "kb-mtable" not in h or "kb-table-wrap" in h:
                bad.append("tabell ej responsiv .kb-mtable (§7)")
            if 'style="' in h: bad.append("inline-style mot CSP (§7/§8)")
        if bad: problems.append(f"  ✗ {name}:\n      - " + "\n      - ".join(bad))
    for k, v in titles.items():
        if len(v) > 1: problems.append(f"  ✗ DUBBLETT titel '{k}' på: {', '.join(v)} (§2)")
    for k, v in descs.items():
        if len(v) > 1: problems.append(f"  ✗ DUBBLETT description på: {', '.join(v)} (§3)")
    if problems:
        raise AssertionError("SEO_REGLER.md §12 BRUTEN – bygget stoppat:\n" + "\n".join(problems))

if __name__ == "__main__":
    main()
