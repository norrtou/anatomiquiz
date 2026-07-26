/* =========================================================
   test_dagsutmaning.js — tester för spelläget "Dagens utmaning"
   =========================================================
   Körs med:  node scripts/test_dagsutmaning.js
   Avslutar med kod 0 när allt är grönt, annars 1.

   Ett minimalt DOM-skal gör att js/dagsutmaning.js kan köras och drivas på
   riktigt utan webbläsare – testerna träffar alltså den kod som faktiskt
   levereras, inte en kopia av logiken. app.js hjälpare (el, loadPoolForTopic,
   topicMatchesSelection, markAnswerBtn, playTone …) stubbas, eftersom de testas
   via quizet.

   KLOCKAN ÄR STYRBAR: Date, setInterval och setTimeout är stubbade. Det är inte
   en bekvämlighet här utan själva förutsättningen – lägets två bärande
   mekanismer är att setet byts vid MIDNATT och att sviten räknar DAGAR i rad.
   Ingen av dem går att testa utan att kunna flytta kalendern.

   Skalet modellerar DOM-trädet och händelserna, INTE layouten. Att vaneraden
   ser bra ut, att kortet glider in eller att texten ryms kan det omöjligt
   fånga – det kräver visuell kontroll i webbläsare (CLAUDE_REGLER §13.1).
   Dagsset, determinism, svitlogik, omspel, beröm, lagring och export/import
   fångar det däremot.

   Kör det här skriptet efter varje ändring i js/dagsutmaning.js.
   ========================================================= */

const fs = require('fs')
const path = require('path')
const vm = require('vm')

const ROOT = path.resolve(__dirname, '..')

// --- Minimalt DOM-skal -------------------------------------------------------
class El {
  constructor(tag){
    this.tagName = String(tag).toUpperCase()
    this.children = []
    this._class = new Set()
    this._attrs = {}
    this._listeners = {}
    this.dataset = {}
    this.style = { setProperty: (k, v) => { this.style[k] = v } }
    this._text = ''
    this.disabled = false
    this.value = ''
    this.checked = false
    this.open = false
    this.offsetWidth = 0
    this.classList = {
      add: (...c) => c.forEach(x => this._class.add(x)),
      remove: (...c) => c.forEach(x => this._class.delete(x)),
      contains: c => this._class.has(c),
      toggle: (c, on) => { if(on === undefined) on = !this._class.has(c); on ? this._class.add(c) : this._class.delete(c) }
    }
  }
  get className(){ return [...this._class].join(' ') }
  set className(v){ this._class = new Set(String(v).split(/\s+/).filter(Boolean)) }
  get textContent(){ return this.children.length ? this.children.map(c => c.textContent).join('') : this._text }
  set textContent(v){ this._text = String(v); this.children = [] }
  set innerHTML(v){ this.children = []; this._text = v === '' ? '' : String(v) }
  get innerHTML(){ return this._text }
  appendChild(c){ c.parent = this; this.children.push(c); return c }
  append(...cs){ cs.forEach(c => this.appendChild(c)) }
  get parentElement(){ return this.parent || null }
  setAttribute(k, v){ this._attrs[k] = String(v) }
  getAttribute(k){ return this._attrs[k] }
  addEventListener(t, fn){ (this._listeners[t] = this._listeners[t] || []).push(fn) }
  focus(){}
  click(){ (this._listeners.click || []).forEach(fn => fn.call(this, { preventDefault(){} })) }
  querySelector(sel){ return this.querySelectorAll(sel)[0] || null }
  querySelectorAll(sel){
    const want = sel.replace('.', '')
    const out = []
    const walk = n => n.children.forEach(c => { if(c._class.has(want)) out.push(c); walk(c) })
    walk(this)
    return out
  }
  hidden(){ return this._class.has('hidden') }
}

const nodes = {}
function node(id, extra){
  const e = new El('div')
  e.id = id
  Object.assign(e, extra || {})
  nodes[id] = e
  return e
}

;['setup', 'highscores', 'result', 'quiz', 'flashcards', 'matcha', 'leitner', 'tidsjakt',
  'dagsutmaning', 'dagsutmaningPlay', 'dagsutmaningFinished', 'dagsutmaningFooter',
  'dagsutmaningIntro', 'dagsutmaningPlayerLabel', 'dagsutmaningMeta',
  'dagsutmaningWeek', 'dagsutmaningStreakChip', 'dagsutmaningReplayChip',
  'dagsutmaningProgressFill', 'dagsutmaningScoreBadge', 'dagsutmaningPraise',
  'dagsutmaningCard', 'dagsutmaningPrompt', 'dagsutmaningChoices', 'dagsutmaningCounter',
  'dagsutmaningRingProgress', 'dagsutmaningRingPct', 'dagsutmaningDoneText',
  'dagsutmaningStatsText', 'dagsutmaningStreakText', 'dagsutmaningRecordBadge',
  'dagsutmaningNextText', 'dagsutmaningMissedWrap', 'dagsutmaningMissed',
  'dagsutmaningMissedMore', 'dagsutmaningNextBtn', 'dagsutmaningCancelBtn',
  'dagsutmaningRetryBtn', 'dagsutmaningQuitBtn', 'startDagsutmaningBtn',
  'dagsutmaningFlame', 'exportScores-dagsutmaning', 'importScoresBtn-dagsutmaning',
  'importScoresFile-dagsutmaning', 'clearScores-dagsutmaning',
  'clearStreak-dagsutmaning'].forEach(id => node(id))

// Element som är dolda redan i index.html måste vara dolda här också, annars
// testar skalet ett utgångsläge som inte finns i verkligheten.
;['dagsutmaningFinished', 'dagsutmaningPraise', 'dagsutmaningStreakChip',
  'dagsutmaningReplayChip', 'dagsutmaningRecordBadge', 'dagsutmaningMissedWrap',
  'dagsutmaningMissedMore', 'dagsutmaningNextBtn', 'dagsutmaningFlame'].forEach(id => nodes[id].classList.add('hidden'))

// Topplistesegmentet: <ol> med en .hs-empty-syskonrad i en förälder.
const hsWrap = new El('div')
const scoreList = node('scoreList-dagsutmaning')
const hsEmpty = new El('p'); hsEmpty.className = 'hs-empty'
hsWrap.appendChild(scoreList); hsWrap.appendChild(hsEmpty)
scoreList.parent = hsWrap

node('playerName', { value: 'Testare' })
node('soundEnabled', { checked: false })
node('topic', { value: 'osteologi_ben' })

// --- Lagring ----------------------------------------------------------------
const store = {}
const localStorage = {
  getItem: k => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v) },
  removeItem: k => { delete store[k] }
}

// --- Styrbar klocka (lokal tid) ---------------------------------------------
// Testet kör med TZ=UTC-oberoende logik: modulen använder getFullYear/getMonth/
// getDate, alltså LOKAL tid. FakeDate ärver systemets tidszon, vilket är precis
// vad som ska testas — datumnyckeln ska följa spelarens kalender, inte UTC.
const RealDate = Date
let NOW = new RealDate(2026, 6, 26, 10, 0, 0).getTime()   // sö 26 juli 2026, 10:00 lokal tid
function FakeDate(...args){
  return args.length === 0 ? new RealDate(NOW) : new RealDate(...args)
}
FakeDate.now = () => NOW
FakeDate.parse = RealDate.parse
FakeDate.prototype = RealDate.prototype

let timerId = 1
const intervals = new Map()
const timeouts = new Map()

/** Kör väntande setTimeout-callbacks med fördröjning <= maxMs. Så kan testet
 *  släppa fram nästa fråga (650 ms) utan att också rensa berömmet (1800 ms). */
function flush(maxMs){
  Array.from(timeouts.keys()).forEach(id => {
    const t = timeouts.get(id)
    if(t && t.ms <= maxMs){ timeouts.delete(id); t.fn() }
  })
}

/** Flytta kalendern n dagar framåt, klockan 10:00 lokal tid. */
function setDay(y, m, d, h){
  NOW = new RealDate(y, m, d, h === undefined ? 10 : h, 0, 0).getTime()
}

// --- Frågepool i testet ------------------------------------------------------
function mkQ(i, topic){
  return {
    id: 'q' + String(i).padStart(3, '0'), type: 'mc', topic: topic || 'osteologi_ben',
    prompt: `Fråga ${i}?`, correct: `Rätt ${i}`, distractors: [`Fel ${i}a`, `Fel ${i}b`, `Fel ${i}c`]
  }
}
let POOL = []
let FLAGS = {}

// --- Körkontext --------------------------------------------------------------
const ctx = {
  console,
  localStorage,
  navigator: {},
  Date: FakeDate,
  setInterval: (fn, ms) => { const id = timerId++; intervals.set(id, { fn, ms }); return id },
  clearInterval: id => { intervals.delete(id) },
  setTimeout: (fn, ms) => { const id = timerId++; timeouts.set(id, { fn, ms }); return id },
  clearTimeout: id => { timeouts.delete(id) },
  requestAnimationFrame: fn => { fn(); return 0 },
  alert: msg => { ctx.lastAlert = msg },
  confirm: () => ctx.confirmAnswer,
  confirmAnswer: true,
  FileReader: function(){},
  document: {
    createElement: t => new El(t),
    getElementById: id => nodes[id] || null,
    addEventListener: (t, fn) => { (ctx._docListeners[t] = ctx._docListeners[t] || []).push(fn) },
    activeElement: { tagName: 'BODY' }
  },
  _docListeners: {},
  el: id => nodes[id] || null,
  // app.js-hjälpare
  markAnswerBtn: (b, ok) => {
    b.classList.add(ok ? 'correct' : 'wrong')
    const mark = new El('span'); mark.className = 'answer-mark'; mark.textContent = ok ? '✓' : '✗'
    const sr = new El('span'); sr.className = 'sr-only'; sr.textContent = ok ? ' — rätt svar' : ' — fel svar'
    b.append(mark, sr)
  },
  playTone: (freqs, falling) => { ctx.tones.push({ freqs, falling }) },
  streakTone: s => 523.25 + s,
  hapticPulse: p => { ctx.pulses.push(p) },
  reducedMotionPreferred: () => false,
  GM_RING_CIRCUMFERENCE: 326.7,
  fitActiveView: () => { ctx.fitCalls++ },
  formatDuration: ms => Math.round(ms / 1000) + ' s',
  tones: [],
  pulses: [],
  fitCalls: 0,
  loadFlags: () => FLAGS,
  loadPoolForTopic: async () => null,
  topicMatchesSelection: (q, topic) => q.topic === topic,
  topicLabelFor: t => t + ' (MC)',
  eduAbbrevFor: () => '',
  warnStorageUnavailable: () => { ctx.storageWarned = true },
  downloadJsonBlob: (payload, name) => { ctx.lastDownload = payload; ctx.lastDownloadName = name },
  topicCapabilities: () => ctx.caps,
  caps: { mc: true, tf: false, fc: false },
  get allQuestions(){ return POOL }
}
ctx.window = {
  matchMedia: () => ({ matches: false }),
  scrollTo: () => {},
  AudioContext: undefined,
  webkitAudioContext: undefined
}
ctx.window.window = ctx.window
ctx.globalThis = ctx
vm.createContext(ctx)
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', 'dagsutmaning.js'), 'utf8'), ctx, { filename: 'js/dagsutmaning.js' })

// Modulen kopplar sina egna knappar och tangentbordet i sin EGEN
// DOMContentLoaded (§12). Kör den, precis som webbläsaren gör.
;(ctx._docListeners.DOMContentLoaded || []).forEach(fn => fn())

// Toppnivåns `let`/`const` hamnar i kontextens lexikala scope, inte på
// globalobjektet – de läses genom att köra ett uttryck i samma kontext.
const ev = expr => vm.runInContext(expr, ctx)

// --- Testramverk -------------------------------------------------------------
let pass = 0, fail = 0
function ok(name, cond, extra){
  if(cond){ pass++; console.log('  ✔ ' + name) }
  else { fail++; console.log('  ✘ ' + name + (extra !== undefined ? '  → ' + JSON.stringify(extra) : '')) }
}
function eq(name, got, want){ ok(name, JSON.stringify(got) === JSON.stringify(want), { got, want }) }
function section(t){ console.log('\n' + t) }

// Svara på frågan som visas. `correct` styr om rätt eller fel alternativ trycks.
function answerCurrent(correct){
  const target = nodes.dagsutmaningChoices.children.find(c => String(c.dataset.choice).startsWith('Rätt') === correct)
  if(!target) throw new Error('inget alternativ att trycka på')
  target.click()
}
// Rätt svar går vidare av sig självt efter 650 ms; fel svar väntar på Nästa.
function answer(correct){
  answerCurrent(correct)
  if(correct) flush(700)
  else nodes.dagsutmaningNextBtn.click()
}
/** Spela hela dagens set. `wrongAt` är en lista med frågenummer (1-baserat)
 *  som ska besvaras fel. */
async function playAll(wrongAt){
  const miss = new Set(wrongAt || [])
  await ctx.startDagsutmaning()
  const total = ev('dagsutmaningSet.length')
  for(let i = 1; i <= total; i++) answer(!miss.has(i))
}
const setIds = () => ev('dagsutmaningSet.map(q => q.id)')
const state = () => JSON.parse(store.hur_dagsutmaning_state || 'null')

function resetStorage(){
  Object.keys(store).forEach(k => delete store[k])
  ev('dagsutmaningMemoryScores = null; dagsutmaningMemoryState = null')
}

// ============================================================================
section('Poolbygge')
// ============================================================================
POOL = [
  mkQ(1), mkQ(2),
  { id: 'q003', type: 'tf', topic: 'osteologi_ben', prompt: 'Sant?', correct: 'Sant', distractors: ['Falskt'] },
  { id: 'q004', type: 'fc', topic: 'osteologi_ben', prompt: 'Kort', correct: 'Svar' },                        // flashcard – ej med
  { id: 'q005', type: 'mc', topic: 'osteologi_ben', prompt: 'Bild', correct: 'A', distractors: ['B'], image: 'x' }, // bildfråga – ej med
  { id: 'ph001', type: 'mc', topic: 'osteologi_ben', prompt: 'P', correct: 'A', distractors: ['B'] },         // placeholder – ej med
  { id: 'q006', type: 'mc', topic: 'osteologi_ben', prompt: 'Utan distraktorer', correct: 'A' },              // ofullständig – ej med
  mkQ(7, 'muskler_arm')                                                                                       // annat ämne – ej med
]
eq('bara spelbara MC/TF ur valt ämne', ctx.buildDagsutmaningPool('osteologi_ben', null).map(q => q.id), ['q001', 'q002', 'q003'])

FLAGS = { q002: { excluded: true } }
eq('uteslutna frågor utelämnas', ctx.buildDagsutmaningPool('osteologi_ben', null).map(q => q.id), ['q001', 'q003'])
FLAGS = {}

POOL = [mkQ(1), { ...mkQ(1), topic: 'osteologi_ben' }]
eq('samma topic|id räknas en gång', ctx.buildDagsutmaningPool('osteologi_ben', null).length, 1)

// Poolen sorteras på topic|id, så att setet inte hänger på inläsningsordningen.
POOL = [mkQ(3), mkQ(1), mkQ(2)]
eq('poolen sorteras deterministiskt', ctx.buildDagsutmaningPool('osteologi_ben', null).map(q => q.id), ['q001', 'q002', 'q003'])

// ============================================================================
section('Dagens set — deterministiskt ur datumet')
// ============================================================================
POOL = Array.from({ length: 40 }, (_, i) => mkQ(i + 1))
const pool40 = ctx.buildDagsutmaningPool('osteologi_ben', null)

const setA = ctx.pickDagsutmaningSet(pool40, '2026-07-26', 'osteologi_ben').map(q => q.id)
const setA2 = ctx.pickDagsutmaningSet(pool40, '2026-07-26', 'osteologi_ben').map(q => q.id)
const setB = ctx.pickDagsutmaningSet(pool40, '2026-07-27', 'osteologi_ben').map(q => q.id)
const setC = ctx.pickDagsutmaningSet(pool40, '2026-07-26', 'muskler_arm').map(q => q.id)

eq('setet har tio frågor', setA.length, 10)
eq('samma datum + ämne ger identiskt set', setA, setA2)
ok('nytt datum ger ett annat set', JSON.stringify(setA) !== JSON.stringify(setB), { setA, setB })
ok('annat ämne ger ett annat set', JSON.stringify(setA) !== JSON.stringify(setC), { setA, setC })
eq('inga dubbletter i setet', new Set(setA).size, 10)

// Alternativens ordning måste vara lika låst som frågornas – annars är det inte
// samma utmaning när man kommer tillbaka senare på dagen.
const optsA = ctx.dagsutmaningChoicesFor(pool40[0], '2026-07-26')
const optsA2 = ctx.dagsutmaningChoicesFor(pool40[0], '2026-07-26')
const optsB = ctx.dagsutmaningChoicesFor(pool40[0], '2026-07-27')
eq('alternativordningen är låst till dagen', optsA, optsA2)
ok('alternativordningen byts nästa dag', JSON.stringify(optsA) !== JSON.stringify(optsB), { optsA, optsB })
eq('sant/falskt behåller naturlig ordning',
  ctx.dagsutmaningChoicesFor({ type: 'tf', id: 'x', topic: 't', correct: 'Sant', distractors: ['Falskt'] }, '2026-07-26'),
  ['Sant', 'Falskt'])

// Ett litet ämne spelas med så många frågor som finns, inte spärras.
eq('litet ämne ger kortare set', ctx.pickDagsutmaningSet(pool40.slice(0, 6), '2026-07-26', 't').length, 6)

// ============================================================================
section('Datumnycklar och nedräkning')
// ============================================================================
setDay(2026, 6, 26)
eq('dagens datum är lokalt, inte UTC', ctx.dagsutmaningToday(), '2026-07-26')
setDay(2026, 6, 26, 23)   // 23:00 lokal tid — UTC hade redan varit nästa dygn
eq('sen kväll räknas som samma dag', ctx.dagsutmaningToday(), '2026-07-26')
eq('en timme kvar till nästa utmaning', ctx.dagsutmaningFormatUntil(ctx.dagsutmaningMsToMidnight()), '1 tim')
setDay(2026, 6, 26, 10)

eq('shift bakåt över månadsskifte', ctx.dagsutmaningShift('2026-08-01', -1), '2026-07-31')
eq('shift framåt över årsskifte', ctx.dagsutmaningShift('2026-12-31', 1), '2027-01-01')
eq('datumetikett på svenska', ctx.dagsutmaningDateLabel('2026-07-26'), 'söndag 26 juli')
eq('nedräkning i timmar och minuter', ctx.dagsutmaningFormatUntil(7 * 3600000 + 12 * 60000), '7 tim 12 min')
eq('nedräkning under en timme', ctx.dagsutmaningFormatUntil(12 * 60000), '12 min')
eq('nedräkning under en minut', ctx.dagsutmaningFormatUntil(30000), 'mindre än en minut')

// ============================================================================
section('En runda')
// ============================================================================
resetStorage()
setDay(2026, 6, 26)
;(async () => {
  await ctx.startDagsutmaning()

  ok('spelvyn visas', !nodes.dagsutmaning.hidden())
  ok('startvyn är dold', nodes.setup.hidden())
  ok('klart-vyn är dold under rundan', nodes.dagsutmaningFinished.hidden())
  ok('förklaringen fälls upp för förstagångsspelare', nodes.dagsutmaningIntro.open === true)
  eq('räknaren visar fråga 1 av 10', nodes.dagsutmaningCounter.textContent, 'Fråga 1 av 10')
  ok('vyn skalas till skärmen', ctx.fitCalls > 0)
  ok('Nästa-knappen syns inte på en obesvarad fråga', nodes.dagsutmaningNextBtn.hidden())

  // Rätt svar: kvitto och vidare av sig självt.
  const first = nodes.dagsutmaningPrompt.textContent
  answerCurrent(true)
  ok('rätt alternativ märks med ✓ och skärmläsartext',
    nodes.dagsutmaningChoices.children.some(c => c._class.has('correct') && c.textContent.includes('rätt svar')))
  ok('Nästa-knappen behövs inte vid rätt svar', nodes.dagsutmaningNextBtn.hidden())
  eq('poängbrickan uppdateras', nodes.dagsutmaningScoreBadge.textContent, 'Rätt: 1')
  eq('mätaren fylls', nodes.dagsutmaningProgressFill.style.width, '10.0%')
  flush(700)
  ok('nästa fråga kom fram automatiskt', nodes.dagsutmaningPrompt.textContent !== first)
  eq('räknaren räknar upp', nodes.dagsutmaningCounter.textContent, 'Fråga 2 av 10')

  // Fel svar: facit ligger kvar tills spelaren själv trycker vidare. Det är
  // lägets anpassning av §13.1 punkt 2 – den enda fråga man behöver läsa får
  // inte försvinna av sig själv.
  const second = nodes.dagsutmaningPrompt.textContent
  answerCurrent(false)
  ok('rätt svar visas även vid fel',
    nodes.dagsutmaningChoices.children.some(c => c._class.has('correct')))
  ok('valt fel alternativ märks med ✗',
    nodes.dagsutmaningChoices.children.some(c => c._class.has('wrong') && c.textContent.includes('fel svar')))
  ok('Nästa-knappen dyker upp vid fel svar', !nodes.dagsutmaningNextBtn.hidden() && !nodes.dagsutmaningNextBtn.disabled)
  flush(5000)
  eq('facit ligger kvar av sig självt', nodes.dagsutmaningPrompt.textContent, second)
  nodes.dagsutmaningNextBtn.click()
  ok('Nästa går vidare', nodes.dagsutmaningPrompt.textContent !== second)

  // Resten av setet (fråga 3–10; 1 var rätt, 2 var fel)
  for(let i = 3; i <= 10; i++) answer(true)

  ok('klart-vyn visas', !nodes.dagsutmaningFinished.hidden())
  ok('spelvyn är dold', nodes.dagsutmaningPlay.hidden())
  ok('förklaringen döljs på resultatskärmen', nodes.dagsutmaningIntro.hidden())
  eq('resultattexten', nodes.dagsutmaningDoneText.textContent, 'Klart! 9 av 10 rätt på dagens utmaning.')
  eq('ringen visar andelen', nodes.dagsutmaningRingPct.textContent, '90 %')
  eq('sviten börjar på dag 1', nodes.dagsutmaningStreakText.textContent, '🔥 Dag 1 i rad. Sviten har börjat.')
  ok('missade frågor listas med facit', !nodes.dagsutmaningMissedWrap.hidden() && nodes.dagsutmaningMissed.children.length === 1)
  ok('nedräkningen till nästa utmaning visas', /Ny utmaning om/.test(nodes.dagsutmaningNextText.textContent))
  ok('inget rekordmärke på dag 1', nodes.dagsutmaningRecordBadge.hidden())

  // ==========================================================================
  section('Sviten räknar dagar')
  // ==========================================================================
  eq('dag 1 sparad', state().streak, 1)
  eq('dagens datum bokfört', state().lastDate, '2026-07-26')
  eq('ämnet bokfört på dagen', state().done['2026-07-26'], ['osteologi_ben'])

  // Samma dag igen i samma ämne = omspel.
  await playAll([])
  eq('omspel flyttar inte sviten', state().streak, 1)
  ok('omspelsmärket syns under rundan', ev('dagsutmaningIsReplay') === true)
  // Sviten står kvar på sin egen rad även vid omspel; att resultatet inte
  // räknades sägs på raden om nästa utmaning – två rader, två uppgifter.
  eq('sviten står kvar vid omspel', nodes.dagsutmaningStreakText.textContent, '🔥 1 dag i rad.')
  ok('omspelet förklaras på nästa-raden', /Omspel – det här resultatet räknades inte/.test(nodes.dagsutmaningNextText.textContent),
    nodes.dagsutmaningNextText.textContent)
  eq('omspel sparas inte i topplistan', JSON.parse(store.hur_highscores_dagsutmaning).length, 1)

  // Nästa dag: sviten växer.
  setDay(2026, 6, 27)
  await playAll([])
  eq('nästa dag ger dag 2', state().streak, 2)
  eq('sviten firas på resultatskärmen', nodes.dagsutmaningStreakText.textContent, '🔥 2 dagar i rad!')
  ok('nytt rekord märks ut', !nodes.dagsutmaningRecordBadge.hidden())
  eq('rekordmärkets text', nodes.dagsutmaningRecordBadge.textContent, '🏆 Längsta svit hittills: 2 dagar')

  // Ett hoppat dygn bryter sviten.
  setDay(2026, 6, 29)
  await playAll([])
  eq('missad dag nollställer sviten', state().streak, 1)
  eq('längsta sviten står kvar', state().best, 2)
  ok('inget rekordmärke när sviten börjat om', nodes.dagsutmaningRecordBadge.hidden())

  // Ett annat ämne samma dag räknar dagen en gång men sparar resultatet.
  nodes.topic.value = 'muskler_arm'
  POOL = POOL.concat(Array.from({ length: 20 }, (_, i) => mkQ(100 + i, 'muskler_arm')))
  ctx.topicMatchesSelection = (q, topic) => q.topic === topic
  await playAll([])
  eq('nytt ämne samma dag höjer inte sviten', state().streak, 1)
  eq('båda ämnena bokförda på dagen', state().done['2026-07-29'].length, 2)
  ok('men resultatet sparas', JSON.parse(store.hur_highscores_dagsutmaning).length === 4,
    JSON.parse(store.hur_highscores_dagsutmaning).length)
  nodes.topic.value = 'osteologi_ben'

  // Sviten som VISAS ska vara noll när den är bruten, inte gårdagens siffra.
  setDay(2026, 7, 5)
  eq('bruten svit visas som 0', ctx.currentDagsutmaningStreak(), 0)
  setDay(2026, 6, 30)
  eq('gårdagens svit räknas som pågående', ctx.currentDagsutmaningStreak(), 1)

  // ==========================================================================
  section('Vaneraden')
  // ==========================================================================
  setDay(2026, 6, 30)
  ctx.renderDagsutmaningWeek()
  const week = nodes.dagsutmaningWeek.children
  eq('sju dagar visas', week.length, 7)
  eq('sista cellen är i dag', week[6]._class.has('today'), true)
  // Rullande fönster som SLUTAR i dag – inte kalenderveckan. En streakrad ska
  // visa de sju senaste dygnen, inte dagar som ännu inte varit. 2026-07-30 är
  // en torsdag, så fönstret 24–30 juli börjar på fredag.
  eq('veckodagsinitialer följer det rullande fönstret',
    week.map(c => c.children[1].textContent).join(''), 'FLSMTOT')
  eq('sista initialen är dagens veckodag', week[6].children[1].textContent, 'T')
  ok('klarade dagar är avbockade', week.filter(c => c._class.has('done')).length === 3,
    week.map(c => c.className))
  ok('dagar före första spelade dagen är tomma, inte missade',
    week.filter(c => c._class.has('none')).length > 0, week.map(c => c.className))
  ok('skärmläsaren får dagen i klartext', week[6].children[2].textContent.includes('juli'))

  // ==========================================================================
  section('Startknappens svitbricka')
  // ==========================================================================
  setDay(2026, 6, 30)
  ctx.updateDagsutmaningButton()
  ok('brickan visas när sviten lever', !nodes.dagsutmaningFlame.hidden())
  eq('flamma när dagens inte är klar', nodes.dagsutmaningFlame.textContent, '🔥 1')
  await playAll([])
  ctx.updateDagsutmaningButton()
  eq('bock när dagens är klar', nodes.dagsutmaningFlame.textContent, '✓ 2')
  ok('brickan har grön klar-stil', nodes.dagsutmaningFlame._class.has('done'))

  ctx.caps = { mc: false, tf: false, fc: true }
  ctx.updateDagsutmaningButton()
  ok('knappen skuggas för rena flashcard-ämnen', nodes.startDagsutmaningBtn.disabled === true)
  ctx.caps = { mc: true, tf: false, fc: false }
  ctx.updateDagsutmaningButton()
  ok('knappen aktiv igen för MC-ämnen', nodes.startDagsutmaningBtn.disabled === false)

  // ==========================================================================
  section('Beröm och delmål')
  // ==========================================================================
  resetStorage()
  setDay(2026, 6, 26)
  await ctx.startDagsutmaning()
  for(let i = 1; i <= 4; i++) answer(true)
  ok('inget beröm före femte rätt', nodes.dagsutmaningPraise.hidden())
  answerCurrent(true)
  eq('femte rätt i rad berömms', nodes.dagsutmaningPraise.textContent, '🔥 5 rätt i rad!')
  flush(700)
  flush(2000)
  ok('berömmet försvinner av sig självt', nodes.dagsutmaningPraise.hidden())

  // Halvvägs felfritt: eget omnämnande, men bara när sviten inte redan tar det.
  resetStorage()
  await ctx.startDagsutmaning()
  answer(false)
  for(let i = 2; i <= 5; i++) answer(true)
  ok('inget halvvägsberöm när man redan missat', nodes.dagsutmaningPraise.hidden())

  // Milstolpe: 3 dagar i rad firas i guld.
  resetStorage()
  setDay(2026, 6, 24); await playAll([])
  setDay(2026, 6, 25); await playAll([])
  setDay(2026, 6, 26); await playAll([])
  eq('tre dagar i rad', state().streak, 3)
  ok('milstolpen firas', /3 dagar i rad/.test(nodes.dagsutmaningPraise.textContent) &&
    nodes.dagsutmaningPraise._class.has('gold'), nodes.dagsutmaningPraise.textContent)

  // ==========================================================================
  section('Avbryt')
  // ==========================================================================
  resetStorage()
  setDay(2026, 6, 26)
  await ctx.startDagsutmaning()
  answer(true)
  ctx.confirmAnswer = true
  ctx.cancelDagsutmaning()
  ok('vyn stängs vid avbrott', nodes.dagsutmaning.hidden() && !nodes.setup.hidden())
  eq('avbruten runda räknas inte som klarad', state(), null)

  // ==========================================================================
  section('Topplista, export och import')
  // ==========================================================================
  resetStorage()
  setDay(2026, 6, 26)
  ctx.renderDagsutmaningScores()
  ok('tomrad visas när inget finns', !hsEmpty._class.has('hidden'))

  await playAll([1, 2])
  ctx.renderDagsutmaningScores()
  ok('tomraden döljs när det finns resultat', hsEmpty._class.has('hidden'))
  eq('en rad i listan', scoreList.children.length, 1)
  ok('raden visar rätt/totalt', scoreList.children[0].textContent.includes('8/10'),
    scoreList.children[0].textContent)

  ctx.exportDagsutmaningScores()
  eq('exportens typ', ctx.lastDownload.type, 'anatomiquiz-dagsutmaning')
  eq('exporten tar med resultaten', ctx.lastDownload.scores.length, 1)
  eq('exporten tar med sviten', ctx.lastDownload.state.streak, 1)
  ok('filnamnet är fritt från varumärken', /^anatomiquiz-dagsutmaning-/.test(ctx.lastDownloadName), ctx.lastDownloadName)

  // Import: dagshistoriken slås ihop och sviten räknas om ur unionen — två
  // enheter med var sin halva av veckan ska ge EN obruten svit.
  const local = { version: 1, streak: 1, best: 1, lastDate: '2026-07-26', done: { '2026-07-26': ['a'] } }
  const other = { version: 1, streak: 2, best: 2, lastDate: '2026-07-25', done: { '2026-07-24': ['b'], '2026-07-25': ['b'] } }
  const merged = ctx.mergeDagsutmaningState(local, other)
  eq('sammanslagen svit räknas ur unionen', merged.streak, 3)
  eq('sammanslaget rekord', merged.best, 3)
  eq('sista dagen är den senaste', merged.lastDate, '2026-07-26')
  eq('alla dagar med', Object.keys(merged.done).sort(), ['2026-07-24', '2026-07-25', '2026-07-26'])

  const glapp = ctx.mergeDagsutmaningState(
    { done: { '2026-07-20': ['a'], '2026-07-26': ['a'] } },
    { done: {} })
  eq('ett glapp bryter kedjan', glapp.streak, 1)
  eq('längsta kedjan minns ändå', glapp.best, 1)

  // ==========================================================================
  section('Rensning')
  // ==========================================================================
  resetStorage()
  setDay(2026, 6, 26)
  await playAll([])
  ctx.confirmAnswer = true
  ctx.clearDagsutmaningScoresFlow()
  eq('topplistan rensas', store.hur_highscores_dagsutmaning, undefined)
  ok('men sviten överlever en rensad topplista', state() && state().streak === 1, state())
  ctx.clearDagsutmaningStreakFlow()
  eq('sviten går att nollställa separat', state(), null)

  // ==========================================================================
  section('Litet ämne')
  // ==========================================================================
  resetStorage()
  POOL = [mkQ(1), mkQ(2), mkQ(3)]
  ctx.lastAlert = ''
  await ctx.startDagsutmaning()
  ok('ämne med för få frågor tackar nej', /för få/.test(ctx.lastAlert), ctx.lastAlert)
  ok('och startar ingen runda', ev('dagsutmaningRunning') === false)

  POOL = Array.from({ length: 7 }, (_, i) => mkQ(i + 1))
  await ctx.startDagsutmaning()
  eq('sju frågor räcker och ger ett set om sju', ev('dagsutmaningSet.length'), 7)
  for(let i = 1; i <= 7; i++) answer(true)
  eq('kortare set räknas mot sin egen storlek', nodes.dagsutmaningDoneText.textContent,
    'Klart! 7 av 7 rätt på dagens utmaning.')

  // ==========================================================================
  console.log(`\n${pass} godkända, ${fail} underkända`)
  process.exit(fail ? 1 : 0)
})()
