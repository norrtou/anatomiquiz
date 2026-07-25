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
//   el, shuffle, loadFlags, loadPoolForTopic, topicMatchesSelection,
//   topicLabelFor, eduAbbrevFor, formatDuration, warnStorageUnavailable,
//   downloadJsonBlob, topicCapabilities, showHighscores, allQuestions.
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
const SVG_NS = 'http://www.w3.org/2000/svg'
const MATCHA_RING_CIRCUMFERENCE = 326.7 // 2 · π · r(52), matchar .matcha-ring-progress i styles.css
// Textlängd → typsnittsskala per bricka (CSS-variabeln --tile-scale). Korta ord
// krymps inte alls; långa prompter (upp mot MATCHA_MAX_PROMPT_LEN) krymps mot
// golvet. Syftet är att minska skillnaden i radantal/höjd mellan en kort och en
// lång bricka i samma omgång — CSS max() sätter dessutom ett absolut läslighetsgolv.
const MATCHA_SCALE_MIN_LEN = 14
const MATCHA_SCALE_MAX_LEN = MATCHA_MAX_PROMPT_LEN
const MATCHA_SCALE_FLOOR = 0.82
const MATCHA_REVEAL_STEP_MS = 260

let matchaRounds = []
let matchaRoundIdx = 0
let matchaTotalPairs = 0
let matchaCorrect = 0             // rätt par totalt (över alla omgångar)
let matchaRevealedInRound = 0     // hur många par som hunnit rättas i den pågående sekventiella revealen
let matchaPending = null          // vald ruta som väntar på partner (eller null)
let matchaLinks = []              // [{left, right, correct?}] i pågående omgång
let matchaLocked = false          // blockera klick medan facit visas
let matchaPhase = 'pairing'       // 'pairing' (para ihop) → 'revealed' (facit visat)
let matchaStartTime = 0
let matchaTimerOn = false
let matchaTimerInterval = null
let matchaName = 'Spelare'
let matchaTopic = ''
let matchaAudioCtx = null

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

function prefersReducedMotion(){
  return typeof window !== 'undefined' && !!window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// Krympskala för en brickas typsnitt utifrån textlängd (se konstanterna ovan).
function matchaTileScale(text){
  const len = (text || '').length
  if(len <= MATCHA_SCALE_MIN_LEN) return 1
  const t = Math.min(1, (len - MATCHA_SCALE_MIN_LEN) / (MATCHA_SCALE_MAX_LEN - MATCHA_SCALE_MIN_LEN))
  return 1 - t * (1 - MATCHA_SCALE_FLOOR)
}

// Korta, självgenererade pip via Web Audio — inga externa ljudfiler (CSP tillåter
// ingen extern källa ändå). Skapas/återupptas först vid en spelarinitierad
// tryckning, vilket också uppfyller webbläsarnas autoplay-krav. Stängs av helt
// via inställningarnas "Ljudeffekter"-bock (av/på, ingen volymreglage).
function matchaSoundEnabled(){
  const cb = el('soundEnabled')
  return cb ? !!cb.checked : true
}

function getMatchaAudioCtx(){
  if(matchaAudioCtx) return matchaAudioCtx
  const Ctx = window.AudioContext || window.webkitAudioContext
  if(!Ctx) return null
  try{ matchaAudioCtx = new Ctx() }catch(e){ matchaAudioCtx = null }
  return matchaAudioCtx
}

function playMatchaTone(ok){
  if(!matchaSoundEnabled()) return
  const ctx = getMatchaAudioCtx()
  if(!ctx) return
  if(ctx.state === 'suspended') ctx.resume()
  const now = ctx.currentTime
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(ok ? 880 : 220, now)
  if(!ok) osc.frequency.exponentialRampToValueAtTime(160, now + 0.18)
  gain.gain.setValueAtTime(0.0001, now)
  gain.gain.exponentialRampToValueAtTime(0.18, now + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + (ok ? 0.16 : 0.22))
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(now)
  osc.stop(now + (ok ? 0.2 : 0.26))
}

function matchaVibrate(pattern){
  if(typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') navigator.vibrate(pattern)
}

// Frågepool och ämnesfilter delas numera med övriga spellägen: `loadPoolForTopic`
// och `topicMatchesSelection` bor i js/app.js i EN upplaga (de låg tidigare som en
// egen kopia här). En kopia per läge skulle glida isär så fort ett nytt
// paraplyämne tillkom — lägg därför nya ämnesgrenar i app.js, inte här.

async function startMatcha(){
  matchaName = el('playerName').value.trim() || 'Spelare'
  const num = parseInt(el('numQuestions').value, 10)
  matchaTimerOn = !!el('timerEnabled')?.checked
  matchaTopic = el('topic').value

  const lens = await loadPoolForTopic(matchaTopic)
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
    if(!topicMatchesSelection(q, matchaTopic, lens)) continue
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
  b.style.setProperty('--tile-scale', matchaTileScale(text).toFixed(3))
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
  matchaPhase = 'pairing'
  matchaRevealedInRound = 0
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
  updateMatchaScoreBadge(false)
  el('matchaHint').textContent = 'Para ihop alla par och tryck sedan på "Visa rätt svar".'
  updateMatchaNextButton()
}

// Antal par som redan låg bakom oss när den här omgången startade (omgångarna
// kan ha olika längd om sista omgången justerats, se startMatcha).
function pairsBeforeCurrentRound(){
  let n = 0
  for(let i = 0; i < matchaRoundIdx; i++) n += matchaRounds[i].length
  return n
}

// Riktig framstegsmätare (fylls stadigt genom hela spelet, inte bara omgången)
// + omgångsetiketten. Ersätter den gamla rena textraden.
function updateMatchaProgress(){
  const placed = pairsBeforeCurrentRound() + matchaLinks.length
  const pct = matchaTotalPairs ? Math.min(100, Math.round((placed / matchaTotalPairs) * 100)) : 0
  const fill = el('matchaProgressFill')
  if(fill) fill.style.width = pct + '%'
  el('matchaProgress').textContent = `Omgång ${matchaRoundIdx + 1}/${matchaRounds.length}`
}

// "Rätt"-räknaren i infopanelen: rätt av hittills RÄTTADE par (inte bara ihopparade).
// Studsar till (bump-animationen) när den ökar av ett nytt rätt par.
function updateMatchaScoreBadge(bump){
  const badge = el('matchaScoreBadge')
  if(!badge) return
  const revealedSoFar = pairsBeforeCurrentRound() + matchaRevealedInRound
  badge.textContent = revealedSoFar > 0 ? `Rätt: ${matchaCorrect}/${revealedSoFar}` : 'Rätt: 0'
  if(bump){
    badge.classList.remove('bump')
    void badge.offsetWidth // tvinga reflow så animationen kan köras igen
    badge.classList.add('bump')
  }
}

function isLastMatchaRound(){ return matchaRoundIdx >= matchaRounds.length - 1 }

// Primärknappen i footern. Under ihopparning heter den "Visa rätt svar" och är
// avstängd tills alla par i omgången är lagda. När facit visats blir den "Nästa"
// (eller "Avsluta" på sista omgången).
function updateMatchaNextButton(){
  const btn = el('matchaNextBtn')
  if(!btn) return
  if(matchaPhase === 'revealed'){
    btn.textContent = isLastMatchaRound() ? 'Avsluta' : 'Nästa'
    btn.disabled = false
  } else {
    btn.textContent = 'Visa rätt svar'
    btn.disabled = matchaLinks.length !== currentRoundSize()
  }
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
  matchaVibrate(10) // kort tryckkänsla när ett par kopplas ihop
  drawMatchaLines()
  updateMatchaProgress()
  updateMatchaNextButton()   // aktiverar "Visa rätt svar" när alla par är lagda
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
  updateMatchaNextButton()   // stänger av "Visa rätt svar" igen om ett par bröts
}

// Rätta omgången ETT PAR I TAGET (payoff-reveal i stället för ett hårt blink):
// varje par tänds grönt/rött i snabb följd, med ett litet ljud/haptik-styng och
// en pop-/skak-animation, medan "Rätt"-räknaren studsar upp. Ingen andra chans —
// resultatet per par är redan avgjort, det är bara AVSLÖJANDET som är sekventiellt.
function revealMatchaRound(){
  matchaLocked = true
  const btn = el('matchaNextBtn')
  if(btn) btn.disabled = true // "Visa rätt svar" ska inte gå att klicka på igen mitt i revealen
  const links = matchaLinks.slice()
  matchaRevealedInRound = 0
  let roundCorrect = 0
  const stepDelay = prefersReducedMotion() ? 0 : MATCHA_REVEAL_STEP_MS
  drawMatchaLines() // säkerställer färska pathEl/dot-referenser på varje länk innan facit rullar igång

  function step(){
    if(matchaRevealedInRound >= links.length){
      matchaPhase = 'revealed'
      const perfect = links.length > 0 && roundCorrect === links.length
      el('matchaHint').textContent =
        `Omgång ${matchaRoundIdx + 1}: ${roundCorrect} av ${links.length} rätt` +
        ` · totalt ${matchaCorrect} av ${matchaTotalPairs}.` + (perfect ? ' Perfekt omgång! 🎯' : '')
      updateMatchaNextButton()
      return
    }
    const link = links[matchaRevealedInRound]
    const ok = link.left.dataset.pair === link.right.dataset.pair
    link.correct = ok
    ;[link.left, link.right].forEach(t => {
      t.classList.remove('linked')
      t.classList.add(ok ? 'correct' : 'wrong', ok ? 'pop' : 'shake')
      t.disabled = true
      const sr = document.createElement('span')
      sr.className = 'sr-only'
      sr.textContent = ok ? ' — rätt' : ' — fel'
      t.appendChild(sr)
    })
    if(ok){ roundCorrect++; matchaCorrect++ }
    matchaRevealedInRound++
    playMatchaTone(ok)
    matchaVibrate(ok ? 12 : [10, 35, 10])
    updateMatchaScoreBadge(ok)
    // Färga om ENDAST det här parets egen linje/prickar (redan grown/synliga) i
    // stället för att rita om hela brädet – annars skulle redan avslöjade par
    // trigga en ny in-fade-animation vid varje efterföljande steg.
    const lineState = ok ? 'correct' : 'wrong'
    ;[link.pathEl, link.dot1El, link.dot2El].forEach(node => node && node.classList.add(lineState))
    if(stepDelay === 0) step(); else setTimeout(step, stepDelay)
  }
  step()
}

// Klick på primärknappen. I ihopparningsläget visar den facit; i facitläget går
// den vidare till nästa omgång, eller avslutar spelet på den sista.
function onMatchaNextBtn(){
  if(matchaPhase === 'pairing'){
    if(matchaLinks.length === currentRoundSize()) revealMatchaRound()
    return
  }
  if(isLastMatchaRound()){ finishMatcha(); return }
  matchaRoundIdx++
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
  const drawn = []
  matchaLinks.forEach(link => {
    const lr = link.left.getBoundingClientRect()
    const rr = link.right.getBoundingClientRect()
    const x1 = lr.right - b.left, y1 = lr.top + lr.height / 2 - b.top
    const x2 = rr.left - b.left,  y2 = rr.top + rr.height / 2 - b.top
    const midX = x1 + (x2 - x1) / 2
    const state = link.correct === true ? ' correct' : link.correct === false ? ' wrong' : ''
    // Lätt böjd förbindelse (kvadratisk S-kurva) i stället för ett rakt streck.
    const d = `M ${x1} ${y1} C ${midX} ${y1} ${midX} ${y2} ${x2} ${y2}`
    const path = svgEl('path', { d, class: 'matcha-line' + state })
    const dot1 = svgEl('circle', { cx: x1, cy: y1, r: 4, class: 'matcha-dot' + state })
    const dot2 = svgEl('circle', { cx: x2, cy: y2, r: 4, class: 'matcha-dot' + state })
    svg.appendChild(path); svg.appendChild(dot1); svg.appendChild(dot2)
    // Sparas på länk-objektet så revealMatchaRound kan färga om just DETTA par
    // direkt (utan att rita om hela brädet och trigga en ny in-fade på alla
    // redan avslöjade par, se revealMatchaRound).
    link.pathEl = path; link.dot1El = dot1; link.dot2El = dot2
    drawn.push(path, dot1, dot2)
  })
  // Fade in-linjen + väx fram prickarna (CSS-transition) i stället för att de
  // bara poppar upp hårt. Klassen läggs på nästa ritad frame så transitionen
  // faktiskt hinner starta från utgångsläget (opacity:0 / r:0).
  requestAnimationFrame(() => drawn.forEach(node => node.classList.add('grown')))
}

// Bäst hittills (flest rätt-andel, snabbast tid som utslag — samma ordning som
// topplistans sortering). Måste räknas ut INNAN det nya resultatet sparas.
function matchaPriorBest(scores){
  return scores.reduce((best, s) => {
    if(!s.pairs) return best
    const p = matchaCorrectOf(s) / s.pairs
    if(!best || p > best.pct || (p === best.pct && s.durationMs < best.durationMs)){
      return { pct: p, durationMs: s.durationMs }
    }
    return best
  }, null)
}

function animateMatchaRing(pct){
  const label = el('matchaRingPct')
  if(label) label.textContent = pct + ' %'
  const ring = el('matchaRingProgress')
  if(!ring) return
  const clamped = Math.max(0, Math.min(100, pct))
  const offset = MATCHA_RING_CIRCUMFERENCE * (1 - clamped / 100)
  ring.style.strokeDashoffset = String(MATCHA_RING_CIRCUMFERENCE) // starta tom …
  requestAnimationFrame(() => { ring.style.strokeDashoffset = String(offset) }) // … och fyll på till rätt procent
}

function finishMatcha(){
  clearMatchaTimer()
  const durationMs = matchaStartTime ? Date.now() - matchaStartTime : 0
  el('matchaBoard').classList.add('hidden')
  el('matchaFooter').classList.add('hidden')
  el('matchaFinished').classList.remove('hidden')
  const timeStr = formatDuration(durationMs)
  const pct = matchaTotalPairs ? Math.round((matchaCorrect / matchaTotalPairs) * 100) : 0
  const avgSec = matchaTotalPairs ? durationMs / 1000 / matchaTotalPairs : 0

  // Personligt rekord (mot ALLA tidigare Matcha-resultat, samma rangordning
  // som topplistan) — jämförs innan den nya rundan sparas.
  const priorScores = getMatchaScores()
  const priorBest = matchaPriorBest(priorScores)
  const curFrac = matchaTotalPairs ? matchaCorrect / matchaTotalPairs : 0
  const isRecord = !!priorBest && (curFrac > priorBest.pct || (curFrac === priorBest.pct && durationMs < priorBest.durationMs))

  el('matchaDoneText').textContent =
    `Klart! ${matchaCorrect} av ${matchaTotalPairs} rätt (${pct} %) på ${timeStr}. Resultatet sparades i topplistan.`
  const paceLabel = el('matchaPaceLabel')
  if(paceLabel) paceLabel.textContent = matchaTotalPairs ? `Snitt: ${avgSec.toFixed(1)} s/par` : ''
  const recordBadge = el('matchaRecordBadge')
  if(recordBadge) recordBadge.classList.toggle('hidden', !isRecord)
  animateMatchaRing(pct)

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
  el('matchaNextBtn')?.addEventListener('click', onMatchaNextBtn)
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
