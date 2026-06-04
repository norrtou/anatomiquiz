// Get path based on topic
function getQuestionsPath(topic) {
  if (topic === 'osteologi') return './data/ben.json'
  if (topic === 'muskler') return './data/muskler.json'
  if (topic === 'handen') return './data/handen.json'
  if (topic === 'medicinsk_terminologi') return './data/medicinsk_terminologi.json'
  if (topic === 'tentaplugg') return './data/tentaplugg.json'
  if (topic === 'neurologi') return './data/neurologi.json'
  if (topic === 'blodomloppet') return './data/blodomloppet.json'
  if (topic === 'studenters_flashcards') return './data/studenters_flashcards.json'
  if (topic === 'muskler_flashcards') return './data/muskler_flashcards.json'
  if (topic === 'moho_flashcards') return './data/moho_flashcards.json'
  if (topic === 'otipm_flashcards') return './data/otipm_flashcards.json'
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
// IDs på frågor spelaren senast svarade FEL på (lokalt per webbläsare/enhet).
// Används av "Öva extra på de jag svarar fel på" för att vikta upp dem i quizurvalet.
const WRONG_KEY = 'hur_wrong_questions'

const el = id => document.getElementById(id)

let allQuestions = []
let quizQuestions = []
let currentIdx = 0
let score = 0
let timerInterval = null
let timeLeft = 0
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
    let raw = localStorage.getItem(NEW_FLAGS_KEY)
    const oldRaw = localStorage.getItem(OLD_FLAGS_KEY)
    if(!raw && oldRaw){
      // migrate old -> new, then remove old
      raw = oldRaw
      localStorage.setItem(NEW_FLAGS_KEY, raw)
      localStorage.removeItem(OLD_FLAGS_KEY)
    } else if(oldRaw){
      // new exists (or not), but remove old to keep storage clean
      localStorage.removeItem(OLD_FLAGS_KEY)
    }
    return JSON.parse(raw || '{}')
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
    let raw = localStorage.getItem(NEW_SCORES_KEY)
    const oldRaw = localStorage.getItem(OLD_SCORES_KEY)
    if(!raw && oldRaw){
      raw = oldRaw
      localStorage.setItem(NEW_SCORES_KEY, raw)
      localStorage.removeItem(OLD_SCORES_KEY)
    } else if(oldRaw){
      localStorage.removeItem(OLD_SCORES_KEY)
    }
    return JSON.parse(raw || '[]')
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

// "Öva extra på de jag svarar fel på": frågor man svarar fel på vägs upp i
// quizurvalet (~50% oftare). Dynamiskt — så fort man svarar rätt på en fråga
// tas den bort ur listan och behandlas som vilken annan fråga som helst.
let wrongQuestions = null

function loadWrong(){
  if(wrongQuestions) return wrongQuestions
  try{ wrongQuestions = new Set(JSON.parse(localStorage.getItem(WRONG_KEY) || '[]')) }
  catch(e){ wrongQuestions = new Set() }
  return wrongQuestions
}

function saveWrong(){
  try{ localStorage.setItem(WRONG_KEY, JSON.stringify([...loadWrong()])) }catch(e){}
}

function markWrong(id){
  const s = loadWrong()
  if(!s.has(id)){ s.add(id); saveWrong() }
}

function markCorrect(id){
  const s = loadWrong()
  if(s.has(id)){ s.delete(id); saveWrong() }
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

// Viktad sampling utan återläggning (Efraimidis–Spirakis): högre vikt → större
// chans att komma med. Vikt 1.5 ger frågan ~50% större sannolikhet än en vanlig.
function weightedSampleWithoutReplacement(arr, n, weightOf){
  if(n<=0) return []
  return arr
    .map(item => ({ item, key: Math.pow(getSecureRandom(), 1 / Math.max(weightOf(item), 1e-9)) }))
    .sort((a,b)=> b.key - a.key)
    .slice(0, Math.min(n, arr.length))
    .map(x => x.item)
}

async function startQuiz(){
  const name = el('playerName').value.trim() || 'Spelare'
  const num = parseInt(el('numQuestions').value,10)
  const timePer = parseInt(el('timePerQuestion').value,10) || 0
  const topic = el('topic').value
  const difficulty = el('difficulty').value
  const practiceWrong = !!el('practiceWrong')?.checked

  // Load questions based on topic
  if(topic === 'blandade'){
    const paths = [...new Set(
      Array.from(el('topic').options)
        .filter(o => !o.disabled && o.value !== 'blandade')
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

  // Separate pools from shuffled filtered
  const tfPool = shuffledFiltered.filter(q=> q.type==='tf')
  const mcPool = shuffledFiltered.filter(q=> q.type==='mc' && (1 + (q.distractors?.length||0)) >=3 && (1 + (q.distractors?.length||0)) <=5)

  const maxTf = Math.floor(num * 0.1)
  const tfCount = Math.min(tfPool.length, maxTf)
  let mcCount = num - tfCount

  // Om "öva extra"-läget är på: vikta upp frågor man senast svarat fel på.
  // Annars likformig slump som tidigare.
  const wrongIds = practiceWrong ? loadWrong() : null
  const pick = (pool, count) => practiceWrong
    ? weightedSampleWithoutReplacement(pool, count, q => wrongIds.has(q.id) ? 1.5 : 1)
    : sampleWithoutReplacement(pool, count)

  // Sample from shuffled pools
  let tfSelected = pick(tfPool, tfCount)
  let mcSelected = pick(mcPool, mcCount)

  // If not enough MC, try to fill from remaining shuffledFiltered (preserving randomness)
  if(mcSelected.length < mcCount){
    const pickedIds = new Set([...tfSelected, ...mcSelected].map(q=>q.id))
    const remainingPreferred = shuffledFiltered.filter(q=> !pickedIds.has(q.id) && q.type==='mc')
    const add = pick(remainingPreferred, mcCount - mcSelected.length)
    mcSelected = mcSelected.concat(add)
  }

  // If still short, fill from remaining generic pool (no duplicates)
  const totalNeeded = Math.min(num, filtered.length)
  let combined = [...mcSelected, ...tfSelected]
  if(combined.length < totalNeeded){
    const pickedIds = new Set(combined.map(q=>q.id))
    const remaining = shuffledFiltered.filter(q=> !pickedIds.has(q.id))
    const add = pick(remaining, totalNeeded - combined.length)
    combined = combined.concat(add)
  }

  quizQuestions = shuffle(combined).slice(0, totalNeeded)
  currentIdx = 0; score=0
  // Mät alltid tiden (oavsett om frågetimern är på) för statistik per ämne.
  quizStartTime = Date.now()
  el('playerLabel').textContent = `${name}`
  el('setup').classList.add('hidden')
  el('highscores').classList.add('hidden')
  el('result').classList.add('hidden')
  el('quiz').classList.remove('hidden')
  el('nextBtn').disabled = true
  el('timer').textContent = timePer>0 ? `Tid: ${timePer}s` : ''
  el('timer').dataset.timePer = timePer
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
    b.setAttribute('role','button')
    b.setAttribute('aria-pressed','false')
    b.textContent = opt
    b.addEventListener('click', ()=>selectAnswer(b, opt, q.correct))
    el('answers').appendChild(b)
  })
  el('progress').textContent = `Fråga ${currentIdx+1}/${quizQuestions.length} — Poäng: ${score}`
  // announce for screen readers
  el('progress').setAttribute('aria-live','polite')
  const t = parseInt(el('timer').dataset.timePer,10) || 0
  if(t>0) startTimer(t)
  // focus first answer for keyboard users
  setTimeout(()=>{ const first = el('answers').querySelector('button'); if(first) first.focus() }, 50)
}

function selectAnswer(btn, selected, correct){
  Array.from(el('answers').children).forEach(b=>{b.disabled=true; b.setAttribute('aria-disabled','true')})
  const q = quizQuestions[currentIdx]
  if(selected===correct){
    btn.classList.add('correct'); btn.setAttribute('aria-pressed','true'); score++
    // Rätt svar: frågan behöver inte längre extra övning
    if(q) markCorrect(q.id)
  } else { btn.classList.add('wrong');
    // Fel svar: vägs upp i framtida quiz om "öva extra"-läget är på
    if(q) markWrong(q.id)
    // mark correct
    Array.from(el('answers').children).find(b=>b.textContent===correct)?.classList.add('correct')
  }
  el('nextBtn').disabled = false
  el('nextBtn').setAttribute('aria-disabled','false')
  clearTimer()
}

function nextQuestion(){
  currentIdx++
  if(currentIdx>=quizQuestions.length){ finishQuiz(); return }
  el('nextBtn').disabled = true
  showQuestion()
}

function startTimer(sec){
  timeLeft = sec
  el('timer').textContent = `Tid: ${timeLeft}s`
  timerInterval = setInterval(()=>{
    timeLeft--
    el('timer').textContent = `Tid: ${timeLeft}s`
    // Blink rött när under 4 sekunder
    if(timeLeft < 4){
      el('timer').classList.add('warning')
    } else {
      el('timer').classList.remove('warning')
    }
    if(timeLeft<=0){
      clearTimer();
      // auto mark wrong and show correct
      Array.from(el('answers').children).forEach(b=>b.disabled=true)
      const cq = quizQuestions[currentIdx]
      // Tiden ut räknas som fel — vägs upp i framtida quiz om "öva extra" är på
      if(cq) markWrong(cq.id)
      Array.from(el('answers').children).find(b=>b.textContent===cq.correct)?.classList.add('correct')
      el('nextBtn').disabled = false
    }
  },1000)
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
  scores.sort((a,b)=> (b.score/b.total) - (a.score/a.total))
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

function renderScoreList(){
  const sel = el('scoreFilter')
  const filterVal = sel ? sel.value : 'all'
  const scores = getScores()
  const list = filterVal === 'all'
    ? scores
    : scores.filter(s => s.total === parseInt(filterVal,10))
  const ol = el('scoreList'); ol.innerHTML=''
  if(list.length === 0){
    const li = document.createElement('li')
    li.textContent = 'Inga resultat än.'
    ol.appendChild(li)
    return
  }
  list.forEach(s=>{
    const li = document.createElement('li')
    const pct = Math.round((s.score/s.total)*100)
    const label = s.topicLabel || 'Okänt ämne'
    li.textContent = `${s.name} — ${label} — ${s.score}/${s.total} (${pct}%) — ${new Date(s.date).toLocaleString()}`
    ol.appendChild(li)
  })
}

// Statistik per ämne: antal genomförda quiz och genomsnittligt resultat i procent.
function renderStats(){
  const scores = getScores()
  const byTopic = {}
  scores.forEach(s=>{
    const key = s.topicLabel || 'Okänt ämne'
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
  const entries = Object.entries(byTopic).sort((a,b)=> b[1].count - a[1].count)
  if(entries.length === 0){
    const li = document.createElement('li')
    li.textContent = 'Ingen statistik än.'
    ul.appendChild(li)
    return
  }
  entries.forEach(([label, d])=>{
    const avg = Math.round(d.pctSum / d.count)
    let text = `${label}: ${d.count} försök — i snitt ${avg}%`
    if(d.timedQuestions > 0){
      const secPerQ = (d.timeMs / d.timedQuestions) / 1000
      const tPerQ = secPerQ >= 10 ? Math.round(secPerQ) : secPerQ.toFixed(1)
      text += ` — ca ${tPerQ} s/fråga`
    }
    const li = document.createElement('li')
    li.textContent = text
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
let fcAutoNext = null

async function startFlashcards() {
  const name    = el('playerName').value.trim() || 'Spelare'
  const num     = parseInt(el('numQuestions').value, 10)
  const topic   = el('topic').value
  const diff    = el('difficulty').value
  const timePer = parseInt(el('timePerQuestion').value, 10) || 0

  if (topic === 'blandade') {
    const paths = [...new Set(
      Array.from(el('topic').options)
        .filter(o => !o.disabled && o.value !== 'blandade')
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
  el('fcTimer').dataset.timePer = timePer
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
  const timePer = parseInt(el('fcTimer').dataset.timePer, 10) || 0

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
  el('fcTimer').textContent = timePer > 0 ? `Tid: ${timePer}s` : ''

  // Tvinga en omflöde så att snäppet appliceras innan animationerna slås på igen
  void cardEl.offsetWidth
  fitFcText(el('fcQuestion'), 1.1)
  fitFcText(el('fcAnswer'), 1.25)

  // Slå på flip-animationen igen nästa frame (snäppet till framsidan är klart)
  requestAnimationFrame(() => {
    cardEl.classList.remove('fc-no-anim')
  })

  if (timePer > 0) startFcTimer(timePer)
}

// autoFlip = true när timern löper ut (triggar automatisk nästa efter 4s)
function flipCard(autoFlip = false) {
  if (fcFlipped) return
  fcFlipped = true
  clearFcTimer()
  el('fcCard').classList.add('is-flipped')

  if (autoFlip) startFcAutoNext()
}

function startFcTimer(sec) {
  let left = sec
  el('fcTimer').textContent = `Tid: ${left}s`
  fcTimerInterval = setInterval(() => {
    left--
    el('fcTimer').textContent = `Tid: ${left}s`
    if (left < 4) el('fcTimer').classList.add('warning')
    if (left <= 0) { clearFcTimer(); flipCard(true) }
  }, 1000)
}

function startFcAutoNext() {
  let countdown = 4
  el('fcTimer').textContent = `Nästa: ${countdown}s`
  fcAutoNext = setInterval(() => {
    countdown--
    if (countdown > 0) {
      el('fcTimer').textContent = `Nästa: ${countdown}s`
    } else {
      clearFcTimers()
      nextFlashcard()
    }
  }, 1000)
}

function clearFcTimer() {
  if (fcTimerInterval) { clearInterval(fcTimerInterval); fcTimerInterval = null }
}

function clearFcTimers() {
  clearFcTimer()
  if (fcAutoNext) { clearInterval(fcAutoNext); fcAutoNext = null }
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
    const res = await fetch('./VERSION')
    if (!res.ok) return
    const text = (await res.text()).trim()
    const el_ = document.getElementById('appVersion')
    if (el_) el_.textContent = 'v' + text
  } catch {}
}

function init(){
  loadVersion()
  loadQuestions().then(()=>console.log('Frågor laddade:', allQuestions.length))
  el('startBtn').addEventListener('click', startQuiz)
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
  el('restart').addEventListener('click', ()=>{el('result').classList.add('hidden');el('setup').classList.remove('hidden')})
  el('viewScores').addEventListener('click', showHighscores)
  el('saveManage').addEventListener('click', ()=>{ alert('Ändringar sparade (sparas automatiskt).'); renderManage() })
  const imp = el('importFile')
  if(imp) imp.addEventListener('change', handleImportFile)
  el('backToSetup').addEventListener('click', ()=>{el('highscores').classList.add('hidden');el('setup').classList.remove('hidden')})
  el('clearScores').addEventListener('click', ()=>{ if(confirm('Är du säker? Hela topplistan och statistiken raderas permanent och kan inte återställas.')) clearScores() })
  el('scoreFilter')?.addEventListener('change', renderScoreList)

  // Update difficulty options when topic changes
  el('topic').addEventListener('change', updateDifficultyOptions)
  updateDifficultyOptions() // Initial state
}

document.addEventListener('DOMContentLoaded', init)
