/* Startup: wire the header, load progress, start the router. Loaded last. */
(function (TDC) {
  'use strict';
  var $ = TDC.util.$;
  function start() {
    TDC.i18n.applyStatic(document);
    $('#btn-theme').addEventListener('click', TDC.theme.toggle);
    $('#btn-tools').addEventListener('click', function () { TDC.tools.openTools(); });
    $('#btn-progress').addEventListener('click', TDC.tools.openProgress);
    TDC.store.init().then(function () { TDC.router.start(); })
      .catch(function (e) { console.error('[TDC] start failed', e); TDC.router.start(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})(window.TDC);
