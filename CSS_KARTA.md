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
| `css/verktyg.css` | **Endast** verktygssidor med en räknare – `verktyg/lakemedelsberakning.html` och `verktyg/akutmedicin/*.html` (laddas EFTER styles.css) | Bara verktygsspecifika komponenter (räknarfält, resultatrutor, poängchip, svarsband). Sätter **inte** `.header h1`. Hubbarna `verktyg/index.html` och `verktyg/akutmedicin/index.html` laddar den **inte** – de har ingen räknare. |
| `css/glossary.css` | 33 ordlistesidor (`ordlista-*.html`) | Endast ordliste-/uppslagslayout. |

**Laddningsordning på verktygssidan:** `styles.css` → `verktyg.css`. Alltså kan
`verktyg.css` skriva över `styles.css` vid samma specificitet. Idag gör den inte det
för rubriken – rubriken styrs uteslutande av `styles.css`.

## `.header h1` – rubrikstorleken (t.ex. "Läkemedelsberäknare")

Allt bor i `css/styles.css`:

1. **Basregel** (~rad 292): `.header h1 { font-size: 2.5rem; word-break: break-word; ... }`
2. **Mobil** (~rad 305, `@media (max-width: 640px)`): `.header h1 { font-size: clamp(1.5rem, 7.6vw, 2rem); }`

Långa rubriker **skalas ner** (font-size-clamp) **och bryts till flera rader** när
skalningen ensam inte räcker. Taket 2rem = oförändrad storlek på bredare telefoner;
golvet 1.5rem garanterar läsbar text på de smalaste skärmarna – därefter tar radbrytning
över i stället för att texten rinner ut över skärmkanten.

### ⚠️ Fällan `flex-shrink: 0` på `.header h1` (0.9.312)
`.header-title` är `display: flex; flex-wrap: nowrap`. Ett flex-item med
`flex-shrink: 0` och `flex-basis: auto` sätts till sin **max-content-bredd**
(bredden texten skulle ha helt orradbruten) och krymper **aldrig**, oavsett hur
liten `font-size` blir. Resultatet: långa flerordsrubriker (artikeltitlar,
"Spellägen, regler och studieteknik", "Vitalparametrar och NEWS2" …) rullade ut
över skärmkanten på mobil trots att clampen sänkte fontstorleken korrekt –
`font-size` syntes minska, men boxen bröt aldrig rad. Hittat med en headless-
Chrome-svep av alla 124 `<h1>`-sidor vid 320/375px, 12 sidor drabbade.

`.header-logo` och `.version` har **egna** `flex-shrink: 0`-regler (skyddar dem
från att klämmas av en lång rubrik) och påverkas inte av att h1 fick sin borttagen.

**Regel framåt:** `.header h1` ska **aldrig** ha `flex-shrink: 0`. Om en ny rubrik
delar `.header-title` med ett grannelement som måste hålla sin bredd, sätt
`flex-shrink: 0` på **det grannelementet**, inte på h1 – h1 ska alltid få krympa
och radbryta.

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
textfyllning (`background-clip: text`), dämpad text vars botten sitter i en annan regel och
bakgrunder inne i `@keyframes`. Den ingår i
`check_generators.py`. Regeln med alla fem följdregler står i
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

### ⚠️ Nytt spelläge ska registreras på FLERA ställen

Ett läge som bara läggs till på ett av dem ser rätt ut tills man spelar det:

| Var | Vad som annars händer |
|---|---|
| `FIT_SECTIONS` i `js/app.js` | vyn krymps inte på mobil |
| Fokuslägets `:has()`-lista i `styles.css` (~rad 1056) | sidrubrik och sidfot ligger kvar mitt i spelet |
| `<script src="js/<slug>.js?v=…">` i `index.html` | modulen laddas aldrig |
| Egna `.<slug>-*.hidden`-regler | klart-vyn visas mitt i rundan (`.hidden` är inte global) |
| `.gm-*`-basen (se [[project_shared_game_base]]) | spelkänslan saknas |

Fram till 0.9.274 stod bara `#quiz` i fokuslägets lista, så sidfoten låg kvar under
Flashcards, Matcha, Leitner och Tidsjakt. **Samma sak hände igen i 0.9.284** med
`#dagsutmaning`, trots att tabellen stod här — en checklista i ett dokument är den
mekaniska handpåläggning §0.3 förbjuder. De fyra första raderna kontrolleras därför
numera av **`python3 scripts/check_spellagen.py`**, som körs av `check_generators.py`
före varje commit. `.gm*`-raden är omdöme och står kvar som en läsanvisning.

## Snabb felsökning när en stiländring "inte tar"
1. Vilka CSS-filer laddar sidan? (`grep stylesheet <sida>.html`)
2. Finns selektorn i **mer än en** fil eller **mer än en gång** i samma fil?
3. Källordning + specificitet: den sist deklarerade vid lika specificitet vinner; en
   senare fil (verktyg.css) vinner över en tidigare (styles.css).
4. `?v=`-parametern på `<link>` styr cache-busting – bumpa den om en gammal CSS spökar.
