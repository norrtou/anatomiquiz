#!/usr/bin/env python3
"""Sidfoten — ansvarsfriskrivning, integritetsrad och datum i ett block.

Sidans finstilta hörde tidigare hemma på tre ställen: `<footer class="footer">`
med kakraden fanns på två sidor, datumraden låg löst före `</main>` på 116, och
ansvarsfriskrivningen saknades på 113. Tre lösa rader efter det som avslutar
sidan ser ut som något som blivit över. Ett block ser ut som ett beslut.

Modulen definierar raderna och vem som får vilken, och äger dem ensam:

  * `FRISKRIVNING` — vad materialet är och inte är. YMYL-innehåll kräver det,
    och det ska stå med **samma ord** på varje sida.
  * `INTEGRITET`   — kakor och personuppgifter, med länk till policyn. Låg
    tidigare bara på `index.html` och `spellagen.html`.
  * `RX`           — hela sidfoten som mönster. `sidodatum.py` behöver den för
    att kunna stryka blocket i `normalisera()`, av samma skäl som datumraden
    stryks där: boilerplate som läggs på hela sajten samma dag är ingen
    innehållsuppdatering, och hade den räknats som en sådan hade alla sidorna
    daterats om till den dagen.

Tre listor, tre olika frågor. `UTAN_SIDFOT` är sidor som inte är innehållssidor
alls. `UTAN_FRISKRIVNING` är sidor som har sidfot men inte ska bära just
friskrivningsraden — antingen för att de inte innehåller något medicinskt, eller
för att de redan säger samma sak fylligare i brödtexten. `UTAN_INTEGRITETSRAD`
är policyn själv. Alla tre är uttryckliga: en ny sida som inte står i någon av
dem får sidfoten med allt, och en ny sida som saknar `<main>` stoppar bygget i
stället för att tyst hamna utanför (CLAUDE_REGLER §0.4).

**Ingen variant per sidtyp utöver det.** Läkemedelsräknarens `.vt-ansvar` är en
annan sak — den handlar om att stämma av ett uträknat svar mot ordination och
produktinformation och hör hemma bredvid räknarna.

**`reviewedBy` skrivs inte.** SEO-svepets punkt 8 väckte frågan, och svaret är
nej så länge ingen utomstående faktiskt har granskat innehållet. En sida som
påstår sig vara granskad utan att vara det är ett sämre EEAT-läge än en sida som
inte påstår något — och ett direkt osant påstående i YMYL-material.

Användning:
    python3 scripts/sidfot.py        # visa raderna och vilka sidor som får dem
"""
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent

# Raderna i sidfoten, i den ordning de står. Ingen fetstil: sidfoten ska kunna
# läsas av den som söker den, inte ta uppmärksamhet från innehållet.
FRISKRIVNING = ("Utbildningsmaterial, inte medicinsk rådgivning. Innehållet är "
                "avsett för studier och ersätter inte kurslitteratur, "
                "undervisning eller kliniska riktlinjer. Det ska inte användas "
                "som underlag för vård eller behandling av patienter.")

# Absolut sökväg — sidfoten är identisk oavsett hur djupt sidan ligger.
INTEGRITET = ('Anatomiquiz använder inga kakor och samlar inte in '
              'personuppgifter. Läs mer i <a href="/integritet.html" '
              'class="info-link">integritetspolicyn</a>.')

ÖPPNA = '<footer class="page-footer">'
STÄNG = "</footer>"

# Hela blocket med sitt radbrott och sitt indrag — exakt så mycket som lades
# till, och inte ett tecken mer. `\s*` hade svalt även den tomrad som skiljer
# sidfoten från stycket ovanför, och wire_sidfot.py hade då tagit bort en tomrad
# per körning i stället för att rundtrippa till identitet.
RX = re.compile(r'\n[ \t]*<footer class="page-footer">.*?</footer>', re.S)

# Sidfotens tidigare skepnader. `normalisera()` i sidodatum.py jämför mot
# git-historiken, och måste därför känna igen boilerplate även som den SÅG UT DÅ.
# Gör den inte det ser hela sajten ändrad ut den dag formen byts — och just den
# falska färskhetssignalen är vad normaliseringen finns för att undvika.
HISTORISKA_RX = [
    # 0.9.271: friskrivningen som ett löst stycke före datumraden.
    re.compile(r'\n[ \t]*<p class="page-disclaimer">.*?</p>', re.S),
    # T.o.m. 0.9.271: kakraden i en egen sidfot på index.html och spellagen.html,
    # på index föregången av sitt kommentarblock.
    re.compile(r'\n[ \t]*(?:<!-- =+\n[ \t]*Sidfot[^\n]*\n[ \t]*=+ -->\n[ \t]*)?'
               r'<footer class="footer">.*?</footer>', re.S),
]

# Sidor utan sidfot. Inga innehållssidor: den ena indexeras inte, den andra är
# en avsiktlig omdirigeringsstump.
UTAN_SIDFOT = {
    "404.html",                # felsida — HTTP-statusen är signalen
    "ordlista-tecken.html",    # avsiktlig redirect-stump sedan 0.9.257
}

# Integritetsraden hoppas över på policyn själv. En sidfot som länkar till den
# sida man redan står på är brus, inte service.
UTAN_INTEGRITETSRAD = {"integritet.html"}

# Sidor med sidfot men utan friskrivningsraden. Två skäl, båda ska stå skrivna.
UTAN_FRISKRIVNING = {
    # Inget medicinskt innehåll:
    "integritet.html",         # juridisk text om personuppgifter
    "versionshistorik.html",   # ändringslogg för appen
    # Säger redan samma sak fylligare i brödtexten:
    "info.html",               # "Källor och kvalitetssäkring"
    "spellagen.html",          # "Ett komplement – inte en ersättning"
}


def sidor() -> list[str]:
    """Sökvägarna till de sidor som ska ha sidfot.

    Populationen är **alla** HTML-sidor utanför `_arkiv`, inte de som råkar ha
    strukturdata eller stå i ett register. En ny sida ska tvinga fram ett
    beslut; tyst uteblivet är det enda som inte är ett alternativ.
    """
    alla = {p.relative_to(ROOT).as_posix() for p in ROOT.rglob("*.html")
            if "_arkiv" not in p.parts}
    listade = UTAN_SIDFOT | UTAN_FRISKRIVNING | UTAN_INTEGRITETSRAD
    spöken = sorted(listade - alla)
    if spöken:
        raise SystemExit(
            "STOPP: listorna i scripts/sidfot.py nämner sidor som inte finns: "
            f"{spöken}. Ta bort dem.")
    return sorted(alla - UTAN_SIDFOT)


def block(rel: str, indrag: str, datumrad: str | None) -> str:
    """Sidfoten för sidan `rel`, färdig att klistras in.

    `datumrad` är sidans befintliga `<p class="page-updated">`, om den finns.
    Den flyttas med in i blocket — annars hade `wire_dates.py` lagt den utanför
    och sidfoten varit tudelad igen.
    """
    inre = indrag + "  "
    rader = [] if rel in UTAN_FRISKRIVNING else [f"{inre}<p>{FRISKRIVNING}</p>"]
    if rel not in UTAN_INTEGRITETSRAD:
        rader.append(f"{inre}<p>{INTEGRITET}</p>")
    if datumrad:
        rader.append(inre + datumrad)
    return "\n".join([indrag + ÖPPNA] + rader + [indrag + STÄNG])


def main():
    s = sidor()                        # innan något skrivs ut: larmet först
    print(block("kunskapsbank/ledtyper.html", "    ", None))
    print()
    print(f"{len(s)} sidor har sidfot, {len(UTAN_SIDFOT)} står utan:")
    for rel in sorted(UTAN_SIDFOT):
        print(f"  {rel}")
    print(f"{len(s) - len(UTAN_FRISKRIVNING)} av dem bär friskrivningsraden, "
          f"{len(UTAN_FRISKRIVNING)} gör inte det:")
    for rel in sorted(UTAN_FRISKRIVNING):
        print(f"  {rel}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
