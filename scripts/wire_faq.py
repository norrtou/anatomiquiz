#!/usr/bin/env python3
"""Skriv sidans `FAQPage` ur dess egen, synliga FAQ (`#faq`).

SEO_REGLER §6 har sedan juli 2026 sagt att FAQPage-blocket SKA genereras ur den
synliga HTML:en och att ett handskrivet block är ett regelbrott. Men det fanns
inget steg i kedjan som gjorde det (ARTIKLAR_REGLER §14, 2026-07-26). Alla 21
block var handskrivna, och det enda skyddet var jämförelsen i §12-snutten, som
bara upptäcker ett fel i efterhand. Två gånger hade blocket redan glidit isär
från sidan: `deklinationer-pluralformer.html` (sex frågor i märkningen, sju på
sidan) och `grekiska-i-medicinen.html` (samtliga sex svar omskrivna i
märkningen men inte på sidan).

**Källan är den synliga FAQ:n, inte ett register vid sidan om.** Samma princip
som `wire_citations.py`: det som står i strukturdatan kan då inte avvika från
det läsaren ser, och en ändrad fråga på sidan slår igenom av sig själv vid
nästa körning. Riktningen är given: märkningen följer sidan, aldrig tvärtom.

Två markupformer förekommer i `#faq`, och båda läses:

    <p><strong>Fråga?</strong><br>Svar.</p>            artiklar och tabellsidor
    <h3 …>Fråga?</h3>  <p>Svar.</p>                    medicinskordlista, info, spellägen

Frågan och svaret skrivs som ren text: taggarna (tooltips, `<em>`, länkar)
stryks, entiteterna avkodas och blanksteg slås ihop.

**Skriptet gissar inte.** Allt i `#faq` som inte är en rubrik, en fråga eller
ett svar på ett stycke stoppar körningen i stället för att tyst lämnas utanför
(CLAUDE_REGLER §0.4). Detsamma gäller ett `FAQPage`-block på en sida utan
synlig FAQ (märkningen hade då lovat innehåll som läsaren aldrig ser) och en
sida med två `#faq`.

Blocket skrivs om, det hoppas inte över. Ett befintligt block ersätts i sin
helhet, liksom en FAQ-kommentar direkt ovanför det. Saknas blocket läggs det
in efter sidans sista ld+json-block, så en ny sida med synlig FAQ får sin
märkning utan att någon behöver skriva den. JSON-LD räknas inte som innehåll i
`sidodatum.py`, så steget flyttar inga datum.

Användning:
    python3 scripts/wire_faq.py --all
    python3 scripts/wire_faq.py --check --all    # exit 1 om något skulle ändras
    python3 scripts/wire_faq.py kunskapsbank/ledtyper.html
"""
import html as htmlmod
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent

LD = re.compile(r'(<script type="application/ld\+json">)(.*?)(</script>)', re.S)
KOMMENTAR = re.compile(r"<!--.*?-->", re.S)
FAQ_START = re.compile(r'<(div|section)\b[^>]*\bid="faq"[^>]*>')
H2 = re.compile(r"<h2\b[^>]*>.*?</h2>", re.S)
H3 = re.compile(r"<h3\b[^>]*>(.*?)</h3>", re.S)
STYCKE = re.compile(r"<p\b[^>]*>(.*?)</p>", re.S)
STRONG_PAR = re.compile(r"\s*<strong>(.*?)</strong>\s*<br\s*/?>(.*)\Z", re.S)
OMSLAG = re.compile(r"</?(div|section)\b[^>]*>")

# Kommentaren ovanför blocket. Skriptet äger den och skriver om den varje gång.
# Den nämner aldrig id-attributet ordagrant: då hade FAQ_START kunnat träffa
# texten i en kommentar i stället för sektionen (se info.html före 0.9.441).
KOMMENTARTEXT = ("<!-- FAQPage skrivs av scripts/wire_faq.py ur sidans synliga FAQ "
                 "(#faq). Ändra frågorna på sidan, aldrig här (SEO_REGLER §6). -->")


class FaqFel(ValueError):
    pass


def ren_text(markup):
    """Synlig text ur inline-HTML: taggar bort, entiteter avkodade, blanksteg ihop."""
    s = re.sub(r"<br\s*/?>", " ", markup)
    s = re.sub(r"<[^>]+>", "", s)
    return re.sub(r"\s+", " ", htmlmod.unescape(s)).strip()


def faq_sektion(html):
    """Innehållet i sidans #faq-element, eller None om sidan saknar det.

    Kommentarer maskas bort först, så att en kommentar som råkar citera
    id-attributet inte kan tas för sektionen. Elementets slut hittas genom att
    räkna djupet på samma taggnamn — sektionen innehåller ofta egna <div>.
    """
    utan = KOMMENTAR.sub("", html)
    träffar = list(FAQ_START.finditer(utan))
    if not träffar:
        return None
    if len(träffar) > 1:
        raise FaqFel(f"{len(träffar)} element med id faq — sidan får ha ett")
    m = träffar[0]
    tagg = re.compile(r"<(/?)%s\b[^>]*>" % m.group(1))
    djup = 1
    for t in tagg.finditer(utan, m.end()):
        djup += -1 if t.group(1) else 1
        if djup == 0:
            return utan[m.end():t.start()]
    raise FaqFel(f"<{m.group(1)}> med id faq stängs aldrig")


def _kontrollera_rest(rest, form):
    """Stoppa om något annat än omslag och blanksteg finns kvar i sektionen."""
    kvar = OMSLAG.sub("", rest).strip()
    if kvar:
        raise FaqFel(
            f"innehåll i #faq som varken är rubrik, fråga eller svar ({form}-formen): "
            f"{ren_text(kvar)[:80] or kvar[:80]!r}. En FAQ ska bestå av fråga + svar på "
            "ett stycke; lägg annan text utanför sektionen, eller lär wire_faq.py formen.")


def frågor(sektion):
    """[(fråga, svar)] ur sektionens synliga markup, i sidans ordning."""
    sektion = H2.sub("", sektion, count=1)
    par = []
    if H3.search(sektion):
        delar = H3.split(sektion)
        _kontrollera_rest(delar[0], "h3")
        for fråga, efter in zip(delar[1::2], delar[2::2]):
            stycken = STYCKE.findall(efter)
            if len(stycken) != 1:
                raise FaqFel(
                    f"frågan {ren_text(fråga)!r} har {len(stycken)} svarsstycken — "
                    "svaret ska vara exakt ett <p>")
            _kontrollera_rest(STYCKE.sub("", efter), "h3")
            par.append((ren_text(fråga), ren_text(stycken[0])))
    else:
        for stycke in STYCKE.findall(sektion):
            m = STRONG_PAR.match(stycke)
            if not m:
                raise FaqFel(
                    f"stycke i #faq som inte är <strong>fråga</strong><br>svar: "
                    f"{ren_text(stycke)[:80]!r}")
            par.append((ren_text(m.group(1)), ren_text(m.group(2))))
        _kontrollera_rest(STYCKE.sub("", sektion), "strong")

    if not par:
        raise FaqFel("#faq finns men innehåller ingen fråga — blocket hade blivit tomt")
    for fråga, svar in par:
        if not fråga or not svar:
            raise FaqFel(f"tom fråga eller tomt svar: {fråga!r}")
    namn = [f for f, _ in par]
    dubbletter = sorted({f for f in namn if namn.count(f) > 1})
    if dubbletter:
        raise FaqFel(f"samma fråga två gånger: {dubbletter[0]!r}")
    return par


def faq_nod(par):
    return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "inLanguage": "sv-SE",
        "mainEntity": [
            {
                "@type": "Question",
                "name": fråga,
                "acceptedAnswer": {"@type": "Answer", "text": svar},
            }
            for fråga, svar in par
        ],
    }


def _är_faqblock(m):
    try:
        data = json.loads(m.group(2))
    except json.JSONDecodeError as e:
        raise FaqFel(f"ogiltig JSON i ett ld+json-block: {e}") from e
    typ = data.get("@type") if isinstance(data, dict) else None
    typer = set(typ if isinstance(typ, list) else [typ])
    if "FAQPage" in typer and typer != {"FAQPage"}:
        raise FaqFel(f"FAQPage delar nod med {sorted(typer - {'FAQPage'})} — ska stå i eget block")
    return "FAQPage" in typer


def wire_html(html):
    """Returnera html med FAQPage-blocket skrivet ur sidans #faq."""
    sektion = faq_sektion(html)
    block = [m for m in LD.finditer(html) if _är_faqblock(m)]
    if sektion is None:
        if block:
            raise FaqFel("FAQPage-block men ingen synlig FAQ — märkningen lovar "
                         "innehåll som läsaren aldrig ser. Ta bort blocket eller "
                         "skriv FAQ:n på sidan")
        return html
    if len(block) > 1:
        raise FaqFel(f"{len(block)} FAQPage-block — sidan får ha ett")

    nytt_json = json.dumps(faq_nod(frågor(sektion)), ensure_ascii=False, indent=2)

    if block:
        m = block[0]
        radstart = html.rfind("\n", 0, m.start()) + 1
        indrag = html[radstart:m.start()]
        start = radstart
        # En FAQ-kommentar direkt ovanför blocket är skriptets egen (eller en
        # handskriven föregångare) och skrivs om tillsammans med blocket.
        före = html[:radstart]
        k = re.search(r"([ \t]*)<!--(?:(?!-->).)*-->[ \t]*\n\Z", före, re.S)
        if k and "FAQPage" in k.group(0):
            start = k.start()
        slut = m.end()
    else:
        alla = list(LD.finditer(html))
        huvud_slut = html.find("</head>")
        alla = [m for m in alla if huvud_slut < 0 or m.end() < huvud_slut]
        if not alla:
            raise FaqFel("synlig FAQ men inget ld+json-block att lägga FAQPage efter")
        sista = alla[-1]
        radstart = html.rfind("\n", 0, sista.start()) + 1
        indrag = html[radstart:sista.start()]
        start = slut = sista.end()
        return (html[:start] + "\n" + indrag + KOMMENTARTEXT + "\n" + indrag
                + '<script type="application/ld+json">\n' + nytt_json + "\n"
                + indrag + "</script>" + html[slut:])

    return (html[:start] + indrag + KOMMENTARTEXT + "\n" + indrag
            + '<script type="application/ld+json">\n' + nytt_json + "\n"
            + indrag + "</script>" + html[slut:])


def varför(html):
    """Kort besked om VAD som skiljer sig — innehåll, form eller saknat block.

    "Speglar inte" räcker inte som besked: en formändring och ett isärglidet
    svar kräver helt olika uppmärksamhet av den som läser --check.
    """
    block = [m for m in LD.finditer(html) if _är_faqblock(m)]
    if not block:
        return "FAQPage-block saknas"
    synligt = frågor(faq_sektion(html))
    märkt = [(q.get("name"), q.get("acceptedAnswer", {}).get("text"))
             for q in json.loads(block[0].group(2)).get("mainEntity", [])]
    if len(märkt) != len(synligt):
        return f"{len(märkt)} frågor i märkningen, {len(synligt)} på sidan"
    for n, (a, b) in enumerate(zip(märkt, synligt), 1):
        if a[0] != b[0]:
            return f"fråga {n} avviker från sidan"
        if a[1] != b[1]:
            return f"svaret på fråga {n} avviker från sidan"
    return "samma frågor och svar, men blocket har inte skriptets form"


def alla_sidor():
    """Varje sida med synlig FAQ ELLER ett FAQPage-block.

    Båda villkoren behövs: urvalet på bara #faq hade aldrig sett ett block som
    blivit kvar på en sida vars FAQ tagits bort.
    """
    sidor = []
    for p in sorted(ROOT.rglob("*.html")):
        if "_arkiv" in p.parts or ".git" in p.parts:
            continue
        html = p.read_text(encoding="utf-8")
        if FAQ_START.search(KOMMENTAR.sub("", html)) or '"FAQPage"' in html:
            sidor.append(p)
    return sidor


def main(argv):
    if not argv:
        print(__doc__)
        return 0
    check = argv[0] == "--check"
    if check:
        argv = argv[1:]
    if not argv:
        print("--check kräver filer eller --all", file=sys.stderr)
        return 1
    filer = alla_sidor() if argv[0] == "--all" else [ROOT / a for a in argv]
    if argv[0] == "--all" and not filer:
        print("STOPP: ingen sida med synlig FAQ hittades — urvalet är trasigt "
              "(sajten har haft 21).", file=sys.stderr)
        return 1

    ändrade, antal = [], 0
    for f in filer:
        html = f.read_text(encoding="utf-8")
        try:
            ny = wire_html(html)
            sektion = faq_sektion(html)
            antal += len(frågor(sektion)) if sektion is not None else 0
        except FaqFel as e:
            print(f"STOPP i {f.relative_to(ROOT)}: {e}", file=sys.stderr)
            return 1
        if ny != html:
            ändrade.append(f)
            if check:
                print(f"  {f.relative_to(ROOT)}: {varför(html)}")
            else:
                f.write_text(ny, encoding="utf-8")

    verb = "skulle skrivas om" if check else "omskrivna"
    print(f"{antal} frågor på {len(filer)} sidor med FAQ, {len(ändrade)} sidor {verb}.")
    return 1 if (check and ändrade) else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
