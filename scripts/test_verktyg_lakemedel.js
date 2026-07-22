/* =========================================================
   test_verktyg_lakemedel.js — tester för läkemedelsräknarna
   =========================================================
   Körs med:  node scripts/test_verktyg_lakemedel.js
   Avslutar med kod 0 när allt är grönt, annars 1.

   Ett minimalt DOM-skal gör att js/verktyg-lakemedel.js kan köras
   och drivas på riktigt utan webbläsare – testerna träffar alltså
   den kod som faktiskt levereras, inte en kopia av logiken.

   Skalet modellerar DOM-trädet och händelserna, INTE layouten.
   Bredder, marginaler och radbrytningar kan det omöjligt fånga
   (jfr felen i 0.9.205 och 0.9.206, som bara syntes renderade).
   Räknelogik, texter, varningar och lägesbyten fångar det däremot.

   Kör det här skriptet efter varje ändring i räknarna.
   ========================================================= */

const path = require('path');

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
      toggle: (c, on) => { if (on === undefined) on = !this._class.has(c); on ? this._class.add(c) : this._class.delete(c); }
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
  querySelector(sel) {
    const want = sel.replace('.', '');
    const walk = (n) => {
      for (const c of n.children) {
        if (c._class.has(want)) return c;
        const r = walk(c);
        if (r) return r;
      }
      return null;
    };
    return walk(this);
  }
  fire(type) { (this._listeners[type] || []).forEach(fn => fn.call(this, { key: '', preventDefault() {} })); }
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

const root = new El('div');
root.id = 'verktyg';
const registry = { verktyg: root };

global.document = {
  readyState: 'complete',
  createElement: (t) => (t === 'select' ? new SelectEl() : new El(t)),
  getElementById: (id) => registry[id] || null,
  addEventListener: () => {}
};

require(path.join(__dirname, '..', 'js', 'verktyg-lakemedel.js'));

/* ---------- testhjälpare ---------- */

const kort = (id) => root.children.find(k => k.id === id);
const faltInput = (k, namn) => k.find(e => e.tagName === 'INPUT' && e.id === k.id + '-' + namn);
const delInput = (k, del, namn) => k.find(e => e.tagName === 'INPUT' && e.id === k.id + '-' + del + '-' + namn);
const enhetValj = (k, namn) => {
  const f = k.find(e => e._class.has('vt-field') && e.dataset.falt === namn);
  return f ? f.find(e => e.tagName === 'SELECT') : null;
};
/* Enhetsväljaren i ett delblock – samma fältnamn kan finnas både i
   räknaren och i delblocket, så matchningen går via inmatningsfältets id. */
const delEnhetValj = (k, del, namn) => {
  const f = k.findAll(e => e._class.has('vt-field') && e.dataset.falt === namn)
    .find(x => x.find(i => i.tagName === 'INPUT' && i.id === k.id + '-' + del + '-' + namn));
  return f ? f.find(e => e.tagName === 'SELECT') : null;
};
const utBox = (k) => k.findAll(e => e._class.has('vt-out'))[0];
const utVarde = (k) => utBox(k).children.find(c => c._class.has('vt-out-value')).textContent;
const utCalc = (k) => utBox(k).children.find(c => c._class.has('vt-calc')).textContent;
const utLabel = (k) => utBox(k).children.find(c => c._class.has('vt-out-label')).textContent;
/* Rimlighetsrutorna: [0] röd och [1] gul hör till räknaren,
   därefter kommer delblockens par i tur och ordning. */
const varnRutor = (k) => k.findAll(e => e._class.has('vt-warn'));
const rodEl = (k, n = 0) => varnRutor(k)[n * 2];
const gulEl = (k, n = 0) => varnRutor(k)[n * 2 + 1];
const varnEl = (k) => gulEl(k);
const rodText = (k, n = 0) => (rodEl(k, n).hidden ? '' : rodEl(k, n).textContent);
const gulText = (k, n = 0) => (gulEl(k, n).hidden ? '' : gulEl(k, n).textContent);

function skriv(input, v) { input.value = v; input.fire('input'); }
function valjEnhet(sel, v) { sel.value = v; sel.fire('change'); }
function flik(k, text) {
  const rad = k.children.find(c => c._class.has('vt-flikar'));
  const b = rad.children.find(c => c.textContent === text);
  b.fire('click');
}

let fel = 0, ok = 0;
function pastå(namn, fick, vantat) {
  const bra = String(fick).trim() === String(vantat).trim();
  if (bra) { ok++; console.log('  OK   ' + namn); }
  else { fel++; console.log('  FEL  ' + namn + '\n         fick:    ' + fick + '\n         väntat:  ' + vantat); }
}
function paståMed(namn, fick, delstrang) {
  const bra = String(fick).includes(delstrang);
  if (bra) { ok++; console.log('  OK   ' + namn); }
  else { fel++; console.log('  FEL  ' + namn + '\n         fick:    ' + fick + '\n         saknar:  ' + delstrang); }
}

/* ---------- 1. Omvandlaren ---------- */
console.log('\n== Enhetsomvandlare ==');
{
  const k = kort('vt-omvandlare');
  const inp = k.find(e => e.tagName === 'INPUT');
  const sel = k.find(e => e.tagName === 'SELECT');
  valjEnhet(sel, 'g'); skriv(inp, '0,5');
  const poster = k.findAll(e => e._class.has('vt-omv-post')).map(p => p.textContent);
  paståMed('0,5 g → 500 mg', poster.join(' | '), '500mg');
  paståMed('0,5 g → 0,0005 kg', poster.join(' | '), '0,0005kg');
  paståMed('0,5 g → 500000 µg', poster.join(' | '), '500000µg');
  skriv(inp, 'abc');
  pastå('ogiltigt tal ger inga poster', k.findAll(e => e._class.has('vt-omv-post')).length, 0);
  paståMed('ogiltigt tal ger samma uppmaning som övriga räknare',
    k.find(e => e._class.has('vt-out') && e._class.has('is-tom')).textContent, 'Fyll i fältet ovan.');
  skriv(inp, '2');
  paståMed('ett giltigt tal ger tillbaka posterna', k.findAll(e => e._class.has('vt-omv-post'))[0].textContent, '2');

  flik(k, 'Koncentration');
  const inp2 = k.find(e => e.tagName === 'INPUT');
  const sel2 = k.find(e => e.tagName === 'SELECT');
  valjEnhet(sel2, '%'); skriv(inp2, '0,9');
  const p2 = k.findAll(e => e._class.has('vt-omv-post')).map(p => p.textContent).join(' | ');
  paståMed('0,9 % → 9 mg/ml', p2, '9mg/ml');
  skriv(inp2, '5');
  paståMed('5 % → 50 mg/ml', k.findAll(e => e._class.has('vt-omv-post')).map(p => p.textContent).join(' | '), '50mg/ml');
}

/* ---------- 2. Dos och styrka ---------- */
console.log('\n== Dos och styrka ==');
{
  const k = kort('vt-dos');
  skriv(faltInput(k, 'ordination'), '500');
  skriv(faltInput(k, 'styrka'), '20');
  pastå('500 mg ur 20 mg/ml → dosvolym', utVarde(k), '25 ml');
  pastå('uträkningen skrivs ut', utCalc(k), '500 mg ÷ 20 mg/ml = 25 ml');
  pastå('svarsetiketten namnger storheten', utLabel(k), 'Dosvolym');

  // ordination i gram ska ge samma svar
  skriv(faltInput(k, 'ordination'), '0,5');
  valjEnhet(enhetValj(k, 'ordination'), 'g');
  pastå('0,5 g ger samma dosvolym', utVarde(k), '25 ml');

  // lös ut styrkan i stället
  skriv(faltInput(k, 'ordination'), '50');
  valjEnhet(enhetValj(k, 'ordination'), 'mg');
  skriv(faltInput(k, 'styrka'), '');
  skriv(faltInput(k, 'dos'), '5');
  pastå('50 mg på 5 ml → styrka', utVarde(k), '10 mg/ml');

  // lös ut ordinationen
  skriv(faltInput(k, 'styrka'), '25');
  skriv(faltInput(k, 'dos'), '4');
  skriv(faltInput(k, 'ordination'), '');
  pastå('25 mg/ml × 4 ml → mängd', utVarde(k), '100 mg');

  // för många tomma
  skriv(faltInput(k, 'styrka'), '');
  paståMed('två tomma fält ger uppmaning', utVarde(k), 'Fyll i 1 fält till');

  // konsistenskontroll
  skriv(faltInput(k, 'ordination'), '100');
  skriv(faltInput(k, 'styrka'), '25');
  skriv(faltInput(k, 'dos'), '4');
  pastå('alla ifyllda och korrekta', utLabel(k), 'Stämmer');
  skriv(faltInput(k, 'dos'), '5');
  pastå('alla ifyllda men fel', utLabel(k), 'Stämmer inte');

  // rimlighetsvarning: liten volym
  skriv(faltInput(k, 'ordination'), '1');
  skriv(faltInput(k, 'styrka'), '50');
  skriv(faltInput(k, 'dos'), '');
  paståMed('0,02 ml ger rimlighetsvarning', gulText(k), 'under 0,1 ml går sällan att mäta upp');

  // tablettfliken
  flik(k, 'Tablett');
  skriv(faltInput(k, 'ordination'), '1000');
  skriv(faltInput(k, 'styrka'), '500');
  pastå('1000 mg / 500 mg per tablett', utVarde(k), '2 st');
  skriv(faltInput(k, 'ordination'), '2500');
  paståMed('5 tabletter varnar', gulText(k), '5 tabletter är fler än vad som normalt ges');
  skriv(faltInput(k, 'ordination'), '400');
  skriv(faltInput(k, 'styrka'), '300');
  paståMed('1,33 tabletter flaggas', utBox(k).children.find(c => c._class.has('vt-extra')).textContent, 'varken ett helt eller ett halvt');

  // delblock: dos efter kroppsvikt
  skriv(delInput(k, 'vikt', 'vikt'), '20');
  skriv(delInput(k, 'vikt', 'perkg'), '15');
  const delUt = k.findAll(e => e._class.has('vt-out'))[1];
  pastå('20 kg × 15 mg/kg', delUt.children.find(c => c._class.has('vt-out-value')).textContent, '300 mg');
}

/* ---------- 3. Infusion ---------- */
console.log('\n== Infusion ==');
{
  const k = kort('vt-infusion');
  skriv(faltInput(k, 'volym'), '1000');
  skriv(faltInput(k, 'tid'), '8');
  pastå('1000 ml på 8 h → takt', utVarde(k), '125 ml/h');
  paståMed('dropptakt nämns i extraraden', utBox(k).children.find(c => c._class.has('vt-extra')).textContent, '41,67 droppar/min');

  skriv(faltInput(k, 'tid'), '');
  skriv(faltInput(k, 'takt'), '125');
  pastå('1000 ml i 125 ml/h → tid', utVarde(k), '8 h');

  skriv(faltInput(k, 'volym'), '');
  skriv(faltInput(k, 'tid'), '8');
  pastå('125 ml/h i 8 h → volym', utVarde(k), '1000 ml');

  // tid i minuter
  skriv(faltInput(k, 'volym'), '');
  valjEnhet(enhetValj(k, 'tid'), 'min');
  skriv(faltInput(k, 'tid'), '30');
  skriv(faltInput(k, 'takt'), '200');
  pastå('200 ml/h i 30 min → 100 ml', utVarde(k), '100 ml');

  // droppar per minut
  skriv(delInput(k, 'dropp', 'volym'), '1000');
  const tidSel = k.findAll(e => e.tagName === 'SELECT').find(s => s.getAttribute('aria-label') === 'Tid – enhet' && s !== enhetValj(k, 'tid'));
  skriv(delInput(k, 'dropp', 'tid'), '8');
  skriv(delInput(k, 'dropp', 'df'), '20');
  const dUt = k.findAll(e => e._class.has('vt-out'))[1];
  pastå('1000 ml, 8 h, df 20 → droppar/min', dUt.children.find(c => c._class.has('vt-out-value')).textContent, '41,67 droppar/min');

  // mg/kg/h → ml/h
  skriv(delInput(k, 'perkgh', 'vikt'), '70');
  skriv(delInput(k, 'perkgh', 'perkgh'), '5');
  skriv(delInput(k, 'perkgh', 'styrka'), '25');
  const pUt = k.findAll(e => e._class.has('vt-out'))[2];
  pastå('70 kg, 5 mg/kg/h, 25 mg/ml → 14 ml/h', pUt.children.find(c => c._class.has('vt-out-value')).textContent, '14 ml/h');
  paståMed('mellansteget 350 mg/h visas', pUt.children.find(c => c._class.has('vt-calc')).textContent, '350 mg/h');
}

/* ---------- 4. Spädning ---------- */
console.log('\n== Spädning ==');
{
  const k = kort('vt-spadning');
  skriv(faltInput(k, 's1'), '10');
  skriv(faltInput(k, 's2'), '1');
  skriv(faltInput(k, 'v2'), '100');
  pastå('10 mg/ml → 1 mg/ml i 100 ml', utVarde(k), '10 ml');
  paståMed('spädningsvätskan anges', utBox(k).children.find(c => c._class.has('vt-extra')).textContent, '90 ml spädningsvätska');

  skriv(faltInput(k, 'v2'), '');
  skriv(faltInput(k, 'v1'), '10');
  pastå('slutvolym räknas ut', utVarde(k), '100 ml');

  skriv(faltInput(k, 'v2'), '100');
  skriv(faltInput(k, 's2'), '');
  pastå('slutstyrka räknas ut', utVarde(k), '1 mg/ml');

  // omöjlig spädning
  skriv(faltInput(k, 's2'), '20');
  skriv(faltInput(k, 'v1'), '');
  paståMed('kan inte späda upp styrkan', gulText(k), 'går inte att nå genom att späda');
}

/* ---------- 4b. Rimlighetskontrollen ---------- */
console.log('\n== Rimlighetskontroll ==');
{
  /* Först: normala uträkningar får INTE ge någon varning alls.
     Falska larm är det som gör en varning värdelös. */
  const d = kort('vt-dos');
  flik(d, 'Flytande');
  skriv(faltInput(d, 'ordination'), '500');
  skriv(faltInput(d, 'styrka'), '20');
  skriv(faltInput(d, 'dos'), '');
  pastå('500 mg / 20 mg/ml: ingen röd varning', rodEl(d).hidden, true);
  pastå('500 mg / 20 mg/ml: ingen gul varning', gulEl(d).hidden, true);

  skriv(delInput(d, 'vikt', 'vikt'), '70');
  skriv(delInput(d, 'vikt', 'perkg'), '15');
  pastå('70 kg × 15 mg/kg: ingen varning', rodEl(d, 1).hidden && gulEl(d, 1).hidden, true);

  const inf = kort('vt-infusion');
  valjEnhet(enhetValj(inf, 'tid'), 'h');
  skriv(faltInput(inf, 'volym'), '1000');
  skriv(faltInput(inf, 'tid'), '8');
  skriv(faltInput(inf, 'takt'), '');
  pastå('1000 ml på 8 h: ingen varning', rodEl(inf).hidden && gulEl(inf).hidden, true);

  const sp = kort('vt-spadning');
  skriv(faltInput(sp, 's1'), '10');
  skriv(faltInput(sp, 's2'), '1');
  skriv(faltInput(sp, 'v2'), '100');
  skriv(faltInput(sp, 'v1'), '');
  pastå('spädning 10→1 mg/ml: ingen varning', rodEl(sp).hidden && gulEl(sp).hidden, true);

  /* Vikt */
  skriv(delInput(d, 'vikt', 'vikt'), '800');
  paståMed('800 kg är omöjligt', rodText(d, 1), 'utanför vad som förekommer hos människa');
  paståMed('röda rutan avslutas likadant', rodText(d, 1), 'Kan orsaka livsfara');
  skriv(delInput(d, 'vikt', 'vikt'), '0,1');
  paståMed('0,1 kg är under lägsta överlevda födelsevikt', rodText(d, 1), '212 gram');
  skriv(delInput(d, 'vikt', 'vikt'), '400');
  paståMed('400 kg ger gul kontrollfråga', gulText(d, 1), 'Kontrollera vikten');
  pastå('400 kg är inte rött', rodEl(d, 1).hidden, true);
  skriv(delInput(d, 'vikt', 'vikt'), '70');

  /* Styrka */
  skriv(faltInput(d, 'styrka'), '2000');
  paståMed('2000 mg/ml är mer läkemedel än vätska', rodText(d), 'mer läkemedel än vätska');
  skriv(faltInput(d, 'styrka'), '600');
  paståMed('600 mg/ml jämförs med glukos 500 mg/ml', gulText(d), 'glukos 500 mg/ml');
  pastå('600 mg/ml är inte rött', rodEl(d).hidden, true);

  /* Ordinerad mängd */
  skriv(faltInput(d, 'styrka'), '20');
  valjEnhet(enhetValj(d, 'ordination'), 'g');
  skriv(faltInput(d, 'ordination'), '200');
  paståMed('200 g i en dos är omöjligt', rodText(d), 'över hundra gram');
  valjEnhet(enhetValj(d, 'ordination'), 'mg');

  /* Dosvolym ur svaret */
  skriv(faltInput(d, 'ordination'), '1');
  skriv(faltInput(d, 'styrka'), '500');
  skriv(faltInput(d, 'dos'), '');
  paståMed('0,002 ml går inte att mäta upp', rodText(d), 'går inte att mäta upp med spruta');

  /* Tabletter */
  flik(d, 'Tablett');
  skriv(faltInput(d, 'ordination'), '5000');
  skriv(faltInput(d, 'styrka'), '200');
  skriv(faltInput(d, 'dos'), '');
  paståMed('25 tabletter i en dos ges inte', rodText(d), 'i en och samma dos ges inte');

  /* Infusionstakt */
  valjEnhet(enhetValj(inf, 'tid'), 'min');
  skriv(faltInput(inf, 'volym'), '5000');
  skriv(faltInput(inf, 'tid'), '15');
  skriv(faltInput(inf, 'takt'), '');
  paståMed('20 000 ml/h är över tio liter i timmen', rodText(inf), 'över tio liter i timmen');

  /* Dropptakt */
  skriv(delInput(inf, 'dropp', 'volym'), '1000');
  valjEnhet(delEnhetValj(inf, 'dropp', 'tid'), 'min');
  skriv(delInput(inf, 'dropp', 'tid'), '1');
  skriv(delInput(inf, 'dropp', 'df'), '20');
  paståMed('20 000 droppar/min går inte att ställa in', rodText(inf, 1), 'övergår dropparna i en stråle');
  skriv(delInput(inf, 'dropp', 'df'), '500');
  paståMed('droppfaktor 500 finns inte', rodText(inf, 1), 'droppar/ml finns inte på något aggregat');
  valjEnhet(delEnhetValj(inf, 'dropp', 'tid'), 'h');
  skriv(delInput(inf, 'dropp', 'tid'), '8');
  skriv(delInput(inf, 'dropp', 'df'), '20');
  pastå('1000 ml, 8 h, df 20: ingen varning', rodEl(inf, 1).hidden && gulEl(inf, 1).hidden, true);
}

/* ---------- 4c. Rimligheten i träningsläget ---------- */
console.log('\n== Rimlighet i träningsläge ==');
{
  const k = kort('vt-dos');
  flik(k, 'Flytande');
  skriv(faltInput(k, 'ordination'), '1');
  skriv(faltInput(k, 'styrka'), '500');
  skriv(faltInput(k, 'dos'), '');
  pastå('räkneläget visar den röda varningen', rodEl(k).hidden, false);

  const lage = k.find(e => e._class.has('vt-mode'));
  lage.children.find(b => b.textContent === 'Träna').fire('click');
  pastå('träningsläget avslöjar inte svarets storlek', rodEl(k).hidden, true);

  /* Men ett orimligt INMATAT värde ska synas även när man tränar. */
  skriv(faltInput(k, 'styrka'), '5000');
  lage.children.find(b => b.textContent === 'Träna').fire('click');
  paståMed('inmatad omöjlig styrka varnar även i träningsläget', rodText(k), 'mer läkemedel än vätska');
  lage.children.find(b => b.textContent === 'Räkna').fire('click');
}

/* ---------- 5. Träningsläget ---------- */
console.log('\n== Träningsläge ==');
{
  const k = kort('vt-dos');
  flik(k, 'Flytande');
  skriv(faltInput(k, 'ordination'), '500');
  skriv(faltInput(k, 'styrka'), '20');
  skriv(faltInput(k, 'dos'), '');
  const lage = k.find(e => e._class.has('vt-mode'));
  const tranaKnapp = lage.children.find(b => b.textContent === 'Träna');
  tranaKnapp.fire('click');

  pastå('kortet markeras som träningsläge', k.classList.contains('is-trana'), true);
  pastå('svaret döljs i träningsläget', utBox(k).hidden, true);
  const svarsruta = k.find(e => e._class.has('vt-svarsruta'));
  pastå('svarsrutan visas', svarsruta.hidden, false);
  pastå('etiketten säger Ditt svar', svarsruta.children[0].textContent, 'Ditt svar');

  const svarInput = k.find(e => e.tagName === 'INPUT' && e.id === 'vt-dos-ditt-svar');
  const knapp = k.find(e => e.tagName === 'BUTTON' && e.textContent === 'Kontrollera');
  const domEl = svarsruta.children[2];

  svarInput.value = '25'; knapp.fire('click');
  paståMed('rätt svar godkänns', domEl.textContent, 'Rätt.');

  svarInput.value = '2,5'; knapp.fire('click');
  paståMed('tiopotensfel får egen ledtråd', domEl.textContent, 'en tiopotens fel');

  svarInput.value = '7'; knapp.fire('click');
  paståMed('fel svar avvisas med facit', domEl.textContent, 'Rätt svar är 25 ml');

  const raknaKnapp = lage.children.find(b => b.textContent === 'Räkna');
  raknaKnapp.fire('click');
  pastå('åter i räkneläget', k.classList.contains('is-trana'), false);
  pastå('svaret syns igen', utBox(k).hidden, false);
}

console.log('\n' + (fel === 0 ? 'ALLA ' + ok + ' TESTER OK' : fel + ' FEL av ' + (ok + fel)));
process.exit(fel === 0 ? 0 : 1);
