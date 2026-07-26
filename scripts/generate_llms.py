#!/usr/bin/env python3
"""Skriver `llms.txt` och `llms-full.txt` ur `data/llms.json`.

`llms.txt` är den fil en agent läser **först**, och specen (llmstxt.org) vill ha
en kort, skannbar indexfil. Vår låg på 39 KB med artikelbeskrivningar på 1 500+
tecken — utmärkt GEO-material på fel plats. Innehållet flyttades därför till
`llms-full.txt`, och indexfilen bär en rad per sida.

**Ett register, två renderingar.** Två handhållna textfiler med samma URL-lista
glider isär — exakt den slutsats punkt 4, 5, 6, 8 och 9 i SEO-svepet kom till var
för sig. Här ligger sanningen i `data/llms.json`: `kort` hamnar i `llms.txt`,
`lang` i `llms-full.txt`, och URL:erna kan per konstruktion inte skilja sig åt.

Artiklarnas `lang` står i `data/artiklar.json` (fältet `llms`) och upprepas inte
i registret. Det är inte en optimering utan en lagning: när båda filerna bar var
sin kopia hade `engelska-i-medicinskt-sprak` redan drivit isär — llms.txt hade
den språkligt putsade texten ("cirka", "c till k", "SNOMED CT") och artiklarnas
register den gamla ("ca", "c→k", "Snomed CT"). Ingen kunde se det.

Kontrollen som gör filen svår att glömma: **varje `<loc>` i `sitemap.xml` ska
finnas i registret.** `check_links.py` validerar att URL:erna i llms.txt finns på
disk, aldrig att sidorna på disk finns i llms.txt — och därför saknades 30 av 117
indexerbara sidor (hela skelett-, kärl- och ledfamiljen) utan att något larmade.
Tyst uteblivet ser ut som en lyckad körning (CLAUDE_REGLER §0.4).

Användning:
    python3 scripts/generate_llms.py            # skriv båda filerna
    python3 scripts/generate_llms.py --check    # exit 1 om filerna är inaktuella
"""
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SITE = "https://anatomiquiz.se"
REGISTER = ROOT / "data" / "llms.json"
ARTIKLAR = ROOT / "data" / "artiklar.json"

KORT_FIL = ROOT / "llms.txt"
LANG_FIL = ROOT / "llms-full.txt"

# Raden i llms.txt som pekar vidare till den utförliga filen. check_links.py
# validerar den automatiskt — den läser varje https://anatomiquiz.se-länk i
# båda filerna och pekar den mot disk.
HANVISNING = (f"Utförliga sidbeskrivningar finns i "
              f"[llms-full.txt]({SITE}/llms-full.txt).")

# Sidor i sitemap.xml som medvetet INTE ska stå i llms.txt. Tom idag: varje
# indexerbar sida hör hemma i indexet. Listan finns för att en framtida sida som
# hör utanför ska ha ett ställe att stå på **med skäl** — inte för att tyst
# utebli. Nyckel = rot-relativ URL, värde = skälet.
UNDANTAG: dict[str, str] = {}

LOC = re.compile(r"<loc>([^<]+)</loc>")


class LlmsFel(Exception):
    """Registret går inte att rendera. Avbryter hellre än gissar."""


def url_till_fil(url: str) -> pathlib.Path:
    """Rot-relativ URL → filen som skulle serveras."""
    väg = url.split("#")[0].split("?")[0].lstrip("/")
    if väg == "" or väg.endswith("/"):
        väg += "index.html"
    return ROOT / väg


def artikeltexter() -> dict[str, str]:
    """URL → utförlig beskrivning, ur artikelregistret.

    Tre slag av sidor bor där: det platta indexet, ämneshubbarna (fältet
    `beskrivning`) och artiklarna (fältet `llms`). Hubbarnas titlar bär
    HTML-entiteter i registret; llms-filerna är ren text.
    """
    reg = json.loads(ARTIKLAR.read_text(encoding="utf-8"))
    ut = {}
    for h in reg["hubbar"]:
        ut[f"/kunskapsbank/artiklar/{h['slug']}.html"] = h["beskrivning"].replace("&amp;", "&")
    for a in reg["artiklar"]:
        if a.get("status") != "live":
            continue
        # Artiklar publicerade före omstruktureringen behåller sin gamla sökväg
        # direkt under /kunskapsbank/ (fältet "sokvag"), övriga ligger i
        # /kunskapsbank/artiklar/. Samma regel som artikel_url() i
        # generate_artiklar.py — publicerade URL:er ändras aldrig.
        url = a.get("sokvag") or f"/kunskapsbank/artiklar/{a['slug']}.html"
        ut[url] = a["llms"]
    return ut


def läs_register() -> dict:
    reg = json.loads(REGISTER.read_text(encoding="utf-8"))
    artiklar = artikeltexter()
    sedda: dict[str, str] = {}

    for sektion in reg["sektioner"]:
        for post in sektion["poster"]:
            if not post.get("lankar"):
                raise LlmsFel(f"post utan länkar i sektionen {sektion['rubrik']}")
            titel = post["lankar"][0]["titel"]
            if not post.get("kort", "").strip():
                raise LlmsFel(f"{titel}: fältet 'kort' är tomt — llms.txt är "
                              f"indexfilen och varje post måste bära en rad")
            for länk in post["lankar"]:
                url = länk["url"]
                if url in sedda:
                    raise LlmsFel(f"{url} står två gånger ({sedda[url]} och {titel})")
                sedda[url] = titel
                fil = url_till_fil(url)
                if not fil.is_file():
                    raise LlmsFel(f"{titel}: {url} → {fil.relative_to(ROOT)} finns inte")
            # Utförlig text: egen i registret, annars artikelregistrets.
            if not post.get("lang", "").strip():
                url = post["lankar"][0]["url"]
                if url not in artiklar:
                    raise LlmsFel(
                        f"{titel} ({url}): ingen utförlig beskrivning. Skriv fältet "
                        f"'lang' i data/llms.json, eller — om sidan är en artikel — "
                        f"fältet 'llms' i data/artiklar.json")
                post["lang"] = artiklar[url]

    # Varje indexerbar sida ska stå i indexet.
    sitemap = (ROOT / "sitemap.xml").read_text(encoding="utf-8")
    saknade = []
    for loc in LOC.findall(sitemap):
        url = loc[len(SITE):] if loc.startswith(SITE) else loc
        if url not in sedda and url not in UNDANTAG:
            saknade.append(url)
    if saknade:
        raise LlmsFel(
            f"{len(saknade)} sidor står i sitemap.xml men saknas i data/llms.json:\n  "
            + "\n  ".join(saknade)
            + "\nLägg in dem i rätt sektion, eller i UNDANTAG med skäl.")
    return reg


def rendera(reg: dict, fält: str, hänvisning: bool) -> str:
    rader = [f"# {reg['titel']}", "", f"> {reg['sammanfattning']}", "",
             reg["ingress"]]
    if hänvisning:
        rader += ["", HANVISNING]
    for sektion in reg["sektioner"]:
        rader += ["", f"## {sektion['rubrik']}", ""]
        for post in sektion["poster"]:
            länkar = ", ".join(f"[{l['titel']}]({SITE}{l['url']})"
                               for l in post["lankar"])
            rader.append(f"- {länkar}: {post[fält]}")
    return "\n".join(rader) + "\n"


def main(argv: list[str]) -> int:
    bara_kolla = "--check" in argv
    try:
        reg = läs_register()
    except LlmsFel as fel:
        print(f"STOPP: {fel}", file=sys.stderr)
        return 1

    ändrade = []
    for fil, fält, hänvisning in ((KORT_FIL, "kort", True),
                                  (LANG_FIL, "lang", False)):
        ny = rendera(reg, fält, hänvisning)
        gammal = fil.read_text(encoding="utf-8") if fil.is_file() else None
        if ny == gammal:
            continue
        ändrade.append(fil.name)
        if not bara_kolla:
            fil.write_text(ny, encoding="utf-8")

    antal = sum(len(p["lankar"]) for s in reg["sektioner"] for p in s["poster"])
    if bara_kolla:
        if ändrade:
            print(f"INAKTUELL: {', '.join(ändrade)} skiljer sig från registret. "
                  f"Kör python3 scripts/generate_llms.py", file=sys.stderr)
            return 1
        print(f"OK: llms.txt och llms-full.txt är i synk med registret "
              f"({antal} URL:er).")
        return 0

    print(f"llms.txt + llms-full.txt: {antal} URL:er i "
          f"{len(reg['sektioner'])} sektioner"
          + (f" ({', '.join(ändrade)} skrevs om)" if ändrade else " (oförändrade)")
          + f". {KORT_FIL.stat().st_size / 1024:.1f} KB / "
          f"{LANG_FIL.stat().st_size / 1024:.1f} KB.")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
