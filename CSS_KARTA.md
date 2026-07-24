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

## Snabb felsökning när en stiländring "inte tar"
1. Vilka CSS-filer laddar sidan? (`grep stylesheet <sida>.html`)
2. Finns selektorn i **mer än en** fil eller **mer än en gång** i samma fil?
3. Källordning + specificitet: den sist deklarerade vid lika specificitet vinner; en
   senare fil (verktyg.css) vinner över en tidigare (styles.css).
4. `?v=`-parametern på `<link>` styr cache-busting – bumpa den om en gammal CSS spökar.
