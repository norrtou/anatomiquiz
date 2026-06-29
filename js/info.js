/**
 * info.js — Om-sidan (info.html)
 *
 * Hämtar och renderar ändringsloggen från CHANGELOG.md.
 */

const CHANGELOG_URL = './CHANGELOG.md'
const MAX_ENTRIES = 20

// ============================================================================
// Hjälpfunktioner
// ============================================================================

/**
 * Escapar HTML-specialtecken så att changelog-text inte tolkas som markup.
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

// ============================================================================
// Changelog
// ============================================================================

/**
 * Hämtar CHANGELOG.md och renderar poster i #changelogContent.
 */
async function loadChangelog() {
  const container = document.getElementById('changelogContent')
  container.innerHTML = '<p class="changelog-loading">Laddar ändringslogg…</p>'

  try {
    const res = await fetch(CHANGELOG_URL)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const text = await res.text()
    container.innerHTML = renderChangelog(text)
  } catch {
    container.innerHTML = '<p class="changelog-loading">Kunde inte ladda ändringslogg.</p>'
  }
}

/**
 * Parsar Markdown-text och returnerar HTML-sträng med versionsposter.
 * @param {string} text  Råtext från CHANGELOG.md
 * @returns {string}
 */
function renderChangelog(text) {
  const entries = []
  let current = null

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trimEnd()
    if (line.startsWith('## ')) {
      if (current) entries.push(current)
      current = { version: line.slice(3).trim(), items: [] }
    } else if (current && line.startsWith('- ')) {
      current.items.push(line.slice(2).trim())
    }
  }
  if (current) entries.push(current)

  const recent = entries.slice(0, MAX_ENTRIES)
  if (!recent.length) return '<p class="changelog-loading">Ingen ändringslogg hittades.</p>'

  return recent
    .map(e => {
      const itemsHtml = e.items.map(i => `<div class="cl-item">– ${escapeHtml(i)}</div>`).join('')
      return `<div class="changelog-entry">
        <div class="changelog-version">v${escapeHtml(e.version)}</div>
        <div class="cl-body">${itemsHtml}</div>
      </div>`
    })
    .join('')
}

// ============================================================================
// Frågestatistik
// ============================================================================

// Ämnen grupperade per utbildning — samma indelning som ämnesväljaren på
// startsidan (data-edu). fc: true = flashcard-ämne (kort utan svårighetsgrad →
// visas som "—" i Normal/Svår). Håll i synk med getQuestionsPath() i app.js.
const EDUCATIONS = [
  { name: 'Allmänt', topics: [
    { label: 'Farmakologi',                 file: './data/farmakologi.json', fc: true },
  ]},
  { name: 'Arbetsterapeut', topics: [
    { label: 'Tentaplugg',                  file: './data/tentaplugg.json' },
    { label: 'ATP-studenters flashcards',   file: './data/studenters_flashcards.json', fc: true },
    { label: 'Ben',                         file: './data/ben.json' },
    { label: 'Blodomloppet',                file: './data/blodomloppet.json' },
    { label: 'Ergonomi',                    file: './data/ergonomi.json' },
    { label: 'Grepp',                       file: './data/grepp.json' },
    { label: 'Handen',                      file: './data/handen.json' },
    { label: 'Ledtyper',                    file: './data/ledtyper.json' },
    { label: 'Lägen & riktningar',          file: './data/riktningar.json' },
    { label: 'Medicinsk terminologi',       file: './data/medicinsk_terminologi.json' },
    { label: 'Muskler – flashcards',        file: './data/muskler_flashcards.json', fc: true },
    { label: 'Muskler',                     file: './data/muskler.json' },
    { label: 'Neurologi',                   file: './data/neurologi.json' },
    { label: 'Olika åldrar',                file: './data/olika_aldrar.json' },
    { label: 'Skuldra',                     file: './data/skuldran.json' },
  ]},
  { name: 'Sjuksköterska', topics: [
    { label: 'Medicinsk latin',             file: './data/medicinsk_latin.json' },
    { label: 'Blandad anatomi/fysiologi – flashcards', file: './data/anatomi_fysiologi_flashcards.json', fc: true },
    { label: 'Läkemedelsräkning',           file: './data/lakemedelsrakning.json' },
  ]},
]

const ORDLISTA_URL = './data/ordlista.json'

/** Räknar kort i en datafil → {total, normal, hard} (difficulty 'Hard' = svår). */
function countCards(file) {
  return fetch(file).then(r => r.json()).then(data => {
    const items = Array.isArray(data) ? data : data.questions
    const normal = items.filter(q => q.difficulty !== 'Hard').length
    return { total: items.length, normal, hard: items.length - normal }
  })
}

async function loadStats() {
  const container = document.getElementById('statsContent')
  container.innerHTML = '<p class="stats-loading">Laddar statistik…</p>'

  try {
    const dash = '<span class="stats-diff">—</span>'

    // Hämta alla ämnens antal parallellt och bygg en grupp (med delsumma) per utbildning.
    const groups = await Promise.all(EDUCATIONS.map(async edu => {
      const rows = await Promise.all(edu.topics.map(async t => ({ ...t, ...(await countCards(t.file)) })))
      const sub = rows.reduce((a, r) => ({
        total: a.total + r.total, normal: a.normal + r.normal, hard: a.hard + r.hard,
      }), { total: 0, normal: 0, hard: 0 })
      return { name: edu.name, rows, sub }
    }))

    const grand = groups.reduce((a, g) => ({
      total: a.total + g.sub.total, normal: a.normal + g.sub.normal, hard: a.hard + g.sub.hard,
    }), { total: 0, normal: 0, hard: 0 })

    const tbody = groups.map(g => {
      const rows = g.rows.map(r => `
          <tr>
            <td>${escapeHtml(r.label)}</td>
            <td>${r.total}</td>
            <td>${r.fc ? dash : r.normal}</td>
            <td>${r.fc ? dash : (r.hard > 0 ? r.hard : dash)}</td>
          </tr>`).join('')
      return `
          <tr class="stats-edu-row"><th colspan="4" scope="colgroup">${escapeHtml(g.name)}</th></tr>
          ${rows}
          <tr class="stats-subtotal-row">
            <td>Summa ${escapeHtml(g.name.toLowerCase())}</td>
            <td>${g.sub.total}</td>
            <td>${g.sub.normal}</td>
            <td>${g.sub.hard}</td>
          </tr>`
    }).join('')

    container.innerHTML = `
      <p class="stats-intro">Frågor och kort är indelade per utbildning, precis som i ämnesväljaren på startsidan. Flashcard-ämnen (kort) har ingen svårighetsgrad och visas med ”—”.</p>
      <table class="stats-table" aria-label="Antal frågor och kort per utbildning och ämne">
        <thead>
          <tr><th>Ämne</th><th>Totalt</th><th>Normal</th><th>Svår</th></tr>
        </thead>
        <tbody>
          ${tbody}
          <tr class="stats-total-row">
            <td>Totalt</td>
            <td>${grand.total}</td>
            <td>${grand.normal}</td>
            <td>${grand.hard}</td>
          </tr>
        </tbody>
      </table>`
  } catch {
    container.innerHTML = '<p class="stats-loading">Kunde inte ladda statistik.</p>'
  }
}

/**
 * Antal uppslagsord i medicinska ordlistan — live-termer (exkl. status "stub"),
 * räknat på samma sätt som ordlistesidan. Visas i #glossaryCount.
 */
async function loadGlossaryCount() {
  const elc = document.getElementById('glossaryCount')
  if (!elc) return
  try {
    const data = await fetch(ORDLISTA_URL).then(r => r.json())
    const live = data.filter(e => e.status !== 'stub').length
    elc.innerHTML = `Den medicinska ordlistan innehåller <strong>${live.toLocaleString('sv-SE')}</strong> uppslagsord. <a class="info-link" href="medicinskordlista.html">Öppna ordlistan →</a>`
  } catch {
    elc.textContent = 'Kunde inte ladda ordlistans omfattning.'
  }
}

// ============================================================================
// Kontaktformulär
// ============================================================================

const CONTACT_EMAIL = 'anatomiquizse@gmail.com'

/**
 * Fångar formulärets submit och öppnar besökarens e-postklient via mailto:
 * (GitHub Pages saknar backend; CSP form-action 'self' tillåter ingen riktig
 * mailto-submit, därför preventDefault + window.location).
 */
function initContactForm() {
  const form = document.getElementById('contactForm')
  if (!form) return
  form.addEventListener('submit', (e) => {
    e.preventDefault()
    const type = document.getElementById('contactType').value
    const messageEl = document.getElementById('contactMessage')
    const message = messageEl.value.trim()
    if (!message) { messageEl.focus(); return }
    const subject = `Anatomiquiz – ${type}`
    const body = `${message}\n\n— Skickat från ${location.href}`
    window.location.href =
      `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  })
}

// ============================================================================
// Init
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
  loadStats()
  loadGlossaryCount()
  loadChangelog()
  initContactForm()
})
