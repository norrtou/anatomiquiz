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

  function byggTalfalt(spec, idPrefix) {
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

    var poang = document.createElement('span');
    poang.className = 'vt-poang is-tom';
    poang.textContent = '—';
    wrap.appendChild(poang);

    return { el: wrap, input: input, valjare: null, poang: poang, spec: spec };
  }

  function byggValfalt(spec, idPrefix) {
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

    var poang = document.createElement('span');
    poang.className = 'vt-poang is-tom';
    poang.textContent = '—';
    wrap.appendChild(poang);

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

  /* Mönster A (kryssruteskala), C (formelräknare) och D (beslutsgång)
     hängs på här när sina instrument byggs. Ett mönster utan
     instrument vore kod som ingen kör och ingen testar. */
  var RENDERARE = {
    varde: skapaVardeskala
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
