#!/usr/bin/env python3
"""Delade byggstenar för de skript som skriver i sidornas JSON-LD.

`wire_identity.py` (author/publisher) och `wire_dates.py` (datePublished/
dateModified) gör samma sak på olika egenskaper: de letar upp den nod som
beskriver *sidan* och sätter en toppnivåegenskap i den, på plats, utan att
röra resten av blocket.

Modulen finns för att **HUVUDTYPER bara får definieras en gång**. Låg listan i
båda skripten skulle ett nytt sidslag kunna hamna i det ena och inte i det
andra, och då hade sidan tyst fått författare men inget datum — precis den
sortens tystnad CLAUDE_REGLER §0.4 handlar om. Punkt 14 i SEO-svepet
(`about`/`teaches`/`keywords`) ska använda samma modul.
"""
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent

LD = re.compile(r'(<script type="application/ld\+json">)(.*?)(</script>)', re.S)

# Noder som beskriver SIDAN och därför bär sidans författare, utgivare och datum.
HUVUDTYPER = {"Article", "LearningResource", "CollectionPage", "WebApplication",
              "AboutPage", "DefinedTermSet", "WebPage"}

# Noder som beskriver något annat än sidan. En FAQ har ingen egen författare
# och inget eget ändringsdatum.
UNDANTAG = {"FAQPage", "BreadcrumbList"}


def typer(data):
    typ = data.get("@type")
    return set(typ if isinstance(typ, list) else [typ])


def är_sidnod(data):
    t = typer(data)
    return bool(t & HUVUDTYPER) and not (t & UNDANTAG)


def _indrag(block):
    """(basindrag, innerindrag) för JSON-objektet i ett ld+json-block."""
    rader = [r for r in block.split("\n") if r.strip()]
    bas = re.match(r"\s*", rader[0]).group(0)
    inner = re.match(r"\s*", rader[1]).group(0) if len(rader) > 1 else bas + "  "
    return bas, inner


def _toppnivå(block, inner, namn):
    """(start, slut) för raden `"namn": <värde>` på objektets toppnivå.

    Toppnivån känns igen på indraget: `json.dumps(indent=2)` ger varje
    toppnivåegenskap exakt `inner` som radbörjan, medan allt djupare ligger
    längre in. Värdets slut hittas med `raw_decode`, som klarar godtyckligt
    nästlade objekt och listor — en regex hade fallit på första `}` i en
    inbäddad nod.
    """
    nyckel = f'\n{inner}"{namn}": '
    i = block.find(nyckel)
    if i < 0:
        return None
    start = i + 1
    _, slut = json.JSONDecoder().raw_decode(block, start + len(nyckel) - 1)
    return start, slut


def _formatera(inner, namn, värde):
    """`"namn": <värde>` med `värde` indraget till objektets toppnivå."""
    kropp = json.dumps(värde, ensure_ascii=False, indent=2)
    rader = kropp.split("\n")
    kropp = "\n".join([rader[0]] + [inner + r for r in rader[1:]])
    return f'{inner}"{namn}": {kropp}'


def sätt(block, namn, värde, före=("citation",)):
    """Returnera blocket med toppnivåegenskapen `namn` satt till `värde`.

    Finns egenskapen ersätts den **på plats**, så att egenskapernas ordning
    bevaras och diffen stannar vid det som faktiskt ändras. Saknas den infogas
    den före den första egenskapen i `före` som finns, annars sist.
    """
    bas, inner = _indrag(block)
    ny = _formatera(inner, namn, värde)

    träff = _toppnivå(block, inner, namn)
    if träff:                                  # ersätt på plats
        start, slut = träff
        return block[:start] + ny + block[slut:]

    for ankarnamn in före:                     # infoga före känt ankare
        ankare = _toppnivå(block, inner, ankarnamn)
        if ankare:
            start = ankare[0]
            return block[:start] + ny + ",\n" + block[start:]

    slut = block.rstrip()                      # infoga sist, före rotens }
    if not slut.endswith("}"):
        raise ValueError("ld+json-blocket slutar inte med }")
    svans = block[len(slut):]
    return slut[:-1].rstrip() + ",\n" + ny + "\n" + bas + "}" + svans


def skriv_i_sidnod(html, sätt_egenskaper):
    """Kör `sätt_egenskaper(block) -> block` på varje nod som beskriver sidan.

    En sida som bär JSON-LD men ingen nod som beskriver sidan är ett fel, inte
    ett specialfall: den hade tyst blivit utan det som skulle skrivas. Så
    upptäcktes att `WebPage` saknades i HUVUDTYPER — men bara för att någon
    råkade titta. Därför stannar bygget i stället (CLAUDE_REGLER §0.4).
    """
    träffade = [0]

    def skriv(m):
        data = json.loads(m.group(2))
        if "@graph" in data:
            raise ValueError("@graph stöds inte — egenskapen skulle hamna fel")
        if not är_sidnod(data):
            return m.group(0)
        träffade[0] += 1
        return m.group(1) + sätt_egenskaper(m.group(2)) + m.group(3)

    ny = LD.sub(skriv, html)
    if not träffade[0]:
        t = sorted({x for m in LD.finditer(html) for x in typer(json.loads(m.group(2)))})
        raise ValueError(
            "ingen nod som beskriver sidan — egenskapen hade tyst uteblivit. "
            f"Sidans typer: {', '.join(t) or '(inga)'}. Hör någon av dem hemma "
            "i HUVUDTYPER?")
    return ny


def antal_sidnoder(html):
    return sum(1 for m in LD.finditer(html) if är_sidnod(json.loads(m.group(2))))


def alla_sidor():
    """Alla spårbara HTML-sidor som bär minst ett ld+json-block."""
    return sorted(p for p in ROOT.rglob("*.html")
                  if "_arkiv" not in p.parts
                  and LD.search(p.read_text(encoding="utf-8")))
