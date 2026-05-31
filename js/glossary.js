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
 *
 * Markupen är identisk med den som scripts/generate_glossary.py förrenderar
 * statiskt (semantisk <dl>, stabila id:n, lang="en" på engelska termer) så att
 * djuplänkar är stabila oavsett om sidan renderas av servern eller av JS.
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
      const letterId = 'letter-' + slugifyBase(letter)
      html += `<h3 class="glossary-letter" id="${letterId}">${letter}</h3>`
      html += '<dl class="glossary-group">'
      groups[letter].forEach(e => {
        html += `<div class="glossary-entry" id="${slugify(e.term)}"><dt class="glossary-term">${escapeHtml(e.term)}</dt><dd class="glossary-def">${formatDef(e.def)}</dd></div>`
      })
      html += '</dl>'
    })

  container.innerHTML = html
}

/**
 * Hanterar misslyckad datahämtning utan att förstöra det statiskt
 * förrenderade innehållet. Finns redan poster i DOM:en (no-JS-fallbacken)
 * behålls de och endast sökfältet inaktiveras; annars visas ett felmeddelande.
 */
function renderError() {
  const container = document.getElementById('glossaryContent')
  const input = document.getElementById('glossarySearch')

  if (container.querySelector('.glossary-entry')) {
    if (input) {
      input.disabled = true
      input.placeholder = 'Sök är inte tillgänglig offline'
    }
    return
  }

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
 * Bygger ett ankarvänligt slug-fragment. Måste ge identiskt resultat som
 * slugify() i scripts/generate_glossary.py så att djuplänkar är stabila.
 * @param {string} str
 * @returns {string}
 */
function slugifyBase(str) {
  return str
    .toLowerCase()
    .replace(/[åä]/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/é|è/g, 'e')
    .replace(/ü/g, 'u')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Stabilt id för en ordlistepost (term-<slug>).
 * @param {string} term
 * @returns {string}
 */
function slugify(term) {
  return 'term-' + slugifyBase(term)
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
  return escapeHtml(str).replace(/Eng: ((?:[^.(]|\([^)]*\))+)\./g, 'Eng: <em lang="en">$1</em>.')
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
