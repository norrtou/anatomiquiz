/**
 * info.js — Om-sidan (info.html)
 *
 * Renderar frågestatistik, ordlistans omfattning och kontaktformuläret.
 *
 * Ändringsloggen visas här bara som teaser (de tre senaste versionerna);
 * hela historiken bor på versionshistorik.html. Parsning/rendering ligger i
 * js/changelog.js, som laddas före den här filen och även tillhandahåller
 * escapeHtml() till statistiktabellen nedan.
 */

// Antal versioner i teasern på info.html. Hela listan finns på versionshistorik.html.
// Håll i synk med ENTRIES i scripts/generate_changelog_teaser.py.
const TEASER_ENTRIES = 3

// Färdigparsad teaser (~10 KB) i stället för hela CHANGELOG.md (~420 KB).
// Genereras av scripts/generate_changelog_teaser.py via pre-commit-hooken.
const TEASER_URL = './changelog-latest.json'

// ============================================================================
// Frågestatistik
// ============================================================================

// Ämnen grupperade per utbildning — samma indelning som ämnesväljaren på
// startsidan (data-edu). fc: true = flashcard-ämne (kort i stället för frågor).
// Håll i synk med getQuestionsPath() i app.js.
const EDUCATIONS = [
  { name: 'Allmänt', topics: [
    { label: 'Farmakologi',                 file: './data/farmakologi.json', fc: true },
  ]},
  { name: 'Arbetsterapeut', topics: [
    { label: 'Tentaplugg',                  file: './data/tentaplugg.json' },
    { label: 'ATP-studenters flashcards',   file: './data/studenters_flashcards.json', fc: true },
    { label: 'Ben',                         file: './data/ben.json' },
    { label: 'Blodomloppet',                file: './data/blodomloppet.json' },
    { label: 'Ergonomi',                    file: './data/ergonomi.json' },
    { label: 'Grepp',                       file: './data/grepp.json' },
    { label: 'Handen',                      file: './data/handen.json' },
    { label: 'Handens ben (bilder)',        file: './data/handens_ben_bilder.json' },
    { label: 'Handens leder (bilder)',      file: './data/handens_leder_bilder.json' },
    { label: 'Ledtyper',                    file: './data/ledtyper.json' },
    { label: 'Lägen & riktningar',          file: './data/riktningar.json' },
    { label: 'Medicinsk terminologi',       file: './data/medicinsk_terminologi.json' },
    { label: 'Muskler – flashcards',        file: './data/muskler_flashcards.json', fc: true },
    { label: 'Muskler',                     file: './data/muskler.json' },
    { label: 'Neurologi',                   file: './data/neurologi.json' },
    { label: 'Olika åldrar',                file: './data/olika_aldrar.json' },
    { label: 'Skuldra',                     file: './data/skuldran.json' },
  ]},
  { name: 'Sjuksköterska', topics: [
    { label: 'Medicinsk latin',             file: './data/medicinsk_latin.json' },
    { label: 'Blandad anatomi/fysiologi – flashcards', file: './data/anatomi_fysiologi_flashcards.json', fc: true },
    { label: 'Läkemedelsräkning',           file: './data/lakemedelsrakning.json' },
    // Organsystems-ämnena ligger i en delad fil (data/sjukskoterska.json), åtskilda av topic.
    { label: 'Cell, vävnad & homeostas',    file: './data/sjukskoterska.json', topic: 'ssk_cell_vavnad' },
    { label: 'Vitalparametrar & normalvärden', file: './data/sjukskoterska.json', topic: 'ssk_vitalparametrar' },
    { label: 'Cirkulationssystemet',        file: './data/sjukskoterska.json', topic: 'ssk_cirkulation' },
    { label: 'Blodet',                      file: './data/sjukskoterska.json', topic: 'ssk_blodet' },
    { label: 'Respirationssystemet',        file: './data/sjukskoterska.json', topic: 'ssk_respiration' },
    { label: 'Nervsystemet',                file: './data/sjukskoterska.json', topic: 'ssk_nervsystemet' },
    { label: 'Rörelseapparaten',            file: './data/sjukskoterska.json', topic: 'ssk_rorelseapparaten' },
    { label: 'Matsmältning & näringslära',  file: './data/sjukskoterska.json', topic: 'ssk_matsmaltning_naring' },
    { label: 'Njurar & urinvägar',          file: './data/sjukskoterska.json', topic: 'ssk_njurar_urinvagar' },
    { label: 'Endokrina systemet',          file: './data/sjukskoterska.json', topic: 'ssk_endokrina' },
    { label: 'Huden (integumentet)',        file: './data/sjukskoterska.json', topic: 'ssk_huden' },
    { label: 'Immunförsvar & lymfsystem',   file: './data/sjukskoterska.json', topic: 'ssk_immun_lymf' },
    { label: 'Reproduktion, graviditet & förlossning', file: './data/sjukskoterska.json', topic: 'ssk_reproduktion_graviditet' },
    { label: 'Vätske-, elektrolyt- & syra-basbalans', file: './data/sjukskoterska.json', topic: 'ssk_vatska_elektrolyt_syrabas' },
    { label: 'Åldrande & livscykelperspektiv', file: './data/sjukskoterska.json', topic: 'ssk_aldrande_livscykel' },
  ]},
  // De topografiska läkarämnena ligger i en delad fil (data/lakare.json),
  // åtskilda av postens topic-fält → varje rad filtreras via `topic`.
  { name: 'Läkare', topics: [
    { label: 'Blandad anatomi/fysiologi',   file: './data/lakare_anatomi_fysiologi.json' },
    { label: 'Övre extremitet',             file: './data/lakare.json', topic: 'lakare_ovre_extremitet' },
    { label: 'Nedre extremitet',            file: './data/lakare.json', topic: 'lakare_nedre_extremitet' },
    { label: 'Thorax',                      file: './data/lakare.json', topic: 'lakare_thorax' },
    { label: 'Buk/abdomen',                 file: './data/lakare.json', topic: 'lakare_buk' },
    { label: 'Bäcken & perineum',           file: './data/lakare.json', topic: 'lakare_backen_perineum' },
    { label: 'Rygg & columna',              file: './data/lakare.json', topic: 'lakare_rygg_columna' },
    { label: 'Huvud & hals',                file: './data/lakare.json', topic: 'lakare_huvud_hals' },
    { label: 'Neuroanatomi (CNS)',          file: './data/lakare.json', topic: 'lakare_neuroanatomi' },
    { label: 'Kardiovaskulära systemet',    file: './data/lakare.json', topic: 'lakare_kardiovaskular' },
    { label: 'Respirationssystemet',        file: './data/lakare.json', topic: 'lakare_respiration' },
    { label: 'Njure & vätskebalans',        file: './data/lakare.json', topic: 'lakare_njure_vatska' },
    { label: 'Gastrointestinalt & ämnesomsättning', file: './data/lakare.json', topic: 'lakare_gastro_amnesoms' },
    { label: 'Endokrina systemet',          file: './data/lakare.json', topic: 'lakare_endokrina' },
    { label: 'Blod & immunförsvar',         file: './data/lakare.json', topic: 'lakare_blod_immun' },
    { label: 'Reproduktion',                file: './data/lakare.json', topic: 'lakare_reproduktion' },
    { label: 'Histologi',                   file: './data/lakare.json', topic: 'lakare_histologi' },
    { label: 'Embryologi',                  file: './data/lakare.json', topic: 'lakare_embryologi' },
    { label: 'Cell- & membranfysiologi',    file: './data/lakare.json', topic: 'lakare_cell_membranfys' },
  ]},
  // Fysioterapeut-ämnena ligger alla i en delad fil (data/fysioterapeut.json),
  // åtskilda av postens topic-fält → varje rad filtreras via `topic`.
  { name: 'Fysioterapeut', topics: [
    { label: 'Axel/skulderkomplex',         file: './data/fysioterapeut.json', topic: 'fysio_axel_skulder' },
    { label: 'Armbåge & underarm',          file: './data/fysioterapeut.json', topic: 'fysio_armbage_underarm' },
    { label: 'Hand & handled',              file: './data/fysioterapeut.json', topic: 'fysio_hand_handled' },
    { label: 'Höft & bäcken',               file: './data/fysioterapeut.json', topic: 'fysio_hoft_backen' },
    { label: 'Knä',                         file: './data/fysioterapeut.json', topic: 'fysio_kna' },
    { label: 'Fot & fotled',                file: './data/fysioterapeut.json', topic: 'fysio_fot_fotled' },
    { label: 'Columna/ryggrad',             file: './data/fysioterapeut.json', topic: 'fysio_columna' },
    { label: 'Nervsystemet',                file: './data/fysioterapeut.json', topic: 'fysio_nervsystemet' },
    { label: 'Muskelfysiologi',             file: './data/fysioterapeut.json', topic: 'fysio_muskelfysiologi' },
    { label: 'Kardiovaskulär & respiratorisk fysiologi', file: './data/fysioterapeut.json', topic: 'fysio_kardio_resp' },
    { label: 'Led- & skelettlära',          file: './data/fysioterapeut.json', topic: 'fysio_led_skelett' },
    { label: 'Smärtfysiologi',              file: './data/fysioterapeut.json', topic: 'fysio_smartfysiologi' },
    { label: 'Motorisk utveckling & åldrande', file: './data/fysioterapeut.json', topic: 'fysio_motorisk_utv_aldrande' },
    { label: 'Tränings-/arbetsfysiologi',   file: './data/fysioterapeut.json', topic: 'fysio_traning_arbetsfys' },
  ]},
  // Logoped-ämnena ligger alla i en delad fil (data/logoped.json),
  // åtskilda av postens topic-fält → varje rad filtreras via `topic`.
  { name: 'Logoped', topics: [
    { label: 'Andningsapparaten',           file: './data/logoped.json', topic: 'logoped_andningsapparaten' },
    { label: 'Röst-/fonationsapparaten (larynx)', file: './data/logoped.json', topic: 'logoped_larynx_fonation' },
    { label: 'Artikulation & resonans (ansatsröret)', file: './data/logoped.json', topic: 'logoped_artikulation_resonans' },
    { label: 'Sväljningsapparaten',                  file: './data/logoped.json', topic: 'logoped_svaljning' },
    { label: 'Neuroanatomi för tal & språk',          file: './data/logoped.json', topic: 'logoped_neuroanatomi_tal' },
    { label: 'Örat & hörselsystemet',                 file: './data/logoped.json', topic: 'logoped_orat_horsel' },
  ]},
  // Tandläkare-ämnena ligger alla i en delad fil (data/tandlakare.json),
  // åtskilda av postens topic-fält → varje rad filtreras via `topic`.
  { name: 'Tandläkare', topics: [
    { label: 'Tand & parodontium',          file: './data/tandlakare.json', topic: 'tandlakare_tand_parodontium' },
    { label: 'Käkar & käkled (TMJ)',        file: './data/tandlakare.json', topic: 'tandlakare_kakar_kakled' },
    { label: 'Munhåla & munbotten',         file: './data/tandlakare.json', topic: 'tandlakare_munhala_munbotten' },
    { label: 'Huvud-hals: kärl & nerver',   file: './data/tandlakare.json', topic: 'tandlakare_huvud_hals_karl_nerver' },
    { label: 'Salivkörtlar & oral fysiologi', file: './data/tandlakare.json', topic: 'tandlakare_salivkortlar_oral_fys' },
  ]},
  // Apotekar-ämnena ligger alla i en delad fil (data/apotekare.json),
  // åtskilda av postens topic-fält → varje rad filtreras via `topic`.
  { name: 'Apotekare', topics: [
    { label: 'Cell, receptorer & signalering', file: './data/apotekare.json', topic: 'apotekare_cell_receptorer' },
    { label: 'Nervsystemet & autonom fysiologi', file: './data/apotekare.json', topic: 'apotekare_nervsystem_autonom' },
    { label: 'Hjärta & cirkulation',        file: './data/apotekare.json', topic: 'apotekare_hjarta_cirkulation' },
    { label: 'Mag-tarmkanal & lever',       file: './data/apotekare.json', topic: 'apotekare_magtarm_lever' },
    { label: 'Njurar & utsöndring',         file: './data/apotekare.json', topic: 'apotekare_njurar_utsondring' },
  ]},
  // Audionom-ämnena ligger alla i en delad fil (data/audionom.json),
  // åtskilda av postens topic-fält → varje rad filtreras via `topic`.
  { name: 'Audionom', topics: [
    { label: 'Ytter- & mellanöra',          file: './data/audionom.json', topic: 'audionom_ytter_mellanora' },
    { label: 'Innerörat – cochlea',         file: './data/audionom.json', topic: 'audionom_innerorat_cochlea' },
    { label: 'Balansorganet (vestibularis)', file: './data/audionom.json', topic: 'audionom_balansorganet' },
    { label: 'Hörselnerven & centrala hörselbanan', file: './data/audionom.json', topic: 'audionom_horselnerven_central' },
    { label: 'Ljud- & hörselfysiologi',     file: './data/audionom.json', topic: 'audionom_ljud_horselfysiologi' },
  ]},
  // Optiker-ämnena ligger alla i en delad fil (data/optiker.json),
  // åtskilda av postens topic-fält → varje rad filtreras via `topic`.
  { name: 'Optiker', topics: [
    { label: 'Främre segmentet',            file: './data/optiker.json', topic: 'optiker_framre_segmentet' },
    { label: 'Lins & ackommodation',        file: './data/optiker.json', topic: 'optiker_lins_ackommodation' },
    { label: 'Bakre segmentet',             file: './data/optiker.json', topic: 'optiker_bakre_segmentet' },
    { label: 'Synfysiologi & perception',   file: './data/optiker.json', topic: 'optiker_synfysiologi' },
    { label: 'Ögonrörelser & binokulärseende', file: './data/optiker.json', topic: 'optiker_ogonrorelser_binokular' },
  ]},
  // Biomedicinsk analytiker-ämnena ligger alla i en delad fil
  // (data/biomedicinsk_analytiker.json), åtskilda av postens topic-fält.
  { name: 'Biomedicinsk analytiker', topics: [
    { label: 'Cell & vävnad (morfologi)',   file: './data/biomedicinsk_analytiker.json', topic: 'bma_cell_vavnad' },
    { label: 'Blod & blodbildning',         file: './data/biomedicinsk_analytiker.json', topic: 'bma_blod_blodbildning' },
    { label: 'Hjärta & cirkulation',        file: './data/biomedicinsk_analytiker.json', topic: 'bma_hjarta_cirkulation' },
    { label: 'Respiration & lungor',        file: './data/biomedicinsk_analytiker.json', topic: 'bma_respiration_lungor' },
    { label: 'Nervsystem & muskler',        file: './data/biomedicinsk_analytiker.json', topic: 'bma_nervsystem_muskler' },
    { label: 'Njurar & urinvägar',          file: './data/biomedicinsk_analytiker.json', topic: 'bma_njurar_urinvagar' },
    { label: 'Matsmältning, lever & ämnesomsättning', file: './data/biomedicinsk_analytiker.json', topic: 'bma_matsmaltning_lever' },
    { label: 'Endokrina systemet',          file: './data/biomedicinsk_analytiker.json', topic: 'bma_endokrina' },
    { label: 'Immunsystem & lymfatiska organ', file: './data/biomedicinsk_analytiker.json', topic: 'bma_immun_lymfatiska' },
    { label: 'Hjärtats elektrofysiologi & EKG', file: './data/biomedicinsk_analytiker.json', topic: 'bma_ekg_elektrofys' },
    { label: 'Respirationsfysiologi & spirometri', file: './data/biomedicinsk_analytiker.json', topic: 'bma_spirometri' },
    { label: 'Kärl- & cirkulationsfysiologi', file: './data/biomedicinsk_analytiker.json', topic: 'bma_karl_cirkulationsfys' },
    { label: 'Klinisk neurofysiologi', file: './data/biomedicinsk_analytiker.json', topic: 'bma_neurofysiologi' },
    { label: 'Njur-, gastrofysiologi & nuklearmedicin', file: './data/biomedicinsk_analytiker.json', topic: 'bma_njur_gastro_nuklear' },
    { label: 'Klinisk kemi & organmarkörer', file: './data/biomedicinsk_analytiker.json', topic: 'bma_klinisk_kemi' },
    { label: 'Hematologi & transfusionsmedicin', file: './data/biomedicinsk_analytiker.json', topic: 'bma_hematologi_transfusion' },
    { label: 'Mikrobiologi & immunologi', file: './data/biomedicinsk_analytiker.json', topic: 'bma_mikrobiologi_immunologi' },
    { label: 'Patologi & histopatologisk morfologi', file: './data/biomedicinsk_analytiker.json', topic: 'bma_patologi' },
  ]},
  // Röntgensjuksköterska-ämnena ligger alla i en delad fil
  // (data/rontgensjukskoterska.json), åtskilda av postens topic-fält.
  { name: 'Röntgensjuksköterska', topics: [
    { label: 'Thorax',                      file: './data/rontgensjukskoterska.json', topic: 'rtg_thorax' },
    { label: 'Buk & retroperitoneum',       file: './data/rontgensjukskoterska.json', topic: 'rtg_buk_retroperitoneum' },
    { label: 'Skelett & extremiteter',      file: './data/rontgensjukskoterska.json', topic: 'rtg_skelett_extremiteter' },
    { label: 'Columna/ryggrad',             file: './data/rontgensjukskoterska.json', topic: 'rtg_columna' },
    { label: 'Skalle & hjärna',             file: './data/rontgensjukskoterska.json', topic: 'rtg_skalle_hjarna' },
    { label: 'Huvud-hals & ansiktsskelett', file: './data/rontgensjukskoterska.json', topic: 'rtg_huvud_hals' },
    { label: 'Bäcken & höft',               file: './data/rontgensjukskoterska.json', topic: 'rtg_backen_hoft' },
    { label: 'Kärlanatomi',                 file: './data/rontgensjukskoterska.json', topic: 'rtg_karlanatomi' },
    { label: 'Cirkulation & hjärtfunktion', file: './data/rontgensjukskoterska.json', topic: 'rtg_cirkulation_hjarta' },
    { label: 'Njurfunktion & utsöndring',   file: './data/rontgensjukskoterska.json', topic: 'rtg_njurfunktion' },
    { label: 'Andning & rörelse',           file: './data/rontgensjukskoterska.json', topic: 'rtg_andning_rorelse' },
    { label: 'Snittanatomi',                file: './data/rontgensjukskoterska.json', topic: 'rtg_snittanatomi' },
    { label: 'Projektionslära & lägesterminologi', file: './data/rontgensjukskoterska.json', topic: 'rtg_projektionslara' },
    { label: 'Modalitetsspecifik bildanatomi', file: './data/rontgensjukskoterska.json', topic: 'rtg_modalitetsspecifik' },
    { label: 'Kontrastmedel & fördelning',  file: './data/rontgensjukskoterska.json', topic: 'rtg_kontrastmedel' },
  ]},
  // Medicinsk sekreterare-ämnena ligger alla i en delad fil
  // (data/medicinsk_sekreterare.json), åtskilda av postens topic-fält.
  { name: 'Medicinsk sekreterare', topics: [
    { label: 'Termens byggstenar',                          file: './data/medicinsk_sekreterare.json', topic: 'medsek_termens_byggstenar' },
    { label: 'Medicinsk latin: grammatik & deklinationer',  file: './data/medicinsk_sekreterare.json', topic: 'medsek_latin_deklinationer' },
    { label: 'Läges-, riktnings- & rörelsetermer',          file: './data/medicinsk_sekreterare.json', topic: 'medsek_lages_riktning_rorelse' },
    { label: 'Organsystemen & deras terminologi',           file: './data/medicinsk_sekreterare.json', topic: 'medsek_organsystemen_terminologi' },
    { label: 'Sjukdoms-, symtom- & åtgärdstermer',          file: './data/medicinsk_sekreterare.json', topic: 'medsek_sjukdom_symtom_atgard' },
    { label: 'Diagnosklassificering & kodning',             file: './data/medicinsk_sekreterare.json', topic: 'medsek_diagnoskodning' },
  ]},
]

const ORDLISTA_URL = './data/ordlista.json'

/**
 * Räknar frågor/kort i en datafil → {total}.
 * @param {string} file   Sökväg till JSON-fil.
 * @param {string} [topic] Om satt: räkna bara poster med q.topic === topic
 *   (flera ämnen kan dela en fil, t.ex. data/fysioterapeut.json).
 */
function countCards(file, topic) {
  return fetch(file).then(r => r.json()).then(data => {
    let items = Array.isArray(data) ? data : data.questions
    if (topic) items = items.filter(q => q.topic === topic)
    return { total: items.length }
  })
}

async function loadStats() {
  const container = document.getElementById('statsContent')
  container.innerHTML = '<p class="stats-loading">Laddar statistik…</p>'

  try {
    // Hämta alla ämnens antal parallellt och bygg en grupp (med delsumma) per utbildning.
    const groups = await Promise.all(EDUCATIONS.map(async edu => {
      const rows = await Promise.all(edu.topics.map(async t => ({ ...t, ...(await countCards(t.file, t.topic)) })))
      const sub = rows.reduce((a, r) => ({ total: a.total + r.total }), { total: 0 })
      return { name: edu.name, rows, sub }
    }))

    const grand = groups.reduce((a, g) => ({ total: a.total + g.sub.total }), { total: 0 })

    const tbody = groups.map(g => {
      const rows = g.rows.map(r => `
          <tr>
            <td>${escapeHtml(r.label)}</td>
            <td>${r.total}</td>
          </tr>`).join('')
      return `
          <tr class="stats-edu-row"><th colspan="2" scope="colgroup">${escapeHtml(g.name)}</th></tr>
          ${rows}
          <tr class="stats-subtotal-row">
            <td>Summa ${escapeHtml(g.name.toLowerCase())}</td>
            <td>${g.sub.total}</td>
          </tr>`
    }).join('')

    container.innerHTML = `
      <p class="stats-intro">Frågor och kort är indelade per utbildning, precis som i ämnesväljaren på startsidan.</p>
      <table class="stats-table" aria-label="Antal frågor och kort per utbildning och ämne">
        <thead>
          <tr><th>Ämne</th><th>Antal</th></tr>
        </thead>
        <tbody>
          ${tbody}
          <tr class="stats-total-row">
            <td>Totalt</td>
            <td>${grand.total}</td>
          </tr>
        </tbody>
      </table>`
  } catch {
    container.innerHTML = '<p class="stats-loading">Kunde inte ladda statistik.</p>'
  }
}

/**
 * Antal uppslagsord i medicinska ordlistan — live-termer (exkl. status "stub"),
 * räknat på samma sätt som ordlistesidan. Visas i #glossaryCount.
 */
async function loadGlossaryCount() {
  const elc = document.getElementById('glossaryCount')
  if (!elc) return
  try {
    const data = await fetch(ORDLISTA_URL).then(r => r.json())
    const live = data.filter(e => e.status !== 'stub').length
    elc.innerHTML = `Den medicinska ordlistan innehåller <strong>${live.toLocaleString('sv-SE')}</strong> uppslagsord. <a class="info-link" href="medicinskordlista.html">Öppna ordlistan →</a>`
  } catch {
    elc.textContent = 'Kunde inte ladda ordlistans omfattning.'
  }
}

// ============================================================================
// Kontaktformulär
// ============================================================================

const CONTACT_EMAIL = 'anatomiquizse@gmail.com'

/**
 * Fångar formulärets submit och öppnar besökarens e-postklient via mailto:
 * (GitHub Pages saknar backend; CSP form-action 'self' tillåter ingen riktig
 * mailto-submit, därför preventDefault + window.location).
 */
function initContactForm() {
  const form = document.getElementById('contactForm')
  if (!form) return
  form.addEventListener('submit', (e) => {
    e.preventDefault()
    const type = document.getElementById('contactType').value
    const messageEl = document.getElementById('contactMessage')
    const message = messageEl.value.trim()
    if (!message) { messageEl.focus(); return }
    const subject = `Anatomiquiz – ${type}`
    const body = `${message}\n\n— Skickat från ${location.href}`
    window.location.href =
      `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  })
}

// ============================================================================
// Init
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
  loadStats()
  loadGlossaryCount()
  initChangelog({ containerId: 'changelogContent', limit: TEASER_ENTRIES, url: TEASER_URL })
  initContactForm()
})
