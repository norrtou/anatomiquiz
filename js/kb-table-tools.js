/*
 * kb-table-tools.js — Skriv ut, spara som PDF och (för tabeller) ladda ner CSV,
 * för kunskapsbankens innehållssidor.
 *
 * (Filnamnet är kvar av historiska skäl; verktyget gäller numera alla
 * innehållssidor, inte bara tabeller.)
 *
 * CSP-säkert: ingen extern resurs, inget inline-script, inga beroenden.
 * "Skriv ut" och "Spara som PDF" använder webbläsarens utskriftsdialog
 * (window.print) tillsammans med sajtens print-stylesheet (@media print), som
 * skalar bort navigering, knappar och den här verktygsraden så att bara
 * innehållet – rubrik, text, tabeller och referenser – hamnar på A4/PDF:en.
 * "Ladda ner (CSV)" läser tabellernas text direkt ur DOM:en och visas bara
 * när det finns tabeller att exportera.
 *
 * Progressiv förbättring: utan JS visas sidan som vanligt, bara verktygsraden
 * uteblir. Verktygsraden injiceras underst (under ev. referenslista, ovanför
 * navigeringsknapparna).
 */
(function () {
  'use strict';

  var main = document.querySelector('main');
  if (!main) return;

  var tables = document.querySelectorAll('.kb-mtable, .kb-table');

  var ICON_PRINT =
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<polyline points="6 9 6 2 18 2 18 9"/>' +
    '<path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>' +
    '<rect x="6" y="14" width="12" height="8"/></svg>';
  var ICON_PDF =
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>' +
    '<polyline points="14 2 14 8 20 8"/><line x1="9" y1="15" x2="15" y2="15"/>' +
    '<line x1="9" y1="18.5" x2="13" y2="18.5"/></svg>';
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
    var raw = (h1 ? h1.textContent : document.title) || 'anatomiquiz';
    return raw.toLowerCase().replace(/[^a-z0-9åäö]+/g, '-').replace(/^-+|-+$/g, '') || 'anatomiquiz';
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
  box.setAttribute('aria-label', 'Skriv ut, spara som PDF eller ladda ner');

  var row = document.createElement('div');
  row.className = 'kb-tabletools-row';
  row.appendChild(button(ICON_PRINT, 'Skriv ut', function () { window.print(); }));
  row.appendChild(button(ICON_PDF, 'Spara som PDF', function () { window.print(); }));
  if (tables.length) {
    row.appendChild(button(ICON_CSV, 'Ladda ner (CSV)', downloadCsv));
  }

  var hint = document.createElement('p');
  hint.className = 'kb-tabletools-hint';
  var hintHtml =
    'Tips: i utskriftsrutan väljer du skrivare eller <strong>Spara som PDF</strong>. ' +
    'Bara innehållet följer med – meny, knappar och länkar utelämnas.';
  if (tables.length) {
    hintHtml += ' CSV-filen öppnas i Excel och Google Kalkylark.';
  }
  hint.innerHTML = hintHtml;

  box.appendChild(row);
  box.appendChild(hint);

  // Placera underst: ovanför navigeringsknapparna (.actions) om de finns, annars sist.
  var actions = main.querySelector('.actions');
  if (actions) {
    actions.parentNode.insertBefore(box, actions);
  } else {
    (main.querySelector('.card') || main).appendChild(box);
  }
})();
