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
})();
