#!/usr/bin/env python3
"""Den medicinska ansvarsfriskrivningen — en text, ett ställe.

Anatomiquiz är YMYL-innehåll: någon som läser fel i en muskeltabell eller en
läkemedelsformel kan ta skada av det. Då ska varje sida säga vad materialet är
och vad det inte är — och säga det med **samma ord**. Fram till 0.9.271 stod
friskrivningen på fem sidor i fyra olika formuleringar, och de 113 sidor som
faktiskt bär det medicinska innehållet saknade den helt.

Modulen definierar tre saker och äger dem ensam:

  * `MARKUP`   — den färdiga raden, tecken för tecken. `wire_friskrivning.py`
                 skriver in den; den skrivs aldrig för hand på en sida.
  * `RX`       — samma rad som mönster. `sidodatum.py` behöver den för att kunna
                 stryka raden ur `normalisera()`, av samma skäl som datumraden
                 stryks där: en boilerplate-rad som läggs på hela sajten samma
                 dag är ingen innehållsuppdatering, och hade den räknats som en
                 sådan hade alla 113 sidorna daterats om till den dagen.
  * `UTAN_FRISKRIVNING` — sidorna som medvetet står utanför, med skäl. Listan är
                 uttrycklig: en ny sida som inte står med stoppar bygget i
                 stället för att tyst hamna utanför (CLAUDE_REGLER §0.4).

**Ingen variant per sidtyp.** Läkemedelsräknaren har sin egen säkerhetsruta
(`.vt-ansvar`) om att stämma av svaret mot ordination och produktinformation —
den är specifik för räknarna och hör hemma bredvid dem. Den här raden är den
generella, och den enda garantin att en delad komponent inte glider isär är att
det finns exakt en sträng att glida ifrån.

**`reviewedBy` skrivs inte.** SEO-svepets punkt 8 väckte frågan, och svaret är
nej så länge ingen utomstående faktiskt har granskat innehållet. En sida som
påstår sig vara granskad utan att vara det är ett sämre EEAT-läge än en sida som
inte påstår något — och ett direkt osant påstående i YMYL-material.

Användning:
    python3 scripts/friskrivning.py        # visa texten och vilka sidor som får den
"""
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent

# Raden som ska stå på varje innehållssida. Medvetet utan länkar: komponenten
# ska vara byte-identisk oavsett hur djupt sidan ligger, och en länk i en
# friskrivning drar blicken bort från det som ska läsas.
MARKUP = ('<p class="page-disclaimer"><strong>Utbildningsmaterial, inte '
          'medicinsk rådgivning.</strong> Innehållet är avsett för studier och '
          'ersätter inte kurslitteratur, undervisning eller kliniska '
          'riktlinjer. Det ska inte användas som underlag för vård eller '
          'behandling av patienter.</p>')

# Raden med sitt radbrott och sitt indrag — exakt så mycket som lades till, och
# inte ett tecken mer. `\s*` hade svalt även den tomrad som skiljer raden från
# stycket ovanför, och `wire_friskrivning.py` hade då tagit bort en tomrad per
# körning i stället för att rundtrippa till identitet.
RX = re.compile(r'\n[ \t]*<p class="page-disclaimer">.*?</p>', re.S)

# Sidor som medvetet står utanför. Två skäl förekommer, och båda ska stå skrivna:
# sidan bär inget medicinskt innehåll, eller den bär redan en fylligare
# friskrivning som den här raden bara hade upprepat i kortform.
UTAN_FRISKRIVNING = {
    # Inget medicinskt innehåll:
    "404.html",                # felsida, ingen innehållssida
    "ordlista-tecken.html",    # avsiktlig redirect-stump sedan 0.9.257
    "integritet.html",         # juridisk text om personuppgifter
    "versionshistorik.html",   # ändringslogg för appen
    # Bär redan en egen, fylligare friskrivning i brödtexten:
    "info.html",               # "Källor och kvalitetssäkring"
    "spellagen.html",          # "Ett komplement – inte en ersättning"
}


def sidor() -> list[str]:
    """Sökvägarna till de sidor som ska bära friskrivningen.

    Populationen är **alla** HTML-sidor utanför `_arkiv`, inte de som råkar ha
    strukturdata eller stå i ett register. En ny sida ska tvinga fram ett
    beslut: antingen bär den friskrivningen eller så står den i
    UTAN_FRISKRIVNING med ett skäl. Tyst uteblivet är det enda som inte är ett
    alternativ.
    """
    alla = {p.relative_to(ROOT).as_posix() for p in ROOT.rglob("*.html")
            if "_arkiv" not in p.parts}
    saknas = sorted(UTAN_FRISKRIVNING - alla)
    if saknas:
        raise SystemExit(
            f"STOPP: UTAN_FRISKRIVNING nämner sidor som inte finns: {saknas}. "
            "Ta bort dem ur listan i scripts/friskrivning.py.")
    return sorted(alla - UTAN_FRISKRIVNING)


def main():
    s = sidor()                        # innan något skrivs ut: larmet först
    print(MARKUP)
    print()
    print(f"{len(s)} sidor bär friskrivningen, "
          f"{len(UTAN_FRISKRIVNING)} står utanför:")
    for rel in sorted(UTAN_FRISKRIVNING):
        print(f"  {rel}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
