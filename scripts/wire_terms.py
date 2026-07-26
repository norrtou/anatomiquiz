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

Definitionerna kvalitetssäkras vid källan: skriptet VÄGRAR köra om någon `def` i
facit är en tom tooltip (upprepar uppslagsordet, är det böjt, är enbart latin-
namnet, eller är uppslagsord + synonym). Se SEO_REGLER §6c.0 för mallen — regeln
är att skriva definitionen rätt från början, inte att lita på den här spärren.

Eftersom wire_html är idempotent och aldrig rör befintliga länkar slår en ändrad
`def` inte igenom av sig själv. Kör `--sync-defs` efter varje ändring i
`data/kb_glossary_terms.json`; patcha aldrig `data-def` för hand.

Användning:
    python3 scripts/wire_terms.py kunskapsbank/muskeltabell-foten.html ...
    python3 scripts/wire_terms.py --all           # kunskapsbanken + artiklarna + case.html
    python3 scripts/wire_terms.py --check --all   # dry-run över allt; tyst = inget att göra
    python3 scripts/wire_terms.py --check FIL ...  # dry-run för enskilda filer
    python3 scripts/wire_terms.py --sync-defs --all          # HTML:s data-def := facit
    python3 scripts/wire_terms.py --check --sync-defs --all  # dry-run av synkningen
    python3 scripts/wire_terms.py --repoint hals halsen halsens --all
                                                  # namngivna nycklars href OCH def := facit

`--sync-defs` rör med flit aldrig `href` – en avvikande href kan vara avsiktlig
(`njuren` pekar på den latinska posten `ren` på språksidorna). Ska en term byta
mål används därför `--repoint` med nycklarna utskrivna. Att peka om för hand är
inget alternativ: den levererade HTML:en ägs ofta av en generator, och en
handredigering överlever inte nästa körning (det hände `puls` i 0.9.286).
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
    "genus",     # -> genu (knä). Aliaset finns för genitiven i "articulatio
                 #    genus", men ordet betyder i löptext grammatiskt kön eller
                 #    biologiskt släkte – "genus styr adjektivets ändelse" fick
                 #    tooltipen "Knä" på deklinationssidan. Flerordsnycklar med
                 #    genus matchas fortfarande som hela fraser (§6c).
    "kasus",     # -> kasus (sjukdomsfall). På deklinationssidan betyder ordet
                 #    grammatiskt kasus; ordlisteposten täcker bara den
                 #    epidemiologiska betydelsen.
    "ren",       # -> ren (njure). Ordet är rätt term på latin- och grekiksidorna,
                 #    där det står som uppslagsord och redan är handwirat, men i
                 #    svensk löptext betyder det nästan alltid "ren" i vardaglig
                 #    mening: "vid ren rullning" fick tooltipen "Njure" på
                 #    ledtypssidan. Behövs det som term igen skrivs länken för hand.
    "region",    # -> regio. Vardagsord i löptext ("region för region"), och
                 #    ordlistans def är bara "Område" – tooltipen tillför inget.
    "snitt",     # -> incision. Rätt i kirurgisk text (och kvar handwirat där),
                 #    men fel där ordet betyder tomografiskt snitt eller ett
                 #    tänkt plan genom kroppen, som på riktningssidan.
    "massa",       # -> massa (anatomisk klump, "massa lateralis atlantis"). I
                   #    löptext om läkemedelsberäkning betyder ordet fysikalisk
                   #    massa i motsats till volym och aktivitetsenheter, och
                   #    tooltipen "Klump, massa" blev direkt vilseledande på både
                   #    lakemedelsberakning-sidorna. Flerordsnyckeln
                   #    "massa lateralis atlantis" finns kvar och matchas som fras.
    "korsning",    # -> chiasma. Nycklarna "korsning"/"korsningen" har defen
    "korsningen",  #    "Korsning", alltså en tautologi som inte tillför något,
                   #    och pekar dessutom på det grekiska ordet för synkorsningen.
                   #    I löptext avser ordet nästan alltid något annat: pyramid-
                   #    korsningen (decussatio) på motoriksidan, banornas korsning
                   #    i sensoriktabellen och en språklig korsning på uttalssidan.
                   #    Uppslagsordet "chiasma" är kvar och wiras som förut.
    "koncentration",  # ordlisteposten avser ENBART den kognitiva betydelsen
                      # ("förmågan att hålla kvar uppmärksamheten"). I medicinsk
                      # löptext betyder ordet nästan alltid halten av ett löst
                      # ämne – tooltipen blev därför direkt vilseledande på
                      # läkemedelsberäkningssidorna.
}

# Homonymer som är RÄTT nästan överallt men fel på en enskild sida. Global
# blockering vore fel medicin: den skulle ta bort en korrekt tooltip på
# dussintals sidor för att laga en enda. Nyckeln är sidans sökväg relativt
# repots rot; värdet är de facitnycklar som inte får wiras just där.
BLOCKERADE_PER_SIDA = {
    # "ursprunget" -> origo ("Muskelns proximala fästpunkt") är korrekt i
    # muskeltabellerna och i latinguiden. I minnesregelartikeln handlar
    # meningen om en RAMSAS ursprung – "tillskriver ursprunget Oliver Wendell
    # Holmes den äldre" – och tooltipen blir där rent nonsens.
    "kunskapsbank/artiklar/minnesregler-kranialnerverna.html": {"ursprunget"},
    # "pannan" -> frons ("Ansiktets övre del") är korrekt på ansiktets
    # muskeltabell, kranialnervssidan och i "rynka pannan" på
    # sa-styrs-en-rorelse. I kuffartikeln är ordet genomgående kortformen av
    # LEDpannan ("pressar huvudet mot pannan"), och pannan i ansiktet blir där
    # rent nonsens. Global blockering hade tagit bort åtta korrekta tooltips.
    # "extremitet" är rätt term överallt utom i quiz-CTA:ns menyväg
    # ("Läkare → Övre extremitet"), som är ett gränssnittsnamn och ska hållas
    # rent från tooltips av samma skäl som .btn och .kb-card gör det.
    "kunskapsbank/artiklar/rotatorkuffen.html": {"pannan", "extremitet"},
}

# --- Tomma tooltips: fångas vid KÄLLAN, inte i efterhandssvep ----------------
# SEO_REGLER §6c.0. Fyra ytformer av samma defekt, alla funna i produktion:
# def == nyckeln, def == nyckeln böjd, def == enbart latinnamnet, och nyckeln
# som ett kommaled bland synonymer. Varje svep som jagade EN form rapporterade
# filen ren – därför testas alla fyra här, en gång, innan något skrivs.
_LATINPREFIX = re.compile(
    r"^(?:Articulatio|Os|Ossa|Musculus|Musculi|Nervus|Nervi|Vena|Venae|Arteria|"
    r"Arteriae|Ligamentum|Ligamenta|Glandula|Tractus|Fascia|Bursa|Canalis|"
    r"Foramen|Plexus|Truncus|Ramus|Rami|Cartilago|Membrana|Discus|Corpus|Caput|"
    r"Processus|Capsula|Vertebra|Vertebrae|Pancreas)\b")

# Svenska böjningsändelser. "e" står medvetet INTE med: `ovale` -> "Oval" är en
# latinsk nyckel med svensk översättning, inte en böjning av sig själv.
_ÄNDELSER = ("ernas", "arnas", "orna", "erna", "arna", "ens", "ets", "ans",
             "ns", "ar", "er", "or", "en", "et", "n", "t", "s")

def _norm(s):
    return re.sub(r"[^0-9a-zà-öø-ÿ]+", "", s.lower().strip().rstrip("."))

def _stammar(s):
    """Ordet självt plus varje form av det utan en böjningsändelse.

    Att kapa EN ändelse och jämföra räcker inte: 'ögonbrynet' och 'ögonbrynen'
    är samma ord men ingetdera är prefix av det andra. Genom att jämföra
    mängder träffas de på den gemensamma stammen 'ögonbryn'.
    """
    s = _norm(s)
    former = {s} if len(s) >= 4 else set()
    for suf in _ÄNDELSER:
        if s.endswith(suf) and len(s) - len(suf) >= 4:
            former.add(s[:-len(suf)])
    return former

def _samma_ord(a, b):
    """Sant om a och b är samma ord, ev. i olika böjning."""
    return bool(_stammar(a) & _stammar(b))

def _har_förklaring(defn):
    """Sant om något led i definitionen faktiskt förklarar något.

    Husets format är `Uppslagsord; förklaring` (humerus -> "Överarmsben;
    artikulerar med scapula…") och det är KORREKT – att uppslagsordet står
    först gör inte tooltipen tom. Bara när inget led bär en förklaring är den
    det. Fyra ord är gränsen: "benringen som förbinder bålen" förklarar,
    "framsida" gör det inte.

    Delningen sker ENBART på semikolon. Komma sitter inne i förklaringen
    ("koordinerar rörelser, balans och finmotorik") och att stycka där gör att
    en fullgod definition ser innehållslös ut.
    """
    for led in re.split(r";", re.sub(r"\([^)]*\)", " ", defn)):
        if len(led.split()) >= 4:
            return True
    return False

def tom_tooltip(key, defn):
    """Returnera skälet om `defn` är en tom tooltip för `key`, annars None.

    Orden jämförs mot varandra via _samma_ord, som bara godtar en äkta svensk
    böjningsändelse emellan. Latinsk nyckel med svensk översättning är därför
    inte tom: `extremitas` -> "Extremitet", `minor` -> "Mindre" och
    `ovale` -> "Oval" är precis vad de posterna ska göra.
    """
    d = defn.strip()
    if d.lower().rstrip(".") == key.lower().strip():
        return "def upprepar uppslagsordet"
    if _LATINPREFIX.match(d) and not _har_förklaring(d):
        return "def är enbart det latinska namnet, ingen förklaring"
    if _har_förklaring(d):
        return None
    kärna = re.sub(r"\s*\([^)]*\)\s*$", "", d).strip()
    if _samma_ord(key, kärna):
        return "def är uppslagsordet i annan böjning"
    for led in re.split(r"[;,]", re.sub(r"\([^)]*\)", " ", d)):
        if _samma_ord(key, led.strip()):
            return "def är uppslagsordet + synonym, ingen förklaring"
    return None

def load_terms(strikt=True):
    data = json.load(open(TERMS_FILE, encoding="utf-8"))
    terms = {k.lower(): v for k, v in data.items() if k.lower() not in BLOCKERADE}
    if strikt:
        # Vägra skriva tomma tooltips till sidorna. Att skriptet stoppar här är
        # sista utposten – definitionen ska vara skriven rätt från början.
        dåliga = [(k, v["def"], skäl) for k, v in terms.items()
                  if (skäl := tom_tooltip(k, v["def"]))]
        if dåliga:
            print(f"STOPP: {len(dåliga)} tomma tooltips i "
                  f"{TERMS_FILE.name} (SEO_REGLER §6c.0).", file=sys.stderr)
            for k, d, skäl in sorted(dåliga)[:25]:
                print(f'  {k!r} -> {d!r}\n      {skäl}', file=sys.stderr)
            if len(dåliga) > 25:
                print(f"  … och {len(dåliga) - 25} till.", file=sys.stderr)
            print("Skriv om definitionerna – kör inte runt kontrollen.", file=sys.stderr)
            sys.exit(1)
    return terms

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
            # Referenslistan (.kb-sources) ska aldrig wiras. Bibliografiska poster
            # innehåller ord som råkar vara uppslagsord – "The anatomical basis of
            # clinical practice" fick tooltipen för basis och "Principles of neural
            # science" den för neural – och en tooltip mitt i en boktitel är alltid
            # fel, hur bra nyckeln än är i löptext (SEO_REGLER §6c).
            is_kb_sources = bool(re.search(r'class="kb-sources[ "]', attrs))
            # Datumraden (.page-updated) skrivs av wire_dates.py och är ren
            # metadata om sidan, inte innehåll. En tooltip på ett ord i "Senast
            # uppdaterad 25 juli 2026" vore alltid fel, och eftersom raden läggs
            # in EFTER wiringen skulle den träffas först vid nästa körning – ett
            # fel som dykt upp långt från sin orsak (SEO_REGLER §6c).
            is_page_updated = bool(re.search(r'class="page-updated[ "]', attrs))
            # Sidfoten (.page-footer) av samma skäl, och ett till: friskrivningen
            # och integritetsraden ska vara BYTE-IDENTISKA på alla sidor. Ett par
            # tooltips på "kliniska riktlinjer" hade gjort dem till 117 olika
            # rader, och därmed upphävt hela poängen med en delad komponent.
            is_page_footer = bool(re.search(r'class="page-footer[ "]', attrs))
            # "Se även"-blocket (.kb-seealso) av samma skäl som sidfoten:
            # det är navigering, och rubriken och länktexterna ska vara
            # ordagrant desamma på alla 46 sidor. Länktexten sitter visserligen
            # inuti <a> och skyddas redan av in_anchor, men rubriken "Se även"
            # gör det inte — och blir ett ord i den någonsin en facitnyckel
            # hade blocket sett olika ut från sida till sida (SEO_REGLER §6f).
            is_kb_seealso = bool(re.search(r'class="kb-seealso[ "]', attrs))
            if (name in ("head", "script", "style") or is_breadcrumb_nav
                    or (is_kb_card and name != "a")
                    or (is_kb_sources and name != "a")
                    or (is_page_updated and name != "a")
                    or (is_page_footer and name != "a")
                    or (is_kb_seealso and name != "a")) and not self_closing:
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
    path = pathlib.Path(path)
    spärr = BLOCKERADE_PER_SIDA.get(_rel(path))
    if spärr:
        terms = {k: v for k, v in terms.items() if k not in spärr}
        rx = build_regex(terms)
    html = path.read_text(encoding="utf-8")
    stats = {}
    new = wire_html(html, terms, rx, stats)
    n = sum(stats.values())
    if write and new != html:
        path.write_text(new, encoding="utf-8")
    return n, stats


def _rel(path):
    """Sidans sökväg relativt repots rot, med / som separator."""
    try:
        return pathlib.Path(path).resolve().relative_to(ROOT).as_posix()
    except ValueError:
        return pathlib.Path(path).name


# Hela ankaret, med länktexten som egen grupp. Länktexten ÄR facitnyckeln (se
# _sub), så uppslaget blir entydigt även när en svensk och en latinsk nyckel
# delar href med olika definitioner – vilket en ersättning på (href, gammal
# def) inte klarar.
ANKARE_RX = re.compile(
    r'(<a class="kb-term" href=")([^"]*)(" data-def=")([^"]*)(">)([^<]*)(</a>)')

def sync_defs_file(path, terms, write=True):
    """Skriv om `data-def` så att sidan matchar facit. Returnerar antal ändrade.

    Behövs eftersom wire_html är idempotent och aldrig rör befintliga länkar:
    en redigerad `def` i facit skulle annars stanna i facit medan sidorna visar
    den gamla texten. `href` lämnas orörd – avvikande hrefs är en annan sak och
    rapporteras separat.
    """
    html = pathlib.Path(path).read_text(encoding="utf-8")
    ändrade, href_avvik = [], []
    def repl(m):
        pre, href, mid, defn, gt, token, slut = m.groups()
        v = terms.get(token.lower())
        if not v:
            return m.group(0)
        if v["href"] != href:
            href_avvik.append(token)
            return m.group(0)
        if v["def"] != defn:
            ändrade.append(token)
            return f'{pre}{href}{mid}{v["def"]}{gt}{token}{slut}'
        return m.group(0)
    ny = ANKARE_RX.sub(repl, html)
    if write and ny != html:
        pathlib.Path(path).write_text(ny, encoding="utf-8")
    return ändrade, href_avvik

def repoint_file(path, terms, nycklar, write=True):
    """Peka om NAMNGIVNA facitnycklars länkar: både `href` och `def` ur facit.

    Skäl att detta INTE ligger i `--sync-defs`: en avvikande href är ibland
    avsiktlig. `njuren` pekar med flit på den latinska posten `ren` på
    språksidorna, där det latinska ordet är hela poängen, medan svensk löptext
    ska peka på `njure`. Ett svep som tvingade på facits href överallt hade
    tyst rivit sex korrekta länkar för att laga en felaktig.

    Därför tar det här läget en uttrycklig lista med nycklar. Du säger vilken
    term som ska pekas om, skriptet gör det på varje sida — och rör ingenting
    annat.

    Varför det behöver vara ett verktyg och inte handarbete (§0.3): en ändrad
    href i facit slår inte igenom av sig själv, eftersom `wire_html` är
    idempotent och aldrig rör en befintlig länk. I 0.9.286 rättades `puls`
    därför genom handredigering av en GENERERAD sida, och ändringen ströks vid
    nästa körning. Facit ska vara enda källan, också när en länk byter mål.
    """
    html = pathlib.Path(path).read_text(encoding="utf-8")
    nycklar = {n.lower() for n in nycklar}
    ändrade = []

    def repl(m):
        pre, href, mid, defn, gt, token, slut = m.groups()
        if token.lower() not in nycklar:
            return m.group(0)
        v = terms.get(token.lower())
        if not v or (v["href"] == href and v["def"] == defn):
            return m.group(0)
        ändrade.append(token)
        return f'{pre}{v["href"]}{mid}{v["def"]}{gt}{token}{slut}'

    ny = ANKARE_RX.sub(repl, html)
    if write and ny != html:
        pathlib.Path(path).write_text(ny, encoding="utf-8")
    return ändrade


def alla_sidor():
    """Varje wire:bar sida. Artiklarna ligger i en underkatalog och missades
    tidigare av --all, vilket gjorde att nya artiklar tyst hamnade utanför
    tooltipsvepet.

    Verktygssidorna kom med 0.9.286. De stod utanför svepet i sin helhet:
    `verktyg/lakemedelsberakning.html` hade **en enda** kb-term, handskriven i
    en sr-only-rubrik, och `verktyg/index.html` ingen alls. Sidor som handlar om
    dos, infusion och spädning är precis de sidor vars ord ordlistan förklarar,
    så uteblivandet kostade länkar i båda riktningarna.

    Glob:en är rekursiv (`**`) därför att akutmedicinen ligger i en egen
    underkatalog — samma misstag som artiklarna en gång utlöste ska inte kunna
    upprepas när nästa verktygsgren tillkommer.

    Kalkylatorernas egna etiketter renderas av JS och kan aldrig nås härifrån.
    Termbärande text ska därför skrivas som statisk HTML på sidan, inte i
    modulen — se `scripts/akutmedicin_verktyg_todo.md` §3b."""
    kb = ROOT / "kunskapsbank"
    return (sorted(kb.glob("*.html"))
            + sorted(kb.glob("artiklar/*.html"))
            + sorted((ROOT / "verktyg").glob("**/*.html"))
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

    if argv and argv[0] == "--repoint":
        argv = argv[1:]
        nycklar = []
        while argv and not argv[0].startswith("--") and argv[0] != "--all":
            nycklar.append(argv.pop(0))
        if not nycklar or not argv:
            print("--repoint kräver en eller flera facitnycklar följt av "
                  "--all eller filer. Ex: --repoint hals halsen halsens --all",
                  file=sys.stderr)
            return 1
        okända = [n for n in nycklar if n.lower() not in terms]
        if okända:
            # Tyst uteblivet ser ut som en lyckad körning (§0.4): en felstavad
            # nyckel hade gett "0 länkar ompekade" utan att något var gjort.
            print(f"STOPP: dessa nycklar finns inte i facit: {okända}",
                  file=sys.stderr)
            return 1
        filer = alla_sidor() if argv[0] == "--all" else [ROOT / a for a in argv]
        tot = 0
        for f in filer:
            ändrade = repoint_file(f, terms, nycklar, write=not check)
            if ändrade:
                tot += len(ändrade)
                verb = "skulle pekas om" if check else "ompekade"
                print(f"  {f.relative_to(ROOT)}: {len(ändrade)} {verb} "
                      f"({', '.join(sorted(set(ändrade)))})")
        verb = "skulle pekas om" if check else "ompekade"
        print(f"Totalt {tot} länkar {verb} mot facit i {len(filer)} filer "
              f"({', '.join(nycklar)}).")
        return 1 if (check and tot) else 0

    sync = argv and argv[0] == "--sync-defs"
    if sync:
        argv = argv[1:]
        if not argv:
            print("--sync-defs kräver filer eller --all", file=sys.stderr); return 1
        filer = alla_sidor() if argv[0] == "--all" else [ROOT / a for a in argv]
        tot, hrefs = 0, []
        for f in filer:
            ändrade, href_avvik = sync_defs_file(f, terms, write=not check)
            hrefs += [(f, t) for t in href_avvik]
            if ändrade:
                tot += len(ändrade)
                verb = "skulle synkas" if check else "synkade"
                print(f"  {f.relative_to(ROOT)}: {len(ändrade)} {verb} "
                      f"({', '.join(sorted(set(ändrade)))})")
        print(f"Totalt {tot} data-def {'skulle synkas' if check else 'synkade'} "
              f"mot facit i {len(filer)} filer.")
        if hrefs:
            print(f"\n{len(hrefs)} länkar har en href som avviker från facit "
                  f"(def orörd – kräver eget beslut):")
            for f, t in hrefs:
                print(f"  {f.relative_to(ROOT)}: {t}")
        return 0

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
    # main() returnerar 1 på fel, men returvärdet kastades bort fram till
    # 0.9.287 – varje `STOPP` i skriptet såg därför ut som en lyckad körning
    # för det som anropade det, inklusive check_generators.py. Ett larm som
    # inte kan fällas är inget larm (CLAUDE_REGLER §0.4).
    sys.exit(main(sys.argv[1:]) or 0)
