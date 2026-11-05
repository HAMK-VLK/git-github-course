/* Study tools: "My progress" drawer (levels, bookmarks, reset), reference drawer (command cheat sheet,
 * glossary), help, bookmarks and glossary popovers. */
(function (TDC) {
  'use strict';
  var U = TDC.util, el = U.el, I = TDC.i18n;
  var S = function () { return TDC.store; };
  var Tools = TDC.tools = {};

  Tools.toggleBookmark = function (sectionId, btn) {
    S().update(function (d) {
      var i = d.bookmarks.indexOf(sectionId);
      if (i >= 0) d.bookmarks.splice(i, 1); else d.bookmarks.push(sectionId);
      if (btn) btn.setAttribute('aria-pressed', String(i < 0));
      TDC.ui.toast(TDC.t(i < 0 ? 'notes.bookmarked' : 'notes.unbookmarked'));
    });
  };
  function sectionInfo(secId) {
    for (var id in TDC.topics) {
      var s = TDC.topics[id].sections.find(function (x) { return x.id === secId; });
      var m = TDC.topicList.find(function (x) { return x.id === id; }) || {};
      if (s) return { topic: id, title: I.tx(s.title), num: m.num || '' };
    }
    return { topic: secId.split('-')[0], title: secId, num: '' };
  }

  // ---------- "My progress" drawer ----------
  Tools.openProgress = function () {
    TDC.ui.drawer('progress', TDC.t('progress.title'), function (c) {
      var d = S().doc;
      c.appendChild(el('section', { class: 'drawer-sec' }, [
        el('p', { class: 'muted small', 'data-i18n': 'progress.info' })
      ].concat((TDC.levels || []).map(function (lv) {
        var ls = TDC.topicList.filter(function (m) { return m.level === lv.id; });
        return el('div', { class: 'prog-level', style: { '--accent': lv.color } }, [
          el('h3', {}, lv.num + ' · ' + I.tx(lv.title)),
          el('ul', { class: 'link-list prog-list' }, ls.map(function (m) {
            var p = Math.round(TDC.render.topicProgress(m.id) * 100);
            return el('li', {}, el('a', { href: '#/topic/' + m.id, onclick: TDC.ui.closeDrawer }, [
              el('span', { class: 'pl-num' }, m.num), el('span', { class: 'pl-title' }, I.tx(m.title)),
              el('span', { class: 'progress pl-bar' }, el('span', { style: { width: p + '%' } })), el('span', { class: 'pl-pct' }, p + '%')
            ]));
          }))
        ]);
      }))));
      c.appendChild(el('section', { class: 'drawer-sec' }, [
        el('h3', { 'data-i18n': 'notes.bookmarks' }),
        d.bookmarks.length ? el('ul', { class: 'link-list' }, d.bookmarks.map(function (b) {
          var s = sectionInfo(b);
          return el('li', {}, el('a', { href: '#/topic/' + s.topic + '/' + b, onclick: TDC.ui.closeDrawer }, s.num + ' · ' + s.title));
        })) : el('p', { class: 'muted', 'data-i18n': 'notes.noBookmarks' })
      ]));
      var file = el('input', { type: 'file', accept: '.json,application/json', hidden: true, onchange: function () { importFile(file); } });
      c.appendChild(el('section', { class: 'drawer-sec' }, [
        el('h3', { 'data-i18n': 'data.heading' }),
        el('div', { class: 'muted small', html: TDC.t('data.privacy') }),
        el('div', { class: 'btn-row' }, [
          el('button', { class: 'btn btn-small', onclick: exportFile, 'data-i18n': 'data.export' }),
          el('button', { class: 'btn btn-small', onclick: function () { file.click(); }, 'data-i18n': 'data.import' }), file
        ])
      ]));
      c.appendChild(el('section', { class: 'drawer-sec' }, [
        el('h3', { 'data-i18n': 'reset.heading' }),
        el('p', { class: 'muted small', 'data-i18n': 'reset.info' }),
        el('button', { class: 'btn btn-small btn-danger-ghost', onclick: function () { Tools.confirmReset(); }, 'data-i18n': 'reset.all' })
      ]));
      I.applyStatic(c);
    });
  };

  // ---------- progress file (Export / Import): the only way progress moves between devices ----------
  function exportFile() {
    var a = el('a', { href: URL.createObjectURL(new Blob([S().exportText()], { type: 'application/json' })), download: 'git-course-progress-' + new Date().toISOString().slice(0, 10) + '.json' });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    TDC.ui.toast(TDC.t('data.exported'), 'ok');
  }
  function importFile(input) {
    var f = input.files && input.files[0]; input.value = '';
    if (!f) return;
    if (f.size > 2e6) { TDC.ui.toast(TDC.t('data.badFile'), 'warn', 6000); return; }   // do not read huge files into memory
    var rd = new FileReader();   // FileReader, not fetch: works from file:// too
    rd.onload = function () {
      var clean = S().parseImport(String(rd.result));
      if (!clean) { TDC.ui.toast(TDC.t('data.badFile'), 'warn', 6000); return; }
      TDC.ui.modal({ title: TDC.t('data.importTitle'), body: TDC.t('data.importBody'), actions: [
        { label: TDC.t('common.cancel') },
        { label: TDC.t('data.importConfirm'), primary: true, run: function () {
          S().importDoc(clean);
          if (S().saveNow() !== false) TDC.ui.toast(TDC.t('data.imported'), 'ok');   // saveNow warns itself when storage is full
          TDC.ui.closeDrawer(); TDC.router.refresh();
        } }
      ] });
    };
    rd.onerror = function () { TDC.ui.toast(TDC.t('data.badFile'), 'warn', 6000); };
    rd.readAsText(f);
  }

  Tools.openHelp = function () { TDC.ui.modal({ title: TDC.t('help.title'), body: TDC.t('help.body'), wide: true }); };

  // ---------- reference drawer ----------
  Tools.openTools = function (tab) {
    TDC.ui.drawer('tools', TDC.t('tools.title'), function (c) {
      var tabs = [['commands', 'tools.commands'], ['glossary', 'tools.glossary']];
      var panel = el('div', { class: 'tool-panel' });
      var bar = el('div', { class: 'tabs', role: 'tablist' }, tabs.map(function (t) {
        return el('button', { class: 'tab', role: 'tab', dataset: { tab: t[0] }, 'data-i18n': t[1], onclick: function () { show(t[0]); } });
      }));
      function show(id) {
        bar.querySelectorAll('.tab').forEach(function (b) { b.setAttribute('aria-selected', String(b.dataset.tab === id)); });
        panel.innerHTML = '';
        ({ commands: cheatSheet, glossary: glossary })[id](panel);
        I.applyStatic(panel);
      }
      c.append(bar, panel);
      I.applyStatic(c);
      show(tab || 'commands');
    });
  };

  /** Clear one lesson's progress (or everything) after confirmation. */
  Tools.confirmReset = function (topicId) {
    var title = topicId ? I.tx(TDC.topics[topicId].title) : '';
    TDC.ui.modal({
      title: TDC.t(topicId ? 'reset.topicTitle' : 'reset.allTitle', { topic: title }),
      body: TDC.t(topicId ? 'reset.topicBody' : 'reset.allBody', { topic: title }),
      actions: [
        { label: TDC.t('common.cancel') },
        { label: TDC.t('reset.confirm'), danger: true, run: function () {
          if (S().reset(topicId)) { TDC.ui.toast(TDC.t('reset.done'), 'ok'); TDC.ui.closeDrawer(); TDC.router.refresh(); }
        } }
      ]
    });
  };
  function searchBox() { return el('input', { class: 'input', type: 'search', 'data-i18n-ph': 'tools.search', 'aria-label': TDC.t('tools.search') }); }
  function cheatSheet(p) {
    var q = searchBox(), list = el('div', { class: 'cheat-sheet' });
    function draw() {
      var f = q.value.toLowerCase(); list.innerHTML = '';
      (TDC.COMMANDS || []).slice().sort(function (a, b) {
        var ia = TDC.topicList.findIndex(function (m) { return m.id === a.topic; }), ib = TDC.topicList.findIndex(function (m) { return m.id === b.topic; });
        return ia - ib;
      }).forEach(function (g) {
        var items = g.items.filter(function (it) { return !f || (it.cmd + ' ' + I.tx(it.does)).toLowerCase().indexOf(f) >= 0; });
        if (!items.length) return;
        list.appendChild(el('h4', {}, I.tx(g.title)));
        items.forEach(function (it) {
          list.appendChild(el('div', { class: 'cs-item' }, [el('code', {}, it.cmd), el('span', { class: 'cs-does', html: I.tx(it.does) })]));
        });
      });
    }
    q.addEventListener('input', draw); p.append(q, list); draw();
  }
  function glossary(p) {
    var q = searchBox(), list = el('dl', { class: 'glossary' });
    function draw() {
      var f = q.value.toLowerCase(); list.innerHTML = '';
      Object.keys(TDC.GLOSSARY || {}).sort(function (a, b) { return TDC.GLOSSARY[a].term.localeCompare(TDC.GLOSSARY[b].term); }).forEach(function (k) {
        var g = TDC.GLOSSARY[k];
        if (f && (g.term + ' ' + I.tx(g.def)).toLowerCase().indexOf(f) < 0) return;
        list.append(el('dt', {}, g.term), el('dd', { html: I.tx(g.def) }));
      });
    }
    q.addEventListener('input', draw); p.append(q, list); draw();
  }
  Tools.termPopover = function (anchor, key) {
    var g = (TDC.GLOSSARY || {})[key];
    if (!g) { console.warn('[TDC] glossary term missing', key); return; }
    TDC.ui.popover(anchor, el('div', { class: 'term-pop' }, [el('strong', {}, g.term), el('p', { html: I.tx(g.def) })]));
  };
})(window.TDC);
