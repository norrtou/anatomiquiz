// ============================================================================
// js/shoot.js — arkadläget "Arcade: Shoot!" (prickskytte mot kranier).
// Namnet är två fria ord som ingen firma äger – inga varumärken i filnamn,
// funktioner, id:n, klasser eller synlig text (CLAUDE_REGLER §12.1).
// Slug: "shoot". Facit och alla beslut: scripts/arcade_shoot_todo.md.
// ============================================================================
// EGEN FIL PER SPELLÄGE (CLAUDE_REGLER §12): laddas som klassiskt <script defer>
// EFTER js/app.js och delar globalt scope med den. Använder som globaler:
//   el, shuffle, loadFlags, loadPoolForTopic, topicMatchesSelection,
//   topicLabelFor, eduAbbrevFor, warnStorageUnavailable, downloadJsonBlob,
//   topicCapabilities, allQuestions, fitActiveView, GM_RING_CIRCUMFERENCE,
//   getSharedAudioCtx, reducedMotionPreferred.
// app.js känner bara till läget via två skyddade krokar (renderShootScores,
// updateShootButton). Ämnet hämtas ur den vanliga startvyn precis som i Pop!.
//
// LJUDET är EGET, inte app.js:s delade playTone(): den delade hjälparen
// schemalägger sin första ton på exakt ctx.currentTime, vilket är precis det
// som gjorde Arcade: Pop! stumt på riktiga iPhone (0.9.314, fixat 0.9.315,
// se CLAUDE_REGLER §13.1 punkt 6). unlockShootAudio()/shootBeep() nedan är
// samma upplåsning som js/pop.js, applicerad på den DELADE AudioContext-
// instansen (getSharedAudioCtx) så att sajten inte samlar på sig flera
// kontexter. Tonerna är egna av samma skäl.
// ============================================================================
// SPELLOGIK — se scripts/arcade_shoot_todo.md för hela specen. Sammanfattning:
//
// Fyra kranier med svarsalternativ står på rad högst upp. Du siktar med en
// gevärspipa längst ner (dra var som helst i fältet, släpp för att skjuta)
// och en röd prickad laserlinje visar riktningen. Skjuter du rätt kranium
// faller det omkull, poäng, ny fråga direkt. Mellan dig och målen glider tomma
// kranier ("oskyldiga") förbi — träffar du ett sådant är rundan slut.
//
// Skjuter du fel kranium räknas det som miss (träffsäkerhet ned) och en ny
// fråga kommer, men rundan fortsätter. Ett skott som inte träffar något är
// också en miss, men frågan står KVAR tills 6-sekundersklockan för den
// frågan går ut. Rundan pågår i högst 5 minuter — överlever du hela vägen får
// du utmärkelsen "mästerskytt", ingen extra poäng.
//
// LUCKEGARANTIN (hård designregel, inte en förhoppning): alla hinder delar
// EN gemensam hastighet och sprids jämnt över korridorens bredd när de
// spawnas. Eftersom alla rör sig lika fort är avståndet mellan dem konstant
// för alltid (glappet ändras aldrig av rörelsen i sig) — det enda som kan
// stänga korridoren är om hindren är FÖR BREDA för sitt antal. Storleken
// räknas därför alltid mot maxantalet (4), inte det aktuella antalet, så att
// glappet garanteras >= SHOOT_GAP_FLOOR oavsett hur många hinder som är i
// spel just nu. Det gör garantin till ett bevisbart formelvillkor
// (shootObstacleSize) i stället för något som måste hoppas fram i tester.
// ============================================================================
const SHOOT_SCORES_KEY = 'hur_highscores_shoot'
const SHOOT_EXPORT_TYPE = 'anatomiquiz-shoot'
const SHOOT_ROUND_MS = 5 * 60 * 1000   // 5 minuter → mästerskytt
const SHOOT_Q_MS = 6000                // 6 sekunder per fråga
const SHOOT_TICK_MS = 100
const SHOOT_COUNTDOWN_FROM = 3
const SHOOT_COUNTDOWN_STEP_MS = 800
const SHOOT_Q_WARN_MS = 2000           // frågeklockan blir amber
const SHOOT_PRAISE_MS = 1100
const SHOOT_MISSED_SHOWN = 8

// Rätt kranium: kort paus så fallanimationen hinner synas, som Pop!. Fel
// kranium: längre paus så den avslöjade rätta bubblan hinner läsas.
const SHOOT_RIGHT_MS = 150
const SHOOT_WRONG_MS = 640
const SHOOT_TIMEOUT_MS = 260

// Ordfiltret. Beslutat i facit (mätt underlag): ≤14 tecken, ≤2 ord ger
// 2 861 frågor i 109 ämnen och ryms i ett 76 px-kranium på mobil. Mjuk
// lättnad för ämnen som annars vore ospelbara, samma princip som Pop!.
const SHOOT_MAX_WORDS = 2
const SHOOT_MAX_CHARS = 14
const SHOOT_MAX_WORDS_RELAXED = 3
const SHOOT_MAX_CHARS_RELAXED = 20
const SHOOT_MIN_POOL = 8               // matchar tröskeln i det mätta underlaget
const SHOOT_MAX_PROMPT = 140

// Sikte och ballistik.
const SHOOT_MAX_AIM_DEG = 70
const SHOOT_PROJECTILE_SPEED = 900     // px/s — startvärde, se facit §6
const SHOOT_PROJECTILE_RADIUS = 5
const SHOOT_MAX_STEP_MS = 50           // hoppa aldrig längre än så per bildruta

// Geometri (andelar av spelytans mått, uträknat vid varje mätning).
const SHOOT_TARGET_ROW_FRAC = 0.15
const SHOOT_OBSTACLE_ROW_FRAC = 0.5
const SHOOT_BARREL_INSET_FRAC = 0.09
const SHOOT_BARREL_INSET_MAX = 56

// Hinder och luckegarantin. Se filhuvudets motivering.
const SHOOT_MAX_OBSTACLES = 4
const SHOOT_GAP_FLOOR = 26             // minsta garanterade lucka i px
const SHOOT_OBSTACLE_SIZE_CAP = 56
const SHOOT_OBSTACLE_SIZE_FLOOR = 16

// Reducerad rörelse: trappan börjar ett steg mildare genom att låtsas att
// mindre tid gått vid uppslag i nivåtabellerna (inte i rundans egen klocka —
// mästerskytt ska fortfarande handla om 5 riktiga minuter).
const SHOOT_RM_EASE_MS = 30000

const SHOOT_PRAISE_HITS_STEP = 10      // beröm var tionde träff
const SHOOT_AUDIO_LEAD = 0.02          // se filhuvudets ljudkommentar

// Svårighetstrappan (facit §4): antalet hinder maxat vid 1:30, farten maxad
// vid 3:00 — två skilda trappor med olika slutpunkt.
const SHOOT_COUNT_LEVELS = [
  { at: 0, count: 1 },
  { at: 30000, count: 2 },
  { at: 60000, count: 3 },
  { at: 90000, count: 4 }
]
const SHOOT_SPEED_LEVELS = [
  { at: 0, speed: 55, label: null },
  { at: 120000, speed: 80, label: 'Snabbare!' },
  { at: 150000, speed: 110, label: 'Ännu snabbare!' },
  { at: 180000, speed: 145, label: 'Maxfart!' }
]

const SHOOT_RING_CIRCUMFERENCE = (typeof GM_RING_CIRCUMFERENCE !== 'undefined') ? GM_RING_CIRCUMFERENCE : 326.7

// --- Rundans tillstånd -------------------------------------------------------
let shootPool = []
let shootDeck = []
let shootDeckIdx = 0
let shootCurrent = null
let shootTargets = []        // { text, correct, dead, x, y, size, node, body }
let shootObstacles = []      // { x, y, size, node, dead }
let shootFieldW = 0
let shootFieldH = 0
let shootBarrelX = 0
let shootBarrelY = 0
let shootHits = 0
let shootAttempts = 0
let shootStreak = 0
let shootBestStreak = 0
let shootMissed = []         // { prompt, correct, chosen }
let shootStartTime = 0
let shootEndTime = 0
let shootRunning = false
let shootLocked = false      // facit visas / fråga byts — nya skott spärras
let shootTickInterval = null
let shootCountdownTimer = null
let shootAdvanceTimer = null
let shootPraiseTimer = null
let shootFlyTimer = null
let shootRafId = null
let shootLastFrame = 0
let shootPriorBest = 0
let shootRecordBeaten = false
let shootName = 'Spelare'
let shootTopic = ''
let shootQDeadline = 0
let shootObstacleCount = 0
let shootObstacleSpeed = 0
let shootLastCountLevel = null
let shootLastSpeedLevel = null
let shootAiming = false
let shootAimAngle = 0        // radianer från lodrätt, positivt = höger
let shootProjectile = null   // { x, y, vx, vy, node }
let shootAudioCtx = null
let shootAudioUnlocked = false

// ============================================================================
// Lagring — eget fack med minnesfallback (privat läge får inte krascha spelet,
// bara tappa historiken).
// ============================================================================
let shootMemoryScores = null

function getShootScores(){
  if(shootMemoryScores) return shootMemoryScores
  try{
    const raw = JSON.parse(localStorage.getItem(SHOOT_SCORES_KEY) || '[]')
    return Array.isArray(raw) ? raw : []
  }catch(e){ return shootMemoryScores || [] }
}

function saveShootScores(scores){
  try{ localStorage.setItem(SHOOT_SCORES_KEY, JSON.stringify(scores)); shootMemoryScores = null }
  catch(e){ shootMemoryScores = scores; warnStorageUnavailable() }
}

// Personbästa i DET HÄR ämnet — poängen väger in överlevd tid, så ett rekord
// från ett annat ämne (annan pool, annan svårighet) är ingen jämförelse.
function shootBestFor(topic){
  return getShootScores().reduce((best, s) => {
    if(s.topic !== topic) return best
    return Math.max(best, s.score || 0)
  }, 0)
}

// ============================================================================
// Ljud och haptik — se filhuvudets motivering till varför läget har egna
// tonfunktioner i stället för app.js:s delade playTone().
// ============================================================================
function getShootAudioCtx(){
  if(shootAudioCtx) return shootAudioCtx
  if(typeof getSharedAudioCtx === 'function'){ shootAudioCtx = getSharedAudioCtx(); return shootAudioCtx }
  const Ctx = (typeof window !== 'undefined') && (window.AudioContext || window.webkitAudioContext)
  if(!Ctx) return null
  try{ shootAudioCtx = new Ctx() }catch(e){ shootAudioCtx = null }
  return shootAudioCtx
}

function shootSoundEnabled(){
  const cb = el('soundEnabled')
  return cb ? !!cb.checked : true
}

// Samma upplåsning som unlockPopAudio() i js/pop.js (facit i CLAUDE_REGLER
// §13.1 punkt 6): kontexten måste väckas genom att faktiskt spela något i
// gesten, inte bara skapas där. Görs på "Kör!"-trycket.
function unlockShootAudio(){
  const ctx = getShootAudioCtx()
  if(!ctx) return null
  if(ctx.state !== 'running' && typeof ctx.resume === 'function'){
    try{ ctx.resume() }catch(e){ /* struntsak: ljudet är inte kritiskt */ }
  }
  if(!shootAudioUnlocked){
    try{
      const src = ctx.createBufferSource()
      src.buffer = ctx.createBuffer(1, 1, 22050)
      src.connect(ctx.destination)
      src.start(0)
      shootAudioUnlocked = true
    }catch(e){ /* samma sak – spelet ska aldrig falla på ljudet */ }
  }
  return ctx
}

// FÖRHÅLLNINGSTID (SHOOT_AUDIO_LEAD): en ton schemalagd på exakt
// ctx.currentTime hamnar i det förflutna precis efter att kontexten väckts
// och droppas tyst av WebKit. Se filhuvudet.
function shootBeep(ctx, freq, offset, dur, peak, glide){
  const t0 = ctx.currentTime + SHOOT_AUDIO_LEAD + offset
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

// Tonhöjden vid träff STIGER med sviten, som Pop! — ljudet berättar att man
// är inne i en serie.
function shootStreakFreq(streak){
  const steps = Math.min(Math.max(streak - 1, 0), 12)
  return 440 * Math.pow(2, steps / 12)
}

function playShootTone(kind, streak){
  if(!shootSoundEnabled()) return
  const ctx = getShootAudioCtx()
  if(!ctx) return
  if(ctx.state !== 'running' && typeof ctx.resume === 'function'){
    try{ ctx.resume() }catch(e){ /* ljudet är aldrig kritiskt */ }
  }
  if(kind === 'shot'){ shootBeep(ctx, 180, 0, 0.05, 0.15, 0.5); return }
  if(kind === 'hit'){ shootBeep(ctx, shootStreakFreq(streak), 0, 0.09, 0.14, 1.4); return }
  if(kind === 'wrong'){ shootBeep(ctx, 200, 0, 0.22, 0.13, 0.75); return }
  if(kind === 'miss'){ shootBeep(ctx, 140, 0, 0.1, 0.09); return }
  if(kind === 'level'){ [659.25, 880].forEach((f, i) => shootBeep(ctx, f, i * 0.07, 0.12, 0.12)); return }
  if(kind === 'praise'){ [880, 1174.66, 1567.98].forEach((f, i) => shootBeep(ctx, f, i * 0.06, 0.12, 0.12)); return }
  if(kind === 'record'){ [659.25, 880, 1174.66, 1318.51].forEach((f, i) => shootBeep(ctx, f, i * 0.08, 0.16, 0.13)); return }
  if(kind === 'tick'){ shootBeep(ctx, 1320, 0, 0.045, 0.06); return }
  if(kind === 'go'){ shootBeep(ctx, 880, 0, 0.16, 0.13); return }
  if(kind === 'innocent'){ [220, 164.81, 130.81].forEach((f, i) => shootBeep(ctx, f, i * 0.13, 0.3, 0.14)); return }
  if(kind === 'marksman'){ [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => shootBeep(ctx, f, i * 0.11, 0.26, 0.14)) }
}

function shootVibrate(pattern){
  if(typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') navigator.vibrate(pattern)
}

// ============================================================================
// Frågeurval
// ============================================================================
function shootWordCount(s){
  return String(s).trim().split(/\s+/).filter(Boolean).length
}

function shootOptionFits(o, maxWords, maxChars){
  const t = String(o).trim()
  return t.length > 0 && t.length <= maxChars && shootWordCount(t) <= maxWords
}

function shootIsShort(q, maxWords, maxChars){
  if(String(q.prompt).length > SHOOT_MAX_PROMPT) return false
  return [q.correct, ...q.distractors].every(o => shootOptionFits(o, maxWords, maxChars))
}

// Grundpoolen: MC utan bild, inte placeholder, inte utesluten, i valt ämne,
// med MINST TRE distraktorer — fyra kranier kräver fyra alternativ.
function buildShootPool(topic, lens){
  const flags = loadFlags()
  const pool = []
  const seen = new Set()
  for(const q of allQuestions){
    if(q.type !== 'mc') continue
    if(q.image) continue
    if(q.source && String(q.source).toLowerCase() === 'placeholder') continue
    if(/^ph\d{3}$/.test(String(q.id))) continue
    if(!q.prompt || !q.correct) continue
    if(!Array.isArray(q.distractors) || q.distractors.length < 3) continue
    if(flags[q.id] && flags[q.id].excluded) continue
    if(!topicMatchesSelection(q, topic, lens)) continue
    const key = `${q.topic}|${q.id}`
    if(seen.has(key)) continue
    seen.add(key)
    pool.push(q)
  }
  return pool
}

// Ett steg mjukare filter hellre än ett ospelbart ämne — men aldrig hela
// poolen, se Pop! för samma resonemang.
function pickShootPool(full){
  const strict = full.filter(q => shootIsShort(q, SHOOT_MAX_WORDS, SHOOT_MAX_CHARS))
  if(strict.length >= SHOOT_MIN_POOL) return strict
  const relaxed = full.filter(q => shootIsShort(q, SHOOT_MAX_WORDS_RELAXED, SHOOT_MAX_CHARS_RELAXED))
  if(relaxed.length >= SHOOT_MIN_POOL) return relaxed
  return strict.length >= relaxed.length ? strict : relaxed
}

function refillShootDeck(){
  const next = shuffle(shootPool.slice())
  if(next.length > 1 && shootCurrent && next[0] === shootCurrent){
    next.push(next.shift())
  }
  shootDeck = next
  shootDeckIdx = 0
}

function drawShootQuestion(){
  if(shootDeckIdx >= shootDeck.length) refillShootDeck()
  return shootDeck[shootDeckIdx++] || null
}

function hasPlayedShoot(){
  return getShootScores().length > 0
}

// ============================================================================
// Start
// ============================================================================
async function startShoot(){
  shootName = el('playerName').value.trim() || 'Spelare'
  shootTopic = el('topic').value

  const lens = await loadPoolForTopic(shootTopic)
  const full = buildShootPool(shootTopic, lens)
  shootPool = pickShootPool(full)
  if(shootPool.length < 4){
    alert('Det här ämnet har för få frågor med korta svar och minst tre felsvar för Arcade: Shoot!. Kranierna kräver fyra alternativ som får plats. Välj ett annat ämne.')
    return
  }

  shootCurrent = null
  refillShootDeck()
  shootTargets = []
  shootObstacles = []
  shootProjectile = null
  shootHits = 0
  shootAttempts = 0
  shootStreak = 0
  shootBestStreak = 0
  shootMissed = []
  shootLocked = true
  shootRunning = false
  shootPriorBest = shootBestFor(shootTopic)
  shootRecordBeaten = false
  shootLastCountLevel = null
  shootLastSpeedLevel = null
  shootAiming = false
  shootAimAngle = 0

  el('setup').classList.add('hidden')
  el('shoot').classList.remove('hidden')
  el('shootFinished').classList.add('hidden')
  el('shootStage').classList.remove('hidden')

  const start = el('shootStart')
  if(start) start.classList.remove('hidden')
  el('shootStartRules')?.classList.toggle('hidden', hasPlayedShoot())

  el('shootPlayerLabel').textContent = shootName
  el('shootMeta').textContent = topicLabelFor(shootTopic)
  clearShootField()
  updateShootScoreBadge(false)
  updateShootStreakChip()
  updateShootRecordChip()
  updateShootRoundClock(0)
  updateShootQClock(SHOOT_Q_MS)

  if(typeof fitActiveView === 'function') fitActiveView()
  measureShootField()
  updateShootAim()
}

// Trycket på "Kör!": väcker ljudet i samma gest (se filhuvudet) och startar
// nedräkningen. Enda stället rundan får börja.
function onShootStartClick(){
  el('shootStart')?.classList.add('hidden')
  unlockShootAudio()
  measureShootField()
  startShootCountdown()
}

function startShootCountdown(){
  const box = el('shootCountdown')
  const nr = el('shootCountdownNr')
  if(!box || !nr){ beginShootRound(); return }
  box.classList.remove('hidden')
  let n = SHOOT_COUNTDOWN_FROM
  const step = () => {
    if(n > 0){
      nr.textContent = String(n)
      nr.classList.remove('tick')
      void nr.offsetWidth
      nr.classList.add('tick')
      playShootTone('tick')
      n--
      shootCountdownTimer = setTimeout(step, SHOOT_COUNTDOWN_STEP_MS)
      return
    }
    nr.textContent = 'Kör!'
    nr.classList.remove('tick')
    void nr.offsetWidth
    nr.classList.add('tick')
    playShootTone('go')
    shootVibrate(12)
    shootCountdownTimer = setTimeout(() => {
      box.classList.add('hidden')
      beginShootRound()
    }, SHOOT_COUNTDOWN_STEP_MS)
  }
  step()
}

function clearShootCountdown(){
  if(shootCountdownTimer){ clearTimeout(shootCountdownTimer); shootCountdownTimer = null }
  el('shootCountdown')?.classList.add('hidden')
}

function beginShootRound(){
  shootRunning = true
  shootLocked = false
  shootStartTime = Date.now()
  measureShootField()
  shootObstacleCount = 0
  shootObstacleSpeed = 0
  shootLastCountLevel = null
  shootLastSpeedLevel = null
  applyShootLevels(0)     // spawnar starthindret utan att beröm triggas
  nextShootQuestion()
  startShootTick()
  startShootLoop()
}

// ============================================================================
// Spelplanen — mätning
// ============================================================================
function measureShootField(){
  const f = el('shootField')
  if(!f) return
  const r = f.getBoundingClientRect()
  shootFieldW = Math.max(0, Math.round(r.width))
  shootFieldH = Math.max(0, Math.round(r.height))
  shootBarrelX = shootFieldW / 2
  shootBarrelY = Math.max(0, shootFieldH - Math.min(SHOOT_BARREL_INSET_MAX, shootFieldH * SHOOT_BARREL_INSET_FRAC))
}

function clearShootField(){
  const t = el('shootTargets'); if(t) t.innerHTML = ''
  const o = el('shootObstacles'); if(o) o.innerHTML = ''
  shootTargets = []
  shootObstacles = []
  removeShootProjectileNode()
  shootProjectile = null
}

// ============================================================================
// Målen — fyra kranier, fasta platser (ingen fysik, till skillnad från Pop!)
// ============================================================================
function shootTargetSize(){
  const slot = shootFieldW / 4
  return Math.max(48, Math.min(84, slot - 12))
}

function buildShootTargets(q){
  const wrap = el('shootTargets')
  if(!wrap) return
  wrap.innerHTML = ''
  shootTargets = []
  if(!shootFieldW || !shootFieldH) measureShootField()

  const slot = shootFieldW / 4
  const size = shootTargetSize()
  const opts = shuffle([
    { text: String(q.correct), correct: true },
    ...q.distractors.slice(0, 3).map(d => ({ text: String(d), correct: false }))
  ])
  opts.forEach((o, i) => {
    const t = {
      text: o.text, correct: o.correct, dead: false,
      x: i * slot + slot / 2,
      y: shootFieldH * SHOOT_TARGET_ROW_FRAC,
      size, node: null, body: null
    }
    t.node = makeShootTargetNode(t)
    wrap.appendChild(t.node)
    shootTargets.push(t)
  })
}

function makeShootTargetNode(t){
  const node = document.createElement('div')
  node.className = 'shoot-target'
  node.style.width = t.size + 'px'
  node.style.height = t.size + 'px'
  node.style.transform = `translate3d(${t.x - t.size / 2}px, ${t.y - t.size / 2}px, 0)`
  const body = document.createElement('span')
  body.className = 'shoot-target-body'
  const label = document.createElement('span')
  label.className = 'shoot-target-text'
  label.textContent = t.text
  body.appendChild(label)
  node.appendChild(body)
  t.body = body
  return node
}

function nextShootQuestion(){
  if(!shootRunning) return
  shootCurrent = drawShootQuestion()
  if(!shootCurrent) return
  shootLocked = false
  buildShootTargets(shootCurrent)
  shootQDeadline = Date.now() + SHOOT_Q_MS
  updateShootQClock(SHOOT_Q_MS)
}

// ============================================================================
// Hindren — se filhuvudets bevis för luckegarantin
// ============================================================================
// Storleken räknas mot MAXANTALET hinder (4), inte det aktuella, så att
// garantin gäller vid varje trappsteg: gap = corridorW/count − size, och
// eftersom size ≤ corridorW/SHOOT_MAX_OBSTACLES − SHOOT_GAP_FLOOR och
// count ≤ SHOOT_MAX_OBSTACLES, blir gap alltid ≥ SHOOT_GAP_FLOOR.
function shootObstacleSize(corridorW){
  const raw = corridorW / SHOOT_MAX_OBSTACLES - SHOOT_GAP_FLOOR
  return Math.max(SHOOT_OBSTACLE_SIZE_FLOOR, Math.min(SHOOT_OBSTACLE_SIZE_CAP, raw))
}

// Jämnt spridda med en gemensam slumpad fasförskjutning. Alla hinder delar
// EN hastighet (shootObstacleSpeed) och flyttas lika mycket varje bildruta,
// så inbördes avstånd är konstant för alltid — garantin behöver aldrig
// verifieras löpande, bara vid spawn.
function spawnShootObstacles(count){
  const wrap = el('shootObstacles')
  if(wrap) wrap.innerHTML = ''
  shootObstacles = []
  if(count <= 0) return
  const corridorW = Math.max(1, shootFieldW)
  const size = shootObstacleSize(corridorW)
  const spacing = corridorW / count
  const phase = Math.random() * spacing
  for(let i = 0; i < count; i++){
    const o = {
      x: (phase + i * spacing) % corridorW,
      y: shootFieldH * SHOOT_OBSTACLE_ROW_FRAC,
      size, node: null, dead: false
    }
    o.node = makeShootObstacleNode(o)
    if(wrap) wrap.appendChild(o.node)
    shootObstacles.push(o)
  }
  renderShootObstacles()
}

function makeShootObstacleNode(o){
  const node = document.createElement('div')
  node.className = 'shoot-obstacle'
  node.style.width = o.size + 'px'
  node.style.height = o.size + 'px'
  return node
}

function stepShootObstacles(dtSec){
  if(dtSec <= 0 || !shootObstacles.length) return
  const corridorW = Math.max(1, shootFieldW)
  for(const o of shootObstacles){
    o.x = (o.x + shootObstacleSpeed * dtSec) % corridorW
    if(o.x < 0) o.x += corridorW
  }
}

function renderShootObstacles(){
  for(const o of shootObstacles){
    if(!o.node) continue
    o.node.style.transform = `translate3d(${o.x - o.size / 2}px, ${o.y - o.size / 2}px, 0)`
  }
}

// ============================================================================
// Svårighetstrappan (facit §4)
// ============================================================================
function shootLevelFor(table, elapsed){
  let cur = table[0]
  for(const lvl of table){ if(elapsed >= lvl.at) cur = lvl; else break }
  return cur
}

// Anropas varje tick. Reducerad rörelse gör tabelluppslaget "efter" genom
// att dra bort SHOOT_RM_EASE_MS ur elapsed — rundans EGEN klocka (5 min) rörs
// aldrig av detta, bara vilket steg i trappan som gäller just nu.
function applyShootLevels(realElapsed){
  const eased = Math.max(0, realElapsed - (reducedMotionPreferred() ? SHOOT_RM_EASE_MS : 0))
  const countLvl = shootLevelFor(SHOOT_COUNT_LEVELS, eased)
  const speedLvl = shootLevelFor(SHOOT_SPEED_LEVELS, eased)

  if(countLvl.count !== shootObstacleCount){
    const first = shootLastCountLevel === null
    shootObstacleCount = countLvl.count
    spawnShootObstacles(shootObstacleCount)
    if(!first) showShootPraise(`${shootObstacleCount} hinder nu!`, 'level')
    shootLastCountLevel = countLvl.count
  }
  if(speedLvl.speed !== shootObstacleSpeed){
    const first = shootLastSpeedLevel === null
    shootObstacleSpeed = speedLvl.speed
    if(!first && speedLvl.label) showShootPraise(speedLvl.label, 'level')
    shootLastSpeedLevel = speedLvl.speed
  }
}

// ============================================================================
// Rundans klocka — TVÅ mätare (facit §13.1 punkt 3): överlevnadstiden räknar
// UPP mot 5 minuter, frågeklockan räknar NED mot 6 sekunder.
// ============================================================================
function startShootTick(){
  clearShootTick()
  shootTickInterval = setInterval(onShootTick, SHOOT_TICK_MS)
}

function clearShootTick(){
  if(shootTickInterval){ clearInterval(shootTickInterval); shootTickInterval = null }
}

function shootQRemainingMs(){
  return Math.max(0, shootQDeadline - Date.now())
}

function shootRoundElapsedMs(){
  return Date.now() - shootStartTime
}

function onShootTick(){
  if(!shootRunning) return
  const elapsed = shootRoundElapsedMs()
  updateShootRoundClock(elapsed)
  applyShootLevels(elapsed)
  updateShootQClock(shootQRemainingMs())
  updateShootRecordChip()
  if(!shootLocked && shootQRemainingMs() <= 0){ shootQuestionTimeout(); return }
  if(elapsed >= SHOOT_ROUND_MS){ finishShoot('marksman') }
}

function updateShootRoundClock(elapsed){
  const clamped = Math.min(Math.max(0, elapsed), SHOOT_ROUND_MS)
  const secs = Math.floor(clamped / 1000)
  const mm = String(Math.floor(secs / 60)).padStart(2, '0')
  const ss = String(secs % 60).padStart(2, '0')
  const label = el('shootRoundClock')
  if(label) label.textContent = `${mm}:${ss}`
  const fill = el('shootRoundFill')
  if(fill) fill.style.width = Math.max(0, Math.min(100, (clamped / SHOOT_ROUND_MS) * 100)) + '%'
}

function updateShootQClock(msLeft){
  const fill = el('shootQClockFill')
  if(fill) fill.style.width = Math.max(0, Math.min(100, (msLeft / SHOOT_Q_MS) * 100)) + '%'
  const row = el('shootQClockRow')
  if(row) row.classList.toggle('warn', msLeft <= SHOOT_Q_WARN_MS)
}

// 6 sekunder utan träff: målen byts, räknas som miss. Rundan fortsätter.
function shootQuestionTimeout(){
  if(!shootRunning || shootLocked) return
  shootLocked = true
  shootAttempts++
  shootStreak = 0
  updateShootStreakChip()
  updateShootScoreBadge(false)
  if(shootCurrent){ shootMissed.push({ prompt: shootCurrent.prompt, correct: String(shootCurrent.correct), chosen: null }) }
  playShootTone('miss')
  shootVibrate([10, 30, 10])
  flyShootText('Tiden ute', 'loss')
  shootAdvanceTimer = setTimeout(() => {
    shootAdvanceTimer = null
    shootLocked = false
    if(shootRunning) nextShootQuestion()
  }, SHOOT_TIMEOUT_MS)
}

// ============================================================================
// Sikte och laser
// ============================================================================
function shootAngleFromClient(clientX, clientY){
  const field = el('shootField')
  if(!field) return shootAimAngle
  const rect = field.getBoundingClientRect()
  const px = clientX - rect.left
  const py = clientY - rect.top
  const dx = px - shootBarrelX
  const dy = py - shootBarrelY
  const angle = Math.atan2(dx, -dy)
  const maxRad = SHOOT_MAX_AIM_DEG * Math.PI / 180
  return Math.max(-maxRad, Math.min(maxRad, angle))
}

// Pipa + laserlinje delar samma pivot (barrelX, barrelY) och samma vinkel.
// Pipan och mynningsflamman är NOLLSTORA ankarelement (width/height: 0 i
// CSS) — för en sådan låda ligger transform-origin (som alltid räknas i
// procent av lådans EGEN storlek) exakt i ankarpunkten oavsett procenttal,
// så translate3d(x, y) + rotate() snurrar runt precis rätt punkt utan extra
// uträkning. Laserlinjen har verklig höjd (den ÄR strålen), så den positioneras
// i stället med left/top så att dess UNDERKANT hamnar i pivotpunkten, och
// roterar runt den kanten (transform-origin: bottom center i CSS).
function updateShootAim(){
  const deg = shootAimAngle * 180 / Math.PI
  const beam = el('shootLaserBeam')
  if(beam){
    const length = Math.max(0, shootBarrelY - shootFieldH * SHOOT_TARGET_ROW_FRAC * 0.4)
    beam.style.height = length + 'px'
    beam.style.left = shootBarrelX + 'px'
    beam.style.top = (shootBarrelY - length) + 'px'
    beam.style.transform = `rotate(${deg}deg)`
  }
  const barrel = el('shootBarrel')
  if(barrel) barrel.style.transform = `translate3d(${shootBarrelX}px, ${shootBarrelY}px, 0) rotate(${deg}deg)`
  const flash = el('shootMuzzleFlash')
  if(flash) flash.style.transform = `translate3d(${shootBarrelX}px, ${shootBarrelY}px, 0) rotate(${deg}deg)`
}

// Generös träffyta (facit §7 punkt 7): man siktar genom att dra VAR SOM
// HELST i fältet, inte genom att träffa pipan.
function onShootPointerDown(ev){
  if(!shootRunning) return
  ev.preventDefault()
  shootAiming = true
  shootAimAngle = shootAngleFromClient(ev.clientX, ev.clientY)
  updateShootAim()
}
function onShootPointerMove(ev){
  if(!shootAiming) return
  shootAimAngle = shootAngleFromClient(ev.clientX, ev.clientY)
  updateShootAim()
}
function onShootPointerUp(ev){
  if(!shootAiming) return
  shootAiming = false
  fireShoot()
}
function onShootPointerCancel(){
  shootAiming = false
}

// ============================================================================
// Skottet — ballistik och kollision
// ============================================================================
function fireShoot(){
  if(!shootRunning || shootLocked || shootProjectile) return
  shootProjectile = {
    x: shootBarrelX, y: shootBarrelY,
    vx: Math.sin(shootAimAngle) * SHOOT_PROJECTILE_SPEED,
    vy: -Math.cos(shootAimAngle) * SHOOT_PROJECTILE_SPEED,
    node: null
  }
  shootProjectile.node = makeShootProjectileNode()
  const field = el('shootField')
  if(field && shootProjectile.node) field.appendChild(shootProjectile.node)
  renderShootProjectile()
  playShootTone('shot')
  shootVibrate(10)
  triggerShootRecoil()
  triggerShootMuzzleFlash()
}

function makeShootProjectileNode(){
  const node = document.createElement('span')
  node.className = 'shoot-projectile'
  node.setAttribute('aria-hidden', 'true')
  return node
}

function removeShootProjectileNode(){
  if(shootProjectile && shootProjectile.node) shootProjectile.node.remove()
}

function renderShootProjectile(){
  if(!shootProjectile || !shootProjectile.node) return
  shootProjectile.node.style.transform = `translate3d(${shootProjectile.x}px, ${shootProjectile.y}px, 0)`
}

function circlesOverlap(x1, y1, r1, x2, y2, r2){
  return Math.hypot(x1 - x2, y1 - y2) <= (r1 + r2)
}

// Kollisionen stegas längs banan varje bildruta, cirkel mot cirkel (facit
// §6). Hindren kollas FÖRE målen, eftersom de fysiskt ligger i vägen.
function stepShootProjectile(dtSec){
  const p = shootProjectile
  if(!p) return
  p.x += p.vx * dtSec
  p.y += p.vy * dtSec

  for(const o of shootObstacles){
    if(o.dead) continue
    const hitR = o.size / 2 * 0.85     // lite förlåtande — visuellt guidar, hitboxen är snällare
    if(circlesOverlap(p.x, p.y, SHOOT_PROJECTILE_RADIUS, o.x, o.y, hitR)){
      handleShootObstacleHit(o)
      return
    }
  }
  for(const t of shootTargets){
    if(t.dead) continue
    const hitR = t.size / 2 * 1.1      // generös — kranierna är smala mål
    if(circlesOverlap(p.x, p.y, SHOOT_PROJECTILE_RADIUS, t.x, t.y, hitR)){
      handleShootTargetHit(t)
      return
    }
  }
  if(p.y < -SHOOT_PROJECTILE_RADIUS){
    handleShootMissShot()
    return
  }
  renderShootProjectile()
}

function handleShootTargetHit(t){
  removeShootProjectileNode()
  shootProjectile = null
  shootLocked = true
  shootAttempts++
  if(t.correct) shootCorrectHit(t)
  else shootWrongHit(t)
}

function shootCorrectHit(t){
  shootHits++
  shootStreak++
  if(shootStreak > shootBestStreak) shootBestStreak = shootStreak
  t.dead = true
  if(t.node) t.node.classList.add('fallen')
  markShootTarget(t, true)
  playShootTone('hit', shootStreak)
  shootVibrate(10)
  updateShootScoreBadge(true)
  updateShootStreakChip()
  flyShootText('+1', 'gain')

  const liveScore = computeShootScore(shootHits, shootAttempts, shootRoundElapsedMs())
  if(shootPriorBest > 0 && liveScore > shootPriorBest && !shootRecordBeaten){
    shootRecordBeaten = true
    updateShootRecordChip()
    showShootPraise('Nytt rekord! 🏆', 'record')
  }else if(shootHits > 0 && shootHits % SHOOT_PRAISE_HITS_STEP === 0){
    showShootPraise(`${shootHits} träffar! 🎯`, 'praise')
  }

  shootAdvanceTimer = setTimeout(() => {
    shootAdvanceTimer = null
    shootLocked = false
    if(shootRunning) nextShootQuestion()
  }, SHOOT_RIGHT_MS)
}

function shootWrongHit(t){
  shootStreak = 0
  t.dead = true
  if(t.node) t.node.classList.add('missed')
  markShootTarget(t, false)

  // Visa vilket kranium som VAR rätt — annars lär felet ingenting (som Pop!).
  const right = shootTargets.find(x => x.correct && !x.dead)
  if(right){
    right.dead = true
    if(right.node) right.node.classList.add('reveal')
    markShootTarget(right, true)
  }
  if(shootCurrent){ shootMissed.push({ prompt: shootCurrent.prompt, correct: String(shootCurrent.correct), chosen: t.text }) }

  playShootTone('wrong')
  shootVibrate([12, 40, 12])
  updateShootStreakChip()
  flyShootText('Fel', 'loss')

  shootAdvanceTimer = setTimeout(() => {
    shootAdvanceTimer = null
    shootLocked = false
    if(shootRunning) nextShootQuestion()
  }, SHOOT_WRONG_MS)
}

// Rätt/fel förmedlas aldrig med enbart färg (WCAG 1.4.1): ✓/✗ + dold
// skärmläsartext, som Pop!.
function markShootTarget(t, ok){
  const host = t.body || t.node
  if(!host || host.querySelector('.shoot-mark')) return
  const mark = document.createElement('span')
  mark.className = 'shoot-mark'
  mark.setAttribute('aria-hidden', 'true')
  mark.textContent = ok ? '✓' : '✗'
  const sr = document.createElement('span')
  sr.className = 'sr-only'
  sr.textContent = ok ? ' — rätt svar' : ' — fel svar'
  host.append(mark, sr)
}

// Skott som inte träffar något: miss, men frågan står KVAR (facit §3) —
// bara laserlinjen blinkar rött, ingen omritning.
function handleShootMissShot(){
  removeShootProjectileNode()
  shootProjectile = null
  shootAttempts++
  shootStreak = 0
  updateShootStreakChip()
  playShootTone('miss')
  shootVibrate(8)
  flashShootLaserMiss()
}

function flashShootLaserMiss(){
  const beam = el('shootLaserBeam')
  if(!beam) return
  beam.classList.remove('miss')
  void beam.offsetWidth
  beam.classList.add('miss')
}

// Ett oskyldigt kranium träffat: rundan är slut, omedelbart.
function handleShootObstacleHit(o){
  removeShootProjectileNode()
  shootProjectile = null
  triggerShootScreenShake()
  finishShoot('innocent')
}

// ============================================================================
// Bildruteslingan — hinder och projektil stegas tillsammans
// ============================================================================
function startShootLoop(){
  if(shootRafId !== null) return
  if(typeof requestAnimationFrame !== 'function') return
  shootLastFrame = 0
  shootRafId = requestAnimationFrame(shootFrame)
}

function stopShootLoop(){
  if(shootRafId !== null && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(shootRafId)
  shootRafId = null
}

function shootFrame(ts){
  if(!shootRunning){ shootRafId = null; return }
  if(shootLastFrame){
    const dt = Math.min(ts - shootLastFrame, SHOOT_MAX_STEP_MS)
    const dtSec = dt / 1000
    stepShootObstacles(dtSec)
    renderShootObstacles()
    if(shootProjectile) stepShootProjectile(dtSec)
  }
  shootLastFrame = ts
  shootRafId = requestAnimationFrame(shootFrame)
}

// ============================================================================
// Poäng (facit §5): träffar × 10 × träffsäkerhet + 1 poäng per överlevd sekund
// ============================================================================
function computeShootScore(hits, attempts, survivedMs){
  const accuracy = attempts > 0 ? hits / attempts : 0
  const survivedSec = Math.floor(Math.max(0, survivedMs) / 1000)
  return hits * 10 * accuracy + survivedSec
}

// ============================================================================
// HUD-brickor
// ============================================================================
function updateShootScoreBadge(bump){
  const badge = el('shootScoreBadge')
  if(!badge) return
  badge.textContent = `${shootHits} träffar`
  if(bump){
    badge.classList.remove('bump')
    void badge.offsetWidth
    badge.classList.add('bump')
  }
}

function updateShootStreakChip(){
  const chip = el('shootStreakChip')
  if(!chip) return
  if(shootStreak < 2){ chip.classList.add('hidden'); chip.textContent = ''; return }
  chip.classList.remove('hidden')
  chip.textContent = `🔥 ${shootStreak}`
}

// Spökmålet: personbästa (i poäng) syns UNDER spelet, som i Pop!.
function updateShootRecordChip(){
  const chip = el('shootRecordChip')
  if(!chip) return
  if(!shootPriorBest){ chip.classList.add('hidden'); chip.textContent = ''; return }
  chip.classList.remove('hidden')
  chip.textContent = shootRecordBeaten ? '🏆 rekord slaget' : `🏆 ${Math.round(shootPriorBest)}`
}

function showShootPraise(text, tone){
  const p = el('shootPraise')
  if(!p) return
  p.textContent = text
  p.classList.remove('hidden')
  playShootTone(tone === 'record' ? 'record' : tone === 'level' ? 'level' : 'praise')
  if(shootPraiseTimer) clearTimeout(shootPraiseTimer)
  shootPraiseTimer = setTimeout(hideShootPraise, SHOOT_PRAISE_MS)
}

function hideShootPraise(){
  if(shootPraiseTimer){ clearTimeout(shootPraiseTimer); shootPraiseTimer = null }
  el('shootPraise')?.classList.add('hidden')
}

function flyShootText(text, kind){
  const fly = el('shootFly')
  if(!fly) return
  fly.textContent = text
  fly.classList.remove('hidden', 'gain', 'loss', 'go')
  fly.classList.add(kind)
  void fly.offsetWidth
  fly.classList.add('go')
  if(shootFlyTimer) clearTimeout(shootFlyTimer)
  shootFlyTimer = setTimeout(() => { fly.classList.add('hidden'); shootFlyTimer = null }, 620)
}

// ============================================================================
// Spelkänsla: rekyl, mynningsflamma, skärmskak — ren dekor, avstängd vid
// reducerad rörelse (facit §7 punkt 8). Hindrens rörelse är INTE dekor och
// stängs aldrig av här.
// ============================================================================
function triggerShootRecoil(){
  if(reducedMotionPreferred()) return
  const barrel = el('shootBarrel')
  if(!barrel) return
  barrel.classList.remove('recoil')
  void barrel.offsetWidth
  barrel.classList.add('recoil')
}

// Positionen hålls redan i synk av updateShootAim() (körs vid varje
// sikttryck/drag); här behövs bara själva flimret.
function triggerShootMuzzleFlash(){
  if(reducedMotionPreferred()) return
  const flash = el('shootMuzzleFlash')
  if(!flash) return
  flash.classList.remove('go')
  void flash.offsetWidth
  flash.classList.add('go')
}

function triggerShootScreenShake(){
  if(reducedMotionPreferred()) return
  const field = el('shootField')
  if(!field) return
  field.classList.remove('shake')
  void field.offsetWidth
  field.classList.add('shake')
}

function animateShootRing(pct){
  const label = el('shootRingPct')
  if(label) label.textContent = pct + ' %'
  const ring = el('shootRingProgress')
  if(!ring) return
  const clamped = Math.max(0, Math.min(100, pct))
  const offset = SHOOT_RING_CIRCUMFERENCE * (1 - clamped / 100)
  ring.style.strokeDashoffset = String(SHOOT_RING_CIRCUMFERENCE)
  if(reducedMotionPreferred()){ ring.style.strokeDashoffset = String(offset); return }
  requestAnimationFrame(() => { ring.style.strokeDashoffset = String(offset) })
}

// ============================================================================
// Slutet — TVÅ olika slut som ska kännas olika (facit §7 punkt 5)
// ============================================================================
function formatShootTime(ms){
  const secs = Math.floor(Math.max(0, ms) / 1000)
  const mm = Math.floor(secs / 60)
  const ss = String(secs % 60).padStart(2, '0')
  return `${mm}:${ss} min`
}

function renderShootMissed(){
  const wrap = el('shootMissedWrap')
  const ul = el('shootMissed')
  const more = el('shootMissedMore')
  if(!wrap || !ul) return
  ul.innerHTML = ''
  if(!shootMissed.length){ wrap.classList.add('hidden'); return }
  wrap.classList.remove('hidden')
  shootMissed.slice(0, SHOOT_MISSED_SHOWN).forEach(m => {
    const li = document.createElement('li')
    const q = document.createElement('span')
    q.className = 'shoot-missed-q'
    q.textContent = m.prompt
    const a = document.createElement('span')
    a.className = 'shoot-missed-a'
    a.textContent = `Rätt: ${m.correct}`
    li.append(q, a)
    ul.appendChild(li)
  })
  if(more){
    const rest = shootMissed.length - SHOOT_MISSED_SHOWN
    more.classList.toggle('hidden', rest <= 0)
    if(rest > 0) more.textContent = `… och ${rest} till.`
  }
}

function finishShoot(reason){
  if(!shootRunning) return
  shootRunning = false
  shootLocked = true
  clearShootTick()
  stopShootLoop()
  clearShootCountdown()
  if(shootAdvanceTimer){ clearTimeout(shootAdvanceTimer); shootAdvanceTimer = null }
  hideShootPraise()
  shootEndTime = Date.now()

  el('shootStage').classList.add('hidden')
  el('shootStart')?.classList.add('hidden')
  el('shootFinished').classList.remove('hidden')

  const isMarksman = reason === 'marksman'
  const survivedMs = Math.min(SHOOT_ROUND_MS, Math.max(0, shootEndTime - shootStartTime))
  const finalScore = Math.round(computeShootScore(shootHits, shootAttempts, survivedMs))
  const pct = shootAttempts ? Math.round((shootHits / shootAttempts) * 100) : 0
  const isRecord = shootPriorBest > 0 ? finalScore > shootPriorBest : shootHits > 0

  el('shootDoneText').textContent = isMarksman
    ? `Du är en mästerskytt! ${shootHits} träffar på ${formatShootTime(survivedMs)}.`
    : `Träffad av ett oskyldigt kranium. ${shootHits} träffar på ${formatShootTime(survivedMs)}.`

  const nyckeltal = []
  if(shootBestStreak > 1) nyckeltal.push(`🔥 bästa svit ${shootBestStreak}`)
  if(shootAttempts > 0) nyckeltal.push(`🎯 ${pct} % träffsäkerhet`)
  nyckeltal.push(`⭐ ${finalScore} poäng`)
  el('shootStatsText').textContent = nyckeltal.join(' · ')

  el('shootNextText').textContent = isRecord
    ? (shootPriorBest > 0
        ? `Nytt personbästa i ämnet — förra rekordet var ${Math.round(shootPriorBest)} poäng.`
        : 'Första rundan i det här ämnet — nu har du ett rekord att slå.')
    : `Ditt rekord i ämnet är ${Math.round(shootPriorBest)} poäng.`

  el('shootRecordBadge')?.classList.toggle('hidden', !isRecord)
  el('shootMarksmanBadge')?.classList.toggle('hidden', !isMarksman)
  el('shootFinished')?.classList.toggle('shoot-finished--marksman', isMarksman)
  el('shootFinished')?.classList.toggle('shoot-finished--defeat', !isMarksman)

  animateShootRing(pct)
  renderShootMissed()
  playShootTone(isMarksman ? 'marksman' : 'innocent')
  shootVibrate(isMarksman ? [18, 60, 18, 60, 18] : [30, 80, 30])

  try{ saveShootScore(survivedMs, finalScore, isMarksman) }catch(e){ console.error('saveShootScore misslyckades:', e) }
  window.scrollTo({ top: 0 })
}

function saveShootScore(survivedMs, finalScore, isMarksman){
  const scores = getShootScores()
  scores.push({
    name: shootName,
    topic: shootTopic,
    topicLabel: topicLabelFor(shootTopic),
    score: finalScore,
    hits: shootHits,
    attempts: shootAttempts,
    streak: shootBestStreak,
    survivedMs,
    marksman: isMarksman,
    date: new Date().toISOString()
  })
  scores.sort((a, b) => new Date(b.date) - new Date(a.date))
  saveShootScores(scores.slice(0, 50))
}

// Ingen avbrytknapp under rundan (samma val som Pop!, se §12.2): rundan tar
// slut av sig själv, antingen av ett oskyldigt kranium eller av klockan.
function quitShoot(){
  el('shoot').classList.add('hidden')
  el('setup').classList.remove('hidden')
}

// ============================================================================
// Topplistesegmentet (i #highscores)
// ============================================================================
function renderShootScores(){
  const ol = el('scoreList-shoot')
  if(!ol) return
  const emptyP = ol.parentElement.querySelector('.hs-empty')
  const scores = getShootScores()
  const pctOf = s => (s.attempts > 0 ? (s.hits || 0) / s.attempts : 0)
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
    const pct = s.attempts ? Math.round(((s.hits || 0) / s.attempts) * 100) : 0
    li.append(
      mk('sr-rank', (i + 1) + '.'),
      mk('sr-name', s.name + (s.marksman ? ' ⭐' : '')),
      mk('sr-topic', abbrev ? `(${abbrev}) ${label}` : label),
      mk('sr-score sr-lead', `${s.score || 0} p`),
      mk(pct < 75 ? 'sr-pct weak' : 'sr-pct', `${pct} %`),
      mk('sr-time', `🔥 ${s.streak || 0}`),
      mk('sr-date', new Date(s.date).toLocaleDateString('sv-SE'))
    )
    ol.appendChild(li)
  })
}

function exportShootScores(){
  const scores = getShootScores()
  if(!scores.length){
    alert('Det finns inga resultat från Arcade: Shoot! att exportera än.')
    return
  }
  const payload = { type: SHOOT_EXPORT_TYPE, version: 1, exported: new Date().toISOString(), scores }
  downloadJsonBlob(payload, `anatomiquiz-shoot-${new Date().toISOString().slice(0, 10)}`)
}

function shootScoreSignature(s){ return [s.date, s.name, s.topic, s.score, s.attempts].join('|') }

function handleImportShootScores(ev){
  const f = ev.target.files && ev.target.files[0]
  if(!f) return
  const reader = new FileReader()
  reader.onload = () => {
    try{
      const parsed = JSON.parse(reader.result)
      const incoming = Array.isArray(parsed) ? parsed
        : (parsed && parsed.type === SHOOT_EXPORT_TYPE && Array.isArray(parsed.scores)) ? parsed.scores
        : null
      if(!incoming){ alert('Fel format: filen ser inte ut som en exporterad fil från Arcade: Shoot!.'); return }
      const merged = getShootScores()
      const seen = new Set(merged.map(shootScoreSignature))
      let added = 0, skipped = 0
      incoming.forEach(s => {
        if(!s || typeof s.date !== 'string' || typeof s.score !== 'number'){ skipped++; return }
        const sig = shootScoreSignature(s)
        if(seen.has(sig)){ skipped++; return }
        seen.add(sig); merged.push(s); added++
      })
      merged.sort((a, b) => new Date(b.date) - new Date(a.date))
      saveShootScores(merged.slice(0, 50))
      renderShootScores()
      alert(`Import klar. Tillagda resultat: ${added}. Hoppade över: ${skipped}.`)
    }catch(e){ alert('Kunde inte läsa JSON: ' + e.message) }
  }
  reader.readAsText(f, 'utf-8')
  ev.target.value = ''
}

function clearShootScoresFlow(){
  if(!confirm('Är du säker? Alla resultat från Arcade: Shoot! raderas permanent.')) return
  localStorage.removeItem(SHOOT_SCORES_KEY)
  shootMemoryScores = null
  renderShootScores()
}

// ============================================================================
// Uppkoppling (egen DOMContentLoaded, oberoende av app.js:s init)
// ============================================================================
// Läget kräver MC-frågor; knappen skuggas för ämnen utan flervalsfrågor.
// Anropas av app.js updateStartButtons() via en skyddad krok.
function updateShootButton(){
  const b = el('startShootBtn')
  if(b) b.disabled = !topicCapabilities().mc
}

// Fältet byter storlek vid rotation och när adressfältet fälls in/ut. Målen
// läggs om proportionellt; hindren byggs helt enkelt om (enklare och lika
// korrekt som att skala en korridor som wrappar runt).
function onShootResize(){
  const sec = el('shoot')
  if(!sec || sec.classList.contains('hidden') || !shootRunning) return
  measureShootField()
  if(shootTargets.length){
    const slot = shootFieldW / 4
    const size = shootTargetSize()
    shootTargets.forEach((t, i) => {
      if(t.dead) return
      t.x = i * slot + slot / 2
      t.y = shootFieldH * SHOOT_TARGET_ROW_FRAC
      t.size = size
      if(t.node){
        t.node.style.width = size + 'px'
        t.node.style.height = size + 'px'
        t.node.style.transform = `translate3d(${t.x - size / 2}px, ${t.y - size / 2}px, 0)`
      }
    })
  }
  if(shootObstacleCount > 0) spawnShootObstacles(shootObstacleCount)
  updateShootAim()
}

document.addEventListener('DOMContentLoaded', () => {
  el('startShootBtn')?.addEventListener('click', startShoot)
  el('shootStartBtn')?.addEventListener('click', onShootStartClick)
  el('shootRetryBtn')?.addEventListener('click', startShoot)
  el('shootQuitBtn')?.addEventListener('click', quitShoot)
  el('exportScores-shoot')?.addEventListener('click', exportShootScores)
  const imp = el('importScoresFile-shoot')
  if(imp) imp.addEventListener('change', handleImportShootScores)
  el('importScoresBtn-shoot')?.addEventListener('click', () => imp?.click())
  el('clearScores-shoot')?.addEventListener('click', clearShootScoresFlow)

  const field = el('shootField')
  if(field){
    field.addEventListener('pointerdown', onShootPointerDown)
    field.addEventListener('pointermove', onShootPointerMove)
    field.addEventListener('pointerup', onShootPointerUp)
    field.addEventListener('pointercancel', onShootPointerCancel)
  }

  window.addEventListener('resize', onShootResize)
  if(window.visualViewport) window.visualViewport.addEventListener('resize', onShootResize)
  window.addEventListener('orientationchange', () => setTimeout(onShootResize, 250))
  updateShootButton()
})
