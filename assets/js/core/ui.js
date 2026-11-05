/* UI primitives: modal dialogs, toasts, side drawers, popovers. Never use alert/confirm/prompt
 * (they block automation and look out of place). */
(function (TDC) {
  'use strict';
  var U = TDC.util, el = U.el;
  var nid = 0;
  // Give focus back to whatever opened a dialog, unless it is gone or sits in a drawer that is closing
  function refocus(opener) { if (opener && opener.focus && document.contains(opener) && !opener.closest('.drawer:not(.open)')) opener.focus(); }

  function trapFocus(box, e) {
    if (e.key !== 'Tab') return;
    var f = box.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault(); }
    else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault(); }
  }

  TDC.ui = {
    /** opts: {title, body (string|Node), actions:[{label, primary, danger, run(close) -> false keeps open}], dismissable} */
    modal: function (opts) {
      var host = document.getElementById('modal-host');
      var opener = document.activeElement, tid = 'modal-title-' + (++nid);
      var close = function () { wrap.remove(); refocus(opener); };
      var body = typeof opts.body === 'string' ? el('div', { class: 'modal-body', html: opts.body }) : el('div', { class: 'modal-body' }, opts.body);
      var actions = el('div', { class: 'modal-actions' }, (opts.actions || [{ label: TDC.t('common.close'), primary: true }]).map(function (a) {
        return el('button', { class: 'btn' + (a.primary ? ' btn-primary' : '') + (a.danger ? ' btn-danger' : ''), onclick: function () {
          if (a.run && a.run(close) === false) return; close();
        } }, a.label);
      }));
      var box = el('div', { class: 'modal' + (opts.wide ? ' modal-wide' : ''), role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': tid }, [
        el('h2', { class: 'modal-title', id: tid }, opts.title || ''), body, actions
      ]);
      var wrap = el('div', { class: 'modal-backdrop', onclick: function (e) { if (e.target === wrap && opts.dismissable !== false) close(); } }, box);
      wrap.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && opts.dismissable !== false) close();
        trapFocus(box, e);
      });
      host.appendChild(wrap);
      var focusable = box.querySelector('input, textarea, .btn-primary, button');
      if (focusable) focusable.focus();
      return { close: close, box: box };
    },
    /** Promise<boolean> confirmation built on modal(). */
    confirm: function (title, body, okLabel, danger) {
      return new Promise(function (res) {
        TDC.ui.modal({ title: title, body: body, actions: [
          { label: TDC.t('common.cancel'), run: function () { res(false); } },
          { label: okLabel || TDC.t('common.ok'), primary: !danger, danger: danger, run: function () { res(true); } }
        ] });
      });
    },
    toast: function (msg, kind, ms) {
      var host = document.getElementById('toast-host');
      var t = el('div', { class: 'toast toast-' + (kind || 'info'), role: kind === 'warn' || kind === 'bad' ? 'alert' : 'status' }, msg);
      host.appendChild(t);
      requestAnimationFrame(function () { t.classList.add('show'); });
      setTimeout(function () { t.classList.remove('show'); setTimeout(function () { t.remove(); }, 300); }, ms || 2600);
    },
    /** Side drawer; only one open at a time. render(container) fills it. */
    drawer: function (id, title, render) {
      var host = document.getElementById('drawer-host');
      var existing = host.querySelector('.drawer');
      if (existing) { var same = existing.dataset.id === id; existing._close(); if (same) return null; }
      var opener = document.activeElement;
      var content = el('div', { class: 'drawer-content' });
      var d = el('aside', { class: 'drawer', role: 'dialog', 'aria-label': title, dataset: { id: id } }, [
        el('div', { class: 'drawer-head' }, [
          el('h2', {}, title),
          el('button', { class: 'icon-btn', 'aria-label': TDC.t('common.close'), onclick: function () { d._close(); } }, '✕')
        ]), content
      ]);
      d._close = function () { d.classList.remove('open'); setTimeout(function () { d.remove(); }, 250); refocus(opener); };
      d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !document.querySelector('#modal-host .modal')) d._close(); trapFocus(d, e); });
      host.appendChild(d);
      render(content, d);
      requestAnimationFrame(function () { d.classList.add('open'); var f = d.querySelector('input,button:not(.icon-btn),textarea'); if (f) f.focus(); });
      return d;
    },
    /** Keep Tab inside box (call from a keydown handler); simulator dialogs use it too. */
    trap: trapFocus,
    closeDrawer: function () { var d = document.querySelector('#drawer-host .drawer'); if (d) d._close(); },
    /** Small anchored popover (glossary terms, simulator menus). */
    popover: function (anchor, content) {
      TDC.ui.closePopover();
      var p = el('div', { class: 'popover', role: 'dialog', 'aria-label': anchor.getAttribute('aria-label') || anchor.textContent.trim().slice(0, 60) }, content);
      document.body.appendChild(p);
      var r = anchor.getBoundingClientRect(), pw = p.offsetWidth, ph = p.offsetHeight;
      var vw = document.documentElement.clientWidth;   // innerWidth counts the scrollbar
      var x = Math.max(8, Math.min(r.left + r.width / 2 - pw / 2, vw - pw - 8));
      var y = r.bottom + 8 + ph > innerHeight ? r.top - ph - 8 : r.bottom + 8;
      p.style.left = (x + scrollX) + 'px'; p.style.top = (y + scrollY) + 'px';
      setTimeout(function () {
        document.addEventListener('pointerdown', p._out = function (e) { if (!p.contains(e.target)) TDC.ui.closePopover(); });
      });
      var f = p.querySelector('input,button'); if (f) f.focus();
      // Esc anywhere closes it (glossary popovers hold no focusable element) and returns focus to the anchor
      document.addEventListener('keydown', p._esc = function (e) { if (e.key === 'Escape') { TDC.ui.closePopover(); if (anchor.focus && document.contains(anchor)) anchor.focus(); } });
      return p;
    },
    closePopover: function () {
      document.querySelectorAll('.popover').forEach(function (p) { if (p._out) document.removeEventListener('pointerdown', p._out); if (p._esc) document.removeEventListener('keydown', p._esc); p.remove(); });
    }
  };
})(window.TDC);
