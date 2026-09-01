/* Mockup shared behaviours: theme restore, status clock, app-bar menu, panorama parallax */
(function () {
  'use strict';

  /* restore personal theme across mockup pages (the "personal" red thread) */
  try {
    if (localStorage.getItem('wp7-theme') === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    }
    var acc = localStorage.getItem('wp7-accent');
    if (acc) document.documentElement.style.setProperty('--accent', acc);
  } catch (e) { /* file:// or private mode — ignore */ }

  /* status-bar clock */
  var clock = document.getElementById('clock');
  if (clock) {
    var tick = function () {
      var d = new Date(), p = function (n) { return String(n).padStart(2, '0'); };
      clock.textContent = p(d.getHours()) + ':' + p(d.getMinutes());
    };
    tick();
    setInterval(tick, 30000);
  }

  /* application-bar overflow menu */
  var more = document.querySelector('.ab-more');
  var menu = document.querySelector('.ab-menu');
  if (more && menu) {
    more.addEventListener('click', function (e) {
      e.stopPropagation();
      menu.classList.toggle('open');
    });
  }

  /* panorama parallax — bg slowest, title mid, content fastest (guide: layered rates).
     --px carries a px unit so calc() inside translateX produces a valid length. */
  var pano = document.querySelector('.pano');
  if (pano) {
    var update = function () { pano.style.setProperty('--px', pano.scrollLeft + 'px'); };
    update();
    pano.addEventListener('scroll', update, { passive: true });
  }

  /* ── WP7 motion (all skipped under prefers-reduced-motion) ── */
  var REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!REDUCED) {

    /* tilt on press — rotate the control toward the press point */
    var clearTilt = function () {
      document.querySelectorAll('.tilted').forEach(function (el) {
        el.classList.remove('tilted');
      });
    };
    document.addEventListener('pointerdown', function (e) {
      var t = e.target.closest('.tile,.ab-btn,.choice,.swatch');
      if (!t) return;
      var r = t.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5;
      var y = (e.clientY - r.top) / r.height - 0.5;
      t.style.setProperty('--tx', (-y * 7).toFixed(2) + 'deg');
      t.style.setProperty('--ty', (x * 7).toFixed(2) + 'deg');
      t.classList.add('tilted');
    });
    document.addEventListener('pointerup', clearTilt);
    document.addEventListener('pointercancel', clearTilt);

    /* app launch: tiles flip away leaving the tapped tile, then it launches */
    document.addEventListener('click', function (e) {
      var tile = e.target.closest('a.tile');
      if (!tile) return;
      e.preventDefault();
      var url = tile.getAttribute('href');
      document.body.classList.add('launching');
      tile.classList.add('launched');
      setTimeout(function () { location.href = url; }, 520);
    });

    /* turnstile exit for app-bar / menu navigation */
    document.addEventListener('click', function (e) {
      var link = e.target.closest('.appbar a, .ab-menu a');
      if (!link) return;
      e.preventDefault();
      var url = link.getAttribute('href');
      document.body.classList.add('turning-out');
      setTimeout(function () { location.href = url; }, 300);
    });

    /* pivot header slides at half the content rate (authentic pivot feel) */
    var pivot = document.querySelector('.pivot');
    if (pivot) {
      var phs = document.querySelectorAll('.pivhead .ph');
      var slideHeaders = function () {
        var w = pivot.clientWidth, x = pivot.scrollLeft;
        phs.forEach(function (ph, i) {
          ph.style.transform = 'translateX(' + ((x - i * w) * 0.5) + 'px)';
        });
      };
      pivot.addEventListener('scroll', slideHeaders, { passive: true });
      slideHeaders();
    }
  }
})();
