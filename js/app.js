// Get path based on topic
function getQuestionsPath(topic) {
  if (topic === 'osteologi') return './data/ben.json'
  if (topic === 'muskler') return './data/muskler.json'
  if (topic === 'skuldran') return './data/skuldran.json'
  if (topic === 'grepp') return './data/grepp.json'
  if (topic === 'ledtyper') return './data/ledtyper.json'
  if (topic === 'handen') return './data/handen.json'
  if (topic === 'medicinsk_terminologi') return './data/medicinsk_terminologi.json'
  if (topic === 'tentaplugg') return './data/tentaplugg.json'
  if (topic === 'neurologi') return './data/neurologi.json'
  if (topic === 'blodomloppet') return './data/blodomloppet.json'
  if (topic === 'studenters_flashcards') return './data/studenters_flashcards.json'
  if (topic === 'muskler_flashcards') return './data/muskler_flashcards.json'
  if (topic === 'moho_flashcards') return './data/moho_flashcards.json'
  if (topic === 'otipm_flashcards') return './data/otipm_flashcards.json'
  if (topic === 'ergonomi') return './data/ergonomi.json'
  if (topic === 'olika_aldrar') return './data/olika_aldrar.json'
  // 'blandade' uses loadQuestionsFromMultiplePaths() instead
  return './data/riktningar.json'
}

// Topics that have Hard difficulty questions
const topicsWithHardQuestions = ['handen', 'muskler', 'any_riktningar', 'blandade']

function updateDifficultyOptions() {
  const topic = el('topic').value
  const difficultySelect = el('difficulty')
  const hardOption = difficultySelect.querySelector('option[value="Hard"]')
  const anyOption = difficultySelect.querySelector('option[value="any"]')

  if (topicsWithHardQuestions.includes(topic)) {
    // This topic has Hard questions - enable both Blandat and Svår
    anyOption.disabled = false
    hardOption.disabled = false
    if (difficultySelect.value !== 'any' && difficultySelect.value !== 'Normal' && difficultySelect.value !== 'Hard') {
      difficultySelect.value = 'any'
    }
  } else {
    // This topic doesn't have Hard questions - only Normal is available
    anyOption.disabled = true
    hardOption.disabled = true
    if (difficultySelect.value !== 'Normal') {
      difficultySelect.value = 'Normal'
    }
  }
}

// NOTE: This app will ensure up to MAX_QUESTIONS questions exist by generating
// placeholders for missing entries. Real questions should be imported later
// into the appropriate data files. Placeholders are non-medical and serve only
// to exercise the UI. Do NOT treat placeholders as factual content.
const MAX_QUESTIONS = 500

// LocalStorage key migration: old prefix 'wiil_' → new prefix based on app name
const OLD_FLAGS_KEY = 'wiil_question_flags'
const NEW_FLAGS_KEY = 'hur_question_flags'
const OLD_SCORES_KEY = 'wiil_highscores'
const NEW_SCORES_KEY = 'hur_highscores'
// Version som är inbakad i DENNA app.js. Jämförs mot färska VERSION-filen så att
// en gammal cachad app.js avslöjar sig själv ("ladda om") i stället för att tyst
// köra föråldrad logik (t.ex. före topplistans säkerhetsnät). Håll i synk med VERSION.
const APP_VERSION = '0.8.19'
// IDs på frågor spelaren senast svarade FEL på (lokalt per webbläsare/enhet).
// Används av "Öva extra på de jag svarar fel på" för att vikta upp dem i quizurvalet.
const WRONG_KEY = 'hur_wrong_questions'
// Permanenta inställningar (namn, valda frågetyper, öva-extra, visa tid).
const SETTINGS_KEY = 'hur_settings'

const el = id => document.getElementById(id)

let allQuestions = []
let quizQuestions = []
let currentIdx = 0
let score = 0
let timerInterval = null
let questionStartTime = 0
let quizTimerOn = false
let quizStartTime = 0

async function loadQuestions(path){
  try {
    const res = await fetch(path)
    if (!res.ok) {
      console.error(`Failed to load questions: ${res.status} ${res.statusText}`)
      allQuestions = []
    } else {
      allQuestions = await res.json()
      console.log(`Loaded ${allQuestions.length} questions from ${path}`)
    }
  } catch(e) {
    console.error(`Error loading questions from ${path}:`, e)
    allQuestions = []
  }
  // Generate placeholders up to MAX_QUESTIONS if needed
  if(allQuestions.length < MAX_QUESTIONS){
    const needed = MAX_QUESTIONS - allQuestions.length
    const startIdx = allQuestions.length + 1
    for(let i=0;i<needed;i++){
      const idx = startIdx + i
      const id = `ph${String(idx).padStart(3,'0')}`
      allQuestions.push({
        id,
        type: 'mc',
        prompt: `Plats för fråga ${idx} (placeholder). Importera riktig fråga senare.`,
        correct: 'Placeholder korrekt svar',
        distractors: ['Placeholder alternativ 1','Placeholder alternativ 2','Placeholder alternativ 3'],
        topic: 'placeholder',
        difficulty: 'easy',
        source: 'placeholder'
      })
    }
  }
}

async function loadQuestionsFromMultiplePaths(paths){
  allQuestions = []
  for(const path of paths){
    try {
      const res = await fetch(path)
      if (!res.ok) {
        console.error(`Failed to load questions: ${res.status} ${res.statusText}`)
      } else {
        const data = await res.json()
        allQuestions = allQuestions.concat(data)
        console.log(`Loaded ${data.length} questions from ${path}`)
      }
    } catch(e) {
      console.error(`Error loading questions from ${path}:`, e)
    }
  }
  console.log(`Total loaded: ${allQuestions.length} questions from all paths`)
}

// Question flags persisted in localStorage: { [id]: { reported: bool, excluded: bool } }
function loadFlags(){
  try{
    // Prefer new key; if missing but old key exists, migrate it.
    const rawNew = localStorage.getItem(NEW_FLAGS_KEY)
    const oldRaw = localStorage.getItem(OLD_FLAGS_KEY)
    const raw = rawNew || oldRaw
    // Parsa färdigt innan skrivning; migrering/städning isoleras så ett skrivfel
    // (full localStorage / privat läge) aldrig kastar bort redan inlästa flaggor.
    const parsed = JSON.parse(raw || '{}')
    if(oldRaw){
      try{
        if(!rawNew) localStorage.setItem(NEW_FLAGS_KEY, oldRaw)
        localStorage.removeItem(OLD_FLAGS_KEY)
      }catch(_){ /* skrivning misslyckades — parsed har redan datan */ }
    }
    return parsed
  }catch(e){ return {} }
}

function saveFlags(flags){
  // Write to new key. Keep old key untouched to avoid surprising data loss.
  localStorage.setItem(NEW_FLAGS_KEY, JSON.stringify(flags))
}

// Fallback i minnet om localStorage inte går att skriva till
// (t.ex. privat läge i Safari/Chrome på iPhone, där setItem kastar fel).
// Då sparas topplistan för den pågående sessionen istället för att tyst försvinna.
let memoryScores = null
let storageWarned = false

function warnStorageUnavailable(){
  if(storageWarned) return
  storageWarned = true
  alert('Obs: din webbläsare tillåter inte att resultat sparas permanent (vanligt i privat läge på iPhone). Topplistan visas så länge sidan är öppen, men försvinner när du laddar om.')
}

function getScores(){
  if(memoryScores) return memoryScores
  try{
    const rawNew = localStorage.getItem(NEW_SCORES_KEY)
    const oldRaw = localStorage.getItem(OLD_SCORES_KEY)
    const raw = rawNew || oldRaw
    // Parsa datan FÄRDIGT innan någon skrivning. Migrering/städning av den gamla
    // nyckeln görs i ett EGET try/catch: en misslyckad skrivning (full localStorage
    // på delad origin, privat läge) får ALDRIG kasta oss till catch-grenen och
    // returnera tomt fast highscoren redan är inläst. Det var precis den buggen som
    // fick topplistan att se tom ut fast datan låg kvar i localStorage.
    const parsed = JSON.parse(raw || '[]')
    if(oldRaw){
      try{
        if(!rawNew) localStorage.setItem(NEW_SCORES_KEY, oldRaw)
        localStorage.removeItem(OLD_SCORES_KEY)
      }catch(_){ /* skrivning misslyckades — strunt i det, parsed har redan datan */ }
    }
    return parsed
  }catch(e){ return memoryScores || [] }
}

function saveScores(scores){
  try{
    localStorage.setItem(NEW_SCORES_KEY, JSON.stringify(scores))
    memoryScores = null
  }catch(e){
    // localStorage otillgängligt (privat läge/kvot) — behåll i minnet för sessionen
    memoryScores = scores
    warnStorageUnavailable()
  }
}

// "Öva extra på de jag svarar fel på": varje felsvarad fråga får en "skuld"
// = antal garanterade återkomster. Lagras i localStorage som { id: skuld } och
// överlever "Spela igen", omladdning och att man stänger/öppnar webbläsaren.
// Vid varje ny vända (när läget är på) tvingas alla frågor med skuld > 0 in i
// urvalet (garanterat, inte bara vägt upp), och deras skuld minskar med 1 när
// de kommer med. Fel svar igen lägger på mer skuld (+2, tak 6) så att frågan
// återkommer ännu fler gånger; rätt svar nollar skulden helt.
const WRONG_REVIEW_ADD = 2   // garanterar återkomst i minst de två nästa vändorna
const WRONG_REVIEW_MAX = 6   // tak så att en envis fråga inte växer obegränsat
let wrongQuestions = null

function loadWrong(){
  if(wrongQuestions) return wrongQuestions
  wrongQuestions = new Map()
  try{
    const raw = JSON.parse(localStorage.getItem(WRONG_KEY) || '{}')
    if(Array.isArray(raw)){
      // Gammalt format (lista med id) → ge varje fråga startskuld.
      raw.forEach(id => wrongQuestions.set(id, WRONG_REVIEW_ADD))
    } else if(raw && typeof raw === 'object'){
      Object.entries(raw).forEach(([id, debt]) => {
        const d = Number(debt) || 0
        if(d > 0) wrongQuestions.set(id, d)
      })
    }
  }catch(e){ wrongQuestions = new Map() }
  return wrongQuestions
}

function saveWrong(){
  try{
    const obj = {}
    loadWrong().forEach((debt, id) => { if(debt > 0) obj[id] = debt })
    localStorage.setItem(WRONG_KEY, JSON.stringify(obj))
  }catch(e){}
}

function markWrong(id){
  const m = loadWrong()
  m.set(id, Math.min((m.get(id) || 0) + WRONG_REVIEW_ADD, WRONG_REVIEW_MAX))
  saveWrong()
}

function markCorrect(id){
  const m = loadWrong()
  if(m.has(id)){ m.delete(id); saveWrong() }
}

// Förbruka en garanterad återkomst (frågan kom med i en vända).
function consumeReview(id){
  const m = loadWrong()
  const d = (m.get(id) || 0) - 1
  if(d > 0) m.set(id, d); else m.delete(id)
  saveWrong()
}

function isExcluded(q){
  const flags = loadFlags()
  return !!(flags[q.id] && flags[q.id].excluded)
}

function setReported(id, val=true){
  const flags = loadFlags();
  if(!flags[id]) flags[id]={}
  flags[id].reported = !!val
  saveFlags(flags)
}

function toggleExcluded(id){
  const flags = loadFlags();
  if(!flags[id]) flags[id]={}
  flags[id].excluded = !flags[id].excluded
  saveFlags(flags)
}

function getSecureRandom() {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return arr[0] / (0xffffffff + 1);
}

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(getSecureRandom() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function sampleWithoutReplacement(arr, n){
  if(n<=0) return []
  const copy = arr.slice()
  shuffle(copy)
  return copy.slice(0, Math.min(n, copy.length))
}

async function startQuiz(allowedTypes){
  // Vilka frågetyper som får vara med (delmängd av mc/tf). Saknas argument
  // (t.ex. "Spela igen") används de sparade valen, annars båda.
  if(!allowedTypes || !allowedTypes.length){
    allowedTypes = getSelectedTypes().filter(t => t === 'mc' || t === 'tf')
    if(!allowedTypes.length) allowedTypes = ['mc','tf']
  }
  const name = el('playerName').value.trim() || 'Spelare'
  const num = parseInt(el('numQuestions').value,10)
  quizTimerOn = !!el('timerEnabled')?.checked
  const topic = el('topic').value
  const difficulty = el('difficulty').value
  const practiceWrong = !!el('practiceWrong')?.checked

  // Load questions based on topic
  if(topic === 'blandade'){
    // Slumpade frågor = bara quiz-ämnen (MC/TF). Rena flashcard-ämnen (FC) tas
    // aldrig in, så slumpade frågor innehåller aldrig flashcards.
    const paths = [...new Set(
      Array.from(el('topic').options)
        .filter(o => {
          if(o.disabled || o.value === 'blandade') return false
          const t = typeTagOf(o.textContent)
          return t.mc || t.tf
        })
        .map(o => getQuestionsPath(o.value))
    )]
    await loadQuestionsFromMultiplePaths(paths)
  } else {
    const qsPath = getQuestionsPath(topic)
    await loadQuestions(qsPath)
  }

  const flags = loadFlags()

  // Debug info
  const realQuestions = allQuestions.filter(q => q.source !== 'placeholder')
  const placeholders = allQuestions.filter(q => q.source === 'placeholder')
  console.log(`Total frågor: ${allQuestions.length}, Riktiga: ${realQuestions.length}, Placeholders: ${placeholders.length}`)

  // Exclude questions that are explicitly marked as placeholders so they
  // are not used in quizzes until replaced with real, fact-checked content.
  // Filter by difficulty: 'any' (all), 'Normal' (normal questions), 'Hard' (difficult questions)
  const filtered = allQuestions.filter(q=> {
    const isPlaceholderSource = !!(q.source && String(q.source).toLowerCase()==='placeholder')
    const isPlaceholderId = /^ph\d{3}$/.test(String(q.id))
    if(isPlaceholderSource || isPlaceholderId) return false

    // Frågetypsfilter: bara valda typer (mc/tf). Extra säkerhetsnät — slumpade
    // frågor laddar redan bara MC/TF-ämnen, så inga fc-kort kan hamna i ett quiz.
    if(!allowedTypes.includes(q.type)) return false

    // Handle topic filtering
    let topicMatch = false
    if(topic === 'any') {
      topicMatch = true
    } else if(topic === 'any_riktningar') {
      topicMatch = q.topic === 'riktningar'
    } else if(topic === 'osteologi') {
      topicMatch = q.topic.startsWith('osteologi_')
    } else if(topic === 'muskler') {
      topicMatch = q.topic.startsWith('muskler_')
    } else if(topic === 'skuldran') {
      topicMatch = q.topic.startsWith('skuldra_')
    } else if(topic === 'grepp') {
      topicMatch = q.topic.startsWith('grepp_')
    } else if(topic === 'ledtyper') {
      topicMatch = q.topic.startsWith('ledtyper_')
    } else if(topic === 'handen') {
      topicMatch = q.topic.startsWith('handen_')
    } else if(topic === 'tentaplugg') {
      topicMatch = q.topic.startsWith('studier_')
    } else if(topic === 'neurologi') {
      topicMatch = q.topic.startsWith('nervsystemet_')
    } else if(topic === 'blodomloppet') {
      topicMatch = q.topic.startsWith('blodomloppet_')
    } else if(topic === 'blandade') {
      // Blandade questions include all topics
      topicMatch = true
    } else {
      topicMatch = q.topic === topic
    }

    // Handle difficulty filtering
    let difficultyMatch = true
    if(difficulty === 'Normal') {
      difficultyMatch = q.difficulty === 'Normal'
    } else if(difficulty === 'Hard') {
      difficultyMatch = q.difficulty === 'Hard'
    }
    // 'any' means all difficulties

    return topicMatch && difficultyMatch && !(flags[q.id] && flags[q.id].excluded)
  })
  if(filtered.length===0){
    const msg = realQuestions.length === 0
      ? 'PROBLEM: Inga frågor laddade! Checka browser console (F12).'
      : 'Inga frågor matchar urvalet. Prova en annan kombination.'
    alert(msg)
    return
  }

  // Ensure full randomization: shuffle filtered pool first
  const shuffledFiltered = shuffle(filtered.slice())
  const totalNeeded = Math.min(num, filtered.length)

  // Öva-extra-läget: tvinga in alla frågor med kvarvarande skuld (garanterad
  // återkomst, inte bara uppviktad), högst skuld först. Klarar man inte av alla
  // på en vända får de som inte ryms vänta till nästa — skulden ligger kvar.
  let forced = []
  if(practiceWrong){
    const wrongMap = loadWrong()
    forced = shuffledFiltered
      .filter(q => (wrongMap.get(q.id) || 0) > 0)
      .sort((a,b) => (wrongMap.get(b.id) || 0) - (wrongMap.get(a.id) || 0))
      .slice(0, totalNeeded)
  }
  const forcedIds = new Set(forced.map(q => q.id))

  // Fyll resten av vändan med vanlig slump, behåll tf-taket (~10 %) över helheten.
  const fillCount = totalNeeded - forced.length
  const remainingPool = shuffledFiltered.filter(q => !forcedIds.has(q.id))
  // TF-tak på ~10 % gäller bara när MC också är valt; väljer man enbart TF
  // ska hela quizet få vara TF (annars skulle taket svälta urvalet).
  const maxTf = allowedTypes.includes('mc') ? Math.floor(num * 0.1) : num
  const forcedTf = forced.filter(q => q.type === 'tf').length
  const tfPool = remainingPool.filter(q => q.type === 'tf')
  const mcPool = remainingPool.filter(q => q.type === 'mc' && (1 + (q.distractors?.length||0)) >= 3 && (1 + (q.distractors?.length||0)) <= 5)

  const tfFill = sampleWithoutReplacement(tfPool, Math.max(0, Math.min(maxTf - forcedTf, fillCount)))
  let fill = sampleWithoutReplacement(mcPool, fillCount - tfFill.length).concat(tfFill)
  if(fill.length < fillCount){
    const used = new Set([...forcedIds, ...fill.map(q => q.id)])
    const rest = remainingPool.filter(q => !used.has(q.id))
    fill = fill.concat(sampleWithoutReplacement(rest, fillCount - fill.length))
  }

  quizQuestions = shuffle([...forced, ...fill]).slice(0, totalNeeded)

  // Varje forcerad fråga som kom med förbrukar en garanterad återkomst.
  if(practiceWrong) forced.forEach(q => consumeReview(q.id))
  currentIdx = 0; score=0
  // Mät alltid tiden (oavsett om frågetimern är på) för statistik per ämne.
  quizStartTime = Date.now()
  el('playerLabel').textContent = `${name}`
  el('setup').classList.add('hidden')
  el('highscores').classList.add('hidden')
  el('result').classList.add('hidden')
  el('quiz').classList.remove('hidden')
  el('nextBtn').disabled = true
  el('timer').textContent = ''
  showQuestion()
}

function showQuestion(){
  clearTimer()
  const q = quizQuestions[currentIdx]
  el('questionArea').textContent = q.prompt
  el('answers').innerHTML = ''
  const options = shuffle([q.correct, ...q.distractors])
  options.forEach((opt, i)=>{
    const b = document.createElement('button')
    b.className = 'answer-btn'
    b.type = 'button'
    b.textContent = opt
    b.addEventListener('click', ()=>selectAnswer(b, opt, q.correct))
    el('answers').appendChild(b)
  })
  el('progress').textContent = `Fråga ${currentIdx+1}/${quizQuestions.length} — Poäng: ${score}`
  questionStartTime = Date.now()
  if(quizTimerOn) startCountUp(); else el('timer').textContent = ''
  // focus first answer for keyboard users
  setTimeout(()=>{ const first = el('answers').querySelector('button'); if(first) first.focus() }, 50)
}

// Markera en svarsknapp som rätt/fel med färg + ✓/✗ + dold skärmläsartext,
// så att utfallet inte förmedlas med enbart färg (WCAG 1.4.1).
function markAnswerBtn(b, ok){
  b.classList.add(ok ? 'correct' : 'wrong')
  const icon = document.createElement('span')
  icon.className = 'answer-mark'
  icon.setAttribute('aria-hidden','true')
  icon.textContent = ok ? '✓' : '✗'
  const sr = document.createElement('span')
  sr.className = 'sr-only'
  sr.textContent = ok ? ' — rätt svar' : ' — fel svar'
  b.append(icon, sr)
}

function selectAnswer(btn, selected, correct){
  Array.from(el('answers').children).forEach(b=>{b.disabled=true; b.setAttribute('aria-disabled','true')})
  const q = quizQuestions[currentIdx]
  if(selected===correct){
    markAnswerBtn(btn, true); score++
    // Rätt svar: frågan behöver inte längre extra övning
    if(q) markCorrect(q.id)
  } else {
    // Hitta rätt-knappen FÖRE markeringen — ✓/✗-texten ändrar textContent
    const correctBtn = Array.from(el('answers').children).find(b=>b.textContent===correct)
    markAnswerBtn(btn, false)
    // Fel svar: vägs upp i framtida quiz om "öva extra"-läget är på
    if(q) markWrong(q.id)
    if(correctBtn) markAnswerBtn(correctBtn, true)
  }
  el('nextBtn').disabled = false
  el('nextBtn').setAttribute('aria-disabled','false')
  clearTimer()
  if(quizTimerOn){
    const secs = (Date.now()-questionStartTime)/1000
    const t = document.createElement('span')
    t.className = 'answer-time'
    t.textContent = fmtSec(secs)
    btn.appendChild(t)
    el('timer').textContent = 'Tid: ' + fmtSec(secs)
  }
}

function nextQuestion(){
  currentIdx++
  if(currentIdx>=quizQuestions.length){ finishQuiz(); return }
  el('nextBtn').disabled = true
  showQuestion()
}

// Formatera sekunder med en decimal och svenskt kommatecken, t.ex. "8,4 s".
function fmtSec(s){ return s.toFixed(1).replace('.', ',') + ' s' }

// Räknar UPP tiden från att frågan visades (ingen tidsgräns, ingen auto-fail).
function startCountUp(){
  el('timer').classList.remove('warning')
  el('timer').textContent = 'Tid: 0 s'
  timerInterval = setInterval(()=>{
    const s = Math.floor((Date.now()-questionStartTime)/1000)
    el('timer').textContent = `Tid: ${s} s`
  },500)
}

function clearTimer(){ if(timerInterval){clearInterval(timerInterval);timerInterval=null} }

function finishQuiz(){
  el('quiz').classList.add('hidden')
  el('result').classList.remove('hidden')
  // Resultatet sparas automatiskt i topplistan när quizet är klart
  saveScore()
  el('resultText').textContent = `Du fick ${score} av ${quizQuestions.length} rätt. Resultatet sparades i topplistan.`
  el('resultText').setAttribute('aria-live','polite')
}

// Hämta läsbart ämnesnamn från <select>-alternativet, t.ex. 'osteologi' → 'Ben'
function topicLabelFor(value){
  const opt = Array.from(el('topic').options).find(o => o.value === value)
  return (opt && opt.textContent.trim()) || value || 'Okänt ämne'
}

function saveScore(){
  const name = el('playerName').value.trim() || 'Spelare'
  const topic = el('topic').value
  const scores = getScores()
  // Total speltid i ms (från quizstart till sista svaret). 0 om av någon anledning ej satt.
  const durationMs = quizStartTime ? Date.now() - quizStartTime : 0
  scores.push({
    name,
    score,
    total: quizQuestions.length,
    topic,
    topicLabel: topicLabelFor(topic),
    durationMs,
    date: new Date().toISOString()
  })
  // Senaste först, så att de 50 SENASTE resultaten behålls (inte de 50 högsta).
  scores.sort((a,b)=> new Date(b.date) - new Date(a.date))
  saveScores(scores.slice(0,50))
}

// Fyll filtret med ett alternativ per förekommande antal frågor, så att resultat
// med olika frågeantal inte blandas i samma topplista. "Alla" visar allt.
function buildScoreFilter(){
  const sel = el('scoreFilter')
  if(!sel) return
  const prev = sel.value
  const totals = [...new Set(getScores().map(s=>s.total))].sort((a,b)=>a-b)
  sel.innerHTML = ''
  const allOpt = document.createElement('option')
  allOpt.value = 'all'; allOpt.textContent = 'Alla antal frågor'
  sel.appendChild(allOpt)
  totals.forEach(t=>{
    const o = document.createElement('option')
    o.value = String(t); o.textContent = `${t} frågor`
    sel.appendChild(o)
  })
  if(prev && Array.from(sel.options).some(o=>o.value===prev)) sel.value = prev
}

// Formaterar total speltid (ms) som m:ss, t.ex. 42000 → "0:42", 122000 → "2:02".
// Äldre resultat utan sparad tid (durationMs 0) visas som "–".
function formatDuration(ms){
  if(!(ms > 0)) return '–'
  const total = Math.round(ms / 1000)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function renderScoreList(){
  const sel = el('scoreFilter')
  // Tomt/ogiltigt filtervärde behandlas som "alla" så att data aldrig döljs av misstag.
  const filterVal = (sel && sel.value) ? sel.value : 'all'
  const scores = getScores()
  let list = filterVal === 'all'
    ? scores
    : scores.filter(s => s.total === parseInt(filterVal,10))
  // Säkerhetsnät: finns det resultat men filtret gav tomt, visa alla i stället för "tomt".
  if(list.length === 0 && scores.length > 0) list = scores
  // Visa de 20 SENASTE resultaten (nyast först), oberoende av lagringsordning.
  list = [...list].sort((a,b)=> new Date(b.date) - new Date(a.date)).slice(0,20)
  const ol = el('scoreList'); ol.innerHTML=''

  if(list.length === 0){
    const li = document.createElement('li')
    li.textContent = 'Inga resultat än.'
    ol.appendChild(li)
    return
  }
  const mk = (cls, text) => { const sp = document.createElement('span'); sp.className = cls; sp.textContent = text; return sp }
  list.forEach((s, i)=>{
    const li = document.createElement('li')
    li.className = 'score-row'
    const pct = Math.round((s.score/s.total)*100)
    // Endast i highscore: korta bort förkortningsparentesen, t.ex. "Handen (MC+TF)" → "Handen".
    const label = (s.topicLabel || 'Okänt ämne').replace(/\s*\([^)]*\)\s*$/, '')
    const d = new Date(s.date)
    const dateStr = d.toLocaleDateString('sv-SE') + ' ' + d.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })
    // Procenttexten färgas grönt vid klarat (≥ 75 %) och rött vid ej klarat
    // (< 75 %), samma tröskel och röda ton som statistikens svaga ämnen.
    li.append(
      mk('sr-rank', (i+1) + '.'),
      mk('sr-name', s.name),
      mk('sr-topic', label),
      mk('sr-score', `${s.score}/${s.total}`),
      mk(pct < 75 ? 'sr-pct weak' : 'sr-pct', `${pct}%`),
      mk('sr-time', formatDuration(s.durationMs)),
      mk('sr-date', dateStr)
    )
    ol.appendChild(li)
  })
}

// Bästa resultat: topp 10 rankade på procent (högst först). Vid samma procent
// (avrundad, dvs det som visas) rankar det med snabbast speltid över. Resultat
// utan sparad tid (durationMs 0) hamnar sist vid lika procent. Följer samma
// frågeantals-filter som "Senaste resultaten".
function renderBestList(){
  const sel = el('scoreFilter')
  const filterVal = (sel && sel.value) ? sel.value : 'all'
  const scores = getScores()
  let list = filterVal === 'all'
    ? scores
    : scores.filter(s => s.total === parseInt(filterVal,10))
  // Säkerhetsnät: finns det resultat men filtret gav tomt, visa alla i stället för "tomt".
  if(list.length === 0 && scores.length > 0) list = scores
  // Tid saknas (durationMs 0) behandlas som "oändligt långsam" så att resultat
  // med uppmätt tid alltid rankar över ett otimat resultat vid samma procent.
  const timeKey = s => (s.durationMs > 0 ? s.durationMs : Infinity)
  list = [...list].sort((a,b)=>{
    const pa = Math.round((a.score/a.total)*100)
    const pb = Math.round((b.score/b.total)*100)
    if(pb !== pa) return pb - pa
    return timeKey(a) - timeKey(b)
  }).slice(0,10)
  const ol = el('bestList'); ol.innerHTML=''
  if(list.length === 0){
    const li = document.createElement('li')
    li.textContent = 'Inga resultat än.'
    ol.appendChild(li)
    return
  }
  const mk = (cls, text) => { const sp = document.createElement('span'); sp.className = cls; sp.textContent = text; return sp }
  list.forEach((s, i)=>{
    const li = document.createElement('li')
    li.className = 'score-row'
    const pct = Math.round((s.score/s.total)*100)
    const label = (s.topicLabel || 'Okänt ämne').replace(/\s*\([^)]*\)\s*$/, '')
    const d = new Date(s.date)
    const dateStr = d.toLocaleDateString('sv-SE') + ' ' + d.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })
    // Procenttexten färgas grönt vid klarat (≥ 75 %) och rött vid ej klarat
    // (< 75 %), samma som i "Senaste resultaten".
    li.append(
      mk('sr-rank', (i+1) + '.'),
      mk('sr-name', s.name),
      mk('sr-topic', label),
      mk('sr-score', `${s.score}/${s.total}`),
      mk(pct < 75 ? 'sr-pct weak' : 'sr-pct', `${pct}%`),
      mk('sr-time', formatDuration(s.durationMs)),
      mk('sr-date', dateStr)
    )
    ol.appendChild(li)
  })
}

// Statistik per ämne: antal genomförda quiz och genomsnittligt resultat i procent.
function renderStats(){
  const scores = getScores()
  const byTopic = {}
  scores.forEach(s=>{
    // Visa bara ämnesnamnet utan förkortningsparentes, t.ex. "Lårben (femur)"
    // → "Lårben", precis som topplistorna. Nyckeln blir samma så att resultat
    // med och utan parentes grupperas ihop.
    const key = (s.topicLabel || 'Okänt ämne').replace(/\s*\([^)]*\)\s*$/, '')
    if(!byTopic[key]) byTopic[key] = { count:0, pctSum:0, timeMs:0, timedQuestions:0 }
    byTopic[key].count++
    byTopic[key].pctSum += (s.score/s.total)*100
    // Genomsnittlig tid/fråga räknas bara på resultat som har en sparad speltid.
    if(s.durationMs > 0){
      byTopic[key].timeMs += s.durationMs
      byTopic[key].timedQuestions += s.total
    }
  })
  const ul = el('statsList'); ul.innerHTML=''
  // Sortera mest gjorda ämnet överst. Vid lika antal försök rankar det med
  // högst snitt-% (pctSum/count) över.
  const entries = Object.entries(byTopic).sort((a,b)=>{
    if(b[1].count !== a[1].count) return b[1].count - a[1].count
    return (b[1].pctSum / b[1].count) - (a[1].pctSum / a[1].count)
  })
  if(entries.length === 0){
    const li = document.createElement('li')
    li.textContent = 'Ingen statistik än.'
    ul.appendChild(li)
    return
  }
  entries.forEach(([label, d])=>{
    const avg = Math.round(d.pctSum / d.count)
    let timeText = ''
    if(d.timedQuestions > 0){
      const secPerQ = (d.timeMs / d.timedQuestions) / 1000
      const tPerQ = secPerQ >= 10 ? Math.round(secPerQ) : secPerQ.toFixed(1)
      timeText = `${tPerQ} s/fr`
    }
    const li = document.createElement('li')
    // Svaga ämnen (< 75 % snitt) markeras rött (stapel + procent) som en
    // varningssignal om vad som behöver pluggas mer. Tröskeln matchar samma
    // röda ton som fel svar (--error).
    li.className = avg < 75 ? 'stat-row weak' : 'stat-row'
    // Kolumner: ämne | antal försök | stapel+procent | tid/fråga.
    // Stapelns bredd speglar snittprocenten; allt textinnehåll är riktiga
    // noder så att skärmläsare läser ämne, försök, procent och tid.
    const topic = document.createElement('span')
    topic.className = 'st-topic'; topic.textContent = label
    const count = document.createElement('span')
    count.className = 'st-count'; count.textContent = `${d.count} försök`
    const bar = document.createElement('span')
    bar.className = 'st-bar'; bar.setAttribute('aria-hidden', 'true')
    const fill = document.createElement('span')
    fill.className = 'st-bar-fill'; fill.style.width = `${avg}%`
    bar.appendChild(fill)
    const pct = document.createElement('span')
    pct.className = 'st-pct'; pct.textContent = `${avg}%`
    const time = document.createElement('span')
    time.className = 'st-time'; time.textContent = timeText
    li.append(topic, count, bar, pct, time)
    ul.appendChild(li)
  })
}

function showHighscores(){
  el('setup').classList.add('hidden')
  el('quiz').classList.add('hidden')
  el('result').classList.add('hidden')
  el('highscores').classList.remove('hidden')
  buildScoreFilter()
  renderScoreList()
  renderStats()
  renderBestList()
  // focus the list for keyboard users
  setTimeout(()=>{ el('scoreList').focus?.() },50)
}

function clearScores(){
  // Remove both keys to ensure old and new keys are cleared
  localStorage.removeItem(NEW_SCORES_KEY)
  localStorage.removeItem(OLD_SCORES_KEY)
  showHighscores()
}

// Render management UI for up to MAX_QUESTIONS questions
function renderManage(){
  const container = el('manageList')
  container.innerHTML = ''
  const flags = loadFlags()
  const list = document.createElement('div')
  list.className = 'manage-grid'
  allQuestions.slice(0, MAX_QUESTIONS).forEach(q=>{
    const row = document.createElement('div')
    row.className = 'manage-row'
    const title = document.createElement('div')
    title.className = 'manage-title'
    title.textContent = `[${q.id}] ${q.prompt}`
    // Visual badge for placeholders
    const isPlaceholder = (q.source && String(q.source).toLowerCase()==='placeholder') || /^ph\d{3}$/.test(String(q.id))
    if(isPlaceholder){
      const badge = document.createElement('span')
      badge.className = 'badge placeholder'
      badge.textContent = 'Platshållare'
      title.appendChild(badge)
    }
    const controls = document.createElement('div')
    controls.className = 'manage-controls'
    const rep = document.createElement('label')
    const repCb = document.createElement('input')
    repCb.type='checkbox'
    repCb.checked = !!(flags[q.id] && flags[q.id].reported)
    repCb.addEventListener('change', ()=>{ setReported(q.id, repCb.checked) })
    rep.appendChild(repCb); rep.appendChild(document.createTextNode(' Felaktig'))

    const exc = document.createElement('label')
    const excCb = document.createElement('input')
    excCb.type='checkbox'
    excCb.checked = !!(flags[q.id] && flags[q.id].excluded)
    excCb.addEventListener('change', ()=>{ toggleExcluded(q.id) })
    exc.appendChild(excCb); exc.appendChild(document.createTextNode(' Uteslut'))

    controls.appendChild(rep)
    controls.appendChild(document.createTextNode(' '))
    controls.appendChild(exc)
    row.appendChild(title)
    row.appendChild(controls)
    list.appendChild(row)
  })
  container.appendChild(list)
}

// Handle import of JSON questions. This merges imported questions into in-memory list
// and updates the management UI. It does NOT write to `data/questions.json` on disk.
// If you want to persist to disk, download the merged JSON and replace the file manually.
function handleImportFile(ev){
  const f = ev.target.files && ev.target.files[0]
  if(!f) return
  const reader = new FileReader()
  reader.onload = ()=>{
    try{
      const parsed = JSON.parse(reader.result)
      if(!Array.isArray(parsed)){ alert('Fel format: förväntar en array av frågor.'); return }
      const existingIds = new Set(allQuestions.map(q=>q.id))
      const added = []
      const skipped = []
      parsed.forEach(q=>{
        if(!q.id || !q.prompt) { skipped.push({q,reason:'saknar id eller prompt'}); return }
        if(existingIds.has(q.id)){ skipped.push({id:q.id,reason:'dublett id'}); return }
        // minimal acceptance: keep as-is (do not invent facts).
        allQuestions.push(q); existingIds.add(q.id); added.push(q.id)
      })
      alert(`Import klar. Tillagda: ${added.length}. Skippade: ${skipped.length}.`)
      renderManage()
    }catch(e){ alert('Kunde inte läsa JSON: '+e.message) }
  }
  reader.readAsText(f, 'utf-8')
}


// ============================================================================
// FLASHCARDS
// ============================================================================

// Krymper textstorleken tills texten ryms i kortet, ned till minRem.
function fitFcText(textEl, defaultRem, minRem = 0.6) {
  const rootPx = parseFloat(getComputedStyle(document.documentElement).fontSize)
  let px = defaultRem * rootPx
  textEl.style.fontSize = px + 'px'

  const container = textEl.closest('.fc-front, .fc-back')
  if (!container) return

  const hint  = container.querySelector('.fc-hint')
  const label = container.querySelector('.fc-label')
  const sub   = container.querySelector('.fc-question-sub')
  const padStyle = getComputedStyle(container)
  const padV  = parseFloat(padStyle.paddingTop) + parseFloat(padStyle.paddingBottom)
  const hintH = hint  ? hint.offsetHeight  + 8  : 0
  const labelH = label ? label.offsetHeight + 14 : 0
  const subH  = sub && !sub.classList.contains('hidden') ? sub.offsetHeight + 8 : 0
  const available = container.clientHeight - padV - hintH - labelH - subH - 16

  const minPx = minRem * rootPx
  while (textEl.scrollHeight > available && px > minPx) {
    px -= 0.5
    textEl.style.fontSize = px + 'px'
  }
}

let fcCards = []         // [{prompt, correct}]
let fcIdx = 0
let fcFlipped = false
let fcTimerInterval = null
let fcStartTime = 0
let fcTimerOn = false

// ---------------------------------------------------------------------------
// Inställningar & frågetypsfilter
// ---------------------------------------------------------------------------

// Valda frågetyper enligt kryssrutorna (input[data-type] som är ikryssade).
function getSelectedTypes(){
  return Array.from(document.querySelectorAll('input[data-type]')).filter(c => c.checked).map(c => c.dataset.type)
}

function loadSettings(){
  try{ return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {} }catch{ return {} }
}

// Läs in sparade inställningar i fälten (namn, frågetyper, kryssrutor). Anropas
// vid start och varje gång inställningssidan lämnas utan att spara, så att
// "Tillbaka" återställer osparade ändringar.
function applySettings(){
  const s = loadSettings()
  if(typeof s.name === 'string') el('playerName').value = s.name
  if(Array.isArray(s.types)){
    document.querySelectorAll('input[data-type]').forEach(c=>{ c.checked = s.types.includes(c.dataset.type) })
  }
  if(typeof s.practiceWrong === 'boolean') el('practiceWrong').checked = s.practiceWrong
  if(typeof s.timerEnabled === 'boolean') el('timerEnabled').checked = s.timerEnabled
  updateTopicOptions()
  updateStartButtons()
}

function saveSettings(){
  const s = {
    name: el('playerName').value.trim(),
    types: getSelectedTypes(),
    practiceWrong: !!el('practiceWrong')?.checked,
    timerEnabled: !!el('timerEnabled')?.checked
  }
  try{ localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)) }catch{}
}

// Vilka typer en ämnesetikett erbjuder, avläst ur parentesen, t.ex.
// "Ben (MC+TF)" → {mc,tf}, "Muskler (FC)" → {fc}, "Tentaplugg (MC+FC)" → {mc,fc}.
// hasTag = etiketten har någon känd typtagg alls.
function typeTagOf(text){
  const m = (text || '').match(/\(([^)]*)\)\s*$/)
  const tag = m ? m[1].toUpperCase() : ''
  return { mc: tag.includes('MC'), tf: tag.includes('TF'), fc: tag.includes('FC'), hasTag: /MC|TF|FC/.test(tag) }
}

function topicCapabilities(){
  return typeTagOf(el('topic')?.selectedOptions?.[0]?.textContent)
}

// Komplett ämneslista (sparas före filtrering). Behövs för att kunna ÅTERskapa
// dolda ämnen — på iOS/WebKit göms inte <option hidden>, så vi tar bort och
// bygger om <option>-elementen i stället.
let allTopicOptions = []
function captureTopicOptions(){
  const topicEl = el('topic')
  if(topicEl) allTopicOptions = Array.from(topicEl.options).map(o => ({ value:o.value, text:o.textContent }))
}

// Visa bara ämnen som har minst en av de valda frågetyperna. Ämnen utan känd
// typtagg visas alltid. Bevarar valt ämne om det fortfarande finns, annars
// hoppar till första synliga (och uppdaterar svårighetsvalen).
function updateTopicOptions(){
  const topicEl = el('topic')
  if(!topicEl || !allTopicOptions.length) return
  const sel = getSelectedTypes()
  const prev = topicEl.value
  const visible = allTopicOptions.filter(o => {
    const c = typeTagOf(o.text)
    return !c.hasTag || sel.some(t => c[t])
  })
  topicEl.innerHTML = ''
  visible.forEach(o => {
    const opt = document.createElement('option')
    opt.value = o.value
    opt.textContent = o.text
    topicEl.appendChild(opt)
  })
  if(visible.some(o => o.value === prev)){
    topicEl.value = prev
  } else if(visible.length){
    topicEl.value = visible[0].value
    updateDifficultyOptions()
  }
}

// Skugga (inaktivera) en startknapp om det VALDA ämnet inte erbjuder det läget:
// quiz kräver att ämnet har MC eller TF, flashcards kräver att ämnet har FC.
// Knapparna speglar alltså ämnet; frågetypsfiltret sköter ämneslistan (inte
// knapparna), så ett dolt/avbockat filter gör inte knappen skuggad för ett ämne
// som faktiskt har läget. Uppdateras vid ämnesbyte och när listan filtrerats om.
function updateStartButtons(){
  const cap = topicCapabilities()
  const sb = el('startBtn'); if(sb) sb.disabled = !(cap.mc || cap.tf)
  const fb = el('startFlashcardsBtn'); if(fb) fb.disabled = !cap.fc
}

function showSettings(){
  applySettings()
  el('setup').classList.add('hidden')
  el('settings').classList.remove('hidden')
}

function hideSettings(){
  el('settings').classList.add('hidden')
  el('setup').classList.remove('hidden')
}

async function startFlashcards() {
  const name    = el('playerName').value.trim() || 'Spelare'
  const num     = parseInt(el('numQuestions').value, 10)
  const topic   = el('topic').value
  const diff    = el('difficulty').value
  fcTimerOn = !!el('timerEnabled')?.checked

  if (topic === 'blandade') {
    // Slumpade frågor erbjuder inte flashcards (knappen är skuggad). Skulle detta
    // ändå nås laddas bara MC/TF-ämnen, så inga flashcards kan komma med.
    const paths = [...new Set(
      Array.from(el('topic').options)
        .filter(o => {
          if(o.disabled || o.value === 'blandade') return false
          const t = typeTagOf(o.textContent)
          return t.mc || t.tf
        })
        .map(o => getQuestionsPath(o.value))
    )]
    await loadQuestionsFromMultiplePaths(paths)
  } else {
    await loadQuestions(getQuestionsPath(topic))
  }

  const flags = loadFlags()

  const filtered = allQuestions.filter(q => {
    const isPlaceholderSource = !!(q.source && String(q.source).toLowerCase() === 'placeholder')
    const isPlaceholderId = /^ph\d{3}$/.test(String(q.id))
    if (isPlaceholderSource || isPlaceholderId) return false

    let topicMatch = false
    if (topic === 'any_riktningar') topicMatch = q.topic === 'riktningar'
    else if (topic === 'osteologi')  topicMatch = q.topic.startsWith('osteologi_')
    else if (topic === 'muskler')    topicMatch = q.topic.startsWith('muskler_')
    else if (topic === 'skuldran')   topicMatch = q.topic.startsWith('skuldra_')
    else if (topic === 'grepp')      topicMatch = q.topic.startsWith('grepp_')
    else if (topic === 'ledtyper')   topicMatch = q.topic.startsWith('ledtyper_')
    else if (topic === 'handen')     topicMatch = q.topic.startsWith('handen_')
    else if (topic === 'tentaplugg') topicMatch = q.topic.startsWith('studier_')
    else if (topic === 'neurologi')  topicMatch = q.topic.startsWith('nervsystemet_')
    else if (topic === 'blodomloppet') topicMatch = q.topic.startsWith('blodomloppet_')
    else if (topic === 'blandade')   topicMatch = true
    else topicMatch = q.topic === topic

    let diffMatch = true
    if (diff === 'Normal') diffMatch = q.difficulty === 'Normal'
    else if (diff === 'Hard') diffMatch = q.difficulty === 'Hard'

    return topicMatch && diffMatch && !(flags[q.id] && flags[q.id].excluded)
  })

  if (!filtered.length) {
    alert('Inga kort matchar urvalet. Prova en annan kombination.')
    return
  }

  fcCards = shuffle(filtered.slice())
    .slice(0, Math.min(num, filtered.length))
    .map(q => ({ prompt: q.prompt, sub: q.sub || '', correct: q.correct }))

  fcIdx = 0
  el('fcPlayerLabel').textContent = name
  el('setup').classList.add('hidden')
  el('flashcards').classList.remove('hidden')
  showFlashcard()
}

function showFlashcard() {
  if (fcIdx >= fcCards.length) { finishFlashcards(); return }

  clearFcTimers()
  fcFlipped = false

  const card = fcCards[fcIdx]
  const cardEl = el('fcCard')

  // Nytt kort: snäpp tillbaka till framsidan UTAN animation och fyll i båda
  // sidorna medan baksidan är garanterat dold (roterad bort + opacity 0).
  // På så vis kan nästa korts svar aldrig blinka till under bytet — tidigare
  // skrevs svaret in på en timer medan opacity-bytet på mobilen glappade.
  cardEl.classList.add('fc-no-anim')
  cardEl.classList.remove('is-flipped')

  el('fcQuestion').textContent = card.prompt
  const subEl = el('fcQuestionSub')
  subEl.textContent = card.sub || ''
  subEl.classList.toggle('hidden', !card.sub)
  el('fcAnswer').textContent = card.correct
  el('fcProgress').textContent = `Kort ${fcIdx + 1} / ${fcCards.length}`
  el('fcFinished').classList.add('hidden')
  el('fcScene').classList.remove('hidden')
  el('fcNextBtn').classList.remove('hidden')
  el('fcTimer').classList.remove('warning')
  el('fcTimer').textContent = ''
  el('fcAnswerTime').textContent = ''

  // Tvinga en omflöde så att snäppet appliceras innan animationerna slås på igen
  void cardEl.offsetWidth
  fitFcText(el('fcQuestion'), 1.1)
  fitFcText(el('fcAnswer'), 1.25)

  // Slå på flip-animationen igen nästa frame (snäppet till framsidan är klart)
  requestAnimationFrame(() => {
    cardEl.classList.remove('fc-no-anim')
  })

  fcStartTime = Date.now()
  if (fcTimerOn) startFcCountUp()
}

function flipCard() {
  if (fcFlipped) return
  fcFlipped = true
  clearFcTimer()
  el('fcCard').classList.add('is-flipped')
  // Tiden fram till klicket visas på svarssidan (kortets baksida).
  if (fcTimerOn) {
    const secs = (Date.now() - fcStartTime) / 1000
    el('fcAnswerTime').textContent = 'Tid: ' + fmtSec(secs)
    el('fcTimer').textContent = 'Tid: ' + fmtSec(secs)
  }
}

// Räknar UPP tiden tills man vänder kortet (ingen automatisk vändning).
function startFcCountUp() {
  el('fcTimer').classList.remove('warning')
  el('fcTimer').textContent = 'Tid: 0 s'
  fcTimerInterval = setInterval(() => {
    const s = Math.floor((Date.now() - fcStartTime) / 1000)
    el('fcTimer').textContent = `Tid: ${s} s`
  }, 500)
}

function clearFcTimer() {
  if (fcTimerInterval) { clearInterval(fcTimerInterval); fcTimerInterval = null }
}

function clearFcTimers() {
  clearFcTimer()
}

function nextFlashcard() {
  clearFcTimers()
  fcIdx++
  showFlashcard()
}

function finishFlashcards() {
  clearFcTimers()
  el('fcScene').classList.add('hidden')
  el('fcNextBtn').classList.add('hidden')
  el('fcTimer').textContent = ''
  el('fcDoneText').textContent = `Klart! Du gick igenom alla ${fcCards.length} kort.`
  el('fcFinished').classList.remove('hidden')
}

function cancelFlashcards() {
  clearFcTimers()
  el('flashcards').classList.add('hidden')
  el('setup').classList.remove('hidden')
}

// ============================================================================

function cancelQuiz(){
  if(confirm('Är du säker? Ditt resultat sparas inte.')) {
    el('quiz').classList.add('hidden')
    el('setup').classList.remove('hidden')
    el('result').classList.add('hidden')
    el('highscores').classList.add('hidden')
    clearTimer()
  }
}

async function loadVersion() {
  try {
    const res = await fetch('./VERSION?t=' + Date.now(), { cache: 'no-store' })
    if (!res.ok) return
    const text = (await res.text()).trim()
    const el_ = document.getElementById('appVersion')
    if (!el_) return
    // Om den färska VERSION skiljer sig från versionen i denna (körda) app.js kör
    // webbläsaren cachad gammal kod — uppmana till omladdning i stället för att dölja det.
    if (text && text !== APP_VERSION) {
      el_.textContent = 'v' + APP_VERSION + ' – ny version ' + text + ' finns, ladda om sidan'
    } else {
      el_.textContent = 'v' + APP_VERSION
    }
  } catch {}
}

function init(){
  loadVersion()
  // OBS: ingen förladdning av frågor här. Tidigare anropades loadQuestions() UTAN
  // sökväg, vilket gav fetch(undefined) → 404 på /undefined i konsolen vid varje
  // sidladdning. Frågorna laddas alltid med rätt sökväg när quiz/flashcards startas.
  el('startBtn').addEventListener('click', ()=>startQuiz())
  el('startFlashcardsBtn').addEventListener('click', startFlashcards)
  el('fcCancelBtn').addEventListener('click', cancelFlashcards)
  el('fcNextBtn').addEventListener('click', nextFlashcard)
  el('fcRetryBtn').addEventListener('click', () => {
    el('fcFinished').classList.add('hidden')
    fcIdx = 0
    showFlashcard()
  })
  el('fcNewBtn').addEventListener('click', startFlashcards)
  el('fcQuitBtn').addEventListener('click', cancelFlashcards)
  el('fcScene').addEventListener('click', () => { if (!fcFlipped) flipCard(false); else nextFlashcard() })
  el('fcScene').addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (!fcFlipped) flipCard(false); else nextFlashcard() } })
  el('cancelBtn').addEventListener('click', cancelQuiz)
  el('nextBtn').addEventListener('click', nextQuestion)
  el('finishBtn').addEventListener('click', ()=>{el('result').classList.add('hidden');el('setup').classList.remove('hidden')})
  el('restart').addEventListener('click', ()=>{ startQuiz() })
  el('viewScores').addEventListener('click', showHighscores)
  el('saveManage').addEventListener('click', ()=>{ alert('Ändringar sparade (sparas automatiskt).'); renderManage() })
  const imp = el('importFile')
  if(imp) imp.addEventListener('change', handleImportFile)
  el('backToSetup').addEventListener('click', ()=>{el('highscores').classList.add('hidden');el('setup').classList.remove('hidden')})
  el('scoresCrumb')?.addEventListener('click', (e)=>{e.preventDefault();el('highscores').classList.add('hidden');el('setup').classList.remove('hidden')})
  el('clearScores').addEventListener('click', ()=>{ if(confirm('Är du säker? Hela topplistan och statistiken raderas permanent och kan inte återställas.')) clearScores() })
  el('scoreFilter')?.addEventListener('change', ()=>{ renderScoreList(); renderBestList() })

  // Inställningssida: öppna/spara/tillbaka + brödsmulelänk.
  el('openSettings')?.addEventListener('click', showSettings)
  el('saveSettings')?.addEventListener('click', ()=>{ saveSettings(); updateTopicOptions(); updateStartButtons(); hideSettings() })
  el('backFromSettings')?.addEventListener('click', ()=>{ applySettings(); hideSettings() })
  el('settingsCrumb')?.addEventListener('click', (e)=>{ e.preventDefault(); applySettings(); hideSettings() })
  // Frågetyps-kryssrutor: håll knapparnas av/på i synk medan man bockar.
  document.querySelectorAll('input[data-type]').forEach(c=>{
    c.addEventListener('change', updateStartButtons)
  })

  // Uppdatera svårighetsval + startknapparnas av/på när ämnet byts.
  el('topic').addEventListener('change', ()=>{ updateDifficultyOptions(); updateStartButtons() })
  captureTopicOptions()     // Spara hela ämneslistan INNAN filtrering
  updateDifficultyOptions() // Initial state
  applySettings()           // Läs in sparade inställningar (filtrerar ämnen + uppdaterar knapparna)
}

document.addEventListener('DOMContentLoaded', init)
