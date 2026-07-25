/* =========================================================
   test_tidsjakt.js — tester för spelläget "Tidsjakt"
   =========================================================
   Körs med:  node scripts/test_tidsjakt.js
   Avslutar med kod 0 när allt är grönt, annars 1.

   Ett minimalt DOM-skal gör att js/tidsjakt.js kan köras och drivas på riktigt
   utan webbläsare – testerna träffar alltså den kod som faktiskt levereras,
   inte en kopia av logiken. app.js hjälpare (el, shuffle, loadPoolForTopic,
   topicMatchesSelection …) stubbas, eftersom de testas via quizet.

   KLOCKAN ÄR STYRBAR: Date, setInterval och setTimeout är stubbade, så
   nedräkning, tidsstraff, svitbonus och "tiden tog slut mitt i ett facit" går
   att testa deterministiskt i stället för att vänta i verklig tid.

   Skalet modellerar DOM-trädet och händelserna, INTE layouten. Att stapeln
   tömms snyggt, att kortet glider in eller att texten ryms kan det omöjligt
   fånga – det kräver visuell kontroll i webbläsare (CLAUDE_REGLER §13.1).
   Klocklogik, urval, poäng, sviter, rekord, missade frågor och lagring fångar
   det däremot.

   Kör det här skriptet efter varje ändring i js/tidsjakt.js.
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
  'tidsjaktPlay', 'tidsjaktFinished', 'tidsjaktFooter', 'tidsjaktIntro', 'tidsjaktPlayerLabel',
  'tidsjaktMeta', 'tidsjaktClockRow', 'tidsjaktClockFill', 'tidsjaktClock', 'tidsjaktFly',
  'tidsjaktScoreBadge', 'tidsjaktRecordChip', 'tidsjaktStreakChip', 'tidsjaktPraise',
  'tidsjaktCard', 'tidsjaktCountdown', 'tidsjaktCountdownNr',
  'tidsjaktPrompt', 'tidsjaktChoices', 'tidsjaktAnsweredLabel',
  'tidsjaktRingProgress', 'tidsjaktRingPct', 'tidsjaktDoneText', 'tidsjaktStatsText',
  'tidsjaktNextText', 'tidsjaktRecordBadge', 'tidsjaktMissedWrap', 'tidsjaktMissed',
  'tidsjaktMissedMore', 'startTidsjaktBtn', 'tidsjaktCancelBtn', 'tidsjaktRetryBtn',
  'tidsjaktQuitBtn', 'exportScores-tidsjakt', 'importScoresBtn-tidsjakt',
  'importScoresFile-tidsjakt', 'clearScores-tidsjakt'].forEach(id => node(id))

// Element som är dolda redan i index.html måste vara dolda här också, annars
// testar skalet ett utgångsläge som inte finns i verkligheten.
;['tidsjaktFinished', 'tidsjaktCountdown', 'tidsjaktPraise', 'tidsjaktRecordChip', 'tidsjaktStreakChip',
  'tidsjaktFly', 'tidsjaktRecordBadge', 'tidsjaktMissedWrap',
  'tidsjaktMissedMore'].forEach(id => nodes[id].classList.add('hidden'))

// Topplistesegmentet: <ol> med en .hs-empty-syskonrad i en förälder.
const hsWrap = new El('div')
const scoreList = node('scoreList-tidsjakt')
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

// --- Styrbar klocka ---------------------------------------------------------
const RealDate = Date
let NOW = RealDate.parse('2026-07-25T10:00:00.000Z')
function FakeDate(...args){
  return args.length === 0 ? new RealDate(NOW) : new RealDate(...args)
}
FakeDate.now = () => NOW
FakeDate.parse = RealDate.parse
FakeDate.prototype = RealDate.prototype

let timerId = 1
const intervals = new Map()
const timeouts = new Map()

// Flyttar klockan framåt i 100 ms-steg och låter intervallen köra varje steg,
// precis som i webbläsaren (TIDSJAKT_TICK_MS = 100).
function advance(ms){
  let left = ms
  while(left > 0){
    const step = Math.min(100, left)
    NOW += step
    left -= step
    Array.from(intervals.keys()).forEach(id => {
      const t = intervals.get(id)
      if(t) t.fn()
    })
  }
}

// Kör väntande setTimeout-callbacks med fördröjning <= maxMs. Så kan testet
// släppa fram nästa fråga (180 ms) utan att också råka rensa berömmet (1400 ms).
function flush(maxMs){
  Array.from(timeouts.keys()).forEach(id => {
    const t = timeouts.get(id)
    if(t && t.ms <= maxMs){ timeouts.delete(id); t.fn() }
  })
}

/** Kör nedräkningen (3–2–1–Kör!) klart så att rundan verkligen startar.
 *  Utan den står varje test kvar i nedräkningen och svarar på en fråga som
 *  ännu inte visats. Tar inte i om startTidsjakt avbröt (tomt ämne). */
function runCountdown(){
  let varv = 0
  while(!nodes.tidsjaktCountdown.hidden() && varv++ < 8){
    NOW += 1000
    flush(1000)
  }
}

// --- Frågepool i testet ------------------------------------------------------
function mkQ(i, topic){
  return {
    id: 'q' + i, type: 'mc', topic: topic || 'osteologi_ben',
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
  // app.js-hjälpare: markerar ett besvarat alternativ med ✓/✗ OCH dold
  // skärmläsartext, så att utfallet inte förmedlas med enbart färg (WCAG 1.4.1).
  markAnswerBtn: (b, ok) => {
    b.classList.add(ok ? 'correct' : 'wrong')
    const mark = new El('span'); mark.className = 'answer-mark'; mark.textContent = ok ? '✓' : '✗'
    const sr = new El('span'); sr.className = 'sr-only'; sr.textContent = ok ? ' — rätt svar' : ' — fel svar'
    b.append(mark, sr)
  },
  shuffle: a => a.slice(),          // deterministisk ordning i tester
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
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', 'tidsjakt.js'), 'utf8'), ctx, { filename: 'js/tidsjakt.js' })

// Modulen kopplar sina egna knappar och tangentbordet i sin EGEN
// DOMContentLoaded (§12). Kör den, precis som webbläsaren gör, så att testet
// driver den riktiga uppkopplingen och inte bara funktionerna bakom den.
;(ctx._docListeners.DOMContentLoaded || []).forEach(fn => fn())

// Toppnivåns `let` i tidsjakt.js hamnar i kontextens lexikala scope, inte på
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

// Svara på frågan som visas: `correct` styr om rätt eller fel alternativ trycks.
function answerCurrent(correct){
  const target = nodes.tidsjaktChoices.children.find(c => String(c.dataset.choice).startsWith('Rätt') === correct)
  if(!target) throw new Error('inget alternativ att trycka på')
  target.click()
}

// Svara och släpp fram nästa fråga. Facitpausen är 180 ms vid rätt svar och
// 700 ms vid fel (då ska man hinna LÄSA rätt svar), så helpern släpper fram
// båda men rör inte berömmet (1400 ms).
function answer(correct){ answerCurrent(correct); flush(1000) }

const currentId = () => 'q' + (nodes.tidsjaktPrompt.textContent.match(/\d+/) || [''])[0]
const remaining = () => ev('tidsjaktRemainingMs()')

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
let pool = ctx.buildTidsjaktPool('osteologi_ben', null)
eq('bara spelbara MC/TF ur valt ämne', pool.map(q => q.id), ['q1', 'q2', 'q3'])

FLAGS = { q2: { excluded: true } }
eq('uteslutna frågor utelämnas', ctx.buildTidsjaktPool('osteologi_ben', null).map(q => q.id), ['q1', 'q3'])
FLAGS = {}

POOL = [mkQ(1), { ...mkQ(1), topic: 'osteologi_ben' }]
eq('samma topic|id räknas en gång', ctx.buildTidsjaktPool('osteologi_ben', null).length, 1)

// ============================================================================
section('Mjukt längdfilter')
// ============================================================================
const longQ = i => ({
  id: 'L' + i, type: 'mc', topic: 'osteologi_ben',
  prompt: 'F'.repeat(200) + '?', correct: 'R'.repeat(80), distractors: ['A'.repeat(80)]
})
POOL = [mkQ(1), mkQ(2), longQ(1), longQ(2)]
pool = ctx.buildTidsjaktPool('osteologi_ben', null)
eq('för få korta frågor → hela poolen spelas ändå', ctx.pickTidsjaktPool(pool).length, 4)

POOL = Array.from({ length: 14 }, (_, i) => mkQ(i + 1)).concat([longQ(9)])
pool = ctx.buildTidsjaktPool('osteologi_ben', null)
eq('tillräckligt med korta frågor → långa sorteras bort', ctx.pickTidsjaktPool(pool).map(q => q.id).includes('L9'), false)
eq('… och de korta blir kvar', ctx.pickTidsjaktPool(pool).length, 14)
ok('lång prompt räknas som långsam', ctx.tidsjaktIsQuick(longQ(1)) === false)
ok('kort fråga räknas som snabb', ctx.tidsjaktIsQuick(mkQ(1)) === true)

// Resten drivs i en async-omslutning: startTidsjakt() väntar på
// loadPoolForTopic(), och toppnivå-await finns inte i en CommonJS-fil.
;(async () => {
  // ============================================================================
  section('Start')
  // ============================================================================
  POOL = Array.from({ length: 30 }, (_, i) => mkQ(i + 1))
  await ctx.startTidsjakt(); runCountdown()
  eq('klockan startar på 60 s', remaining(), 60000)
  eq('klocktexten visar hela sekunder', nodes.tidsjaktClock.textContent, '60 s')
  eq('stapeln är full', nodes.tidsjaktClockFill.style.width, '100.00%')
  eq('spelarnamn', nodes.tidsjaktPlayerLabel.textContent, 'Testare')
  eq('ämnesrad med rundlängd', nodes.tidsjaktMeta.textContent, 'osteologi_ben · 60 sekunder')
  ok('startvyn döljs', nodes.setup.hidden())
  ok('spelvyn visas', !nodes.tidsjakt.hidden() && !nodes.tidsjaktPlay.hidden())
  ok('klart-vyn är dold', nodes.tidsjaktFinished.hidden())
  ok('förklaringen ligger hopfälld även för den som inte spelat förut', nodes.tidsjaktIntro.open === false)
  eq('första frågan visas', currentId(), 'q1')
  eq('fyra alternativ', nodes.tidsjaktChoices.children.length, 4)
  eq('poängen börjar på noll', nodes.tidsjaktScoreBadge.textContent, 'Rätt: 0')
  ok('rekordmärket är dolt utan tidigare resultat', nodes.tidsjaktRecordChip.hidden())
  ok('svitmärket är dolt vid start', nodes.tidsjaktStreakChip.hidden())
  eq('sidfotsräknaren uppmuntrar i stället för att visa 0', nodes.tidsjaktAnsweredLabel.textContent, 'Så många du hinner')

  // ============================================================================
  section('Rätt svar')
  // ============================================================================
  answer(true)
  eq('poängen ökar', nodes.tidsjaktScoreBadge.textContent, 'Rätt: 1')
  eq('poängen studsar', nodes.tidsjaktScoreBadge._class.has('bump'), true)
  eq('klockan är oförändrad av ett rätt svar', remaining(), 60000)
  eq('nästa fråga kommer direkt, utan knapptryck', currentId(), 'q2')
  eq('svarsräknaren i sidfoten', nodes.tidsjaktAnsweredLabel.textContent, '1 svar')
  answer(true)
  ok('svitmärket visas från två i rad', !nodes.tidsjaktStreakChip.hidden())
  eq('svitmärkets text', nodes.tidsjaktStreakChip.textContent, '🔥 2')

  // ============================================================================
  section('Fel svar')
  // ============================================================================
  answerCurrent(false)
  eq('facit tänds på rätt alternativ', nodes.tidsjaktChoices.children.some(c => c._class.has('correct')), true)
  eq('rätt svar bär ✓ och skärmläsartext, inte bara färg (WCAG 1.4.1)',
    nodes.tidsjaktChoices.children.find(c => c._class.has('correct')).textContent.includes('✓ — rätt svar'), true)
  eq('fel svar bär ✗ och skärmläsartext',
    nodes.tidsjaktChoices.children.find(c => c._class.has('wrong')).textContent.includes('✗ — fel svar'), true)
  eq('det valda felet märks upp', nodes.tidsjaktChoices.children.some(c => c._class.has('wrong') && c._class.has('shake')), true)
  eq('tidsstraff dras av', remaining(), 57000)
  eq('förlorad tid bokförs', ev('tidsjaktLostMs'), 3000)
  eq('sviten nollas', ev('tidsjaktStreak'), 0)
  ok('svitmärket döljs igen', nodes.tidsjaktStreakChip.hidden())
  eq('den missade frågan sparas med rätt svar', ev('tidsjaktMissed[0].correct'), 'Rätt 3')
  eq('… och med det man svarade', ev('tidsjaktMissed[0].chosen').startsWith('Fel 3'), true)
  eq('"−3 s" flyger ur klockan', nodes.tidsjaktFly.textContent, '−3 s')
  eq('facitpausen är längre vid fel svar', Array.from(timeouts.values()).some(t => t.ms === 700), true)
  flush(1000)
  eq('poängen står still efter ett fel', nodes.tidsjaktScoreBadge.textContent, 'Rätt: 2')

  // ============================================================================
  section('Svitbonus och beröm')
  // ============================================================================
  // Fyra rätt till ger en svit på 4 (sviten nollades av felet ovan).
  answer(true); answer(true); answer(true); answer(true)
  eq('ingen bonus före femte rätt', ev('tidsjaktEarnedMs'), 0)
  answerCurrent(true)
  eq('svitbonus läggs på klockan', remaining(), 60000)
  eq('intjänad tid bokförs', ev('tidsjaktEarnedMs'), 3000)
  eq('"+3 s" flyger ur klockan', nodes.tidsjaktFly.textContent, '+3 s')
  eq('berömmet är konkret', nodes.tidsjaktPraise.textContent, '🔥 5 i rad — +3 sekunder!')
  ok('berömmet syns', !nodes.tidsjaktPraise.hidden())
  flush(2000)
  ok('berömmet försvinner av sig självt', nodes.tidsjaktPraise.hidden())

  // Vidare till tio rätt → kvittens vid delmålet (sviten är då 8, så det är
  // delmålet och inte en bonus som utlöser berömmet).
  answer(true); answer(true)
  answerCurrent(true)
  eq('tio rätt totalt', ev('tidsjaktCorrect'), 10)
  eq('delmålskvittens vid tio rätt', nodes.tidsjaktPraise.textContent, '💪 10 rätt!')
  flush(2000)

  // ============================================================================
  section('Klockan')
  // ============================================================================
  eq('tiden räknas ned när den går', (advance(5000), remaining()), 55000)
  eq('klocktexten följer med', nodes.tidsjaktClock.textContent, '55 s')
  ok('ingen varningsfärg ännu', !nodes.tidsjaktClockRow._class.has('warn') && !nodes.tidsjaktClockRow._class.has('danger'))
  advance(41000)   // 14 s kvar
  ok('amber under 15 sekunder', nodes.tidsjaktClockRow._class.has('warn'))
  advance(10000)   // 4 s kvar
  ok('rött under 5 sekunder', nodes.tidsjaktClockRow._class.has('danger'))
  ok('inte längre amber', !nodes.tidsjaktClockRow._class.has('warn'))
  eq('tiondelar i slutspurten', nodes.tidsjaktClock.textContent, '4.0 s')
  eq('stapeln speglar återstående tid', nodes.tidsjaktClockFill.style.width, '6.67%')

  advance(4000)    // tiden ut
  ok('rundan avslutas när tiden är ute', !nodes.tidsjaktFinished.hidden())
  ok('spelvyn döljs', nodes.tidsjaktPlay.hidden())
  ok('sidfoten döljs', nodes.tidsjaktFooter.hidden())
  ok('förklaringen döljs i resultatvyn', nodes.tidsjaktIntro.hidden())
  eq('klockan står på noll', nodes.tidsjaktClock.textContent, '0.0 s')
  eq('inga intervall lämnas igång', intervals.size, 0)

  // ============================================================================
  section('Resultatvyn')
  // ============================================================================
  eq('rubriken redovisar rätt, svar och tid', nodes.tidsjaktDoneText.textContent,
    'Tiden är ute! 10 rätt av 11 svar på 60 sekunder.')
  eq('ringen visar träffsäkerhet', nodes.tidsjaktRingPct.textContent, '91 %')
  ok('nyckeltal utöver poängen: hastighet', nodes.tidsjaktStatsText.textContent.includes('s per rätt svar'))
  ok('… bästa svit', nodes.tidsjaktStatsText.textContent.includes('🔥 bästa svit 8'))
  ok('… intjänad tid', nodes.tidsjaktStatsText.textContent.includes('+3 s intjänat'))
  ok('… tidsstraff', nodes.tidsjaktStatsText.textContent.includes('−3 s i tidsstraff'))
  eq('första rundan i ämnet ger inget rekordmärke', nodes.tidsjaktRecordBadge.hidden(), true)
  eq('… men slutet pekar framåt', nodes.tidsjaktNextText.textContent,
    'Första rundan i det här ämnet — nu har du ett rekord att slå.')
  ok('missade frågor listas med facit', !nodes.tidsjaktMissedWrap.hidden())
  eq('en missad fråga', nodes.tidsjaktMissed.children.length, 1)
  ok('rätt svar står i listan', nodes.tidsjaktMissed.children[0].textContent.includes('Rätt 3'))
  ok('"och N till" behövs inte vid en enda miss', nodes.tidsjaktMissedMore.hidden())

  const saved = JSON.parse(store['hur_highscores_tidsjakt'])
  eq('resultatet sparas i eget fack', saved.length, 1)
  eq('… med poäng', saved[0].correct, 10)
  eq('… antal svar', saved[0].answered, 11)
  eq('… bästa svit', saved[0].streak, 8)
  eq('… ämne och etikett', [saved[0].topic, saved[0].topicLabel], ['osteologi_ben', 'osteologi_ben (MC)'])

  // ============================================================================
  section('Rekordet jagas under spelet')
  // ============================================================================
  await ctx.startTidsjakt(); runCountdown()
  ok('förklaringen ligger hopfälld för den som spelat förut', nodes.tidsjaktIntro.open === false)
  ok('förra rundans svitmärke är borta', nodes.tidsjaktStreakChip.hidden())
  ok('rekordmärket visas nu', !nodes.tidsjaktRecordChip.hidden())
  eq('… med rekordet att slå', nodes.tidsjaktRecordChip.textContent, 'Rekord 10')
  for(let i = 0; i < 10; i++) answer(true)
  eq('rekordet är inte slaget på lika', nodes.tidsjaktRecordChip.textContent, 'Rekord 10')
  answerCurrent(true)
  eq('rekordmärket byts när det slås', nodes.tidsjaktRecordChip.textContent, '🏆 Rekord slaget')
  ok('… och märket får sin klass', nodes.tidsjaktRecordChip._class.has('beaten'))
  eq('beröm mitt i rundan', nodes.tidsjaktPraise.textContent, '🏆 Nytt rekord!')
  ok('… i guldvarianten', nodes.tidsjaktPraise._class.has('gold'))
  flush(2000)
  answerCurrent(true)
  ok('rekordet firas bara en gång', nodes.tidsjaktPraise.hidden())
  flush(2000)

  // ============================================================================
  section('Tiden tar slut mitt i ett facit')
  // ============================================================================
  // Facit visas (locked) när klockan går ut → rundan får inte avslutas förrän
  // svaret hunnit visas, annars försvinner det framför ögonen.
  answerCurrent(true)
  advance(remaining() + 1000)   // svitbonusarna har förlängt rundan – räkna ut resten
  ok('rundan väntar in facit', nodes.tidsjaktFinished.hidden())
  eq('avslut i kö', ev('tidsjaktPendingEnd'), true)
  flush(1000)
  ok('… och avslutas när facit visats', !nodes.tidsjaktFinished.hidden())
  ok('rekordmärke i resultatvyn när rekordet slogs', !nodes.tidsjaktRecordBadge.hidden())
  ok('resultattexten nämner förra rekordet', nodes.tidsjaktNextText.textContent.includes('förra rekordet var 10'))
  ok('inga missade frågor att lista', nodes.tidsjaktMissedWrap.hidden())

  // ============================================================================
  section('Många missade frågor')
  // ============================================================================
  await ctx.startTidsjakt(); runCountdown()
  for(let i = 0; i < 10; i++) answer(false)
  advance(60000)
  eq('högst åtta missade frågor listas', nodes.tidsjaktMissed.children.length, 8)
  ok('resten summeras', !nodes.tidsjaktMissedMore.hidden())
  eq('… med antalet', nodes.tidsjaktMissedMore.textContent, '… och 2 till.')
  eq('noll rätt ger 0 % i ringen', nodes.tidsjaktRingPct.textContent, '0 %')
  ok('hastighetsnyckeltalet utelämnas utan rätt svar', !nodes.tidsjaktStatsText.textContent.includes('per rätt svar'))
  ok('rekordet ligger kvar när det inte slogs', nodes.tidsjaktRecordBadge.hidden())
  // Noll rätt → det krävs rekordet + 1 för att slå det.
  ok('texten säger vad som krävs', nodes.tidsjaktNextText.textContent.includes(`${ev('tidsjaktPriorBest') + 1} fler nästa gång`))

  // ============================================================================
  section('Frågeleken')
  // ============================================================================
  POOL = [mkQ(1), mkQ(2), mkQ(3)]
  await ctx.startTidsjakt(); runCountdown()
  eq('leken börjar om från början', currentId(), 'q1')
  answer(true); answer(true); answer(true)
  eq('leken slumpas om när den tar slut', currentId(), 'q1')
  ev('tidsjaktDeckIdx = 999')
  ev('tidsjaktCurrent = tidsjaktPool[0]')
  ok('samma fråga kommer aldrig två gånger i rad', ctx.drawTidsjaktQuestion() !== ev('tidsjaktPool[0]'))

  // ============================================================================
  section('Sant/falskt')
  // ============================================================================
  POOL = [{ id: 't1', type: 'tf', topic: 'osteologi_ben', prompt: 'Femur är ett långben.', correct: 'Sant', distractors: ['Falskt'] }]
  await ctx.startTidsjakt(); runCountdown()
  eq('två alternativ i naturlig ordning', nodes.tidsjaktChoices.children.map(c => c.textContent), ['Sant', 'Falskt'])
  ok('rutnätet läggs om till en rad', nodes.tidsjaktChoices._class.has('two'))
  nodes.tidsjaktChoices.children[0].click()
  flush(1000)
  eq('rätt svar räknas', nodes.tidsjaktScoreBadge.textContent, 'Rätt: 1')

  // ============================================================================
  section('Tangentbord')
  // ============================================================================
  POOL = Array.from({ length: 5 }, (_, i) => mkQ(i + 1))
  await ctx.startTidsjakt(); runCountdown()
  const keydown = ctx._docListeners.keydown[0]
  keydown({ key: '1', preventDefault(){} })
  flush(1000)
  eq('siffertangent svarar', nodes.tidsjaktAnsweredLabel.textContent, '1 svar')
  keydown({ key: '9', preventDefault(){} })
  eq('tangent utan alternativ gör inget', nodes.tidsjaktAnsweredLabel.textContent, '1 svar')

  // ============================================================================
  section('Avbryt')
  // ============================================================================
  const scoresBefore = JSON.parse(store['hur_highscores_tidsjakt']).length
  ctx.confirmAnswer = true
  ctx.cancelTidsjakt()
  ok('spelvyn stängs', nodes.tidsjakt.hidden())
  ok('startvyn kommer tillbaka', !nodes.setup.hidden())
  eq('klockan stoppas', intervals.size, 0)
  eq('ett avbrutet pass sparas inte', JSON.parse(store['hur_highscores_tidsjakt']).length, scoresBefore)

  // ============================================================================
  section('Topplistan')
  // ============================================================================
  store['hur_highscores_tidsjakt'] = JSON.stringify([
    { name: 'A', topic: 'osteologi_ben', topicLabel: 'Ben (MC)', correct: 12, answered: 20, streak: 4, durationMs: 60000, date: '2026-07-20T10:00:00.000Z' },
    { name: 'B', topic: 'osteologi_ben', topicLabel: 'Ben (MC)', correct: 18, answered: 20, streak: 9, durationMs: 66000, date: '2026-07-21T10:00:00.000Z' },
    { name: 'C', topic: 'osteologi_ben', topicLabel: 'Ben (MC)', correct: 18, answered: 24, streak: 7, durationMs: 60000, date: '2026-07-22T10:00:00.000Z' }
  ])
  ctx.renderTidsjaktScores()
  eq('flest rätt först, träffsäkerhet som utslag', scoreList.children.map(li => li.children[1].textContent), ['B', 'C', 'A'])
  ok('tomraden döljs när det finns resultat', hsEmpty._class.has('hidden'))
  ok('poängen står i listan', scoreList.children[0].textContent.includes('18 rätt'))
  // Rad 3 (A) ligger på 60 % → märks som svag; rad 2 (C) på exakt 75 % gör det inte.
  ok('svag träffsäkerhet märks upp', scoreList.children[2].children[4]._class.has('weak'))
  ok('… men inte precis på gränsen 75 %', !scoreList.children[1].children[4]._class.has('weak'))
  eq('personbästa läses per ämne', ctx.tidsjaktBestFor('osteologi_ben'), 18)
  eq('… och inte över ämnesgränsen', ctx.tidsjaktBestFor('muskler_arm'), 0)

  store['hur_highscores_tidsjakt'] = JSON.stringify([])
  ctx.renderTidsjaktScores()
  ok('tomraden visas när listan är tom', !hsEmpty._class.has('hidden'))
  eq('inga rader ritas', scoreList.children.length, 0)

  // ============================================================================
  section('Export, import och rensa')
  // ============================================================================
  ctx.lastAlert = null
  ctx.exportTidsjaktScores()
  eq('tom lista går inte att exportera', typeof ctx.lastAlert, 'string')

  store['hur_highscores_tidsjakt'] = JSON.stringify([
    { name: 'A', topic: 'osteologi_ben', topicLabel: 'Ben (MC)', correct: 12, answered: 20, streak: 4, durationMs: 60000, date: '2026-07-20T10:00:00.000Z' }
  ])
  ctx.exportTidsjaktScores()
  eq('exportens typmärkning', ctx.lastDownload.type, 'anatomiquiz-tidsjakt')
  eq('… innehåller resultaten', ctx.lastDownload.scores.length, 1)
  ok('filnamnet är begripligt', String(ctx.lastDownloadName).startsWith('anatomiquiz-motklockan-'))

  // Import: samma resultat två gånger ska bara läggas till en gång.
  function importPayload(payload){
    ctx.FileReader = function(){
      this.readAsText = () => { this.result = JSON.stringify(payload); this.onload() }
    }
    const fileEv = { target: { files: [{ name: 'x.json' }], value: 'x' } }
    ctx.handleImportTidsjaktScores(fileEv)
  }
  importPayload({ type: 'anatomiquiz-tidsjakt', scores: [
    { name: 'A', topic: 'osteologi_ben', correct: 12, answered: 20, date: '2026-07-20T10:00:00.000Z' },
    { name: 'B', topic: 'osteologi_ben', correct: 7, answered: 9, date: '2026-07-23T10:00:00.000Z' }
  ] })
  eq('dubbletten hoppas över, det nya läggs till', JSON.parse(store['hur_highscores_tidsjakt']).length, 2)
  ok('importen redovisas', String(ctx.lastAlert).includes('Tillagda resultat: 1'))

  importPayload({ type: 'nagot-annat', scores: [] })
  ok('fel filformat avvisas', String(ctx.lastAlert).includes('Fel format'))

  ctx.confirmAnswer = true
  ctx.clearTidsjaktScoresFlow()
  eq('rensning tömmer facket', store['hur_highscores_tidsjakt'], undefined)

  // ============================================================================
  section('Startknappen speglar ämnet')
  // ============================================================================
  ctx.caps = { mc: false, tf: false, fc: true }
  ctx.updateTidsjaktButton()
  ok('skuggad för rena flashcard-ämnen', nodes.startTidsjaktBtn.disabled === true)
  ctx.caps = { mc: false, tf: true, fc: false }
  ctx.updateTidsjaktButton()
  ok('aktiv för sant/falskt-ämnen', nodes.startTidsjaktBtn.disabled === false)
  ctx.caps = { mc: true, tf: false, fc: false }
  ctx.updateTidsjaktButton()
  ok('aktiv för flervalsämnen', nodes.startTidsjaktBtn.disabled === false)

  // ============================================================================
  section('Ämne utan spelbara frågor')
  // ============================================================================
  POOL = [{ id: 'f1', type: 'fc', topic: 'osteologi_ben', prompt: 'Kort', correct: 'Svar' }]
  ctx.lastAlert = null
  await ctx.startTidsjakt(); runCountdown()
  ok('spelaren får veta varför det inte går', String(ctx.lastAlert).includes('inga flervals'))

  // ============================================================================
  section('Nedräkningen före start')
  // ============================================================================
  // Klockan startade tidigare när vyn ritades, så allt som mötte spelaren först
  // åt riktiga sekunder ur de 60. Nedräkningen ska ge en definierad start.
  POOL = [mkQ(1), mkQ(2), mkQ(3), mkQ(4), mkQ(5)]
  await ctx.startTidsjakt()

  ok('nedräkningen visas direkt', !nodes.tidsjaktCountdown.hidden())
  ok('frågekortet är dolt under nedräkningen', nodes.tidsjaktCard.hidden())
  eq('den börjar på 3', nodes.tidsjaktCountdownNr.textContent, '3')
  ok('inga tryck räknas innan start', ev('tidsjaktLocked') === true)
  ok('klockan visar full tid under nedräkningen',
     Math.abs(ctx.tidsjaktRemainingMs() - 60000) < 1200)

  NOW += 1000; flush(1000)
  eq('räknar ned till 2', nodes.tidsjaktCountdownNr.textContent, '2')
  NOW += 1000; flush(1000)
  eq('räknar ned till 1', nodes.tidsjaktCountdownNr.textContent, '1')
  NOW += 1000; flush(1000)
  eq('avslutas med Kör!', nodes.tidsjaktCountdownNr.textContent, 'Kör!')
  ok('rundan har fortfarande inte börjat', nodes.tidsjaktCard.hidden())

  NOW += 1000; flush(1000)
  ok('nedräkningen försvinner när rundan börjar', nodes.tidsjaktCountdown.hidden())
  ok('frågekortet visas', !nodes.tidsjaktCard.hidden())
  ok('spelaren kan svara', ev('tidsjaktLocked') === false)

  // Kärnan i hela fixen: de 4 sekunderna ovan får inte ha kostat speltid.
  const kvar = ctx.tidsjaktRemainingMs()
  ok(`hela minuten är kvar när rundan börjar (${kvar} ms)`, Math.abs(kvar - 60000) < 150)

  // Avbryt mitt i nedräkningen får inte starta en runda i en dold vy.
  await ctx.startTidsjakt()
  ok('ny nedräkning igång', !nodes.tidsjaktCountdown.hidden())
  ctx.confirmAnswer = true
  ctx.cancelTidsjakt()
  NOW += 5000; flush(1000); flush(1000); flush(1000); flush(1000)
  ok('avbruten nedräkning startar ingen klocka', ev('tidsjaktClockInterval') === null)
  ok('vyn förblir dold', nodes.tidsjakt.hidden())

  // ============================================================================
  console.log(`\n${pass} godkända, ${fail} misslyckade`)
  process.exit(fail === 0 ? 0 : 1)
})()
