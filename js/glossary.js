/**
 * glossary.js — Medicinsk ordlista (global sökning över alla undersidor)
 *
 * Ordlistan är uppdelad i en sida per begynnelsegrupp (ordlista-a.html …,
 * ordlista-siffror.html, ordlista-prefix.html, ordlista-suffix.html) plus en
 * landningssida. Varje
 * sida levererar sitt innehåll FÖRRENDERAT som statisk <dl> — crawlbart och
 * läsbart helt utan JavaScript. Den här filen bygger INTE om listan; den lägger
 * bara till global sökning ovanpå det statiska innehållet:
 *
 *   - Datan lazy-laddas först när användaren visar avsikt att söka, så att
 *     sidladdningen förblir lätt (snabb LCP / Core Web Vitals).
 *   - Sökträffar visas i #searchResults och länkas till rätt sida + ankare,
 *     oavsett vilken undersida man söker från. Är träffen på den aktuella sidan
 *     används ett rent #ankare (ingen omladdning).
 *   - Medan en sökning är aktiv döljs det statiska #glossaryContent; töms
 *     sökrutan återställs det.
 *
 * SÖKNINGEN LADDAR I TVÅ STEG (0.9.335). Fram till dess hämtades hela
 * data/ordlista.json — 2,4 MB, varav 1,9 MB definitioner — redan när sökrutan
 * fick fokus, alltså innan en enda tangent tryckts. På mobil betydde det att
 * den som slog upp ett ord fick vänta på hela ordlistan innan första träffen.
 *
 *   Steg 1: data/ordlista-index.json (~190 KB) — uppslagsord, sidgrupp och
 *           slug-överstyrningar. Räcker för att hitta ett ORD och länka rätt.
 *           Hämtas vid fokus; träffarna ritas utan beskrivning.
 *   Steg 2: data/ordlista.json — hämtas i bakgrunden vid första tangenttrycket
 *           (inte vid fokus: en tapp som inte leder till en sökning ska inte
 *           kosta 2,4 MB). När den landar ritas träfflistan om MED beskrivningar
 *           och med de träffar som bara står i en definition.
 *
 * Definitionssökningen i steg 2 är inte en bonus utan bärande: den är det som
 * gör att en sökning på k-formen hittar c-formen (kolit → Colitis), eftersom
 * c-posterna nämner k-formen i sin brödtext.
 *
 * pageKey()/pageSlug()/slugify() MÅSTE spegla scripts/generate_glossary.py
 * byte för byte, annars pekar sökträffarnas länkar fel.
 * scripts/test_ordlista_sok.js kör den här filen på riktig data och prövar bl.a.
 * att de två stegen ger IDENTISKA länkar för var och en av de 11 202 posterna.
 */

const DATA_URL = './data/ordlista.json'
const INDEX_URL = './data/ordlista-index.json'

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

/** Är posten ett suffix (ändelse)? Speglar is_suffix() i Python. */
function isSuffixEntry(entry) {
  return (
    entry.term.charAt(0) === '-' ||
    entry.def.startsWith('suffix ') ||
    entry.def.startsWith('Efterled')
  )
}

/** Är posten ett prefix (förstavelse)? Speglar is_prefix() i Python. */
function isPrefixEntry(entry) {
  return (
    entry.term.charAt(0) !== '-' &&
    (entry.def.startsWith('prefix ') || entry.def.startsWith('Förled'))
  )
}

/** Vilken sida en post hör till. Speglar page_key() i Python. */
function pageKey(entry) {
  if (isSuffixEntry(entry)) return 'suffix'
  if (isPrefixEntry(entry)) return 'prefix'
  const c = sortValue(entry)[0]
  if (c >= '0' && c <= '9') return 'siffror'
  const cu = c.toUpperCase()
  return SWEDISH_ALPHABET.includes(cu) ? cu : 'suffix'
}

/** Filnamns-slug för en grupp. */
function pageSlug(key) {
  if (key === 'siffror' || key === 'prefix' || key === 'suffix') return key
  return PAGE_SLUG[key] || key.toLowerCase()
}

/** Bygger ett ankarvänligt slug-fragment (måste matcha Python:s slugify). */
/**
 * Diakriter → ASCII. MÅSTE hållas identisk med _SLUG_MAP i
 * scripts/generate_glossary.py – annars pekar klientrenderade länkar på
 * ankare som den statiska HTML:en inte har. Tecken som saknas här faller
 * igenom till [^a-z0-9]+ och stympar ankaret (Râle → term-r-le).
 * Grekiska bokstäver translittereras per post via fältet "slug" i
 * data/ordlista.json, inte här.
 *
 * TABELLEN DELAS MED foldForSearch(). Ändra den bara när ANKARE ska ändras –
 * aldrig för att justera sökbeteendet. Ett nytt tecken här flyttar ankaret för
 * varje term som bär det, och 2 351 tooltips i kunskapsbanken pekar på de
 * gamla (data/kb_glossary_terms.json).
 */
const SLUG_MAP = {
  'å': 'a', 'ä': 'a', 'ö': 'o',
  'à': 'a', 'á': 'a', 'â': 'a', 'ã': 'a',
  'è': 'e', 'é': 'e', 'ê': 'e', 'ë': 'e',
  'ì': 'i', 'í': 'i', 'î': 'i', 'ï': 'i',
  'ò': 'o', 'ó': 'o', 'ô': 'o', 'õ': 'o',
  'ù': 'u', 'ú': 'u', 'û': 'u', 'ü': 'u',
  'ý': 'y', 'ÿ': 'y', 'ñ': 'n', 'ç': 'c',
  'œ': 'oe', 'æ': 'ae', 'ø': 'o', 'ß': 'ss',
  'đ': 'd', 'ð': 'd', 'þ': 'th', 'ł': 'l', 'š': 's', 'ž': 'z', 'č': 'c'
}

function slugifyBase(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]/g, (c) => SLUG_MAP[c] || c)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Stabilt ankar-id för en ordlistepost (term-<slug> / term-suffix-<slug>). */
function slugify(term) {
  const base = term.charAt(0) === '-' ? 'term-suffix-' : 'term-'
  return base + slugifyBase(term)
}

/**
 * Länk till en position i ordlistan. Är den på den aktuella sidan används ett
 * rent #ankare (ingen omladdning); annars full sökväg till rätt undersida.
 */
function groupHref(key, anchorSlug, currentPage) {
  const slug = pageSlug(key)
  const anchor = '#' + anchorSlug
  return slug === currentPage ? anchor : `ordlista-${slug}.html${anchor}`
}

/** Länk till en post ur HELA ordlistan (steg 2) – grupp och slug härleds. */
function termHref(entry, currentPage) {
  return groupHref(pageKey(entry), entry.slug || slugify(entry.term), currentPage)
}

/** Länk till en post ur det lätta indexet (steg 1) – grupp och slug står där. */
function indexHref(item, currentPage) {
  return groupHref(item.page, item.slug, currentPage)
}

// ============================================================================
// Sökfold — diakritisk vikning, HELT SKILD FRÅN slugify()
// ============================================================================

/**
 * Viker diakriter till ASCII för SÖKNING: "oga" hittar "öga", "hoft" hittar
 * "höft", "resume" hittar "résumé". Både söksträngen och uppslagsordet viks, så
 * matchningen fungerar åt båda håll.
 *
 * Skild funktion från slugify() med flit (ordlistans skyddsregel 3). slugify()
 * är ankarkontraktet mot 2 351 tooltips och byter dessutom ut ALLT som inte är
 * a–z0–9 mot bindestreck; en sökfold måste tvärtom lämna mellanslag och streck
 * kvar, annars slutar "abductor pollicis" matcha. Använd ALDRIG den här
 * funktionen för att bygga ett ankare.
 */
function foldForSearch(str) {
  return str.toLowerCase().replace(/[^a-z0-9]/g, c => SLUG_MAP[c] || c)
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

/** Escapar regex-metatecken så söktermen kan matchas bokstavligt. */
function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Markerar (med <mark>) varje förekomst av söktermen i redan HTML-formaterad
 * text. Hoppar över taggar (<em>…</em>) så markeringen aldrig hamnar inuti en
 * tagg. q måste vara gemen/trimmad; matchningen är skiftlägesokänslig och
 * behåller originaltextens skiftläge.
 */
function highlightMatches(html, q) {
  if (!q) return html
  const re = new RegExp(escapeRegExp(escapeHtml(q)), 'gi')
  return html.replace(/[^<]+|<[^>]*>/g, seg =>
    seg.charAt(0) === '<'
      ? seg
      : seg.replace(re, m => `<mark class="glossary-hit">${m}</mark>`)
  )
}

// ============================================================================
// Datahämtning (lazy)
// ============================================================================

let termsPromise = null
let indexPromise = null

function fetchJson(url) {
  return fetch(url).then(res => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json()
  })
}

/**
 * Steg 1: det lätta indexet, platt och sökklart. Varje post bär termen, sin
 * sidgrupp, sitt ankarslug och sin vikta form (fold), så att filtreringen per
 * tangenttryck bara jämför färdiga strängar.
 */
function loadIndex() {
  if (!indexPromise) {
    indexPromise = fetchJson(INDEX_URL)
      .then(data => {
        const items = []
        Object.keys(data.grupper).forEach(page => {
          data.grupper[page].forEach(term => {
            items.push({
              term,
              page,
              slug: data.slugg[term] || slugify(term),
              fold: foldForSearch(term),
            })
          })
        })
        return items
      })
      .catch(err => {
        indexPromise = null // tillåt nytt försök vid nästa sökning
        throw err
      })
  }
  return indexPromise
}

/**
 * Steg 2: hela ordlistan (filtrerar bort stubs). Laddas en gång. Den vikta
 * formen läggs på här också, så att steg 2 rangordnar likadant som steg 1.
 */
function loadTerms() {
  if (!termsPromise) {
    termsPromise = fetchJson(DATA_URL)
      .then(data => {
        const live = data.filter(e => e.status !== 'stub')
        // Vik på plats: posterna är färska ur JSON.parse och ägs av oss, och
        // 11 202 kopior hade kostat minne i onödan på mobil. defLower cachas
        // här av samma skäl som fold: annars körs toLowerCase() om på 1,9 MB
        // definitionstext vid VARJE tangenttryck (fullHits letar i den).
        live.forEach(e => {
          e.fold = foldForSearch(e.term)
          e.defLower = e.def.toLowerCase()
        })
        return live
      })
      .catch(err => {
        termsPromise = null // tillåt nytt försök vid nästa sökning
        throw err
      })
  }
  return termsPromise
}

// ============================================================================
// Rendering av sökträffar
// ============================================================================

/**
 * Relevansrang för ett uppslagsord mot söktermen. Båda ska vara VIKTA (se
 * foldForSearch), så att "oga" och "öga" rangordnas likadant. Lägre = mer
 * relevant: exakt uppslagsord → term som börjar med söktermen → söktermen någon
 * annanstans i termen → enbart i beskrivningen.
 */
function matchRank(foldedTerm, foldedQuery) {
  if (foldedTerm === foldedQuery) return 0
  if (foldedTerm.startsWith(foldedQuery)) return 1
  if (foldedTerm.includes(foldedQuery)) return 2
  return 3
}

/** Träffar i det lätta indexet (steg 1) – bara uppslagsord, inga beskrivningar. */
function indexHits(items, qf) {
  const hits = []
  items.forEach(item => {
    const rank = matchRank(item.fold, qf)
    if (rank < 3) hits.push({ entry: item, rank })
  })
  return hits
}

/**
 * Träffar i hela ordlistan (steg 2): uppslagsordet VIKT, beskrivningen på den
 * råa söksträngen.
 *
 * Beskrivningen viks med flit inte. Vikte man den skulle "öga" i söktermen bli
 * "oga" och sluta matcha definitioner som skriver "öga" — alltså en försämring
 * av det som fungerar idag, i utbyte mot en vikning av 1,9 MB text per
 * tangenttryck.
 */
function fullHits(terms, q, qf) {
  const hits = []
  terms.forEach(entry => {
    const rank = matchRank(entry.fold, qf)
    if (rank < 3 || entry.defLower.includes(q)) hits.push({ entry, rank })
  })
  return hits
}

/**
 * Tak för antal RITADE träffar. Korta söktermer (en bokstav, vanliga
 * bokstavskombinationer) matchar nästan hela ordlistan — "a" träffar över
 * 10 000 av 10 928 poster, eftersom fritextsökningen letar i definitionerna
 * också. Att rita om en `<dl>` med tusentals rader vid varje avstannad
 * tangentpaus är precis den lagg som kändes som att skrivandet pausade när
 * man började ange ett ord. Räknaren och alfabetsraden speglar ändå det
 * FULLSTÄNDIGA antalet träffar — bara ritningen begränsas.
 */
const MAX_RENDERED_HITS = 200

/**
 * Renderar filtrerade träffar i #searchResults sorterade efter relevans (se
 * matchRank), med varje term länkad till sin position. Inom samma rang sorteras
 * alfabetiskt (svensk kollation). Döljer det statiska bläddringsinnehållet så
 * länge en sökning är aktiv.
 *
 * `data.full` (hela ordlistan) används så fort den finns; annars ritas steg
 * 1-träffarna ur `data.index`. Beskrivningskolumnen står då tom och fylls när
 * steg 2 landar — länken funkar hela tiden, så man kan klicka sig vidare utan
 * att vänta in resten.
 */
function renderResults(data, query, currentPage) {
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

  const qf = foldForSearch(q)
  const hits = data.full
    ? fullHits(data.full, q, qf)
    : indexHits(data.index || [], qf)

  content.hidden = true
  results.hidden = false

  if (!hits.length) {
    results.innerHTML = '<p class="glossary-empty">Inga träffar.</p>'
    updateAlphabet(new Set())
    updateCount(0)
    return
  }

  hits.sort(
    (a, b) => a.rank - b.rank || a.entry.term.localeCompare(b.entry.term, 'sv')
  )

  const shown = hits.length > MAX_RENDERED_HITS ? hits.slice(0, MAX_RENDERED_HITS) : hits

  let html = '<dl class="glossary-group">'
  shown.forEach(({ entry: e, rank }) => {
    const href = data.full ? termHref(e, currentPage) : indexHref(e, currentPage)
    // Rank 3 = söktermen finns bara i beskrivningen; markera den så det syns
    // snabbt varför träffen kom med. Steg 1 har ingen beskrivning att visa.
    const def = !data.full
      ? ''
      : rank === 3
        ? highlightMatches(formatDef(e.def), q)
        : formatDef(e.def)
    html += `<div class="glossary-entry"><dt class="glossary-term"><a href="${href}">${escapeHtml(
      e.term
    )}</a></dt><dd class="glossary-def">${def}</dd></div>`
  })
  html += '</dl>'
  if (hits.length > MAX_RENDERED_HITS) {
    html += `<p class="glossary-truncated">Visar de ${MAX_RENDERED_HITS} mest relevanta träffarna av ${hits.length}. Skriv fler bokstäver för att smalna av sökningen.</p>`
  }

  results.innerHTML = html
  // Alfabetsraden speglar fortfarande vilka grupper som har träffar.
  updateAlphabet(
    new Set(hits.map(({ entry: e }) => (data.full ? pageKey(e) : e.page)))
  )
  updateCount(hits.length)
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
  const data = { index: null, full: null }
  let fullStarted = false
  let debounce = null

  function draw() {
    renderResults(data, input.value, currentPage)
  }

  /**
   * Steg 2 i bakgrunden. Startas vid första sökningen, inte vid fokus: en tapp
   * i sökrutan som inte leder någonstans ska inte kosta 2,4 MB.
   *
   * Faller hämtningen står träfflistan kvar som den är — uppslagsorden är
   * sökbara och länkarna funkar, det är beskrivningskolumnen som blir tom.
   * Det är bättre än att slå av sökrutan, vilket var enda utgången förut.
   */
  function loadFull() {
    if (fullStarted) return
    fullStarted = true
    loadTerms()
      .then(terms => {
        data.full = terms
        if (input.value.trim()) draw() // rita om med beskrivningar
      })
      .catch(() => { fullStarted = false })
  }

  async function run() {
    // Tom sökruta återställer sidan och ska aldrig utlösa en hämtning.
    if (!input.value.trim()) {
      draw()
      return
    }
    if (!data.index && !data.full) {
      try {
        data.index = await loadIndex()
      } catch {
        // Utan index: fall tillbaka på hela ordlistan (som före 0.9.335).
        try {
          data.full = await loadTerms()
          fullStarted = true
        } catch {
          disableSearch(input)
          return
        }
      }
    }
    loadFull()
    draw()
  }

  // Förladda det LÄTTA indexet så fort användaren visar avsikt att söka.
  input.addEventListener('focus', () => loadIndex().catch(() => {}), {
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
