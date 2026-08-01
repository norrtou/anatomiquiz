#!/usr/bin/env python3
"""Generera artikelinfrastrukturen i Anatomiquiz kunskapsbank.

Källa: data/artiklar.json (ENDA sanningen för artikelmetadata).
Regler: ARTIKLAR_REGLER.md + SEO_REGLER.md.

Skriver:
  kunskapsbank/faktatexter.html          ingången till artiklarna (N1)
  kunskapsbank/artiklar/index.html       Alla artiklar (platt index, N2)
  kunskapsbank/artiklar/<hubb>.html      ämneshubb (N2) – ENDAST för hubbar
                                         som har minst en live-artikel

Ämneshubbar utan artiklar renderas medvetet INTE som egna sidor. En hubbsida
utan innehåll är tunt innehåll (ARTIKLAR_REGLER §8.2) och skulle behöva
noindex; istället visas de som "Snart"-kort på faktatexter.html tills den
första artikeln landar.

Pelarartiklar (fältet "pelare" i stället för "hubb") hänger under en redan
befintlig kunskapsbankspelare – i praktiken terminologipelaren. ARTIKLAR_REGLER
§1.5 är tydlig med att språk- och terminologiartiklar inte får bygga en
parallell språkavdelning under Faktatexter, så de hålls utanför ämneshubbarna
och utanför faktatexter.html. De finns däremot i artikelindexet, i sitemap och
i llms.txt – de är fullvärdiga artiklar, de hänger bara någon annanstans.

Pelarsidorna är handskrivna sedan tidigare och skrivs INTE om av det här
skriptet. För att registret ändå ska förbli sanningen (§1.6) verifierar
validate() att varje pelarartikel faktiskt är länkad från sin pelarsida.

Artikelsidorna själva skrivs för hand – prosa genereras aldrig. Skriptet
rör dem inte, men kräver att de är registrerade.

Kör efter varje ändring i data/artiklar.json:
    python3 scripts/generate_artiklar.py
"""

from __future__ import annotations

import datetime
import html
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
REGISTRY = ROOT / "data" / "artiklar.json"
KB = ROOT / "kunskapsbank"
ARTDIR = KB / "artiklar"
SITE = "https://anatomiquiz.se"

# Cachebusters per asset — EN KONSTANT PER RESURS, bumpa bara den som faktiskt
# ändrats. Låg tidigare på VERSION ("hämtas ur VERSION så generatorn aldrig
# hamnar efter"), vilket gav två fel: varje versionsbump skrev ny buster på
# resurser som inte ändrats, och scripts/bump_version.py kunde inte se
# konstanterna alls — generator_css_versions() kräver ett literalt
# `VAR = "x.y.z"`, och ett beräknat VERSION matchar inte.
STYLES_V = "0.9.321"  # css/styles.css
THEME_V = "0.9.260"   # js/theme.js

# faktatexter.html är en redan indexerad sida – titeln behålls därför oförändrad.
# Descriptionen skrevs om 2026-07-20 (0.9.186) på användarens uttryckliga begäran:
# den gamla lovade enbart "kroppens anatomiska strukturer", men sidan är sedan
# omstruktureringen en ingång även till studieteknik och klinisk anatomi.
FAKTATEXTER_TITEL = "Faktatexter | Anatomiquiz Kunskapsbank"
FAKTATEXTER_DESC = (
    "Fördjupande artiklar om anatomi och fysiologi, ordnade efter ämnesområde "
    "– från nervsystemet och rörelseapparaten till studieteknik."
)

MALGRUPP_NAMN = {
    "alla": "alla",
    "sjukskoterska": "sjuksköterskestudenter",
    "lakare": "läkarstudenter",
    "fysioterapeut": "fysioterapeutstudenter",
    "arbetsterapeut": "arbetsterapeutstudenter",
    "sprakvetare": "språkintresserade",
    "specialist": "specialistutbildningar",
}

TYP_NAMN = {
    "oversikt": "Översikt",
    "fordjupning": "Fördjupning",
    "jamforelse": "Jämförelse",
    "navsida": "Navsida",
    "guide": "Guide",
}


# ---------------------------------------------------------------------------
# Inläsning och validering
# ---------------------------------------------------------------------------

def load() -> dict:
    return json.loads(REGISTRY.read_text(encoding="utf-8"))


def artikel_url(art: dict) -> str:
    """Sökväg för en artikel.

    Artiklar publicerade före omstruktureringen behåller sin ursprungliga
    URL via fältet "sokvag" – publicerade URL:er ändras aldrig
    (SEO_REGLER §11.E). Nya artiklar hamnar i /kunskapsbank/artiklar/.
    """
    return art.get("sokvag") or f"/kunskapsbank/artiklar/{art['slug']}.html"


def validate(reg: dict) -> list[str]:
    """Returnera lista med fel. Tom lista = allt OK."""
    fel: list[str] = []
    hubbslugs = {h["slug"] for h in reg["hubbar"]}
    pelarslugs = {p["slug"] for p in reg.get("pelare", [])}
    pelare_av_slug = {p["slug"]: p for p in reg.get("pelare", [])}

    seen_slug: set[str] = set()
    seen_poang: dict[str, str] = {}
    seen_desc: dict[str, str] = {}

    for h in reg["hubbar"]:
        d = h["beskrivning"]
        if not 25 <= len(d) <= 150:
            fel.append(f"hubb {h['slug']}: description {len(d)} tecken (krav 25–150)")
        if d in seen_desc:
            fel.append(f"hubb {h['slug']}: description identisk med {seen_desc[d]}")
        seen_desc[d] = f"hubb {h['slug']}"

    for a in reg["artiklar"]:
        s = a["slug"]
        if s in seen_slug:
            fel.append(f"artikel {s}: dubblerad slug")
        seen_slug.add(s)

        # En artikel hänger antingen under en ämneshubb ELLER under en pelare –
        # aldrig båda, aldrig ingendera. Utan tillhörighet blir den föräldralös
        # och saknar brödsmula (§7.5); med två blir den dubblerad i navigationen.
        har_hubb, har_pelare = "hubb" in a, "pelare" in a
        if har_hubb == har_pelare:
            fel.append(
                f"artikel {s}: ange exakt ett av 'hubb' och 'pelare' "
                f"(har {'båda' if har_hubb else 'ingendera'})"
            )
        elif har_hubb and a["hubb"] not in hubbslugs:
            fel.append(f"artikel {s}: okänd hubb '{a['hubb']}'")
        elif har_pelare and a["pelare"] not in pelarslugs:
            fel.append(f"artikel {s}: okänd pelare '{a['pelare']}'")

        if a["typ"] not in TYP_NAMN:
            fel.append(f"artikel {s}: okänd typ '{a['typ']}'")

        mg = a.get("malgrupp", [])
        for m in mg:
            if m not in MALGRUPP_NAMN:
                fel.append(f"artikel {s}: okänd målgrupp '{m}'")
        # §3: målgruppen bestäms FÖRE första meningen och hålls genom texten.
        # "alla" tillsammans med en specifik utbildning är en självmotsägelse –
        # antingen förutsätter texten förkunskaper eller så gör den inte det.
        if "alla" in mg and len(mg) > 1:
            fel.append(f"artikel {s}: målgrupp 'alla' kan inte kombineras med {mg} (§3)")

        # §0.3 / §8.1 – poängen bär unikheten. Två artiklar med samma poäng
        # är en artikel, och två sidor om samma sak kannibaliserar varandra.
        p = a["poang"]
        if p in seen_poang:
            fel.append(f"artikel {s}: poäng identisk med {seen_poang[p]} (§8.1)")
        seen_poang[p] = s

        for dep in a.get("beroenden", []):
            if dep not in seen_slug and dep not in {x["slug"] for x in reg["artiklar"]}:
                fel.append(f"artikel {s}: beroende '{dep}' finns inte i registret")

        # Registrerad men oskriven fil = trasig länk i hubben.
        if a.get("status") == "live":
            p_ = ROOT / artikel_url(a).lstrip("/")
            if not p_.exists():
                fel.append(f"artikel {s}: status live men filen {p_.name} saknas")
            if not a.get("llms"):
                fel.append(f"artikel {s}: fältet 'llms' saknas (krävs för llms.txt)")

            # Pelarsidorna är handskrivna och genereras inte. Registret är ändå
            # sanningen (§1.6), så drift fångas här i stället för att upptäckas
            # som en oåtkomlig artikel långt senare.
            if har_pelare:
                pel = pelare_av_slug[a["pelare"]]
                pelarfil = ROOT / pel["sokvag"].lstrip("/")
                if not pelarfil.exists():
                    fel.append(f"artikel {s}: pelarsidan {pel['sokvag']} saknas")
                elif artikel_url(a) not in pelarfil.read_text(encoding="utf-8"):
                    fel.append(
                        f"artikel {s}: inte länkad från pelarsidan "
                        f"{pel['sokvag']} – lägg in kortet där (§1.5)"
                    )

    return fel


def artiklar_i_hubb(reg: dict, hubbslug: str) -> list[dict]:
    return [
        a for a in reg["artiklar"]
        if a.get("hubb") == hubbslug and a.get("status") == "live"
    ]


def artiklar_i_pelare(reg: dict, pelarslug: str) -> list[dict]:
    return [
        a for a in reg["artiklar"]
        if a.get("pelare") == pelarslug and a.get("status") == "live"
    ]


# ---------------------------------------------------------------------------
# HTML-byggstenar
# ---------------------------------------------------------------------------

def head(*, titel: str, desc: str, canonical: str, og_type: str,
         jsonld: list[str], og_alt: str) -> str:
    """Head enligt SEO_REGLER §1 – samma ordning och fält som index.html."""
    core = titel.split(" | ")[0]
    bloc = "\n".join(f'  <script type="application/ld+json">\n{j}\n  </script>'
                     for j in jsonld)
    return f"""<!doctype html>
<html lang="sv">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'">

  <title>{titel}</title>
  <meta name="description" content="{desc}">
  <meta name="author" content="Daniel Medin (Norrtou Creations)">
  <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large">

  <link rel="canonical" href="{canonical}">
  <link rel="sitemap" type="application/xml" href="/sitemap.xml">

  <meta property="og:type" content="{og_type}">
  <meta property="og:url" content="{canonical}">
  <meta property="og:title" content="{core}">
  <meta property="og:description" content="{desc}">
  <meta property="og:image" content="https://anatomiquiz.se/img/og-image.png">
  <meta property="og:image:width" content="1518">
  <meta property="og:image:height" content="864">
  <meta property="og:image:alt" content="{og_alt}">
  <meta property="og:locale" content="sv_SE">
  <meta property="og:site_name" content="Anatomiquiz">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{core}">
  <meta name="twitter:description" content="{desc}">
  <meta name="twitter:image" content="https://anatomiquiz.se/img/og-image.png">
  <meta name="twitter:image:alt" content="{og_alt}">

  <meta name="theme-color" content="#10b981">
  <meta name="color-scheme" content="light dark">
  <!-- Tema (ljust/mörkt). Laddas SYNKRONT och före stilmallen: attributet
       data-theme måste sitta på <html> innan första målningen, annars
       blinkar sidan ljus. Inline gick inte – CSP:n tillåter bara egen origin. -->
  <script src="/js/theme.js?v={THEME_V}"></script>

{bloc}

  <link rel="icon" type="image/svg+xml" href="/img/favicon.svg">
  <link rel="icon" type="image/png" sizes="64x64" href="/img/favicon.png">
  <link rel="apple-touch-icon" href="/img/icon-192.png">
  <link rel="manifest" href="/manifest.json">
  <link rel="stylesheet" href="/css/styles.css?v={STYLES_V}">
</head>"""


def breadcrumb_jsonld(steg: list[tuple[str, str]]) -> str:
    """BreadcrumbList som EGET block – aldrig nästlat (SEO_REGLER §6)."""
    items = [
        {
            "@type": "ListItem",
            "position": i,
            "name": namn,
            "item": f"{SITE}{href}" if href.startswith("/") else href,
        }
        for i, (namn, href) in enumerate(steg, start=1)
    ]
    return json.dumps(
        {"@context": "https://schema.org", "@type": "BreadcrumbList",
         "itemListElement": items},
        ensure_ascii=False, indent=2,
    )


def breadcrumb_html(steg: list[tuple[str, str]]) -> str:
    ut = ['      <nav class="breadcrumb" aria-label="Brödsmula">']
    for i, (namn, href) in enumerate(steg):
        sista = i == len(steg) - 1
        if i:
            ut.append('        <span class="breadcrumb-sep" aria-hidden="true">/</span>')
        if sista:
            ut.append(f'        <span class="breadcrumb-current" aria-current="page">{namn}</span>')
        elif i == 0:
            ut.append(f'        <a href="{href}" class="breadcrumb-link">← {namn}</a>')
        else:
            ut.append(f'        <a href="{href}" class="breadcrumb-link">{namn}</a>')
    ut.append("      </nav>")
    return "\n".join(ut)


def kort(href: str, titel: str, desc: str, cta: str, status: str = "live",
         etikett: str | None = None) -> str:
    """Ett .kb-card. Kort får ALDRIG innehålla kb-term-tooltips (SEO_REGLER §6c).

    `etikett` sätter statusbrickans text och utelämnas som standard: det som
    ligger uppe behöver ingen "Live"-bricka, bara det som ännu inte finns
    märks ut ("Snart"). På artikelindexet används brickan i stället för
    artikeltypen (Översikt/Guide/…) – samma CSS, information i stället för
    status.
    """
    if status != "live":
        return (
            '        <div class="kb-card is-placeholder">\n'
            '          <span class="kb-status is-soon">Snart</span>\n'
            f'          <h3 class="kb-card-title">{titel}</h3>\n'
            f'          <p class="kb-card-desc">{desc}</p>\n'
            "        </div>"
        )
    bricka = (f'          <span class="kb-status is-live">{etikett}</span>\n'
              if etikett else "")
    return (
        f'        <a class="kb-card" href="{href}">\n'
        f'{bricka}'
        f'          <h3 class="kb-card-title">{titel}</h3>\n'
        f'          <p class="kb-card-desc">{desc}</p>\n'
        f'          <span class="kb-card-go">{cta} →</span>\n'
        "        </a>"
    )


def collection_jsonld(namn: str, desc: str, delar: list[tuple[str, str]]) -> str:
    return json.dumps(
        {
            "@context": "https://schema.org",
            "@type": ["CollectionPage", "LearningResource"],
            "name": namn,
            "description": desc,
            "inLanguage": "sv-SE",
            "isAccessibleForFree": True,
            "learningResourceType": "reference",
            "isPartOf": {"@type": "WebSite", "name": "Anatomiquiz",
                         "url": f"{SITE}/"},
            "hasPart": [
                {"@type": "LearningResource", "name": n,
                 "url": f"{SITE}{u}" if u.startswith("/") else u}
                for n, u in delar
            ],
        },
        ensure_ascii=False, indent=2,
    )


# ---------------------------------------------------------------------------
# Sidor
# ---------------------------------------------------------------------------

def render_faktatexter(reg: dict) -> str:
    """Ingången (N1): ett kort per ämneshubb + länk till Alla artiklar."""
    # Ämnesområden med artiklar först, tomma sist. Besökaren ska mötas av det
    # som faktiskt går att läsa – inte behöva scrolla förbi fyra "Snart"-kort.
    # Inbördes ordning inom varje grupp följer fältet "ordning".
    hubbar = sorted(
        reg["hubbar"],
        key=lambda x: (not artiklar_i_hubb(reg, x["slug"]), x["ordning"]),
    )
    kort_html = []
    for h in hubbar:
        artiklar = artiklar_i_hubb(reg, h["slug"])
        if artiklar:
            antal = len(artiklar)
            cta = f"{antal} artikel" if antal == 1 else f"{antal} artiklar"
            kort_html.append(kort(
                f"/kunskapsbank/artiklar/{h['slug']}.html",
                h["titel"], h["kortbeskrivning"], cta,
            ))
        else:
            kort_html.append(kort("", h["titel"], h["kortbeskrivning"], "",
                                  status="snart"))

    delar = [
        (h["titel"].replace("&amp;", "&"), f"/kunskapsbank/artiklar/{h['slug']}.html")
        for h in sorted(reg["hubbar"], key=lambda x: x["ordning"])
        if artiklar_i_hubb(reg, h["slug"])
    ]
    steg = [("Anatomiquiz", "/"), ("Kunskapsbank", "/kunskapsbank/"),
            ("Faktatexter", "/kunskapsbank/faktatexter.html")]

    antal_tot = len([a for a in reg["artiklar"] if a.get("status") == "live"])

    return f"""{head(
        titel=FAKTATEXTER_TITEL,
        desc=FAKTATEXTER_DESC,
        canonical=f"{SITE}/kunskapsbank/faktatexter.html",
        og_type="website",
        og_alt="Anatomiquiz — faktatexter",
        jsonld=[collection_jsonld("Faktatexter", FAKTATEXTER_DESC, delar),
                breadcrumb_jsonld(steg)],
    )}
<body>

  <a class="skip-link" href="#main">Hoppa till innehåll</a>

  <main id="main" class="container" role="main">

    <header class="header">
      <div class="header-title">
        <h1>Faktatexter</h1>
      </div>
      <p class="tagline">Fördjupande artiklar om <a class="kb-term" href="/ordlista-a.html#term-anatomi" data-def="Läran om kroppens uppbyggnad och organens form och läge">anatomi</a></p>
    </header>

    <section class="card" aria-labelledby="ftHeading">

{breadcrumb_html(steg)}

      <h2 id="ftHeading" class="sr-only">Faktatexter per ämnesområde</h2>

      <div class="kb-grid">

{chr(10).join(kort_html)}

      </div>

      <div class="info-about">
        <p>Faktatexterna är ordnade efter ämnesområde. Varje artikel beskriver hur strukturerna hänger ihop och vad de gör, med källor angivna längst ner på sidan. Alla facktermer går att slå upp i den <a href="/medicinskordlista.html">medicinska ordlistan</a>, och artiklarna leder vidare till en tabell eller ett quiz på samma tema. Området byggs ut efter hand – ämnen märkta <em>Snart</em> har ännu ingen publicerad text.</p>
        <p>Vill du hellre se hela utbudet på en gång finns <a href="/kunskapsbank/artiklar/">alla {antal_tot} artiklar samlade i en lista</a>.</p>
      </div>

      <div class="actions">
        <a href="/kunskapsbank/artiklar/" class="btn">Alla artiklar</a>
        <a href="/kunskapsbank/" class="btn">← Till kunskapsbanken</a>
      </div>

    </section>

  </main>

  <!-- Ordlistetooltips (progressiv förbättring; .kb-term funkar som länk utan JS).
       Utan skriptet ritas ingen tooltip alls – se ARTIKLAR_REGLER §9 och §14. -->
  <script src="/js/kb-glossary.js" defer></script>

</body>
</html>
"""


def render_hubb(reg: dict, h: dict) -> str:
    artiklar = artiklar_i_hubb(reg, h["slug"])
    titel_ren = h["titel"].replace("&amp;", "&")

    kort_html = [
        kort(artikel_url(a), a["titel"], a["kortbeskrivning"], "Läs artikeln")
        for a in artiklar
    ]
    delar = [(a["titel"], artikel_url(a)) for a in artiklar]

    steg = [("Anatomiquiz", "/"), ("Kunskapsbank", "/kunskapsbank/"),
            ("Faktatexter", "/kunskapsbank/faktatexter.html"),
            (h["titel"], f"/kunskapsbank/artiklar/{h['slug']}.html")]

    friskrivning = ""
    if h.get("ansvarsfriskrivning"):
        friskrivning = (
            "\n      <div class=\"info-about\">\n"
            "        <p>Texterna i det här ämnesområdet beskriver anatomi i "
            "utbildningssyfte och är inte medicinsk rådgivning.</p>\n"
            "      </div>\n"
        )

    titel_tag = f"{titel_ren} | Anatomiquiz Kunskapsbank"

    return f"""{head(
        titel=titel_tag,
        desc=h["beskrivning"],
        canonical=f"{SITE}/kunskapsbank/artiklar/{h['slug']}.html",
        og_type="website",
        og_alt=f"Anatomiquiz — {titel_ren.lower()}",
        jsonld=[collection_jsonld(titel_ren, h["beskrivning"], delar),
                breadcrumb_jsonld(steg)],
    )}
<body>

  <a class="skip-link" href="#main">Hoppa till innehåll</a>

  <main id="main" class="container" role="main">

    <header class="header">
      <div class="header-title">
        <h1>{h['titel']}</h1>
      </div>
      <p class="tagline">{h['kortbeskrivning']}</p>
    </header>

    <section class="card" aria-labelledby="hubbHeading">

{breadcrumb_html(steg)}

      <h2 id="hubbHeading" class="sr-only">Artiklar om {titel_ren.lower()}</h2>
{friskrivning}
      <div class="kb-grid">

{chr(10).join(kort_html)}

      </div>

      <div class="actions">
        <a href="/kunskapsbank/artiklar/" class="btn">Alla artiklar</a>
        <a href="/kunskapsbank/faktatexter.html" class="btn">← Till faktatexterna</a>
      </div>

    </section>

  </main>

  <!-- Ordlistetooltips (progressiv förbättring; .kb-term funkar som länk utan JS).
       Utan skriptet ritas ingen tooltip alls – se ARTIKLAR_REGLER §9 och §14. -->
  <script src="/js/kb-glossary.js" defer></script>

</body>
</html>
"""


def render_index(reg: dict) -> str:
    """Alla artiklar (N2) – platt, komplett, utan JS.

    Sidan är till för den som vet vad hen söker, för crawlers och för
    agentisk inläsning. Sökfilter läggs till först vid ~25 artiklar
    (ARTIKLAR_REGLER §10) och ska då filtrera DOM som redan finns.
    """
    live = [a for a in reg["artiklar"] if a.get("status") == "live"]

    # Ämneshubbarna först, pelarna sist. Indexet ska vara komplett – en
    # pelarartikel som saknas här vore osynlig för den som bläddrar listan,
    # för crawlers och för agentisk inläsning (§1.2).
    avdelningar = [
        (h["titel"], h["kortbeskrivning"], artiklar_i_hubb(reg, h["slug"]))
        for h in sorted(reg["hubbar"], key=lambda x: x["ordning"])
    ] + [
        (p["titel"], p["kortbeskrivning"], artiklar_i_pelare(reg, p["slug"]))
        for p in reg.get("pelare", [])
    ]

    grupper = []
    for titel, kortbeskrivning, artiklar in avdelningar:
        if not artiklar:
            continue
        kort_html = []
        for a in artiklar:
            mg = ", ".join(MALGRUPP_NAMN[m] for m in a.get("malgrupp", ["alla"]))
            kort_html.append(kort(
                artikel_url(a), a["titel"],
                f'{a["kortbeskrivning"]} Skriven för {mg}.',
                "Läs artikeln", etikett=TYP_NAMN[a["typ"]],
            ))
        grupper.append(
            f'      <div class="info-about">\n'
            f'        <h2>{titel}</h2>\n'
            f'        <p>{kortbeskrivning}</p>\n'
            f'      </div>\n\n'
            f'      <div class="kb-grid">\n\n'
            + "\n\n".join(kort_html) + "\n\n"
            f'      </div>\n'
        )

    desc = ("Alla artiklar i Anatomiquiz kunskapsbank samlade på ett ställe – "
            "ordnade efter ämnesområde, med typ, målgrupp och innehåll angivet.")
    steg = [("Anatomiquiz", "/"), ("Kunskapsbank", "/kunskapsbank/"),
            ("Faktatexter", "/kunskapsbank/faktatexter.html"),
            ("Alla artiklar", "/kunskapsbank/artiklar/")]
    delar = [(a["titel"], artikel_url(a)) for a in live]

    return f"""{head(
        titel="Alla artiklar | Anatomiquiz Kunskapsbank",
        desc=desc,
        canonical=f"{SITE}/kunskapsbank/artiklar/",
        og_type="website",
        og_alt="Anatomiquiz — alla artiklar",
        jsonld=[collection_jsonld("Alla artiklar", desc, delar),
                breadcrumb_jsonld(steg)],
    )}
<body>

  <a class="skip-link" href="#main">Hoppa till innehåll</a>

  <main id="main" class="container" role="main">

    <header class="header">
      <div class="header-title">
        <h1>Alla artiklar</h1>
      </div>
      <p class="tagline">Hela kunskapsbankens artikelutbud i en lista</p>
    </header>

    <section class="card" aria-labelledby="allaHeading">

{breadcrumb_html(steg)}

      <h2 id="allaHeading" class="sr-only">Alla artiklar per ämnesområde</h2>

      <div class="info-about">
        <p>Här ligger samtliga {len(live)} publicerade artiklar, grupperade efter ämnesområde. Etiketten på varje kort anger artikelns typ, och raden <em>Skriven för</em> vilken läsare texten vänder sig till. En artikel skriven för alla förutsätter inga förkunskaper, medan en som riktar sig till en bestämd utbildning använder fackspråk utan att förklara grunderna.</p>
      </div>

{chr(10).join(grupper)}

      <div class="actions">
        <a href="/kunskapsbank/faktatexter.html" class="btn">← Till faktatexterna</a>
        <a href="/kunskapsbank/" class="btn">Till kunskapsbanken</a>
      </div>

    </section>

  </main>

  <!-- Ordlistetooltips (progressiv förbättring; .kb-term funkar som länk utan JS).
       Utan skriptet ritas ingen tooltip alls – se ARTIKLAR_REGLER §9 och §14. -->
  <script src="/js/kb-glossary.js" defer></script>

</body>
</html>
"""


# ---------------------------------------------------------------------------
# Hjälp till andra generatorer
# ---------------------------------------------------------------------------

def sitemap_urls(reg: dict) -> list[str]:
    """Alla indexerbara artikel-URL:er.

    generate_glossary.write_sitemap() skriver om HELA sitemap.xml och
    importerar den här funktionen – annars försvinner artikelsidorna vid
    nästa ordlistegenerering.
    """
    urls = ["/kunskapsbank/artiklar/"]
    for h in sorted(reg["hubbar"], key=lambda x: x["ordning"]):
        if artiklar_i_hubb(reg, h["slug"]):
            urls.append(f"/kunskapsbank/artiklar/{h['slug']}.html")
    for a in reg["artiklar"]:
        if a.get("status") == "live":
            urls.append(artikel_url(a))
    return urls


# ---------------------------------------------------------------------------

def main() -> int:
    reg = load()

    fel = validate(reg)
    if fel:
        print("VALIDERINGSFEL – inget skrevs:", file=sys.stderr)
        for f in fel:
            print(f"  · {f}", file=sys.stderr)
        return 1

    ARTDIR.mkdir(parents=True, exist_ok=True)

    skrivna = []

    (KB / "faktatexter.html").write_text(render_faktatexter(reg), encoding="utf-8")
    skrivna.append("kunskapsbank/faktatexter.html")

    (ARTDIR / "index.html").write_text(render_index(reg), encoding="utf-8")
    skrivna.append("kunskapsbank/artiklar/index.html")

    for h in sorted(reg["hubbar"], key=lambda x: x["ordning"]):
        if not artiklar_i_hubb(reg, h["slug"]):
            continue
        (ARTDIR / f"{h['slug']}.html").write_text(render_hubb(reg, h), encoding="utf-8")
        skrivna.append(f"kunskapsbank/artiklar/{h['slug']}.html")

    for f in skrivna:
        print(f"skrev {f}")

    tomma = [h["titel"] for h in reg["hubbar"] if not artiklar_i_hubb(reg, h["slug"])]
    if tomma:
        print("\nHubbar utan artiklar (visas som 'Snart'-kort, ingen egen sida):")
        for t in tomma:
            print(f"  · {t.replace('&amp;', '&')}")

    print("\nPåminnelse (SEO_REGLER §11.B): sitemap.xml regenereras av "
          "generate_glossary.py – kör den efteråt, och därefter generate_llms.py "
          "(artikelns rad i llms.txt/llms-full.txt kommer ur fältet 'llms' här "
          "plus 'kort' i data/llms.json).")
    # Generatorn skriver ren HTML utan tooltips (SEO_REGLER §6c). Utan det här
    # steget tappar de genererade sidorna sina kb-term-länkar vid varje körning.
    print("Kör därefter: python3 scripts/wire_terms.py --all "
          "(generatorn nollställer tooltipsen på sidorna den skriver).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
