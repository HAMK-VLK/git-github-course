/* Page rendering: home page, lesson pages and content blocks. Block types are pluggable through
 * TDC.render.blocks[type] = function (block, ctx) -> Node. Content schema: skill author-lesson-content. */
(function (TDC) {
  'use strict';
  var U = TDC.util, el = U.el, I = TDC.i18n;
  var cleanups = [];          // run on every page change (widgets, observers)
  var R = TDC.render = { blocks: {}, postprocessors: [] };

  function tx(obj, asText) { var n = el(asText ? 'span' : 'div'); I.bind(n, obj, asText); return n; }
  function txs(tag, obj, attrs) { var n = el(tag, attrs); I.bind(n, obj); post(n); return n; }
  function post(n) { R.postprocessors.forEach(function (p) { p(n); }); }
  R.tx = tx; R.txs = txs; R.post = post;
  R.onCleanup = function (fn) { cleanups.push(fn); };
  R.cleanup = function () { cleanups.splice(0).forEach(function (f) { try { f(); } catch (e) { console.error(e); } }); };

  // <dfn data-term="key"> -> glossary popover; <kbd> keys and <code> stay as they are.
  R.postprocessors.push(function (root) {
    root.querySelectorAll('dfn[data-term]:not(.term)').forEach(function (d) {
      d.tabIndex = 0; d.classList.add('term');
      d.addEventListener('click', function () { TDC.tools && TDC.tools.termPopover(d, d.dataset.term); });
      d.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); d.click(); } });
    });
  });

  // ---------- block renderers ----------
  var B = R.blocks;
  B.text = function (b) { return txs('div', b.html, { class: 'blk-text' }); };
  B.h = function (b) { return txs('h3', b.text, { class: 'blk-h' }); };
  B.list = function (b) {
    return el(b.ordered || b.steps ? 'ol' : 'ul', { class: 'blk-list' + (b.steps ? ' blk-steps' : '') }, (b.items || (Array.isArray(b.steps) ? b.steps : [])).map(function (it) { return txs('li', it); }));
  };
  B.callout = function (b) {
    var icons = { key: '★', tip: '💡', warn: '⚠', info: 'ℹ', school: '🏫', staff: '👩‍🏫' };
    return el('div', { role: 'note', class: 'blk-callout callout-' + (b.kind || 'info') }, [
      el('span', { class: 'callout-icon', 'aria-hidden': 'true' }, icons[b.kind] || 'ℹ'),
      el('div', {}, [b.title ? txs('strong', b.title, { class: 'callout-title' }) : null, txs('div', b.html)])
    ]);
  };
  /** Code / terminal snippet with a copy button. Lines starting with "$ " or "> " are commands: the prompt is
   *  drawn but not copied, other lines are shown as output. */
  B.code = function (b) {
    var lines = String(b.code).replace(/\n$/, '').split('\n');
    var shell = b.lang === 'bash' || b.lang === 'powershell' || b.lang === 'shell';
    var pre = el('pre', { class: 'code-pre', tabindex: '0' }, el('code', {}, lines.map(function (l, i) {
      var m = shell && /^(\$|>|PS>) (.*)$/.exec(l);
      var row = m ? el('span', { class: 'cl cl-cmd' }, [el('span', { class: 'cl-prompt', 'aria-hidden': 'true' }, m[1] + ' '), m[2]])
        : el('span', { class: 'cl' + (shell ? ' cl-out' : '') }, l);
      return [row, i < lines.length - 1 ? '\n' : null];
    }).reduce(function (a, b) { return a.concat(b); }, [])));
    var copy = el('button', { class: 'btn btn-small btn-ghost code-copy', onclick: function () {
      var txt = shell ? lines.filter(function (l) { return /^(\$|>|PS>) /.test(l); }).map(function (l) { return l.replace(/^(\$|>|PS>) /, ''); }).join('\n') : lines.join('\n');
      (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(function () { TDC.ui.toast(TDC.t('code.copied'), 'ok'); })
        .catch(function () { TDC.ui.toast(TDC.t('code.copyFailed'), 'warn'); });
    } }, TDC.t('code.copy'));
    return el('div', { class: 'blk-code lang-' + (b.lang || 'text') }, [
      el('div', { class: 'code-head' }, [el('span', { class: 'code-lang' }, b.title ? I.tx(b.title) : ({ bash: 'Terminal', powershell: 'PowerShell', shell: 'Terminal' })[b.lang] || b.lang || ''), copy]),
      pre
    ]);
  };
  function cell(c, tag) {
    if (c && typeof c === 'object' && c.en != null) return txs(tag, c);
    return el(tag, { html: c == null ? '' : String(c) });
  }
  B.table = function (b) {
    var t = el('table', { class: 'blk-table' + (b.compact ? ' compact' : '') }, [
      b.caption ? txs('caption', b.caption) : null,
      b.head ? el('thead', {}, el('tr', {}, b.head.map(function (h) { return cell(h, 'th'); }))) : null,
      el('tbody', {}, b.rows.map(function (r) { return el('tr', {}, r.map(function (c) { return cell(c, 'td'); })); }))
    ]);
    post(t);
    return el('div', { class: 'table-wrap', tabindex: '0' }, t);
  };
  B.figure = function (b) {
    var media = b.svg ? el('div', { class: 'fig-svg', html: I.tx(b.svg) }) : el('img', { src: b.img, alt: '', loading: 'lazy' });
    if (b.alt) { if (b.svg) { media.setAttribute('role', 'img'); media.setAttribute('aria-label', I.tx(b.alt)); } else media.alt = I.tx(b.alt); }
    return el('figure', { class: 'blk-figure' }, [media, b.caption ? txs('figcaption', b.caption) : null]);
  };
  B.details = function (b) {
    return el('details', { class: 'blk-details' }, [el('summary', {}, tx(b.summary, true)), txs('div', b.html)]);
  };
  B.columns = function (b, ctx) {
    return el('div', { class: 'blk-columns' }, b.cols.map(function (col) {
      return el('div', {}, col.map(function (cb, i) { return renderBlock(cb, ctx, (b.id || 'col') + '-' + i); }));
    }));
  };
  /** Tabs: {tabs: [{label, icon?, blocks: [...]}]}. The chosen tab is remembered per tab group name
   *  (b.group, e.g. 'os' or 'tool'), so picking "macOS" once opens macOS everywhere. */
  B.tabs = function (b, ctx) {
    var bar = el('div', { class: 'tabs blk-tabs-bar', role: 'tablist' });
    var panels = [];
    var pref = b.group ? TDC.prefs.get('tab.' + b.group) : null;
    var start = Math.max(0, b.tabs.findIndex(function (t) { return pref && I.tx(t.label) === pref; }));
    b.tabs.forEach(function (t, i) {
      var p = el('div', { class: 'blk-tab-panel', role: 'tabpanel', hidden: true });
      var built = false;
      var btn = el('button', { class: 'tab', role: 'tab', 'aria-selected': 'false', onclick: function () { show(i, true); } },
        [t.icon ? el('span', { 'aria-hidden': 'true' }, t.icon + ' ') : null, tx(t.label, true)]);
      bar.appendChild(btn);
      panels.push({ btn: btn, p: p, build: function () {
        if (built) return; built = true;
        t.blocks.forEach(function (cb, j) { p.appendChild(renderBlock(cb, ctx, (b.id || 'tabs') + '-' + i + '-' + j)); });
      } });
    });
    function show(i, user) {
      panels.forEach(function (x, j) { x.btn.setAttribute('aria-selected', String(i === j)); x.p.hidden = i !== j; });
      panels[i].build();
      if (user && b.group) TDC.prefs.set('tab.' + b.group, I.tx(b.tabs[i].label));
    }
    show(start);
    return el('div', { class: 'blk-tabs' }, [bar].concat(panels.map(function (x) { return x.p; })));
  };
  /** Worked scenario with step-by-step reveal. steps: text (HTML) or {code, lang}. */
  B.example = function (b) {
    var stepsBox = el('ol', { class: 'ex-steps' });
    var shown = 0;
    var steps = (b.steps || []).map(function (s, i) {
      var li = el('li', { class: 'ex-step' });
      if (s && s.code) li.appendChild(B.code(s)); else li.appendChild(txs('div', s));
      return li;
    });
    var nextBtn = el('button', { class: 'btn btn-small', onclick: function () {
      if (shown < steps.length) { stepsBox.appendChild(steps[shown]); shown++; }
      if (shown >= steps.length) { nextBtn.hidden = true; allBtn.hidden = true; if (result) result.hidden = false; }
    } }, TDC.t('example.next'));
    var allBtn = el('button', { class: 'btn btn-small btn-ghost', onclick: function () { while (shown < steps.length) nextBtn.click(); nextBtn.click(); } }, TDC.t('example.all'));
    var result = b.result ? txs('div', b.result, { class: 'ex-result', hidden: true }) : null;
    return el('div', { class: 'blk-example' }, [
      el('div', { class: 'ex-head' }, [b.badge ? txs('span', b.badge, { class: 'ex-badge' }) : el('span', { class: 'ex-badge' }, TDC.t('example.badge')), b.title ? txs('strong', b.title) : null]),
      b.problem ? txs('div', b.problem, { class: 'ex-problem' }) : null,
      stepsBox, result, el('div', { class: 'ex-actions' }, [nextBtn, allBtn])
    ]);
  };
  B.interactive = function (b, ctx) {
    var host = el('div', { class: 'widget-host', style: b.height ? { minHeight: b.height + 'px' } : null });
    var fig = el('figure', { class: 'blk-interactive', dataset: { widget: b.widget } }, [
      b.title ? el('div', { class: 'widget-title' }, [el('span', { class: 'widget-badge' }, TDC.t(b.badge || 'widget.badge')), txs('strong', b.title)]) : null,
      host,
      b.caption ? txs('figcaption', b.caption) : null
    ]);
    mountLazy(host, function () {
      var wctx = widgetContext(b.id, ctx);
      var inst = TDC.widgets.create(b.widget, host, b.config, wctx);
      return function () { wctx._destroy(); if (inst && inst.destroy) inst.destroy(); };
    });
    return fig;
  };
  B.question = function (b) { return TDC.quiz.renderQuestion(TDC.questionById(b.q), { inline: true }); };
  B.html = function (b) { return el('div', { class: 'blk-html', html: b.html }); };   // trusted author HTML

  function renderBlock(b, ctx, fallbackId) {
    var f = B[b.type];
    var node;
    try { node = f ? f(b, ctx) : el('div', { class: 'blk-error' }, 'Unknown block type: ' + b.type); }
    catch (e) { console.error('[TDC] block', b, e); node = el('div', { class: 'blk-error' }, '⚠ ' + e.message); }
    return el('div', { class: 'blk', dataset: { block: b.id || fallbackId } }, node);
  }
  R.renderBlock = renderBlock;

  // ---------- widgets ----------
  function widgetContext(id, ctx) {
    var offs = [];
    return {
      id: id, topic: ctx && ctx.topic,
      t: TDC.t, tx: TDC.tx, el: el, svg: U.svg,
      color: TDC.theme.color,
      onTheme: function (fn) { offs.push(TDC.on('themechange', fn)); },
      getState: function () { return TDC.store.doc.widgets[id]; },
      setState: function (s) { TDC.store.update(function (d) { d.widgets[id] = s; }, { silent: true, source: 'widget' }); },
      /** Simulator tasks: mark one done (counts toward lesson progress). */
      taskDone: function (taskId) { return TDC.store.taskDone(id + ':' + taskId); },
      completeTask: function (taskId) {
        if (TDC.store.taskDone(id + ':' + taskId)) return;
        TDC.store.update(function (d) { d.tasks[id + ':' + taskId] = new Date().toISOString(); }, { source: 'task' });
        TDC.emit('task:done', { widget: id, task: taskId });
      },
      _destroy: function () { offs.splice(0).forEach(function (f) { f(); }); }
    };
  }
  R.widgetContext = widgetContext;
  function mountLazy(host, mount) {
    var destroy = null;
    if (!('IntersectionObserver' in window)) { destroy = mount(); R.onCleanup(function () { destroy && destroy(); }); return; }
    var io = new IntersectionObserver(function (es) {
      if (es.some(function (e) { return e.isIntersecting; })) { io.disconnect(); destroy = mount(); }
    }, { rootMargin: '300px' });
    io.observe(host);
    R.onCleanup(function () { io.disconnect(); if (destroy) destroy(); });
  }
  R.mountLazy = mountLazy;

  // ---------- progress ----------
  /** All simulator tasks of a lesson: ["<widgetId>:<taskId>", ...] (found by walking its blocks). */
  function lessonTasks(t) {
    var out = [];
    (function walk(blocks) {
      (blocks || []).forEach(function (b) {
        if (b.type === 'interactive' && b.config && b.config.tasks) b.config.tasks.forEach(function (k) { out.push(b.id + ':' + k.id); });
        if (b.cols) b.cols.forEach(walk);
        if (b.tabs) b.tabs.forEach(function (x) { walk(x.blocks); });
      });
    })([].concat.apply([], t.sections.map(function (s) { return s.blocks; })));
    return out;
  }
  R.lessonTasks = lessonTasks;
  R.topicProgress = function (topicId) {
    var t = TDC.topics[topicId];
    if (!t) return 0;
    var d = TDC.store.doc, p = (d.progress[topicId] || {}).visited || {};
    var seen = t.sections.filter(function (s) { return p[s.id]; }).length;
    var ok = (t.questions || []).filter(function (q) { var a = d.answers[q.id]; return a && a.correct; }).length;
    var tasks = lessonTasks(t), done = tasks.filter(function (k) { return d.tasks[k]; }).length;
    var total = t.sections.length + (t.questions || []).length + tasks.length;
    return total ? (seen + ok + done) / total : 0;
  };

  // ---------- home ----------
  var TRACK = { git: 'track.git', github: 'track.github', both: 'track.both' };
  function trackChip(track) { return el('span', { class: 'track-chip track-' + track, 'data-i18n': TRACK[track] }); }
  R.trackChip = trackChip;
  R.home = function (main) {
    var list = TDC.topicList;
    var last = TDC.store.doc.lastLocation;
    var hero = el('section', { class: 'hero' }, [
      el('div', { class: 'hero-text' }, [
        el('p', { class: 'eyebrow', 'data-i18n': 'home.eyebrow' }),
        el('h1', { 'data-i18n': 'home.title' }),
        el('p', { class: 'lead', 'data-i18n': 'home.lead' }),
        el('div', { class: 'hero-actions' }, [
          last && TDC.topics[last.topic] ? el('a', { class: 'btn btn-primary', href: '#/topic/' + last.topic + '/' + last.section, 'data-i18n': 'home.continue' })
               : el('a', { class: 'btn btn-primary', href: '#/topic/' + (list[0] && list[0].id), 'data-i18n': 'home.start' }),
          el('button', { class: 'btn btn-ghost', onclick: function () { TDC.tools.openHelp(); }, 'data-i18n': 'home.howto' })
        ])
      ]),
      heroArt()
    ]);
    // Track filter: everything / Git only / GitHub only
    var filter = TDC.prefs.get('homeTrack', 'all');
    var levelsBox = el('div', { class: 'levels' });
    var filterBar = el('div', { class: 'tabs track-filter', role: 'tablist', 'aria-label': TDC.t('home.filter') }, [['all', 'track.all'], ['git', 'track.git'], ['github', 'track.github']].map(function (f) {
      return el('button', { class: 'tab', role: 'tab', 'aria-selected': String(filter === f[0]), dataset: { f: f[0] }, onclick: function () {
        filter = f[0]; TDC.prefs.set('homeTrack', filter);
        filterBar.querySelectorAll('.tab').forEach(function (b) { b.setAttribute('aria-selected', String(b.dataset.f === filter)); });
        drawLevels();
      } }, TDC.t(f[1]));
    }));
    function drawLevels() {
      levelsBox.innerHTML = '';
      var i = 0;
      (TDC.levels || []).forEach(function (lv) {
        var items = list.filter(function (m) { return m.level === lv.id && (filter === 'all' || m.track === filter || m.track === 'both'); });
        if (!items.length) return;
        var all = list.filter(function (m) { return m.level === lv.id; });
        var pct = Math.round(all.reduce(function (s, m) { return s + R.topicProgress(m.id); }, 0) / all.length * 100);
        levelsBox.appendChild(el('section', { class: 'level', style: { '--accent': lv.color } }, [
          el('header', { class: 'level-head' }, [
            el('span', { class: 'level-num' }, String(lv.num)),
            el('div', { class: 'level-titles' }, [txs('h2', lv.title), txs('p', lv.summary, { class: 'muted' })]),
            el('div', { class: 'level-pct' }, [el('div', { class: 'progress' }, el('span', { style: { width: pct + '%' } })), el('span', {}, pct + '%')])
          ]),
          el('div', { class: 'topic-grid' }, items.map(function (m) {
            var t = TDC.topics[m.id] || {}, p = Math.round(R.topicProgress(m.id) * 100);
            return el('a', { class: 'topic-card' + (t.sections ? '' : ' is-soon'), href: '#/topic/' + m.id, style: { '--accent': lv.color, '--i': i++ } }, [
              el('div', { class: 'tc-top' }, [el('span', { class: 'tc-num' }, m.num), trackChip(m.track), el('div', { class: 'tc-icon', html: m.icon || '' })]),
              txs('h3', m.title, { class: 'tc-title' }),
              txs('p', m.summary, { class: 'tc-sum' }),
              el('div', { class: 'tc-foot' }, [
                el('div', { class: 'progress', role: 'progressbar', 'aria-valuenow': p, 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-label': TDC.t('home.progress') }, el('span', { style: { width: p + '%' } })),
                el('span', { class: 'tc-pct' }, p + '%'),
                m.minutes ? el('span', { class: 'tc-meta' }, '⏱ ' + m.minutes + ' min') : null
              ])
            ]);
          }))
        ]));
      });
      I.applyStatic(levelsBox);
    }
    drawLevels();
    var features = el('section', { class: 'feature-strip' }, [
      ['🖥', 'home.f.terminal'], ['🌐', 'home.f.github'], ['🔐', 'home.f.perms'], ['🧩', 'home.f.quiz']
    ].map(function (f) { return el('div', { class: 'feature' }, [el('span', { class: 'feature-icon', 'aria-hidden': 'true' }, f[0]), el('span', { 'data-i18n': f[1] })]); }));
    main.append(hero, el('div', { class: 'home-bar' }, [el('h2', { class: 'section-title', 'data-i18n': 'home.topics' }), filterBar]), levelsBox, features);
    I.applyStatic(main);
  };

  function heroArt() {
    // A small commit graph: main line, a branch that merges back, commits pulsing in sequence.
    var c = function (x, y, d, cls) { return '<circle class="ha-c ' + (cls || '') + '" cx="' + x + '" cy="' + y + '" r="9" style="animation-delay:' + d + 's"/>'; };
    return el('div', { class: 'hero-art', 'aria-hidden': 'true', html:
      '<svg viewBox="0 0 340 220">' +
      '<path class="ha-line" d="M30 140 H310"/>' +
      '<path class="ha-line ha-br" d="M110 140 C130 140 130 70 150 70 H230 C250 70 250 140 270 140"/>' +
      c(30, 140, 0) + c(70, 140, .3) + c(110, 140, .6) + c(150, 70, .9, 'br') + c(190, 70, 1.2, 'br') + c(230, 70, 1.5, 'br') +
      c(190, 140, 1.2) + c(270, 140, 1.8, 'merge') + c(310, 140, 2.1) +
      '<g class="ha-tag"><rect x="282" y="160" width="56" height="22" rx="5"/><text x="310" y="175">main</text></g>' +
      '<g class="ha-tag br"><rect x="160" y="34" width="100" height="22" rx="5"/><text x="210" y="49">my-thesis</text></g>' +
      '<g class="ha-cloud"><path d="M250 30 a16 16 0 0 1 30 -6 a13 13 0 0 1 24 8 a11 11 0 0 1 -4 21 h-46 a12 12 0 0 1 -4 -23z"/><text x="276" y="46">GitHub</text></g>' +
      '</svg>' });
  }

  // ---------- lesson page ----------
  R.topic = function (main, topicId, sectionId) {
    var t = TDC.topics[topicId], meta = TDC.topicList.filter(function (m) { return m.id === topicId; })[0] || {};
    var lv = (TDC.levels || []).filter(function (l) { return l.id === meta.level; })[0] || {};
    if (!t) { main.appendChild(el('div', { class: 'page' }, [el('h1', {}, I.tx(meta.title || topicId)), el('p', { class: 'empty', 'data-i18n': 'topic.soon' })])); I.applyStatic(main); return; }
    var ctx = { topic: topicId };
    var sections = t.sections.slice();
    var practiceLeft = (t.questions || []).filter(function (q) { return !JSON.stringify(t.sections).includes('"q":"' + q.id + '"'); });
    if (practiceLeft.length) sections.push({ id: topicId + '-practice', title: TDC.t('topic.morePractice'), auto: true,
      blocks: practiceLeft.map(function (q) { return { type: 'question', q: q.id, id: q.id + '-blk' }; }) });

    var visited = ((TDC.store.doc.progress[topicId] || {}).visited) || {};
    var tocMin = TDC.prefs.get('tocMin', false);
    var tocMinBtn = el('button', { class: 'icon-btn toc-min', 'aria-expanded': String(!tocMin), 'data-i18n-title': 'topic.tocMin', 'data-i18n-aria': 'topic.tocMin',
      onclick: function () { var min = toc.classList.toggle('min'); tocMinBtn.setAttribute('aria-expanded', !min); TDC.prefs.set('tocMin', min); } }, el('span', { 'aria-hidden': 'true' }, '▴'));
    var progressBar = el('span', { style: { width: Math.round(R.topicProgress(topicId) * 100) + '%' } });
    var toc = el('nav', { class: 'toc' + (tocMin ? ' min' : ''), 'aria-label': 'Sections' }, [
      el('div', { class: 'toc-head' }, [el('span', { class: 'toc-num', style: { background: lv.color } }, meta.num), txs('strong', t.title), tocMinBtn]),
      el('div', { class: 'progress toc-progress' }, progressBar),
      el('ol', {}, sections.map(function (s) {
        return el('li', { class: visited[s.id] ? 'seen' : '' }, el('a', { href: '#/topic/' + topicId + '/' + s.id, dataset: { sec: s.id } }, tx(s.title, true)));
      })),
      el('button', { class: 'btn btn-small btn-ghost toc-reset', onclick: function () { TDC.tools.confirmReset(topicId); } },
        [el('span', { 'aria-hidden': 'true' }, '↺ '), el('span', { 'data-i18n': 'reset.topic' })])
    ]);
    var offProg = TDC.on('notes:change', U.debounce(function () { progressBar.style.width = Math.round(R.topicProgress(topicId) * 100) + '%'; }, 300));
    R.onCleanup(offProg);
    var tocToggle = el('button', { class: 'btn btn-small toc-toggle', 'aria-expanded': 'false', onclick: function () {
      var open = toc.classList.toggle('open'); tocToggle.setAttribute('aria-expanded', open);
    } }, [el('span', { 'aria-hidden': 'true' }, '☰ '), el('span', { 'data-i18n': 'topic.contents' })]);

    var article = el('article', { class: 'topic-content', style: { '--accent': lv.color } }, [
      el('header', { class: 'topic-hero' }, [
        el('div', { class: 'topic-hero-icon', html: meta.icon || '' }),
        el('div', {}, [
          el('p', { class: 'eyebrow' }, [tx(lv.title || '', true), ' · ', TDC.t('topic.lesson') + ' ' + meta.num, ' ', trackChip(meta.track || 'both')]),
          txs('h1', t.title),
          t.subtitle ? txs('p', t.subtitle, { class: 'lead' }) : null,
          t.audience ? el('p', { class: 'audience' }, [el('span', { 'data-i18n': 'topic.forWho' }), ' ', tx(t.audience, true)]) : null,
          t.objectives ? el('details', { class: 'objectives', open: true }, [
            el('summary', { 'data-i18n': 'topic.objectives' }),
            el('ul', {}, t.objectives.map(function (o) { return txs('li', o); }))
          ]) : null
        ])
      ])
    ]);
    sections.forEach(function (s) {
      var sec = el('section', { class: 'sec', id: s.id, dataset: { section: s.id } }, [
        el('div', { class: 'sec-head' }, [
          txs('h2', s.title),
          el('button', { class: 'icon-btn bm-btn', 'data-i18n-title': 'notes.bookmark', 'data-i18n-aria': 'notes.bookmark', 'aria-pressed': String(TDC.store.doc.bookmarks.indexOf(s.id) >= 0),
            onclick: function (e) { TDC.tools.toggleBookmark(s.id, e.currentTarget); } }, '🔖')
        ])
      ]);
      var body = el('div', { class: 'sec-body' });
      s.blocks.forEach(function (b, i) { body.appendChild(renderBlock(b, ctx, s.id + '-b' + i)); });
      sec.appendChild(body);
      article.appendChild(sec);
    });
    // Prev / next lesson
    var idx = TDC.topicList.findIndex(function (m) { return m.id === topicId; });
    var prev = TDC.topicList[idx - 1], next = TDC.topicList[idx + 1];
    article.appendChild(el('nav', { class: 'topic-nav' }, [
      prev ? el('a', { class: 'btn btn-ghost', href: '#/topic/' + prev.id }, ['‹ ' + prev.num + ' ', tx(prev.title, true)]) : el('span'),
      next ? el('a', { class: 'btn btn-primary', href: '#/topic/' + next.id }, [next.num + ' ', tx(next.title, true), ' ›']) : el('a', { class: 'btn btn-ghost', href: '#/', 'data-i18n': 'nav.home' })
    ]));

    main.append(el('div', { class: 'topic-layout' }, [el('div', { class: 'toc-wrap' }, [tocToggle, toc]), article]));
    I.applyStatic(main);
    trackSections(topicId, article, toc);
    if (sectionId) {
      var target = document.getElementById(sectionId);
      if (target) setTimeout(function () { target.scrollIntoView({ block: 'start' }); }, 30);
    } else window.scrollTo(0, 0);
  };

  function trackSections(topicId, article, toc) {
    if (!('IntersectionObserver' in window)) return;
    var mark = U.debounce(function (secId) {
      TDC.store.update(function (d) {
        var p = d.progress[topicId] = d.progress[topicId] || { visited: {} };
        if (!p.visited[secId]) p.visited[secId] = new Date().toISOString();
        d.lastLocation = { topic: topicId, section: secId };
      }, { silent: true, source: 'progress' });
    }, 1200);
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var id = e.target.dataset.section;
        toc.querySelectorAll('a').forEach(function (a) { a.classList.toggle('current', a.dataset.sec === id); });
        var li = toc.querySelector('a[data-sec="' + id + '"]'); if (li) li.parentNode.classList.add('seen');
        mark(id);
      });
    }, { rootMargin: '-35% 0px -55% 0px' });
    article.querySelectorAll('.sec').forEach(function (s) { io.observe(s); });
    R.onCleanup(function () { io.disconnect(); });
  }
})(window.TDC);
