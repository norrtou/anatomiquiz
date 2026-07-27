/* Swish-knappen på vision.html.
   Telefonnumret ligger ALDRIG som en sammanhängande sträng i HTML- eller
   JS-källan: varje siffra är ett eget data-attribut som CSS ritar ut via
   ::before. Ett enkelt textscrap av sidan hittar därför ingen matchande
   sifferföljd. Klicket sätter ihop siffrorna i minnet och kopierar dem –
   och det är även här (i körning, inte i markupen) knappens aria-label
   och kopieringsvärde skapas. */
(function () {
  "use strict";

  var btn = document.getElementById("swishCopyBtn");
  if (!btn) return;

  var digitEls = btn.querySelectorAll(".swish-number [data-c]");
  var digits = [];
  for (var i = 0; i < digitEls.length; i++) {
    digits.push(digitEls[i].getAttribute("data-c"));
  }
  var number = digits.slice(0, 4).join("") + "-" + digits.slice(4).join("");

  btn.setAttribute("aria-label", "Kopiera Swish-nummer " + number);

  var status = document.getElementById("swishStatus");
  var resetTimer = null;

  function showStatus(text) {
    if (!status) return;
    status.textContent = text;
    if (resetTimer) clearTimeout(resetTimer);
    resetTimer = setTimeout(function () {
      status.textContent = "";
    }, 3000);
  }

  btn.addEventListener("click", function () {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(number).then(
        function () { showStatus("Numret är kopierat."); },
        function () { showStatus("Kunde inte kopiera automatiskt: " + number); }
      );
    } else {
      showStatus("Kunde inte kopiera automatiskt: " + number);
    }
  });
})();
