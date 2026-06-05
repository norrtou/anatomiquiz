/* ============================================================================
   case.js — filtrerar de kliniska casen på case.html efter ämne.

   Filter-dropdownen byggs dynamiskt ur casens data-topic/data-topic-label,
   så att den automatiskt får med nya ämnen när fler case tillkommer.
   ============================================================================ */

(function () {
  'use strict'

  const select = document.getElementById('caseTopicFilter')
  const list = document.getElementById('caseList')
  const emptyMsg = document.getElementById('caseEmpty')
  if (!select || !list) return

  const cases = Array.from(list.querySelectorAll('.case-card'))

  // Bygg unika ämnen i den ordning de först förekommer (label = visningsnamn).
  const topics = []
  const seen = new Set()
  cases.forEach(function (el) {
    const value = el.dataset.topic || ''
    const label = el.dataset.topicLabel || value
    if (value && !seen.has(value)) {
      seen.add(value)
      topics.push({ value: value, label: label })
    }
  })

  // Fyll menyn: "Alla ämnen" först, sedan ett alternativ per ämne.
  const allOpt = document.createElement('option')
  allOpt.value = 'all'
  allOpt.textContent = 'Alla ämnen'
  select.appendChild(allOpt)
  topics.forEach(function (t) {
    const opt = document.createElement('option')
    opt.value = t.value
    opt.textContent = t.label
    select.appendChild(opt)
  })

  function applyFilter() {
    const chosen = select.value
    let visible = 0
    cases.forEach(function (el) {
      const show = chosen === 'all' || el.dataset.topic === chosen
      el.classList.toggle('hidden', !show)
      if (show) visible++
    })
    if (emptyMsg) emptyMsg.classList.toggle('hidden', visible !== 0)
  }

  select.addEventListener('change', applyFilter)
  applyFilter()
})()
