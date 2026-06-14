/**
 * glossary.js — Medicinsk ordlista (global sökning över alla undersidor)
 *
 * Ordlistan är uppdelad i en sida per begynnelsegrupp (ordlista-a.html …,
 * ordlista-siffror.html, ordlista-tecken.html) plus en landningssida. Varje
 * sida levererar sitt innehåll FÖRRENDERAT som statisk <dl> — crawlbart och
 * läsbart helt utan JavaScript. Den här filen bygger INTE om listan; den lägger
 * bara till global sökning ovanpå det statiska innehållet:
 *
 *   - Datan (data/ordlista.json) lazy-laddas först när användaren börjar söka,
 *     så att sidladdningen förblir lätt (snabb LCP / Core Web Vitals).
 *   - Sökträffar visas i #searchResults och länkas till rätt sida + ankare,
 *     oavsett vilken undersida man söker från. Är träffen på den aktuella sidan
 *     används ett rent #ankare (ingen omladdning).
 *   - Medan en sökning är aktiv döljs det statiska #glossaryContent; töms
 *     sökrutan återställs det.
 *
 * pageKey()/pageSlug()/slugify() MÅSTE spegla scripts/generate_glossary.py
 * byte för byte, annars pekar sökträffarnas länkar fel.
 */

const DATA_URL = './data/ordlista.json'

const SWEDISH_ALPHABET = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖ']
// Ordning för grupper i sökträffarna (matchar alfabetsraden).
const GROUP_ORDER = [...SWEDISH_ALPHABET, 'siffror', 'tecken']
const PAGE_SLUG = { Å: 'aa', Ä: 'ae', Ö: 'oe' }

// ============================================================================
// Gruppering & slugs — spegelbild av scripts/generate_glossary.py
// ============================================================================

/** Vilken sida en term hör till. */
function pageKey(term) {
  const c = term[0]
  if (c >= '0' && c <= '9') return 'siffror'
  const cu = c.toUpperCase()
  return SWEDISH_ALPHABET.includes(cu) ? cu : 'tecken'
}

/** Filnamns-slug för en grupp. */
function pageSlug(key) {
  if (key === 'siffror' || key === 'tecken') return key
  return PAGE_SLUG[key] || key.toLowerCase()
}

/** Bygger ett ankarvänligt slug-fragment (måste matcha Python:s slugify). */
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

/** Stabilt ankar-id för en ordlistepost (term-<slug> / term-suffix-<slug>). */
function slugify(term) {
  const base = term.charAt(0) === '-' ? 'term-suffix-' : 'term-'
  return base + slugifyBase(term)
}

/**
 * Länk till en terms position. Är termen på den aktuella sidan används ett rent
 * #ankare (ingen omladdning); annars full sökväg till rätt undersida.
 */
function termHref(term, currentPage) {
  const key = pageKey(term)
  const slug = pageSlug(key)
  const anchor = '#' + slugify(term)
  return slug === currentPage ? anchor : `ordlista-${slug}.html${anchor}`
}

// ============================================================================
// Hjälpfunktioner
// ============================================================================

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Escapar HTML och kursiverar engelska termer (text efter "Eng: "). */
function formatDef(str) {
  return escapeHtml(str).replace(
    /Eng: ((?:[^.(]|\([^)]*\))+)\./g,
    'Eng: <em lang="en">$1</em>.'
  )
}

// ============================================================================
// Datahämtning (lazy)
// ============================================================================

let termsPromise = null

/** Hämtar och cachar ordlisteposter (filtrerar bort stubs). Laddas en gång. */
function loadTerms() {
  if (!termsPromise) {
    termsPromise = fetch(DATA_URL)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then(data => data.filter(e => e.status !== 'stub'))
      .catch(err => {
        termsPromise = null // tillåt ny försök vid nästa sökning
        throw err
      })
  }
  return termsPromise
}

// ============================================================================
// Rendering av sökträffar
// ============================================================================

/**
 * Renderar filtrerade träffar i #searchResults, grupperade per bokstav, med
 * varje term länkad till sin position. Döljer det statiska bläddringsinnehållet
 * så länge en sökning är aktiv.
 */
function renderResults(terms, query, currentPage) {
  const results = document.getElementById('searchResults')
  const content = document.getElementById('glossaryContent')
  const q = query.toLowerCase().trim()

  if (!q) {
    // Tom sökning: återställ statiskt innehåll.
    results.hidden = true
    results.innerHTML = ''
    content.hidden = false
    updateAlphabet(null)
    updateCount(null)
    return
  }

  const filtered = terms.filter(
    e => e.term.toLowerCase().includes(q) || e.def.toLowerCase().includes(q)
  )

  content.hidden = true
  results.hidden = false

  if (!filtered.length) {
    results.innerHTML = '<p class="glossary-empty">Inga träffar.</p>'
    updateAlphabet(new Set())
    updateCount(0)
    return
  }

  const groups = {}
  filtered.forEach(e => {
    const key = pageKey(e.term)
    ;(groups[key] || (groups[key] = [])).push(e)
  })

  let html = ''
  GROUP_ORDER.filter(k => groups[k]).forEach(key => {
    const label = key === 'siffror' ? '0–9' : key === 'tecken' ? 'suffix' : key
    html += `<h3 class="glossary-letter">${escapeHtml(label)}</h3>`
    html += '<dl class="glossary-group">'
    groups[key].forEach(e => {
      const href = termHref(e.term, currentPage)
      html += `<div class="glossary-entry"><dt class="glossary-term"><a href="${href}">${escapeHtml(
        e.term
      )}</a></dt><dd class="glossary-def">${formatDef(e.def)}</dd></div>`
    })
    html += '</dl>'
  })

  results.innerHTML = html
  updateAlphabet(new Set(Object.keys(groups)))
  updateCount(filtered.length)
}

/**
 * Tonar ned grupper i alfabetsraden som saknar sökträffar. <span>-chips
 * (grupper helt utan sida) förblir alltid nedtonade. present === null
 * återställer alla <a>-chips till aktiva (ingen aktiv sökning).
 */
function updateAlphabet(present) {
  document.querySelectorAll('#glossaryAlphabet .glossary-alpha').forEach(el => {
    if (el.tagName !== 'A') return // saknar sida → alltid nedtonad
    const active = present === null || present.has(el.dataset.group)
    el.classList.toggle('is-disabled', !active)
  })
}

/** Uppdaterar räknaren. null = ingen aktiv sökning (tom text). */
function updateCount(visible) {
  const el = document.getElementById('termCount')
  if (!el) return
  el.textContent =
    visible === null ? '' : visible === 1 ? '1 träff' : `${visible} träffar`
}

/** Sökrutan kunde inte laddas: inaktivera den, behåll statiskt innehåll. */
function disableSearch(input) {
  if (input) {
    input.disabled = true
    input.placeholder = 'Sök är inte tillgänglig offline'
  }
}

// ============================================================================
// Init
// ============================================================================

function init() {
  const input = document.getElementById('glossarySearch')
  if (!input) return

  const currentPage = document.body.dataset.page || null
  let terms = null
  let debounce = null

  async function run() {
    if (!terms) {
      try {
        terms = await loadTerms()
      } catch {
        disableSearch(input)
        return
      }
    }
    renderResults(terms, input.value, currentPage)
  }

  // Förladda datan så fort användaren visar avsikt att söka.
  input.addEventListener('focus', () => loadTerms().catch(() => {}), {
    once: true,
  })

  input.addEventListener('input', () => {
    clearTimeout(debounce)
    debounce = setTimeout(run, 150)
  })

  // Fokusera sökfältet direkt på desktop.
  if (window.matchMedia('(min-width: 600px)').matches) input.focus()
}

document.addEventListener('DOMContentLoaded', init)
