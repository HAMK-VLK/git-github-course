/* Git + GitHub simulator engine (no DOM). One World = a learner's computer (file system, shell, local
 * repositories) + a pretend github.com (users, organizations, teams, repositories, permissions, rulesets,
 * issues, pull requests). Commit objects live in one shared store, so push/fetch only move refs.
 *   var w = TDC.git.world(cfg); var r = w.exec('git status');  // r.out = lines, r.edit / r.prompt for the UI
 * Line format: a string, or an array of segments [cls, text] (cls: ok, bad, warn, info, muted, bold, hl).
 * Self-check: node tools/test-git.mjs. Config reference: skill git-simulators. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else { root.TDC = root.TDC || {}; root.TDC.git = api; }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var HOME = '/home/student';
  // Real Git commands the simulator lacks: say so instead of claiming they do not exist.
  var REAL_GIT = ['am', 'apply', 'archive', 'bisect', 'blame', 'bundle', 'check-ignore', 'clean', 'describe', 'difftool', 'format-patch', 'fsck', 'gc', 'grep', 'gui', 'lfs',
    'ls-files', 'ls-remote', 'maintenance', 'mergetool', 'notes', 'range-diff', 'rev-list', 'rev-parse', 'shortlog', 'show-ref', 'sparse-checkout', 'submodule', 'update-ref', 'worktree'];
  var ROLES = ['none', 'read', 'triage', 'write', 'maintain', 'admin'];
  var DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // ---------- small helpers ----------
  function cyrb(str, seed) {
    var h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    for (var i = 0; i < str.length; i++) { var c = str.charCodeAt(i); h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677); }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return ('00000000' + (h2 >>> 0).toString(16)).slice(-8) + ('00000000' + (h1 >>> 0).toString(16)).slice(-8);
  }
  function sha1ish(str) { return (cyrb(str, 1) + cyrb(str, 2) + cyrb(str, 3)).slice(0, 40); }
  function lines(s) { return s === '' || s == null ? [] : String(s).replace(/\n$/, '').split('\n'); }
  function keys(o) { return Object.keys(o || {}); }
  function copy(o) { return JSON.parse(JSON.stringify(o)); }
  function roleRank(r) { return Math.max(0, ROLES.indexOf(r || 'none')); }
  function maxRole(a, b) { return roleRank(a) >= roleRank(b) ? a : b; }

  /** Tokenise a command line: quotes, escapes, and the operators >, >>, &&. */
  function tokenize(s) {
    var out = [], cur = '', q = null, had = false;
    for (var i = 0; i < s.length; i++) {
      var ch = s[i];
      if (q) { if (ch === q) q = null; else cur += ch; continue; }
      if (ch === '"' || ch === "'") { q = ch; had = true; continue; }
      if (/\s/.test(ch)) { if (cur || had) out.push(cur); cur = ''; had = false; continue; }
      if (ch === '>' || ch === '&') {
        if (cur || had) out.push(cur); cur = ''; had = false;
        if (ch === '>' && s[i + 1] === '>') { out.push({ op: '>>' }); i++; }
        else if (ch === '&' && s[i + 1] === '&') { out.push({ op: '&&' }); i++; }
        else out.push({ op: ch });
        continue;
      }
      cur += ch;
    }
    if (q) throw new Error('unclosed quote');
    if (cur || had) out.push(cur);
    return out;
  }

  // ---------- line diff / 3-way merge ----------
  function lcsMatch(a, b) {
    var n = a.length, m = b.length, dp = [], i, j;
    for (i = 0; i <= n; i++) { dp.push(new Array(m + 1).fill(0)); }
    for (i = n - 1; i >= 0; i--) for (j = m - 1; j >= 0; j--) dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    var match = new Array(n).fill(-1);
    i = 0; j = 0;
    while (i < n && j < m) { if (a[i] === b[j]) { match[i] = j; i++; j++; } else if (dp[i + 1][j] >= dp[i][j + 1]) i++; else j++; }
    return match;
  }
  /** Line diff: [{t:' '|'-'|'+', l}] */
  function diffLines(a, b) {
    a = lines(a); b = lines(b);
    var m = lcsMatch(a, b), out = [], j = 0;
    for (var i = 0; i < a.length; i++) {
      if (m[i] < 0) { out.push({ t: '-', l: a[i] }); continue; }
      while (j < m[i]) out.push({ t: '+', l: b[j++] });
      out.push({ t: ' ', l: a[i] }); j++;
    }
    while (j < b.length) out.push({ t: '+', l: b[j++] });
    return out;
  }
  /** "git diff --stat"-style lines between two trees: optional per-file rows, the summary, create/delete modes. */
  function diffStat(t0, t1, rows) {
    var files = Object.keys(Object.assign({}, t0, t1)).filter(function (p) { return t0[p] !== t1[p]; }).sort(), ins = 0, del = 0, out = [];
    var per = files.map(function (p) { var a = 0, d = 0; diffLines(t0[p] || '', t1[p] || '').forEach(function (x) { if (x.t === '+') a++; else if (x.t === '-') d++; }); ins += a; del += d; return { p: p, a: a, d: d }; });
    if (rows) {
      var wp = Math.max.apply(null, per.map(function (x) { return x.p.length; })), wn = String(Math.max.apply(null, per.map(function (x) { return x.a + x.d; }))).length;
      per.forEach(function (x) { var k = Math.min(1, 40 / Math.max(1, x.a + x.d)); out.push(' ' + x.p.padEnd(wp) + ' | ' + String(x.a + x.d).padStart(wn) + ' ' + '+'.repeat(Math.ceil(x.a * k)) + '-'.repeat(Math.ceil(x.d * k))); });
    }
    var s = ' ' + files.length + ' file' + (files.length === 1 ? '' : 's') + ' changed';
    if (ins || !del) s += ', ' + ins + ' insertion' + (ins === 1 ? '' : 's') + '(+)';   // Git shows both parts only when both are 0
    if (del || !ins) s += ', ' + del + ' deletion' + (del === 1 ? '' : 's') + '(-)';
    out.push(s);
    files.forEach(function (p) { if (t0[p] == null) out.push(' create mode 100644 ' + p); else if (t1[p] == null) out.push(' delete mode 100644 ' + p); });
    return out;
  }
  function eqArr(x, y) { return x.length === y.length && x.every(function (v, i) { return v === y[i]; }); }
  /** Line-level 3-way merge (diff3 sync points). Returns {text, conflict}. */
  function merge3(base, ours, theirs, oursName, theirsName) {
    var B = lines(base), O = lines(ours), T = lines(theirs);
    var mo = lcsMatch(B, O), mt = lcsMatch(B, T), out = [], conflict = false;
    var i = 0, io = 0, it = 0;
    while (true) {
      var k = i;
      while (k < B.length && !(mo[k] >= io && mt[k] >= it)) k++;
      var ko = k < B.length ? mo[k] : O.length, kt = k < B.length ? mt[k] : T.length;
      var cb = B.slice(i, k), co = O.slice(io, ko), ct = T.slice(it, kt);
      if (cb.length || co.length || ct.length) {
        if (eqArr(co, cb)) out = out.concat(ct);
        else if (eqArr(ct, cb) || eqArr(co, ct)) out = out.concat(co);
        else { conflict = true; out = out.concat(['<<<<<<< ' + oursName], co, ['======='], ct, ['>>>>>>> ' + theirsName]); }
      }
      if (k >= B.length) break;
      out.push(B[k]); i = k + 1; io = ko + 1; it = kt + 1;
    }
    return { text: out.length ? out.join('\n') + '\n' : '', conflict: conflict };
  }
  /** Merge whole trees. Returns {tree, conflicts:[paths]}. */
  function mergeTrees(base, ours, theirs, oursName, theirsName) {
    var tree = {}, conflicts = [], all = {};
    [base, ours, theirs].forEach(function (t) { keys(t).forEach(function (p) { all[p] = 1; }); });
    keys(all).sort().forEach(function (p) {
      var b = base[p], o = ours[p], t = theirs[p];
      if (o === t) { if (o != null) tree[p] = o; return; }
      if (o === b) { if (t != null) tree[p] = t; return; }
      if (t === b) { if (o != null) tree[p] = o; return; }
      if (o == null || t == null) {   // modify/delete: keep the modified version, flag a conflict
        tree[p] = o != null ? o : t; conflicts.push(p); return;
      }
      var m = merge3(b == null ? '' : b, o, t, oursName, theirsName);
      tree[p] = m.text; if (m.conflict) conflicts.push(p);
    });
    return { tree: tree, conflicts: conflicts };
  }

  // ---------- .gitignore ----------
  /** Does path (relative, '/'-separated) match the ignore rules text? Supports *, **, ?, leading /, trailing /, !negation, #comments. */
  function ignoreRules(text) {
    return lines(text).map(function (l) { return l.replace(/\s+$/, ''); }).filter(function (l) { return l && l[0] !== '#'; }).map(function (l) {
      var neg = l[0] === '!'; if (neg) l = l.slice(1);
      var dirOnly = /\/$/.test(l); if (dirOnly) l = l.slice(0, -1);
      var anchored = l.indexOf('/') >= 0; if (l[0] === '/') l = l.slice(1);
      var re = l.split('').map(function (c, i, a) {
        if (c === '*') { if (a[i + 1] === '*') return ''; return a[i - 1] === '*' ? '.*' : '[^/]*'; }
        if (c === '?') return '[^/]';
        return c.replace(/[.+^${}()|[\]\\]/g, '\\$&');
      }).join('').replace(/\.\*\//g, '(?:.*/)?');
      return { neg: neg, dirOnly: dirOnly, re: new RegExp('^' + (anchored ? '' : '(?:.*/)?') + re + (dirOnly ? '/' : '(?:/|$)')) };
    });
  }
  function isIgnored(rules, path) {
    function hit(p, dir) { var ign = false; rules.forEach(function (r) { if (r.re.test(dir && r.dirOnly ? p + '/' : p)) ign = !r.neg; }); return ign; }
    // like real Git: a file inside an ignored folder cannot be re-included with !pattern
    var parts = path.split('/');
    for (var i = 1; i < parts.length; i++) if (hit(parts.slice(0, i).join('/'), true)) return true;
    return hit(path, false);
  }

  // ---------- the world ----------
  function world(cfg) {
    cfg = cfg || {};
    var W = {
      objects: {},                 // sha -> commit {sha, parents, tree, msg, author, email, time}
      fs: {}, dirs: {},            // absolute path -> file text ; set of directories
      cwd: HOME, repos: {},        // dir -> local repo
      config: {}, clock: Date.UTC(2026, 8, 1, 7, 0), history: [], log: [], keyN: 0,
      server: { users: {}, orgs: {}, repos: {} },
      me: cfg.me || 'student', signedIn: cfg.signedIn !== false
    };
    W.dirs['/'] = W.dirs['/home'] = W.dirs[HOME] = 1;

    // ----- file system -----
    function abs(p, base) {
      if (!p || p === '~') return HOME;
      if (p.slice(0, 2) === '~/') p = HOME + p.slice(1);
      else if (p[0] !== '/') p = (base || W.cwd) + '/' + p;
      var parts = [];
      p.split('/').forEach(function (s) { if (!s || s === '.') return; if (s === '..') parts.pop(); else parts.push(s); });
      return '/' + parts.join('/');
    }
    function pretty(p) { return p === HOME ? '~' : p.indexOf(HOME + '/') === 0 ? '~' + p.slice(HOME.length) : p; }
    function mkdirp(d) { var a = ''; d.split('/').filter(Boolean).forEach(function (s) { a += '/' + s; W.dirs[a] = 1; }); }
    function writeFile(p, text) { mkdirp(p.slice(0, p.lastIndexOf('/')) || '/'); W.fs[p] = text; }
    function children(d) {
      var pre = d === '/' ? '/' : d + '/', out = {};
      keys(W.fs).concat(keys(W.dirs)).forEach(function (p) {
        if (p.indexOf(pre) === 0 && p !== d) { var rest = p.slice(pre.length).split('/'); out[rest[0]] = rest.length > 1 || W.dirs[pre + rest[0]] ? 'dir' : 'file'; }
      });
      return out;
    }
    function rmTree(p) {
      keys(W.fs).forEach(function (f) { if (f === p || f.indexOf(p + '/') === 0) delete W.fs[f]; });
      keys(W.dirs).forEach(function (f) { if (f === p || f.indexOf(p + '/') === 0) delete W.dirs[f]; });
      delete W.repos[p];
    }

    // ----- commits -----
    function tick() { W.clock += (7 + (keys(W.objects).length % 5) * 3) * 60000; return W.clock; }
    function makeCommit(tree, parents, msg, author, email, time) {
      var c = { parents: parents.filter(Boolean), tree: copy(tree), msg: msg, author: author, email: email, time: time || tick() };
      c.sha = sha1ish(JSON.stringify([c.parents, c.tree, c.msg, c.author, c.time]));
      W.objects[c.sha] = c;
      return c.sha;
    }
    function commit(sha) { return sha ? W.objects[sha] : null; }
    function ancestors(sha) {
      var seen = {}, stack = sha ? [sha] : [];
      while (stack.length) { var s = stack.pop(); if (seen[s]) continue; seen[s] = 1; (commit(s).parents || []).forEach(function (p) { stack.push(p); }); }
      return seen;
    }
    function isAncestor(a, b) { return !a || !!ancestors(b)[a]; }
    function mergeBase(a, b) {
      var A = ancestors(a), best = null;
      // newest common ancestor by time (good enough for the small histories here)
      keys(ancestors(b)).forEach(function (s) { if (A[s] && (!best || commit(s).time > commit(best).time)) best = s; });
      return best;
    }
    function short(sha) { return sha ? sha.slice(0, 7) : ''; }
    function fmtTime(t) {
      var d = new Date(t + 3 * 3600000);   // Finnish summer time, +0300
      return DAYS[d.getUTCDay()] + ' ' + MONTHS[d.getUTCMonth()] + ' ' + d.getUTCDate() + ' ' + ('0' + d.getUTCHours()).slice(-2) + ':' + ('0' + d.getUTCMinutes()).slice(-2) + ':00 ' + d.getUTCFullYear() + ' +0300';
    }

    // ----- local repositories -----
    function newRepo(dir, branch) {
      var r = { dir: dir, heads: {}, remoteRefs: {}, tags: {}, HEAD: { branch: branch || W.config['init.defaultBranch'] || 'master' }, index: {}, remotes: {}, upstream: {}, merge: null, stash: [], reflog: [] };
      W.repos[dir] = r; return r;
    }
    function repoAt(d) { d = d || W.cwd; while (true) { if (W.repos[d]) return W.repos[d]; if (d === '/') return null; d = d.slice(0, d.lastIndexOf('/')) || '/'; } }
    function headSha(r) { return r.HEAD.branch ? r.heads[r.HEAD.branch] || null : r.HEAD.sha; }
    function headTree(r) { var c = commit(headSha(r)); return c ? c.tree : {}; }
    function workTree(r) {
      var out = {}, pre = r.dir + '/';
      keys(W.fs).forEach(function (p) { if (p.indexOf(pre) === 0) out[p.slice(pre.length)] = W.fs[p]; });
      return out;
    }
    function ignoredFn(r) { var rules = ignoreRules(W.fs[r.dir + '/.gitignore'] || ''); return function (p) { return isIgnored(rules, p); }; }
    function status(r) {
      var head = headTree(r), idx = r.index, work = workTree(r), ign = ignoredFn(r), st = { staged: [], unstaged: [], untracked: [], ignored: [], conflicts: r.merge ? r.merge.conflicts.slice() : [] };
      keys(Object.assign({}, head, idx)).sort().forEach(function (p) {
        if (st.conflicts.indexOf(p) >= 0) return;
        if (!(p in head)) st.staged.push({ p: p, k: 'new file' });
        else if (!(p in idx)) st.staged.push({ p: p, k: 'deleted' });
        else if (head[p] !== idx[p]) st.staged.push({ p: p, k: 'modified' });
      });
      keys(idx).sort().forEach(function (p) {
        if (st.conflicts.indexOf(p) >= 0) return;
        if (!(p in work)) st.unstaged.push({ p: p, k: 'deleted' });
        else if (work[p] !== idx[p]) st.unstaged.push({ p: p, k: 'modified' });
      });
      keys(work).sort().forEach(function (p) { if (!(p in idx) && st.conflicts.indexOf(p) < 0) (ign(p) ? st.ignored : st.untracked).push({ p: p }); });
      st.clean = !st.staged.length && !st.unstaged.length && !st.untracked.length && !st.conflicts.length;
      return st;
    }
    function setWork(r, tree, prevTree) {
      // Replace tracked files: remove files tracked in prevTree but absent from tree, write the rest.
      keys(prevTree || {}).forEach(function (p) { if (!(p in tree)) delete W.fs[r.dir + '/' + p]; });
      keys(tree).forEach(function (p) { writeFile(r.dir + '/' + p, tree[p]); });
    }
    function moveHead(r, sha, why) {
      if (r.HEAD.branch) r.heads[r.HEAD.branch] = sha; else r.HEAD.sha = sha;
      r.reflog.unshift({ sha: sha, msg: why });
    }
    function resolveRef(r, ref) {
      if (!ref || ref === 'HEAD') return headSha(r);
      var m = /^(.+?)(~(\d*)|\^+)$/.exec(ref);
      if (m) {
        var s = resolveRef(r, m[1]), n = m[2][0] === '~' ? +(m[3] || 1) : m[2].length;
        while (s && n--) s = commit(s).parents[0] || null;
        return s;
      }
      var at = /^HEAD@\{(\d+)\}$/.exec(ref);
      if (at) return (r.reflog[+at[1]] || {}).sha || null;
      if (r.heads[ref]) return r.heads[ref];
      if (r.remoteRefs[ref]) return r.remoteRefs[ref];
      if (r.remoteRefs['origin/' + ref.replace(/^remotes\//, '')] && /^remotes\//.test(ref)) return r.remoteRefs['origin/' + ref.slice(8)];
      if (r.tags[ref]) return r.tags[ref];
      if (/^[0-9a-f]{4,40}$/.test(ref)) { var hit = keys(W.objects).filter(function (s) { return s.indexOf(ref) === 0; }); if (hit.length === 1) return hit[0]; }
      return null;
    }
    function decorations(r) {
      var d = {};
      function add(s, label) { if (s) (d[s] = d[s] || []).push(label); }
      if (!r.HEAD.branch) add(r.HEAD.sha, ['info', 'HEAD']);
      keys(r.heads).forEach(function (b) { add(r.heads[b], r.HEAD.branch === b ? ['info', 'HEAD -> ' + b] : ['ok', b]); });
      keys(r.remoteRefs).forEach(function (b) { add(r.remoteRefs[b], ['bad', b]); });
      keys(r.tags).forEach(function (t) { add(r.tags[t], ['warn', 'tag: ' + t]); });
      return d;
    }
    /** Commits reachable from the given tips, newest first. */
    function walk(tips) {
      var all = {};
      tips.forEach(function (t) { Object.assign(all, ancestors(t)); });
      return keys(all).map(commit).sort(function (a, b) { return b.time - a.time; });
    }

    // ----- github.com -----
    var S = W.server;
    function slugFromUrl(url) {
      var m = /github\.com[:/]+([^/]+)\/([^/]+?)(?:\.git)?\/?$/.exec(url || '');
      return m ? m[1] + '/' + m[2] : null;
    }
    function urlOf(slug, ssh) { return ssh ? 'git@github.com:' + slug + '.git' : 'https://github.com/' + slug + '.git'; }
    function ensureUser(login, name) { if (!S.users[login]) S.users[login] = { login: login, name: name || login, keys: [], twofa: false, tokens: [] }; return S.users[login]; }
    /** Effective repository role of a user (GitHub rules: owner/org owner > teams/collaborator/base permission; public = read). */
    function roleOf(login, slug) {
      var repo = S.repos[slug];
      if (!repo) return 'none';
      var owner = slug.split('/')[0], org = S.orgs[owner], r = 'none';
      if (owner === login) return 'admin';
      if (org) {
        if (org.owners.indexOf(login) >= 0) return 'admin';
        // org requires 2FA: members without it keep membership but reach nothing beyond public repos
        if (org.settings.require2fa && !(S.users[login] || {}).twofa) return repo.visibility === 'public' ? 'read' : 'none';
        if (org.members.indexOf(login) >= 0) r = maxRole(r, org.settings.basePermission);
        keys(org.teams).forEach(function (t) { var tm = org.teams[t]; if (tm.members.indexOf(login) >= 0 && tm.repos[slug]) r = maxRole(r, tm.repos[slug]); });
      }
      if (repo.collaborators[login]) r = maxRole(r, repo.collaborators[login]);
      if (repo.visibility === 'public' || (repo.visibility === 'internal' && org && (org.members.indexOf(login) >= 0))) r = maxRole(r, 'read');
      return r;
    }
    function isOrgOwner(login, owner) { var o = S.orgs[owner]; return !!o && o.owners.indexOf(login) >= 0; }
    var NEED = { view: 'read', clone: 'read', fork: 'read', issue: 'read', comment: 'read', triage: 'triage', push: 'write', merge: 'write', edit: 'write',
      settings: 'maintain', access: 'admin', rules: 'admin', visibility: 'admin', archive: 'admin', rename: 'maintain', delete: 'admin', transfer: 'admin' };
    /** Can login do action on slug? Returns true or a reason string. */
    function can(login, slug, action) {
      var repo = S.repos[slug];
      if (!repo) return 'not found';
      var role = roleOf(login, slug), owner = slug.split('/')[0], org = S.orgs[owner];
      if (roleRank(role) < roleRank(NEED[action] || 'admin')) return 'needs ' + NEED[action] + ' (you have ' + role + ')';
      if (repo.archived && ['push', 'merge', 'edit', 'issue', 'comment', 'triage'].indexOf(action) >= 0) return 'archived';
      // the org setting "Allow forking of private repositories" applies to everyone, owners included
      if (action === 'fork' && repo.visibility !== 'public' && org && !org.settings.membersCanFork) return 'forking of private repositories is disabled';
      if (org && !isOrgOwner(login, owner)) {
        if ((action === 'delete' || action === 'transfer') && !org.settings.membersCanDelete) return 'only organization owners can delete or transfer repositories';
        if (action === 'visibility' && !org.settings.membersCanChangeVisibility) return 'only organization owners can change visibility';
      }
      return true;
    }
    /** Rules that apply to a branch: [{…rule}] (bypass list = logins or "admins"). */
    function rulesFor(slug, branch, login) {
      var repo = S.repos[slug];
      return (repo.rules || []).filter(function (r) {
        if (r.enforcement === 'disabled') return false;
        var tgt = r.target || '~DEFAULT_BRANCH';
        var hit = tgt === '~ALL' || tgt === branch || (tgt === '~DEFAULT_BRANCH' && branch === repo.defaultBranch) || (/\*$/.test(tgt) && branch.indexOf(tgt.slice(0, -1)) === 0);
        if (!hit) return false;
        var by = r.bypass || [];
        return !(by.indexOf(login) >= 0 || (by.indexOf('admins') >= 0 && roleOf(login, slug) === 'admin'));
      });
    }
    /** Create a repository on the server from a simple description. */
    function makeRemote(slug, o, seed) {
      // seed: lesson setup history, one commit a day so dates differ like a real project
      o = o || {};
      var owner = slug.split('/')[0];
      if (!S.orgs[owner]) ensureUser(owner);
      var repo = S.repos[slug] = {
        slug: slug, owner: owner, name: slug.split('/')[1], description: o.description || '', visibility: o.visibility || 'private',
        refs: {}, tags: {}, defaultBranch: o.defaultBranch || 'main', collaborators: o.collaborators || {}, rules: o.rules || [],
        issues: o.issues || [], pulls: [], archived: !!o.archived, template: !!o.template, topics: o.topics || [], forkOf: o.forkOf || null,
        stars: o.stars || 0, nextNum: 1, created: W.clock, events: [],
        ci: o.ci || null, codeowners: o.codeowners || [], releases: o.releases || [], milestones: o.milestones || [],
        // GitHub's default labels; labels used by seeded issues are added as if someone had created them
        labels: o.labels || ['accessibility', 'bug', 'documentation', 'duplicate', 'enhancement', 'good first issue', 'help wanted', 'invalid', 'question', 'wontfix'], teamsFromOrg: true
      };
      repo.issues.forEach(function (is) { (is.labels || []).forEach(function (l) { if (repo.labels.indexOf(l) < 0) repo.labels.push(l); }); });
      var parent = null, tree = {};
      (o.commits || [{ msg: 'Initial commit', files: { 'README.md': '# ' + repo.name + '\n' } }]).forEach(function (c) {
        keys(c.files || {}).forEach(function (p) { if (c.files[p] == null) delete tree[p]; else tree[p] = c.files[p]; });
        var u = S.users[c.author || owner] || ensureUser(c.author || owner);
        parent = makeCommit(tree, [parent], c.msg, u.name, (c.author || owner) + '@users.noreply.github.com', seed && (W.clock += 86400000));
      });
      if (parent) repo.refs[repo.defaultBranch] = parent;   // commits: [] = an empty repository
      keys(o.branches || {}).forEach(function (b) {
        var bt = copy(tree), p = parent;
        o.branches[b].forEach(function (c) {
          keys(c.files || {}).forEach(function (f) { if (c.files[f] == null) delete bt[f]; else bt[f] = c.files[f]; });
          var u = S.users[c.author || owner] || ensureUser(c.author || owner);
          p = makeCommit(bt, [p], c.msg, u.name, (c.author || owner) + '@users.noreply.github.com', seed && (W.clock += 86400000));
        });
        repo.refs[b] = p;
      });
      repo.issues.forEach(function (is) { is.num = repo.nextNum++; is.state = is.state || 'open'; is.comments = is.comments || []; is.labels = is.labels || []; is.assignees = is.assignees || []; });
      (o.pulls || []).forEach(function (p) { openPull(slug, p); });
      return repo;
    }
    function openPull(slug, p) {
      var repo = S.repos[slug];
      var pr = { num: repo.nextNum++, title: p.title, body: p.body || '', author: p.author || W.me, head: p.head, headRepo: p.headRepo || slug, base: p.base || repo.defaultBranch,
        state: 'open', reviews: [], comments: p.comments || [], labels: p.labels || [], created: W.clock };
      repo.pulls.push(pr); return pr;
    }
    function pullChecks(slug, pr, login) {
      // What blocks merging: rules on the base branch (approvals, code owners) and conflicts.
      var repo = S.repos[slug], probs = [];
      var rules = rulesFor(slug, pr.base, login);
      var approvals = pr.reviews.filter(function (rv) { return rv.state === 'approved' && rv.user !== pr.author; });
      var changes = pr.reviews.some(function (rv) { return rv.state === 'changes'; });
      rules.forEach(function (r) {
        if (r.requirePR && approvals.length < (r.approvals || 0)) probs.push('Review required: at least ' + r.approvals + ' approving review' + (r.approvals > 1 ? 's' : '') + ' is required by reviewers with write access.');
        if (r.codeowners && !approvals.some(function (a) { return (repo.codeowners || []).indexOf(a.user) >= 0; })) probs.push('Waiting on code owner review from ' + (repo.codeowners || []).join(', ') + '.');
      });
      if (changes) probs.push('Changes requested by a reviewer.');
      var hs = S.repos[pr.headRepo].refs[pr.head], bs = repo.refs[pr.base];
      if (rules.some(function (r) { return r.requireChecks; }) && repo.ci && !ciResult(slug, hs).ok) probs.push('Required status check “' + repo.ci.name + '” is failing.');
      if (hs && bs && !isAncestor(bs, hs)) {
        var mb = mergeBase(bs, hs), m = mergeTrees(commit(mb) ? commit(mb).tree : {}, commit(bs).tree, commit(hs).tree, pr.base, pr.head);
        if (m.conflicts.length) probs.push('This branch has conflicts that must be resolved: ' + m.conflicts.join(', '));
      }
      return probs;
    }
    /** Simulated GitHub Actions: repo.ci = {name, test(tree) -> {ok, log:[lines]}} evaluated on a commit. */
    function ciResult(slug, sha) {
      var repo = S.repos[slug], c = commit(sha);
      if (!repo || !repo.ci || !c) return { ok: true, log: [] };
      var r = repo.ci.test(c.tree) || {};
      return { ok: !!r.ok, log: r.log || [], name: repo.ci.name };
    }
    /** Merge a pull request. method: 'merge' (merge commit), 'squash' (one new commit), 'rebase' (replay commits). */
    function mergePull(slug, num, login, method) {
      var repo = S.repos[slug], pr = repo.pulls.filter(function (p) { return p.num === num; })[0];
      if (!pr || pr.state !== 'open') return 'not open';
      var ok = can(login, slug, 'merge'); if (ok !== true) return ok;
      var probs = pullChecks(slug, pr, login); if (probs.length) return probs[0];
      var hs = S.repos[pr.headRepo].refs[pr.head], bs = repo.refs[pr.base];
      var mb = mergeBase(bs, hs), m = mergeTrees(commit(mb) ? commit(mb).tree : {}, commit(bs).tree, commit(hs).tree, pr.base, pr.head);
      var u = ensureUser(login), email = login + '@users.noreply.github.com';
      if (method === 'squash') repo.refs[pr.base] = makeCommit(m.tree, [bs], pr.title + ' (#' + num + ')', u.name, email);
      else if (method === 'rebase') {
        var B = ancestors(bs), tip = bs;
        walk([hs]).filter(function (c) { return !B[c.sha] && c.parents.length < 2; }).reverse().forEach(function (c) {
          var pt = commit(c.parents[0]) ? commit(c.parents[0]).tree : {};
          tip = makeCommit(mergeTrees(pt, commit(tip).tree, c.tree, 'base', 'pr').tree, [tip], c.msg, c.author, c.email);
        });
        repo.refs[pr.base] = tip;
      } else repo.refs[pr.base] = makeCommit(m.tree, [bs, hs], 'Merge pull request #' + num + ' from ' + (pr.headRepo === slug ? slug.split('/')[0] : pr.headRepo.split('/')[0]) + '/' + pr.head + '\n\n' + pr.title, u.name, email);
      pr.state = 'merged'; pr.mergedBy = login; pr.method = method || 'merge';
      // "Fixes #3" in the title or body closes the issue
      (pr.title + ' ' + pr.body).replace(/(?:fix(?:es|ed)?|close[sd]?|resolve[sd]?) #(\d+)/gi, function (x, n) {
        repo.issues.forEach(function (is) { if (is.num === +n) is.state = 'closed'; });
      });
      return true;
    }
    /** Commit straight to a server branch (web editor / upload). */
    function webCommit(slug, branch, changes, msg, login) {
      var repo = S.repos[slug], base = repo.refs[branch], tree = copy(commit(base) ? commit(base).tree : {});
      keys(changes).forEach(function (p) { if (changes[p] == null) delete tree[p]; else tree[p] = changes[p]; });
      var u = ensureUser(login);
      repo.refs[branch] = makeCommit(tree, [base], msg, u.name, login + '@users.noreply.github.com');
      return repo.refs[branch];
    }

    // ----- output helpers -----
    var out;
    function say() { for (var i = 0; i < arguments.length; i++) out.push(arguments[i]); }
    function fail(msg) { say(['bad', msg]); return 1; }
    function needRepo() { var r = repoAt(); if (!r) { say(['bad', 'fatal: not a git repository (or any of the parent directories): .git']); } return r; }
    function upstreamLine(r) {
      var b = r.HEAD.branch, up = b && r.upstream[b];
      if (!up || !r.remoteRefs[up]) return null;
      var me = r.heads[b], them = r.remoteRefs[up];
      if (me === them) return "Your branch is up to date with '" + up + "'.";
      var A = ancestors(me), T = ancestors(them);
      var ahead = keys(A).filter(function (s) { return !T[s]; }).length, behind = keys(T).filter(function (s) { return !A[s]; }).length;
      if (ahead && behind) return "Your branch and '" + up + "' have diverged,\nand have " + ahead + ' and ' + behind + ' different commits each, respectively.';
      if (ahead) return "Your branch is ahead of '" + up + "' by " + ahead + ' commit' + (ahead > 1 ? 's' : '') + '.\n  (use "git push" to publish your local commits)';
      return "Your branch is behind '" + up + "' by " + behind + ' commit' + (behind > 1 ? 's' : '') + ', and can be fast-forwarded.\n  (use "git pull" to update your local branch)';
    }

    // ----- git subcommands -----
    var G = {};
    function flags(args) {
      var f = {}, rest = [];
      for (var i = 0; i < args.length; i++) {
        var a = args[i];
        if (a === '-m' || a === '-C' || a === '-t' || a === '-n' || a === '--source' || a === '-c' || a === '-b' || a === '-B' || a === '--message') { f[a] = args[++i]; if (a === '--message') f['-m'] = f[a]; }
        else if (/^--source=/.test(a)) f['--source'] = a.slice(9);
        else if (/^-[a-zA-Z]{2,}$/.test(a) && a !== '-am') a.slice(1).split('').forEach(function (c) { f['-' + c] = true; });
        else if (a === '-am') { f['-a'] = true; f['-m'] = args[++i]; }
        else if (a[0] === '-' && a.length > 1) f[a] = true;
        else rest.push(a);
      }
      return { f: f, rest: rest };
    }
    function identity() { return { name: W.config['user.name'], email: W.config['user.email'] }; }

    G.version = function () { say('git version 2.51.0.windows.1'); };
    G.help = function () {
      say('usage: git <command> [<args>]', '', ['bold', 'Commands this simulator understands:'],
        '  init, clone, config, status, add, rm, mv, restore, commit, log, show, diff,',
        '  branch, switch, checkout, merge, rebase, cherry-pick, revert, reset, stash, tag,',
        '  remote, fetch, pull, push, reflog, cat-file',
        ['muted', 'Shell: ls, cd, pwd, cat, echo "text" > file, touch, mkdir, rm, code <file>, clear, history']);
    };
    G.config = function (a) {
      var p = flags(a), k = p.rest[0], v = p.rest.slice(1).join(' ');
      if (p.f['--list'] || p.f['-l']) { keys(W.config).forEach(function (x) { say(x + '=' + W.config[x]); }); return; }
      if (!k) return fail('usage: git config [--global] <name> [<value>]');
      if (p.f['--unset']) { delete W.config[k]; return; }
      if (!v) { if (W.config[k] != null) say(W.config[k]); else return 1; return; }
      if (!/^[a-z]+\.[a-zA-Z.]+$/.test(k)) return fail("error: invalid key: " + k);
      W.config[k] = v;
    };
    G.init = function (a) {
      var p = flags(a), dir = abs(p.rest[0] || '.');
      mkdirp(dir);
      var re = !!W.repos[dir];
      if (!re) newRepo(dir, p.f['-b'] || null);
      say((re ? 'Reinitialized existing' : 'Initialized empty') + ' Git repository in ' + pretty(dir) + '/.git/');
      if (!re && !W.config['init.defaultBranch'] && !p.f['-b']) say(['muted', "hint: Using 'master' as the name for the initial branch. Many teams use 'main':"], ['muted', 'hint:   git config --global init.defaultBranch main']);
    };
    G.status = function (a) {
      var r = needRepo(); if (!r) return 1;
      var st = status(r), shortF = flags(a).f['-s'] || flags(a).f['--short'];
      if (shortF) {
        st.conflicts.forEach(function (x) { say([['bad', 'UU'], ['', ' ' + x]]); });
        var seen = {};
        st.staged.forEach(function (x) { seen[x.p] = [x.k === 'new file' ? 'A' : x.k[0].toUpperCase(), ' ']; });
        st.unstaged.forEach(function (x) { seen[x.p] = [(seen[x.p] || [' '])[0], x.k[0].toUpperCase()]; });
        keys(seen).sort().forEach(function (p) { say([['ok', seen[p][0]], ['bad', seen[p][1]], ['', ' ' + p]]); });
        st.untracked.forEach(function (x) { say([['bad', '??'], ['', ' ' + x.p]]); });
        return;
      }
      say(r.HEAD.branch ? 'On branch ' + r.HEAD.branch : [['bad', 'HEAD detached at ' + short(r.HEAD.sha)]]);
      var up = upstreamLine(r); if (up) lines(up).forEach(function (l) { say(l); });
      if (!headSha(r)) say('', 'No commits yet');
      if (r.merge) say('', 'You have unmerged paths.', '  (fix conflicts and run "git commit")', '  (use "git merge --abort" to abort the merge)');
      if (st.staged.length) { say('', 'Changes to be committed:', ['muted', '  (use "git restore --staged <file>..." to unstage)']); st.staged.forEach(function (x) { say(['ok', '\t' + (x.k + ':').padEnd(12) + x.p]); }); }
      if (st.conflicts.length) { say('', 'Unmerged paths:', ['muted', '  (use "git add <file>..." to mark resolution)']); st.conflicts.forEach(function (x) { say(['bad', '\tboth modified:   ' + x]); }); }
      if (st.unstaged.length) { say('', 'Changes not staged for commit:', ['muted', '  (use "git add <file>..." to update what will be committed)'], ['muted', '  (use "git restore <file>..." to discard changes in working directory)']); st.unstaged.forEach(function (x) { say(['bad', '\t' + (x.k + ':').padEnd(12) + x.p]); }); }
      if (st.untracked.length) { say('', 'Untracked files:', ['muted', '  (use "git add <file>..." to include in what will be committed)']); st.untracked.forEach(function (x) { say(['bad', '\t' + x.p]); }); }
      if (st.clean) say('', headSha(r) ? 'nothing to commit, working tree clean' : 'nothing to commit (create/copy files and use "git add" to track)');
      else if (!st.staged.length && !st.conflicts.length) say('', st.unstaged.length ? 'no changes added to commit (use "git add" and/or "git commit -a")' : 'nothing added to commit but untracked files present (use "git add" to track)');
    };
    function pathsIn(r, specs) {
      // Expand pathspecs (., dir/, file, *.ext) to repo-relative paths over work tree + index.
      var work = workTree(r), all = keys(Object.assign({}, work, r.index, headTree(r))), rel = W.cwd === r.dir ? '' : W.cwd.slice(r.dir.length + 1) + '/';
      var hits = {};
      specs.forEach(function (s) {
        if (s === '-A' || s === '--all') { all.forEach(function (p) { hits[p] = 1; }); return; }
        var full = abs(s), rp = full === r.dir ? '' : full.slice(r.dir.length + 1);
        if (/[*?]/.test(s)) {
          var re = new RegExp('^' + (rel + s).replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^/]*').replace(/\?/g, '.') + '$');
          all.forEach(function (p) { if (re.test(p)) hits[p] = 1; }); return;
        }
        all.forEach(function (p) { if (!rp || p === rp || p.indexOf(rp + '/') === 0) hits[p] = 1; });
        if (!all.some(function (p) { return !rp || p === rp || p.indexOf(rp + '/') === 0; })) hits['?' + s] = 1;
      });
      return keys(hits);
    }
    G.add = function (a) {
      var r = needRepo(); if (!r) return 1;
      var p = flags(a), specs = p.rest.slice(); if (p.f['-A'] || p.f['--all']) specs.push('-A');
      if (!specs.length) { say('Nothing specified, nothing added.', ['muted', "hint: Maybe you wanted to say 'git add .'?"]); return; }
      var work = workTree(r), ign = ignoredFn(r), bad = null, ignoredHit = [];
      pathsIn(r, specs).forEach(function (x) {
        if (x[0] === '?') { bad = bad || x.slice(1); return; }
        if (!(x in r.index) && ign(x) && !p.f['-f']) { if (specs.indexOf(x) >= 0 || specs.some(function (s) { return abs(s) === r.dir + '/' + x; })) ignoredHit.push(x); return; }
        if (x in work) r.index[x] = work[x]; else delete r.index[x];
        if (r.merge) r.merge.conflicts = r.merge.conflicts.filter(function (c) { return c !== x; });
      });
      if (bad) return fail("fatal: pathspec '" + bad + "' did not match any files");
      if (ignoredHit.length) say('The following paths are ignored by one of your .gitignore files:', ignoredHit.join('\n'), ['muted', 'hint: Use -f if you really want to add them.']);
    };
    G.rm = function (a) {
      var r = needRepo(); if (!r) return 1;
      var p = flags(a);
      pathsIn(r, p.rest).forEach(function (x) {
        if (x[0] === '?') return;
        delete r.index[x]; if (!p.f['--cached']) delete W.fs[r.dir + '/' + x];
        say("rm '" + x + "'");
      });
    };
    G.mv = function (a) {
      var r = needRepo(); if (!r) return 1;
      var from = abs(a[0]), to = abs(a[1]);
      if (W.fs[from] == null) return fail('fatal: bad source, source=' + a[0]);
      writeFile(to, W.fs[from]); delete W.fs[from];
      var rf = from.slice(r.dir.length + 1), rt = to.slice(r.dir.length + 1);
      if (rf in r.index) { r.index[rt] = r.index[rf]; delete r.index[rf]; }
    };
    G.restore = function (a) {
      var r = needRepo(); if (!r) return 1;
      var p = flags(a), src = p.f['--source'] || p.f['-s'];
      var srcTree = src ? (commit(resolveRef(r, src)) || {}).tree : null;
      if (src && !srcTree) return fail("fatal: could not resolve '" + src + "'");
      var paths = pathsIn(r, p.rest);
      if (!p.rest.length) return fail('fatal: you must specify path(s) to restore');
      paths.forEach(function (x) {
        if (x[0] === '?') { say(['bad', "error: pathspec '" + x.slice(1) + "' did not match any file(s) known to git"]); return; }
        if (p.f['--staged'] || p.f['-S']) { var ht = srcTree || headTree(r); if (x in ht) r.index[x] = ht[x]; else delete r.index[x]; }
        else { var from = srcTree || r.index; if (x in from) writeFile(r.dir + '/' + x, from[x]); }
      });
    };
    G.commit = function (a) {
      var r = needRepo(); if (!r) return 1;
      var p = flags(a), id = identity();
      if (r.merge && r.merge.conflicts.length) return fail('error: Committing is not possible because you have unmerged files.\nhint: Fix them up in the work tree, and then use \'git add <file>\'\nhint: as appropriate to mark resolution and make a commit.');
      if (!id.name || !id.email) {
        say('Author identity unknown', '', '*** Please tell me who you are.', '', 'Run', '', '  git config --global user.email "you@example.com"', '  git config --global user.name "Your Name"', '', 'to set your account\'s default identity.');
        return fail("fatal: unable to auto-detect email address");
      }
      if (p.f['-a']) keys(r.index).forEach(function (x) { var w = W.fs[r.dir + '/' + x]; if (w == null) delete r.index[x]; else r.index[x] = w; });
      var msg = p.f['-m'];
      if (p.f['--amend']) {
        var old = commit(headSha(r)); if (!old) return fail('fatal: You have nothing to amend.');
        var ns = makeCommit(r.index, old.parents, msg || old.msg, id.name, id.email);
        moveHead(r, ns, 'commit (amend): ' + (msg || old.msg));
        say('[' + (r.HEAD.branch || 'detached HEAD') + ' ' + short(ns) + '] ' + (msg || old.msg));
        return;
      }
      if (msg == null && !r.merge) return fail('Aborting: this simulator needs the message on the command line:\n  git commit -m "Describe what you changed"\n(Real Git opens a text editor for the message when -m is missing.)');
      if (msg === '') return fail('Aborting commit due to empty commit message.');
      var st = status(r);
      if (!st.staged.length && !r.merge) {
        G.status([]);   // real Git prints the status when nothing is staged
        return 1;
      }
      var parents = [headSha(r)];
      if (r.merge) { parents.push(r.merge.theirs); msg = msg || r.merge.msg; }
      var root = !headSha(r);
      var sha = makeCommit(r.index, parents, msg, id.name, id.email);
      moveHead(r, sha, (r.merge ? 'commit (merge): ' : root ? 'commit (initial): ' : 'commit: ') + msg.split('\n')[0]);
      r.merge = null;
      say('[' + (r.HEAD.branch || 'detached HEAD') + (root ? ' (root-commit)' : '') + ' ' + short(sha) + '] ' + msg.split('\n')[0]);
      if (parents.length < 2) diffStat(commit(parents[0]) ? commit(parents[0]).tree : {}, commit(sha).tree).forEach(function (l) { say(l); });
    };
    function graphPrefix(commits) {
      // Minimal ASCII graph: one column per open line of history.
      var cols = [], rows = {};
      commits.forEach(function (c) {
        var i = cols.indexOf(c.sha); if (i < 0) { cols.push(c.sha); i = cols.length - 1; }
        rows[c.sha] = { line: cols.map(function (s, j) { return j === i ? '*' : '|'; }).join(' ') + ' ', extra: [] };
        var ps = c.parents.slice();
        cols[i] = ps[0] || null;
        for (var k = 1; k < ps.length; k++) { if (cols.indexOf(ps[k]) < 0) { cols.splice(i + k, 0, ps[k]); rows[c.sha].extra.push(cols.map(function (s, j) { return j === i ? '|' : j === i + k ? '\\' : '|'; }).join(' ')); } }
        // join duplicate columns
        for (var a = 0; a < cols.length; a++) for (var b = a + 1; b < cols.length; b++) if (cols[a] && cols[a] === cols[b]) {
          rows[c.sha].extra.push(cols.map(function (s, j) { return j === b ? '/' : '|'; }).slice(0, cols.length).join(' ')); cols.splice(b, 1); b--;
        }
        cols = cols.filter(function (s) { return s !== null; });
      });
      return rows;
    }
    G.log = function (a) {
      var r = needRepo(); if (!r) return 1;
      var n = Infinity;
      a = a.filter(function (x) { if (/^-\d+$/.test(x)) { n = +x.slice(1); return false; } return true; });
      var p = flags(a); if (p.f['-n']) n = +p.f['-n'];
      var tips = p.f['--all'] ? keys(r.heads).map(function (b) { return r.heads[b]; }).concat(keys(r.remoteRefs).map(function (b) { return r.remoteRefs[b]; }), keys(r.tags).map(function (t) { return r.tags[t]; }), [headSha(r)])
        : [p.rest.filter(function (x) { return !/^-\d+$/.test(x); })[0] ? resolveRef(r, p.rest.filter(function (x) { return !/^-\d+$/.test(x); })[0]) : headSha(r)];
      tips = tips.filter(Boolean);
      if (!tips.length) return fail("fatal: your current branch '" + (r.HEAD.branch || 'HEAD') + "' does not have any commits yet");
      var cs = walk(tips).slice(0, n), dec = decorations(r), oneline = p.f['--oneline'], graph = p.f['--graph'] ? graphPrefix(cs) : null;
      cs.forEach(function (c, i) {
        var g = graph ? graph[c.sha].line : '';
        var d = dec[c.sha] ? [['warn', ' (']].concat(dec[c.sha].map(function (x, k) { return [x[0], (k ? ', ' : '') + x[1]]; }), [['warn', ')']]) : [];
        if (oneline) say([['', g], ['warn', short(c.sha)]].concat(d, [['', ' ' + c.msg.split('\n')[0]]]));
        else {
          say([['', g], ['warn', 'commit ' + c.sha]].concat(d));
          if (c.parents.length > 1) say(g.replace('*', '|') + 'Merge: ' + c.parents.map(short).join(' '));
          say(g.replace('*', '|') + 'Author: ' + c.author + ' <' + c.email + '>', g.replace('*', '|') + 'Date:   ' + fmtTime(c.time), g.replace('*', '|'));
          c.msg.split('\n').forEach(function (l) { say(g.replace('*', '|') + '    ' + l); });
          if (i < cs.length - 1) say(g.replace('*', '|'));
        }
        if (graph) graph[c.sha].extra.forEach(function (e) { say(e.replace(/\| ([\\/])/g, '|$1')); });
      });
    };
    function sayDiff(path, a, b) {
      if (a === b) return;
      say(['bold', 'diff --git a/' + path + ' b/' + path]);
      if (a == null) say(['bold', 'new file mode 100644']);
      if (b == null) say(['bold', 'deleted file mode 100644']);
      say(['bold', '--- ' + (a == null ? '/dev/null' : 'a/' + path)], ['bold', '+++ ' + (b == null ? '/dev/null' : 'b/' + path)]);
      var d = diffLines(a || '', b || ''), shown = d.map(function (x, i) {
        return x.t !== ' ' || d.slice(Math.max(0, i - 3), i + 4).some(function (y) { return y.t !== ' '; });
      });
      // Real unified-diff hunks: "@@ -oldStart,oldCount +newStart,newCount @@" (3 lines of context).
      var oldN = 0, newN = 0, hunk = null;
      function flush() {
        if (!hunk) return;
        var os = hunk.oc ? hunk.os : hunk.os - 1, ns = hunk.nc ? hunk.ns : hunk.ns - 1;
        say(['info', '@@ -' + os + (hunk.oc === 1 ? '' : ',' + hunk.oc) + ' +' + ns + (hunk.nc === 1 ? '' : ',' + hunk.nc) + ' @@']);
        hunk.lines.forEach(function (l) { say(l); });
        hunk = null;
      }
      d.forEach(function (x, i) {
        if (x.t !== '+') oldN++;
        if (x.t !== '-') newN++;
        if (!shown[i]) { flush(); return; }
        if (!hunk) hunk = { os: x.t === '+' ? oldN + 1 : oldN, ns: x.t === '-' ? newN + 1 : newN, oc: 0, nc: 0, lines: [] };
        if (x.t !== '+') hunk.oc++;
        if (x.t !== '-') hunk.nc++;
        hunk.lines.push([x.t === '+' ? 'ok' : x.t === '-' ? 'bad' : '', x.t + x.l]);
      });
      flush();
    }
    G.diff = function (a) {
      var r = needRepo(); if (!r) return 1;
      var p = flags(a), staged = p.f['--staged'] || p.f['--cached'];
      var refs = p.rest.filter(function (x) { return resolveRef(r, x); });
      var filt = p.rest.filter(function (x) { return refs.indexOf(x) < 0 && x !== '--'; });
      var A, B;
      if (refs.length === 2) { A = commit(resolveRef(r, refs[0])).tree; B = commit(resolveRef(r, refs[1])).tree; }
      else if (refs.length === 1) { A = commit(resolveRef(r, refs[0])).tree; B = staged ? r.index : workTree(r); }
      else if (staged) { A = headTree(r); B = r.index; }
      else { A = r.index; B = {}; var wt = workTree(r); keys(r.index).forEach(function (x) { B[x] = wt[x]; }); }
      var fset = filt.length ? pathsIn(r, filt) : null;
      keys(Object.assign({}, A, B)).sort().forEach(function (x) { if (!fset || fset.indexOf(x) >= 0) sayDiff(x, A[x], B[x]); });
    };
    G.show = function (a) {
      var r = needRepo(); if (!r) return 1;
      var ref = a.filter(function (x) { return x[0] !== '-'; })[0] || 'HEAD';
      var m = /^(.+):(.+)$/.exec(ref);
      if (m) { var cc = commit(resolveRef(r, m[1])); if (!cc || cc.tree[m[2]] == null) return fail("fatal: path '" + m[2] + "' does not exist in '" + m[1] + "'"); lines(cc.tree[m[2]]).forEach(function (l) { say(l); }); return; }
      var c = commit(resolveRef(r, ref)); if (!c) return fail("fatal: ambiguous argument '" + ref + "': unknown revision or path not in the working tree.\nUse '--' to separate paths from revisions, like this:\n'git <command> [<revision>...] -- [<file>...]'");
      say(['warn', 'commit ' + c.sha], 'Author: ' + c.author + ' <' + c.email + '>', 'Date:   ' + fmtTime(c.time), '');
      c.msg.split('\n').forEach(function (l) { say('    ' + l); }); say('');
      var pt = commit(c.parents[0]) ? commit(c.parents[0]).tree : {};
      keys(Object.assign({}, pt, c.tree)).sort().forEach(function (x) { sayDiff(x, pt[x], c.tree[x]); });
    };
    G.branch = function (a) {
      var r = needRepo(); if (!r) return 1;
      var p = flags(a);
      if (p.f['-d'] || p.f['-D'] || p.f['--delete']) {
        var b = p.rest[0];
        if (!r.heads[b]) return fail("error: branch '" + b + "' not found");
        if (r.HEAD.branch === b) return fail("error: cannot delete branch '" + b + "' used by worktree at '" + pretty(r.dir) + "'");
        if (!p.f['-D'] && !isAncestor(r.heads[b], headSha(r))) return fail("error: the branch '" + b + "' is not fully merged.\nhint: If you are sure you want to delete it, run 'git branch -D " + b + "'");
        say('Deleted branch ' + b + ' (was ' + short(r.heads[b]) + ').'); delete r.heads[b]; return;
      }
      if (p.f['-m'] || p.f['-M']) {
        var from = p.rest.length > 1 ? p.rest[0] : r.HEAD.branch, to = p.rest.length > 1 ? p.rest[1] : (p.rest[0] || p.f['-m'] || p.f['-M']);
        if (typeof to !== 'string') return fail('usage: git branch -m <new-name>');
        if (r.heads[from] !== undefined || r.HEAD.branch === from) { r.heads[to] = r.heads[from]; delete r.heads[from]; if (r.HEAD.branch === from) r.HEAD.branch = to; if (r.heads[to] === undefined) delete r.heads[to]; }
        return;
      }
      if (p.rest[0]) {
        var nb = p.rest[0];
        if (!/^[\w.\/-]+$/.test(nb)) return fail("fatal: '" + nb + "' is not a valid branch name");
        if (r.heads[nb]) return fail("fatal: a branch named '" + nb + "' already exists");
        var at = resolveRef(r, p.rest[1] || 'HEAD'); if (!at) return fail("fatal: not a valid object name: '" + (p.rest[1] || r.HEAD.branch) + "'");
        r.heads[nb] = at; return;
      }
      var list = keys(r.heads).sort();
      if (!r.HEAD.branch) say(['ok', '* (HEAD detached at ' + short(r.HEAD.sha) + ')']);
      list.forEach(function (b) { say(b === r.HEAD.branch ? ['ok', '* ' + b] : '  ' + b + (p.f['-v'] ? ' ' + short(r.heads[b]) + ' ' + commit(r.heads[b]).msg.split('\n')[0] : '')); });
      if (p.f['-a'] || p.f['-r']) keys(r.remoteRefs).sort().forEach(function (b) { say(['bad', '  remotes/' + b]); });
    };
    function checkoutTree(r, sha) {
      // Refuse to overwrite uncommitted changes to files that differ between the two commits.
      var st = status(r), from = headTree(r), to = commit(sha) ? commit(sha).tree : {};
      var dirty = st.staged.concat(st.unstaged).map(function (x) { return x.p; }).filter(function (x) { return from[x] !== to[x]; });
      if (dirty.length) { say(['bad', 'error: Your local changes to the following files would be overwritten by checkout:'], '\t' + dirty.join('\n\t'), 'Please commit your changes or stash them before you switch branches.', 'Aborting'); return false; }
      var keep = {};   // carry uncommitted edits over
      st.unstaged.concat(st.staged).forEach(function (x) { keep[x.p] = 1; });
      var newIdx = copy(to); keys(keep).forEach(function (x) { if (x in r.index) newIdx[x] = r.index[x]; });
      var wt = copy(to); keys(keep).forEach(function (x) { var w = W.fs[r.dir + '/' + x]; if (w != null) wt[x] = w; else delete wt[x]; });
      setWork(r, wt, from); r.index = newIdx;
      return true;
    }
    function switchTo(r, target, create, detachOk) {
      if (create) {
        if (r.heads[target]) return fail("fatal: a branch named '" + target + "' already exists");
        if (!/^[\w.\/-]+$/.test(target)) return fail("fatal: '" + target + "' is not a valid branch name");
        if (headSha(r)) r.heads[target] = headSha(r);
        var prev = r.HEAD.branch || short(r.HEAD.sha);
        r.HEAD = { branch: target }; if (headSha(r)) r.reflog.unshift({ sha: headSha(r), msg: 'checkout: moving from ' + prev + ' to ' + target });
        say("Switched to a new branch '" + target + "'"); return;
      }
      if (r.HEAD.branch === target) { say("Already on '" + target + "'"); return; }
      var sha = r.heads[target];
      if (!sha && r.remoteRefs['origin/' + target]) {    // auto-create a tracking branch, like real Git
        if (!checkoutTree(r, r.remoteRefs['origin/' + target])) return 1;
        r.heads[target] = r.remoteRefs['origin/' + target]; r.upstream[target] = 'origin/' + target; r.HEAD = { branch: target };
        r.reflog.unshift({ sha: r.heads[target], msg: 'checkout: moving to ' + target });
        say("branch '" + target + "' set up to track 'origin/" + target + "'.", "Switched to a new branch '" + target + "'"); return;
      }
      if (!sha) {
        var any = resolveRef(r, target);
        if (!any || !detachOk) return fail(detachOk ? "error: pathspec '" + target + "' did not match any file(s) known to git" : "fatal: invalid reference: " + target);
        if (!checkoutTree(r, any)) return 1;
        r.HEAD = { sha: any }; r.reflog.unshift({ sha: any, msg: 'checkout: moving to ' + target });
        say("Note: switching to '" + target + "'.", '', "You are in 'detached HEAD' state. You can look around, make experimental", 'changes and commit them, and you can discard any commits you make in this', 'state without impacting any branches by switching back to a branch.', '', 'HEAD is now at ' + short(any) + ' ' + commit(any).msg.split('\n')[0]);
        return;
      }
      if (!checkoutTree(r, sha)) return 1;
      var from2 = r.HEAD.branch || short(r.HEAD.sha);
      r.HEAD = { branch: target }; r.reflog.unshift({ sha: sha, msg: 'checkout: moving from ' + from2 + ' to ' + target });
      say("Switched to branch '" + target + "'");
      var up = upstreamLine(r); if (up) say(lines(up)[0]);
    }
    G.switch = function (a) {
      var r = needRepo(); if (!r) return 1;
      var p = flags(a);
      if (p.f['-c'] || p.f['--create']) return switchTo(r, p.f['-c'] || p.rest[0], true);
      if (!p.rest[0]) return fail('fatal: missing branch or commit argument');
      return switchTo(r, p.rest[0], false, !!p.f['--detach']);
    };
    G.checkout = function (a) {
      var r = needRepo(); if (!r) return 1;
      var p = flags(a);
      if (p.f['-b']) return switchTo(r, p.f['-b'], true);
      if (a[0] === '--' || (p.rest[0] && !resolveRef(r, p.rest[0]) && !r.remoteRefs['origin/' + p.rest[0]])) return G.restore(a.filter(function (x) { return x !== '--'; }));
      if (!p.rest[0]) return fail('error: you must specify a branch to switch to');
      return switchTo(r, p.rest[0], false, true);
    };
    function doMerge(r, theirSha, theirName, ffOnly, noFf) {
      var ours = headSha(r);
      if (!theirSha) return fail('merge: ' + theirName + ' - not something we can merge');
      if (isAncestor(theirSha, ours)) { say('Already up to date.'); return; }
      var st = status(r);
      if (st.staged.length || st.unstaged.length) return fail('error: Your local changes would be overwritten by merge.\nPlease commit your changes or stash them before you merge.\nAborting');
      if (!ours || (isAncestor(ours, theirSha) && !noFf)) {
        if (!checkoutTree(r, theirSha)) return 1;
        moveHead(r, theirSha, 'merge ' + theirName + ': Fast-forward');
        say('Updating ' + short(ours) + '..' + short(theirSha), 'Fast-forward');
        var t0 = commit(ours) ? commit(ours).tree : {}, t1 = commit(theirSha).tree;
        diffStat(t0, t1, true).forEach(function (l) { say(l); });
        return;
      }
      if (ffOnly) return fail('fatal: Not possible to fast-forward, aborting.');
      var base = mergeBase(ours, theirSha), m = mergeTrees(commit(base) ? commit(base).tree : {}, headTree(r), commit(theirSha).tree, 'HEAD', theirName);
      var msg = "Merge branch '" + theirName.replace(/^origin\//, '') + "'" + (/^origin\//.test(theirName) ? " of " + (r.remotes.origin || 'origin') : '');
      setWork(r, m.tree, headTree(r)); r.index = copy(m.tree);
      if (m.conflicts.length) {
        m.conflicts.forEach(function (x) { delete r.index[x]; say('Auto-merging ' + x, ['bad', 'CONFLICT (content): Merge conflict in ' + x]); });
        r.merge = { theirs: theirSha, msg: msg, conflicts: m.conflicts };
        say('Automatic merge failed; fix conflicts and then commit the result.');
        return 1;
      }
      var id = identity();
      var sha = makeCommit(m.tree, [ours, theirSha], msg, id.name || 'You', id.email || 'you@example.com');
      moveHead(r, sha, 'merge ' + theirName + ': Merge made by the \'ort\' strategy.');
      say("Merge made by the 'ort' strategy.");
    }
    G.merge = function (a) {
      var r = needRepo(); if (!r) return 1;
      var p = flags(a);
      if (p.f['--abort']) {
        if (!r.merge) return fail('fatal: There is no merge to abort (MERGE_HEAD missing).');
        setWork(r, headTree(r), workTree(r)); r.index = copy(headTree(r)); r.merge = null; return;
      }
      if (r.merge) return fail('error: Merging is not possible because you have unmerged files.');
      if (!p.rest[0]) return fail('fatal: No remote for the current branch.');
      return doMerge(r, resolveRef(r, p.rest[0]), p.rest[0], p.f['--ff-only'], p.f['--no-ff']);
    };
    function replay(r, shas, label) {
      // Apply each commit's change on top of HEAD (cherry-pick / rebase). Stops on the first conflict.
      for (var i = 0; i < shas.length; i++) {
        var c = commit(shas[i]), base = commit(c.parents[0]) ? commit(c.parents[0]).tree : {};
        var m = mergeTrees(base, headTree(r), c.tree, 'HEAD', short(c.sha) + ' (' + c.msg.split('\n')[0] + ')');
        if (m.conflicts.length) return m.conflicts;
        setWork(r, m.tree, headTree(r)); r.index = copy(m.tree);
        var ns = makeCommit(m.tree, [headSha(r)], c.msg, c.author, c.email);
        moveHead(r, ns, label + ': ' + c.msg.split('\n')[0]);
      }
      return null;
    }
    G['cherry-pick'] = function (a) {
      var r = needRepo(); if (!r) return 1;
      var s = resolveRef(r, a[0]); if (!s) return fail('fatal: bad revision \'' + a[0] + '\'');
      var bad = replay(r, [s], 'cherry-pick');
      if (bad) return fail('error: could not apply ' + short(s) + ' (conflict in ' + bad.join(', ') + ').\nThis simulator stops here: resolve the conflict by hand in a real repository.');
      say('[' + (r.HEAD.branch || 'detached HEAD') + ' ' + short(headSha(r)) + '] ' + commit(s).msg.split('\n')[0]);
    };
    G.rebase = function (a) {
      var r = needRepo(); if (!r) return 1;
      var p = flags(a);
      if (p.f['-i'] || p.f['--interactive']) return fail('Interactive rebase opens a to-do list in a text editor. It is explained in lesson 4.1 instead of simulated here.');
      var onto = resolveRef(r, p.rest[0]); if (!onto) return fail('fatal: invalid upstream \'' + p.rest[0] + '\'');
      var me = headSha(r);
      if (isAncestor(me, onto) && me !== onto) { if (!checkoutTree(r, onto)) return 1; moveHead(r, onto, 'rebase (finish)'); say('Successfully rebased and updated refs/heads/' + r.HEAD.branch + '.'); return; }
      if (isAncestor(onto, me)) { say('Current branch ' + r.HEAD.branch + ' is up to date.'); return; }
      var O = ancestors(onto), mine = walk([me]).filter(function (c) { return !O[c.sha] && c.parents.length < 2; }).reverse().map(function (c) { return c.sha; });
      var st = status(r); if (st.staged.length || st.unstaged.length) return fail('error: cannot rebase: You have unstaged changes.\nerror: Please commit or stash them.');
      var saveHead = me, saveIdx = copy(r.index);
      if (!checkoutTree(r, onto)) return 1;
      if (r.HEAD.branch) r.heads[r.HEAD.branch] = onto;
      var bad = replay(r, mine, 'rebase (pick)');
      if (bad) {   // roll back
        setWork(r, commit(saveHead).tree, headTree(r)); r.heads[r.HEAD.branch] = saveHead; r.index = saveIdx;
        return fail('CONFLICT while replaying your commits (' + bad.join(', ') + ').\nThis simulator rolled the rebase back. In real Git you would fix the files, `git add` them and run `git rebase --continue`.');
      }
      say('Successfully rebased and updated refs/heads/' + r.HEAD.branch + '.');
    };
    G.revert = function (a) {
      var r = needRepo(); if (!r) return 1;
      var s = resolveRef(r, a.filter(function (x) { return x[0] !== '-'; })[0]); if (!s) return fail('fatal: bad revision');
      var c = commit(s), parent = commit(c.parents[0]) ? commit(c.parents[0]).tree : {};
      var m = mergeTrees(c.tree, headTree(r), parent, 'HEAD', 'parent of ' + short(s));
      if (m.conflicts.length) return fail('error: could not revert ' + short(s) + ' (conflict in ' + m.conflicts.join(', ') + ')');
      setWork(r, m.tree, headTree(r)); r.index = copy(m.tree);
      var id = identity(), msg = 'Revert "' + c.msg.split('\n')[0] + '"\n\nThis reverts commit ' + c.sha + '.';
      var ns = makeCommit(m.tree, [headSha(r)], msg, id.name || 'You', id.email || 'you@example.com');
      moveHead(r, ns, 'revert: ' + msg.split('\n')[0]);
      say('[' + (r.HEAD.branch || 'detached HEAD') + ' ' + short(ns) + '] ' + msg.split('\n')[0]);
    };
    G.reset = function (a) {
      var r = needRepo(); if (!r) return 1;
      var p = flags(a), refArg = p.rest[0] && resolveRef(r, p.rest[0]) ? p.rest[0] : 'HEAD';
      var paths = p.rest.filter(function (x) { return x !== refArg; });
      if (paths.length && !p.f['--hard'] && !p.f['--soft']) { var ht = headTree(r); pathsIn(r, paths).forEach(function (x) { if (x in ht) r.index[x] = ht[x]; else delete r.index[x]; }); return; }
      var target = resolveRef(r, refArg); if (!target) return fail("fatal: ambiguous argument '" + refArg + "'");
      var before = headTree(r);
      moveHead(r, target, 'reset: moving to ' + refArg);
      if (!p.f['--soft']) r.index = copy(commit(target).tree);
      if (p.f['--hard']) { setWork(r, commit(target).tree, Object.assign({}, before, workTree(r))); keys(workTree(r)).forEach(function (x) { if (!(x in commit(target).tree) && (x in before)) delete W.fs[r.dir + '/' + x]; }); say('HEAD is now at ' + short(target) + ' ' + commit(target).msg.split('\n')[0]); }
      else if (!p.f['--soft']) { var st = status(r); if (st.unstaged.length) { say('Unstaged changes after reset:'); st.unstaged.forEach(function (x) { say(x.k[0].toUpperCase() + '\t' + x.p); }); } }
    };
    G.stash = function (a) {
      var r = needRepo(); if (!r) return 1;
      var sub = a[0] || 'push';
      if (sub === 'list') { r.stash.forEach(function (s, i) { say('stash@{' + i + '}: WIP on ' + s.branch + ': ' + s.msg); }); return; }
      if (sub === 'pop' || sub === 'apply') {
        var s = r.stash[0]; if (!s) return fail('No stash entries found.');
        keys(s.work).forEach(function (x) { if (s.work[x] == null) delete W.fs[r.dir + '/' + x]; else writeFile(r.dir + '/' + x, s.work[x]); });
        keys(s.index).forEach(function (x) { if (s.index[x] == null) delete r.index[x]; else r.index[x] = s.index[x]; });
        G.status([]);   // real Git prints the status first, then the "Dropped" line
        if (sub === 'pop') { r.stash.shift(); say('Dropped refs/stash@{0}'); }
        return;
      }
      if (sub === 'drop') { r.stash.shift(); return; }
      var st = status(r);
      if (!st.staged.length && !st.unstaged.length) { say('No local changes to save'); return; }
      var ht = headTree(r), entry = { branch: r.HEAD.branch, msg: commit(headSha(r)) ? short(headSha(r)) + ' ' + commit(headSha(r)).msg.split('\n')[0] : '', work: {}, index: {} };
      st.staged.concat(st.unstaged).forEach(function (x) { entry.work[x.p] = W.fs[r.dir + '/' + x.p] == null ? null : W.fs[r.dir + '/' + x.p]; entry.index[x.p] = x.p in r.index ? r.index[x.p] : null; });
      r.stash.unshift(entry);
      setWork(r, ht, ht); keys(entry.work).forEach(function (x) { if (!(x in ht)) delete W.fs[r.dir + '/' + x]; });
      r.index = copy(ht);
      say('Saved working directory and index state WIP on ' + entry.branch + ': ' + entry.msg);
    };
    G.tag = function (a) {
      var r = needRepo(); if (!r) return 1;
      var p = flags(a);
      if (p.f['-d']) { delete r.tags[p.rest[0]]; say("Deleted tag '" + p.rest[0] + "'"); return; }
      if (!p.rest[0]) { keys(r.tags).sort().forEach(function (t) { say(t); }); return; }
      if (r.tags[p.rest[0]]) return fail("fatal: tag '" + p.rest[0] + "' already exists");
      var at = resolveRef(r, p.rest[1] || 'HEAD'); if (!at) return fail('fatal: Failed to resolve \'' + (p.rest[1] || 'HEAD') + '\' as a valid ref.');
      r.tags[p.rest[0]] = at;
    };
    G.remote = function (a) {
      var r = needRepo(); if (!r) return 1;
      var p = flags(a);
      if (p.rest[0] === 'add') { if (r.remotes[p.rest[1]]) return fail('error: remote ' + p.rest[1] + ' already exists.'); r.remotes[p.rest[1]] = p.rest[2]; return; }
      if (p.rest[0] === 'remove' || p.rest[0] === 'rm') { delete r.remotes[p.rest[1]]; keys(r.remoteRefs).forEach(function (k) { if (k.indexOf(p.rest[1] + '/') === 0) delete r.remoteRefs[k]; }); return; }
      if (p.rest[0] === 'set-url') { r.remotes[p.rest[1]] = p.rest[2]; return; }
      keys(r.remotes).forEach(function (n) { if (p.f['-v']) say(n + '\t' + r.remotes[n] + ' (fetch)', n + '\t' + r.remotes[n] + ' (push)'); else say(n); });
    };
    function network(url, action) {
      // Common checks for clone/fetch/pull/push. Returns slug or null (after printing the error).
      var slug = slugFromUrl(url);
      if (/^git@/.test(url || '')) {
        var u = S.users[W.me];
        var pub = W.fs[HOME + '/.ssh/id_ed25519.pub'];
        if (!pub || !u || u.keys.map(function (k) { return k.key; }).indexOf(pub.trim()) < 0) { say(['bad', 'git@github.com: Permission denied (publickey).'], 'fatal: Could not read from remote repository.', '', 'Please make sure you have the correct access rights', 'and the repository exists.'); return null; }
      } else if (!W.signedIn) { W.pending = 'gcm'; return null; }
      if (!slug || !S.repos[slug] || can(W.me, slug, 'view') !== true) { say(['bad', 'remote: Repository not found.'], ['bad', "fatal: repository '" + (url || '') + "' not found"]); return null; }
      if (action === 'push') {
        var ok = can(W.me, slug, 'push');
        if (ok === 'archived') { say(['bad', 'remote: This repository was archived so it is read-only.'], ['bad', "fatal: unable to access '" + url + "': The requested URL returned error: 403"]); return null; }
        if (ok !== true) { say(['bad', 'remote: Permission to ' + slug + '.git denied to ' + W.me + '.'], ['bad', "fatal: unable to access '" + url + "': The requested URL returned error: 403"]); return null; }
      }
      return slug;
    }
    function fetchInto(r, remote, slug) {
      var repo = S.repos[slug], upd = [];
      keys(repo.refs).forEach(function (b) { var k = remote + '/' + b; if (r.remoteRefs[k] !== repo.refs[b]) { upd.push([r.remoteRefs[k], repo.refs[b], b]); r.remoteRefs[k] = repo.refs[b]; } });
      keys(r.remoteRefs).forEach(function (k) { if (k.indexOf(remote + '/') === 0 && !repo.refs[k.slice(remote.length + 1)]) delete r.remoteRefs[k]; });
      keys(repo.tags).forEach(function (t) { if (!r.tags[t]) { r.tags[t] = repo.tags[t]; upd.push([null, repo.tags[t], t, 'tag']); } });
      return upd;
    }
    G.clone = function (a) {
      var p = flags(a), url = p.rest[0];
      if (!url) return fail('fatal: You must specify a repository to clone.');
      var slug = network(url, 'clone'); if (!slug) return W.pending ? 0 : 1;
      var dir = abs(p.rest[1] || slug.split('/')[1]);
      if (keys(children(dir)).length || W.fs[dir] != null) return fail("fatal: destination path '" + (p.rest[1] || slug.split('/')[1]) + "' already exists and is not an empty directory.");
      say("Cloning into '" + (p.rest[1] || slug.split('/')[1]) + "'...");
      var repo = S.repos[slug];
      mkdirp(dir);
      var r = newRepo(dir, repo.defaultBranch); r.remotes.origin = url;
      fetchInto(r, 'origin', slug);
      var sha = repo.refs[repo.defaultBranch];
      var n = sha ? keys(ancestors(sha)).length : 0;
      say('remote: Enumerating objects: ' + (n * 3) + ', done.', 'remote: Total ' + (n * 3) + ' (delta 0), reused 0 (delta 0)', 'Receiving objects: 100% (' + (n * 3) + '/' + (n * 3) + '), done.');
      if (sha) { r.heads[repo.defaultBranch] = sha; r.upstream[repo.defaultBranch] = 'origin/' + repo.defaultBranch; setWork(r, commit(sha).tree, {}); r.index = copy(commit(sha).tree); r.reflog.unshift({ sha: sha, msg: 'clone: from ' + url }); }
      else say(['warn', 'warning: You appear to have cloned an empty repository.']);
    };
    G.fetch = function (a) {
      var r = needRepo(); if (!r) return 1;
      var remote = flags(a).rest[0] || 'origin';
      if (!r.remotes[remote]) return fail("fatal: '" + remote + "' does not appear to be a git repository");
      var slug = network(r.remotes[remote], 'fetch'); if (!slug) return W.pending ? 0 : 1;
      var upd = fetchInto(r, remote, slug);
      if (upd.length) say('From ' + r.remotes[remote].replace(/\.git$/, ''));
      upd.forEach(function (u) { say(u[3] === 'tag' ? ' * [new tag]         ' + u[2] + ' -> ' + u[2] : u[0] ? '   ' + short(u[0]) + '..' + short(u[1]) + '  ' + u[2] + ' -> ' + remote + '/' + u[2] : ' * [new branch]      ' + u[2] + ' -> ' + remote + '/' + u[2]); });
    };
    G.pull = function (a) {
      var r = needRepo(); if (!r) return 1;
      var p = flags(a), remote = p.rest[0] || 'origin', b = r.HEAD.branch;
      if (!r.remotes[remote]) return fail('fatal: No remote repository specified.');
      var slug = network(r.remotes[remote], 'fetch'); if (!slug) return W.pending ? 0 : 1;
      fetchInto(r, remote, slug);
      var up = p.rest[1] ? remote + '/' + p.rest[1] : r.upstream[b] || (r.remoteRefs[remote + '/' + b] ? remote + '/' + b : null);
      if (!up) return fail('There is no tracking information for the current branch.\nPlease specify which branch you want to merge with.\n\n    git pull origin <branch>\n\nIf you wish to set tracking information for this branch you can do so with:\n\n    git branch --set-upstream-to=origin/' + b + ' ' + b);
      if (!r.remoteRefs[up]) return fail("fatal: couldn't find remote ref " + up.split('/').slice(1).join('/'));
      say('From ' + r.remotes[remote].replace(/\.git$/, ''));
      if (p.f['--rebase']) return G.rebase([up]);
      return doMerge(r, r.remoteRefs[up], up, p.f['--ff-only']);
    };
    G.push = function (a) {
      var r = needRepo(); if (!r) return 1;
      var p = flags(a), remote = p.rest[0] || 'origin', b = p.rest[1] || r.HEAD.branch, force = p.f['--force'] || p.f['-f'];
      if (!r.remotes[remote]) return fail(keys(r.remotes).length ? "fatal: '" + remote + "' does not appear to be a git repository" : 'fatal: No configured push destination.\nEither specify the URL from the command-line or configure a remote repository using\n\n    git remote add <name> <url>\n\nand then push using the remote name\n\n    git push <name>');
      if (!p.rest[1] && !p.f['-u'] && !p.f['--set-upstream'] && !p.f['--tags'] && !p.f['--delete'] && r.HEAD.branch && !r.upstream[r.HEAD.branch])
        return fail('fatal: The current branch ' + b + ' has no upstream branch.\nTo push the current branch and set the remote as upstream, use\n\n    git push --set-upstream ' + remote + ' ' + b + '\n');
      var url = r.remotes[remote], slug = network(url, 'push'); if (!slug) return W.pending ? 0 : 1;
      var repo = S.repos[slug];
      if (p.f['--tags'] || r.tags[b]) {
        var tagList = p.f['--tags'] ? keys(r.tags) : [b];
        say('To ' + url);
        tagList.forEach(function (t) { if (!repo.tags[t]) { repo.tags[t] = r.tags[t]; say(' * [new tag]         ' + t + ' -> ' + t); } });
        return;
      }
      if (p.f['--delete']) {
        var rl = rulesFor(slug, b, W.me).filter(function (x) { return x.blockDelete; });
        if (rl.length || b === repo.defaultBranch) return fail('remote: error: GH013: Repository rule violations found for refs/heads/' + b + '.\nremote: - Cannot delete this branch\n ! [remote rejected] ' + b + ' (deletion of the default or protected branch is not allowed)');
        delete repo.refs[b]; delete r.remoteRefs[remote + '/' + b]; say('To ' + url, ' - [deleted]         ' + b); return;
      }
      var local = r.heads[b];
      if (!local) return fail("error: src refspec " + b + " does not match any\nerror: failed to push some refs to '" + url + "'");
      var theirs = repo.refs[b];
      if (theirs === local) { say('Everything up-to-date'); if (p.f['-u'] || p.f['--set-upstream']) r.upstream[b] = remote + '/' + b; return; }
      var rules = rulesFor(slug, b, W.me), ff = isAncestor(theirs, local);
      var viol = [];
      rules.forEach(function (x) {
        if (x.requirePR) viol.push('Changes must be made through a pull request.');
        if (x.blockForce && !ff) viol.push('Cannot force-push to this branch');
        if (x.restrictPush && (x.pushers || []).indexOf(W.me) < 0) viol.push('You are not allowed to push to this branch.');
      });
      if (viol.length) {
        say(['bad', 'remote: error: GH013: Repository rule violations found for refs/heads/' + b + '.'], 'remote: Review all repository rules at https://github.com/' + slug + '/rules?ref=refs%2Fheads%2F' + b, 'remote:');
        viol.filter(function (v, i) { return viol.indexOf(v) === i; }).forEach(function (v) { say(['bad', 'remote: - ' + v]); });
        say('remote:', 'To ' + url, ['bad', ' ! [remote rejected] ' + b + ' -> ' + b + ' (push declined due to repository rule violations)'], ['bad', "error: failed to push some refs to '" + url + "'"]);
        return 1;
      }
      if (!ff && !force) {
        say('To ' + url, ['bad', ' ! [rejected]        ' + b + ' -> ' + b + ' (fetch first)'], ['bad', "error: failed to push some refs to '" + url + "'"],
          ['warn', 'hint: Updates were rejected because the remote contains work that you do not'], ['warn', 'hint: have locally. This is usually caused by another repository pushing to'],
          ['warn', "hint: the same ref. If you want to integrate the remote changes, use"], ['warn', "hint: 'git pull' before pushing again."]);
        return 1;
      }
      var n = keys(ancestors(local)).filter(function (s) { return !(theirs && ancestors(theirs)[s]); }).length;
      repo.refs[b] = local; r.remoteRefs[remote + '/' + b] = local;
      if (p.f['-u'] || p.f['--set-upstream']) r.upstream[b] = remote + '/' + b;
      repo.events.push({ type: 'push', branch: b, by: W.me, n: n });
      say('Enumerating objects: ' + (n * 3) + ', done.', 'Writing objects: 100% (' + (n * 3) + '/' + (n * 3) + '), done.', 'To ' + url,
        theirs ? (force && !ff ? ' + ' + short(theirs) + '...' + short(local) + ' ' + b + ' -> ' + b + ' (forced update)' : '   ' + short(theirs) + '..' + short(local) + '  ' + b + ' -> ' + b) : ' * [new branch]      ' + b + ' -> ' + b);
      if (!theirs && b !== repo.defaultBranch) say('remote:', 'remote: Create a pull request for \'' + b + '\' on GitHub by visiting:', 'remote:      https://github.com/' + slug + '/pull/new/' + b, 'remote:');
      if (p.f['-u'] || p.f['--set-upstream']) say("branch '" + b + "' set up to track '" + remote + '/' + b + "'.");
    };
    G.reflog = function () {
      var r = needRepo(); if (!r) return 1;
      r.reflog.forEach(function (e, i) { say([['warn', short(e.sha)], ['', ' HEAD@{' + i + '}: ' + e.msg]]); });
    };
    G['cat-file'] = function (a) {
      var r = needRepo(); if (!r) return 1;
      var p = flags(a), ref = p.rest[0], c = commit(resolveRef(r, ref));
      var treeSha = function (t) { return sha1ish('tree' + JSON.stringify(t)); }, blobSha = function (x) { return sha1ish('blob ' + x); };
      if (c) {
        if (p.f['-t']) { say('commit'); return; }
        say('tree ' + treeSha(c.tree)); c.parents.forEach(function (x) { say('parent ' + x); });
        say('author ' + c.author + ' <' + c.email + '> ' + Math.floor(c.time / 1000) + ' +0300', 'committer ' + c.author + ' <' + c.email + '> ' + Math.floor(c.time / 1000) + ' +0300', '', c.msg);
        return;
      }
      // a tree or blob id from an earlier cat-file
      var found = null;
      keys(W.objects).some(function (s) {
        var t = W.objects[s].tree;
        if (treeSha(t).indexOf(ref) === 0) { found = { t: 'tree', v: t }; return true; }
        return keys(t).some(function (x) { if (blobSha(t[x]).indexOf(ref) === 0) { found = { t: 'blob', v: t[x] }; return true; } });
      });
      if (!found) return fail('fatal: Not a valid object name ' + ref);
      if (p.f['-t']) { say(found.t); return; }
      if (found.t === 'blob') lines(found.v).forEach(function (l) { say(l); });
      else keys(found.v).sort().forEach(function (x) { say('100644 blob ' + blobSha(found.v[x]) + '\t' + x); });
    };

    // ----- shell -----
    var SH = {};
    SH.pwd = function () { say(pretty(W.cwd)); };
    SH.cd = function (a) {
      var d = abs(a[0] || '~');
      if (!W.dirs[d]) return fail('bash: cd: ' + (a[0] || '') + ': No such file or directory');
      W.cwd = d;
    };
    SH.ls = function (a) {
      var p = flags(a), d = abs(p.rest[0] || '.');
      if (W.fs[d] != null) { say(p.rest[0]); return; }
      if (!W.dirs[d]) return fail("ls: cannot access '" + p.rest[0] + "': No such file or directory");
      var ch = children(d), names = keys(ch).sort().filter(function (n) { return p.f['-a'] || p.f['-la'] || p.f['-l'] && false || n[0] !== '.'; });
      if (p.f['-a'] && W.repos[d]) names.unshift('.git');
      if (!names.length) return;
      say(names.map(function (n) { return ch[n] === 'dir' || n === '.git' ? [['info', n + '/']] : [['', n]]; }).reduce(function (acc, x, i) { return acc.concat(i ? [['', '  ']] : [], x); }, []));
    };
    SH.cat = function (a) {
      if (!a.length) return fail('cat: missing file operand');
      for (var i = 0; i < a.length; i++) {
        var f = abs(a[i]);
        if (W.dirs[f]) return fail('cat: ' + a[i] + ': Is a directory');
        if (W.fs[f] == null) return fail('cat: ' + a[i] + ': No such file or directory');
        lines(W.fs[f]).forEach(function (l) { say(l); });
      }
    };
    SH.touch = function (a) { a.forEach(function (x) { var f = abs(x); if (W.fs[f] == null) writeFile(f, ''); }); };
    SH.mkdir = function (a) { var p = flags(a); p.rest.forEach(function (x) { var d = abs(x); if (W.dirs[d] && !p.f['-p']) { say(['bad', "mkdir: cannot create directory '" + x + "': File exists"]); return; } mkdirp(d); }); };
    SH.rm = function (a) {
      var p = flags(a);
      for (var i = 0; i < p.rest.length; i++) {
        var f = abs(p.rest[i]);
        if (W.dirs[f]) { if (!p.f['-r'] && !p.f['-rf'] && !p.f['-f']) return fail("rm: cannot remove '" + p.rest[i] + "': Is a directory"); rmTree(f); continue; }
        if (W.fs[f] == null) return fail("rm: cannot remove '" + p.rest[i] + "': No such file or directory");
        delete W.fs[f];
      }
    };
    SH.echo = function (a) { say(a.join(' ')); };
    SH.history = function () { W.history.forEach(function (h, i) { say(('  ' + (i + 1)).slice(-4) + '  ' + h); }); };
    SH.whoami = function () { say(W.me); };
    SH.code = SH.nano = SH.notepad = SH.vim = function (a) {
      if (!a[0]) return fail('usage: code <file>');
      var f = abs(a[0]); if (W.dirs[f]) return fail(a[0] + ' is a directory');
      W.pendingEdit = f;
    };
    SH['ssh-keygen'] = function (a) {
      var p = flags(a), email = p.f['-C'] || W.config['user.email'] || 'you@example.com';
      var k = 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI' + sha1ish(email + (W.keyN++)).slice(0, 32) + ' ' + email;
      writeFile(HOME + '/.ssh/id_ed25519', '-----BEGIN OPENSSH PRIVATE KEY-----\n(secret: never share or upload this file)\n-----END OPENSSH PRIVATE KEY-----\n');
      writeFile(HOME + '/.ssh/id_ed25519.pub', k + '\n');
      say('Generating public/private ed25519 key pair.', 'Enter file in which to save the key (/home/student/.ssh/id_ed25519): ', 'Enter passphrase (empty for no passphrase): ', 'Your identification has been saved in ~/.ssh/id_ed25519', ['ok', 'Your public key has been saved in ~/.ssh/id_ed25519.pub'], 'The key fingerprint is:', 'SHA256:' + sha1ish(k).slice(0, 43) + ' ' + email);
    };
    SH.ssh = function (a) {
      if (a.indexOf('-T') < 0 || !/git@github\.com/.test(a.join(' '))) return fail('This simulator only supports: ssh -T git@github.com');
      var u = S.users[W.me], pub = W.fs[HOME + '/.ssh/id_ed25519.pub'];
      if (pub && u && u.keys.some(function (k) { return k.key === pub.trim(); })) { say("Hi " + W.me + "! You've successfully authenticated, but GitHub does not provide shell access."); return 1; }
      return fail('git@github.com: Permission denied (publickey).');
    };

    function run1(toks) {
      // One simple command with optional > / >> redirection.
      var redir = null, i = toks.findIndex(function (t) { return t && t.op && (t.op === '>' || t.op === '>>'); });
      if (i >= 0) { redir = { op: toks[i].op, file: toks[i + 1] }; toks = toks.slice(0, i); if (typeof redir.file !== 'string') return fail('bash: syntax error near unexpected token `newline\''); }
      var cmd = toks[0], args = toks.slice(1);
      if (redir) {
        if (cmd !== 'echo' && cmd !== 'printf') return fail('This simulator supports redirection only with echo, e.g. echo "text" > file.txt');
        var f = abs(redir.file), txt = args.join(' ').replace(/\\n/g, '\n') + '\n';
        if (W.dirs[f]) return fail('bash: ' + redir.file + ': Is a directory');
        writeFile(f, redir.op === '>>' ? (W.fs[f] || '') + txt : txt);
        return 0;
      }
      if (cmd === 'git') {
        var sub = args[0];
        if (!sub || sub === '--help' || sub === 'help') { G.help(); return 0; }
        if (sub === '--version' || sub === 'version') { G.version(); return 0; }
        if (sub === '-C') { var save = W.cwd; W.cwd = abs(args[1]); var rc = run1(['git'].concat(args.slice(2))); W.cwd = save; return rc; }
        if (!G[sub] && REAL_GIT.indexOf(sub) >= 0) return fail("This practice terminal does not have 'git " + sub + "'. It is a real Git command: try it on your own computer.");
        if (!G[sub]) return fail("git: '" + sub + "' is not a git command. See 'git --help'.");
        return G[sub](args.slice(1)) || 0;
      }
      if (cmd === 'printf') return SH.echo(args) || 0;
      if (SH[cmd]) return SH[cmd](args) || 0;
      if (cmd === 'help') { G.help(); return 0; }
      return fail(cmd + ': command not found');
    }

    /** Run a command line. Returns {out, code, edit?, prompt?}. */
    W.exec = function (line, quiet) {
      out = [];
      var code = 0;
      line = String(line || '').trim();
      if (!quiet && line) W.history.push(line);
      if (!line) return { out: out, code: 0 };
      if (line === 'clear' || line === 'cls') return { out: [], code: 0, clear: true };
      var toks;
      try { toks = tokenize(line); } catch (e) { return { out: [['bad', 'bash: syntax error: ' + e.message]], code: 2 }; }
      var parts = [[]];
      toks.forEach(function (t) { if (t && t.op === '&&') parts.push([]); else parts[parts.length - 1].push(t); });
      for (var i = 0; i < parts.length; i++) {
        if (!parts[i].length) continue;
        try { code = run1(parts[i]); } catch (e) { console.error(e); say(['bad', 'simulator error: ' + e.message]); code = 1; }
        if (W.pending) break;
        if (code) break;
      }
      var res = { out: out, code: code };
      if (W.pendingEdit) { res.edit = W.pendingEdit; W.pendingEdit = null; }
      if (W.pending) { res.prompt = W.pending; W.pending = null; res.retry = line; }
      W.log.push({ cmd: line, code: code });
      return res;
    };

    // ----- public API for widgets and task checks -----
    W.HOME = HOME; W.abs = abs; W.pretty = pretty; W.writeFile = function (p, t) { writeFile(abs(p), t); }; W.readFile = function (p) { return W.fs[abs(p)]; };
    W.mkdirp = function (p) { mkdirp(abs(p)); }; W.removeFile = function (p) { delete W.fs[abs(p)]; }; W.children = function (p) { return children(abs(p)); };
    W.repo = function (d) { return repoAt(d ? abs(d) : W.cwd); };
    W.status = status; W.headSha = headSha; W.headTree = headTree; W.workTree = workTree; W.commit = commit; W.walk = walk; W.short = short;
    W.resolve = resolveRef; W.decorations = decorations; W.isAncestor = isAncestor; W.fmtTime = fmtTime;
    W.ran = function (re) { return W.log.some(function (l) { return !l.code && (re.test ? re.test(l.cmd) : l.cmd === re); }); };
    W.commitsOn = function (r, b) { var s = r && (b ? r.heads[b] : headSha(r)); return s ? walk([s]) : []; };
    /** A repository the signed-in person creates (web, Desktop Publish): on a personal account only the owner has
     *  access; in an organization the creator becomes Admin of it, as on GitHub (org owners already are). */
    W.createRepo = function (slug, o) {
      var r = makeRemote(slug, o), org = S.orgs[r.owner];
      if (!org) r.collaborators = {}; else if (org.owners.indexOf(W.me) < 0) r.collaborators[W.me] = 'admin';
      return r;
    };
    W.roleOf = roleOf; W.can = can; W.rulesFor = rulesFor; W.makeRemote = makeRemote; W.ensureUser = ensureUser; W.urlOf = urlOf; W.slugFromUrl = slugFromUrl;
    W.ciResult = ciResult; W.openPull = openPull; W.pullChecks = pullChecks; W.mergePull = mergePull; W.webCommit = webCommit; W.makeCommit = makeCommit; W.mergeBase = mergeBase; W.mergeTrees = mergeTrees;
    W.isOrgOwner = isOrgOwner; W.ROLES = ROLES; W.roleRank = roleRank;
    // Each person has their own computer: files, repositories, folder, Git config and sign-in. GitHub (W.server) is shared.
    var LOCAL = ['fs', 'dirs', 'cwd', 'repos', 'config', 'history', 'signedIn'], computers = {};
    W.switchComputer = function (login) {
      if (login === W.me) return;
      var mine = computers[W.me] = {}; LOCAL.forEach(function (k) { mine[k] = W[k]; });
      var next = computers[login], u = W.server.users[login] || { name: login };
      if (!next) {
        next = { fs: {}, dirs: {}, cwd: HOME, repos: {}, history: [], signedIn: true,
          config: { 'user.name': u.name || login, 'user.email': login + '@example.com', 'init.defaultBranch': W.config['init.defaultBranch'] || 'main' } };
        next.dirs['/'] = next.dirs['/home'] = next.dirs[HOME] = 1;
      }
      LOCAL.forEach(function (k) { W[k] = next[k]; });
      W.me = login;
    };
    /** UI action log for task checks: w.event({type:'commit', …}); w.did('commit', e => e.branch === 'main'). */
    W.events = [];
    W.event = function (e) { W.events.push(e); return e; };
    W.did = function (type, pred) { return W.events.some(function (e) { return e.type === type && (!pred || pred(e)); }); };
    W.makeOrg = function (name, o) {
      o = o || {};
      var org = S.orgs[name] = { name: name, displayName: o.displayName || name, owners: o.owners || [], members: o.members || [], outside: o.outside || [],
        teams: o.teams || {}, invites: o.invites || [], audit: [],   // invites: [{login, role: 'member'|'owner'}]
        settings: Object.assign({ basePermission: 'read', membersCanCreate: true, membersCanCreatePublic: false, membersCanDelete: false, membersCanChangeVisibility: false, membersCanFork: false, require2fa: false }, o.settings || {}) };
      org.owners.concat(org.members).forEach(function (u) { ensureUser(u); });
      keys(org.teams).forEach(function (t) { var tm = org.teams[t]; tm.members = tm.members || []; tm.repos = tm.repos || {}; tm.name = tm.name || t; });
      return org;
    };

    // ----- build from config -----
    ensureUser(W.me, cfg.myName || 'Student');
    keys(cfg.users || {}).forEach(function (u) { var x = ensureUser(u, cfg.users[u].name); Object.assign(x, cfg.users[u]); });
    keys(cfg.orgs || {}).forEach(function (o) { W.makeOrg(o, cfg.orgs[o]); });
    keys(cfg.remotes || {}).forEach(function (s) { makeRemote(s, cfg.remotes[s], true); });
    Object.assign(W.config, cfg.config || {});
    keys(cfg.files || {}).forEach(function (p) { writeFile(abs(p), cfg.files[p]); });
    (cfg.dirs || []).forEach(function (d) { mkdirp(abs(d)); });
    if (cfg.cwd) { mkdirp(abs(cfg.cwd)); W.cwd = abs(cfg.cwd); }
    (cfg.run || []).forEach(function (c) { var r = W.exec(c, true); if (r.code && !/CONFLICT/.test(JSON.stringify(r.out))) console.warn('[git sim] setup command failed:', c, r.out); });   // a conflict can be the intended starting state
    W.log = []; W.history = [];
    return W;
  }

  return { world: world, diffLines: diffLines, merge3: merge3, ignoreRules: ignoreRules, isIgnored: isIgnored, tokenize: tokenize, HOME: HOME, ROLES: ROLES };
});
