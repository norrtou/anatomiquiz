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

/* Monteringspunkterna på sidorna: en <div data-akut="…"> per skala.
   Flera skalor monteras samtidigt, precis som på syra-bas.html. */
const SKALNAMN = ['news2', 'natrium_korrigerat', 'osmolalitet', 'blodgas',
                  'wells_dvt', 'perc', 'spesi', 'chadsva', 'has_bled',
                  'qtc', 'ehra', 'qsofa', 'sofa', 'dscrb65',
                  'gcs', 'rls85', 'fyra_at', 'befast', 'hints'];
const platser = {};
SKALNAMN.forEach((namn) => {
  const p = new El('div');
  p.setAttribute('data-akut', namn);
  platser[namn] = p;
});
const plats = platser.news2;   // bakåtkompatibelt namn för NEWS2-avsnittet nedan
const utanJs = new El('div');

const registry = { 'akut-utan-js': utanJs };

global.document = {
  readyState: 'complete',
  createElement: (t) => (t === 'select' ? new SelectEl() : new El(t)),
  getElementById: (id) => registry[id] || null,
  addEventListener: () => {},
  querySelector: (sel) => (sel === '[data-akut]' ? platser.news2 : null),
  querySelectorAll: (sel) => (sel === '[data-akut]' ? Object.values(platser) : [])
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

  SKALNAMN.forEach((namn) => {
    if (!platser[namn].children.length) {
      console.log('FEL: ingen skala monterades i <div data-akut="' + namn + '">.');
      process.exit(1);
    }
  });
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

  /* =========================================================
     Formelräknarna (mönster C): korrigerat natrium, osmolalitet
     =========================================================
     Ingen tabell att pröva bandgräns för bandgräns här — det är
     räkningen som är sanningen. Talen nedan är handräknade mot
     formlerna i js/akutmedicin.js (§0.3: mekanisk, entydig
     uträkning), med ett par medvetet runda indata (t.ex. P-glukos
     11,1 mmol/L = exakt det dubbla av referenspunkten 5,55) så att
     facit går att kontrollera för hand utan avrundningsfel. */

  function plockaFormel(namn, faltNamn, utdataNamn) {
    const kort = platser[namn].children[0];
    const falt = {};
    faltNamn.forEach((n) => {
      const f = kort.find((e) => e._class.has('vt-field') && e.dataset.falt === n);
      falt[n] = { input: f.find((e) => e.tagName === 'INPUT') };
    });
    const utEls = kort.findAll((e) => e._class.has('vt-out'));
    const svarEls = kort.findAll((e) => e._class.has('vt-svarsruta'));
    const rader = {};
    utdataNamn.forEach((n, i) => {
      const ut = utEls[i];
      const sv = svarEls[i];
      rader[n] = {
        ut,
        varde: ut.children[1],
        calc: ut.children[2],
        not: ut.children[3],
        svarsruta: sv,
        svarInput: sv.find((e) => e.tagName === 'INPUT'),
        svarKnapp: sv.find((e) => e.tagName === 'BUTTON'),
        dom: sv.children[sv.children.length - 1]
      };
    });
    return {
      kort, falt, rader,
      varn: kort.find((e) => e._class.has('vt-warn')),
      lagesknappar: kort.find((e) => e._class.has('vt-mode')).children,
      nollknapp: kort.find((e) => e._class.has('vt-nollstall')).children[0]
    };
  }

  function skrivIn(falt, namn, v) {
    falt[namn].input.value = String(v);
    falt[namn].input.fire('input');
  }

  /* ---- Korrigerat natrium ---- */
  rubrik('Korrigerat natrium — Katz och Hillier');
  {
    const r = plockaFormel('natrium_korrigerat', ['na', 'glukos'], ['katz', 'hillier']);

    skrivIn(r.falt, 'na', 128);
    pastå('bara ett fält ifyllt', r.rader.katz.varde.textContent, 'Fyll i glukos också.');

    /* P-glukos 11,1 mmol/L är exakt dubbla referenspunkten 5,55, så
       (11,1 − 5,55) / 5,55 = 1 exakt — inga avrundningsfel att jaga. */
    skrivIn(r.falt, 'na', 140); skrivIn(r.falt, 'glukos', 11.1);
    pastå('Katz, na 140 + glukos 11,1', r.rader.katz.varde.textContent, '141,6 mmol/L');
    pastå('Hillier, na 140 + glukos 11,1', r.rader.hillier.varde.textContent, '142,4 mmol/L');
    paståMed('uträkningen syns', r.rader.katz.calc.textContent, '140 + 1,6 × (11,1 − 5,55) / 5,55');
    pastå('normalt Katz-natrium ger ingen anmärkning', r.rader.katz.not.hidden, true);

    skrivIn(r.falt, 'na', 130); skrivIn(r.falt, 'glukos', 11.1);
    pastå('Katz under 137', r.rader.katz.varde.textContent, '131,6 mmol/L');
    pastå('lågt korrigerat natrium flaggas', r.rader.katz.not.hidden, false);
    paståMed('flaggan nämner hyponatremi', r.rader.katz.not.textContent, 'hyponatremi');

    skrivIn(r.falt, 'na', 145); skrivIn(r.falt, 'glukos', 11.1);
    pastå('Katz över 145', r.rader.katz.varde.textContent, '146,6 mmol/L');
    paståMed('högt korrigerat natrium flaggas', r.rader.katz.not.textContent, 'hypernatremi');

    /* Rimlighetskontrollen */
    skrivIn(r.falt, 'na', 128); skrivIn(r.falt, 'glukos', 90);
    pastå('orimligt högt glukos varnar', r.varn.hidden, false);

    /* Träningsläget: två svarsrutor, en per formel */
    skrivIn(r.falt, 'na', 140); skrivIn(r.falt, 'glukos', 11.1);
    r.lagesknappar.find((b) => b.textContent === 'Träna').fire('click');
    pastå('räknat värde döljs i träningsläget', r.rader.katz.ut.hidden, true);
    r.rader.katz.svarInput.value = '141,6';
    r.rader.katz.svarKnapp.fire('click');
    pastå('rätt Katz-svar', r.rader.katz.dom.className, 'vt-dom ratt');
    r.rader.hillier.svarInput.value = '100';
    r.rader.hillier.svarKnapp.fire('click');
    pastå('fel Hillier-svar', r.rader.hillier.dom.className, 'vt-dom fel');
    paståMed('facit visas vid fel svar', r.rader.hillier.dom.textContent, '142,4');
    r.lagesknappar.find((b) => b.textContent === 'Räkna').fire('click');

    r.nollknapp.fire('click');
    pastå('nollställt', r.falt.na.input.value, '');
  }

  /* ---- Effektiv serumosmolalitet ---- */
  rubrik('Effektiv serumosmolalitet');
  {
    const r = plockaFormel('osmolalitet', ['na', 'k', 'glukos'], ['osm']);

    skrivIn(r.falt, 'na', 140); skrivIn(r.falt, 'k', 4); skrivIn(r.falt, 'glukos', 5);
    pastå('2×(140+4)+5', r.rader.osm.varde.textContent, '293 mosmol/kg');
    pastå('normalvärde ger ingen anmärkning', r.rader.osm.not.hidden, true);

    skrivIn(r.falt, 'glukos', 7);
    pastå('gränsen 295 är fortfarande normal', r.rader.osm.varde.textContent, '295 mosmol/kg');
    pastå('295 flaggas inte', r.rader.osm.not.hidden, true);

    skrivIn(r.falt, 'glukos', 8);
    pastå('296 är lätt förhöjt', r.rader.osm.varde.textContent, '296 mosmol/kg');
    pastå('296 flaggas', r.rader.osm.not.hidden, false);
    paståMed('måttlig förhöjning', r.rader.osm.not.textContent, 'förhöjd');

    skrivIn(r.falt, 'na', 140); skrivIn(r.falt, 'k', 5); skrivIn(r.falt, 'glukos', 30);
    pastå('2×(140+5)+30 = 320, HHS-nivå', r.rader.osm.varde.textContent, '320 mosmol/kg');
    pastå('HHS-notisen visas', r.rader.osm.not.className, 'vt-krit');
    paståMed('HHS nämns', r.rader.osm.not.textContent, 'HHS');

    r.nollknapp.fire('click');
    pastå('nollställt', r.falt.na.input.value, '');
  }

  /* ---- Blodgasklassificeraren ---- */
  rubrik('Blodgasklassificeraren');
  {
    /* Speglar visaTal() i js/akutmedicin.js exakt (3 decimaler,
       svenskt kommatecken) så att de förväntade talen i påståendena
       nedan är uträknade en gång, inte avskrivna för hand två gånger. */
    const v3 = (n) => String(Math.round(n * 1000) / 1000).replace('.', ',');

    function plockaBlodgas() {
      const kort = platser.blodgas.children[0];
      const falt = {};
      ['ph', 'pco2', 'hco3', 'be', 'na', 'cl', 'laktat'].forEach((n) => {
        const f = kort.find((e) => e._class.has('vt-field') && e.dataset.falt === n);
        falt[n] = { input: f.find((e) => e.tagName === 'INPUT') };
      });
      return {
        kort, falt,
        varn: kort.find((e) => e._class.has('vt-warn')),
        ut: kort.find((e) => e._class.has('vt-out')),
        utVarde: kort.find((e) => e._class.has('vt-out')).children[0],
        slutsats: kort.find((e) => e._class.has('vt-band')),
        stegBox: kort.find((e) => e._class.has('vt-steg')),
        nollknapp: kort.find((e) => e._class.has('vt-nollstall')).children[0]
      };
    }
    function slutsatsTitel(r) { return r.slutsats.children[0].textContent; }
    function stegText(r, titel) {
      const blk = r.stegBox.children.find((b) => b.children[0].textContent === titel);
      return blk ? blk.children[1].textContent : null;
    }
    function fyll(r, varden) {
      r.nollknapp.fire('click');
      Object.keys(varden).forEach((n) => { r.falt[n].input.value = String(varden[n]); r.falt[n].input.fire('input'); });
    }

    const r = plockaBlodgas();

    rubrik('  Ofullständiga värden');
    fyll(r, { ph: 7.2 });
    paståMed('efterlyser resten', r.utVarde.textContent, 'Fyll i');
    pastå('ingen slutsats än', r.slutsats.hidden, true);

    rubrik('  Ren metabol acidos, adekvat kompenserad (Winters exakt)');
    fyll(r, { ph: 7.20, hco3: 14, be: -12, pco2: 3.9 });
    pastå('slutsatsen', slutsatsTitel(r), 'Primär metabol acidos, adekvat kompenserad.');
    pastå('nivån', r.slutsats.className, 'vt-band is-lag');
    paståMed('primärtexten nämner metabol acidos', stegText(r, 'Primär rubbning'), 'primär metabol acidos');
    paståMed('BE bekräftar', stegText(r, 'Primär rubbning'), 'bekräftar den metabola komponenten');
    paståMed('Winters uträkning', stegText(r, 'Förväntad kompensation'), '0,2 × 14 + 1,1 = ' + v3(0.2 * 14 + 1.1));
    paståMed('inom spannet', stegText(r, 'Förväntad kompensation'), 'adekvat respiratorisk kompensation');

    rubrik('  Metabol acidos med otillräcklig kompensation (Winters avviker)');
    fyll(r, { ph: 7.28, hco3: 14, be: -12, pco2: 5.0 });
    paståMed('otillräcklig kompensation', stegText(r, 'Förväntad kompensation'), 'högre än väntat');
    paståMed('flaggar samtidig respiratorisk acidos', stegText(r, 'Förväntad kompensation'), 'samtidig respiratorisk acidos');
    paståMed('slutsatsen nämner samtidig rubbning', slutsatsTitel(r), 'samtidig rubbning');

    rubrik('  Ren respiratorisk acidos, akut kompensation');
    fyll(r, { ph: 7.30, hco3: 25, be: 1, pco2: 6.6 });
    pastå('primärtexten', slutsatsTitel(r), 'Primär respiratorisk acidos, adekvat kompenserad.');
    paståMed('båda nivåerna nämns', stegText(r, 'Förväntad kompensation'), v3(24 + 0.75 * 1.3));
    paståMed('den kroniska nivån också', stegText(r, 'Förväntad kompensation'), v3(24 + 3.4 * 1.3));
    paståMed('inom spannet', stegText(r, 'Förväntad kompensation'), 'inom det förväntade spannet');

    rubrik('  Ren respiratorisk alkalos, med kompensatoriskt lågt bikarbonat');
    fyll(r, { ph: 7.50, hco3: 20, be: -2, pco2: 3.5 });
    pastå('primärtexten', slutsatsTitel(r), 'Primär respiratorisk alkalos, adekvat kompenserad.');
    paståMed('kompensationen', stegText(r, 'Förväntad kompensation'), 'inom det förväntade spannet');

    rubrik('  Kombinerad metabol och respiratorisk acidos');
    fyll(r, { ph: 7.05, hco3: 14, be: -14, pco2: 7.0 });
    pastå('slutsatsen', slutsatsTitel(r), 'Kombinerad metabol och respiratorisk acidos.');
    pastå('nivån', r.slutsats.className, 'vt-band is-hog');
    pastå('ingen egen kompensationsberäkning för blandade rubbningar', stegText(r, 'Förväntad kompensation'), null);

    rubrik('  Normal blodgas');
    fyll(r, { ph: 7.40, hco3: 24, be: 0, pco2: 5.3 });
    pastå('slutsatsen', slutsatsTitel(r), 'Normal blodgas.');
    pastå('nivån', r.slutsats.className, 'vt-band is-ingen');

    rubrik('  Surt pH utan avvikande bikarbonat eller pCO₂');
    fyll(r, { ph: 7.30, hco3: 24, be: 0, pco2: 5.3 });
    pastå('slutsatsen', slutsatsTitel(r), 'Oklar bild — kontrollera värdena.');

    rubrik('  Normalt pH trots avvikande komponenter (fullt kompenserad)');
    fyll(r, { ph: 7.40, hco3: 18, be: -6, pco2: 4.0 });
    pastå('slutsatsen', slutsatsTitel(r), 'Normalt pH trots avvikande komponent — kompenserad eller blandad rubbning.');

    rubrik('  Anjongap — bara när Na och Cl fylls i, bara vid metabol acidos');
    fyll(r, { ph: 7.20, hco3: 14, be: -12, pco2: 3.9 });
    pastå('inget anjongapssteg utan Na/Cl', stegText(r, 'Anjongap'), null);
    fyll(r, { ph: 7.20, hco3: 14, be: -12, pco2: 3.9, na: 140, cl: 100 });
    paståMed('anjongapet räknas ut', stegText(r, 'Anjongap'), 'Anjongap = 140 − (100 + 14) = ' + v3(140 - (100 + 14)));
    paståMed('högt anjongap', stegText(r, 'Anjongap'), 'Högt anjongap');
    fyll(r, { ph: 7.20, hco3: 14, be: -12, pco2: 3.9, na: 140, cl: 100, laktat: 8 });
    paståMed('förhöjt laktat förklarar gapet', stegText(r, 'Anjongap'), 'laktacidos förklarar hela eller delar av gapet');
    fyll(r, { ph: 7.20, hco3: 14, be: -12, pco2: 3.9, na: 140, cl: 100, laktat: 1 });
    paståMed('normalt laktat pekar bort från laktacidos', stegText(r, 'Anjongap'), 'något annat än laktacidos');
    fyll(r, { ph: 7.20, hco3: 14, be: -12, pco2: 3.9, na: 140, cl: 118 });
    paståMed('normalt anjongap', stegText(r, 'Anjongap'), 'Normalt anjongap');

    rubrik('  Inget anjongapssteg vid enbart kompensatoriskt lågt bikarbonat');
    fyll(r, { ph: 7.50, hco3: 20, be: -2, pco2: 3.5, na: 140, cl: 100 });
    pastå('respiratorisk alkalos triggar inte anjongapet', stegText(r, 'Anjongap'), null);

    rubrik('  Rimlighetskontroll');
    fyll(r, { ph: 7.20, hco3: 14, be: -12, pco2: 3.9 });
    pastå('inga orimliga värden', r.varn.hidden, true);
    fyll(r, { ph: 7.20, hco3: 14, be: -12, pco2: 40 });
    pastå('orimligt pCO₂ varnar', r.varn.hidden, false);
    paståMed('bedömningen görs ändå', r.slutsats.hidden, false);

    r.nollknapp.fire('click');
    pastå('nollställt', r.falt.ph.input.value, '');
  }

  /* =========================================================
     Kryssruteskalorna (mönster A): Wells DVT och CHA₂DS₂-VA
     =========================================================
     Samma metod som för NEWS2: instrumentets egen tabell är facit,
     och varje kriterium prövas mot sin vikt i tabellen i stället för
     att ett par patientexempel räknas igenom. Vikterna är avlästa ur
     Wells et al. (2003) respektive ESC:s riktlinje från 2024 — inga
     tal här är uträknade av mig.

     Bandgränsen prövas åt BÅDA håll, precis som intervallgränserna i
     NEWS2: en gräns som hamnar en poäng fel är den feltyp en
     kryssruteskala drabbas av. */

  function plockaKryss(namn) {
    const kort = platser[namn].children[0];
    const rutor = {};
    kort.findAll((e) => e._class.has('vt-krav')).forEach((k) => {
      rutor[k.dataset.falt] = {
        el: k,
        ruta: k.find((e) => e.tagName === 'INPUT'),
        poang: k.find((e) => e._class.has('vt-poang'))
      };
    });
    const ut = kort.find((e) => e._class.has('vt-out'));
    const svarsruta = kort.find((e) => e._class.has('vt-svarsruta'));
    return {
      kort, rutor,
      ut,
      varde: ut.children[1],
      calc: ut.children[2],
      band: kort.find((e) => e._class.has('vt-band')),
      svarsruta,
      svarInput: svarsruta.find((e) => e.tagName === 'INPUT'),
      svarKnapp: svarsruta.find((e) => e.tagName === 'BUTTON'),
      dom: svarsruta.children[svarsruta.children.length - 1],
      lagesknappar: kort.find((e) => e._class.has('vt-mode')).children,
      nollknapp: kort.find((e) => e._class.has('vt-nollstall')).children[0]
    };
  }

  const kryssa = (r, namn, pa) => {
    /* Ett kriterium som försvunnit ur facit ska säga VAD som fanns i stället,
       inte krascha på undefined (CLAUDE_REGLER §0.4 punkt 2). Felet syntes
       först som ett TypeError när alkoholkriteriet plockades bort ur
       HAS-BLED under larmverifieringen. */
    if (!r.rutor[namn]) {
      throw new Error(`kriteriet "${namn}" finns inte i facit. Kriterier i ` +
        `skalan: ${Object.keys(r.rutor).join(', ')}`);
    }
    r.rutor[namn].ruta.checked = pa !== false;
    r.rutor[namn].ruta.fire('change');
  };
  const bandTitelAv = (r) =>
    r.band.children.find((c) => c._class.has('vt-band-titel')).textContent;

  /** Summan ETT ensamt kriterium ger, allt annat urkryssat. */
  function viktFor(r, namn) {
    r.nollknapp.fire('click');
    kryssa(r, namn);
    const m = /^(-?\d+) poäng$/.exec(r.varde.textContent);
    return m ? Number(m[1]) : r.varde.textContent;
  }

  /* ---- Wells DVT ---- */
  rubrik('Wells DVT — vikterna, en per kriterium (Wells et al. 2003)');
  {
    const r = plockaKryss('wells_dvt');

    pastå('aktiv cancer', viktFor(r, 'cancer'), 1);
    pastå('förlamning eller gips', viktFor(r, 'immobilisering'), 1);
    pastå('sängliggande eller kirurgi', viktFor(r, 'sangliggande'), 1);
    pastå('ömhet längs venerna', viktFor(r, 'omhet'), 1);
    pastå('hela benet svullet', viktFor(r, 'helasvullet'), 1);
    pastå('vadomfång', viktFor(r, 'vadomfang'), 1);
    pastå('pittingödem', viktFor(r, 'pittingodem'), 1);
    pastå('kollateralvener', viktFor(r, 'kollateraler'), 1);
    pastå('tidigare DVT', viktFor(r, 'tidigaredvt'), 1);
    pastå('annan diagnos lika sannolik drar av två', viktFor(r, 'alternativ'), -2);

    rubrik('  Utgångsläget är ett svar, inte ett tomt fält');
    r.nollknapp.fire('click');
    pastå('noll poäng visas direkt', r.varde.textContent, '0 poäng');
    pastå('uträkningen säger varför', r.calc.textContent, 'Inget kriterium ikryssat = 0');
    pastå('bandet visas', bandTitelAv(r), 'DVT osannolik');

    rubrik('  Bandgränsen prövad åt båda håll (dikotomin i 2003 års modell)');
    r.nollknapp.fire('click');
    kryssa(r, 'cancer');
    pastå('1 poäng', r.varde.textContent, '1 poäng');
    pastå('1 poäng ger osannolik', bandTitelAv(r), 'DVT osannolik');
    pastå('nivån', r.band.className, 'vt-band is-lag');
    kryssa(r, 'omhet');
    pastå('2 poäng', r.varde.textContent, '2 poäng');
    pastå('2 poäng ger sannolik', bandTitelAv(r), 'DVT sannolik');
    pastå('nivån', r.band.className, 'vt-band is-hog');

    rubrik('  Avdraget räknas med tecken och kan sänka under noll');
    r.nollknapp.fire('click');
    kryssa(r, 'alternativ');
    pastå('summan', r.varde.textContent, '-2 poäng');
    pastå('uträkningen', r.calc.textContent, '−2 = -2');
    pastå('negativ summa hamnar i låga bandet', bandTitelAv(r), 'DVT osannolik');

    rubrik('  Avdraget kan vända en sannolik bedömning till osannolik');
    r.nollknapp.fire('click');
    kryssa(r, 'cancer');
    kryssa(r, 'omhet');
    kryssa(r, 'helasvullet');
    pastå('tre kriterier', bandTitelAv(r), 'DVT sannolik');
    kryssa(r, 'alternativ');
    pastå('summan efter avdrag', r.varde.textContent, '1 poäng');
    pastå('uträkningen med tecken', r.calc.textContent, '1 + 1 + 1 − 2 = 1');
    pastå('bedömningen vänder', bandTitelAv(r), 'DVT osannolik');

    rubrik('  Alla nio positiva kriterier');
    r.nollknapp.fire('click');
    ['cancer', 'immobilisering', 'sangliggande', 'omhet', 'helasvullet',
     'vadomfang', 'pittingodem', 'kollateraler', 'tidigaredvt']
      .forEach((n) => kryssa(r, n));
    pastå('maxsumman utan avdrag', r.varde.textContent, '9 poäng');

    rubrik('  Vikten syns vid kriteriet och markeras när den räknas');
    r.nollknapp.fire('click');
    pastå('vikten står vid kriteriet', r.rutor.cancer.poang.textContent, '+1 p');
    pastå('avdragets tecken', r.rutor.alternativ.poang.textContent, '−2 p');
    pastå('urkryssad är tom', r.rutor.cancer.poang.className, 'vt-poang is-tom');
    kryssa(r, 'cancer');
    pastå('ikryssad är aktiv', r.rutor.cancer.poang.className, 'vt-poang is-aktiv');

    rubrik('  Träningsläget döljer vikterna');
    r.lagesknappar.find((b) => b.textContent === 'Träna').fire('click');
    pastå('utfallet är dolt', r.ut.hidden, true);
    pastå('bandet är dolt', r.band.hidden, true);
    pastå('svarsrutan visas', r.svarsruta.hidden, false);
    pastå('vikten är dold', r.rutor.cancer.poang.textContent, 'räkna själv');
    pastå('även avdragets vikt', r.rutor.alternativ.poang.textContent, 'räkna själv');

    r.svarInput.value = '1';
    r.svarKnapp.fire('click');
    pastå('rätt svar', r.dom.className, 'vt-dom ratt');
    paståMed('facit skrivs ut', r.dom.textContent, 'aktiv cancer +1 = 1');
    r.svarInput.value = '4';
    r.svarKnapp.fire('click');
    pastå('fel svar', r.dom.className, 'vt-dom fel');
    paståMed('rätt summa anges', r.dom.textContent, 'Rätt summa är 1 poäng');
    r.svarInput.value = 'x';
    r.svarKnapp.fire('click');
    paståMed('icke-tal avvisas', r.dom.textContent, 'heltal');

    r.lagesknappar.find((b) => b.textContent === 'Räkna').fire('click');
    pastå('tillbaka i räkneläget', r.ut.hidden, false);
    pastå('vikten syns igen', r.rutor.cancer.poang.textContent, '+1 p');

    rubrik('  Nollställ');
    kryssa(r, 'omhet');
    r.nollknapp.fire('click');
    pastå('rutorna töms', r.rutor.omhet.ruta.checked, false);
    pastå('summan nollas', r.varde.textContent, '0 poäng');
  }

  /* ---- CHA₂DS₂-VA ---- */
  rubrik('CHA₂DS₂-VA — vikterna ur ESC 2024, kön ingår inte');
  {
    const r = plockaKryss('chadsva');

    pastå('hjärtsvikt', viktFor(r, 'hjartsvikt'), 1);
    pastå('hypertoni', viktFor(r, 'hypertoni'), 1);
    pastå('ålder 75 år eller äldre väger dubbelt', viktFor(r, 'alder75'), 2);
    pastå('diabetes', viktFor(r, 'diabetes'), 1);
    pastå('tidigare stroke väger dubbelt', viktFor(r, 'stroke'), 2);
    pastå('kärlsjukdom', viktFor(r, 'karlsjukdom'), 1);
    pastå('ålder 65–74 år', viktFor(r, 'alder65'), 1);

    rubrik('  Åldersraderna utesluter varandra');
    r.nollknapp.fire('click');
    kryssa(r, 'alder65');
    kryssa(r, 'alder75');
    pastå('den nyss ikryssade vinner', r.rutor.alder75.ruta.checked, true);
    pastå('den andra lossas', r.rutor.alder65.ruta.checked, false);
    pastå('summan räknar åldern en gång', r.varde.textContent, '2 poäng');
    kryssa(r, 'alder65');
    pastå('och åt andra hållet', r.rutor.alder75.ruta.checked, false);
    pastå('summan', r.varde.textContent, '1 poäng');

    rubrik('  Kriterier utanför gruppen rörs inte');
    r.nollknapp.fire('click');
    kryssa(r, 'hypertoni');
    kryssa(r, 'alder75');
    kryssa(r, 'alder65');
    pastå('hypertonin står kvar', r.rutor.hypertoni.ruta.checked, true);
    pastå('summan', r.varde.textContent, '2 poäng');

    rubrik('  Bandgränserna prövade åt båda håll');
    r.nollknapp.fire('click');
    pastå('0 poäng', bandTitelAv(r), '0 poäng – låg risk');
    pastå('nivån', r.band.className, 'vt-band is-lag');
    kryssa(r, 'hypertoni');
    pastå('1 poäng', bandTitelAv(r), '1 poäng – måttlig risk');
    pastå('nivån', r.band.className, 'vt-band is-medel');
    kryssa(r, 'diabetes');
    pastå('2 poäng', bandTitelAv(r), '2 poäng eller mer – hög risk');
    pastå('nivån', r.band.className, 'vt-band is-hog');

    rubrik('  Ett tvåpoängskriterium ensamt passerar gränsen');
    r.nollknapp.fire('click');
    kryssa(r, 'stroke');
    pastå('tidigare stroke ensam ger 2 poäng', r.varde.textContent, '2 poäng');
    pastå('och når högsta bandet', bandTitelAv(r), '2 poäng eller mer – hög risk');

    rubrik('  Maxsumman');
    r.nollknapp.fire('click');
    ['hjartsvikt', 'hypertoni', 'alder75', 'diabetes', 'stroke', 'karlsjukdom']
      .forEach((n) => kryssa(r, n));
    pastå('åtta poäng är taket', r.varde.textContent, '8 poäng');
    pastå('uträkningen', r.calc.textContent, '1 + 1 + 2 + 1 + 2 + 1 = 8');
  }

  /* ---- HAS-BLED ---- */
  rubrik('HAS-BLED — nio rutor på sju bokstäver (Pisters et al. 2010)');
  {
    const r = plockaKryss('has_bled');

    ['hypertoni', 'njure', 'lever', 'stroke', 'blodning', 'labilt_inr',
     'alder', 'lakemedel', 'alkohol'].forEach((n) => {
      pastå(n, viktFor(r, n), 1);
    });

    rubrik('  A och D ger två poäng var, eftersom de täcker två saker');
    r.nollknapp.fire('click');
    kryssa(r, 'njure');
    kryssa(r, 'lever');
    pastå('båda A-raderna räknas', r.varde.textContent, '2 poäng');
    kryssa(r, 'lakemedel');
    kryssa(r, 'alkohol');
    pastå('båda D-raderna räknas också', r.varde.textContent, '4 poäng');

    rubrik('  Bandgränsen prövad åt båda håll');
    r.nollknapp.fire('click');
    kryssa(r, 'hypertoni');
    kryssa(r, 'stroke');
    pastå('2 poäng', bandTitelAv(r), '0–2 poäng – låg blödningsrisk');
    pastå('nivån', r.band.className, 'vt-band is-lag');
    kryssa(r, 'alder');
    pastå('3 poäng', bandTitelAv(r), '3 poäng eller mer – hög blödningsrisk');
    pastå('nivån', r.band.className, 'vt-band is-medel');
    paståMed('skalan avråder inte från behandling', r.band.textContent,
             'inte avsedd att användas för att avstå från antikoagulantia');

    rubrik('  Maxsumman är nio, inte sju');
    r.nollknapp.fire('click');
    ['hypertoni', 'njure', 'lever', 'stroke', 'blodning', 'labilt_inr',
     'alder', 'lakemedel', 'alkohol'].forEach((n) => kryssa(r, n));
    pastå('nio poäng', r.varde.textContent, '9 poäng');
  }

  /* =========================================================
     QTc (mönster C med bandväljare)
     =========================================================
     Talen nedan är handräknade ur formlerna, inte hämtade ur
     modulen: QTc = QT / √(60/puls) för Bazett och QT / ∛(60/puls)
     för Fridericia. Vid puls 60 är RR-intervallet exakt en sekund,
     och båda rötterna av 1 är 1 — då ska QTc vara identisk med den
     uppmätta QT-tiden. Det är den enda punkt där formlerna kan
     kontrolleras utan avrundning, och därför den viktigaste. */

  rubrik('QTc — Bazett och Fridericia (Bazett 1920; Fridericia 1920)');
  {
    const r = plockaFormel('qtc', ['qt', 'puls'], ['bazett', 'fridericia']);
    const konvaljare = r.kort.find((e) => e.tagName === 'SELECT');
    const valjKon = (v) => { konvaljare.value = v; konvaljare.fire('change'); };

    rubrik('  Vid puls 60 är RR en sekund och QTc = QT');
    skrivIn(r.falt, 'qt', 400);
    skrivIn(r.falt, 'puls', 60);
    pastå('Bazett', r.rader.bazett.varde.textContent, '400 ms');
    pastå('Fridericia', r.rader.fridericia.varde.textContent, '400 ms');
    paståMed('uträkningen visas', r.rader.bazett.calc.textContent, '400 / √(60 / 60)');

    rubrik('  Bazett överkorrigerar vid hög puls, Fridericia mindre');
    skrivIn(r.falt, 'puls', 100);
    pastå('Bazett 400/√0,6', r.rader.bazett.varde.textContent, '516,398 ms');
    pastå('Fridericia 400/∛0,6', r.rader.fridericia.varde.textContent, '474,252 ms');

    rubrik('  ...och underkorrigerar vid låg puls');
    skrivIn(r.falt, 'puls', 50);
    pastå('Bazett', r.rader.bazett.varde.textContent, '365,148 ms');
    pastå('Fridericia', r.rader.fridericia.varde.textContent, '376,414 ms');

    rubrik('  Könet byter tolkningstabell men inte uträkningen');
    skrivIn(r.falt, 'qt', 400);
    skrivIn(r.falt, 'puls', 76);
    const bazettVarde = r.rader.bazett.varde.textContent;   // 450,0 ms, mellan gränserna
    valjKon('man');
    paståMed('över mannens gräns 450 ms', r.rader.bazett.not.textContent, 'förlängd hos män');
    pastå('talet är oförändrat', r.rader.bazett.varde.textContent, bazettVarde);
    valjKon('kvinna');
    pastå('under kvinnans gräns 460 ms', r.rader.bazett.not.hidden, true);
    pastå('talet är fortfarande oförändrat', r.rader.bazett.varde.textContent, bazettVarde);

    rubrik('  500 ms är samma gräns för båda könen');
    skrivIn(r.falt, 'qt', 460);
    skrivIn(r.falt, 'puls', 100);
    valjKon('kvinna');
    paståMed('kraftigt förlängd', r.rader.bazett.not.textContent, 'kraftigt förlängd');
    pastå('nivån markeras', r.rader.bazett.not.className, 'vt-krit');
    valjKon('man');
    paståMed('samma text för män', r.rader.bazett.not.textContent, 'kraftigt förlängd');

    rubrik('  Könet räknas aldrig som ett ofyllt fält');
    r.nollknapp.fire('click');
    pastå('talfälten töms', r.falt.qt.input.value, '');
    pastå('könet går till första valet', konvaljare.value, 'man');
    pastå('uppmaningen gäller bara talen', r.rader.bazett.varde.textContent,
          'Fyll i 2 värden till.');
    skrivIn(r.falt, 'qt', 400);
    pastå('ett tal kvar', r.rader.bazett.varde.textContent, 'Fyll i hjärtfrekvens också.');
  }

  /* =========================================================
     Beslutsgången (mönster D): modifierad EHRA
     =========================================================
     Instrumentet summerar ingenting — klassen väljs. Testet prövar
     att varje beskrivning ur Wynn et al. (2014) leder till sin klass,
     och att 2b och 3 hamnar på samma allvarlighetsnivå, vilket är
     hela poängen med 2014 års modifiering. */

  rubrik('Modifierad EHRA — de fem klasserna (Wynn et al. 2014)');
  {
    const kort = platser.ehra.children[0];
    const valjare = kort.find((e) => e.tagName === 'SELECT');
    const band = kort.find((e) => e._class.has('vt-band'));
    const nollknapp = kort.find((e) => e._class.has('vt-nollstall')).children[0];
    const titel = () =>
      band.children.find((c) => c._class.has('vt-band-titel')).textContent;
    const valj = (v) => { valjare.value = v; valjare.fire('change'); };

    valj('1');
    pastå('klass 1', titel(), 'EHRA 1 – inga symtom');
    pastå('nivån', band.className, 'vt-band is-ingen');

    valj('2a');
    pastå('klass 2a', titel(), 'EHRA 2a – lätta symtom');
    pastå('nivån', band.className, 'vt-band is-lag');

    valj('2b');
    pastå('klass 2b', titel(), 'EHRA 2b – måttliga symtom');
    pastå('nivån', band.className, 'vt-band is-medel');
    paståMed('modifieringen förklaras', band.textContent, 'liknade klass 3 mer än klass 2a');

    valj('3');
    pastå('klass 3', titel(), 'EHRA 3 – svåra symtom');
    pastå('2b och 3 ligger på samma nivå', band.className, 'vt-band is-medel');

    valj('4');
    pastå('klass 4', titel(), 'EHRA 4 – invalidiserande symtom');
    pastå('nivån', band.className, 'vt-band is-hog');

    rubrik('  Ingen Träna-flik och ingen poängchip');
    pastå('ingen lägesväljare', kort.find((e) => e._class.has('vt-mode')), null);
    pastå('ingen poängchip vid steget', kort.find((e) => e._class.has('vt-poang')), null);

    rubrik('  Nollställ går till första alternativet');
    valj('4');
    nollknapp.fire('click');
    pastå('valet återställs', valjare.value, '1');
    pastå('utfallet följer med', titel(), 'EHRA 1 – inga symtom');
  }

  /* =========================================================
     Infektionssidans instrument: qSOFA, SOFA och DS-CRB-65
     =========================================================
     Gränserna är avlästa ur Sepsis-3:s tabell (Singer et al., 2016)
     respektive det svenska pneumonivårdprogrammet, och prövas åt
     BÅDA håll — sista värdet i ett band och första i nästa. */

  function plockaVarde(namn) {
    const kort = platser[namn].children[0];
    const falt = {};
    kort.findAll((e) => e._class.has('vt-field')).forEach((f) => {
      falt[f.dataset.falt] = {
        input: f.find((e) => e.tagName === 'INPUT'),
        valjare: f.find((e) => e.tagName === 'SELECT'),
        poang: f.find((e) => e._class.has('vt-poang'))
      };
    });
    const ut = kort.find((e) => e._class.has('vt-out'));
    return {
      kort, falt, ut,
      varde: ut.children.find((c) => c._class.has('vt-out-value')),
      band: kort.find((e) => e._class.has('vt-band')),
      nollknapp: kort.find((e) => e._class.has('vt-nollstall')).children[0]
    };
  }

  const skrivV = (r, n, v) => { r.falt[n].input.value = String(v); r.falt[n].input.fire('input'); };
  const valjV = (r, n, v) => { r.falt[n].valjare.value = v; r.falt[n].valjare.fire('change'); };
  const chipP = (r, n) => {
    const m = /^(\d+) p/.exec(r.falt[n].poang.textContent);
    return m ? Number(m[1]) : r.falt[n].poang.textContent;
  };
  const bandT = (r) =>
    r.band.children.find((c) => c._class.has('vt-band-titel')).textContent;

  /* ---- qSOFA ---- */
  rubrik('qSOFA — tre kriterier vid sängkanten (Singer et al. 2016)');
  {
    const r = plockaVarde('qsofa');
    const normal = () => { skrivV(r, 'af', 18); skrivV(r, 'sbt', 125);
                           valjV(r, 'medvetande', 'opaverkad'); };

    rubrik('  Andningsfrekvensens gräns åt båda håll');
    normal(); skrivV(r, 'af', 21);
    pastå('21 ger 0', chipP(r, 'af'), 0);
    skrivV(r, 'af', 22);
    pastå('22 ger 1', chipP(r, 'af'), 1);

    rubrik('  Blodtrycksgränsen åt båda håll');
    normal(); skrivV(r, 'sbt', 101);
    pastå('101 ger 0', chipP(r, 'sbt'), 0);
    skrivV(r, 'sbt', 100);
    pastå('100 ger 1', chipP(r, 'sbt'), 1);

    rubrik('  Medvetandegraden');
    normal();
    pastå('vaken ger 0', chipP(r, 'medvetande'), 0);
    valjV(r, 'medvetande', 'paverkad');
    pastå('påverkad ger 1', chipP(r, 'medvetande'), 1);

    rubrik('  Bandgränsen vid 2 poäng');
    normal();
    pastå('0 poäng', r.varde.textContent, '0 poäng');
    pastå('lågt band', bandT(r), '0–1 poäng');
    skrivV(r, 'af', 24);
    pastå('1 poäng', r.varde.textContent, '1 poäng');
    pastå('fortfarande lågt band', bandT(r), '0–1 poäng');
    skrivV(r, 'sbt', 95);
    pastå('2 poäng', r.varde.textContent, '2 poäng');
    pastå('högt band', bandT(r), '2 poäng eller mer');
    pastå('nivån', r.band.className, 'vt-band is-hog');
    paståMed('trubbigheten står i det låga bandet', r.band.textContent.length > 0, true);

    rubrik('  Maxsumman är tre');
    valjV(r, 'medvetande', 'paverkad');
    pastå('3 poäng', r.varde.textContent, '3 poäng');
  }

  /* ---- SOFA ---- */
  rubrik('SOFA — sex organsystem à 0–4 poäng (Singer et al. 2016)');
  {
    const r = plockaVarde('sofa');
    const friskt = () => {
      valjV(r, 'andningsstod', 'nej');
      skrivV(r, 'pafi', 450); skrivV(r, 'trombocyter', 250);
      skrivV(r, 'bilirubin', 12); valjV(r, 'cirkulation', 'map70');
      skrivV(r, 'gcs', 15); skrivV(r, 'kreatinin', 80);
    };

    rubrik('  Friska värden ger noll');
    friskt();
    pastå('summan', r.varde.textContent, '0 poäng');
    pastå('bandet', bandT(r), '0–1 poäng – ingen påvisad organsvikt');

    rubrik('  Trombocyterna, varje gräns åt båda håll');
    friskt();
    [[150, 0], [149, 1], [100, 1], [99, 2], [50, 2], [49, 3], [20, 3], [19, 4]]
      .forEach(([v, p]) => { skrivV(r, 'trombocyter', v);
        pastå(`${v} ×10⁹/L ger ${p}`, chipP(r, 'trombocyter'), p); });

    rubrik('  Bilirubinet, varje gräns åt båda håll');
    friskt();
    [[19, 0], [20, 1], [32, 1], [33, 2], [101, 2], [102, 3], [204, 3], [205, 4]]
      .forEach(([v, p]) => { skrivV(r, 'bilirubin', v);
        pastå(`${v} µmol/L ger ${p}`, chipP(r, 'bilirubin'), p); });

    rubrik('  Kreatininet, varje gräns åt båda håll');
    friskt();
    [[109, 0], [110, 1], [170, 1], [171, 2], [299, 2], [300, 3], [440, 3], [441, 4]]
      .forEach(([v, p]) => { skrivV(r, 'kreatinin', v);
        pastå(`${v} µmol/L ger ${p}`, chipP(r, 'kreatinin'), p); });

    rubrik('  Glasgow Coma Scale');
    friskt();
    [[15, 0], [14, 1], [13, 1], [12, 2], [10, 2], [9, 3], [6, 3], [5, 4]]
      .forEach(([v, p]) => { skrivV(r, 'gcs', v);
        pastå(`GCS ${v} ger ${p}`, chipP(r, 'gcs'), p); });

    rubrik('  De två högsta respirationsstegen kräver andningsstöd');
    friskt(); skrivV(r, 'pafi', 150);
    pastå('utan andningsstöd stannar det på 2', chipP(r, 'pafi'), 2);
    valjV(r, 'andningsstod', 'ja');
    pastå('med andningsstöd ger samma värde 3', chipP(r, 'pafi'), 3);
    skrivV(r, 'pafi', 80);
    pastå('under 100 med andningsstöd ger 4', chipP(r, 'pafi'), 4);
    valjV(r, 'andningsstod', 'nej');
    pastå('utan stöd stannar även 80 på 2', chipP(r, 'pafi'), 2);
    pastå('andningsstödet ger ingen egen poäng',
          r.falt.andningsstod.poang.textContent, 'ger ingen poäng');

    rubrik('  Cirkulationens fem steg');
    friskt();
    [['map70', 0], ['map_under70', 1], ['dopamin_lag', 2],
     ['dopamin_medel', 3], ['dopamin_hog', 4]]
      .forEach(([v, p]) => { valjV(r, 'cirkulation', v);
        pastå(`${v} ger ${p}`, chipP(r, 'cirkulation'), p); });

    rubrik('  Maxsumman är 24, sex system à fyra poäng');
    valjV(r, 'andningsstod', 'ja');
    skrivV(r, 'pafi', 50); skrivV(r, 'trombocyter', 10);
    skrivV(r, 'bilirubin', 400); valjV(r, 'cirkulation', 'dopamin_hog');
    skrivV(r, 'gcs', 3); skrivV(r, 'kreatinin', 600);
    pastå('summan', r.varde.textContent, '24 poäng');
    pastå('högsta bandet', bandT(r), '10 poäng eller mer – uttalad organsvikt');

    rubrik('  Bandgränserna');
    friskt(); skrivV(r, 'trombocyter', 140);
    pastå('1 poäng', bandT(r), '0–1 poäng – ingen påvisad organsvikt');
    skrivV(r, 'bilirubin', 25);
    pastå('2 poäng', bandT(r), '2–9 poäng – organsvikt föreligger');
    paståMed('Sepsis-3-kriteriet förklaras', r.band.textContent, 'minst två poäng');
  }

  /* ---- DS-CRB-65 ---- */
  rubrik('DS-CRB-65 — sex kriterier (svenskt vårdprogram 2024)');
  {
    const r = plockaKryss('dscrb65');

    ['sjukdom', 'saturation', 'konfusion', 'andningsfrekvens', 'blodtryck', 'alder']
      .forEach((n) => pastå(n, viktFor(r, n), 1));

    rubrik('  Bandgränsen prövad åt båda håll');
    r.nollknapp.fire('click');
    pastå('0 poäng', bandTitelAv(r), '0–1 poäng – lägre allvarlighetsgrad');
    kryssa(r, 'alder');
    pastå('1 poäng', bandTitelAv(r), '0–1 poäng – lägre allvarlighetsgrad');
    pastå('nivån', r.band.className, 'vt-band is-lag');
    kryssa(r, 'konfusion');
    pastå('2 poäng', bandTitelAv(r), '2 poäng eller mer – högre allvarlighetsgrad');
    pastå('nivån', r.band.className, 'vt-band is-hog');

    rubrik('  Maxsumman är sex — det är D och S som skiljer från CRB-65');
    r.nollknapp.fire('click');
    ['sjukdom', 'saturation', 'konfusion', 'andningsfrekvens', 'blodtryck', 'alder']
      .forEach((n) => kryssa(r, n));
    pastå('sex poäng', r.varde.textContent, '6 poäng');
  }

  /* ---- GCS ---- */
  rubrik('GCS — Glasgow Coma Scale (Teasdale & Jennett 1974)');
  {
    const r = plockaVarde('gcs');
    const normal = () => { valjV(r, 'oga', '4'); valjV(r, 'verbal', '5'); valjV(r, 'motorik', '6'); };

    rubrik('  Full poäng ger 15');
    normal();
    pastå('summan', r.varde.textContent, '15 poäng');
    pastå('lindrigt band', bandT(r), '13–15 poäng – lindrig skallskada');

    rubrik('  Ögonöppningens fyra steg');
    normal();
    [['4', 4], ['3', 3], ['2', 2], ['1', 1]].forEach(([v, p]) => {
      valjV(r, 'oga', v); pastå('öga ' + v, chipP(r, 'oga'), p); });

    rubrik('  Verbala svarets fem steg');
    normal();
    [['5', 5], ['4', 4], ['3', 3], ['2', 2], ['1', 1]].forEach(([v, p]) => {
      valjV(r, 'verbal', v); pastå('verbalt ' + v, chipP(r, 'verbal'), p); });

    rubrik('  Motoriska svarets sex steg');
    normal();
    [['6', 6], ['5', 5], ['4', 4], ['3', 3], ['2', 2], ['1', 1]].forEach(([v, p]) => {
      valjV(r, 'motorik', v); pastå('motoriskt ' + v, chipP(r, 'motorik'), p); });

    rubrik('  Lägsta möjliga summa är tre, inte noll');
    valjV(r, 'oga', '1'); valjV(r, 'verbal', '1'); valjV(r, 'motorik', '1');
    pastå('summan', r.varde.textContent, '3 poäng');
    pastå('svårt band', bandT(r), '3–8 poäng – svår skallskada');
    pastå('nivån', r.band.className, 'vt-band is-hog');

    rubrik('  Bandgränsen 8/9 prövad åt båda håll');
    valjV(r, 'oga', '1'); valjV(r, 'verbal', '2'); valjV(r, 'motorik', '5');
    pastå('summan', r.varde.textContent, '8 poäng');
    pastå('svårt band', bandT(r), '3–8 poäng – svår skallskada');
    valjV(r, 'verbal', '3');
    pastå('summan', r.varde.textContent, '9 poäng');
    pastå('måttligt band', bandT(r), '9–12 poäng – måttlig skallskada');

    rubrik('  Bandgränsen 12/13 prövad åt båda håll');
    valjV(r, 'oga', '2'); valjV(r, 'verbal', '4'); valjV(r, 'motorik', '6');
    pastå('summan', r.varde.textContent, '12 poäng');
    pastå('måttligt band', bandT(r), '9–12 poäng – måttlig skallskada');
    valjV(r, 'oga', '3');
    pastå('summan', r.varde.textContent, '13 poäng');
    pastå('lindrigt band', bandT(r), '13–15 poäng – lindrig skallskada');
  }

  /* ---- 4AT ---- */
  rubrik('4AT — snabbtest för delirium (Bellelli et al. 2014)');
  {
    const r = plockaVarde('fyra_at');
    const normal = () => { valjV(r, 'vakenhet', 'normal'); valjV(r, 'amt4', '0');
                           valjV(r, 'uppmarksamhet', '0'); valjV(r, 'akut', 'nej'); };

    rubrik('  Alla nollor ger 0 poäng');
    normal();
    pastå('summan', r.varde.textContent, '0 poäng');
    pastå('bandet', bandT(r), '0 poäng');

    rubrik('  Vakenheten ger noll eller fyra, inget däremellan');
    normal();
    [['normal', 0], ['avvikande', 4]].forEach(([v, p]) => {
      valjV(r, 'vakenhet', v); pastå('vakenhet ' + v, chipP(r, 'vakenhet'), p); });

    rubrik('  AMT4:s tre steg');
    normal();
    [['0', 0], ['1', 1], ['2', 2]].forEach(([v, p]) => {
      valjV(r, 'amt4', v); pastå('AMT4 ' + v + ' fel', chipP(r, 'amt4'), p); });

    rubrik('  Uppmärksamhetens tre steg');
    normal();
    [['0', 0], ['1', 1], ['2', 2]].forEach(([v, p]) => {
      valjV(r, 'uppmarksamhet', v); pastå('uppmärksamhet ' + v, chipP(r, 'uppmarksamhet'), p); });

    rubrik('  Akut förändring ger noll eller fyra');
    normal();
    [['nej', 0], ['ja', 4]].forEach(([v, p]) => {
      valjV(r, 'akut', v); pastå('akut ' + v, chipP(r, 'akut'), p); });

    rubrik('  Bandgränsen 0/1');
    normal();
    pastå('0 poäng', bandT(r), '0 poäng');
    valjV(r, 'amt4', '1');
    pastå('1 poäng', bandT(r), '1–3 poäng');

    rubrik('  Bandgränsen 3/4');
    normal(); valjV(r, 'amt4', '1'); valjV(r, 'uppmarksamhet', '2');
    pastå('3 poäng', r.varde.textContent, '3 poäng');
    pastå('3-poängsbandet', bandT(r), '1–3 poäng');
    valjV(r, 'akut', 'ja');
    pastå('7 poäng', r.varde.textContent, '7 poäng');
    pastå('4-eller-mer-bandet', bandT(r), '4 poäng eller mer');
    pastå('nivån', r.band.className, 'vt-band is-hog');

    rubrik('  Maxsumman är 12');
    valjV(r, 'vakenhet', 'avvikande'); valjV(r, 'amt4', '2');
    valjV(r, 'uppmarksamhet', '2'); valjV(r, 'akut', 'ja');
    pastå('12 poäng', r.varde.textContent, '12 poäng');
  }

  /* =========================================================
     Beslutsgången (mönster D): RLS-85, BE-FAST och HINTS
     ========================================================= */

  function plockaGang(namn) {
    const kort = platser[namn].children[0];
    const falt = {};
    kort.findAll((e) => e._class.has('vt-field')).forEach((f) => {
      falt[f.dataset.falt] = { valjare: f.find((e) => e.tagName === 'SELECT') };
    });
    const band = kort.find((e) => e._class.has('vt-band'));
    return {
      kort, falt, band,
      titel: () => band.children.find((c) => c._class.has('vt-band-titel')).textContent,
      nollknapp: kort.find((e) => e._class.has('vt-nollstall')).children[0]
    };
  }
  const valjG = (r, namn, v) => { r.falt[namn].valjare.value = v; r.falt[namn].valjare.fire('change'); };

  /* ---- RLS-85 ---- */
  rubrik('RLS-85 — reaktionsgradsskalan (Starmark, Stålhammar & Holmgren 1988)');
  {
    const r = plockaGang('rls85');
    const valj = (v) => valjG(r, 'niva', v);

    rubrik('  Samtliga åtta nivåer pekar på sin egen text');
    [
      ['1', 'Nivå 1 – vaken', 'vt-band is-ingen'],
      ['2', 'Nivå 2 – slö eller oklar', 'vt-band is-lag'],
      ['3', 'Nivå 3 – mycket slö eller oklar', 'vt-band is-medel'],
      ['4', 'Nivå 4 – medvetslös, lokaliserar smärta', 'vt-band is-medel'],
      ['5', 'Nivå 5 – medvetslös, undandragande rörelse', 'vt-band is-hog'],
      ['6', 'Nivå 6 – medvetslös, stereotyp böjning', 'vt-band is-hog'],
      ['7', 'Nivå 7 – medvetslös, stereotyp sträckning', 'vt-band is-hog'],
      ['8', 'Nivå 8 – ingen reaktion', 'vt-band is-hog']
    ].forEach(([v, titel, niva]) => {
      valj(v);
      pastå('nivå ' + v, r.titel(), titel);
      pastå('nivå ' + v + ' klass', r.band.className, niva);
    });

    rubrik('  Ingen Träna-flik och ingen poängchip');
    pastå('ingen lägesväljare', r.kort.find((e) => e._class.has('vt-mode')), null);
    pastå('ingen poängchip vid steget', r.kort.find((e) => e._class.has('vt-poang')), null);

    rubrik('  Nollställ går till nivå 1');
    valj('8');
    r.nollknapp.fire('click');
    pastå('valet återställs', r.falt.niva.valjare.value, '1');
    pastå('utfallet följer med', r.titel(), 'Nivå 1 – vaken');
  }

  /* ---- BE-FAST ---- */
  rubrik('BE-FAST — snabb igenkänning av stroke (Intermountain Healthcare 2011)');
  {
    const r = plockaGang('befast');

    rubrik('  Standardläget är alla Nej, vilket är ett äkta svar');
    pastå('rubriken', r.titel(), 'Inga fynd enligt BE-FAST');
    pastå('nivån', r.band.className, 'vt-band is-lag');

    rubrik('  Vart och ett av de fem fynden flyttar bedömningen ensamt');
    ['balans', 'ogon', 'ansikte', 'arm', 'tal'].forEach((namn) => {
      valjG(r, namn, 'ja');
      pastå(namn + ' ensamt', r.titel(), 'Misstanke om stroke – notera tidpunkten och larma');
      pastå(namn + ' nivå', r.band.className, 'vt-band is-hog');
      valjG(r, namn, 'nej');
      pastå(namn + ' återställt', r.titel(), 'Inga fynd enligt BE-FAST');
    });

    rubrik('  Flera Ja ändrar inte utfallet');
    valjG(r, 'balans', 'ja'); valjG(r, 'ogon', 'ja'); valjG(r, 'tal', 'ja');
    pastå('fortfarande misstanke', r.titel(), 'Misstanke om stroke – notera tidpunkten och larma');
    paståMed('T-förklaringen finns med', r.band.textContent, 'Time');
  }

  /* ---- HINTS ---- */
  rubrik('HINTS — ögonundersökning vid akut yrsel (Kattah et al. 2009)');
  {
    const r = plockaGang('hints');
    const perifert = () => {
      valjG(r, 'impuls', 'avvikande'); valjG(r, 'nystagmus', 'enkelriktad'); valjG(r, 'skew', 'negativ'); };

    rubrik('  Samtliga tre reassurerande fynd ger perifer bedömning');
    perifert();
    pastå('rubriken', r.titel(), 'Samtliga tre fynd talar för perifer orsak');
    pastå('nivån', r.band.className, 'vt-band is-lag');
    paståMed('reservationen om akut, ihållande yrsel finns med', r.band.textContent, 'ihållande yrsel');

    rubrik('  Vart och ett av de tre farliga fynden flyttar bedömningen ensamt');
    [['impuls', 'normal'], ['nystagmus', 'vaxlande'], ['skew', 'positiv']].forEach(([namn, varde]) => {
      perifert();
      valjG(r, namn, varde);
      pastå(namn + ' ensamt', r.titel(), 'Ett eller flera fynd talar för central orsak');
      pastå(namn + ' nivå', r.band.className, 'vt-band is-hog');
    });
  }

  console.log('\n' + (fel === 0
    ? `ALLA ${ok} TESTER GRÖNA`
    : `${fel} FEL av ${ok + fel} tester`));
  process.exit(fel === 0 ? 0 : 1);
}

kör();
