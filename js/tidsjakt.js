// ============================================================================
// js/tidsjakt.js — spelläget "Tidsjakt" (kapplöpning mot tiden).
// Namnet är medvetet ett fritt svenskt ord som ingen firma äger – inga
// varumärken i filnamn, funktioner, id:n, klasser eller synlig text
// (användarens stående regel, CLAUDE_REGLER §12.1). Slug: "tidsjakt".
// ============================================================================
// EGEN FIL PER SPELLÄGE/VERKTYG (regel, CLAUDE_REGLER §12): nya spel, appar och
// verktyg byggs i en egen .js-fil i stället för att växa in i js/app.js. Filen
// laddas som ett vanligt klassiskt <script defer> EFTER js/app.js och delar
// därför globalt scope med den, precis som js/matcha.js och js/leitner.js. Den
// anropar app.js hjälpare direkt som globaler:
//   el, shuffle, loadFlags, loadPoolForTopic, topicMatchesSelection,
//   topicLabelFor, eduAbbrevFor, warnStorageUnavailable, downloadJsonBlob,
//   topicCapabilities, allQuestions.
// app.js känner i sin tur INTE till läget annat än via två skyddade krokar
// (`if(typeof renderTidsjaktScores === 'function') …` i showHighscores och
// `if(typeof updateTidsjaktButton === 'function') …` i updateStartButtons).
// Läget hämtar sitt ämne ur den vanliga startvyn (#education/#topic) via
// loadPoolForTopic/topicMatchesSelection — ämnesurvalet finns i EN upplaga i
// app.js och kopieras aldrig hit (§13.1).
// ============================================================================
// SPELLOGIK — kapplöpning mot klockan
// ============================================================================
// 60 sekunder på klockan, så många rätt som möjligt ur valt ämne. Rätt svar ger
// poäng och nästa fråga glider in direkt — ingen Nästa-knapp, ingen väntan; det
// är friktionen mellan frågorna som annars dödar tempot.
//
// Två saker gör klockan till ett spel i stället för en stoppur:
//   * Fel svar kostar TIDSJAKT_PENALTY_MS. Utan tidsstraff är det matematiskt
//     optimalt att hamra på alternativen (25 % på fyra), och då mäter läget
//     ingen kunskap alls.
//   * Var femte rätt i rad ger TIDSJAKT_BONUS_MS tillbaka. Kunskap köper tid,
//     som köper fler frågor — belöningsloopen som får en att vilja fortsätta.
//
// Alla startar därför på samma 60 sekunder, men hur länge rundan faktiskt varar
// avgörs av spelet. Poängen (antal rätt) är valutan i topplistan; träffsäkerhet
// och sviter är utslag.
//
// Bara MC- och TF-frågor används: de rättas automatiskt, vilket är enda sättet
// att hålla tempot. Bildfrågor utelämnas — bilden ÄR frågan och kräver
// bildregistret.
//
// Slutet redovisar de frågor man missade, med rätt svar. En kapplöpning utan
// facit efteråt är ett reflexspel; med facit är det ett pluggläge.
// ============================================================================
const TIDSJAKT_SCORES_KEY = 'hur_highscores_tidsjakt'
const TIDSJAKT_EXPORT_TYPE = 'anatomiquiz-tidsjakt'
const TIDSJAKT_DURATION_MS = 60000    // fast rundlängd — en topplista med blandade tider vore meningslös
const TIDSJAKT_PENALTY_MS = 3000      // fel svar
const TIDSJAKT_BONUS_MS = 3000        // svitbonus
const TIDSJAKT_STREAK_STEP = 5        // svitbonus var femte rätt i rad
const TIDSJAKT_REVEAL_MS = 180        // rätt svar: bara ett kvitto, håll tempot
// Fel svar får en längre paus — 180 ms räcker inte för att LÄSA vilket alternativ
// som var det rätta, och då är rättningen bortkastad. Pausen ligger på klockan
// som all annan tid, vilket är konsekvent: ett fel kostar.
const TIDSJAKT_REVEAL_WRONG_MS = 700
const TIDSJAKT_TICK_MS = 100          // klockans uppdateringstakt
const TIDSJAKT_COUNTDOWN_FROM = 3     // "3 – 2 – 1 – Kör!" innan klockan startar
const TIDSJAKT_COUNTDOWN_STEP_MS = 1000
const TIDSJAKT_WARN_MS = 15000        // stapeln blir amber
const TIDSJAKT_DANGER_MS = 5000       // stapeln blir röd och pulserar
const TIDSJAKT_TICKING_MS = 3000      // tickljud de sista sekunderna
const TIDSJAKT_PRAISE_MS = 1400       // beröm tas bort igen — nästa fråga kommer snabbt
const TIDSJAKT_MILESTONE = 10         // kvittens vid var tionde rätt
const TIDSJAKT_MISSED_SHOWN = 8       // så många missade frågor listas i slutet
const TIDSJAKT_RING_CIRCUMFERENCE = 326.7 // 2 · π · r(52), matchar .tidsjakt-ring-progress i styles.css

// Frågor som är för långa att läsa på ett par sekunder förstör tempot. Filtret
// är mjukt: räcker inte de korta frågorna till (TIDSJAKT_MIN_POOL) spelas ämnet
// med hela sin pool i stället — ett långsamt ämne är bättre än ett spärrat.
const TIDSJAKT_MAX_PROMPT = 140
const TIDSJAKT_MAX_OPTION = 60
const TIDSJAKT_MIN_POOL = 12

// Textlängd → typsnittsskala (CSS-variablerna --prompt-scale/--opt-scale), så
// att kortet håller samma höjd oavsett om frågan är en term eller en mening.
// I ett snabbhetsspel är det inte kosmetik: hoppar knapparna mellan frågorna
// blir det feltryck, och feltryck kostar tid spelaren inte förtjänat att bli av med.
const TIDSJAKT_PROMPT_SCALE = { min: 40, max: 140, floor: 0.82 }
const TIDSJAKT_OPT_SCALE = { min: 14, max: 60, floor: 0.78 }

// --- Rundans tillstånd -------------------------------------------------------
let tidsjaktDeck = []           // slumpad frågelek
let tidsjaktDeckIdx = 0
let tidsjaktPool = []           // hela ämnets spelbara frågor (leken byggs om ur den)
let tidsjaktCurrent = null      // frågan som visas
let tidsjaktAnswered = 0
let tidsjaktCorrect = 0
let tidsjaktStreak = 0
let tidsjaktBestStreak = 0
let tidsjaktEarnedMs = 0        // intjänad tid (svitbonusar)
let tidsjaktLostMs = 0          // förlorad tid (felsvar)
let tidsjaktMissed = []         // { prompt, correct, chosen }
let tidsjaktDeadline = 0
let tidsjaktStartTime = 0
let tidsjaktEndTime = 0
let tidsjaktClockInterval = null
let tidsjaktCountdownTimer = null   // nedräkningen före start
let tidsjaktLocked = false      // facit visas — inga nya tryck
let tidsjaktPendingEnd = false  // tiden tog slut mitt i ett facit; avsluta när det visats
let tidsjaktRunning = false
let tidsjaktPriorBest = 0       // personbästa i ämnet, läst FÖRE rundan
let tidsjaktRecordBeaten = false
let tidsjaktLastTickSec = -1
let tidsjaktPraiseTimer = null
let tidsjaktAdvanceTimer = null
let tidsjaktFlyTimer = null
let tidsjaktName = 'Spelare'
let tidsjaktTopic = ''
let tidsjaktAudioCtx = null

// ============================================================================
// Lagring — eget fack med minnesfallback (privat läge/full kvot får inte
// krascha spelet, bara tappa historiken).
// ============================================================================
let tidsjaktMemoryScores = null

function getTidsjaktScores(){
  if(tidsjaktMemoryScores) return tidsjaktMemoryScores
  try{
    const raw = JSON.parse(localStorage.getItem(TIDSJAKT_SCORES_KEY) || '[]')
    return Array.isArray(raw) ? raw : []
  }catch(e){ return tidsjaktMemoryScores || [] }
}

function saveTidsjaktScores(scores){
  try{ localStorage.setItem(TIDSJAKT_SCORES_KEY, JSON.stringify(scores)); tidsjaktMemoryScores = null }
  catch(e){ tidsjaktMemoryScores = scores; warnStorageUnavailable() }
}

// Personbästa i DET HÄR ämnet. Att jaga sitt rekord i "Hjärtat" mot ett rekord
// satt i ett helt annat ämne vore ingen jämförelse.
function tidsjaktBestFor(topic){
  return getTidsjaktScores().reduce((best, s) => {
    if(s.topic !== topic) return best
    return Math.max(best, s.correct || 0)
  }, 0)
}

// ============================================================================
// Spelkänsla: rörelse, skala, ljud, haptik
// ============================================================================
function tidsjaktReducedMotion(){
  return typeof window !== 'undefined' && !!window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function tidsjaktTextScale(text, cfg){
  const len = (text || '').length
  if(len <= cfg.min) return 1
  const t = Math.min(1, (len - cfg.min) / (cfg.max - cfg.min))
  return 1 - t * (1 - cfg.floor)
}

// Korta, självgenererade toner via Web Audio — aldrig externa ljudfiler (CSP
// tillåter ingen extern källa). AudioContext skapas först vid en spelarinitierad
// tryckning, vilket uppfyller webbläsarnas autoplay-krav. Av/på styrs av den
// BEFINTLIGA "Ljudeffekter"-bocken i Inställningar; läget har ingen egen.
function tidsjaktSoundEnabled(){
  const cb = el('soundEnabled')
  return cb ? !!cb.checked : true
}

function getTidsjaktAudioCtx(){
  if(tidsjaktAudioCtx) return tidsjaktAudioCtx
  const Ctx = window.AudioContext || window.webkitAudioContext
  if(!Ctx) return null
  try{ tidsjaktAudioCtx = new Ctx() }catch(e){ tidsjaktAudioCtx = null }
  return tidsjaktAudioCtx
}

function tidsjaktBeep(ctx, freq, offset, dur, peak, falling){
  const t0 = ctx.currentTime + offset
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(freq, t0)
  if(falling) osc.frequency.exponentialRampToValueAtTime(freq * 0.72, t0 + dur * 0.8)
  gain.gain.setValueAtTime(0.0001, t0)
  gain.gain.exponentialRampToValueAtTime(peak, t0 + 0.008)
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  osc.connect(gain); gain.connect(ctx.destination)
  osc.start(t0)
  osc.stop(t0 + dur + 0.04)
}

// Tonhöjden vid rätt svar STIGER med sviten (ett halvsteg per rätt, taket en
// oktav). Det är arkadspelens kombokänsla: ljudet berättar att man är
// inne i en serie, inte bara att svaret var rätt.
function tidsjaktStreakFreq(streak){
  const steps = Math.min(Math.max(streak - 1, 0), 12)
  return 523.25 * Math.pow(2, steps / 12)
}

function playTidsjaktTone(kind, streak){
  if(!tidsjaktSoundEnabled()) return
  const ctx = getTidsjaktAudioCtx()
  if(!ctx) return
  if(ctx.state === 'suspended') ctx.resume()
  if(kind === 'right'){ tidsjaktBeep(ctx, tidsjaktStreakFreq(streak), 0, 0.13, 0.16, false); return }
  if(kind === 'wrong'){ tidsjaktBeep(ctx, 220, 0, 0.22, 0.16, true); return }
  if(kind === 'bonus'){ [880, 1174.66, 1567.98].forEach((f, i) => tidsjaktBeep(ctx, f, i * 0.07, 0.14, 0.15, false)); return }
  if(kind === 'record'){ [659.25, 880, 1174.66, 1318.51].forEach((f, i) => tidsjaktBeep(ctx, f, i * 0.08, 0.16, 0.16, false)); return }
  if(kind === 'tick'){ tidsjaktBeep(ctx, 1320, 0, 0.05, 0.07, false); return }
  if(kind === 'end'){ [523.25, 659.25, 783.99].forEach((f, i) => tidsjaktBeep(ctx, f, i * 0.13, 0.3, 0.16, false)) }
}

function tidsjaktVibrate(pattern){
  // Av/på styrs av den BEFINTLIGA "Vibration"-bocken i Inställningar via
  // hapticsOn() i js/app.js; läget har ingen egen. Skyddad `typeof`-krok (§12)
  // så filen fungerar även när app.js inte är laddad (testskalen).
  if(typeof hapticsOn === 'function' && !hapticsOn()) return
  if(typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') navigator.vibrate(pattern)
}

// ============================================================================
// Frågelek
// ============================================================================
// Ämnets spelbara frågor. Placeholders, uteslutna och bildfrågor utelämnas.
// Filtret på textlängd hålls skilt från grundfiltret, så att den mjuka
// fallbacken nedan kan välja mellan de två utan att bygga poolen två gånger.
function buildTidsjaktPool(topic, lens){
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
    const key = `${q.topic}|${q.id}`
    if(seen.has(key)) continue      // samma fråga kan nås via flera ämnesvägar
    seen.add(key)
    pool.push(q)
  }
  return pool
}

function tidsjaktIsQuick(q){
  if(String(q.prompt).length > TIDSJAKT_MAX_PROMPT) return false
  const opts = [q.correct, ...q.distractors]
  return opts.every(o => String(o).length <= TIDSJAKT_MAX_OPTION)
}

// Mjukt filter: spela hellre ett ämne långsamt än inte alls.
function pickTidsjaktPool(pool){
  const quick = pool.filter(tidsjaktIsQuick)
  return quick.length >= TIDSJAKT_MIN_POOL ? quick : pool
}

// Leken slumpas om när den tar slut. På små ämnen betyder det att frågor
// återkommer — men aldrig två gånger i rad, vilket vore både förvirrande och
// gratis poäng.
function refillTidsjaktDeck(){
  const next = shuffle(tidsjaktPool.slice())
  if(next.length > 1 && tidsjaktCurrent && next[0] === tidsjaktCurrent){
    next.push(next.shift())
  }
  tidsjaktDeck = next
  tidsjaktDeckIdx = 0
}

function drawTidsjaktQuestion(){
  if(tidsjaktDeckIdx >= tidsjaktDeck.length) refillTidsjaktDeck()
  return tidsjaktDeck[tidsjaktDeckIdx++] || null
}

// Har spelaren kört läget förut? Avgör om förklaringsrutan fälls upp: den som
// redan kan spelet ska inte behöva stänga samma text varje runda.
function hasPlayedTidsjakt(){
  return getTidsjaktScores().length > 0
}

// ============================================================================
// Start
// ============================================================================
async function startTidsjakt(){
  tidsjaktName = el('playerName').value.trim() || 'Spelare'
  tidsjaktTopic = el('topic').value

  const lens = await loadPoolForTopic(tidsjaktTopic)
  const full = buildTidsjaktPool(tidsjaktTopic, lens)
  if(!full.length){
    alert('Det finns inga flervals- eller sant/falskt-frågor i det här ämnet. Välj ett annat ämne.')
    return
  }

  tidsjaktPool = pickTidsjaktPool(full)
  tidsjaktCurrent = null
  refillTidsjaktDeck()
  tidsjaktAnswered = 0
  tidsjaktCorrect = 0
  tidsjaktStreak = 0
  tidsjaktBestStreak = 0
  tidsjaktEarnedMs = 0
  tidsjaktLostMs = 0
  tidsjaktMissed = []
  tidsjaktLocked = false
  tidsjaktPendingEnd = false
  tidsjaktRunning = true
  tidsjaktRecordBeaten = false
  tidsjaktLastTickSec = -1
  tidsjaktPriorBest = tidsjaktBestFor(tidsjaktTopic)
  // Klockan sätts INTE här utan i beginTidsjaktRound(), när nedräkningen är
  // klar. Sattes den redan nu skulle nedräkningens sekunder räknas som speltid.
  tidsjaktStartTime = 0
  tidsjaktEndTime = 0
  // Bara för att klockan ska VISA full tid under nedräkningen. Det riktiga
  // värdet sätts i beginTidsjaktRound() och skriver över det här.
  tidsjaktDeadline = Date.now() + TIDSJAKT_DURATION_MS

  const label = topicLabelFor(tidsjaktTopic).replace(/\s*\([^)]*\)\s*$/, '')
  el('tidsjaktPlayerLabel').textContent = tidsjaktName
  el('tidsjaktMeta').textContent = `${label} · 60 sekunder`

  el('setup').classList.add('hidden')
  el('highscores').classList.add('hidden')
  el('result').classList.add('hidden')
  el('quiz').classList.add('hidden')
  el('flashcards').classList.add('hidden')
  el('matcha')?.classList.add('hidden')
  el('leitner')?.classList.add('hidden')
  el('tidsjaktFinished').classList.add('hidden')
  const intro = el('tidsjaktIntro')
  intro.classList.remove('hidden')
  // Alltid hopfälld vid start – reglerna ska finnas till hands, inte i vägen.
  intro.open = false
  el('tidsjaktPlay').classList.remove('hidden')
  el('tidsjaktFooter').classList.remove('hidden')
  el('tidsjakt').classList.remove('hidden')

  hideTidsjaktPraise()
  updateTidsjaktScoreBadge(false)
  // Svitmärket måste nollställas explicit: annars står förra rundans "🔥 9" kvar
  // när man trycker Ny runda, eftersom inget svar hunnit uppdatera det än.
  updateTidsjaktStreakChip()
  updateTidsjaktRecordChip()
  updateTidsjaktClock()
  startTidsjaktCountdown()
  window.scrollTo({ top: 0 })
}

// ============================================================================
// Nedräkning före start
// ============================================================================
// Klockan startade tidigare i samma ögonblick som vyn ritades. Allt som mötte
// spelaren först — en uppfälld regelpanel, sidans målning, att hitta med
// blicken — åt då riktiga sekunder ur de 60, och det syntes som ett sämre
// resultat. Nedräkningen ger en definierad startpunkt: rundan börjar när
// spelaren är redo, inte när DOM:en råkar bli klar.
//
// Frågan hålls dold under nedräkningen. Visades den skulle spelaren få tre
// sekunders gratis läsning på den första frågan, vilket gör den första frågan
// systematiskt lättare än de andra.
function startTidsjaktCountdown(){
  clearTidsjaktCountdown()
  tidsjaktLocked = true            // inga tryck räknas innan starten
  el('tidsjaktCard').classList.add('hidden')
  el('tidsjaktChoices').innerHTML = ''
  const wrap = el('tidsjaktCountdown')
  wrap.classList.remove('hidden')

  let left = TIDSJAKT_COUNTDOWN_FROM
  const paint = () => {
    const nr = el('tidsjaktCountdownNr')
    nr.textContent = left > 0 ? String(left) : 'Kör!'
    nr.classList.toggle('go', left <= 0)
    if(!tidsjaktReducedMotion()){
      nr.classList.remove('pop')
      void nr.offsetWidth            // tvinga omstart av animationen
      nr.classList.add('pop')
    }
    // Pip på varje siffra, en ljusare ton på "Kör!" – starten ska höras.
    playTidsjaktTone(left > 0 ? 'tick' : 'bonus')
    tidsjaktVibrate(left > 0 ? 20 : [30, 40, 30])
  }
  paint()

  const step = () => {
    left--
    if(left < 0){ beginTidsjaktRound(); return }
    paint()
    tidsjaktCountdownTimer = setTimeout(step, TIDSJAKT_COUNTDOWN_STEP_MS)
  }
  tidsjaktCountdownTimer = setTimeout(step, TIDSJAKT_COUNTDOWN_STEP_MS)
}

function clearTidsjaktCountdown(){
  if(tidsjaktCountdownTimer){ clearTimeout(tidsjaktCountdownTimer); tidsjaktCountdownTimer = null }
}

// Startskottet: här — och först här — börjar de 60 sekunderna.
function beginTidsjaktRound(){
  clearTidsjaktCountdown()
  el('tidsjaktCountdown').classList.add('hidden')
  el('tidsjaktCard').classList.remove('hidden')
  tidsjaktLocked = false
  tidsjaktStartTime = Date.now()
  tidsjaktDeadline = tidsjaktStartTime + TIDSJAKT_DURATION_MS
  updateTidsjaktClock()
  startTidsjaktClock()
  showTidsjaktQuestion()
}

// ============================================================================
// Frågevyn
// ============================================================================
function tidsjaktChoicesFor(q){
  // Sant/falskt har alltid samma naturliga ordning; flervalsalternativ slumpas.
  if(q.type === 'tf') return ['Sant', 'Falskt']
  return shuffle([q.correct, ...q.distractors])
}

function showTidsjaktQuestion(){
  const q = drawTidsjaktQuestion()
  if(!q){ finishTidsjakt(); return }
  tidsjaktCurrent = q
  tidsjaktLocked = false

  const promptEl = el('tidsjaktPrompt')
  promptEl.textContent = q.prompt
  promptEl.style.setProperty('--prompt-scale', tidsjaktTextScale(q.prompt, TIDSJAKT_PROMPT_SCALE).toFixed(3))

  const box = el('tidsjaktChoices')
  box.innerHTML = ''
  const choices = tidsjaktChoicesFor(q)
  // Två alternativ (sant/falskt) får dela en rad; fler läggs i 2×2-rutnät.
  box.classList.toggle('two', choices.length === 2)
  choices.forEach((text, i) => {
    const b = document.createElement('button')
    b.type = 'button'
    b.className = 'tidsjakt-choice'
    b.textContent = text
    b.style.setProperty('--opt-scale', tidsjaktTextScale(text, TIDSJAKT_OPT_SCALE).toFixed(3))
    b.dataset.choice = text
    b.dataset.idx = String(i + 1)
    b.addEventListener('click', () => onTidsjaktAnswer(b, text))
    box.appendChild(b)
  })

  // Kortet tonas in från höger, så att det känns som ett nytt kort i en ström
  // och inte som att texten byttes ut på stället. Klassen sätts i nästa frame
  // så att transitionen startar från utgångsläget.
  const card = el('tidsjaktCard')
  if(card && !tidsjaktReducedMotion()){
    card.classList.remove('in')
    void card.offsetWidth
    card.classList.add('enter')
    requestAnimationFrame(() => { card.classList.remove('enter'); card.classList.add('in') })
  }

  el('tidsjaktAnsweredLabel').textContent = tidsjaktAnswered > 0
    ? `${tidsjaktAnswered} svar`
    : 'Så många du hinner'
  // Krymp vyn tills fråga + alternativ + sidfot ryms på skärmen (app.js).
  if(typeof fitActiveView === 'function') fitActiveView()
}

function showTidsjaktPraise(text, tone){
  const p = el('tidsjaktPraise')
  if(!p) return
  p.textContent = text
  p.classList.remove('hidden')
  p.classList.toggle('gold', tone === 'record')
  p.classList.remove('in')
  void p.offsetWidth      // tvinga reflow så animationen kan köras om
  p.classList.add('in')
  if(tidsjaktPraiseTimer) clearTimeout(tidsjaktPraiseTimer)
  // Berömmet försvinner av sig självt: nästa fråga kommer inom sekunden, och en
  // rad som ligger kvar blir snabbt brus i stället för belöning.
  tidsjaktPraiseTimer = setTimeout(hideTidsjaktPraise, TIDSJAKT_PRAISE_MS)
}

function hideTidsjaktPraise(){
  const p = el('tidsjaktPraise')
  if(p){ p.classList.add('hidden'); p.classList.remove('in', 'gold') }
}

// "+3 s" / "−3 s" flyger upp ur klockan, så att tidsändringen syns som en
// händelse och inte bara som att stapeln råkade hoppa.
function flyTidsjaktTime(text, kind){
  const f = el('tidsjaktFly')
  if(!f) return
  // Två tidsändringar tätt efter varandra är fullt möjligt (två fel i rad).
  // Utan att rensa den förra döljs den nya siffran mitt i sin egen animation.
  if(tidsjaktFlyTimer) clearTimeout(tidsjaktFlyTimer)
  f.textContent = text
  f.classList.remove('hidden', 'up', 'down', 'go')
  f.classList.add(kind === 'bonus' ? 'up' : 'down')
  void f.offsetWidth
  f.classList.add('go')
  tidsjaktFlyTimer = setTimeout(() => {
    tidsjaktFlyTimer = null
    f.classList.remove('go')
    f.classList.add('hidden')
  }, tidsjaktReducedMotion() ? 400 : 900)
}

// ============================================================================
// Svar (§13.1 punkt 2, i den form läget kräver)
// ============================================================================
// Leitners tresteg om 260 ms vore fientligt här: klockan går, och varje
// millisekund tillhör spelaren. Payoffen är därför snabb men koreograferad —
// facit tänds, poängen studsar, tidsbonusen flyger, nästa kort glider in — allt
// inom TIDSJAKT_REVEAL_MS. Det som inte får hända är ett stumt tillståndsbyte,
// och klockan stoppas aldrig.
function onTidsjaktAnswer(btn, choice){
  if(tidsjaktLocked || !tidsjaktRunning) return
  const q = tidsjaktCurrent
  if(!q) return
  tidsjaktLocked = true

  const ok = choice === q.correct
  btn.classList.add('chosen')
  tidsjaktVibrate(10)   // kvitto på själva trycket, före facit

  tidsjaktAnswered++
  if(ok){
    tidsjaktCorrect++
    tidsjaktStreak++
    tidsjaktBestStreak = Math.max(tidsjaktBestStreak, tidsjaktStreak)
  } else {
    tidsjaktStreak = 0
    tidsjaktMissed.push({ prompt: q.prompt, correct: q.correct, chosen: choice })
    tidsjaktDeadline -= TIDSJAKT_PENALTY_MS
    tidsjaktLostMs += TIDSJAKT_PENALTY_MS
  }

  // Svitbonus: kunskap köper tid. Ges bara på hela steg om TIDSJAKT_STREAK_STEP.
  const bonus = ok && tidsjaktStreak > 0 && tidsjaktStreak % TIDSJAKT_STREAK_STEP === 0
  if(bonus){
    tidsjaktDeadline += TIDSJAKT_BONUS_MS
    tidsjaktEarnedMs += TIDSJAKT_BONUS_MS
  }

  // Rekordet slås MITT i rundan, inte i efterhand — det är hela poängen med att
  // visa personbästa under spelet.
  const beatsRecord = ok && tidsjaktPriorBest > 0 && !tidsjaktRecordBeaten && tidsjaktCorrect > tidsjaktPriorBest
  if(beatsRecord) tidsjaktRecordBeaten = true

  Array.from(el('tidsjaktChoices').children).forEach(b => {
    b.disabled = true
    // markAnswerBtn (app.js) lägger till ✓/✗ OCH dold skärmläsartext, så att
    // utfallet inte förmedlas med enbart färg (WCAG 1.4.1).
    if(b.dataset.choice === q.correct) markAnswerBtn(b, true)
    else if(b === btn){ markAnswerBtn(b, false); b.classList.add('shake') }
  })
  playTidsjaktTone(ok ? 'right' : 'wrong', tidsjaktStreak)
  tidsjaktVibrate(ok ? 12 : [10, 35, 10])

  updateTidsjaktScoreBadge(ok)
  updateTidsjaktStreakChip()
  updateTidsjaktClock()

  if(bonus){
    flyTidsjaktTime(`+${TIDSJAKT_BONUS_MS / 1000} s`, 'bonus')
    playTidsjaktTone('bonus')
    tidsjaktVibrate([12, 30, 12])
  } else if(!ok){
    flyTidsjaktTime(`−${TIDSJAKT_PENALTY_MS / 1000} s`, 'penalty')
  }

  if(beatsRecord){
    updateTidsjaktRecordChip()
    showTidsjaktPraise('🏆 Nytt rekord!', 'record')
    playTidsjaktTone('record')
    tidsjaktVibrate([14, 40, 14, 40, 20])
  } else if(bonus){
    showTidsjaktPraise(`🔥 ${tidsjaktStreak} i rad — +${TIDSJAKT_BONUS_MS / 1000} sekunder!`)
  } else if(ok && tidsjaktCorrect % TIDSJAKT_MILESTONE === 0){
    showTidsjaktPraise(`💪 ${tidsjaktCorrect} rätt!`)
  }

  if(tidsjaktAdvanceTimer) clearTimeout(tidsjaktAdvanceTimer)
  // Fördröjningen är INFORMATION, inte rörelse: den är tiden facit syns. Den
  // kortas därför inte bort vid prefers-reduced-motion (§13.1 punkt 8 gäller
  // animationer — att aldrig få se om svaret var rätt vore utebliven info).
  tidsjaktAdvanceTimer = setTimeout(advanceTidsjakt, ok ? TIDSJAKT_REVEAL_MS : TIDSJAKT_REVEAL_WRONG_MS)
}

function advanceTidsjakt(){
  tidsjaktAdvanceTimer = null
  if(!tidsjaktRunning) return
  if(tidsjaktPendingEnd || tidsjaktRemainingMs() <= 0){ finishTidsjakt(); return }
  showTidsjaktQuestion()
}

// ============================================================================
// Mätare (§13.1 punkt 3) — här är klockan framstegsmätaren
// ============================================================================
function tidsjaktRemainingMs(){
  return Math.max(0, tidsjaktDeadline - Date.now())
}

function updateTidsjaktClock(){
  const left = tidsjaktRemainingMs()
  const fill = el('tidsjaktClockFill')
  if(fill) fill.style.width = Math.min(100, (left / TIDSJAKT_DURATION_MS) * 100).toFixed(2) + '%'
  const label = el('tidsjaktClock')
  if(label){
    // Tiondelar de sista tio sekunderna: det är då varje halvsekund känns, och
    // en siffra som står still i en hel sekund tar bort spänningen.
    label.textContent = left >= 10000
      ? `${Math.ceil(left / 1000)} s`
      : `${(Math.ceil(left / 100) / 10).toFixed(1)} s`
  }
  const row = el('tidsjaktClockRow')
  if(row){
    row.classList.toggle('warn', left <= TIDSJAKT_WARN_MS && left > TIDSJAKT_DANGER_MS)
    row.classList.toggle('danger', left <= TIDSJAKT_DANGER_MS)
  }
}

function updateTidsjaktScoreBadge(bump){
  const badge = el('tidsjaktScoreBadge')
  if(!badge) return
  badge.textContent = `Rätt: ${tidsjaktCorrect}`
  if(bump){
    badge.classList.remove('bump')
    void badge.offsetWidth
    badge.classList.add('bump')
  }
}

// Spökmålet: personbästa i ämnet syns under spelet, som ett mål att jaga.
// Saknas rekord (första rundan i ämnet) visas inget alls — "Rekord 0" vore brus.
function updateTidsjaktRecordChip(){
  const chip = el('tidsjaktRecordChip')
  if(!chip) return
  if(!tidsjaktPriorBest){ chip.classList.add('hidden'); return }
  chip.classList.remove('hidden')
  chip.classList.toggle('beaten', tidsjaktRecordBeaten)
  chip.textContent = tidsjaktRecordBeaten ? '🏆 Rekord slaget' : `Rekord ${tidsjaktPriorBest}`
}

function updateTidsjaktStreakChip(){
  const chip = el('tidsjaktStreakChip')
  if(!chip) return
  if(tidsjaktStreak < 2){ chip.classList.add('hidden'); return }
  chip.classList.remove('hidden')
  chip.textContent = `🔥 ${tidsjaktStreak}`
  chip.classList.remove('bump')
  void chip.offsetWidth
  chip.classList.add('bump')
}

// ============================================================================
// Klockan
// ============================================================================
function startTidsjaktClock(){
  clearTidsjaktClock()
  tidsjaktClockInterval = setInterval(onTidsjaktTick, TIDSJAKT_TICK_MS)
}

function clearTidsjaktClock(){
  if(tidsjaktClockInterval){ clearInterval(tidsjaktClockInterval); tidsjaktClockInterval = null }
}

function onTidsjaktTick(){
  if(!tidsjaktRunning) return
  const left = tidsjaktRemainingMs()
  updateTidsjaktClock()

  // Tickljud en gång per sekund de sista sekunderna — dramaturgi, inte larm.
  if(left <= TIDSJAKT_TICKING_MS && left > 0){
    const sec = Math.ceil(left / 1000)
    if(sec !== tidsjaktLastTickSec){
      tidsjaktLastTickSec = sec
      playTidsjaktTone('tick')
      tidsjaktVibrate(8)
    }
  }

  if(left > 0) return
  clearTidsjaktClock()
  // Tog tiden slut mitt i ett facit får det visas färdigt först — annars
  // försvinner svaret man just gav framför ögonen.
  if(tidsjaktLocked){ tidsjaktPendingEnd = true; return }
  finishTidsjakt()
}

// ============================================================================
// Slutet (§13.1 punkt 5)
// ============================================================================
function animateTidsjaktRing(pct){
  const label = el('tidsjaktRingPct')
  if(label) label.textContent = pct + ' %'
  const ring = el('tidsjaktRingProgress')
  if(!ring) return
  const clamped = Math.max(0, Math.min(100, pct))
  const offset = TIDSJAKT_RING_CIRCUMFERENCE * (1 - clamped / 100)
  ring.style.strokeDashoffset = String(TIDSJAKT_RING_CIRCUMFERENCE)
  requestAnimationFrame(() => { ring.style.strokeDashoffset = String(offset) })
}

function renderTidsjaktMissed(){
  const wrap = el('tidsjaktMissedWrap')
  const list = el('tidsjaktMissed')
  const more = el('tidsjaktMissedMore')
  if(!wrap || !list) return
  list.innerHTML = ''
  if(!tidsjaktMissed.length){
    wrap.classList.add('hidden')
    return
  }
  wrap.classList.remove('hidden')
  tidsjaktMissed.slice(0, TIDSJAKT_MISSED_SHOWN).forEach(m => {
    const li = document.createElement('li')
    const q = document.createElement('span')
    q.className = 'sm-q'
    q.textContent = m.prompt
    const a = document.createElement('span')
    a.className = 'sm-a'
    a.textContent = m.correct
    li.append(q, a)
    list.appendChild(li)
  })
  const rest = tidsjaktMissed.length - TIDSJAKT_MISSED_SHOWN
  if(more){
    more.classList.toggle('hidden', rest <= 0)
    if(rest > 0) more.textContent = `… och ${rest} till.`
  }
}

function finishTidsjakt(){
  if(!tidsjaktRunning) return
  tidsjaktRunning = false
  tidsjaktLocked = true
  tidsjaktPendingEnd = false
  clearTidsjaktClock()
  if(tidsjaktAdvanceTimer){ clearTimeout(tidsjaktAdvanceTimer); tidsjaktAdvanceTimer = null }
  if(tidsjaktPraiseTimer){ clearTimeout(tidsjaktPraiseTimer); tidsjaktPraiseTimer = null }
  hideTidsjaktPraise()
  tidsjaktEndTime = Date.now()

  el('tidsjaktPlay').classList.add('hidden')
  el('tidsjaktFooter').classList.add('hidden')
  el('tidsjaktIntro').classList.add('hidden')   // spelreglerna är inte intressanta på resultatskärmen
  el('tidsjaktFinished').classList.remove('hidden')
  updateTidsjaktClock()

  const durationMs = Math.max(0, tidsjaktEndTime - tidsjaktStartTime)
  const secs = Math.max(1, Math.round(durationMs / 1000))
  const pct = tidsjaktAnswered ? Math.round((tidsjaktCorrect / tidsjaktAnswered) * 100) : 0
  const isRecord = tidsjaktPriorBest > 0 && tidsjaktCorrect > tidsjaktPriorBest

  el('tidsjaktDoneText').textContent = `Tiden är ute! ${tidsjaktCorrect} rätt av ${tidsjaktAnswered} svar på ${secs} sekunder.`

  // Bara nyckeltal som faktiskt hände — "🔥 bästa svit 1" och "+0 s" är inga
  // prestationer att skylta med.
  const nyckeltal = []
  if(tidsjaktCorrect > 0) nyckeltal.push(`⚡ ${(secs / tidsjaktCorrect).toFixed(1)} s per rätt svar`)
  if(tidsjaktBestStreak > 1) nyckeltal.push(`🔥 bästa svit ${tidsjaktBestStreak}`)
  if(tidsjaktEarnedMs > 0) nyckeltal.push(`+${tidsjaktEarnedMs / 1000} s intjänat`)
  if(tidsjaktLostMs > 0) nyckeltal.push(`−${tidsjaktLostMs / 1000} s i tidsstraff`)
  el('tidsjaktStatsText').textContent = nyckeltal.join(' · ')

  // Slutet pekar framåt: vad som skulle behövas för att slå rekordet.
  el('tidsjaktNextText').textContent = isRecord
    ? `Nytt personbästa i ämnet — förra rekordet var ${tidsjaktPriorBest} rätt.`
    : tidsjaktPriorBest > 0
      ? `Ditt rekord i ämnet är ${tidsjaktPriorBest} rätt. ${Math.max(1, tidsjaktPriorBest - tidsjaktCorrect + 1)} fler nästa gång och det är ditt.`
      : 'Första rundan i det här ämnet — nu har du ett rekord att slå.'

  const badge = el('tidsjaktRecordBadge')
  if(badge) badge.classList.toggle('hidden', !isRecord)
  animateTidsjaktRing(pct)
  renderTidsjaktMissed()
  playTidsjaktTone('end')
  tidsjaktVibrate([18, 60, 18])

  try{ saveTidsjaktScore(durationMs) }catch(e){ console.error('saveTidsjaktScore misslyckades:', e) }
  window.scrollTo({ top: 0 })
}

function saveTidsjaktScore(durationMs){
  const scores = getTidsjaktScores()
  scores.push({
    name: tidsjaktName,
    topic: tidsjaktTopic,
    topicLabel: topicLabelFor(tidsjaktTopic),
    correct: tidsjaktCorrect,
    answered: tidsjaktAnswered,
    streak: tidsjaktBestStreak,
    earnedMs: tidsjaktEarnedMs,
    durationMs,
    date: new Date().toISOString()
  })
  scores.sort((a, b) => new Date(b.date) - new Date(a.date))
  saveTidsjaktScores(scores.slice(0, 50))
}

// ============================================================================
// Avbryt / avsluta
// ============================================================================
function cancelTidsjakt(){
  if(confirm('Avbryta rundan? Resultatet sparas inte.')){
    tidsjaktRunning = false
    clearTidsjaktClock()
    clearTidsjaktCountdown()   // avbryt under nedräkningen: annars startar rundan i en dold vy
    if(tidsjaktAdvanceTimer){ clearTimeout(tidsjaktAdvanceTimer); tidsjaktAdvanceTimer = null }
    if(tidsjaktPraiseTimer){ clearTimeout(tidsjaktPraiseTimer); tidsjaktPraiseTimer = null }
    el('tidsjakt').classList.add('hidden')
    el('setup').classList.remove('hidden')
  }
}

function quitTidsjakt(){
  el('tidsjakt').classList.add('hidden')
  el('setup').classList.remove('hidden')
}

// ============================================================================
// Topplistesegmentet (i #highscores)
// ============================================================================
function renderTidsjaktScores(){
  const ol = el('scoreList-tidsjakt')
  if(!ol) return
  const emptyP = ol.parentElement.querySelector('.hs-empty')
  const scores = getTidsjaktScores()
  const pctOf = s => (s.answered > 0 ? s.correct / s.answered : 0)
  const list = [...scores].sort((a, b) => {
    if((b.correct || 0) !== (a.correct || 0)) return (b.correct || 0) - (a.correct || 0)
    if(pctOf(b) !== pctOf(a)) return pctOf(b) - pctOf(a)
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
    const pct = s.answered ? Math.round((s.correct / s.answered) * 100) : 0
    li.append(
      mk('sr-rank', (i + 1) + '.'),
      mk('sr-name', s.name),
      mk('sr-topic', abbrev ? `(${abbrev}) ${label}` : label),
      mk('sr-score sr-lead', `${s.correct} rätt`),
      mk(pct < 75 ? 'sr-pct weak' : 'sr-pct', `${pct} %`),
      mk('sr-time', `🔥 ${s.streak || 0}`),
      mk('sr-date', new Date(s.date).toLocaleDateString('sv-SE'))
    )
    ol.appendChild(li)
  })
}

function exportTidsjaktScores(){
  const scores = getTidsjaktScores()
  if(!scores.length){
    alert('Det finns inga resultat från Tidsjakt att exportera än.')
    return
  }
  const payload = { type: TIDSJAKT_EXPORT_TYPE, version: 1, exported: new Date().toISOString(), scores }
  downloadJsonBlob(payload, `anatomiquiz-motklockan-${new Date().toISOString().slice(0, 10)}`)
}

function tidsjaktScoreSignature(s){ return [s.date, s.name, s.topic, s.correct, s.answered].join('|') }

function handleImportTidsjaktScores(ev){
  const f = ev.target.files && ev.target.files[0]
  if(!f) return
  const reader = new FileReader()
  reader.onload = () => {
    try{
      const parsed = JSON.parse(reader.result)
      const incoming = Array.isArray(parsed) ? parsed
        : (parsed && parsed.type === TIDSJAKT_EXPORT_TYPE && Array.isArray(parsed.scores)) ? parsed.scores
        : null
      if(!incoming){ alert('Fel format: filen ser inte ut som en exporterad fil från Tidsjakt.'); return }
      const merged = getTidsjaktScores()
      const seen = new Set(merged.map(tidsjaktScoreSignature))
      let added = 0, skipped = 0
      incoming.forEach(s => {
        if(!s || typeof s.date !== 'string' || typeof s.correct !== 'number'){ skipped++; return }
        const sig = tidsjaktScoreSignature(s)
        if(seen.has(sig)){ skipped++; return }
        seen.add(sig); merged.push(s); added++
      })
      merged.sort((a, b) => new Date(b.date) - new Date(a.date))
      saveTidsjaktScores(merged.slice(0, 50))
      renderTidsjaktScores()
      alert(`Import klar. Tillagda resultat: ${added}. Hoppade över: ${skipped}.`)
    }catch(e){ alert('Kunde inte läsa JSON: ' + e.message) }
  }
  reader.readAsText(f, 'utf-8')
  ev.target.value = ''
}

function clearTidsjaktScoresFlow(){
  if(!confirm('Är du säker? Alla resultat från Tidsjakt raderas permanent.')) return
  localStorage.removeItem(TIDSJAKT_SCORES_KEY)
  tidsjaktMemoryScores = null
  renderTidsjaktScores()
}

// ============================================================================
// Uppkoppling (egen DOMContentLoaded, oberoende av app.js:s init)
// ============================================================================
// Läget rättar automatiskt och behöver därför MC- eller TF-frågor; knappen
// skuggas för rena flashcard-ämnen. Anropas av app.js updateStartButtons() via
// en skyddad krok, så knappen hålls i synk när ämneslistan byggs om.
function updateTidsjaktButton(){
  const cap = topicCapabilities()
  const b = el('startTidsjaktBtn')
  if(b) b.disabled = !(cap.mc || cap.tf)
}

// Tangentbord på dator: 1–4 svarar. Rör bara den här vyn, och bara när inget
// textfält har fokus.
function onTidsjaktKey(ev){
  const sec = el('tidsjakt')
  if(!sec || sec.classList.contains('hidden')) return
  if(!tidsjaktRunning || tidsjaktLocked) return
  const tag = (document.activeElement && document.activeElement.tagName) || ''
  if(tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
  const n = parseInt(ev.key, 10)
  if(!n || n < 1 || n > 9) return
  const btn = el('tidsjaktChoices')?.children[n - 1]
  if(btn){ ev.preventDefault(); btn.click() }
}

document.addEventListener('DOMContentLoaded', () => {
  el('startTidsjaktBtn')?.addEventListener('click', startTidsjakt)
  el('tidsjaktCancelBtn')?.addEventListener('click', cancelTidsjakt)
  el('tidsjaktRetryBtn')?.addEventListener('click', startTidsjakt)
  el('tidsjaktQuitBtn')?.addEventListener('click', quitTidsjakt)
  el('exportScores-tidsjakt')?.addEventListener('click', exportTidsjaktScores)
  const imp = el('importScoresFile-tidsjakt')
  if(imp) imp.addEventListener('change', handleImportTidsjaktScores)
  el('importScoresBtn-tidsjakt')?.addEventListener('click', () => imp?.click())
  el('clearScores-tidsjakt')?.addEventListener('click', clearTidsjaktScoresFlow)
  document.addEventListener('keydown', onTidsjaktKey)
  updateTidsjaktButton()
})

