/* Shared simulator helpers:
 *   TDC.viz.tasks(tasks, ctx, env) -> task checklist ("Your tasks") with hints and "show me" solutions
 *   TDC.viz.md(text) -> HTML     mini Markdown (headings, lists, bold/italic, code, links, tables, quotes, checkboxes)
 *   TDC.viz.lineHtml(line) -> HTML for one simulator output line ([cls, text] segments)
 *   widget 'custom': config.mount(host, ctx, cfg) -> api */
(function (TDC) {
  'use strict';
  var U = TDC.util, el = U.el, esc = U.escapeHtml;
  var V = TDC.viz = TDC.viz || {};

  /** Task checklist. tasks: [{id, text, check(env) -> bool, hint, solution}] ; env is passed to check().
   *  Returns a node with .refresh() (re-check all, mark newly done tasks complete) and .allDone(). */
  V.tasks = function (tasks, ctx, env) {
    if (!tasks || !tasks.length) { var n = el('div'); n.refresh = function () {}; n.allDone = function () { return true; }; return n; }
    var rows = tasks.map(function (t, i) {
      var tip = el('div', { class: 'task-tip', hidden: true });
      var row = el('li', { class: 'task' }, [
        el('span', { class: 'task-check', 'aria-hidden': 'true' }, String(i + 1)),
        el('div', { class: 'task-body' }, [
          el('span', { class: 'task-text', html: ctx.tx(t.text) }),
          el('span', { class: 'task-btns' }, [
            t.hint ? el('button', { class: 'linklike', onclick: function () { tip.hidden = false; tip.innerHTML = '💡 ' + ctx.tx(t.hint); } }, TDC.t('task.hint')) : null,
            t.solution ? el('button', { class: 'linklike', onclick: function () {
              tip.hidden = false; tip.innerHTML = '';
              tip.append(el('span', {}, '👀 ' + TDC.t('task.solution') + ' '), el('code', { class: 'task-sol' }, ctx.tx(t.solution)));
            } }, TDC.t('task.show')) : null
          ]),
          tip
        ])
      ]);
      return { t: t, row: row };
    });
    var count = el('span', { class: 'tasks-count' });
    var box = el('div', { class: 'tasks' }, [
      el('div', { class: 'tasks-head' }, [el('span', { class: 'ch-badge' }, TDC.t('task.title')), count]),
      el('ol', { class: 'task-list' }, rows.map(function (r) { return r.row; }))
    ]);
    function mark(r, done) { r.row.classList.toggle('is-done', done); r.row.querySelector('.task-check').textContent = done ? '✓' : String(rows.indexOf(r) + 1); }
    box.refresh = function () {
      var n = 0, firstOpen = true;
      rows.forEach(function (r) {
        var done = ctx.taskDone(r.t.id);
        if (!done) { try { done = !!r.t.check(env()); } catch (e) { done = false; } if (done) { ctx.completeTask(r.t.id); r.row.classList.add('just-done'); } }
        mark(r, done); if (done) n++;
        r.row.classList.toggle('is-next', !done && firstOpen); if (!done) firstOpen = false;
      });
      count.textContent = n + ' / ' + rows.length;
      box.classList.toggle('is-done', n === rows.length);
      if (n === rows.length && !box._celebrated) { box._celebrated = true; TDC.quiz.celebrate(box); }
    };
    box.allDone = function () { return rows.every(function (r) { return ctx.taskDone(r.t.id); }); };
    return box;
  };

  /** One output line -> HTML. A line is a string, [cls, text], or [[cls, text], ...]. */
  V.lineHtml = function (l) {
    if (typeof l === 'string') return esc(l);
    if (!Array.isArray(l[0])) l = [l];
    return l.map(function (s) { return s[0] ? '<span class="o-' + s[0] + '">' + esc(s[1]) + '</span>' : esc(s[1]); }).join('');
  };

  // Links in simulated Markdown go nowhere. A listener, not inline onclick, so the site's CSP can forbid inline code.
  document.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('a.md-fake')) e.preventDefault(); });
  /** Mini Markdown -> HTML (escaped first, so it is safe for learner input). */
  V.md = function (src) {
    var out = [], list = null, inCode = false, code = [], para = [];
    function inline(s) {
      return esc(s).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>').replace(/_([^_]+)_/g, '<em>$1</em>')
        .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<span class="md-img">🖼 $1</span>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="#" class="md-fake" title="$2">$1</a>')
        .replace(/(^|\s)#(\d+)\b/g, '$1<a href="#" class="md-fake">#$2</a>').replace(/(^|\s)@([\w-]+)/g, '$1<b class="md-mention">@$2</b>');
    }
    function flushPara() { if (para.length) { out.push('<p>' + inline(para.join(' ')) + '</p>'); para = []; } }
    function flushList() { if (list) { out.push('</' + list + '>'); list = null; } }
    var L = String(src || '').split('\n');
    for (var i = 0; i < L.length; i++) {
      var l = L[i];
      if (/^```/.test(l)) { if (inCode) { out.push('<pre><code>' + esc(code.join('\n')) + '</code></pre>'); code = []; inCode = false; } else { flushPara(); flushList(); inCode = true; } continue; }
      if (inCode) { code.push(l); continue; }
      var m;
      if (!l.trim()) { flushPara(); flushList(); continue; }
      if ((m = /^(#{1,6})\s+(.*)$/.exec(l))) { flushPara(); flushList(); out.push('<h' + m[1].length + '>' + inline(m[2]) + '</h' + m[1].length + '>'); continue; }
      if (/^(-{3,}|\*{3,})$/.test(l.trim())) { flushPara(); flushList(); out.push('<hr>'); continue; }
      if ((m = /^>\s?(.*)$/.exec(l))) { flushPara(); flushList(); out.push('<blockquote>' + inline(m[1]) + '</blockquote>'); continue; }
      if (/^\|.*\|\s*$/.test(l) && /^\|[\s:|-]+\|\s*$/.test(L[i + 1] || '')) {
        flushPara(); flushList();
        var row = function (x) { return x.trim().replace(/^\||\|$/g, '').split('|').map(function (c) { return c.trim(); }); };
        var t = '<table><thead><tr>' + row(l).map(function (c) { return '<th>' + inline(c) + '</th>'; }).join('') + '</tr></thead><tbody>';
        i += 2;
        while (i < L.length && /^\|.*\|\s*$/.test(L[i])) { t += '<tr>' + row(L[i]).map(function (c) { return '<td>' + inline(c) + '</td>'; }).join('') + '</tr>'; i++; }
        i--; out.push(t + '</tbody></table>'); continue;
      }
      if ((m = /^\s*([-*+]|\d+\.)\s+(.*)$/.exec(l))) {
        flushPara();
        var kind = /\d/.test(m[1]) ? 'ol' : 'ul';
        if (list !== kind) { flushList(); out.push('<' + kind + '>'); list = kind; }
        var txt = m[2].replace(/^\[ \]\s/, '☐ ').replace(/^\[x\]\s/i, '☑ ');
        out.push('<li>' + inline(txt) + '</li>'); continue;
      }
      flushList(); para.push(l.trim());
    }
    if (inCode) out.push('<pre><code>' + esc(code.join('\n')) + '</code></pre>');
    flushPara(); flushList();
    return out.join('\n');
  };

  /** Small inline text editor used by the simulators. opts: {title, path, text, onSave(text), onClose(), hint} */
  V.editor = function (host, opts) {
    var ta = el('textarea', { class: 'sim-editor-ta', spellcheck: 'false', autocapitalize: 'off', 'aria-label': opts.title });
    ta.value = opts.text || '';
    var box = el('div', { class: 'sim-editor', role: 'dialog', 'aria-label': opts.title }, [
      el('div', { class: 'sim-editor-bar' }, [el('span', {}, '📝 ' + opts.title), el('span', { class: 'muted small' }, opts.hint || TDC.t('sim.editorHint'))]),
      ta,
      el('div', { class: 'sim-editor-actions' }, [
        el('button', { class: 'btn btn-small btn-ghost', onclick: function () { box.remove(); opts.onClose && opts.onClose(); } }, TDC.t('common.cancel')),
        el('button', { class: 'btn btn-small btn-primary', onclick: save }, TDC.t('sim.saveClose'))
      ])
    ]);
    function save() { var v = ta.value; if (v && !/\n$/.test(v)) v += '\n'; box.remove(); opts.onSave(v); opts.onClose && opts.onClose(); }
    ta.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); save(); }
      if (e.key === 'Escape') { box.remove(); opts.onClose && opts.onClose(); }
    });
    host.appendChild(box);
    setTimeout(function () { ta.focus(); }, 30);
    return box;
  };

  /** Replayable simulator session: the world is rebuilt from cfg.world and the learner's saved actions.
   *  apply(w, entry, replaying) performs one action (entries are small JSON objects chosen by the widget). */
  V.session = function (cfg, ctx, apply) {
    var S = { log: [], restored: 0 };
    S.boot = function () {
      S.w = TDC.git.world(cfg.world || {});
      S.log = [];
      var saved = (ctx.getState() || {}).log || [];
      saved.forEach(function (e) { try { apply(S.w, e, true); } catch (err) { console.warn('[sim] replay failed', e, err); } S.log.push(e); });
      S.restored = saved.length;
      return S.w;
    };
    S.act = function (e) { var r = apply(S.w, e, false); S.log.push(e); ctx.setState({ log: S.log.slice(-500) }); return r; };
    S.reset = function () { ctx.setState({ log: [] }); return S.boot(); };
    return S;
  };

  /** Small dialog inside a simulator (positioned over host). buttons: [{label, primary, run() -> false keeps open}] */
  V.dialog = function (host, title, body, buttons) {
    var box = el('div', { class: 'sim-dialog', role: 'dialog', 'aria-label': title }, [
      el('div', { class: 'sim-dialog-head' }, [el('strong', {}, title), el('button', { class: 'icon-btn sm', 'aria-label': TDC.t('common.close'), onclick: function () { box.remove(); } }, '✕')]),
      el('div', { class: 'sim-dialog-body' }, body),
      el('div', { class: 'sim-dialog-actions' }, (buttons || [{ label: TDC.t('common.close') }]).map(function (b) {
        return el('button', { class: 'btn btn-small' + (b.primary ? ' btn-primary' : '') + (b.danger ? ' btn-danger' : ''), onclick: function () { if (b.run && b.run() === false) return; box.remove(); } }, b.label);
      }))
    ]);
    box.addEventListener('keydown', function (e) { if (e.key === 'Escape') box.remove(); });
    Array.prototype.forEach.call(host.querySelectorAll('.sim-dialog'), function (d) { d.remove(); });   // one at a time, as on the real sites
    host.appendChild(box);
    // Open where the learner is looking: tall simulated pages can put the host's top far above the viewport.
    var hr = host.getBoundingClientRect(), headH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 56;
    var top = Math.max(40, headH + 16 - hr.top);
    box.style.top = Math.max(8, Math.min(top, host.clientHeight - box.offsetHeight - 8)) + 'px';
    box.scrollIntoView({ block: 'nearest' });
    var f = box.querySelector('input, textarea, select, .btn-primary'); if (f) setTimeout(function () { f.focus(); }, 20);
    return box;
  };

  /** Changed files of a repository for GUI lists: [{p, kind: 'new'|'mod'|'del'|'conflict', staged, unstaged}] */
  V.changes = function (w, r) {
    var st = w.status(r), map = {};
    function get(p) { return map[p] = map[p] || { p: p }; }
    st.staged.forEach(function (x) { var c = get(x.p); c.staged = true; c.kind = x.k === 'new file' ? 'new' : x.k === 'deleted' ? 'del' : 'mod'; });
    st.unstaged.forEach(function (x) { var c = get(x.p); c.unstaged = true; c.kind = c.kind === 'new' ? 'new' : x.k === 'deleted' ? 'del' : 'mod'; });
    st.untracked.forEach(function (x) { var c = get(x.p); c.unstaged = true; c.kind = 'new'; c.untracked = true; });
    st.conflicts.forEach(function (p) { var c = get(p); c.kind = 'conflict'; c.unstaged = true; });
    return Object.keys(map).sort().map(function (k) { return map[k]; });
  };
  /** Diff of two texts as HTML lines. */
  V.diffHtml = function (a, b) {
    var d = TDC.git.diffLines(a || '', b || '');
    if (!d.length) return '<div class="diff-empty">' + esc(TDC.t('gui.noDiff')) + '</div>';
    return d.map(function (x, i) {
      return '<div class="dl dl-' + (x.t === '+' ? 'add' : x.t === '-' ? 'del' : 'ctx') + '"><span class="dl-sign">' + (x.t === ' ' ? '' : x.t) + '</span>' + (esc(x.l) || '&nbsp;') + '</div>';
    }).join('');
  };
  /** Quote a value for a simulated command line (the simulator tokenizer has no escapes). */
  V.q = function (s) { return '"' + String(s).replace(/"/g, "'") + '"'; };

  TDC.widgets.register('custom', function (host, cfg, ctx) { return cfg.mount(host, ctx, cfg) || {}; });
})(window.TDC);
