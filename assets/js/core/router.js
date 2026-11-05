/* Hash router (works on file://): #/ · #/topic/<lessonId>[/<sectionId>] */
(function (TDC) {
  'use strict';
  var el = TDC.util.el, I = TDC.i18n;
  var current = { name: null, topic: null };

  function parse() {
    var h = (location.hash || '#/').replace(/^#\/?/, '').split('/');
    if (h[0] === 'topic' && h[1]) return { name: 'topic', topic: h[1], section: h[2] || null };
    return { name: 'home' };
  }
  function meta(id) { return TDC.topicList.filter(function (m) { return m.id === id; })[0]; }
  function crumbs(r) {
    var c = document.getElementById('crumbs'); c.innerHTML = '';
    c.appendChild(el('a', { href: '#/', 'data-i18n': 'nav.home' }));
    var m = r.name === 'topic' && meta(r.topic);
    if (m) c.append(el('span', { class: 'sep', 'aria-hidden': 'true' }, '›'), el('span', { class: 'crumb-current' }, m.num + ' ' + I.tx(m.title)));
    I.applyStatic(c);
  }
  function render(keepScroll) {
    var r = parse(), main = document.getElementById('main');
    // Same lesson, different section: just scroll.
    if (!keepScroll && r.name === 'topic' && current.name === 'topic' && current.topic === r.topic) {
      current = r;
      var tgt = r.section && document.getElementById(r.section);
      if (tgt) tgt.scrollIntoView({ behavior: TDC.util.reducedMotion() ? 'auto' : 'smooth', block: 'start' });
      return false;
    }
    var y = window.scrollY;
    TDC.ui.closePopover();
    TDC.render.cleanup();
    main.innerHTML = '';
    main.className = 'view-' + r.name;
    current = r;
    if (r.name === 'topic') TDC.render.topic(main, r.topic, keepScroll ? null : r.section);
    else TDC.render.home(main);
    crumbs(r);
    if (keepScroll) window.scrollTo(0, y);
    else if (r.name !== 'topic') window.scrollTo(0, 0);
    var m = r.name === 'topic' && meta(r.topic);
    document.title = (m ? m.num + ' ' + I.tx(m.title) + ' · ' : '') + TDC.t('app.title');
    TDC.emit('routechange', r);
    return true;
  }
  TDC.router = {
    start: function () {
      var main = document.getElementById('main');
      // A new page replaced <main>: move focus there so keyboard and screen-reader users start at the new content
      window.addEventListener('hashchange', function () { if (render(false)) main.focus({ preventScroll: true }); });
      // The skip link must not change the hash: "#main" would be routed to the home page
      var skip = document.querySelector('.skip-link');
      if (skip) skip.addEventListener('click', function (e) { e.preventDefault(); main.focus(); });
      render(false);
    },
    refresh: function () { render(true); },
    current: function () { return current; }
  };
})(window.TDC);
