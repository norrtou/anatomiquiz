/* =========================================================
   test_ordlista_sok.js — tester för ordlistans sökning (js/glossary.js)
   =========================================================
   Körs med:  node scripts/test_ordlista_sok.js
   Avslutar med kod 0 när allt är grönt, annars 1.

   Ett minimalt DOM-skal kör den riktiga js/glossary.js mot den riktiga datan
   (data/ordlista-index.json och data/ordlista.json), med styrbar fetch och
   styrbar timer. Testerna träffar alltså den kod och det index som levereras.

   Skalet finns för tre saker som inte syns i markupen:

     1. ATT DE TVÅ STEGEN LÄNKAR LIKA. Sökningen härleder länken på två sätt –
        ur det lätta indexet (steg 1) och ur hela ordlistan (steg 2, som räknar
        fram grupp och slug med sin spegling av Python). Skulle de säga olika
        skulle ett sökresultat leda rätt ibland och fel ibland, beroende på hur
        snabbt nätet var. Här jämförs de för var och en av de 11 203 posterna.

     2. ATT SLUG-TABELLEN ÄR IDENTISK MED PYTHONS. _SLUG_MAP i
        scripts/generate_glossary.py och SLUG_MAP här bygger ankaret som
        2 351 tooltips i kunskapsbanken pekar på (data/kb_glossary_terms.json).
        Glider de isär pekar klientens sökträffar på ankare som sidorna saknar.

     3. ATT DEFINITIONSSÖKNINGEN FINNS KVAR. Den är inte en bonus: den är det
        som gör att en sökning på k-formen hittar c-formen (kolit → colit),
        eftersom c-posterna nämner k-formen i sin brödtext. Ett lätt index som
        ersatte den i stället för att komplettera den hade tyst tagit bort
        hälften av ordlistans sökbarhet.

   Skalet mäter INTE hur det ser ut: att träfflistan är läsbar medan
   beskrivningskolumnen står tom, och att omritningen när steg 2 landar inte
   känns som ett hopp, kräver kontroll i webbläsare (CLAUDE_REGLER §13.1).

   Kör det här skriptet efter varje ändring i js/glossary.js eller i
   sökindexet i scripts/generate_glossary.py.
   ========================================================= */

const fs = require('fs')
const path = require('path')
const vm = require('vm')

const ROOT = path.resolve(__dirname, '..')
const SRC = fs.readFileSync(path.join(ROOT, 'js', 'glossary.js'), 'utf8')
const PY = fs.readFileSync(path.join(ROOT, 'scripts', 'generate_glossary.py'), 'utf8')
const INDEX_RAW = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'ordlista-index.json'), 'utf8'))
const FULL_RAW = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'ordlista.json'), 'utf8'))
  .filter(e => e.status !== 'stub')

const INDEX_URL = './data/ordlista-index.json'
const DATA_URL = './data/ordlista.json'

let pass = 0
const fails = []
function ok (name, cond) {
  if (cond) { pass++ } else { fails.push(name) }
}
function eq (name, got, want) {
  ok(`${name}  (fick ${JSON.stringify(got)}, väntade ${JSON.stringify(want)})`, got === want)
}

/* --- DOM-skal ---------------------------------------------------------------
   Bara det js/glossary.js faktiskt rör: sökrutan, träffbehållaren, det statiska
   innehållet, räknaren och alfabetsradens chips. fetch och setTimeout är
   styrbara – annars går det inte att pröva vad som händer MELLAN de två stegen,
   och det är precis där buggarna bor. */

function makeEl (tag = 'DIV') {
  return {
    tagName: tag,
    hidden: false,
    disabled: false,
    placeholder: '',
    value: '',
    innerHTML: '',
    textContent: '',
    dataset: {},
    _classes: new Set(),
    _listeners: {},
    classList: {
      toggle (c, on) { on ? this._owner._classes.add(c) : this._owner._classes.delete(c) },
      contains (c) { return this._owner._classes.has(c) }
    },
    addEventListener (type, fn, opts) {
      const wrapped = (opts && opts.once)
        ? (ev) => { this._listeners[type] = (this._listeners[type] || []).filter(f => f !== wrapped); fn(ev) }
        : fn
      ;(this._listeners[type] = this._listeners[type] || []).push(wrapped)
    },
    fire (type, ev) { (this._listeners[type] || []).slice().forEach(fn => fn(ev || {})) },
    focus () {}
  }
}

function makeChip (group) {
  const el = makeEl('A')
  el.dataset.group = group
  el.classList._owner = el
  return el
}

function makeWorld ({ page = 'a' } = {}) {
  const input = makeEl('INPUT')
  const results = makeEl()
  const content = makeEl()
  const count = makeEl('SPAN')
  const chips = Object.keys(INDEX_RAW.grupper).map(makeChip)

  const els = {
    glossarySearch: input,
    searchResults: results,
    glossaryContent: content,
    termCount: count
  }

  const pending = []   // väntande fetch-anrop
  const timers = []    // väntande setTimeout
  const domReady = []

  const win = {
    document: {
      getElementById: id => els[id] || null,
      querySelectorAll: sel =>
        sel === '#glossaryAlphabet .glossary-alpha' ? chips : [],
      body: { dataset: { page } },
      addEventListener: (type, fn) => { if (type === 'DOMContentLoaded') domReady.push(fn) }
    },
    fetch (url) {
      const rec = { url }
      rec.promise = new Promise((res, rej) => { rec.resolve = res; rec.reject = rej })
      pending.push(rec)
      return rec.promise
    },
    setTimeout (fn) { timers.push({ fn, live: true }); return timers.length },
    clearTimeout (id) { if (timers[id - 1]) timers[id - 1].live = false },
    matchMedia: () => ({ matches: false }),
    console
  }
  win.window = win

  const ctx = vm.createContext(win)
  vm.runInContext(SRC, ctx, { filename: 'js/glossary.js' })
  domReady.forEach(fn => fn())

  const world = {
    ctx, input, results, content, count, chips,
    urls: () => pending.map(p => p.url),
    /** Släpp igenom svaret på en väntande hämtning. */
    async serve (url, payload) {
      const rec = pending.find(p => p.url === url && !p.done)
      if (!rec) throw new Error(`ingen väntande hämtning av ${url}`)
      rec.done = true
      rec.resolve({ ok: true, json: () => Promise.resolve(payload) })
      await tick()
    },
    /** Låt en väntande hämtning misslyckas (offline, 404). */
    async fail (url) {
      const rec = pending.find(p => p.url === url && !p.done)
      if (!rec) throw new Error(`ingen väntande hämtning av ${url}`)
      rec.done = true
      rec.resolve({ ok: false, status: 404, json: () => Promise.resolve(null) })
      await tick()
    },
    /** Skriv i sökrutan och låt debouncen gå av. */
    async type (text) {
      input.value = text
      input.fire('input')
      timers.filter(t => t.live).forEach(t => { t.live = false; t.fn() })
      await tick()
    },
    async focusSearch () { input.fire('focus'); await tick() },
    /** Hela flödet: fokus + sökning + båda stegen levererade. */
    async searchFully (text) {
      await world.focusSearch()
      await world.serve(INDEX_URL, INDEX_RAW)
      await world.type(text)
      await world.serve(DATA_URL, FULL_RAW)
    },
    rows: () => parseRows(results.innerHTML),
    dimmed: () => chips.filter(c => c._classes.has('is-disabled')).map(c => c.dataset.group)
  }
  return world
}

/** Ge mikrotaskerna en chans att köra klart (fetch-kedjorna är async). */
function tick () {
  return new Promise(res => setImmediate(res))
}

/** Termen renderas HTML-escapad; tillbaka till råtext för uppslag mot facit. */
function unescapeTerm (s) {
  return s.replace(/&quot;/g, '"').replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<').replace(/&amp;/g, '&')
}

/** Plocka isär den renderade träfflistan till [{href, term, def}]. */
function parseRows (html) {
  const out = []
  const rx = /<div class="glossary-entry"><dt class="glossary-term"><a href="([^"]*)">([\s\S]*?)<\/a><\/dt><dd class="glossary-def">([\s\S]*?)<\/dd><\/div>/g
  let m
  while ((m = rx.exec(html))) out.push({ href: m[1], term: m[2], def: m[3] })
  return out
}

async function main () {
  /* =========================================================================
     1. Källparitet: slug-tabellen i JS mot den i Python
     ========================================================================= */
  {
    // Båda tabellerna skrivs som "x": "y"-par; jämför paren, inte formateringen.
    const par = (text, start) => {
      const body = text.slice(text.indexOf(start) + start.length)
      const slut = body.indexOf('}')
      return body.slice(0, slut).match(/["']([^"']+)["']\s*:\s*["']([^"']*)["']/g).sort().join('|')
        .replace(/'/g, '"').replace(/\s+/g, '')
    }
    const js = par(SRC, 'const SLUG_MAP = {')
    const py = par(PY, '_SLUG_MAP = {')
    ok('SLUG_MAP i js/glossary.js är identisk med _SLUG_MAP i generate_glossary.py', js === py)
    ok('  och är inte tom (mönstret hittade något att jämföra)', js.length > 100)
  }

  /* =========================================================================
     2. Indexets integritet mot ordlistan
     ========================================================================= */
  {
    const w = makeWorld()
    const { slugify, pageKey, termHref, indexHref } = w.ctx

    const platt = []
    Object.keys(INDEX_RAW.grupper).forEach(page => {
      INDEX_RAW.grupper[page].forEach(term => {
        platt.push({ term, page, slug: INDEX_RAW.slugg[term] || slugify(term) })
      })
    })
    eq('indexet har lika många uppslagsord som ordlistan', platt.length, FULL_RAW.length)

    const iByTerm = new Map(platt.map(i => [i.term, i]))
    eq('  och inga dubbletter', iByTerm.size, platt.length)

    let saknas = 0; let felGrupp = 0; let felLank = 0; let exempelLank = ''
    FULL_RAW.forEach(e => {
      const i = iByTerm.get(e.term)
      if (!i) { saknas++; return }
      if (i.page !== pageKey(e)) felGrupp++
      const a = indexHref(i, null)
      const b = termHref(e, null)
      if (a !== b) { felLank++; if (!exempelLank) exempelLank = `${e.term}: ${a} ≠ ${b}` }
    })
    eq('varje post i ordlistan finns i indexet', saknas, 0)
    eq('  med samma sidgrupp som page_key ger', felGrupp, 0)
    eq(`  och samma länk från båda stegen${exempelLank ? ' – ' + exempelLank : ''}`, felLank, 0)

    const overstyrda = FULL_RAW.filter(e => e.slug)
    eq('slug-överstyrningarna finns med i indexet',
      overstyrda.filter(e => INDEX_RAW.slugg[e.term] === e.slug).length, overstyrda.length)
    eq('  och indexet bär inga andra', Object.keys(INDEX_RAW.slugg).length, overstyrda.length)
    // Överstyrningarna är kollisionsskydd: utan dem foldas ärr → term-arr, som
    // redan är ärrs granne. Att de bärs av indexet är alltså inte kosmetik.
    eq('  t.ex. ärr → term-aerr', INDEX_RAW.slugg['ärr'], 'term-aerr')
  }

  /* =========================================================================
     3. foldForSearch — egen funktion, aldrig ankarbyggaren
     ========================================================================= */
  {
    const { foldForSearch, slugify } = makeWorld().ctx
    eq('fold: Öga → oga', foldForSearch('Öga'), 'oga')
    eq('fold: ärr → arr', foldForSearch('ärr'), 'arr')
    eq('fold: ödem → odem', foldForSearch('ödem'), 'odem')
    eq('fold: Râle → rale', foldForSearch('Râle'), 'rale')
    eq('fold: BEHÇET → behcet', foldForSearch('BEHÇET'), 'behcet')
    // Skillnaden mot slugify: folden lämnar mellanslag och streck kvar, annars
    // slutar flerordstermer och ändelser matcha mitt i en sökning.
    eq('fold behåller mellanslag', foldForSearch('Abductor Pollicis'), 'abductor pollicis')
    eq('fold behåller ledande streck', foldForSearch('-itis'), '-itis')
    eq('  medan slugify gör om det till ett ankare', slugify('-itis'), 'term-suffix-itis')
    ok('fold ≠ slugify för samma ord', foldForSearch('ärr') !== slugify('ärr'))
  }

  /* =========================================================================
     4. matchRank — rangordningen
     ========================================================================= */
  {
    const { matchRank } = makeWorld().ctx
    eq('rank 0: exakt uppslagsord', matchRank('kolit', 'kolit'), 0)
    eq('rank 1: termen börjar med söktermen', matchRank('kolithiasis', 'kolit'), 1)
    eq('rank 2: söktermen står inne i termen', matchRank('ulcerös kolit', 'kolit'), 2)
    eq('rank 3: ingen träff i termen alls', matchRank('appendicit', 'kolit'), 3)
  }

  /* =========================================================================
     5. Steg 1: fokus hämtar det LÄTTA indexet, inte 2,4 MB-filen
     ========================================================================= */
  {
    const w = makeWorld()
    await w.focusSearch()
    eq('fokus utlöser exakt en hämtning', w.urls().length, 1)
    eq('  och den går till det lätta indexet', w.urls()[0], INDEX_URL)
    ok('  hela ordlistan hämtas INTE vid fokus', !w.urls().includes(DATA_URL))
  }

  /* =========================================================================
     6. Tom sökruta hämtar ingenting
     ========================================================================= */
  {
    const w = makeWorld()
    await w.type('')
    eq('tom sökruta hämtar ingenting', w.urls().length, 0)
    eq('  och återställer det statiska innehållet', w.content.hidden, false)
    eq('  träffbehållaren är dold', w.results.hidden, true)
    eq('  räknaren är tom', w.count.textContent, '')
  }

  /* =========================================================================
     7. Steg 1 ritar träffar utan beskrivning – och länkarna funkar direkt
     ========================================================================= */
  {
    const w = makeWorld({ page: 'a' })
    await w.focusSearch()
    await w.serve(INDEX_URL, INDEX_RAW)
    await w.type('ödem')

    const rader = w.rows()
    ok('steg 1 ger träffar innan ordlistan laddats', rader.length > 0)
    eq('  första träffen är uppslagsordet självt', rader[0].term, 'ödem')
    eq('  länken pekar på Ö-sidans ankare', rader[0].href, 'ordlista-oe.html#term-odem')
    eq('  beskrivningskolumnen står tom', rader[0].def, '')
    ok('  och den kan inte innehålla skräp', rader.every(r => r.def === ''))
    eq('  räknaren visar antalet träffar', w.count.textContent, `${rader.length} träffar`)
    eq('  det statiska innehållet är dolt', w.content.hidden, true)

    // Steg 2 startar av sökningen, inte av fokus.
    ok('sökningen startar hämtningen av hela ordlistan', w.urls().includes(DATA_URL))

    /* --- och när den landar fylls beskrivningarna i ------------------------ */
    await w.serve(DATA_URL, FULL_RAW)
    const efter = w.rows()
    eq('steg 2 ritar om med samma första träff', efter[0].term, 'ödem')
    eq('  med samma länk som steg 1 gav', efter[0].href, rader[0].href)
    ok('  och nu med en beskrivning', efter[0].def.length > 0)
    ok('  ordklassen kursiveras som på den statiska sidan', efter[0].def.startsWith('<em>subst.</em>'))
    ok('  träffarna blir fler när definitionerna räknas med', efter.length > rader.length)
  }

  /* =========================================================================
     8. Definitionssökningen: k-formen hittar c-formen (steg 2)
     ========================================================================= */
  {
    const w = makeWorld()
    await w.focusSearch()
    await w.serve(INDEX_URL, INDEX_RAW)
    await w.type('kolit')

    const steg1 = w.rows().map(r => r.term)
    ok('steg 1 hittar inte "colit" (ordet står bara i beskrivningen)', !steg1.includes('colit'))

    await w.serve(DATA_URL, FULL_RAW)
    const steg2 = w.rows()
    const colit = steg2.find(r => r.term === 'colit')
    ok('steg 2 hittar "colit" via beskrivningen', !!colit)
    ok('  och markerar var i beskrivningen ordet stod',
      !!colit && colit.def.includes('<mark class="glossary-hit">kolit</mark>'))
    eq('  med länk till C-sidan', colit && colit.href, 'ordlista-c.html#term-colit')
  }

  /* =========================================================================
     9. Diakritisk fold i praktiken – båda stegen
     ========================================================================= */
  {
    const w = makeWorld()
    await w.searchFully('hoftledsdysplasi')
    const t = w.rows().map(r => r.term)
    ok('"hoftledsdysplasi" hittar "höftledsdysplasi"', t.includes('höftledsdysplasi'))
  }
  {
    const w = makeWorld()
    await w.focusSearch()
    await w.serve(INDEX_URL, INDEX_RAW)
    await w.type('arr')
    const rad = w.rows().find(r => r.term === 'ärr')
    ok('steg 1: "arr" hittar "ärr"', !!rad)
    eq('  med den överstyrda sluggen, inte den foldade', rad && rad.href, 'ordlista-ae.html#term-aerr')
    await w.serve(DATA_URL, FULL_RAW)
    const rad2 = w.rows().find(r => r.term === 'ärr')
    eq('steg 2: samma länk för "ärr"', rad2 && rad2.href, 'ordlista-ae.html#term-aerr')
  }
  {
    // Åt andra hållet: söker man MED diakrit ska ordet fortfarande hittas.
    const w = makeWorld()
    await w.searchFully('ödem')
    ok('"ödem" hittar fortfarande "ödem"', w.rows().some(r => r.term === 'ödem'))
  }

  /* =========================================================================
     10. Träff på den aktuella sidan länkas med rent ankare
     ========================================================================= */
  {
    const w = makeWorld({ page: 'oe' })
    await w.searchFully('ödem')
    const rad = w.rows().find(r => r.term === 'ödem')
    eq('träff på egen sida → rent #ankare (ingen omladdning)', rad && rad.href, '#term-odem')
  }
  {
    const w = makeWorld({ page: 'oe' })
    await w.focusSearch()
    await w.serve(INDEX_URL, INDEX_RAW)
    await w.type('ödem')
    const rad = w.rows().find(r => r.term === 'ödem')
    eq('  och likadant i steg 1', rad && rad.href, '#term-odem')
  }

  /* =========================================================================
     11. Alfabetsraden och räknaren följer träffarna
     ========================================================================= */
  {
    // Facit räknas fram ur träffarna, inte gissas: "ödem" träffar bl.a.
    // "ankelödem" (A) och "lungödem" (L), inte bara Ö-sidan.
    const sidaFor = new Map()
    Object.keys(INDEX_RAW.grupper).forEach(page => {
      INDEX_RAW.grupper[page].forEach(term => sidaFor.set(term, page))
    })
    const w = makeWorld()
    await w.focusSearch()
    await w.serve(INDEX_URL, INDEX_RAW)
    await w.type('ödem')
    const medTraff = new Set(w.rows().map(r => sidaFor.get(unescapeTerm(r.term))))
    const nedtonade = new Set(w.dimmed())
    ok('steg 1: varje grupp med träff är aktiv',
      [...medTraff].every(p => !nedtonade.has(p)))
    ok('  och varje grupp utan träff är nedtonad',
      Object.keys(INDEX_RAW.grupper).every(p => medTraff.has(p) || nedtonade.has(p)))
    ok('  (och något tonades faktiskt ned)', nedtonade.size > 0)
    await w.serve(DATA_URL, FULL_RAW)
    ok('steg 2 håller Ö aktiv', !w.dimmed().includes('Ö'))
  }
  {
    const w = makeWorld()
    await w.searchFully('zzzqqq')
    eq('sökning utan träffar', w.results.innerHTML, '<p class="glossary-empty">Inga träffar.</p>')
    eq('  räknaren säger 0 träffar', w.count.textContent, '0 träffar')
  }
  {
    const w = makeWorld()
    await w.searchFully('ödem')
    await w.type('')
    eq('tömd sökruta återställer statiskt innehåll', w.content.hidden, false)
    eq('  och tömmer räknaren', w.count.textContent, '')
  }
  {
    const w = makeWorld()
    await w.searchFully('appendicit')
    eq('exakt träff hamnar först', w.rows()[0].term, 'appendicit')
  }

  /* =========================================================================
     12. Om något inte går att hämta
     ========================================================================= */
  {
    // Indexet faller → fall tillbaka på hela ordlistan (läget före 0.9.335).
    const w = makeWorld()
    await w.type('ödem')
    await w.fail(INDEX_URL)
    await w.serve(DATA_URL, FULL_RAW)
    ok('index otillgängligt → sökningen faller tillbaka på hela ordlistan',
      w.rows().some(r => r.term === 'ödem'))
    eq('  och sökrutan är inte avslagen', w.input.disabled, false)
    ok('  träffarna bär beskrivningar', w.rows()[0].def.length > 0)
  }
  {
    // Ordlistan faller → steg 1-träffarna står kvar och går att klicka på.
    const w = makeWorld()
    await w.focusSearch()
    await w.serve(INDEX_URL, INDEX_RAW)
    await w.type('ödem')
    await w.fail(DATA_URL)
    const rader = w.rows()
    ok('ordlistan otillgänglig → uppslagsorden är kvar', rader.some(r => r.term === 'ödem'))
    eq('  med fungerande länk', rader.find(r => r.term === 'ödem').href, 'ordlista-oe.html#term-odem')
    eq('  och sökrutan är INTE avslagen', w.input.disabled, false)
  }
  {
    // Bådadera faller → säg det i stället för att låtsas söka.
    const w = makeWorld()
    await w.type('ödem')
    await w.fail(INDEX_URL)
    await w.fail(DATA_URL)
    eq('båda hämtningarna faller → sökrutan slås av', w.input.disabled, true)
    eq('  med en förklarande platshållare', w.input.placeholder, 'Sök är inte tillgänglig offline')
  }

  /* --- Sammanfattning ------------------------------------------------------ */
  console.log(`\ntest_ordlista_sok: ${pass} gröna, ${fails.length} röda`)
  if (fails.length) {
    console.log('\nRöda tester:')
    fails.forEach(f => console.log('  ✗ ' + f))
    process.exit(1)
  }
  process.exit(0)
}

main().catch(err => { console.error(err); process.exit(1) })
