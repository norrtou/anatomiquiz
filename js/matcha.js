// ============================================================================
// js/matcha.js — spelläget "Matcha" (parspel), eget modulfilslager.
// ============================================================================
// EGEN FIL PER SPELLÄGE/VERKTYG (regel, CLAUDE_REGLER §12): nya spel, appar och
// verktyg byggs i en egen .js-fil i stället för att växa in i js/app.js, så att
// app.js hålls liten och en ändring i ETT läge inte kräver att hela app.js
// läses/röres.
//
// Laddas som ett vanligt klassiskt <script defer> EFTER js/app.js. Alla klassiska
// script delar samma globala scope, precis som js/images.js ↔ js/app.js redan
// gör – därför kan denna fil anropa app.js hjälpare direkt som globaler:
//   el, shuffle, loadFlags, loadQuestions, loadQuestionsFromMultiplePaths,
//   ALLMANT_LENSES, lensPaths, getQuestionsPath, typeTagOf, topicLabelFor,
//   eduAbbrevFor, formatDuration, warnStorageUnavailable, downloadJsonBlob,
//   topicCapabilities, showHighscores, allQuestions.
// app.js känner i sin tur INTE till Matcha annat än via två skyddade krokar
// (`if(typeof renderMatchaScores === 'function') …` i showHighscores och
// `if(typeof updateMatchaButton === 'function') …` i updateStartButtons).
// ============================================================================
// SPELLOGIK
// ============================================================================
// Återanvänder de befintliga MC-frågorna: varje fråga blir ett par (prompt ↔
// correct). Två kolumner (frågor till vänster, svar till höger, var för sig
// slumpade). Spelaren parar ihop ALLA par i omgången först – en streckad linje
// dras mellan valt par – och FÖRST när alla är ihopparade avslöjas vilka som är
// rätt/fel. Ingen andra chans: felen står kvar och räknas. Spelas i omgångar om
// MATCHA_ROUND_SIZE par tills valt antal par är avklarade. Poäng = antal rätt av
// totalt; tiden mäts över hela spelet. Topplistan rankar flest rätt, snabbast som
// utslag.
//
// Bara korta frågor tas med (kort prompt OCH kort svar) så rutorna ryms på en
// mobilskärm. Par med samma prompt eller samma svar filtreras bort så att en ruta
// aldrig kan matcha två olika rutor (skulle ge tvetydiga par).
const MATCHA_SCORES_KEY = 'hur_highscores_matcha'
const MATCHA_EXPORT_TYPE = 'anatomiquiz-matcha-highscores'
const MATCHA_ROUND_SIZE = 5
const MATCHA_MAX_PROMPT_LEN = 55
const MATCHA_MAX_ANSWER_LEN = 26
const MATCHA_MIN_PAIRS = 4
const MATCHA_REVEAL_MS = 1600     // hur länge rätt/fel visas innan nästa omgång
const SVG_NS = 'http://www.w3.org/2000/svg'

let matchaRounds = []
let matchaRoundIdx = 0
let matchaTotalPairs = 0
let matchaCorrect = 0             // rätt par totalt (över alla omgångar)
let matchaPending = null          // vald ruta som väntar på partner (eller null)
let matchaLinks = []              // [{left, right, correct?}] i pågående omgång
let matchaLocked = false          // blockera klick medan facit visas / omgång byts
let matchaStartTime = 0
let matchaTimerOn = false
let matchaTimerInterval = null
let matchaName = 'Spelare'
let matchaTopic = ''

// Egen lagring (skild från quizets topplista) med minnesfallback vid privat läge.
let matchaMemoryScores = null
function getMatchaScores(){
  if(matchaMemoryScores) return matchaMemoryScores
  try{ return JSON.parse(localStorage.getItem(MATCHA_SCORES_KEY) || '[]') }
  catch(e){ return matchaMemoryScores || [] }
}
function saveMatchaScores(scores){
  try{ localStorage.setItem(MATCHA_SCORES_KEY, JSON.stringify(scores)); matchaMemoryScores = null }
  catch(e){ matchaMemoryScores = scores; warnStorageUnavailable() }
}

// Speglar startQuiz-grenen: laddar rätt frågepool för ämnet (lins/blandade/enkelt)
// och returnerar linsobjektet (eller null) så att topikfiltret kan använda det.
async function loadMatchaPool(topic){
  const lens = ALLMANT_LENSES[topic]
  if(lens){
    await loadQuestionsFromMultiplePaths(lensPaths(lens))
    return lens
  }
  if(topic.startsWith('blandade')){
    const paths = [...new Set(
      Array.from(el('topic').options)
        .filter(o => {
          if(o.disabled || o.value.startsWith('blandade')) return false
          const t = typeTagOf(o.textContent)
          return t.mc || t.tf
        })
        .map(o => getQuestionsPath(o.value))
    )]
    await loadQuestionsFromMultiplePaths(paths)
    return null
  }
  await loadQuestions(getQuestionsPath(topic))
  return null
}

// Speglar topikfiltret i startQuiz (håll i synk om nya ämnen med egen filterlogik
// läggs till där).
function matchaTopicMatches(q, topic, lens){
  if(lens) return lens.match.test(q.topic)
  if(topic === 'any') return true
  if(topic === 'any_riktningar') return q.topic === 'riktningar'
  if(topic === 'osteologi') return q.topic.startsWith('osteologi_')
  if(topic === 'muskler') return q.topic.startsWith('muskler_')
  if(topic === 'skuldran') return q.topic.startsWith('skuldra_')
  if(topic === 'grepp') return q.topic.startsWith('grepp_')
  if(topic === 'ledtyper') return q.topic.startsWith('ledtyper_')
  if(topic === 'handen') return q.topic.startsWith('handen_')
  if(topic === 'tentaplugg') return q.topic.startsWith('studier_')
  if(topic === 'neurologi') return q.topic.startsWith('nervsystemet_')
  if(topic === 'blodomloppet') return q.topic.startsWith('blodomloppet_')
  if(topic === 'lakare_anatomi_fysiologi') return q.topic.startsWith('fysiologi_') || q.topic.startsWith('anatomi_')
  if(topic.startsWith('blandade')) return true
  return q.topic === topic
}

async function startMatcha(){
  matchaName = el('playerName').value.trim() || 'Spelare'
  const num = parseInt(el('numQuestions').value, 10)
  matchaTimerOn = !!el('timerEnabled')?.checked
  matchaTopic = el('topic').value

  const lens = await loadMatchaPool(matchaTopic)
  const flags = loadFlags()
  const norm = s => (s || '').trim().toLocaleLowerCase('sv-SE')
  const seenPrompt = new Set()
  const seenCorrect = new Set()
  const pairs = []
  // Slumpa hela poolen först → slumpmässigt urval av par varje spel.
  for(const q of shuffle(allQuestions.slice())){
    if(q.type !== 'mc') continue          // TF ("Sant"/"Falskt") duger inte som par
    if(q.image) continue                  // bildfrågor har ingen textprompt att para
    if(q.source && String(q.source).toLowerCase() === 'placeholder') continue
    if(/^ph\d{3}$/.test(String(q.id))) continue
    if(!q.prompt || !q.correct) continue
    if(q.prompt.length > MATCHA_MAX_PROMPT_LEN || q.correct.length > MATCHA_MAX_ANSWER_LEN) continue
    if(flags[q.id] && flags[q.id].excluded) continue
    if(!matchaTopicMatches(q, matchaTopic, lens)) continue
    const np = norm(q.prompt), nc = norm(q.correct)
    if(seenPrompt.has(np) || seenCorrect.has(nc)) continue
    seenPrompt.add(np); seenCorrect.add(nc)
    pairs.push({ prompt: q.prompt, correct: q.correct })
  }

  if(pairs.length < MATCHA_MIN_PAIRS){
    alert('Det finns inte tillräckligt många korta frågor i det här ämnet för Matcha. Välj ett annat ämne.')
    return
  }

  let total = Math.min(num, pairs.length)
  // Undvik en ensam sista omgång (ett par matchar sig självt direkt).
  if(total > MATCHA_ROUND_SIZE && total % MATCHA_ROUND_SIZE === 1) total--
  const chosen = pairs.slice(0, total)
  matchaTotalPairs = total
  matchaRounds = []
  for(let i = 0; i < chosen.length; i += MATCHA_ROUND_SIZE){
    matchaRounds.push(chosen.slice(i, i + MATCHA_ROUND_SIZE))
  }
  matchaRoundIdx = 0
  matchaCorrect = 0
  matchaStartTime = Date.now()

  // Visa vad man spelar: ämne + antal par. topicLabelFor ger ämnesetiketten;
  // strippa typtaggen i parentes ("(MC)") så det blir rent.
  const label = topicLabelFor(matchaTopic).replace(/\s*\([^)]*\)\s*$/, '')
  el('matchaPlayerLabel').textContent = matchaName
  el('matchaMeta').textContent = `Ämne: ${label} · ${matchaTotalPairs} par`

  el('setup').classList.add('hidden')
  el('highscores').classList.add('hidden')
  el('result').classList.add('hidden')
  el('quiz').classList.add('hidden')
  el('flashcards').classList.add('hidden')
  el('matchaFinished').classList.add('hidden')
  el('matchaBoard').classList.remove('hidden')
  el('matchaFooter').classList.remove('hidden')
  el('matcha').classList.remove('hidden')
  if(matchaTimerOn) startMatchaTimer(); else el('matchaTimer').textContent = ''
  renderMatchaRound()
  window.scrollTo({ top: 0 })
}

function makeMatchaTile(text, pairIdx, side){
  const b = document.createElement('button')
  b.type = 'button'
  b.className = 'matcha-tile'
  b.textContent = text
  b.dataset.pair = String(pairIdx)
  b.dataset.side = side
  b.setAttribute('aria-pressed', 'false')
  b.matchaPartner = null
  b.addEventListener('click', () => onMatchaTileClick(b))
  return b
}

function currentRoundSize(){
  const r = matchaRounds[matchaRoundIdx]
  return r ? r.length : 0
}

function renderMatchaRound(){
  matchaPending = null
  matchaLinks = []
  matchaLocked = false
  const round = matchaRounds[matchaRoundIdx]
  // Kolumnerna slumpas var för sig så att rad-position inte avslöjar paret.
  const left = shuffle(round.map((p, i) => ({ p, i })))
  const right = shuffle(round.map((p, i) => ({ p, i })))
  const colL = el('matchaColLeft'), colR = el('matchaColRight')
  colL.innerHTML = ''; colR.innerHTML = ''
  left.forEach(({ p, i }) => colL.appendChild(makeMatchaTile(p.prompt, i, 'left')))
  right.forEach(({ p, i }) => colR.appendChild(makeMatchaTile(p.correct, i, 'right')))
  clearMatchaLines()
  updateMatchaProgress()
  el('matchaHint').textContent = 'Para ihop alla par. Rätt och fel visas först när du parat ihop allihop.'
  updateMatchaScoreStatus()
}

function updateMatchaProgress(){
  el('matchaProgress').textContent =
    `Omgång ${matchaRoundIdx + 1}/${matchaRounds.length} · ${matchaLinks.length}/${currentRoundSize()} ihopparade`
}

function updateMatchaScoreStatus(){
  el('matchaMiss').textContent = `Rätt: ${matchaCorrect}/${matchaTotalPairs}`
}

function deselectPending(){
  if(matchaPending){
    matchaPending.classList.remove('selected')
    matchaPending.setAttribute('aria-pressed', 'false')
    matchaPending = null
  }
}

function onMatchaTileClick(b){
  if(matchaLocked) return
  // En redan ihopparad ruta: klicka för att bryta paret (ångra) och para om.
  if(b.classList.contains('linked')){ unlinkTile(b); return }
  // Klick på den redan valda rutan → avmarkera.
  if(matchaPending === b){ deselectPending(); return }
  // Ingen väntande ruta ännu → markera denna.
  if(!matchaPending){
    matchaPending = b
    b.classList.add('selected')
    b.setAttribute('aria-pressed', 'true')
    return
  }
  // Väntande ruta finns. Samma kolumn → flytta markeringen dit.
  if(matchaPending.dataset.side === b.dataset.side){
    matchaPending.classList.remove('selected')
    matchaPending.setAttribute('aria-pressed', 'false')
    matchaPending = b
    b.classList.add('selected')
    b.setAttribute('aria-pressed', 'true')
    return
  }
  // Motsatt kolumn → skapa ett par (linje), utan att avslöja rätt/fel.
  const left = b.dataset.side === 'left' ? b : matchaPending
  const right = b.dataset.side === 'right' ? b : matchaPending
  matchaPending = null
  createMatchaLink(left, right)
  // Alla par ihopparade? Då – och först då – avslöjas facit.
  if(matchaLinks.length === currentRoundSize()) revealMatchaRound()
}

function createMatchaLink(left, right){
  [left, right].forEach(t => {
    t.classList.remove('selected')
    t.classList.add('linked')
    t.setAttribute('aria-pressed', 'false')
  })
  left.matchaPartner = right
  right.matchaPartner = left
  matchaLinks.push({ left, right })
  drawMatchaLines()
  updateMatchaProgress()
}

function unlinkTile(t){
  const partner = t.matchaPartner
  ;[t, partner].forEach(x => {
    if(!x) return
    x.classList.remove('linked')
    x.matchaPartner = null
  })
  matchaLinks = matchaLinks.filter(k => k.left !== t && k.right !== t && k.left !== partner && k.right !== partner)
  drawMatchaLines()
  updateMatchaProgress()
}

// Rätta hela omgången på en gång (först när allt är ihopparat). Ingen andra chans.
function revealMatchaRound(){
  matchaLocked = true
  let roundCorrect = 0
  matchaLinks.forEach(link => {
    const ok = link.left.dataset.pair === link.right.dataset.pair
    link.correct = ok
    ;[link.left, link.right].forEach(t => {
      t.classList.remove('linked')
      t.classList.add(ok ? 'correct' : 'wrong')
      t.disabled = true
      const sr = document.createElement('span')
      sr.className = 'sr-only'
      sr.textContent = ok ? ' — rätt' : ' — fel'
      t.appendChild(sr)
    })
    if(ok) roundCorrect++
  })
  matchaCorrect += roundCorrect
  drawMatchaLines()           // färga om linjerna grön/röd
  updateMatchaScoreStatus()
  el('matchaHint').textContent =
    `Omgång ${matchaRoundIdx + 1}: ${roundCorrect} av ${matchaLinks.length} rätt.`
  setTimeout(advanceMatchaRound, MATCHA_REVEAL_MS)
}

function advanceMatchaRound(){
  matchaRoundIdx++
  if(matchaRoundIdx >= matchaRounds.length){ finishMatcha(); return }
  renderMatchaRound()
}

// --- Linjeritning (SVG-overlay) ---------------------------------------------
// Klassiska streckade linjer mellan ihopparade rutor, med en liten prick i vardera
// änden. Koordinater räknas ut ur rutornas getBoundingClientRect relativt brädet,
// så variabel radhöjd (radbruten text) hanteras automatiskt. Ritas om vid resize.
function clearMatchaLines(){
  const svg = el('matchaLines')
  if(!svg) return
  while(svg.firstChild) svg.removeChild(svg.firstChild)
}

function svgEl(name, attrs){
  const e = document.createElementNS(SVG_NS, name)
  for(const k in attrs) e.setAttribute(k, attrs[k])
  return e
}

function drawMatchaLines(){
  const svg = el('matchaLines'), board = el('matchaBoard')
  if(!svg || !board) return
  clearMatchaLines()
  const b = board.getBoundingClientRect()
  svg.setAttribute('width', b.width)
  svg.setAttribute('height', b.height)
  matchaLinks.forEach(link => {
    const lr = link.left.getBoundingClientRect()
    const rr = link.right.getBoundingClientRect()
    const x1 = lr.right - b.left, y1 = lr.top + lr.height / 2 - b.top
    const x2 = rr.left - b.left,  y2 = rr.top + rr.height / 2 - b.top
    const state = link.correct === true ? ' correct' : link.correct === false ? ' wrong' : ''
    svg.appendChild(svgEl('line', { x1, y1, x2, y2, class: 'matcha-line' + state }))
    svg.appendChild(svgEl('circle', { cx: x1, cy: y1, r: 4, class: 'matcha-dot' + state }))
    svg.appendChild(svgEl('circle', { cx: x2, cy: y2, r: 4, class: 'matcha-dot' + state }))
  })
}

function finishMatcha(){
  clearMatchaTimer()
  const durationMs = matchaStartTime ? Date.now() - matchaStartTime : 0
  el('matchaBoard').classList.add('hidden')
  el('matchaFooter').classList.add('hidden')
  el('matchaFinished').classList.remove('hidden')
  const timeStr = formatDuration(durationMs)
  const pct = matchaTotalPairs ? Math.round((matchaCorrect / matchaTotalPairs) * 100) : 0
  el('matchaDoneText').textContent =
    `Klart! ${matchaCorrect} av ${matchaTotalPairs} rätt (${pct} %) på ${timeStr}. Resultatet sparades i topplistan.`
  try { saveMatchaScore(durationMs) } catch(e){ console.error('saveMatchaScore misslyckades:', e) }
  window.scrollTo({ top: 0 })
}

function saveMatchaScore(durationMs){
  const scores = getMatchaScores()
  scores.push({
    name: matchaName,
    topic: matchaTopic,
    topicLabel: topicLabelFor(matchaTopic),
    pairs: matchaTotalPairs,
    correct: matchaCorrect,
    durationMs,
    date: new Date().toISOString()
  })
  // Senaste först (samma 50-tak som quizets topplista).
  scores.sort((a, b) => new Date(b.date) - new Date(a.date))
  saveMatchaScores(scores.slice(0, 50))
}

function startMatchaTimer(){
  el('matchaTimer').textContent = 'Tid: 0 s'
  matchaTimerInterval = setInterval(() => {
    const s = Math.floor((Date.now() - matchaStartTime) / 1000)
    el('matchaTimer').textContent = `Tid: ${s} s`
  }, 500)
}

function clearMatchaTimer(){
  if(matchaTimerInterval){ clearInterval(matchaTimerInterval); matchaTimerInterval = null }
}

function cancelMatcha(){
  if(confirm('Är du säker? Ditt resultat sparas inte.')){
    clearMatchaTimer()
    el('matcha').classList.add('hidden')
    el('setup').classList.remove('hidden')
  }
}

// Topplistesegmentet för Matcha (i #highscores). Rankar flest rätt först, snabbast
// tid som utslag. Tomt fack visar hs-empty-texten. Bakåtkompatibelt: äldre poster
// utan `correct` (då var alla par alltid rätt) räknas som pairs rätt.
function matchaCorrectOf(s){ return (typeof s.correct === 'number') ? s.correct : s.pairs }

function renderMatchaScores(){
  const ol = el('scoreList-matcha')
  if(!ol) return
  const emptyP = ol.parentElement.querySelector('.hs-empty')
  const scores = getMatchaScores()
  const pctOf = s => (s.pairs > 0 ? matchaCorrectOf(s) / s.pairs : 0)
  const timeKey = s => (s.durationMs > 0 ? s.durationMs : Infinity)
  const list = [...scores].sort((a, b) => {
    if(pctOf(b) !== pctOf(a)) return pctOf(b) - pctOf(a)
    return timeKey(a) - timeKey(b)
  }).slice(0, 10)
  ol.innerHTML = ''
  if(list.length === 0){
    if(emptyP) emptyP.classList.remove('hidden')
    return
  }
  if(emptyP) emptyP.classList.add('hidden')
  const mk = (cls, text) => { const sp = document.createElement('span'); sp.className = cls; sp.textContent = text; return sp }
  list.forEach((s, i) => {
    const li = document.createElement('li')
    li.className = 'score-row'
    const label = (s.topicLabel || 'Okänt ämne').replace(/\s*\([^)]*\)\s*$/, '')
    const abbrev = eduAbbrevFor(s.topic)
    const dateStr = new Date(s.date).toLocaleDateString('sv-SE')
    const correct = matchaCorrectOf(s)
    const pct = s.pairs ? Math.round((correct / s.pairs) * 100) : 0
    li.append(
      mk('sr-rank', (i + 1) + '.'),
      mk('sr-name', s.name),
      mk('sr-topic', abbrev ? `(${abbrev}) ${label}` : label),
      mk('sr-score', `${correct}/${s.pairs}`),
      mk(pct < 75 ? 'sr-pct sr-lead weak' : 'sr-pct sr-lead', `${pct} %`),
      mk('sr-time', formatDuration(s.durationMs)),
      mk('sr-date', dateStr)
    )
    ol.appendChild(li)
  })
}

function exportMatchaScores(){
  const scores = getMatchaScores()
  if(!scores.length){ alert('Det finns inga Matcha-resultat att exportera än.'); return }
  const payload = { type: MATCHA_EXPORT_TYPE, version: 1, exported: new Date().toISOString(), scores }
  downloadJsonBlob(payload, `anatomiquiz-matcha-${new Date().toISOString().slice(0, 10)}`)
}

// Unik signatur per Matcha-resultat → import av samma backup två gånger dubblerar inte.
function matchaScoreSignature(s){ return [s.date, s.name, s.topic, s.pairs, s.durationMs].join('|') }

function handleImportMatchaScores(ev){
  const f = ev.target.files && ev.target.files[0]
  if(!f) return
  const reader = new FileReader()
  reader.onload = () => {
    try{
      const parsed = JSON.parse(reader.result)
      const incoming = Array.isArray(parsed) ? parsed
        : (parsed && parsed.type === MATCHA_EXPORT_TYPE && Array.isArray(parsed.scores)) ? parsed.scores
        : null
      if(!incoming){ alert('Fel format: filen ser inte ut som en exporterad Matcha-topplista.'); return }
      const merged = getMatchaScores()
      const seen = new Set(merged.map(matchaScoreSignature))
      let added = 0, skipped = 0
      incoming.forEach(s => {
        if(!s || typeof s.date !== 'string' || typeof s.durationMs !== 'number'){ skipped++; return }
        const sig = matchaScoreSignature(s)
        if(seen.has(sig)){ skipped++; return }
        seen.add(sig); merged.push(s); added++
      })
      merged.sort((a, b) => new Date(b.date) - new Date(a.date))
      saveMatchaScores(merged.slice(0, 50))
      renderMatchaScores()
      alert(`Import klar. Tillagda: ${added}. Hoppade över (dubbletter/ogiltiga): ${skipped}.`)
    }catch(e){ alert('Kunde inte läsa JSON: ' + e.message) }
  }
  reader.readAsText(f, 'utf-8')
  ev.target.value = ''
}

function clearMatchaScores(){
  localStorage.removeItem(MATCHA_SCORES_KEY)
  matchaMemoryScores = null
  renderMatchaScores()
}

// --- Uppkoppling (egen DOMContentLoaded, oberoende av app.js:s init) ---------

// Matcha bygger par av MC-frågor → knappen skuggas för ämnen utan flervalsfrågor.
// Anropas av app.js updateStartButtons() via en skyddad krok, så knappen hålls i
// synk även när app.js bygger om ämneslistan programmatiskt.
function updateMatchaButton(){
  const cap = topicCapabilities()
  const mb = el('startMatchaBtn'); if(mb) mb.disabled = !cap.mc
}

// Rita om linjerna när brädet ändrar storlek (rotation, adressfält, textzoom).
function redrawMatchaLinesIfVisible(){
  if(!el('matcha')?.classList.contains('hidden')) drawMatchaLines()
}
window.addEventListener('resize', redrawMatchaLinesIfVisible)
if(window.visualViewport) window.visualViewport.addEventListener('resize', redrawMatchaLinesIfVisible)

document.addEventListener('DOMContentLoaded', () => {
  el('startMatchaBtn')?.addEventListener('click', startMatcha)
  el('matchaCancelBtn')?.addEventListener('click', cancelMatcha)
  el('matchaRetryBtn')?.addEventListener('click', startMatcha)
  el('matchaQuitBtn')?.addEventListener('click', () => { el('matcha').classList.add('hidden'); el('setup').classList.remove('hidden') })
  el('exportScores-matcha')?.addEventListener('click', exportMatchaScores)
  const impMatcha = el('importScoresFile-matcha')
  if(impMatcha) impMatcha.addEventListener('change', handleImportMatchaScores)
  el('importScoresBtn-matcha')?.addEventListener('click', () => impMatcha?.click())
  el('clearScores-matcha')?.addEventListener('click', () => { if(confirm('Är du säker? Alla Matcha-resultat raderas permanent.')) clearMatchaScores() })
  updateMatchaButton()
})
