/* Practice questions with instant feedback. Self-study course: answers sit in the lesson files (no grading,
 * no encryption). Types and their answer fields (schema: skill author-quiz-question):
 *   mc     options: [html…], answer: index          multi  options: [html…], answer: [index…]
 *   fill   text: 'Run [[a]] now', answer: {a: 'git status' | ['git status', 'git status -s']}
 *   order  items: [html…] in the correct order      match  pairs: [[left, right]…] (shown shuffled) */
(function (TDC) {
  'use strict';
  var U = TDC.util, el = U.el, I = TDC.i18n, R = function () { return TDC.render; };
  var Q = TDC.quiz = { types: {} };
  var TYPE_ICON = { mc: '◉', multi: '☑', fill: '▭', order: '⇅', match: '⇄' };

  function store() { return TDC.store; }
  function saved(q) { return store().doc.answers[q.id] || null; }
  function seed(q) { return 'gitc' + q.id; }
  function txs(tag, obj, attrs) { return R().txs(tag, obj, attrs); }
  /** Normalise typed text: trim, single spaces, one kind of quote, no trailing period; case-insensitive unless exact. */
  function norm(s, exact) {
    s = String(s == null ? '' : s).normalize('NFKC').trim().replace(/\s+/g, ' ').replace(/[‘’'“”]/g, '"').replace(/[.!]+$/, '');
    return exact ? s : s.toLowerCase();
  }
  Q.norm = norm;
  function sameSet(a, b) { a = a.slice().sort(); b = b.slice().sort(); return a.length === b.length && a.every(function (x, i) { return x === b[i]; }); }

  // ---------- input renderers: {node, get(), set(v), disable(), check(v) -> {correct, fields?}, reveal()} ----------
  var T = Q.types;
  T.mc = function (q, multi) {
    var name = U.uid('q');
    var idx = q.options.map(function (o, i) { return i; });
    var order = q.shuffle === false ? idx : U.shuffle(idx, seed(q));
    var inputs = [];
    var node = el('div', { class: 'q-options', role: multi ? 'group' : 'radiogroup' }, order.map(function (i) {
      var inp = el('input', { type: multi ? 'checkbox' : 'radio', name: name, value: String(i) });
      inputs.push(inp);
      return el('label', { class: 'q-option' }, [inp, txs('span', q.options[i])]);
    }));
    var want = multi ? q.answer : [q.answer];
    return {
      node: node,
      get: function () { return { v: inputs.filter(function (i) { return i.checked; }).map(function (i) { return +i.value; }) }; },
      set: function (v) { inputs.forEach(function (i) { i.checked = !!v && (v.v || []).indexOf(+i.value) >= 0; }); },
      empty: function (v) { return !v.v.length; },
      check: function (v) { return { correct: sameSet(v.v, want) }; },
      reveal: function () { inputs.forEach(function (i) { i.checked = want.indexOf(+i.value) >= 0; i.parentNode.classList.toggle('is-answer', i.checked); }); },
      disable: function () { inputs.forEach(function (i) { i.disabled = true; }); },
      mark: function () {}
    };
  };
  T.multi = function (q) { return T.mc(q, true); };

  T.fill = function (q) {
    var holder = el('div', { class: 'q-fill' }), inputs = {};
    I.tx(q.text).split(/(\[\[\w+\]\])/).forEach(function (p) {
      var m = /^\[\[(\w+)\]\]$/.exec(p);
      if (m) {
        var acc = [].concat(q.answer[m[1]]);
        var longest = acc.reduce(function (n, a) { return Math.max(n, String(a).length); }, 6);
        var inp = el('input', { type: 'text', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', class: 'q-input', size: Math.min(36, longest + 2), 'aria-label': TDC.t('quiz.blank') + ' ' + m[1] });
        inputs[m[1]] = inp; holder.appendChild(inp);
      } else { var s = el('span', { html: p }); R().post(s); holder.appendChild(s); }
    });
    function accepted(k) { return [].concat(q.answer[k]).map(function (a) { return norm(a, q.exact); }); }
    return {
      node: holder,
      get: function () { var o = {}; for (var k in inputs) o[k] = inputs[k].value; return o; },
      set: function (v) { for (var k in inputs) if (v && v[k] != null) inputs[k].value = v[k]; },
      empty: function (v) { return Object.keys(inputs).some(function (k) { return !String(v[k] || '').trim(); }); },
      check: function (v) {
        var fields = {}, all = true;
        for (var k in inputs) { fields[k] = accepted(k).indexOf(norm(v[k], q.exact)) >= 0; all = all && fields[k]; }
        return { correct: all, fields: fields };
      },
      reveal: function () { for (var k in inputs) inputs[k].value = [].concat(q.answer[k])[0]; },
      disable: function () { for (var k in inputs) inputs[k].disabled = true; },
      mark: function (res) { for (var k in inputs) { inputs[k].classList.toggle('ok', !!res && res.fields[k] === true); inputs[k].classList.toggle('bad', !!res && res.fields[k] === false); } }
    };
  };

  T.order = function (q) {
    var list = el('ol', { class: 'q-order' });
    var disabled = false;
    function row(i) {
      var li = el('li', { class: 'q-order-item', dataset: { id: String(i) } }, [
        el('span', { class: 'grip', 'aria-hidden': 'true' }, '⠿'), txs('span', q.items[i]),
        el('span', { class: 'q-order-btns' }, [
          el('button', { class: 'icon-btn sm', 'aria-label': TDC.t('quiz.moveUp'), onclick: function () { if (!disabled && li.previousSibling) list.insertBefore(li, li.previousSibling); } }, '▲'),
          el('button', { class: 'icon-btn sm', 'aria-label': TDC.t('quiz.moveDown'), onclick: function () { if (!disabled && li.nextSibling) list.insertBefore(li.nextSibling, li); } }, '▼')
        ])
      ]);
      // Pointer drag (mouse + touch; HTML5 drag and drop does not work on touch screens)
      li.querySelector('.grip').addEventListener('pointerdown', function (e) {
        if (disabled) return;
        e.preventDefault(); li.classList.add('dragging'); li.setPointerCapture(e.pointerId);
        function mv(ev) {
          var sibs = Array.prototype.slice.call(list.children).filter(function (x) { return x !== li; });
          var after = sibs.find(function (s) { var r = s.getBoundingClientRect(); return ev.clientY < r.top + r.height / 2; });
          if (after) list.insertBefore(li, after); else list.appendChild(li);
        }
        function up() { li.classList.remove('dragging'); li.removeEventListener('pointermove', mv); li.removeEventListener('pointerup', up); }
        li.addEventListener('pointermove', mv); li.addEventListener('pointerup', up);
      });
      return li;
    }
    var idx = q.items.map(function (x, i) { return i; }), sh = U.shuffle(idx, seed(q));
    if (sh.every(function (x, i) { return x === i; })) sh.reverse();   // never start already solved
    sh.forEach(function (i) { list.appendChild(row(i)); });
    function cur() { return Array.prototype.map.call(list.children, function (li) { return +li.dataset.id; }); }
    function put(v) { v.forEach(function (id) { var li = list.querySelector('[data-id="' + id + '"]'); if (li) list.appendChild(li); }); }
    return {
      node: list,
      get: function () { return { v: cur() }; },
      set: function (v) { if (v && v.v) put(v.v); },
      empty: function () { return false; },
      check: function (v) { return { correct: v.v.every(function (x, i) { return x === i; }) }; },
      reveal: function () { put(idx); },
      disable: function () { disabled = true; list.classList.add('disabled'); },
      mark: function () {}
    };
  };

  T.match = function (q) {
    var selects = [];
    // pairs may share a right-hand side (sorting into categories): offer each text once, keyed by its first pair
    var key = q.pairs.map(function (p) { return I.tx(p[1]); });
    var first = key.map(function (k) { return key.indexOf(k); });
    var rights = U.shuffle(q.pairs.map(function (p, i) { return i; }), seed(q) + 'r').filter(function (r) { return first[r] === r; });
    var node = el('div', { class: 'q-match' }, q.pairs.map(function (p, i) {
      var sel = el('select', { class: 'input', 'aria-label': I.tx(p[0]).replace(/<[^>]*>/g, '') }, [el('option', { value: '' }, '—')].concat(rights.map(function (r) {
        var o = el('option', { value: String(r) }); I.bind(o, q.pairs[r][1], true); return o;
      })));
      selects.push(sel);
      return el('div', { class: 'q-match-row' }, [txs('span', p[0], { class: 'q-match-left' }), el('span', { class: 'q-match-arrow', 'aria-hidden': 'true' }, '→'), sel]);
    }));
    return {
      node: node,
      get: function () { return { v: selects.map(function (s) { return s.value; }) }; },
      set: function (v) { if (v && v.v) selects.forEach(function (s, i) { s.value = v.v[i] || ''; }); },
      empty: function (v) { return v.v.some(function (x) { return x === ''; }); },
      check: function (v) { return { correct: v.v.every(function (x, i) { return +x === first[i]; }) }; },
      reveal: function () { selects.forEach(function (s, i) { s.value = String(first[i]); }); },
      disable: function () { selects.forEach(function (s) { s.disabled = true; }); },
      mark: function () {}
    };
  };

  // ---------- question card ----------
  Q.renderQuestion = function (q) {
    if (!q) return el('div', { class: 'blk-error' }, 'Question not found');
    var input = (T[q.type] || T.mc)(q);
    var fb = el('div', { class: 'q-feedback', role: 'status', 'aria-live': 'polite' });
    var explain = el('div', { class: 'q-explain', hidden: true });
    var hintBox = el('div', { class: 'q-hints' });
    var hintIdx = 0;
    var card = el('div', { class: 'q-card q-practice', id: 'q-' + q.id, dataset: { qid: q.id } });
    var head = el('div', { class: 'q-head' }, [
      el('span', { class: 'q-type', title: TDC.t('quiz.type.' + q.type), 'aria-hidden': 'true' }, TYPE_ICON[q.type] || '?'),
      el('span', { class: 'q-badge', 'data-i18n': 'quiz.practice' }),
      el('span', { class: 'q-status' })
    ]);
    var prompt = txs('div', q.prompt, { class: 'q-prompt' });
    var checkBtn = el('button', { class: 'btn btn-primary btn-small', 'data-i18n': 'quiz.check', onclick: onCheck });
    var hintBtn = q.hints && q.hints.length ? el('button', { class: 'btn btn-ghost btn-small', 'data-i18n': 'quiz.hint', onclick: function () {
      if (hintIdx < q.hints.length) hintBox.appendChild(txs('p', q.hints[hintIdx++], { class: 'q-hint' }));
      if (hintIdx >= q.hints.length) hintBtn.disabled = true;
    } }) : null;
    var revealBtn = el('button', { class: 'btn btn-ghost btn-small', 'data-i18n': 'quiz.showAnswer', hidden: true, onclick: function () {
      input.reveal(); input.mark(null); showExplain(); revealBtn.hidden = true;
      fb.className = 'q-feedback info'; fb.textContent = TDC.t('quiz.revealed');
    } });
    var actions = el('div', { class: 'q-actions' }, [checkBtn, hintBtn, revealBtn]);
    [head, prompt, el('div', { class: 'q-input-area' }, input.node), actions, hintBox, fb, explain].forEach(function (n) { if (n) card.appendChild(n); });

    function setStatus(kind) {
      var s = head.querySelector('.q-status');
      s.className = 'q-status ' + (kind || '');
      s.textContent = kind === 'ok' ? '✓' : kind === 'bad' ? '✗' : '';
    }
    function showExplain() {
      if (!q.explain) return;
      explain.hidden = false; explain.innerHTML = '';
      explain.append(el('strong', { 'data-i18n': 'quiz.explanation' }), txs('div', q.explain));
      I.applyStatic(explain);
    }
    function onCheck() {
      var raw = input.get();
      if (input.empty(raw)) { fb.className = 'q-feedback warn'; fb.textContent = TDC.t('quiz.empty'); return; }
      var prev = saved(q) || { attempts: 0 };
      var res = input.check(raw);
      input.mark(res);
      card.classList.toggle('is-correct', res.correct); card.classList.toggle('is-wrong', !res.correct);
      setStatus(res.correct ? 'ok' : 'bad');
      fb.className = 'q-feedback ' + (res.correct ? 'ok' : 'bad');
      fb.textContent = res.correct ? pick(TDC.t('quiz.correctMsgs').split('|')) : TDC.t('quiz.wrong');
      if (!res.correct && hintBtn && !hintBtn.disabled) fb.textContent += ' ' + TDC.t('quiz.tryHint');
      revealBtn.hidden = res.correct || prev.attempts < 1;     // offer the answer after two wrong tries
      if (res.correct) { showExplain(); celebrate(card); }
      store().update(function (d) {
        d.answers[q.id] = { values: raw, attempts: prev.attempts + 1, correct: res.correct || !!prev.correct, ts: new Date().toISOString() };
      }, { source: 'quiz' });
      TDC.emit('quiz:answered', { qid: q.id, correct: res.correct });
    }
    var prev = saved(q);
    if (prev) {
      input.set(prev.values);
      if (prev.correct) { setStatus('ok'); card.classList.add('was-correct'); showExplain(); }
    }
    I.applyStatic(card);
    return card;
  };

  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function celebrate(card) {
    if (U.reducedMotion()) return;
    var box = el('div', { class: 'confetti', 'aria-hidden': 'true' });
    for (var i = 0; i < 18; i++) box.appendChild(el('i', { style: { '--x': (Math.random() * 2 - 1).toFixed(2), '--d': (Math.random() * 0.4).toFixed(2) + 's', '--h': Math.floor(Math.random() * 360) } }));
    card.appendChild(box); setTimeout(function () { box.remove(); }, 1400);
  }
  Q.celebrate = celebrate;
})(window.TDC);
