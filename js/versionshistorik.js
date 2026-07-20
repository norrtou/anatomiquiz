/**
 * versionshistorik.js — Versionshistoriken (versionshistorik.html)
 *
 * Renderar hela ändringsloggen i sjok om 50 versioner via "visa fler"-knappen.
 * All logik ligger i js/changelog.js, som laddas före den här filen.
 * (CSP:n tillåter inga inline-skript, därför en egen fil i stället för en
 * script-tagg i sidan.)
 */

const PAGE_SIZE = 50

document.addEventListener('DOMContentLoaded', () => {
  initChangelog({
    containerId: 'changelogContent',
    limit: PAGE_SIZE,
    moreId: 'changelogMore',
  })
})
