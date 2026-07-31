/* =========================================================
   test_sortera.js — tester för spelläget "Sortera"
   =========================================================
   Körs med:  node scripts/test_sortera.js
   Avslutar med kod 0 när allt är grönt, annars 1.

   Ett minimalt DOM-skal gör att js/sortera.js kan köras och drivas på riktigt
   utan webbläsare – testerna träffar alltså den kod som faktiskt levereras,
   inte en kopia av logiken. app.js hjälpare (el, shuffle, markAnswerBtn,
   playTone …) stubbas, eftersom de testas via quizet.

   SLUMPEN ÄR STYRBAR: `shuffle` stubbas till en ren omvändning. Det är inte en
   bekvämlighet utan förutsättningen för att kunna säga något om lägets kärna —
   vilken bricka som hör till vilken plats. Med en riktig slump vore varje
   påstående om utfallet en gissning.

   Skalet modellerar DOM-trädet och händelserna, INTE layouten. Att brickorna
   glider ned i platserna, att axeln syns eller att vyn ryms på en iPhone kan
   det omöjligt fånga – det kräver visuell kontroll i webbläsare
   (CLAUDE_REGLER §13.1). Urval, placering, rättning, delpoäng, beröm,
   reducerad rörelse, lagring och export/import fångar det däremot.

   Kör det här skriptet efter varje ändring i js/sortera.js.
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
  'dagsutmaning', 'sortera', 'sorteraStart', 'sorteraIntro', 'sorteraPlay', 'sorteraFinished',
  'sorteraFooter', 'sorteraPlayerLabel', 'sorteraMeta', 'sorteraProgressFill',
  'sorteraScoreBadge', 'sorteraPlacementText', 'sorteraPraise', 'sorteraPrompt',
  'sorteraPoleTop', 'sorteraPoleBottom', 'sorteraSlots', 'sorteraBankRow', 'sorteraBankHint',
  'sorteraExplanation', 'sorteraCounter', 'sorteraRingProgress', 'sorteraRingPct',
  'sorteraDoneText', 'sorteraStatsText', 'sorteraRecordBadge', 'sorteraMissedWrap',
  'sorteraMissed', 'sorteraMissedMore', 'sorteraCheckBtn', 'sorteraCancelBtn',
  'sorteraRetryBtn', 'sorteraQuitBtn', 'sorteraBackBtn', 'sorteraStartBtn', 'startSorteraBtn',
  'exportScores-sortera', 'importScoresBtn-sortera', 'importScoresFile-sortera',
  'clearScores-sortera'].forEach(id => node(id))

// Element som är dolda redan i index.html måste vara dolda här också, annars
// testar skalet ett utgångsläge som inte finns i verkligheten.
;['sorteraPlay', 'sorteraFinished', 'sorteraFooter', 'sorteraPraise', 'sorteraExplanation',
  'sorteraMissedWrap', 'sorteraMissedMore', 'sorteraRecordBadge', 'sortera'].forEach(id => nodes[id].classList.add('hidden'))

// Topplistesegmentet: <ol> med en .hs-empty-syskonrad i en förälder.
const hsWrap = new El('div')
const scoreList = node('scoreList-sortera')
const hsEmpty = new El('p'); hsEmpty.className = 'hs-empty'
hsWrap.appendChild(scoreList); hsWrap.appendChild(hsEmpty)
scoreList.parent = hsWrap

node('playerName', { value: 'Testare' })
node('soundEnabled', { checked: false })
node('sorteraTopic', { value: '' })
node('sorteraCount', { value: '10' })

// --- Lagring ----------------------------------------------------------------
const store = {}
const localStorage = {
  getItem: k => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v) },
  removeItem: k => { delete store[k] }
}

// --- Styrbara timers ---------------------------------------------------------
let timerId = 1
const timeouts = new Map()
/** Kör väntande setTimeout-callbacks med fördröjning <= maxMs, i insättnings-
 *  ordning – avslöjandet sker plats för plats och ordningen är en del av det
 *  som testas. */
function flush(maxMs){
  Array.from(timeouts.keys()).forEach(id => {
    const t = timeouts.get(id)
    if(t && t.ms <= maxMs){ timeouts.delete(id); t.fn() }
  })
}
/** Fördröjningarna på de timers `fn` skapar — och bara de. Berömmets
 *  1800 ms-timer från en tidigare fråga ligger kvar i kartan och skulle annars
 *  räknas in i mätningen av avslöjandets steg. */
function delaysCreatedBy(fn){
  const fore = new Set(timeouts.keys())
  fn()
  return Array.from(timeouts.entries()).filter(([id]) => !fore.has(id)).map(([, t]) => t.ms)
}

// --- Arkivet: den RIKTIGA filen, inte en attrapp ----------------------------
// Frågorna testas av scripts/validate_sortera.py; här är poängen att modulen
// klarar det format som faktiskt ligger på disk.
const ARKIV = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'sortera.json'), 'utf8'))

// --- Körkontext --------------------------------------------------------------
const ctx = {
  console,
  localStorage,
  navigator: {},
  Date,
  setTimeout: (fn, ms) => { const id = timerId++; timeouts.set(id, { fn, ms }); return id },
  clearTimeout: id => { timeouts.delete(id) },
  requestAnimationFrame: fn => { fn(); return 0 },
  alert: msg => { ctx.lastAlert = msg },
  confirm: () => ctx.confirmAnswer,
  confirmAnswer: true,
  FileReader: function(){},
  fetch: async () => ({ ok: true, status: 200, statusText: 'OK', json: async () => JSON.parse(JSON.stringify(ARKIV)) }),
  document: {
    createElement: t => new El(t),
    getElementById: id => nodes[id] || null,
    addEventListener: (t, fn) => { (ctx._docListeners[t] = ctx._docListeners[t] || []).push(fn) },
    activeElement: { tagName: 'BODY' }
  },
  _docListeners: {},
  el: id => nodes[id] || null,
  // app.js-hjälpare
  shuffle: a => [...a].reverse(),          // styrbar "slump": ren omvändning
  markAnswerBtn: (b, ok) => {
    b.classList.add(ok ? 'correct' : 'wrong')
    const mark = new El('span'); mark.className = 'answer-mark'; mark.textContent = ok ? '✓' : '✗'
    const sr = new El('span'); sr.className = 'sr-only'; sr.textContent = ok ? ' — rätt svar' : ' — fel svar'
    b.append(mark, sr)
  },
  playTone: (freqs, falling) => { ctx.tones.push({ freqs, falling }) },
  streakTone: s => 523.25 + s,
  hapticPulse: p => { ctx.pulses.push(p) },
  reducedMotionPreferred: () => ctx.reducedMotion,
  reducedMotion: false,
  GM_RING_CIRCUMFERENCE: 326.7,
  fitActiveView: () => { ctx.fitCalls++ },
  formatDuration: ms => Math.round(ms / 1000) + ' s',
  warnStorageUnavailable: () => { ctx.storageWarned = true },
  downloadJsonBlob: (payload, name) => { ctx.lastDownload = payload; ctx.lastDownloadName = name },
  tones: [],
  pulses: [],
  fitCalls: 0
}
ctx.window = { matchMedia: () => ({ matches: false }), scrollTo: () => {} }
ctx.window.window = ctx.window
ctx.globalThis = ctx
vm.createContext(ctx)
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', 'sortera.js'), 'utf8'), ctx, { filename: 'js/sortera.js' })

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

// --- Spelhjälpare ------------------------------------------------------------
/** Klicka på brickan vars RÄTTA plats är `kalla`. Bricksamlingen ritas om vid
 *  varje placering, så brickan måste letas upp på dataset.bank, inte på index. */
function placeByKalla(kalla){
  const bankIdx = ev('sorteraBank.findIndex(p => p.kalla === ' + kalla + ')')
  const btn = nodes.sorteraBankRow.children.find(b => b.dataset.bank === String(bankIdx))
  if(!btn) throw new Error('hittade ingen bricka med kalla ' + kalla)
  btn.click()
}
/** Placera alla fem i rätt ordning, eventuellt med två platser omkastade. */
function placeAll(swap){
  const ordning = [0, 1, 2, 3, 4]
  if(swap) [ordning[swap[0]], ordning[swap[1]]] = [ordning[swap[1]], ordning[swap[0]]]
  ordning.forEach(k => placeByKalla(k))
}
/** Rätta och kör hela avslöjandet klart. */
function rattaOchAvsloja(){
  nodes.sorteraCheckBtn.click()
  flush(5000)
}
function slotClasses(){
  return nodes.sorteraSlots.children.map(li =>
    li.classList.contains('correct') ? 'correct' : li.classList.contains('wrong') ? 'wrong' : '-')
}
function resetStorage(){
  Object.keys(store).forEach(k => delete store[k])
  ev('sorteraMemoryScores = null')
}
async function startaRunda(topic, count){
  nodes.sorteraTopic.value = topic
  nodes.sorteraCount.value = String(count)
  await ctx.openSorteraStart()
  nodes.sorteraTopic.value = topic          // fillSorteraTopics skriver om value
  nodes.sorteraCount.value = String(count)
  ctx.startSortera()
}

;(async () => {

// ============================================================================
section('Arkivet och understartsidan')
// ============================================================================
await ctx.openSorteraStart()
ok('arkivet laddas ur data/sortera.json', ev('sorteraArkiv !== null'))
eq('alla frågor lästes', ev('sorteraArkiv.fragor.length'), ARKIV.fragor.length)
ok('understartsidan visas', !nodes.sorteraStart.hidden() && !nodes.sortera.hidden())
ok('spelvyn är dold tills man startar', nodes.sorteraPlay.hidden())
ok('startsidan (#setup) är dold', nodes.setup.hidden())

// Ämnesdropdownen byggs ur arkivet – ett nytt ämne i JSON ska dyka upp utan
// att någon rör index.html.
const optioner = nodes.sorteraTopic.children.map(o => o.value)
eq('ett val per ämne, plus Blandat', optioner, ['sortera_riktningar', 'sortera_storlek', 'blandat'])
// Antalet räknas ur arkivet, inte ur en siffra i testet: frågorna byggs ut
// etappvis och en pinnad siffra hade fällt testet vid varje påfyllning.
const ANTAL_RIKTNINGAR = ARKIV.fragor.filter(q => q.topic === 'sortera_riktningar').length
ok('etiketten visar antalet frågor',
  nodes.sorteraTopic.children[0].textContent === `Riktningar & lägen (${ANTAL_RIKTNINGAR} frågor)`,
  nodes.sorteraTopic.children[0].textContent)

ok('förklaringen fälls upp för den som aldrig spelat', nodes.sorteraIntro.open === true)

// ============================================================================
section('Urval')
// ============================================================================
eq('ämnet filtrerar poolen',
  ev('buildSorteraSet("sortera_storlek", 99).every(q => q.topic === "sortera_storlek")'), true)
eq('Blandat tar med båda ämnena',
  ev('new Set(buildSorteraSet("blandat", 99).map(q => q.topic)).size'), 2)
eq('antalet kapar setet', ev('buildSorteraSet("blandat", 5).length'), 5)
eq('fler önskade än som finns ger allt som finns',
  ev('buildSorteraSet("sortera_riktningar", 500).length'), ANTAL_RIKTNINGAR)

// Brickorna får aldrig ligga i rätt ordning från start – en omgång som redan är
// löst innan man rört den är ingen omgång.
eq('brickorna slumpas om från rätt ordning',
  ev('sorteraShuffleItems([{label:"a"},{label:"b"},{label:"c"}]).map(p => p.kalla)'), [2, 1, 0])
eq('en identisk slump slumpas om, inte accepteras',
  ev('(() => { const gamla = shuffle; shuffle = a => [...a]; ' +
     'const r = sorteraShuffleItems([{label:"a"},{label:"b"}]).map(p => p.kalla); ' +
     'shuffle = gamla; return r })()'), [0, 1])

// ============================================================================
section('Placera och ångra')
// ============================================================================
resetStorage()
await startaRunda('sortera_riktningar', 3)
ok('spelvyn visas', !nodes.sorteraPlay.hidden() && nodes.sorteraStart.hidden())
ok('sidfoten med Rätta visas', !nodes.sorteraFooter.hidden())
ok('förklaringen döljs under spel', nodes.sorteraIntro.hidden())
eq('fem tomma platser', nodes.sorteraSlots.children.length, 5)
eq('fem brickor i samlingen', nodes.sorteraBankRow.children.length, 5)
eq('Rätta är låst tills alla sitter', nodes.sorteraCheckBtn.disabled, true)
eq('hinten räknar ned', nodes.sorteraBankHint.textContent, '5 kvar att placera')

// Axeln skyltar med sin egen regel.
const axel = ev('sorteraAxel(sorteraCurrent)')
eq('polerna sätts ur axeltabellen',
  [nodes.sorteraPoleTop.textContent, nodes.sorteraPoleBottom.textContent], [axel.top, axel.bottom])

placeByKalla(0)
eq('brickan hamnar på första lediga plats', ev('sorteraPlaced[0] !== null'), true)
eq('samlingen krymper', nodes.sorteraBankRow.children.length, 4)
eq('hinten räknar ned', nodes.sorteraBankHint.textContent, '4 kvar att placera')
eq('Rätta är fortfarande låst', nodes.sorteraCheckBtn.disabled, true)

nodes.sorteraSlots.children[0].querySelector('.sortera-tile').click()
eq('tryck på placerad bricka tar tillbaka den', ev('sorteraPlaced[0]'), null)
eq('brickan är tillbaka i samlingen', nodes.sorteraBankRow.children.length, 5)

placeAll()
eq('alla fem placerade', ev('sorteraPlaced.filter(p => p !== null).length'), 5)
eq('Rätta låses upp när alla sitter', nodes.sorteraCheckBtn.disabled, false)
eq('hinten byter till uppmaning', nodes.sorteraBankHint.textContent,
  'Alla placerade – tryck Rätta när du är nöjd')

// ============================================================================
section('Rättning: perfekt ordning')
// ============================================================================
ctx.tones = []
rattaOchAvsloja()
eq('alla fem platser gröna', slotClasses(), ['correct', 'correct', 'correct', 'correct', 'correct'])
eq('fullträffen räknas', ev('sorteraFull'), 1)
eq('alla fem placeringar räknas', ev('sorteraPlacements'), 5)
eq('sviten växer', ev('sorteraStreak'), 1)
eq('poängbrickan visar fullträffar', nodes.sorteraScoreBadge.textContent, 'Perfekta: 1')
eq('delpoängen står på egen rad', nodes.sorteraPlacementText.textContent, 'Rätta placeringar: 5 av 5')
eq('mätaren går över hela omgången', nodes.sorteraProgressFill.style.width, '33.3%')
ok('beröm vid perfekt ordning', nodes.sorteraPraise.textContent === '🎯 Perfekt ordning!',
  nodes.sorteraPraise.textContent)
ok('förklaringen visas efter rättning', !nodes.sorteraExplanation.hidden())
eq('knappen blir Nästa', nodes.sorteraCheckBtn.textContent, 'Nästa')

// Utfallet bärs inte av färg allena (WCAG 1.4.1).
ok('varje plats får ✓ och dold skärmläsartext',
  nodes.sorteraSlots.children.every(li =>
    li.querySelector('.answer-mark') && li.querySelector('.sr-only')))

// ============================================================================
section('Rättning: två omkastade platser')
// ============================================================================
nodes.sorteraCheckBtn.click()          // Nästa
eq('nästa fråga är laddad', ev('sorteraIdx'), 1)
eq('platserna är rensade', slotClasses(), ['-', '-', '-', '-', '-'])
ok('förklaringen döljs igen', nodes.sorteraExplanation.hidden())

const rattEtiketter = ev('sorteraCurrent.items.map(i => i.label)')
placeAll([0, 1])                        // kasta om de två översta
rattaOchAvsloja()
eq('de omkastade platserna är röda, resten gröna',
  slotClasses(), ['wrong', 'wrong', 'correct', 'correct', 'correct'])
eq('ingen fullträff', ev('sorteraFull'), 1)
eq('tre rätta placeringar räknas ändå', ev('sorteraPlacements'), 8)
eq('sviten nollas', ev('sorteraStreak'), 0)
eq('beröm för nära-läget', nodes.sorteraPraise.textContent, 'Nära – två platser var omkastade')

// Fel plats ska visa VAD som skulle stått där, och vad spelaren hade.
eq('fel plats byter till rätt etikett',
  nodes.sorteraSlots.children[0].querySelector('.sortera-tile').textContent, rattEtiketter[0])
ok('fel plats visar spelarens eget val',
  nodes.sorteraSlots.children[0].querySelector('.sortera-slot-had').textContent
    === `du hade: ${rattEtiketter[1]}`,
  nodes.sorteraSlots.children[0].querySelector('.sortera-slot-had').textContent)
eq('den missade frågan sparas med rätt ordning',
  ev('sorteraMissed[0].ratt'), rattEtiketter)

// ============================================================================
section('Facitraden — mätvärdet är storleksfrågornas payoff')
// ============================================================================
eq('storleksfråga visar värde och enhet',
  ev('sorteraFacitText({ label: "Revben", value: 24, unit: "st" })'), '24 st')
eq('noten går före det råa värdet',
  ev('sorteraFacitText({ label: "Revben", value: 24, unit: "st", note: "12 par" })'), '12 par')
eq('riktningsfråga utan värde visar sin kortfakta',
  ev('sorteraFacitText({ label: "Olecranon", note: "armbågsspetsen" })'), 'armbågsspetsen')
eq('tusental skrivs på svenskt vis',
  ev('sorteraFacitText({ label: "Levern", value: 1500, unit: "g" })'), '1 500 g')

// ============================================================================
section('Slutet')
// ============================================================================
nodes.sorteraCheckBtn.click()          // Nästa → sista frågan
placeAll()
rattaOchAvsloja()
nodes.sorteraCheckBtn.click()          // Se resultat
ok('klart-vyn visas', !nodes.sorteraFinished.hidden())
ok('spelvyn och sidfoten döljs', nodes.sorteraPlay.hidden() && nodes.sorteraFooter.hidden())
eq('ringen visar andelen perfekta', nodes.sorteraRingPct.textContent, '67 %')
eq('resultattexten räknar ordningar', nodes.sorteraDoneText.textContent,
  'Klart! 2 av 3 ordningar helt rätt.')
ok('nyckeltalen leder med delpoängen',
  nodes.sorteraStatsText.textContent.startsWith('🧩 87 % rätta placeringar'),
  nodes.sorteraStatsText.textContent)
ok('missade frågor listas med rätt ordning', !nodes.sorteraMissedWrap.hidden())
eq('en missad fråga i listan', nodes.sorteraMissed.children.length, 1)
ok('inget rekordmärke första gången', nodes.sorteraRecordBadge.hidden())

const sparat = () => JSON.parse(store.hur_highscores_sortera || '[]')
eq('resultatet sparas', sparat().length, 1)
eq('med både fullträffar och delpoäng', [sparat()[0].full, sparat()[0].total, sparat()[0].placementPct], [2, 3, 87])
eq('spelarnamnet följer med', sparat()[0].name, 'Testare')

// ============================================================================
section('Rekord räknas mot tidigare personbästa i SAMMA ämne')
// ============================================================================
eq('personbästa läses ur listan', ev('sorteraPriorBest("sortera_riktningar")'), 2 / 3)
eq('annat ämne har inget personbästa', ev('sorteraPriorBest("sortera_storlek")'), null)

await startaRunda('sortera_riktningar', 2)
placeAll(); rattaOchAvsloja(); nodes.sorteraCheckBtn.click()
placeAll(); rattaOchAvsloja(); nodes.sorteraCheckBtn.click()
ok('bättre andel än förut ger rekordmärke', !nodes.sorteraRecordBadge.hidden())
ok('rekordmärket namnger ämnet',
  nodes.sorteraRecordBadge.textContent === '🏆 Nytt rekord i Riktningar & lägen!',
  nodes.sorteraRecordBadge.textContent)
ok('felfritt syns bland nyckeltalen',
  nodes.sorteraStatsText.textContent.includes('✨ felfritt'), nodes.sorteraStatsText.textContent)

// ============================================================================
section('Sviten och dess beröm')
// ============================================================================
resetStorage()
await startaRunda('sortera_riktningar', 4)
placeAll(); rattaOchAvsloja()
eq('ingen svit-fanfar på första fullträffen', nodes.sorteraPraise.textContent, '🎯 Perfekt ordning!')
nodes.sorteraCheckBtn.click()
placeAll(); rattaOchAvsloja()
nodes.sorteraCheckBtn.click()
placeAll(); rattaOchAvsloja()
eq('tre perfekta i rad firas', nodes.sorteraPraise.textContent, '🔥 3 perfekta i rad!')
eq('bästa sviten sparas', ev('sorteraBestStreak'), 3)

// ============================================================================
section('Reducerad rörelse')
// ============================================================================
resetStorage()
ctx.reducedMotion = true
await startaRunda('sortera_storlek', 1)
placeAll()
const stegRM = delaysCreatedBy(() => nodes.sorteraCheckBtn.click())
eq('stegfördröjningen nollas – avslöjandet ÄR rörelse', stegRM, [0, 0, 0, 0, 0, 0])
flush(0)
eq('men sluttillstånden sätts ändå',
  slotClasses(), ['correct', 'correct', 'correct', 'correct', 'correct'])
ok('och facitraderna finns',
  nodes.sorteraSlots.children.every(li => li.querySelector('.sortera-slot-fact')))
ctx.reducedMotion = false

// ============================================================================
section('Topplistan')
// ============================================================================
resetStorage()
ctx.renderSorteraScores()
ok('tom lista visar tomraden', !hsEmpty.hidden() && scoreList.children.length === 0)

store.hur_highscores_sortera = JSON.stringify([
  { name: 'A', topic: 'sortera_riktningar', topicLabel: 'Riktningar & lägen', full: 5, total: 10, placementPct: 70, durationMs: 9000, date: '2026-07-30T10:00:00.000Z' },
  { name: 'B', topic: 'sortera_storlek', topicLabel: 'Storlek & antal', full: 9, total: 10, placementPct: 95, durationMs: 9000, date: '2026-07-30T11:00:00.000Z' },
  { name: 'C', topic: 'sortera_storlek', topicLabel: 'Storlek & antal', full: 9, total: 10, placementPct: 95, durationMs: 4000, date: '2026-07-30T12:00:00.000Z' }
])
ev('sorteraMemoryScores = null')
ctx.renderSorteraScores()
ok('tomraden döljs när det finns resultat', hsEmpty.hidden())
eq('bäst andel först, snabbast som utslag vid lika',
  scoreList.children.map(li => li.children[1].textContent), ['C', 'B', 'A'])

// ============================================================================
section('Export och import')
// ============================================================================
ctx.exportSorteraScores()
eq('exporten märks med lägets egen typ', ctx.lastDownload.type, 'anatomiquiz-sortera')
eq('alla resultat följer med', ctx.lastDownload.scores.length, 3)

const utfil = ctx.lastDownload
resetStorage()
ctx.importScoresFile = null
// FileReader stubbas per anrop: modulen läser filen asynkront i webbläsaren.
ctx.FileReader = function(){
  this.readAsText = () => { this.onload() }
  this.result = JSON.stringify(utfil)
}
ctx.handleImportSorteraScores({ target: { files: [{}], value: 'x' } })
eq('importen lägger tillbaka allt', ev('getSorteraScores().length'), 3)
ctx.handleImportSorteraScores({ target: { files: [{}], value: 'x' } })
eq('en andra import lägger inte till dubbletter', ev('getSorteraScores().length'), 3)

ctx.FileReader = function(){
  this.readAsText = () => { this.onload() }
  this.result = JSON.stringify({ type: 'anatomiquiz-matcha', scores: [] })
}
ctx.lastAlert = ''
ctx.handleImportSorteraScores({ target: { files: [{}], value: 'x' } })
ok('fel filtyp avvisas med besked', /ser inte ut som en exporterad fil/.test(ctx.lastAlert), ctx.lastAlert)

// ============================================================================
section('Avbryt och avsluta')
// ============================================================================
resetStorage()
await startaRunda('sortera_riktningar', 3)
ctx.confirmAnswer = false
nodes.sorteraCancelBtn.click()
ok('avbryt utan bekräftelse gör ingenting', !nodes.sortera.hidden() && ev('sorteraRunning') === true)
ctx.confirmAnswer = true
nodes.sorteraCancelBtn.click()
ok('avbryt stänger läget och visar startsidan', nodes.sortera.hidden() && !nodes.setup.hidden())
eq('inget resultat sparas vid avbrott', ev('getSorteraScores().length'), 0)

// ============================================================================
section('Tangentbord')
// ============================================================================
resetStorage()
await startaRunda('sortera_riktningar', 1)
const key = k => (ctx._docListeners.keydown || []).forEach(fn => fn({ key: k, preventDefault(){} }))
key('1')
eq('siffertangent placerar en bricka', ev('sorteraPlaced.filter(p => p !== null).length'), 1)
key('Backspace')
eq('Backspace tar tillbaka den senaste', ev('sorteraPlaced.filter(p => p !== null).length'), 0)
;['1', '1', '1', '1', '1'].forEach(key)
eq('fem tryck fyller alla platser', ev('sorteraPlaced.filter(p => p !== null).length'), 5)
key('Enter')
flush(5000)
eq('Enter rättar', ev('sorteraPhase'), 'revealed')

// ============================================================================
console.log(`\n${pass} godkända, ${fail} underkända.`)
process.exit(fail ? 1 : 0)

})().catch(e => { console.error(e); process.exit(1) })
