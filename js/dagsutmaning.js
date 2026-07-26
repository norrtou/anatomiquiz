// ============================================================================
// js/dagsutmaning.js — spelläget "Dagens utmaning".
// Namnet är ett fritt svenskt ord som ingen firma äger – inga varumärken i
// filnamn, funktioner, id:n, klasser eller synlig text (CLAUDE_REGLER §12.1).
// Synligt namn: "Dagens utmaning". Slug: "dagsutmaning".
// ============================================================================
// EGEN FIL PER SPELLÄGE/VERKTYG (CLAUDE_REGLER §12): filen laddas som ett
// klassiskt <script defer> EFTER js/app.js och delar globalt scope med den,
// precis som js/matcha.js, js/leitner.js och js/tidsjakt.js. Den anropar
// app.js hjälpare direkt som globaler:
//   el, loadFlags, loadPoolForTopic, topicMatchesSelection, topicLabelFor,
//   eduAbbrevFor, warnStorageUnavailable, downloadJsonBlob, topicCapabilities,
//   allQuestions, markAnswerBtn, playTone, streakTone, hapticPulse,
//   reducedMotionPreferred, GM_RING_CIRCUMFERENCE, fitActiveView.
// app.js känner i sin tur INTE till läget annat än via skyddade krokar
// (`if(typeof renderDagsutmaningScores === 'function') …` i showHighscores och
// `if(typeof updateDagsutmaningButton === 'function') …` i updateStartButtons).
//
// Till skillnad från Matcha/Leitner/Tidsjakt, som byggdes före den delade
// spelvysbasen och har egna kopior, använder det här läget `.gm-*` i CSS och
// playTone/streakTone/hapticPulse i app.js (project-shared-game-base).
// ============================================================================
// SPELLOGIK — samma tio frågor hela dygnet, och en svit i dagar
// ============================================================================
// Tio frågor ur valt ämne, valda av datumet självt: seed = hash(dagens datum +
// ämne) driver en egen slumpgenerator, så alla som spelar samma ämne samma dag
// får exakt samma set — och vid midnatt byts det. Det är knappheten som är
// mekaniken: går utmaningen att spela om och om igen är den ingen utmaning,
// och då finns ingen anledning att komma tillbaka i morgon.
//
// Sviten räknar DAGAR, inte rätta svar: klarar man dagens utmaning i vilket
// ämne som helst är dagen avklarad, och klarade man gårdagen växer sviten.
// Missar man en dag börjar den om på 1. Det är hela lägets poäng — ett kort
// pass varje dag slår ett långt pass i månaden.
//
// Ingen klocka. Rätt svar kvitteras kort och nästa fråga kommer av sig själv;
// FEL svar lämnar facit kvar tills man själv trycker Nästa, så att man hinner
// läsa vad som var rätt. Det är lägets anpassning av §13.1 punkt 2: utan klocka
// finns ingen anledning att jaga spelaren förbi ett facit hen behöver.
//
// Ett ämne räknas en gång per dag. Spelar man samma ämne igen samma dag är det
// ett OMSPEL: samma frågor, resultatet sparas inte och sviten rörs inte. Att
// spärra omspelet vore fel — man ska få öva — men att låta det räknas vore att
// göra topplistan och sviten meningslösa.
// ============================================================================
const DAGSUTMANING_SCORES_KEY = 'hur_highscores_dagsutmaning'
const DAGSUTMANING_STATE_KEY = 'hur_dagsutmaning_state'
const DAGSUTMANING_EXPORT_TYPE = 'anatomiquiz-dagsutmaning'

const DAGSUTMANING_SIZE = 10           // "tar två minuter" – inte ett pluggpass
const DAGSUTMANING_MIN_POOL = 5        // färre än så blir ingen utmaning
// Kvittot på ett rätt svar. Det är INFORMATION (tiden ✓ syns), inte rörelse,
// och kortas därför aldrig bort vid prefers-reduced-motion — se §13.1 punkt 8.
const DAGSUTMANING_REVEAL_MS = 650
const DAGSUTMANING_PRAISE_MS = 1800
const DAGSUTMANING_STREAK_STEP = 5     // beröm var femte rätt i rad inom rundan
const DAGSUTMANING_MISSED_SHOWN = 8    // så många missade frågor listas i slutet
const DAGSUTMANING_WEEK = 7            // antal dagar i vaneraden
const DAGSUTMANING_HISTORY_DAYS = 90   // så länge sparas dagshistoriken
const DAGSUTMANING_NEXT_TICK_MS = 30000 // uppdateringstakt för "ny utmaning om …"

// Dagsmilstolpar som firas. Glesare ju längre man kommer – ett firande var
// tredje dag i ett halvår vore inget firande.
const DAGSUTMANING_MILESTONES = [3, 7, 14, 30, 50, 100, 200, 365]

// Måndag först, som i svensk almanacka. Index i listan = getDay()-värdet
// omräknat i renderDagsutmaningWeek.
const DAGSUTMANING_WEEKDAY_INITIALS = ['M', 'T', 'O', 'T', 'F', 'L', 'S']
const DAGSUTMANING_WEEKDAY_NAMES = ['måndag', 'tisdag', 'onsdag', 'torsdag', 'fredag', 'lördag', 'söndag']
const DAGSUTMANING_MONTHS = ['januari', 'februari', 'mars', 'april', 'maj', 'juni',
  'juli', 'augusti', 'september', 'oktober', 'november', 'december']

// Textlängd → typsnittsskala (--prompt-scale/--opt-scale), så att kortet håller
// samma höjd oavsett om frågan är en term eller en mening.
const DAGSUTMANING_PROMPT_SCALE = { min: 40, max: 150, floor: 0.8 }
const DAGSUTMANING_OPT_SCALE = { min: 16, max: 70, floor: 0.76 }

// --- Rundans tillstånd -------------------------------------------------------
let dagsutmaningSet = []          // dagens tio frågor, i dagens ordning
let dagsutmaningIdx = 0
let dagsutmaningCurrent = null
let dagsutmaningAnswered = 0
let dagsutmaningCorrect = 0
let dagsutmaningStreak = 0        // rätt i rad INOM rundan
let dagsutmaningBestStreak = 0
let dagsutmaningMissed = []       // { prompt, correct, chosen }
let dagsutmaningStartTime = 0
let dagsutmaningLocked = false
let dagsutmaningRunning = false
let dagsutmaningIsReplay = false  // ämnet redan klarat i dag → räknas inte
let dagsutmaningDate = ''         // datumet rundan spelas för (YYYY-MM-DD)
let dagsutmaningName = 'Spelare'
let dagsutmaningTopic = ''
let dagsutmaningPraiseTimer = null
let dagsutmaningAdvanceTimer = null
let dagsutmaningNextTimer = null

// ============================================================================
// Lagring — eget fack med minnesfallback (privat läge eller full kvot får inte
// krascha spelet, bara tappa historiken).
// ============================================================================
let dagsutmaningMemoryScores = null
let dagsutmaningMemoryState = null

function getDagsutmaningScores(){
  if(dagsutmaningMemoryScores) return dagsutmaningMemoryScores
  try{
    const raw = JSON.parse(localStorage.getItem(DAGSUTMANING_SCORES_KEY) || '[]')
    return Array.isArray(raw) ? raw : []
  }catch(e){ return dagsutmaningMemoryScores || [] }
}

function saveDagsutmaningScores(scores){
  try{ localStorage.setItem(DAGSUTMANING_SCORES_KEY, JSON.stringify(scores)); dagsutmaningMemoryScores = null }
  catch(e){ dagsutmaningMemoryScores = scores; warnStorageUnavailable() }
}

// Svit-tillståndet är lägets själva behållning och lever i ett EGET fack, skilt
// från resultatlistan: rensar man topplistan ska man inte förlora sin svit.
//   { version, streak, best, lastDate, done: { 'YYYY-MM-DD': [topic, …] } }
function defaultDagsutmaningState(){
  return { version: 1, streak: 0, best: 0, lastDate: '', done: {} }
}

function getDagsutmaningState(){
  if(dagsutmaningMemoryState) return dagsutmaningMemoryState
  try{
    const raw = JSON.parse(localStorage.getItem(DAGSUTMANING_STATE_KEY) || 'null')
    if(!raw || typeof raw !== 'object') return defaultDagsutmaningState()
    return {
      version: 1,
      streak: Number(raw.streak) || 0,
      best: Number(raw.best) || 0,
      lastDate: typeof raw.lastDate === 'string' ? raw.lastDate : '',
      done: (raw.done && typeof raw.done === 'object') ? raw.done : {}
    }
  }catch(e){ return dagsutmaningMemoryState || defaultDagsutmaningState() }
}

function saveDagsutmaningState(state){
  try{ localStorage.setItem(DAGSUTMANING_STATE_KEY, JSON.stringify(state)); dagsutmaningMemoryState = null }
  catch(e){ dagsutmaningMemoryState = state; warnStorageUnavailable() }
}

// ============================================================================
// Datum — LOKAL tid, aldrig UTC
// ============================================================================
// toISOString() ger UTC, och i svensk sommartid betyder det att "dagens" set
// skulle bytas klockan 02:00 och att en runda spelad 23:30 skulle bokföras på
// nästa dag. Dygnet ska följa spelarens egen kalender.
function dagsutmaningDateKey(d){
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function dagsutmaningToday(){ return dagsutmaningDateKey(new Date()) }

function dagsutmaningParse(key){
  const [y, m, d] = String(key).split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

// Dagar bakåt/framåt från ett datum, via Date så att månadsskiften och
// sommartid sköts av kalendern i stället för av aritmetik på sekunder.
function dagsutmaningShift(key, delta){
  const d = dagsutmaningParse(key)
  d.setDate(d.getDate() + delta)
  return dagsutmaningDateKey(d)
}

// Millisekunder till midnatt lokal tid — nedräkningen till nästa utmaning.
function dagsutmaningMsToMidnight(){
  const now = new Date()
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0)
  return Math.max(0, midnight.getTime() - now.getTime())
}

function dagsutmaningDateLabel(key){
  const d = dagsutmaningParse(key)
  const wd = DAGSUTMANING_WEEKDAY_NAMES[(d.getDay() + 6) % 7]
  return `${wd} ${d.getDate()} ${DAGSUTMANING_MONTHS[d.getMonth()]}`
}

// "7 tim 12 min" / "12 min" / "mindre än en minut".
function dagsutmaningFormatUntil(ms){
  const totalMin = Math.floor(ms / 60000)
  if(totalMin < 1) return 'mindre än en minut'
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  if(h <= 0) return `${m} min`
  return m > 0 ? `${h} tim ${m} min` : `${h} tim`
}

// ============================================================================
// Dagens set — deterministiskt ur datumet
// ============================================================================
// FNV-1a: kort, stabil och beroende av varje tecken, så att "2026-07-26" och
// "2026-07-27" hamnar långt ifrån varandra i seedrymden.
function dagsutmaningHash(str){
  let h = 2166136261
  for(let i = 0; i < str.length; i++){
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

// mulberry32 — en liten, snabb PRNG med bra fördelning. Poängen är att den är
// SEEDAD: Math.random() hade gett ett nytt set vid varje sidladdning, och då
// vore "dagens utmaning" bara ett vanligt quiz med ett annat namn.
function dagsutmaningRng(seed){
  let a = seed >>> 0
  return function(){
    a = (a + 0x6D2B79F5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Fisher–Yates med given slumpkälla. Rör inte inskickad lista.
function dagsutmaningShuffleWith(list, rnd){
  const a = list.slice()
  for(let i = a.length - 1; i > 0; i--){
    const j = Math.floor(rnd() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Ämnets spelbara frågor. Placeholders, uteslutna och bildfrågor utelämnas –
// bilden ÄR frågan och kräver bildregistret. Listan sorteras på topic|id, så
// att setet blir detsamma oavsett i vilken ordning filerna råkade läsas in.
function buildDagsutmaningPool(topic, lens){
  const flags = loadFlags()
  const pool = []
  const seen = new Set()
  for(const q of allQuestions){
    if(q.type !== 'mc' && q.type !== 'tf') continue
    if(q.image) continue
    if(q.source && String(q.source).toLowerCase() === 'placeholder') continue
    if(/^ph\d{3}$/.test(String(q.id))) continue
    if(!q.prompt || !q.correct) continue
    if(!Array.isArray(q.distractors) || q.distractors.length === 0) continue
    if(flags[q.id] && flags[q.id].excluded) continue
    if(!topicMatchesSelection(q, topic, lens)) continue
    const key = `${q.topic}|${q.id}`
    if(seen.has(key)) continue      // samma fråga kan nås via flera ämnesvägar
    seen.add(key)
    pool.push(q)
  }
  pool.sort((a, b) => (`${a.topic}|${a.id}`).localeCompare(`${b.topic}|${b.id}`, 'sv'))
  return pool
}

// Dagens set: samma frågor, i samma ordning, hela dygnet.
function pickDagsutmaningSet(pool, dateKey, topic){
  const rnd = dagsutmaningRng(dagsutmaningHash(`${dateKey}|${topic}`))
  return dagsutmaningShuffleWith(pool, rnd).slice(0, Math.min(DAGSUTMANING_SIZE, pool.length))
}

// Alternativens ordning måste vara lika låst som frågornas — annars är det inte
// samma utmaning när man kommer tillbaka senare på dagen. Egen seed per fråga,
// så att ordningen inte hänger på vilken plats i setet frågan råkar ha.
function dagsutmaningChoicesFor(q, dateKey){
  if(q.type === 'tf') return ['Sant', 'Falskt']
  const rnd = dagsutmaningRng(dagsutmaningHash(`${dateKey}|${q.topic}|${q.id}`))
  return dagsutmaningShuffleWith([q.correct, ...q.distractors], rnd)
}

// ============================================================================
// Sviten
// ============================================================================
function dagsutmaningDoneDays(state){
  return Object.keys((state || getDagsutmaningState()).done || {}).sort()
}

function dagsutmaningTopicDoneToday(topic, state){
  const s = state || getDagsutmaningState()
  const today = dagsutmaningToday()
  return Array.isArray(s.done[today]) && s.done[today].includes(topic)
}

// Har spelaren kört läget förut? Avgör om förklaringsrutan fälls upp: den som
// redan kan spelet ska inte behöva stänga samma text varje dag.
function hasPlayedDagsutmaning(){
  const s = getDagsutmaningState()
  return !!s.lastDate || dagsutmaningDoneDays(s).length > 0
}

// Sviten uppdateras EN gång per dag, första gången dagen klaras – oavsett i
// vilket ämne. Returnerar { streak, best, prevBest, isNewDay, milestone }.
function registerDagsutmaningDay(topic){
  const state = getDagsutmaningState()
  const today = dagsutmaningToday()
  const prevBest = state.best || 0
  const isNewDay = !Array.isArray(state.done[today]) || state.done[today].length === 0

  if(isNewDay){
    state.streak = state.lastDate === dagsutmaningShift(today, -1) ? (state.streak || 0) + 1 : 1
    state.lastDate = today
    state.best = Math.max(prevBest, state.streak)
  }

  const list = Array.isArray(state.done[today]) ? state.done[today] : []
  if(!list.includes(topic)) list.push(topic)
  state.done[today] = list

  // Håll historiken kort – vaneraden visar sju dagar, resten är statistik.
  const cutoff = dagsutmaningShift(today, -DAGSUTMANING_HISTORY_DAYS)
  Object.keys(state.done).forEach(d => { if(d < cutoff) delete state.done[d] })

  saveDagsutmaningState(state)
  return {
    streak: state.streak,
    best: state.best,
    prevBest,
    isNewDay,
    milestone: isNewDay && DAGSUTMANING_MILESTONES.includes(state.streak) ? state.streak : 0
  }
}

// Sviten som den ser ut JUST NU, utan att skriva något. En svit som inte rörts
// sedan i förrgår är bruten och ska visas som 0, inte som gårdagens siffra.
function currentDagsutmaningStreak(state){
  const s = state || getDagsutmaningState()
  const today = dagsutmaningToday()
  if(!s.lastDate) return 0
  if(s.lastDate === today || s.lastDate === dagsutmaningShift(today, -1)) return s.streak || 0
  return 0
}

// ============================================================================
// Spelkänsla: skala, ljud, haptik
// ============================================================================
function dagsutmaningTextScale(text, cfg){
  const len = (text || '').length
  if(len <= cfg.min) return 1
  const t = Math.min(1, (len - cfg.min) / (cfg.max - cfg.min))
  return 1 - t * (1 - cfg.floor)
}

// Ljudet kommer ur den DELADE basen i app.js (playTone/streakTone/hapticPulse)
// och styrs av den befintliga "Ljudeffekter"-bocken i Inställningar. Läget har
// varken egen AudioContext eller egen inställning.
function dagsutmaningTone(kind, streak){
  if(kind === 'right'){ playTone(streakTone(streak)); return }
  if(kind === 'wrong'){ playTone(220, true); return }
  if(kind === 'praise'){ playTone([880, 1174.66]); return }
  if(kind === 'streak'){ playTone([659.25, 880, 1174.66, 1318.51]); return }
  if(kind === 'end'){ playTone([523.25, 659.25, 783.99]) }
}

// ============================================================================
// Start
// ============================================================================
async function startDagsutmaning(){
  dagsutmaningName = el('playerName').value.trim() || 'Spelare'
  dagsutmaningTopic = el('topic').value
  dagsutmaningDate = dagsutmaningToday()

  const lens = await loadPoolForTopic(dagsutmaningTopic)
  const pool = buildDagsutmaningPool(dagsutmaningTopic, lens)
  if(pool.length < DAGSUTMANING_MIN_POOL){
    alert('Det här ämnet har för få flervals- eller sant/falskt-frågor för en dagsutmaning. Välj ett annat ämne.')
    return
  }

  dagsutmaningSet = pickDagsutmaningSet(pool, dagsutmaningDate, dagsutmaningTopic)
  dagsutmaningIdx = 0
  dagsutmaningCurrent = null
  dagsutmaningAnswered = 0
  dagsutmaningCorrect = 0
  dagsutmaningStreak = 0
  dagsutmaningBestStreak = 0
  dagsutmaningMissed = []
  dagsutmaningLocked = false
  dagsutmaningRunning = true
  dagsutmaningIsReplay = dagsutmaningTopicDoneToday(dagsutmaningTopic)
  dagsutmaningStartTime = Date.now()

  const label = topicLabelFor(dagsutmaningTopic).replace(/\s*\([^)]*\)\s*$/, '')
  el('dagsutmaningPlayerLabel').textContent = dagsutmaningName
  el('dagsutmaningMeta').textContent = `${label} · ${dagsutmaningDateLabel(dagsutmaningDate)}`

  const replayChip = el('dagsutmaningReplayChip')
  if(replayChip) replayChip.classList.toggle('hidden', !dagsutmaningIsReplay)

  el('setup').classList.add('hidden')
  el('highscores').classList.add('hidden')
  el('result').classList.add('hidden')
  el('quiz').classList.add('hidden')
  el('flashcards').classList.add('hidden')
  el('matcha')?.classList.add('hidden')
  el('leitner')?.classList.add('hidden')
  el('tidsjakt')?.classList.add('hidden')
  el('dagsutmaningFinished').classList.add('hidden')

  const intro = el('dagsutmaningIntro')
  intro.classList.remove('hidden')
  // Fälls upp automatiskt för den som aldrig spelat: en daglig utmaning med en
  // svit förklarar sig inte själv, och den som inte förstår varför man ska
  // komma tillbaka i morgon kommer inte tillbaka i morgon.
  intro.open = !hasPlayedDagsutmaning()

  el('dagsutmaningPlay').classList.remove('hidden')
  el('dagsutmaningFooter').classList.remove('hidden')
  el('dagsutmaning').classList.remove('hidden')

  clearDagsutmaningNextTimer()
  hideDagsutmaningPraise()
  updateDagsutmaningMeter()
  updateDagsutmaningScoreBadge(false)
  updateDagsutmaningStreakChip()
  renderDagsutmaningWeek()
  showDagsutmaningQuestion()
  window.scrollTo({ top: 0 })
}

// ============================================================================
// Frågevyn
// ============================================================================
function showDagsutmaningQuestion(){
  const q = dagsutmaningSet[dagsutmaningIdx]
  if(!q){ finishDagsutmaning(); return }
  dagsutmaningCurrent = q
  dagsutmaningLocked = false

  const promptEl = el('dagsutmaningPrompt')
  promptEl.textContent = q.prompt
  promptEl.style.setProperty('--prompt-scale', dagsutmaningTextScale(q.prompt, DAGSUTMANING_PROMPT_SCALE).toFixed(3))

  const box = el('dagsutmaningChoices')
  box.innerHTML = ''
  const choices = dagsutmaningChoicesFor(q, dagsutmaningDate)
  // Sant/falskt får dela en rad; fler alternativ läggs i 2×2-rutnät.
  box.classList.toggle('two', choices.length === 2)
  choices.forEach((text, i) => {
    const b = document.createElement('button')
    b.type = 'button'
    b.className = 'dagsutmaning-choice'
    b.textContent = text
    b.style.setProperty('--opt-scale', dagsutmaningTextScale(text, DAGSUTMANING_OPT_SCALE).toFixed(3))
    b.dataset.choice = text
    b.dataset.idx = String(i + 1)
    b.addEventListener('click', () => onDagsutmaningAnswer(b, text))
    box.appendChild(b)
  })

  // Nytt kort glider in från höger – en ström av kort, inte text som byts ut
  // på stället. Klassen sätts i nästa frame så att transitionen startar från
  // utgångsläget.
  const card = el('dagsutmaningCard')
  if(card && !reducedMotionPreferred()){
    card.classList.remove('in')
    void card.offsetWidth
    card.classList.add('enter')
    requestAnimationFrame(() => { card.classList.remove('enter'); card.classList.add('in') })
  }

  // Nästa-knappen behövs bara efter ett fel svar (rätt svar går vidare av sig
  // självt), så den finns inte i vyn förrän den fyller en funktion.
  const next = el('dagsutmaningNextBtn')
  if(next){ next.classList.add('hidden'); next.disabled = true }

  el('dagsutmaningCounter').textContent = `Fråga ${dagsutmaningIdx + 1} av ${dagsutmaningSet.length}`
  // Krymp vyn tills fråga + alternativ + sidfot ryms på skärmen (app.js).
  if(typeof fitActiveView === 'function') fitActiveView()
}

function showDagsutmaningPraise(text, tone){
  const p = el('dagsutmaningPraise')
  if(!p) return
  p.textContent = text
  p.classList.remove('hidden')
  p.classList.toggle('gold', tone === 'gold')
  p.classList.remove('in')
  void p.offsetWidth      // tvinga reflow så animationen kan köras om
  p.classList.add('in')
  if(dagsutmaningPraiseTimer) clearTimeout(dagsutmaningPraiseTimer)
  dagsutmaningPraiseTimer = setTimeout(hideDagsutmaningPraise, DAGSUTMANING_PRAISE_MS)
}

function hideDagsutmaningPraise(){
  const p = el('dagsutmaningPraise')
  if(p){ p.classList.add('hidden'); p.classList.remove('in', 'gold') }
  dagsutmaningPraiseTimer = null
}

// ============================================================================
// Svar (§13.1 punkt 2, i den form läget kräver)
// ============================================================================
// Tidsjakt fick ETT snabbt steg eftersom klockan gick; Leitner fick tre steg om
// 260 ms. Här finns ingen klocka, och därför får payoffen andas — men bara när
// det finns något att titta på. Rätt svar: kvitto och vidare. Fel svar: facit
// ligger kvar tills spelaren själv trycker Nästa. Att auto-vidare även på fel
// hade betytt att den enda fråga man faktiskt behövde läsa var den man inte
// hann läsa.
function onDagsutmaningAnswer(btn, choice){
  if(dagsutmaningLocked || !dagsutmaningRunning) return
  const q = dagsutmaningCurrent
  if(!q) return
  dagsutmaningLocked = true

  const ok = choice === q.correct
  btn.classList.add('chosen')
  hapticPulse(10)   // kvitto på själva trycket, före facit

  dagsutmaningAnswered++
  if(ok){
    dagsutmaningCorrect++
    dagsutmaningStreak++
    dagsutmaningBestStreak = Math.max(dagsutmaningBestStreak, dagsutmaningStreak)
  } else {
    dagsutmaningStreak = 0
    dagsutmaningMissed.push({ prompt: q.prompt, correct: q.correct, chosen: choice })
  }

  Array.from(el('dagsutmaningChoices').children).forEach(b => {
    b.disabled = true
    // markAnswerBtn (app.js) lägger till ✓/✗ OCH dold skärmläsartext, så att
    // utfallet inte förmedlas med enbart färg (WCAG 1.4.1).
    if(b.dataset.choice === q.correct) markAnswerBtn(b, true)
    else if(b === btn){ markAnswerBtn(b, false); b.classList.add('shake') }
  })

  dagsutmaningTone(ok ? 'right' : 'wrong', dagsutmaningStreak)
  hapticPulse(ok ? 12 : [10, 35, 10])
  updateDagsutmaningMeter()
  updateDagsutmaningScoreBadge(ok)

  // Beröm vid delmål — konkret, inte bara siffror. Halvvägs felfritt är värt
  // ett eget omnämnande: det är där man börjar tro att hela setet går att ta.
  const halfway = dagsutmaningSet.length >= 6 && dagsutmaningAnswered === Math.ceil(dagsutmaningSet.length / 2)
  if(ok && dagsutmaningStreak > 0 && dagsutmaningStreak % DAGSUTMANING_STREAK_STEP === 0){
    showDagsutmaningPraise(`🔥 ${dagsutmaningStreak} rätt i rad!`)
    dagsutmaningTone('praise')
    hapticPulse([12, 30, 12])
  } else if(ok && halfway && dagsutmaningCorrect === dagsutmaningAnswered){
    showDagsutmaningPraise('🎯 Halvvägs, felfritt så här långt!')
    dagsutmaningTone('praise')
  }

  if(dagsutmaningAdvanceTimer){ clearTimeout(dagsutmaningAdvanceTimer); dagsutmaningAdvanceTimer = null }
  if(ok){
    // Fördröjningen är INFORMATION (tiden ✓ syns), inte rörelse, och nollas
    // därför aldrig vid prefers-reduced-motion — §13.1 punkt 8.
    dagsutmaningAdvanceTimer = setTimeout(advanceDagsutmaning, DAGSUTMANING_REVEAL_MS)
  } else {
    const next = el('dagsutmaningNextBtn')
    if(next){
      next.classList.remove('hidden')
      next.disabled = false
      next.textContent = dagsutmaningIdx + 1 >= dagsutmaningSet.length ? 'Se resultat' : 'Nästa'
    }
  }
}

function advanceDagsutmaning(){
  dagsutmaningAdvanceTimer = null
  if(!dagsutmaningRunning) return
  dagsutmaningIdx++
  if(dagsutmaningIdx >= dagsutmaningSet.length){ finishDagsutmaning(); return }
  showDagsutmaningQuestion()
}

// Nästa-knappen finns bara efter ett fel svar; den ska inte gå att trycka på
// medan en fråga är obesvarad.
function onDagsutmaningNext(){
  if(!dagsutmaningRunning || !dagsutmaningLocked) return
  if(dagsutmaningAdvanceTimer){ clearTimeout(dagsutmaningAdvanceTimer); dagsutmaningAdvanceTimer = null }
  advanceDagsutmaning()
}

// ============================================================================
// Mätare (§13.1 punkt 3) — två nivåer, för spelet spänner över dagar
// ============================================================================
// Rundans mätare (delad .gm-*-bas) visar hur långt man kommit i dagens tio.
function updateDagsutmaningMeter(){
  const fill = el('dagsutmaningProgressFill')
  const total = dagsutmaningSet.length || DAGSUTMANING_SIZE
  if(fill) fill.style.width = Math.min(100, (dagsutmaningAnswered / total) * 100).toFixed(1) + '%'
}

function updateDagsutmaningScoreBadge(bump){
  const badge = el('dagsutmaningScoreBadge')
  if(!badge) return
  badge.textContent = `Rätt: ${dagsutmaningCorrect}`
  if(bump){
    badge.classList.remove('bump')
    void badge.offsetWidth
    badge.classList.add('bump')
  }
}

// Vanemätaren: den riktiga framstegsmätaren i det här läget. Sju dagar bakåt,
// en prick per dag, med veckodagens initial under. Raden skyltar alltså med
// sin egen regel — man ser att det handlar om dagar i följd utan att läsa
// förklaringen (§13.1: gör spelplanen självförklarande).
function renderDagsutmaningWeek(justCompletedToday){
  const wrap = el('dagsutmaningWeek')
  if(!wrap) return
  const state = getDagsutmaningState()
  const today = dagsutmaningToday()
  const days = dagsutmaningDoneDays(state)
  const first = days.length ? days[0] : today

  wrap.innerHTML = ''
  for(let i = DAGSUTMANING_WEEK - 1; i >= 0; i--){
    const key = dagsutmaningShift(today, -i)
    const d = dagsutmaningParse(key)
    const done = Array.isArray(state.done[key]) && state.done[key].length > 0
    const cell = document.createElement('span')
    cell.className = 'dagsutmaning-day'
    // Dagar innan man började spela är inte missade – de är bara tomma.
    if(done) cell.classList.add('done')
    else if(key === today) cell.classList.add('today')
    else if(key < first) cell.classList.add('none')
    else cell.classList.add('missed')
    if(done && key === today && justCompletedToday) cell.classList.add('pop')

    const dot = document.createElement('span')
    dot.className = 'dagsutmaning-day-dot'
    dot.setAttribute('aria-hidden', 'true')
    dot.textContent = done ? '✓' : ''
    const lbl = document.createElement('span')
    lbl.className = 'dagsutmaning-day-label'
    lbl.setAttribute('aria-hidden', 'true')
    lbl.textContent = DAGSUTMANING_WEEKDAY_INITIALS[(d.getDay() + 6) % 7]
    // Prickarna är grafik; skärmläsaren får dagen i klartext i stället.
    const sr = document.createElement('span')
    sr.className = 'sr-only'
    sr.textContent = `${dagsutmaningDateLabel(key)}: ${done ? 'klarad' : key === today ? 'inte klarad än' : 'ej spelad'}. `
    cell.append(dot, lbl, sr)
    wrap.appendChild(cell)
  }
}

function updateDagsutmaningStreakChip(){
  const chip = el('dagsutmaningStreakChip')
  if(!chip) return
  const streak = currentDagsutmaningStreak()
  if(streak < 1){ chip.classList.add('hidden'); return }
  chip.classList.remove('hidden')
  chip.textContent = `🔥 ${streak} ${streak === 1 ? 'dag' : 'dagar'} i rad`
}

// ============================================================================
// Slutet (§13.1 punkt 5)
// ============================================================================
function animateDagsutmaningRing(pct){
  const label = el('dagsutmaningRingPct')
  if(label) label.textContent = pct + ' %'
  const ring = el('dagsutmaningRingProgress')
  if(!ring) return
  const clamped = Math.max(0, Math.min(100, pct))
  const offset = GM_RING_CIRCUMFERENCE * (1 - clamped / 100)
  ring.style.strokeDashoffset = String(GM_RING_CIRCUMFERENCE)
  requestAnimationFrame(() => { ring.style.strokeDashoffset = String(offset) })
}

function renderDagsutmaningMissed(){
  const wrap = el('dagsutmaningMissedWrap')
  const list = el('dagsutmaningMissed')
  const more = el('dagsutmaningMissedMore')
  if(!wrap || !list) return
  list.innerHTML = ''
  if(!dagsutmaningMissed.length){
    wrap.classList.add('hidden')
    return
  }
  wrap.classList.remove('hidden')
  dagsutmaningMissed.slice(0, DAGSUTMANING_MISSED_SHOWN).forEach(m => {
    const li = document.createElement('li')
    const q = document.createElement('span')
    q.className = 'sm-q'
    q.textContent = m.prompt
    const a = document.createElement('span')
    a.className = 'sm-a'
    a.textContent = m.correct
    li.append(q, a)
    list.appendChild(li)
  })
  const rest = dagsutmaningMissed.length - DAGSUTMANING_MISSED_SHOWN
  if(more){
    more.classList.toggle('hidden', rest <= 0)
    if(rest > 0) more.textContent = `… och ${rest} till.`
  }
}

// Nedräkningen till nästa utmaning. Knappheten är mekaniken: när dagens set är
// slut ska nästa mål vara i morgon, inte "spela igen".
function updateDagsutmaningNextText(result){
  const p = el('dagsutmaningNextText')
  if(!p) return
  const kvar = dagsutmaningFormatUntil(dagsutmaningMsToMidnight())
  if(dagsutmaningIsReplay){
    p.textContent = `Omspel – det här resultatet räknades inte. Ny utmaning om ${kvar}.`
    return
  }
  // Raden ska peka FRAMÅT. Sviten som den är nu står redan på egen rad ovanför
  // (dagsutmaningStreakText); att upprepa den här gör slutet pratigt och
  // skjuter ned den missade-listan, som är det man faktiskt ska läsa.
  const streak = result ? result.streak : currentDagsutmaningStreak()
  p.textContent = streak >= 1
    ? `Ny utmaning om ${kvar}. Kom tillbaka i morgon så blir sviten ${streak + 1} dagar.`
    : `Ny utmaning om ${kvar}.`
}

function startDagsutmaningNextTimer(result){
  clearDagsutmaningNextTimer()
  updateDagsutmaningNextText(result)
  dagsutmaningNextTimer = setInterval(() => updateDagsutmaningNextText(result), DAGSUTMANING_NEXT_TICK_MS)
}

function clearDagsutmaningNextTimer(){
  if(dagsutmaningNextTimer){ clearInterval(dagsutmaningNextTimer); dagsutmaningNextTimer = null }
}

function finishDagsutmaning(){
  if(!dagsutmaningRunning) return
  dagsutmaningRunning = false
  dagsutmaningLocked = true
  if(dagsutmaningAdvanceTimer){ clearTimeout(dagsutmaningAdvanceTimer); dagsutmaningAdvanceTimer = null }
  if(dagsutmaningPraiseTimer){ clearTimeout(dagsutmaningPraiseTimer); dagsutmaningPraiseTimer = null }
  hideDagsutmaningPraise()

  const durationMs = Math.max(0, Date.now() - dagsutmaningStartTime)
  const total = dagsutmaningSet.length
  const pct = total ? Math.round((dagsutmaningCorrect / total) * 100) : 0

  // Sviten skrivs FÖRE resultattexten men bara för en riktig omgång: ett omspel
  // får varken flytta sviten eller hamna i topplistan.
  const result = dagsutmaningIsReplay ? null : registerDagsutmaningDay(dagsutmaningTopic)

  el('dagsutmaningPlay').classList.add('hidden')
  el('dagsutmaningFooter').classList.add('hidden')
  el('dagsutmaningIntro').classList.add('hidden')   // reglerna är inte intressanta på resultatskärmen
  el('dagsutmaningFinished').classList.remove('hidden')

  el('dagsutmaningDoneText').textContent =
    `Klart! ${dagsutmaningCorrect} av ${total} rätt på dagens utmaning.`

  // Bara nyckeltal som faktiskt hände — "1 rätt i rad" är ingen prestation.
  // Flamman är reserverad för DAGSsviten: står "🔥 bästa svit 9" bredvid
  // "🔥 Dag 1 i rad" ser det ut som två mått på samma sak, och det ena är
  // lägets identitet medan det andra bara gäller den här rundan.
  const nyckeltal = []
  if(durationMs > 0) nyckeltal.push(`⏱ ${formatDuration(durationMs)}`)
  if(dagsutmaningBestStreak > 1) nyckeltal.push(`🎯 ${dagsutmaningBestStreak} rätt i rad som mest`)
  if(dagsutmaningCorrect === total && total > 0) nyckeltal.push('✨ felfritt')
  el('dagsutmaningStatsText').textContent = nyckeltal.join(' · ')

  // Sviten är lägets riktiga poäng och får därför sin egen rad, inte en siffra
  // bland nyckeltalen.
  // Raden visar sviten även efter ett omspel — den är ju kvar, och att i stället
  // skriva "Omspel" här hade sagt samma sak som raden under (som redan
  // förklarar att resultatet inte räknades). Två rader ska göra två saker.
  const streakLine = el('dagsutmaningStreakText')
  if(streakLine){
    const visadSvit = dagsutmaningIsReplay ? currentDagsutmaningStreak() : result.streak
    if(!dagsutmaningIsReplay && visadSvit === 1){
      streakLine.textContent = '🔥 Dag 1 i rad. Sviten har börjat.'
    } else if(visadSvit > 1){
      streakLine.textContent = `🔥 ${visadSvit} dagar i rad!`
    } else {
      streakLine.textContent = visadSvit === 1 ? '🔥 1 dag i rad.' : ''
    }
  }

  // Rekordet i det här läget är den LÄNGSTA sviten, inte den bästa procenten:
  // det är uthålligheten läget mäter.
  const isRecord = !!result && result.isNewDay && result.streak > 1 && result.streak > result.prevBest
  const badge = el('dagsutmaningRecordBadge')
  if(badge){
    badge.classList.toggle('hidden', !isRecord)
    if(isRecord) badge.textContent = `🏆 Längsta svit hittills: ${result.streak} dagar`
  }

  renderDagsutmaningWeek(!!result && result.isNewDay)
  updateDagsutmaningStreakChip()
  animateDagsutmaningRing(pct)
  renderDagsutmaningMissed()
  startDagsutmaningNextTimer(result)

  if(result && result.milestone){
    showDagsutmaningPraise(`🎉 ${result.milestone} dagar i rad — det här är en vana nu!`, 'gold')
    dagsutmaningTone('streak')
    hapticPulse([14, 40, 14, 40, 20])
  } else {
    dagsutmaningTone('end')
    hapticPulse([18, 60, 18])
  }

  if(!dagsutmaningIsReplay){
    try{ saveDagsutmaningScore(durationMs) }catch(e){ console.error('saveDagsutmaningScore misslyckades:', e) }
  }
  if(typeof updateDagsutmaningButton === 'function') updateDagsutmaningButton()
  window.scrollTo({ top: 0 })
}

function saveDagsutmaningScore(durationMs){
  const scores = getDagsutmaningScores()
  scores.push({
    name: dagsutmaningName,
    topic: dagsutmaningTopic,
    topicLabel: topicLabelFor(dagsutmaningTopic),
    correct: dagsutmaningCorrect,
    total: dagsutmaningSet.length,
    streak: currentDagsutmaningStreak(),
    day: dagsutmaningDate,
    durationMs,
    date: new Date().toISOString()
  })
  scores.sort((a, b) => new Date(b.date) - new Date(a.date))
  saveDagsutmaningScores(scores.slice(0, 50))
}

// ============================================================================
// Avbryt / avsluta
// ============================================================================
function cancelDagsutmaning(){
  if(confirm('Avbryta dagens utmaning? Den räknas inte som klarad, men frågorna är kvar hela dagen.')){
    dagsutmaningRunning = false
    if(dagsutmaningAdvanceTimer){ clearTimeout(dagsutmaningAdvanceTimer); dagsutmaningAdvanceTimer = null }
    if(dagsutmaningPraiseTimer){ clearTimeout(dagsutmaningPraiseTimer); dagsutmaningPraiseTimer = null }
    clearDagsutmaningNextTimer()
    el('dagsutmaning').classList.add('hidden')
    el('setup').classList.remove('hidden')
  }
}

function quitDagsutmaning(){
  clearDagsutmaningNextTimer()
  el('dagsutmaning').classList.add('hidden')
  el('setup').classList.remove('hidden')
}

// ============================================================================
// Topplistesegmentet (i #highscores)
// ============================================================================
function renderDagsutmaningScores(){
  const ol = el('scoreList-dagsutmaning')
  if(!ol) return
  const emptyP = ol.parentElement.querySelector('.hs-empty')
  const scores = getDagsutmaningScores()
  const pctOf = s => (s.total > 0 ? s.correct / s.total : 0)
  const list = [...scores].sort((a, b) => {
    if(pctOf(b) !== pctOf(a)) return pctOf(b) - pctOf(a)
    if((b.streak || 0) !== (a.streak || 0)) return (b.streak || 0) - (a.streak || 0)
    return (a.durationMs || Infinity) - (b.durationMs || Infinity)
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
    const pct = s.total ? Math.round((s.correct / s.total) * 100) : 0
    li.append(
      mk('sr-rank', (i + 1) + '.'),
      mk('sr-name', s.name),
      mk('sr-topic', abbrev ? `(${abbrev}) ${label}` : label),
      mk('sr-score sr-lead', `${s.correct}/${s.total || DAGSUTMANING_SIZE}`),
      mk(pct < 75 ? 'sr-pct weak' : 'sr-pct', `${pct} %`),
      mk('sr-time', `🔥 ${s.streak || 0}`),
      mk('sr-date', new Date(s.date).toLocaleDateString('sv-SE'))
    )
    ol.appendChild(li)
  })
}

// Exporten tar med BÅDE resultatlistan och svit-tillståndet – en export utan
// sviten hade tappat det enda i läget som inte går att spela in igen.
function exportDagsutmaningScores(){
  const scores = getDagsutmaningScores()
  const state = getDagsutmaningState()
  if(!scores.length && !dagsutmaningDoneDays(state).length){
    alert('Det finns inget från Dagens utmaning att exportera än.')
    return
  }
  const payload = {
    type: DAGSUTMANING_EXPORT_TYPE,
    version: 1,
    exported: new Date().toISOString(),
    state,
    scores
  }
  downloadJsonBlob(payload, `anatomiquiz-dagsutmaning-${new Date().toISOString().slice(0, 10)}`)
}

function dagsutmaningScoreSignature(s){ return [s.date, s.name, s.topic, s.correct, s.total].join('|') }

// Slår ihop två svit-tillstånd: dagshistoriken är en union, och sviten räknas
// om ur den unionen i stället för att den största siffran vinner. Två enheter
// med var sin halva av veckan ska ge EN obruten svit, inte den längsta av två.
function mergeDagsutmaningState(local, incoming){
  const merged = defaultDagsutmaningState()
  merged.done = Object.assign({}, local.done || {})
  Object.keys((incoming && incoming.done) || {}).forEach(day => {
    const a = Array.isArray(merged.done[day]) ? merged.done[day] : []
    const b = Array.isArray(incoming.done[day]) ? incoming.done[day] : []
    merged.done[day] = [...new Set([...a, ...b])]
  })

  const days = Object.keys(merged.done).filter(d => (merged.done[d] || []).length > 0).sort()
  merged.lastDate = days.length ? days[days.length - 1] : ''

  // Längsta obrutna kedja i historiken, och den pågående kedjan fram till
  // sista dagen.
  let run = 0, best = 0
  days.forEach((d, i) => {
    run = (i > 0 && days[i - 1] === dagsutmaningShift(d, -1)) ? run + 1 : 1
    best = Math.max(best, run)
  })
  merged.streak = run
  merged.best = Math.max(best, local.best || 0, (incoming && incoming.best) || 0)
  return merged
}

function handleImportDagsutmaningScores(ev){
  const f = ev.target.files && ev.target.files[0]
  if(!f) return
  const reader = new FileReader()
  reader.onload = () => {
    try{
      const parsed = JSON.parse(reader.result)
      const incoming = Array.isArray(parsed) ? parsed
        : (parsed && parsed.type === DAGSUTMANING_EXPORT_TYPE && Array.isArray(parsed.scores)) ? parsed.scores
        : null
      if(!incoming){ alert('Fel format: filen ser inte ut som en exporterad fil från Dagens utmaning.'); return }
      const merged = getDagsutmaningScores()
      const seen = new Set(merged.map(dagsutmaningScoreSignature))
      let added = 0, skipped = 0
      incoming.forEach(s => {
        if(!s || typeof s.date !== 'string' || typeof s.correct !== 'number'){ skipped++; return }
        const sig = dagsutmaningScoreSignature(s)
        if(seen.has(sig)){ skipped++; return }
        seen.add(sig); merged.push(s); added++
      })
      merged.sort((a, b) => new Date(b.date) - new Date(a.date))
      saveDagsutmaningScores(merged.slice(0, 50))

      let dagar = 0
      if(!Array.isArray(parsed) && parsed.state && typeof parsed.state === 'object'){
        const before = dagsutmaningDoneDays().length
        saveDagsutmaningState(mergeDagsutmaningState(getDagsutmaningState(), parsed.state))
        dagar = dagsutmaningDoneDays().length - before
      }

      renderDagsutmaningScores()
      if(typeof updateDagsutmaningButton === 'function') updateDagsutmaningButton()
      alert(`Import klar. Tillagda resultat: ${added}. Hoppade över: ${skipped}.` +
        (dagar > 0 ? ` Nya dagar i sviten: ${dagar}.` : ''))
    }catch(e){ alert('Kunde inte läsa JSON: ' + e.message) }
  }
  reader.readAsText(f, 'utf-8')
  ev.target.value = ''
}

// Resultatlistan och sviten rensas var för sig: den som vill nolla topplistan
// menar sällan att hen vill kasta bort 40 dagars svit.
function clearDagsutmaningScoresFlow(){
  if(!confirm('Är du säker? Alla resultat från Dagens utmaning raderas permanent. Din svit (dagar i rad) påverkas inte.')) return
  localStorage.removeItem(DAGSUTMANING_SCORES_KEY)
  dagsutmaningMemoryScores = null
  renderDagsutmaningScores()
}

function clearDagsutmaningStreakFlow(){
  if(!confirm('Nollställa sviten? Alla dagar i rad och din längsta svit raderas permanent. Resultaten i topplistan påverkas inte.')) return
  localStorage.removeItem(DAGSUTMANING_STATE_KEY)
  dagsutmaningMemoryState = null
  if(typeof updateDagsutmaningButton === 'function') updateDagsutmaningButton()
}

// ============================================================================
// Uppkoppling (egen DOMContentLoaded, oberoende av app.js:s init)
// ============================================================================
// Läget rättar automatiskt och behöver därför MC- eller TF-frågor; knappen
// skuggas för rena flashcard-ämnen. Knappen bär dessutom sviten, så att man ser
// den innan man gått in i läget – det är det som gör en svit till en svit.
function updateDagsutmaningButton(){
  const cap = topicCapabilities()
  const b = el('startDagsutmaningBtn')
  if(b) b.disabled = !(cap.mc || cap.tf)

  const flame = el('dagsutmaningFlame')
  if(!flame) return
  const streak = currentDagsutmaningStreak()
  if(streak < 1){ flame.classList.add('hidden'); flame.textContent = ''; return }
  const doneToday = getDagsutmaningState().lastDate === dagsutmaningToday()
  flame.classList.remove('hidden')
  flame.classList.toggle('done', doneToday)
  // Bocken är en TEXTGLYF, inte ✅-emojin: emojin bär sin egen gröna platta och
  // blir grönt på grönt inuti den klarmarkerade brickan. ✓ ärver den vita
  // textfärgen och läses direkt.
  flame.textContent = `${doneToday ? '✓' : '🔥'} ${streak}`
  flame.setAttribute('aria-label',
    `${streak} ${streak === 1 ? 'dag' : 'dagar'} i rad${doneToday ? ', dagens utmaning är klar' : ', dagens utmaning är inte klar än'}`)
}

// Tangentbord på dator: 1–4 svarar, Enter går vidare efter ett fel svar.
// Rör bara den här vyn, och bara när inget textfält har fokus.
function onDagsutmaningKey(ev){
  const sec = el('dagsutmaning')
  if(!sec || sec.classList.contains('hidden')) return
  if(!dagsutmaningRunning) return
  const tag = (document.activeElement && document.activeElement.tagName) || ''
  if(tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
  if(dagsutmaningLocked){
    const next = el('dagsutmaningNextBtn')
    if((ev.key === 'Enter' || ev.key === ' ') && next && !next.disabled){ ev.preventDefault(); next.click() }
    return
  }
  const n = parseInt(ev.key, 10)
  if(!n || n < 1 || n > 9) return
  const btn = el('dagsutmaningChoices')?.children[n - 1]
  if(btn){ ev.preventDefault(); btn.click() }
}

document.addEventListener('DOMContentLoaded', () => {
  el('startDagsutmaningBtn')?.addEventListener('click', startDagsutmaning)
  el('dagsutmaningNextBtn')?.addEventListener('click', onDagsutmaningNext)
  el('dagsutmaningCancelBtn')?.addEventListener('click', cancelDagsutmaning)
  el('dagsutmaningRetryBtn')?.addEventListener('click', startDagsutmaning)
  el('dagsutmaningQuitBtn')?.addEventListener('click', quitDagsutmaning)
  el('exportScores-dagsutmaning')?.addEventListener('click', exportDagsutmaningScores)
  const imp = el('importScoresFile-dagsutmaning')
  if(imp) imp.addEventListener('change', handleImportDagsutmaningScores)
  el('importScoresBtn-dagsutmaning')?.addEventListener('click', () => imp?.click())
  el('clearScores-dagsutmaning')?.addEventListener('click', clearDagsutmaningScoresFlow)
  el('clearStreak-dagsutmaning')?.addEventListener('click', clearDagsutmaningStreakFlow)
  // Förklaringen fälls upp automatiskt första gången, och då krymper
  // fitActiveView() vyn för att få plats. Utan den här mätningen står vyn kvar
  // nedkrympt när man fäller ihop texten igen – mätningen sker annars bara när
  // en ny fråga renderas.
  el('dagsutmaningIntro')?.addEventListener('toggle', () => {
    if(typeof fitActiveView === 'function') fitActiveView()
  })
  document.addEventListener('keydown', onDagsutmaningKey)
  updateDagsutmaningButton()
})
