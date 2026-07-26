/* =========================================================
   test_verktyg_akutmedicin.js — tester för poängskalorna
   =========================================================
   Körs med:  node scripts/test_verktyg_akutmedicin.js
   Avslutar med kod 0 när allt är grönt, annars 1.

   Ett minimalt DOM-skal gör att js/akutmedicin.js kan köras och
   drivas på riktigt utan webbläsare – testerna träffar alltså den
   kod som faktiskt levereras, inte en kopia av logiken. Samma
   konstruktion som scripts/test_verktyg_lakemedel.js; skillnaden är
   att den här modulen hämtar sitt facit med fetch, så skalet stubbar
   även det och läser data/akutmedicin.json från disk.

   Skalet modellerar DOM-trädet och händelserna, INTE layouten.
   Bredder, marginaler och radbrytningar kan det omöjligt fånga.
   Poängsättning, band, texter och lägesbyten fångar det däremot.

   VARIFRÅN FACIT KOMMER (akutmedicin_verktyg_todo.md §3d):
   NEWS2:s poängtabell är instrumentets primärkälla – Royal College
   of Physicians (2017). Varje intervallgräns i tabellen prövas här
   åt BÅDA håll: det sista värdet i ett band och det första i nästa.
   Det är en starkare kontroll än ett handfull patientexempel, för
   den fångar precis den feltyp en poängtabell drabbas av, nämligen
   att en gräns hamnar en enhet fel. Inga siffror är uträknade av
   mig; de är avlästa ur tabellen.

   Kör det här skriptet efter varje ändring i js/akutmedicin.js eller
   data/akutmedicin.json.
   ========================================================= */

const fs = require('fs');
const path = require('path');

const ROT = path.join(__dirname, '..');
const FACIT = path.join(ROT, 'data', 'akutmedicin.json');

/* ---------- DOM-skal ---------- */

class El {
  constructor(tag) {
    this.tagName = tag.toUpperCase();
    this.children = [];
    this.parent = null;
    this._attrs = {};
    this._listeners = {};
    this._class = new Set();
    this.dataset = {};
    this.style = {};
    this._text = '';
    this.hidden = false;
    this.disabled = false;
    this.value = '';
    this.selected = false;
    this.classList = {
      add: (c) => this._class.add(c),
      remove: (c) => this._class.delete(c),
      contains: (c) => this._class.has(c),
      toggle: (c, on) => {
        if (on === undefined) on = !this._class.has(c);
        on ? this._class.add(c) : this._class.delete(c);
      }
    };
  }
  get className() { return [...this._class].join(' '); }
  set className(v) { this._class = new Set(String(v).split(/\s+/).filter(Boolean)); }
  get textContent() {
    if (this.children.length) return this.children.map(c => c.textContent).join('');
    return this._text;
  }
  set textContent(v) { this._text = String(v); this.children = []; }
  set innerHTML(v) { this.children = []; this._text = v === '' ? '' : String(v); }
  get innerHTML() { return this._text; }
  appendChild(c) { c.parent = this; this.children.push(c); return c; }
  setAttribute(k, v) { this._attrs[k] = String(v); }
  getAttribute(k) { return this._attrs[k]; }
  addEventListener(t, fn) { (this._listeners[t] = this._listeners[t] || []).push(fn); }
  focus() {}
  fire(type, ev) {
    (this._listeners[type] || []).forEach(fn =>
      fn.call(this, Object.assign({ key: '', preventDefault() {} }, ev || {})));
  }
  find(pred) {
    if (pred(this)) return this;
    for (const c of this.children) { const r = c.find(pred); if (r) return r; }
    return null;
  }
  findAll(pred, acc = []) {
    if (pred(this)) acc.push(this);
    this.children.forEach(c => c.findAll(pred, acc));
    return acc;
  }
}

class SelectEl extends El {
  constructor() { super('select'); this._value = null; }
  appendChild(c) {
    super.appendChild(c);
    if (c.tagName === 'OPTION' && (c.selected || this._value === null)) this._value = c.value;
    return c;
  }
  get value() { return this._value; }
  set value(v) { this._value = v; }
}

/* Monteringspunkten på sidan: <div data-akut="news2"></div>. */
const plats = new El('div');
plats.setAttribute('data-akut', 'news2');
const utanJs = new El('div');

const registry = { 'akut-utan-js': utanJs };

global.document = {
  readyState: 'complete',
  createElement: (t) => (t === 'select' ? new SelectEl() : new El(t)),
  getElementById: (id) => registry[id] || null,
  addEventListener: () => {},
  querySelector: (sel) => (sel === '[data-akut]' ? plats : null),
  querySelectorAll: (sel) => (sel === '[data-akut]' ? [plats] : [])
};

/* Modulen hämtar facit med fetch. Skalet läser samma fil från disk,
   så testet körs mot den JSON som faktiskt levereras. */
global.fetch = (url) => {
  if (url !== '/data/akutmedicin.json') {
    return Promise.resolve({ ok: false, status: 404, statusText: 'Not Found' });
  }
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve(JSON.parse(fs.readFileSync(FACIT, 'utf8')))
  });
};

require(path.join(ROT, 'js', 'akutmedicin.js'));

/* ---------- testhjälpare ---------- */

let fel = 0, ok = 0;

function pastå(namn, fick, vantat) {
  const bra = String(fick).trim() === String(vantat).trim();
  if (bra) { ok++; }
  else {
    fel++;
    console.log('  FEL  ' + namn + '\n         fick:    ' + fick +
                '\n         väntat:  ' + vantat);
  }
}

function paståMed(namn, fick, del) {
  const bra = String(fick).includes(del);
  if (bra) { ok++; }
  else {
    fel++;
    console.log('  FEL  ' + namn + '\n         fick:    ' + fick +
                '\n         skulle innehålla: ' + del);
  }
}

function rubrik(t) { console.log('\n' + t); }

/* ---------- kortets delar ---------- */

let kort, falt, ut, band, krit, varn, svarsruta, lagesknappar, nollknapp;

function plocka() {
  kort = plats.children[0];
  falt = {};
  kort.findAll(e => e._class.has('vt-field')).forEach(f => {
    falt[f.dataset.falt] = {
      el: f,
      input: f.find(e => e.tagName === 'INPUT'),
      valjare: f.find(e => e.tagName === 'SELECT'),
      poang: f.find(e => e._class.has('vt-poang'))
    };
  });
  ut = kort.find(e => e._class.has('vt-out'));
  band = kort.find(e => e._class.has('vt-band'));
  krit = kort.find(e => e._class.has('vt-krit'));
  varn = kort.find(e => e._class.has('vt-warn'));
  svarsruta = kort.find(e => e._class.has('vt-svarsruta'));
  lagesknappar = kort.find(e => e._class.has('vt-mode')).children;
  nollknapp = kort.find(e => e._class.has('vt-nollstall')).children[0];
}

const utVarde = () => ut.children.find(c => c._class.has('vt-out-value')).textContent;
const utCalc = () => ut.children.find(c => c._class.has('vt-calc')).textContent;
const bandTitel = () => band.children.find(c => c._class.has('vt-band-titel')).textContent;
const bandNiva = () => band.className;
const chip = (namn) => falt[namn].poang.textContent;

function skriv(namn, v) {
  falt[namn].input.value = String(v);
  falt[namn].input.fire('input');
}
function valj(namn, v) {
  falt[namn].valjare.value = v;
  falt[namn].valjare.fire('change');
}
function lage(text) {
  lagesknappar.find(b => b.textContent === text).fire('click');
}

/* Frisk vuxen: alla parametrar i sitt nollpoängsband. */
const NORMAL = { af: 18, spo2: 97, sbt: 125, puls: 72, temp: 37 };

function normal(avvikelser) {
  nollknapp.fire('click');
  const v = Object.assign({}, NORMAL, avvikelser || {});
  ['af', 'spo2', 'sbt', 'puls', 'temp'].forEach(n => skriv(n, v[n]));
  return v;
}

/** Poängen ETT värde ger i sin parameter, allt annat normalt. */
function poangFor(namn, varde, val) {
  normal({ [namn]: varde });
  if (val) Object.keys(val).forEach(k => valj(k, val[k]));
  const c = chip(namn);
  const m = /^(\d+) p/.exec(c);
  return m ? Number(m[1]) : c;
}

/** Poängen för ett valfält. */
function poangForVal(namn, varde) {
  normal();
  valj(namn, varde);
  const m = /^(\d+) p/.exec(chip(namn));
  return m ? Number(m[1]) : chip(namn);
}

/* ---------- körningen ---------- */

async function kör() {
  /* fetch löses i en mikrotask; två varv räcker för att monteringen
     ska vara klar innan första påståendet. */
  await new Promise(r => setTimeout(r, 0));
  await new Promise(r => setTimeout(r, 0));

  if (!plats.children.length) {
    console.log('FEL: ingen skala monterades i <div data-akut="news2">.');
    process.exit(1);
  }
  plocka();

  rubrik('Montering');
  pastå('kortets id', kort.id, 'akut-news2');
  pastå('rubriken', kort.find(e => e.tagName === 'H3').textContent,
        'NEWS2 – tidig varningspoäng');
  pastå('sju parametrar + skalväljaren', Object.keys(falt).length, 8);
  pastå('rutan för avstängt JS döljs', utanJs.hidden, true);

  rubrik('Tomt läge');
  nollknapp.fire('click');
  pastå('uppmaning', utVarde(), 'Fyll i 5 parametrar till.');
  pastå('inget band visas', band.hidden, true);
  skriv('af', 18); skriv('spo2', 97); skriv('sbt', 125); skriv('puls', 72);
  pastå('en kvar nämns vid namn', utVarde(), 'Fyll i kroppstemperatur också.');
  pastå('ifyllt fält får sin poäng ändå', chip('af'), '0 p · 12–20');

  /* ---- Andningsfrekvens (RCP 2017) ---- */
  rubrik('Andningsfrekvens – varje bandgräns åt båda håll');
  [[7, 3], [8, 3], [9, 1], [11, 1], [12, 0], [20, 0],
   [21, 2], [24, 2], [25, 3], [40, 3]].forEach(([v, p]) =>
    pastå('AF ' + v, poangFor('af', v), p));

  /* ---- Syresaturation, skala 1 ---- */
  rubrik('Syresaturation, mättnadsskala 1');
  [[90, 3], [91, 3], [92, 2], [93, 2], [94, 1], [95, 1], [96, 0], [100, 0]]
    .forEach(([v, p]) => pastå('SpO₂ ' + v + ' %', poangFor('spo2', v), p));

  /* ---- Syresaturation, skala 2 på luft ---- */
  rubrik('Syresaturation, mättnadsskala 2 – på luft');
  [[82, 3], [83, 3], [84, 2], [85, 2], [86, 1], [87, 1], [88, 0], [92, 0],
   [93, 0], [97, 0], [100, 0]].forEach(([v, p]) =>
    pastå('SpO₂ ' + v + ' % (skala 2, luft)',
          poangFor('spo2', v, { skala: '2', syrgas: 'luft' }), p));

  /* ---- Syresaturation, skala 2 med syrgas ---- */
  rubrik('Syresaturation, mättnadsskala 2 – med syrgas');
  [[83, 3], [86, 1], [88, 0], [92, 0], [93, 1], [94, 1], [95, 2], [96, 2],
   [97, 3], [100, 3]].forEach(([v, p]) =>
    pastå('SpO₂ ' + v + ' % (skala 2, syrgas)',
          poangFor('spo2', v, { skala: '2', syrgas: 'syrgas' }), p));

  rubrik('Luft eller syrgas');
  pastå('luft', poangForVal('syrgas', 'luft'), 0);
  pastå('syrgas', poangForVal('syrgas', 'syrgas'), 2);
  normal(); valj('skala', '2');
  pastå('skalvalet ger ingen poäng', chip('skala'), 'ger ingen poäng');

  /* ---- Systoliskt blodtryck ---- */
  rubrik('Systoliskt blodtryck');
  [[89, 3], [90, 3], [91, 2], [100, 2], [101, 1], [110, 1], [111, 0],
   [219, 0], [220, 3], [250, 3]].forEach(([v, p]) =>
    pastå('BT ' + v + ' mmHg', poangFor('sbt', v), p));

  /* ---- Puls ---- */
  rubrik('Puls');
  [[39, 3], [40, 3], [41, 1], [50, 1], [51, 0], [90, 0], [91, 1], [110, 1],
   [111, 2], [130, 2], [131, 3], [180, 3]].forEach(([v, p]) =>
    pastå('puls ' + v, poangFor('puls', v), p));

  /* ---- Kroppstemperatur ---- */
  rubrik('Kroppstemperatur');
  [[34.9, 3], [35.0, 3], [35.1, 1], [36.0, 1], [36.1, 0], [38.0, 0],
   [38.1, 1], [39.0, 1], [39.1, 2], [41, 2]].forEach(([v, p]) =>
    pastå('temp ' + v + ' °C', poangFor('temp', v), p));
  pastå('svenskt decimalkomma', poangFor('temp', '38,5'), 1);
  /* Ingen gräns får lämna ett glapp: gränserna skrivs som tak, inte
     som par, just för att 35,05 annars hamnar mellan två band. */
  pastå('35,05 °C faller i ett band', poangFor('temp', '35,05'), 1);

  /* ---- Medvetandegrad ---- */
  rubrik('Medvetandegrad (ACVPU)');
  [['A', 0], ['C', 3], ['V', 3], ['P', 3], ['U', 3]].forEach(([v, p]) =>
    pastå('ACVPU ' + v, poangForVal('acvpu', v), p));

  /* ---- Summan och svarstabellen ---- */
  rubrik('Summan och svarstabellen');
  normal();
  pastå('frisk vuxen ger 0', utVarde(), '0 poäng');
  pastå('uträkningen skrivs ut', utCalc(), '0 + 0 + 0 + 0 + 0 + 0 + 0 = 0');
  pastå('bandet', bandTitel(), 'Ingen förhöjd risk');
  pastå('bandets nivå', bandNiva(), 'vt-band is-ingen');
  paståMed('övervakningsraden', band.textContent, 'Minst var tolfte timme.');
  pastå('ingen röd poäng', krit.hidden, true);

  normal({ puls: 95 });                       // 1 poäng
  pastå('1 poäng ger låg risk', bandTitel(), 'Låg risk');
  pastå('nivån', bandNiva(), 'vt-band is-lag');

  normal({ af: 22, puls: 95, temp: 38.5 });   // 2 + 1 + 1 = 4
  pastå('4 poäng är fortfarande låg risk', utVarde(), '4 poäng');
  pastå('bandet vid 4', bandTitel(), 'Låg risk');
  pastå('ingen röd poäng vid 4 utan trea', krit.hidden, true);

  normal({ af: 26 });                          // en enskild trea, summa 3
  pastå('summan', utVarde(), '3 poäng');
  pastå('röd poäng lyfter bandet', bandTitel(), 'Låg till medelhög risk – röd poäng');
  pastå('nivån blir medel', bandNiva(), 'vt-band is-medel');
  pastå('anmärkningen visas', krit.hidden, false);
  paståMed('anmärkningen namnger parametern', krit.textContent, 'andningsfrekvens');

  normal({ af: 22, puls: 115, temp: 38.5 });   // 2 + 2 + 1 = 5
  pastå('5 poäng', utVarde(), '5 poäng');
  pastå('bandet vid 5', bandTitel(), 'Medelhög risk');

  normal({ af: 22, spo2: 93, puls: 115, temp: 38.5 }); // 2 + 2 + 2 + 1 = 7
  pastå('7 poäng', utVarde(), '7 poäng');
  pastå('bandet vid 7', bandTitel(), 'Hög risk');
  pastå('nivån', bandNiva(), 'vt-band is-hog');
  paståMed('åtgärdsraden', band.textContent, 'intensivvårdskompetens');

  /* Syrgasen räknas med i summan – det är den vanligaste missen när
     NEWS2 räknas för hand. */
  normal();
  valj('syrgas', 'syrgas');
  pastå('syrgas ensamt ger 2', utVarde(), '2 poäng');
  pastå('bandet', bandTitel(), 'Låg risk');

  /* ---- Rimlighetskontrollen ---- */
  rubrik('Rimlighetskontroll');
  normal();
  pastå('ingen varning på normala värden', varn.hidden, true);
  normal({ spo2: 9 });
  pastå('varning vid uppenbar felskrivning', varn.hidden, false);
  paståMed('varningen pekar ut parametern', varn.textContent, 'syresaturation');
  paståMed('poängen räknas ändå', utVarde(), 'poäng');

  /* ---- Träningsläget ---- */
  rubrik('Träningsläget');
  normal({ af: 22, puls: 115, temp: 38.5 });   // facit 5
  lage('Träna');
  pastå('summan döljs', ut.hidden, true);
  pastå('bandet döljs', band.hidden, true);
  pastå('svarsrutan visas', svarsruta.hidden, false);
  pastå('poängen per parameter döljs', chip('af'), 'räkna själv');
  const svarInput = svarsruta.find(e => e.tagName === 'INPUT');
  const svarKnapp = svarsruta.find(e => e.tagName === 'BUTTON');
  const domruta = svarsruta.children[svarsruta.children.length - 1];
  svarInput.value = '4';
  svarKnapp.fire('click');
  pastå('fel svar markeras', domruta.className, 'vt-dom fel');
  paståMed('facit visas', domruta.textContent, 'Rätt summa är 5 poäng');
  paståMed('uträkningen visas', domruta.textContent, 'andningsfrekvens 2');
  svarInput.value = '5';
  svarKnapp.fire('click');
  pastå('rätt svar markeras', domruta.className, 'vt-dom ratt');
  paståMed('bandet följer med', domruta.textContent, 'Medelhög risk');
  svarInput.value = '5,5';
  svarKnapp.fire('click');
  paståMed('decimaltal avvisas', domruta.textContent, 'heltal');
  lage('Räkna');
  pastå('tillbaka i räkneläget', ut.hidden, false);
  pastå('poängen syns igen', chip('af'), '2 p · 21–24');

  /* ---- Nollställ ---- */
  rubrik('Nollställ');
  normal({ af: 26 });
  valj('acvpu', 'U');
  valj('skala', '2');
  nollknapp.fire('click');
  pastå('talfälten töms', falt.af.input.value, '');
  pastå('valen går till utgångsläget', falt.acvpu.valjare.value, 'A');
  pastå('skalan återställs', falt.skala.valjare.value, '1');
  pastå('uppmaningen är tillbaka', utVarde(), 'Fyll i 5 parametrar till.');

  console.log('\n' + (fel === 0
    ? `ALLA ${ok} TESTER GRÖNA`
    : `${fel} FEL av ${ok + fel} tester`));
  process.exit(fel === 0 ? 0 : 1);
}

kör();
