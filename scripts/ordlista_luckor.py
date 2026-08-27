#!/usr/bin/env python3
"""Breddtäckning för ordlistan — hittar ord som SAKNAS, inte fält som saknas.

`ORDLISTA.md` mäter **djup**: hur många av de 10 940 posterna som bär `Eng. `,
etymologi, böjning, `Jfr `. Ingenting i projektet har hittills mätt **bredd**:
vilka uppslagsord som borde finnas men inte gör det. Det är två olika frågor,
och den andra går inte att svara på genom att gå igenom bokstav för bokstav —
en bokstavsvandring visar bara de poster som redan är skrivna.

Bristen är mätbar. Ordlistan har `enterokolit`, `ulcerös kolit` och
`mikroskopisk kolit` men inte `kolit`; `antimetabolit` men inte `metabolit`;
`karcinomatos` men inte `karcinom`; åtta `-skopi`-sammansättningar men varken
`mikroskopi`, `koloskopi` eller `otoskopi`; och noll `scintigrafi` fast ordet
står 47 gånger i sajtens eget innehåll. Sådana hål har ingen alfabetisk
genomgång kunnat se, eftersom hålet per definition inte har någon rad att läsa.

Skriptet vänder på frågan: i stället för att läsa posterna härleds kandidater
ur källor som redan finns i trädet, och varje kandidat prövas mot lemmalistan.

Sex källor, var och en självständigt körbar:

  korsref    `Jfr …`/`Se …`/`Motsats …` som pekar på något utan eget uppslagsord.
             Ordlistan lovar en post som inte finns — hårdaste signalen av alla.
  exempel    Termer i prefix-/suffixposternas `Ex:` som saknar egen post.
             Byggstenen är förklarad, ordet den bygger är det inte.
  synonym    `Sv. <ord>` där det svenska ordet inte själv är uppslagsord.
             Policyfråga, inte ren bugg — se ordlista_tackning_todo.md.
  brodtext   Ord i ordlistans EGNA definitioner som bär medicinsk morfologi
             men saknar eget uppslagsord. Vi använder ordet för att förklara
             ett annat ord — då ska det gå att slå upp.
  korpus     Ord i sajtens EGET innehåll (quizbanker, kunskapsbank, sidor) som
             bär medicinsk morfologi men saknar post. Vi förklarar ordet för
             användaren i en fråga och kan sedan inte slå upp det.
  huvudord   Sammansättningar finns i ordlistan, huvudordet saknas: filen har
             `enterokolit` och `ulcerös kolit` men inte `kolit`.

Ingen källa gissar fram ord. Varje kandidat är BELAGD någonstans i trädet —
i en korsreferens, ett exempel, en definition, en quizfråga eller ett annat
uppslagsord. Kombinatorik (stam × ändelse) är medvetet bortvald: den skulle
producera `dysalgi` och `dyscyt` och bryta mot CLAUDE_REGLER §0.3.

Triagen är en del av metoden. Ett utslag är antingen ett ord som ska skrivas
(för hand, i husformat) eller en falsk träff som skrivs in i
`data/ordlista_luckor_ignorerade.json` med motivering. Facit i
`data/ordlista_luckor_facit.json` gör mätningen till en spärr: `--check` faller
så snart en källa ger fler utslag än facit, alltså när ny text tillför ord som
ordlistan inte täcker. Talen kan bara gå nedåt.

Användning:
    python3 scripts/ordlista_luckor.py                  # sammanfattning
    python3 scripts/ordlista_luckor.py --lista korsref  # kandidaterna i en källa
    python3 scripts/ordlista_luckor.py --lista alla --topp 0
    python3 scripts/ordlista_luckor.py --json           # maskinläsbart
    python3 scripts/ordlista_luckor.py --check          # spärr mot facit
    python3 scripts/ordlista_luckor.py --skriv-facit    # nytt facit efter triage
"""
import argparse
import collections
import html
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ORDLISTA = ROOT / "data" / "ordlista.json"
IGNORERADE = ROOT / "data" / "ordlista_luckor_ignorerade.json"
FACIT = ROOT / "data" / "ordlista_luckor_facit.json"

# Filer som inte får räknas som korpus: ordlistan själv, dess råimport, dess
# sökindex och dess renderade sidor. Annars mäter vi ordlistan mot sig själv.
UNDANTAG_DATA = {"ordlista.json", "ordlista_import_raw.json", "ordlista-index.json"}

KALLOR = ["korsref", "exempel", "synonym", "brodtext", "korpus", "huvudord"]


# ---------------------------------------------------------------- lemmalistan

def lemman(poster):
    """Alla former som RÄKNAS som uppslagsord, gemener.

    `-carcinoma / -karcinom` är en post med två lemman; en sökning på endera
    hittar den, så bägge ska räknas som täckta.
    """
    ut = set()
    for e in poster:
        for del_ in re.split(r"\s*/\s*", e.get("term", "")):
            d = del_.strip().lower()
            if d:
                ut.add(d)
                ut.add(d.lstrip("-"))
    return ut


def byggstenar(poster, sort, minsta=3):
    """Prefix- eller suffixformer ur posternas egna ordklasstaggar.

    Suffix mäts från två tecken: `-itis / -it` ger både `itis` och `it`, och
    utan den korta formen ser ingen källa att `kolit`, `gastrit` och `myosit`
    är medicinska ord. Prefix hålls vid tre — `a-` och `ab-` matchar för mycket.
    """
    ut = set()
    for e in poster:
        if not e.get("def", "").lower().startswith(sort):
            continue
        for del_ in re.split(r"\s*/\s*", e.get("term", "")):
            d = del_.strip().lower().strip("-")
            d = re.sub(r"\s*\(.*\)$", "", d)
            if len(d) >= minsta:
                ut.add(d)
    return ut


# ------------------------------------------------------------------- källorna

REF = re.compile(r"(?:Jfr|Se även|Se|Motsats(?:en)?(?:\s+till)?:?)\s+([^.;()]+)")
STADA = re.compile(r"^(?:till|även|de|den|det)\s+")


def kalla_korsref(poster, lem):
    tr = collections.Counter()
    for e in poster:
        for m in REF.finditer(e.get("def", "")):
            for bit in re.split(r",| och ", m.group(1)):
                o = STADA.sub("", re.sub(r"\s+", " ", bit.strip().lower()))
                if len(o) > 2 and not o[0].isdigit() and o not in lem:
                    tr[o] += 1
    return tr


def kalla_exempel(poster, lem):
    """Exempelord i prefix-/suffixposternas `Ex:`-klausul.

    Separatorn mellan två exempel är semikolon, aldrig komma: av 805
    `Ex:`-klausuler bär 124 semikolon och 11 komma — och alla elva har kommat
    INNE i förklaringen (`Ex: baryfoni = djup, grov röst`). Delas det på komma
    blir förklaringens andra hälft ett eget uppslagsord, och källan svarar
    `grov röst`, `hård avföring`, `luftlös lunga`.
    """
    tr = collections.Counter()
    for e in poster:
        for m in re.finditer(r"Ex:\s*([^.]+)", e.get("def", "")):
            for bit in m.group(1).split(";"):
                o = re.sub(r"\s+", " ", bit.split("=")[0].strip().lower())
                # Uppslagsordet slutar vid en inskjuten parentes:
                # `elektrokardiogram (ekg)`, `insulin (av Langerhans cellöar)`.
                o = re.sub(r"\s*\(.*$", "", o).strip()
                if o.startswith("se "):        # ren hänvisning, inget exempel
                    continue
                if len(o) > 3 and o not in lem:
                    tr[o] += 1
    return tr


def kalla_synonym(poster, lem):
    tr = collections.Counter()
    for e in poster:
        for m in re.finditer(r"Sv\.\s+([^.]+)\.", e.get("def", "")):
            for bit in re.split(r",| eller | resp\. ", m.group(1)):
                o = re.sub(r"[()]", "", re.sub(r"\s+", " ", bit.strip().lower()))
                if 2 < len(o) < 40 and o not in lem:
                    tr[o] += 1
    return tr


SLUGLIK = re.compile(r"^[a-z0-9]+(?:[_-][a-z0-9]+)*$")
ORD = re.compile(r"[a-zåäöéèü]{5,}")
# Svenska böjningsändelser: `epikondylerna` är inte ett nytt uppslagsord när
# `epikondyl` redan står i filen.
ANDELSER = ("s", "n", "t", "a", "e", "en", "et", "er", "ar", "or", "na", "ns",
            "rna", "erna", "arna", "orna", "as", "es", "ts", "de", "te", "ade")


def _strangar(o, ut):
    if isinstance(o, dict):
        for v in o.values():
            _strangar(v, ut)
    elif isinstance(o, list):
        for v in o:
            _strangar(v, ut)
    elif isinstance(o, str):
        # Sluggar, filnamn och URL:er är id:n, inte löptext: `klinkemi` och
        # `membranfys` är ämnesnycklar i quizbankerna, inte medicinska ord.
        if not SLUGLIK.match(o) and not o.startswith(("http", "/", "#", "data:")):
            ut.append(o)


def korpustext():
    ut = []
    for f in sorted((ROOT / "data").glob("**/*.json")):
        if f.name in UNDANTAG_DATA or f.name.startswith("ordlista_luckor"):
            continue
        try:
            _strangar(json.loads(f.read_text(encoding="utf-8")), ut)
        except (ValueError, OSError):
            continue
    sidor = sorted(ROOT.glob("*.html")) + sorted((ROOT / "kunskapsbank").glob("**/*.html"))
    for f in sidor:
        if f.name.startswith("ordlista-") or f.name == "medicinskordlista.html":
            continue
        t = f.read_text(encoding="utf-8", errors="ignore")
        t = re.sub(r"(?s)<(script|style)\b.*?</\1>", " ", t)
        ut.append(html.unescape(re.sub(r"<[^>]+>", " ", t)))
    return ut


def bojning_av_lemma(ord_, lem):
    for k in range(4, len(ord_)):
        if ord_[:k] in lem and ord_[k:] in ANDELSER:
            return True
    return False


# Latinska/grekiska böjningsändelser. `musculi`, `arteriae`, `ossa` och `cordis`
# är böjda former av lemman som redan står i filen — inte saknade huvudord.
LAT_SLUT = ("i", "ae", "a", "is", "es", "um", "us", "orum", "arum", "ibus", "em", "e")
LAT_GRUND = ("us", "um", "a", "is", "e", "s", "")


def latinsk_bojning_av_lemma(ord_, lem):
    for slut in LAT_SLUT:
        if not slut or not ord_.endswith(slut):
            continue
        stam = ord_[:len(ord_) - len(slut)]
        if len(stam) < 4:
            continue
        if any(stam + g in lem for g in LAT_GRUND):
            return True
    return False


def _medicinska(frek, lem, suffix):
    """Filtrera en frekvenstabell till ord som bär medicinsk morfologi."""
    tr = collections.Counter()
    for o, n in frek.items():
        if o in lem or bojning_av_lemma(o, lem) or latinsk_bojning_av_lemma(o, lem):
            continue
        if any(o.endswith(s) for s in suffix):
            tr[o] = n
    return tr


def frekvens(texter):
    frek = collections.Counter()
    for t in texter:
        for o in ORD.findall(t.lower()):
            frek[o] += 1
    return frek


# `Eng. arthritis.` och `Av gr. arthron = led.` är fält som PER DEFINITION bär
# främmande ord. Räknas de med svarar källan `disease`, `anaemia`, `capitis` —
# engelska motsvarigheter och etymon, inte svenska uppslagsord som saknas.
FRAMMANDE = re.compile(
    r"(?:Eng\.|Lat\.|Gr\.|Av (?:lat|gr|grek|eng|fr|ty|ital|arab|sanskr)[^.]*)\.?[^.]*\.")


# Etymon skrivna UTAN språkkod: `articulus = led.`, `rhomboeides = rombformig`.
# Notationen är levande i filen (samma blinda fläck som etymologimätningen i
# ORDLISTA.md har) och ordet före likhetstecknet är källordet, inte ett saknat
# svenskt uppslagsord.
ETYMON = re.compile(r"([a-zåäöéèü-]{4,})\s*=\s")


def _svensk_sammansattning(o, lem):
    """`diabetesform`, `cancerform`, `beroendesyndrom` — vanliga svenska
    sammansättningar vars förled redan är uppslagsord. Ändelserna är samtidigt
    äkta medicinska suffix (`vermiform`, `filiform`), så de kan inte tas bort
    ur suffixlistan; skillnaden är just att förledet här står i filen."""
    for slut in ("form", "syndrom", "analys"):
        if o.endswith(slut) and len(o) > len(slut) + 3:
            forled = o[:-len(slut)].rstrip("s")
            if forled in lem or forled + "s" in lem:
                return True
    return False


def kalla_brodtext(poster, lem, suffix):
    etymon = set()
    kroppar = []
    for e in poster:
        kropp = FRAMMANDE.sub(" ", e.get("def", ""))
        kroppar.append(kropp)
        etymon.update(m.group(1).lower() for m in ETYMON.finditer(kropp))
    tr = _medicinska(frekvens(kroppar), lem, suffix)
    for o in list(tr):
        if o in etymon or _svensk_sammansattning(o, lem):
            del tr[o]
    return tr


def kalla_korpus(frek_korpus, lem, suffix):
    return _medicinska(frek_korpus, lem, suffix)


def kalla_huvudord(lem, frek_korpus, suffix):
    """Huvudord som bara finns inbakade i ordlistans egna sammansättningar.

    Två delningar, bägge vid en verklig ordgräns:

    1. Flerordslemman — sista ledet i `ulcerös kolit` och `mikroskopisk kolit`
       är `kolit`, och det saknar egen post.
    2. Sammanskrivna lemman — `enterokolit` delas bara där resten är BELAGD
       som eget ord någon annanstans i trädet. Utan det kravet delas varje
       lemma vid varje teckenposition och källan svarar `ologi`, `oskopi`,
       `ometer` — fogvokalen `-o-` plus en ändelse, aldrig ett huvudord.
    """
    def gangbar(o):
        return (o.isalpha() and o not in lem
                and not latinsk_bojning_av_lemma(o, lem)
                and not bojning_av_lemma(o, lem)
                and any(o.endswith(s) for s in suffix))

    tr = collections.Counter()
    for t in lem:
        if " " in t:
            sista = t.rsplit(" ", 1)[1]
            if len(sista) >= 4 and gangbar(sista):
                tr[sista] += 1
        elif t.isalpha() and len(t) >= 9:
            for k in range(4, len(t) - 4):
                rest = t[k:]
                if len(rest) >= 5 and gangbar(rest) and frek_korpus.get(rest, 0) >= 2:
                    tr[rest] += 1
                    break
    return collections.Counter({k: v for k, v in tr.items() if v >= 2})


# ---------------------------------------------------------------------- körning

def las_json(sokvag, standard):
    if not sokvag.exists():
        return standard
    return json.loads(sokvag.read_text(encoding="utf-8"))


def samla():
    poster = json.loads(ORDLISTA.read_text(encoding="utf-8"))
    lem = lemman(poster)
    prefix = byggstenar(poster, "prefix")
    # Två suffixnivåer med flit. De öppna källorna (brodtext, korpus) läser
    # löpande svenska och behöver ett strängt morfologikrav — släpps `-al`,
    # `-in` och `-om` in där svarar de `normal`, `sedan` och `eftersom`. De
    # slutna källorna läser bara ordlistans egna lemman, som redan är
    # medicinska, och tjänar på den vida listan: utan `-it` syns inte att
    # `kolit` saknas bakom `ulcerös kolit`.
    suffix = byggstenar(poster, "suffix")
    suffix_bred = byggstenar(poster, "suffix", minsta=2)
    # Nycklar som börjar på _ är dokumentation i filen, inte ord.
    ignorerade = {k for k in las_json(IGNORERADE, {}) if not k.startswith("_")}

    frek_korpus = frekvens(korpustext())
    ut = {
        "korsref": kalla_korsref(poster, lem),
        "exempel": kalla_exempel(poster, lem),
        "synonym": kalla_synonym(poster, lem),
        "brodtext": kalla_brodtext(poster, lem, suffix),
        "korpus": kalla_korpus(frek_korpus, lem, suffix),
        "huvudord": kalla_huvudord(lem, frek_korpus, suffix_bred),
    }
    for namn, tr in ut.items():
        for o in list(tr):
            if o in ignorerade:
                del tr[o]
    return len(poster), ut


def main(argv):
    ap = argparse.ArgumentParser(description="Breddtäckning för data/ordlista.json")
    ap.add_argument("--lista", metavar="KÄLLA",
                    help="skriv ut kandidaterna i en källa (%s, eller 'alla')"
                         % ", ".join(KALLOR))
    ap.add_argument("--topp", type=int, default=30,
                    help="antal rader per källa vid --lista (0 = alla)")
    ap.add_argument("--json", action="store_true", help="maskinläsbar utdata")
    ap.add_argument("--check", action="store_true",
                    help="exit 1 om någon källa gett fler utslag än facit")
    ap.add_argument("--skriv-facit", action="store_true",
                    help="skriv om facit till dagens läge (gör efter triage)")
    a = ap.parse_args(argv)

    antal, ut = samla()

    if a.json:
        print(json.dumps({k: dict(v.most_common()) for k, v in ut.items()},
                         ensure_ascii=False, indent=1))
        return 0

    if a.skriv_facit:
        FACIT.write_text(json.dumps({k: len(v) for k, v in ut.items()},
                                    ensure_ascii=False, indent=1) + "\n",
                         encoding="utf-8")
        print("facit skrivet:", FACIT.relative_to(ROOT))
        return 0

    if a.check:
        facit = las_json(FACIT, None)
        if facit is None:
            print("Inget facit finns. Kör --skriv-facit efter första triagen.",
                  file=sys.stderr)
            return 1
        fel = 0
        for namn in KALLOR:
            nu, da = len(ut[namn]), facit.get(namn)
            if da is None:
                print(f"FEL  {namn}: saknas i facit", file=sys.stderr)
                fel += 1
            elif nu > da:
                print(f"FEL  {namn}: {nu} utslag, facit {da} "
                      f"(+{nu - da}) — nya ord utan post. "
                      f"Kör --lista {namn} och triagera.", file=sys.stderr)
                fel += 1
        return 1 if fel else 0

    if a.lista:
        valda = KALLOR if a.lista == "alla" else [a.lista]
        for namn in valda:
            if namn not in ut:
                print(f"Okänd källa: {namn}", file=sys.stderr)
                return 2
            rader = ut[namn].most_common(None if a.topp == 0 else a.topp)
            print(f"\n== {namn} ({len(ut[namn])} kandidater)")
            for o, n in rader:
                print(f"  {n:5d}  {o}")
        return 0

    print(f"data/ordlista.json: {antal} poster\n")
    print(f"{'Källa':10s} {'Kandidater':>10s}   Vad utslaget betyder")
    text = {
        "korsref": "posten lovar ett uppslagsord som inte finns",
        "exempel": "byggstenens exempelord saknar egen post",
        "synonym": "svenskt synonymord utan eget uppslagsord",
        "brodtext": "ordet förklarar en annan post men saknar egen",
        "korpus": "ordet används på sajten men saknas i ordlistan",
        "huvudord": "sammansättningar finns, huvudordet saknas",
    }
    for namn in KALLOR:
        print(f"{namn:10s} {len(ut[namn]):10d}   {text[namn]}")
    print("\nDetaljer:  --lista <källa> [--topp 0]")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
