#!/usr/bin/env python3
"""Sajtens identitetsentiteter — författaren och utgivaren, definierade en gång.

Före det här låg identiteten inbakad på sex ställen: fyra generatorer skrev
`{"@type": "Organization", "name": "Norrtou Creations"}` som `author`, medan
`index.html` och `info.html` bar var sin handskriven Person-nod. Resultatet var
att företaget stod som *författare* till anatomitexterna, att personen bakom
sajten bara syntes på startsidan, och att de tre kopiorna av Person-noden inte
var samma sak för en svarsmotor eftersom ingen av dem hade ett `@id`.

Två roller, två entiteter:

- **`author` är personen.** Daniel Medin skriver innehållet. Det är den
  starkaste E-E-A-T-signalen sajten har — namngiven person med verifierbar
  närvaro — och den hör hemma på YMYL-sidorna, inte bara på startsidan.
- **`publisher` är organisationen.** Norrtou Creations ger ut sajten. Så säger
  också integritetspolicyn ("Anatomiquiz drivs av Norrtou Creations, enskild
  utgivare"), medan kunskapsbanken tidigare skrev `"name": "Anatomiquiz"` —
  två namn för samma utgivare motverkar hela poängen med att bygga en entitet.

`@id` är det som gör 118 inline-kopior till *en* entitet. Noderna skrivs ut i
sin helhet på varje sida i stället för som nakna `{"@id": ...}`-referenser:
en crawler som landar på en enskild undersida ska kunna läsa ut vem som skrivit
den utan att först ha hämtat startsidan. `@id` binder ihop dem.

Ändras något här måste `scripts/wire_identity.py --all` köras om.
"""

SITE = "https://anatomiquiz.se"

PERSON_ID = f"{SITE}/#daniel-medin"
ORGANISATION_ID = f"{SITE}/#norrtou-creations"

# Beskrivningen är info.html:s — den fylligare av de två varianter som fanns,
# och den enda som bär kvalifikationerna. Det är kvalifikationerna som är
# poängen med signalen; utan dem är det bara ett namn.
PERSON = {
    "@type": "Person",
    "@id": PERSON_ID,
    "name": "Daniel Medin",
    "description": "Utbildad medicinsk sekreterare och studerande i arbetsterapi "
                   "vid Lunds universitet, med särskilt intresse för anatomi.",
    "url": "https://norrtou.se",
    "sameAs": [
        "https://norrtou.se",
        "https://www.linkedin.com/in/danielmedin",
        "https://github.com/norrtou",
    ],
}

ORGANISATION = {
    "@type": "Organization",
    "@id": ORGANISATION_ID,
    "name": "Norrtou Creations",
    "url": "https://norrtou.se",
    "logo": {
        "@type": "ImageObject",
        "url": f"{SITE}/img/icon-512.png",
    },
    "sameAs": ["https://github.com/norrtou"],
}
