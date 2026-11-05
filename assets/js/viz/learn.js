/* Small teaching widgets (no Git world). Each accepts tasks: [{id, text, check(state), hint?, solution?}].
 *  timeline  {chaos: ['thesis_final.docx', …], versions: [{msg, author, when, text}]}            state {viewed: {index: true}, count}
 *  roles     {focus: 'write' (optional preselected role), owner: true (adds the org-owner column)}  state {picked: {role: true}}
 *  gitignore {files: ['src/app.py', 'secrets.env', …], start: '*.log\n'}                          state {text, ignored(path) -> bool, tracked: [paths]}
 *  markdown  {start: '# Title\n'}                                                                 state {text, html}
 * Role abilities follow GitHub's "Repository roles for an organization" table (docs/FACTS.md). */
(function (TDC) {
  'use strict';
  var U = TDC.util, el = U.el, V = TDC.viz, T = TDC.t;

  function withTasks(host, cfg, ctx, getState) {
    var box = V.tasks(cfg.tasks, ctx, getState);
    host.appendChild(box);
    return box;
  }

  // ---------- timeline ----------
  TDC.widgets.register('timeline', function (host, cfg, ctx) {
    var vs = cfg.versions || [], st = { viewed: {}, count: 0 }, cur = vs.length - 1;
    st.viewed[cur] = true; st.count = Object.keys(st.viewed).length;
    var tasks = withTasks(host, cfg, ctx, function () { return st; });
    var chaos = el('div', { class: 'tl-chaos' }, [el('h4', {}, '📁 ' + T('tl.without')), el('ul', {}, (cfg.chaos || []).map(function (f) { return el('li', {}, ['📄 ', f]); })),
      el('p', { class: 'muted small' }, T('tl.withoutNote'))]);
    var range = el('input', { type: 'range', min: 0, max: Math.max(0, vs.length - 1), value: cur, 'aria-label': T('tl.slider') });
    var meta = el('div', { class: 'tl-meta', 'aria-live': 'polite' }), doc = el('div', { class: 'diff tl-doc' });
    var dots = el('ol', { class: 'tl-dots' }, vs.map(function (v, i) {
      return el('li', {}, el('button', { class: 'tl-dot', 'aria-label': (i + 1) + ': ' + v.msg, title: v.msg, onclick: function () { show(i); } }, String(i + 1)));
    }));
    function show(i) {
      cur = i; range.value = i;
      st.viewed[i] = true; st.count = Object.keys(st.viewed).length;
      var v = vs[i];
      meta.innerHTML = '';
      meta.append(el('strong', {}, v.msg), el('span', { class: 'muted small' }, ' — ' + v.author + ', ' + v.when));
      doc.innerHTML = V.diffHtml(i ? vs[i - 1].text : '', v.text);
      range.setAttribute('aria-valuetext', (i + 1) + ': ' + v.msg);
      dots.querySelectorAll('.tl-dot').forEach(function (d, k) { d.classList.toggle('on', k === i); d.classList.toggle('seen', !!st.viewed[k]); if (k === i) d.setAttribute('aria-current', 'step'); else d.removeAttribute('aria-current'); });
      tasks.refresh();
    }
    range.addEventListener('input', function () { show(+range.value); });
    host.append(el('div', { class: 'tl' }, [chaos, el('div', { class: 'tl-git' }, [el('h4', {}, '🕘 ' + T('tl.with')), dots, range, meta, doc, el('p', { class: 'muted small' }, T('tl.withNote'))])]));
    show(cur);
    return {};
  });

  // ---------- roles ----------
  var ROLES = ['read', 'triage', 'write', 'maintain', 'admin'];
  // [ability, lowest role that has it]; 'owner' = organization owners only (unless the org allows members).
  var ABILITIES = [
    ['View the code and clone or download it', 'read'], ['Open issues and comment', 'read'], ['Open pull requests (from a fork or branch they can push)', 'read'],
    ['Apply labels, assign issues, close and reopen issues and PRs', 'triage'], ['Request reviews, mark duplicates', 'triage'],
    ['Push commits and create branches', 'write'], ['Merge pull requests', 'write'], ['Approvals count toward required reviews', 'write'], ['Edit the wiki, create releases', 'write'],
    ['Manage issue and PR settings, topics, description', 'maintain'],
    ['Add people and teams, change their roles', 'admin'], ['Create and edit rulesets (branch protection)', 'admin'], ['Archive the repository', 'admin'],
    ['Change visibility (private ↔ public)', 'owner'], ['Delete or transfer the repository', 'owner']
  ];
  TDC.widgets.register('roles', function (host, cfg, ctx) {
    var st = { picked: {} }, cur = cfg.focus || 'write';
    var tasks = withTasks(host, cfg, ctx, function () { return st; });
    var cols = ROLES.concat(cfg.owner === false ? [] : ['owner']);
    var bar = el('div', { class: 'tabs roles-bar', role: 'tablist', 'aria-label': T('roles.pick') });
    var table = el('div', { class: 'table-wrap', tabindex: '0' });
    var note = el('p', { class: 'roles-note', 'aria-live': 'polite' });
    cols.forEach(function (r) { bar.appendChild(el('button', { class: 'tab', role: 'tab', dataset: { r: r }, onclick: function () { pick(r); } }, T('roles.r.' + r))); });
    function has(role, need) { return role === 'owner' || (need !== 'owner' && ROLES.indexOf(role) >= ROLES.indexOf(need)); }
    function pick(r) {
      cur = r; st.picked[r] = true;
      bar.querySelectorAll('.tab').forEach(function (b) { b.setAttribute('aria-selected', String(b.dataset.r === r)); });
      table.innerHTML = '';
      table.appendChild(el('table', { class: 'blk-table compact roles-table' }, [
        el('thead', {}, el('tr', {}, [el('th', {}, T('roles.ability'))].concat(cols.map(function (c) { return el('th', { class: c === cur ? 'is-cur' : '' }, T('roles.r.' + c)); })))),
        el('tbody', {}, ABILITIES.map(function (a) {
          return el('tr', { class: has(cur, a[1]) ? 'can' : 'cannot' }, [el('td', {}, a[0])].concat(cols.map(function (c) {
            var ok = has(c, a[1]);
            return el('td', { class: 'rc ' + (ok ? 'yes' : 'no') + (c === cur ? ' is-cur' : ''), 'aria-label': ok ? T('roles.yes') : T('roles.no') }, ok ? '✓' : '—');
          })));
        }))
      ]));
      note.textContent = T('roles.note.' + r);
      tasks.refresh();
    }
    host.append(bar, note, table, el('p', { class: 'muted small' }, T('roles.footnote')));
    pick(cur);
    return {};
  });

  // ---------- gitignore ----------
  TDC.widgets.register('gitignore', function (host, cfg, ctx) {
    var saved = ctx.getState() || {};
    var ta = el('textarea', { class: 'input gi-ta', rows: 7, spellcheck: 'false', 'aria-label': '.gitignore' });
    ta.value = saved.text != null ? saved.text : (cfg.start || '');
    var st = {};
    var tasks = withTasks(host, cfg, ctx, function () { return st; });
    var list = el('ul', { class: 'gi-files', 'aria-live': 'polite' });
    function update() {
      var rules = TDC.git.ignoreRules(ta.value);
      st.text = ta.value; st.ignored = function (p) { return TDC.git.isIgnored(rules, p); };
      st.tracked = (cfg.files || []).filter(function (p) { return !st.ignored(p); });
      list.innerHTML = '';
      (cfg.files || []).forEach(function (p) {
        var ig = st.ignored(p);
        list.appendChild(el('li', { class: 'gi-file ' + (ig ? 'is-ign' : 'is-trk') }, [el('span', { class: 'gi-name' }, p), el('span', { class: 'gi-tag' }, ig ? T('gi.ignored') : T('gi.tracked'))]));
      });
      ctx.setState({ text: ta.value });
      tasks.refresh();
    }
    ta.addEventListener('input', U.debounce(update, 150));
    host.append(el('div', { class: 'gi' }, [el('label', { class: 'gi-edit' }, [el('strong', {}, '.gitignore'), ta, el('span', { class: 'muted small' }, T('gi.help'))]),
      el('div', {}, [el('strong', {}, T('gi.files')), list])]));
    update();
    return {};
  });

  // ---------- markdown ----------
  TDC.widgets.register('markdown', function (host, cfg, ctx) {
    var saved = ctx.getState() || {};
    var ta = el('textarea', { class: 'input md-ta', rows: 12, spellcheck: 'false', 'aria-label': 'README.md' });
    ta.value = saved.text != null ? saved.text : (cfg.start || '');
    var prev = el('div', { class: 'gh-md md-prev' }), st = {};
    var tasks = withTasks(host, cfg, ctx, function () { return st; });
    function update() { st.text = ta.value; st.html = V.md(ta.value); prev.innerHTML = st.html; ctx.setState({ text: ta.value }); tasks.refresh(); }
    ta.addEventListener('input', U.debounce(update, 200));
    host.append(el('div', { class: 'md-split' }, [el('div', {}, [el('strong', {}, '✎ README.md'), ta]), el('div', {}, [el('strong', {}, '👁 ' + T('md.preview')), prev])]));
    update();
    return {};
  });
})(window.TDC);
