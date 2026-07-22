/* =========================================================
   verktyg-lakemedel.js — räknare för läkemedelsberäkning
   =========================================================
   Fyra räknare som alla följer samma princip: fyll i det du vet,
   lämna det du vill veta tomt, så räknas det ut. Det fält som är
   tomt är svaret — inget val av "vad vill du räkna ut" behövs.

   Två lägen per räknare:
   - Räkna  (standard) — svaret visas direkt.
   - Träna            — svaret ersätts av ett tomt "Ditt svar"-fält
                        och visas först när du skrivit in något.
     Skillnaden mellan lägena ÄR gränssnittsskillnaden: i träningsläget
     finns ingen siffra att läsa av, så lägena kan inte förväxlas.

   Ingen inmatning sparas, och läget nollställs när sidan lämnas.
   Inga externa beroenden; CSP script-src 'self'.
   ========================================================= */
(function () {
  'use strict';

  /* ---------------------------------------------------------
     Tal in och ut — svenskt decimalkomma ska alltid fungera
     --------------------------------------------------------- */

  /** Tolkar ett inmatat tal. Godtar både komma och punkt. */
  function tolkaTal(text) {
    if (typeof text !== 'string') return NaN;
    var t = text.trim().replace(/\s/g, '').replace(',', '.');
    if (t === '') return NaN;
    if (!/^-?\d*\.?\d+$/.test(t)) return NaN;
    return parseFloat(t);
  }

  /** Antal decimaler som är meningsfullt att visa för ett tal.
      Mycket små tal måste få fler decimaler, annars visas 0,5 mg som
      "0 kg" i omvandlaren i stället för 0,0000005 kg. */
  function decimaler(n) {
    var a = Math.abs(n);
    if (a === 0) return 0;
    if (a >= 100) return 1;
    if (a >= 1) return 2;
    if (a >= 0.1) return 3;
    if (a >= 0.001) return 4;
    return Math.min(12, Math.ceil(-Math.log10(a)) + 2);
  }

  /** Formaterar ett tal med svenskt decimalkomma och rimlig avrundning. */
  function visaTal(n) {
    if (!isFinite(n)) return '—';
    var s = n.toFixed(decimaler(n));
    if (s.indexOf('.') !== -1) s = s.replace(/0+$/, '').replace(/\.$/, '');
    return s.replace('.', ',');
  }

  /* ---------------------------------------------------------
     Rimlighetskontroll
     ---------------------------------------------------------
     Räknarna vet inte vilket preparat det gäller, och kan därför
     aldrig avgöra om en dos är *rätt*. Det de kan avgöra är om ett
     värde över huvud taget kan förekomma: ingen människa väger 700 kg,
     ingen lösning kan innehålla mer än ett gram läkemedel per
     milliliter, och en spruta kan inte mäta upp en tusendels
     milliliter. Kontrollen ligger alltså på storleksordning, inte på
     dos — det är också där de vanligaste felen uppstår, eftersom ett
     tiopotens- eller enhetsfel flyttar svaret långt utanför spannet.

     Två nivåer:
       rod – värdet ligger utanför vad som är möjligt.
       gul – värdet är möjligt men ovanligt; värt en kontroll.

     Gränserna är satta med marginal åt bägge håll, så att verkliga
     ytterlighetsfall (nyfödda, högdosbehandlingar, koncentrat) ryms
     utan varning. Underlaget står i sidans referenslista.
     --------------------------------------------------------- */

  var RIMLIGHET = {
    /* Kroppsvikt i kg. Lägsta födelsevikt någon överlevt är 212 g;
       tyngsta dokumenterade kroppsvikt hos människa är 635 kg. */
    vikt: {
      rod: [
        { over: 700, text: 'En kroppsvikt på {v} kg ligger utanför vad som förekommer hos människa – den tyngsta vikt som någonsin dokumenterats är 635 kg.' },
        { under: 0.2, text: 'En kroppsvikt på {v} kg är lägre än den lägsta födelsevikt någon har överlevt (212 gram). Är vikten angiven i gram i stället för kilogram?' }
      ],
      gul: [
        { over: 300, text: 'Kontrollera vikten – {v} kg är en mycket ovanlig kroppsvikt.' },
        { under: 0.5, text: 'Kontrollera vikten – {v} kg motsvarar en extremt tidig förlossning.' }
      ]
    },

    /* Ordinerad mängd i mg. */
    massa: {
      rod: [
        { over: 1e5, text: 'En enskild dos på {v} mg är över hundra gram läkemedel. Så stora mängder ges inte.' }
      ],
      gul: [
        { over: 1e4, text: 'Kontrollera ordinationen – {v} mg är över tio gram i en och samma dos, vilket är ovanligt även för högdoserade preparat.' },
        { under: 1e-4, text: 'Kontrollera ordinationen – {v} mg är mindre än en tiondels mikrogram.' }
      ]
    },

    /* Styrka i mg/ml. 1000 mg/ml = 100 %, alltså mer läkemedel än
       vätska. Den starkaste infusionslösningen i Fass är glukos
       500 mg/ml. */
    styrka: {
      rod: [
        { over: 1000, text: 'En styrka på {v} mg/ml är mer än ett gram läkemedel per milliliter, alltså mer läkemedel än vätska. Så koncentrerade lösningar finns inte.' }
      ],
      gul: [
        { over: 500, text: 'Kontrollera styrkan – {v} mg/ml är starkare än de mest koncentrerade infusionslösningar som finns (glukos 500 mg/ml).' },
        { under: 1e-3, text: 'Kontrollera styrkan – {v} mg/ml är under ett mikrogram per milliliter.' }
      ]
    },

    /* Volym för en enskild dos, i ml. */
    dosvolym: {
      rod: [
        { over: 2000, text: 'En dosvolym på {v} ml är över två liter i en och samma dos.' },
        { under: 0.01, text: 'En dosvolym på {v} ml går inte att mäta upp med spruta. Kontrollera styrkan – det är den som avgör volymen.' }
      ],
      gul: [
        { over: 500, text: 'Kontrollera dosvolymen – {v} ml är en mycket stor volym för en enskild dos.' },
        { under: 0.1, text: 'Kontrollera styrkan – volymer under 0,1 ml går sällan att mäta upp säkert.' }
      ]
    },

    /* Antal tabletter i en dos. */
    tabletter: {
      rod: [
        { over: 20, text: '{v} tabletter i en och samma dos ges inte.' }
      ],
      gul: [
        { over: 4, text: 'Kontrollera ordinationen och tablettstyrkan – {v} tabletter är fler än vad som normalt ges i en dos.' },
        { under: 0.25, text: 'Kontrollera ordinationen – {v} tabletter är mindre än en kvarts tablett, och tabletter delas sällan i mindre delar än så.' }
      ]
    },

    /* Dos per kilo kroppsvikt, mg/kg. */
    perkg: {
      rod: [
        { over: 5000, text: 'En dos på {v} mg/kg är över fem gram läkemedel per kilo kroppsvikt.' }
      ],
      gul: [
        { over: 200, text: 'Kontrollera dosen per kilo – {v} mg/kg ligger över de doser som normalt ordineras per kilogram.' }
      ]
    },

    /* Dos per kilo och timme, mg/kg/h. */
    perkgh: {
      rod: [
        { over: 1000, text: 'En dos på {v} mg/kg/h är över ett gram läkemedel per kilo kroppsvikt och timme.' }
      ],
      gul: [
        { over: 100, text: 'Kontrollera dosen – {v} mg/kg/h ligger över de doser som normalt ges som kontinuerlig infusion.' }
      ]
    },

    /* Infusionstakt, ml/h. */
    takt: {
      rod: [
        { over: 10000, text: 'En infusionstakt på {v} ml/h är över tio liter i timmen.' }
      ],
      gul: [
        { over: 999, text: 'Kontrollera volym och tid – {v} ml/h är mer än de flesta volympumpar tar emot.' }
      ]
    },

    /* Volym som ska infunderas, ml. */
    infvolym: {
      rod: [
        { over: 20000, text: 'En infusionsvolym på {v} ml är över tjugo liter.' }
      ],
      gul: [
        { over: 5000, text: 'Kontrollera volymen – {v} ml är mer än fem liter i en och samma infusion.' }
      ]
    },

    /* Infusionstid, minuter. */
    infusionstid: {
      rod: [
        { over: 43200, text: 'En infusionstid på {v} minuter är längre än en månad.' }
      ],
      gul: [
        { over: 4320, text: 'Kontrollera tiden – {v} minuter är längre än tre dygn.' },
        { under: 1, text: 'Kontrollera tiden – {v} minuter är kortare än en minut.' }
      ]
    },

    /* Droppfaktor, droppar/ml. Klara lösningar 20, blod omkring 15. */
    droppfaktor: {
      rod: [
        { over: 200, text: 'En droppfaktor på {v} droppar/ml finns inte på något aggregat.' },
        { under: 1, text: 'En droppfaktor på {v} droppar/ml finns inte på något aggregat.' }
      ],
      gul: [
        { over: 60, text: 'Kontrollera droppfaktorn på förpackningen – vanliga aggregat ligger på 15–20 droppar/ml.' },
        { under: 10, text: 'Kontrollera droppfaktorn på förpackningen – vanliga aggregat ligger på 15–20 droppar/ml.' }
      ]
    },

    /* Dropptakt, droppar/min. */
    dropptakt: {
      rod: [
        { over: 400, text: 'En dropptakt på {v} droppar/min går inte att ställa in – vid den takten övergår dropparna i en stråle.' }
      ],
      gul: [
        { over: 150, text: 'Kontrollera volym och tid – {v} droppar/min är en mycket hög takt att ställa in för hand.' }
      ]
    }
  };

  /** Prövar ett värde mot sitt spann. Returnerar null när allt är rimligt. */
  function granskaVarde(typ, varde) {
    var post = RIMLIGHET[typ];
    if (!post || !isFinite(varde)) return null;
    var nivaer = ['rod', 'gul'];
    for (var i = 0; i < nivaer.length; i++) {
      var regler = post[nivaer[i]] || [];
      for (var j = 0; j < regler.length; j++) {
        var r = regler[j];
        if ((r.over != null && varde > r.over) || (r.under != null && varde < r.under)) {
          return { niva: nivaer[i], text: r.text.replace('{v}', visaTal(varde)) };
        }
      }
    }
    return null;
  }

  /* ---------------------------------------------------------
     Enheter
     --------------------------------------------------------- */

  var GRUPPER = {
    massa: { bas: 'mg', enheter: [['kg', 1e6], ['g', 1e3], ['mg', 1], ['µg', 1e-3]] },
    volym: { bas: 'ml', enheter: [['l', 1000], ['dl', 100], ['ml', 1]] },
    tid:   { bas: 'min', enheter: [['dygn', 1440], ['h', 60], ['min', 1]] }
  };

  function faktor(grupp, enhet) {
    var lista = GRUPPER[grupp].enheter;
    for (var i = 0; i < lista.length; i++) if (lista[i][0] === enhet) return lista[i][1];
    return 1;
  }

  /* ---------------------------------------------------------
     Fält
     --------------------------------------------------------- */

  /**
   * Bygger ett inmatningsfält med enheten i samma ram som talet.
   * @param {Object} spec  {namn, etikett, grupp?, enhet?, standard?, plats?}
   */
  function byggFalt(spec, idPrefix) {
    var wrap = document.createElement('label');
    wrap.className = 'vt-field';
    wrap.dataset.falt = spec.namn;

    var rubrik = document.createElement('span');
    rubrik.textContent = spec.etikett;
    wrap.appendChild(rubrik);

    var rad = document.createElement('div');
    rad.className = 'vt-inputrow';

    var input = document.createElement('input');
    input.type = 'text';
    input.inputMode = 'decimal';
    input.autocomplete = 'off';
    input.id = idPrefix + '-' + spec.namn;
    input.placeholder = spec.plats || '';
    rad.appendChild(input);

    var valjare = null;
    if (spec.grupp) {
      valjare = document.createElement('select');
      valjare.setAttribute('aria-label', spec.etikett + ' – enhet');
      GRUPPER[spec.grupp].enheter.forEach(function (e) {
        var o = document.createElement('option');
        o.value = e[0];
        o.textContent = e[0];
        if (e[0] === spec.standard) o.selected = true;
        valjare.appendChild(o);
      });
      rad.appendChild(valjare);
    } else if (spec.enhet) {
      var fast = document.createElement('span');
      fast.className = 'vt-unit-fixed';
      fast.textContent = spec.enhet;
      rad.appendChild(fast);
    }

    wrap.appendChild(rad);
    return { el: wrap, input: input, valjare: valjare, spec: spec };
  }

  /** Fältets värde omräknat till gruppens basenhet (eller råvärdet). */
  function basvarde(f) {
    var n = tolkaTal(f.input.value);
    if (isNaN(n)) return NaN;
    if (!f.spec.grupp) return n;
    return n * faktor(f.spec.grupp, f.valjare.value);
  }

  /** Räknar om ett basvärde till fältets valda enhet. */
  function tillFaltenhet(f, basN) {
    if (!f.spec.grupp) return basN;
    return basN / faktor(f.spec.grupp, f.valjare.value);
  }

  /** Enhetstexten som ska stå efter svaret. */
  function faltenhet(f) {
    return f.spec.grupp ? f.valjare.value : (f.spec.enhet || '');
  }

  /* ---------------------------------------------------------
     Varningsrutorna
     --------------------------------------------------------- */

  var VARNTITEL = {
    rod: 'Varning: orimligt värde',
    gul: 'Kontrollera värdet'
  };

  /* Den röda rutan avslutas alltid likadant, så att raden känns igen
     var i räknaren den än dyker upp. */
  var RODSLUT = 'Kan orsaka livsfara – kontrollera dina uppgifter en gång till.';

  function byggVarnruta(niva) {
    var el = document.createElement('div');
    el.className = 'vt-warn' + (niva === 'rod' ? ' is-fara' : '');
    el.hidden = true;
    if (niva === 'rod') el.setAttribute('role', 'alert');
    var titel = document.createElement('strong');
    titel.className = 'vt-warn-titel';
    titel.textContent = VARNTITEL[niva];
    var text = document.createElement('div');
    text.className = 'vt-warn-text';
    el.appendChild(titel);
    el.appendChild(text);
    return { el: el, text: text, niva: niva };
  }

  function fyllVarnruta(ruta, rader) {
    ruta.text.innerHTML = '';
    if (!rader.length) { ruta.el.hidden = true; return; }
    ruta.el.hidden = false;
    rader.forEach(function (r) {
      var p = document.createElement('p');
      p.textContent = r;
      ruta.text.appendChild(p);
    });
    if (ruta.niva === 'rod') {
      var slut = document.createElement('p');
      slut.className = 'vt-warn-slut';
      slut.textContent = RODSLUT;
      ruta.text.appendChild(slut);
    }
  }

  /**
   * Granskar en uppsättning värden och fyller de två rutorna.
   * @param {Object} rutor  {rod, gul} från byggVarnruta
   * @param {Array} poster  [{typ, varde, svar?}] – svar:true för det
   *   räknaren själv kommit fram till.
   * @param {Array} extra   redan formulerade gula meddelanden
   * @param {boolean} doljSvar  i träningsläget får svarets storlek inte
   *   avslöjas, så bara inmatade värden granskas.
   * @returns {boolean} sant när något värde är orimligt.
   */
  function visaRimlighet(rutor, poster, extra, doljSvar) {
    var rod = [];
    var gul = (extra || []).slice();
    poster.forEach(function (p) {
      if (doljSvar && p.svar) return;
      var t = granskaVarde(p.typ, p.varde);
      if (!t) return;
      var lista = t.niva === 'rod' ? rod : gul;
      if (lista.indexOf(t.text) === -1) lista.push(t.text);
    });
    fyllVarnruta(rutor.rod, rod);
    fyllVarnruta(rutor.gul, gul);
    return rod.length > 0;
  }

  /* ---------------------------------------------------------
     Motorn
     --------------------------------------------------------- */

  /**
   * Kopplar en räknare.
   * @param {Object} cfg
   *   id       – unikt prefix
   *   rubrik   – kortets rubrik
   *   intro    – kort förklaring
   *   falt     – fältspecar (de som ingår i sambandet)
   *   rakna    – funktion(v, tomt) → {varde, uttryck, extra?, varning?}
   *              v[namn] = basvärde, tomt = namnet på det tomma fältet.
   *              Returnerar varde i det tomma fältets BASenhet.
   *   stammer  – funktion(v) → {ok, uttryck} när alla fält är ifyllda
   *   flikar   – valfritt {etikett, val:[{id,text,falt,rakna,stammer}]}
   *   delblock – valfria härledda block
   */
  function skapa(cfg) {
    var kort = document.createElement('section');
    kort.className = 'vt-tool';
    kort.id = cfg.id;

    /* Huvud med rubrik och lägesväljare */
    var huvud = document.createElement('div');
    huvud.className = 'vt-tool-head';
    var h3 = document.createElement('h3');
    h3.textContent = cfg.rubrik;
    h3.id = cfg.id + '-rubrik';
    huvud.appendChild(h3);

    var lage = document.createElement('div');
    lage.className = 'vt-mode';
    lage.setAttribute('role', 'group');
    lage.setAttribute('aria-label', 'Läge för ' + cfg.rubrik);
    var knappRakna = document.createElement('button');
    knappRakna.type = 'button';
    knappRakna.textContent = 'Räkna';
    knappRakna.setAttribute('aria-pressed', 'true');
    var knappTrana = document.createElement('button');
    knappTrana.type = 'button';
    knappTrana.textContent = 'Träna';
    knappTrana.setAttribute('aria-pressed', 'false');
    lage.appendChild(knappRakna);
    lage.appendChild(knappTrana);
    huvud.appendChild(lage);
    kort.appendChild(huvud);

    var intro = document.createElement('p');
    intro.className = 'vt-tool-intro';
    intro.textContent = cfg.intro;
    kort.appendChild(intro);

    /* Flikar (t.ex. beredningsform) */
    var aktivFlik = cfg.flikar ? cfg.flikar.val[0] : null;
    if (cfg.flikar) {
      var flikrad = document.createElement('div');
      flikrad.className = 'vt-flikar';
      flikrad.setAttribute('role', 'group');
      flikrad.setAttribute('aria-label', cfg.flikar.etikett);
      cfg.flikar.val.forEach(function (v, i) {
        var b = document.createElement('button');
        b.type = 'button';
        b.textContent = v.text;
        b.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');
        b.addEventListener('click', function () {
          aktivFlik = v;
          Array.prototype.forEach.call(flikrad.children, function (x) {
            x.setAttribute('aria-pressed', String(x === b));
          });
          byggFalten();
          rakna();
        });
        flikrad.appendChild(b);
      });
      kort.appendChild(flikrad);
    }

    var rutnat = document.createElement('div');
    rutnat.className = 'vt-grid';
    kort.appendChild(rutnat);

    /* Utfall (räkna-läget) */
    var ut = document.createElement('div');
    ut.className = 'vt-out is-tom';
    ut.setAttribute('aria-live', 'polite');
    var utEtikett = document.createElement('span');
    utEtikett.className = 'vt-out-label';
    utEtikett.textContent = 'Svar';
    var utVarde = document.createElement('div');
    utVarde.className = 'vt-out-value';
    var utCalc = document.createElement('div');
    utCalc.className = 'vt-calc';
    var utExtra = document.createElement('div');
    utExtra.className = 'vt-extra';
    ut.appendChild(utEtikett);
    ut.appendChild(utVarde);
    ut.appendChild(utCalc);
    ut.appendChild(utExtra);
    kort.appendChild(ut);

    /* Svarsruta (träningsläget) */
    var svarsruta = document.createElement('div');
    svarsruta.className = 'vt-svarsruta';
    svarsruta.hidden = true;
    var svarEtikett = document.createElement('span');
    svarEtikett.className = 'vt-out-label';
    svarEtikett.textContent = 'Ditt svar';
    var svarRad = document.createElement('div');
    svarRad.className = 'vt-svarsrad';
    var svarWrap = document.createElement('div');
    svarWrap.className = 'vt-inputrow';
    var svarInput = document.createElement('input');
    svarInput.type = 'text';
    svarInput.inputMode = 'decimal';
    svarInput.autocomplete = 'off';
    svarInput.id = cfg.id + '-ditt-svar';
    svarInput.setAttribute('aria-label', 'Ditt svar');
    var svarEnhet = document.createElement('span');
    svarEnhet.className = 'vt-unit-fixed';
    svarWrap.appendChild(svarInput);
    svarWrap.appendChild(svarEnhet);
    var svarKnapp = document.createElement('button');
    svarKnapp.type = 'button';
    svarKnapp.textContent = 'Kontrollera';
    svarRad.appendChild(svarWrap);
    svarRad.appendChild(svarKnapp);
    var dom = document.createElement('div');
    dom.setAttribute('aria-live', 'polite');
    svarsruta.appendChild(svarEtikett);
    svarsruta.appendChild(svarRad);
    svarsruta.appendChild(dom);
    kort.appendChild(svarsruta);

    /* Rimlighetsrutorna. Den röda ligger överst och närmast svaret –
       ser man bara en sak till ska det vara den. */
    var varnRod = byggVarnruta('rod');
    var varnGul = byggVarnruta('gul');
    kort.appendChild(varnRod.el);
    kort.appendChild(varnGul.el);

    /* Härledda delblock */
    var delblock = [];
    (cfg.delblock || []).forEach(function (db) {
      var block = document.createElement('div');
      block.className = 'vt-delblock';
      var h4 = document.createElement('h4');
      h4.textContent = db.rubrik;
      block.appendChild(h4);
      var p = document.createElement('p');
      p.textContent = db.intro;
      block.appendChild(p);
      var g = document.createElement('div');
      g.className = 'vt-grid';
      var falt = db.falt.map(function (s) {
        var f = byggFalt(s, cfg.id + '-' + db.id);
        g.appendChild(f.el);
        return f;
      });
      block.appendChild(g);
      var dut = document.createElement('div');
      dut.className = 'vt-out is-tom';
      dut.setAttribute('aria-live', 'polite');
      var dl = document.createElement('span');
      dl.className = 'vt-out-label';
      dl.textContent = db.svarsetikett;
      var dv = document.createElement('div');
      dv.className = 'vt-out-value';
      var dc = document.createElement('div');
      dc.className = 'vt-calc';
      dut.appendChild(dl); dut.appendChild(dv); dut.appendChild(dc);
      block.appendChild(dut);
      var dRod = byggVarnruta('rod');
      var dGul = byggVarnruta('gul');
      block.appendChild(dRod.el);
      block.appendChild(dGul.el);
      kort.appendChild(block);
      var post = { spec: db, falt: falt, ut: dut, varde: dv, calc: dc, block: block, rutor: { rod: dRod, gul: dGul } };
      delblock.push(post);
      falt.forEach(function (f) {
        f.input.addEventListener('input', function () { raknaDel(post); });
        if (f.valjare) f.valjare.addEventListener('change', function () { raknaDel(post); });
      });
    });

    /* Nollställ */
    var nollrad = document.createElement('div');
    nollrad.className = 'vt-nollstall';
    var nollknapp = document.createElement('button');
    nollknapp.type = 'button';
    nollknapp.textContent = 'Nollställ';
    nollrad.appendChild(nollknapp);
    kort.appendChild(nollrad);

    /* ---- tillstånd ---- */
    var falt = [];
    var traningslage = false;
    var sisteSvar = null; // {basvarde, falt}
    var rimPoster = [];   // granskade värden från senaste uträkningen
    var rimGula = [];     // mjuka varningar från räknaren själv

    function aktivaFaltspecar() {
      return aktivFlik ? aktivFlik.falt : cfg.falt;
    }
    function aktivRakna() {
      return aktivFlik ? aktivFlik.rakna : cfg.rakna;
    }

    function byggFalten() {
      rutnat.innerHTML = '';
      falt = aktivaFaltspecar().map(function (s) {
        var f = byggFalt(s, cfg.id);
        rutnat.appendChild(f.el);
        f.input.addEventListener('input', rakna);
        if (f.valjare) f.valjare.addEventListener('change', rakna);
        return f;
      });
    }

    function hittaFalt(namn) {
      for (var i = 0; i < falt.length; i++) if (falt[i].spec.namn === namn) return falt[i];
      return null;
    }

    function rakna() {
      falt.forEach(function (f) {
        f.el.classList.remove('is-svar');
        f.input.placeholder = f.spec.plats || '';
      });
      dom.className = '';
      dom.textContent = '';
      svarInput.value = '';
      rimPoster = [];
      rimGula = [];

      var v = {};
      var tomma = [];
      var ogiltigt = false;
      falt.forEach(function (f) {
        var rå = f.input.value.trim();
        if (rå === '') { tomma.push(f.spec.namn); return; }
        var n = basvarde(f);
        if (isNaN(n) || n <= 0) { ogiltigt = true; return; }
        v[f.spec.namn] = n;
        /* Varje inmatat värde granskas för sig, oavsett om det räcker
           till en uträkning — ett orimligt tal ska synas direkt. */
        if (f.spec.rim) rimPoster.push({ typ: f.spec.rim, varde: n });
      });

      if (ogiltigt) {
        visaTomt('Kontrollera talen – använd siffror, och komma eller punkt som decimaltecken.');
        return;
      }

      if (tomma.length > 1) {
        visaTomt('Fyll i ' + (tomma.length - 1) + ' fält till, och lämna det du vill veta tomt.');
        return;
      }

      if (tomma.length === 0) {
        var kontroll = (aktivFlik && aktivFlik.stammer ? aktivFlik.stammer : cfg.stammer)(v);
        sisteSvar = null;
        ut.classList.remove('is-tom');
        utEtikett.textContent = kontroll.ok ? 'Stämmer' : 'Stämmer inte';
        utVarde.textContent = kontroll.ok ? 'Talen hänger ihop' : 'Talen går inte ihop';
        utCalc.textContent = kontroll.uttryck;
        utExtra.textContent = kontroll.ok
          ? 'Lämna ett fält tomt om du vill räkna ut det i stället.'
          : 'Kontrollera enheterna – ett av talen ligger fel.';
        lagesvy();
        return;
      }

      var malfalt = hittaFalt(tomma[0]);
      var svar;
      try {
        svar = aktivRakna()(v, tomma[0]);
      } catch (e) {
        visaTomt('Den kombinationen går inte att räkna ut.');
        return;
      }
      if (!svar || !isFinite(svar.varde) || svar.varde < 0) {
        visaTomt('Den kombinationen går inte att räkna ut.');
        return;
      }

      malfalt.el.classList.add('is-svar');
      malfalt.input.placeholder = 'räknas ut';

      var iFaltenhet = tillFaltenhet(malfalt, svar.varde);
      sisteSvar = { varde: iFaltenhet, enhet: faltenhet(malfalt), etikett: malfalt.spec.etikett, uttryck: svar.uttryck };

      ut.classList.remove('is-tom');
      utEtikett.textContent = malfalt.spec.etikett;
      utVarde.textContent = visaTal(iFaltenhet) + ' ' + faltenhet(malfalt);
      utCalc.textContent = svar.uttryck;
      utExtra.textContent = svar.extra || '';

      if (svar.varning) rimGula.push(svar.varning);
      if (malfalt.spec.rim) {
        rimPoster.push({ typ: malfalt.spec.rim, varde: svar.varde, svar: true });
      }

      svarEnhet.textContent = faltenhet(malfalt);
      lagesvy();
    }

    function visaTomt(text) {
      sisteSvar = null;
      ut.classList.add('is-tom');
      utEtikett.textContent = 'Svar';
      utVarde.textContent = text;
      utCalc.textContent = '';
      utExtra.textContent = '';
      lagesvy();
    }

    function raknaDel(post) {
      var v = {};
      var klart = true;
      var poster = [];
      post.falt.forEach(function (f) {
        var n = basvarde(f);
        if (isNaN(n) || n <= 0) { klart = false; return; }
        v[f.spec.namn] = n;
        if (f.spec.rim) poster.push({ typ: f.spec.rim, varde: n });
      });
      if (!klart) {
        post.ut.classList.add('is-tom');
        post.varde.textContent = 'Fyll i fälten ovan.';
        post.calc.textContent = '';
        post.block.classList.toggle('is-orimligt', visaRimlighet(post.rutor, poster, [], false));
        return;
      }
      var r = post.spec.rakna(v);
      post.ut.classList.remove('is-tom');
      post.varde.textContent = r.text;
      post.calc.textContent = r.uttryck;
      if (post.spec.rim) poster.push({ typ: post.spec.rim, varde: r.varde });
      post.block.classList.toggle('is-orimligt', visaRimlighet(post.rutor, poster, [], false));
    }

    /* Visar rätt ruta för läget. I träningsläget finns ingen siffra
       att läsa av — det är själva skyddet mot att lägena förväxlas. */
    function lagesvy() {
      /* Ett svar som bygger på ett omöjligt värde ska inte ligga kvar i
         den gröna rutan och se bekräftat ut. */
      var orimligt = visaRimlighet({ rod: varnRod, gul: varnGul }, rimPoster, rimGula, traningslage);
      kort.classList.toggle('is-orimligt', orimligt);
      var harSvar = sisteSvar !== null;
      if (traningslage) {
        ut.hidden = true;
        svarsruta.hidden = !harSvar;
        svarKnapp.disabled = !harSvar;
      } else {
        ut.hidden = false;
        svarsruta.hidden = true;
      }
    }

    function sattLage(trana) {
      traningslage = trana;
      kort.classList.toggle('is-trana', trana);
      knappRakna.setAttribute('aria-pressed', String(!trana));
      knappTrana.setAttribute('aria-pressed', String(trana));
      svarEtikett.textContent = 'Ditt svar';
      dom.className = '';
      dom.textContent = '';
      svarInput.value = '';
      lagesvy();
    }

    knappRakna.addEventListener('click', function () { sattLage(false); });
    knappTrana.addEventListener('click', function () { sattLage(true); });

    svarKnapp.addEventListener('click', function () {
      if (!sisteSvar) return;
      var mitt = tolkaTal(svarInput.value);
      if (isNaN(mitt)) {
        dom.className = 'vt-dom fel';
        dom.textContent = 'Skriv in ditt svar som ett tal, i ' + sisteSvar.enhet + '.';
        return;
      }
      var vantat = sisteSvar.varde;
      var tolerans = Math.max(Math.abs(vantat) * 0.01, 1e-6);
      if (Math.abs(mitt - vantat) <= tolerans) {
        dom.className = 'vt-dom ratt';
        dom.textContent = 'Rätt. ' + sisteSvar.uttryck;
      } else {
        var faktorFel = mitt !== 0 ? vantat / mitt : 0;
        var ledtrad = '';
        if (Math.abs(faktorFel - 10) < 0.05 || Math.abs(faktorFel - 0.1) < 0.0005) {
          ledtrad = ' Svaret ligger en tiopotens fel – kontrollera enheterna och decimaltecknet.';
        } else if (Math.abs(faktorFel - 1000) < 5 || Math.abs(faktorFel - 0.001) < 5e-6) {
          ledtrad = ' Svaret ligger en faktor 1000 fel – det är steget mellan g, mg och µg.';
        }
        dom.className = 'vt-dom fel';
        dom.textContent = 'Inte riktigt. Rätt svar är ' + visaTal(vantat) + ' ' + sisteSvar.enhet +
          '. ' + sisteSvar.uttryck + ledtrad;
      }
    });

    svarInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); svarKnapp.click(); }
    });

    nollknapp.addEventListener('click', function () {
      falt.forEach(function (f) { f.input.value = ''; });
      delblock.forEach(function (post) {
        post.falt.forEach(function (f) { f.input.value = ''; });
        raknaDel(post);
      });
      rakna();
      if (falt[0]) falt[0].input.focus();
    });

    byggFalten();
    rakna();
    delblock.forEach(raknaDel);
    return kort;
  }

  /* ---------------------------------------------------------
     Räknare 1 — enhetsomvandlaren
     --------------------------------------------------------- */

  function skapaOmvandlare() {
    var kort = document.createElement('section');
    kort.className = 'vt-tool';
    kort.id = 'vt-omvandlare';

    var huvud = document.createElement('div');
    huvud.className = 'vt-tool-head';
    var h3 = document.createElement('h3');
    h3.textContent = 'Enhetsomvandlare';
    huvud.appendChild(h3);
    kort.appendChild(huvud);

    var intro = document.createElement('p');
    intro.className = 'vt-tool-intro';
    intro.textContent = 'Skriv ett tal och välj enhet, så visas alla övriga enheter samtidigt. Ingen från- och till-väljare behövs.';
    kort.appendChild(intro);

    var TYPER = [
      { id: 'massa', text: 'Massa', grupp: 'massa', standard: 'mg' },
      { id: 'volym', text: 'Volym', grupp: 'volym', standard: 'ml' },
      { id: 'tid', text: 'Tid', grupp: 'tid', standard: 'h' },
      { id: 'konc', text: 'Koncentration', konc: true }
    ];
    var aktiv = TYPER[0];

    var flikrad = document.createElement('div');
    flikrad.className = 'vt-flikar';
    flikrad.setAttribute('role', 'group');
    flikrad.setAttribute('aria-label', 'Typ av enhet');
    TYPER.forEach(function (t, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = t.text;
      b.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');
      b.addEventListener('click', function () {
        aktiv = t;
        Array.prototype.forEach.call(flikrad.children, function (x) {
          x.setAttribute('aria-pressed', String(x === b));
        });
        bygg();
      });
      flikrad.appendChild(b);
    });
    kort.appendChild(flikrad);

    var rutnat = document.createElement('div');
    rutnat.className = 'vt-grid';
    kort.appendChild(rutnat);

    var utrad = document.createElement('div');
    utrad.className = 'vt-omv-ut';
    utrad.setAttribute('aria-live', 'polite');
    kort.appendChild(utrad);

    var falt = null;

    /* Koncentration: procent betyder gram per 100 ml. */
    var KONC = [
      ['%', 10],          // 1 % = 10 mg/ml
      ['mg/ml', 1],
      ['g/l', 1],         // 1 g/l = 1 mg/ml
      ['µg/ml', 0.001]
    ];

    function bygg() {
      rutnat.innerHTML = '';
      var spec = aktiv.konc
        ? { namn: 'v', etikett: 'Värde', plats: 't.ex. 0,9' }
        : { namn: 'v', etikett: 'Värde', grupp: aktiv.grupp, standard: aktiv.standard, plats: 't.ex. 500' };
      falt = byggFalt(spec, 'vt-omv');

      if (aktiv.konc) {
        var sel = document.createElement('select');
        sel.setAttribute('aria-label', 'Enhet');
        KONC.forEach(function (k) {
          var o = document.createElement('option');
          o.value = k[0]; o.textContent = k[0];
          sel.appendChild(o);
        });
        falt.el.querySelector('.vt-inputrow').appendChild(sel);
        falt.valjare = sel;
        sel.addEventListener('change', rakna);
      }

      rutnat.appendChild(falt.el);
      falt.input.addEventListener('input', rakna);
      if (falt.valjare && !aktiv.konc) falt.valjare.addEventListener('change', rakna);
      rakna();
    }

    function rakna() {
      utrad.innerHTML = '';
      var n = tolkaTal(falt.input.value);
      if (isNaN(n)) {
        var tom = document.createElement('div');
        tom.className = 'vt-omv-post';
        tom.innerHTML = '<span class="vt-omv-varde">—</span><span class="vt-omv-enhet">skriv ett tal</span>';
        utrad.appendChild(tom);
        return;
      }

      var lista, vald, bas;
      if (aktiv.konc) {
        vald = falt.valjare.value;
        var vf = 1;
        KONC.forEach(function (k) { if (k[0] === vald) vf = k[1]; });
        bas = n * vf; // bas = mg/ml
        lista = KONC.map(function (k) { return [k[0], bas / k[1]]; });
      } else {
        vald = falt.valjare.value;
        bas = n * faktor(aktiv.grupp, vald);
        lista = GRUPPER[aktiv.grupp].enheter.map(function (e) { return [e[0], bas / e[1]]; });
      }

      lista.forEach(function (rad) {
        var post = document.createElement('div');
        post.className = 'vt-omv-post' + (rad[0] === vald ? ' is-kalla' : '');
        var v = document.createElement('span');
        v.className = 'vt-omv-varde';
        v.textContent = visaTal(rad[1]);
        var e = document.createElement('span');
        e.className = 'vt-omv-enhet';
        e.textContent = rad[0] + (rad[0] === vald ? ' (ditt värde)' : '');
        post.appendChild(v); post.appendChild(e);
        utrad.appendChild(post);
      });
    }

    bygg();
    return kort;
  }

  /* ---------------------------------------------------------
     Räknare 2 — dos och styrka
     --------------------------------------------------------- */

  function flytandeRakna(v, tomt) {
    // ordination (mg) = styrka (mg/ml) × dos (ml)
    if (tomt === 'dos') {
      var ml = v.ordination / v.styrka;
      /* Volymens rimlighet prövas av rimlighetskontrollen (typ dosvolym). */
      return {
        varde: ml,
        uttryck: visaTal(v.ordination) + ' mg ÷ ' + visaTal(v.styrka) + ' mg/ml = ' + visaTal(ml) + ' ml'
      };
    }
    if (tomt === 'styrka') {
      var s = v.ordination / v.dos;
      return { varde: s, uttryck: visaTal(v.ordination) + ' mg ÷ ' + visaTal(v.dos) + ' ml = ' + visaTal(s) + ' mg/ml' };
    }
    var mg = v.styrka * v.dos;
    return { varde: mg, uttryck: visaTal(v.styrka) + ' mg/ml × ' + visaTal(v.dos) + ' ml = ' + visaTal(mg) + ' mg' };
  }

  function tablettRakna(v, tomt) {
    if (tomt === 'dos') {
      var antal = v.ordination / v.styrka;
      return {
        varde: antal,
        uttryck: visaTal(v.ordination) + ' mg ÷ ' + visaTal(v.styrka) + ' mg per tablett = ' + visaTal(antal) + ' tabletter',
        extra: (Math.abs(antal * 2 - Math.round(antal * 2)) > 1e-9)
          ? 'Svaret är varken ett helt eller ett halvt antal tabletter – kontrollera ordinationen mot tillgängliga styrkor.'
          : ''
      };
    }
    if (tomt === 'styrka') {
      var st = v.ordination / v.dos;
      return { varde: st, uttryck: visaTal(v.ordination) + ' mg ÷ ' + visaTal(v.dos) + ' tabletter = ' + visaTal(st) + ' mg per tablett' };
    }
    var tot = v.styrka * v.dos;
    return { varde: tot, uttryck: visaTal(v.styrka) + ' mg per tablett × ' + visaTal(v.dos) + ' tabletter = ' + visaTal(tot) + ' mg' };
  }

  function stammerProdukt(v, enhetA, enhetB) {
    var vanster = v.ordination;
    var hoger = v.styrka * v.dos;
    return {
      ok: Math.abs(vanster - hoger) <= Math.max(Math.abs(vanster) * 0.005, 1e-9),
      uttryck: visaTal(v.styrka) + ' ' + enhetA + ' × ' + visaTal(v.dos) + ' ' + enhetB +
        ' = ' + visaTal(hoger) + ' mg, ordinationen är ' + visaTal(vanster) + ' mg'
    };
  }

  function skapaDos() {
    return skapa({
      id: 'vt-dos',
      rubrik: 'Dos och styrka',
      intro: 'Sambandet ordination = styrka × dos, läst åt det håll du behöver. Lämna det du vill veta tomt.',
      flikar: {
        etikett: 'Beredningsform',
        val: [
          {
            id: 'flytande', text: 'Flytande',
            falt: [
              { namn: 'ordination', etikett: 'Ordination', grupp: 'massa', standard: 'mg', plats: 't.ex. 500', rim: 'massa' },
              { namn: 'styrka', etikett: 'Styrka', enhet: 'mg/ml', plats: 't.ex. 20', rim: 'styrka' },
              { namn: 'dos', etikett: 'Dosvolym', enhet: 'ml', plats: 'lämna tom', rim: 'dosvolym' }
            ],
            rakna: flytandeRakna,
            stammer: function (v) { return stammerProdukt(v, 'mg/ml', 'ml'); }
          },
          {
            id: 'tablett', text: 'Tablett',
            falt: [
              { namn: 'ordination', etikett: 'Ordination', grupp: 'massa', standard: 'mg', plats: 't.ex. 1000', rim: 'massa' },
              { namn: 'styrka', etikett: 'Styrka per tablett', enhet: 'mg', plats: 't.ex. 500', rim: 'massa' },
              { namn: 'dos', etikett: 'Antal tabletter', enhet: 'st', plats: 'lämna tom', rim: 'tabletter' }
            ],
            rakna: tablettRakna,
            stammer: function (v) { return stammerProdukt(v, 'mg/tablett', 'tabletter'); }
          }
        ]
      },
      delblock: [{
        id: 'vikt',
        rubrik: 'Ordination efter kroppsvikt',
        intro: 'Räknar fram den ordinerade mängden ur vikt och dos per kilo. Använd resultatet som ordination ovan.',
        svarsetikett: 'Ordinerad mängd',
        rim: 'massa',
        falt: [
          { namn: 'vikt', etikett: 'Vikt', enhet: 'kg', plats: 't.ex. 20', rim: 'vikt' },
          { namn: 'perkg', etikett: 'Dos per kilo', enhet: 'mg/kg', plats: 't.ex. 15', rim: 'perkg' }
        ],
        rakna: function (v) {
          var mg = v.vikt * v.perkg;
          return {
            varde: mg,
            text: visaTal(mg) + ' mg',
            uttryck: visaTal(v.perkg) + ' mg/kg × ' + visaTal(v.vikt) + ' kg = ' + visaTal(mg) + ' mg'
          };
        }
      }]
    });
  }

  /* ---------------------------------------------------------
     Räknare 3 — infusion
     --------------------------------------------------------- */

  function skapaInfusion() {
    return skapa({
      id: 'vt-infusion',
      rubrik: 'Infusion',
      intro: 'Sambandet volym = hastighet × tid. Lämna det du vill veta tomt, så räknas det ut – och droppar per minut visas när volym och tid är kända.',
      falt: [
        { namn: 'volym', etikett: 'Volym', grupp: 'volym', standard: 'ml', plats: 't.ex. 1000', rim: 'infvolym' },
        { namn: 'tid', etikett: 'Tid', grupp: 'tid', standard: 'h', plats: 't.ex. 8', rim: 'infusionstid' },
        { namn: 'takt', etikett: 'Hastighet', enhet: 'ml/h', plats: 'lämna tom', rim: 'takt' }
      ],
      rakna: function (v, tomt) {
        if (tomt === 'takt') {
          var timmar = v.tid / 60;
          var takt = v.volym / timmar;
          return {
            varde: takt,
            uttryck: visaTal(v.volym) + ' ml ÷ ' + visaTal(timmar) + ' h = ' + visaTal(takt) + ' ml/h',
            extra: 'Med ett aggregat på 20 droppar/ml blir det ' + visaTal(v.volym * 20 / v.tid) + ' droppar/min.'
          };
        }
        if (tomt === 'tid') {
          var min = v.volym / v.takt * 60;
          return {
            varde: min,
            uttryck: visaTal(v.volym) + ' ml ÷ ' + visaTal(v.takt) + ' ml/h = ' + visaTal(min / 60) + ' h'
          };
        }
        var t2 = v.tid / 60;
        var vol = v.takt * t2;
        return {
          varde: vol,
          uttryck: visaTal(v.takt) + ' ml/h × ' + visaTal(t2) + ' h = ' + visaTal(vol) + ' ml'
        };
      },
      stammer: function (v) {
        var t = v.tid / 60;
        var hoger = v.takt * t;
        return {
          ok: Math.abs(v.volym - hoger) <= Math.max(v.volym * 0.005, 1e-9),
          uttryck: visaTal(v.takt) + ' ml/h × ' + visaTal(t) + ' h = ' + visaTal(hoger) + ' ml, volymen är ' + visaTal(v.volym) + ' ml'
        };
      },
      delblock: [
        {
          id: 'dropp',
          rubrik: 'Droppar per minut',
          intro: 'När takten ställs in för hand på ett droppaggregat. Läs av droppfaktorn på förpackningen – 20 droppar/ml är vanligast för klara lösningar, blodaggregat ligger kring 15.',
          svarsetikett: 'Dropptakt',
          rim: 'dropptakt',
          falt: [
            { namn: 'volym', etikett: 'Volym', grupp: 'volym', standard: 'ml', plats: 't.ex. 1000', rim: 'infvolym' },
            { namn: 'tid', etikett: 'Tid', grupp: 'tid', standard: 'h', plats: 't.ex. 8', rim: 'infusionstid' },
            { namn: 'df', etikett: 'Droppfaktor', enhet: 'droppar/ml', plats: 't.ex. 20', rim: 'droppfaktor' }
          ],
          rakna: function (v) {
            var dr = v.volym * v.df / v.tid;
            return {
              varde: dr,
              text: visaTal(dr) + ' droppar/min',
              uttryck: '(' + visaTal(v.volym) + ' ml × ' + visaTal(v.df) + ' droppar/ml) ÷ ' +
                visaTal(v.tid) + ' min = ' + visaTal(dr) + ' droppar/min'
            };
          }
        },
        {
          id: 'perkgh',
          rubrik: 'Från mg/kg/h till ml/h',
          intro: 'Räkningen som oftast vållar problem: ordinationen är angiven per kilo och timme, men pumpen vill ha milliliter per timme.',
          svarsetikett: 'Pumpens inställning',
          rim: 'takt',
          falt: [
            { namn: 'vikt', etikett: 'Vikt', enhet: 'kg', plats: 't.ex. 70', rim: 'vikt' },
            { namn: 'perkgh', etikett: 'Dos', enhet: 'mg/kg/h', plats: 't.ex. 5', rim: 'perkgh' },
            { namn: 'styrka', etikett: 'Lösningens styrka', enhet: 'mg/ml', plats: 't.ex. 25', rim: 'styrka' }
          ],
          rakna: function (v) {
            var mgh = v.vikt * v.perkgh;
            var mlh = mgh / v.styrka;
            return {
              varde: mlh,
              text: visaTal(mlh) + ' ml/h',
              uttryck: visaTal(v.perkgh) + ' mg/kg/h × ' + visaTal(v.vikt) + ' kg = ' + visaTal(mgh) +
                ' mg/h · ' + visaTal(mgh) + ' mg/h ÷ ' + visaTal(v.styrka) + ' mg/ml = ' + visaTal(mlh) + ' ml/h'
            };
          }
        }
      ]
    });
  }

  /* ---------------------------------------------------------
     Räknare 4 — spädning
     --------------------------------------------------------- */

  function skapaSpadning() {
    return skapa({
      id: 'vt-spadning',
      rubrik: 'Spädning',
      intro: 'Sambandet styrka₁ × volym₁ = styrka₂ × volym₂. Mängden substans är oförändrad, bara volymen ökar. Lämna det du vill veta tomt.',
      falt: [
        { namn: 's1', etikett: 'Koncentratets styrka', enhet: 'mg/ml', plats: 't.ex. 10', rim: 'styrka' },
        { namn: 'v1', etikett: 'Volym koncentrat', grupp: 'volym', standard: 'ml', plats: 'lämna tom', rim: 'dosvolym' },
        { namn: 's2', etikett: 'Önskad styrka', enhet: 'mg/ml', plats: 't.ex. 1', rim: 'styrka' },
        { namn: 'v2', etikett: 'Önskad slutvolym', grupp: 'volym', standard: 'ml', plats: 't.ex. 100', rim: 'infvolym' }
      ],
      rakna: function (v, tomt) {
        var r;
        if (tomt === 'v1') {
          r = v.s2 * v.v2 / v.s1;
          return {
            varde: r,
            uttryck: '(' + visaTal(v.s2) + ' mg/ml × ' + visaTal(v.v2) + ' ml) ÷ ' + visaTal(v.s1) +
              ' mg/ml = ' + visaTal(r) + ' ml koncentrat',
            extra: 'Fyll på till ' + visaTal(v.v2) + ' ml, alltså med ' + visaTal(v.v2 - r) + ' ml spädningsvätska.',
            varning: r > v.v2
              ? 'Koncentratet är svagare än den styrka du vill ha – den går inte att nå genom att späda.'
              : null
          };
        }
        if (tomt === 'v2') {
          r = v.s1 * v.v1 / v.s2;
          return {
            varde: r,
            uttryck: '(' + visaTal(v.s1) + ' mg/ml × ' + visaTal(v.v1) + ' ml) ÷ ' + visaTal(v.s2) +
              ' mg/ml = ' + visaTal(r) + ' ml slutvolym',
            extra: 'Det innebär ' + visaTal(r - v.v1) + ' ml spädningsvätska.'
          };
        }
        if (tomt === 's2') {
          r = v.s1 * v.v1 / v.v2;
          return {
            varde: r,
            uttryck: '(' + visaTal(v.s1) + ' mg/ml × ' + visaTal(v.v1) + ' ml) ÷ ' + visaTal(v.v2) +
              ' ml = ' + visaTal(r) + ' mg/ml'
          };
        }
        r = v.s2 * v.v2 / v.v1;
        return {
          varde: r,
          uttryck: '(' + visaTal(v.s2) + ' mg/ml × ' + visaTal(v.v2) + ' ml) ÷ ' + visaTal(v.v1) +
            ' ml = ' + visaTal(r) + ' mg/ml'
        };
      },
      stammer: function (v) {
        var a = v.s1 * v.v1, b = v.s2 * v.v2;
        return {
          ok: Math.abs(a - b) <= Math.max(Math.abs(a) * 0.005, 1e-9),
          uttryck: visaTal(v.s1) + ' × ' + visaTal(v.v1) + ' = ' + visaTal(a) + ' mg mot ' +
            visaTal(v.s2) + ' × ' + visaTal(v.v2) + ' = ' + visaTal(b) + ' mg'
        };
      }
    });
  }

  /* ---------------------------------------------------------
     Start
     --------------------------------------------------------- */

  function start() {
    var vard = document.getElementById('verktyg');
    if (!vard) return;
    vard.appendChild(skapaOmvandlare());
    vard.appendChild(skapaDos());
    vard.appendChild(skapaInfusion());
    vard.appendChild(skapaSpadning());
    var noscript = document.getElementById('vt-utan-js');
    if (noscript) noscript.hidden = true;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
