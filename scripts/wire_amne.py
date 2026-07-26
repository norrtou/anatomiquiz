#!/usr/bin/env python3
"""Skriv in `about`, `teaches` och `keywords` i varje sidas JSON-LD-huvudnod.

Registret bor i `scripts/amne.py`; det här skriptet gör inget annat än att
kontrollera det mot sidorna och skriva in det. *Var* egenskaperna ska stå — i
den nod som beskriver sidan — avgörs av `scripts/jsonld.py`, som delas med
`wire_identity.py` och `wire_dates.py`. `FAQPage` och `BreadcrumbList`
beskriver något annat än sidan och lämnas i fred, samma gräns som de drar.

**Kontrollen som gör fältet ärligt: varje namn i `about` och varje `keyword`
måste stå i sidans egen text.** Utan den är `keywords` ett fält där vad som
helst kan påstås utan att någon läsare kan se det, och `about` blir en
önskelista i stället för en ämnesangivelse. Regeln är densamma som gör att
`citation` läses ur den synliga referenslistan och att `FAQPage` måste spegla
den synliga FAQ:n: **strukturdatan rättas efter sidan, aldrig tvärtom**
(SEO_REGLER §6, §6b). Vid införandet 2026-07-26 fällde den fyra påståenden som
legat i märkningen sedan sidorna skrevs — "Human anatomi", "Myologi" och
"Artrologi" på startsidan och "Spaced repetition" på `spellagen.html` — och
inget av dem stod någonstans på sin sida.

**`<meta name="keywords">` är en annan sak och ska aldrig tillbaka.** Taggen
togs bort i 0.9.56 på användarens begäran; den är en död signal sedan 2009 och
strider dessutom mot att nya sidor ska följa `index.html`:s mall. Att den här
punkten inför ett fält som *heter* keywords gör det extra lätt att av misstag
lägga tillbaka den, så kontrollen ligger här: hittas taggen på någon sida
stoppar bygget.

Steget ligger efter `wire_identity.py` i kedjan. Skälet är detsamma som gör att
identiteten ligger efter `generate_glossary.py`: glossary-generatorn skriver om
ordlistans 32 sidor och hade skrivit över egenskaperna i vilket tidigare läge
som helst.

Användning:
    python3 scripts/wire_amne.py --all
    python3 scripts/wire_amne.py --check --all    # exit 1 om något ändras
    python3 scripts/wire_amne.py kunskapsbank/muskeltabell-handen.html
"""
import html as _html
import json
import pathlib
import re
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from amne import SIDOR, kontrollera_register  # noqa: E402
from jsonld import ROOT, alla_sidor, antal_sidnoder, skriv_i_sidnod, sätt  # noqa: E402

TITEL_RX = re.compile(r"<title>(.*?)</title>", re.S)
DESC_RX = re.compile(r'name="description" content="(.*?)"')
MAIN_RX = re.compile(r"<main\b.*?</main>", re.S)
TAGG_RX = re.compile(r"<[^>]+>")
BLANKSTEG_RX = re.compile(r"\s+")

# Den döda taggen. Mönstret matchar oavsett attributordning och citattecken.
META_KEYWORDS_RX = re.compile(r"<meta[^>]+name=[\"']keywords[\"']", re.I)


def sidtext(html: str) -> str:
    """Sidans egen text — titel, description och `<main>` — normaliserad.

    Bara det som en läsare faktiskt möter räknas. `<head>` i övrigt är uteslutet
    med avsikt: att ett ord står i en OG-tagg gör det inte till något sidan
    säger. JSON-LD ligger också utanför, vilket är hela poängen — annars hade
    kontrollen godkänt sig själv efter första körningen.
    """
    delar = []
    for rx in (TITEL_RX, DESC_RX):
        m = rx.search(html)
        if m:
            delar.append(m.group(1))
    m = MAIN_RX.search(html)
    if not m:
        raise ValueError(
            "sidan saknar <main> och har därför ingen text att stämma av "
            "about och keywords mot (SEO_REGLER §7).")
    delar.append(m.group(0))
    text = _html.unescape(TAGG_RX.sub(" ", " ".join(delar)))
    return BLANKSTEG_RX.sub(" ", text).casefold()


def kontrollera_mot_sidan(rel: str, html: str) -> None:
    """Varje `about`-namn och varje nyckelord ska stå på sidan."""
    ämne = SIDOR[rel]
    text = sidtext(html)

    saknade = [n for _, n in ämne.om if n.casefold() not in text]
    if saknade:
        raise ValueError(
            f"dessa about-namn står inte i sidans text: {saknade}. "
            "Strukturdatan får inte påstå ett ämne som sidan aldrig nämner — "
            "skriv om posten i scripts/amne.py, eller skriv in ämnet på sidan "
            "först (SEO_REGLER §6).")

    saknade = [k for k in ämne.nyckelord if k.casefold() not in text]
    if saknade:
        raise ValueError(
            f"dessa nyckelord står inte i sidans text: {saknade}. "
            "Ett nyckelord som inte finns på sidan är keyword-stuffing, "
            "oavsett hur relevant det känns. Rätta posten i scripts/amne.py.")


def wire_html(rel: str, html: str) -> str:
    """Returnera html med about/teaches/keywords satta i sidans huvudnod(er)."""
    kontrollera_mot_sidan(rel, html)
    ämne = SIDOR[rel]
    about = [{"@type": typ, "name": namn} for typ, namn in ämne.om]

    def egenskaper(block):
        block = sätt(block, "about", about)
        if ämne.lär_ut:
            block = sätt(block, "teaches", list(ämne.lär_ut))
        if ämne.nyckelord:
            block = sätt(block, "keywords", list(ämne.nyckelord))
        return block

    return skriv_i_sidnod(html, egenskaper)


def kontrollera_meta_keywords(filer) -> list[str]:
    """Sidor som fått tillbaka `<meta name="keywords">` (ska vara noll)."""
    träffar = []
    for f in filer:
        if META_KEYWORDS_RX.search(f.read_text(encoding="utf-8")):
            träffar.append(f.relative_to(ROOT).as_posix())
    return träffar


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

    sidor = alla_sidor()
    kontrollera_register({p.relative_to(ROOT).as_posix() for p in sidor})

    döda = kontrollera_meta_keywords(sidor)
    if döda:
        print(f"STOPP: <meta name=\"keywords\"> ligger på {döda}. Taggen togs "
              "bort i 0.9.56 och ska aldrig tillbaka — den är en död "
              "SEO-signal sedan 2009 och saknas på index.html, som är mallen "
              "(SEO_REGLER §1). JSON-LD:ts `keywords` är en annan sak.",
              file=sys.stderr)
        return 1

    filer = sidor if argv[0] == "--all" else [ROOT / a for a in argv]

    ändrade, noder = 0, 0
    for f in filer:
        rel = f.relative_to(ROOT).as_posix()
        html = f.read_text(encoding="utf-8")
        try:
            ny = wire_html(rel, html)
        except (ValueError, KeyError, json.JSONDecodeError) as e:
            print(f"STOPP i {rel}: {e}", file=sys.stderr)
            return 1
        noder += antal_sidnoder(html)
        if ny != html:
            ändrade += 1
            if check:
                print(f"  {rel}: about/teaches/keywords skulle skrivas")
            else:
                f.write_text(ny, encoding="utf-8")

    verb = "skulle skrivas" if check else "skrivna"
    print(f"about + teaches + keywords {verb} i {noder} sidnoder över "
          f"{ändrade} av {len(filer)} sidor.")
    return 1 if (check and ändrade) else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
