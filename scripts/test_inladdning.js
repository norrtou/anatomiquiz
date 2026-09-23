/* =========================================================
   test_inladdning.js — inladdningsanimationen på sidhuvud och kort
   =========================================================
   Körs med:  node scripts/test_inladdning.js
   Körs också av check_generators.py, som hittar varje scripts/test_*.js.
   Avslutar med kod 0 när allt är grönt, annars 1.

   `.header` och `.card` finns på 130 av 131 sidor. Fram till 0.9.447 gled de
   20 px på plats när sidan laddades. Webbläsaren hoppar till ett #ankare innan
   animationen är klar, så varje länk till en ordlistepost landade 20 px för
   högt och klippte termen. CLS räknar inte transformer, så Lighthouse såg
   ingenting. Animationen kördes också för den som bett om minskad rörelse.
   Sedan 0.9.449 har de ingen inladdningsanimation alls (se CSS_KARTA.md).

   Testet läser css/styles.css. Ingen animation är godkänt. Läggs en tillbaka
   fäller testet om
     * den använder en @keyframes som flyttar, skalar eller roterar något, eller
       om den @keyframes saknas,
     * `@media (prefers-reduced-motion: reduce)` inte stänger av den.

   Det kan INTE se att en animation känns rätt, eller vad den kostar i tid
   innan innehållet räknas som ritat (LCP). En intoning kostade en halv sekund
   (SEO_REGLER §8). Det mäts i webbläsare.
   ========================================================= */

const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const CSS = fs.readFileSync(path.join(ROOT, 'css', 'styles.css'), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '')

let pass = 0
const fails = []
function ok (name, cond) {
  if (cond) { pass++ } else { fails.push(name) }
}

/* --- Regelblock ------------------------------------------------------------
   [{ huvud, kropp, inre }] för toppnivån. `inre` är blocken i ett @-block
   (@media, @keyframes), läst på samma sätt. */
function block (text) {
  const ut = []
  let i = 0
  while (i < text.length) {
    const start = text.indexOf('{', i)
    if (start === -1) break
    const huvud = text.slice(i, start).trim()
    let djup = 1
    let j = start + 1
    while (j < text.length && djup) {
      if (text[j] === '{') djup++
      else if (text[j] === '}') djup--
      j++
    }
    const kropp = text.slice(start + 1, j - 1)
    ut.push({ huvud, kropp, inre: huvud.startsWith('@') ? block(kropp) : [] })
    i = j
  }
  return ut
}

function dekl (kropp, egenskap) {
  const m = kropp.match(new RegExp(`(?:^|;|\\s)${egenskap}\\s*:\\s*([^;]+)`))
  return m ? m[1].trim() : null
}

const selektorer = h => h.split(',').map(s => s.trim())
const alla = block(CSS)
const RÖRELSE = /(^|[;\s])(transform|translate|scale|rotate|top|left|margin[a-z-]*)\s*:/

/* --- 1. Animationen tonar, den flyttar inte ------------------------------- */
const animerade = []
for (const sel of ['.header', '.card']) {
  const regel = alla.find(b => selektorer(b.huvud).includes(sel))
  ok(`${sel}: regeln finns på toppnivån i styles.css`, !!regel)
  if (!regel) continue
  const anim = dekl(regel.kropp, 'animation')
  if (!anim || anim === 'none') {
    ok(`${sel}: ingen animation – inget att flytta`, true)
    continue
  }
  animerade.push(sel)
  const namn = anim.split(/\s+/)[0]
  const kf = alla.find(b => b.huvud === `@keyframes ${namn}`)
  ok(`${sel}: @keyframes ${namn} finns`, !!kf)
  if (kf) {
    ok(`${sel}: @keyframes ${namn} flyttar, skalar eller roterar ingenting ` +
       '(ankare landar annars fel, och CLS ser det inte)', !RÖRELSE.test(kf.kropp))
  }
}

/* --- 2. Minskad rörelse stänger av varje animation som finns -------------- */
{
  const avstängda = new Set()
  alla.filter(b => /^@media[^{]*prefers-reduced-motion:\s*reduce/.test(b.huvud))
    .forEach(m => m.inre.forEach(r => {
      if (/^none\b/.test(dekl(r.kropp, 'animation') || '')) {
        selektorer(r.huvud).forEach(s => avstängda.add(s))
      }
    }))
  for (const sel of animerade) {
    ok(`prefers-reduced-motion stänger av animationen på ${sel}`, avstängda.has(sel))
  }
}

/* --- Sammanfattning --------------------------------------------------------- */
console.log(`\ntest_inladdning: ${pass} gröna, ${fails.length} röda`)
if (fails.length) {
  console.log('\nRöda tester:')
  fails.forEach(f => console.log('  ✗ ' + f))
  process.exit(1)
}
process.exit(0)
