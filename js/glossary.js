/**
 * glossary.js — Medicinsk ordlista
 *
 * Hanterar hämtning, filtrering och rendering av medicinska termer.
 * Används uteslutande av medicinskordlista.html.
 */

const DATA_URL = './data/ordlista.json'

// ============================================================================
// Datahämtning
// ============================================================================

/**
 * Hämtar ordlisteposter från DATA_URL.
 * @returns {Promise<Array<{term: string, def: string}>>}
 */
async function loadTerms() {
  const res = await fetch(DATA_URL)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

// ============================================================================
// Rendering
// ============================================================================

/**
 * Renderar termer i #glossaryContent, grupperade alfabetiskt.
 * @param {Array<{term: string, def: string}>} terms
 * @param {string} query  Sökfras (tom = visa alla)
 */
function renderTerms(terms, query) {
  const container = document.getElementById('glossaryContent')
  const q = query.toLowerCase().trim()

  const filtered = q
    ? terms.filter(
        e =>
          e.term.toLowerCase().includes(q) ||
          e.def.toLowerCase().includes(q)
      )
    : terms

  if (!filtered.length) {
    container.innerHTML = '<p class="glossary-empty">Inga träffar.</p>'
    return
  }

  // Gruppera på första bokstaven i termen
  const groups = {}
  filtered.forEach(e => {
    const letter = e.term[0].toUpperCase()
    if (!groups[letter]) groups[letter] = []
    groups[letter].push(e)
  })

  let html = ''
  Object.keys(groups)
    .sort()
    .forEach(letter => {
      html += `<div class="glossary-letter">${letter}</div>`
      groups[letter].forEach(e => {
        html += `<div class="glossary-entry">
          <span class="glossary-term">${escapeHtml(e.term)}</span>
          <span class="glossary-def">${formatDef(e.def)}</span>
        </div>`
      })
    })

  container.innerHTML = html
}

/**
 * Renderar ett felmeddelande om datahämtningen misslyckas.
 */
function renderError() {
  const container = document.getElementById('glossaryContent')
  container.innerHTML =
    '<p class="glossary-empty">Kunde inte ladda ordlistan. Försök ladda om sidan.</p>'
}

// ============================================================================
// Hjälpfunktioner
// ============================================================================

/**
 * Escapar HTML-specialtecken för säker injektion i innerHTML.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Escapar HTML och kursiverar engelska termer (text efter "Eng: " t.o.m. nästa punkt).
 * @param {string} str
 * @returns {string}
 */
/**
 * Escapar HTML och kursiverar engelska termer (text efter "Eng: " t.o.m. nästa punkt).
 * Parentetiskt innehåll som "(pl. alveoli)" behandlas som en enhet och
 * avbryter inte matchningen trots inre punkt.
 * @param {string} str
 * @returns {string}
 */
function formatDef(str) {
  return escapeHtml(str).replace(/Eng: ((?:[^.(]|\([^)]*\))+)\./g, 'Eng: <em>$1</em>.')
}

/**
 * Uppdaterar termräknaren i #termCount om elementet finns.
 * @param {number} total   Totalt antal termer i ordlistan
 * @param {number} visible Antal synliga termer efter filtrering
 */
function updateCount(total, visible) {
  const el = document.getElementById('termCount')
  if (!el) return
  el.textContent =
    visible === total
      ? `${total} termer`
      : `${visible} av ${total} termer`
}

// ============================================================================
// Init
// ============================================================================

async function init() {
  let terms = []

  try {
    terms = await loadTerms()
  } catch {
    renderError()
    return
  }

  const input = document.getElementById('glossarySearch')

  // Första rendering med alla termer
  renderTerms(terms, '')
  updateCount(terms.length, terms.length)

  // Realtidssökning
  input.addEventListener('input', () => {
    const q = input.value
    const filtered = q.toLowerCase().trim()
      ? terms.filter(
          e =>
            e.term.toLowerCase().includes(q.toLowerCase()) ||
            e.def.toLowerCase().includes(q.toLowerCase())
        )
      : terms
    renderTerms(terms, q)
    updateCount(terms.length, filtered.length)
  })

  // Fokusera sökfältet direkt (desktop)
  if (window.matchMedia('(min-width: 600px)').matches) {
    input.focus()
  }
}

document.addEventListener('DOMContentLoaded', init)
