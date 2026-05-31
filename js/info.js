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

const TOPICS = [
  { label: 'Tentaplugg',           file: './data/tentaplugg.json' },
  { label: 'Ben',                  file: './data/ben.json' },
  { label: 'Muskler',              file: './data/muskler.json' },
  { label: 'Handen',               file: './data/handen.json' },
  { label: 'Lägen & riktningar',   file: './data/riktningar.json' },
  { label: 'Medicinsk terminologi',file: './data/medicinsk_terminologi.json' },
  { label: 'Neurologi',            file: './data/neurologi.json' },
  { label: 'Blodomloppet',         file: './data/blodomloppet.json' },
]

const FC_TOPICS = [
  { label: 'Studenters flashcards', file: './data/studenters_flashcards.json' },
]

async function loadStats() {
  const container = document.getElementById('statsContent')
  container.innerHTML = '<p class="stats-loading">Laddar statistik…</p>'

  try {
    const countCards = (file) =>
      fetch(file).then(r => r.json()).then(data => {
        const items = Array.isArray(data) ? data : data.questions
        const normal = items.filter(q => q.difficulty !== 'Hard').length
        const hard   = items.length - normal
        return { total: items.length, normal, hard }
      })

    const [results, fcResults] = await Promise.all([
      Promise.all(TOPICS.map(t => countCards(t.file).then(r => ({ label: t.label, ...r })))),
      Promise.all(FC_TOPICS.map(t => countCards(t.file).then(r => ({ label: t.label, ...r })))),
    ])

    const totals = results.reduce((acc, r) => ({
      total: acc.total + r.total,
      normal: acc.normal + r.normal,
      hard: acc.hard + r.hard,
    }), { total: 0, normal: 0, hard: 0 })

    const dash = '<span class="stats-diff">—</span>'

    const quizRows = results.map(r => `
      <tr>
        <td>${escapeHtml(r.label)}</td>
        <td>${r.total}</td>
        <td>${r.normal}</td>
        <td>${r.hard > 0 ? r.hard : dash}</td>
      </tr>`).join('')

    const fcRows = fcResults.map(r => `
      <tr class="stats-fc-row">
        <td>${escapeHtml(r.label)}</td>
        <td>${r.total}</td>
        <td>${dash}</td>
        <td>${dash}</td>
      </tr>`).join('')

    container.innerHTML = `
      <table class="stats-table" aria-label="Frågestatistik per ämne">
        <thead>
          <tr>
            <th>Ämne</th>
            <th>Totalt</th>
            <th>Normal</th>
            <th>Svår</th>
          </tr>
        </thead>
        <tbody>
          ${quizRows}
          <tr class="stats-total-row">
            <td>Totalt quiz</td>
            <td>${totals.total}</td>
            <td>${totals.normal}</td>
            <td>${totals.hard}</td>
          </tr>
          ${fcRows}
        </tbody>
      </table>`
  } catch {
    container.innerHTML = '<p class="stats-loading">Kunde inte ladda statistik.</p>'
  }
}

// ============================================================================
// Init
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
  loadStats()
  loadChangelog()
})
