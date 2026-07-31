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
const SKALNAMN = ['news2', 'natrium_korrigerat', 'osmolalitet', 'blodgas'];
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

  console.log('\n' + (fel === 0
    ? `ALLA ${ok} TESTER GRÖNA`
    : `${fel} FEL av ${ok + fel} tester`));
  process.exit(fel === 0 ? 0 : 1);
}

kör();
