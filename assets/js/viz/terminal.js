/* 'terminal' widget: a Git Bash–style terminal on the simulator engine, with optional live panels
 * (the three areas, the commit graph, the GitHub copy) and a task checklist.
 * config: {world: <TDC.git.world config>, tasks: [...], panels: ['areas','graph','remote'], intro: 'text', title}
 * The learner's commands are saved and replayed on the next visit. Reference: skill git-simulators. */
(function (TDC) {
  'use strict';
  var U = TDC.util, el = U.el, V = TDC.viz;
  var GIT_CMDS = ['add', 'branch', 'cat-file', 'checkout', 'cherry-pick', 'clone', 'commit', 'config', 'diff', 'fetch', 'init', 'log', 'merge', 'mv', 'pull', 'push', 'rebase', 'reflog', 'remote', 'reset', 'restore', 'revert', 'rm', 'show', 'stash', 'status', 'switch', 'tag'];

  /** "Three areas" panel: working folder, staging area, repository. */
  function areas(host, w) {
    host.innerHTML = '';
    var r = w.repo();
    if (!r) { host.appendChild(el('p', { class: 'muted small' }, TDC.t('areas.noRepo'))); return; }
    var st = w.status(r), work = w.workTree(r), head = w.headTree(r);
    var mark = {};
    st.untracked.forEach(function (x) { mark[x.p] = ['new', TDC.t('areas.untracked')]; });
    st.unstaged.forEach(function (x) { mark[x.p] = x.k === 'deleted' ? ['del', TDC.t('areas.deleted')] : ['mod', TDC.t('areas.modified')]; });
    st.conflicts.forEach(function (p) { mark[p] = ['bad', TDC.t('areas.conflict')]; });
    var files = Object.keys(work).filter(function (p) { return !st.ignored.some(function (x) { return x.p === p; }); });
    st.unstaged.forEach(function (x) { if (x.k === 'deleted' && files.indexOf(x.p) < 0) files.push(x.p); });
    files.sort();
    function chip(p, m) { return el('li', { class: 'area-file' + (m ? ' f-' + m[0] : '') }, [el('span', { class: 'af-name' }, p), m ? el('span', { class: 'af-tag' }, m[1]) : null]); }
    var colW = el('div', { class: 'area area-work' }, [el('h4', {}, ['📁 ', TDC.t('areas.work')]), el('p', { class: 'area-sub' }, TDC.t('areas.workSub')),
      files.length ? el('ul', {}, files.map(function (p) { return chip(p, mark[p]); })) : el('p', { class: 'muted small' }, TDC.t('areas.emptyFolder')),
      st.ignored.length ? el('p', { class: 'area-ign' }, TDC.t('areas.ignored') + ' ' + st.ignored.map(function (x) { return x.p; }).join(', ')) : null]);
    var colS = el('div', { class: 'area area-stage' }, [el('h4', {}, ['📋 ', TDC.t('areas.stage')]), el('p', { class: 'area-sub' }, TDC.t('areas.stageSub')),
      st.staged.length ? el('ul', {}, st.staged.map(function (x) { return chip(x.p, [x.k === 'new file' ? 'new' : x.k === 'deleted' ? 'del' : 'mod', TDC.t('areas.k.' + x.k.replace(' ', ''))]); }))
        : el('p', { class: 'muted small' }, TDC.t('areas.emptyStage'))]);
    var cs = w.commitsOn(r).slice(0, 4);
    var colR = el('div', { class: 'area area-repo' }, [el('h4', {}, ['🗄 ', TDC.t('areas.repo')]), el('p', { class: 'area-sub' }, r.HEAD.branch ? TDC.t('areas.onBranch', { b: r.HEAD.branch }) : TDC.t('areas.detached')),
      cs.length ? el('ul', {}, cs.map(function (c) { return el('li', { class: 'area-commit' }, [el('code', {}, w.short(c.sha)), ' ', c.msg.split('\n')[0]]); }))
        : el('p', { class: 'muted small' }, TDC.t('areas.noCommits')),
      cs.length ? el('p', { class: 'area-sub' }, TDC.t('areas.snapshot', { n: Object.keys(head).length })) : null]);
    host.append(el('div', { class: 'areas' }, [colW, el('span', { class: 'area-arrow', 'aria-hidden': 'true' }, 'git add →'), colS, el('span', { class: 'area-arrow', 'aria-hidden': 'true' }, 'git commit →'), colR]));
  }

  /** The copy on GitHub of each remote of the current repository. */
  function remotePanel(host, w) {
    host.innerHTML = '';
    var r = w.repo(), slugs = [];
    if (r) Object.keys(r.remotes).forEach(function (n) { var s = w.slugFromUrl(r.remotes[n]); if (s && w.server.repos[s]) slugs.push(s); });
    if (!slugs.length) slugs = Object.keys(w.server.repos).slice(0, 1);
    if (!slugs.length) { host.appendChild(el('p', { class: 'muted small' }, TDC.t('remote.none'))); return; }
    slugs.forEach(function (s) {
      var repo = w.server.repos[s];
      host.appendChild(el('div', { class: 'remote-card' }, [
        el('div', { class: 'rc-head' }, [el('span', { class: 'gh-mark', 'aria-hidden': 'true' }), el('strong', {}, s), el('span', { class: 'gh-label' }, repo.visibility === 'public' ? 'Public' : repo.visibility === 'internal' ? 'Internal' : 'Private')]),
        el('ul', { class: 'rc-branches' }, Object.keys(repo.refs).sort().map(function (b) {
          var c = w.commit(repo.refs[b]);
          return el('li', {}, [el('span', { class: 'rc-b' }, '⎇ ' + b), el('code', {}, w.short(c.sha)), ' ', c.msg.split('\n')[0]]);
        }))
      ]));
    });
  }

  /** Session entries shared by every simulator: {c: command} {e: path, t: text} {s: 1 signed in}. */
  function applyShell(w, e) {
    if (e.c != null) return w.exec(e.c);
    if (e.e) w.writeFile(e.e, e.t);
    else if (e.s) w.signedIn = true;
    return null;
  }

  /** A Git Bash window bound to a session. opts: {S (V.session), title, intro, onChange()} -> {node, refresh(), boot()} */
  function terminalView(opts) {
    var S = opts.S;
    var outBox = el('div', { class: 'term-out', role: 'log', 'aria-live': 'polite' });
    var promptBox = el('div', { class: 'term-prompt' });
    var input = el('input', { class: 'term-input', type: 'text', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', 'aria-label': TDC.t('term.input') });
    var screen = el('div', { class: 'term-screen', onclick: function () { if (!window.getSelection().toString()) input.focus(); } },
      [outBox, el('div', { class: 'term-line' }, [promptBox, el('div', { class: 'term-input-row' }, [el('span', { class: 'term-dollar', 'aria-hidden': 'true' }, '$'), input])])]);
    var title = el('span', { class: 'term-title' });
    var overlay = el('div', { class: 'term-overlay-host' });
    var node = el('div', { class: 'term-stage' }, [el('div', { class: 'term-win' }, [
      el('div', { class: 'term-bar' }, [el('span', { class: 'term-icon', 'aria-hidden': 'true' }, '◆'), title, el('span', { class: 'term-ctrls', 'aria-hidden': 'true' }, '–  ▢  ✕')]),
      screen
    ]), overlay]);
    var hist = [], hi = 0;
    function w() { return S.w; }
    function promptHtml() {
      var r = w().repo(), b = r ? (r.HEAD.branch || w().short(r.HEAD.sha) + '...') : null;
      if (r && r.merge) b += '|MERGING';
      return '<span class="p-user">' + U.escapeHtml(w().me) + '@HAMK-LAPTOP</span> <span class="p-sys">MINGW64</span> <span class="p-dir">' + U.escapeHtml(w().pretty(w().cwd)) + '</span>' + (b ? ' <span class="p-br">(' + U.escapeHtml(b) + ')</span>' : '');
    }
    function print(lines, cls) {
      lines.forEach(function (l) { outBox.appendChild(el('div', { class: 'term-o' + (cls ? ' ' + cls : ''), html: V.lineHtml(l) || '&nbsp;' })); });
      screen.scrollTop = screen.scrollHeight;
    }
    function refresh() {
      promptBox.innerHTML = promptHtml();
      title.textContent = (opts.title || 'Git Bash') + ' — ' + w().pretty(w().cwd);
    }
    function changed() { refresh(); if (opts.onChange) opts.onChange(); }
    function edit(path) {
      input.disabled = true;
      V.editor(overlay, { title: w().pretty(path), text: w().fs[path] || '', onSave: function (t) {
        S.act({ e: path, t: t }); print([['muted', '(saved ' + w().pretty(path) + ')']]); changed();
      }, onClose: function () { input.disabled = false; input.focus(); } });
    }
    function signIn(retry) {
      input.disabled = true;
      var box = el('div', { class: 'gcm-dialog', role: 'dialog', 'aria-label': 'Git Credential Manager' }, [
        el('div', { class: 'gcm-head' }, [el('span', { class: 'gh-mark', 'aria-hidden': 'true' }), el('strong', {}, 'Connect to GitHub')]),
        el('p', {}, TDC.t('gcm.body')),
        el('button', { class: 'btn btn-primary', onclick: function () { box.remove(); S.act({ s: 1 }); input.disabled = false; print([['ok', 'info: please complete authentication in your browser... done.']]); run(retry, true); input.focus(); } }, TDC.t('gcm.browser')),
        el('button', { class: 'btn btn-ghost btn-small', onclick: function () { box.remove(); input.disabled = false; print([['bad', "fatal: Authentication failed for 'https://github.com/'"]]); input.focus(); } }, TDC.t('common.cancel')),
        el('p', { class: 'muted small' }, TDC.t('gcm.note'))
      ]);
      overlay.appendChild(box);
      box.querySelector('.btn-primary').focus();
    }
    function run(line, resumed) {   // resumed: after sign-in the command just continues, like real Git
      if (!resumed) {
        var echo = el('div', { class: 'term-o term-echo' });
        // the long prompt is for the eye; screen readers hear only "$ command" in the output log
        echo.innerHTML = '<span aria-hidden="true">' + promptHtml() + '<br></span><span class="p-dollar">$</span> ' + U.escapeHtml(line);
        outBox.appendChild(echo);
      }
      var res = line.trim() ? S.act({ c: line }) : { out: [] };
      if (res.clear) outBox.innerHTML = '';
      print(res.out);
      if (res.edit) edit(res.edit);
      if (res.prompt === 'gcm') signIn(res.retry);
      changed();
    }
    input.addEventListener('keydown', function (e) {
      // preventDefault: otherwise the same Enter "clicks" the button of a dialog the command just opened (sign-in)
      if (e.key === 'Enter') { e.preventDefault(); var v = input.value; input.value = ''; if (v.trim()) hist.push(v); hi = hist.length; run(v); }
      else if (e.key === 'ArrowUp') { if (hi > 0) { hi--; input.value = hist[hi]; } e.preventDefault(); }
      else if (e.key === 'ArrowDown') { if (hi < hist.length) { hi++; input.value = hist[hi] || ''; } e.preventDefault(); }
      // Tab completes only when something is typed: with an empty line Tab / Shift+Tab leave the terminal (no keyboard trap)
      else if (e.key === 'Tab' && !e.shiftKey && input.value.trim()) { e.preventDefault(); complete(); }
      else if (e.key === 'l' && e.ctrlKey) { e.preventDefault(); outBox.innerHTML = ''; }
      // the output pane scrolls on its own: PageUp / PageDown scroll it without leaving the input
      else if (e.key === 'PageUp' || e.key === 'PageDown') { e.preventDefault(); var sc = outBox.closest('.term-screen') || outBox; sc.scrollTop += (e.key === 'PageUp' ? -1 : 1) * sc.clientHeight * 0.8; }
    });
    function complete() {
      var v = input.value, parts = v.split(' '), last = parts[parts.length - 1], cands;
      if (parts.length === 2 && parts[0] === 'git') cands = GIT_CMDS;
      else {
        var r = w().repo(), dir = last.lastIndexOf('/') >= 0 ? last.slice(0, last.lastIndexOf('/') + 1) : '';
        cands = Object.keys(w().children(dir || '.')).map(function (n) { return dir + n; });
        if (r) cands = cands.concat(Object.keys(r.heads), Object.keys(r.remoteRefs));
      }
      var hits = cands.filter(function (c) { return c.indexOf(last) === 0; });
      if (hits.length === 1) { parts[parts.length - 1] = hits[0]; input.value = parts.join(' ') + (Object.keys(w().children(hits[0])).length ? '/' : ' '); }
      else if (hits.length > 1) print([hits.join('   ')], 'term-o-muted');
    }
    /** Call after S.boot(): clears the screen and restores the command history. */
    function boot() {
      outBox.innerHTML = '';
      hist = S.log.filter(function (e) { return e.c != null; }).map(function (e) { return e.c; }); hi = hist.length;
      if (opts.intro) print(String(opts.intro).split('\n').map(function (l) { return ['muted', l]; }));
      if (hist.length) print([['info', TDC.t('term.restored', { n: hist.length })]]);
      refresh();
    }
    return { node: node, refresh: refresh, boot: boot, run: run, help: function () { run('git help'); } };
  }

  TDC.widgets.register('terminal', function (host, cfg, ctx) {
    var S = V.session(cfg, ctx, applyShell);
    var panels = {}, panelBox = el('div', { class: 'term-panels' });
    (cfg.panels || []).forEach(function (p) {
      var body = el('div', { class: 'panel-body' });
      panels[p] = body;
      panelBox.appendChild(el('section', { class: 'term-panel panel-' + p }, [el('h3', { class: 'panel-title' }, TDC.t('panel.' + p)), body]));
    });
    var tasksBox = V.tasks(cfg.tasks, ctx, function () { return S.w; });
    function drawPanels() {
      if (panels.areas) areas(panels.areas, S.w);
      if (panels.graph) TDC.gitgraph.draw(panels.graph, S.w, S.w.repo());
      if (panels.remote) remotePanel(panels.remote, S.w);
      tasksBox.refresh();
    }
    var term = terminalView({ S: S, title: cfg.title, intro: cfg.intro, onChange: drawPanels });
    var resetBtn = el('button', { class: 'btn btn-small btn-ghost', onclick: function () {
      TDC.ui.confirm(TDC.t('sim.resetTitle'), TDC.t('sim.resetBody'), TDC.t('sim.reset')).then(function (ok) { if (ok) { S.reset(); term.boot(); drawPanels(); } });
    } }, '↺ ' + TDC.t('sim.reset'));
    host.classList.add('sim-terminal');
    host.append(tasksBox, term.node, el('div', { class: 'sim-actions' }, [el('button', { class: 'btn btn-small btn-ghost', onclick: term.help }, '? ' + TDC.t('term.help')), resetBtn]), panelBox);
    S.boot(); term.boot(); drawPanels();
    ctx.onTheme(function () { if (panels.graph) TDC.gitgraph.draw(panels.graph, S.w, S.w.repo()); });
    return { world: function () { return S.w; } };
  });

  // Exported for the other simulators.
  TDC.viz.areasPanel = areas;
  TDC.viz.remotePanel = remotePanel;
  TDC.viz.terminalView = terminalView;
  TDC.viz.applyShell = applyShell; TDC.viz.areasPanel = areas; TDC.viz.remotePanel = remotePanel;
})(window.TDC);
