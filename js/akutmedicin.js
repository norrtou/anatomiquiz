/* =========================================================
   akutmedicin.js — kliniska poängskalor och kalkylatorer
   =========================================================
   Modulen monterar en skala i varje monteringspunkt på sidan:

     <div data-akut="news2"></div>

   Facit ligger i data/akutmedicin.json. En ny skala ska vara en
   post där, inte ny kod — därav den datadrivna renderaren.

   VARFÖR BARA MONTERINGSPUNKTER: scripts/wire_terms.py läser
   HTML på disk och kan aldrig se en etikett som JavaScript
   skapar. All termbärande brödtext står därför i sidans statiska
   HTML, och modulen skriver bara ut räknaren
   (scripts/akutmedicin_verktyg_todo.md §3b).

   Fyra mönster täcker de nitton instrument som ska byggas:
   värdeskala (B), kryssruteskala (A), formelräknare (C) och
   beslutsgång (D). Här finns värdeskalan, som NEWS2 använder;
   de tre övriga hängs på RENDERARE när sina instrument byggs.

   Två lägen per skala, samma som i js/verktyg-lakemedel.js:
   - Räkna (standard) — poängen visas direkt.
   - Träna            — poängen och bandet döljs tills du fyllt i
                        din egen summa. Skillnaden mellan lägena
                        ÄR att det inte finns någon siffra att läsa
                        av i träningsläget.

   Ingen inmatning sparas. Inga externa beroenden; CSP script-src 'self'.
   ========================================================= */
(function () {
  'use strict';

  var FACIT = '/data/akutmedicin.json';

  /* ---------------------------------------------------------
     Tal in och ut
     ---------------------------------------------------------
     Egna kopior, inte delade med js/verktyg-lakemedel.js: den
     filen är en IIFE och exporterar ingenting. Det är fjorton
     rader hjälpkod, inte innehåll — det som får glida isär enligt
     §0 är texter och facit, och båda ligger i JSON-filen.
     --------------------------------------------------------- */

  /** Tolkar ett inmatat tal. Godtar både komma och punkt. */
  function tolkaTal(text) {
    if (typeof text !== 'string') return NaN;
    var t = text.trim().replace(/\s/g, '').replace(',', '.');
    if (t === '') return NaN;
    if (!/^-?\d*\.?\d+$/.test(t)) return NaN;
    return parseFloat(t);
  }

  /** Formaterar ett tal med svenskt decimalkomma. */
  function visaTal(n) {
    if (!isFinite(n)) return '—';
    var s = Math.round(n * 1000) / 1000;
    return String(s).replace('.', ',');
  }

  /** "poäng" böjs inte i singular på svenska, men "1 poäng" ska ändå
      läsas som en poäng — ordet är detsamma, bara räkneordet byts. */
  function poangText(n) {
    return n + ' poäng';
  }

  /* ---------------------------------------------------------
     Poängsättningen
     --------------------------------------------------------- */

  /**
   * Reglerna prövas i tur och ordning och FÖRSTA träffen vinner.
   * Därför skrivs banden med enbart ett tak (`max`) och en sista
   * regel utan tak: intervallen blir gapfria av konstruktion, och
   * ett värde kan aldrig hamna mellan två band. NEWS2:s
   * temperaturskala är just en sådan fälla — 35,05 °C ligger mellan
   * "≤35,0" och "35,1–36,0" om banden skrivs som par av gränser.
   *
   * `nar` gör en regel villkorad av ett annat fälts värde. Det
   * behövs för mättnadsskala 2, där 93–100 % ger 0 poäng på luft
   * men 1–3 poäng med syrgas.
   */
  function poangFor(param, varden) {
    var regler = param.band;
    if (param.bandvaljare) regler = regler[varden[param.bandvaljare]];
    if (!regler) return null;

    var v = varden[param.namn];
    if (typeof v !== 'number' || !isFinite(v)) return null;

    for (var i = 0; i < regler.length; i++) {
      var r = regler[i];
      if (r.nar) {
        var passar = true;
        for (var nyckel in r.nar) {
          if (varden[nyckel] !== r.nar[nyckel]) passar = false;
        }
        if (!passar) continue;
      }
      if (r.max == null || v <= r.max) {
        return { poang: r.poang, intervall: r.intervall };
      }
    }
    return null;
  }

  /** Poängen för ett valfält — valet bär sin poäng självt. */
  function poangForVal(param, varde) {
    for (var i = 0; i < param.val.length; i++) {
      if (param.val[i].varde === varde) {
        return { poang: param.val[i].poang, intervall: param.val[i].text };
      }
    }
    return null;
  }

  /** Bandet som summan hamnar i. Sista bandet saknar tak. */
  function bandFor(skala, summa) {
    for (var i = 0; i < skala.band.length; i++) {
      var b = skala.band[i];
      if (b.max == null || summa <= b.max) return b;
    }
    return skala.band[skala.band.length - 1];
  }

  /**
   * Hela bedömningen för en uppsättning värden.
   * @returns {Object} {klar, saknas, summa, delar, band, kritiska}
   *   delar    – [{param, poang, intervall}] i parameterordning
   *   kritiska – parametrar som ensamma når `kritisk.granspoang`
   */
  function bedom(skala, varden) {
    var delar = [];
    var saknas = [];
    var summa = 0;
    var kritiska = [];

    skala.parametrar.forEach(function (p) {
      if (p.roll === 'instalning') return;   // väljer tabell, ger ingen poäng
      var träff = p.typ === 'val'
        ? poangForVal(p, varden[p.namn])
        : poangFor(p, varden);
      if (!träff) { saknas.push(p); return; }
      summa += träff.poang;
      delar.push({ param: p, poang: träff.poang, intervall: träff.intervall });
      if (skala.kritisk && träff.poang >= skala.kritisk.granspoang) kritiska.push(p);
    });

    if (saknas.length) {
      return { klar: false, saknas: saknas, delar: delar };
    }

    var band = bandFor(skala, summa);
    /* En enskild trea väger tyngre än summan antyder: RCP:s
       svarstabell lyfter en låg total till samma svarsnivå som en
       medelhög. Lyftet gäller bara uppåt — ett band som redan är
       medel eller högt rörs inte. */
    if (kritiska.length && (band.niva === 'ingen' || band.niva === 'lag')) {
      band = skala.kritisk;
    }
    return { klar: true, saknas: [], summa: summa, delar: delar,
             band: band, kritiska: kritiska };
  }

  /* ---------------------------------------------------------
     Fälten
     --------------------------------------------------------- */

  /**
   * @param {boolean} [utanPoang] Formelräknaren (mönster C) har ingen
   *   poäng per fält — bara ett svar längre ner — så den chipen byggs
   *   inte alls i stället för att byggas och tas bort igen.
   */
  function byggTalfalt(spec, idPrefix, utanPoang) {
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

    if (spec.enhet) {
      var enhet = document.createElement('span');
      enhet.className = 'vt-unit-fixed';
      enhet.textContent = spec.enhet;
      rad.appendChild(enhet);
    }
    wrap.appendChild(rad);

    var poang = null;
    if (!utanPoang) {
      poang = document.createElement('span');
      poang.className = 'vt-poang is-tom';
      poang.textContent = '—';
      wrap.appendChild(poang);
    }

    return { el: wrap, input: input, valjare: null, poang: poang, spec: spec };
  }

  /**
   * @param {boolean} [utanPoang] Beslutsgången (mönster D) summerar
   *   ingenting, så dess steg har ingen poäng att visa. Chipen byggs
   *   då inte alls — samma skäl som i byggTalfalt ovan.
   */
  function byggValfalt(spec, idPrefix, utanPoang) {
    var wrap = document.createElement('label');
    wrap.className = 'vt-field vt-field--val';
    wrap.dataset.falt = spec.namn;

    var rubrik = document.createElement('span');
    rubrik.textContent = spec.etikett;
    wrap.appendChild(rubrik);

    var rad = document.createElement('div');
    rad.className = 'vt-inputrow';
    var valjare = document.createElement('select');
    valjare.id = idPrefix + '-' + spec.namn;
    spec.val.forEach(function (v, i) {
      var o = document.createElement('option');
      o.value = v.varde;
      o.textContent = v.text;
      if (i === 0) o.selected = true;
      valjare.appendChild(o);
    });
    rad.appendChild(valjare);
    wrap.appendChild(rad);

    var poang = null;
    if (!utanPoang) {
      poang = document.createElement('span');
      poang.className = 'vt-poang is-tom';
      poang.textContent = '—';
      wrap.appendChild(poang);
    }

    return { el: wrap, input: null, valjare: valjare, poang: poang, spec: spec };
  }

  /* ---------------------------------------------------------
     Renderaren: värdeskala (mönster B)
     ---------------------------------------------------------
     Ett numeriskt värde faller i ett intervall, intervallet är
     värt ett antal poäng, och summan läses mot en svarstabell.
     NEWS2, GCS, RLS 85, qSOFA, SOFA och CRB-65 följer alla det
     mönstret.
     --------------------------------------------------------- */

  function skapaVardeskala(skala, id) {
    var kort = document.createElement('section');
    kort.className = 'vt-tool';
    kort.id = id;

    /* Huvud med rubrik och lägesväljare */
    var huvud = document.createElement('div');
    huvud.className = 'vt-tool-head';
    var h3 = document.createElement('h3');
    h3.textContent = skala.rubrik;
    h3.id = id + '-rubrik';
    huvud.appendChild(h3);

    var lage = document.createElement('div');
    lage.className = 'vt-mode';
    lage.setAttribute('role', 'group');
    lage.setAttribute('aria-label', 'Läge för ' + skala.namn);
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
    intro.textContent = skala.intro;
    kort.appendChild(intro);

    /* Fälten */
    var rutnat = document.createElement('div');
    rutnat.className = 'vt-grid';
    kort.appendChild(rutnat);

    var falt = skala.parametrar.map(function (p) {
      var f = p.typ === 'val' ? byggValfalt(p, id) : byggTalfalt(p, id);
      rutnat.appendChild(f.el);
      return f;
    });

    /* Hjälptexter — de parametrar som behöver en förklaring vid
       fältet, inte bara i brödtexten längre ner. Ingen fetstil här:
       finstilt ska kunna läsas av den som söker den och annars vara
       tyst (CLAUDE_REGLER §0.5 punkt 4). Texten namnger därför sin
       egen parameter i stället för att bära en fet etikett. */
    var hjalp = document.createElement('div');
    hjalp.className = 'vt-hjalp';
    skala.parametrar.forEach(function (p) {
      if (!p.hjalp) return;
      var rad = document.createElement('p');
      rad.textContent = p.hjalp;
      hjalp.appendChild(rad);
    });
    if (hjalp.children.length) kort.appendChild(hjalp);

    /* Utfallet */
    var ut = document.createElement('div');
    ut.className = 'vt-out is-tom';
    ut.setAttribute('aria-live', 'polite');
    var utEtikett = document.createElement('span');
    utEtikett.className = 'vt-out-label';
    utEtikett.textContent = skala.summaetikett;
    var utVarde = document.createElement('div');
    utVarde.className = 'vt-out-value';
    var utCalc = document.createElement('div');
    utCalc.className = 'vt-calc';
    ut.appendChild(utEtikett);
    ut.appendChild(utVarde);
    ut.appendChild(utCalc);
    kort.appendChild(ut);

    /* Svarsbandet — svarstabellens rad för den här summan. */
    var band = document.createElement('div');
    band.className = 'vt-band';
    band.hidden = true;
    var bandTitel = document.createElement('strong');
    bandTitel.className = 'vt-band-titel';
    var bandOver = document.createElement('p');
    bandOver.className = 'vt-band-rad';
    var bandAtgard = document.createElement('p');
    bandAtgard.className = 'vt-band-rad';
    band.appendChild(bandTitel);
    band.appendChild(bandOver);
    band.appendChild(bandAtgard);
    kort.appendChild(band);

    /* Röd poäng — en enskild parameter som ensam når gränsen. */
    var krit = document.createElement('p');
    krit.className = 'vt-krit';
    krit.hidden = true;
    kort.appendChild(krit);

    /* Rimlighetsvarning */
    var varn = document.createElement('div');
    varn.className = 'vt-warn';
    varn.hidden = true;
    var varnTitel = document.createElement('strong');
    varnTitel.className = 'vt-warn-titel';
    varnTitel.textContent = 'Kontrollera värdet';
    var varnText = document.createElement('div');
    varnText.className = 'vt-warn-text';
    varn.appendChild(varnTitel);
    varn.appendChild(varnText);
    kort.appendChild(varn);

    /* Svarsruta (träningsläget) */
    var svarsruta = document.createElement('div');
    svarsruta.className = 'vt-svarsruta';
    svarsruta.hidden = true;
    var svarEtikett = document.createElement('span');
    svarEtikett.className = 'vt-out-label';
    svarEtikett.textContent = 'Din ' + skala.namn + '-poäng';
    var svarRad = document.createElement('div');
    svarRad.className = 'vt-svarsrad';
    var svarWrap = document.createElement('div');
    svarWrap.className = 'vt-inputrow';
    var svarInput = document.createElement('input');
    svarInput.type = 'text';
    svarInput.inputMode = 'numeric';
    svarInput.autocomplete = 'off';
    svarInput.id = id + '-ditt-svar';
    svarInput.setAttribute('aria-label', 'Din ' + skala.namn + '-poäng');
    var svarEnhet = document.createElement('span');
    svarEnhet.className = 'vt-unit-fixed';
    svarEnhet.textContent = skala.enhetssuffix;
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

    /* Nollställ */
    var nollrad = document.createElement('div');
    nollrad.className = 'vt-nollstall';
    var nollknapp = document.createElement('button');
    nollknapp.type = 'button';
    nollknapp.textContent = 'Nollställ';
    nollrad.appendChild(nollknapp);
    kort.appendChild(nollrad);

    /* ---- tillstånd ---- */
    var traningslage = false;
    var senaste = null;

    function lasVarden() {
      var v = {};
      falt.forEach(function (f) {
        if (f.spec.typ === 'val') { v[f.spec.namn] = f.valjare.value; return; }
        var n = tolkaTal(f.input.value);
        if (!isNaN(n)) v[f.spec.namn] = n;
      });
      return v;
    }

    function orimliga(varden) {
      var rader = [];
      falt.forEach(function (f) {
        var r = f.spec.rimlig;
        if (!r) return;
        var n = varden[f.spec.namn];
        if (typeof n !== 'number') return;
        if (n < r.min || n > r.max) {
          rader.push('Kontrollera ' + f.spec.kort.toLowerCase() + ' – ' +
            visaTal(n) + ' ' + f.spec.enhet + ' ligger utanför det som mäts ' +
            'på en levande patient (' + visaTal(r.min) + '–' + visaTal(r.max) +
            ' ' + f.spec.enhet + '). Poängen räknas ändå ut.');
        }
      });
      return rader;
    }

    function visaPoangchip(f, del) {
      if (traningslage) {
        f.poang.className = 'vt-poang is-dold';
        f.poang.textContent = 'räkna själv';
        return;
      }
      if (!del) {
        f.poang.className = 'vt-poang is-tom';
        f.poang.textContent = '—';
        return;
      }
      f.poang.className = 'vt-poang' + (del.poang >= 3 ? ' is-rod' : '');
      f.poang.textContent = del.poang + ' p · ' + del.intervall;
    }

    function rakna() {
      var varden = lasVarden();
      var res = bedom(skala, varden);
      senaste = res;

      /* Poängen per parameter, oavsett om alla är ifyllda: den som
         fyller i ett värde ska se dess poäng direkt. */
      var perFalt = {};
      res.delar.forEach(function (d) { perFalt[d.param.namn] = d; });
      falt.forEach(function (f) {
        if (f.spec.roll === 'instalning') {
          f.poang.className = 'vt-poang is-tom';
          f.poang.textContent = 'ger ingen poäng';
          return;
        }
        visaPoangchip(f, perFalt[f.spec.namn]);
      });

      var varningar = orimliga(varden);
      varnText.innerHTML = '';
      varn.hidden = !varningar.length;
      varningar.forEach(function (t) {
        var p = document.createElement('p');
        p.textContent = t;
        varnText.appendChild(p);
      });

      lagesvy();
    }

    /** Skriver ut resultatet i räkneläget, eller döljer det i träningsläget. */
    function lagesvy() {
      var res = senaste;
      var klart = res && res.klar;

      if (traningslage) {
        ut.hidden = true;
        band.hidden = true;
        krit.hidden = true;
        svarsruta.hidden = false;
        svarKnapp.disabled = !klart;
        svarInput.disabled = !klart;
        if (!klart) {
          dom.className = '';
          dom.textContent = '';
          svarEtikett.textContent = saknasText(res);
        } else {
          svarEtikett.textContent = 'Din ' + skala.namn + '-poäng';
        }
        return;
      }

      svarsruta.hidden = true;
      ut.hidden = false;

      if (!klart) {
        ut.classList.add('is-tom');
        utEtikett.textContent = skala.summaetikett;
        utVarde.textContent = saknasText(res);
        utCalc.textContent = '';
        band.hidden = true;
        krit.hidden = true;
        return;
      }

      ut.classList.remove('is-tom');
      utEtikett.textContent = skala.summaetikett;
      utVarde.textContent = poangText(res.summa);
      utCalc.textContent = res.delar.map(function (d) { return d.poang; })
        .join(' + ') + ' = ' + res.summa;

      band.hidden = false;
      band.className = 'vt-band is-' + res.band.niva;
      bandTitel.textContent = res.band.rubrik;
      bandOver.textContent = 'Övervakning: ' + res.band.overvakning;
      bandAtgard.textContent = res.band.atgard;

      if (res.kritiska.length && skala.kritisk) {
        krit.hidden = false;
        krit.textContent = skala.kritisk.notis.replace('{p}',
          res.kritiska.map(function (p) { return p.kort.toLowerCase(); }).join(', '));
      } else {
        krit.hidden = true;
      }
    }

    function saknasText(res) {
      var n = res ? res.saknas.length : skala.parametrar.length;
      return n === 1
        ? 'Fyll i ' + res.saknas[0].kort.toLowerCase() + ' också.'
        : 'Fyll i ' + n + ' parametrar till.';
    }

    function sattLage(trana) {
      traningslage = trana;
      kort.classList.toggle('is-trana', trana);
      knappRakna.setAttribute('aria-pressed', String(!trana));
      knappTrana.setAttribute('aria-pressed', String(trana));
      dom.className = '';
      dom.textContent = '';
      svarInput.value = '';
      rakna();
    }

    falt.forEach(function (f) {
      if (f.input) f.input.addEventListener('input', rakna);
      if (f.valjare) f.valjare.addEventListener('change', rakna);
    });

    knappRakna.addEventListener('click', function () { sattLage(false); });
    knappTrana.addEventListener('click', function () { sattLage(true); });

    svarKnapp.addEventListener('click', function () {
      if (!senaste || !senaste.klar) return;
      var mitt = tolkaTal(svarInput.value);
      if (isNaN(mitt) || mitt !== Math.round(mitt)) {
        dom.className = 'vt-dom fel';
        dom.textContent = 'Skriv in din summa som ett heltal.';
        return;
      }
      var facit = senaste.summa;
      var uträkning = senaste.delar.map(function (d) {
        return d.param.kort.toLowerCase() + ' ' + d.poang;
      }).join(' + ') + ' = ' + facit;

      if (mitt === facit) {
        dom.className = 'vt-dom ratt';
        dom.textContent = 'Rätt. ' + uträkning + '. ' + senaste.band.rubrik +
          ' – ' + senaste.band.atgard;
      } else {
        dom.className = 'vt-dom fel';
        dom.textContent = 'Inte riktigt. Rätt summa är ' + poangText(facit) +
          ': ' + uträkning + '. ' + senaste.band.rubrik + ' – ' +
          senaste.band.atgard;
      }
    });

    svarInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); svarKnapp.click(); }
    });

    nollknapp.addEventListener('click', function () {
      falt.forEach(function (f) {
        if (f.input) f.input.value = '';
        if (f.valjare) f.valjare.value = f.spec.val[0].varde;
      });
      dom.className = '';
      dom.textContent = '';
      svarInput.value = '';
      rakna();
      if (falt[0] && falt[0].input) falt[0].input.focus();
    });

    rakna();
    return kort;
  }

  /* ---------------------------------------------------------
     Renderaren: formelräknare (mönster C)
     ---------------------------------------------------------
     Ett eller flera tal matas in, en eller flera formler räknas ut.
     Till skillnad från värdeskalan (B) är matematiken inte
     generisk — varje instrument har sin egen formel. Formeln är
     ändå ren räkning (§0.3 punkt 1: mekaniskt och entydigt ska
     automatiseras), så koden ligger i FORMLER nedan medan alla
     etiketter, enheter och tolkningstexter är data i facit. Ny
     formel = ny nyckel i FORMLER, inte en ny renderare.
     --------------------------------------------------------- */

  /**
   * Rena räknefunktioner. Varje formel tar värdena (`v`, nycklar
   * = fältens `namn`) och returnerar {varde, uttryck} — det
   * uträknade talet och den insatta formeln som text, så att
   * uträkningen syns, inte bara svaret (samma princip som NEWS2:s
   * `vt-calc`).
   *
   * Natriumkorrektionen räknar om 100 mg/dL (den amerikanska
   * litteraturens referenspunkt) till exakt 5,55 mmol/L i stället
   * för det ofta avrundade 5,5 — annars glider korrektionen med
   * cirka en procent vid höga glukosvärden.
   */
  var FORMLER = {
    natrium_katz: function (v) {
      var varde = v.na + 1.6 * (v.glukos - 5.55) / 5.55;
      return { varde: varde, uttryck: visaTal(v.na) + ' + 1,6 × (' +
        visaTal(v.glukos) + ' − 5,55) / 5,55' };
    },
    natrium_hillier: function (v) {
      var varde = v.na + 2.4 * (v.glukos - 5.55) / 5.55;
      return { varde: varde, uttryck: visaTal(v.na) + ' + 2,4 × (' +
        visaTal(v.glukos) + ' − 5,55) / 5,55' };
    },
    osmolalitet_effektiv: function (v) {
      var varde = 2 * (v.na + v.k) + v.glukos;
      return { varde: varde, uttryck: '2 × (' + visaTal(v.na) + ' + ' +
        visaTal(v.k) + ') + ' + visaTal(v.glukos) };
    }
  };

  /** Tolkningsbandet för ett uträknat värde, samma bandprincip som
      poängskalans bandFor — första träffen med tak vinner. */
  function tolkningsbandFor(utdata, varde) {
    if (!utdata.band) return null;
    for (var i = 0; i < utdata.band.length; i++) {
      var b = utdata.band[i];
      if (b.max == null || varde <= b.max) return b;
    }
    return utdata.band[utdata.band.length - 1];
  }

  function skapaFormelraknare(skala, id) {
    var kort = document.createElement('section');
    kort.className = 'vt-tool';
    kort.id = id;

    var huvud = document.createElement('div');
    huvud.className = 'vt-tool-head';
    var h3 = document.createElement('h3');
    h3.textContent = skala.rubrik;
    h3.id = id + '-rubrik';
    huvud.appendChild(h3);

    var lage = document.createElement('div');
    lage.className = 'vt-mode';
    lage.setAttribute('role', 'group');
    lage.setAttribute('aria-label', 'Läge för ' + skala.namn);
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
    intro.textContent = skala.intro;
    kort.appendChild(intro);

    var rutnat = document.createElement('div');
    rutnat.className = 'vt-grid';
    kort.appendChild(rutnat);

    var falt = skala.falt.map(function (spec) {
      var f = byggTalfalt(spec, id, true);
      rutnat.appendChild(f.el);
      return f;
    });

    var hjalp = document.createElement('div');
    hjalp.className = 'vt-hjalp';
    skala.falt.forEach(function (p) {
      if (!p.hjalp) return;
      var rad = document.createElement('p');
      rad.textContent = p.hjalp;
      hjalp.appendChild(rad);
    });
    if (hjalp.children.length) kort.appendChild(hjalp);

    /* Rimlighetsvarningen — direkt under fälten, samma komponent som
       värdeskalan använder men här byggd separat eftersom
       formelräknaren saknar den annars. */
    var varnBox = document.createElement('div');
    varnBox.className = 'vt-warn';
    varnBox.hidden = true;
    var varnTitel = document.createElement('strong');
    varnTitel.className = 'vt-warn-titel';
    varnTitel.textContent = 'Kontrollera värdet';
    var varnText = document.createElement('div');
    varnText.className = 'vt-warn-text';
    varnBox.appendChild(varnTitel);
    varnBox.appendChild(varnText);
    kort.appendChild(varnBox);

    /* Ett .vt-out + en .vt-svarsruta per utdata — flera formler
       (Katz och Hillier) visas som flera rader under varandra. */
    var rader = skala.utdata.map(function (spec) {
      var ut = document.createElement('div');
      ut.className = 'vt-out is-tom';
      ut.setAttribute('aria-live', 'polite');
      var utEtikett = document.createElement('span');
      utEtikett.className = 'vt-out-label';
      utEtikett.textContent = spec.etikett;
      var utVarde = document.createElement('div');
      utVarde.className = 'vt-out-value';
      var utCalc = document.createElement('div');
      utCalc.className = 'vt-calc';
      var utNot = document.createElement('p');
      utNot.hidden = true;
      ut.appendChild(utEtikett);
      ut.appendChild(utVarde);
      ut.appendChild(utCalc);
      ut.appendChild(utNot);
      kort.appendChild(ut);

      var svarsruta = document.createElement('div');
      svarsruta.className = 'vt-svarsruta';
      svarsruta.hidden = true;
      var svarEtikett = document.createElement('span');
      svarEtikett.className = 'vt-out-label';
      svarEtikett.textContent = 'Ditt svar — ' + spec.etikett.toLowerCase();
      var svarRad = document.createElement('div');
      svarRad.className = 'vt-svarsrad';
      var svarWrap = document.createElement('div');
      svarWrap.className = 'vt-inputrow';
      var svarInput = document.createElement('input');
      svarInput.type = 'text';
      svarInput.inputMode = 'decimal';
      svarInput.autocomplete = 'off';
      svarInput.id = id + '-' + spec.namn + '-ditt-svar';
      svarInput.setAttribute('aria-label', 'Ditt svar — ' + spec.etikett.toLowerCase());
      var svarEnhet = document.createElement('span');
      svarEnhet.className = 'vt-unit-fixed';
      svarEnhet.textContent = spec.enhet;
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

      return { spec: spec, ut: ut, utEtikett: utEtikett, utVarde: utVarde,
               utCalc: utCalc, utNot: utNot, svarsruta: svarsruta,
               svarInput: svarInput, svarKnapp: svarKnapp, dom: dom };
    });

    var nollrad = document.createElement('div');
    nollrad.className = 'vt-nollstall';
    var nollknapp = document.createElement('button');
    nollknapp.type = 'button';
    nollknapp.textContent = 'Nollställ';
    nollrad.appendChild(nollknapp);
    kort.appendChild(nollrad);

    /* ---- tillstånd ---- */
    var traningslage = false;
    var senaste = null;   // { klar, saknas:[falt], resultat:[{spec,varde,uttryck,band}] }

    function lasVarden() {
      var v = {};
      falt.forEach(function (f) {
        var n = tolkaTal(f.input.value);
        if (!isNaN(n)) v[f.spec.namn] = n;
      });
      return v;
    }

    function orimliga(varden) {
      var texter = [];
      falt.forEach(function (f) {
        var r = f.spec.rimlig;
        if (!r) return;
        var n = varden[f.spec.namn];
        if (typeof n !== 'number') return;
        if (n < r.min || n > r.max) {
          texter.push('Kontrollera ' + f.spec.kort.toLowerCase() + ' – ' +
            visaTal(n) + ' ' + f.spec.enhet + ' ligger utanför det som mäts ' +
            'på en levande patient (' + visaTal(r.min) + '–' + visaTal(r.max) +
            ' ' + f.spec.enhet + '). Uträkningen görs ändå.');
        }
      });
      return texter;
    }

    function rakna() {
      var varden = lasVarden();
      var saknas = skala.falt.filter(function (p) { return typeof varden[p.namn] !== 'number'; });

      if (saknas.length) {
        senaste = { klar: false, saknas: saknas };
      } else {
        var resultat = skala.utdata.map(function (spec) {
          var r = FORMLER[spec.berakning](varden);
          return { spec: spec, varde: r.varde, uttryck: r.uttryck,
                   band: tolkningsbandFor(spec, r.varde) };
        });
        senaste = { klar: true, resultat: resultat };
      }

      var varningar = orimliga(varden);
      varnBox.hidden = !varningar.length;
      varnText.innerHTML = '';
      varningar.forEach(function (t) {
        var p = document.createElement('p');
        p.textContent = t;
        varnText.appendChild(p);
      });

      lagesvy();
    }

    function saknasText(saknas) {
      return saknas.length === 1
        ? 'Fyll i ' + saknas[0].kort.toLowerCase() + ' också.'
        : 'Fyll i ' + saknas.length + ' värden till.';
    }

    function lagesvy() {
      var res = senaste;
      var klart = res && res.klar;

      rader.forEach(function (rad, i) {
        if (traningslage) {
          rad.ut.hidden = true;
          rad.svarsruta.hidden = false;
          rad.svarKnapp.disabled = !klart;
          rad.svarInput.disabled = !klart;
          if (!klart) {
            rad.dom.className = '';
            rad.dom.textContent = '';
          }
          return;
        }

        rad.svarsruta.hidden = true;
        rad.ut.hidden = false;

        if (!klart) {
          rad.ut.classList.add('is-tom');
          rad.utVarde.textContent = saknasText(res.saknas);
          rad.utCalc.textContent = '';
          rad.utNot.hidden = true;
          return;
        }

        var r = res.resultat[i];
        rad.ut.classList.remove('is-tom');
        rad.utVarde.textContent = visaTal(r.varde) + ' ' + r.spec.enhet;
        rad.utCalc.textContent = r.uttryck + ' = ' + visaTal(r.varde);
        if (r.band && r.band.text) {
          rad.utNot.hidden = false;
          rad.utNot.className = r.band.niva === 'hog' ? 'vt-krit' : 'vt-extra';
          rad.utNot.textContent = r.band.text;
        } else {
          rad.utNot.hidden = true;
        }
      });
    }

    function sattLage(trana) {
      traningslage = trana;
      kort.classList.toggle('is-trana', trana);
      knappRakna.setAttribute('aria-pressed', String(!trana));
      knappTrana.setAttribute('aria-pressed', String(trana));
      rader.forEach(function (rad) {
        rad.svarInput.value = '';
        rad.dom.className = '';
        rad.dom.textContent = '';
      });
      rakna();
    }

    falt.forEach(function (f) {
      f.input.addEventListener('input', rakna);
    });

    knappRakna.addEventListener('click', function () { sattLage(false); });
    knappTrana.addEventListener('click', function () { sattLage(true); });

    rader.forEach(function (rad) {
      function kontrollera() {
        if (!senaste || !senaste.klar) return;
        var mitt = tolkaTal(rad.svarInput.value);
        var facitpost = senaste.resultat.filter(function (r) { return r.spec === rad.spec; })[0];
        var facit = facitpost.varde;
        if (isNaN(mitt)) {
          rad.dom.className = 'vt-dom fel';
          rad.dom.textContent = 'Skriv in ett tal.';
          return;
        }
        /* En hundradels marginal för avrundning i inmatningen. */
        if (Math.abs(mitt - facit) < 0.05) {
          rad.dom.className = 'vt-dom ratt';
          rad.dom.textContent = 'Rätt. ' + facitpost.uttryck + ' = ' + visaTal(facit) + ' ' + rad.spec.enhet + '.';
        } else {
          rad.dom.className = 'vt-dom fel';
          rad.dom.textContent = 'Inte riktigt. ' + facitpost.uttryck + ' = ' +
            visaTal(facit) + ' ' + rad.spec.enhet + '.';
        }
      }
      rad.svarKnapp.addEventListener('click', kontrollera);
      rad.svarInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); kontrollera(); }
      });
    });

    nollknapp.addEventListener('click', function () {
      falt.forEach(function (f) { f.input.value = ''; });
      rader.forEach(function (rad) {
        rad.svarInput.value = '';
        rad.dom.className = '';
        rad.dom.textContent = '';
      });
      rakna();
      if (falt[0]) falt[0].input.focus();
    });

    rakna();
    return kort;
  }

  /* ---------------------------------------------------------
     Renderaren: blodgasklassificerare (mönster D→C)
     ---------------------------------------------------------
     Fyra mätvärden (pH, pCO₂, HCO₃⁻, BE) avgör en primär rubbning
     genom en beslutsgång (D), som i sin tur styr vilken formel (C)
     som prövar om kompensationen är den förväntade. Det är sidans
     mest bespoke logik — till skillnad från värdeskalan är det
     inget generellt mönster som fler instrument delar, så koden
     ligger handskriven här medan referensvärdena och koefficienterna
     (facit) ligger i data/akutmedicin.json.

     Källa för hela algoritmen: Berend, de Vries & Gans (2014),
     "Physiological Approach to Assessment of Acid–Base
     Disturbances", NEJM 371(15):1434–1445, Table 1 och Figure 1.
     Koefficienterna i originalet är angivna i mmHg och konverterade
     till kPa här (× 0,1333) — se `bedomBlodgas` för uträkningen.
     Anjongapets referensvärde (8–12 mmol/L) är samma som
     data/ordlista.json redan bär för uppslagsordet "anjongap", inte
     ett eget påhittat tal. */

  /**
   * Ren beslutslogik, utan DOM — testbar för sig
   * (scripts/test_verktyg_akutmedicin.js). `v` bär de inlästa
   * värdena, `ref` är facitets referensintervall.
   * @returns {Object} { klar, saknas } eller
   *   { klar:true, primar, slutsats:{niva,titel}, steg:[{titel,text}] }
   */
  function bedomBlodgas(v, ref) {
    var KARNFALT = ['ph', 'pco2', 'hco3', 'be'];
    var saknas = KARNFALT.filter(function (n) { return typeof v[n] !== 'number'; });
    if (saknas.length) return { klar: false, saknas: saknas };

    var steg = [];

    /* STEG 1 — pH: acidemi, alkalemi eller normalt. */
    var phRiktning = v.ph < ref.ph.min ? 'acidemi' : (v.ph > ref.ph.max ? 'alkalemi' : 'normalt');
    steg.push({ titel: 'pH', text:
      phRiktning === 'normalt'
        ? 'pH ' + visaTal(v.ph) + ' ligger inom referensintervallet (' + visaTal(ref.ph.min) + '–' + visaTal(ref.ph.max) + ').'
        : 'pH ' + visaTal(v.ph) + ' ligger ' + (phRiktning === 'acidemi' ? 'under' : 'över') +
          ' referensintervallet (' + visaTal(ref.ph.min) + '–' + visaTal(ref.ph.max) + ') — ' + phRiktning + '.'
    });

    /* Avvikelser i respektive komponent, oberoende av varandra. */
    var metabol = v.hco3 < ref.hco3.min ? 'acidos' : (v.hco3 > ref.hco3.max ? 'alkalos' : null);
    var resp = v.pco2 > ref.pco2.max ? 'acidos' : (v.pco2 < ref.pco2.min ? 'alkalos' : null);

    var primar;
    if (phRiktning === 'acidemi') {
      if (metabol === 'acidos' && resp === 'acidos') primar = 'blandad_acidos';
      else if (metabol === 'acidos') primar = 'metabol_acidos';
      else if (resp === 'acidos') primar = 'resp_acidos';
      else primar = 'oklar_acidemi';
    } else if (phRiktning === 'alkalemi') {
      if (metabol === 'alkalos' && resp === 'alkalos') primar = 'blandad_alkalos';
      else if (metabol === 'alkalos') primar = 'metabol_alkalos';
      else if (resp === 'alkalos') primar = 'resp_alkalos';
      else primar = 'oklar_alkalemi';
    } else {
      primar = (!metabol && !resp) ? 'normal' : 'normalt_ph_men_avvikande';
    }

    steg.push({ titel: 'Primär rubbning', text: primarText(primar, v, ref, metabol, resp) });

    var kompensation = null;
    if (primar === 'metabol_acidos' || primar === 'metabol_alkalos') {
      kompensation = metabolKompensation(primar, v, ref);
      steg.push(kompensation);
    } else if (primar === 'resp_acidos' || primar === 'resp_alkalos') {
      kompensation = respKompensation(primar, v, ref);
      steg.push(kompensation);
    }

    /* Bara när algoritmen faktiskt landat i en metabol acidos — inte
       varje gång bikarbonatet råkar ligga under 22, för det gör det
       även vid en fullt förväntad kompensatorisk sänkning (t.ex. vid
       kronisk respiratorisk alkalos). Anjongapet hör bara hemma när
       det finns en riktig metabol acidos att förklara. */
    var harMetabolAcidoskomponent = primar === 'metabol_acidos' || primar === 'blandad_acidos';
    if (harMetabolAcidoskomponent && typeof v.na === 'number' && typeof v.cl === 'number') {
      steg.push(anjongapSteg(v, ref));
    }

    return { klar: true, primar: primar, slutsats: slutsatsFor(primar, kompensation), steg: steg };
  }

  function primarText(primar, v, ref, metabol, resp) {
    var beText = '';
    if (primar === 'metabol_acidos' || primar === 'blandad_acidos') {
      beText = v.be < ref.be.min
        ? ' Basöverskottet ' + visaTal(v.be) + ' mmol/L ligger under referensintervallet (' +
          visaTal(ref.be.min) + ' till +' + visaTal(ref.be.max) + ') och bekräftar den metabola komponenten — till skillnad från aktuellt bikarbonat är basöverskottet konstruerat för att inte påverkas av ett akut förändrat pCO₂.'
        : ' Basöverskottet ' + visaTal(v.be) + ' mmol/L ligger dock inom referensintervallet, vilket är värt att kontrollera vid en så tydlig bikarbonatsänkning.';
    } else if (primar === 'metabol_alkalos' || primar === 'blandad_alkalos') {
      beText = v.be > ref.be.max
        ? ' Basöverskottet ' + visaTal(v.be) + ' mmol/L ligger över referensintervallet och bekräftar den metabola komponenten.'
        : ' Basöverskottet ' + visaTal(v.be) + ' mmol/L ligger dock inom referensintervallet, vilket är värt att kontrollera.';
    }

    switch (primar) {
      case 'metabol_acidos':
        return 'Bikarbonatet ' + visaTal(v.hco3) + ' mmol/L är lägre än referensintervallet (' +
          visaTal(ref.hco3.min) + '–' + visaTal(ref.hco3.max) + '), medan pCO₂ ' + visaTal(v.pco2) +
          ' kPa ligger inom sitt (' + visaTal(ref.pco2.min) + '–' + visaTal(ref.pco2.max) +
          '). Mönstret pekar på en primär metabol acidos.' + beText;
      case 'metabol_alkalos':
        return 'Bikarbonatet ' + visaTal(v.hco3) + ' mmol/L är högre än referensintervallet (' +
          visaTal(ref.hco3.min) + '–' + visaTal(ref.hco3.max) + '), medan pCO₂ ' + visaTal(v.pco2) +
          ' kPa ligger inom sitt. Mönstret pekar på en primär metabol alkalos.' + beText;
      case 'resp_acidos':
        return 'pCO₂ ' + visaTal(v.pco2) + ' kPa är högre än referensintervallet (' +
          visaTal(ref.pco2.min) + '–' + visaTal(ref.pco2.max) + '), medan bikarbonatet ' +
          visaTal(v.hco3) + ' mmol/L ännu ligger inom sitt (' + visaTal(ref.hco3.min) + '–' +
          visaTal(ref.hco3.max) + '). Mönstret pekar på en primär respiratorisk acidos.';
      case 'resp_alkalos':
        return 'pCO₂ ' + visaTal(v.pco2) + ' kPa är lägre än referensintervallet (' +
          visaTal(ref.pco2.min) + '–' + visaTal(ref.pco2.max) + '), medan bikarbonatet ' +
          visaTal(v.hco3) + ' mmol/L ännu ligger inom sitt. Mönstret pekar på en primär respiratorisk alkalos.';
      case 'blandad_acidos':
        return 'Både bikarbonatet (' + visaTal(v.hco3) + ' mmol/L, under ' + visaTal(ref.hco3.min) +
          ') och pCO₂ (' + visaTal(v.pco2) + ' kPa, över ' + visaTal(ref.pco2.max) +
          ') avviker åt det sura hållet samtidigt. Det talar för en kombinerad metabol och ' +
          'respiratorisk acidos — två samtidiga rubbningar, inte den ena som kompenserar den andra.' + beText;
      case 'blandad_alkalos':
        return 'Både bikarbonatet (' + visaTal(v.hco3) + ' mmol/L, över ' + visaTal(ref.hco3.max) +
          ') och pCO₂ (' + visaTal(v.pco2) + ' kPa, under ' + visaTal(ref.pco2.min) +
          ') avviker åt det basiska hållet samtidigt. Det talar för en kombinerad metabol och ' +
          'respiratorisk alkalos.' + beText;
      case 'oklar_acidemi':
        return 'pH-värdet är surt, men varken bikarbonatet (' + visaTal(v.hco3) + ' mmol/L) eller pCO₂ (' +
          visaTal(v.pco2) + ' kPa) ligger utanför sina referensintervall. Kontrollera att värdena är ' +
          'korrekt inmatade — annars kan bilden bero på en rubbning som redan hunnit kompenseras nästan ' +
          'helt, eller på en felkälla i provtagningen.';
      case 'oklar_alkalemi':
        return 'pH-värdet är basiskt, men varken bikarbonatet (' + visaTal(v.hco3) + ' mmol/L) eller pCO₂ (' +
          visaTal(v.pco2) + ' kPa) ligger utanför sina referensintervall. Kontrollera att värdena är ' +
          'korrekt inmatade — annars kan bilden bero på en rubbning som redan hunnit kompenseras nästan helt.';
      case 'normalt_ph_men_avvikande':
        var vad = metabol && resp ? 'både bikarbonatet och pCO₂' : (metabol ? 'bikarbonatet' : 'pCO₂');
        return 'pH ligger inom referensintervallet trots att ' + vad + ' avviker. Det kan vara en ' +
          'rubbning som hunnit kompenseras nästan fullständigt, eller två motsatta rubbningar som ' +
          'råkar ta ut varandra — blodgasen ensam kan inte skilja dem åt. Jämför med tidigare värden ' +
          'och den kliniska bilden.';
      default: // 'normal'
        return 'Varken bikarbonatet eller pCO₂ avviker från referensintervallet. Blodgasen är normal.';
    }
  }

  /** Winters formel m.fl. — förväntat pCO₂ vid en primärt metabol rubbning.
      Koefficienterna är Berend et al:s mmHg-tal × 0,1333 (kPa per mmHg). */
  function metabolKompensation(primar, v, ref) {
    var acidos = primar === 'metabol_acidos';
    var forvantat = acidos
      ? 0.2 * v.hco3 + 1.1
      : 0.09 * (v.hco3 - ref.hco3.bas) + 5.3;
    var tolerans = 0.3;
    var min = forvantat - tolerans, max = forvantat + tolerans;
    var uttryck = acidos
      ? '0,2 × ' + visaTal(v.hco3) + ' + 1,1'
      : '0,09 × (' + visaTal(v.hco3) + ' − ' + visaTal(ref.hco3.bas) + ') + 5,3';

    var verdikt;
    if (v.pco2 < min) {
      verdikt = 'lägre än väntat — talar för en samtidig respiratorisk alkalos utöver den metabola ' +
        (acidos ? 'acidosen' : 'alkalosen') + '.';
    } else if (v.pco2 > max) {
      verdikt = 'högre än väntat — talar för en samtidig respiratorisk acidos utöver den metabola ' +
        (acidos ? 'acidosen' : 'alkalosen') + ' (till exempel otillräcklig kompensation eller trötthet i andningsarbetet).';
    } else {
      verdikt = 'inom det förväntade spannet — mönstret talar för en ren (okomplicerad) metabol ' +
        (acidos ? 'acidos' : 'alkalos') + ' med adekvat respiratorisk kompensation.';
    }

    return { titel: 'Förväntad kompensation', text:
      "Winters formel (Berend, de Vries & Gans, 2014) ger förväntat pCO₂ = " + uttryck + ' = ' +
      visaTal(forvantat) + ' kPa (± ' + visaTal(tolerans) + '). Uppmätt pCO₂ är ' + visaTal(v.pco2) +
      ' kPa — ' + verdikt,
      status: v.pco2 < min || v.pco2 > max ? 'blandad' : 'ren' };
  }

  /** Förväntad metabol kompensation vid en primärt respiratorisk
      rubbning. Njurarna svarar långsamt, så akut och kronisk
      kompensation ger olika förväntade bikarbonatnivåer — här visas
      båda i stället för att fråga användaren om något en enskild
      blodgas inte kan avgöra på egen hand. */
  function respKompensation(primar, v, ref) {
    var acidos = primar === 'resp_acidos';
    var deltaPco2 = acidos ? (v.pco2 - ref.pco2.bas) : (ref.pco2.bas - v.pco2);
    var akutKoeff = acidos ? 0.75 : -1.5;
    var kronKoeff = acidos ? 3.4 : -3.4;
    var akut = ref.hco3.bas + akutKoeff * deltaPco2;
    var kron = ref.hco3.bas + kronKoeff * deltaPco2;
    var undre = Math.min(akut, kron), övre = Math.max(akut, kron);

    var verdikt;
    if (v.hco3 < undre) {
      verdikt = 'lägre än vad ens en helt färsk rubbning skulle ge — talar för en samtidig metabol acidos utöver den respiratoriska.';
    } else if (v.hco3 > övre) {
      verdikt = 'högre än vad även en fullt kompenserad, kronisk rubbning skulle ge — talar för en samtidig metabol alkalos utöver den respiratoriska.';
    } else {
      verdikt = 'inom det förväntade spannet mellan en färsk och en fullt kompenserad rubbning.';
    }

    return { titel: 'Förväntad kompensation', text:
      'Njurarnas svar tar timmar till dagar. Är rubbningen ny (timmar) förväntas bikarbonatet ligga ' +
      'kring ' + visaTal(akut) + ' mmol/L; är den veckor gammal och fullt kompenserad förväntas det i ' +
      'stället ligga kring ' + visaTal(kron) + ' mmol/L. Uppmätt bikarbonat är ' + visaTal(v.hco3) +
      ' mmol/L — ' + verdikt,
      status: (v.hco3 < undre || v.hco3 > övre) ? 'blandad' : 'ren' };
  }

  function anjongapSteg(v, ref) {
    var ag = v.na - (v.cl + v.hco3);
    var uttryck = visaTal(v.na) + ' − (' + visaTal(v.cl) + ' + ' + visaTal(v.hco3) + ')';
    var text = 'Anjongap = ' + uttryck + ' = ' + visaTal(ag) + ' mmol/L (referens ' +
      visaTal(ref.anjongap.min) + '–' + visaTal(ref.anjongap.max) + ' mmol/L). ';

    if (ag > ref.anjongap.max) {
      text += 'Högt anjongap talar för en tillkommen organisk syra som orsak — till exempel laktacidos, ' +
        'ketoacidos, njursvikt eller en förgiftning — snarare än att bikarbonat gått förlorat direkt.';
      if (typeof v.laktat === 'number') {
        text += v.laktat > ref.laktat.max
          ? ' Laktatet ' + visaTal(v.laktat) + ' mmol/L är förhöjt (referens cirka ' +
            visaTal(ref.laktat.min) + '–' + visaTal(ref.laktat.max) + ' mmol/L) och talar för att en ' +
            'laktacidos förklarar hela eller delar av gapet.'
          : ' Laktatet ' + visaTal(v.laktat) + ' mmol/L ligger inom referensintervallet, så det höga ' +
            'anjongapet förklaras troligen av något annat än laktacidos — till exempel ketoacidos eller njursvikt.';
      }
    } else if (ag < ref.anjongap.min) {
      text += 'Ovanligt lågt anjongap ses ibland vid lågt albumin eller vid vissa mätmetoder, och är sällan i sig kliniskt drivande.';
    } else {
      text += 'Normalt anjongap talar för att bikarbonatet gått förlorat direkt (till exempel vid diarré) ' +
        'eller att njurarna inte kan återbilda det (renal tubulär acidos), snarare än för en tillkommen syra.';
    }
    return { titel: 'Anjongap', text: text };
  }

  function slutsatsFor(primar, kompensation) {
    var TITLAR = {
      normal: { niva: 'ingen', titel: 'Normal blodgas.' },
      oklar_acidemi: { niva: 'medel', titel: 'Oklar bild — kontrollera värdena.' },
      oklar_alkalemi: { niva: 'medel', titel: 'Oklar bild — kontrollera värdena.' },
      normalt_ph_men_avvikande: { niva: 'medel', titel: 'Normalt pH trots avvikande komponent — kompenserad eller blandad rubbning.' },
      blandad_acidos: { niva: 'hog', titel: 'Kombinerad metabol och respiratorisk acidos.' },
      blandad_alkalos: { niva: 'hog', titel: 'Kombinerad metabol och respiratorisk alkalos.' }
    };
    if (TITLAR[primar]) return TITLAR[primar];

    var namn = {
      metabol_acidos: 'metabol acidos', metabol_alkalos: 'metabol alkalos',
      resp_acidos: 'respiratorisk acidos', resp_alkalos: 'respiratorisk alkalos'
    }[primar];
    var ren = kompensation && kompensation.status === 'ren';
    return {
      niva: ren ? 'lag' : 'hog',
      titel: 'Primär ' + namn + (ren ? ', adekvat kompenserad.' : ' med tecken på en samtidig rubbning.')
    };
  }

  /**
   * DOM-lagret ovanpå bedomBlodgas. Skiljer sig från de andra
   * mönstren på en punkt med avsikt: ingen Träna-flik. De andra
   * skalornas träningsläge ber om EN siffra att kontrollera mot
   * facit — här är resultatet ett resonemang i flera stycken, och
   * en sådan textjämförelse vore varken meningsfull att skriva
   * eller att rätta. Värdet i den här skalan är själva
   * resonemanget, som redan står framme i räkneläget.
   */
  function skapaBlodgas(skala, id) {
    var kort = document.createElement('section');
    kort.className = 'vt-tool';
    kort.id = id;

    var huvud = document.createElement('div');
    huvud.className = 'vt-tool-head';
    var h3 = document.createElement('h3');
    h3.textContent = skala.rubrik;
    h3.id = id + '-rubrik';
    huvud.appendChild(h3);
    kort.appendChild(huvud);

    var intro = document.createElement('p');
    intro.className = 'vt-tool-intro';
    intro.textContent = skala.intro;
    kort.appendChild(intro);

    var rutnat = document.createElement('div');
    rutnat.className = 'vt-grid';
    kort.appendChild(rutnat);

    var falt = skala.falt.map(function (spec) {
      var f = byggTalfalt(spec, id, true);
      rutnat.appendChild(f.el);
      return f;
    });

    var valfriNot = document.createElement('p');
    valfriNot.className = 'vt-extra';
    valfriNot.textContent = 'Natrium och klorid är valfria och används bara för att räkna ut anjongapet. Laktatet är valfritt och används bara för att kommentera ett förhöjt anjongap.';
    kort.appendChild(valfriNot);

    var varnBox = document.createElement('div');
    varnBox.className = 'vt-warn';
    varnBox.hidden = true;
    var varnTitel = document.createElement('strong');
    varnTitel.className = 'vt-warn-titel';
    varnTitel.textContent = 'Kontrollera värdet';
    var varnText = document.createElement('div');
    varnText.className = 'vt-warn-text';
    varnBox.appendChild(varnTitel);
    varnBox.appendChild(varnText);
    kort.appendChild(varnBox);

    /* Tomt/ofullständigt läge. */
    var ut = document.createElement('div');
    ut.className = 'vt-out is-tom';
    ut.setAttribute('aria-live', 'polite');
    var utVarde = document.createElement('div');
    utVarde.className = 'vt-out-value';
    ut.appendChild(utVarde);
    kort.appendChild(ut);

    /* Slutsatsen — samma platta som poängskalornas svarsband. */
    var slutsats = document.createElement('div');
    slutsats.className = 'vt-band';
    slutsats.hidden = true;
    var slutsatsTitel = document.createElement('strong');
    slutsatsTitel.className = 'vt-band-titel';
    slutsats.appendChild(slutsatsTitel);
    kort.appendChild(slutsats);

    /* Resonemanget, steg för steg — varje steg ett delblock. */
    var stegBox = document.createElement('div');
    stegBox.className = 'vt-steg';
    stegBox.hidden = true;
    kort.appendChild(stegBox);

    var nollrad = document.createElement('div');
    nollrad.className = 'vt-nollstall';
    var nollknapp = document.createElement('button');
    nollknapp.type = 'button';
    nollknapp.textContent = 'Nollställ';
    nollrad.appendChild(nollknapp);
    kort.appendChild(nollrad);

    function faltSpec(namn) {
      return skala.falt.filter(function (f) { return f.namn === namn; })[0];
    }

    function lasVarden() {
      var v = {};
      falt.forEach(function (f) {
        var n = tolkaTal(f.input.value);
        if (!isNaN(n)) v[f.spec.namn] = n;
      });
      return v;
    }

    function orimliga(varden) {
      var texter = [];
      falt.forEach(function (f) {
        var r = f.spec.rimlig;
        if (!r) return;
        var n = varden[f.spec.namn];
        if (typeof n !== 'number') return;
        if (n < r.min || n > r.max) {
          texter.push('Kontrollera ' + f.spec.kort.toLowerCase() + ' – ' +
            visaTal(n) + (f.spec.enhet ? ' ' + f.spec.enhet : '') + ' ligger utanför det som mäts ' +
            'på en levande patient (' + visaTal(r.min) + '–' + visaTal(r.max) +
            (f.spec.enhet ? ' ' + f.spec.enhet : '') + '). Bedömningen görs ändå.');
        }
      });
      return texter;
    }

    function saknasText(saknas) {
      var etiketter = saknas.map(function (n) { return faltSpec(n).kort.toLowerCase(); });
      return etiketter.length === 1
        ? 'Fyll i ' + etiketter[0] + ' också.'
        : 'Fyll i ' + etiketter.join(', ') + '.';
    }

    function uppdatera() {
      var varden = lasVarden();
      var res = bedomBlodgas(varden, skala.referens);

      var varningar = orimliga(varden);
      varnBox.hidden = !varningar.length;
      varnText.innerHTML = '';
      varningar.forEach(function (t) {
        var p = document.createElement('p');
        p.textContent = t;
        varnText.appendChild(p);
      });

      if (!res.klar) {
        ut.hidden = false;
        utVarde.textContent = saknasText(res.saknas);
        slutsats.hidden = true;
        stegBox.hidden = true;
        stegBox.innerHTML = '';
        return;
      }

      ut.hidden = true;

      slutsats.hidden = false;
      slutsats.className = 'vt-band is-' + res.slutsats.niva;
      slutsatsTitel.textContent = res.slutsats.titel;

      stegBox.innerHTML = '';
      stegBox.hidden = false;
      res.steg.forEach(function (s) {
        var blk = document.createElement('div');
        blk.className = 'vt-delblock';
        var h4 = document.createElement('h4');
        h4.textContent = s.titel;
        var p = document.createElement('p');
        p.textContent = s.text;
        blk.appendChild(h4);
        blk.appendChild(p);
        stegBox.appendChild(blk);
      });
    }

    falt.forEach(function (f) {
      f.input.addEventListener('input', uppdatera);
    });

    nollknapp.addEventListener('click', function () {
      falt.forEach(function (f) { f.input.value = ''; });
      uppdatera();
      if (falt[0]) falt[0].input.focus();
    });

    uppdatera();
    return kort;
  }

  /* ---------------------------------------------------------
     Renderaren: kryssruteskala (mönster A)
     ---------------------------------------------------------
     Varje kriterium är antingen uppfyllt eller inte och bär sin
     egen vikt. Summan läses mot samma sorts svarstabell som
     värdeskalan, så bandFor() delas rakt av.

     Två skillnader mot värdeskalan, båda med följder för koden:

     1. Det finns inget ofyllt läge. En urkryssad ruta betyder att
        kriteriet saknas, inte att svaret uteblivit — bedömningen
        är alltså alltid komplett och resultatet visas från början.
        Wells 0 poäng ÄR ett svar, till skillnad från en NEWS2 utan
        ifylld puls.
     2. Vikterna kan vara negativa. Wells drar av 2 poäng när en
        annan diagnos är minst lika sannolik som DVT, så uträkningen
        skrivs med tecken i stället för som en kedja av plus.

     `grupp` gör två kriterier ömsesidigt uteslutande. CHA₂DS₂-VA
     har både "75 år eller äldre" (2 p) och "65–74 år" (1 p), och
     ingen patient kan uppfylla båda; kryssas den ena i lossas den
     andra. Utan det kan skalan summeras till 3 åldersspoäng, vilket
     inte finns i instrumentet.
     --------------------------------------------------------- */

  /** Vikten som den skrivs vid kriteriet: "+1 p", "−2 p". */
  function viktText(n) {
    return (n < 0 ? '−' : '+') + Math.abs(n) + ' p';
  }

  /** Uträkningen med tecken: "1 + 1 − 2 = 0". */
  function kryssUtrakning(delar, summa) {
    if (!delar.length) return 'Inget kriterium ikryssat = 0';
    var s = '';
    delar.forEach(function (d, i) {
      if (i === 0) s += (d.poang < 0 ? '−' : '') + Math.abs(d.poang);
      else s += (d.poang < 0 ? ' − ' : ' + ') + Math.abs(d.poang);
    });
    return s + ' = ' + summa;
  }

  function bedomKryss(skala, ikryssade) {
    var delar = [];
    var summa = 0;
    skala.kriterier.forEach(function (k) {
      if (!ikryssade[k.namn]) return;
      summa += k.poang;
      delar.push({ kriterium: k, poang: k.poang });
    });
    return { summa: summa, delar: delar, band: bandFor(skala, summa) };
  }

  function byggKryssruta(spec, idPrefix) {
    var wrap = document.createElement('label');
    wrap.className = 'vt-krav';
    wrap.dataset.falt = spec.namn;

    var ruta = document.createElement('input');
    ruta.type = 'checkbox';
    ruta.id = idPrefix + '-' + spec.namn;
    ruta.checked = false;
    wrap.appendChild(ruta);

    var text = document.createElement('span');
    text.className = 'vt-krav-text';
    text.textContent = spec.etikett;
    wrap.appendChild(text);

    var poang = document.createElement('span');
    poang.className = 'vt-poang';
    poang.textContent = viktText(spec.poang);
    wrap.appendChild(poang);

    return { el: wrap, ruta: ruta, poang: poang, spec: spec };
  }

  function skapaKryssruteskala(skala, id) {
    var kort = document.createElement('section');
    kort.className = 'vt-tool';
    kort.id = id;

    var huvud = document.createElement('div');
    huvud.className = 'vt-tool-head';
    var h3 = document.createElement('h3');
    h3.textContent = skala.rubrik;
    h3.id = id + '-rubrik';
    huvud.appendChild(h3);

    var lage = document.createElement('div');
    lage.className = 'vt-mode';
    lage.setAttribute('role', 'group');
    lage.setAttribute('aria-label', 'Läge för ' + skala.namn);
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
    intro.textContent = skala.intro;
    kort.appendChild(intro);

    /* Kriterierna */
    var lista = document.createElement('div');
    lista.className = 'vt-kravlista';
    kort.appendChild(lista);

    var rutor = skala.kriterier.map(function (k) {
      var r = byggKryssruta(k, id);
      lista.appendChild(r.el);
      return r;
    });

    /* Hjälptexterna vid kriterierna, samma finstilta form som i
       värdeskalan: ingen fetstil, texten namnger sitt eget
       kriterium (CLAUDE_REGLER §0.5 punkt 4). */
    var hjalp = document.createElement('div');
    hjalp.className = 'vt-hjalp';
    skala.kriterier.forEach(function (k) {
      if (!k.hjalp) return;
      var rad = document.createElement('p');
      rad.textContent = k.hjalp;
      hjalp.appendChild(rad);
    });
    if (hjalp.children.length) kort.appendChild(hjalp);

    /* Utfallet */
    var ut = document.createElement('div');
    ut.className = 'vt-out';
    ut.setAttribute('aria-live', 'polite');
    var utEtikett = document.createElement('span');
    utEtikett.className = 'vt-out-label';
    utEtikett.textContent = skala.summaetikett;
    var utVarde = document.createElement('div');
    utVarde.className = 'vt-out-value';
    var utCalc = document.createElement('div');
    utCalc.className = 'vt-calc';
    ut.appendChild(utEtikett);
    ut.appendChild(utVarde);
    ut.appendChild(utCalc);
    kort.appendChild(ut);

    var band = document.createElement('div');
    band.className = 'vt-band';
    var bandTitel = document.createElement('strong');
    bandTitel.className = 'vt-band-titel';
    var bandText = document.createElement('p');
    bandText.className = 'vt-band-rad';
    band.appendChild(bandTitel);
    band.appendChild(bandText);
    kort.appendChild(band);

    /* Svarsruta (träningsläget) */
    var svarsruta = document.createElement('div');
    svarsruta.className = 'vt-svarsruta';
    svarsruta.hidden = true;
    var svarEtikett = document.createElement('span');
    svarEtikett.className = 'vt-out-label';
    svarEtikett.textContent = 'Din ' + skala.namn + '-poäng';
    var svarRad = document.createElement('div');
    svarRad.className = 'vt-svarsrad';
    var svarWrap = document.createElement('div');
    svarWrap.className = 'vt-inputrow';
    var svarInput = document.createElement('input');
    svarInput.type = 'text';
    svarInput.inputMode = 'numeric';
    svarInput.autocomplete = 'off';
    svarInput.id = id + '-ditt-svar';
    svarInput.setAttribute('aria-label', 'Din ' + skala.namn + '-poäng');
    var svarEnhet = document.createElement('span');
    svarEnhet.className = 'vt-unit-fixed';
    svarEnhet.textContent = skala.enhetssuffix;
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

    var nollrad = document.createElement('div');
    nollrad.className = 'vt-nollstall';
    var nollknapp = document.createElement('button');
    nollknapp.type = 'button';
    nollknapp.textContent = 'Nollställ';
    nollrad.appendChild(nollknapp);
    kort.appendChild(nollrad);

    /* ---- tillstånd ---- */
    var traningslage = false;
    var senaste = null;

    function lasKryss() {
      var v = {};
      rutor.forEach(function (r) { v[r.spec.namn] = !!r.ruta.checked; });
      return v;
    }

    function rakna() {
      senaste = bedomKryss(skala, lasKryss());
      var aktiva = {};
      senaste.delar.forEach(function (d) { aktiva[d.kriterium.namn] = true; });

      rutor.forEach(function (r) {
        if (traningslage) {
          r.poang.className = 'vt-poang is-dold';
          r.poang.textContent = 'räkna själv';
          return;
        }
        r.poang.className = 'vt-poang' + (aktiva[r.spec.namn] ? ' is-aktiv' : ' is-tom');
        r.poang.textContent = viktText(r.spec.poang);
      });

      lagesvy();
    }

    function lagesvy() {
      if (traningslage) {
        ut.hidden = true;
        band.hidden = true;
        svarsruta.hidden = false;
        return;
      }
      svarsruta.hidden = true;
      ut.hidden = false;
      band.hidden = false;

      utVarde.textContent = poangText(senaste.summa);
      utCalc.textContent = kryssUtrakning(senaste.delar, senaste.summa);
      band.className = 'vt-band is-' + senaste.band.niva;
      bandTitel.textContent = senaste.band.rubrik;
      bandText.textContent = senaste.band.text;
    }

    function sattLage(trana) {
      traningslage = trana;
      kort.classList.toggle('is-trana', trana);
      knappRakna.setAttribute('aria-pressed', String(!trana));
      knappTrana.setAttribute('aria-pressed', String(trana));
      dom.className = '';
      dom.textContent = '';
      svarInput.value = '';
      rakna();
    }

    rutor.forEach(function (r) {
      r.ruta.addEventListener('change', function () {
        /* Ömsesidigt uteslutande kriterier: den nyss ikryssade
           vinner och gruppens övriga lossas. */
        if (r.spec.grupp && r.ruta.checked) {
          rutor.forEach(function (annan) {
            if (annan !== r && annan.spec.grupp === r.spec.grupp) {
              annan.ruta.checked = false;
            }
          });
        }
        rakna();
      });
    });

    knappRakna.addEventListener('click', function () { sattLage(false); });
    knappTrana.addEventListener('click', function () { sattLage(true); });

    svarKnapp.addEventListener('click', function () {
      var mitt = tolkaTal(svarInput.value);
      if (isNaN(mitt) || mitt !== Math.round(mitt)) {
        dom.className = 'vt-dom fel';
        dom.textContent = 'Skriv in din summa som ett heltal.';
        return;
      }
      var facit = senaste.summa;
      var utrakning = senaste.delar.length
        ? senaste.delar.map(function (d) {
            return d.kriterium.kort.toLowerCase() + ' ' + viktText(d.poang).replace(' p', '');
          }).join(', ') + ' = ' + facit
        : 'inget kriterium ikryssat = 0';

      if (mitt === facit) {
        dom.className = 'vt-dom ratt';
        dom.textContent = 'Rätt. ' + utrakning + '. ' + senaste.band.rubrik + ' – ' +
          senaste.band.text;
      } else {
        dom.className = 'vt-dom fel';
        dom.textContent = 'Inte riktigt. Rätt summa är ' + poangText(facit) + ': ' +
          utrakning + '. ' + senaste.band.rubrik + ' – ' + senaste.band.text;
      }
    });

    svarInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); svarKnapp.click(); }
    });

    nollknapp.addEventListener('click', function () {
      rutor.forEach(function (r) { r.ruta.checked = false; });
      dom.className = '';
      dom.textContent = '';
      svarInput.value = '';
      rakna();
    });

    rakna();
    return kort;
  }

  /* ---------------------------------------------------------
     Renderaren: beslutsgång (mönster D)
     ---------------------------------------------------------
     Instrument som inte summerar något. Läsaren svarar på ett
     eller flera steg, och svaren pekar tillsammans ut ett utfall.

     Utfallet är det HÖGST RANKADE bland de valda alternativen.
     Det är den regel de tre instrumenten delar: modifierad EHRA
     graderar efter det svåraste som stämmer, och BE-FAST och HINTS
     bygger båda på att ETT centralt fynd räcker för att flytta hela
     bedömningen — alltså max, aldrig summa. Instrument med flera
     steg blir därför en JSON-post, inte en ny renderare.

     Ingen Träna-flik, av samma skäl som blodgasklassificeraren
     saknar en: det finns ingen uträkning att kontrollera sitt eget
     svar mot, bara en klassificering man antingen känner igen
     eller inte.
     --------------------------------------------------------- */

  function bedomGang(skala, val) {
    var bast = null;
    for (var i = 0; i < skala.steg.length; i++) {
      var steg = skala.steg[i];
      for (var j = 0; j < steg.val.length; j++) {
        var alt = steg.val[j];
        if (alt.varde !== val[steg.namn]) continue;
        if (!alt.utfall) break;              // steget pekar inte ut något utfall
        if (!bast || alt.rang > bast.rang) bast = alt;
        break;
      }
    }
    if (!bast) return null;
    var u = skala.utfall[bast.utfall];
    if (!u) return null;
    return { nyckel: bast.utfall, utfall: u };
  }

  function skapaBeslutsgang(skala, id) {
    var kort = document.createElement('section');
    kort.className = 'vt-tool';
    kort.id = id;

    var huvud = document.createElement('div');
    huvud.className = 'vt-tool-head';
    var h3 = document.createElement('h3');
    h3.textContent = skala.rubrik;
    h3.id = id + '-rubrik';
    huvud.appendChild(h3);
    kort.appendChild(huvud);

    var intro = document.createElement('p');
    intro.className = 'vt-tool-intro';
    intro.textContent = skala.intro;
    kort.appendChild(intro);

    var rutnat = document.createElement('div');
    rutnat.className = 'vt-grid';
    kort.appendChild(rutnat);

    var falt = skala.steg.map(function (s) {
      var f = byggValfalt(s, id, true);   // stegen ger ingen poäng
      rutnat.appendChild(f.el);
      return f;
    });

    var hjalp = document.createElement('div');
    hjalp.className = 'vt-hjalp';
    skala.steg.forEach(function (s) {
      if (!s.hjalp) return;
      var rad = document.createElement('p');
      rad.textContent = s.hjalp;
      hjalp.appendChild(rad);
    });
    if (hjalp.children.length) kort.appendChild(hjalp);

    var band = document.createElement('div');
    band.className = 'vt-band';
    band.setAttribute('aria-live', 'polite');
    var bandTitel = document.createElement('strong');
    bandTitel.className = 'vt-band-titel';
    var bandText = document.createElement('p');
    bandText.className = 'vt-band-rad';
    band.appendChild(bandTitel);
    band.appendChild(bandText);
    kort.appendChild(band);

    var nollrad = document.createElement('div');
    nollrad.className = 'vt-nollstall';
    var nollknapp = document.createElement('button');
    nollknapp.type = 'button';
    nollknapp.textContent = 'Nollställ';
    nollrad.appendChild(nollknapp);
    kort.appendChild(nollrad);

    function rakna() {
      var val = {};
      falt.forEach(function (f) { val[f.spec.namn] = f.valjare.value; });
      var res = bedomGang(skala, val);
      if (!res) {
        /* Ett steg utan utfall får inte se ut som en lyckad
           bedömning (CLAUDE_REGLER §0.4). */
        band.className = 'vt-band is-tom';
        bandTitel.textContent = skala.tomrubrik;
        bandText.textContent = skala.tomtext;
        return;
      }
      band.className = 'vt-band is-' + res.utfall.niva;
      bandTitel.textContent = res.utfall.rubrik;
      bandText.textContent = res.utfall.text;
    }

    falt.forEach(function (f) { f.valjare.addEventListener('change', rakna); });

    nollknapp.addEventListener('click', function () {
      falt.forEach(function (f) { f.valjare.value = f.spec.val[0].varde; });
      rakna();
    });

    rakna();
    return kort;
  }

  var RENDERARE = {
    varde: skapaVardeskala,
    kryss: skapaKryssruteskala,
    formel: skapaFormelraknare,
    gang: skapaBeslutsgang,
    blodgas: skapaBlodgas
  };

  /* ---------------------------------------------------------
     Start
     --------------------------------------------------------- */

  function montera(facit) {
    var platser = document.querySelectorAll('[data-akut]');
    for (var i = 0; i < platser.length; i++) {
      var plats = platser[i];
      var nyckel = plats.getAttribute('data-akut');
      var skala = facit[nyckel];
      if (!skala) {
        /* Tyst uteblivet får aldrig se ut som en lyckad körning
           (CLAUDE_REGLER §0.4). En monteringspunkt utan post i
           facit ska synas som ett fel, inte som en tom yta. */
        plats.textContent = 'Skalan "' + nyckel + '" saknas i ' + FACIT + '.';
        plats.className = 'vt-warn';
        continue;
      }
      var rendera = RENDERARE[skala.monster];
      if (!rendera) {
        plats.textContent = 'Mönstret "' + skala.monster + '" har ingen renderare än.';
        plats.className = 'vt-warn';
        continue;
      }
      plats.appendChild(rendera(skala, 'akut-' + nyckel));
    }
    var utanJs = document.getElementById('akut-utan-js');
    if (utanJs) utanJs.hidden = true;
  }

  function start() {
    if (!document.querySelector('[data-akut]')) return;
    return fetch(FACIT)
      .then(function (svar) {
        if (!svar.ok) throw new Error(svar.status + ' ' + svar.statusText);
        return svar.json();
      })
      .then(montera)
      .catch(function () {
        /* Går facit inte att hämta ska sidans egen hänvisning stå
           kvar — den pekar på tabellerna i brödtexten. */
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
