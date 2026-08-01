/* =========================================================
   test_pop.js — tester för arkadläget "Arcade: Pop!"
   =========================================================
   Körs med:  node scripts/test_pop.js
   Avslutar med kod 0 när allt är grönt, annars 1.

   Ett minimalt DOM-skal gör att js/pop.js kan köras och drivas på riktigt utan
   webbläsare – testerna träffar alltså den kod som faktiskt levereras, inte en
   kopia av logiken. app.js hjälpare (el, shuffle, loadPoolForTopic,
   topicMatchesSelection …) stubbas, eftersom de testas via quizet.

   TVÅ SAKER ÄR STYRBARA, och båda måste vara det:
     * KLOCKAN (Date, setInterval, setTimeout) – nedräkning, tidsstraff och
       "tiden tog slut" går annars inte att testa utan att vänta i verklig tid.
     * BILDRUTORNA (requestAnimationFrame köas i stället för att köras direkt) –
       bubbelfysiken stegas manuellt med känd delta-tid. Kördes rAF direkt, som
       i de äldre testskalen, skulle popFrame() rekursera i all oändlighet.

   Skalet modellerar DOM-trädet, händelserna och fysikens matematik, INTE
   layouten. Att bubblorna ser runda ut, att glansen sitter rätt eller att
   ordet ryms i bubblan kan det omöjligt fånga – det kräver visuell kontroll i
   webbläsare (CLAUDE_REGLER §13.1).

   Kör det här skriptet efter varje ändring i js/pop.js.
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
    this._rect = { width: 0, height: 0, top: 0, left: 0 }
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
  remove(){ if(this.parent) this.parent.children = this.parent.children.filter(c => c !== this) }
  get parentElement(){ return this.parent || null }
  setAttribute(k, v){ this._attrs[k] = String(v) }
  getAttribute(k){ return this._attrs[k] }
  addEventListener(t, fn){ (this._listeners[t] = this._listeners[t] || []).push(fn) }
  dispatch(t){ (this._listeners[t] || []).forEach(fn => fn.call(this, { preventDefault(){} })) }
  click(){ this.dispatch('click') }
  focus(){}
  getBoundingClientRect(){ return this._rect }
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

;['setup', 'highscores', 'quiz', 'pop', 'popStage', 'popFinished',   'popPlayerLabel', 'popMeta', 'popPrompt', 'popField', 'popClockRow', 'popClockFill',
  'popClock', 'popScoreBadge', 'popStreakChip', 'popRecordChip', 'popCountdown',
  'popCountdownNr', 'popFly', 'popPraise', 'popRingProgress', 'popRingPct',
  'popStart', 'popStartRules', 'popStartBtn',
  'popDoneText', 'popStatsText', 'popNextText', 'popRecordBadge', 'popMissedWrap',
  'popMissed', 'popMissedMore', 'startPopBtn', 'popRetryBtn', 'popQuitBtn', 'popCancelBtn',
  'exportScores-pop', 'importScoresBtn-pop', 'importScoresFile-pop',
  'clearScores-pop'].forEach(id => node(id))

// Element som är dolda redan i index.html måste vara dolda här också, annars
// testar skalet ett utgångsläge som inte finns i verkligheten.
;['pop', 'popFinished', 'popCountdown', 'popPraise', 'popStreakChip', 'popRecordChip',
  'popFly', 'popRecordBadge', 'popMissedWrap', 'popMissedMore',
  'popStart'].forEach(id => nodes[id].classList.add('hidden'))

// Spelytans mått. js/pop.js läser dem med getBoundingClientRect.
const FIELD_W = 320, FIELD_H = 420
nodes.popField._rect = { width: FIELD_W, height: FIELD_H, top: 0, left: 0 }

// Topplistesegmentet: <ol> med en .hs-empty-syskonrad i en förälder.
const hsWrap = new El('div')
const scoreList = node('scoreList-pop')
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
let NOW = RealDate.parse('2026-08-01T10:00:00.000Z')
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
// precis som i webbläsaren (POP_TICK_MS = 100).
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
// släppa fram nästa fråga (150 ms) utan att också råka rensa berömmet (1100 ms).
function flush(maxMs){
  Array.from(timeouts.keys()).forEach(id => {
    const t = timeouts.get(id)
    if(t && t.ms <= maxMs){ timeouts.delete(id); t.fn() }
  })
}

// --- Styrbara bildrutor ------------------------------------------------------
let rafQueue = []
let FRAME_TS = 0
function frame(dtMs){
  const q = rafQueue
  rafQueue = []
  FRAME_TS += dtMs
  q.forEach(r => r.fn(FRAME_TS))
}
function frames(n, dtMs){ for(let i = 0; i < n; i++) frame(dtMs) }

/** Tryck "Kör!" och kör nedräkningen (3–2–1) klart så att rundan startar. */
function pressStart(){ nodes.popStartBtn.dispatch('click') }
function runCountdown(){
  pressStart()
  let varv = 0
  while(!nodes.popCountdown.hidden() && varv++ < 10){
    NOW += 800
    flush(800)
  }
}

// --- Frågepool i testet ------------------------------------------------------
function mkQ(i, topic){
  return {
    id: 'q' + i, type: 'mc', topic: topic || 'osteologi_ben',
    prompt: `Fråga ${i}?`, correct: `Rätt${i}`, distractors: [`Fel${i}a`, `Fel${i}b`, `Fel${i}c`]
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
  // KÖAS, körs inte direkt: annars rekurserar popFrame() i all oändlighet.
  requestAnimationFrame: fn => { const id = timerId++; rafQueue.push({ id, fn }); return id },
  cancelAnimationFrame: id => { rafQueue = rafQueue.filter(r => r.id !== id) },
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
  loadFlags: () => FLAGS,
  loadPoolForTopic: async () => null,
  topicMatchesSelection: (q, topic) => q.topic === topic,
  topicLabelFor: t => t + ' (MC)',
  eduAbbrevFor: () => '',
  warnStorageUnavailable: () => { ctx.storageWarned = true },
  downloadJsonBlob: (payload, name) => { ctx.lastDownload = payload; ctx.lastDownloadName = name },
  topicCapabilities: () => ctx.caps,
  caps: { mc: true, tf: false, fc: false },
  fitActiveView: () => {},
  GM_RING_CIRCUMFERENCE: 326.7,
  get allQuestions(){ return POOL }
}
ctx.window = {
  matchMedia: () => ({ matches: ctx.reducedMotion === true }),
  scrollTo: () => {},
  addEventListener: () => {},
  AudioContext: undefined,
  webkitAudioContext: undefined
}
ctx.window.window = ctx.window
ctx.globalThis = ctx
vm.createContext(ctx)

// Slumpen görs deterministisk INNAN modulen laddas. Bubblornas placering och
// hastighet dras med Math.random, och ett testresultat som beror på tur är
// inget testresultat — den här sviten föll i ungefär varannan körning innan
// fröet sattes.
vm.runInContext(`(function(){
  let s = 20260801
  Math.random = function(){ s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 }
})()`, ctx)

vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', 'pop.js'), 'utf8'), ctx, { filename: 'js/pop.js' })

// Modulen kopplar sina egna knappar i sin EGEN DOMContentLoaded (§12). Kör den,
// precis som webbläsaren gör, så att testet driver den riktiga uppkopplingen.
;(ctx._docListeners.DOMContentLoaded || []).forEach(fn => fn())

// Toppnivåns `let` i pop.js hamnar i kontextens lexikala scope, inte på
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

// --- Hjälpare för spelplanen -------------------------------------------------
function bubbleNodes(){
  return nodes.popField.children.filter(c => c._class.has('pop-bubble'))
}
function popBubble(correct){
  const target = bubbleNodes().find(c => c.textContent.startsWith('Rätt') === correct)
  if(!target) throw new Error('ingen bubbla att poppa (correct=' + correct + ')')
  target.dispatch('pointerdown')
}
/** Poppa och släpp fram nästa fråga (150 ms vid rätt, 640 ms vid fel). */
function popAndAdvance(correct){ popBubble(correct); flush(700) }

const currentId = () => 'q' + (nodes.popPrompt.textContent.match(/\d+/) || [''])[0]
const remaining = () => ev('popRemainingMs()')

;(async () => {
// ============================================================================
section('Poolbygge — bara spelbara MC-frågor')
// ============================================================================
POOL = [
  mkQ(1), mkQ(2),
  { id: 'q3', type: 'tf', topic: 'osteologi_ben', prompt: 'Sant?', correct: 'Sant', distractors: ['Falskt'] }, // TF – ej med
  { id: 'q4', type: 'fc', topic: 'osteologi_ben', prompt: 'Kort', correct: 'Svar' },                            // flashcard – ej med
  { id: 'q5', type: 'mc', topic: 'osteologi_ben', prompt: 'Bild', correct: 'A', distractors: ['B'], image: 'x' },// bildfråga – ej med
  { id: 'ph001', type: 'mc', topic: 'osteologi_ben', prompt: 'P', correct: 'A', distractors: ['B'] },            // placeholder – ej med
  { id: 'q6', type: 'mc', topic: 'osteologi_ben', prompt: 'Utan distraktorer', correct: 'A' },                   // ofullständig – ej med
  mkQ(7, 'muskler_arm')                                                                                          // annat ämne – ej med
]
eq('bara MC ur valt ämne (TF utelämnas medvetet)',
  ctx.buildPopPool('osteologi_ben', null).map(q => q.id), ['q1', 'q2'])

FLAGS = { q2: { excluded: true } }
eq('uteslutna frågor utelämnas', ctx.buildPopPool('osteologi_ben', null).map(q => q.id), ['q1'])
FLAGS = {}

POOL = [mkQ(1), { ...mkQ(1), topic: 'osteologi_ben' }]
eq('samma fråga via flera ämnesvägar räknas en gång',
  ctx.buildPopPool('osteologi_ben', null).length, 1)

// ============================================================================
section('Ordfiltret — svaret ska få plats i en bubbla')
// ============================================================================
ok('ett ord godkänns', ctx.popOptionFits('kraniet', 2, 22))
ok('två ord godkänns', ctx.popOptionFits('os coxae', 2, 22))
ok('tre ord underkänns', !ctx.popOptionFits('a b c', 2, 22))
ok('för långt ord underkänns', !ctx.popOptionFits('gastroesofagealreflux', 2, 12))
ok('tomt underkänns', !ctx.popOptionFits('   ', 2, 22))

const kort = mkQ(1)
const langt = { ...mkQ(2), correct: 'ett väldigt långt svar med många ord' }
const langPrompt = { ...mkQ(3), prompt: 'x'.repeat(200) }
ok('kort fråga passerar', ctx.popIsShort(kort, 2, 22))
ok('långt svar underkänns', !ctx.popIsShort(langt, 2, 22))
ok('för lång frågetext underkänns', !ctx.popIsShort(langPrompt, 2, 22))

// Mjuk lättnad: hellre ett steg lösare filter än ett ospelbart ämne.
const treOrd = i => ({ id: 't' + i, type: 'mc', topic: 'x', prompt: 'F?', correct: 'ett två tre', distractors: ['a b c', 'd e f', 'g h i'] })
const treOrdiga = [1, 2, 3, 4, 5, 6, 7].map(treOrd)
eq('för få strikt korta → lättat filter används', ctx.pickPopPool(treOrdiga).length, 7)
const strikta = [1, 2, 3, 4, 5, 6, 7].map(i => mkQ(i))
eq('tillräckligt många strikt korta → strikt filter', ctx.pickPopPool(strikta).length, 7)

// ============================================================================
section('Leken — aldrig samma fråga två gånger i rad')
// ============================================================================
POOL = [mkQ(1), mkQ(2), mkQ(3)]
ev('popPool = [{id:"a"},{id:"b"},{id:"c"}]')
ev('popCurrent = null')
ev('refillPopDeck()')
eq('leken fylls med hela poolen', ev('popDeck.length'), 3)
// shuffle är identitet i testet, så utan skyddet skulle "c" följas av "a"…"c".
ev('popCurrent = popPool[0]')
ev('refillPopDeck()')
ok('samma fråga hamnar inte först igen', ev('popDeck[0].id') !== 'a', ev('popDeck.map(q=>q.id)'))

// ============================================================================
section('Rundstart och nedräkning')
// ============================================================================
POOL = [mkQ(1), mkQ(2), mkQ(3), mkQ(4), mkQ(5), mkQ(6), mkQ(7), mkQ(8)]
nodes.popField.children = []
await ctx.startPop()
ok('setup döljs', nodes.setup.hidden())
ok('spelvyn visas', !nodes.pop.hidden())
ok('nedräkningen har INTE börjat innan spelaren tryckt', nodes.popCountdown.hidden())
ok('klockan står på full tid under nedräkningen', remaining() === 60000, remaining())
ok('inga bubblor innan rundan börjat', bubbleNodes().length === 0, bubbleNodes().length)
ok('startrutan visas', !nodes.popStart.hidden())
ok('reglerna visas för den som aldrig spelat', !nodes.popStartRules.hidden())

runCountdown()
ok('nedräkningen döljs när rundan startar', nodes.popCountdown.hidden())
ok('rundan är igång', ev('popRunning'))
eq('fyra bubblor på planen', bubbleNodes().length, 4)
eq('första frågan visas', currentId(), 'q1')

// ============================================================================
section('Bubbelfysik')
// ============================================================================
const inomFaltet = () => ev(`popBubbles.every(b => b.x >= 0 && b.y >= 0 && b.x + b.size <= ${FIELD_W} + 0.001 && b.y + b.size <= ${FIELD_H} + 0.001)`)
ok('bubblorna startar inom spelytan', ev('popBubbles.length') === 4 && inomFaltet(), ev('popBubbles.length'))
ok('bubblorna har en hastighet', ev('popBubbles.length > 0 && popBubbles.every(b => Math.hypot(b.vx, b.vy) > 0)'))

frames(120, 16)
ok('bubblorna håller sig inom spelytan efter 120 bildrutor', ev('popBubbles.length') === 4 && inomFaltet(),
  ev('popBubbles.map(b => [Math.round(b.x), Math.round(b.y), b.size])'))

// Studs: en bubbla som skickas ut genom vänsterkanten ska vända.
ev('popBubbles[0].x = 1; popBubbles[0].vx = -400; popBubbles[0].vy = 0')
ev('stepPopBubbles(0.05)')
ok('bubblan studsar mot vänsterkanten', ev('popBubbles[0].vx') > 0, ev('popBubbles[0].vx'))
ok('bubblan hamnar inte utanför kanten', ev('popBubbles[0].x') >= 0, ev('popBubbles[0].x'))

// Separation: två bubblor ovanpå varandra ska knuffas isär.
const parAvstand = () => ev('Math.hypot((popBubbles[0].x+popBubbles[0].size/2)-(popBubbles[1].x+popBubbles[1].size/2), (popBubbles[0].y+popBubbles[0].size/2)-(popBubbles[1].y+popBubbles[1].size/2))')
const parMin = () => ev('(popBubbles[0].size + popBubbles[1].size) / 2')

// Mitt i fältet, långt från kanterna: här ÄR full separation vad motorn lovar.
ev('popBubbles.forEach(b => { b.vx = 0; b.vy = 0 })')
ev('popBubbles[0].x = 120; popBubbles[0].y = 170; popBubbles[1].x = 124; popBubbles[1].y = 170')
ev('separatePopBubbles()')
ok('överlappande bubblor mitt i fältet knuffas helt isär', parAvstand() >= parMin() - 0.001,
  { avstand: parAvstand(), minAvstand: parMin() })

// Hörnfallet, som avslöjade den riktiga motorbristen: klampningen mot kanten
// åt tidigare upp separationen igen, så bubblorna låg kvar ovanpå varandra.
ev('popBubbles.forEach(b => { b.vx = 0; b.vy = 0 })')
ev('popBubbles[0].x = 0; popBubbles[0].y = 0; popBubbles[1].x = 3; popBubbles[1].y = 3')
ev('separatePopBubbles()')
ok('överlappande bubblor i ett hörn knuffas isär', parAvstand() >= parMin() - 0.001,
  { avstand: parAvstand(), minAvstand: parMin() })
ok('och båda ligger kvar innanför kanterna', inomFaltet(),
  ev('popBubbles.map(b => [Math.round(b.x), Math.round(b.y), b.size])'))

// ============================================================================
section('Poppa rätt bubbla')
// ============================================================================
const forePoang = ev('popScore')
popBubble(true)
eq('poängen ökar', ev('popScore'), forePoang + 1)
eq('sviten ökar', ev('popStreak'), 1)
ok('den poppade bubblan är markerad burst', bubbleNodes().some(b => b._class.has('burst')))
ok('rätt/fel förmedlas inte med enbart färg (✓ finns)',
  bubbleNodes().some(b => b.textContent.includes('✓')))
ok('övriga bubblor tonas ut', bubbleNodes().filter(b => b._class.has('fade')).length === 3,
  bubbleNodes().map(b => b.className))
ok('inget nytt tryck går fram medan facit visas', ev('popLocked'))

flush(200)
eq('ny fråga kommer utan Nästa-knapp', currentId(), 'q2')
eq('nya bubblor byggs', bubbleNodes().length, 4)
ok('klockan är orörd av ett rätt svar', remaining() > 59000, remaining())

// ============================================================================
section('Poppa fel bubbla')
// ============================================================================
const foreFel = remaining()
popBubble(false)
eq('sviten nollställs', ev('popStreak'), 0)
ok('tre sekunder försvinner', foreFel - remaining() >= 3000, { foreFel, nu: remaining() })
ok('den felpoppade bubblan är markerad miss', bubbleNodes().some(b => b._class.has('miss')))
ok('✗ sätts på den felpoppade', bubbleNodes().some(b => b.textContent.includes('✗')))
ok('rätt bubbla avslöjas med reveal', bubbleNodes().some(b => b._class.has('reveal')))
ok('rätt bubbla får ✓', bubbleNodes().some(b => b._class.has('reveal') && b.textContent.includes('✓')))
eq('frågan hamnar i missade', ev('popMissed.length'), 1)
eq('missade sparar rätt svar', ev('popMissed[0].correct'), 'Rätt2')

flush(700)
eq('ny fråga även efter fel', currentId(), 'q3')

// Ett andra tryck under facit får inte räknas.
const svarFore = ev('popAnswered')
popBubble(true)
popBubble(false)
eq('bara ett svar räknas per fråga', ev('popAnswered'), svarFore + 1)
flush(700)

// ============================================================================
section('Svit, beröm och rekordbricka')
// ============================================================================
ev('popStreak = 4; popScore = 4')
popBubble(true)
eq('femte rätt i rad ger svit 5', ev('popStreak'), 5)
ok('beröm visas vid delmål', !nodes.popPraise.hidden())
ok('berömmet nämner sviten', nodes.popPraise.textContent.includes('5'))
ok('svitbrickan visas', !nodes.popStreakChip.hidden())
flush(200)

// Berömmet ska försvinna av sig självt.
flush(1200)
ok('berömmet tas bort igen', nodes.popPraise.hidden())

// ============================================================================
section('Klockan tar slut')
// ============================================================================
advance(61000)
ok('rundan avslutas när tiden är ute', !ev('popRunning'))
ok('klart-vyn visas', !nodes.popFinished.hidden())
ok('spelplanen döljs', nodes.popStage.hidden())
ok('startrutan döljs i klart-vyn', nodes.popStart.hidden())
ok('resultattexten nämner antalet', nodes.popDoneText.textContent.includes('poppade'))
ok('missade frågor listas', !nodes.popMissedWrap.hidden())
ok('bildruteslingan är stoppad', ev('popRafId') === null)

// ============================================================================
section('Lagring och topplista')
// ============================================================================
const sparade = JSON.parse(store['hur_highscores_pop'] || '[]')
eq('resultatet sparas', sparade.length, 1)
ok('poängen sparas', typeof sparade[0].score === 'number')
eq('ämnet sparas', sparade[0].topic, 'osteologi_ben')

ctx.renderPopScores()
ok('topplistan får en rad', nodes['scoreList-pop'].children.length === 1)
ok('tomtexten döljs när det finns resultat', hsEmpty.hidden())

// ============================================================================
section('Rekord — personbästa i ÄMNET')
// ============================================================================
store['hur_highscores_pop'] = JSON.stringify([
  { name: 'A', topic: 'osteologi_ben', score: 12, answered: 14, streak: 4, durationMs: 60000, date: '2026-07-01T10:00:00.000Z' },
  { name: 'A', topic: 'annat_amne', score: 99, answered: 99, streak: 9, durationMs: 60000, date: '2026-07-02T10:00:00.000Z' }
])
eq('bästa i ämnet läses, inte bästa överlag', ctx.popBestFor('osteologi_ben'), 12)
eq('okänt ämne ger noll', ctx.popBestFor('finns_inte'), 0)

nodes.popField.children = []
await ctx.startPop()
runCountdown()
ok('spökmålet visas när det finns ett rekord', !nodes.popRecordChip.hidden())
ok('spökmålet visar rekordet', nodes.popRecordChip.textContent.includes('12'))

// Slå rekordet: 13 rätt.
ev('popScore = 12')
popBubble(true)
ok('rekordet noteras direkt när det slås', ev('popRecordBeaten'))
ok('brickan byter till slaget', nodes.popRecordChip.textContent.includes('slaget'))
flush(200)
advance(61000)
ok('rekordmärket visas i klart-vyn', !nodes.popRecordBadge.hidden())

// ============================================================================
section('Reducerad rörelse')
// ============================================================================
ctx.reducedMotion = true
nodes.popField.children = []
store['hur_highscores_pop'] = '[]'
await ctx.startPop()
runCountdown()
ok('bubblorna står stilla vid reducerad rörelse', ev('popBubbles.length > 0 && popBubbles.every(b => b.vx === 0 && b.vy === 0)'))
ok('men går fortfarande att poppa', (() => { const f = ev('popScore'); popBubble(true); return ev('popScore') === f + 1 })())
flush(200)
ctx.reducedMotion = false

// ============================================================================
section('Avbryt mitt i rundan')
// ============================================================================
POOL = [mkQ(1), mkQ(2), mkQ(3), mkQ(4), mkQ(5), mkQ(6), mkQ(7), mkQ(8)]
nodes.popField.children = []
nodes.popFinished.classList.add('hidden')
store['hur_highscores_pop'] = '[]'
await ctx.startPop()
runCountdown()
ok('rundan är igång före avbrytet', ev('popRunning'))

ctx.confirmAnswer = false
nodes.popCancelBtn.dispatch('click')
ok('nej i bekräftelsen låter rundan fortsätta', ev('popRunning'))
ok('spelvyn är kvar', !nodes.pop.hidden())

ctx.confirmAnswer = true
nodes.popCancelBtn.dispatch('click')
ok('ja i bekräftelsen stoppar rundan', !ev('popRunning'))
ok('spelvyn döljs', nodes.pop.hidden())
ok('startvyn visas igen', !nodes.setup.hidden())
ok('klart-vyn visas INTE (avbrott är inget resultat)', nodes.popFinished.hidden())
eq('inget resultat sparas för en avbruten runda',
  JSON.parse(store['hur_highscores_pop'] || '[]').length, 0)
ok('bildruteslingan är stoppad', ev('popRafId') === null)

// Klockan får inte fortsätta ticka i bakgrunden efter avbrottet.
advance(61000)
ok('klockan avslutar inte rundan i efterhand', nodes.popFinished.hidden())

// ============================================================================
section('Tomt/otillräckligt ämne')
// ============================================================================
POOL = [{ id: 'z1', type: 'mc', topic: 'osteologi_ben', prompt: 'F?', correct: 'ett väldigt långt svar som aldrig ryms', distractors: ['b', 'c'] }]
ctx.lastAlert = ''
await ctx.startPop()
ok('ämne utan korta svar startar inte rundan', String(ctx.lastAlert).includes('korta svar'), ctx.lastAlert)

ctx.caps = { mc: false, tf: true, fc: false }
ctx.updatePopButton()
ok('knappen skuggas för ämnen utan flervalsfrågor', nodes.startPopBtn.disabled)
ctx.caps = { mc: true, tf: false, fc: false }
ctx.updatePopButton()
ok('knappen är aktiv för MC-ämnen', !nodes.startPopBtn.disabled)

// ============================================================================
section('Export och import')
// ============================================================================
store['hur_highscores_pop'] = JSON.stringify([
  { name: 'A', topic: 't', score: 5, answered: 6, streak: 2, durationMs: 60000, date: '2026-07-01T10:00:00.000Z' }
])
ctx.exportPopScores()
eq('exportens typ är lägets egen', ctx.lastDownload.type, 'anatomiquiz-pop')
eq('exporten innehåller resultaten', ctx.lastDownload.scores.length, 1)

// Import: samma rad två gånger ska bara läggas till en gång.
const rad = { name: 'B', topic: 't', score: 7, answered: 8, streak: 3, durationMs: 60000, date: '2026-07-03T10:00:00.000Z' }
ctx.FileReader = function(){
  this.readAsText = () => { this.result = JSON.stringify({ type: 'anatomiquiz-pop', scores: [rad, rad] }); this.onload() }
}
nodes['importScoresFile-pop'].files = [{}]
ctx.handleImportPopScores({ target: { files: [{}], value: '' } })
const efterImport = JSON.parse(store['hur_highscores_pop'])
eq('dubbletter i importen hoppas över', efterImport.length, 2)

// ============================================================================
console.log(`\n${fail === 0 ? 'ALLA' : pass + ' av ' + (pass + fail)} TESTER ${fail === 0 ? 'GRÖNA' : 'KLARA — ' + fail + ' UNDERKÄNDA'}`)
process.exit(fail === 0 ? 0 : 1)

})()
