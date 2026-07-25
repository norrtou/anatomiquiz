#!/usr/bin/env python3
"""Vad som är latin på Anatomiquiz — regeln, på ett ställe.

`lang="la"` finns för att en skärmläsare annars uttalar *musculus
sternocleidomastoideus* med svensk fonetik. WCAG 3.1.2 Language of Parts (AA)
kräver att språket i ett avsnitt går att avgöra maskinellt, och sajten hade fram
till 0.9.275 **noll** förekomster av attributet trots tusentals latinska termer.

**Regeln bor här, inte i generatorerna.** Latinkolumner finns både i genererade
tabeller (muskler, skelett, kärl) och i handskrivna (nervtabellerna,
kranialnerverna), och ordlistan har sina egna uppslagsord. Låg svaret på frågan
"är det här latin?" i varje generator hade det funnits fem kopior att hålla i
synk, och de handskrivna sidorna hade blivit utan — samma slutsats som punkt 4,
6 och 8 i SEO-svepet kom fram till.

**Attributet sitter på `<em>`, aldrig på `<td>`.** Latinkolumnerna är inte rent
latinska: nervtabellerna skriver `<em>Nervus medianus</em><br>(medianusnerven)`
och kranialnervstabellen `<em>Nervus opticus</em> – synnerven`. Ett `lang="la"`
på cellen hade fått skärmläsaren att uttala den svenska översättningen som latin
också, alltså ett sämre läge än att inte märka något alls. `<em>` omsluter exakt
den latinska frasen och ingenting annat.
"""
from __future__ import annotations

import re

# Latinkolumnens etikett. Konventionen på sajten är att skriva "(latin)" i
# rubriken — "Muskel (latin)", "Ben (latin)", "Kärl (latin)", "Nerv (latin)",
# "Bana (latin)", "Nerv (latin / svenska)" — plus ledtabellens nakna "Latin".
# Mönstret är regeln, inte en fryst lista: en ny tabell som följer konventionen
# blir märkt av sig själv. En ny latinkolumn som INTE följer den blir det inte,
# och därför är konventionen ett krav (SEO_REGLER §7).
KOLUMN_RX = re.compile(r"\(latin|^Latin$", re.I)

# Ordlistans latinska uppslagsord står i TA:s inverterade form, "specifik,
# genus" ("abductor pollicis brevis, musculus"), för att sortera på det
# särskiljande ordet. Formen är sluten och maskinellt avgörbar — till skillnad
# från resten av ordlistan, som är svensk (`huvudvärk`, `cytotoxisk`),
# internationell (`infektion`) eller franska (`Souffle`) och kräver ett omdöme
# per post. Att gissa där hade märkt svenska ord som latin, vilket är en
# regression för skärmläsaren, inte en förbättring (CLAUDE_REGLER §0.3).
#
# Listan är uttömmande mot `data/ordlista.json`: samtliga 1 105 poster med den
# här formen slutar på ett av orden nedan. Dyker ett nytt ord upp stannar
# `wire_lang.py` hellre än gissar (CLAUDE_REGLER §0.4) — det kan lika gärna vara
# ett svenskt uppslagsord med komma som ett nytt latinskt genus.
GENUS = frozenset({
    "arteria", "arteriae", "articulatio", "articulationes", "bursa",
    "ganglion", "glandula", "glandulae", "ligamenta", "ligamentum",
    "musculi", "musculus", "nervi", "nervus", "nodi", "nodus", "ora",
    "os", "ossa", "plexus", "rami", "ramus", "tendo", "tonsilla",
    "trabeculae", "truncus", "trunci", "vas", "vena", "venae",
})

# "specifik, genus" — ett enda ord efter kommat. Två ord är inte den här formen.
INVERTERAD_RX = re.compile(r"^(.+?),\s+([A-Za-zà-ÿ]+)$")


def är_inverterad_ta(term: str) -> bool:
    """Är uppslagsordet ett latinskt anatominamn i TA:s inverterade form?

    Kastar `ValueError` när formen stämmer men genusordet är okänt — då ska
    någon titta på posten, inte skriptet gissa.
    """
    m = INVERTERAD_RX.match(term)
    if not m:
        return False
    genus = m.group(2).lower()
    if genus not in GENUS:
        raise ValueError(
            f'okänt ord efter kommat i ordlisteposten {term!r}: {genus!r}. '
            "Är det ett latinskt genus (som musculus, arteria) hör det hemma i "
            "GENUS i scripts/latin.py. Är det ett svenskt uppslagsord med komma "
            "ska posten döpas om — den inverterade formen är reserverad för "
            "Terminologia Anatomica.")
    return True


def är_svenska(text: str) -> bool:
    """Bär texten svenska tecken? Latin har inga å, ä eller ö.

    Grov men exakt åt det håll som spelar roll: en träff betyder säkert att
    texten inte är latin, och då ska den inte märkas som latin.
    """
    return bool(re.search(r"[åäöÅÄÖ]", text))
