#!/usr/bin/env python3
"""Tolka sajtens APA 7-referenser till schema.org-noder (`citation`).

Referenslistorna finns redan, synliga och kvalitetssäkrade, på 71 sidor – men
bara som löptext. En svarsmotor som ska bedöma om en YMYL-sida är underbyggd
måste då själv tolka APA. Den här modulen gör tolkningen en gång, i koden, så
att `citation` i JSON-LD kommer ur **exakt samma sträng** som läsaren ser.
Det är hela poängen: en referens kan inte finnas i strukturdatan utan att stå
på sidan, och kan inte ändras på sidan utan att strukturdatan följer med.

Parsern **vägrar gissa**. Varje referens som inte matchar ett känt mönster
kastar `APAError` i stället för att tyst bli en halvfärdig nod – ett fel som
syns vid bygget är oändligt mycket billigare än 71 sidor med felaktig
strukturdata som ingen upptäcker. Se `--self-test` längst ner: den kör hela
sajtens referenskorpus genom parsern.

Mönster som stöds (alla former som förekommer på sajten):

  Bok       Efternamn, A. A., & Efternamn, B. (2018). <em>Titel</em> (2:a uppl.). Förlag.
  Antologi  Efternamn, A. (Red.). (2021). <em>Titel</em> (6:e uppl.). Förlag.
  Utan förf. <em>Titel</em> (33:e uppl.). (2020). Förlag.
  Artikel   Efternamn, A. (2006). Artikeltitel. <em>Tidskrift, 132</em>(3), 354–380. https://doi.org/…
  Webb      Organisation. (2023). <em>Titel</em>. Plats. Hämtad 22 juli 2026 från …
  Utan år   Organisation. (u.å.). <em>Titel</em> […]. Hämtad … från …
"""
import html as htmllib
import re
import sys

SITE = "https://anatomiquiz.se"


class APAError(ValueError):
    """Referensen matchar inget känt APA-mönster och tolkas därför inte alls."""


# Initialer ("A.", "A. A.", "M. J. T.", "L.-E.", "Ø. V.") och namnsuffix.
_INITIALER = re.compile(r"^(?:[A-ZÅÄÖØÆ]\.(?:-[A-ZÅÄÖØÆ]\.)*\s*)+$")
_SUFFIX = {"III", "Jr.", "Sr.", "II", "IV"}
# Upplaga: "(2:a uppl.)", "(rev. 2019)", "(HSLF-FS 2017:37, …)" – allt inom en
# parentes direkt efter titeln.
_ÅR = re.compile(r"\((\d{4}|u\.å\.)\)\.")


def _text(s):
    """Ta bort taggar och avkoda entiteter – referensens rena textinnehåll."""
    return htmllib.unescape(re.sub(r"<[^>]+>", "", s)).strip()


def _url(s):
    """Första URL:en i referensen, från href eller bar adress."""
    m = re.search(r'href="([^"]+)"', s)
    if m:
        return htmllib.unescape(m.group(1))
    m = re.search(r"https?://[^\s<),]+", _text(s))
    return m.group(0).rstrip(".") if m else None


def _titel(s):
    """Titeln = innehållet i <em>. Alla referenser på sajten kursiverar den."""
    m = re.search(r"<em>(.*?)</em>", s, re.S)
    if not m:
        raise APAError("ingen <em>-titel")
    return _text(m.group(1))


def _personer(raw):
    """Dela en APA-författarsträng i namn. Organisation → None.

    APA skriver "Efternamn, I. I." med komma *inuti* varje namn, så en enkel
    split på komma river isär namnen. Tokens som är rena initialer eller ett
    namnsuffix (III, Jr.) hör därför ihop med föregående efternamn.
    """
    # Punkten i slutet får INTE strippas här: den sista författarens initial
    # skrivs "J." och utan punkten känns den inte igen som initial, varpå hela
    # listan degraderas till ett organisationsnamn. Rollparentesen tas bort först.
    raw = re.sub(r"\s*\((?:Red|Övers)\.\)\s*\.?\s*$", "", raw.strip()).strip()
    if not raw:
        return None
    raw = raw.replace("&amp;", "&").replace(" & ", ", ")
    # "…, … Young, R. K." – ellipsen i långa författarlistor är inget namn.
    raw = raw.replace("…", "").replace("...", "")
    delar = [d.strip() for d in raw.split(",") if d.strip()]
    if not delar:
        return None
    # Ingen del ser ut som initialer → det är ett organisationsnamn.
    if not any(_INITIALER.match(d) for d in delar):
        return None
    namn, aktuell = [], ""
    for d in delar:
        if _INITIALER.match(d):
            aktuell = f"{aktuell}, {d}" if aktuell else d
        elif d.rstrip(".") in _SUFFIX:
            # "Roediger, H. L., III." – punkten är meningens, inte namnets.
            aktuell = f"{aktuell}, {d.rstrip('.')}" if aktuell else d
        else:
            if aktuell:
                namn.append(aktuell)
            aktuell = d
    if aktuell:
        namn.append(aktuell)
    return namn or None


def _agenter(raw):
    """(nyckel, nodlista) för författarfältet: person(er), redaktör(er) eller organisation."""
    nyckel = "editor" if re.search(r"\(Red\.\)", raw) else "author"
    personer = _personer(raw)
    if personer is None:
        org = _text(raw).strip().rstrip(".").strip()
        if not org:
            return None, None
        return nyckel, [{"@type": "Organization", "name": org}]
    return nyckel, [{"@type": "Person", "name": n} for n in personer]


def parse(ref):
    """Tolka EN referens (HTML som den står i <li>) till en schema.org-nod.

    Kastar APAError om mönstret inte känns igen – aldrig en halv nod.
    """
    ref = " ".join(ref.split())
    m = _ÅR.search(ref)
    if not m:
        raise APAError("hittar inget årtal på formen (ÅÅÅÅ). eller (u.å.).")

    före = ref[:m.start()].strip()
    efter = ref[m.end():].strip()
    år = m.group(1)

    nod = {}
    if år != "u.å.":
        nod["datePublished"] = år

    # Form "…<em>Titel</em> (33:e uppl.). (2020). Förlag." – titeln står FÖRE
    # årtalet och det finns ingen författare (uppslagsverk).
    titel_före_året = "<em>" in före
    if titel_före_året:
        nod["@type"] = "Book"
        nod["name"] = _titel(före)
        agentkälla = None
        svans = efter
    else:
        agentkälla = före
        svans = efter

    if not titel_före_året:
        titel = _titel(svans)
        em = re.search(r"<em>.*?</em>", svans, re.S)
        före_em = _text(svans[:em.start()]).strip()
        efter_em = svans[em.end():].strip()

        if före_em:
            # Text före kursiveringen ⇒ artikeltitel, och <em> är tidskriften.
            # "Psychological Bulletin, 132" – volymen ligger inne i kursiven.
            nod["@type"] = "ScholarlyArticle"
            nod["name"] = före_em.rstrip(".").strip()
            tidskrift = re.sub(r",\s*\d+\s*$", "", titel).strip()
            nod["isPartOf"] = {"@type": "Periodical", "name": tidskrift}
        else:
            nod["name"] = titel
            nod["@type"] = ("WebPage" if re.search(r"Hämtad .* från", efter_em)
                            else "Book")
        svans = efter_em

    if agentkälla:
        nyckel, agenter = _agenter(agentkälla)
        if agenter:
            nod[nyckel] = agenter

    # Upplaga: parentesen direkt efter titeln, men bara när den faktiskt
    # anger en upplaga. "(HSLF-FS 2017:37, …)" är ett föreskriftsnummer.
    upp = re.match(r"\(([^)]*uppl\.[^)]*)\)", svans)
    if upp and nod["@type"] == "Book":
        nod["bookEdition"] = upp.group(1)
        svans = svans[upp.end():].lstrip(". ").strip()
    else:
        svans = re.sub(r"^\([^)]*\)\s*\.?\s*", "", svans).strip()

    url = _url(ref)
    if url:
        nod["url"] = url

    if nod["@type"] in ("Book", "WebPage"):
        # Utgivaren är det som står kvar när hämtdatum, URL och materialtyp
        # ([Produktresumé], [Forumtråd]) räknats bort. Klipp INTE vid punkt:
        # "F.A. Davis" och "W. W. Norton" är utgivarnamn med punkter i sig.
        rest = re.split(r"\bHämtad\b", _text(svans))[0]
        rest = re.sub(r"\[[^\]]*\]", "", rest)
        rest = re.sub(r"https?://\S+", "", rest).strip(" .,")
        if rest:
            nod["publisher"] = {"@type": "Organization", "name": rest}

    # En organisationsutgiven skrift utan upplaga är inte en bok – det är en
    # föreskrift, en klassifikation eller en rapport. Säg det minst specifika
    # som är sant i stället för att kalla SFS 2009:600 för en Book.
    if (nod["@type"] == "Book" and "bookEdition" not in nod
            and nod.get("author", [{}])[0].get("@type") == "Organization"):
        nod["@type"] = "CreativeWork"

    if not nod.get("name"):
        raise APAError("tom titel")
    # Fast nyckelordning: @type och name först, som i all annan JSON-LD på
    # sajten. Ordningen är betydelselös för maskinen men avgörande för den
    # som ska granska en diff på 71 sidor.
    ordning = ("@type", "name", "author", "editor", "datePublished",
               "bookEdition", "isPartOf", "publisher", "url")
    return {k: nod[k] for k in ordning if k in nod}


def citations(referenser):
    """Lista med schema.org-noder för en hel referenslista."""
    return [parse(r) for r in referenser]


# ---------------------------------------------------------------------------

def _self_test(argv):
    """Kör hela sajtens referenskorpus genom parsern och skriv ut resultatet."""
    import json
    import pathlib
    rot = pathlib.Path(__file__).resolve().parent.parent
    blocket = re.compile(r'<div class="kb-sources">.*?</div>', re.S)
    poster = re.compile(r"<li>(.*?)</li>", re.S)
    unika = {}
    for p in sorted(rot.rglob("*.html")):
        h = p.read_text(encoding="utf-8")
        m = blocket.search(h)
        if not m:
            continue
        for s in poster.findall(m.group(0)):
            unika.setdefault(" ".join(s.split()), p.relative_to(rot))
    fel = 0
    for s, p in sorted(unika.items()):
        try:
            nod = parse(s)
        except APAError as e:
            fel += 1
            print(f"FEL ({e}) i {p}:\n  {s}\n")
            continue
        if "-v" in argv:
            print(f"--- {_text(s)[:90]}")
            print("   ", json.dumps(nod, ensure_ascii=False))
    print(f"{len(unika)} unika referenser, {fel} otolkade.")
    return 1 if fel else 0


if __name__ == "__main__":
    sys.exit(_self_test(sys.argv[1:]))
