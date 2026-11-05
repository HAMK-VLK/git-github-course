/* Commit graph drawing (SVG), used by the terminal/GUI simulators and the 'gitgraph' widget.
 *   TDC.gitgraph.draw(host, world, repo, opts)  — redraws into host. opts: {remote: true, compact}
 * Oldest commit on the left; one lane per branch (default branch on top); branch/tag/HEAD pills on the tips. */
(function (TDC) {
  'use strict';
  var U = TDC.util, el = U.el, S = U.svg;
  var DX = 58, DY = 50, R = 9;

  function layout(w, repo, opts) {
    var tips = [], prio = [];
    var def = repo.heads.main ? 'main' : repo.heads.master ? 'master' : null;
    if (def) prio.push(repo.heads[def]);
    if (repo.HEAD.branch && repo.heads[repo.HEAD.branch]) prio.push(repo.heads[repo.HEAD.branch]);
    Object.keys(repo.heads).sort().forEach(function (b) { prio.push(repo.heads[b]); });
    if (opts.remote !== false) Object.keys(repo.remoteRefs).sort().forEach(function (b) { prio.push(repo.remoteRefs[b]); });
    Object.keys(repo.tags).forEach(function (t) { prio.push(repo.tags[t]); });
    if (!repo.HEAD.branch && repo.HEAD.sha) prio.push(repo.HEAD.sha);
    prio.forEach(function (s) { if (s && tips.indexOf(s) < 0) tips.push(s); });
    var commits = w.walk(tips).reverse();
    var col = {}, lane = {}, nLanes = 0;
    commits.forEach(function (c, i) { col[c.sha] = i; });
    // then commits only reachable as a merge's second parent (e.g. after `git pull` merged the remote's work)
    tips.concat(commits.map(function (c) { return c.sha; }).reverse()).forEach(function (t) {
      var s = t, used = false;
      while (s && lane[s] == null) { lane[s] = nLanes; used = true; s = w.commit(s).parents[0]; }
      if (used) nLanes++;
    });
    return { commits: commits, col: col, lane: lane, lanes: Math.max(1, nLanes) };
  }

  function draw(host, w, repo, opts) {
    opts = opts || {};
    host.innerHTML = '';
    if (!repo) { host.appendChild(el('p', { class: 'muted small graph-empty' }, TDC.t('graph.noRepo'))); return; }
    var L = layout(w, repo, opts);
    if (!L.commits.length) { host.appendChild(el('p', { class: 'muted small graph-empty' }, TDC.t('graph.noCommits'))); return; }
    var dec = w.decorations(repo), head = w.headSha(repo);
    var labelsOf = function (s) { return (dec[s] || []).filter(function (d) { return opts.remote !== false || d[0] !== 'bad'; }); };
    // Place pills in stacked rows so labels of neighbouring commits never overlap (greedy, per lane and side).
    var maxTop = 0, maxBottom = 0, rows = {}, place = {};
    L.commits.forEach(function (c) {
      var ln = L.lane[c.sha], below = ln > 0 && ln === L.lanes - 1, cx = L.col[c.sha] * DX;
      place[c.sha] = labelsOf(c.sha).map(function (d) {
        var wpx = Math.max(34, d[1].length * 6.6 + 14), x0 = cx - wpx / 2 - 3, x1 = cx + wpx / 2 + 3, lv = 0, key;
        while (true) {
          key = ln + (below ? 'b' : 't') + lv;
          if (!(rows[key] || []).some(function (iv) { return x0 < iv[1] && x1 > iv[0]; })) break;
          lv++;
        }
        (rows[key] = rows[key] || []).push([x0, x1]);
        if (below) maxBottom = Math.max(maxBottom, lv + 1); else if (ln === 0) maxTop = Math.max(maxTop, lv + 1);
        return { d: d, w: wpx, lv: lv, below: below };
      });
    });
    // Room for the widest pill on the first and last commit, so labels are never clipped at the edges.
    var pillW = function (s) { return labelsOf(s).reduce(function (m, d) { return Math.max(m, d[1].length * 6.6 + 14); }, 0); };
    var left = Math.max(24, pillW(L.commits[0].sha) / 2 + 6), right = Math.max(24, pillW(L.commits[L.commits.length - 1].sha) / 2 + 6);
    var top = 24 + maxTop * 20, width = left + (L.commits.length - 1) * DX + right, height = top + (L.lanes - 1) * DY + 26 + maxBottom * 20;
    var X = function (s) { return left + L.col[s] * DX; }, Y = function (s) { return top + L.lane[s] * DY; };
    var color = function (ln) { return TDC.theme.color('--c-' + (ln % 6 + 1)); };
    var svg = S('svg', { class: 'gg-svg', viewBox: '0 0 ' + width + ' ' + height, width: width, height: height, role: 'group', 'aria-label': TDC.t('graph.aria', { n: L.commits.length }) });
    var info = el('div', { class: 'gg-detail', 'aria-live': 'polite' });
    // edges
    L.commits.forEach(function (c) {
      c.parents.forEach(function (p, k) {
        if (L.col[p] == null) return;
        var x1 = X(p), y1 = Y(p), x2 = X(c.sha), y2 = Y(c.sha), ln = Math.max(L.lane[p], L.lane[c.sha]);
        var d = y1 === y2 ? 'M' + x1 + ' ' + y1 + 'H' + x2 : 'M' + x1 + ' ' + y1 + 'C' + (x1 + DX * 0.6) + ' ' + y1 + ',' + (x2 - DX * 0.6) + ' ' + y2 + ',' + x2 + ' ' + y2;
        svg.appendChild(S('path', { d: d, class: 'gg-edge' + (k ? ' gg-merge' : ''), stroke: color(ln) }));
      });
    });
    // commits + labels
    L.commits.forEach(function (c) {
      var x = X(c.sha), y = Y(c.sha), ln = L.lane[c.sha], isHead = c.sha === head;
      var g = S('g', { class: 'gg-commit' + (isHead ? ' is-head' : ''), tabindex: '0', role: 'button', 'aria-label': w.short(c.sha) + ' ' + c.msg.split('\n')[0] });
      g.appendChild(S('title', { text: w.short(c.sha) + '  ' + c.msg.split('\n')[0] + '\n' + c.author }));
      if (isHead) g.appendChild(S('circle', { cx: x, cy: y, r: R + 5, class: 'gg-halo', stroke: color(ln) }));
      g.appendChild(S('circle', { cx: x, cy: y, r: R, fill: c.parents.length > 1 ? TDC.theme.color('--surface') : color(ln), stroke: color(ln), 'stroke-width': 3 }));
      var show = function () {
        info.innerHTML = '';
        info.append(el('code', {}, w.short(c.sha)), ' ', el('strong', {}, c.msg.split('\n')[0]), el('span', { class: 'muted' }, ' — ' + c.author + ', ' + w.fmtTime(c.time).slice(0, 16)));
      };
      g.addEventListener('click', show); g.addEventListener('focus', show);
      g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); show(); } });
      svg.appendChild(g);
      place[c.sha].forEach(function (p) {
        var ly = p.below ? y + R + 8 + p.lv * 20 : y - R - 24 - p.lv * 20;
        svg.appendChild(S('rect', { x: x - p.w / 2, y: ly, width: p.w, height: 17, rx: 8.5, class: 'gg-pill gg-' + p.d[0] }));
        svg.appendChild(S('text', { x: x, y: ly + 12.5, class: 'gg-pill-text', text: p.d[1] }));
      });
    });
    var wrap = el('div', { class: 'gg-scroll', tabindex: '0', role: 'region', 'aria-label': TDC.t('graph.aria', { n: L.commits.length }) }, svg);
    host.append(wrap, info);
    wrap.scrollLeft = width;   // newest commits are on the right
    var last = L.commits[L.commits.length - 1];
    info.append(el('span', { class: 'muted' }, TDC.t('graph.clickHint')));
    return { width: width, last: last };
  }
  TDC.gitgraph = { draw: draw };
})(window.TDC);
