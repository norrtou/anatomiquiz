// ============================================================================
// js/sortera.js — spelläget "Sortera".
// Namnet är ett fritt svenskt ord som ingen firma äger – inga varumärken i
// filnamn, funktioner, id:n, klasser eller synlig text (CLAUDE_REGLER §12.1).
// Synligt namn: "Sortera". Slug: "sortera".
// ============================================================================
// EGEN FIL PER SPELLÄGE (CLAUDE_REGLER §12): laddas som klassiskt <script defer>
// EFTER js/app.js och delar globalt scope med den. Den anropar app.js hjälpare
// direkt som globaler:
//   el, shuffle, formatDuration, warnStorageUnavailable, downloadJsonBlob,
//   markAnswerBtn, playTone, streakTone, hapticPulse, reducedMotionPreferred,
//   GM_RING_CIRCUMFERENCE, fitActiveView.
// app.js känner i sin tur INTE till läget annat än via skyddade krokar
// (`if(typeof renderSorteraScores === 'function') …` i showHighscores och
// `if(typeof updateSorteraButton === 'function') …` i updateStartButtons).
// ============================================================================
// EGET FRÅGEARKIV, EGEN UNDERSTARTSIDA
// ============================================================================
// Läget använder INTE quizets ämnesväljare. Frågorna är sorteringsfrågor med
// eget skelett (en ORDNING av fem strukturer, inte ett rätt svar bland fyra)
// och bor i data/sortera.json med två egna ämnen. Därför får läget en egen
// startvy med egen ämnesdropdown — men det är just en EGEN väljare, ingen kopia
// av loadPoolForTopic/topicMatchesSelection, som fortsatt finns i en upplaga i
// app.js (§13.1).
// ============================================================================
// SPELLOGIK — fem brickor, en ordning, ett facit i taget
// ============================================================================
// Fem strukturer visas slumpade i en bricksamling. Man trycker på en bricka och
// den flyger ned i nästa lediga plats; trycker man på en placerad bricka åker
// den tillbaka. Ingen drag & drop: HTML5-drag fungerar inte på touch, och egen
// pekardrag betyder scroll-låsning och träffytor som glider. Tryck-för-att-
// placera ger samma resultat, funkar med tumme OCH tangentbord, och är mindre kod.
//
// Rättningen sker FÖRST när alla fem sitter och spelaren själv trycker Rätta.
// Att få stå kvar och tänka om är hela poängen med ett sorteringsspel — en
// automatisk rättning per tryck hade gjort om det till fem gissningar.
//
// POÄNG: en fråga är rätt bara om HELA ordningen stämmer (fullträff). Vid sidan
// om räknas rätta placeringar (0–5), som gör mätaren rättvis utan att göra
// frågan lättare — det är den siffran som visar att man var nära.
// ============================================================================
const SORTERA_SCORES_KEY = 'hur_highscores_sortera'
const SORTERA_EXPORT_TYPE = 'anatomiquiz-sortera'
const SORTERA_DATA_PATH = 'data/sortera.json'

const SORTERA_SLOTS = 5            // fem platser – speglar ANTAL_POSTER i validate_sortera.py
const SORTERA_MIXED = 'blandat'    // värdet för "båda ämnena" i ämnesdropdownen
// Facit avslöjas en plats i taget. Det här ÄR rörelse (inget jagar spelaren och
// inget försvinner), och nollas därför vid prefers-reduced-motion — till
// skillnad från Dagens utmanings kvitto, som är information (§13.1 punkt 8).
const SORTERA_REVEAL_STEP_MS = 200
const SORTERA_PRAISE_MS = 1800
const SORTERA_STREAK_PRAISE = 3    // fullträffar i rad innan sviten firas
const SORTERA_MISSED_SHOWN = 6     // så många missade frågor listas i slutet

// Textlängd → typsnittsskala per bricka (--tile-scale). Etiketterna spänner
// från "Patella" till "M. transversus abdominis i höger flank", och utan
// skalning blir brickorna olika höga i samma omgång.
const SORTERA_SCALE_MIN_LEN = 16
const SORTERA_SCALE_MAX_LEN = 40
const SORTERA_SCALE_FLOOR = 0.78

// --- Arkivet -----------------------------------------------------------------
let sorteraArkiv = null            // { axlar, amnen, fragor } eller null tills laddat
let sorteraLoading = null          // pågående load-löfte, så att två klick inte hämtar två gånger

// --- Rundans tillstånd -------------------------------------------------------
let sorteraSet = []
let sorteraIdx = 0
let sorteraCurrent = null
let sorteraBank = []               // [{ item, placerad }] i visningsordning (slumpad)
let sorteraPlaced = []             // längd SORTERA_SLOTS; index i sorteraBank eller null
let sorteraAnswered = 0
let sorteraFull = 0                // fullträffar (hela ordningen rätt)
let sorteraPlacements = 0          // rätta placeringar totalt
let sorteraStreak = 0              // fullträffar i rad
let sorteraBestStreak = 0
let sorteraMissed = []             // { prompt, ratt: [etiketter] }
let sorteraStartTime = 0
let sorteraRunning = false
let sorteraPhase = 'placing'       // 'placing' → 'revealed'
let sorteraName = 'Spelare'
let sorteraTopic = ''
let sorteraPraiseTimer = null
let sorteraRevealTimers = []

// ============================================================================
// Lagring — eget fack med minnesfallback (privat läge får tappa historiken,
// inte krascha spelet).
// ============================================================================
let sorteraMemoryScores = null

function getSorteraScores(){
  if(sorteraMemoryScores) return sorteraMemoryScores
  try{
    const raw = JSON.parse(localStorage.getItem(SORTERA_SCORES_KEY) || '[]')
    return Array.isArray(raw) ? raw : []
  }catch(e){ return sorteraMemoryScores || [] }
}

function saveSorteraScores(scores){
  try{ localStorage.setItem(SORTERA_SCORES_KEY, JSON.stringify(scores)); sorteraMemoryScores = null }
  catch(e){ sorteraMemoryScores = scores; warnStorageUnavailable() }
}

// Har spelaren kört läget förut? Styr om förklaringen är uppfälld (§13.1).
function hasPlayedSortera(){
  return getSorteraScores().length > 0
}

// ============================================================================
// Arkivet
// ============================================================================
async function loadSorteraArkiv(){
  if(sorteraArkiv) return sorteraArkiv
  if(sorteraLoading) return sorteraLoading
  sorteraLoading = (async () => {
    try{
      const res = await fetch(SORTERA_DATA_PATH)
      if(!res.ok) throw new Error(`${res.status} ${res.statusText}`)
      const data = await res.json()
      if(!data || !Array.isArray(data.fragor)) throw new Error('oväntat format')
      sorteraArkiv = data
    }catch(e){
      console.error('Kunde inte läsa ' + SORTERA_DATA_PATH + ':', e)
      sorteraArkiv = null
    }
    sorteraLoading = null
    if(typeof updateSorteraButton === 'function') updateSorteraButton()
    return sorteraArkiv
  })()
  return sorteraLoading
}

function sorteraAxel(q){
  return (sorteraArkiv && sorteraArkiv.axlar && sorteraArkiv.axlar[q.axis]) || { top: '', bottom: '' }
}

function sorteraAmnesnamn(topic){
  if(topic === SORTERA_MIXED) return 'Blandat'
  return (sorteraArkiv && sorteraArkiv.amnen && sorteraArkiv.amnen[topic]) || topic
}

// Frågorna i valt ämne, slumpade och kapade till önskat antal.
function buildSorteraSet(topic, count){
  if(!sorteraArkiv) return []
  const pool = sorteraArkiv.fragor.filter(q => topic === SORTERA_MIXED || q.topic === topic)
  return shuffle([...pool]).slice(0, Math.max(1, count))
}

// Brickorna visas slumpade. Skulle lotten ge exakt rätt ordning slumpas det om:
// en omgång som redan är löst innan man rört den är ingen omgång.
function sorteraShuffleItems(items){
  if(items.length < 2) return items.map((item, i) => ({ item, kalla: i }))
  let ordning
  let varv = 0
  do {
    ordning = shuffle(items.map((_, i) => i))
    varv++
  } while(varv < 12 && ordning.every((k, i) => k === i))
  return ordning.map(k => ({ item: items[k], kalla: k }))
}

function sorteraTileScale(text){
  const len = (text || '').length
  if(len <= SORTERA_SCALE_MIN_LEN) return 1
  const andel = Math.min(1, (len - SORTERA_SCALE_MIN_LEN) / (SORTERA_SCALE_MAX_LEN - SORTERA_SCALE_MIN_LEN))
  return 1 - andel * (1 - SORTERA_SCALE_FLOOR)
}

// Facitraden under en bricka: mätvärdet i storleksfrågor, annars kortfakta.
function sorteraFacitText(item){
  if(item.value !== undefined && item.unit){
    return item.note || `${sorteraFormatNumber(item.value)} ${item.unit}`
  }
  return item.note || ''
}

function sorteraFormatNumber(v){
  return Number(v).toLocaleString('sv-SE')
}

// ============================================================================
// Understartsidan — lägets egen väljare (eget arkiv, egna ämnen)
// ============================================================================
async function openSorteraStart(){
  await loadSorteraArkiv()
  if(!sorteraArkiv){
    alert('Kunde inte läsa frågorna till Sortera. Kontrollera nätverket och försök igen.')
    return
  }
  fillSorteraTopics()

  el('setup').classList.add('hidden')
  el('highscores').classList.add('hidden')
  el('result').classList.add('hidden')
  el('quiz').classList.add('hidden')
  el('flashcards').classList.add('hidden')
  el('matcha')?.classList.add('hidden')
  el('leitner')?.classList.add('hidden')
  el('tidsjakt')?.classList.add('hidden')
  el('dagsutmaning')?.classList.add('hidden')

  el('sorteraPlay').classList.add('hidden')
  el('sorteraFinished').classList.add('hidden')
  el('sorteraFooter').classList.add('hidden')
  el('sorteraStart').classList.remove('hidden')
  el('sortera').classList.remove('hidden')

  // Uppfälld för den som aldrig spelat, hopfälld för den som har (§13.1).
  const intro = el('sorteraIntro')
  if(intro){ intro.classList.remove('hidden'); intro.open = !hasPlayedSortera() }

  window.scrollTo({ top: 0 })
  if(typeof fitActiveView === 'function') fitActiveView()
}

// Ämnesdropdownen byggs ur arkivet, inte ur en handskriven lista i HTML:en —
// ett nytt ämne i data/sortera.json ska dyka upp utan att någon rör index.html.
function fillSorteraTopics(){
  const sel = el('sorteraTopic')
  if(!sel || !sorteraArkiv) return
  const tidigare = sel.value
  const antalPer = {}
  sorteraArkiv.fragor.forEach(q => { antalPer[q.topic] = (antalPer[q.topic] || 0) + 1 })

  sel.innerHTML = ''
  Object.keys(sorteraArkiv.amnen).forEach(topic => {
    const o = document.createElement('option')
    o.value = topic
    o.textContent = `${sorteraArkiv.amnen[topic]} (${antalPer[topic] || 0} frågor)`
    sel.appendChild(o)
  })
  const bland = document.createElement('option')
  bland.value = SORTERA_MIXED
  bland.textContent = `Blandat (${sorteraArkiv.fragor.length} frågor)`
  sel.appendChild(bland)
  if(tidigare) sel.value = tidigare
}

function selectedSorteraCount(){
  const n = parseInt(el('sorteraCount')?.value, 10)
  return Number.isFinite(n) && n > 0 ? n : 10
}

// ============================================================================
// Rundan
// ============================================================================
function startSortera(){
  if(!sorteraArkiv) return
  sorteraTopic = el('sorteraTopic')?.value || SORTERA_MIXED
  sorteraSet = buildSorteraSet(sorteraTopic, selectedSorteraCount())
  if(!sorteraSet.length){
    alert('Det finns inga frågor i det valda ämnet än.')
    return
  }

  sorteraName = (el('playerName')?.value || '').trim() || 'Spelare'
  sorteraIdx = 0
  sorteraAnswered = 0
  sorteraFull = 0
  sorteraPlacements = 0
  sorteraStreak = 0
  sorteraBestStreak = 0
  sorteraMissed = []
  sorteraRunning = true
  sorteraStartTime = Date.now()

  el('sorteraPlayerLabel').textContent = sorteraName
  el('sorteraMeta').textContent = `${sorteraAmnesnamn(sorteraTopic)} · ${sorteraSet.length} frågor`

  el('sorteraStart').classList.add('hidden')
  el('sorteraFinished').classList.add('hidden')
  el('sorteraPlay').classList.remove('hidden')
  el('sorteraFooter').classList.remove('hidden')
  el('sortera').classList.remove('hidden')
  el('sorteraIntro')?.classList.add('hidden')   // reglerna är lästa, nu spelas det

  hideSorteraPraise()
  updateSorteraMeter()
  updateSorteraScoreBadge(false)
  showSorteraQuestion()
  window.scrollTo({ top: 0 })
}

function showSorteraQuestion(){
  const q = sorteraSet[sorteraIdx]
  if(!q){ finishSortera(); return }
  sorteraCurrent = q
  sorteraPhase = 'placing'
  clearSorteraRevealTimers()

  sorteraBank = sorteraShuffleItems(q.items)
  sorteraPlaced = new Array(SORTERA_SLOTS).fill(null)

  const axel = sorteraAxel(q)
  el('sorteraPrompt').textContent = q.prompt
  el('sorteraPoleTop').textContent = axel.top
  el('sorteraPoleBottom').textContent = axel.bottom

  const forklaring = el('sorteraExplanation')
  if(forklaring){ forklaring.classList.add('hidden'); forklaring.textContent = '' }

  renderSorteraBoard()
  el('sorteraCounter').textContent = `Fråga ${sorteraIdx + 1} av ${sorteraSet.length}`

  const check = el('sorteraCheckBtn')
  if(check){ check.textContent = 'Rätta'; check.disabled = true }

  if(typeof fitActiveView === 'function') fitActiveView()
}

// ============================================================================
// Spelplanen
// ============================================================================
// Ritas om i sin helhet under placeringsfasen (billigt: fem brickor), men
// ALDRIG under avslöjandet — då färgas bara den plats som just avslöjats om,
// annars startar redan avslöjade platser om sina animationer (§13.1 punkt 2).
function renderSorteraBoard(){
  const slots = el('sorteraSlots')
  const bank = el('sorteraBankRow')
  if(!slots || !bank) return

  slots.innerHTML = ''
  for(let pos = 0; pos < SORTERA_SLOTS; pos++){
    const li = document.createElement('li')
    li.className = 'sortera-slot'
    li.dataset.pos = String(pos)

    const nr = document.createElement('span')
    nr.className = 'sortera-slot-nr'
    nr.setAttribute('aria-hidden', 'true')
    nr.textContent = String(pos + 1)
    li.appendChild(nr)

    const bankIdx = sorteraPlaced[pos]
    if(bankIdx === null){
      const tom = document.createElement('span')
      tom.className = 'sortera-slot-empty'
      tom.textContent = 'Tom plats'
      li.appendChild(tom)
      li.classList.add('empty')
    } else {
      const etikett = sorteraBank[bankIdx].item.label
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.className = 'sortera-tile placed'
      btn.style.setProperty('--tile-scale', sorteraTileScale(etikett).toFixed(3))
      btn.textContent = etikett
      btn.setAttribute('aria-label', `${etikett}, plats ${pos + 1} av ${SORTERA_SLOTS}. Tryck för att ta tillbaka.`)
      btn.addEventListener('click', () => unplaceSorteraSlot(pos))
      li.appendChild(btn)
    }
    slots.appendChild(li)
  }

  bank.innerHTML = ''
  sorteraBank.forEach((post, i) => {
    if(sorteraPlaced.includes(i)) return
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'sortera-tile'
    btn.style.setProperty('--tile-scale', sorteraTileScale(post.item.label).toFixed(3))
    btn.textContent = post.item.label
    btn.dataset.bank = String(i)
    btn.setAttribute('aria-label', `${post.item.label}. Tryck för att placera i nästa lediga plats.`)
    btn.addEventListener('click', () => placeSorteraTile(i))
    bank.appendChild(btn)
  })

  const kvar = sorteraBank.length - sorteraPlaced.filter(p => p !== null).length
  const hint = el('sorteraBankHint')
  if(hint){
    hint.textContent = kvar > 0
      ? `${kvar} kvar att placera`
      : 'Alla placerade – tryck Rätta när du är nöjd'
  }

  const check = el('sorteraCheckBtn')
  if(check && sorteraPhase === 'placing') check.disabled = kvar > 0

  if(typeof fitActiveView === 'function') fitActiveView()
}

function placeSorteraTile(bankIdx){
  if(sorteraPhase !== 'placing' || !sorteraRunning) return
  if(sorteraPlaced.includes(bankIdx)) return
  const pos = sorteraPlaced.indexOf(null)
  if(pos === -1) return
  sorteraPlaced[pos] = bankIdx
  hapticPulse(10)                              // kvitto på själva trycket
  playSorteraTone('place')
  renderSorteraBoard()
  // Brickan tonas in på sin nya plats i stället för att poppa: klassen sätts i
  // nästa frame så att transitionen startar från utgångsläget.
  const ny = el('sorteraSlots')?.children[pos]?.querySelector('.sortera-tile')
  if(ny && !reducedMotionPreferred()){
    ny.classList.add('landing')
    requestAnimationFrame(() => ny.classList.remove('landing'))
  }
}

function unplaceSorteraSlot(pos){
  if(sorteraPhase !== 'placing' || !sorteraRunning) return
  if(sorteraPlaced[pos] === null) return
  sorteraPlaced[pos] = null
  hapticPulse(8)
  playSorteraTone('lift')
  renderSorteraBoard()
}

// ============================================================================
// Rättningen (§13.1 punkt 2) — payoff, inte tillståndsbyte
// ============================================================================
// Avslöjas NEDIFRÅN och upp, en plats i taget: rätt plats poppar, fel plats
// skakar och byter till det som skulle stått där. I storleksfrågor vänds
// dessutom mätvärdet fram under varje bricka — det är den frågetypens riktiga
// belöning, och det som gör att man lär sig storleksordningen och inte bara
// facit på just den här frågan.
function checkSorteraOrder(){
  if(!sorteraRunning) return
  if(sorteraPhase === 'revealed'){ advanceSortera(); return }
  if(sorteraPlaced.includes(null)) return

  sorteraPhase = 'revealed'
  const q = sorteraCurrent
  const check = el('sorteraCheckBtn')
  if(check) check.disabled = true

  // kalla = postens index i q.items, alltså dess RÄTTA plats.
  const utfall = sorteraPlaced.map((bankIdx, pos) => sorteraBank[bankIdx].kalla === pos)
  const ratta = utfall.filter(Boolean).length
  const fullstandigt = ratta === SORTERA_SLOTS

  sorteraAnswered++
  sorteraPlacements += ratta
  if(fullstandigt){
    sorteraFull++
    sorteraStreak++
    sorteraBestStreak = Math.max(sorteraBestStreak, sorteraStreak)
  } else {
    sorteraStreak = 0
    sorteraMissed.push({ prompt: q.prompt, ratt: q.items.map(i => i.label) })
  }

  Array.from(el('sorteraSlots').children).forEach(li => li.classList.add('locked'))
  Array.from(el('sorteraBankRow').children).forEach(b => { b.disabled = true })

  const steg = reducedMotionPreferred() ? 0 : SORTERA_REVEAL_STEP_MS
  clearSorteraRevealTimers()
  for(let i = 0; i < SORTERA_SLOTS; i++){
    const pos = SORTERA_SLOTS - 1 - i          // nedifrån och upp
    const timer = setTimeout(() => revealSorteraSlot(pos, utfall[pos], q), steg * i)
    sorteraRevealTimers.push(timer)
  }
  const efter = setTimeout(() => finishSorteraReveal(ratta, fullstandigt, q), steg * SORTERA_SLOTS)
  sorteraRevealTimers.push(efter)
}

function revealSorteraSlot(pos, ok, q){
  const li = el('sorteraSlots')?.children[pos]
  if(!li) return
  const tile = li.querySelector('.sortera-tile')
  const ratt = q.items[pos]

  li.classList.add(ok ? 'correct' : 'wrong')
  if(tile) tile.classList.add(ok ? 'pop' : 'shake')

  // Fel plats: visa VAD som skulle stått där, och vad spelaren hade. Utan det
  // första lär man sig ingenting av felet, utan det andra förstår man inte
  // varför platsen är röd.
  if(!ok && tile){
    const eget = tile.textContent
    tile.textContent = ratt.label
    tile.style.setProperty('--tile-scale', sorteraTileScale(ratt.label).toFixed(3))
    const hade = document.createElement('span')
    hade.className = 'sortera-slot-had'
    hade.textContent = `du hade: ${eget}`
    li.appendChild(hade)
  }

  const facit = sorteraFacitText(ratt)
  if(facit){
    const rad = document.createElement('span')
    rad.className = 'sortera-slot-fact'
    rad.textContent = facit
    li.appendChild(rad)
  }

  // ✓/✗ plus dold skärmläsartext – utfallet får aldrig bäras av färg allena
  // (WCAG 1.4.1). Samma hjälpare som quizet använder.
  markAnswerBtn(li, ok)

  playSorteraTone(ok ? 'right' : 'wrong')
  hapticPulse(ok ? 10 : [8, 30, 8])
}

function finishSorteraReveal(ratta, fullstandigt, q){
  const forklaring = el('sorteraExplanation')
  if(forklaring && q.explanation){
    forklaring.textContent = q.explanation
    forklaring.classList.remove('hidden')
  }

  updateSorteraMeter()
  updateSorteraScoreBadge(fullstandigt)

  // Beröm vid delmål — konkret, inte bara siffror.
  if(fullstandigt && sorteraStreak >= SORTERA_STREAK_PRAISE){
    showSorteraPraise(`🔥 ${sorteraStreak} perfekta i rad!`, 'gold')
    playSorteraTone('praise')
    hapticPulse([12, 30, 12])
  } else if(fullstandigt){
    showSorteraPraise('🎯 Perfekt ordning!')
    playSorteraTone('praise')
  } else if(ratta === SORTERA_SLOTS - 2){
    // Två fel platser är alltid ett omkastat par – det är den vanligaste
    // nästan-rätt-situationen och värd ett eget erkännande.
    showSorteraPraise('Nära – två platser var omkastade')
  }

  const check = el('sorteraCheckBtn')
  if(check){
    check.disabled = false
    check.textContent = sorteraIdx + 1 >= sorteraSet.length ? 'Se resultat' : 'Nästa'
  }
  if(typeof fitActiveView === 'function') fitActiveView()
}

function advanceSortera(){
  clearSorteraRevealTimers()
  if(!sorteraRunning) return
  sorteraIdx++
  if(sorteraIdx >= sorteraSet.length){ finishSortera(); return }
  showSorteraQuestion()
}

function clearSorteraRevealTimers(){
  sorteraRevealTimers.forEach(t => clearTimeout(t))
  sorteraRevealTimers = []
}

// ============================================================================
// Mätare och beröm (§13.1 punkt 3 och 4)
// ============================================================================
// Mätaren går över HELA spelet, inte över frågan.
function updateSorteraMeter(){
  const fill = el('sorteraProgressFill')
  const total = sorteraSet.length || 1
  if(fill) fill.style.width = Math.min(100, (sorteraAnswered / total) * 100).toFixed(1) + '%'

  // Delpoängen får en egen rad: den visar att man var nära även när ingen
  // fullträff blev av, och är därför lägets ärligaste framstegsmått.
  const delrad = el('sorteraPlacementText')
  if(delrad){
    const mojliga = sorteraAnswered * SORTERA_SLOTS
    delrad.textContent = mojliga
      ? `Rätta placeringar: ${sorteraPlacements} av ${mojliga}`
      : ''
  }
}

function updateSorteraScoreBadge(bump){
  const badge = el('sorteraScoreBadge')
  if(!badge) return
  badge.textContent = `Perfekta: ${sorteraFull}`
  if(bump){
    badge.classList.remove('bump')
    void badge.offsetWidth      // tvinga reflow så animationen kan köras om
    badge.classList.add('bump')
  }
}

function showSorteraPraise(text, tone){
  const p = el('sorteraPraise')
  if(!p) return
  p.textContent = text
  p.classList.remove('hidden')
  p.classList.toggle('gold', tone === 'gold')
  p.classList.remove('in')
  void p.offsetWidth
  p.classList.add('in')
  if(sorteraPraiseTimer) clearTimeout(sorteraPraiseTimer)
  sorteraPraiseTimer = setTimeout(hideSorteraPraise, SORTERA_PRAISE_MS)
}

function hideSorteraPraise(){
  const p = el('sorteraPraise')
  if(p){ p.classList.add('hidden'); p.classList.remove('in', 'gold') }
  sorteraPraiseTimer = null
}

// Korta, självgenererade toner via den delade playTone (app.js) – aldrig
// externa ljudfiler, och alltid styrda av "Ljudeffekter"-bocken.
function playSorteraTone(kind){
  if(typeof playTone !== 'function') return
  if(kind === 'place') playTone(392)
  else if(kind === 'lift') playTone(294)
  else if(kind === 'right') playTone(streakTone(sorteraStreak + 1))
  else if(kind === 'wrong') playTone(196, true)
  else if(kind === 'praise') playTone([523.25, 659.25, 784])
  else if(kind === 'end') playTone([523.25, 659.25, 784, 1046.5])
}

// ============================================================================
// Slutet (§13.1 punkt 5)
// ============================================================================
function animateSorteraRing(pct){
  const label = el('sorteraRingPct')
  if(label) label.textContent = pct + ' %'
  const ring = el('sorteraRingProgress')
  if(!ring) return
  const clamped = Math.max(0, Math.min(100, pct))
  const offset = GM_RING_CIRCUMFERENCE * (1 - clamped / 100)
  ring.style.strokeDashoffset = String(GM_RING_CIRCUMFERENCE)
  requestAnimationFrame(() => { ring.style.strokeDashoffset = String(offset) })
}

// Personbästa i SAMMA ämne räknas ur den egna listan FÖRE det nya resultatet
// sparas – annars slår resultatet alltid sitt eget rekord.
function sorteraPriorBest(topic){
  const tidigare = getSorteraScores().filter(s => s.topic === topic && s.total > 0)
  if(!tidigare.length) return null
  return Math.max(...tidigare.map(s => s.full / s.total))
}

function renderSorteraMissed(){
  const wrap = el('sorteraMissedWrap')
  const list = el('sorteraMissed')
  const more = el('sorteraMissedMore')
  if(!wrap || !list) return
  list.innerHTML = ''
  if(!sorteraMissed.length){ wrap.classList.add('hidden'); return }
  wrap.classList.remove('hidden')
  sorteraMissed.slice(0, SORTERA_MISSED_SHOWN).forEach(m => {
    const li = document.createElement('li')
    const q = document.createElement('span')
    q.className = 'sm-q'
    q.textContent = m.prompt
    const a = document.createElement('span')
    a.className = 'sm-a'
    a.textContent = m.ratt.join(' → ')
    li.append(q, a)
    list.appendChild(li)
  })
  const rest = sorteraMissed.length - SORTERA_MISSED_SHOWN
  if(more){
    more.classList.toggle('hidden', rest <= 0)
    if(rest > 0) more.textContent = `… och ${rest} till.`
  }
}

function finishSortera(){
  if(!sorteraRunning) return
  sorteraRunning = false
  clearSorteraRevealTimers()
  if(sorteraPraiseTimer){ clearTimeout(sorteraPraiseTimer); sorteraPraiseTimer = null }
  hideSorteraPraise()

  const durationMs = Math.max(0, Date.now() - sorteraStartTime)
  const total = sorteraSet.length
  const pct = total ? Math.round((sorteraFull / total) * 100) : 0
  const mojliga = total * SORTERA_SLOTS
  const placeringPct = mojliga ? Math.round((sorteraPlacements / mojliga) * 100) : 0
  const forbattring = sorteraPriorBest(sorteraTopic)

  el('sorteraPlay').classList.add('hidden')
  el('sorteraFooter').classList.add('hidden')
  el('sorteraFinished').classList.remove('hidden')

  el('sorteraDoneText').textContent =
    `Klart! ${sorteraFull} av ${total} ${total === 1 ? 'ordning' : 'ordningar'} helt rätt.`

  // Nyckeltal utöver poängen: delpoängen (visar hur nära man var), tiden och
  // den längsta sviten. Bara det som faktiskt hände.
  const nyckeltal = [`🧩 ${placeringPct} % rätta placeringar`]
  if(durationMs > 0) nyckeltal.push(`⏱ ${formatDuration(durationMs)}`)
  if(sorteraBestStreak > 1) nyckeltal.push(`🎯 ${sorteraBestStreak} perfekta i rad som mest`)
  if(sorteraFull === total && total > 0) nyckeltal.push('✨ felfritt')
  el('sorteraStatsText').textContent = nyckeltal.join(' · ')

  const badge = el('sorteraRecordBadge')
  const arRekord = total > 0 && sorteraFull > 0 && forbattring !== null && (sorteraFull / total) > forbattring
  if(badge){
    badge.classList.toggle('hidden', !arRekord)
    if(arRekord) badge.textContent = `🏆 Nytt rekord i ${sorteraAmnesnamn(sorteraTopic)}!`
  }

  animateSorteraRing(pct)
  renderSorteraMissed()
  playSorteraTone('end')
  hapticPulse([18, 60, 18])

  try{ saveSorteraScore(durationMs, placeringPct) }
  catch(e){ console.error('saveSorteraScore misslyckades:', e) }

  window.scrollTo({ top: 0 })
  if(typeof fitActiveView === 'function') fitActiveView()
}

function saveSorteraScore(durationMs, placeringPct){
  const scores = getSorteraScores()
  scores.push({
    name: sorteraName,
    topic: sorteraTopic,
    topicLabel: sorteraAmnesnamn(sorteraTopic),
    full: sorteraFull,
    total: sorteraSet.length,
    placements: sorteraPlacements,
    placementPct: placeringPct,
    durationMs,
    date: new Date().toISOString()
  })
  scores.sort((a, b) => new Date(b.date) - new Date(a.date))
  saveSorteraScores(scores.slice(0, 50))
}

// ============================================================================
// Avbryt / avsluta
// ============================================================================
function cancelSortera(){
  if(confirm('Avbryta omgången? Resultatet sparas inte.')){
    sorteraRunning = false
    clearSorteraRevealTimers()
    if(sorteraPraiseTimer){ clearTimeout(sorteraPraiseTimer); sorteraPraiseTimer = null }
    el('sortera').classList.add('hidden')
    el('setup').classList.remove('hidden')
  }
}

function quitSortera(){
  el('sortera').classList.add('hidden')
  el('setup').classList.remove('hidden')
}

// Tillbaka till understartsidan i stället för hela vägen ut: man vill oftast
// köra en till, kanske i det andra ämnet.
function retrySortera(){
  openSorteraStart()
}

// ============================================================================
// Topplistesegmentet (i #highscores)
// ============================================================================
function renderSorteraScores(){
  const ol = el('scoreList-sortera')
  if(!ol) return
  const emptyP = ol.parentElement.querySelector('.hs-empty')
  const andel = s => (s.total > 0 ? s.full / s.total : 0)
  const list = [...getSorteraScores()].sort((a, b) => {
    if(andel(b) !== andel(a)) return andel(b) - andel(a)
    if((b.placementPct || 0) !== (a.placementPct || 0)) return (b.placementPct || 0) - (a.placementPct || 0)
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
    const pct = s.total ? Math.round((s.full / s.total) * 100) : 0
    ol.appendChild((() => {
      const li = document.createElement('li')
      li.className = 'score-row'
      li.append(
        mk('sr-rank', (i + 1) + '.'),
        mk('sr-name', s.name),
        mk('sr-topic', s.topicLabel || sorteraAmnesnamn(s.topic)),
        mk('sr-score sr-lead', `${s.full}/${s.total}`),
        mk(pct < 75 ? 'sr-pct weak' : 'sr-pct', `${pct} %`),
        mk('sr-time', `🧩 ${s.placementPct || 0} %`),
        mk('sr-date', new Date(s.date).toLocaleDateString('sv-SE'))
      )
      return li
    })())
  })
}

function exportSorteraScores(){
  const scores = getSorteraScores()
  if(!scores.length){
    alert('Det finns inga Sortera-resultat att exportera än.')
    return
  }
  downloadJsonBlob({
    type: SORTERA_EXPORT_TYPE,
    version: 1,
    exported: new Date().toISOString(),
    scores
  }, `anatomiquiz-sortera-${new Date().toISOString().slice(0, 10)}`)
}

function sorteraScoreSignature(s){ return [s.date, s.name, s.topic, s.full, s.total].join('|') }

function handleImportSorteraScores(ev){
  const f = ev.target.files && ev.target.files[0]
  if(!f) return
  const reader = new FileReader()
  reader.onload = () => {
    try{
      const parsed = JSON.parse(reader.result)
      const incoming = Array.isArray(parsed) ? parsed
        : (parsed && parsed.type === SORTERA_EXPORT_TYPE && Array.isArray(parsed.scores)) ? parsed.scores
        : null
      if(!incoming){ alert('Fel format: filen ser inte ut som en exporterad fil från Sortera.'); return }
      const merged = getSorteraScores()
      const seen = new Set(merged.map(sorteraScoreSignature))
      let added = 0, skipped = 0
      incoming.forEach(s => {
        if(!s || typeof s.date !== 'string' || typeof s.full !== 'number'){ skipped++; return }
        const sig = sorteraScoreSignature(s)
        if(seen.has(sig)){ skipped++; return }
        seen.add(sig); merged.push(s); added++
      })
      merged.sort((a, b) => new Date(b.date) - new Date(a.date))
      saveSorteraScores(merged.slice(0, 50))
      renderSorteraScores()
      alert(`Import klar. Tillagda resultat: ${added}. Hoppade över: ${skipped}.`)
    }catch(e){ alert('Kunde inte läsa JSON: ' + e.message) }
  }
  reader.readAsText(f, 'utf-8')
  ev.target.value = ''
}

function clearSorteraScoresFlow(){
  if(!confirm('Är du säker? Alla Sortera-resultat raderas permanent.')) return
  localStorage.removeItem(SORTERA_SCORES_KEY)
  sorteraMemoryScores = null
  renderSorteraScores()
}

// ============================================================================
// Uppkoppling (egen DOMContentLoaded, oberoende av app.js:s init)
// ============================================================================
// Knappen hänger INTE på quizets ämnesval – läget har ett eget arkiv. Den
// skuggas bara om arkivet inte gick att läsa, och står kvar aktiv medan det
// laddas (klicket laddar det i så fall).
function updateSorteraButton(){
  const b = el('startSorteraBtn')
  if(b) b.disabled = sorteraArkiv !== null && !sorteraArkiv.fragor.length
}

// Tangentbord på dator: 1–5 placerar nästa lediga bricka, Backspace tar
// tillbaka den senast placerade, Enter rättar/går vidare.
function onSorteraKey(ev){
  const sec = el('sortera')
  if(!sec || sec.classList.contains('hidden')) return
  if(!sorteraRunning) return
  const tag = (document.activeElement && document.activeElement.tagName) || ''
  if(tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

  if(ev.key === 'Enter'){
    const check = el('sorteraCheckBtn')
    if(check && !check.disabled){ ev.preventDefault(); check.click() }
    return
  }
  if(sorteraPhase !== 'placing') return
  if(ev.key === 'Backspace'){
    const senast = sorteraPlaced.reduce((acc, v, i) => (v !== null ? i : acc), -1)
    if(senast >= 0){ ev.preventDefault(); unplaceSorteraSlot(senast) }
    return
  }
  const n = parseInt(ev.key, 10)
  if(!n || n < 1 || n > SORTERA_SLOTS) return
  const btn = el('sorteraBankRow')?.children[n - 1]
  if(btn){ ev.preventDefault(); btn.click() }
}

document.addEventListener('DOMContentLoaded', () => {
  el('startSorteraBtn')?.addEventListener('click', openSorteraStart)
  el('sorteraStartBtn')?.addEventListener('click', startSortera)
  el('sorteraCheckBtn')?.addEventListener('click', checkSorteraOrder)
  el('sorteraCancelBtn')?.addEventListener('click', cancelSortera)
  el('sorteraRetryBtn')?.addEventListener('click', retrySortera)
  el('sorteraQuitBtn')?.addEventListener('click', quitSortera)
  el('sorteraBackBtn')?.addEventListener('click', quitSortera)
  el('exportScores-sortera')?.addEventListener('click', exportSorteraScores)
  const imp = el('importScoresFile-sortera')
  if(imp) imp.addEventListener('change', handleImportSorteraScores)
  el('importScoresBtn-sortera')?.addEventListener('click', () => imp?.click())
  el('clearScores-sortera')?.addEventListener('click', clearSorteraScoresFlow)
  // Förklaringen fälls upp automatiskt första gången, och då krymper
  // fitActiveView() vyn. Utan den här mätningen står vyn kvar nedkrympt när
  // man fäller ihop texten igen.
  el('sorteraIntro')?.addEventListener('toggle', () => {
    if(typeof fitActiveView === 'function') fitActiveView()
  })
  document.addEventListener('keydown', onSorteraKey)
  updateSorteraButton()
})
