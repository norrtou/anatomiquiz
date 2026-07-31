#!/usr/bin/env python3
"""Generera ledrörelse-/ROM-tabeller ur data/leder_rom/*.json.

Bygger kunskapsbank/leder.html (under-pillar) + kunskapsbank/leder-<slug>.html.
Speglar generate_skelett.py/generate_karl.py. Riktad SEO mot fysio/AT
(rörelseomfång, ROM, ledrörlighet, grader, goniometri).
"""
import json, html, pathlib, re
from wire_terms import load_terms, build_regex, wire_file

ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "leder_rom"
KB = ROOT / "kunskapsbank"
SITE = "https://anatomiquiz.se"
CSS_V = "0.9.312"
THEME_V = "0.9.260"  # js/theme.js — EGEN konstant, se generate_glossary.py

def esc(s): return html.escape(s, quote=True)

PILLAR_KALLOR = [
    "Bojsen-Møller, F., Simonsen, E. B., & Tranum-Jensen, J. (2018). <em>Rörelseapparatens anatomi</em> (2:a uppl.). Liber.",
    "Norkin, C. C., & White, D. J. (2016). <em>Measurement of joint motion: A guide to goniometry</em> (5:e uppl.). F.A. Davis.",
    "Standring, S. (Red.). (2021). <em>Gray's anatomy: The anatomical basis of clinical practice</em> (42:a uppl.). Elsevier.",
]

def head(title, desc, canon, ogtype, jsonld):
    assert len(title) <= 65, f"TITEL för lång ({len(title)}): {title}"
    assert 25 <= len(desc) <= 150, f"DESC fel längd ({len(desc)}): {desc}"
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
  <meta property="og:image:alt" content="Anatomiquiz — ledrörelser och rörelseomfång (ROM)">
  <meta property="og:locale" content="sv_SE">
  <meta property="og:site_name" content="Anatomiquiz">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{esc(core)}">
  <meta name="twitter:description" content="{esc(desc)}">
  <meta name="twitter:image" content="{SITE}/img/og-image.png">
  <meta name="twitter:image:alt" content="Anatomiquiz — ledrörelser och rörelseomfång (ROM)">

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

  <script src="/js/kb-glossary.js" defer></script>
  <script src="/js/kb-table-tools.js?v=0.9.223" defer></script>

</body>
</html>
"""

def crumb(items):
    parts = []
    for name, url in items:
        if url:
            parts.append(f'<a href="{url}" class="breadcrumb-link">{esc(name)}</a>')
        else:
            parts.append(f'<span class="breadcrumb-current" aria-current="page">{esc(name)}</span>')
    sep = '\n        <span class="breadcrumb-sep" aria-hidden="true">/</span>\n        '
    return f'      <nav class="breadcrumb" aria-label="Brödsmula">\n        {sep.join(parts)}\n      </nav>'

def bc_jsonld(items):
    return {"@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": i+1, "name": n,
         "item": (SITE + u if u.startswith("/") else u)}
        for i, (n, u) in enumerate(items)]}

def refs_html(kallor):
    lis = "\n".join(f"          <li>{k}</li>" for k in kallor)
    return ('      <div class="kb-sources">\n        <h2>Referenser</h2>\n'
            f'        <ul>\n{lis}\n        </ul>\n      </div>')

COLS = [("Rörelse", "c-rror", "rorelse"), ("Rörelseplan", "c-rpl", "plan"),
        ("Normalt rörelseomfång", "c-rom", "rom"), ("Huvudsakliga muskler", "c-rmus", "muskler")]

def region_page(d):
    region = d["region"]; slug = d["slug"]
    canon = f"{SITE}/kunskapsbank/leder-{slug}.html"
    title = d["titel"]; desc = d["desc"]
    crumbs = [("← Anatomiquiz", "/"), ("Kunskapsbank", "/kunskapsbank/"),
              ("Listor & tabeller", "/kunskapsbank/listor-tabeller.html"),
              ("Leder och rörelser", "/kunskapsbank/leder.html"),
              (region, None)]
    jsonld = {"@context": "https://schema.org", "@type": ["Article", "LearningResource"],
              "headline": f"{region} – ledrörelser och rörelseomfång (ROM)",
              "description": desc, "inLanguage": "sv-SE", "isAccessibleForFree": True,
              "learningResourceType": "table", "educationalUse": ["self study", "professional development"],
              "isPartOf": {"@type": "WebSite", "name": "Anatomiquiz", "url": f"{SITE}/"},
              "breadcrumb": bc_jsonld([(n if n != "← Anatomiquiz" else "Anatomiquiz", u or canon) for n, u in crumbs])}
    out = [head(title, desc, canon, "article", jsonld)]
    out.append(f"""    <header class="header">
      <div class="header-title">
        <h1>{esc(d.get("rubrik", region))}</h1>
      </div>
      <p class="tagline">{esc(d.get("underrubrik", ""))}</p>
    </header>

    <section class="card" aria-labelledby="ledHeading">
""")
    out.append(crumb(crumbs))
    out.append(f'\n      <h2 id="ledHeading" class="sr-only">{esc(region)} – ledrörelser och rörelseomfång</h2>\n')
    out.append(f'      <div class="info-about">\n        <p>{esc(d["intro"])}</p>\n      </div>\n')

    def render_table(caption, rows):
        out.append('      <table class="kb-mtable" role="table">\n')
        out.append(f'        <caption>{esc(caption)}</caption>\n')
        out.append('        <colgroup>' + "".join(f'<col class="{c}">' for _, c, _ in COLS) + '</colgroup>\n')
        out.append('        <thead role="rowgroup">\n          <tr role="row">'
                   + "".join(f'<th scope="col" role="columnheader">{esc(l)}</th>' for l, _, _ in COLS)
                   + '</tr>\n        </thead>\n')
        out.append('        <tbody role="rowgroup">\n')
        for r in rows:
            tds = "".join(f'<td role="cell" data-label="{esc(label)}">{esc(r.get(key,"") or "—")}</td>'
                          for label, _, key in COLS)
            out.append('          <tr role="row">' + tds + '</tr>\n')
        out.append('        </tbody>\n      </table>\n')

    order = []
    for r in d["rorelser"]:
        g = r.get("led", "")
        if g not in order: order.append(g)
    for g in order:
        render_table(g, [r for r in d["rorelser"] if r.get("led") == g])

    out.append(f"""      <div class="info-about">
        <p>Värdena är ungefärliga normalintervall för aktiv rörlighet och varierar mellan källor, mätmetod (goniometri) och individ. Vill du träna aktivt? <a href="/">Testa dig själv i quizet</a>. Slå upp termer i den <a href="/medicinskordlista.html">medicinska ordlistan</a>.</p>
      </div>
""")
    out.append(refs_html(d["kallor"]))
    out.append(f"""
      <div class="actions">
        <a href="/kunskapsbank/leder.html" class="btn">← Leder och rörelser</a>
        <a href="/" class="btn primary">Till quizet</a>
      </div>

    </section>
""")
    out.append(FOOT)
    (KB / f"leder-{slug}.html").write_text("".join(out), encoding="utf-8")
    return {"slug": slug, "region": region, "beskrivning": d["kort_beskrivning"], "cta": d["kort_cta"]}

def pillar_page(regions):
    canon = f"{SITE}/kunskapsbank/leder.html"
    title = "Leder och rörelser – rörelseomfång (ROM) | Anatomiquiz"
    desc = ("Ledernas rörelser och normalt rörelseomfång (ROM) i grader, region för region – "
            "för fysioterapi, arbetsterapi och anatomiplugg. Välj region nedan.")
    crumbs = [("← Anatomiquiz", "/"), ("Kunskapsbank", "/kunskapsbank/"),
              ("Listor & tabeller", "/kunskapsbank/listor-tabeller.html"),
              ("Leder och rörelser", None)]
    jsonld = {"@context": "https://schema.org", "@type": ["CollectionPage", "LearningResource"],
              "name": "Leder och rörelser – rörelseomfång (ROM)", "description": desc,
              "inLanguage": "sv-SE", "isAccessibleForFree": True, "learningResourceType": "reference",
              "isPartOf": {"@type": "WebSite", "name": "Anatomiquiz", "url": f"{SITE}/"},
              "hasPart": [{"@type": "LearningResource", "name": r['region'],
                           "url": f"{SITE}/kunskapsbank/leder-{r['slug']}.html"} for r in regions],
              "breadcrumb": bc_jsonld([(n if n != "← Anatomiquiz" else "Anatomiquiz", u or canon) for n, u in crumbs])}
    out = [head(title, desc, canon, "website", jsonld)]
    out.append("""    <header class="header">
      <div class="header-title">
        <h1>Leder och rörelser</h1>
      </div>
      <p class="tagline">Ledrörelser och normalt rörelseomfång (ROM) i grader – per region, för fysio och AT</p>
    </header>

    <section class="card" aria-labelledby="ledpHeading">
""")
    out.append(crumb(crumbs))
    out.append('\n      <h2 id="ledpHeading" class="sr-only">Leder och rörelser per region</h2>\n')
    out.append('      <div class="info-about">\n        <p>Varje led med sina rörelser, vilket plan de sker i, normalt rörelseomfång (ROM) i grader och de muskler som utför rörelsen. Praktiskt vid bedömning av ledrörlighet inom fysioterapi och arbetsterapi. Välj en region nedan.</p>\n      </div>\n')
    out.append('      <div class="kb-grid">\n')
    for r in regions:
        out.append(f"""        <a class="kb-card" href="/kunskapsbank/leder-{r['slug']}.html">
          <h3 class="kb-card-title">{esc(r['region'])}</h3>
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
    (KB / "leder.html").write_text("".join(out), encoding="utf-8")

def main():
    ORDER = ["overextremitet", "nedreextremitet", "bal-nacke", "kaken"]
    files = {f.stem: f for f in DATA.glob("*.json")}
    ordered = [files[s] for s in ORDER if s in files] + [files[s] for s in sorted(files) if s not in ORDER]
    regions, generated = [], []
    for f in ordered:
        d = json.load(open(f, encoding="utf-8"))
        r = region_page(d); regions.append(r)
        generated.append(KB / f"leder-{r['slug']}.html")
        print(f"  leder-{r['slug']}.html ({r['region']}, {len(d['rorelser'])} rörelser)")
    pillar_page(regions)
    generated.append(KB / "leder.html")
    print(f"  leder.html (under-pillar, {len(regions)} region(er))")
    terms = load_terms(); rx = build_regex(terms)
    tot = sum(wire_file(p, terms, rx)[0] for p in generated)
    print(f"  tooltips wirade: {tot} kb-term-länkar i {len(generated)} sidor")
    check_seo_compliance(generated)
    print(f"  SEO §12: alla {len(generated)} sidor godkända")

def check_seo_compliance(paths):
    titles, descs, problems = {}, {}, []
    for p in paths:
        h = p.read_text(encoding="utf-8"); name = p.name
        is_hub = (name == "leder.html"); bad = []
        t = re.search(r"<title>(.*?)</title>", h); d = re.search(r'name="description" content="(.*?)"', h)
        t = t.group(1) if t else ""; d = d.group(1) if d else ""
        titles.setdefault(t, []).append(name); descs.setdefault(d, []).append(name)
        if not (5 <= len(t) <= 65): bad.append(f"titel {len(t)} tecken (§2)")
        if not (25 <= len(d) <= 150): bad.append(f"description {len(d)} tecken (§3)")
        for b in re.findall(r'application/ld\+json">(.*?)</script>', h, re.S):
            try: json.loads(b)
            except Exception: bad.append("ogiltig JSON-LD (§6)")
        if "BreadcrumbList" not in h: bad.append("saknar BreadcrumbList (§6)")
        if h.count("<h1") != 1: bad.append(f"{h.count('<h1')} <h1> (§7)")
        if 'class="skip-link"' not in h: bad.append("saknar skip-länk (§7)")
        if 'id="main"' not in h: bad.append("saknar main (§7)")
        if f'rel="canonical" href="{SITE}/kunskapsbank/{name}"' not in h: bad.append("canonical fel (§4)")
        if "google-site-verification" in h: bad.append("gsv på undersida (§4)")
        core = t.rsplit(" | ", 1)[0]
        ogt = re.search(r'property="og:title" content="(.*?)"', h)
        twt = re.search(r'name="twitter:title" content="(.*?)"', h)
        if not (ogt and twt and ogt.group(1) == twt.group(1) == esc(core)): bad.append("og/twitter-titel (§5)")
        for fld in ('og:url', 'og:image', 'og:image:alt', 'twitter:card', 'twitter:image'):
            if fld not in h: bad.append(f"saknar {fld} (§5)")
        if not ('kb-sources' in h and 'Referenser</h2>' in h): bad.append("saknar Referenser (§6b)")
        if h.count("<table") != h.count("<caption>"): bad.append("tabell utan caption (§7)")
        if not is_hub:
            if "kb-mtable" not in h or "kb-table-wrap" in h: bad.append("ej responsiv tabell (§7)")
            if 'style="' in h: bad.append("inline-style (§7/§8)")
        if bad: problems.append(f"  ✗ {name}:\n      - " + "\n      - ".join(bad))
    for k, v in titles.items():
        if len(v) > 1: problems.append(f"  ✗ DUBBLETT titel '{k}': {', '.join(v)} (§2)")
    for k, v in descs.items():
        if len(v) > 1: problems.append(f"  ✗ DUBBLETT desc: {', '.join(v)} (§3)")
    if problems:
        raise AssertionError("SEO_REGLER.md §12 BRUTEN:\n" + "\n".join(problems))

if __name__ == "__main__":
    main()
