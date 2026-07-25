/* =========================================================
   test_theme.js — tester för temaväxlingen (ljust/mörkt)
   =========================================================
   Körs med:  node scripts/test_theme.js
   Avslutar med kod 0 när allt är grönt, annars 1.

   Ett minimalt DOM-skal kör js/theme.js på riktigt, med styrbar matchMedia och
   styrbar localStorage. Testerna träffar alltså den kod som levereras.

   Skalet fångar valet, utläsningen av 'auto', lagringen, att systembytet slår
   igenom bara i auto-läge, att theme-color-metan följer med och att en trasig
   localStorage (privat läge) inte kastar. Det kan INTE fånga att paletten
   faktiskt är läsbar, att inget blinkar vid sidladdning eller att kontrasten
   räcker – det kräver visuell kontroll i webbläsare (CLAUDE_REGLER §13.1).

   Kör det här skriptet efter varje ändring i js/theme.js.
   ========================================================= */

const fs = require('fs')
const path = require('path')
const vm = require('vm')

const ROOT = path.resolve(__dirname, '..')
const SRC = fs.readFileSync(path.join(ROOT, 'js', 'theme.js'), 'utf8')

let pass = 0
const fails = []
function ok (name, cond) {
  if (cond) { pass++ } else { fails.push(name) }
}
function eq (name, got, want) {
  ok(`${name}  (fick ${JSON.stringify(got)}, väntade ${JSON.stringify(want)})`, got === want)
}

/* --- Skal ------------------------------------------------------------------
   Bygger en färsk värld per test, så att inget läcker mellan fallen. */
function makeWorld ({ stored = null, systemDark = false, brokenStorage = false, withMeta = true } = {}) {
  const store = new Map()
  if (stored !== null) store.set('hur_theme', stored)

  const localStorage = {
    getItem (k) {
      if (brokenStorage) throw new Error('SecurityError: localStorage avstängt')
      return store.has(k) ? store.get(k) : null
    },
    setItem (k, v) {
      if (brokenStorage) throw new Error('QuotaExceededError')
      store.set(k, String(v))
    }
  }

  const meta = { _content: '#10b981', getAttribute: () => meta._content, setAttribute: (_k, v) => { meta._content = v } }

  const html = {
    _attrs: {},
    setAttribute (k, v) { this._attrs[k] = v },
    getAttribute (k) { return this._attrs[k] }
  }

  const mqListeners = []
  const mq = {
    matches: systemDark,
    addEventListener: (_ev, fn) => mqListeners.push(fn),
    addListener: (fn) => mqListeners.push(fn)
  }

  const win = {
    matchMedia: () => mq,
    localStorage,
    document: {
      documentElement: html,
      querySelector: (sel) => (withMeta && sel === 'meta[name="theme-color"]' ? meta : null)
    }
  }
  win.window = win

  const ctx = vm.createContext(win)
  vm.runInContext(SRC, ctx, { filename: 'js/theme.js' })

  return {
    html,
    meta,
    store,
    AQTheme: win.AQTheme,
    theme: () => html.getAttribute('data-theme'),
    /** Simulera att systemet byter till/från mörkt. */
    flipSystem (toDark) { mq.matches = toDark; mqListeners.forEach(fn => fn()) }
  }
}

/* --- 1. Förval: LJUST, oavsett vad systemet står på -------------------------
   Sajten ska se likadan ut för den som inte valt något. Att följa systemet är
   ett aktivt val i Inställningar, inte utgångsläget. */
{
  const w = makeWorld({ systemDark: false })
  eq('förval utan sparat val, ljust system → light', w.theme(), 'light')
  eq('  och lagrat värde tolkas som light', w.AQTheme.get(), 'light')
}
{
  const w = makeWorld({ systemDark: true })
  eq('förval utan sparat val, MÖRKT system → ändå light', w.theme(), 'light')
  eq('  systemet får inte smyga in auto', w.AQTheme.get(), 'light')
}

/* --- 2. Sparat val vinner över systemet ------------------------------------- */
{
  const w = makeWorld({ stored: 'light', systemDark: true })
  eq('sparat "light" på mörkt system → light', w.theme(), 'light')
}
{
  const w = makeWorld({ stored: 'dark', systemDark: false })
  eq('sparat "dark" på ljust system → dark', w.theme(), 'dark')
}
{
  const w = makeWorld({ stored: 'auto', systemDark: true })
  eq('sparat "auto" på mörkt system → dark', w.theme(), 'dark')
}

/* --- 3. Ogiltigt lagrat värde faller tillbaka på förvalet ------------------- */
{
  const w = makeWorld({ stored: 'lila', systemDark: true })
  eq('skräp i localStorage → behandlas som light', w.AQTheme.get(), 'light')
  eq('  och målas ljust trots mörkt system', w.theme(), 'light')
}

/* --- 4. set() sparar, målar om och normaliserar ----------------------------- */
{
  const w = makeWorld({ systemDark: false })
  w.AQTheme.set('dark')
  eq('set("dark") målar om', w.theme(), 'dark')
  eq('  och sparar', w.store.get('hur_theme'), 'dark')

  w.AQTheme.set('light')
  eq('set("light") målar om', w.theme(), 'light')

  const ret = w.AQTheme.set('nonsens')
  eq('set() med ogiltigt värde normaliseras till förvalet', ret, 'light')
  eq('  och sparas som light', w.store.get('hur_theme'), 'light')
  eq('  samt målas ljust', w.theme(), 'light')
}
{
  // Auto går fortfarande att VÄLJA – det är bara inte utgångsläget.
  const w = makeWorld({ systemDark: true })
  eq('utgångsläget är ljust på mörkt system', w.theme(), 'light')
  w.AQTheme.set('auto')
  eq('  aktivt val av auto följer systemet → dark', w.theme(), 'dark')
  eq('  och sparas som auto', w.store.get('hur_theme'), 'auto')
}

/* --- 5. Systembyte slår igenom BARA i auto-läge ----------------------------- */
{
  const w = makeWorld({ stored: 'auto', systemDark: false })
  eq('auto: utgångsläge ljust', w.theme(), 'light')
  w.flipSystem(true)
  eq('auto: systemet blir mörkt → sidan blir mörk', w.theme(), 'dark')
  w.flipSystem(false)
  eq('auto: systemet blir ljust igen → sidan blir ljus', w.theme(), 'light')
}
{
  const w = makeWorld({ stored: 'light', systemDark: false })
  w.flipSystem(true)
  eq('valt "light": systembyte ignoreras', w.theme(), 'light')
}
{
  const w = makeWorld({ stored: 'dark', systemDark: true })
  w.flipSystem(false)
  eq('valt "dark": systembyte ignoreras', w.theme(), 'dark')
}

/* --- 6. theme-color-metan följer temat -------------------------------------- */
{
  const w = makeWorld({ systemDark: false })
  eq('ljust läge sätter grön theme-color', w.meta.getAttribute(), '#10b981')
  w.AQTheme.set('dark')
  eq('mörkt läge sätter mörk theme-color', w.meta.getAttribute(), '#0e1a15')
  w.AQTheme.set('light')
  eq('tillbaka till ljust återställer theme-color', w.meta.getAttribute(), '#10b981')
}
{
  // ordlista-tecken.html m.fl. kan sakna metan – får inte kasta.
  let threw = false
  try { makeWorld({ withMeta: false }).AQTheme.set('dark') } catch (e) { threw = true }
  ok('sida utan theme-color-meta kastar inte', !threw)
}

/* --- 7. Privat läge / full kvot får inte kasta ------------------------------ */
{
  let threw = false
  let w = null
  try {
    w = makeWorld({ brokenStorage: true, systemDark: true })
    w.AQTheme.set('light')
  } catch (e) { threw = true }
  ok('trasig localStorage kastar inte vid start eller set', !threw)
  if (w) {
    eq('  temat målas ändå om i sessionen', w.theme(), 'light')
    eq('  och get() faller tillbaka på förvalet', w.AQTheme.get(), 'light')
  }
}

/* --- 8. resolved() rapporterar det som faktiskt visas ----------------------- */
{
  const w = makeWorld({ stored: 'auto', systemDark: true })
  eq('resolved() i auto på mörkt system', w.AQTheme.resolved(), 'dark')
  w.AQTheme.set('light')
  eq('resolved() efter val av ljust', w.AQTheme.resolved(), 'light')
}

/* --- 9. CSS:en bär den mörka paletten -------------------------------------- */
{
  const css = fs.readFileSync(path.join(ROOT, 'css', 'styles.css'), 'utf8')
  // Kommentarerna bort först: filen FÖRKLARAR i text varför det inte finns
  // någon @media-regel, och den meningen ska inte kunna fälla testet.
  const rules = css.replace(/\/\*[\s\S]*?\*\//g, '')
  ok('styles.css har ett [data-theme="dark"]-block', rules.includes(':root[data-theme="dark"] {'))
  // Paletten ska stå på ETT ställe. En @media-regel vore en andra kopia att
  // hålla i synk.
  ok('  ingen kvarglömd @media prefers-color-scheme-dubblett',
    !/@media[^{]*prefers-color-scheme/.test(rules))
  ok('  bildplattan är ljus även i mörkt läge', /--image-plate:\s*#eef2f0/.test(css))
}

/* --- Sammanfattning --------------------------------------------------------- */
console.log(`\ntest_theme: ${pass} gröna, ${fails.length} röda`)
if (fails.length) {
  console.log('\nRöda tester:')
  fails.forEach(f => console.log('  ✗ ' + f))
  process.exit(1)
}
process.exit(0)
