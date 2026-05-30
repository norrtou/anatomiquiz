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
// Init
// ============================================================================

document.addEventListener('DOMContentLoaded', loadChangelog)
