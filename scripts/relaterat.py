#!/usr/bin/env python3
"""Kartan över vilka kunskapsbankssidor som hör ihop — "Se även"-blocket.

Mätt 2026-07-26 över alla 119 sidor: **36 kunskapsbankssidor hade exakt en
ingående intern länk**, och den kom i samtliga fall från sidans egen hubb
(skelett 11, muskeltabeller 13, kärl 6, leder 4, nervtabeller 2). Utgående
länkar till ordlistan är täta — `muskeltabell-handen.html` länkar till 30+
termankare — men **sidhorisontellt** fanns nästan ingenting: handen visste inte
om underarmen, och fotens ben visste inte om fotens muskler. Det begränsar både
crawldjupet och hur ämnesauktoritet samlas.

**Relationerna är grupper, inte par.** En grupp skrivs en gång och blir
symmetrisk av sig själv. Par hade krävt att samma relation skrevs två gånger —
`handen → underarmen` och `underarmen → handen` — och två strängar för samma
sak glider isär, precis som friskrivningen gjorde före 0.9.271 (SEO_REGLER §6e).

**`kärna` och `vidare` finns för att översiktssidorna inte kan svara symmetriskt.**
`karl-armen.html` täcker skuldra, överarm, underarm och hand. Låg den i alla fyra
regiongrupperna som `kärna` hade den fått tio länkar tillbaka, och "Se även" hade
blivit en sitemap. Den står därför som `vidare` i regiongrupperna — regionens
sidor länkar till den, den länkar inte tillbaka — och får sina egna länkar ur
familjegruppen längst ner, där granulariteten matchar. Ingen relation skrivs
någonstans två gånger, så ingen kan glida isär.

**Vilka sidor som hör ihop är anatomiskt omdöme och skrivs för hand**
(CLAUDE_REGLER §0.3 punkt 2). Att göra relationen symmetrisk, hålla den under
taket, läsa länktexten ur målsidans egen `<h1>` och rendera blocket är
mekaniskt, och görs av `wire_relaterat.py`.

**Varje kunskapsbankssida ska stå i en `kärna` eller i `UTAN_RELATERAT` med
skäl** (§0.4). En ny sida som inte gör någotdera stoppar bygget — tyst uteblivet
ser annars ut som en lyckad körning, vilket var precis felet i `llms.txt`, där
30 av 117 sidor saknades utan att något larmade (SEO-svepets punkt 12).

Användning:
    python3 scripts/relaterat.py        # visa kartan, länkantalen och blocket
"""
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent

# Fler än så är ingen "Se även" utan en sitemap. Taket är hårt: en karta som
# spränger det är en karta som ska skrivas om, inte en lista som ska klippas.
MAX_LANKAR = 6

KB = "kunskapsbank/"


def _s(namn: str) -> str:
    return KB + namn + ".html"


# ---------------------------------------------------------------------------
# Kedjor — angränsande segment i samma tabellfamilj
# ---------------------------------------------------------------------------
# En kedja är inte en klick: handen hör ihop med underarmen, inte med skuldran.
# Varje sida relaterar därför bara till sin granne, och listan expanderas till
# intilliggande par nedan. Skrivet som en kedja för att relationen ska stå EN
# gång — samma skäl som grupperna finns för.
KEDJOR = [
    ("musklerna i övre extremiteten",
     ["muskeltabell-skuldran", "muskeltabell-overarmen",
      "muskeltabell-underarmen", "muskeltabell-handen"]),
    ("musklerna i nedre extremiteten",
     ["muskeltabell-hoften", "muskeltabell-laret",
      "muskeltabell-underbenet", "muskeltabell-foten"]),
    ("musklerna i bålen",
     ["muskeltabell-halsen", "muskeltabell-ryggen", "muskeltabell-brostkorgen",
      "muskeltabell-bukvaggen", "muskeltabell-backenbotten"]),
    ("musklerna i huvudet",
     ["muskeltabell-ogat", "muskeltabell-ansiktet", "muskeltabell-kaken",
      "muskeltabell-halsen"]),
    ("benen i övre extremiteten",
     ["skelett-skuldran", "skelett-overarmen", "skelett-underarmen",
      "skelett-handen"]),
    ("benen i nedre extremiteten",
     ["skelett-hoften", "skelett-laret", "skelett-underbenet",
      "skelett-foten"]),
    # Axialskelettet kraniokaudalt: revbenen ledar mot bröstkotorna, så
    # bröstkorgen hänger på ryggen och inte på höften.
    ("axialskelettet",
     ["skelett-skallen", "skelett-halsen", "skelett-ryggen",
      "skelett-brostkorgen"]),
]

# ---------------------------------------------------------------------------
# Regiongrupper — samma kroppsregion, olika vävnadssystem
# ---------------------------------------------------------------------------
# Ordningen är den blocken renderas i: regionens egna sidor först, sedan
# kedjegrannarna, sedan familjegrupperna.
REGIONER = [
    # ---- Övre extremiteten ----------------------------------------------
    ("skuldran", ["muskeltabell-skuldran", "skelett-skuldran"],
     ["leder-overextremitet", "nervtabell-armen", "karl-armen"]),
    ("överarmen", ["muskeltabell-overarmen", "skelett-overarmen"],
     ["leder-overextremitet", "nervtabell-armen", "karl-armen"]),
    ("underarmen", ["muskeltabell-underarmen", "skelett-underarmen"],
     ["leder-overextremitet", "nervtabell-armen", "karl-armen"]),
    ("handen", ["muskeltabell-handen", "skelett-handen"],
     ["leder-overextremitet", "nervtabell-armen", "karl-armen"]),
    # ---- Nedre extremiteten ---------------------------------------------
    # Bäckenbottnen står som vidare här, inte kärna: den hör ihop med bäckenet
    # (m. obturatorius internus och m. piriformis räknas till båda grupperna),
    # men hämtar sina egna länkar ur bukväggsgruppen. Utan raden hade den haft
    # en enda ingående länk kvar — vidare fungerar lika bra åt det hållet.
    ("höften", ["muskeltabell-hoften", "skelett-hoften"],
     ["leder-nedreextremitet", "nervtabell-benet", "karl-benet",
      "muskeltabell-backenbotten"]),
    ("låret", ["muskeltabell-laret", "skelett-laret"],
     ["leder-nedreextremitet", "nervtabell-benet", "karl-benet"]),
    ("underbenet", ["muskeltabell-underbenet", "skelett-underbenet"],
     ["leder-nedreextremitet", "nervtabell-benet", "karl-benet"]),
    ("foten", ["muskeltabell-foten", "skelett-foten"],
     ["leder-nedreextremitet", "nervtabell-benet", "karl-benet"]),
    # ---- Bålen -----------------------------------------------------------
    ("ryggen", ["muskeltabell-ryggen", "skelett-ryggen"],
     ["leder-bal-nacke", "nervtabell-balen"]),
    ("bröstkorgen", ["muskeltabell-brostkorgen", "skelett-brostkorgen"],
     ["karl-brostkorgen", "nervtabell-balen"]),
    # Bukväggen har ingen egen skelettsida — musklerna fäster i revbensbågen
    # och höftbenskammen, så de två skelettsidorna står som vidare i stället.
    ("bukväggen", ["muskeltabell-bukvaggen"],
     ["skelett-brostkorgen", "skelett-hoften", "karl-buken",
      "nervtabell-balen"]),
    ("bäckenbotten", ["muskeltabell-backenbotten"],
     ["skelett-hoften", "karl-backenet", "nervtabell-balen"]),
    # nervtabell-halsen står som vidare, inte kärna: den hämtar sina egna
    # länkar ur nervtabellfamiljen och hade annars fått åtta.
    ("halsen", ["muskeltabell-halsen", "skelett-halsen"],
     ["nervtabell-halsen", "karl-huvud-hals", "leder-bal-nacke"]),
    # ---- Huvudet ---------------------------------------------------------
    ("huvudet", ["muskeltabell-ansiktet", "muskeltabell-ogat",
                 "skelett-skallen", "kranialnerverna"],
     ["karl-huvud-hals"]),
    ("käken", ["muskeltabell-kaken", "leder-kaken"],
     ["skelett-skallen", "kranialnerverna"]),
]

# ---------------------------------------------------------------------------
# Familjegrupper — översiktssidorna, där granulariteten matchar
# ---------------------------------------------------------------------------
FAMILJER = [
    ("ledtabellerna", ["leder-overextremitet", "leder-nedreextremitet",
                       "leder-bal-nacke", "leder-kaken"], []),
    ("de regionala nervtabellerna",
     ["nervtabell-armen", "nervtabell-benet", "nervtabell-balen",
      "nervtabell-halsen", "nervtabell-autonoma"], []),
    # Banorna är centrala nervsystemets, inte en kroppsregions. De två
    # faktatexterna beskriver samma banor i löptext och står som vidare:
    # de har redan gott om ingående länkar och behöver inget eget block.
    ("nervbanorna", ["nervtabell-motorbanor", "nervtabell-sensorbanor"],
     ["sa-styrs-en-rorelse", "sa-leds-kanseln"]),
    ("kärltabellerna",
     ["karl-armen", "karl-benet", "karl-brostkorgen", "karl-buken",
      "karl-backenet", "karl-huvud-hals"], []),
]


def _grupper() -> list[dict]:
    """Alla grupper i renderingsordning, med kedjorna expanderade till par."""
    g = [{"namn": n, "kärna": [_s(x) for x in k], "vidare": [_s(x) for x in v]}
         for n, k, v in REGIONER]
    for namn, kedja in KEDJOR:
        for a, b in zip(kedja, kedja[1:]):
            g.append({"namn": f"{namn} ({a} ↔ {b})",
                      "kärna": [_s(a), _s(b)], "vidare": []})
    g += [{"namn": n, "kärna": [_s(x) for x in k], "vidare": [_s(x) for x in v]}
          for n, k, v in FAMILJER]
    return g


GRUPPER = _grupper()

# ---------------------------------------------------------------------------
# Sidor utan "Se även" — var och en med sitt skäl (§0.4)
# ---------------------------------------------------------------------------
# Blocket finns för att bryta upp de tabellsidor som bara nåddes från sin egen
# hubb. En hubb är per definition inte en sådan sida, och en sida som redan
# korslänkas i brödtexten behöver inte en pill-rad som säger samma sak igen
# (§0.5: nytt synligt innehåll införs bara i den utsträckning uppgiften kräver).
UTAN_RELATERAT = {
    # Hubbar — de ÄR navigeringen. Deras kort listar redan undersidorna.
    "kunskapsbank/index.html": "hubb; har redan ett eget Se även-block",
    "kunskapsbank/faktatexter.html": "hubb över faktatexterna",
    "kunskapsbank/listor-tabeller.html": "hubb över tabellfamiljerna",
    "kunskapsbank/muskeltabeller.html": "familjehubb, listar sina 16 undersidor",
    "kunskapsbank/skelett.html": "familjehubb, listar sina 12 undersidor",
    "kunskapsbank/karl.html": "familjehubb, listar sina 6 undersidor",
    "kunskapsbank/leder.html": "familjehubb, listar sina 4 undersidor",
    "kunskapsbank/nervtabeller.html": "familjehubb, listar sina 7 undersidor",
    "kunskapsbank/artiklar/index.html": "hubb över artiklarna",
    # Faktatexter och artiklar korslänkas i brödtexten enligt
    # ARTIKLAR_REGLER; samtliga hade tre eller fler ingående länkar vid
    # mätningen 2026-07-26 och är alltså inte det problem punkten löser.
    "kunskapsbank/sa-leds-kanseln.html": "faktatext, korslänkad i brödtext",
    "kunskapsbank/sa-styrs-en-rorelse.html": "faktatext, korslänkad i brödtext",
    "kunskapsbank/deklinationer-pluralformer.html": "terminologisida, korslänkad i brödtext",
    "kunskapsbank/grekiska-i-medicinen.html": "terminologisida, korslänkad i brödtext",
    "kunskapsbank/medicinsk-terminologi.html": "terminologisida, korslänkad i brödtext",
    "kunskapsbank/medicinskt-latin.html": "terminologisida, korslänkad i brödtext",
    "kunskapsbank/terminologins-historia.html": "terminologisida, korslänkad i brödtext",
    "kunskapsbank/uttalsregler.html": "terminologisida, korslänkad i brödtext",
    "kunskapsbank/lakemedelsberakning.html": "faktatext, länkas från verktyget",
    "kunskapsbank/lakemedelsberakning-omvandlingar.html": "faktatext, länkas från verktyget",
    "kunskapsbank/artiklar/anatomiska-riktningar.html": "artikel, korslänkad i brödtext",
    "kunskapsbank/artiklar/dermatom-myotom-sklerotom.html": "artikel, korslänkad i brödtext",
    "kunskapsbank/artiklar/engelska-i-medicinskt-sprak.html": "artikel, korslänkad i brödtext",
    "kunskapsbank/artiklar/fascia-bursor-senskidor.html": "artikel, korslänkad i brödtext",
    "kunskapsbank/artiklar/franska-och-tyska-i-medicinskt-sprak.html": "artikel, korslänkad i brödtext",
    "kunskapsbank/artiklar/ledtyper.html": "artikel, korslänkad i brödtext",
    "kunskapsbank/artiklar/minnesregler-kranialnerverna.html": "artikel, korslänkad i brödtext",
    "kunskapsbank/artiklar/nervsystemet.html": "artikel, korslänkad i brödtext",
    "kunskapsbank/artiklar/plugga-och-tenta.html": "artikel, korslänkad i brödtext",
    "kunskapsbank/artiklar/rorelseapparaten.html": "artikel, korslänkad i brödtext",
    "kunskapsbank/artiklar/sa-laser-du-en-muskeltabell.html": "artikel, korslänkad i brödtext",
}

# ---------------------------------------------------------------------------
# Markup
# ---------------------------------------------------------------------------
# Formen är den som redan finns på kunskapsbank/index.html — samma <aside>,
# samma rubrik, samma pillänkar. Ingen ny CSS, inget nytt ord för samma sak
# (CLAUDE_REGLER §0.5 punkt 3).
RUBRIK = "Se även"

# Hela blocket med sitt radbrott och sitt indrag — exakt så mycket som lades
# till. `\s*` hade svalt tomraden ovanför och skriptet hade ätit en tomrad per
# körning i stället för att rundtrippa till identitet (samma fälla som
# sidfoten gick i 0.9.272).
RX = re.compile(r'\n[ \t]*<aside class="kb-seealso" '
                r'aria-labelledby="seealsoHeading">.*?</aside>', re.S)

H1_RX = re.compile(r"<h1[^>]*>(.*?)</h1>", re.S)
TAGG_RX = re.compile(r"<[^>]+>")


def alla_sidor() -> list[str]:
    """Alla kunskapsbankssidor — populationen som måste vara klassad."""
    return sorted(p.relative_to(ROOT).as_posix()
                  for p in (ROOT / "kunskapsbank").rglob("*.html")
                  if "_arkiv" not in p.parts)


def rubrik_for(rel: str) -> str:
    """Målsidans egen `<h1>`, som länktext.

    Läses ur sidan i stället för ur ett register: då kan länktexten inte glida
    ifrån sidan den pekar på, och sidtitlarna får ingen andra upplaga att hålla
    i synk. Innehållet är redan HTML-escapat på målsidan och tas därför rått.
    """
    f = ROOT / rel
    m = H1_RX.search(f.read_text(encoding="utf-8"))
    if not m:
        raise SystemExit(
            f"STOPP: {rel} saknar <h1> och kan därför inte länkas till. "
            "Varje sida ska ha exakt en (SEO_REGLER §7).")
    text = re.sub(r"\s+", " ", TAGG_RX.sub("", m.group(1))).strip()
    if not text:
        raise SystemExit(f"STOPP: {rel} har en tom <h1>.")
    return text


def _kontrollera(kärnsidor: set[str], alla: set[str]) -> None:
    """Kartan mot verkligheten: inga spöken, inga omappade sidor."""
    nämnda = {s for g in GRUPPER for s in g["kärna"] + g["vidare"]}
    spöken = sorted((nämnda | set(UTAN_RELATERAT)) - alla)
    if spöken:
        raise SystemExit(
            "STOPP: scripts/relaterat.py nämner sidor som inte finns: "
            f"{spöken}. Ta bort dem eller rätta sökvägen.")

    dubbelt = sorted(kärnsidor & set(UTAN_RELATERAT))
    if dubbelt:
        raise SystemExit(
            "STOPP: dessa sidor står både i en grupp och i UTAN_RELATERAT: "
            f"{dubbelt}. Välj ett av dem.")

    omappade = sorted(alla - kärnsidor - set(UTAN_RELATERAT))
    if omappade:
        raise SystemExit(
            "STOPP: dessa kunskapsbankssidor är varken med i en grupp eller i "
            f"UTAN_RELATERAT: {omappade}.\n"
            "Lägg dem i den region-, kedje- eller familjegrupp de hör hemma i, "
            "eller i UTAN_RELATERAT med ett skäl. En sida utan Se även-block "
            "ska vara ett beslut, inte något som tyst uteblev "
            "(CLAUDE_REGLER §0.4).")


def kartan() -> dict[str, list[str]]:
    """{sida: [målsidor i renderingsordning]} för varje sida som får ett block.

    En sida som står i flera grupper får unionen, i gruppernas
    deklarationsordning. Dubbletter faller bort och den första förekomsten
    bestämmer platsen, så ordningen är deterministisk.
    """
    alla = set(alla_sidor())
    kärnsidor = {s for g in GRUPPER for s in g["kärna"]}
    _kontrollera(kärnsidor, alla)

    ut: dict[str, list[str]] = {s: [] for s in sorted(kärnsidor)}
    for g in GRUPPER:
        for sida in g["kärna"]:
            for mål in g["kärna"] + g["vidare"]:
                if mål != sida and mål not in ut[sida]:
                    ut[sida].append(mål)

    för_många = {s: len(m) for s, m in ut.items() if len(m) > MAX_LANKAR}
    if för_många:
        rader = "\n".join(f"  {s}: {n} länkar" for s, n in
                          sorted(för_många.items(), key=lambda x: -x[1]))
        raise SystemExit(
            f"STOPP: taket är {MAX_LANKAR} länkar per block, och dessa sidor "
            f"ligger över:\n{rader}\n"
            "Fler än så är ingen Se även-lista utan en sitemap. Flytta en "
            "översiktssida från 'kärna' till 'vidare' i de regiongrupper där "
            "den täcker mer än regionen, och ge den en familjegrupp i stället.")
    return ut


def block(rel: str, indrag: str, mål: list[str]) -> str:
    """Se även-blocket för sidan `rel`, färdigt att klistras in."""
    inre = indrag + "  "
    rader = [f'{indrag}<aside class="kb-seealso" aria-labelledby="seealsoHeading">',
             f'{inre}<h3 id="seealsoHeading" class="kb-seealso-title">{RUBRIK}</h3>',
             f'{inre}<ul class="kb-seealso-list">']
    for m in mål:
        rader.append(f'{inre}  <li><a href="/{m}">{rubrik_for(m)} →</a></li>')
    rader += [f"{inre}</ul>", f"{indrag}</aside>"]
    return "\n".join(rader)


def main():
    k = kartan()                       # larmen först, innan något skrivs ut
    print(block("kunskapsbank/muskeltabell-handen.html", "      ",
                k["kunskapsbank/muskeltabell-handen.html"]))
    print()
    ingående: dict[str, int] = {}
    for mål in k.values():
        for m in mål:
            ingående[m] = ingående.get(m, 0) + 1
    print(f"{len(k)} sidor får ett Se även-block, "
          f"{len(UTAN_RELATERAT)} står utan med skäl.")
    print(f"Blocken ger {sum(len(v) for v in k.values())} interna länkar, "
          f"{min(len(v) for v in k.values())}–{max(len(v) for v in k.values())} "
          f"per sida (taket är {MAX_LANKAR}).")
    print()
    for sida in sorted(k):
        print(f"  {sida:52} {len(k[sida])} ut, {ingående.get(sida, 0):2} in")
    return 0


if __name__ == "__main__":
    sys.exit(main())
