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
const PAGE_SLUG = { Å: 'aa', Ä: 'ae', Ö: 'oe' }

// ============================================================================
// Gruppering & slugs — spegelbild av scripts/generate_glossary.py
// ============================================================================

/**
 * Sträng som styr en posts gruppering och ordning. Normalt termen, men ett
 * valfritt "sort"-fält överstyr (t.ex. grekisk glyf β-blockerare → beta-...).
 * Speglar sort_value() i scripts/generate_glossary.py.
 */
function sortValue(entry) {
  return entry.sort || entry.term
}

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
function termHref(term, currentPage, slugOverride, sortKey) {
  const key = pageKey(sortKey || term)
  const slug = pageSlug(key)
  const anchor = '#' + (slugOverride || slugify(term))
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

/** Escapar HTML och kursiverar ordklassen (ledande token: subst., adj., verb …). */
function formatDef(str) {
  return escapeHtml(str).replace(
    /^(subst\.|adj\.|adv\.|verb|prefix|suffix|förk\.|pron\.|räkn\.|interj\.|konj\.|prep\.)(?![a-zåäö])/,
    '<em>$1</em>'
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
 * Relevansrang för en träff mot den (gemena, trimmade) söktermen. Lägre = mer
 * relevant: exakt uppslagsord → term som börjar med söktermen → söktermen någon
 * annanstans i termen → enbart i beskrivningen.
 */
function matchRank(entry, q) {
  const term = entry.term.toLowerCase()
  if (term === q) return 0
  if (term.startsWith(q)) return 1
  if (term.includes(q)) return 2
  return 3
}

/**
 * Renderar filtrerade träffar i #searchResults sorterade efter relevans (se
 * matchRank), med varje term länkad till sin position. Inom samma rang sorteras
 * alfabetiskt (svensk kollation). Döljer det statiska bläddringsinnehållet så
 * länge en sökning är aktiv.
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

  const ranked = filtered
    .map(e => ({ entry: e, rank: matchRank(e, q) }))
    .sort(
      (a, b) => a.rank - b.rank || a.entry.term.localeCompare(b.entry.term, 'sv')
    )

  let html = '<dl class="glossary-group">'
  ranked.forEach(({ entry: e }) => {
    const href = termHref(e.term, currentPage, e.slug, e.sort)
    html += `<div class="glossary-entry"><dt class="glossary-term"><a href="${href}">${escapeHtml(
      e.term
    )}</a></dt><dd class="glossary-def">${formatDef(e.def)}</dd></div>`
  })
  html += '</dl>'

  results.innerHTML = html
  // Alfabetsraden speglar fortfarande vilka grupper som har träffar.
  updateAlphabet(new Set(filtered.map(e => pageKey(sortValue(e)))))
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
