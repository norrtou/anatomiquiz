/* =========================================================
   test_shoot.js — tester för arkadläget "Arcade: Shoot!"
   =========================================================
   Körs med:  node scripts/test_shoot.js
   Avslutar med kod 0 när allt är grönt, annars 1.

   Samma metod som scripts/test_pop.js: ett minimalt DOM-skal kör js/shoot.js
   på riktigt i en vm-kontext, med app.js hjälpare stubbade. TRE saker är
   styrbara:
     * KLOCKAN (Date, setInterval, setTimeout)
     * BILDRUTORNA (requestAnimationFrame köas i stället för att köras direkt)
     * SLUMPEN (seedad, annars blir hindrens startfas flakig mellan körningar)

   Skalet modellerar DOM-trädet och fysikens matematik, INTE layouten eller
   hur ett kranium faktiskt ser ut — det kräver visuell kontroll i webbläsare
   (CLAUDE_REGLER §13.1, se scripts/arcade_shoot_todo.md avsnitt 10).

   Kör det här skriptet efter varje ändring i js/shoot.js.
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
  dispatch(t, extra){ (this._listeners[t] || []).forEach(fn => fn.call(this, Object.assign({ preventDefault(){}, stopPropagation(){} }, extra || {}))) }
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

;['setup', 'highscores', 'quiz', 'shoot', 'shootStage', 'shootFinished',
  'shootPlayerLabel', 'shootMeta', 'shootPrompt', 'shootField', 'shootTargets', 'shootObstacles',
  'shootLaserBeam', 'shootBarrel', 'shootMuzzleFlash',
  'shootStart', 'shootStartRules', 'shootStartBtn',
  'shootCountdown', 'shootCountdownNr', 'shootFly', 'shootPraise',
  'shootRoundFill', 'shootRoundClock', 'shootQClockFill', 'shootQClockRow',
  'shootScoreBadge', 'shootStreakChip', 'shootRecordChip',
  'shootRingProgress', 'shootRingPct', 'shootDoneText', 'shootStatsText',
  'shootNextText', 'shootRecordBadge', 'shootMarksmanBadge',
  'shootMissedWrap', 'shootMissed', 'shootMissedMore',
  'startShootBtn', 'shootRetryBtn', 'shootQuitBtn',
  'exportScores-shoot', 'importScoresBtn-shoot', 'importScoresFile-shoot',
  'clearScores-shoot'].forEach(id => node(id))

// Element som är dolda redan i index.html måste vara dolda här också.
;['shoot', 'shootFinished', 'shootCountdown', 'shootPraise', 'shootStreakChip',
  'shootRecordChip', 'shootFly', 'shootRecordBadge', 'shootMarksmanBadge',
  'shootMissedWrap', 'shootMissedMore', 'shootStart'].forEach(id => nodes[id].classList.add('hidden'))

// Spelytans mått. Betydligt högre än bred — kranier överst, pipa nedtill.
const FIELD_W = 340, FIELD_H = 520
nodes.shootField._rect = { width: FIELD_W, height: FIELD_H, top: 0, left: 0 }

// Topplistesegmentet: <ol> med en .hs-empty-syskonrad i en förälder.
const hsWrap = new El('div')
const scoreList = node('scoreList-shoot')
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

// Flyttar klockan framåt i 100 ms-steg (SHOOT_TICK_MS) och kör intervallen
// varje steg, som i webbläsaren.
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

// Kör väntande setTimeout-callbacks med fördröjning <= maxMs.
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
function pressStart(){ nodes.shootStartBtn.dispatch('click') }
function runCountdown(){
  pressStart()
  let varv = 0
  while(!nodes.shootCountdown.hidden() && varv++ < 10){
    NOW += 800
    flush(800)
  }
}

// --- Frågepool i testet ------------------------------------------------------
function mkQ(i, topic){
  return {
    id: 'q' + i, type: 'mc', topic: topic || 'osteologi_ben',
    prompt: `Fråga ${i}?`, correct: `Rätt${i}`,
    distractors: [`Fel${i}a`, `Fel${i}b`, `Fel${i}c`]
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
  reducedMotionPreferred: () => ctx.reducedMotion === true,
  getSharedAudioCtx: () => undefined,
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

// Slumpen görs deterministisk INNAN modulen laddas — hindrens fasförskjutning
// dras med Math.random, och ett testresultat som beror på tur är inget
// testresultat.
vm.runInContext(`(function(){
  let s = 20260801
  Math.random = function(){ s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 }
})()`, ctx)

vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', 'shoot.js'), 'utf8'), ctx, { filename: 'js/shoot.js' })

// Modulen kopplar sina egna knappar i sin EGEN DOMContentLoaded (§12).
;(ctx._docListeners.DOMContentLoaded || []).forEach(fn => fn())

// Toppnivåns `let`/`const` i shoot.js hamnar i kontextens lexikala scope –
// läses genom att köra ett uttryck i samma kontext.
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
function targetNodes(){
  return nodes.shootTargets.children.filter(c => c._class.has('shoot-target'))
}
function currentPromptId(){
  // Läser DOM-elementet, inte bara toppnivåtillståndet — annars hade testet
  // inte fångat att frågan glömdes bort i markeringen (0.9.316: shootCurrent
  // var korrekt men #shootPrompt fanns inte alls, rundan gick inte att
  // begripa på riktiga skärmar trots att all logik var rätt).
  const shown = nodes.shootPrompt.textContent
  const m = shown && shown.match(/\d+/)
  return m ? m[0] : null
}
function correctTargetPos(){ return ev("(() => { const t = shootTargets.find(x => x.correct && !x.dead); return t ? { x: t.x, y: t.y } : null })()") }
function wrongTargetPos(){ return ev("(() => { const t = shootTargets.find(x => !x.correct && !x.dead); return t ? { x: t.x, y: t.y } : null })()") }

/** Siktar rakt mot (x, y) i fältets lokala koordinater och avfyrar. */
function fireAtXY(x, y){
  ev(`shootAimAngle = shootAngleFromClient(${x}, ${y})`)
  ev('fireShoot()')
}
/** Kör projektilen till den träffar något eller lämnar fältet upptill. */
function resolveShot(){ frames(60, 16) }

const remainingQ = () => ev('shootQRemainingMs()')

;(async () => {
// ============================================================================
section('Poolbygge — bara spelbara MC-frågor med minst tre distraktorer')
// ============================================================================
POOL = [
  mkQ(1), mkQ(2),
  { id: 'q3', type: 'tf', topic: 'osteologi_ben', prompt: 'Sant?', correct: 'Sant', distractors: ['Falskt', 'X', 'Y'] }, // TF – ej med
  { id: 'q4', type: 'fc', topic: 'osteologi_ben', prompt: 'Kort', correct: 'Svar' },                                     // flashcard – ej med
  { id: 'q5', type: 'mc', topic: 'osteologi_ben', prompt: 'Bild', correct: 'A', distractors: ['B', 'C', 'D'], image: 'x' }, // bildfråga – ej med
  { id: 'ph001', type: 'mc', topic: 'osteologi_ben', prompt: 'P', correct: 'A', distractors: ['B', 'C', 'D'] },          // placeholder – ej med
  { id: 'q6', type: 'mc', topic: 'osteologi_ben', prompt: 'Två distraktorer', correct: 'A', distractors: ['B', 'C'] },   // för få distraktorer – ej med
  mkQ(7, 'muskler_arm')                                                                                                  // annat ämne – ej med
]
eq('bara MC ur valt ämne med minst tre distraktorer',
  ctx.buildShootPool('osteologi_ben', null).map(q => q.id), ['q1', 'q2'])

FLAGS = { q2: { excluded: true } }
eq('uteslutna frågor utelämnas', ctx.buildShootPool('osteologi_ben', null).map(q => q.id), ['q1'])
FLAGS = {}

// ============================================================================
section('Ordfiltret — svaret ska få plats i ett kranium')
// ============================================================================
ok('ett ord godkänns', ctx.shootOptionFits('kraniet', 2, 14))
ok('två ord godkänns', ctx.shootOptionFits('os coxae', 2, 14))
ok('tre ord underkänns', !ctx.shootOptionFits('a b c', 2, 14))
ok('för långt underkänns', !ctx.shootOptionFits('gastroesofagealreflux', 2, 12))
ok('tomt underkänns', !ctx.shootOptionFits('   ', 2, 14))

const kort = mkQ(1)
const langt = { ...mkQ(2), correct: 'ett väldigt långt svar med många ord' }
ok('kort fråga passerar', ctx.shootIsShort(kort, 2, 14))
ok('långt svar underkänns', !ctx.shootIsShort(langt, 2, 14))

// Mjuk lättnad: hellre ett steg lösare filter än ett ospelbart ämne.
const treOrd = i => ({ id: 't' + i, type: 'mc', topic: 'x', prompt: 'F?', correct: 'ett två tre', distractors: ['a b c', 'd e f', 'g h i'] })
const treOrdiga = Array.from({ length: 8 }, (_, i) => treOrd(i + 1))
eq('för få strikt korta → lättat filter används', ctx.pickShootPool(treOrdiga).length, 8)
const strikta = Array.from({ length: 8 }, (_, i) => mkQ(i + 1))
eq('tillräckligt många strikt korta → strikt filter', ctx.pickShootPool(strikta).length, 8)

// ============================================================================
section('Leken — aldrig samma fråga två gånger i rad')
// ============================================================================
POOL = [mkQ(1), mkQ(2), mkQ(3)]
ev('shootPool = [{id:"a"},{id:"b"},{id:"c"}]')
ev('shootCurrent = null')
ev('refillShootDeck()')
eq('leken fylls med hela poolen', ev('shootDeck.length'), 3)
ev('shootCurrent = shootPool[0]')
ev('refillShootDeck()')
ok('samma fråga hamnar inte först igen', ev('shootDeck[0].id') !== 'a', ev('shootDeck.map(q=>q.id)'))

// ============================================================================
section('Rundstart och nedräkning')
// ============================================================================
POOL = Array.from({ length: 8 }, (_, i) => mkQ(i + 1))
nodes.shootTargets.children = []
nodes.shootObstacles.children = []
await ctx.startShoot()
ok('setup döljs', nodes.setup.hidden())
ok('spelvyn visas', !nodes.shoot.hidden())
ok('nedräkningen har INTE börjat innan spelaren tryckt', nodes.shootCountdown.hidden())
ok('inga mål innan rundan börjat', targetNodes().length === 0, targetNodes().length)
ok('startrutan visas', !nodes.shootStart.hidden())
ok('reglerna visas för den som aldrig spelat', !nodes.shootStartRules.hidden())
eq('frågan är tom innan rundan börjat', nodes.shootPrompt.textContent, '')

runCountdown()
ok('nedräkningen döljs när rundan startar', nodes.shootCountdown.hidden())
ok('rundan är igång', ev('shootRunning'))
eq('frågetexten SYNS i spelvyn (inte bara i internt tillstånd)',
  nodes.shootPrompt.textContent, ev('shootCurrent.prompt'))
eq('fyra kranier på planen', targetNodes().length, 4)
eq('första frågan visas', currentPromptId(), '1')
ok('ett hinder finns från start (facit §4: 0:00 → 1 hinder)', ev('shootObstacles.length') === 1, ev('shootObstacles.length'))
ok('frågeklockan står på 6 s', remainingQ() === 6000, remainingQ())

// ============================================================================
section('Sikte')
// ============================================================================
eq('rakt upp ger vinkel 0', Math.round(ev(`shootAngleFromClient(shootBarrelX, shootBarrelY - 100) * 1000`)), 0)
ok('sikte åt höger ger positiv vinkel', ev(`shootAngleFromClient(shootBarrelX + 50, shootBarrelY - 50)`) > 0)
ok('sikte åt vänster ger negativ vinkel', ev(`shootAngleFromClient(shootBarrelX - 50, shootBarrelY - 50)`) < 0)
const maxRad = 70 * Math.PI / 180
ok('vinkeln klipps vid ±70°',
  ev(`shootAngleFromClient(shootBarrelX + 5000, shootBarrelY - 1)`) <= maxRad + 0.0001 &&
  ev(`shootAngleFromClient(shootBarrelX - 5000, shootBarrelY - 1)`) >= -maxRad - 0.0001)

// ============================================================================
section('Ballistik — träffar rätt kranium')
// ============================================================================
ev('shootObstacles = []; shootObstacleSpeed = 0')  // rensa vägen för ren ballistiktest
let pos = correctTargetPos()
const träffarFöre = ev('shootHits')
fireAtXY(pos.x, pos.y)
ok('projektilen skapas', ev('shootProjectile') !== null)
resolveShot()
eq('träffen räknas', ev('shootHits'), träffarFöre + 1)
ok('kraniet faller (klass fallen)', targetNodes().some(t => t._class.has('fallen')))
ok('✓ visas (inte bara färg, WCAG 1.4.1)', targetNodes().some(t => t.textContent.includes('✓')))
flush(200)
eq('ny fråga direkt', currentPromptId(), '2')
eq('fyra nya kranier', targetNodes().length, 4)

// ============================================================================
section('Ballistik — träffar fel kranium')
// ============================================================================
ev('shootObstacles = []; shootObstacleSpeed = 0')
pos = wrongTargetPos()
const svitFöre = ev('shootStreak')
fireAtXY(pos.x, pos.y)
resolveShot()
ok('sviten nollställs', ev('shootStreak') === 0, svitFöre)
ok('fel kranium markeras missed', targetNodes().some(t => t._class.has('missed')))
ok('det rätta kraniet avslöjas (reveal)', targetNodes().some(t => t._class.has('reveal')))
ok('✗ och ✓ visas', targetNodes().some(t => t.textContent.includes('✗')) && targetNodes().some(t => t.textContent.includes('✓')))
eq('missad fråga sparas', ev('shootMissed.length'), 1)
flush(700)
eq('ny fråga efter fel — rundan fortsätter', currentPromptId(), '3')
ok('rundan är fortfarande igång', ev('shootRunning'))

// ============================================================================
section('Ballistik — skott som inte träffar något')
// ============================================================================
ev('shootObstacles = []; shootObstacleSpeed = 0')
const attemptsFöre = ev('shootAttempts')
const frågaFöre = currentPromptId()
// 40° sikte: den horisontella förflyttningen upp till målraden blir då större
// än fältets bredd plus kraniernas generösa hitbox, så skottet garanterat
// missar allt — rakt upp räcker INTE (hitboxen spänner nästan hela fältets
// bredd, se facit §6). Brantare än så hinner inte lämna fältet upptill inom
// testets bildruteantal.
ev('shootAimAngle = 40 * Math.PI / 180; fireShoot()')
resolveShot()
eq('missen räknas', ev('shootAttempts'), attemptsFöre + 1)
eq('frågan står KVAR (facit §3, till skillnad från fel kranium)', currentPromptId(), frågaFöre)
ok('inga kranier har ändrat status', targetNodes().every(t => !t._class.has('fallen') && !t._class.has('missed')))

// ============================================================================
section('6-sekundersklockan — byter mål och räknas som miss')
// ============================================================================
const missarFöre = ev('shootAttempts')
advance(6100)
flush(300)
eq('missen räknas när tiden går ut', ev('shootAttempts'), missarFöre + 1)
ok('sviten nollställs', ev('shootStreak') === 0)
ok('rundan fortsätter', ev('shootRunning'))

// ============================================================================
section('Ballistik — träffar ett oskyldigt kranium avslutar rundan')
// ============================================================================
ev('shootObstacles = [{ x: shootBarrelX, y: shootFieldH * SHOOT_OBSTACLE_ROW_FRAC, size: 40, dead: false, node: null }]')
ev('shootObstacleSpeed = 0')
ok('rundan är igång innan träffen', ev('shootRunning'))
ev('shootAimAngle = 0; fireShoot()')
resolveShot()
ok('rundan avslutas direkt av ett oskyldigt kranium', !ev('shootRunning'))
ok('klart-vyn visas', !nodes.shootFinished.hidden())
ok('mästerskyttmärket visas INTE (det här var ett nederlag)', nodes.shootMarksmanBadge.hidden())
ok('resultattexten nämner det oskyldiga kraniet', nodes.shootDoneText.textContent.includes('oskyldigt'))

// ============================================================================
section('Luckegarantin — hindren stänger aldrig korridoren helt')
// ============================================================================
function minGap(){
  const corridorW = ev('shootFieldW')
  const obs = ev('shootObstacles.map(o => ({ x: o.x, size: o.size }))')
  if(obs.length === 0) return Infinity
  const sorted = obs.slice().sort((a, b) => a.x - b.x)
  let min = Infinity
  for(let i = 0; i < sorted.length; i++){
    const a = sorted[i], b = sorted[(i + 1) % sorted.length]
    let dx = b.x - a.x
    if(i === sorted.length - 1) dx += corridorW
    min = Math.min(min, dx - (a.size + b.size) / 2)
  }
  return min
}
const gapFloor = ev('SHOOT_GAP_FLOOR')
;[1, 2, 3, 4].forEach(count => {
  // Flera omspawn per antal, olika slumpade faser (seedad slump — inte tur).
  for(let i = 0; i < 6; i++){
    ev(`spawnShootObstacles(${count})`)
    ok(`glappet håller vid ${count} hinder (varv ${i + 1})`, minGap() >= gapFloor - 0.001,
      { count, gap: minGap(), golv: gapFloor })
  }
})
// Storleksformeln direkt: garantin räknas mot MAXANTALET, inte det aktuella.
;[200, 260, 340, 500, 900].forEach(w => {
  const size = ev(`shootObstacleSize(${w})`)
  const gapAtMax = w / ev('SHOOT_MAX_OBSTACLES') - size
  ok(`storleksformeln garanterar golvet vid bredd ${w}`, gapAtMax >= gapFloor - 0.001, { w, size, gapAtMax })
})

// ============================================================================
section('Ballistik — restiden gör att ett hinder hinner in i banan')
// ============================================================================
// Barrelns rakt-upp-bana korsar hinderraden. Ett hinder som glider IN i den
// banan under flykten skaträffas, trots att det inte stod där vid avfyring.
nodes.shootTargets.children = []
nodes.shootObstacles.children = []
POOL = Array.from({ length: 8 }, (_, i) => mkQ(i + 1))
store['hur_highscores_shoot'] = '[]'
await ctx.startShoot()
runCountdown()
// Hindret börjar EN BIT från siktlinjen (x=barrelX-95) men glider in i den
// exakt när projektilen når hinderraden, uträknat ur ballistikens tid: vid
// 900 px/s tar det ~237 ms att nå raden, och vid 400 px/s hinner hindret då
// precis fram till barrelX.
ev(`shootObstacles = [{ x: shootBarrelX - 95, y: shootFieldH * SHOOT_OBSTACLE_ROW_FRAC, size: 40, dead: false, node: null }]`)
ev('shootObstacleSpeed = 400')   // hinner glida in i banan under projektilens flykt
ev('shootAimAngle = 0; fireShoot()')
resolveShot()
ok('projektilen konsumerades av något (hindret hann i vägen)', ev('shootProjectile') === null)
ok('rundan avslutades av hindret, inte av en träff i förväg', !ev('shootRunning'))

// ============================================================================
section('Svårighetstrappan')
// ============================================================================
nodes.shootTargets.children = []
nodes.shootObstacles.children = []
nodes.shootFinished.classList.add('hidden')
POOL = Array.from({ length: 20 }, (_, i) => mkQ(i + 1))
store['hur_highscores_shoot'] = '[]'
await ctx.startShoot()
runCountdown()
eq('1 hinder vid start', ev('shootObstacleCount'), 1)
advance(30000)
eq('2 hinder vid 0:30', ev('shootObstacleCount'), 2)
advance(30000)
eq('3 hinder vid 1:00', ev('shootObstacleCount'), 3)
advance(30000)
eq('4 hinder (max) vid 1:30', ev('shootObstacleCount'), 4)
const basfart = ev('shootObstacleSpeed')
advance(90000)  // fram till 3:00
ok('farten har ökat vid 2:00/2:30/3:00', ev('shootObstacleSpeed') > basfart, { bas: basfart, nu: ev('shootObstacleSpeed') })
advance(180000)
eq('antalet hinder är fortfarande maxat (4) efter 3:00', ev('shootObstacleCount'), 4)

// ============================================================================
section('Reducerad rörelse — trappan börjar ett steg mildare')
// ============================================================================
nodes.shootTargets.children = []
nodes.shootObstacles.children = []
nodes.shootFinished.classList.add('hidden')
POOL = Array.from({ length: 8 }, (_, i) => mkQ(i + 1))
store['hur_highscores_shoot'] = '[]'
ctx.reducedMotion = true
await ctx.startShoot()
runCountdown()
eq('fortfarande 1 hinder vid start (ingen skillnad i steg 0)', ev('shootObstacleCount'), 1)
advance(30000)
eq('INTE uppe i 2 hinder vid 0:30 med reducerad rörelse (ett steg mildare)', ev('shootObstacleCount'), 1)
advance(30000)
eq('2 hinder vid 1:00 (30 s försenat)', ev('shootObstacleCount'), 2)
ctx.reducedMotion = false

// ============================================================================
section('Poängformeln')
// ============================================================================
eq('40 träffar, 85 % träffsäkerhet, 180 s → 520',
  Math.round(ctx.computeShootScore(40, Math.round(40 / 0.85), 180000)), 520)
eq('inga träffar, bara överlevd tid', ctx.computeShootScore(0, 0, 45000), 45)
eq('inga försök alls ger ingen NaN-krasch', ctx.computeShootScore(0, 0, 0), 0)

// ============================================================================
section('Mästerskytt — 5 minuter utan att träffa ett oskyldigt kranium')
// ============================================================================
nodes.shootTargets.children = []
nodes.shootObstacles.children = []
nodes.shootFinished.classList.add('hidden')
POOL = Array.from({ length: 8 }, (_, i) => mkQ(i + 1))
store['hur_highscores_shoot'] = '[]'
await ctx.startShoot()
runCountdown()
ev('shootObstacles = []')   // inga hinder i vägen — rundan ska bara ta slut på tid
advance(5 * 60 * 1000 + 500)
ok('rundan avslutas av klockan', !ev('shootRunning'))
ok('klart-vyn visas', !nodes.shootFinished.hidden())
ok('mästerskyttmärket visas', !nodes.shootMarksmanBadge.hidden())
ok('resultattexten firar mästerskytten', nodes.shootDoneText.textContent.includes('mästerskytt'))

// ============================================================================
section('Lagring och topplista')
// ============================================================================
const sparade = JSON.parse(store['hur_highscores_shoot'] || '[]')
eq('resultatet sparas', sparade.length, 1)
ok('poängen sparas som tal', typeof sparade[0].score === 'number')
ok('mästerskytt-flaggan sparas', sparade[0].marksman === true)
eq('ämnet sparas', sparade[0].topic, 'osteologi_ben')

ctx.renderShootScores()
ok('topplistan får en rad', nodes['scoreList-shoot'].children.length === 1)
ok('tomtexten döljs när det finns resultat', hsEmpty.hidden())

// ============================================================================
section('Rekord — personbästa i ÄMNET, poängbaserat')
// ============================================================================
store['hur_highscores_shoot'] = JSON.stringify([
  { name: 'A', topic: 'osteologi_ben', score: 50, hits: 5, attempts: 6, streak: 3, survivedMs: 60000, marksman: false, date: '2026-07-01T10:00:00.000Z' },
  { name: 'A', topic: 'annat_amne', score: 999, hits: 90, attempts: 90, streak: 9, survivedMs: 300000, marksman: true, date: '2026-07-02T10:00:00.000Z' }
])
eq('bästa i ämnet läses, inte bästa överlag', ctx.shootBestFor('osteologi_ben'), 50)
eq('okänt ämne ger noll', ctx.shootBestFor('finns_inte'), 0)

nodes.shootTargets.children = []
nodes.shootObstacles.children = []
nodes.shootFinished.classList.add('hidden')
await ctx.startShoot()
runCountdown()
ok('spökmålet visas när det finns ett rekord', !nodes.shootRecordChip.hidden())
ok('spökmålet visar rekordet', nodes.shootRecordChip.textContent.includes('50'))

// ============================================================================
section('Tomt/otillräckligt ämne och knappstatus')
// ============================================================================
POOL = [{ id: 'z1', type: 'mc', topic: 'osteologi_ben', prompt: 'F?', correct: 'ett väldigt långt svar som aldrig ryms', distractors: ['b', 'c', 'd'] }]
ctx.lastAlert = ''
await ctx.startShoot()
ok('ämne utan tillräckligt många spelbara frågor startar inte rundan', String(ctx.lastAlert).includes('Shoot'), ctx.lastAlert)

ctx.caps = { mc: false, tf: true, fc: false }
ctx.updateShootButton()
ok('knappen skuggas för ämnen utan flervalsfrågor', nodes.startShootBtn.disabled)
ctx.caps = { mc: true, tf: false, fc: false }
ctx.updateShootButton()
ok('knappen är aktiv för MC-ämnen', !nodes.startShootBtn.disabled)

// ============================================================================
section('Export och import')
// ============================================================================
store['hur_highscores_shoot'] = JSON.stringify([
  { name: 'A', topic: 't', score: 42, hits: 5, attempts: 6, streak: 2, survivedMs: 60000, marksman: false, date: '2026-07-01T10:00:00.000Z' }
])
ctx.exportShootScores()
eq('exportens typ är lägets egen', ctx.lastDownload.type, 'anatomiquiz-shoot')
eq('exporten innehåller resultaten', ctx.lastDownload.scores.length, 1)

const rad = { name: 'B', topic: 't', score: 30, hits: 3, attempts: 4, streak: 1, survivedMs: 40000, marksman: false, date: '2026-07-03T10:00:00.000Z' }
ctx.FileReader = function(){
  this.readAsText = () => { this.result = JSON.stringify({ type: 'anatomiquiz-shoot', scores: [rad, rad] }); this.onload() }
}
nodes['importScoresFile-shoot'].files = [{}]
ctx.handleImportShootScores({ target: { files: [{}], value: '' } })
const efterImport = JSON.parse(store['hur_highscores_shoot'])
eq('dubbletter i importen hoppas över', efterImport.length, 2)

// ============================================================================
console.log(`\n${fail === 0 ? 'ALLA' : pass + ' av ' + (pass + fail)} TESTER ${fail === 0 ? 'GRÖNA' : 'KLARA — ' + fail + ' UNDERKÄNDA'}`)
process.exit(fail === 0 ? 0 : 1)

})()
