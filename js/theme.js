/* Tema (ljust/mörkt) för hela Anatomiquiz.
 *
 * Laddas SYNKRONT i <head> på varje sida – alltså utan defer/async. Det är
 * medvetet: filen måste hinna sätta data-theme på <html> innan webbläsaren
 * målar första bildrutan, annars blinkar sidan vit innan den blir mörk.
 * Filen är därför avsiktligt liten och utan beroenden.
 *
 * Normalt löser man det här med en inline-snutt i <head>, men sidans
 * Content-Security-Policy tillåter bara skript från egen origin
 * (script-src 'self') och inline-skript blockeras. En egen fil ger samma
 * resultat och cachas dessutom mellan sidor.
 *
 * Tre lägen sparas: 'auto' (följ systemet), 'light', 'dark'. Men CSS:en ser
 * bara data-theme="light" eller "dark" – 'auto' löses ut här. Det gör att den
 * mörka paletten kan stå på ETT ställe i styles.css i stället för att
 * dubbleras i en @media (prefers-color-scheme)-kopia.
 *
 * FÖRVALET ÄR 'light', inte 'auto': sajten ska se likadan ut för den som inte
 * valt något, oavsett vad telefonen råkar stå på. Mörkt läge och Följ systemet
 * är aktiva val i Inställningar. Ändras förvalet här måste både den ikryssade
 * radioknappen i index.html och scripts/test_theme.js följa med.
 *
 * Egen localStorage-nyckel, inte quizets 'hur_settings': temat måste kunna
 * läsas på ordlistans och kunskapsbankens sidor, som inte laddar app.js.
 */
(function () {
  var KEY = 'hur_theme'
  var DEFAULT = 'light'
  var VALID = { auto: 1, light: 1, dark: 1 }
  var mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null

  function read() {
    try {
      var v = localStorage.getItem(KEY)
      return VALID[v] ? v : DEFAULT
    } catch (e) {
      // Privat läge eller full kvot – falla tillbaka på förvalet.
      return DEFAULT
    }
  }

  function resolve(pref) {
    if (pref === 'light' || pref === 'dark') return pref
    return mq && mq.matches ? 'dark' : 'light'
  }

  function paint(pref) {
    var theme = resolve(pref)
    document.documentElement.setAttribute('data-theme', theme)
    // Webbläsarens adressfält/statusrad följer med.
    var meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#0e1a15' : '#10b981')
  }

  var pref = read()
  paint(pref)

  // Följer systemet bara för den som AKTIVT valt 'auto'. Förvalet är ljust, så
  // den som inte varit inne i Inställningar påverkas inte av att telefonen
  // byter läge. Har man valt auto slår bytet igenom direkt, mitt i sessionen.
  if (mq) {
    var onChange = function () { if (read() === 'auto') paint('auto') }
    if (mq.addEventListener) mq.addEventListener('change', onChange)
    else if (mq.addListener) mq.addListener(onChange)
  }

  // Litet API för inställningssidan i app.js. Sätts på window eftersom
  // sidorna delar scope (se CLAUDE_REGLER §12).
  window.AQTheme = {
    get: read,
    set: function (v) {
      var pref = VALID[v] ? v : DEFAULT
      try { localStorage.setItem(KEY, pref) } catch (e) {}
      paint(pref)
      return pref
    },
    /** Vad som faktiskt visas just nu ('light' eller 'dark'). */
    resolved: function () { return resolve(read()) }
  }
})()
