// =============================================================================
// Bildhantering – central upplösning av innehållsbilder via registret
// data/bilder.json. EN fysisk bild per motiv; refereras via id från quiz och
// faktatexter så att återanvändning ALDRIG skapar dubletter.
// Bilderna ligger i en mappstruktur under /img/media/ (kategori + region);
// registrets file-fält bär hela den relativa sökvägen. Sökvägar är rot-absoluta
// så samma referens fungerar från rotsidor och från /kunskapsbank/.
// Regler: BILDER_REGLER.md.
// =============================================================================

const IMAGE_BASE = '/img/media/'
let _imageRegistry = null

// Hämtar och cachar bildregistret (images-kartan ur data/bilder.json). Robust:
// returnerar tom karta om filen saknas/inte kan läsas, så inget kraschar.
async function loadImageRegistry(){
  if(_imageRegistry) return _imageRegistry
  try{
    const res = await fetch('/data/bilder.json')
    _imageRegistry = res.ok ? ((await res.json()).images || {}) : {}
  }catch(e){
    console.error('Kunde inte läsa bildregistret:', e)
    _imageRegistry = {}
  }
  return _imageRegistry
}

// Metadata för en bild via id, eller null om den inte finns i registret.
function imageMeta(registry, id){
  return (registry && Object.prototype.hasOwnProperty.call(registry, id)) ? registry[id] : null
}

// Full rot-absolut URL till en bild via id (eller null om okänd). För statiska
// <img> i faktatexter som ändå vill slå upp sökvägen programmatiskt.
function imageSrc(registry, id){
  const m = imageMeta(registry, id)
  return m ? IMAGE_BASE + m.file : null
}

// Bygger ett <figure> med lazy-laddad <img> (alt ur registret) och, om licensen
// kräver kredit, en <figcaption>. Returnerar null + varnar om id saknas, så en
// felstavad referens aldrig renderar en trasig bild.
// altOverride: när bilden ÄR frågan (quiz) ska alt INTE avslöja svaret. Skicka då
// en neutral fråge-alt (t.ex. "Vilket ben visas på bilden?") så skärmläsare får en
// rättvis fråga i stället för registrets beskrivande alt (som är facit). I faktatext
// utelämnas altOverride och registrets beskrivande alt används.
function buildImageFigure(registry, id, altOverride){
  const m = imageMeta(registry, id)
  if(!m){ console.warn('Bild saknas i registret (data/bilder.json):', id); return null }
  const fig = document.createElement('figure')
  fig.className = 'content-image'
  const img = document.createElement('img')
  img.src = IMAGE_BASE + m.file
  img.alt = altOverride || m.alt || ''
  img.loading = 'lazy'
  img.decoding = 'async'
  fig.appendChild(img)
  if(m.credit){
    const cap = document.createElement('figcaption')
    cap.className = 'image-credit'
    cap.textContent = m.credit
    fig.appendChild(cap)
  }
  return fig
}
