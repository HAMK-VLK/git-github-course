/* 'gitgui' widget: GitHub Desktop or VS Code Source Control on the simulator engine.
 * config: {skin: 'desktop' | 'vscode', world, tasks, panels: ['areas'|'graph'|'remote'], folder: '~/thesis' (VS Code: open folder)}
 * Every button runs the matching git command (w.exec), so task checks are the same as for the terminal.
 * Learner edits: Desktop = "your text editor" pane under the app; VS Code = its editor (Ctrl+S / Save to save).
 * Saved entries (replayed on reload): {c: cmd} {e: path, t: text} {rm: path} {cd: dir} {pub: {slug, vis}} {s: 1} {ev: {...}} */
(function (TDC) {
  'use strict';
  var U = TDC.util, el = U.el, V = TDC.viz, T = TDC.t;
  var KIND = { new: ['+', 'A', 'U'], mod: ['•', 'M', 'M'], del: ['−', 'D', 'D'], conflict: ['!', 'C', '!'] };

  function apply(w, e) {
    if (e.c != null) return w.exec(e.c);
    if (e.e) w.writeFile(e.e, e.t);
    else if (e.rm) w.removeFile(e.rm);
    else if (e.s) w.signedIn = true;
    else if (e.cd) { w.mkdirp(e.cd); w.cwd = w.abs(e.cd); }
    else if (e.pub) { w.makeRemote(e.pub.slug, { commits: [], visibility: e.pub.vis, description: e.pub.desc || '' }); w.event({ type: 'publish', slug: e.pub.slug }); }
    if (e.ev) w.event(e.ev);
    return null;
  }
  function outText(res) { return res.out.map(function (l) { return typeof l === 'string' ? l : Array.isArray(l[0]) ? l.map(function (s) { return s[1]; }).join('') : l[1]; }).join('\n'); }
  function hasMarkers(t) { return /^(<<<<<<<|=======|>>>>>>>)/m.test(t || ''); }
  function syncState(w, r) {
    var b = r && r.HEAD.branch;
    if (!r || !Object.keys(r.remotes).length) return { kind: 'publishRepo' };
    if (!b) return { kind: 'none' };
    var up = r.upstream[b], them = up && r.remoteRefs[up], me = r.heads[b];
    if (!up) return { kind: 'publishBranch' };
    var A = {}, B = {};
    w.walk([me]).forEach(function (c) { A[c.sha] = 1; });
    if (them) w.walk([them]).forEach(function (c) { B[c.sha] = 1; });
    return { kind: 'sync', ahead: Object.keys(A).filter(function (s) { return !B[s]; }).length, behind: Object.keys(B).filter(function (s) { return !A[s]; }).length };
  }

  TDC.widgets.register('gitgui', function (host, cfg, ctx) {
    var skin = cfg.skin === 'vscode' ? 'vscode' : 'desktop';
    var S = V.session(cfg, ctx, apply), w;
    var ui = { tab: 'changes', sel: null, checked: {}, open: null, buf: null, dirty: false, side: 'scm', msg: '', desc: '', histSel: null };
    var app = el('div', { class: 'gui gui-' + skin });
    var below = el('div', { class: 'gui-below' });
    var overlay = el('div', { class: 'gui-overlay' });
    var panels = {}, panelBox = el('div', { class: 'term-panels' });
    (cfg.panels || []).forEach(function (p) { var b = el('div', { class: 'panel-body' }); panels[p] = b; panelBox.appendChild(el('section', { class: 'term-panel' }, [el('h3', { class: 'panel-title' }, T('panel.' + p)), b])); });
    var tasks = V.tasks(cfg.tasks, ctx, function () { return w; });
    var resetBtn = el('button', { class: 'btn btn-small btn-ghost', onclick: function () {
      TDC.ui.confirm(T('sim.resetTitle'), T('sim.resetBody'), T('sim.reset')).then(function (ok) { if (ok) { w = S.reset(); ui.open = null; ui.checked = {}; render(); } });
    } }, '↺ ' + T('sim.reset'));
    host.classList.add('sim-gui');
    host.append(tasks, el('div', { class: 'gui-stage' }, [app, overlay]), below, el('div', { class: 'sim-actions' }, [resetBtn]), panelBox);

    function repo() { return w.repo(); }
    function run(cmd, quiet) {
      var res = S.act({ c: cmd });
      if (res && res.prompt === 'gcm') { signIn(cmd); return res; }
      if (res && res.code && !quiet) V.dialog(overlay, T('gui.error'), el('pre', { class: 'gui-err' }, outText(res)));
      return res;
    }
    function signIn(retry) {
      V.dialog(overlay, T('gui.signInTitle'), el('p', {}, T('gui.signInBody')), [
        { label: T('common.cancel') },
        { label: T('gcm.browser'), primary: true, run: function () { S.act({ s: 1 }); run(retry); render(); } }
      ]);
    }
    function save(path, text) { S.act({ e: path, t: text }); }
    function after() { render(); }

    // ---------- shared pieces ----------
    function fileList(r) { return Object.keys(w.workTree(r)).sort(); }
    function diffFor(r, c) {
      var head = w.headTree(r), work = w.workTree(r);
      return V.diffHtml(c.kind === 'new' ? '' : head[c.p] != null ? head[c.p] : r.index[c.p], c.kind === 'del' ? '' : work[c.p]);
    }
    function branchMenu(anchor, r, vs) {
      var list = el('div', { class: 'gui-menu' });
      var name = el('input', { class: 'input gui-input', placeholder: T('gui.newBranchPh'), 'aria-label': T('gui.newBranch') });
      function create() {
        var n = name.value.trim().replace(/\s+/g, '-'); if (!n) return;
        TDC.ui.closePopover(); run('git switch -c ' + n); after();
      }
      name.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); create(); } });
      list.append(el('div', { class: 'gui-menu-row' }, [name, el('button', { class: 'btn btn-small btn-primary', onclick: create }, vs ? T('gui.create') : T('gui.newBranch'))]));
      list.append(el('div', { class: 'gui-menu-h' }, T('gui.branches')));
      Object.keys(r.heads).sort().forEach(function (b) {
        list.append(el('button', { class: 'gui-menu-item' + (b === r.HEAD.branch ? ' on' : ''), onclick: function () { TDC.ui.closePopover(); if (b !== r.HEAD.branch) { run('git switch ' + b); after(); } } }, [b === r.HEAD.branch ? '✓ ' : '⑂ ', b]));
      });
      var remoteOnly = Object.keys(r.remoteRefs).map(function (k) { return k.replace(/^origin\//, ''); }).filter(function (b) { return !r.heads[b]; });
      remoteOnly.forEach(function (b) { list.append(el('button', { class: 'gui-menu-item', onclick: function () { TDC.ui.closePopover(); run('git switch ' + b); after(); } }, ['☁ origin/', b])); });
      if (!vs && r.HEAD.branch) {
        var others = Object.keys(r.heads).filter(function (b) { return b !== r.HEAD.branch; });
        if (others.length) {
          list.append(el('div', { class: 'gui-menu-h' }, T('gui.mergeInto', { b: r.HEAD.branch })));
          others.forEach(function (b) { list.append(el('button', { class: 'gui-menu-item', onclick: function () { TDC.ui.closePopover(); run('git merge ' + b, true); after(); } }, ['⤵ ', b])); });
        }
      }
      TDC.ui.popover(anchor, list);
    }
    function commitCmd(msg, desc) { return 'git commit -m ' + V.q(desc ? msg + '\n\n' + desc : msg); }
    function syncAction(r) {
      var s = syncState(w, r);
      if (s.kind === 'publishRepo') return publishDialog(r);
      if (s.kind === 'publishBranch') { run('git push -u origin ' + r.HEAD.branch); return after(); }
      if (s.behind) run('git pull'); else if (s.ahead) run('git push'); else run('git fetch');
      after();
    }
    function publishDialog(r) {
      var name = el('input', { class: 'input', value: r.dir.split('/').pop(), 'aria-label': T('gui.repoName') });
      var orgs = Object.keys(w.server.orgs).filter(function (o) { var g = w.server.orgs[o]; return g.owners.indexOf(w.me) >= 0 || (g.members.indexOf(w.me) >= 0 && g.settings.membersCanCreate); });
      var owner = el('select', { class: 'input', 'aria-label': T('gui.owner') }, [el('option', { value: w.me }, w.me + ' ' + T('gui.personal'))].concat(orgs.map(function (o) { return el('option', { value: o }, o); })));
      var priv = el('input', { type: 'checkbox', checked: true });
      V.dialog(overlay, T('gui.publishRepo'), el('div', { class: 'gui-form' }, [
        el('label', { class: 'field' }, [el('span', {}, T('gui.repoName')), name]),
        el('label', { class: 'field' }, [el('span', {}, T('gui.owner')), owner]),
        el('label', { class: 'gui-check' }, [priv, ' ', T('gui.keepPrivate')])
      ]), [{ label: T('common.cancel') }, { label: T('gui.publishRepo'), primary: true, run: function () {
        var slug = owner.value + '/' + name.value.trim().replace(/\s+/g, '-');
        if (w.server.repos[slug]) { TDC.ui.toast(T('gui.exists'), 'warn'); return false; }
        S.act({ pub: { slug: slug, vis: priv.checked ? 'private' : 'public' } });
        run('git remote add origin ' + w.urlOf(slug)); run('git push -u origin ' + (r.HEAD.branch || 'main')); after();
      } }]);
    }
    function cloneDialog(vs) {
      var list = Object.keys(w.server.repos).filter(function (s) { return w.can(w.me, s, 'view') === true; });
      var url = el('input', { class: 'input', placeholder: 'https://github.com/owner/repo.git', 'aria-label': 'URL' });
      var picked = null;
      var items = el('div', { class: 'gui-clone-list' }, list.map(function (s) {
        var b = el('button', { class: 'gui-menu-item', onclick: function () { picked = s; url.value = w.urlOf(s); items.querySelectorAll('.on').forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); } }, ['▣ ', s]);
        return b;
      }));
      V.dialog(overlay, vs ? T('gui.cloneVs') : T('gui.cloneTitle'), el('div', { class: 'gui-form' }, [el('p', { class: 'muted small' }, T('gui.cloneHint')), items, el('label', { class: 'field' }, [el('span', {}, T('gui.urlLabel')), url])]),
        [{ label: T('common.cancel') }, { label: T('gui.clone'), primary: true, run: function () {
          var u = url.value.trim(); if (!u) return false;
          var slug = w.slugFromUrl(u), dir = '~/' + (slug ? slug.split('/')[1] : 'repo');
          S.act({ cd: '~' }); var res = run('git clone ' + u + ' ' + dir);
          if (res && !res.code && !res.prompt) { S.act({ cd: dir }); ui.open = null; }
          after();
        } }]);
    }
    function newRepoDialog() {
      var name = el('input', { class: 'input', value: 'my-project', 'aria-label': T('gui.repoName') });
      var readme = el('input', { type: 'checkbox', checked: true });
      V.dialog(overlay, T('gui.newRepo'), el('div', { class: 'gui-form' }, [
        el('label', { class: 'field' }, [el('span', {}, T('gui.repoName')), name]),
        el('p', { class: 'muted small' }, T('gui.localPath') + ' ~/' + 'Documents/GitHub'),
        el('label', { class: 'gui-check' }, [readme, ' ', T('gui.initReadme')])
      ]), [{ label: T('common.cancel') }, { label: T('gui.createRepo'), primary: true, run: function () {
        var n = name.value.trim().replace(/\s+/g, '-'); if (!n) return false;
        var d = '~/Documents/GitHub/' + n;
        S.act({ cd: d }); run('git init -b main');
        if (readme.checked) { save(w.abs(d) + '/README.md', '# ' + n + '\n'); run('git add README.md'); run('git commit -m "Initial commit"'); }
        after();
      } }]);
    }

    // ---------- GitHub Desktop ----------
    function renderDesktop(r) {
      app.innerHTML = '';
      var bar = el('div', { class: 'gd-menubar', 'aria-hidden': 'true' }, ['File', 'Edit', 'View', 'Repository', 'Branch', 'Help'].map(function (m) { return el('span', {}, m); }));
      if (!r) {
        app.append(bar, el('div', { class: 'gd-welcome' }, [
          el('h3', {}, T('gui.letsStart')),
          el('button', { class: 'gd-big', onclick: newRepoDialog }, ['➕ ', T('gui.newRepoLocal')]),
          el('button', { class: 'gd-big', onclick: function () { cloneDialog(false); } }, ['⬇ ', T('gui.cloneFromInternet')]),
          el('button', { class: 'gd-big', onclick: function () { TDC.ui.toast(T('gui.addExistingHint')); } }, ['📁 ', T('gui.addExisting')])
        ]));
        return;
      }
      var repos = Object.keys(w.repos);
      var repoBtn = el('button', { class: 'gd-tb', onclick: function (e) {
        TDC.ui.popover(e.currentTarget, el('div', { class: 'gui-menu' }, repos.map(function (d) {
          return el('button', { class: 'gui-menu-item' + (w.repos[d] === r ? ' on' : ''), onclick: function () { TDC.ui.closePopover(); S.act({ cd: d }); ui.open = null; after(); } }, ['▣ ', d.split('/').pop()]);
        }).concat([el('button', { class: 'gui-menu-item', onclick: function () { TDC.ui.closePopover(); cloneDialog(false); } }, '⬇ ' + T('gui.cloneTitle')), el('button', { class: 'gui-menu-item', onclick: function () { TDC.ui.closePopover(); newRepoDialog(); } }, '➕ ' + T('gui.newRepo'))])));
      } }, [el('small', {}, T('gui.currentRepo')), el('b', {}, r.dir.split('/').pop() + ' ▾')]);
      var brBtn = el('button', { class: 'gd-tb', onclick: function (e) { branchMenu(e.currentTarget, r, false); } }, [el('small', {}, T('gui.currentBranch')), el('b', {}, '⑂ ' + (r.HEAD.branch || 'detached') + ' ▾')]);
      var s = syncState(w, r);
      var syncLabel = s.kind === 'publishRepo' ? ['☁', T('gui.publishRepo'), T('gui.publishRepoSub')] : s.kind === 'publishBranch' ? ['☁', T('gui.publishBranch'), T('gui.publishBranchSub')]
        : s.behind ? ['↓', T('gui.pull') + ' ' + s.behind, T('gui.pullSub')] : s.ahead ? ['↑', T('gui.push') + ' ' + s.ahead, T('gui.pushSub')] : ['↻', T('gui.fetch'), T('gui.fetchSub')];
      var syncBtn = el('button', { class: 'gd-tb gd-sync', onclick: function () { syncAction(r); } }, [el('small', {}, syncLabel[2]), el('b', {}, syncLabel[0] + ' ' + syncLabel[1])]);
      var changes = V.changes(w, r);
      changes.forEach(function (c) { if (ui.checked[c.p] == null) ui.checked[c.p] = true; });
      var conflicts = changes.filter(function (c) { return c.kind === 'conflict'; });
      var tabs = el('div', { class: 'gd-tabs', role: 'tablist' }, [['changes', T('gui.changes') + (changes.length ? ' ' + changes.length : '')], ['history', T('gui.history')]].map(function (t) {
        return el('button', { role: 'tab', class: 'gd-tab', 'aria-selected': String(ui.tab === t[0]), onclick: function () { ui.tab = t[0]; after(); } }, t[1]);
      }));
      var side = el('div', { class: 'gd-side' }, [tabs]), main = el('div', { class: 'gd-diff' });
      if (ui.tab === 'changes') {
        if (r.merge) {
          var allOk = conflicts.every(function (c) { return !hasMarkers(w.readFile(r.dir + '/' + c.p)); });
          side.append(el('div', { class: 'gd-conflict' }, [el('strong', {}, T('gui.resolveTitle')), el('p', { class: 'small' }, allOk ? T('gui.noConflictsLeft') : T('gui.conflictsLeft', { n: conflicts.length })),
            el('button', { class: 'btn btn-small btn-primary', disabled: allOk ? null : true, onclick: function () {
              conflicts.forEach(function (c) { run('git add ' + V.q(c.p)); }); run('git commit -m ' + V.q(r.merge ? r.merge.msg : 'Merge')); after();
            } }, T('gui.continueMerge')),
            el('button', { class: 'btn btn-small btn-ghost', onclick: function () { run('git merge --abort'); after(); } }, T('gui.abortMerge'))]));
        }
        var all = el('input', { type: 'checkbox', checked: changes.length > 0 && changes.every(function (c) { return ui.checked[c.p]; }), 'aria-label': T('gui.selectAll'), onchange: function () { changes.forEach(function (c) { ui.checked[c.p] = all.checked; }); after(); } });
        side.append(el('div', { class: 'gd-list-head' }, [all, ' ', T('gui.changedFiles', { n: changes.length })]));
        side.append(el('ul', { class: 'gd-list' }, changes.map(function (c) {
          var cb = el('input', { type: 'checkbox', checked: !!ui.checked[c.p], 'aria-label': c.p, onchange: function () { ui.checked[c.p] = cb.checked; after(); } });
          return el('li', { class: 'gd-file' + (ui.sel === c.p ? ' on' : ''), onclick: function (e) { if (e.target !== cb) { ui.sel = c.p; after(); } } }, [cb, el('span', { class: 'gd-name' }, c.p), el('span', { class: 'gd-kind k-' + c.kind, title: c.kind }, KIND[c.kind][0])]);
        })));
        var sum = el('input', { class: 'input gd-summary', placeholder: T('gui.summaryPh'), value: ui.msg, 'aria-label': T('gui.summary'), oninput: function () { ui.msg = sum.value; commitBtn.disabled = !canCommit(); } });
        var desc = el('textarea', { class: 'input gd-desc', placeholder: T('gui.descPh'), rows: 2, 'aria-label': T('gui.description'), oninput: function () { ui.desc = desc.value; } });
        desc.value = ui.desc;
        var picked = changes.filter(function (c) { return ui.checked[c.p] && c.kind !== 'conflict'; });
        var canCommit = function () { return !r.merge && ui.msg.trim() && picked.length; };
        var commitBtn = el('button', { class: 'btn btn-primary gd-commit', disabled: canCommit() ? null : true, onclick: function () {
          // Desktop commits exactly the ticked files.
          if (Object.keys(r.index).length || w.headSha(r)) run('git restore --staged .', true);
          picked.forEach(function (c) { run('git add ' + V.q(c.p), true); });
          var res = run(commitCmd(ui.msg.trim(), ui.desc.trim()));
          if (res && !res.code) { S.act({ ev: { type: 'commit', via: 'desktop', branch: r.HEAD.branch } }); ui.msg = ''; ui.desc = ''; ui.checked = {}; }
          after();
        } }, T('gui.commitTo', { b: r.HEAD.branch || 'HEAD' }));
        side.append(el('div', { class: 'gd-commitbox' }, [sum, desc, commitBtn]));
        var selC = changes.filter(function (c) { return c.p === ui.sel; })[0];
        if (selC) main.append(el('div', { class: 'gd-diff-head' }, selC.p), el('div', { class: 'diff', html: diffFor(r, selC) }));
        else main.append(el('div', { class: 'gd-empty' }, [el('h4', {}, changes.length ? T('gui.pickFile') : T('gui.noLocalChanges')), el('p', { class: 'muted small' }, changes.length ? '' : T('gui.noLocalChangesSub'))]));
      } else {
        var cs = w.commitsOn(r).slice(0, 30);
        side.append(el('ul', { class: 'gd-list gd-hist' }, cs.map(function (c) {
          return el('li', { class: 'gd-file' + (ui.histSel === c.sha ? ' on' : ''), onclick: function () { ui.histSel = c.sha; after(); } }, [el('span', { class: 'gd-name' }, [el('b', {}, c.msg.split('\n')[0]), el('small', { class: 'muted' }, c.author + ' · ' + w.short(c.sha))])]);
        })));
        var hc = w.commit(ui.histSel) || cs[0];
        if (hc) {
          var pt = w.commit(hc.parents[0]) ? w.commit(hc.parents[0]).tree : {};
          main.append(el('div', { class: 'gd-diff-head' }, hc.msg.split('\n')[0]));
          Object.keys(Object.assign({}, pt, hc.tree)).sort().forEach(function (p) {
            if (pt[p] !== hc.tree[p]) main.append(el('div', { class: 'gd-diff-file' }, p), el('div', { class: 'diff', html: V.diffHtml(pt[p], hc.tree[p]) }));
          });
        }
      }
      app.append(bar, el('div', { class: 'gd-toolbar' }, [repoBtn, brBtn, syncBtn]), el('div', { class: 'gd-body' }, [side, main]));
    }

    // "Your text editor" pane for Desktop (the files on disk)
    function renderEditorPane(r) {
      below.innerHTML = '';
      if (skin !== 'desktop' || !r) return;
      var files = fileList(r);
      if (ui.open && files.indexOf(ui.open) < 0 && ui.buf == null) ui.open = null;
      var ta = el('textarea', { class: 'sim-editor-ta ep-ta', spellcheck: 'false', 'aria-label': T('gui.editorLabel'), disabled: ui.open ? null : true });
      ta.value = ui.open ? (ui.buf != null ? ui.buf : w.readFile(r.dir + '/' + ui.open) || '') : '';
      var saveBtn = el('button', { class: 'btn btn-small btn-primary', disabled: ui.open && ui.dirty ? null : true, onclick: doSave }, T('gui.save'));
      function doSave() { if (!ui.open) return; var t = ta.value; if (t && !/\n$/.test(t)) t += '\n'; save(r.dir + '/' + ui.open, t); ui.buf = null; ui.dirty = false; after(); }
      ta.addEventListener('input', function () { ui.buf = ta.value; ui.dirty = true; saveBtn.disabled = false; });
      ta.addEventListener('keydown', function (e) { if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); doSave(); } });
      var nf = el('input', { class: 'input gui-input', placeholder: T('gui.newFilePh'), 'aria-label': T('gui.newFile') });
      function addFile() { var n = nf.value.trim(); if (!n) return; save(r.dir + '/' + n, ''); ui.open = n; ui.buf = null; ui.dirty = false; after(); }
      nf.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); addFile(); } });
      below.append(el('div', { class: 'ep' }, [
        el('div', { class: 'ep-head' }, [el('strong', {}, '📝 ' + T('gui.editorPane')), el('span', { class: 'muted small' }, T('gui.editorPaneSub', { dir: w.pretty(r.dir) }))]),
        el('div', { class: 'ep-body' }, [
          el('div', { class: 'ep-files' }, [el('ul', {}, files.map(function (f) {
            return el('li', {}, el('button', { class: 'ep-file' + (ui.open === f ? ' on' : ''), onclick: function () { ui.open = f; ui.buf = null; ui.dirty = false; after(); } }, f));
          })), el('div', { class: 'ep-new' }, [nf, el('button', { class: 'btn btn-small', onclick: addFile }, '+')]),
            ui.open ? el('button', { class: 'btn btn-small btn-danger-ghost', onclick: function () { S.act({ rm: r.dir + '/' + ui.open }); ui.open = null; after(); } }, T('gui.deleteFile')) : null]),
          el('div', { class: 'ep-edit' }, [el('div', { class: 'ep-edit-head' }, [el('span', {}, ui.open ? ui.open + (ui.dirty ? ' ●' : '') : T('gui.pickToEdit')), saveBtn]), ta])
        ])
      ]));
    }

    // ---------- VS Code ----------
    function renderVsCode(r) {
      app.innerHTML = '';
      var folder = r ? r.dir : w.cwd;
      var changes = r ? V.changes(w, r) : [];
      var staged = changes.filter(function (c) { return c.staged && !c.unstaged || (c.staged && c.kind !== 'conflict'); }).filter(function (c) { return c.staged; });
      var unstaged = changes.filter(function (c) { return c.unstaged && c.kind !== 'conflict'; });
      var conflicts = changes.filter(function (c) { return c.kind === 'conflict'; });
      var act = el('div', { class: 'vs-act' }, [['explorer', '🗎', T('gui.vsExplorer')], ['scm', '⑂', T('gui.vsScm')]].map(function (a) {
        return el('button', { class: 'vs-act-btn' + (ui.side === a[0] ? ' on' : ''), title: a[2], 'aria-label': a[2], onclick: function () { ui.side = a[0]; after(); } },
          [a[1], a[0] === 'scm' && changes.length ? el('span', { class: 'vs-badge' }, String(changes.length)) : null]);
      }));
      var side = el('div', { class: 'vs-side' });
      if (ui.side === 'explorer') {
        var nf = el('input', { class: 'input gui-input', placeholder: T('gui.newFilePh'), 'aria-label': T('gui.newFile') });
        nf.addEventListener('keydown', function (e) { if (e.key === 'Enter' && nf.value.trim()) { e.preventDefault(); save(folder + '/' + nf.value.trim(), ''); ui.open = nf.value.trim(); ui.buf = null; after(); } });
        var files = Object.keys(w.fs).filter(function (p) { return p.indexOf(folder + '/') === 0; }).map(function (p) { return p.slice(folder.length + 1); }).sort();
        var ch = {}; changes.forEach(function (c) { ch[c.p] = c; });
        side.append(el('div', { class: 'vs-side-h' }, T('gui.vsExplorer').toUpperCase()), el('div', { class: 'vs-folder' }, '⌄ ' + folder.split('/').pop().toUpperCase()),
          el('ul', { class: 'vs-files' }, files.map(function (f) {
            var c = ch[f];
            return el('li', {}, el('button', { class: 'vs-file' + (ui.open === f ? ' on' : '') + (c ? ' vk-' + c.kind : ''), onclick: function () { ui.open = f; ui.buf = null; ui.dirty = false; after(); } }, [f, c ? el('span', { class: 'vs-letter' }, KIND[c.kind][2]) : null]));
          })), nf);
      } else if (!r) {
        side.append(el('div', { class: 'vs-side-h' }, T('gui.vsScm').toUpperCase()), el('p', { class: 'small' }, T('gui.vsNoRepo')),
          el('button', { class: 'btn btn-small btn-primary vs-wide', onclick: function () { run('git init'); after(); } }, T('gui.vsInit')),
          el('button', { class: 'btn btn-small vs-wide', onclick: function () { cloneDialog(true); } }, T('gui.cloneVs')));
      } else {
        var msg = el('textarea', { class: 'input vs-msg', rows: 2, placeholder: T('gui.vsMsgPh', { b: r.HEAD.branch || 'HEAD' }), 'aria-label': T('gui.summary') });
        msg.value = ui.msg || (r.merge ? r.merge.msg : '');   // VS Code prefills the merge message
        msg.addEventListener('input', function () { ui.msg = msg.value; });
        msg.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.ctrlKey) { e.preventDefault(); commit(); } });
        var s = syncState(w, r);
        function commit() {
          if (r.merge && conflicts.length) { TDC.ui.toast(T('gui.vsResolveFirst'), 'warn'); return; }
          if (!ui.msg.trim() && !r.merge) { TDC.ui.toast(T('gui.vsNeedMsg'), 'warn'); msg.focus(); return; }
          function doIt() {
            var res = run(commitCmd(ui.msg.trim() || (r.merge && r.merge.msg) || 'Update'));
            if (res && !res.code) { S.act({ ev: { type: 'commit', via: 'vscode', branch: r.HEAD.branch } }); ui.msg = ''; }
            after();
          }
          if (!staged.length && !r.merge) {
            V.dialog(overlay, 'Visual Studio Code', el('p', {}, T('gui.vsNoStaged')), [{ label: T('gui.no') }, { label: T('gui.yes'), primary: true, run: function () { run('git add -A', true); doIt(); } }]);
          } else doIt();
        }
        var nothing = !changes.length && !r.merge;
        var big = nothing && s.kind === 'publishBranch' ? el('button', { class: 'btn btn-primary vs-wide', onclick: function () { run('git push -u origin ' + r.HEAD.branch); after(); } }, '☁ ' + T('gui.vsPublishBranch'))
          : nothing && s.kind === 'publishRepo' && w.commitsOn(r).length ? el('button', { class: 'btn btn-primary vs-wide', onclick: function () { publishDialog(r); } }, '☁ ' + T('gui.vsPublishGitHub'))
          : nothing && s.kind === 'sync' && (s.ahead || s.behind) ? el('button', { class: 'btn btn-primary vs-wide', onclick: vsSync }, '↻ ' + T('gui.vsSync') + ' ' + (s.behind ? s.behind + '↓ ' : '') + (s.ahead ? s.ahead + '↑' : ''))
          : el('button', { class: 'btn btn-primary vs-wide', onclick: commit }, '✓ ' + T('gui.vsCommit'));
        function group(title, list, kind) {
          if (!list.length) return null;
          return el('div', { class: 'vs-group' }, [el('div', { class: 'vs-group-h' }, [title, el('span', { class: 'vs-count' }, String(list.length)),
            kind === 'unstaged' ? el('button', { class: 'vs-icon', title: T('gui.vsStageAll'), 'aria-label': T('gui.vsStageAll'), onclick: function () { run('git add -A', true); after(); } }, '+') : null,
            kind === 'staged' ? el('button', { class: 'vs-icon', title: T('gui.vsUnstageAll'), 'aria-label': T('gui.vsUnstageAll'), onclick: function () { run('git restore --staged .', true); after(); } }, '−') : null]),
            el('ul', { class: 'vs-files' }, list.map(function (c) {
              return el('li', { class: 'vs-change' }, [
                el('button', { class: 'vs-file vk-' + c.kind, onclick: function () { ui.open = c.p; ui.buf = null; ui.dirty = false; ui.diff = kind !== 'merge'; after(); } }, [c.p, el('span', { class: 'vs-letter' }, kind === 'staged' ? KIND[c.kind][1] : KIND[c.kind][2])]),
                kind === 'unstaged' && !c.untracked ? el('button', { class: 'vs-icon', title: T('gui.vsDiscard'), 'aria-label': T('gui.vsDiscard') + ' ' + c.p, onclick: function () { run('git restore ' + V.q(c.p)); after(); } }, '↶') : null,
                kind === 'staged' ? el('button', { class: 'vs-icon', title: T('gui.vsUnstage'), 'aria-label': T('gui.vsUnstage') + ' ' + c.p, onclick: function () { run('git restore --staged ' + V.q(c.p)); after(); } }, '−')
                  : el('button', { class: 'vs-icon', title: T('gui.vsStage'), 'aria-label': T('gui.vsStage') + ' ' + c.p, onclick: function () {
                    if (c.kind === 'conflict' && hasMarkers(w.readFile(r.dir + '/' + c.p))) { TDC.ui.toast(T('gui.vsStillMarkers'), 'warn'); return; }
                    run('git add ' + V.q(c.p)); after();
                  } }, '+')
              ]);
            }))]);
        }
        U.append(side, [el('div', { class: 'vs-side-h' }, T('gui.vsScm').toUpperCase()), msg, big,
          group(T('gui.vsMerge'), conflicts, 'merge'), group(T('gui.vsStaged'), staged, 'staged'), group(T('gui.vsChanges'), unstaged, 'unstaged')]);
      }
      function vsSync() { var st = syncState(w, r); if (st.behind) run('git pull'); if (syncState(w, r).ahead) run('git push'); after(); }
      // editor
      var ed = el('div', { class: 'vs-editor' });
      if (ui.open && r !== undefined) {
        var path = folder + '/' + ui.open, text = ui.buf != null ? ui.buf : (w.readFile(path) || '');
        var ta = el('textarea', { class: 'sim-editor-ta vs-ta', spellcheck: 'false', 'aria-label': ui.open });
        ta.value = text;
        var tab = el('div', { class: 'vs-tabs' }, [el('span', { class: 'vs-tab' }, [ui.open, ui.dirty ? el('b', { class: 'vs-dot' }, ' ●') : null]),
          el('button', { class: 'btn btn-small vs-save', onclick: doSave }, T('gui.save') + ' (Ctrl+S)')]);
        function doSave() { var t = ta.value; if (t && !/\n$/.test(t)) t += '\n'; save(path, t); ui.buf = null; ui.dirty = false; after(); }
        ta.addEventListener('input', function () { ui.buf = ta.value; if (!ui.dirty) { ui.dirty = true; tab.querySelector('.vs-tab').appendChild(el('b', { class: 'vs-dot' }, ' ●')); } });
        ta.addEventListener('keydown', function (e) { if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); doSave(); } });
        ed.append(tab);
        if (hasMarkers(text)) {
          ed.append(el('div', { class: 'vs-lens' }, [
            el('span', { class: 'muted small' }, T('gui.vsConflictHere')),
            el('button', { class: 'linklike', onclick: function () { resolve('current'); } }, 'Accept Current Change'),
            el('button', { class: 'linklike', onclick: function () { resolve('incoming'); } }, 'Accept Incoming Change'),
            el('button', { class: 'linklike', onclick: function () { resolve('both'); } }, 'Accept Both Changes')
          ]));
        }
        function resolve(how) {   // first conflict block in the buffer, like VS Code's CodeLens
          ui.buf = ta.value.replace(/<<<<<<< [^\n]*\n([\s\S]*?)=======\n([\s\S]*?)>>>>>>> [^\n]*\n?/, function (m, a, b) { return how === 'current' ? a : how === 'incoming' ? b : a + b; });
          ui.dirty = true; ui.refocus = true; after();
        }
        if (ui.diff && r) {
          var head = w.headTree(r)[ui.open];
          ed.append(el('div', { class: 'vs-diffbar' }, [el('span', { class: 'small muted' }, T('gui.vsDiffTitle', { f: ui.open })), el('button', { class: 'linklike', onclick: function () { ui.diff = false; after(); } }, T('gui.vsEditFile'))]),
            el('div', { class: 'diff vs-diff', html: V.diffHtml(head || '', w.readFile(path) || '') }));
        } else ed.append(ta);
      } else ed.append(el('div', { class: 'vs-welcome' }, [el('div', { class: 'vs-logo', 'aria-hidden': 'true' }, '⟨⟩'), el('p', { class: 'muted small' }, T('gui.vsOpenHint'))]));
      var st = r ? syncState(w, r) : null;
      var status = el('div', { class: 'vs-status' }, r ? [
        el('button', { class: 'vs-st', onclick: function (e) { branchMenu(e.currentTarget, r, true); } }, '⑂ ' + (r.HEAD.branch || w.short(r.HEAD.sha)) + (changes.length ? '*' : '')),
        st.kind === 'sync' ? el('button', { class: 'vs-st', title: T('gui.vsSync'), onclick: vsSync }, '↻ ' + st.behind + '↓ ' + st.ahead + '↑') : st.kind === 'publishBranch' ? el('button', { class: 'vs-st', onclick: function () { run('git push -u origin ' + r.HEAD.branch); after(); } }, '☁ ' + T('gui.vsPublishBranch')) : null
      ] : [el('span', { class: 'vs-st' }, T('gui.vsNoRepoShort'))]);
      app.append(el('div', { class: 'vs-title' }, folder.split('/').pop() + ' — Visual Studio Code'), el('div', { class: 'vs-body' }, [act, side, ed]), status);
      if (ui.refocus && ta) { ui.refocus = false; ta.focus(); }   // keep Ctrl+S working after an Accept link, as in VS Code
    }

    function render() {
      var r = repo();
      if (skin === 'desktop') { renderDesktop(r); renderEditorPane(r); } else renderVsCode(r);
      if (panels.graph) TDC.gitgraph.draw(panels.graph, w, r);
      if (panels.areas) V.areasPanel(panels.areas, w);
      if (panels.remote) V.remotePanel(panels.remote, w);
      tasks.refresh();
    }
    w = S.boot();
    if (cfg.folder && !S.restored) { w.mkdirp(cfg.folder); w.cwd = w.abs(cfg.folder); }
    // GitHub Desktop opens the last repository it knows; start in the first local one.
    if (skin === 'desktop' && !w.repo() && Object.keys(w.repos).length) w.cwd = Object.keys(w.repos)[0];
    if (S.restored) TDC.ui.toast(T('gui.restored'));
    render();
    ctx.onTheme(function () { if (panels.graph) TDC.gitgraph.draw(panels.graph, w, repo()); });
    return { world: function () { return w; } };
  });
})(window.TDC);
