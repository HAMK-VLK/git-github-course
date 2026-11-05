/* UI strings by key (data-i18n) + content text. The course is English only; content fields may be plain
 * strings or {en: '…'} objects, so another language can be added later without touching the renderers. */
(function (TDC) {
  'use strict';
  function plain(s) { return String(s).replace(/<[^>]*>/g, ''); }   // text-only targets (<option>, titles)
  var dict = {};
  var I = TDC.i18n = {
    lang: 'en',
    add: function (lang, obj) { Object.assign(dict, obj); },
    /** UI string by key with {var} substitution. */
    t: function (key, vars) {
      var s = dict[key];
      if (s == null) { console.warn('[TDC] missing UI string', key); s = '[' + key + ']'; }
      if (vars) s = s.replace(/\{(\w+)\}/g, function (m, k) { return vars[k] != null ? vars[k] : m; });
      return s;
    },
    /** Text of a content field: a string, or {en: '…'}. */
    tx: function (obj) {
      if (obj == null) return '';
      if (typeof obj === 'string' || typeof obj === 'number') return String(obj);
      return obj.en != null ? obj.en : '';
    },
    /** Set element content (HTML, or plain text when asText). */
    bind: function (el, obj, asText) {
      if (asText) el.textContent = plain(I.tx(obj)); else el.innerHTML = I.tx(obj);
      return el;
    },
    resetBindings: function () {},
    /** Apply data-i18n / data-i18n-title / data-i18n-aria / data-i18n-ph attributes under root. */
    applyStatic: function (root) {
      (root || document).querySelectorAll('[data-i18n],[data-i18n-title],[data-i18n-aria],[data-i18n-ph]').forEach(function (n) {
        if (n.dataset.i18n) n.textContent = I.t(n.dataset.i18n);
        if (n.dataset.i18nTitle) n.title = I.t(n.dataset.i18nTitle);
        if (n.dataset.i18nAria) n.setAttribute('aria-label', I.t(n.dataset.i18nAria));
        if (n.dataset.i18nPh) n.placeholder = I.t(n.dataset.i18nPh);
      });
    }
  };
  TDC.t = I.t; TDC.tx = I.tx;

  // Small preference store (theme, contents-list state), kept apart from learning progress.
  TDC.prefs = {
    _p: (function () { try { return JSON.parse(localStorage.getItem('gitc.prefs') || '{}'); } catch (e) { return {}; } })(),
    get: function (k, d) { return this._p[k] != null ? this._p[k] : d; },
    set: function (k, v) { this._p[k] = v; try { localStorage.setItem('gitc.prefs', JSON.stringify(this._p)); } catch (e) {} }
  };
})(window.TDC);
