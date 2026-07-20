/**
 * changelog.js — delad rendering av ändringsloggen (CHANGELOG.md).
 *
 * Används av två sidor med olika omfattning:
 *   info.html             → de tre senaste versionerna som teaser (ingen "visa fler")
 *   versionshistorik.html → 50 åt gången med "visa fler"-knapp
 *
 * Laddas FÖRE info.js/versionshistorik.js (båda med defer, så ordningen hålls).
 * escapeHtml bor här eftersom info.js också använder den för statistiktabellen.
 */

const CHANGELOG_URL = './CHANGELOG.md'

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

/**
 * Parsar CHANGELOG.md till versionsposter.
 * @param {string} text  Råtext från CHANGELOG.md
 * @returns {{version: string, items: string[]}[]}
 */
function parseChangelog(text) {
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

  return entries
}

/**
 * Renderar versionsposter till HTML.
 * @param {{version: string, items: string[]}[]} entries
 * @returns {string}
 */
function renderEntries(entries) {
  return entries
    .map(e => {
      const itemsHtml = e.items.map(i => `<div class="cl-item">– ${escapeHtml(i)}</div>`).join('')
      return `<div class="changelog-entry">
        <div class="changelog-version">v${escapeHtml(e.version)}</div>
        <div class="cl-body">${itemsHtml}</div>
      </div>`
    })
    .join('')
}

/**
 * Hämtar versionsposter från en URL.
 *
 * .json  → färdigparsad teaser (changelog-latest.json), genererad av
 *          scripts/generate_changelog_teaser.py
 * annars → rå CHANGELOG.md som parsas i webbläsaren
 *
 * @param {string} url
 * @returns {Promise<{version: string, items: string[]}[]>}
 */
async function fetchEntries(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return url.endsWith('.json') ? res.json() : parseChangelog(await res.text())
}

/**
 * Hämtar ändringsloggen och renderar poster i en container.
 *
 * @param {Object}  opts
 * @param {string}  opts.containerId  Id på elementet som posterna skrivs i.
 * @param {number}  opts.limit        Antal versioner som visas direkt.
 * @param {string}  [opts.moreId]     Id på "visa fler"-knappen. Utelämnas på
 *   info.html, där teasern i stället länkar vidare till versionshistorik.html.
 * @param {string}  [opts.url]        Källa. Default hela CHANGELOG.md. info.html
 *   skickar in teaser-filen; går den inte att hämta faller vi tillbaka på
 *   CHANGELOG.md, så sidan aldrig blir tom bara för att teasern saknas.
 */
async function initChangelog({ containerId, limit, moreId, url = CHANGELOG_URL }) {
  const container = document.getElementById(containerId)
  if (!container) return
  container.innerHTML = '<p class="changelog-loading">Laddar ändringslogg…</p>'

  const moreBtn = moreId ? document.getElementById(moreId) : null
  if (moreBtn) moreBtn.hidden = true

  let entries = []
  try {
    entries = await fetchEntries(url)
  } catch {
    try {
      entries = await fetchEntries(CHANGELOG_URL)
    } catch {
      container.innerHTML = '<p class="changelog-loading">Kunde inte ladda ändringslogg.</p>'
      return
    }
  }

  if (!entries.length) {
    container.innerHTML = '<p class="changelog-loading">Ingen ändringslogg hittades.</p>'
    return
  }

  let shown = 0

  /** Renderar nästa sjok och uppdaterar knappens synlighet/etikett. */
  function showMore() {
    const next = entries.slice(shown, shown + limit)
    const html = renderEntries(next)
    if (shown === 0) container.innerHTML = html
    else container.insertAdjacentHTML('beforeend', html)
    shown += next.length

    if (!moreBtn) return
    const left = entries.length - shown
    moreBtn.hidden = left <= 0
    if (left > 0) moreBtn.textContent = `Visa fler versioner (${left} kvar)`
  }

  showMore()
  if (moreBtn) moreBtn.addEventListener('click', showMore)
}
