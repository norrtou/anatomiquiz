/* =========================================================
   test_installningar.js — tester för inställningarna och det de styr
   =========================================================
   Körs med:  node scripts/test_installningar.js
   Avslutar med kod 0 när allt är grönt, annars 1.

   Täcker det som byggdes i 0.9.330:
     1. Vibration av/på (hapticsOn)
     2. Ämne och antal frågor kommer ihåg sig
     3. Rättning: "Rätta i slutet" (tentaläge) + genomgången
     4. Flashcards-riktning (framlänges/baklänges/blandat)
     5. Återställ dolda frågor
     6. Mina data: antal och rensning per fack

   SKALET BYGGS UR index.html, INTE FÖR HAND. Alla id, alla <input> med sina
   name/value/checked/data-attribut och alla <option> läses ur den riktiga
   markupen. Det är hela poängen: en handskriven attrapp hade fortsatt vara grön
   efter att någon döpt om en kryssruta, och då hade testet bevisat ingenting.
   Ett saknat id i markupen ger alltså rött här, inte tyst fel i webbläsaren.

   Skalet modellerar DOM-trädet och händelserna, INTE layouten. Att grupperna
   ser vettiga ut, att genomgången ryms på en iPhone eller att den valda
   svarsknappen syns som vald kan det omöjligt fånga — det kräver visuell
   kontroll i webbläsare (CLAUDE_REGLER §13.1).

   Kör det här skriptet efter varje ändring i js/app.js som rör inställningar,
   rättning, flashcards-urval eller lagring.
   ========================================================= */

const fs = require('fs')
const path = require('path')
const vm = require('vm')

const ROOT = path.resolve(__dirname, '..')
const HTML = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8')

// ---------------------------------------------------------------------------
// Minimalt DOM-skal
// ---------------------------------------------------------------------------
const allEls = []

class El {
  constructor (tag) {
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
    this._checked = false
    this.open = false
    this.offsetWidth = 0
    this.clientHeight = 400
    this.scrollHeight = 100
    this.classList = {
      add: (...c) => c.forEach(x => this._class.add(x)),
      remove: (...c) => c.forEach(x => this._class.delete(x)),
      contains: c => this._class.has(c),
      toggle: (c, on) => { if (on === undefined) on = !this._class.has(c); on ? this._class.add(c) : this._class.delete(c) }
    }
    allEls.push(this)
  }

  /* Radioknappar är ömsesidigt uteslutande i webbläsaren: att kryssa i en
     avmarkerar syskonen med samma name, utan att någon kod säger till. app.js
     litar på det (applyRadioSetting sätter bara den nya till true), så skalet
     MÅSTE modellera det — annars vore två radioknappar ikryssade samtidigt här
     och testet hade mätt en verklighet som inte finns. */
  get checked () { return this._checked }
  set checked (v) {
    this._checked = !!v
    if (this._checked && this.type === 'radio' && this.name) {
      allEls.forEach(other => {
        if (other !== this && other.type === 'radio' && other.name === this.name) other._checked = false
      })
    }
  }

  get className () { return [...this._class].join(' ') }
  set className (v) { this._class = new Set(String(v).split(/\s+/).filter(Boolean)) }
  get textContent () { return this.children.length ? this.children.map(c => c.textContent).join('') : this._text }
  set textContent (v) { this._text = String(v); this.children = [] }
  set innerHTML (v) { this.children = []; this._text = v === '' ? '' : String(v) }
  get innerHTML () { return this._text }
  /** <select>.options — läses av captureTopicOptions och updateTopicOptions. */
  get options () { return this.children.filter(c => c.tagName === 'OPTION') }
  get selectedOptions () { return this.options.filter(o => o.value === this.value) }
  appendChild (c) { c.parent = this; this.children.push(c); return c }
  append (...cs) { cs.forEach(c => this.appendChild(c)) }
  get parentElement () { return this.parent || null }
  setAttribute (k, v) { this._attrs[k] = String(v) }
  getAttribute (k) { return this._attrs[k] }
  removeAttribute (k) { delete this._attrs[k] }
  addEventListener (t, fn) { (this._listeners[t] = this._listeners[t] || []).push(fn) }
  focus () {}
  scrollIntoView () {}
  closest () { return null }
  click () { (this._listeners.click || []).forEach(fn => fn.call(this, { preventDefault () {} })) }
  fire (type, ev) { (this._listeners[type] || []).forEach(fn => fn.call(this, ev || { preventDefault () {} })) }
  querySelector (sel) { return this.querySelectorAll(sel)[0] || null }
  querySelectorAll (sel) {
    const out = []
    const walk = n => n.children.forEach(c => { if (matches(c, sel)) out.push(c); walk(c) })
    walk(this)
    return out
  }
  get hiddenNow () { return this._class.has('hidden') }
}

/* Liten selektormotor. Klarar precis de former js/app.js faktiskt använder:
   tagg, .klass, [attr], [attr="värde"] och :checked — i kombination. Fler
   former läggs till när koden behöver dem; en generell CSS-motor vore att bygga
   ett bibliotek i ett testskal. */
function parseSelector (sel) {
  const s = sel.trim()
  const parsed = { tag: null, classes: [], attrs: [], checked: false }
  const rest = s.replace(/\[([a-zA-Z-]+)(?:="([^"]*)")?\]/g, (_, name, value) => {
    parsed.attrs.push({ name, value: value === undefined ? null : value })
    return ''
  }).replace(/:checked/g, () => { parsed.checked = true; return '' })
  rest.split('.').forEach((part, i) => {
    if (!part) return
    if (i === 0) parsed.tag = part.toUpperCase()
    else parsed.classes.push(part)
  })
  return parsed
}

function attrValue (elm, name) {
  if (name.startsWith('data-')) {
    const key = name.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase())
    return key in elm.dataset ? elm.dataset[key] : undefined
  }
  if (name === 'name') return elm.name
  if (name === 'value') return elm.value
  if (name === 'type') return elm.type
  return elm._attrs[name]
}

function matches (elm, sel) {
  const p = parseSelector(sel)
  if (p.tag && elm.tagName !== p.tag) return false
  if (p.classes.some(c => !elm._class.has(c))) return false
  if (p.checked && !elm.checked) return false
  return p.attrs.every(a => {
    const v = attrValue(elm, a.name)
    if (v === undefined || v === null) return false
    return a.value === null ? true : String(v) === a.value
  })
}

// ---------------------------------------------------------------------------
// Bygg DOM:en ur index.html
// ---------------------------------------------------------------------------
const nodes = {}
const root = new El('body')

function tagAttrs (tag) {
  const out = {}
  const re = /([a-zA-Z-]+)(?:="([^"]*)")?/g
  let m
  // Hoppa över själva taggnamnet.
  const body = tag.replace(/^<\s*[a-zA-Z]+/, '')
  while ((m = re.exec(body))) out[m[1]] = m[2] === undefined ? '' : m[2]
  return out
}

function applyAttrs (elm, attrs) {
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === 'id') { elm.id = v; nodes[v] = elm } else if (k === 'class') elm.className = v
    else if (k === 'type') elm.type = v
    else if (k === 'name') elm.name = v
    else if (k === 'value') elm.value = v
    else if (k === 'checked') elm.checked = true
    else if (k === 'disabled') elm.disabled = true
    else if (k === 'selected') elm._selectedAttr = true
    else if (k.startsWith('data-')) elm.dataset[k.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = v
    else elm._attrs[k] = v
  })
}

// 1) Alla <input> — de bär name/value/checked/data-* som logiken läser.
;(HTML.match(/<input\b[^>]*>/g) || []).forEach(tag => {
  const elm = new El('input')
  applyAttrs(elm, tagAttrs(tag))
  root.appendChild(elm)
})

// 2) Alla <span class="settings-count" data-count="…">.
;(HTML.match(/<span[^>]*data-count="[^"]*"[^>]*>/g) || []).forEach(tag => {
  const elm = new El('span')
  applyAttrs(elm, tagAttrs(tag))
  root.appendChild(elm)
})

// 3) Alla övriga id — ett tomt element räcker för det app.js gör med dem.
;(HTML.match(/\sid="([^"]+)"/g) || []).forEach(m => {
  const id = m.match(/id="([^"]+)"/)[1]
  if (nodes[id]) return
  const elm = new El('div')
  elm.id = id
  nodes[id] = elm
  root.appendChild(elm)
})

// 4) <option>-listorna i de tre dropdownarna, med selected-attributet.
function fillSelect (id) {
  const block = HTML.match(new RegExp(`<select id="${id}"[\\s\\S]*?</select>`))
  if (!block) throw new Error(`Hittade inte <select id="${id}"> i index.html`)
  const sel = nodes[id]
  sel.tagName = 'SELECT'
  ;(block[0].match(/<option\b[^>]*>[\s\S]*?<\/option>/g) || []).forEach(tag => {
    const opt = new El('option')
    applyAttrs(opt, tagAttrs(tag.match(/<option\b[^>]*>/)[0]))
    opt.textContent = tag.replace(/<option\b[^>]*>/, '').replace(/<\/option>/, '')
      .replace(/&amp;/g, '&').trim()
    sel.appendChild(opt)
  })
  const chosen = sel.options.find(o => o._selectedAttr) || sel.options[0]
  sel.value = chosen ? chosen.value : ''
}
;['education', 'topic', 'numQuestions'].forEach(fillSelect)

// Element som är dolda redan i index.html måste vara dolda här också.
;['settings', 'quiz', 'result', 'highscores', 'flashcards', 'hiddenQuestionsBox', 'quizReview']
  .forEach(id => { if (nodes[id]) nodes[id].classList.add('hidden') })

// ---------------------------------------------------------------------------
// Lagring, timers och körkontext
// ---------------------------------------------------------------------------
let store = {}
const localStorage = {
  getItem: k => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v) },
  removeItem: k => { delete store[k] }
}

const timeouts = []
const ctx = {
  console: { log () {}, warn () {}, error () {} },
  localStorage,
  Date,
  Math,
  JSON,
  Number,
  Array,
  Object,
  Set,
  String,
  parseInt,
  parseFloat,
  isNaN,
  setTimeout: (fn, ms) => { timeouts.push({ fn, ms }); return timeouts.length },
  clearTimeout: () => {},
  setInterval: () => 0,
  clearInterval: () => {},
  requestAnimationFrame: fn => { fn(); return 0 },
  alert: msg => { ctx.lastAlert = msg },
  confirm: msg => { ctx.lastConfirm = msg; return ctx.confirmAnswer },
  confirmAnswer: true,
  FileReader: function () {},
  // shuffle() i app.js drar sin slump ur crypto.getRandomValues — samma källa
  // som i webbläsaren, inte Math.random.
  crypto: require('crypto').webcrypto,
  Uint32Array,
  // Styrbar frågehämtning: sätt ctx.fetchPayload till den array som filen ska
  // svara med. null betyder 404, alltså tom frågelista.
  fetchPayload: null,
  fetch: async () => (ctx.fetchPayload
    ? { ok: true, status: 200, statusText: 'OK', json: async () => JSON.parse(JSON.stringify(ctx.fetchPayload)) }
    : { ok: false, status: 404, statusText: 'Not Found' }),
  vibrations: [],
  navigator: { vibrate: p => { ctx.vibrations.push(p) } },
  document: {
    documentElement: new El('html'),
    createElement: t => new El(t),
    getElementById: id => nodes[id] || null,
    querySelector: sel => root.querySelector(sel),
    querySelectorAll: sel => root.querySelectorAll(sel),
    addEventListener: (t, fn) => { (ctx._docListeners[t] = ctx._docListeners[t] || []).push(fn) },
    activeElement: { tagName: 'BODY' },
    body: root
  },
  _docListeners: {},
  getComputedStyle: () => ({ fontSize: '16px', paddingTop: '0px', paddingBottom: '0px' })
}
ctx.window = {
  matchMedia: () => ({ matches: false, addEventListener () {}, addListener () {} }),
  scrollTo: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  innerHeight: 800
}
ctx.window.window = ctx.window
ctx.globalThis = ctx
vm.createContext(ctx)
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', 'app.js'), 'utf8'), ctx, { filename: 'js/app.js' })

// app.js kopplar sina knappar i sin egen DOMContentLoaded — kör den, som webbläsaren.
;(ctx._docListeners.DOMContentLoaded || []).forEach(fn => fn())

/** Toppnivåns let/const/function bor i kontextens lexikala scope, inte på
 *  globalobjektet. Uttryck körs därför inne i kontexten. */
const ev = expr => vm.runInContext(expr, ctx)

// Tysta det som kräver riktig layout eller ljudkort. Funktionsdeklarationer är
// skrivbara bindningar, så det räcker att peka om dem.
ev('fitActiveView = function(){}')
ev('fitFcText = function(){}')
ev('showFlashcard = function(){}')
ev('playTone = function(f, falling){ __tones.push({ f, falling }) }')
ctx.__tones = []

// ---------------------------------------------------------------------------
// Testramverk
// ---------------------------------------------------------------------------
let pass = 0
const fails = []
function ok (name, cond) { if (cond) pass++; else fails.push(name) }
function eq (name, got, want) {
  ok(`${name}  (fick ${JSON.stringify(got)}, väntade ${JSON.stringify(want)})`,
    JSON.stringify(got) === JSON.stringify(want))
}
function reset () {
  store = {}
  ctx.vibrations.length = 0
  ctx.__tones.length = 0
  timeouts.length = 0
  ctx.lastAlert = null
  ctx.lastConfirm = null
  ctx.confirmAnswer = true
}

const $ = id => nodes[id]

// ===========================================================================
// 0. Markupen har det logiken pekar på
// ===========================================================================
;['playerName', 'soundEnabled', 'hapticsEnabled', 'practiceWrong', 'timerEnabled',
  'showNonMedical', 'topic', 'education', 'numQuestions', 'quizReview',
  'quizReviewList', 'quizReviewSummary', 'hiddenQuestionsBox', 'hiddenQuestionsText',
  'restoreHidden', 'clearData', 'saveSettings', 'backFromSettings'
].forEach(id => ok(`markup: #${id} finns i index.html`, !!$(id)))

;['grading', 'fcDirection', 'theme'].forEach(name => {
  const group = root.querySelectorAll(`input[name="${name}"]`)
  ok(`markup: radiogruppen "${name}" finns (${group.length} val)`, group.length >= 2)
  eq(`markup: exakt ett förval i "${name}"`, group.filter(r => r.checked).length, 1)
})

;['scores', 'wrong', 'leitner', 'dagsutmaning', 'settings'].forEach(bucket => {
  ok(`markup: rensbart fack "${bucket}" finns`, !!root.querySelector(`input[data-clear="${bucket}"]`))
})

// Varje fack utom "settings" ska ha en plats att skriva sitt antal på.
;['scores', 'wrong', 'leitner', 'dagsutmaning'].forEach(bucket => {
  ok(`markup: antalsruta för "${bucket}"`, !!root.querySelector(`span[data-count="${bucket}"]`))
})

// ===========================================================================
// 1. Vibration av/på
// ===========================================================================
reset()
$('hapticsEnabled').checked = true
ev('hapticPulse(10)')
eq('vibration på: pulsen går fram', ctx.vibrations, [10])

ctx.vibrations.length = 0
$('hapticsEnabled').checked = false
ev('hapticPulse([10, 35, 10])')
eq('vibration av: inget når navigator.vibrate', ctx.vibrations, [])
eq('hapticsOn() följer bocken', ev('hapticsOn()'), false)
$('hapticsEnabled').checked = true
eq('hapticsOn() på igen', ev('hapticsOn()'), true)

// Saknad kryssruta ska betyda ja (gamla anropsvägar och testskal).
const savedHaptics = nodes.hapticsEnabled
delete nodes.hapticsEnabled
eq('hapticsOn() utan kryssruta = ja', ev('hapticsOn()'), true)
nodes.hapticsEnabled = savedHaptics

// ===========================================================================
// 2. Ämne, antal frågor och de nya valen sparas och läses tillbaka
// ===========================================================================
reset()
$('playerName').value = 'Testare'
$('education').value = 'arbetsterapeut'
$('topic').value = 'handen'
$('numQuestions').value = '50'
$('hapticsEnabled').checked = false
root.querySelector('input[name="grading"][value="end"]').checked = true
root.querySelector('input[name="grading"][value="instant"]').checked = false
root.querySelector('input[name="fcDirection"][value="reverse"]').checked = true
root.querySelector('input[name="fcDirection"][value="forward"]').checked = false
ev('saveSettings()')

const saved = JSON.parse(store.hur_settings)
eq('sparar valt ämne', saved.topic, 'handen')
eq('sparar antal frågor', saved.numQuestions, 50)
eq('sparar rättningsläge', saved.grading, 'end')
eq('sparar flashcards-riktning', saved.fcDirection, 'reverse')
eq('sparar vibrationsvalet', saved.hapticsEnabled, false)

// Ställ tillbaka allt till förvalen och läs in på nytt — precis som en ny
// sidladdning gör.
$('topic').value = 'tentaplugg'
$('numQuestions').value = '10'
$('hapticsEnabled').checked = true
root.querySelector('input[name="grading"][value="instant"]').checked = true
root.querySelector('input[name="grading"][value="end"]').checked = false
root.querySelector('input[name="fcDirection"][value="forward"]').checked = true
root.querySelector('input[name="fcDirection"][value="reverse"]').checked = false
ev('applySettings()')

eq('läser tillbaka ämnet', $('topic').value, 'handen')
eq('läser tillbaka antalet', $('numQuestions').value, '50')
eq('läser tillbaka rättningsläget', ev('gradingMode()'), 'end')
eq('läser tillbaka riktningen', ev('fcDirectionMode()'), 'reverse')
eq('läser tillbaka vibrationsvalet', $('hapticsEnabled').checked, false)

// Ett ämne som inte längre finns i listan får inte väljas.
store.hur_settings = JSON.stringify({ ...saved, topic: 'finns_inte_langre' })
ev('applySettings()')
ok('okänt sparat ämne ignoreras', $('topic').value !== 'finns_inte_langre')

// ===========================================================================
// 3. Rättning: tentaläget
// ===========================================================================
function startBlindQuiz (grading) {
  reset()
  $('hapticsEnabled').checked = true
  $('soundEnabled').checked = true
  ev(`quizGrading = '${grading}'`)
  ev('quizQuestions = [' +
    '{ id:"t1", topic:"test", prompt:"Vad heter skulderbladet?", correct:"Scapula", distractors:["Clavicula","Sternum"] },' +
    '{ id:"t2", topic:"test", prompt:"Vad heter nyckelbenet?", correct:"Clavicula", distractors:["Scapula","Costa"] }]')
  ev('currentIdx = 0; score = 0; quizStreak = 0; quizBestStreak = 0')
  ev('quizAnswerLog = []; quizPendingAnswer = null')
  ev('quizTimerOn = false')
  $('quiz').classList.toggle('quiz-blind', grading === 'end')
  ev('showQuestion()')
}

startBlindQuiz('end')
let btns = $('answers').children
eq('tentaläge: tre svarsknappar', btns.length, 3)

const firstBtn = btns[0]
firstBtn.click()
ok('tentaläge: ingen knapp låses', btns.every(b => !b.disabled))
ok('tentaläge: inget facit målas', btns.every(b => !b._class.has('correct') && !b._class.has('wrong')))
ok('tentaläge: valet markeras', firstBtn._class.has('selected'))
eq('tentaläge: neutral ton, samma oavsett rätt/fel', ctx.__tones.map(t => t.f), [660])
eq('tentaläge: Nästa går att trycka', $('nextBtn').disabled, false)
eq('tentaläge: poängen bokförs inte vid trycket', ev('score'), 0)

// Ändra sig: valet flyttar, det gamla släpper.
const secondBtn = btns[1]
secondBtn.click()
ok('tentaläge: bara ett val i taget', btns.filter(b => b._class.has('selected')).length === 1)
ok('tentaläge: det nya valet är markerat', secondBtn._class.has('selected'))

// Svara rätt på båda frågorna och gå i mål.
const pickCorrect = () => {
  const q = ev('quizQuestions[currentIdx]')
  $('answers').children.find(b => b.textContent === q.correct).click()
}
startBlindQuiz('end')
pickCorrect()
ev('nextQuestion()')
eq('tentaläge: poängen bokförs när man går vidare', ev('score'), 1)
pickCorrect()
ev('nextQuestion()')
eq('tentaläge: båda rätt räknade', ev('score'), 2)
eq('tentaläge: blindläget städas i mål', $('quiz')._class.has('quiz-blind'), false)
eq('tentaläge: genomgången visas', $('quizReview')._class.has('hidden'), false)
eq('tentaläge: en post per fråga', $('quizReviewList').children.length, 2)
ok('tentaläge: genomgången är hopfälld', $('quizReview').open === false)
ok('tentaläge: summeringen säger allt rätt', /allt rätt/.test($('quizReviewSummary').textContent))

// En fel och en rätt: genomgången ska visa både svaret och facit.
startBlindQuiz('end')
const q1 = ev('quizQuestions[0]')
$('answers').children.find(b => b.textContent !== q1.correct).click()
ev('nextQuestion()')
pickCorrect()
ev('nextQuestion()')
eq('tentaläge: fel svar sänker poängen', ev('score'), 1)
const log = ev('quizAnswerLog')
eq('tentaläge: loggen vet vad som var fel', log.map(a => a.ok), [false, true])
eq('tentaläge: loggen minns facit', log[0].correct, q1.correct)
ok('tentaläge: summeringen räknar felen', /1 fel/.test($('quizReviewSummary').textContent))
const firstItem = $('quizReviewList').children[0]
ok('genomgång: frågan skrivs ut', firstItem.children[0].textContent === q1.prompt)
ok('genomgång: ditt svar märks med ✗', /^✗ Ditt svar:/.test(firstItem.children[1].textContent))
ok('genomgång: rätt svar visas vid fel', firstItem.children[2].textContent === `Rätt svar: ${q1.correct}`)
eq('genomgång: rätt svar får ingen extra rad', $('quizReviewList').children[1].children.length, 2)

// Direktläget ska bete sig precis som förut.
startBlindQuiz('instant')
btns = $('answers').children
const rightBtn = btns.find(b => b.textContent === ev('quizQuestions[0]').correct)
rightBtn.click()
ok('direktläge: knapparna låses', btns.every(b => b.disabled))
ok('direktläge: facit målas direkt', rightBtn._class.has('correct'))
eq('direktläge: poängen bokförs direkt', ev('score'), 1)
ev('nextQuestion()')
pickCorrect()
ev('nextQuestion()')
eq('direktläge: ingen genomgång', $('quizReview')._class.has('hidden'), true)

// Avbryt mitt i ett tentaläge får inte lämna kvar blindläget.
startBlindQuiz('end')
$('answers').children[0].click()
ctx.confirmAnswer = true
ev('cancelQuiz()')
eq('avbryt: blindläget städas', $('quiz')._class.has('quiz-blind'), false)
eq('avbryt: inget svar hänger kvar', ev('quizPendingAnswer'), null)

// ===========================================================================
// 4. Flashcards-riktning
// ===========================================================================
// Kör RIKTIGA startFlashcards(), inte en kopia av mappningen. En kopia var
// första försöket här, och den var grön även när sub följde med baklänges —
// testet bevisade bara att kopian gjorde vad kopian gjorde
// (CLAUDE_REGLER §0.1, feedback: granska verktyget, inte bara utfallet).
const CARD = { id: 'fc1', type: 'fc', topic: 'muskler_flashcards', prompt: 'Extrinsisk muskel', sub: '(Vad innebär det?)', correct: 'Muskelbuken ligger utanför handen.' }

async function runFlashcards (direction, payload, num) {
  reset()
  ctx.fetchPayload = payload || [CARD]
  root.querySelectorAll('input[name="fcDirection"]').forEach(r => { r.checked = r.value === direction })
  $('playerName').value = 'Testare'
  $('topic').value = 'muskler_flashcards'
  $('numQuestions').value = String(num || 10)
  await ev('startFlashcards()')
  return ev('fcCards')
}

async function flashcardTests () {
  let cards = await runFlashcards('forward')
  eq('framlänges: frågan är fråga', cards[0].prompt, CARD.prompt)
  eq('framlänges: svaret är svar', cards[0].correct, CARD.correct)
  eq('framlänges: sub följer med', cards[0].sub, CARD.sub)

  cards = await runFlashcards('reverse')
  eq('baklänges: svaret blir fråga', cards[0].prompt, CARD.correct)
  eq('baklänges: termen blir svar', cards[0].correct, CARD.prompt)
  eq('baklänges: sub utgår', cards[0].sub, '')

  // Blandat: över 100 kort ska båda riktningarna förekomma. Att alla skulle
  // hamna åt samma håll av ren slump är ~2⁻⁹⁹.
  const many = Array.from({ length: 100 }, (_, i) => ({
    id: `fc${i}`, type: 'fc', topic: 'muskler_flashcards', prompt: `Term ${i}`, sub: '', correct: `Svar ${i}`
  }))
  cards = await runFlashcards('mixed', many, 100)
  eq('blandat: alla kort kom med', cards.length, 100)
  const flipped = cards.filter(c => /^Svar /.test(c.prompt)).length
  ok(`blandat: både framlänges och baklänges förekommer (${flipped}/100 baklänges)`,
    flipped > 0 && flipped < 100)

  // Okänt/saknat val faller tillbaka på framlänges.
  root.querySelectorAll('input[name="fcDirection"]').forEach(r => { r.checked = false })
  eq('inget valt: framlänges är förvalet', ev('fcDirectionMode()'), 'forward')
  root.querySelector('input[name="fcDirection"][value="forward"]').checked = true
  ctx.fetchPayload = null
}

// ===========================================================================
// 5. Dolda frågor
// ===========================================================================
function hiddenQuestionTests () {
reset()
store.hur_question_flags = JSON.stringify({
  q1: { excluded: true },
  q2: { excluded: true, reported: true },
  q3: { reported: true }
})
eq('räknar dolda frågor', ev('hiddenQuestionCount()'), 2)
ev('renderDataCounts()')
eq('rutan visas när det finns dolda', $('hiddenQuestionsBox')._class.has('hidden'), false)
ok('rutan säger hur många', /2 frågor är dolda/.test($('hiddenQuestionsText').textContent))

ev('restoreHiddenQuestions()')
eq('efter återställning: inga dolda kvar', ev('hiddenQuestionCount()'), 0)
const flagsAfter = JSON.parse(store.hur_question_flags)
eq('återställning rör inte "felaktig"-markeringen', flagsAfter.q2.reported, true)
eq('återställning rör inte q3', flagsAfter.q3.reported, true)
eq('rutan döljs när inget är dolt', $('hiddenQuestionsBox')._class.has('hidden'), true)

// Singularformen ska vara singular.
store.hur_question_flags = JSON.stringify({ q1: { excluded: true } })
ev('renderDataCounts()')
ok('en dold fråga skrivs i singular', /^En fråga är dold/.test($('hiddenQuestionsText').textContent))
}

// ===========================================================================
// 6. Mina data — antal och rensning
// ===========================================================================
function dataTests () {
reset()
store.hur_highscores = JSON.stringify([{ score: 1 }, { score: 2 }])
store.hur_highscores_pop = JSON.stringify([{ score: 3 }])
store.hur_wrong_questions = JSON.stringify({ a: 2, b: 1, c: 1 })
store.hur_leitner_state = JSON.stringify({ cards: { 'x|1': {}, 'x|2': {} } })
store.hur_dagsutmaning_state = JSON.stringify({ streak: 4, done: { '2026-08-01': 1 } })
ev('renderDataCounts()')

const countText = b => root.querySelector(`span[data-count="${b}"]`).textContent
eq('antal: topplistor summerar alla lägen', countText('scores'), '— 3 resultat')
eq('antal: felsvarade frågor', countText('wrong'), '— 3 frågor')
eq('antal: Leitner-kort', countText('leitner'), '— 2 kort')
eq('antal: dagsutmaningens dagar', countText('dagsutmaning'), '— 1 dag')

store.hur_leitner_state = JSON.stringify({ cards: {} })
ev('renderDataCounts()')
eq('antal: tomt fack skrivs ut som tomt', countText('leitner'), '— tomt')

// Rensa utan att kryssa i något ska inte radera något.
reset()
store.hur_highscores = JSON.stringify([{ score: 1 }])
root.querySelectorAll('input[data-clear]').forEach(cb => { cb.checked = false })
ev('clearSelectedData()')
ok('rensar inget utan kryss', !!store.hur_highscores)
ok('säger till att man måste kryssa', /Kryssa i/.test(ctx.lastAlert || ''))

// Avbruten bekräftelse rensar inte heller.
root.querySelector('input[data-clear="scores"]').checked = true
ctx.confirmAnswer = false
ev('clearSelectedData()')
ok('avbruten bekräftelse rensar inget', !!store.hur_highscores)

// Bekräftad rensning tar bara det ikryssade facket.
reset()
store.hur_highscores = JSON.stringify([{ score: 1 }])
store.hur_highscores_shoot = JSON.stringify([{ score: 9 }])
store.hur_wrong_questions = JSON.stringify({ a: 1 })
store.hur_leitner_state = JSON.stringify({ cards: { 'x|1': {} } })
root.querySelectorAll('input[data-clear]').forEach(cb => { cb.checked = cb.dataset.clear === 'scores' })
ctx.confirmAnswer = true
ev('clearSelectedData()')
eq('rensar quizets topplista', store.hur_highscores, undefined)
eq('rensar även spellägenas topplistor', store.hur_highscores_shoot, undefined)
ok('rör inte fel-listan', !!store.hur_wrong_questions)
ok('rör inte Leitner', !!store.hur_leitner_state)
ok('kryssen nollställs efteråt', root.querySelectorAll('input[data-clear]').every(cb => !cb.checked))

// Flera fack på en gång.
reset()
store.hur_wrong_questions = JSON.stringify({ a: 1 })
store.hur_leitner_state = JSON.stringify({ cards: { 'x|1': {} } })
store.hur_dagsutmaning_state = JSON.stringify({ streak: 3, done: {} })
root.querySelectorAll('input[data-clear]').forEach(cb => {
  cb.checked = ['wrong', 'leitner'].includes(cb.dataset.clear)
})
ev('clearSelectedData()')
eq('flera fack: fel-listan borta', store.hur_wrong_questions, undefined)
eq('flera fack: Leitner borta', store.hur_leitner_state, undefined)
ok('flera fack: dagsutmaningen kvar', !!store.hur_dagsutmaning_state)

// Ett fack med trasig JSON ska ändå gå att rensa (count 0, men nyckeln finns).
reset()
store.hur_leitner_state = '{ trasig'
eq('trasigt fack räknas som tomt', ev("storedObjectSize('hur_leitner_state','cards')"), 0)
root.querySelectorAll('input[data-clear]').forEach(cb => { cb.checked = cb.dataset.clear === 'leitner' })
ev('clearSelectedData()')
eq('trasigt fack rensas ändå', store.hur_leitner_state, undefined)
}

// ---------------------------------------------------------------------------
// Körning & utfall
// ---------------------------------------------------------------------------
// startFlashcards() är async (hämtar frågefilen), så resten körs efter den.
;(async function main () {
  await flashcardTests()
  hiddenQuestionTests()
  dataTests()

  console.log(`\n${pass} tester gröna.`)
  if (fails.length) {
    console.log(`\n${fails.length} RÖDA:`)
    fails.forEach(f => console.log('  ✗ ' + f))
    process.exit(1)
  }
  console.log('Allt grönt.')
})()
