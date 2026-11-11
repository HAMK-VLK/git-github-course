/* Practice terminal: a floating Git Bash window opened from the button at the bottom right of every page.
 * Free practice outside the lessons: no tasks, not part of lesson progress.
 * State: commands + username in store.doc.widgets.cli (replayed like a lesson terminal);
 * look (theme, palette, opacity) in TDC.prefs 'cli', so it survives a progress reset. */
(function (TDC) {
  'use strict';
  var U = TDC.util, el = U.el, V = TDC.viz;
  var ID = 'cli';
  var USER_RE = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;   // GitHub username rules
  var PALS = ['gitbash', 'solarized', 'contrast', 'green'], MODES = ['course', 'dark', 'light'];
  // A terminal window: filled title bar, prompt chevron and cursor (like the Windows Terminal app icon)
  var ICON = '<svg viewBox="0 0 24 24" width="22" height="22" focusable="false"><g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
    '<rect x="2.5" y="3.5" width="19" height="17" rx="3"/><path d="M6.5 11.5l3 2.5-3 2.5M12 17h5"/></g>' +
    '<path fill="currentColor" d="M5.5 3.5h13a3 3 0 0 1 3 3v1.5h-19V6.5a3 3 0 0 1 3-3z"/></svg>';
  var MAX_LOG = 1900;   // a progress file with a longer log is refused on import (store.parseImport)
  var fab, win, body, S, term, panels = {}, panelBox, shownUser, warned;

  function state() { return (TDC.store.doc && TDC.store.doc.widgets[ID]) || {}; }
  function save(patch) { TDC.store.update(function (d) { d.widgets[ID] = Object.assign({}, d.widgets[ID], patch); }, { silent: true, source: 'widget' }); }
  function user() { var u = state().user; return typeof u === 'string' && USER_RE.test(u) ? u : null; }   // imported files are not trusted
  function look() {
    var l = TDC.prefs.get('cli', {});
    return { mode: MODES.indexOf(l.mode) >= 0 ? l.mode : 'course', pal: PALS.indexOf(l.pal) >= 0 ? l.pal : 'gitbash', op: U.clamp(+l.op || 100, 60, 100) };
  }

  function worldCfg(u) {
    var remotes = {};
    remotes[u + '/my-notes'] = { description: 'My study notes', commits: [
      { msg: 'Initial commit', author: u, files: { 'README.md': '# My notes\nNotes from my courses.\n' } },
      { msg: 'Add notes for week 1', author: u, files: { 'week1.md': '# Week 1\n- What version control is\n' } }] };
    remotes['hamk-projects/summer-project'] = { description: 'Summer project 2026', commits: [
      { msg: 'Initial commit', author: 'teacher', files: { 'README.md': '# Summer project\nShared work of the summer project team.\n' } },
      { msg: 'Add project plan', author: 'teacher', files: { 'plan.md': '# Plan\n1. Collect data\n2. Write the report\n' } }] };
    return { me: u, myName: u, signedIn: true, cwd: '~', remotes: remotes,
      orgs: { 'hamk-projects': { displayName: 'HAMK Projects', owners: ['teacher'], members: [u], settings: { basePermission: 'write' } } } };
  }

  function applyLook() {
    if (!win) return;
    var l = look();
    win.dataset.pal = l.pal;
    win.dataset.mode = l.mode === 'course' ? TDC.theme.get() : l.mode;
    win.style.setProperty('--cli-op', l.op + '%');
  }
  function setLook(k, v) { var l = look(); l[k] = v; TDC.prefs.set('cli', l); applyLook(); }

  function drawPanels() {
    if (!S) return;
    if (panels.areas) V.areasPanel(panels.areas, S.w);
    if (panels.graph) TDC.gitgraph.draw(panels.graph, S.w, S.w.repo());
  }

  /** Show the username form or the terminal, whichever the saved state calls for. */
  function mount() {
    body.innerHTML = ''; panelBox.innerHTML = ''; panels = {}; S = term = null;
    win.querySelectorAll('.cli-toggle').forEach(function (b) { b.setAttribute('aria-pressed', 'false'); b.disabled = !user(); });
    var u = shownUser = user();
    if (!u) return userForm();
    // The log is replayed from the start, so it cannot be trimmed: past the limit new commands simply stop being saved.
    var ctx = { getState: function () { return state(); }, setState: function (s) {
      if (s.log.length <= MAX_LOG) return save({ log: s.log.slice() });   // a copy: the session keeps pushing to its own array
      if (!warned) { warned = true; TDC.ui.toast(TDC.t('cli.full'), 'warn'); }
    } };
    S = V.session({ world: worldCfg(u) }, ctx, V.applyShell);
    term = V.terminalView({ S: S, title: 'Git Bash', intro: TDC.t('cli.intro', { u: u }), onChange: drawPanels });
    body.append(term.node, panelBox);
    S.boot(); term.boot();
  }

  function userForm() {
    var err = el('p', { class: 'cli-err', id: 'cli-user-err', role: 'alert' });
    var input = el('input', { class: 'input', id: 'cli-user', type: 'text', maxlength: '39', autocomplete: 'username', autocapitalize: 'off', spellcheck: 'false', 'aria-describedby': 'cli-user-help cli-user-err' });
    var form = el('form', { class: 'cli-user', onsubmit: function (e) {
      e.preventDefault();
      var v = input.value.trim();
      if (!USER_RE.test(v)) { err.textContent = TDC.t('cli.userBad'); input.setAttribute('aria-invalid', 'true'); input.focus(); return; }
      save({ user: v, log: [] }); warned = false; mount(); focusIn();
    } }, [
      el('label', { for: 'cli-user' }, TDC.t('cli.userLabel')), input,
      el('p', { class: 'cli-help', id: 'cli-user-help' }, TDC.t('cli.userHelp')), err,
      el('button', { class: 'btn btn-primary', type: 'submit' }, TDC.t('cli.start'))
    ]);
    body.appendChild(form);
  }

  function focusIn() { var f = win.querySelector('.term-input, #cli-user'); if (f) f.focus(); }

  function togglePanel(btn, id) {
    var on = btn.getAttribute('aria-pressed') !== 'true';
    btn.setAttribute('aria-pressed', String(on));
    if (on) {
      panels[id] = el('div', { class: 'panel-body' });
      panelBox.appendChild(el('section', { class: 'term-panel panel-' + id, dataset: { panel: id } }, [el('h3', { class: 'panel-title' }, TDC.t('panel.' + id)), panels[id]]));
    } else {
      delete panels[id];
      var s = panelBox.querySelector('[data-panel="' + id + '"]'); if (s) s.remove();
    }
    drawPanels();
    var sc = win.querySelector('.term-screen'); if (sc) sc.scrollTop = sc.scrollHeight;   // the screen got shorter: keep the prompt in view
  }

  function lookPopover(anchor) {
    var l = look();
    function select(key, opts, labelKey) {
      var id = 'cli-' + key;
      var s = el('select', { class: 'input', id: id, onchange: function () { setLook(key, s.value); } },
        opts.map(function (o) { return el('option', { value: o, selected: o === l[key] ? 'selected' : null }, TDC.t('cli.' + key + '.' + o)); }));
      return el('div', { class: 'cli-field' }, [el('label', { for: id }, TDC.t(labelKey)), s]);
    }
    var out = el('output', { for: 'cli-op' }, l.op + ' %');
    var range = el('input', { type: 'range', id: 'cli-op', min: '60', max: '100', step: '5', value: String(l.op),
      oninput: function () { out.textContent = range.value + ' %'; setLook('op', +range.value); } });
    TDC.ui.popover(anchor, el('div', { class: 'cli-look' }, [
      el('strong', {}, TDC.t('cli.lookTitle')),
      select('mode', MODES, 'cli.mode'), select('pal', PALS, 'cli.pal'),
      el('div', { class: 'cli-field' }, [el('label', { for: 'cli-op' }, TDC.t('cli.opacity')), el('div', { class: 'cli-range' }, [range, out])])
    ]));
  }

  // Drag by the title bar (not on phones, where the window is a bottom sheet).
  function dragBar(bar) {
    bar.addEventListener('pointerdown', function (e) {
      if (e.button !== 0 || e.target.closest('button') || matchMedia('(max-width: 600px)').matches) return;
      var r = win.getBoundingClientRect(), dx = e.clientX - r.left, dy = e.clientY - r.top;
      bar.setPointerCapture(e.pointerId);
      function move(ev) { place(ev.clientX - dx, ev.clientY - dy); }
      function up() { bar.removeEventListener('pointermove', move); bar.removeEventListener('pointerup', up); bar.removeEventListener('pointercancel', up); }
      bar.addEventListener('pointermove', move); bar.addEventListener('pointerup', up); bar.addEventListener('pointercancel', up);
    });
  }
  /** Keep the window inside the viewport (the title bar must stay reachable). */
  function place(x, y) {
    var vw = document.documentElement.clientWidth, vh = innerHeight;
    win.style.left = U.clamp(x, 0, Math.max(0, vw - win.offsetWidth)) + 'px';
    win.style.top = U.clamp(y, 0, Math.max(0, vh - 48)) + 'px';
  }

  function build() {
    var btn = function (cls, label, text, onclick, pressed) {
      return el('button', { class: 'cli-btn ' + cls, type: 'button', 'aria-label': label, title: label, 'aria-pressed': pressed, onclick: onclick }, text);
    };
    panelBox = el('div', { class: 'term-panels cli-panels' });
    body = el('div', { class: 'cli-body' });
    var bar = el('div', { class: 'cli-bar' }, [
      el('span', { class: 'term-icon', 'aria-hidden': 'true' }, '◆'),
      el('h2', { class: 'cli-title', id: 'cli-title' }, TDC.t('cli.title')),
      btn('cli-toggle', TDC.t('panel.graph'), TDC.t('cli.graph'), function () { togglePanel(this, 'graph'); }, 'false'),
      btn('cli-toggle', TDC.t('panel.areas'), TDC.t('cli.areas'), function () { togglePanel(this, 'areas'); }, 'false'),
      btn('', TDC.t('cli.lookTitle'), '⚙', function () { lookPopover(this); }),
      btn('', TDC.t('term.help'), '?', function () { if (term) term.help(); else focusIn(); }),
      el('button', { class: 'cli-btn cli-reset', type: 'button', title: TDC.t('cli.resetTitle'), onclick: resetAll },
        [el('span', { 'aria-hidden': 'true' }, '↺ '), el('span', { class: 'cli-btn-text' }, TDC.t('cli.reset'))]),
      btn('', TDC.t('cli.close'), '✕', function () { toggle(false); })
    ]);
    win = el('div', { class: 'cli', id: 'cli-win', role: 'dialog', 'aria-modal': 'false', 'aria-labelledby': 'cli-title', hidden: 'hidden' }, [bar, body]);
    // Esc closes the window, except inside the file editor (nano / code), which handles its own keys
    win.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !e.target.closest('.sim-editor, .gcm-dialog')) { e.preventDefault(); toggle(false); } });
    dragBar(bar);
    document.body.appendChild(win);
    applyLook(); mount();
  }

  /** Back to the very first state: no username, empty practice world, default look, window at its default place and size. */
  function resetAll() {
    TDC.ui.confirm(TDC.t('cli.resetTitle'), TDC.t('cli.resetBody'), TDC.t('cli.reset'), true).then(function (ok) {
      if (!ok) return;
      save({ user: null, log: [] }); TDC.prefs.set('cli', {}); warned = false;
      win.removeAttribute('style'); applyLook(); mount();
      place(document.documentElement.clientWidth - win.offsetWidth - 16, innerHeight - win.offsetHeight - 80);
      TDC.ui.toast(TDC.t('cli.resetDone'), 'ok'); focusIn();
    });
  }

  function toggle(open) {
    if (open && !TDC.store.doc) return;   // progress not loaded yet
    if (open && !win) build();
    if (!win) return;
    var wasOpen = !win.hidden;
    win.hidden = !open;
    fab.setAttribute('aria-expanded', String(open));
    if (open) {
      if (!wasOpen && !win.style.left) place(document.documentElement.clientWidth - win.offsetWidth - 16, innerHeight - win.offsetHeight - 80);
      if (S) drawPanels();
      focusIn();
    } else { TDC.ui.closePopover(); if (wasOpen) fab.focus(); }
  }

  function start() {
    fab = el('button', { class: 'cli-fab', type: 'button', 'aria-expanded': 'false', 'aria-controls': 'cli-win', 'aria-label': TDC.t('cli.open'), title: TDC.t('cli.open'),
      onclick: function () { toggle(!win || win.hidden); } },
      [el('span', { class: 'cli-fab-icon', 'aria-hidden': 'true', html: ICON }), el('span', { class: 'cli-fab-label' }, TDC.t('cli.fab'))]);
    document.body.appendChild(fab);
    TDC.on('themechange', function () { applyLook(); if (S && panels.graph) drawPanels(); });
    // "Reset all progress" or an imported progress file replaced the saved terminal: start from what is saved now
    // (a single lesson's reset leaves the terminal alone: only a full reset clears the saved user)
    TDC.on('notes:change', function (o) { if (win && (o.source === 'import' || o.source === 'reset' && user() !== shownUser)) { warned = false; mount(); } });
    addEventListener('resize', U.debounce(function () { if (win && !win.hidden && win.style.left) place(parseFloat(win.style.left), parseFloat(win.style.top)); }, 150));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
  TDC.cli = { toggle: toggle };
})(window.TDC);
