// ============================================================================
// js/leitner.js — spelläget "Leitner Light" (spaced repetition / Plugga smart).
// ============================================================================
// EGEN FIL PER SPELLÄGE/VERKTYG (regel, CLAUDE_REGLER §12): nya spel, appar och
// verktyg byggs i en egen .js-fil i stället för att växa in i js/app.js. Filen
// laddas som ett vanligt klassiskt <script defer> EFTER js/app.js och delar
// därför globalt scope med den, precis som js/matcha.js och js/images.js. Den
// anropar app.js hjälpare direkt som globaler:
//   el, shuffle, loadFlags, loadPoolForTopic, topicMatchesSelection,
//   topicLabelFor, eduAbbrevFor, formatDuration, warnStorageUnavailable,
//   downloadJsonBlob, topicCapabilities, allQuestions.
// app.js känner i sin tur INTE till Leitner annat än via två skyddade krokar
// (`if(typeof renderLeitnerScores === 'function') …` i showHighscores och
// `if(typeof updateLeitnerButton === 'function') …` i updateStartButtons).
// ============================================================================
// SPELLOGIK — Leitner-systemet (Sebastian Leitner, 1972)
// ============================================================================
// Varje fråga är ett KORT som bor i en av fem lådor. Rätt svar flyttar kortet
// upp en låda, fel skickar det tillbaka till låda 1. Ju högre låda, desto
// glesare återkommer kortet: 1 → 2 → 4 → 8 → 16 dagar (låda 5 = mästrat).
// Lådstatusen ligger i localStorage och överlever mellan pass — det är hela
// poängen med läget: det är ett långsiktigt pluggschema, inte en enskild runda.
//
// Ett pass plockar FÖRFALLNA kort först (lägst låda först, äldst förfallodatum
// först) och fyller på med nya kort ur ämnet upp till valt antal frågor. Fel
// kort återkommer i SAMMA pass (samma "relearn"-princip som i vanliga kortlekssystem) tidigast LEITNER_RELEARN_GAP
// kort senare, så att man aldrig lämnar passet med kortet obesvarat — men bara
// det FÖRSTA svaret på ett kort påverkar lådan, eftersom det är det svaret som
// säger något om minnet.
//
// Bara MC- och TF-frågor används: de rättas automatiskt, vilket ger en ärlig
// lådsignal. Ett självskattat "kunde jag det?" går att luras med, och skulle
// dessutom kräva ett helt eget svars-UI.
// ============================================================================
const LEITNER_STATE_KEY = 'hur_leitner_state'
const LEITNER_SCORES_KEY = 'hur_highscores_leitner'
const LEITNER_EXPORT_TYPE = 'anatomiquiz-leitner'
const LEITNER_BOXES = 5
// Dagar till nästa repetition per låda (index = låda − 1). Klassisk Leitner-trappa.
const LEITNER_INTERVAL_DAYS = [1, 2, 4, 8, 16]
const LEITNER_REVEAL_STEP_MS = 260   // takten i den koreograferade rättningen
const LEITNER_RELEARN_GAP = 3        // minst så här många kort innan ett felsvarat kort återkommer
const LEITNER_MAX_RETRIES = 2        // max två extra försök per kort och pass
const LEITNER_STREAK_PRAISE = 5      // beröm vid var femte rätt i rad
const LEITNER_RING_CIRCUMFERENCE = 326.7 // 2 · π · r(52), matchar .leitner-ring-progress i styles.css
const DAY_MS = 86400000

// Textlängd → typsnittsskala (CSS-variablerna --prompt-scale/--opt-scale). Korta
// texter krymps inte alls, långa krymps mot ett golv; CSS max() sätter dessutom
// ett absolut läslighetsgolv. Håller kortets höjd jämn mellan en kort term och
// en lång kunskapsfråga.
const LEITNER_PROMPT_SCALE = { min: 40, max: 160, floor: 0.80 }
const LEITNER_OPT_SCALE = { min: 18, max: 90, floor: 0.82 }

// --- Passets tillstånd -------------------------------------------------------
let leitnerQueue = []          // [kortpost] i den ordning de ska visas (fel kort läggs in igen)
let leitnerIdx = 0             // position i kön
let leitnerCards = []          // unika kortposter i passet
let leitnerPoolKeys = []       // alla kortnycklar i ämnet (för mästringsmätaren)
let leitnerPoolSize = 0
let leitnerFinished = 0        // avklarade kort (rätt, eller slut på försök)
let leitnerSeen = 0            // kort som fått sitt FÖRSTA svar (= de som är betygsatta)
let leitnerFirstTryCorrect = 0
let leitnerPromoted = 0
let leitnerMasteredNow = 0
let leitnerStreak = 0
let leitnerBestStreak = 0
let leitnerLocked = false
let leitnerAwaitingNext = false
let leitnerStartTime = 0
let leitnerTimerOn = false
let leitnerTimerInterval = null
let leitnerName = 'Spelare'
let leitnerTopic = ''
let leitnerAudioCtx = null

// ============================================================================
// Lagring — lådstatus och topplista i var sitt fack, med minnesfallback
// (privat läge/full kvot får inte krascha spelet).
// ============================================================================
let leitnerMemoryState = null
let leitnerMemoryScores = null

function emptyLeitnerState(){ return { v: 1, cards: {} } }

function getLeitnerState(){
  if(leitnerMemoryState) return leitnerMemoryState
  try{
    const raw = JSON.parse(localStorage.getItem(LEITNER_STATE_KEY) || 'null')
    if(raw && typeof raw === 'object' && raw.cards && typeof raw.cards === 'object') return raw
  }catch(e){ /* trasig JSON → börja om från tomt schema */ }
  return emptyLeitnerState()
}

function saveLeitnerState(state){
  try{ localStorage.setItem(LEITNER_STATE_KEY, JSON.stringify(state)); leitnerMemoryState = null }
  catch(e){ leitnerMemoryState = state; warnStorageUnavailable() }
}

function getLeitnerScores(){
  if(leitnerMemoryScores) return leitnerMemoryScores
  try{ return JSON.parse(localStorage.getItem(LEITNER_SCORES_KEY) || '[]') }
  catch(e){ return leitnerMemoryScores || [] }
}

function saveLeitnerScores(scores){
  try{ localStorage.setItem(LEITNER_SCORES_KEY, JSON.stringify(scores)); leitnerMemoryScores = null }
  catch(e){ leitnerMemoryScores = scores; warnStorageUnavailable() }
}

// Kortets nyckel. `id` ensamt DUGER INTE: det är unikt per fil, inte globalt —
// "q1"…"qN" återkommer i ben/muskler/handen/grepp/skuldran/ledtyper/riktningar
// (547 kollisioner). `topic|id` är unikt över samtliga levande frågor.
function leitnerKey(q){ return `${q.topic}|${q.id}` }

// ============================================================================
// Datum & lådor
// ============================================================================
function startOfDay(ms){ const d = new Date(ms); d.setHours(0, 0, 0, 0); return d.getTime() }
function endOfDay(ms){ const d = new Date(ms); d.setHours(23, 59, 59, 999); return d.getTime() }

// Kortet förfaller vid midnatt inför måldagen, så att det är tillgängligt hela
// den dagen oavsett vilken tid på dygnet man pluggade förra gången.
function leitnerDueFor(box, now){
  const days = LEITNER_INTERVAL_DAYS[Math.min(box, LEITNER_BOXES) - 1]
  return startOfDay(now) + days * DAY_MS
}

function leitnerDayLabel(ms){
  const diff = Math.round((startOfDay(ms) - startOfDay(Date.now())) / DAY_MS)
  if(diff <= 0) return 'i dag'
  if(diff === 1) return 'i morgon'
  return new Date(ms).toLocaleDateString('sv-SE')
}

function leitnerIntervalLabel(box){
  const days = LEITNER_INTERVAL_DAYS[Math.min(box, LEITNER_BOXES) - 1]
  return days === 1 ? 'åter i morgon' : `åter om ${days} dagar`
}

// ============================================================================
// Spelkänsla: rörelse, skala, ljud, haptik
// ============================================================================
function leitnerReducedMotion(){
  return typeof window !== 'undefined' && !!window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function leitnerTextScale(text, cfg){
  const len = (text || '').length
  if(len <= cfg.min) return 1
  const t = Math.min(1, (len - cfg.min) / (cfg.max - cfg.min))
  return 1 - t * (1 - cfg.floor)
}

// Korta, självgenererade toner via Web Audio — aldrig externa ljudfiler (CSP
// tillåter ingen extern källa). AudioContext skapas först vid en spelarinitierad
// tryckning, vilket uppfyller webbläsarnas autoplay-krav. Av/på styrs av den
// BEFINTLIGA "Ljudeffekter"-bocken i Inställningar; läget har ingen egen.
function leitnerSoundEnabled(){
  const cb = el('soundEnabled')
  return cb ? !!cb.checked : true
}

function getLeitnerAudioCtx(){
  if(leitnerAudioCtx) return leitnerAudioCtx
  const Ctx = window.AudioContext || window.webkitAudioContext
  if(!Ctx) return null
  try{ leitnerAudioCtx = new Ctx() }catch(e){ leitnerAudioCtx = null }
  return leitnerAudioCtx
}

function leitnerBeep(ctx, freq, offset, falling){
  const t0 = ctx.currentTime + offset
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(freq, t0)
  if(falling) osc.frequency.exponentialRampToValueAtTime(freq * 0.72, t0 + 0.18)
  gain.gain.setValueAtTime(0.0001, t0)
  gain.gain.exponentialRampToValueAtTime(0.16, t0 + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + (falling ? 0.22 : 0.15))
  osc.connect(gain); gain.connect(ctx.destination)
  osc.start(t0)
  osc.stop(t0 + (falling ? 0.26 : 0.2))
}

// Ljudet berättar VAD som hände, inte bara att något hände: en enkel ton för
// rätt, en stigande ters när kortet flyttas upp, en liten treklang när det når
// låda 5, och en fallande ton vid fel.
function playLeitnerTone(kind){
  if(!leitnerSoundEnabled()) return
  const ctx = getLeitnerAudioCtx()
  if(!ctx) return
  if(ctx.state === 'suspended') ctx.resume()
  const seq = kind === 'master' ? [659.25, 880, 1174.66]
    : kind === 'promote' ? [659.25, 880]
    : kind === 'right' ? [880]
    : [220]
  seq.forEach((f, i) => leitnerBeep(ctx, f, i * 0.09, kind === 'wrong'))
}

function leitnerVibrate(pattern){
  if(typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') navigator.vibrate(pattern)
}

// Kör en kedja av steg i takt med LEITNER_REVEAL_STEP_MS. Vid reducerad rörelse
// körs alla steg direkt — sluttillstånden sätts alltså ändå, bara utan väntan.
function leitnerRunSteps(steps){
  const delay = leitnerReducedMotion() ? 0 : LEITNER_REVEAL_STEP_MS
  let i = 0
  const run = () => {
    if(i >= steps.length) return
    steps[i++]()
    if(delay === 0) run(); else setTimeout(run, delay)
  }
  run()
}

// ============================================================================
// Kortpool och passets urval
// ============================================================================
// Bygger listan av spelbara kort för valt ämne. Bildfrågor utelämnas (bilden ÄR
// frågan, och kräver bildregistret), liksom placeholders och uteslutna frågor.
function buildLeitnerPool(topic, lens){
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
    const key = leitnerKey(q)
    if(seen.has(key)) continue      // samma kort kan nås via flera ämnesvägar
    seen.add(key)
    pool.push(q)
  }
  return pool
}

// Väljer passets kort: förfallna först (lägst låda först = det man kan sämst,
// därefter äldst förfallodatum), sedan nya kort. Är inget förfallet och inget
// nytt kvar erbjuds "öva i förväg" i stället för en återvändsgränd.
function pickLeitnerSession(pool, state, num){
  const now = Date.now()
  const due = [], fresh = [], ahead = []
  pool.forEach(q => {
    const c = state.cards[leitnerKey(q)]
    if(!c) fresh.push(q)
    else if(c.due <= now) due.push({ q, c })
    else ahead.push({ q, c })
  })
  due.sort((a, b) => (a.c.b - b.c.b) || (a.c.due - b.c.due))
  const chosen = due.slice(0, num).map(x => x.q)
  if(chosen.length < num && fresh.length){
    chosen.push(...shuffle(fresh.slice()).slice(0, num - chosen.length))
  }
  if(chosen.length) return { cards: chosen, ahead: false, dueCount: due.length, freshCount: fresh.length }
  // Allt är repeterat och inget har förfallit än.
  ahead.sort((a, b) => a.c.due - b.c.due)
  return { cards: [], ahead: true, aheadCards: ahead.slice(0, num).map(x => x.q), nextDue: ahead.length ? ahead[0].c.due : 0 }
}

// Har spelaren kört Leitner förut? Avgör om förklaringsrutan fälls upp eller
// ligger hopfälld: spaced repetition är obekant för de flesta, men den som
// redan kan läget ska inte behöva stänga samma text varje pass.
function hasPlayedLeitner(state){
  return getLeitnerScores().length > 0 || Object.keys(state.cards).length > 0
}

function makeLeitnerRecord(q, state){
  const key = leitnerKey(q)
  const c = state.cards[key]
  const box = c ? Math.min(LEITNER_BOXES, Math.max(1, c.b)) : 1
  return { key, q, box0: box, box, isNew: !c, tries: 0, done: false, firstTryOk: null }
}

// ============================================================================
// Start
// ============================================================================
async function startLeitner(){
  leitnerName = el('playerName').value.trim() || 'Spelare'
  const num = parseInt(el('numQuestions').value, 10)
  leitnerTimerOn = !!el('timerEnabled')?.checked
  leitnerTopic = el('topic').value

  const lens = await loadPoolForTopic(leitnerTopic)
  const pool = buildLeitnerPool(leitnerTopic, lens)
  if(!pool.length){
    alert('Det finns inga flervals- eller sant/falskt-frågor i det här ämnet. Välj ett annat ämne.')
    return
  }

  const state = getLeitnerState()
  let pick = pickLeitnerSession(pool, state, num)
  if(pick.ahead){
    const when = pick.nextDue ? leitnerDayLabel(pick.nextDue) : 'senare'
    if(!pick.aheadCards.length){ alert('Inga kort att öva på i det här ämnet just nu.'); return }
    if(!confirm(`Snyggt jobbat — inga kort är förfallna än, nästa repetition är ${when}.\n\nVill du öva i förväg ändå? Korten flyttas i lådorna som vanligt.`)) return
    pick = { cards: pick.aheadCards }
  }

  leitnerPoolKeys = pool.map(leitnerKey)
  leitnerPoolSize = pool.length
  leitnerCards = pick.cards.map(q => makeLeitnerRecord(q, state))
  leitnerQueue = leitnerCards.slice()
  leitnerIdx = 0
  leitnerFinished = 0
  leitnerSeen = 0
  leitnerFirstTryCorrect = 0
  leitnerPromoted = 0
  leitnerMasteredNow = 0
  leitnerStreak = 0
  leitnerBestStreak = 0
  leitnerStartTime = Date.now()

  const label = topicLabelFor(leitnerTopic).replace(/\s*\([^)]*\)\s*$/, '')
  const nNew = leitnerCards.filter(r => r.isNew).length
  const nDue = leitnerCards.length - nNew
  // Nollposter skrivs inte ut ("0 att repetera" är brus och gör raden onödigt lång).
  const delar = [label]
  if(nDue) delar.push(`${nDue} att repetera`)
  if(nNew) delar.push(`${nNew} nya`)
  el('leitnerPlayerLabel').textContent = leitnerName
  el('leitnerMeta').textContent = delar.join(' · ')

  el('setup').classList.add('hidden')
  el('highscores').classList.add('hidden')
  el('result').classList.add('hidden')
  el('quiz').classList.add('hidden')
  el('flashcards').classList.add('hidden')
  el('matcha')?.classList.add('hidden')
  el('leitnerFinished').classList.add('hidden')
  const intro = el('leitnerIntro')
  intro.classList.remove('hidden')
  // Alltid hopfälld vid start – reglerna ska finnas till hands, inte i vägen.
  intro.open = false
  el('leitnerPlay').classList.remove('hidden')
  el('leitnerFooter').classList.remove('hidden')
  el('leitner').classList.remove('hidden')
  if(leitnerTimerOn) startLeitnerTimer(); else el('leitnerTimer').textContent = ''

  updateLeitnerProgress()
  updateLeitnerScoreBadge(false)
  updateLeitnerMastery(false)
  showLeitnerCard()
  window.scrollTo({ top: 0 })
}

// ============================================================================
// Kortvyn
// ============================================================================
function currentLeitnerRecord(){ return leitnerQueue[leitnerIdx] || null }

function leitnerChoicesFor(q){
  // Sant/falskt har alltid samma naturliga ordning; flervalsalternativ slumpas.
  if(q.type === 'tf') return ['Sant', 'Falskt']
  return shuffle([q.correct, ...q.distractors])
}

function showLeitnerCard(){
  const rec = currentLeitnerRecord()
  if(!rec){ finishLeitner(); return }
  leitnerLocked = false
  leitnerAwaitingNext = false

  const promptEl = el('leitnerPrompt')
  promptEl.textContent = rec.q.prompt
  promptEl.style.setProperty('--prompt-scale', leitnerTextScale(rec.q.prompt, LEITNER_PROMPT_SCALE).toFixed(3))

  const box = el('leitnerChoices')
  box.innerHTML = ''
  leitnerChoicesFor(rec.q).forEach((text, i) => {
    const b = document.createElement('button')
    b.type = 'button'
    b.className = 'leitner-choice'
    b.textContent = text
    b.style.setProperty('--opt-scale', leitnerTextScale(text, LEITNER_OPT_SCALE).toFixed(3))
    b.dataset.choice = text
    b.dataset.idx = String(i + 1)
    b.addEventListener('click', () => onLeitnerAnswer(b, text))
    box.appendChild(b)
  })

  el('leitnerCardMeta').textContent = rec.isNew
    ? 'Nytt kort'
    : (rec.tries > 0 ? 'Andra chansen — svara rätt för att lägga undan kortet' : `Låda ${rec.box0} · repetition`)
  setLeitnerLadder(rec.box, false)
  el('leitnerLadderLabel').textContent = rec.isNew && rec.tries === 0
    ? 'Nytt kort — börjar i låda 1'
    : `Låda ${rec.box} · ${leitnerIntervalLabel(rec.box)}`
  hideLeitnerPraise()
  const btn = el('leitnerNextBtn')
  btn.textContent = 'Nästa'
  btn.disabled = true
  // Krymp vyn tills kort + alternativ + Nästa ryms på skärmen (app.js).
  if(typeof fitActiveView === 'function') fitActiveView()
}

// Lådtrappan: brickan glider till sin låda. `animate=false` snäpper dit den utan
// rörelse (vid nytt kort), `true` används i rättningens payoff-steg.
function setLeitnerLadder(box, animate){
  const chip = el('leitnerChip')
  const ladder = el('leitnerLadder')
  if(!chip || !ladder) return
  const b = Math.min(LEITNER_BOXES, Math.max(1, box))
  chip.classList.toggle('no-anim', !animate || leitnerReducedMotion())
  chip.style.setProperty('--lb-pos', String(b - 1))
  Array.from(ladder.querySelectorAll('.leitner-box')).forEach((cell, i) => {
    cell.classList.toggle('active', i === box - 1)
    cell.classList.toggle('filled', i < box - 1)
  })
}

function showLeitnerPraise(text){
  const p = el('leitnerPraise')
  if(!p) return
  p.textContent = text
  p.classList.remove('hidden')
  p.classList.remove('in')
  void p.offsetWidth      // tvinga reflow så animationen kan köras om
  p.classList.add('in')
}

function hideLeitnerPraise(){
  const p = el('leitnerPraise')
  if(p){ p.classList.add('hidden'); p.classList.remove('in') }
}

// ============================================================================
// Svar → koreograferad rättning (§13.1 punkt 2)
// ============================================================================
// Rättningen rullar i tre steg i stället för ett hårt tillståndsbyte:
//   1. facit tänds på alternativen (grönt rätt, rött det man valde fel)
//   2. kortet flyttas i lådtrappan, med ton och haptik som berättar vad som hände
//   3. mätarna uppdateras och "Nästa" öppnas
function onLeitnerAnswer(btn, choice){
  if(leitnerLocked) return
  const rec = currentLeitnerRecord()
  if(!rec) return
  leitnerLocked = true

  const ok = choice === rec.q.correct
  btn.classList.add('chosen')
  leitnerVibrate(10)   // kvitto på själva trycket, före facit

  const firstAnswer = rec.tries === 0
  rec.tries++
  if(firstAnswer){ rec.firstTryOk = ok; leitnerSeen++ }

  // Lådan påverkas BARA av kortets första svar i passet — det är det svaret som
  // säger något om minnet. Ett rätt svar på andra chansen räddar alltså inte
  // kortet ur låda 1; det är själva poängen med Leitner.
  const state = getLeitnerState()
  let moved = 'none'
  if(firstAnswer){
    const before = rec.box
    rec.box = ok ? Math.min(LEITNER_BOXES, before + 1) : 1
    moved = ok ? (rec.box > before ? 'up' : 'top') : (before > 1 ? 'down' : 'stay')
    state.cards[rec.key] = {
      b: rec.box,
      due: leitnerDueFor(rec.box, Date.now()),
      n: ((state.cards[rec.key] && state.cards[rec.key].n) || 0) + 1,
      t: rec.q.topic
    }
    saveLeitnerState(state)
    if(ok){
      leitnerFirstTryCorrect++
      leitnerStreak++
      leitnerBestStreak = Math.max(leitnerBestStreak, leitnerStreak)
      if(rec.box > rec.box0) leitnerPromoted++
      if(rec.box === LEITNER_BOXES && rec.box0 < LEITNER_BOXES) leitnerMasteredNow++
    } else {
      leitnerStreak = 0
    }
  }

  // Klar med kortet? Rätt svar lägger undan det; annars ges det upp till
  // LEITNER_MAX_RETRIES extra försök senare i passet.
  const outOfTries = rec.tries > LEITNER_MAX_RETRIES
  const finishedNow = ok || outOfTries
  if(finishedNow && !rec.done){ rec.done = true; leitnerFinished++ }
  if(!finishedNow) requeueLeitnerCard(rec)

  const mastered = firstAnswer && ok && rec.box === LEITNER_BOXES && rec.box0 < LEITNER_BOXES
  const remaining = leitnerQueue.length - leitnerIdx - 1

  leitnerRunSteps([
    () => {
      Array.from(el('leitnerChoices').children).forEach(b => {
        b.disabled = true
        // markAnswerBtn (app.js) lägger till ✓/✗ OCH dold skärmläsartext, så att
        // utfallet inte förmedlas med enbart färg (WCAG 1.4.1).
        if(b.dataset.choice === rec.q.correct) markAnswerBtn(b, true)
        else if(b === btn){ markAnswerBtn(b, false); b.classList.add('shake') }
      })
      playLeitnerTone(ok ? 'right' : 'wrong')
      leitnerVibrate(ok ? 12 : [10, 35, 10])
    },
    () => {
      setLeitnerLadder(rec.box, true)
      if(firstAnswer && ok) playLeitnerTone(mastered ? 'master' : 'promote')
      el('leitnerLadderLabel').textContent = leitnerLadderText(rec, ok, firstAnswer, moved)
      if(mastered) leitnerVibrate([12, 40, 12, 40, 18])
    },
    () => {
      updateLeitnerProgress()
      updateLeitnerScoreBadge(ok && firstAnswer)
      updateLeitnerMastery(mastered)
      const praise = leitnerPraiseText(mastered, ok, firstAnswer)
      if(praise) showLeitnerPraise(praise)
      leitnerAwaitingNext = true
      const btnNext = el('leitnerNextBtn')
      btnNext.textContent = remaining > 0 ? 'Nästa' : 'Avsluta passet'
      btnNext.disabled = false
      btnNext.focus?.()
    }
  ])
}

function leitnerLadderText(rec, ok, firstAnswer, moved){
  if(!firstAnswer){
    return ok
      ? `Rätt till slut — kortet ligger kvar i låda 1, ${leitnerIntervalLabel(1)}`
      : `Kortet ligger kvar i låda 1 · ${leitnerIntervalLabel(1)}`
  }
  if(ok){
    if(moved === 'top') return `Kvar i låda ${LEITNER_BOXES} — mästrat · ${leitnerIntervalLabel(rec.box)}`
    return `Låda ${rec.box0} → ${rec.box} · ${leitnerIntervalLabel(rec.box)}`
  }
  if(moved === 'down') return `Låda ${rec.box0} → 1 · ${leitnerIntervalLabel(1)}`
  return `Kvar i låda 1 · ${leitnerIntervalLabel(1)}`
}

function leitnerPraiseText(mastered, ok, firstAnswer){
  if(mastered) return '🎓 Mästrat! Kortet har nått låda 5.'
  if(ok && firstAnswer && leitnerStreak > 0 && leitnerStreak % LEITNER_STREAK_PRAISE === 0){
    return `🔥 ${leitnerStreak} rätt i rad!`
  }
  return ''
}

// Fel kort läggs in igen längre fram i kön (samma "relearn"-princip som i vanliga kortlekssystem), så att passet
// aldrig lämnar ett kort obesvarat. Samma post återanvänds — därför räknas den
// bara en gång i framstegsmätaren.
function requeueLeitnerCard(rec){
  const at = Math.min(leitnerQueue.length, leitnerIdx + 1 + LEITNER_RELEARN_GAP)
  leitnerQueue.splice(at, 0, rec)
}

function onLeitnerNext(){
  if(!leitnerAwaitingNext) return
  leitnerIdx++
  if(leitnerIdx >= leitnerQueue.length){ finishLeitner(); return }
  showLeitnerCard()
}

// ============================================================================
// Mätare (§13.1 punkt 3)
// ============================================================================
// Framstegsmätaren går över HELA passet — avklarade kort av passets kort, inte
// position i kön (kön växer när fel kort läggs in igen, så den vore missvisande).
function updateLeitnerProgress(){
  const total = leitnerCards.length
  const pct = total ? Math.min(100, Math.round((leitnerFinished / total) * 100)) : 0
  const fill = el('leitnerProgressFill')
  if(fill) fill.style.width = pct + '%'
  // Etiketten speglar mätaren: avklarade kort, inte position i kön. Ett felsvarat
  // kort ligger kvar och räknas först när det är avklarat, så "kort 3 av 10" hade
  // varit fel så fort ett kort lagts in i kön igen.
  const label = el('leitnerProgressLabel')
  if(label) label.textContent = `${leitnerFinished}/${total} klara`
}

function updateLeitnerScoreBadge(bump){
  const badge = el('leitnerScoreBadge')
  if(!badge) return
  // Nämnaren är kort som fått sitt FÖRSTA svar – det är de som är betygsatta.
  // (Mätaren räknar avklarade kort; ett felsvarat kort är betygsatt men inte klart.)
  badge.textContent = leitnerSeen > 0 ? `Rätt: ${leitnerFirstTryCorrect}/${leitnerSeen}` : 'Rätt: 0'
  if(bump){
    badge.classList.remove('bump')
    void badge.offsetWidth
    badge.classList.add('bump')
  }
}

// Långsiktig mästringsmätare för ämnet: hur många av ämnets kort som nått låda 5.
// Det är den mätaren som gör spaced repetition meningsfullt över tid — dagens
// pass är litet, kunskapsbygget är stort.
function countLeitnerMastered(){
  const state = getLeitnerState()
  let n = 0
  leitnerPoolKeys.forEach(k => { const c = state.cards[k]; if(c && c.b >= LEITNER_BOXES) n++ })
  return n
}

function updateLeitnerMastery(celebrate){
  const mastered = countLeitnerMastered()
  const pct = leitnerPoolSize ? Math.min(100, (mastered / leitnerPoolSize) * 100) : 0
  const fill = el('leitnerMasteryFill')
  if(fill) fill.style.width = pct.toFixed(1) + '%'
  const label = el('leitnerMasteryLabel')
  if(label) label.textContent = `${mastered}/${leitnerPoolSize}`
  const wrap = el('leitnerMastery')
  if(wrap && celebrate){
    wrap.classList.remove('celebrate')
    void wrap.offsetWidth
    wrap.classList.add('celebrate')
  }
}

// ============================================================================
// Slutet (§13.1 punkt 5)
// ============================================================================
// Bäst hittills, räknat INNAN dagens resultat sparas: högst andel rätt, flest
// mästrade som utslag — samma rangordning som topplistesegmentet.
function leitnerPriorBest(scores){
  return scores.reduce((best, s) => {
    if(!s.cards) return best
    const p = s.correct / s.cards
    const m = s.mastered || 0
    if(!best || p > best.pct || (p === best.pct && m > best.mastered)) return { pct: p, mastered: m }
    return best
  }, null)
}

// "N kort återkommer <dag>" — det som är unikt för ett schemalagt pluggläge:
// slutet pekar framåt mot nästa gång, inte bara bakåt på resultatet.
function leitnerNextSessionInfo(){
  const state = getLeitnerState()
  const now = Date.now()
  let next = null
  leitnerPoolKeys.forEach(k => {
    const c = state.cards[k]
    if(c && c.due > now && (next === null || c.due < next)) next = c.due
  })
  if(next === null) return null
  const limit = endOfDay(next)
  let count = 0
  leitnerPoolKeys.forEach(k => {
    const c = state.cards[k]
    if(c && c.due > now && c.due <= limit) count++
  })
  return { when: next, count }
}

function animateLeitnerRing(pct){
  const label = el('leitnerRingPct')
  if(label) label.textContent = pct + ' %'
  const ring = el('leitnerRingProgress')
  if(!ring) return
  const clamped = Math.max(0, Math.min(100, pct))
  const offset = LEITNER_RING_CIRCUMFERENCE * (1 - clamped / 100)
  ring.style.strokeDashoffset = String(LEITNER_RING_CIRCUMFERENCE)
  requestAnimationFrame(() => { ring.style.strokeDashoffset = String(offset) })
}

function finishLeitner(){
  clearLeitnerTimer()
  const durationMs = leitnerStartTime ? Date.now() - leitnerStartTime : 0
  el('leitnerPlay').classList.add('hidden')
  el('leitnerFooter').classList.add('hidden')
  el('leitnerIntro').classList.add('hidden')   // spelreglerna är inte intressanta på resultatskärmen
  el('leitnerFinished').classList.remove('hidden')

  const total = leitnerCards.length
  const pct = total ? Math.round((leitnerFirstTryCorrect / total) * 100) : 0
  const priorBest = leitnerPriorBest(getLeitnerScores())
  const curFrac = total ? leitnerFirstTryCorrect / total : 0
  const isRecord = !!priorBest && (curFrac > priorBest.pct || (curFrac === priorBest.pct && leitnerMasteredNow > priorBest.mastered))

  el('leitnerDoneText').textContent =
    `Passet klart! ${leitnerFirstTryCorrect} av ${total} rätt på första försöket, på ${formatDuration(durationMs)}.`
  // Bara nyckeltal som faktiskt hände – "🎓 0 mästrade" är ingen prestation att visa.
  const nyckeltal = [`↑ ${leitnerPromoted} kort flyttades upp`]
  if(leitnerMasteredNow) nyckeltal.push(`🎓 ${leitnerMasteredNow} mästrade i dag`)
  if(leitnerBestStreak > 1) nyckeltal.push(`🔥 bästa svit ${leitnerBestStreak}`)
  el('leitnerStatsText').textContent = nyckeltal.join(' · ')

  const next = leitnerNextSessionInfo()
  el('leitnerNextText').textContent = next
    ? `Nästa pass: ${next.count} ${next.count === 1 ? 'kort återkommer' : 'kort återkommer'} ${leitnerDayLabel(next.when)}.`
    : 'Alla kort i ämnet är repeterade — kom tillbaka när de förfaller.'

  const badge = el('leitnerRecordBadge')
  if(badge) badge.classList.toggle('hidden', !isRecord)
  animateLeitnerRing(pct)

  try{ saveLeitnerScore(durationMs) }catch(e){ console.error('saveLeitnerScore misslyckades:', e) }
  window.scrollTo({ top: 0 })
}

function saveLeitnerScore(durationMs){
  const scores = getLeitnerScores()
  scores.push({
    name: leitnerName,
    topic: leitnerTopic,
    topicLabel: topicLabelFor(leitnerTopic),
    cards: leitnerCards.length,
    correct: leitnerFirstTryCorrect,
    promoted: leitnerPromoted,
    mastered: leitnerMasteredNow,
    streak: leitnerBestStreak,
    durationMs,
    date: new Date().toISOString()
  })
  scores.sort((a, b) => new Date(b.date) - new Date(a.date))
  saveLeitnerScores(scores.slice(0, 50))
}

// ============================================================================
// Tid, avbryt
// ============================================================================
function startLeitnerTimer(){
  el('leitnerTimer').textContent = 'Tid: 0 s'
  leitnerTimerInterval = setInterval(() => {
    const s = Math.floor((Date.now() - leitnerStartTime) / 1000)
    el('leitnerTimer').textContent = `Tid: ${s} s`
  }, 500)
}

function clearLeitnerTimer(){
  if(leitnerTimerInterval){ clearInterval(leitnerTimerInterval); leitnerTimerInterval = null }
}

// Lådstatusen sparas löpande per svar, så ett avbrutet pass tappar bara
// passresultatet — inte plugghistoriken. Det står i frågan, så att man vet det.
function cancelLeitner(){
  if(confirm('Avbryta passet? Lådorna behåller det du redan svarat på, men passet hamnar inte i topplistan.')){
    clearLeitnerTimer()
    el('leitner').classList.add('hidden')
    el('setup').classList.remove('hidden')
  }
}

function quitLeitner(){
  el('leitner').classList.add('hidden')
  el('setup').classList.remove('hidden')
}

// ============================================================================
// Topplistesegmentet (i #highscores)
// ============================================================================
function renderLeitnerScores(){
  const ol = el('scoreList-leitner')
  if(!ol) return
  const emptyP = ol.parentElement.querySelector('.hs-empty')
  const scores = getLeitnerScores()
  const pctOf = s => (s.cards > 0 ? s.correct / s.cards : 0)
  const list = [...scores].sort((a, b) => {
    if(pctOf(b) !== pctOf(a)) return pctOf(b) - pctOf(a)
    if((b.mastered || 0) !== (a.mastered || 0)) return (b.mastered || 0) - (a.mastered || 0)
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
    const pct = s.cards ? Math.round((s.correct / s.cards) * 100) : 0
    li.append(
      mk('sr-rank', (i + 1) + '.'),
      mk('sr-name', s.name),
      mk('sr-topic', abbrev ? `(${abbrev}) ${label}` : label),
      mk('sr-score', `${s.correct}/${s.cards}`),
      mk(pct < 75 ? 'sr-pct sr-lead weak' : 'sr-pct sr-lead', `${pct} %`),
      mk('sr-time', `🎓 ${s.mastered || 0}`),
      mk('sr-date', new Date(s.date).toLocaleDateString('sv-SE'))
    )
    ol.appendChild(li)
  })
}

// Exporten tar med BÅDE passresultaten och lådstatusen. En säkerhetskopia som
// räddar topplistan men tappar månaders plugghistorik vore missvisande.
function exportLeitnerScores(){
  const scores = getLeitnerScores()
  const state = getLeitnerState()
  if(!scores.length && !Object.keys(state.cards).length){
    alert('Det finns inga Leitner-resultat att exportera än.')
    return
  }
  const payload = { type: LEITNER_EXPORT_TYPE, version: 1, exported: new Date().toISOString(), scores, state }
  downloadJsonBlob(payload, `anatomiquiz-leitner-${new Date().toISOString().slice(0, 10)}`)
}

function leitnerScoreSignature(s){ return [s.date, s.name, s.topic, s.cards, s.correct].join('|') }

// Vid krock mellan två lådstatusar vinner den som kommit längst (högst låda);
// vid samma låda den som repeterats senast (senast satta förfallodatum).
function mergeLeitnerCard(mine, theirs){
  if(!mine) return theirs
  if(!theirs) return mine
  if((theirs.b || 1) > (mine.b || 1)) return theirs
  if((theirs.b || 1) < (mine.b || 1)) return mine
  return (theirs.due || 0) > (mine.due || 0) ? theirs : mine
}

function handleImportLeitnerScores(ev){
  const f = ev.target.files && ev.target.files[0]
  if(!f) return
  const reader = new FileReader()
  reader.onload = () => {
    try{
      const parsed = JSON.parse(reader.result)
      const incoming = Array.isArray(parsed) ? parsed
        : (parsed && parsed.type === LEITNER_EXPORT_TYPE && Array.isArray(parsed.scores)) ? parsed.scores
        : null
      if(!incoming){ alert('Fel format: filen ser inte ut som en exporterad Leitner-fil.'); return }
      const merged = getLeitnerScores()
      const seen = new Set(merged.map(leitnerScoreSignature))
      let added = 0, skipped = 0
      incoming.forEach(s => {
        if(!s || typeof s.date !== 'string' || typeof s.cards !== 'number'){ skipped++; return }
        const sig = leitnerScoreSignature(s)
        if(seen.has(sig)){ skipped++; return }
        seen.add(sig); merged.push(s); added++
      })
      merged.sort((a, b) => new Date(b.date) - new Date(a.date))
      saveLeitnerScores(merged.slice(0, 50))

      let cardsMerged = 0
      const inState = parsed && parsed.state && parsed.state.cards
      if(inState && typeof inState === 'object'){
        const state = getLeitnerState()
        Object.keys(inState).forEach(k => {
          const c = inState[k]
          if(!c || typeof c.b !== 'number' || typeof c.due !== 'number') return
          state.cards[k] = mergeLeitnerCard(state.cards[k], c)
          cardsMerged++
        })
        saveLeitnerState(state)
      }
      renderLeitnerScores()
      alert(`Import klar. Tillagda resultat: ${added}. Hoppade över: ${skipped}. Kort i lådorna: ${cardsMerged}.`)
    }catch(e){ alert('Kunde inte läsa JSON: ' + e.message) }
  }
  reader.readAsText(f, 'utf-8')
  ev.target.value = ''
}

// Två separata frågor: topplistan och plugghistoriken är olika saker, och den
// som vill rensa listan ska inte råka slänga månaders lådstatus på köpet.
function clearLeitnerScoresFlow(){
  if(!confirm('Är du säker? Alla Leitner-resultat i topplistan raderas permanent.')) return
  localStorage.removeItem(LEITNER_SCORES_KEY)
  leitnerMemoryScores = null
  renderLeitnerScores()
  if(confirm('Vill du även nollställa lådorna? Då försvinner din plugghistorik och alla kort börjar om i låda 1.')){
    localStorage.removeItem(LEITNER_STATE_KEY)
    leitnerMemoryState = null
  }
}

// ============================================================================
// Uppkoppling (egen DOMContentLoaded, oberoende av app.js:s init)
// ============================================================================
// Leitner rättar automatiskt och behöver därför MC- eller TF-frågor; knappen
// skuggas för rena flashcard-ämnen. Anropas av app.js updateStartButtons() via
// en skyddad krok, så knappen hålls i synk när ämneslistan byggs om.
function updateLeitnerButton(){
  const cap = topicCapabilities()
  const b = el('startLeitnerBtn')
  if(b) b.disabled = !(cap.mc || cap.tf)
}

// Tangentbord på dator: 1–4 svarar, Enter/mellanslag går vidare. Rör bara
// Leitner-vyn, och bara när inget textfält har fokus.
function onLeitnerKey(ev){
  const sec = el('leitner')
  if(!sec || sec.classList.contains('hidden')) return
  const tag = (document.activeElement && document.activeElement.tagName) || ''
  if(tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
  if(leitnerAwaitingNext && (ev.key === 'Enter' || ev.key === ' ')){
    ev.preventDefault(); onLeitnerNext(); return
  }
  if(leitnerLocked) return
  const n = parseInt(ev.key, 10)
  if(!n || n < 1 || n > 9) return
  const btn = el('leitnerChoices')?.children[n - 1]
  if(btn){ ev.preventDefault(); btn.click() }
}

document.addEventListener('DOMContentLoaded', () => {
  el('startLeitnerBtn')?.addEventListener('click', startLeitner)
  el('leitnerNextBtn')?.addEventListener('click', onLeitnerNext)
  el('leitnerCancelBtn')?.addEventListener('click', cancelLeitner)
  el('leitnerRetryBtn')?.addEventListener('click', startLeitner)
  el('leitnerQuitBtn')?.addEventListener('click', quitLeitner)
  el('exportScores-leitner')?.addEventListener('click', exportLeitnerScores)
  const imp = el('importScoresFile-leitner')
  if(imp) imp.addEventListener('change', handleImportLeitnerScores)
  el('importScoresBtn-leitner')?.addEventListener('click', () => imp?.click())
  el('clearScores-leitner')?.addEventListener('click', clearLeitnerScoresFlow)
  document.addEventListener('keydown', onLeitnerKey)
  updateLeitnerButton()
})

