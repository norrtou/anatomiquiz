/* =========================================================
   kb-glossary.js — ordlistetooltips i kunskapsbankstexter
   =========================================================
   Förbättrar <a class="kb-term" data-def="…"> i löptexten:
   - Dator (hover/pekare): definitionen visas vid hover och
     vid tangentbordsfokus; klick går till ordlistan.
   - Mobil (ingen hover): tryck visar definitionen i en
     tooltip med en "Öppna i ordlistan"-länk; nytt tryck
     stänger. Länken navigerar.
   Progressiv förbättring: utan JS är .kb-term bara en vanlig
   intern länk till rätt post i ordlistan. Tooltipen ligger
   position:fixed (overlay) och påverkar aldrig layouten →
   Cumulative Layout Shift = 0. Inga externa beroenden.
   ========================================================= */
(function () {
  'use strict';

  var terms = document.querySelectorAll('a.kb-term');
  if (!terms.length) return;

  var hoverCapable = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  var tip = document.createElement('div');
  tip.className = 'kb-tip';
  tip.id = 'kb-tip';
  tip.setAttribute('role', 'tooltip');
  document.body.appendChild(tip);

  var defEl = document.createElement('span');
  var moreEl = document.createElement('a');
  moreEl.className = 'kb-tip-more';
  moreEl.textContent = 'Öppna i ordlistan →';
  tip.appendChild(defEl);
  tip.appendChild(document.createElement('br'));
  tip.appendChild(moreEl);

  var current = null;

  function position(el) {
    var r = el.getBoundingClientRect();
    var t = tip.getBoundingClientRect();
    var left = Math.min(Math.max(8, r.left), window.innerWidth - t.width - 8);
    var top = r.top - t.height - 8;
    if (top < 8) top = r.bottom + 8; // vänd nedåt om det inte får plats ovanför
    tip.style.left = Math.round(left) + 'px';
    tip.style.top = Math.round(top) + 'px';
  }

  function show(el) {
    defEl.textContent = el.getAttribute('data-def') || '';
    moreEl.href = el.getAttribute('href') || '#';
    tip.classList.add('is-visible');
    position(el);
    el.setAttribute('aria-describedby', 'kb-tip');
    current = el;
  }

  function hide() {
    if (!current) return;
    tip.classList.remove('is-visible');
    current.removeAttribute('aria-describedby');
    current = null;
  }

  terms.forEach(function (el) {
    if (hoverCapable) {
      el.addEventListener('mouseenter', function () { show(el); });
      el.addEventListener('mouseleave', hide);
      el.addEventListener('focus', function () { show(el); });
      el.addEventListener('blur', hide);
    } else {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        if (current === el) { hide(); } else { show(el); }
      });
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') hide();
  });

  if (!hoverCapable) {
    document.addEventListener('click', function (e) {
      if (current && !current.contains(e.target) && !tip.contains(e.target)) hide();
    });
  }

  window.addEventListener('resize', hide);
  window.addEventListener('scroll', function () {
    if (current) position(current);
  }, { passive: true });
})();
