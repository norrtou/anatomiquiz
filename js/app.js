const qsPath = './data/questions.json'
// NOTE: This app will ensure up to MAX_QUESTIONS questions exist by generating
// placeholders for missing entries. Real questions should be imported later
// into `data/questions.json`. Placeholders are non-medical and serve only
// to exercise the UI. Do NOT treat placeholders as factual content.
const MAX_QUESTIONS = 500

// LocalStorage key migration: old prefix 'wiil_' → new prefix based on app name
const OLD_FLAGS_KEY = 'wiil_question_flags'
const NEW_FLAGS_KEY = 'hur_question_flags'
const OLD_SCORES_KEY = 'wiil_highscores'
const NEW_SCORES_KEY = 'hur_highscores'
const SOUND_KEY = 'hur_sound_enabled'

const el = id => document.getElementById(id)

let allQuestions = []
let quizQuestions = []
let currentIdx = 0
let score = 0
let timerInterval = null
let timeLeft = 0
let soundEnabled = true

async function loadQuestions(){
  const res = await fetch(qsPath)
  allQuestions = await res.json()
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

function getScores(){
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
  }catch(e){ return [] }
}

function saveScores(scores){
  localStorage.setItem(NEW_SCORES_KEY, JSON.stringify(scores))
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

function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}

function sampleWithoutReplacement(arr, n){
  if(n<=0) return []
  const copy = arr.slice()
  shuffle(copy)
  return copy.slice(0, Math.min(n, copy.length))
}

function startQuiz(){
  const name = el('playerName').value.trim() || 'Spelare'
  const num = parseInt(el('numQuestions').value,10)
  const timePer = parseInt(el('timePerQuestion').value,10) || 0
  const diff = el('difficulty').value
  const topic = el('topic').value
  const flags = loadFlags()
  // Exclude questions that are explicitly marked as placeholders so they
  // are not used in quizzes until replaced with real, fact-checked content.
  // Filter by difficulty: 'any' (all), 'Normal' (normal questions), 'Hard' (difficult questions)
  const filtered = allQuestions.filter(q=> {
    const isPlaceholderSource = !!(q.source && String(q.source).toLowerCase()==='placeholder')
    const isPlaceholderId = /^ph\d{3}$/.test(String(q.id))
    if(isPlaceholderSource || isPlaceholderId) return false
    return (diff==='any'||q.difficulty===diff) && (topic==='any'||q.topic===topic) && !(flags[q.id] && flags[q.id].excluded)
  })
  if(filtered.length===0){alert('Inga frågor matchar urvalet. Prova en annan kombination.');return}

  // Ensure full randomization: shuffle filtered pool first
  const shuffledFiltered = shuffle(filtered.slice())

  // Separate pools from shuffled filtered
  const tfPool = shuffledFiltered.filter(q=> q.type==='tf')
  const mcPool = shuffledFiltered.filter(q=> q.type==='mc' && (1 + (q.distractors?.length||0)) >=3 && (1 + (q.distractors?.length||0)) <=5)

  const maxTf = Math.floor(num * 0.1)
  const tfCount = Math.min(tfPool.length, maxTf)
  let mcCount = num - tfCount

  // Sample without replacement from shuffled pools
  let tfSelected = sampleWithoutReplacement(tfPool, tfCount)
  let mcSelected = sampleWithoutReplacement(mcPool, mcCount)

  // If not enough MC, try to fill from remaining shuffledFiltered (preserving randomness)
  if(mcSelected.length < mcCount){
    const pickedIds = new Set([...tfSelected, ...mcSelected].map(q=>q.id))
    const remainingPreferred = shuffledFiltered.filter(q=> !pickedIds.has(q.id) && q.type==='mc')
    const add = sampleWithoutReplacement(remainingPreferred, mcCount - mcSelected.length)
    mcSelected = mcSelected.concat(add)
  }

  // If still short, fill from remaining generic pool (no duplicates)
  const totalNeeded = Math.min(num, filtered.length)
  let combined = [...mcSelected, ...tfSelected]
  if(combined.length < totalNeeded){
    const pickedIds = new Set(combined.map(q=>q.id))
    const remaining = shuffledFiltered.filter(q=> !pickedIds.has(q.id))
    const add = sampleWithoutReplacement(remaining, totalNeeded - combined.length)
    combined = combined.concat(add)
  }

  quizQuestions = shuffle(combined).slice(0, totalNeeded)
  currentIdx = 0; score=0
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

  // Ensure report button reflects current question
  const flags = loadFlags()
  const rep = flags[q.id] && flags[q.id].reported
  el('reportBtn').textContent = rep ? 'Avmarkera som felaktig' : 'Markera som felaktig'
}

function selectAnswer(btn, selected, correct){
  Array.from(el('answers').children).forEach(b=>{b.disabled=true; b.setAttribute('aria-disabled','true')})
  if(selected===correct){
    btn.classList.add('correct'); btn.setAttribute('aria-pressed','true'); score++
    playSuccessSound()
  } else { btn.classList.add('wrong');
    playFailSound()
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

function toggleReportCurrent(){
  const q = quizQuestions[currentIdx]
  const flags = loadFlags()
  const current = !!(flags[q.id] && flags[q.id].reported)
  setReported(q.id, !current)
  el('reportBtn').textContent = !current ? 'Avmarkera som felaktig' : 'Markera som felaktig'
}

function startTimer(sec){
  timeLeft = sec
  el('timer').textContent = `Tid: ${timeLeft}s`
  timerInterval = setInterval(()=>{
    timeLeft--
    el('timer').textContent = `Tid: ${timeLeft}s`
    if(timeLeft<=0){
      clearTimer();
      // auto mark wrong and show correct
      Array.from(el('answers').children).forEach(b=>b.disabled=true)
      const correct = quizQuestions[currentIdx].correct
      Array.from(el('answers').children).find(b=>b.textContent===correct)?.classList.add('correct')
      el('nextBtn').disabled = false
    }
  },1000)
}

function clearTimer(){ if(timerInterval){clearInterval(timerInterval);timerInterval=null} }

function finishQuiz(){
  el('quiz').classList.add('hidden')
  el('result').classList.remove('hidden')
  el('resultText').textContent = `Du fick ${score} av ${quizQuestions.length} rätt.`
  el('saveName').value = el('playerName').value || 'Spelare'
  el('resultText').setAttribute('aria-live','polite')
}

function saveScore(){
  const name = el('saveName').value || 'Spelare'
  const scores = getScores()
  scores.push({name,score, total:quizQuestions.length, date: new Date().toISOString()})
  scores.sort((a,b)=> (b.score/b.total) - (a.score/a.total))
  saveScores(scores.slice(0,50))
  showHighscores()
}

function showHighscores(){
  el('setup').classList.add('hidden')
  el('quiz').classList.add('hidden')
  el('result').classList.add('hidden')
  el('highscores').classList.remove('hidden')
  const scores = getScores()
  const ol = el('scoreList'); ol.innerHTML=''
  scores.forEach(s=>{
    const li = document.createElement('li')
    const pct = Math.round((s.score/s.total)*100)
    li.textContent = `${s.name} — ${s.score}/${s.total} (${pct}%) — ${new Date(s.date).toLocaleString()}`
    ol.appendChild(li)
  })
  // focus the list for keyboard users
  setTimeout(()=>{ el('scoreList').focus?.() },50)
}

function clearScores(){
  // Remove both keys to ensure old and new keys are cleared
  localStorage.removeItem(NEW_SCORES_KEY)
  localStorage.removeItem(OLD_SCORES_KEY)
  showHighscores()
}

// Sound functions
function loadSoundSetting(){
  const stored = localStorage.getItem(SOUND_KEY)
  soundEnabled = stored === null ? true : stored === 'true'
  updateSoundButton()
}

function toggleSound(){
  soundEnabled = !soundEnabled
  localStorage.setItem(SOUND_KEY, soundEnabled)
  updateSoundButton()
}

function updateSoundButton(){
  const btn = el('soundToggle')
  if(soundEnabled){
    btn.textContent = '🔊'
    btn.classList.remove('off')
  } else {
    btn.textContent = '🔇'
    btn.classList.add('off')
  }
}

function playSuccessSound(){
  if(!soundEnabled) return
  const ctx = new (window.AudioContext || window.webkitAudioContext)()
  const now = ctx.currentTime
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()

  osc.connect(gain)
  gain.connect(ctx.destination)

  gain.gain.setValueAtTime(0.15, now)
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3)

  osc.frequency.setValueAtTime(800, now)
  osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1)
  osc.frequency.exponentialRampToValueAtTime(800, now + 0.3)

  osc.start(now)
  osc.stop(now + 0.3)
}

function playFailSound(){
  if(!soundEnabled) return
  const ctx = new (window.AudioContext || window.webkitAudioContext)()
  const now = ctx.currentTime
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()

  osc.connect(gain)
  gain.connect(ctx.destination)

  gain.gain.setValueAtTime(0.15, now)
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4)

  osc.frequency.setValueAtTime(400, now)
  osc.frequency.exponentialRampToValueAtTime(300, now + 0.2)
  osc.frequency.exponentialRampToValueAtTime(200, now + 0.4)

  osc.start(now)
  osc.stop(now + 0.4)
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

function renderReported(){
  const container = el('reportedList')
  container.innerHTML = ''
  const flags = loadFlags()
  const reported = Object.keys(flags).filter(id=> flags[id].reported)
  if(reported.length===0){ container.textContent = 'Inga rapporterade frågor.'; return }
  const ul = document.createElement('ul')
  reported.forEach(id=>{
    const q = allQuestions.find(x=>x.id===id)
    const li = document.createElement('li')
    if(q){
      li.textContent = `[${id}] ${q.prompt} `
      const excBtn = document.createElement('button')
      excBtn.className='btn'
      excBtn.textContent = (flags[id] && flags[id].excluded) ? 'Återinkludera' : 'Uteslut temporärt'
      excBtn.addEventListener('click', ()=>{ toggleExcluded(id); renderReported(); })
      const unrep = document.createElement('button')
      unrep.className='btn'
      unrep.textContent='Avmarkera'
      unrep.addEventListener('click', ()=>{ setReported(id,false); renderReported(); renderManage(); })
      li.appendChild(excBtn); li.appendChild(unrep)
    } else {
      li.textContent = `[${id}] (fråga saknas i dataset)`
    }
    ul.appendChild(li)
  })
  container.appendChild(ul)
}

// Export reported questions as JSON file (client-side download)
function exportReported(){
  const flags = loadFlags()
  const reportedIds = Object.keys(flags).filter(id=> flags[id].reported)
  const items = reportedIds.map(id=> allQuestions.find(q=> q.id===id)).filter(Boolean)
  const blob = new Blob([JSON.stringify(items, null, 2)], {type:'application/json'})
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'reported_questions.json'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
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

function init(){
  loadQuestions().then(()=>console.log('Frågor laddade:', allQuestions.length))
  loadSoundSetting()
  el('soundToggle').addEventListener('click', toggleSound)
  el('startBtn').addEventListener('click', startQuiz)
  el('nextBtn').addEventListener('click', nextQuestion)
  el('reportBtn').addEventListener('click', toggleReportCurrent)
  el('saveScore').addEventListener('click', saveScore)
  el('restart').addEventListener('click', ()=>{el('result').classList.add('hidden');el('setup').classList.remove('hidden')})
  el('viewScores').addEventListener('click', showHighscores)
  el('manageBtn').addEventListener('click', ()=>{ renderManage(); el('setup').classList.add('hidden'); el('manage').classList.remove('hidden') })
  el('viewReported').addEventListener('click', ()=>{ renderReported(); el('setup').classList.add('hidden'); el('reported').classList.remove('hidden') })
  el('backFromManage').addEventListener('click', ()=>{ el('manage').classList.add('hidden'); el('setup').classList.remove('hidden') })
  el('backFromReported').addEventListener('click', ()=>{ el('reported').classList.add('hidden'); el('setup').classList.remove('hidden') })
  el('saveManage').addEventListener('click', ()=>{ alert('Ändringar sparade (sparas automatiskt).'); renderManage() })
  const imp = el('importFile')
  if(imp) imp.addEventListener('change', handleImportFile)
  const exp = el('exportReported')
  if(exp) exp.addEventListener('click', exportReported)
  el('backToSetup').addEventListener('click', ()=>{el('highscores').classList.add('hidden');el('setup').classList.remove('hidden')})
  el('clearScores').addEventListener('click', ()=>{ if(confirm('Rensa topplista?')) clearScores() })
}

document.addEventListener('DOMContentLoaded', init)
