/* TDC core namespace: DOM helpers, events, registries (lessons, glossary, cheat sheet, widgets). */
(function (root) {
  'use strict';
  var TDC = root.TDC = root.TDC || {};
  TDC.version = '1.0.0';
  TDC.topics = {};        // id -> topic definition (registered by content/topicN.js)
  TDC.topicList = [];     // ordered metadata from content/topics.js

  // ---------- DOM ----------
  function el(tag, attrs, children) {
    var n = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      var v = attrs[k];
      if (v == null || v === false) continue;
      if (k === 'class') n.className = v;
      else if (k === 'html') n.innerHTML = v;
      else if (k === 'text') n.textContent = v;
      else if (k === 'style' && typeof v === 'object') for (var sk in v) {
        if (sk.slice(0, 2) === '--') n.style.setProperty(sk, v[sk]); else n.style[sk] = v[sk];   // custom props need setProperty
      }
      else if (k.slice(0, 2) === 'on' && typeof v === 'function') n.addEventListener(k.slice(2), v);
      else if (k === 'dataset') Object.assign(n.dataset, v);
      else n.setAttribute(k, v === true ? '' : v);
    }
    append(n, children);
    return n;
  }
  function append(n, children) {
    if (children == null) return;
    if (!Array.isArray(children)) children = [children];
    children.forEach(function (c) {
      if (c == null || c === false) return;
      if (Array.isArray(c)) { append(n, c); return; }   // nested lists (e.g. a .map() inside a children array)
      n.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
    });
  }
  var SVGNS = 'http://www.w3.org/2000/svg';
  function svg(tag, attrs, children) {
    var n = document.createElementNS(SVGNS, tag);
    if (attrs) for (var k in attrs) {
      var v = attrs[k];
      if (v == null || v === false) continue;
      if (k === 'text') n.textContent = v;
      else if (k === 'class') n.setAttribute('class', v);
      else if (k.slice(0, 2) === 'on' && typeof v === 'function') n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v);
    }
    if (children) (Array.isArray(children) ? children : [children]).forEach(function (c) { if (c) n.appendChild(c); });
    return n;
  }

  // ---------- events ----------
  function on(name, fn) {
    var h = function (e) { fn(e.detail, e); };
    document.addEventListener('tdc:' + name, h);
    return function () { document.removeEventListener('tdc:' + name, h); };
  }
  function emit(name, detail) {
    document.dispatchEvent(new CustomEvent('tdc:' + name, { detail: detail }));
  }

  // ---------- misc ----------
  function debounce(fn, ms) {
    var t;
    return function () {
      var a = arguments, self = this;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(self, a); }, ms);
    };
  }
  function uid(prefix) {
    return (prefix || 'id') + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function shuffle(arr, seed) {
    // Deterministic per seed so the order stays stable for one student between visits.
    var a = arr.slice(), s = 0, i;
    for (i = 0; i < (seed || '').length; i++) s = (s * 31 + seed.charCodeAt(i)) >>> 0;
    for (i = a.length - 1; i > 0; i--) {
      s = (s * 1103515245 + 12345) >>> 0;
      var j = s % (i + 1), t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  /** Date + time, 24-hour clock: "30 Oct 2026, 17:18". */
  function fmtDate(t) { return new Date(t).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short', hourCycle: 'h23' }); }

  // ---------- registries ----------
  TDC.GLOSSARY = TDC.GLOSSARY || {};
  TDC.COMMANDS = TDC.COMMANDS || [];   // cheat-sheet groups: {topic, title, items:[{cmd, does}]}
  TDC.registerTopic = function (def) {
    TDC.topics[def.id] = def;
    (def.questions || []).forEach(function (q) { q.topic = def.id; });
    // Each lesson contributes its own glossary terms and cheat-sheet commands (no shared file to edit).
    if (def.glossary) Object.keys(def.glossary).forEach(function (k) { if (!TDC.GLOSSARY[k]) TDC.GLOSSARY[k] = def.glossary[k]; });
    if (def.commands && def.commands.length) TDC.COMMANDS.push({ topic: def.id, title: def.title, items: def.commands });
  };
  TDC.questionById = function (qid) {
    for (var id in TDC.topics) {
      var qs = TDC.topics[id].questions || [];
      for (var i = 0; i < qs.length; i++) if (qs[i].id === qid) return qs[i];
    }
    return null;
  };

  var widgetFactories = {};
  TDC.widgets = {
    register: function (name, factory) { widgetFactories[name] = factory; },
    has: function (name) { return !!widgetFactories[name]; },
    create: function (name, host, config, ctx) {
      var f = widgetFactories[name];
      if (!f) { host.textContent = 'Unknown widget: ' + name; return null; }
      try { return f(host, config || {}, ctx); }
      catch (e) { console.error('[TDC] widget ' + name + ' failed', e); host.textContent = '⚠ ' + e.message; return null; }
    }
  };

  TDC.util = {
    el: el, svg: svg, append: append, on: on, emit: emit, debounce: debounce, uid: uid, clamp: clamp,
    escapeHtml: escapeHtml, shuffle: shuffle, fmtDate: fmtDate,
    $: function (s, r) { return (r || document).querySelector(s); },
    $$: function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); },
    reducedMotion: function () { return matchMedia('(prefers-reduced-motion: reduce)').matches; }
  };
  TDC.on = on; TDC.emit = emit;
})(window);
