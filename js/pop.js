// ============================================================================
// js/pop.js — arkadläget "Arcade: Pop!" (poppa ordet som är rätt svar).
// Namnet är två fria ord som ingen firma äger – inga varumärken i filnamn,
// funktioner, id:n, klasser eller synlig text (CLAUDE_REGLER §12.1).
// Slug: "pop".
// ============================================================================
// EGEN FIL PER SPELLÄGE (CLAUDE_REGLER §12): laddas som klassiskt <script defer>
// EFTER js/app.js och delar globalt scope med den. Använder app.js hjälpare som
// globaler: el, shuffle, loadFlags, loadPoolForTopic, topicMatchesSelection,
// topicLabelFor, eduAbbrevFor, warnStorageUnavailable, downloadJsonBlob,
// topicCapabilities, allQuestions, GM_RING_CIRCUMFERENCE.
// app.js känner bara till läget via två skyddade krokar (renderPopScores,
// updatePopButton). Ämnet hämtas ur den vanliga startvyn via
// loadPoolForTopic/topicMatchesSelection — ämnesurvalet finns i EN upplaga.
// ============================================================================
// SPELLOGIK — poppa rätt ord innan minuten är slut
// ============================================================================
// 60 sekunder. Frågan står som en kort rad över spelytan; svarsalternativen
// svävar runt som bubblor. Poppa den som är rätt svar → poäng och NY fråga
// direkt. Ingen Nästa-knapp, ingen avbrytknapp, ingen väntan: friktionen
// mellan frågorna är det som dödar ett arkadläge.
//
// Poppar du fel händer samma sak — ny fråga direkt — men det kostar
// POP_PENALTY_MS av klockan. Utan den kostnaden är det matematiskt optimalt
// att hamra på alla bubblor (bubblorna är stora och få), och då mäter läget
// ingen kunskap alls. Innan nästa fråga blinkar den RÄTTA bubblan med ✓, så
// att felet lär något i stället för att bara straffa.
//
// Bara MC-frågor vars samtliga alternativ är på 1–2 ord används: ett ord ska
// få plats i en bubbla och gå att läsa i förbifarten. Sant/falskt utelämnas —
// bubblor med "Sant"/"Falskt" är inte ord som motsvarar ett svar, det vore ett
// annat och sämre spel. Bildfrågor utelämnas eftersom bilden ÄR frågan.
//
// Bubblorna är BARA frågans egna distraktorer. Att fylla ut fältet med ord
// lånade från andra frågor i ämnet skulle ge en fylligare spelplan, men ett
// lånat ord kan råka vara ett också-korrekt svar på den aktuella frågan, och
// då säger spelet "fel" om något rätt. Fyra stora bubblor med garanterat fel
// alternativ är värt mer än sex osäkra.
//
// Tar frågorna slut i ett litet ämne blandas leken om och börjar om — men
// aldrig samma fråga två gånger i rad.
// ============================================================================
const POP_SCORES_KEY = 'hur_highscores_pop'
const POP_EXPORT_TYPE = 'anatomiquiz-pop'
const POP_DURATION_MS = 60000    // fast rundlängd — blandade tider ger meningslös topplista
const POP_PENALTY_MS = 3000      // fel bubbla
const POP_TICK_MS = 100          // klockans uppdateringstakt
const POP_COUNTDOWN_FROM = 3
const POP_COUNTDOWN_STEP_MS = 800  // snabbare än ett vanligt quiz: det här är arkad
const POP_WARN_MS = 15000        // klockstapeln blir amber
const POP_DANGER_MS = 5000       // klockstapeln blir röd och pulserar
const POP_TICKING_MS = 3000      // tickljud sista sekunderna
const POP_STREAK_STEP = 5        // beröm var femte rätt i rad
const POP_PRAISE_MS = 1100
const POP_MISSED_SHOWN = 8       // så många missade frågor listas i slutet

// Rätt svar: bara ett kvitto, håll tempot. Fel svar: längre, för att hinna se
// vilken bubbla som VAR rätt — den tiden är information, inte animation, och
// nollas därför inte vid reducerad rörelse (§13.1 punkt 8).
const POP_RIGHT_MS = 150
const POP_WRONG_MS = 640

// Ordfiltret. Ett svar ska få plats i en bubbla och läsas i förbifarten.
const POP_MAX_WORDS = 2
const POP_MAX_CHARS = 22
// Mjuk lättnad för ämnen som annars inte går att spela alls.
const POP_MAX_WORDS_RELAXED = 3
const POP_MAX_CHARS_RELAXED = 28
const POP_MIN_POOL = 6
// Frågan står över spelytan och får inte äta av den.
const POP_MAX_PROMPT = 120

// Bubbelfysik. Farten är medvetet låg: bubblorna ska hinna läsas medan de
// rör sig, annars blir spelet ett reflextest i stället för ett kunskapstest.
const POP_SPEED_MIN = 26         // px/s
const POP_SPEED_MAX = 52
const POP_MAX_STEP_MS = 50       // hoppa aldrig längre än så per bildruta (flikbyte)

// Textlängd → bubbelstorlek och typsnittsskala.
const POP_PROMPT_SCALE = { min: 40, max: POP_MAX_PROMPT, floor: 0.8 }

const POP_RING_CIRCUMFERENCE = (typeof GM_RING_CIRCUMFERENCE !== 'undefined') ? GM_RING_CIRCUMFERENCE : 326.7

// --- Rundans tillstånd -------------------------------------------------------
let popPool = []            // ämnets spelbara frågor
let popDeck = []            // slumpad lek ur poolen
let popDeckIdx = 0
let popCurrent = null       // frågan som visas
let popBubbles = []         // { x, y, vx, vy, size, text, correct, node, dead }
let popFieldW = 0
let popFieldH = 0
let popScore = 0            // poppade rätt — poängen i topplistan
let popAnswered = 0
let popStreak = 0
let popBestStreak = 0
let popLostMs = 0
let popMissed = []          // { prompt, correct, chosen }
let popDeadline = 0
let popStartTime = 0
let popEndTime = 0
let popRunning = false
let popLocked = false       // facit visas — inga nya tryck
let popClockInterval = null
let popCountdownTimer = null
let popAdvanceTimer = null
let popPraiseTimer = null
let popFlyTimer = null
let popRafId = null
let popLastFrame = 0
let popLastTickSec = -1
let popPriorBest = 0
let popRecordBeaten = false
let popName = 'Spelare'
let popTopic = ''
let popAudioCtx = null

// ============================================================================
// Lagring — eget fack med minnesfallback (privat läge får inte krascha spelet,
// bara tappa historiken).
// ============================================================================
let popMemoryScores = null

function getPopScores(){
  if(popMemoryScores) return popMemoryScores
  try{
    const raw = JSON.parse(localStorage.getItem(POP_SCORES_KEY) || '[]')
    return Array.isArray(raw) ? raw : []
  }catch(e){ return popMemoryScores || [] }
}

function savePopScores(scores){
  try{ localStorage.setItem(POP_SCORES_KEY, JSON.stringify(scores)); popMemoryScores = null }
  catch(e){ popMemoryScores = scores; warnStorageUnavailable() }
}

// Personbästa i DET HÄR ämnet — ett rekord satt i ett annat ämne är ingen
// jämförelse.
function popBestFor(topic){
  return getPopScores().reduce((best, s) => {
    if(s.topic !== topic) return best
    return Math.max(best, s.score || 0)
  }, 0)
}

// ============================================================================
// Spelkänsla: rörelse, skala, ljud, haptik
// ============================================================================
function popReducedMotion(){
  return typeof window !== 'undefined' && !!window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function popTextScale(text, cfg){
  const len = (text || '').length
  if(len <= cfg.min) return 1
  const t = Math.min(1, (len - cfg.min) / (cfg.max - cfg.min))
  return 1 - t * (1 - cfg.floor)
}

// Korta, självgenererade toner via Web Audio — aldrig externa ljudfiler (CSP
// tillåter ingen extern källa). AudioContext skapas först vid en spelarinitierad
// tryckning (autoplay-kraven). Av/på styrs av den BEFINTLIGA
// "Ljudeffekter"-bocken i Inställningar; läget har ingen egen.
function popSoundEnabled(){
  const cb = el('soundEnabled')
  return cb ? !!cb.checked : true
}

function getPopAudioCtx(){
  if(popAudioCtx) return popAudioCtx
  const Ctx = window.AudioContext || window.webkitAudioContext
  if(!Ctx) return null
  try{ popAudioCtx = new Ctx() }catch(e){ popAudioCtx = null }
  return popAudioCtx
}

function popBeep(ctx, freq, offset, dur, peak, glide){
  const t0 = ctx.currentTime + offset
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(freq, t0)
  if(glide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq * glide), t0 + dur * 0.9)
  gain.gain.setValueAtTime(0.0001, t0)
  gain.gain.exponentialRampToValueAtTime(peak, t0 + 0.006)
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  osc.connect(gain); gain.connect(ctx.destination)
  osc.start(t0)
  osc.stop(t0 + dur + 0.04)
}

// Tonhöjden vid rätt STIGER med sviten (ett halvsteg per rätt, tak en oktav):
// ljudet berättar att man är inne i en serie, inte bara att svaret var rätt.
function popStreakFreq(streak){
  const steps = Math.min(Math.max(streak - 1, 0), 12)
  return 587.33 * Math.pow(2, steps / 12)
}

function playPopTone(kind, streak){
  if(!popSoundEnabled()) return
  const ctx = getPopAudioCtx()
  if(!ctx) return
  if(ctx.state === 'suspended') ctx.resume()
  // Popp: mycket kort blip med uppåtglid — bubbelkänslan sitter i att den är
  // klar innan man hinner uppfatta den som en ton.
  if(kind === 'pop'){ popBeep(ctx, popStreakFreq(streak), 0, 0.07, 0.13, 1.6); return }
  if(kind === 'wrong'){ popBeep(ctx, 196, 0, 0.24, 0.13, 0.7); return }
  if(kind === 'praise'){ [880, 1174.66, 1567.98].forEach((f, i) => popBeep(ctx, f, i * 0.06, 0.12, 0.12)); return }
  if(kind === 'record'){ [659.25, 880, 1174.66, 1318.51].forEach((f, i) => popBeep(ctx, f, i * 0.08, 0.16, 0.13)); return }
  if(kind === 'tick'){ popBeep(ctx, 1320, 0, 0.045, 0.06); return }
  if(kind === 'go'){ popBeep(ctx, 880, 0, 0.16, 0.13); return }
  if(kind === 'end'){ [523.25, 659.25, 783.99].forEach((f, i) => popBeep(ctx, f, i * 0.12, 0.28, 0.14)) }
}

function popVibrate(pattern){
  if(typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') navigator.vibrate(pattern)
}

// ============================================================================
// Frågeurval
// ============================================================================
function popWordCount(s){
  return String(s).trim().split(/\s+/).filter(Boolean).length
}

// Ett alternativ som får plats i en bubbla: få ord OCH kort totalt. Båda
// behövs — "gastroesophageal reflux" är två ord men för långt, och
// "a. b. c. d." är kort men fyra ord.
function popOptionFits(o, maxWords, maxChars){
  const t = String(o).trim()
  return t.length > 0 && t.length <= maxChars && popWordCount(t) <= maxWords
}

function popIsShort(q, maxWords, maxChars){
  if(String(q.prompt).length > POP_MAX_PROMPT) return false
  return [q.correct, ...q.distractors].every(o => popOptionFits(o, maxWords, maxChars))
}

// Grundpoolen: MC utan bild, inte placeholder, inte utesluten, i valt ämne.
// Sant/falskt utelämnas — se filhuvudet.
function buildPopPool(topic, lens){
  const flags = loadFlags()
  const pool = []
  const seen = new Set()
  for(const q of allQuestions){
    if(q.type !== 'mc') continue
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
  return pool
}

// Ett steg mjukare filter hellre än ett ospelbart ämne — men aldrig hela
// poolen: långa svar får inte plats i en bubbla, och då är spelet trasigt i
// stället för svårt. Räcker inte ens det lättade filtret returneras tom lista
// och knappen skuggas för ämnet.
function pickPopPool(full){
  const strict = full.filter(q => popIsShort(q, POP_MAX_WORDS, POP_MAX_CHARS))
  if(strict.length >= POP_MIN_POOL) return strict
  const relaxed = full.filter(q => popIsShort(q, POP_MAX_WORDS_RELAXED, POP_MAX_CHARS_RELAXED))
  if(relaxed.length >= POP_MIN_POOL) return relaxed
  return strict.length >= relaxed.length ? strict : relaxed
}

// Leken blandas om när den tar slut. I ett litet ämne betyder det att frågor
// återkommer — men aldrig två gånger i rad, vilket vore både förvirrande och
// gratis poäng.
function refillPopDeck(){
  const next = shuffle(popPool.slice())
  if(next.length > 1 && popCurrent && next[0] === popCurrent){
    next.push(next.shift())
  }
  popDeck = next
  popDeckIdx = 0
}

function drawPopQuestion(){
  if(popDeckIdx >= popDeck.length) refillPopDeck()
  return popDeck[popDeckIdx++] || null
}

// Har spelaren kört läget förut? Avgör om förklaringsrutan fälls upp.
function hasPlayedPop(){
  return getPopScores().length > 0
}

// ============================================================================
// Start
// ============================================================================
async function startPop(){
  popName = el('playerName').value.trim() || 'Spelare'
  popTopic = el('topic').value

  const lens = await loadPoolForTopic(popTopic)
  const full = buildPopPool(popTopic, lens)
  popPool = pickPopPool(full)
  if(popPool.length < 2){
    alert('Det här ämnet har för få frågor med korta svar för Arcade: Pop!. Bubblorna kräver svar på ett par ord. Välj ett annat ämne.')
    return
  }

  popCurrent = null
  refillPopDeck()
  popBubbles = []
  popScore = 0
  popAnswered = 0
  popStreak = 0
  popBestStreak = 0
  popLostMs = 0
  popMissed = []
  popLocked = true          // låst tills nedräkningen är klar
  popRunning = false
  popLastTickSec = -1
  popPriorBest = popBestFor(popTopic)
  popRecordBeaten = false

  el('setup').classList.add('hidden')
  el('pop').classList.remove('hidden')
  el('popFinished').classList.add('hidden')
  el('popStage').classList.remove('hidden')

  // Startrutan i spelytan. Reglerna visas för den som aldrig spelat och
  // utelämnas för vana spelare — samma text varje runda är brus (§13.1).
  const start = el('popStart')
  if(start) start.classList.remove('hidden')
  el('popStartRules')?.classList.toggle('hidden', hasPlayedPop())

  el('popPlayerLabel').textContent = popName
  el('popMeta').textContent = topicLabelFor(popTopic)
  el('popPrompt').textContent = ''
  clearPopField()
  updatePopScoreBadge(false)
  updatePopStreakChip()
  updatePopRecordChip()
  popDeadline = Date.now() + POP_DURATION_MS   // så klockan visar 60,0 under nedräkningen
  updatePopClock()

  if(typeof fitActiveView === 'function') fitActiveView()
  measurePopField()
  // Rundan startar på spelarens tryck, inte av sig själv — se popStart i
  // index.html. Klockan rör sig inte förrän dess.
}

// Trycket på "Kör!": enda stället där rundan får börja. Här väcks också
// AudioContext, eftersom det måste ske i en spelarinitierad gest.
function onPopStartClick(){
  el('popStart')?.classList.add('hidden')
  const ctx = getPopAudioCtx()
  if(ctx && ctx.state === 'suspended') ctx.resume()
  measurePopField()
  startPopCountdown()
}

// Nedräkning innan klockan startar. Utan den börjar de 60 sekunderna i samma
// ögonblick som vyn ritas, så allt som möter spelaren först — panelen, att
// hitta med blicken — kostar riktig speltid.
function startPopCountdown(){
  const box = el('popCountdown')
  const nr = el('popCountdownNr')
  if(!box || !nr){ beginPopRound(); return }
  box.classList.remove('hidden')
  let n = POP_COUNTDOWN_FROM
  const step = () => {
    if(n > 0){
      nr.textContent = String(n)
      nr.classList.remove('tick')
      void nr.offsetWidth          // forcerad reflow: animationen ska kunna köras om
      nr.classList.add('tick')
      playPopTone('tick')
      n--
      popCountdownTimer = setTimeout(step, POP_COUNTDOWN_STEP_MS)
      return
    }
    nr.textContent = 'Kör!'
    nr.classList.remove('tick')
    void nr.offsetWidth
    nr.classList.add('tick')
    playPopTone('go')
    popVibrate(12)
    popCountdownTimer = setTimeout(() => {
      box.classList.add('hidden')
      beginPopRound()
    }, POP_COUNTDOWN_STEP_MS)
  }
  step()
}

function clearPopCountdown(){
  if(popCountdownTimer){ clearTimeout(popCountdownTimer); popCountdownTimer = null }
  el('popCountdown')?.classList.add('hidden')
}

function beginPopRound(){
  popRunning = true
  popLocked = false
  popStartTime = Date.now()
  popDeadline = popStartTime + POP_DURATION_MS
  measurePopField()
  nextPopQuestion()
  startPopClock()
  startPopLoop()
}

// ============================================================================
// Spelplanen — bubblor
// ============================================================================
function measurePopField(){
  const f = el('popField')
  if(!f) return
  const r = f.getBoundingClientRect()
  popFieldW = Math.max(0, Math.round(r.width))
  popFieldH = Math.max(0, Math.round(r.height))
}

function clearPopField(){
  const f = el('popField')
  if(f) f.querySelectorAll('.pop-bubble').forEach(n => n.remove())
  popBubbles = []
}

// Bubbelstorleken följer ordlängden, men taket sätts av fältet: fyra bubblor
// ska få plats utan att ligga på varandra även på en smal telefon.
function popBubbleSize(text, count){
  const len = String(text).length
  const base = len <= 8 ? 96 : len <= 14 ? 112 : 126
  const budget = Math.sqrt(Math.max(1, popFieldW * popFieldH) / Math.max(1, count)) * 0.82
  return Math.max(62, Math.round(Math.min(base, budget, Math.min(popFieldW, popFieldH) * 0.46)))
}

function nextPopQuestion(){
  if(!popRunning) return
  popCurrent = drawPopQuestion()
  if(!popCurrent) return
  popLocked = false

  const promptEl = el('popPrompt')
  promptEl.textContent = popCurrent.prompt
  promptEl.style.setProperty('--prompt-scale', String(popTextScale(popCurrent.prompt, POP_PROMPT_SCALE)))

  buildPopBubbles(popCurrent)
}

function buildPopBubbles(q){
  clearPopField()
  const field = el('popField')
  if(!field) return
  if(!popFieldW || !popFieldH) measurePopField()

  const opts = shuffle([
    { text: String(q.correct), correct: true },
    ...q.distractors.map(d => ({ text: String(d), correct: false }))
  ])

  const still = popReducedMotion()
  opts.forEach(o => {
    const size = popBubbleSize(o.text, opts.length)
    const b = {
      text: o.text,
      correct: o.correct,
      size,
      x: 0, y: 0,
      vx: 0, vy: 0,
      dead: false,
      node: null,
      body: null
    }
    placePopBubble(b)
    if(!still){
      const angle = Math.random() * Math.PI * 2
      const speed = POP_SPEED_MIN + Math.random() * (POP_SPEED_MAX - POP_SPEED_MIN)
      b.vx = Math.cos(angle) * speed
      b.vy = Math.sin(angle) * speed
    }
    b.node = makePopBubbleNode(b)
    field.appendChild(b.node)
    popBubbles.push(b)
  })
  renderPopBubbles()
}

// Slumpa fram en plats som inte krockar med redan utplacerade bubblor. Efter
// ett antal försök accepteras bästa försöket — hellre en liten överlappning
// än en oändlig loop på en trång skärm.
function placePopBubble(b){
  const maxX = Math.max(0, popFieldW - b.size)
  const maxY = Math.max(0, popFieldH - b.size)
  let best = null
  let bestGap = -Infinity
  for(let i = 0; i < 40; i++){
    const x = Math.random() * maxX
    const y = Math.random() * maxY
    let gap = Infinity
    for(const o of popBubbles){
      const dx = (x + b.size / 2) - (o.x + o.size / 2)
      const dy = (y + b.size / 2) - (o.y + o.size / 2)
      gap = Math.min(gap, Math.hypot(dx, dy) - (b.size + o.size) / 2)
    }
    if(gap === Infinity){ b.x = x; b.y = y; return }
    if(gap > bestGap){ bestGap = gap; best = { x, y } }
    if(gap > 8){ b.x = x; b.y = y; return }
  }
  b.x = best ? best.x : 0
  b.y = best ? best.y : 0
}

// Två lager: den yttre knappen bär BARA positionen (fysiken skriver dess
// transform varje bildruta), den inre kroppen bär utseende och animationer.
// I samma element skulle burst-animationens transform skriva över positionen
// och bubblan hoppa till hörnet just när den poppas.
function makePopBubbleNode(b){
  const node = document.createElement('button')
  node.type = 'button'
  node.className = 'pop-bubble'
  node.style.width = b.size + 'px'
  node.style.height = b.size + 'px'
  // Ordlängd → typsnittsskala, så att långa ord inte spränger bubblan.
  const scale = b.text.length <= 8 ? 1 : b.text.length <= 14 ? 0.86 : 0.74
  node.style.setProperty('--bubble-scale', String(scale))
  const body = document.createElement('span')
  body.className = 'pop-bubble-body'
  const label = document.createElement('span')
  label.className = 'pop-bubble-text'
  label.textContent = b.text
  body.appendChild(label)
  node.appendChild(body)
  b.body = body
  // pointerdown, inte click: click har fördröjning på mobil och ett arkadspel
  // ska svara på nedtrycket. touch-action: none i CSS hindrar scroll-gesten.
  node.addEventListener('pointerdown', ev => {
    ev.preventDefault()
    onPopBubbleDown(b)
  })
  return node
}

function renderPopBubbles(){
  for(const b of popBubbles){
    // Poppade bubblor står stilla och äger sin egen animation — skriv inte
    // över deras position i onödan.
    if(!b.node || b.dead) continue
    b.node.style.transform = `translate3d(${b.x}px, ${b.y}px, 0)`
  }
}

// Ett fysiksteg. Bruten ut ur bildrutslingan så att testskalet kan stega
// motorn utan requestAnimationFrame.
function stepPopBubbles(dtSec){
  if(dtSec <= 0) return
  for(const b of popBubbles){
    if(b.dead) continue
    b.x += b.vx * dtSec
    b.y += b.vy * dtSec
    const maxX = popFieldW - b.size
    const maxY = popFieldH - b.size
    if(b.x < 0){ b.x = 0; b.vx = Math.abs(b.vx) }
    else if(b.x > maxX){ b.x = Math.max(0, maxX); b.vx = -Math.abs(b.vx) }
    if(b.y < 0){ b.y = 0; b.vy = Math.abs(b.vy) }
    else if(b.y > maxY){ b.y = Math.max(0, maxY); b.vy = -Math.abs(b.vy) }
  }
  separatePopBubbles()
}

// Bubblor som glider in i varandra knuffas isär och byter riktning. Utan det
// klumpar de ihop sig i ett hörn och blir omöjliga att träffa var för sig.
//
// KÖRS I FLERA VARV, och det är inte överdrift: efter varje isärknuffning
// klampas bubblorna tillbaka innanför kanterna, och den klampningen kan äta
// upp separationen igen för en bubbla som ligger mot en vägg. Ett enda varv
// lämnade därför kvar överlappande bubblor i hörnen (upptäckt av
// scripts/test_pop.js, som råkade placera två bubblor mot vänsterkanten).
// Varven konvergerar snabbt; fler än så ger inget mätbart.
const POP_SEPARATION_PASSES = 4

function separatePopBubbles(){
  for(let pass = 0; pass < POP_SEPARATION_PASSES; pass++){
    if(!separatePopBubblesOnce()) return
  }
}

// Returnerar true om något flyttades, så att slingan kan sluta tidigt.
function separatePopBubblesOnce(){
  let moved = false
  for(let i = 0; i < popBubbles.length; i++){
    const a = popBubbles[i]
    if(a.dead) continue
    for(let j = i + 1; j < popBubbles.length; j++){
      const b = popBubbles[j]
      if(b.dead) continue
      const ax = a.x + a.size / 2, ay = a.y + a.size / 2
      const bx = b.x + b.size / 2, by = b.y + b.size / 2
      let dx = bx - ax, dy = by - ay
      let dist = Math.hypot(dx, dy)
      const minDist = (a.size + b.size) / 2
      if(dist >= minDist) continue
      if(dist === 0){ dx = 1; dy = 0; dist = 1 }
      const nx = dx / dist, ny = dy / dist
      const overlap = minDist - dist

      // Knuffa a halva vägen och mät hur långt den FAKTISKT kom: en bubbla
      // som ligger mot en kant klampas tillbaka och rör sig inte alls. Den
      // andra får då bära hela resten, annars äter klampningen upp halva
      // knuffen varje varv och paret ligger kvar ovanpå varandra i hörnet.
      const ax0 = a.x, ay0 = a.y
      a.x -= nx * (overlap / 2); a.y -= ny * (overlap / 2)
      clampPopBubble(a)
      const flyttadA = Math.hypot(a.x - ax0, a.y - ay0)

      const rest = Math.max(0, overlap - flyttadA)
      b.x += nx * rest; b.y += ny * rest
      clampPopBubble(b)

      // Byt hastighetskomponenten längs kollisionsnormalen (elastisk stöt
      // mellan lika massor).
      const avn = a.vx * nx + a.vy * ny
      const bvn = b.vx * nx + b.vy * ny
      a.vx += (bvn - avn) * nx; a.vy += (bvn - avn) * ny
      b.vx += (avn - bvn) * nx; b.vy += (avn - bvn) * ny
      moved = true
    }
  }
  return moved
}

function clampPopBubble(b){
  b.x = Math.max(0, Math.min(b.x, Math.max(0, popFieldW - b.size)))
  b.y = Math.max(0, Math.min(b.y, Math.max(0, popFieldH - b.size)))
}

function startPopLoop(){
  if(popRafId !== null) return
  if(typeof requestAnimationFrame !== 'function') return
  popLastFrame = 0
  popRafId = requestAnimationFrame(popFrame)
}

function stopPopLoop(){
  if(popRafId !== null && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(popRafId)
  popRafId = null
}

function popFrame(ts){
  if(!popRunning){ popRafId = null; return }
  if(popLastFrame){
    // Taket hindrar ett jättehopp när fliken varit i bakgrunden.
    const dt = Math.min(ts - popLastFrame, POP_MAX_STEP_MS)
    stepPopBubbles(dt / 1000)
    renderPopBubbles()
  }
  popLastFrame = ts
  popRafId = requestAnimationFrame(popFrame)
}

// ============================================================================
// Träff
// ============================================================================
function onPopBubbleDown(b){
  if(!popRunning || popLocked || b.dead) return
  popLocked = true
  popAnswered++
  if(b.correct) popCorrect(b)
  else popWrong(b)
}

function popCorrect(b){
  popScore++
  popStreak++
  if(popStreak > popBestStreak) popBestStreak = popStreak
  burstPopBubble(b, true)
  fadeOtherPopBubbles(b)
  playPopTone('pop', popStreak)
  popVibrate(10)
  updatePopScoreBadge(true)
  updatePopStreakChip()
  flyPopText('+1', 'gain')

  if(popPriorBest > 0 && popScore > popPriorBest && !popRecordBeaten){
    popRecordBeaten = true
    updatePopRecordChip()
    showPopPraise('Nytt rekord! 🏆', 'record')
  }else if(popStreak > 0 && popStreak % POP_STREAK_STEP === 0){
    showPopPraise(`${popStreak} i rad! 🔥`, 'praise')
  }

  popAdvanceTimer = setTimeout(() => { popAdvanceTimer = null; advancePop() }, POP_RIGHT_MS)
}

function popWrong(b){
  popStreak = 0
  popLostMs += POP_PENALTY_MS
  popDeadline -= POP_PENALTY_MS
  burstPopBubble(b, false)
  playPopTone('wrong')
  popVibrate([12, 40, 12])
  updatePopStreakChip()
  updatePopClock()
  flyPopText(`−${POP_PENALTY_MS / 1000} s`, 'loss')

  // Visa vilken bubbla som VAR rätt — annars lär felet ingenting.
  const right = popBubbles.find(x => x.correct && !x.dead)
  if(right && right.node){
    right.dead = true          // låst: den ska visas, inte gå att poppa i efterhand
    right.node.classList.add('reveal')
    markPopBubble(right, true)
  }
  if(popCurrent){
    popMissed.push({ prompt: popCurrent.prompt, correct: String(popCurrent.correct), chosen: b.text })
  }

  popAdvanceTimer = setTimeout(() => { popAdvanceTimer = null; advancePop() }, POP_WRONG_MS)
}

// Rätt/fel får aldrig förmedlas med enbart färg (WCAG 1.4.1): bubblan får ✓/✗
// plus dold skärmläsartext.
function markPopBubble(b, ok){
  const host = b.body || b.node
  if(!host || host.querySelector('.pop-mark')) return
  const mark = document.createElement('span')
  mark.className = 'pop-mark'
  mark.setAttribute('aria-hidden', 'true')
  mark.textContent = ok ? '✓' : '✗'
  const sr = document.createElement('span')
  sr.className = 'sr-only'
  sr.textContent = ok ? ' — rätt svar' : ' — fel svar'
  host.append(mark, sr)
}

function burstPopBubble(b, ok){
  b.dead = true
  if(!b.node) return
  b.node.classList.add(ok ? 'burst' : 'miss')
  markPopBubble(b, ok)
  if(ok) spawnPopRing(b)
}

// Ringen som slår ut ur en poppad bubbla. Positioneras med left/top eftersom
// den skapas en gång per popp — då är transform fri för skalningen. Ren dekor
// och därför bortvald vid reducerad rörelse; informationen (✓, poäng, klocka)
// sitter i annat.
function spawnPopRing(b){
  if(popReducedMotion()) return
  const field = el('popField')
  if(!field) return
  const ring = document.createElement('span')
  ring.className = 'pop-ring'
  ring.setAttribute('aria-hidden', 'true')
  ring.style.width = b.size + 'px'
  ring.style.height = b.size + 'px'
  ring.style.left = b.x + 'px'
  ring.style.top = b.y + 'px'
  field.appendChild(ring)
  setTimeout(() => ring.remove(), 420)
}

function fadeOtherPopBubbles(except){
  for(const b of popBubbles){
    if(b === except || b.dead) continue
    b.dead = true
    if(b.node) b.node.classList.add('fade')
  }
}

function advancePop(){
  if(!popRunning) return
  if(popRemainingMs() <= 0){ finishPop(); return }
  nextPopQuestion()
}

// ============================================================================
// Klocka, mätare och brickor
// ============================================================================
function popRemainingMs(){
  return Math.max(0, popDeadline - Date.now())
}

function updatePopClock(){
  const left = popRemainingMs()
  const label = el('popClock')
  if(label) label.textContent = (left / 1000).toFixed(1).replace('.', ',') + ' s'
  const fill = el('popClockFill')
  if(fill) fill.style.width = Math.max(0, Math.min(100, (left / POP_DURATION_MS) * 100)) + '%'
  const row = el('popClockRow')
  if(row){
    row.classList.toggle('warn', left <= POP_WARN_MS && left > POP_DANGER_MS)
    row.classList.toggle('danger', left <= POP_DANGER_MS)
  }
}

function updatePopScoreBadge(bump){
  const badge = el('popScoreBadge')
  if(!badge) return
  badge.textContent = `${popScore} poppade`
  if(bump){
    badge.classList.remove('bump')
    void badge.offsetWidth      // forcerad reflow så animationen kan köras om
    badge.classList.add('bump')
  }
}

function updatePopStreakChip(){
  const chip = el('popStreakChip')
  if(!chip) return
  if(popStreak < 2){ chip.classList.add('hidden'); chip.textContent = ''; return }
  chip.classList.remove('hidden')
  chip.textContent = `🔥 ${popStreak}`
}

// Spökmålet: personbästa i ämnet syns UNDER spelet, inte bara efteråt.
function updatePopRecordChip(){
  const chip = el('popRecordChip')
  if(!chip) return
  if(!popPriorBest){ chip.classList.add('hidden'); chip.textContent = ''; return }
  chip.classList.remove('hidden')
  chip.textContent = popRecordBeaten ? '🏆 rekord slaget' : `🏆 ${popPriorBest}`
}

function showPopPraise(text, tone){
  const p = el('popPraise')
  if(!p) return
  p.textContent = text
  p.classList.remove('hidden')
  playPopTone(tone === 'record' ? 'record' : 'praise')
  if(popPraiseTimer) clearTimeout(popPraiseTimer)
  popPraiseTimer = setTimeout(hidePopPraise, POP_PRAISE_MS)
}

function hidePopPraise(){
  if(popPraiseTimer){ clearTimeout(popPraiseTimer); popPraiseTimer = null }
  el('popPraise')?.classList.add('hidden')
}

function flyPopText(text, kind){
  const fly = el('popFly')
  if(!fly) return
  fly.textContent = text
  fly.classList.remove('hidden', 'gain', 'loss', 'go')
  fly.classList.add(kind)
  void fly.offsetWidth
  fly.classList.add('go')
  if(popFlyTimer) clearTimeout(popFlyTimer)
  popFlyTimer = setTimeout(() => { fly.classList.add('hidden'); popFlyTimer = null }, 620)
}

function startPopClock(){
  clearPopClock()
  popClockInterval = setInterval(onPopTick, POP_TICK_MS)
}

function clearPopClock(){
  if(popClockInterval){ clearInterval(popClockInterval); popClockInterval = null }
}

function onPopTick(){
  if(!popRunning) return
  updatePopClock()
  const left = popRemainingMs()
  const sec = Math.ceil(left / 1000)
  if(left <= POP_TICKING_MS && sec !== popLastTickSec && sec > 0){
    popLastTickSec = sec
    playPopTone('tick')
  }
  if(left <= 0) finishPop()
}

function animatePopRing(pct){
  const label = el('popRingPct')
  if(label) label.textContent = pct + ' %'
  const ring = el('popRingProgress')
  if(!ring) return
  const clamped = Math.max(0, Math.min(100, pct))
  const offset = POP_RING_CIRCUMFERENCE * (1 - clamped / 100)
  ring.style.strokeDashoffset = String(POP_RING_CIRCUMFERENCE)
  if(popReducedMotion()){ ring.style.strokeDashoffset = String(offset); return }
  requestAnimationFrame(() => { ring.style.strokeDashoffset = String(offset) })
}

// ============================================================================
// Slutet
// ============================================================================
function renderPopMissed(){
  const wrap = el('popMissedWrap')
  const ul = el('popMissed')
  const more = el('popMissedMore')
  if(!wrap || !ul) return
  ul.innerHTML = ''
  if(!popMissed.length){ wrap.classList.add('hidden'); return }
  wrap.classList.remove('hidden')
  popMissed.slice(0, POP_MISSED_SHOWN).forEach(m => {
    const li = document.createElement('li')
    const q = document.createElement('span')
    q.className = 'pop-missed-q'
    q.textContent = m.prompt
    const a = document.createElement('span')
    a.className = 'pop-missed-a'
    a.textContent = `Rätt: ${m.correct}`
    li.append(q, a)
    ul.appendChild(li)
  })
  if(more){
    const rest = popMissed.length - POP_MISSED_SHOWN
    more.classList.toggle('hidden', rest <= 0)
    if(rest > 0) more.textContent = `… och ${rest} till.`
  }
}

function finishPop(){
  if(!popRunning) return
  popRunning = false
  popLocked = true
  clearPopClock()
  stopPopLoop()
  clearPopCountdown()
  if(popAdvanceTimer){ clearTimeout(popAdvanceTimer); popAdvanceTimer = null }
  hidePopPraise()
  popEndTime = Date.now()

  el('popStage').classList.add('hidden')
  el('popStart')?.classList.add('hidden')
  el('popFinished').classList.remove('hidden')

  const durationMs = Math.max(0, popEndTime - popStartTime)
  const secs = Math.max(1, Math.round(durationMs / 1000))
  const pct = popAnswered ? Math.round((popScore / popAnswered) * 100) : 0
  const isRecord = popPriorBest > 0 && popScore > popPriorBest

  el('popDoneText').textContent = `Tiden är ute! ${popScore} poppade av ${popAnswered} försök.`

  // Bara nyckeltal som faktiskt hände — "🔥 bästa svit 1" är ingen prestation.
  const nyckeltal = []
  // Svenskt decimaltecken är komma, inte punkt.
  if(popScore > 0) nyckeltal.push(`⚡ ${(secs / popScore).toFixed(1).replace('.', ',')} s per bubbla`)
  if(popBestStreak > 1) nyckeltal.push(`🔥 bästa svit ${popBestStreak}`)
  if(popLostMs > 0) nyckeltal.push(`−${popLostMs / 1000} s i tidsstraff`)
  el('popStatsText').textContent = nyckeltal.join(' · ')

  el('popNextText').textContent = isRecord
    ? `Nytt personbästa i ämnet — förra rekordet var ${popPriorBest}.`
    : popPriorBest > 0
      ? `Ditt rekord i ämnet är ${popPriorBest}. ${Math.max(1, popPriorBest - popScore + 1)} fler nästa gång och det är ditt.`
      : 'Första rundan i det här ämnet — nu har du ett rekord att slå.'

  el('popRecordBadge')?.classList.toggle('hidden', !isRecord)
  animatePopRing(pct)
  renderPopMissed()
  playPopTone('end')
  popVibrate([18, 60, 18])

  try{ savePopScore(durationMs) }catch(e){ console.error('savePopScore misslyckades:', e) }
  window.scrollTo({ top: 0 })
}

function savePopScore(durationMs){
  const scores = getPopScores()
  scores.push({
    name: popName,
    topic: popTopic,
    topicLabel: topicLabelFor(popTopic),
    score: popScore,
    answered: popAnswered,
    streak: popBestStreak,
    lostMs: popLostMs,
    durationMs,
    date: new Date().toISOString()
  })
  scores.sort((a, b) => new Date(b.date) - new Date(a.date))
  savePopScores(scores.slice(0, 50))
}

// Ingen avbrytknapp under rundan (medvetet: 60 sekunder är kort, och ett
// arkadläge ska inte ha chrome i vägen). Härifrån går man vidare efter att
// tiden tagit slut.
function quitPop(){
  el('pop').classList.add('hidden')
  el('setup').classList.remove('hidden')
}

// ============================================================================
// Topplistesegmentet (i #highscores)
// ============================================================================
function renderPopScores(){
  const ol = el('scoreList-pop')
  if(!ol) return
  const emptyP = ol.parentElement.querySelector('.hs-empty')
  const scores = getPopScores()
  const pctOf = s => (s.answered > 0 ? (s.score || 0) / s.answered : 0)
  const list = [...scores].sort((a, b) => {
    if((b.score || 0) !== (a.score || 0)) return (b.score || 0) - (a.score || 0)
    if(pctOf(b) !== pctOf(a)) return pctOf(b) - pctOf(a)
    return (b.streak || 0) - (a.streak || 0)
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
    const pct = s.answered ? Math.round(((s.score || 0) / s.answered) * 100) : 0
    li.append(
      mk('sr-rank', (i + 1) + '.'),
      mk('sr-name', s.name),
      mk('sr-topic', abbrev ? `(${abbrev}) ${label}` : label),
      mk('sr-score sr-lead', `${s.score || 0} poppade`),
      mk(pct < 75 ? 'sr-pct weak' : 'sr-pct', `${pct} %`),
      mk('sr-time', `🔥 ${s.streak || 0}`),
      mk('sr-date', new Date(s.date).toLocaleDateString('sv-SE'))
    )
    ol.appendChild(li)
  })
}

function exportPopScores(){
  const scores = getPopScores()
  if(!scores.length){
    alert('Det finns inga resultat från Arcade: Pop! att exportera än.')
    return
  }
  const payload = { type: POP_EXPORT_TYPE, version: 1, exported: new Date().toISOString(), scores }
  downloadJsonBlob(payload, `anatomiquiz-pop-${new Date().toISOString().slice(0, 10)}`)
}

function popScoreSignature(s){ return [s.date, s.name, s.topic, s.score, s.answered].join('|') }

function handleImportPopScores(ev){
  const f = ev.target.files && ev.target.files[0]
  if(!f) return
  const reader = new FileReader()
  reader.onload = () => {
    try{
      const parsed = JSON.parse(reader.result)
      const incoming = Array.isArray(parsed) ? parsed
        : (parsed && parsed.type === POP_EXPORT_TYPE && Array.isArray(parsed.scores)) ? parsed.scores
        : null
      if(!incoming){ alert('Fel format: filen ser inte ut som en exporterad fil från Arcade: Pop!.'); return }
      const merged = getPopScores()
      const seen = new Set(merged.map(popScoreSignature))
      let added = 0, skipped = 0
      incoming.forEach(s => {
        if(!s || typeof s.date !== 'string' || typeof s.score !== 'number'){ skipped++; return }
        const sig = popScoreSignature(s)
        if(seen.has(sig)){ skipped++; return }
        seen.add(sig); merged.push(s); added++
      })
      merged.sort((a, b) => new Date(b.date) - new Date(a.date))
      savePopScores(merged.slice(0, 50))
      renderPopScores()
      alert(`Import klar. Tillagda resultat: ${added}. Hoppade över: ${skipped}.`)
    }catch(e){ alert('Kunde inte läsa JSON: ' + e.message) }
  }
  reader.readAsText(f, 'utf-8')
  ev.target.value = ''
}

function clearPopScoresFlow(){
  if(!confirm('Är du säker? Alla resultat från Arcade: Pop! raderas permanent.')) return
  localStorage.removeItem(POP_SCORES_KEY)
  popMemoryScores = null
  renderPopScores()
}

// ============================================================================
// Uppkoppling (egen DOMContentLoaded, oberoende av app.js:s init)
// ============================================================================
// Läget kräver MC-frågor med korta svar; knappen skuggas för ämnen utan
// flervalsfrågor. Anropas av app.js updateStartButtons() via en skyddad krok.
function updatePopButton(){
  const b = el('startPopBtn')
  if(b) b.disabled = !topicCapabilities().mc
}

// Fältet byter storlek vid rotation och när adressfältet fälls in/ut. Utan
// ommätning studsar bubblorna mot en vägg som inte längre finns.
function onPopResize(){
  const sec = el('pop')
  if(!sec || sec.classList.contains('hidden')) return
  const prevW = popFieldW, prevH = popFieldH
  measurePopField()
  if(!prevW || !prevH || !popFieldW || !popFieldH) return
  const sx = popFieldW / prevW, sy = popFieldH / prevH
  for(const b of popBubbles){
    b.x *= sx; b.y *= sy
    clampPopBubble(b)
  }
  renderPopBubbles()
}

document.addEventListener('DOMContentLoaded', () => {
  el('startPopBtn')?.addEventListener('click', startPop)
  el('popStartBtn')?.addEventListener('click', onPopStartClick)
  el('popRetryBtn')?.addEventListener('click', startPop)
  el('popQuitBtn')?.addEventListener('click', quitPop)
  el('exportScores-pop')?.addEventListener('click', exportPopScores)
  const imp = el('importScoresFile-pop')
  if(imp) imp.addEventListener('change', handleImportPopScores)
  el('importScoresBtn-pop')?.addEventListener('click', () => imp?.click())
  el('clearScores-pop')?.addEventListener('click', clearPopScoresFlow)
  window.addEventListener('resize', onPopResize)
  if(window.visualViewport) window.visualViewport.addEventListener('resize', onPopResize)
  window.addEventListener('orientationchange', () => setTimeout(onPopResize, 250))
  updatePopButton()
})
