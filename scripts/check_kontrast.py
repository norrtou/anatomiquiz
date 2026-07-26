#!/usr/bin/env python3
"""Mät WCAG-kontrasten på varje yta som sätter både textfärg och bakgrund.

Punkt 10 och 13 i SEO-svepet var kontrastmissar: `--text-secondary` klarade
4,40:1 mot mintbakgrunden (punkt 10, åtgärdad 0.9.259) och vit text på den
ljusa änden av `linear-gradient(--primary, --primary-light)` klarade **1,92:1**
på varje ordlistesidas klistrade bokstavsrubrik (punkt 13). Ingen av dem syntes
i något test — en kontrastmiss ser ut som en fungerande sida.

Kontrollen räknar kvoten ur CSS:en själv, inte ur en handskriven lista med
värden. Den kan därför inte bli inaktuell när paletten ändras: byter någon
`--primary` mot en ljusare grön faller varje yta som bär vit text på den.

## Vad som mäts

Varje regelblock i `css/*.css` som sätter **både** `color` och
`background`/`background-color` är en *yta*. För varje yta löses `var()` upp mot
paletten, alla färgstopp i en gradient plockas ut, och den sämsta kombinationen
av text mot stopp jämförs med WCAG AA:

- 4,5:1 för vanlig text
- 3,0:1 för stor text (≥ 1,5 rem, eller ≥ 1,1667 rem vid `font-weight` ≥ 700)

Ytan mäts **två gånger**, en gång per tema. I mörkt läge läggs eventuella
`:root[data-theme="dark"] <samma selektor>`-block över basblocket först — det är
så paletten faktiskt fungerar, och utan det hade kontrollen larmat om ytor som
mörkt läge redan lagat.

Fyra former mäts som annars hade sluppit undan: genomskinliga bottnar,
halvgenomskinlig text vars botten sitter i en annan regel (`ÄRVD_BOTTEN`),
gradient som textfyllning (`TEXT_PLATTOR`) och bakgrunder inne i `@keyframes`
(`KEYFRAME_PLATTOR`).

## Genomskinliga ytor

En bakgrund med alfa (`rgba(16, 185, 129, 0.12)`) har ingen kontrast i sig —
den beror på vad som ligger bakom. Sådana ytor kan inte mätas utan att någon
säger vad som ligger bakom, och det är omdöme, inte något som går att läsa ur
CSS:en (§0.3). De står därför i `BAKGRUND` med sin bakdel angiven och blandas
ihop till en opak färg före mätningen.

**En yta som varken går att mäta eller står i `BAKGRUND` eller `OMÄTBARA`
stoppar bygget.** Det är hela poängen: en ny chip med grön tonplatta ska tvinga
fram ett beslut om vad den ligger på, inte tyst hamna utanför kontrollen (§0.4).

## Vad som INTE mäts

Kontrollen läser ett block i taget och modellerar ingen kaskad utöver
temaöverskrivningen. En färg som ärvs från en förälder, sätts av en annan
selektor eller kommer ur `color-mix()` går inte att avgöra här; de ytorna står i
`OMÄTBARA` med skäl. Kontrollen ersätter alltså inte att man tittar på sidan —
den fångar den feltyp som går att räkna.

Användning:
    python3 scripts/check_kontrast.py          # exit 1 vid första bristen
    python3 scripts/check_kontrast.py -v       # lista varje mätt yta
"""
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent

CSS_FILER = ("css/styles.css", "css/glossary.css", "css/verktyg.css")

# WCAG 2.1 AA. Stor text är 18 pt (1,5 rem) eller 14 pt fet (1,1667 rem).
AA_NORMAL = 4.5
AA_STOR = 3.0
STOR_REM = 1.5
STOR_REM_FET = 14 / 12  # 1,1667 rem

# Ytor med genomskinlig bakgrund: vad ligger bakom? Handskrivet, för det är
# omdöme. Värdet är en palettvariabel eller en hex; den blandas med ytans egen
# alfafärg innan kontrasten räknas.
BAKGRUND = {
    ".badge": "--surface",
    ".badge.placeholder": "--surface",
    ".btn-mode:disabled": "--surface",
    ".btn-mode--ready": "--surface",
    ".btn-cancel:hover:not(:disabled)": "--surface",
    ".tidsjakt-record-chip": "--surface",
    ".case-topic-tag": "--surface",
    ".kb-status.is-live": "--surface",
    ".kb-status.is-soon": "--surface",
    ".kb-seealso-list a": "--surface",
    ".kb-tabletools-btn": "--surface",
    ".vt-inputrow select": "--surface",
    ".vt-unit-fixed": "--surface",
    ".glossary-alpha": "--surface",
}

# Ytor som inte går att mäta här, med skäl. Nyckeln är selektorn ordagrant.
OMÄTBARA = {
    ".btn":
        "background: transparent — knappens yta är den som ligger bakom, och "
        "varje variant (.btn-primary m.fl.) sätter sin egen bakgrund och mäts där.",
    ".btn-mode": "background: transparent — samma sak som .btn.",
    ".vt-mode button": "background: transparent — aktivt läge mäts på [aria-pressed].",
    ".vt-flikar button": "background: transparent — samma sak.",
    ".vt-nollstall button": "background: transparent — texten ligger på kortets yta.",
    ".vt-inputrow input":
        "background: transparent — talfältet ligger i .vt-inputrow, som bär ytan; "
        "raden mäts där.",
    ".leitner-box":
        "background: transparent — lådan ligger över .leitner-chip, och den "
        "aktiva lådans vita text mäts mot chipet.",
    ".hub-tile":
        "gradient med två alfastopp över --surface, och texten är sidans egen "
        "brödtextfärg — plattan är en aning grön, inte en färgad yta.",
    ".kb-card": "color: inherit — kortets text ärvs från sidan.",
    ".glossary-results .glossary-def mark.glossary-hit":
        "color: inherit och color-mix() — sökträffens ton beräknas av "
        "webbläsaren och går inte att räkna ut här.",
}

# Text med alfa som ligger på en ANNAN regels botten. En halvgenomskinlig
# textfärg utan egen bakgrund i samma block har ingen mätbar kontrast förrän man
# vet vilken yta den ligger på — och den ytan står i en annan regel. Nyckeln är
# elementets selektor, värdet den selektor vars bakgrund den vilar på.
# `.glossary-top` satt på 4,43:1 (0,85 vitt mot plattan) och slank igenom hela
# mätningen i 0.9.280 just för att den inte sätter någon egen bakgrund.
ÄRVD_BOTTEN = {
    ".glossary-top": ".glossary-letter",
}

# Gradient som TEXTFYLLNING (`background-clip: text`). Där är gradienten
# textfärgen, inte bottnen, och kontrasten ska mätas mot det som ligger BAKOM
# elementet. Vad det är kan inte läsas ur regeln — därför handskrivet.
TEXT_PLATTOR = {
    # Sajttiteln ligger på sidans egen gradient; --bg-gradient-end är den ljusaste
    # änden och därmed det sämsta fallet.
    ".header h1": "--bg-gradient-end",
}

# Bakgrunder inne i @keyframes: vilken textfärg ligger på den animerade plattan?
# En animation kan inte veta det själv. `None` = plattan bär ingen egen text.
# En ny @keyframes som rör background och inte står här stoppar bygget (§0.4) —
# det var precis där blink-red gömde sig: halva blinket gav vit text 2,78:1.
KEYFRAME_PLATTOR = {
    "blink-red": "#ffffff",          # .timer.warning – vit text
    "leitnerMasteryGlow": None,      # glöd bakom cellen, ingen egen text
}

# MÄTT, REDOVISAT OCH MEDVETET OFÖRÄNDRAT. Enbart användarens beslut hör hit,
# aldrig ett eget "det får vara så". Kvoten står med: ändras den fälls posten,
# oavsett om ytan blev bättre (då ska posten bort) eller sämre.
REDOVISADE = {
    # Sajttiteln i gradient är sajtens ansikte. Att göra den mörkare för att nå
    # 3:1 (stor text) ändrar hela startsidans uttryck, och det är inte ett
    # metadatabeslut. Mätt 2026-07-26, lämnat orört i väntan på besked.
    (".header h1", "ljust"): 1.75,
}

HEX = re.compile(r"#[0-9a-fA-F]{3,8}\b")
RGBA = re.compile(r"rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)")
VAR = re.compile(r"var\(\s*(--[\w-]+)\s*(?:,([^()]*(?:\([^()]*\)[^()]*)*))?\)")
DEKL = re.compile(r"(?<![-\w])(color|background|background-color|font-size|font-weight)"
                  r"\s*:\s*([^;{}]+?)\s*(?:!important)?\s*;")
NAMN = {"white": "#ffffff", "black": "#000000"}


# --------------------------------------------------------------------------- #
# Färgmatte
# --------------------------------------------------------------------------- #
def hex_till_rgb(h):
    h = h.lstrip("#")
    if len(h) == 3:
        h = "".join(c * 2 for c in h)
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def luminans(rgb):
    kanaler = []
    for v in rgb:
        v /= 255
        kanaler.append(v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4)
    return 0.2126 * kanaler[0] + 0.7152 * kanaler[1] + 0.0722 * kanaler[2]


def kvot(a, b):
    la, lb = luminans(a), luminans(b)
    return (max(la, lb) + 0.05) / (min(la, lb) + 0.05)


def blanda(fram, alfa, bak):
    """Lägg en alfafärg över en opak bakgrund."""
    return tuple(round(f * alfa + b * (1 - alfa)) for f, b in zip(fram, bak))


# --------------------------------------------------------------------------- #
# CSS-läsning
# --------------------------------------------------------------------------- #
def läs_css():
    text = {}
    for rel in CSS_FILER:
        p = ROOT / rel
        if not p.exists():
            sys.exit(f"FEL: {rel} finns inte.")
        text[rel] = re.sub(r"/\*.*?\*/", "", p.read_text(encoding="utf-8"), flags=re.S)
    return text


def paletter(styles):
    """(ljus, mörk) — mörk är ljus med sina överskrivningar pålagda."""
    def vars_i(block):
        return {k: v.strip() for k, v in re.findall(r"(--[\w-]+)\s*:\s*([^;]+);", block)}

    m = re.search(r":root\s*\{(.*?)\n\}", styles, re.S)
    if not m:
        sys.exit("FEL: hittar inte :root i css/styles.css.")
    ljus = vars_i(m.group(1))
    m = re.search(r':root\[data-theme="dark"\]\s*\{(.*?)\n\}', styles, re.S)
    if not m:
        sys.exit('FEL: hittar inte :root[data-theme="dark"] i css/styles.css.')
    mörk = dict(ljus)
    mörk.update(vars_i(m.group(1)))
    return ljus, mörk


def lös(värde, palett, djup=0):
    """Expandera var() rekursivt mot en palett."""
    if djup > 8:
        return värde

    def ersätt(m):
        namn, fallback = m.group(1), m.group(2)
        if namn in palett:
            return lös(palett[namn], palett, djup + 1)
        return (fallback or "").strip()

    return VAR.sub(ersätt, värde)


def färgstopp(värde, palett):
    """([rgb, …], alfafärger) ur ett CSS-värde. Andra returen är [(rgb, alfa), …]."""
    värde = lös(värde, palett)
    opaka, genomskinliga = [], []
    for m in RGBA.finditer(värde):
        rgb = tuple(round(float(m.group(i))) for i in (1, 2, 3))
        alfa = float(m.group(4)) if m.group(4) is not None else 1.0
        (opaka if alfa >= 1 else genomskinliga).append(rgb if alfa >= 1 else (rgb, alfa))
    for h in HEX.findall(värde):
        if len(h) in (5, 9):          # #RGBA / #RRGGBBAA
            rgb = hex_till_rgb(h[:7] if len(h) == 9 else h[:4])
            alfa = int(h[-2:] if len(h) == 9 else h[-1] * 2, 16) / 255
            genomskinliga.append((rgb, alfa))
        else:
            opaka.append(hex_till_rgb(h))
    for namn, hx in NAMN.items():
        if re.search(r"(?<![-\w])" + namn + r"(?![-\w])", värde):
            opaka.append(hex_till_rgb(hx))
    return opaka, genomskinliga


def block(text):
    """[(fil, selektor, media, {dekl}), …] för varje regelblock i CSS-filerna."""
    ut = []
    for fil, t in text.items():
        # @media-kontexten: djupet räknas så att inre block vet vilken de sitter i.
        media = []
        i = 0
        while i < len(t):
            m = re.compile(r"([^{}]*)([{}])").match(t, i)
            if not m:
                break
            huvud, tecken = m.group(1).strip(), m.group(2)
            i = m.end()
            if tecken == "}":
                if media:
                    media.pop()
                continue
            if huvud.startswith("@"):
                media.append(huvud)
                continue
            # Ett vanligt regelblock: läs till matchande }
            slut = t.find("}", i)
            kropp = t[i:slut]
            i = slut + 1
            dekl = {k: v.strip() for k, v in DEKL.findall(kropp)}
            if dekl:
                ut.append((fil, " ".join(huvud.split()), " ".join(media), dekl))
    return ut


def ytor(alla):
    """De block som sätter både textfärg och bakgrund — de enda som går att mäta."""
    return [b for b in alla
            if "color" in b[3] and ("background" in b[3] or "background-color" in b[3])]


def ärvda_ytor(alla):
    """Block med halvgenomskinlig text utan egen bakgrund → yta mot förälderns.

    Utan det här steget mäts de inte alls: `mät()` kräver en bakgrund i samma
    block. Ett sådant block är antingen registrerat i `ÄRVD_BOTTEN` eller ett
    fel — en dämpad textfärg är alltid dämpad *mot något*.
    """
    ut, okända = [], []
    bakgrunder = {}
    for _fil, sel, _media, d in alla:
        for del_ in sel.split(","):
            if "background" in d or "background-color" in d:
                bakgrunder.setdefault(del_.strip(),
                                      d.get("background", d.get("background-color")))
    for fil, sel, media, d in alla:
        if "color" not in d or "background" in d or "background-color" in d:
            continue
        if not re.search(r"rgba\([^)]*,\s*0?\.\d+\s*\)|#[0-9a-fA-F]{4}\b(?!\w)"
                         r"|#[0-9a-fA-F]{8}\b", d["color"]):
            continue
        for del_ in sel.split(","):
            del_ = del_.strip()
            förälder = ÄRVD_BOTTEN.get(del_)
            if förälder is None:
                okända.append((del_, "genomskinlig textfärg utan egen bakgrund och "
                                     "utan post i ÄRVD_BOTTEN"))
                continue
            if förälder not in bakgrunder:
                okända.append((del_, f"ÄRVD_BOTTEN pekar på {förälder}, som inte "
                                     f"sätter någon bakgrund"))
                continue
            syntetisk = dict(d)
            syntetisk["background"] = bakgrunder[förälder]
            ut.append((fil, del_, media, syntetisk))
    return ut, okända


def textplattor(text):
    """Gradient som textfyllning → yta där gradienten är TEXTEN, bottnen bakdelen.

    `background-clip: text` gör bakgrunden till text. Utan det här steget hade
    sådana element sluppit mätningen helt, eftersom de aldrig sätter `color` —
    och sajttiteln stod på 1,75:1 utan att något sa till.
    """
    ut, okända = [], []
    for fil, t in text.items():
        for m in re.finditer(r"([^{}]+)\{([^{}]*background-clip:\s*text[^{}]*)\}", t):
            sel = " ".join(m.group(1).split())
            dekl = {k: v.strip() for k, v in DEKL.findall(m.group(2))}
            if "background" not in dekl:
                continue
            if sel not in TEXT_PLATTOR:
                okända.append((sel, "gradient som textfyllning utan post i TEXT_PLATTOR"))
                continue
            syntetisk = dict(dekl)
            syntetisk["color"] = dekl["background"]
            syntetisk["background"] = f"var({TEXT_PLATTOR[sel]})"
            ut.append((fil, sel, "", syntetisk))
    return ut, okända


def mörk_överskrivning(selektor, alla):
    """Dekl. från :root[data-theme="dark"] <selektor>, om någon finns."""
    dekl = {}
    for _fil, sel, _media, d in alla:
        for del_ in sel.split(","):
            del_ = del_.strip()
            if not del_.startswith(':root[data-theme="dark"] '):
                continue
            if del_[len(':root[data-theme="dark"] '):].strip() == selektor:
                dekl.update(d)
    return dekl


def gräns(dekl):
    """AA-gränsen för ytans text, och om den räknas som stor."""
    fs = dekl.get("font-size", "")
    fw = dekl.get("font-weight", "")
    m = re.search(r"([\d.]+)rem", fs)
    if not m:
        return AA_NORMAL, False        # okänd storlek → strängaste kravet
    rem = float(m.group(1))
    fet = fw.isdigit() and int(fw) >= 700 or fw in ("bold", "bolder")
    if rem >= STOR_REM or (fet and rem >= STOR_REM_FET):
        return AA_STOR, True
    return AA_NORMAL, False


# --------------------------------------------------------------------------- #
def mät(selektor, dekl, palett, styles_palett):
    """(kvot, textfärg, bakgrundsstopp) eller (None, skäl, None) om omätbar."""
    fram_o, fram_g = färgstopp(dekl["color"], palett)
    bak_värde = dekl.get("background", dekl.get("background-color", ""))
    bak_o, bak_g = färgstopp(bak_värde, palett)

    if re.search(r"(?<![-\w])(inherit|currentColor|color-mix)", lös(dekl["color"], palett)):
        return None, "textfärgen ärvs eller beräknas", None
    if not fram_o and not fram_g:
        return None, f"textfärgen går inte att läsa: {dekl['color']}", None

    if not bak_o and not bak_g:
        if re.search(r"(?<![-\w])transparent", lös(bak_värde, palett)):
            return None, "bakgrunden är transparent", None
        return None, f"bakgrunden går inte att läsa: {bak_värde}", None

    # Genomskinliga stopp blandas mot den bakdel som står i BAKGRUND.
    if bak_g:
        bakdel = BAKGRUND.get(selektor)
        if bakdel is None:
            return None, "genomskinlig bakgrund utan post i BAKGRUND", None
        stopp, _ = färgstopp(f"var({bakdel})" if bakdel.startswith("--") else bakdel, palett)
        if not stopp:
            return None, f"bakdelen {bakdel} går inte att läsa", None
        bak_o += [blanda(rgb, alfa, stopp[0]) for rgb, alfa in bak_g]

    if fram_g:                          # genomskinlig text mot varje stopp
        fram_o += [blanda(rgb, alfa, bak_o[0]) for rgb, alfa in fram_g]

    värsta = min(kvot(f, b) for f in fram_o for b in bak_o)
    return värsta, fram_o, bak_o


def hexa(rgb):
    return "#%02x%02x%02x" % rgb


def mät_keyframes(text, teman):
    """Kontrastera varje animerad platta mot den text som ligger på den.

    En animation kan sänka kontrasten i en femtedels sekund och sedan höja den
    igen. Det syns inte i någon statisk mätning, och det var exakt vad
    `blink-red` gjorde: halva blinket låg på 2,78:1 medan tiden rann ut.
    """
    brister, okända, mätta = [], [], 0
    for fil, t in text.items():
        for m in re.finditer(r"@keyframes\s+([\w-]+)\s*\{(.*?)\n\}", t, re.S):
            namn, kropp = m.group(1), m.group(2)
            if not re.search(r"background(-color)?\s*:", kropp):
                continue
            if namn not in KEYFRAME_PLATTOR:
                okända.append((f"@keyframes {namn}",
                               "animerar background utan post i KEYFRAME_PLATTOR"))
                continue
            textfärg = KEYFRAME_PLATTOR[namn]
            if textfärg is None:
                continue
            for steg, dekl in re.findall(r"([^{}]+)\{([^{}]*)\}", kropp):
                värde = re.search(r"background(?:-color)?\s*:\s*([^;}]+)", dekl)
                if not värde:
                    continue
                for tema, palett in teman:
                    opaka, genomskinliga = färgstopp(värde.group(1), palett)
                    if genomskinliga and not opaka:
                        okända.append((f"@keyframes {namn} {steg.strip()} [{tema}]",
                                       "genomskinlig animerad platta under text — "
                                       "gör den opak eller skriv None i KEYFRAME_PLATTOR"))
                        continue
                    if not opaka:
                        continue
                    fram = hex_till_rgb(textfärg)
                    värsta = min(kvot(fram, b) for b in opaka)
                    mätta += 1
                    if värsta < AA_NORMAL:
                        brister.append(
                            f"{värsta:5.2f}  @keyframes {namn} {steg.strip()}  [{tema}]"
                            f"  text {textfärg}"
                            f"  botten {'/'.join(hexa(b) for b in opaka)}"
                            f"  krav {AA_NORMAL}")
    return brister, okända, mätta


def main(argv):
    utförlig = "-v" in argv or "--verbose" in argv
    text = läs_css()
    ljus, mörk = paletter(text["css/styles.css"])
    alla = block(text)

    teman = (("ljust", ljus), ("mörkt", mörk))
    brister, hoppade, okända, mätta = [], [], [], 0
    redovisade, kvarglömda = [], dict(REDOVISADE)

    text_ytor, okända_text = textplattor(text)
    ärvda, okända_ärvda = ärvda_ytor(alla)
    okända += okända_text + okända_ärvda

    for fil, selektor, media, dekl in ytor(alla) + text_ytor + ärvda:
        for del_ in selektor.split(","):
            del_ = del_.strip()
            if not del_ or del_.startswith("@"):
                continue
            # Temablock mäts som del av sin bas-yta, inte för sig.
            if del_.startswith(':root[data-theme="dark"]'):
                continue
            if del_ in OMÄTBARA:
                hoppade.append((del_, OMÄTBARA[del_]))
                continue

            krav, stor = gräns(dekl)
            for tema, palett in teman:
                d = dict(dekl)
                if tema == "mörkt":
                    över = mörk_överskrivning(del_, alla)
                    if över:
                        # En överskriven bakgrund ersätter basens helt.
                        if "background" in över or "background-color" in över:
                            d.pop("background", None)
                            d.pop("background-color", None)
                        d.update(över)
                if media and "print" in media and tema == "mörkt":
                    continue            # utskrift är alltid papper
                res, fram, bak = mät(del_, d, palett, text["css/styles.css"])
                if res is None:
                    okända.append((f"{del_} [{tema}]", fram))
                    continue
                mätta += 1
                rad = (f"{res:5.2f}  {del_}  [{tema}]"
                       f"{'  ' + media if media else ''}"
                       f"  text {'/'.join(hexa(f) for f in fram)}"
                       f"  botten {'/'.join(hexa(b) for b in bak)}"
                       f"  krav {krav}{' (stor text)' if stor else ''}")
                nyckel = (del_, tema)
                if nyckel in REDOVISADE:
                    kvarglömda.pop(nyckel, None)
                    if round(res, 2) != REDOVISADE[nyckel]:
                        brister.append(
                            f"{rad}  ← står i REDOVISADE på "
                            f"{REDOVISADE[nyckel]}:1, mäter nu {round(res, 2)}:1")
                    else:
                        redovisade.append(rad)
                    continue
                if res < krav:
                    brister.append(rad)
                elif utförlig:
                    print("  ok   " + rad)

    kf_brister, kf_okända, kf_mätta = mät_keyframes(text, teman)
    brister += kf_brister
    okända += kf_okända
    mätta += kf_mätta

    if utförlig:
        for rad in redovisade:
            print("  RED  " + rad)
        if hoppade:
            print(f"\n  Ej mätta ({len(hoppade)}):")
            for sel, skäl in hoppade:
                print(f"    {sel}: {skäl}")

    if okända:
        print(f"FEL: {len(okända)} yta/ytor går inte att mäta och står inte i "
              f"BAKGRUND, ÄRVD_BOTTEN, OMÄTBARA, TEXT_PLATTOR eller "
              f"KEYFRAME_PLATTOR i scripts/check_kontrast.py:", file=sys.stderr)
        for sel, skäl in okända:
            print(f"  {sel}: {skäl}", file=sys.stderr)
        print("\nSkriv in vad som ligger bakom ytan eller varför den inte går att "
              "räkna. Tyst uteblivet är inte godkänt (§0.4).", file=sys.stderr)
        return 1

    if kvarglömda:
        print(f"FEL: {len(kvarglömda)} post(er) i REDOVISADE matchar ingen yta "
              f"längre – ta bort dem:", file=sys.stderr)
        for (sel, tema), kv in kvarglömda.items():
            print(f"  {sel} [{tema}], noterad på {kv}:1", file=sys.stderr)
        return 1

    if brister:
        print(f"FEL: {len(brister)} yta/ytor klarar inte WCAG AA:", file=sys.stderr)
        for rad in brister:
            print("  " + rad, file=sys.stderr)
        return 1

    print(f"OK: {mätta} mätpunkter i två teman klarar WCAG AA "
          f"({len(hoppade)} ej mätbara med skäl, {len(redovisade)} redovisade "
          f"och medvetet oförändrade).")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
