# CSS-karta – vilken stylesheet styr vad

> **PROAKTIVA REGLER — [`CLAUDE_REGLER.md` §0](CLAUDE_REGLER.md) gäller över detta dokument.**
> Varje regel här ska tala om hur något skrivs **rätt från början**, inte hur felet hittas och
> rättas efteråt. Formulerar du en ny regel: mallen först, förbudet som komplement, och lägg
> den där arbetet utförs. Tvingar ett verktyg fram korrekturarbete ska verktyget byggas om.
>
> **§0.3:** kan något inte skrivas maskinellt utan uppenbar risk att bli fel eller slarvigt —
> text, kod, quizfråga, definition — **skrivs det för hand**. Automatisering väljs för att den
> bevisligen ger rätt resultat, aldrig för att den är bekvämare.

Läs detta **innan** du rör layout/typografi. Sajten har **tre** CSS-filer. Att glömma
att en sida laddar flera av dem (och i vilken ordning) är den vanligaste orsaken till
att en "fix" inte får effekt.

## De tre filerna

| Fil | Laddas av | Ansvar |
|-----|-----------|--------|
| `css/styles.css` | **Alla sidor** (~113 st) – index, quiz, alla artiklar, verktyg, ordlista m.fl. | Basen: layout, `.header`/`.header-title`/`.header h1`, `.card`, `.btn`, färgvariabler, typografi, mobil-media queries, print-stylesheet. **Global rubrikstyrning bor här.** |
| `css/verktyg.css` | **Endast** `verktyg/lakemedelsberakning.html` (laddas EFTER styles.css) | Bara verktygsspecifika komponenter (räknarfält, resultatrutor). Sätter **inte** `.header h1`. |
| `css/glossary.css` | 33 ordlistesidor (`ordlista-*.html`) | Endast ordliste-/uppslagslayout. |

**Laddningsordning på verktygssidan:** `styles.css` → `verktyg.css`. Alltså kan
`verktyg.css` skriva över `styles.css` vid samma specificitet. Idag gör den inte det
för rubriken – rubriken styrs uteslutande av `styles.css`.

## `.header h1` – rubrikstorleken (t.ex. "Läkemedelsberäknare")

Allt bor i `css/styles.css`:

1. **Basregel** (~rad 165): `.header h1 { font-size: 2.5rem; flex-shrink: 0; ... }`
2. **Mobil** (~rad 179, `@media (max-width: 640px)`): `.header h1 { font-size: clamp(1.5rem, 7.6vw, 2rem); }`

Långa rubriker **skalas ner** (font-size-clamp) i stället för att brytas/avstavas.
Taket 2rem = oförändrad storlek på bredare telefoner; golvet 1.5rem garanterar plats
på de smalaste skärmarna.

### ⚠️ Fällan som redan slagit till en gång
Det fanns **två** identiska `.header h1`-basregler i `styles.css`, och den andra låg
**efter** mobil-media queryn. Vid lika specificitet vinner den sist deklarerade regeln
i källordningen → basens `2.5rem` klev in igen på mobil och overflowade rubriken,
trots att clamp-regeln fanns. Fixat genom att slå ihop till **en** basregel som ligger
**före** media queryn.

**Regel framåt:** det får finnas **exakt en** `.header h1`-basregel, och den ska ligga
**före** `@media (max-width: 640px)`-blocket. Duplicera aldrig hela selektorblock –
lägg till egenskaper i den befintliga regeln.

## ⚠️ Vit text på färgad botten – använd en `--plate-*`, aldrig `--primary-deep`

De gröna, teal- och röda palettvariablerna är **textfärger** i mörkt läge och ljusnar
därför där: `--primary-deep` är `#047857` i ljust läge men `#34d399` i mörkt. En yta
som använder dem som **botten** under vit text ser rätt ut i ljust läge och ger 1,92:1
i mörkt, utan att något syns i en skärmdump.

| Behov | Variabel | Vit text |
|---|---|---|
| Grön botten | `--plate-green` (`#047857`) | 5,48:1 |
| Mörkare gröna änden i en gradient | `--plate-green-deep` (`#065f46`) | 7,68:1 |
| Teal botten | `--plate-teal` (`#0f766e`) | 5,47:1 |
| Röd botten | `--plate-red` (`#dc2626`) | 4,83:1 |

Plattorna står **bara** i `:root` och överskrivs aldrig i `[data-theme="dark"]` – det
är det som gör dem säkra. `--btn-primary-from/to` är alias för de två gröna; lägg inte
till en femte variabel med samma värde, det blir två sanningar att hålla i synk.

**Kontrollen körs, den bedöms inte:** `python3 scripts/check_kontrast.py` mäter varje
yta som sätter både `color` och `background` i båda teman, plus gradienter som är
textfyllning (`background-clip: text`) och bakgrunder inne i `@keyframes`. Den ingår i
`check_generators.py`. Regeln med alla fyra följdregler står i
[`SEO_REGLER.md` §7c](SEO_REGLER.md).

## ⚠️ `.hidden` är INTE en global utility – döljer bara vissa element

Det finns **ingen** global `.hidden { display: none }` i projektet. `.hidden` fungerar
bara via **sammansatta selektorer**: `.card.hidden`, `.topic-legend.hidden`,
`.fc-question-sub.hidden`, `.case-card.hidden`, `.case-empty.hidden` m.fl. Sektionerna
(`#quiz`, `#matcha` …) döljs för att de är `.card`.

**Regel:** ett nytt element som ska kunna döljas med `classList.add('hidden')` MÅSTE ha
en egen dölj-regel (`.mitt-element.hidden { display: none }`) – annars gör `.hidden`
ingenting och elementet syns hela tiden. Detta orsakade en skarp bugg i 0.9.244:
Matchas klart-vy (`#matchaFinished`, en `div` – ingen `.card`) visades mitt i spelet
eftersom `.hidden` inte bet på den. Se [[feedback-ui-fun-and-listen-first]].

**Fällan slår till även på element du inte själv skrev:** i 0.9.251 visade sig
`.hs-empty` ("Inga resultat än") sakna regeln. Texten låg därför kvar **ovanpå** de
resultat som faktiskt fanns, i både Matcha- och Leitner-segmentet, trots att JS:en
prydligt satte `hidden` på den. Buggen var osynlig så länge topplistan var tom.

**Så här gör du det rätt från början:** innan du skriver `classList.add('hidden')` på
ett element, greppa efter dölj-regeln för just den klassen –
`grep -n "\.<klass>\.hidden" css/*.css`. Finns den inte: skriv den i samma ändring,
i samma block som elementets övriga stilar. Att "det ser rätt ut i webbläsaren" är
inget bevis när det tomma tillståndet är standardläget.

## ⚠️ Nytt synligt element – bestäm placering och form INNAN du skriver det

Se **[`CLAUDE_REGLER.md` §0.5](CLAUDE_REGLER.md)** och **[`SEO_REGLER.md` §0b](SEO_REGLER.md)**.
Kort version: läs sidans slut på **varje** berörd sidtyp, baka ihop med det som redan finns
i stället för att lägga bredvid, ärv en befintlig form, och håll metadata tyst.

**Sidans avslut ser olika ut på tre ställen** – kontrollera alla tre innan något läggs sist:

| Sidtyp | Sista elementet före sidfoten | Antal |
|---|---|---|
| Kunskapsbank, artiklar, verktyg, case | `<div class="actions">` med knappar | 79 |
| Ordlistans bokstavssidor | `<footer class="glossary-footer">` med tillbakaknappar | 33 |
| `index.html` | `</section>` efter faktatexten | 1 |

**Sidans finstilta har redan en form – återanvänd den.** `.page-footer` (friskrivning,
integritetsrad, datum) skrivs av `scripts/wire_sidfot.py` och är det enda som ska ligga efter
sidans avslut. Lägg aldrig ett eget löst `<p>` där; det var felet i 0.9.271, och det kostade
en ombyggnad i 0.9.272. Nya finstilta rader hör hemma **inuti** sidfoten, alltså i
`scripts/sidfot.py` – inte som ett nytt element.

**Sidfoten går ut till containerns kant, som allt annat.** `.page-footer` har inget eget
sidopadding och ingen `max-width` på sina stycken – texten är centrerad men nyttjar hela
innehållsbredden (1000 px). En smal centrerad kolumn syns inte på mobil men ser fånig ut på
dator (rättat 0.9.274).

### ⚠️ Nytt spelläge ska registreras på TRE ställen

Ett läge som bara läggs till på ett av dem ser rätt ut tills man spelar det:

| Var | Vad som annars händer |
|---|---|
| `FIT_SECTIONS` i `js/app.js` | vyn krymps inte på mobil |
| Fokuslägets `:has()`-lista i `styles.css` (~rad 1029) | sidrubrik och sidfot ligger kvar mitt i spelet |
| `.gm-*`-basen (se [[project_shared_game_base]]) | spelkänslan saknas |

Fram till 0.9.274 stod bara `#quiz` i fokuslägets lista, så sidfoten låg kvar under
Flashcards, Matcha, Leitner och Tidsjakt.

## Snabb felsökning när en stiländring "inte tar"
1. Vilka CSS-filer laddar sidan? (`grep stylesheet <sida>.html`)
2. Finns selektorn i **mer än en** fil eller **mer än en gång** i samma fil?
3. Källordning + specificitet: den sist deklarerade vid lika specificitet vinner; en
   senare fil (verktyg.css) vinner över en tidigare (styles.css).
4. `?v=`-parametern på `<link>` styr cache-busting – bumpa den om en gammal CSS spökar.
