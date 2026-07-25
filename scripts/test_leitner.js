/* =========================================================
   test_leitner.js — tester för spelläget Leitner Light
   =========================================================
   Körs med:  node scripts/test_leitner.js
   Avslutar med kod 0 när allt är grönt, annars 1.

   Ett minimalt DOM-skal gör att js/leitner.js kan köras och drivas på riktigt
   utan webbläsare – testerna träffar alltså den kod som faktiskt levereras,
   inte en kopia av logiken. app.js hjälpare (el, shuffle, loadPoolForTopic,
   topicMatchesSelection …) stubbas, eftersom de testas via quizet.

   Skalet modellerar DOM-trädet och händelserna, INTE layouten. Att brickan
   glider rätt i lådtrappan, att texten ryms eller att klart-vyn faktiskt döljs
   av CSS kan det omöjligt fånga – det kräver visuell kontroll i webbläsare
   (CLAUDE_REGLER §13.1 punkt 3). Lådlogik, urval, omköer, poäng, schemaläggning
   och lagring fångar det däremot.

   Kör det här skriptet efter varje ändring i js/leitner.js.
   ========================================================= */

const fs = require('fs')
const path = require('path')
const vm = require('vm')

const ROOT = path.resolve(__dirname, '..')
const DAY = 86400000

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
}

const nodes = {}
function node(id, extra){
  const e = new El('div')
  e.id = id
  Object.assign(e, extra || {})
  nodes[id] = e
  return e
}

;['setup', 'highscores', 'result', 'quiz', 'flashcards', 'matcha', 'leitner', 'leitnerPlay',
  'leitnerFinished', 'leitnerFooter', 'leitnerPlayerLabel', 'leitnerMeta', 'leitnerProgressFill',
  'leitnerProgressLabel', 'leitnerScoreBadge', 'leitnerMastery', 'leitnerMasteryFill',
  'leitnerMasteryLabel', 'leitnerChip', 'leitnerLadderLabel', 'leitnerPraise', 'leitnerCardMeta',
  'leitnerPrompt', 'leitnerChoices', 'leitnerNextBtn', 'leitnerTimer', 'leitnerRingProgress',
  'leitnerRingPct', 'leitnerDoneText', 'leitnerStatsText', 'leitnerNextText', 'leitnerRecordBadge',
  'startLeitnerBtn', 'exportScores-leitner', 'importScoresBtn-leitner', 'importScoresFile-leitner',
  'clearScores-leitner'].forEach(id => node(id))

// Lådtrappan: fem celler som setLeitnerLadder ska kunna märka upp.
const ladder = node('leitnerLadder')
for(let i = 1; i <= 5; i++){
  const box = new El('span')
  box.className = 'leitner-box'
  box.textContent = String(i)
  ladder.appendChild(box)
}

// Topplistesegmentet: <ol> med en .hs-empty-syskonrad i en förälder.
const hsWrap = new El('div')
const scoreList = node('scoreList-leitner')
const hsEmpty = new El('p'); hsEmpty.className = 'hs-empty'
hsWrap.appendChild(scoreList); hsWrap.appendChild(hsEmpty)
scoreList.parent = hsWrap

node('playerName', { value: 'Testare' })
node('numQuestions', { value: '10' })
node('timerEnabled', { checked: false })
node('soundEnabled', { checked: false })
node('topic', { value: 'osteologi_ben' })

// --- Lagring ----------------------------------------------------------------
const store = {}
const localStorage = {
  getItem: k => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v) },
  removeItem: k => { delete store[k] }
}

// --- Frågepool i testet ------------------------------------------------------
function mkQ(i, topic){
  return {
    id: 'q' + i, type: 'mc', topic: topic || 'osteologi_ben',
    prompt: `Fråga ${i}?`, correct: `Rätt ${i}`, distractors: [`Fel ${i}a`, `Fel ${i}b`, `Fel ${i}c`]
  }
}
let POOL = []

// --- Körkontext --------------------------------------------------------------
const timers = []
const ctx = {
  console,
  localStorage,
  navigator: {},
  Date,
  Math,
  JSON,
  Object,
  Array,
  Set,
  Infinity,
  parseInt,
  isNaN,
  setInterval: () => 0,
  clearInterval: () => {},
  // Rättningens steg körs synkront i testet: vi vill kunna läsa sluttillståndet
  // direkt efter ett svar, precis som vid prefers-reduced-motion.
  setTimeout: fn => { timers.push(fn); fn(); return 0 },
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
  shuffle: a => a.slice(),          // deterministisk ordning i tester
  loadFlags: () => ({}),
  loadPoolForTopic: async () => null,
  topicMatchesSelection: (q, topic) => q.topic === topic,
  topicLabelFor: t => t + ' (MC)',
  eduAbbrevFor: () => '',
  formatDuration: ms => `${Math.round(ms / 1000)} s`,
  warnStorageUnavailable: () => {},
  downloadJsonBlob: (payload) => { ctx.lastDownload = payload },
  topicCapabilities: () => ({ mc: true, tf: false, fc: false }),
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
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', 'leitner.js'), 'utf8'), ctx, { filename: 'js/leitner.js' })

// Toppnivåns `let` i leitner.js hamnar i kontextens lexikala scope, inte på
// globalobjektet – de läses därför genom att köra ett uttryck i samma kontext.
const ev = expr => vm.runInContext(expr, ctx)

// --- Testramverk -------------------------------------------------------------
let pass = 0, fail = 0
function ok(name, cond, extra){
  if(cond){ pass++; console.log('  ✔ ' + name) }
  else { fail++; console.log('  ✘ ' + name + (extra !== undefined ? '  → ' + JSON.stringify(extra) : '')) }
}
function eq(name, got, want){ ok(name, JSON.stringify(got) === JSON.stringify(want), { got, want }) }
function section(t){ console.log('\n' + t) }

const startOfDay = ms => { const d = new Date(ms); d.setHours(0, 0, 0, 0); return d.getTime() }

// Vilket kort visas just nu? (Prompten är "Fråga N?" i testdatan.)
const currentCardId = () => 'q' + (nodes.leitnerPrompt.textContent.match(/\d+/) || [''])[0]

// Svara på kortet som visas: `correct` styr om rätt eller fel alternativ trycks.
function answerCurrent(correct){
  const target = nodes.leitnerChoices.children.find(c => c.dataset.choice.startsWith('Rätt') === correct)
  if(!target) throw new Error('inget alternativ att trycka på')
  target.click()
}

// Kör ett helt pass tills klart-vyn visas. `answers` är true/false i tur och ordning
// (saknas ett värde svaras rätt). Returnerar antalet svar som gavs.
async function playSession(answers){
  await ctx.startLeitner()
  let i = 0
  while(nodes.leitnerFinished._class.has('hidden') && i < 60){
    answerCurrent(answers[i] !== undefined ? answers[i] : true)
    i++
    ctx.onLeitnerNext()
  }
  return i
}

// ============================================================================
section('Lådor och schemaläggning')
// ============================================================================
const now = Date.now()
eq('låda 1 → förfaller om 1 dag', ctx.leitnerDueFor(1, now), startOfDay(now) + DAY)
eq('låda 3 → förfaller om 4 dagar', ctx.leitnerDueFor(3, now), startOfDay(now) + 4 * DAY)
eq('låda 5 → förfaller om 16 dagar', ctx.leitnerDueFor(5, now), startOfDay(now) + 16 * DAY)
eq('dagsetikett i morgon', ctx.leitnerDayLabel(startOfDay(now) + DAY), 'i morgon')
eq('dagsetikett i dag', ctx.leitnerDayLabel(now), 'i dag')
eq('intervalltext låda 1', ctx.leitnerIntervalLabel(1), 'åter i morgon')
eq('intervalltext låda 4', ctx.leitnerIntervalLabel(4), 'åter om 8 dagar')

// ============================================================================
section('Poolbygge')
// ============================================================================
POOL = [
  mkQ(1), mkQ(2),
  { id: 'q3', type: 'tf', topic: 'osteologi_ben', prompt: 'Sant?', correct: 'Sant', distractors: ['Falskt'] },
  { id: 'q4', type: 'fc', topic: 'osteologi_ben', prompt: 'Kort', correct: 'Svar' },                 // flashcard – ej med
  { id: 'q5', type: 'mc', topic: 'osteologi_ben', prompt: 'Bild', correct: 'A', distractors: ['B'], image: 'x' }, // bildfråga – ej med
  { id: 'ph001', type: 'mc', topic: 'osteologi_ben', prompt: 'P', correct: 'A', distractors: ['B'] }, // placeholder – ej med
  { id: 'q6', type: 'mc', topic: 'osteologi_ben', prompt: 'Utan distraktorer', correct: 'A' },        // ofullständig – ej med
  mkQ(7, 'muskler_arm')                                                                              // annat ämne – ej med
]
let pool = ctx.buildLeitnerPool('osteologi_ben', null)
eq('poolen tar bara spelbara MC/TF ur valt ämne', pool.map(q => q.id), ['q1', 'q2', 'q3'])
eq('kortnyckeln är topic|id', ctx.leitnerKey(POOL[0]), 'osteologi_ben|q1')

// ============================================================================
section('Urval till passet')
// ============================================================================
POOL = [mkQ(1), mkQ(2), mkQ(3), mkQ(4)]
pool = ctx.buildLeitnerPool('osteologi_ben', null)
const state = {
  v: 1,
  cards: {
    'osteologi_ben|q1': { b: 3, due: now - 2 * DAY, n: 3, t: 'osteologi_ben' },   // förfallen, hög låda
    'osteologi_ben|q2': { b: 1, due: now - 1 * DAY, n: 1, t: 'osteologi_ben' },   // förfallen, låg låda
    'osteologi_ben|q3': { b: 4, due: now + 5 * DAY, n: 4, t: 'osteologi_ben' }    // ej förfallen
  }
}
let pick = ctx.pickLeitnerSession(pool, state, 10)
eq('förfallna först (lägst låda först), sedan nya', pick.cards.map(q => q.id), ['q2', 'q1', 'q4'])
eq('räknar förfallna', pick.dueCount, 2)
eq('räknar nya', pick.freshCount, 1)

pick = ctx.pickLeitnerSession(pool, state, 1)
eq('respekterar valt antal', pick.cards.map(q => q.id), ['q2'])

const allFuture = { v: 1, cards: {} }
pool.forEach((q, i) => { allFuture.cards[ctx.leitnerKey(q)] = { b: 2, due: now + (i + 1) * DAY, n: 1, t: q.topic } })
pick = ctx.pickLeitnerSession(pool, allFuture, 10)
ok('inget förfallet → erbjuder öva i förväg i stället för återvändsgränd', pick.ahead === true)
eq('förhandsövning tar det som förfaller först', pick.aheadCards.map(q => q.id), ['q1', 'q2', 'q3', 'q4'])

// ============================================================================
section('Ett helt pass — alla rätt')
// ============================================================================
delete store['hur_leitner_state']
delete store['hur_highscores_leitner']
POOL = [mkQ(1), mkQ(2), mkQ(3)]
nodes.numQuestions.value = '10'
;(async () => {
  await playSession([true, true, true])
  const st = JSON.parse(store['hur_leitner_state'])
  eq('alla tre korten flyttades till låda 2', [1, 2, 3].map(i => st.cards['osteologi_ben|q' + i].b), [2, 2, 2])
  eq('förfallodatum satt två dagar fram', st.cards['osteologi_ben|q1'].due, startOfDay(Date.now()) + 2 * DAY)
  ok('klart-vyn visas', !nodes.leitnerFinished._class.has('hidden'))
  ok('spelvyn dold vid slutet', nodes.leitnerPlay._class.has('hidden'))
  eq('resultatring 100 %', nodes.leitnerRingPct.textContent, '100 %')
  ok('slutet pekar framåt mot nästa pass', /Nästa pass: 3 kort återkommer/.test(nodes.leitnerNextText.textContent),
     nodes.leitnerNextText.textContent)
  const scores = JSON.parse(store['hur_highscores_leitner'])
  eq('resultatet sparat', [scores.length, scores[0].correct, scores[0].cards], [1, 3, 3])
  eq('uppflyttade räknade', scores[0].promoted, 3)
  ok('inget rekordmärke vid första passet', nodes.leitnerRecordBadge._class.has('hidden'))

  // ==========================================================================
  section('Fel svar: tillbaka till låda 1, kortet återkommer i samma pass')
  // ==========================================================================
  // q1 är förfallen och ligger högt upp (låda 4) → den dras först; q2/q3 är nya.
  store['hur_leitner_state'] = JSON.stringify({
    v: 1,
    cards: { 'osteologi_ben|q1': { b: 4, due: now - DAY, n: 4, t: 'osteologi_ben' } }
  })
  POOL = [mkQ(1), mkQ(2), mkQ(3)]
  await ctx.startLeitner()
  eq('kön startar med passets kort', ev('leitnerQueue.length'), 3)
  eq('förfallet kort visas först', currentCardId(), 'q1')
  answerCurrent(false)
  const stAfterWrong = JSON.parse(store['hur_leitner_state'])
  eq('fel svar skickar kortet från låda 4 till låda 1', stAfterWrong.cards['osteologi_ben|q1'].b, 1)
  eq('kortet lades in i kön igen', ev('leitnerQueue.length'), 4)
  ok('lådtexten berättar fallet', /→ 1/.test(nodes.leitnerLadderLabel.textContent), nodes.leitnerLadderLabel.textContent)
  ok('framstegsmätaren räknar inte kortet som klart', nodes.leitnerProgressFill.style.width === '0%',
     nodes.leitnerProgressFill.style.width)
  eq('etiketten speglar avklarade kort', nodes.leitnerProgressLabel.textContent, '0/3 klara')
  eq('rätt-räknaren betygsätter kortet direkt', nodes.leitnerScoreBadge.textContent, 'Rätt: 0/1')
  ctx.onLeitnerNext()
  // Resten rätt – inklusive omtaget av kort q1 sist i kön.
  let varv = 0
  while(nodes.leitnerFinished._class.has('hidden') && varv < 10){
    answerCurrent(true); ctx.onLeitnerNext(); varv++
  }
  eq('omtaget kom sist i kön', varv, 3)
  const stEnd = JSON.parse(store['hur_leitner_state'])
  eq('rätt på andra chansen räddar INTE kortet ur låda 1', stEnd.cards['osteologi_ben|q1'].b, 1)
  eq('övriga kort flyttades upp', [stEnd.cards['osteologi_ben|q2'].b, stEnd.cards['osteologi_ben|q3'].b], [2, 2])
  const s2 = JSON.parse(store['hur_highscores_leitner'])
  eq('bara första svaret räknas som rätt', s2[0].correct, 2)
  eq('passets kortantal opåverkat av omtaget', s2[0].cards, 3)

  // ==========================================================================
  section('Mästring (låda 5) och rekordmärke')
  // ==========================================================================
  store['hur_leitner_state'] = JSON.stringify({
    v: 1,
    cards: {
      'osteologi_ben|q1': { b: 4, due: now - DAY, n: 4, t: 'osteologi_ben' },
      'osteologi_ben|q2': { b: 4, due: now - DAY, n: 4, t: 'osteologi_ben' },
      'osteologi_ben|q3': { b: 4, due: now - DAY, n: 4, t: 'osteologi_ben' }
    }
  })
  // Ett tidigare, sämre pass i topplistan – dels för att rekordmärket ska ha
  // något att slå, dels så att dagens pass hamnar först vid datumsorteringen.
  store['hur_highscores_leitner'] = JSON.stringify([{
    name: 'Testare', topic: 'osteologi_ben', topicLabel: 'osteologi_ben (MC)',
    cards: 3, correct: 2, promoted: 2, mastered: 0, streak: 1, durationMs: 9000,
    date: new Date(now - DAY).toISOString()
  }])
  POOL = [mkQ(1), mkQ(2), mkQ(3)]
  await playSession([true, true, true])
  const stMaster = JSON.parse(store['hur_leitner_state'])
  eq('alla kort nådde låda 5', [1, 2, 3].map(i => stMaster.cards['osteologi_ben|q' + i].b), [5, 5, 5])
  eq('mästringsmätaren visar 3/3', nodes.leitnerMasteryLabel.textContent, '3/3')
  ok('slutet vet att inget återstår i dag', /Alla kort i ämnet är repeterade/.test(nodes.leitnerNextText.textContent) ||
     /Nästa pass/.test(nodes.leitnerNextText.textContent), nodes.leitnerNextText.textContent)
  const s3 = JSON.parse(store['hur_highscores_leitner'])
  eq('mästrade i passet räknade', s3[0].mastered, 3)
  ok('rekordmärke när passet slår tidigare bästa', !nodes.leitnerRecordBadge._class.has('hidden'))

  // ==========================================================================
  section('Topplista, export och rensning')
  // ==========================================================================
  ctx.renderLeitnerScores()
  eq('topplistan listar sparade pass', scoreList.children.length, 2)
  ok('bästa passet ligger överst', scoreList.children[0].textContent.includes('100 %'),
     scoreList.children[0].textContent)
  ok('tomtexten dold när det finns resultat', hsEmpty._class.has('hidden'))
  ctx.exportLeitnerScores()
  ok('exporten tar med både resultat och lådstatus',
     !!ctx.lastDownload.scores && !!ctx.lastDownload.state && Object.keys(ctx.lastDownload.state.cards).length === 3)
  eq('sammanslagning behåller den högsta lådan',
     ctx.mergeLeitnerCard({ b: 2, due: 10 }, { b: 4, due: 5 }), { b: 4, due: 5 })
  eq('vid samma låda vinner den senast repeterade',
     ctx.mergeLeitnerCard({ b: 3, due: 10 }, { b: 3, due: 50 }), { b: 3, due: 50 })

  ctx.confirmAnswer = true
  ctx.clearLeitnerScoresFlow()
  ok('rensning tömmer topplistan', store['hur_highscores_leitner'] === undefined)
  ok('rensning kan även nollställa lådorna', store['hur_leitner_state'] === undefined)

  // ==========================================================================
  section('Knappens tillgänglighet')
  // ==========================================================================
  ctx.updateLeitnerButton()
  ok('knappen aktiv för MC-ämnen', nodes.startLeitnerBtn.disabled === false)
  ctx.topicCapabilities = () => ({ mc: false, tf: false, fc: true })
  ctx.updateLeitnerButton()
  ok('knappen skuggad för rena flashcard-ämnen', nodes.startLeitnerBtn.disabled === true)

  console.log(`\n${pass} godkända, ${fail} underkända`)
  process.exit(fail ? 1 : 0)
})()
