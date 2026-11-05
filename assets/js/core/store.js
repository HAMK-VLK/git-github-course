/* Learning progress, kept in this browser (localStorage). Self-study course: no notes file, no submission.
 * Shape: {progress, answers, widgets, tasks, bookmarks, lastLocation}. Ids start with "<lessonId>-". */
(function (TDC) {
  'use strict';
  var U = TDC.util;
  var LS_KEY = 'gitc.progress.v1', APP = 'GitCourse';

  function blankDoc() {
    return {
      app: APP, schemaVersion: 1, updated: new Date().toISOString(),
      progress: {},     // lessonId -> {visited: {sectionId: ts}}
      answers: {},      // qid -> {values, correct, attempts, ts}
      widgets: {},      // widget id -> saved state
      tasks: {},        // "<widgetId>:<taskId>" -> ts (simulator tasks completed)
      bookmarks: []     // sectionIds
    };
  }
  function read() {
    try {
      var d = JSON.parse(localStorage.getItem(LS_KEY));
      if (!d || d.app !== APP) return null;
      var b = blankDoc();
      for (var k in b) if (d[k] == null) d[k] = b[k];
      return d;
    } catch (e) { return null; }
  }

  var S = TDC.store = {
    doc: blankDoc(),
    readOnly: function () { return false; },
    init: function () { S.doc = read() || blankDoc(); return Promise.resolve(); },
    /** Mutate the document through fn(doc) and save shortly after. */
    update: function (fn, opts) {
      fn(S.doc);
      S.doc.updated = new Date().toISOString();
      S._save();
      TDC.emit('notes:change', opts || {});
      return true;
    },
    taskDone: function (key) { return !!S.doc.tasks[key]; },
    /** Clear one lesson's progress (ids start with "<lessonId>-"), or everything when lessonId is omitted. */
    reset: function (lessonId) {
      return S.update(function (d) {
        if (!lessonId) { var b = blankDoc(); for (var k in b) d[k] = b[k]; delete d.lastLocation; return; }
        var pre = lessonId + '-';
        ['widgets', 'answers', 'tasks'].forEach(function (k) {
          Object.keys(d[k]).forEach(function (id) { if (id.indexOf(pre) === 0) delete d[k][id]; });
        });
        d.bookmarks = d.bookmarks.filter(function (id) { return id.indexOf(pre) !== 0; });
        delete d.progress[lessonId];
        if (d.lastLocation && d.lastLocation.topic === lessonId) delete d.lastLocation;
      }, { source: 'reset' });
    },
    /** The progress file the learner downloads (Export). Only ever leaves the device through their own hands. */
    exportText: function () { return JSON.stringify(S.doc, null, 1); },
    /** Check a progress file before it replaces anything. Returns the clean document, or null if it is not ours. */
    parseImport: function (text) {
      var d;
      if (typeof text !== 'string' || text.length > 5e6) return null;
      try { d = JSON.parse(text); } catch (e) { return null; }
      var isObj = function (x) { return !!x && typeof x === 'object' && !Array.isArray(x); };
      if (!isObj(d) || d.app !== APP || d.schemaVersion !== 1) return null;
      if (!['progress', 'answers', 'widgets', 'tasks'].every(function (k) { return isObj(d[k]); })) return null;
      if (!Array.isArray(d.bookmarks) || !d.bookmarks.every(function (b) { return typeof b === 'string'; })) return null;
      var clean = blankDoc();   // keep only the known keys
      ['progress', 'answers', 'widgets', 'tasks', 'bookmarks'].forEach(function (k) { clean[k] = d[k]; });
      if (isObj(d.lastLocation) && typeof d.lastLocation.topic === 'string') clean.lastLocation = { topic: d.lastLocation.topic, section: typeof d.lastLocation.section === 'string' ? d.lastLocation.section : undefined };
      return clean;
    },
    importDoc: function (clean) {
      return S.update(function (d) { Object.keys(d).forEach(function (k) { delete d[k]; }); Object.assign(d, clean); }, { source: 'import' });
    },
    _save: U.debounce(function () { S.saveNow(); }, 500),
    saveNow: function () {
      try { localStorage.setItem(LS_KEY, JSON.stringify(S.doc)); }
      catch (e) { TDC.ui && TDC.ui.toast(TDC.t('store.saveFailed'), 'warn'); return; }
      // Once there is progress, ask the browser not to clear it when space runs low (Chrome/Edge decide silently,
      // Firefox may ask the learner). Over file:// or when refused, nothing changes.
      if (!S._asked && navigator.storage && navigator.storage.persist) { S._asked = true; navigator.storage.persist().catch(function () {}); }
    }
  };
  window.addEventListener('pagehide', function () { S.saveNow(); });
})(window.TDC);
