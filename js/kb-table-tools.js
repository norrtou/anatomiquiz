/*
 * kb-table-tools.js — Skriv ut + ladda ner (CSV) för kunskapsbankens tabeller.
 *
 * CSP-säkert: ingen extern resurs, inget inline-script, inga beroenden. Läser
 * tabellernas textinnehåll direkt ur DOM:en. "Spara som PDF" sker via webbläsarens
 * utskriftsdialog (window.print) – ingen tung PDF-motor behövs.
 *
 * Progressiv förbättring: utan JS visas tabellerna som vanligt, bara verktygsraden
 * uteblir. Verktygsraden injiceras underst (under ev. referenslista, ovanför
 * navigeringsknapparna).
 */
(function () {
  'use strict';

  var tables = document.querySelectorAll('.kb-mtable, .kb-table');
  if (!tables.length) return;

  var ICON_PRINT =
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<polyline points="6 9 6 2 18 2 18 9"/>' +
    '<path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>' +
    '<rect x="6" y="14" width="12" height="8"/></svg>';
  var ICON_CSV =
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>' +
    '<polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>';

  function cellText(node) {
    return node.textContent.replace(/\s+/g, ' ').trim();
  }

  // CSV-fält: citera om det innehåller komma, citattecken, semikolon eller radbrytning.
  function csvField(s) {
    return /[",;\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }

  function buildCsv() {
    var lines = [];
    Array.prototype.forEach.call(tables, function (table) {
      var cap = table.querySelector('caption');
      if (cap) lines.push(csvField(cellText(cap)));
      Array.prototype.forEach.call(table.querySelectorAll('tr'), function (tr) {
        var cells = tr.querySelectorAll('th,td');
        if (!cells.length) return;
        var row = [];
        Array.prototype.forEach.call(cells, function (c) { row.push(csvField(cellText(c))); });
        lines.push(row.join(','));
      });
      lines.push(''); // tomrad mellan flera tabeller
    });
    return lines.join('\r\n');
  }

  function fileBase() {
    var h1 = document.querySelector('h1');
    var raw = (h1 ? h1.textContent : document.title) || 'tabell';
    return raw.toLowerCase().replace(/[^a-z0-9åäö]+/g, '-').replace(/^-+|-+$/g, '') || 'tabell';
  }

  function downloadCsv() {
    var csv = '﻿' + buildCsv(); // BOM → Excel tolkar UTF-8 (å ä ö) korrekt
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = fileBase() + '.csv';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 150);
  }

  function button(icon, label, onClick) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'kb-tabletools-btn';
    b.innerHTML = icon + '<span>' + label + '</span>';
    b.addEventListener('click', onClick);
    return b;
  }

  var box = document.createElement('div');
  box.className = 'kb-tabletools';
  box.setAttribute('role', 'group');
  box.setAttribute('aria-label', 'Skriv ut eller ladda ner tabellen');

  var row = document.createElement('div');
  row.className = 'kb-tabletools-row';
  row.appendChild(button(ICON_PRINT, 'Skriv ut', function () { window.print(); }));
  row.appendChild(button(ICON_CSV, 'Ladda ner (CSV)', downloadCsv));

  var hint = document.createElement('p');
  hint.className = 'kb-tabletools-hint';
  hint.innerHTML =
    'Tips: i utskriftsrutan kan du välja <strong>Spara som PDF</strong> i stället för skrivare. ' +
    'CSV-filen öppnas i Excel och Google Kalkylark.';

  box.appendChild(row);
  box.appendChild(hint);

  // Placera underst: ovanför navigeringsknapparna (.actions) om de finns, annars sist.
  var actions = document.querySelector('main .actions');
  if (actions) {
    actions.parentNode.insertBefore(box, actions);
  } else {
    (document.querySelector('main .card') || document.querySelector('main') || document.body).appendChild(box);
  }
})();
